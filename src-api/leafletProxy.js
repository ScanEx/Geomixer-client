//Поддержка leaflet
(function()
{
	var nextId = 0;							// следующий ID mapNode
	var LMap = null;						// leafLet карта
	var imagesSize = {};					// Размеры загруженных Images
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
		'getTileBoundsMerc': function(point, zoom)	{			// определение границ тайла
			var tileSize = Math.pow(2, 8 - zoom) * 156543.033928041;
			var minx = point.x * tileSize;
			var miny = point.y * tileSize;
			var p = new L.Point(minx, miny);
			var bounds = new L.Bounds(p);
			bounds.extend(p);
			var maxx = minx + tileSize;
			var maxy = miny + tileSize;
			bounds.extend(new L.Point(maxx, maxy));
			return bounds;
		}
		,
		'getTileBoundsMerc1': function(point, zoom)	{			// определение границ тайла
			var tileSize = Math.pow(2, 8 - zoom) * 156543.033928041;
			var minx = point.x * tileSize;
			var miny = point.y * tileSize;
			var p = new L.Point(minx, miny);
			var bounds = new L.Bounds(p);
			bounds.extend(p);
			var maxx = minx + tileSize;
			var maxy = miny + tileSize;
			bounds.extend(new L.Point(maxx, maxy));
			return bounds;
		}
		,
		'getImageSize': function(pt, flag)	{				// определение размеров image
			var url = pt['iconUrl'];
			if(imagesSize[url]) {
				pt['imageWidth'] = imagesSize[url]['imageWidth'];
				pt['imageHeight'] = imagesSize[url]['imageHeight'];
				if(flag) pt['image'] = imagesSize[url]['image'];
				return;
			}
			//console.log(' getImageSize: ' + url + ' : ');
			
			var _img = L.DomUtil.create('img', 'leaflet-image-layer');
			_img.style.visibility = 'hidden';
			function getSize(ev) {
				pt['imageWidth'] = ev.target.width;
				pt['imageHeight'] = ev.target.height;
				if(flag) pt['image'] = _img;
				imagesSize[url] = pt;
				gmxAPI._listeners.dispatchEvent('onIconLoaded', null, url);		// image загружен
			}
			L.DomEvent.addListener(_img, 'load', getSize, this);
			_img.src = url;
		}
		,'getMouseX':	function()	{ return (gmxAPI._leaflet['mousePos'] ? gmxAPI._leaflet['mousePos'].lng : 0); }			// Позиция мыши X
		,'getMouseY':	function()	{ return (gmxAPI._leaflet['mousePos'] ? gmxAPI._leaflet['mousePos'].lat : 0);	}		// Позиция мыши Y
		,
		'parseStyle': function(st)	{			// перевод Style Scanex->leaflet
			var pt =  {
			};
			if(!st) return null;
			
			pt['marker'] = false;
			if('marker' in st && 'image' in st['marker']) {				//	Есть стиль marker
				pt['marker'] = true;
				var ph = st['marker'];
				if('color' in ph) pt['color'] = ph['color'];
				if('opacity' in ph) pt['opacity'] = ph['opacity'];
				if('size' in ph) pt['size'] = ph['size'];
				if('scale' in ph) pt['scale'] = ph['scale'];
				if('image' in ph) {
					pt['iconUrl'] = ph['image'];
					utils.getImageSize(pt, true);
				}
				if('center' in ph) pt['center'] = ph['center'];
				
			} else {
				pt['fill'] = false;
				if('fill' in st) {					//	Есть стиль заполнения
					pt['fill'] = true;
					var ph = st['fill'];
					if('color' in ph) pt['fillColor'] = ph['color'];
					if('opacity' in ph) pt['fillOpacity'] = ph['opacity'];
				}
				pt['stroke'] = false;
				if('outline' in st) {				//	Есть стиль контура
					pt['stroke'] = true;
					var ph = st['outline'];
					if('color' in ph) pt['color'] = ph['color'];
					if('opacity' in ph) pt['opacity'] = ph['opacity'];
					if('thickness' in ph) pt['weight'] = ph['thickness'];
					if('marker' in st && 'size' in st['marker']) pt['size'] = st['marker']['size'];
					//if('dashes' in ph) pt['opacity'] = ph['dashes'];
					
				}
			}
			if('color' in pt && typeof(pt['color']) === 'string') {
				pt['colorFunction'] = gmxAPI.Parsers.parseExpression(pt['color']);
			}
			if('fillColor' in pt && typeof(pt['fillColor']) === 'string') {
				pt['fillColorFunction'] = gmxAPI.Parsers.parseExpression(pt['fillColor']);
			}

			return pt;
		}
		,
		'parseSQL': function(sql)	{							// парсинг SQL строки
			var zn = sql;
			if(typeof(zn) === 'string') {
				zn = zn.replace(/ AND /g, ' && ');
			}
			return zn
		}
		,
		'chkPropsInString': function(str, prop, type)	{				// парсинг значений свойств в строке
			var zn = str;
			if(typeof(zn) === 'string') {
				if(zn.length === 0) return true;
				var reg = /\[([^\]]+)\]/i;
				if(type == 1) reg = /\"([^\"]+)\"/i;
				var matches = reg.exec(zn);
				while(matches && matches.length > 0) {
					zn = zn.replace(matches[0], prop[matches[1]]);
					matches = reg.exec(zn);
				}
				zn = eval(zn);
			}
			return zn
		}
		,
		'evalStyle': function(style, node)	{								// парсинг стиля
			var out = {};
			//var prop = gmxAPI.clone(node.properties || node.geometry.properties);
			var prop = node.properties || node.geometry.properties;
			//if(node.propHiden) for(var key in node.propHiden) prop['_'+key] = node.propHiden[key];
			for(var key in style) {
				var zn = style[key];
				if(key === 'fillColor' || key === 'color') {
					zn = (style['colorFunction'] ? style.colorFunction(prop) : utils.chkPropsInString(style[key], prop));
					out[key + '_rgba'] = utils.dec2rgba(zn, 1);
					zn = utils.dec2hex(zn);
					if(zn.substr(0,1) != '#') zn = '#' + zn;
				} else if(key === 'fillOpacity' || key === 'opacity') {
					zn = utils.chkPropsInString(style[key], prop);
					zn = zn / 100;
				}
				out[key] = zn;
			}
			return out;
		}
		,
		'getNodeProp': function(node, type, recursion)	{					// получить свойство ноды - рекурсивно
			if(type in node) return node[type];
			if(recursion) return (node.parentId in mapNodes ? utils.getNodeProp(mapNodes[node.parentId], type, recursion) : null);
		}
		,
		'repaintNode': function(node, recursion, type)	{					// перерисовать ноду - рекурсивно
			if(!type) type = 'regularStyle';
			var regularStyle = utils.getNodeProp(node, type, true);
			if(regularStyle) {				// Стиль определен
				if(node['type'] == 'filter') {				// отрисовка фильтра
					//utils.drawFilter(node);
					//node.leaflet = utils.drawNode(node, regularStyle);
					var pNode = mapNodes[node['parentId']];
					pNode.refreshFilter(node.id);		
				} else if(node.geometry && node.geometry.type) {
					node.geometry.id = node.id;
					if(regularStyle['iconUrl'] && !regularStyle['imageWidth']) {		// нарисовать после загрузки onIconLoaded
						function setIcon(url) {
							if(url === regularStyle['iconUrl']) {
								node.leaflet = utils.drawNode(node, regularStyle);
								var pNode = mapNodes[node['parentId']];
								var group = (pNode ? pNode.group : LMap);
								group.addLayer(node['leaflet']);
								node['leaflet']._isVisible = true;
							}
						}
						if(!imagesSize[regularStyle['iconUrl']]) gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onIconLoaded', 'func': function() { setIcon(regularStyle['iconUrl']); }});
						else setIcon(regularStyle['iconUrl']);
					} else {
						node.leaflet = utils.drawNode(node, regularStyle);
					}
				}
			}
			if(recursion) {
				for (var i = 0; i < node['children'].length; i++)
				{
					var child = mapNodes[node['children'][i]];
					utils.repaintNode(child, recursion, type);
				}
			}
		}
		,
		'drawPoint': function(node, style)	{			// отрисовка POINT геометрии - стиль маркер
			var out = null;
			var styleType = (style['iconUrl'] ? 'marker' : 'rectangle');
			var geo = node.geometry;
			var pos = geo.coordinates;
			var prop = geo.properties;
			if(styleType === 'marker') {						// стиль маркер
				var opt = {
					iconUrl: style['iconUrl']
					//,shadowUrl: null
					,iconAnchor: new L.Point(0, 0)
				};
				if(style['scale']) {
					var zn = utils.chkPropsInString(style['scale'], prop);
					opt['iconSize'] = new L.Point(style['imageWidth'] * zn, style['imageHeight'] * zn);
				}
				
				//
				var nIcon = L.Icon.extend({
					'options': opt
				});
				out = new L.Marker(new L.LatLng(pos[1], pos[0]), { icon: new nIcon() });
			} if(styleType === 'rectangle') {					// стиль rectangle
				// create an orange rectangle from a LatLngBounds
				var size = 5;
				//var bounds = new L.LatLngBounds(new L.LatLng(pos[1] + size/2, pos[0] - size/2), new L.LatLng(pos[1] - size/2, pos[0] + size/2));
				var point = new L.LatLng(pos[1], pos[0]);
				var pix = LMap.project(point);
				var p1 = LMap.unproject(new L.Point(pix['x'] - size/2, pix['y'] + size/2));
				var p2 = LMap.unproject(new L.Point(pix['x'] + size/2, pix['y'] - size/2));
				
				var bounds = new L.LatLngBounds(p1, p2);
				out = new L.RectangleMarker(bounds, {
					fillColor: "#ff7800",
					color: "#000000",
					opacity: 1,
					weight: 2
				});
				
			}
			return out;
		}
		,
		'drawPolygon': function(node, style)	{			// отрисовка Polygon геометрии

			var geojsonFeature = {
				"type": "Feature",
				"properties": node.properties,
				"geometry": node.geometry
			};
			var out = L.geoJson(geojsonFeature, {
				style: utils.evalStyle(style, node)
			});
			
/*			
			var geo = node.geometry;
			var featureparse = function(e) {
				if('setStyle' in e.layer) {
					var st = utils.evalStyle(style, node);
					e.layer.setStyle(st);
				}
			};
			out = utils.drawGeometry(geo, featureparse);
*/			return out;
		}
		,
		'drawMultiPolygon': function(node, style)	{			// отрисовка Polygon геометрии

			var geojsonFeature = {
				"type": "Feature",
				"properties": node.properties,
				"geometry": node.geometry
			};
			var out = L.geoJson(geojsonFeature, {
				style: utils.evalStyle(style, node)
			});
			return out;
		}
		,
		'drawNode': function(node, style)	{			// отрисовка геометрии node
			if(!node.geometry || !node.geometry.type) return null;
			var geo = node.geometry;
			var type = geo.type;
			var pt = {};
			//if(type === 'MULTIPOLYGON') 			pt['type'] = 'MultiPolygon';
			if(type === 'Point') 					return utils.drawPoint(node, style);
			else if(type === 'Polygon')				return utils.drawPolygon(node, style);
			else if(type === 'MultiPolygon')		{
				return utils.drawMultiPolygon(node, style);
			}
			else if(type === 'MultiPoint')			pt['type'] = 'MultiPoint';
			else if(type === 'POINT')				pt['type'] = 'Point';
			else if(type === 'MULTILINESTRING')		pt['type'] = 'MultiLineString';
			else if(type === 'LINESTRING')			pt['type'] = 'LineString';
			else if(type === 'GeometryCollection')	pt['type'] = 'GeometryCollection';
			return null;
		}
		,
		'parseGeometry': function(geo, boundsFlag)	{			// перевод геометрии Scanex->leaflet
			var pt = {};
			var type = geo.type;
			pt['coordinates'] = geo['coordinates'];
			if(boundsFlag) {
				//var bounds = new L.LatLngBounds(p1, p2);
			}
			if(type) pt['type'] = type;
			if(type === 'MULTIPOLYGON') 			pt['type'] = 'MultiPolygon';
			else if(type === 'POLYGON')				pt['type'] = 'Polygon';
			else if(type === 'MultiPoint')			pt['type'] = 'MultiPoint';
			else if(type === 'POINT')				pt['type'] = 'Point';
			else if(type === 'MULTILINESTRING')		pt['type'] = 'MultiLineString';
			else if(type === 'LINESTRING')			pt['type'] = 'LineString';
			else if(type === 'GeometryCollection')	pt['type'] = 'GeometryCollection';
			//var geojson = new L.GeoJSON();
			//geojson.addGeoJSON(pt);
			return pt;
		}
		,
		fromTileGeometry: function(geom, tileBounds)				// преобразование геометрий из тайлов
		{
			var out = null;
			if(geom) {
				if(geom['type'] === 'POINT') {
					out = gmxAPI._leaflet['PointGeometry'](geom, tileBounds);
				} else if(geom['type'] === 'POLYGON') {
					out = gmxAPI._leaflet['PolygonGeometry'](geom, tileBounds);
				} else if(geom['type'] === 'MULTIPOLYGON') {
					out = gmxAPI._leaflet['MultiPolygonGeometry'](geom, tileBounds);
				}
			}
			return out;
		}
		,
		'unionGeometry': function(bounds, geo, geo1)	{		// Обьединение 2 геометрий по границам тайла	need TODO
			if(geo.type === 'Polygon')
			{
				/*geo = {
					'type': 'MultiPolygon',
					'cnt': geo['cnt'],
					'coordinates': [geo['coordinates']],
					//'hideLines': geo['hideLines'],
					'bounds': geo['bounds']
				};*/
				var multi = gmxAPI._leaflet['MultiPolygonGeometry'](null, geo['tileBounds']);
				multi.addMember(geo);
				geo = multi;
			}
			var res = geo;
			var type = geo.type;

			if(type === 'Point') 					{}
			else if(type === 'MultiPolygon')
			{
				if(geo1.type === 'Polygon')
				{
					geo.addMember(geo1);
					/*res['coordinates'].push(geo1['coordinates']);
					//for (var i = 0; i < geo1['hideLines'].length; i++) {
					//	res['hideLines'].push(geo1['hideLines'][i] + res['cnt']);
					//}
					res['cnt'] += geo1['cnt'];
					var p = new L.Point( geo1.bounds.min.x, geo1.bounds.min.y );
					res.bounds.extend(p);
					p = new L.Point( geo1.bounds.max.x, geo1.bounds.max.y );
					res.bounds.extend(p);
					//if(geo1['hideLines']) res['hideLines'].concat(geo1['hideLines']);
					*/
				}
				else if(geo1.type === 'MultiPolygon')
				{
					geo.addMembers(geo1);
					/*
					for (var i = 0; i < geo1['coordinates'].length; i++)
					{
						res['coordinates'].push(geo1['coordinates'][i]);
					}
					//for (var i = 0; i < geo1['hideLines'].length; i++) {
					//	res['hideLines'].push(geo1['hideLines'][i] + res['cnt']);
					//}
					res['cnt'] += geo1['cnt'];
					var p = new L.Point( geo1.bounds.min.x, geo1.bounds.min.y );
					res.bounds.extend(p);
					p = new L.Point( geo1.bounds.max.x, geo1.bounds.max.y );
					res.bounds.extend(p);
					//if(geo1['hideLines']) res['hideLines'].concat(geo1['hideLines']);
					*/
				}
			}
/*			
			else if(type === 'Polygon')
			{
				var type1 = geo1.type;
				for (var i = 0; i < geo1['coordinates'].length; i++)
				{
					res['coordinates'].push(geo1['coordinates'][i]);
				}
			}
*/
			return res;
		}
		,
		'drawGeometry': function(geo, featureparse)	{			// отрисовка GeoJSON геометрии
/*			
			var geojsonFeature = {
				"type": "Feature",
				"properties": geo.properties,
				"geometry": geo.geometry
			};
			var geojson = L.geoJson(myLines, {
				//style: myStyle
			});
*/
			var geojson = new L.GeoJSON();
			if(featureparse) {
				geojson.on('featureparse', featureparse);
			}
			geojson.addGeoJSON(geo);
			return geojson;
		}
		,'getTileUrl': function(obj, tilePoint, zoom)	{			// Получение URL тайла
			var res = '';
			if(!('tileFunc' in obj.options)) return res;
			if(zoom < obj.options.minZoom || zoom > obj.options.maxZoom) return res;

			var pz = Math.round(Math.pow(2, zoom - 1));
			var pz1 = Math.pow(2, zoom);
			res = obj.options.tileFunc(
				tilePoint.x%pz1 - pz
				,-tilePoint.y - 1 + pz
				,zoom + obj.options.zoomOffset
			);
			return res;
		}
		,'getTileUrlVector': function(obj, tilePoint, zoom)	{			// Получение URL тайла
			var res = '';
			if(!('tileFunc' in obj.options)) return res;

			res = obj.options.tileFunc(
				tilePoint.x
				,tilePoint.y
				,zoom
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
			//obj['zIndex'] = zIndex;
			if(!obj['leaflet']) return;
			var lObj = obj['leaflet'];
			lObj.options.zIndex = zIndex;
			if(lObj._container && lObj._container.style.zIndex != zIndex) lObj._container.style.zIndex = zIndex;
		}
		,
		'getLastIndex': function(pNode)	{			// Получить следующий zIndex в mapNode
			var n = 1;
			if(pNode) {
				n = pNode.children.length + 1;
/*				
				if(pNode['hidenAttr'] && pNode['hidenAttr']['zIdnexSkip']) {
					//var tNode = mapNodes[pNode.parentId];
					if(pNode.parentId == mapDivID) n = pNode.children.length;
					else n = utils.getLastIndex(mapNodes[pNode.parentId]);
					//if(!tNode && pNode.parentId != mapDivID) n = pNode.children.length;
					
					//return utils.getLastIndex(tNode);
				}
*/				
			}
			return n;
		}
		,
		'getIndexLayer': function(sid)
		{ 
			var myIdx = gmxAPI.map.layers.length;
			var n = 0;
			for (var i = 0; i < myIdx; i++)
			{
				var l = gmxAPI.map.layers[i];
				//if (l.objectId && (l.properties.type != "Overlay")) {
					if (l.objectId == sid) break;
					n += 1;
				//}
			}
			return n;
		}
		,'dec2hex': function(i)	{					// convert decimal to hex
			return (i+0x1000000).toString(16).substr(-6).toUpperCase();
		}
		,'dec2rgba': function(i, a)	{				// convert decimal to rgb
			var r = (i >> 16) & 255;
			var g = (i >> 8) & 255;
			var b = i & 255;
			return 'rgba('+r+', '+g+', '+b+', '+a+')';
		}
		,'getTileBounds': function(tilePoint, zoom)	{			// получить Bounds тайла
			var tileX = 256 * tilePoint.x;						// позиция тайла в stage
			var tileY = 256 * tilePoint.y;

			var p1 = new L.Point(tileX, tileY);
			var pp1 = LMap.unproject(p1, zoom);					// Перевод экранных координат тайла в latlng
			//pp1 = new L.LatLng(pp1.lat, pp1.lng);
			p1.x = pp1.lng; p1.y = pp1.lat;
			var	p2 = new L.Point(tileX + 256, tileY + 256);
			var pp2 = LMap.unproject(p2, zoom);
			//pp2 = new L.LatLng(pp2.lat, pp2.lng);
			p2.x = pp2.lng; p2.y = pp2.lat;
			var bounds = new L.Bounds(p1, p2);
			//bounds.min.x %= 360;
			if(bounds.max.x > 180) {
				var cnt = Math.floor(bounds.max.x / 360);
				if(cnt == 0) cnt = 1;
				bounds.max.x -= cnt*360;
				bounds.min.x -= cnt*360
			}
			else if(bounds.min.x < -180) {
				var cnt = Math.floor(bounds.min.x / 360);
				if(cnt == 0) cnt = 1;
				bounds.max.x += cnt*360; bounds.min.x += cnt*360
			}
			return bounds;
		}
		,
		'getMapPosition': function()	{			// Получить позицию карты
			var pos = LMap.getCenter();
			var size = LMap.getSize();
			return {
				'z': LMap.getZoom()
				,'x': gmxAPI.merc_x(pos['lng'])
				,'y': gmxAPI.merc_y(pos['lat'])
				,'stageHeight': size['y']
			};
		}
	};
	
	// добавить mapObject
	function addObject(ph)	{
		nextId++;
		var id = 'id' + nextId;
		var pt = {
			'type': 'mapObject'
			,'handlers': {}
			,'children': []
			,'id': id
			,'parentId': ph.obj['objectId']
		};
		//if(ph.attr['hidenAttr']) pt['hidenAttr'] = ph.attr['hidenAttr'];

		var pNode = mapNodes[pt['parentId']];
		if(!pNode) {
			pNode = {'type': 'map', 'children':[], 'group':LMap};
			//mapNodes[pt['parentId']] = pNode;
		}
		pNode.children.push(id);

		pt['group'] = new L.LayerGroup();
		pNode['group'].addLayer(pt['group']);
		
		if(ph.attr) {
			var geo = {};
			if(ph.attr['geometry']) {
				geo = utils.parseGeometry(ph.attr['geometry']);
				if(ph.attr['geometry']['properties']) geo['properties'] = ph.attr['geometry']['properties'];
			}
			if(ph.attr['properties']) geo['properties'] = ph.attr['properties'];
			pt['geometry'] = geo;
			pt['propHiden'] = ph.attr['propHiden'] || {};
			
		}
		mapNodes[id] = pt;
		if(pt['geometry']['type']) {
			utils.repaintNode(pt, true);
			if(pt['leaflet']) {
				pt['leaflet']['options']['resID'] = id;
				pt['leaflet'].on('click', function(e) {		// Проверка click слоя
					var resID = e.target.options['resID'];
					var rNode = mapNodes[resID];
					var pNode = mapNodes[rNode['parentId']];
					if(pNode['handlers'] && pNode['handlers']['onClick']) {
						var prop = rNode.properties || rNode.geometry.properties;
						pNode['resIDLast'] = resID;
						pNode['handlers']['onClick'].call(this, rNode['parentId'], prop, {'onClick': true});
						//pNode['handlers']['onClick'].call(this, gmxAPI.mapNodes[rNode['parentId']]);
					}
				});
			
				if(ph['_notVisible']) {
					pt['leaflet']._isVisible = false;
				} else {
					pNode.group.addLayer(pt['leaflet']);
					pt['leaflet']._isVisible = true;
				}
			}
		}
		pt['zIndex'] = utils.getLastIndex(pNode);
		return id;
	}
	// Добавление набора статических объектов на карту
	function addObjects(parentId, attr) {
		var out = [];
		var sql = attr['sql'] || null;
		var data = attr['arr'];
		var fmt = (attr['format'] ? attr['format'] : 'LatLng');
		for (var i=0; i<data.length; i++)	// Подготовка массива обьектов
		{
			var ph = data[i];
			var prop = ph['properties'] || null;
			if(ph['geometry'] && ph['geometry']['properties']) prop = ph['geometry']['properties'];
			if(sql) {
				var flag = utils.chkPropsInString(sql, prop, 1);
				if(!flag) continue;
			}
			var tmp = {
				'obj': {
					'objectId': parentId
				}
				,
				'attr': {
					"geometry": (fmt == 'LatLng' ? ph['geometry'] : gmxAPI.from_merc_geometry(ph['geometry']))
					,
					"properties": prop
				}
			};
			var res = addObject(tmp);
			//if(ph['setStyle']) tmp['setStyle'] = ph['setStyle'];
			//if(ph['setLabel']) tmp['setLabel'] = ph['setLabel'];
		}
		return out;
	}
	// Рекурсивное изменение видимости
	function setVisible(ph) {
		var id = ph.obj.objectId || ph.obj.id;
		var node = mapNodes[id];
		var pNode = LMap;
		if(node) {							// видимость слоя
			if(ph.attr) {
				if(node['type'] === 'RasterLayer') {
					if(!node['leaflet']) return;
					if(!node['leaflet']._isVisible) {
						node['leaflet']._isVisible = true, LMap.addLayer(node['leaflet']);
						utils.bringToDepth(node, node['zIndex']);

					}
				}
/*
				else if(node['type'] === 'VectorLayer') {
					utils.repaintNode(node, true);
				}
				else if(node['type'] === 'mapObject') {
*/
				else {
					//if(node['geometry'] && !node['leaflet']) node['leaflet'] = utils.drawGeometry(node['geometry']);
					if(node['leaflet'] && !node['leaflet']._isVisible) {
						if(node['parentId']) {
							if(mapNodes[node['parentId']]) pNode = mapNodes[node['parentId']]['group'];
							pNode.addLayer(node['group']);
						}
						node['leaflet']._isVisible = true, pNode.addLayer(node['leaflet']);
					}
				}
			}
			else
			{
				if(node['leaflet'] && node['leaflet']._isVisible) {
					//if(node['type'] === 'mapObject' && node['parentId']) pNode = mapNodes[node['parentId']]['group'];
					if(node['parentId']) {
						if(mapNodes[node['parentId']]) pNode = mapNodes[node['parentId']]['group'];
						pNode.removeLayer(node['group']);
					}
					node['leaflet']._isVisible = false, pNode.removeLayer(node['leaflet']);
/*					
					for (var i = 0; i < node['children'].length; i++) {
						var pNode = mapNodes[node['children'][i]];
						if(pNode) {
							pNode['leaflet']._isVisible = false, pNode.removeLayer(pNode['leaflet']);
						}
					}
*/					
				}
			}
		}
	}

	// Рекурсивное изменение видимости
	function setVisibleRecursive(pNode, flag) {
		//var pNode = mapNodes[id];
		if(pNode['leaflet']) {
			setVisible({'obj': pNode, 'attr': flag});
		} else {
			for (var i = 0; i < pNode['children'].length; i++) {
				var key = pNode['children'][i];
				var gmxNode = mapNodes[key];
				setVisibleRecursive(gmxNode, flag);
				var node = mapNodes[key];
			}
		}
	}

	// Рекурсивное изменение видимости
	function setVisibilityFilterRecursive(pNode, sql) {
		if(pNode['leaflet'] && pNode.geometry && pNode.geometry['properties']) {
			var flag = utils.chkPropsInString(sql, pNode.geometry['properties'], 1);
			setVisible({'obj': pNode, 'attr': flag});
		} else {
			for (var i = 0; i < pNode['children'].length; i++) {
				var key = pNode['children'][i];
				var gmxNode = mapNodes[key];
				setVisibilityFilterRecursive(gmxNode, sql);
			}
		}
	}
	// Изменение видимости ноды
	function setVisibilityFilter(ph) {
		var sql = utils.parseSQL(ph.attr['sql']);
		var obj = ph['obj'];
		var id = obj['objectId'];
		var pNode = mapNodes[id];
		setVisibilityFilterRecursive(pNode, sql);
	}
 
	// Команды в leaflet
	var commands = {				// Тип команды
		'setVisibilityFilter': setVisibilityFilter			// добавить фильтр видимости
		,
		'setBackgroundTiles': setBackgroundTiles			// добавить растровый тайловый слой
		,
		'addObjects':	function(attr)	{					// Добавление набора статических объектов на карту
			var out = addObjects(attr.obj['objectId'], attr['attr']);
			return out;
		}
		,
		'addObject': addObject								// добавить mapObject
		,
		'setGeometry': function(ph)	{						// установка geometry
			var layer = ph.obj;
			var id = layer.objectId;
			var node = mapNodes[id];
			if(!node) return;						// Нода не определена
			if(ph.attr) {
				var geo = utils.parseGeometry(ph.attr);
				node['geometry'] = geo;
				if(node['geometry']['type']) {
					utils.repaintNode(node, true);
					var pNode = mapNodes[node['parentId']];
					if(pNode) {
						pNode.group.addLayer(node['leaflet']);
						node['leaflet']._isVisible = true;
					}
				}
			}
		}
		,
		'bringToTop': function(ph)	{						// установка zIndex - вверх
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			var zIndex = utils.getLastIndex(node.parent);
			node['zIndex'] = zIndex;
			utils.bringToDepth(node, zIndex);

			for (key in ph.obj.childsID) {
				var node = mapNodes[key];
				node['zIndex'] = zIndex;
				utils.bringToDepth(node, zIndex);
			}
			return zIndex;
		}
		,
		'bringToBottom': function(ph)	{					// установка zIndex - вниз
			var obj = ph.obj;
			var id = obj.objectId;
			var node = mapNodes[id];
			node['zIndex'] = 0;
			utils.bringToDepth(node, 0);
			
			for (key in obj.childsID) {
				node = mapNodes[key];
				node['zIndex'] = 0;
				utils.bringToDepth(node, 0);
			}
			return 0;
		}
		,
		'bringToDepth': function(ph)	{					// установка z-index
			var id = ph.obj.objectId;
			var zIndex = ph.attr.zIndex;
			var node = mapNodes[id];
			node['zIndex'] = zIndex;
			if(node) {
				utils.bringToDepth(node, zIndex);
			}
		}
		,
		'getVisibility': function(ph)	{					// получить видимость mapObject
			return ph.obj.isVisible;
		}
		,
		'setVisible':	setVisible				// установить видимость mapObject
		,
		'setMinMaxZoom':	function(ph)	{		// установка minZoom maxZoom карты
			LMap.options.minZoom = ph.attr.z1;
			LMap.options.maxZoom = ph.attr.z2;
		}
		,
		'zoomBy':	function(ph)	{				// установка Zoom карты
			var currZ = LMap.getZoom() - ph.attr.dz;
			if(currZ > LMap.getMaxZoom() || currZ < LMap.getMinZoom()) return;
			var pos = LMap.getCenter();
			if (ph.attr.useMouse && gmxAPI._leaflet['mousePos'])
			{
				var k = Math.pow(2, LMap.getZoom() - currZ);
				
				var lat = utils.getMouseY();
				var lng = utils.getMouseX();
				pos.lat = lat + k*(pos.lat - lat);
				pos.lng = lng + k*(pos.lng - lng);
			}
			LMap.setView(pos, currZ);
		}
		,
		'moveTo':	function(ph)	{				//позиционирует карту по координатам центра и выбирает масштаб
			if(ph.attr['z'] > LMap.getMaxZoom() || ph.attr['z'] < LMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr['y'], ph.attr['x']);
			var flag = LMap.options.zoomAnimation && ('zoomAnimation' in ph && !ph['zoomAnimation']);
			if(flag) LMap.options.zoomAnimation = false;
			LMap.setView(pos, ph.attr['z']);
			if(flag) LMap.options.zoomAnimation = true;
		}
		,
		'setStyle':	function(ph)	{				// Установка стилей обьекта
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;						// Нода не была создана через addObject
			var attr = ph.attr;
			if(attr.hoveredStyle) node.hoveredStyle = utils.parseStyle(attr.hoveredStyle);
			if(attr.regularStyle) node.regularStyle = utils.parseStyle(attr.regularStyle);
			utils.repaintNode(node, true);
		}
		,
		'setVectorTiles': setVectorTiles			// Установка векторный тайловый слой
		,
		'setFilter':	function(ph)	{			// Установка фильтра
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;						// Нода не была создана через addObject
			//var attr = ph.attr;
			node['type'] = 'filter';
			//node['subType'] = 'filter';
			//node['sql'] = utils.parseSQL(ph.attr['sql']);
			node['sql'] = ph.attr['sql'];
			node['sqlFunction'] = gmxAPI.Parsers.parseSQL(ph.attr['sql']);

			var pNode = mapNodes[node['parentId']];
			if(!pNode['filters']) pNode['filters'] = [];
			pNode['filters'].push(id);
//			utils.repaintNode(node, true);
			pNode.refreshFilter(id);		
		}
		,
		'startLoadTiles':	function(ph)	{		// Перезагрузка тайлов векторного слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !'startLoadTiles' in node) return;						// Нода не была создана через addObject
			node.startLoadTiles(ph.attr);
			node.temporal = ph.attr;
			//var attr = ph.attr; toFilters
		}
		,
		'setDateInterval':	function(ph)	{		// Установка временного интервала
			var id = ph.obj.objectId;
		}
		,
		'setHandler':	function(ph)	{			// Установка Handler
			var id = ph.obj.objectId;
			var attr = ph.attr;
			var node = mapNodes[id];
			if(!attr || !node || !'handlers' in node) return;						// Нода не была создана через addObject
			node['handlers'][attr.eventName] = attr.callbackName;
var id = ph.obj.objectId;
		}
		,
		'getGeometry':	function(ph)	{		// Установка временного интервала
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !'resIDLast' in node) return null;						// Нода не была создана через addObject
			var rnode = mapNodes[node['resIDLast']];

			var geo = gmxAPI.clone(rnode.geometry);
			var type = geo.type;
			if(type === 'MultiPolygon') 			geo['type'] = 'MULTIPOLYGON';
			else if(type === 'Polygon')				geo['type'] = 'POLYGON';
			else if(type === 'MultiPoint')			geo['type'] = 'MultiPoint';
			else if(type === 'Point')				geo['type'] = 'POINT';
			else if(type === 'MultiLineString')		geo['type'] = 'MULTILINESTRING';
			else if(type === 'LineString')			geo['type'] = 'LINESTRING';
			else if(type === 'GeometryCollection')	geo['type'] = 'GeometryCollection';
			return geo;
		}
		,
		'getPosition': utils.getMapPosition											// получить текущее положение map
		,'getX':	function()	{ var pos = LMap.getCenter(); return pos['lat']; }	// получить X карты
		,'getY':	function()	{ var pos = LMap.getCenter(); return pos['lng']; }	// получить Y карты
		,'getZ':	function()	{ return LMap.getZoom(); }							// получить Zoom карты
		,'getMouseX':	function()	{ return utils.getMouseX(); }			// Позиция мыши X
		,'getMouseY':	function()	{ return utils.getMouseY();	}		// Позиция мыши Y
	}

	// Передача команды в leaflet
	function leafletCMD(cmd, hash)
	{
		if(!LMap) LMap = gmxAPI._leaflet['LMap'];				// Внешняя ссылка на карту
		
		var ret = {};
		var obj = hash['obj'] || null;	// Целевой обьект команды
		var attr = hash['attr'] || '';
/*		
if(!(cmd in commands)
	&& cmd != 'setCursorVisible'
	&& cmd != 'stopDragging'
	&& cmd != 'addContextMenuItem'
	//&& cmd != 'setStyle'
	&& cmd != 'setGeometry'
	//&& cmd != 'setHandler'
	&& cmd != 'setBackgroundColor'
	&& cmd != 'setZoomBounds'
	//&& cmd != 'setVectorTiles'
	//&& cmd != 'setFilter'
	&& cmd != 'setExtent'
	&& cmd != 'setClusters'
	//&& cmd != 'setBackgroundTiles'
	) {
	// cmd"" cmd"" getVisibility	setDateInterval		
	var tt = 1;
}
*/
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
//console.log(cmd + ' : ' + hash + ' : ' + ret);
		return ret;
	}

	// 
	function getTilesBounds(dataTiles)	{
		var hash = {};
		for (var i = 0; i < dataTiles.length; i+=3)
		{
			var st = dataTiles[i+2] + '_' + dataTiles[i] + '_' + dataTiles[i+1];
			var pz = Math.round(Math.pow(2, dataTiles[i+2] - 1));
			var bounds = utils.getTileBounds({'x':dataTiles[i] + pz, 'y':pz - 1 - dataTiles[i+1]}, dataTiles[i+2]);
			bounds.min.x = gmxAPI.merc_x(bounds.min.x);
			bounds.max.x = gmxAPI.merc_x(bounds.max.x);
			bounds.min.y = gmxAPI.merc_y(bounds.min.y);
			bounds.max.y = gmxAPI.merc_y(bounds.max.y);
			var d = (bounds.max.x - bounds.min.x)/10000;
			bounds.min.x += d;
			bounds.max.x -= d;
			bounds.min.y += d;
			bounds.max.y -= d;
			//var bounds = utils.getTileBoundsMerc({'x':dataTiles[i], 'y':dataTiles[i+1]}, dataTiles[i+2]);
			hash[st] = bounds;
		}
		return hash;
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
		node['zIndex'] = utils.getIndexLayer(id);

		var attr = prpLayerAttr(layer, node);

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
				node['zIndex'] = utils.getIndexLayer(id);
				utils.bringToDepth(node, node['zIndex']);
				
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
		
//utils.bringToDepth(node, node['zIndex']);
		LMap.on('moveend', function(e) {		// Проверка zIndex слоя
			if(!myLayer._container) return;
			if(node['subType'] === 'OSM') {
				var pos = LMap.getCenter();
				var point = LMap.project(pos);
				var p1 = LMap.project(new L.LatLng(gmxAPI.from_merc_y(utils.y_ex(pos.lat)), pos.lng));
				gmxAPI.position(myLayer._container, 0, point.y - p1.y);
			}
			//utils.bringToDepth(node, node['zIndex']);
		});
		
		return out;
	}

	// Подготовка атрибутов слоя
	function prpLayerAttr(layer, node) {
		var out = {};
		if(layer) {
			if(layer.properties) {
				var prop = layer.properties;
				if(node['type'] == 'RasterLayer') {			// растровый слой
					out['minZoom'] = (prop.MinZoom ? prop.MinZoom : 1);
					out['maxZoom'] = (prop.MaxZoom ? prop.MaxZoom : 20);
				}
				else if(node['type'] == 'VectorLayer') {	// векторный слой
					out['identityField'] = (prop.identityField ? prop.identityField : 'ogc_fid');
					out['typeGeo'] = (prop.GeometryType ? prop.GeometryType : 'Polygon');
					out['TemporalColumnName'] = (prop.TemporalColumnName ? prop.TemporalColumnName : '');
					out['minZoom'] = 22;
					out['maxZoom'] = 1;
					for (var i = 0; i < prop.styles.length; i++)
					{
						var style = prop.styles[i];
						out['minZoom'] = Math.min(out['minZoom'], style['MinZoom']);
						out['maxZoom'] = Math.max(out['maxZoom'], style['MaxZoom']);
					}
				}
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


	// Добавить векторный слой
	function setVectorTiles(ph)	{
		var out = {};
		var layer = ph.obj;
		var id = layer.objectId;
		var node = mapNodes[id];
		if(!node) return;						// Нода не определена
		node['type'] = 'VectorLayer';
		node['needParse'] = [];
		node['parseTimer'] = 0;
		node['filters'] = [];
		node['dataTiles'] = {};
		node['tilesLoaded'] = {};
		node['tilesLoadProgress'] = {};
		node['loaderFlag'] = false;
		node['badTiles'] = {};
		node['tilesGeometry'] = {};				// Геометрии загруженных тайлов по z_x_y
		node['objectsData'] = {};				// Обьекты из тайлов по identityField
		node['deletedObjects'] = {};
		node['editedObjects'] = {};
		node['mousePos'] = {};					// позиция мыши в тайле
//		node['tilesDrawing'] = {};				// список отрисованных тайлов в текущем Frame
		node['zIndex'] = utils.getIndexLayer(id);
		
		var inpAttr = ph.attr;
		node['subType'] = (inpAttr['filesHash'] ? 'Temporal' : '');

		var initCallback = function(obj) {			// инициализация leaflet слоя
			if(obj._container) {
				if(obj._container.id != id) obj._container.id = id;
				if(obj._container.style.position != 'absolute') obj._container.style.position = 'absolute';
				//obj._container.style.cursor = 'pointer';
				obj._container.onmousemove = function(event) {			// позиция мыши в тайле
					var ev = gmxAPI.compatEvent(event);
					node['mousePos']['tile'] = ev.originalTarget.id;
					node['mousePos']['x'] = ev.pageX;
					node['mousePos']['y'] = ev.pageY;
				};
//canvas {cursor: default;}
//canvas.dragging {cursor: crosshair;}
				utils.bringToDepth(node, node['zIndex']);
				
				LMap.fire('moveend');
			}
		};

		var attr = prpLayerAttr(layer, node);
		var identityField = attr['identityField'] || 'ogc_fid';
		var typeGeo = attr['identityField'] || 'Polygon';
		var TemporalColumnName = attr['TemporalColumnName'] || '';
		var option = {
			'minZoom': inpAttr['minZoom'] || attr['minZoom'] || 1
			,'maxZoom': inpAttr['maxZoom'] || attr['maxZoom'] || 21
			,'id': id
			,'identityField': identityField
			,'initCallback': initCallback
		};
//utils.bringToDepth(node, node['zIndex']);
		if(node['parentId']) option['parentId'] = node['parentId'];
		
		node['tiles'] = getTilesBounds(inpAttr.dataTiles);
		option['attr'] = attr;
		option['tileFunc'] = inpAttr['tileFunction'];
		var myLayer = new L.TileLayer.VectorTiles(option);
		node['leaflet'] = myLayer;
		myLayer._isVisible = (layer.isVisible ? true : false);
/*
		var pNode = mapNodes[node['parentId']];
		if(!pNode) {
			pNode = {'type': 'map', 'children':[], 'group':LMap};
		}
		pNode.children.push(id);
		node['group'] = new L.LayerGroup();
		pNode['group'].addLayer(node['group']);
		
		if(myLayer._isVisible) 
			pNode.group.addLayer(node['leaflet']);
*/
		if(myLayer._isVisible) 
			LMap.addLayer(node['leaflet']);

		function objectsToFilters(arr, tileID)	{				// Разложить массив обьектов по фильтрам
			var out = {};
			if(!node['tilesGeometry'][tileID]) 	node['tilesGeometry'][tileID] = [];

			for (var i = 0; i < arr.length; i++)
			{
				var ph = arr[i];
if(!ph) return;
				var prop = ph['properties'];
				var propHiden = {};
				propHiden['subType'] = 'fromVectorTile';
				var _notVisible = false;
				if(TemporalColumnName) {
					var zn = prop[TemporalColumnName] || '';
					zn = zn.replace(/(\d+)\.(\d+)\.(\d+)/g, '$2/$3/$1');
					var dt = (new Date(zn).getTime() - gmxAPI.timezoneOffset)/1000;
					propHiden['unixTimeStamp'] = dt;
					if(node['temporal'] && (node['temporal']['ut1'] > dt || node['temporal']['ut2'] < dt)) _notVisible = true;
				}
				if(tileID) {
					propHiden['tileID'] = tileID;
				}
				
				var id = prop[identityField];
//if(id != 76) continue;
//if(id != 31) continue;
				var geo = {};
				if(ph['geometry']) {
					if(!ph['geometry']['type']) ph['geometry']['type'] = typeGeo;
					//geo = utils.parseGeometry(gmxAPI.from_merc_geometry(ph['geometry']), true);
					geo = utils.fromTileGeometry(ph['geometry'], node['tiles'][tileID]);
					geo['propHiden'] = propHiden;
					geo['properties'] = prop;
					node['tilesGeometry'][tileID].push(geo);
				}
				/*
				if(node['objectsData'][id]) {		// Обьект уже имеется - нужна склейка геометрий
					var pt = node['objectsData'][id];
					//geo = utils.unionGeometry(null, geo, pt['geometry']);
var tt =1;
					//removeNode(rnode);
				}
				*/
				var resID = '';
				var toFilters = [];
				for(var j=0; j<node.filters.length; j++) {
					var filterID = node.filters[j];
					var filter = mapNodes[node.filters[j]];
					var flag = (filter && filter.sqlFunction ? filter.sqlFunction(prop) : true);
					if(flag) {
						toFilters.push(filterID);
						break;						// Один обьект в один фильтр 
					}
				}
				propHiden['toFilters'] = toFilters;

				var oData = {
					'type': 'mapObject'
					,'subType': 'fromVectorTile'
					,'resID': resID
					,'id': id
					,'geometry': geo
					,'properties': prop
					,'toFilters': toFilters
				};
				node['objectsData'][id] = oData;
				out[id] = oData;
			}
			return out;
		}

node.repaintCount = 0;
		node.repaintTile = function(attr)	{							// перерисовать векторный тайл слоя
			var out = false;

			var zoom = attr['zoom'];
			if(zoom != gmxAPI._leaflet['lastZoom']) {
				gmxAPI._leaflet['lastZoom'] = zoom;
				var tileSize = Math.pow(2, 8 - zoom) * 156543.033928041;
				gmxAPI._leaflet['mInPixel'] = 256/tileSize;
			}
			var cnt = 0;
//node['tilesDrawing'] = {};				// список отрисованных тайлов в текущем Frame

			var defaultStyle = {													// стиль Canvas по умолчанию
				'stroke': {
					'weight': 1
					,'opacity': 1
					,'color_rgba': 'rgba(0, 0, 255, 1)'
				}
				,'fill': {
					'fillOpacity': 1
					,'fillColor_rgba': 'rgba(0, 0, 255, 1)'
				}
			};
			var setCanvasStyle = function(ctx, style)	{							// указать стиль Canvas
				if(style['stroke']) {
					attr['ctx'].lineWidth = style['weight'] || 1;
					var opacity = style['opacity'] || 0;
					var strokeStyle = style['color_rgba'] || 'rgba(0, 0, 255, 1)';
					strokeStyle = strokeStyle.replace(/1\)/, opacity + ')');
					attr['ctx'].strokeStyle = strokeStyle;
				}
				if(style['fill']) {
					var fillOpacity = style['fillOpacity'] || 0;
					var fillStyle = style['fillColor_rgba'] || 'rgba(0, 0, 255, 1)';
					fillStyle = fillStyle.replace(/1\)/, fillOpacity + ')');
					attr['ctx'].fillStyle = fillStyle;
				}
			}

			for (var key in node['tilesGeometry'])						// Перебрать все загруженные тайлы
			{
				var tb = node['tiles'][key];
				if(!tb) continue;
				if(!tb.intersects(attr.bounds)) continue;				// Тайл не пересекает границы
				for (var i1 = 0; i1 < node['tilesGeometry'][key].length; i1++)
				{
					var geom = node['tilesGeometry'][key][i1];
					var propHiden = geom['propHiden'];
					var filters = propHiden['toFilters'];
					var filter = mapNodes[filters[0]];
					var style = (filter ? utils.evalStyle(filter.regularStyle, geom) : defaultStyle);
					setCanvasStyle(attr['ctx'], style);
					attr['style'] = style;

//if(geom['properties']['ogc_fid'] != 31) continue;
//attr['ctx'].clearRect(0, 0, 256, 256);
//					attr['ctx'].fillStyle = "rgba(255, 0, 0, 0.1)";

					if(geom.type === 'Point' || geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
						var res = geom['paint'](attr);
						if(res && attr.tile.style.cursor != 'pointer') {
							cnt += res;
							attr.tile.style.cursor = 'pointer';
						}
					}
				}
var t = 1;
			}
node.repaintCount++;
//console.log(node.repaintCount + ' Count: ' + cnt + ' tile: ' + attr.drawTileID + ' ccc: ' , attr.scanexTilePoint);
			return out;
		}

		node.parseVectorTile = function(data, tileID)	{				// парсинг векторного тайла
			var out = objectsToFilters(data, tileID);
			return out;
		}

		node.refreshFilter = function(fid)	{		// обновить фильтр
			var filterNode = mapNodes[fid];
			if(!filterNode) return;						// Нода не была создана через addObject
			myLayer.redraw();
//console.log(' refreshFilter: ' + fid + ' : ');
			return true;
		}

		function removeNode(key)	{				// Удалить ноду
			var rnode = mapNodes[key];
			if(!rnode) return;
			var pNode = LMap;
			if(rnode['parentId']) {
				pNode = mapNodes[rnode['parentId']]['group'];
				pNode.removeLayer(rnode['group']);
			}
			pNode.removeLayer(rnode['leaflet']);
			delete mapNodes[key];
		}

		node.removeTile = function(key)	{			// Удалить тайл
			var pt = node['dataTiles'][key];
			if(!pt) return;							// тайл не загружен
			for(var ogc_fid in pt)
			{
				var ph = pt[ogc_fid];
				var arr = ph['toFilters'];
				for (var i = 0; i < arr.length; i++)
				{
					removeNode(arr[i]);
/*	
				
					var pNode = LMap;
					var rnode = mapNodes[arr[i]];
					if(rnode['parentId']) {
						pNode = mapNodes[rnode['parentId']]['group'];
						pNode.removeLayer(rnode['group']);
					}
					pNode.removeLayer(rnode['leaflet']);
					delete mapNodes[arr[i]];
*/					
				}
				delete node['objectsData'][ogc_fid];
			}
			delete node['dataTiles'][key];
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
						setVisible({'obj': rnode, 'attr': (ut1 > dt || ut2 < dt ? false : true)});
					}
				}
			}
			return true;
		}

		node.startLoadTiles = function(attr)	{		// Перезагрузка тайлов векторного слоя
			var redrawFlag = false;
			if (!attr.notClear) {
				for(var key in node['dataTiles']) node.removeTile(key);	// Полная перезагрузка тайлов
				redrawFlag = true;
			}
			
			if (attr.processing) {						// Для обычных слоев
				node.removeEditedObjects();
				if (attr.processing.removeIDS) {
					for(var key in attr.processing.removeIDS) {
						removeNode(key);
						node['deletedObjects'][key] = true;
					}
				}
				if (attr.processing.addObjects) {
					var out = objectsToFilters(attr.processing.addObjects);
var t =1;
				}
				
			}
			
			if (attr.add || attr.del) {			// Для обычных слоев
				if (attr.del) {
					for(var key in attr.del) node.removeTile(key);	// Полная перезагрузка тайлов
var t =1;
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
			if('ut1' in attr && 'ut2' in attr) {		// Есть временной фильтр
				node.chkTemporalFilter(attr);
			}

			if(redrawFlag && node.leaflet) node.leaflet.redraw();
	
//console.log(' startLoadTiles: ' + attr + ' : ');
			return true;
		}

		// Обработчик события - onTileLoaded
		gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onTileLoaded', 'obj': gmxAPI.mapNodes[id], 'func': function(ph) {
				var nodeLayer = mapNodes[id];
				var tileID = ph.attr['data']['tileID'];
				var data = ph.attr['data']['data'];
				nodeLayer['dataTiles'][tileID] = nodeLayer.parseVectorTile(data, tileID);
//console.log(' onTileLoaded: ' + data.length + ' : ');
			}
		});
		// Обработчик события - onLayerStartTileRepaint
		gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onLayerStartTileRepaint', 'obj': gmxAPI.mapNodes[id], 'func': function(ph) {
				var nodeLayer = mapNodes[id];
				nodeLayer.repaintTile(ph.attr);
//console.log(' onTileLoaded: ' + data.length + ' : ');
			}
		});
			
	}
	
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['cmdProxy'] = leafletCMD;				// посылка команд отрисовщику
	gmxAPI._leaflet['utils'] = utils;						// утилиты для leaflet
	gmxAPI._leaflet['mapNodes'] = mapNodes;					// Хэш нод обьектов карты - аналог MapNodes.hx
    
	//gmxAPI._cmdProxy = leafletCMD;				// посылка команд отрисовщику
	//gmxAPI._leafletUtils = utils;
//	var mapNodes = {						// Хэш нод обьектов карты - аналог MapNodes.hx
	
})();

// Geometry
(function()
{
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['Geometry'] = function() {						// класс Geometry
		var out = {
			'type': 'unknown'
			,'geoID': gmxAPI.newFlashMapId()
			,'bounds': null
		};
		return out;
	};
})();

// PointGeometry
(function()
{
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['PointGeometry'] = function(geo_, tileBounds_) {				// класс PointGeometry
		var out = gmxAPI._leaflet['Geometry']();
		out['type'] = 'Point';

		var p = geo_['coordinates'];
		var point = new L.Point(p[0], p[1]);
		var bounds = new L.Bounds(point);
		bounds.extend(point);

		out['coordinates'] = point;
		out['bounds'] = bounds;
		
		// Отрисовка точки
		out['paint'] = function (attr) {
			//if(!bounds.intersects(attr['bounds'])) return;				// проверка пересечения полигона с отображаемым тайлом
			var zoom = attr['zoom'];
			var vbounds = attr['bounds'];
			var mInPixel = gmxAPI._leaflet['mInPixel'];

			//var ctx = gmxAPI._leaflet['ptx'];
			//ctx.clearRect(0, 0, 256, 256);
			
			var ctx = attr['ctx'];
			
			var x = attr['x'];
			var y = 256 + attr['y'];
			var px1 = point.x * mInPixel - x; 		px1 = (0.5 + px1) << 0;
			var py1 = y - point.y * mInPixel;		py1 = (0.5 + py1) << 0;
			var style = attr['style'];
			var size = style['size'] || 4;
/*
ctx.fillStyle = "rgba(255, 0, 0, 1)";
ctx.strokeStyle = "rgba(0, 0, 255, 1)";
ctx.lineWidth = 4;
//ctx.strokeStyle = "#ff";
*/			
			if(style['marker']) {
				if(style['image']) {
					ctx.drawImage(style['image'], px1, py1);
				}
				
			} else {
				if(style['stroke']) {
					ctx.beginPath();
					ctx.strokeRect(px1, py1, size, size);
					ctx.stroke();
				}
				if(style['fill']) {
					ctx.beginPath();
					ctx.fillRect(px1, py1, size, size);
					ctx.fill();
				}
			}
			return 1;		// количество отрисованных точек в геометрии
		}
		
		return out;
	};
})();

// PolygonGeometry
(function()
{
	var chkOnEdge = function(p1, p2, ext) {				// отрезок на границе
		if ((p1[0] < ext.min.x && p2[0] < ext.min.x) || (p1[0] > ext.max.x && p2[0] > ext.max.x)) return true;
		if ((p1[1] < ext.min.y && p2[1] < ext.min.y) || (p1[1] > ext.max.y && p2[1] > ext.max.y)) return true;
		 return false;
	}
	var chkOnOut = function(p1, ext) {				// точка за границей
		return (p1.lng < ext.minx || p1.lng > ext.maxx || p1.lat < ext.miny || p1.lat > ext.maxy);
	}
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['PolygonGeometry'] = function(geo_, tileBounds_) {				// класс PolygonGeometry
//gmxAPI._tcnt++;
		var out = gmxAPI._leaflet['Geometry']();
		out['type'] = 'Polygon';
		var tileBounds = tileBounds_;					// границы тайла в котором пришел обьект

		var lastZoom = null;
		var bounds = null;
		var hideLines = [];										// индексы точек лежащих на границе тайла
		var cnt = 0;
		var coords = [];
		for (var i = 0; i < geo_['coordinates'].length; i++)
		{
			var hideLines1 = [];
			var prev = null;
			var coords1 = [];
			for (var j = 0; j < geo_['coordinates'][i].length; j++)
			{
				var p = geo_['coordinates'][i][j];
				var point = new L.Point(p[0], p[1]);
				if(!bounds) bounds = new L.Bounds(point);
				bounds.extend(point);
				if(prev && chkOnEdge(p, prev, tileBounds)) {
					hideLines1.push(cnt);
				}
				prev = p;
				coords1.push(point);
				cnt++;
			}
			hideLines.push(hideLines1);
			coords.push(coords1);
		}
		out['coordinates'] = coords;
		out['bounds'] = bounds;
		out['cnt'] = cnt;
/*
		var setLine = function(p1, ctx, x, y, zoom, cnt) {				// нарисовать следующую точку
			var pp = LMap.project(p1, zoom);
			var px1 = pp.x - x; 	px1 = (0.5 + px1) << 0;
			var py1 = pp.y - y;		py1 = (0.5 + py1) << 0;
			
			if(cnt == 0) {
				ctx.moveTo(px1, py1);
			}
			else
			{
				ctx.lineTo(px1, py1);
			}
		}
*/		
		// Отрисовка полигона
		out['paint'] = function (attr) {
			if(!bounds.intersects(attr['bounds'])) return;				// проверка пересечения полигона с отображаемым тайлом
			var zoom = attr['zoom'];
			//if(zoom != lastZoom) {
			lastZoom = zoom;
//ptx.clearRect(0, 0, 256, 256);
			
			var vbounds = attr['bounds'];
			var mInPixel = gmxAPI._leaflet['mInPixel'];

			//var ctx = gmxAPI._leaflet['ptx'];
			//ctx.clearRect(0, 0, 256, 256);
			
			var ctx = attr['ctx'];
			var x = attr['x'];
			var y = 256 + attr['y'];

			// отрисовка fillStyle
//ctx.save();
//ctx.save();
//console.log(' fillStyle: ' + ctx.fillStyle);			
			//ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
			ctx.beginPath();
//ctx.fillRect(0, 0, 256, 256);			
			//for (var i = 0; i < 1; i++)
			var cnt = 0;
			for (var i = 0; i < this['coordinates'].length; i++)
			{
				var hArr = hideLines[i];
				var cntHide = 0;
				var pArr = this['coordinates'][i];
				//var pArr = L.PolyUtil.clipPolygon(this['coordinates'][i], attr['bounds']);
				for (var j = 0; j < pArr.length; j++)
				{
					var lineIsOnEdge = false;
					if(j == hArr[cntHide]) {
						lineIsOnEdge = true;
						cntHide++;
					}
					var p1 = pArr[j];
					var px1 = p1.x * mInPixel - x; 		px1 = (0.5 + px1) << 0;
					var py1 = y - p1.y * mInPixel;		py1 = (0.5 + py1) << 0;
					if(j == 0)
						ctx.moveTo(px1, py1);
					else
						ctx.lineTo(px1, py1);
					cnt++;
				}
//ctx.fill();
			}
//ctx.clip();
			//if(cnt) {
				ctx.closePath();
				ctx.fill();
			//}

/*

ctx.restore();
ctx.globalAlpha = 0.5;
ctx.strokeStyle = "#ff";
ctx.lineWidth = 4;
//ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
//ctx.lineWidth = 4;
//ctx.strokeStyle = "#ff";
*/			
			// отрисовка outLineStyle
			//cnt = 0;
			ctx.beginPath();
			for (var i = 0; i < this['coordinates'].length; i++)
			{
				var hArr = hideLines[i];
				var cntHide = 0;
				var pArr = this['coordinates'][i];
				//var pArr = L.PolyUtil.clipPolygon(this['coordinates'][i], attr['bounds']);
				for (var j = 0; j < pArr.length; j++)
				{
					var lineIsOnEdge = false;
					if(j == hArr[cntHide]) {
						lineIsOnEdge = true;
						cntHide++;
					}
					var p1 = pArr[j];
					var px1 = p1.x * mInPixel - x; 		px1 = (0.5 + px1) << 0;
					var py1 = y - p1.y * mInPixel;		py1 = (0.5 + py1) << 0;
					if(lineIsOnEdge || j == 0)
						ctx.moveTo(px1, py1);
					else
						ctx.lineTo(px1, py1);
					cnt++;
				}
			}
			//ctx.closePath();
				//ctx.fill();
			ctx.stroke();
//ctx.fill();
//ctx.fill();
//ctx.closePath();
//ctx.save();
//			ctx.clip();
//			ctx.rect(0, 0, 256, 256);
//var delta = (new Date()).getTime() - startTime;
//console.log(cnt + ' tile: ' + delta);			
				//attr['ctx'].drawImage(gmxAPI._leaflet['ptxCont'], 0, 0);
		
			//}
			return cnt;		// количество отрисованных точек в геометрии
		}
		return out;
	};
})();

// MultiPolygonGeometry
(function()
{
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['MultiPolygonGeometry'] = function(geo, tileBounds_) {				// класс MultiPolygonGeometry
		var out = gmxAPI._leaflet['Geometry']();
		out['type'] = 'MultiPolygon';
		out['tileBounds'] = tileBounds_;

		var members = [];
		var bounds = null;
		var cnt = 0;
		var addMember = function (item) {
			cnt += item.cnt;
			var p = new L.Point( item.bounds.min.x, item.bounds.min.y );
			if(!bounds) bounds = new L.Bounds(p);
			bounds.extend(p);
			p = new L.Point( item.bounds.max.x, item.bounds.max.y );
			bounds.extend(p);
			members.push(item);
		}
		var addMembers = function (arr) {
			for (var i = 0; i < arr.length; i++)
			{
				addMember(arr[i]);
			}
		}
		
		if(geo && geo['coordinates'] && geo['coordinates'].length) {
			var arr = [];
			for (var i = 0; i < geo['coordinates'].length; i++)
			{
				var item = gmxAPI._leaflet['PolygonGeometry']({'coordinates': geo['coordinates'][i]}, tileBounds_);
				addMember(item);
			}
		}
		
		out['addMembers'] = addMembers;
		out['addMember'] = addMember;
		out['bounds'] = bounds;
		out['cnt'] = cnt;
		out['paint'] = function (attr) {
			var cnt = 0;
			if(bounds.intersects(attr['bounds'])) {				// проверка пересечения мультиполигона с отображаемым тайлом
				for (var i = 0; i < members.length; i++)
				{
					cnt += members[i].paint(attr);
				}
			}
			return cnt;		// количество отрисованных точек в геометрии
		}
		return out;
	};
})();

////////////////////////////

//Плагины для leaflet
(function()
{
	// Обработчик события - mapInit
	function onMapInit(ph) {
/*	
		// Обработчик события - baseLayerSelected
		gmxAPI._listeners.addListener({'level': -10, 'eventName': 'baseLayerSelected', 'obj': gmxAPI.map, 'func': function(ph) {
				var nodeLayer = ph;
console.log(' baseLayerSelected: ' + ph + ' : ');
			}
		});
*/		
	}
	
	var utils = null;							// Утилиты leafletProxy
	var mapNodes = null;						// Хэш нод обьектов карты - аналог MapNodes.hx
	var leafLetCont_ = null;
	var mapDivID = '';
	var initFunc = null;
	var intervalID = 0;
	
	// Инициализация LeafLet карты
	function waitMe(e)
	{
		if('L' in window) {
			clearInterval(intervalID);
			if(!utils) utils = gmxAPI._leaflet['utils'];
			if(!mapNodes) {
				mapNodes = gmxAPI._leaflet['mapNodes'];
				gmxAPI._cmdProxy = gmxAPI._leaflet['cmdProxy'];			// Установка прокси для leaflet
			}

			LMap = new L.Map(leafLetCont_,
				{
					zoomControl: false
					//,worldCopyJump: false
					//,zoomAnimation: false
					,crs: L.CRS.EPSG3395
					//,'crs': L.CRS.EPSG3857 // L.CRS.EPSG4326 // L.CRS.EPSG3395 L.CRS.EPSG3857
				}
			);
			gmxAPI._leaflet['LMap'] = LMap;			// Внешняя ссылка на карту
			
			var ptxCont = document.createElement("canvas");
			ptxCont.width = ptxCont.height = 256;
			var ptx = ptxCont.getContext('2d');
			gmxAPI._leaflet['ptxCont'] = ptxCont;
			gmxAPI._leaflet['ptx'] = ptx;
/*		
*/

			var pos = new L.LatLng(50, 35);
			//var pos = new L.LatLng(50.499276, 35.760498);
			LMap.setView(pos, 3);
//console.log('waitMe ' , pos);
		//LMap.on('moveend', function(e) { gmxAPI._updatePosition(e); });
			LMap.on('move', function(e) {
				var pos = LMap.getCenter();
				var size = LMap.getSize();
				var vbounds = LMap.getBounds();
				var nw = vbounds.getNorthWest();
				var se = vbounds.getSouthEast();
				var attr = {
					'currPosition': {
						'z': LMap.getZoom()
						,'x': gmxAPI.merc_x(pos['lng'])
						,'y': gmxAPI.merc_y(pos['lat'])
						,'stageHeight': size['y']
						,'mouseX': gmxAPI.merc_x(utils.getMouseX())
						,'mouseY': gmxAPI.merc_y(utils.getMouseY())
						,'extent': {
							'minX': gmxAPI.merc_x(nw['lng']),
							'minY': gmxAPI.merc_y(nw['lat']),
							'maxX': gmxAPI.merc_x(se['lng']),
							'maxY': gmxAPI.merc_y(se['lat'])
						}
					}
				};
				gmxAPI._updatePosition(e, attr);
			});
			LMap.on('mousemove', function(e) {
				gmxAPI._leaflet['mousePos'] = e.latlng;
			});


			// Обработчик события - mapInit
			gmxAPI._listeners.addListener({'level': -10, 'eventName': 'mapInit', 'func': onMapInit});

			function drawCanvasPolygon( ctx, x, y, geom, zoom, bounds ) {
				if(!geom) return;
				ctx.save();
				//ctx.translate(x, y);
				ctx.beginPath();
				
				for (var i = 0; i < geom.length; i++)
				{
					var pt = geom[i];
					//ctx.strokeStyle = "#ff";
					//ctx.lineWidth = 6;
					//ctx.beginPath();
					//var pArr = pt;
					var pArr = L.PolyUtil.clipPolygon(pt, bounds);
					//pArr.push(pArr[0]);
					for (var j = 0; j < pArr.length; j++)
					{
						var p = new L.LatLng(pArr[j].y, pArr[j].x);
						var pp = LMap.project(p, zoom);
						var px = pp.x - x;
						var py = pp.y - y;
						px = (0.5 + px) << 0;
						py = (0.5 + py) << 0;
			//console.log('ttt1: ' , p, pp, px, py); 
						if(j == 0) ctx.moveTo(px, py);
						ctx.lineTo(px, py);
					}
					pArr = null;
					//ctx.stroke();
					ctx.closePath();
				}
				ctx.restore();
			}

	// requestAnim shim layer by Paul Irish
	var requestAnimFrame = (function(){
	  return  window.requestAnimationFrame       ||
			  window.webkitRequestAnimationFrame ||
			  window.mozRequestAnimationFrame    ||
			  window.oRequestAnimationFrame      ||
			  window.msRequestAnimationFrame;
			  //||  function(/* function */ callback, /* DOMElement */ element){ window.setTimeout(callback, 1000 / 60);  };
			  
	})();
	function animate() {
		requestAnimFrame( animate );
		//draw();
	}
			
			// Растровый слой OSM
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

			// Растровый слой с маской
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
//if(tilePoint.x > 1) return; 
//console.log('ttt: ' + tilePoint.x); 
					if(!zoom) zoom = LMap.getZoom();
					var st = zoom + '_' + tilePoint.x + '_' + tilePoint.y;
					//if(tile._layer.__badTiles[st]) return;	// пропускаем отсутствующие тайлы
					var pz = Math.pow(2, zoom - 1);
					var pz1 = Math.pow(2, zoom);
					//if(tilePoint.x > pz) tilePoint.x = tilePoint.x % pz1; 
					//else if(tilePoint.x < -pz) tilePoint.x = tilePoint.x % pz1; 
					//var pp = new L.Point(tilePoint.x - pz, -tilePoint.y - 1 + pz);

					var bounds = utils.getTileBounds(tilePoint, zoom);
					var tileX = 256 * tilePoint.x;								// позиция тайла в stage
					var tileY = 256 * tilePoint.y;
					
					var attr = this.options.attr;
					var flagAll = false;
					if(attr.bounds.min.x < -179
						&& attr.bounds.min.y < -85
						&& attr.bounds.max.x > 179
						&& attr.bounds.max.y > 85)
					{
						flagAll = true;
					}
					var ctx = tile.getContext('2d');
					if(!flagAll) {
						if(attr.bounds && !bounds.intersects(attr.bounds))	{	// Тайл не пересекает границы слоя
							return;
						}
						var geom = attr['geom'];
						drawCanvasPolygon( ctx, tileX, tileY, geom, zoom, bounds );
					}
					var imageObj = new Image();
					imageObj.onload = function(){
						var pattern = ctx.createPattern(imageObj, "no-repeat");
						//ctx.save();
						//ctx.drawImage(m_canvas, 0, 0);
						//ctx.restore();
						ctx.fillStyle = pattern;
						if(flagAll) ctx.fillRect(0, 0, 256, 256);
						ctx.fill();
					};
					var src = utils.getTileUrl(tile._layer, tilePoint, zoom);
//console.log('ttt1: ' , tilePoint, bounds, attr.bounds, src); 
					imageObj.src = src;
//requestAnimFrame();					
				}
			}
			);
			
			// Векторный слой
			L.TileLayer.VectorTiles = L.TileLayer.Canvas.extend(
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
//					if(!this._isVisible) return;								// Слой невидим
					//var st = zoom + '_' + tilePoint.x + '_' + tilePoint.y;
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
					
					var opt = this.options;
					//if(opt.attr.bounds && !bounds.intersects(opt.attr.bounds))	{	// Тайл не пересекает границы слоя
						//return;
					//}
					var node = mapNodes[opt['id']];
//return;
					//var tileX = 256 * scanexTilePoint.x;								// позиция тайла в stage
					//var tileY = 256 * scanexTilePoint.y;
					//var identityField = tile._layer.options.identityField;
					var ctx = tile.getContext('2d');
					ctx.clearRect(0, 0, 256, 256);

/*
ctx.strokeRect(2, 2, 253, 253);
ctx.font = '24px "Tahoma"';
ctx.fillText(drawTileID, 10, 128);
*/
					var repaint = function(test) {
						var attr = {'tile': tile, 'ctx': ctx, 'x': 256 * scanexTilePoint.x, 'y': 256 * scanexTilePoint.y, 'zoom': zoom, 'bounds': bounds, 'drawTileID': drawTileID, 'scanexTilePoint': scanexTilePoint};
						var gmxNode = gmxAPI.mapNodes[opt['id']];
						gmxAPI._listeners.dispatchEvent('onLayerStartTileRepaint', gmxNode, {'obj':gmxNode, 'attr':attr});
					}

					var repaintFlag = true;
					var tiles = node['tiles'];
					for (var key in tiles)
					{
						//if(!node['dataTiles'][st]) {
							var pt = tiles[key];
							if(bounds.intersects(pt))	{			// Тайл пересекает границы - необходимо загрузить
								var arr = key.split('_');
								var tx = Number(arr[1]);
								var ty = Number(arr[2]);
								var tz = Number(arr[0]);
								var sst = tz + '_' + tx + '_' + ty;
								if(!node['dataTiles'][sst] && !node['badTiles'][sst] && !node['tilesLoadProgress'][sst]) {
									var srcArr = utils.getTileUrlVector(tile._layer, {'x':tx, 'y':ty}, tz);
									if(typeof(srcArr) === 'string') srcArr = [srcArr];

									var counts = srcArr.length;
									var needParse = [];
									(function(tileID) {						// подгрузка векторных тайлов
										for (var i = 0; i < srcArr.length; i++)
										{
											var src = srcArr[i] + '&r=t';
											node['loaderFlag'] = true;
											node['tilesLoadProgress'][tileID] = true;
											repaintFlag = false;
											gmxAPI.sendCrossDomainJSONRequest(src, function(response)
											{
												delete node['tilesLoadProgress'][tileID];
												counts--;
												if(typeof(response) != 'object' || response['Status'] != 'ok') {
													gmxAPI.addDebugWarnings({'url': src, 'Error': 'bad response'});
													node['badTiles'][tileID] = true;
													//return;
												}
												if(response['Result'] && response['Result'].length)	needParse = needParse.concat(response['Result']);
//console.log( 'response : ' + tileID + ' : ' + response['Result'].length + ' : ' + needParse.length);
//	console.log(tileID + ' : ' + src);
												if(counts < 1) {
													var gmxNode = gmxAPI.mapNodes[opt['id']];
													gmxAPI._listeners.dispatchEvent('onTileLoaded', gmxNode, {'obj':gmxNode, 'attr':{'data':{'tileID':tileID, 'data':needParse}}});		// tile загружен
													//console.log(tileID + ' : __________' + src);
													needParse = [];
													node['loaderFlag'] = false;
													for (var t in node['tilesLoadProgress'])
													{
														node['loaderFlag'] = true;
														break;
													}
													node['leaflet'].redraw();		// перезапросить drawTile слоя
												}
											});
										}
									})(sst);
								}
							}
						//}
					}
//ctx.stroke();
//ctx.restore();
					if(!node['loaderFlag']) repaint(0);

					
				}
			});
			
			L.RectangleMarker = L.Rectangle.extend({
				projectLatlngs: function () {
					var tt = this;
					L.Polyline.prototype.projectLatlngs.call(this);

					// project polygon holes points
					// TODO move this logic to Polyline to get rid of duplication
					this._holePoints = [];

					if (!this._holes) {
						return;
					}

					for (var i = 0, len = this._holes.length, hole; i < len; i++) {
						this._holePoints[i] = [];

						for (var j = 0, len2 = this._holes[i].length; j < len2; j++) {
							this._holePoints[i][j] = this._map.latLngToLayerPoint(this._holes[i][j]);
						}
					}

					var tt = this;
				}
			/*	
				,
				projectLatlngs: function () {
					this._originalPoints = [];

					for (var i = 0, len = this._latlngs.length; i < len; i++) {
						this._originalPoints[i] = this._map.latLngToLayerPoint(this._latlngs[i]);
					}
				}
			*/	
				,
				_boundsToLatLngs: function (latLngBounds) {
					var p1 = latLngBounds.getSouthWest();
					var p1 = latLngBounds.getSouthWest();
					return [
						latLngBounds.getSouthWest(),
						latLngBounds.getNorthWest(),
						latLngBounds.getNorthEast(),
						latLngBounds.getSouthEast(),
						latLngBounds.getSouthWest()
					];
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
		var apiHost = gmxAPI.getAPIFolderRoot();

		var script = document.createElement("script");
		script.setAttribute("charset", "windows-1251");
		script.setAttribute("src", apiHost + "leaflet/leaflet.js");
		document.getElementsByTagName("head").item(0).appendChild(script);
		//script.setAttribute("onLoad", onload );
		
		var css = document.createElement("link");
		css.setAttribute("type", "text/css");
		css.setAttribute("rel", "stylesheet");
		css.setAttribute("media", "screen");
		css.setAttribute("href", apiHost + "leaflet/leaflet.css");
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
    //gmxAPI._cmdProxy = leafletCMD;				// посылка команд отрисовщику
    gmxAPI._addProxyObject = addLeafLetObject;	// Добавить в DOM
	gmxAPI.proxyType = 'leaflet';
    gmxAPI.APILoaded = true;					// Флаг возможности использования gmxAPI сторонними модулями
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	//gmxAPI._leaflet['LMap'] = LMap;				// leafLet карта
gmxAPI._tcnt = 0;
	gmxAPI._leaflet['lastZoom'] = -1;				// zoom нарисованный
	gmxAPI._leaflet['mInPixel'] = 0;				// текущее кол.метров в 1px
})();
