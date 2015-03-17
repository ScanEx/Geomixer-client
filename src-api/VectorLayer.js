// векторный слой
(function()
{
    "use strict";
    var LMap = null;        // leafLet карта
    var utils = null;       // утилиты для leaflet
    var mapNodes = null;    // Хэш нод обьектов карты - аналог MapNodes.hx

    // Добавить векторный слой
    function setVectorTiles(ph) {
        var _leaflet = gmxAPI._leaflet;
        LMap = _leaflet.LMap;
        utils = _leaflet.utils;
        mapNodes = _leaflet.mapNodes;

        var layer = ph.obj,
            nodeId = layer.objectId,
            prop = layer.properties,
            layerID = prop.name,
            node = mapNodes[nodeId];
        if(!node) return;      // Нода не определена
        node.type = 'VectorLayer';
        node.zIndexOffset = 100000;
        node.zIndex = utils.getIndexLayer(nodeId);

        var gmxNode = gmxAPI.mapNodes[node.id],  // Нода gmxAPI
            myLayer = node.leaflet = gmxAPI.layersByID[layerID];
        node.leaflet = myLayer;
        
        if (prop.visible && myLayer) myLayer.addTo(LMap);

        gmxAPI.extend(node, {
            setVisible: function(flag) {
                //console.log('setVisible', arguments);
                if (flag) {
                    LMap.addLayer(myLayer);
                    node.setZIndex(node.zIndex + node.zIndexOffset);
                } else LMap.removeLayer(myLayer);
            },

            setZIndex: function(num) {
                //console.log('setZIndex', arguments);
                if (myLayer) myLayer.setZIndex(num);
            },

            startLoadTiles: function() {
                //console.log('startLoadTiles', arguments);
            },

            setFilter: function(fid) {   // Добавить фильтр к векторному слою
                var flag = true;
                //console.log('setFilter', arguments);
            },

            setTiledQuicklooks: function(callback, minZoom, maxZoom, tileSenderPrefix) {
                var flag = true;
                //console.log('setTiledQuicklooks', arguments);
            },

            setStyleFilter: function(fid, style) {  // обновить стиль фильтра
                node.children.map(function(it, i) {
                    if (it === fid) {
                        node.leaflet.setStyle(style, i);
                        return;
                    }
                });
                //console.log('setStyleFilter', arguments);
            },

            setStyle: function(style) {  // обновить стили всех фильтров
                //console.log('setStyle', arguments);
                node.leaflet.setStyle(style);
           }
        });
        node.setZIndex(node.zIndex + node.zIndexOffset);
        
        gmxAPI.extend(gmxNode, {
            setDateInterval: function(dt1, dt2) {  // Установка временного интервала
                if (myLayer) myLayer.setDateInterval(dt1, dt2);
                // obj.dt1 = dt1;
                // obj.dt2 = dt2;
            },
            getDateInterval: function() {  // Получить временной интервал
                return {
                    beginDate: obj.dt1
                    ,endDate: obj.dt2
                };
            },
            getTileCounts: function(dt1, dt2) {  // Получить количество тайлов по временному интервалу
                return 0;
            },
            setPositionOffset: function(dx, dy) {
                obj.shiftX = dx || 0;
                obj.shiftY = dy || 0;
                if(this.objectId) proxy('setPositionOffset', { obj: obj, attr:{shiftX:obj.shiftX, shiftY: obj.shiftY} });
            }
            ,getPositionOffset: function() {
                return {shiftX: obj.shiftX || 0, shiftY: obj.shiftY || 0};
            }
            ,redrawItem: function(pt) {  // Установка стилевой функции пользователя
                if(this.objectId) return proxy('redrawItem', { obj: obj, attr:pt });
                return false;
            },
            setVisibilityHook: function (func) {
                obj._visibilityHook = func;
                if(this.objectId) return proxy('setFreezeLoading', { obj: obj, attr: obj._isLoadingFreezed });
            },
            removeVisibilityHook: function (func) {
                delete obj._visibilityHook;
                if(this.objectId) return proxy('setFreezeLoading', { obj: obj, attr: obj._isLoadingFreezed });
            },
            
            setStyleHook: function(func) {  // Установка стилевой функции пользователя
                obj.filters.forEach(function(item) { item.setStyleHook(func); });
                return true;
            }
            ,removeStyleHook: function() {  // удаление стилевой функции пользователя
                obj.filters.forEach(function(item) { item.removeStyleHook(); });
                return true;
            }
            ,getStatus: function(pt) {  // Получить состояние слоя по видимому extent
                if(this.objectId) return proxy('getStatus', { obj: obj, attr:pt });
                return {isVisible: false};
            }
            ,freezeLoading: function(pt) {      // установить флаг игнорирования загрузки векторных тайлов
                obj._isLoadingFreezed = true;
                return true;
            }
            ,unfreezeLoading: function(pt) {    // удалить флаг игнорирования загрузки векторных тайлов
                obj._isLoadingFreezed = false;
                return true;
            }
            ,isLoadingFreezed: function(pt) {    // получить флаг игнорирования загрузки векторных тайлов
                return obj._isLoadingFreezed;
            }
            ,chkLayerVersion: function(callback) {  // Запросить проверку версии невидимого слоя
                if (callback) callback({"Status":"notVisible"});
                return false;
            }
        });
    }

    //расширяем namespace
    if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
    gmxAPI._leaflet.setVectorTiles = setVectorTiles;    // Добавить векторный слой
})();
