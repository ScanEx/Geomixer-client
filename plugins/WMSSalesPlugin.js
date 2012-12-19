(function ($, map){

var g_tagMetaInfo = null;

_translationsHash.addtext("rus", {
	"wmsSalesPlugin.menuTitle" : "Генерация слоёв по сценам",
	"wmsSalesPlugin.sceneList" : "Список сцен:",
	"wmsSalesPlugin.generate"  : "Создать каталог",
	"wmsSalesPlugin.check"     : "Проверить сцены",
	"wmsSalesPlugin.name"      : "Имя каталога",
	"wmsSalesPlugin.boundary"  : "Граница для WMS"
});
_translationsHash.addtext("eng", {
	"wmsSalesPlugin.menuTitle" : "Generate layers using scenes",
	"wmsSalesPlugin.sceneList" : "Scenes:",
	"wmsSalesPlugin.generate"  : "Generate catalog",
    "wmsSalesPlugin.check"     : "Check scenes",
    "wmsSalesPlugin.name"      : "Catalog name",
    "wmsSalesPlugin.boundary"  : "Boundary for WMS"
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

//перевод типов метаданных в тип атрибутов
var typesDictonary = {
    'String': 'string',
    'Number': 'float',
    'Date': 'date',
    'DateTime': 'datetime',
    'Time': 'time'
};

var createRC = function(results, params)
{
    var def = $.Deferred();
    var _params = $.extend({
        title: 'wms_sales_rc', 
        addToMap: true,
        userBorder: null
    }, params);
    
    //атрибуты каталога растров - объединение всех метаданных слоёв
    var tagTypes = {};
    $.each(results, function(id, props) {
        $.each(props.layerProperties.MetaProperties, function(tagId, tagInfo) {
            tagTypes[tagId] = typesDictonary[tagInfo.Type];
        })
    })
    
    var mapProperties = _layersTree.treeModel.getMapProperties();
    
    var requestParams = {
        WrapStyle: 'window',
        Title: _params.title,
        MapName: mapProperties.name,
        geometrytype: 'POLYGON',
        
        IsRasterCatalog: true,
        RCMinZoomForRasters: 10
    }
    
    if (_params.userBorder)
        requestParams.UserBorder = JSON.stringify(_params.userBorder);
    
    var fieldIdx = 0;
    var ColumnTagLinks = {}
    $.each(tagTypes, function(id, type)
    {
        ColumnTagLinks[id] = id; //названия атрибутов будут совпадать с названиями тегов слоёв
        requestParams['fieldName' + fieldIdx] = id;
        requestParams['fieldType' + fieldIdx] = type;
        fieldIdx++;
    })
    
    requestParams.FieldsCount = fieldIdx;
    requestParams.ColumnTagLinks = JSON.stringify(ColumnTagLinks);
    
    sendCrossDomainPostRequest(serverBase + "VectorLayer/CreateVectorLayer.ashx", requestParams, function(response)
    {
        if (!parseResponse(response))
            return;
            
        var newLayer = response.Result;
            
        //добавляем в дерево слоёв
        var targetDiv = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
        
        //добавляем соответствующие объекты
        var objs = [];
        for (var sid in results)
        {
            if (results[sid].status === 'missing')
                continue;
            
            objs.push({
                properties: {GM_LayerName: results[sid].layerProperties.name}
            });
        }
        
        _mapHelper.modifyObjectLayer(newLayer.properties.name, objs).done(function()
        {
            if (_params.addToMap)
            {
                var gmxProperties = {type: 'layer', content: newLayer};
                gmxProperties.content.properties.mapName = mapProperties.name;
                gmxProperties.content.properties.hostName = mapProperties.hostName;
                gmxProperties.content.properties.visible = true;
                
                gmxProperties.content.properties.styles = [{
                    MinZoom: gmxProperties.content.properties.MinZoom, 
                    MaxZoom:21, 
                    RenderStyle:_mapHelper.defaultStyles[gmxProperties.content.properties.GeometryType]
                }];
                
                _layersTree.copyHandler(gmxProperties, targetDiv, false, true);
            }
            
            def.resolve(newLayer);
        })
    })
    
    return def.promise();
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
            
            var rcParams = {};
            if (layerNameInput.val())
                rcParams.title = layerNameInput.val();
            
            if (boundaryInput.val())
            {
                nsGmx.Utils.parseShpFile(boundaryForm).done(function(objs)
                {
                    rcParams.userBorder = merc_geometry(nsGmx.Utils.joinPolygons(objs));
                    createRC(results, rcParams);
                })
            }
            else
            {
                createRC(results, rcParams);
            }
            
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
    
    var layerNameInput = $('<input/>', {'class': 'wmsSales-name-input'});

    var boundaryInput = $('<input/>', {type: 'file', name: 'file'});
    
    var boundaryForm = _form([boundaryInput[0]], [['attr', 'method', 'POST'], ['attr', 'encoding', 'multipart/form-data'], ['attr', 'enctype', 'multipart/form-data'], ['attr', 'id', 'upload_shapefile_form']]);
    
    var rcParamsTable = $('<table/>', {'class': 'wmsSales-rcProperties'}).append(
        $('<tr/>').append(
            $('<td/>').text(_gtxt('wmsSalesPlugin.name')),
            $('<td/>').append(layerNameInput)
        ),
        $('<tr/>').append(
            $('<td/>').text(_gtxt('wmsSalesPlugin.boundary')),
            $('<td/>').append(boundaryForm)
        )
    )
    
    canvas.append(
        $("<div/>").text(_gtxt("wmsSalesPlugin.sceneList")),
        scenesList,
        checkButton,
        rcParamsTable,
        generateButton
    );
        
    showDialog(_gtxt('wmsSalesPlugin.menuTitle'), canvas[0], 400, 400);
}

var publicInterface = {
    createRC: createRC,
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