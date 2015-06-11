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
                sideBar;

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
                aisLayerID = getActiveLayer() || params.aisLayerID || '8EE2C7996800458AAF70BABB43321FA4';    // по умолчанию поиск по слою АИС 
                if (!layersByID[aisLayerID]) {
                    console.log('Отсутствует слой: АИС данные `' + aisLayerID + '`');
                   return;
                }
                aisLayer = layersByID[aisLayerID];
                tracksLayer = layersByID[tracksLayerID];
                var bounds = lmap.getBounds(),
                    arr = bounds.toBBoxString().split(','),
                    coords = [
                        [arr[0], arr[1]],
                        [arr[0], arr[3]],
                        [arr[2], arr[3]],
                        [arr[2], arr[1]],
                        [arr[0], arr[1]]
                    ],
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
                L.gmxUtil.sendCrossDomainPostRequest(serverScript,
                    {
                        WrapStyle: 'window',
                        border: JSON.stringify({type: 'Polygon', coordinates: [coords]}),
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
                    if (json && json.Status === 'ok' && json.Result) {
                        var pt = json.Result,
                            fields = pt.fields,
                            indexes = {};
                        fields.map(function(it, i) {
                            indexes[it] = i;
                        });
                        var node = L.DomUtil.create('select', pluginName + '-selectItem selectStyle'),
                            values = pt.values;

                        node.setAttribute('size', 15);
                        node.setAttribute('multiple', true);
                        node.onchange = function(ev) {
                            var bbox = null,
                                filter = [];
                            for (var i = 1, len = node.options.length; i < len; i++) {
                                var it = node.options[i];
                                if (it.selected) {
                                    filter.push(Number(it.id));
                                    var varr = values[i - 1];
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

                        var opt = L.DomUtil.create('option', '', node);
                        opt.text = 'Выбрать корабли';
                        values.map(function(it) {
                            var val = '(' + it[indexes.count] + ') ' + it[indexes.vessel_name];
                            opt = L.DomUtil.create('option', '', node);
                            opt.setAttribute('id', it[indexes.mmsi]);
                            opt.text = val.replace(/\s+$/, '');
                            return opt;
                        });
                        sideBar = new L.Control.gmxSidebar({className: 'aissearch'});
                        lmap.addControl(sideBar);
                        var cont = sideBar.getContainer();
                        L.DomEvent.disableScrollPropagation(cont);
                        cont.appendChild(node);
                    }
                });
            }

            var icon = new L.Control.gmxIcon({
                id: pluginName, 
                togglable: true,
                regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
                activeImageUrl:  _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage,
                title: _gtxt(pluginName + '.iconTitle')
            }).on('statechange', function(ev) {
                var isActive = ev.target.options.isActive;
                if (isActive) {
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