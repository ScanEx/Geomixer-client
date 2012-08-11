(function ($, map){

var g_tagMetaInfo = null;

_translationsHash.addtext("rus", {
    'walrusPlugin.menuTitle': 'Добавить новый снимок',
    'walrusPlugin.labelExistLayer': 'Выбрать существующий',
    'walrusPlugin.labelNewLayer': 'Добавить новый',
    'walrusPlugin.alreadyExistWarn': 'Такой слой уже есть',
    'walrusPlugin.dialogTitle': 'Добавление снимка'
});

_translationsHash.addtext("eng", {
    'walrusPlugin.menuTitle': 'Add new image',
    'walrusPlugin.labelExistLayer': 'Select from list',
    'walrusPlugin.labelNewLayer': 'Add new',
    'walrusPlugin.alreadyExistWarn': 'This layer is already added',
    'walrusPlugin.dialogTitle': 'Add image'
});

var doAddLayerWithProperties = function(targetLayerName, layerInfo)
{
    var metaProps = layerInfo.properties.MetaProperties;
    
    var obj = {
        action: 'insert',
        geometry: layerInfo.geometry,
        properties: {
            LayerName: layerInfo.properties.name,
            title: layerInfo.properties.title,
            acdate: metaProps.acdate.Value,
            //actime: metaProps.actime.Value,
            platform: metaProps.platform.Value,
            sceneid: metaProps.sceneid.Value,
            views: 0
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
        }
    )
}

var doAddLayer = function(targetLayerName, newLayer)
{
    var newLayerName = newLayer.name;
    var testQuery = 'LayerName="' + newLayerName + '"'
    sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&count=true" + "&layer=" + targetLayerName + "&query=" + encodeURIComponent(testQuery), function(response)
    {
        if (!parseResponse(response))
            return;
            
        if (response.Result > 0)
        {
            alert(_gtxt('walrusPlugin.alreadyExistWarn'));
            return;
        }
        
        sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerJson.ashx?WrapStyle=func&LayerName=" + newLayerName, function(response)
        {
            if (!parseResponse(response))
                return;
                
            doAddLayerWithProperties(targetLayerName, response.Result);
        })
    })
}

var createAddImageDialog = function(layerName)
{
    var layerManagerCanvas = _div();
    var newLayerCanvas = _div(null, [['css', 'marginTop', '10px']]);
    var suggestLayersControl = new nsGmx.LayerManagerControl(layerManagerCanvas, 'addimage', {
        fixType: 'raster', 
        enableDragging: false,
        onclick: function(clickContext) { doAddLayer(layerName, clickContext.elem);}
    });
    
    var newLayerRadio = $('<input/>', {'class': 'walrus-radio', type: 'radio', id: 'addNewLayer', name: 'newLayer'}).click(function()
    {
        $(layerManagerCanvas).hide();
        $(newLayerCanvas).show();
        
    });
    
    var existLayerRadio = $('<input/>', {'class': 'walrus-radio', type: 'radio', id: 'addExistingLayer', name: 'newLayer', checked: 'checked'}).click(function()
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
                        doAddLayerWithProperties(layerName, taskInfo.Result);
                    })
                }
            }
        );
    }
    initNewLayerCanvas();
    
    var canvas = $('<div/>').
        append($('<form/>'))
            .append($('<table/>', {'class': 'walrus-switchcontainer'}).append($('<tr/>')
                .append($('<td/>').append(existLayerRadio))
                .append($('<td/>').append($('<label/>', {'class': 'walrus-label', type: 'radio', 'for': 'addExistingLayer'}).text(_gtxt('walrusPlugin.labelExistLayer'))))
                .append($('<td/>').append(newLayerRadio))
                .append($('<td/>').append($('<label/>', {'class': 'walrus-label', type: 'radio', 'for': 'addNewLayer'}).text(_gtxt('walrusPlugin.labelNewLayer'))))
            ))
        .append(layerManagerCanvas)
        .append(newLayerCanvas);
    
    showDialog(_gtxt('walrusPlugin.dialogTitle'), canvas[0], {width: 600, height: 600});
    
    existLayerRadio[0].checked = true;    
}

var WalrusControl = function(container, walrusLayerName)
{
    var drawWalrus = function()
    {
        var tr = $('<tr/>')
            .append($('<td/>').text('aaa'))
            .append($('<td/>').text('bbb'))[0];
            
        for (var i = 0; i < tr.childNodes.length; i++)
            tr.childNodes[i].style.width = this._fields[i].width;
            
        return tr;
    }
    
    var redraw = function()
    {
        var query = '&query=' + encodeURIComponent("'sceneid'='" + _sceneid + "'");
        walrusDataProvider.setRequests(
            serverBase + "VectorLayer/Search.ashx?WrapStyle=func&count=true&layer=" + walrusLayerName + query,
            serverBase + "VectorLayer/Search.ashx?WrapStyle=func&layer=" + walrusLayerName + query
        );
        
        //$(container).empty().text('Active image: ' + _sceneid);
    }
    
    var _sceneid = '__NOT_EXISTANT_SCENE__';
    var walrusDataProvider = new scrollTable.AttributesServerDataProvider();
    redraw();
    var walrusTable = new scrollTable();
    walrusTable.setDataProvider(walrusDataProvider);
    walrusTable.createTable({
        parent: container,
        name: 'walrus',
        fields: ['Сцена', 'Дата'],
        fieldsWidths: ['70%', '30%'],
        drawFunc: drawWalrus
    });
    
    this.setActiveImage = function(sceneid)
    {
        _sceneid = sceneid;
        redraw();
    }
}

var publicInterface = {
	afterViewer: function(params)
    {
    
        // nsGmx.ContextMenuController.addContextMenuElem({
            // title: _gtxt("walrusPlugin.menuTitle"),
            // isVisible: function(context)
            // {
                // var layer = globalFlashMap.layers[context.elem.name];
                // return !context.layerManagerFlag && 
                       // layer.properties.type === 'Vector';
            // },
            // clickCallback: function(context)
            // {

            // }
        // }, 'Layer');
        
        
        
        var imageLayerName = '26EE541B6E0C43DBB3B4CAA3563F94E9';
        var walrusLayerName = '62D064DA30D74A98861B2E1C50A93E3F';
        
        var imagesContainer = _div();
        var walrusContainer = _div();
        var addImageButton = $('<button/>').text('Добавить снимок').click(function()
        {
            createAddImageDialog(imageLayerName);
        })
        
        var menuContainer = $('<div/>').append(addImageButton).append(imagesContainer).append(walrusContainer);
        
        var menu = new leftMenu();
        menu.createWorkCanvas("walrus", function(){});
        _(menu.workCanvas, [menuContainer[0]]);
        
        var walrusControl = new WalrusControl(walrusContainer, walrusLayerName);
        
        var walrusImagesdataProvider = new scrollTable.AttributesServerDataProvider();
        walrusImagesdataProvider.setRequests(
                serverBase + "VectorLayer/Search.ashx?WrapStyle=func&count=true&layer=" + imageLayerName,
                serverBase + "VectorLayer/Search.ashx?WrapStyle=func&geometry=true&layer=" + imageLayerName
            );
        
        var drawWalrusImages = function(image)
        {
            console.log(image);
            var name = image.values[image.fields.title.index];
            var acdate = image.values[image.fields.acdate.index];
            var sceneId = image.values[image.fields.sceneid.index]
            var tr = $('<tr/>')
                .append($('<td/>').text(name))
                .append($('<td/>').text(nsGmx.Utils.convertFromServer('date', acdate)))
                .click(function()
                {
                    walrusControl.setActiveImage(sceneId);
                })[0];
                
            for (var i = 0; i < tr.childNodes.length; i++)
                tr.childNodes[i].style.width = this._fields[i].width;
                
            return tr;
        }
        
        var imagesTable = new scrollTable();
        imagesTable.setDataProvider(walrusImagesdataProvider);
        imagesTable.createTable({
            parent: imagesContainer,
            name: 'walrusImages',
            fields: ['Имя', 'Дата'],
            fieldsWidths: ['70%', '30%'],
            drawFunc: drawWalrusImages
        });
    }
}

gmxCore.addModule("WalrusPlugin", publicInterface, {css: 'WalrusPlugin.css'});

})(jQuery)