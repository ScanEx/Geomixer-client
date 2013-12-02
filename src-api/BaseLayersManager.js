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
                     * @deprecated Использовать map.baseLayersManager.getAll()
                     */
                    getBaseLayerNames: function() {
                        return manager.getAll();
                    },
                    /**
                     * @deprecated Использовать map.baseLayersManager.getLayers()
                     */
                    getBaseLayerLayers: function(name) {
                        return manager.get(name).arr;
                    }
                }
            });
        }
        ,
        removeLayer: function(id, layer) {             // Удаление слоя из подложки - возвращает удаленный слой либо null
            var baseLayers = manager.arr[id];
			if(!baseLayers || !layer) return null;
            var arr = baseLayers.arr;
            for(var i=0, len = baseLayers.arr.length; i<len; i++) {
                if(layer === baseLayers.arr[i]) {
                    if(len === 1) {
                        baseLayers.isVisible = false;
                        gmxAPI._listeners.dispatchEvent('onChange', manager.map.baseLayersManager, baseLayers);
                    }
                    return baseLayers.arr.splice(i, 1)[0];
                }
            }
            return null;
        }
        ,
        add: function(id, ruTitle, enTitle) {           // Добавление подложки
            if(!id || manager.arr[id]) return null;
            var pt = {
                id: id || 'default'                 // id подложки
                ,isVisible: true                    // видимость подложки
                ,arr: []                            // массив слоев подложки
                ,rus: ruTitle || id                 // title подложки 
                ,eng: enTitle || id
                ,addLayer: function(layer) {
                    manager.removeLayer(id, layer);
                    this.arr.push(layer);
                    if(!layer.backgroundColor) layer.backgroundColor = 0xffffff;
                    gmxAPI._listeners.dispatchEvent('onChange', manager.map.baseLayersManager, this);
                    return true;
                }
                ,removeLayer: function(layer) {
                    manager.removeLayer(id, layer);
                    gmxAPI._listeners.dispatchEvent('onChange', manager.map.baseLayersManager, this);
                }
            };
            if(ruTitle) alias[ruTitle] = id;
            if(enTitle) alias[enTitle] = id;
            manager.zIndex.push(id);
            manager.arr[id] = pt;
            gmxAPI._listeners.dispatchEvent('onAdd', manager.map.baseLayersManager, pt);
            return pt;
        }
        ,
        getAll: function(flag) {              // Получить список базовых подложек
            var out = [];
			for(var id in manager.arr) {
				out.push(flag ? manager.arr[id] : id);
			}
            return out;
        }
        ,
        get: function(id) {               // Получить базовую подложку по ID
            return manager.arr[id] || null;
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
        ,
        getIDByName: function(name) {
            return alias[name] || null;
        }
        ,
        setCurrent: function(id) {            // Установка текущей подложки карты
            if(manager.currentID) manager.setVisibleCurrentItem(false);
            manager.currentID = '';
            var item = manager.arr[id] || null;
            if(item) {
                manager.currentID = id;
                manager.setVisibleCurrentItem(true);
            }
            gmxAPI._listeners.dispatchEvent('onSetCurrent', manager.map.baseLayersManager, item);
            return item;
        }
        ,remove: function(id) {            // Удалить базовую подложку
            if(id === manager.currentID) manager.setVisibleCurrentItem(false);
            manager.currentID = '';
            for(var i=0, len = manager.zIndex.length; i<len; i++) {
                if(id === manager.zIndex[i]) {
                    manager.zIndex.splice(i, 1);
                    break;
                }
            }
            var item = manager.arr[id] || null;
            if(item) {
                delete manager.arr[id];
                gmxAPI._listeners.dispatchEvent('onRemove', manager.map.baseLayersManager, item);
            }
            return item;
        }
        ,toggleVisibility: function(id) {
            manager.setCurrent(manager.currentID === id ? '' : id);
        }
	};
    /**
     * Обьект базовой подложки.
     * @typedef {Object} BaseLayer
     * @property {String} id - Идентификатор подложки.
     * @property {boolean} isVisible - Флаг видимости(по умолчанию true).
     * @property {String} rus - Наименование русскоязычное.
     * @property {String} eng - Наименование англоязычное.
     * @property {Layer[]} arr - Массив слоев подложки.
     * @property {function(layer:Layer)} addLayer - Ф-ция добавления слоя в подложку.
     * @property {function(layer:Layer)} removeLayer - Ф-ция удаления слоя из подложки.
     */
    
    /**
     * Менеджер базовых подложек (создаётся в API и доступен через свойство карты map.baseLayersManager).
     * @constructor BaseLayersManager
     */
            /**
             * События.
             * 
             * @event module:BaseLayersManager#
             * @property {number} velocity - The snowball's velocity, in meters per second.
             */
	gmxAPI.BaseLayersManager = function(map) {
        manager.init(map);
        return {
            /** Добавить базовую подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {String} ruName наименование русскоязычное.
            * @param {String} enName наименование англоязычное.
            * @returns {BaseLayer|null} возвращает обьект добавленной подложки или null если подложка с данным идентификатором уже существует.
            */
            add: function(id, ruName, enName) {
                return manager.add(id, ruName, enName);
            },
            /** Удалить базовую подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {BaseLayer|null} возвращает удаленную подложку если она найдена.
            */
            remove: function(id) {
                return manager.remove(id);
            },
            /** Получить базовую подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {BaseLayer|null} возвращает подложку если существует иначе null).
            */
            get: function(id) {
                return manager.arr[id] || null;
            },
            /** Получить список всех базовых подложек
            * @memberOf BaseLayersManager#
            * @returns {BaseLayer[]} возвращает массив всех подложек.
            */
            getAll: function() {
                var out = [];
                for(var i=0, len = manager.zIndex.length; i<len; i++) {
                    var id = manager.zIndex[i];
                    out.push(manager.arr[id]);
                }
                return out;
            },
            /** Установить текущую подложку по идентификатору
            * @memberOf BaseLayersManager#
            * @param {String=} id идентификатор подложки, если заданный идентификатор подложки отсутствует текущая подложка отключается.
            * @returns {BaseLayer|null} возвращает текущую подложку, если она установлена
            */
            setCurrent: function(id) {
                return manager.setCurrent(id);
            },
            /** Отключить текущую подложку
            * @memberOf BaseLayersManager#
            */
            unsetCurrent: function() {
                manager.setCurrent();
            },
            /** Получить идентификатор текущей подложки
            * @memberOf BaseLayersManager#
            * @returns {String|null} возвращает идентификатор текущей подложки либо null.
            */
            getCurrentID: function() {
                return manager.currentID;
            },
            /** Получить идентификатор по наименованию подложки
            * @memberOf BaseLayersManager#
            * @returns {String|null} возвращает идентификатор подложки если заданное наименование подложки существует.
            */
            getIDByName: function(name) {
                return manager.getIDByName(name);
            },
            /** Добавить слой в базовую подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {Layer} layer обьект слоя.
            * @returns {boolean} возвращает false если подложка не найдена иначе true.
            */
            addLayer: function(id, layer) {
                var baseLayers = this.get(id);
                if(!baseLayers) return false;
                baseLayers.arr.push(layer);

                gmxAPI._listeners.dispatchEvent('onAdd', this, baseLayers);
                return true;
            },
            /** Удалить слой из базовой подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {Layer} layer обьект слоя.
            */
            removeLayer: function(id, layer) {
                manager.removeLayer(id, layer);
                if(id === manager.currentID) {
                    layer.setVisible(false);
                }
            },
            /** Получить список слоев базовой подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {Layer[]} возвращает массив слоев базовой подложки.
            */
            getLayers: function(id) {
                return manager.get(id).arr;
            }
            ,addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); }
            ,removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); }
            ,stateListeners: {}
        }

        /** Добавлена подложка
         * @event BaseLayersManager#onAdd
         * @type {BaseLayer}
        */
        /** Удалена подложка
         * @event BaseLayersManager#onRemove
         * @type {BaseLayer}
        */
        /** Изменена подложка
         * @event BaseLayersManager#onChange
         * @type {BaseLayer}
        */
        /** Установлена текущая подложка
         * @event BaseLayersManager#onSetCurrent
         * @type {BaseLayer}
        */
    };
})();
