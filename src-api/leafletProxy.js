//Поддержка leaflet
(function()
{
	var nextId = 0;							// следующий ID mapNode
	var leafLetMap = null;					// leafLet карта
	var leafLetLayers = {					// Хэш leafLet слоев - пока растровые тайловые слои
	};

	// Команды в leaflet
	var commands = {				// Тип команды
		'addOSMTileLayer': addOSMTileLayer					// добавить OSM слой
		,
		'addScanExTileLayer': addScanExTileLayer			// добавить ScanEx тайловый слой
		,
		'addObject':	function(ph)	{					// добавить mapObject
			nextId++;
			return 'id' + nextId;
		}
		,
		'bringToTop': function(ph)	{					// установка z-index
			//var id = ph.obj.objectId;
			//var myLayer = leafLetLayers[id];
			//return ph.obj.isVisible;
		}
		,
		'bringToBottom': function(ph)	{					// установка z-index
			return ph.obj.isVisible;
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
			leafLetMap.setZoom(currZ);
		}
		,
		'moveTo':	function(ph)	{				//позиционирует карту по координатам центра и выбирает масштаб
			if(ph.attr['z'] > leafLetMap.getMaxZoom() || ph.attr['z'] < leafLetMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr['y'], ph.attr['x']);
			leafLetMap.setView(pos, ph.attr['z']);
			var tt = 1;
		}
	}

	// Передача команды в leaflet
	function leafletCMD(cmd, hash)
	{
		var ret = {};
		var obj = hash['obj'] || null;	// Целевой обьект команды
		var attr = hash['attr'] || '';
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
		return ret;
	}

	function getMapPosition() {
		var pos = leafLetMap.getCenter();
		return {
			'z': leafLetMap.getZoom()
			,'x': gmxAPI.merc_x(pos['lat'])
			,'y': gmxAPI.merc_y(pos['lng'])
		};
	}

	function addScanExTileLayer(ph)	{	// добавить ScanEx тайловый слой
		var out = {};
		var layer = ph.attr.layer;


		var id = layer.objectId;
		var isRaster = (layer.properties.type == "Raster");
		if(isRaster) {
			var url = ph.attr.prefix + "&z={z}&x={x}&y={y}";
			var minZoom = layer.properties.MinZoom;
			var maxZoom = layer.properties.MaxZoom;
			var myLayer = null;
//if(layer.properties.title != "карта Украины") return out;

			var geom = layer.geometry.coordinates[0];
			if(geom.length > 50) {
				var pointsArr = [];
				for (var i = 0; i < geom.length; i++)
				{
					var p = new L.Point( geom[i][0], geom[i][1] );
					pointsArr.push(p);
				}
				pointsArr = geom;
				myLayer = new L.TileLayer.ScanExCanvas(url, {minZoom: minZoom, maxZoom: maxZoom });
				myLayer._pointsArr = pointsArr;
			}
			else
			{
				myLayer = new L.TileLayer.ScanEx(url, {minZoom: minZoom, maxZoom: maxZoom });
			}
			myLayer._url = url;

			leafLetLayers[layer.objectId] = myLayer;
			leafLetMap.addLayer(myLayer);
			myLayer._isVisible = true;
			myLayer.bringToDepth(ph.attr.zIndex);
		}
		return out;
	}

	function addOSMTileLayer(ph)	{	// добавить OSM тайловый слой
		var out = {};
		var layer = ph.attr.layer;
		var id = layer.objectId;
		var url = ph.attr.urlOSM;
		var subdomains = ph.attr.subdomains;
		var myLayer = new L.TileLayer(url, {subdomains: subdomains});
		leafLetLayers[layer.objectId] = myLayer;
		leafLetMap.addLayer(myLayer);
		myLayer._isVisible = true;
		return out;
	}
	
	var leafLetCont_ = null;
	var mapDivID = '';
	var initFunc = null;
	var intervalID = 0;
	// 
	function waitMe(e)
	{
		if('L' in window) {
			clearInterval(intervalID);
			leafLetMap = new L.Map(leafLetCont_,
				{
					zoomControl: false,	
					crs: L.CRS.EPSG3395
					//'crs': L.CRS.EPSG3857 // L.CRS.EPSG4326 // L.CRS.EPSG3395 L.CRS.EPSG3857
				}
			);

			//var pos = new L.LatLng(55, 80);
			var pos = new L.LatLng(50.499276, 35.760498);
			leafLetMap.setView(pos, 3);
			leafLetMap.on('moveend', function(e) { gmxAPI._updatePosition(e); });

			var getTileUrl = function(obj, tilePoint, zoom) {
				var res = '';
				var urlParams = (obj._urlParams ? obj._urlParams : {});
				
				if(zoom < obj.options.minZoom || zoom > obj.options.maxZoom) return res;
				res = L.Util.template(obj._url, L.Util.extend({
					z: zoom + obj.options.zoomOffset,
					x: tilePoint.x - Math.round(Math.pow(2, zoom - 1)),
					y: -tilePoint.y - 1 + Math.round(Math.pow(2, zoom - 1))
				}, urlParams));
				return res;
			};

			var ScanEx = {
				key: null,
				bringToBottom: function(zIndex) {
					var tt = this;
					var rr = 1;
				}
				,
				bringToTop: function(zIndex) {
					var tt = this;
					var rr = 1;
				}
				,
				bringToDepth: function(zIndex) {
					if(this._container) {
					   this._container.style.zIndex = zIndex;
					   this.options.zIndex = zIndex;
					}
				}
/*
				,
				_initContainer: function () {
					//this._initContainer.apply(this);
					//this.constructor.superclass._initContainer.apply(this);
					if ('zIndex' in this.options)
						this._container.style.zIndex = this.options.zIndex;
				}
*/
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

			var ScanExCanvas = {
				bringToBottom: function(zIndex) {
					var tt = this;
					var rr = 1;
				}
				,
				bringToTop: function(zIndex) {
					var tt = this;
					var rr = 1;
				}
				,
				bringToDepth: function(zIndex) {
					if(this._container) {
					   this._container.style.zIndex = zIndex;
					   this.options.zIndex = zIndex;
					}
				}
				,
				getTileUrl: function(tilePoint, zoom) {
					var tt = 1;
					return getTileUrl(this, tilePoint, zoom);
				}
				,
				drawTile : function(tile, tilePoint, zoom) {
					var tileX = 256 * tilePoint.x;
					var tileY = 256 * tilePoint.y;

					var p1 = new L.Point(tileX, tileY);
					var pp1 = leafLetMap.unproject(p1, zoom);
					p1.x = pp1.lng; p1.y = pp1.lat;
					var	p2 = new L.Point(tileX + 256, tileY - 256);
					var pp2 = leafLetMap.unproject(p2, zoom);
					p2.x = pp2.lng; p2.y = pp2.lat;
					var	bounds = new L.Bounds(p1, p2);

					var ctx = tile.getContext('2d');
					var imageObj = new Image();
					imageObj.onload = function(){
						ctx.beginPath();
						var tileMaskPointsArr = L.PolyUtil.clipPolygon(tile._layer._pointsArr, bounds);
						for (var p = 0; p < tileMaskPointsArr.length; p++)
						{
							var t1 = new L.LatLng(tileMaskPointsArr[p][1], tileMaskPointsArr[p][0]);
							var pp = leafLetMap.project(t1, zoom);
							var px = pp.x - tileX;
							var py = pp.y - tileY;
							if(p == 0) ctx.moveTo(px, py);
							ctx.lineTo(px, py);
						}
						ctx.clip();
						var pattern = ctx.createPattern(imageObj, "repeat");
						ctx.beginPath();
						ctx.rect(0, 0, tile.width, tile.height);
						ctx.fillStyle = pattern;
						ctx.fill();
						ctx.closePath();
					};
					var src = getTileUrl(tile._layer, tilePoint, zoom);
					imageObj.src = src;
				}
			};
			L.TileLayer.ScanExCanvas = L.TileLayer.Canvas.extend(ScanExCanvas);
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
				id: mapDivID,
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