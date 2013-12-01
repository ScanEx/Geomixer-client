/** Управление базовыми подложками

Позволяет управлять списком базовых подложек. 

Базовая подложка - массив слоев отображаемых в качестве подложки карты.

@memberof map.baseLayersManager
*/
(function()
{
    "use strict";
	var alias = {};             // варианты наименований подложек - для совместимости
	var manager = {
        map: null               // карта
        ,arr: {}
        ,zIndex: []
        ,currentID: null        // ID текущей подложки
        ,
        init: function(map) {        // инициализация
            manager.map = map;
            gmxAPI.extendFMO('setAsBaseLayer', function(name, attr) {
                this.isBaseLayer = true;
                var id = (attr && attr.id ? attr.id : name);
                var ruTitle = (attr && attr.lang && attr.lang.ru ? attr.lang.ru : name);
                var enTitle = (attr && attr.lang && attr.lang.en ? attr.lang.en : name);
                var baseLayers = manager.add(id, ruTitle, enTitle);
                baseLayers.addLayer(this);
            });
			gmxAPI.extend(manager.map,
            {
                setMode: manager.setCurrent
                ,setBaseLayer: manager.setCurrent
                ,
                unSetBaseLayer: function() {
                    manager.map.setBaseLayer();
                }
                ,getBaseLayer: function() {
                    return manager.currentID;
                }
                ,baseLayerControl: {
                    isVisible: true,
                    /**
                     * @deprecated Использовать map.baseLayersManager.getItems()
                     */
                    getBaseLayerNames: function() {
                        return manager.getItems();
                    },
                    /**
                     * @deprecated Использовать map.baseLayersManager.getLayers()
                     */
                    getBaseLayerLayers: function(name) {
                        return manager.getItem(name).arr;
                    }
                }
            });
        }
        ,
        removeItem: function(id, layer) {             // Удаление слоя из подложки - возвращает удаленный слой либо null
            var baseLayers = manager.arr[id];
			if(!baseLayers || !layer) return null;
            var arr = baseLayers.arr;
            for(var i=0, len = baseLayers.arr.length; i<len; i++) {
                if(layer === baseLayers.arr[i]) {
                    if(len === 1) {
                        baseLayers.isVisible = false;
                        gmxAPI._listeners.dispatchEvent('onRemoveBaseLayer', manager.map, id);
                    }
                    return baseLayers.arr.splice(i, 1)[0];
                }
            }
            return null;
        }
        ,
        add: function(id, ruTitle, enTitle) {           // Добавление подложки
            if(!id) id = 'default';
            var pt = manager.arr[id];
            if(!pt || typeof(pt) !== 'object') {        // если нет еще подложки создаем
                pt = {
                    id: id || 'default'                 // id подложки
                    ,isVisible: true                    // видимость подложки
                    ,arr: []                            // массив слоев подложки
                    ,rus: ruTitle || id                 // title подложки 
                    ,eng: enTitle || id
                    ,addLayer: function(layer) {
                        manager.removeItem(id, layer);
                        this.arr.push(layer);
                        if(!layer.backgroundColor) layer.backgroundColor = 0xffffff;
                        gmxAPI._listeners.dispatchEvent('onAddBaseLayer', manager.map, this);
                    }
                    ,removeLayer: function(layer) {
                        manager.removeItem(id, layer);
                    }
                };
                if(ruTitle) alias[ruTitle] = id;
                alias[id] = id;
                if(ruTitle) alias[ruTitle] = id;
                if(enTitle) alias[enTitle] = id;
                manager.zIndex.push(id);
                manager.arr[id] = pt;
            }
            return pt;
        }
        ,
        getItems: function(flag) {              // Получить список базовых подложек
            var out = [];
			for(var id in manager.arr) {
				out.push(flag ? manager.arr[id] : id);
			}
            return out;
        }
        ,
        getItem: function(name) {               // Получить базовую подложку по ID
            var id = alias[name];
            return manager.arr[id];
        }
        ,setVisibleCurrentItem: function(flag) {
            var item = manager.arr[manager.currentID] || null;
            if(item) {
                for(var i=0, len = item.arr.length; i<len; i++) {
                    var layer = item.arr[i];
                    layer.setVisible(flag);
                }
            }
            return flag;
        }
        ,setCurrent: function(name) {            // Установка текущей подложки карты
            if(manager.currentID) manager.setVisibleCurrentItem(false);
            manager.currentID = '';
            var id = alias[name];
            var item = manager.arr[id] || null;
            if(item) {
                manager.currentID = id;
                manager.setVisibleCurrentItem(true);
            }
            gmxAPI._listeners.dispatchEvent('baseLayerSelected', manager.map, id);
            return item;
        }
        ,remove: function(name) {            // Удалить базовую подложку
            var id = alias[name];
            if(id === manager.currentID) manager.setVisibleCurrentItem(false);
            manager.currentID = '';
            for(var i=0, len = manager.zIndex.length; i<len; i++) {
                if(id === manager.zIndex[i]) {
                    manager.zIndex.splice(i, 1);
                    break;
                }
            }
            var item = manager.arr[id];
            delete manager.arr[id];
            gmxAPI._listeners.dispatchEvent('onRemoveBaseLayer', manager.map, id);
            return item;
        }
        ,toggleVisibility: function(id) {
            manager.setCurrent(manager.currentID === id ? '' : id);
        }
	};
    /**
     * Описание обьекта BaseLayers.
     * @typedef {Object} BaseLayers
     * @property {String} id - Идентификатор подложки.
     * @property {boolean} isVisible - Флаг видимости(по умолчанию true).
     * @property {String} rus - Наименование русскоязычное.
     * @property {String} eng - Наименование англоязычное.
     * @property {Array} arr - Массив слоев подложки.
     * @property {Function} addLayer - Ф-ция добавления слоя в подложку.
     * @property {Function} removeLayer - Ф-ция удаления слоя из подложки.
     */
    
    /**
     * Менеджер базовых подложек (для карты создан обьект map.baseLayersManager).
     * @constructor BaseLayersManager
     * @param {Object} map обьект карта
     */
	gmxAPI.BaseLayersManager = function(map) {
        manager.init(map);
        return {
            /** Добавить базовую подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {String} ruTitle наименование русскоязычное.
            * @param {String} enTitle наименование англоязычное.
            * @returns {BaseLayers} возвращает обьект подложки
            */
            add: function(id, ruTitle, enTitle) {
                return manager.add(id, ruTitle, enTitle);
            },
            /** Удалить базовую подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {BaseLayers} возвращает удаленную подложку
            */
            remove: function(id) {
                return manager.remove(id);
            },
            /** Получить базовую подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {BaseLayers|null} возвращает подложку(если несуществует null).
            */
            getItem: function(id) {
                return manager.arr[id] || null;
            },
            /** Получить список всех базовых подложек
            * @memberOf BaseLayersManager#
            * @returns {Array} BaseLayers возвращает массив подложек.
            */
            getItems: function() {
                var out = [];
                for(var i=0, len = manager.zIndex.length; i<len; i++) {
                    var id = manager.zIndex[i];
                    out.push(manager.arr[id]);
                }
                return out;
            },
            /** Установить текущую подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {BaseLayers} возвращает текущую подложку
            */
            setCurrent: function(id) {
                return manager.setCurrent(id);
            },
            /** Отменить установку текущую подложку
            * @memberOf BaseLayersManager#
            */
            unSetCurrent: function() {
                manager.setCurrent();
            },
            /** Получить идентификатор текущей подложки
            * @memberOf BaseLayersManager#
            * @returns {String} возвращает идентификатор текущей подложки.
            */
            getCurrent: function() {
                return manager.currentID;
            },
            /** Добавить слой в базовую подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {Layer} layer обьект слоя.
            * @returns {boolean} возвращает false если подложка не найдена иначе true.
            */
            addLayer: function(id, layer) {
                var baseLayers = this.getItem(id);
                if(!baseLayers) return false;
                baseLayers.arr.push(layer);
                gmxAPI._listeners.dispatchEvent('onAddBaseLayer', manager.map, baseLayers);
                return true;
            },
            /** Удалить слой из базовой подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {Layer} layer обьект слоя.
            */
            removeLayer: function(id, layer) {
                manager.removeItem(id, layer);
                if(id === manager.currentID) {
                    layer.setVisible(false);
                }
            },
            /** Получить список слоев базовой подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {Array} BaseLayers возвращает массив слоев базовой подложки.
            */
            getLayers: function(id) {
                return manager.getItem(id).arr;
            }
        }
    };
})();
