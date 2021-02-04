require("./all.css");
require("./locale.js");

const pluginName = 'ImageCountPlugin',
      menuId = 'ImageCountPlugin',
      toolbarIconId = null, 
      cssTable = 'ImageCountPlugin',
      modulePath = gmxCore.getModulePath(pluginName);

const PluginPanel = require('./PluginPanel.js'),
      ViewsFactory = require('./ViewsFactory');

const publicInterface = {
    pluginName: pluginName,
    afterViewer: function (params, map) {
        const options = {
                modulePath: modulePath,
                layers: {
                    '9132DB4583944CC2836D2C416B4DC093':'Sentinel-1', 
                    '61F54CF35EC44536B527A2168BE6F5A0':'Sentinel-2',
                    'D8CFA7D3A7AA4549B728B37010C051A2':'Landsat-8'
                }
            },
            viewFactory = new ViewsFactory(options),
            pluginPanel = new PluginPanel(viewFactory);
        pluginPanel.menuId = menuId;

        let sidebar = window.iconSidebarWidget,
        tab = window.createTabFunction({
                    icon: "ImageCount", //menuId,
                    //active: "hardnav-sidebar-icon",
                    //inactive: "hardnav-sidebar-icon",
                    hint: _gtxt('ImageCount.title')
                })()

        let tabDiv = tab.querySelector('.ImageCount');
        pluginPanel.sidebarPane = sidebar.setPane(
            menuId, {
                createTab: ()=>{      
                    !tab.querySelector('.ImageCount') && tab.append(tabDiv);  
                     tab.querySelector('.ImageCount').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" version="1" viewBox="0 0 24 24" style="height: 18px;width: 18px;">
                     <path d="M 20 2 C 18.970152 2 18.141273 2.7807107 18.03125 3.78125 L 14.5625 4.78125 C 14.19654 4.3112749 13.641793 4 13 4 C 11.895431 4 11 4.8954305 11 6 C 11 7.1045695 11.895431 8 13 8 C 13.052792 8 13.104488 8.0040159 13.15625 8 L 16.53125 14.6875 C 16.440877 14.788724 16.349735 14.881869 16.28125 15 L 11.9375 14.46875 C 11.705723 13.620636 10.921625 13 10 13 C 8.8954305 13 8 13.895431 8 15 C 8 15.217462 8.0295736 15.428987 8.09375 15.625 L 4.96875 18.25 C 4.6825722 18.092012 4.3500149 18 4 18 C 2.8954305 18 2 18.895431 2 20 C 2 21.104569 2.8954305 22 4 22 C 5.1045695 22 6 21.104569 6 20 C 6 19.782538 5.9704264 19.571013 5.90625 19.375 L 9.03125 16.75 C 9.3174278 16.907988 9.6499851 17 10 17 C 10.754554 17 11.409413 16.585686 11.75 15.96875 L 16.0625 16.53125 C 16.294277 17.379364 17.078375 18 18 18 C 19.104569 18 20 17.104569 20 16 C 20 14.895431 19.104569 14 18 14 C 17.947208 14 17.895512 13.995984 17.84375 14 L 14.5 7.3125 C 14.761761 7.0130168 14.922918 6.6355416 14.96875 6.21875 L 18.4375 5.21875 C 18.80346 5.6887251 19.358207 6 20 6 C 21.104569 6 22 5.1045695 22 4 C 22 2.8954305 21.104569 2 20 2 z" style="&#10;"/>
                 </svg>`;
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
