(function ($){

_translationsHash.addtext("rus", {
							"EditObjectPlugin.menuTitle" : "Добавить объект",
							"EditObjectPlugin.drawingMenuTitle" : "Добавить объект в активный слой"
						 });
						 
_translationsHash.addtext("eng", {
							"EditObjectPlugin.menuTitle" : "Add object",
							"EditObjectPlugin.drawingMenuTitle" : "Add object to active layer"
						 });
 
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
        
        //добавляем пункт меню к нарисованным объектам
        nsGmx.ContextMenuController.addContextMenuElem({
            title: _gtxt("EditObjectPlugin.drawingMenuTitle"),
            isVisible: function(context)
            {
                var active = $(_queryMapLayers.treeCanvas).find(".active");
                
                //должен быть векторный слой
                if ( !active[0] || !active[0].parentNode.getAttribute("LayerID") ||
                     !active[0].parentNode.gmxProperties.content.properties.type === "Vector")
                {
                    return false;
                }
                
                //TODO: проверить тип геометрии
                
                var layer = globalFlashMap.layers[active[0].parentNode.gmxProperties.content.properties.name];
                
                //слой поддерживает редактирование и у нас есть права на это
                return 'tilesVers' in layer.properties && _queryMapLayers.layerRights(layer.properties.name) == 'edit';
            },
            clickCallback: function(context)
            {
                var active = $(_queryMapLayers.treeCanvas).find(".active");
                var layer = globalFlashMap.layers[active[0].parentNode.gmxProperties.content.properties.name];
                new nsGmx.EditObjectControl(layer.properties.name, null, {drawingObject: context.obj});
            }
        }, 'DrawingObject');
        
        //добавляем пункт меню ко всем слоям
        nsGmx.ContextMenuController.addContextMenuElem({
            title: _gtxt("EditObjectPlugin.menuTitle"),
            isVisible: function(context)
            {
                var layer = globalFlashMap.layers[context.elem.name];
                return !context.layerManagerFlag && 
                       layer.properties.type === 'Vector' &&
                       'tilesVers' in layer.properties && 
                       _queryMapLayers.layerRights(layer.properties.name) == 'edit';
            },
            clickCallback: function(context)
            {
                new nsGmx.EditObjectControl(context.elem.name);
            }
        }, 'Layer');
        
        //добавляем тул в тублар карты
        var listeners = [];
        var pluginPath = gmxCore.getModulePath('EditObjectPlugin');
        globalFlashMap.drawing.addTool('editTool'
            , _gtxt("Редактировать")
            , 'img/project_tool.png'
            , 'img/project_tool_a.png'
            , function()
            {
                for (var iL = 0; iL < globalFlashMap.layers.length; iL++)
                {
                    var layer = globalFlashMap.layers[iL];
                    if (layer.properties.type === 'Vector' && 'tilesVers' in layer.properties && _queryMapLayers.layerRights(layer.properties.name) == 'edit')
                    {
                        var listenerId = layer.addListener('onClick', function(attr)
                        {
                            var obj = attr.obj;
                            var layer = attr.attr.layer;
                            var id = obj.properties[layer.properties.identityField];
                            new nsGmx.EditObjectControl(layer.properties.name, id);
                            return true;	// Отключить дальнейшую обработку события
                        });
                        listeners.push({layerName: layer.properties.name, listenerId: listenerId});
                    }
                }
            }
            , function()
            {
                for (var i = 0; i < listeners.length; i++) {
                    var pt = listeners[i];
                    var layer = globalFlashMap.layers[pt['layerName']];
                    layer && layer.removeListener('onClick', pt['listenerId']);
				}
				listeners = [];
            }
        )
    }
}

gmxCore.addModule('EditObjectPlugin', publicInterface);

})(jQuery);