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
		var gmxNode = gmxAPI.mapNodes[id];		// Нода gmxAPI
		node['type'] = 'RasterLayer';
		node['isOverlay'] = false;
		var inpAttr = ph.attr;
		node['subType'] = ('subType' in inpAttr ? inpAttr['subType'] : (inpAttr['projectionCode'] === 1 ? 'OSM' : ''));
		var attr = {};
		if(!layer.mercGeometry && layer['geometry']) {						// Нет geometry в меркаторе
			layer.mercGeometry = gmxAPI.merc_geometry(layer['geometry']);
		}
		
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

		node['setStyle'] = function() {
			var newOpacity = node.regularStyle.fillOpacity;
			if(newOpacity != myLayer.options.opacity) {			// Изменить opacity растрового слоя
				myLayer.options.opacity = newOpacity;
				myLayer.setOpacity(newOpacity);
			}
		}
		
		var redrawTimer = null;										// Таймер
		var waitRedraw = function()	{								// Требуется перерисовка с задержкой
			if(redrawTimer) clearTimeout(redrawTimer);
			redrawTimer = setTimeout(function()
			{
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

		function drawCanvasPolygon( ctx, x, y, pArr, tileSize, shiftY) {
			if(!pArr) return;
			//ctx.save();
			ctx.beginPath();
			if(!shiftY) shiftY = 0;
			for (var j = 0; j < pArr.length; j++)
			{
				var xx = (pArr[j].x / tileSize - x);
				var yy = (pArr[j].y / tileSize - y);
				var px = 256 * xx;						px = (0.5 + px) << 0;
				var py = 256 * (1 - yy) - shiftY;		py = (0.5 + py) << 0;
				if(j == 0) ctx.moveTo(px, py);
				else ctx.lineTo(px, py);
			}
			pArr = null;
			ctx.closePath();
			//ctx.restore();
		}

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
			_createTileProto: function () {
				var attr = this.options.attr;
				var imgFlag = (!attr.bounds || (attr.bounds.min.x < -179 && attr.bounds.min.y < -85 && attr.bounds.max.x > 179 && attr.bounds.max.y > 85));
				if(imgFlag) {
					var img = this._canvasProto = L.DomUtil.create('img', 'leaflet-tile');
					img.style.width = img.style.height = this.options.tileSize + 'px';
					img.galleryimg = 'no';
				} else {
					var proto = this._canvasProto = L.DomUtil.create('canvas', 'leaflet-tile');
					proto.width = proto.height = 0;
				}
			},
			_createTile: function () {
				var tile = this._canvasProto.cloneNode(false);
				tile.onselectstart = tile.onmousemove = L.Util.falseFn;
				return tile;
			},
			_getTile: function () {
				if (this.options.reuseTiles && this._unusedTiles.length > 0) {
					var tile = this._unusedTiles.pop();
					this._resetTile(tile);
					return tile;
				}
				return this._createTile();
			},
			_addTile: function (tilePoint, container) {
				var tilePos = this._getTilePos(tilePoint);

				var attr = this.options.attr;
				var tile = this._getTile();
				tile.style.pointerEvents = 'none';

				L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);

				this._tiles[tilePoint.x + ':' + tilePoint.y] = tile;

				this._loadTile(tile, tilePoint);

				if (tile.parentNode !== this._container) {
					container.appendChild(tile);
				}
			},
			_update: function (e) {
//console.log('_update', this._map);
				if (!this._map) {
					var node = mapNodes[this.options.nodeID];
					node.waitRedraw();
					return;
				}
				//if (this._map._panTransition && this._map._panTransition._inProgress) { return; }
				var node = mapNodes[this.options.nodeID];

				var bounds   = this._map.getPixelBounds(),
					zoom     = this._map.getZoom(),
					tileSize = this.options.tileSize;

				if (!node || zoom > node.maxZ || zoom < node.minZ) {
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

				var countInvisibleTiles = this.options.countInvisibleTiles;
				tileBounds.min.x -= countInvisibleTiles; tileBounds.max.x += countInvisibleTiles;
				tileBounds.min.y -= countInvisibleTiles; tileBounds.max.y += countInvisibleTiles;
				this._addTilesFromCenterOut(tileBounds);

				if (this.options.unloadInvisibleTiles || this.options.reuseTiles) {
					this._removeOtherTiles(tileBounds);
				}
				//utils.bringToDepth(node, node['zIndex']);
			}
			,
			drawTile: function (tile, tilePoint, zoom) {
				var node = mapNodes[tile._layer.options.nodeID];
				if(!zoom) zoom = LMap.getZoom();
				//if((LMap['_animateToZoom'] && LMap['_animateToZoom'] != zoom) || gmxAPI.map.needMove || !this._isVisible || !tile._layer.options.tileFunc) {	// Слой невидим или нет tileFunc или идет зуум
				if(gmxAPI.map.needMove || !this._isVisible || !tile._layer.options.tileFunc) {	// Слой невидим или нет tileFunc или идет зуум
					if(gmxAPI.map.needMove) node.waitRedraw();
					return;
				}
				//console.log('drawTile ', LMap._animateToZoom, ' : ', zoom, ' : ', gmxAPI.currZ);
			
				var pz = Math.pow(2, zoom);
				var tx = tilePoint.x;
				if(tx < 0) tx += pz;
				var scanexTilePoint = {
					'x': (tx % pz - pz/2) % pz
					,'y': -tilePoint.y - 1 + pz/2
				};
				var drawTileID = zoom + '_' + scanexTilePoint.x + '_' + scanexTilePoint.y;
				tile.id = drawTileID;

				var layer = this;
				var attr = this.options.attr;
				var ctx = null;
				var flagAll = false;
				var flagAllCanvas = false;
				var src = this.options.tileFunc(scanexTilePoint.x, scanexTilePoint.y, zoom);

				if(!attr.bounds || (attr.bounds.min.x < -179 && attr.bounds.min.y < -85 && attr.bounds.max.x > 179 && attr.bounds.max.y > 85)) {
					flagAll = true;
				} else {
					var bounds = utils.getTileBounds(tilePoint, zoom);
					if(!attr.bounds.intersects(bounds)) {			// Тайл не пересекает границы слоя
						this.tileDrawn(tile);
						return;
					}
					var tileSize = 256 * 156543.033928041/pz;
					var p1 = new L.Point(tileSize * scanexTilePoint.x, tileSize * scanexTilePoint.y);
					var p2 = new L.Point(tileSize + p1.x, tileSize + p1.y);
					var boundsMerc = new L.Bounds(p1, p2);
					var mercGeometry = attr.mercGeom[0];
					var pArr = L.PolyUtil.clipPolygon(mercGeometry, boundsMerc);
					if(pArr.length == 0) {
						this.tileDrawn(tile);
						return;
					} else if(pArr.length == 4) {
						var b = new L.Bounds(pArr);
						if(b.min.x == boundsMerc.min.x && b.min.y == boundsMerc.min.y && b.max.x == boundsMerc.max.x && b.max.y == boundsMerc.max.y) {
							flagAllCanvas = true;
						}
					}
					pArr.push(pArr[0]);
				
					tile.width = tile.height = this.options.tileSize;
					ctx = tile.getContext('2d');
					if(!flagAllCanvas) {
						drawCanvasPolygon( ctx, scanexTilePoint.x, scanexTilePoint.y, pArr, tileSize, layer.options.shiftY);
					}
				}
				if(gmxAPI.isMobile) tile.style.webkitTransform += ' scale3d(1.003, 1.003, 1)';
				//		ctx.webkitImageSmoothingEnabled = false;
				if(flagAll) {
					//tile._layer.tileDrawn(tile); return;				
					tile.style.display = 'none';
					tile.onload = function() { tile.style.display = 'block'; tile._layer.tileDrawn(tile); };
					tile.src = src;
				} else {
					var me = this;
					//(function() {
						var pTile = tile;
						var item = {
							'src': src
							,'shiftY': (me.options.shiftY ? me.options.shiftY : 0)	// Сдвиг для OSM
							,'callback': function(imageObj) {
								//setTimeout(function() {
									var pattern = ctx.createPattern(imageObj, "no-repeat");
									ctx.fillStyle = pattern;
									if(flagAllCanvas) ctx.fillRect(0, 0, 256, 256);
									ctx.fill();
									imageObj = null;
									me.tileDrawn(pTile);
								//} , 1); //IE9 bug - black tiles appear randomly if call setPattern() without timeout
							}
							,'onerror': function(){
								//me.tileDrawn(pTile);
							}
						};
						var gmxNode = gmxAPI.mapNodes[me.options.nodeID];
						if(gmxNode && gmxNode.isBaseLayer) gmxAPI._leaflet['imageLoader'].unshift(item);	// базовые подложки вне очереди
						else gmxAPI._leaflet['imageLoader'].push(item);
					//})();
				}
			}
		});
	}
		
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['setBackgroundTiles'] = setBackgroundTiles;				// Добавить растровый слой
})();
