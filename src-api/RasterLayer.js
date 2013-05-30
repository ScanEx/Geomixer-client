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
		if(!node) return;						// Нода не определена
		//var gmxNode = gmxAPI.mapNodes[id];		// Нода gmxAPI
		node['type'] = 'RasterLayer';
		node['isOverlay'] = false;
		node['failedTiles'] = {};				// Hash тайлов 404
		node['zIndexOffset'] = 0;				// Сдвиг zIndex

		//node.isVisible = gmxNode.isVisible; 

		var inpAttr = ph.attr;
		node['subType'] = ('subType' in inpAttr ? inpAttr['subType'] : (inpAttr['projectionCode'] === 1 ? 'OSM' : ''));
		var attr = {};
		if(!layer['geometry'] && node['geometry'] && node['geometry']['type']) layer['geometry'] = node['geometry'];
		if(!layer['geometry']) {						// Нет geometry
			layer.mercGeometry = {
				'type': "POLYGON"
				,'coordinates': [[
					[-20037500, -21133310]
					,[-20037500, 21133310]
					,[20037500, 21133310]
					,[20037500, -21133310]
					,[-20037500, -21133310]
				]]
			};
			layer.geometry = gmxAPI.from_merc_geometry(layer.mercGeometry); 
		}

		if(!layer.mercGeometry && layer['geometry']) {						// Нет geometry в меркаторе
			layer.mercGeometry = gmxAPI.merc_geometry(layer['geometry']);
		}
		
		if(node.propHiden) {
			if(node.propHiden.geom) {
				attr['geom'] = node.propHiden['geom'];					// Геометрия от обьекта векторного слоя
				attr['bounds'] = attr['geom']['bounds'];				// Bounds слоя
			}
			if(node.propHiden.zIndexOffset) node['zIndexOffset'] = node.propHiden['zIndexOffset'];
		}
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
			if(!attr['mercGeom']) {						// Нет geometry в меркаторе
				layer.mercGeometry = gmxAPI.merc_geometry(node['geometry']);
				var pt = utils.prpLayerBounds(layer.mercGeometry);
				if(pt['geom']) {
					attr['mercGeom'] = pt['geom'];				// Массив Point границ слоя в merc
				}
			}
			if(waitRedraw) {
				myLayer.options.attr = attr;
				waitRedraw();
			}
		};
		if(node['geometry']['coordinates']) node['chkGeometry']();

		var initCallback = function(obj) {			// инициализация leaflet слоя
			if(obj._container) {
				if(obj._container.id != id) obj._container.id = id;
				if(obj._container.style.position != 'absolute') obj._container.style.position = 'absolute';
				if(!'zIndex' in node) node['zIndex'] = utils.getIndexLayer(id) + node['zIndexOffset'];
				utils.bringToDepth(node, node['zIndex']);
				if(node['shiftY']) node['shiftY']();
				if(!gmxAPI.mapNodes[id].isBaseLayer && attr['bounds']) {
					obj.options['bounds'] = new L.LatLngBounds([new L.LatLng(attr['bounds'].min.y, attr['bounds'].min.x), new L.LatLng(attr['bounds'].max.y, attr['bounds'].max.x)]);
				}
				else {
					delete obj.options['bounds'];
				}
				//setTimeout(function () {obj.removeEmptyTiles();}, 1000);
			}
		};
			
		var chkVisible = function() {
			if(node.isVisible != false) {
				var onViewFlag = (utils.chkVisibilityByZoom(id) && utils.chkBoundsVisible(attr['bounds']));
				var onScene = (node['leaflet'] && node['leaflet']._map ? true : false);
				if(onScene != onViewFlag) {
					utils.setVisibleNode({'obj': node, 'attr': onViewFlag});
				}
			}
		}

		node['remove'] = function() {				// Удалить растровый слой
			if(myLayer) LMap.removeLayer(myLayer);
		}

		node['setStyle'] = function() {
			var newOpacity = node.regularStyle.fillOpacity;
			if(newOpacity != myLayer.options.opacity) {			// Изменить opacity растрового слоя
				myLayer.options.opacity = newOpacity;
				myLayer.setOpacity(newOpacity);
			}
		}

		var myLayer = null;
		var createLayer = function() {			// инициализация leaflet слоя
			if(!gmxAPI.mapNodes[id].isVisible) node.isVisible = false;
			var option = {
				'minZoom': 1
				,'maxZoom': 23
				,'minZ': inpAttr['minZoom'] || attr['minZoom'] || 1
				,'maxZ': inpAttr['maxZoom'] || attr['maxZoom'] || 21
				,'zIndex': node['zIndex']
				,'initCallback': initCallback
				,'tileFunc': inpAttr['func']
				,'attr': attr
				,'nodeID': id
				,'async': true
				,'unloadInvisibleTiles': true
				,'countInvisibleTiles': (L.Browser.mobile ? 0 : 2)
				//,'countInvisibleTiles': 0
				//,'updateWhenIdle': true
				//,'reuseTiles': true
				//,'detectRetina': true
				//,'tms': true
				//,'noWrap': true
				//,'subdomains': []
			};
			if(!gmxAPI.mapNodes[id].isBaseLayer && attr['bounds']) {
				option['bounds'] = new L.LatLngBounds([new L.LatLng(attr['bounds'].min.y, attr['bounds'].min.x), new L.LatLng(attr['bounds'].max.y, attr['bounds'].max.x)]);
			} else {
				option['continuousWorld'] = true;
			}

			if(node['subType'] === 'OSM') {
				node['shiftY'] = function() {
					myLayer.options.shiftY = utils.getOSMShift();
				}
				myLayer = new L.TileLayer.OSMcanvas(option);
			} else {
				myLayer = new L.TileLayer.ScanExCanvas(option);
			}
			node['leaflet'] = myLayer;
			var chkPosition = function() {
				//if(node['subType'] === 'OSM') node['shiftY']();	
				//node['waitRedraw']();
				chkVisible();
			}
			LMap.on('move', chkPosition);
			LMap.on('zoomend', chkPosition);
			node['waitRedraw']();
		}
		node.onZoomend = function()	{				// Проверка видимости по Zoom
//console.log('_onZoomend: ', node.id);
			chkVisible();
		}

		var redrawTimer = null;										// Таймер
		var waitRedraw = function()	{								// Требуется перерисовка с задержкой
			if(redrawTimer) clearTimeout(redrawTimer);
			redrawTimer = setTimeout(function()
			{
				chkVisible();
				if(!node.isVisible || !node['leaflet'] || !node['leaflet']._map) return;
				redrawTimer = null;
				myLayer._update();
				//node['leaflet'].redraw();
			}, 10);
			return false;
		}
		node['waitRedraw'] = waitRedraw;
		//if(layer.properties && layer.properties.visible != false) node.isVisible = true;
		node.isVisible = (layer.properties && 'visible' in layer.properties ? layer.properties.visible : true);

		var createLayerTimer = null;										// Таймер
		var waitCreateLayer = function()	{								// Требуется перерисовка слоя с задержкой
			if(createLayerTimer) clearTimeout(createLayerTimer);
			createLayerTimer = setTimeout(function()
			{
				createLayerTimer = null;
				if(gmxAPI.map.needMove) {
					waitCreateLayer();
					return;
				}
				createLayer();
			}, 200);
		}
		if(gmxAPI.map.needMove) {
			waitCreateLayer();
		} else {
			createLayer();
		}
		
		return out;
	}
	// инициализация
	function init(arr)	{
		LMap = gmxAPI._leaflet['LMap'];
		utils = gmxAPI._leaflet['utils'];
		mapNodes = gmxAPI._leaflet['mapNodes'];

		function drawCanvasPolygon( ctx, x, y, pArr, tileSize, shiftY) {
			if(!pArr) return;
			//ctx.strokeStyle = 'rgba(0, 0, 255, 1)';
			ctx.beginPath();
			if(!shiftY) shiftY = 0;
			for(var i=0; i<pArr.length; i++) {
				var tarr = pArr[i];
				for (var j = 0; j < tarr.length; j++)
				{
					var xx = (tarr[j].x / tileSize - x);
					var yy = (tarr[j].y / tileSize - y);
					var px = 256 * xx;						px = (0.5 + px) << 0;
					var py = 256 * (1 - yy) - shiftY;		py = (0.5 + py) << 0;
					/*if(px < -1000) px = -1000;
					else if(px > 1000) px = 1000;
					if(py < -1000) py = -1000;
					else if(py > 1000) py = 1000;*/
					if(j == 0) ctx.moveTo(px, py);
					else ctx.lineTo(px, py);
				}
			}
			pArr = null;
			ctx.closePath();
			//ctx.stroke();
		}

		var drawTile = function (tile, tilePoint, zoom) {
			var node = mapNodes[tile._layer.options.nodeID];
			if(!zoom) zoom = LMap.getZoom();
			var pz = Math.pow(2, zoom);
			var tx = tilePoint.x;
			if(tx < 0) tx += pz;
			var scanexTilePoint = {
				'x': (tx % pz - pz/2) % pz
				,'y': -tilePoint.y - 1 + pz/2
			};
			var tileKey = tilePoint.x + ':' + tilePoint.y;
			var drawTileID = zoom + '_' + scanexTilePoint.x + '_' + scanexTilePoint.y;
			var me = this;
			var deleteTile = function () {
				setTimeout(function() {
					me.tileDrawn(tile);
					me._removeTile(tileKey);
				}, 0);
			}
			if(node['failedTiles'][drawTileID]) {
				if(this.options.bounds) {
					deleteTile();
				}
				return;		// второй раз 404 тайл не запрашиваем
			}
			tile.id = 't' + drawTileID;
			var tileSize = 0;
			var layer = this;
			var attr = this.options.attr;
			var ctx = null;
			var flagAll = false;
			var flagAllCanvas = false;
			var shiftY = (this.options.shiftY ? this.options.shiftY : 0);		// Сдвиг для OSM
			if(shiftY !== 0) {
				// сдвиг для OSM
				var tilePos = tile._leaflet_pos;
				tilePos.y += shiftY;
				L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);
			}

			if(!attr.bounds || (attr.bounds.min.x < -179 && attr.bounds.min.y < -85 && attr.bounds.max.x > 179 && attr.bounds.max.y > 85)) {
				flagAll = true;
			}
			if(gmxAPI.isMobile) tile.style.webkitTransform += ' scale3d(1.003, 1.003, 1)';
			//		ctx.webkitImageSmoothingEnabled = false;
			var src = this.options.tileFunc(scanexTilePoint.x, scanexTilePoint.y, zoom);
			if(flagAll) {
				tile.onload = function() {
					tile.id = drawTileID;
					layer.tileDrawn(tile);
				};
				tile.onerror = function() {
					node['failedTiles'][drawTileID] = true;
					//tile._needRemove = true;
				};
				tile.src = src;
			} else {
				var pResArr = null;				// точки границ растрового слоя
				tileSize = 256 * 156543.033928041/pz;
				//var pArr = [];
				pResArr = attr.mercGeom;
/*
				if(shiftY == 0) {
					var bounds = utils.getTileBounds(tilePoint, zoom);
					if(!attr.bounds.intersects(bounds)) {			// Тайл не пересекает границы слоя
						deleteTile();
						return;
					}
					var p1 = new L.Point(tileSize * scanexTilePoint.x, tileSize * scanexTilePoint.y);
					var p2 = new L.Point(tileSize + p1.x, tileSize + p1.y);
					var boundsMerc = new L.Bounds(p1, p2);
					var drawType = 0;
					for(var i=0; i<attr.mercGeom.length; i++) {
						var p1 = L.PolyUtil.clipPolygon(attr.mercGeom[i], boundsMerc);
						if(p1.length == 4) {			//	нет пересечений
							var b = new L.Bounds(p1);
							if(b.min.x == boundsMerc.min.x && b.min.y == boundsMerc.min.y && b.max.x == boundsMerc.max.x && b.max.y == boundsMerc.max.y) {
								flagAllCanvas = true;	//	тайл полностью внутри геометрии
								break;
							}
						} else if(p1.length > 4) {		//	есть пересечения
							p1.push(p1[0]);
							if(!pResArr) pResArr = [];
							pResArr.push(p1);
						}					
					}
					if(!flagAllCanvas && !pResArr) {	//	рисовать нечего
						deleteTile();
						return;
					}
				} else {
					pResArr = attr.mercGeom;
				}
*/
				var me = this;
				(function(points, sTilePoint, pTile) {
					var tID = drawTileID;
					var item = {
						'src': src
						,'zoom': zoom
						,'callback': function(imageObj) {
							//setTimeout(function() {
								pTile.id = tID;
								pTile.width = pTile.height = layer.options.tileSize;
								ctx = pTile.getContext('2d');
								var pattern = ctx.createPattern(imageObj, "no-repeat");
								ctx.fillStyle = pattern;
								if(pResArr) drawCanvasPolygon( ctx, sTilePoint.x, sTilePoint.y, pResArr, tileSize, layer.options.shiftY);
								else ctx.fillRect(0, 0, 256, 256);
								ctx.fill();
								imageObj = null;
								layer.tileDrawn(pTile, 1);
							//} , 1); //IE9 bug - black tiles appear randomly if call setPattern() without timeout
						}
						,'onerror': function(){
							node['failedTiles'][tID] = true;
							pTile.id = tID + '_bad';
						}
					};
					var gmxNode = gmxAPI.mapNodes[layer.options.nodeID];
					if(gmxNode && gmxNode.isBaseLayer) gmxAPI._leaflet['imageLoader'].unshift(item);	// базовые подложки вне очереди
					else gmxAPI._leaflet['imageLoader'].push(item);
				})(pResArr, scanexTilePoint, tile);
			}
		}
		var update = function () {
			if (!this._map) {
				var node = mapNodes[this.options.nodeID];
				node.waitRedraw();
				return;
			}

			var zoom = this._map.getZoom();
			if (zoom > this.options.maxZ || zoom < this.options.minZ) {
				return;
			}
			if('initCallback' in this.options) this.options.initCallback(this);
			var bounds   = this._map.getPixelBounds(),
				tileSize = this.options.tileSize;

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
			var countInvisibleTiles = this.options.countInvisibleTiles;
			tileBounds.min.x -= countInvisibleTiles; tileBounds.max.x += countInvisibleTiles;
			tileBounds.min.y -= countInvisibleTiles; tileBounds.max.y += countInvisibleTiles;

			if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
				this._removeOtherTiles(tileBounds);
			}
		}

		// Растровый слой с маской
		L.TileLayer.ScanExCanvas = L.TileLayer.Canvas.extend(
		{
			_initContainer: function () {
				L.TileLayer.Canvas.prototype._initContainer.call(this);
				//if('initCallback' in this.options) this.options.initCallback(this);
			}
			,
			_createTileProto: function () {
				var attr = this.options.attr;
				var imgFlag = (!attr.bounds || (attr.bounds.min.x < -179 && attr.bounds.min.y < -85 && attr.bounds.max.x > 179 && attr.bounds.max.y > 85));
				if(imgFlag) {
					var img = this._canvasProto = L.DomUtil.create('img', 'leaflet-tile');
					//img.style.width = img.style.height = this.options.tileSize + 'px';
					//img.galleryimg = 'no';
				} else {
					var proto = this._canvasProto = L.DomUtil.create('canvas', 'leaflet-tile');
					proto.width = proto.height = 0;
				}
			}
			,'_update': update
			,'drawTile': drawTile
			,
			_clearBgBuffer: function () {
				if(!this._map || !this._bgBuffer) return;	// OriginalSin
				L.TileLayer.Canvas.prototype._clearBgBuffer.call(this);
			}
			,
			_getLoadedTilesPercentage: function (container) {
				// Added by OriginalSin
				if(!container) return 0;
				var len = 0, count = 0;
				var arr = ['img', 'canvas'];
				for (var key in arr) {
					var tiles = container.getElementsByTagName(arr[key]);
					if(tiles && tiles.length > 0) {
						len += tiles.length;
						for (var i = 0; i < tiles.length; i++) {
							if (tiles[i]._tileComplete) {
								count++;
							}
						}
					}
				}
				if(len < 1) return 0;
				return count / len;	
			}
			,
			tileDrawn: function (tile, cnt) {				// cnt = количество отрисованных обьектов в тайле
				this._tileOnLoad.call(tile);
				tile._tileComplete = true;					// Added by OriginalSin
				tile._needRemove = (cnt > 0 ? false : true);
			}
		});

		// Растровый для OSM
		L.TileLayer.OSMcanvas = L.TileLayer.ScanExCanvas;
	}
		
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['setBackgroundTiles'] = setBackgroundTiles;				// Добавить растровый слой
})();
