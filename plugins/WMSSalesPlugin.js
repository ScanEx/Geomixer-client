(function ($, map){

var g_tagMetaInfo = null;

_translationsHash.addtext("rus", {
	"wmsSalesPlugin.menuTitle" : "Генерация слоёв по сценам",
	"wmsSalesPlugin.coverageTitle" : "Выбор спутникого покрытия:",
	"wmsSalesPlugin.sceneList" : "Список сцен:",
	"wmsSalesPlugin.generate" : "Генерить слои",
	"wmsSalesPlugin.check" : "Проверить слои"
});
_translationsHash.addtext("eng", {
	"wmsSalesPlugin.menuTitle" : "Generate layers using scenes",
    "wmsSalesPlugin.coverageTitle" : "Select coverage layer:",
	"wmsSalesPlugin.sceneList" : "Scenes:",
	"wmsSalesPlugin.generate" : "Generate layers",
    "wmsSalesPlugin.check" : "Check layers"
});

var ISceneManager = {
    deferredCheck: function(sceneId)
    {
    },
    deferredGenerate: function(sceneId)
    {
    },
    check: function()
    {
    },
    generate: function(callback)
    {
    }
}

//params:
//  layerName: string
//  tilePath: string
//  propertiesToTags: function
//  layerSearchQuery: function
//  vectorSearchQuery: function
var VectorSceneManager = function(params)
{
    var _params = params;
    var scenesToCheck = [];
    var scenesToGenerate = [];
    
    var _checkLayer = function(sceneId)
    {
        var deferred = $.Deferred();
        var params = $.extend({
            WrapStyle: 'window'
        }, _params.layerSearchQuery(sceneId));
        
        sendCrossDomainPostRequest(serverBase + 'Layer/Search.ashx', params, function(response)
        {
            if (!parseResponse(response))
            {
                deferred.reject();
            }
            else
                deferred.resolve( response.Result );
        });
        
        return deferred.promise();
    }
    
    var findScenes = function(sceneIds)
    {
        var deferred = $.Deferred();
        var queries = [];
        var res = {};
        
        for (var iScene = 0; iScene < sceneIds.length; iScene++)
        {
            var sceneId = sceneIds[iScene];
            queries.push('(' + _params.vectorSearchQuery(sceneId) + ')');
            res[sceneId] = {isMissing: true};
        }
        
        var params = {
            WrapStyle: 'window',
            layer: _params.layerName,
            page: 0,
            pagesize: scenesToCheck.length,
            orderby: 'ogc_fid',
            geometry: true,
            query: queries.join(' OR ')
        }
        
        sendCrossDomainPostRequest(serverBase + "VectorLayer/Search.ashx", params, function(response)
        {
            if (!parseResponse(response))
            {
                deferred.reject();
            }
            else
                deferred.resolve(response.Result);
        });
        
        return deferred;
    }
    
    this._check = function(sceneIds, callback)
    {
        if (sceneIds.length == 0)
        {
            callback({});
            return;
        }
        
        var failed = false;
        //первый - проверка покрытия, остальные - проверки слоёв
        var deferreds = [findScenes(sceneIds)].concat($.map(sceneIds, _checkLayer)); 
        var res = {}
        for (var iS = 0; iS < sceneIds.length; iS++)
            res[sceneIds[iS]] = {status: 'missing'};
        
        $.when.apply($, deferreds).done(function()
        {
            var responses = $.makeArray(arguments),
                scenesInfo = responses.shift();
            
            for (var iS = 0; iS < scenesInfo.values.length; iS++)
            {
                var properties = {};
                for (var f = 0; f < scenesInfo.fields.length; f++)
                    properties[scenesInfo.fields[f]] = scenesInfo.values[iS][f];
                    
                res[properties.Name] = {status: 'exist', properties: properties};
            }
            
            for (var iS = 0; iS < responses.length; iS++)
                if (responses[iS].count > 0)
                {
                    res[sceneIds[iS]] = $.extend(res[sceneIds[iS]], {status: 'layer', layerProperties: responses[iS].Layers[0]});
                }
            
            callback(res);
        }).fail(callback);
    },
    
    //public interface
    this.deferredCheck = function(sceneId)
    {
        scenesToCheck.push(sceneId);
    }
    
    this.deferredGenerate = function(sceneId)
    {
        scenesToGenerate.push(sceneId);
    }
    
    this.check = function()
    {
        var def = $.Deferred();
        this._check(scenesToCheck, function(res)
        {
            def.resolve(res);
        });
        
        scenesToCheck = [];
        
        return def.promise();
    }
    
    this.generate = function()
    {
        var def = $.Deferred();
        this._check(scenesToGenerate, function(sceneInfo)
        {
            var deferreds = [];
            for (var s in sceneInfo) (function(sid)
            {
                if (sceneInfo[sid].status === 'exist')
                {
                    var curFolder = _params.tilePath.replace("[SCENE]", sid);
                    var geom = JSON.stringify(sceneInfo[sid].properties['geomixergeojson']);
                    
                    var requestParams = {
                        WrapStyle: "window",
                        Title: "wms_ikonos_" + sid,
                        Copyright: "",
                        Legend: "",
                        Description: "",
                        MetaProperties: JSON.stringify(_params.propertiesToTags(sceneInfo[sid].properties)),
                        TilePath: curFolder,
                        BorderFile: '',
                        BorderGeometry: geom,
                        MapName: _layersTree.treeModel.getMapProperties().name
                    }
                    
                    var doneDef = $.Deferred();
                    deferreds.push(doneDef);
                    
                    sendCrossDomainPostRequest(serverBase + "RasterLayer/Insert.ashx", requestParams, function(response)
                    {
                        if (!parseResponse(response))
                            return;
                            
                        //_mapHelper.asyncTasks[response.Result.TaskID] = true;
                        var task = nsGmx.asyncTaskManager.addTask(response.Result);
                        _queryMapLayers.asyncCreateLayer(task, requestParams.Title);
                        task.deferred.done(function(taskInfo)
                        {
                            sceneInfo[sid].layerProperties = taskInfo.Result.properties;
                            doneDef.resolve();
                        });
                    });
                }
            })(s);
            
            $.when.apply($, deferreds).then(
                function(){ def.resolve(sceneInfo); },
                function(){ def.reject(); }
            );
        })
        
        scenesToGenerate = [];
        
        return def;
    }
}

var propertiesToTagsIkonos = function(properties)
{
    var dateLocal = $.datepicker.parseDate('yy-mm-dd', properties.DATE);
    var timeOffset = dateLocal.getTimezoneOffset()*60;
    
    var parseTimeRes = properties.TIME.match(/(\d\d):(\d\d):(\d\d)/)
    
    var values = {
        sceneid:    properties.Name,
        platform:   'IKONOS',
        resolution: 1.0,
        acdate:     dateLocal.valueOf()/1000 - timeOffset,
        actime:     parseTimeRes[1]*3600 + parseTimeRes[2]*60 + parseTimeRes[3]*1
    }
    
    var meta = {};
    for (var t in values)
        meta[t] = {value: values[t], type: g_tagMetaInfo.getTagType(t)};
        
    return meta;
}

var propertiesToTagsGeoEye = function(properties)
{
    var dateLocal = $.datepicker.parseDate('yy-mm-dd', properties.DATE);
    var timeOffset = dateLocal.getTimezoneOffset()*60;
    
    var parseTimeRes = properties.TIME.match(/(\d\d):(\d\d):(\d\d)/)
    
    var values = {
        sceneid:    properties.Name,
        platform:   'GeoEye',
        resolution: 1.0,
        acdate:     dateLocal.valueOf()/1000 - timeOffset,
        actime:     parseTimeRes[1]*3600 + parseTimeRes[2]*60 + parseTimeRes[3]*1
    }
    
    var meta = {};
    for (var t in values)
        meta[t] = {value: values[t], type: g_tagMetaInfo.getTagType(t)};
        
    return meta;
}

var showWidget = function()
{
    var canvas = $('<div/>');
    var scenesList = $('<textarea/>', {'class': 'wmsSales-scenelist'});
        
    var ikonosManager = new VectorSceneManager({
        layerName: '5D1858A954544BA892E182F81461A361',
        tilePath: 'kosmosnimki\\Piccolo\\[SCENE].tiles',
        propertiesToTags: propertiesToTagsIkonos,
        layerSearchQuery: function(sid)
        {
            return {PropQuery: '("sceneid"="' + sid + '") AND ("platform"="IKONOS")'}
        },
        vectorSearchQuery: function(sid)
        {
            return '"Name"="'+ sid +'"'
        }
    });
    
    var geoeyeManager = new VectorSceneManager({
        layerName: '076EFE8A3D66461BBEC1234B006DE272',
        tilePath: '',
        propertiesToTags: propertiesToTagsGeoEye,
        layerSearchQuery: function(sid)
        {
            return {query: '@Title="' + sid +'_merc.tiles"'}
        },
        vectorSearchQuery: function(sid)
        {
            return '"Name"="'+ sid +'"'
        }
    });
    
    var generateButton = $('<button/>', {'class': 'wmsSales-genbutton'}).text(_gtxt('wmsSalesPlugin.generate')).click(function()
    {
        var scenes = scenesList.val().split('\n');
                
        for (var s = 0; s < scenes.length; s++)
        {
            ikonosManager.deferredGenerate(scenes[s]);
            geoeyeManager.deferredGenerate(scenes[s]);
        }
            
        $.when(ikonosManager.generate(), geoeyeManager.generate()).done(function(sceneInfoIkonos, sceneInfoGeoeye)
        {
            var missingScenes = [],
                layerScenes = [],
                existScenes = [];
                
            for (var sid in sceneInfoIkonos)
            {
                if (sceneInfoIkonos[sid].status === 'missing' && sceneInfoGeoeye[sid].status === 'missing')
                    missingScenes.push(sid);
                else 
                {
                    existScenes.push(sceneInfoIkonos[sid].layerProperties || sceneInfoGeoeye[sid].layerProperties);
                    if (sceneInfoIkonos[sid].status === 'layer' || sceneInfoGeoeye[sid].status === 'layer')
                        layerScenes.push(sid);
                }
            }
            
            //console.log(existScenes);
            nsGmx.createMultiLayerEditorNew(_layersTree, {layers: existScenes});
            
                
            if (missingScenes.length > 0 || layerScenes.length > 0)
            {
                var canvas = $('<div/>');
                var missingContainer = $('<div/>');
                for (var s = 0; s < missingScenes.length; s++)
                    missingContainer.append($('<div/>').text(missingScenes[s]));
                    
                var layerContainer = $('<div/>');
                for (var s = 0; s < layerScenes.length; s++)
                    layerContainer.append($('<div/>').text(layerScenes[s]));
                    
                if (missingScenes.length > 0)
                    canvas.append($('<div/>').text('Не найденные сцены:')).append(missingContainer);
                    
                if (layerScenes.length > 0)
                    canvas.append($('<div/>').text('Уже созданные сцены:')).append(layerContainer);
                    
                showDialog('Результаты генерации', canvas[0], 400, 300);
            }
        })
    });
    
    var checkButton = $('<button/>', {'class': 'wmsSales-genbutton'}).text(_gtxt('wmsSalesPlugin.check')).click(function()
    {
        var scenes = scenesList.val().split('\n');
        
        for (var s = 0; s < scenes.length; s++)
        {
            ikonosManager.deferredCheck(scenes[s]);
            geoeyeManager.deferredCheck(scenes[s]);
        }
            
        var ikonosCheckDef = ikonosManager.check();
        var geoeyeCheckDef = geoeyeManager.check();
        
        $.when(ikonosCheckDef, geoeyeCheckDef).done(function(ikonosRes, geoeyeRes)
        {
            var canvas = $('<div/>');
            for (var item in ikonosRes)
                if (ikonosRes[item].status === 'missing' && geoeyeRes[item].status === 'missing')
                    canvas.append($('<div/>').text(item));

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