//Поддержка map
(function()
{
	var addNewMap = function(rootObjectId, layers, callback)
	{
		var map = new gmxAPI._FMO(rootObjectId, {}, null);	// MapObject основной карты
		gmxAPI.map = map;
		gmxAPI.mapNodes[rootObjectId] = map;	// основная карта

		if(!layers.properties) layers.properties = {};
		map.properties = layers.properties;
		if(!layers.children) layers.children = [];
		//map.onSetVisible = {};
		map.isVisible = true;
		map.layers = [];
		map.rasters = map;
		map.tiledQuicklooks = map;
		map.vectors = map;
		var getDefaultPos = function(prop) {
            return {
                x:	(typeof(prop.DefaultLong) === 'number' ? prop.DefaultLong :(map.needMove ? map.needMove.x : 35))
                ,y:	(typeof(prop.DefaultLat) === 'number' ? prop.DefaultLat :(map.needMove ? map.needMove.y : 50))
                ,z:	(typeof(prop.DefaultZoom) === 'number' ? prop.DefaultZoom :(map.needMove ? map.needMove.z : 4))
            };
        }
		map.needMove = getDefaultPos(layers.properties);
		map.needSetMode = null;

		// Методы присущие только Map
		map.setDistanceUnit = function(attr) { map.DistanceUnit = attr; return true; }
		map.setSquareUnit = function(attr) { map.SquareUnit = attr; return true; }
		map.getDistanceUnit = function() { return map.DistanceUnit; }
		map.getSquareUnit = function() { return map.SquareUnit; }
		map.sendPNG = function(attr) { var ret = gmxAPI._cmdProxy('sendPNG', { 'attr': attr }); return ret; }
		map.savePNG = function(fileName) { gmxAPI._cmdProxy('savePNG', { 'attr': fileName }); }
		map.trace = function(val) { gmxAPI._cmdProxy('trace', { 'attr': val }); }
		map.setQuality = function(val) { gmxAPI._cmdProxy('setQuality', { 'attr': val }); }
		map.disableCaching = function() { gmxAPI._cmdProxy('disableCaching', {}); }
		map.print = function() { gmxAPI._cmdProxy('print', {}); }
		map.repaint = function() { gmxAPI._cmdProxy('repaint', {}); }
		map.moveTo = function(x, y, z) {
			var pos = {'x':x, 'y':y, 'z':z};
			if(gmxAPI.proxyType == 'leaflet' && map.needMove) {
				if(!pos.z) pos.z =  map.needMove.z || map.getZ();
				map.needMove = pos;
			}
			else {
				//setCurrPosition(null, {'currPosition': {'x':gmxAPI.merc_x(x), 'y':gmxAPI.merc_y(y), 'z':z}});
				map.needMove = null;
				gmxAPI._cmdProxy('moveTo', { 'attr': pos });
			}
		}
		map.slideTo = function(x, y, z) { gmxAPI._cmdProxy('slideTo', { 'attr': {'x':x, 'y':y, 'z':z} }); }
		map.freeze = function() { gmxAPI._cmdProxy('freeze', {}); }
		map.unfreeze = function() { gmxAPI._cmdProxy('unfreeze', {}); }
		map.setCursor = function(url, dx, dy) { gmxAPI._cmdProxy('setCursor', { 'attr': {'url':url, 'dx':dx, 'dy':dy} }); }
		map.clearCursor = function() { gmxAPI._cmdProxy('clearCursor', {}); }
		map.zoomBy = function(dz, useMouse) {
			gmxAPI._cmdProxy('zoomBy', { 'attr': {'dz':-dz, 'useMouse':useMouse} });
			gmxAPI._listeners.dispatchEvent('zoomBy', gmxAPI.map);			// Проверка map Listeners на zoomBy
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
		map.getMinZoom = function() {
            return (gmxAPI.proxyType === 'flash' ?
                (map.zoomControl ? map.zoomControl.getMinZoom() : 17)
                :
                gmxAPI._cmdProxy('getMinZoom')
            );
        }
		map.getMaxZoom = function() {
            return (gmxAPI.proxyType === 'flash' ?
                (map.zoomControl ? map.zoomControl.getMaxZoom() : 17)
                :
                gmxAPI._cmdProxy('getMaxZoom')
            );
        }
		map.zoomToExtent = function(minx, miny, maxx, maxy)
		{
			var x = gmxAPI.from_merc_x((gmxAPI.merc_x(minx) + gmxAPI.merc_x(maxx))/2),
				y = gmxAPI.from_merc_y((gmxAPI.merc_y(miny) + gmxAPI.merc_y(maxy))/2);
			var z = map.getBestZ(minx, miny, maxx, maxy);
			var maxZ = map.getMaxZoom();
			map.moveTo(x, y, (z > maxZ ? maxZ : z));
		}
		map.slideToExtent = function(minx, miny, maxx, maxy)
		{
			var x = gmxAPI.from_merc_x((gmxAPI.merc_x(minx) + gmxAPI.merc_x(maxx))/2),
				y = gmxAPI.from_merc_y((gmxAPI.merc_y(miny) + gmxAPI.merc_y(maxy))/2);
			var z = map.getBestZ(minx, miny, maxx, maxy);
			var maxZ = map.getMaxZoom();
			map.slideTo(x, y, (z > maxZ ? maxZ : z));
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
		map.getPosition = function() { gmxAPI.currPosition = gmxAPI._cmdProxy('getPosition', { }); return gmxAPI.currPosition; }
		map.getX = function() { return (map.needMove ? map.needMove['x'] : gmxAPI._cmdProxy('getX', {})); }
		map.getY = function() { return (map.needMove ? map.needMove['y'] : gmxAPI._cmdProxy('getY', {})); }
		map.getZ = function() { return (map.needMove ? map.needMove['z'] : (gmxAPI.currPosition ? gmxAPI.currPosition.z : gmxAPI._cmdProxy('getZ', {}))); }
		map.getMouseX = function() { return gmxAPI._cmdProxy('getMouseX', {}); }
		map.getMouseY = function() { return gmxAPI._cmdProxy('getMouseY', {}); }
		map.isKeyDown = function(code) { return gmxAPI._cmdProxy('isKeyDown', {'attr':{'code':code} }); }
		map.setExtent = function(x1, x2, y1, y2) { return gmxAPI._cmdProxy('setExtent', {'attr':{'x1':x1, 'x2':x2, 'y1':y1, 'y2':y2} }); }
		map.addMapWindow = function(callback) {
			var oID = gmxAPI._cmdProxy('addMapWindow', { 'attr': {'callbackName':function(z) { return callback(z); }} });
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

		map.baseLayersManager = new gmxAPI.BaseLayersManager(map);
		map.controlsManager = new gmxAPI.ControlsManager(map, gmxAPI._div);
        var params = gmxAPI.getURLParams().params;
        map.controlsManager.setCurrent(params.gmxControls || window.gmxControls || 'controlsBase');
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
			var callback, geometry, str = null;
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

			//var searchScript = "/SearchObject/SearchVector.ashx";
			var searchScript = "/VectorLayer/Search.ashx";
			var url = "http://" + map.layers[layerNames[0]].properties.hostName + searchScript;

			var attr, func;
			if(searchScript === "/VectorLayer/Search.ashx") {
				attr = {
					'WrapStyle': 'message'
					,'page': 0
					,'pagesize': 100000
					,'geometry': true
					,'layer': layerNames.join(",")
					,'query': (str != null ? str : '')
				};
				
				func = function(searchReq) {
					var ret = [];
					if (searchReq.Status == 'ok')
					{
						var fields = searchReq.Result.fields;
						var arr = searchReq.Result.values;
						for (var i = 0, len = arr.length; i < len; i++)
						{
							var req = arr[i];
							var item = {};
							var prop = {};
							for (var j = 0, len1 = req.length; j < len1; j++)
							{
								var fname = fields[j];
								var it = req[j];
								if (fname === 'geomixergeojson') {
									item.geometry = gmxAPI.from_merc_geometry(it);
								} else {
									prop[fname] = it;
								}
							}
							item.properties = prop;
							ret.push(new gmxAPI._FlashMapFeature( 
								item.geometry,
								item.properties,
								map.layers[layerNames]
							));
						}
					}						
					callback(ret);
				};
				if (geometry) {
					attr['border'] = JSON.stringify(gmxAPI.merc_geometry(geometry));
				}
			} else if(searchScript === "/SearchObject/SearchVector.ashx") {
				func = function(searchReq) {
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
				};
				attr = {
					'WrapStyle': 'message'
					,'MapName': map.layers[layerNames[0]].properties.mapName
					,'LayerNames': layerNames.join(",")
					,'SearchString': (str != null ? encodeURIComponent(str) : '')
				};
				if (geometry) {
					attr['Border'] = JSON.stringify(gmxAPI.merc_geometry(geometry));
				}
			}
			gmxAPI.sendCrossDomainPostRequest(url, attr, func);
		}

		map.geoSearchAPIRoot = typeof window.searchAddressHost !== 'undefined' ? window.searchAddressHost : gmxAPI.getAPIHostRoot();
		map.sendSearchRequest = function(str, callback)
		{		
            var key = window.KOSMOSNIMKI_SESSION_KEY;
		    if (key==null || key == "INVALID")
			    key = false;
			sendCrossDomainJSONRequest(
				map.geoSearchAPIRoot + "SearchObject/SearchAddress.ashx?SearchString=" + escape(str) + (key ? ("&key=" + encodeURIComponent(key)) : ""),
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
		map.setMinMaxZoom = function(z1, z2) {
			if(gmxAPI.proxyType === 'flash' && gmxAPI.map.zoomControl) gmxAPI.map.zoomControl.setMinMaxZoom(z1, z2);
			return gmxAPI._cmdProxy('setMinMaxZoom', {'attr':{'z1':z1, 'z2':z2} });
		}
		map.setZoomBounds = map.setMinMaxZoom;

		map.grid = {
			setVisible: function(flag) { gmxAPI._cmdProxy('setGridVisible', { 'attr': flag }) }
			,getVisibility: function() { return gmxAPI._cmdProxy('getGridVisibility', {}) }
			,setOneDegree: function(flag) { gmxAPI._cmdProxy('setOneDegree', { 'attr': flag }) }
		};
		map.setMinMaxZoom(1, 17);

		if (gmxAPI._drawing) {
			map.drawing = gmxAPI._drawing;
		} else {
			map.drawing = {
				'setHandlers': function() { return false; }
				,'forEachObject': function() { return false; }
			};
		}

		map.addContextMenuItem = function(text, callback)
		{
			gmxAPI._cmdProxy('addContextMenuItem', { 'attr': {
				'text': text,
				'func': function(x, y)
					{
						if(gmxAPI.proxyType === 'flash') {
							x = gmxAPI.from_merc_x(x);
							y = gmxAPI.from_merc_y(y);
						}
						callback(x, y);
					}
				}
			});
		}

		if (gmxAPI._drawing) {
			map.addContextMenuItem(
				gmxAPI.KOSMOSNIMKI_LOCALIZED("Поставить маркер", "Add marker"),
				function(x, y)
				{
					map.drawing.addObject({type: "POINT", coordinates: [x, y]});
				}
			);
		}

		var haveOSM = false;

		map.addLayers = function(layers, notMoveFlag, notVisible)
		{
			if(layers.properties.name === gmxAPI.currentMapName)	{  // Это основная карта
                if(layers.properties.MinZoom) {	// установлен MinZoom карты
                    gmxAPI.mapMinZoom = layers.properties.MinZoom;
                }
                if(layers.properties.MaxZoom) {	// установлен MaxZoom карты
                    gmxAPI.mapMaxZoom = layers.properties.MaxZoom;
                    if(gmxAPI.mapMinZoom > gmxAPI.mapMaxZoom) {	// mapMinZoom не больше MaxZoom
                        gmxAPI.mapMinZoom = 1;
                    }
                }
            }
			var mapBounds = gmxAPI.getBounds();
			var minLayerZoom = 20;
			forEachLayer(layers, function(layer, isVisible) 
			{
				var visible = (layer.properties.visible ? true : isVisible);
				var lObj = map.addLayer(layer, visible, true);
				if('LayerVersion' in layer.properties && gmxAPI._layersVersion) {
					gmxAPI._layersVersion.chkVersionLayers(layers, layer);
				}
				if(visible && lObj.mercGeometry) mapBounds.update(lObj.mercGeometry.coordinates);
				var arr = layer.properties.styles || [];
				for (var i = 0; i < arr.length; i++) {
					var mm = arr[i].MinZoom;
					minLayerZoom = Math.min(minLayerZoom, mm);
				}
				if (layer.properties.type == "Raster" && layer.properties.MaxZoom > gmxAPI.maxRasterZoom)
					gmxAPI.maxRasterZoom = layer.properties.MaxZoom;
			}, notVisible);
			//if (layers.properties.UseOpenStreetMap && !haveOSM)
            var baseLayer = map.baseLayersManager.get('OSM');
			//if (!baseLayer !haveOSM)
			if (!baseLayer)
			{
				var o = map.addObject();
				//o.setVisible(false);
				o.bringToBottom();
				//o.setAsBaseLayer("OSM");
                baseLayer = map.baseLayersManager.add('OSM', {});
                    //map.baseLayersManager.add('OSM', {isVisible:false});
				baseLayer.addLayer(o);
				o.setOSMTiles();
				haveOSM = true;
				o.setVisible(false);

				if('miniMap' in map) {
					var miniOSM = map.miniMap.addObject();
					miniOSM.setVisible(false);
					miniOSM.setOSMTiles();
					miniOSM.setAsBaseLayer("OSM");
				}
			}

			if(gmxAPI.initParams && gmxAPI.initParams['center']) {			// есть переопределение центра карты
				if('x' in gmxAPI.initParams['center']) map.needMove['x'] = gmxAPI.initParams['center']['x'];
				if('y' in gmxAPI.initParams['center']) map.needMove['y'] = gmxAPI.initParams['center']['y'];
				if('z' in gmxAPI.initParams['center']) map.needMove['z'] = gmxAPI.initParams['center']['z'];
				//delete gmxAPI.initParams['center'];
			} else {
				if (typeof(layers.properties.DefaultLat) === 'number'
                    || typeof(layers.properties.DefaultLong) === 'number'
                    || typeof(layers.properties.DefaultZoom) === 'number') {
                    map.needMove = getDefaultPos(layers.properties);
					setCurrPosition(null, {'currPosition': {
						'x': gmxAPI.merc_x(map.needMove.x),
						'y': gmxAPI.merc_y(map.needMove.y),
						'z': map.needMove.z
					}});
				} else if(!notMoveFlag && mapBounds && layers.properties.name !== gmxAPI.kosmosnimki_API)
				{
					var z = map.getBestZ(gmxAPI.from_merc_x(mapBounds.minX), gmxAPI.from_merc_y(mapBounds.minY), gmxAPI.from_merc_x(mapBounds.maxX), gmxAPI.from_merc_y(mapBounds.maxY));
					if (minLayerZoom != 20)
						z = Math.max(z, minLayerZoom);
					if(z > 0)  {
						var pos = {
							'x': (mapBounds.minX + mapBounds.maxX)/2,
							'y': (mapBounds.minY + mapBounds.maxY)/2,
							'z': z
						};
						map.needMove = {
							'x': gmxAPI.from_merc_x(pos['x']),
							'y': gmxAPI.from_merc_y(pos['y']),
							'z': z
						};
						setCurrPosition(null, {'currPosition': pos});
					}
				}
			}
			if (layers.properties.ViewUrl && !window.suppressDefaultPermalink)
			{
				var result = (/permalink=([a-zA-Z0-9]+)/g).exec(layers.properties.ViewUrl);
				if (result)
				{
					var permalink = result[1];
					var callbackName = gmxAPI.uniqueGlobalName(function(obj)
					{
						if (obj.position) {
							var pos = {
								'x': obj.position.x,
								'y': obj.position.y,
								'z': 17 - obj.position.z
							};
							map.needMove = {
								'x': gmxAPI.from_merc_x(pos['x']),
								'y': gmxAPI.from_merc_y(pos['y']),
								'z': pos['z']
							};
							setCurrPosition(null, {'currPosition': pos});
						}
						if (obj.drawnObjects && gmxAPI._drawing)
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
				if(gmxAPI.proxyType === 'flash') {
					map.setExtent(
						layers.properties.MinViewX,
						layers.properties.MaxViewX,
						layers.properties.MinViewY,
						layers.properties.MaxViewY
					);
				}
			}
			if (gmxAPI.maxRasterZoom > 17 || gmxAPI.mapMinZoom || gmxAPI.mapMaxZoom) {
				map.setMinMaxZoom(gmxAPI.mapMinZoom || gmxAPI.defaultMinZoom, gmxAPI.mapMaxZoom || gmxAPI.maxRasterZoom || gmxAPI.defaultMaxZoom);
			}

			if (layers.properties.Copyright)
			{
				var obj = map.addObject();
				obj.setCopyright(layers.properties.Copyright);
			}
			if (layers.properties.MiniMapZoomDelta) {
				gmxAPI.miniMapZoomDelta = layers.properties.MiniMapZoomDelta;
			}
        }

		map.getCenter = function(mgeo)
		{
			if(!mgeo) mgeo = map.getScreenGeometry();
			return gmxAPI.geoCenter(mgeo);
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
			var currPos = gmxAPI.currPosition || map.getPosition();
			if(currPos['latlng'] && currPos['latlng']['extent']) {
				return currPos['latlng']['extent'];
			}

			var ww = 2 * gmxAPI.worldWidthMerc;
			var x = currPos['x'] + ww;
			x = x % ww;
			if(x > gmxAPI.worldWidthMerc) x -= ww;
			if(x < -gmxAPI.worldWidthMerc) x += ww;

			var y = currPos['y'];
			var scale = gmxAPI.getScale(currPos['z']);

			var w2 = scale * gmxAPI._div.clientWidth/2;
			var h2 = scale * gmxAPI._div.clientHeight/2;
			var out = {
				minX: gmxAPI.from_merc_x(x - w2),
				minY: gmxAPI.from_merc_y(y - h2),
				maxX: gmxAPI.from_merc_x(x + w2),
				maxY: gmxAPI.from_merc_y(y + h2)
			};
			return out;
		}
		var sunscreen = map.addObject();
		gmxAPI._sunscreen = sunscreen;

		var checkMapSize = function()
		{
			gmxAPI._updatePosition();
			gmxAPI._listeners.dispatchEvent('onResizeMap', map);
		};
		if(gmxAPI.proxyType === 'flash') {
			sunscreen.setStyle({ fill: { color: 0xffffff, opacity: 1 } });
			sunscreen.setRectangle(-180, -85, 180, 85);
			sunscreen.setVisible(false);
			sunscreen.addListener("onResize", function()
			{
				checkMapSize();
				//gmxAPI._updatePosition();
				//gmxAPI._listeners.dispatchEvent('onResizeMap', map);
			});
		
			if('_miniMapInit' in gmxAPI) {
				gmxAPI._miniMapInit(gmxAPI._div);
			}
			
		} else if(gmxAPI.proxyType === 'leaflet') {
			checkMapSize = function()
			{
				return gmxAPI._cmdProxy('checkMapSize');
			}
		}
		map.checkMapSize = checkMapSize;

		var setCurrPosition = function(ev, attr)
		{
			var currPos = (attr && attr.currPosition ? attr.currPosition : map.getPosition());
			
			var eventFlag = (gmxAPI.currPosition && currPos['x'] == gmxAPI.currPosition['x']
				&& currPos['y'] == gmxAPI.currPosition['y']
				&& currPos['z'] == gmxAPI.currPosition['z']
				? false : true);

			currPos['latlng'] = {
				'x': gmxAPI.from_merc_x(currPos['x']),
				'y': gmxAPI.from_merc_y(currPos['y']),
				'mouseX': gmxAPI.from_merc_x(currPos['mouseX']),
				'mouseY': gmxAPI.from_merc_y(currPos['mouseY'])
			};
			if(currPos['extent']) {
				if(currPos['extent']['minx'] != 0 || currPos['extent']['maxx'] != 0) {
					currPos['latlng']['extent'] = {
						minX: gmxAPI.from_merc_x(currPos['extent']['minX'] || currPos['extent']['minx']),
						minY: gmxAPI.from_merc_y(currPos['extent']['minY'] || currPos['extent']['miny']),
						maxX: gmxAPI.from_merc_x(currPos['extent']['maxX'] || currPos['extent']['maxx']),
						maxY: gmxAPI.from_merc_y(currPos['extent']['maxY'] || currPos['extent']['maxy'])
					};
				}
			}

			gmxAPI.currPosition = currPos;
			return eventFlag;
		}

		var updatePosition = function(ev, attr)
		{
			var eventFlag = setCurrPosition(ev, attr);
			if(eventFlag) {						// Если позиция карты изменилась - формируем событие positionChanged
				var currPos = gmxAPI.currPosition;
				var z = currPos['z'];

				/** Пользовательское событие positionChanged
				* @function callback
                * @ignore
				* @param {object} атрибуты прослушивателя
				*/
				if ('stateListeners' in map && 'positionChanged' in map.stateListeners) {
					var pattr = {
						'currZ': z,
						'currX': currPos['latlng']['x'],
						'currY': currPos['latlng']['y'],
						'div': gmxAPI._locationTitleDiv,
						'screenGeometry': map.getScreenGeometry(),
						'properties': map.properties
					};
					gmxAPI._listeners.dispatchEvent('positionChanged', map, pattr);
				}
			}
		}
		gmxAPI._updatePosition = updatePosition;

		var eventMapObject = map.addObject();
		eventMapObject.setHandler("onMove", updatePosition);
		// onMoveBegin	- перед onMove
		// onMoveEnd	- после onMove

		//updatePosition();
		setCurrPosition();

		map.setBackgroundColor = function(color)
		{
			map.backgroundColor = color;
			gmxAPI._cmdProxy('setBackgroundColor', { 'obj': map, 'attr':color });
			var isWhite = (0xff & (color >> 16)) > 80;
			var htmlColor = isWhite ? "black" : "white";
			gmxAPI._listeners.dispatchEvent('onChangeBackgroundColor', map, htmlColor);
		}
		
		map.setBackgroundColor(gmxAPI.proxyType === 'leaflet' ? 0xffffff : 0x000001);
		//map.setBackgroundColor(0x000001);
//			map.miniMap.setBackgroundColor(0xffffff);

		map.defaultHostName = (layers && layers.properties ? layers.properties.hostName : '');
		//map.addLayers(layers, false, true);
		map.addLayers(layers, false, false);
		
		if(!layers.properties.UseKosmosnimkiAPI) map.moveTo(map.needMove.x, map.needMove.y, map.needMove.z);
		
		if(!map.needSetMode && haveOSM) {			// если нигде не устанавливалась текущая подложка и есть OSM
			if(!gmxAPI._baseLayersArr || gmxAPI._baseLayersHash['OSM']) map.setMode('OSM');
		}

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
					updatePosition();
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

		if(gmxAPI.proxyType === 'leaflet') {
			gmxAPI.extendFMO('enableDragging', function(dragCallback, downCallback, upCallback)
			{
				var attr = { 'drag': dragCallback, 'dragstart':downCallback, 'dragend':upCallback };
				gmxAPI._cmdProxy('enableDragging', { 'obj': this, 'attr':attr });
			});
			gmxAPI.extendFMO('disableDragging', function()
			{
				gmxAPI._cmdProxy('disableDragging', { 'obj': this });
			});
			gmxAPI._FMO.prototype.addDragHandlers = gmxAPI._FMO.prototype.enableDragging;
			gmxAPI._FMO.prototype.removeDragHandlers = gmxAPI._FMO.prototype.disableDragging;
		} else {
            gmxAPI.extendFMO('enableDragging', function(dragCallback, downCallback, upCallback)
            {
                var object = this;
                var mouseDownHandler = function(o)
                {
                    if (downCallback) {
                        var currPosition = map.getPosition();
                        var mouseX = null;
                        var mouseY = null;
                        if(currPosition['latlng'] && 'mouseX' in currPosition['latlng']) {
                            mouseX = currPosition['latlng']['mouseX'];
                            mouseY = currPosition['latlng']['mouseY'];
                        } else {
                            mouseX = gmxAPI.from_merc_x(currPosition['mouseX']);
                            mouseY = gmxAPI.from_merc_y(currPosition['mouseY']);
                        }
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

            gmxAPI.extendFMO('disableDragging', function(dragCallback, downCallback, upCallback)
            {
                gmxAPI._FMO.prototype.removeHandler.call(map, 'onMouseMove');
                gmxAPI._FMO.prototype.removeHandler.call(map, 'onMouseUp');
                gmxAPI._FMO.prototype.removeHandler.call(map, 'onMouseDown');
            });
        }

		window.kosmosnimkiBeginZoom = function() 
		{
			if (gmxAPI._drawing && !gmxAPI._drawing.tools['move'].isActive)
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

		if(gmxAPI.proxyType === 'flash') {
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
			if (window.addEventListener) window.addEventListener('DOMMouseScroll', onWheel, false);
		}
		map.ToolsContainer = gmxAPI._ToolsContainer;
		gmxAPI._listeners.dispatchEvent('mapCreated', null, map);	// Глобальный Listeners
		// Deferred методы
        var deferred = function() {
            console.log('Deferred function: ', arguments.callee);
        }
        map.setCoordinatesAlign = deferred;	// Позиционирование масштабной шкалы (tr tl br bl)
        map.setCopyrightAlign = deferred;		// Позиционирование Copyright (tr tl br bl bc)
		map.setGeomixerLinkAlign = deferred;	// Позиционирование GeomixerLink (tr tl br bl)
        return map;
	}
	//расширяем namespace
    gmxAPI._addNewMap = addNewMap;	// Создать map обьект
})();

