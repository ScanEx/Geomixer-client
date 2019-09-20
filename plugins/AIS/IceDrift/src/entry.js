require("./All.css")
require("./Locale.js")


const pluginName = 'IceDriftPlugin',
    menuId = pluginName,
    toolbarIconId = pluginName, 
    cssTable = pluginName,
    modulePath = gmxCore.getModulePath(pluginName);

const PluginPanel = require('./PluginPanel.js');

const publicInterface = {
    pluginName: pluginName,
    afterViewer: function (params, map) {

        const lmap = nsGmx.leafletMap,
        iconOpt = {
            id: 'IceDrift',
            togglable: true,
            title: _gtxt(pluginName + '.iconTitle')
        },
        icon = L.control.gmxIcon(iconOpt).on('statechange', function (ev) {
            if (!ev.target.options.isActive){
                panel.hide();
            }
            else{
                panel.show(ev.target);
            }
        });
        lmap.addControl(icon);
        const panel = new PluginPanel(icon);

        const button = document.querySelector('.leaflet-gmx-iconSvg-' + iconOpt.id);
        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" id="Слой_1" data-name="Слой 1" viewBox="0 0 24 24">
            <defs><style>.cls-1{opacity:0.5;}</style></defs><title>iceberg</title>
            <path d="M17.42,13h-12A.46.46,0,0,1,5,12.48l.29-3.93a.48.48,0,0,1,.48-.43H7.23a.47.47,0,0,0,.42-.24l.83-1.54h1L10.17,5a.27.27,0,0,1,.09-.12L11.55,3.7a.49.49,0,0,1,.54-.08L14.5,4.73a.53.53,0,0,1,.22.2l.63,1.17a.47.47,0,0,0,.42.24h.89l1.23,6.09A.46.46,0,0,1,17.42,13ZM7.06,11.07H15a.46.46,0,0,0,.47-.54L15,8.24h-.75l-1-1.88a.45.45,0,0,0-.21-.2l-.85-.39-.35.31L10.67,8.24h-1L8.88,9.77a.48.48,0,0,1-.43.25H7.14Z"/><g class="cls-1"><path d="M5.43,11.16h12a.44.44,0,0,1,.48.44l-.29,3.52a.46.46,0,0,1-.48.38H15.62a.47.47,0,0,0-.42.22l-.83,1.37h-1l-.73,1.2a.28.28,0,0,1-.09.1l-1.28,1.07a.54.54,0,0,1-.55.07l-2.41-1a.42.42,0,0,1-.21-.18l-.63-1a.53.53,0,0,0-.43-.22H6.2L5,11.65A.43.43,0,0,1,5.43,11.16Zm10.36,1.7H7.85a.43.43,0,0,0-.47.49l.47,2H8.6l1,1.68a.4.4,0,0,0,.22.18l.85.36.34-.29,1.16-1.93h1L14,14a.49.49,0,0,1,.42-.22h1.31Z"/></g><path d="M19,13H4a.48.48,0,0,1-.48-.46v-1A.48.48,0,0,1,4,11.07H19a.48.48,0,0,1,.48.46v1A.48.48,0,0,1,19,13Z"/>
            </svg>`;


    }
}

gmxCore.addModule(pluginName, publicInterface, {
    css: cssTable + '.css'
});