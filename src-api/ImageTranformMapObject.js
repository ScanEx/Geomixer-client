//Поддержка leaflet
(function()
{
	function setImage(node, ph)	{
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
        var tPoints = {
			ptl: new L.Point(attr.x1, attr.y1)
            ,ptr: new L.Point(attr.x2, attr.y2)
            ,pbl: new L.Point(attr.x4, attr.y4)
            ,pbr: new L.Point(attr.x3, attr.y3)
        }
        tPoints.bounds = new L.Bounds([tPoints.ptl, tPoints.ptr, tPoints.pbl, tPoints.pbr]);
        node.transoformPoints = tPoints;
        
		var getPixelPoints = function(ph, w, h) {
			var	transoformPoints = node.transoformPoints;
			var	parr = [];
			var pix = LatLngToPixel(transoformPoints.ptl.y, transoformPoints.ptl.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);
			pix = LatLngToPixel(transoformPoints.ptr.y, transoformPoints.ptr.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);
			pix = LatLngToPixel(transoformPoints.pbl.y, transoformPoints.pbl.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);
			pix = LatLngToPixel(transoformPoints.pbr.y, transoformPoints.pbr.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);

			var boundsP = gmxAPI.bounds(parr);
			minPoint = boundsP.min;
			for (var i = 0, len = parr.length; i < len; i++) {
                parr[i][0] -= minPoint.x; parr[i][1] -= minPoint.y;
			}
			return parr;
		}

		var repaint = function(canvas, zoom) {
			if(node.isVisible == false
                || !imageObj
                || !canvas
                ) return;
			var w = imageObj.width;
			var h = imageObj.height;
            var points = getPixelPoints(attr, w, h);

			var isOnScene = (node.transoformPoints.bounds ? gmxAPI._leaflet.utils.chkBoundsVisible(node.transoformPoints.bounds) : false);
			node.isOnScene = isOnScene;
			if(!isOnScene) return;

			if(!zoom) zoom = LMap.getZoom();
			if(gmxAPI._leaflet.waitSetImage > 5) { waitRedraw(); return; }
			gmxAPI._leaflet.waitSetImage++;

            var matrix3d = gmxAPI._leaflet.utils.getMatrix3d(imageObj.width, imageObj.height, points);
			posLatLng = new L.LatLng(node.transoformPoints.bounds.max.y, node.transoformPoints.bounds.min.x);

            canvas.width = w;
            canvas.height = h;
            if(!node.setImageExtent) {
                var left = w * matrix3d.arr[0]/2;
                var top = h * matrix3d.arr[4]/2;
                canvas.style.left = left + 'px';
                canvas.style.top = top + 'px';
                var matrix3dCSS = gmxAPI._leaflet.utils.getMatrix3dCSS(matrix3d.arr, -w/2, -h/2);
                var _transformStyleName = gmxAPI._leaflet.utils.getTransformStyleName();
                canvas.style[_transformStyleName] = matrix3dCSS;
            }

			var paintPolygon = function (ph) {
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
				className: 'canvas-imageTransform'
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
