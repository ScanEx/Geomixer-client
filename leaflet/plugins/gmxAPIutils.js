var gmxAPIutils = {
	lastMapId: 0,
    
	newId: function()
	{
		gmxAPIutils.lastMapId += 1;
		return '_' + gmxAPIutils.lastMapId;
	},
    
	uniqueGlobalName: function(thing)
	{
		var id = gmxAPIutils.newId();
		window[id] = thing;
		return id;
	},

    isPageHidden: function()	{		// Видимость окна браузера
        return document.hidden || document.msHidden || document.webkitHidden || document.mozHidden || false;
    },
   
    /** Sends JSONP requests 
      @return {gmxDeferred} Defered with server JSON resonse or error status
    */
	requestJSONP: function(url, params, callbackParamName) {
        var def = new gmxDeferred();
        callbackParamName = callbackParamName || 'CallbackName';
        
        var script = document.createElement("script");
        script.setAttribute("charset", "UTF-8");
        var callbackName = gmxAPIutils.uniqueGlobalName(function(obj)
        {
            delete window[callbackName];
            document.getElementsByTagName("head").item(0).removeChild(script);
            def.resolve(obj);
        });
        var urlParams = L.extend({}, params);
        urlParams[callbackParamName] = callbackName;
        
        var paramsStringItems = [];
        
        for (var p in urlParams) {
            paramsStringItems.push(p + '=' + encodeURIComponent(urlParams[p]));
        }
        
        var sepSym = url.indexOf('?') == -1 ? '?' : '&';
        
        script.onerror = function(e) {
            def.reject(e);
        };
        
        script.setAttribute("src", url + sepSym + paramsStringItems.join('&'));
        document.getElementsByTagName("head").item(0).appendChild(script);
        return def;
    },
    getXmlHttp: function() {
        var xmlhttp;
        if (typeof XMLHttpRequest != 'undefined') {
            xmlhttp = new XMLHttpRequest();
        } else {
          try {
            xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
          } catch (e) {
            try {
              xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
            } catch (E) {
              xmlhttp = false;
            }
          }
        }
        return xmlhttp;
    },
    request: function(ph) { // {'type': 'GET|POST', 'url': 'string', 'callback': 'func'}
      try {
        var xhr = gmxAPIutils.getXmlHttp();
        xhr.open((ph.type ? ph.type : 'GET'), ph.url, ph.async || false);
        xhr.send((ph.params ? ph.params : null));
        if (ph.async) {
            xhr.withCredentials = true;
            xhr.onreadystatechange = function() {
                if (xhr.readyState == 4) {
                    //self.log('xhr.status ' + xhr.status);
                    if(xhr.status == 200) {
                        ph.callback(xhr.responseText);
                        xhr = null;
                    }
                }
            };
        } else {
            if(xhr.status == 200) {
                ph.callback(xhr.responseText);
            }
        }
        return xhr.status;
      } catch (e) {
        if(ph.onError) ph.onError(xhr.responseText);
        return e.description; // turn all errors into empty results
      }
    }
    ,

    tileSizes: [] // Размеры тайла по zoom
    ,
    
    getTileNumFromLeaflet: function (tilePoint, zoom) {
        var pz = Math.pow(2, zoom),
            tx = tilePoint.x % pz + (tilePoint.x < 0 ? pz : 0),
            ty = tilePoint.y % pz + (tilePoint.y < 0 ? pz : 0);
        return {
            z: zoom
            ,x: tx % pz - pz/2
            ,y: pz/2 - 1 - ty % pz
        };
    },

	getTilePosZoomDelta: function(tilePoint, zoomFrom, zoomTo) {		// получить смещение тайла на меньшем zoom
		var dz = Math.pow(2, zoomFrom - zoomTo);
		var size = 256 / dz;
		var dx = tilePoint.x % dz;
		var dy = tilePoint.y % dz;
		return {
			size: size
			,zDelta: dz
			,x: size * (dx < 0 ? dz + dx : dx)
			,y: size * (dy < 0 ? 1 + dy : dz - 1 - dy)
		};
    }
	,
    //TODO: use L.Bounds? test performance?
	'bounds': function(arr) {							// получить bounds массива точек
		var res = {
			min: {
				x: Number.MAX_VALUE,
                y: Number.MAX_VALUE
			},
			max: {
				x: -Number.MAX_VALUE,
                y: -Number.MAX_VALUE
			},
			extend: function(x, y) {
				if (x < this.min.x) this.min.x = x;
				if (x > this.max.x) this.max.x = x;
				if (y < this.min.y) this.min.y = y;
				if (y > this.max.y) this.max.y = y;
                return this;
			},
			extendBounds: function(bounds) {
				this.extendArray([[bounds.min.x, bounds.min.y], [bounds.max.x, bounds.max.y]]);
			},
			extendArray: function(arr) {
                if (!arr) { return this };
				for(var i=0, len=arr.length; i<len; i++) {
					this.extend(arr[i][0], arr[i][1]);
				}
                return this;
			},
            addBuffer: function(dxmin, dymin, dxmax, dymax) {
                this.min.x -= dxmin;
                this.min.y -= dymin;
                this.max.x += dxmax;
                this.max.y += dymax;
                return this;
            },
			contains: function (point) { // ([x, y]) -> Boolean
				var min = this.min, max = this.max,
					x = point[0], y = point[1];
				return x > min.x && x < max.x && y > min.y && y < max.y;
            },
			intersects: function (bounds) { // (Bounds) -> Boolean
				var min = this.min,
					max = this.max,
					min2 = bounds.min,
					max2 = bounds.max;
				return max2.x > min.x && min2.x < max.x && max2.y > min.y && min2.y < max.y;
            },
			intersectsWithDelta: function (bounds, dx, dy) { // (Bounds, dx, dy) -> Boolean
				var min = this.min,
					max = this.max,
					dx = dx || 0,
					dy = dy || 0,
					min2 = bounds.min,
					max2 = bounds.max;
				return max2.x + dx > min.x && min2.x - dx < max.x && max2.y + dy > min.y && min2.y - dy < max.y;
			}
		};
        
		return res.extendArray(arr);
    },

    geoItemBounds: function(geo) {  // get bounds by geometry
        var type = geo.type,
            coords = geo.coordinates,
            bounds = null,
            boundsArr = [],
            arr = [];
        if (type === 'MULTIPOLYGON') {
            bounds = gmxAPIutils.bounds();
            for (var i = 0, len = coords.length; i < len; i++) {
                var arr1 = [];
                for (var j = 0, len1 = coords[i].length; j < len1; j++) {
                    var b = gmxAPIutils.bounds(coords[i][j]);
                    arr1.push(b);
                    if (j === 0) bounds.extendBounds(b);
                }
                boundsArr.push(arr1);
            }
        } else if (type === 'POLYGON') {
            bounds = gmxAPIutils.bounds();
            for (var i = 0, len = coords.length; i < len; i++) {
                var b = gmxAPIutils.bounds(coords[i]);
                boundsArr.push(b);
                if (i === 0) bounds.extendBounds(b);
            }
        } else if (type === 'POINT') {
            bounds = gmxAPIutils.bounds([coords]);
        } else if (type === 'MULTIPOINT') {
            bounds = gmxAPIutils.bounds();
            for (var i = 0, len = coords.length; i < len; i++) {
                var b = gmxAPIutils.bounds([coords[i]]);
                bounds.extendBounds(b);
            }
        } else if (type === 'LINESTRING') {
            bounds = gmxAPIutils.bounds(coords);
            //boundsArr.push(bounds);
        } else if (type === 'MULTILINESTRING') {
            bounds = gmxAPIutils.bounds();
            for (var i = 0, len = coords.length; i < len; i++) {
                var b = gmxAPIutils.bounds([coords[i]]);
                bounds.extendBounds(b);
                //boundsArr.push(b);
            }
        }
        return {
            bounds: bounds,
            boundsArr: boundsArr
        };
    },

    getMarkerPolygon: function(bounds, dx, dy) {
        var x = (bounds.min.x + bounds.max.x) / 2,
            y = (bounds.min.y + bounds.max.y) / 2;
        return [
            [x - dx, y - dy]
            ,[x - dx, y + dy]
            ,[x + dx, y + dy]
            ,[x + dx, y - dy]
            ,[x - dx, y - dy]
        ];
    },

    getPropertiesHash: function(arr, indexes) {
        var properties = {};
        for (var key in indexes) {
            properties[key] = arr[indexes[key]];
        };
        return properties;
    },

    dec2rgba: function(i, a)	{				// convert decimal to rgb
		var r = (i >> 16) & 255;
		var g = (i >> 8) & 255;
		var b = i & 255;
		return 'rgba('+r+', '+g+', '+b+', '+a+')';
	},

    dec2hex: function(i)	{					// convert decimal to hex
        return (i+0x1000000).toString(16).substr(-6).toUpperCase();
    },

	'oneDay': 60*60*24			// один день
	,
    'isTileKeysIntersects': function(tk1, tk2) { // пересечение по номерам двух тайлов
        if (tk1.z < tk2.z) {
            var t = tk1; tk1 = tk2; tk2 = t;
        }
        
        var dz = tk1.z - tk2.z
        return tk1.x >> dz === tk2.x && tk1.y >> dz === tk2.y;
	},

    rotatePoints: function(arr, angle, scale, center) {			// rotate - массива точек
        var out = [];
        angle *= Math.PI / 180.0
        var sin = Math.sin(angle);
        var cos = Math.cos(angle);
        if(!scale) scale = 1;
        for (var i = 0; i < arr.length; i++)
        {
            var x = scale * arr[i].x - center.x;
            var y = scale * arr[i].y - center.y;
            out.push({
                'x': cos * x - sin * y + center.x
                ,'y': sin * x + cos * y + center.y
            });
        }
        return out;
    }
    , 
    'getPatternIcon': function(item, style) {			// получить bitmap стиля pattern
        if (!style.pattern) return null;

        var notFunc = true,
            pattern = style.pattern,
            prop = (item ? item.properties : {}),
            step = (pattern.step > 0 ? pattern.step : 0),		// шаг между линиями
            patternDefaults = {					// настройки для pattern стилей
                 minWidth: 1
                ,maxWidth: 1000
                ,minStep: 0
                ,maxStep: 1000
            };
        if (pattern.patternStepFunction != null && prop != null) {
            step = pattern.patternStepFunction(prop);
            notFunc = false;
        }
        if (step > patternDefaults.maxStep) {
            step = patternDefaults.maxStep;
        }
        else if (step < patternDefaults.minStep) {
            step = patternDefaults.minStep;
        }
        
        var size = (pattern.width > 0 ? pattern.width : 8);		// толщина линий
        if (pattern.patternWidthFunction != null && prop != null) {
            size = pattern.patternWidthFunction(prop);
            notFunc = false;
        }
        if (size > patternDefaults.maxWidth) {
            size = patternDefaults.maxWidth;
        }
        else if (size < patternDefaults.minWidth) {
            size = patternDefaults.minWidth;
        }

        var op = style.fillOpacity;
        if (style.opacityFunction != null && prop != null) {
            op = style.opacityFunction(prop) / 100;
            notFunc = false;
        }
        
        var arr = (pattern.colors != null ? pattern.colors : []);
        var count = arr.length;
        var resColors = []
        var rgb = [0xff0000, 0x00ff00, 0x0000ff];
        for (var i = 0; i < count; i++) {
            var col = arr[i];
            if(pattern.patternColorsFunction[i] != null) {
                col =  (prop != null ? pattern.patternColorsFunction[i](prop): rgb[i%3]);
                notFunc = false;
            }
            resColors.push(col);
        }

        var delta = size + step,
            allSize = delta * count,
            center = 0,	radius = 0,	rad = 0,
            hh = allSize,				// высота битмапа
            ww = allSize,				// ширина битмапа
            type = pattern.style, 
            flagRotate = false;

        if (type == 'diagonal1' || type == 'diagonal2' || type == 'cross' || type == 'cross1') {
            flagRotate = true;
        } else if (type == 'circle') {
            ww = hh = 2 * delta;
            center = Math.floor(ww / 2);	// центр круга
            radius = Math.floor(size / 2);	// радиус
            rad = 2 * Math.PI / count;		// угол в рад.
        }
        if (ww * hh > patternDefaults.maxWidth) {
            console.log({'func': 'getPatternIcon', 'Error': 'MAX_PATTERN_SIZE', 'alert': 'Bitmap from pattern is too big'});
            return null;
        }

        var canvas = document.createElement('canvas');
        canvas.width = ww, canvas.height = hh;
        var ptx = canvas.getContext('2d');
        ptx.clearRect(0, 0, canvas.width , canvas.height);
        if (type === 'diagonal2' || type === 'vertical') {
            ptx.translate(ww, 0);
            ptx.rotate(Math.PI/2);
        }

        for (var i = 0; i < count; i++) {
            ptx.beginPath();
            var col = resColors[i];
            var fillStyle = gmxAPIutils.dec2rgba(col, 1);
            fillStyle = fillStyle.replace(/1\)/, op + ')');
            ptx.fillStyle = fillStyle;

            if (flagRotate) {
                var x1 = i * delta; var xx1 = x1 + size;
                ptx.moveTo(x1, 0); ptx.lineTo(xx1, 0); ptx.lineTo(0, xx1); ptx.lineTo(0, x1); ptx.lineTo(x1, 0);

                x1 += allSize; xx1 = x1 + size;
                ptx.moveTo(x1, 0); ptx.lineTo(xx1, 0); ptx.lineTo(0, xx1); ptx.lineTo(0, x1); ptx.lineTo(x1, 0);
                if (type === 'cross' || type === 'cross1') {
                    x1 = i * delta; xx1 = x1 + size;
                    ptx.moveTo(ww, x1); ptx.lineTo(ww, xx1); ptx.lineTo(ww - xx1, 0); ptx.lineTo(ww - x1, 0); ptx.lineTo(ww, x1);

                    x1 += allSize; xx1 = x1 + size;
                    ptx.moveTo(ww, x1); ptx.lineTo(ww, xx1); ptx.lineTo(ww - xx1, 0); ptx.lineTo(ww - x1, 0); ptx.lineTo(ww, x1);
                }
            } else if (type == 'circle') {
                ptx.arc(center, center, size, i*rad, (i+1)*rad);
                ptx.lineTo(center, center);
            } else {
                ptx.fillRect(0, i * delta, ww, size);
            }
            ptx.closePath();
            ptx.fill();
        }
        var canvas1 = document.createElement('canvas');
        canvas1.width = ww
        canvas1.height = hh;
        var ptx1 = canvas1.getContext('2d');
        ptx1.drawImage(canvas, 0, 0, ww, hh);
        return { 'notFunc': notFunc, 'canvas': canvas1 };
    }
	,
	'toPixels': function(p, tpx, tpy, mInPixel) {				// получить координату в px
        var px1 = p[0] * mInPixel; 	px1 = (0.5 + px1) << 0;
        var py1 = p[1] * mInPixel;	py1 = (0.5 + py1) << 0;
        return [px1 - tpx, tpy - py1];
    },
    pointToCanvas: function(attr) {				// Точку в canvas
        var gmx = attr.gmx,
            style = attr.style,
            itemOptions = attr.itemOptions,
            parsedStyleKeys = itemOptions.parsedStyleKeys,
            coords = attr.coords,
            px = attr.tpx,
            py = attr.tpy,
            sx = attr.sx || style.sx || 4,
            sy = attr.sy || style.sy || 4,
            ctx = attr.ctx;

        if(gmx.transformFlag) {
            px /= gmx.mInPixel, py /= gmx.mInPixel;
            sx /= gmx.mInPixel, sy /= gmx.mInPixel;
        }
        // получить координату в px
        var p1 = gmx.transformFlag ? [coords[0], coords[1]] : gmxAPIutils.toPixels(coords, px, py, gmx.mInPixel),
            px1 = p1[0], py1 = p1[1];

        if(style.marker) {
            style.rotateRes = parsedStyleKeys.rotate || 0;
            if(style.image) {
                if('opacity' in style) ctx.globalAlpha = style.opacity;
                if(gmx.transformFlag) {
                    ctx.setTransform(gmx.mInPixel, 0, 0, gmx.mInPixel, -attr.tpx, attr.tpy);
                    ctx.drawImage(style.image, px1 - sx, sy - py1, 2 * sx, 2 * sy);
                    ctx.setTransform(gmx.mInPixel, 0, 0, -gmx.mInPixel, -attr.tpx, attr.tpy);
                } else if(style.rotateRes) {
                    ctx.translate(px1 - sx, py1 - sy);
                    ctx.rotate(gmxAPIutils.deg_rad(style.rotateRes));
                    ctx.drawImage(style.image, 0, 0, 2 * sx, 2 * sy);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                } else {
                    ctx.drawImage(style.image, px1 - sx, py1 - sy, 2 * sx, 2 * sy);
                }
                if('opacity' in style) ctx.globalAlpha = 1;
            }
        } else if(style.strokeStyle) {
            ctx.beginPath();
            if(style.circle) {
                ctx.arc(px1, py1, style.circle, 0, 2*Math.PI);
            } else {
                ctx.strokeRect(px1 - sx, py1 - sy, 2*sx, 2*sy);
            }
            ctx.stroke();
        }
        if(style.fill) {
            ctx.beginPath();
            if(style.circle) {
                if(style.radialGradient) {
                    var rgr = style.radialGradient;
                    var r1 = (rgr.r1Function ? rgr.r1Function(prop) : rgr.r1);
                    var r2 = (rgr.r2Function ? rgr.r2Function(prop) : rgr.r2);
                    var x1 = (rgr.x1Function ? rgr.x1Function(prop) : rgr.x1);
                    var y1 = (rgr.y1Function ? rgr.y1Function(prop) : rgr.y1);
                    var x2 = (rgr.x2Function ? rgr.x2Function(prop) : rgr.x2);
                    var y2 = (rgr.y2Function ? rgr.y2Function(prop) : rgr.y2);

                    var radgrad = ctx.createRadialGradient(px1+x1, py1+y1, r1, px1+x2, py1+y2,r2);  
                    for (var i = 0, len = style.radialGradient.addColorStop.length; i < len; i++)
                    {
                        var arr = style.radialGradient.addColorStop[i];
                        var arrFunc = style.radialGradient.addColorStopFunctions[i];
                        var p0 = (arrFunc[0] ? arrFunc[0](prop) : arr[0]);
                        var p2 = (arr.length < 3 ? 100 : (arrFunc[2] ? arrFunc[2](prop) : arr[2]));
                        var p3 = gmxAPIutils.dec2rgba(arrFunc[1] ? arrFunc[1](prop) : arr[1], p2/100);
                        radgrad.addColorStop(p0, p3);
                    }
                    ctx.fillStyle = radgrad;
                }
                ctx.arc(px1, py1, style.circle, 0, 2*Math.PI);
            } else {
                ctx.fillRect(px1 - sx, py1 - sy, 2*sx, 2*sy);
            }
            ctx.fill();
        }
    },
	'lineToCanvas': function(attr) {				// Линии в canvas
		var gmx = attr.gmx,
            coords = attr.coords,
            ctx = attr.ctx;

        var lastX = null, lastY = null;
		if(attr.style.strokeStyle) {
			ctx.beginPath();
			for (var i = 0, len = coords.length; i < len; i++) {
                var p1 = gmxAPIutils.toPixels(coords[i], attr.tpx, attr.tpy, gmx.mInPixel);
				if(lastX !== p1[0] || lastY !== p1[1]) {
					if(i == 0)	ctx.moveTo(p1[0], p1[1]);
					else 		ctx.lineTo(p1[0], p1[1]);
					lastX = p1[0], lastY = p1[1];
				}
			}
			ctx.stroke();
		}
	},

    polygonToCanvas: function(attr) {       // Полигон в canvas
        if(attr.coords.length === 0) return;
        var gmx = attr.gmx,
            mInPixel = gmx.mInPixel,
            flagPixels = attr.flagPixels || false,
            hiddenLines = attr.hiddenLines || [],
            coords = attr.coords,
            len = coords.length,
            ctx = attr.ctx,
            px = attr.tpx,
            py = attr.tpy,
            cnt = 0, cntHide = 0,
            lastX = null, lastY = null,
            pixels = [], hidden = [];

        ctx.beginPath();
        for (var i = 0; i < len; i++) {
            var lineIsOnEdge = false;
            if(i == hiddenLines[cntHide]) {
                lineIsOnEdge = true;
                cntHide++;
            }
            var p1 = [coords[i][0], coords[i][1]];
            if (!flagPixels) p1 = [p1[0] * mInPixel, p1[1] * mInPixel];
            var p2 = [(0.5 + p1[0] - px) << 0, (0.5 + py - p1[1]) << 0];

            if(lastX !== p2[0] || lastY !== p2[1]) {
                lastX = p2[0], lastY = p2[1];
                ctx[(lineIsOnEdge ? 'moveTo' : 'lineTo')](p2[0], p2[1]);
                if(!flagPixels) {
                    pixels.push([L.Util.formatNum(p1[0], 2), L.Util.formatNum(p1[1], 2)]);
                    if(lineIsOnEdge) hidden.push(cnt);
                }
                cnt++;
            }
        }
        if(cnt === 1) ctx.lineTo(lastX + 1, lastY);
        ctx.stroke();
        return flagPixels ? null : { coords: pixels, hidden: hidden };
    },

    polygonToCanvasFill: function(attr) {     // Polygon fill
        if (attr.coords.length < 3) return;
        var gmx = attr.gmx,
            mInPixel = gmx.mInPixel,
            flagPixels = attr.flagPixels || false,
            coords = attr.coords,
            len = coords.length,
            px = attr.tpx,
            py = attr.tpy,
            ctx = attr.ctx;

        ctx.lineWidth = 0;
        var p1 = flagPixels ? coords[0] : [coords[0][0] * mInPixel, coords[0][1] * mInPixel],
            p2 = [(0.5 + p1[0] - px) << 0, (0.5 + py - p1[1]) << 0];
        ctx.moveTo(p2[0], p2[1]);
        for (var i = 1; i < len; i++) {
            p1 = flagPixels ? coords[i] : [coords[i][0] * mInPixel, coords[i][1] * mInPixel];
            p2 = [(0.5 + p1[0] - px) << 0, (0.5 + py - p1[1]) << 0];
            ctx.lineTo(p2[0], p2[1]);
        }
    },

    labelCanvasContext: null 			// 2dContext canvas для определения размера Label
    ,
    'getLabelSize': function(txt, style)	{			// Получить размер Label
        var out = [0, 0];
        if(style) {
            if(!gmxAPIutils.labelCanvasContext) {
                var canvas = document.createElement('canvas');
                canvas.width = canvas.height = 512;
                gmxAPIutils.labelCanvasContext = canvas.getContext('2d');
            }
            var ptx = gmxAPIutils.labelCanvasContext;
            ptx.clearRect(0, 0, 512, 512);
            
            var size = style.size || 12;
            ptx.font = size + 'px "Arial"';
            ptx.strokeStyle = style.strokeStyle || 'rgba(0, 0, 255, 1)';
            ptx.fillStyle = style.fillStyle || 'rgba(0, 0, 255, 1)';
            ptx.fillText(txt, 0, 0);
            
            out = [ptx.measureText(txt).width, size + 2];
        }
        return out;
    }
	,
	'setLabel': function(txt, attr, parsedStyleKeys) {				// Label в canvas
		var gmx = attr.gmx,
            size = attr.size || 12,
            ctx = attr.ctx;

        ctx.font = size + 'px "Arial"';
        ctx.strokeStyle = parsedStyleKeys.strokeStyle || 'rgba(0, 0, 255, 1)';
		ctx.shadowColor = ctx.strokeStyle;
        ctx.fillStyle = parsedStyleKeys.fillStyle || 'rgba(0, 0, 255, 1)';
		if(ctx.shadowBlur != 4) ctx.shadowBlur = 4;
        
        var p1 = gmxAPIutils.toPixels(attr.coords, attr.tpx, attr.tpy, gmx.mInPixel);
		var extentLabel = parsedStyleKeys.extentLabel;
        ctx.strokeText(txt, p1[0] - extentLabel[0]/2, p1[1]);
        ctx.fillText(txt, p1[0] - extentLabel[0]/2, p1[1]);
        //console.log('setLabel', attr, parsedStyleKeys);
	}
	,'worldWidthMerc': 20037508
	,'r_major': 6378137.000
	,
	deg_rad: function(ang)
	{
		return ang * (Math.PI/180.0);
	},

	distVincenty: function(lon1, lat1, lon2, lat2) {
		var p1 = {
            lon: gmxAPIutils.deg_rad(lon1),
            lat: gmxAPIutils.deg_rad(lat1)
        },
            p2 = {
            lon: gmxAPIutils.deg_rad(lon2),
            lat: gmxAPIutils.deg_rad(lat2)
        },
            a = gmxAPIutils.r_major,
            b = 6356752.3142,
            f = 1/298.257223563;  // WGS-84 ellipsiod

        var L1 = p2.lon - p1.lon,
            U1 = Math.atan((1-f) * Math.tan(p1.lat)),
            U2 = Math.atan((1-f) * Math.tan(p2.lat)),
            sinU1 = Math.sin(U1), cosU1 = Math.cos(U1),
            sinU2 = Math.sin(U2), cosU2 = Math.cos(U2),
            lambda = L1,
            lambdaP = 2*Math.PI,
            iterLimit = 20;
		while (Math.abs(lambda-lambdaP) > 1e-12 && --iterLimit>0) {
				var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda),
                    sinSigma = Math.sqrt((cosU2*sinLambda) * (cosU2*sinLambda) + 
					(cosU1*sinU2-sinU1*cosU2*cosLambda) * (cosU1*sinU2-sinU1*cosU2*cosLambda));
				if (sinSigma == 0) return 0;
				var cosSigma = sinU1*sinU2 + cosU1*cosU2*cosLambda,
                    sigma = Math.atan2(sinSigma, cosSigma),
                    sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma,
                    cosSqAlpha = 1 - sinAlpha*sinAlpha,
                    cos2SigmaM = cosSigma - 2*sinU1*sinU2/cosSqAlpha;
				if (isNaN(cos2SigmaM)) cos2SigmaM = 0;
				var C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
				lambdaP = lambda;
				lambda = L1 + (1-C) * f * sinAlpha *
					(sigma + C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));
		}
		if (iterLimit==0) return NaN

		var uSq = cosSqAlpha * (a*a - b*b) / (b*b),
            A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq))),
            B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq))),
            deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-
				B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM))),
            s = b*A*(sigma-deltaSigma);

		s = s.toFixed(3);
		return s;
	},

	pad2: function(t) {
		return (t < 10) ? ("0" + t) : ("" + t);
	},

	trunc: function(x) {
		return ("" + (Math.round(10000000*x)/10000000 + 0.00000001)).substring(0, 9);
	},

	formatDegrees: function(angle) {
		angle = Math.round(10000000*angle)/10000000 + 0.00000001;
		var a1 = Math.floor(angle);
		var a2 = Math.floor(60*(angle - a1));
		var a3 = gmxAPIutils.pad2(3600*(angle - a1 - a2/60)).substring(0, 2);
		return gmxAPIutils.pad2(a1) + "°" + gmxAPIutils.pad2(a2) + "'" + a3 + '"';
	},

	LatLon_formatCoordinates: function(x, y) {
		return  gmxAPIutils.formatDegrees(Math.abs(y)) + (y > 0 ? " N, " : " S, ") + 
			gmxAPIutils.formatDegrees(Math.abs(x)) + (x > 0 ? " E" : " W");
	},

	formatCoordinates: function(x, y) {
		return  gmxAPIutils.LatLon_formatCoordinates(x, y);
	},

	LatLon_formatCoordinates2: function(x, y) {
		return  gmxAPIutils.trunc(Math.abs(y)) + (y > 0 ? " N, " : " S, ") + 
			gmxAPIutils.trunc(Math.abs(x)) + (x > 0 ? " E" : " W");
	}
	,
	formatCoordinates2: function(x, y) {
		return  gmxAPIutils.LatLon_formatCoordinates2(x, y);
	},
    
    //x, y, z - GeoMixer tile coordinates
    getTileBounds: function(x, y, z) {
        var tileSize = gmxAPIutils.tileSizes[z],
            minx = x * tileSize, 
            miny = y * tileSize;

        return gmxAPIutils.bounds([[minx, miny], [minx + tileSize, miny + tileSize]]);
    }
	,
	forEachPoint: function(coords, callback)
	{
		if (!coords || coords.length == 0) return [];
		if (!coords[0].length)
		{
			if (coords.length == 2)
				return callback(coords);
			else
			{
				var ret = [];
				for (var i = 0; i < coords.length/2; i++)
					ret.push(callback([coords[i*2], coords[i*2 + 1]]));
				return ret;
			}
		}
		else
		{
			var ret = [];
			for (var i = 0; i < coords.length; i++) {
				if(typeof(coords[i]) != 'string') ret.push(this.forEachPoint(coords[i], callback));
			}
			return ret;
		}
	}
	,

	getQuicklookPoints: function(coord)	{		// получить 4 точки привязки снимка
		var d1 = Number.MAX_VALUE;
		var d2 = Number.MAX_VALUE;
		var d3 = Number.MAX_VALUE;
		var d4 = Number.MAX_VALUE;
		var x1, y1, x2, y2, x3, y3, x4, y4;
		this.forEachPoint(coord, function(p)
		{
			var x = p[0];
			var y = p[1];
			if ((x - y) < d1)
			{
				d1 = x - y;
				x1 = p[0];
				y1 = p[1];
			}
			if ((-x - y) < d2)
			{
				d2 = -x - y;
				x2 = p[0];
				y2 = p[1];
			}
			if ((-x + y) < d3)
			{
				d3 = -x + y;
				x3 = p[0];
				y3 = p[1];
			}
			if ((x + y) < d4)
			{
				d4 = x + y;
				x4 = p[0];
				y4 = p[1];
			}
		});
		return {x1: x1, y1: y1, x2: x2, y2: y2, x3: x3, y3: y3, x4: x4, y4: y4};
	}
    ,
    isPointInPolygonArr: function(chkPoint, poly) { // Проверка точки на принадлежность полигону в виде массива
        var isIn = false,
            x = chkPoint[0], 
            y = chkPoint[1],
            p1 = poly[0];
        for (var i = 1, len = poly.length; i < len; i++)
        {
            var p2 = poly[i];
            var xmin = Math.min(p1[0], p2[0]);
            var xmax = Math.max(p1[0], p2[0]);
            var ymax = Math.max(p1[1], p2[1]);
            if (x > xmin && x <= xmax && y <= ymax && p1[0] != p2[0]) {
                var xinters = (x - p1[0])*(p2[1] - p1[1])/(p2[0] - p1[0]) + p1[1];
                if (p1[1] == p2[1] || y <= xinters) isIn = !isIn;
            }
            p1 = p2;
        }
        return isIn;
    }
    ,
    isPointInPolygonWithHoles: function(chkPoint, coords) {
        var flag = false;
        if (!gmxAPIutils.isPointInPolygonArr(chkPoint, coords[0])) return false;
        flag = true;
        for (var j = 1, len = coords.length; j < len; j++) {
            if (gmxAPIutils.isPointInPolygonArr(chkPoint, coords[j])) return false;
        }
        return true;
    },

    isPointInPolyLine: function(chkPoint, lineHeight, coords, hiddenLines) {
        // Проверка точки(с учетом размеров) на принадлежность линии
        var dx = chkPoint[0], dy = chkPoint[1],
            nullPoint = { x: dx, y: dy },
            minx = dx - lineHeight, maxx = dx + lineHeight,
            miny = dy - lineHeight, maxy = dy + lineHeight,
            cntHide = 0;

        lineHeight *= lineHeight;
        for (var i = 1, len = coords.length; i < len; i++) {
            if(hiddenLines && i == hiddenLines[cntHide]) {
                cntHide++;
            } else {
                var p1 = coords[i-1], p2 = coords[i],
                    x1 = p1[0], y1 = p1[1],
                    x2 = p2[0], y2 = p2[1];
                
                if(!(Math.max(x1, x2) < minx
                    || Math.min(x1, x2) > maxx
                    || Math.max(y1, y2) < miny
                    || Math.min(y1, y2) > maxy)) {
                    var sqDist = L.LineUtil._sqClosestPointOnSegment(nullPoint, { x: x1, y: y1 }, { x: x2, y: y2 }, true);
                    if(sqDist < lineHeight) {
                        return true;
                    }
                }
            }
        }
        return false;
    },

    isPointInLines: function (attr) {
        var arr = attr.coords,
            point = attr.point,
            delta = attr.delta,
            boundsArr = attr.boundsArr,
            hidden = attr.hidden;
        for (var j = 0, len = arr.length, flag = false; j < len; j++) {
            flag = boundsArr[j] ? boundsArr[j].contains(point) : true;
            if (flag
                && gmxAPIutils.isPointInPolyLine(point, delta, arr[j], hidden ? hidden[j] : null)
            ) {
               return true;
            }
        }
        return false;
    },

    getLength: function(latlngs) {
        var length = 0;
        if (latlngs && latlngs.length) {
            var lng = false, lat = false;
            latlngs.forEach(function(latlng) {
                if (lng !== false && lat !== false)
                    length += parseFloat(gmxAPIutils.distVincenty(lng, lat, latlng.lng, latlng.lat));
                lng = latlng.lng;
                lat = latlng.lat;
            });
        }
        return length;
    },

    prettifyDistance: function(length, type) {
        var km = ' ' + L.gmxLocale.getText('units.km');
        if (type === 'km')
            return (Math.round(length)/1000) + km;
        if (length < 2000 || type === 'm')
            return Math.round(length) + ' ' + L.gmxLocale.getText('units.m');
        if (length < 200000)
            return (Math.round(length/10)/100) + km;
        return Math.round(length/1000) + km;
    },

    getArea: function(arr) {
        var area = 0;
        for(var i=0, len = arr.length; i<len; i++) {
            var ipp = (i == (len - 1) ? 0 : i + 1),
                p1 = arr[i], p2 = arr[ipp];
            area += p1.lng * Math.sin(gmxAPIutils.deg_rad(p2.lat)) - p2.lng * Math.sin(gmxAPIutils.deg_rad(p1.lat));
        }
        var out = Math.abs(area * gmxAPIutils.lambertCoefX * gmxAPIutils.lambertCoefY/2);
        return out;
    },

    prettifyArea: function(area, type) {
        var km2 = ' ' + L.gmxLocale.getText('units.km2');

        if (type === 'km2')
            return ("" + (Math.round(area/100)/10000)) + km2;
        if (type === 'ha')
            return ("" + (Math.round(area/100)/100)) + ' ' + L.gmxLocale.getText('units.ha');

        if (area < 100000 || type === 'm2')
            return Math.round(area) + ' ' + L.gmxLocale.getText('units.m2');
        if (area < 3000000)
            return ("" + (Math.round(area/1000)/1000)).replace(".", ",") + km2;
        if (area < 30000000)
            return ("" + (Math.round(area/10000)/100)).replace(".", ",") + km2;
        if (area < 300000000)
            return ("" + (Math.round(area/100000)/10)).replace(".", ",") + km2;
        return (Math.round(area/1000000)) + km2;
    },

    geoLength: function(geom) {
        var ret = 0;
        if (geom.type == "MULTILINESTRING") {
            for (var i = 0, len = geom.coordinates.length; i < len; i++)
                ret += gmxAPIutils.geoLength({ type: "LINESTRING", coordinates: geom.coordinates[i] });
            return ret;
        } else if (geom.type == "LINESTRING") {
            ret = gmxAPIutils(geom.coordinates[0]);
            for (var i = 1; i < geom.coordinates.length; i++)
                ret -= gmxAPIutils.geoLength(geom.coordinates[i]);
            return ret;
        }
        else if (geom.length)
        {
            var latlngs = [];
            //gmxAPIutils.forEachPoint(geom, function(p) { pts.push(p); });
            return gmxAPIutils.getLength(latlngs);
        }
        else
            return 0;
    },

    geometryToGeoJSON: function (geom) {
        return L.GeoJSON.asFeature({
            type: geom.type === 'MULTIPOLYGON' ? 'MultiPolygon'
                : geom.type === 'POLYGON' ? 'Polygon'
                : geom.type === 'MULTILINESTRING' ? 'MultiLineString'
                : geom.type === 'LINESTRING' ? 'LineString'
                : geom.type === 'MULTIPOINT' ? 'MultiPoint'
                : geom.type === 'POINT' ? 'Point'
                : geom.type,
            coordinates: geom.coordinates
        });
    },

    geoArea: function(geom) {
        var ret = 0;
        if (geom.type == "MULTIPOLYGON") {
            for (var i = 0, len = geom.coordinates.length; i < len; i++)
                ret += gmxAPIutils.geoArea({ type: "POLYGON", coordinates: geom.coordinates[i] });
            return ret;
        } else if (geom.type == "POLYGON") {
            ret = gmxAPIutils.geoArea(geom.coordinates[0]);
            for (var i = 1; i < geom.coordinates.length; i++)
                ret -= gmxAPIutils.geoArea(geom.coordinates[i]);
            return ret;
        }
        else if (geom.length)
        {
            var latlngs = [];
            gmxAPIutils.forEachPoint(geom, function(p) {
                latlngs.push(L.Projection.Mercator.unproject({y: p[1], x: p[0]}));
            });
            return gmxAPIutils.getArea(latlngs);
        }
        else
            return 0;
    },

    getGeometriesSummary: function(arr, units) {
        var out = '',
            type = '',
            res = 0;
        arr.forEach(function(geom) {
            if(geom) {
                type = geom.type;
                if (type.indexOf("POINT") != -1) {
                    var latlng = L.Projection.Mercator.unproject({y: geom.coordinates[1], x: geom.coordinates[0]});
                    out = '<b>' + L.gmxLocale.getText('Coordinates') + '</b>: '
                        + gmxAPIutils.formatCoordinates(latlng.lng, latlng.lat);
                } else if (type.indexOf("LINESTRING") != -1) {
                    res += gmxAPIutils.geoLength(geom);
                } else if (type.indexOf("POLYGON") != -1) {
                    res += gmxAPIutils.geoArea(geom);
                }
            }
        });
        if (!out) {
            if (type.indexOf("LINESTRING") != -1) {
                out = '<b>' + L.gmxLocale.getText('Length') + '</b>: '
                    + gmxAPIutils.prettifyDistance(res, units.length);
            } else if (type.indexOf("POLYGON") != -1) {
                out = '<b>' + L.gmxLocale.getText('Area') + '</b>: '
                    + gmxAPIutils.prettifyArea(res, units.square);
            }
        }
        return out;
    },

    getGeometrySummary: function(geom, units) {
        return gmxAPIutils.getGeometriesSummary([geom], units);
    }
}

gmxAPIutils.lambertCoefX = 100*gmxAPIutils.distVincenty(0, 0, 0.01, 0);				// 111319.5;
gmxAPIutils.lambertCoefY = 100*gmxAPIutils.distVincenty(0, 0, 0, 0.01)*180/Math.PI;	// 6335440.712613423;

!function() {
    //pre-calculate tile sizes
    for (var z = 0; z < 30; z++) {
        gmxAPIutils.tileSizes[z] = 40075016.685578496 / Math.pow(2, z);
    }
}()

L.LineUtil.getLength = gmxAPIutils.getLength;
L.LineUtil.prettifyDistance = gmxAPIutils.prettifyDistance;

L.PolyUtil.getArea = gmxAPIutils.getArea;
L.PolyUtil.prettifyArea = gmxAPIutils.prettifyArea;


L.Util.formatCoordinates = function (latlng, type) {
    return gmxAPIutils['formatCoordinates' + (type ? '2' : '')](latlng.lng, latlng.lat);
};
L.Util.geoArea = gmxAPIutils.geoArea;
L.Util.getGeometrySummary = gmxAPIutils.getGeometrySummary;
L.Util.getGeometriesSummary = gmxAPIutils.getGeometriesSummary;

!function() {

    //скопирована из API для обеспечения независимости от него
    function parseUri(str)
    {
        var	o   = parseUri.options,
            m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
            uri = {},
            i   = 14;

        while (i--) uri[o.key[i]] = m[i] || "";

        uri[o.q.name] = {};
        uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
            if ($1) uri[o.q.name][$1] = $2;
        });

        uri.hostOnly = uri.host;
        uri.host = uri.authority; // HACK

        return uri;
    };

    parseUri.options = {
        strictMode: false,
        key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
        q:   {
            name:   "queryKey",
            parser: /(?:^|&)([^&=]*)=?([^&]*)/g
        },
        parser: {
            strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
            loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
        }
    };

    var requests = {};
    var lastRequestId = 0;
    
    var processMessage = function(e) {

        if (!(e.origin in requests)) {
            return;
        }
        
        var dataStr = decodeURIComponent(e.data.replace(/\n/g,'\n\\'));
        try {
            var dataObj = JSON.parse(dataStr);
        } catch (e) {
            request.callback && request.callback({Status:"error", ErrorInfo: {ErrorMessage: "JSON.parse exeption", ExceptionType: "JSON.parse", StackTrace: dataStr}});
        }
        var request = requests[e.origin][dataObj.CallbackName];
        if(!request) return;    // message от других запросов
        
        delete request[dataObj.CallbackName];
        delete dataObj.CallbackName;

        if(request.iframe.parentNode) request.iframe.parentNode.removeChild(request.iframe);
        request.callback && request.callback(dataObj);
    }
    
    L.DomEvent.on(window, 'message', processMessage);

    function createPostIframe2(id, callback, url)
    {
        var uniqueId = 'gmxAPIutils_id'+(lastRequestId++);
        
        iframe = L.DomUtil.create('iframe');
        iframe.style.display = 'none';
        iframe.setAttribute('id', id);
        iframe.setAttribute('name', id);
        iframe.src = 'javascript:true';
        iframe.callbackName = uniqueId;
        
        var parsedURL = parseUri(url);
        var origin = (parsedURL.protocol ? (parsedURL.protocol + ':') : window.location.protocol) + '//' + (parsedURL.host || window.location.host);
        
        requests[origin] = requests[origin] || {};
        requests[origin][uniqueId] = {callback: callback, iframe: iframe};

        return iframe;
    }
    
	//расширяем namespace
    gmxAPIutils.createPostIframe2 = createPostIframe2;

}();

// кроссдоменный POST запрос
(function()
{
	/** Посылает кроссдоменный POST запрос
	* @namespace utilities
    * @ignore
	* @function
	* 
	* @param url {string} - URL запроса
	* @param params {object} - хэш параметров-запросов
	* @param callback {function} - callback, который вызывается при приходе ответа с сервера. Единственный параметр ф-ции - собственно данные
	* @param baseForm {DOMElement} - базовая форма запроса. Используется, когда нужно отправить на сервер файл. 
	*                                В функции эта форма будет модифицироваться, но после отправления запроса будет приведена к исходному виду.
	*/
	function sendCrossDomainPostRequest(url, params, callback, baseForm)
	{
        var form,
            id = '$$iframe_' + gmxAPIutils.newId();

        var iframe = gmxAPIutils.createPostIframe2(id, callback, url),
            originalFormAction;
            
        if (baseForm)
        {
            form = baseForm;
            originalFormAction = form.getAttribute('action');
            form.setAttribute('action', url);
            form.target = id;
        }
        else
        {
            if(L.Browser.ielt9) {
                var str = '<form id=' + id + '" enctype="multipart/form-data" style="display:none" target="' + id + '" action="' + url + '" method="post"></form>';
                form = document.createElement(str);
            } else {
                form = document.createElement("form");
                form.style.display = 'none';
                form.setAttribute('enctype', 'multipart/form-data');
                form.target = id;
                form.setAttribute('method', 'POST');
                form.setAttribute('action', url);
                form.id = id;
            }
        }
        
        var hiddenParamsDiv = document.createElement("div");
        hiddenParamsDiv.style.display = 'none';
        
        if (params.WrapStyle === 'window') {
            params.WrapStyle = 'message';
        }
        
        if (params.WrapStyle === 'message') {
            params.CallbackName = iframe.callbackName;
        }
        
        for (var paramName in params)
        {
            var input = document.createElement("input");
            
            var value = typeof params[paramName] !== 'undefined' ? params[paramName] : '';
            
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', paramName);
            input.setAttribute('value', value);
            
            hiddenParamsDiv.appendChild(input)
        }
        
        form.appendChild(hiddenParamsDiv);
        
        if (!baseForm)
            document.body.appendChild(form);
            
        document.body.appendChild(iframe);
        
        form.submit();
        
        if (baseForm)
        {
            form.removeChild(hiddenParamsDiv);
            if (originalFormAction !== null)
                form.setAttribute('action', originalFormAction);
            else
                form.removeAttribute('action');
        }
        else
        {
            form.parentNode.removeChild(form);
        }
	}
	//расширяем namespace
	gmxAPIutils.sendCrossDomainPostRequest = sendCrossDomainPostRequest;
})();
