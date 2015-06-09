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

            var aisLayerID = params.aisLayerID || '8EE2C7996800458AAF70BABB43321FA4',
                aisLayer = layersByID[aisLayerID],
                tracksLayerID = params.tracksLayerID || '13E2051DFEE04EEF997DC5733BD69A15',
                tracksLayer = layersByID[tracksLayerID],
                sideBar;

            function getMMSIoptions() {
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
                    TemporalColumnName = prop.TemporalColumnName;

                L.gmxUtil.requestJSONP(serverScript,
                    {
                        WrapStyle: 'func',
                        border: JSON.stringify({type: 'Polygon', coordinates: [coords]}),
                        border_cs: 'EPSG:4326',
                        //pagesize: 100,
                        orderby: 'vessel_name',
                        //orderdirection: 'desc',
                        layer: aisLayerID,
                        columns: '[{"Value":"mmsi"},{"Value":"vessel_name"},{"Value":"count(*)", "Alias":"count"}]',
                        groupby: '[{"Value":"mmsi"},{"Value":"vessel_name"}]',
                        query: "((["+TemporalColumnName+"] >= '" + dt1.toJSON() + "') and (["+TemporalColumnName+"] < '" + dt2.toJSON() + "'))"
                    }
                ).then(function(json) {
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
                            var filter = [];
                            for (var i = 0, len = node.options.length; i < len; i++) {
                                var it = node.options[i];
                                if (it.selected) {
                                    filter.push(it.id);
                                }
                            }
                            var st = '(' + filter.join(',') + ')';
//console.log(sql);
                            if (aisLayer) {
                                aisLayer.setVisibilityFilter('[mmsi] in ' + st);
                                aisLayer.setVisible(true);
                            }
                            if (tracksLayer) {
                                tracksLayer.setVisibilityFilter('[MMSI] in ' + st);
                                tracksLayer.setVisible(true);
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
                    if (!layersByID[aisLayerID]) {
                        console.log('Отсутствует слой: АИС данные `' + aisLayerID + '`');
                    } else {
                        getMMSIoptions();
                    }
                } else {
                    if (sideBar && sideBar._map) {
                        lmap.removeControl(sideBar);
                    }
                    if (aisLayer) {
                        aisLayer.setVisibilityFilter('');
                        aisLayer.setVisible(false);
                    }
                    if (tracksLayer) {
                        tracksLayer.setVisibilityFilter('');
                        tracksLayer.setVisible(false);
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