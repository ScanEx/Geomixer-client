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

    var tileSenderPrefix = 'http://maps.kosmosnimki.ru/TileSender.ashx?WrapStyle=None&key=&ModeKey=tile&r=j';
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
        var str = '<span style="font-size:14px; font-weight:bold; color:#000;">' + title + '</span><br/>';
        if (tileKey) {
            str += '<table style="width:375px;"><tbody>';
            str += '<tr><td><a href="' + url + '" target=_blank>zxyv:' + tileKey + '</a></td></tr>';
        }
        str += '</table></tbody>';
        popup.setContent(str);
    };

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

            featureGroup.bindPopup('temp', {maxWidth: 170});
            featureGroup.on('popupopen', popupFunc, featureGroup);
            featureGroup.addTo(LMap);
            var tileIcon = new L.Control.gmxIcon({
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
                        var layerID = getActiveLayerID(params),
                            testLayer = gmxAPI.layersByID[layerID];
                        if (testLayer) {
                            var geo = testLayer._gmx.geometry,
                                dm = testLayer._gmx.dataManager,
                                activeTileKeys = dm._getActiveTileKeys();
                                
                            for (var key in activeTileKeys) {
                                var bounds = dm._tiles[key].tile.bounds;
                                var latLngBounds = L.latLngBounds(
                                    L.Projection.Mercator.unproject(bounds.min),
                                    L.Projection.Mercator.unproject(bounds.max)
                                    );
                                L.rectangle(latLngBounds,
                                    {
                                        layerID: layerID,
                                        tileKey: key,
                                        color: "#ff7800",
                                        weight: 2
                                    }).addTo(featureGroup);
                            }
                            var geoJson = L.geoJson(L.gmxUtil.geometryToGeoJSON(geo, true), {
                                style: function (feature) {
                                    return { color: '#0000FF', weight: 4, opacity: 1, fill: false };
                                }
                            })
                            .addTo(featureGroup);
                        }
                    } else {
                        featureGroup.clearLayers();
                    }
                });
            LMap.addControl(tileIcon);
        }
    };
    gmxCore.addModule('TileBounds', publicInterface, {});
})();