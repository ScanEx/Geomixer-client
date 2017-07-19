window.nsGmx = window.nsGmx || {};
nsGmx._defaultPlugins =
[
    {pluginName: 'Media Plugin',         file: 'plugins/external/GMXPluginMedia/MediaPlugin2.js',        module: 'MediaPlugin2',       mapPlugin: false, isPublic: true},
        // { pluginName: 'TimeSlider', file: 'plugins/TimeSlider/TimeSlider.js', module: 'TimeSlider', mapPlugin: true, isPublic: true},
    // { pluginName: 'AttributionMenu', file: 'plugins/AttributionMenu/AttributionMenu.js', module: 'AttributionMenu', mapPlugin: true, isPublic: true},
    // {pluginName: 'Fire Plugin',          file: 'plugins/fireplugin/FirePlugin.js',                               module: 'FirePlugin',        mapPlugin: true,  isPublic: true},
    // {pluginName: 'Shift Rasters Plugin', file: 'plugins/shiftrasters/ShiftRasterPlugin.js',              module: 'ShiftRastersPlugin', mapPlugin: true,  isPublic: true},
    {pluginName: 'Cadastre',             file: 'plugins/external/GMXPluginCadastre/cadastre.js',         module: 'cadastre',           mapPlugin: true,  isPublic: true, params: {notHideDrawing: true}},
    // {pluginName: 'ScanEx catalog',       file: '../GeoMixerModules/catalog/CatalogPlugin.js',            module: 'Catalog',            mapPlugin: true,  isPublic: true},
    // {pluginName: 'GIBS Plugin',          file: 'plugins/gibs/GIBSPlugin.js',                             module: 'GIBSPlugin',         mapPlugin: true,  isPublic: true},
    {pluginName: 'BufferPlugin',         file: 'plugins/external/GMXPluginBuffer/BufferPlugin.js',       module: 'BufferPlugin',       mapPlugin: true,  isPublic: true},
    // {pluginName: 'Wind Plugin',       file: 'plugins/windplugin/WindPlugin.js',                 module: 'WindPlugin',      mapPlugin: true,  isPublic: true},
    {pluginName: 'Weather Grid Plugin',  file: 'plugins/weathergridplugin/WeatherGridPlugin.js',         module: 'WeatherGridPlugin',  mapPlugin: false,  isPublic: true},
    {pluginName: 'HelloWorld',            file: 'plugins/HelloWorld/HelloWorld.js', module: 'HelloWorld',    mapPlugin: true,  isPublic: true},
    {pluginName: 'Wikimapia',            file: 'plugins/external/GMXPluginWikimapia/WikimapiaPlugin.js', module: 'WikimapiaPlugin',    mapPlugin: true,  isPublic: true,
        params: {key: "A132989D-3AE8D94D-5EEA7FC1-E4D5F8D9-4A59C8A4-7CF68948-338BD8A8-611ED12", proxyUrl:""}
    }
];
