(function() {

    _translationsHash.addtext("rus", {
        "VectorTiles.iconTitle" : "Показать/Скрыть контура векторных тайлов активного слоя"
    });
    _translationsHash.addtext("eng", {
        "VectorTiles.iconTitle" : "Show/Hide active vector layer tiles bounds"
    });

    var publicInterface = {
        pluginName: 'TileBounds',
        afterViewer: function(params, map) {
            var path = gmxCore.getModulePath('TileBounds');
            var _params = $.extend({
                regularImage: 'active.png',
                activeImage: 'active.png',
                layerName: null
            }, params);
            
            var layerName = _params.layerName;
            
            if ( !map) {
                return;
            }
           
            var cont = null;
            var mapListenerId = null;
            var toolContainer = new map.ToolsContainer('addObject', {style: {padding: '0px'}});
            var tool = toolContainer.addTool('addObject', {
                hint: _gtxt('VectorTiles.iconTitle'),
                regularStyle: {padding: '0px', display: 'list-item'},
                activeStyle: {backgroundColor: 'red'},
                regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
                activeImageUrl:  _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage,
                onClick: function() {
                    function getActiveLayer() {
                        var out = null;
                        var active = $(_queryMapLayers.treeCanvas).find(".active");
                        if (active && active[0] && active[0].parentNode.getAttribute("LayerID") &&
                            active[0].parentNode.gmxProperties.content.properties.type === "Vector")
                        {
                            var activeLayerName = active[0].parentNode.gmxProperties.content.properties.name;
                            var layer = gmxAPI.map.layers[activeLayerName];
                            var dateInterval = layer.getDateInterval();
                            if(dateInterval) {
                                out = {
                                    layerID: activeLayerName
                                    ,TemporalColumnName: layer.properties.TemporalColumnName
                                    ,begDate: dateInterval.beginDate
                                    ,endDate: dateInterval.endDate
                                };
                            }
                        } else if (params.DefaultLayerID) {
                                out = {
                                    layerID: params.DefaultLayerID
                                };
                        }
                        
                        return out;
                    }
                    var testLayerID = null,
                        searchLayerAttr = getActiveLayer();
                    
                    if(searchLayerAttr && searchLayerAttr.layerID) {
                        testLayerID = searchLayerAttr.layerID;
                        var testLayer = gmxAPI.map.layers[testLayerID],
                            temporal = testLayer.properties.Temporal,
                            tiles = testLayer.properties.tiles || null,
                            tilesVers = testLayer.properties.tilesVers || null,
                            files = null;
                    
                        if(temporal) {
                            if(!testLayer.getVisibility()) {
                                testLayer.setVisible(true);
                                testLayer.setVisible(false);
                            }
                            tiles = testLayer._temporalTiles.temporalData.currentData.dtiles;
                            files = testLayer._temporalTiles.temporalData.currentData.tiles;
                        }
                        if(cont) cont.remove();
                        cont = map.addObject();
                        cont.enableHoverBalloon();	
                        cont.setStyle(
                            { outline: { color: 0x0000ff, thickness: 2 }, fill: { color: 0x00ff00, opacity: 20 } },
                            { outline: { color: 0x0000ff, thickness: 3 } }
                        );
                        for (var i = 0, cnt = 0, len = tiles.length; i < len; i+=3) {
                            var x = tiles[i],
                                y = tiles[i+1],
                                z = tiles[i+2];

                            var prop = {
                                x: x,
                                y: y,
                                z: z
                            };
                            if (temporal) {
                                var arr = files[z][x][y] || [];
                                prop.files = [];
                                for (var j = 0, len1 = arr.length; j < len1; j++) {
                                    var src = arr[j],
                                        pos = 3 + src.search(/&v=/),
                                        v = src.substr(pos);
                                    prop.files.push(
                                        '<a href="'
                                        + src
                                        + "&r=t"
                                        + '" target=_blank>'
                                        + 'zxyv:' + z + ':' + x + ':' + y + ':' + v
                                        + '</a>'
                                    );
                                }
                            } else {
                                prop.v = tilesVers[cnt];
                                prop.files = [
                                    '<a href="'
                                    + testLayer.tileSenderPrefix
                                    + '&z=' + z
                                    + "&x=" + x
                                    + "&y=" + y
                                    + "&v=" + prop.v
                                    + "&r=t"
                                    + '" target=_blank>'
                                    + 'zxyv:' + z + ':' + x + ':' + y + ':' + prop.v
                                    + '</a>'
                                ];
                            }
                            cnt++;
                            var obj = cont.addObject(null, prop);
                                bbox = gmxAPI.getTileBounds(prop.z, prop.x, prop.y);
                            obj.setRectangle(bbox.minX, bbox.minY, bbox.maxX, bbox.maxY);
                        }
                    }
                },
                onCancel: function(){
                    if(cont) cont.remove();
                    gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map, {removeAll: true});
                }
            });
        }
    };
    gmxCore.addModule('TileBounds', publicInterface, {});
})();