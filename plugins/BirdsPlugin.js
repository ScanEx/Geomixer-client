(function() {

    _translationsHash.addtext("rus", {
        "birdsPlugin.iconTitle" : "Добавить новый объект"
    });
    _translationsHash.addtext("eng", {
        "birdsPlugin.iconTitle" : "Add new object"
    });

    var publicInterface = {
        pluginName: 'Birds',
        afterViewer: function(params, map) {
            var path = gmxCore.getModulePath('BirdsPlugin');
            var _params = $.extend({
                regularImage: 'img/birds/add-24.ico',
                activeImage: 'img/birds/add-24.ico',
                layerName: null
            }, params);
            
            var layerName = _params.layerName;
            
            if ( !map) {
                return;
            }
            
            var mapListenerId = null;
            var toolContainer = new map.ToolsContainer('addObject');
            var tool = toolContainer.addTool('addObject', {
                hint: _gtxt('birdsPlugin.iconTitle'),
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
            
                    if (_queryMapLayers.layerRights(activeLayer) !== 'edit') {
                        nsGmx.widgets.authWidget.showLoginDialog();
                        return;
                    }
                    
                    if (!activeLayer) {
                        return;
                    }
                    
                    $('#flash').addClass('birds-add-mode');
                    mapListenerId = map.addListener('onClick', function(event) {
                        var latlng = event.attr.latlng;
                        var drawingObject = map.drawing.addObject({type: "POINT", coordinates: [latlng.lng, latlng.lat]});
                        
                        var editControl = new nsGmx.EditObjectControl(activeLayer, null, {
                            drawingObject: drawingObject
                        });
                    })
                },
                onCancel: function(){
                    $('#flash').removeClass('birds-add-mode');
                    mapListenerId && map.removeListener('onClick', mapListenerId);
                }
            })
        }
    };
    
    gmxCore.addModule('BirdsPlugin', publicInterface, {css: 'BirdsPlugin.css'});
})();