// векторный слой
(function()
{
	var LMap = null;						// leafLet карта
	var utils = null;						// утилиты для leaflet
	var mapNodes = null;					// Хэш нод обьектов карты - аналог MapNodes.hx

	// Добавить векторный слой
	function setVectorTiles(ph)	{
		if(!LMap) init();
		var out = {};
		var layer = ph.obj;
		var id = layer.objectId;
		var node = mapNodes[id];
		if(!node) return;						// Нода не определена
		//var gmxNode = gmxAPI.mapNodes[id];		// Нода gmxAPI

		node['type'] = 'VectorLayer';
		node['minZ'] = 1;
		node['maxZ'] = 21;
		node['flipEnabled'] = true;				// По умолчанию ротация обьектов слоя установлена

		node['tilesVers'] = {};
		node['tiles'] = {};
		//node['observeVectorLayer'] = null;
		node['observerNode'] = null;
		
		node['needParse'] = [];
		node['parseTimer'] = 0;
		node['filters'] = [];
		//node['dataTiles'] = {};
		
		node['propHiden'] = {};					// Свойства внутренние
		//node['tilesRedrawTimers'] = {};			// Таймеры отрисовки тайлов
		node['tilesRedrawImages'] = {};			// Отложенные отрисовки растров по тайлам
		node['tilesKeys'] = {};					// Соответсвие текущих ключей тайлов

		node['tilesRedraw'] = {};				// Отложенные отрисовки тайлов
		node['hoverItem'] = null;				// Обьект hover
		node['listenerIDS'] = {};				// id прослушивателей событий
		node['tilesLoaded'] = {};
		node['tilesLoadProgress'] = {};
		node['loaderFlag'] = true;
		node['badTiles'] = {};
		node['tilesGeometry'] = {};				// Геометрии загруженных тайлов по z_x_y
		node['addedItems'] = []					// Геометрии обьектов добавленных в векторный слой
		node['objectsData'] = {};				// Обьекты из тайлов по identityField
		//node['clustersFlag'] = false;			// Признак кластеризации на слое
		node['clustersData'] = null;			// Данные кластеризации

		node['zIndexOffset'] = 100000;
		node['editedObjects'] = {};
		node['mousePos'] = {};					// позиция мыши в тайле
//		node['tilesDrawing'] = {};				// список отрисованных тайлов в текущем Frame
		node['zIndex'] = utils.getIndexLayer(id);
		node['quicklookZoomBounds'] = {			//ограничение по зуум квиклуков
			'minZ': 1
			,'maxZ': 21
		};
		
		node['propHiden']['rasterView'] = '';		// Показывать растры в КР только по Click	// setAPIProperties
		//gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'rasterView': 'onCtrlClick'} });
		
		if(!layer['properties']) layer['properties'] = {};
		if(layer.properties['rasterView']) {
			node['propHiden']['rasterView'] = layer.properties['rasterView'];
		}
		layer.properties['visible'] = ('visible' in layer.properties ? layer.properties['visible'] : true);
		node['tileRasterFunc'] = null;			// tileFunc для квиклуков
		
		node['flipIDS'] = [];					// Массив обьектов flip сортировки
		node['flipedIDS'] = [];					// Массив обьектов вне сортировки
		node['flipHash'] = {};					// Hash обьектов flip сортировки
		
		node['flipNum'] = 0;					// Порядковый номер flip
		
		//node['labels'] = {};					// Хэш label слоя
		//node['labelsBounds'] = [];				// Массив отрисованных label

		// Получить properties обьекта векторного слоя
		function getPropItem(item)	{
			return (item['properties'] ? item['properties']
				: (node['objectsData'][item.id] ? node['objectsData'][item.id]['properties']
				: {}
				));
		}
		node['getPropItem'] = getPropItem;

		var chkBoundsDelta = function(tb, b) {		// пересечение bounds с тайлом c delta
			if(!tb || !b) return false;
			var delta = tb.delta;
			return (
				   tb.min.x - delta > b.max.x
				|| tb.max.x + delta < b.min.x
				|| tb.min.y - delta > b.max.y
				|| tb.max.y + delta < b.min.y
			? false : true);
		}

		var chkPointDelta = function(tb, p) {		// пересечение point с тайлом c delta
			if(!tb || !p) return false;
			var delta = tb.delta;
			return (
				   tb.min.x - delta > p.x
				|| tb.max.x + delta < p.x
				|| tb.min.y - delta > p.y
				|| tb.max.y + delta < p.y
			? false : true);
		}

		// Проверка фильтра видимости
		var chkSqlFuncVisibility = function(item)	{
			var flag = true;
			if('_isSQLVisibility' in item.propHiden) {
				flag = item.propHiden['_isSQLVisibility'];
			} else {
				if(node['_sqlFuncVisibility']) {
					var prop = getPropItem(item);
					if(!node['_sqlFuncVisibility'](prop) && !node['_sqlFuncVisibility'](item.propHiden)) flag = false;
				}
				item.propHiden['_isSQLVisibility'] = flag;
			}
			return flag;
		}

		node['getMinzIndex'] = function() {
			var zIndexMin = 1000000;
			var pNode = mapNodes[node.parentId];
			for (var i = 0; i < pNode.children.length; i++) {
				var tNode = mapNodes[pNode.children[i]];
				if(tNode && tNode['type'] === 'VectorLayer' && tNode.zIndex < zIndexMin) zIndexMin = tNode.zIndex;
			}
			zIndexMin--;
			return zIndexMin;
		}

		node['getMaxzIndex'] = function() {
			var zIndexMax = 0;
			var pNode = mapNodes[node.parentId];
			for (var i = 0; i < pNode.children.length; i++) {
				var tNode = mapNodes[pNode.children[i]];
				if(tNode && tNode.zIndex < zIndexMax) zIndexMax = tNode.zIndex;
			}
			zIndexMax++;
			return zIndexMax;
		}
		node['setVisibilityFilter'] = function() {
			//var currZ = LMap.getZoom();
			//delete node['tilesRedrawImages'][currZ];
			
			reCheckFilters();
			//upDateLayer();
			node.redrawTilesList(40);
		}

		var inpAttr = ph.attr;
		node['subType'] = (inpAttr['filesHash'] ? 'Temporal' : '');
		
		if(layer.properties['IsRasterCatalog']) {
			node['IsRasterCatalog'] = true;
			node['rasterCatalogTilePrefix'] = layer['tileSenderPrefix'];
		}

		node['setSortItems'] = function(func) {
			node['sortItems'] = func;
			waitRedraw();
		}

		node['getGeometryType'] = function (itemId) {				// Получить geometry.type обьекта векторного слоя
			var item = node['objectsData'][itemId];
			return (item ? item.type : null);
		}
		node['getItemGeometry'] = function (itemId) {				// Получить geometry обьекта векторного слоя
			var item = node['objectsData'][itemId];
			if(!item) return null;
			var geom = null;
			for(var tileID in item.propHiden['fromTiles']) {
				var arr = (tileID == 'addItem' ? node['addedItems'] : node['tilesGeometry'][tileID]);	// Обьекты тайла
				if(arr && arr.length) {
					for (var i = 0; i < arr.length; i++) {
						var it = arr[i];
						if(it.id == itemId) {
							var vgeo = it.exportGeo();
							if(!geom) geom = gmxAPI.clone(vgeo);
							else {
								if(geom.type.indexOf('MULTI') == -1) {
									geom.type = 'MULTI' + geom.type;
									geom.coordinates = [geom.coordinates];
								}
								if(vgeo.type.indexOf('MULTI') == -1) {
									geom.coordinates.push(vgeo.coordinates);
								} else {
									for (var j = 0; j < vgeo.coordinates.length; j++) geom.coordinates.push(vgeo.coordinates[j]);
								}
							}
							break;
						}
					}
				}
			}
			if(geom) geom = gmxAPI.from_merc_geometry(geom);
			return geom;
		}
		node['getFeatureById'] = function (attr) {					// Получить Feature обьекта векторного слоя
			var itemId = attr['fid'];
			var item = node['objectsData'][itemId];
			var resOut = function () {					// Получить Feature обьекта векторного слоя
				var geom = node['getItemGeometry'](itemId);
				var ret = new gmxAPI._FlashMapFeature(geom, getPropItem(item), gmxNode);
				if(attr.func) attr.func(ret);
			}
			if(item) {
				resOut();
			} else {
				var currListenerID = gmxAPI._listeners.addListener({'level': 10, 'eventName': 'onTileLoaded', 'obj': gmxNode, 'func': function(ph) {
					if(node.getLoaderFlag()) return;
					gmxNode.removeListener('onTileLoaded', currListenerID); currListenerID = null;
					resOut();
				}});
				var ext = {	minX: -Number.MAX_VALUE, minY: -Number.MAX_VALUE, maxX: Number.MAX_VALUE, maxY: Number.MAX_VALUE };
				node['loadTilesByExtent'](ext);
			}
		}
		node['getFeatures'] = function (attr) {					// Получить данные векторного слоя по bounds геометрии
			var geoMerc = gmxAPI.merc_geometry(attr.geom ? attr.geom : { type: "POLYGON", coordinates: [[-180, -89, -180, 89, 180, 89, 180, -89]] });
			var ext = gmxAPI.getBounds(geoMerc.coordinates);
			var resOut = function () {					// Получить Feature обьекта векторного слоя
				var bounds = new L.Bounds();
				bounds.extend(new L.Point(ext.minX, ext.minY));
				bounds.extend(new L.Point(ext.maxX, ext.maxY));
				var arr = getItemsByBounds(bounds);
				var ret = [];
				for (var i = 0; i < arr.length; i++) {
					var item = node['objectsData'][arr[i].id];
					var geom = node['getItemGeometry'](arr[i].id);
					if(attr.geom && attr.geom.type == 'POINT') {
						var coords = geom.coordinates;
						if(geom.type.indexOf('MULTI') == -1) {
							coords = [coords];
						}
						
						var containFlag = false;
						for (var j = 0; j < coords.length; j++) if(gmxAPI._leaflet['utils'].isPointInPolygonArr(attr.geom['coordinates'], coords[j][0])) { containFlag = true; break; }
						if(!containFlag) continue;
					}
					ret.push(new gmxAPI._FlashMapFeature(geom, getPropItem(item), gmxNode));
				}
				attr.func(ret);
			}
			//(function() {
				var currListenerID = gmxAPI._listeners.addListener({'level': 10, 'eventName': 'onTileLoaded', 'obj': gmxNode, 'func': function(ph) {
					if(node.getLoaderFlag()) return;
					gmxNode.removeListener('onTileLoaded', currListenerID); currListenerID = null;
					resOut();
				}});
				if(!node['loadTilesByExtent'](ext)) {
					resOut();
				}
			//})();
		}
		
		//node['shiftY'] = 0;						// Сдвиг для ОСМ вкладок
		node['setObserver'] = function (pt) {				// Установка получателя видимых обьектов векторного слоя
			node['observerNode'] = pt.obj.objectId;
			var ignoreVisibilityFilter = pt.attr.ignoreVisibilityFilter || false;		// отменить контроль фильтра видимости
			var callback = pt.attr.func;
//console.log('setObserver ', ignoreVisibilityFilter, node.id, node['observerNode']);

			var observerTiles = {};
			var observerObj = {};
			node['chkRemovedTiles'] = function(dKey) {		// проверка при удалении тайлов
				var out = [];
				var items = node['tilesGeometry'][dKey];
				if(items && items.length > 0) {
					for (var i = 0; i < items.length; i++)
					{
						var item = items[i];
						var pid = item['id'];
						if(observerObj[pid]) {
							var ph = {'layerID': node.id, 'properties': getPropItem(item) };
							ph.onExtent = false;
							ph.geometry = node['getItemGeometry'](pid);
							//ph.geometry = item.exportGeo();
							out.push(ph);
							delete observerObj[pid];
						}
					}
				}
				delete observerTiles[dKey];
				if(out.length) {
					callback(out);
				}
			}
			node['chkObserver'] = function () {				// проверка изменений видимости обьектов векторного слоя
				var currPosition = gmxAPI.currPosition;
				if(!currPosition || !currPosition.extent) return;
				var ext = currPosition.extent;
				var out = [];
				var tiles = node['tiles'];
				for (var key in tiles)
				{
					var tb = tiles[key];
					var tvFlag = (tb.max.x < ext.minX || tb.min.x > ext.maxX || tb.max.y < ext.minY || tb.min.y > ext.maxY);
					if(tvFlag) {								// Тайл за границами видимости
						if(!observerTiles[key]) continue;
						delete observerTiles[key];
					} else {
						observerTiles[key] = true;
					}
					var items = node['tilesGeometry'][key];
					if(items && items.length > 0) {
						for (var i = 0; i < items.length; i++)
						{
							var item = items[i];
							if(node['temporal'] && !node.chkTemporalFilter(item)) continue;														// не прошел по мультивременному фильтру
							if(!item['propHiden'] || !item['propHiden']['toFilters'] || item['propHiden']['toFilters'].length == 0) continue;	// обьект не виден по стилевым фильтрам
							
							var prop = getPropItem(item);
							if(!ignoreVisibilityFilter && !chkSqlFuncVisibility(item)) continue; 	// если фильтр видимости на слое не отменен
							
							var pid = item.id;
							var vFlag = (item.bounds.max.x < ext.minX || item.bounds.min.x > ext.maxX || item.bounds.max.y < ext.minY || item.bounds.min.y > ext.maxY);
							var ph = {'layerID': node.id, 'properties': prop };
							if(vFlag) {					// Обьект за границами видимости
								if(observerObj[pid]) {
									ph.onExtent = false;
									ph.geometry = node['getItemGeometry'](pid);
									//ph.geometry = item.exportGeo();
									out.push(ph);
									delete observerObj[pid];
								}
							} else {
								if(!observerObj[pid]) {
									ph.onExtent = true;
									//ph.geometry = item.exportGeo();
									ph.geometry = node['getItemGeometry'](pid);
									out.push(ph);
									var tilesKeys = {};
									tilesKeys[key] = true;
									observerObj[pid] = { 'tiles': tilesKeys , 'item': item };
								}
							}
						}
					}
				}
				if(out.length) {
					//callback(gmxAPI.clone(out));
					callback(out);
				}
			}
			var key = 'onMoveEnd';
			node['listenerIDS'][key] = {'obj': gmxNode.map, 'evID': gmxAPI.map.addListener(key, node['chkObserver'], 11)};
			//gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onMoveEnd', 'obj': gmxAPI.map, 'func': node['chkObserver']});
		};

		node.getLoaderFlag = function()	{							// Проверка необходимости загрузки тайлов
			node['loaderFlag'] = false;
			for (var pkey in node['tilesLoadProgress'])
			{
				node['loaderFlag'] = true;
				break;
			}
			return node['loaderFlag'];
		};

		node.chkLoadTile = function(tilePoint, zoom)	{							// Проверка необходимости загрузки тайлов
			if(node['isVisible'] === false) return true;								// Слой не видим
			var currZ = LMap.getZoom();
			if(currZ < node['minZ'] || currZ > node['maxZ'])  return true;				// Неподходящий zoom

			if(!zoom) zoom = currZ;

			var attr = getTileAttr(tilePoint, zoom);
			var flag = node['loadTilesByExtent'](null, attr);
			if(!flag) {
				node.repaintTile(tilePoint, true);
			}
			return flag;
		};

		node['loaderDrawFlags'] = {};

		node['loadTilesByExtent'] = function(ext, attr)	{		// Загрузка векторных тайлов по extent
			var flag = false;

			var tiles = node['tiles'];
			for (var tID in tiles)
			{
				if(node['tilesGeometry'][tID] || node['badTiles'][tID]) continue;

				var tb = tiles[tID];
				if(ext) {
					var tvFlag = (tb.max.x < ext.minX || tb.min.x > ext.maxX || tb.max.y < ext.minY || tb.min.y > ext.maxY);
					if(tvFlag) continue;								// Тайл за границами видимости
				} else if(attr) {
					if(!attr['bounds'].intersects(tb)) continue;		// Тайл не пересекает drawTileID
					if(!node['loaderDrawFlags'][tID]) node['loaderDrawFlags'][tID] = [];
					node['loaderDrawFlags'][tID].push(attr['drawTileID']);
				}

				flag = true;
				if(node['tilesLoadProgress'][tID]) continue;
				(function(pattr, stID, drawFlag) {
					var drawMe = null;
					if(drawFlag) {
						drawMe = function() {
							var tarr = node['loaderDrawFlags'][stID];
/*if(!tarr) {
	node.reloadTilesList(200);
	return;
}*/
							var queueFlags = {};
							for (var i = 0; i < tarr.length; i++)
							{
								var drawTileID = tarr[i];
								var ptt = node['tilesKeys'][drawTileID];
								for(var tKey in ptt) {
									if(!queueFlags[tKey]) node.repaintTile(ptt[tKey], true);
									queueFlags[tKey] = true;
								}
							}
							queueFlags = null;
							delete node['loaderDrawFlags'][stID];
						}
					}
					var arr = stID.split('_');
					var srcArr = option.tileFunc(Number(arr[1]), Number(arr[2]), Number(arr[0]));
					if(typeof(srcArr) === 'string') {
						if(stID in node['tilesVers']) srcArr += '&v=' + node['tilesVers'][stID];
						srcArr = [srcArr];
					}
					node['loaderFlag'] = true;
					var item = {
						'srcArr': srcArr
						,'layer': node.id
						,'callback': function(data) {
							delete node['tilesLoadProgress'][stID];
							gmxAPI._listeners.dispatchEvent('onTileLoaded', gmxNode, {'obj':gmxNode, 'attr':{'data':{'tileID':stID, 'data':data}}});		// tile загружен
							data = null;
							if(drawMe) drawMe();
						}
						,'onerror': function(err){						// ошибка при загрузке тайла
							delete node['tilesLoadProgress'][stID];
							node['badTiles'][stID] = true;
							gmxAPI.addDebugWarnings(err);
							if(drawMe) drawMe();
							//else waitRedraw(100);
							//node.waitRedrawTile(node['loaderDrawFlags'][tkey], 200);
						}
					};
					gmxAPI._leaflet['vectorTileLoader'].push(item);
					node['tilesLoadProgress'][stID] = true;
				})(attr, tID, (ext ? false : true));
			}
			return flag;
		};

		var getTilesByVisibleExtent = function() {			// Получить тайлы векторного слоя по видимому extent
			var currPos = gmxAPI.currPosition || map.getPosition();
			var ext = {	minX: -Number.MAX_VALUE, minY: -Number.MAX_VALUE, maxX: Number.MAX_VALUE, maxY: Number.MAX_VALUE };
			node['loadTilesByExtent'](ext);
		}

		node['chkTemporalFilter'] = function (item) {				// проверка мультивременного фильтра
			if(node['temporal'] && item['propHiden']) {
				if(node['temporal']['ut1'] > item['propHiden']['unixTimeStamp'] || node['temporal']['ut2'] < item['propHiden']['unixTimeStamp']) {
					return false;
				}
			}
			return true;
		}
/*
		node['osmRasterFunc'] = function(x, y, z) {			// Получение URL для OSM растров
            var size = Math.pow(2, z - 1);
            return "http://tile2.maps.2gis.com/tiles?x="  + (x+ size) + "&y=" + (size - y - 1) + "&z=" + z + "&v=4";
		}
*/		
		node['setTiledQuicklooks'] = function(callback, minZoom, maxZoom, tileSenderPrefix) {			// установка тайловых квиклуков
			if(callback) node['tileRasterFunc'] = callback;
			if(minZoom) node['quicklookZoomBounds']['minZ'] = minZoom;
			if(maxZoom) node['quicklookZoomBounds']['maxZ'] = maxZoom;
			if(tileSenderPrefix) node['rasterCatalogTilePrefix'] = layer['tileSenderPrefix'];
		}
		
		node['setZoomBoundsQuicklook'] = function(minZ, maxZ) {			//ограничение по зуум квиклуков
			node['quicklookZoomBounds']['minZ'] = minZ;
			node['quicklookZoomBounds']['maxZ'] = maxZ;
		}
		var getItemsFromTileByBounds = function(items, bounds) {			// получить обьекты из тайла по bounds(Mercator)
			var arr = [];
			if(items && items.length > 0) {
				for (var i = 0; i < items.length; i++)
				{
					var item = items[i];
					if(!item.bounds.intersects(bounds)) continue;					// обьект не пересекает границы тайла
					arr.push(item);
				}
			}
			return arr;
		}
		var getItemsByBounds = function(bounds) {			// получить обьекты из тайлов векторного слоя по bounds(Mercator)
			var arr = [];
			arr = getItemsFromTileByBounds(node['addedItems'], bounds);
			for (var tileID in node['tiles'])
			{
				var tileBound = node['tiles'][tileID];
				if(tileBound.intersects(bounds)) {
					var iarr = node['tilesGeometry'][tileID];
					if(iarr && iarr.length > 0) {
						var items = getItemsFromTileByBounds(iarr, bounds);
						if(items.length) arr = arr.concat(items);
					}
				}
			}
			return arr;
		}
		var getItemsFromTile = function(items, mPoint) {			// получить обьекты из тайла
			var arr = [];
			if(items && items.length > 0) {
				for (var i = 0; i < items.length; i++)
				{
					var item = items[i];
					var pid = '_' + item.id;
					if(!item.propHiden['toFilters'] || !item.propHiden['toFilters'].length) continue;		// обьект не попал в фильтр
					if(!chkSqlFuncVisibility(item)) continue; 	// если фильтр видимости на слое не отменен
					
					if(node.chkTemporalFilter(item)) {
						if('contains' in item) {
							if(item['contains'](mPoint)) arr.push(item), arr[pid] = true;
						}
						else if(item.bounds.contains(mPoint)) arr.push(item), arr[pid] = true;
					}
				}
			}
			return arr;
		}
		var getItemsByPoint = function(latlng) {			// получить обьекты по пересечению с точкой
			var arr = [];
			var mPoint = new L.Point(gmxAPI.merc_x(latlng['lng']), gmxAPI.merc_y(latlng['lat']));
			arr = getItemsFromTile(node['addedItems'], mPoint);
			for (var tileID in node['tiles'])
			{
				var tileBound = node['tiles'][tileID];
				if(chkPointDelta(tileBound, mPoint)) {
					var iarr = node['tilesGeometry'][tileID];
					if(iarr && iarr.length > 0) {
						var items = getItemsFromTile(iarr, mPoint);
						if(items.length) arr = arr.concat(items);
					}
				}
			}
			return arr;
		}

		var getTKeysFromGmxTileID = function(tkeys, gmxTiles) {			// событие mouseOut
			for (var gmxTileID in gmxTiles) {
				for(var tKey in node['tilesKeys'][gmxTileID]) {
					tkeys[tKey] = true;
				}
			}
		}

		var mouseOut = function() {			// событие mouseOut
			if(node['hoverItem']) {
				gmxAPI._leaflet['LabelsManager'].remove(node.id, node['hoverItem'].geom.id);
				var zoom = LMap.getZoom();
				var drawInTiles = node['hoverItem'].geom.propHiden['drawInTiles'];
				if(drawInTiles && drawInTiles[zoom]) {
					var tilesNeed = {};
					getTKeysFromGmxTileID(tilesNeed, drawInTiles[zoom]);
					redrawTilesHash(tilesNeed, true);
				}
				gmxAPI._div.style.cursor = '';
				callHandler('onMouseOut', node['hoverItem'].geom, gmxNode);
				var filter = getItemFilter(node['hoverItem']);
				if(filter) callHandler('onMouseOut', node['hoverItem'].geom, filter);
				node['hoverItem'] = null;
			}
		}
		//gmxAPI.map.addListener('hideHoverBalloon', mouseOut);

		node['mouseMoveCheck'] = function(evName, ph) {			// проверка событий векторного слоя
			if(!node.isVisible || gmxAPI._drawing['activeState'] || !node['leaflet'] || node['leaflet']._isVisible == false || gmxAPI._leaflet['mousePressed'] || gmxAPI._leaflet['curDragState'] || gmxAPI._mouseOnBalloon) return false;
			var latlng = ph.attr['latlng'];
			var zoom = LMap.getZoom();
			var x = latlng['lng'] % 360;
			if(x < -180) x += 360;
			else if(x > 180) x -= 360;

			var tNums = gmxAPI.getTileFromPoint(x, latlng['lat'], zoom);
			var gmxTileID = tNums.z + '_' + tNums.x + '_' + tNums.y;
			var mPoint = new L.Point(gmxAPI.merc_x(x), gmxAPI.merc_y(latlng['lat']));
			var arr = tilesRedrawImages.getHoverItemsByPoint(gmxTileID, mPoint);
			
			if(arr && arr.length) {
				var item = getTopFromArrItem(arr);
				if(item) {
					hoverItem(item);
					return true;
				}
			}
			mouseOut();
			return false;
		};

		var callHandler = function(evName, geom, gNode, attr) {				// Вызов Handler для item
			var res = false;
			var rNode = mapNodes[gNode.objectId || gNode.id];
			if(rNode && rNode['handlers'][evName]) {			// Есть handlers на слое
				if(!attr) attr = {};
				attr['geom'] = node['getItemGeometry'](geom.id);
				attr[evName] = true;
				res = rNode['handlers'][evName].call(gNode, geom.id, getPropItem(geom), attr);
			}
			return res;
		}
		var hoverItem = function(item) {				// Отрисовка hoveredStyle для item
			if(!item) return;
			if(!item.geom) {
				item = {'id': item.id, 'geom': item};
			}
			var itemId = item.geom.id;
			var propHiden = item.geom.propHiden;
			var zoom = LMap.getZoom();
			var hoveredStyle = null;
			var regularStyle = null;
			var filter = getItemFilter(item.geom);
			if(propHiden['subType'] != 'cluster') {
				if(filter) {
					hoveredStyle = (filter.hoveredStyle ? filter.hoveredStyle : null);
					regularStyle = (filter.regularStyle ? filter.regularStyle : null);
				}
			} else {
				hoveredStyle = node['clustersData']['hoveredStyle'];
				regularStyle = node['clustersData']['regularStyle'];
			}
			if(hoveredStyle) {	// todo - изменить drawInTiles с учетом Z
				if(!node['hoverItem'] || node['hoverItem'].geom.id != itemId) {
					var tilesNeed = {};
					if(node['hoverItem']) {
						var drawInTiles = node['hoverItem'].geom.propHiden['drawInTiles'];
						if(drawInTiles && drawInTiles[zoom]) {
							getTKeysFromGmxTileID(tilesNeed, drawInTiles[zoom]);
						}
						delete node['hoverItem'].geom['_cache'];
					}
					//delete item.geom['_cache'];
					node['hoverItem'] = item;
					item.geom.propHiden.curStyle = utils.evalStyle(hoveredStyle, item.geom.properties);
					
					var drawInTiles = propHiden['drawInTiles'];
					if(drawInTiles && drawInTiles[zoom]) {
						getTKeysFromGmxTileID(tilesNeed, drawInTiles[zoom]);
					}
					redrawTilesHash(tilesNeed, true);
					item.geom.propHiden.curStyle = utils.evalStyle(regularStyle, item.geom.properties);
					delete item.geom['_cache'];
					
					gmxAPI._div.style.cursor = 'pointer';
					if(filter && callHandler('onMouseOver', item.geom, filter)) return true;
					if(callHandler('onMouseOver', item.geom, gmxNode)) return true;
				}
				return true;
			}
		}

		var getTopFromArrItem = function(arr) {				// Получить верхний item из массива с учетом flip
			if(!arr || !arr.length) return null;
			var ph = {};
			for (var i = 0; i < arr.length; i++) ph[arr[i].id || arr[i].geom.id] = i;
			var out = null;
			for (var i = node['flipedIDS'].length - 1; i >= 0; i--)
			{
				var tid = node['flipedIDS'][i];
				if(tid in ph) return arr[ph[tid]];
			}
			return arr[arr.length - 1];
		}

		var chkFlip = function(fid) {				// убираем дубли flip
			if(node['flipHash'][fid]) {
				for (var i = 0; i < node['flipedIDS'].length; i++)
				{
					if(fid == node['flipedIDS'][i]) {
						node['flipedIDS'].splice(i, 1);
						break;
					}
				}
			}
			node['flipedIDS'].push(fid);
			node['flipHash'][fid] = true;
		}
		
		node['addFlip'] = function(fid) {			// добавить обьект flip сортировки
			chkFlip(fid);
			node.redrawFlips(true);
			return node['flipedIDS'].length;
		}
		
		node['setFlip'] = function() {				// переместить обьект flip сортировки
			if(!node['flipIDS'] || !node['flipIDS'].length) return false;
			var vid = node['flipIDS'].shift();
			node['flipIDS'].push(vid);
			chkFlip(vid);

			if(node['tileRasterFunc']) {
				node.waitRedrawFlips(0);
			}
			var item = node['objectsData'][vid];
			if(!item) return null;
			var geom = node['getItemGeometry'](vid);
			var mObj = new gmxAPI._FlashMapFeature(geom, getPropItem(item), gmxNode);
			gmxAPI._listeners.dispatchEvent('onFlip', gmxNode, mObj);
			return item;
		}

		var getHandler = function(fid, evName) {			// Получить gmx обьект на котором установлен Handler
			var out = null;
			var item = node['objectsData'][fid];
			if(!item) return out;
			var itemPropHiden = item.propHiden;
			if(!itemPropHiden['toFilters'] || !itemPropHiden['toFilters'].length) return out;		// обьект не попал в фильтр
			var fID = itemPropHiden['toFilters'][0];
			var filter = gmxAPI.mapNodes[fID];
			if(filter && mapNodes[fID]['handlers'][evName]) {						// не найден фильтр
				out = filter;
			} else if(evName in node['handlers']) {						// Есть handlers на слое
				out = gmxNode;
			}
			return out;
		}

		var sortFlipIDS = function(arr) {			// Получить gmx обьект на котором установлен Handler
			var out = [];
			var pk = {};
			for (var i = 0; i < arr.length; i++) {
				var tid = arr[i].id || arr[i].geom.id;
				if(node['flipHash'][tid]) pk[tid] = true;
				else out.push(tid);
			}
			for (var i = 0; i < node['flipedIDS'].length; i++) {
				var tid = node['flipedIDS'][i];
				if(pk[tid]) out.push(tid);
			}
			return out;
		}
		
		var prevID = 0;
		var prevPoint = null;
		node['eventsCheck'] = function(evName, attr) {			// проверка событий векторного слоя
			if(evName !== 'onClick'
				|| gmxAPI._drawing['activeState']
				|| !node['leaflet']	|| !node['leaflet']._isVisible
				|| gmxAPI._leaflet['curDragState']) return false;

			//console.log('eventsCheck ' , evName, node.id, gmxAPI._leaflet['curDragState'], gmxAPI._drawing.tools['move'].isActive);

			//if(node['observerNode']) return false;
			if(!attr) attr = gmxAPI._leaflet['clickAttr'];
			if(!attr.latlng) return false;
			var latlng = attr.latlng;
			var arr = null;
			var zoom = LMap.getZoom();

			var x = latlng['lng'] % 360;
			if(x < -180) x += 360;
			else if(x > 180) x -= 360;
			var tNums = gmxAPI.getTileFromPoint(x, latlng['lat'], zoom);
			var gmxTileID = tNums.z + '_' + tNums.x + '_' + tNums.y;
			var mPoint = new L.Point(gmxAPI.merc_x(x), gmxAPI.merc_y(latlng['lat']));
			var arr = tilesRedrawImages.getHoverItemsByPoint(gmxTileID, mPoint);
			if(arr && arr.length) {
				//var toolsActive = (gmxAPI._drawing && !gmxAPI._drawing.tools['move'].isActive ? true : false);	// установлен режим рисования (не move)
				var needCheck = (!prevPoint || !attr.containerPoint || attr.containerPoint.x != prevPoint.x || attr.containerPoint.y != prevPoint.y);
				prevPoint = attr.containerPoint;
				if(needCheck) {
					node['flipIDS'] = sortFlipIDS(arr);
				}
				if(!node['flipIDS'].length) return false;
				var vid = node['flipIDS'][0];
				var item = arr[0];
				var oper = 'setFlip';
				var isCluster = (item.geom && item.geom.propHiden['subType'] == 'cluster' ? true : false);
				var itemPropHiden = null;
				var handlerObj = null;
				if(!isCluster) {
					var operView = false;
					if(attr.shiftKey && node['propHiden']['rasterView'] === 'onShiftClick') operView = true;
					else if(attr.ctrlKey && node['propHiden']['rasterView'] === 'onCtrlClick') operView = true;
					else if(node['propHiden']['rasterView'] === 'onClick') operView = true;
					
					vid = node['flipIDS'][node['flipIDS'].length - 1];
					handlerObj = getHandler(vid, evName);
					item = node['objectsData'][vid];
					if(node['flipEnabled'] && oper === 'setFlip') {
						item = node['setFlip']();
						if(!handlerObj && item.id === prevID) item = node['setFlip']();
					}
					if(!item) return true;
					vid = item.id;
					prevID = vid;
					itemPropHiden = item.propHiden;

					//console.log('flipIDS' , item.id);
					if(node['flipEnabled']) chkFlip(item.id);
					if(operView) {
						itemPropHiden['rasterView'] = !itemPropHiden['rasterView'];
						if(node['propHiden']['showOnlyTop']) {
							for (var i = 0; i < arr.length; i++) {
								if(arr[i].geom.id != item.id) {
									arr[i].geom.propHiden['rasterView'] = false;
									chkNeedImage(arr[i].geom);
								}
							}
						}
						chkNeedImage(item);
						
						if(node['propHiden']['stopFlag']) return true;
					}
				} else {
					itemPropHiden = item.geom.propHiden;
				}
				if(node['flipEnabled'] && oper === 'setFlip') {
					var hItem = getTopFromArrItem(arr);
					if(hItem) hoverItem(hItem);
				}
				
				var eventPos = {
					'latlng': { 'x': latlng.lng, 'y': latlng.lat }
					,'pixelInTile': attr.pixelInTile
					,'tID': gmxTileID
				};
				
				if(!isCluster) {
					if(handlerObj) {
						callHandler('onClick', item, handlerObj, {'eventPos': eventPos, 'layer': gmxNode});
						return true;
					}
				} else {
					if(callHandler('onClick', item.geom, gmxNode, {'objType': 'cluster', 'eventPos': eventPos, 'layer': gmxNode})) return true;
					var fID = itemPropHiden['toFilters'][0];
					var filter = gmxAPI.mapNodes[fID];
					if(filter && callHandler('onClick', item.geom, filter, {'eventPos': eventPos, 'layer': gmxNode})) return true;
				}
				return true;
			}
		}

		var getLatLngBounds = function(lb) {			// установка bounds leaflet слоя
			return new L.LatLngBounds([new L.LatLng(lb.min.y, lb.min.x), new L.LatLng(lb.max.y, lb.max.x)]);
		};

		var initCallback = function(obj) {			// инициализация leaflet слоя
			if(obj._container) {
				if(obj._container.id != id) obj._container.id = id;
				if(obj._container.style.position != 'absolute') obj._container.style.position = 'absolute';
				utils.bringToDepth(node, node['zIndex']);
			}
		};

		var attr = utils.prpLayerAttr(layer, node);
		if(attr['bounds']) node['bounds'] = attr['bounds'];
		node['minZ'] = inpAttr['minZoom'] || attr['minZoom'] || 1;
		node['maxZ'] = inpAttr['maxZoom'] || attr['maxZoom'] || 21
		var identityField = attr['identityField'] || 'ogc_fid';
		node['identityField'] = identityField;
		var typeGeo = attr['typeGeo'] || 'polygon';
		if(attr['typeGeo'] == 'polygon') {
			node['sortItems'] = function(a, b) {
				return a.properties[identityField] > b.properties[identityField];		
			}
		}
		
		var TemporalColumnName = attr['TemporalColumnName'] || '';
		var option = {
			'minZoom': 1
			,'maxZoom': 23
			,'minZ': node['minZ']
			,'maxZ': node['maxZ']
			,'id': id
			,'identityField': identityField
			,'initCallback': initCallback
			,'async': true
			//,'reuseTiles': true
			//,'updateWhenIdle': true
			,'unloadInvisibleTiles': true
			,'countInvisibleTiles': 0
			//,'countInvisibleTiles': (L.Browser.mobile ? 0 : 2)
		};
		//if(!gmxAPI.mapNodes[id].isBaseLayer && node['bounds']) {
		//	option['bounds'] = getLatLngBounds(node['bounds']);
		//}

		if(node['parentId']) option['parentId'] = node['parentId'];
	
		// получить bounds списка тайлов слоя
		node.getTilesBounds = function(arr, vers) {
			//var hash = {};
			var cnt = 0;
			for (var i = 0; i < arr.length; i+=3)
			{
				var x = Number(arr[i]) , y = Number(arr[i+1]) , z = Number(arr[i+2]);
				var st = z + '_' + x + '_' + y;
				var pz = Math.round(Math.pow(2, z - 1));
				var bounds = utils.getTileBounds({'x':x + pz, 'y':pz - 1 - y}, z);
				bounds.min.x = gmxAPI.merc_x(bounds.min.x);
				bounds.max.x = gmxAPI.merc_x(bounds.max.x);
				bounds.min.y = gmxAPI.merc_y(bounds.min.y);
				bounds.max.y = gmxAPI.merc_y(bounds.max.y);
				var d = (bounds.max.x - bounds.min.x)/10000;
				bounds.min.x += d;
				bounds.max.x -= d;
				bounds.min.y += d;
				bounds.max.y -= d;
				bounds.delta = 2*d;
				node['tiles'][st] = bounds;
			
				if(vers) {
					node['tilesVers'][st] = vers[cnt];
					cnt++;
				}
			}
			//return hash;
		}

		var vers = (node['subType'] === 'Temporal' ? null : layer.properties.tilesVers);
		node.getTilesBounds(inpAttr.dataTiles, vers);
		option['attr'] = attr;
		option['tileFunc'] = inpAttr['tileFunction'];
		
		var myLayer = null;

		function styleToGeo(geo, filter)	{			// Стиль обьекта векторного слоя
			//var style = (filter ? utils.evalStyle(filter.regularStyle, geo)
			if(!filter) return;
			
			var style = filter.regularStyle;
			var prop = getPropItem(geo);
			if(filter.regularStyleIsAttr) style = utils.evalStyle(filter.regularStyle, prop);
			
			var size = style['size'] || 5;

			if(style['label']) {
				var ptx = gmxAPI._leaflet['labelCanvas'].getContext('2d');
				ptx.clearRect(0, 0, 512, 512);
				var sizeLabel = style['label']['size'] || 12;
				var color = style['label']['color'] || 0;
				var haloColor = style['label']['haloColor'] || 0;
				var txt = style['label']['value'] || '';
				var field = style['label']['field'];
				if(field) {
					txt = prop[field] || '';
				}
				style['label']['fontStyle'] = sizeLabel + 'px "Arial"';
				ptx.font = style['label']['fontStyle'];
				style['label']['fillStyle'] = gmxAPI._leaflet['utils'].dec2rgba(color, 1);
				style['label']['strokeColor'] = gmxAPI._leaflet['utils'].dec2rgba(haloColor, 1);
				
				ptx.fillStyle = style['label']['fillStyle'];
				ptx.fillText(txt, 0, 0);
				style['label']['extent'] = new L.Point(ptx.measureText(txt).width, sizeLabel);
				geo['sxLabelLeft'] = geo['sxLabelRight'] = style['label']['extent'].x;
				geo['syLabelBottom'] = geo['syLabelTop'] = sizeLabel;
			}
			
			if(style['marker']) {
				if(style['image']) {
					if(style['imageWidth']) geo.sx = style['imageWidth']/2;
					if(style['imageHeight']) geo.sy = style['imageHeight']/2;
				} else {
					return;
				}
				
				//if(filter) filter.styleRecalc = (style['image'] ? false : true);
			} else {
				if(style['stroke']) {
					geo.sx = geo.sy = size;
				}
				if(style['fill']) {
					geo.sx = geo.sy = size;
				}
			}
			
			delete geo['_cache'];
			geo.curStyle = style;
		}
		var chkBorderTiles = function(geom, tile) {					// Проверка соседних тайлов
			var zoom = tile['zoom'];
			var propHiden = geom.propHiden;
			if(!propHiden['drawInTiles']) propHiden['drawInTiles'] = {};
			if(!propHiden['drawInTiles'][zoom]) propHiden['drawInTiles'][zoom] = {};
			var x = tile['x'];
			var y = tile['y'];
			var gmxTileID = zoom + '_' + x + '_' + y;
			propHiden['drawInTiles'][zoom][gmxTileID] = true;
			
//console.log('objectsData ' , tile['posInTile']);
			var parr = [];
			var posInTile = tile['posInTile'];
			var xd = (tile['posInTile']['x'] + tile['size'] > 256 ? 1
				: (tile['posInTile']['x'] - tile['size'] < 0 ? -1 : 0)
				);
			var yd = (tile['posInTile']['y'] + tile['size'] > 256 ? 1
				: (tile['posInTile']['y'] - tile['size'] < 0 ? -1 : 0)
				);
			if(xd === 1) {
				parr.push({ 'x': x+1 ,'y': y });
				if(yd === 1) {
					parr.push({ 'x': x+1 ,'y': y+1 });
				} else if(yd === -1) {
					parr.push({ 'x': x+1 ,'y': y-1 });
				}
			} else if(xd === -1) {
				parr.push({ 'x': x-1 ,'y': y });
				if(yd === 1) {
					parr.push({ 'x': x-1 ,'y': y+1 });
				} else if(yd === -1) {
					parr.push({ 'x': x-1 ,'y': y-1 });
				}
			} else if(yd === 1) {
				parr.push({ 'x': x ,'y': y+1 });
			} else if(yd === -1) {
				parr.push({ 'x': x ,'y': y-1 });
			}
			/*var parr = [
				{ 'x': x-1 ,'y': y }
				,{ 'x': x+1 ,'y': y }
				,{ 'x': x ,'y': y-1 }
				,{ 'x': x ,'y': y+1 }
				,{ 'x': x+1 ,'y': y+1 }
				,{ 'x': x-1 ,'y': y-1 }
				,{ 'x': x-1 ,'y': y+1 }
				,{ 'x': x+1 ,'y': y-1 }
			];*/

			for (var j = 0; j < parr.length; j++)
			{
				var rp = parr[j];
				var gmxTileID = zoom + '_' + rp.x + '_' + rp.y;
				
				var needCheck = true;
				if(gmxTileID in propHiden['drawInTiles'][zoom]) {
					needCheck = false;
				}
				if(needCheck) {
					var rbounds = utils.getTileBoundsMerc(rp, zoom);
					if(gmxAPI._leaflet['utils'].chkPointWithDelta(rbounds, geom.getPoint(), geom)) {
						propHiden['drawInTiles'][zoom][gmxTileID] = true;
						node.redrawTilesList(200);
					}
				}
			}
		}

		var getItemFilter = function(item) {			// Получить фильтр в который попал обьект
			var filter = null;
			if(item) {
				var geom = item.geom || item;
				var propHiden = geom.propHiden;
				//if(!propHiden && item.geom && item.geom.propHiden) propHiden = item.geom.propHiden;
				var filters = propHiden['toFilters'];
				if(filters.length == 0) filters = chkObjectFilters(geom);
				filter = (filters && filters.length ? mapNodes[filters[0]] : null);
			}
			return filter;
		}
		
		function chkObjectFilters(geo, tileSize)	{				// Получить фильтры для обьекта
			var zoom = LMap.getZoom();
			var toFilters = [];

			delete geo.curStyle;
			delete geo['_cache'];
			for (var z in geo.propHiden['drawInTiles'])
			{
				if(z != zoom) delete geo.propHiden['drawInTiles'][z];
			}
			var curStyle = null;
			var size = 4;
			var isViewPoint = (geo['type'] == 'Point' ? true : false);

			for(var j=0; j<node.filters.length; j++) {
				var filterID = node.filters[j];
				var filter = mapNodes[node.filters[j]];
				if(zoom > filter.maxZ || zoom < filter.minZ) continue;
				var prop = getPropItem(geo);

				var flag = (filter && filter.sqlFunction ? filter.sqlFunction(prop) : true);
				if(flag) {
					toFilters.push(filterID);
					curStyle = (filter.regularStyle ? filter.regularStyle : null);
					if(curStyle) {
						if(curStyle.size) size = curStyle.size + 2 * curStyle.weight;
						var scale = curStyle['scale'] || 1;
						if(curStyle.marker) {
							if(curStyle.imageWidth && curStyle.imageHeight) {
								geo['sx'] = curStyle.imageWidth;
								geo['sy'] = curStyle.imageHeight;
								size = Math.sqrt(geo['sx']*geo['sx'] + geo['sy']*geo['sy']);
								isViewPoint = true;
							}
						}
						if(typeof(scale) == 'string') {
							scale = (curStyle['scaleFunction'] ? curStyle['scaleFunction'](prop) : 1);
						}
						if('minScale' in curStyle && scale < curStyle['minScale']) scale = curStyle['minScale'];
						else if('maxScale' in curStyle && scale > curStyle['maxScale']) scale = curStyle['maxScale'];
						size *= scale;
						geo.propHiden.curStyle = curStyle;
					}
					break;						// Один обьект в один фильтр 
				}
			}
			if(tileSize && isViewPoint) {
				var coord = geo['getPoint']();
				var xx = coord.x/tileSize;
				var yy = coord.y/tileSize;
				var tile = {
					'x':	Math.floor(xx)
					,'y':	Math.floor(yy)
					,'z':	zoom
					,'size': size
					,'posInTile': {
						'x': (xx < 0 ? 256 : 0) + 256 * (coord.x % tileSize) / tileSize
						,'y': (yy < 0 ? 256 : 0) + 256 * (coord.y % tileSize) / tileSize
					}
				};
				chkBorderTiles(geo, tile);
				//chkBorderTiles(geo, tile.x, tile.y);
			}
			geo.propHiden['toFilters'] = toFilters;
			geo.propHiden['_isFilters'] = (toFilters.length ? true : false);
			return toFilters;
		}

		function objectsToFilters(arr, tileID)	{				// Разложить массив обьектов по фильтрам
			var outArr = [];
			var zoom = LMap.getZoom();
			var tileSize = Math.pow(2, 8 - zoom) * 156543.033928041;

			for (var i = 0; i < arr.length; i++)
			{
				var ph = arr[i];
				if(!ph) return;
				var prop = ph['properties'];

				var id = ph['id'] || prop[identityField];
//if(id != 3) continue;	

				var propHiden = {};
				propHiden['fromTiles'] = {};
				propHiden['subType'] = 'fromVectorTile';
				var _notVisible = false;
				if(TemporalColumnName) {
					var zn = prop[TemporalColumnName] || '';
					zn = zn.replace(/(\d+)\.(\d+)\.(\d+)/g, '$2/$3/$1');
					var vDate = new Date(zn);
					var offset = vDate.getTimezoneOffset();
					var dt = Math.floor(vDate.getTime() / 1000  - offset*60);
					propHiden['unixTimeStamp'] = dt;
				}
				var tileBounds = null;
				if(tileID) {
					propHiden['tileID'] = tileID;
					propHiden['fromTiles'][tileID] = true;
					tileBounds = (tileID === 'addItem' ? utils.maxBounds() : node['tiles'][tileID]);
				}
				//console.log('objectsData ' , ph, node['objectsData']);
			
				var geo = {};
				if(ph['geometry']) {
					if(!ph['geometry']['type']) ph['geometry']['type'] = typeGeo;
					geo = utils.fromTileGeometry(ph['geometry'], tileBounds);
					if(!geo) {
						gmxAPI._debugWarnings.push({'tileID': tileID, 'badObject': ph['geometry']});
						continue;
					}
					geo['id'] = id;
					outArr.push(geo);
				}
				var objData = {
					'id': id
					,'type': geo['type'].toUpperCase()
					,'properties': prop
					,'propHiden': propHiden
				};
				geo['propHiden'] = objData['propHiden'];
				geo['properties'] = objData['properties'];
				propHiden['toFilters'] = chkObjectFilters(geo, tileSize);

				if(node['objectsData'][id]) {		// Обьект уже имеется - нужна??? склейка геометрий
					var pt = node['objectsData'][id];
					if(objData['type'] != 'POINT' && objData['type'].indexOf('MULTI') == -1) pt['type'] = 'MULTI' + objData['type'];
					pt['propHiden']['fromTiles'][tileID] = true;
					geo['propHiden'] = pt['propHiden'];
				} else {
					node['objectsData'][id] = objData;
				}
			}
			arr = [];
			return outArr;
		}

		var removeItems = function(data, inUpdate) {		// удаление обьектов векторного слоя 
			var needRemove = {};
			for (var index in data)
			{
				var pid = data[index];
				if(typeof(pid) === "object") pid = pid['id'];
				else if(pid === true) pid = index;
				needRemove[pid] = true;
				gmxAPI._leaflet['LabelsManager'].remove(node.id, pid);	// Переформировать Labels
				delete node['objectsData'][pid];
			}

			var arr = [];
			for (var i = 0; i < node['addedItems'].length; i++)
			{
				var item = node['addedItems'][i]; 
				if(!needRemove[item['id']]) arr.push(item);
			}
			node['addedItems'] = arr;

			for(var tileID in node['tilesGeometry']) {
				var arr = node['tilesGeometry'][tileID];	// Обьекты тайла
				if(arr && arr.length) {
					var arr1 = [];
					for (var i = 0; i < arr.length; i++) {
						var item = arr[i]; 
						if(!needRemove[item['id']]) arr1.push(item);
					}
					node['tilesGeometry'][tileID] = arr1;
				}
			}

			tilesRedrawImages.removeItems(needRemove);
			needRemove = {};
		}

		node['removeItems'] = function(data) {		// удаление обьектов векторного слоя 
//console.log('removeItems ', node.id, data);
			removeItems(data)
			//upDateLayer();
			node.reloadTilesList(20);
			//node.redrawTilesList();
			//node.redrawFlips(true);
			//waitRedraw();
		}
		node['addItems'] = function(data) {			// добавление обьектов векторного слоя
//console.log('addItems ', node.id, data);
			removeItems(data)
			node['addedItems'] = node['addedItems'].concat(objectsToFilters(data, 'addItem'));
			clearDrawDone();
			node.reloadTilesList(20);
			//node.redrawTilesList();
			//removeTiles();
			//upDateLayer();

			//node.redrawFlips(true);
			//node['tilesRedrawImages'] = {};
			//waitRedraw();
			return true;
		}
		node['setEditObjects'] = function(attr) {	// Установка редактируемых обьектов векторного слоя
			if(attr.removeIDS) {
				var arr = [];
				for (var key in attr.removeIDS)
				{
					arr.push(key);
				}
				node['removeItems'](arr);
			}
			if(attr.addObjects) {
				node['removeItems'](attr.addObjects);
				node['addItems'](attr.addObjects);
				for (var i = 0; i < attr.addObjects.length; i++)
				{
					var item = attr.addObjects[i]; 
					node['editedObjects'][item.id] = true;
				}
			}
			return true;
		}
		
/*		var needRedrawTiles = {};										// Список дорисовки обьектов по соседним тайлам

		var removeFromBorderTiles = function(drawTileID) {			// Чистка обьектов соседних тайлов
			for (var tileID in needRedrawTiles) {
				var arrGeoms = needRedrawTiles[tileID];
				for (var key in arrGeoms)
				{
					var geom = arrGeoms[key];
					if(geom.propHiden['tileID'] == drawTileID) {
						delete needRedrawTiles[tileID][key];
					}
				}
			}
		}*/

		var tilesRedrawImages = {						// Управление отрисовкой растров векторного тайла
			'getHoverItemsByPoint': function(gmxTileID, mPoint)	{				// Получить обьекты под мышкой
				var zoom = LMap.getZoom();
				var tKeys = node['tilesKeys'][gmxTileID];
				var out = [];
				for(var tKey in tKeys) {
					if(!node['tilesRedrawImages'][zoom] || !node['tilesRedrawImages'][zoom][tKey]) return [];
					var minDist = Number.MAX_VALUE;
					var mInPixel = gmxAPI._leaflet['mInPixel'];
					mInPixel *= mInPixel;

					var thash = node['tilesRedrawImages'][zoom][tKey];
					for (var i = 0; i < thash['arr'].length; i++)
					{
						var item = thash['arr'][i];
						var propHiden = item.geom['propHiden'];
						var drawInTiles = propHiden['drawInTiles'][zoom];
						var flag = false;
						for (var key in drawInTiles)
						{
							if(key == gmxTileID) {
								flag = true;
								break;
							}
						}
						if(!flag) continue;
						if('contains' in item.geom) {
							if(!item.geom['contains'](mPoint, null, item.src)) continue;
						}
						else if(!item.geom.bounds.contains(mPoint)) continue;

						var dist = minDist;
						if('distance2' in item.geom) {
							dist = item.geom['distance2'](mPoint);
							if(dist * mInPixel > item.geom['sx']*item.geom['sy']) continue;
						}
						if(dist < minDist) { out.unshift(item); minDist = dist; }
						else out.push(item);
					}
					return out;
				}
				return out;
			}
			,
			'getItemsByPoint': function(tID, mPoint)	{				// Получить обьекты под мышкой
				var zoom = LMap.getZoom();
				if(!node['tilesRedrawImages'][zoom] || !node['tilesRedrawImages'][zoom][tID]) return [];
				var minDist = Number.MAX_VALUE;
				var mInPixel = gmxAPI._leaflet['mInPixel'];
				mInPixel *= mInPixel;

				var thash = node['tilesRedrawImages'][zoom][tID];
				var out = [];
				for (var i = 0; i < thash['arr'].length; i++)
				{
					var item = thash['arr'][i];
					if('contains' in item.geom) {
						if(!item.geom['contains'](mPoint, null, item.src)) continue;
					}
					else if(!item.geom.bounds.contains(mPoint)) continue;

					var dist = minDist;
					if('distance2' in item.geom) {
						dist = item.geom['distance2'](mPoint);
						if(dist * mInPixel > item.geom['sx']*item.geom['sy']) continue;
					}
					if(dist < minDist) { out.unshift(item); minDist = dist; }
					else out.push(item);
				}
				return out;
			}
			,
			'getTileItems': function(zoom, tileID)	{				// Получить обьекты попавшие в тайл отрисовки
				if(node['tilesRedrawImages'][zoom] && node['tilesRedrawImages'][zoom][tileID]) return node['tilesRedrawImages'][zoom][tileID];
				return [];
			}
			,
			'clear': function(zoom, tileID)	{						// Удалить обьекты попавшие в тайл отрисовки
				if(zoom && node['tilesRedrawImages'][zoom] && tileID && node['tilesRedrawImages'][zoom][tileID]) delete node['tilesRedrawImages'][zoom][tileID];
				else if(zoom && node['tilesRedrawImages'][zoom] && !tileID) delete node['tilesRedrawImages'][zoom];
				else if(!zoom && !tileID) node['tilesRedrawImages'] = {};
				return true;
			}
			,
			'removeImage': function(vID)	{						// Удалить Image обьекта
				for (var z in node['tilesRedrawImages']) {
					for (var tileID in node['tilesRedrawImages'][z]) {
						var thash = node['tilesRedrawImages'][z][tileID];
						for (var i = 0; i < thash['arr'].length; i++)
						{
							var it = thash['arr'][i];
							if(it.geom.id === vID) delete node['tilesRedrawImages'][z][tileID]['arr'][i]['imageObj'];
						}
					}
				}
				return true;
			}
			,
			'removeItems': function(needRemove)	{						// Удалить обьекта по Hash
				for (var z in node['tilesRedrawImages']) {
					for (var tileID in node['tilesRedrawImages'][z]) {
						var thash = node['tilesRedrawImages'][z][tileID];
						var out = [];
						for (var i = 0; i < thash['arr'].length; i++)
						{
							var it = thash['arr'][i];
							if(!needRemove[it.geom.id]) out.push(it);
						}
						thash['arr'] = out;
					}
				}
				return true;
			}
		}

		var drawRasters = function(tileID)	{						// отрисовка растров векторного тайла
			//console.log('drawRasters ', tileID);
			var zoom = LMap.getZoom();
			node.redrawTile(tileID, zoom);
			return true;
		}
		
		// получить растр обьекта рекурсивно от начального zoom
		var badRastersURL = {};
		node.loadRasterRecursion = function(z, x, y, ogc_fid, rItem, callback) {
			var objData = node['objectsData'][ogc_fid];
			if(!objData) {
			//console.log('objData ', node.id, ogc_fid, z, rItem.attr.zoom, node['objectsData'][String(ogc_fid)]);
				return;
			}
			var rUrl = node['tileRasterFunc'](x, y, z, objData);
			var onError = function() {
				badRastersURL[rUrl] = true;
				if (z > 1) {
					// запрос по раззумливанию растрового тайла
					node.loadRasterRecursion(z - 1, Math.floor(x/2), Math.floor(y/2), ogc_fid, rItem, callback);
				} else {
					callback(null);
					return;
				}
			};
			if(badRastersURL[rUrl]) {
				onError();
				return;
			}
			var zoomFrom = rItem.attr.zoom;
			var item = {
				'src': rUrl
				,'zoom': zoomFrom
				,'callback': function(imageObj) {
					// раззумливание растров
					if(zoomFrom > z) {
						var pos = gmxAPI.getTilePosZoomDelta(rItem.attr.scanexTilePoint, zoomFrom, z);
						var canvas = document.createElement('canvas');
						canvas.width = canvas.height = 256;
						//canvas.id = zoomFrom+'_'+pos.x+'_'+pos.y;
						var ptx = canvas.getContext('2d');
						ptx.drawImage(imageObj, pos.x, pos.y, pos.size, pos.size, 0, 0, 256, 256);
						imageObj = canvas;
					}
					var pt = {'idr': ogc_fid, 'callback': function(content) {
						rItem['imageObj'] = content;
						callback(rItem['imageObj']);
					}};
					rItem['imageObj'] = (node['imageProcessingHook'] ? node['imageProcessingHook'](imageObj, pt) : imageObj);
					if(rItem['imageObj']) callback(rItem['imageObj']);
				}
				,'onerror': onError
			};
			if(node['imageProcessingHook'] || zoomFrom != z) item['crossOrigin'] = 'anonymous';	// если требуется преобразование image
			gmxAPI._leaflet['imageLoader'].push(item);
		}

		node.getRaster = function(rItem, ogc_fid, callback)	{	// получить растр обьекта векторного тайла
			if(!node['tileRasterFunc']) return false;

			var attr = rItem.attr;
			var zoom = LMap.getZoom();
			var drawTileID = attr.drawTileID;

			if(node['tilesRedrawImages'][zoom] && node['tilesRedrawImages'][zoom][drawTileID]) {
				var thash = node['tilesRedrawImages'][zoom][drawTileID];
				for (var i = 0; i < thash['arr'].length; i++)
				{
					var it = thash['arr'][i];
					if(it['src'] == rItem['src'] && it['imageObj']) {
						rItem['imageObj'] = it['imageObj'];
						callback(rItem['imageObj']);
						return true;
					}
				}
			}

			node.loadRasterRecursion(zoom, attr.scanexTilePoint['x'], attr.scanexTilePoint['y'], ogc_fid, rItem, callback);
		}

		var isInTile = function(geom, attr) {		// попал обьект в тайл или нет
			if(geom.propHiden['drawInTiles']
				&& geom.propHiden['drawInTiles'][attr.zoom]
				&& geom.propHiden['drawInTiles'][attr.zoom][attr.drawInTiles]
				) return true;
			var flag = false;
			/*if(geom.type === 'Point') {
				if(!(attr.zoom in geom['propHiden']['drawInTiles'])) {
					geom['propHiden']['toFilters'] = chkObjectFilters(geom, attr.tileSize);
				}
				if(geom['propHiden']['drawInTiles'][attr.zoom][attr.drawTileID]) flag = true;	// обьект не пересекает границы тайла
			} else {*/
				if(geom['intersects']) {						// если geom имеет свой метод intersects
					if(geom['intersects'](attr.bounds)) flag = true;
				}
				else if(attr.bounds.intersects(geom.bounds)) flag = true;					// обьект не пересекает границы тайла
			//}
			return flag;
		}

		var getObjectsByTile = function(attr) {		// получить список обьектов попавших в тайл
			var arr = [];
			var arrTop = [];
			var zoom = attr['zoom'];
			if(!gmxAPI._leaflet['zoomCurrent']) utils.chkZoomCurrent(zoom);
			attr['tileSize'] = gmxAPI._leaflet['zoomCurrent']['tileSize'];

			var drawTileID = attr['drawTileID'];
			var tKey = attr['tKey'];
			for (var key in node['tilesGeometry'])						// Перебрать все загруженные тайлы
			{
				var tb = node['tiles'][key];
				if(!chkBoundsDelta(tb, attr.bounds)) continue;
				for (var i1 = 0; i1 < node['tilesGeometry'][key].length; i1++)
				{
					var geom = node['tilesGeometry'][key][i1];
					/*if(geom.id == 3) {
					var tt = 1;
					}*/
					if(!isInTile(geom, attr)) continue;	// обьект не пересекает границы тайла
					
					if(!geom.propHiden['_isFilters']) continue;		// если нет фильтра пропускаем
					
					if(!chkSqlFuncVisibility(geom)) {	 // если фильтр видимости на слое
						continue;
					}
					if(geom.type !== 'Point' && geom.type !== 'Polygon' && geom.type !== 'MultiPolygon' && geom.type !== 'Polyline' && geom.type !== 'MultiPolyline') continue;
					

					if(node['flipHash'][geom['id']]) arrTop.push(geom); 	// Нарисовать поверх
					else arr.push(geom);
				}
			}
			if(node['addedItems'].length) {
				for (var i1 = 0; i1 < node['addedItems'].length; i1++)
				{
					var geom = node['addedItems'][i1];
					if(!geom.propHiden['_isFilters']) continue;		// если нет фильтра пропускаем
					
					if(!chkSqlFuncVisibility(geom)) {	 // если фильтр видимости на слое
						continue;
					}
					if(geom.type !== 'Point' && geom.type !== 'Polygon' && geom.type !== 'MultiPolygon' && geom.type !== 'Polyline' && geom.type !== 'MultiPolyline') continue;
					
					if(node['flipHash'][geom['id']]) arrTop.push(geom); 	// Нарисовать поверх
					else arr.push(geom);
				}
				//arr = arr.concat(node['addedItems']);
			}
			
			if('sortItems' in node) {
				arr = arr.sort(node['sortItems']);
			}
			arr = arr.concat(arrTop);
//console.log(' getObjectsByTile: ' , node.id, drawTileID , ' : ', arr.length);
			return arr;
		}

		var getTileAttr = function(tilePoint, zoom)	{		// получить атрибуты тайла
			var tKey = tilePoint.x + ':' + tilePoint.y;
			
			if(!zoom) zoom = LMap.getZoom();
			if(!gmxAPI._leaflet['zoomCurrent']) utils.chkZoomCurrent(zoom);
			var zoomCurrent = gmxAPI._leaflet['zoomCurrent'];
			var pz = zoomCurrent['pz'];
			var tx = tilePoint.x % pz + (tilePoint.x < 0 ? pz : 0);
			var ty = tilePoint.y % pz + (tilePoint.y < 0 ? pz : 0);
			var scanexTilePoint = {
				'x': tx % pz - pz/2
				,'y': pz/2 - 1 - ty % pz
			};

			var drawTileID = zoom + '_' + scanexTilePoint.x + '_' + scanexTilePoint.y;
			var bounds = utils.getTileBoundsMerc(scanexTilePoint, zoom);
			var attr = {
				'node': node
				,'x': 256 * scanexTilePoint.x
				,'y': 256 * scanexTilePoint.y
				,'zoom': zoom
				,'bounds': bounds
				,'drawTileID': drawTileID
				,'scanexTilePoint': scanexTilePoint
				,'tilePoint': tilePoint
				,'tKey': tilePoint.x + ':' + tilePoint.y
				,'tileSize': zoomCurrent['tileSize']
			};
			return attr;
		}
		
		var observerTimer = null;										// Таймер
		node.repaintTile = function(tilePoint, clearFlag)	{				// перерисовать векторный тайл слоя
			var zoom = LMap.getZoom();
			var attr = getTileAttr(tilePoint, zoom);
			var tKey = attr['tKey'];
			var drawTileID = attr['drawTileID'];
			
			var tile = null;
			var ctx = null;

			var out = false;
			if(node['observerNode']) {
				if(observerTimer) clearTimeout(observerTimer);
				observerTimer = setTimeout(node['chkObserver'], 0);
			}

			var cnt = 0;
			var rasterNums = 0;
			var ritemsArr = [];
			var drawGeoArr = function(arr, flag) {							// Отрисовка массива геометрий
				var res = [];
				for (var i1 = 0; i1 < arr.length; i1++)
				{
					var geom = arr[i1];
					if(geom.type !== 'Point' && geom.type !== 'Polygon' && geom.type !== 'MultiPolygon' && geom.type !== 'Polyline' && geom.type !== 'MultiPolyline') continue;

					var objData = node['objectsData'][geom['id']] || geom;
					var propHiden = objData['propHiden'];
					if(!propHiden['drawInTiles']) propHiden['drawInTiles'] = {};
					if(!propHiden['drawInTiles'][zoom]) propHiden['drawInTiles'][zoom] = {};
					
					if(propHiden['subType'] != 'cluster') {						// для кластеров без проверки
						if(!isInTile(geom, attr)) continue;	// обьект не пересекает границы тайла

						if(!chkSqlFuncVisibility(objData)) {	 // если фильтр видимости на слое
							continue;
						}

						if(!node.chkTemporalFilter(geom)) {	// не прошел по мультивременному фильтру
							continue;
						}
/*
						if(!geom.propHiden.curStyle) {
							var filter = getItemFilter(objData);
							if(!filter || filter.isVisible === false) continue;		// если нет фильтра или он невидим пропускаем
							if(filter) {
								//geom.curStyle = (filter.regularStyle ? filter.regularStyle : null);
								geom.propHiden.curStyle = (filter.regularStyle ? filter.regularStyle : null);
							}
						}*/
					}
					
					propHiden['drawInTiles'][zoom][drawTileID] = true;
					var style = geom.propHiden.curStyle || null;
					attr['style'] = style;
					cnt++;

					var showRaster = (
						!node['tileRasterFunc']
						||
						(
							(zoom < node['quicklookZoomBounds']['minZ'] || zoom > node['quicklookZoomBounds']['maxZ'])
							&&
							(node['propHiden']['rasterView'] == '' || !propHiden['rasterView'])
						)
						? false
						: true
					);
						
					var rUrl = '';
					if(node['tileRasterFunc']) rUrl = node['tileRasterFunc'](attr.scanexTilePoint['x'], attr.scanexTilePoint['y'], zoom, objData);

					var rItem = {
						'geom': geom
						,'attr': attr
						,'src': rUrl
						,'showRaster': showRaster
					};
					ritemsArr.push(rItem);
					
					if(showRaster) {
						rasterNums++;
						(function(pItem, pid) {
							node.getRaster(pItem, pid, function(img) {
								rasterNums--;
								pItem['imageObj'] = img;
								if(!node['tilesRedrawImages'][zoom]) return;
								if(!node['tilesRedrawImages'][zoom][tKey]) return;
//console.log(' showRaster: ' + drawTileID + pItem.attr.drawTileID + ' : ', tKey, rasterNums + ' : ' + node['tilesRedrawImages'][zoom][tKey]['rasterNums']);
								if(rasterNums === 0) {
									node['tilesRedrawImages'][zoom][tKey]['rasterNums'] = 0;
									var zd = 50 * gmxAPI._leaflet['imageLoader'].getCounts();
									node.waitRedrawFlips(zd, true);
									myLayer._markTile(pItem.attr['tilePoint'], cnt);
								}
							});
						})(rItem, geom['id']);
					} else {
						if(!tile) {
							tile = node['leaflet'].getCanvasTile(tilePoint);
							tile.id = drawTileID;
							//ctx = tile.getContext('2d');
						}
						objectToCanvas(rItem, tile, clearFlag);
						clearFlag = false;
						if(geom.type === 'Point') {
							node.upDateLayer(200);
						}
					}

					res.push(geom['id']);
				}
				if(!node['tilesRedrawImages'][zoom]) node['tilesRedrawImages'][zoom] = {};
				node['tilesRedrawImages'][zoom][tKey]	= {'rasterNums':rasterNums, 'arr':ritemsArr, 'tilePoint': tilePoint, 'drawTileID': drawTileID};
				ritemsArr = null;
				return res;
			}

			//var needDraw = [];
			var arr = getObjectsByTile(attr, clearFlag);
			if(node['clustersData']) {						// Получить кластеры
				arr = node['clustersData'].getTileClusterArray(arr, attr);
				gmxAPI._leaflet['LabelsManager'].remove(node.id);	// Переформировать Labels
				//removeFromBorderTiles(tKey);
				node.waitRedrawFlips();							// требуется отложенная перерисовка
			}
			drawGeoArr(arr);
			arr = null;
			if(rasterNums === 0) {
				myLayer._markTile(tilePoint, cnt);
				if(cnt == 0) myLayer.removeTile(tilePoint);		// Удаление ставшего пустым тайла
			}
			//chkBorders(200);
			return out;
		}
		node['labelBounds'] = {'add': {}, 'skip': {}};			// Добавленные и пропущенные labels обьектов слоя
		node['chkTilesParentStyle'] = function() {				// перерисовка при изменении fillOpacity - rasterView
			reCheckFilters();
			node.redrawFlips();
		};
		var chkGlobalAlpha = function(ctx) {					// проверка fillOpacity стиля заполнения обьектов векторного слоя - rasterView
			var tilesParent = gmxNode['tilesParent'];
			if(!tilesParent) return;
			var tpNode = mapNodes[tilesParent.objectId];
			if(!tpNode || !tpNode.regularStyle || !tpNode.regularStyle.fill) return;
			ctx.globalAlpha = tpNode.regularStyle.fillOpacity;
			
			//ctx.globalCompositeOperation = 'destination-over'; // 'source-over'
			return true;
		};

		var setCanvasStyle = function(tile, ctx, style)	{							// указать стиль Canvas
			if(style) {
				//if(style['stroke'] && style['weight'] > 0) {
				var strokeStyle = '';
				if(style['stroke']) {
					var lineWidth = style['weight'] || 0;
					if(ctx.lineWidth != lineWidth) ctx.lineWidth = lineWidth;
					var opacity = ('opacity' in style ? style['opacity'] : 0);
					if(style['weight'] == 0) opacity = 0; // если 0 ширина линии скрываем через opacity
					//strokeStyle = style['color_rgba'] || 'rgba(0, 0, 255, 1)';
					//strokeStyle = strokeStyle.replace(/1\)/, opacity + ')');
					strokeStyle = utils.dec2rgba(style['color_dec'] || 255, opacity);
				} else {
					strokeStyle = 'rgba(0, 0, 255, 0)';
				}
				if(tile._strokeStyle != strokeStyle) ctx.strokeStyle = strokeStyle;
				tile._strokeStyle = strokeStyle;
				
				if(style['fill']) {
					var fillOpacity = style['fillOpacity'] || 0;
					//var fillStyle = style['fillColor_rgba'] || 'rgba(0, 0, 255, 1)';
					//fillStyle = fillStyle.replace(/1\)/, fillOpacity + ')');
					var fillStyle = utils.dec2rgba(style['fillColor_dec'] || 255, fillOpacity);
					if(tile._fillStyle != fillStyle) ctx.fillStyle = fillStyle;
					tile._fillStyle = fillStyle;
				}
			}
			//ctx.save();
		}

		node.countInCanvas = 0;					// колич.отрисованных обьектов в тайлах
		// отрисовка векторного обьекта тайла
		var objectToCanvas = function(pt, tile, flagClear) {
			var ctx = tile.getContext('2d');
			var attr = pt['attr'];
			var geom = pt['geom'];
			var imageObj = pt['imageObj'];
			//ctx.save();
			if(flagClear) {
				ctx.clearRect(0, 0, 256, 256);
				attr['labelBounds'] = [];
			}
			if(!geom.propHiden.curStyle) {
				var filter = getItemFilter(geom);
				if(!filter || filter.isVisible === false) return;		// если нет фильтра или он невидим пропускаем
				if(filter) {
					geom.propHiden.curStyle = (filter.regularStyle ? filter.regularStyle : null);
				}
			}			
			if(!geom.propHiden.curStyle) return;
			
			var itemStyle = geom.propHiden.curStyle;
			setCanvasStyle(tile, ctx, itemStyle);
			//ctx.restore();
			if(imageObj) {
				ctx.save();
				if('rasterOpacity' in itemStyle) {					// для растров в КР
					ctx.globalAlpha = itemStyle.rasterOpacity;
				} else {
					chkGlobalAlpha(ctx);
				}
				var pattern = ctx.createPattern(imageObj, "no-repeat");
				ctx.fillStyle = pattern;
				//ctx.fillRect(0, 0, 256, 256);
				geom['paintFill'](attr, itemStyle, ctx, false);
				ctx.fill();
				ctx.clip();
				ctx.restore();
			}
			node.countInCanvas += geom['paint'](attr, itemStyle, ctx);
		}

		function chkItemFiltersVisible(geo)	{				// Проверить видимость фильтров для обьекта
			var filters = geo.propHiden.toFilters;
			for (var i = 0; i < filters.length; i++) {
				var fId = filters[i];
				var mapNodeFilter = mapNodes[fId];
				if(mapNodeFilter.isVisible != false) return true;
			}
			return false;
		}

		node.redrawTile = function(tKey, zoom, redrawFlag)	{			// перерисовка 1 тайла
			if(!node['tilesRedrawImages'][zoom]) return;		// ждем начала загрузки
			var thash = node['tilesRedrawImages'][zoom][tKey];
			if(!thash || thash['rasterNums'] > 0) return;		// ждем загрузки растров
			if(!redrawFlag && thash['drawDone']) return;		// тайл уже полностью отрисован
			
			var tile = null;
			var ctx = null;

			//var borders = needRedrawTiles[tKey] || null;

			var flagClear = true;
			var out = {};
			var item = null;
			var arr = thash['arr'];
			for (var i = 0; i < arr.length; i++) {
				item = arr[i];
				//if(item['showRaster'] && !item['imageObj']) continue;	// обьект имеет растр который еще не загружен
				//if(node['_sqlFuncVisibility'] && !node['_sqlFuncVisibility'](getPropItem(item.geom))) continue; // если фильтр видимости на слое
				if(!chkSqlFuncVisibility(item.geom)) continue; // если фильтр видимости на слое
				if(!chkItemFiltersVisible(item.geom)) continue;
				if(!node.chkTemporalFilter(item.geom)) {	// не прошел по мультивременному фильтру
					continue;
				}
				var itemId = item.geom.id;
				/*if(borders && borders[itemId]) {
					continue;
				} else */
				if(node['flipHash'][itemId]) {
					if(!out[itemId]) out[itemId] = [];
					out[itemId].push(item);
				} else {
					if(!tile) {
						tile = node['leaflet'].getCanvasTile(thash.tilePoint);
						//ctx = tile.getContext('2d');
					}

					objectToCanvas(item, tile, flagClear);
					flagClear = false;
				}

			}
/*			if(borders) {											// перерисовка пограничных обьектов
				var arr1 = thash['drawTileID'].split('_');
				var tp = {
					'x': parseFloat(arr1[1])
					,'y': parseFloat(arr1[2])
				};

				var attr = {
					'zoom': zoom
					,'drawTileID': thash['drawTileID']
					,'tKey': tKey
					,'tilePoint': thash.tilePoint
					,'node': node
					,'x': 256 * tp.x
					,'y': 256 * tp.y
					,'bounds': utils.getTileBoundsMerc(tp, zoom)
				};
				if(!ctx) {
					tile = node['leaflet'].getCanvasTile(thash.tilePoint);
					ctx = tile.getContext('2d');
				}
				for (var key in borders)
				{
					if(!node.chkTemporalFilter(borders[key])) continue;
					objectToCanvas({ 'geom': borders[key], 'attr': attr	}, ctx, flagClear);
					flagClear = false;
				}
			}*/
			for (var i = 0; i < node['flipedIDS'].length; i++) {	// перерисовка fliped обьектов
				var id = node['flipedIDS'][i];
				if(out[id]) {
					if(!tile) {
						tile = node['leaflet'].getCanvasTile(thash.tilePoint);
						//ctx = tile.getContext('2d');
					}
					for (var j = 0; j < out[id].length; j++) {
						objectToCanvas(out[id][j], tile, flagClear);
						flagClear = false;
					}
				}
			}
			if(tile && flagClear) tile.getContext('2d').clearRect(0, 0, 256, 256);
			out = null;
			arr = null;
			//borders = null;
			if(tile) tile._needRemove = flagClear;
			thash['drawDone'] = true;
			return true;
		}
		
		var redrawTilesHash = function(hash, redrawFlag)	{					// перерисовка тайлов по hash
			var zoom = LMap.getZoom();
			for (var tileID in hash)
			{
				node.redrawTile(tileID, zoom, redrawFlag);
			}
			//myLayer.removeEmptyTiles();
		}
		node.redrawFlips = function(redrawFlag)	{						// перерисовка (растров) обьектов под мышкой
			var zoom = LMap.getZoom();
			redrawTilesHash(node['tilesRedrawImages'][zoom], redrawFlag);
			return true;
		}

		// проверка необходимости загрузки растра для обьекта векторного слоя при действиях мыши
		var chkNeedImage = function(item) {
			//console.log('chkNeedImage ', item);
			var zoom = LMap.getZoom();
			var itemId = item.id;
			
			var rasterNums = 0;
			for (var tKey in node['tilesRedrawImages'][zoom]) {
				var thash = tilesRedrawImages.getTileItems(zoom, tKey);
				for (var i = 0; i < thash['arr'].length; i++) {
					var pt = thash['arr'][i];
					if(pt.geom['id'] != itemId) continue;
					if(item.propHiden['rasterView']) {
						if(pt['imageObj'] || !pt['src']) continue;		// imageObj уже загружен либо нечего загружать
						rasterNums++;
						(function(pItem, pid) {
							node.getRaster(pItem, pid, function(img) {
								pItem['imageObj'] = img;
								rasterNums--;
								if(rasterNums === 0) node.waitRedrawFlips(100, true);
							});
						})(pt, itemId);
					} else {
						tilesRedrawImages.removeImage(itemId);
						node.waitRedrawFlips(100, true);
					}
				}
			}
			if(rasterNums === 0) {
				node.waitRedrawFlips(100, true);
			}
		}
		node.parseVectorTile = function(data, tileID, dAttr)	{		// парсинг векторного тайла
			node['tilesGeometry'][tileID] = objectsToFilters(data, tileID, dAttr);
			data = null;
			//waitRedrawFlips();
			//upDateLayer();
			return true;
		}
/*
		node.waitRedrawTile = function(attr, zd)	{							// перерисовать векторный тайл слоя
			if(arguments.length == 1) zd = 100;
			var tilePoint = attr['tilePoint'];
			var tKey = tilePoint.x + ':' + tilePoint.y;
			//var drawTileID = attr['drawTileID'];
			var timerID = node['tilesRedrawTimers'][tKey];			// Таймер отрисовки тайла
			if(timerID) clearTimeout(timerID);
			//console.log('waitRedrawTile ' , drawTileID , timerID);
			node['tilesRedrawTimers'][tKey] = setTimeout(function() { node.repaintTile(attr, true); }, zd);
		}
*/
		var redrawTimer = null;										// Таймер
		var waitRedraw = function()	{								// Требуется перерисовка слоя с задержкой
//console.log('waitRedraw ', node.id, myLayer._isVisible);
			if(redrawTimer) clearTimeout(redrawTimer);
			redrawTimer = setTimeout(function()
			{
				if(!node.isVisible || !myLayer || !myLayer._isVisible) return;
				redrawTimer = null;
				//node['labelsBounds'] = [];
				myLayer.redraw();
				gmxAPI._leaflet['lastZoom'] = LMap.getZoom();
			}, 10);
			return false;
		}
		node.waitRedraw = waitRedraw;				// перерисовать существующие тайлы слоя
/*
		var chkBordersTimer = null;								// Таймер
		var chkBorders = function(zd)	{						// пересоздание тайлов слоя с задержкой
			if(chkBordersTimer) clearTimeout(chkBordersTimer);
			if(arguments.length == 0) zd = 10;
			chkBordersTimer = setTimeout(function()
			{
				redrawTilesHash(needRedrawTiles, true);
				//myLayer.removeEmptyTiles();
			}, zd);
			return false;
		}
*/
		var upDateLayerTimer = null;								// Таймер
		node.upDateLayer = function(zd)	{						// пересоздание тайлов слоя с задержкой
			if(upDateLayerTimer) clearTimeout(upDateLayerTimer);
			if(!myLayer || myLayer._isVisible === false) return false;
			if(arguments.length == 0) zd = 10;
			if(!myLayer._map) {
				node.upDateLayer(200);
				return false;
			}
			
			upDateLayerTimer = setTimeout(function()
			{
				myLayer._tilesKeysCurrent = {};
				myLayer._update();
			}, zd);
			return true;
		}

		var reloadTilesListTimer = null;							// Таймер
		node.reloadTilesList = function(zd)	{						// перезагрузка тайлов слоя с задержкой
			if(!myLayer || myLayer._isVisible == false) return;
			if(reloadTilesListTimer) clearTimeout(reloadTilesListTimer);
			if(arguments.length == 0) zd = 0;
			reloadTilesListTimer = setTimeout(function()
			{
				myLayer.removeAllTiles();
				var queueFlags = {};
				for(var gmxTileID in node['tilesKeys']) {
					var tKeys = node['tilesKeys'][gmxTileID];
					for(var tKey in tKeys) {
						if(!queueFlags[tKey]) {
							node.chkLoadTile(tKeys[tKey]);
						}
						queueFlags[tKey] = true;
					}
				}
			}, zd);
			return false;
		}
		var redrawTilesListTimer = null;								// Таймер
		node.redrawTilesList = function(zd)	{						// пересоздание тайлов слоя с задержкой
			if(redrawTilesListTimer) clearTimeout(redrawTilesListTimer);
			if(arguments.length == 0) zd = 0;
			redrawTilesListTimer = setTimeout(function()
			{
				for(var gmxTileID in node['tilesKeys']) {
					var tKeys = node['tilesKeys'][gmxTileID];
					for(var tKey in tKeys) {
						var tilePoint = tKeys[tKey];
						node.repaintTile(tilePoint, true);
					}
				}
			}, zd);
			return false;
		}
/*		var redrawAllTilesTimer = null;								// Таймер
		var redrawAllTiles = function(zd)	{						// пересоздание тайлов слоя с задержкой
			if(redrawAllTilesTimer) clearTimeout(redrawAllTilesTimer);
			if(arguments.length == 0) zd = 0;
			redrawAllTilesTimer = setTimeout(function()
			{
				for(var key in myLayer._tiles) {
					var tile = myLayer._tiles[key];
					myLayer.drawTile(tile, tile._tilePoint);
				}
				node.upDateLayer();
			}, zd);
			return false;
		}*/

		var removeTiles = function(zd)	{						// удалить тайлы которые уже на сцене
			if(myLayer) {
				for (var key in myLayer._tiles) {
					var tile = myLayer._tiles[key];
					tile._needRemove = true;
				}
				//myLayer.removeEmptyTiles();
			}
		}
		
		var redrawFlipsTimer = null;								// Таймер
		node.waitRedrawFlips = function(zd, redrawFlag)	{			// Требуется перерисовка уже отрисованных тайлов с задержкой
			if(redrawFlipsTimer) clearTimeout(redrawFlipsTimer);
			if(arguments.length == 0) zd = 100;
			redrawFlipsTimer = setTimeout(function()
			{
				node.redrawFlips(redrawFlag);
			}, zd);
			return false;
		}
		
		var clearDrawDone = function()	{								// переустановка обьектов по фильтрам
			var zoom = LMap.getZoom();
			if(node['tilesRedrawImages'][zoom]) {
				for (var tID in node['tilesRedrawImages'][zoom])
				{
					delete node['tilesRedrawImages'][zoom][tID]['drawDone'];
				}
			}
		}
		
		var reCheckFilters = function(tileSize)	{							// переустановка обьектов по фильтрам
			//needRedrawTiles = {};
			for (var tileID in node['tilesGeometry'])						// Перебрать все загруженные тайлы
			{
				var arr = node['tilesGeometry'][tileID];
				for (var i = 0; i < arr.length; i++) {
					var geom = arr[i];
					delete geom.propHiden['curStyle'];
					delete geom.propHiden['_isSQLVisibility'];
					delete geom.propHiden['_isFilters'];
					geom.propHiden['toFilters'] = chkObjectFilters(geom, tileSize);
				}
			}
			for (var i = 0; i < node['addedItems'].length; i++) {
				delete node['addedItems'][i].propHiden['curStyle'];
				delete node['addedItems'][i].propHiden['_isSQLVisibility'];
				delete node['addedItems'][i].propHiden['_isFilters'];
				node['addedItems'][i].propHiden['toFilters'] = chkObjectFilters(node['addedItems'][i], tileSize);
			}
			clearDrawDone();
		}

		node.chkZoomBoundsFilters = function()	{	// Проверка видимости по Zoom фильтров
			var minZ = node.minZ;
			var maxZ = node.maxZ;
			for(var j=0; j<node.filters.length; j++) {
				var filter = mapNodes[node.filters[j]];
				if(maxZ < filter.maxZ) maxZ = filter.maxZ;
				if(minZ > filter.minZ) minZ = filter.minZ;
			}
			if(maxZ != node.maxZ) node.maxZ = maxZ;
			if(minZ != node.minZ) node.minZ = minZ;
			if(myLayer) {
				myLayer._isVisible = false;
				node.onZoomend();
			}
		}

		node.onZoomend = function()	{				// Проверка видимости по Zoom
			if(!node.isVisible || !myLayer) return false;
			var flag = myLayer._isVisible;
			/*if(myLayer.options.minZoom != node['minZ'] || myLayer.options.maxZoom != node['maxZ']) {
				myLayer.options.minZoom = node['minZ'];
				myLayer.options.maxZoom = node['maxZ'];
			}*/
			node['labelBounds'] = {'add': {}, 'skip': {}};
			var currZ = LMap.getZoom();
			for (var z in node['tilesRedrawImages']) {
				if(z != currZ) delete node['tilesRedrawImages'][z];
			}
			
			var tileSize = Math.pow(2, 8 - currZ) * 156543.033928041;
			reCheckFilters(tileSize);

			flag = (utils.chkVisibilityByZoom(node.id) && (node['bounds'] ? utils.chkBoundsVisible(node['bounds']) : true));
			//flag = (currZ < node['minZ'] || currZ > node['maxZ'] ? false : true);		// Неподходящий zoom
			if(flag != myLayer._isVisible) {
				utils.setVisibleNode({'obj': node, 'attr': flag});
				node.upDateLayer(20);
				//waitRedraw();
				if(!flag) gmxAPI._leaflet['LabelsManager'].onChangeVisible(node.id, flag);
			}
			//waitRedrawFlips(0);
		}
		
		node.refreshFilter = function(fid)	{		// обновить фильтр
			var filterNode = mapNodes[fid];
			if(!filterNode) return;						// Нода не была создана через addObject
			reCheckFilters();
			if(node.isVisible) node.waitRedrawFlips(0);
			gmxAPI._leaflet['lastZoom'] = -1;
			return true;
		}
		node.setStyleFilter = function(fid)	{		// обновить стиль фильтра
			node.refreshFilter(fid);
			return true;
		}

		node.removeFilter = function(fid)	{		// Удаление фильтра векторного слоя
			var arr = [];
			for (var i = 0; i < node['filters'].length; i++)
			{
				if(node['filters'][i] != fid) arr.push(node['filters'][i]);
			}
			node['filters'] = arr;
			//reCheckFilters();
		}

		//var redrawAllTilesTimer = null;								// Таймер
		node.setFilter = function(fid)	{			// Добавить фильтр к векторному слою
			var flag = true;
			for (var i = 0; i < node['filters'].length; i++)
			{
				if(node['filters'][i] == fid) {
					flag = false;
					break;
				}
			}
			if(flag) node['filters'].push(fid);
			//node.refreshFilter(fid);
			reCheckFilters();

			if(node.isVisible) {
				node.redrawTilesList();
				//redrawAllTiles();
				//tilesRedrawImages.clear();
				//if(redrawAllTilesTimer) clearTimeout(redrawAllTilesTimer);
				//redrawAllTilesTimer = setTimeout(redrawAllTiles, 50);
				//clearDrawDone();
				//removeTiles();
				//upDateLayer(20);
			}
			//mapNodes[fid]['setClusters'] = node.setClusters;
		}

		node.removeTile = function(key)	{			// Удалить тайл
			if('chkRemovedTiles' in node) node['chkRemovedTiles'](key);
/*			
			var pt = node['tilesGeometry'][key];
			
			if(!pt) return;							// тайл не загружен
			for(var ogc_fid in pt)
			{
				var ph = pt[ogc_fid];
				var arr = ph['toFilters'];
				for (var i = 0; i < arr.length; i++)
				{
					removeNode(arr[i]);
				}
				delete node['objectsData'][ogc_fid];
			}
*/
			delete node['tilesGeometry'][key];
			delete node['tiles'][key];
			return true;
		}

		node.addTile = function(arr)	{			// Добавить тайл
			//var st:String =arr[i+2] + '_' + attr['dtiles'][i] + '_' + attr['dtiles'][i+1];
			return true;
		}
/*
		var removeEditedObjects = function()	{			// Удалить редактируемые обьекты
			var arr = [];
			for (var i = 0; i < node['addedItems'].length; i++)
			{
				var item = node['addedItems'][i]; 
				if(!node['editedObjects'][item.id]) arr.push(item);
			}
			node['editedObjects'] = {};
			node['addedItems'] = arr;
			return true;
		}
*/
		var refreshBounds = function() {	// Обновление лефлет слоя
			var pt = utils.prpLayerAttr(gmxNode, node);
			if(pt['bounds']) node['bounds'] = pt['bounds'];
			if(node.leaflet) {
				//node.leaflet.options['bounds'] = getLatLngBounds(node['bounds']);
				node.leaflet._update();
			}
		};

		node['inUpdate'] = {}		// Обьекты векторного слоя находяшииеся в режиме редактирования
		node['startLoadTiles'] = function(attr)	{		// Перезагрузка тайлов векторного слоя
			var redrawFlag = false;
			gmxAPI._leaflet['LabelsManager'].remove(node.id);
			tilesRedrawImages.clear();
			gmxAPI._leaflet['vectorTileLoader'].clearLayer(node.id);

			node['tilesLoadProgress'] = {};
			node['loaderDrawFlags'] = {};
			badRastersURL = {};
			if (!attr.notClear) {
				for(var key in node['tilesGeometry']) {
					node.removeTile(key);	// Полная перезагрузка тайлов
				}
				node['addedItems'] = [];
				node['objectsData'] = {};
				redrawFlag = true;
			}
			
			if (attr.processing) {						// Для обычных слоев
				//removeEditedObjects();
				node['editedObjects'] = {};
				node['addedItems'] = [];
				
				node['inUpdate'] = attr.processing.inUpdate || {};
				if (attr.processing.removeIDS) {
					removeItems(attr.processing.removeIDS, node['inUpdate']);
				}
				if (attr.processing.addObjects) {
					node['addedItems'] = node['addedItems'].concat(objectsToFilters(attr.processing.addObjects, 'addItem'));
				}
			}
			
			if (attr.add || attr.del) {			// Для обычных слоев
				if (attr.del) {
					for(var key in attr.del) node.removeTile(key);	// удаление тайлов
				}
				if (attr.add) {
					var vers = [];
					var arr = [];
					for (var i = 0; i < attr.add.length; i++)
					{
						var pt = attr.add[i];
						arr.push(pt[0], pt[1], pt[2]);
						vers.push(pt[3]);
					}
					node.getTilesBounds(arr, vers);
					arr = [];
					vers = [];
					redrawFlag = true;
				}
			}

			if('dtiles' in attr) {		// Для мультивременных слоев
				node.getTilesBounds(attr['dtiles']);
				/*for(var key in pt) {
					//node.removeTile(key);
					if(!node['tiles'][key]) {
						node['tiles'][key] = pt[key];
						redrawFlag = true;
					}
				}*/
				node.temporal = attr;
			}
			if(node.leaflet) {	// Обновление лефлет слоя
				//refreshBounds();
				//waitRedraw();
				//clearDrawDone();
				//removeTiles();
//getTilesByVisibleExtent();
				//upDateLayer();
				//redrawAllTiles();
				node.reloadTilesList();
			}
			return true;
		}

		var gmxNode = gmxAPI.mapNodes[id];		// Нода gmxAPI
		var onLayerEventID = gmxNode.addListener('onLayer', function(obj) {	// Слой инициализирован
			gmxNode.removeListener('onLayer', onLayerEventID);
			gmxNode = obj;
			if(node.needInit) nodeInit();
			var key = 'onChangeVisible';
			node['listenerIDS'][key] = {'obj': gmxNode, 'evID': gmxNode.addListener(key, function(flag) {	// Изменилась видимость слоя
				if(flag) {
					node.upDateLayer();
				} else {
					gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map, {});	// Проверка map Listeners на hideBalloons
				}
				gmxAPI._leaflet['LabelsManager'].onChangeVisible(id, flag);
			}, -10)};
			key = 'onChangeLayerVersion';
			node['listenerIDS'][key] = {'obj': gmxNode, 'evID': gmxNode.addListener(key, refreshBounds)};
			node.setClusters = gmxAPI._leaflet['ClustersLeaflet'].setClusters;
		});
		node.needInit = true;
		function nodeInit()	{
			node.needInit = false;
			// Обработчик события - onTileLoaded
			var key = 'onTileLoaded';
			var evID = gmxAPI._listeners.addListener({'level': 11, 'eventName': key, 'obj': gmxNode, 'func': function(ph) {
					var nodeLayer = mapNodes[id];
					if(ph.attr) {
						nodeLayer.parseVectorTile(ph.attr['data']['data'], ph.attr['data']['tileID'], ph.attr['data']['dAttr']);
						ph = null;
					}
				}
			});
			node['listenerIDS'][key] = {'evID': evID, 'obj': gmxNode};
			key = 'onZoomend'; node['listenerIDS'][key] = { 'evID': gmxAPI._listeners.addListener({'level': -10, 'eventName': key, 'func': node.onZoomend}) };
			// image загружен
			key = 'onIconLoaded';
			node['listenerIDS'][key] = {'evID': gmxAPI._listeners.addListener({'level': 11, 'eventName': key, 'func': function(eID) {
				for (var i = 0; i < node['filters'].length; i++)
				{
					if(node['filters'][i] === eID) node.refreshFilter(eID);
				}
				}})
			};
			key = 'hideHoverBalloon';
			node['listenerIDS'][key] = {'evID': gmxAPI.map.addListener(key, mouseOut), 'obj': gmxAPI.map};
			
			var createLayerTimer = null;										// Таймер
			var createLayer = function()	{								// Требуется перерисовка слоя с задержкой
				myLayer = new L.TileLayer.VectorTiles(option);
				node['leaflet'] = myLayer;
				node.chkZoomBoundsFilters();
				if(node.isVisible || layer.properties['visible']) {
					if(node.isVisible != false) {
						utils.setVisibleNode({'obj': node, 'attr': true});
						node.isVisible = true;
					}
				} else {
					node.isVisible = false;
				}
			}
			var waitCreateLayer = function()	{								// Требуется перерисовка слоя с задержкой
				if(createLayerTimer) clearTimeout(createLayerTimer);
				createLayerTimer = setTimeout(function()
				{
					createLayerTimer = null;
					if(gmxAPI.map.needMove) {
						waitCreateLayer();
						return;
					}
					createLayer();
				}, 100);
			}
			if(gmxAPI.map.needMove) {
				waitCreateLayer();
			} else {
				createLayer();
			}
		}
		node['remove'] = function()	{		// Удалить векторный слой
			if(!node['leaflet']) return;
			mouseOut();
			if(observerTimer) clearTimeout(observerTimer);
			if(redrawTimer) clearTimeout(redrawTimer);
			if(redrawFlipsTimer) clearTimeout(redrawFlipsTimer);

			for(var key in node['listenerIDS']) {
				var item = node['listenerIDS'][key];
				if(item.obj) item.obj.removeListener(key, item.evID);
				else gmxAPI._listeners.removeListener(null, 'onZoomend', item.evID);
			}

			utils.removeLeafletNode(node);
			delete node['leaflet'];
			delete node['listenerIDS'];
		}
	}

	// инициализация
	function init(arr)	{
		LMap = gmxAPI._leaflet['LMap'];
		utils = gmxAPI._leaflet['utils'];
		mapNodes = gmxAPI._leaflet['mapNodes'];
		
		// Векторный слой
		L.TileLayer.VectorTiles = L.TileLayer.Canvas.extend(
		{
			_initContainer: function () {
				L.TileLayer.Canvas.prototype._initContainer.call(this);
				if('initCallback' in this.options) this.options.initCallback(this);
			}
			,
			_clearBgBuffer: function () {
				if (!this._map) {
					//console.log('_clearBgBuffer: ', this.id);
					return;
				}
				L.TileLayer.Canvas.prototype._clearBgBuffer.call(this);
			}
			,
			_reset: function (e) {
				this._tilesKeysCurrent = {};
				L.TileLayer.Canvas.prototype._reset.call(this, e);
			}
			,
			_update: function () {
				if (!this._map) {
					//console.log('_update: ', this.id);
					return;
				}

				var bounds = this._map.getPixelBounds(),
					zoom = this._map.getZoom(),
					tileSize = this.options.tileSize;

				if (zoom > this.options.maxZ || zoom < this.options.minZ) {
					return;
				}

				var nwTilePoint = new L.Point(
						Math.floor(bounds.min.x / tileSize),
						Math.floor(bounds.min.y / tileSize)),

					seTilePoint = new L.Point(
						Math.floor(bounds.max.x / tileSize),
						Math.floor(bounds.max.y / tileSize)),

					tileBounds = new L.Bounds(nwTilePoint, seTilePoint);

				this._addTilesFromCenterOut(tileBounds);
			var countInvisibleTiles = this.options.countInvisibleTiles;
			tileBounds.min.x -= countInvisibleTiles; tileBounds.max.x += countInvisibleTiles;
			tileBounds.min.y -= countInvisibleTiles; tileBounds.max.y += countInvisibleTiles;

				if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
					this._removeOtherTiles(tileBounds);
				}
			}
			,
			_getGMXtileNum: function (tilePoint, zoom) {
				var pz = Math.pow(2, zoom);
				var tx = tilePoint.x % pz + (tilePoint.x < 0 ? pz : 0);
				var ty = tilePoint.y % pz + (tilePoint.y < 0 ? pz : 0);
				var gmxTilePoint = {
					'x': tx % pz - pz/2
					,'y': pz/2 - 1 - ty % pz
				};
				return zoom + '_' + gmxTilePoint.x + '_' + gmxTilePoint.y;
			}
			,
			_addTilesFromCenterOut: function (bounds) {
				var queue = [],
					center = bounds.getCenter();

				var j, i, point;
				var zoom = this._map.getZoom();
				var node = mapNodes[this.options['id']];
				node['tilesKeys'] = {};
				if(!this._tilesKeysCurrent) this._tilesKeysCurrent = {};
				var curKeys = {};

				for (j = bounds.min.y; j <= bounds.max.y; j++) {
					for (i = bounds.min.x; i <= bounds.max.x; i++) {
						point = new L.Point(i, j);
						var gmxTileID = this._getGMXtileNum(point, zoom);
						if(!node['tilesKeys'][gmxTileID]) node['tilesKeys'][gmxTileID] = {};
						var tKey = point.x + ':' + point.y;
						node['tilesKeys'][gmxTileID][tKey] = point;

						if (!this._tilesKeysCurrent[tKey] && this._tileShouldBeLoaded(point)) {
							queue.push(point);
						}
						curKeys[tKey] = true;
					}
				}
				this._tilesKeysCurrent = curKeys;

				var tilesToLoad = queue.length;

				if (tilesToLoad === 0) { return; }

				// load tiles in order of their distance to center
				queue.sort(function (a, b) {
					return a.distanceTo(center) - b.distanceTo(center);
				});

				var fragment = document.createDocumentFragment();

				// if its the first batch of tiles to load
				if (!this._tilesToLoad) {
					this.fire('loading');
				}

				this._tilesToLoad += tilesToLoad;

				this._tileContainer.appendChild(fragment);

				for (i = 0; i < tilesToLoad; i++) {
					this._addTile(queue[i], fragment);
				}
			}
			,
			getCanvasTile: function (tilePoint) {
				var tKey = tilePoint.x + ':' + tilePoint.y;
				for(var key in this._tiles) {
					if(key == tKey) return this._tiles[key];
				}
				if (!this._map) {
					//console.log('getCanvasTile: ', this.id);
				}
				var tile = this._getTile();
				tile.id = tKey;
				tile._layer = this;
				tile._tilePoint = tilePoint;

				this._tiles[tKey] = tile;
				this._tileContainer.appendChild(tile);

				var tilePos = this._getTilePos(tilePoint);
				L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);

				return this._tiles[tKey];
			}
			,
			_markTile: function (tilePoint, cnt) {					// cnt = количество отрисованных обьектов в тайле
				var tKey = tilePoint.x + ':' + tilePoint.y;
				var tile = this._tiles[tKey] || null;
				if (cnt > 0) {
					if(!tile) tile = this.getCanvasTile(tilePoint);
					this._tileOnLoad.call(tile);
					tile._tileComplete = true;					// Added by OriginalSin
					tile._needRemove = false;
					tile._cnt = cnt;
				} else {
					if(tile) tile._needRemove = true;
				}
				this._tileLoaded();
			}
			,
			tileDrawn: function (tile, cnt) {				// cnt = количество отрисованных обьектов в тайле
				if(tile) {
					if (cnt > 0) {
						this._tileOnLoad.call(tile);
						tile._tileComplete = true;					// Added by OriginalSin
						tile._needRemove = false;
					} else {
						tile._needRemove = true;
					}
				}
				this._tileLoaded();
				
			}
			,
			removeTile: function (tilePoint) {
				var tKey = tilePoint.x + ':' + tilePoint.y;
				if(this._tiles[tKey]) this._removeTile(tKey);
			}
			/*,
			removeEmptyTiles: function () {
				for(var key in this._tiles) {
					var tile = this._tiles[key];
					if (tile._needRemove) {
						this._removeTile(key);
					}
				}
			}*/
			,
			removeAllTiles: function () {
				for(var key in this._tiles) {
					this._removeTile(key);
				}
			}
			,
			_addTile: function (tilePoint, container) {
				this.drawTile(null, tilePoint, this._map._zoom);
			}
			,
			_getLoadedTilesPercentage: function (container) {
				// Added by OriginalSin
				if(!container) return 0;
				var len = 0, count = 0;
				var arr = ['img', 'canvas'];
				for (var key in arr) {
					var tiles = container.getElementsByTagName(arr[key]);
					if(tiles && tiles.length > 0) {
						len += tiles.length;
						for (var i = 0; i < tiles.length; i++) {
							if (tiles[i]._tileComplete) {
								count++;
							}
						}
					}
				}
				if(len < 1) return 0;
				return count / len;	
			}
			,
			drawTile: function (tile, tilePoint, zoom) {
				// override with rendering code
				var opt = this.options;
				var node = mapNodes[opt['id']];
				if(!node) return;								// Слой пропал
				node['chkLoadTile'](tilePoint, zoom);
			}
		});
	}

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['setVectorTiles'] = setVectorTiles;				// Добавить векторный слой
})();
