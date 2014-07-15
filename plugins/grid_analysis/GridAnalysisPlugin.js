// Вспомогательный плагин для пометки просмотренных территорий в процессе дешифрирования
// Параметры плагина:
// * layer - ID слоёв, через запятую
// * column - название колонки для изменения
// * menu<N> - добавить новый пункт меню и именем, равным значению параметра и которое устанавливает значение "N" в колонке
(function ($){
var parseMenuItems = function(params){
    var reg = /menu(\d+)/i;
    var res = {};
    var isMatched = false;
    for (var p in params) {
        var match = p.match(reg);
        if (match) {
            isMatched = true;
            res[params[p]] = Number(match[1]);
        }
    }
    
    if (!isMatched) {
        res = {'Просмотрено': 1};
    }
    
    return res;
}
 
var publicInterface = {
	afterViewer: function(params, map)
    {
        var layerNames = params.layer.split(','),
            propName = params.column || 'done',
            menus = parseMenuItems(params);
            
        $.each(menus, function(menuName, value) {
            map.addContextMenuItem(menuName, function(lat, lng) {
                var defs = [];
                var loading = _img(null, [['attr','src','img/loader2.gif'],['attr','savestatus','true'],['css','margin','8px 0px 0px 10px']]);
                _($$('headerLinks'), [loading]);
                
                layerNames.forEach(function(layerName) {
                    var identityField = map.layers[layerName].properties.identityField,
                        def = $.Deferred();
                        
                    defs.push(def);
                    
                    _mapHelper.searchObjectLayer(layerName, {
                        pagesize: 1,
                        border: gmxAPI.merc_geometry({type: 'POINT', coordinates: [lat, lng]})
                    }).then(function(objects) {
                        if (objects.length) {
                            var props = {};
                            var newValue = objects[0].properties[propName] == value ? 0 : value;
                            props[propName] = Number(newValue);
                            _mapHelper.modifyObjectLayer(layerName, [{
                                id: objects[0].properties[identityField],
                                properties: props
                            }]).then(function() {
                                def.resolve();
                            })
                        } else {
                            def.resolve();
                        }
                    })
                })
                $.when.apply($, defs).then(function() {
                    _layersTree.showSaveStatus($$('headerLinks'));
                })
            })
        });
    }
}

gmxCore.addModule('GridAnalysisPlugin', publicInterface);

})(jQuery);