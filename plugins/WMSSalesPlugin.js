//Плагин для генерации КР по наборам sceneid снимков. Использует поиск по всем растровым слоям.
(function ($){

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

// sceneIDs - массив из ID сцен
// возвращает promise, который ресолвится массивом объектов со следующими свойстами:
// * status: missing|layer
// * layerProperties: свойства найденного слоя (то, что вернул сервер)
var findImagesBySceneIDs = function(sceneIDs, params)
{
    var _params = $.extend({
        serverBase: window.serverBase || '',
        searchParams: {}
    }, params);
    
    var deferreds = [];
    
    var results = {};
    var deferred = $.Deferred();
    
    var query = $.map(sceneIDs, function(id) {
        var id = id.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        if (id === '') return;
        results[id] = {status: 'missing'};
        return "[sceneid]='" + id + "'"
    }).join(' OR ');
    
    var params = $.extend(_params.searchParams, {
        query: query, 
        WrapStyle: 'window', 
        pageSize: 10*sceneIDs.length,
        SendMetadata: true
    });
    
    sendCrossDomainPostRequest(_params.serverBase + 'Layer/Search2.ashx', params, function(response)
    {
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

//Генерирует КР по описанию растровых слоёв
//results: массив, который возвращает ф-ция findImagesBySceneIDs
var createRC = function(results, params)
{
    var def = $.Deferred();
    var _params = $.extend({
        title: 'wms_sales_rc', 
        addToMap: true,
        userBorder: null,
        serverBase: window.serverBase || '',
        additionalColumns: [], //{name:String, type:String}
        additionalAttributes: {}, //layerName->{attrName -> <value in server format>}
        additionalLayerProperties: {}
    }, params);
    
    //атрибуты каталога растров - объединение всех метаданных слоёв
    var tagTypes = {};
    $.each(results, function(id, props) {
        if (props.layerProperties) {
            $.each(props.layerProperties.MetaProperties, function(tagId, tagInfo) {
                tagTypes[tagId] = typesDictonary[tagInfo.Type];
            })
        }
    })
    
    for (var ap = 0; ap < _params.additionalColumns.length; ap++) {
        var attr = _params.additionalColumns[ap];
        tagTypes[attr.name] = attr.type;
    }
    
    var mapProperties = _layersTree.treeModel.getMapProperties();
    
    var fieldIdx = 0;
    var ColumnTagLinks = {}
    
    var columns = [];
    
    $.each(tagTypes, function(id, type)
    {
        ColumnTagLinks[id] = id; //названия атрибутов будут совпадать с названиями тегов слоёв
        columns.push({
            Name: id, 
            ColumnSimpleType: type,
            IsPrimary: false, 
            IsIdentity: false, 
            IsComputed: false
        });
    })
    
    var layerProperties = new nsGmx.LayerProperties({
        Type: 'Vector',
        Title: _params.title,
        GeometryType: 'POLYGON',
        Columns: columns,
        SourceType: 'manual',
        RC: new nsGmx.LayerRCProperties({
            IsRasterCatalog: true,
            RCMinZoomForRasters:  10,
            ColumnTagLinks: ColumnTagLinks
        })
    });
    
    layerProperties.set(_params.additionalLayerProperties);
    // for (var propName in _params.additionalLayerProperties) {
    // }
    
    if (_params.userBorder) {
        layerProperties.set('UserBorder', _params.userBorder);
    }
    
    layerProperties.save(false, function(response) {
    
        var newLayer = response.Result;
            
        //Добавляем на карту перед добавлением объектов, 
        //чтобы обновление объектов на экране далее происходило автоматически.
        if (_params.addToMap)
        {
            var gmxProperties = {type: 'layer', content: newLayer};
            gmxProperties.content.properties.mapName = mapProperties.name;
            gmxProperties.content.properties.hostName = mapProperties.hostName;
            gmxProperties.content.properties.visible = true;
            
            gmxProperties.content.properties.styles = [{
                MinZoom: gmxProperties.content.properties.VtMaxZoom, 
                MaxZoom:21, 
                RenderStyle:_mapHelper.defaultStyles[gmxProperties.content.properties.GeometryType]
            }];
            
            var targetDiv = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
            _layersTree.copyHandler(gmxProperties, targetDiv, false, true);
        }
        
        //добавляем объекты в новый КР
        var objs = [];
        for (var sid in results)
        {
            if (results[sid].status === 'missing')
                continue;
            
            var name = results[sid].layerProperties.name;
            var insertInfo = {
                source: {layerName: name}
            };
            
            if (name in _params.additionalAttributes) {
                insertInfo.properties = _params.additionalAttributes[name];
            }
            
            objs.push(insertInfo);
        }
        
        _mapHelper.modifyObjectLayer(newLayer.properties.name, objs).done(function()
        {
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
    findImagesBySceneIDs: findImagesBySceneIDs,

    pluginName: 'Express RC Creator',
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

gmxCore.addModule("WMSSalesPlugin", publicInterface, {
    css:"WMSSalesPlugin.css",
    require: ["LayerProperties"]
});

})(jQuery)