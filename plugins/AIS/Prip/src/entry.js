require("./All.css")
//require("./Views/PripView.css")
require("./Locale.js")


const pluginName = 'PripPlugin',
    menuId = pluginName,
    toolbarIconId = pluginName, 
    cssTable = pluginName,
    modulePath = gmxCore.getModulePath(pluginName);

const PluginPanel = require('./PluginPanel.js'),
    ViewsFactory = require('./ViewsFactory');

const publicInterface = {
    pluginName: pluginName,
    afterViewer: function (params, map) {
                   
        const options = {
            modulePath: modulePath,
            },
            viewFactory = new ViewsFactory(options),
            pluginPanel = new PluginPanel(viewFactory);
        pluginPanel.menuId = menuId;

        let sidebar = window.iconSidebarWidget,
        tab = window.createTabFunction({
                    icon: "Prip", //menuId,
                    active: "prip_sidebar-icon",
                    inactive: "prip_sidebar-icon",
                    hint: _gtxt('Prip.title')
                })()
        // tab.querySelector('.Prip').innerHTML = '<svg height="16" width="16">' +
        //     '<circle cx="8" r="2" cy="3"></circle>' +
        //     '<path d="M0 1 L8 3 L0 5Z"></path>' +
        //     '<path d="M8 3 L16 1 L16 5Z"></path>' +
        //     '<path d="M6 7 L6 10 L10 10 L10 7Z"></path>' +
        //     '<path d="M5 13 L4 16 L12 16 L11 13Z"></path></svg>';
        let tabDiv = tab.querySelector('.Prip');
        pluginPanel.sidebarPane = sidebar.setPane(
            menuId, {
                createTab: ()=>{
                    !tab.querySelector('.Prip') && tab.append(tabDiv);                    
                    tab.querySelector('.Prip').innerHTML = '<svg height="16" width="16">' +
                    '<circle cx="8" r="2" cy="3"></circle>' +
                    '<path d="M0 1 L8 3 L0 5Z"></path>' +
                    '<path d="M8 3 L16 1 L16 5Z"></path>' +
                    '<path d="M6 7 L6 10 L10 10 L10 7Z"></path>' +
                    '<path d="M5 13 L4 16 L12 16 L11 13Z"></path></svg>';
                    return tab;
                }
            }
        )
        sidebar.addEventListener('opened', function (e) {
            if (sidebar._activeTabId == menuId)
                pluginPanel.show();
        });

    }
}

gmxCore.addModule(pluginName, publicInterface, {
    css: cssTable + '.css'
});