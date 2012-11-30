// imageLoader - менеджер загрузки image
(function()
{
	var maxCount = 48;						// макс.кол. запросов
	var curCount = 0;						// номер текущего запроса
	var items = [];							// массив текущих запросов
	var itemsHash = {};						// Хэш по image.src
	var itemsCache = {};					// Кэш загруженных image по image.src

	var callCacheItems = function(item)	{		// загрузка image
		if(itemsCache[item.src]) {
			var arr = itemsCache[item.src];
			var first = arr[0];
			for (var i = 0; i < arr.length; i++)
			{
				var it = arr[i];
				if(first.isError) {
					if(it.onerror) it.onerror(null);
				} else if(first.imageObj) {
					if(it.callback) it.callback(first.imageObj);
				}
			}
			//itemsCache[item.src] = [first];
			delete itemsCache[item.src];
		}
	}
	var setImage = function(item)	{		// загрузка image
		var imageObj = new Image();
		var chkLoadedImage = function() {
			//if (!imageObj.complete) {
				//setTimeout(function() { chkLoadedImage(); }, 1);
			//} else {
				curCount--;
				item.imageObj = imageObj;
				callCacheItems(item);
			//}
		}
		imageObj.onload = function() { chkLoadedImage(); } ;
		imageObj.onerror = function() { curCount--; item.isError = true; callCacheItems(item); } ;
		curCount++;
		imageObj.src = item.src;
	}
		
	var nextLoad = function()	{		// загрузка image
		if(curCount > maxCount) { setTimeout(function() { nextLoad(); }, 1); return; }
		if(items.length < 1) return false;
		var item = items.shift();
		//if(item.bounds && !item.shiftY && !gmxAPI._leaflet['zoomstart']) {			// удаление устаревших запросов по bounds
		if(item.bounds && !item.shiftY) {			// удаление устаревших запросов по bounds
			if(!gmxAPI._leaflet['utils'].chkBoundsVisible(item.bounds)) {
				curCount--; item.isError = true; callCacheItems(item); return;
			}
		}
		
		if(itemsCache[item.src]) {
			var pitem = itemsCache[item.src][0];
			if(pitem.isError) {
				if(item.onerror) item.onerror(null);
			} else if(pitem.imageObj) {
				if(item.callback) item.callback(pitem.imageObj);
			} else {
				itemsCache[item.src].push(item);
			}
		} else {
			itemsCache[item.src] = [item];
			setImage(item);
		}
	}
	
	var imageLoader = {						// менеджер загрузки image
		'push': function(item)	{				// добавить запрос в конец очереди
			items.push(item);
			setTimeout(nextLoad, 0);
			return items.length;
		}
		,'unshift': function(item)	{				// добавить запрос в начало очереди
			items.unshift(item);
			setTimeout(nextLoad, 0);
			return items.length;
		}
	};

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['imageLoader'] = imageLoader;	// менеджер загрузки image
})();

// drawManager - менеджер отрисовки
(function()
{
	var nextId = 0;							// следующий ID mapNode
	var items = [];							// массив ID нод очереди отрисовки
	var itemsHash = {};						// Хэш нод требующих отрисовки

	var repaintItems = function()	{			// отрисовка ноды
		if(items.length < 1) return false;
		var id = items.shift();
		delete itemsHash[id];
		var node = gmxAPI._leaflet['mapNodes'][id];
		if(!node) return false;
		gmxAPI._leaflet['utils'].repaintNode(node, true);
		setTimeout(repaintItems, 0);
		return true;
	}
	
	var drawManager = {						// менеджер отрисовки
		'add': function(id)	{					// добавить ноду для отрисовки
			var node = gmxAPI._leaflet['mapNodes'][id];
			if(!node) return false;
			if(!itemsHash[id]) {
				itemsHash[id] = items.length;
				items.push(id);
			}
			setTimeout(repaintItems, 0);
			return items.length;
		}
		,'remove': function(id)	{				// удалить ноду
			if(itemsHash[id]) {
				var num = itemsHash[id];
				if(num == 0) items.shift();
				else {
					var arr = items.slice(0, num - 1);
					arr = arr.concat(items.slice(num));
					items = arr;
				}
				delete itemsHash[id];
				return true;
			}
			return false;
		}
		,'repaint': function()	{				// отрисовка нод
			repaintItems();
		}
	};

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['drawManager'] = drawManager;	// менеджер отрисовки
	//gmxAPI._leaflet['test'] = {'itemsHash': itemsHash, 'items': items};	// test
})();

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
	var utils = {							// Утилиты leafletProxy
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
//console.log('chkGlobalEvent', attr);
			if(!attr || !attr['evName']) return;
			var evName = attr['evName'];
			var standartTools = gmxAPI.map.standartTools;
			if(!gmxAPI._leaflet['curDragState'] && standartTools && standartTools['activeToolName'] === 'move') {	// проверяем векторные слои только в режиме перемещения и не рисуя
				var from = gmxAPI.map.layers.length - 1;
				for (var i = from; i >= 0; i--)
				{
					var child = gmxAPI.map.layers[i];
					if(!child.isVisible) continue;
					var mapNode = mapNodes[child.objectId];
					if(mapNode['eventsCheck']) {
						if(mapNode['eventsCheck'](evName, attr)) return;
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
		'chkVisibleObject': function(id)	{				// проверка видимости обьекта - по isVisible
			var node = mapNodes[id];
			if(!node) return true;
			if(node.isVisible === false) return false;
			return utils.chkVisibleObject(node['parentId']);
		}
		,
		'chkZoomObject': function(id, zoom)	{				// проверка видимости обьекта - по zoom
			var node = mapNodes[id];
			var pNode = mapNodes[node['parentId']];
			if(!zoom) zoom = LMap.getZoom();
			var flag = ((node['minZ'] && zoom < node['minZ']) || (node['maxZ'] && zoom > node['maxZ']) ? false 
				: (pNode ? utils.chkZoomObject(pNode.id, zoom) : true));
			return flag;
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
				if('image' in ph) {
					pt['iconUrl'] = ph['image'];
					utils.getImageSize(pt, true, id);
				}
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
			if(type in node) return node[type];
			if(recursion) return (node.parentId in mapNodes ? utils.getNodeProp(mapNodes[node.parentId], type, recursion) : null);
		}
		,
		'removeLeafletNode': function(node)	{					// перерисовать ноду - рекурсивно
			if(node['leaflet']) {
				var pNode = mapNodes[node['parentId']];
				var pGroup = (pNode ? pNode['group'] : LMap);
				if(node['marker'] && node['group']) {
					if(node['group']['_layers'][node['marker']['_leaflet_id']]) node['group'].removeLayer(node['marker']);
				}
				if(node['parentId']) {
					pGroup.removeLayer(node['group']);
				}
				if(pGroup['_layers'][node['leaflet']['_leaflet_id']]) pGroup.removeLayer(node['leaflet']);
				//if(node['marker'] && pGroup['_layers'][node['marker']['_leaflet_id']]) {
			}
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
		'repaintNode': function(node, recursion, type)	{					// перерисовать ноду - рекурсивно
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

					if(!utils.chkVisibleObject(node.id) || !utils.chkZoomObject(node.id, LMap.getZoom())) {		// если обьект невидим пропускаем
						setVisible({'obj': node, 'attr': false});
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
								setVisible({'obj': node, 'attr': true});
							}
						} else if(node['refreshMe']) { 
							node['refreshMe']();
							return;
						} else {
							node.leaflet = utils.drawNode(node, regularStyle);
							setNodeHandlers(node.id);
							//node['leaflet']._isVisible = false;
							if(node['leaflet']) setVisible({'obj': node, 'attr': true});
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
			var styleType = (style['iconUrl'] ? 'marker' : 'rectangle');
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
				};
				if(!style['scale']) style['scale'] = 1;
				var zn = utils.chkPropsInString(style['scale'], prop);
				var ww = Math.floor(style['imageWidth'] * zn);
				var hh = Math.floor(style['imageHeight'] * zn);
				opt['iconSize'] = new L.Point(ww, hh);
				if(style['center']) opt['iconAnchor'] = new L.Point(ww/2, hh/2);
				else {
					if(style['dx']) opt['iconAnchor'].x -= style['dx'];
					if(style['dy']) opt['iconAnchor'].y -= style['dy'];
				}
				
				var nIcon = L.Icon.extend({
					'options': opt
				});
				var optMarker = {
					icon: new nIcon()
					,'from': node.id
				};
				if(node['subType'] === 'drawing') {
					optMarker['draggable'] = true;
				}
				out = new L.Marker(new L.LatLng(pos[1], pos[0]), optMarker);
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
/*				
				if(node['subType'] === 'drawingFrame') {
					var drawMe = function(canvas_) {
						var canvas = canvas_;
						var canvas = canvas_;
					}
					var pp = (node.propHiden && node.propHiden['drawMe'] ? node.propHiden['drawMe'] : drawMe);
			//if(node.propHiden) {
				//if(node.propHiden['subType'] == 'tilesParent') {	//ограничение по zoom квиклуков
					
					var canvasIcon = L.canvasIcon({
						className: 'my-canvas-icon'
						,'node': node
						,'drawMe': drawMe
						//,iconAnchor: new L.Point(12, 12) // also can be set through CSS
					});
					out = L.marker([pos[1], pos[0]], {icon: canvasIcon});
				} else 
*/
				{
					out = new L.RectangleMarker(bounds, {
						fillColor: "#ff7800",
						color: "#000000",
						opacity: 1,
						weight: 2
					});
	/*				
					
					var opt = {
						'from': node.id
						,iconAnchor: new L.Point(0, 0)
						,fillColor: "#ff7800"
						,color: "#000000"
						,opacity: 1
						,weight: 2
						,bounds: bounds
						,'className': 'my-div-icon'
					};
					var nIcon = L.RectangleIcon.extend({
						'options': opt
					});
					var optMarker = {
						icon: new nIcon()
						,'from': node.id
					};
					if(node['subType'] === 'drawing') {
						optMarker['draggable'] = true;
					}
					out = new L.Marker(new L.LatLng(pos[1], pos[0]), optMarker);
					var optMarker = {
						fillColor: "#ff7800",
						color: "#000000",
						opacity: 1,
						weight: 2
					};
					if(node['subType'] === 'drawing') {
						//optMarker['editable'] = true;
						optMarker['draggable'] = true;
					}

					out = new L.RectangleMarker(bounds, optMarker);
					out = new L.RectangleIcon(bounds, optMarker);
					//out = new L.RectangleMarker(bounds, optMarker);
	*/
				}
			}
			if(out && node['subType'] === 'drawing') {
				out.on('drag', function(e) {		// Drag на drawing обьекте
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
					gmxAPI._listeners.dispatchEvent('onDrag', gmxNode, ph);		// tile загружен
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
				style: ('ready' in style ? style : utils.evalStyle(style, node))
			});
			return out;
		}
		,
		'drawMultiPolygon': function(node, style)	{			// отрисовка Polygon геометрии

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
		,
		'getMapPosition': function()	{			// Получить позицию карты
			var pos = LMap.getCenter();
			var size = LMap.getSize();
			var vbounds = LMap.getBounds();
			var nw = vbounds.getNorthWest();
			var se = vbounds.getSouthEast();
			return {
				'z': LMap.getZoom()
				,'stageHeight': size['y']
				,'x': gmxAPI.merc_x(pos['lng'])
				,'y': gmxAPI.merc_y(pos['lat'])
				,'latlng': {
					'x': pos['lng']
					,'y': pos['lat']
					,'mouseX': utils.getMouseX()
					,'mouseY': utils.getMouseY()
					,'extent': {
						'minX': nw['lng']
						,'minY': nw['lat']
						,'maxX': se['lng']
						,'maxY': se['lat']
					}
				}
			};
		}
	};
	// setLabel для mapObject
	function setLabel(id, iconAnchor)	{
		var node = mapNodes[id];
		if(!node || !node.regularStyle || !node.regularStyle.label || !('label' in node)) return false;
		var regularStyle = node.regularStyle;
		var labelStyle = regularStyle.label;
		var divStyle = {'width': 'auto', 'height': 'auto'};
		if(labelStyle['color']) divStyle['color'] = utils.dec2hex(labelStyle['color']);
		if(labelStyle['haloColor']) divStyle['backgroundColor'] = utils.dec2rgba(labelStyle['haloColor'], 0.3);
		//if(labelStyle['haloColor']) divStyle['backgroundColor'] = 'rgba(255, 255, 255, 0.3)';
		
		var opt = {'className': 'my-div-icon', 'html': node['label'], 'divStyle': divStyle };
		var optm = {'zIndexOffset': 1, 'title': ''}; // , clickable: false
		if(labelStyle['size']) opt['iconSize'] = new L.Point(labelStyle['size'], labelStyle['size']);
		//scale
		if(labelStyle['align'] === 'center') {
			opt['iconAnchor'] = new L.Point(Math.floor(iconAnchor.x/2), Math.floor(iconAnchor.y/2));
		} else {
			divStyle['bottom'] = 0;
			opt['iconAnchor'] = new L.Point(-Math.floor(iconAnchor.x/2) - 6, Math.floor(iconAnchor.y/2));
		}
		
		var myIcon = L.gmxIcon(opt);
		var pp = node.geometry.coordinates;

		optm['icon'] = myIcon;
		node['marker'] = L.marker([pp[1], pp[0]], optm);		
		node['marker'].addTo(node['group']);		
	}
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
		
		if(node['type'] === 'filter') {			// Установка стиля фильтра векторного слоя
			var pNode = mapNodes[node['parentId']];
			pNode.setStyleFilter(id);
		} else {
			gmxAPI._leaflet['drawManager'].add(id);			// добавим в менеджер отрисовки
			//utils.repaintNode(node, true);
			//setVisible({'obj': node, 'attr': true});
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
		for(var evName in scanexEventNames) {
			setHandlerObject(id, evName);
		}
/*		
		for(var evName in node['handlers']) {
			setHandlerObject(id, evName);
		}
*/		
		//setHandlerObject(id, 'onClick');
/*		
		var node = mapNodes[id];
		if(!node) return false;
		if(node['leaflet']) {
			node['leaflet']['options']['resID'] = id;
			var pNode = mapNodes[node['parentId']];
			for(var evName in node['handlers']) {
				setHandlerObject(id);
			}
		}
*/		
	}

	var scanexEventNames = {
		'onClick': 'click'
		,'onMouseDown': 'mousedown'
		//,'onMouseOver': 'mouseover'
		//,'onMouseOut': 'mouseout'
	};
	// добавить Handler для mapObject
	function setHandlerObject(id, evName)	{
		var node = mapNodes[id];
		if(!node) return false;
		if(node['leaflet']) {
			node['leaflet']['options']['resID'] = id;
			var hNode = getNodeHandler(id, evName);
			if(!hNode) return false;
			/*
			if(evName === 'onClick') {
				var func = function(e) {		// Проверка click
					gmxAPI._leaflet['utils'].chkGlobalEvent({'ev':e,'latlng': e.latlng, 'evName':evName, 'node':node, 'hNode':hNode});	// события векторного обьекта
				};
				node['leaflet'].on('click', func);
				if(node['marker']) {
					node['marker'].on('click', func);
				}
			}
			*/
			var func = function(e) {		// Проверка onMouseDown
				gmxAPI._leaflet['utils'].chkGlobalEvent({'ev':e,'latlng': e.latlng, 'evName':evName, 'node':node, 'hNode':hNode});	// события векторного обьекта
			};
			if(scanexEventNames[evName]) {
				node['leaflet'].on(scanexEventNames[evName], func);
				if(node['marker']) {
					node['marker'].on(scanexEventNames[evName], func);
				}
			}
		}
	}
	// Удалить mapObject
	function removeNode(key)	{				// Удалить ноду
		var rnode = mapNodes[key];
		if(!rnode) return;
		var pGroup = LMap;
		if(rnode['parentId'] && mapNodes[rnode['parentId']]) {
			pGroup = mapNodes[rnode['parentId']]['group'];
			pGroup.removeLayer(rnode['group']);
		}
		if(rnode['leaflet']) pGroup.removeLayer(rnode['leaflet']);
		delete mapNodes[key];
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
	function setVisible(ph) {
		var id = ph.obj.objectId || ph.obj.id;
		var node = mapNodes[id];
		if(node) {							// нода имеется
			//node.isVisible = ph.attr;
			var pNode = mapNodes[node['parentId']] || null;
			var pGroup = (pNode ? pNode['group'] : LMap);
			if(node['type'] === 'filter') {							// нода filter
				if(pNode) pNode.refreshFilter(id);
				return;
//			} else if(!node['leaflet'] && node['children'].length > 0) {	// нет leaflet проверить потомков
//				for (var i = 0; i < node['children'].length; i++) {
//					setVisibleRecursive(mapNodes[node['children'][i]], ph.attr);
//				}
			} else if(node['leaflet']) {							// нода имеет вид в leaflet
				if(ph.attr) {
					var flag = chkVisibilityObject(id);
					if(!flag) return;
					if(node['leaflet']._isVisible) return;
					if(node['type'] === 'RasterLayer') {
						node['leaflet']._isVisible = true;
						LMap.addLayer(node['leaflet']);
						utils.bringToDepth(node, node['zIndex']);
					}
					else
					{
						//if(node['geometry'] && !node['leaflet']) node['leaflet'] = utils.drawGeometry(node['geometry']);
	//if(!chkVisibilityObject(id)) return;
						if(node['parentId']) {
							//if(mapNodes[node['parentId']]) pNode = mapNodes[node['parentId']]['group'];
							pGroup.addLayer(node['group']);
						}
						node['leaflet']._isVisible = true;
						pGroup.addLayer(node['leaflet']);
					}
	/*
					else if(node['type'] === 'VectorLayer') {
						utils.repaintNode(node, true);
					}
					else if(node['type'] === 'mapObject') {
	gmxAPI._leaflet['drawManager'].add(id);			// добавим в менеджер отрисовки

	*/
//					for (var i = 0; i < node['children'].length; i++) {
//						setVisibleRecursive(mapNodes[node['children'][i]], ph.attr);
//					}
				}
				else
				{
					if(node['leaflet']._isVisible === false) return;
					if(node['type'] === 'RasterLayer') {
						if(node['leaflet']) {
							if(node['leaflet']._isVisible) LMap.removeLayer(node['leaflet']);
							node['leaflet']._isVisible = false;
						}
					}
					else {
						if(node['parentId']) {
							//if(mapNodes[node['parentId']]) pNode = mapNodes[node['parentId']]['group'];
							pGroup.removeLayer(node['group']);
						}
						node['leaflet']._isVisible = false;
						if(pGroup['_layers'][node['leaflet']['_leaflet_id']]) pGroup.removeLayer(node['leaflet']);
						
//						for (var i = 0; i < node['children'].length; i++) {
//							setVisibleRecursive(mapNodes[node['children'][i]], false);
//						}
						
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
			for (var i = 0; i < node['children'].length; i++) {
				setVisibleRecursive(mapNodes[node['children'][i]], ph.attr);
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
	function setVisibilityFilterRecursive(pNode, sqlFunc) {
		if(pNode['leaflet'] && pNode.geometry && pNode.geometry['properties']) {
			var flag = sqlFunc(pNode.geometry['properties']);
			setVisible({'obj': pNode, 'attr': flag});
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
	// Проверка видимости mapObject
	function chkVisibilityObject(id) {
		var node = mapNodes[id];
		var pNode = mapNodes[node['parentId']];
		var zoom = LMap.getZoom();
		var flag = ((node['minZ'] && zoom < node['minZ']) || (node['maxZ'] && zoom > node['maxZ']) ? false 
			: (pNode ? chkVisibilityObject(pNode.id) : true));
		return flag;
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
	// Получить данные векторного слоя по bounds геометрии - todo
	function getFeatures(ph) {
			var layer = ph.obj;
			var id = layer.objectId;
			var node = mapNodes[id];
			if(!node) return;						// Нода не определена
			var geom = ph.attr.geom;				// геометрия для определения bounds
			var callback = ph.attr.func;			// callback ответа
	}
	//gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': chkVisibilityObjects});
	// Команды в leaflet
	var commands = {				// Тип команды
		'getFeatures': getFeatures							// получить данные векторного слоя по bounds геометрии
		,
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
		'startDrawing': function(ph)	{					// Режим рисования
			gmxAPI._leaflet['curDragState'] = true;
			LMap.dragging.disable();
			return true;
		}
		,
		'stopDrawing': function(ph)	{						// Отмена режима рисования
			gmxAPI._leaflet['curDragState'] = false;
			LMap.dragging.enable();
			return true;
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
/*
			for (key in ph.obj.childsID) {
				var node = mapNodes[key];
				if(node['type'] === 'RasterLayer') continue;
console.log('bringToTop ' , id, zIndex, node['type']); 
				node['zIndex'] = zIndex;
				utils.bringToDepth(node, zIndex);
			}
*/			
			return zIndex;
		}
		,
		'bringToBottom': function(ph)	{					// установка zIndex - вниз
			var obj = ph.obj;
			var id = obj.objectId;
			var node = mapNodes[id];
			node['zIndex'] = 0;
//console.log('bringToBottom ' , id, 0); 
			utils.bringToDepth(node, 0);
/*			
			for (key in obj.childsID) {
				node = mapNodes[key];
				node['zIndex'] = 0;
				utils.bringToDepth(node, 0);
			}
*/
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
		'setVisible': function(ph)	{						// установить видимость mapObject
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(node) node.isVisible = ph.attr;
			return setVisible(ph);
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
			LMap.options.minZoom = ph.attr.z1;
			LMap.options.maxZoom = ph.attr.z2;
			var currZ = LMap.getZoom();
			if(currZ > LMap.getMaxZoom()) currZ = LMap.getMaxZoom();
			if(currZ < LMap.getMinZoom()) currZ = LMap.getMinZoom();
			LMap.setView(LMap.getCenter(), currZ);
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
			var zoom = ph.attr['z'] || LMap.getZoom();
			if(zoom > LMap.getMaxZoom() || zoom < LMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr['y'], ph.attr['x']);
			LMap.setView(pos, zoom);
		}
		,
		'slideTo':	function(ph)	{				//позиционирует карту по координатам центра и выбирает масштаб
			if(ph.attr['z'] > LMap.getMaxZoom() || ph.attr['z'] < LMap.getMinZoom()) return;
			var pos = new L.LatLng(ph.attr['y'], ph.attr['x']);
			LMap.setView(pos, ph.attr['z']);
		}
		,
		'setLabel':	function(ph)	{				// Установка содержимого label
			var id = ph.obj.objectId;
			mapNodes[id]['label'] = ph['attr']['label'];
			gmxAPI._leaflet['drawManager'].add(id);
			//setLabel(id, ph['attr']['label']);
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
			if(node['type'] === 'filter') {			// Удаление фильтра векторного слоя
				var pNode = mapNodes[node['parentId']];
				pNode.removeFilter(id);
			} else if(node['type'] === 'mapObject') {	// Удаление mapObject
				removeNode(id);
			}
			delete mapNodes[id];
		}
		,
		'setVectorTiles': setVectorTiles			// Установка векторный тайловый слой
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
		'getGeometry':	function(ph)	{		// 
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return null;						// Нода не была создана через addObject
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
				if(node && node.seFlip) node.seFlip(id);
			}
			return id;
		}
		,
		'setZoomBounds':	function(ph)	{		// Установка границ по zoom
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node) return;
			node['minZ'] = ph.attr['minZ'];
			node['maxZ'] = ph.attr['maxZ'];
			if(node.propHiden) {
				if(node.propHiden['subType'] == 'tilesParent') {	//ограничение по zoom квиклуков
					var pnode = mapNodes[node.parentId];
					if(pnode) {
						if(pnode['setZoomBoundsQuicklook']) pnode['setZoomBoundsQuicklook'](node['minZ'], node['maxZ']);
					}
				} else if(node['type'] == 'mapObject') {			//ограничение по zoom mapObject
					gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': function() {
							gmxAPI._leaflet['drawManager'].add(id);
						}
					});
				}
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
			setImage(node, ph);
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
		'setEditObjects':	function(ph)	{							// Установка редактируемых обьектов слоя
			var id = ph.obj.objectId;
			var node = mapNodes[id];
			if(!node || !node.setEditObjects) return false;
			node.setEditObjects(ph.attr);
			return true;
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
/*		
if(!(cmd in commands)
	&& cmd != 'setCursorVisible'
	&& cmd != 'stopDragging'
	&& cmd != 'setClusters'
	) {
	// cmd"" cmd"" getVisibility	setDateInterval		
	var tt = 1;
}
*/
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
//console.log(cmd + ' : ' , hash , ' : ' , ret);
		return ret;
	}

	var ProjectiveMath = {
		'invertMatrix': function(mat) {
			var ret = [];
			for (var i=0; i<3; i++)
			{
				ret[i] = [];
				for (var j=0; j<3; j++)
				{
					var i1 = (i+1)%3;
					var j1 = (j+1)%3;
					var i2 = (i+2)%3;
					var j2 = (j+2)%3;
					ret[i][j] = mat[j1][i1]*mat[j2][i2] - mat[j2][i1]*mat[j1][i2];
				}
			}
			var det = 1/(mat[0][0]*ret[0][0] + mat[1][0]*ret[0][1] + mat[2][0]*ret[0][2]);
			for (var i=0; i<3; i++)
				for (var j=0; j<3; j++)
					ret[i][j] *= det;
			return ret;
		}
		,
		'applyLine': function(line, x, y) {
			return line[0]*x + line[1]*y + line[2];
		}
		,
		'getX': function(mat, x, y) {
			return this.applyLine(mat[0], x, y)/this.applyLine(mat[2], x, y);
		}
		,
		'getY': function(mat, x, y) {
			return this.applyLine(mat[1], x, y)/this.applyLine(mat[2], x, y);
		}
		,
		'multiplyMatrices': function(m1, m2) {
			var m = [];
			for (var i=0; i<3; i++)
			{
				m[i] = [];
				for (var j=0; j<3; j++)
				{
					m[i][j] = 0;
					for (var k=0; k<3; k++)
						m[i][j] += m1[i][k]*m2[k][j];
				}
			}
			return m;
		}
		,
		'buildOneWayMatrix': function(x1, y1, x2, y2, x3, y3, x4, y4) {
			var directThreePoints = [
				[x2 - x1, x4 - x1, x1], 
				[y2 - y1, y4 - y1, y1],
				[0.0, 0.0, 1.0]
			];
			var inverseThreePoints = this.invertMatrix(directThreePoints);
			var tx = this.getX(inverseThreePoints, x3, y3);
			var ty = this.getY(inverseThreePoints, x3, y3);
			var a = tx/(tx + ty - 1.0);
			var b = ty/(tx + ty - 1.0);
			return this.multiplyMatrices(directThreePoints, [
				[a, 0.0, 0.0], 
				[0.0, b, 0.0], 
				[a - 1.0, b - 1.0, 1.0]
			]);
		}
		,
		'buildMatrix': function(x1, y1, x2, y2, x3, y3, x4, y4, x1_, y1_, x2_, y2_, x3_, y3_, x4_, y4_) {
			return this.multiplyMatrices(
				this.buildOneWayMatrix(x1_, y1_, x2_, y2_, x3_, y3_, x4_, y4_),
				this.invertMatrix(this.buildOneWayMatrix(x1, y1, x2, y2, x3, y3, x4, y4))
			);
		}
	}

	// 
	function setImage(node, ph)	{
		var attr = ph.attr;
		node['isSetImage'] = true;

		var LatLngToPixel = function(y, x) {
			var point = new L.LatLng(y, x);
			return LMap.project(point);
		}
		
		var zoomPrev = LMap.getZoom();
		var minPoint = null;
		var getPixelPoints = function(ph) {
			var LatLngToPixel = function(y, x) {
				var point = new L.LatLng(y, x);
				return LMap.project(point);
			}
			var out = {};
			minPoint = LatLngToPixel(ph['y1'], ph['x1']); out['x1'] = 0; out['y1'] = 0;
			var pix = LatLngToPixel(ph['y2'], ph['x2']); out['x2'] = pix.x - minPoint.x; out['y2'] = pix.y - minPoint.y;
			pix = LatLngToPixel(ph['y3'], ph['x3']); out['x3'] = pix.x - minPoint.x; out['y3'] = pix.y - minPoint.y;
			pix = LatLngToPixel(ph['y4'], ph['x4']); out['x4'] = pix.x - minPoint.x; out['y4'] = pix.y - minPoint.y;

			out.ww = Math.round(out['x2']);
			out.hh = Math.round(out['y3']);
			return out;
		}

		//node['refreshMe'] = function(imageObj, canvas) {
		var posLatLng = new L.LatLng(attr['y1'], attr['x1']);
		var repaint = function(imageObj, canvas) {
			var w = imageObj.width;
			var h = imageObj.height;
			var ph = getPixelPoints(attr);
			var ww = ph.ww;
			var hh = ph.hh;
			posLatLng = new L.LatLng(attr['y1'], attr['x1']);
			var p1 = LMap.project(posLatLng);

			var point = LMap.project(new L.LatLng(0, -180));
			var p180 = LMap.project(new L.LatLng(0, 180));
			var worldSize = p180.x - point.x;

			var vBounds = LMap.getBounds();
			var vpNorthWest = vBounds.getNorthWest();
			var vpSouthEast = vBounds.getSouthEast();
			var vp1 = LMap.project(vpNorthWest);
			var vp2 = LMap.project(vpSouthEast);
			var wView = vp2.x - vp1.x;
			var hView = vp2.y - vp1.y;

			var dx = 0;
			
			//var iconPoint = p11;
			//iconPoint.lng += dx;
			var deltaX = 0;
			var deltaY = 0;
			var rx = w/ph.ww;
			var ry = h/ph.hh;

			if(wView + 100 < ww || hView + 100 < hh) {
				ww = wView;
				hh = hView;
				deltaX = p1.x - vp1.x + (dx === 360 ? worldSize : (dx === -360 ? -worldSize : 0));
				deltaY = p1.y - vp1.y;
				posLatLng = vpNorthWest;
			}
			attr['reposition']();

			canvas.width = ww;
			canvas.height = hh;
			var ctx = canvas.getContext('2d');

			var paintPolygon = function (ph, content) {
				var ctx = ph['ctx'];
				var arr = [];
				var coords = ph['coordinates'];
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

				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.setTransform(1, 0, 0, 1, 0, 0);
				var pattern = ctx.createPattern(content, "no-repeat");
				ctx.fillStyle = pattern;
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
		
			if(rx === 1 && ry === 1) {
				paintPolygon({'coordinates': node.geometry.coordinates, 'ctx': ph['ctx']}, imageObj);
			} else {
				if(ph != null) {
					if(ph.sx != null) {
						ph.x4 = ph.x1;
						ph.x2 = ph.x3 = ph.x1 + w * ph.sx;
						ph.y2 = ph.y1;
						ph.y3 = ph.y4 = ph.y1 + h * ph.sy;
					}
				}
				//if (!me.controlPointsSet)
				{
					ph.tx1 = 0.0;
					ph.ty1 = 0.0;
					ph.tx2 = w;
					ph.ty2 = 0.0;
					ph.tx3 = w;
					ph.ty3 = h;
					ph.tx4 = 0.0;
					ph.ty4 = h;
				}

				var matrix = ProjectiveMath.buildMatrix(
					ph.tx1, ph.ty1, ph.tx2, ph.ty2, ph.tx3, ph.ty3, ph.tx4, ph.ty4, 
					ph.x1, ph.y1, ph.x2, ph.y2, ph.x3, ph.y3, ph.x4, ph.y4
				);
				
				var container = document.createElement("canvas");
				container.width = canvas.width;
				container.height = canvas.height;
				var ptx = container.getContext('2d');
				ptx.setTransform(rx, 0, 0, ry, deltaX, deltaY);

				var drawTriangle = function(tx1, ty1, tx2, ty2, tx3, ty3)
				{
					var x1 = ProjectiveMath.getX(matrix, tx1, ty1);
					var y1 = ProjectiveMath.getY(matrix, tx1, ty1);
					var x2 = ProjectiveMath.getX(matrix, tx2, ty2);
					var y2 = ProjectiveMath.getY(matrix, tx2, ty2);
					var x3 = ProjectiveMath.getX(matrix, tx3, ty3);
					var y3 = ProjectiveMath.getY(matrix, tx3, ty3);
					var sw = Math.floor(x2 - x1);
					var sh = Math.floor(y3 - y1);
					var tw = Math.floor(tx2 - tx1);
					var th = Math.floor(ty3 - ty1);
					
					ptx.save();
					var inv = ProjectiveMath.invertMatrix([
						[tx2 - tx1, ty2 - ty1, 0],
						[tx3 - tx1, ty3 - ty1, 0],
						[tx1,  ty1,  1]
					  ]);
					ptx.transform(inv[0][0], inv[0][1], inv[1][0], inv[1][1], inv[2][0], inv[2][1]);
					ptx.transform(sw, y2 - y1, x3 - x1, sh, x1, y1);
					ptx.drawImage(
						imageObj,
						tx1, ty1, tw, th,
						x1, y2, sw, sh
					);
					ptx.beginPath();
					ptx.moveTo(x1, y1);
					ptx.lineTo(x2, y2);
					ptx.lineTo(x3, y3);
					ptx.lineTo(x1, y1);
					ptx.closePath();
					ptx.clip();
					ptx.restore();
				}
				
				var n = 1;
				try {
					for (var i=0; i<n; i++)
					{
						for (var j=0; j<n; j++)
						{
							var tx1 = w*i*1.0/n;
							var ty1 = h*j*1.0/n;
							var tx2 = w*(i + 1)*1.0/n;
							var ty2 = h*(j + 1)*1.0/n;
							drawTriangle(tx1, ty1, tx2, ty1, tx1, ty2);
							drawTriangle(tx2, ty2, tx2, ty1, tx1, ty2);
						}
					}
				} catch(e) {
					gmxAPI.addDebugWarnings({'func': 'drawTriangle', 'event': e});
				}

				paintPolygon({'coordinates': node.geometry.coordinates, 'ctx': ctx}, container);
			}
			zoomPrev = LMap.getZoom();
		}

		var imageObj = null;
		var canvas = null;
		var drawMe = function(canvas_) {
			canvas = canvas_;
			imageObj = new Image();
			imageObj.crossOrigin = 'anonymous';
			imageObj.onload = function() {
				node['refreshMe'] = function() {
					repaint(imageObj, canvas);
				}
				repaint(imageObj, canvas);
			};
			var src = attr['url'];
			//var src = '1.jpg';
			imageObj.src = src;
		}
		
		var canvasIcon = L.canvasIcon({
			className: 'my-canvas-icon'
			,'node': node
			,'drawMe': drawMe
			//,iconAnchor: new L.Point(12, 12) // also can be set through CSS
		});
		
		//L.marker([attr['y1'], attr['x1']], {icon: canvasIcon}).addTo(LMap);
		attr['reposition'] = function() {
			if(node['leaflet']) node['leaflet'].setLatLng(posLatLng);
		}
		var marker = L.marker(posLatLng, {icon: canvasIcon});
		node['leaflet'] = marker;
		node['group'].addLayer(marker);
		setVisible({'obj': node, 'attr': true});

		var redrawMe = function(e) {
			repaint(imageObj, canvas);
		}
		//LMap.on('zoomend', function(e) { repaint(imageObj, canvas); });
		//gmxAPI._listeners.addListener({'eventName': 'onZoomend', 'func': redrawMe });
		gmxAPI.map.addListener('positionChanged', redrawMe, 11);
		
		var zoomTimer = null;
		LMap.on('zoomanim', function(e) {
			var zoom = LMap.getZoom();
//console.log('bbbbbbbbb ' , ' : '+  zoom); 
			if(zoomTimer) clearTimeout(zoomTimer);
			zoomTimer = setTimeout(function()
			{
				var zoom = LMap.getZoom();
				zoomTimer = null;
				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			}, 10);
		});
/*		
		LMap.on('zoomstart', function(e) {
			var zoom = LMap.getZoom();
			zoomTimer = setTimeout(function()
			{
				var _zoom = e.target._animateToZoom;
				var scale = L.CRS.scale(zoom) / L.CRS.scale(_zoom);
				//var scale = LMap.getZoomScale(_zoom);
				var ctx = canvas.getContext('2d');
				ctx.setTransform(1/scale, 0, 0, 1/scale, 0, 0);
console.log('bbbbb333bbbb ' ,  scale +' : ',  zoom +' : ' ,  _zoom +' : ',  e); 
				zoomTimer = null;
			}, 0);
		});
		
		LMap.on('viewreset', function(e) {
			var zoom = LMap.getZoom();
			var _zoom = e.target._zoom;
console.log('bbbbbbbbbbvcxccc ' , _zoom +' : '+  zoom); 
			var scale = LMap.getZoomScale(zoomPrev);
			var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			//ctx.setTransform(1/scale, 0, 0, 1/scale, 0, 0);
			var _zoom = e.target._zoom;
			return;
			var ph = getPixelPoints(attr);
			var w = imageObj.width;
			var h = imageObj.height;
			var rx = w/ph.ww;
			var ry = h/ph.hh;
			var ctx = canvas.getContext('2d');
			ctx.transform(rx, 0, 0, ry, 0, 0);
		});
*/		
	}
	
	// 
	function getTilesBounds(arr)	{
		//var hash = {'in':{}, 'out':{}};
		var hash = {};
		for (var i = 0; i < arr.length; i+=3)
		{
			var st = arr[i+2] + '_' + arr[i] + '_' + arr[i+1];
			var pz = Math.round(Math.pow(2, Math.floor(arr[i+2]) - 1));
			var bounds = utils.getTileBounds({'x':Math.floor(arr[i]) + pz, 'y':pz - 1 - Math.floor(arr[i+1])}, Math.floor(arr[i+2]));
			bounds.min.x = gmxAPI.merc_x(bounds.min.x);
			bounds.max.x = gmxAPI.merc_x(bounds.max.x);
			bounds.min.y = gmxAPI.merc_y(bounds.min.y);
			bounds.max.y = gmxAPI.merc_y(bounds.max.y);
			var d = (bounds.max.x - bounds.min.x)/10000;
			bounds.min.x += d;
			bounds.max.x -= d;
			bounds.min.y += d;
			bounds.max.y -= d;
			bounds.delta = 2*d;
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
//gmxAPI._tools['standart'].setVisible(false);	// Пока не работает map.drawing
		if(!node) return;						// Нода не определена
		node['type'] = 'RasterLayer';
		var inpAttr = ph.attr;
		node['subType'] = ('subType' in inpAttr ? inpAttr['subType'] : (inpAttr['projectionCode'] === 1 ? 'OSM' : ''));
		node['zIndex'] = utils.getIndexLayer(id);
		var attr = {};
		if(node.propHiden) {
			if(node.propHiden.geom) {
				attr['geom'] = node.propHiden['geom'];					// Геометрия от обьекта векторного слоя
				attr['bounds'] = attr['geom']['bounds'];				// Bounds слоя
			}
		}
		var pNode = mapNodes[node.parentId];					// Нода родителя
		if(pNode && pNode.propHiden && pNode.propHiden.subType === 'tilesParent') {
			attr['minZoom'] = pNode.minZ || 1;
			attr['maxZoom'] = pNode.maxZ || 30;
										// pNode.parentId нода векторного слоя по обьекту которого создан растровый слой 
		} else {
			attr = prpLayerAttr(layer, node);
		}
		
		node['chkGeometry'] = function() {			// подготовка границ растрового слоя
			var pt = prpGeom(node['geometry']);
			if(pt['geom']) attr['geom'] = pt['geom'];					// Массив Point границ слоя
			if(pt['bounds']) attr['bounds'] = pt['bounds'];				// Bounds слоя
			if(waitRedraw) {
				myLayer.options.attr = attr;
				waitRedraw();
			}
		};
		if(node['geometry']) node['chkGeometry']();

		var initCallback = function(obj) {			// инициализация leaflet слоя
			if(obj._container) {
				if(obj._container.id != id) obj._container.id = id;
				if(obj._container.style.position != 'absolute') obj._container.style.position = 'absolute';
				node['zIndex'] = utils.getIndexLayer(id);
				utils.bringToDepth(node, node['zIndex']);
				if(node['shiftY']) node['shiftY']();
			}
		};

//console.log('kkkk ' , id, utils.getIndexLayer(id)); 
		var option = {
			'minZoom': inpAttr['minZoom'] || attr['minZoom'] || 1
			,'maxZoom': inpAttr['maxZoom'] || attr['maxZoom'] || 21
			,'zIndex': utils.getIndexLayer(id)
			,'initCallback': initCallback
			,'tileFunc': inpAttr['func']
			,'attr': attr
			,'nodeID': id
			,'async': true
			
			//isBaseLayer
			
			//,'updateWhenIdle': false
			//,'reuseTiles': true
			//,'continuousWorld': true
			//,'detectRetina': true
			//,'tms': true
			//,'noWrap': true
			//,'subdomains': []
		};
		var myLayer = new L.TileLayer.ScanExCanvas(option);
		if(node['subType'] === 'OSM') {
			var getTileUrl = function(x, y, zoom) {
				if(!zoom) zoom = LMap.getZoom();
				var pz = Math.pow(2, zoom);
				var tx = x;
				if(tx < 0) tx += pz;
				var scanexTilePoint = {
					'x': (tx % pz - pz/2) % pz
					,'y': -y - 1 + pz/2
				};
				return inpAttr['func'](scanexTilePoint.x, scanexTilePoint.y, zoom);
			}
			//myLayer.options.tileFunc = getTileUrl;
			//myLayer.options.continuousWorld = true;
		
			node['shiftY'] = function() {
				myLayer.options.shiftY = utils.getOSMShift();
				if(myLayer._container) gmxAPI.position(myLayer._container, 0, myLayer.options.shiftY);
			}
			LMap.on('zoomend', node['shiftY']);
			LMap.on('move', node['shiftY']);
		}
		node['leaflet'] = myLayer;

		var redrawTimer = null;										// Таймер
		var waitRedraw = function()	{								// Требуется перерисовка с задержкой
			if(redrawTimer) clearTimeout(redrawTimer);
			if(node.isVisible && myLayer._isVisible != chkVisibilityObject(id)) {
				//if(node['minZ'] || node['maxZ']) utils.repaintNode(node, true);
				setVisible({'obj': node, 'attr': !myLayer._isVisible});
			}
			
			redrawTimer = setTimeout(function()
			{
				redrawTimer = null;
				myLayer.redraw();
			}, 10);
			return false;
		}
		gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': waitRedraw });
		myLayer._isVisible = (layer.isVisible ? true : false);
		if(myLayer._isVisible) 
			LMap.addLayer(myLayer);

		return out;
	}

	// Подготовка атрибута границ слоя
	function prpGeom(geom) {
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
				var pt = prpGeom(layer.geometry);
				if(pt['geom']) out['geom'] = pt['geom'];					// Массив Point границ слоя
				if(pt['bounds']) out['bounds'] = pt['bounds'];				// Bounds слоя
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
		var gmxNode = gmxAPI.mapNodes[id];		// Нода gmxAPI

		node['type'] = 'VectorLayer';
		node['minZ'] = 1;
		node['maxZ'] = 21;

		//node['observeVectorLayer'] = null;
		node['observerNode'] = null;
		
		node['needParse'] = [];
		node['parseTimer'] = 0;
		node['filters'] = [];
		//node['dataTiles'] = {};
		node['tilesLoaded'] = {};
		node['tilesLoadProgress'] = {};
		node['loaderFlag'] = false;
		node['badTiles'] = {};
		node['tilesGeometry'] = {};				// Геометрии загруженных тайлов по z_x_y
		node['addedItems'] = {};				// Геометрии обьектов добавленных в векторный слой
		node['objectsData'] = {};				// Обьекты из тайлов по identityField
		node['deletedObjects'] = {};
		node['editedObjects'] = {};
		node['mousePos'] = {};					// позиция мыши в тайле
//		node['tilesDrawing'] = {};				// список отрисованных тайлов в текущем Frame
		node['zIndex'] = utils.getIndexLayer(id);
		node['quicklookZoomBounds'] = {			//ограничение по зуум квиклуков
			'minZ': 1
			,'maxZ': 21
		};
		node['tileRasterFunc'] = null;			// tileFunc для квиклуков
		
		node['flipIDS'] = [];					// Массив обьектов flip сортировки
		node['flipNum'] = 0;					// Порядковый номер flip
		
		node['labels'] = {};					// Хэш label слоя

		var inpAttr = ph.attr;
		node['subType'] = (inpAttr['filesHash'] ? 'Temporal' : '');
		
		if(layer.properties['IsRasterCatalog']) {
			node['rasterCatalogTilePrefix'] = layer['tileSenderPrefix'];
		}

		//node['shiftY'] = 0;						// Сдвиг для ОСМ вкладок
		node['setObserver'] = function (pt) {				// Установка получателя видимых обьектов векторного слоя
			node['observerNode'] = pt.obj.objectId;
			var ignoreVisibilityFilter = pt.attr.ignoreVisibilityFilter || false;		// отменить контроль фильтра видимости
			var callback = pt.attr.func;
		
			var observerTiles = {};
			var observerObj = {};
			node['chkObserver'] = function () {				// проверка изменений видимости обьектов векторного слоя
				var currPosition = gmxAPI.currPosition;
				if(!currPosition || !currPosition.extent) return;
				var ext = currPosition.extent;
				var out = [];
				var tiles = node['tiles'];
				for (var key in tiles)
				{
					var tb = tiles[key];
					var tvFlag = (tb.max.x < ext.minX || tb.min.x > ext.maxX || tb.max.y < ext.minY || tb.min.y > ext.maxY);
					if(tvFlag) {								// Тайл за границами видимости
						if(!observerTiles[key]) continue;
						delete observerTiles[key];
					} else {
						observerTiles[key] = true;
					}
					var items = node['tilesGeometry'][key];
					if(items && items.length > 0) {
						for (var i = 0; i < items.length; i++)
						{
							var item = items[i];
							if(node['temporal'] && !node.chkTemporalFilter(item)) continue;														// не прошел по мультивременному фильтру
							if(!item['propHiden'] || !item['propHiden']['toFilters'] || item['propHiden']['toFilters'].length == 0) continue;	// обьект не виден по стилевым фильтрам
							
							if(!ignoreVisibilityFilter && node['_sqlFuncVisibility'] && !node['_sqlFuncVisibility'](item['properties'])) continue; 	// если фильтр видимости на слое не отменен
							
							var id = item.id;
							var vFlag = (item.bounds.max.x < ext.minX || item.bounds.min.x > ext.maxX || item.bounds.max.y < ext.minY || item.bounds.min.y > ext.maxY);
							var ph = {'layerID': node.id, 'properties': item.properties };
							if(vFlag) {					// Обьект за границами видимости
								if(observerObj[id]) {
									ph.onExtent = false;
									ph.geometry = item.exportGeo();
									out.push(ph);
									delete observerObj[id];
								}
							} else {
								if(!observerObj[id]) {
									ph.onExtent = true;
									ph.geometry = item.exportGeo();
									out.push(ph);
									var tilesKeys = {};
									tilesKeys[key] = true;
									observerObj[id] = { 'tiles': tilesKeys , 'item': item };
								}
							}
						}
					}
				}
				if(out.length) {
					callback(out);
				}
			}
			gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onMoveEnd', 'obj': gmxAPI.map, 'func': node['chkObserver']});
		};

		node.chkLoadTiles = function()	{		// Проверка необходимости загрузки тайлов
			if(gmxNode['isVisible'] === false) return;								// Слой не видим
			var currZ = LMap.getZoom();
			if(currZ < node['minZ'] || currZ > node['maxZ']) return;				// Неподходящий zoom
			
			var currPosition = gmxAPI.currPosition;
			if(!currPosition || !currPosition.extent) return;
			var ext = currPosition.extent;
			var tiles = node['tiles'];
//console.log(tileKey, gmxNode);
			for (var tileKey in tiles)
			{
				if(node['tilesGeometry'][tileKey] || node['badTiles'][tileKey] || node['tilesLoadProgress'][tileKey]) continue;
				var tb = tiles[tileKey];
				var tvFlag = (tb.max.x < ext.minX || tb.min.x > ext.maxX || tb.max.y < ext.minY || tb.min.x > ext.maxY);
				if(tvFlag) continue;								// Тайл за границами видимости
				var arr = tileKey.split('_');
				var srcArr = option.tileFunc(arr[1], arr[2], arr[0]);
				if(typeof(srcArr) === 'string') srcArr = [srcArr];

				var counts = srcArr.length;
				var needParse = [];
				(function(tileID) {						// подгрузка векторных тайлов
					for (var i = 0; i < srcArr.length; i++)
					{
						var src = srcArr[i] + '&r=t';
						node['loaderFlag'] = true;
						node['tilesLoadProgress'][tileID] = true;
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
							if(counts < 1) {
								gmxAPI._listeners.dispatchEvent('onTileLoaded', gmxNode, {'obj':gmxNode, 'attr':{'data':{'tileID':tileID, 'data':needParse}}});		// tile загружен
								needParse = [];
								node['loaderFlag'] = false;
								for (var i in node['tilesLoadProgress'])
								{
									node['loaderFlag'] = true;
									break;
								}
								if(!node['loaderFlag']) node['leaflet'].redraw();		// перезапросить drawTile слоя
							}
						});
					}
				})(tileKey);
			}
		};
		// todo сделать загрузку векторных тайлов без layer.redraw() лефлета
		//gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onMoveEnd', 'obj': gmxAPI.map, 'func': node.chkLoadTiles});

		node['chkTemporalFilter'] = function (item) {				// проверка мультивременного фильтра
			if(node['temporal'] && item['propHiden']) {
				if(node['temporal']['ut1'] > item['propHiden']['unixTimeStamp'] || node['temporal']['ut2'] < item['propHiden']['unixTimeStamp']) {
					return false;
				}
			}
			return true;
		}
		var getItemsFromTile = function(items, mPoint) {			// получить обьекты из тайла
			var arr = [];
			if(items && items.length > 0) {
				for (var i = 0; i < items.length; i++)
				{
					var item = items[i];
					if(!item.propHiden['toFilters'] || !item.propHiden['toFilters'].length) continue;		// обьект не попал в фильтр
					if(node.chkTemporalFilter(item)) {
						if((item['contains'] && item['contains'](mPoint))
							|| item.bounds.contains(mPoint)) arr.push(item);
					}
				}
			}
			return arr;
		}

		node['seFlip'] = function(id) {				// добавить обьект flip сортировки
			node['flipNum']++;
/*
			
			var arr = [];
			for (var i = 0; i < node['flipIDS'].length; i++)
			{
				var tID = node['flipIDS'][i];
				if(tID != id) arr.push(tID);
			}
			node['flipIDS'] = arr;
			if(node['flipIDS'].length > 10) node['flipIDS'].shift();
			node['flipIDS'].unshift(id);
			myLayer.redraw();
*/			
		}

		node['setTiledQuicklooks'] = function(callback, minZoom, maxZoom, tileSenderPrefix) {			// установка тайловых квиклуков
			if(callback) node['tileRasterFunc'] = callback;
			if(minZoom) node['quicklookZoomBounds']['minZ'] = minZoom;
			if(maxZoom) node['quicklookZoomBounds']['maxZ'] = maxZoom;
			if(tileSenderPrefix) node['rasterCatalogTilePrefix'] = layer['tileSenderPrefix'];
		}
		
		node['setZoomBoundsQuicklook'] = function(minZ, maxZ) {			//ограничение по зуум квиклуков
			node['quicklookZoomBounds']['minZ'] = minZ;
			node['quicklookZoomBounds']['maxZ'] = maxZ;
		}
		var getItemsByPoint = function(latlng) {			// проверка событий векторного слоя
			var arr = [];
			if(!node['observerNode']) {
				var mPoint = new L.Point(gmxAPI.merc_x(latlng['lng']), gmxAPI.merc_y(latlng['lat']));
				arr = getItemsFromTile(node['addedItems'], mPoint);
				for (var tileID in node['tiles'])
				{
					var tileBound = node['tiles'][tileID];
					if(tileBound.contains(mPoint)) {
						var iarr = node['tilesGeometry'][tileID];
						if(iarr && iarr.length > 0) {
							var items = getItemsFromTile(iarr, mPoint);
							if(items.length) arr = arr.concat(items);
						}
					}
				}
			}
			return arr;
		}
		gmxAPI.map.addListener('onMouseMove', function(ph) {
			if(gmxAPI._leaflet['mousePressed']) return false;
			var latlng = ph.attr['latlng'];
			var arr = getItemsByPoint(latlng);
			gmxAPI._div.style.cursor = (arr.length ? 'pointer' : '');
			if(arr.length) return true;
		}, -11);
		
		node['eventsCheck'] = function(evName, attr) {			// проверка событий векторного слоя
			if(node['observerNode']) return false;
			if(!attr) attr = gmxAPI._leaflet['clickAttr'];
			if(!attr.latlng) return false;
			var latlng = attr.latlng;
			var arr = getItemsByPoint(latlng);
		
			if(evName === 'onClick' && arr.length) {
				node['flipIDS'] = arr;
				if(node['flipNum'] >= arr.length) node['flipNum'] = 0; 

				var item = node['flipIDS'][node['flipNum']];
				for (var i = 0; i < node['flipIDS'].length; i++) {
					var id = node['flipIDS'][i];
					for (var i1 = 0; i1 < arr.length; i1++) {
						if(arr[i1].id == id) item = arr[i1];
					}
				}

				var prop = item.properties;
				if(!item.propHiden['toFilters'] || !item.propHiden['toFilters'].length) return;		// обьект не попал в фильтр
				var fID = item.propHiden['toFilters'][0];
				var filter = gmxAPI.mapNodes[fID];
				if(!filter) return;						// не найден фильтр
				var geom = utils.transformGeometry(item);
				mapNodes[fID]['handlers'][evName].call(filter, item.id, prop, {'onClick': true, 'geom': geom});
				return true;
			}
		}

		var initCallback = function(obj) {			// инициализация leaflet слоя
			if(obj._container) {
				if(obj._container.id != id) obj._container.id = id;
				if(obj._container.style.position != 'absolute') obj._container.style.position = 'absolute';
				utils.bringToDepth(node, node['zIndex']);
			}
		};

		var attr = prpLayerAttr(layer, node);
		node['minZ'] = inpAttr['minZoom'] || attr['minZoom'] || 1;
		node['maxZ'] = inpAttr['maxZoom'] || attr['maxZoom'] || 21
		
		var identityField = attr['identityField'] || 'ogc_fid';
		var typeGeo = attr['typeGeo'] || 'Polygon';
		var TemporalColumnName = attr['TemporalColumnName'] || '';
		var option = {
			'minZoom': node['minZ']
			,'maxZoom': node['maxZ']
			,'id': id
			,'identityField': identityField
			,'initCallback': initCallback
			,'async': true
		};
//console.log('sssssss ' , id, option['minZoom'], ' : ' , option['maxZoom']);
//utils.bringToDepth(node, node['zIndex']);
		if(node['parentId']) option['parentId'] = node['parentId'];
		
		node['tiles'] = getTilesBounds(inpAttr.dataTiles);
		option['attr'] = attr;
		option['tileFunc'] = inpAttr['tileFunction'];
		var myLayer = new L.TileLayer.VectorTiles(option);
		node['leaflet'] = myLayer;
		
		
		if(layer.properties['visible']) {
		//if(layer.isVisible) {
			setVisible({'obj': node, 'attr': true});
			node.isVisible = true;
		} else {
			node.isVisible = false;
		}
		//myLayer._isVisible = (layer.isVisible ? true : false);

		function styleToGeo(geo, filter)	{			// Стиль обьекта векторного слоя
			//var style = (filter ? utils.evalStyle(filter.regularStyle, geo)
			if(!filter) return;
			
			var style = filter.regularStyle;
			if(filter.regularStyleIsAttr) style = utils.evalStyle(filter.regularStyle, geo);
			
			var size = style['size'] || 5;
			
			if(style['marker']) {
				if(style['image']) {
					if(style['imageWidth']) geo.sx = style['imageWidth']/2;
					if(style['imageHeight']) geo.sy = style['imageHeight']/2;
				} else {
					return;
				}
				
				//if(filter) filter.styleRecalc = (style['image'] ? false : true);
			} else {
				if(style['stroke']) {
					geo.sx = geo.sy = size;
				}
				if(style['fill']) {
					geo.sx = geo.sy = size;
				}
			}
			
			geo.curStyle = style;
		}
		function chkObjectFilters(geo)	{				// Получить фильтры для обьекта
			var toFilters = [];
			for(var j=0; j<node.filters.length; j++) {
				var filterID = node.filters[j];
				var filter = mapNodes[node.filters[j]];
				var flag = (filter && filter.sqlFunction ? filter.sqlFunction(geo['properties']) : true);
				if(flag) {
					toFilters.push(filterID);
					styleToGeo(geo, filter);
					break;						// Один обьект в один фильтр 
				}
			}
			return toFilters;
		}

		function objectsToFilters(arr, tileID)	{				// Разложить массив обьектов по фильтрам
			var outArr = [];

			for (var i = 0; i < arr.length; i++)
			{
				var ph = arr[i];
				if(!ph) return;
				var prop = ph['properties'];
				var propHiden = {};
				propHiden['fromTiles'] = {};
				propHiden['subType'] = 'fromVectorTile';
				var _notVisible = false;
				if(TemporalColumnName) {
					var zn = prop[TemporalColumnName] || '';
					zn = zn.replace(/(\d+)\.(\d+)\.(\d+)/g, '$2/$3/$1');
					var vDate = new Date(zn);
					var offset = vDate.getTimezoneOffset();
					var dt = Math.floor(vDate.getTime() / 1000  - offset*60);
					propHiden['unixTimeStamp'] = dt;
				}
				var tileBounds = null;
				if(tileID) {
					propHiden['tileID'] = tileID;
					propHiden['fromTiles'][tileID] = true;
					tileBounds = (tileID === 'addItem' ? utils.maxBounds() : node['tiles'][tileID]);
				}
				
				var id = ph['id'] || prop[identityField];
				var geo = {};
				if(ph['geometry']) {
					if(!ph['geometry']['type']) ph['geometry']['type'] = typeGeo;
					geo = utils.fromTileGeometry(ph['geometry'], tileBounds);
					if(!geo) {
						gmxAPI._debugWarnings.push({'tileID': tileID, 'badObject': ph['geometry']});
						continue;
					}
					geo['propHiden'] = propHiden;
					geo['id'] = id;
					geo['properties'] = prop;
					outArr.push(geo);
				}
				if(node['objectsData'][id]) {		// Обьект уже имеется - нужна склейка геометрий
					var pt = node['objectsData'][id];
					pt.propHiden['fromTiles'][tileID] = true;
					//geo = utils.unionGeometry(null, geo, pt['geometry']);
					//var tt =1;
					//removeNode(rnode);
				} else {
					node['objectsData'][id] = geo;
				}
				propHiden['toFilters'] = chkObjectFilters(geo);
			}
			return outArr;
		}

		node['removeItems'] = function(data) {		// удаление обьектов векторного слоя 
			for (var index in data)
			{
				var pid = data[index];
				if(node['addedItems'][pid]) delete node['addedItems'][pid];
				var pt = node['objectsData'][pid];
				if(pt) {
					var fromTiles = pt.propHiden['fromTiles'];
					for(var tileID in fromTiles) {
						var arr = (tileID == 'addItem' ? node['addedItems'] : node['tilesGeometry'][tileID]);	// Обьекты тайла
						if(arr && arr.length) {
							for (var i = 0; i < arr.length; i++) {
								if(arr[i].id == pid) {
									(tileID == 'addItem' ? node['addedItems'] : node['tilesGeometry'][tileID]).splice(i, 1);	// Обьекты тайла
									break;
								}
							}
						}
					}
				}
			}
			waitRedraw();
		}

		node['addItems'] = function(data) {			// добавление обьектов векторного слоя
			node['addedItems'] = objectsToFilters(data, 'addItem');
			waitRedraw();
			return true;
		}
		node['setEditObjects'] = function(attr) {			// добавление обьектов векторного слоя
			if(attr.removeIDS) {
				var arr = [];
				for (var key in attr.removeIDS)
				{
					arr.push(key);
				}
				node['removeItems'](arr);
			}
			if(attr.addObjects) {
				node['addItems'](attr.addObjects);
			}
			return true;
		}
		
//node.repaintCount = 0;
		var observerTimer = null;										// Таймер
		node.repaintTile = function(attr)	{							// перерисовать векторный тайл слоя
			var out = false;
			if(node['observerNode']) {
				if(observerTimer) clearTimeout(observerTimer);
				observerTimer = setTimeout(node['chkObserver'], 0);
			}

			var zoom = attr['zoom'];
			if(zoom != gmxAPI._leaflet['lastZoom']) {
				gmxAPI._leaflet['lastZoom'] = zoom;
				var tileSize = Math.pow(2, 8 - zoom) * 156543.033928041;
				gmxAPI._leaflet['mInPixel'] = 256/tileSize;
			}
			var cnt = 0;
			attr['node'] = node;

			var setCanvasStyle = function(ctx, style)	{							// указать стиль Canvas
				if(style['stroke']) {
					attr['ctx'].lineWidth = style['weight'] || 1;
					var opacity = ('opacity' in style ? style['opacity'] : 1);
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
			var setLabel = function(item)	{							// установка label
				if(node['labels'][item.id]) return;
				var regularStyle = item.curStyle;
				var labelStyle = regularStyle.label;
				var divStyle = {'width': 'auto', 'height': 'auto'};
				if(labelStyle['color']) divStyle['color'] = utils.dec2hex(labelStyle['color']);
				if(labelStyle['haloColor']) divStyle['backgroundColor'] = utils.dec2rgba(labelStyle['haloColor'], 0.3);
				//if(labelStyle['haloColor']) divStyle['backgroundColor'] = 'rgba(255, 255, 255, 0.3)';
				
				var opt = {'className': 'my-div-icon', 'html': node['label'], 'divStyle': divStyle };
				if(labelStyle['field']) opt['html'] = item.properties[labelStyle['field']];
				//opt['html'] = '<nobr>'+opt['html']+'</nobr>';
				
				var optm = {'zIndexOffset': 1, 'title': ''}; // , clickable: false
				if(labelStyle['size']) opt['iconSize'] = new L.Point(labelStyle['size'], labelStyle['size']);

				var iconAnchor = new L.Point(0, 0);
				if(labelStyle['align'] === 'center') {
					opt['iconAnchor'] = new L.Point(Math.floor(iconAnchor.x/2), Math.floor(iconAnchor.y/2));
				} else {
					divStyle['bottom'] = 0;
					opt['iconAnchor'] = new L.Point(-Math.floor(iconAnchor.x/2) - 6, Math.floor(iconAnchor.y/2));
				}
				
				var myIcon = L.gmxIcon(opt);
				var pp = item.coordinates;

				optm['icon'] = myIcon;
				var marker = L.marker([gmxAPI.from_merc_y(pp.y), gmxAPI.from_merc_x(pp.x)], optm);		
				marker.addTo(node['group']);
				node['labels'][item.id] = marker;
				
			}
			
			var drawGeoArr = function(arr, flag)	{							// указать стиль Canvas
				var flipDraw = {};
				for (var i = 0; i < node['flipIDS'].length; i++) flipDraw[node['flipIDS'][i].id] = true;

				var res = [];
//console.log('dddddd ' , arr.length , ' : ' , attr);

				for (var i1 = 0; i1 < arr.length; i1++)
				{
					var geom = arr[i1];
					if(node['_sqlFuncVisibility'] && !node['_sqlFuncVisibility'](geom['properties'])) continue; // если фильтр видимости на слое

					var propHiden = geom['propHiden'];
					var filters = propHiden['toFilters'];
					var filter = null;

					if(filters && filters.length) {
						filter = mapNodes[filters[0]];
						if(!filter) {
							filters = propHiden['toFilters'] = chkObjectFilters(geom);
							filter = mapNodes[filters[0]];
						}
						if(filter && (filter.styleRecalc || !geo.curStyle)) styleToGeo(geom, filter);
					}
					//if(!filter || filter.isVisible === false || !utils.chkZoomObject(filter.id, zoom)) continue;		// если нет фильтра или он невидим пропускаем
					if(!filter || filter.isVisible === false) {		// если нет фильтра или он невидим пропускаем
						continue;
					}

					if(!geom.curStyle || !node.chkTemporalFilter(geom)) {	// не прошел по мультивременному фильтру
						continue;
					}
					
/*
					if(node['temporal'] && propHiden) {
						if(node['temporal']['ut1'] > propHiden['unixTimeStamp'] || node['temporal']['ut2'] < propHiden['unixTimeStamp']) {
							continue;
						}
					}
*/
					if(geom.type === 'Point' || geom.type === 'Polyline' || geom.type === 'MultiPolyline' || geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
						var notIntersects = false;
						if(geom['intersects']) {
							if(!geom['intersects'](attr.bounds)) notIntersects = true;	// если geom имеет свой метод intersects
						}
						else if(!attr.bounds.intersects(geom.bounds)) notIntersects = true;					// обьект не пересекает границы тайла
						//if(flipDraw[geom['id']] && flag) {
							//res.push(geom);
							//continue;
						//}
						if(notIntersects) {				// обьект не пересекает границы тайла
							continue;
						}
						//var filters = propHiden['toFilters'];
						//var filter = mapNodes[filters[0]];
						var style = geom.curStyle || null;
						//if(filter && filter.styleRecalc) style = null;
						//if(style == null) style = (filter ? utils.evalStyle(filter.regularStyle, geom) : defaultStyle);
						//geom.curStyle = style;
						//var style = (filter ? utils.evalStyle(filter.regularStyle, geom) : defaultStyle);
						setCanvasStyle(attr['ctx'], style);
						attr['style'] = style;

						if(node['tileRasterFunc'] && zoom >= node['quicklookZoomBounds']['minZ'] && zoom <= node['quicklookZoomBounds']['maxZ']) {
							//if(attr.bounds.intersects(geom.bounds)) {			// обьект пересекает границы тайла - загружаем растры
								var rUrl = node['tileRasterFunc'](attr.scanexTilePoint['x'], attr.scanexTilePoint['y'], attr['zoom'], geom);
								// todo tileRasterFunc разный формат на http://localhost/Kosmosnimki/index.html
								var setImage = function(attr, geo) {
									var me = attr;
									var item = {
										'src': rUrl
										,'zoom': me['zoom']
										,'callback': function(imageObj){
											geo['paintFill'](me);
											var pattern = me.ctx.createPattern(imageObj, "no-repeat");
											me.ctx.fillStyle = pattern;
											me.ctx.fill();
											geo['paint'](me);
										}
										,'onerror': function(){
										}
									};
									gmxAPI._leaflet['imageLoader'].push(item);
								}
								setImage(attr, geom);
								
							//}
						} else {
							var pr = geom['paint'](attr);
							if(pr && attr.tile.style.cursor != 'pointer') {
								cnt += pr;
								attr.tile.style.cursor = 'pointer';
							}
						}
						if(geom.type === 'Point' && geom.curStyle.label) setLabel(geom);
					}
				}
				return res;
			}

			var needDraw = [];
			for (var key in node['tilesGeometry'])						// Перебрать все загруженные тайлы
			{
				var tb = node['tiles'][key];
				if(!tb) continue;
				if( tb.min.x - tb.delta > attr.bounds.max.x				// Тайл не пересекает границы
					|| tb.max.x + tb.delta < attr.bounds.min.x
					|| tb.min.y - tb.delta > attr.bounds.max.y
					|| tb.max.y + tb.delta < attr.bounds.min.y
				) {
					continue;
				}
/*				
				if(!tb.intersects(attr.bounds)) {
					continue;				// Тайл не пересекает границы
				}
*/
				var arr = drawGeoArr(node['tilesGeometry'][key], true);
				needDraw = needDraw.concat(arr);
			}
			if(node['addedItems'].length) {
				needDraw = needDraw.concat(drawGeoArr(node['addedItems'], true));
			}

			var arr = [];
			var arr1 = [];
			for (var i = 0; i < node['flipIDS'].length; i++) {
				var id = node['flipIDS'][i].id;
				for (var i1 = 0; i1 < needDraw.length; i1++) {
					if(needDraw[i1].id == id) (i == node['flipNum'] ? arr1 : arr).push(needDraw[i1]);
				}
			}
			arr = arr.concat(arr1);
			drawGeoArr(arr);
			attr.tile._layer.tileDrawn(attr.tile);
/**/
//node.repaintCount++; //shifty
//console.log(node.repaintCount + ' Count: ' + cnt + ' tile: ' + attr.drawTileID + ' ccc: ' , attr.scanexTilePoint);
			return out;
		}

		node.parseVectorTile = function(data, tileID)	{				// парсинг векторного тайла
			node['tilesGeometry'][tileID] = objectsToFilters(data, tileID);
			return true;
		}
		var redrawTimer = null;										// Таймер
		var waitRedraw = function()	{								// Требуется перерисовка с задержкой
			if(redrawTimer) clearTimeout(redrawTimer);
			redrawTimer = setTimeout(function()
			{
				redrawTimer = null;
				myLayer.redraw();
			}, 10);
			return false;
		}
		var reCheckFilters = function()	{								// переустановка обьектов по фильтрам
			for (var tileID in node['tilesGeometry'])						// Перебрать все загруженные тайлы
			{
				var arr = node['tilesGeometry'][tileID];
				for (var i = 0; i < arr.length; i++) {
					chkObjectFilters(arr[i]);
				}
			}
		}
		node.waitRedraw = waitRedraw;				// перерисовать слой
		gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': function(fid) {
				//if(!node.isVisible || myLayer._isVisible) return false;
				if(!node.isVisible) return false;
				var flag = myLayer._isVisible;
				var currZ = LMap.getZoom();
				flag = (currZ < node['minZ'] || currZ > node['maxZ'] ? false : true);		// Неподходящий zoom
				if(flag != myLayer._isVisible) {
					setVisible({'obj': node, 'attr': flag});
					waitRedraw();
				}
			}
		});
		
		node.refreshFilter = function(fid)	{		// обновить фильтр
			var filterNode = mapNodes[fid];
			if(!filterNode) return;						// Нода не была создана через addObject
			//var gmxNode = gmxAPI.mapNodes[fid];
			filterNode.styleRecalc = true;
			waitRedraw();
			//myLayer.redraw();
			//filterNode.styleRecalc = false;
//console.log(' refreshFilter: ' + fid + ' : ');
			return true;
		}
		//gmxAPI._listeners.addl('onIconLoaded', null, id);		// image загружен
		gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onIconLoaded', 'func': function(eID) {
			for (var i = 0; i < node['filters'].length; i++)
			{
				if(node['filters'][i] === eID) node.refreshFilter(eID);
			}
//console.log(' onIconLoaded: ' + eID + ' : ' + id);
			}
		});
/*		
		node.chkFilters = function(fid)	{		// обновить стиль фильтра
			for (var i = 0; i < node['filters'].length; i++)
			{
				node.refreshFilter(node['filters'][i]);
			}
		}
*/		
		node.setStyleFilter = function(fid)	{		// обновить стиль фильтра
			node.refreshFilter(fid);
			return true;
		}

		node.removeFilter = function(fid)	{		// Удаление фильтра векторного слоя
			var arr = [];
			for (var i = 0; i < node['filters'].length; i++)
			{
				if(node['filters'][i] != fid) arr.push(node['filters'][i]);
			}
			node['filters'] = arr;
			//reCheckFilters();
		}
		node.addFilter = function(fid)	{			// Добавить фильтр к векторному слою
			var flag = true;
			for (var i = 0; i < node['filters'].length; i++)
			{
				if(node['filters'][i] == fid) {
					flag = false;
					break;
				}
			}
			if(flag) node['filters'].push(fid);
			node.refreshFilter(fid);
		}

		function removeNode(key)	{				// Удалить ноду
			var rnode = mapNodes[key];
			if(!rnode) return;
			var pNode = LMap;
			if(rnode['parentId']) {
				pNode = mapNodes[rnode['parentId']]['group'];
				pNode.removeLayer(rnode['group']);
			}
			if(rnode['leaflet']) pNode.removeLayer(rnode['leaflet']);
			delete mapNodes[key];
		}

		node.removeTile = function(key)	{			// Удалить тайл
/*			
			var pt = node['tilesGeometry'][key];
			
			if(!pt) return;							// тайл не загружен
			for(var ogc_fid in pt)
			{
				var ph = pt[ogc_fid];
				var arr = ph['toFilters'];
				for (var i = 0; i < arr.length; i++)
				{
					removeNode(arr[i]);
				}
				delete node['objectsData'][ogc_fid];
			}
*/
			delete node['tilesGeometry'][key];
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
/*
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
//						setVisible({'obj': rnode, 'attr': (ut1 > dt || ut2 < dt ? false : true)});
					}
				}
			}
			return true;
		}
*/
		node.startLoadTiles = function(attr)	{		// Перезагрузка тайлов векторного слоя
			var redrawFlag = false;
			if (!attr.notClear) {
				for(var key in node['tilesGeometry']) {
					node.removeTile(key);	// Полная перезагрузка тайлов
				}
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
				}
				
			}
			
			if (attr.add || attr.del) {			// Для обычных слоев
				if (attr.del) {
					for(var key in attr.del) node.removeTile(key);	// Полная перезагрузка тайлов
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
			//if('ut1' in attr && 'ut2' in attr) {		// Есть временной фильтр
				//node.chkTemporalFilter(attr);
			//}

//			if(redrawFlag && node.leaflet) node.leaflet.redraw();
			//if(node.leaflet) waitRedraw();
			//setVisibleRecursive(gmxNode, true);

//console.log(' startLoadTiles: ' + attr + ' : ');
			return true;
		}
		
		// Обработчик события - onTileLoaded
		gmxAPI._listeners.addListener({'level': 11, 'eventName': 'onTileLoaded', 'obj': gmxAPI.mapNodes[id], 'func': function(ph) {
				var nodeLayer = mapNodes[id];
				var tileID = ph.attr['data']['tileID'];
				var data = ph.attr['data']['data'];
				//nodeLayer['dataTiles'][tileID] = 
				nodeLayer.parseVectorTile(data, tileID);
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
		out['sx'] = out['sy'] = 5;
		
		// Экспорт точки в АПИ
		out['exportGeo'] = function (chkPoint) {
			var res = {'type': 'POINT'};
			res['coordinates'] = p;
			return res;
		}
		// Проверка совпадения с другой точкой
		out['contains'] = function (chkPoint) {
			var deltax = out.sx / gmxAPI._leaflet['mInPixel'];
			var deltay = out.sy / gmxAPI._leaflet['mInPixel'];
			return (
				chkPoint.x < (bounds.min.x - deltax)
				|| chkPoint.x > (bounds.max.x + deltax)
				|| chkPoint.y < (bounds.min.y - deltay)
				|| chkPoint.y > (bounds.max.y + deltay)
				? false : true);
		}
		// Проверка пересечения с bounds
		out['intersects'] = function (chkBounds) {
			var deltax = out.sx / gmxAPI._leaflet['mInPixel'];
			var deltay = out.sy / gmxAPI._leaflet['mInPixel'];
			return (
				point.x < (chkBounds.min.x - deltax)
				|| point.x > (chkBounds.max.x + deltax)
				|| point.y < (chkBounds.min.y - deltay)
				|| point.y > (chkBounds.max.y + deltay)
				? false : true);
		}

		// Отрисовка точки
		out['paint'] = function (attr) {
			//if(!bounds.intersects(attr['bounds'])) return;				// проверка пересечения полигона с отображаемым тайлом
			var zoom = attr['zoom'];
			var vbounds = attr['bounds'];
			var mInPixel = gmxAPI._leaflet['mInPixel'];

			//var ctx = gmxAPI._leaflet['ptx'];
			//ctx.clearRect(0, 0, 256, 256);
			
			var ctx = attr['ctx'];
			var style = attr['style'];
			//var size = style['size'] || 4;
			
			var x = attr['x'];
			var y = 256 + attr['y'];
			var px1 = point.x * mInPixel - x - out['sx']; 		px1 = (0.5 + px1) << 0;
			var py1 = y - point.y * mInPixel - out['sy'];		py1 = (0.5 + py1) << 0;
			
			//size *= 2;
			if(style['label']) {
				var tt = 1;
			}
			
			if(style['marker']) {
				if(style['image']) {
					ctx.drawImage(style['image'], px1, py1);
					if(style['imageWidth']) out['sx'] = style['imageWidth']/2;
					if(style['imageHeight']) out['sy'] = style['imageHeight']/2;
				}
				
			} else {
				if(style['stroke']) {
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
			return 1;		// количество отрисованных точек в геометрии
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
		var coords = [];
		var cnt = 0;
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
			var res = {};
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
		// Отрисовка полигона
		out['paint'] = function(attr) {
			var res = paintStroke(attr);
			return res;
		}
		
		return out;
	}
})();

// MULTILINESTRING MultiPolyline
(function()
{
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['MultiPolyline'] = function(geo, tileBounds_) {				// класс MultiPolygonGeometry
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
//return;
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
		// проверка необходимости отрисовки геометрии
		var chkNeedDraw = function (attr) {
			if(!bounds.intersects(attr['bounds'])) return false;				// проверка пересечения полигона с отображаемым тайлом
			var node = attr['node'];
			return node.chkTemporalFilter(out);
/*
			if(node['temporal'] && out['propHiden']) {
				if(node['temporal']['ut1'] > out['propHiden']['unixTimeStamp'] || node['temporal']['ut2'] < out['propHiden']['unixTimeStamp']) {
					return false;
				}
			}
			return true;
*/			
		}
		// Отрисовка заполнения полигона
		var paintFill = function (attr, fillFlag) {
			if(!chkNeedDraw(attr)) return false;				// проверка необходимости отрисовки

			var ctx = attr['ctx'];
			var x = attr['x'];
			var y = 256 + attr['y'];
			var mInPixel = gmxAPI._leaflet['mInPixel'];
			ctx.beginPath();
//	console.log('nnn ' , attr , ' : ' , coords);
			for (var i = 0; i < coords.length; i++)
			{
				var pArr = coords[i];
				//var pArr = L.PolyUtil.clipPolygon(this['coordinates'][i], attr['bounds']);
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
//console.log(bounds , ' paintStroke: ' , attr.bounds);
			if(!chkNeedDraw(attr)) return false;				// проверка необходимости отрисовки
//console.log(' ok: ' , attr.bounds);
			
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
				//var pArr = L.PolyUtil.clipPolygon(this['coordinates'][i], attr['bounds']);
//ctx.beginPath();
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
//ctx.beginPath();
//ctx.closePath();
//ctx.stroke();
			}
			//ctx.closePath();
			ctx.stroke();
			return true;		// отрисована геометрия
		}
		// Отрисовка геометрии полигона
		out['paintStroke'] = function (attr) {
			paintStroke(attr);
		}
		// Отрисовка полигона
		out['paint'] = function(attr) {
			if(attr.style.fill) paintFill(attr, true);
			var res = paintStroke(attr);
			//attr.ctx.stroke();
			return res;
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
		out['cnt'] = cnt;
		out['paint'] = function (attr) {
//return;
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
		var mapID = ph['objectId'];
		mapNodes[mapID] = {
			'type': 'map'
			,'handlers': {}
			,'children': []
			,'id': mapID
			,'group': LMap
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

			LMap = new L.Map(leafLetCont_,
				{
					zoomControl: false
					,boxZoom: false
					,doubleClickZoom: false
					//,worldCopyJump: false
					
					//,inertia: false
					//,fadeAnimation: false
					//,markerZoomAnimation: true
					//,dragging: false
					//,zoomAnimation: false
					//,trackResize: true
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

			var pos = new L.LatLng(50, 35);
			//var pos = new L.LatLng(50.499276, 35.760498);
			LMap.setView(pos, 4);
//console.log('waitMe ' , pos);
			LMap.on('moveend', function(e) {
				gmxAPI._listeners.dispatchEvent('onMoveEnd', gmxAPI.map, {});
			});
			LMap.on('move', function(e) {
				var zoom = LMap.getZoom();
				if(!zoom) {
					return;
				}
				var pos = LMap.getCenter();
				var size = LMap.getSize();
				var vbounds = LMap.getBounds();
				var nw = vbounds.getNorthWest();
				var se = vbounds.getSouthEast();
				var ext = {
					'minX': nw['lng']
					,'minY': se['lat']
					,'maxX': se['lng']
					,'maxY': nw['lat']
				};
				var attr = {
					'currPosition': {
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
					}
				};
				attr['currPosition']['mouseX'] = gmxAPI.merc_x(attr['currPosition']['latlng']['mouseX']);
				attr['currPosition']['mouseY'] = gmxAPI.merc_x(attr['currPosition']['latlng']['mouseY']);
				attr['currPosition']['extent'] = {
					'minX': gmxAPI.merc_x(ext['minX']),
					'minY': gmxAPI.merc_y(ext['minY']),
					'maxX': gmxAPI.merc_x(ext['maxX']),
					'maxY': gmxAPI.merc_y(ext['maxY'])
				};
				gmxAPI._updatePosition(e, attr);
				if(setCenterPoint) setCenterPoint();
				if(gmxAPI.map.handlers['onMove']) {
					var mapID = gmxAPI.map['objectId'];
					var node = mapNodes[mapID];
					if(node['handlers']['onMove']) node['handlers']['onMove'](mapID, gmxAPI.map.properties, attr);
				}
			});
			var parseEvent = function(e) {		// Парсинг события мыши
				var target = e.originalEvent.originalTarget || e.originalEvent.target;
				var out = {
					'latlng': e.latlng
					//,'containerPoint': e.containerPoint
					,'buttons': e.originalEvent.buttons || e.originalEvent.button
					,'ctrlKey': e.originalEvent.ctrlKey
					,'altKey': e.originalEvent.altKey
					,'shiftKey': e.originalEvent.shiftKey
					,'metaKey': e.originalEvent.metaKey
					,'e': e
				};
				if(target) {
					out['_layer'] = target['_layer']
					out['tID'] = target['id']
					out['tilePoint'] = target['tilePoint']
				}
//console.log(e.containerPoint);
				return out;
				
			}

			var timeDown = 0;
			LMap.on('click', function(e) {		// Проверка click слоя
				var timeClick = new Date().getTime() - timeDown;
				if(timeClick > 1000) return;
				var attr = parseEvent(e);
				attr['evName'] = 'onClick';
				gmxAPI._leaflet['clickAttr'] = attr;
				gmxAPI._leaflet['utils'].chkGlobalEvent(attr);
			});
			
			LMap.on('mousedown', function(e) {
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
			});
			LMap.on('mousemove', function(e) {
				if(gmxAPI._leaflet['mousedown']) timeDown -= 900;
				gmxAPI._leaflet['mousePos'] = e.latlng;
				var attr = parseEvent(e);
				attr['evName'] = 'onMouseMove';
				//if(e.originalEvent.buttons) {
					gmxAPI._listeners.dispatchEvent('onMouseMove', gmxAPI.map, {'attr':attr});
				//}
				gmxAPI._leaflet['utils'].chkMouseHover(attr)
			});
			LMap.on('mouseup', function(e) {
				gmxAPI._leaflet['mousePressed'] = false;
				gmxAPI._listeners.dispatchEvent('onMouseUp', gmxAPI.map, {'attr':{'latlng':e.latlng}});
				setTimeout(function() { skipClick = false;	}, 10);
			});
			
			LMap.on('zoomstart', function(e) {
				gmxAPI._leaflet['zoomstart'] = true;
				gmxAPI._listeners.dispatchEvent('onZoomstart', null, {});
			});
			LMap.on('zoomend', function(e) {
				gmxAPI._leaflet['zoomstart'] = false;
				gmxAPI._listeners.dispatchEvent('onZoomend', null, {});
			});

			// Обработчик события - mapInit
			gmxAPI._listeners.addListener({'level': -10, 'eventName': 'mapInit', 'func': onMapInit});

			function drawCanvasPolygon( ctx, x, y, geom, zoom, bounds, shiftY) {
				if(!geom) return;
				ctx.save();
				//ctx.translate(x, y);
				ctx.beginPath();
				if(!shiftY) shiftY = 0;
				
				for (var i = 0; i < geom.length; i++)
				{
					var pt = geom[i];
					var pArr = (shiftY == 0 ? L.PolyUtil.clipPolygon(pt, bounds) : pt);
					for (var j = 0; j < pArr.length; j++)
					{
						var p = new L.LatLng(pArr[j].y, pArr[j].x);
						var pp = LMap.project(p, zoom);
						var px = pp.x - x;				px = (0.5 + px) << 0;
						var py = pp.y - y - shiftY;		py = (0.5 + py) << 0;
						if(j == 0) ctx.moveTo(px, py);
						ctx.lineTo(px, py);
					}
					pArr = null;
					ctx.closePath();
				}
				ctx.restore();
			}
/*
	// requestAnim shim layer by Paul Irish
	var requestAnimFrame = (function(){
	  return  window.requestAnimationFrame       ||
			  window.webkitRequestAnimationFrame ||
			  window.mozRequestAnimationFrame    ||
			  window.oRequestAnimationFrame      ||
			  window.msRequestAnimationFrame;
			  ||  function(callback, element){ window.setTimeout(callback, 1000 / 60);  };
			  
	})();
	function animate() {
		requestAnimFrame( animate );
		//draw();
	}
*/
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
				}
				,
				_update: function (e) {
					if (!this._map) return;
					if (this._map._panTransition && this._map._panTransition._inProgress) { return; }

					var bounds   = this._map.getPixelBounds(),
						zoom     = this._map.getZoom(),
						tileSize = this.options.tileSize;

					if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
						return;
					}
					var shiftY = (this.options.shiftY ? this.options.shiftY : 0);		// Сдвиг для OSM
bounds.min.y -= shiftY;
bounds.max.y -= shiftY;
					var nwTilePoint = new L.Point(
							Math.floor(bounds.min.x / tileSize),
							Math.floor(bounds.min.y / tileSize)),
						seTilePoint = new L.Point(
							Math.floor(bounds.max.x / tileSize),
							Math.floor(bounds.max.y / tileSize)),
						tileBounds = new L.Bounds(nwTilePoint, seTilePoint);

					this._addTilesFromCenterOut(tileBounds);

					if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
						this._removeOtherTiles(tileBounds);
					}
					//utils.bringToDepth(node, node['zIndex']);
				}
/*				
*/
				,
				drawTile: function (tile, tilePoint, zoom) {
					// override with rendering code
					var me = this;
					var node = mapNodes[tile._layer.options.nodeID];
					//if(node.geometry.properties.title == 'OSM_embed') {
						//var test = 1;
					//}
					if(!me._isVisible || !tile._layer.options.tileFunc) {				// Слой невидим или нет tileFunc
						me.tileDrawn(tile);
						return;
					}
					if(!zoom) zoom = LMap.getZoom();
					var pz = Math.pow(2, zoom);
					var tx = tilePoint.x;
					if(tx < 0) tx += pz;
					var scanexTilePoint = {
						'x': (tx % pz - pz/2) % pz
						,'y': -tilePoint.y - 1 + pz/2
					};
					
/*					
					var st = zoom + '_' + tilePoint.x + '_' + tilePoint.y;
					//if(tile._layer.__badTiles[st]) return;	// пропускаем отсутствующие тайлы
					var pz = Math.pow(2, zoom - 1);
					var pz1 = Math.pow(2, zoom);
					//if(tilePoint.x > pz) tilePoint.x = tilePoint.x % pz1; 
					//else if(tilePoint.x < -pz) tilePoint.x = tilePoint.x % pz1; 
					//var pp = new L.Point(tilePoint.x - pz, -tilePoint.y - 1 + pz);
visibleext
*/
					var bounds = utils.getTileBounds(tilePoint, zoom);
					var tileX = 256 * tilePoint.x;								// позиция тайла в stage
					var tileY = 256 * tilePoint.y;
					
					var attr = this.options.attr;
					var flagAll = false;
					if(!attr.bounds ||
						(attr.bounds.min.x < -179
						&& attr.bounds.min.y < -85
						&& attr.bounds.max.x > 179
						&& attr.bounds.max.y > 85))
					{
						flagAll = true;
					} else {
						//if(!utils.chkBoundsVisible(bounds)) return;
						if(!attr.bounds.intersects(bounds)) {			// Тайл не пересекает границы слоя
							me.tileDrawn(tile);
							return;
						}
					}

					var item = {
						'src': tile._layer.options.tileFunc(scanexTilePoint.x, scanexTilePoint.y, zoom + tile._layer.options.zoomOffset)
						,'bounds': bounds
						,'zoom': zoom
						,'x': scanexTilePoint.x
						,'y': scanexTilePoint.y
						,'shiftY': (tile._layer.options.shiftY ? tile._layer.options.shiftY : 0)	// Сдвиг для OSM
						,'callback': function(imageObj){
							var ctx = tile.getContext('2d');
							if(!flagAll) {
								if(attr.bounds && !bounds.intersects(attr.bounds))	{	// Тайл не пересекает границы слоя
									return;
								}
								drawCanvasPolygon( ctx, tileX, tileY, attr['geom'], zoom, bounds, tile._layer.options.shiftY);
							}
							
							var pattern = ctx.createPattern(imageObj, "no-repeat");
							ctx.fillStyle = pattern;
							if(flagAll) ctx.fillRect(0, 0, 256, 256);
							ctx.fill();
/*
var drawTileID = zoom + '_' + scanexTilePoint.x + '_' + scanexTilePoint.y;
drawTileID += ' : ' + zoom + '_' + tilePoint.x + '_' + tilePoint.y;
ctx.restore();
ctx.strokeRect(2, 2, 253, 253);
ctx.font = '24px "Tahoma"';
ctx.fillText(drawTileID, 10, 128);
*/
							me.tileDrawn(tile);
							
						}
						,'onerror': function(){
							me.tileDrawn(tile);
							// заготовка для подзагрузки тайлов с нижних zoom
							/*
							if (this.zoom > 1) {
								this.x = Math.ceil(this.x/2 - 0.5);
								this.y = Math.ceil(this.y/2 - 0.5);
								this.zoom = this.zoom - 1;
								if (layer.maxZoom > 0 && zz > layer.maxZoom) zz = layer.maxZoom;
								if (layer.minZoom > 0 && zz < layer.minZoom) return;
								layer.loadTile(ii, jj, zz, true, false);
							}
							*/
						}
					};
					var gmxNode = gmxAPI.mapNodes[tile._layer.options.nodeID];
					if(gmxNode && gmxNode.isBaseLayer) gmxAPI._leaflet['imageLoader'].unshift(item);	// менеджер загрузки image
					else gmxAPI._leaflet['imageLoader'].push(item);
				}
			});
			
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
					var me = this;
					me.tileDrawn(tile);
//					if(!this._isVisible) return;								// Слой невидим
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
					node['chkLoadTiles']();
					if(!node['loaderFlag']) repaint(0);
				}
			});

			L.GMXIcon = L.Icon.extend({
				options: {
					iconSize: new L.Point(12, 12), // also can be set through CSS
					/*
					iconAnchor: (Point)
					popupAnchor: (Point)
					html: (String)
					bgPos: (Point)
					,divStyle: {}
					*/
					className: 'leaflet-canvas-icon'
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
					iconSize: new L.Point(12, 12), // also can be set through CSS
					//shadowSize: new L.Point(1, 1),
					//iconAnchor: new L.Point(12, 12), // also can be set through CSS
					className: 'leaflet-canvas-icon'
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

			initFunc(mapDivID, 'leaflet');
			
			var centerControlDIV = gmxAPI.newStyledDiv({ position: "absolute", top: '-6px', left: '-6px', opacity: 0.8 });
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
				var color = (currTool.backgroundColor === 1 ? 'white' : '#216b9c');
				centerControlDIV.innerHTML = '<svg viewBox="0 0 12 12" height="12" width="12" style=""><g><path d="M6 0L6 12" stroke-width="1" stroke-opacity="1" stroke="' + color + '"></path></g><g><path d="M0 6L12 6" stroke-width="1" stroke-opacity="1" stroke="' + color + '"></path></g></svg>';
				return false;
			};
			setTimeout(setControlDIVInnerHTML, 1);
			setTimeout(setCenterPoint, 1);
			gmxAPI.map.addListener('baseLayerSelected', setControlDIVInnerHTML, 100);
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
		//window.L_PREFER_CANVAS = true;		// полигоны в отдельном canvas слое
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
	gmxAPI._leaflet['curDragState'] = false;		// текущий режим dragging карты
	gmxAPI._leaflet['mousePressed'] = false;		// признак нажатой мыши
})();


// Quicklooks
(function()
{
	//FlashMapObject.prototype.enableQuicklooks = function(callback)
	var enableQuicklooks = function(callback)
	{
		var flag = true;

		if (this.shownQuicklooks)
			for (var url in this.shownQuicklooks)
				this.shownQuicklooks[url].remove();
		var shownQuicklooks = {};
		this.shownQuicklooks = shownQuicklooks;

		this.addListener('onClick', function(o)
		{
			try {
				var identityField = gmxAPI.getIdentityField(o.obj);
				var id = 'id_' + o.obj.properties[identityField];
				if (!shownQuicklooks[id])
				{
					var url = callback(o.obj);
					var d1 = 100000000;
					var d2 = 100000000;
					var d3 = 100000000;
					var d4 = 100000000;
					var x1, y1, x2, y2, x3, y3, x4, y4;
					var geom = o.attr.geom;
					var coord = geom.coordinates;
					gmxAPI.forEachPoint(coord, function(p)
					{
						var x = gmxAPI.merc_x(p[0]);
						var y = gmxAPI.merc_y(p[1]);
						if ((x - y) < d1)
						{
							d1 = x - y;
							x1 = p[0];
							y1 = p[1];
						}
						if ((-x - y) < d2)
						{
							d2 = -x - y;
							x2 = p[0];
							y2 = p[1];
						}
						if ((-x + y) < d3)
						{
							d3 = -x + y;
							x3 = p[0];
							y3 = p[1];
						}
						if ((x + y) < d4)
						{
							d4 = x + y;
							x4 = p[0];
							y4 = p[1];
						}
					});

					var q = o.obj.addObject(null, o.obj.properties);
					shownQuicklooks[id] = q;
					q.setStyle({ fill: { opacity: 10 } });
					q.setImage(url, x1, y1, x2, y2, x3, y3, x4, y4);
				}
				else
				{
					shownQuicklooks[id].remove();
					delete shownQuicklooks[id];
				}
			} catch (e) {
				gmxAPI.addDebugWarnings({'func': 'enableQuicklooks', 'handler': 'onClick', 'event': e, 'alert': e});
			}
		}, -5);
	}

	var enableTiledQuicklooks = function(callback, minZoom, maxZoom, tileSenderPrefix)
	{
		var node = gmxAPI._leaflet['mapNodes'][this.objectId];
		
		var func = function(i, j, z, geom)
		{
			var path = callback(geom);
			if (geom.boundsType && i < 0) i = -i;
			if (path.indexOf("{") >= 0){
				return path.replace(new RegExp("{x}", "gi"), i).replace(new RegExp("{y}", "gi"), j).replace(new RegExp("{z}", "gi"), z).replace(new RegExp("{key}", "gi"), encodeURIComponent(window.KOSMOSNIMKI_SESSION_KEY));
			}
			else{
				return path + z + "/" + i + "/" + z + "_" + i + "_" + j + ".jpg";
			}
		};

		node.setTiledQuicklooks(func, minZoom, maxZoom, tileSenderPrefix);
		return;
	}

	var enableTiledQuicklooksEx = function(callback, minZoom, maxZoom)
	{
		var node = gmxAPI._leaflet['mapNodes'][this.objectId];
		var gmxNode = gmxAPI['mapNodes'][this.objectId];

		if(!minZoom) minZoom = 1;
		if(!maxZoom) maxZoom = 18;
		
		var images = {};	// mapObject по обьектам векторного слоя
		var propsArray = [];

		var tilesParent = gmxNode.addObject(null, null, {'subType': 'tilesParent'});
		node['minZ'] = minZoom;
		node['maxZ'] = maxZoom;
		tilesParent.setZoomBounds(minZoom, maxZoom);
		gmxNode.tilesParent = tilesParent;
		tilesParent.clearItems  = function()
		{
			for(id in images) {
				images[id].remove();
			}
			images = {};
		}
/*		
		var func = function(i, j, z, geom)
		{
			var image = tilesParent.addObject(null, geom.properties, {'geom': geom});
			var path = callback(geom, image);
			var tt = 1;
		};
		
		node.setTiledQuicklooks(func, minZoom, maxZoom);
*/		
		tilesParent.observeVectorLayer(this, function(arr)
		{
			for (var j = 0; j < arr.length; j++)
			{
				var o = arr[j].item;
				var flag = arr[j].onExtent;
				var identityField = gmxAPI.getIdentityField(tilesParent);
				var id = 'id_' + o.properties[identityField];
				var ret = false;
				if (flag && !images[id])
				{
					var image = tilesParent.addObject(o.geometry, o.properties);
					callback(o, image);
					images[id] = image;
					propsArray.push(o.properties);
					ret = true;
				}
				else if (!flag && images[id])
				{
					images[id].remove();
					delete images[id];
					for (var i = 0; i < propsArray.length; i++)
					{
						if (propsArray[i][identityField] == o.properties[identityField])
						{
							propsArray.splice(i, 1);
							break;
						}
					}
					ret = true;
				}
			}
			return ret;
		});
		
		return;
/*		
		var images = {};
		if (this.tilesParent)
			this.tilesParent.remove();
		var tilesParent = this.addObject(null, null, {'subType': 'tilesParent'});
		this.tilesParent = tilesParent;
		//gmxAPI._cmdProxy('setAPIProperties', { 'obj': this, 'attr':{'addHiddenFill':true} });	// при отсутствии style.fill дополнить невидимым заполнением - ломает старые проекты

		var propsArray = [];
		tilesParent.clearItems  = function()
		{
			for(id in images) {
				images[id].remove();
			}
			images = {};
			propsArray = [];
		}
			
		tilesParent.setZoomBounds(minZoom, maxZoom);
		var func = function(i, j, z, geom)
		{
			var image = tilesParent.addObject(geom, geom.properties);
			var path = callback(geom, image);
			var tt = 1;
		};
		
		node.setTiledQuicklooks(func, minZoom, maxZoom);
		
		
		tilesParent.observeVectorLayer(this, function(o, flag)
		{
			var identityField = gmxAPI.getIdentityField(tilesParent);
			var id = 'id_' + o.properties[identityField];
			var ret = false;
			if (flag && !images[id])
			{
				//var image = tilesParent.addObject(o.geometry, o.properties);
				callback(o);
				images[id] = o;
				propsArray.push(o.properties);
				ret = true;
			}
			else if (!flag && images[id])
			{
				//images[id].remove();
				delete images[id];
				for (var i = 0; i < propsArray.length; i++)
				{
					if (propsArray[i][identityField] == o.properties[identityField])
					{
						propsArray.splice(i, 1);
						break;
					}
				}
				ret = true;
			}
			return ret;
		});

		this.addListener('onClick', function(o)
		{
			if('obj' in o)  o = o.obj;
			var idt = o.flip();
			var ret = (gmxAPI._leaflet['clickAttr'] && gmxAPI._leaflet['clickAttr']['ctrlKey'] ? true : false);
			return ret;
		}, -5);

		this.bringToTopImage = function(id)			// обьект растрового слоя переместить вверх
		{
			var idt = 'id_' + id;
			if(images[idt]) {
				images[idt].bringToTop();
				return true;
			}
			return false;
		};
*/
	}

	//расширяем FlashMapObject
	gmxAPI._listeners.addListener({'eventName': 'mapInit', 'func': function(map) {
			gmxAPI.extendFMO('observeVectorLayer', function(obj, onChange, asArray, ignoreVisibilityFilter) { obj.addObserver(this, onChange, asArray, ignoreVisibilityFilter); } );
			gmxAPI.extendFMO('enableTiledQuicklooksEx', enableTiledQuicklooksEx);
			gmxAPI.extendFMO('enableTiledQuicklooks', enableTiledQuicklooks);
			gmxAPI.extendFMO('enableQuicklooks', enableQuicklooks);
		}
	});
})();
