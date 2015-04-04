/** Rosreestr layer plugin
*/
(function ($){

var publicInterface = {
    pluginName: 'Rosreestr Plugin',
    
    afterViewer: function(params, map){
        var layer = L.tileLayer.Rosreestr('http://{s}.maps.rosreestr.ru/arcgis/rest/services/Cadastre/Cadastre/MapServer/export?dpi=96&transparent=true&format=png32&bbox={bbox}&size=1024,1024&bboxSR=102100&imageSR=102100&f=image', {
            tilesCRS: L.CRS.EPSG3857,
            tileSize: 1024,
            attribution: 'Rosreestr'
        });
        _translationsHash.addtext('rus', {
            "RosreestrPlugin.Rosreestr" : "Росреестр"
        });
        _translationsHash.addtext('eng', {
            "RosreestrPlugin.Rosreestr" : 'Rosreestr'
        });
        var layersControl = gmxAPI.map.controlsManager.getControl('layers');
        layersControl.addOverlay(layer, _gtxt('RosreestrPlugin.Rosreestr'));        
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

})(jQuery);