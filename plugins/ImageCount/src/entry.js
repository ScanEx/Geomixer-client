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
                     tab.querySelector('.ImageCount').innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" class="svgIcon" xmlns="http://www.w3.org/2000/svg">
                     <path d="M11.0181 0H0.847543C0.379458 0 0 0.379203 0 0.846973V13.5516C0 14.0193 0.379458 14.3985 0.847543 14.3985H11.0181C11.4861 14.3985 11.8656 14.0193 11.8656 13.5516V0.846973C11.8656 0.379203 11.4861 0 11.0181 0Z"></path>
                     <path d="M19.374 6.071L13.815 4.56763L13.3726 6.20313L18.1188 7.48545L15.238 18.1133L5.42009 15.4614L4.97852 17.0969L15.6152 19.9707C15.7226 19.9997 15.8348 20.0072 15.9451 19.9929C16.0555 19.9785 16.162 19.9426 16.2585 19.8872C16.355 19.8317 16.4396 19.7578 16.5075 19.6697C16.5754 19.5816 16.6253 19.481 16.6543 19.3736L19.9707 7.10939C20.0293 6.89263 19.9994 6.66148 19.8875 6.46676C19.7756 6.27205 19.5909 6.1297 19.374 6.071Z"></path>
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
