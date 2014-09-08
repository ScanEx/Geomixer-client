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
                        }
                        return out;
                    }
                    var testLayerID = null,
                        searchLayerAttr = getActiveLayer();
                    if(searchLayerAttr && searchLayerAttr.layerID) {
                        testLayerID = searchLayerAttr.layerID;
                        var testLayer = gmxAPI.map.layers[testLayerID],
                            temporal = testLayer.properties.Temporal,
                            tiles = testLayer.properties.tiles || null;
                    
                        if(temporal) {
                            tiles = testLayer._temporalTiles.temporalData.currentData.dtiles;
                        }
                        if(cont) cont.remove();
                        cont = map.addObject();
                        cont.enableHoverBalloon();	
                        cont.setStyle(
                            { outline: { color: 0x0000ff, thickness: 2 }, fill: { color: 0x00ff00, opacity: 20 } },
                            { outline: { color: 0x0000ff, thickness: 3 } }
                        );
                        for (var i = 0, len = tiles.length; i < len; i+=3) {
                            var x = tiles[i],
                                y = tiles[i+1],
                                z = tiles[i+2],
                                bbox = gmxAPI.getTileBounds(z, x, y);
                            var obj = cont.addObject(null, {z: z, x: x, y: y});
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