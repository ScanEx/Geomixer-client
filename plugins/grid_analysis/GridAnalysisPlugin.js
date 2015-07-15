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
        if (!params || !params.layer) return;
        
        var layerNames = params.layer.split(','),
            propName = params.column || 'done',
            menus = parseMenuItems(params);
            
        $.each(menus, function(menuName, value) {
            map.contextmenu.insertItem({
                text: menuName, 
                callback: function(event) {
                    var defs = [];
                    
                    nsGmx.widgets.notifications.startAction('gridAnalysis');
                    
                    layerNames.forEach(function(layerName) {
                        var identityField = nsGmx.gmxMap.layersByID[layerName].getGmxProperties().identityField,
                            def = $.Deferred();
                            
                        defs.push(def);
                        
                        var mercPoint = L.Projection.Mercator.project(event.latlng);
                        _mapHelper.searchObjectLayer(layerName, {
                            pagesize: 1,
                            border: {type: 'POINT', coordinates: [mercPoint.x, mercPoint.y]}
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
                        nsGmx.widgets.notifications.stopAction('gridAnalysis', 'success', _gtxt('Сохранено'));
                    });
                }
            })
        });
    }
}

gmxCore.addModule('GridAnalysisPlugin', publicInterface);

})(jQuery);