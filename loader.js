var nsGmx = {};
nsGmx.GeomixerFramework = true;

(function(){

var tt = new Date();

var gmxJSHost = window.gmxJSHost || "";

window.nsGmx = {};
window.nsGmx.GeomixerFramework = true;

//подставляет к локальному имени файла хост (window.gmxJSHost) и, опционально, рандомное поле для сброса кэша (window.gmxDropBrowserCache)
var _getFileName = function( localName )
{
	return gmxJSHost + localName + ( window.gmxDropBrowserCache ? "?" + Math.random() : "");
}

//последовательно загружает все файлы js и вызывает после этого callback
var loadJS = function(fileList, callback)
{
    var LABInstance = $LAB;
		
    if (fileList.length)
    {
        for (var f = 0; f < fileList.length-1; f++)
            LABInstance = LABInstance.script(_getFileName(fileList[f])).wait();
            
        LABInstance.script(_getFileName(fileList[fileList.length-1])).wait(callback);
    }
    else
        callback();
}

var gmxFilesList = [/*#buildinclude<load_js.txt>*/];
var thirdpartyList = [/*#buildinclude<load_thirdparty.txt>*/];

loadJS(thirdpartyList, function() {
    var cssToLoad = [/*#buildinclude<load_css.txt>*/];
    
    for (var f = 0; f < cssToLoad.length; f++) {
        $.getCSS(_getFileName(cssToLoad[f]));
    }

    nsGmx._ = _.noConflict(); //пересекается с utilities :(
    
    loadJS(gmxFilesList, function()
    {
        gmxCore.setDefaultModulesHost(gmxJSHost);
        
        console.log('script loading', new Date() - tt);
        
        nsGmx.initGeoMixer();
    });
})

})();