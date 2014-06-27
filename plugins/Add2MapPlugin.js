(function() {

    _translationsHash.addtext("rus", {
        "add2MapPlugin.iconTitle" : "Добавить новый объект"
    });
    _translationsHash.addtext("eng", {
        "add2MapPlugin.iconTitle" : "Add new object"
    });
    
    var DEFAULT_ICON = 'img/add2map/add-24.ico';
    
    var parseParams = function(params) {
        var res = null;
        for (var p in params) {
            var m = p.match(/(regularImage|activeImage|layerName)(.*)/);
            if (!m) continue;
            
            var id = 'id' + m[2];
            
            res = res || {};
            res[id] = res[id] || {};
            res[id][m[1]] = params[p];
        }
        
        return res || { 'id': {
            regularImage: DEFAULT_ICON
        }};
    }

    var publicInterface = {
        pluginName: 'Add2Map',
        afterViewer: function(params, map) {
            
            if (!map) {return;}
            
            var path = gmxCore.getModulePath('Add2MapPlugin');
            
            var parsedParams = parseParams(params);
            $.each(parsedParams, function(id, toolParams) {
                console.log(toolParams);
                var layerName = toolParams.layerName;
                
                var regularImage = toolParams.regularImage || DEFAULT_ICON;
                var activeImage = toolParams.activeImage || regularImage;
                
                var mapListenerId = null;
                var toolContainer = new map.ToolsContainer('addObject');
                var tool = toolContainer.addTool('addObject', {
                    hint: _gtxt('add2MapPlugin.iconTitle'),
                    regularImageUrl: regularImage.search(/^https?:\/\//) !== -1 ? regularImage : path + regularImage,
                    activeImageUrl:  activeImage.search(/^https?:\/\//) !== -1 ? activeImage : path + activeImage,
                    onClick: function() {
                    
                        var activeLayer = layerName;
                        var active = $(_queryMapLayers.treeCanvas).find(".active");
                        
                        if (!activeLayer && active[0] && active[0].parentNode.getAttribute("LayerID") &&
                            active[0].parentNode.gmxProperties.content.properties.type === "Vector")
                        {
                            activeLayer = active[0].parentNode.gmxProperties.content.properties.name;
                        }
                        
                        if (!activeLayer) {
                            return;
                        }
                        
                        if (_queryMapLayers.layerRights(activeLayer) !== 'edit') {
                            nsGmx.widgets.authWidget.showLoginDialog();
                            return;
                        }
                        
                        var toolName = map.layers[activeLayer].properties.GeometryType.toUpperCase();
                        map.drawing.selectTool(toolName);
                        
                        if (mapListenerId === null) {
                            mapListenerId = map.drawing.addListener('onFinish', function(obj) {
                                map.drawing.removeListener('onFinish', mapListenerId);
                                mapListenerId = null;
                                tool.setActive();
                                
                                var editControl = new nsGmx.EditObjectControl(activeLayer, null, {
                                    drawingObject: obj
                                });
                            })
                        }
                    },
                    onCancel: function(){
                        map.drawing.selectTool('move');
                    }
                })
            })
        }
    };
    
    gmxCore.addModule('Add2MapPlugin', publicInterface, {css: 'Add2MapPlugin.css'});
})();