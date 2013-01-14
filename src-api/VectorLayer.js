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
		node['hoverItem'] = null;				// Обьект hover
		node['tilesLoaded'] = {};
		node['tilesLoadProgress'] = {};
		node['loaderFlag'] = false;
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
		node['labelsBounds'] = [];				// Массив отрисованных label

		var inpAttr = ph.attr;
		node['subType'] = (inpAttr['filesHash'] ? 'Temporal' : '');
		
		if(layer.properties['IsRasterCatalog']) {
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
			var currListenerID = gmxAPI._listeners.addListener({'level': 10, 'eventName': 'onTileLoaded', 'obj': gmxNode, 'func': function(ph) {
				if(node['loaderFlag']) return;
				gmxNode.removeListener('onTileLoaded', currListenerID); currListenerID = null;
				var itemId = attr['fid'];
				var item = node['objectsData'][itemId];
				var geom = node['getItemGeometry'](itemId);
				var ret = new gmxAPI._FlashMapFeature(geom, item.properties, gmxNode);
				if(attr.func) attr.func(ret);
			}});
			var ext = {	minX: -Number.MAX_VALUE, minY: -Number.MAX_VALUE, maxX: Number.MAX_VALUE, maxY: Number.MAX_VALUE };
			node['loadTilesByExtent'](ext);
		}
		node['getFeatures'] = function (attr) {					// Получить данные векторного слоя по bounds геометрии
			(function() {
				var geoMerc = gmxAPI.merc_geometry(attr.geom ? attr.geom : { type: "POLYGON", coordinates: [[-180, -89, -180, 89, 180, 89, 180, -89]] });
				var ext = gmxAPI.getBounds(geoMerc.coordinates);
				var currListenerID = gmxAPI._listeners.addListener({'level': 10, 'eventName': 'onTileLoaded', 'obj': gmxNode, 'func': function(ph) {
					if(node['loaderFlag']) return;
					gmxNode.removeListener('onTileLoaded', currListenerID); currListenerID = null;
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
						ret.push(new gmxAPI._FlashMapFeature(geom, item.properties, gmxNode));
					}
					attr.func(ret);
				}});
				node['loadTilesByExtent'](ext);
			})();
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
							var ph = {'layerID': node.id, 'properties': item.properties };
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
							
							if(!ignoreVisibilityFilter && node['_sqlFuncVisibility'] && !node['_sqlFuncVisibility'](item['properties'])) continue; 	// если фильтр видимости на слое не отменен
							
							var id = item.id;
							var vFlag = (item.bounds.max.x < ext.minX || item.bounds.min.x > ext.maxX || item.bounds.max.y < ext.minY || item.bounds.min.y > ext.maxY);
							var ph = {'layerID': node.id, 'properties': item.properties };
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

		node.chkLoadTiles = function()	{							// Проверка необходимости загрузки тайлов
			if(gmxNode['isVisible'] === false) return;								// Слой не видим
			var currZ = LMap.getZoom();
			if(currZ < node['minZ'] || currZ > node['maxZ']) return;				// Неподходящий zoom
			
			var currPosition = gmxAPI.currPosition;
			if(!currPosition || !currPosition.extent) return;
			var ext = currPosition.extent;
			node['loadTilesByExtent'](ext, true);
		};

		node['loadTilesByExtent'] = function(ext, flagDraw)	{		// Загрузка векторных тайлов по extent
/*			
			if(gmxNode['isVisible'] === false) return;								// Слой не видим
			var currZ = LMap.getZoom();
			if(currZ < node['minZ'] || currZ > node['maxZ']) return;				// Неподходящий zoom
			
			var currPosition = gmxAPI.currPosition;
			if(!currPosition || !currPosition.extent) return;
			var ext = currPosition.extent;
*/			
			var tiles = node['tiles'];
//console.log(tileKey, gmxNode);
			for (var tileKey in tiles)
			{
				//if(node['tilesGeometry'][tileKey] || node['badTiles'][tileKey] || node['tilesLoadProgress'][tileKey]) continue;
				if(node['tilesGeometry'][tileKey] || node['badTiles'][tileKey]) continue;
				var tb = tiles[tileKey];
				var tvFlag = (tb.max.x < ext.minX || tb.min.x > ext.maxX || tb.max.y < ext.minY || tb.min.y > ext.maxY);
				if(tvFlag) continue;								// Тайл за границами видимости

				(function() {
					var tID = tileKey;
					var arr = tID.split('_');
					var srcArr = option.tileFunc(arr[1], arr[2], arr[0]);
					if(typeof(srcArr) === 'string') srcArr = [srcArr];
					//var cnt = counts;
					var counts = srcArr.length;
					var needParse = [];
						for (var i = 0; i < srcArr.length; i++)		// подгрузка векторных тайлов
						{
							var src = srcArr[i] + '&r=t';
							if(node['tilesLoadProgress'][src]) continue;
							node['loaderFlag'] = true;
							node['tilesLoadProgress'][src] = true;
							
							(function() {						
								var psrc = src;
								gmxAPI.sendCrossDomainJSONRequest(psrc, function(response)
								{
									delete node['tilesLoadProgress'][psrc];
									counts--;
									if(typeof(response) != 'object' || response['Status'] != 'ok') {
										gmxAPI.addDebugWarnings({'url': psrc, 'Error': 'bad response'});
										node['badTiles'][tID] = true;
										//return;
									}
									if(response['Result'] && response['Result'].length)	needParse = needParse.concat(response['Result']);
									if(counts < 1) {
										node['loaderFlag'] = false;
										for (var pkey in node['tilesLoadProgress'])
										{
											node['loaderFlag'] = true;
											break;
										}
										gmxAPI._listeners.dispatchEvent('onTileLoaded', gmxNode, {'obj':gmxNode, 'attr':{'data':{'tileID':tID, 'data':needParse}}});		// tile загружен
										needParse = [];
										if(flagDraw) {
											if(!node['loaderFlag']) waitRedraw();		// перезапросить drawTile слоя
											return;
										}
									}
									//console.log('loaderFlag ', node['loaderFlag'], counts, tID, psrc);
								});
							})();
						}
				})();
			}
			if(!node['loaderFlag']) gmxAPI._listeners.dispatchEvent('onTileLoaded', gmxNode, {'obj':gmxNode} );		// все тайлы загружены
		};
		// todo сделать загрузку векторных тайлов без layer.redraw() лефлета
		//gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onMoveEnd', 'obj': gmxAPI.map, 'func': node.chkLoadTiles});

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
					if(node['_sqlFuncVisibility'] && !node['_sqlFuncVisibility'](item['properties'])) continue; 	// если фильтр видимости на слое не отменен
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
		gmxAPI.map.addListener('onMouseMove', function(ph) {
			if(gmxAPI._drawing['activeState'] || !node['leaflet'] || node['leaflet']._isVisible == false || gmxAPI._leaflet['mousePressed'] || gmxAPI._leaflet['curDragState']) return false;
//console.log('onMouseMove ' , ph);
			var latlng = ph.attr['latlng'];
			var mPoint = new L.Point(gmxAPI.merc_x(latlng['lng']), gmxAPI.merc_y(latlng['lat']));
			//var arr = getItemsByPoint(latlng);
			var arr = tilesRedrawImages.getItemsByPoint(ph.attr.tID, mPoint);
//return;
			if(arr && arr.length) {
				var item = getTopFromArrItem(arr);
				if(!item) return;
				hoverItem(item);
			} else {
				if(node['hoverItem']) {
					redrawTilesHash(node['hoverItem'].geom.propHiden['drawInTiles']);
					gmxAPI._div.style.cursor = '';
				}
				node['hoverItem'] = null;
			}
		}, -11);
		var hoverItem = function(item) {				// Отрисовка hoveredStyle для item
			if(!item) return;
			var itemId = item.geom.id;
			var propHiden = item.geom.propHiden;
//console.log('hoverItem ' , item);
			
			var hoveredStyle = null;
			var regularStyle = null;
			if(propHiden['subType'] != 'cluster') {
				var filters = propHiden['toFilters'];
				var filter = (filters && filters.length ? mapNodes[filters[0]] : null);
				if(filter) {
					hoveredStyle = (filter.hoveredStyle ? filter.hoveredStyle : null);
					regularStyle = (filter.regularStyle ? filter.regularStyle : null);
				}
			} else {
				hoveredStyle = node['clustersData']['hoveredStyle'];
				regularStyle = node['clustersData']['regularStyle'];
			}
			if(hoveredStyle) {
				if(!node['hoverItem'] || node['hoverItem'].geom.id != itemId) {
					node['hoverItem'] = item;
					item.geom.curStyle = hoveredStyle;

					redrawTilesHash(propHiden['drawInTiles']);
/*					var zoom = LMap.getZoom();
					for (var tileID in propHiden['drawInTiles'])
					{
						node.redrawTile(tileID, zoom);
					}*/
					//var tileBound = node['tiles'][tileID];
					
					item.geom.curStyle = regularStyle;
					gmxAPI._div.style.cursor = 'pointer';
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
		
		node['setFlip'] = function() {				// добавить обьект flip сортировки
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
			var mObj = new gmxAPI._FlashMapFeature(geom, item.properties, gmxNode);
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
					if(attr.shiftKey && node['propHiden']['rasterView'] === 'onShiftClick') oper = 'rasterView';
					else if(attr.ctrlKey && node['propHiden']['rasterView'] === 'onCtrlClick') oper = 'rasterView';
					else if(node['propHiden']['rasterView'] === 'onClick') oper = 'rasterView';
					
					vid = node['flipIDS'][node['flipIDS'].length - 1];
					item = (oper === 'setFlip' ? node['setFlip']() : node['objectsData'][vid]);
					if(!item) return true;
					vid = item.id;
					itemPropHiden = item.propHiden;

					//console.log('flipIDS' , item.id);
					chkFlip(item.id);
					if(oper === 'rasterView') {
						itemPropHiden['rasterView'] = !itemPropHiden['rasterView'];
						chkNeedImage(item);
						return true;
					}
				} else {
					itemPropHiden = item.geom.propHiden;
				}
				if(oper === 'setFlip' && attr.tID) {
					var hItem = getTopFromArrItem(arr);
					if(hItem) hoverItem(hItem);
				}
				
				if(!isCluster) {
					if(!itemPropHiden['toFilters'] || !itemPropHiden['toFilters'].length) return;		// обьект не попал в фильтр
					var fID = itemPropHiden['toFilters'][0];
					var filter = gmxAPI.mapNodes[fID];
					if(!filter || !mapNodes[fID]['handlers'][evName]) return;						// не найден фильтр
					var geom = node['getItemGeometry'](item.id);
					mapNodes[fID]['handlers'][evName].call(filter, item.id, item.properties, {'onClick': true, 'geom': geom});
				} else {
					node['handlers'][evName].call(gmxNode, item.id, item.geom.properties, {'onClick': true, 'objType': 'cluster', 'geom': item.geom});
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
			,'updateWhenIdle': true
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
			if(filter.regularStyleIsAttr) style = utils.evalStyle(filter.regularStyle, geo);
			
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
					txt = geo.properties[field] || '';
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
				var flag = (filter && filter.sqlFunction ? filter.sqlFunction(geo['properties']) : true);
				if(flag) {
					toFilters.push(filterID);
					styleToGeo(geo, filter);
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
					geo['propHiden'] = propHiden;
					geo['id'] = id;
					geo['properties'] = prop;
					outArr.push(geo);
				}
				propHiden['toFilters'] = chkObjectFilters(geo);
				var objData = {
					'id': id
					,'type': geo['type'].toUpperCase()
					,'properties': prop
					,'propHiden': propHiden
				};
				if(node['objectsData'][id]) {		// Обьект уже имеется - нужна??? склейка геометрий
					var pt = node['objectsData'][id];
					if(objData['type'].indexOf('MULTI') == -1) objData['type'] = 'MULTI' + objData['type'];
					for(var key in pt.propHiden['fromTiles']) {
						objData['propHiden']['fromTiles'][key] = pt.propHiden['fromTiles'][key];
					}
				}
				node['objectsData'][id] = objData;
			}
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
				if(style['stroke'] && style['weight'] > 0) {
					ctx.lineWidth = style['weight'];
					var opacity = ('opacity' in style ? style['opacity'] : 1);
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
					geom.propHiden['drawInTiles'][rTileID] = true;
					if(!needRedrawTiles[rTileID]) needRedrawTiles[rTileID] = {};
					needRedrawTiles[rTileID][geom.id] = geom;
				}
			}
		}
		
		var tilesRedrawImages = {						// Управление отрисовкой растров векторного тайла
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
			'clear': function(zoom, tileID)	{						// Получить обьекты попавшие в тайл отрисовки
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
		
		var observerTimer = null;										// Таймер
		node.repaintTile = function(attr, clearFlag)	{							// перерисовать векторный тайл слоя
			//console.log('repaintTile' , attr['drawTileID']);
			var drawTileID = attr['drawTileID'];
			if(clearFlag) attr.ctx.clearRect(0, 0, 255, 255);
			//delete needRedrawTiles[drawTileID];
//console.log('repaintTile ' , drawTileID , clearFlag);
			
			var out = false;
			if(node['observerNode']) {
				if(observerTimer) clearTimeout(observerTimer);
				observerTimer = setTimeout(node['chkObserver'], 0);
			}

			var zoom = attr['zoom'];
			gmxAPI._leaflet['lastZoom'] = zoom;
			var tileSize = Math.pow(2, 8 - zoom) * 156543.033928041;
			gmxAPI._leaflet['mInPixel'] = 256/tileSize;

			var cnt = 0;
			attr['node'] = node;
			var rasterNums = 0;
			//var hideIDS = {};
			var drawGeoArr = function(arr, flag)	{							// Отрисовка массива геометрий
				var res = [];
				for (var i1 = 0; i1 < arr.length; i1++)
				{
					var geom = arr[i1];
					//hideIDS[geom['id']] = true;
					//if(flag && node['flipHash'][geom['id']]) continue; 	// Нарисовать поверх
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

						if(node['_sqlFuncVisibility'] && !node['_sqlFuncVisibility'](objData['properties'])) continue; // если фильтр видимости на слое
						if(!node.chkTemporalFilter(geom)) {	// не прошел по мультивременному фильтру
							continue;
						}

						var filters = propHiden['toFilters'];
						//var lastZoom = propHiden['lastZoom'];
						var filter = (filters && filters.length ? mapNodes[filters[0]] : null);
						filters = propHiden['toFilters'] = chkObjectFilters(geom);
						propHiden['lastZoom'] = zoom;
						if(filters && filters.length) {
							filter = mapNodes[filters[0]];
							if(filter && !geom.curStyle) styleToGeo(geom, filter);
						}
						if(!filter || filter.isVisible === false || !geom.curStyle) {		// если нет фильтра или он невидим пропускаем
							continue;
						}
					}
					var style = geom.curStyle || null;
					attr['style'] = style;
					if(!propHiden['drawInTiles']) propHiden['drawInTiles'] = {};
					propHiden['drawInTiles'][drawTileID] = true;

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
						
					//var rUrl = (node['tileRasterFunc'] ? node['tileRasterFunc'](attr.scanexTilePoint['x'], attr.scanexTilePoint['y'], attr['zoom'], objData) : '');
					var rUrl = '';
					if(node['tileRasterFunc']) rUrl = node['tileRasterFunc'](attr.scanexTilePoint['x'], attr.scanexTilePoint['y'], attr['zoom'], objData);
/*
if(objData['properties']['GM_LayerName']) {
	rUrl = (node['tileRasterFunc'] ? node['tileRasterFunc'](attr.scanexTilePoint['x'], attr.scanexTilePoint['y'], attr['zoom'], objData) : '');
} else {
	rUrl = (node['osmRasterFunc'] ? node['osmRasterFunc'](attr.scanexTilePoint['x'], attr.scanexTilePoint['y'], attr['zoom'], objData) : '');
}
*/
					var rItem = {
						'geom': geom
						,'attr': attr
						,'src': rUrl
					};
					tilesRedrawImages.addItem(zoom, drawTileID, rItem);
					
					if(showRaster) {
						//rItem['drawFunc'] = function() {drawRasters(drawTileID);};
						rasterNums++;
						(function() {
							var tileID = drawTileID;
							var ptItem = rItem;
							var item = {
								'src': rUrl
								,'zoom': zoom
								,'callback': function(imageObj) {
									rasterNums--;
									ptItem['imageObj'] = imageObj;
									if(rasterNums === 0) {
										drawRasters(tileID);
									}
								}
								,'onerror': function(){
									rasterNums--;
									ptItem['imageNotFound'] = true;
									if(rasterNums === 0) drawRasters(tileID);
								}
							};
							gmxAPI._leaflet['imageLoader'].push(item);
						})();
					} else {
						setCanvasStyle(attr['ctx'], style);
						//style['label']['extent'] = new L.Point(size, ctx.measureText(txt).width);
						var boundsLabel = geom['paint'](attr);
						if(propHiden['subType'] == 'cluster') chkBorderTiles(geom, attr);
						//if(boundsLabel) node['labelsBounds'].push(boundsLabel);
						//if(node['labels'][geom['id']]) {
							//node['labels'][geom['id']].addTo(node['group']);
						//}
					}
					res.push(geom['id']);
				}
				return res;
			}

			//var needDraw = [];
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
			if(node['clustersData']) {						// Получить кластеры
				arr = getTileClusterArray(arr, attr);
				removeFromBorderTiles(drawTileID);
				waitRedrawFlips();							// требуется отложенная перерисовка
			}
			drawGeoArr(arr);

			//attr.tile._layer.tileDrawn(attr.tile);
/*			
			var arr = [];
//console.log('bbbbbbbbbbb ', node['labelsBounds'].length);
			if(node['labelsBounds'].length) {
				var vBounds = LMap.getBounds();
				var vpNorthWest = vBounds.getNorthWest();
				var vpSouthEast = vBounds.getSouthEast();
				var vp1 = LMap.project(vpNorthWest);
				var vp2 = LMap.project(vpSouthEast);
				
				var pixelBounds = LMap.getPixelBounds();
			
				var tilePos = attr['tile']['_leaflet_pos'];
				var dx = tilePos.x - vp1.x;
				var dy = tilePos.y - vp1.y;
				var dx = tilePos.x;
				var dy = tilePos.y;
				
				var testLabelCanvas = document.createElement('canvas');
				testLabelCanvas.width = vp2.x - vp1.x;
				testLabelCanvas.height = vp2.y - vp1.y;
				var ptx = testLabelCanvas.getContext('2d');
				ptx.fillStyle = "#ffffff";
				//ptx.beginPath();
				//ptx.clearRect(0, 0, pixelMap.x, pixelMap.y);
				for (var i = node['labelsBounds'].length; i > 0; i--)
				{
					var pt = node['labelsBounds'][i - 1];
					var flag = true;
					var b = pt.boundsLabel;
					//ptx.save();
					//ptx.closePath();
					var imageData = ptx.getImageData(dx + b.min.x, dy + b.min.y, 1,1);
					if(imageData.data[0] > 0) {
						continue;
					}
					imageData = ptx.getImageData(dx + b.min.x, dy + b.max.y, 1,1);
					if(imageData.data[0] > 0) {
						continue;
					}
					imageData = ptx.getImageData(dx + b.max.x, dy + b.max.y, 1,1);
					if(imageData.data[0] > 0) {
						continue;
					}
					imageData = ptx.getImageData(dx + b.max.x, dy + b.min.y, 1,1);
					if(imageData.data[0] > 0) {
						continue;
					}
					//ptx.restore();
//					for (var j = 0; j < arr.length; j++)
//					{
//						if(pt.boundsLabel.intersects(arr[j])) {				// проверка пересечения мультиполигона с отображаемым тайлом
//							flag = false;
//							break;
//						}
//					}
					//if(flag) {
						//ptx.fillRect(dx + pt.boundsLabel.min.x, dy + pt.boundsLabel.min.y, pt.boundsLabel.max.x - pt.boundsLabel.min.x, pt.boundsLabel.max.y - pt.boundsLabel.min.y);
						ptx.fillRect(0, 0, testLabelCanvas.width, testLabelCanvas.height);
						ptx.fill();
						//arr.push(pt.boundsLabel);
						//ctx.font = "italic bold 16px Arial";
						//ctx.textAlign = "center";
						//var isPath = ctx.isPointInPath(50,50); // return true
						//ctx.textBaseline = "Top";
						pt.ctx.font = pt.font;
						pt.ctx.fillStyle = pt.fillStyle;
						pt.ctx.fillText(pt.fillText, pt.x, pt.y);
					//}
				}
				testLabelCanvas.width = testLabelCanvas.height = 0;
				testLabelCanvas = null;
			}
*/			
			return out;
		}
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

		var objectToCanvas = function(pt, flagClear)	{								// отрисовка растров векторного тайла
//console.log('objectToCanvas ', flagClear, pt);
//return;			
			var attr = pt['attr'];
			attr.ctx.save();
			if(flagClear) attr.ctx.clearRect(0, 0, 256, 256);
			if(!pt.geom.curStyle) return;
			attr.style = pt.geom.curStyle;
			setCanvasStyle(attr['ctx'], attr.style);
			attr.ctx.restore();
			if(pt.imageObj) {
				attr.ctx.save();
				chkGlobalAlpha(attr.ctx);
				var pattern = attr.ctx.createPattern(pt.imageObj, "no-repeat");
				attr.ctx.fillStyle = pattern;
				pt.geom['paintFill'](attr);
				attr.ctx.fill();
				attr.ctx.clip();
				attr.ctx.restore();
				//return;
			}
			//setCanvasStyle(attr['ctx'], pt.geom.curStyle);
			pt.geom['paint'](attr);
		}
		/*
		var getCanvasTile = function(tileID)	{								// отрисовка растров векторного тайла
			if(!node['leaflet'] || !node['leaflet']['_tiles']) return null;
			for (var key in node['leaflet']['_tiles']) {
				var canvas = node['leaflet']['_tiles'][key];
				if(canvas.id == tileID && canvas.tagName === 'CANVAS') return canvas;
			}
			return null;
		}
		*/
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
			var arr = tilesRedrawImages.getTileItems(zoom, tileID);
			if(arr.length == 0) return;
			var attr = arr[0].attr;
			var borders = needRedrawTiles[tileID] || null;

			var flagClear = true;
			var out = {};
			var item = null;
			for (var i = 0; i < arr.length; i++) {
				item = arr[i];
				if(!chkItemFiltersVisible(item.geom)) continue;
				var itemId = item.geom.id;
				if(borders && borders[itemId]) {
					continue;
				} if(node['flipHash'][itemId]) {
					if(!out[itemId]) out[itemId] = [];
					out[itemId].push(item);
				} else {
					objectToCanvas(item, flagClear);
					flagClear = false;
				}

			}
			if(borders) {											// перерисовка пограничных обьектов
				for (var key in borders)
				{
					objectToCanvas({ 'geom': borders[key], 'attr': attr	}, flagClear);
				}
			}
			for (var i = 0; i < node['flipedIDS'].length; i++) {	// перерисовка fliped обьектов
				var id = node['flipedIDS'][i];
				if(out[id]) {
					for (var j = 0; j < out[id].length; j++) {
						objectToCanvas(out[id][j], flagClear);
						flagClear = false;
					}
				}
			}
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
			for (var z in node['tilesRedrawImages']) {
				if(z != zoom) delete node['tilesRedrawImages'][z];
			}
			
			var itemId = item.id;
			
			var rasterNums = 0;
			for (var drawTileID in node['tilesRedrawImages'][zoom]) {
				var arr = tilesRedrawImages.getTileItems(zoom, drawTileID);
				for (var i = 0; i < arr.length; i++) {
					var pt = arr[i];
					if(pt.geom['id'] != itemId) continue;
					if(item.propHiden['rasterView']) {
						if(pt['imageObj'] || !pt['src']) continue;		// imageObj уже загружен либо нечего загружать
						(function() {
							var ptItem = pt;
							var tileID = drawTileID;
							var ogc_fid = itemId;
							var ph = {
								'src': pt['src']
								,'callback': function(imageObj) {
									rasterNums--;
									ptItem['imageObj'] = imageObj;
									if(rasterNums === 0) waitRedrawFlips(0);
								}
								,'onerror': function(){
									rasterNums--;
									ptItem['imageNotFound'] = true;
									if(rasterNums === 0) waitRedrawFlips(0);
								}
							};
							rasterNums++;
							gmxAPI._leaflet['imageLoader'].push(ph);
						})();
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
		node.parseVectorTile = function(data, tileID)	{				// парсинг векторного тайла
			node['tilesGeometry'][tileID] = objectsToFilters(data, tileID);
			return true;
		}
		var redrawTimer = null;										// Таймер
		var waitRedraw = function()	{								// Требуется перерисовка слоя с задержкой
			if(redrawTimer) clearTimeout(redrawTimer);
			redrawTimer = setTimeout(function()
			{
				//console.log('waitRedraw ', node.isVisible, myLayer._isVisible);
				if(!node.isVisible || !myLayer._isVisible) return;
				redrawTimer = null;
				node['labelsBounds'] = [];
				myLayer.redraw();
				gmxAPI._leaflet['lastZoom'] = LMap.getZoom();
				gmxAPI._leaflet['mapOnResize']();
			}, 10);
			return false;
		}
		
		var redrawFlipsTimer = null;								// Таймер
		var waitRedrawFlips = function(zd)	{						// Требуется перерисовка уже отрисованных тайлов с задержкой
			if(redrawFlipsTimer) clearTimeout(redrawFlipsTimer);
			if(arguments.length == 0) zd = 10;
			redrawFlipsTimer = setTimeout(function()
			{
/*				var cnt = 0;
				for (var tileID in needRedrawTiles) {
					var arrGeoms = needRedrawTiles[tileID];
					for (var key in arrGeoms) cnt++;
				}
console.log('waitChkBorderTiles ', cnt);*/
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
			var currZ = LMap.getZoom();
			for (var z in node['tilesRedrawImages']) {
				if(z != currZ) delete node['tilesRedrawImages'][z];
			}
			flag = (currZ < node['minZ'] || currZ > node['maxZ'] ? false : true);		// Неподходящий zoom
			if(flag != myLayer._isVisible) {
				utils.setVisibleNode({'obj': node, 'attr': flag});
				waitRedraw();
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
					prop = gmxAPI.clone(first.properties);
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
						prop = gmxAPI.clone(arr[parr[0]].properties);
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
					var tileID = ph.attr['data']['tileID'];
					var data = ph.attr['data']['data'];
					nodeLayer.parseVectorTile(data, tileID);
				}
			}
		});
		// Обработчик события - onLayerStartTileRepaint
		gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onLayerStartTileRepaint', 'obj': gmxAPI.mapNodes[id], 'func': function(ph) {
				var nodeLayer = mapNodes[id];
				nodeLayer.repaintTile(ph.attr, true);
				//nodeLayer.waitRedrawTile(ph.attr);
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
				var tilePane = this._map._panes.tilePane,
					first = tilePane.firstChild;

				if (!this._container || tilePane.empty) {
					if(this._container) this._container.style.visibility = 'hidden';
				
					this._container = L.DomUtil.create('div', 'leaflet-layer');

					if (this._insertAtTheBottom && first) {
						tilePane.insertBefore(this._container, first);
					} else {
						tilePane.appendChild(this._container);
					}

					if (this.options.opacity < 1) {
						this._updateOpacity();
					}
					if('initCallback' in this.options) this.options.initCallback(this);
				}
			},
			drawTile: function (tile, tilePoint, zoom) {
				// override with rendering code
				var me = this;
				me.tileDrawn(tile);
				var opt = this.options;
				var node = mapNodes[opt['id']];
				if(!node) return;								// Слой пропал
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
				
				//if(opt.attr.bounds && !bounds.intersects(opt.attr.bounds))	{	// Тайл не пересекает границы слоя
					//return;
				//}
				//var tileX = 256 * scanexTilePoint.x;								// позиция тайла в stage
				//var tileY = 256 * scanexTilePoint.y;
				//var identityField = tile._layer.options.identityField;
				var ctx = tile.getContext('2d');
				ctx.clearRect(0, 0, 256, 256);
/*
//console.log('drawTile ', drawTileID);

ctx.strokeRect(2, 2, 253, 253);
ctx.font = '24px "Tahoma"';
ctx.fillText(drawTileID, 10, 128);
*/
				var repaint = function(test) {
					var attr = {'tile': tile, 'ctx': ctx, 'x': 256 * scanexTilePoint.x, 'y': 256 * scanexTilePoint.y, 'zoom': zoom, 'bounds': bounds, 'drawTileID': drawTileID, 'scanexTilePoint': scanexTilePoint};
					var gmxNode = gmxAPI.mapNodes[opt['id']];
					gmxAPI._listeners.dispatchEvent('onLayerStartTileRepaint', gmxNode, {'obj':gmxNode, 'attr':attr});
				}
				node['chkLoadTiles']();
				if(!node['loaderFlag']) repaint(0);
			}
		});
		
	}

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['setVectorTiles'] = setVectorTiles;				// Добавить векторный слой
})();
