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

var findImagesBySceneIDSync = function(sceneIDs, chunkSize)
{
    chunkSize = chunkSize || 1;
    var deferreds = [];
    
    var results = {};
    var deferred = $.Deferred();
    
    var getImageInfo = function()
    {
        if (sceneIDs.length === 0)
        {
            deferred.resolve(results);
            return;
        }
        
        var sceneID = sceneIDs.shift();
        var query = '("sceneid"="' + sceneID + '")';
        sendCrossDomainPostRequest(serverBase + 'Layer/Search.ashx', {PropQuery: query, WrapStyle: 'window'}, function(response)
        {
            if (!parseResponse(response))
            {
                results[sceneID] = {status: 'missing'};
            }
            else
            {
                if (response.Result.count === 0)
                {
                    results[sceneID] = {status: 'missing'};
                }
                else
                {
                    results[sceneID] = {status: 'layer', layerProperties: response.Result.Layers[0]};
                }
            }
            
            getImageInfo();
        })
    }
    getImageInfo();
    
    return deferred.promise();
}

var showWidget = function()
{
    var canvas = $('<div/>');
    var scenesList = $('<textarea/>', {'class': 'wmsSales-scenelist'});
    
    var generateButton = $('<button/>', {'class': 'wmsSales-genbutton'}).text(_gtxt('wmsSalesPlugin.generate')).click(function()
    {
        var scenes = scenesList.val().split('\n');
        findImagesBySceneIDSync(scenes).done(function(results)
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
            
            nsGmx.createMultiLayerEditorNew(_layersTree, {layers: layerScenes});
            
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
        findImagesBySceneIDSync(scenes).done(function(results)
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