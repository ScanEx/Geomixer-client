(function() {
    _translationsHash.addtext("rus", {
        "VectorTiles.iconTitle" : "Показать/Скрыть контура векторных тайлов активного слоя"
    });
    _translationsHash.addtext("eng", {
        "VectorTiles.iconTitle" : "Show/Hide active vector layer tiles bounds"
    });
    function getActiveLayerID(params) {
        var out = null;
        var active = $(_queryMapLayers.treeCanvas).find(".active");
        if (active && active[0] && active[0].parentNode.getAttribute("LayerID")) {
            // active[0].parentNode.gmxProperties.content.properties.type === "Vector")
        // {
            out = active[0].parentNode.gmxProperties.content.properties.name;
        } else if (params.DefaultLayerID) {
            out = params.DefaultLayerID;
        }
        
        return out;
    }

    var publicInterface = {
        pluginName: 'TileBounds',
        afterViewer: function(params, map) {
            var path = gmxCore.getModulePath('TileBounds');
            var _params = $.extend({
                regularImage: 'active.png',
                activeImage: 'active.png',
                layerName: null
            }, params);

            var LMap = nsGmx.leafletMap,
                featureGroup = L.featureGroup();

            var tileSenderPrefix = 'http://maps.kosmosnimki.ru/TileSender.ashx?WrapStyle=func&key=&ModeKey=tile&r=j',
                testLayer = null;
                tileKeyBboxHash = {};
            function popupFunc(ev) {
                var layer = ev.layer,
                    popup = ev.popup,
                    opt = layer.options,
                    layerID = opt.layerID,
                    tileKey = opt.tileKey,
                    title = 'Граница слоя';

                if (tileKey) {
                    title = tileKey;
                    var arr = tileKey.split('_'),
                        url = tileSenderPrefix +
                            '&LayerName=' + layerID +
                            '&z=' + arr[0] +
                            '&x=' + arr[1] +
                            '&y=' + arr[2] +
                            '&v=' + arr[3];

                    if (arr[4] > 0) {
                        url += '&Level=' + arr[5] + '&Span=' + arr[4];
                    }
                }
                var tile = testLayer._gmx.dataManager._tiles[tileKey].tile;
                var content = L.DomUtil.create('div', 'TileBounds-popup-wrapper'),
                    titleDiv = L.DomUtil.create('div', 'TileBounds-popup-title', content),
                    link = L.DomUtil.create('div', 'TileBounds-popup-link', content),
                    linkHref = L.DomUtil.create('a', 'TileBounds-popup-href', link),
                    showBbox = L.DomUtil.create('button', 'TileBounds-popup-bbox', content),
                    objCount = L.DomUtil.create('div', 'TileBounds-popup-count', content);
                    
                objCount.innerHTML = (tile.isGeneralized ? '<br>Генерализованный' : '') +
                    '<br>Объектов: <b>' + (tile.data ? tile.data.length : 0) + '</b>';
                titleDiv.innerHTML = title;
                linkHref.target = '_blank';
                linkHref.href = url;
                linkHref.innerHTML = 'zxyv:' + tileKey;
                showBbox.innerHTML = 'Показать/Скрыть BBOX';
                showBbox.onclick = function(ev) {
                    if (tileKeyBboxHash[tileKey]) {
                        featureGroup.removeLayer(tileKeyBboxHash[tileKey]);
                        tileKeyBboxHash[tileKey] = null;
                    } else {
                        tile.load().then(function() {
                            objCount.innerHTML = '<br>Объектов: <b>' + tile.data.length + '</b>';
                            if (tile.bbox) {
                                var proj = L.Projection.Mercator,
                                    latLngBounds = L.latLngBounds([
                                        proj.unproject({x: tile.bbox[0], y: tile.bbox[1]}),
                                        proj.unproject({x: tile.bbox[2], y: tile.bbox[3]})
                                    ]);
                                if (tile.data.length > 1) {
                                    obj = L.rectangle(latLngBounds, {color: "#ff0000", weight: 1, pointerEvents: 'none'});
                                } else {
                                    obj = L.marker(latLngBounds.getSouthWest());
                                }
                                tileKeyBboxHash[tileKey] = obj.addTo(featureGroup);
                            }
                        });
                    }
                    
                };
                popup.setContent(content);
            };

            featureGroup.bindPopup('temp', {maxWidth: 170});
            featureGroup.on('popupopen', popupFunc, featureGroup);
            featureGroup.addTo(LMap);
            var tileIcon = L.control.gmxIcon({
                    id: 'tileIcon', 
                    togglable: true,
                    className: 'leaflet-gmx-icon-sprite',
                    regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
                    activeImageUrl:  _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage,
                    title: _gtxt('VectorTiles.iconTitle')
                }).on('statechange', function(ev) {
                    var control = ev.target,
                        testLayerID = null;
                    if (control.options.isActive) {
                        var layerID = getActiveLayerID(params);
                        testLayer = nsGmx.gmxMap.layersByID[layerID];
                        if (testLayer) {
							var drawTile = function (tile) {
								var latLngBounds = L.latLngBounds(
										L.Projection.Mercator.unproject(tile.bounds.min),
										L.Projection.Mercator.unproject(tile.bounds.max)
									),
									isGeneralized = tile.isGeneralized;
								L.rectangle(latLngBounds,
									{
										layerID: layerID,
										tileKey: key,
										color: isGeneralized ? '#ff0000' : 'gray',
										dashArray: isGeneralized ? [2, 10] : null,
										fillColor: isGeneralized ? '#ff7800' : '#ff78ff',
										weight: 2
									}).addTo(featureGroup);
							};
                            var dm = testLayer._gmx.dataManager,
								flag = testLayer.options.isGeneralized && !dm.options.needBbox,
                                activeTileKeys = dm._getActiveTileKeys(),
                                z;
							if (flag) {
                                var zoom = LMap.getZoom(),
                                z = zoom + (zoom % 2 ? 1 : 0);
							}
                            for (var key in activeTileKeys) {
                                var tile = dm._tiles[key].tile;

                                if (flag && (tile.z > z || (tile.isGeneralized && tile.z !== z))) {
									continue;
								}
								drawTile(tile);
                            }
                            var geoJson = L.geoJson(L.gmxUtil.geometryToGeoJSON(testLayer._gmx.geometry, true), {
                                style: function (feature) {
                                    return { color: '#0000FF', weight: 4, opacity: 1, fill: false };
                                }
                            })
                            .addTo(featureGroup);
                        }
                    } else {
                        featureGroup.clearLayers();
                        LMap.closePopup();
                    }
                });
            LMap.addControl(tileIcon);
        }
    };
    gmxCore.addModule('TileBounds', publicInterface, {});
})();
