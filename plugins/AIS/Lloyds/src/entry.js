let PRODUCTION = false,
    NOSIDEBAR = false,
    SIDEBAR2 = false;
if (has('PRODUCTION')) PRODUCTION = true;
if (has('NOSIDEBAR'))  NOSIDEBAR = true;
if (has('SIDEBAR2'))   SIDEBAR2 = true;

require("./all.css");
require("./Views/View.css");
require("./locale.js");
require("./Polyfill2.js");

const pluginName = PRODUCTION ? 'LloydsPlugin' : 'LloydsPluginTest',
      menuId = 'LloydsPlugin',
      toolbarIconId = null, 
      cssTable = PRODUCTION ? 'LloydsPlugin' : 'LloydsPlugin',
      modulePath = gmxCore.getModulePath(pluginName);

const PluginPanel = require('./PluginPanel.js'),
      ViewsFactory = require('./ViewsFactory');

const publicInterface = {
    pluginName: pluginName,
    afterViewer: function (params, map) {
        const options = {
            aisLastPoint: '303F8834DEE2449DAF1DA9CD64B748FE',
            modulePath: modulePath,
            },
            viewFactory = new ViewsFactory(options),
            pluginPanel = new PluginPanel(viewFactory);
        pluginPanel.menuId = menuId;

        let sidebar = window.iconSidebarWidget,
        tab = window.createTabFunction({
                    icon: "Lloyds", //menuId,
                    active: "lloyds_sidebar-icon",
                    inactive: "lloyds_sidebar-icon",
                    hint: _gtxt('Lloyds.title')
                })();
        //tab.querySelector('.Lloyds').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path d="M13.13,0H0.88A0.83,0.83,0,0,0,0,.88V13.13A0.83,0.83,0,0,0,.88,14H13.13A0.83,0.83,0,0,0,14,13.13V0.88A0.83,0.83,0,0,0,13.13,0ZM12.25,12.25H1.75V1.75h10.5v10.5Z"/><rect x="3.5" y="4.38" width="7" height="1.75"/><rect x="3.5" y="7.88" width="7" height="1.75"/></svg>';
        let tabDiv = tab.querySelector('.Lloyds');
        pluginPanel.sidebarPane = sidebar.setPane(
            menuId, {
                createTab: ()=>{
                    !tab.querySelector('.Lloyds') && tab.append(tabDiv);
                    tab.querySelector('.Lloyds').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path d="M13.13,0H0.88A0.83,0.83,0,0,0,0,.88V13.13A0.83,0.83,0,0,0,.88,14H13.13A0.83,0.83,0,0,0,14,13.13V0.88A0.83,0.83,0,0,0,13.13,0ZM12.25,12.25H1.75V1.75h10.5v10.5Z"/><rect x="3.5" y="4.38" width="7" height="1.75"/><rect x="3.5" y="7.88" width="7" height="1.75"/></svg>';
                    return tab;
                }
            }
        )
        sidebar.addEventListener('opened', function (e) {
            if (sidebar._activeTabId == menuId)
                pluginPanel.show();
        });
    }
};

gmxCore.addModule(pluginName, publicInterface, {
    css: cssTable + '.css'
});
