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
                    var listenerId = globalFlashMap.layers[iL].addListener('onClick', function(attr)
                    {
                        var obj = attr.obj;
                        var layer = obj.parent;
                        var id = obj.properties[layer.properties.identityField];
						new nsGmx.EditObjectControl(layer.properties.name, id);
						return true;	// Отключить дальнейшую обработку события
                    });
                    listeners.push({layerName: globalFlashMap.layers[iL].properties.name, listenerId: listenerId});
                }
            }
            , function()
            {
                for (var i = 0; i < listeners.length; i++) {
                    var pt = listeners[i];
                    var layer = globalFlashMap.layers[pt['layerName']];
                    layer.removeListener('onClick', pt['listenerId']);
				}
				listeners = [];
            }
        )
    }
}

gmxCore.addModule('EditObjectPlugin', publicInterface);

})(jQuery);