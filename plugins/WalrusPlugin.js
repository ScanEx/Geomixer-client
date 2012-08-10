(function ($, map){

var g_tagMetaInfo = null;

_translationsHash.addtext("rus", {
    'walrusPlugin.menuTitle': 'Добавить новый снимок'
});

_translationsHash.addtext("eng", {
    'walrusPlugin.menuTitle': 'Add new image'
});

var doAddLayerWithProperties = function(targetLayerName, layerInfo)
{
    var layerDate = layerInfo.properties.MetaProperties.acdate.Value;
    var geom = layerInfo.geometry;
    
    var obj = {
        action: 'insert',
        geometry: geom,
        properties: {
            LayerName: layerInfo.properties.name,
            acdate: layerDate
        }
    };
    
    var objects = JSON.stringify([obj]);
    
    sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", 
        {
            WrapStyle: 'window', 
            LayerName: targetLayerName,
            objects: objects
        }, 
        function(response)
        {
            if (!parseResponse(response))
                return;
                
            console.log('added');
        }
    )
}

var doAddLayer = function(targetLayer, newLayer)
{
    var newLayerName = newLayer.name;
    var testQuery = 'LayerName="' + newLayerName + '"'
    sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&count=true" + "&layer=" + targetLayer.name + "&query=" + encodeURIComponent(testQuery), function(response)
    {
        if (!parseResponse(response))
            return;
            
        if (response.Result > 0)
        {
            alert('Такой слой уже есть');
            return;
        }
        
        sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerJson.ashx?WrapStyle=func&LayerName=" + newLayerName, function(response)
        {
            if (!parseResponse(response))
                return;
                
            doAddLayerWithProperties(targetLayer.name, response.Result);
        })
    })
}

var publicInterface = {
	afterViewer: function(params)
    {
        nsGmx.ContextMenuController.addContextMenuElem({
            title: _gtxt("walrusPlugin.menuTitle"),
            isVisible: function(context)
            {
                var layer = globalFlashMap.layers[context.elem.name];
                return !context.layerManagerFlag && 
                       layer.properties.type === 'Vector';
            },
            clickCallback: function(context)
            {
                var layerManagerCanvas = _div();
                var newLayerCanvas = _div(null, [['css', 'marginTop', '10px']]);
                var suggestLayersControl = new nsGmx.LayerManagerControl(layerManagerCanvas, 'addimage', {
                    fixType: 'raster', 
                    enableDragging: false,
                    onclick: function(clickContext) { doAddLayer(context.elem, clickContext.elem);}
                });
                
                var newLayerRadio = $('<input/>', {'class': 'walrus-radio', type: 'radio', id: 'addNewLayer', name: 'newLayer'}).click(function()
                {
                    $(layerManagerCanvas).hide();
                    $(newLayerCanvas).show();
                    
                });
                
                var existLayerRadio = $('<input/>', {'class': 'walrus-radio', type: 'radio', id: 'addExistingLayer', name: 'newLayer', checked: true}).click(function()
                {
                    $(layerManagerCanvas).show();
                    $(newLayerCanvas).hide();
                });
                
                $(newLayerCanvas).hide();
                
                var properties = {Title:'', Description: '', Date: '', TilePath: {Path:''}, ShapePath: {Path:''}};
                
                var initNewLayerCanvas = function()
                {
                    $(newLayerCanvas).empty();
                    _mapHelper.createLayerEditorProperties(false, 'Raster', newLayerCanvas, properties, 
                        {
                            addToMap: false, 
                            doneCallback: function(task)
                            {
                                initNewLayerCanvas();
                                task.deferred.done(function(taskInfo)
                                {
                                    doAddLayerWithProperties(context.elem.name, taskInfo.Result);
                                })
                            }
                        }
                    );
                }
                initNewLayerCanvas();
                
                var canvas = $('<div/>')
                    .append($('<table/>', {'class': 'walrus-switchcontainer'}).append($('<tr/>')
                        .append($('<td/>').append(existLayerRadio))
                        .append($('<td/>').append($('<label/>', {'class': 'walrus-label', type: 'radio', 'for': 'addExistingLayer'}).text('Выбрать существующий')))
                        .append($('<td/>').append(newLayerRadio))
                        .append($('<td/>').append($('<label/>', {'class': 'walrus-label', type: 'radio', 'for': 'addNewLayer'}).text('Создать новый')))
                    ))
                    .append(layerManagerCanvas)
                    .append(newLayerCanvas);
                
                showDialog('Выбор снимка', canvas[0], {width: 600, height: 600});
            }
        }, 'Layer');
    }
}

gmxCore.addModule("WalrusPlugin", publicInterface, {css: 'WalrusPlugin.css'});

})(jQuery)