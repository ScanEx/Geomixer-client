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
        ,arr: []                // массив подложек
        ,hash: {}               // список по ID всех подложек
        ,zIndex: []
        ,currentID: null        // ID текущей подложки
        ,addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); }
        ,removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); }
        ,stateListeners: {}
        ,
        init: function(map) {        // инициализация
            manager.map = map;
            gmxAPI.extendFMO('setAsBaseLayer', function(name, attr) {
                this.isBaseLayer = true;
                var id = name;
                if(!attr) attr = {};
                else {
                    id = (attr.id ? attr.id : name);
                    if(attr.lang) {
                        attr.rus = (attr.lang.ru ? attr.lang.ru : id);
                        attr.eng = (attr.lang.en ? attr.lang.en : id);
                    }
                }
                attr.isVisible = true
                var blID = manager.getIDByName(id) || id;
				var baseLayer = manager.add(blID, attr);
                //if(!baseLayer && manager.hash[id]) baseLayer = manager.hash[id];
                if(!baseLayer) return null;
                baseLayer.addLayer(this);
                this.setVisible(false);     // слои подложек изначально не видимы
            });
			gmxAPI.extend(manager.map,
            {
                setMode: function(name) {
                    var id = (manager.hash[name] ? name : manager.getIDByName(name));
                    manager.setCurrent(id);
                }
                ,getModeID: function() {
                    return manager.currentID;
                }
                ,setBaseLayer: function(name) {
                    this.setMode(name);
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
                    /**
                     * @deprecated Использовать map.baseLayersManager.getAll()
                     */
                    setVisible: function(flag) {
                        var controls = map.controlsManager.getCurrent();
                        if(!controls) return null;
                        var control = controls.getControl('layers');
                        return control.setVisible(flag);
                    },
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
                        var baseLayer = manager.get(name);
                        return (baseLayer ? baseLayer.layers : null);
                    }
                }
            });
            this.addListener('onVisibleChange', function(baseLayer) {
                var current = manager.hash[manager.currentID] || null;
                if(current && current == baseLayer) {
                    for(var i=0, len = baseLayer.layers.length; i<len; i++) {
                        baseLayer.layers[i].setVisible(baseLayer.isVisible);
                    }
                }
            });
        }
        ,
        removeLayer: function(id, layer) {             // Удаление слоя из подложки - возвращает удаленный слой либо null
            var baseLayer = manager.hash[id];
			if(!baseLayer || !layer) return null;
            for(var i=0, len = baseLayer.layers.length; i<len; i++) {
                if(layer === baseLayer.layers[i]) {
                    if(len === 1) {
                        baseLayer.isVisible = false;
                        gmxAPI._listeners.dispatchEvent('onLayerChange', manager.map.baseLayersManager, baseLayer);
                    }
                    return baseLayer.layers.splice(i, 1)[0];
                }
            }
            return null;
        }
        ,
        add: function(id, attr) {           // Добавление подложки
            if(!id || manager.hash[id]) return null;
            if(!attr) attr = {};
            var isVisible = ('isVisible' in attr ? attr.isVisible : true); // видимость подложки
            var pt = {
                id: id || 'default'                 // id подложки
                ,layers: attr.layers || []          // массив слоев подложки
                ,rus: attr.rus || id                // title подложки 
                ,eng: attr.eng || id
                ,addLayer: function(layer) {
                    manager.removeLayer(id, layer);
                    this.layers.push(layer);
                    if(!layer.backgroundColor) layer.backgroundColor = 0xffffff;
                    gmxAPI._listeners.dispatchEvent('onLayerChange', manager.map.baseLayersManager, this);
                    return true;
                }
                ,removeLayer: function(layer) {
                    manager.removeLayer(id, layer);
                    gmxAPI._listeners.dispatchEvent('onLayerChange', manager.map.baseLayersManager, this);
                }
                ,setVisible: function(flag) {
                    this.isVisible = flag;
                    gmxAPI._listeners.dispatchEvent('onVisibleChange', manager.map.baseLayersManager, this);
                    if(flag) return
                    if(manager.currentID === this.id) {
                        manager.setCurrent();
                    }
                    delete this.index;
                }
                ,setIndex: function(index) {
                    this.index = index;
                    gmxAPI._listeners.dispatchEvent('onIndexChange', manager.map.baseLayersManager, this);
                }
                ,getIndex: function() {
                    return (this.isVisible ? this.index : null);
                    // for(var i=0, len = manager.zIndex.length; i<len; i++) {
                        // if(id === manager.zIndex[i]) {
                            // return i;
                        // }
                    // }
                    // return len;
                }
            };
            if(attr.rus) alias[attr.rus] = id;
            if(attr.eng) alias[attr.eng] = id;
            if(attr.style) pt.style = attr.style;   // стиль для контролов
            if(attr.type) pt.type = attr.type;      // тип подложки для контролов имеющих типы подложек

            pt.isVisible = isVisible;
            //pt.setVisible(isVisible);
            
            manager.hash[id] = pt;
            manager.arr.push(pt);
            
            gmxAPI._listeners.dispatchEvent('onAdd', manager.map.baseLayersManager, pt);
            return pt;
        }
        // ,
        // setIndex: function(id, attr) {
            // var len = manager.zIndex.length;
            // var index = ('index' in attr ? attr.index : len);
            // var out = -1;
            // if(index > len - 1) {
                // out = len;
                // manager.zIndex.push(id);
            // } else {
                // var arr = manager.zIndex.slice(0, index);
                // out = arr.length;
                // arr.push(id);
                // manager.zIndex = arr.concat(manager.zIndex.slice(index));
            // }
            // return out;
        // }
        ,
        getAll: function(flag) {              // Получить список базовых подложек
            return manager.arr;
        }
        ,
        get: function(id) {               // Получить базовую подложку по ID
            return manager.hash[id] || null;
        }
        ,setVisibleCurrentItem: function(flag) {
            var baseLayer = manager.hash[manager.currentID] || null;
            if(baseLayer) {
                for(var i=0, len = baseLayer.layers.length; i<len; i++) {
                    var layer = baseLayer.layers[i];
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
            var item = manager.hash[id] || null;
            if(item) {
                if(!item.isVisible) return;
                manager.map.needSetMode = null;
                manager.currentID = id;
                manager.setVisibleCurrentItem(true);
            }
            gmxAPI._listeners.dispatchEvent('onSetCurrent', manager.map.baseLayersManager, item);
            return item;
        }
        ,remove: function(id) {            // Удалить базовую подложку
            if(id === manager.currentID) manager.setVisibleCurrentItem(false);
            manager.currentID = '';
            // for(var i=0, len = manager.zIndex.length; i<len; i++) {
                // if(id === manager.zIndex[i]) {
                    // manager.zIndex.splice(i, 1);
                    // break;
                // }
            // }
            var item = manager.hash[id] || null;
            if(item) {
                delete manager.hash[id];
                for(var i=0, len = manager.arr.length; i<len; i++) {
                    if(id === manager.arr[i].id) {
                        manager.arr.splice(i, 1);
                        break;
                    }
                }
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
     * @property {Layer[]} layers - Массив слоев подложки.
     * @property {boolean} isVisible - Флаг видимости(по умолчанию true).
     * @property {String} rus - Наименование русскоязычное.
     * @property {String} eng - Наименование англоязычное.
     * @property {function(layer:Layer)} addLayer - Ф-ция добавления слоя в подложку.
     * @property {function(layer:Layer)} removeLayer - Ф-ция удаления слоя из подложки.
     * @property {function(flag:boolean)} setVisible - Установить видимость подложки.
     * @property {function(index:number)} setIndex - Установить порядковый индекс в массиве подложек.
     * @property {function()} getIndex - Получить порядковый индекс в массиве подложек.
     */
     
     /**
        @name BaseLayer~addLayer
        @function
        @param {Layer} layer слой, который нужно добавить в базовую подложку
     */

    /**
     * Менеджер базовых подложек (создаётся в API и доступен через свойство карты map.baseLayersManager).
     * @constructor BaseLayersManager
     */
	gmxAPI.BaseLayersManager = function(map) {
        manager.init(map);
        return {
            /** Добавить базовую подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {object} attr дополнительные атрибуты подложки.
            * @param {number} attr.index - индекс в массиве подложек(по умолчанию равен количеству подложек).
            * @param {boolean} attr.isVisible - видимость подложки(по умолчанию true).
            * @param {String} attr.rus - наименование русскоязычное(по умолчанию равен id).
            * @param {String} attr.eng - наименование англоязычное(по умолчанию равен id).
            * @returns {BaseLayer|null} возвращает обьект добавленной подложки или null если подложка с данным идентификатором уже существует.
            */
            add: function(id, attr) {
                return manager.add(id, attr);
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
                return manager.hash[id] || null;
            },
            /** Получить список всех базовых подложек
            * @memberOf BaseLayersManager#
            * @returns {BaseLayer[]} возвращает массив всех подложек.
            */
            getAll: function() {
                return manager.arr;
            },
            /** Установить текущую подложку по идентификатору
            * @memberOf BaseLayersManager#
            * @param {String=} id идентификатор подложки, если подложка с заданным идентификатором отсутствует то текущая подложка отключается.
            * @returns {BaseLayer|null} возвращает текущую подложку, если она установлена
            */
            setCurrent: function(id) {
                return manager.setCurrent(id);
            },
            /** Отключить текущую подложку
            * @memberOf BaseLayersManager#
            */
            // unsetCurrent: function() {
                // manager.setCurrent();
            // },
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
                var baseLayer = this.get(id);
                if(!baseLayer) return false;
                baseLayer.layers.push(layer);

                gmxAPI._listeners.dispatchEvent('onAdd', this, baseLayer);
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
                return manager.get(id).layers;
            }
            ,addListener: manager.addListener
            ,removeListener: manager.removeListener
            ,stateListeners: manager.stateListeners
        }

        /** Добавлена подложка
         * @event BaseLayersManager#onAdd
         * @type {BaseLayer}
        */
        /** Удалена подложка
         * @event BaseLayersManager#onRemove
         * @type {BaseLayer}
        */
        /** Изменен список слоев в подложке
         * @event BaseLayersManager#onLayerChange
         * @type {BaseLayer}
        */
        /** Установлена текущая подложка
         * @event BaseLayersManager#onSetCurrent
         * @type {BaseLayer}
        */
        /** Изменена видимость подложки
         * @event BaseLayersManager#onVisibleChange
         * @type {BaseLayer}
        */
        /** Изменен порядковый индекс подложки
         * @event BaseLayersManager#onIndexChange
         * @type {BaseLayer}
        */
    };
})();
