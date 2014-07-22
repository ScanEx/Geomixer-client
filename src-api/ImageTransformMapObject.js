//Поддержка leaflet
(function()
{
	function setImage(node, ph)	{
		var attr = ph.attr;
		node.setImageExtent = (ph.setImageExtent ? true : false);
		var LMap = gmxAPI._leaflet.LMap;				// Внешняя ссылка на карту
		var mapNodes = gmxAPI._leaflet.mapNodes;
		var gmxNode = gmxAPI.mapNodes[node.id];		// Нода gmxAPI
        var toPaneName = attr.toPaneName || 'shadowPane';

		var LatLngToPixel = function(y, x) {
			var point = new L.LatLng(y, x);
			return LMap.project(point);
		}

		var	bounds = null;
		var posLatLng = null;
		
		var pNode = mapNodes[node.parentId] || null;
		var pGroup = (pNode ? pNode.group : LMap);

		var getPixelPoints = function(ph, w, h) {
			var out = {};
			if('extent' in attr) {
				attr.x1 = attr.extent.minX;
				attr.y1 = attr.extent.maxY;
				attr.x2 = attr.extent.minX;
				attr.y2 = attr.extent.minY;
				attr.x3 = attr.extent.maxX;
				attr.y3 = attr.extent.minY;
				attr.x4 = attr.extent.minX;
				attr.y4 = attr.extent.maxY;
				if('sx' in attr) {
					attr.x4 = attr.x1;
					attr.x2 = attr.x3 = Number(attr.x1) + w * attr.sx;
					attr.y2 = attr.y1;
					attr.y3 = attr.y4 = Number(attr.y1) + h * attr.sy;
				}
			}
			var ptl = new L.Point(attr.x1, attr.y1);
			var ptr = new L.Point(attr.x2, attr.y2);
			var pbl = new L.Point(attr.x4, attr.y4);
			var pbr = new L.Point(attr.x3, attr.y3);
			
			bounds = new L.Bounds();
			bounds.extend(ptl); bounds.extend(ptr); bounds.extend(pbl); bounds.extend(pbr);
			
			var pix = LatLngToPixel(ptl.y, ptl.x); out.x1 = Math.floor(pix.x); out.y1 = Math.floor(pix.y);
			pix = LatLngToPixel(ptr.y, ptr.x); out.x2 = Math.floor(pix.x); out.y2 = Math.floor(pix.y);
			pix = LatLngToPixel(pbr.y, pbr.x); out.x3 = Math.floor(pix.x); out.y3 = Math.floor(pix.y);
			pix = LatLngToPixel(pbl.y, pbl.x); out.x4 = Math.floor(pix.x); out.y4 = Math.floor(pix.y);

			var	boundsP = new L.Bounds();
			boundsP.extend(new L.Point(out.x1, out.y1));
			boundsP.extend(new L.Point(out.x2, out.y2));
			boundsP.extend(new L.Point(out.x3, out.y3));
			boundsP.extend(new L.Point(out.x4, out.y4));
			//minP = boundsP.min;
			out.boundsP = boundsP;
			
			out.x1 -= boundsP.min.x; out.y1 -= boundsP.min.y;
			out.x2 -= boundsP.min.x; out.y2 -= boundsP.min.y;
			out.x3 -= boundsP.min.x; out.y3 -= boundsP.min.y;
			out.x4 -= boundsP.min.x; out.y4 -= boundsP.min.y;

			out.ww = Math.round(boundsP.max.x - boundsP.min.x);
			out.hh = Math.round(boundsP.max.y - boundsP.min.y);
			return out;
		}

		var repaint = function(canvas, zoom) {
//console.log('repaint____: ', LMap.getZoom(), node.isLargeImage, node.isVisible, imageObj);
			if(node.isVisible == false || !imageObj) return;
			var w = imageObj.width;
			var h = imageObj.height;
			var ph = getPixelPoints(attr, w, h);

			if(!canvas) return;
			var isOnScene = (bounds ? gmxAPI._leaflet.utils.chkBoundsVisible(bounds) : false);
			node.isOnScene = isOnScene;
			if(!isOnScene || node.isLargeImage === false) return;

			if(!zoom) zoom = LMap.getZoom();
			if(gmxAPI._leaflet.waitSetImage > 5) { waitRedraw(); return; }
			gmxAPI._leaflet.waitSetImage++;

			posLatLng = new L.LatLng(bounds.max.y, bounds.min.x);
			var data = { canvas: imageObj	};
			var ww = ph.ww || w;    //  если не задан extent - то берем размер изображения
			var hh = ph.hh || h;
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
			node.isLargeImage = false;
			if(wView < ww || hView < hh) {
				deltaX = ph.boundsP.min.x - vp1.x + (dx === 360 ? worldSize : (dx === -360 ? -worldSize : 0));
				deltaY = ph.boundsP.min.y - vp1.y;
				posLatLng = vpNorthWest;
				ww = wView;
				hh = hView;
				node.isLargeImage = true;
			}
			var rx = w/ph.ww;
			var ry = h/ph.hh;
			if(rx == 1 && ry == 1) node.isLargeImage = true;

			var points = [[ph.x1, ph.y1], [ph.x2, ph.y2], [ph.x3, ph.y3], [ph.x4, ph.y4]];
			if(!node.setImageExtent && (rx != 1 || ry != 1)) {
				data = gmxAPI._leaflet.ProjectiveImage({
					imageObj: imageObj
					,points: points
					,wView: wView
					,hView: hView
					,deltaX: deltaX
					,deltaY: deltaY
					,patchSize: 64
					,limit: 2
					,type: 'mapObject'
				});
			}

			var paintPolygon = function (ph, content) {
				if(!content) return;
				var arr = [];
				var coords = ph.coordinates;
				var minPoint = ph.boundsP.min;
				if(coords) {
					for (var i = 0; i < coords.length; i++)
					{
						var coords1 = coords[i];
						for (var i1 = 0; i1 < coords1.length; i1++)
						{
							var pArr = coords1[i1];
							for (var j = 0; j < pArr.length; j++)
							{
								var pix = LatLngToPixel(pArr[j][1], pArr[j][0]);
								var px1 = pix.x - minPoint.x; 		px1 = (0.5 + px1) << 0;
								var py1 = pix.y - minPoint.y;		py1 = (0.5 + py1) << 0;
								arr.push({x: px1, y: py1});
							}
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
				if(node.regularStyle && node.regularStyle.fill) ctx.globalAlpha = node.regularStyle.fillOpacity || 1;					
				if(arr.length) {
					ctx.beginPath();
					for (var i = 0; i < arr.length; i++)
					{
						if(i == 0)	ctx.moveTo(arr[i].x + deltaX, arr[i].y + deltaY);
						else		ctx.lineTo(arr[i].x + deltaX, arr[i].y + deltaY);
					}
					ctx.closePath();
				} else {
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
				ctx.fill();
			}
			var multiArr = node.geometry.coordinates;
			if(node.geometry.type == 'Polygon') multiArr = [multiArr];
			
			paintPolygon({coordinates: multiArr, boundsP: ph.boundsP}, data.canvas);
			attr.reposition();
			data = null;
			imageObj = null;
			--gmxAPI._leaflet.waitSetImage;
		}

		var imageObj = null;
		var canvas = node.imageCanvas || null;
		var drawMe = function(canvas_) {
			canvas = canvas_;
			node.imageCanvas = canvas;
			redrawMe();
		}

		attr.reposition = function() {
			if(node.leaflet) {
                node.leaflet.setLatLng(posLatLng);
				//if(!node.setImageExtent) node.leaflet.setLatLng(posLatLng);
				//else L.DomUtil.setPosition(node.imageCanvas, new L.Point(-LMap._mapPane._leaflet_pos.x, -LMap._mapPane._leaflet_pos.y));
			}
		}

		if(node.redrawImageTransform) clearTimeout(node.redrawImageTransform);
		if(node.imageURL) gmxAPI._leaflet.imageLoader.removeItemsBySrc(node.imageURL);
        delete node.imageURL;
        delete node.refreshMe;

		node.redrawImageTransform = null;
		var waitRedraw = function()	{						// Требуется перерисовка с задержкой
			if(node.redrawImageTransform) clearTimeout(node.redrawImageTransform);
			node.redrawImageTransform = setTimeout(redrawMe, 10);
		}

		var redrawMe = function(e) {
			if(gmxAPI._leaflet.zoomstart) return;
			if(!imageObj) {
				var src = attr.url;
				node.imageURL = encodeURIComponent(src);
				var ph = {
					src: src
					,uri: node.imageURL
					,callback: function(img, svgFlag, pt) {
						if(pt.uri === node.imageURL) {
							imageObj = img;
                            gmxAPI._listeners.dispatchEvent('onImageLoad', gmxNode, imageObj);	// Событие загрузки Image
							node.refreshMe = function() {
								node.isLargeImage = null;
								waitRedraw();
							}
							if(canvas) repaint(canvas);
						}
					}
					,onerror: function(e) {
                        gmxAPI._listeners.dispatchEvent('onImageError', gmxNode, e);	    // Ошибка при загрузке Image
						gmxAPI.addDebugWarnings({func: 'setImage', Error: 'not found image: ' + src, alert: 'setImage error'});
					}
				};
				if(!node.setImageExtent) ph.crossOrigin = 'anonymous';
				gmxAPI._leaflet.imageLoader.push(ph);
			} else if(canvas) {
				repaint(canvas);
			}
		}
		
		var createIcon = function() {
			node.isLargeImage = null;
			if(node.leaflet) {
				pGroup.removeLayer(node.leaflet);
			}
			var canvasIcon = L.canvasIcon({
				className: 'my-canvas-icon'
				,node: node
				,drawMe: function(canv) {
					node.isLargeImage = null;
					drawMe(canv);
				}
			});
			var vBounds = LMap.getBounds();
			var vpNorthWest = vBounds.getNorthWest();
			var marker =  new L.GMXMarker(vpNorthWest, {icon: canvasIcon, toPaneName: toPaneName, zIndexOffset: -1000});
				
			node.leaflet = marker;
			pGroup.addLayer(marker);
			if(pNode) gmxAPI._leaflet.utils.setVisibleNode({obj: pNode, attr: true});
			gmxAPI._leaflet.utils.bringToDepth(node, node.zIndex);
			gmxAPI._leaflet.utils.setNodeHandlers(node.id);
            if(node.dragging) {	// todo drag без лефлета
                gmxAPI._leaflet.utils.startDrag(node);
            }

			LMap.on('zoomend', function(e) {
				if(!node.setImageExtent) {
					node.isLargeImage = null;
				}
			});
            gmxAPI.map.addListener('onMoveEnd', function() {
				if(node.setImageExtent) {
					node.isLargeImage = null;
				}
				if(!node.refreshMe || node.isLargeImage === false) return;
				waitRedraw();
			}, -1000);
			
			LMap.on('zoomstart', function(e) {
				if(canvas) canvas.width = canvas.height = 0;
			});
			node.isSetImage = true;
		}
		if(!node.isSetImage) {
			createIcon();
		} else {
            node.isLargeImage = null;
			waitRedraw();
		}
	}

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet.setImageMapObject = setImage;				// трансформация image
})();
