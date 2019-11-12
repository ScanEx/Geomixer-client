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

        let tabDiv = tab.querySelector('.HardNavigation');
        pluginPanel.sidebarPane = sidebar.setPane(
            menuId, {
                createTab: ()=>{      
                    !tab.querySelector('.HardNavigation') && tab.append(tabDiv);  
                     tab.querySelector('.HardNavigation').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="20" height="20"><path d="M 13.13 0 H 0.88 A 0.83 0.83 0 0 0 0 0.88 V 13.13 A 0.83 0.83 0 0 0 0.88 14 H 13.13 A 0.83 0.83 0 0 0 14 13.13 V 0.88 A 0.83 0.83 0 0 0 13.13 0 Z M 12.25 12.25 H 1.75 V 1.75 h 10.5 v 10.5 Z" />
                     <rect transform="rotate(45 2 7)" x="2" y="7" width="8" height="1" />
                     <rect transform="rotate(45 2 3)" x="2" y="3" width="14" height="1" />
                     <rect transform="rotate(45 2 -1)" x="4" y="-1" width="14" height="1" />
                     <rect transform="rotate(45 2 -5)" x="10" y="-5" width="8" height="1" />   </svg>`;
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
