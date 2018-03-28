+function() {var buildGUID = "ec4298cbb1ba4604b84c27f9d335c4b5";var gmxFilesList = ["gmxcore.js","DefaultPlugins.js","PluginsManager.js","translations.js","lang_ru.js","lang_en.js","utilities.js","AuthManager.js","AuthWidget.js","AsyncTaskManager.js","drawingObjectsCustomControllers.js","menu.js","ScrollTableControl.js","mapCommon.js","Controls.js","LayersTree.js","mapHelper.js","AttributeValuesProviders.js","ShpEncodingWidget.js","userObjects.js","queryTabs.js","queryExternalMaps.js","binding.js","mapLayers.js","contextMenuController.js","MapsManagerControl.js","LayersManagerControl.js","queryLoadShp.js","drawingObjects.js","fileBrowser.js","tableBrowser.js","loadServerData.js","charts.js","kmlParser.js","security.js","EditObjectControl.js","src/sqlFunctions.js","src/AttrSuggestWidget.js","src/TemporalLayerParams.js","src/QuicklookParams.js","src/LayerEditor/ManualAttrModel.js","src/LayerEditor/ManualAttrView.js","src/LayerEditor/TemporalLayerParamsWidget.js","src/LayerEditor/LayerRasterCatalogWidget.js","src/LayerEditor/LayerQuicklookWidget.js","src/AttrTable/AttrTable.js","src/AttrTable/ServerDataProvider.js","src/AttrTable/SquareCalculation.js","src/AttrTable/DefaultSearchParamsManager.js","src/GridPlugin/GridPlugin.js","src/MapExport/MapExport.js","src/BufferZones/BufferZones.js","src/IndexGrid/IndexGrid.js","src/PhotoLayer/PhotoLayer.js","CoverControl.js","CoverControl2.js","DateLayerVisibilityControl.js","DateFilteringControl.js","ClipboardController.js","PluginsEditor.js","ZoomPropertiesControl.js","HeaderLinksControl.js","ClusterParamsControl.js","LayerTagsControl.js","RCAddLayerControl.js","search.js","NotificationWidget.js","VirtualLayerManager.js","src/primary.js","src/CommonCalendarWidget/CommonCalendarWidget.js","src/SearchLogic/SearchProviders.js","src/SearchLogic/SearchLogic.js","leaflet/plugins/gmxLayers2/gmxLayers2.js","leaflet/plugins/IconSidebarControl/dist/iconSidebarWidget.js","leaflet/plugins/Leaflet.Dialog/Leaflet.Dialog.js","starter.js","version.js"];var thirdpartyList = ["jquery/jquery-1.10.2.min.js","jquery/jquery.getCSS.js","jquery/jquery.mousewheel.min.js","jquery/jquery-ui-1.10.4.min.js","jquery/jquery-ui-1.11.4-select.min.js","jquery/ui.datepicker-ru.js","jquery/jquery-ui-timepicker-addon.js","jquery/ui.timepicker-ru.js","jquery/jquery.treeview.js","jquery/handlebars.js","jquery/underscore-min.js","jquery/backbone-min.js","colorpicker/js/colorpicker.js","colorpicker/js/eye.js","colorpicker/js/utils.js","thirdparty/customscrollbar/jquery.mCustomScrollbar.js"];var cssToLoad = ["css/common.css","css/PluginEditor.css","css/print.css","css/AttrTable.css","css/SuggestWidget.css","css/search.css","css/primary.css","css/jquery-ui-1.10.4.css","css/jquery-ui-1.11.4-select.css","css/jquery-ui-1.10.4-gmx.css","css/jquery-ui-timepicker-addon.css","thirdparty/customscrollbar/jquery.mCustomScrollbar.css","css/colorpicker.css","css/menu.css","css/buttons.css","css/treeview.css","css/EditObjectControl.css","css/security.css","css/drawing.css","css/NotificationWidget.css","css/LayerQuicklookWidget.css","css/layerstylesmenu.css","css/swich-slider.css","src/adapter.css","leaflet/plugins/Leaflet.ExtSearch/src/SearchWidget.css","leaflet/plugins/IconSidebarControl/dist/iconSidebarWidget.css","css/sidebar.css","leaflet/plugins/Leaflet.Dialog/Leaflet.Dialog.css","leaflet/plugins/gmxLayers2/gmxLayers2.css","leaflet/leafletGmx.css","src/GridPlugin/GridPlugin.css","src/MapExport/MapExport.css","src/BufferZones/BufferZones.css","src/IndexGrid/IndexGrid.css","src/PhotoLayer/PhotoLayer.css","src/CommonCalendarWidget/CommonCalendarWidget.css"];var moduleFiles = {"L.ImageOverlay.Pane":"leaflet/plugins/L.ImageOverlay.Pane/src/L.ImageOverlay.Pane.js","ProfilePlugin":"src/GeoMixerAccount/ProfilePlugin.js"};﻿(function(){

var gmxJSHost = window.gmxJSHost || "";
var gmxAPIJSlist = [];
var gmxAPICSSlist = [];

if (!window.gmxVersion) {
    window.gmxVersion = {
    	"jsPath": {
    		"dist/geomixer/geomixer-src.js": 1
    	},
    	"cssPath": {
    		"dist/geomixer/geomixer.css": 1
    	}
    };
}

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