(function() {

    _translationsHash.addtext("rus", {
        "add2MapPlugin.iconTitle" : "Добавить новый объект"
    });
    _translationsHash.addtext("eng", {
        "add2MapPlugin.iconTitle" : "Add new object"
    });

    var publicInterface = {
        pluginName: 'Add2Map',
        afterViewer: function(params, map) {
            var path = gmxCore.getModulePath('Add2MapPlugin');
            var _params = $.extend({
                regularImage: 'img/add2map/add-24.ico',
                activeImage: 'img/add2map/add-24.ico',
                layerName: null
            }, params);
            
            var layerName = _params.layerName;
            
            if ( !map) {
                return;
            }
            
            var mapListenerId = null;
            var toolContainer = new map.ToolsContainer('addObject');
            var tool = toolContainer.addTool('addObject', {
                hint: _gtxt('add2MapPlugin.iconTitle'),
                regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
                activeImageUrl:  _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage,
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
                    
                    $('#flash').addClass('add2map-mode');
                    mapListenerId = map.addListener('onClick', function(event) {
                    
                        $('#flash').removeClass('add2map-mode');
                        map.removeListener('onClick', mapListenerId);
                        tool.onCancel();
                    
                        var latlng = event.attr.latlng;
                        var drawingObject = map.drawing.addObject({type: "POINT", coordinates: [latlng.lng, latlng.lat]});
                        
                        var editControl = new nsGmx.EditObjectControl(activeLayer, null, {
                            drawingObject: drawingObject
                        });
                    })
                },
                onCancel: function(){
                }
            })
        }
    };
    
    gmxCore.addModule('Add2MapPlugin', publicInterface, {css: 'Add2MapPlugin.css'});
})();