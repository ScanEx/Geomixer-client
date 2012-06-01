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
		'getImageSize': function(pt)	{		// определение размеров image
			var _img = L.DomUtil.create('img', 'leaflet-image-layer');
			_img.style.visibility = 'hidden';
			function getSize(ev) {
				pt['imageWidth'] = ev.target.width;
				pt['imageHeight'] = ev.target.height;
				gmxAPI._listeners.dispatchEvent('onIconLoaded', null, pt['iconUrl']);		// image загружен
			}
			L.DomEvent.addListener(_img, 'load', getSize, this);
			_img.src = pt['iconUrl'];
		}
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
					utils.getImageSize(pt);
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
					//if('dashes' in ph) pt['opacity'] = ph['dashes'];
					
				}
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
		'chkPropsInString': function(str, prop, type)	{							// парсинг значений свойств в строке
			var zn = str;
			if(typeof(zn) === 'string') {
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
		'evalStyle': function(style, prop)	{								// парсинг стиля
			var out = {};
			for(var key in style) {
				var zn = utils.chkPropsInString(style[key], prop);
				if(key === 'fillColor' || key === 'color') {
					zn = utils.dec2hex(zn);
					if(zn.substr(0,1) != '#') zn = '#' + zn;
				} else if(key === 'fillOpacity' || key === 'opacity') {
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
				if(node['subType'] == 'filter') {				// отрисовка фильтра
					//utils.drawFilter(node);
					var tt = 1;
				} else if(node.geometry && node.geometry.type) {
					node.geometry.id = node.id;
					//node.leaflet = utils.drawGeometry(node.geometry, featureparse);
					if(regularStyle['iconUrl'] && !regularStyle['imageWidth']) {		// нарисовать после загрузки onIconLoaded
						gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onIconLoaded', 'func': function(url) {
								if(url === regularStyle['iconUrl']) {
									node.leaflet = utils.drawNode(node, regularStyle);
									var pNode = mapNodes[node['parentId']];
									var group = (pNode ? pNode.group : LMap);
									group.addLayer(node['leaflet']);
									node['leaflet']._isVisible = true;
								}
							}
						});
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
		'drawPolygon': function(node, style)	{			// отрисовка POINT геометрии - стиль маркер
			var geo = node.geometry;
			//var pos = geo.coordinates;
			var featureparse = function(e) {
				if('setStyle' in e.layer) {
					e.layer.setStyle(utils.evalStyle(style, e.properties));
				}
			};
			out = utils.drawGeometry(geo, featureparse);
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
			else if(type === 'MultiPoint')			pt['type'] = 'MultiPoint';
			else if(type === 'POINT')				pt['type'] = 'Point';
			else if(type === 'MULTILINESTRING')		pt['type'] = 'MultiLineString';
			else if(type === 'LINESTRING')			pt['type'] = 'LineString';
			else if(type === 'GeometryCollection')	pt['type'] = 'GeometryCollection';
			return null;
		}
		,
		'parseGeometry': function(geo)	{			// перевод геометрии Scanex->leaflet
			var pt = {};
			var type = geo.type;
			pt['coordinates'] = geo['coordinates'];
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
		'drawGeometry': function(geo, featureparse)	{			// отрисовка leaflet геометрии
			var geojson = new L.GeoJSON();
			if(featureparse) {
				geojson.on('featureparse', featureparse);
			}
			geojson.addGeoJSON(geo);
			//LMap.addLayer(geojson);
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
		'getLastIndex': function()	{			// Получить последний zIndex в mapNodes
			var n = 0;
			for (id in mapNodes)
			{
				n = Math.max(n, (mapNodes[id]['zIndex'] ? mapNodes[id]['zIndex'] : 0));
			}
			return n + 1;
		}
		,
		'getIndexLayer': function(sid)
		{ 
			var myIdx = gmxAPI.map.layers.length;
			var n = 0;
			for (var i = 0; i < myIdx; i++)
			{
				var l = gmxAPI.map.layers[i];
				if (l.objectId && (l.properties.type != "Overlay")) {
					if (l.objectId == sid) break;
					n += 1;
				}
			}
			return n;
		}
		
		,'getMapPosition': function()	{			// Получить позицию карты
			var pos = LMap.getCenter();
			return {
				'z': LMap.getZoom()
				,'x': gmxAPI.merc_x(pos['lng'])
				,'y': gmxAPI.merc_y(pos['lat'])
			};
		}
		,'dec2hex': function(i)	{					// convert decimal to hex
			return (i+0x1000000).toString(16).substr(-6).toUpperCase();
		}
		,'getTileBounds': function(tilePoint, zoom)	{		// получить Bounds тайла
			var tileX = 256 * tilePoint.x;								// позиция тайла в stage
			var tileY = 256 * tilePoint.y;

			var p1 = new L.Point(tileX, tileY);
			var pp1 = LMap.unproject(p1, zoom);					// Перевод экранных координат тайла в latlng
			p1.x = pp1.lng; p1.y = pp1.lat;
			var	p2 = new L.Point(tileX + 256, tileY + 256);
			var pp2 = LMap.unproject(p2, zoom);
			p2.x = pp2.lng; p2.y = pp2.lat;
			var bounds = new L.Bounds(p1, p2);
			return bounds;
		}
		,'parseVectorTile': function(node, identityField, pt)	{				// парсинг векторного тайла
			var typeGeo = node['geometry']['type'];
			var out = {};
			for (var i = 0; i < pt.length; i++)
			{
				var ph = pt[i];
				var prop = ph['properties'];
				var id = prop[identityField];
				var geo = {};
				if(ph['geometry']) {
					if(!ph['geometry']['type']) ph['geometry']['type'] = typeGeo;
					geo = utils.parseGeometry(gmxAPI.from_merc_geometry(ph['geometry']));
				}
				
				var toFilters = [];
				for(var j=0; j<node.filters.length; j++) {
					var filterID = node.filters[j];
					var filter = mapNodes[node.filters[j]];
					if(utils.chkPropsInString(filter['sql'], prop, 1)) {
						var tmp = {
							'obj': {
								'objectId': node.filters[j]
							}
							,
							'attr': {
								"geometry": geo
								,
								"properties": prop
							}
						};
						var res = addObject(tmp);
						toFilters.push(res.objectId);

					}
				}
				out[id] = {
					'type': 'mapObject'
					,'subType': 'fromVectorTile'
					,'id': id
					,'geometry': geo
					,'properties': prop
					,'toFilters': toFilters
				};
			}
			return out;
		}
		,
		'drawFilter': function(node) {			// отрисовка фильтра
			if(!node) return;								// Нода не определена
			var pNode = mapNodes[node['parentId']];
			if(!pNode) return;								// Нода не определена
var tt = gmxAPI.mapNodes[node['id']];
			var geo = [];

			var regularStyle = utils.getNodeProp(node, 'regularStyle', true);
			for(var key in pNode['dataTiles']) {
				var ph = pNode['dataTiles'][key];
				for(var key1 in ph) {
					var ph1 = ph[key1];
					geo.push(ph1['geometry']);
/*
			var featureparse = function(e) {
				if('setStyle' in e.layer) {
					e.layer.setStyle(utils.evalStyle(regularStyle, e.properties));
				}
			};
			node.leaflet = utils.drawGeometry(ph1['geometry'], featureparse);
*/
				}
			}
//return;
			if(geo.length == 0) return;						// Нет геометрий для отрисовки
			var out = {
				"type": "GeometryCollection",
				"geometries": geo
			};
			var regularStyle = utils.getNodeProp(node, 'regularStyle', true);
			var featureparse = function(e) {
				if('setStyle' in e.layer) {
					e.layer.setStyle(utils.evalStyle(regularStyle, e.properties));
				}
			};
			node.leaflet = utils.drawGeometry(out, featureparse);
		//if(myLayer._isVisible) 
			//LMap.addLayer(node.leaflet);
var tt = 1;

		}
	};

	// добавить mapObject
	function addObject(ph)	{
		nextId++;
		var id = 'id' + nextId;
		var pt = {
			'type': 'mapObject'
			,'children': []
			,'id': id
			,'parentId': ph.obj['objectId']
		};
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
		}
		pt['zIndex'] = utils.getLastIndex();
		mapNodes[id] = pt;
		if(pt['geometry']['type']) {
			utils.repaintNode(pt, true);
			if(pt['leaflet']) {
				pNode.group.addLayer(pt['leaflet']);
				pt['leaflet']._isVisible = true;
			}
		}
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
				} else if(node['type'] === 'VectorLayer') {
					utils.repaintNode(node, true);
				} else if(node['type'] === 'mapObject') {
					//if(node['geometry'] && !node['leaflet']) node['leaflet'] = utils.drawGeometry(node['geometry']);
					if(node['leaflet'] && !node['leaflet']._isVisible) {
						if(node['parentId']) pNode = mapNodes[node['parentId']]['group'];
						node['leaflet']._isVisible = true, pNode.addLayer(node['leaflet']);
					}
				}
			}
			else
			{
				if(node['leaflet'] && node['leaflet']._isVisible) {
					if(node['type'] === 'mapObject' && node['parentId']) pNode = mapNodes[node['parentId']]['group'];
					//if(node['parentId']) pNode = mapNodes[node['parentId']]['group'];
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
			//for (key in pNode.children) {
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
			var zIndex = utils.getLastIndex();
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
			node['subType'] = 'filter';
			node['sql'] = utils.parseSQL(ph.attr['sql']);
			var pNode = mapNodes[node['parentId']];
			if(!pNode['filters']) pNode['filters'] = [];
			pNode['filters'].push(id);
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
	//&& cmd != 'setStyle'
	&& cmd != 'setGeometry'
	&& cmd != 'setHandler'
	&& cmd != 'setBackgroundColor'
	&& cmd != 'setZoomBounds'
	//&& cmd != 'setVectorTiles'
	//&& cmd != 'setFilter'
	&& cmd != 'setExtent'
	&& cmd != 'setClusters'
	//&& cmd != 'setBackgroundTiles'
	) {
	// cmd"" cmd"" getVisibility
	var tt = 1;
}
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
//console.log(cmd + ' : ' + ret);
		return ret;
	}

	// Добавить векторный слой
	function setVectorTiles(ph)	{
		var out = {};
		var layer = ph.obj;
		var id = layer.objectId;
		var node = mapNodes[id];
		if(!node) return;						// Нода не определена
		node['type'] = 'VectorLayer';
		node['filters'] = [];
		node['dataTiles'] = {};
		node['tilesLoaded'] = {};
		node['tilesLoadProgress'] = {};
		node['badTiles'] = {};
		
		var inpAttr = ph.attr;
		node['subType'] = (inpAttr['filesHash'] ? 'Temporal' : '');
		
		var initCallback = function(obj) {			// инициализация leaflet слоя
			if(obj._container) {
				if(obj._container.id != id) obj._container.id = id;
				if(obj._container.style.position != 'absolute') obj._container.style.position = 'absolute';
				LMap.fire('moveend');
			}
		};

		var attr = prpLayerAttr(layer, node);
		var option = {
			'minZoom': inpAttr['minZoom'] || attr['minZoom'] || 1
			,'maxZoom': inpAttr['maxZoom'] || attr['maxZoom'] || 21
			,'id': id
			,'identityField': attr['identityField'] || 'ogc_fid'
			,'initCallback': initCallback
		};
		if(node['parentId']) option['parentId'] = node['parentId'];
		option['tiles'] = {};
		for (var i = 0; i < inpAttr.dataTiles.length; i+=3)
		{
			var st = inpAttr.dataTiles[i+2] + '_' + inpAttr.dataTiles[i] + '_' + inpAttr.dataTiles[i+1];
			var pz = Math.round(Math.pow(2, inpAttr.dataTiles[i+2] - 1));
			var bounds = utils.getTileBounds({'x':inpAttr.dataTiles[i] + pz, 'y':pz - 1 - inpAttr.dataTiles[i+1]}, inpAttr.dataTiles[i+2]);
			option['tiles'][st] = bounds;
		}
		option['attr'] = attr;
		option['tileFunc'] = inpAttr['tileFunction'];
		var myLayer = new L.TileLayer.VectorTiles(option);
		node['leaflet'] = myLayer;
		myLayer._isVisible = (layer.isVisible ? true : false);
		if(myLayer._isVisible) 
			LMap.addLayer(myLayer);

		// Обработчик события - onVectorTileLoaded
		gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onVectorTileLoaded', 'obj': gmxAPI.mapNodes[id], 'func': function(ph) {
				var nodeLayer = mapNodes[id];
				var tileID = ph['tileID'];
				var data = ph['data'];
				var arr = [];
				
				var geometries = utils.parseVectorTile(node, option['identityField'], data);
				node['dataTiles'][tileID] = geometries;
				
/*				
				for(var ogc_fid in nodeLayer['dataTiles'][st]) {
					var geo = nodeLayer['dataTiles'][st][ogc_fid]; //['geometry'];
					arr.push(geo);
				}
				addObjects(filterID, {'arr':arr, 'sql':filter['sql']});
				//var layer = gmxAPI.mapNodes[id];
				//var pArr = node.filters;
				for(var i=0; i<node.filters.length; i++) {
					var filterID = node.filters[i];
					var filter = mapNodes[node.filters[i]];
					var out = addObjects(filterID, {'arr':arr, 'sql':filter['sql']});
				}
				//var filterID = nodeLayer.children[0];
var filterID = nodeLayer.children[0];
*/
			}
		});
			
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
					var st = zoom + '_' + tilePoint.x + '_' + tilePoint.y;
					//if(tile._layer.__badTiles[st]) return;	// пропускаем отсутствующие тайлы
					var tileX = 256 * tilePoint.x;								// позиция тайла в stage
					var tileY = 256 * tilePoint.y;
/*

					var p1 = new L.Point(tileX, tileY);
					var pp1 = LMap.unproject(p1, zoom);					// Перевод экранных координат тайла в latlng
					p1.x = pp1.lng; p1.y = pp1.lat;
					var	p2 = new L.Point(tileX + 256, tileY + 256);
					var pp2 = LMap.unproject(p2, zoom);
					p2.x = pp2.lng; p2.y = pp2.lat;
					var bounds = new L.Bounds(p1, p2);
*/					
					var bounds = utils.getTileBounds(tilePoint, zoom);

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
					var st = zoom + '_' + tilePoint.x + '_' + tilePoint.y;
					var tiles = tile._layer.options.tiles;
					//if(!tiles[st]) return;					// пропускаем отсутствующие тайлы

					var bounds = utils.getTileBounds(tilePoint, zoom);
					var opt = this.options;
					if(opt.attr.bounds && !bounds.intersects(opt.attr.bounds))	{	// Тайл не пересекает границы слоя
						return;
					}

					var tileX = 256 * tilePoint.x;								// позиция тайла в stage
					var tileY = 256 * tilePoint.y;
					var identityField = tile._layer.options.identityField;

					var node = mapNodes[opt['id']];
					// tilesLoaded tilesLoadProgress
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
									var src = utils.getTileUrlVector(tile._layer, {'x':tx, 'y':ty}, tz);
									src += '&r=t';
									node['tilesLoadProgress'][sst] = true;
									gmxAPI.sendCrossDomainJSONRequest(src, function(response)
									{
										delete node['tilesLoadProgress'][sst];
										if(typeof(response) != 'object' || response['Status'] != 'ok') {
											gmxAPI.addDebugWarnings({'url': src, 'Error': 'bad response'});
											node['badTiles'][sst] = true;
											return;
										}
/*										
										var geometries = utils.parseVectorTile(node, opt['identityField'], response['Result']);
										node['dataTiles'][sst] = geometries;
*/										
										gmxAPI._listeners.dispatchEvent('onVectorTileLoaded', gmxAPI.mapNodes[opt['id']], {'tileID':sst, 'data':response['Result']});		// tile загружен
var tt = 1;

/*
var pt = response['Result'];
			var out = {};
			for (var i = 0; i < pt.length; i++)
			{
				var ph = pt[i];
				var id = ph['properties'][identityField];
				var geo = {};
				if(ph['geometry']) {
					var arr = ph['geometry']['coordinates'];
					if(ph['geometry']['type'] == 'POLYGON') arr = [ph['geometry']['coordinates']];
var tt = 1;
					drawMultiPoligon(arr, tileX, tileY, zoom);
var tt = 1;
				}
var tt = 1;
			}
			
*/
									});
									return;
								}
							}
						//}
					}
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
    gmxAPI._cmdProxy = leafletCMD;				// посылка команд отрисовщику
    gmxAPI._addProxyObject = addLeafLetObject;	// Добавить в DOM
	gmxAPI.proxyType = 'leaflet';
    gmxAPI.APILoaded = true;				// Флаг возможности использования gmxAPI сторонними модулями
})();