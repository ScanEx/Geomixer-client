(function ($){
 
var publicInterface = {
	afterViewer: function()
    {
        var listeners = [];
        var pluginPath = gmxCore.getModulePath('EditObjectPlugin');
        globalFlashMap.drawing.addTool('editTool'
            , _gtxt("Редактировать")
            , 'img/edit.png'
            , 'img/edit.png'
            , function()
            {
                for (var iL = 0; iL < globalFlashMap.layers.length; iL++)
                {
                    globalFlashMap.layers[iL].setHandler('onClick', function(obj)
                    {
                        var layer = obj.parent;
                        var id = obj.properties[layer.properties.identityField];
                        new nsGmx.EditObjectControl(layer.properties.name, id);
                    });
                    
                    //listeners.push({layerName: globalFlashMap.layers[iL].properties.name, listenerId: listenerId});
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