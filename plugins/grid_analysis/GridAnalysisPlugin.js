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
            
            
        layerNames.forEach(function(layerName) {
            var layer = nsGmx.gmxMap.layersByID[layerName],
                identityField = layer.getGmxProperties().identityField,
                items = [{separator: true}];
                
            for (var menuText in menus) {
                items.push({
                    text: menuText,
                    callback: function(value, ev) {
                        var prevProps = ev.relatedEvent.gmx.properties,
                            newValue = prevProps[propName] == value ? 0 : value,
                            props = {};
                        
                        props[propName] = Number(newValue);
                        
                        nsGmx.widgets.notifications.startAction('gridAnalysis');
                        
                        _mapHelper.modifyObjectLayer(layerName, [{
                            id: prevProps[identityField],
                            properties: props
                        }]).then(function() {
                            nsGmx.widgets.notifications.stopAction('gridAnalysis', 'success', _gtxt('Сохранено'));
                        });

                    }.bind(null, menus[menuText])
                });
            }

            L.setOptions(layer, {
                contextmenu: false,
                contextmenuItems: items,
                contextmenuInheritItems: true
            });
            L.extend(layer, L.Mixin.ContextMenu);
            layer.bindContextMenu();
        });
    }
}

gmxCore.addModule('GridAnalysisPlugin', publicInterface);

})(jQuery);