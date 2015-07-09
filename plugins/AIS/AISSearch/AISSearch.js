(function() {
    var pluginName = 'AISSearch',
        serverScript = 'http://maps.kosmosnimki.ru/VectorLayer/Search.ashx';

    _translationsHash.addtext('rus', {
        'AISSearch.iconTitle' : 'Поиск кораблей по экрану'
    });
    _translationsHash.addtext('eng', {
        'AISSearch.iconTitle' : 'Find ships in polygons'
    });

    var publicInterface = {
        pluginName: pluginName,
        afterViewer: function(params, map) {
            var path = gmxCore.getModulePath(pluginName);
            var _params = $.extend({
                regularImage: 'ship.png',
                activeImage: 'active.png',
                layerName: null
            }, params);
            
            var layerName = _params.layerName;
            
            var gmxLayers,
                lmap, layersByID;
            if (!nsGmx.leafletMap) {    // для старого АПИ
                gmxCore.loadScript('http://maps.kosmosnimki.ru/api/leaflet/plugins/Leaflet-GeoMixer/src/Deferred.js')
                lmap = gmxAPI._leaflet.LMap;
                layersByID = gmxAPI.map.layers;
            } else {
                lmap = nsGmx.leafletMap;
                layersByID = nsGmx.gmxMap.layersByID;
            }

            var aisLayerID = null,
                aisLayer = null,
                tracksLayerID = params.tracksLayerID || '13E2051DFEE04EEF997DC5733BD69A15',
                tracksLayer = null,
                sideBar = new L.Control.gmxSidebar({className: 'aissearch'});
                div = L.DomUtil.create('div', pluginName + '-content'),
                shap = L.DomUtil.create('div', '', div),
                title = L.DomUtil.create('span', '', shap),
                refresh = L.DomUtil.create('i', 'icon-refresh', shap),
                node = null;

            refresh.title = 'Обновить';

            function getActiveLayer() {
                var active = $(_queryMapLayers.treeCanvas).find(".active");
                    
                if (active[0] && active[0].parentNode.getAttribute("LayerID") &&
                    active[0].parentNode.gmxProperties.content.properties.type === "Vector")
                {
                    return active[0].parentNode.gmxProperties.content.properties.name;
                }
                return null;
            }

            function getMMSIoptions() {

                var cont = sideBar.getContainer();
                L.DomEvent.disableScrollPropagation(cont);
                cont.appendChild(div);
                title.innerHTML = 'Поиск кораблей';
                
                aisLayerID = getActiveLayer() || params.aisLayerID || '8EE2C7996800458AAF70BABB43321FA4';    // по умолчанию поиск по слою АИС 
                if (!layersByID[aisLayerID]) {
                    console.log('Отсутствует слой: АИС данные `' + aisLayerID + '`');
                   return;
                }
                aisLayer = layersByID[aisLayerID];
                tracksLayer = layersByID[tracksLayerID];
                var latLngBounds = lmap.getBounds(),
                    sw = latLngBounds.getSouthWest(),
                    ne = latLngBounds.getNorthEast();
                    min = {x: sw.lng, y: sw.lat},
                    max = {x: ne.lng, y: ne.lat},
                    //arr = bounds.toBBoxString().split(','),
                    oCalendar = nsGmx.widgets.getCommonCalendar(),
                    dt1 = oCalendar.getDateBegin(),
                    dt2 = oCalendar.getDateEnd(),
                    prop = (aisLayer._gmx ? aisLayer._gmx : aisLayer).properties,
                    TemporalColumnName = prop.TemporalColumnName,
                    columns = '{"Value":"mmsi"},{"Value":"vessel_name"},{"Value":"count(*)", "Alias":"count"}';

                columns += ',{"Value":"min(STEnvelopeMinX([GeomixerGeoJson]))", "Alias":"xmin"}';
                columns += ',{"Value":"max(STEnvelopeMaxX([GeomixerGeoJson]))", "Alias":"xmax"}';
                columns += ',{"Value":"min(STEnvelopeMinY([GeomixerGeoJson]))", "Alias":"ymin"}';
                columns += ',{"Value":"max(STEnvelopeMaxY([GeomixerGeoJson]))", "Alias":"ymax"}';
                L.DomUtil.addClass(refresh, 'animate-spin');

                var minX = min.x,
                    maxX = max.x,
                    geo = {type: 'Polygon', coordinates: [[[minX, min.y], [minX, max.y], [maxX, max.y], [maxX, min.y], [minX, min.y]]]},
                    w = (maxX - minX) / 2;

                if (w >= 180) {
                    geo = {type: 'Polygon', coordinates: [[[-180, min.y], [-180, max.y], [180, max.y], [180, min.y], [-180, min.y]]]};
                } else if (maxX > 180 || minX < -180) {
                    var center = ((maxX + minX) / 2) % 360;
                    if (center > 180) { center -= 360; }
                    else if (center < -180) { center += 360; }
                    minX = center - w; maxX = center + w;
                    if (minX < -180) {
                        geo = {type: 'MultiPolygon', coordinates: [
                            [[[-180, min.y], [-180, max.y], [maxX, max.y], [maxX, min.y], [-180, min.y]]],
                            [[[minX + 360, min.y], [minX + 360, max.y], [180, max.y], [180, min.y], [minX + 360, min.y]]]
                        ]};
                    } else if (maxX > 180) {
                        geo = {type: 'MultiPolygon', coordinates: [
                            [[[minX, min.y], [minX, max.y], [180, max.y], [180, min.y], [minX, min.y]]],
                            [[[-180, min.y], [-180, max.y], [maxX - 360, max.y], [maxX - 360, min.y], [-180, min.y]]]
                        ]};
                    }
                }

                L.gmxUtil.sendCrossDomainPostRequest(serverScript,
                    {
                        WrapStyle: 'window',
                        border: JSON.stringify(geo),
                        border_cs: 'EPSG:4326',
                        // out_cs: 'EPSG:3395',
                        //pagesize: 100,
                        //orderdirection: 'desc',
                        orderby: 'vessel_name',
                        layer: aisLayerID,
                        columns: '[' + columns + ']',
                        groupby: '[{"Value":"mmsi"},{"Value":"vessel_name"}]',
                        query: "((["+TemporalColumnName+"] >= '" + dt1.toJSON() + "') and (["+TemporalColumnName+"] < '" + dt2.toJSON() + "'))"
                    }
                , function(json) {
                    L.DomUtil.removeClass(refresh, 'animate-spin');
                    if (json && json.Status === 'ok' && json.Result) {
                        var pt = json.Result,
                            fields = pt.fields,
                            indexes = {};
                        fields.map(function(it, i) {
                            indexes[it] = i;
                        });
                        var values = pt.values;
                        if (node && node.parentNode) {
                            node.parentNode.removeChild(node);
                        }
                        if (values.length) {
                            node = L.DomUtil.create('select', pluginName + '-selectItem selectStyle', div);
                            node.setAttribute('size', 15);
                            node.setAttribute('multiple', true);
                            node.onchange = function(ev) {
                                var bbox = null,
                                    filter = [];
                                for (var i = 0, len = node.options.length; i < len; i++) {
                                    var it = node.options[i];
                                    if (it.selected) {
                                        filter.push(Number(it.id));
                                        var varr = values[i];
                                        bbox = [
                                            [varr[5], varr[3]],
                                            [varr[6], varr[4]]
                                        ];
                                    }
                                }
                                lmap.fitBounds(bbox, {maxZoom: 11});
                                if (!nsGmx.leafletMap) {    // для старого АПИ
                                    var st = '(' + filter.join(',') + ')';
                                    if (aisLayer) {
                                        aisLayer.setVisibilityFilter('[mmsi] in ' + st);
                                        aisLayer.setVisible(true);
                                    }
                                    if (tracksLayer) {
                                        tracksLayer.setVisibilityFilter('[MMSI] in ' + st);
                                        tracksLayer.setVisible(true);
                                    }
                                } else {
                                    if (aisLayer) {
                                        aisLayer.setFilter(function(args) {
                                            var mmsi = args.properties[1];
                                            for (var i = 0, len = filter.length; i < len; i++) {
                                                if (mmsi === filter[i]) { return true; }
                                            }
                                            return false;
                                        });
                                        if (!aisLayer._map) {
                                            lmap.addLayer(aisLayer);
                                        }
                                    }
                                }
                            };

                            values.map(function(it) {
                                var val = '(' + it[indexes.count] + ') ' + it[indexes.vessel_name];
                                var opt = L.DomUtil.create('option', '', node);
                                opt.setAttribute('id', it[indexes.mmsi]);
                                opt.text = val.replace(/\s+$/, '');
                                return opt;
                            });
                            title.innerHTML = 'Найдено кораблей: <b>' + values.length + '</b>';
                        } else {
                            title.innerHTML = '<b>Данных не найдено!</b>';
                        }
                    } else {
                        title.innerHTML = '<b>Ошибка при получении данных!</b>';
                    }
                });
            }
            L.DomEvent.on(refresh, 'click', getMMSIoptions, this);

            var icon = new L.Control.gmxIcon({
                id: pluginName, 
                togglable: true,
                regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
                activeImageUrl:  _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage,
                title: _gtxt(pluginName + '.iconTitle')
            }).on('statechange', function(ev) {
                var isActive = ev.target.options.isActive;
                if (isActive) {
                    lmap.addControl(sideBar);
                    getMMSIoptions();
                } else {
                    if (sideBar && sideBar._map) {
                        lmap.removeControl(sideBar);
                    }
                    if (!nsGmx.leafletMap) {    // для старого АПИ
                        if (aisLayer) {
                            aisLayer.setVisibilityFilter('');
                            aisLayer.setVisible(false);
                        }
                        if (tracksLayer) {
                            tracksLayer.setVisibilityFilter('');
                            tracksLayer.setVisible(false);
                        }
                    } else {
                        if (aisLayer) {
                            aisLayer.removeFilter();
                        }
                        if (tracksLayer) {
                            tracksLayer.removeFilter();
                        }
                    }
                }
            });
            lmap.addControl(icon);
        }
    };
    gmxCore.addModule(pluginName, publicInterface, {
        css: pluginName + '.css'
    });
})();