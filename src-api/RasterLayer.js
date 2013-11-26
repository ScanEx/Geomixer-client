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
		var gmxNode = null;						// Нода gmxAPI
		node['type'] = 'RasterLayer';
		node['isOverlay'] = false;
		node['failedTiles'] = {};				// Hash тайлов 404
		node['zIndexOffset'] = 0;				// Сдвиг zIndex
		node['listenerIDS'] = {};				// id прослушивателей событий
		node['leaflet'] = null;					// Нода leaflet
		var myLayer = null;

		var inpAttr = ph.attr;
		node['subType'] = ('subType' in inpAttr ? inpAttr['subType'] : (inpAttr['projectionCode'] === 1 ? 'OSM' : ''));
		var attr = {};

		attr['mercGeom'] = layer.mercGeometry || {				// граница слоя в merc
			'type': "POLYGON"
			,'coordinates': [[
				[-20037500, -21133310]
				,[-20037500, 21133310]
				,[20037500, 21133310]
				,[20037500, -21133310]
				,[-20037500, -21133310]
			]]
		};
		
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
			if(pNode && pNode.zIndexOffset) {
				node['zIndexOffset'] = pNode.zIndexOffset;
			}
		}
		if(!'zIndex' in node) node['zIndex'] = utils.getIndexLayer(id);
		node['zIndex'] += node['zIndexOffset'];

		node['setGeometry'] = function() {			// Установка геометрии
			attr['mercGeom'] = gmxAPI.merc_geometry(node['geometry']);
			if(waitRedraw) {
				if(myLayer) myLayer.options.attr = attr;
				waitRedraw();
			}
		}

		node['getLayerBounds'] = function() {				// Проверка границ растрового слоя
			if(!gmxNode || !attr['mercGeom']) return;
			var ext = null;
			if('getLayerBounds' in gmxNode) ext = gmxNode.getLayerBounds();
			else {
				var geo = gmxNode.getGeometry();
				if(!geo || !geo.type) {
					geo = attr['mercGeom'];
					var boundsMerc = gmxAPI.getBounds(geo.coordinates);
					ext = {
						minX: gmxAPI.from_merc_x(boundsMerc['minX']),
						minY: gmxAPI.from_merc_y(boundsMerc['minY']),
						maxX: gmxAPI.from_merc_x(boundsMerc['maxX']),
						maxY: gmxAPI.from_merc_y(boundsMerc['maxY'])
					};
				} else {
					ext = gmxAPI.getBounds(geo.coordinates);
					attr['mercGeom'] = gmxAPI.merc_geometry(geo);
				}
			}
			
			var	bounds = new L.Bounds();
			bounds.extend(new L.Point(ext.minX, ext.minY ));
			bounds.extend(new L.Point(ext.maxX, ext.maxY ));
			attr['bounds'] = bounds;
		}

		var chkVisible = function() {
			if(!gmxNode) return;
			if(node.isVisible != false) {
				var notOnScene = true;
				var continuousWorld = false;
				if(node['leaflet']) {
					if(node['leaflet']._map) notOnScene = false;
					continuousWorld = node['leaflet'].options.continuousWorld;
				}
				if(!continuousWorld && !attr['bounds']) {
					node['getLayerBounds']();
				}

				//var notOnScene = (node['leaflet'] && node['leaflet']._map ? false : true);
				var notViewFlag = (!utils.chkVisibilityByZoom(id)
					|| (!continuousWorld && !utils.chkBoundsVisible(attr['bounds']))
					);
				
				if(notOnScene != notViewFlag) {
					utils.setVisibleNode({'obj': node, 'attr': !notViewFlag});
					if(notViewFlag)	delete gmxAPI._leaflet['renderingObjects'][node.id];
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
		node.onZoomend = function()	{				// Проверка видимости по Zoom
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

		var chkInitListeners = function()	{								// Требуется перерисовка с задержкой
			var func = function(flag) {	// Изменилась видимость слоя
				if(flag) {
					if('nodeInit' in node) node['nodeInit']();
					chkVisible();
				}
			};
			var key = 'onChangeVisible';
			if(!node['listenerIDS'][key]) {
				node['listenerIDS'][key] = {'obj': gmxNode, 'evID': gmxNode.addListener(key, func, -10)};
			}
			if(node.isVisible) {
				func(node.isVisible);
			}
		}
		node['nodeInit'] =	function() {
			delete node['nodeInit'];

			var initCallback = function(obj) {			// инициализация leaflet слоя
				if(obj._container) {
					if(obj._container.id != id) obj._container.id = id;
					//if(obj._container.style.position != 'absolute') obj._container.style.position = 'absolute';
					
					if(!'zIndex' in node) node['zIndex'] = utils.getIndexLayer(id) + node['zIndexOffset'];
					utils.bringToDepth(node, node['zIndex']);
					if(node['shiftY']) node['shiftY']();
					if(!attr.bounds || (attr.bounds.min.x < -179 && attr.bounds.min.y < -84 && attr.bounds.max.x > 179 && attr.bounds.max.y > 84)) {
						delete obj.options['bounds'];
						obj.options.continuousWorld = true;
					}
					else {
						obj.options['bounds'] = new L.LatLngBounds([new L.LatLng(attr['bounds'].min.y, attr['bounds'].min.x), new L.LatLng(attr['bounds'].max.y, attr['bounds'].max.x)]);
					}
				}
			};
			var createLayer = function() {			// инициализация leaflet слоя
				if(!gmxNode) {
					gmxNode = gmxAPI.mapNodes[id];
					chkInitListeners();
				}
				var option = {
					'minZoom': inpAttr['minZoomView'] || 1
					,'maxZoom': inpAttr['maxZoomView'] || 30
					,'minZ': inpAttr['minZoom'] || attr['minZoom'] || gmxAPI.defaultMinZoom
					,'maxZ': inpAttr['maxZoom'] || attr['maxZoom'] || gmxAPI.defaultMaxZoom
					,'zIndex': node['zIndex']
					,'initCallback': initCallback
					,'tileFunc': inpAttr['func']
					,'attr': attr
					,'_needLoadTile': 0
					,'nodeID': id
					,'badTiles': {}
					,'async': true
					,'unloadInvisibleTiles': true
					//,'countInvisibleTiles': (L.Browser.mobile ? 0 : 2)
				};
				if(gmxNode.properties.type === 'Overlay') {
					node['isOverlay'] = true;
				} else {
					if(gmxNode.isBaseLayer) node['zIndexOffset'] = -100000;
				}
				if(!gmxNode.isBaseLayer && attr['bounds']) {
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
					chkVisible();
				}
				LMap.on('move', chkPosition);
				LMap.on('zoomend', chkPosition);
				chkVisible();
			}

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
		}

		var gmxNode = gmxAPI.mapNodes[id];		// Нода gmxAPI
		var onLayerEventID = gmxNode.addListener('onLayer', function(obj) {	// Слой инициализирован
			gmxNode.removeListener('onLayer', onLayerEventID);
			gmxNode = obj;
			chkInitListeners();
		});
		if(node.isVisible && gmxNode && gmxNode.isVisible) chkInitListeners();
		
		return out;
	}
	// инициализация
	function init(arr)	{
		LMap = gmxAPI._leaflet['LMap'];
		utils = gmxAPI._leaflet['utils'];
		mapNodes = gmxAPI._leaflet['mapNodes'];

		function drawCanvasPolygon( ctx, x, y, lgeo, opt) {
			if(!lgeo) return;
			var zoomCurrent = gmxAPI._leaflet['zoomCurrent'];
			var tileSize = zoomCurrent['tileSize'];
			//ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
			ctx.beginPath();
			var shiftY = (opt.shiftY ? opt.shiftY : 0);
			if(opt.attr.boundsMerc) {
				var extMerc = opt.attr.boundsMerc;
				var minx = x * tileSize;
				var maxx = minx + tileSize;
				if (maxx < extMerc.minX) x += zoomCurrent['pz'];
				else if (minx > extMerc.maxX) x -= zoomCurrent['pz'];
			}

			var drawPolygon = function(arr) {
				for (var j = 0; j < arr.length; j++)
				{
					var xx = (arr[j][0] / tileSize - x);
					var yy = (arr[j][1] / tileSize - y);
					var px = 256 * xx;						px = (0.5 + px) << 0;
					var py = 256 * (1 - yy) - shiftY;		py = (0.5 + py) << 0;
					if(j == 0) ctx.moveTo(px, py);
					else ctx.lineTo(px, py);
				}
			}
			for(var i=0; i<lgeo.coordinates.length; i++) {
				var tarr = lgeo.coordinates[i];
				if(lgeo.type === 'MULTIPOLYGON') {
					for (var j = 0, len1 = lgeo.coordinates[i].length; j < len1; j++) {
						drawPolygon(lgeo.coordinates[i][j]);
					}
				} else {
					drawPolygon(lgeo.coordinates[i]);
				}
			}
			ctx.closePath();
			//ctx.stroke();
		}

		// Растровый слой с маской
		L.TileLayer.ScanExCanvas = L.TileLayer.Canvas.extend(
		{
			_initContainer: function () {
				L.TileLayer.Canvas.prototype._initContainer.call(this);
				//if('initCallback' in this.options) this.options.initCallback(this);
			}
			,
			_reset: function (e) {
				L.TileLayer.Canvas.prototype._reset.call(this, e);
                this.options._needLoadTile = 0;
			}
			,
			_addTile: function (tilePoint, container) {
				this.drawTile(null, tilePoint, this._map._zoom);
			}
			,
            '_update': function() {
                if (!this._map || gmxAPI._leaflet['zoomstart']) {
                    //var node = mapNodes[this.options.nodeID];
                    //node.waitRedraw();
                    return;
                }

                var zoom = this._map.getZoom();
                if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
                    delete gmxAPI._leaflet['renderingObjects'][this.options.nodeID];
                    return;
                }
                gmxAPI._leaflet['renderingObjects'][this.options.nodeID] = 1;
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

				var pz = Math.pow(2, zoom) - 1;
                if(tileBounds.min.y < 0) tileBounds.min.y = 0;
                if(tileBounds.max.y > pz) tileBounds.max.y = pz;

                var opt = this.options;
                this._addTilesFromCenterOut(tileBounds);

                if (opt.unloadInvisibleTiles || opt.reuseTiles) {
                    this._removeOtherTiles(tileBounds);
                }
                if(opt._needLoadTile < 1) delete gmxAPI._leaflet['renderingObjects'][opt.nodeID];
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
			_getGMXtileNum: function (tilePoint, zoom) {
				var pz = Math.pow(2, zoom);
				var tx = tilePoint.x % pz + (tilePoint.x < 0 ? pz : 0);
				var ty = tilePoint.y % pz + (tilePoint.y < 0 ? pz : 0);
				var gmxTilePoint = {
					'x': tx % pz - pz/2
					,'y': pz/2 - 1 - ty % pz
				};
				gmxTilePoint['gmxTileID'] = zoom + '_' + gmxTilePoint.x + '_' + gmxTilePoint.y
				return gmxTilePoint;
			}
			,
			drawTile: function (tile, tilePoint, zoom) {
				// override with rendering code
                var tileKey = tilePoint.x + ':' + tilePoint.y;

                var layer = this;
				var opt = layer.options;
				var node = mapNodes[opt['nodeID']];
				if(!node) return;								// Слой пропал
                
                if(!zoom) zoom = LMap.getZoom();
                if(!gmxAPI._leaflet['zoomCurrent']) utils.chkZoomCurrent(zoom);
                var gmxTilePoint = layer._getGMXtileNum(tilePoint, zoom);

				var attr = opt.attr;
				if(!attr['bounds']) {
					var node = mapNodes[opt.nodeID];
					node['getLayerBounds']();
				}

				var allFlag = (!attr.bounds || (attr.bounds.min.x < -179 && attr.bounds.min.y <= -85 && attr.bounds.max.x > 179 && attr.bounds.max.y >= 85));
                var isIntersects = 0;
                if(allFlag) isIntersects = 2;
                else {
                    if(!attr['boundsMerc']) {
                        attr['boundsMerc'] = {
                            minX: gmxAPI.merc_x(attr['bounds'].min.x),
                            minY: gmxAPI.merc_y(attr['bounds'].min.y),
                            maxX: gmxAPI.merc_x(attr['bounds'].max.x),
                            maxY: gmxAPI.merc_y(attr['bounds'].max.y)
                        };
                    }
                    //var drawTileID = gmxTilePoint['gmxTileID'];
                    var tileExtent = gmxAPI.getTileExtent(gmxTilePoint.x, gmxTilePoint.y, zoom);
                    if(gmxAPI.extIntersect(tileExtent, attr['boundsMerc'])) isIntersects++;
                    if(!isIntersects) {
                        tileExtent.minX += gmxAPI.worldWidthMerc2, tileExtent.maxX += gmxAPI.worldWidthMerc2;
                        if(gmxAPI.extIntersect(tileExtent, attr['boundsMerc'])) isIntersects++;
                    }
                    // todo: реальное пересечение screenTile с геометрией слоя
                    //if(isIntersects) isIntersects += gmxAPI._leaflet['utils'].chkExtInPolygonArr(tileExtent, attr['mercGeom']['coordinates'][0]);
                }
                if(isIntersects === 0) return;

                var loadRasterRecursion = function(pt) {
                    if(!('to' in pt.zoom)) pt.zoom.to = pt.zoom.from;
                    var z = pt.zoom.to;
                    if(z > opt.maxZ) {
                        var dz = Math.pow(2, z - opt.maxZ);
                        pt.x = Math.floor(pt.x/dz), pt.y = Math.floor(pt.y/dz);
                        z = pt.zoom.to = opt.maxZ;
                    }
                    var rUrl = opt.tileFunc(pt.x, pt.y, z);

                    var onError = function() {
                        //console.log('onError', z, opt.maxZ, rUrl); // 
                        if (z > 1) {
                            //if(pt.zoom.from === z) opt.badTiles[rUrl] = true;
                            // запрос по раззумливанию растрового тайла
                            pt.zoom.to = z - 1, pt.x = Math.floor(pt.x/2), pt.y = Math.floor(pt.y/2);
                            loadRasterRecursion(pt);
                        } else {
                            pt.callback(null);
                            return;
                        }
                    };
                    // if(opt.badTiles[rUrl]) {
                        // onError();
                        // return;
                    // }

                    var item = {
                        'src': rUrl
                        ,'zoom': z
                        ,'callback': function(imageObj) {
                            pt.callback({'img': imageObj, 'zoom': z, 'fromZoom': pt.zoom.from});
                        }
                        ,'onerror': onError
                    };
					if(pt.zoom.from != z) item.crossOrigin = 'use-credentials';
                    gmxAPI._leaflet['imageLoader'].push(item);
                }
                opt._needLoadTile++;
                loadRasterRecursion({
                    callback: function(ph) {
                        if(!layer._map || gmxAPI._leaflet.zoomstart) {
                            //node.waitRedraw();
                            return;     // идет анимация
                        }
                        if(LMap.getZoom() != zoom) {
                            return;     // Только для текущего zoom
                        }
                        if(ph) {     // Есть раззумленный тайл
                            var imageObj = ph.img;
                            if(imageObj && imageObj.width === 256 && imageObj.height === 256) {
                                var pos = null;
                                if(ph['zoom'] !== zoom) {
                                    pos = gmxAPI.getTilePosZoomDelta(gmxTilePoint, zoom, ph['zoom']);
                                    if(pos.size < 0.00390625
                                        || pos.x > 255 || pos.y > 255
                                        || (pos.x + pos.size) < 0
                                        || (pos.y + pos.size) < 0
                                    ) return;
                                }
                                var type = (!pos && isIntersects === 2 ? 'img' : 'canvas');
                                tile = layer.gmxGetTile(tilePoint, type, imageObj);
                                if(type === 'canvas') {
                                    var ctx = tile.getContext('2d');
                                    if(pos) {
                                        var canvas = document.createElement('canvas');
                                        canvas.width = canvas.height = 256;
                                        var ptx = canvas.getContext('2d');
                                        ptx.drawImage(imageObj, Math.floor(pos.x), Math.floor(pos.y), pos.size, pos.size, 0, 0, 256, 256);
                                        imageObj = canvas;
                                    }

                                    var pattern = ctx.createPattern(imageObj, "no-repeat");
                                    ctx.fillStyle = pattern;
                                    if(isIntersects === 2) ctx.fillRect(0, 0, 256, 256);
                                    else {
                                        if(!gmxAPI._leaflet.zoomCurrent) utils.chkZoomCurrent(zoom);
                                        drawCanvasPolygon( ctx, gmxTilePoint.x, gmxTilePoint.y, attr.mercGeom, opt);
                                    }
                                    ctx.fill();
                                }
                            }
                        }
                        opt._needLoadTile--;
                        if(opt._needLoadTile < 1) {
                            delete gmxAPI._leaflet.renderingObjects[opt.nodeID];
                            utils.waitChkIdle(0, 'RasterLayer ' + layer._animating);					// Проверка отрисовки карты
                        }
                    }
                    ,zoom: {
                        from: zoom
                       
                    }
                    ,x: gmxTilePoint.x
                    ,y: gmxTilePoint.y
                });
			}
			,
			gmxGetTile: function (tilePoint, type, img) {
				var tKey = tilePoint.x + ':' + tilePoint.y;
                if(tKey in this._tiles) return this._tiles[tKey];
				if (!this._map) {
					console.log('getCanvasTile: ', this);
				}
                
				var tile = this._createTile(type, img);
				tile.id = tKey;
				tile._layer = this;
				tile._tilePoint = tilePoint;
				var tilePos = this._getTilePos(tilePoint);
				L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);

                var shiftY = (this.options.shiftY ? this.options.shiftY : 0);		// Сдвиг для OSM
                if(shiftY !== 0) {
                    // сдвиг для OSM
                    var tilePos = tile._leaflet_pos;
                    tilePos.y += shiftY;
                    L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);
                }
                if(gmxAPI.isMobile) tile.style.webkitTransform += ' scale3d(1.003, 1.003, 1)';
				this._tiles[tKey] = tile;
				this._tileContainer.appendChild(tile);

                this._tileOnLoad.call(tile);
                tile._tileComplete = true;					// Added by OriginalSin
				this._tileLoaded();

				return this._tiles[tKey];
			}
			,
			_createTile: function (type, img) {
				if(type === 'img') {
					tile = (img ? img.cloneNode(true) : L.DomUtil.create('img', 'leaflet-tile'));
                    tile.className = 'leaflet-tile';
					//img.galleryimg = 'no';
				} else {
					tile = L.DomUtil.create('canvas', 'leaflet-tile');
					tile.width = tile.height = 256;
				}
				return tile;
			}
		});

		// Растровый для OSM
		L.TileLayer.OSMcanvas = L.TileLayer.ScanExCanvas;
	}
		
	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet['setBackgroundTiles'] = setBackgroundTiles;				// Добавить растровый слой
})();
