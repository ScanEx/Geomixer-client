/** Rosreestr layer plugin
*/
(function (){
    _translationsHash.addtext('rus', {
        "RosreestrPlugin.Rosreestr" : "Росреестр"
    });
    _translationsHash.addtext('eng', {
        "RosreestrPlugin.Rosreestr" : 'Rosreestr'
    });

var publicInterface = {
    pluginName: 'Rosreestr Plugin',
    
    afterViewer: function(params, map){
        var title = _gtxt('RosreestrPlugin.Rosreestr');
        var layer = L.tileLayer.Rosreestr('http://{s}.maps.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox}&size=1024,1024&bboxSR=102100&imageSR=102100&f=image', {
            tilesCRS: L.CRS.EPSG3857,
            tileSize: 1024,
            maxZoom: 30,
            minZoom: 1,
            zIndex: 1000,
            attribution: '&copy; <a href="http://rosreestr.ru" target="_blank">' + title + '</a>'
        });
        var layersControl = gmxAPI.map.controlsManager.getControl('layers');
        layersControl.addOverlay(layer, title);        
    }
}

gmxCore.addModule('RosreestrPlugin', publicInterface, {
    init: function(params, path) {
        return gmxCore.loadScriptWithCheck([{
            check: function() {return L.TileLayer.Rosreestr; },
            script: path + 'TileLayer.Rosreestr.js'
        }])
    }
});

})();