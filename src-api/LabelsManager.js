// LabelsManager - менеджер отрисовки Labels
(function()
{
	var nextId = 0;							// следующий ID mapNode
	var timer = null;						// таймер
	var utils = null;						// следующий ID mapNode
	var LMap = null;
	var marker = null;
	var canvas = null;

	//var items = [];							// массив ID нод очереди отрисовки
	var itemsHash = {};						// Хэш нод требующих отрисовки

	var repaintItems = function(zd)	{			// отложенная перерисовка
		if(timer) clearTimeout(timer);
        if(arguments.length === 0) zd = 100;
		timer = setTimeout(repaint, zd);
	}
	var prepareStyle = function(style)	{		// подготовка стиля
		var label = style.label,
            size = label.size || 12,
            fillStyle = label.color || 0,
            haloColor = label.haloColor || 0;
		var out = {
			size: size
			,align: label.align || 'left'
			,font: size + 'px "Arial"'
			,strokeStyle: utils.dec2rgba(haloColor, 1)
			,fillStyle: utils.dec2rgba(fillStyle, 1)
		};
		if(style.iconSize) out.iconSize = style.iconSize;
		return out;
	}
	var prepareObject = function(node)	{				// подготовка Label от addObject
		var regularStyle = utils.getNodeProp(node, 'regularStyle', true);
		var style = prepareStyle(regularStyle);
		var geom = gmxAPI.merc_geometry(node.geometry);
		var point = null;
		if(geom.type == 'Point') point = new L.Point(geom.coordinates[0], geom.coordinates[1]);

		if(!point) return null;
		var txt = node.label || '';
		var out = {
			txt: txt
			,point: point
			,sx: 12
			,sy: 6
			,extent: utils.getLabelSize(txt, style)
			,style: style
			,isVisible: true
			,node: node
			,propHiden: geom.propHiden || {}
		};
		if(style.iconSize) {
			out.sx = style.iconSize.x;
			out.sy = style.iconSize.y;
		}
		return out;
	}

	// подготовка Label от векторного слоя
	var prepareItem = function(txt, geom, inpStyle, shiftX, shiftY) {
		var style = prepareStyle(inpStyle);
		var bounds = new L.Bounds();
		bounds.extend(new L.Point(geom.bounds.min.x + shiftX, geom.bounds.min.y + shiftY));
		bounds.extend(new L.Point(geom.bounds.max.x + shiftX, geom.bounds.max.y + shiftY));
		var x = (bounds.max.x + bounds.min.x) /2;
		var y = (bounds.max.y + bounds.min.y) /2;
		
		var extentLabel = null;
		if(geom._cache && geom._cache.extentLabel) {
			extentLabel = geom._cache.extentLabel;
		} else {
			extentLabel = utils.getLabelSize(txt, style);
			if(geom._cache) geom._cache.extentLabel = extentLabel;
		}
		var out = {
			txt: txt
			,point: new L.Point(x, y)
			,bounds: bounds
			,sx: geom.sx || 0
			,sy: geom.sy || 0
			,extent: extentLabel
			,style: style
			,isVisible: true
			,propHiden: geom.propHiden || {}
		};
		return out;
//console.log('addItem' ,  out);
	}

	var isVisibleByZoom = function(item, zoom) {			// проверка видимости по zoom
        var filters = item.propHiden.toFilters || [];
        for (var i = 0, len = filters.length; i < len; i++) {
            var fId = filters[i];
            var filter = gmxAPI._leaflet.mapNodes[fId];
            if(filter && filter.isVisible !== false
                && zoom >= filter.minZ && zoom <= filter.maxZ) {
                return true;
            }
        }
        return false;
	}

	var repaint = function(flag) {				// перерисовка
		if(!canvas || gmxAPI._leaflet.zoomstart) return false;
        if(!flag && gmxAPI._leaflet.mousePressed) return false;
        timer = null;
		var zoom = LMap.getZoom();
		if(!gmxAPI._leaflet.zoomCurrent) utils.chkZoomCurrent(zoom);
		var mInPixel = gmxAPI._leaflet.mInPixel;
		var vBounds = LMap.getBounds();
		var vpNorthWest = vBounds.getNorthWest();
		var vpSouthEast = vBounds.getSouthEast();
		var vBoundsMerc = new L.Bounds();
		if(vpSouthEast.lng - vpNorthWest.lng > 360) {
			vBoundsMerc.extend(new L.Point(-gmxAPI.worldWidthMerc, gmxAPI.worldWidthMerc));
			vBoundsMerc.extend(new L.Point(gmxAPI.worldWidthMerc, -gmxAPI.worldWidthMerc));
		} else {
			vBoundsMerc.extend(new L.Point(gmxAPI.merc_x(vpNorthWest.lng), gmxAPI.merc_y(vpNorthWest.lat)));
			vBoundsMerc.extend(new L.Point(gmxAPI.merc_x(vpSouthEast.lng), gmxAPI.merc_y(vpSouthEast.lat)));
		}

		var center = LMap.getCenter();
		var mx = gmxAPI.merc_x(center.lng);
		var my = gmxAPI.merc_y(center.lat);
		var wView = LMap._size.x;
		var hView = LMap._size.y;
		canvas.width = wView;
		canvas.height = hView;
		wView /= 2;
		hView /= 2;
		var ctx = canvas.getContext('2d');
		var labelBounds = [];
		for(var id in itemsHash) {
			var item = itemsHash[id];
            if (item.layerID) {
                var node = gmxAPI._leaflet.mapNodes[item.layerID];
                if(!node || (!node.clustersData && !node.objectsData[item.geoID])) {
                    delete itemsHash[id];
                    continue;
                }
            }

			if(!item.isVisible || !isVisibleByZoom(item, zoom)) continue;
			if(item.bounds && !item.bounds.intersects(vBoundsMerc)) continue;		// обьект за пределами видимости
            var style = item.style,
                align = style.align,
                dx = item.sx / 2 + 1,
                dy = item.sy / 2 - 1;
			if(align === 'right') {
				dx -= (item.extent.x + style.size);
			} else if(align === 'center') {
				dx = -item.extent.x/2 + 1;
				dy = item.extent.y/2;
			}

			var lx = wView + (item.point.x - mx) * mInPixel + dx - 1; 		lx = (0.5 + lx) << 0;
			var ly = hView + (my - item.point.y) * mInPixel + dy - 1;		ly = (0.5 + ly) << 0;
			var flag = true;			// проверка пересечения уже нарисованных labels
			var lxx = lx + item.extent.x;
			var lyy = ly + item.extent.y;
			for (var i = 0; i < labelBounds.length; i++)
			{
				var prev = labelBounds[i];
				if(lx > prev.max.x || lxx < prev.min.x || ly > prev.max.y || lyy < prev.min.y) continue;
				flag = false;
				break;
			}
			if(flag) {
				labelBounds.push({
					min:{x: lx, y: ly}
					,max:{x: lxx, y: lyy}
				});
				if(ctx.font != style.font) ctx.font = style.font;
				if(ctx.strokeStyle != style.strokeStyle) ctx.strokeStyle = style.strokeStyle;
				if(ctx.fillStyle != style.fillStyle) ctx.fillStyle = style.fillStyle;
				if(ctx.shadowColor != style.strokeStyle) ctx.shadowColor = style.strokeStyle;
				if(ctx.shadowBlur != 4) ctx.shadowBlur = 4;
				//ctx.shadowOffsetX = 0;
				//ctx.shadowOffsetY = 0;
				ctx.strokeText(item.txt, lx, ly);
				ctx.fillText(item.txt, lx, ly);
			}
		}
		labelBounds = null;
		L.DomUtil.setPosition(canvas, new L.Point(-LMap._mapPane._leaflet_pos.x, -LMap._mapPane._leaflet_pos.y));
	}
	var drawMe = function(pt) {				// канвас готов
		canvas = pt;
		repaintItems();
	}
	var init = function() {					// инициализация
		if(!utils && gmxAPI._leaflet.utils) {
			utils = gmxAPI._leaflet.utils;
			LMap = gmxAPI._leaflet.LMap;				// Внешняя ссылка на карту
			if(marker) {
				LMap.removeLayer(node.leaflet);
			}
			var canvasIcon = L.canvasIcon({
				className: 'my-canvas-icon'
				,'drawMe': drawMe
			});
			marker =  new L.GMXMarker([0,0], {icon: canvasIcon, 'toPaneName': 'popupPane', 'clickable': false, 'draggable': false, 'zIndexOffset': -1000});
			marker._setPos = function (pos) {
			}
				
			LMap.addLayer(marker);
			//gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomend', 'func': repaintItems});
			gmxAPI.map.addListener('onMoveEnd', repaintItems);
			var onZoomstart = function() {				// скрыть при onZoomstart
				if(!canvas) return false;
				canvas.width = canvas.height = 0;
			}
			gmxAPI._listeners.addListener({'level': -10, 'eventName': 'onZoomstart', 'func': onZoomstart});
		}
	}
	var setVisibleRecursive = function(id, flag) {			// установка видимости рекурсивно
		if(itemsHash[id]) itemsHash[id].isVisible = flag;
		else {
			var node = gmxAPI._leaflet.mapNodes[id];
			if(!node) return;
			for (var i = 0, len = node.children.length; i < len; i++) {
				setVisibleRecursive(node.children[i], flag);
			}
		}
	}
	var removeRecursive = function(node) {					// удаление от mapObject рекурсивно
		if(itemsHash[node.id]) delete itemsHash[node.id];
		for (var i = 0, len = node.children.length; i < len; i++) {
			var child = gmxAPI._leaflet.mapNodes[node.children[i]];
			if(child) removeRecursive(child);
		}
	}

	var LabelsManager = {						// менеджер отрисовки
		'add': function(id)	{					// добавить Label для отрисовки
			var node = gmxAPI._leaflet.mapNodes[id];
			if(!node) return false;
			if(!utils) init();
			itemsHash[id] = prepareObject(node);
			repaintItems();
		}
		,'addItem': function(txt, geom, style)	{	// добавить Label от векторного слоя
			if(!utils) init();
			var node = gmxAPI._leaflet.mapNodes[geom.layerId];
			var id = node.id + '_' + geom.id;
			var item = prepareItem(txt, geom, style, node.shiftX, node.shiftY);
			if(itemsHash[id]) {
				var bounds = new L.Bounds();
				item.bounds.extend(itemsHash[id].bounds.min);
				item.bounds.extend(itemsHash[id].bounds.max);
				item.point.x = (item.bounds.max.x + item.bounds.min.x)/2;
				item.point.y = (item.bounds.max.y + item.bounds.min.y)/2;
			}
            item.geoID = geom.id;
            item.layerID = node.id;
			itemsHash[id] = item;
			repaintItems();
		}
        ,removeArray: function(id, arr) {				// удалить массив нод
            var node = gmxAPI._leaflet.mapNodes[id];
            if(!node || node.type !== 'VectorLayer') return false;
            var pref = id + '_';
            for (var i = 0, len = arr.length; i < len; i++) {
                var pid = pref + arr[i];
                delete itemsHash[pid];
            }
            repaintItems();
        }
        ,'remove': function(id, vid, flag) {				// удалить ноду
            if(itemsHash[id]) delete itemsHash[id];
            else {
                var node = gmxAPI._leaflet.mapNodes[id];
                if(!node) return false;
                if(node.type === 'VectorLayer') {
                    var st = id + '_';
                    if(vid) st += vid;
                    if(vid) {
                        if (!itemsHash[st]) return false;
                        delete itemsHash[st];
                    } else {
                        for(var pid in itemsHash) {
                            if(pid.indexOf(st) != -1) delete itemsHash[pid];
                        }
                    }
                } else if(node.type === 'mapObject') {
                    removeRecursive(node);
                }
            }
            if(flag) {
                repaint(flag);
            } else {
                repaintItems();
            }
            return true;
        }
		,'onChangeVisible': function(id, flag)	{		// изменение видимости ноды
			var node = gmxAPI._leaflet.mapNodes[id];
			if(node.type == 'mapObject') {
				setVisibleRecursive(id, flag);
			} else {
				if(!flag) {
					LabelsManager.remove(id);
					return;
				}
			}
			repaintItems();
		}
		,repaint: function(zd)	{				// отрисовка нод с задержкой
			repaintItems(zd);
		}
		,setVisible: function(flag)	{			// установка видимости
			if(!marker) return false;
			if(flag) {
                LMap.addLayer(marker);
                repaintItems();
			} else LMap.removeLayer(marker);
			return true;
		}
	};

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet.LabelsManager = LabelsManager;	// менеджер отрисовки
})();
