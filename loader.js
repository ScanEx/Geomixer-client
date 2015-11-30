(function(){

var gmxJSHost = window.gmxJSHost || "";

window.nsGmx = {};
window.nsGmx.GeomixerFramework = true;

//подставляет к локальному имени файла хост (window.gmxJSHost) и, опционально, рандомное поле для сброса кэша (window.gmxDropBrowserCache)
var _getFileName = function( localName )
{
    var filename = gmxJSHost + localName;
    
    if (window.gmxDropBrowserCache) {
        filename += '?' + Math.random();
    } else if (nsGmx.buildGUID){
        filename += '?' + nsGmx.buildGUID;
    }
    
	return filename;
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

nsGmx.buildGUID = buildGUID;

loadJS(thirdpartyList, function() {
    
    for (var f = 0; f < cssToLoad.length; f++) {
        $.getCSS(_getFileName(cssToLoad[f]));
    }
    
    nsGmx._ = window._;

    loadJS(gmxFilesList, function()
    {
        gmxCore.setDefaultModulesHost(gmxJSHost);
        
        for (var m in moduleFiles) {
            gmxCore.setModuleFile(m, gmxJSHost + moduleFiles[m]);
        }
        
        nsGmx.initGeoMixer();
    });
})

})();