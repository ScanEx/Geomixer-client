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
	var regProps = [			// массив регулярных выражений атрибутов обьекта  свойств 
		/\[([^\]]+)\]/i,
		/\"([^\"]+)\"/i,
		/\b([^\b]+)\b/i
	];
	
	var moveToTimer = null;
	var utils = {							// Утилиты leafletProxy
		'getMapImage': function(attr)	{			//получить PNG карты
			/*var pos = utils.getPixelMap();
			var canvas = document.createElement('canvas');
			canvas.width = pos.x;
			canvas.height = pos.y;
			var ctx = canvas.getContext('2d');
			var divOut = gmxAPI._div;
			//var divOut = document.getElementById("random_2");
			
			ctx.drawImage(divOut, 0, 0);
ctx.strokeRect(2, 2, 253, 253);
ctx.font = '24px "Tahoma"';
ctx.fillText('Приветики ! апапп ghhgh', 10, 128);
			
			return canvas.toDataURL();*/
		}
		,
		'chkClassName': function(node, className, stopNode)	{			//проверить есть заданный className по ветке родителей до ноды
			if(!node || node == stopNode) return false;
			if(typeof(node['className']) == 'string' && node['className'].indexOf(className) != -1) return true;
			if(node.parentNode) return utils.chkClassName(node.parentNode, className, stopNode);
		}
		,
		'getScaleImage': function(img, sx, sy)	{			//получить img отскалированный в Canvas
			var canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			var ctx = canvas.getContext('2d');
			if(!sy) sy = sx;
			ctx.scale(sx * img.width, sy * img.height);
			var divOut = gmxAPI._div;
			ctx.drawImage(img, 0, 0);
			return canvas;
		}
		,
		'prpLayerBounds': function(geom)	{			// Подготовка атрибута границ слоя
			var out = {};
			var type = geom.type;
			out['type'] = type;
			var arr = null;
			if(geom.coordinates) {						// Формируем MULTIPOLYGON
				if(type == 'POLYGON' || type == 'Polygon') {
					arr = [geom.coordinates];
				} else if(type == 'MULTIPOLYGON' || type == 'MultiPolygon') {
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
								var p = (typeof(pol[j1]) === 'object' ? new L.Point( pol[j1][0], pol[j1][1] ) : new L.Point( pol[j1++], pol[j1] ));
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
			return out;
		}
		,
		'prpLayerAttr': function(layer, node)	{				// Подготовка атрибутов слоя
			var out = {};
			if(layer) {
				if(layer.properties) {
					var prop = layer.properties;
					if(node['type'] == 'RasterLayer') {			// растровый слой
						out['minZoom'] = (prop.MinZoom ? prop.MinZoom : 1);
						out['maxZoom'] = (prop.MaxZoom ? prop.MaxZoom : 20);
						if(prop.type == 'Overlay') out['isOverlay'] = true;
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
					var pt = utils.prpLayerBounds(layer.geometry);
					if(pt['geom']) out['geom'] = pt['geom'];					// Массив Point границ слоя
					if(pt['bounds']) out['bounds'] = pt['bounds'];				// Bounds слоя
					if(layer.mercGeometry) {
						var pt = utils.prpLayerBounds(layer.mercGeometry);
						if(pt['geom']) {
							out['mercGeom'] = pt['geom'];				// Массив Point границ слоя в merc
							//out['mercGeom'] = [L.LineUtil.simplify(pt['geom'][0], 120)];
						}
					}
				}
			}
			return out;
		}
		,
		'getLabelSize': function(txt, style)	{			// Получить размер Label
			var out = new L.Point(0, 0);
			if(style) {
				var ptx = gmxAPI._leaflet['labelCanvas'].getContext('2d');
				ptx.clearRect(0, 0, 512, 512);
				var sizeLabel = style['size'] || 12;
				var color = style['color'] || 0;
				var haloColor = style['haloColor'] || 0;
				style['fontStyle'] = sizeLabel + 'px "Arial"';
				ptx.font = style['fontStyle'];
				style['fillStyle'] = gmxAPI._leaflet['utils'].dec2rgba(color, 1);
				style['strokeColor'] = gmxAPI._leaflet['utils'].dec2rgba(haloColor, 1);
				
				ptx.fillStyle = style['fillStyle'];
				ptx.fillText(txt, 0, 0);
				out.x = ptx.measureText(txt).width;
				out.y = sizeLabel + 2;
			}
			return out;
		}
		,
		'chkPointWithDelta': function(chkBounds, point, attr)	{			// Проверка точки(с учетом размеров) на принадлежность Bounds
			var mInPixel = gmxAPI._leaflet['mInPixel'];
			return (
				point.x < (chkBounds.min.x - (attr.sx + attr.sxLabelLeft)/mInPixel)
				|| point.x > (chkBounds.max.x + (attr.sx + attr.sxLabelRight)/mInPixel)
				|| point.y < (chkBounds.min.y - (attr.sy + attr.syLabelBottom)/mInPixel)
				|| point.y > (chkBounds.max.y + (attr.sy + attr.syLabelTop)/mInPixel)
				? false : true);
		}
		,
		'isPointInPolygon': function(chkPoint, poly)	{			// Проверка точки на принадлежность полигону
			var isIn = false;
			var p1 = poly[0];
			for (var i = 1; i < poly.length; i++)
			{
				var p2 = poly[i];
				if (chkPoint.x > Math.min(p1.x, p2.x)) 
				{
					if (chkPoint.x <= Math.max(p1.x, p2.x)) 
					{
						if (chkPoint.y <= Math.max(p1.y, p2.y)) 
						{
							if (p1.x != p2.x) 
							{
								var xinters = (chkPoint.x - p1.x)*(p2.y - p1.y)/(p2.x - p1.x) + p1.y;
								if (p1.y == p2.y || chkPoint.y <= xinters) isIn = !isIn;
							}
						}
					}
				}
				p1 = p2;
			}
			return isIn;
		}
		,
		'isPointInPolygonArr': function(chkPoint, poly)	{			// Проверка точки на принадлежность полигону в виде массива
			var isIn = false;
			var x = chkPoint[0];
			var y = chkPoint[1];
			var p1 = poly[0];
			for (var i = 1; i < poly.length; i++)
			{
				var p2 = poly[i];
				var xmin = Math.min(p1[0], p2[0]);
				var xmax = Math.max(p1[0], p2[0]);
				var ymax = Math.max(p1[1], p2[1]);
				if (x > xmin) 
				{
					if (x <= xmax) 
					{
						if (y <= ymax) 
						{
							if (p1[0] != p2[0]) 
							{
								var xinters = (x - p1[0])*(p2[1] - p1[1])/(p2[0] - p1[0]) + p1[1];
								if (p1[1] == p2[1] || y <= xinters) isIn = !isIn;
							}
						}
					}
				}
				p1 = p2;
			}
			return isIn;
		}
		,
		'getMapPosition': function()	{			// Получить позицию карты
			var zoom = LMap.getZoom();
			if(!zoom) {
				return;
			}
			var pos = LMap.getCenter();
			var size = LMap.getSize();
			var vbounds = LMap.getBounds();
			var nw = vbounds.getNorthWest();
			var se = vbounds.getSouthEast();
			var dx = (nw['lng'] < -360 ? 360 : 0);
			var ext = {
				'minX': nw['lng'] + dx
				,'minY': se['lat']
				,'maxX': se['lng'] + dx
				,'maxY': nw['lat']
			};
			var currPosition = {
				'z': zoom
				,'stageHeight': size['y']
				,'x': gmxAPI.merc_x(pos['lng'])
				,'y': gmxAPI.merc_y(pos['lat'])
				,'latlng': {
					'x': pos['lng']
					,'y': pos['lat']
					,'mouseX': utils.getMouseX()
					,'mouseY': utils.getMouseY()
					,'extent': ext
				}
			};
			currPosition['mouseX'] = gmxAPI.merc_x(currPosition['latlng']['mouseX']);
			currPosition['mouseY'] = gmxAPI.merc_x(currPosition['latlng']['mouseY']);
			currPosition['extent'] = {
				'minX': gmxAPI.merc_x(ext['minX']),
				'minY': gmxAPI.merc_y(ext['minY']),
				'maxX': gmxAPI.merc_x(ext['maxX']),
				'maxY': gmxAPI.merc_y(ext['maxY'])
			};
			return currPosition;
		}
		,
		'runMoveTo': function(attr)	{				//позиционирует карту по координатам
			if(moveToTimer) clearTimeout(moveToTimer);
			moveToTimer = setTimeout(function() {
				if(!attr && !gmxAPI.map.needMove) return;
				var px = (attr ? attr['x'] : (gmxAPI.map.needMove ? gmxAPI.map.needMove.x : 0));
				var py = (attr ? attr['y'] : (gmxAPI.map.needMove ? gmxAPI.map.needMove.y : 0));
				var z = (attr ? attr['z'] : (gmxAPI.map.needMove ? gmxAPI.map.needMove.z : 1));
				var pos = new L.LatLng(py, px);
				LMap.setView(pos, z, true);
				gmxAPI.map.needMove = null;
			}, 50);
		}
		,
		'getPixelMap': function()	{				// Получение текущий размер карты в pixels
			var vBounds = LMap.getBounds();
			var vpNorthWest = vBounds.getNorthWest();
			var vpSouthEast = vBounds.getSouthEast();
			var vp1 = LMap.project(vpNorthWest);
			var vp2 = LMap.project(vpSouthEast);
			return new L.Point(vp2.x - vp1.x, vp2.y - vp1.y);
		}
		,
		'chkBoundsVisible': function(b)	{					// проверить видимость Bounds с учетом сдвигов по X
			var vbounds = LMap.getBounds();
			var nw = vbounds.getNorthWest();
			var se = vbounds.getSouthEast();
			var vb = new L.Bounds(new L.Point(nw['lng'], nw['lat']), new L.Point(se['lng'], se['lat']));
			if(vb.intersects(b)) return true;
			var tb = new L.Bounds(new L.Point(b.min.x + 360, b.min.y), new L.Point(b.max.x + 360, b.max.y));
			if(vb.intersects(tb)) return true;
			tb = new L.Bounds(new L.Point(b.min.x - 360, b.min.y), new L.Point(b.max.x - 360, b.max.y));
			if(vb.intersects(tb)) return true;
			return false;
		}
		,
		'getOSMShift': function()	{				// Получение сдвига OSM
			var pos = LMap.getCenter();
			var point = LMap.project(pos);
			var p1 = LMap.project(new L.LatLng(gmxAPI.from_merc_y(utils.y_ex(pos.lat)), pos.lng), LMap.getZoom());
			return point.y - p1.y;
		}
		,
		'chkMouseHover': function(attr, fName)	{					// проверка Hover мыши
			//if(attr['tID'] && attr['tID'].indexOf('_drawing') > 0 && gmxAPI.map.drawing.chkMouseHover(attr, fName)) return true;
			if(gmxAPI.map.drawing.chkMouseHover(attr, fName)) return true;
			return false;
		}
		,
		'chkGlobalEvent': function(attr)	{					// проверка Click на перекрытых нодах
			if(!attr || !attr['evName']) return;
			var evName = attr['evName'];
//console.log('chkGlobalEvent', evName, gmxAPI._drawing['activeState']);
			if(!gmxAPI._drawing['activeState']) {
			//var standartTools = gmxAPI.map.standartTools;
			//if(!gmxAPI._leaflet['curDragState'] && standartTools && standartTools['activeToolName'] === 'move') {	// проверяем векторные слои только в режиме перемещения и не рисуя
				var from = gmxAPI.map.layers.length - 1;
				for (var i = from; i >= 0; i--)
				{
					var child = gmxAPI.map.layers[i];
					if(!child.isVisible) continue;
					var mapNode = mapNodes[child.objectId];
					if(mapNode['eventsCheck']) {
						if(mapNode['eventsCheck'](evName, attr)) return true;
					}
				}
			}
			if(attr['tID']) {
				var gmxNode = null;
				if(attr['tID'].indexOf('_drawing') > 0) {
					gmxNode = gmxAPI.map.drawing.getHoverItem(attr);
				}
				if(gmxNode && gmxNode['stateListeners'][evName]) {
					if(gmxAPI._listeners.dispatchEvent(evName, gmxNode, {'attr':attr})) return true;
				}
			}
			if(attr['node'] && attr['hNode'] && attr['hNode']['handlers'][evName]) {
				if(attr['hNode']['handlers'][evName](attr['node']['id'], attr['node'].geometry.properties, {'ev':attr['ev']})) return true;
			}
			if(gmxAPI.map['stateListeners'][evName]) {
				if(gmxAPI._listeners.dispatchEvent(evName, gmxAPI.map, {'attr':attr})) return true;
			}
		}
		,
		'chkVisibilityByZoom': function(id)	{				// проверка видимости обьекта - по minZ maxZ
			var node = mapNodes[id];
			if(!node || node['type'] === 'map') return true;
			var pNode = mapNodes[node['parentId']];
			var zoom = LMap.getZoom();
			var flag = ((node['minZ'] && zoom < node['minZ']) || (node['maxZ'] && zoom > node['maxZ']) ? false 
				: (pNode ? utils.chkVisibilityByZoom(pNode.id) : true));
			return flag;
		}
		,
		'chkVisibleObject': function(id)	{				// проверка видимости обьекта - по isVisible
			var node = mapNodes[id];
			if(!node) return true;
			if(node.isVisible === false) return false;
			return utils.chkVisibleObject(node['parentId']);
		}
		,
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
		'getTileListByBounds': function(bounds, zoom)	{		// получить список тайлов по extent на определенном zoom
			var res = [];
			var southWest = bounds._southWest,
				northEast = bounds._northEast;
			var tileSize = Math.pow(2, 8 - zoom) * 156543.033928041;
			var minx = Math.floor(gmxAPI.merc_x(southWest.lat)/tileSize);
			var miny = Math.floor(gmxAPI.merc_y(southWest.lng)/tileSize);
			var maxx = Math.ceil(gmxAPI.merc_x(northEast.lat)/tileSize);
			var maxy = Math.ceil(gmxAPI.merc_y(northEast.lng)/tileSize);
			for (var x = minx; x < maxx; x++)
			{
				for (var y = miny; y < maxy; y++)
				{
					res.push({'x': x, 'y': y, 'z': zoom});
				}
			}
			return res;
		}
		,
		'getImageSize': function(pt, flag, id)	{				// определение размеров image
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
				gmxAPI._listeners.dispatchEvent('onIconLoaded', null, id);		// image загружен
			}
			function error(ev) {
				pt['imageWidth'] = 1;
				pt['imageHeight'] = 0;
				gmxAPI.addDebugWarnings({'url': url, 'func': 'getImageSize', 'Error': 'image not found'});
			}
			L.DomEvent.addListener(_img, 'load', getSize, this);
			L.DomEvent.addListener(_img, 'error', error, this);
			_img.src = url;
		}
		,'getMouseX':	function()	{ return (gmxAPI._leaflet['mousePos'] ? gmxAPI._leaflet['mousePos'].lng : 0); }			// Позиция мыши X
		,'getMouseY':	function()	{ return (gmxAPI._leaflet['mousePos'] ? gmxAPI._leaflet['mousePos'].lat : 0);	}		// Позиция мыши Y
		,
		'parseStyle': function(st, id)	{			// перевод Style Scanex->leaflet
			var pt =  {
			};
			if(!st) return null;
			
			pt['label'] = false;
			if('label' in st) {											//	Есть стиль label
				pt['label'] = {};
				var ph = st['label'];
				if('color' in ph) pt['label']['color'] = ph['color'];
				if('haloColor' in ph) pt['label']['haloColor'] = ph['haloColor'];
				if('size' in ph) pt['label']['size'] = ph['size'];
				if('spacing' in ph) pt['label']['spacing'] = ph['spacing'];
				if('align' in ph) pt['label']['align'] = ph['align'];
				if('dx' in ph) pt['label']['dx'] = ph['dx'];
				if('dy' in ph) pt['label']['dy'] = ph['dy'];
				if('field' in ph) pt['label']['field'] = ph['field'];
			}
			pt['marker'] = false;
			if('marker' in st && 'image' in st['marker']) {				//	Есть стиль marker
				pt['marker'] = true;
				var ph = st['marker'];
				if('color' in ph) pt['color'] = ph['color'];
				if('opacity' in ph) pt['opacity'] = ph['opacity'];
				if('size' in ph) pt['size'] = ph['size'];
				if('scale' in ph) pt['scale'] = ph['scale'];
				if('minScale' in ph) pt['minScale'] = ph['minScale'];
				if('maxScale' in ph) pt['maxScale'] = ph['maxScale'];
				if('image' in ph) {
					pt['iconUrl'] = ph['image'];
					utils.getImageSize(pt, true, id);
				}
				
				if('angle' in ph) pt['rotate'] = ph['angle'];
				if('center' in ph) pt['center'] = ph['center'];
				if('dx' in ph) pt['dx'] = ph['dx'];
				if('dy' in ph) pt['dy'] = ph['dy'];
				
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
					pt['opacity'] = ('opacity' in ph ? ph['opacity'] : 100);
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
/*		
		,
		'parseSQL': function(sql)	{							// парсинг SQL строки
			var zn = sql;
			if(typeof(zn) === 'string') {
				zn = zn.replace(/ AND /g, ' && ');
			}
			return zn
		}
*/
		,
		'isPropsInString': function(st)	{				// парсинг значений свойств в строке
			if(typeof(st) === 'string') {
				for(var i in regProps) {
					var matches = regProps[i].exec(st);
					if(matches && matches.length > 0) return true;
				}
			}
			return false;
		}
		,
		'isPropsInStyle': function(style)	{				// парсинг значений свойств в строке
			for(var key in style) {
				if(utils.isPropsInString(style[key])) return true;
			}
			return false;
		}
		,
		'chkPropsInString': function(str, prop, type)	{				// парсинг значений свойств в строке
			var zn = str;
			if(typeof(zn) === 'string') {
				if(zn.length === 0) return true;
				var zn1 = zn.replace(/\'([^\']+)\'/g, '');
				var reg = /\b([^\b]+?)\b/gm;
				var arr = zn.match(reg);
				var reg = /\[([^\]]+)\]/i;
				if(type == 1) reg = /\"([^\"]+)\"/i;
				else if(type == 2) reg = /\b([^\b]+)\b/i;
				
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
		'evalStyle': function(style, node)	{								// парсинг стиля лефлета
			var out = { 'ready': true };
			var prop = (node ? node.properties || node.geometry.properties : null);
			//if(node.propHiden) for(var key in node.propHiden) prop['_'+key] = node.propHiden[key];
			for(var key in style) {
				var zn = style[key];
				if(key === 'fillColor' || key === 'color') {
					if(prop) {
						if(key + 'Function' in style) zn = style[key + 'Function'](prop);
						else if(utils.isPropsInString(zn)) zn = utils.chkPropsInString(style[key], prop);
						//if(prop && utils.isPropsInString(zn)) zn = (style['colorFunction'] ? style.colorFunction(prop) : utils.chkPropsInString(style[key], prop));
					}
					out[key + '_rgba'] = utils.dec2rgba(zn, 1);
					zn = utils.dec2hex(zn);
					if(zn.substr(0,1) != '#') zn = '#' + zn;
				} else if(key === 'fillOpacity' || key === 'opacity') {
					if(prop && utils.isPropsInString(zn)) zn = utils.chkPropsInString(style[key], prop);
					zn = zn / 100;
				}
				out[key] = zn;
			}
			return out;
		}
		,
		'getNodeProp': function(node, type, recursion)	{					// получить свойство ноды - рекурсивно
			if(!node) return null;
			if(type in node) return node[type];
			if(recursion) return (node.parentId in mapNodes ? utils.getNodeProp(mapNodes[node.parentId], type, recursion) : null);
		}
		,
		'removeLeafletNode': function(node)	{								// Удалить Leaflet ноду - рекурсивно
			if(!node['parentId']) return;
			var pNode = mapNodes[node['parentId']];
			var pGroup = (pNode ? pNode['group'] : LMap);
			if(node['group']) {
				if(node['marker']) {
					if(node['group']['_layers'][node['marker']['_leaflet_id']]) node['group'].removeLayer(node['marker']);
				}
				pGroup.removeLayer(node['group']);
			}
			if(node['leaflet'] && pGroup['_layers'][node['leaflet']['_leaflet_id']]) pGroup.removeLayer(node['leaflet']);
		}
		,
		'addCanvasIcon': function(node, regularStyle)	{				// создать Canvas иконку 
			if(!node.propHiden || !node.propHiden['getPos'] || !node.propHiden['drawMe']) return null;
			var point = node.propHiden['getPos']();
			var canvasIcon = L.canvasIcon({
				className: 'my-canvas-icon'
				,'node': node
				,'drawMe': node.propHiden['drawMe']
				//,iconAnchor: new L.Point(12, 12) // also can be set through CSS
			});
			return L.marker([point['y'], point['x']], {icon: canvasIcon, clickable: false});
		}
		,
		'setVisibleNode': setVisibleNode									// Рекурсивное изменение видимости
		,
		'repaintNode': function(node, recursion, type)	{					// перерисовать ноду - рекурсивно
			if(!node) {
				return null;
			}
			if(!type) type = 'regularStyle';
			var regularStyle = utils.getNodeProp(node, type, true);
			if(regularStyle) {				// Стиль определен
				var pNode = mapNodes[node['parentId']];
				if(node['type'] == 'filter') {				// отрисовка фильтра
					//utils.drawFilter(node);
					//node.leaflet = utils.drawNode(node, regularStyle);
					pNode.refreshFilter(node.id);
				} else if(node['isSetImage']) {
					if('refreshMe' in node) node['refreshMe']();				// свой отрисовщик
				} else if(node.geometry && node.geometry.type) {
					utils.removeLeafletNode(node);

					if(!utils.chkVisibleObject(node.id) || !utils.chkVisibilityByZoom(node.id)) {		// если обьект невидим пропускаем
						utils.setVisibleNode({'obj': node, 'attr': false});
						return;
					}

					node.geometry.id = node.id;
					if(regularStyle['iconUrl'] && !regularStyle['imageWidth']) {		// нарисовать после загрузки onIconLoaded
						gmxAPI._leaflet['drawManager'].add(node.id);			// добавим в менеджер отрисовки
						return;
					} else {
						if(node['subType'] === 'drawingFrame') {
							node.leaflet = new L.FeatureGroup([]);
							if(node['leaflet']) {
								utils.setVisibleNode({'obj': node, 'attr': true});
							}
						} else if(node['refreshMe']) { 
							node['refreshMe']();
							return;
						} else {
							node.leaflet = utils.drawNode(node, regularStyle);
							setNodeHandlers(node.id);
							//node['leaflet']._isVisible = false;
							if(node['leaflet']) {
								utils.setVisibleNode({'obj': node, 'attr': true});
							}
						}
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
		'drawPoint': function(node, style)	{			// отрисовка POINT геометрии
			var out = null;
			var styleType = (style['iconUrl'] ? 'marker' : (style['stroke'] || style['fill'] ? 'rectangle' : ''));
			var geo = node.geometry;
			var pos = geo.coordinates;
			var prop = geo.properties;
			if(styleType === 'marker') {						// стиль маркер
				var opt = {
					iconUrl: style['iconUrl']
					//,clickable: false
					//,shadowUrl: null
					,'from': node.id
					,iconAnchor: new L.Point(0, 0)
					//,'zIndexOffset': -1000
				};
				if(!style['scale']) style['scale'] = 1;
				var zn = utils.chkPropsInString(style['scale'], prop);
				var ww = Math.floor(style['imageWidth'] * zn);
				var hh = Math.floor(style['imageHeight'] * zn);
				opt['iconSize'] = new L.Point(ww, hh);
				style['iconSize'] = opt['iconSize'];
				if(style['center']) opt['iconAnchor'] = new L.Point(ww/2, hh/2);
				else {
					if(style['dx']) opt['iconAnchor'].x -= style['dx'];
					if(style['dy']) opt['iconAnchor'].y -= style['dy'];
				}
				if(style['rotate']) opt['rotate'] = style['rotate'];
				
				var nIcon = L.Icon.extend({
					'options': opt
				});
				var optMarker = {
					icon: new nIcon()
					,'from': node.id
					,'rotate': opt['rotate']
					,'toPaneName': 'overlayPane'
				};
				if(node['subType'] === 'drawing') {
					optMarker['draggable'] = true;
				}
				
				out = new L.GMXMarker(new L.LatLng(pos[1], pos[0]), optMarker);
				if(style['label'] && node['label']) {
					setLabel(node.id, opt['iconAnchor']);
				}
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
			if(out && node['subType'] === 'drawing') {
				var chkDrag = function(e) {		// Drag на drawing обьекте
					var eType = e.type;
					var gmxNode = gmxAPI.mapNodes[node.id];		// Нода gmxAPI
					var ph = {
						'obj':gmxNode
						,'attr': {
							'id': e.target.options.from
							,'x': e.target._latlng.lng
							,'y': e.target._latlng.lat
							,'e': e
						}
					};
					gmxAPI._listeners.dispatchEvent(eType, gmxNode, ph);		// tile загружен
				};
				out.on('drag', chkDrag);		// Drag на drawing обьекте
				//out.on('dragstart', chkDrag);
				out.on('dragend', chkDrag);
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
				style: ('ready' in style ? style : utils.evalStyle(style, node))
			});
			return out;
		}
		,
		'drawMultiPolygon': function(node, style)	{			// отрисовка Polygon геометрии
			var geojsonFeature = {
				"type": "Feature",
				"properties": node.properties || {},
				"geometry": node.geometry
			};
			var out = L.geoJson(geojsonFeature, {
				style: ('ready' in style ? style : utils.evalStyle(style, node))
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
		'chkPolygon': function(geo)	{			// перевод геометрии Scanex->leaflet
			if(geo.type === 'Polygon') {
				for (var i = 0; i < geo['coordinates'].length; i++)
				{
					var coords = geo['coordinates'][i];
					var len = coords.length - 1;
					if(coords[0][0] != coords[len][0] || coords[0][1] != coords[len][1]) coords.push(coords[0]);
				}
			}
		}
		,
		'fromLeafletTypeGeo': function(type)	{			// перевод геометрии type leaflet->Scanex
			if(type === 'MultiPolygon') 			type = 'MULTIPOLYGON';
			else if(type === 'Polygon')				type = 'POLYGON';
			else if(type === 'Point')				type = 'POINT';
			else if(type === 'MultiPolyline')		type = 'MULTILINESTRING';
			else if(type === 'Polyline')			type = 'LINESTRING';
			return type;
		}
		,
		'fromScanexTypeGeo': function(type)	{			// перевод геометрии type Scanex->leaflet
			if(type === 'MULTIPOLYGON') 			type = 'MultiPolygon';
			else if(type === 'POLYGON')				type = 'Polygon';
			else if(type === 'MultiPoint')			type = 'MultiPoint';
			else if(type === 'POINT')				type = 'Point';
			else if(type === 'MULTILINESTRING')		type = 'MultiPolyline';
			else if(type === 'LINESTRING')			type = 'Polyline';
			else if(type === 'GeometryCollection')	type = 'GeometryCollection';
			return type;
		}
		,
		'parseGeometry': function(geo, boundsFlag)	{			// перевод геометрии Scanex->leaflet
			var pt = gmxAPI.transformGeometry(geo, function(it){return it;}, function(it){return it;});
			if(boundsFlag) {
				//var bounds = new L.LatLngBounds(p1, p2);
			}
			if(geo['type'] === 'LINESTRING') geo['coordinates'] = [geo['coordinates']];
			pt.type = utils.fromScanexTypeGeo(pt.type);
			/*
			if(type) pt['type'] = type;
			if(type === 'MULTIPOLYGON') 			pt['type'] = 'MultiPolygon';
			else if(type === 'POLYGON')				{ pt['type'] = 'Polygon'; utils.chkPolygon(pt); }
			else if(type === 'MultiPoint')			pt['type'] = 'MultiPoint';
			else if(type === 'POINT')				pt['type'] = 'Point';
			else if(type === 'MULTILINESTRING')		pt['type'] = 'MultiPolyline';
			else if(type === 'LINESTRING')			pt['type'] = 'Polyline';
			else if(type === 'GeometryCollection')	pt['type'] = 'GeometryCollection';
			//var geojson = new L.GeoJSON();
			//geojson.addGeoJSON(pt);
			*/
			return pt;
		}
		,
		transformPolygon: function(geom)				// получить Scanex Polygon
		{
			var out = {
				'type': 'POLYGON'
			}
			var coords = [];
			for (var i = 0; i < geom['coordinates'].length; i++)
			{
				var coords1 = [];
				for (var j = 0; j < geom['coordinates'][i].length; j++)
				{
					var point = geom['coordinates'][i][j];
					//coords1.push([point.x, point.y]);
					coords1.push([gmxAPI.from_merc_x(point.x), gmxAPI.from_merc_y(point.y)]);
				}
				coords.push(coords1);
			}
			out['coordinates'] = coords;
			return out;
		}
		,
		transformGeometry: function(geom)			// трансформация геометрии leaflet->Scanex
		{
			if(!geom) return geom;
			if(geom.type === 'Polygon')	return utils.transformPolygon(geom);
		}
		,
		fromTileGeometry: function(geom, tileBounds)				// преобразование геометрий из тайлов
		{
			var out = null;
			if(geom) {
				if(geom['type'] === 'POINT') {
					out = gmxAPI._leaflet['PointGeometry'](geom, tileBounds);
				} else if(geom['type'] === 'MULTILINESTRING') {
					out = gmxAPI._leaflet['MultiPolyline'](geom, tileBounds);
				} else if(geom['type'] === 'LINESTRING') {
					out = gmxAPI._leaflet['LineGeometry'](geom, tileBounds);
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
				}
				else if(geo1.type === 'MultiPolygon')
				{
					geo.addMembers(geo1);
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
//console.log('11111111111 bringToDepth ' , obj.id, obj['zIndex'], zIndex); 
			//obj['zIndex'] = zIndex;
			if(!obj['leaflet']) return;
			var lObj = obj['leaflet'];
			zIndex += obj['zIndexOffset'] ;
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
//console.log('getLastIndex ' , pNode, n); 
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
		,
		'maxBounds': function()	{					// Получение сдвига OSM
			var bounds = new L.Bounds(new L.Point(-1e9, -1e9), new L.Point(1e9, 1e9));
			return bounds;
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
				bounds.max.x -= cnt*360; bounds.min.x -= cnt*360
			}
			return bounds;
		}
	};
	// setLabel для mapObject
	function setLabel(id, iconAnchor)	{
		var node = mapNodes[id];
		if(!node || !node.regularStyle || !node.regularStyle.label || !('label' in node)) return false;
		var regularStyle = node.regularStyle;
		var labelStyle = regularStyle.label;

		if(node['marker']) {
			node['group'].removeLayer(node['marker']);
		}

		var pp = node.geometry.coordinates;
		var options = {
			'textMarkers': [node['label']]
			,'align': labelStyle['align']
			,'color': '#' + utils.dec2hex(labelStyle['color'])
		};

		var p1 = new L.LatLng(pp[1], pp[0]);
		node['marker'] = new L.GMXLabels([p1, p1], options);		
		node['marker'].setStyle({'stroke': true, 'weight': 1, 'color': options['color']});
		node['marker'].addTo(node['group']);
	}
/*	// setLabel для mapObject 
	function setLabel(id, iconAnchor)	{
		var node = mapNodes[id];
		if(!node || !node.regularStyle || !node.regularStyle.label || !('label' in node)) return false;
		if(!iconAnchor) {
			iconAnchor = new L.Point(0, 0);
		}
		var regularStyle = node.regularStyle;
		var labelStyle = regularStyle.label;
		var divStyle = {'width': 'auto', 'height': 'auto', 'wordBreak': 'keep-all'};
		if('iconSize' in regularStyle) {
			divStyle = {'width': regularStyle.iconSize['x'], 'height': regularStyle.iconSize['y']};
		}
		
		if(labelStyle['color']) divStyle['color'] = '#' + utils.dec2hex(labelStyle['color']);
		if(labelStyle['haloColor']) divStyle['backgroundColor'] = utils.dec2rgba(labelStyle['haloColor'], 0.3);
		//if(labelStyle['haloColor']) divStyle['backgroundColor'] = 'rgba(255, 255, 255, 0.3)';
		
		var opt = {'className': 'my-div-icon', 'html': node['label'], 'divStyle': divStyle };
		var optm = {'zIndexOffset': 1, 'title': ''}; // , clickable: false
		if(labelStyle['size']) opt['iconSize'] = new L.Point(labelStyle['size'], labelStyle['size']);
		//scale
		var labelExtent = utils.getLabelSize(node['label'], labelStyle);
		var posX = iconAnchor.x;
		var posY = iconAnchor.y + labelExtent.y/2 + 4;
		if(labelStyle['align'] === 'center') {
			divStyle['textAlign'] = 'center';
			if('iconSize' in regularStyle) posY = regularStyle.iconSize['y']/4;
			opt['iconAnchor'] = new L.Point(Math.floor(posX + labelExtent.x/2), Math.floor(posY));
		} else if(labelStyle['align'] === 'left') {
			//divStyle['bottom'] = 0;
			opt['iconAnchor'] = new L.Point(Math.floor(posX - 6), Math.floor(posY));
		} else if(labelStyle['align'] === 'right') {
			//divStyle['bottom'] = 0;
			opt['iconAnchor'] = new L.Point(Math.floor(posX + labelExtent.x + 4), Math.floor(posY));
		} else {
			//divStyle['bottom'] = 0;
			opt['iconAnchor'] = new L.Point(-Math.floor(posX/2) - 6, Math.floor(posY/2));
		}
		if(node['marker']) {
			node['group'].removeLayer(node['marker']);
		}

		var myIcon = L.gmxIcon(opt);
		var pp = node.geometry.coordinates;

		optm['icon'] = myIcon;
		node['marker'] = L.marker([pp[1], pp[0]], optm);		
		node['marker'].addTo(node['group']);
	}*/
	// setStyle для mapObject
	function setStyle(id, attr)	{
		var node = mapNodes[id];
		if(!node || !attr) return false;
		if(attr.hoveredStyle) {
			node.hoveredStyle = utils.parseStyle(attr.hoveredStyle, id);
			node.hoveredStyleIsAttr = utils.isPropsInStyle(node.hoveredStyle);
			if(!node.hoveredStyleIsAttr) node.hoveredStyle = utils.evalStyle(node.hoveredStyle)
		}
		if(attr.regularStyle) {
			node.regularStyle = utils.parseStyle(attr.regularStyle, id);
			node.regularStyleIsAttr = utils.isPropsInStyle(node.regularStyle);
			if(!node.regularStyleIsAttr) node.regularStyle = utils.evalStyle(node.regularStyle)
		}
		
		if(node['type'] === 'filter') {					// Установка стиля фильтра векторного слоя
			var pNode = mapNodes[node['parentId']];
			pNode.setStyleFilter(id);
		} else if(node['subType'] === 'tilesParent') {		// стиль заполнения обьектов векторного слоя
			var pNode = mapNodes[node['parentId']];
			pNode.chkTilesParentStyle();
		} else if(node['type'] == 'RasterLayer') {
			node.setStyle(attr);
		} else if(node['subType'] !== 'drawingFrame') {
			if(node.isVisible != false) {
				if(node.leaflet && node.leaflet.setStyle) node.leaflet.setStyle(node.regularStyle);
				else gmxAPI._leaflet['drawManager'].add(id);			// добавим в менеджер отрисовки
			}
		}
	}

	// Найти Handler ноды рекусивно
	function getNodeHandler(id, evName)	{
		var node = mapNodes[id];
		if(!node) return null;
		if(evName in node['handlers']) return node;
		return getNodeHandler(node['parentId'], evName);
	}

	// добавить Handlers для leaflet нод
	function setNodeHandlers(id)	{
		var node = mapNodes[id];
		if(!node || !node['handlers']) return false;
		node['isHandlers'] = false;
		for(var evName in scanexEventNames) {
			setHandlerObject(id, evName);
		}
	}

	var scanexEventNames = {
		'onClick': 'click'
		,'onMouseDown': 'mousedown'
		,'onMouseOver': 'mouseover'
		,'onMouseOut': 'mouseout'
	};
	// добавить Handler для mapObject
	function setHandlerObject(id, evName)	{
		var node = mapNodes[id];
		if(!node) return false;
		if(node['leaflet']) {
			node['leaflet']['options']['resID'] = id;
			var hNode = getNodeHandler(id, evName);
			if(!hNode) return false;
			var func = function(e) {
				gmxAPI._leaflet['utils'].chkGlobalEvent({'ev':e,'latlng': e.latlng, 'evName':evName, 'node':node, 'hNode':hNode});	// события векторного обьекта
			};
			if(scanexEventNames[evName]) {
				node['leaflet'].on(scanexEventNames[evName], func);
				if(node['marker']) {
					node['marker'].on(scanexEventNames[evName], func);
				}
			}
			node['isHandlers'] = true;
			if(node['leaflet']['_map'] && '_pathRoot' in node['leaflet']['_map']) {
				node['leaflet']['_map']['_pathRoot'].style.pointerEvents = '';
			}
			return true;
		}
	}
	function removeNodeRecursive(key, parentFlag)	{		// Удалить ноду	- рекурсивно
		var node = mapNodes[key];
		if(!node) return;
		for (var i = 0; i < node['children'].length; i++) {
			removeNodeRecursive(node['children'][i], true);
		}
		if(!parentFlag) {
			var pGroup = LMap;
			if(node['parentId'] && mapNodes[node['parentId']]) {
				var pNode = mapNodes[node['parentId']];
				for (var i = 0; i < pNode['children'].length; i++) {
					if(pNode['children'][i] == node.id) {
						pNode['children'].splice(i, 1);
						break;
					}
				}
			}
		}
		utils.removeLeafletNode(node);
		delete mapNodes[key];
	}
	// Удалить mapObject
	function removeNode(key)	{				// Удалить ноду	children
		removeNodeRecursive(key);
/*
		var node = mapNodes[key];
		if(!node) return;
		var pGroup = LMap;
		if(node['parentId'] && mapNodes[node['parentId']]) {
			var pNode = mapNodes[node['parentId']];
			pGroup = pNode['group'];
			pGroup.removeLayer(node['group']);
			for (var i = 0; i < pNode['children'].length; i++) {
				if(pNode['children'][i] == node.id) {
					pNode['children'].splice(i, 1);
					break;
				}
			}
		}
		if(node['leaflet']) {
			pGroup.removeLayer(node['leaflet']);
		}
		delete mapNodes[key];
*/
	}
	
	// добавить mapObject
	function addObject(ph)	{
		nextId++;
		var id = 'id' + nextId;
		var pt = {
			'type': 'mapObject'
			,'handlers': {}
			,'children': []
			,'id': id
			,'zIndexOffset': 0
			,'parentId': ph.obj['objectId']
			//,'eventsCheck': 
			//subType
		};
		//if(ph.attr['hidenAttr']) pt['hidenAttr'] = ph.attr['hidenAttr'];

		var pNode = mapNodes[pt['parentId']];
		if(!pNode) {
			pNode = {'type': 'map', 'children':[], 'group':LMap};
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
			if(pt['propHiden']['subType']) pt['subType'] = pt['propHiden']['subType'];
			if(pt['propHiden']['refreshMe']) pt['refreshMe'] = pt['propHiden']['refreshMe'];
			if(pt['propHiden']['layersParent']) pt['zIndexOffset'] = 0;
			if(pt['propHiden']['overlaysParent']) pt['zIndexOffset'] = 1000;
			
// 
		}
		mapNodes[id] = pt;
		if(pt['geometry']['type']) {
			gmxAPI._leaflet['drawManager'].add(id);				// добавим в менеджер отрисовки
			if(pt['leaflet']) {
				setHandlerObject(id);							// добавить Handler для mapObject
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
			var id = addObject(tmp);
			if(ph['setLabel']) {
				mapNodes[id]['label'] = ph['setLabel'];
			}
			setStyle(id, ph['setStyle']);
			//setLabel(res, ph['setLabel']);

			//if(ph['setStyle']) tmp['setStyle'] = ph['setStyle'];
			//if(ph['setLabel']) tmp['setLabel'] = ph['setLabel'];
			var aObj = new gmxAPI._FMO(id, prop, gmxAPI.mapNodes[parentId]);	// обычный MapObject
			out.push(aObj);
			// пополнение mapNodes
			var currID = (aObj.objectId ? aObj.objectId : gmxAPI.newFlashMapId() + '_gen1');
			gmxAPI.mapNodes[currID] = aObj;
			if(aObj.parent) aObj.parent.childsID[currID] = true; 
		}
		return out;
	}
	// Рекурсивное изменение видимости
	function setVisibleNode(ph) {
		var id = ph.obj.objectId || ph.obj.id;
		var node = mapNodes[id];
		if(node) {							// нода имеется
			if(node['type'] === 'map') {							// нода map ничего не делаем
				return;
			}
			//node.isVisible = ph.attr;
			var pNode = mapNodes[node['parentId']] || null;
			var pGroup = (pNode ? pNode['group'] : LMap);
			if(node['type'] === 'filter') {							// нода filter
				if(pNode) pNode.refreshFilter(id);
				return;
			} else {							// нода имеет вид в leaflet
				if(ph.attr) {
					var flag = utils.chkVisibilityByZoom(id);
					if(!flag) return;
					if(node['leaflet'] && node['leaflet']._isVisible) return;
					if(node['type'] === 'RasterLayer') {
						if(node['leaflet']) {
							node['leaflet']._isVisible = true;
							LMap.addLayer(node['leaflet']);
							utils.bringToDepth(node, node['zIndex']);
						}
					}
					else
					{
						var isOnScene = ('isOnScene' in node ? node['isOnScene'] : true);
						if(node['parentId']) {
							if(isOnScene) pGroup.addLayer(node['group']);
						}
						
						if(node['leaflet']) {
							node['leaflet']._isVisible = true;
							if(isOnScene) pGroup.addLayer(node['leaflet']);
							//pGroup.addLayer(node['leaflet']);
/*
							if(!node['isHandlers']) {
								if('_map' in node['leaflet'] && '_pathRoot' in node['leaflet']['_map']) {
									//node['leaflet']['_map']['_pathRoot'].style.pointerEvents = 'none';
								}
							}
*/
						}
					}
				}
				else
				{
					if(node['leaflet'] && node['leaflet']._isVisible === false) return;
					if(node['type'] === 'RasterLayer') {
						if(node['leaflet']) {
							if(node['leaflet']._isVisible) LMap.removeLayer(node['leaflet']);
							node['leaflet']._isVisible = false;
						}
					}
					else {
						if(node['parentId']) {
							pGroup.removeLayer(node['group']);
						}
						if(node['leaflet']) {
							node['leaflet']._isVisible = false;
							if(pGroup['_layers'][node['leaflet']['_leaflet_id']]) pGroup.removeLayer(node['leaflet']);
						}
					}
				}
			}
			for (var i = 0; i < node['children'].length; i++) {
				setVisibleRecursive(mapNodes[node['children'][i]], ph.attr);
			}
		}
	}

	// Рекурсивное изменение видимости
	function setVisibleRecursive(pNode, flag) {
		if(!pNode) return;
		if(pNode['leaflet']) {
			utils.setVisibleNode({'obj': pNode, 'attr': flag});
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
	function setVisibilityFilterRecursive(pNode, sqlFunc) {
		if(pNode['leaflet'] && pNode.geometry && pNode.geometry['properties']) {
			var flag = sqlFunc(pNode.geometry['properties']);
			utils.setVisibleNode({'obj': pNode, 'attr': flag});
		} else {
			for (var i = 0; i < pNode['children'].length; i++) {
				var key = pNode['children'][i];
				var gmxNode = mapNodes[key];
				setVisibilityFilterRecursive(gmxNode, sqlFunc);
			}
		}
	}
	// Изменение видимости ноды
	function setVisibilityFilter(ph) {
		var obj = ph['obj'];
		var id = obj['objectId'];
		var node = mapNodes[id];
		node['_sqlVisibility'] = ph.attr['sql'].replace(/[\[\]]/g, '"');
		node['_sqlFuncVisibility'] = gmxAPI.Parsers.parseSQL(node['_sqlVisibility']);
		if(node['type'] === 'VectorLayer') node.waitRedraw();
		else setVisibilityFilterRecursive(node, node['_sqlFuncVisibility']);
	}
	
	// Проверка видимости mapObjects
	function chkVisibilityObjects() {
		var zoom = LMap.getZoom();
		for(var id in mapNodes) {
			var node = mapNodes[id];
			var flag = ((node['minZ'] && zoom < node['minZ']) || (node['maxZ'] && zoom > node['maxZ']) ? false : true);
			setVisibleRecursive(node, flag);
		}
	}
	
	var grid = {
		'isVisible': false							// видимость grid
		,
		'lealfetObj': null							// lealfet обьект
		,
		'gridSteps': [0.001, 0.002, 0.0025, 0.005, 0.01, 0.02, 0.025, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 30, 60, 120, 180]
		,
		'formatFloat': function (f)
		{
			f %= 360;
			if (f > 180) f -= 360;
			else if (f < -180) f += 360;
			return Math.round(f*1000.0)/1000.0;
		}
		,
		'setGridVisible': function(flag) {			// Установка видимости grid
			if(flag) {
				grid.redrawGrid();
			} else {
				if(grid.positionChangedListenerID) gmxAPI.map.removeListener('positionChanged', grid.positionChangedListenerID); grid.positionChangedListenerID = null;
				if(grid.baseLayerListenerID) gmxAPI.map.removeListener('baseLayerSelected', grid.baseLayerListenerID); grid.baseLayerListenerID = null;
				if(grid.zoomListenerID) gmxAPI._listeners.removeListener(null, 'onZoomend', grid.zoomListenerID); grid.zoomListenerID = null;
				LMap.removeLayer(grid.lealfetObj);
				grid.lealfetObj = null;
			}
		}
		,
		'getGridVisibility': function() {			// Получить видимость grid
			var zoom = LMap.getZoom();
			return false;
		}
		,
		'redrawGrid': function() {					// перерисовать grid
			var zoom = LMap.getZoom();
			var gridStep = grid.getGridStep();
			
			return false;
		}
		,
		'getGridStep': function() {					// получить шаг сетки
			var zoom = LMap.getZoom();
			var vBounds = LMap.getBounds();
			var vpNorthWest = vBounds.getNorthWest();
			var vpSouthEast = vBounds.getSouthEast();

			var w = LMap._size.x;
			var h = LMap._size.y;

			var x1 = vpNorthWest.lng;
			var x2 = vpSouthEast.lng;
			var y1 = vpSouthEast.lat;
			var y2 = vpNorthWest.lat;
			var xStep = 0;
			var yStep = 0;
			for (var i = 0; i < grid['gridSteps'].length; i++) {
				var step = grid['gridSteps'][i];
				if (xStep == 0 && (x2 - x1)/step < w/80) xStep = step;
				if (yStep == 0 && (y2 - y1)/step < h/80) yStep = step;
				if (xStep > 0 && yStep > 0) break;
			}
			
			var baseLayersTools = gmxAPI.map.baseLayersTools;
			var currTool = baseLayersTools.getToolByName(baseLayersTools.activeToolName);
			var color = (currTool.backgroundColor === 1 ? 'white' : 'black');
			var haloColor = (color === 'black' ? 'white' : 'black');

			var divStyle = {'width': 'auto', 'height': 'auto', 'color': color, 'haloColor': haloColor, 'wordBreak': 'keep-all'};
			var opt = {'className': 'my-div-icon', 'html': '0', 'divStyle': divStyle };
			var optm = {'zIndexOffset': 1, 'title': ''}; // , clickable: false
		
			var latlngArr = [];
			var textMarkers = [];
			for (var i = Math.floor(x1/xStep); i < Math.ceil(x2/xStep); i++) {
				var x = i * xStep;
				var p1 = new L.LatLng(y1, x);
				var p2 = new L.LatLng(y2, x);
				latlngArr.push(p2, p1);
				textMarkers.push(grid.formatFloat(x) + "°", '');
			}
			for (var i = Math.floor(y1/yStep); i < Math.ceil(y2/yStep); i++) {
				var y = i * yStep;
				var p1 = new L.LatLng(y, x1);
				var p2 = new L.LatLng(y, x2);
				latlngArr.push(p1, p2);
				textMarkers.push(grid.formatFloat(y) + "°", '');
			}
			if(!grid.lealfetObj) {
				//grid.lealfetObj = new L.MultiPolyline(latlngArr);
				grid.lealfetObj = new L.GMXgrid(latlngArr, {noClip: true, clickable: false});
				LMap.addLayer(grid.lealfetObj);
				if(!grid.positionChangedListenerID) grid.positionChangedListenerID = gmxAPI.map.addListener('positionChanged', grid.redrawGrid, -10);
				if(!grid.baseLayerListenerID) grid.baseLayerListenerID = gmxAPI.map.addListener('baseLayerSelected', grid.redrawGrid, -10);
				if(!grid.zoomListenerID) grid.zoomListenerID = gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': grid.redrawGrid});
			}
			grid.lealfetObj.setStyle({'stroke': true, 'weight': 1, 'color': color});
			grid.lealfetObj.options['textMarkers'] = textMarkers;
			grid.lealfetObj.setLatLngs(latlngArr);
			
//console.log('getGridStep ', xStep, yStep, y1, y2, w, h);

			return false;
		}
	};
	//LMap.on('moveend', grid.redrawGrid);
	
	//gmxAPI._listeners.addListener({'level': -10, 'eventName': 'positionCh', 'func': grid.redrawGrid});

	// Команды в leaflet
	var commands = {				// Тип команды
		'setVisibilityFilter': setVisibilityFilter			// добавить фильтр видимости
		,
		'setBackgroundTiles': gmxAPI._leaflet['setBackgroundTiles']			// добавить растровый тайловый слой
		,
		'setGridVisible':	function(hash)	{							// Изменить видимость сетки
			return grid.setGridVisible(hash['attr']);
		}
		,
		'getGridVisibility':	function(hash)	{						// получить видимость сетки
			return grid.getGridVisibility();
		}
		,
		'addObjects':	function(attr)	{					// Добавление набора статических объектов на карту
			var out = addObjects(attr.obj['objectId'], attr['attr']);
			return out;
		}
		,
		'addObject': addObject								// добавить mapObject
		,
		'startDrawing': function(ph)	{					// Режим рисования
			gmxAPI._leaflet['curDragState'] = true;
			LMap.dragging.disable();
			LMap.touchZoom.addHooks();
			return true;
		}
		,
		'stopDrawing': function(ph)	{						// Отмена режима рисования
			gmxAPI._leaflet['curDragState'] = false;
			LMap.dragging.enable();
			LMap.touchZoom.removeHooks();
			return true;
		}
		,
		'isDragging': function()	{						// Текущий режим Drag
			return gmxAPI._leaflet['curDragState'];
		}
		,
		'isKeyDown': function(ph)	{						// Проверка нажатых клавиш
			var flag = false;
			if(ph.attr && ph.attr.code) {
				var code = ph.attr.code;
				var clickAttr = gmxAPI._leaflet['clickAttr'];
				if(clickAttr) {
					if(code === 16 && clickAttr['shiftKey']) flag = true;
				}
			}
			return flag;
		}
		,
		'setGeometry': function(ph)	{						// установка geometry
			var layer = ph.obj;
			var id = layer.objectId;
			var node = mapNodes[id];
			if(!node) return;						// Нода не определена
			if(ph.attr) {
				var geo = utils.parseGeometry(ph.attr);
				node['geometry'] = geo;
				if(node['type'] === 'RasterLayer') node['chkGeometry']();
				if(node['geometry']['type']) {
					gmxAPI._leaflet['drawManager'].add(id);			// добавим в менеджер отрисовки
					if(node['leaflet']) setHandlerObject(id);
				}
			}
		}
		,
		'bringToTop': function(ph)	{						// установка zIndex - вверх
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			var zIndex = 1;
			if(node['type'] === 'VectorLayer') zIndex = gmxAPI.map.layers.length;
			else zIndex = utils.getLastIndex(node.parent);
			node['zIndex'] = zIndex;
			utils.bringToDepth(node, zIndex);
			if(!gmxAPI.map.needMove) {
				if('bringToFront' in node) node.bringToFront();
				else if(node['leaflet'] && node['leaflet']._isVisible && 'bringToFront' in node['leaflet']) node['leaflet'].bringToFront();
				gmxAPI.map.drawing.chkZindex(id);
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
			if(!gmxAPI.map.needMove) {
				if('bringToBack' in node) node.bringToBack();
				else if(node['leaflet'] && node['leaflet']._isVisible && 'bringToBack' in node['leaflet']) node['leaflet'].bringToBack();
				gmxAPI.map.drawing.chkZindex(id);
/*				for (var i = 0; i < node['children'].length; i++) {
					var cNode = mapNodes[node['children'][i]];
					if('bringToDepth' in cNode) cNode.bringToDepth(0);
				}*/
			}
			return 0;
		}
		,
		'bringToDepth': function(ph)	{					// установка z-index
			var id = ph.obj.objectId;
			var zIndex = ph.attr.zIndex;
			var node = mapNodes[id];
			if(node) {
				node['zIndex'] = zIndex;
				utils.bringToDepth(node, zIndex + node['zIndexOffset']);
			}
		}
		,
		'getVisibility': function(ph)	{					// получить видимость mapObject
			return ph.obj.isVisible;
		}
		,
		'setVisible': function(ph)	{						// установить видимость mapObject
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			node.isVisible = ph.attr;
			return utils.setVisibleNode(ph);
		}
		,
		'setExtent':	function(ph)	{		//Задать географический extent - за пределы которого нельзя выйти. - todo
			/*
			var attr = ph.attr;
			var southWest = new L.LatLng(attr.y2, attr.x2),
				northEast = new L.LatLng(attr.y1, attr.x1),
				bounds = new L.LatLngBounds(southWest, northEast);			
			var tt = bounds;
			LMap.fitBounds(bounds);
			*/
		}
		,
		'setMinMaxZoom':	function(ph)	{				// установка minZoom maxZoom карты
			if(LMap.options.minZoom == ph.attr.z1 && LMap.options.maxZoom == ph.attr.z2) return;
			LMap.options.minZoom = ph.attr.z1;
			LMap.options.maxZoom = ph.attr.z2;
			var currZ = (gmxAPI.map.needMove ? gmxAPI.map.needMove.z : LMap.getZoom() || 4);
//console.log('setMinMaxZoom1 ', ph);
			if(currZ > LMap.getMaxZoom()) currZ = LMap.getMaxZoom();
			else if(currZ < LMap.getMinZoom()) currZ = LMap.getMinZoom();
			else return;
return;
			
			//LMap.setView(LMap.getCenter(), currZ);
			var centr = LMap.getCenter();
			var px = centr.lng;
			var py = centr.lat;
			if(gmxAPI.map.needMove) {
				px = gmxAPI.map.needMove.x;
				py = gmxAPI.map.needMove.y;
			}
			utils.runMoveTo({'x': px, 'y': py, 'z': currZ})
		}
		,
		'checkMapSize':	function()	{				// Проверка изменения размеров карты
			if(LMap) {
				LMap._onResize();
				return true;
			}
			return false;
		}
		,
		'addImageProcessingHook':	function(ph)	{		// Установка предобработчика растрового тайла
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			node['imageProcessingHook'] = ph['attr']['func'];
		}
		,
		'zoomBy':	function(ph)	{				// установка Zoom карты
			var toz = Math.abs(ph.attr.dz);
			if(ph.attr.dz > 0) LMap.zoomOut(toz);
			else LMap.zoomIn(toz);
/*
			var currZ = (gmxAPI.map.needMove ? gmxAPI.map.needMove.z : LMap.getZoom() || 4);
			currZ -= ph.attr.dz;
			if(currZ > LMap.getMaxZoom() || currZ < LMap.getMinZoom()) return;
			var pos = LMap.getCenter();
			if(gmxAPI.map.needMove) {
				pos.lng = gmxAPI.map.needMove.x;
				pos.lat = gmxAPI.map.needMove.y;
			}
			if (ph.attr.useMouse && gmxAPI._leaflet['mousePos'])
			{
				var z = (gmxAPI.map.needMove ? gmxAPI.map.needMove.z : LMap.getZoom() || 4);
				var k = Math.pow(2, z - currZ);
				
				var lat = utils.getMouseY();
				var lng = utils.getMouseX();
				pos.lat = lat + k*(pos.lat - lat);
				pos.lng = lng + k*(pos.lng - lng);
			}
			utils.runMoveTo({'x': pos.lng, 'y': pos.lat, 'z': currZ})
			//LMap.setView(pos, currZ);
*/
		}
		,
		'moveTo':	function(ph)	{				//позиционирует карту по координатам центра и выбирает масштаб
			var zoom = ph.attr['z'] || (gmxAPI.map.needMove ? gmxAPI.map.needMove.z : LMap.getZoom() || 4);
			if(zoom > LMap.getMaxZoom() || zoom < LMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr['y'], ph.attr['x']);
			//LMap.setView(pos, zoom);
			utils.runMoveTo({'x': pos.lng, 'y': pos.lat, 'z': zoom})
//			setTimeout(function() { LMap._onResize(); }, 50);
		}
		,
		'slideTo':	function(ph)	{				//позиционирует карту по координатам центра и выбирает масштаб
			if(ph.attr['z'] > LMap.getMaxZoom() || ph.attr['z'] < LMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr['y'], ph.attr['x']);
			//LMap.setView(pos, ph.attr['z']);
			utils.runMoveTo({'x': pos.lng, 'y': pos.lat, 'z': ph.attr['z']})
		}
		,
		'setLabel':	function(ph)	{				// Установка содержимого label
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			node['label'] = ph['attr']['label'];
			gmxAPI._leaflet['drawManager'].add(id);
			if(node['type'] === 'mapObject') setLabel(id);
		}
		,
		'setStyle':	function(ph)	{				// Установка стилей обьекта
			var id = ph.obj.objectId;
			setStyle(id, ph.attr);
		}
		,
		'remove':	function(ph)	{				// Удаление ноды
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;						// Нода не была создана через addObject
			if('remove' in node) {							// Имеется свой remove
				node.remove(id);
				removeNode(id);
			} else if(node['type'] === 'filter') {			// Удаление фильтра векторного слоя
				var pNode = mapNodes[node['parentId']];
				pNode.removeFilter(id);
			} else if(node['type'] === 'mapObject') {	// Удаление mapObject
				removeNode(id);
			}
			delete mapNodes[id];
		}
		,
		'setVectorTiles': gmxAPI._leaflet['setVectorTiles']			// Установка векторный тайловый слой
		,
		'setFilter':	function(ph)	{			// Установка фильтра
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;						// Нода не была создана через addObject
			node['type'] = 'filter';
			node['sql'] = ph.attr['sql'];
			node['sqlFunction'] = gmxAPI.Parsers.parseSQL(ph.attr['sql']);

			var pNode = mapNodes[node['parentId']];
			pNode.addFilter(id);
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
		'removeHandler':	function(ph)	{			// Установка Handler
			var id = ph.obj.objectId;
			var attr = ph.attr;
			var node = mapNodes[id];
			if(!attr || !node || !'handlers' in node) return;						// Нода не была создана через addObject
			delete node['handlers'][attr.eventName];
		}
		,
		'setHandler':	function(ph)	{			// Установка Handler
			var id = ph.obj.objectId;
			var attr = ph.attr;
			var node = mapNodes[id];
			if(!attr || !node || !'handlers' in node) return;						// Нода не была создана через addObject
			node['handlers'][attr.eventName] = attr.callbackName;
			setHandlerObject(id, attr.eventName);
		}
		,
		'getGeometry':	function(ph)	{			//	Получить геометрию обьекта
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) {						// Нода не была создана через addObject
				if(ph.obj.parent && mapNodes[ph.obj.parent.objectId]) {
					node = mapNodes[ph.obj.parent.objectId];
					if(node) {
						if(node['type'] == 'filter') node = mapNodes[node.parentId];
						if(node && 'getItemGeometry' in node) return node.getItemGeometry(id);
					}
				}
				return null;
			}
			//if(!node || !'resIDLast' in node) return null;						// Нода не была создана через addObject
			//var rnode = mapNodes[node['resIDLast']];

			var geo = gmxAPI.clone(node.geometry);
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
		'getGeometryType':	function(ph)	{		// Получить тип геометрии
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) {						// Нода не была создана через addObject
				if(ph.obj.parent && mapNodes[ph.obj.parent.objectId]) {
					node = mapNodes[ph.obj.parent.objectId];
					if(node && node['type'] == 'filter') {
						node = mapNodes[node.parentId];
						if(node && 'getGeometryType' in node) return node.getGeometryType(id);
					}
				}
			}
			var geo = commands.getGeometry(ph);
			return (!geo ? null : geo.type);
		}
		,
		'getLength': function(ph)	{			//	Получить площадь обьекта
			var geo = commands.getGeometry(ph);
			var len = gmxAPI.geoLength(geo);
			return (!len ? null : len);
		}
		,
		'getArea':	function(ph)	{			//	Получить площадь обьекта
			var geo = commands.getGeometry(ph);
			var area = gmxAPI.geoArea(geo);
			return (!area ? null : area);
		}
		,
		'getFeatureById':	function(ph)	{
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(node) {						
				var attr = ph['attr'];
				if('getFeatureById' in node) node.getFeatureById(attr);
			}
		}
		,
		'getFeatures': function(ph) {					// получить данные векторного слоя по bounds геометрии
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(node) {						
				var attr = ph['attr'];
				if(attr['center']) {
					var pos = LMap.getCenter()
					attr['geom'] = { type: "POINT", coordinates: [pos['lng'], pos['lat']] };
				}
				if('getFeatures' in node) node.getFeatures(attr);
			}
		}
		,
		'getPosition': function()	{						// получить текущее положение map
			var res = utils.getMapPosition();
			return res;
		}
		,'getX':	function()	{ var pos = LMap.getCenter(); return pos['lng']; }	// получить X карты
		,'getY':	function()	{ var pos = LMap.getCenter(); return pos['lat']; }	// получить Y карты
		,'getZ':	function()	{ return LMap.getZoom(); }							// получить Zoom карты
		,'getMouseX':	function()	{ return utils.getMouseX(); }		// Позиция мыши X
		,'getMouseY':	function()	{ return utils.getMouseY();	}		// Позиция мыши Y
		,
		'flip':	function(ph)	{					// Пролистывание в квиклуках
			var id = ph.obj.objectId;
			if(typeof(id) == 'string') id = id.replace(/id_/, '');
			var lObj = ph.obj.parent.parent;
			if(lObj) {
				var node = mapNodes[lObj.objectId];
				if(node && node.setFlip) node.setFlip(id);
			}
			return id;
		}
		,
		'getZoomBounds':	function(ph)	{		// Установка границ по zoom
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;
			var out = {
				'MinZoom': node['minZ']
				,'MaxZoom': node['maxZ']
			}
			return out;
		}
		,
		'setZoomBounds':	function(ph)	{		// Установка границ по zoom
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;
			node['minZ'] = ph.attr['minZ'] || 1;
			node['maxZ'] = ph.attr['maxZ'] || 21;
			if(node.propHiden && node.propHiden['subType'] == 'tilesParent') {			//ограничение по zoom квиклуков
				var pnode = mapNodes[node.parentId];
				if(pnode) {
					if(pnode['setZoomBoundsQuicklook']) pnode['setZoomBoundsQuicklook'](node['minZ'], node['maxZ']);
				}
			} else if(node['type'] == 'mapObject') {			//ограничение по zoom mapObject
				gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': function() {
						gmxAPI._leaflet['drawManager'].add(id);
						
						if(utils.chkVisibleObject(node.id) && utils.chkVisibilityByZoom(node.id)) {
							utils.setVisibleNode({'obj': node, 'attr': true});
						}
						return false;
					}
				});
			} else if('onZoomend' in node) {					// есть проверка по Zoom
				node.onZoomend();
			}
			
			return true;
		}
		,
		'observeVectorLayer':	function(ph)	{		// Установка получателя видимых обьектов векторного слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;
			var layerId = ph.attr.layerId;
			var nodeLayer = mapNodes[layerId];
			if(!nodeLayer) return;
			nodeLayer.setObserver(ph);
			//node['observeVectorLayer'] = ph.attr.func;
			return true;
		}
		,
		'setImage':	function(ph)	{					// Установка изображения
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;
			setTimeout(function() { setImage(node, ph); }, 2);
			return true;
		}
		,
		'setImageExtent':	function(ph)	{			// Установка изображения без трансформации
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;
			ph['setImageExtent'] = true;
			setTimeout(function() { setImage(node, ph); }, 2);
			return true;
		}
		,
		'addItems':	function(ph)	{
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.addItems) return false;
			var arr = [];
			for (var i=0; i<ph.attr.data.length; i++)	// Подготовка массива обьектов
			{
				var item = ph.attr.data[i];
				arr.push({
					'id': item['id']
					,'properties': item['properties']
					,'geometry': gmxAPI.merc_geometry(item['geometry'])
				});
			}
			node.addItems(arr);
			return true;
		}
		,
		'removeItems':	function(ph)	{
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.removeItems) return false;
			node.removeItems(ph.attr.data);
			return true;
		}
		,
		'setSortItems':	function(ph)	{
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(node && 'setSortItems' in node) {
				node.setSortItems(ph.attr.data);
				return true;
			}
			return false;
		}
		,		
		'setAPIProperties':	function(ph)	{
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return false;
			if(!node['propHiden']) node['propHiden'] = {};
			for(var key in ph['attr']) {
				node['propHiden'][key] = ph['attr'][key];
			}
			if(node['type'] === 'VectorLayer') node.waitRedraw();
			return true;
		}
		,
		'setClusters':	function(ph)	{
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.setClusters) return false;
			node.setClusters(ph.attr);
			return true;
		}
		,
		'getChildren':	function(ph)	{								// Получить потомков обьекта
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			var out = [];
			for (var i = 0; i < node.children.length; i++)
			{
				var itemId = node.children[i];
				var item = mapNodes[itemId];
				if(item) {
					out.push({
						id: item.id,
						properties: item.geometry.properties
					});
				}
			}
			return out;
		}
		,
		'setEditObjects':	function(ph)	{							// Установка редактируемых обьектов слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.setEditObjects) return false;
			node.setEditObjects(ph.attr);
			return true;
		}
		,
		'setBackgroundColor':	function(hash)	{						// Установка BackgroundColor
		}
		,
		'sendPNG':	function(hash)	{									// Сохранение изображения карты на сервер
			var miniMapFlag = gmxAPI.miniMapAvailable;
			var attr = hash['attr'];
			var flag = (attr.miniMapSetVisible ? true : false);
			if(miniMapFlag != flag) gmxAPI.map.miniMap.setVisible(flag);
			if(attr.func) attr.func = gmxAPI.uniqueGlobalName(attr.func);
			var ret = {'base64': utils.getMapImage(attr)};
			if(miniMapFlag) gmxAPI.map.miniMap.setVisible(miniMapFlag);
			return ret;
		}
	}

	// Передача команды в leaflet
	function leafletCMD(cmd, hash)
	{
		if(!LMap) LMap = gmxAPI._leaflet['LMap'];				// Внешняя ссылка на карту
		
		var ret = {};
		if(!hash) hash = {};
		var obj = hash['obj'] || null;	// Целевой обьект команды
		var attr = hash['attr'] || '';
//try {
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
//} catch(e) { gmxAPI.addDebugWarnings({'func': 'drawTriangle', 'event': e, 'alert': e}); }
if(!commands[cmd]) gmxAPI.addDebugWarnings({'func': 'leafletCMD', 'cmd': cmd, 'hash': hash});
//console.log(cmd + ' : ' , hash , ' : ' , ret);
		return ret;
	}

	// 
	function setImage(node, ph)	{
		var attr = ph.attr;

		var LatLngToPixel = function(y, x) {
			var point = new L.LatLng(y, x);
			return LMap.project(point);
		}
		if(ph['setImageExtent']) {
			node['setImageExtent'] = true;
			attr['x1'] = attr.extent['minX'];
			attr['y1'] = attr.extent['maxY'];
			attr['x2'] = attr.extent['minX'];
			attr['y2'] = attr.extent['minY'];
			attr['x3'] = attr.extent['maxX'];
			attr['y3'] = attr.extent['minY'];
			attr['x4'] = attr.extent['minX'];
			attr['y4'] = attr.extent['maxY'];
		}
		var arr = [
			new L.Point(attr['x1'], attr['y1'])
			,new L.Point(attr['x2'], attr['y2'])
			,new L.Point(attr['x3'], attr['y3'])
			,new L.Point(attr['x4'], attr['y4'])
		];
		//arr.sort(function (a, b) { 
		//	return (a.y == b.y ? 0 : (a.y > b.y ? -1 : 1)); 
		//});
		var ptl = arr[0];
		var ptr = arr[1];
		//if(arr[0].x > arr[1].x) ptl = arr[1], ptr = arr[0];
		var pbl = arr[3];
		var pbr = arr[2];
		//if(arr[2].x > arr[3].x) pbl = arr[3], pbr = arr[2];
		
		var	bounds = new L.Bounds();
		bounds.extend(ptl);
		bounds.extend(ptr);
		bounds.extend(pbl);
		bounds.extend(pbr);

		var pNode = mapNodes[node['parentId']] || null;
		var pGroup = (pNode ? pNode['group'] : LMap);
		//var minPoint = LatLngToPixel(bounds.max.y, bounds.min.x);
		//var minPoint = LatLngToPixel(ptl.y, ptl.x);
		//var minP = null;
		
		//var zoomPrev = LMap.getZoom();
		var getPixelPoints = function(ph) {
			var out = {};
			var pix = LatLngToPixel(ptl.y, ptl.x); out['x1'] = Math.floor(pix.x); out['y1'] = Math.floor(pix.y);
			pix = LatLngToPixel(ptr.y, ptr.x); out['x2'] = Math.floor(pix.x); out['y2'] = Math.floor(pix.y);
			pix = LatLngToPixel(pbr.y, pbr.x); out['x3'] = Math.floor(pix.x); out['y3'] = Math.floor(pix.y);
			pix = LatLngToPixel(pbl.y, pbl.x); out['x4'] = Math.floor(pix.x); out['y4'] = Math.floor(pix.y);

			var	boundsP = new L.Bounds();
			boundsP.extend(new L.Point(out['x1'], out['y1']));
			boundsP.extend(new L.Point(out['x2'], out['y2']));
			boundsP.extend(new L.Point(out['x3'], out['y3']));
			boundsP.extend(new L.Point(out['x4'], out['y4']));
			//minP = boundsP.min;
			out['boundsP'] = boundsP;
			
			out['x1'] -= boundsP.min.x; out['y1'] -= boundsP.min.y;
			out['x2'] -= boundsP.min.x; out['y2'] -= boundsP.min.y;
			out['x3'] -= boundsP.min.x; out['y3'] -= boundsP.min.y;
			out['x4'] -= boundsP.min.x; out['y4'] -= boundsP.min.y;

			//out.ww = Math.round(out['x2'] - out['x4']);
			//out.hh = Math.round(out['y4'] - out['y2']);
			out.ww = Math.round(boundsP.max.x - boundsP.min.x);
			out.hh = Math.round(boundsP.max.y - boundsP.min.y);
			return out;
		}

		var posLatLng = new L.LatLng(bounds.max.y, bounds.min.x);
		var repaint = function(imageObj, canvas, zoom) {
			var isOnScene = gmxAPI._leaflet['utils'].chkBoundsVisible(bounds);
			node['isOnScene'] = isOnScene;
			if(node.isVisible == false) return;
			if(!isOnScene) {
				if(canvas) {
					canvas.width = canvas.height = 0;
					//node['imageCanvas'] = null;
				}
				pGroup.removeLayer(node['leaflet']);
				return;
			} else {
				if(!node['leaflet']._map) {
					pGroup.addLayer(node['leaflet']);
					return;
				}
			}
			if(!canvas) return;

			if(imageObj.src.indexOf(node['imageURL']) == -1) return;
			if(!zoom) zoom = LMap.getZoom();
			if(gmxAPI._leaflet['waitSetImage'] > 5) { waitRedraw(); return; }
			gmxAPI._leaflet['waitSetImage']++;
			posLatLng = new L.LatLng(bounds.max.y, bounds.min.x);
			
			var w = imageObj.width;
			var h = imageObj.height;
			var ph = getPixelPoints(attr);
			var data = { 'canvas': imageObj	};
			var ww = ph.ww;
			var hh = ph.hh;
			if(!node['setImageExtent']) {
				var point = LMap.project(new L.LatLng(0, -180), zoom);
				var p180 = LMap.project(new L.LatLng(0, 180), zoom);
				var worldSize = p180.x - point.x;
				
				var vBounds = LMap.getBounds();
				var vpNorthWest = vBounds.getNorthWest();
				var vpSouthEast = vBounds.getSouthEast();

				var vp1 = LMap.project(vpNorthWest, zoom);
				var vp2 = LMap.project(vpSouthEast, zoom);
				var wView = vp2.x - vp1.x;
				var hView = vp2.y - vp1.y;
				
				var dx = 0;
				var deltaX = 0;
				var deltaY = 0;
				node['isLargeImage'] = false;
				if(wView < ww || hView < hh) {
					deltaX = ph['boundsP'].min.x - vp1.x + (dx === 360 ? worldSize : (dx === -360 ? -worldSize : 0));
					deltaY = ph['boundsP'].min.y - vp1.y;
					posLatLng = vpNorthWest;
					ww = wView;
					hh = hView;
					node['isLargeImage'] = true;
				}
				//attr['reposition']();
				var rx = w/ph.ww;
				var ry = h/ph.hh;
				
				var points = [[ph['x1'], ph['y1']], [ph['x2'], ph['y2']], [ph['x4'], ph['y4']], [ph['x3'], ph['y3']]];
				if(rx != 1 || ry != 1) {
					data = gmxAPI._leaflet['ProjectiveImage']({
						'imageObj': imageObj
						,'points': points
						,'wView': wView
						,'hView': hView
						,'deltaX': deltaX
						,'deltaY': deltaY
					});
				}
			}

			var paintPolygon = function (ph, content) {
				if(!content) return;
				var arr = [];
				var coords = ph['coordinates'];
				var minPoint = ph['boundsP'].min;
				if(coords) {
					for (var i = 0; i < coords.length; i++)
					{
						var pArr = coords[i];
						for (var j = 0; j < pArr.length; j++)
						{
							var pix = LatLngToPixel(pArr[j][1], pArr[j][0]);
							var px1 = pix.x - minPoint.x; 		px1 = (0.5 + px1) << 0;
							var py1 = pix.y - minPoint.y;		py1 = (0.5 + py1) << 0;
							arr.push({'x': px1, 'y': py1});
						}
					}
				}

				canvas.width = ww;
				canvas.height = hh;
				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.setTransform(1, 0, 0, 1, 0, 0);
				var pattern = ctx.createPattern(content, "no-repeat");
				ctx.fillStyle = pattern;
				if(node['regularStyle'] && node['regularStyle']['fill']) ctx.globalAlpha = node['regularStyle']['fillOpacity'] || 1;					
				if(arr.length) {
					ctx.beginPath();
					for (var i = 0; i < arr.length; i++)
					{
						if(i == 0)	ctx.moveTo(arr[i]['x'] + deltaX, arr[i]['y'] + deltaY);
						else		ctx.lineTo(arr[i]['x'] + deltaX, arr[i]['y'] + deltaY);
					}
					ctx.closePath();
				} else {
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
				ctx.fill();
			}
			paintPolygon({'coordinates': node.geometry.coordinates, 'boundsP': ph['boundsP']}, data['canvas']);
			attr['reposition']();
			data = null;
			imageObj = null;
			--gmxAPI._leaflet['waitSetImage'];
		}

		var imageObj = null;
		var canvas = node['imageCanvas'] || null;
		var drawMe = function(canvas_) {
			canvas = canvas_;
			node['imageCanvas'] = canvas;
			redrawMe();
		}

		attr['reposition'] = function() {
			if(node['leaflet']) node['leaflet'].setLatLng(posLatLng);
		}

		var redrawTimer = null;
		var waitRedraw = function()	{						// Требуется перерисовка с задержкой
			if(redrawTimer) clearTimeout(redrawTimer);
			redrawTimer = setTimeout(function()
			{
				redrawMe();
			}, 10);
		}
		
		var redrawMe = function(e) {
			if(zoomProgress) return;
			if(!imageObj) {
				var src = attr['url'];
				//var src = '1.jpg';
				node['imageURL'] = src.replace(/\.\.\//g, '');
				var ph = {
					'src': src
					,'crossOrigin': 'anonymous'
					,'callback': function(img) {
						imageObj = img;
						node['refreshMe'] = function() {
							if(canvas) repaint(imageObj, canvas);
						}
						node['refreshMe']();
					}
					,'onerror': function(){
					}
				};
				gmxAPI._leaflet['imageLoader'].push(ph);
/*			
				imageObj = new Image();
				imageObj.crossOrigin = 'anonymous';		// для crossdomain прав
				imageObj.onload = function() {
					node['refreshMe'] = function() {
						if(canvas) repaint(imageObj, canvas);
					}
					node['refreshMe']();
				};
				imageObj.src = src;
*/
			}
			if(node['refreshMe'] && imageObj && canvas) {
				repaint(imageObj, canvas);
			//attr['reposition']();
			}
		}
		
		if(!node['isSetImage']) {
			if(node['leaflet']) {
				var pnode = mapNodes[node.parentId];
				pnode['group'].removeLayer(node['leaflet']);
			}
			var canvasIcon = L.canvasIcon({
				className: 'my-canvas-icon'
				,'node': node
				,'drawMe': drawMe
				//,iconAnchor: new L.Point(12, 12) // also can be set through CSS
			});
			var marker =  new L.GMXMarker(posLatLng, {icon: canvasIcon, 'toPaneName': 'shadowPane', 'zIndexOffset': -1000});
			
			//var marker = L.marker(posLatLng, {icon: canvasIcon, 'toPaneName': 'overlayPane', 'zIndexOffset': -1000});
			//var marker = L.marker(posLatLng, {icon: canvasIcon, clickable: false});
			//marker.setZIndexOffset(-1000);
				
			node['leaflet'] = marker;
			node['group'].addLayer(marker);
			utils.setVisibleNode({'obj': node, 'attr': true});
			setNodeHandlers(node.id);

			LMap.on('zoomend', function(e) {zoomProgress = false; waitRedraw();});
			LMap.on('moveend', function(e) {
				var isOnScene = gmxAPI._leaflet['utils'].chkBoundsVisible(bounds);
//console.log(' moveend: ' + isOnScene + ' : ' + node['isOnScene'] + ' : ');
				if(node['isOnScene'] == isOnScene && !node['isLargeImage']) return;
				waitRedraw();
			});
			
			/*
			LMap.on('zoomanim', function(e) {
				attr['reposition']();
			});
			*/
			var zoomProgress = null;
			LMap.on('zoomstart', function(e) {
				zoomProgress = true;
				if(canvas) canvas.width = canvas.height = 0;
			});
			node['isSetImage'] = true;
		} else {
			if(attr['url'] != node['imageURL']) drawMe(node['imageCanvas']);
		}
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
			,'curStyle': null
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
		out['sx'] = out['sy'] = 4;
		out['sxLabelLeft'] = out['sxLabelRight'] = out['syLabelTop'] = out['syLabelBottom'] = 0;
		
		// Экспорт точки в АПИ
		out['exportGeo'] = function (chkPoint) {
			var res = {'type': 'POINT'};
			res['coordinates'] = p;
			return res;
		}
		// Проверка совпадения с другой точкой
		out['contains'] = function (chkPoint) {
			return gmxAPI._leaflet['utils'].chkPointWithDelta(bounds, chkPoint, out);
		}
		// Проверка пересечения с bounds
		out['intersects'] = function (chkBounds) {
			return gmxAPI._leaflet['utils'].chkPointWithDelta(chkBounds, point, out);
		}
		// Квадрат растояния до точки
		out['distance2'] = function (chkPoint) {
			var x = point.x - chkPoint.x,
				y = point.y - chkPoint.y;
			return x * x + y * y;
		}

		var chkLabelBounds = function(labelBounds, ph)	{							// проверка пересечений labels
			var p = new L.Point(ph['lx'], ph['ly']);
			var b = new L.Bounds(p);
			b.extend(p);
			p = new L.Point(ph['lx'] + ph.labelExtent['x'], ph['ly'] + ph.labelExtent['y']);
			b.extend(p);
			for (var i = 0; i < labelBounds.length; i++)
			{
				if(b.intersects(labelBounds[i])) {					// проверка пересечения уже нарисованных в тайле labels
					return false;
				}
			}
			labelBounds.push(b);
			return true;
		}

		// Отрисовка точки
		out['paint'] = function (attr) {
			if(!attr) return;
			//if(!bounds.intersects(attr['bounds'])) return;				// проверка пересечения полигона с отображаемым тайлом
			var zoom = attr['zoom'];
			var vbounds = attr['bounds'];
			var mInPixel = gmxAPI._leaflet['mInPixel'];

			if(!out['_cache']) out['_cache'] = {};
			//var ctx = gmxAPI._leaflet['ptx'];
			//ctx.clearRect(0, 0, 256, 256);
			
			var ctx = attr['ctx'];
			var style = attr['style'];
			//var size = style['size'] || 4;
			var scale = style['scale'] || 1;
			if('_scale' in out['_cache']) scale = out['_cache']['_scale'];
			else {
				if(typeof(scale) == 'string') scale = gmxAPI._leaflet['utils'].chkPropsInString(scale, out['properties']);
				if(scale < style['minScale']) scale = style['minScale'];
				else if(scale > style['maxScale']) scale = style['maxScale'];
				out['_cache']['_scale'] = scale;
			}
			
			if(style['imageWidth']) out['sx'] = scale * style['imageWidth'];
			if(style['imageHeight']) out['sy'] = scale * style['imageHeight'];

			var x = attr['x'];
			var y = 256 + attr['y'];
			var px1 = point.x * mInPixel - x - out['sx'] - 1; 		px1 = (0.5 + px1) << 0;
			var py1 = y - point.y * mInPixel - out['sy'] - 1;		py1 = (0.5 + py1) << 0;
			if(style['center']) {
				px1 += out['sx']/2;
				py1 += out['sy']/2;
			}
			
			//size *= 2;
			
			if(style['marker']) {
				if(style['image']) {
					ctx.drawImage(style['image'], px1, py1, out['sx'], out['sy']);
				}
				
			} else {
				if(style['stroke'] && style['weight'] > 0) {
					ctx.beginPath();
					ctx.strokeRect(px1, py1, 2*out['sx'], 2*out['sy']);
					ctx.stroke();
					//sx = sy = size;
				}
				if(style['fill']) {
					ctx.beginPath();
					ctx.fillRect(px1, py1, 2*out['sx'], 2*out['sy']);
					ctx.fill();
					//sx = sy = size;
				}
			}

			if(style['label']) {
				var labelStyle = style['label'];
				var txt = (labelStyle['field'] ? this.properties[labelStyle['field']] : labelStyle['value']) || '';
				if(txt) {
					var lx = px1 + out['sx']/2;
					var ly = py1 + out['sy']/2 + 2;

					var _labelAttr = out['_cache']['_labelAttr'];
					if(!_labelAttr) {
						var size = labelStyle['size'] || 12;
						var fillStyle = labelStyle['color'] || 0;
						//var strokeColor = style['label']['strokeColor'] || style['label']['color'] || 0;
						var haloColor = labelStyle['haloColor'] || labelStyle['haloColor'] || 0;
						_labelAttr = {
							'labelExtent': gmxAPI._leaflet['utils'].getLabelSize(txt, style['label'])
							,'lableFont': size + 'px "Tahoma"'
							,'lableStrokeStyle': gmxAPI._leaflet['utils'].dec2rgba(haloColor, 1)
							,'lableFillStyle': gmxAPI._leaflet['utils'].dec2rgba(fillStyle, 1)
							,'id': out['id']
						};
						out['_cache']['_labelAttr'] = _labelAttr;
					}

					var textAlign = labelStyle['align'];
					if(textAlign === 'center') {
						lx -= _labelAttr['labelExtent'].x/2;
					} else if(textAlign === 'left') {
						lx -= _labelAttr['labelExtent'].x + 6;
					} else {
						lx += out['sx']/2;
					}
					lx = (0.5 + lx) << 0;
					ly = (0.5 + ly) << 0;
					_labelAttr['lx'] = lx + attr['tile']['_leaflet_pos'].x;
					_labelAttr['ly'] = ly + attr['tile']['_leaflet_pos'].y;

					var skips = attr['node']['labelBounds']['skip'];
					var adds = attr['node']['labelBounds']['add'];
					var addFlag = (adds[out['id']] || (!skips[out['id']] && chkLabelBounds(attr['labelBounds'], _labelAttr)));
					if(addFlag) {
						attr['node']['labelBounds']['add'][out['id']] = true;
//console.log('bbbbbbbbbbb ', boundsLabel, geom['_cache']['_labelAttr']);

					
//ctx.drawImage(_labelAttr['labelImg'], 0, 0, 55, 55);
//return;
					//ctx.font = "italic bold 16px Arial";
					//ctx.textAlign = "center";
					//var isPath = ctx.isPointInPath(50,50); // return true
					//ctx.textBaseline = "Top";
						ctx.globalCompositeOperation = "source-over";
						ctx.font = _labelAttr['lableFont'];
						ctx.strokeStyle = _labelAttr['lableStrokeStyle'];
						ctx.strokeText(txt, lx, ly);
						ctx.fillStyle = _labelAttr['lableFillStyle'];
						ctx.fillText(txt, lx, ly);
						ctx.globalCompositeOperation = "destination-over";
					} else {
						attr['node']['labelBounds']['skip'][out['id']] = true;
					}
				}
			}
		}
		
		return out;
	};
})();

// LineGeometry LINESTRING
(function()
{
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['LineGeometry'] = function(geo_, tileBounds_) {				// класс PolygonGeometry
		var out = gmxAPI._leaflet['Geometry']();
		out['type'] = 'Polyline';
		var tileBounds = tileBounds_;					// границы тайла в котором пришел обьект
		var lastZoom = null;
		var bounds = null;
		out['sx'] = out['sy'] = 0;
		out['sxLabelLeft'] = out['sxLabelRight'] = out['syLabelTop'] = out['syLabelBottom'] = 0;
		var coords = [];
		var cnt = 0;
		var lineHeight = 2;
		for (var i = 0; i < geo_['coordinates'].length; i++)
		{
			var p = geo_['coordinates'][i];
			var point = new L.Point(p[0], p[1]);
			if(!bounds) bounds = new L.Bounds(point);
			bounds.extend(point);
			coords.push(point);
			cnt++;
		}
		out['bounds'] = bounds;
		// Экспорт в АПИ
		out['exportGeo'] = function (chkPoint) {
			var res = {'type': 'LINESTRING'};
			res['coordinates'] = geo_['coordinates'];
			return res;
		}

		// Отрисовка геометрии LineGeometry
		var paintStroke = function (attr) {
//console.log(bounds , ' paintStroke: ' , attr.bounds);
			//if(!chkNeedDraw(attr)) return false;				// проверка необходимости отрисовки
//console.log(' ok: ' , attr.bounds);
			
			var ctx = attr['ctx'];
			var x = attr['x'];
			var y = 256 + attr['y'];
			var mInPixel = gmxAPI._leaflet['mInPixel'];
			ctx.beginPath();
			for (var i = 0; i < coords.length; i++)
			{
				var p1 = coords[i];
				var px1 = p1.x * mInPixel - x; 		px1 = (0.5 + px1) << 0;
				var py1 = y - p1.y * mInPixel;		py1 = (0.5 + py1) << 0;
				if(i == 0)
					ctx.moveTo(px1, py1);
				else
					ctx.lineTo(px1, py1);
			}
			ctx.stroke();
			return true;		// отрисована геометрия

		}

		// Получить точку маркера геометрии LineGeometry
		var getPoint = function () {
			var point = {'x':0,'y':0};
			for (var i = 0; i < coords.length; i++)
			{
				var p1 = coords[i];
				point.x += p1.x;
				point.y += p1.y;
			}
			point.x /= coords.length;
			point.y /= coords.length;
			return point;
		}

		// Отрисовка LineGeometry
		out['paint'] = function(attr) {
			if(!attr) return;
			if(attr.style['marker']) {
				if(attr.style['image']) {
					var ctx = attr['ctx'];
					var point = getPoint();
					var x = attr['x'];
					var y = 256 + attr['y'];
					var mInPixel = gmxAPI._leaflet['mInPixel'];
					if(attr.style['imageWidth']) out['sx'] = attr.style['imageWidth']/2;
					if(attr.style['imageHeight']) out['sy'] = attr.style['imageHeight']/2;
					var px1 = point.x * mInPixel - x - out['sx']; 		px1 = (0.5 + px1) << 0;
					var py1 = y - point.y * mInPixel - out['sy'];		py1 = (0.5 + py1) << 0;
					ctx.drawImage(attr.style['image'], px1, py1);
					return false;
				}
			} else {
				out['sx'] = out['sy'] = 0;
				paintStroke(attr);
			}
			if(attr.style) lineHeight = attr.style.weight;
			return true;
		}
		// Квадрат растояния до точки
		out['distance2'] = function (chkPoint) {
			return 0;
		}

		// Проверка принадлежности точки LineGeometry
		out['contains'] = function (chkPoint) {
			var mInPixel = gmxAPI._leaflet['mInPixel'];
			if(out['sx']) {
				var point = getPoint();
				var bounds1 = new L.Bounds();
				bounds1.extend(new L.Point(point.x, point.y));
				return gmxAPI._leaflet['utils'].chkPointWithDelta(bounds1, chkPoint, out);
			}
			if(bounds.contains(chkPoint)) {
				var chkLineHeight = lineHeight / mInPixel;
				chkLineHeight *= chkLineHeight;
				
				var p1 = coords[0];
				for (var i = 1; i < coords.length; i++)
				{
					var p2 = coords[i];
					var sqDist = L.LineUtil._sqClosestPointOnSegment(chkPoint, p1, p2, true);
					if(sqDist < chkLineHeight) return true;
				}
			}
			return false;
		}
		// Проверка пересечения с bounds
		out['intersects'] = function (chkBounds) {
			var flag = false;
			if(out['sx']) {
				flag = gmxAPI._leaflet['utils'].chkPointWithDelta(chkBounds, getPoint(), out);
			} else {
				flag = bounds.intersects(chkBounds);
			}
			return flag;
		}
		
		return out;
	}
})();

// MULTILINESTRING MultiPolyline
(function()
{
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['MultiPolyline'] = function(geo, tileBounds_) {				// класс MultiPolyline
		var out = gmxAPI._leaflet['Geometry']();
		out['type'] = 'MultiPolyline';
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
				var item = gmxAPI._leaflet['LineGeometry']({'coordinates': geo['coordinates'][i]}, tileBounds_);
				addMember(item);
			}
		}
		// Экспорт в АПИ
		out['exportGeo'] = function (chkPoint) {
			var res = {'type': 'MULTILINESTRING'};
			res['coordinates'] = geo['coordinates'];
			return res;
		}
		
		out['addMembers'] = addMembers;
		out['addMember'] = addMember;
		out['bounds'] = bounds;
		out['cnt'] = cnt;
		out['paint'] = function (attr) {
			if(!attr) return;
			var cnt = 0;
			if(bounds.intersects(attr['bounds'])) {				// проверка пересечения мультиполигона с отображаемым тайлом
				for (var i = 0; i < members.length; i++)
				{
					if(!members[i].paint(attr)) break;
				}
			}
			return cnt;		// количество отрисованных точек в геометрии
		}
		// Квадрат растояния до точки
		out['distance2'] = function (chkPoint) {
			return 0;
		}
		
		// Проверка принадлежности точки MultiPolyline
		out['contains'] = function (chkPoint) {
			for (var i = 0; i < members.length; i++)
			{
				if(members[i]['contains'](chkPoint)) return true;
			}
			return false;
		}
		
		// Проверка пересечения с bounds
		out['intersects'] = function (chkBounds) {
			for (var i = 0; i < members.length; i++)
			{
				if(members[i]['intersects'](chkBounds)) return true;
			}
			return false;
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

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['PolygonGeometry'] = function(geo_, tileBounds_) {				// класс PolygonGeometry
		if(!tileBounds_) return;
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
		// Экспорт в АПИ
		out['exportGeo'] = function (chkPoint) {
			var res = {'type': 'POLYGON'};
			res['coordinates'] = geo_['coordinates'];
			return res;
		}

		var bMinX = gmxAPI.from_merc_x(bounds.min.x);
		var bMaxX = gmxAPI.from_merc_x(bounds.max.x);
		out['boundsType'] = (bMinX < -179.999 && bMaxX > 179.999 ? true : false);

		out['cnt'] = cnt;
		out['propHiden'] = {};					// служебные свойства
		
		// проверка необходимости отрисовки геометрии
		var chkNeedDraw = function (attr) {
			if(!bounds.intersects(attr['bounds'])) return false;				// проверка пересечения полигона с отображаемым тайлом
			var node = attr['node'];
			return node.chkTemporalFilter(out);
		}
		// Отрисовка заполнения полигона
		var paintFill = function (attr, fillFlag) {
			if(!attr || !chkNeedDraw(attr)) return false;				// проверка необходимости отрисовки
			var ctx = attr['ctx'];
			var x = attr['x'];
			var y = 256 + attr['y'];
			var mInPixel = gmxAPI._leaflet['mInPixel'];
			ctx.beginPath();
			//console.log('nnn ' ,  ' : ' , coords);
			for (var i = 0; i < coords.length; i++)
			{
				var pArr = coords[i];
				//var pArr = L.PolyUtil.clipPolygon(coords[i], attr['bounds']);
				for (var j = 0; j < pArr.length; j++)
				{
					var p1 = pArr[j];
					var px1 = p1.x * mInPixel - x; 		px1 = (0.5 + px1) << 0;
					var py1 = y - p1.y * mInPixel;		py1 = (0.5 + py1) << 0;
					if(j == 0)
						ctx.moveTo(px1, py1);
					else
						ctx.lineTo(px1, py1);
				}
			}
			ctx.closePath();
			if(fillFlag) ctx.fill();
		}
		// Отрисовка заполнения полигона
		out['paintFill'] = function (attr) {
			paintFill(attr);
		}
		// Отрисовка геометрии полигона
		var paintStroke = function (attr) {
			if(!attr) return;
			if(!chkNeedDraw(attr)) return false;				// проверка необходимости отрисовки
			
			var ctx = attr['ctx'];
			var x = attr['x'];
			var y = 256 + attr['y'];
			var mInPixel = gmxAPI._leaflet['mInPixel'];

			ctx.beginPath();
			for (var i = 0; i < coords.length; i++)
			{
				var hArr = hideLines[i];
				var cntHide = 0;
				var pArr = coords[i];
				//var pArr = L.PolyUtil.clipPolygon(coords[i], attr['bounds']);
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
				}
			}
			//ctx.closePath();
			ctx.stroke();
			return true;		// отрисована геометрия
		}
		// Отрисовка геометрии полигона
		out['paintStroke'] = function (attr) {
			if(!attr) return;
			paintStroke(attr);
		}
		// Отрисовка полигона
		out['paint'] = function(attr) {
			if(!attr || !attr.style) return;
			if(attr.style.fill) paintFill(attr, true);
			var res = paintStroke(attr);
			//attr.ctx.stroke();
			return res;
		}
		// Проверка принадлежности точки полигону
		out['contains'] = function (chkPoint) {
			if(bounds.contains(chkPoint)) {
				for (var i = 0; i < coords.length; i++)
				{
					if(gmxAPI._leaflet['utils'].isPointInPolygon(chkPoint, coords[i])) return true;
				}
			}
			return false;
		}
		// Квадрат растояния до точки
		out['distance2'] = function (chkPoint) {
			return 0;
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
		out['exportGeo'] = function (chkPoint) {
			var res = {'type': 'MULTIPOLYGON'};
			res['coordinates'] = geo['coordinates'];
			return res;
		}
		
		out['addMembers'] = addMembers;
		out['addMember'] = addMember;
		out['bounds'] = bounds;
		//out['members'] = members;
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
		// Отрисовка заполнения
		out['paintFill'] = function (attr) {
			var cnt = 0;
			if(bounds.intersects(attr['bounds'])) {				// проверка пересечения мультиполигона с отображаемым тайлом
				for (var i = 0; i < members.length; i++)
				{
					cnt += members[i].paintFill(attr);
				}
			}
			return cnt;		// количество отрисованных точек в геометрии
		}
		
		// Проверка принадлежности точки MultiPolygonGeometry
		out['contains'] = function (chkPoint) {
			for (var i = 0; i < members.length; i++)
			{
				if(members[i]['contains'](chkPoint)) return true;
			}
			return false;
		}
		// Квадрат растояния до точки
		out['distance2'] = function (chkPoint) {
			return 0;
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
		var mapID = ph['objectId'];
		mapNodes[mapID] = {
			'type': 'map'
			,'handlers': {}
			,'children': []
			,'id': mapID
			,'group': gmxAPI._leaflet['LMap']
			,'parentId': false
		};
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

			/*
			 * L.Handler.DoubleClickZoom is used internally by L.Map to add double-click zooming.
			 */

			gmxAPI.isMobile = (L.Browser.mobile ? true : false);

			L.Map.mergeOptions({
				doubleClickZoomGMX: true
			});

			L.Map.DoubleClickZoomGMX = L.Handler.extend({
				addHooks: function () {
					this._map.on('dblclick', this._onDoubleClick);
				},

				removeHooks: function () {
					this._map.off('dblclick', this._onDoubleClick);
				},

				_onDoubleClick: function (e) {
					if(clickDone) return;
					this.setView(e.latlng, this._zoom + 1);
				}
			});

			L.Map.addInitHook('addHandler', 'doubleClickZoomGMX', L.Map.DoubleClickZoomGMX);
			//window.LMap = new L.Map(leafLetCont_,
			var LMap = new L.Map(leafLetCont_,
				{
				    center: [55.7574, 37.5952]
					,zoom: 5
					,zoomControl: false
					,doubleClickZoom: false
					,doubleClickZoomGMX: true
					,attributionControl: false
					//,trackResize: true
					//,boxZoom: false
					//,zoomAnimation: false
					//,zoomAnimation: (gmxAPI.isChrome ? false : true)
					//,worldCopyJump: false
					
					//,inertia: false
					//,keyboard: false
					//,fadeAnimation: false
					//,markerZoomAnimation: true
					//,dragging: false
					,crs: L.CRS.EPSG3395
					//,'crs': L.CRS.EPSG3857 // L.CRS.EPSG4326 // L.CRS.EPSG3395 L.CRS.EPSG3857
				}
			);
			gmxAPI._leaflet['LMap'] = LMap;			// Внешняя ссылка на карту
			
/*		
			var ptxCont = document.createElement("canvas");
			ptxCont.width = ptxCont.height = 256;
			var ptx = ptxCont.getContext('2d');
			gmxAPI._leaflet['ptxCont'] = ptxCont;
			gmxAPI._leaflet['ptx'] = ptx;
*/

			//var pos = new L.LatLng(50, 35);
			//var pos = new L.LatLng(50.499276, 35.760498);
			//LMap.setView(pos, 4);
//console.log('waitMe ' , pos);
			var checkMapResize = true;
			gmxAPI._leaflet['mapOnResize'] = function (e) {
				//checkMapResize = true;
				/*
				setTimeout(function() {
					//LMap.fire('transitionend');
					//LMap.fire('mousedown');
					//LMap.fire('focus');
					LMap._onResize();
				}, 50);*/
			};
			var prevSize = null;
			var chkMapResize = function() {
				if(gmxAPI._drawing['activeState'] || gmxAPI._leaflet['curDragState']) return;	// При рисовании не проверяем Resize
				if(prevSize && LMap._size && prevSize.x == LMap._size.x && prevSize.y == LMap._size.y) return;
				//if(checkMapResize) {
					//LMap.fire('transitionend');
					//LMap.fire('mousedown');
					//LMap.fire('focus');
					LMap._onResize();
					checkMapResize = false;
					gmxAPI.map.needMove = null;
				//}
				//console.log("test2");
			};
			setInterval(chkMapResize, 5000);
			L.DomEvent.addListener(window.document, 'click', gmxAPI._leaflet['mapOnResize']);
			LMap.on('moveend', function(e) {
				//console.log("test1");
				if(LMap._size) prevSize = {'x': LMap._size.x, 'y': LMap._size.y};
				gmxAPI._listeners.dispatchEvent('onMoveEnd', gmxAPI.map, {'obj': gmxAPI.map, 'attr': gmxAPI.currPosition });
			});
			LMap.on('move', function(e) {
				var currPosition = utils.getMapPosition();
				if(!currPosition) return;
				var attr = {
					'currPosition': currPosition
				};
				gmxAPI._updatePosition(e, attr);
				if(setCenterPoint) setCenterPoint();
				if(gmxAPI.map.handlers['onMove']) {
					var mapID = gmxAPI.map['objectId'];
					var node = mapNodes[mapID];
					if(node['handlers']['onMove']) node['handlers']['onMove'](mapID, gmxAPI.map.properties, attr);
				}
			
				if(currPosition.latlng && Math.abs(currPosition.latlng.x) > 720) {
					var xx = currPosition.latlng.x % 360;
					//utils.runMoveTo({'x': xx, 'y': currPosition.latlng.y, 'z': currPosition.z});
					LMap.setView(new L.LatLng(currPosition.latlng.y, xx), currPosition.z, true);
				}
			
			});
			var parseEvent = function(e) {		// Парсинг события мыши
				if(!e.originalEvent) return {};
				var target = e.originalEvent.originalTarget || e.originalEvent.target;
				var out = {
					'latlng': e.latlng
					,'containerPoint': e.containerPoint
					,'buttons': e.originalEvent.buttons || e.originalEvent.button
					,'ctrlKey': e.originalEvent.ctrlKey
					,'altKey': e.originalEvent.altKey
					,'shiftKey': e.originalEvent.shiftKey
					,'metaKey': e.originalEvent.metaKey
					,'e': e
				};
				if(target && e.containerPoint) {
					//try {
						out['tID'] = target['id'];
						out['_layer'] = target['_layer'];
						out['tilePoint'] = target['tilePoint'];
						if(target['_leaflet_pos']) {
							out['pixelInTile'] = {
								'x': e.containerPoint.x - target['_leaflet_pos'].x
								,'y': e.containerPoint.y - target['_leaflet_pos'].y
							};
						}
					//} catch(ev) { }
				}
				return out;
				
			}

			var clickDone = false;
			var timeDown = 0;
			var chkClick = function(e) {		// Проверка click карты
				var timeClick = new Date().getTime() - timeDown;
				if(timeClick > 1000) return;
				if(utils.chkClassName(e.originalEvent.originalTarget, 'gmx_balloon', LMap._container)) return;	// click на балуне
				var attr = parseEvent(e);
				attr['evName'] = 'onClick';
				gmxAPI._leaflet['clickAttr'] = attr;
				clickDone = gmxAPI._leaflet['utils'].chkGlobalEvent(attr);
			};
			LMap.on('click', chkClick);
			LMap.on('mouseup', function(e) {
				var curTimeDown = new Date().getTime();
				var timeClick = curTimeDown - timeDown;
				if(!gmxAPI._drawing['activeState'] && timeClick < 200) { chkClick(e); timeDown = 0; }
				gmxAPI._leaflet['mousePressed'] = false;
				gmxAPI._listeners.dispatchEvent('onMouseUp', gmxAPI.map, {'attr':{'latlng':e.latlng}});
				//setTimeout(function() { skipClick = false;	}, 10);
			});
			
			var setMouseDown = function(e) {
				gmxAPI._leaflet['mousePressed'] = true;
				timeDown = new Date().getTime();
				var standartTools = gmxAPI.map.standartTools;
				if(standartTools && standartTools['activeToolName'] != 'move' && standartTools['activeToolName'] != 'FRAME') return;
			
				gmxAPI._leaflet['mousedown'] = true;
				var attr = parseEvent(e);
				attr['evName'] = 'onMouseDown';
				gmxAPI._leaflet['mousedownAttr'] = attr;
				gmxAPI._leaflet['utils'].chkGlobalEvent(attr);
				//gmxAPI._listeners.dispatchEvent('onMouseDown', null, {});
			};
			LMap.on('mousedown', setMouseDown);
			var setTouchStart = function(e) {
				gmxAPI._leaflet['mousePressed'] = true;
				timeDown = new Date().getTime();

				var parseTouchEvent = function(e) {		// Парсинг события мыши
					var target = e.target;
					var out = {
						'latlng': e.latlng
						,'containerPoint': e.containerPoint
						,'buttons': e.buttons || e.button
						,'ctrlKey': e.ctrlKey
						,'altKey': e.altKey
						,'shiftKey': e.shiftKey
						,'metaKey': e.metaKey
						,'e': e
					};
					if(target) {
						out['_layer'] = target['_layer'];
						out['latlng'] = target['_layer']._map.mouseEventToLatLng(e);
						out['tID'] = target['id'];
						out['tilePoint'] = target['tilePoint'];
					}
	//console.log(e.containerPoint);
					return out;
				}
				var attr = parseTouchEvent(e);
				attr['evName'] = 'onClick';
				gmxAPI._leaflet['clickAttr'] = attr;
				gmxAPI._leaflet['utils'].chkGlobalEvent(attr);

//var st = e.target.style['-webkit-transform'];
//var st = '';
//for (var key in attr['_layer']._map) { if(typeof(attr['_layer']._map[key]) == 'function') st += "\n " + key + ': '; }
//for (var key in e.target.style) { st += key + ': ' + e.target.style[key]; }
//alert(st);
//alert(JSON.stringify(out));
			};
			//if(L.Browser.touch) L.DomEvent.on(LMap._container, 'touchstart', setTouchStart, this);
/*
			L.DomEvent.on(LMap._container, 'step', function(e) {
console.log('Transition', e);
var tt = 1;
			}, this);
*/
			var onMouseMoveTimer = null;
			LMap.on('mousemove', function(e) {
//return;
//console.log('mousemove', gmxAPI._leaflet['mousePressed'], timeDown);
				if(gmxAPI._leaflet['mousedown']) timeDown -= 900;
				gmxAPI._leaflet['mousePos'] = e.latlng;
				var attr = parseEvent(e);
				attr['evName'] = 'onMouseMove';
				if(gmxAPI._drawing['activeState']) {
					gmxAPI._listeners.dispatchEvent('onMouseMove', gmxAPI.map, {'attr':attr});
				} else {
					if(onMouseMoveTimer) clearTimeout(onMouseMoveTimer);
					onMouseMoveTimer = setTimeout(function() {
						onMouseMoveTimer = null;
						if(utils.chkClassName(e.originalEvent.originalTarget, 'gmx_balloon', LMap._container)) return;	// click на балуне
						var from = gmxAPI.map.layers.length - 1;
						for (var i = from; i >= 0; i--)
						{
							var child = gmxAPI.map.layers[i];
							if(!child.isVisible) continue;
							var mapNode = mapNodes[child.objectId];
							if(mapNode['mouseMoveCheck']) {
								if(mapNode['mouseMoveCheck']('onMouseMove', {'attr':attr})) return true;
							}
						}
						gmxAPI._listeners.dispatchEvent('onMouseMove', gmxAPI.map, {'attr':attr});
					}, 10);
				}
				if(!gmxAPI._leaflet['mousePressed']) gmxAPI._leaflet['utils'].chkMouseHover(attr)
			});
			
			LMap.on('zoomstart', function(e) {
				gmxAPI._leaflet['zoomstart'] = true;
				gmxAPI._listeners.dispatchEvent('onZoomstart', null, {});
				gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map, {});	// Проверка map Listeners на hideBalloons
			});
			LMap.on('zoomend', function(e) {
				gmxAPI._leaflet['zoomstart'] = false;
				gmxAPI._listeners.dispatchEvent('onZoomend', null, {});
				gmxAPI._listeners.dispatchEvent('showBalloons', gmxAPI.map, {});	// Проверка map Listeners на showBalloons
			});

			// Обработчик события - mapInit
			gmxAPI._listeners.addListener({'level': -10, 'eventName': 'mapInit', 'func': onMapInit});

			L.GMXIcon = L.Icon.extend({
				options: {
					iconSize: new L.Point(12, 12) // also can be set through CSS
					/*
					iconAnchor: (Point)
					popupAnchor: (Point)
					html: (String)
					bgPos: (Point)
					,divStyle: {}
					*/
					,className: 'leaflet-canvas-icon'
				},

				createIcon: function () {
					var	options = this.options;
					var div = document.createElement('div');
					this.options.div = div;

					if (options.html) {
						div.innerHTML = options.html;
					}

					if (options.bgPos) {
						div.style.backgroundPosition =
								(-options.bgPos.x) + 'px ' + (-options.bgPos.y) + 'px';
					}

					this._setIconStyles(div, 'icon');
					if (options.divStyle) {
						gmxAPI.setStyleHTML(div, options.divStyle, false);
					}
					return div;
				},
				createShadow: function () {
					return null;
				}
				,
				setStyle: function (style, setBorder) {
					if (this.options.div) {
						gmxAPI.setStyleHTML(this.options.div, style, setBorder);
						this.options.divStyle = style;
					}
				}
			});
			L.gmxIcon = function (options) {
				return new L.GMXIcon(options);
			};

			L.CanvasIcon = L.Icon.extend({
				options: {
					iconSize: new L.Point(12, 12) // also can be set through CSS
					//shadowSize: new L.Point(1, 1),
					//iconAnchor: new L.Point(12, 12), // also can be set through CSS
					,className: 'leaflet-canvas-icon'
				},

				createIcon: function () {
					var canvas = document.createElement('canvas');
					gmxAPI.setStyleHTML(canvas, {'position': 'absolute'}, false);
					var options = this.options;
					if(options.drawMe) options.drawMe(canvas);
					//this._setIconStyles(canvas, 'icon');
					return canvas;
				},

				createShadow: function () {
					return null;
				}
			});
			L.canvasIcon = function (options) {
				return new L.CanvasIcon(options);
			};
			
			L.RectangleIcon = L.Icon.extend({
				options: {
					iconSize: new L.Point(12, 12), // also can be set through CSS
					//iconAnchor: new L.Point(12, 12), // also can be set through CSS
					className: 'leaflet-canvas-icon'
				},
				createIcon: function () {
					var options = this.options;
					var res = L.rectangle(options.bounds, options)
					return res;
				},

				createShadow: function () {
					return null;
				}
			});
			L.rectangleIcon = function (options) {
				return new L.RectangleIcon(options);
			};
			
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

			L.GMXMarker = L.Marker.extend({
				update: function () {
					if (!this._icon) { return; }

					var pos = this._map.latLngToLayerPoint(this._latlng).round();
					this._setPos(pos);
					var options = this.options;
					if(options['rotate']) {
						this._icon.style[L.DomUtil.TRANSFORM] += ' rotate('+options['rotate']+'deg)';
					}
				}
				,
				_setPos: function (pos) {
					L.DomUtil.setPosition(this._icon, pos);

					if (this._shadow) {
						L.DomUtil.setPosition(this._shadow, pos);
					}
					//this._zIndex = pos.y + this.options.zIndexOffset;
					//this._resetZIndex();
				}

			});

			L.GMXPointsMarkers = L.Polyline.extend({
				_getPathPartStr: function (points) {
					var round = L.Path.VML;
					var pointSize = this.options.pointSize || 5;

					for (var j = 0, len2 = points.length - (this.options.skipLastPoint ? 1 : 0), str = '', p; j < len2; j++) {
						p = points[j];
						if (round) {
							p._round();
						}
						str += 'M' + (p.x - pointSize) + ' ' + (p.y - pointSize);
						str += 'L' + (p.x + pointSize) + ' ' + (p.y - pointSize);
						str += 'L' + (p.x + pointSize) + ' ' + (p.y + pointSize);
						str += 'L' + (p.x - pointSize) + ' ' + (p.y + pointSize);
						str += 'L' + (p.x - pointSize) + ' ' + (p.y - pointSize);
						//str += (j ? 'L' : 'M') + p.x + ' ' + p.y;
					}
					return str;
				}
				,
				_updatePath: function () {
					if (!this._map) { return; }

					this._clipPoints();
					if(!this.options.skipSimplifyPoint) this._simplifyPoints();

					L.Path.prototype._updatePath.call(this);
				}
			});

			L.GMXgrid = L.Polyline.extend({
				_getPathPartStr: function (points) {
					var round = L.Path.VML;
					//if(this.options.textMarkers) {
						if(this._containerText) this._container.removeChild(this._containerText);
						this._containerText = this._createElement('g');
						//this._containerText.setAttribute("stroke", this._path.getAttribute("stroke"));
						//this._containerText.setAttribute("style", this._path.getAttribute("style"));
						this._containerText.setAttribute("stroke", this._path.getAttribute("stroke"));
						this._containerText.setAttribute("stroke-width", 0);

						//this._containerText.setAttribute("fill", "yellow");
						this._containerText.setAttribute("opacity", 1);
						this._container.appendChild(this._containerText);
						//var textMarkers = this.options.textMarkers || [];
						
					//}

					for (var j = 0, len2 = points.length, str = '', p, p1; j < len2; j+=2) {
						p = points[j];
						p1 = points[j+1];
						if (round) {
							p._round();
							p1._round();
						}
						str += 'M' + p.x + ' ' + p.y;
						str += 'L' + p1.x + ' ' + p1.y;
						if(this.options.textMarkers && this.options.textMarkers[j]) {
							var text = this._createElement('text');
							text.textContent = this.options.textMarkers[j];
							var dx = 0;
							var dy = 3;
							if(p.y == p1.y) dx = 20;
							if(p.x == p1.x) {
								text.setAttribute("text-anchor", "middle");
								dy = 20;
							}
							text.setAttribute('x', p.x + dx);
							text.setAttribute('y', p.y + dy);
							this._containerText.appendChild(text);
						}
					}
					return str;
				}
				,
				_updatePath: function () {
					if (!this._map) { return; }
					this._clipPoints();
					L.Path.prototype._updatePath.call(this);
				}
			});

			L.GMXLabels = L.Polyline.extend({
				_getPathPartStr: function (points) {
					var round = L.Path.VML;
					//if(this.options.textMarkers) {
						if(this._containerText) this._container.removeChild(this._containerText);
						this._containerText = this._createElement('g');
						//this._containerText.setAttribute("stroke", this._path.getAttribute("stroke"));
						//this._containerText.setAttribute("style", this._path.getAttribute("style"));
						this._containerText.setAttribute("stroke", this._path.getAttribute("stroke"));
						this._containerText.setAttribute("stroke-width", 0);
						if(this.options.color) this._containerText.setAttribute("fill", this.options.color);

						//this._containerText.setAttribute("fill", "yellow");
						this._containerText.setAttribute("opacity", 1);
						this._container.appendChild(this._containerText);
						//var textMarkers = this.options.textMarkers || [];
						
					//}

					for (var j = 0, len2 = points.length, str = '', p, p1; j < len2; j++) {
						p = points[j];
						if(this.options.textMarkers && this.options.textMarkers[j]) {
							var text = this._createElement('text');
							text.textContent = this.options.textMarkers[j];
							text.setAttribute("class", "leaflet-clickable");
							if(this.options['align'] === 'center') {
								text.setAttribute("text-anchor", "middle");
							} else if(this.options['align'] === 'left') {
								text.setAttribute("text-anchor", "left");
							} else if(this.options['right'] === 'right') {
								text.setAttribute("text-anchor", "right");
							}
							var dx = -1;
							var dy = 3;
							text.setAttribute('x', p.x + dx);
							text.setAttribute('y', p.y + dy);
							this._containerText.appendChild(text);
						}
					}
					return str;
				}
				,
				_updatePath: function () {
					if (!this._map) { return; }
					this._clipPoints();
					L.Path.prototype._updatePath.call(this);
				}
			});
			
			initFunc(mapDivID, 'leaflet');
			
			var centerControlDIV = gmxAPI.newStyledDiv({ position: "absolute", top: '-6px', left: '-6px', opacity: 0.8, 'pointerEvents': 'none' });
			var div = document.getElementById(mapDivID);
			div.parentNode.appendChild(centerControlDIV);
			var setCenterPoint = function ()
			{
					var vBounds = LMap.getPixelBounds();
					var y = (vBounds.max.y - vBounds.min.y)/2;
					var x = (vBounds.max.x - vBounds.min.x)/2;
					centerControlDIV.style.top = (y - 6) + 'px';
					centerControlDIV.style.left = (x - 6) + 'px';
			};
			var setControlDIVInnerHTML = function ()
			{
				var baseLayersTools = gmxAPI.map.baseLayersTools;
				var currTool = baseLayersTools.getToolByName(baseLayersTools.activeToolName);
				div.style.backgroundColor = utils.dec2hex(currTool.backgroundColor);
				var color = (currTool.backgroundColor === 1 ? 'white' : '#216b9c');
				centerControlDIV.innerHTML = '<svg viewBox="0 0 12 12" height="12" width="12" style=""><g><path d="M6 0L6 12" stroke-width="1" stroke-opacity="1" stroke="' + color + '"></path></g><g><path d="M0 6L12 6" stroke-width="1" stroke-opacity="1" stroke="' + color + '"></path></g></svg>';
				return false;
			};
			setTimeout(setControlDIVInnerHTML, 1);
			setTimeout(setCenterPoint, 1);
			gmxAPI.map.addListener('baseLayerSelected', setControlDIVInnerHTML, 100);
			if(gmxAPI.map.needMove) {
				setTimeout(function() {
					utils.runMoveTo();
				}, 500);
			}
			if(gmxAPI.map.needSetMode) {
				gmxAPI.map.setMode(gmxAPI.map.needSetMode);
				gmxAPI.map.needSetMode = null;
			}
			if(gmxAPI.map.standartTools && gmxAPI.isMobile) {
				gmxAPI.map.standartTools.remove();
			}
			//gmxAPI.map.standartTools.setVisible(false);
		}
	}

	// Добавить leaflet.js в DOM
	function addLeafLetObject(apiBase, flashId, ww, hh, v, bg, loadCallback, FlagFlashLSO)
	{
		mapDivID = flashId;
		initFunc = loadCallback;
		var apiHost = gmxAPI.getAPIFolderRoot();

		var css = document.createElement("link");
		css.setAttribute("type", "text/css");
		css.setAttribute("rel", "stylesheet");
		css.setAttribute("media", "screen");
		css.setAttribute("href", apiHost + "leaflet/leaflet.css");
		document.getElementsByTagName("head").item(0).appendChild(css);
		
		css = document.createElement("link");
		css.setAttribute("type", "text/css");
		css.setAttribute("rel", "stylesheet");
		css.setAttribute("media", "screen");
		css.setAttribute("href", apiHost + "leaflet/leafletGMX.css");
		document.getElementsByTagName("head").item(0).appendChild(css);
		
		if(gmxAPI.isIE) {
			css = document.createElement("link");
			css.setAttribute("type", "text/css");
			css.setAttribute("rel", "stylesheet");
			css.setAttribute("media", "screen");
			css.setAttribute("href", apiHost + "leaflet/leaflet.ie.css");
			document.getElementsByTagName("head").item(0).appendChild(css);
		}

		var script = document.createElement("script");
		script.setAttribute("charset", "windows-1251");
		//window.L_PREFER_CANVAS = true;		// полигоны в отдельном canvas слое
		script.setAttribute("src", apiHost + "leaflet/leaflet.js");
		document.getElementsByTagName("head").item(0).appendChild(script);
		//script.setAttribute("onLoad", onload );

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
		//gmxAPI._leaflet['LMapContainer'] = leafLetCont_;				// Контейнер лефлет карты

		return leafLetCont_;
	}
	
	//расширяем namespace
	var canvas = document.createElement('canvas');
	canvas.width = canvas.height = 512;
	if('getContext' in canvas) {
		gmxAPI._leaflet['labelCanvas'] = canvas;		// для расчета размеров label
		gmxAPI._addProxyObject = addLeafLetObject;		// Добавить в DOM
	} else {
		var str = '<br>Ваш браузер не поддерживает Canvas. Обновите версию браузера или установите новый. Рекомендуемые браузеры: ';
		var href = 'http://windows.microsoft.com/ru-RU/internet-explorer/download-ie';
		str += '<a href="'+href+'" target="_blank">IE9-10</a>';
		href = 'http://www.google.com/chrome'; str += ', <a href="'+href+'" target="_blank">Chrome</a>';
		href = 'http://www.opera.com/browser/'; str += ', <a href="'+href+'" target="_blank">Opera 12.x</a>';
		href = 'http://www.mozilla.org/en-US/'; str += ', <a href="'+href+'" target="_blank">Mozilla Firefox</a>';
		href = 'http://support.apple.com/kb/DL1531'; str += ', <a href="'+href+'" target="_blank">Safari</a>';
		href = 'http://browser.yandex.ru'; str += ', <a href="'+href+'" target="_blank">Yandex</a>';
		var res = gmxAPI.newElement(
			"div",
			{
				id: 'warning'
				,innerHTML: str
			});
		
		gmxAPI._addProxyObject = function() { return res; };		// Нет поддержки canvas
	}
	
    //gmxAPI._cmdProxy = leafletCMD;				// посылка команд отрисовщику
	gmxAPI.proxyType = 'leaflet';
    gmxAPI.APILoaded = true;					// Флаг возможности использования gmxAPI сторонними модулями
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	//gmxAPI._leaflet['LMap'] = LMap;				// leafLet карта
	gmxAPI._leaflet['lastZoom'] = -1;				// zoom нарисованный
	gmxAPI._leaflet['mInPixel'] = 0;				// текущее кол.метров в 1px
	gmxAPI._leaflet['waitSetImage'] = 0;			// текущее число загружаемых SetImage
	gmxAPI._leaflet['curDragState'] = false;		// текущий режим dragging карты
	gmxAPI._leaflet['mousePressed'] = false;		// признак нажатой мыши
})();



