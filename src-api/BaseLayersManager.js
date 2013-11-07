// Управление базовыми подложками
(function()
{
    "use strict";
	var alias = {};             // варианты наименований подложек - для совместимости
	var manager = {
        map: null               // карта
        ,alias: alias
        ,baseLayers: {}
        ,listeners: {
            onAddBaseLayer: null
            ,baseLayerSelected: null
        }
        ,currentID: null        // ID текущей подложки
        ,controll: null         // текущий контрол базовых подложек
        ,
        init: function(attr) {        // инициализация
            manager.map = attr.map;
            manager.setActive(true);
        }
        ,
        setActive: function(flag) {         // Добавление прослушивателей событий
            if(flag) {
                // Добавление прослушивателей событий
                var key = 'onAddBaseLayer';
                manager.listeners[key] = manager.map.addListener(key, function(ph) {
                    manager.addItem(ph);
//console.log('onAddBaseLayer ', ph);
                });
                key = 'baseLayerSelected';
                manager.listeners[key] = manager.map.addListener(key, function(ph) {
                    manager.selectItem(ph);
//console.log('selectItem ', ph);
                });
                
            } else {
                for(var key in manager.listeners) manager.map.removeListener(key, manager.listeners[key]);
                manager.listeners = {};
            }
        }
        ,
        removeItem: function(ph) {             // Удаление слоя из подложки - возвращает удаленный слой либо null
            var id = ph['id'];
			if(!manager.baseLayers[id] || !ph['layer']) return null;
            var layer = ph['layer'];
            var arr = manager.baseLayers[id]['arr'];
			for(var i=0, len = arr.length; i<len; i++) {
				if(layer === arr[i]) {
					return manager.baseLayers[id]['arr'].splice(i, 1)[0];
				}
			}
            return null;
        }
        ,
        addItem: function(ph) {                 // Добавление слоя в подложку
            var id = ph['id'] || 'defalult';
            var pt = manager.baseLayers[id];
            if(!pt) {                           // если нет еще подложки создаем
                pt = {
                    'id': id                    // id подложки
                    ,'arr': []                  // массив слоев подложки
                };
                alias[id] = id;
                if(ph['attr']) {
                    var lang = ph['attr']['lang'];
                    if(lang) for(var key in lang) alias[lang[key]] = id;
                }
            }
            manager.removeItem(ph);
            var layer = ph['layer'];
            pt['arr'].push(layer);
            manager.baseLayers[id] = pt;
        }
        ,
        getItems: function(flag) {              // Получить список базовых подложек
            var out = [];
			for(var id in manager.baseLayers) {
				out.push(flag ? manager.baseLayers[id] : id);
			}
            return out;
        }
        ,
        getItem: function(name) {           // Получить базовую подложку по ID
            var id = alias[name];
            return manager.baseLayers[id];
        }
        ,
        selectItem: function(name) {            // Установка текущей подложки карты
            var id = alias[name];
            if(manager.baseLayers[id]) {
                manager.currentID = id;
            }
            return manager.baseLayers[id];
        }
	};
    
	gmxAPI.BaseLayersManager = manager;
})();
