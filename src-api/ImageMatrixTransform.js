//Поддержка leaflet
(function()
{
    var util = {
        chkAttr: function(attr) {
            if('extent' in attr) {
                attr.x1 = attr.extent.minX;
                attr.y1 = attr.extent.maxY;
                attr.x2 = attr.extent.minX;
                attr.y2 = attr.extent.minY;
                attr.x3 = attr.extent.maxX;
                attr.y3 = attr.extent.minY;
                attr.x4 = attr.extent.minX;
                attr.y4 = attr.extent.maxY;
            }
            var	arr = [[attr.x1, attr.y1], [attr.x2, attr.y2], [attr.x4, attr.y4], [attr.x3, attr.y3]];
            var tPoints = {
                ptl: new L.Point(attr.x1, attr.y1)
                ,ptr: new L.Point(attr.x2, attr.y2)
                ,pbr: new L.Point(attr.x3, attr.y3)
                ,pbl: new L.Point(attr.x4, attr.y4)
            }
            tPoints.bounds = new L.Bounds([tPoints.ptl, tPoints.ptr, tPoints.pbl, tPoints.pbr]);
            return tPoints;
		}
        ,LatLngToPixel: function(y, x) {
			var point = new L.LatLng(y, x);
			return gmxAPI._leaflet.LMap.project(point);
		}
        ,getPixelPoints: function(tPoints, w, h) {
			var	parr = [];
			var pix = util.LatLngToPixel(tPoints.ptl.y, tPoints.ptl.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);
			pix = util.LatLngToPixel(tPoints.ptr.y, tPoints.ptr.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);
			pix = util.LatLngToPixel(tPoints.pbl.y, tPoints.pbl.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);
			pix = util.LatLngToPixel(tPoints.pbr.y, tPoints.pbr.x); parr.push([Math.floor(pix.x), Math.floor(pix.y)]);

			tPoints.boundsP = gmxAPI.bounds(parr);
			tPoints.minPoint = tPoints.boundsP.min;
			for (var i = 0, len = parr.length; i < len; i++) {
                parr[i][0] -= tPoints.minPoint.x; parr[i][1] -= tPoints.minPoint.y;
			}
			return parr;
		}
        ,getRaster: function(node, src) {	// Получить растр
            var def = new gmxAPI.gmxDeferred();
            var ph = {
                src: src
                ,uri: node.imageURL
                ,callback: function(img, svgFlag, pt) {
                    if(pt.uri === node.imageURL) {
                        def.resolve(img);
                    }
                }
                ,onerror: function() {
                    gmxAPI.addDebugWarnings({func: 'setImage', Error: 'not found image: ' + src, alert: 'setImage error'});
                }
            };
            if(!node.setImageExtent) ph.crossOrigin = 'anonymous';
            gmxAPI._leaflet.imageLoader.push(ph);
            return def;
        }
		,setTransform: function(node, opacity) {
			var canvas = node.canvas;
			var w = node.imageWidth;
			var h = node.imageHeight;
            var points = util.getPixelPoints(node.tPoints, w, h);
            var matrix3d = gmxAPI._leaflet.utils.getMatrix3d(w, h, points) || null;
            if(matrix3d) {
                canvas.style[node._transformStyleName] = gmxAPI._leaflet.utils.getMatrix3dCSS(matrix3d);
            }
        }
		,repaint: function(node) {
			if(node.isVisible == false
                || !node.image
                || !node.canvas
                ) return;
			var canvas = node.canvas;
			var w = node.imageWidth;
			var h = node.imageHeight;
            var points = util.getPixelPoints(node.tPoints, w, h);

			//if(gmxAPI._leaflet.waitSetImage > 5) { waitRedraw(); return; }
			gmxAPI._leaflet.waitSetImage++;
			var multiArr = node.geometry.coordinates || null;
			if(node.geometry.type == 'Polygon') multiArr = [multiArr];
            canvas.width = w;
            canvas.height = h;
            if(!node.setImageExtent) {
                var matrix3d_inverse = null;
                var matrix3d = gmxAPI._leaflet.utils.getMatrix3d(w, h, points) || null;
                if(matrix3d) {
                    canvas.style[node._transformStyleName] = gmxAPI._leaflet.utils.getMatrix3dCSS(matrix3d);
                    if(multiArr) {
                        var matrix3d_inverse = gmxAPI._leaflet.utils.m4_inverse([
                            matrix3d[0], matrix3d[3], 0, matrix3d[6],
                            matrix3d[1], matrix3d[4], 0, matrix3d[7],
                            0, 0, 1, 0,
                            matrix3d[2], matrix3d[5], 0, 1
                        ]);
                        if(!matrix3d_inverse) multiArr = null;
                    }
                }
            }

            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = ctx.createPattern(node.image, "no-repeat");
            //if(node.regularStyle && node.regularStyle.fill) ctx.globalAlpha = node.regularStyle.fillOpacity || 1;					

            if(multiArr) {
                ctx.beginPath();
                var cnt = 0;
                for (var i = 0, len = multiArr.length; i < len; i++)
                {
                    var coords1 = multiArr[i];
                    for (var i1 = 0, len1 = coords1.length; i1 < len1; i1++)
                    {
                        var pArr = coords1[i1];
                        for (var j = 0, len2 = pArr.length; j < len2; j++)
                        {
                            var pix = util.LatLngToPixel(pArr[j][1], pArr[j][0]);
                            if(matrix3d_inverse) {
                                pix = gmxAPI._leaflet.utils.transformPoint(matrix3d_inverse, pix.x - node.tPoints.minPoint.x, pix.y - node.tPoints.minPoint.y);
                            }
                            if(cnt++ == 0)	ctx.moveTo(pix.x, pix.y);
                            else		    ctx.lineTo(pix.x, pix.y);
                        }
                    }
                }
                ctx.closePath();
            } else {
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.fill();

			node.image = null;
			--gmxAPI._leaflet.waitSetImage;
		}
    }
	function setImage(node, ph)	{
		var attr = ph.attr;
		var tPoints = util.chkAttr(attr);
		var url = encodeURIComponent(attr.url);
        if(node.canvas && node.regularStyle && node.regularStyle.fill) {
            var op = node.regularStyle.fillOpacity || 1;
            if(op && op !== node.canvas.style.opacity) node.canvas.style.opacity = op;
        }
        
        if(url === node.imageURL && node.canvas && node.imageWidth && node.imageHeight) {
            node.tPoints = tPoints;
            var opacity = attr.opacity || 100;
            util.setTransform(node, opacity/100);
            return;
        }
        //console.log('setImage', node.id);
		var posLatLng = new L.LatLng(tPoints.bounds.max.y, tPoints.bounds.min.x);

		var marker = null;
		var LMap = gmxAPI._leaflet.LMap;				// Внешняя ссылка на карту
		var pNode = mapNodes[node.parentId] || null;
		var pGroup = (pNode ? pNode.group : LMap);

        gmxAPI.extend(node, {
            setImageExtent: ph.setImageExtent ? true : false
            ,deferred: new gmxAPI.gmxDeferred()
            ,tPoints: tPoints
            ,imageURL: url
            ,image: null
            ,isOnScene: false
            ,listenersID: {}
			,remove: function() {
                gmxAPI.map.removeListener('onMoveEnd', node.listenersID.onMoveEnd);
                LMap.off('zoomstart', node.zoomstart);
            }
        });
		var chkReady = function() {
//console.log('chkReady', arguments);
            if(!node.leaflet) createIcon().done(function(canv) {
                node.canvas = canv;
                waitRedraw();
            });
            if(!node.image) util.getRaster(node, attr.url).done(function(img) {
                node.image = img;
                node.imageWidth = img.width;
                node.imageHeight = img.height;
                waitRedraw();
            });
            if(node.image && node.leaflet) util.repaint(node);
		}
		node.redrawTimer = null;
		var waitRedraw = function()	{						// Требуется перерисовка с задержкой
			if(node.redrawTimer) clearTimeout(node.redrawTimer);
			node.redrawTimer = setTimeout(chkReady, 10);
		}
        node.refreshMe = waitRedraw;
		var chkNeedRepaint = function() {
			if(node.isVisible == false) return false;
			var isOnScene = (tPoints.bounds ? gmxAPI._leaflet.utils.chkBoundsVisible(tPoints.bounds) : false);
			if(isOnScene && node.isOnScene) return false;
			node.isOnScene = isOnScene;
			if(!isOnScene) {
                if(node.leaflet && node.leaflet._map) {
                    pGroup.removeLayer(node.leaflet);
                    node.isOnScene = false;
                }
                return false;
            } else {
                if(node.leaflet && !node.leaflet._map) {
                    pGroup.addLayer(node.leaflet);
                }
            }
            return true;
		}

        node.deferred.done(chkReady);

        var createIcon = function() {
//console.log('createIcon____', marker);
            node._transformStyleName = gmxAPI._leaflet.utils.getTransformStyleName();
            if(node.leaflet) {
                pGroup.removeLayer(node.leaflet);
            }
            var def = new gmxAPI.gmxDeferred();

            marker =  new L.GMXMarker(posLatLng, {
                icon: new L.DivIcon({
                    iconSize: new L.Point(0, 0)
                    ,className: ''
                })
                ,toPaneName: 'shadowPane'
                ,zIndexOffset: -1000
            });
            marker.on('onIconCreate', function(ev) {
                var div =  marker._icon;
                var canvas = document.createElement('canvas');
                if(!node.setImageExtent) canvas.className = 'canvas-imageTransform';
                div.appendChild(canvas);
                gmxAPI.setStyleHTML(canvas, {'position': 'absolute'}, false);
//console.log('onCreate', canvas);
                node.canvas = canvas;
                def.resolve(canvas);
                waitRedraw();
            });

            node.leaflet = marker;
            pGroup.addLayer(marker);
            if(pNode) gmxAPI._leaflet.utils.setVisibleNode({obj: pNode, attr: true});
            gmxAPI._leaflet.utils.setNodeHandlers(node.id);
            //if(node.dragging) { // todo drag без лефлета
            //    gmxAPI._leaflet.utils.startDrag(node);
            //}
            node.listenersID.onMoveEnd = gmxAPI.map.addListener('onMoveEnd', function() {
                if(chkNeedRepaint()) waitRedraw();
            }, -100);
            node.zoomstart = function(e) {
                if(node.canvas) node.canvas.width = node.canvas.height = 0;
                node.image = null;
                node.isOnScene = false;
            }
            LMap.on('zoomstart', node.zoomstart);
            node.isSetImage = true;
            return def;
        };
        if(!marker) {
            createIcon().done(function(canv) {
                node.canvas = canv;
                waitRedraw();
            });
        } else {
            waitRedraw();
        }
        return;
	}

	//расширяем namespace
	if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
	gmxAPI._leaflet.ImageMatrixTransform = function(node, ph) {   // CSS Matrix3d трансформация image
        setImage(node, ph);
    };
})();
