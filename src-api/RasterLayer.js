// растровый слой
(function()
{
	var LMap = null;						// leafLet карта
	var utils = null;						// утилиты для leaflet
	var mapNodes = null;					// Хэш нод обьектов карты - аналог MapNodes.hx

	// Добавить растровый слой
	function setBackgroundTiles(ph)	{
		if(!LMap) init();
		var out = {};
		var layer = ph.obj;
		var id = layer.objectId;
		var node = mapNodes[id];
//gmxAPI._tools['standart'].setVisible(false);	// Пока не работает map.drawing
		if(!node) return;						// Нода не определена
		var gmxNode = gmxAPI.mapNodes[id];		// Нода gmxAPI
		node['type'] = 'RasterLayer';
		node['isOverlay'] = false;
		var inpAttr = ph.attr;
		node['subType'] = ('subType' in inpAttr ? inpAttr['subType'] : (inpAttr['projectionCode'] === 1 ? 'OSM' : ''));
		var attr = {};
		if(node.propHiden) {
			if(node.propHiden.geom) {
				attr['geom'] = node.propHiden['geom'];					// Геометрия от обьекта векторного слоя
				attr['bounds'] = attr['geom']['bounds'];				// Bounds слоя
			}
		}
		node['zIndexOffset'] = 0;									// Сдвиг zIndex
		var pNode = mapNodes[node.parentId];					// Нода родителя
		if(pNode && pNode.propHiden && pNode.propHiden.subType === 'tilesParent') {
			attr['minZoom'] = pNode.minZ || 1;
			attr['maxZoom'] = pNode.maxZ || 30;
										// pNode.parentId нода векторного слоя по обьекту которого создан растровый слой 
		} else {
			attr = utils.prpLayerAttr(layer, node);
			if(pNode && pNode.zIndexOffset) {
				node['zIndexOffset'] = pNode.zIndexOffset;
			}
		}
		if(attr['isOverlay']) {
			node['isOverlay'] = true;
		}
		if(!'zIndex' in node) node['zIndex'] = utils.getIndexLayer(id);
		node['zIndex'] += node['zIndexOffset'];

		node['chkGeometry'] = function() {			// подготовка границ растрового слоя
			var pt = utils.prpLayerBounds(node['geometry']);
			//var pt = prpGeom(node['geometry']);
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
				if(!'zIndex' in node) node['zIndex'] = utils.getIndexLayer(id) + node['zIndexOffset'];
				utils.bringToDepth(node, node['zIndex']);
				if(node['shiftY']) node['shiftY']();
			}
		};
			
		var chkVisible = function() {
			if(node.isVisible) {
				var onViewFlag = (utils.chkVisibilityByZoom(id) && utils.chkBoundsVisible(attr['bounds']));
				if(node['leaflet']._isVisible != onViewFlag) {
					utils.setVisibleNode({'obj': node, 'attr': !node['leaflet']._isVisible});
				}
			}
		}

		var myLayer = null;
		var createLayer = function() {			// инициализация leaflet слоя
			var option = {
				'minZoom': inpAttr['minZoom'] || attr['minZoom'] || 1
				,'maxZoom': inpAttr['maxZoom'] || attr['maxZoom'] || 21
				,'zIndex': node['zIndex']
				,'initCallback': initCallback
				,'tileFunc': inpAttr['func']
				,'attr': attr
				,'nodeID': id
				,'async': true
				//,'updateWhenIdle': true
				,'unloadInvisibleTiles': true
				,'countInvisibleTiles': (L.Browser.mobile ? 0 : 1)
				//,'countInvisibleTiles': 0
				//,'reuseTiles': true
				//isBaseLayer
				//,'reuseTiles': true
				//,'continuousWorld': true
				//,'detectRetina': true
				//,'tms': true
				//,'noWrap': true
				//,'subdomains': []
			};
			myLayer = new L.TileLayer.ScanExCanvas(option);
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
			
				node['shiftY'] = function() {
					myLayer.options.shiftY = utils.getOSMShift();
					if(myLayer._container) gmxAPI.position(myLayer._container, 0, myLayer.options.shiftY);
				}
				//LMap.on('zoomend', node['shiftY']);
				//LMap.on('move', node['shiftY']);
			}
			node['leaflet'] = myLayer;
			var chkPosition = function() {
				//node['waitRedraw']();
				chkVisible();
				if(node['subType'] === 'OSM') node['shiftY']();	
			}
			LMap.on('move', chkPosition);
			LMap.on('zoomend', chkPosition);
		}
		createLayer();

		var redrawTimer = null;										// Таймер
		var waitRedraw = function()	{								// Требуется перерисовка с задержкой
			if(redrawTimer) clearTimeout(redrawTimer);
			redrawTimer = setTimeout(function()
			{
				//console.log('bbbbbbb', node.id, node['leaflet'], LMap.getZoom(), gmxAPI.map.needMove);
				chkVisible();
				//if(node.isVisible && node['leaflet']._isVisible != chkVisibilityObject(id)) {
				//	setVisible({'obj': node, 'attr': !node['leaflet']._isVisible});
				//}
				if(!node.isVisible || !node['leaflet']._isVisible) return;
				redrawTimer = null;
				node['leaflet'].redraw();
				//if(!L.Browser.mobile) node['leaflet']['options']['countInvisibleTiles'] = 1;
			}, 10);
			return false;
		}
		node['waitRedraw'] = waitRedraw;
		if(layer.properties && layer.properties.visible != false) node.isVisible = true;

		waitRedraw();
		return out;
	}
	// инициализация
	function init(arr)	{
		LMap = gmxAPI._leaflet['LMap'];
		utils = gmxAPI._leaflet['utils'];
		mapNodes = gmxAPI._leaflet['mapNodes'];
	}
		
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['setBackgroundTiles'] = setBackgroundTiles;				// Добавить растровый слой
})();
