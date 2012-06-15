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
		'getImageSize': function(pt)	{		// определение размеров image
			var url = pt['iconUrl'];
			if(imagesSize[url]) {
				pt['imageWidth'] = imagesSize[url]['imageWidth'];
				pt['imageHeight'] = imagesSize[url]['imageHeight'];
				return;
			}
			//console.log(' getImageSize: ' + url + ' : ');
			
			var _img = L.DomUtil.create('img', 'leaflet-image-layer');
			_img.style.visibility = 'hidden';
			function getSize(ev) {
				pt['imageWidth'] = ev.target.width;
				pt['imageHeight'] = ev.target.height;
				imagesSize[url] = pt;
				gmxAPI._listeners.dispatchEvent('onIconLoaded', null, url);		// image загружен
			}
			L.DomEvent.addListener(_img, 'load', getSize, this);
			_img.src = url;
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
				if(node['subType'] == 'filter') {				// отрисовка фильтра
					//utils.drawFilter(node);
					//node.leaflet = utils.drawNode(node, regularStyle);
					var tt = 1;
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
			var geo = node.geometry;
			var featureparse = function(e) {
				if('setStyle' in e.layer) {
					var st = utils.evalStyle(style, node);
					e.layer.setStyle(st);
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
		'unionGeometry': function(bounds, geo, geo1)	{		// Обьединение 2 геометрий по границам тайла	need TODO
			var res = geo;
			var type = geo.type;
			if(type === 'Point') 					{}
			else if(type === 'Polygon')				{
				for (var i = 0; i < geo1['coordinates'].length; i++)
				{
					res['coordinates'].push(geo1['coordinates'][i]);
				}
			}
			return res;
		}
		,
		'drawGeometry': function(geo, featureparse)	{			// отрисовка GeoJSON геометрии
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
		'getLastIndex': function(pNode)	{			// Получить следующий zIndex в mapNode
			var n = (pNode ? pNode.children.length : 0);
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
		,'dec2hex': function(i)	{					// convert decimal to hex
			return (i+0x1000000).toString(16).substr(-6).toUpperCase();
		}
		,'getTileBounds': function(tilePoint, zoom)	{			// получить Bounds тайла
			var tileX = 256 * tilePoint.x;						// позиция тайла в stage
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
		pt['zIndex'] = utils.getLastIndex(pNode);
		mapNodes[id] = pt;
		if(pt['geometry']['type']) {
			utils.repaintNode(pt, true);
			if(pt['leaflet']) {
				pt['leaflet']['options']['resID'] = id;
				pt['leaflet'].on('click', function(e) {		// Проверка zIndex слоя
					var resID = e.target.options['resID'];
					var rNode = mapNodes[resID];
					var pNode = mapNodes[rNode['parentId']];
					if(pNode['handlers'] && pNode['handlers']['onClick']) {
						var prop = rNode.properties || rNode.geometry.properties;
						pNode['resIDLast'] = resID;
						pNode['handlers']['onClick'].call(this, rNode['parentId'], prop, {'onClick': true});
						//pNode['handlers']['onClick'].call(this, gmxAPI.mapNodes[rNode['parentId']]);
					}
var tt =1;
				});
			
				if(ph['_notVisible']) {
					pt['leaflet']._isVisible = false;
				} else {
					pNode.group.addLayer(pt['leaflet']);
					pt['leaflet']._isVisible = true;
				}
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
							pNode = mapNodes[node['parentId']]['group'];
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
						pNode = mapNodes[node['parentId']]['group'];
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
		,'getMouseX':	function()	{ return (mousePos ? mousePos.lng : 0); }		// Позиция мыши X
		,'getMouseY':	function()	{ return (mousePos ? mousePos.lat : 0);	}		// Позиция мыши Y
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
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
//console.log(cmd + ' : ' + ret);
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
			hash[st] = bounds;
		}
		return hash;
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
		node['badTiles'] = {};
		node['objectsData'] = {};				// Обьекты из тайлов по identityField
		node['deletedObjects'] = {};
		node['editedObjects'] = {};
		
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
		if(node['parentId']) option['parentId'] = node['parentId'];
		
		node['tiles'] = getTilesBounds(inpAttr.dataTiles);
		//option['tiles'] = getTilesBounds(inpAttr.dataTiles);
		option['attr'] = attr;
		option['tileFunc'] = inpAttr['tileFunction'];
		var myLayer = new L.TileLayer.VectorTiles(option);
		node['leaflet'] = myLayer;
		myLayer._isVisible = (layer.isVisible ? true : false);
		if(myLayer._isVisible) 
			LMap.addLayer(myLayer);

		function objectsToFilters(arr, tileID)	{				// Разложить массив обьектов по фильтрам
			var out = {};

			for (var i = 0; i < arr.length; i++)
			{
				var ph = arr[i];
if(!ph) return;
				var prop = ph['properties'];
				var propHiden = {};
				var _notVisible = false;
				if(TemporalColumnName) {
					var zn = prop[TemporalColumnName] || '';
					zn = zn.replace(/(\d+)\.(\d+)\.(\d+)/g, '$2/$3/$1');
					var dt = new Date(zn).getTime()/1000;
					propHiden['unixTimeStamp'] = dt;
					if(node['temporal'] && (node['temporal']['ut1'] > dt || node['temporal']['ut2'] < dt)) _notVisible = true;
				}
				if(tileID) {
					propHiden['tileID'] = tileID;
				}
				
				var id = prop[identityField];
				var geo = {};
				if(ph['geometry']) {
					if(!ph['geometry']['type']) ph['geometry']['type'] = typeGeo;
					geo = utils.parseGeometry(gmxAPI.from_merc_geometry(ph['geometry']));
				}
				if(node['objectsData'][id]) {		// Обьект уже имеется - нужна склейка геометрий
					var pt = node['objectsData'][id];
					var rnode = mapNodes[pt['resID']];
					geo = utils.unionGeometry(node['tiles'][rnode.propHiden['tileID']], geo, pt['geometry']);
var tt =1;
					removeNode(rnode);
				}
				
				var resID = '';
				var toFilters = [];
				for(var j=0; j<node.filters.length; j++) {
					var filterID = node.filters[j];
					var filter = mapNodes[node.filters[j]];
					var flag = filter.sqlFunction(prop);
					if(flag) {
						var tmp = {
							'obj': {
								'objectId': filterID
							}
							,
							'_notVisible': _notVisible
							,
							'attr': {
								"geometry": geo
								,
								"properties": prop
								,
								"propHiden": propHiden
							}
						};
						resID = addObject(tmp);
						toFilters.push(resID);
break;
					}
				}
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

		node.parseVectorTile = function(data, tileID)	{				// парсинг векторного тайла
			var out = objectsToFilters(data, tileID);
			return out;
		}

		node.refreshFilter = function(fid)	{		// обновить фильтр
			var filterNode = mapNodes[fid];
			if(!filterNode) return;						// Нода не была создана через addObject
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

		// Обработчик события - onVectorTileLoaded
		gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onVectorTileLoaded', 'obj': gmxAPI.mapNodes[id], 'func': function(ph) {
				var nodeLayer = mapNodes[id];
				var tileID = ph['tileID'];
				var data = ph['data'];

				nodeLayer['dataTiles'][tileID] = nodeLayer.parseVectorTile(data, tileID);
//console.log(' onVectorTileLoaded: ' + data.length + ' : ');
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
					//zoomAnimation: false,	
					crs: L.CRS.EPSG3395
					//'crs': L.CRS.EPSG3857 // L.CRS.EPSG4326 // L.CRS.EPSG3395 L.CRS.EPSG3857
				}
			);
			gmxAPI._leafLetMap = LMap;				// Внешняя ссылка на карту

			var pos = new L.LatLng(50, 35);
			//var pos = new L.LatLng(50.499276, 35.760498);
			LMap.setView(pos, 3);
			//LMap.on('moveend', function(e) { gmxAPI._updatePosition(e); });
			LMap.on('move', function(e) { gmxAPI._updatePosition(e); });
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
					//var st = zoom + '_' + tilePoint.x + '_' + tilePoint.y;

					var bounds = utils.getTileBounds(tilePoint, zoom);
					var opt = this.options;
					if(opt.attr.bounds && !bounds.intersects(opt.attr.bounds))	{	// Тайл не пересекает границы слоя
						return;
					}
					var node = mapNodes[opt['id']];

					var tileX = 256 * tilePoint.x;								// позиция тайла в stage
					var tileY = 256 * tilePoint.y;
					var identityField = tile._layer.options.identityField;
					var tiles = node['tiles'];
					//var tiles = tile._layer.options.tiles;
					//if(!tiles[st]) return;					// пропускаем отсутствующие тайлы

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
									var srcArr = utils.getTileUrlVector(tile._layer, {'x':tx, 'y':ty}, tz);
									if(typeof(srcArr) === 'string') srcArr = [srcArr];

									var counts = srcArr.length;
									var needParse = [];
									(function(tileID) {
										for (var i = 0; i < srcArr.length; i++)
										{
											var src = srcArr[i] + '&r=t';
											node['tilesLoadProgress'][tileID] = true;
//	console.log(tileID + ' : ' + src + ' : __________');
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
												//if(response['Result'] && response['Result'].length)	node['needParse'] = node['needParse'].concat(response['Result']);
//	console.log(tileID + ' : ' + src);

												if(counts < 1) {
													gmxAPI._listeners.dispatchEvent('onVectorTileLoaded', gmxAPI.mapNodes[opt['id']], {'tileID':tileID, 'data':needParse});		// tile загружен
//console.log(tileID + ' : __________' + src);
													needParse = [];
												}
											});
										}
									})(sst);
									//return;
								}
							}
						//}
					}
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
    gmxAPI._cmdProxy = leafletCMD;				// посылка команд отрисовщику
    gmxAPI._addProxyObject = addLeafLetObject;	// Добавить в DOM
	gmxAPI.proxyType = 'leaflet';
    gmxAPI.APILoaded = true;					// Флаг возможности использования gmxAPI сторонними модулями
gmxAPI._testme = mapNodes;
})();