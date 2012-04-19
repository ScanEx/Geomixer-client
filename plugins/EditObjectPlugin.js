(function ($){
 
var publicInterface = {
	afterViewer: function()
    {
        var hasEditableLayer = false;
        for (var iL = 0; iL < globalFlashMap.layers.length; iL++)
            if (_queryMapLayers.layerRights(globalFlashMap.layers[iL].properties.name) == 'edit')
            {
                hasEditableLayer = true;
                break;
            }
            
        if (!hasEditableLayer) return;
        
        var listeners = [];
        var pluginPath = gmxCore.getModulePath('EditObjectPlugin');
        globalFlashMap.drawing.addTool('editTool'
            , _gtxt("Редактировать")
            , 'img/project_tool.png'
            , 'img/project_tool_a.png'
            , function()
            {
                for (var iL = 0; iL < globalFlashMap.layers.length; iL++)
                if (_queryMapLayers.layerRights(globalFlashMap.layers[iL].properties.name) == 'edit')
                {
                    // var listenerId = globalFlashMap.layers[iL].addListener('onClick', function(obj)
                    globalFlashMap.layers[iL].setHandler('onClick', function(obj)
                    {
                        var layer = obj.parent;
                        var id = obj.properties[layer.properties.identityField];
                        new nsGmx.EditObjectControl(layer.properties.name, id);
                    });
                    
                    // listeners.push({layerName: globalFlashMap.layers[iL].properties.name, listenerId: listenerId});
                    listeners.push({layerName: globalFlashMap.layers[iL].properties.name});
                }
            }
            , function()
            {
                
            }
        )
    }
}

gmxCore.addModule('EditObjectPlugin', publicInterface);

})(jQuery);