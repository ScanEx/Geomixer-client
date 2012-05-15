(function ($, map){

var g_tagMetaInfo = null;

_translationsHash.addtext("rus", {
	"wmsSalesPlugin.menuTitle" : "Генерация слоёв по сценам",
	"wmsSalesPlugin.coverageTitle" : "Выбор спутникого покрытия:",
	"wmsSalesPlugin.sceneList" : "Список сцен:",
	"wmsSalesPlugin.generate" : "Генерить слои"
});
_translationsHash.addtext("eng", {
	"wmsSalesPlugin.menuTitle" : "Generate layers using scenes",
    "wmsSalesPlugin.coverageTitle" : "Select coverage layer:",
	"wmsSalesPlugin.sceneList" : "Scenes:",
	"wmsSalesPlugin.generate" : "Generate layers"
});

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

var createIkonosLayer = function(curSceneName)
{
    if (curSceneName == "") return;
        
    var ikonosLayerName = '5D1858A954544BA892E182F81461A361';
    var ikonosTilePath = 'G:\\Piccolo\\[SCENE]_tiles';
    
    var query = encodeURIComponent('("sceneid"="' + curSceneName + '") AND ("platform"="IKONOS")');
    sendCrossDomainJSONRequest(serverBase + 'Layer/Search.ashx?count=true&PropQuery=' + query, function(response)
    {
        if (!parseResponse(response))
            return;
            
        if (response.Result.count > 0)
        {
            console && console.log('Already exists: ' + curSceneName);
            return;
        }
            
        var searchString = '"Name"="'+ curSceneName +'"';
        
        sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&layer=" + ikonosLayerName + "&page=0&pagesize=1&orderby=ogc_fid&geometry=true&query=" + encodeURIComponent(searchString), function(response)
        {
            if (!parseResponse(response))
            {
                console && console.log('Error: ' + curSceneName);
                return;
            }
            
            if (response.Result.values.length == 0)
            {
                console && console.log('Unknown scene: ' + curSceneName);
                return;
            }
            
            var curFolder = ikonosTilePath.replace("[SCENE]", curSceneName);
            var properties = {};
            
            for (var f = 0; f < response.Result.fields.length; f++)
                properties[response.Result.fields[f]] = response.Result.values[0][f];
            
            var geom = JSON.stringify(properties['geomixergeojson']);
            
            var requestParams = {
                WrapStyle: "window",
                Title: "wms_ikonos_" + curSceneName,
                Copyright: "",
                Legend: "",
                Description: "",
                MetaProperties: JSON.stringify(propertiesToTagsIkonos(properties)),
                TilePath: curFolder,
                BorderFile: '',
                BorderGeometry: geom,
                MapName: _mapHelper.mapProperties.name
            }
            
            // console.log(requestParams);
            sendCrossDomainPostRequest(serverBase + "RasterLayer/Insert.ashx", requestParams, function(response)
            {
                if (!parseResponse(response))
                    return;
                    
                _mapHelper.asyncTasks[response.Result.TaskID] = true;
                _queryMapLayers.asyncCreateLayer(response.Result, requestParams.Title);
            });
        });
    });
}

var showWidget = function()
{
    var canvas = $('<div/>');
    var scenesList = $('<textarea/>', {'class': 'wmsSales-scenelist'});
    
    var selectLayer = $('<select/>', {'class': 'wmsSales-select selectStyle'}).append($('<option/>').val('picollo').text('IKONOS Piccolo'));
    
    var generateButton = $('<button/>', {'class': 'wmsSales-genbutton'}).text(_gtxt('wmsSalesPlugin.generate')).click(function()
    {
        var scenes = scenesList.val().split('\n');
                
        for (var s = 0; s < scenes.length; s++)
            createIkonosLayer(scenes[s]);
    });
    
    canvas
        .append($("<div/>").text(_gtxt("wmsSalesPlugin.sceneList"))).append(scenesList)
        .append($("<div/>").text(_gtxt("wmsSalesPlugin.coverageTitle"))).append(selectLayer)
        .append(generateButton);
        
    showDialog(_gtxt('wmsSalesPlugin.menuTitle'), canvas[0], 400, 400);
}

var publicInterface = 
{
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

})(jQuery)