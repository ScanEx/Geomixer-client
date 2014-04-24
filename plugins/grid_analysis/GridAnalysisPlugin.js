// Вспомогательный плагин для пометки просмотренных территорий в процессе дешифрирования
// Параметры плагина:
// * layer - ID слоя
// * column - название колонки для изменения
(function ($){
 
var publicInterface = {
	afterViewer: function(params, map)
    {
        var layerName = params.layer,
            propName = params.column || 'done',
            identityField = map.layers[layerName].properties.identityField;
        map.addContextMenuItem('Просмотрено', function(lat, lng) {
            
            var loading = _img(null, [['attr','src','img/loader2.gif'],['attr','savestatus','true'],['css','margin','8px 0px 0px 10px']]);
            _($$('headerLinks'), [loading]);
            
            _mapHelper.searchObjectLayer(layerName, {
                pagesize: 1, 
                border: gmxAPI.merc_geometry({type: 'POINT', coordinates: [lat, lng]})
            }).done(function(objects) {
                if (objects.length) {
                    var props = {};
                    props[propName] = Number(!objects[0].properties[propName]);
                    _mapHelper.modifyObjectLayer(layerName, [{
                        id: objects[0].properties[identityField],
                        properties: props
                    }]).done(function() {
                        _layersTree.showSaveStatus($$('headerLinks'));
                    })
                }
            })
        })
    }
}

gmxCore.addModule('GridAnalysisPlugin', publicInterface);

})(jQuery);