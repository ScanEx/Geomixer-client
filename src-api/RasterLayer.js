// растровый слой
(function()
{
    "use strict";
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
		node.type = 'RasterLayer';
		node.isOverlay = false;
		//node.failedTiles = {};				// Hash тайлов 404
		node.zIndexOffset = 0;				    // Сдвиг zIndex
		node.listenerIDS = {};				// id прослушивателей событий
		node.leaflet = null;					// Нода leaflet
		var myLayer = null;

		var inpAttr = ph.attr;
		node.subType = ('subType' in inpAttr ? inpAttr.subType : (inpAttr.projectionCode === 1 ? 'OSM' : ''));
		var attr = {};

		attr.mercGeom = layer.mercGeometry || {				// граница слоя в merc
			type: 'POLYGON'
			,coordinates: [[
				[-20037500, -21133310]
				,[-20037500, 21133310]
				,[20037500, 21133310]
				,[20037500, -21133310]
				,[-20037500, -21133310]
			]]
		};

        if(node.propHiden) {
            if(node.propHiden.geom) {
                attr.geom = node.propHiden.geom;    // Геометрия от обьекта векторного слоя
                attr.bounds = attr.geom.bounds;     // Bounds слоя
            }
            if(node.propHiden.zIndexOffset) node.zIndexOffset = node.propHiden.zIndexOffset;
        }
        var pNode = mapNodes[node.parentId];        // Нода родителя
        if(pNode) {
            var propHiden = pNode.propHiden || {};
            if(propHiden.subType && propHiden.subType === 'tilesParent') {
                attr.minZoom = pNode.minZ || 1;
                attr.maxZoom = pNode.maxZ || 30;
                // pNode.parentId нода векторного слоя по обьекту которого создан растровый слой 
            }
            if(pNode.zIndexOffset) {
                node.zIndexOffset = pNode.zIndexOffset;
            }
        }
        node.zIndex = utils.getIndexLayer(node.id);

        node.getLayerBounds = function(flag) {				// Проверка границ растрового слоя
            if(!gmxNode || !attr.mercGeom) return;
            var extArr = null;      // extend в Меркаторе

            if('getLayerBoundsArrayMerc' in gmxNode && !flag) extArr = gmxNode.getLayerBoundsArrayMerc();
            else {
                var geo = gmxNode.getGeometry();
                if(!geo || !geo.type) {
                    geo = attr.mercGeom;
                    extArr = [gmxAPI.getBounds(geo.coordinates)];
                } else {
                    attr.mercGeom = gmxAPI.merc_geometry(geo);
                    extArr = [gmxAPI.getBounds(attr.mercGeom.coordinates)];
                }
            }
            
            var extMerc = gmxAPI.getBounds();
            for (var i = 0, len = extArr.length; i < len; i++) {
                var ext = extArr[i];
                extMerc.update([[ext.minX, ext.minY], [ext.maxX, ext.maxY]]);
            }
            node.extMerc = extMerc;

            attr.bounds = new L.Bounds(
                [gmxAPI.from_merc_x(extMerc.minX), gmxAPI.from_merc_y(extMerc.minY)]
                ,[gmxAPI.from_merc_x(extMerc.maxX), gmxAPI.from_merc_y(extMerc.maxY)]
            );
            node.extMercWithShift = {         // extent с учетом сдвига в Меркаторе растрового слоя
                minX: extMerc.minX + (node.shiftX || 0),
                maxX: extMerc.maxX + (node.shiftX || 0),
                minY: extMerc.minY + (node.shiftY || 0),
                maxY: extMerc.maxY + (node.shiftY || 0)
            };
            //console.log('boundsMerc', node.shiftX, node.boundsMerc);
        }

        var chkVisible = function() {
        //gmxAPI._leaflet.zoomstart
            if(gmxNode && gmxNode.isVisible !== false && node.isVisible !== false) {
                var notOnScene = true;
                var continuousWorld = false;
                if(myLayer) {
                    if(myLayer._map) notOnScene = false;
                    continuousWorld = myLayer.options.continuousWorld;
                }
                if(!continuousWorld && !node.extMercWithShift) {
                    node.getLayerBounds();
                }
                var ext = (gmxAPI.currPosition && gmxAPI.currPosition.extent ? gmxAPI.currPosition.extent : gmxAPI.map.getPosition().extent);
                var notViewFlag = (!utils.chkVisibilityByZoom(node.id)
                    || (!continuousWorld && !gmxAPI.extIntersect(node.extMercWithShift, ext))
                    );
    //console.log('chkVisible', notViewFlag1 , notViewFlag, gmxAPI._leaflet.zoomstart, node.boundsMerc, currPos.extent);
                if(notOnScene != notViewFlag) {
                    utils.setVisibleNode({obj: node, attr: !notViewFlag});
                    if(notViewFlag) delete gmxAPI._leaflet.renderingObjects[node.id];
                }
            }
        }
        node.redrawLayer = function() {  // Пересоздать тайлы слоя
            if(myLayer && myLayer._map) {
                myLayer.redraw();
            }
        }
        node.redraw = function() {  // Перерисовать растровый слой
            if(myLayer && myLayer._map) {
                for (var key in myLayer._tiles) {
                    var tile = myLayer._tiles[key];
                    myLayer.drawTile(tile, tile._tilePoint);
                }
            }
            myLayer._update();
        }

        node.remove = function() {				// Удалить растровый слой
            if(myLayer) {
                delete gmxAPI._leaflet.renderingObjects[node.id];
                myLayer._reset();
                LMap.removeLayer(myLayer);
            }
        }

		node.setStyle = function() {
			var newOpacity = node.regularStyle.fillOpacity;
			if(myLayer && newOpacity != myLayer.options.opacity) {			// Изменить opacity растрового слоя
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
				if(!node.isVisible || !node.leaflet || !node.leaflet._map) return;
				redrawTimer = null;
				myLayer._update();
			}, 10);
			return false;
		}
		node.waitRedraw = waitRedraw;
		node.isVisible = true;
		if(layer.properties) {
            if('visible' in layer.properties) node.isVisible = layer.properties.visible;
            if('MetaProperties' in layer.properties) {
                var meta = layer.properties.MetaProperties;
                if('shiftX' in meta || 'shiftY' in meta) {
                    node.shiftX = meta.shiftX ? Number(meta.shiftX.Value) : 0;
                    node.shiftY = meta.shiftY ? Number(meta.shiftY.Value) : 0;
                }
            }
        }
        var dragAttr = null;
        var dragOn = function(pt) {
            if(!dragAttr) return false;
            if(dragAttr.options && dragAttr.options.rightButton) {
                if(pt.button !== 2) return false;
			} else {
                if(pt.button === 2) return false;
			}
            var mousemove = function(e) {
                var latlng = e.latlng;
                if(dragAttr && dragAttr.drag) dragAttr.drag(latlng.lng, latlng.lat, gmxNode);
            }
            var mouseup = function(e) {
                var latlng = e.latlng;
                LMap.off('mousemove', mousemove);
                LMap.off('mouseup', mouseup);
                //LMap.off('mouseout', mouseout);
                if(dragAttr && dragAttr.dragend) dragAttr.dragend(latlng.lng, latlng.lat, gmxNode);
                gmxAPI._leaflet.utils.unfreeze();
                setTimeout(L.bind(function() { gmxAPI.map.dragState = false; }, myLayer), 50);
            }
            var mouseout = function(e) {
                mouseup(e);
            }

			var latlng = gmxAPI._leaflet.mousePos;
            if('isPointIn' in node && !node.isPointIn(latlng)) {
                gmxAPI._leaflet.utils.unfreeze();
                gmxAPI.map.dragState = false;
                return false;
            }
			gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map, {});	// Убрать балуны
            if(!gmxAPI.map.dragState) {
                gmxAPI._leaflet.utils.freeze();
                gmxAPI.map.dragState = true;
                if(myLayer._clearBgBufferTimer) clearTimeout(myLayer._clearBgBufferTimer);
				setTimeout(L.bind(myLayer._clearBgBuffer, myLayer), 500);
            }
            
            LMap.on('mousemove', mousemove);
            LMap.on('mouseup', mouseup);
            //LMap.on('mouseout', mouseout);
            if(dragAttr.dragstart) dragAttr.dragstart(latlng.lng, latlng.lat, gmxNode);
        }
        gmxAPI.extend(node, {
            eventsCheck: function(evName, attr) {			// проверка событий растрового слоя
                var onScene = (myLayer && myLayer._map ? true : false);
                if(gmxAPI._drawing.activeState
                    || !onScene
                    || gmxAPI._leaflet.curDragState
                    || !node.isPointIn(attr.latlng)
                    ) return false;

                if(evName in node.handlers) {		// Есть handlers на слое
                    var res = node.handlers[evName].call(gmxNode, node.id, gmxNode.properties, attr);
                    if(res) return true;
                }
                if(evName === 'onMouseDown' && dragAttr) {		// Есть enableDragging на слое
                    dragOn(attr);
                    return true;
                }
                return false;
            }
            ,
            enableDragging: function(pt) {     // Включить drag
                if(dragAttr) node.disableDragging();
                dragAttr = pt.attr;
                //LMap.on('mousedown', dragOn);
            }
            ,disableDragging: function() {
                //LMap.off('mousedown', dragOn);
                gmxAPI._leaflet.utils.unfreeze();
                gmxAPI.map.dragState = false;
                dragAttr = null;
            }
            ,setPositionOffset: function(pt) {	// Установить смещение слоя в метрах Меркатора
                node.shiftX = pt.shiftX || 0;
                node.shiftY = pt.shiftY || 0;
                if(myLayer) {
                    node.getLayerBounds();
                    myLayer.options.shiftX = node.shiftX;
                    myLayer.options.shiftY = node.shiftY;
                    myLayer.updateTilesPosition();
                    myLayer._update();
                }
			}
            ,getPositionOffset: function() {	// Получить смещение слоя в метрах Меркатора
                return {shiftX: node.shiftX, shiftY: node.shiftY};
			}
            ,isPointIn: function(latlng) {		// true - latlng точка внутри растрового слоя
                if(!node.isVisible 
                    || !myLayer
                    || !gmxNode
                    ) return false;
                var point = [gmxAPI.merc_x(latlng.lng), gmxAPI.merc_y(latlng.lat)];
                if(node.extMercWithShift) {
                    var ext = node.extMercWithShift;
                    if(point[0] < ext.minX || point[0] > ext.maxX
                        || point[1] < ext.minY || point[1] > ext.maxY
                    ) return false;
                }

                var options = myLayer.options,
                    mercGeom = options.attr.mercGeom;
                if(mercGeom && mercGeom.coordinates && mercGeom.coordinates[0]) {
                    var coords = mercGeom.coordinates,
                        shiftX = node.shiftX || 0,
                        shiftY = node.shiftY || 0;
                    point[0] -= shiftX, point[1] -= shiftY; // учет сдвига shiftX shiftY
                    if(mercGeom.type === 'POLYGON') coords = [coords];
                    for (var i = 0, len = coords.length; i < len; i++) {
                        if(utils.isPointInPolygonArr(point, coords[i][0])) return true;
                    }
                    return false;
                }
                return true;
            }
            ,setGeometry: function() {			// Установка геометрии
                attr.mercGeom = gmxAPI.merc_geometry(node.geometry);
                if(myLayer) {
                    node.getLayerBounds(true);
                    myLayer.options.attr = attr;
                    myLayer.redraw();
                }
            }
            ,setZIndex: function(zIndex) {	// Переустановка zIndex
                var resIndex = node.zIndex + node.zIndexOffset;
                if(myLayer) myLayer.setZIndex(resIndex);
                return resIndex;
			}
		});

		var chkInitListeners = function()	{								// Требуется перерисовка с задержкой
			var func = function(flag) {	// Изменилась видимость слоя
				if(flag) {
					if('nodeInit' in node) node.nodeInit();
					chkVisible();
				}
			};
			var key = 'onChangeVisible';
			if(!node.listenerIDS[key]) {
				node.listenerIDS[key] = {'obj': gmxNode, 'evID': gmxNode.addListener(key, func, -10)};
			}
			if(node.isVisible) {
				func(node.isVisible);
			}
		}
        
        node.nodeInit = function() {
			delete node.nodeInit;

			var initCallback = function(obj) {			// инициализация leaflet слоя
				if(obj._container) {
					if(obj._container.id != node.id) obj._container.id = node.id;
					//if(obj._container.style.position != 'absolute') obj._container.style.position = 'absolute';
					//if(!'zIndex' in node) node.zIndex = utils.getIndexLayer(id) + node.zIndexOffset;
					//utils.bringToDepth(node, node.zIndex);
                    //obj.setZIndex(node.zIndex + node.zIndexOffset);

					if('shiftOSM' in node) node.shiftOSM();
					if(!attr.bounds || attr.bounds.max.x > 180 || (attr.bounds.min.x < -179 && attr.bounds.min.y < -84 && attr.bounds.max.x > 179 && attr.bounds.max.y > 84)) {
						delete obj.options.bounds;
						obj.options.continuousWorld = true;
					}
					else {
						obj.options.bounds = new L.LatLngBounds([new L.LatLng(attr.bounds.min.y, attr.bounds.min.x), new L.LatLng(attr.bounds.max.y, attr.bounds.max.x)]);
					}
				}
			};
			var createLayer = function() {			// инициализация leaflet слоя
				if(!gmxNode) {
					gmxNode = gmxAPI.mapNodes[node.id];
				}
				chkInitListeners();
				var option = {
					minZoom: inpAttr.minZoomView || 1
					,maxZoom: inpAttr.maxZoomView || 30
                    //,maxNativeZoom: 10
					,minZ: inpAttr.minZoom || attr.minZoom || gmxAPI.defaultMinZoom
					,maxZ: inpAttr.maxZoom || attr.maxZoom || gmxAPI.defaultMaxZoom
					,zIndex: node.zIndex + node.zIndexOffset
					,shiftX: node.shiftX || 0
					,shiftY: node.shiftY || 0
					,initCallback: initCallback
					,tileFunc: inpAttr.func
					,attr: attr
					,_needLoadTile: 0
                    ,_inLoadImage: {}
					,nodeID: node.id
					,badTiles: {}
					,async: true
					,unloadInvisibleTiles: true
                    ,gmxCopyright: gmxNode.gmxCopyright
					//,'countInvisibleTiles': (L.Browser.mobile ? 0 : 2)
				};
                if(node.regularStyle && node.regularStyle.fillOpacity) { // Изменить opacity растрового слоя
                    option.opacity = node.regularStyle.fillOpacity;
                }

				if('maxNativeZoom' in gmxNode) {
                    option.maxNativeZoom = gmxNode.maxNativeZoom;
                }
				if(gmxNode.properties.type === 'Overlay') {
					node.isOverlay = true;
					if(!node.zIndexOffset) node.zIndexOffset = 50000;
				} else {
					if(gmxNode.isBaseLayer) node.zIndexOffset = -100000;
				}
                node.getLayerBounds();

				if(!gmxNode.isBaseLayer && attr.bounds) {
					option.bounds = new L.LatLngBounds([new L.LatLng(attr.bounds.min.y, attr.bounds.min.x), new L.LatLng(attr.bounds.max.y, attr.bounds.max.x)]);
				} else {
					option.continuousWorld = true;
				}

				if(node.subType === 'OSM') {
					node.shiftOSM = function() {
						myLayer.options.shiftOSM = utils.getOSMShift();
					}
					myLayer = new L.TileLayer.OSMcanvas(option);
				} else {
					myLayer = new L.TileLayer.ScanExCanvas(option);
				}
				node.leaflet = myLayer;
				var chkPosition = function() {
                    gmxAPI._leaflet.imageLoader.clearLayer(node.id);
                    myLayer.options._needLoadTile = 0;
					chkVisible();
				}
				LMap.on('move', chkPosition);
				LMap.on('zoomend', chkPosition);
                if (node.isOverlay) {
                    LMap.on('zoomstart', function() {
                        if (myLayer._tileContainer) myLayer._tileContainer.style.visibility = 'hidden';
                    });
                }
				chkVisible();
                // window.onbeforeunload = function (evt) {
                    // node.remove();
                    // for (var key in node) node[key] = null;
                // }
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

		gmxNode = gmxAPI.mapNodes[node.id];		// Нода gmxAPI
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
		LMap = gmxAPI._leaflet.LMap;
		utils = gmxAPI._leaflet.utils;
		mapNodes = gmxAPI._leaflet.mapNodes;

		function drawCanvasPolygon( ctx, x, y, lgeo, opt) {
			if(!lgeo) return;
			var zoomCurrent = gmxAPI._leaflet.zoomCurrent;
			var tileSize = zoomCurrent.tileSize;
			//var mInPixel = zoomCurrent.mInPixel;
            var node = mapNodes[opt.nodeID];
			//var shiftX = opt.shiftX || 0;
			//var shiftY = opt.shiftY || 0;
			var shiftOSM = (opt.shiftOSM ? opt.shiftOSM : 0);
			if(node.extMerc) {
				var extMerc = node.extMerc;
				var minx = x * tileSize;
				var maxx = minx + tileSize;
				if (maxx < extMerc.minX) x += zoomCurrent.pz;
				else if (minx > extMerc.maxX) x -= zoomCurrent.pz;
			}
            //ctx.strokeStyle = 'rgba(255, 0, 0, 1)';
			ctx.beginPath();
			var drawPolygon = function(arr) {
				for (var j = 0; j < arr.length; j++)
				{
					var xx = arr[j][0] / tileSize - x;
					var yy = arr[j][1] / tileSize - y;
					var px = 256 * xx;				    px = (0.5 + px) << 0;
					var py = 256 * (1 - yy) - shiftOSM;	py = (0.5 + py) << 0;
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
                this.updateTilesPosition();
            },

            _reset: function (e) {
                for(var key in this.options._inLoadImage) {
                    gmxAPI._leaflet.imageLoader.removeItemsBySrc(key);
                }
                this.options._inLoadImage = {};
                
                //L.TileLayer.Canvas.prototype._reset.call(this, e);
                this.options._needLoadTile = 0;
                if (this._tiles) {
                    for (var key in this._tiles) {
                        this.fire('tileunload', {tile: this._tiles[key]});
                    }
                }
                this._tiles = {};
                this._tilesToLoad = 0;
                if (this.options.reuseTiles) {
                    this._unusedTiles = [];
                }
                if (this._tileContainer) this._tileContainer.innerHTML = '';
                if (this._animated && e && e.hard) {
                    this._clearBgBuffer();
                }
                //this._initContainer(); 
            }
            ,
            _clearBgBuffer: function () {
                var map = this._map;

                if (this._bgBuffer && map && !map._animatingZoom && !map.touchZoom._zooming) {
                    this._bgBuffer.innerHTML = '';
                    this._bgBuffer.style[L.DomUtil.TRANSFORM] = '';
                }
            },
    
            _addTile: function (tilePoint, container) {
                this._adjustTilePoint(tilePoint);
                this.drawTile(null, tilePoint, this._map._zoom);
            }
            ,
            '_update': function() {
                var opt = this.options,
                    nodeID = opt.nodeID,
                    _map = this._map,
                    node = mapNodes[nodeID];
                if (!_map || gmxAPI._leaflet.zoomstart) {
                    node.waitRedraw();
                    return;
                }

                var zoom = _map.getZoom();
                if (zoom > opt.maxZoom || zoom < opt.minZoom) {
                    delete gmxAPI._leaflet.renderingObjects[nodeID];
                    return;
                }
                gmxAPI._leaflet.renderingObjects[nodeID] = 1;
                if('initCallback' in opt) opt.initCallback(this);
                var tileSize = this._getTileSize(),
                    sbounds = _map.getPixelBounds();

                if(!gmxAPI._leaflet.zoomCurrent) utils.chkZoomCurrent();
                var zoomCurrent = gmxAPI._leaflet.zoomCurrent;
                var mInPixel = zoomCurrent.mInPixel;
                var shiftX = mInPixel * (opt.shiftX || 0);
                var shiftY = mInPixel * (opt.shiftY || 0);
                var shiftOSM = (opt.shiftOSM ? opt.shiftOSM : 0);		// Сдвиг для OSM
                shiftY -= shiftOSM;
                sbounds.min.y += shiftY, sbounds.max.y += shiftY;
                sbounds.min.x -= shiftX, sbounds.max.x -= shiftX;

                var nwTilePoint = new L.Point(
                        Math.floor(sbounds.min.x / tileSize),
                        Math.floor(sbounds.min.y / tileSize)),
                    seTilePoint = new L.Point(
                        Math.floor(sbounds.max.x / tileSize),
                        Math.floor(sbounds.max.y / tileSize)),
                    tileBounds = new L.Bounds(nwTilePoint, seTilePoint);

                var pz = Math.pow(2, zoom) - 1;
                if(tileBounds.min.y < 0) tileBounds.min.y = 0;
                if(tileBounds.max.y > pz) tileBounds.max.y = pz;

                this._addTilesFromCenterOut(tileBounds);

                if (opt.unloadInvisibleTiles || opt.reuseTiles) {
                    this._removeOtherTiles(tileBounds);
                }
                if(opt._needLoadTile < 1) delete gmxAPI._leaflet.renderingObjects[nodeID];
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
                    x: tx % pz - pz/2
                    ,y: pz/2 - 1 - ty % pz
                };
                gmxTilePoint.gmxTileID = zoom + '_' + gmxTilePoint.x + '_' + gmxTilePoint.y
                return gmxTilePoint;
            }
            ,
            drawTile: function (tile, tilePoint, zoom) {
                // override with rendering code
                var layer = this,
                    tileKey = tilePoint.x + ':' + tilePoint.y,
                    opt = layer.options,
                    node = mapNodes[opt.nodeID];
                if(!node) return;								// Слой пропал
                
                if(!zoom) zoom = LMap.getZoom();
                if(!gmxAPI._leaflet.zoomCurrent) utils.chkZoomCurrent(zoom);
                var gmxTilePoint = layer._getGMXtileNum(tilePoint, tilePoint.z),
                    tileSize = layer._getTileSize();

                var attr = opt.attr;
                var allFlag = (!attr.bounds || (attr.bounds.min.x < -179 && attr.bounds.min.y <= -85 && attr.bounds.max.x > 179 && attr.bounds.max.y >= 85));
                var isIntersects = 0;
                if(allFlag) isIntersects = 2;
                else {
                    var tileExtent = gmxAPI.getTileExtent(gmxTilePoint.x, gmxTilePoint.y, zoom);
                    if(gmxAPI.extIntersect(tileExtent, node.extMerc)) isIntersects++;
                    if(!isIntersects) {
                        tileExtent.minX += gmxAPI.worldWidthMerc2, tileExtent.maxX += gmxAPI.worldWidthMerc2;
                        if(gmxAPI.extIntersect(tileExtent, node.extMerc)) isIntersects++;
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
                    var gmxTileKey = z + '_' + pt.x + '_' + pt.y;

                    var onError = function(err) {
                        if (!err) err = {};
                        if (!err.skip && z > 1 && !node.isOverlay) {
                           //if (err.stID) opt.badTiles[err.stID] = true;
                            // запрос по раззумливанию растрового тайла
                            pt.zoom.to = z - 1, pt.x = Math.floor(pt.x/2), pt.y = Math.floor(pt.y/2);
                            loadRasterRecursion(pt);
                        } else {
                            pt.callback(null);
                            return;
                        }
                    };
                    if(opt.badTiles[gmxTileKey]) {
                        onError();
                        return;
                    }

                    var item = {
                        'src': rUrl
                        ,layer: node.id
                        ,'stID': gmxTileKey
                        ,'zoom': z
                        ,'callback': function(imageObj) {
                            delete opt._inLoadImage[rUrl];
                            pt.callback({'img': imageObj, 'zoom': z, 'fromZoom': pt.zoom.from, 'x': pt.x, 'y': pt.y});
                        }
                        ,'onerror': function(err) {
                            delete opt._inLoadImage[rUrl];
                            onError(err);
                        }
                    };
                    if(pt.zoom.from != z || node.imageProcessingHook) item.crossOrigin = node.imageProcessingCrossOrigin || 'use-credentials';
                    opt._inLoadImage[rUrl] = true;
                    gmxAPI._leaflet.imageLoader.push(item);
                }
                opt._needLoadTile++;
                loadRasterRecursion({
                    callback: function(ph) {
                        opt._needLoadTile--;
                        if(!layer._map || gmxAPI._leaflet.zoomstart) {
                            return;     // идет анимация
                        }
                        // if(LMap.getZoom() != zoom) {
                            // return;     // Только для текущего zoom
                        // }
                        //if(ph) {     // Есть раззумленный тайл
                        if(ph && LMap.getZoom() === zoom) {     // Есть раззумленный тайл
                            var imageObj = ph.img;
                            if(imageObj && imageObj.width === 256 && imageObj.height === 256) {
                                var pos = null,
                                    imgProcAttr = {
                                        tpx: gmxTilePoint.x
                                        ,tpy: gmxTilePoint.y
                                        ,from: {
                                            x: gmxTilePoint.x,
                                            y: gmxTilePoint.y,
                                            z: ph.fromZoom
                                        }
                                    };
                                if(ph.zoom !== ph.fromZoom) {
                                    pos = gmxAPI.getTilePosZoomDelta(gmxTilePoint, ph.fromZoom, ph.zoom);
                                    if(pos.size < 0.00390625
                                        || pos.x > 255 || pos.y > 255
                                        || (pos.x + pos.size) < 0
                                        || (pos.y + pos.size) < 0
                                    ) {
                                        return;
                                    }
                                    imgProcAttr.from = {
                                        x: ph.x,
                                        y: ph.y,
                                        z: ph.zoom
                                    };
                                }
                                var type = (!pos && isIntersects === 2 && !node.imageProcessingHook ? 'img' : 'canvas');
                                tile = layer.gmxGetTile(tilePoint, type, imageObj);
                                tile.id = gmxTilePoint.gmxTileID;
                                if(type === 'canvas') {
                                    if(pos) {
                                        var canvas = document.createElement('canvas');
                                        canvas.width = canvas.height = 256;
                                        var ptx = canvas.getContext('2d');
                                        ptx.drawImage(imageObj, Math.floor(pos.x), Math.floor(pos.y), pos.size, pos.size, 0, 0, 256, 256);
                                        imageObj = canvas;
                                    }
                                    tile.width = tile.height = 256; // TODO: убрать повторные отрисовки
                                    var ctx = tile.getContext('2d');
                                    var putContent = function(content) {
                                        var pattern = ctx.createPattern(content, "no-repeat");
                                        ctx.fillStyle = pattern;
                                        if(isIntersects === 2) ctx.fillRect(0, 0, 256, 256);
                                        else {
                                            if(!gmxAPI._leaflet.zoomCurrent) utils.chkZoomCurrent(zoom);
                                            drawCanvasPolygon( ctx, gmxTilePoint.x, gmxTilePoint.y, attr.mercGeom, opt);
                                        }
                                        ctx.fill();
                                    };
                                    if (node.imageProcessingHook) {
                                        imgProcAttr.callback = function(inp) {
                                            putContent(inp);
                                        };
                                        var content = node.imageProcessingHook(imageObj, imgProcAttr);
                                        if(content) putContent(content);
                                    } else {
                                        putContent(imageObj);
                                    }
                                } else {
                                    tile.style.width = tile.style.height = tileSize + 'px';
                                }
                            }
                        }
                        if(opt._needLoadTile < 1) {
                            delete gmxAPI._leaflet.renderingObjects[opt.nodeID];
                            utils.waitChkIdle(0, 'RasterLayer ' + opt.nodeID);  // Проверка отрисовки карты
                            if(layer._clearBgBufferTimer) clearTimeout(layer._clearBgBufferTimer);
                            layer._clearBgBufferTimer = setTimeout(L.bind(layer._clearBgBuffer, layer), 500);
                            layer.updateTilesPosition();
                            //console.log('_needLoadTile', opt._needLoadTile);
                        }
                    }
                    ,zoom: {
                        from: tilePoint.z
                    }
                    ,x: gmxTilePoint.x
                    ,y: gmxTilePoint.y
                });
            }
            ,
            updateTilesPosition: function (tile) {
                if (!this._map || gmxAPI._leaflet.zoomstart) return;
                if(!gmxAPI._leaflet.zoomCurrent) utils.chkZoomCurrent();
                var zoomCurrent = gmxAPI._leaflet.zoomCurrent;
                var mInPixel = zoomCurrent.mInPixel;
                var shiftX = mInPixel * (this.options.shiftX || 0);     // сдвиг тайлов
                var shiftY = mInPixel * (this.options.shiftY || 0);
                var shiftOSM = (this.options.shiftOSM ? this.options.shiftOSM : 0);		// Сдвиг для OSM
                shiftY -= shiftOSM;
                var arr = [tile];
                if(!tile) {
                    arr = [];
                    if (this._tiles) {
                        for(var tKey in this._tiles) arr.push(this._tiles[tKey]);
                    }
                }
                for (var i = 0, len = arr.length; i < len; i++) {
                    var tile = arr[i];
                    var tilePos = this._getTilePos(tile._tilePoint);
                        tilePos.x += shiftX;
                        tilePos.y -= shiftY;
                        L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);
                }
            }
            ,
            gmxGetTile: function (tilePoint, type, img) {
                var tKey = tilePoint.x + ':' + tilePoint.y;
                if(tKey in this._tiles) return this._tiles[tKey];
                // if (!this._map) {
                    // console.log('getCanvasTile: ', this);
                // }
                
                var tile = this._createTile(type, img);
                tile.id = tKey;
                tile._layer = this;
                tile._tilePoint = tilePoint;
                var tilePos = this._getTilePos(tilePoint);

                if(!gmxAPI._leaflet.zoomCurrent) utils.chkZoomCurrent();
                var zoomCurrent = gmxAPI._leaflet.zoomCurrent;
                var mInPixel = zoomCurrent.mInPixel;
                var shiftX = mInPixel * (this.options.shiftX || 0); // сдвиг тайлов
                var shiftY = Math.floor(mInPixel * (this.options.shiftY || 0));
                var shiftOSM = (this.options.shiftOSM ? this.options.shiftOSM : 0);		// Сдвиг для OSM
                shiftY -= shiftOSM;
                tilePos.x += shiftX;
                tilePos.y -= shiftY;
                L.DomUtil.setPosition(tile, tilePos, L.Browser.chrome || L.Browser.android23);
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
                var tile = null;
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
    gmxAPI._leaflet.setBackgroundTiles = setBackgroundTiles;				// Добавить растровый слой
})();
