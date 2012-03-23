//Поддержка leaflet
(function()
{
	var nextId = 0;							// следующий ID mapNode
	var leafLetMap = null;					// leafLet карта
	var leafLetLayers = {					// Хэш leafLet слоев - пока растровые тайловые слои
	};
	var mapNodes = {						// Хэш нод обьектов карты - аналог MapNodes.hx
	};

	// Команды в leaflet
	var commands = {				// Тип команды
		'setBackgroundTiles': setBackgroundTiles			// добавить ScanEx растровый тайловый слой
		//,
		//'addOSMTileLayer': addOSMTileLayer					// добавить OSM слой
		,
		'addObject':	function(ph)	{					// добавить mapObject
			nextId++;
			return 'id' + nextId;
		}
		,
		'bringToTop': function(ph)	{						// установка zIndex - вверх
			var id = ph.obj.objectId;
			var zIndex = getLastIndex(gmxAPI.map.layers[0].parent);

			for (key in ph.obj.childsID) {
				var myLayer = leafLetLayers[key];
				if(myLayer) {
					myLayer.bringToDepth(zIndex);
				}
			}
			return zIndex;
		}
		,
		'bringToBottom': function(ph)	{					// установка zIndex - вниз
			var id = ph.obj.objectId;
			var myLayer = leafLetLayers[id];
			if(myLayer) {
				myLayer.bringToDepth(0);
				return;
			}
			
			for (key in ph.obj.childsID) {
				myLayer = leafLetLayers[key];
				if(myLayer) {
					myLayer.bringToDepth(0);
				}
			}
			return 0;
		}
		,
		'bringToDepth': function(ph)	{					// установка z-index
			var id = ph.obj.objectId;
			var myLayer = leafLetLayers[id];
			if(myLayer) {
				myLayer.bringToDepth(ph.attr.zIndex);
			}
		}
		,
		'getVisibility': function(ph)	{					// получить видимость mapObject
			return ph.obj.isVisible;
		}
		,
		'setVisible':	function(ph)	{					// установить видимость mapObject
			var id = ph.obj.objectId;
			var myLayer = leafLetLayers[id];
			if(myLayer) {							// видимость слоя
				if(ph.attr) {
					if(!myLayer._isVisible) myLayer._isVisible = true, leafLetMap.addLayer(myLayer);
				}
				else
				{
					if(myLayer._isVisible) myLayer._isVisible = false, leafLetMap.removeLayer(myLayer);
				}
			}
		}
		,
		'getPosition': getMapPosition				// получить текущее положение map
		,
		'setMinMaxZoom':	function(ph)	{		// установка minZoom maxZoom карты
			leafLetMap.options.minZoom = ph.attr.z1;
			leafLetMap.options.maxZoom = ph.attr.z2;
		}
		,
		'getX':	function()	{ var pos = leafLetMap.getCenter(); return pos['lat']; }	// получить X карты
		,
		'getY':	function()	{ var pos = leafLetMap.getCenter(); return pos['lng']; }	// получить Y карты
		,
		'getZ':	function()	{ return leafLetMap.getZoom(); }	// получить Zoom карты
		,
		'zoomBy':	function(ph)	{				// установка Zoom карты
			var currZ = leafLetMap.getZoom() - ph.attr.dz;
			if(currZ > leafLetMap.getMaxZoom() || currZ < leafLetMap.getMinZoom()) return;
			var pos = leafLetMap.getCenter();
			if (ph.attr.useMouse && mousePos)
			{
				var k = Math.pow(2, leafLetMap.getZoom() - currZ);
				pos.lat = mousePos.lat + k*(pos.lat - mousePos.lat);
				pos.lng = mousePos.lng + k*(pos.lng - mousePos.lng);
			}
			leafLetMap.setView(pos, currZ);
		}
		,
		'moveTo':	function(ph)	{				//позиционирует карту по координатам центра и выбирает масштаб
			if(ph.attr['z'] > leafLetMap.getMaxZoom() || ph.attr['z'] < leafLetMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr['y'], ph.attr['x']);
			leafLetMap.setView(pos, ph.attr['z']);
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

	// Получить последний zIndex в контейнере слоев
	var getLastIndex = function(prnt)
	{ 
		var myIdx = prnt.layers.length;
		var n = 0;
		for (var i = 0; i < myIdx; i++)
		{
			var l = prnt.layers[i];
			if (l.objectId && (l.properties.type != "Overlay"))
				n += 1;
		}
		return n;
	}

	// Добавить OSM тайловый слой
	function addOSMTileLayer(ph)	{
		
		var out = {};
		var layer = ph.obj;
		var attr = prpLayerAttr(layer);
		var inpAttr = ph.attr;
		var id = layer.objectId;
		var url = ph.attr.urlOSM;
		var subdomains = ph.attr.subdomains;
		var option = {
			'subdomains': subdomains
			,'minZoom': inpAttr['minZoom'] || attr['minZoom'] || 1
			,'maxZoom': inpAttr['maxZoom'] || attr['maxZoom'] || 21
			,'attr': attr
			,'layer': layer
			,'index':getLastIndex(layer.parent)
		};
		
		var myLayer = new L.TileLayer.OSMTileLayer(url, option);
		leafLetLayers[layer.objectId] = myLayer;
		myLayer._isVisible = (layer.isVisible ? true : false);
		if(myLayer._isVisible) 
			leafLetMap.addLayer(myLayer);
		return out;
	}
	
	// Добавить растровый слой
	function setBackgroundTiles(ph)	{
		var out = {};
		var layer = ph.obj;
		var inpAttr = ph.attr;

if(!layer.properties) {
gmxAPI._tools['standart'].setVisible(false);	// Пока не работает map.drawing
gmxAPI._tools['baseLayers'].removeTool('OSM');	// OSM пока не добавляем
return;
}
		var id = layer.objectId;
		var attr = prpLayerAttr(layer);
//if(layer.properties.title != "Spot5_Volgograd") return out;
//if(layer.properties.title != "карта Украины") return out;

		var option = {
			'tileFunc': inpAttr['func']
			,'minZoom': inpAttr['minZoom'] || attr['minZoom'] || 1
			,'maxZoom': inpAttr['maxZoom'] || attr['maxZoom'] || 21
			,'attr': attr
			,'layer': layer
			,'index':getLastIndex(layer.parent)
		};
		var geom = attr['geom'];
		var myLayer = null;
		//if(geom) {
			myLayer = new L.TileLayer.ScanExCanvas(option);
		//}
		//else
		//{
		//	myLayer = new L.TileLayer.ScanEx(option);
		//}
		leafLetLayers[layer.objectId] = myLayer;
		myLayer.bringToDepth(ph.attr.zIndex);
		myLayer.setDOMid(layer.objectId);
		myLayer._isVisible = (layer.isVisible ? true : false);
		if(myLayer._isVisible) 
			leafLetMap.addLayer(myLayer);
		
		return out;
	}

	// Получить позицию карты
	function getMapPosition() {
		var pos = leafLetMap.getCenter();
		return {
			'z': leafLetMap.getZoom()
			,'x': gmxAPI.merc_x(pos['lat'])
			,'y': gmxAPI.merc_y(pos['lng'])
		};
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
			leafLetMap = new L.Map(leafLetCont_,
				{
					zoomControl: false,	
					//zoomAnimation: false,	
					//fadeAnimation: false,	
					crs: L.CRS.EPSG3395
					//'crs': L.CRS.EPSG3857 // L.CRS.EPSG4326 // L.CRS.EPSG3395 L.CRS.EPSG3857
				}
			);
			gmxAPI._leafLetMap = leafLetMap;				// Внешняя ссылка на карту

			//var pos = new L.LatLng(55, 80);
			var pos = new L.LatLng(50.499276, 35.760498);
			leafLetMap.setView(pos, 3);
			leafLetMap.on('moveend', function(e) {	gmxAPI._updatePosition(e); });
			leafLetMap.on('mousemove', function(e) { mousePos = e.latlng; });

			// Получение URL тайла
			var getTileUrl = function(obj, tilePoint, zoom) {
				var res = '';
				if(!('tileFunc' in obj.options)) return res;
				if(zoom < obj.options.minZoom || zoom > obj.options.maxZoom) return res;

				var urlParams = (obj._urlParams ? obj._urlParams : {});
				res = obj.options.tileFunc(
					tilePoint.x - Math.round(Math.pow(2, zoom - 1))
					,-tilePoint.y - 1 + Math.round(Math.pow(2, zoom - 1))
					,zoom + obj.options.zoomOffset
				);
				return res;
			};

			// Перемещение обьекта на глубину zIndex
			var bringToDepth = function(obj, zIndex) {
				if(obj._container) {
				   obj.options.zIndex = zIndex;
				   if(obj._container.style.zIndex != zIndex) obj._container.style.zIndex = zIndex;
				   if(obj._container.style.position != 'relative') obj._container.style.position = 'relative';
				}
			};

			// Установка ID контейнера
			var setGMXid = function(obj, id) {
				if(obj._container) {
				   if(obj._container.id != id) obj._container.id = id;
				}
			};
			
			// Проверка Node
			var chkNode = function(obj) {
				setGMXid(obj, obj.options.layer.objectId);
				bringToDepth(obj, obj.options.index);
			};
/*
			var ScanEx = {
				bringToBottom: function(zIndex) {
					var tt = this;
				}
				,
				bringToTop: function(zIndex) {
					var tt = this;
				}
				,
				bringToDepth: function(zIndex) { bringToDepth(this, zIndex); }
				,
				setDOMid: function(id) { setGMXid(this, id); }
				,
				getTileUrl: function(tilePoint, zoom) {
					return getTileUrl(this, tilePoint, zoom);
				}
				,
				drawTile : function(tile, tilePoint, zoom) {
					var tileX = 256*tilePoint.x;
					var tileY = 256*tilePoint.y;
				}
			};
			L.TileLayer.ScanEx = L.TileLayer.extend(ScanEx);
*/
			L.TileLayer.OSMTileLayer = L.TileLayer.extend(
			{
				_initContainer: function () {
					var tilePane = this._map.getPanes().tilePane,
						first = tilePane.firstChild;

					if (!this._container || tilePane.empty) {
						this._container = L.DomUtil.create('div', 'leaflet-layer');

						if (this._insertAtTheBottom && first) {
							tilePane.insertBefore(this._container, first);
						} else {
							tilePane.appendChild(this._container);
						}

						//this._setOpacity(this.options.opacity);
						chkNode(this);
					}
				},
				getTileUrl: function(tilePoint, zoom) {
					return getTileUrl(this, tilePoint, zoom);
				}
				,
				bringToDepth: function(zIndex) { bringToDepth(this, zIndex); }
				,
				setDOMid: function(id) { setGMXid(this, id); }
			});

			L.TileLayer.ScanExCanvas = L.TileLayer.Canvas.extend(
			{
				_initContainer: function () {
					var tilePane = this._map.getPanes().tilePane,
						first = tilePane.firstChild;

					if (!this._container || tilePane.empty) {
						this._container = L.DomUtil.create('div', 'leaflet-layer');

						if (this._insertAtTheBottom && first) {
							tilePane.insertBefore(this._container, first);
						} else {
							tilePane.appendChild(this._container);
						}

						//this._setOpacity(this.options.opacity);
						chkNode(this);
					}
				},
				bringToDepth: function(zIndex) { bringToDepth(this, zIndex); }
				,
				setDOMid: function(id) { setGMXid(this, id); }
				,
				drawTile: function (tile, tilePoint, zoom) {
					// override with rendering code
					if(!this._isVisible) return;								// Слой невидим
					var st = zoom + '_' + tilePoint.x + '_' + tilePoint.y;
					//if(tile._layer.__badTiles[st]) return;	// пропускаем отсутствующие тайлы

					var tileX = 256 * tilePoint.x;								// позиция тайла в stage
					var tileY = 256 * tilePoint.y;

					var p1 = new L.Point(tileX, tileY);
					var pp1 = leafLetMap.unproject(p1, zoom);					// Перевод экранных координат тайла в latlng
					p1.x = pp1.lng; p1.y = pp1.lat;
					var	p2 = new L.Point(tileX + 256, tileY + 256);
					var pp2 = leafLetMap.unproject(p2, zoom);
					p2.x = pp2.lng; p2.y = pp2.lat;
					var bounds = new L.Bounds(p1, p2);

					var attr = this.options.attr;
					if(attr.bounds && !bounds.intersects(attr.bounds))	{						// Тайл не пересекает границы слоя
						return;
					}
					var ctx = tile.getContext('2d');
					var imageObj = new Image();
					imageObj.onerror = function() {			// пометить отсутствующий тайл
						//tile._layer.__badTiles[st] = true;
					}
					
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
									var pp = leafLetMap.project(p, zoom);
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
					var src = getTileUrl(tile._layer, tilePoint, zoom);
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
    
})();