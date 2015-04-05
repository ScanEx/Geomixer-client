//Поддержка leaflet
(function()
{
    //"use strict";
	var nextId = 0;							// следующий ID mapNode
	var LMap = null;						// leafLet карта
	var imagesSize = {};					// Размеры загруженных Images
	var mapNodes = {						// Хэш нод обьектов карты - аналог MapNodes.hx
	};

	var moveToTimer = null;
	var utils = {							// Утилиты leafletProxy
		// 'getLastIndex': function(pNode)	{			// Получить следующий zIndex в mapNode
			// var n = 1;
			// if(pNode) {
				// n = pNode.children.length + 1;
			// }
			// return n;
		// }
        // ,
        'runMoveTo': function(attr, zd)	{				//позиционирует карту по координатам
            if(moveToTimer) clearTimeout(moveToTimer);
            if(!zd) zd = 200;
            if (attr && attr.z) gmxAPI.needZoom = attr.z;
            moveToTimer = setTimeout(function() {
                if(!attr && !gmxAPI.map.needMove) return;
                var flagInit = (gmxAPI.map.needMove ? true : false),
                    px = (attr ? attr.x : (flagInit ? gmxAPI.map.needMove.x : 0)),
                    py = (attr ? attr.y : (flagInit ? gmxAPI.map.needMove.y : 0)),
                    z = (attr ? attr.z : (flagInit ? gmxAPI.map.needMove.z : 1));
                if (px > 180 || px < -180) {
                    px %= 360;
                    if (px < -180) px += 360;
                    else if (px > 180) px -= 360;
                }
                var pos = new L.LatLng(py, px),
                    opt = gmxAPI._leaflet.zoomstart || {};
                gmxAPI.needZoom = null;
                gmxAPI.map.needMove = null;
                LMap.setView(pos, z, opt);
            }, zd);
        }
		,
		'setVisibleNode': setVisibleNode									// Рекурсивное изменение видимости
	};

    // добавить mapObject
    function addObject(ph)	{
        nextId++;
        var id = 'id' + nextId;
        var pt = {
            type: 'mapObject'
            ,handlers: {}
            ,propHiden: {}
            ,children: []
            ,id: id
            ,zIndexOffset: 0
            ,parentId: ph.obj.objectId
            //,'eventsCheck': 
            //subType
        };
        //if(ph.attr['hidenAttr']) pt['hidenAttr'] = ph.attr['hidenAttr'];

        var pNode = mapNodes[pt.parentId];
        if(!pNode) {
            pNode = {type: 'map', children:[], group: LMap};
        }
        pNode.children.push(id);

        pt.group = new L.LayerGroup();
        pNode.group.addLayer(pt.group);
        
        if(ph.attr) {
            pt.propHiden = ph.attr.propHiden || {};
            if(pt.propHiden.nodeType) pt.type = pt.propHiden.nodeType;
            var geo = {};
            if(ph.attr.geometry) {
                if(pt.propHiden.isLayer) {
                    geo.coordinates = ph.attr.geometry.coordinates;
                    geo.type = utils.fromScanexTypeGeo(ph.attr.geometry.type);
                } else {
                    geo = utils.parseGeometry(ph.attr.geometry);
                }
                if(ph.attr.geometry.properties) geo.properties = ph.attr.geometry.properties;
            }
            if(ph.attr.properties) geo.properties = ph.attr.properties;
            pt.geometry = geo;
            if(pt.propHiden.subType) pt.subType = pt.propHiden.subType;
            if(pt.propHiden.refreshMe) pt.refreshMe = pt.propHiden.refreshMe;
            if(pt.propHiden.layersParent) pt.zIndexOffset = 0;
            if(pt.propHiden.overlaysParent) pt.zIndexOffset = 50000;
        }
        mapNodes[id] = pt;
        if(pt.geometry.type) {
            //if (!pt.propHiden.isLayer) gmxAPI._leaflet.drawManager.add(id); // добавим в менеджер отрисовки
            if(pt.leaflet) {
                setHandlerObject(id);							// добавить Handler для mapObject
            }
        }
        //pt.zIndex = ('zIndex' in pt.propHiden ? pt.propHiden.zIndex : utils.getLastIndex(pNode));
        return id;
    }
    // Изменение видимости
    function setVisibleNode(ph) {
        var id = ph.obj.objectId || ph.obj.id,
            node = mapNodes[id];
        if(node) {							// нода имеется
            if(node.type === 'map') {							// нода map ничего не делаем
                return;
            } else if(node.setVisible) {
                node.setVisible(ph.attr);
                return;
            }
            //node.isVisible = ph.attr;
            var pNode = mapNodes[node.parentId] || null,
                pGroup = (pNode ? pNode.group : LMap);
            if(node.type === 'filter') {							// нода filter
                if(pNode) pNode.refreshFilter(id);
                return;
            } else {							// нода имеет вид в leaflet
                if(ph.attr) {
                    var flag = utils.chkVisibilityByZoom(id);
                    if(!flag) return;
                    if(node.leaflet && node.leaflet._map) return;
                    if(node.type === 'RasterLayer') {
                        gmxAPI._leaflet.renderingObjects[node.id] = 1;					
                        if(node.leaflet) {
                            LMap.addLayer(node.leaflet);
                            utils.bringToDepth(node, node.zIndex);
                        } else if('nodeInit' in node) {
                            node.nodeInit();
                        }
                    }
                    else
                    {
                        var isOnScene = ('isOnScene' in node ? node.isOnScene : true);
                        if(node.parentId) {
                            if(isOnScene) pGroup.addLayer(node.group);
                        }
                        
                        if(node.leaflet) {
                            if(isOnScene) {
                                if(node.subType !== 'drawingFrame' && node.leaflet.setStyle && node.regularStyle) node.leaflet.setStyle(node.regularStyle);
                                pGroup.addLayer(node.leaflet);
                            }
                        } else if(node.geometry.type) {
                            //gmxAPI._leaflet.drawManager.add(id);				// добавим в менеджер отрисовки
                        }
                        if(node.type === 'VectorLayer') {					// нода VectorLayer
                            node.checkFilters(0);
                        }
                    }
                }
                else
                {
                    if(node.type === 'RasterLayer') {
                        delete gmxAPI._leaflet.renderingObjects[node.id];
                        if(node.leaflet) {
                            LMap.removeLayer(node.leaflet);
                        }
                    }
                    else {
                        if(node.parentId) {
                            pGroup.removeLayer(node.group);
                        }
                        if(node.leaflet) {
                            if(pGroup._layers[node.leaflet._leaflet_id]) pGroup.removeLayer(node.leaflet);
                        }
                        if(node.mask) {
                            if(pGroup._layers[node.mask._leaflet_id]) pGroup.removeLayer(node.mask);
                        }
                    }
                }
            }
            for (var i = 0, len = node.children.length; i < len; i++) {
                setVisibleRecursive(mapNodes[node.children[i]], ph.attr);
            }
        }
    }

	// Команды в leaflet
	var commands = {				// Тип команды
        setVisible: function(ph) {              // установить видимость mapObject
            if(!ph || !ph.obj) return false;
            var obj = ph.obj,
                id = obj.objectId,
                node = mapNodes[id];
            if(!node) return false;
            if(ph.attr) node.isOnScene = true;
            node.notView = ph.notView || false;
            if(obj.isVisible === node.isVisible && node.isVisible === ph.attr) return true;
            node.isVisible = ph.attr;
            return utils.setVisibleNode(ph);
        }
        ,
		'getPatternIcon':	function(hash)	{				// получить иконку pattern
			return null;
		}
		,
		'moveTo':	function(ph)	{				//позиционирует карту по координатам центра и выбирает масштаб
			var zoom = ph.attr.z || (gmxAPI.map.needMove ? gmxAPI.map.needMove.z : LMap.getZoom() || 4);
			if(zoom > LMap.getMaxZoom() || zoom < LMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr.y, ph.attr.x);
			utils.runMoveTo({'x': pos.lng, 'y': pos.lat, 'z': zoom});
		}
		,
		getZoomBounds: function(ph)	{		// Установка границ по zoom
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return null;
			var out = {
				MinZoom: node.minZ
				,MaxZoom: node.maxZ
			}
			if(node.type === 'map') {
                out = {
                    MinZoom: LMap.getMinZoom()
                    ,MaxZoom: LMap.getMaxZoom()
                }
            }
			return out;
		}
        ,
		'addObject': addObject								// добавить mapObject
		,
		'setBackgroundTiles': gmxAPI._leaflet.setBackgroundTiles            // добавить растровый тайловый слой
		,
		'setVectorTiles': gmxAPI._leaflet.setVectorTiles			// Установка векторный тайловый слой
	}

	// Передача команды в leaflet
	function leafletCMD(cmd, hash)
	{
		if(!LMap) LMap = gmxAPI._leaflet['LMap']; // Внешняя ссылка на карту

		var ret = {};
		if(!hash) hash = {};
		var obj = hash['obj'] || null;	// Целевой обьект команды
		var attr = hash['attr'] || '';
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
		if(!commands[cmd]) {
console.log(cmd + ' : ' , hash , ' : ' , ret);
        gmxAPI.addDebugWarnings({'func': 'leafletCMD', 'cmd': cmd, 'hash': hash});
}
		return ret;
	}

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['cmdProxy'] = leafletCMD;				// посылка команд отрисовщику
	gmxAPI._leaflet['utils'] = utils;						// утилиты для leaflet
	gmxAPI._leaflet['mapNodes'] = mapNodes;					// Хэш нод обьектов карты - аналог MapNodes.hx
 })();

//Плагины для leaflet
(function()
{
	// Обработчик события - mapInit
	function onMapInit(ph) {
        var mapNodes = gmxAPI._leaflet.mapNodes;
        gmxAPI._cmdProxy = gmxAPI._leaflet.cmdProxy;			// Установка прокси для leaflet
		var mapID = ph.objectId;
		mapNodes[mapID] = {
			'type': 'map'
			,'handlers': {}
			,'children': []
			,'id': mapID
			,'group': gmxAPI._leaflet.LMap
			,'parentId': false
		};
		gmxAPI._listeners.addListener({'level': -10, 'eventName': 'mapCreated', 'func': function(ph) {
			setTimeout(function() {
				if(gmxAPI.map.needMove) {
					gmxAPI._leaflet.utils.runMoveTo();
				}
			}, 10);
			if(gmxAPI.map.needSetMode) {
				gmxAPI.map.setMode(gmxAPI.map.needSetMode);
				gmxAPI.map.needSetMode = null;
			}
		}});
	}

    gmxAPI._listeners.addListener({'level': -10, 'eventName': 'mapInit', 'func': onMapInit});
})();

if (gmxAPI.whenLoadedArray) {
    for (var i = 0, len = gmxAPI.whenLoadedArray.length; i < len; i++) {
        gmxAPI.whenLoadedArray[i]();
    }
    gmxAPI.whenLoadedArray = null;
}
