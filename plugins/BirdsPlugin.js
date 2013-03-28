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
            var layerName = params.layerName;
            var path = gmxCore.getModulePath('BirdsPlugin');
            
            if (!map || !(layerName in map.layers)) {
                return;
            }
            
            var layerID = map.layers[layerName].properties.LayerID;
            var node = $("div[LayerID='" + layerID + "']", _queryMapLayers.buildedTree);
            var addIcon = $('<img/>', {
                'class': 'birds-addbutton', 
                src: path + 'img/birds/add-24.ico',
                title: _gtxt('birdsPlugin.iconTitle')
            }).click(function() {
                if (_queryMapLayers.layerRights(layerName) !== 'edit') {
                    nsGmx.widgets.authWidget.showLoginDialog();
                    return;
                }
                
                $('#flash').addClass('birds-add-mode');
                var mapListenerId = map.addListener('onClick', function(event) {
                    var latlng = event.attr.latlng;
                    var drawingObject = map.drawing.addObject({type: "POINT", coordinates: [latlng.lng, latlng.lat]});
                    
                    var editControl = new nsGmx.EditObjectControl(layerName, null, {
                        drawingObject: drawingObject
                    });
                    
                    $(editControl).bind('close', function() {
                        $('#flash').removeClass('birds-add-mode');
                        map.removeListener('onClick', mapListenerId);
                    })
                })
            }).insertBefore($('.layerDescription', node));
        }
    };
    
    gmxCore.addModule('BirdsPlugin', publicInterface, {css: 'BirdsPlugin.css'});
})();