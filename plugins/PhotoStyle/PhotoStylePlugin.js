/** Плагин для генерации стилей для слоёв, представляющих из себя наборы фотографий (для сервиса Космоагро)
*/
(function ($){
    
nsGmx.Translations.addText("rus", {
    "PhotoStylePlugin.menuTitle" : "Настроить фотографии",
    "PhotoStylePlugin.dialogTitle" : "Выберите папку с фотографиями"
});
nsGmx.Translations.addText("eng", {
    "PhotoStylePlugin.menuTitle" : "Set up photos",
    "PhotoStylePlugin.dialogTitle" : "Select folder with photos"
});

var defaultStyles = [{
    "MinZoom": 1,
    "MaxZoom": 21,
    "BalloonEnable": true,
    "DisableBalloonOnClick": false,
    "DisableBalloonOnMouseMove": true,
    "Balloon": "",
    "RenderStyle": {
        "marker": {
            "image": "http://maps.kosmosnimki.ru/GetImage.ashx?usr=lvnikita%40gmail.com&img=renders%5Crenders%5Ccamera-12.png",
            "center": true
        }
    },
    "clusters": {
        "radius": 100,
        "iterationCount": 1,
        "clusterView": {
            "maxMembers": 20,
            "radius": 40,
            "delta": 10,
            "bgStyle": {
                "fill": {
                    "color": 16776960,
                    "opacity": 20
                },
                "outline": {
                    "color": 65280,
                    "opacity": 1,
                    "thickness": 10
                }
            },
            "lineStyle": {
                "color": 393471,
                "opacity": 30,
                "thickness": 1
            }
        },
        "RenderStyle": {
            "marker": {
                "image": "http://maps.kosmosnimki.ru/GetImage.ashx?usr=lvnikita%40gmail.com&img=renders%5Crenders%5Ccamera-18.png",
                "center": true
            }
        },
        "HoverStyle": {
            "marker": {
                "image": "http://maps.kosmosnimki.ru/GetImage.ashx?usr=lvnikita%40gmail.com&img=renders%5Crenders%5Ccamera-18.png",
                "center": true
            }
        },
        "newProperties": {
            "Количество": "[objectInCluster]"
        }
    }
}];

var balloonTemplate = 
    '<div>' +
        '<img src="http://maps.kosmosnimki.ru/GetImage.ashx?usr={{user}}&img={{folder}}preview\\[filename]" alt="" />' +
    '</div><div>' +
        '<a title="Открыть снимок в полном размере" href="http://maps.kosmosnimki.ru/GetImage.ashx?usr={{user}}&img={{folder}}[filename]" target="_blank">Полный размер</a>' +
    '</div><div>' +
        '<strong>Имя файла:</strong> [filename]<br />' +
        '<strong>Время съемки:</strong> [img_date] <br />' +
        '[SUMMARY]' +
    '</div>';
    

var publicInterface = {
    pluginName: 'Photo Style Plugin',
    
    afterViewer: function(params, map) {
        nsGmx.ContextMenuController.addContextMenuElem({
            title: function() {
                return _gtxt("PhotoStylePlugin.menuTitle"); 
            },
            
            isVisible: function(context) {
                return !context.layerManagerFlag && 
                    context.elem.type === 'Vector' && 
                    context.elem.GeometryType === 'point' &&
                    _queryMapLayers.currentMapRights() === "edit";
            },
            
            clickCallback: function(context) {
                var imageFolder = nsGmx.AuthManager.getUserFolder() + 'images\\';
                var fb = new fileBrowser();
                fb.createBrowser(_gtxt('PhotoStylePlugin.dialogTitle'), [], function(path) {
                    var folder = path.split(imageFolder)[1],
                        elem = context.elem;
                    defaultStyles[0].Balloon = Mustache.render(balloonTemplate, {
                        folder: folder,
                        user: nsGmx.AuthManager.getNickname(),
                    });
                    var div;
                    if (elem.LayerID)
                        div = $(_queryMapLayers.buildedTree).find("div[LayerID='" + elem.LayerID + "']")[0];
                    else
                        div = $(_queryMapLayers.buildedTree).find("div[MultiLayerID='" + elem.MultiLayerID + "']")[0];
                    
                    div.gmxProperties.content.properties.styles = defaultStyles;
                    
                    _mapHelper.updateMapStyles(defaultStyles, elem.name);
                    
                    _mapHelper.updateTreeStyles(defaultStyles, div, context.tree, true);
                }, {restrictDir: imageFolder, startDir: imageFolder});
            }
        }, 'Layer');
    },
    
    unload: function() {
    }
}

gmxCore.addModule('PhotoStylePlugin', publicInterface);

})(jQuery);