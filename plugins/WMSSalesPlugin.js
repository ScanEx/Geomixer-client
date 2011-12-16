(function ($, map){

_translationsHash.addtext("rus", {
	"Генерация слоёв по сценам" : "Генерация слоёв по сценам"
});
_translationsHash.addtext("eng", {
	"Генерация слоёв по сценам" : "Generate layers using scenes"
});

var showWidget = function()
{
    var canvas = $('<div/>');
    var scenesList = $('<textarea/>', {'class': 'wmsSales-scenelist'});
    var baseFolderInput = $('<input/>', {'class': 'wmsSales-basefolder'});
    var coverageLayerInput = $('<input/>', {'class': 'wmsSales-coveragelayer'});
    
    var generateButton = $('<button/>', {'class': 'wmsSales-genbutton'}).text('Генерить слои').click(function()
    {
        var scenes = scenesList.val().split('\n');
        var folderTemplate = baseFolderInput.val();
        
        for (var s = 0; s < scenes.length; s++)
        {
            (function(curSceneName){
                var curFolder = folderTemplate.replace("[SCENE]", curSceneName);
                
                var searchString = '"Name"="'+ curSceneName +'"';
                sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&layer=" + coverageLayerInput.val() + "&page=0&pagesize=1&orderby=ogc_fid&geometry=true&query=" + encodeURIComponent(searchString), function(response)
                {
                    if (!parseResponse(response))
                    {
                        console.log('Error: ' + curSceneName);
                        return;
                    }
                    
                    var geom = JSON.stringify(response.Result.values[0][0]);
                    var dateString = response.Result.values[0][10];
                    
                    var requestParams = {
                        WrapStyle: "window",
                        Title: "wms_" + curSceneName,
                        Copyright: "",
                        Legend: "",
                        Description: "",
                        Date: $.datepicker.formatDate("dd.mm.yy", $.datepicker.parseDate("yy-mm-dd", dateString)),
                        TilePath: curFolder,
                        BorderFile: '',
                        BorderGeometry: geom,
                        MapName: _mapHelper.mapProperties.name
                    }
                    
                    sendCrossDomainPostRequest(serverBase + "RasterLayer/Insert.ashx", requestParams, function(response)
                    {
                        if (!parseResponse(response))
                            return;
                            
                        _mapHelper.asyncTasks[response.Result.TaskID] = true;
                        _queryMapLayers.asyncCreateLayer(response.Result, requestParams.Title);
                    });
                });
            })(scenes[s]);
        }
    });
    
    canvas
        .append($("<div/>").text("Список сцен:")).append(scenesList)
        .append($("<div/>").text("Шаблон папки ('[SCENE]' - имя сцены):")).append(baseFolderInput)
        .append($("<div/>").text("Слой спутникого покрытия:")).append(coverageLayerInput)
        .append(generateButton);
        
    showDialog(_gtxt("Генерация слоёв по сценам"), canvas[0], 400, 400);
}

var afterViewer = function(params)
{
    _menuUp.addChildItem({id: 'wmsSales', title:_gtxt('Генерация слоёв по сценам'), func: showWidget}, 'instrumentsMenu');
}

var publicInterface = {
	afterViewer: afterViewer
}

gmxCore.addModule("WMSSalesPlugin", publicInterface, 
    { init: function(module, path)
        {
            var doLoadCss = function()
            {
                path = path || window.gmxJSHost || "";
                $.getCSS(path + "WMSSalesPlugin.css");
            }
            
            if ('getCSS' in $)
                doLoadCss();
            else
                $.getScript(path + "../jquery/jquery.getCSS.js", doLoadCss);
        }
    }
);

})(jQuery, globalFlashMap)