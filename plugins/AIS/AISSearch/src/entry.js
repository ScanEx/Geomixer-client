let NOSIDEBAR = false,
    PRODUCTION = false,
    SIDEBAR2 = false,
    BETA = false;
if (has('NOSIDEBAR'))
    NOSIDEBAR = true;
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

Handlebars.registerHelper('aisinfoid', function (context) {
    return context.mmsi + " " + context.imo;
});

Handlebars.registerHelper('aisjson', function (context) {
    return JSON.stringify(context);
});

const pluginName = PRODUCTION ? (BETA ? 'AISPluginBeta' : 'AISPlugin') : 'AISSearch2Test',
    menuId = 'AISSearch',
    toolbarIconId = null, 
    cssTable = PRODUCTION ? (BETA ? 'AISPluginBeta' : 'AISPlugin') : 'AISSearch2',
    modulePath = gmxCore.getModulePath(pluginName);

const highlight = L.marker([0, 0], {icon:L.icon({
    className:"ais_highlight-icon", 
    iconAnchor:[12, 12], 
    iconSize:[25,25], 
    iconUrl:'plugins/ais/aissearch/highlight.png'}), zIndexOffset:1000});

const AisPluginPanel = require('./aisPluginPanel.js'),
      ViewsFactory = require('./ViewsFactory');
let ready = false;
const publicInterface = {
    pluginName: pluginName,
    afterViewer: function (params, map) {
        if (ready)
            return;
        ready = true;
console.log("ready");
        const options = {
            aisLayerID: params.aisLayerID,// || '8EE2C7996800458AAF70BABB43321FA4',	// searchById			
            screenSearchLayer: params.searchLayer,// || '8EE2C7996800458AAF70BABB43321FA4', // screen search				
            aisLastPoint: params.aisLastPoint || '303F8834DEE2449DAF1DA9CD64B748FE', // db search
            historyLayer: params.historyLayer,	
            tracksLayerID: params.tracksLayerID || '13E2051DFEE04EEF997DC5733BD69A15',

            lastPointLayerAlt: params.lastPointLayerAlt,
            tracksLayerAlt: params.tracksLayerAlt,
            historyLayerAlt: params.historyLayerAlt,
            
            modulePath: modulePath,
            highlight: highlight,
            menuId: menuId
        };
        for (var key in params) 
            if (key.toLowerCase() == "myfleet") {
                options.myFleetLayers = params[key].split(",").map(function (id) {
                    return id.replace(/\s/, "");
                });
                break;
            }
        const viewFactory = new ViewsFactory(options);
        const   layersByID = nsGmx.gmxMap.layersByID,
                setLayerClickHandler = function (layer) {
                layer.removeEventListener('click')
                layer.addEventListener('click', function (e) {
                    //console.log(e)
                    if (e.gmx && e.gmx.properties.hasOwnProperty("imo"))
                        viewFactory.infoDialogView.show(e.gmx.properties)
                })
                },
                forLayers = function (layer) {
                    try {
                    if (layer) {
                        //setLocaleDate(layer)
                        setLayerClickHandler(layer)
                    }
                    }
                    catch(e){}
                }

        for (var key in params) {
            let layersId = params[key].split(",").map(function (id) {
                return id.replace(/\s/, "");
            });
            for (var i = 0; i < layersId.length; ++i) {
//console.log(layersId[i])
                forLayers(layersByID[layersId[i]]);
            }
        }
        
        const aisPluginPanel = new AisPluginPanel(viewFactory);
        aisPluginPanel.menuId = menuId;

        if (NOSIDEBAR) {            
            let lmap = nsGmx.leafletMap,    
                iconOpt_mf = {
                id: menuId, //toolbarIconId,
                className: "VesselSearchTool",
                togglable: true,
                title: _gtxt('AISSearch2.caption')
            };
            if (toolbarIconId)
                iconOpt_mf.id = toolbarIconId;
            else
                iconOpt_mf.text = _gtxt('AISSearch2.capShort');            
            let icon_mf = L.control.gmxIcon(iconOpt_mf).on('statechange', function (ev) {
                if (ev.target.options.isActive) {
                    aisPluginPanel.show();
                    $('.ais_view .instruments').width('100%');
                    $('.ais_tab div').css('font-size', '12px');
                }
                else {
                    aisPluginPanel.hide();
                }
            });
            lmap.addControl(icon_mf);
        }
        else {
            let sidebar = SIDEBAR2 ? window.iconSidebarWidget : window.sidebarControl;
            aisPluginPanel.sidebarPane =  sidebar.setPane(
                    menuId, { 
                        position: params.showOnTop ? -100 : 0,
                        createTab: window.createTabFunction({
                            icon: menuId,
                            active: "ais_sidebar-icon-active",
                            inactive: "ais_sidebar-icon",
                            hint: _gtxt('AISSearch2.caption')
                        })
                    }
                )
            sidebar.addEventListener('opened', function (e) {
                if (sidebar._activeTabId==menuId)                
                    aisPluginPanel.show();
            });
            if (params.showOnTop) { // hack
                $('div[data-pane-id]').removeClass('iconSidebarControl-pane-active')
                sidebar._renderTabs({ activeTabId: menuId });
                setTimeout(() => sidebar.open(menuId), 50);
            }
        }

        if (location.search.search(/x=[^y=]+y=/i) != -1) {
            var a = location.search.toLowerCase().substr(1).split('&'),
                x = a.filter(function (c) { return !c.indexOf("x=") })[0].substr(2),
                y = a.filter(function (c) { return !c.indexOf("y=") })[0].substr(2)
            highlight.vessel = null;
            highlight.setLatLng([y, x]).addTo(nsGmx.leafletMap);    
            nsGmx.leafletMap.fitBounds([
                [y, x],
                [y, x]
            ], {
                    maxZoom: 9,//config.user.searchZoom,
                    animate: false
            }) 
        }
    }
};

gmxCore.addModule(pluginName, publicInterface, {
    css: cssTable + '.css'
});
