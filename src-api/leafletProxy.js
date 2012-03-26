//Поддержка leaflet
(function()
{
	var nextId = 0;							// следующий ID mapNode
	var LMap = null;						// leafLet карта
	var mapNodes = {						// Хэш нод обьектов карты - аналог MapNodes.hx
		//	Ключ - id ноды
		//		'type': String - тип ноды ('mapObject')
		//		'parentId': String - id родительской ноды
		//		'properties': Hash - свойства ноды
		//		'geometry': Hash - геометрия ноды
		//		'leaflet': ссылка на leaflet обьект
		//		'zIndex': текущий zIndex ноды
	};

	var utils = {							// Утилиты leafletProxy
		'parseGeometry': function(geo)	{			// перевод геометрии Scanex->leaflet
			var pt = {};
			var type = geo.type;
			pt['coordinates'] = geo['coordinates'];
			if(type === 'MULTIPOLYGON') 			pt['type'] = 'MultiPolygon';
			else if(type === 'POLYGON')				pt['type'] = 'Polygon';
			else if(type === 'POINT')				pt['type'] = 'Point';
			else if(type === 'MULTILINESTRING')		pt['type'] = 'MultiLineString';
			else if(type === 'LINESTRING')			pt['type'] = 'LineString';
			else if(type === 'GeometryCollection')	pt['type'] = 'GeometryCollection';
			var geojson = new L.GeoJSON();
			geojson.addGeoJSON(pt);
			return pt;
		}
		,'drawGeometry': function(geo)	{			// отрисовка leaflet геометрии
			var geojson = new L.GeoJSON();
			geojson.addGeoJSON(geo);
			LMap.addLayer(geojson);
			return geojson;
		}
		,'getTileUrl': function(obj, tilePoint, zoom)	{			// Получение URL тайла
			var res = '';
			if(!('tileFunc' in obj.options)) return res;
			if(zoom < obj.options.minZoom || zoom > obj.options.maxZoom) return res;

			var pz = Math.round(Math.pow(2, zoom - 1));
			res = obj.options.tileFunc(
				tilePoint.x - pz
				,-tilePoint.y - 1 + pz
				,zoom + obj.options.zoomOffset
			);
			return res;
		}
		,'r_major': 6378137.000	
		,'y_ex': function(lat)	{				// Вычисление y_ex 
			if (lat > 89.5)		lat = 89.5;
			if (lat < -89.5) 	lat = -89.5;
			var phi = gmxAPI.deg_rad(lat);
			var ts = Math.tan(0.5*((Math.PI*0.5) - phi));
			var y = -utils.r_major * Math.log(ts);
			return y;
		}
		,'bringToDepth': function(obj, zIndex)	{				// Перемещение ноды на глубину zIndex
			if(!obj) return;
			obj['zIndex'] = zIndex;
			if(!obj['leaflet']) return;
			var lObj = obj['leaflet'];
			lObj.options.zIndex = zIndex;
			if(lObj._container && lObj._container.style.zIndex != zIndex) lObj._container.style.zIndex = zIndex;
		}
		,'getLastIndex': function()	{			// Получить последний zIndex в mapNodes
			var n = 0;
			for (id in mapNodes)
			{
				n = Math.max(n, (mapNodes[id]['zIndex'] ? mapNodes[id]['zIndex'] : 0));
			}
			return n + 1;
		}
		,'getMapPosition': function()	{			// Получить позицию карты
			var pos = LMap.getCenter();
			return {
				'z': LMap.getZoom()
				,'x': gmxAPI.merc_x(pos['lat'])
				,'y': gmxAPI.merc_y(pos['lng'])
			};
		}
	};

	// Команды в leaflet
	var commands = {				// Тип команды
		'setBackgroundTiles': setBackgroundTiles			// добавить растровый тайловый слой
		,
		'addObject':	function(ph)	{					// добавить mapObject
			nextId++;
			var id = 'id' + nextId;
			var pt = {
				'type': 'mapObject'
				,'parentId': ph.obj['objectId']
			};
			if(ph.attr) {
				if(ph.attr['properties']) pt['properties'] = ph.attr['properties'];
				if(ph.attr['geometry']) pt['geometry'] = utils.parseGeometry(ph.attr['geometry']);
			}
			pt['zIndex'] = utils.getLastIndex();
			mapNodes[id] = pt;
			return id;
		}
		,
		'bringToTop': function(ph)	{						// установка zIndex - вверх
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			var zIndex = utils.getLastIndex();

			for (key in ph.obj.childsID) {
				var node = mapNodes[key];
				utils.bringToDepth(node, zIndex);
			}
			return zIndex;
		}
		,
		'bringToBottom': function(ph)	{					// установка zIndex - вниз
			var obj = ph.obj;
			var id = obj.objectId;
			var node = mapNodes[id];
			utils.bringToDepth(node, 0);
			
			for (key in obj.childsID) {
				node = mapNodes[key];
				utils.bringToDepth(node, 0);
			}
			return 0;
		}
		,
		'bringToDepth': function(ph)	{					// установка z-index
			var id = ph.obj.objectId;
			var myLayer = mapNodes[id];
			if(myLayer) {
				utils.bringToDepth(myLayer, ph.attr.zIndex);
			}
		}
		,
		'getVisibility': function(ph)	{					// получить видимость mapObject
			return ph.obj.isVisible;
		}
		,
		'setVisible':	function(ph)	{					// установить видимость mapObject
			var id = ph.obj.objectId;
			var myLayer = mapNodes[id];
			if(myLayer) {							// видимость слоя
				if(ph.attr) {
					if(myLayer['type'] === 'RasterLayer') {
						if(!myLayer['leaflet']) return;
						if(!myLayer['leaflet']._isVisible) {
							myLayer['leaflet']._isVisible = true, LMap.addLayer(myLayer['leaflet']);
						}
					} else if(myLayer['type'] === 'MapObject') {
						if(myLayer['geometry'] && !myLayer['leaflet']) myLayer['leaflet'] = utils.drawGeometry(myLayer['geometry']);
					}
				}
				else
				{
					if(myLayer['leaflet'] && myLayer['leaflet']._isVisible) myLayer['leaflet']._isVisible = false, LMap.removeLayer(myLayer['leaflet']);
				}
			}
		}
		,
		'getPosition': utils.getMapPosition				// получить текущее положение map
		,
		'setMinMaxZoom':	function(ph)	{		// установка minZoom maxZoom карты
			LMap.options.minZoom = ph.attr.z1;
			LMap.options.maxZoom = ph.attr.z2;
		}
		,
		'getX':	function()	{ var pos = LMap.getCenter(); return pos['lat']; }	// получить X карты
		,
		'getY':	function()	{ var pos = LMap.getCenter(); return pos['lng']; }	// получить Y карты
		,
		'getZ':	function()	{ return LMap.getZoom(); }	// получить Zoom карты
		,
		'zoomBy':	function(ph)	{				// установка Zoom карты
			var currZ = LMap.getZoom() - ph.attr.dz;
			if(currZ > LMap.getMaxZoom() || currZ < LMap.getMinZoom()) return;
			var pos = LMap.getCenter();
			if (ph.attr.useMouse && mousePos)
			{
				var k = Math.pow(2, LMap.getZoom() - currZ);
				pos.lat = mousePos.lat + k*(pos.lat - mousePos.lat);
				pos.lng = mousePos.lng + k*(pos.lng - mousePos.lng);
			}
			LMap.setView(pos, currZ);
		}
		,
		'moveTo':	function(ph)	{				//позиционирует карту по координатам центра и выбирает масштаб
			if(ph.attr['z'] > LMap.getMaxZoom() || ph.attr['z'] < LMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr['y'], ph.attr['x']);
			LMap.setView(pos, ph.attr['z']);
		}
	}

	// Передача команды в leaflet
	function leafletCMD(cmd, hash)
	{
	
		var ret = {};
		var obj = hash['obj'] || null;	// Целевой обьект команды
		var attr = hash['attr'] || '';
if(!(cmd in commands)
	&& cmd != 'setCursorVisible'
	&& cmd != 'stopDragging'
	&& cmd != 'addContextMenuItem'
	&& cmd != 'setStyle'
	&& cmd != 'setGeometry'
	&& cmd != 'setHandler'
	&& cmd != 'setBackgroundColor'
	&& cmd != 'setZoomBounds'
	&& cmd != 'setVectorTiles'
	&& cmd != 'setFilter'
	&& cmd != 'setExtent'
	&& cmd != 'setClusters'
	//&& cmd != 'setBackgroundTiles'
	) {
	// cmd"" cmd""
	var tt = 1;
}
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
		return ret;
	}

	// Добавить растровый слой
	function setBackgroundTiles(ph)	{
		var out = {};
		var layer = ph.obj;
		var id = layer.objectId;
		var node = mapNodes[id];
		if(!node) return;						// Нода не определена
		node['type'] = 'RasterLayer';
		var inpAttr = ph.attr;
		node['subType'] = (inpAttr['projectionCode'] === 1 ? 'OSM' : '');

		var attr = prpLayerAttr(layer);

gmxAPI._tools['standart'].setVisible(false);	// Пока не работает map.drawing
//gmxAPI._tools['baseLayers'].removeTool('OSM');	// OSM пока не добавляем
//if(!layer.properties) {
//return;
//}
//if(layer.properties.title != "Spot5_Volgograd") return out;
//if(layer.properties.title != "карта Украины") return out;

		var initCallback = function(obj) {			// инициализация leaflet слоя
			if(obj._container) {
				if(obj._container.id != id) obj._container.id = id;
				if(obj._container.style.position != 'absolute') obj._container.style.position = 'absolute';
				LMap.fire('moveend');
			}
		};

		var option = {
			'minZoom': inpAttr['minZoom'] || attr['minZoom'] || 1
			,'maxZoom': inpAttr['maxZoom'] || attr['maxZoom'] || 21
			,'initCallback': initCallback
		};
		var myLayer = null;
		if(node['subType'] === 'OSM') {
			var gmxNode = gmxAPI.mapNodes[id];
			option['subdomains'] = gmxNode['_subdomains'];
			var urlOSM = gmxNode['_urlOSM'];
			myLayer = new L.TileLayer.OSMTileLayer(urlOSM, option);
		} else {
			option['attr'] = attr;
			option['tileFunc'] = inpAttr['func'];
			myLayer = new L.TileLayer.ScanExCanvas(option);
		}
		node['leaflet'] = myLayer;
		myLayer._isVisible = (layer.isVisible ? true : false);
		if(myLayer._isVisible) 
			LMap.addLayer(myLayer);
		
		LMap.on('moveend', function(e) {		// Проверка zIndex слоя
			if(!myLayer._container) return;
			if(node['subType'] === 'OSM') {
				var pos = LMap.getCenter();
				var point = LMap.project(pos);
				var p1 = LMap.project(new L.LatLng(gmxAPI.from_merc_y(utils.y_ex(pos.lat)), pos.lng));
				gmxAPI.position(myLayer._container, 0, point.y - p1.y);
			}
			utils.bringToDepth(node, node['zIndex']);
		});
		
		return out;
	}

	// Подготовка атрибутов слоя
	function prpLayerAttr(layer) {
		var out = {};
		if(layer) {
			if(layer.properties) {
				var prop = layer.properties;
				out['minZoom'] = (prop.MinZoom ? prop.MinZoom : 1);
				out['maxZoom'] = (prop.MaxZoom ? prop.MaxZoom : 20);
			}
			if(layer.geometry) {
				var geom = layer.geometry;
				if(geom) {
					var type = geom.type;
					out['type'] = type;
					var arr = null;
					if(geom.coordinates) {						// Формируем MULTIPOLYGON
						if(type == 'POLYGON') {
							arr = [geom.coordinates];
						} else if(type == 'MULTIPOLYGON') {
							arr = geom.coordinates;
						}
						if(arr) {
							var	bounds = new L.Bounds();
							var pointsArr = [];
							for (var i = 0; i < arr.length; i++)
							{
								for (var j = 0; j < arr[i].length; j++)
								{
									var pArr = [];
									var pol = arr[i][j];
									for (var j1 = 0; j1 < pol.length; j1++)
									{
										var p = new L.Point( pol[j1][0], pol[j1][1] );
										pArr.push(p);
										bounds.extend(p);
									}
									pointsArr.push(pArr);
								}
							}
							out['geom'] = pointsArr;						// Массив Point границ слоя
							out['bounds'] = bounds;							// Bounds слоя
						}
					}
				}
			}
		}
		return out;
	}
	
	var leafLetCont_ = null;
	var mapDivID = '';
	var initFunc = null;
	var intervalID = 0;
	var mousePos = null;
	
	// Инициализация LeafLet карты
	function waitMe(e)
	{
		if('L' in window) {
			clearInterval(intervalID);
			LMap = new L.Map(leafLetCont_,
				{
					zoomControl: false,	
					zoomAnimation: false,	
					//fadeAnimation: false,	
					crs: L.CRS.EPSG3395
					//'crs': L.CRS.EPSG3857 // L.CRS.EPSG4326 // L.CRS.EPSG3395 L.CRS.EPSG3857
				}
			);
			gmxAPI._leafLetMap = LMap;				// Внешняя ссылка на карту

			var pos = new L.LatLng(50, 35);
			//var pos = new L.LatLng(50.499276, 35.760498);
			LMap.setView(pos, 3);
			LMap.on('moveend', function(e) { gmxAPI._updatePosition(e); });
			LMap.on('mousemove', function(e) { mousePos = e.latlng; });

			L.TileLayer.OSMTileLayer = L.TileLayer.extend(
			{
				_initContainer: function () {
					var tilePane = this._map._panes.tilePane,
						first = tilePane.firstChild;

					if (!this._container || tilePane.empty) {
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
				}
			});

			L.TileLayer.ScanExCanvas = L.TileLayer.Canvas.extend(
			{
				_initContainer: function () {
					var tilePane = this._map._panes.tilePane,
						first = tilePane.firstChild;

					if (!this._container || tilePane.empty) {
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
					if(!this._isVisible) return;								// Слой невидим
					var st = zoom + '_' + tilePoint.x + '_' + tilePoint.y;
					//if(tile._layer.__badTiles[st]) return;	// пропускаем отсутствующие тайлы

					var tileX = 256 * tilePoint.x;								// позиция тайла в stage
					var tileY = 256 * tilePoint.y;

					var p1 = new L.Point(tileX, tileY);
					var pp1 = LMap.unproject(p1, zoom);					// Перевод экранных координат тайла в latlng
					p1.x = pp1.lng; p1.y = pp1.lat;
					var	p2 = new L.Point(tileX + 256, tileY + 256);
					var pp2 = LMap.unproject(p2, zoom);
					p2.x = pp2.lng; p2.y = pp2.lat;
					var bounds = new L.Bounds(p1, p2);

					var attr = this.options.attr;
					if(attr.bounds && !bounds.intersects(attr.bounds))	{	// Тайл не пересекает границы слоя
						return;
					}
					var ctx = tile.getContext('2d');
					var imageObj = new Image();
					//imageObj.onerror = function() {			// пометить отсутствующий тайл
						//tile._layer.__badTiles[st] = true;
					//}
					
					imageObj.onload = function(){
						ctx.beginPath();
						ctx.rect(0, 0, tile.width, tile.height);
						ctx.clip();

						var geom = attr['geom'];
						if(geom) {
							for (var i = 0; i < geom.length; i++)
							{
								var pt = geom[i];
								//ctx.strokeStyle = "#000";
								//ctx.lineWidth = 2;
								ctx.beginPath();
								var pArr = L.PolyUtil.clipPolygon(pt, bounds);
								for (var j = 0; j < pArr.length; j++)
								{
									var p = new L.LatLng(pArr[j].y, pArr[j].x);
									var pp = LMap.project(p, zoom);
									var px = pp.x - tileX;
									var py = pp.y - tileY;
									if(j == 0) ctx.moveTo(px, py);
									ctx.lineTo(px, py);
								}
								pArr = null;
								//ctx.stroke();
								//ctx.closePath();
							}
						}
						
						var pattern = ctx.createPattern(imageObj, "no-repeat");
						ctx.fillStyle = pattern;
						ctx.fill();
					};
					var src = utils.getTileUrl(tile._layer, tilePoint, zoom);
					imageObj.src = src;
				}
			}
			);
			
			initFunc(mapDivID, 'leaflet');
		}
	}

	// Добавить leaflet.js в DOM
	function addLeafLetObject(apiBase, flashId, ww, hh, v, bg, loadCallback, FlagFlashLSO)
	{
		mapDivID = flashId;
		initFunc = loadCallback;

		var script = document.createElement("script");
		script.setAttribute("charset", "windows-1251");
		script.setAttribute("src", "leaflet/leaflet.js");
		document.getElementsByTagName("head").item(0).appendChild(script);
		//script.setAttribute("onLoad", onload );
		
		var css = document.createElement("link");
		css.setAttribute("type", "text/css");
		css.setAttribute("rel", "stylesheet");
		css.setAttribute("media", "screen");
		css.setAttribute("href", "leaflet/leaflet.css");
		document.getElementsByTagName("head").item(0).appendChild(css);

		leafLetCont_ = gmxAPI.newElement(
			"div",
			{
				id: mapDivID
			},
			{
				width: "100%",
				height: "100%",
				zIndex: 0,
				border: 0
			}
		);
		intervalID = setInterval(waitMe, 50);

		return leafLetCont_;
	}
	
	//расширяем namespace
    gmxAPI._cmdProxy = leafletCMD;				// посылка команд отрисовщику
    gmxAPI._addProxyObject = addLeafLetObject;	// Добавить в DOM
	gmxAPI.proxyType = 'leaflet';

})();