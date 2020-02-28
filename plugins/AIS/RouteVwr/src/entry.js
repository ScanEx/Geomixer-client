require("./all.css");
require("./locale.js");
require("../routevwr_icons.svg");

const pluginName = 'RouteVwrPlugin',
      menuId = 'RouteVwrPlugin',
      toolbarIconId = null, 
      cssTable = 'RouteVwrPlugin',
      modulePath = gmxCore.getModulePath(pluginName);

const PluginPanel = require('./PluginPanel.js'),
      ViewsFactory = require('./ViewsFactory');

const publicInterface = {
    pluginName: pluginName,
    afterViewer: function (params, map) {
        const options = {
                modulePath: modulePath,
                layer: params.layer
            },
            viewFactory = new ViewsFactory(options),
            pluginPanel = new PluginPanel(viewFactory);
        pluginPanel.menuId = menuId;

        let sidebar = window.iconSidebarWidget,
        tab = window.createTabFunction({
                    icon: "RouteVwr", //menuId,
                    active: "routvwr-sidebar-icon",
                    inactive: "routvwr-sidebar-icon",
                    hint: _gtxt('RouteVwr.title')
                })()

        let tabDiv = tab.querySelector('.RouteVwr');
        pluginPanel.sidebarPane = sidebar.setPane(
            menuId, {
                createTab: ()=>{      
                    !tab.querySelector('.RouteVwr') && tab.append(tabDiv);  
                     tab.querySelector('.RouteVwr').innerHTML = `<svg><use xlink:href="#routevwr_icons_plugin-icon"></use></svg>`;
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
