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

var AddImageControl = function(map, layerName)
{
    var doAddLayerWithProperties = function(layerInfo)
    {
        var metaProps = layerInfo.properties.MetaProperties;
        
        nsGmx.EditObjectControl(layerName, null, {drawingObject: map.drawing.addObject(gmxAPI.from_merc_geometry(layerInfo.geometry)), fields: [
                    {name: 'LayerName', value: layerInfo.properties.name,  constant: true},
                    {name: 'title',     value: layerInfo.properties.title, constant: true},
                    {name: 'acdate',    value: metaProps.acdate.Value,     constant: true},
                    {name: 'platform',  value: metaProps.platform.Value,   constant: true},
                    {name: 'sceneid',   value: metaProps.sceneid.Value,    constant: true},
                    {name: 'views',     value: 0, constant: true},
                    {name: 'walruses',  value: 0, constant: true}
                ]
            });
        
        // var obj = {
            // action: 'insert',
            // geometry: layerInfo.geometry,
            // properties: {
                // LayerName: layerInfo.properties.name,
                // title: layerInfo.properties.title,
                // acdate: metaProps.acdate.Value,
                // //actime: metaProps.actime.Value,
                // platform: metaProps.platform.Value,
                // sceneid: metaProps.sceneid.Value,
                // views: 0
            // }
        // };
        
        // var objects = JSON.stringify([obj]);
        
        // sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", 
            // {
                // WrapStyle: 'window', 
                // LayerName: layerName,
                // objects: objects
            // }, 
            // function(response)
            // {
                // if (!parseResponse(response))
                    // return;
                    
                // map.layers[layerName].chkLayerVersion();
            // }
        // )
    }

    var doAddLayer = function(newLayer)
    {
        var newLayerName = newLayer.name;
        var testQuery = 'LayerName="' + newLayerName + '"'
        sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&count=true" + "&layer=" + layerName + "&query=" + encodeURIComponent(testQuery), function(response)
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
                    
                doAddLayerWithProperties(response.Result);
            })
        })
    }

    var createAddImageDialog = function()
    {
        var layerManagerCanvas = _div();
        var newLayerCanvas = _div(null, [['css', 'marginTop', '10px']]);
        var suggestLayersControl = new nsGmx.LayerManagerControl(layerManagerCanvas, 'addimage', {
            fixType: 'raster', 
            enableDragging: false,
            onclick: function(clickContext) { doAddLayer(clickContext.elem);}
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
    
    createAddImageDialog();
}

var WalrusControl = function(map, container, walrusLayerName, imageLayerName)
{
    var drawWalrus = function(walrus)
    {
        var addDate = walrus.values[walrus.fields.adddate.index];
        var sceneId = walrus.values[walrus.fields.sceneid.index];
            
        var tr = $('<tr/>', {'class': 'walrus-row'})
            .append($('<td/>').text(sceneId))
            .append($('<td/>').text(nsGmx.Utils.convertFromServer('date', addDate)))
            .click(function()
            {
                var merc_geom = walrus.values[walrus.fields.geomixergeojson.index];
                var bounds = gmxAPI.getBounds(gmxAPI.from_merc_geometry(merc_geom).coordinates);
                map.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
            })[0];
            
        for (var i = 0; i < tr.childNodes.length; i++)
            tr.childNodes[i].style.width = this._fields[i].width;
            
        return tr;
    }
    
    var updateData = function()
    {
        var query = '&query=' + encodeURIComponent("'sceneid'='" + _imageProps.sceneid + "'");
        walrusDataProvider.setRequests(
            serverBase + "VectorLayer/Search.ashx?WrapStyle=func&count=true&layer=" + walrusLayerName + query,
            serverBase + "VectorLayer/Search.ashx?WrapStyle=func&geometry=true&layer=" + walrusLayerName + query
        );
        
        map.layers[walrusLayerName].setVisibilityFilter('"sceneid"=\'' + _imageProps.sceneid + '\'');
        if (_imageProps.sceneid in viewedIDs)
            doneInspectButton.attr('disabled', 'disabled')
        else
            doneInspectButton.removeAttr('disabled', 'disabled')
    }
    
    var _imageProps = {
        sceneid: '__NOT_EXISTENT_SCENE__',
        acdate: null
    }
    
    var viewedIDs = {};
    
    var walrusDataProvider = new scrollTable.AttributesServerDataProvider();
    
    var doneInspectButton = $('<button/>').text('Просмотрено').css({'float': 'right'}).click(function()
    {
        $(this).attr('disabled', 'disabled');
        viewedIDs[_imageProps.sceneid] = true;
        
        var newViewCount = _imageProps.views + 1;
      
        var obj = {
            action: 'update',
            id: _imageProps.ogc_fid,
            properties: { views: newViewCount }
        };
        
        var objects = JSON.stringify([obj]);
        
        sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", 
            {
                WrapStyle: 'window', 
                LayerName: imageLayerName,
                objects: objects
            }, 
            function(response)
            {
                map.layers[imageLayerName].chkLayerVersion();
            }
        )
    })
    
    var addWalrusButton = $('<button/>').text('Добавить моржа').click(function()
    {
        var listenerId = map.drawing.addListener('onFinish', function(newObj)
        {
            map.drawing.removeListener('onFinish', listenerId);
            
            var editControl = new nsGmx.EditObjectControl(walrusLayerName, null, {drawingObject: newObj, fields: [
                    {name: 'sceneid', value: _imageProps.sceneid, constant: true},
                    {name: 'adddate', value: (new Date()).valueOf()/1000, constant: true},
                    {name: 'sourcedate', value: _imageProps.acdate, constant: true}
                ]
            });
            
            $(editControl).bind('modify', function()
            {
                var newWalrusCount = _imageProps.walruses + 1;
              
                var obj = {
                    action: 'update',
                    id: _imageProps.ogc_fid,
                    properties: {
                        walruses: newWalrusCount
                    }
                };
                
                var objects = JSON.stringify([obj]);
                
                sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", 
                    {
                        WrapStyle: 'window', 
                        LayerName: imageLayerName,
                        objects: objects
                    }, 
                    function(response)
                    {
                        map.layers[imageLayerName].chkLayerVersion();
                    }
                )
            })
        })
            
        map.toolsAll.standartTools.selectTool('POLYGON');
    });
    
    var tableContainer = $('<div/>');
    
    $(container).append(doneInspectButton).append(addWalrusButton).append(tableContainer);
    updateData();
    
    var walrusTable = new scrollTable();
    walrusTable.setDataProvider(walrusDataProvider);
    walrusTable.createTable({
        parent: tableContainer[0],
        name: 'walrus',
        fields: ['Сцена', 'Дата отметки'],
        fieldsWidths: ['70%', '30%'],
        drawFunc: drawWalrus
    });
    
    this.setActiveImage = function(imageProps)
    {
        _imageProps = imageProps;
        // _sceneid = sceneid;
        // _acdate = acdate;
        updateData();
    }
    
    this.reloadFromServer = function()
    {
        walrusDataProvider.serverChanged();
    }
    
}

var publicInterface = {
    pluginName: 'Walrus',
	afterViewer: function(params, map)
    {
        // var imageLayerName = '26EE541B6E0C43DBB3B4CAA3563F94E9';
        var imageLayerName = 'A11B56BA40DD42AF8726356849A41297';
        var walrusLayerName = '62D064DA30D74A98861B2E1C50A93E3F';
        
        nsGmx.widgets.commonCalendar.get().unbindLayer(imageLayerName);
        map.layers[imageLayerName].setDateInterval(new Date(2000, 1, 1), new Date(2100, 1, 1));
        map.layers[imageLayerName].setVisibilityFilter('"ogc_fid"=-1');
        
        var imagesContainer = _div();
        var walrusContainer = _div();
        var addImageButton = $('<button/>').text('Добавить снимок').click(function()
        {
            new AddImageControl(map, imageLayerName);
        })
        
        var menuContainer = $('<div/>', {'class': 'walrus-main-container'}).append(addImageButton).append(imagesContainer).append(walrusContainer);
        
        var menu = new leftMenu();
        menu.createWorkCanvas("walrus", function(){});
        _(menu.workCanvas, [menuContainer[0]]);
        
        var walrusControl = new WalrusControl(map, walrusContainer, walrusLayerName, imageLayerName);
        
        var walrusImagesdataProvider = new scrollTable.AttributesServerDataProvider();
        walrusImagesdataProvider.setRequests(
                serverBase + "VectorLayer/Search.ashx?WrapStyle=func&count=true&layer=" + imageLayerName,
                serverBase + "VectorLayer/Search.ashx?WrapStyle=func&geometry=true&layer=" + imageLayerName
            );
        
        var drawWalrusImages = function(image)
        {
            var imageProps = scrollTable.AttributesServerDataProvider.convertValuesToHash(image);
            var name = imageProps.title;
            var acdate = imageProps.acdate;
            var sceneId = imageProps.sceneid;
            
            var tr = $('<tr/>', {'class': 'walrus-images-row'})
                .append($('<td/>').text(imageProps.platform))
                .append($('<td/>').text(nsGmx.Utils.convertFromServer('date', acdate)))
                .append($('<td/>').text(imageProps.walruses))
                .append($('<td/>').text(imageProps.views))
                .click(function()
                {
                    walrusControl.setActiveImage(imageProps);
                    var merc_geom = imageProps.geomixergeojson;
                    var bounds = gmxAPI.getBounds(gmxAPI.from_merc_geometry(merc_geom).coordinates);
                    map.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
                    map.layers[imageLayerName].setVisibilityFilter('"sceneid"=\'' + sceneId + '\'');
                    
                    $(this).addClass('walrus-active-image');
                    $(this).siblings().removeClass('walrus-active-image');
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
            fields: ['Спутник', 'Дата', 'Моржи', 'Просмотры'],
            fieldsWidths: ['30%', '30%', '15%', '15%'],
            drawFunc: drawWalrusImages
        });
        
        map.layers[imageLayerName].addListener('onChangeLayerVersion', function()
        {
            walrusImagesdataProvider.serverChanged();
        })
        
        map.layers[walrusLayerName].addListener('onChangeLayerVersion', function()
        {
            walrusControl.reloadFromServer();
        })
        
        
    }
}

gmxCore.addModule("WalrusPlugin", publicInterface, {css: 'WalrusPlugin.css'});

})(jQuery)