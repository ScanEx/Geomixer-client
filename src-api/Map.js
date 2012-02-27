//Поддержка map
(function()
{
	var addNewMap = function(rootObjectId, layers, callback)
	{
		var map = new gmxAPI._FMO(rootObjectId, {}, null);	// MapObject основной карты
		gmxAPI.map = map;
		gmxAPI.mapNodes[rootObjectId] = map;	// основная карта

		//map.onSetVisible = {};
		map.layers = [];
		map.rasters = map;
		map.tiledQuicklooks = map;
		map.vectors = map;

		// Методы присущие только Map
		map.sendPNG = function(attr) { var ret = gmxAPI._cmdProxy('sendPNG', { 'attr': attr }); return ret; }
		map.savePNG = function(fileName) { gmxAPI._cmdProxy('savePNG', { 'attr': fileName }); }
		map.trace = function(val) { gmxAPI._cmdProxy('trace', { 'attr': val }); }
		map.setQuality = function(val) { gmxAPI._cmdProxy('setQuality', { 'attr': val }); }
		map.disableCaching = function() { gmxAPI._cmdProxy('disableCaching', {}); }
		map.print = function() { gmxAPI._cmdProxy('print', {}); }
		map.repaint = function() { gmxAPI._cmdProxy('repaint', {}); }
		map.moveTo = function(x, y, z) { gmxAPI._cmdProxy('moveTo', { 'attr': {'x':gmxAPI.merc_x(x), 'y':gmxAPI.merc_y(y), 'z':17 - z} }); }
		map.slideTo = function(x, y, z) { gmxAPI._cmdProxy('slideTo', { 'attr': {'x':gmxAPI.merc_x(x), 'y':gmxAPI.merc_y(y), 'z':17 - z} }); }
		map.freeze = function() { gmxAPI._cmdProxy('freeze', {}); }
		map.unfreeze = function() { gmxAPI._cmdProxy('unfreeze', {}); }
		map.setCursor = function(url, dx, dy) { gmxAPI._cmdProxy('setCursor', { 'attr': {'url':url, 'dx':dx, 'dy':dy} }); }
		map.clearCursor = function() { gmxAPI._cmdProxy('clearCursor', {}); }
		map.zoomBy = function(dz, useMouse) {
			gmxAPI._listeners.dispatchEvent('zoomBy', gmxAPI.map);			// Проверка map Listeners на zoomBy
			gmxAPI._cmdProxy('zoomBy', { 'attr': {'dz':-dz, 'useMouse':useMouse} });
		}
		map.getBestZ = function(minX, minY, maxX, maxY)
		{
			if ((minX == maxX) && (minY == maxY))
				return 17;
			return Math.max(0, 17 - Math.ceil(Math.log(Math.max(
				Math.abs(gmxAPI.merc_x(maxX) - gmxAPI.merc_x(minX))/gmxAPI.flashDiv.clientWidth,
				Math.abs(gmxAPI.merc_y(maxY) - gmxAPI.merc_y(minY))/gmxAPI.flashDiv.clientHeight
			))/Math.log(2)));
		}

		var gplForm = false;
		map.loadObjects = function(url, callback)
		{
			var _hostname = gmxAPI.getAPIHostRoot() + "ApiSave.ashx?get=" + encodeURIComponent(url);
			sendCrossDomainJSONRequest(_hostname, function(response)
			{
				if(typeof(response) != 'object' || response['Status'] != 'ok') {
					gmxAPI.addDebugWarnings({'_hostname': _hostname, 'url': url, 'Error': 'bad response'});
					return;
				}
				var geometries = gmxAPI.parseGML(response['Result']);
				callback(geometries);
			})
		}
		map.saveObjects = function(geometries, fileName, format)
		{
			var inputName, inputText;
			if (!gplForm)
			{
				gplForm = document.createElement('<form>'),
				inputName = document.createElement('<input>'),
				inputText = document.createElement('<input>');
			}
			else
			{
				gplForm = document.getElementById('download_gpl_form'),
				inputName = gplForm.firstChild,
				inputText = gplForm.lastChild;
			}

			gplForm.setAttribute('method', 'post');
			var _hostname = gmxAPI.getAPIHostRoot();
			gplForm.setAttribute('action', _hostname + 'ApiSave.ashx');
			gplForm.style.display = 'none';
			inputName.value = fileName;
			inputName.setAttribute('name', 'name')
			if (!format)
				format = "gml";
			inputText.value = gmxAPI.createGML(geometries, format.toLowerCase());
			inputText.setAttribute('name', 'text')

			gplForm.appendChild(inputName);
			gplForm.appendChild(inputText);

			document.body.appendChild(gplForm);

			gplForm.submit();
		}

		map.moveToCoordinates = function(text, z)
		{
			return gmxAPI.parseCoordinates(text, function(x, y)
			{
				map.moveTo(x, y, z ? z : map.getZ());
			});
		}
		map.zoomToExtent = function(minx, miny, maxx, maxy)
		{
			map.moveTo(
				gmxAPI.from_merc_x((gmxAPI.merc_x(minx) + gmxAPI.merc_x(maxx))/2),
				gmxAPI.from_merc_y((gmxAPI.merc_y(miny) + gmxAPI.merc_y(maxy))/2),
				map.getBestZ(minx, miny, maxx, maxy)
			);
		}
		map.slideToExtent = function(minx, miny, maxx, maxy)
		{
			map.slideTo(
				gmxAPI.from_merc_x((gmxAPI.merc_x(minx) + gmxAPI.merc_x(maxx))/2),
				gmxAPI.from_merc_y((gmxAPI.merc_y(miny) + gmxAPI.merc_y(maxy))/2),
				map.getBestZ(minx, miny, maxx, maxy)
			);
		}
		
		var tmp = [			// Для обратной совместимости - методы ранее были в MapObject
			'saveObjects', 'loadObjects', 'getBestZ', 'zoomBy', 'clearCursor', 'setCursor', 'unfreeze', 'freeze', 'slideTo', 'moveTo',
			'repaint', 'print', 'disableCaching', 'setQuality', 'trace', 'savePNG', 'sendPNG', 'moveToCoordinates', 'zoomToExtent', 'slideToExtent'
		];
		for (var i=0; i<tmp.length; i++) gmxAPI.extendFMO(tmp[i], map[tmp[i]]);
		
		map.stopDragging = function() {	gmxAPI._cmdProxy('stopDragging', { }); }
		map.isDragging = function() { return gmxAPI._cmdProxy('isDragging', { }); }
		map.resumeDragging = function() { gmxAPI._cmdProxy('resumeDragging', { }); }
		map.setCursorVisible = function(flag) { gmxAPI._cmdProxy('setCursorVisible', { 'attr': {'flag':flag} }); }
		map.getPosition = function() { return gmxAPI._cmdProxy('getPosition', { }); }
		map.getX = function() { return gmxAPI._cmdProxy('getX', {}); }
		map.getY = function() { return gmxAPI._cmdProxy('getY', {}); }
		map.getZ = function() { return gmxAPI._cmdProxy('getZ', {}); }
		map.getMouseX = function() { return gmxAPI._cmdProxy('getMouseX', {}); }
		map.getMouseY = function() { return gmxAPI._cmdProxy('getMouseY', {}); }
		map.isKeyDown = function(code) { return gmxAPI._cmdProxy('isKeyDown', {'attr':{'code':code} }); }
		map.setExtent = function(x1, x2, y1, y2) { return gmxAPI._cmdProxy('setExtent', {'attr':{'x1':gmxAPI.merc_x(x1), 'x2':gmxAPI.merc_x(x2), 'y1':gmxAPI.merc_y(y1), 'y2':gmxAPI.merc_y(y2)} }); }
		map.addMapWindow = function(callback) {
			var oID = gmxAPI._cmdProxy('addMapWindow', { 'attr': {'callbackName':function(z) { return 17 - callback(17 - z); }} });
			return new gmxAPI._FMO(oID, {}, null);		// MapObject миникарты
		}
		
		map.width  = function() { return gmxAPI._div.clientWidth;  }
		map.height = function() { return gmxAPI._div.clientHeight; }

		map.getItemsFromExtent = function(x1, x2, y1, y2) {
			var arr = [];
			for (var i = 0; i < map.layers.length; i++) arr.push(map.layers[i].objectId);
			return gmxAPI._cmdProxy('getItemsFromExtent', { 'obj': this, 'attr':{'layers':arr, 'extent':{'x1':gmxAPI.merc_x(x1), 'x2':gmxAPI.merc_x(x2), 'y1':gmxAPI.merc_y(y1), 'y2':gmxAPI.merc_y(y2)}} });
		}

		map.getItemsFromPosition = function() {
			var arr = [];
			for (var i = 0; i < map.layers.length; i++) arr.push(map.layers[i].objectId);
			return gmxAPI._cmdProxy('getItemsFromExtent', { 'obj': this, 'attr':{'layers':arr} });
		}
		// Использование SharedObject
		map.setFlashLSO = function(data) { return gmxAPI._cmdProxy('setFlashLSO', {'obj': this, 'attr':data }); }

		var needToStopDragging = false;
		gmxAPI.flashDiv.onmouseout = function() 
		{ 
			needToStopDragging = true;
			map.setCursorVisible(false);
		}
		gmxAPI.flashDiv.onmouseover = function()
		{
			if (needToStopDragging)
				map.stopDragging();
			map.setCursorVisible(true);
			needToStopDragging = false;
		}

		gmxAPI._listeners.dispatchEvent('mapInit', null, map);	// Глобальный Listeners

		var toolHandlers = {};
		var userHandlers = {};
		var updateMapHandler = function(eventName)
		{
			var h1 = toolHandlers[eventName];
			var h2 = userHandlers[eventName];
			gmxAPI._FMO.prototype.setHandler.call(map, eventName, h1 ? h1 : h2 ? h2 : null);
		}
		map.setHandler = function(eventName, callback)
		{
			userHandlers[eventName] = callback;
			updateMapHandler(eventName);
		}
		var setToolHandler = function(eventName, callback)
		{
			toolHandlers[eventName] = callback;
			updateMapHandler(eventName);
		}
		gmxAPI._setToolHandler = setToolHandler;

		var setToolHandlers = function(handlers)
		{
			for (var eventName in handlers)
				setToolHandler(eventName, handlers[eventName]);
		}

		map.getFeatures = function()
		{
			var callback, geometry, str;
			for (var i = 0; i < 3; i++)
			{
				var arg = arguments[i];
				if (typeof arg == 'function')
					callback = arg;
				else if (typeof arg == 'string')
					str = arg;
				else if (typeof arg == 'object')
					geometry = arg;
			}
			var layerNames = arguments[3];
			if (!layerNames)
			{
				layerNames = [];
				for (var i = 0; i < map.layers.length; i++)
				{
					var layer = map.layers[i];
					if ((layer.properties.type == 'Vector') && layer.AllowSearch)
						layerNames.push(layer.properties.name);
				}
			}
			if (layerNames.length == 0)
			{
				callback([]);
				return;
			}
			if (!geometry)
				geometry = { type: "POLYGON", coordinates: [[-180, -89, -180, 89, 180, 89, 180, -89, -180, -89]] };
			var url = "http://" + map.layers[layerNames[0]].properties.hostName + "/SearchObject/SearchVector.ashx" + 
				"?LayerNames=" + layerNames.join(",") + 
				"&MapName=" + map.layers[layerNames[0]].properties.mapName +
				(str ? ("&SearchString=" + escape(str)) : "") +
				(geometry ? ("&border=" + JSON.stringify(gmxAPI.merc_geometry(geometry))) : "");
			sendCrossDomainJSONRequest(
				url,
				function(searchReq)
				{
					var ret = [];
					if (searchReq.Status == 'ok')
					{
						for (var i = 0; i < searchReq.Result.length; i++)
						{
							var req = searchReq.Result[i];
							if (!ret[req.name])
								ret[req.name] = [];
							for (var j = 0; j < req.SearchResult.length; j++)
							{
								var item = req.SearchResult[j];
								ret.push(new gmxAPI._FlashMapFeature( 
									gmxAPI.from_merc_geometry(item.geometry),
									item.properties,
									map.layers[req.name]
								));
							}
						}
					}						
					callback(ret);
				}
			);
		}

		map.geoSearchAPIRoot = typeof window.searchAddressHost !== 'undefined' ? window.searchAddressHost : gmxAPI.getAPIHostRoot();
		map.sendSearchRequest = function(str, callback)
		{
			sendCrossDomainJSONRequest(
				map.geoSearchAPIRoot + "SearchObject/SearchAddress.ashx?SearchString=" + escape(str),
				function(res)
				{
					var ret = {};
					if (res.Status == 'ok')
					{
						for (var i = 0; i < res.Result.length; i++)
						{
							var name = res.Result[i].name;
							if (!ret[name])
								ret[name] = res.Result[i].SearchResult;
						}
					}								
					callback(ret);
				}
			);
		}

		map.grid = {
			setVisible: function(flag) { gmxAPI._cmdProxy('setGridVisible', { 'attr': flag }) },
			getVisibility: function() { return gmxAPI._cmdProxy('getGridVisibility', {}) }
		};

		var allTools = gmxAPI.newStyledDiv({ position: "absolute", top: 0, left: 0 });
		gmxAPI._div.appendChild(allTools);
		gmxAPI._allToolsDIV = allTools;

		//Begin: tools
		var toolsAll = new gmxAPI._ToolsAll(allTools);
		map.toolsAll = toolsAll;
		if('_addZoomControl' in gmxAPI) gmxAPI._addZoomControl(allTools);
		if('_timeBarInit' in gmxAPI) gmxAPI._timeBarInit(allTools);
		//if('_miniMapInit' in gmxAPI) gmxAPI._miniMapInit(div);

		var drawFunctions = gmxAPI._drawFunctions;
		map.drawing = gmxAPI._drawing
		//map.drawing.addMapStateListener = function(eventName, func) { return addMapStateListener(this, eventName, func); }
		//map.drawing.removeMapStateListener = function(eventName, id){ return removeMapStateListener(this, eventName, id); }

		map.addContextMenuItem = function(text, callback)
		{
			gmxAPI._cmdProxy('addContextMenuItem', { 'attr': {
				'text': text,
				'func': function(x, y)
					{
						callback(gmxAPI.from_merc_x(x), gmxAPI.from_merc_y(y));
					}
				}
			});
		}

		map.addContextMenuItem(
			gmxAPI.KOSMOSNIMKI_LOCALIZED("Поставить маркер", "Add marker"),
			function(x, y)
			{
				map.drawing.addObject({type: "POINT", coordinates: [x, y]});
			}
		);

		var baseLayers = {};
		var currentBaseLayerName = false;
		//расширяем FlashMapObject
		gmxAPI.extendFMO('setAsBaseLayer', function(name, attr)
		{
			if (!baseLayers[name])
				baseLayers[name] = [];
			baseLayers[name].push(this);
			if(!this.objectId) {	// Подложки должны быть в SWF
				this.setVisible(true);
				this.setVisible(false);
			}
			map.toolsAll.baseLayersTools.chkBaseLayerTool(name, attr);
		});
		
		map.getCurrentBaseLayerName = function()
		{
			return currentBaseLayerName;
		}
		map.unSetBaseLayer = function()
		{
			for (var oldName in baseLayers)
				for (var i = 0; i < baseLayers[oldName].length; i++) {
					baseLayers[oldName][i].setVisible(false);
				}
			currentBaseLayerName = '';
		}
		map.setBaseLayer = function(name)
		{
			for (var oldName in baseLayers)
				if (oldName != name)
					for (var i = 0; i < baseLayers[oldName].length; i++)
						baseLayers[oldName][i].setVisible(false);
			currentBaseLayerName = name;
			var newBaseLayers = baseLayers[currentBaseLayerName];
			if (newBaseLayers)
				for (var i = 0; i < newBaseLayers.length; i++)
					newBaseLayers[i].setVisible(true);
		}
		map.getBaseLayer = function()
		{
			return currentBaseLayerName;
		}

		map.baseLayerControl = {
			isVisible: true,
			setVisible: function(flag)
			{
				map.toolsAll.baseLayersTools.setVisible(flag);
			},
			updateVisibility: function()
			{
				map.toolsAll.baseLayersTools.updateVisibility();
			},
			repaint: function()
			{
				map.toolsAll.baseLayersTools.repaint();
			}, 

			getBaseLayerNames: function()
			{
				var res = [];
				for (var k in baseLayers) res.push(k);
				return res;
			},
			getBaseLayerLayers: function(name)
			{
				return baseLayers[name];
			}
		}

		var haveOSM = false;

		//var maxRasterZoom = 1;
		//var miniMapZoomDelta = -4;
		map.addLayers = function(layers)
		{
			var b = gmxAPI.getBounds();
			var minLayerZoom = 20;
			forEachLayer(layers, function(layer, isVisible) 
			{ 
				map.addLayer(layer, isVisible);
				b.update(layer.geometry.coordinates);
				var arr = layer.properties.styles || [];
				for (var i = 0; i < arr.length; i++) {
					var mm = arr[i].MinZoom;
					minLayerZoom = Math.min(minLayerZoom, mm);
				}
				if (layer.properties.type == "Raster" && layer.properties.MaxZoom > gmxAPI.maxRasterZoom)
					gmxAPI.maxRasterZoom = layer.properties.MaxZoom;
			});
			if (layers.properties.UseOpenStreetMap && !haveOSM)
			{
				var o = map.addObject();
				o.bringToBottom();
				o.setOSMTiles();
				o.setAsBaseLayer("OSM");
				haveOSM = true;

				if (!gmxAPI.miniMapAvailable)
				{
					if('miniMap' in map) {
						map.miniMap.setVisible(true);
						var miniOSM = map.miniMap.addObject();
						miniOSM.setOSMTiles();
						miniOSM.setAsBaseLayer("OSM");
					}
					//map.setBaseLayer("OSM");
				}
				else
				{
					if('miniMap' in map) {
						var miniOSM = map.miniMap.addObject();
						miniOSM.setOSMTiles();
						miniOSM.setAsBaseLayer("OSM");
						miniOSM.setVisible(false);
					}
					o.setVisible(false);
				}

			}
			if (layers.properties.DefaultLat && layers.properties.DefaultLong && layers.properties.DefaultZoom)
				map.moveTo(
					parseFloat(layers.properties.DefaultLong),
					parseFloat(layers.properties.DefaultLat),
					parseInt(layers.properties.DefaultZoom)
				);
			else
			{
				var z = map.getBestZ(b.minX, b.minY, b.maxX, b.maxY);
				if (minLayerZoom != 20)
					z = Math.max(z, minLayerZoom);
				map.moveTo(
					gmxAPI.from_merc_x((gmxAPI.merc_x(b.minX) + gmxAPI.merc_x(b.maxX))/2),
					gmxAPI.from_merc_y((gmxAPI.merc_y(b.minY) + gmxAPI.merc_y(b.maxY))/2),
					z
				);
			}
			if (layers.properties.ViewUrl && !window.suppressDefaultPermalink)
			{
				var result = (/permalink=([a-zA-Z0-9]+)/g).exec(layers.properties.ViewUrl);
				if (result)
				{
					var permalink = result[1];
					var callbackName = gmxAPI.uniqueGlobalName(function(obj)
					{
						if (obj.position)
							map.moveTo(gmxAPI.from_merc_x(obj.position.x), gmxAPI.from_merc_y(obj.position.y), 17 - obj.position.z);
						if (obj.drawnObjects)
							for (var i =0; i < obj.drawnObjects.length; i++)
							{
								var o = obj.drawnObjects[i];
								map.drawing.addObject(gmxAPI.from_merc_geometry(o.geometry), o.properties);
							}
					});
					var script = document.createElement("script");
					script.setAttribute("charset", "UTF-8");
					script.setAttribute("src", "http://" + layers.properties.hostName + "/TinyReference.ashx?id=" + permalink + "&CallbackName=" + callbackName + "&" + Math.random());
					document.getElementsByTagName("head").item(0).appendChild(script);
				}
			}
			if (layers.properties.MinViewX)
			{
				map.setExtent(
					layers.properties.MinViewX,
					layers.properties.MaxViewX,
					layers.properties.MinViewY,
					layers.properties.MaxViewY
				);
			}
			if (gmxAPI.maxRasterZoom > 17)
				map.setMinMaxZoom(1, gmxAPI.maxRasterZoom);
			if (layers.properties.Copyright)
			{
				var obj = map.addObject();
				obj.setCopyright(layers.properties.Copyright);
			}
			if (layers.properties.MiniMapZoomDelta)
				gmxAPI.miniMapZoomDelta = layers.properties.MiniMapZoomDelta;
			if (layers.properties.OnLoad && layers.properties.name !== kosmosnimki_API)	//  Обработка маплета карты - для базовой уже вызывали
			{
				try { eval("_kosmosnimki_temp=(" + layers.properties.OnLoad + ")")(map); }
				catch (e) {
					gmxAPI.addDebugWarnings({'func': 'addLayers', 'handler': 'OnLoad', 'event': e, 'alert': 'Error in "'+layers.properties.title+'" mapplet: ' + e});
				}
			}
		}

		map.getScreenGeometry = function()
		{
			var e = map.getVisibleExtent();
			return {
				type: "POLYGON",
				coordinates: [[[e.minX, e.minY], [e.minX, e.maxY], [e.maxX, e.maxY], [e.maxX, e.minY], [e.minX, e.minY]]]
			};
		}
		map.getVisibleExtent = function()
		{
			var ww = 2 * gmxAPI.worldWidthMerc;
			var currPosition = map.getPosition();
			var x = currPosition['x'] + ww;
			x = x % ww;
			if(x > gmxAPI.worldWidthMerc) x -= ww;
			if(x < -gmxAPI.worldWidthMerc) x += ww;

			var y = currPosition['y'];
			var scale = gmxAPI.getScale(currPosition['z']);

			var w2 = scale * gmxAPI._div.clientWidth/2;
			var h2 = scale * gmxAPI._div.clientHeight/2;
			return {
				minX: gmxAPI.from_merc_x(x - w2),
				minY: gmxAPI.from_merc_y(y - h2),
				maxX: gmxAPI.from_merc_x(x + w2),
				maxY: gmxAPI.from_merc_y(y + h2)
			};
		}

		if('_addLocationTitleDiv' in gmxAPI) gmxAPI._addLocationTitleDiv(gmxAPI._div);
		if('_addGeomixerLink' in gmxAPI) gmxAPI._addGeomixerLink(gmxAPI._div);
		if('_addCopyrightControl' in gmxAPI) gmxAPI._addCopyrightControl(gmxAPI._div);

		var sunscreen = map.addObject();
		gmxAPI._sunscreen = sunscreen;
		sunscreen.setStyle({ fill: { color: 0xffffff, opacity: 1 } });
		sunscreen.setRectangle(-180, -85, 180, 85);
		sunscreen.setVisible(false);


		if(gmxAPI.proxyType === 'flash') {
			if('_miniMapInit' in gmxAPI) {
				gmxAPI._miniMapInit(gmxAPI._div);
				sunscreen.setHandler("onResize", gmxAPI._resizeMiniMap);
			}
		}

		var updatePosition = function(ev)
		{
			var currPosition = map.getPosition();
			gmxAPI.currPosition = currPosition;

			var z = currPosition['z'];

			/** Пользовательское событие positionChanged
			* @function callback
			* @param {object} атрибуты прослушивателя
			*/
			if ('stateListeners' in map && 'positionChanged' in map.stateListeners) {
				var attr = {
					'currZ': z,
					'currX': gmxAPI.from_merc_x(currPosition['x']),
					'currY': gmxAPI.from_merc_y(currPosition['y']),
					'div': gmxAPI._locationTitleDiv,
					'screenGeometry': map.getScreenGeometry(),
					'properties': map.properties
				};
				gmxAPI._listeners.dispatchEvent('positionChanged', map, attr);
			}
		}
		gmxAPI._updatePosition = updatePosition;

		var eventMapObject = map.addObject();
		eventMapObject.setHandler("onMove", updatePosition);
		// onMoveBegin	- перед onMove
		// onMoveEnd	- после onMove

		updatePosition();

		map.setBackgroundColor = function(color)
		{
			map.backgroundColor = color;
			gmxAPI._cmdProxy('setBackgroundColor', { 'obj': map, 'attr':color });
			var isWhite = (0xff & (color >> 16)) > 80;
			var htmlColor = isWhite ? "black" : "white";
			gmxAPI._setCoordinatesColor(htmlColor, gmxAPI.getAPIFolderRoot() + "img/" + (isWhite ? "coord_reload.png" : "coord_reload_orange.png"));
			gmxAPI._setCopyrightColor(htmlColor);
		}
		
		map.setBackgroundColor(0x000001);
//			map.miniMap.setBackgroundColor(0xffffff);

		map.defaultHostName = layers.properties.hostName;
		map.addLayers(layers);

		var startDrag = function(object, dragCallback, upCallback)
		{
			map.freeze();
			sunscreen.setVisible(true);
			setToolHandlers({
				onMouseMove: function(o)
				{
					var currPosition = map.getPosition();
					var mouseX = gmxAPI.from_merc_x(currPosition['mouseX']);
					var mouseY = gmxAPI.from_merc_y(currPosition['mouseY']);
					dragCallback(mouseX, mouseY, o);
				},
				onMouseUp: function()
				{
					gmxAPI._stopDrag();
					if (upCallback)
						upCallback();
				}
			});
		}
		gmxAPI._startDrag = startDrag;

		var stopDrag = function()
		{
			setToolHandlers({ onMouseMove: null, onMouseUp: null });
			map.unfreeze();
			sunscreen.setVisible(false);
		}
		gmxAPI._stopDrag = stopDrag;

		gmxAPI.extendFMO('startDrag', function(dragCallback, upCallback)
		{
			gmxAPI._startDrag(this, dragCallback, upCallback);
		});

		gmxAPI.extendFMO('enableDragging', function(dragCallback, downCallback, upCallback)
		{
			var object = this;
			var mouseDownHandler = function(o)
			{
				if (downCallback) {
					var currPosition = map.getPosition();
					var mouseX = gmxAPI.from_merc_x(currPosition['mouseX']);
					var mouseY = gmxAPI.from_merc_y(currPosition['mouseY']);
					downCallback(mouseX, mouseY, o);
				}
				gmxAPI._startDrag(object, dragCallback, upCallback);
			}
			if (object == map) {
				setToolHandler("onMouseDown", mouseDownHandler);
			} else {
				object.setHandler("onMouseDown", mouseDownHandler);
			}
		});

		window.kosmosnimkiBeginZoom = function() 
		{
			if (activeToolName != "move")
				return false;
			gmxAPI.map.freeze();
			sunscreen.setVisible(true);
			var x1 = gmxAPI.map.getMouseX();
			var y1 = gmxAPI.map.getMouseY();
			var x2, y2;
			var rect = gmxAPI.map.addObject();
			rect.setStyle({ outline: { color: 0xa0a0a0, thickness: 1, opacity: 70 } });
			setToolHandlers({
				onMouseMove: function()
				{
					x2 = gmxAPI.map.getMouseX();
					y2 = gmxAPI.map.getMouseY();
					rect.setRectangle(x1, y1, x2, y2);
				},
				onMouseUp: function()
				{
					setToolHandlers({ onMouseMove: null, onMouseUp: null });
					gmxAPI.map.unfreeze();
					sunscreen.setVisible(false);
					var d = 10*gmxAPI.getScale(gmxAPI.map.getZ());
					if (!x1 || !x2 || !y1 || !y2 || ((Math.abs(gmxAPI.merc_x(x1) - gmxAPI.merc_x(x2)) < d) && (Math.abs(gmxAPI.merc_y(y1) - gmxAPI.merc_y(y2)) < d)))
						gmxAPI.map.zoomBy(1, true);
					else
						gmxAPI.map.zoomToExtent(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
					rect.remove();
				}
			});
			return true;
		}

		var onWheel = function(e)
		{
			if (!e)
				e = window.event;

			var inMap = false;
			var elem = gmxAPI.compatTarget(e);
			while(elem != null) 
			{
				if (elem == gmxAPI._div)
				{
							inMap = true;
							break;
				}
				elem = elem.parentNode;
			}
	
			if (!inMap)
				return;

			var delta = 0;
			if (e.wheelDelta) 
				delta = e.wheelDelta/120; 
			else if (e.detail) 
				delta = -e.detail/3;

			if (delta)
				gmxAPI.map.zoomBy(delta > 0 ? 1 : -1, true);

			if (e.preventDefault)
			{
				e.stopPropagation();
				e.preventDefault();
			}
			else 
			{
				e.returnValue = false;
				e.cancelBubble = true;
			}
		}

		var addHandler = function(div, eventName, handler)
		{
			if (div.attachEvent) 
				div.attachEvent("on" + eventName, handler); 
			if (div.addEventListener) 
				div.addEventListener(eventName, handler, false);
		}

		addHandler(window, "mousewheel", onWheel);
		addHandler(document, "mousewheel", onWheel);
		if (window.addEventListener)
			window.addEventListener('DOMMouseScroll', onWheel, false);
			
		return map;
	}
	//расширяем namespace
    gmxAPI._addNewMap = addNewMap;	// Создать map обьект
})();

