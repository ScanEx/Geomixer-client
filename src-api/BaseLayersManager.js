/** Управление подложками

Позволяет управлять списком подложек. 

Подложка - массив слоев отображаемых в качестве подложки карты.

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
        ,activeIDs: []          // массив ID подложек(в контролах появляется только при наличии в ID hash)
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
                if(!attr) {
                    attr = {
                        //index: manager.arr.length
                    };
                } else {
                    id = (attr.id ? attr.id : name);
                    if(attr.lang) {
                        attr.rus = (attr.lang.ru ? attr.lang.ru : id);
                        attr.eng = (attr.lang.en ? attr.lang.en : id);
                    }
                }
                attr.isVisible = true
                var blID = manager.getIDByName(id) || id;
				var baseLayer = manager.hash[blID];
                this.setVisible(false);         // слои подложек изначально не видимы
                var isActiveID = manager.isActiveID(blID);
                if(!baseLayer) {
                    baseLayer = manager.add(blID, attr);
                }
                baseLayer.addLayer(this);
                if(!isActiveID) {
                    manager.updateIndex({id: blID});
                }
            });
			gmxAPI.extend(manager.map,
            {
                setMode: function(name) {
                    var id = (manager.hash[name] ? name : manager.getIDByName(name));
                    manager.setCurrentID(id);
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
                     * @deprecated Использовать контрол L.Control.gmxLayers
                     */
                    setVisible: function(flag) {
                        var controls = map.controlsManager.getCurrent();
                        if(!controls) return null;
                        var control = controls.getControl('layers');
                        return control.setVisible(flag);
                    },
                    /**
                     * @deprecated Использовать map.baseLayersManager.getActiveIDs()
                     */
                    getBaseLayerNames: function() {
                        return manager.activeIDs;
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
            this.addListener('onActiveChanged', function(arr) {
                var flag = false;
                for(var i=0, len = arr.length; i<len; i++) {
                    if(manager.currentID === arr[i]) {
                        flag = true;
                        break;
                    }
                }
                var current = manager.hash[manager.currentID] || null;
                if(current) {
                    if(!flag) manager.currentID = null
                    for(var i=0, len = current.layers.length; i<len; i++) {
                        current.layers[i].setVisible(flag);
                    }
                }
                // Поддержка устаревшего map.baseLayerControl.onChange 
                if('onChange' in manager.map.baseLayerControl) manager.map.baseLayerControl.onChange(manager.currentID);
            });
        }
        ,
        removeLayer: function(id, layer) {             // Удаление слоя из подложки - возвращает удаленный слой либо null
            var baseLayer = manager.hash[id];
			if(!baseLayer || !layer) return null;
            for(var i=0, len = baseLayer.layers.length; i<len; i++) {
                if(layer === baseLayer.layers[i]) {
                    if(len === 1) {
                        //baseLayer.isVisible = false;
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
            // var isVisible = attr.isVisible; // видимость подложки - 3 состояния отражающие видимость в контролах (true - видимая, false - не видимая, undefined - видимость определяется по списку BaseLayers)
            // if(gmxAPI._baseLayersHash[id]) isVisible = true;
            var pt = {
                id: id || 'default'                 // id подложки
                ,layers: attr.layers || []          // массив слоев подложки
                ,rus: attr.rus || id                // title подложки 
                ,eng: attr.eng || id
                ,icon: attr.icon || ''
                ,addLayer: function(layer) {
                    manager.removeLayer(id, layer);
                    this.layers.push(layer);
                    layer.isBaseLayer = true;
                    layer.setVisible(false);
                    if(!layer.backgroundColor) layer.backgroundColor = 0xffffff;
                    gmxAPI._listeners.dispatchEvent('onLayerChange', manager.map.baseLayersManager, this);
                    return true;
                }
                ,removeLayer: function(layer) {
                    manager.removeLayer(id, layer);
                    gmxAPI._listeners.dispatchEvent('onLayerChange', manager.map.baseLayersManager, this);
                }
            };
            if(attr.rus) alias[attr.rus] = id;
            if(attr.eng) alias[attr.eng] = id;
            if(attr.style) pt.style = attr.style;   // стиль для контролов
            if(attr.type) pt.type = attr.type;      // тип подложки для контролов имеющих типы подложек

            pt.layers.forEach(function(item, i) {
                item.isBaseLayer = true;
                item.setVisible(false);
            });

            manager.hash[id] = pt;
            manager.arr.push(pt);
            //manager.updateIndex(pt);
            gmxAPI._listeners.dispatchEvent('onAdd', manager.map.baseLayersManager, pt);
            return pt;
        }
        ,
        setActiveIDs: function(arr) {
            manager.activeIDs = arr;
            gmxAPI._listeners.dispatchEvent('onActiveChanged', manager.map.baseLayersManager, manager.activeIDs);
            return true;
        }
        ,
        _removeIDFromActive: function(id) {
            for(var i=0, len = manager.activeIDs.length; i<len; i++) {
                if(id === manager.activeIDs[i]) {
                    manager.activeIDs.splice(i, 1);
                    break;
                }
            }
        }
        ,
        updateIndex: function(attr) {
            if(!attr.id) return null;
            var id = attr.id;
            manager._removeIDFromActive(id);
            var len = manager.activeIDs.length;
            var index = ('index' in attr && attr.index !== undefined ? attr.index : len);
            var out = -1;
            if(index > len - 1) {
                out = len;
                manager.activeIDs.push(id);
            } else {
                var arr = manager.activeIDs.slice(0, index);
                out = arr.length;
                arr.push(id);
                manager.activeIDs = arr.concat(manager.activeIDs.slice(index));
            }
            gmxAPI._listeners.dispatchEvent('onActiveChanged', manager.map.baseLayersManager, manager.activeIDs);
            return out;
        }
        ,
        getAll: function(flag) {              // Получить список подложек
            return manager.arr;
        }
        ,
        get: function(id) {               // Получить подложку по ID
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
        isActiveID: function(id) {
            for(var i=0, len = manager.activeIDs.length; i<len; i++) {
                if(id === manager.activeIDs[i]) {
                    return true;
                }
            }
            return false;
        }
        ,
        setCurrentID: function(id) {            // Установка текущей подложки карты
            var isActive = manager.isActiveID(id);
            var item = manager.hash[id] || null;
            //if(manager.currentID && (isActive || !item)) manager.setVisibleCurrentItem(false);
            if(manager.currentID) manager.setVisibleCurrentItem(false);
            manager.currentID = null;
            if(item) {
                if(isActive) {
                    manager.map.needSetMode = null;
                    manager.currentID = id;
                    manager.setVisibleCurrentItem(true);
                }
            }
            gmxAPI._listeners.dispatchEvent('onSetCurrent', manager.map.baseLayersManager, item);
            return item;
        }
        ,remove: function(id) {            // Удалить подложку
            if(id === manager.currentID) {
                manager.setVisibleCurrentItem(false);
                manager.currentID = null;
            }
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
            manager.setCurrentID(manager.currentID === id ? null : id);
        }
	};
    /**
     * Обьект подложки.
     * @typedef {Object} BaseLayer
     * @property {String} id - Идентификатор подложки.
     * @property {Layer[]} layers - Массив слоев подложки.
     * @property {String} rus - Наименование русскоязычное.
     * @property {String} eng - Наименование англоязычное.
     * @property {function(layer:Layer)} addLayer - Ф-ция добавления слоя в подложку.
     * @property {function(layer:Layer)} removeLayer - Ф-ция удаления слоя из подложки.
     */
     
     /**
        @name BaseLayer~addLayer
        @function
        @param {Layer} layer слой, который нужно добавить в подложку
     */

    /**
     * Менеджер подложек (создаётся в API и доступен через свойство карты map.baseLayersManager).
     * @constructor BaseLayersManager
     */
	gmxAPI.BaseLayersManager = function(map) {
        manager.init(map);
        return {
            /** Добавить подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {object} attr дополнительные атрибуты подложки.
            * @param {String} attr.rus - наименование русскоязычное(по умолчанию равен id).
            * @param {String} attr.eng - наименование англоязычное(по умолчанию равен id).
            * @param {Layer[]} attr.layers - массив слоев подложки(по умолчанию []).
            * @returns {BaseLayer|null} возвращает обьект добавленной подложки или null если подложка с данным идентификатором уже существует.
            */
            add: function(id, attr) {
                return manager.add(id, attr);
            },
            /** Удалить подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {BaseLayer|null} возвращает удаленную подложку если она найдена.
            */
            remove: function(id) {
                return manager.remove(id);
            },
            /** Получить подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {BaseLayer|null} возвращает подложку если существует иначе null).
            */
            get: function(id) {
                return manager.hash[id] || null;
            },
            /** Получить список всех подложек
            * @memberOf BaseLayersManager#
            * @returns {BaseLayer[]} возвращает массив всех подложек.
            */
            getAll: function() {
                return manager.arr;
            },
            /** Получить массив ID активных подложек
            * @memberOf BaseLayersManager#
            * @returns {String[]} возвращает массив ID активных подложек(в порядке возрастания индексов).
            */
            getActiveIDs: function() {
                return manager.activeIDs;
            },
            /** Установить массив ID активных подложек
            * @memberOf BaseLayersManager#
            * @param {String[]} массив ID активных подложек.
            */
            setActiveIDs: function(arr) {
                return manager.setActiveIDs(arr);
            },
            /** Добавить ID активной подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {number} index порядковый номер в массиве активных подложек.
            */
            addActiveID: function(id, index) {
                return manager.updateIndex({id: id, index: index});
            },
            /** Проверить активность подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {boolean} возвращает true если подложка активна иначе false
            */
            isActiveID: function(id) {
                return manager.isActiveID(id);
            },
            /** Установить текущую подложку по идентификатору
            * @memberOf BaseLayersManager#
            * @param {String=} id идентификатор подложки, если подложка с заданным идентификатором отсутствует или не активна то текущая подложка равна null.
            * @returns {BaseLayer|null} возвращает текущую подложку, если она установлена
            */
            setCurrentID: function(id) {
                return manager.setCurrentID(id);
            },
            /** Получить идентификатор текущей подложки
            * @memberOf BaseLayersManager#
            * @returns {String|null} возвращает идентификатор текущей подложки либо null.
            */
            getCurrentID: function() {
                return manager.map.needSetMode || manager.currentID;
            },
            /** Получить идентификатор по наименованию подложки
            * @memberOf BaseLayersManager#
            * @returns {String|null} возвращает идентификатор подложки если заданное наименование подложки существует.
            */
            getIDByName: function(name) {
                return manager.getIDByName(name);
            },
            /** Добавить слой в подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {Layer} layer обьект слоя.
            * @returns {boolean} возвращает false если подложка не найдена иначе true.
            */
            addLayer: function(id, layer) {
                var baseLayer = this.get(id);
                if(!baseLayer) return false;
                baseLayer.addLayer(layer);
                //baseLayer.layers.push(layer);

                //gmxAPI._listeners.dispatchEvent('onAdd', this, baseLayer);
                return true;
            },
            /** Удалить слой из подложки
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
            /** Получить список слоев подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {Layer[]} возвращает массив слоев подложки.
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
        /** Изменен массив ID активных подложек
         * @event BaseLayersManager#onActiveChanged
         * @type {String[]}
        */
    };
})();
