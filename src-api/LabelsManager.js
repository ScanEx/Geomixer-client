// LabelsManager - менеджер отрисовки Labels
(function()
{
	var nextId = 0;							// следующий ID mapNode
	var timer = null;						// таймер
	var utils = null;						// следующий ID mapNode
	var LMap = null;
	var marker = null;
	var canvas = null;

	var items = [];							// массив ID нод очереди отрисовки
	var itemsHash = {};						// Хэш нод требующих отрисовки

	var repaintItems = function()	{			// отложенная перерисовка
		if(timer) clearTimeout(timer);
		timer = setTimeout(repaint, 50);
	}
	var prepareStyle = function(style)	{		// подготовка стиля
		var size = style['label']['size'] || 12;
		var fillStyle = style['label']['color'] || 0;
		var haloColor = style['label']['haloColor'] || 0;
		var out = {
			'size': size
			,'align': style['label']['align'] || 'center'
			,'font': size + 'px "Arial"'
			,'strokeStyle': gmxAPI._leaflet['utils'].dec2rgba(haloColor, 1)
			,'fillStyle': gmxAPI._leaflet['utils'].dec2rgba(fillStyle, 1)
		};
		return out;
	}
	var prepareObject = function(node)	{				// подготовка Label от addObject
		var regularStyle = utils.getNodeProp(node, 'regularStyle', true);
		var style = prepareStyle(regularStyle);
		var geom = gmxAPI.merc_geometry(node['geometry']);
		var point = null;
		if(geom.type == 'Point') point = new L.Point(geom['coordinates'][0], geom['coordinates'][1]);

		if(!point) return null;
		var txt = node['label'] || '';
		var out = {
			'txt': txt
			,'point': point
			,'sx': 12
			,'sy': 0
			,'extent': gmxAPI._leaflet['utils'].getLabelSize(txt, style)
			,'style': style
			,'isVisible': true
			,'node': node
		};
		return out;
	}
	var prepareItem = function(txt, geom, attr) {			// подготовка Label от векторного слоя
		var style = prepareStyle(attr['style']);
		var out = {
			'txt': txt
			,'point': geom['coordinates']
			,'sx': geom['sx']
			,'sy': geom['sy']
			,'extent': gmxAPI._leaflet['utils'].getLabelSize(txt, style)
			,'style': style
			,'isVisible': true
		};
		return out;
//console.log('addItem' ,  out);
	}
	
	var repaint = function() {				// перерисовка
		if(!canvas) return false;
		var zoom = LMap.getZoom();
		gmxAPI._leaflet['mInPixel'] = Math.pow(2, zoom)/156543.033928041;
		var mInPixel = gmxAPI._leaflet['mInPixel'];

		var vBounds = LMap.getBounds();
		var vpNorthWest = vBounds.getNorthWest();
		var mx = gmxAPI.merc_x(vpNorthWest.lng);
		var my = gmxAPI.merc_y(vpNorthWest.lat);
		var vpSouthEast = vBounds.getSouthEast();

		var contPoint = LMap.latLngToContainerPoint(vpNorthWest);

		var vp1 = LMap.project(vpNorthWest, zoom);
		var vp2 = LMap.project(vpSouthEast, zoom);
		var wView = vp2.x - vp1.x;
		var hView = vp2.y - vp1.y;
		canvas.width = wView;
		canvas.height = hView;
		marker.setLatLng(vpNorthWest);
		var ctx = canvas.getContext('2d');
		var labelBounds = [];
		for(var id in itemsHash) {
			var item = itemsHash[id];
			if(!item['isVisible']) continue;
			var align = item['style']['align'];
			var dx = item['sx']/2 + 1;
			var dy = item['sy']/2 - 1 - contPoint.y;
			
			if(align == 'right') {
				dx -= (item.extent.x + item['style']['size']);
			} else if(align == 'center') {
				dx -= item.extent.x;
				dy += item.extent.y/2;
			}

			var lx = (item.point.x - mx) * mInPixel + dx - 1; 		lx = (0.5 + lx) << 0;
			var ly = (my - item.point.y) * mInPixel + dy - 1;		ly = (0.5 + ly) << 0;
			var flag = true;			// проверка пересечения уже нарисованных labels
			for (var i = 0; i < labelBounds.length; i++)
			{
				var prev = labelBounds[i];
				if(lx > prev.max.x) continue;
				if(lx + item.extent.x < prev.min.x) continue;
				if(ly > prev.max.y) continue;
				if(ly + item.extent.y < prev.min.y) continue;
				flag = false;
				break;
			}
			if(flag) {
				labelBounds.push({
					'min':{'x': lx, 'y': ly}
					,'max':{'x': lx + item.extent.x, 'y': ly + item.extent.y}
				});
				ctx.font = item['style']['font'];
				ctx.strokeStyle = item['style']['strokeStyle'];
				ctx.strokeText(item['txt'], lx, ly);
				ctx.fillStyle = item['style']['fillStyle'];
				ctx.fillText(item['txt'], lx, ly);
			}
		}
//console.log('repaint' , wView, hView);
	}
	var drawMe = function(pt) {				// установка таймера
		canvas = pt;
		repaintItems();
	}
	var init = function() {					// инициализация
		if(!utils && gmxAPI._leaflet['utils']) {
			utils = gmxAPI._leaflet['utils'];
			LMap = gmxAPI._leaflet['LMap'];				// Внешняя ссылка на карту
			if(marker) {
				LMap.removeLayer(node['leaflet']);
			}
			var canvasIcon = L.canvasIcon({
				className: 'my-canvas-icon'
				,'drawMe': drawMe
			});
			marker =  new L.GMXMarker([0,0], {icon: canvasIcon, 'toPaneName': 'popupPane', 'zIndexOffset': -1000});
				
			LMap.addLayer(marker);
			gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': repaint});
			gmxAPI.map.addListener('onMoveEnd', repaint);
			var onZoomstart = function() {				// скрыть при onZoomstart
				if(!canvas) return false;
				canvas.width = canvas.height = 0;
			}
			gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomstart', 'func': onZoomstart});
		}
	}
	var setVisibleRecursive = function(id, flag) {				// установка таймера
		if(itemsHash[id]) itemsHash[id].isVisible = flag;
		else {
			var node = gmxAPI._leaflet['mapNodes'][id];
			if(!node) return;
			for (var i = 0; i < node['children'].length; i++) {
				setVisibleRecursive(node['children'][i], flag);
			}
		}
	}
	
	var LabelsManager = {						// менеджер отрисовки
		'add': function(id)	{					// добавить Label для отрисовки
			var node = gmxAPI._leaflet['mapNodes'][id];
			if(!node) return false;
			if(!utils) init();
			itemsHash[id] = prepareObject(node);
			repaintItems();
		}
		,'addItem': function(txt, geom, attr)	{	// добавить Label от векторного слоя
			if(!utils) init();
			var node = attr['node'];
			var id = node['id'] + '_' + geom.id;
			itemsHash[id] = prepareItem(txt, geom, attr);
			repaintItems();
		}
		,'remove': function(id)	{				// удалить ноду
			if(itemsHash[id]) delete itemsHash[id];
			else {
				var node = gmxAPI._leaflet['mapNodes'][id];
				if(!node || node.type != 'VectorLayer') return false;
				var st = id + '_';
				for(var pid in itemsHash) {
					if(pid.indexOf(st) != -1) delete itemsHash[pid];
				}
			}
			repaintItems();
			return true;
		}
		,'onChangeVisible': function(id, flag)	{		// изменение видимости ноды
//console.log('onChangeVisible' , id, flag);
			var node = gmxAPI._leaflet['mapNodes'][id];
			if(node['type'] == 'mapObject') {
				setVisibleRecursive(id, flag);
			} else {
				if(!flag) {
					this.remove(id);
					return;
				}
			}
			repaintItems();
		}
		,'repaint': function()	{				// отрисовка нод
			repaintItems();
		}
	};

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['LabelsManager'] = LabelsManager;	// менеджер отрисовки
})();
