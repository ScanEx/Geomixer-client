+function() {var buildGUID = "994ec49cb86e4ddf89d0d04d6dedb49f";var gmxFilesList = ["dist/ViewerCore.js"];var thirdpartyList = ["dist/thirdparty.js"];var cssToLoad = ["dist/viewer.css"];var moduleFiles = {"L.ImageOverlay.Pane":"leaflet/plugins/L.ImageOverlay.Pane/src/L.ImageOverlay.Pane.js","ProfilePlugin":"src/GeoMixerAccount/ProfilePlugin.js"};﻿(function(){

var gmxJSHost = window.gmxJSHost || "";
var gmxAPIJSlist = [];
var gmxAPICSSlist = [];

var getListFromConfig = function (pathObject, list) {
    for (var key in pathObject) {
        if (pathObject.hasOwnProperty(key)) {
            list.push(key + '?' + pathObject[key]);
        }
    }
}

window.nsGmx = {};
window.nsGmx.GeomixerFramework = true;

//подставляет к локальному имени файла хост (window.gmxJSHost) и, опционально, рандомное поле для сброса кэша (window.gmxDropBrowserCache)
var _getFileName = function( localName ) {
    var filename = gmxJSHost + localName;

    if (window.gmxDropBrowserCache) {
        filename += '?' + Math.random();
    } else if (nsGmx.buildGUID) {
        filename += '?' + nsGmx.buildGUID;
    }

	return filename;
}

// последовательно загружает все файлы js и вызывает после этого callback
// может грузить внешние файлы, если external === true;
var loadJS = function(fileList, callback, external) {
    var LABInstance = $LAB;

    if (fileList.length) {
        for (var f = 0; f < fileList.length-1; f++)
            LABInstance = LABInstance.script(external ? fileList[f] : _getFileName(fileList[f])).wait();

        LABInstance.script(external ? fileList[fileList.length-1] : _getFileName(fileList[fileList.length-1])).wait(callback);
    } else {
        callback();
    }
}

nsGmx.buildGUID = buildGUID;


if (window.gmxVersion) {
    var jsPath = window.gmxVersion.jsPath,
        cssPath = window.gmxVersion.cssPath

    getListFromConfig(jsPath, gmxAPIJSlist);
    getListFromConfig(cssPath, gmxAPICSSlist);
}

loadJS(thirdpartyList, function() {

    for (var f = 0; f < cssToLoad.length; f++) {
        $.getCSS(_getFileName(cssToLoad[f]));
    }

    loadJS(gmxAPIJSlist, function() {

        nsGmx._ = window._;

        for (var f = 0; f < cssToLoad.length; f++) {
                $.getCSS(gmxAPICSSlist[f]);
        }

        loadJS(gmxFilesList, function() {
            gmxCore.setDefaultModulesHost(gmxJSHost);

            for (var m in moduleFiles) {
                gmxCore.setModuleFile(m, gmxJSHost + moduleFiles[m]);
            }

            nsGmx.initGeoMixer();
        }, false);
    }, true);
}, false);


})();
 }()