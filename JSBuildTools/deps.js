var jsFiles = [
    "gmxcore.js",
    "DefaultPlugins.js",
    "PluginsManager.js",
    "translations.js",
    "lang_ru.js",
    "lang_en.js",
    "utilities.js",
    "AuthManager.js",
    "AuthWidget.js",
    "AsyncTaskManager.js",
    "drawingObjectsCustomControllers.js",
    "menu.js",
    "ScrollTableControl.js",
    "mapCommon.js",
    "Controls.js",
    "LayersTree.js",
    "mapHelper.js",
    "AttributeValuesProviders.js",
    "ShpEncodingWidget.js",
    "userObjects.js",
    "queryTabs.js",
    "queryExternalMaps.js",
    "binding.js",
    "mapLayers.js",
    "contextMenuController.js",
    "MapsManagerControl.js",
    "LayersManagerControl.js",
    "queryLoadShp.js",
    "drawingObjects.js",
    "fileBrowser.js",
    "tableBrowser.js",
    "loadServerData.js",
    "charts.js",
    "kmlParser.js",
    "security.js",
    "EditObjectControl.js",

    "src/AttrSuggestWidget.js",

    "src/TemporalLayerParams.js",
    "src/QuicklookParams.js",

    "src/LayerEditor/ManualAttrModel.js",
    "src/LayerEditor/ManualAttrView.js",
    "src/LayerEditor/TemporalLayerParamsWidget.js",
    "src/LayerEditor/LayerRasterCatalogWidget.js",
    "src/LayerEditor/LayerQuicklookWidget.js",

    "src/AttrTable/AttrTable.js",
    "src/AttrTable/ServerDataProvider.js",
    "src/AttrTable/SquareCalculation.js",
    "src/AttrTable/DefaultSearchParamsManager.js",

    "src/GridPlugin/GridPlugin.js",

    "src/MapExport/MapExport.js",

    "src/IndexGrid/IndexGrid.js",
    "src/CommonCalendarWidget/CommonCalendarWidget.js",

    "CoverControl.js",
    "CoverControl2.js",
    "DateLayerVisibilityControl.js",
    "DateFilteringControl.js",
    "ClipboardController.js",
    "PluginsEditor.js",
    "ZoomPropertiesControl.js",
    "HeaderLinksControl.js",
    "ClusterParamsControl.js",
    "LayerTagsControl.js",
    "RCAddLayerControl.js",
    "search.js",
    "NotificationWidget.js",
    "VirtualLayerManager.js",
    "common_components/primary.js",
    "starter.js",
    "version.js",
    "leaflet/plugins/GMXVirtualTileLayer/GmxVirtualTileLayer.js"
];

var jsFilesThidparty = [
    "jquery/jquery-1.10.2.min.js",
    "jquery/jquery.getCSS.js",
    "jquery/jquery.mousewheel.min.js",
    "jquery/jquery-ui-1.10.4.min.js",
    "jquery/ui.datepicker-ru.js",
    "jquery/jquery-ui-timepicker-addon.js",
    "jquery/ui.timepicker-ru.js",
    "jquery/jquery.treeview.js",

    "jquery/handlebars.js",

    "jquery/underscore-min.js",
    "jquery/backbone-min.js",

    "colorpicker/js/colorpicker.js",
    "colorpicker/js/eye.js",
    "colorpicker/js/utils.js",

    "thirdparty/customscrollbar/jquery.mCustomScrollbar.js",

    "leaflet/leaflet.js",
    "leaflet/plugins/Leaflet.TileLayer.Mercator/src/TileLayer.Mercator.js",
    "leaflet/plugins/gmxBaseLayersManager/src/gmxBaseLayersManager.js",
    "leaflet/plugins/gmxBaseLayersManager/src/initBaseLayerManager.js",
    "leaflet/plugins/gmxGrid/src/Leaflet.gmxGrid.js"
];

var cssFiles = [
    "css/common.css",
    "css/PluginEditor.css",
    "css/print.css",
    "css/AttrTable.css",
    "css/SuggestWidget.css",
    "css/search.css",
    "css/primary.css",
    "css/jquery-ui-1.10.4.css",
    "css/jquery-ui-1.10.4-gmx.css",
    "css/jquery-ui-timepicker-addon.css",
    "thirdparty/customscrollbar/jquery.mCustomScrollbar.css",
    "css/colorpicker.css",
    "css/menu.css",
    "css/buttons.css",
    "css/treeview.css",
    "css/EditObjectControl.css",
    "css/security.css",
    "css/drawing.css",
    "css/NotificationWidget.css",
    "css/LayerQuicklookWidget.css",

    "common_components/adapter.css",
    "leaflet/leaflet.css",
    "leaflet/plugins/gmxControls/src/css/external.css",
    "leaflet/leafletGmx.css",
    "leaflet/plugins/Leaflet.ExtSearch/src/SearchControl.css",

    "src/GridPlugin/GridPlugin.css",
    "src/MapExport/MapExport.css",
    "src/IndexGrid/IndexGrid.css",
    "src/CommonCalendarWidget/CommonCalendarWidget.css"
];

var moduleFiles = {
    'L.ImageOverlay.Pane': 'leaflet/plugins/L.ImageOverlay.Pane/src/L.ImageOverlay.Pane.js',
    'ProfilePlugin': 'common_components/GeoMixerAccount/ProfilePlugin.js'
}

module.exports = {
    jsFiles: jsFiles,
    jsFilesThidparty: jsFilesThidparty,
    cssFiles: cssFiles,
    moduleFiles: moduleFiles
}
