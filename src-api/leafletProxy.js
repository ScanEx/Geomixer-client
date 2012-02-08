//Поддержка leaflet
(function()
{
	var nextId = 0;							// следующий ID mapNode
	var leafLetMap = null;					// leafLet карта
	var leafLetLayers = {					// Хэш leafLet слоев - пока растровые тайловые слои
	};

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
		//if(isRaster) {
			var url = ph.attr.prefix + "&z={z}&x={x}&y={y}";
			var minZoom = layer.properties.MinZoom;
			var maxZoom = layer.properties.MaxZoom;
			var myLayer = new L.TileLayer.ScanEx(url, {minZoom: minZoom, maxZoom: maxZoom });
			leafLetLayers[layer.objectId] = myLayer;
			leafLetMap.addLayer(myLayer);
			myLayer._isVisible = true;
		//}
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
	// Передача команды в leaflet
	function leafletCMD(cmd, hash)
	{
		var ret = {};
		var obj = hash['obj'] || null;	// Целевой обьект команды
		var attr = hash['attr'] || '';

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
		}
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
		return ret;
	}
	
	var leafLetCont_ = null;
	var mapDivID = '';
	var initFunc = null;
	var intervalID = 0;
	// 
	function waitMe(e)
	{
		var test = window.L;
		if(test) {
			clearInterval(intervalID);
			leafLetMap = new L.Map(leafLetCont_,
				{
					zoomControl: false,	
					crs: L.CRS.EPSG3395
					//'crs': L.CRS.EPSG3857 // L.CRS.EPSG4326 // L.CRS.EPSG3395 L.CRS.EPSG3857
				}
			);

			var pos = new L.LatLng(55, 80);
			leafLetMap.setView(pos, 3);
			leafLetMap.on('moveend', function(e) { gmxAPI._updatePosition(e); });

			L.TileLayer.ScanEx = L.TileLayer.extend({
				key: null,
				getTileUrl: function(tilePoint, zoom) {
					var res = '';
					if(zoom < this.options.minZoom || zoom > this.options.maxZoom) return res;
					res = L.Util.template(this._url, L.Util.extend({
						z: zoom + this.options.zoomOffset,
						x: tilePoint.x - Math.round(Math.pow(2, zoom - 1)),
						y: -tilePoint.y - 1 + Math.round(Math.pow(2, zoom - 1))
					}, this._urlParams));
					return res;
				}
			});

			initFunc(mapDivID, 'leaflet');

		}
	}

	// Добавить leaflet.js в DOM
	function addLeafLetObject(apiBase, flashId, ww, hh, v, bg, loadCallback, FlagFlashLSO)
	{
		mapDivID = flashId;
		initFunc = loadCallback;
		//

		var script = null;
		if(!'jQuery' in window) {
			script = document.createElement("script");
			script.setAttribute("charset", "windows-1251");
			script.setAttribute("src", "jquery/jquery-1.5.1.min.js");
			document.getElementsByTagName("head").item(0).appendChild(script);
		}
		 
		script = document.createElement("script");
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