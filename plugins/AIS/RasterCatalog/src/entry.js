require("./All.css");
require("./Locale.js");
const Constants = require("./Constants.js");

const pluginName = Constants.PLUGIN_NAME,
    menuId = Constants.MENU_ID,
    cssTable = Constants.CSS_TABLE,
    modulePath = Constants.MODULE_PATH;

const PluginPanel = require('./RcPluginPanel.js'),
    ViewsFactory = require('./ViewsFactory');

const publicInterface = {
    pluginName: pluginName,
    afterViewer: function (params, map) { 
/*
        params.Groups =  `NOAA-20, MODIS`;
        params.Layers1 = `9C267B2AC5084155A3FD0CAF2B23E420, 
            07208267CAE54F44B0D6B61065E36FA7,
        8C549B3B6D3741DD98E480CAE02F2798`;
        params.Layers2 = `A66138C36BA249D68183B09232AC3194,
                533FCC7439DA4A2EB97A2BE77887A462,
                60EA8F7A8C1B4AC38B59529695605276,
                EB271FC4D2AD425A9BAA78ADEA041AB9`;
*/

        let groups = [],
        layers = [];
        if (params.Groups)
            groups = params.Groups.split(',').map(g=>g.replace(/^\s+/, '').replace(/\s+$/, ''));
        groups.forEach((g,i)=>{
            let a =  params[`Layers${i+1}`].split(',').map(g=>g.replace(/^\s+/, '').replace(/\s+$/, ''));
            layers.push(a);
        });
//console.log(groups, layers);

        const options = {
            modulePath: modulePath,            
            groups: groups, 
            layers: layers
            },
            viewFactory = new ViewsFactory(options),
            pluginPanel = new PluginPanel(viewFactory, groups);
        pluginPanel.menuId = menuId;

        let sidebar = window.iconSidebarWidget,
        tab = window.createTabFunction({
                    icon: "RasterCatalog", //menuId,
                    active: "RasterCatalog_sidebar-icon",
                    inactive: "RasterCatalog_sidebar-icon",
                    hint: _gtxt('RasterCatalog.title')
                })()

        let tabDiv = tab.querySelector('.RasterCatalog');
        pluginPanel.create(sidebar.setPane(
            menuId, {
                position: params.showOnTop ? -100 : 0,
                createTab: ()=>{
                    !tab.querySelector('.RasterCatalog') && tab.append(tabDiv);                    
                    tab.querySelector('.RasterCatalog').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" style="width:16px; height:16px" viewBox="0 0 16 16">' +
                    '<path d="M15.15,0H0.88A0.83,0.83,0,0,0,0,.88V15.15A0.83,0.83,0,0,0,.88,16H15.15A0.83,0.83,0,0,0,16,15.15V0.88A0.83,0.83,0,0,0,15.15,0ZM14.25,14.25H1.75V1.75h12.5v12.5Z"/>' +
                    '<circle cx="7" cy="5" r="1.4"/>' +
                    '<path d="M 3 10 L 6 7 L 8 10 L 13 5 L 13 7 L 8 12 L 6 9 L 3 12 z"/>' +
                    '</svg>';
                    return tab;
                }
            }
        ));
        sidebar.addEventListener('opened', function (e) {
            if (sidebar._activeTabId == menuId)
                pluginPanel.show();
        });
        
        if (params.showOnTop) { // hack
            $('div[data-pane-id]').removeClass('iconSidebarControl-pane-active')
            sidebar._renderTabs({ activeTabId: menuId });
            setTimeout(() => sidebar.open(menuId), 50);
        }

    }
}

gmxCore.addModule(pluginName, publicInterface, {
    css: cssTable + '.css'
});