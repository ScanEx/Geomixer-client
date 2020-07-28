let PRODUCTION = false,
    SIDEBAR2 = false,
    BETA = false;
if (has('SIDEBAR2'))
    SIDEBAR2 = true;
if (has('PRODUCTION'))
    PRODUCTION = true;
if (has('BETA'))
    BETA = true;

require("./all.css");
require("./Views/AisView.css");
require("./locale.js");
require("./Polyfill2.js");

const InfoDialogView = require('./Views/InfoDialogView'),
      Searcher = require('./Search/Searcher'),
      Toolbox = require('./Toolbox.js');

Handlebars.registerHelper('aisinfoid', function (context) {
    return context.mmsi + " " + context.imo;
});

Handlebars.registerHelper('aisjson', function (context) {
    return JSON.stringify(context);
});

const pluginName = 'AISVesselCard',//PRODUCTION ? (BETA ? 'AISPluginBeta' : 'AISPlugin') : 'AISSearch2Test',
    cssTable = 'AISVesselCard',//PRODUCTION ? (BETA ? 'AISPluginBeta' : 'AISPlugin') : 'AISSearch2',
    modulePath = gmxCore.getModulePath(pluginName).replace(/https*\:\/\/[^\/]+\/api\//, document.location.href.replace(/\/[^\/]+$/, '/'));

const highlight = L.marker([0, 0], {icon:L.icon({
    className:"ais_highlight-icon", 
    iconAnchor:[12, 12], 
    iconSize:[25,25], 
    iconUrl:'plugins/ais/aissearch/highlight.png'}), zIndexOffset:1000});

let ready = false;
const publicInterface = {
    pluginName: pluginName,
    afterViewer: function (params, map) {
        if (ready)
            return;
        ready = true;
//console.log("ready");
        const tools = new Toolbox(params),
            options = {
                aisLayerID: params.aisLayerID,// || '8EE2C7996800458AAF70BABB43321FA4',	// searchById			
                screenSearchLayer: params.searchLayer,// || '8EE2C7996800458AAF70BABB43321FA4', // screen search

                aisLastPoint: params.aisLastPoint, // || '303F8834DEE2449DAF1DA9CD64B748FE', // db search
                historyLayer: params.historyLayer,
                tracksLayerID: params.tracksLayerID, // || '13E2051DFEE04EEF997DC5733BD69A15',

                lastPointLayerAlt: params.lastPointLayerAlt,
                historyLayerAlt: params.historyLayerAlt,
                tracksLayerAlt: params.tracksLayerAlt,

                modulePath: modulePath,
                highlight: highlight,
                tools: tools
            };

        for (var key in params) 
            if (key.toLowerCase() == "myfleet") {
                options.myFleetLayers = params[key].split(",").map(function (id) {
                    return id.replace(/\s/, "");
                });
                break;
            }
        const infoDialogView = new InfoDialogView({
                tools: tools,
                aisLayerSearcher: new Searcher(options),
                modulePath: modulePath
            }),
            layersByID = nsGmx.gmxMap.layersByID,
            setLayerClickHandler = function (layer) {
                layer.removeEventListener('click')
                layer.addEventListener('click', function (e) {
//console.log('layer', e)
                    if (e.gmx && e.gmx.properties.hasOwnProperty("imo"))
                        infoDialogView.show(e.gmx.properties)
                }, false)
            },
            forLayers = function (layer) {
                try {
                    if (layer) {
                        setLayerClickHandler(layer)
                    }
                }
                catch (e) { }
            };

        for (var key in params) {
            let layersId = params[key].split(",").map(function (id) {
                return id.replace(/\s/, "");
            });
            for (var i = 0; i < layersId.length; ++i) {
//console.log(layersId[i])
                forLayers(layersByID[layersId[i]]);
            }
        }
    }
};

// warm up db connection
//fetch('//geomixer.scanex.ru/Plugins/AIS/SearchScreenAsync.ashx?minx=03&miny=0&maxx=0&maxy=0&layer=EE5587AF1F70433AA878462272C0274C&s=3020-02-13T00:00:00.000Z&e=3020-02-14T00:00:00.000Z', {credentials: 'include'});

gmxCore.addModule(pluginName, publicInterface, {
    css: cssTable + '.css'
});
