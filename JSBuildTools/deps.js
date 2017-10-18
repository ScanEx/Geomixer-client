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
    "src/PhotoLayer/PhotoLayer.js",

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
    "src/primary.js",

    "src/CommonCalendarWidget/CommonCalendarWidget.js",
    "src/SearchLogic/SearchProviders.js",
    "src/SearchLogic/SearchLogic.js",
    "leaflet/plugins/gmxLayers2/gmxLayers2.js",
    "leaflet/plugins/Leaflet.Dialog/Leaflet.Dialog.js",
    "starter.js",
    "version.js"
];

var jsFilesThirdparty = [
    "jquery/jquery-1.10.2.min.js",
    // "jquery/jquery-1.10.2.js",
    "jquery/jquery.getCSS.js",
    "jquery/jquery.mousewheel.min.js",
    "jquery/jquery-ui-1.10.4.min.js",
    // "jquery/jquery-ui-1.10.4.js",
    "jquery/jquery-ui-1.11.4-select.min.js",
    // "jquery/jquery-ui-1.11.4-select.js",
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

    "thirdparty/customscrollbar/jquery.mCustomScrollbar.js"
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
    "css/jquery-ui-1.11.4-select.css",
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
    "css/layerstylesmenu.css",
    "css/swich-slider.css",

    "src/adapter.css",
    "leaflet/plugins/Leaflet.ExtSearch/src/SearchWidget.css",
    "leaflet/plugins/IconSidebarControl/dist/iconSidebarControl.css",
    "leaflet/plugins/Leaflet.Dialog/Leaflet.Dialog.css",
    "leaflet/plugins/gmxLayers2/gmxLayers2.css",
    "leaflet/leafletGmx.css",

    "src/GridPlugin/GridPlugin.css",
    "src/MapExport/MapExport.css",
    "src/IndexGrid/IndexGrid.css",

    "src/PhotoLayer/PhotoLayer.css",
    "src/CommonCalendarWidget/CommonCalendarWidget.css"
];

var moduleFiles = {
    'L.ImageOverlay.Pane': 'leaflet/plugins/L.ImageOverlay.Pane/src/L.ImageOverlay.Pane.js',
    'ProfilePlugin': 'src/GeoMixerAccount/ProfilePlugin.js'
}

module.exports = {
    jsFiles: jsFiles,
    jsFilesThirdparty: jsFilesThirdparty,
    cssFiles: cssFiles,
    moduleFiles: moduleFiles
}
