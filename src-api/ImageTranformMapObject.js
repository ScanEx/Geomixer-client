//Поддержка leaflet
(function()
{
	function setImage(node, ph)	{
//var canvasIcon = null;
		var attr = ph.attr;
		node.setImageExtent = (ph.setImageExtent ? true : false);
		var LMap = gmxAPI._leaflet.LMap;				// Внешняя ссылка на карту
		var mapNodes = gmxAPI._leaflet.mapNodes;

		var LatLngToPixel = function(y, x) {
			var point = new L.LatLng(y, x);
			return LMap.project(point);
		}

		var	bounds = null;
		var minPoint = null;
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
			var	arr = [[attr.x1, attr.y1], [attr.x2, attr.y2], [attr.x4, attr.y4], [attr.x3, attr.y3]];
			var ptl = new L.Point(attr.x1, attr.y1);
			var ptr = new L.Point(attr.x2, attr.y2);
			var pbl = new L.Point(attr.x4, attr.y4);
			var pbr = new L.Point(attr.x3, attr.y3);

			//bounds = gmxAPI.bounds(arr);
			bounds = new L.Bounds();
			bounds.extend(ptl); bounds.extend(ptr); bounds.extend(pbl); bounds.extend(pbr);
			
			var	parr = [];
			var pix = LatLngToPixel(ptl.y, ptl.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);
			pix = LatLngToPixel(ptr.y, ptr.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);
			pix = LatLngToPixel(pbl.y, pbl.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);
			pix = LatLngToPixel(pbr.y, pbr.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);

			var boundsP = gmxAPI.bounds(parr);
			minPoint = boundsP.min;
			for (var i = 0, len = parr.length; i < len; i++) {
                parr[i][0] -= minPoint.x; parr[i][1] -= minPoint.y;
			}
			return parr;
		}

		var repaint = function(canvas, zoom) {
console.log('repaint____: ', LMap.getZoom(), node.isVisible, imageObj);
			if(node.isVisible == false
                || !imageObj
                || !canvas
                ) return;
			var w = imageObj.width;
			var h = imageObj.height;
			//var ph = getPixelPoints(attr, w, h);
var points = getPixelPoints(attr, w, h);

			var isOnScene = (bounds ? gmxAPI._leaflet.utils.chkBoundsVisible(bounds) : false);
			node.isOnScene = isOnScene;
			if(!isOnScene) return;

			if(!zoom) zoom = LMap.getZoom();
			if(gmxAPI._leaflet.waitSetImage > 5) { waitRedraw(); return; }
			gmxAPI._leaflet.waitSetImage++;

//var points = [[ph.x1, ph.y1], [ph.x2, ph.y2], [ph.x4, ph.y4], [ph.x3, ph.y3]];
var matrix3d = gmxAPI._leaflet.utils.getMatrix3d(imageObj.width, imageObj.height, points);

			posLatLng = new L.LatLng(bounds.max.y, bounds.min.x);
			//var data = { canvas: imageObj	};
			// var ww = ph.ww;
			// var hh = ph.hh;
			
			// var rx = w/ph.ww;
			// var ry = h/ph.hh;
			//if(rx == 1 && ry == 1) node.isLargeImage = true;
            canvas.width = w;
            canvas.height = h;
            var left = w * matrix3d.arr[0]/2;
            var top = h * matrix3d.arr[4]/2;
            canvas.style.left = left + 'px';
            canvas.style.top = top + 'px';

			var paintPolygon = function (ph) {
				//var minPoint = ph.boundsP.min;

                var matrix3dCSS = gmxAPI._leaflet.utils.getMatrix3dCSS(matrix3d.arr, -w/2, -h/2);
                var _transformStyleName = gmxAPI._leaflet.utils.getTransformStyleName();
                canvas.style[_transformStyleName] = matrix3dCSS;
				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = ctx.createPattern(imageObj, "no-repeat");
				if(node.regularStyle && node.regularStyle.fill) ctx.globalAlpha = node.regularStyle.fillOpacity || 1;					
				var coords = ph.coordinates;
				if(coords) {
					ctx.beginPath();
                    var cnt = 0;
					for (var i = 0; i < coords.length; i++)
					{
						var coords1 = coords[i];
						for (var i1 = 0; i1 < coords1.length; i1++)
						{
							var pArr = coords1[i1];
							for (var j = 0; j < pArr.length; j++)
							{
								var pix = LatLngToPixel(pArr[j][1], pArr[j][0]);
								var px1 = (pix.x - minPoint.x)/matrix3d.arr[0];
								var py1 = (pix.y - minPoint.y)/matrix3d.arr[4];
                                if(cnt++ == 0)	ctx.moveTo(px1, py1);
                                else		    ctx.lineTo(px1, py1);
							}
						}
					}
					ctx.closePath();
				} else {
					ctx.fillRect(0, 0, canvas.width, canvas.height);
				}
				ctx.fill();
			}
			var multiArr = node.geometry.coordinates;
			if(node.geometry.type == 'Polygon') multiArr = [multiArr];
			
			paintPolygon({coordinates: multiArr, boundsP: ph.boundsP});
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
					,crossOrigin: 'anonymous'
					,callback: function(img, svgFlag, pt) {
						if(pt.uri === node.imageURL) {
							imageObj = img;
							node.refreshMe = function() {
								waitRedraw();
							}
							if(canvas) repaint(canvas);
						}
					}
					,onerror: function() {
						gmxAPI.addDebugWarnings({func: 'setImage', Error: 'not found image: ' + src, alert: 'setImage error'});
					}
				};
				gmxAPI._leaflet.imageLoader.push(ph);
			} else if(canvas) {
				repaint(canvas);
			}
		}
		
		var createIcon = function() {
			if(node.leaflet) {
				pGroup.removeLayer(node.leaflet);
			}
			var canvasIcon = new L.gmxDivIcon({
				className: 'my-canvas-icon'
				,'iconSize': new L.Point(0, 0)
				,'node': node
				,'drawMe': function(canv) {
					drawMe(canv);
				}
			});
			var vBounds = LMap.getBounds();
			var vpNorthWest = vBounds.getNorthWest();
			var marker =  new L.GMXMarker(vpNorthWest, {icon: canvasIcon, toPaneName: 'shadowPane', zIndexOffset: -1000});
				
			node.leaflet = marker;
			pGroup.addLayer(marker);
			if(pNode) gmxAPI._leaflet.utils.setVisibleNode({obj: pNode, attr: true});
			gmxAPI._leaflet.utils.setNodeHandlers(node.id);
            if(node.dragging) {	// todo drag без лефлета
                gmxAPI._leaflet.utils.startDrag(node);
            }

            gmxAPI.map.addListener('onMoveEnd', function() {
				if(!node.refreshMe) return;
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
			waitRedraw();
		}
	}

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet.setImageMapObject = setImage;				// трансформация image
})();
