(function ($, map){

var g_tagMetaInfo = null;

_translationsHash.addtext("rus", {
	"wmsSalesPlugin.menuTitle" : "Генерация слоёв по сценам",
	"wmsSalesPlugin.sceneList" : "Список сцен:",
	"wmsSalesPlugin.generate" : "Генерить слои",
	"wmsSalesPlugin.check" : "Проверить слои"
});
_translationsHash.addtext("eng", {
	"wmsSalesPlugin.menuTitle" : "Generate layers using scenes",
	"wmsSalesPlugin.sceneList" : "Scenes:",
	"wmsSalesPlugin.generate" : "Generate layers",
    "wmsSalesPlugin.check" : "Check layers"
});

var findImagesBySceneIDs = function(sceneIDs, chunkSize)
{
    chunkSize = chunkSize || 1;
    var deferreds = [];
    
    var results = {};
    var deferred = $.Deferred();
    
    var query = $.map(sceneIDs, function(id) {return "[sceneid]='" + id + "'"}).join(' OR ');
    $.each(sceneIDs, function(index, id) {results[id] = {status: 'missing'}});
    
    var params = {
        query: query, 
        WrapStyle: 'window', 
        pageSize: 10*sceneIDs.length,
        SendMetadata: true
    }
    
    sendCrossDomainPostRequest(serverBase + 'Layer/Search2.ashx', params, function(response)
    {
        //console.log(response);
        if (!parseResponse(response))
        {
            deferred.reject();
            return;
        }
        
        $.each(response.Result.layers, function(i, layer)
        {
            var sceneID = layer.MetaProperties.sceneid.Value;
            results[sceneID] = {status: 'layer', layerProperties: layer}
        })
        
        deferred.resolve(results);
    })
    
    return deferred.promise();
}

var createRC = function(results)
{
    //атрибуты каталога растров - объединение всех метаданных слоёв
    var tagTypes = {}
    $.each(results, function(id, props) {
        $.each(props.layerProperties.MetaProperties, function(tagId, tagInfo) {
            tagTypes[tagId] = tagInfo.Type;
        })
    })
    
    var mapProperties = _layersTree.treeModel.getMapProperties();
    
    var params = {
        WrapStyle: 'window',
        Title: 'wms_sales_rc',
        MapName: mapProperties.name,
        geometrytype: 'POLYGON',
        
        IsRasterCatalog: true,
        RCMinZoomForRasters: 10
    }
    
    var fieldIdx = 0;
    var ColumnTagLinks = {}
    $.each(tagTypes, function(id, type)
    {
        ColumnTagLinks[id] = id; //названия атрибутов будут совпадать с названиями тегов слоёв
        params['fieldName' + fieldIdx] = id;
        params['fieldType' + fieldIdx] = type;
        fieldIdx++;
    })
    
    params.FieldsCount = fieldIdx;
    params.ColumnTagLinks = JSON.stringify(ColumnTagLinks);
    
    sendCrossDomainPostRequest(serverBase + "VectorLayer/CreateVectorLayer.ashx", params, function(response)
    {
        if (!parseResponse(response))
            return;
            
        //добавляем в дерево слоёв
        var targetDiv = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
        var gmxProperties = {type: 'layer', content: response.Result};
        gmxProperties.content.properties.mapName = mapProperties.name;
        gmxProperties.content.properties.hostName = mapProperties.hostName;
        gmxProperties.content.properties.visible = true;
        
        gmxProperties.content.properties.styles = [{
            MinZoom: gmxProperties.content.properties.MinZoom, 
            MaxZoom:21, 
            RenderStyle:_mapHelper.defaultStyles[gmxProperties.content.properties.GeometryType]
        }];
        
        _layersTree.copyHandler(gmxProperties, targetDiv, false, true);
        
        //добавляем соответствующие объекты
        var objs = [];
        for (var sid in results)
        {
            if (results[sid].status === 'missing')
                continue;
            
            objs.push({
                action: 'insert',
                properties: {GM_LayerName: results[sid].layerProperties.name}
            });
        }
        
        sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", 
            {
                WrapStyle: 'window', 
                LayerName: gmxProperties.content.properties.name, 
                objects: JSON.stringify(objs)
            },
            function(addResponse)
            {
                if (!parseResponse(addResponse))
                    return;
            }
        );
    })
}

var showWidget = function()
{
    var canvas = $('<div/>');
    var scenesList = $('<textarea/>', {'class': 'wmsSales-scenelist'});
    
    var generateButton = $('<button/>', {'class': 'wmsSales-genbutton'}).text(_gtxt('wmsSalesPlugin.generate')).click(function()
    {
        var scenes = scenesList.val().split('\n');
        findImagesBySceneIDs(scenes).done(function(results)
        {
            var missingScenesIDs = [],
                layerScenes = [];
                
            for (var sid in results)
            {
                if (results[sid].status === 'missing')
                    missingScenesIDs.push(sid);
                else                 
                    layerScenes.push(results[sid].layerProperties);
            }
            
            //nsGmx.createMultiLayerEditorNew(_layersTree, {layers: layerScenes});
            createRC(results);
            
            if (missingScenesIDs.length > 0)
            {
                var canvas = $('<div/>');
                var missingContainer = $('<div/>');
                for (var s = 0; s < missingScenesIDs.length; s++)
                    missingContainer.append($('<div/>').text(missingScenesIDs[s]));

                canvas.append($('<div/>').text('Не найденные сцены:')).append(missingContainer);

                showDialog('Результаты генерации', canvas[0], 400, 300);
            }
        })
    });
    
    var checkButton = $('<button/>', {'class': 'wmsSales-genbutton'}).text(_gtxt('wmsSalesPlugin.check')).click(function()
    {
        var scenes = scenesList.val().split('\n');
        findImagesBySceneIDs(scenes).done(function(results)
        {
            var canvas = $('<div/>');
            for (var item in results)
            {
                if (results[item].status === 'missing')
                    canvas.append($('<div/>').text(item));
            }

            showDialog("Отсутствующие сцены", canvas[0], 400, 300);
        });
    });
    
    canvas
        .append($("<div/>").text(_gtxt("wmsSalesPlugin.sceneList"))).append(scenesList)
        .append(generateButton)
        .append(checkButton);
        
    showDialog(_gtxt('wmsSalesPlugin.menuTitle'), canvas[0], 400, 400);
}

var publicInterface = {
	afterViewer: function(params)
    {
        if (!nsGmx.AuthManager.canDoAction(nsGmx.ACTION_CREATE_LAYERS))
            return;
            
        _menuUp.addChildItem({
            id: 'wmsSales', 
            title:_gtxt('wmsSalesPlugin.menuTitle'), 
            func: function()
            {
                nsGmx.TagMetaInfo.loadFromServer(function(tagMetaInfo)
                {
                    g_tagMetaInfo = tagMetaInfo;
                    showWidget();
                });
            }
        }, 'instrumentsMenu');
    }
}

gmxCore.addModule("WMSSalesPlugin", publicInterface, { css:"WMSSalesPlugin.css" });

})(jQuery)