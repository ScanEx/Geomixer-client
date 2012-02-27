//Поддержка addLayer
(function()
{
	// получить minZoom maxZoom для слоя по фильтрам
	function getMinMaxZoom(prop)
	{
		var minZoom = 20, maxZoom = 0;
		for (var i = 0; i < prop.styles.length; i++)
		{
			var style = prop.styles[i];
			minZoom = Math.min(style.MinZoom, minZoom);
			maxZoom = Math.max(style.MaxZoom, maxZoom);
		}
		return {'minZoom': minZoom, 'maxZoom': maxZoom};
	}

	// Подготовка атрибутов фильтра стилей 
	function getFilterAttr(style)
	{
		// Получение стилей фильтра
		var regularStyle = {};
		if (typeof style.StyleJSON != 'undefined')
			regularStyle = style.StyleJSON;
		else if (typeof style.RenderStyle != 'undefined')
			regularStyle = style.RenderStyle;
		else
		{
			if (style.PointSize)
				regularStyle.marker = { size: parseInt(style.PointSize) };
			if (style.Icon)
			{
				var src = (style.Icon.indexOf("http://") != -1) ?
					style.Icon :
					(baseAddress + "/" + style.Icon);
				regularStyle.marker = { image: src, "center": true };
			}
			if (style.BorderColor || style.BorderWidth)
				regularStyle.outline = {
					color: gmxAPI.parseColor(style.BorderColor),
					thickness: parseInt(style.BorderWidth || "1"),
					opacity: (style.BorderWidth == "0" ? 0 : 100)
				};
			if (style.FillColor)
				regularStyle.fill = {
					color: gmxAPI.parseColor(style.FillColor),
					opacity: 100 - parseInt(style.Transparency || "0")
				};

			var label = style.label || style.Label;
			if (label)
			{
				regularStyle.label = {
					field: label.FieldName,
					color: gmxAPI.parseColor(label.FontColor),
					size: parseInt(label.FontSize || "12")
				};
			}
		}

		if (regularStyle.marker)
			regularStyle.marker.center = true;

		var hoveredStyle = JSON.parse(JSON.stringify(regularStyle));
		if (hoveredStyle.marker && hoveredStyle.marker.size)
			hoveredStyle.marker.size += 1;
		if (hoveredStyle.outline)
			hoveredStyle.outline.thickness += 1;

		// Получение sql строки фильтра
		var name = '';
		var sql = '';
		if (style.Filter)
		{
			if (/^\s*\[/.test(style.Filter))
			{
				var a = style.Filter.match(/^\s*\[([a-zA-Z0-9_]+)\]\s*([<>=]=?)\s*(.*)$/);
				if (a && (a.length == 4))
				{
					sql = a[1] + " " + a[2] + " '" + a[3] + "'";
				}
			}
			else
			{
				sql = style.Filter;
			}
			if (style.Filter.Name) name = style.Filter.Name;	// имя фильтра - для map.layers в виде хэша
		}
		var out = {
			'name': name,
			'BalloonEnable': style.BalloonEnable,
			'DisableBalloonOnClick': style.DisableBalloonOnClick,
			'DisableBalloonOnMouseMove': style.DisableBalloonOnMouseMove,
			'regularStyle': regularStyle,
			'hoveredStyle': hoveredStyle,
			'MinZoom': style.MinZoom,
			'MaxZoom': style.MaxZoom,
			'style': style,
			'sql': sql
		};
		if(style.Balloon) out['Balloon'] = style.Balloon;
		return out;
	}

	// Инициализация фильтра
	var initFilter = function(prnt, num)
	{
		var filter = prnt.filters[num];
		var obj_ = prnt.addObject();
		filter.objectId = obj_.objectId;

		var attr = filter._attr;
		filter.setFilter(attr['sql']);

		filter.getPatternIcon = function(size)
		{
			var ph = filter.getStyle(true);
			return gmxAPI.getPatternIcon(ph['regular'], size);
		}
			
		filter.setZoomBounds(attr['MinZoom'], attr['MaxZoom']);
		filter.setStyle(attr['regularStyle'], attr['hoveredStyle']);
		filter['_attr'] = attr;

		gmxAPI._listeners.dispatchEvent('initFilter', gmxAPI.map, {'filter': filter} );	// Проверка map Listeners на reSetStyles - для балунов
		prnt.filters[num] = filter;
		return filter;
	}

	// Добавление фильтра
	var addFilter = function(prnt, attr)
	{
		var filter = new gmxAPI._FMO(false, {}, prnt);	// MapObject для фильтра
		var num = prnt.filters.length;					// Номер фильтра в массиве фильтров
		var lastFilter = (num > 0 ? prnt.filters[num - 1] : null);	// Последний существующий фильтр
		if(!attr) {
			attr = gmxAPI.clone(lastFilter['_attr']);
		}
		if(!attr['MinZoom']) attr['MinZoom'] = 1;
		if(!attr['MaxZoom']) attr['MaxZoom'] = 21;

		filter['_attr'] = attr;
		prnt.filters.push(filter);
		if (attr['name'])
			prnt.filters[attr.name] = filter;
		
		gmxAPI._listeners.dispatchEvent('addFilter', prnt, {'filter': filter} );			// Listeners на слое - произошло добавление фильтра
		if(prnt.objectId) filter = initFilter(prnt, num);	// если слой виден - инициализация фильтра
		
		// Удаление фильтра
		filter.remove = function()
		{
			var ret = gmxAPI._FMO.prototype.remove.call(this);
			if(prnt.filters[attr.name]) delete prnt.filters[attr.name];
			for(var i=0; i<prnt.filters.length; i++) {
				if(this == prnt.filters[i]) {
					prnt.filters.splice(i, 1);
					break;
				}
			}
		}
		return filter;
	}

	// Добавление слоя
	var addLayer = function(parentObj, layer, isVisible)
	{
		var FlashMapObject = gmxAPI._FMO;
		if (!parentObj.layers)
			parentObj.layers = [];
		
		if (!parentObj.layersParent) {
			parentObj.layersParent = parentObj.addObject();
		}
		if (!parentObj.overlays)
		{
			parentObj.overlays = parentObj.addObject();
			parentObj.addObject = function(geom, props)
			{
				var ret = FlashMapObject.prototype.addObject.call(parentObj, geom, props);
				parentObj.overlays.bringToTop();
				return ret;
			}
			
		}
		
		var getLastIndex = function()
		{ 
			var myIdx = parentObj.layers.length;
			var n = 0;
			for (var i = 0; i < myIdx; i++)
			{
				var l = parentObj.layers[i];
				if (l.objectId && (l.properties.type != "Overlay"))
					n += 1;
			}
			return n;
		}
		
		
		if (isVisible === undefined)
			isVisible = true;
		if(!layer.properties.identityField) layer.properties.identityField = "ogc_fid";
		var isRaster = (layer.properties.type == "Raster");
		//var t = layer.properties.name || layer.properties.image;
		var layerName = layer.properties.name || layer.properties.image;
		var obj = new gmxAPI._FMO(false, {}, parentObj);					// MapObject слоя
		obj.geometry = layer.geometry;
		obj.properties = layer.properties;
//		var me = this;
		var isOverlay = false;
		var overlayLayerID = gmxAPI.getBaseMapParam("overlayLayerID","");
		if(typeof(overlayLayerID) == 'string') {
			var arr = overlayLayerID.split(",");
			for (var i = 0; i < arr.length; i++) {
				if(layerName == arr[i]) {
					isOverlay = true;
					break;
				}
			}
		}

		if (isOverlay)
			layer.properties.type = "Overlay";

		obj.filters = [];
		if (!isRaster)
		{
			// Добавление начальных фильтров
			for (var i = 0; i < layer.properties.styles.length; i++)
			{
				var style = layer.properties.styles[i];
				var attr = getFilterAttr(style);
				addFilter(obj, attr);
			}
			obj.addFilter = function(attr) { return addFilter(obj, attr); };
		}

		var baseAddress = "http://" + layer.properties.hostName + "/";
		//var sessionKey = (layer.properties.hostName.indexOf("maps.kosmosnimki.ru") != -1 || window.KOSMOSNIMKI_SESSION_KEY) ? window.KOSMOSNIMKI_SESSION_KEY : false;
		var sessionKey = isRequiredAPIKey( layer.properties.hostName ) ? window.KOSMOSNIMKI_SESSION_KEY : false;
		var sessionKey2 = window.sessionKeyCache[layer.properties.mapName];
		var isInvalid = (sessionKey == "INVALID");

		var chkCenterX = function(arr)
		{ 
			var centerX = 0;
			for (var i = 0; i < arr.length; i++)
			{
				centerX += parseFloat(arr[i][0]);
			}
			centerX /= arr.length;
			var prevCenter = centerX;
			centerX = gmxAPI.chkPointCenterX(centerX);
			var dx = prevCenter - centerX;
			for (var i = 0; i < arr.length; i++)
			{
				arr[i][0] -= dx;
			}
		}

		var bounds = false;

		if (layer.geometry) {
			if(layer.geometry.type == "POLYGON") {		// Проверка сдвига границ слоя
				var arr = layer.geometry.coordinates[0];
				chkCenterX(arr);
			}
			bounds = gmxAPI.getBounds(gmxAPI.merc_geometry(layer.geometry).coordinates);
		}
		var tileSenderPrefix = baseAddress + 
			"TileSender.ashx?ModeKey=tile" + 
			"&MapName=" + layer.properties.mapName + 
			"&LayerName=" + layerName + 
			(sessionKey ? ("&key=" + encodeURIComponent(sessionKey)) : "") +
			(sessionKey2 ? ("&MapSessionKey=" + sessionKey2) : "");

		var tileFunction = function(i, j, z)
		{ 
			if (bounds)
			{
				var tileSize = gmxAPI.getScale(z)*256;
				var minx = i*tileSize;
				var maxx = minx + tileSize;
				if (maxx < bounds.minX) {
					i += Math.pow(2, z);
				}
				else if (minx > bounds.maxX) {
					i -= Math.pow(2, z);
				}
			}

			return tileSenderPrefix + 
				"&z=" + z + 
				"&x=" + i + 
				"&y=" + j;
		}

		var isTemporal = layer.properties.Temporal;	// признак мультивременного слоя
		if(isTemporal && '_TemporalTiles' in gmxAPI) {
			obj._temporalTiles = new gmxAPI._TemporalTiles(obj);
		}

		var deferredMethodNames = [
			'getChildren', 'getItemsFromExtent', 'getTileItem', 'setTileItem',
			'getDepth', 'getZoomBounds', 'getVisibility', 'getStyle', 'getIntermediateLength',
			'getCurrentEdgeLength', 'getLength', 'getArea', 'getGeometryType', 'getStat', 'flip',
			'setZoomBounds', 'setBackgroundTiles', 'startLoadTiles', 'setVectorTiles', 'setTiles', 'setTileCaching',
			'setImageExtent', 'setImage', 'bringToTop', 'bringToDepth', 'bringToBottom',
			'setGeometry', 'setActive',  'setEditable', 'startDrawing', 'stopDrawing', 'isDrawing', 'setLabel', 'setDisplacement',
			'removeHandler', 'remove', 'clearBackgroundImage', 'addObjects', 'addObjectsFromSWF',
			'setHandler', 'setStyle', 'setBackgroundColor', 'setCopyright', 'addObserver', 'enableTiledQuicklooks', 'enableTiledQuicklooksEx'
		];
		// не используемые команды addChildRoot getFeatureGeometry getFeatureLength getFeatureArea

		var createThisLayer = function()
		{
			var pObj = (isOverlay ? parentObj.overlays : parentObj.layersParent);
			var obj_ = pObj.addObject(obj.geometry, obj.properties);
			obj.objectId = obj_.objectId;
			obj.addObject = function(geometry, props) { return FlashMapObject.prototype.addObject.call(obj, geometry, props); }
			
			gmxAPI._listeners.dispatchEvent('onLayerCreated', obj, {'obj': obj });
		
			obj.setVisible = function(flag)
			{
				FlashMapObject.prototype.setVisible.call(obj, flag);
			}

			for (var i = 0; i < deferredMethodNames.length; i++)
				delete obj[deferredMethodNames[i]];
			delete obj["getFeatures"];
			delete obj["getFeatureById"];
			if (!isRaster)
			{
				obj.setHandler = function(eventName, handler)
				{
					FlashMapObject.prototype.setHandler.call(obj, eventName, handler);
					for (var i = 0; i < obj.filters.length; i++)
						obj.filters[i].setHandler(eventName, handler);
				}
			}
			obj.addObserver = function(o, onChange)
			{
				gmxAPI._cmdProxy('observeVectorLayer', { 'obj': o, 'attr':{'layerId':obj.objectId,
					'func': function(geom, props, flag)
					{
						onChange(new gmxAPI._FlashMapFeature(gmxAPI.from_merc_geometry(geom), props, obj), flag);
					}
				} });
			}
			if (isRaster) {
				obj.setBackgroundTiles(tileFunction, 0, layer.properties['MinZoom'], layer.properties['MaxZoom']);
			} else
			{
				obj.getFeatures = function()
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
					if (!str && (obj.properties.GeometryType == "point")) {
						gmxAPI._cmdProxy('getFeatures', { 'obj': obj, 'attr':{
							'geom': gmxAPI.merc_geometry(geometry ? geometry : { type: "POLYGON", coordinates: [[-180, -89, -180, 89, 180, 89, 180, -89]] }),
							'func':  function(geoms, props)
								{
									var ret = [];
									for (var i = 0; i < geoms.length; i++)
										ret.push(new gmxAPI._FlashMapFeature(
											gmxAPI.from_merc_geometry(geoms[i]),
											props[i],
											obj
										));
									callback(ret);
								}
							}
						});
					}
					else
						map.getFeatures(str, geometry, callback, [obj.properties.name]);
				}

				obj.getFeatureById = function(fid, func)
				{
					gmxAPI._cmdProxy('getFeatureById', { 'obj': obj, 'attr':{'fid':fid,
						'func': function(geom, props)
						{
							if(typeof(props) === 'object' && props.length > 0) {
								props = gmxAPI.arrayToHash(props);
							}
							func(new gmxAPI._FlashMapFeature(
								gmxAPI.from_merc_geometry(geom),
								props,
								obj
							));
						}
					} });
				}

				if(obj._temporalTiles) {	// Для мультивременных слоёв
					obj._temporalTiles.setVectorTiles();
				} else {
					obj.setVectorTiles(tileFunction, layer.properties.identityField, layer.properties.tiles);
				}
				obj.setStyle = function(style, activeStyle)
				{
					for (var i = 0; i < obj.filters.length; i++)
						obj.filters[i].setStyle(style, activeStyle);
				}

				for (var i = 0; i < obj.filters.length; i++) {
					obj.filters[i] = initFilter(obj, i);
				}

				// Изменить атрибуты векторного обьекта из загруженных тайлов
				obj.setTileItem = function(data, flag) {
					var _obj = gmxAPI._cmdProxy('setTileItem', { 'obj': this, 'attr': {'data':data, 'flag':(flag ? true:false)} });
					return _obj;
				}
				// Получить атрибуты векторного обьекта из загруженных тайлов id по identityField
				obj.getTileItem = function(vId) {
					var _obj = gmxAPI._cmdProxy('getTileItem', { 'obj': this, 'attr': vId });
					if(_obj.geometry) _obj.geometry = gmxAPI.from_merc_geometry(_obj.geometry);
					return _obj;
				}
				obj.getStat = function() {
					var _obj = gmxAPI._cmdProxy('getStat', { 'obj': this });
					return _obj;
				}
				obj.setTiles = function(data, flag) {
					var _obj = gmxAPI._cmdProxy('setTiles', { 'obj': obj, 'attr':{'tiles':data, 'flag':(flag ? true:false)} });
					return _obj;
				}

				if (layer.properties.Quicklook)
					obj.enableQuicklooks(function(o)
					{
						return gmxAPI.applyTemplate(layer.properties.Quicklook, o.properties);
					});
				if (layer.properties.TiledQuicklook)
					obj.enableTiledQuicklooks(function(o)
					{
						return gmxAPI.applyTemplate(layer.properties.TiledQuicklook, o.properties);
					}, layer.properties.TiledQuicklookMinZoom);
			}

			for (var i = 0; i < obj.filters.length; i++)
			{
				var filter = obj.filters[i];
				delete filter["setVisible"];
				delete filter["setStyle"];
				delete filter["setFilter"];
				delete filter["enableHoverBalloon"];
				filter["setZoomBounds"] = FlashMapObject.prototype.setZoomBounds;
			}

			// Установка видимости по Zoom
			var tmp = getMinMaxZoom(layer.properties);
			obj.setZoomBounds(tmp['minZoom'], tmp['maxZoom']);

			if (layer.properties.Copyright) {
				obj.setCopyright(layer.properties.Copyright);
			}
		}

		obj.isVisible = isVisible;
		if (isVisible) {
			createThisLayer();
		}
		else
		{
			var deferred = [];
			obj.setVisible = function(flag)
			{
				if (flag)
				{
					createThisLayer();
					var n = getLastIndex();
				
					if(obj.objectId) FlashMapObject.prototype.setVisible.call(obj, flag);
					obj.bringToDepth(n);
					for (var i = 0; i < deferred.length; i++) {
						deferred[i]();
					}
					gmxAPI._listeners.dispatchEvent('onLayer', obj, obj);	// Вызов Listeners события 'onLayer' - слой теперь инициализирован во Flash
				}
			}

			if (!isRaster) {
				// Изменять атрибуты векторного обьекта при невидимом слое нельзя
				obj.setTileItem = function(data, flag) {
					return false;
				}
				// Получить атрибуты векторного обьекта при невидимом слое нельзя
				obj.getTileItem = function(vId) {
					return null;
				}
			}
			obj.addObject = function(geometry, props)
			{
				obj.setVisible(true);
				var newObj = FlashMapObject.prototype.addObject.call(obj, geometry, props);
				obj.setVisible(false);
				return newObj;
			}
			for (var i = 0; i < deferredMethodNames.length; i++) (function(name)
			{
				obj[name] = function(p1, p2, p3, p4) 
				{ 
					deferred.push(function() { obj[name].call(obj, p1, p2, p3, p4); });
				}
			})(deferredMethodNames[i]);
			if (!isRaster)
			{
				obj.getFeatures = function(arg1, arg2, arg3)
				{							
					obj.setVisible(true);
					obj.getFeatures(arg1, arg2, arg3);
					obj.setVisible(false);
				}
				obj.getFeatureById = function(arg1, arg2, arg3)
				{							
					obj.setVisible(true);
					obj.getFeatureById(arg1, arg2, arg3);
					obj.setVisible(false);
				}
				for (var i = 0; i < layer.properties.styles.length; i++) (function(i)
				{
					obj.filters[i].setZoomBounds = function(minZoom, maxZoom)
					{
						deferred.push(function() {
							obj.filters[i].setZoomBounds(minZoom, maxZoom);
							});
					}
					obj.filters[i].setVisible = function(flag)
					{
						deferred.push(function() {
							obj.filters[i].setVisible(flag);
							});
					}
					obj.filters[i].setStyle = function(style, activeStyle)
					{
						deferred.push(function() {
							obj.filters[i].setStyle(style, activeStyle);
							});
					}
					obj.filters[i].setFilter = function(sql)
					{
						deferred.push(function() { 
							obj.filters[i].setFilter(sql);
							});
						return true;
					}
					obj.filters[i].enableHoverBalloon = function(callback)
					{
						deferred.push(function() {
							obj.filters[i].enableHoverBalloon(callback);
							});
					}
				})(i);
			}
		}

//		if (isRaster && (layer.properties.MaxZoom > maxRasterZoom))
//			maxRasterZoom = layer.properties.MaxZoom;
//		var myIdx = parentObj.layers.length;
		parentObj.layers.push(obj);
		parentObj.layers[layerName] = obj;
		if (!layer.properties.title.match(/^\s*[0-9]+\s*$/))
			parentObj.layers[layer.properties.title] = obj;
		
		if(gmxAPI.proxyType === 'leaflet') {
			var zIndex = getLastIndex();
			gmxAPI._cmdProxy('addScanExTileLayer', { 'obj': parentObj, 'attr':{'layer':obj, 'prefix':tileSenderPrefix, 'zIndex':zIndex, 'isVisible':isVisible} });
		}
		
		return obj;
	}

	//расширяем FlashMapObject
	gmxAPI.extendFMO('addLayer', function(layer, isVisible) {
		addLayer(this, layer, isVisible);
	} );

})();
