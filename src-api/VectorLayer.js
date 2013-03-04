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
		var gmxNode = gmxAPI.mapNodes[id];		// Нода gmxAPI

		node['type'] = 'VectorLayer';
		node['minZ'] = 1;
		node['maxZ'] = 21;

		//node['observeVectorLayer'] = null;
		node['observerNode'] = null;
		
		node['needParse'] = [];
		node['parseTimer'] = 0;
		node['filters'] = [];
		//node['dataTiles'] = {};
		
		node['propHiden'] = {};					// Свойства внутренние
		node['tilesRedrawTimers'] = {};			// Таймеры отрисовки тайлов
		node['tilesRedrawImages'] = {};			// Отложенные отрисовки растров по тайлам
		node['tilesRedraw'] = {};				// Отложенные отрисовки тайлов
		node['hoverItem'] = null;				// Обьект hover
		node['tilesLoaded'] = {};
		node['tilesLoadProgress'] = {};
		node['loaderFlag'] = true;
		node['badTiles'] = {};
		node['tilesGeometry'] = {};				// Геометрии загруженных тайлов по z_x_y
		node['addedItems'] = []					// Геометрии обьектов добавленных в векторный слой
		node['objectsData'] = {};				// Обьекты из тайлов по identityField
		node['clustersData'] = null;			// Данные кластеризации

		node['zIndexOffset'] = 1000;
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
		
		if(layer.properties['rasterView']) {
			node['propHiden']['rasterView'] = layer.properties['rasterView'];
		}
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
		// Проверка фильтра видимости
		var chkSqlFuncVisibility = function(item)	{
			if(node['_sqlFuncVisibility']) {
				var prop = getPropItem(item);
				if(!node['_sqlFuncVisibility'](prop) && !node['_sqlFuncVisibility'](item.propHiden)) return false;
			}
			return true;
		}
		node['setVisibilityFilter'] = function() {
			chkLoadRasters();
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

			var observerTiles = {};
			var observerObj = {};
			node['chkRemovedTiles'] = function(dKey) {		// проверка при удалении тайлов
				var out = [];
				var items = node['tilesGeometry'][dKey];
				if(items && items.length > 0) {
					for (var i = 0; i < items.length; i++)
					{
						var item = items[i];
						var id = item['id'];
						if(observerObj[id]) {
							var ph = {'layerID': node.id, 'properties': getPropItem(item) };
							ph.onExtent = false;
							ph.geometry = node['getItemGeometry'](id);
							//ph.geometry = item.exportGeo();
							out.push(ph);
							delete observerObj[id];
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
							//if(!ignoreVisibilityFilter && node['_sqlFuncVisibility'] && !node['_sqlFuncVisibility'](prop)) continue; 	// если фильтр видимости на слое не отменен
							if(!ignoreVisibilityFilter && !chkSqlFuncVisibility(item)) continue; 	// если фильтр видимости на слое не отменен
							
							var id = item.id;
							var vFlag = (item.bounds.max.x < ext.minX || item.bounds.min.x > ext.maxX || item.bounds.max.y < ext.minY || item.bounds.min.y > ext.maxY);
							var ph = {'layerID': node.id, 'properties': prop };
							if(vFlag) {					// Обьект за границами видимости
								if(observerObj[id]) {
									ph.onExtent = false;
									ph.geometry = node['getItemGeometry'](id);
									//ph.geometry = item.exportGeo();
									out.push(ph);
									delete observerObj[id];
								}
							} else {
								if(!observerObj[id]) {
									ph.onExtent = true;
									//ph.geometry = item.exportGeo();
									ph.geometry = node['getItemGeometry'](id);
									out.push(ph);
									var tilesKeys = {};
									tilesKeys[key] = true;
									observerObj[id] = { 'tiles': tilesKeys , 'item': item };
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
			gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onMoveEnd', 'obj': gmxAPI.map, 'func': node['chkObserver']});
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

		node['needClearTile'] = {};		// тайлы требующие обнуления
		node.chkLoadTile = function(attr)	{							// Проверка необходимости загрузки тайлов
			if(gmxNode['isVisible'] === false) return true;								// Слой не видим
			var currZ = LMap.getZoom();
			if(currZ < node['minZ'] || currZ > node['maxZ'])  return true;				// Неподходящий zoom
			
			var drawTileID = attr['drawTileID'];
			node['needClearTile'][drawTileID] = true;
			//var currPosition = gmxAPI.currPosition;
			//if(!currPosition || !currPosition.extent)  return true;
			//var ext = currPosition.extent;
			var flag = node['loadTilesByExtent'](null, attr);
			if(!flag && node.repaintTile) {
				node.repaintTile(attr, true);
			}
			return flag;
		};

		node['loaderDrawFlags'] = {};

		node['loadTilesByExtent'] = function(ext, attr)	{		// Загрузка векторных тайлов по extent
			var flag = false;
			var drawTileID = attr['drawTileID'];
//console.log('loadTilesByExtent ' , drawTileID, node['loaderDrawFlags']);

			var tiles = node['tiles'];
			for (var tileKey in tiles)
			{
				if(node['tilesGeometry'][tileKey] || node['badTiles'][tileKey]) continue;

				var tb = tiles[tileKey];
				if(ext) {
					var tvFlag = (tb.max.x < ext.minX || tb.min.x > ext.maxX || tb.max.y < ext.minY || tb.min.y > ext.maxY);
					if(tvFlag) continue;								// Тайл за границами видимости
				} else if(attr) {
					if(!attr['bounds'].intersects(tb)) continue;		// Тайл не пересекает drawTileID
				}

				if(!node['loaderDrawFlags'][tileKey]) node['loaderDrawFlags'][tileKey] = [];
				node['loaderDrawFlags'][tileKey].push(attr);
				if(node['tilesLoadProgress'][tileKey]) continue;
				(function(pattr, tkey) {
					var drawMe = null;
					if(pattr) {
						drawMe = function() {
							var arr = node['loaderDrawFlags'][tkey];
							for(var i=0; i<arr.length; i++) {
								var dattr = arr[i];
								var dtID = dattr['drawTileID'];
								node.repaintTile(dattr, node['needClearTile'][dtID]);
								delete node['needClearTile'][dtID];
							}
							delete node['loaderDrawFlags'][tkey];
						}
					}
					var arr = tkey.split('_');
					var srcArr = option.tileFunc(arr[1], arr[2], arr[0]);
					if(typeof(srcArr) === 'string') srcArr = [srcArr];
					node['loaderFlag'] = true;
					var item = {
						'srcArr': srcArr
						,'callback': function(data) {
							delete node['tilesLoadProgress'][tkey];
							gmxAPI._listeners.dispatchEvent('onTileLoaded', gmxNode, {'obj':gmxNode, 'attr':{'data':{'tileID':tkey, 'data':data}}});		// tile загружен
							data = null;
							if(drawMe) drawMe();
							//if(drawMe) waitRedraw();
						}
						,'onerror': function(err){						// ошибка при загрузке тайла
							delete node['tilesLoadProgress'][tkey];
							node['badTiles'][tkey] = true;
							gmxAPI.addDebugWarnings(err);
							if(drawMe) drawMe();
							//if(drawMe) waitRedraw();
						}
					};
					gmxAPI._leaflet['vectorTileLoader'].push(item);
					node['tilesLoadProgress'][tkey] = true;
				})(attr, tileKey);
				flag = true;
			}
			return flag;
		};

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
					//if(node['_sqlFuncVisibility'] && !node['_sqlFuncVisibility'](getPropItem(item))) continue; 	// если фильтр видимости на слое не отменен
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
		var getItemsByPoint = function(latlng) {			// проверка событий векторного слоя
			var arr = [];
			//if(!node['observerNode']) {
				var mPoint = new L.Point(gmxAPI.merc_x(latlng['lng']), gmxAPI.merc_y(latlng['lat']));
				arr = getItemsFromTile(node['addedItems'], mPoint);
				for (var tileID in node['tiles'])
				{
					var tileBound = node['tiles'][tileID];
					if(tileBound.contains(mPoint)) {
						var iarr = node['tilesGeometry'][tileID];
						if(iarr && iarr.length > 0) {
							var items = getItemsFromTile(iarr, mPoint);
							if(items.length) arr = arr.concat(items);
						}
					}
				}
			//}
			return arr;
		}

		node['mouseMoveCheck'] = function(evName, ph) {			// проверка событий векторного слоя
		//gmxAPI.map.addListener('onMouseMove', function(ph) {
			if(!node.isVisible || gmxAPI._drawing['activeState'] || !node['leaflet'] || node['leaflet']._isVisible == false || gmxAPI._leaflet['mousePressed'] || gmxAPI._leaflet['curDragState']) return false;
//console.log('onMouseMove ' , node.id);
			var latlng = ph.attr['latlng'];
			var mPoint = new L.Point(gmxAPI.merc_x(latlng['lng']), gmxAPI.merc_y(latlng['lat']));
			var arr = (ph.attr.tID ? tilesRedrawImages.getItemsByPoint(ph.attr.tID, mPoint) : getItemsByPoint(latlng));
			if(arr && arr.length) {
				var item = getTopFromArrItem(arr);
				if(item) {
					hoverItem(item);
					return true;
				}
			} else {
				if(node['hoverItem']) {
					var zoom = LMap.getZoom();
					var drawInTiles = node['hoverItem'].geom.propHiden['drawInTiles'];
					if(drawInTiles && drawInTiles[zoom]) redrawTilesHash(drawInTiles[zoom]);
					gmxAPI._div.style.cursor = '';
					callHandler('onMouseOut', node['hoverItem'].geom, gmxNode);
					var filter = getItemFilter(node['hoverItem']);
					if(filter) callHandler('onMouseOut', node['hoverItem'].geom, filter);
				}
				node['hoverItem'] = null;
				return false;
			}
		//}, -11);
		};
		var callHandler = function(evName, geom, gNode, attr) {				// Вызов Handler для item
			var res = false;
			var rNode = mapNodes[gNode.objectId || gNode.id];
			if(rNode && rNode['handlers'][evName]) {			// Есть handlers на слое
				if(!attr) attr = {};
				attr['geom'] = node['getItemGeometry'](geom.id);
				attr[evName] = true;
				res = rNode['handlers'][evName].call(gNode, geom.id, getPropItem(geom), attr);
				//gmxAPI._listeners.dispatchEvent(evName, gNode, {'obj':gNode, 'attr':attr});
			}
			return res;
		}
		var getItemFilter = function(item) {			// Получить фильтр в который попал обьект
			var filter = null;
			if(item) {
				var propHiden = item.propHiden;
				if(!propHiden && item.geom && item.geom.propHiden) propHiden = item.geom.propHiden;
					
				if(propHiden['subType'] != 'cluster') {
					var filters = propHiden['toFilters'];
					if(filters.length == 0) filters = chkObjectFilters(item);
					filter = (filters && filters.length ? mapNodes[filters[0]] : null);
				}
			}
			return filter;
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
			var filter = null;
			if(propHiden['subType'] != 'cluster') {
				filter = getItemFilter(item);
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
							tilesNeed = gmxAPI.clone(drawInTiles[zoom]);
							//if(!tilesNeed) tilesNeed = {};
						}
					}
					node['hoverItem'] = item;
					//item.geom.curStyle = hoveredStyle;
					item.geom.curStyle = utils.evalStyle(hoveredStyle, item.geom.properties);
					
					var drawInTiles = propHiden['drawInTiles'];
					if(drawInTiles && drawInTiles[zoom]) {
						for (var tileID in drawInTiles[zoom]) tilesNeed[tileID] = true;
					}
					redrawTilesHash(tilesNeed);
					item.geom.curStyle = utils.evalStyle(regularStyle, item.geom.properties);
					gmxAPI._div.style.cursor = 'pointer';
					//if(callHandler('onMouseOver', item.geom, gmxNode)) return true;
					//if(filter && callHandler('onMouseOver', item.geom, filter)) return true;
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
			return arr[0];
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
			return node['flipedIDS'].length;
		}
		
		node['setFlip'] = function() {				// переместить обьект flip сортировки
			if(!node['flipIDS'] || !node['flipIDS'].length) return false;
			var vid = node['flipIDS'].shift();
			node['flipIDS'].push(vid);
			chkFlip(vid);

			if(node['tileRasterFunc']) {
				waitRedrawFlips(0);
			}
			var item = node['objectsData'][vid];
			if(!item) return null;
			var geom = node['getItemGeometry'](vid);
			var mObj = new gmxAPI._FlashMapFeature(geom, getPropItem(item), gmxNode);
			gmxAPI._listeners.dispatchEvent('onFlip', gmxNode, mObj);
			return item;
		}
		
		var prevPoint = null;
		node['eventsCheck'] = function(evName, attr) {			// проверка событий векторного слоя
			if(gmxAPI._drawing['activeState'] || !node['leaflet'] || !node['leaflet']._isVisible || gmxAPI._leaflet['curDragState']) return false;
			//console.log('eventsCheck ' , evName, node.id, gmxAPI._leaflet['curDragState']);

			//if(node['observerNode']) return false;
			if(!attr) attr = gmxAPI._leaflet['clickAttr'];
			if(!attr.latlng) return false;
			var latlng = attr.latlng;
			var arr = null;
			if(attr.tID) {
				var mPoint = new L.Point(gmxAPI.merc_x(latlng['lng']), gmxAPI.merc_y(latlng['lat']));
				arr = tilesRedrawImages.getItemsByPoint(attr.tID, mPoint);
			} else {
				arr = getItemsByPoint(latlng);
			}
		
			if(evName === 'onClick' && arr && arr.length) {
				var needCheck = (!prevPoint || !attr.containerPoint || attr.containerPoint.x != prevPoint.x || attr.containerPoint.y != prevPoint.y);
				prevPoint = attr.containerPoint;
				if(needCheck) {
					node['flipIDS'] = [];
					for (var i = 0; i < arr.length; i++) node['flipIDS'].push(arr[i].id || arr[i].geom.id);
				}
				if(!node['flipIDS'].length) return false;
				var vid = node['flipIDS'][0];
				var item = arr[0];
				var oper = 'setFlip';
				var isCluster = (item.geom && item.geom.propHiden['subType'] == 'cluster' ? true : false);
				var itemPropHiden = null;
				if(!isCluster) {
					var operView = false;
					if(attr.shiftKey && node['propHiden']['rasterView'] === 'onShiftClick') operView = true;
					else if(attr.ctrlKey && node['propHiden']['rasterView'] === 'onCtrlClick') operView = true;
					else if(node['propHiden']['rasterView'] === 'onClick') operView = true;
					
					vid = node['flipIDS'][node['flipIDS'].length - 1];
					item = (oper === 'setFlip' ? node['setFlip']() : node['objectsData'][vid]);
					if(!item) return true;
					vid = item.id;
					itemPropHiden = item.propHiden;

					//console.log('flipIDS' , item.id);
					chkFlip(item.id);
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
				if(oper === 'setFlip' && attr.tID) {
					var hItem = getTopFromArrItem(arr);
					if(hItem) hoverItem(hItem);
				}
				
				var eventPos = {
					'latlng': { 'x': latlng.lng, 'y': latlng.lat }
					,'pixelInTile': attr.pixelInTile
					,'tID': attr.tID
				};
				
				if(!isCluster) {
					var geom = node['getItemGeometry'](item.id);
					if(!itemPropHiden['toFilters'] || !itemPropHiden['toFilters'].length) return;		// обьект не попал в фильтр
					var fID = itemPropHiden['toFilters'][0];
					var filter = gmxAPI.mapNodes[fID];
					if(filter && mapNodes[fID]['handlers'][evName]) {						// не найден фильтр
						callHandler('onClick', item, filter, {'eventPos': eventPos});
						return true;
					} else if(evName in node['handlers']) {						// Есть handlers на слое
						var res = callHandler('onClick', item, gmxNode, {'eventPos': eventPos});
						//var res = node['handlers'][evName].call(gmxNode, item.id, item.properties, {'onClick': true, 'geom': geom, 'eventPos': eventPos});
						if(res) return res;
					}
					//mapNodes[fID]['handlers'][evName].call(filter, item.id, item.properties, {'onClick': true, 'geom': geom, 'eventPos': eventPos});
				} else {
					if(callHandler('onClick', item, gmxNode, {'objType': 'cluster', 'eventPos': eventPos})) return true;
					//node['handlers'][evName].call(gmxNode, item.id, item.geom.properties, {'onClick': true, 'objType': 'cluster', 'geom': item.geom, 'eventPos': eventPos});
				}
				
				return true;
			}
		}

		var initCallback = function(obj) {			// инициализация leaflet слоя
			if(obj._container) {
				if(obj._container.id != id) obj._container.id = id;
				if(obj._container.style.position != 'absolute') obj._container.style.position = 'absolute';
				utils.bringToDepth(node, node['zIndex']);
			}
		};

		var attr = utils.prpLayerAttr(layer, node);
		node['minZ'] = inpAttr['minZoom'] || attr['minZoom'] || 1;
		node['maxZ'] = inpAttr['maxZoom'] || attr['maxZoom'] || 21
		var identityField = attr['identityField'] || 'ogc_fid';
		var typeGeo = attr['typeGeo'] || 'Polygon';
		var TemporalColumnName = attr['TemporalColumnName'] || '';
		var option = {
			'minZoom': node['minZ']
			,'maxZoom': node['maxZ']
			,'id': id
			,'identityField': identityField
			,'initCallback': initCallback
			,'async': true
			//,'reuseTiles': true
			//,'updateWhenIdle': true
			,'unloadInvisibleTiles': true
		};

		if(node['parentId']) option['parentId'] = node['parentId'];
		
		node['tiles'] = getTilesBounds(inpAttr.dataTiles);
		option['attr'] = attr;
		option['tileFunc'] = inpAttr['tileFunction'];
		var myLayer = new L.TileLayer.VectorTiles(option);
		node['leaflet'] = myLayer;
		
		
		if(layer.properties['visible']) {
			utils.setVisibleNode({'obj': node, 'attr': true});
			node.isVisible = true;
		} else {
			node.isVisible = false;
		}

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
		function chkObjectFilters(geo)	{				// Получить фильтры для обьекта
			var zoom = LMap.getZoom();
			var toFilters = [];
			delete geo.curStyle;
			delete geo['_cache'];
			for(var j=0; j<node.filters.length; j++) {
				var filterID = node.filters[j];
				var filter = mapNodes[node.filters[j]];
				if(zoom > filter.maxZ || zoom < filter.minZ) continue;
				var prop = getPropItem(geo);

				var flag = (filter && filter.sqlFunction ? filter.sqlFunction(prop) : true);
				if(flag) {
					toFilters.push(filterID);
					//styleToGeo(geo, filter);
					break;						// Один обьект в один фильтр 
				}
			}
			return toFilters;
		}

		function objectsToFilters(arr, tileID)	{				// Разложить массив обьектов по фильтрам
			var outArr = [];

			for (var i = 0; i < arr.length; i++)
			{
				var ph = arr[i];
				if(!ph) return;
				var prop = ph['properties'];
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
				
				var id = ph['id'] || prop[identityField];
				//if(id != 131) continue;	
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
				propHiden['toFilters'] = chkObjectFilters(geo);

				if(node['objectsData'][id]) {		// Обьект уже имеется - нужна??? склейка геометрий
					var pt = node['objectsData'][id];
					if(objData['type'] != 'POINT' && objData['type'].indexOf('MULTI') == -1) objData['type'] = 'MULTI' + objData['type'];
					for(var key in pt.propHiden['fromTiles']) {
						objData['propHiden']['fromTiles'][key] = pt.propHiden['fromTiles'][key];
					}
				}
				node['objectsData'][id] = objData;
			}
			arr = [];
			return outArr;
		}

		var removeItems = function(data) {		// удаление обьектов векторного слоя 
			for (var index in data)
			{
				var pid = data[index];
				if(typeof(pid) === "object") pid = pid['id'];
				else if(pid === true) pid = index;
				var pt = node['objectsData'][pid];
				if(pt) {
					var fromTiles = pt.propHiden['fromTiles'];
					for(var tileID in fromTiles) {
						var arr = (tileID == 'addItem' ? node['addedItems'] : node['tilesGeometry'][tileID]);	// Обьекты тайла
						if(arr && arr.length) {
							for (var i = 0; i < arr.length; i++) {
								if(arr[i].id == pid) {
									(tileID == 'addItem' ? node['addedItems'] : node['tilesGeometry'][tileID]).splice(i, 1);	// Обьекты тайла
									break;
								}
							}
						}
					}
					delete node['objectsData'][pid];
				}
			}
			/*
			var arr = [];
			for (var i = 0; i < node['addedItems'].length; i++)
			{
				var item = node['addedItems'][i]; 
				if(!data[item['id']]) arr.push(item);
			}
			node['addedItems'] = arr; 
			*/
		}

		node['removeItems'] = function(data) {		// удаление обьектов векторного слоя 
			removeItems(data)
			waitRedraw();
		}
		node['addItems'] = function(data) {			// добавление обьектов векторного слоя
			removeItems(data)
			node['addedItems'] = node['addedItems'].concat(objectsToFilters(data, 'addItem'));
			waitRedraw();
			return true;
		}
		node['setEditObjects'] = function(attr) {			// добавление обьектов векторного слоя
			if(attr.removeIDS) {
				var arr = [];
				for (var key in attr.removeIDS)
				{
					arr.push(key);
				}
				node['removeItems'](arr);
			}
			if(attr.addObjects) {
				node['addItems'](attr.addObjects);
			}
			return true;
		}
		
		node.waitRedrawTile = function(attr)	{							// перерисовать векторный тайл слоя
			var drawTileID = attr['drawTileID'];
			var timerID = node['tilesRedrawTimers'][drawTileID];			// Таймер отрисовки тайла
			if(timerID) clearTimeout(timerID);
			//console.log('waitRedrawTile ' , drawTileID , timerID);
			node['tilesRedrawTimers'][drawTileID] = setTimeout(function() { node.repaintTile(attr, true)	}, 10);
		}

		var setCanvasStyle = function(ctx, style)	{							// указать стиль Canvas
			if(style) {
				//if(style['stroke'] && style['weight'] > 0) {
				if(style['stroke']) {
					var opacity = ('opacity' in style ? style['opacity'] : 0);
					ctx.lineWidth = style['weight'] || 0;
					if(style['weight'] == 0) opacity = 0; // если 0 ширина линии скрываем через opacity
					var strokeStyle = style['color_rgba'] || 'rgba(0, 0, 255, 1)';
					strokeStyle = strokeStyle.replace(/1\)/, opacity + ')');
					ctx.strokeStyle = strokeStyle;
				}
				
				if(style['fill']) {
					var fillOpacity = style['fillOpacity'] || 0;
					var fillStyle = style['fillColor_rgba'] || 'rgba(0, 0, 255, 1)';
					fillStyle = fillStyle.replace(/1\)/, fillOpacity + ')');
					ctx.fillStyle = fillStyle;
				}
			}
			ctx.save();
		}
/*		
		var reloadTiles = function(ph) {			// перерисовка тайлов
			var zoom = LMap.getZoom();
			for (var z in node['tilesRedrawAttr']) {
				if(z != zoom) delete node['tilesRedrawAttr'][z];
				else {
					for (var tileID in ph) {
						if(node['tilesRedrawAttr'][z][tileID]) node.repaintTile(node['tilesRedrawAttr'][z][tileID], true);
					}
				}
			}
		}
*/		
		var needRedrawTiles = {};										// Список дорисовки обьектов по соседним тайлам

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
		}
		var chkBorderTiles = function(geom, attr) {					// Проверка соседних тайлов
			var x = attr['scanexTilePoint'].x;
			var y = attr['scanexTilePoint'].y;
			var parr = [
				{ 'x': x-1 ,'y': y }
				,{ 'x': x+1 ,'y': y }
				,{ 'x': x ,'y': y-1 }
				,{ 'x': x ,'y': y+1 }
				,{ 'x': x+1 ,'y': y+1 }
				,{ 'x': x-1 ,'y': y-1 }
				,{ 'x': x-1 ,'y': y+1 }
				,{ 'x': x+1 ,'y': y-1 }
			];
			for (var j = 0; j < parr.length; j++)
			{
				var rp = parr[j];
				var rbounds = utils.getTileBoundsMerc(rp, attr['zoom']);
				if(geom['intersects'](rbounds)) {
					var rTileID = attr['zoom'] + '_' + rp.x + '_' + rp.y;
					if(!geom.propHiden['drawInTiles'][attr['zoom']]) geom.propHiden['drawInTiles'][attr['zoom']] = {};
					geom.propHiden['drawInTiles'][attr['zoom']][rTileID] = true;
					//geom.propHiden['drawInTiles'][rTileID] = true;
					if(!needRedrawTiles[rTileID]) needRedrawTiles[rTileID] = {};
					needRedrawTiles[rTileID][geom.id] = geom;
				}
			}
		}
		
		var tilesRedrawImages = {						// Управление отрисовкой растров векторного тайла
/*
			'addItem': function(zoom, tileID, item)	{				// Добавить обьект
				if(!node['tilesRedrawImages'][zoom]) node['tilesRedrawImages'][zoom] = {};
				if(!node['tilesRedrawImages'][zoom][tileID]) node['tilesRedrawImages'][zoom][tileID] = [];
				var arr = []
				for (var i = 0; i < node['tilesRedrawImages'][zoom][tileID].length; i++)
				{
					var it = node['tilesRedrawImages'][zoom][tileID][i];
					if(it.geom.id != item.geom.id || it.geom.propHiden.tileID != item.geom.propHiden.tileID) arr.push(it);
				}
				arr.push(item);
				node['tilesRedrawImages'][zoom][tileID] = arr;
			}
			,
			'getItem': function(iID)	{				// Получить обьект
				var zoom = LMap.getZoom();
				for (var tileID in node['tilesRedrawImages'][zoom]) {
					for (var i = 0; i < node['tilesRedrawImages'][zoom][tileID].length; i++)
					{
						var it = node['tilesRedrawImages'][zoom][tileID][i];
						if(it.geom.id == iID) return it;
					}
				}
				return null;
			}
			,
*/			
			'getItemsByPoint': function(tID, mPoint)	{				// Получить обьекты под мышкой
				var zoom = LMap.getZoom();
				if(!node['tilesRedrawImages'][zoom] || !node['tilesRedrawImages'][zoom][tID]) return null;
				var minDist = Number.MAX_VALUE;
				var arr = [];
				for (var i = 0; i < node['tilesRedrawImages'][zoom][tID].length; i++)
				{
					var item = node['tilesRedrawImages'][zoom][tID][i];
					var dist = minDist;
					if('contains' in item.geom) {
						if(!item.geom['contains'](mPoint)) continue;
					}
					else if(!item.geom.bounds.contains(mPoint)) continue;
					
					if('distance2' in item.geom) {
						dist = item.geom['distance2'](mPoint);
					}
					if(dist < minDist) { arr.unshift(item); minDist = dist; }
					else arr.push(item);
				}
				return arr;
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
						for (var i = 0; i < node['tilesRedrawImages'][z][tileID].length; i++)
						{
							var it = node['tilesRedrawImages'][z][tileID][i];
							if(it.geom.id === vID) delete node['tilesRedrawImages'][z][tileID][i]['imageObj'];
						}
					}
				}
				return true;
			}
		}

		var drawRasters = function(tileID)	{						// отрисовка растров векторного тайла
			var zoom = LMap.getZoom();
			node.redrawTile(tileID, zoom);
			return true;
		}
		var getRaster = function(rItem, ogc_fid, callback)	{	// получить растр обьекта векторного тайла
			if(!node['tileRasterFunc']) return false;

			var attr = rItem.attr;
			var zoom = attr.zoom;
			var drawTileID = attr.drawTileID;
			if(node['tilesRedrawImages'][zoom] && node['tilesRedrawImages'][zoom][drawTileID]) {
				var arr = node['tilesRedrawImages'][zoom][drawTileID];
				for (var i = 0; i < arr.length; i++)
				{
					var it = arr[i];
					if(it['src'] == rItem['src'] && it['imageObj']) {
						rItem['imageObj'] = it['imageObj'];
						callback(rItem['imageObj']);
						return true;
					}
				}
			}
			
			var item = {
				'src': rItem.src
				,'callback': function(imageObj) {
					var pt = {'idr': ogc_fid, 'callback': function(content) {
						rItem['imageObj'] = content;
						callback(rItem['imageObj']);
					}};
					rItem['imageObj'] = (node['imageProcessingHook'] ? node['imageProcessingHook'](imageObj, pt) : imageObj);
					if(rItem['imageObj']) callback(rItem['imageObj']);
				}
				,'onerror': function(){
					callback(null);
				}
			};
			if(node['imageProcessingHook']) item['crossOrigin'] = 'anonymous';
			gmxAPI._leaflet['imageLoader'].unshift(item);
		}
		var chkLoadRasters = function() {			// получить список обьектов попавших в тайл
			if(!node['tileRasterFunc']) {
				//node.waitRedraw();
				return;
			}
			var reLoadFlag = false;
			var zoom = LMap.getZoom();
			for (var key in node['tilesRedraw'][zoom])						// Перебрать все загруженные тайлы
			{
				var attr = node['tilesRedraw'][zoom][key];
				reLoadFlag = chkTileRasters(attr);
				if(reLoadFlag) break;
				//if(rasterNums == 0) node.waitRedrawFlips();
				//drawRasters(attr.drawTileID);
			}
			if(reLoadFlag) node.waitRedraw();
			else waitRedrawFlips(100);
		}
		var chkTileRasters = function(attr) {		// проверить наличие imageObject в списке обьектов попавших в тайл
			var zoom = attr.zoom;
			var drawTileID = attr.drawTileID;
			var arr = [];
			if(node['tilesRedrawImages'][zoom]) arr = node['tilesRedrawImages'][zoom][drawTileID] || [];
			var oldHash = {};
			for (var i = 0; i < arr.length; i++)
			{
				var item = arr[i];
				if(item.imageObj) oldHash[item.geom.id] = item;
			}

			var zoomFlag = (zoom < node['quicklookZoomBounds']['minZ'] || zoom > node['quicklookZoomBounds']['maxZ'] ? false : true);
			var ritemsArr = [];
			var rasterNums = 0;
			for (var key in node['tilesGeometry'])						// Перебрать все загруженные тайлы
			{
				var tb = node['tiles'][key];
				var delta = tb.delta;
				if(!tb || tb.min.x - delta > attr.bounds.max.x				// Тайл не пересекает границы
					|| tb.max.x + delta < attr.bounds.min.x
					|| tb.min.y - delta > attr.bounds.max.y
					|| tb.max.y + delta < attr.bounds.min.y
				) {
					continue;
				}
				var arr = node['tilesGeometry'][key];
				arr = arr.concat(node['addedItems']);
				for (var i1 = 0; i1 < arr.length; i1++)
				{
					var geom = arr[i1];
					if(geom.type !== 'Point' && geom.type !== 'Polygon' && geom.type !== 'MultiPolygon' && geom.type !== 'Polyline' && geom.type !== 'MultiPolyline') continue;
					var notIntersects = false;
					if(geom['intersects']) {
						if(!geom['intersects'](attr.bounds)) notIntersects = true;						// если geom имеет свой метод intersects
					}
					else if(!attr.bounds.intersects(geom.bounds)) notIntersects = true;					// обьект не пересекает границы тайла
					if(notIntersects) {				// обьект не пересекает границы тайла
						continue;
					}
					var objData = node['objectsData'][geom['id']] || geom;

					var rUrl = node['tileRasterFunc'](attr.scanexTilePoint['x'], attr.scanexTilePoint['y'], attr['zoom'], objData);
					var rItem = {
						'geom': geom
						,'attr': attr
						,'src': rUrl
					};
					ritemsArr.push(rItem);
					
					if(!zoomFlag && (node['propHiden']['rasterView'] == '' || !objData.propHiden['rasterView'])) continue;
					if(!node.chkTemporalFilter(geom)) continue;	// не прошел по мультивременному фильтру
					if(!chkSqlFuncVisibility(objData)) continue; // если фильтр видимости на слое
					rasterNums++;
					delete oldHash[geom['id']];
					(function(pItem, pid) {
						getRaster(pItem, pid, function(img) {
							pItem['imageObj'] = img;
							rasterNums--;
							if(rasterNums === 0) waitRedrawFlips(100);
						});
					})(rItem, geom['id']);
				}
			}
			for (var key in oldHash) return true;		// Если на экране есть лишние обьекты

			if(!node['tilesRedrawImages'][zoom]) node['tilesRedrawImages'][zoom] = {};
			node['tilesRedrawImages'][zoom][drawTileID] = ritemsArr;
			ritemsArr = null;
			return false;
		}

		var getObjectsByTile = function(attr) {		// получить список обьектов попавших в тайл
			var arr = [];
			var arrTop = [];
			for (var key in node['tilesGeometry'])						// Перебрать все загруженные тайлы
			{
				var tb = node['tiles'][key];
				var delta = tb.delta;
//if(node['clustersData']) delta /= 2;
				if(!tb || tb.min.x - delta > attr.bounds.max.x				// Тайл не пересекает границы
					|| tb.max.x + delta < attr.bounds.min.x
					|| tb.min.y - delta > attr.bounds.max.y
					|| tb.max.y + delta < attr.bounds.min.y
				) {
					continue;
				}
				for (var i1 = 0; i1 < node['tilesGeometry'][key].length; i1++)
				{
					var geom = node['tilesGeometry'][key][i1];
					if(geom.type !== 'Point' && geom.type !== 'Polygon' && geom.type !== 'MultiPolygon' && geom.type !== 'Polyline' && geom.type !== 'MultiPolyline') continue;
//if(!node['clustersData']) {
					var notIntersects = false;
					if(geom['intersects']) {
						if(!geom['intersects'](attr.bounds)) notIntersects = true;						// если geom имеет свой метод intersects
					}
					else if(!attr.bounds.intersects(geom.bounds)) notIntersects = true;					// обьект не пересекает границы тайла
					if(notIntersects) {				// обьект не пересекает границы тайла
						continue;
					}
//}					
					if(node['flipHash'][geom['id']]) arrTop.push(geom); 	// Нарисовать поверх
					else arr.push(geom);
				}
			}
			if(node['addedItems'].length) {
				arr = arr.concat(node['addedItems']);
			}
			
			if('sortItems' in node) {
				arr = arr.sort(node['sortItems']);
			}
			arr = arr.concat(arrTop);
			//arr = arr.reverse();
			return arr;
		}
		
		var observerTimer = null;										// Таймер
		node.repaintTile = function(attr, clearFlag)	{							// перерисовать векторный тайл слоя
			var drawTileID = attr['drawTileID'];
			delete node['tilesRedrawTimers'][drawTileID];
			//var ctx = attr.ctx;
			var tile = node['leaflet'].getCanvasTile(drawTileID);
			if(!tile) return;
			var ctx = tile.getContext('2d');
			
			if(clearFlag) ctx.clearRect(0, 0, 256, 256);
			var out = false;
			if(node['observerNode']) {
				if(observerTimer) clearTimeout(observerTimer);
				observerTimer = setTimeout(node['chkObserver'], 0);
			}

			var zoom = attr['zoom'];
			var cnt = 0;
			attr['node'] = node;
			attr['labelBounds'] = [];	// отрисованные labels в тайле
			var rasterNums = 0;
			var ritemsArr = [];
			var drawGeoArr = function(arr, flag)	{							// Отрисовка массива геометрий
				var res = [];
				for (var i1 = 0; i1 < arr.length; i1++)
				{
					var geom = arr[i1];
					if(geom.type !== 'Point' && geom.type !== 'Polygon' && geom.type !== 'MultiPolygon' && geom.type !== 'Polyline' && geom.type !== 'MultiPolyline') continue;

					var objData = node['objectsData'][geom['id']] || geom;
					var propHiden = objData['propHiden'];
					if(propHiden['subType'] != 'cluster') {						// для кластеров без проверки
						var notIntersects = false;
						if(geom['intersects']) {
							if(!geom['intersects'](attr.bounds)) notIntersects = true;						// если geom имеет свой метод intersects
						}
						else if(!attr.bounds.intersects(geom.bounds)) notIntersects = true;					// обьект не пересекает границы тайла
						if(notIntersects) {				// обьект не пересекает границы тайла
							continue;
						}

						if(!chkSqlFuncVisibility(objData)) continue; // если фильтр видимости на слое
						
						if(!node.chkTemporalFilter(geom)) {	// не прошел по мультивременному фильтру
							continue;
						}

						var filter = getItemFilter(objData);
						if(!filter || filter.isVisible === false) continue;		// если нет фильтра или он невидим пропускаем
						if(filter) {
							geom.curStyle = (filter.regularStyle ? filter.regularStyle : null);
						}
					}
					var style = geom.curStyle || null;
					attr['style'] = style;
					if(!propHiden['drawInTiles']) propHiden['drawInTiles'] = {};
					if(!propHiden['drawInTiles'][zoom]) propHiden['drawInTiles'][zoom] = {};
					propHiden['drawInTiles'][zoom][drawTileID] = true;

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
					if(node['tileRasterFunc']) rUrl = node['tileRasterFunc'](attr.scanexTilePoint['x'], attr.scanexTilePoint['y'], attr['zoom'], objData);

					var rItem = {
						'geom': geom
						,'attr': attr
						,'src': rUrl
					};
					ritemsArr.push(rItem);
					
					if(showRaster) {
						//rItem['drawFunc'] = function() {drawRasters(drawTileID);};
						rasterNums++;
						(function(pItem, pid) {
							getRaster(pItem, pid, function(img) {
								pItem['imageObj'] = img;
								rasterNums--;
								//if(rasterNums === 0) drawRasters(drawTileID);
								if(rasterNums === 0) waitRedrawFlips(10);
							});
						})(rItem, geom['id']);
					} else {
						setCanvasStyle(ctx, style);
						geom['paint'](attr, ctx);
						if(propHiden['subType'] == 'cluster') chkBorderTiles(geom, attr);
					}
					res.push(geom['id']);
				}
				if(!node['tilesRedrawImages'][zoom]) node['tilesRedrawImages'][zoom] = {};
				node['tilesRedrawImages'][zoom][drawTileID]	= ritemsArr;
				ritemsArr = null;
				return res;
			}

			//var needDraw = [];
			var arr = getObjectsByTile(attr);
			if(node['clustersData']) {						// Получить кластеры
				arr = getTileClusterArray(arr, attr);
				removeFromBorderTiles(drawTileID);
				waitRedrawFlips();							// требуется отложенная перерисовка
			}
			drawGeoArr(arr);
			arr = null;
			//attr['tile']._layer.tileDrawn(attr['tile']);
			return out;
		}
		node['labelBounds'] = {'add': {}, 'skip': {}};			// Добавленные и пропущенные labels обьектов слоя
		node['chkTilesParentStyle'] = function() {							// перерисовка при изменении fillOpacity - rasterView
			node.redrawFlips();
		};
		var chkGlobalAlpha = function(ctx) {								// проверка fillOpacity стиля заполнения обьектов векторного слоя - rasterView
			var tilesParent = gmxNode['tilesParent'];
			if(!tilesParent) return;
			var tpNode = mapNodes[tilesParent.objectId];
			if(!tpNode || !tpNode.regularStyle || !tpNode.regularStyle.fill) return;
			ctx.globalAlpha = tpNode.regularStyle.fillOpacity;
			
			//ctx.globalCompositeOperation = 'destination-over'; // 'source-over'
		};

		var objectToCanvas = function(pt, ctx, flagClear)	{								// отрисовка растров векторного тайла
			var attr = pt['attr'];
			ctx.save();
			if(flagClear) {
				ctx.clearRect(0, 0, 256, 256);
				attr['labelBounds'] = [];
			}
			if(!pt.geom.curStyle) {
				var filter = getItemFilter(pt.geom);
				if(!filter || filter.isVisible === false) return;		// если нет фильтра или он невидим пропускаем
				if(filter) {
					pt.geom.curStyle = (filter.regularStyle ? filter.regularStyle : null);
				}
			}			
			if(!pt.geom.curStyle) return;
			
			attr.style = pt.geom.curStyle;
			setCanvasStyle(ctx, attr.style);
			ctx.restore();
			if(pt.imageObj) {
				ctx.save();
				chkGlobalAlpha(ctx);
				var pattern = ctx.createPattern(pt.imageObj, "no-repeat");
				ctx.fillStyle = pattern;
				pt.geom['paintFill'](attr, ctx, false);
				ctx.fill();
				ctx.clip();
				ctx.restore();
			}
			pt.geom['paint'](attr, ctx);
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

		node.redrawTile = function(tileID, zoom)	{				// перерисовка 1 тайла
			var tile = node['leaflet'].getCanvasTile(tileID);
			if(!tile) return;
			var ctx = tile.getContext('2d');
			var arr = tilesRedrawImages.getTileItems(zoom, tileID);
			if(arr.length == 0) return;
			var attr = arr[0].attr;

			var borders = needRedrawTiles[tileID] || null;

			var flagClear = true;
			var out = {};
			var item = null;
			for (var i = 0; i < arr.length; i++) {
				item = arr[i];
				//if(node['_sqlFuncVisibility'] && !node['_sqlFuncVisibility'](getPropItem(item.geom))) continue; // если фильтр видимости на слое
				if(!chkSqlFuncVisibility(item.geom)) continue; // если фильтр видимости на слое

				if(!chkItemFiltersVisible(item.geom)) continue;
				var itemId = item.geom.id;
				if(borders && borders[itemId]) {
					continue;
				} if(node['flipHash'][itemId]) {
					if(!out[itemId]) out[itemId] = [];
					out[itemId].push(item);
				} else {
					objectToCanvas(item, ctx, flagClear);
					flagClear = false;
				}

			}
			if(borders) {											// перерисовка пограничных обьектов
				for (var key in borders)
				{
					objectToCanvas({ 'geom': borders[key], 'attr': attr	}, ctx, flagClear);
				}
			}
			for (var i = 0; i < node['flipedIDS'].length; i++) {	// перерисовка fliped обьектов
				var id = node['flipedIDS'][i];
				if(out[id]) {
					for (var j = 0; j < out[id].length; j++) {
						objectToCanvas(out[id][j], ctx, flagClear);
						flagClear = false;
					}
				}
			}
			out = null;
			arr = null;
			borders = null;
			return true;
		}
		
		var redrawTilesHash = function(hash)	{					// перерисовка тайлов по hash
			var zoom = LMap.getZoom();
			for (var tileID in hash)
			{
				node.redrawTile(tileID, zoom);
			}
		}
		node.redrawFlips = function(from)	{						// перерисовка (растров) обьектов под мышкой
			var zoom = LMap.getZoom();
			redrawTilesHash(node['tilesRedrawImages'][zoom]);
			return true;
		}

		var chkNeedImage = function(item) {			// проверка необходимости загрузки растра для обьекта векторного слоя
			//console.log('chkNeedImage ', item);
			var zoom = LMap.getZoom();
			var itemId = item.id;
			
			var rasterNums = 0;
			for (var drawTileID in node['tilesRedrawImages'][zoom]) {
				var arr = tilesRedrawImages.getTileItems(zoom, drawTileID);
				for (var i = 0; i < arr.length; i++) {
					var pt = arr[i];
					if(pt.geom['id'] != itemId) continue;
					if(item.propHiden['rasterView']) {
						if(pt['imageObj'] || !pt['src']) continue;		// imageObj уже загружен либо нечего загружать
						(function(pItem, pid) {
							getRaster(pItem, pid, function(img) {
								pItem['imageObj'] = img;
								rasterNums--;
								if(rasterNums === 0) node.waitRedrawFlips(100);
								//drawRasters(drawTileID);
							});
						})(pt, itemId);
					} else {
						tilesRedrawImages.removeImage(itemId);
						waitRedrawFlips(0);
					}
				}
			}
			if(rasterNums === 0) {
				waitRedrawFlips(0);
			}
		}
		node.parseVectorTile = function(data, tileID, dAttr)	{		// парсинг векторного тайла
			node['tilesGeometry'][tileID] = objectsToFilters(data, tileID, dAttr);
			data = null;
			return true;
		}
		var redrawTimer = null;										// Таймер
		var waitRedraw = function()	{								// Требуется перерисовка слоя с задержкой
//console.log('waitRedraw ', node.id, myLayer._isVisible);
			if(redrawTimer) clearTimeout(redrawTimer);
			redrawTimer = setTimeout(function()
			{
				if(!node.isVisible || !myLayer._isVisible) return;
				redrawTimer = null;
				//node['labelsBounds'] = [];
				myLayer.redraw();
				gmxAPI._leaflet['lastZoom'] = LMap.getZoom();
				gmxAPI._leaflet['mapOnResize']();
			}, 10);
			return false;
		}
		node.waitRedraw = waitRedraw;
		
		var redrawFlipsTimer = null;								// Таймер
		var waitRedrawFlips = function(zd)	{						// Требуется перерисовка уже отрисованных тайлов с задержкой
			if(redrawFlipsTimer) clearTimeout(redrawFlipsTimer);
			if(arguments.length == 0) zd = 10;
			redrawFlipsTimer = setTimeout(function()
			{
				node.redrawFlips('waitRedrawFlips');
			}, zd);
			return false;
		}
		
		var reCheckFilters = function()	{								// переустановка обьектов по фильтрам
			for (var tileID in node['tilesGeometry'])						// Перебрать все загруженные тайлы
			{
				var arr = node['tilesGeometry'][tileID];
				for (var i = 0; i < arr.length; i++) {
					arr[i].propHiden['toFilters'] = chkObjectFilters(arr[i]);
				}
			}
			for (var i = 0; i < node['addedItems'].length; i++) {
				node['addedItems'][i].propHiden['toFilters'] = chkObjectFilters(node['addedItems'][i]);
			}
		}
		node.waitRedraw = waitRedraw;				// перерисовать слой

		node.onZoomend = function()	{				// Проверка видимости по Zoom
			if(!node.isVisible) return false;
			var flag = myLayer._isVisible;
			if(myLayer.options.minZoom != node['minZ'] || myLayer.options.maxZoom != node['maxZ']) {
				myLayer.options.minZoom = node['minZ'];
				myLayer.options.maxZoom = node['maxZ'];
			}
			node['labelBounds'] = {'add': {}, 'skip': {}};
			var currZ = LMap.getZoom();
			for (var z in node['tilesRedrawImages']) {
				if(z != currZ) delete node['tilesRedrawImages'][z];
			}

			flag = (currZ < node['minZ'] || currZ > node['maxZ'] ? false : true);		// Неподходящий zoom
			if(flag != myLayer._isVisible) {
				utils.setVisibleNode({'obj': node, 'attr': flag});
				waitRedraw();
				if(!flag) gmxAPI._leaflet['LabelsManager'].onChangeVisible(node.id, flag);

			}
		}
		gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': node.onZoomend});
/*		
		gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomstart', 'func': function(e) {
				needRedrawTiles = {};
			}
		});
*/		
		
		node.refreshFilter = function(fid)	{		// обновить фильтр
			var filterNode = mapNodes[fid];
			if(!filterNode) return;						// Нода не была создана через addObject
			reCheckFilters();
			waitRedrawFlips(0);
			gmxAPI._leaflet['lastZoom'] = -1;
			return true;
		}
		// image загружен
		gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onIconLoaded', 'func': function(eID) {
			for (var i = 0; i < node['filters'].length; i++)
			{
				if(node['filters'][i] === eID) node.refreshFilter(eID);
			}
		}});
/*		
		node.chkFilters = function(fid)	{		// обновить стиль фильтра
			for (var i = 0; i < node['filters'].length; i++)
			{
				node.refreshFilter(node['filters'][i]);
			}
		}
*/		
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

		node.addFilter = function(fid)	{			// Добавить фильтр к векторному слою
			var flag = true;
			for (var i = 0; i < node['filters'].length; i++)
			{
				if(node['filters'][i] == fid) {
					flag = false;
					break;
				}
			}
			if(flag) node['filters'].push(fid);
			node.refreshFilter(fid);
			mapNodes[fid]['setClusters'] = node.setClusters;
		}
/*
		function removeNode(key)	{				// Удалить ноду
			var rnode = mapNodes[key];
			if(!rnode) return;
			var pNode = LMap;
			if(rnode['parentId']) {
				pNode = mapNodes[rnode['parentId']]['group'];
				pNode.removeLayer(rnode['group']);
			}
			if(rnode['leaflet']) pNode.removeLayer(rnode['leaflet']);
			delete mapNodes[key];
		}
*/
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

		node.removeEditedObjects = function()	{			// Добавить тайл
			//var st:String =arr[i+2] + '_' + attr['dtiles'][i] + '_' + attr['dtiles'][i+1];
			return true;
		}
/*
		node.chkTemporalFilter = function(attr)	{				// временной фильтр
			if(!node['temporal'] || !node['temporal']['ut1'] || !node['temporal']['ut2']) return false;
			var ut1 = node['temporal']['ut1'];
			var ut2 = node['temporal']['ut2'];
			
			for(var key in node.objectsData) {
				var arr = node.objectsData[key]['toFilters'];
				for(var i=0; i<arr.length; i++) {
					var rnode = mapNodes[arr[i]];
					if(rnode) {
						var dt = rnode.propHiden['unixTimeStamp'];
//						setVisible({'obj': rnode, 'attr': (ut1 > dt || ut2 < dt ? false : true)});
					}
				}
			}
			return true;
		}
*/
		node.startLoadTiles = function(attr)	{		// Перезагрузка тайлов векторного слоя
			var redrawFlag = false;
			tilesRedrawImages.clear();
			if (!attr.notClear) {
				for(var key in node['tilesGeometry']) {
					node.removeTile(key);	// Полная перезагрузка тайлов
				}
				redrawFlag = true;
			}
			
			if (attr.processing) {						// Для обычных слоев
				node.removeEditedObjects();
				if (attr.processing.removeIDS) {
					removeItems(attr.processing.removeIDS);
				}
				if (attr.processing.addObjects) {
					node['addedItems'] = node['addedItems'].concat(objectsToFilters(attr.processing.addObjects, 'addItem'));
				}
				
			}
			
			if (attr.add || attr.del) {			// Для обычных слоев
				if (attr.del) {
					for(var key in attr.del) node.removeTile(key);	// Полная перезагрузка тайлов
				}
			}

			if('dtiles' in attr) {		// Для мультивременных слоев
				var pt = getTilesBounds(attr['dtiles']);
				for(var key in pt) {
					//node.removeTile(key);
					if(!node['tiles'][key]) {
						node['tiles'][key] = pt[key];
						redrawFlag = true;
					}
				}
			}
			node.temporal = attr;
			//if('ut1' in attr && 'ut2' in attr) {		// Есть временной фильтр
				//node.chkTemporalFilter(attr);
			//}

//			if(redrawFlag && node.leaflet) node.leaflet.redraw();
			//if(node.leaflet) waitRedraw();
			//setVisibleRecursive(gmxNode, true);

//console.log(' startLoadTiles: ' + attr + ' : ');
			if(node.leaflet) waitRedraw();
			return true;
		}
		node.remove = function(key)	{		// Удалить векторный слой
			if(!node['leaflet']) return;
			utils.removeLeafletNode(node);
			node['leaflet'] = null;
		}
		gmxNode.addListener('onChangeVisible', function(flag) {				// Изменилась видимость слоя
			gmxAPI._leaflet['LabelsManager'].onChangeVisible(id, flag);
		}, -10);
		
		node.setClusters = function(ph)	{			// Добавить кластеризацию к векторному слою
			var out = {
				'input': ph
			};
			if(ph.iterationCount) out['iterationCount'] = ph.iterationCount;	// количество итераций K-means
			if(ph.radius) out['radius'] = ph.radius;							// радиус кластеризации в пикселах
			
			gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onIconLoaded', 'func': function(eID) {	// проверка загрузки иконок
				if(eID.indexOf('_clusters')) {
					if(eID == node.id + '_regularStyle_clusters') {
						out.regularStyle['ready'] = true;
					} else if(eID == node.id + '_hoveredStyle_clusters') {
						out.hoveredStyle['ready'] = true;
					}
				}
				//console.log(' onIconLoaded: ' + eID + ' : '); 
			}});
			if(ph.RenderStyle) {
				out.regularStyle = utils.parseStyle(ph.RenderStyle, node.id + '_regularStyle_clusters');
				out.regularStyleIsAttr = utils.isPropsInStyle(out.regularStyle);
				if(!out.regularStyleIsAttr) out.regularStyle = utils.evalStyle(out.regularStyle)
				if(ph.HoverStyle && ph.RenderStyle.label && !ph.HoverStyle.label) ph.HoverStyle.label = ph.RenderStyle.label;
			}
			if(ph.HoverStyle) {
				out.hoveredStyle = utils.parseStyle(ph.HoverStyle, node.id + '_hoveredStyle_clusters');
				out.hoveredStyleIsAttr = utils.isPropsInStyle(out.hoveredStyle);
				if(!out.hoveredStyleIsAttr) out.hoveredStyle = utils.evalStyle(out.hoveredStyle)
			}
			node['clustersData'] = out;
			gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map, {});	// Проверка map Listeners на hideBalloons
		}

		var getTileClusterArray = function(iarr, tileAttr)	{			// Получить кластеры тайла
			var attr = node['clustersData'];
			var iterCount = (attr.iterationCount != null ? attr.iterationCount : 1);	// количество итераций K-means
			var radius = (attr.radius != null ? attr.radius : 20);						// радиус кластеризации в пикселах
			var input = attr['input'] || {};
			var newProperties = input['newProperties'] || {'Количество': '[objectInCluster]'};	// properties кластеров

			var mInPixel = gmxAPI._leaflet['mInPixel'];
			//var radMercator = radius * scale;			// размер радиуса кластеризации в метрах меркатора
			var x = tileAttr['x'];
			var y = 256 + tileAttr['y'];
			//var flag = identityField; 
			var grpHash = {};
			var arr = [];
			var cnt = 0;
			for(var i=0; i<iarr.length; i++) {
				var item = iarr[i];
				if (item.type.indexOf('Point') == -1) continue;
				var p = item.coordinates;
//				if(!tileAttr.bounds.contains(p)) continue;
				var px1 = p.x * mInPixel - x;
				var py1 = y - p.y * mInPixel;

				var dx = Math.floor(px1 / radius);		// Координаты квадранта разбивки тайла
				if(dx < 0) continue;
				var dy = Math.floor(py1 / radius);
				if(dy < 0) continue;
				var key = dx + '_' + dy;
				var ph = grpHash[key] || {};
				var parr = ph['arr'] || [];
				parr.push(cnt);
				cnt++;
				arr.push(item);
				ph.arr = parr;
				grpHash[key] = ph;
			}
/*			
			function setProperties(prop_:Hash<String>, len_:Int):Void
			{
				var regObjectInCluster = ~/\[objectInCluster\]/g;
				for (i in 0...Std.int(propFields[0].length)) {
					var key:String = propFields[0][i];
					var valStr:String = propFields[1][i];
					valStr = regObjectInCluster.replace(valStr, cast(len_));
					prop_.set(key, valStr);
				}
			}
*/			
			function getCenterGeometry(parr)
			{
				if (parr.length < 1) return null;
				var xx = 0; var yy = 0;
				var lastID = null;
				var members = [];
				for(var i=0; i<parr.length; i++) {
					var index = parr[i];
					var item = arr[index];
					if (parr.length == 1) return item;
					lastID = item.id;
					var p = item.coordinates;
					xx += p.x;
					yy += p.y;
					members.push(item);
				}
				xx /= parr.length;
				yy /= parr.length;

				var rPoint = new L.Point(xx, yy)
				var bounds = new L.Bounds();
				bounds.extend(rPoint);
				
				var res = {
					'id': lastID
					,'type': 'Point'
					,'bounds': bounds
					,'coordinates': rPoint
					,'properties': {
					}
					,'propHiden': {
						'subType': 'cluster'
						,'_members': members
					}
				};
				return res;
			}

			// find the nearest group
			function findGroup(point) {
				var min = Number.MAX_VALUE; //10000000000000;
				var group = -1;
				for(var i=0; i<centersGeometry.length; i++) {
					var item = centersGeometry[i];
					var center = item.coordinates;
					var x = point.x - center.x,
						y = point.y - center.y;
					var d = x * x + y * y;
					if(d < min){
						min = d;
						group = i;
					}
				}
				return group;
			}
			
			
			var centersGeometry = [];
			var objIndexes =  [];
			// преобразование grpHash в массив центроидов и MultiGeometry
			var clusterNum =  0;
			for (var key in grpHash)
			{
				var ph = grpHash[key];
				if (ph == null || ph.arr.length < 1) continue;
				objIndexes.push(ph.arr);
				var pt = getCenterGeometry(ph.arr);
				var prop = {};
				var first = arr[ph.arr[0]];
				if (ph.arr.length == 1) {
					prop = gmxAPI.clone(getPropItem(first));
				}
				else
				{
					clusterNum++;
					pt['id'] = 'cl_' + clusterNum;
					prop[identityField] = pt['id'];
					prop['d'] = 'cl_' + clusterNum;
					//setProperties(prop, ph.arr.length);
				}

				if(first.propTemporal != null) pt.propTemporal = first.propTemporal;
				pt.properties = prop;
				centersGeometry.push(pt);
			}

			// Итерация K-means
			function kmeansGroups()
			{
				var newObjIndexes =  [];
				for(var i=0; i<arr.length; i++) {
				//for (i in 0...Std.int(geom.members.length))				{
					var item = arr[i];
					//if (!Std.is(geom.members[i], PointGeometry)) continue;
					//var member:PointGeometry = cast(geom.members[i], PointGeometry);
					var point = item.coordinates;

					var group = findGroup(point);
					
					if (!newObjIndexes[group]) newObjIndexes[group] = [];
					newObjIndexes[group].push(i);
				}
				centersGeometry = [];
				objIndexes =  [];

				var clusterNum =  0;
				for(var i=0; i<newObjIndexes.length; i++) {
				//for (arr in newObjIndexes)				{
					var parr = newObjIndexes[i];
					if (!parr || parr.length == 0) continue;
					var pt = getCenterGeometry(parr);
					var prop = {};
					if (parr.length == 1) {
						prop = gmxAPI.clone(getPropItem(arr[parr[0]]));
						//var propOrig = geom.members[parr[0]].properties;
						//for(key in propOrig.keys()) prop.set(key, propOrig.get(key));
						//pt.propHiden.set('_paintStyle', vectorLayerFilter.mapNode.regularStyle);
					}
					else
					{
						clusterNum++;
						pt['id'] = 'cl_' + clusterNum;
						pt['subType'] = 'cluster';
						pt.curStyle = attr.regularStyle;
						//pt.propHiden['_paintStyle'] = attr.regularStyle;
						prop[identityField] = pt['id'];
						//prop['dgg'] = 'cl_' + clusterNum;
					}
					pt.properties = prop;
					if(arr[parr[0]].propTemporal != null) pt.propTemporal = arr[parr[0]].propTemporal;
					
					centersGeometry.push(pt);
					objIndexes.push(parr);
				}
			}
			
			for(var i=0; i<iterCount; i++) {	// Итерации K-means
				kmeansGroups();
			}
			
			var regObjectInCluster = /\[objectInCluster\]/g;
			var res = [];
			for(var i=0; i<centersGeometry.length; i++) {	// Подготовка геометрий
 				var item = centersGeometry[i];
 				if(item['subType'] === 'cluster') {
					var p = item.coordinates;
					var geo = gmxAPI._leaflet['PointGeometry']({'coordinates': [p.x, p.y]});
					geo.id = item.id + '_' + tileAttr['drawTileID'];
					geo.curStyle = item.curStyle;
					geo.properties = item.properties;
					for (var key in newProperties)
					{
						var zn = newProperties[key];
						if(zn.match(regObjectInCluster)) zn = zn.replace(regObjectInCluster, item.propHiden._members.length);
						geo.properties[key] = zn;
					}

					geo.propHiden = item.propHiden;
					geo.propHiden['tileID'] = tileAttr['drawTileID'];
					geo.propHiden['fromTiles'] = {};
					
					res.push(geo);
				} else {
					res.push(item);
				}
			}
			return res;
		}
		
		// Обработчик события - onTileLoaded
		gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onTileLoaded', 'obj': gmxAPI.mapNodes[id], 'func': function(ph) {
				var nodeLayer = mapNodes[id];
				if(ph.attr) {
					nodeLayer.parseVectorTile(ph.attr['data']['data'], ph.attr['data']['tileID'], ph.attr['data']['dAttr']);
					ph = null;
				}
			}
		});
		// Обработчик события - onLayerStartTileRepaint
		gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onLayerStartTileRepaint', 'obj': gmxAPI.mapNodes[id], 'func': function(ph) {
				var nodeLayer = mapNodes[id];
				//nodeLayer.repaintTile(ph.attr, true);
				nodeLayer.waitRedrawTile(ph.attr);
				//console.log(' onLayerStartTileRepaint: ' ,ph.attr, ' : ');
			}
		});
	}
	
	// получить bounds списка тайлов слоя
	function getTilesBounds(arr)	{
		var hash = {};
		for (var i = 0; i < arr.length; i+=3)
		{
			var st = arr[i+2] + '_' + arr[i] + '_' + arr[i+1];
			var pz = Math.round(Math.pow(2, Math.floor(arr[i+2]) - 1));
			var bounds = utils.getTileBounds({'x':Math.floor(arr[i]) + pz, 'y':pz - 1 - Math.floor(arr[i+1])}, Math.floor(arr[i+2]));
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
			hash[st] = bounds;
		}
		return hash;
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
			getTileNums: function () {
				var arr = [];
				for(var key in this._tiles) arr.push(this._tiles[key].id);
				return arr;
			}
			,
			getCanvasTile: function (id) {
				for(var key in this._tiles) {
					var tile = this._tiles[key];
					if(tile.id == id) return tile;
				}
				return null;
			}
			,
			drawTile: function (tile, tilePoint, zoom) {
				// override with rendering code
				var opt = this.options;
				var node = mapNodes[opt['id']];
				if(!node) return;								// Слой пропал
				if(gmxAPI.map.needMove) {
					if(node.waitRedraw) node.waitRedraw();
					return true;			// При отложенных перемещениях не загружаем тайлы
				}
				var me = this;
				me.tileDrawn(tile);
				if(!zoom) zoom = LMap.getZoom();
				var pz = Math.pow(2, zoom);
				var tx = tilePoint.x;
				if(tx < 0) tx += pz;
				var scanexTilePoint = {
					'x': (tx % pz - pz/2) % pz
					,'y': -tilePoint.y - 1 + pz/2
				};
				var drawTileID = zoom + '_' + scanexTilePoint.x + '_' + scanexTilePoint.y;
				tile.id = drawTileID;
				var bounds = utils.getTileBoundsMerc(scanexTilePoint, zoom);

				gmxAPI._leaflet['lastZoom'] = zoom;
				gmxAPI._leaflet['mInPixel'] = pz/156543.033928041;
				
/*
				var ctx = tile.getContext('2d');
				//ctx.clearRect(0, 0, 256, 256);
//console.log('drawTile ', drawTileID);

ctx.strokeRect(2, 2, 253, 253);
ctx.font = '24px "Tahoma"';
ctx.fillText(drawTileID, 10, 128);
*/
				//var attr = {'node': node, 'tile': tile, 'ctx': ctx, 'x': 256 * scanexTilePoint.x, 'y': 256 * scanexTilePoint.y, 'zoom': zoom, 'bounds': bounds, 'drawTileID': drawTileID, 'scanexTilePoint': scanexTilePoint};
				var attr = {'node': node, 'x': 256 * scanexTilePoint.x, 'y': 256 * scanexTilePoint.y, 'zoom': zoom, 'bounds': bounds, 'drawTileID': drawTileID, 'scanexTilePoint': scanexTilePoint};
				(function(ph) {
					node['chkLoadTile'](ph);
				})(attr);

			}
		});
		
	}

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['setVectorTiles'] = setVectorTiles;				// Добавить векторный слой
})();
