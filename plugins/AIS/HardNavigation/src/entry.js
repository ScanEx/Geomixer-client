let PRODUCTION = false;
if (has('PRODUCTION')) PRODUCTION = true;

require("./all.css")
require("./Views/View.css")
require("./locale.js")

// Handlebars.registerHelper('aisinfoid', function (context) {
//     return context.mmsi + " " + context.imo;
// });

// Handlebars.registerHelper('aisjson', function (context) {
//     return JSON.stringify(context);
// });

const pluginName = PRODUCTION ? 'HardNavigationPlugin' : 'HardNavigationPluginTest',
      menuId = 'HardNavigationPlugin',
      toolbarIconId = null, 
      cssTable = PRODUCTION ? 'HardNavigationPlugin' : 'HardNavigationPlugin',
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
                    icon: "HardNavigation", //menuId,
                    active: "hardnav-sidebar-icon",
                    inactive: "hardnav-sidebar-icon",
                    hint: _gtxt('HardNavigation.title')
                })()
        tab.querySelector('.HardNavigation').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path d="M13.13,0H0.88A0.83,0.83,0,0,0,0,.88V13.13A0.83,0.83,0,0,0,.88,14H13.13A0.83,0.83,0,0,0,14,13.13V0.88A0.83,0.83,0,0,0,13.13,0ZM12.25,12.25H1.75V1.75h10.5v10.5Z"/>
        <rect x="2" y="7" width="20" height="1" transform="rotate(45 2 7)"></rect>
        <rect x="2" y="3" width="20" height="1" transform="rotate(45 2 3)"></rect>
        <rect x="2" y="-1" width="20" height="1" transform="rotate(45 2 -1)"></rect>
        <rect x="2" y="-5" width="20" height="1" transform="rotate(45 2 -5)"></rect>   </svg>`;
        pluginPanel.sidebarPane = sidebar.setPane(
            menuId, {
                createTab: ()=>{
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
