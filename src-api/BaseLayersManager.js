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
        ,
        init: function(attr) {        // инициализация
            manager.map = attr.map;

            // Управление базовыми подложками
            //var baseLayers = {};
            //расширяем FlashMapObject
            gmxAPI.extendFMO('setAsBaseLayer', function(name, attr) {
                this.isBaseLayer = true;
                var ph = {
                    id: (attr && attr['id'] ? attr['id'] : name)
                    ,layer: this
                    ,attr: attr
                };
                manager.addItem(ph);
            });
			gmxAPI.extend(manager.map,
            {
                setMode: function(mode) {
                    manager.map.setBaseLayer(manager.alias[mode]);
                }
                ,setBaseLayer: function(name) {
                    name = manager.alias[name];
                    manager.map.needSetMode = name;
                    gmxAPI._listeners.dispatchEvent('baseLayerSelected', manager.map, name);
                }
                ,
                unSetBaseLayer: function() {
                    manager.map.setBaseLayer();
                }
                ,getBaseLayer: function() {
                    return manager.currentID;
                }
                ,baseLayerControl: {
                    isVisible: true,
                    setVisible: function(flag) {
                        //if(gmxAPI.baseLayersTools) gmxAPI.baseLayersTools.setVisible(flag);
                    },
                    updateVisibility: function() {
                        //if(gmxAPI.baseLayersTools) gmxAPI.baseLayersTools.updateVisibility();
                    },
                    repaint: function() {
                        //if(gmxAPI.baseLayersTools) gmxAPI.baseLayersTools.repaint();
                    }, 
                    getBaseLayerNames: function() {
                        return manager.getItems();
                    },
                    getBaseLayerLayers: function(name) {
                        return manager.getItem(name);
                    }
                }

            });
/*
            // Поддержка устаревшего map.baseLayerControl.onChange 
            manager.map.addListener('baseLayerSelected', function(name)	{
                if('onChange' in manager.map.baseLayerControl) manager.map.baseLayerControl.onChange(name);
            });
*/           
            manager.setActive(true);
        }
        ,
        setActive: function(flag) {         // Добавление прослушивателей событий
            if(flag) {
                // Добавление прослушивателей событий
/*
                var key = 'onAddBaseLayer';
                manager.listeners[key] = manager.map.addListener(key, function(ph) {
                    manager.addItem(ph);
//console.log('onAddBaseLayer ', ph);
                });*/
                var key = 'baseLayerSelected';
                manager.listeners[key] = manager.map.addListener(key, function(name) {
                    manager.selectItem(name);
                    if('onChange' in manager.map.baseLayerControl) manager.map.baseLayerControl.onChange(name);
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
            var id = ph['id'] || 'default';
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
            gmxAPI._listeners.dispatchEvent('onAddBaseLayer', manager.map, ph);
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
        getItem: function(name) {               // Получить базовую подложку по ID
            var id = alias[name];
            return manager.baseLayers[id];
        }
        ,setVisibleCurrentItem: function(flag) {
            var item = manager.baseLayers[manager.currentID] || null;
            if(item) {
                for(var i=0, len = item.arr.length; i<len; i++) {
                    var layer = item.arr[i];
                    layer.setVisible(flag);
                }
            }
            return flag;
        }
        ,
        selectItem: function(name) {            // Установка текущей подложки карты
            if(manager.currentID) manager.setVisibleCurrentItem(false);
            manager.currentID = '';
            var id = alias[name];
            var item = manager.baseLayers[id] || null;
            if(item) {
                manager.currentID = id;
                manager.setVisibleCurrentItem(true);
            }
            
            return item;
        }
        ,select: function(name) {
            manager.selectItem(name);
        }
	};
	gmxAPI.BaseLayersManager = manager;
    
    
})();
