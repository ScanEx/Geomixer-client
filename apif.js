/* ======================================================================
    APICore.js
   ====================================================================== */

/** Пространство имён GeoMixer API
* @name gmxAPI
* @namespace
*/

/** Описание API JS 
* @name api
* @namespace
*/

(function()
{

var memoize = function(func) {
	var called = false;
	var result;
	return function()
	{
		if (!called)
		{
			result = func();
			called = true;
		}
		return result;
	}
};
var extend = function(ph, pt, flag) {
    if(!ph) ph = {};
	for(var key in pt) {
        if(flag && ph[key]) continue;
		ph[key] = pt[key];
	}
    return ph;
};

window.PI = 3.14159265358979; //устарело - обратная совместимость
if(!window.gmxAPI) window.gmxAPI = {};
window.gmxAPI.extend = extend;
extend(window.gmxAPI,
{
	kosmosnimki_API: '1D30C72D02914C5FB90D1D448159CAB6'
    ,
	_tmpMaps: {}
    ,
	MAX_LATITUDE: 85.0840591556
    ,
	origin: window.document.domain
    ,
    defaultMinZoom: 1							// мин.zoom по умолчанию
	,
    defaultMaxZoom: 24							// макс.zoom по умолчанию
	,
    mousePressed: false							// Флаг мышь нажата
	,
    APILoaded: false							// Флаг возможности использования gmxAPI сторонними модулями
	,
    initParams: null							// Параметры заданные при создании карты 
	,
    buildGUID: ["02d3fb70bb0e11e3a63d1c6f65874c73"][0]		// GUID текущей сборки
	,
    leafletPlugins: {}
    ,
    _getEdgeIntersection: function (a, b, code, bounds) {
        var dx = b[0] - a[0],
            dy = b[1] - a[1],
            min = bounds.min,
            max = bounds.max;

        if (code & 8) { // top
            return [a[0] + dx * (max.y - a[1]) / dy, max.y];
        } else if (code & 4) { // bottom
            return [a[0] + dx * (min.y - a[1]) / dy, min.y];
        } else if (code & 2) { // right
            return [max.x, a[1] + dy * (max.x - a[0]) / dx];
        } else if (code & 1) { // left
            return [min.x, a[1] + dy * (min.x - a[0]) / dx];
        }
    },
    _getBitCode: function (p, bounds) {
        var code = 0;

        if (p[0] < bounds.min.x) { // left
            code |= 1;
        } else if (p[0] > bounds.max.x) { // right
            code |= 2;
        }
        if (p[1] < bounds.min.y) { // bottom
            code |= 4;
        } else if (p[1] > bounds.max.y) { // top
            code |= 8;
        }

        return code;
    },
    clipPolygonByBounds: function (points, bounds) {
        var clippedPoints,
            edges = [1, 4, 2, 8],
            i, j, k,
            a, b,
            len, edge, p;

        for (i = 0, len = points.length; i < len; i++) {
            points[i][3] = gmxAPI._getBitCode(points[i], bounds);
        }

        // for each edge (left, bottom, right, top)
        for (k = 0; k < 4; k++) {
            edge = edges[k];
            clippedPoints = [];

            for (i = 0, len = points.length, j = len - 1; i < len; j = i++) {
                a = points[i];
                b = points[j];

                // if a is inside the clip window
                if (!(a[3] & edge)) {
                    // if b is outside the clip window (a->b goes out of screen)
                    if (b[3] & edge) {
                        p = gmxAPI._getEdgeIntersection(b, a, edge, bounds);
                        p[3] = gmxAPI._getBitCode(p, bounds);
                        clippedPoints.push(p);
                    }
                    clippedPoints.push(a);

                // else if b is inside the clip window (a->b enters the screen)
                } else if (!(b[3] & edge)) {
                    p = gmxAPI._getEdgeIntersection(b, a, edge, bounds);
                    p[3] = gmxAPI._getBitCode(p, bounds);
                    clippedPoints.push(p);
                }
            }
            points = clippedPoints;
        }

        return points;
    },
    clipImageByPolygon: function(attr) {       // Polygon fill
        if (attr.bgImage && attr.geom.type.indexOf('POLYGON') !== -1) {
            var mInPixel = attr.mInPixel,
                geom = attr.geom,
                coords = geom.coordinates,
                px = attr.tpx,
                py = attr.tpy,
                ctx = attr.ctx;
                ctx.fillStyle = ctx.createPattern(attr.bgImage, "no-repeat");
            if (geom.type === 'POLYGON') coords = [coords];
            for (var i = 0, len = coords.length; i < len; i++) {
                var coords1 = coords[i][0];    // POLYGON без HELLS
                for (var k = 0, len2 = coords1.length; k < len2; k++) {
                    var x = (0.5 + coords1[k][0] * mInPixel - px) << 0,
                        y = (0.5 + py - coords1[k][1] * mInPixel) << 0;
                    ctx[(k === 0 ? 'moveTo' : 'lineTo')](x, y);
                }
            }
            ctx.fill();
        }
        return true;
    }
    ,
    loadJS: function(item, callback, callbackError) {
        var script = document.createElement("script");
        script.setAttribute("charset", "windows-1251");
        script.setAttribute("src", item.src);
        item.readystate = 'loading';
        script.onload = function(ev) {
            var count = 0;
            if(item.count) count = item.count--;
            if(count === 0) item.readystate = 'loaded';
            if(item.callback) item.callback(item);
            document.getElementsByTagName("head").item(0).removeChild(script);
        };
        script.onerror = function(ev) {
            item.readystate = 'error';
            if(item.callbackError) item.callbackError(item);
            document.getElementsByTagName("head").item(0).removeChild(script);
        };
        document.getElementsByTagName("head").item(0).appendChild(script);
	}
	,
    loadCSS: function(href) {
        var css = document.createElement("link");
        css.setAttribute("type", "text/css");
        css.setAttribute("rel", "stylesheet");
        css.setAttribute("media", "screen");
        css.setAttribute("href", href);
        document.getElementsByTagName("head").item(0).appendChild(css);
	}
    ,
    getURLParams: memoize(function() {
        var q = window.location.search,
            kvp = (q.length > 1) ? q.substring(1).split("&") : [];

        for (var i = 0; i < kvp.length; i++)
        {
            kvp[i] = kvp[i].split("=");
        }
        
        var params = {},
            givenMapName = false;
            
        for (var j=0; j < kvp.length; j++)
        {
            if (kvp[j].length == 1)
            {
                if (!givenMapName)
                    givenMapName = kvp[j][0];
            }
            else
                params[kvp[j][0]] = kvp[j][1];
        }
        
        return {params: params, givenMapName: givenMapName};
    })
    ,
    getHtmlColor: function() {     // Получить цвет текста по map.backgroundColor
        var color = gmxAPI.map.backgroundColor;
        return (0xff & (color >> 16)) > 80 ? "black" : "white";
    }
    ,
    getCoordinatesText: function(currPos, coordFormat) {
        if(!currPos) currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
        var x = (currPos.latlng ? currPos.latlng.x : gmxAPI.from_merc_x(currPos.x));
        var y = (currPos.latlng ? currPos.latlng.y : gmxAPI.from_merc_y(currPos.y));
        if (x > 180) x -= 360;
        if (x < -180) x += 360;
        if (coordFormat % 3 == 0)
            return gmxAPI.LatLon_formatCoordinates(x, y);
        else if (coordFormat % 3 == 1)
            return gmxAPI.LatLon_formatCoordinates2(x, y);
        else
            return '' + Math.round(gmxAPI.merc_x(x)) + ', ' + Math.round(gmxAPI.merc_y(y));
    }
    ,
    getScaleBarDistance: function() {
        var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
        var z = Math.round(currPos.z);
        var x = (currPos.latlng ? currPos.latlng.x : 0);
        var y = (currPos.latlng ? currPos.latlng.y : 0);
        if(gmxAPI.map.needMove) {
            z = gmxAPI.map.needMove.z;
            x = gmxAPI.map.needMove.x;
            y = gmxAPI.map.needMove.y;
        }

        var metersPerPixel = gmxAPI.getScale(z) * gmxAPI.distVincenty(x, y, gmxAPI.from_merc_x(gmxAPI.merc_x(x) + 40), gmxAPI.from_merc_y(gmxAPI.merc_y(y) + 30))/50;
        for (var i = 0; i < 30; i++)
        {
            var distance = [1, 2, 5][i%3]*Math.pow(10, Math.floor(i/3));
            var w = Math.floor(distance/metersPerPixel);
            if (w > 100)
            {
                return {txt: gmxAPI.prettifyDistance(distance), width: w};
            }
        }
        return null;
    }
    ,
	'getXmlHttp': function() {
		var xmlhttp;
		if (typeof XMLHttpRequest != 'undefined') {
			xmlhttp = new XMLHttpRequest();
		}
		if (!xmlhttp) {
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
	}
	,
	'request': function(ph) {	// {'type': 'GET|POST', 'url': 'string', 'callback': 'func'}
	  try {
		var xhr = gmxAPI.getXmlHttp();
		xhr.open((ph['type'] ? ph['type'] : 'GET'), ph['url'], true);
		xhr.withCredentials = true;
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if(xhr.status == 200) {
					ph['callback'](xhr.responseText);
					xhr = null;
				}
			}
		};
		xhr.send((ph['params'] ? ph['params'] : null));
		return xhr.status;
	  } catch (e) {
		if(ph['onError']) ph['onError'](xhr.responseText);
		return e.description; // turn all errors into empty results
	  }
	}
	,
	'createMap': function(div, ph)
	{
		var hostName = ph['hostName'] || getAPIHost();
		var mapName = ph['mapName'] || 'DefaultMap';
		var callback = ph['callback'] || function(){};
		gmxAPI.initParams = ph;
		createFlashMap(div, hostName, mapName, callback);
		return true;
	}
	,
	'getSQLFunction':	function(sql)	{					// Получить функцию по SQL выражению
		return (gmxAPI.Parsers ? gmxAPI.Parsers.parseSQL(sql) : null);
	}
	,
	'parseSQL': function(sql)	{							// парсинг SQL строки
		var zn = sql;
		if(typeof(zn) === 'string') {
			zn = zn.replace(/ AND /g, ' && ');
		}
		return zn
	}
	,
	'chkPropsInString': function(str, prop, type)	{							// парсинг значений свойств в строке
		var zn = str;
		if(typeof(zn) === 'string') {
			var reg = (type ? /\"([^\"]+)\"/i : /\[([^\]]+)\]/i);
			var matches = reg.exec(zn);
			while(matches && matches.length > 1) {
				zn = zn.replace(matches[0], prop[matches[1]]);
				matches = reg.exec(zn);
			}
			zn = eval(zn);
		}
		return zn
	}
	,
	clone: function (o, level)
	{
		if(!level) level = 0;
		var type = typeof(o);
		if(!o || type !== 'object')  {
			return (type === 'function' ? 'function' : o);
		}
		var c = 'function' === typeof(o.pop) ? [] : {};
		var p, v;
		for(p in o) {
			if(o.hasOwnProperty(p)) {
				v = o[p];
				var type = typeof(v);
				if(v && type === 'object') {
					c[p] = (level < 100 ? gmxAPI.clone(v, level + 1) : 'object');
				}
				else {
					c[p] = (type === 'function' ? 'function' : v);
				}
			}
		}
		return c;
	}
	,
	KOSMOSNIMKI_LOCALIZED: function (rus, eng)
	{
		return (window.KOSMOSNIMKI_LANGUAGE == "English") ? eng : rus;
	}
	,
	setStyleHTML: function(elem, style, setBorder)
	{
		if(!elem) return false;
		if(setBorder) {
			elem.style.border = 0;
			elem.style.margin = 0;
			elem.style.padding = 0;
		}
		if (style)
		{
			for (var key in style)
			{
				var value = style[key];
				elem.style[key] = value;
				if (key == "opacity") elem.style.filter = "alpha(opacity=" + Math.round(value*100) + ")";
			}
		}
		return true;
	}
	,
	newElement: function(tagName, props, style, setBorder)
	{
		var elem = document.createElement(tagName);
		if (props)
		{
			for (var key in props) elem[key] = props[key];
		}
		gmxAPI.setStyleHTML(elem, style, setBorder);
		return elem;
	},
	newStyledDiv: function(style)
	{
		return gmxAPI.newElement("div", false, style, true);
	},
	newSpan: function(innerHTML)
	{
		return gmxAPI.newElement("span", { innerHTML: innerHTML }, null, true);
	},
	newDiv: function(className, innerHTML)
	{
		return gmxAPI.newElement("div", { className: className, innerHTML: innerHTML }, null, true);
	},
    'domEventUtil': {
        addHandler: function(element, type, handler, capturing) {
            if (element.addEventListener) {
                element.addEventListener(type, handler, capturing ? true : false);
            } else if (element.attachEvent) {
                element.attachEvent("on" + type, handler);
            } else {
                element["on" + type] = handler;
            }
        },
        removeHandler: function(element, type, handler) {
            if (element.removeEventListener) {
                element.removeEventListener(type, handler, capturing ? true : false);
            } else if (element.detachEvent) {
                element.detachEvent("on" + type, handler);
            } else {
                element["on" + type] = null;
            }
        }
    }
    ,
	makeImageButton: function(url, urlHover)
	{
		var btn = document.createElement("img");
		btn.setAttribute('src',url)
		btn.style.cursor = 'pointer';
		btn.style.border = 'none';
		
		if (urlHover)
		{
			btn.onmouseover = function()
			{
				this.setAttribute('src', urlHover);
			}
			btn.onmouseout = function()
			{
				this.setAttribute('src', url);
			}
		}
		
		return btn;
	},
	applyTemplate: function(template, properties)
	{
		return template.replace(/\[([a-zA-Z0-9_а-яА-Я ]+)\]/g, function()
		{
			var value = properties[arguments[1]];
			if (value != undefined)
				return "" + value;
			else
				return "[" + arguments[1] + "]";
		});
	},
	getIdentityField: function(obj)
	{
		if(!obj || !obj.parent) return 'ogc_fid';
		if(obj.properties && obj.properties.identityField) return obj.properties.identityField;
		return gmxAPI.getIdentityField(obj.parent);
	},
	swfWarning: function(attr)
	{
		if(typeof(attr) == 'object') {				// отложенные команды от отрисовщика
			if(attr.length > 0) {					// массив команд
				for (var i = 0; i < attr.length; i++) {
					var ph = attr[i];
					if(!ph.func || !window[ph.func]) continue;
					if(ph.eventType === 'observeVectorLayer') {
						window[ph.func](ph.geometry, ph.properties, ph.flag);
					}
				}
			} else if(attr.eventType === 'chkLayerVersion') {		// сигнал о необходимости проверки версии слоя
				var chkLayer = gmxAPI.mapNodes[attr.layerID] || false;
				if(chkLayer && gmxAPI._layersVersion) {
					gmxAPI._layersVersion.chkLayerVersion(chkLayer);
				}
			}	
		} else {
			gmxAPI._debugWarnings.push(attr);
		}
	},
	addDebugWarnings: function(attr)
	{
		if(!window.gmxAPIdebugLevel) return;
		if(!attr.script) attr.script = 'api.js';
		if(attr.event && attr.event.lineNumber) attr.lineNumber = attr.event.lineNumber;
		gmxAPI._debugWarnings.push(attr);
		if(attr.alert) {
            if(window.gmxAPIdebugLevel === 10) alert(attr.alert);
            else if(window.gmxAPIdebugLevel === 9) console.log(attr);
            else if(window.gmxAPIdebugLevel === 11 && attr.event) throw attr.event;
       }
	},
	_debugWarnings: [],
	//isIE: (navigator.appName.indexOf("Microsoft") != -1),
	isIE: 'ActiveXObject' in window,
	isIElt9: gmxAPI.isIE && !document.addEventListener,
	isChrome: (navigator.userAgent.toLowerCase().indexOf("chrome") != -1),
	isSafari: (navigator.userAgent.toLowerCase().indexOf("safari") != -1),
	show: function(div)
	{
		div.style.visibility = "visible";
		div.style.display = "block";
	}
	,
	hide: function(div)
	{
		div.style.visibility = "hidden";
		div.style.display = "none";
	},
    getTextContent: function(node)
    {
        if (typeof node.textContent != 'undefined')
            return node.textContent;
        
        var data = '';
        for (var i = 0; i < node.childNodes.length; i++)
            data += node.childNodes[i].data;
        
        return data;
    }
	,
	parseXML: function(str)
	{
		var xmlDoc;
		try
		{
			if (window.DOMParser)
			{
				parser = new DOMParser();
				xmlDoc = parser.parseFromString(str,"text/xml");
			}
			else // Internet Explorer
			{
				xmlDoc = new ActiveXObject("MSXML2.DOMDocument.3.0");
				xmlDoc.validateOnParse = false;
				xmlDoc.async = false;
				xmlDoc.loadXML(str);
			}
		}
		catch(e)
		{
			gmxAPI.addDebugWarnings({'func': 'parseXML', 'str': str, 'event': e, 'alert': e});
		}
		
		return xmlDoc;
	}
	,
	setPositionStyle: function(div, attr)
	{
		for(var key in attr) div.style[key] = attr[key];
	}
	,
	position: function(div, x, y)
	{
		div.style.left = x + "px";
		div.style.top = y + "px";
	}
	,
	bottomPosition: function(div, x, y)
	{
		div.style.left = x + "px";
		div.style.bottom = y + "px";
	}
	,
	size: function(div, w, h)
	{
		div.style.width = w + "px";
		div.style.height = h + "px";
	}
	,
	positionSize: function(div, x, y, w, h)
	{
		gmxAPI.position(div, x, y);
		gmxAPI.size(div, w, h);
	}
	,
	setVisible: function(div, flag)
	{
		(flag ? gmxAPI.show : gmxAPI.hide)(div);
	}
	,
	setBg: function(t, imageName)
	{
		if (gmxAPI.isIE)
			t.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + imageName + "',sizingMethod='scale')";
		else
			t.style.backgroundImage = "url('" + imageName + "')";
	}
	,
	deselect: function()
	{
		if (window.disableDeselect)
			return;
		if(document.selection && document.selection.empty) 
			try { document.selection.empty(); } catch (e) {
				gmxAPI.addDebugWarnings({'func': 'deselect', 'event': e, 'alert': e});
			}
	}
	,
	compatEvent: function(event)
	{
		return event || window.event;
	}
	,
	stopEvent: function(ev)
	{
		var event = gmxAPI.compatEvent(ev);
		if(!event) return false;
		
		if (event.stopPropagation) event.stopPropagation();
		else if (event.preventDefault) event.preventDefault(); 
		event.cancelBubble = true;
		event.cancel = true;
		event.returnValue = false;
		return true;
	}
	,
	compatTarget: function(event)
	{
		if (!event) event = window.event;
		return (event.srcElement != null) ? event.srcElement : event.target;
	}
	,
	isInNode: function(prntNode, node)
	{
		var i = 0;
		var chkNode = node;
		while (i < 1000 && chkNode)
		{
			if(chkNode.tagName === 'HTML') return false;
			if(chkNode === prntNode) return true;
			i++;
			chkNode = chkNode.parentNode;
		}
		return false;
	}
	,
	eventX: function(event)
	{
		var theLeft = (document.documentElement && document.documentElement.scrollLeft ?
			document.documentElement.scrollLeft :
			document.body.scrollLeft);
		return gmxAPI.compatEvent(event).clientX + theLeft;
	}
	,
	eventY: function(event)
	{
		var theTop = (document.documentElement && document.documentElement.scrollTop ?
			document.documentElement.scrollTop :
			document.body.scrollTop);
		return gmxAPI.compatEvent(event).clientY + theTop;
	}
	,
	contDivPos: null		// позиция основного контейнера
	,
	getOffsetLeft: function(div)
	{
		var ret = 0;
		while (div && div.tagName != 'HTML')
		{
		ret += div.offsetLeft;
		div = div.offsetParent;
		}
		return ret;
	}
	,
	getOffsetTop: function(div)
	{
		var ret = 0;
		while (div && div.tagName != 'HTML')
		{
		ret += div.offsetTop;
		div = div.offsetParent;
		}
		return ret;
	}
	,
	strip: function(s)
	{
		return s.replace(/^\s*/, "").replace(/\s*$/, "");
	}
	,
	parseColor: function(str)
	{
		var res = 0xffffff;
		if (!str)
			return res;
		else
		{
			var components = str.split(" ");
			if (components.length == 1)
				return parseInt("0x" + str);
			else if (components.length == 3)
				return parseInt(components[0])*0x10000 + parseInt(components[1])*0x100 + parseInt(components[2]);
			else
				return res;
		}
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
				if(typeof(coords[i]) != 'string') ret.push(gmxAPI.forEachPoint(coords[i], callback));
			}
			return ret;
		}
	}
	,
	transformGeometry: function(geom, callbackX, callbackY)
	{
		return !geom ? geom : { 
			type: geom.type, 
			coordinates: gmxAPI.forEachPoint(geom.coordinates, function(p) 
			{ 
				return [callbackX(p[0]), callbackY(p[1])];
			})
		}
	}
	,
	merc_geometry: function(geom)
	{
		return (geom ? gmxAPI.transformGeometry(geom, gmxAPI.merc_x, gmxAPI.merc_y) : null);
	}
	,
	from_merc_geometry: function(geom)
	{
		return (geom ? gmxAPI.transformGeometry(geom, gmxAPI.from_merc_x, gmxAPI.from_merc_y) : null);
	}
    ,
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
            intersects: function (bounds, dx, dy) { // (Bounds, dx, dy) -> Boolean
                var min = this.min,
                    max = this.max,
                    dx = dx || 0,
                    dy = dy || 0,
                    min2 = bounds.min,
                    max2 = bounds.max;
                return max2.x + dx >= min.x && min2.x - dx <= max.x && max2.y + dy >= min.y && min2.y - dy <= max.y;
            }
        };
        
        return res.extendArray(arr);
    }
    ,
    'geoBounds': function(geo) {					// получить bounds по geometry
        var type = geo['type'];
        var coords = geo['coordinates'];
        var arr = [];
        var addToArr = function(pol) {
            for (var i = 0, len = pol.length; i < len; i++)	arr.push(pol[i]);
        }
        if(type === 'POINT') {
            arr.push(coords);
        } else if(type === 'MULTIPOINT') {
            for (var i = 0, len = coords.length; i < len; i++) addToArr(coords[i]);
        } else if(type === 'LINESTRING') {
            addToArr(coords);
        } else if(type === 'MULTILINESTRING') {
            for (var i = 0, len = coords.length; i < len; i++) addToArr(coords[i]);
        } else if(type === 'POLYGON') {
            addToArr(coords[0]);			// дырки пропускаем
        } else if(type === 'MULTIPOLYGON') {
            for (var i = 0, len = coords.length; i < len; i++) addToArr(coords[i][0]);
        }
        return gmxAPI.bounds(arr);
    }
	,
	getBounds: function(coords)
	{
		var ret = { 
			minX: 100000000, 
			minY: 100000000, 
			maxX: -100000000, 
			maxY: -100000000,
			update: function(data)
			{
				gmxAPI.forEachPoint(data, function(p)
				{
					ret.minX = Math.min(p[0], ret.minX);
					ret.minY = Math.min(p[1], ret.minY);
					ret.maxX = Math.max(p[0], ret.maxX);
					ret.maxY = Math.max(p[1], ret.maxY);
				});
			}
		}
		if (coords)
			ret.update(coords);
		return ret;
	}
	,
	getTileExtent: function(x, y, z)	// получить extent тайла
	{
		var pz = Math.pow(2, z);
		var tileSize = 256 * 156543.033928041 / pz;
		var minx = x * tileSize;
		var miny = y * tileSize;
		var ext = gmxAPI.getBounds([[minx, miny], [minx + tileSize, miny + tileSize]]);
		return ext;
	}
	,
	boundsIntersect: function(b1, b2)	// в api.js не используется
	{
		return ((b1.minX < b2.maxX) && (b1.minY < b2.maxY) && (b2.minX < b1.maxX) && (b2.minY < b1.maxY));
	}
	,
	extIntersect: function(ext1, ext2)
	{
		return (ext1.maxX < ext2.minX || ext1.minX > ext2.maxX || ext1.maxY < ext2.minY || ext1.minY > ext2.maxY ? false : true);
	}
	,
	isRectangle: function(coords)
	{
		return (coords && coords[0] && coords[0].length == 5
			&& coords[0][4][0] == coords[0][0][0] && coords[0][4][1] == coords[0][0][1]
			&& ((coords[0][0][0] == coords[0][1][0]) || (coords[0][0][1] == coords[0][1][1]))
			&& ((coords[0][1][0] == coords[0][2][0]) || (coords[0][1][1] == coords[0][2][1]))
			&& ((coords[0][2][0] == coords[0][3][0]) || (coords[0][2][1] == coords[0][3][1]))
			&& ((coords[0][3][0] == coords[0][4][0]) || (coords[0][3][1] == coords[0][4][1]))
		);
	}
	,
	getScale: function(z)
	{
		return Math.pow(2, -z)*156543.033928041;
	}
	,
	deg_rad: function(ang)
	{
		return ang * (Math.PI/180.0);
	}
	,
	deg_decimal: function(rad)
	{
		return (rad/Math.PI) * 180.0;
	}
	,
	merc_x: function(lon)
	{
		var r_major = 6378137.000;
		return r_major * gmxAPI.deg_rad(lon);
	}
	,
	from_merc_x: function(x)
	{
		var r_major = 6378137.000;
		return gmxAPI.deg_decimal(x/r_major);
	}
	,
	merc_y: function(lat)
	{
		if (lat > 89.5)
			lat = 89.5;
		if (lat < -89.5)
			lat = -89.5;
		var r_major = 6378137.000;
		var r_minor = 6356752.3142;
		var temp = r_minor / r_major;
		var es = 1.0 - (temp * temp);
		var eccent = Math.sqrt(es);
		var phi = gmxAPI.deg_rad(lat);
		var sinphi = Math.sin(phi);
		var con = eccent * sinphi;
		var com = .5 * eccent;
		con = Math.pow(((1.0-con)/(1.0+con)), com);
		var ts = Math.tan(.5 * ((Math.PI*0.5) - phi))/con;
		var y = 0 - r_major * Math.log(ts);
		return y;
	}
	,
	from_merc_y: function(y)
	{
		var r_major = 6378137.000;
		var r_minor = 6356752.3142;
		var temp = r_minor / r_major;
		var es = 1.0 - (temp * temp);
		var eccent = Math.sqrt(es);
		var ts = Math.exp(-y/r_major);
		var HALFPI = 1.5707963267948966;

		var eccnth, Phi, con, dphi;
		eccnth = 0.5 * eccent;

		Phi = HALFPI - 2.0 * Math.atan(ts);

		var N_ITER = 15;
		var TOL = 1e-7;
		var i = N_ITER;
		dphi = 0.1;
		while ((Math.abs(dphi)>TOL)&&(--i>0))
		{
			con = eccent * Math.sin (Phi);
			dphi = HALFPI - 2.0 * Math.atan(ts * Math.pow((1.0 - con)/(1.0 + con), eccnth)) - Phi;
			Phi += dphi;
		}

		return gmxAPI.deg_decimal(Phi);
	}
	,
	merc: function(lon,lat)
	{
		return [gmxAPI.merc_x(lon), gmxAPI.merc_y(lat)];
	}
	,
	from_merc: function(x,y)
	{
		return [gmxAPI.from_merc_x(x), gmxAPI.from_merc_y(y)];
	}
	,
	distVincenty: function(lon1,lat1,lon2,lat2)
	{
		var p1 = new Object();
		var p2 = new Object();

		p1.lon =  gmxAPI.deg_rad(lon1);
		p1.lat =  gmxAPI.deg_rad(lat1);
		p2.lon =  gmxAPI.deg_rad(lon2);
		p2.lat =  gmxAPI.deg_rad(lat2);

		var a = 6378137, b = 6356752.3142,  f = 1/298.257223563;  // WGS-84 ellipsiod
		var L = p2.lon - p1.lon;
		var U1 = Math.atan((1-f) * Math.tan(p1.lat));
		var U2 = Math.atan((1-f) * Math.tan(p2.lat));
		var sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
		var sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

		var lambda = L, lambdaP = 2*Math.PI;
		var iterLimit = 20;
		while (Math.abs(lambda-lambdaP) > 1e-12 && --iterLimit>0) {
				var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
				var sinSigma = Math.sqrt((cosU2*sinLambda) * (cosU2*sinLambda) + 
					(cosU1*sinU2-sinU1*cosU2*cosLambda) * (cosU1*sinU2-sinU1*cosU2*cosLambda));
				if (sinSigma==0) return 0;
				var cosSigma = sinU1*sinU2 + cosU1*cosU2*cosLambda;
				var sigma = Math.atan2(sinSigma, cosSigma);
				var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
				var cosSqAlpha = 1 - sinAlpha*sinAlpha;
				var cos2SigmaM = cosSigma - 2*sinU1*sinU2/cosSqAlpha;
				if (isNaN(cos2SigmaM)) cos2SigmaM = 0;
				var C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
				lambdaP = lambda;
				lambda = L + (1-C) * f * sinAlpha *
					(sigma + C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));
		}
		if (iterLimit==0) return NaN

		var uSq = cosSqAlpha * (a*a - b*b) / (b*b);
		var A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
		var B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));
		var deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-
				B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)));
		var s = b*A*(sigma-deltaSigma);

		s = s.toFixed(3);
		return s;
	}

	,
	DegToRad: function(deg)
	{
        return (deg / 180.0 * Math.PI)
	}
	,
	RadToDeg: function(rad)
	{
		return (rad / Math.PI * 180.0)
	}
	,
	worldWidthMerc: 20037508,
	worldWidthMerc2: 20037508 * 2,
	sm_a: 6378137.0,
    sm_b: 6356752.314,
    //sm_EccSquared: 6.69437999013e-03,
    UTMScaleFactor: 0.9996
	,
	ArcLengthOfMeridian: function(rad)
	{
		var alpha, beta, gamma, delta, epsilon, n;
		var result;
		n = (gmxAPI.sm_a - gmxAPI.sm_b) / (gmxAPI.sm_a + gmxAPI.sm_b);
		alpha = ((gmxAPI.sm_a + gmxAPI.sm_b) / 2.0)
		   * (1.0 + (Math.pow (n, 2.0) / 4.0) + (Math.pow (n, 4.0) / 64.0));
		beta = (-3.0 * n / 2.0) + (9.0 * Math.pow (n, 3.0) / 16.0)
		   + (-3.0 * Math.pow (n, 5.0) / 32.0);
		gamma = (15.0 * Math.pow (n, 2.0) / 16.0)
			+ (-15.0 * Math.pow (n, 4.0) / 32.0);
		delta = (-35.0 * Math.pow (n, 3.0) / 48.0)
			+ (105.0 * Math.pow (n, 5.0) / 256.0);
		epsilon = (315.0 * Math.pow (n, 4.0) / 512.0);

		result = alpha
			* (phi + (beta * Math.sin (2.0 * phi))
				+ (gamma * Math.sin (4.0 * phi))
				+ (delta * Math.sin (6.0 * phi))
				+ (epsilon * Math.sin (8.0 * phi)));

		return result;
	}
	,
	UTMCentralMeridian: function(zone)
	{
        var cmeridian = gmxAPI.DegToRad (-183.0 + (zone * 6.0));
        return cmeridian;
	}
	,
	FootpointLatitude: function(y)
	{
		var y_, alpha_, beta_, gamma_, delta_, epsilon_, n;
		var result;

		n = (gmxAPI.sm_a - gmxAPI.sm_b) / (gmxAPI.sm_a + gmxAPI.sm_b);
		alpha_ = ((gmxAPI.sm_a + gmxAPI.sm_b) / 2.0)
			* (1 + (Math.pow (n, 2.0) / 4) + (Math.pow (n, 4.0) / 64));
		y_ = y / alpha_;
		beta_ = (3.0 * n / 2.0) + (-27.0 * Math.pow (n, 3.0) / 32.0)
			+ (269.0 * Math.pow (n, 5.0) / 512.0);
		gamma_ = (21.0 * Math.pow (n, 2.0) / 16.0)
			+ (-55.0 * Math.pow (n, 4.0) / 32.0);
		delta_ = (151.0 * Math.pow (n, 3.0) / 96.0)
			+ (-417.0 * Math.pow (n, 5.0) / 128.0);
		epsilon_ = (1097.0 * Math.pow (n, 4.0) / 512.0);
		result = y_ + (beta_ * Math.sin (2.0 * y_))
			+ (gamma_ * Math.sin (4.0 * y_))
			+ (delta_ * Math.sin (6.0 * y_))
			+ (epsilon_ * Math.sin (8.0 * y_));

		return result;
	}
	,
	MapLatLonToXY: function(phi, lambda, lambda0, xy)
	{
		var N, nu2, ep2, t, t2, l;
		var l3coef, l4coef, l5coef, l6coef, l7coef, l8coef;
		var tmp;

		ep2 = (Math.pow (gmxAPI.sm_a, 2.0) - Math.pow (gmxAPI.sm_b, 2.0)) / Math.pow (gmxAPI.sm_b, 2.0);
		nu2 = ep2 * Math.pow (Math.cos (phi), 2.0);
		N = Math.pow (gmxAPI.sm_a, 2.0) / (gmxAPI.sm_b * Math.sqrt (1 + nu2));
		t = Math.tan (phi);
		t2 = t * t;
		tmp = (t2 * t2 * t2) - Math.pow (t, 6.0);
		l = lambda - lambda0;
		l3coef = 1.0 - t2 + nu2;

		l4coef = 5.0 - t2 + 9 * nu2 + 4.0 * (nu2 * nu2);

		l5coef = 5.0 - 18.0 * t2 + (t2 * t2) + 14.0 * nu2
			- 58.0 * t2 * nu2;

		l6coef = 61.0 - 58.0 * t2 + (t2 * t2) + 270.0 * nu2
			- 330.0 * t2 * nu2;

		l7coef = 61.0 - 479.0 * t2 + 179.0 * (t2 * t2) - (t2 * t2 * t2);

		l8coef = 1385.0 - 3111.0 * t2 + 543.0 * (t2 * t2) - (t2 * t2 * t2);

		xy[0] = N * Math.cos (phi) * l
			+ (N / 6.0 * Math.pow (Math.cos (phi), 3.0) * l3coef * Math.pow (l, 3.0))
			+ (N / 120.0 * Math.pow (Math.cos (phi), 5.0) * l5coef * Math.pow (l, 5.0))
			+ (N / 5040.0 * Math.pow (Math.cos (phi), 7.0) * l7coef * Math.pow (l, 7.0));

		xy[1] = ArcLengthOfMeridian (phi)
			+ (t / 2.0 * N * Math.pow (Math.cos (phi), 2.0) * Math.pow (l, 2.0))
			+ (t / 24.0 * N * Math.pow (Math.cos (phi), 4.0) * l4coef * Math.pow (l, 4.0))
			+ (t / 720.0 * N * Math.pow (Math.cos (phi), 6.0) * l6coef * Math.pow (l, 6.0))
			+ (t / 40320.0 * N * Math.pow (Math.cos (phi), 8.0) * l8coef * Math.pow (l, 8.0));

		return;
	}
	,
	MapXYToLatLon: function(x, y, lambda0, philambda)
	{
		var phif, Nf, Nfpow, nuf2, ep2, tf, tf2, tf4, cf;
		var x1frac, x2frac, x3frac, x4frac, x5frac, x6frac, x7frac, x8frac;
		var x2poly, x3poly, x4poly, x5poly, x6poly, x7poly, x8poly;

		phif = FootpointLatitude (y);
		ep2 = (Math.pow (gmxAPI.sm_a, 2.0) - Math.pow (gmxAPI.sm_b, 2.0))
			  / Math.pow (gmxAPI.sm_b, 2.0);
		cf = Math.cos (phif);
		nuf2 = ep2 * Math.pow (cf, 2.0);
		Nf = Math.pow (gmxAPI.sm_a, 2.0) / (gmxAPI.sm_b * Math.sqrt (1 + nuf2));
		Nfpow = Nf;
		tf = Math.tan (phif);
		tf2 = tf * tf;
		tf4 = tf2 * tf2;
		x1frac = 1.0 / (Nfpow * cf);

		Nfpow *= Nf;
		x2frac = tf / (2.0 * Nfpow);

		Nfpow *= Nf;
		x3frac = 1.0 / (6.0 * Nfpow * cf);

		Nfpow *= Nf;
		x4frac = tf / (24.0 * Nfpow);

		Nfpow *= Nf;
		x5frac = 1.0 / (120.0 * Nfpow * cf);

		Nfpow *= Nf;
		x6frac = tf / (720.0 * Nfpow);

		Nfpow *= Nf;
		x7frac = 1.0 / (5040.0 * Nfpow * cf);

		Nfpow *= Nf;
		x8frac = tf / (40320.0 * Nfpow);

		x2poly = -1.0 - nuf2;

		x3poly = -1.0 - 2 * tf2 - nuf2;

		x4poly = 5.0 + 3.0 * tf2 + 6.0 * nuf2 - 6.0 * tf2 * nuf2
			- 3.0 * (nuf2 *nuf2) - 9.0 * tf2 * (nuf2 * nuf2);

		x5poly = 5.0 + 28.0 * tf2 + 24.0 * tf4 + 6.0 * nuf2 + 8.0 * tf2 * nuf2;

		x6poly = -61.0 - 90.0 * tf2 - 45.0 * tf4 - 107.0 * nuf2
			+ 162.0 * tf2 * nuf2;

		x7poly = -61.0 - 662.0 * tf2 - 1320.0 * tf4 - 720.0 * (tf4 * tf2);

		x8poly = 1385.0 + 3633.0 * tf2 + 4095.0 * tf4 + 1575 * (tf4 * tf2);
			
		philambda[0] = phif + x2frac * x2poly * (x * x)
			+ x4frac * x4poly * Math.pow (x, 4.0)
			+ x6frac * x6poly * Math.pow (x, 6.0)
			+ x8frac * x8poly * Math.pow (x, 8.0);
			
		philambda[1] = lambda0 + x1frac * x
			+ x3frac * x3poly * Math.pow (x, 3.0)
			+ x5frac * x5poly * Math.pow (x, 5.0)
			+ x7frac * x7poly * Math.pow (x, 7.0);
			
		return;
	}
	,
	LatLonToUTMXY: function(lat, lon, zone, xy)
	{
		gmxAPI.MapLatLonToXY (lat, lon, gmxAPI.UTMCentralMeridian (zone), xy);

		xy[0] = xy[0] * gmxAPI.UTMScaleFactor + 500000.0;
		xy[1] = xy[1] * gmxAPI.UTMScaleFactor;
		if (xy[1] < 0.0)
			xy[1] = xy[1] + 10000000.0;

		return zone;
	}
	,
	UTMXYToLatLon: function(x, y, zone, southhemi, latlon)
	{
		var cmeridian;
			
		x -= 500000.0;
		x /= gmxAPI.UTMScaleFactor;
			
		if (southhemi)
		y -= 10000000.0;
				
		y /= gmxAPI.UTMScaleFactor;

		cmeridian = gmxAPI.UTMCentralMeridian (zone);
		gmxAPI.MapXYToLatLon (x, y, cmeridian, latlon);
			
		return;
	}
	,
	truncate9: function(x)
	{
        return ("" + x).substring(0, 9);
	}
	,
	prettifyDistance: function(length)
	{
		var type = gmxAPI.map.DistanceUnit
		if (type === 'km')
			return (Math.round(length)/1000) + gmxAPI.KOSMOSNIMKI_LOCALIZED(" км", " km");

		if (length < 2000 || type === 'm')
			return Math.round(length) + gmxAPI.KOSMOSNIMKI_LOCALIZED(" м", " m");
		if (length < 200000)
			return (Math.round(length/10)/100) + gmxAPI.KOSMOSNIMKI_LOCALIZED(" км", " km");
		return Math.round(length/1000) + gmxAPI.KOSMOSNIMKI_LOCALIZED(" км", " km");
	}
	,
	prettifyArea: function(area)
	{
		var type = gmxAPI.map.SquareUnit

		if (type === 'km2')
			return ("" + (Math.round(area/100)/10000)) + gmxAPI.KOSMOSNIMKI_LOCALIZED(" кв. км", " sq.km");
		if (type === 'ha')
			return ("" + (Math.round(area/100)/100)) + gmxAPI.KOSMOSNIMKI_LOCALIZED(" га", " ha");

		if (area < 100000 || type === 'm2')
			return Math.round(area) + gmxAPI.KOSMOSNIMKI_LOCALIZED(" кв. м", " sq. m");
		if (area < 3000000)
			return ("" + (Math.round(area/1000)/1000)).replace(".", ",") + gmxAPI.KOSMOSNIMKI_LOCALIZED(" кв. км", " sq.km");
		if (area < 30000000)
			return ("" + (Math.round(area/10000)/100)).replace(".", ",") + gmxAPI.KOSMOSNIMKI_LOCALIZED(" кв. км", " sq.km");
		if (area < 300000000)
			return ("" + (Math.round(area/100000)/10)).replace(".", ",") + gmxAPI.KOSMOSNIMKI_LOCALIZED(" кв. км", " sq.km");
		return (Math.round(area/1000000)) + gmxAPI.KOSMOSNIMKI_LOCALIZED(" кв. км", " sq. km");
	}
	,
	fragmentArea: function(points)
	{
		var area = 0;
		var rad = Math.PI/180;
		for(var i=0, len = points.length; i<len; i++) {
			var ipp = (i == (len - 1) ? 0 : i + 1);
			area += points[i][0] * Math.sin(points[ipp][1]*rad) - points[ipp][0] * Math.sin(points[i][1]*rad);
		}
		var out = Math.abs(area*gmxAPI.lambertCoefX*gmxAPI.lambertCoefY/2);
		return out;
	}
	,
	fragmentAreaMercator: function(points)
	{
		var pts = [];
		for(var i=0, len = points.length; i<len; i++) {
			pts.push([gmxAPI.from_merc_x(points[i][0]), gmxAPI.from_merc_y(points[i][1])]);
		}
		return gmxAPI.fragmentArea(pts);
	}
	,
	pad2: function(t)
	{
		return (t < 10) ? ("0" + t) : ("" + t);
	}
	,
	strToDate: function(str)
	{
		var arr = str.split(' ');
		var arr1 = arr[0].split('.');
		var d = arr1[0];
		var m = arr1[1] - 1;
		var y = arr1[2];
		if(d > 99) d = arr1[2], y = arr1[0];
		var ret = new Date(y, m, d);
		if(arr.length > 1) {
			arr1 = arr[1].split(':');
			ret.setHours((arr1.length > 0 ? arr1[0] : 0), (arr1.length > 1 ? arr1[1] : 0), (arr1.length > 2 ? arr1[2] : 0), (arr1.length > 3 ? arr1[3] : 0));
		}
		return ret;
	}
	,
	trunc: function(x)
	{
		return ("" + (Math.round(10000000*x)/10000000 + 0.00000001)).substring(0, 9);
	}
	,
	formatDegreesSimple: function(angle)
	{
		if (angle > 180)
			angle -= 360;
		var str = "" + Math.round(angle*100000)/100000;
		if (str.indexOf(".") == -1)
			str += ".";
		for (var i = str.length; i < 8; i++)
			str += "0";
		return str;
	}
	,
	formatDegrees: function(angle)
	{
		angle = Math.round(10000000*angle)/10000000 + 0.00000001;
		var a1 = Math.floor(angle);
		var a2 = Math.floor(60*(angle - a1));
		var a3 = gmxAPI.pad2(3600*(angle - a1 - a2/60)).substring(0, 2);
		return gmxAPI.pad2(a1) + "°" + gmxAPI.pad2(a2) + "'" + a3 + '"';
	}
	,
	LatLon_formatCoordinates: function(x, y)
	{
		return  gmxAPI.formatDegrees(Math.abs(y)) + (y > 0 ? " N, " : " S, ") + 
			gmxAPI.formatDegrees(Math.abs(x)) + (x > 0 ? " E" : " W");
	}
	,
	formatCoordinates: function(x, y)
	{
		return  gmxAPI.LatLon_formatCoordinates(gmxAPI.from_merc_x(x), gmxAPI.from_merc_y(y));
	}
	,
	LatLon_formatCoordinates2: function(x, y)
	{
		return  gmxAPI.trunc(Math.abs(y)) + (y > 0 ? " N, " : " S, ") + 
			gmxAPI.trunc(Math.abs(x)) + (x > 0 ? " E" : " W");
	}
	,
	formatCoordinates2: function(x, y)
	{
		return  gmxAPI.LatLon_formatCoordinates2(gmxAPI.from_merc_x(x), gmxAPI.from_merc_y(y));
	}	
	,
	forEachPointAmb: function(arg, callback)
	{
		gmxAPI.forEachPoint(arg.length ? arg : arg.coordinates, callback);
	}
	,
	geoLength: function(arg1, arg2, arg3, arg4)
	{
		if (arg4)
			return gmxAPI.distVincenty(arg1, arg2, arg3, arg4);
		var currentX = false, currentY = false, length = 0;
		gmxAPI.forEachPointAmb(arg1, function(p)
		{
			if (currentX && currentY)
				length += parseFloat(gmxAPI.distVincenty(currentX, currentY, p[0], p[1]));
			currentX = p[0];
			currentY = p[1];
		});
		return length;
	}
	,
	geoArea: function(arg)
	{
		if (arg.type == "MULTIPOLYGON")
		{
			var ret = 0;
			for (var i = 0; i < arg.coordinates.length; i++)
				ret += gmxAPI.geoArea({ type: "POLYGON", coordinates: arg.coordinates[i] });
			return ret;
		}
		else if (arg.type == "POLYGON")
		{
			var ret = gmxAPI.geoArea(arg.coordinates[0]);
			for (var i = 1; i < arg.coordinates.length; i++)
				ret -= gmxAPI.geoArea(arg.coordinates[i]);
			return ret;
		}
		else if (arg.length)
		{
			var pts = [];
			gmxAPI.forEachPoint(arg, function(p) { pts.push(p); });
			return gmxAPI.fragmentArea(pts);
		}
		else
			return 0;
	}
	,
	geoCenter: function(arg1, arg2, arg3, arg4)
	{
		var minX, minY, maxX, maxY;
		if (arg4)
		{
			minX = Math.min(arg1, arg3);
			minY = Math.min(arg2, arg4);
			maxX = Math.max(arg1, arg3);
			maxY = Math.max(arg2, arg4);
		}
		else
		{
			minX = 1000;
			minY = 1000;
			maxX = -1000;
			maxY = -1000;
			gmxAPI.forEachPointAmb(arg1, function(p)
			{
				minX = Math.min(minX, p[0]);
				minY = Math.min(minY, p[1]);
				maxX = Math.max(maxX, p[0]);
				maxY = Math.max(maxY, p[1]);
			});
		}
		return [
			gmxAPI.from_merc_x((gmxAPI.merc_x(minX) + gmxAPI.merc_x(maxX))/2),
			gmxAPI.from_merc_y((gmxAPI.merc_y(minY) + gmxAPI.merc_y(maxY))/2)
		];
	}
	,
	chkPointCenterX: function(centerX) {
		if(typeof(centerX) != 'number') centerX = 0;
		else {
			centerX = centerX % 360;
			if(centerX < -180) centerX += 360;
			if(centerX > 180) centerX -= 360;
		}
		return centerX;
	}
	,
	convertCoords: function(coordsStr)
	{
		var res = [],
			coordsPairs = gmxAPI.strip(coordsStr).replace(/\s+/,' ').split(' ');

		if (coordsStr.indexOf(',') == -1)
		{
			for (var j = 0; j < Math.floor(coordsPairs.length / 2); j++)
				res.push([Number(coordsPairs[2 * j]), Number(coordsPairs[2 * j + 1])])
		}
		else
		{
			for (var j = 0; j < coordsPairs.length; j++)
			{
				var parsedCoords = coordsPairs[j].split(',');			
				res.push([Number(parsedCoords[0]), Number(parsedCoords[1])])
			}
		}

		return res;
	}
	,
	parseGML: function(response)
	{
		var geometries = [],
			strResp = response.replace(/[\t\n\r]/g, ' '),
			strResp = strResp.replace(/\s+/g, ' '),
			coordsTag = /<gml:coordinates>([-0-9.,\s]*)<\/gml:coordinates>/,
			pointTag = /<gml:Point>[\s]*<gml:coordinates>[-0-9.,\s]*<\/gml:coordinates>[\s]*<\/gml:Point>/g,
			lineTag = /<gml:LineString>[\s]*<gml:coordinates>[-0-9.,\s]*<\/gml:coordinates>[\s]*<\/gml:LineString>/g,
			polyTag = /<gml:Polygon>[\s]*(<gml:outerBoundaryIs>[\s]*<gml:LinearRing>[\s]*<gml:coordinates>[-0-9.,\s]*<\/gml:coordinates>[\s]*<\/gml:LinearRing>[\s]*<\/gml:outerBoundaryIs>){0,1}[\s]*(<gml:innerBoundaryIs>[\s]*<gml:LinearRing>[\s]*<gml:coordinates>[-0-9.,\s]*<\/gml:coordinates>[\s]*<\/gml:LinearRing>[\s]*<\/gml:innerBoundaryIs>){0,1}[\s]*<\/gml:Polygon>/g,
			outerTag = /<gml:outerBoundaryIs>(.*)<\/gml:outerBoundaryIs>/,
			innerTag = /<gml:innerBoundaryIs>(.*)<\/gml:innerBoundaryIs>/;

		if (strResp.indexOf('gml:posList') > -1)
		{
			coordsTag = /<gml:posList>([-0-9.,\s]*)<\/gml:posList>/,
			pointTag = /<gml:Point>[\s]*<gml:posList>[-0-9.,\s]*<\/gml:posList>[\s]*<\/gml:Point>/g,
			lineTag = /<gml:LineString>[\s]*<gml:posList>[-0-9.,\s]*<\/gml:posList>[\s]*<\/gml:LineString>/g,
			polyTag = /<gml:Polygon>[\s]*(<gml:exterior>[\s]*<gml:LinearRing>[\s]*<gml:posList>[-0-9.,\s]*<\/gml:posList>[\s]*<\/gml:LinearRing>[\s]*<\/gml:exterior>){0,1}[\s]*(<gml:interior>[\s]*<gml:LinearRing>[\s]*<gml:posList>[-0-9.,\s]*<\/gml:posList>[\s]*<\/gml:LinearRing>[\s]*<\/gml:interior>){0,1}[\s]*<\/gml:Polygon>/g,
			outerTag = /<gml:exterior>(.*)<\/gml:exterior>/,
			innerTag = /<gml:interior>(.*)<\/gml:interior>/;
		}
		else if (strResp.indexOf('<kml') > -1)
		{
			coordsTag = /<coordinates>([-0-9.,\s]*)<\/coordinates>/,
			pointTag = /<Point>[^P]*<\/Point>/g,
			lineTag = /<LineString>[^L]*<\/LineString>/g,
			polyTag = /<Polygon>[^P]*<\/Polygon>/g,
			outerTag = /<outerBoundaryIs>(.*)<\/outerBoundaryIs>/,
			innerTag = /<innerBoundaryIs>(.*)<\/innerBoundaryIs>/;
		}

		strResp = strResp.replace(pointTag, function(str)
		{
			var coords = gmxAPI.getTagValue(str, coordsTag),
				parsedCoords = gmxAPI.convertCoords(coords);
			
			geometries.push({type: 'POINT', coordinates:parsedCoords[0]})
			
			return '';
		})

		strResp = strResp.replace(lineTag, function(str)
		{
			var coords = gmxAPI.getTagValue(str, coordsTag),
				parsedCoords = gmxAPI.convertCoords(coords)

			geometries.push({type: 'LINESTRING', coordinates: parsedCoords});
			
			return '';
		})

		strResp = strResp.replace(polyTag, function(str)
		{
			var coords = [],
				outerCoords = gmxAPI.getTagValue(str, outerTag),
				innerCoords = gmxAPI.getTagValue(str, innerTag),
				resultCoords = [];
			
			if (outerCoords)
				coords.push(gmxAPI.getTagValue(outerCoords, coordsTag));
			
			if (innerCoords)
				coords.push(gmxAPI.getTagValue(innerCoords, coordsTag));
			
			for (var index = 0; index < coords.length; index++)
				resultCoords.push(gmxAPI.convertCoords(coords[index]))
			
			geometries.push({type: 'POLYGON', coordinates: resultCoords});
			
			return '';
		})

		return geometries;
	}
	,
	createGML: function(geometries, format)
	{
		if (typeof geometries == 'undefined' || geometries == null || geometries.length == 0)
			return '';

		var coordsSeparator = ',',
			coordsTag = '<gml:coordinates>_REPLACE_<\/gml:coordinates>',
			pointTag = '<gml:Point><gml:coordinates>_REPLACE_<\/gml:coordinates><\/gml:Point>',
			lineTag = '<gml:LineString><gml:coordinates>_REPLACE_<\/gml:coordinates><\/gml:LineString>',
			polyTag = '<gml:Polygon>_REPLACE_<\/gml:Polygon>',
			outerTag = '<gml:outerBoundaryIs><gml:LinearRing><gml:coordinates>_REPLACE_<\/gml:coordinates><\/gml:LinearRing><\/gml:outerBoundaryIs>',
			innerTag = '<gml:innererBoundaryIs><gml:LinearRing><gml:coordinates>_REPLACE_<\/gml:coordinates><\/gml:LinearRing><\/gml:innerBoundaryIs>',
			elementTag = '<gml:featureMember>_REPLACE_<\/gml:featureMember>',
			headerTag = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?>\n<wfs:FeatureCollection xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:ows=\"http://www.opengis.net/ows\" xmlns:wfs=\"http://www.opengis.net/wfs\">\n_REPLACE_\n</wfs:FeatureCollection>';

		if (typeof format != 'undefined' && format == 'gml3')
		{
			coordsSeparator = ' ',
			coordsTag = '<gml:posList>_REPLACE_<\/gml:posList>',
			pointTag = '<gml:Point><gml:posList>_REPLACE_<\/gml:posList><\/gml:Point>',
			lineTag = '<gml:LineString><gml:posList>_REPLACE_<\/gml:posList><\/gml:LineString>',
			polyTag = '<gml:Polygon>_REPLACE_<\/gml:Polygon>',
			outerTag = '<gml:exterior><gml:LinearRing><gml:posList>_REPLACE_<\/gml:posList><\/gml:LinearRing><\/gml:exterior>',
			innerTag = '<gml:interior><gml:LinearRing><gml:posList>_REPLACE_<\/gml:posList><\/gml:LinearRing><\/gml:interior>',
			elementTag = '<gml:featureMember>_REPLACE_<\/gml:featureMember>',
			headerTag = '<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<wfs:FeatureCollection xmlns:ogc=\"http://www.opengis.net/ogc\" xmlns:gml=\"http://www.opengis.net/gml\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:ows=\"http://www.opengis.net/ows\" xmlns:wfs=\"http://www.opengis.net/wfs\">\n_REPLACE_\n</wfs:FeatureCollection>';
		}
		else if (typeof format != 'undefined' && format == 'kml')
		{
			coordsTag = '<coordinates>_REPLACE_<\/coordinates>',
			pointTag = '<Point><coordinates>_REPLACE_<\/coordinates><\/Point>',
			lineTag = '<LineString><coordinates>_REPLACE_<\/coordinates><\/LineString>',
			polyTag = '<Polygon>_REPLACE_<\/Polygon>',
			outerTag = '<outerBoundaryIs><LinearRing><coordinates>_REPLACE_<\/coordinates><\/LinearRing><\/outerBoundaryIs>',
			innerTag = '<innererBoundaryIs><LinearRing><coordinates>_REPLACE_<\/coordinates><\/LinearRing><\/innerBoundaryIs>',
			elementTag = '<Placemark>_REPLACE_<\/Placemark>',
			headerTag = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?> <kml xmlns=\"http://earth.google.com/kml/2.0\"> <Document>\n_REPLACE_\n</Document>';
		}

		var elementsStr = '';

		for (var i = 0; i < geometries.length; i++)
		{
			var geometriesStr = '';
			
			if (geometries[i].type == 'POINT')
			{
				var coordsStr = geometries[i].coordinates.join(coordsSeparator);
				
				geometriesStr = pointTag.replace('_REPLACE_', coordsStr);
			}
			else if (geometries[i].type == 'LINESTRING')
			{
				var coordsStr = '';
				
				for (var j = 0; j < geometries[i].coordinates.length; j++)
				{
					if (j == 0)
						coordsStr += geometries[i].coordinates[j].join(coordsSeparator)
					else
						coordsStr += ' ' + geometries[i].coordinates[j].join(coordsSeparator)
				}
				
				geometriesStr = lineTag.replace('_REPLACE_', coordsStr);
			}
			else if (geometries[i].type == 'POLYGON')
			{
				var bounds = [outerTag, innerTag];
				
				for (var k = 0; k < geometries[i].coordinates.length; k++)
				{
					var coordsStr = '';
					
					for (var j = 0; j < geometries[i].coordinates[k].length; j++)
					{
						if (j == 0)
							coordsStr += geometries[i].coordinates[k][j].join(coordsSeparator)
						else
							coordsStr += ' ' + geometries[i].coordinates[k][j].join(coordsSeparator)
					}
					
					geometriesStr = bounds[k].replace('_REPLACE_', coordsStr);
				}
				
				geometriesStr = polyTag.replace('_REPLACE_', geometriesStr);
			}
			
			elementsStr += elementTag.replace('_REPLACE_', geometriesStr);
		}

		var xmlStr = headerTag.replace('_REPLACE_', elementsStr);

		return xmlStr;
	}
	,
	getTagValue: function(str, tag)
	{
		var res = null;
		str.replace(tag, function()
		{
			res = arguments[1];
		})
		return res;
	}
	,
	parseCoordinates: function(text, callback)
	{
		// should understand the following formats:
		// 55.74312, 37.61558
		// 55°44'35" N, 37°36'56" E
		// 4187347, 7472103

		if (text.match(/[йцукенгшщзхъфывапролджэячсмитьбюЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮqrtyuiopadfghjklzxcvbmQRTYUIOPADFGHJKLZXCVBM_:]/))
			return false;
		if (text.indexOf(" ") != -1)
			text = text.replace(/,/g, ".");
		var regex = /(-?\d+(\.\d+)?)([^\d\-]*)/g;
		var results = [];
		while (t = regex.exec(text))
			results.push(t[1]);
		if (results.length < 2)
			return false;
		var ii = Math.floor(results.length/2);
		var x = 0;
		var mul = 1;
		for (var i = 0; i < ii; i++)
		{
			x += parseFloat(results[i])*mul;
			mul /= 60;
		}
		var y = 0;
		mul = 1;
		for (var i = ii; i < results.length; i++)
		{
			y += parseFloat(results[i])*mul;
			mul /= 60;
		}
		if ((Math.abs(x) < 180) && (Math.abs(y) < 180))
		{	
			var tx = x, ty = y;
			x = gmxAPI.merc_x(ty);
			y = gmxAPI.merc_y(tx);
		}
		if (Math.max(text.indexOf("N"), text.indexOf("S")) > Math.max(text.indexOf("E"), text.indexOf("W")))
		{
			var t = gmxAPI.merc_y(gmxAPI.from_merc_x(x));
			x = gmxAPI.merc_x(gmxAPI.from_merc_y(y));
			y = t;
		}
		if (text.indexOf("W") != -1)
			x = -x;
		if (text.indexOf("S") != -1)
			y = -y;
		callback(gmxAPI.from_merc_x(x), gmxAPI.from_merc_y(y));
		return true;
	}
	,
	parseUri: function(str)
	{
		var	o   = {
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
			},
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
	}
	,
	memoize : memoize
	,
	getScriptURL: function(scriptName)
	{
		var scripts1 = document.getElementsByTagName("script");
		for (var i = 0; i < scripts1.length; i++)
		{
			var src = scripts1[i].getAttribute("src");
			if (src && (src.indexOf(scriptName) != -1))
				return src;
		}
		return false;
	}
	,
	getScriptBase: function(scriptName)
	{
		var url = gmxAPI.getScriptURL(scriptName);
		return url.substring(0, url.indexOf(scriptName));
	}
	,
	getBaseMapParam: function(paramName, defaultValue)
	{
		if (typeof window.baseMap !== 'object') window.baseMap = {};
		if (!window.baseMap[paramName]) window.baseMap[paramName] = defaultValue;
		return window.baseMap[paramName];
		//return (window.baseMap && window.baseMap[paramName]) ? window.baseMap[paramName] : defaultValue;
	}
	,
	getHostAndPath: function(url)
	{
		var u = gmxAPI.parseUri(url);
		if (u.host == "")
			return "";
		var s = u.host + u.directory;
		if (s.charAt(s.length - 1) == "/")
			s = s.substring(0, s.length - 1);
		return s;
	},
	getAPIUri: memoize(function()
	{
		var scripts1 = document.getElementsByTagName("script");
		for (var i = 0; i < scripts1.length; i++)
		{
			var src = scripts1[i].getAttribute("src");
			var u = gmxAPI.parseUri(src);
			if(u && /\bapi\w*\.js\b/.exec(src)) {
				return u;
			}
		}
		return {};
	})
	,
	getAPIKey: memoize(function()
	{
		var u = gmxAPI.getAPIUri();
		return (u.source ? (/key=([a-zA-Z0-9]+)/).exec(u.source) : '');
	})
	,
	getAPIFolderRoot: memoize(function()
	{
		var u = gmxAPI.getAPIUri();
		return (u.source ? u.source.substring(0, u.source.indexOf(u.file)) : '');
	})
	,
	getAPIHost: memoize(function()
	{
		var apiHost = gmxAPI.getHostAndPath(gmxAPI.getAPIFolderRoot());
		if(apiHost == "") {
			apiHost = gmxAPI.getHostAndPath(window.location.href);
		}
		var arr = /(.*)\/[^\/]*/.exec(apiHost);
		res = (arr && arr.length > 1 ? arr[1] : '');	 //удаляем последний каталог в адресе
		return res;
	})
	,
	getAPIHostRoot: memoize(function()
	{
		return "http://" + gmxAPI.getAPIHost() + "/";
	})
	,
	isArray: function(obj)
	{
		return Object.prototype.toString.apply(obj) === '[object Array]';
	}
	,
	removeFromArray: function(arr, value)
	{
		for (var i = 0, len = arr.length; i < len; i++)
			if (arr[i] == value)
				return arr.splice(i, 1);
		
		return false;
	}
	,
	valueInArray: function(arr, value)
	{
		for (var i = 0, len = arr.length; i < len; i++)
			if (arr[i] == value)
				return true;
		
		return false;
	}
	,
	arrayToHash: function(arr)
	{
		var ret = {};
		for (var i = 0; i < arr.length; i++)
			ret[arr[i][0]] = arr[i][1];
		return ret;
	}
	,
	propertiesFromArray: function(a)
	{
		a.sort(function(e1, e2)
		{
			var f1 = e1[0], f2 = e2[0];
			return (f1 < f2) ? -1 : (f1 == f2) ? 0 : 1;
		});
		var p_ = {};
		for (var i = 0; i < a.length; i++)
			p_[a[i][0]] = a[i][1];
		return p_;
	}
	,
	lastFlashMapId: 0
	,
	newFlashMapId: function()
	{
		gmxAPI.lastFlashMapId += 1;
		return "random_" + gmxAPI.lastFlashMapId;
	}
	,
	uniqueGlobalName: function(thing)
	{
		var id = gmxAPI.newFlashMapId();
		window[id] = thing;
		return id;
	}
	,
	loadVariableFromScript: function(url, name, callback, onError, useTimeout)
	{
		window[name] = undefined;
		var script = document.createElement("script");
		var done = false;
		var ready = function() {
			if ( window[name] !== undefined ) callback(window[name]);
			else if (onError) onError();
			done = true;
		};
		
		script.onerror = function()
		{
			if (!done) {
				window[name] = undefined;
				ready();
			}
		}
		
		script.onload = function()
		{
			if (!done) {
				ready();
			}
		}
		
		script.setAttribute("charset", "UTF-8");
		document.getElementsByTagName("head").item(0).appendChild(script);
		script.setAttribute("src", url);
	}
	,
	loadVariableFromScript_old: function(url, name, callback, onError, useTimeout)
	{
		window[name] = undefined;
		var script = document.createElement("script");
		var done = false;
		//var count = 0;		// Попытки загрузки
		
		script.onerror = function()
		{
			if (!done)
			{
				clearInterval(intervalError);
				if (onError) onError();
				done = true;
			}
		}
		
		script.onload = function()
		{
			if (!done)
			{
				clearInterval(intervalError);
				if ( window[name] !== undefined )
					callback(window[name]);
				else if (onError) onError();
				done = true;
			}
		}
		
		script.onreadystatechange = function()
		{
			if (!done)
			{
				if (script.readyState === 'loaded' || this.readyState === 'complete' )
				{
					var ready = function() {
						clearInterval(intervalError);
						if ( window[name] !== undefined )
							callback(window[name]);
						else if (onError) onError();
						done = true;
					};
					if(gmxAPI.isIE) setTimeout(ready, 100);
					else 	ready();
				}
			}
		}
		
		var intervalError = setInterval(function()
		{
//			count++;
			if (!done)
			{
				if (script.readyState === 'loaded' || this.readyState === 'complete')
				{
					clearInterval(intervalError);
					if (typeof window[name] === 'undefined')
					{
						if (onError) onError();
					}
					done = true;
/*
				} else if (count > 100)
				{
					clearInterval(intervalError);
					if (onError) onError();
*/
				}
			}
		}, 50);
		
		script.setAttribute("charset", "UTF-8");
		document.getElementsByTagName("head").item(0).appendChild(script);
		script.setAttribute("src", url);
	}
	,
    getPatternIcon: function(ph, size)
    {
        return gmxAPI._cmdProxy('getPatternIcon', { 'attr':{'size': size || 32, 'style':ph} });
    }
	,
	mapNodes: {}	// ноды mapObjects
	,
    chkNodeVisibility: function(id)		// рекурсивная проверка видимости обьекта по mapNodes
    {
		var pObj = gmxAPI.mapNodes[id];
		var ret = (!pObj || ('isVisible' in pObj && !pObj['isVisible']) ? false : (pObj.parent ? gmxAPI.chkNodeVisibility(pObj.parent.objectId) : true));
		return ret;
	}
	,
    isProxyReady: function()
    {
		var chkObj = null;
		if (gmxAPI.proxyType === 'leaflet') {			// Это leaflet версия
			chkObj = (gmxAPI._leaflet && gmxAPI._leaflet['LMap'] ? true : false);
		} else {										// Это Flash версия
			chkObj = window.__flash__toXML;
		}
		return (chkObj ? true : false);
    }
	,
    getTileBounds: function(z, x, y)					// Определение границ тайла
    {
		var tileSize = gmxAPI.getScale(z)*256;
		var minX = x*tileSize;
		var minY = y*tileSize;
		return {
			minX: gmxAPI.from_merc_x(minX),
			minY: gmxAPI.from_merc_y(minY),
			maxX: gmxAPI.from_merc_x(minX + tileSize),
			maxY: gmxAPI.from_merc_y(minY + tileSize)
		};
    }
	,
	'getTilePosZoomDelta': function(tilePoint, zoomFrom, zoomTo) {		// получить смещение тайла на меньшем zoom
		var dz = Math.pow(2, zoomFrom - zoomTo);
		var size = 256 / dz;
		var dx = tilePoint.x % dz;
		var dy = tilePoint.y % dz;
		return {
			'size': size
			,'zDelta': dz
			,'x': size * (dx < 0 ? dz + dx : dx)
			,'y': size * (dy < 0 ? Math.abs(1 + dy) : dz - 1 - dy)
		};
    }
	,
	'filterVisibleTiles': function(arr, tiles, z) {				// отфильтровать список тайлов по видимому extent
		var count = 0;
		var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
		if(currPos['latlng']) {
			if(!z) z = currPos['z'];
			var bounds = gmxAPI.map.getVisibleExtent();
			var pz = Math.pow(2, -z);
			var tileSize = 256 * pz * 156543.033928041;
			var xSize = 360 * pz;
			var minx = Math.floor(bounds.minX/xSize);
			var maxx = Math.ceil(bounds.maxX/xSize);
			var miny = Math.floor(gmxAPI.merc_y(bounds.minY)/tileSize);
			var maxy = Math.ceil(gmxAPI.merc_y(bounds.maxY)/tileSize);
			//var arr = ph['dtiles'];
			for (var i = 0, len = arr.length; i < len; i+=3)
			{
				var tx = Number(arr[i]), ty = Number(arr[i+1]), tz = Number(arr[i+2]);
				var dz = Math.pow(2, z - tz);
				var tx1 = Number(tx*dz), ty1 = Number(ty*dz);
				if((tx1 + dz) < minx || tx1 > maxx || (ty1 + dz) < miny || ty1 > maxy) {
					continue;
				}
				count += (tiles ? tiles[tz][tx][ty].length : 1);
			}
		}
		return count;
    }
	,
	'chkTileList': function(attr)	{		// получить список тайлов по bounds на определенном zoom
		var z = attr.z;
		var pz = Math.pow(2, -z);
		var tileSize = 256 * pz * 156543.033928041;
		var xSize = 360 * pz;
		if(attr.bounds) {
			var bounds = attr.bounds;
			var minx = Math.floor(bounds.minX/xSize);
			var maxx = Math.ceil(bounds.maxX/xSize);
			var miny = Math.floor(gmxAPI.merc_y(bounds.minY)/tileSize);
			var maxy = Math.ceil(gmxAPI.merc_y(bounds.maxY)/tileSize);
			var res = [];
			for (var j = miny; j <= maxy; j++)
			{
				for (var i = minx; i <= maxx; i++)
				{
					res.push({'x': i, 'y': j, 'z': z});
				}
			}
			return res;
		} else {
			var x = gmxAPI.merc_x(attr.x);
			var y = gmxAPI.merc_y(attr.y);
			var tile = {
				'x':	Math.floor(x/tileSize)
				,'y':	Math.floor(y/tileSize)
				,'z':	z
				,'posInTile': {
					'x': Math.round(256 * ((x % tileSize) / tileSize))
					,'y': Math.round(256 * ( 1 - (y % tileSize) / tileSize))
				}
			};
			return tile;						// получить атрибуты тайла по POINT
		}
	}
	,
	'getTileFromPoint': function(x, y, z)	{			// получить атрибуты тайла по POINT на определенном zoom
		return gmxAPI.chkTileList({'x':	x, 'y': y, 'z': z});
	}
	,
	'getTileListByGeometry': function(geom, zoom)	{		// получить список тайлов по Geometry для zoom
		var bounds = gmxAPI.getBounds(geom.coordinates);
		return gmxAPI.getTileListByBounds(bounds, zoom);
	}
	,
	'getTileListByBounds': function(bounds, z)	{		// получить список тайлов по bounds на определенном zoom
		return gmxAPI.chkTileList({'bounds': bounds, 'z': z});
	}
	,
	'isPageHidden': function()	{		// Видимость окна браузера
        return document.hidden || document.msHidden || document.webkitHidden || document.mozHidden || false;
	}
});

window.gmxAPI.lambertCoefX = 100*gmxAPI.distVincenty(0, 0, 0.01, 0);				// 111319.5;
window.gmxAPI.lambertCoefY = 100*gmxAPI.distVincenty(0, 0, 0, 0.01)*180/Math.PI;	// 6335440.712613423;
window.gmxAPI.serverBase = 'maps.kosmosnimki.ru';		// HostName основной карты по умолчанию
window.gmxAPI.proxyType = 'flash';						// Тип отображения
window.gmxAPI.miniMapAvailable = false;
window.gmxAPI.maxRasterZoom = 1;
window.gmxAPI.miniMapZoomDelta = -4;

	(function()
	{
		var FlashMapFeature = function(geometry, properties, layer)
		{
			this.geometry = geometry;
			this.properties = properties;
			this.layer = layer;
		}
		FlashMapFeature.prototype.getGeometry = function() { return this.geometry; }
		FlashMapFeature.prototype.getLength = function() { return gmxAPI.geoLength(this.geometry); }
		FlashMapFeature.prototype.getArea = function() { return gmxAPI.geoArea(this.geometry); }
		gmxAPI._FlashMapFeature = FlashMapFeature;
	})();

	(function()
	{
		function HandlerMode(div, event, handler)
		{
			this.div = div;
			this.event = event;
			this.handler = handler;
		}
		HandlerMode.prototype.set = function()   
		{
			if(this.div.attachEvent) this.div.attachEvent("on"+this.event, this.handler); 
			if(this.div.addEventListener) this.div.addEventListener(this.event, this.handler, false);
		}
		HandlerMode.prototype.clear = function() 
		{
			if(this.div.detachEvent) this.div.detachEvent("on"+this.event, this.handler); 
			if(this.div.removeEventListener) this.div.removeEventListener(this.event, this.handler, false);
		}

		gmxAPI._HandlerMode = HandlerMode;
	})();

	window.gmxAPI.GlobalHandlerMode = function(event, handler) { return new gmxAPI._HandlerMode(document.documentElement, event, handler); }
	
})();

// Блок методов глобальной области видимости
//var kosmosnimki_API = "1D30C72D02914C5FB90D1D448159CAB6";

var tmp = [
	'isIE', 'parseCoordinates', 'setBg', 'deselect', 'compatEvent', 'compatTarget', 'eventX', 'eventY', 'getOffsetLeft', 'getOffsetTop',
	'newStyledDiv', 'show', 'hide', 'setPositionStyle', 'position', 'bottomPosition', 'size',
	'makeImageButton', 'setVisible', 'getTextContent', 'parseXML', 'GlobalHandlerMode',
	'getScriptURL', 'getScriptBase', 'getHostAndPath', 'getBaseMapParam', 'strip', 'parseUri', 'parseColor',
	'forEachPoint',
	'merc_geometry', 'from_merc_geometry', 'getBounds', 'isRectangle', 'getScale', 'geoLength', 'geoArea', 'geoCenter',
	'parseGML', 'createGML', 'merc_x', 'from_merc_x', 'merc_y', 'from_merc_y',
	'distVincenty', 'KOSMOSNIMKI_LOCALIZED',
	'prettifyDistance', 'prettifyArea',
	'pad2', 'formatCoordinates', 'formatCoordinates2',
	'lastFlashMapId', 'newFlashMapId', 'uniqueGlobalName', 'loadVariableFromScript',
	// Не используемые в api.js
	'newDiv', 'newSpan', 'positionSize', 'merc', 'from_merc', 'formatDegrees', 'memoize', 
	'DegToRad', 'RadToDeg', 'ArcLengthOfMeridian', 'UTMCentralMeridian', 'FootpointLatitude', 'MapLatLonToXY', 'MapXYToLatLon',
	'LatLonToUTMXY', 'UTMXYToLatLon', 'trunc', 'truncate9', 'lambertCoefX', 'lambertCoefY', 'fragmentArea', 'fragmentAreaMercator', 'formatDegreesSimple',
	'convertCoords', 'transformGeometry', 'boundsIntersect', 'getTagValue', 
	'forEachPointAmb', 'deg_rad', 'deg_decimal'
];
for (var i=0; i<tmp.length; i++) window[tmp[i]] = gmxAPI[tmp[i]];

function newElement(tagName, props, style) { return gmxAPI.newElement(tagName, props, style, true); }
var getAPIFolderRoot = gmxAPI.memoize(function() { return gmxAPI.getAPIFolderRoot(); });
var getAPIHost = gmxAPI.memoize(function() { return gmxAPI.getAPIHost(); });
var getAPIHostRoot = gmxAPI.memoize(function() { return gmxAPI.getAPIHostRoot(); });

// Поддержка setHandler и Listeners
(function()
{

	var flashEvents = {		// События передающиеся в SWF
		'onClick': true
		,'onMouseDown': true
		,'onMouseUp': true
		,'onMouseOver': true
		,'onMouseOut': true
		,'onMove': true
		,'onMoveBegin': true
		,'onMoveEnd': true
		,'onResize': true
		,'onEdit': true
		,'onNodeMouseOver': true
		,'onNodeMouseOut': true
		,'onEdgeMouseOver': true
		,'onEdgeMouseOut': true
		,'onFinish': true
		,'onRemove': true
		,'onTileLoaded': true
		,'onTileLoadedURL': true
	};

	function setHandler(obj, eventName, handler) {
		var func = function(subObjectId, a, attr)
		{
			var pObj = (gmxAPI.mapNodes[subObjectId] ? gmxAPI.mapNodes[subObjectId] : new gmxAPI._FMO(subObjectId, {}, obj));		// если MapObject отсутствует создаем
            if (typeof a === 'object') {
                pObj.properties = gmxAPI.isArray(a) ? gmxAPI.propertiesFromArray(a) : a;
            }
			if('filters' in pObj) attr.layer = pObj.layer = pObj;
			else if(pObj.parent && 'filters' in pObj.parent) attr.layer = pObj.layer = pObj.parent;
			else if(pObj.parent && pObj.parent.parent && 'filters' in pObj.parent.parent) {
                attr.filter = pObj.filter = pObj.parent;
                attr.layer = pObj.layer = pObj.parent.parent;
            }
			if(!attr.latlng && 'mouseX' in attr) {
				attr.latlng = {
					'lng': gmxAPI.from_merc_x(attr.mouseX)
					,'lat': gmxAPI.from_merc_y(attr.mouseY)
				};
			}
			var flag = false;
			if(obj.handlers[eventName]) flag = handler(pObj, attr);
			if(!flag) flag = gmxAPI._listeners.dispatchEvent(eventName, obj, {'obj': pObj, 'attr': attr });
			return flag;
		};

		var callback = (handler ? func : null);
		if(callback || !obj.stateListeners[eventName]) { 	// Если есть callback или нет Listeners на обьекте
			gmxAPI._cmdProxy('setHandler', { 'obj': obj, 'attr': {
				'eventName':eventName
				,'callbackName':callback
				}
			});
		}
	}

	// Begin: Блок Listeners
	var stateListeners = {};	// Глобальные события
	
	function getArr(eventName, obj)
	{
		var arr = (obj ? 
			('stateListeners' in obj && eventName in obj.stateListeners ? obj.stateListeners[eventName] : [])
			: ( eventName in stateListeners ? stateListeners[eventName] : [])
		);
		return arr;
		//return arr.sort(function(a, b) {return (b['level'] > a['level'] ? 1 : -1);});
	}
	// Обработка пользовательских Listeners на obj
	function dispatchEvent(eventName, obj, attr)
	{
		var out = false;
		var arr = getArr(eventName, obj);
		for (var i=0; i<arr.length; i++)	// Вызываем по убыванию 'level'
		{
			if(typeof(arr[i].func) === 'function') {
                if(window.gmxAPIdebugLevel === 11) {
					out = arr[i].func(attr);
					if(out) break;				// если callback возвращает true заканчиваем цепочку вызова
				} else {
                    try {
                        out = arr[i].func(attr);
                        if(out) break;				// если callback возвращает true заканчиваем цепочку вызова
                    } catch(e) {
                        gmxAPI.addDebugWarnings({'func': 'dispatchEvent', 'handler': eventName, 'event': e, 'alert': e});
                    }
				}
			}
		}
		return out;
	}

	/** Пользовательские Listeners изменений состояния карты
	* @function addListener
	* @memberOf api - добавление прослушивателя
	* @param {eventName} название события
	* @param {func} вызываемый метод
	* @param {pID} Listener унаследован от родительского обьекта
	* @return {id} присвоенный id прослушивателя
	* @see <a href="http://mapstest.kosmosnimki.ru/api/ex_locationTitleDiv.html">» Пример использования</a>.
	* @author <a href="mailto:saleks@scanex.ru">Sergey Alexseev</a>
	*/
	function addListener(ph)
	{
		var eventName = ph['eventName'];
		var pID = ph['pID'];
		if(pID && !flashEvents[eventName]) return false;		// Если есть наследование от родительского Listener и событие не передается в SWF то выходим

		var obj = ph['obj'];
		var func = ph['func'];
		var level = ph['level'] || 0;
		var arr = getArr(eventName, obj);
		var id = (ph['evID'] ? ph['evID'] : gmxAPI.newFlashMapId());
		var pt = {"id": id, "func": func, "level": level };
		if(pID) pt['pID'] = pID;
		arr.push(pt);
		arr = arr.sort(function(a, b) {return (b['level'] > a['level'] ? 1 : -1);});
		
		if(obj) {	// Это Listener на mapObject
			obj.stateListeners[eventName] = arr;
			if('setHandler' in obj && flashEvents[eventName] && (!obj.handlers || !obj.handlers[eventName])) {
				obj.setHandler(eventName, function(){});
				delete obj.handlers[eventName];		// для установленных через addListener событий убираем handler
			}
		}
		else {		// Это глобальный Listener
			stateListeners[eventName] = arr;
		}
		return id;
	}

	/** Пользовательские Listeners изменений состояния карты
	* @function removeListener
	* @memberOf api - удаление прослушивателя
	* @param {eventName} название события
	* @param {id} вызываемый метод
	* @return {Bool} true - удален false - не найден
	* @see <a href="http://mapstest.kosmosnimki.ru/api/ex_locationTitleDiv.html">» Пример использования</a>.
	* @author <a href="mailto:saleks@scanex.ru">Sergey Alexseev</a>
	*/
	function removeListener(obj, eventName, id)
	{
		var arr = getArr(eventName, obj);
		var out = [];
		for (var i=0; i<arr.length; i++)
		{
			if(id && id != arr[i]["id"] && id != arr[i]["pID"]) out.push(arr[i]);
		}
		if(obj) {
			obj.stateListeners[eventName] = out;
			if('removeHandler' in obj && (!obj.handlers || !obj.handlers[eventName]) && out.length == 0) obj.removeHandler(eventName);
			
		}
		else stateListeners[eventName] = out;
		return true;
	}
	gmxAPI._listeners = {
		'dispatchEvent': dispatchEvent,
		'addListener': addListener,
		'removeListener': removeListener
	};
	// End: Блок Listeners

	var InitHandlersFunc = function() {
		gmxAPI.extendFMO('setHandler', function(eventName, handler) {
			setHandler(this, eventName, handler);
			this.handlers[eventName] = true;		// true если установлено через setHandler
			flashEvents[eventName] = true;
		});

		gmxAPI.extendFMO('removeHandler', function(eventName) {
			if(!(eventName in this.stateListeners) || this.stateListeners[eventName].length == 0) { 	// Если нет Listeners на обьекте
				gmxAPI._cmdProxy('removeHandler', { 'obj': this, 'attr':{ 'eventName':eventName }});
			}
			delete this.handlers[eventName];
		});

		gmxAPI.extendFMO('setHandlers', function(handlers) {
			for (var key in handlers)
				this.setHandler(key, handlers[key]);
		});

		gmxAPI.extendFMO('addListener', function(eventName, func, level) {
			var ph = {'obj':this, 'eventName': eventName, 'func': func, 'level': level};
			return addListener(ph);
		});
		//gmxAPI.extendFMO('addListener', function(eventName, func, id) {	return addListener(this, eventName, func, id); });
		//gmxAPI.extendFMO('addMapStateListener', function(eventName, func, id) {	return addListener(this, eventName, func, id); });
		gmxAPI.extendFMO('removeListener', function(eventName, id) { return removeListener(this, eventName, id); });
		gmxAPI.extendFMO('removeMapStateListener', function(eventName, id) { return removeListener(this, eventName, id); });
	};
	
	var ret = {
		'Init': InitHandlersFunc
	};
	
	//расширяем namespace
	gmxAPI._handlers = ret;
})();


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
    
    gmxAPI.domEventUtil.addHandler(window, 'message', processMessage);

    function createPostIframe2(id, callback, url)
    {
        var uniqueId = 'gmxAPI_id'+(lastRequestId++);
        
        iframe = document.createElement("iframe");
        iframe.style.display = 'none';
        iframe.setAttribute('id', id);
        iframe.setAttribute('name', id);
        iframe.src = 'javascript:true';
        iframe.callbackName = uniqueId;
        //iframe.onload = window[callbackName];
        
        var parsedURL = parseUri(url);
        var origin = (parsedURL.protocol ? (parsedURL.protocol + ':') : window.location.protocol) + '//' + (parsedURL.host || window.location.host);
        
        requests[origin] = requests[origin] || {};
        requests[origin][uniqueId] = {callback: callback, iframe: iframe};

        return iframe;
    }
    
	//расширяем namespace
    gmxAPI.createPostIframe2 = createPostIframe2;

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
            id = '$$iframe_' + gmxAPI.newFlashMapId();

        var iframe = gmxAPI.createPostIframe2(id, callback, url),
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
            if(gmxAPI.isIElt9) {
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
	gmxAPI.sendCrossDomainPostRequest = sendCrossDomainPostRequest;
})();

////
var flashMapAlreadyLoading = false;

function sendCrossDomainJSONRequest(url, callback, callbackParamName, callbackError)
{
    callbackParamName = callbackParamName || 'CallbackName';
    
	var script = document.createElement("script");
	script.setAttribute("charset", "UTF-8");
	var callbackName = gmxAPI.uniqueGlobalName(function(obj)
	{
		callback && callback(obj);
		window[callbackName] = false;
		document.getElementsByTagName("head").item(0).removeChild(script);
	});
    
    var sepSym = url.indexOf('?') == -1 ? '?' : '&';
    
	script.setAttribute("src", url + sepSym + callbackParamName + "=" + callbackName + "&" + Math.random());
	if(callbackError) script.onerror = function(e) {
		callbackError(e);
	};
	document.getElementsByTagName("head").item(0).appendChild(script);
}
gmxAPI.sendCrossDomainJSONRequest = sendCrossDomainJSONRequest;

function isRequiredAPIKey( hostName )
{
	if(!hostName) hostName = '';
	if ( hostName.indexOf("maps.kosmosnimki.ru") != -1 ) 
		return true;
		
	if (!window.apikeySendHosts) return false;
	
	for (var k = 0; k < window.apikeySendHosts.length; k++)
	{
		if (hostName.indexOf(window.apikeySendHosts[k]) != -1)
			return true;
	}
			
	return false;
}

gmxAPI.forEachNode = function(layers, callback, notVisible) {
    var forEachNodeRec = function(o, isVisible, nodeDepth)
	{
		isVisible = isVisible && !!o.content.properties.visible;
        callback(o, isVisible, nodeDepth);
		if (o.type == "group")
		{
			var a = o.content.children;
			for (var k = a.length - 1; k >= 0; k--)
				forEachNodeRec(a[k], isVisible, nodeDepth + 1);
		}
	}
    
    for (var k = layers.children.length - 1; k >= 0; k--) {
        forEachNodeRec(layers.children[k], !notVisible, 0)
    }
}

function forEachLayer(layers, callback, notVisible) {
    gmxAPI.forEachNode(layers, function(node, isVisible, nodeDepth) {
        node.type === 'layer' && callback(node.content, isVisible, nodeDepth);
    }, notVisible)
}

gmxAPI.forEachLayer = forEachLayer;

var APIKeyResponseCache = {};
var sessionKeyCache = {};
var KOSMOSNIMKI_SESSION_KEY = false;
var alertedAboutAPIKey = false;

function loadMapJSON(hostName, mapName, callback, onError)
{
	if(typeof(callback) !== 'function') {
		gmxAPI.addDebugWarnings({'hostName': hostName, 'mapName': mapName, 'alert': 'loadMapJSON: bad callback function'});
		if(typeof(onError) === 'function') onError();
		return false;
	}
	//if(window.apikeyRequestHost) hostName = window.apikeyRequestHost;
	if (hostName.indexOf("http://") == 0)
		hostName = hostName.slice(7);
	if (hostName.charAt(hostName.length-1) == '/')
		hostName = hostName.slice(0, -1);
		
	//относительный путь в загружаемой карте
	if (hostName.charAt(0) == '/')
		hostName = getAPIHost() + hostName;

	var configFlag = false;
	if (!gmxAPI.getScriptURL("config.js")) {
		gmxAPI.loadVariableFromScript(
			gmxAPI.getAPIFolderRoot() + "config.js",
			"apiKey",
			function(key) { configFlag = true; }
			,
			function() { configFlag = true; }	// Нет config.js
		);
	} else {
		configFlag = true;	
	}
		
	if (flashMapAlreadyLoading || !configFlag)
	{
		setTimeout(function() { loadMapJSON(hostName, mapName, callback, onError); }, 200);
		return;
	}

	var alertAboutAPIKey = function(message)
	{
		if (!alertedAboutAPIKey)
		{
			alert(message);
			alertedAboutAPIKey = true;
		}
	}

	flashMapAlreadyLoading = true;

	var finish = function()
	{
		var key = window.KOSMOSNIMKI_SESSION_KEY;
		if (key == "INVALID")
			key = false;

		sendCrossDomainJSONRequest(
			"http://" + hostName + "/TileSender.ashx?ModeKey=map&MapName=" + encodeURIComponent(mapName) + (key ? ("&key=" + encodeURIComponent(key)) : "") + "&" + Math.random(),
			function(response)
			{
				if(response && response['Status'] === 'ok' && response['Result']) {
					var layers = response['Result'];
					if (layers)
					{
                        gmxAPI._tmpMaps[layers.properties.name] = layers;
						layers.properties.hostName = hostName;
						window.sessionKeyCache[mapName] = layers.properties.MapSessionKey;
						forEachLayer(layers, function(layer)
						{ 
							layer.properties.mapName = layers.properties.name;
							layer.properties.hostName = hostName;
							//layer.mercGeometry = layer.geometry;
							//delete layer.geometry;
							//layer.mercGeometry = gmxAPI.clone(layer.geometry);
							//layer.geometry = gmxAPI.from_merc_geometry(layer.geometry);
						});
					}
					callback(layers);
					flashMapAlreadyLoading = false;
				} else {
					flashMapAlreadyLoading = false;
					if (onError) onError();
					else callback(layers);
				}
			}
			,null
			,function(ev)
			{
				var txt = gmxAPI.KOSMOSNIMKI_LOCALIZED("Сбой при получении карты!", "Error in map request!");
				gmxAPI.addDebugWarnings({'func': 'TileSender.ashx?ModeKey=map&MapName=' + mapName, 'handler': 'sendCrossDomainJSONRequest', 'alert': txt});
				if (onError) onError();
				else callback(null);
			}
		);
	}

	if ( isRequiredAPIKey( hostName ) )
	{
		var haveNoAPIKey = function()
		{
			alertAboutAPIKey(gmxAPI.KOSMOSNIMKI_LOCALIZED("Не указан API-ключ!", "API key not specified!"));
			window.KOSMOSNIMKI_SESSION_KEY = "INVALID";
			finish();
		}

		var useAPIKey = function(key)
		{
			var processResponse = function(response)
			{
				if (response.Result.Status)
					window.KOSMOSNIMKI_SESSION_KEY = response.Result.Key;
				else {
					var txt = gmxAPI.KOSMOSNIMKI_LOCALIZED("Указан неверный API-ключ!", "Incorrect API key specified!");
					gmxAPI.addDebugWarnings({'func': 'useAPIKey', 'handler': 'processResponse', 'alert': txt});
					//alertAboutAPIKey(gmxAPI.KOSMOSNIMKI_LOCALIZED("Указан неверный API-ключ!", "Incorrect API key specified!"));
				}
				finish();
			}
			if (APIKeyResponseCache[key])
				processResponse(APIKeyResponseCache[key]);
			else
			{
				var apikeyRequestHost = window.apikeyRequestHost  ? window.apikeyRequestHost  : "maps.kosmosnimki.ru";
//finish();
//return;
				sendCrossDomainJSONRequest(
					"http://" + apikeyRequestHost + "/ApiKey.ashx?WrapStyle=func&Key=" + key,
					function(response)
					{
						APIKeyResponseCache[key] = response;
						processResponse(response);
					}
					,null
					,function(ev)
					{
						var txt = gmxAPI.KOSMOSNIMKI_LOCALIZED("Сбой при получении API-ключа!", "Error in API key request!");
						gmxAPI.addDebugWarnings({'func': 'useAPIKey', 'handler': 'sendCrossDomainJSONRequest', 'alert': txt});
						//alertAboutAPIKey(gmxAPI.KOSMOSNIMKI_LOCALIZED("Указан неверный API-ключ!", "Incorrect API key specified!"));
						finish();
					}
					
				);
			}
		}
		var apiHost = gmxAPI.parseUri(window.location.href).hostOnly;
		if (apiHost == '') 
			apiHost = 'localhost';
		var apiKeyResult = gmxAPI.getAPIKey();

		if (apiKeyResult)
			useAPIKey(apiKeyResult[1]);
		else if (window.apiKey)
			useAPIKey(window.apiKey);
		else if ((apiHost == "localhost") || apiHost.match(/127\.\d+\.\d+\.\d+/))
			useAPIKey("localhost");
		else if (!gmxAPI.getScriptURL("config.js"))
			gmxAPI.loadVariableFromScript(
				gmxAPI.getAPIFolderRoot() + "config.js",
				"apiKey",
				function(key)
				{
					if (key)
						useAPIKey(key);
					else
						haveNoAPIKey();			// Нет apiKey в config.js
				}
				,
				function() { haveNoAPIKey(); }	// Нет config.js
			);
		else
			haveNoAPIKey();
	}
	else
		finish();
}
function createFlashMap(div, arg1, arg2, arg3)
{
	if (!arg2 && !arg3 && typeof(arg1) === 'function')
		createKosmosnimkiMapInternal(div, false, arg1);
	else
	{
		var hostName, mapName, callback;
		if (arg3)
		{
			hostName = arg1;
			mapName = arg2;
			callback = arg3;
		}
		else
		{
			hostName = getAPIHost();
			mapName = arg1;
			callback = arg2;
		}
		//hostName = 'maps.kosmosnimki.ru';
		var uri = gmxAPI.parseUri(hostName);
		if(uri.host) gmxAPI.serverBase = uri.host;						// HostName основной карты переопределен
        gmxAPI.currentMapName = mapName; // текущая карта

        var loadStart = function() {
            // ID базовой карты подложек
            gmxAPI.kosmosnimki_API = gmxAPI.getBaseMapParam("id", gmxAPI.kosmosnimki_API);
            loadMapJSON(hostName, mapName, function(layers)
            {
                if (layers != null) {
                    gmxAPI.currentMapName = layers.properties.name; // Получили текущую карту
                    window.KOSMOSNIMKI_LANGUAGE = window.KOSMOSNIMKI_LANGUAGE || {'eng': 'English', 'rus': 'Russian'}[layers.properties.DefaultLanguage];
                    var UseKosmosnimkiAPI = gmxAPI.currentMapName === gmxAPI.kosmosnimki_API ? false : layers.properties.UseKosmosnimkiAPI;
                    (UseKosmosnimkiAPI ? createKosmosnimkiMapInternal : createFlashMapInternal)(div, layers, callback);
                    //createKosmosnimkiMapInternal(div, layers, callback);
                }
                else
                    callback(null);
            });
        }
        if (!gmxAPI.getScriptURL("config.js")) {
            gmxAPI.loadVariableFromScript(
                gmxAPI.getAPIFolderRoot() + "config.js",
                "baseMap",
                loadStart,
                loadStart			// Есть config.js
            );
        } else {
            loadStart();
        }
	}
	return true;
}

window.createKosmosnimkiMap = createFlashMap;
window.makeFlashMap = createFlashMap;

(function(){
var flashId = gmxAPI.newFlashMapId();
var FlashMapObject = function(objectId_, properties_, parent_)
{
	this.objectId = objectId_;
	if (!properties_) properties_ = {};
	for (var key in properties_)
		if (properties_[key] == "null")
			properties_[key] = "";
	this.properties = properties_;
	this.parent = parent_;
	this.isRemoved = false;
	this.flashId = flashId;
	this._attr = {};			// Дополнительные атрибуты
	this.stateListeners = {};	// Пользовательские события
	this.handlers = {};			// Пользовательские события во Flash
	//this.maxRasterZoom = 1;		// Максимальный зум растровых слоев
	this.childsID = {};			// Хэш ID потомков
}
// расширение FlashMapObject
gmxAPI.extendFMO = function(name, func) {	FlashMapObject.prototype[name] = func;	}
gmxAPI._FMO = FlashMapObject;

// Для MapObject
FlashMapObject.prototype.bringToTop = function() { return gmxAPI._cmdProxy('bringToTop', { 'obj': this }); }
FlashMapObject.prototype.bringToBottom = function() { return gmxAPI._cmdProxy('bringToBottom', { 'obj': this }); }
FlashMapObject.prototype.bringToDepth = function(n) { return gmxAPI._cmdProxy('bringToDepth', { 'obj': this, 'attr':{'zIndex':n} }); }
FlashMapObject.prototype.setDepth = FlashMapObject.prototype.bringToDepth;
FlashMapObject.prototype.startDrawing = function(type) { gmxAPI._cmdProxy('startDrawing', { 'obj': this, 'attr':{'type':type} }); }
FlashMapObject.prototype.stopDrawing = function(type) { gmxAPI._cmdProxy('stopDrawing', { 'obj': this }); }
FlashMapObject.prototype.isDrawing = function() { return gmxAPI._cmdProxy('isDrawing', { 'obj': this }); }
FlashMapObject.prototype.setLabel = function(label) { gmxAPI._cmdProxy('setLabel', { 'obj': this, 'attr':{'label':label} }); }

FlashMapObject.prototype.setStyle = function(style, activeStyle) { var attr = {'regularStyle':style, 'hoveredStyle':activeStyle}; gmxAPI._cmdProxy('setStyle', { 'obj': this, 'attr':attr }); gmxAPI._listeners.dispatchEvent('onSetStyle', this, attr); }
FlashMapObject.prototype.getStyle = function( removeDefaults ) { var flag = (typeof removeDefaults == 'undefined' ? false : removeDefaults); return gmxAPI._cmdProxy('getStyle', { 'obj': this, 'attr':flag }); }
FlashMapObject.prototype.getVisibleStyle = function() { return gmxAPI._cmdProxy('getVisibleStyle', { 'obj': this }); }

FlashMapObject.prototype.getVisibility = function() {
	var val = true;
	if('isVisible' in this) {
		var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
		var curZ = currPos['z'];
		if (this.minZoom && this.minZoom > curZ) val = false;
		else if(this.maxZoom && this.maxZoom < curZ) val = false;
		else val = this.isVisible;
		if(val && this.parent) val = this.parent.getVisibility();
	} else {
		val = gmxAPI._cmdProxy('getVisibility', { 'obj': this })
	}
	return val;
}
FlashMapObject.prototype.setVisible = function(flag, notDispatch) {
	gmxAPI._cmdProxy('setVisible', { 'obj': this, 'attr': flag, 'notView': notDispatch });
	var val = (flag ? true : false);
	if (val && 'backgroundColor' in this && this != gmxAPI.map.miniMap)
		gmxAPI.map.setBackgroundColor(this.backgroundColor);

	var prev = this.isVisible;
	this.isVisible = val;
	if(prev != val && !notDispatch) gmxAPI._listeners.dispatchEvent('onChangeVisible', this, val);	// Вызов Listeners события 'onChangeVisible'
	if (this.copyright && 'updateCopyright' in gmxAPI.map)
		gmxAPI.map.updateCopyright();
}

FlashMapObject.prototype.getChildren = function()
{
	var arr = gmxAPI._cmdProxy('getChildren', { 'obj': this });
	var ret = [];
	for (var i = 0; i < arr.length; i++) {
		var id = arr[i].id;
		var pObj = (gmxAPI.mapNodes[id] ? gmxAPI.mapNodes[id] : new FlashMapObject(id, {}, this));		// если MapObject отсутствует создаем
		//pObj.properties = gmxAPI.propertiesFromArray(arr[i].properties);
		var a = arr[i].properties;
        
		//if(typeof(a) === 'object') pObj.properties = ('sort' in a ? gmxAPI.propertiesFromArray(a) : a);
        if (typeof a === 'object') {
            pObj.properties = gmxAPI.isArray(a) ? gmxAPI.propertiesFromArray(a) : a;
        }
        
		ret.push(pObj);
	}
	return ret;
}

if(gmxAPI._handlers) gmxAPI._handlers.Init();		// Инициализация handlers

FlashMapObject.prototype.addObjectsFromSWF = function(url) {
	gmxAPI._cmdProxy('addObjectsFromSWF', {'obj': this, 'attr':{'url':url}}); // Отправить команду в SWF
}
/** Добавление набора статических объектов на карту
* @function
* @ignore
* @memberOf api
* @param {array} data массив добавляемых обьектов
* @return {array} массив добавленных обьектов
* @author <a href="mailto:saleks@scanex.ru">Sergey Alexseev</a>
*/
FlashMapObject.prototype.addObjects = function(data, format) {
	return gmxAPI._cmdProxy('addObjects', {'obj': this, 'attr':{'arr': data, 'format': format}}); // Отправить команду в SWF
}
FlashMapObject.prototype.addObject = function(geometry, props, propHiden) {
	var objID = gmxAPI._cmdProxy('addObject', { 'obj': this, 'attr':{ 'geometry':geometry, 'properties':props, 'propHiden':propHiden }});
	if(!objID) objID = false;
	var pObj = new FlashMapObject(objID, props, this);	// обычный MapObject
	// пополнение mapNodes
	var currID = (pObj.objectId ? pObj.objectId : gmxAPI.newFlashMapId() + '_gen1');
	gmxAPI.mapNodes[currID] = pObj;
	if(pObj.parent) {
		pObj.parent.childsID[currID] = true;
		if(pObj.parent.isMiniMap) {
			pObj.isMiniMap = true;			// Все добавляемые к миникарте ноды имеют этот признак
		}
	}
	if(propHiden) pObj.propHiden = propHiden;
	pObj.isVisible = true;
	return pObj;
}

FlashMapObject.prototype.remove = function()
{
	if(this.isRemoved) return false;									// Обьект уже был удален
	if(this.copyright && 'removeCopyrightedObject' in gmxAPI.map)
		gmxAPI.map.removeCopyrightedObject(this);
		
	if(this.objectId) {
		gmxAPI._cmdProxy('remove', { 'obj': this}); // Удалять в SWF только если там есть обьект
		if(this.parent) delete this.parent.childsID[this.objectId];
		delete gmxAPI.mapNodes[this.objectId];
	}
    // чистка mapNodes
    for(id in this.childsID) {
        gmxAPI.mapNodes[id].remove();
        delete gmxAPI.mapNodes[id];
    }

	if(this.properties) {
		if(this.propHiden && this.propHiden.isLayer) {		// Это слой
			gmxAPI._listeners.dispatchEvent('BeforeLayerRemove', this, this.properties.name);	// Удаляется слой
            if('_clearLayer' in this) this._clearLayer(this.properties.name);
            gmxAPI._listeners.dispatchEvent('onLayerRemove', gmxAPI.map, this);	// Удален слой
        }
	}
	this.isRemoved = true;
}
FlashMapObject.prototype.setGeometry = function(geometry) {
	gmxAPI._cmdProxy('setGeometry', { 'obj': this, 'attr':geometry });
}
FlashMapObject.prototype.getGeometry = function() 
{ 
	var geom = gmxAPI._cmdProxy('getGeometry', { 'obj': this });
	if(!geom) return null;
	return geom;
}
FlashMapObject.prototype.getLength = function(arg1, arg2, arg3, arg4)
{
	var out = 0;
	if(arg1) out = gmxAPI.geoLength(arg1, arg2, arg3, arg4);
	else out = gmxAPI._cmdProxy('getLength', { 'obj': this });
	return out;
}
FlashMapObject.prototype.getArea = function(arg)
{
	var out = 0;
	if(arg) out = gmxAPI.geoArea(arg);
	else out = gmxAPI._cmdProxy('getArea', { 'obj': this });
	return out;
}
FlashMapObject.prototype.getGeometryType = function()
{
	return gmxAPI._cmdProxy('getGeometryType', { 'obj': this });
}
FlashMapObject.prototype.setPoint = function(x, y) { this.setGeometry({ type: "POINT", coordinates: [x, y] }); }
FlashMapObject.prototype.setLine = function(coords) { this.setGeometry({ type: "LINESTRING", coordinates: coords }); }
FlashMapObject.prototype.setPolygon = function(coords) { this.setGeometry({ type: "POLYGON", coordinates: [coords] }); }
FlashMapObject.prototype.setRectangle = function(x1, y1, x2, y2) { this.setPolygon([[x1, y1], [x1, y2], [x2, y2], [x2, y1]]); }
FlashMapObject.prototype.setCircle = function(x, y, r)
{
	function v_fi (fi, a, b)
	{
		return [
			-Math.cos(fi)*Math.sin(a)+Math.sin(fi)*Math.sin(b)*Math.cos(a),
			Math.cos(fi)*Math.cos(a)+Math.sin(fi)*Math.sin(b)*Math.sin(a),
			-Math.sin(fi)*Math.cos(b)
		];
	}

	var n = 360;            //кол-во точек
	var a = Math.PI*x/180;  //долгота центра окружности в радианах
	var b = Math.PI*y/180;  //широта центра окружности в радианах

	var R = 6372795; // Радиус Земли
	//      6378137 - Некоторые источники дают такое число.

	var d = R * Math.sin(r / R);
	var Rd = R * Math.cos(r / R);
	var VR = [];
	VR[0] = Rd * Math.cos(b) * Math.cos(a);
	VR[1] = Rd * Math.cos(b) * Math.sin(a);
	VR[2] = Rd * Math.sin(b);

	var circle = [],
        coordinates = [],
        t1 = 0, t2 = 0;

	for (var fi = 0; fi < 2*Math.PI + 0.000001; fi += (2*Math.PI/n))
	{
		var v = v_fi(fi, a, b);
		for (var i=0; i<3; i++)
			circle[i] = VR[i] + d*v[i];

		t1 = (180*Math.asin(circle[2]/R)/Math.PI);
		var r = Math.sqrt(circle[0]*circle[0]+circle[1]*circle[1]);
		t2 = circle[1]<0 ? -180*Math.acos(circle[0]/r)/Math.PI :
			180*Math.acos(circle[0]/r)/Math.PI;

		if (t2 < x - 180)
			t2 += 360;
		else if (t2 > x + 180)
			t2 -= 360;

		coordinates.push([t2, t1]);
	}
    if(coordinates.length > 0 && (coordinates[0][0] !== t2 || coordinates[0][1] !== t1)) {
        coordinates.push(coordinates[0]);
    }

	this.setPolygon(coordinates);
}
FlashMapObject.prototype.clearBackgroundImage = function() { gmxAPI._cmdProxy('clearBackgroundImage', { 'obj': this}); }
FlashMapObject.prototype.setImageExtent = function(attr)
{
	if(gmxAPI.proxyType === 'flash') this.setStyle({ fill: { color: 0x000000, opacity: 100 } });
    if (attr.notSetPolygon)
	{
		this.setPolygon([
			[attr.extent.minX, attr.extent.maxY],
			[attr.extent.maxX, attr.extent.maxY],
			[attr.extent.maxX, attr.extent.minY],
			[attr.extent.minX, attr.extent.minY],
			[attr.extent.minX, attr.extent.maxY]
		]);
	}
	gmxAPI._cmdProxy('setImageExtent', { 'obj': this, 'attr':attr});
}
FlashMapObject.prototype.setImageOverlay = function(url, x1, y1, flagGeo)
{
    this.setImageExtent({
        url: url
        ,extent: {
			minX: x1
            ,minY: y1
			,maxX: x1
            ,maxY: y1
        }
        ,notSetPolygon: flagGeo || false
    });
}

FlashMapObject.prototype.setImageTransform = function(url, x1, y1, x2, y2, x3, y3, x4, y4, tx1, ty1, tx2, ty2, tx3, ty3, tx4, ty4)
{
    var styles = this.getStyle();
    if(!styles.regular) this.setStyle({ fill: { color: 0x000000, opacity: 100 } });
	var attr = {};
	if (tx1) {
		attr = {
			'x1': tx1, 'y1': ty1, 'x2': tx2, 'y2': ty2, 'x3': tx3, 'y3': ty3, 'x4': tx4, 'y4': ty4
			,'tx1': x1, 'ty1': y1, 'tx2': x2, 'ty2': y2, 'tx3': x3, 'ty3': y3, 'tx4': x4, 'ty4': y4
		};
	}
	else
	{
		if(gmxAPI.proxyType === 'flash') this.setPolygon([[x1, y1], [x2, y2], [x3, y3], [x4, y4], [x1, y1]]);
		attr = {
			'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2, 'x3': x3, 'y3': y3, 'x4': x4, 'y4': y4
		};
	}
	attr['url'] = url;
	gmxAPI._cmdProxy('setImage', { 'obj': this, 'attr':attr});
}
FlashMapObject.prototype.setImagePoints = function(attr) {
	gmxAPI._cmdProxy('setImagePoints', { 'obj': this, 'attr':attr});
}
FlashMapObject.prototype.setImage = FlashMapObject.prototype.setImageTransform;

FlashMapObject.prototype.getGeometrySummary = function()
{
	var out = '';
	var geom = this.getGeometry();
	var geomType = (geom ? geom.type : '');
	if(geom) {
		if (geomType.indexOf("POINT") != -1)
		{
			var c = geom.coordinates;
			out = "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Координаты:", "Coordinates:") + "</b> ";
			out += gmxAPI.formatCoordinates(gmxAPI.merc_x(c[0]), gmxAPI.merc_y(c[1]));
		}
		else if (geomType.indexOf("LINESTRING") != -1) {
			out = "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Длина:", "Length:") + "</b> ";
			out += gmxAPI.prettifyDistance(this.getLength(geom));
		}
		else if (geomType.indexOf("POLYGON") != -1) {
			out = "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Площадь:", "Area:") + "</b> ";
			//var area = this.getArea();
			var area = this.getArea(geom);
			out += gmxAPI.prettifyArea(area);
		}
	}
	return out;
}

FlashMapObject.prototype.getCenter = function(arg1, arg2, arg3, arg4)
{
	var out = 0;
	if(arg1) out = gmxAPI.geoCenter(arg1, arg2, arg3, arg4);
	else out = gmxAPI._cmdProxy('getCenter', { 'obj': this });
	return out;
}

FlashMapObject.prototype.setToolImage = function(imageName, activeImageName)
{
	var apiBase = gmxAPI.getAPIFolderRoot();
	this.setStyle(
		{ marker: { image: apiBase + "img/" + imageName } },
		activeImageName ? { marker: { image: apiBase + "img/" + activeImageName } } : null
	);
}

// Для Filter
FlashMapObject.prototype.flip = function() { return gmxAPI._cmdProxy('flip', { 'obj': this }); }

FlashMapObject.prototype.setFilter = function(sql) {
	var ret = false;
	if(this.parent && 'filters' in this.parent) {
		if(!sql) sql ='';
		this._sql = sql;			// атрибуты фильтра установленные юзером
		ret = gmxAPI._cmdProxy('setFilter', { 'obj': this, 'attr':{ 'sql':sql }});

		if(!this.clusters && '_Clusters' in gmxAPI) {
			this.clusters = new gmxAPI._Clusters(this);	// атрибуты кластеризации потомков по фильтру
		}
		if(this.clusters && this.clusters.attr) {
			this.setClusters(this.clusters.attr);
		}
	} else {
		return this.setVisibilityFilter(sql);
	}
	return ret;
}

FlashMapObject.prototype.setVisibilityFilter = function(sql) {
	if(!sql) sql ='';
	this._sqlVisibility = sql;			// атрибуты фильтра видимости mapObject установленные юзером
	var ret = gmxAPI._cmdProxy('setVisibilityFilter', { 'obj': this, 'attr':{ 'sql':sql }});
	return ret;
}

// Для minimap
FlashMapObject.prototype.positionWindow = function(x1, y1, x2, y2) { gmxAPI._cmdProxy('positionWindow', { 'obj': this, 'attr':{'x1':x1, 'y1':y1, 'x2':x2, 'y2':y2} }); }

// Возможно только для Layer
FlashMapObject.prototype.getIntermediateLength = function() { return gmxAPI._cmdProxy('getIntermediateLength', { 'obj': this }); }
FlashMapObject.prototype.getCurrentEdgeLength = function() { return gmxAPI._cmdProxy('getCurrentEdgeLength', { 'obj': this }); }
FlashMapObject.prototype.setEditable = function() { gmxAPI._cmdProxy('setEditable', { 'obj': this }); }
FlashMapObject.prototype.setTileCaching = function(flag) { gmxAPI._cmdProxy('setTileCaching', { 'obj': this, 'attr':{'flag':flag} }); }
FlashMapObject.prototype.setDisplacement = function(dx, dy) { gmxAPI._cmdProxy('setDisplacement', { 'obj': this, 'attr':{'dx':dx, 'dy':dy} }); }
FlashMapObject.prototype.setBackgroundTiles = function(imageUrlFunction, projectionCode, minZoom, maxZoom, minZoomView, maxZoomView, attr) {
	var ph = {
		'func':imageUrlFunction
		,'projectionCode':projectionCode
		,'minZoom':minZoom
		,'maxZoom':maxZoom
		,'minZoomView':minZoomView
		,'maxZoomView':maxZoomView
	};
	if(attr) {
		if('subType' in attr) ph['subType'] = attr['subType'];
	}
	if(!('setPositionOffset' in this)) {
        this.setPositionOffset = function(dx, dy) {
            gmxAPI._cmdProxy('setPositionOffset', { 'obj': this, 'attr':{deltaX:dx, deltaY: dy} });
        }
    }
    
	gmxAPI._cmdProxy('setBackgroundTiles', {'obj': this, 'attr':ph });
	gmxAPI._listeners.dispatchEvent('onLayerAdd', gmxAPI.map, this);	// Добавлен слой
}
FlashMapObject.prototype.setTiles = FlashMapObject.prototype.setBackgroundTiles;

FlashMapObject.prototype.setActive = function(flag) { gmxAPI._cmdProxy('setActive', { 'obj': this, 'attr':{'flag':flag} }); }
FlashMapObject.prototype.setVectorTiles = function(dataUrlFunction, cacheFieldName, dataTiles, filesHash) 
{
	var ph = {'tileFunction': dataUrlFunction, 'cacheFieldName':cacheFieldName, 'filesHash':filesHash, 'dataTiles':dataTiles};
	if(this.properties && this.properties['tilesVers']) ph['tilesVers'] = this.properties['tilesVers'];
	gmxAPI._cmdProxy('setVectorTiles', { 'obj': this, 'attr':ph });
}

// Для Layer
FlashMapObject.prototype.getDepth = function(attr) { return gmxAPI._cmdProxy('getDepth', { 'obj': this }); }
FlashMapObject.prototype.getZoomBounds = function() { return gmxAPI._cmdProxy('getZoomBounds', { 'obj': this }); }
FlashMapObject.prototype.setZoomBounds = function(minZoom, maxZoom) {
	this.minZoom = minZoom;
	this.maxZoom = maxZoom;
	return gmxAPI._cmdProxy('setZoomBounds', { 'obj': this, 'attr':{'minZ':minZoom, 'maxZ':maxZoom} });
}

FlashMapObject.prototype.setCopyright = function(copyright, z1, z2, geo)
{
	if('addCopyrightedObject' in gmxAPI.map) {
		this.copyright = copyright;
		gmxAPI.map.addCopyrightedObject(this, copyright, z1, z2, geo);
	}
}
FlashMapObject.prototype.setBackgroundColor = function(color)
{
	this.backgroundColor = color;
	gmxAPI._cmdProxy('setBackgroundColor', { 'obj': this, 'attr':color });
}
FlashMapObject.prototype.addOSM = function() { var osm = this.addObject(); osm.setOSMTiles(); return osm; }

// keepGeometry - если не указан или false, объект будет превращён в полигон размером во весь мир (показывать OSM везде), 
//                иначе геометрия не будет изменяться (например, чтобы делать вклейки из OSM в другие тайлы)
FlashMapObject.prototype.setOSMTiles = function( keepGeometry)
{
	if (!keepGeometry)
		this.setPolygon([-180, -85, -180, 85, 180, 85, 180, -85, -180, -85]);
		
	var func = window.OSMTileFunction ? window.OSMTileFunction : function(i, j, z)
	{
		//return "http://b.tile.openstreetmap.org/" + z + "/" + i + "/" + j + ".png";
		var letter = ["a", "b", "c", "d"][((i + j)%4 + 4)%4];
		//return "http://" + letter + ".tile.osmosnimki.ru/kosmo" + gmxAPI.KOSMOSNIMKI_LOCALIZED("", "-en") + "/" + z + "/" + i + "/" + j + ".png";
		//return "http://" + letter + ".tile.osm.kosmosnimki.ru/kosmo" + gmxAPI.KOSMOSNIMKI_LOCALIZED("", "-en") + "/" + z + "/" + i + "/" + j + ".png";
		return "http://" + letter + ".tile.osm.kosmosnimki.ru/kosmo" + gmxAPI.KOSMOSNIMKI_LOCALIZED("", "-en") + "/" + z + "/" + i + "/" + j + ".png";
	}

	var urlOSM = "http://{s}.tile.osmosnimki.ru/kosmo" + gmxAPI.KOSMOSNIMKI_LOCALIZED("", "-en") + "/{z}/{x}/{y}.png";
	this._subdomains = 'abcd';
	this._urlOSM = urlOSM;
	if (gmxAPI.proxyType === 'leaflet' && window.OSMhash) {			// Это leaflet версия
		this._subdomains = window.OSMhash.subdomains;
		this._urlOSM = window.OSMhash.urlOSM;
	}

	this.setBackgroundTiles(function(i, j, z)
	{
		var size = Math.pow(2, z - 1);
		return func(i + size, size - j - 1, z);
	}, 1);
	
	this.setCopyright(gmxAPI.KOSMOSNIMKI_LOCALIZED("&copy; участники OpenStreetMap", "&copy; OpenStreetMap contributers") + ", <a href='http://www.opendatacommons.org/licenses/odbl/'>ODbL</a>");
	this.setBackgroundColor(0xffffff);
	this.setTileCaching(false);
}

/* не используется
FlashMapObject.prototype.loadJSON = function(url)
{
	flashDiv.loadJSON(this.objectId, url);
}
*/

// Будут внешние
FlashMapObject.prototype.loadGML = function(url, func)
{
	var me = this;
	var _hostname = gmxAPI.getAPIHostRoot() + "ApiSave.ashx?get=" + encodeURIComponent(url);
	sendCrossDomainJSONRequest(_hostname, function(response)
	{
		if(typeof(response) != 'object' || response['Status'] != 'ok') {
			gmxAPI.addDebugWarnings({'_hostname': _hostname, 'url': url, 'Error': 'bad response'});
			return;
		}
		var geometries = gmxAPI.parseGML(response['Result']);
		for (var i = 0; i < geometries.length; i++)
			me.addObject(geometries[i], null);
		if (func)
			func();
	})
}
FlashMapObject.prototype.loadWFS = FlashMapObject.prototype.loadGML;

/** Заружает WMS слои как подъобъекты данного объекта. Слои добавляются невидимыми
	@param url {string} - URL WMS сервера
	@param func {function} - ф-ция, которая будет вызвана когда WMS слои добавятся на карту.
*/
FlashMapObject.prototype.loadWMS = function(url, func)
{
	gmxAPI._loadWMS(gmxAPI.map, this, url, func);
}

FlashMapObject.prototype.loadMap = function(arg1, arg2, arg3)
{
	var hostName = gmxAPI.map.defaultHostName;
	var mapName = null;
	var callback = null;
	if (arg3)
	{
		hostName = arg1;
		mapName = arg2;
		callback = arg3;
	}
	else if (arg2)
	{
		if (typeof(arg2) == 'function')
		{
			mapName = arg1;
			callback = arg2;
		}
		else
		{
			hostName = arg1;
			mapName = arg2;
		}
	}
	else
		mapName = arg1;
	var me = this;
	loadMapJSON(hostName, mapName, function(layers)
	{
		me.addLayers(layers, true);
		if (callback)
			callback(layers);
	});
}

function createFlashMapInternal(div, layers, callback)
{
	//var prop = layers.properties;
	// if(prop && prop.name) {
        //gmxAPI._tmpMaps[prop.name] = layers;
	// if(prop && gmxAPI.currentMapName !== gmxAPI.kosmosnimki_API && prop.name == gmxAPI.kosmosnimki_API) {
		// if (prop.OnLoad)		//  Обработка маплета базовой карты
		// {
			// try { eval("_kosmosnimki_temp=(" + prop.OnLoad + ")")(); }
			// catch (e) {
				// gmxAPI.addDebugWarnings({'func': 'createKosmosnimkiMapInternal', 'handler': 'маплет карты', 'event': e, 'alert': 'Error in "'+layers.properties.title+'" mapplet: ' + e});
			// }
		// }
	// }
    // }

	gmxAPI._div = div;	// DOM элемент - контейнер карты
	if (div.style.position != "absolute")
		div.style.position = "relative";

	history.navigationMode = 'compatible';
	var body = document.getElementsByTagName("body").item(0);
	if (body && !body.onunload)
		body.onunload = function() {};
	if (!window.onunload)
		window.onunload = function() {};

	var apiBase = gmxAPI.getAPIFolderRoot();

	//var focusLink = document.createElement("a");

	//gmxAPI._dispatchEvent = gmxAPI._listeners.dispatchEvent;
	//addListener = gmxAPI._listeners.addListener;
	//removeListener = gmxAPI._listeners.removeListener;

	var loadCallback = function(rootObjectId)
	{
		var flashDiv = document.getElementById(flashId);
		if (!flashDiv || !gmxAPI.isProxyReady())
		{
			setTimeout(function() { loadCallback(rootObjectId); }, 100);
			return;
		}

		gmxAPI.flashDiv = flashDiv;
		flashDiv.style.MozUserSelect = "none";

		var layers = gmxAPI._tmpMaps[gmxAPI.currentMapName];
		gmxAPI._baseLayersArr = null;
		gmxAPI._baseLayersHash = {};    // видимые ID подложек из описания текущей карты
        if(layers) {
            var prop = layers.properties || {};
            var arr = (prop.BaseLayers ? JSON.parse(prop.BaseLayers) : null);
            gmxAPI._baseLayersArr = gmxAPI.isArray(arr) ? arr : null;
            if(gmxAPI._baseLayersArr) {
                for (var i = 0, len = gmxAPI._baseLayersArr.length; i < len; i++) {
                    var id = gmxAPI._baseLayersArr[i];
                    gmxAPI._baseLayersHash[id] = true;
                }
            }
        }
        
		var baseMap = gmxAPI._tmpMaps[gmxAPI.kosmosnimki_API];
		var map = gmxAPI._addNewMap(rootObjectId, layers || baseMap, callback);
        if(baseMap) {
			map.addLayers(baseMap, false, true);		// добавление основной карты
            if (baseMap.properties.OnLoad)		//  Обработка маплета базовой карты
            {
                var runStr = "_kosmosnimki_temp=(" + baseMap.properties.OnLoad + ")";
                try { eval(runStr)(map); }
                catch (e) {
                    gmxAPI.addDebugWarnings({'func': 'createKosmosnimkiMapInternal', 'handler': 'маплет карты', 'event': e, 'alert': 'Error in "'+layers.properties.title+'" mapplet: ' + e});
                }
            }
            //delete gmxAPI._tmpMaps[gmxAPI.kosmosnimki_API];
        }
        if (gmxAPI._baseLayersArr && gmxAPI._baseLayersArr.length) {
            map.needSetMode = gmxAPI._baseLayersArr[0];
            map.baseLayersManager.setActiveIDs(gmxAPI._baseLayersArr);
        }
		if (callback) {
			try {
				callback(gmxAPI.map, layers);		// Вызов createFlashMapInternal
			} catch(e) {
				gmxAPI.addDebugWarnings({'func': 'createFlashMapInternal', 'event': e, 'alert': 'Error in:\n "'+layers.properties.OnLoad+'"\n Error: ' + e});
			}
		}
		// if('miniMap' in gmxAPI.map && !gmxAPI.miniMapAvailable) {
			// gmxAPI.map.miniMap.setVisible(true);
		// }

		var propsBalloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.propsBalloon : null);
		if (gmxAPI.proxyType === 'flash') {			// Это flash версия
            gmxAPI.map.controlsManager.initControls();
			var needToStopDragging = false;
			gmxAPI.flashDiv.onmouseout = function(ev) 
			{
				var event = gmxAPI.compatEvent(ev);
				if(!event || (propsBalloon && propsBalloon.leg == event.relatedTarget)) return;
				if (!needToStopDragging) {
					gmxAPI.map.setCursorVisible(false);
					needToStopDragging = true;
				}
			}
			gmxAPI.flashDiv.onmouseover = function(ev)
			{
				var event = gmxAPI.compatEvent(ev);
				if(!event || (propsBalloon && propsBalloon.leg == event.relatedTarget)) return;
				if (needToStopDragging) {
					gmxAPI.map.stopDragging();
					gmxAPI.map.setCursorVisible(true);
					needToStopDragging = false;
				}
			}
		}
        if (layers && layers.properties.name !== gmxAPI.kosmosnimki_API)	// обработка массива видимых подложек
        {
            var prop = layers.properties;
            var baseLayersArr = gmxAPI.clone(gmxAPI._baseLayersArr || ['map', 'satellite', 'hybrid']);
            
            if (!gmxAPI._baseLayersArr && prop.UseOpenStreetMap ) {
                baseLayersArr = ['OSM'];
                gmxAPI._baseLayersHash['OSM'] = true;
				if(!map.needSetMode) map.needSetMode = 'OSM';
            }
            if(baseLayersArr) {
                var baseLayersManager = map.baseLayersManager;
                for (var i = 0, len = baseLayersArr.length; i < len; i++) {
                    var id = baseLayersArr[i];
                    baseLayersManager.addActiveID(id, gmxAPI._baseLayersArr ? i : null);
                }
            }

            if (prop.OnLoad) {	//  Обработка маплета карты - mapplet для базовой карты уже вызывали
                var runStr = "_currentMap_temp=(" + prop.OnLoad + ")";
                try { eval(runStr)(map); }
                catch (e) {
                    gmxAPI.addDebugWarnings({'func': 'addLayers', 'handler': 'OnLoad', 'event': e, 'alert': e+'\n---------------------------------'+'\n' + layers.properties.OnLoad});
                }
            }
        }
        if(map.needSetMode) {
            var needSetMode = map.needSetMode;
            map.needSetMode = null;
            map.setMode(needSetMode);
        }
	}

	if('_addProxyObject' in gmxAPI) {	// Добавление обьекта отображения в DOM
		var o = gmxAPI._addProxyObject(gmxAPI.getAPIFolderRoot(), flashId, "100%", "100%", "10", "#ffffff", loadCallback, window.gmxFlashLSO);
		if(o === '') {
			var warnDiv = document.getElementById('noflash');
			if(warnDiv) warnDiv.style.display = 'block';
		} else {
			if(o.nodeName === 'DIV') {
				gmxAPI._div.innerHTML = '';
				gmxAPI._div.appendChild(o);
				//gmxAPI._div.appendChild(div);
			}
			else 
			{
				o.write(div);
			}
		}
	}

	return true;
}

window.createFlashMapInternal = createFlashMapInternal;

})();

function createKosmosnimkiMapInternal(div, layers, callback) {
	var prop = layers ? layers.properties : {};
	var arr = (prop.BaseLayers ? JSON.parse(prop.BaseLayers) : null);
	//var baseLayersArr = gmxAPI.isArray(arr) ? arr : ['map', 'satellite', 'hybrid', 'OSM'];
	var baseLayersArr = gmxAPI.isArray(arr) ? arr : null;

	var getLayersArr = function(map, arr, color) {
        var out = [];
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] in map.layers) {
                var layer = map.layers[arr[i]];
                layer.setBackgroundColor(color);
                out.push(layer);
            }
        }
        return out;
    }

	var finish = function()
	{
		var parseBaseMap = function(kosmoLayers) {
			createFlashMapInternal(div, kosmoLayers, function(map)
			{
				// for (var i = 0; i < map.layers.length; i++) {
					// var obj = map.layers[i];
					// obj.setVisible(false);
				// }

				var mapLayerID = gmxAPI.getBaseMapParam("mapLayerID", "");
				var satelliteLayerID = gmxAPI.getBaseMapParam("satelliteLayerID", "");
				var overlayLayerID = gmxAPI.getBaseMapParam("overlayLayerID", "");
				var osmEmbedID = gmxAPI.getBaseMapParam("osmEmbedID", "");
				if(typeof(osmEmbedID) != 'string') osmEmbedID = "06666F91C6A2419594F41BDF2B80170F";
				var setOSMEmbed = function(layer)
				{
					layer.enableTiledQuicklooksEx(function(o, image)
					{
						image.setOSMTiles(true);
						//image.setCopyright("<a href='http://openstreetmap.org'>&copy; OpenStreetMap</a>, <a href='http://creativecommons.org/licenses/by-sa/2.0/'>CC-BY-SA</a>");
						image.setZoomBounds(parseInt(o.properties["text"]), 18);
					}, 10, 18);
				}
                var arr = overlayLayerID.split(",") || [];
                arr.forEach(function(item, i) {
                    var layer = map.layers[item];
                    if(layer) layer.properties.type = 'Overlay';
                });

				var baseLayersManager = map.baseLayersManager,
                    mapLayers = [],
                    overlayLayers = [],
                    satelliteLayers = [],
                    baseLayersHash = {},
                    arr = ['map', 'satellite', 'hybrid'];

                if(baseLayersArr) {
                    for (var i = 0, len = baseLayersArr.length; i < len; i++) baseLayersHash[baseLayersArr[i]] = true;
                }

                for (var i = 0, len = arr.length; i < len; i++) {
                    var id = arr[i];
                    baseLayersManager.remove(id);
                    // нет подложки сформируем через getBaseMapParam 
                    var attr = {id: id, layers:[] };
                    if(id === 'satellite' && satelliteLayerID) {
                        attr.rus = 'Снимки';
                        attr.eng = 'Satellite';
                        satelliteLayers = getLayersArr(map, satelliteLayerID.split(","), 0x000001);
                        attr.layers = satelliteLayers;
                        if(!baseLayersArr) baseLayersManager.addActiveID(id, i);
                        
                        if(!map.needSetMode && attr.layers.length && (!baseLayersArr || baseLayersHash[id])) {
                            map.needSetMode = id;
                        }
                    } else if(id === 'hybrid' && (satelliteLayerID || overlayLayerID)) {
                        attr.rus = 'Гибрид';
                        attr.eng = 'Hybrid';
                        overlayLayers = getLayersArr(map, (satelliteLayerID+','+overlayLayerID).split(","), 0x000001);
                        attr.layers = overlayLayers;
                        if(!baseLayersArr) baseLayersManager.addActiveID(id, i);
                        if(!map.needSetMode && attr.layers.length && (!baseLayersArr || baseLayersHash[id])) {
                            map.needSetMode = id;
                        }
                    } else if(id === 'map' && mapLayerID) {
                        attr.rus = 'Карта';
                        attr.eng = 'Map';
                        mapLayers = getLayersArr(map, mapLayerID.split(","), 0xffffff);
                        attr.layers = mapLayers;
                        var osmEmbed = map.layers[osmEmbedID];
                        if (osmEmbed) {
                            attr.layers.push(osmEmbed);
                            setOSMEmbed(osmEmbed);
                        }
                        if(!baseLayersArr) baseLayersManager.addActiveID(id, i);
                        if(attr.layers.length && (!baseLayersArr || baseLayersHash[id])) {
                            map.needSetMode = id;
                        }
                    }
                    if(attr.layers.length) {
                        baseLayersManager.add(id, attr);
                    }
                }
/*
                if(baseLayersArr) {
                    if(!baseLayersHash[map.needSetMode]) map.needSetMode = null;
                    for (var i = 0, len = baseLayersArr.length; i < len; i++) {
                        var id = baseLayersArr[i];
                        var baseLayer = baseLayersManager.get(id);
                        if(baseLayer) {
                            baseLayer.setVisible(true);
                            baseLayer.setIndex(i);
                        }
                    }
                }
*/
				if (layers) {
					map.defaultHostName = layers.properties.hostName;
					//map.addLayers(layers, false);		// добавление основной карты
					map.properties = layers.properties;
					if (map.properties.DistanceUnit)
					{
						map.setDistanceUnit(map.properties.DistanceUnit);
					}
					if (map.properties.SquareUnit)
					{
						map.setSquareUnit(map.properties.SquareUnit);
					}
				}
                /*  // Устарело
				var mapLayers = [];
				var mapLayerID = gmxAPI.getBaseMapParam("mapLayerID", "");
				if(typeof(mapLayerID) == 'string') {
					var mapLayerNames = mapLayerID.split(',');
					var baseLayers = baseLayersManager.add('map', {rus:'Карта', eng:'Map', isVisible:true});
					for (var i = 0; i < mapLayerNames.length; i++)
						if (mapLayerNames[i] in map.layers)
						{
							var mapLayer = map.layers[mapLayerNames[i]];
							mapLayer.setBackgroundColor(0xffffff);
                            baseLayers.addLayer(mapLayer);
							mapLayers.push(mapLayer);
						}
				}
				var satelliteLayers = [];
				var satelliteLayerID = gmxAPI.getBaseMapParam("satelliteLayerID", "");
				if(typeof(satelliteLayerID) == 'string') {
					var satelliteLayerNames = satelliteLayerID.split(",");
					
					for (var i = 0; i < satelliteLayerNames.length; i++)
						if (satelliteLayerNames[i] in map.layers)
							satelliteLayers.push(map.layers[satelliteLayerNames[i]]);

					var baseLayers = baseLayersManager.add('satellite', {rus:'Снимки', eng:'Satellite', isVisible:true});
					for (var i = 0; i < satelliteLayers.length; i++)
					{
						satelliteLayers[i].setBackgroundColor(0x000001);
                        baseLayers.addLayer(satelliteLayers[i]);
					}
				}
				
				var isAnyExists = false;
				var overlayLayers = [];
				var overlayLayerID = gmxAPI.getBaseMapParam("overlayLayerID", "");
				if(typeof(overlayLayerID) == 'string') {
					var overlayLayerNames = overlayLayerID.split(',');
					var baseLayers = baseLayersManager.add('hybrid', {rus:'Гибрид', eng:'Hybrid', isVisible:true, index:0 });
					for (var i = 0; i < overlayLayerNames.length; i++)
						if (overlayLayerNames[i] in map.layers)
						{
							isAnyExists = true;
							var overlayLayer = map.layers[overlayLayerNames[i]];
							overlayLayer.setBackgroundColor(0x000001);
                            baseLayers.addLayer(overlayLayer);
							overlayLayers.push(overlayLayer);
						}
					
					if (isAnyExists)
					{
						for (var i = 0; i < satelliteLayers.length; i++) {
							satelliteLayers[i].setBackgroundColor(0x000001);
                            baseLayers.addLayer(satelliteLayers[i]);
						}
					}
				}
				
				var setOSMEmbed = function(layer)
				{
					layer.enableTiledQuicklooksEx(function(o, image)
					{
						image.setOSMTiles(true);
						//image.setCopyright("<a href='http://openstreetmap.org'>&copy; OpenStreetMap</a>, <a href='http://creativecommons.org/licenses/by-sa/2.0/'>CC-BY-SA</a>");
						image.setZoomBounds(parseInt(o.properties["text"]), 18);
					}, 10, 18);
				}
				
				var osmEmbedID = gmxAPI.getBaseMapParam("osmEmbedID", "");
				if(typeof(osmEmbedID) != 'string') osmEmbedID = "06666F91C6A2419594F41BDF2B80170F";
				var osmEmbed = map.layers[osmEmbedID];
				if (osmEmbed)
				{
					baseLayersManager.get('map').addLayer(osmEmbed);
					setOSMEmbed(osmEmbed);
				}
*/
/*
				if('miniMap' in map) {
					//map.miniMap.setVisible(true);
					for (var m = 0; m < mapLayers.length; m++) {
						map.miniMap.addLayer(mapLayers[m], true, true);
					}
					if (osmEmbed)
					{
						map.miniMap.addLayer(osmEmbed, null, true);
						setOSMEmbed(map.miniMap.layers[osmEmbed.properties.name]);
					}
				}
*/
				if (!window.baseMap || !window.baseMap.hostName || (window.baseMap.hostName == "maps.kosmosnimki.ru"))
					map.geoSearchAPIRoot = typeof window.searchAddressHost !== 'undefined' ? window.searchAddressHost : "http://maps.kosmosnimki.ru/";
	
/*
				map.needSetMode = (mapLayers.length > 0 ? 'map' : 'satellite');
				if (layers)
				{
					map.defaultHostName = layers.properties.hostName;
					map.addLayers(layers, false);		// добавление основной карты
					map.properties = layers.properties;
					if (map.properties.DistanceUnit)
					{
						map.setDistanceUnit(map.properties.DistanceUnit);
					}
					if (map.properties.SquareUnit)
					{
						map.setSquareUnit(map.properties.SquareUnit);
					}
				}
*/
				if(gmxAPI.proxyType === 'flash' && map.needSetMode) map.setMode(map.needSetMode);

				// копирайты
				// var setCopyright = function(o, z1, z2, text)
				// {
					// var c = o.addObject();
					// c.setZoomBounds(z1, z2);
					// c.setCopyright(text);
					// return c;
				// }

				if (mapLayers.length > 0)
				{
					mapLayers[0].setCopyright("<a href='http://www.bartholomewmaps.com/'>&copy; Collins Bartholomew</a>", 1, 9);
					mapLayers[0].setCopyright("<a href='http://www.geocenter-consulting.ru/'>&copy; " + gmxAPI.KOSMOSNIMKI_LOCALIZED("ЗАО &laquo;Геоцентр-Консалтинг&raquo;", "Geocentre Consulting") + "</a>", 10, 20, { type: "LINESTRING", coordinates: [29, 40, 180, 80] });
					// setCopyright(mapLayers[0], 1, 9, "<a href='http://www.bartholomewmaps.com/'>&copy; Collins Bartholomew</a>");
					// var obj = setCopyright(mapLayers[0], 10, 20, "<a href='http://www.geocenter-consulting.ru/'>&copy; " + gmxAPI.KOSMOSNIMKI_LOCALIZED("ЗАО &laquo;Геоцентр-Консалтинг&raquo;", "Geocentre Consulting") + "</a>");
					// obj.geometry = { type: "LINESTRING", coordinates: [29, 40, 180, 80] };
				}
				
				//те же копирайты, что и для карт
				if (overlayLayers.length > 0)
				{
					//overlayLayers[0].setCopyright("<a href='http://www.bartholomewmaps.com/'>&copy; Collins Bartholomew</a>", 1, 9);
					overlayLayers[0].setCopyright("<a href='http://www.geocenter-consulting.ru/'>&copy; " + gmxAPI.KOSMOSNIMKI_LOCALIZED("ЗАО &laquo;Геоцентр-Консалтинг&raquo;", "Geocentre Consulting") + "</a>", 10, 20, { type: "LINESTRING", coordinates: [29, 40, 180, 80] });
					// setCopyright(overlayLayers[0], 1, 9, "<a href='http://www.bartholomewmaps.com/'>&copy; Collins Bartholomew</a>");
					// var obj = setCopyright(overlayLayers[0], 10, 20, "<a href='http://www.geocenter-consulting.ru/'>&copy; " + gmxAPI.KOSMOSNIMKI_LOCALIZED("ЗАО &laquo;Геоцентр-Консалтинг&raquo;", "Geocentre Consulting") + "</a>");
					// obj.geometry = { type: "LINESTRING", coordinates: [29, 40, 180, 80] };
				}

				if ( satelliteLayers.length > 0 )
				{
					satelliteLayers[0].setCopyright("<a href='http://www.nasa.gov'>&copy; NASA</a>", 1, 5);
					satelliteLayers[0].setCopyright("<a href='http://www.es-geo.com'>&copy; Earthstar Geographics</a>", 6, 13);
					satelliteLayers[0].setCopyright("<a href='http://www.antrix.gov.in/'>&copy; ANTRIX</a>", 6, 14, { type: "LINESTRING", coordinates: [9.9481201, 18.265291, 45.263671, 61.305477] });
					satelliteLayers[0].setCopyright("<a href='http://www.geoeye.com'>&copy; GeoEye Inc.</a>", 9, 17);
					// setCopyright(satelliteLayers[0], 1, 5, "<a href='http://www.nasa.gov'>&copy; NASA</a>");
					// setCopyright(satelliteLayers[0], 6, 13,	"<a href='http://www.es-geo.com'>&copy; Earthstar Geographics</a>");
					// var obj = setCopyright(satelliteLayers[0], 6, 14, "<a href='http://www.antrix.gov.in/'>&copy; ANTRIX</a>");
					// obj.geometry = gmxAPI.from_merc_geometry({ type: "LINESTRING", coordinates: [1107542, 2054627, 5048513, 8649003] });
					// setCopyright(satelliteLayers[0], 9,	17,	"<a href='http://www.geoeye.com'>&copy; GeoEye Inc.</a>");
				}
				
				try {
					callback(map, layers);		// Передача управления
				} catch(e) {
					gmxAPI.addDebugWarnings({'func': 'createKosmosnimkiMapInternal', 'event': e, 'alert': 'Ошибка в callback:\n'+e});
				}
				if(map.needMove) {
					gmxAPI.currPosition = null;
					var x = map.needMove['x'];
					var y = map.needMove['y'];
					var z = map.needMove['z'];
					if(gmxAPI.proxyType === 'flash') map.needMove = null;
					map.moveTo(x, y, z);
				}
				// if(map.needSetMode) {
					// var needSetMode = map.needSetMode;
					// map.needSetMode = null;
					// map.setMode(needSetMode);
				// }
			});
		};
		var getBaseMap = function()
		{
			var mapProp = (typeof window.gmxNullMap === 'object' ? window.gmxNullMap : null);
			if(mapProp) {
				window.KOSMOSNIMKI_LANGUAGE = window.KOSMOSNIMKI_LANGUAGE || {'eng': 'English', 'rus': 'Russian'}[mapProp.properties.DefaultLanguage];
				createFlashMapInternal(div, mapProp, callback);
			} else {
				loadMapJSON(
					gmxAPI.getBaseMapParam("hostName", "maps.kosmosnimki.ru"), 
					gmxAPI.getBaseMapParam("id", gmxAPI.kosmosnimki_API),
					parseBaseMap,
					function()
					{
						createFlashMapInternal(div, layers, callback);
					}
				);
			}
		}
		if (!gmxAPI.getScriptURL("config.js"))
		{
			gmxAPI.loadVariableFromScript(
				gmxAPI.getAPIFolderRoot() + "config.js",
				"gmxNullMap",
				getBaseMap,
				getBaseMap
			);
		}
		else
			getBaseMap();
	}
	var errorConfig = function()
	{
		createFlashMapInternal(div, {}, callback);
	}
	if (!gmxAPI.getScriptURL("config.js"))
	{
		gmxAPI.loadVariableFromScript(
			gmxAPI.getAPIFolderRoot() + "config.js",
			"baseMap",
			finish,
			//errorConfig	// Нет config.js
			finish			// Есть config.js
		);
	}
	else
		finish();
};
;/* ======================================================================
    BaseLayersManager.js
   ====================================================================== */

/** Управление подложками

Позволяет управлять списком подложек. 

Подложка - массив слоев отображаемых в качестве подложки карты.

@memberof map.baseLayersManager
*/
(function()
{
    "use strict";
	var alias = {};             // варианты наименований подложек - для совместимости
	var manager = {
        map: null               // карта
        ,arr: []                // массив подложек
        ,hash: {}               // список по ID всех подложек
        ,activeIDs: []          // массив ID подложек(в контролах появляется только при наличии в ID hash)
        ,currentID: null        // ID текущей подложки
        ,addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); }
        ,removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); }
        ,stateListeners: {}
        ,
        init: function(map) {        // инициализация
            manager.map = map;
            gmxAPI.extendFMO('setAsBaseLayer', function(name, attr) {
                this.isBaseLayer = true;
                var id = name;
                if(!attr) {
                    attr = {
                        //index: manager.arr.length
                    };
                } else {
                    id = (attr.id ? attr.id : name);
                    if(attr.lang) {
                        attr.rus = (attr.lang.ru ? attr.lang.ru : id);
                        attr.eng = (attr.lang.en ? attr.lang.en : id);
                    }
                }
                attr.isVisible = true
                var blID = manager.getIDByName(id) || id;
				var baseLayer = manager.hash[blID];
                this.setVisible(false);         // слои подложек изначально не видимы
                var isActiveID = manager.isActiveID(blID);
                if(!baseLayer) {
                    baseLayer = manager.add(blID, attr);
                }
                baseLayer.addLayer(this);
                if(!isActiveID) {
                    manager.updateIndex({id: blID});
                }
            });
			gmxAPI.extend(manager.map,
            {
                setMode: function(name) {
                    var id = (manager.hash[name] ? name : manager.getIDByName(name));
                    manager.setCurrentID(id);
                }
                ,getModeID: function() {
                    return manager.currentID;
                }
                ,setBaseLayer: function(name) {
                    this.setMode(name);
                }
                ,
                unSetBaseLayer: function() {
                    manager.map.setBaseLayer();
                }
                ,getBaseLayer: function() {
                    return manager.currentID;
                }
                ,baseLayerControl: {
                    isVisible: true,
                    /**
                     * @deprecated Использовать контрол L.Control.gmxLayers
                     */
                    setVisible: function(flag) {
                        var controls = map.controlsManager.getCurrent();
                        if(!controls) return null;
                        var control = controls.getControl('layers');
                        return control.setVisible(flag);
                    },
                    /**
                     * @deprecated Использовать map.baseLayersManager.getActiveIDs()
                     */
                    getBaseLayerNames: function() {
                        return manager.activeIDs;
                    },
                    /**
                     * @deprecated Использовать map.baseLayersManager.getLayers()
                     */
                    getBaseLayerLayers: function(name) {
                        var baseLayer = manager.get(name);
                        return (baseLayer ? baseLayer.layers : null);
                    }
                }
            });
            this.addListener('onActiveChanged', function(arr) {
                var flag = false;
                for(var i=0, len = arr.length; i<len; i++) {
                    if(manager.currentID === arr[i]) {
                        flag = true;
                        break;
                    }
                }
                var current = manager.hash[manager.currentID] || null;
                if(current) {
                    if(!flag) manager.currentID = null
                    for(var i=0, len = current.layers.length; i<len; i++) {
                        current.layers[i].setVisible(flag);
                    }
                }
                // Поддержка устаревшего map.baseLayerControl.onChange 
                if('onChange' in manager.map.baseLayerControl) manager.map.baseLayerControl.onChange(manager.currentID);
            });
        }
        ,
        removeLayer: function(id, layer) {             // Удаление слоя из подложки - возвращает удаленный слой либо null
            var baseLayer = manager.hash[id];
			if(!baseLayer || !layer) return null;
            for(var i=0, len = baseLayer.layers.length; i<len; i++) {
                if(layer === baseLayer.layers[i]) {
                    if(len === 1) {
                        //baseLayer.isVisible = false;
                        gmxAPI._listeners.dispatchEvent('onLayerChange', manager.map.baseLayersManager, baseLayer);
                    }
                    return baseLayer.layers.splice(i, 1)[0];
                }
            }
            return null;
        }
        ,
        add: function(id, attr) {           // Добавление подложки
            if(!id || manager.hash[id]) return null;
            if(!attr) attr = {};
            // var isVisible = attr.isVisible; // видимость подложки - 3 состояния отражающие видимость в контролах (true - видимая, false - не видимая, undefined - видимость определяется по списку BaseLayers)
            // if(gmxAPI._baseLayersHash[id]) isVisible = true;
            var pt = {
                id: id || 'default'                 // id подложки
                ,layers: attr.layers || []          // массив слоев подложки
                ,rus: attr.rus || id                // title подложки 
                ,eng: attr.eng || id
                ,addLayer: function(layer) {
                    manager.removeLayer(id, layer);
                    this.layers.push(layer);
                    layer.isBaseLayer = true;
                    layer.setVisible(false);
                    if(!layer.backgroundColor) layer.backgroundColor = 0xffffff;
                    gmxAPI._listeners.dispatchEvent('onLayerChange', manager.map.baseLayersManager, this);
                    return true;
                }
                ,removeLayer: function(layer) {
                    manager.removeLayer(id, layer);
                    gmxAPI._listeners.dispatchEvent('onLayerChange', manager.map.baseLayersManager, this);
                }
            };
            if(attr.rus) alias[attr.rus] = id;
            if(attr.eng) alias[attr.eng] = id;
            if(attr.style) pt.style = attr.style;   // стиль для контролов
            if(attr.type) pt.type = attr.type;      // тип подложки для контролов имеющих типы подложек

            pt.layers.forEach(function(item, i) {
                item.isBaseLayer = true;
                item.setVisible(false);
            });

            manager.hash[id] = pt;
            manager.arr.push(pt);
            //manager.updateIndex(pt);
            gmxAPI._listeners.dispatchEvent('onAdd', manager.map.baseLayersManager, pt);
            return pt;
        }
        ,
        setActiveIDs: function(arr) {
            manager.activeIDs = arr;
            gmxAPI._listeners.dispatchEvent('onActiveChanged', manager.map.baseLayersManager, manager.activeIDs);
            return true;
        }
        ,
        _removeIDFromActive: function(id) {
            for(var i=0, len = manager.activeIDs.length; i<len; i++) {
                if(id === manager.activeIDs[i]) {
                    manager.activeIDs.splice(i, 1);
                    break;
                }
            }
        }
        ,
        updateIndex: function(attr) {
            if(!attr.id) return null;
            var id = attr.id;
            manager._removeIDFromActive(id);
            var len = manager.activeIDs.length;
            var index = ('index' in attr && attr.index !== undefined ? attr.index : len);
            var out = -1;
            if(index > len - 1) {
                out = len;
                manager.activeIDs.push(id);
            } else {
                var arr = manager.activeIDs.slice(0, index);
                out = arr.length;
                arr.push(id);
                manager.activeIDs = arr.concat(manager.activeIDs.slice(index));
            }
            gmxAPI._listeners.dispatchEvent('onActiveChanged', manager.map.baseLayersManager, manager.activeIDs);
            return out;
        }
        ,
        getAll: function(flag) {              // Получить список подложек
            return manager.arr;
        }
        ,
        get: function(id) {               // Получить подложку по ID
            return manager.hash[id] || null;
        }
        ,setVisibleCurrentItem: function(flag) {
            var baseLayer = manager.hash[manager.currentID] || null;
            if(baseLayer) {
                for(var i=0, len = baseLayer.layers.length; i<len; i++) {
                    var layer = baseLayer.layers[i];
                    layer.setVisible(flag);
                }
            }
            return flag;
        }
        ,
        getIDByName: function(name) {
            return alias[name] || null;
        }
        ,
        isActiveID: function(id) {
            for(var i=0, len = manager.activeIDs.length; i<len; i++) {
                if(id === manager.activeIDs[i]) {
                    return true;
                }
            }
            return false;
        }
        ,
        setCurrentID: function(id) {            // Установка текущей подложки карты
            var isActive = manager.isActiveID(id);
            var item = manager.hash[id] || null;
            //if(manager.currentID && (isActive || !item)) manager.setVisibleCurrentItem(false);
            if(manager.currentID) manager.setVisibleCurrentItem(false);
            manager.currentID = null;
            if(item) {
                if(isActive) {
                    manager.map.needSetMode = null;
                    manager.currentID = id;
                    manager.setVisibleCurrentItem(true);
                }
            }
            gmxAPI._listeners.dispatchEvent('onSetCurrent', manager.map.baseLayersManager, item);
            return item;
        }
        ,remove: function(id) {            // Удалить подложку
            if(id === manager.currentID) {
                manager.setVisibleCurrentItem(false);
                manager.currentID = null;
            }
            var item = manager.hash[id] || null;
            if(item) {
                delete manager.hash[id];
                for(var i=0, len = manager.arr.length; i<len; i++) {
                    if(id === manager.arr[i].id) {
                        manager.arr.splice(i, 1);
                        break;
                    }
                }
                gmxAPI._listeners.dispatchEvent('onRemove', manager.map.baseLayersManager, item);
            }
            return item;
        }
        ,toggleVisibility: function(id) {
            manager.setCurrentID(manager.currentID === id ? null : id);
        }
	};
    /**
     * Обьект подложки.
     * @typedef {Object} BaseLayer
     * @property {String} id - Идентификатор подложки.
     * @property {Layer[]} layers - Массив слоев подложки.
     * @property {String} rus - Наименование русскоязычное.
     * @property {String} eng - Наименование англоязычное.
     * @property {function(layer:Layer)} addLayer - Ф-ция добавления слоя в подложку.
     * @property {function(layer:Layer)} removeLayer - Ф-ция удаления слоя из подложки.
     */
     
     /**
        @name BaseLayer~addLayer
        @function
        @param {Layer} layer слой, который нужно добавить в подложку
     */

    /**
     * Менеджер подложек (создаётся в API и доступен через свойство карты map.baseLayersManager).
     * @constructor BaseLayersManager
     */
	gmxAPI.BaseLayersManager = function(map) {
        manager.init(map);
        return {
            /** Добавить подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {object} attr дополнительные атрибуты подложки.
            * @param {String} attr.rus - наименование русскоязычное(по умолчанию равен id).
            * @param {String} attr.eng - наименование англоязычное(по умолчанию равен id).
            * @param {Layer[]} attr.layers - массив слоев подложки(по умолчанию []).
            * @returns {BaseLayer|null} возвращает обьект добавленной подложки или null если подложка с данным идентификатором уже существует.
            */
            add: function(id, attr) {
                return manager.add(id, attr);
            },
            /** Удалить подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {BaseLayer|null} возвращает удаленную подложку если она найдена.
            */
            remove: function(id) {
                return manager.remove(id);
            },
            /** Получить подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {BaseLayer|null} возвращает подложку если существует иначе null).
            */
            get: function(id) {
                return manager.hash[id] || null;
            },
            /** Получить список всех подложек
            * @memberOf BaseLayersManager#
            * @returns {BaseLayer[]} возвращает массив всех подложек.
            */
            getAll: function() {
                return manager.arr;
            },
            /** Получить массив ID активных подложек
            * @memberOf BaseLayersManager#
            * @returns {String[]} возвращает массив ID активных подложек(в порядке возрастания индексов).
            */
            getActiveIDs: function() {
                return manager.activeIDs;
            },
            /** Установить массив ID активных подложек
            * @memberOf BaseLayersManager#
            * @param {String[]} массив ID активных подложек.
            */
            setActiveIDs: function(arr) {
                return manager.setActiveIDs(arr);
            },
            /** Добавить ID активной подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {number} index порядковый номер в массиве активных подложек.
            */
            addActiveID: function(id, index) {
                return manager.updateIndex({id: id, index: index});
            },
            /** Проверить активность подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {boolean} возвращает true если подложка активна иначе false
            */
            isActiveID: function(id) {
                return manager.isActiveID(id);
            },
            /** Установить текущую подложку по идентификатору
            * @memberOf BaseLayersManager#
            * @param {String=} id идентификатор подложки, если подложка с заданным идентификатором отсутствует или не активна то текущая подложка равна null.
            * @returns {BaseLayer|null} возвращает текущую подложку, если она установлена
            */
            setCurrentID: function(id) {
                return manager.setCurrentID(id);
            },
            /** Получить идентификатор текущей подложки
            * @memberOf BaseLayersManager#
            * @returns {String|null} возвращает идентификатор текущей подложки либо null.
            */
            getCurrentID: function() {
                return manager.currentID;
            },
            /** Получить идентификатор по наименованию подложки
            * @memberOf BaseLayersManager#
            * @returns {String|null} возвращает идентификатор подложки если заданное наименование подложки существует.
            */
            getIDByName: function(name) {
                return manager.getIDByName(name);
            },
            /** Добавить слой в подложку
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {Layer} layer обьект слоя.
            * @returns {boolean} возвращает false если подложка не найдена иначе true.
            */
            addLayer: function(id, layer) {
                var baseLayer = this.get(id);
                if(!baseLayer) return false;
                baseLayer.addLayer(layer);
                //baseLayer.layers.push(layer);

                //gmxAPI._listeners.dispatchEvent('onAdd', this, baseLayer);
                return true;
            },
            /** Удалить слой из подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @param {Layer} layer обьект слоя.
            */
            removeLayer: function(id, layer) {
                manager.removeLayer(id, layer);
                if(id === manager.currentID) {
                    layer.setVisible(false);
                }
            },
            /** Получить список слоев подложки
            * @memberOf BaseLayersManager#
            * @param {String} id идентификатор подложки.
            * @returns {Layer[]} возвращает массив слоев подложки.
            */
            getLayers: function(id) {
                return manager.get(id).layers;
            }
            ,addListener: manager.addListener
            ,removeListener: manager.removeListener
            ,stateListeners: manager.stateListeners
        }

        /** Добавлена подложка
         * @event BaseLayersManager#onAdd
         * @type {BaseLayer}
        */
        /** Удалена подложка
         * @event BaseLayersManager#onRemove
         * @type {BaseLayer}
        */
        /** Изменен список слоев в подложке
         * @event BaseLayersManager#onLayerChange
         * @type {BaseLayer}
        */
        /** Установлена текущая подложка
         * @event BaseLayersManager#onSetCurrent
         * @type {BaseLayer}
        */
        /** Изменен массив ID активных подложек
         * @event BaseLayersManager#onActiveChanged
         * @type {String[]}
        */
    };
})();
;/* ======================================================================
    ControlsManager.js
   ====================================================================== */

/** Управление наборами контролов карты

Позволяет устанавливать пользовательские наборы контролов карты. 

Набор контролов - список контролов карты.

@global

*/
(function()
{
    "use strict";
	var ControlsManager = {
        isVisible: true
        ,_controls: null
        ,currentID: null
        //,currentControls: {}
        //,controls: []
        ,parentNode: null
        ,allToolsNode: null
        ,toolsAll: null
        ,addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); }
        ,removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); }
        ,stateListeners: {}
        ,
        init: function(parent, map) {
			if(parent) this.parentNode = parent;
            
            var allToolsNode = this.allToolsNode = gmxAPI._allToolsDIV = gmxAPI.newStyledDiv({
                position: "absolute"
                ,top: '0px'
                ,left: 0
                ,height: '1px'
                ,width: '100%'
                // ,marginLeft: '15px'
                // ,marginTop: '15px'
            });
            this.parentNode.appendChild(allToolsNode);
            
            gmxAPI.extend(map, {
                allControls: {
                    div: allToolsNode
/*                    ,
                    setVisible: function() {},
                    minimize: function() {},
                    maximize: function() {}
*/
                },
                isToolsMinimized: function() {
                    return !ControlsManager.isVisible;
                },
                minimizeTools: function() {
                    ControlsManager.setVisible();
                },
                maximizeTools: function() {
                    ControlsManager.setVisible(true);
                }
            });
        }
        ,initControls: function() {
            if(!this._controls) return false;
            this._controls.initControls();
            return true;
        }
        ,setCurrent: function(id) {
            if(this._controls) this._controls.remove();
			this._controls = gmxAPI._controls[id];
        }
        ,getCurrent: function() {
            return this._controls || null;
        }
        ,getControl: function(id) {
            if(!this._controls) return null;
            return ('getControl' in this._controls ? this._controls.getControl(id) : null);
        }
        ,
        select: function(controlObj) {
			if(this.curent && 'remove' in this.curent) this.curent.remove();
			this.curent = controlObj;
            if('init' in controlObj) controlObj.init();
        }
        ,
        setVisible: function(flag) {
            if(!arguments.length) flag = !this.isVisible;
            for (var key in ControlsManager._controls.controlsHash) {
                var control = ControlsManager._controls.controlsHash[key];
                if('setVisible' in control) control.setVisible(flag, chkOld);
            }
            this.isVisible = flag;
            gmxAPI._listeners.dispatchEvent('onToolsMinimized', gmxAPI.map, !ControlsManager.isVisible);
        }
        // ,
        // addControls: function(controlObj, selectFlag) {
			// if(selectFlag) this.select(controlObj);
			// if(this.currentID === controlObj.id) controlObj.init();
            
            // for (var i = 0, len = this.controls.length; i < len; i++) {
				// if(controlObj === this.controls[i]) {
                    // return;
                // }
            // }
            // this.controls.push(controlObj);
            // this.controls[controlObj.id] = controlObj;
        // }
        // ,
        // removeById: function(id) {
            // if(id && this.controls[id]) {
                // this.remove(this.controls[id]);
            // }
            // for(var key in gmxAPI._tools) {
                // var item = gmxAPI._tools[key];
                // item.remove();
                // delete gmxAPI._tools[key];
            // }
            // var tt = gmxAPI._tools;
        // }
        // ,
        // remove: function(controlObj) {
            // this.forEach(function(item, i) {
                // if(controlObj === item) {
                    // this.controls.splice(i, 1);
                    // if(controlObj === this.curent) this.curent = null;
                    // delete this.controls[controlObj.id];
                    // if('remove' in controlObj) controlObj.remove();
                    // return false;   // stop iteration
                // }
            // });
        // }
        // ,
        // forEach: function(callback) {
			// for (var i = 0, len = this.controls.length; i < len; i++) {
				// if(callback.call(this, this.controls[i], i) === false) return;
            // }
        // }
        ,
        addGroupTool: function(pt) {
            return gmxAPI.IconsControl.addGroupTool(pt);
        }
	}
    /**
     * Описание класса Controls.
     * @typedef {Object} Controls1
     * @ignore
     * @property {String} id - Идентификатор типа контролов.
     * @property {Function} init - Ф-ция для инициализации.
     * @property {boolean} isVisible - Флаг видимости(по умолчанию true).
     * @property {Array} [Control] items - Массив контролов данного типа контролов.
     * @property {Function} [boolean=] setVisible - Установка видимости(по умолчанию false).
     * @property {Function} remove - Удаление набора контролов.
    */
    /**
     * Менеджер контролов.
     * @constructor ControlsManager
     * @ignore
     * @param {Object} map - карта.
     * @param {Object=} div - нода для размещения контролов.
     */
	gmxAPI.ControlsManager = function(map, div) {
        ControlsManager.init(div || gmxAPI._div, map);
        return {
            // add: function(controls) {
                // ControlsManager.addControls(controls);
            // }
            // ,
            remove: function(id) {
                ControlsManager.removeById(id);
            }
            ,
            /** Получить идентификатор текущего набора контролов
            * @memberof ControlsManager#
            * @returns {String|null} возвращает идентификатор текущего набора контролов или null если контролы не устанавлены.
            */
            getCurrentID: function() {
                return ControlsManager.currentID;
            }
            ,
            /** Получить текущий набор контролов
            * @memberof ControlsManager#
            * @returns {Controls|null} возвращает оъект текущего набора контролов или null если текущий набор контролов не устанавлен.
            */
            getCurrent: function() {
                return ControlsManager.getCurrent() || null;
            }
            /** Установить текущий набор контролов
            * @memberof ControlsManager#
            * @param {String} id идентификатор набора контролов.
            * @returns {Controls|null} возвращает оъект текущего набора контролов или null если текущий набор контролов не устанавлен.
            */
            ,setCurrent: function(id) {
                return ControlsManager.setCurrent(id);
            }
            ,setVisible: function(flag) {
                ControlsManager.setVisible(flag);
            }
            ,toggleVisible: function() {
                ControlsManager.setVisible(!ControlsManager.isVisible);
            }
            ,addGroupTool: function(hash) {
                return ControlsManager.addGroupTool(hash);
            }
            ,getControl: function(id) {
                var controls = ControlsManager.getCurrent();
                return (controls && 'getControl' in controls ? controls.getControl(id) : null);
            }
            ,initControls: function() {
                var controls = ControlsManager.getCurrent();
                if(controls && 'initControls' in controls) {
                   //ControlsManager.currentControls = 
                   controls.initControls();
                   return true;
                }
                return false;
            }
            ,addListener: ControlsManager.addListener
            ,removeListener: ControlsManager.removeListener
            ,stateListeners: ControlsManager.stateListeners
        }
    };
})();
;/* ======================================================================
    controlsBase.js
   ====================================================================== */

// Стандартные контролы
(function()
{
    "use strict";

    var initControls = function() {
        var outControls = {};
        var mbl = gmxAPI.map.baseLayersManager;

        (function() {
            // function ToolsAll(cont)
            // {
                // this.toolsAllCont = gmxAPI._allToolsDIV;
                // gmxAPI._toolsContHash = {};
            // }
            // gmxAPI._ToolsAll = ToolsAll;
            // new gmxAPI._ToolsAll(container);
            gmxAPI._toolsContHash = {};

            /** Класс управления tools контейнерами
            * @function
            * @ignore
            * @memberOf api
            * @param {name} ID контейнера
            * @param {attr} Hash дополнительных атрибутов
            *		ключи:
            *			contType: Int - тип контейнера (по умолчанию 0)
            *					0 - стандартный пользовательский тип контейнера 
            *					1 - тип для drawing вкладки
            *					2 - тип для вкладки базовых подложек
            *           notSticky: 0 - по умолчанию, инструмент выключается только после повторного нажатия или выбора другого инструмента.
                                   1 - автоматически выключать инструмент полсе активации
            *			properties: Hash - properties DIV контейнера (по умолчанию { 'className': 'tools_' + name })
            *			style: Hash - стили DIV контейнера (по умолчанию { 'position': "absolute", 'top': 40 })
            *			regularStyle: Hash - регулярного стиля DIV элементов в контейнере (по умолчанию { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold",	textAlign: "center", cursor: "pointer", opacity: 1, color: "wheat" })
            *			activeStyle: Hash - активного стиля DIV элементов в контейнере (по умолчанию { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold",	textAlign: "center", cursor: "pointer", opacity: 1, color: "orange" })
            */
            function ToolsContainer(name, attr) {
                //console.log('ToolsContainer', name, attr);
                if(!attr) attr = {};
                var aliasNames = {},		// Hash алиасов основных подложек для map.setMode
                    toolNames = [],
                    toolHash = {},
                    itemsContainer = null,
                    activeToolName = '',
                    notSticky = (attr.notSticky ? attr.notSticky : 0),
                    contType = (attr.contType ? attr.contType : 0),
                    independentFlag = (contType == 0 ? true : false),
                    notSelectedFlag = (contType != 1 ? true : false),
                    currentlyDrawnObject = false,
                    createContainerNode = attr.createContainerNode || null,
                    createItemNode = attr.createItemNode || null;

                if(!name) name = 'testTool';

                var properties = (attr.properties ? attr.properties : {});
                if(!properties.className) {			// className по умолчанию tools_ИмяВкладки
                    properties.className = 'tools_' + name;
                }

                // стили контейнера
                var style = { display: 'block', styleFloat: 'left', cssFloat: 'left', marginTop: '40px', marginLeft: '4px', padding: '0px;' };
                // стили добавляемых юзером элементов tool
                var regularStyle = { paddingTop: "0px", paddingBottom: "0px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold", textAlign: "center", cursor: "pointer", opacity: 1, color: "white"	};
                var activeStyle = { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold", textAlign: "center", cursor: "pointer", opacity: 1, color: "orange"	};

                // Установка backgroundColor c alpha
                if(gmxAPI.isIE && document.documentMode < 10) {
                    style.filter = "progid:DXImageTransform.Microsoft.gradient(startColorstr=#7F016A8A,endColorstr=#7F016A8A)";
                    style.styleFloat = 'left';
                }
                else 
                {
                    style.backgroundColor = "rgba(1, 106, 138, 0.5)";
                    style.cssFloat = 'left';
                }
                regularStyle = { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold", textAlign: "center", cursor: "pointer", opacity: 1, color: "wheat"	};
                activeStyle = { paddingTop: "4px", paddingBottom: "4px", paddingLeft: "10px", paddingRight: "10px", fontSize: "12px", fontFamily: "sans-serif", fontWeight: "bold", textAlign: "center", cursor: "pointer", opacity: 1, color: "orange"	};

                if(attr.style) {
                    for(key in attr.style) style[key] = attr.style[key];
                }
                if(attr.regularStyle) {		// дополнение и переопределение стилей
                    for(var key in attr.regularStyle) regularStyle[key] = attr.regularStyle[key];
                }
                if(attr.activeStyle) {
                    for(key in attr.activeStyle) activeStyle[key] = attr.activeStyle[key];
                }

                var my = this;
                gmxAPI.extend(this, {
                    activeToolName: ''
                    ,node: null
                    ,currentlyDrawnObject: null
                    ,isVisible: true
                    ,setActiveTool: function(toolName) {
                        for (var id in toolHash) {
                            var tool = toolHash[id];
                            if (tool)  {
                                tool.isActive = (id == toolName ? true : false);
                            }
                        }
                        this.activeToolName = toolName;
                        this.repaint();			
                    }
                    ,selectTool: function(toolName) {
                        if (name == 'standart') {	// только для колонки 'standart'
                            if (toolName == my.activeToolName) toolName = (toolNames.length > 0 ? toolNames[0] : '');	// если toolName совпадает с активным tool переключаем на 1 tool

                            // При draw обьектов
                            if (my.currentlyDrawnObject && 'stopDrawing' in my.currentlyDrawnObject) {
                                my.currentlyDrawnObject.stopDrawing();
                            }
                            my.currentlyDrawnObject = null;
                        }

                        var oldToolName = my.activeToolName;
                        var tool = toolHash[oldToolName];

                        if (tool && contType != 0) {
                            if ('onCancel' in tool) tool.onCancel();
                            tool.repaint();
                        }

                        my.activeToolName = (notSelectedFlag && toolName == oldToolName ? '' : toolName);

                        tool = toolHash[toolName];
                        if(tool) {
                            if (contType == 0) {								// для добавляемых юзером меню
                                if (tool.isActive) {
                                    if ('onCancel' in tool) tool.onCancel();
                                } else {
                                    if ('onClick' in tool) tool.onClick();
                                }
                                tool.repaint();
                            } else if (contType == 1) {							// тип для drawing
                                if ('onClick' in tool) {
                                    my.currentlyDrawnObject = tool.onClick();
                                    tool.repaint();
                                } else {
                                    my.currentlyDrawnObject = null;
                                }
                            } else if (contType == 2) {							// тип для подложек
                                if ('onClick' in tool && toolName != oldToolName) {
                                    tool.onClick();
                                    tool.repaint();
                                }
                            }
                            
                            if (notSticky == 1){
                                // Если интструмент включен, сразу же выключите его.
                                if (tool.isActive) {
                                    if ('onCancel' in tool) tool.onCancel();
                                    tool.isActive = false;
                                }
                            }
                        }
                        gmxAPI._listeners.dispatchEvent('onActiveChanged', gmxAPI._tools[name], {id: my.activeToolName, target: my});	// Изменились активные tool в контейнере
                        gmxAPI._listeners.dispatchEvent('onActiveChanged', gmxAPI.map.controlsManager, {id: my.activeToolName, target: my});
                    }
                    ,stateListeners: {}
                    ,addListener: function(eventName, func) {
                        return gmxAPI._listeners.addListener({obj: this, eventName: eventName, func: func});
                    }
                    ,removeListener: function(eventName, id) {
                        return gmxAPI._listeners.removeListener(this, eventName, id);
                    }
                    ,forEach: function(callback) {
                        for (var id in toolHash)
                            callback(toolHash[id]);
                    }
                    ,getToolByName: function(tn) {
                        if(!toolHash[tn]) return false;
                        return toolHash[tn];
                    }
                    ,getTool: function(tn) {
                        if(toolHash[tn]) return toolHash[tn];
                        for (var key in toolHash) {
                            var tool = toolHash[key];
                            var alias = tool.alias || key;
                            if(alias === tn) return tool;
                        }
                        return null;
                    }
                    ,getAlias: function(tn) {
                        return aliasNames[tn] || tn;
                    }
                    ,getAliasByName: function(tn) {
                        for (var key in toolHash) {
                            var tool = toolHash[key];
                            var alias = tool.alias || key;
                            if(alias === tn) return alias;
                            else if(tool.lang) {
                                for (var lang in tool.lang) {
                                    if(tool.lang[lang] === tn) return alias;
                                }
                            }
                        }
                        return null;
                    }
                    ,getToolIndex: function (tn) {
                        for (var i = 0; i<toolNames.length; i++)
                        {
                            if(tn === toolNames[i]) return i;
                        }
                        return -1;
                    }
                    ,setToolIndex: function (tn, ind) {
                        var num = my.getToolIndex(tn);
                        if(num === -1 || !toolHash[tn]) return false;

                        var hash = toolHash[tn];
                        var tBody = my.itemsContainer;
                        //var obj = tBody.removeChild(hash.row);

                        var len = tBody.children.length;
                        if(ind >= len) ind = len - 1;
                        
                        toolNames.splice(num, 1);
                        toolNames.splice(ind, 0, tn);
                        toolHash[tn].row = tBody.insertBefore(hash.row, tBody.children[ind]);
                        //toolHash[tn].row = tBody.insertBefore(obj, tBody.children[ind]);
                        return true;
                    }
                    ,setVisible: function(flag) {
                        gmxAPI.setVisible(my.node, flag);
                        this.isVisible = flag;
                    }
                    ,chkVisible: function() {
                        var flag = false;
                        for (var key in toolHash) {
                            var tool = toolHash[key];
                            if(tool.isVisible) {
                                flag = true;
                            }
                        }
                        gmxAPI.setVisible(my.node, flag);
                        this.isVisible = flag;
                    }
                    ,repaint: function() {
                        for (var id in toolHash) {
                            var tool = toolHash[id];
                            if (tool)  {
                                tool.repaint();
                            }
                        }
                    }
                    ,updateVisibility: function() {
                    }
                    ,remove: function() {
                        for(var key in this.stateListeners) {
                            var item = this.stateListeners[key];
                            this.removeListener(key, item.id);
                        }
                        this.stateListeners = {};

                        delete gmxAPI._toolsContHash[name];
                        if(this.node.parentNode) this.node.parentNode.removeChild(this.node);
                    }
                    ,chkBaseLayerTool: function (tn, attr) {
                        if (toolHash[tn]) return false;
                        else {
                            if(!attr)  {
                                attr = {
                                    onClick: function() { gmxAPI.map.setBaseLayer(tn); },
                                    onCancel: function() { gmxAPI.map.unSetBaseLayer(); },
                                    onmouseover: function() { this.style.color = "orange"; },
                                    onmouseout: function() { this.style.color = "white"; },
                                    hint: tn
                                };
                            }
                            return this.addTool(tn, attr);
                        }

                    }
                    ,addTool: function (tn, attr) {
        //console.log('tool addTool', tn, attr); // wheat
                        if(!attr) attr = {};
                        if(attr.overlay && gmxAPI._leaflet && gmxAPI._leaflet.gmxLayers) {
                            attr.id = tn;
                            if(!attr.rus) attr.rus = attr.hint || attr.id;
                            if(!attr.eng) attr.eng = attr.hint || attr.id;
                            
                            var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                            if(layersControl) layersControl.addOverlay(tn, attr);
        //                    return;
                        } else {
                            var controls = gmxAPI.map.controlsManager.getCurrent();
                            if(controls && 'addControl' in controls) {
                                ret = controls.addControl(tn, attr);
                            }
                        }
    //    return;

        //                if(!my.itemsContainer) my.itemsContainer = (createContainerNode ? createContainerNode() : my.createContainerNode('div', properties, style));
                        if(!my.itemsContainer) {
                            if(createContainerNode) createContainerNode();
                            else my.createContainerNode('div', properties, style);
                        }

                        if(!attr.alias) attr.alias = tn
                        aliasNames[attr.alias] = tn;

                        var elType = 'img';
                        var elAttr = {
                            title: attr.hint,
                            onclick: function() { my.selectTool(tn); }
                        };

                        if(!('onClick' in attr)) attr.onClick = function() { gmxAPI.map.setMode(tn); };
                        if(!('onCancel' in attr)) attr.onCancel = function() { gmxAPI.map.unSetBaseLayer(); };
                    
                        var setStyle = function(elem, style) {
                            for (var key in style)
                            {
                                var value = style[key];
                                elem.style[key] = value;
                                if (key == "opacity") elem.style.filter = "alpha(opacity=" + Math.round(value*100) + ")";
                            }
                        }

                        var myActiveStyle = (attr.activeStyle ? attr.activeStyle : activeStyle);
                        var myRegularStyle = (attr.regularStyle ? attr.regularStyle : regularStyle);
                        var repaintFunc = null;
                        if('regularImageUrl' in attr) {
                            elAttr.onmouseover = function()	{ this.src = attr.activeImageUrl; };
                            repaintFunc = function(obj) { obj.src = (tn == my.activeToolName) ? attr.activeImageUrl : attr.regularImageUrl;	};
                            elAttr.src = attr.regularImageUrl;
                        } else {
                            elType = 'div';
                            repaintFunc = function(obj, flag) {
                                if(toolHash[tn].isActive) flag = true;
                                var resStyle = (flag ? myActiveStyle : myRegularStyle);
                                setStyle(obj, resStyle);
                            };
                            elAttr.onmouseover = function()	{
                                repaintFunc(this, true);
                            };
                            elAttr.innerHTML = attr.hint;
                        }
                        elAttr.onmouseout = function()	{
                            repaintFunc(this, false);
                        };
                       
                        var pt = (createItemNode ? createItemNode(my.itemsContainer) : function (parent) {
                            var tr = gmxAPI.newElement("tr", {	"className": 'tools_tr_' + name + '_' + tn	});
                            var td = gmxAPI.newElement("td", null, { padding: "4px", cursor: "pointer" });		// { padding: "4px", textAlign: "center" }
                            tr.appendChild(td);
                            var control = gmxAPI.newElement( elType, elAttr, myRegularStyle);
                            td.appendChild(control);
                            parent.appendChild(tr);
                            return {
                                'control': control	// нода для отображения выбранного tool элемента 
                                ,'row': tr	        // нода контейнера tool элемента (по умолчанию без контейнера)
                            };
                        }(my.itemsContainer));
                        var itemContainer = pt.control;
                        var row = pt.row || itemContainer;

                        toolHash[tn] = {
                            id: tn,
                            key: tn,
                            alias: attr.alias || null,
                            lang: attr.lang || null,
                            backgroundColor: attr.backgroundColor,
                            isActive: false,
                            isVisible: true,
                            control: itemContainer,
                            row: row,
                            setVisible: function(flag) {
                                this.isVisible = flag;
                                var st = 'visible';
                                if(flag) {
                                    row.style.display = '';
                                    row.style.visibility = 'visible';
                                } else {
                                    row.style.display = 'none';
                                    row.style.visibility = 'hidden';
                                }
                                my.chkVisible();
                            },
                            setToolImage: function(a1, a2) {},
                            repaint: function()	{
                                repaintFunc(itemContainer);
                            },
                            onClick: function()	{
                                this.isActive = true;
                                my.activeToolName = tn;
                                return attr.onClick.call();
                            },
                            onCancel: function()	{
                                this.isActive = false;
                                my.activeToolName = '';
                                attr.onCancel.call();
                                gmxAPI._listeners.dispatchEvent('onActiveChanged', gmxAPI.map.controlsManager, {id: tn, target: my});
                            }
                            ,
                            select: function() { my.selectTool(tn); }
                            ,
                            setActive: function() { my.selectTool(tn); }
                        }
                        toolHash[tn].line = row;      // для обратной совместимости

                        var pos = (attr.pos > 0 ? attr.pos : toolNames.length);
                        toolNames.splice(pos, 0, tn);
                        //positionTools();
                        if(!gmxAPI._drawing.tools[tn]) gmxAPI._drawing.tools[tn] = toolHash[tn];
                        my.chkVisible();
if(gmxAPI._drawing.toolInitFlags && gmxAPI._drawing.toolInitFlags[tn]) { // обратная совместимость
    toolHash[tn].setVisible(gmxAPI._drawing.toolInitFlags[tn].visible);
}
                        return toolHash[tn];
                    }
                    ,removeTool: function (tn) {
                        var num = my.getToolIndex(tn);
                        if(num === -1 || !toolHash[tn]) return false;
                        toolNames.splice(num, 1);
                        my.itemsContainer.removeChild(toolHash[tn].row);
                        delete toolHash[tn];
                        if(gmxAPI._drawing.tools[tn]) delete gmxAPI._drawing.tools[tn];
                        if(tn === my.activeToolName) my.activeToolName = '';
                        my.chkVisible();
                        return true;
                    }
                    ,createContainerNode: function (nodeType, properties, style) {
                        var node = gmxAPI.newElement(nodeType || 'div', properties, style);
                        if(gmxAPI.IconsControl) {
                            gmxAPI.IconsControl.node.appendChild(node);
                        } else {
                            gmxAPI._allToolsDIV.appendChild(node);
                        }
                        //gmxAPI._allToolsDIV.appendChild(node);
                        this.node = node
                        gmxAPI._toolsContHash[name] = node;
                        
                        var table = gmxAPI.newElement("table", {}, {
                            borderCollapse: 'collapse'
                            ,margin: '0px'
                            ,width: 'auto'
                            ,backgroundColor: 'rgba(1, 106, 138, 0)'
                        });
                        node.appendChild(table);
                        my.itemsContainer = gmxAPI.newElement("tbody", {}, {});
                        table.appendChild(this.itemsContainer);
                        return node;
                    }
                });
                my.createContainerNode('div', properties, style);

                if(!gmxAPI._tools) gmxAPI._tools = {};
                gmxAPI._tools[name] = this;
                return this;
            }
            //расширяем namespace
            gmxAPI._ToolsContainer = ToolsContainer;    
        })();

        gmxAPI._tools = Controls.controlsHash;

        //Поддержка zoomControl
        var zoomControl = {
            id: 'zoomControl'
            ,parentNode: null
            ,node: null
            ,listeners: {}
            ,
            init: function(cont) {        // инициализация
                zoomControl.parentNode = cont;
                if(!zoomControl.node) zoomControl.node = zoomControl.createNode(cont);
                if(!zoomControl.node.parentNode) zoomControl.setVisible(true);
                zoomControl.toggleHandlers(true);
                var zoomBounds = gmxAPI.map.getZoomBounds();
                if(zoomBounds) {
                    zoomControl.minZoom = zoomBounds.MinZoom;
                    zoomControl.maxZoom = zoomBounds.MaxZoom;
                    zoomControl.setZoom(gmxAPI.map.getZ());
                }
            }
            ,
            setVisible: function(flag) {        // инициализация
                var node = zoomControl.node;
                if(!flag) {
                    if(node.parentNode) node.parentNode.removeChild(node);
                } else {
                    if(!node.parentNode) zoomControl.parentNode.appendChild(node);
                    zoomControl.repaint();
                }
            }
            ,
            toggleHandlers: function(flag) {    // Добавление/Удаление прослушивателей событий
                if(flag) {
                    if(!gmxAPI.map.zoomControl) gmxAPI.map.zoomControl = zoomControl.mapZoomControl;
                    //var cz = (gmxAPI.map.needMove ? gmxAPI.map.needMove.z || 1 : 4);
                    //gmxAPI.map.zoomControl.setZoom(cz);
                    // Добавление прослушивателей событий
                    var key = 'onMinMaxZoom';
                    zoomControl.listeners[key] = gmxAPI.map.addListener(key, function(ph) {
                        var attr = ph.attr;
                        zoomControl.minZoom = attr.minZoom;
                        zoomControl.maxZoom = attr.maxZoom;
                        zoomControl.setZoom(attr.currZ);
                        zoomControl.repaint();
                    });

                    key = 'positionChanged';
                    zoomControl.listeners[key] = gmxAPI.map.addListener(key, function(ph) {
                        zoomControl.setZoom(ph.currZ);
                    });
                } else {
                    for(var key in zoomControl.listeners) gmxAPI.map.removeListener(key, zoomControl.listeners[key]);
                    zoomControl.listeners = {};
                    gmxAPI.map.zoomControl = {};
                }
            }
            ,
            remove: function() {      // удаление
                zoomControl.toggleHandlers(false);
                zoomControl.setVisible(false);
            }
            ,
            createNode: function(cont) {        // инициализация
                var apiBase = gmxAPI.getAPIFolderRoot();
                var node = zoomControl.zoomParent = gmxAPI.newElement(
                    "div",
                    {
                        className: "gmx_zoomParent1"
                    },
                    {
                        position: "absolute",
                        left: "40px",
                        top: "5px"
                    }
                );

                zoomControl.zoomPlaque = gmxAPI.newElement(
                    "div",
                    {
                        className: "gmx_zoomPlaque1"
                    },
                    {
                        backgroundColor: "#016a8a",
                        opacity: 0.5,
                        position: "absolute",
                        left: 0,
                        top: 0
                    }
                );
                node.appendChild(zoomControl.zoomPlaque);

                zoomControl.zoomMinus = gmxAPI.newElement(
                    "img",
                    {
                        className: "gmx_zoomMinus1",
                        src: apiBase + "img/zoom_minus.png",
                        onclick: function()
                        {
                            gmxAPI.map.zoomBy(-1);
                        },
                        onmouseover: function()
                        {
                            this.src = apiBase + "img/zoom_minus_a.png";
                        },
                        onmouseout: function()
                        {
                            this.src = apiBase + "img/zoom_minus.png"
                        }
                    },
                    {
                        position: "absolute",
                        left: "5px",
                        top: "7px",
                        cursor: "pointer"
                    }
                );
                node.appendChild(zoomControl.zoomMinus);

                for (var i = 0, len = zoomControl.maxZoom; i < len; i++) 
                    zoomControl.addZoomItem(i);

                zoomControl.zoomPlus = gmxAPI.newElement(
                    "img",
                    {
                        className: "gmx_zoomPlus1",
                        src: apiBase + "img/zoom_plus.png",
                        onclick: function()
                        {
                            gmxAPI.map.zoomBy(1);
                        },
                        onmouseover: function()
                        {
                            this.src = apiBase + "img/zoom_plus_a.png";
                        },
                        onmouseout: function()
                        {
                            this.src = apiBase + "img/zoom_plus.png"
                        }
                    },
                    {
                        position: "absolute",
                        cursor: "pointer"
                    }
                );
                node.appendChild(zoomControl.zoomPlus);
                return node;
            }
            ,minZoom: 1
            ,maxZoom: 30
            ,zoomArr: []
            ,zoomObj: null
            ,
            addZoomItem: function(i) {        // добавить zoom элемент
                var apiBase = gmxAPI.getAPIFolderRoot();
                var node = gmxAPI.newElement(
                    "img",
                    {
                        src: apiBase + "img/zoom_raw.png",
                        title: "" + (i + 1),
                        onclick: function()
                        {
                            gmxAPI.map.zoomBy(i + zoomControl.minZoom - gmxAPI.map.getZ());
                        },
                        onmouseover: function()
                        {
                            this.src = apiBase + "img/zoom_active.png";
                            this.title = "" + (i + zoomControl.minZoom);
                        },
                        onmouseout: function()
                        {
                            this.src = (this == zoomControl.zoomObj) ? (apiBase + "img/zoom_active.png") : (apiBase + "img/zoom_raw.png");
                        }
                    },
                    {
                        position: "absolute",
                        left: (22 + 12*i) + "px",
                        top: "12px",
                        width: "12px",
                        height: "8px",
                        border: 0,
                        cursor: "pointer"
                    }
                );
                zoomControl.zoomParent.appendChild(node);
                zoomControl.zoomArr.push(node);
            }
            ,
            repaint: function()
            {
                var dz = zoomControl.maxZoom - zoomControl.minZoom + 1;
                var gap = 12*dz;
                gmxAPI.position(zoomControl.zoomPlus, 20 + gap, 7);
                gmxAPI.size(zoomControl.zoomPlaque, 43 + gap, 32);
                //gmxAPI.map.zoomControl.width = 43 + gap;
                for (var i = 0; i < dz; i++) {
                    if(i == zoomControl.zoomArr.length) zoomControl.addZoomItem(i);
                    gmxAPI.setVisible(zoomControl.zoomArr[i], (i < dz));
                }
                if(dz < zoomControl.zoomArr.length) for (var i = dz; i < zoomControl.zoomArr.length; i++) gmxAPI.setVisible(zoomControl.zoomArr[i], false);
            }
            ,onChangeBackgroundColorID: null
            ,onMoveEndID: null
            ,setZoom: function(z) {
                var newZoomObj = zoomControl.zoomArr[Math.round(z) - zoomControl.minZoom];
                if (newZoomObj != zoomControl.zoomObj)
                {
                    var apiBase = gmxAPI.getAPIFolderRoot();
                    if (zoomControl.zoomObj) zoomControl.zoomObj.src = apiBase + "img/zoom_raw.png";
                    zoomControl.zoomObj = newZoomObj;
                    if (zoomControl.zoomObj) zoomControl.zoomObj.src = apiBase + "img/zoom_active.png";
                }
            },
            mapZoomControl: {
                isVisible: true,
                isMinimized: false,
                setVisible: function(flag)
                {
                    gmxAPI.setVisible(zoomControl.zoomParent, flag);
                    this.isVisible = flag;
                },
                setZoom: function(z)
                {
                    zoomControl.setZoom(z);
                },
                repaint: function()
                {
                    if(!this.isMinimized) zoomControl.repaint();
                },
                setMinMaxZoom: function(z1, z2)
                {
                    zoomControl.minZoom = z1;
                    zoomControl.maxZoom = z2;
                    this.repaint();
                },
                getMinZoom: function()
                {
                    return zoomControl.minZoom;
                },
                getMaxZoom: function()
                {
                    return zoomControl.maxZoom;
                },
                minimize: function()
                {
                    this.isMinimized = true;
                    this.repaint();
                },
                maximize: function()
                {
                    this.isMinimized = false;
                    this.repaint();
                }
            }
            ,getInterface: function() {
                return {
                    setVisible: zoomControl.setVisible
                };
            }
        }

        //Поддержка geomixerLink
        var geomixerLink = {
            id: 'geomixerLink'
            ,parentNode: null
            ,node: null
            ,init: function(cont) {        // инициализация
                geomixerLink.parentNode = cont.parentNode;
                if(!geomixerLink.node) geomixerLink.node = geomixerLink.createNode(geomixerLink.parentNode);
                if(!geomixerLink.node.parentNode) geomixerLink.parentNode.appendChild(geomixerLink.node);
            }
            ,
            remove: function() {      // удаление
                if(geomixerLink.node.parentNode) geomixerLink.parentNode.removeChild(geomixerLink.node);
            }
            ,
            createNode: function(cont) {        // инициализация
                var apiBase = gmxAPI.getAPIFolderRoot();
                var node = gmxAPI.newElement(
                    "a",
                    {
                        href: "http://geomixer.ru",
                        target: "_blank",
                        className: "gmx_geomixerLink"
                    },
                    {
                        position: "absolute",
                        left: "8px",
                        bottom: "8px"
                    }
                );
                node.appendChild(gmxAPI.newElement(
                    "img",
                    {
                        src: apiBase + "img/geomixer_logo_api.png",
                        title: gmxAPI.KOSMOSNIMKI_LOCALIZED("© 2007-2011 ИТЦ «СканЭкс»", "(c) 2007-2011 RDC ScanEx"),
                        width: 130,
                        height: 34
                    },
                    {
                        border: 0
                    }
                ));
                return node;
            }
            ,getInterface: function() {
                return {
                    remove: geomixerLink.remove
                };
            }
        }

        //Поддержка minimizeTools
        var minimizeTools = {
            id: 'minimize'
            ,parentNode: null
            ,node: null
            ,
            init: function(cont) {        // инициализация
                minimizeTools.parentNode = cont.parentNode;
                if(!minimizeTools.node) minimizeTools.node = minimizeTools.createNode(minimizeTools.parentNode);
                if(!minimizeTools.node.parentNode) minimizeTools.setVisible(true);
                
                var apiBase = gmxAPI.getAPIFolderRoot();
                gmxAPI.map.isToolsMinimized = function()
                {
                    return minimizeTools.toolsMinimized;
                }
                gmxAPI.map.minimizeTools = function()
                {
                    minimizeTools.toolsMinimized = true;
                    minimizeTools.node.src = apiBase + "img/tools_off.png";
                    minimizeTools.node.title = gmxAPI.KOSMOSNIMKI_LOCALIZED("Показать инструменты", "Show tools");
                    gmxAPI.setVisible(gmxAPI._allToolsDIV, false);
                    gmxAPI._listeners.dispatchEvent('onToolsMinimized', gmxAPI.map, minimizeTools.toolsMinimized);
                }
                gmxAPI.map.maximizeTools = function()
                {
                    minimizeTools.toolsMinimized = false;
                    minimizeTools.node.src = apiBase + "img/tools_on.png";
                    minimizeTools.node.title = gmxAPI.KOSMOSNIMKI_LOCALIZED("Скрыть инструменты", "Hide tools");
                    gmxAPI.setVisible(gmxAPI._allToolsDIV, true);
                    gmxAPI._listeners.dispatchEvent('onToolsMinimized', gmxAPI.map, minimizeTools.toolsMinimized);
                }
                gmxAPI.map.maximizeTools();

                gmxAPI.extend(gmxAPI.map.allControls, {
                    setVisible: function(flag)
                    {
                        gmxAPI.setVisible(minimizeTools.plaqueNode, flag);
                        gmxAPI.setVisible(minimizeTools.node, flag);
                        gmxAPI.setVisible(gmxAPI._allToolsDIV, flag);
                    },
                    minimize: gmxAPI.map.minimizeTools,
                    maximize: gmxAPI.map.maximizeTools
                });
            }
            ,
            remove: function() {      // удаление
                minimizeTools.setVisible(false);
            }
            ,
            setVisible: function(flag) {        // инициализация
                var node = minimizeTools.node;
                if(!flag) {
                    if(node.parentNode) node.parentNode.removeChild(node);
                    if(minimizeTools.plaqueNode.parentNode) minimizeTools.plaqueNode.parentNode.removeChild(minimizeTools.plaqueNode);
                } else {
                    if(!minimizeTools.plaqueNode.parentNode) minimizeTools.parentNode.appendChild(minimizeTools.plaqueNode);
                    if(!node.parentNode) minimizeTools.parentNode.appendChild(node);
                }
            }
            ,
            createNode: function(cont) {        // инициализация
                minimizeTools.plaqueNode = gmxAPI.newStyledDiv({
                    position: "absolute",
                    left: "4px",
                    top: "5px",
                    width: "32px",
                    height: "32px",
                    backgroundColor: "#016a8a",
                    opacity: 0.5
                });

                minimizeTools.toolsMinimized = false;
                var apiBase = gmxAPI.getAPIFolderRoot();
                var node = gmxAPI.newElement(
                    "img",
                    {
                        onclick: function()
                        {
                            if (minimizeTools.toolsMinimized)
                                gmxAPI.map.maximizeTools();
                            else
                                gmxAPI.map.minimizeTools();
                        },
                        onmouseover: function()
                        {
                            if (minimizeTools.toolsMinimized)
                                this.src = apiBase + "img/tools_off_a.png";
                            else
                                this.src = apiBase + "img/tools_on_a.png";
                        },
                        onmouseout: function()
                        {
                            if (minimizeTools.toolsMinimized)
                                this.src = apiBase + "img/tools_off.png";
                            else
                                this.src = apiBase + "img/tools_on.png";
                        }
                    },
                    {
                        position: "absolute",
                        left: "8px",
                        top: "8px",
                        cursor: "pointer"
                    }
                );
                return node;
            }
            ,getInterface: function() {
                return {
                    remove: minimizeTools.remove
                    ,setVisible: minimizeTools.setVisible
                };
            }
        }

        //Поддержка copyright
        var copyrightControl = {
            id: 'copyrights'
            ,parentNode: null
            ,node: null
            ,items: []
            ,currentText: ''
            ,addItem: function(obj, copyright, z1, z2, geo) {
                this.removeItem(obj, copyright);
                var bounds = null;
                if (geo) {
                    bounds = gmxAPI.getBounds(geo.coordinates);
                } else if (obj.geometry) {
                    bounds = obj.bounds || gmxAPI.getBounds(obj.geometry.coordinates);
                }
                if (!z1) z1 = 0;
                if (!z2) z2 = 100;
                this.items.push([obj, copyright, z1, z2, bounds]);
                this.redraw();
                return true;
            }
            ,
            removeItem: function(obj, copyright) {
                var arr = [];
                this.items.forEach(function(item, i) {
                    if((copyright && copyright !== item[1])
                        || obj !== item[0]) {
                        arr.push(item);
                    }
                });
                copyrightControl.items = arr;
            }
            ,
            setColor: function(color) {
                copyrightControl.node.style.color = color;
            }
            ,
            init: function(cont) {        // инициализация
                copyrightControl.parentNode = cont.parentNode;
                if(!copyrightControl.node) copyrightControl.node = copyrightControl.createNode(copyrightControl.parentNode);
                if(!copyrightControl.node.parentNode) copyrightControl.setVisible(true);
                copyrightControl.toggleHandlers(true);
                copyrightControl.setColor(gmxAPI.getHtmlColor());
                copyrightControl.redraw();
            }
            ,
            createNode: function(cont) {        // инициализация
                var node = gmxAPI.newElement(
                    "span",
                    {
                        className: "gmx_copyright"
                    },
                    {
                        fontSize: "11px",
                        position: "absolute",
                        right: '26px',
                        bottom: '7px'
                    }
                );
                return node;
            }
            ,
            remove: function() {      // удаление
                copyrightControl.toggleHandlers(false);
                copyrightControl.setVisible(false);
            }
            ,
            setVisible: function(flag) {        // инициализация
                if(!flag) {
                    if(copyrightControl.node.parentNode) copyrightControl.node.parentNode.removeChild(copyrightControl.node);
                } else {
                    copyrightControl.parentNode.appendChild(copyrightControl.node);
                }
            }
            ,onChangeBackgroundColorID: null
            ,onMoveEndID: null
            ,
            toggleHandlers: function(flag) {            // Добавление прослушивателей событий
                var map = gmxAPI.map;
                if(flag) {
                    map.addCopyrightedObject = function(obj, copyright, z1, z2, geo) {
                        copyrightControl.addItem(obj, copyright, z1, z2, geo);
                    }
                    map.removeCopyrightedObject = function(obj) { copyrightControl.removeItem(obj); }
                    map.setCopyrightVisibility = function(obj) { copyrightControl.setVisible(obj); } 
                    map.updateCopyright = function() { copyrightControl.redraw(); } 
                    // Изменить позицию контейнера копирайтов
                    map.setCopyrightAlign = function(attr) {
                        if(attr.align) copyrightControl.copyrightAlign = attr.align;
                        copyrightControl.setPosition();
                    }
                    
                    copyrightControl.onChangeBackgroundColorID = map.addListener('onChangeBackgroundColor', function(htmlColor) {
                        copyrightControl.setColor(htmlColor);
                        copyrightControl.redraw();
                    });
                    var updateListenerID = null;
                    var evName = (gmxAPI.proxyType === 'flash' ? 'positionChanged' : 'onMoveEnd');
                    copyrightControl.onMoveEndID = map.addListener(evName, function()
                        {
                            if (updateListenerID) return;
                            updateListenerID = setTimeout(function()
                            {
                                copyrightControl.redraw();
                                clearTimeout(updateListenerID);
                                updateListenerID = null;
                            }, 250);
                        }
                    );
                } else {
                    map.addCopyrightedObject = 
                    map.removeCopyrightedObject = 
                    map.setCopyrightVisibility = 
                    map.setCopyrightAlign = 
                    map.updateCopyright = function() {};
                    
                    if(copyrightControl.onChangeBackgroundColorID) {
                        map.removeListener('onChangeBackgroundColor', copyrightControl.onChangeBackgroundColorID);
                        copyrightControl.onChangeBackgroundColorID = null;
                    }
                    if(copyrightControl.onMoveEndID) {
                        var evName = (gmxAPI.proxyType === 'flash' ? 'positionChanged' : 'onMoveEnd');
                        map.removeListener(evName, copyrightControl.onMoveEndID);
                        copyrightControl.onMoveEndID = null;
                    }
                }
            }
            ,
            forEach: function(callback) {
                for (var i = 0, len = this.items.length; i < len; i++) {
                    if(callback(this.items[i], i) === false) return;
                }
            }
            ,
            redraw: function() {                // перерисовать с задержкой 
                if(this.redrawTimer) clearTimeout(this.redrawTimer);
                this.redrawTimer = setTimeout(function() {
                    copyrightControl.redrawTimer = null;
                    copyrightControl.redrawItems();
                }, 100);
            }
            ,
            redrawItems: function() {            // перерисовать
                var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
                if(!currPos.latlng || !currPos.latlng.extent) return;
                var chkExists = {};
                var texts = [
                    //первым всегда будет располагаться копирайт СканЭкс. 
                    "<a target='_blank' style='color: inherit;' href='http://maps.kosmosnimki.ru/Apikey/License.html'>&copy; 2007-2014 " + gmxAPI.KOSMOSNIMKI_LOCALIZED("&laquo;СканЭкс&raquo;", "RDC ScanEx") + "</a>"
                ];
                this.forEach(function(item, i) {
                    var obj = item[0];
                    var copyright = item[1];
                    if (!copyright || !obj.objectId || !obj.getVisibility()) return;  // обьекта нет на экране или без копирайта
                    if (chkExists[copyright]) return;  // дубли копирайтов
                    var z1 = item[2],
                        z2 = item[3],
                        bounds = item[4],
                        zoom = currPos.z;

                    if (zoom < z1 || zoom > z2) return;
                    if (bounds && !gmxAPI.extIntersect(currPos.latlng.extent, bounds)) return;
                    chkExists[copyright] = true;
                    texts.push(copyright.split("<a").join("<a target='_blank' style='color: inherit;'"));
                });
                if(gmxAPI.proxyType == 'leaflet') texts.push("<a target='_blank' style='color: inherit;' href='http://leafletjs.com'>&copy; Leaflet</a>");

                var text = texts.join(' ');

                if(this.currentText != text) {
                    this.currentText = text;
                    copyrightControl.node.innerHTML = text;
                    gmxAPI._listeners.dispatchEvent('copyrightRepainted', gmxAPI.map, text);
                }
                if(copyrightControl.copyrightAlign) copyrightControl.setPosition();
            }
            ,copyrightAlign: ''
            ,copyrightLastAlign: ''
            ,
            setPosition: function() {            // Изменить координаты HTML элемента
                var node = copyrightControl.node;
                var center = (copyrightControl.parentNode.clientWidth - node.clientWidth) / 2;
                if(copyrightControl.copyrightLastAlign != copyrightControl.copyrightAlign) {
                    copyrightControl.copyrightLastAlign = copyrightControl.copyrightAlign;
                    if(copyrightControl.copyrightAlign === 'bc') {				// Позиция bc(BottomCenter)
                        gmxAPI.setPositionStyle(node, { 'top': '', 'bottom': copyrightAttr.y, 'right': '', 'left': center + 'px' });
                    } else if(copyrightControl.copyrightAlign === 'br') {		// Позиция br(BottomRight)
                        gmxAPI.setPositionStyle(node, { 'top': '', 'bottom': copyrightAttr.y, 'right': copyrightAttr.x, 'left': '' });
                    } else if(copyrightControl.copyrightAlign === 'bl') {		// Позиция bl(BottomLeft)
                        gmxAPI.setPositionStyle(node, { 'top': '', 'bottom': copyrightAttr.y, 'right': '', 'left': copyrightAttr.x });
                    } else if(copyrightControl.copyrightAlign === 'tc') {		// Позиция tc(TopCenter)
                        gmxAPI.setPositionStyle(node, { 'top': '0px', 'bottom': '', 'right': '', 'left': center + 'px' });
                    } else if(copyrightControl.copyrightAlign === 'tr') {		// Позиция tr(TopRight)
                        gmxAPI.setPositionStyle(node, { 'top': '0px', 'bottom': '', 'right': copyrightAttr.x, 'left': '' });
                    } else if(copyrightControl.copyrightAlign === 'tl') {		// Позиция tl(TopLeft)
                        gmxAPI.setPositionStyle(node, { 'top': '0px', 'bottom': '', 'right': '', 'left': copyrightAttr.x });
                    }
                }
            }
            ,getInterface: function() {
                return {
                    remove: copyrightControl.remove
                    ,setVisible: copyrightControl.setVisible
                    ,add: copyrightControl.addItem
                    ,removeItem: copyrightControl.removeItem
                };
            }
        }
        
        //Поддержка - отображения строки текущего положения карты
        var locationControl = {
            id: 'location'
            ,parentNode: null
            ,nodes: null
            ,locationTitleDiv: null
            ,scaleBar: null
            ,items: []
            ,currentText: ''
            ,
            init: function(cont) {        // инициализация
                locationControl.parentNode = cont.parentNode;
                if(!locationControl.nodes) locationControl.nodes = locationControl.createNode(locationControl.parentNode);
                if(!locationControl.nodes[0].parentNode) locationControl.setVisible(true);
                locationControl.toggleHandlers(true);
                locationControl.chkExists();
            }
            ,
            chkExists: function() {     // Проверка уже установленных данных
                locationControl.setColor(gmxAPI.getHtmlColor(), true);
                locationControl.prpPosition();
            }
            ,
            remove: function() {      // удаление
                locationControl.toggleHandlers(false);
                locationControl.setVisible(false);
            }
            ,
            setVisible: function(flag) {        // инициализация
                if(!flag) {
                    for (var i = 0, len = this.nodes.length; i < len; i++) {
                        var node = this.nodes[i];
                        if(node.parentNode) node.parentNode.removeChild(node);
                    }
                } else {
                    for (var i = 0, len = this.nodes.length; i < len; i++) {
                        var node = this.nodes[i];
                        if(!node.parentNode) locationControl.parentNode.appendChild(node);
                    }
                }
            }
            ,onChangeBackgroundColorID: null
            ,onMoveEndID: null
            ,positionChangedID: null
            ,onResizeMapID: null
            ,
            toggleHandlers: function(flag) {            // Добавление прослушивателей событий
                if(flag) {
                    gmxAPI.map.scaleBar = { setVisible: function(flag) { gmxAPI.setVisible(locationControl.scaleBar, flag); } };
                    
                    gmxAPI.map.coordinates = {
                        setVisible: function(flag) { 
                            gmxAPI.setVisible(locationControl.coordinates, flag); 
                            gmxAPI.setVisible(locationControl.changeCoords, flag); 
                        }
                        ,
                        addCoordinatesFormat: function(func) { 
                            locationControl.coordFormatCallbacks.push(func);
                            return locationControl.coordFormatCallbacks.length - 1;
                        }
                        ,
                        removeCoordinatesFormat: function(num) { 
                            locationControl.coordFormatCallbacks.splice(num, 1);
                            return locationControl.coordFormatCallbacks.length - 1;
                        }
                        ,
                        setFormat: locationControl.setCoordinatesFormat
                    }

                    locationControl.positionChangedID = gmxAPI.map.addListener('positionChanged', locationControl.prpPosition);
                    if(gmxAPI.proxyType === 'flash') {
                        locationControl.onResizeMapID = gmxAPI.map.addListener('onResizeMap', locationControl.prpPosition);
                    } else {
                        locationControl.onMoveEndID = gmxAPI.map.addListener('onMoveEnd', locationControl.checkPositionChanged);
                    }
                    locationControl.onChangeBackgroundColorID = gmxAPI.map.addListener('onChangeBackgroundColor', function(htmlColor) {
                        locationControl.setColor(htmlColor);
                    });
                } else {
                    gmxAPI.map.coordinates = 
                    gmxAPI.map.scaleBar = function() {};
                    
                    if(locationControl.onChangeBackgroundColorID) {
                        gmxAPI.map.removeListener('onChangeBackgroundColor', locationControl.onChangeBackgroundColorID);
                        locationControl.onChangeBackgroundColorID = null;
                    }
                    if(locationControl.positionChangedID) {
                        gmxAPI.map.removeListener('positionChanged', locationControl.positionChangedID);
                        locationControl.positionChangedID = null;
                    }
                    if(locationControl.onMoveEndID) {
                        gmxAPI.map.removeListener('onMoveEnd', locationControl.onMoveEndID);
                        locationControl.onMoveEndID = null;
                    }
                    if(locationControl.onResizeMapID) {
                        gmxAPI.map.removeListener('onResizeMap', locationControl.onResizeMapID);
                        locationControl.onResizeMapID = null;
                    }
                }
            }
            ,
            showCoordinates: function() {        //окошко с координатами
                if (locationControl.coordFormat > 2) return; //выдаем окошко с координатами только для стандартных форматов.
                var oldText = locationControl.getCoordinatesText();
                var text = window.prompt(gmxAPI.KOSMOSNIMKI_LOCALIZED("Текущие координаты центра карты:", "Current center coordinates:"), oldText);
                if (text && (text != oldText))
                    gmxAPI.map.moveToCoordinates(text);
            }
            ,
            nextCoordinatesFormat: function() {
                locationControl.coordFormat += 1;
                locationControl.setCoordinatesFormat(locationControl.coordFormat);
            }
            ,
            createNode: function(cont) {        // инициализация
                var nodes = [
                    gmxAPI.newElement(
                        "div",
                        {
                        },
                        {
                        }
                    )
                    ,
                    gmxAPI.newElement(
                        "div",
                        {
                            className: "gmx_scaleBar1"
                        },
                        {
                            position: "absolute",
                            border: '1px solid #000000',
                            color: 'black',
                            pointerEvents: "none",
                            right: '27px',
                            bottom: '47px',
                            textAlign: "center"
                        }
                    )
                    ,
                    gmxAPI.newElement(
                        "div",
                        {
                            className: "gmx_coordinates",
                            onclick: locationControl.showCoordinates
                        },
                        {
                            position: "absolute",
                            fontSize: "14px",
                            color: 'black',
                            right: '27px',
                            bottom: '25px',
                            cursor: "pointer"
                        }
                    )
                    ,
                    gmxAPI.newElement(
                        "div", 
                        { 
                            className: "gmx_changeCoords",
                            title: gmxAPI.KOSMOSNIMKI_LOCALIZED("Сменить формат координат", "Toggle coordinates format"),
                            onclick: locationControl.nextCoordinatesFormat
                        },
                        {
                            position: "absolute",
                            backgroundImage: 'url("'+gmxAPI.getAPIFolderRoot() + 'img/coord_reload.png")',
                            width: '19px',
                            height: '19px',
                            right: '5px',
                            bottom: '25px',
                            cursor: "pointer"
                        }
                    )
                ];
                gmxAPI._locationTitleDiv = locationControl.locationTitleDiv = nodes[0];
                locationControl.scaleBar = nodes[1];
                locationControl.coordinates = nodes[2];
                locationControl.changeCoords = nodes[3];
                
                return nodes;
            }
            ,
            forEach: function(callback) {
                for (var i = 0, len = this.items.length; i < len; i++) {
                    if(callback(this.items[i], i) === false) return;
                }
            }
            ,
            setColor: function(color, flag) {
                gmxAPI.setStyleHTML(locationControl.coordinates, {
                    'fontSize': "14px",
                    'color': color
                });
                gmxAPI.setStyleHTML(locationControl.scaleBar, {
                    'border': "1px solid " + color,
                    'fontSize': "11px",
                    'color': color
                });
                var url = gmxAPI.getAPIFolderRoot() + 'img/coord_reload' + (color === 'white' ? '_orange':'') + '.png';
                gmxAPI.setStyleHTML(locationControl.changeCoords, {
                    'backgroundImage': 'url("'+url+'")'
                });

                if(flag) {
                    locationControl.checkPositionChanged();
                }
            }
            ,
            repaintScaleBar: function() {
                if (locationControl.scaleBarText) {
                    gmxAPI.size(locationControl.scaleBar, locationControl.scaleBarWidth, 16);
                    locationControl.scaleBar.innerHTML = locationControl.scaleBarText;
                }
            }
            ,
            checkPositionChanged: function() {
                var attr = gmxAPI.getScaleBarDistance();
                if (!attr || (attr.txt === locationControl.scaleBarText && attr.width === locationControl.scaleBarWidth)) return;
                locationControl.scaleBarText = attr.txt;
                locationControl.scaleBarWidth = attr.width;
                locationControl.repaintScaleBar();
            }
            ,coordFormat: 0
            ,prevCoordinates: ''
            ,
            getCoordinatesText: function(currPos) {
                return gmxAPI.getCoordinatesText(currPos, locationControl.coordFormat);
            }
            ,
            clearCoordinates: function() {
                var node = locationControl.coordinates;
                for (var i = node.childNodes.length - 1; i >= 0; i--)
                    node.removeChild(node.childNodes[i]);
            }
            ,
            coordFormatCallbacks: [		// методы формирования форматов координат
                function() { return locationControl.getCoordinatesText(); },
                function() { return locationControl.getCoordinatesText(); },
                function() { return locationControl.getCoordinatesText(); }
            ]
            ,
            setCoordinatesFormat: function(num, screenGeometry) {
                if(!num) num = locationControl.coordFormat;
                if(num < 0) num = locationControl.coordFormatCallbacks.length - 1;
                else if(num >= locationControl.coordFormatCallbacks.length) num = 0;
                locationControl.coordFormat = num;
                if(!screenGeometry) screenGeometry = gmxAPI.map.getScreenGeometry();
                var attr = {'screenGeometry': screenGeometry, 'properties': gmxAPI.map.properties };
                var res = locationControl.coordFormatCallbacks[num](locationControl.coordinates, attr);		// если есть res значит запомним ответ
                if(res && locationControl.prevCoordinates != res) locationControl.coordinates.innerHTML = res;
                locationControl.prevCoordinates = res;
                gmxAPI._listeners.dispatchEvent('onSetCoordinatesFormat', gmxAPI.map, num);
            }
            ,setCoordinatesFormatTimeout: null
            ,prpPosition: function() {
                if (locationControl.setCoordinatesFormatTimeout) return;
                locationControl.setCoordinatesFormatTimeout = setTimeout(function()
                {
                    clearTimeout(locationControl.setCoordinatesFormatTimeout);
                    locationControl.setCoordinatesFormatTimeout = null;
                    if(gmxAPI.proxyType === 'flash') locationControl.checkPositionChanged();
                    locationControl.setCoordinatesFormat();
                }, 150);
            }
            ,getInterface: function() {
                return {
                    remove: locationControl.remove
                    ,setVisible: locationControl.setVisible
                };
            }
        }

        //Контролы слоев
        var layersControl = {
            id: 'layers'
            ,parentNode: null
            ,node: null
            ,itemsContainer: null
            ,mapInitListenerID: null
            ,listeners: {}
            ,map: null
            ,
            init: function(cont) {        // инициализация
                layersControl.parentNode = cont;
                var regularStyle = {
                    paddingTop: "4px", 
                    paddingBottom: "4px", 
                    paddingLeft: "10px", 
                    paddingRight: "10px", 
                    fontSize: "12px",
                    fontFamily: "sans-serif",
                    fontWeight: "bold",
                    textAlign: "center",
                    cursor: "pointer", 
                    opacity: 1, 
                    color: "white"
                };
                var activeStyle = {
                    paddingTop: "4px", 
                    paddingBottom: "4px", 
                    paddingLeft: "10px", 
                    paddingRight: "10px", 
                    fontSize: "12px",
                    fontFamily: "sans-serif",
                    fontWeight: "bold",
                    textAlign: "center",
                    cursor: "pointer", 
                    opacity: 1, 
                    color: 'orange'
                };
                var attr = {
                    'properties': { 'className': 'gmxTools' }
                    ,
                    'style': { }
                    ,
                    'regularStyle': regularStyle
                    ,
                    'activeStyle': activeStyle
                    ,
                    'contType': 2	// режим отключения выбора item
                };

                var baseLayersTools = new gmxAPI._ToolsContainer('baseLayers', attr);
                gmxAPI.baseLayersTools = baseLayersTools;

                gmxAPI.map.baseLayersTools = baseLayersTools;
                
                layersControl.toggleHandlers(true);
                layersControl._chkActiveChanged();
                gmxAPI.map.baseLayerControl.setVisible = baseLayersTools.setVisible; // обратная совместимость
            }
            ,
            remove: function() {      // удаление
                layersControl.toggleHandlers(false);
                gmxAPI.baseLayersTools.remove();
            }
            ,
            _addBaseLayerTool: function(ph) {
                var id = ph.id;
                var attr = {
                    onClick: function() { gmxAPI.map.setBaseLayer(id); },
                    onCancel: function() { gmxAPI.map.unSetBaseLayer(); },
                    hint: gmxAPI.KOSMOSNIMKI_LOCALIZED(ph.rus, ph.eng) || id
                };
                var tool = layersControl.map.baseLayersTools.chkBaseLayerTool(id, attr);
                if(tool) tool.setVisible(false);
                return tool;
            }
            ,
            _chkActiveChanged: function() {
                var activeIDs = mbl.getActiveIDs();
                //console.log('onActiveChanged', activeIDs);
                var tools = layersControl.map.baseLayersTools;
                var pt = {};
                for (var i = 0, len = activeIDs.length; i < len; i++) {
                    var id = activeIDs[i];
                    var tool = tools.getTool(id);
                    var baseLayer = mbl.get(id);
                    if(baseLayer) {
                        if(!tool) tool = layersControl._addBaseLayerTool(baseLayer);
                        tool.setVisible(true);
                        tools.setToolIndex(id, i);
                        pt[id] = true;
                    } else {
                        if(tool) tool.setVisible(false);
                    }
                }
                tools.forEach(function(item, i) {
                    var id = item.id;
                    if(!pt[id]) {
                        tools.removeTool(id);
                    }
                });
                var id = mbl.getCurrentID();
                if(id) tools.setActiveTool(id);

            }
            ,
            toggleHandlers: function(flag) {            // Добавление прослушивателей событий
                if(flag) {
                    layersControl.map = gmxAPI.map;

                    var key = 'onAdd';
                    layersControl.listeners[key] = mbl.addListener(key, layersControl._chkActiveChanged);
                    
                    key = 'onActiveChanged';
                    layersControl.listeners[key] = mbl.addListener(key, layersControl._chkActiveChanged);

                    key = 'onSetCurrent';
                    layersControl.listeners[key] = mbl.addListener(key, function(bl) {
                        layersControl.map.baseLayersTools.setActiveTool((bl ? bl.id : ''));
                    });
                    key = 'onRemove';
                    layersControl.listeners[key] = layersControl.map.addListener(key, function(bl) {
                        layersControl.map.baseLayersTools.removeTool((bl ? bl.id : ''));
                    });
                } else {
                    for(var key in layersControl.listeners) layersControl.map.removeListener(key, layersControl.listeners[key]);
                    layersControl.listeners = {};
                }
            }
            ,getInterface: function() {
                return gmxAPI.baseLayersTools;
            }
        }

        var drawingControl = {
            id: 'drawing'
            ,parentNode: null
            ,node: null
            ,hideNode: null
            ,items: []
            ,
            init: function(cont) {        // инициализация
                // Установка drawing контролов
                    var attr = {
                        properties: { className: 'gmxTools' }
                        ,
                        style: {
                            marginTop: '40px'
                        }
                        ,
                        regularStyle: {
                            paddingTop: "0px", 
                            paddingBottom: "0px", 
                            paddingLeft: "0px", 
                            paddingRight: "0px", 
                            fontSize: "12px",
                            fontFamily: "sans-serif",
                            fontWeight: "bold",
                            textAlign: "center",
                            cursor: "pointer", 
                            opacity: 1, 
                            color: "wheat"
                        }
                        ,
                        activeStyle: {
                            paddingTop: "0px", 
                            paddingBottom: "0px", 
                            paddingLeft: "0px", 
                            paddingRight: "0px", 
                            fontSize: "12px",
                            fontFamily: "sans-serif",
                            fontWeight: "bold",
                            textAlign: "center",
                            cursor: "pointer", 
                            opacity: 1, 
                            color: 'orange'
                        }
                        ,
                        contType: 1	// режим для drawing tools
                    };
                    var standartTools = new gmxAPI._ToolsContainer('standart', attr);
                    var apiBase = gmxAPI.getAPIFolderRoot();
                    var arr = [
                        {
                            key: "move",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/move_tool.png",
                            activeImageUrl: apiBase + "img/move_tool_a.png",
                            onClick: gmxAPI._drawFunctions.move,
                            onCancel: function() {},
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Перемещение", "Move")
                        }
                        ,
                        {
                            key: "zoom",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/select_tool.png",
                            activeImageUrl: apiBase + "img/select_tool_a.png",
                            onClick: gmxAPI._drawFunctions.zoom,
                            onCancel: function() {},
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Увеличение", "Zoom")
                        }
                        ,
                        {
                            key: "POINT",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/marker_tool.png",
                            activeImageUrl: apiBase + "img/marker_tool_a.png",
                            onClick: gmxAPI._drawFunctions.POINT,
                            onCancel: gmxAPI._drawing.endDrawing,
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Маркер", "Marker")
                        }
                        ,
                        {
                            key: "LINESTRING",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/line_tool.png",
                            activeImageUrl: apiBase + "img/line_tool_a.png",
                            onClick: gmxAPI._drawFunctions.LINESTRING,
                            onCancel: gmxAPI._drawing.endDrawing,
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Линия", "Line")
                        }
                        ,
                        {
                            key: "POLYGON",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/polygon_tool.png",
                            activeImageUrl: apiBase + "img/polygon_tool_a.png",
                            onClick: gmxAPI._drawFunctions.POLYGON,
                            onCancel: gmxAPI._drawing.endDrawing,
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Полигон", "Polygon")
                        }
                        ,
                        {
                            key: "FRAME",
                            activeStyle: {},
                            regularStyle: {},
                            regularImageUrl: apiBase + "img/frame_tool.png",
                            activeImageUrl: apiBase + "img/frame_tool_a.png",
                            onClick: gmxAPI._drawFunctions.FRAME,
                            onCancel: gmxAPI._drawing.endDrawing,
                            hint: gmxAPI.KOSMOSNIMKI_LOCALIZED("Рамка", "Rectangle")
                        }
                    ];
                    for(var i=0; i<arr.length; i++) {
                        standartTools.addTool(arr[i].key, arr[i]);
                    }
                    standartTools.selectTool("move");

                    gmxAPI._drawing.control = gmxAPI.map.standartTools = standartTools;
                    gmxAPI._listeners.addListener({level: -10, eventName: 'mapCreated', func: function(map) {
                        gmxAPI.map.drawing.addListener('onFinish', function() {
                            var activeToolName = gmxAPI.map.standartTools.activeToolName;
                            if(activeToolName === 'FRAME'
                                || activeToolName === 'POLYGON'
                                || activeToolName === 'LINESTRING'
                                || activeToolName === 'POINT'
                                || activeToolName === 'zoom'
                            ) gmxAPI.map.standartTools.selectTool("move");
                        });
                    }});
            }
            ,getInterface: function() {
                return gmxAPI.map.standartTools;
            }
        }

        outControls = {
            zoomControl: zoomControl
            ,minimizeTools: minimizeTools
            ,geomixerLink: geomixerLink
            ,copyrightControl: copyrightControl
            ,locationControl: locationControl
            ,drawingControl: drawingControl
            ,layersControl: layersControl
        }
        gmxAPI.extend(Controls.controlsHash, outControls);

        for(var key in outControls) {
            var item = outControls[key];
            if('init' in item) item.init(gmxAPI._allToolsDIV);
        }

        return outControls;
	}

    var Controls = {
        id: 'controlsBase'
        ,isActive: false
        ,controlsHash: {}
        ,initControls: initControls
        ,remove: function() {      // удаление
            for(var key in Controls.controlsHash) {
                var item = Controls.controlsHash[key];
                if('remove' in item) item.remove();
            }
            Controls.controlsHash = {};
        }
        ,setControl: function(id, control) {
            if(Controls.controlsHash[id]) return false;
            Controls.controlsHash[id] = control;
            return true;
        }
        ,getControl: function(id) {
            var control = this.controlsHash[id] || null;
            return (control && 'getInterface' in control ? control.getInterface() : control);
        }
    }

    if(!gmxAPI._controls) gmxAPI._controls = {};
    gmxAPI._controls[Controls.id] = Controls;
})();
;/* ======================================================================
    controlsBaseIcons.js
   ====================================================================== */

// Стандартные контролы
(function()
{
    "use strict";
    var titles = {
        locationTxt: gmxAPI.KOSMOSNIMKI_LOCALIZED("Текущие координаты центра карты", "Current center coordinates")
        ,coordFormatChange: gmxAPI.KOSMOSNIMKI_LOCALIZED("Сменить формат координат", "Toggle coordinates format")
        ,print: gmxAPI.KOSMOSNIMKI_LOCALIZED("Печать", "Print")
        ,permalink: gmxAPI.KOSMOSNIMKI_LOCALIZED("Пермалинк", "Link to the map")
        ,boxZoom: gmxAPI.KOSMOSNIMKI_LOCALIZED("Увеличение", "BoxZoom")
        ,marker: gmxAPI.KOSMOSNIMKI_LOCALIZED("Маркер", "Marker")
        ,polygon: gmxAPI.KOSMOSNIMKI_LOCALIZED("Многоугольник", "Polygon")
        ,line: gmxAPI.KOSMOSNIMKI_LOCALIZED("Линия", "Line")
        ,rectangle: gmxAPI.KOSMOSNIMKI_LOCALIZED("Прямоугольник", "Rectangle")
        ,toggleVisibility: gmxAPI.KOSMOSNIMKI_LOCALIZED("Показать/Скрыть", "Show/Hide")
    }
    var styleIcon = {        // стиль ноды иконок по умолчанию
        borderRadius: '4px'
        ,display: 'block'
        ,cursor: 'pointer'
        //,width: '30px'
        //,height: '30px'
        ,marginLeft: '6px'
        ,styleFloat: 'left'
        ,cssFloat: 'left'
    };
    var standart = {        // интерфейс для обратной совместимости
        addTool: function (tn, attr) {      // Добавление иконки или оверлея
            //console.log('tool addTool', tn, attr); // wheat
            if(!attr) attr = {};
            var ret = null;
            if(attr.overlay && Controls.items.layers) {
                attr.id = tn;
                if(!attr.rus) attr.rus = attr.hint || attr.id;
                if(!attr.eng) attr.eng = attr.hint || attr.id;
                
                Controls.items.layers.addOverlay(tn, attr);
                ret = Controls.items.layers;

                // var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                // if(layersControl) ret = layersControl.addOverlay(tn, attr);
            } else {
                ret = Controls.addControl(tn, attr);
                // var controls = gmxAPI.map.controlsManager.getCurrent();
                // if(controls && 'addControl' in controls) {
                    // ret = controls.addControl(tn, attr);
                // }
            }
            return ret;
        }
        ,getToolByName: function(id) {
            return Controls.items[id] || null;
        }
        ,
        removeTool: function(id) {              // Удалить control
            return Controls.removeControl(id);
        }
        ,
        setVisible: function(id, flag) {        // видимость
            var control = Controls.items[id];
        }
        ,
        selectTool: function (id) {
            var control = (id === 'POINT' ? Controls.items.drawingPoint : Controls.items.gmxDrawing);
            control.setActive(id);
        }
    };
    var initControls = function() {
        var outControls = {};
        var mbl = gmxAPI.map.baseLayersManager;
        var controlsManager = gmxAPI.map.controlsManager;
        var defaultStyle = {
            cursor: 'pointer'
            ,width: '30px'
            ,height: '30px'
            ,clear: 'none'
        }

        // gmxControl - прототип контрола из одной кнопки
        L.Control.gmxControl = L.Control.extend({
            options: {
                isVisible: true,
                id: '',
                onclick: null,
                onAdd: null,
                position: 'topleft'
            }
            ,
            /** Установка видимости контрола.
            * @memberOf gmxControl#
            * @param {boolean} flag - флаг видимости контрола.
            */
            setVisible: function(flag) {
                if(!flag) flag = false;
                if(this._container) {
                    this._container.style.display = flag ? 'block' : 'none';
                }
                this.options.isVisible = flag;
            }
			,
            /** Установка флага активности контрола.
            * @memberOf gmxControl#
            * @param {boolean} flag - флаг активности контрола.
            */
            setActive: function(flag, notToggle) {
                var container = this._container,
                    opt = this.options,
                    isActive = opt.isActive || false;
                if(flag) {
                    if(!notToggle) opt.isActive = true;
                    if(opt.srcHover) this._Image.src = opt.srcHover;
                    L.DomUtil.addClass(container, 'leaflet-control-Active');
                } else {
                    if(!notToggle) opt.isActive = false;
                    if(opt.src) this._Image.src = opt.src;
                    L.DomUtil.removeClass(container, 'leaflet-control-Active');
                }
                if(!notToggle && isActive !== opt.isActive) gmxAPI._listeners.dispatchEvent('onActiveChanged', controlsManager, {id: this.options.id, isActive: opt.isActive, target: this});
            }
            ,
            addTo: function (map) {
                Controls.items[this.options.id] = this;
                this._map = map;

                var container = this._container = this.onAdd(map),
                    pos = this.getPosition(),
                    corner = map._controlCorners[pos] || map._controlContainer;

                L.DomUtil.addClass(container, 'leaflet-control');

                if (pos.indexOf('bottom') !== -1) {
                    corner.insertBefore(container, corner.firstChild);
                } else {
                    corner.appendChild(container);
                }

                return this;
            }
			,
            _createDiv: function (container, className, title, fn, context) {
                var link = L.DomUtil.create('div', className, container);
                if(!this.options.isVisible) link.style.display = 'none';
                if(title) link.title = title;

                var stop = L.DomEvent.stopPropagation;

                L.DomEvent
                    .on(link, 'click', stop)
                    .on(link, 'mousedown', stop)
                    .on(link, 'dblclick', stop)
                    .on(link, 'click', L.DomEvent.preventDefault)
                    .on(link, 'click', fn || stop, context);

                return link;
            }
            ,
            _gmxOnClick: function (ev) {
                if(this.options.onclick) this.options.onclick.call(this, {id: this.options.id, target: this});
                gmxAPI._listeners.dispatchEvent('onClick', controlsManager, {id: this.options.id, target: this});
            }
            ,
            _initLayout: function () {
                var className = this.options.className || 'leaflet-control-icons leaflet-control-' + this.options.id;
                var container = this._container = this._createDiv(null, className, this.options.title, this._gmxOnClick, this);
                return container;
            }
            ,
            onAdd: function (map) {
                Controls.items[this.options.id] = this;
                var ret = this._initLayout();
                //gmxAPI.setStyleHTML(this._container, this.options.style || defaultStyle);
                if(this.options.onAdd) this.options.onAdd.call(this, ret);
                
                return ret;
            }
            ,setActiveTool: function(flag) {    // обратная совместимость
                this.setActive(flag);
            }
        });
        /**
         * Описание класса gmxControl.
         * Наследует класс <a href="http://leafletjs.com/reference.html#control">L.Control</a>.
         * @typedef {Object} gmxControl
         * @property {object} options - опции контрола.
         * @property {String} options.id - идентификатор контрола.
         * @property {boolean} options.isVisible - Флаг видимости(по умолчанию true).
         * @property {boolean} options.isActive - Флаг активности(по умолчанию false).
         * @property {Function} options.onclick - Ф-ция обработчик события click(по умолчанию null).
         * @property {Function} options.onAdd - Ф-ция обработчик события добавления контрола к карте(по умолчанию null).
        */
        L.control.gmxControl = function (options) {
          return new L.Control.gmxControl(options);
        }

        // gmxZoom - контрол Zoom
        L.Control.gmxZoom = L.Control.Zoom.extend({
            options: {
                current: ''
                ,collapsed: false
                ,zoomslider: true
                ,isVisible: true
                ,stepY: 7
            }
            ,_y_min: 9              // min Y слайдера
            ,isDragging: false      // min Y слайдера
            ,_listeners: {}
            ,
            onAdd: function (map) {
                Controls.items[this.options.id] = this;
                var zoomName = 'gmx_zoomParent',
                    container = L.DomUtil.create('div', zoomName);

                this._map = map;
                this._zoomPlaque = L.DomUtil.create('div', 'gmx_zoomPlaque', container);

                this._zoomInButton  = this._createDiv(container, 
                        'gmx_zoomPlus',  'Zoom in',  this._zoomIn,  this);
                this._zoomOutButton = this._createDiv(container, 
                        'gmx_zoomMinus', 'Zoom out', this._zoomOut, this);

                map.on('zoomend zoomlevelschange', this._updateDisabled, this);
                if(this.options.zoomslider) {
                    this._chkZoomLevelsChange(container);
                }
/*                var key = 'onMinMaxZoom';
                this._listeners[key] = gmxAPI.map.addListener(key, function(ph) {
                    this._chkZoomLevelsChange(container);
                    var attr = ph.attr;
                    // zoomControl.minZoom = attr.minZoom;
                    // zoomControl.maxZoom = attr.maxZoom;
                    // zoomControl.setZoom(attr.currZ);
                    // zoomControl.repaint();
                });
*/
                return container;
            }
            ,
            _createDiv: function (container, className, title, fn, context) {
                var link = L.DomUtil.create('div', className, container);
                if(title) link.title = title;

                var stop = L.DomEvent.stopPropagation;

                L.DomEvent
                    .on(link, 'click', stop)
                    .on(link, 'mousedown', stop)
                    .on(link, 'dblclick', stop)
                    .on(link, 'click', L.DomEvent.preventDefault)
                    .on(link, 'click', fn || stop, context);

                return link;
            }
            ,
            onRemove: function (map) {
                map.off('zoomend zoomlevelschange', this._updateDisabled, this);
            }
            ,
            _setPosition: function () {
                if(this._zoomVal) {
                    var MinZoom = this._map.getMinZoom(),
                        y = this._y_max - (this._zoom - MinZoom) * 7;

                    this._zoomVal.innerHTML = this._zoom;
                    L.DomUtil.setPosition(this._zoomPointer, L.point(4, y));
                }
            }
            ,
            _getZoomByY: function (y) {
                if(y < this._y_min) y = this._y_min;
                else if(y > this._y_max) y = this._y_max;

                return 0 + Math.floor((this._y_max - y) / this.options.stepY);
            }
            ,
            _setSliderSize: function () {
                var my = this,
                    map = my._map,
                    MinZoom = map.getMinZoom(),
                    MaxZoom = map.getMaxZoom(),
                    delta = MaxZoom - MinZoom;
                var height = 7 * (delta + 1);
                my._y_max = height + 3;
                my._zoomSliderBG.style.height = height + 'px';
                height += 66;
                if(my._zoomSliderCont.style.display !== 'block') height = 60;
                my._zoomPlaque.style.height = height + 'px';
            }
            ,
            _chkZoomLevelsChange: function (container) {
                var my = this,
                    map = my._map,
                    MinZoom = map.getMinZoom(),
                    MaxZoom = map.getMaxZoom();

                if(MinZoom !== my._MinZoom || MaxZoom !== my._MaxZoom) {
                    var delta = MaxZoom - MinZoom;
                    if(MaxZoom < 100 && delta >= 0) {
                        if(!my._zoomSliderCont) {
                            my._zoomSliderCont  = my._createDiv(container, 'gmx_sliderCont');
                            my._zoomSliderBG  = my._createDiv(my._zoomSliderCont, 'gmx_sliderBG');
                            L.DomEvent.on(my._zoomSliderBG, 'click', function (ev) {
                                my._zoom = my._getZoomByY(ev.layerY) + map.getMinZoom();
                                my._map.setZoom(my._zoom);
                            }, my);
                            my._zoomPointer  = my._createDiv(my._zoomSliderCont, 'gmx_zoomPointer');
                            my._zoomVal  = my._createDiv(my._zoomPointer, 'gmx_zoomVal');
                            L.DomEvent.on(container, 'mouseover', function (ev) {
                                my._zoomSliderCont.style.display = 'block';
                                my._setSliderSize();
                            });
                            var mouseout = function () {
                                my._zoomSliderCont.style.display = 'none';
                                my._setSliderSize();
                            };
                            L.DomEvent.on(container, 'mouseout', function (ev) {
                                if(my._draggable._moving) return;
                                mouseout();
                            });
                            var draggable = new L.Draggable(my._zoomPointer);
                            draggable.on('drag', function (ev) {
                                var pos = ev.target._newPos;
                                my._zoom = my._getZoomByY(pos.y) + map.getMinZoom();
                                my._setPosition();
                            });
                            draggable.on('dragend', function (ev) {
                                my._map.setZoom(my._zoom);
                                mouseout();
                            });
                            draggable.enable();
                            my._draggable = draggable;
                        }
                        my._setSliderSize();
                    }
                    my._MinZoom = MinZoom, my._MaxZoom = MaxZoom;
                }
                my._zoom = map._zoom;
                my._setPosition();
            }
            ,
            _updateDisabled: function (ev) {
                var map = this._map,
                    className = 'leaflet-disabled';

                L.DomUtil.removeClass(this._zoomInButton, className);
                L.DomUtil.removeClass(this._zoomOutButton, className);

                if (map._zoom === map.getMinZoom()) {
                    L.DomUtil.addClass(this._zoomOutButton, className);
                }
                if (map._zoom === map.getMaxZoom()) {
                    L.DomUtil.addClass(this._zoomInButton, className);
                }
                this._zoom = map._zoom;
                if(this.options.zoomslider) {
                    if(ev.type === 'zoomlevelschange') this._chkZoomLevelsChange(this._container);
                    this._setPosition();
                }
            }
			,setVisible: function(flag) {
                if(this._container) {
                    this._container.style.display = flag ? 'block' : 'none';
                }
            }
        });
        /**
         * Описание класса L.control.gmxZoom.
         * Наследует класс <a href="http://leafletjs.com/reference.html#control-zoom">L.Control.Zoom</a>.
         * @typedef {Object} gmxZoom
         * @property {object} options - опции контрола.
         * @property {String} options.id - идентификатор контрола.
         * @property {boolean} options.isVisible - Флаг видимости(по умолчанию true).
         * @property {boolean} options.zoomslider - Флаг добавления слайдера(по умолчанию true).
        */
        L.control.gmxZoom = function (options) {
          return new L.Control.gmxZoom(options);
        }
        var gmxZoom = L.control.gmxZoom({
            id: 'gmxZoom'
        });

		gmxAPI.map.zoomControl = {
			setVisible: function(flag) {
				gmxZoom.setVisible(flag);
			},
			setZoom: function(z) {
			},
			repaint: function() {
			},
			setMinMaxZoom: function(z1, z2) {
			}
            ,
			getMinZoom: function()
			{
				return gmxAPI.map.getMinZoom();
			},
			getMaxZoom: function()
			{
				return gmxAPI.map.getMaxZoom();
			}
            ,minimize: function(){}
            ,maximize: function(){}
		}

        gmxZoom.addTo(gmxAPI._leaflet.LMap);
        //outControls.gmxZoom = gmxZoom;

        // gmxLayers - контрол слоев
        L.Control.gmxLayers = L.Control.Layers.extend({
            options: {
                current: ''
                ,collapsed: false
                ,isVisible: true
            }
            ,
            _onInputClick: function (ev) {
                var layerId = this._chkInput(ev.target);
                if(!this._layers[layerId].overlay) {
                    if(this.current != layerId) {
                        this.current = layerId;
                        ev.target.checked = true;
                    } else {
                        this.current = null;
                        ev.target.checked = false;
                    }
                    mbl.setCurrentID((this.current ? this._layers[layerId].layer.id : ''));
                }
            }
            ,
            _update: function () {
                //L.Control.Layers.prototype._update.call(this);
                if (!this._container) {
                    return;
                }

                this._baseLayersList.innerHTML = '';
                this._overlaysList.innerHTML = '';

                var overlays = [],
                    i, obj, id,
                    len, hash = {};

                for (i in this._layers) {
                    obj = this._layers[i];
                    if(obj.overlay) overlays.push(obj);
                    hash[obj.layer.id] = obj;
                }
                var activeIDs = mbl.getActiveIDs();
                for (i = 0, len = activeIDs.length; i < len; i++) {
                    id = activeIDs[i];
                    obj = hash[id];
                    if(!obj || (!obj.overlay && !mbl.get(id))) continue;
                    this._addItem(obj);
                }
                if(overlays.length) {
                    for (i = 0, len = overlays.length; i < len; i++) {
                        this._addItem(overlays[i]);
                    }
                }
                len = activeIDs.length + overlays.length;
                this._container.style.display = len > 0 ? 'block' : 'none';
                this._separator.style.display = overlays.length && activeIDs.length ? '' : 'none';
                if(this.current) this.setCurrent(this.current, true);
            }
			,setVisible: function(flag) {
                if(!flag) flag = false;
                if(this._container) {
                    this._container.style.display = flag ? 'block' : 'none';
                }
                this.options.isVisible = flag;
            }
            ,
            setVisibility: function (id, flag) {
                var target = this._findTargetByID(id);
                if(target) {
                    target.checked = (flag ? true : false);
                    var item = this._layers[target.layerId];
                    if(item && item.overlay && item.layer) {
                        item.layer.isActive = target.checked;
                        return true;
                    }
                }
                return false;
            }
            ,
            _findTargetByID: function (id) {  // Найти input поле подложки или оверлея
                for(var i=0, len = this._form.length; i<len; i++) {
                    var target = this._form[i];
                    var item = this._layers[target.layerId];
                    if(item && item.layer && id == item.layer.id) return target;
                }
                return null;
            }
            ,
            setCurrent: function (id, skipChkInput) {
                this.current = null;
                for(var i=0, len = this._form.length; i<len; i++) {
                    var input = this._form[i];
                    if(id == input.layerId) {
                        if(!skipChkInput) this._chkInput(input);
                        this.current = id;
                        input.checked = true;
                    }
                    var item = this._layers[input.layerId];
                    if(item.overlay && item.layer.isActive) input.checked = true;
                }
            }
            ,
            _chkInput: function (target) {
                //var layers = this._layers;
                var layerId = String(target.layerId);
                var isActive = target.checked;
                var item = this._layers[layerId].layer;
                var overlay = item.overlay;
                if(overlay) {
                    if(isActive) {
                        if(item.onClick) item.onClick();
                    } else {
                        if(item.onCancel) item.onCancel();
                    }
                    item.isActive = isActive;
                }
                return layerId;
            }
            ,_listeners: {}
            ,_baseLayersHash: {}
            ,
            onAdd: function (map) {
                Controls.items[this.options.id] = this;
                L.Control.Layers.prototype.onAdd.call(this, map);
                
                var my = this;
                var mbl = gmxAPI.map.baseLayersManager;
                var util = {
                    addBaseLayerTool: function (baseLayer) {
                        var id = baseLayer.id;
                        var name = gmxAPI.KOSMOSNIMKI_LOCALIZED(baseLayer.rus, baseLayer.eng) || id;
                        my.addBaseLayer(baseLayer, name);
                    }
                    ,
                    chkExists: function() {     // Получить уже установленные подложки
                        var activeIDs = mbl.getActiveIDs();
                        for (var i = 0, len = activeIDs.length; i < len; i++) {
                            var id = activeIDs[i];
                            var baseLayer = mbl.get(id);
                            if(baseLayer)  {
                                util.addBaseLayerTool(baseLayer);
                            }
                        }
                        mbl.setCurrentID(mbl.getCurrentID());
                    }
                    ,
                    onActiveChanged: function() {
                        var i, obj, id,
                            len, hash = {};

                        for (i in my._layers) {
                            obj = my._layers[i];
                            hash[obj.layer.id] = obj;
                        }
                        var activeIDs = mbl.getActiveIDs();
                        for (var i = 0, len = activeIDs.length; i < len; i++) {
                            var id = activeIDs[i];
                            var baseLayer = mbl.get(id);
                            if(baseLayer) {
                                delete hash[id];
                                util.addBaseLayerTool(baseLayer);
                            }
                        }
                        for (i in hash) {
                            obj = hash[i];
                            my.removeLayer(obj);
                        }
                    }
                }

                var key = 'onAdd';
                this._listeners[key] = mbl.addListener(key, util.onActiveChanged);
                key = 'onLayerChange';
                this._listeners[key] = mbl.addListener(key, util.onActiveChanged);
                key = 'onActiveChanged';
                this._listeners[key] = mbl.addListener(key, util.onActiveChanged);

                key = 'onSetCurrent';
                this._listeners[key] = mbl.addListener(key, function(bl) {
                    if(!bl || !mbl.isActiveID(bl.id)) {
                        for(var i=0, len = my._form.length; i<len; i++) {
                            var input = my._form[i];
                            var item = my._layers[input.layerId];
                            if(!item.overlay) input.checked = false;
                        }
                        my.current = '';
                        return;
                    }
                    //bl.isVisible = true;
                    if(!bl._leaflet_id) util.addBaseLayerTool(bl);
                    my.setCurrent(bl._leaflet_id);
                });
                key = 'onRemove';
                this._listeners[key] = mbl.addListener(key, function(bl) {
                    var layer = my._layers[bl._leaflet_id];
                    my.removeLayer(layer);
                    delete my._layers[bl._leaflet_id];
                    my._update();
                });

                util.chkExists();
                return this._container;
            },
            onRemove: function (map) {
                L.Control.Layers.prototype.onRemove.call(this, map);
                var mbl = gmxAPI.map.baseLayersManager;
                for(var key in this._listeners) mbl.removeListener(key, this._listeners[key]);
                this._listeners = {};
                delete Controls.items.layers;
            }
            ,
            addOverlayTool: function (id, attr) {       // совместимость c addTool
                var my = this;
                var name = gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng) || id;
                attr.overlay = true;
                attr.getIndex = function () {
                    return my._overlaysList.childNodes.length;
                }
                this.addOverlay(attr, name);
                return {
                    id: id
                    ,setActiveTool: function (flag) {
                        return my.setVisibility(this.id, flag);
                    }
                    ,setVisible: function(flag) {
                        if('setVisible' in my) my.setVisible(flag);
                        else if(my._container) my._container.style.display = flag ? 'block' : 'none';
                    }
                    ,remove: function() {
                        my.removeFrom(gmxAPI._leaflet.LMap);
                    }
                };
            }
        });
        /**
         * Описание класса L.control.gmxLayers.
         * Наследует класс <a href="http://leafletjs.com/reference.html#control-layers">L.Control.Layers</a>.
         * @typedef {Object} gmxLayers
         * @property {object} options - опции контрола.
         * @property {String} options.id - идентификатор контрола.
        */
        L.control.gmxLayers = function (options) {
          return new L.Control.gmxLayers({}, {}, options);
        }
        var gmxLayers = L.control.gmxLayers({id:'layers'});
        gmxLayers.addTo(gmxAPI._leaflet.LMap);
        //outControls.layers = gmxLayers;
        //gmxAPI._leaflet.gmxLayers = gmxLayers;

        // HideControls - кнопка управления видимостью всех контролов
        L.Control.hideControls = L.Control.gmxControl.extend({
            options: {
                notHide: true
            },
            setVisibility: function (flag, allFlag) {
                this.options.isVisible = flag;
                for (var key in Controls.items) {
                    var item = Controls.items[key];
                    if (!item.options.notHide || allFlag) {
                        if (item._container) item._container.style.display = flag && item.options.isVisible ? 'block' : 'none';
                        else {
                            console.warn('hideControls', item);
                        }
                    }
                }
            },
            _toggleVisible: function (e) {
                L.DomEvent.stopPropagation(e);
                var flag = !this.options.isVisible;
                this.setVisibility(flag);
            }
        });
        /**
         * Описание класса L.control.hideControls.
         * Наследует класс <a href="global.html#gmxControl">gmxControl</a>.
         * @typedef {Object} hideControls
         * @property {object} options - опции контрола.
         * @property {String} options.id - идентификатор контрола.
        */
       L.control.hideControls = function (options) {
          return new L.Control.hideControls(options);
        }

        var hideControls = L.control.hideControls({
            title: titles.toggleVisibility
            ,id: 'hide'
            ,onclick: function(e) {
                this._toggleVisible(e);
            }
        });
        gmxAPI.extend(gmxAPI.map.allControls, {
            setVisible: function(flag) {
                hideControls.setVisibility(flag, true);
            },
            minimize: function() {
                this.setVisible(false);
            },
            maximize: function() {
                this.setVisible(true);
            }
        });

        hideControls.addTo(gmxAPI._leaflet.LMap);
        //outControls.hideControls = hideControls;

        // BottomBG - подвал background
        L.Control.BottomBG = L.Control.gmxControl.extend({
            options: {
                notHide: true
            },
            onAdd: function (map) {
                Controls.items[this.options.id] = this;
                var className = 'gmx_copyright_location',
                    container = L.DomUtil.create('div', className);

                L.DomEvent.on(this._map._controlContainer, 'dblclick', L.DomEvent.stopPropagation);
                L.DomUtil.create('div', className + '_bg', container);
                this._map = map;

                return container;
            }
        });
        /**
         * Описание класса L.control.BottomBG.
         * Наследует класс <a href="global.html#gmxControl">gmxControl</a>.
         * @typedef {Object} bottomBG
         * @property {object} options - опции контрола.
         * @property {String} options.id - идентификатор контрола.
        */
        var bottomBG = new L.Control.BottomBG({
            className: 'gmx_copyright_location_bg'
            ,id: 'bottomBG'
            ,position: 'bottom'
        });
        bottomBG.addTo(gmxAPI._leaflet.LMap);
        //outControls.bottomBG = bottomBG;

        // LocationControls - 
        L.Control.LocationControls = L.Control.gmxControl.extend({
            options: {
                notHide: true
            },
            onAdd: function (map) {
                Controls.items[this.options.id] = this;
                var className = 'gmx_location',
                    container = L.DomUtil.create('div', className),
                    my = this;

                this.locationTxt = L.DomUtil.create('span', 'gmx_locationTxt', container);
                this.locationTxt.title = titles.locationTxt;
                this.coordFormatChange = L.DomUtil.create('span', 'gmx_coordFormatChange', container);
                this.coordFormatChange.title = titles.coordFormatChange;
                this.scaleBar = L.DomUtil.create('span', 'gmx_scaleBar', container);
                this.scaleBarTxt = L.DomUtil.create('span', 'gmx_scaleBarTxt', container);
                this._map = map;

                var util = {
                    checkPositionChanged: function(ev) {
                        var attr = gmxAPI.getScaleBarDistance();
                        if (!attr || (attr.txt === my._scaleBarText && attr.width === my._scaleBarWidth)) return;
                        my._scaleBarText = attr.txt;
                        my._scaleBarWidth = attr.width;
                        util.repaintScaleBar();
                    }
                    ,
                    repaintScaleBar: function() {
                        if (my._scaleBarText) {
                            gmxAPI.size(my.scaleBar, my._scaleBarWidth, 4);
                            my.scaleBarTxt.innerHTML = my._scaleBarText;
                            gmxAPI._listeners.dispatchEvent('scaleBarRepainted', gmxAPI.map, container.clientWidth);
                        }
                    }
                    ,coordFormat: 0
                    ,
                    setCoordinatesFormat: function(num, screenGeometry) {
                        if(!num) num = this.coordFormat;
                        if(num < 0) num = this.coordFormatCallbacks.length - 1;
                        else if(num >= this.coordFormatCallbacks.length) num = 0;
                        this.coordFormat = num;
                        if(!screenGeometry) screenGeometry = gmxAPI.map.getScreenGeometry();
                        var attr = {screenGeometry: screenGeometry, properties: gmxAPI.map.properties };
                        var res = this.coordFormatCallbacks[num](my.locationTxt, attr);		// если есть res значит запомним ответ
                        if(res && my.prevCoordinates != res) my.locationTxt.innerHTML = res;
                        my.prevCoordinates = res;
                        gmxAPI._listeners.dispatchEvent('onSetCoordinatesFormat', gmxAPI.map, num);
                    }
                    ,
                    coordFormatCallbacks: [		// методы формирования форматов координат
                        function() { return util.getCoordinatesText(); },
                        function() { return util.getCoordinatesText(); },
                        function() { return util.getCoordinatesText(); }
                    ]
                    ,
                    getCoordinatesText: function(currPos) {
                        return gmxAPI.getCoordinatesText(currPos, this.coordFormat);
                    }
                    ,
                    showCoordinates: function() {        //окошко с координатами
                        if (this.coordFormat > 2) return; // только для стандартных форматов.
                        var oldText = this.getCoordinatesText();
                        var text = window.prompt(titles.locationTxt + ':', oldText);
                        if (text && (text != oldText))
                            gmxAPI.map.moveToCoordinates(text);
                    }
                    ,
                    nextCoordinatesFormat: function() {
                        this.coordFormat += 1;
                        this.setCoordinatesFormat(this.coordFormat);
                    }
                }
                
                L.DomEvent.on(this.coordFormatChange, 'click', function (ev) { util.nextCoordinatesFormat(); }, this);
                L.DomEvent.on(this.locationTxt, 'click', function (ev) { util.showCoordinates(); }, this);
                this._checkPositionChanged =function (ev) {
                    util.checkPositionChanged(ev);
                }
                map.on('moveend', this._checkPositionChanged, this);
                this._setCoordinatesFormat =function (ev) {
                    util.setCoordinatesFormat(util.coordFormat);
                }
                map.on('move', this._setCoordinatesFormat, this);
                
                gmxAPI.map.geomixerLinkSetVisible = function(flag) {
                };
                gmxAPI.map.scaleBar = {
                    setVisible: function(flag) {
                        gmxAPI.setVisible(my.scaleBar, flag);
                    }
                };
                gmxAPI.map.coordinates = {
                    setVisible: function(flag) 
                    { 
                        container.style.display = flag ? 'block' : 'none';
                    }
                    ,
                    addCoordinatesFormat: function(func) 
                    { 
                        util.coordFormatCallbacks.push(func);
                        return util.coordFormatCallbacks.length - 1;
                    }
                    ,
                    removeCoordinatesFormat: function(num) 
                    { 
                        util.coordFormatCallbacks.splice(num, 1);
                        return util.coordFormatCallbacks.length - 1;
                    }
                    ,
                    setFormat: util.setCoordinatesFormat
                }
                
                return container;
            }
            ,getWidth: function() { 
                return this._container.clientWidth;
            }
            ,
            onRemove: function (map) {
                map.off('moveend', this._checkPositionChanged, this);
                map.off('move', this._setCoordinatesFormat, this);
            }
        });
        /**
         * Контрол отображения текущего положения карты - класс L.control.LocationControls.
         * Наследует класс <a href="global.html#gmxControl">gmxControl</a>.
         * @typedef LocationControls
         * @property {object} options - опции контрола.
         * @property {String} options.id - идентификатор контрола.
        */
        var locationControl = new L.Control.LocationControls({
            position: 'bottomright'
            ,id: 'locationControl'
        });
        locationControl.addTo(gmxAPI._leaflet.LMap);
        //outControls.locationControl = locationControl;

        // CopyrightControls - Copyright
        L.Control.CopyrightControls = L.Control.gmxControl.extend({
            options: {
                notHide: true
            },
            onAdd: function (map) {
                Controls.items[this.options.id] = this;
                var className = 'gmx_copyright_location',
                    container = this._container = L.DomUtil.create('span', className);

                this._map = map;
                var my = this;
                var util = {
                    items: []
                    ,addItem: function(obj, copyright, z1, z2, geo) {
                        util.removeItem(obj, copyright);
                        var bounds = null;
                        if (geo) {
                            bounds = gmxAPI.getBounds(geo.coordinates);
                        } else if (obj.geometry) {
                            bounds = obj.bounds || gmxAPI.getBounds(obj.geometry.coordinates);
                        }
                        if (!z1) z1 = 0;
                        if (!z2) z2 = 100;
                        this.items.push([obj, copyright, z1, z2, bounds]);
                        this.redraw();
                        return true;
                    }
                    ,
                    removeItem: function(obj, copyright) {
                        var arr = [];
                        this.items.forEach(function(item, i) {
                            if((copyright && copyright !== item[1])
                                || obj !== item[0]) {
                                arr.push(item);
                            }
                        });
                        util.items = arr;
                    }
                    ,
                    redraw: function() {                // перерисовать с задержкой 
                        if(util.redrawTimer) clearTimeout(util.redrawTimer);
                        util.redrawTimer = setTimeout(function() {
                            util.redrawTimer = null;
                            util.redrawItems();
                        }, 100);
                    }
                    ,
                    redrawItems: function() {          // перерисовать
                        var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
                        if(!currPos.latlng || !currPos.latlng.extent) return;
                        
                        var chkExists = {};
                        var texts = [
                            //первым всегда будет располагаться копирайт СканЭкс. 
                            "<a target='_blank' style='color: inherit;' href='http://maps.kosmosnimki.ru/Apikey/License.html'>&copy; 2007-2014 " + gmxAPI.KOSMOSNIMKI_LOCALIZED("&laquo;СканЭкс&raquo;", "RDC ScanEx") + "</a>"
                        ];
                        this.items.forEach(function(item, i) {
                            var obj = item[0];
                            var copyright = item[1];
                            if (!copyright || !obj.objectId || !obj.getVisibility()) return;  // обьекта нет на экране или без копирайта
                            if (chkExists[copyright]) return;  // дубли копирайтов
                            var z1 = item[2],
                                z2 = item[3],
                                bounds = item[4],
                                zoom = map._zoom;

                            if (zoom < z1 || zoom > z2) return;
                            if (bounds && !gmxAPI.extIntersect(currPos.latlng.extent, bounds)) return;
                            chkExists[copyright] = true;
                            texts.push(copyright.split("<a").join("<a target='_blank' style='color: inherit;'"));
                        });
                        if(gmxAPI.proxyType == 'leaflet') texts.push("<a target='_blank' style='color: inherit;' href='http://leafletjs.com'>&copy; Leaflet</a>");

                        var text = texts.join(' ');

                        if(this.currentText != text) {
                            this.currentText = text;
                            container.innerHTML = text;
                            gmxAPI._listeners.dispatchEvent('copyrightRepainted', gmxAPI.map, text);
                        }
                        util.chkWidth();
                    }
                    ,
                    chkWidth: function(locationWidth) {
                        if(Controls.items.locationControl
                            && 'getWidth' in Controls.items.locationControl
                            ) {
                            var width = my._container.parentNode.clientWidth - 30 - Controls.items.locationControl.getWidth();
                            my._container.style.width = (width > 0 ? width : 0) + 'px';
                        }
                    }
                };

                gmxAPI.extend(gmxAPI.map, {
                    addCopyrightedObject: function(obj, copyright, z1, z2, geo) {
                        util.addItem(obj, copyright, z1, z2, geo);
                    }
                    ,removeCopyrightedObject: function(obj) {
                        util.removeItem(obj);
                        util.redraw();
                    }
                    ,setCopyrightVisibility: function(obj) {
                        //copyrightControl.setVisible(obj);
                    } 
                    ,updateCopyright: function() {
                        util.redraw();
                    } 
                    ,setCopyrightAlign: function(attr) {    // Изменить позицию контейнера копирайтов
                        //if(attr.align) copyrightControl.copyrightAlign = attr.align;
                        //copyrightControl.setPosition();
                    }
                });
                map.on('moveend', function (ev) {
                    util.redraw();
                }, this);
                util.onChangeBackgroundColorID = gmxAPI.map.addListener('onChangeBackgroundColor', function(htmlColor) {
                    util.redraw();
                });
                return container;
            }
        });

        /**
         * Контрол отображения копирайтов - класс L.control.CopyrightControls.
         * Наследует класс <a href="global.html#gmxControl">L.Control.gmxControl</a>.
         * @typedef CopyrightControls
         * @property {object} options - опции контрола.
         * @property {String} options.id - идентификатор контрола.
        */
        var copyrightControls = new L.Control.CopyrightControls({
            position: 'bottomleft'
            ,id: 'copyrightControls'
        });
        copyrightControls.addTo(gmxAPI._leaflet.LMap);
        //outControls.copyrightControls = copyrightControls;

        // PrintControl - кнопка печати
        var printControl = L.control.gmxControl({
            title: titles.print
            ,id: 'print'
            //,type: 'print'
            ,isVisible: false
        });
        printControl.addTo(gmxAPI._leaflet.LMap);
        //outControls.printControl = printControl;

        // PermalinkControl - кнопка пермалинка
        var permalinkControl = L.control.gmxControl({
            title: titles.permalink
            ,isVisible: false
            ,id: 'permalink'
        });
        permalinkControl.addTo(gmxAPI._leaflet.LMap);
        //outControls.permalinkControl = permalinkControl;

        // DrawingZoomControl - кнопка boxZoom
        var drawingZoomControl = L.control.gmxControl({
            title: titles.boxZoom
            ,isActive: false
            ,id: 'drawingZoom'
            ,onclick: function(e) {
                var className = 'leaflet-control-icons leaflet-control-' + this.options.id + '-Active';
                if(!gmxAPI._drawing.BoxZoom) {
                    gmxAPI._drawFunctions.zoom();
                    L.DomUtil.addClass(this._container, className);
                    this.options.isActive = true;
                } else {
                    this.options.isActive = false;
                    gmxAPI._drawing.activeState = false;
                    gmxAPI._drawing.BoxZoom = false;
                    L.DomUtil.removeClass(this._container, className);
                }
                gmxAPI._listeners.dispatchEvent('onActiveChanged', controlsManager, {id: this.options.id, target: this});
            }
            ,onAdd: function(cont) {
                Controls.items[this.options.id] = this;
                var my = this;
                this._map.on('boxzoomend', function() {
                    L.DomUtil.removeClass(my._container, 'leaflet-control-' + my.options.id + '-Active');
                    my.options.isActive = false;
                    gmxAPI._listeners.dispatchEvent('onActiveChanged', controlsManager, {id: my.options.id, target: my});
                });
            }

        });
        drawingZoomControl.addTo(gmxAPI._leaflet.LMap);
        //outControls.drawingZoomControl = drawingZoomControl;

        // DrawingPointControl - кнопка маркера
        var drawingPointControl = L.control.gmxControl({
            title: titles.marker
            ,isActive: false
            ,onFinishID: null
            ,id: 'drawingPoint'
            ,className: 'leaflet-control-icons leaflet-control-drawingPoint'
            ,onclick: function(e, pkey) {
                var my = drawingPointControl;
                var className = 'leaflet-control-' + my.options.id + '-Active';
                var stop = function() {
                    var isActive = my.options.isActive;
                    if(my.options._drawFunc) my.options._drawFunc.stopDrawing();
                    L.DomUtil.removeClass(my._container, className);
                    if(my.options.onFinishID) gmxAPI.map.drawing.removeListener('onFinish', my.options.onFinishID);
                    my.options.onFinishID = null;
                    my.options.isActive = false;
                    if(isActive) gmxAPI._listeners.dispatchEvent('onActiveChanged', controlsManager, {id: my.options.id, isActive: false, target: my});
                };
                my.options.activeStop = stop;
                if(!my.options.onFinishID) {
                    my.options.onFinishID = gmxAPI.map.drawing.addListener('onFinish', stop);
                }
                if(!my.options.isActive) {
                    my.options._drawFunc = gmxAPI._drawFunctions.POINT();
                    L.DomUtil.addClass(my._container, className);
                    my.options.isActive = true;
                    gmxAPI._listeners.dispatchEvent('onActiveChanged', controlsManager, {id: my.options.id, isActive: true, target: my});
                } else {
                    //gmxAPI._drawing.endDrawing();
                    stop();
                }
            }
        });
        drawingPointControl.activeStop = function () {
            var opt = drawingPointControl.options;
            //if (key !== 'POINT') opt.isActive = true;
            if (opt && 'activeStop' in opt) opt.activeStop();
        }
        
        drawingPointControl.addTo(gmxAPI._leaflet.LMap);
        //outControls.drawingPointControl = drawingPointControl;

        L.Control.Drawing = L.Control.extend({
            options: {
                position: 'topleft'
            },

            _createButton: function (item, container, fn, context) {
                var className = 'leaflet-control-Drawing-' + item.key;
                var link = L.DomUtil.create('div', className, container);
                link.title = item.hint;

                var stop = L.DomEvent.stopPropagation;

                L.DomEvent
                    .on(link, 'click', stop)
                    .on(link, 'mouseup', stop)
                    .on(link, 'mousedown', stop)
                    .on(link, 'dblclick', stop)
                    .on(link, 'click', L.DomEvent.preventDefault)
                    .on(link, 'click', fn, context);

                return link;
            },

            onAdd: function (map) {
                Controls.items[this.options.id] = this;
                var container = L.DomUtil.create('div', 'leaflet-control-Drawing');

                L.DomEvent
                    .on(container, 'mouseout', function (e) {
                        container.style.height = '30px';
                    })
                    .on(container, 'mouseover', function (e) {
                        container.style.height = '98px';
                    });

                this._map = map;
                var arr = [
                {
                    key: "POLYGON",
                    style: {
                        backgroundPosition: '-503px -33px'
                    }
                    ,
                    hoverStyle: {
                        backgroundPosition: '-503px -2px'
                    }
                    // ,onClick: gmxAPI._drawFunctions.POLYGON
                    // ,onCancel: gmxAPI._drawFunctions.POLYGON.stopDrawing
                    ,hint: titles.polygon
                }
                ,
                {
                    key: "LINESTRING",
                    style: {
                        backgroundPosition: '-393px -33px'
                    }
                    ,
                    hoverStyle: {
                        backgroundPosition: '-393px -2px'
                    }
                    // ,onClick: gmxAPI._drawFunctions.LINESTRING
                    // ,onCancel: gmxAPI._drawFunctions.LINESTRING.stopDrawing
                    ,hint: titles.line
                }
                ,
                {
                    key: "FRAME",
                    style: {
                        backgroundPosition: '-269px -33px'
                    }
                    ,
                    hoverStyle: {
                        backgroundPosition: '-269px -2px'
                    }
                    // ,onClick: gmxAPI._drawFunctions.FRAME
                    // ,onCancel: gmxAPI._drawFunctions.FRAME.stopDrawing
                    ,hint: titles.rectangle
                }
                ];
                var my = this;
                var items = {};
                my.options.activeKey = null;
                my.options.activeStop = null;
                arr.forEach(function(item) {
                    var key = item.key;
                    var fn = function() {
                        var activeKey = my.options.activeKey;
                        if(activeKey && activeKey !== key) {
                            my.options.activeStop();
                            if(activeKey === key) {
                                return;
                            }
                        }
                        var target = items[key];
                        var className = 'leaflet-control-Drawing-' + key + '-Active';
                        var stop = function() {
                            if(target && target.drawFunc) {
                                target.drawFunc.stopDrawing();
                            }
                            //gmxAPI._drawing.endDrawing();
                            L.DomUtil.removeClass(target, className);
                            if(my.options.onFinishID) gmxAPI.map.drawing.removeListener('onFinish', my.options.onFinishID);
                            my.options.onFinishID = null;
                            my.options.activeKey = null;
                            my.options.activeStop = null;
                            if(my.options.isActive) {
                                my.options.isActive = false;
                                gmxAPI._listeners.dispatchEvent('onActiveChanged', controlsManager, {id: key, isActive: false, target: my});
                            }
                            my.options.isActive = false;
                        };
                        if(!my.options.onFinishID) {
                            my.options.onFinishID = gmxAPI.map.drawing.addListener('onFinish', stop);
                        }
                        if(!my.options.isActive) {
                            items[key].drawFunc = gmxAPI._drawFunctions[key]();
                            if(target != target.parentNode.firstChild) {
                                target.parentNode.insertBefore(target, target.parentNode.firstChild);
                            }
                            L.DomUtil.addClass(target, className);
                            my.options.isActive = true;
                            my.options.activeStop = stop;
                            my.options.activeKey = key;
                            drawingPointControl.activeStop();
                            gmxAPI._listeners.dispatchEvent('onActiveChanged', controlsManager, {id: key, isActive: true, target: my});
                        } else {
                            stop();
                        }
                    }
                    var resItem = my._createButton(item,  container, fn, my);
                    items[key] = resItem;
                    resItem._setActive = fn;
                });
                this.options.items = items;
                return container;
            },
            setActive: function (key) {
                var my = this;
                var opt = my.options;
                var target = opt.items[key];
                if (target) target._setActive();
                else {
                    for(var pKey in opt.items) {
                        var target = opt.items[pKey];
                        my.options.isActive = true;
                        target._setActive();
                    }
                    drawingPointControl.activeStop();
                }
            },
            setPosition: function (key, num) {
                var target = this.options.items[key];
                if (target) {
                    if (num < -1) num = 0;
                    if (num >= this._container.childNodes.length - 1) {
                        this._container.appendChild(target);
                    } else {
                        var source = this._container.childNodes[num];
                        this._container.insertBefore(target, source);
                    }
                }
            },
            onRemove: function (map) {
                //console.log('onRemove ', this);
                //map.off('zoomend zoomlevelschange', this._updateDisabled, this);
            }
        });
        /**
         * Описание класса L.control.Drawing.
         * Наследует класс <a href="http://leafletjs.com/reference.html#control">L.Control</a>.
         * @typedef Drawing
         * @property {object} options - опции контрола.
         * @property {String} options.id - идентификатор контрола.
        */
        L.control.gmxDrawing = function (options) {
          return new L.Control.Drawing(options);
        }
        // if(!gmxAPI.isMobile) {
        var gmxDrawing = L.control.gmxDrawing({id: 'gmxDrawing', isVisible: true});
        gmxDrawing.addTo(gmxAPI._leaflet.LMap);
        //outControls.gmxDrawing = gmxDrawing;

        //gmxAPI.extend(Controls.controlsHash, outControls);

        //Управление ToolsAll
        (function()
        {
            //Управление ToolsAll
            function ToolsAll(cont)
            {
                this.toolsAllCont = gmxAPI._allToolsDIV;
                gmxAPI._toolsContHash = {};
            }
            gmxAPI._ToolsAll = ToolsAll;

            function ToolsContainer(name, attr) {
                //console.log('ToolsContainer', name, attr);
                if(!attr) attr = {};
                var cont = {
                    addTool: function (tn, attr) {
                        //console.log('tool addTool', tn, attr); // wheat
                        if(!attr) attr = {};
                        var ret = null;
                        if(attr.overlay && Controls.items.layers) {
                        //if(attr.overlay && gmxAPI._leaflet.gmxLayers) {
                            attr.id = tn;
                            if(!attr.rus) attr.rus = attr.hint || attr.id;
                            if(!attr.eng) attr.eng = attr.hint || attr.id;
                            
                            var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                            if(layersControl) {
                                ret = layersControl.addOverlayTool(tn, attr);
                            }
                        } else {
                            ret = Controls.addControl(tn, attr);
                            // var controls = gmxAPI.map.controlsManager.getCurrent();
                            // if(controls && 'addControl' in controls) {
                                // ret = controls.addControl(tn, attr);
                            // }
                        }
                        gmxAPI._tools[tn] = ret;
                        return ret;
                    }
                };
                //gmxAPI._tools[name] = cont;
                return cont;
            }
            gmxAPI._ToolsContainer = ToolsContainer;
        })();
        
        if('_ToolsAll' in gmxAPI) {
            this.toolsAll = new gmxAPI._ToolsAll(parent);
        }
        gmxAPI._tools = {
            standart: standart
        }
        var attr = {
            'properties': { 'className': 'gmxTools' }
            ,
            'style': { }
            ,
            'contType': 2	// режим отключения выбора item
        };

        var baseLayersTools = new gmxAPI._ToolsContainer('baseLayers', attr);
        gmxAPI.baseLayersTools = baseLayersTools;

        return Controls.items;
    };

    /**
     * Описание класса Controls.
     * @constructor Controls
     * @property {String} id - Идентификатор набора контролов.
     * @property {boolean} isVisible - Флаг видимости(по умолчанию true).
     * @property {hash} items - список контролов(ниже перечислены создаваемые в API контролы по умолчанию).
     * @property {L.Control.hideControls} items.hide - <a href="global.html#hideControls">контрол управления видимостью</a>.
     * @property {L.Control.gmxLayers} items.layers - <a href="global.html#gmxLayers">контрол слоев</a>.
     * @property {L.Control.gmxZoom} items.gmxZoom - <a href="global.html#gmxZoom">контрол Zoom</a>.
     * @property {L.Control.Drawing} items.gmxDrawing - <a href="global.html#Drawing">контрол рисования геометрий</a>.
     * @property {L.Control.LocationControls} items.locationControl - <a href="global.html#LocationControls">контрол отображения текущего положения карты</a>.
     * @property {L.Control.CopyrightControls} items.copyrightControls - <a href="global.html#CopyrightControls">контрол копирайтов</a>.
     * @property {L.Control.gmxControl} items.print - контрол печати.
     * @property {L.Control.gmxControl} items.permalink - контрол пермалинка.
     * @property {L.Control.gmxControl} items.drawingZoom - контрол зуммирования по прямоугольнику.
     * @property {L.Control.gmxControl} items.drawingPoint - контрол установки маркера.
    */
	var Controls = {
        id: 'controlsBaseIcons'
        ,isVisible: true
        ,items: {}
        ,
        /** Получить контрол по его идентификатору
        * @memberOf Controls#
        * @param {String} id идентификатор контрола.
        * @returns {Control| null} возвращает контрол либо null если контрол с данным идентификатором не найден
        */
        getControl: function(id) {
            //if(id === 'layers') id = 'gmxLayers';   // обратная совместимость
            return this.items[id] || null;
        }
        ,
        /** Добавить контрол
        * @memberOf Controls#
        * @param {String} id - идентификатор контрола.
        * @param {Object} pt - атрибуты контрола.
        * @param {String} pt.regularImageUrl - URL иконки контрола.
        * @param {String} pt.activeImageUrl - URL иконки при наведении мыши.
        * @param {Object} pt.style - регулярный стиль контрола.
        * @param {Object} pt.hoverStyle - стиль при наведении мыши.
        * @param {String} pt.rus - наименование русскоязычное(по умолчанию равен id).
        * @param {String} pt.eng - наименование англоязычное(по умолчанию равен id).
        * @param {Function} pt.onClick - функция при включении активности контрола (по умолчанию null).
        * @param {Function} pt.onCancel - функция при выключении активности контрола (по умолчанию null).
        * @returns {Control|null} созданный контрол либо null если контрол с данным идентификатором уже существует.
        */
        addControl: function(id, pt) {
            if(!id) id = pt.id;
            if(Controls.items[id]) return null; // такой контрол уже имеется
            var title = pt.title || pt.hint;
			var attr = {
                id: id
                ,rus: pt.rus || title
                ,eng: pt.eng || title
                ,style: gmxAPI.extend(pt.style, styleIcon)
                ,hoverStyle: pt.hoverStyle
            };
            var className = 'leaflet-control-' + id,
                imageClassName = 'leaflet-control-Image';

            if(pt.regularImageUrl) {
                attr.src = pt.regularImageUrl;
                // attr.style = {
                    // position: 'relative'
                    // ,background: 'rgba(154, 154, 154, 0.7)'
                // };
            }
            if(pt.activeImageUrl) {
                attr.srcHover = pt.activeImageUrl;
                // attr.hoverStyle = {
                    // position: 'relative'
                    // ,background: 'rgba(154, 154, 154, 1)'
                // };
            }
            if(pt.onClick) attr.onClick = pt.onClick;
            if(pt.onCancel) attr.onCancel = pt.onCancel;
            //if(pt.overlay) attr.onCancel = pt.onCancel;
            if(!attr.src) {     // Текстовый контрол
                className += ' leaflet-control-Text';
                if(pt.innerHTML) attr.innerHTML = pt.innerHTML;
                else {
                    attr.innerHTML = gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng)
                }
            } else {
                className += ' leaflet-control-userIcons';
                if (!pt.style) {
                    className += ' leaflet-control-ImageAuto';
                }
            }

            // Добавление пользовательского контрола
            var userControl = L.control.gmxControl({
                title: gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng)
                ,isActive: false
                ,style: {}
                ,className: className
                ,src: attr.src || null
                ,srcHover: attr.srcHover || null
                ,onFinishID: null
                ,id: id
                ,onAdd: function() {
                    Controls.items[this.options.id] = this;
                    var my = this;
                    var container = this._container;
                    if(attr.innerHTML) {
                        container.innerHTML = attr.innerHTML;
                        L.DomUtil.addClass(container, 'leaflet-control-Text');
                    } else if(pt.regularImageUrl) {
                        gmxAPI.setStyleHTML(this._container, attr.style);
                        this._Image = L.DomUtil.create('img', imageClassName);
                        container.appendChild(this._Image);
                        L.DomUtil.addClass(container, className);
                        //L.DomUtil.addClass(container, 'leaflet-control-userIcons');
                    }
                    L.DomEvent.on(container, 'mouseover', function (e) {
                        my.setActive(true, true);
                    });
                    L.DomEvent.on(container, 'mouseout', function (e) {
                        if(!my.options.isActive) my.setActive(false, true);
                    });
                    this.setActive(false);
                }
                ,onclick: function(e) {
                    var container = this._container;
                    if(!this.options.isActive) {
                        if(attr.onClick) attr.onClick.call(this);
                        this.setActive(true);
                    } else {
                        if(attr.onCancel) attr.onCancel.call(this);
                        this.setActive(false);
                    }
                }
            });
            userControl.addTo(gmxAPI._leaflet.LMap);
            Controls.items[id] = userControl;
            return userControl;
        }
        ,
        /** Удаление контрола по его идентификатору.
        * @memberOf Controls#
        * @param {String} id идентификатор контрола.
        * @returns {Control} возвращает удаленный контрол либо null если он не найден
        */
        removeControl: function (id) {
            var control = this.items[id];
            if(control && control._map && 'removeFrom' in control) control.removeFrom(control._map);
            delete this.items[id];
            return control;
        }
        ,
        /** Удаление набора контролов.
        * @memberOf Controls#
        */
        remove: function() {      // удаление
            for(var key in this.items) {
                var item = this.items[key];
                if('remove' in item) item.remove();
            }
            this.items = {};
        }
        ,
        setControl: function(id, control) {
            if(Controls.items[id]) return false;
            Controls.items[id] = control;
            control.addTo(gmxAPI._leaflet.LMap);
            return true;
        }
        ,initControls: initControls
        // остальное для обратной совместимости
	}
    if(!gmxAPI._controls) gmxAPI._controls = {};
    gmxAPI._controls[Controls.id] = Controls;
})();
;/* ======================================================================
    Layer.js
   ====================================================================== */

//Поддержка addLayer
(function()
{
 // получить minZoom maxZoom для слоя по фильтрам
 function getMinMaxZoom(prop)
 {
  var minZoom = 20, maxZoom = 0;
  for (var i = 0; i < prop.styles.length; i++)
  {
   var style = prop.styles[i];
   minZoom = Math.min(style.MinZoom || gmxAPI.defaultMinZoom, minZoom);
   maxZoom = Math.max(style.MaxZoom || gmxAPI.defaultMaxZoom, maxZoom);
  }
  return {'minZoom': minZoom, 'maxZoom': maxZoom};
 }

 // Подготовка атрибутов фильтра стилей 
 function getFilterAttr(style)
 {
  // Получение стилей фильтра
  var regularStyle = {};
  if (typeof style.StyleJSON != 'undefined')
   regularStyle = style.StyleJSON;
  else if (typeof style.RenderStyle != 'undefined')
   regularStyle = style.RenderStyle;
  else
  {
   // стиль по умолчанию
   if (style.PointSize)
    regularStyle.marker = { size: parseInt(style.PointSize) };
   if (style.Icon)
   {
    var src = (style.Icon.indexOf("http://") != -1) ?
     style.Icon :
     (baseAddress + "/" + style.Icon);
    regularStyle.marker = { image: src, "center": true };
   }
   if (style.BorderColor || style.BorderWidth)
    regularStyle.outline = {
     color: gmxAPI.parseColor(style.BorderColor),
     thickness: parseInt(style.BorderWidth || "1"),
     opacity: (style.BorderWidth == "0" ? 0 : 100)
    };
   if (style.FillColor)
    regularStyle.fill = {
     color: gmxAPI.parseColor(style.FillColor),
     opacity: 100 - parseInt(style.Transparency || "0")
    };

   var label = style.label || style.Label;
   if (label)
   {
    regularStyle.label = {
     field: label.FieldName,
     color: gmxAPI.parseColor(label.FontColor),
     size: parseInt(label.FontSize || "12")
    };
   }
  }

  if (regularStyle.marker)
   regularStyle.marker.center = true;

  var hoveredStyle = null;
  if (typeof style.HoverStyle != 'undefined') hoveredStyle = style.HoverStyle;
  else {
   hoveredStyle = JSON.parse(JSON.stringify(regularStyle));
   if (hoveredStyle.marker && hoveredStyle.marker.size) hoveredStyle.marker.size += 1;
   if (hoveredStyle.outline) hoveredStyle.outline.thickness += 1;
  }

  // Получение sql строки фильтра
  var name = '';
  var sql = '';
  if (style.Filter)
  {
   if (/^\s*\[/.test(style.Filter))
   {
    var a = style.Filter.match(/^\s*\[([a-zA-Z0-9_]+)\]\s*([<>=]=?)\s*(.*)$/);
    if (a && (a.length == 4))
    {
     sql = a[1] + " " + a[2] + " '" + a[3] + "'";
    }
   }
   else
   {
    sql = style.Filter;
   }
   if (style.Filter.Name) name = style.Filter.Name; // имя фильтра - для map.layers в виде хэша
  }
  var DisableBalloonOnMouseMove = ('DisableBalloonOnMouseMove' in style ? style.DisableBalloonOnMouseMove : true);
  var out = {
   'name': name,
   'BalloonEnable': style.BalloonEnable || true,
   'DisableBalloonOnClick': style.DisableBalloonOnClick || false,
   'DisableBalloonOnMouseMove': DisableBalloonOnMouseMove,
   'regularStyle': regularStyle,
   'hoveredStyle': hoveredStyle,
   'MinZoom': style.MinZoom || gmxAPI.defaultMinZoom,
   'MaxZoom': style.MaxZoom || gmxAPI.defaultMaxZoom,
   'style': style,
   'sql': sql
  };
  if(style.Balloon) out.Balloon = style.Balloon;
  if(style.clusters) out.clusters = style.clusters;
  return out;
 }

 // Инициализация фильтра
 var initFilter = function(prnt, num)
 {
  var filter = prnt.filters[num];
  var obj_ = prnt.addObject(null, null, {'nodeType': 'filter'});
  filter.objectId = obj_.objectId;

  var attr = filter._attr;
  filter.setFilter(attr.sql || '');

  filter.getPatternIcon = function(size)
  {
   var ph = filter.getStyle(true);
   return gmxAPI.getPatternIcon(ph.regular, size);
  }

  filter.setZoomBounds(attr.MinZoom, attr.MaxZoom);
  filter._attr = attr;
        
  gmxAPI._listeners.dispatchEvent('initFilter', gmxAPI.map, {'filter': filter} ); // Проверка map Listeners на reSetStyles - для балунов

        filter.getBalloonTemplate = function() {
            return filter._balloonTemplate;
        }
  prnt.filters[num] = filter;
  gmxAPI.mapNodes[filter.objectId] = filter;

  var proxy = gmxAPI._cmdProxy;
        gmxAPI.extend(filter, {    // переопределение свойств после установки видимости
            setStyleHook: function(func) {  // Установка стилевой функции пользователя
                return proxy('setStyleHook', { obj: filter, attr:{data: func} });
            }
            ,removeStyleHook: function() {  // удаление стилевой функции пользователя
                return proxy('removeStyleHook', { obj: filter, attr:{data: attr} });
            }
        });
  return filter;
 }

 // Добавление фильтра
 // Ключи :
 // * Balloon: текст баллуна
 // * BalloonEnable: показывать ли баллун
 // * DisableBalloonOnClick: не показывать при клике
 // * DisableBalloonOnMouseMove: не показывать при наведении
 // * RenderStyle: стиль фильтра
 // * MinZoom: мин.зум
 // * MaxZoom: макс.зум
 // * sql: строка фильтра
 var addFilter = function(prnt, attr)
 {
  if(!attr) attr = {};
  var filter = new gmxAPI._FMO(false, {}, prnt); // MapObject для фильтра
  var num = prnt.filters.length;     // Номер фильтра в массиве фильтров
  var lastFilter = (num > 0 ? prnt.filters[num - 1] : null); // Последний существующий фильтр
  if(!attr && lastFilter) {
   attr = gmxAPI.clone(lastFilter._attr);
  }
  if(!attr.MinZoom) attr.MinZoom = gmxAPI.defaultMinZoom;
  if(!attr.MaxZoom) attr.MaxZoom = gmxAPI.defaultMaxZoom;

  filter._attr = attr;
  prnt.filters.push(filter);
  if (attr.name)
   prnt.filters[attr.name] = filter;

  if(!filter.clusters && attr.clusters && '_Clusters' in gmxAPI) {
   filter.clusters = new gmxAPI._Clusters(filter); // атрибуты кластеризации потомков по фильтру
   filter.setClusters(attr.clusters);
  }
        gmxAPI.extend(filter, {         // определение свойств до установки видимости
            setStyleHook: function(func) {
                attr.styleHook = func;
                return true;
            }
            ,removeStyleHook: function() {
                delete attr.styleHook;
                return true;
            }
  });

  gmxAPI._listeners.dispatchEvent('addFilter', prnt, {'filter': filter} );   // Listeners на слое - произошло добавление фильтра
  if(prnt.objectId) filter = initFilter(prnt, num); // если слой виден - инициализация фильтра

  // Удаление фильтра
  filter.remove = function()
  {
   var ret = gmxAPI._FMO.prototype.remove.call(this);
   if(prnt.filters[attr.name]) delete prnt.filters[attr.name];
   for(var i=0; i<prnt.filters.length; i++) {
    if(this == prnt.filters[i]) {
     prnt.filters.splice(i, 1);
     break;
    }
   }
  }
  return filter;
 }

    // Добавление слоя
    var addLayer = function(parentObj, layer, isVisible, isMerc)
    {
        var FlashMapObject = gmxAPI._FMO;
        if (!parentObj.layers)
            parentObj.layers = [];
        
        if (!parentObj.layersParent) {
            parentObj.layersParent = parentObj.addObject(null, null, {'layersParent': true});
        }
        if (!parentObj.overlays)
        {
            parentObj.overlays = parentObj.addObject(null, null, {'overlaysParent': true});
            parentObj.addObject = function(geom, props, propHiden)
            {
                var ret = FlashMapObject.prototype.addObject.call(parentObj, geom, props, propHiden);
                parentObj.overlays.bringToTop();
                return ret;
            }
            
        }
        var proxy = gmxAPI._cmdProxy;

        var getIndexLayer = function(sid)
        { 
            var myIdx = parentObj.layers.length;
            var n = 0;
            for (var i = 0; i < myIdx; i++)
            {
                var l = parentObj.layers[i];
                if (l.objectId && (l.properties.type != "Overlay")) {
                    if (l.objectId == sid) break;
                    n += 1;
                }
            }
            return n;
        }
        
        if (isVisible === undefined)
            isVisible = true;
        
        var obj = new gmxAPI._FMO(false, {}, parentObj);     // MapObject слоя

        var zIndex = parentObj.layers.length;
        if(!layer) layer = {};
        if(!layer.properties) layer.properties = {};
        if(!layer.properties.identityField) layer.properties.identityField = "ogc_fid";

        obj.geometry = layer.geometry;
        if(obj.geometry) {
            if(isMerc) {
                obj.mercGeometry = obj.geometry; 
                obj.geometry = gmxAPI.from_merc_geometry(obj.mercGeometry);
            } else {
                obj.mercGeometry = gmxAPI.merc_geometry(obj.geometry); 
            }
        } else {
            obj.mercGeometry = {
                'type': "POLYGON"
                ,'coordinates': [[
                    [-20037500, -21133310]
                    ,[-20037500, 21133310]
                    ,[20037500, 21133310]
                    ,[20037500, -21133310]
                    ,[-20037500, -21133310]
                ]]
            };
            obj.geometry = gmxAPI.from_merc_geometry(obj.mercGeometry); 
        }
        
        var isRaster = (layer.properties.type == "Raster");
        var layerName = layer.properties.name || layer.properties.image || gmxAPI.newFlashMapId();
        if(!layer.properties.name) layer.properties.name = layerName;
        //obj.geometry = layer.geometry;
        //obj.mercGeometry = layer.mercGeometry;

        obj.properties = layer.properties;
        obj.propHiden = { 'isLayer': true, 'isMerc': isMerc };
        var isOverlay = false;
        var overlayLayerID = gmxAPI.getBaseMapParam("overlayLayerID","");
        if(typeof(overlayLayerID) == 'string') {
            var arr = overlayLayerID.split(",");
            for (var i = 0; i < arr.length; i++) {
                if(layerName == arr[i]) {
                    isOverlay = true;
                    break;
                }
            }
        }

        if (isOverlay)
            layer.properties.type = "Overlay";

        obj.filters = [];
        obj.filters.foreach = function(callback) {
            for (var i = 0, len = obj.filters.length; i < len; i++) {
                if(callback(obj.filters[i], i) === false) return;
            }
        }

        if (!isRaster) {
            if(!layer.properties.styles) {  // стиль-фильтр по умолчанию
                layer.properties.styles = [
                    {
                        'BalloonEnable': true
                        ,'DisableBalloonOnClick': false
                        ,'DisableBalloonOnMouseMove': false
                        ,'MinZoom': gmxAPI.defaultMinZoom
                        ,'MaxZoom': gmxAPI.defaultMaxZoom
                        ,'RenderStyle': {'outline': {'color': 255,'thickness': 1}}
                    }
                ];
            }
            // Добавление начальных фильтров
            for (var i = 0, len = layer.properties.styles.length; i < len; i++) {
                var style = layer.properties.styles[i],
                    attr = getFilterAttr(style);
                addFilter(obj, attr);
            }
            obj.addFilter = function(attr) { return addFilter(obj, attr); };
            obj.getItem = function(pid, flagMerc) {             // Получить обьект векторного слоя
                return proxy('getItem', { 'obj': obj, 'attr':{layerId:obj.objectId, itemId:pid, flagMerc:flagMerc} });
            };
            obj.addItems = function(attr) {     // добавление обьектов векторного слоя
                return proxy('addItems', { 'obj': obj, 'attr':{'layerId':obj.objectId, 'data': attr} });
            };
            obj.removeItems = function(attr) {  // удаление обьектов векторного слоя 
                return proxy('removeItems', { 'obj': obj, 'attr':{'layerId':obj.objectId, 'data': attr} });
            };
            obj.setSortItems = function(attr) { // установка сортировки обьектов векторного слоя 
                return proxy('setSortItems', { 'obj': obj, 'attr':{'layerId':obj.objectId, 'data': attr} });
            };
            obj.setFlipItems = function(arr, flag) {    // Установить массив flip обьектов
                return proxy('setFlipItems', { 'obj': obj, 'attr':{layerId:obj.objectId, arr: arr, clear: flag} });
            };
            obj.getFlipItems = function() {             // Получить массив id flip обьектов
                return proxy('getFlipItems', { 'obj': obj, 'attr':{layerId:obj.objectId} });
            };
            obj.setRasterViewItems = function(arr) {    // Установить видимость растров обьектов
                return proxy('setRasterViewItems', { 'obj': obj, 'attr':{'layerId':obj.objectId, 'arr': arr} });
            };
            obj.bringToTopItem = function(fid) {        // Добавить обьект к массиву Flips обьектов
                return proxy('addFlip', { 'obj': obj, 'attr':{'layerId':obj.objectId, 'fid': fid} });
            };
            obj.disableFlip = function() {              // Отменить ротацию обьектов слоя
                return proxy('disableFlip', { 'obj': obj, 'attr':{'layerId':obj.objectId} });
            };
            obj.enableFlip = function() {               // Установить ротацию обьектов слоя
                return proxy('enableFlip', { 'obj': obj, 'attr':{'layerId':obj.objectId} });
            };
            obj.setWatcher = function(attr) {           // Установка подглядывателя обьекта под Hover обьектом
                return proxy('setWatcher', { 'obj': obj, 'attr':attr });
            };
            obj.removeWatcher = function() {            // Удалить подглядыватель
                return proxy('removeWatcher', { 'obj': obj });
            };
        }

        var hostName = layer.properties.hostName || gmxAPI.map.defaultHostName || "maps.kosmosnimki.ru";
        var mapName = layer.properties.mapName || gmxAPI.currentMapName || "client_side_layer";
        var baseAddress = "http://" + hostName + "/";
        var sessionKey = isRequiredAPIKey( hostName ) ? window.KOSMOSNIMKI_SESSION_KEY : false;
        var sessionKey2 = ('sessionKeyCache' in window ? window.sessionKeyCache[mapName] : false);
        var isInvalid = (sessionKey == "INVALID");

        var chkCenterX = function(arr)
        { 
            var centerX = 0;
            for (var i = 0; i < arr.length; i++)
            {
                centerX += parseFloat(arr[i][0]);
            }
            centerX /= arr.length;
            var prevCenter = centerX;
            centerX = gmxAPI.chkPointCenterX(centerX);
            var dx = prevCenter - centerX;
            for (var i = 0; i < arr.length; i++)
            {
                arr[i][0] -= dx;
            }
        }

        var bounds = false;    // в меркаторе
        var boundsLatLgn = false;
        var initBounds = function(geom) { // geom в меркаторе
            if (geom) {
                bounds = gmxAPI.getBounds(geom.coordinates);
                obj.bounds = boundsLatLgn = {
                    minX: gmxAPI.from_merc_x(bounds.minX),
                    minY: gmxAPI.from_merc_y(bounds.minY),
                    maxX: gmxAPI.from_merc_x(bounds.maxX),
                    maxY: gmxAPI.from_merc_y(bounds.maxY)
                };
                if (geom.type === 'MULTIPOLYGON') {
                    obj.boundsArr = [];
                    obj.boundsLatLgnArr = [];
                    for (var i = 0, len = geom.coordinates.length; i < len; i++) {
                        var ext = gmxAPI.getBounds(geom.coordinates[i]);
                        obj.boundsArr.push(ext);
                        obj.boundsLatLgnArr.push({
                            minX: gmxAPI.from_merc_x(ext.minX),
                            minY: gmxAPI.from_merc_y(ext.minY),
                            maxX: gmxAPI.from_merc_x(ext.maxX),
                            maxY: gmxAPI.from_merc_y(ext.maxY)
                        });
                    }
                }
            }
        };
        var getBoundsMerc = function() {
            if (!bounds) initBounds(obj.mercGeometry);
            return bounds;
        };
        var getBoundsLatLng = function() {
            if (!bounds) initBounds(obj.mercGeometry);
            return boundsLatLgn;
        };
        obj.getLayerBounds = function() {           // Получение boundsLatLgn для внешних плагинов
            if (!boundsLatLgn) initBounds(obj.mercGeometry);
            return obj.boundsLatLgnArr ? obj.boundsLatLgnArr[0] : boundsLatLgn;
        }
        obj.getLayerBoundsArrayMerc = function() {      // Получение массива bounds в меркаторе
            if (!boundsLatLgn) initBounds(obj.mercGeometry);
            return (obj.boundsArr ? obj.boundsArr : [bounds]);
        }
        
        obj.getBoundsMerc = function() {            // Получение boundsMerc в меркаторе
            return getBoundsMerc();
        }

        var tileSenderPrefixBase = baseAddress + 
            "TileSender.ashx?ModeKey=tile" + 
            "&MapName=" + encodeURIComponent(mapName) + 
            (sessionKey ? ("&key=" + encodeURIComponent(sessionKey)) : "") +
            (sessionKey2 ? ("&MapSessionKey=" + encodeURIComponent(sessionKey2)) : "");

        var tileSenderPrefix = tileSenderPrefixBase + 
            "&LayerName=" + layerName;

        var tileFunction = function(i, j, z)
        {
            if (isRaster)
            {
                if (!bounds) initBounds(obj.mercGeometry);
                var tileSize = gmxAPI.getScale(z)*256;
                var minx = i*tileSize;
                var maxx = minx + tileSize;
                if (maxx < bounds.minX) {
                    i += Math.pow(2, z);
                }
                else if (minx > bounds.maxX) {
                    i -= Math.pow(2, z);
                }
            }

            return tileSenderPrefix + 
                "&z=" + z + 
                "&x=" + i + 
                "&y=" + j;
        }

        gmxAPI.extend(obj, {        // определение свойств до установки видимости
            setDateInterval: function(dt1, dt2) {  // Установка временного интервала
                obj.dt1 = dt1;
                obj.dt2 = dt2;
            },
            getDateInterval: function() {  // Получить временной интервал
                return {
                    beginDate: obj.dt1
                    ,endDate: obj.dt2
                };
            },
            getTileCounts: function(dt1, dt2) {  // Получить количество тайлов по временному интервалу
                return 0;
            },
            setPositionOffset: function(dx, dy) {
                obj.shiftX = dx || 0;
                obj.shiftY = dy || 0;
                if(this.objectId) proxy('setPositionOffset', { obj: obj, attr:{shiftX:obj.shiftX, shiftY: obj.shiftY} });
            }
            ,getPositionOffset: function() {
                return {shiftX: obj.shiftX || 0, shiftY: obj.shiftY || 0};
            }
            ,setStyleHook: function(func) {  // Установка стилевой функции пользователя
                obj.filters.foreach(function(item) { item.setStyleHook(func); });
                return true;
            }
            ,removeStyleHook: function() {  // удаление стилевой функции пользователя
                obj.filters.foreach(function(item) { item.removeStyleHook(); });
                return true;
            }
            ,getStatus: function(pt) {  // Получить состояние слоя по видимому extent
                if(this.objectId) return proxy('getStatus', { obj: obj, attr:pt });
                return {isVisible: false};
            }
            ,freezeLoading: function(pt) {      // установить флаг игнорирования загрузки векторных тайлов
                obj._isLoadingFreezed = true;
                return true;
            }
            ,unfreezeLoading: function(pt) {    // удалить флаг игнорирования загрузки векторных тайлов
                obj._isLoadingFreezed = false;
                return true;
            }
            ,isLoadingFreezed: function(pt) {    // получить флаг игнорирования загрузки векторных тайлов
                return obj._isLoadingFreezed;
            }
            ,chkLayerVersion: function(callback) {  // Запросить проверку версии невидимого слоя
                if (callback) callback({"Status":"notVisible"});
                return false;
            }
        });
        if(obj.properties) {
            if('MetaProperties' in obj.properties) {
                var meta = layer.properties.MetaProperties;
                if('shiftX' in meta || 'shiftY' in meta) {
                    obj.shiftX = meta.shiftX ? meta.shiftX.Value : 0;
                    obj.shiftY = meta.shiftY ? meta.shiftY.Value : 0;
                }
            }
            var isLayerVers = obj.properties.tilesVers || obj.properties.TemporalVers || false;
            if(gmxAPI._layersVersion && isLayerVers) {  // Установлен модуль версий слоев + есть версии тайлов слоя
                gmxAPI._layersVersion.chkVersion(obj);
                obj.chkLayerVersion = function(callback) {
                    gmxAPI._layersVersion.chkLayerVersion(obj, callback);
                }
            }
        }
        if('shiftX' in obj) obj.setPositionOffset(obj.shiftX, obj.shiftY);

        var deferredMethodNames = [
            'getChildren', 'getItemsFromExtent', 'getTileItem', 'setTileItem',
            'getDepth', 'getZoomBounds', 'getVisibility', 'getStyle', 'getIntermediateLength',
            'getCurrentEdgeLength', 'getLength', 'getArea', 'getGeometryType', 'getStat', 'flip',
            'setZoomBounds', 'setBackgroundTiles', 'startLoadTiles', 'setVectorTiles', 'setTiles', 'setTileCaching',
            'setImageExtent', 'setImage', 'bringToTop', 'bringToDepth', 'setDepth', 'bringToBottom',
            'setGeometry', 'setActive',  'setEditable', 'startDrawing', 'stopDrawing', 'isDrawing', 'setLabel', 'setDisplacement',
            'removeHandler', 'clearBackgroundImage', 'addObjects', 'addObjectsFromSWF',
            'setHandler', 'setVisibilityFilter', //'remove', 'removeListener', 'addListener',
            'setClusters',
            'addImageProcessingHook', 'removeImageProcessingHook',
            'addClipPolygon', 'removeClipPolygon',
            'addContextMenuItem', 'removeContextMenuItem',
            'enableDragging', 'disableDragging',
            'setStyle', 'setBackgroundColor', 'setCopyright', 'addObserver', 'enableTiledQuicklooks', 'enableTiledQuicklooksEx'
        ];
        // не используемые команды addChildRoot getFeatureGeometry getFeatureLength getFeatureArea

        var createThisLayer = function()
        {
            var pObj = (isOverlay ? parentObj.overlays : parentObj.layersParent);
            var obj_ = pObj.addObject(obj.geometry, obj.properties, obj.propHiden);
            obj.objectId = obj_.objectId;
            obj_.backgroundColor = obj.backgroundColor;
            obj_.stateListeners = obj.stateListeners;
            if(obj.isBaseLayer) obj_.isBaseLayer = obj.isBaseLayer;
//            if(obj['_temporalTiles']) obj_['_temporalTiles'] = obj['_temporalTiles'];

            var isTemporal = obj.properties.Temporal || false; // признак мультивременного слоя
            if(isTemporal && '_TemporalTiles' in gmxAPI) {
                obj._temporalTiles = new gmxAPI._TemporalTiles(obj);
                
            }
            if(pObj.isMiniMap) {
                obj.isMiniMap = true;   // Все добавляемые к миникарте ноды имеют этот признак
            }
            obj_.getLayerBoundsLatLgn = function() {   // Получение boundsLatLgn
                if (!boundsLatLgn) initBounds(obj.mercGeometry);
                return obj.boundsLatLgnArr ? obj.boundsLatLgnArr[0] : boundsLatLgn;
            }
            obj_.getLayerBounds = obj_.getLayerBoundsLatLgn;
            obj_.getLayerBoundsMerc = function() {    // Получение bounds в меркаторе
                if (!bounds) initBounds(obj.mercGeometry);
                return (obj.boundsArr ? obj.boundsArr : [bounds]);
            }
            obj.addObject = function(geometry, props, propHiden) { return FlashMapObject.prototype.addObject.call(obj, geometry, props, propHiden); }
            obj.tileSenderPrefix = tileSenderPrefix; // Префикс запросов за тайлами
            
            gmxAPI._listeners.dispatchEvent('onLayerCreated', obj, {'obj': obj });
        
            obj.setVisible = function(flag)
            {
                FlashMapObject.prototype.setVisible.call(obj, flag);
            }

            for (var i = 0; i < deferredMethodNames.length; i++)
                delete obj[deferredMethodNames[i]];
            delete obj["getFeatures"];
            delete obj["getFeatureById"];

            obj.setHandler = function(eventName, handler)
            {
                FlashMapObject.prototype.setHandler.call(obj, eventName, handler);
                if(gmxAPI.proxyType === 'flash') {
                    for (var i = 0; i < obj.filters.length; i++)
                        obj.filters[i].setHandler(eventName, handler);
                }
            }
            obj.removeHandler = function(eventName)
            {
                FlashMapObject.prototype.removeHandler.call(obj, eventName);
                if(gmxAPI.proxyType === 'flash') {
                    for (var i = 0; i < obj.filters.length; i++)
                        obj.filters[i].removeHandler(eventName);
                }
            }
            obj.addListener = function(eventName, handler, level)
            {
                var pID = FlashMapObject.prototype.addListener.call(obj, eventName, handler, level);
                if(gmxAPI.proxyType === 'flash') {
                    for (var i = 0; i < obj.filters.length; i++) {
                        var fID = gmxAPI._listeners.addListener({'level': level, 'pID': pID, 'obj': obj.filters[i], 'eventName': eventName, 'func': handler});
                    }
                }
                return pID;
            }
            obj.removeListener = function(eventName, eID)
            {
                FlashMapObject.prototype.removeListener.call(obj, eventName, eID);
                if(gmxAPI.proxyType === 'flash') {
                    for (var i = 0; i < obj.filters.length; i++)
                        obj.filters[i].removeListener(eventName, eID); // Удаляем массив события eventName по id события слоя
                }
            }

            obj._observerOnChange = null;
            obj.addObserver = function(o, onChange, attr)
            {
                var observeByLayerZooms = false;
                if(typeof(o) == 'function') { // вызов без доп. mapObject
                    attr = onChange;
                    onChange = o;
                    o = obj.addObject();
                    observeByLayerZooms = true;
                }
                var fAttr = {
                    'layerId': obj.objectId
                    ,'asArray': true
                    ,'ignoreVisibilityFilter': (attr && attr['ignoreVisibilityFilter'] ? true : false)
                };
                var outCallBacks = function(arr) {
                    var out = [];
                }
                var func = function(arr) {
                    var out = [];
                    for (var i = 0; i < arr.length; i++) {
                        var item = arr[i];
                        var geo = (gmxAPI.proxyType === 'leaflet' ? item.geometry : gmxAPI.from_merc_geometry(item.geometry));
                        var mObj = new gmxAPI._FlashMapFeature(geo, item.properties, obj);
                        var ph = {'onExtent':item.onExtent, 'item':mObj, 'isVisibleFilter':item['isVisibleFilter'], 'status':item['status']};
                        out.push(ph);
                    }
                    for (var j = 0; j < obj._observerOnChange.length; j++) {
                        var ph = obj._observerOnChange[j];
                        if(out.length) ph[0](out);
                    }
                }
                fAttr['func'] = func;
                
                if(!obj._observerOnChange) {
                    proxy('observeVectorLayer', { 'obj': o, 'attr':fAttr});
                    obj._observerOnChange = [];
                }
                obj._observerOnChange.push([onChange, fAttr['ignoreVisibilityFilter']]);
                if(observeByLayerZooms) {
                    proxy('setAPIProperties', { 'obj': obj, 'attr':{'observeByLayerZooms':true} }); // есть новый подписчик события изменения видимости обьектов векторного слоя
                }
            }
            if (obj.stateListeners.onChangeLayerVersion) obj.chkLayerVersion();

            var stylesMinMaxZoom = getMinMaxZoom(layer.properties);
            if (isRaster) {
                var ph = {
                    'func':tileFunction
                    ,'projectionCode':0
                    ,'minZoom': layer.properties['MinZoom']
                    ,'maxZoom': layer.properties['MaxZoom']
                    ,'minZoomView': stylesMinMaxZoom['minZoom'] || 1
                    ,'maxZoomView': stylesMinMaxZoom['maxZoom'] || 30
                    ,'tileSenderPrefix': tileSenderPrefix
                    ,'bounds': bounds
                };
                proxy('setBackgroundTiles', {'obj': obj, 'attr':ph });
            } else
            {
                obj.getFeatures = function()
                {
                    var callback, geometry, str;
                    for (var i = 0; i < 3; i++)
                    {
                        var arg = arguments[i];
                        if (typeof arg == 'function')
                            callback = arg;
                        else if (typeof arg == 'string')
                            str = arg || ' ';
                        else if (typeof arg == 'object')
                            geometry = arg;
                    }
                    //if (!str && (obj.properties.GeometryType == "point")) {
                    if (!str) {
                        proxy('getFeatures', { 'obj': obj, 'attr':{'geom': geometry, 'func': callback}});
                    }
                    else
                    {
                        if (str === ' ') str = '';
                        gmxAPI.map.getFeatures(str, geometry, callback, [obj.properties.name]);  // Поиск через JSONP запрос
                    }
                }
                obj.getFeaturesByCenter = function(func)
                {
                    proxy('getFeatures', { 'obj': obj, 'attr':{'center':true, 'func': func} });
                }

                obj.getFeatureById = function(fid, func)
                {
                    proxy('getFeatureById', { 'obj': obj, 'attr':{'fid':fid, 'func': func} });
                }
                obj.setStyle = function(style, activeStyle)
                {
                    for (var i = 0; i < obj.filters.length; i++)
                        obj.filters[i].setStyle(style, activeStyle);
                }

                if(obj._temporalTiles) { // Для мультивременных слоёв
                    obj._temporalTiles.setVectorTiles();
                } else {
                    if(!layer.properties.tiles) layer.properties.tiles = [];
                    obj.setVectorTiles(tileFunction, layer.properties.identityField, layer.properties.tiles);
                }

                for (var i = 0; i < obj.filters.length; i++) {
                    obj.filters[i] = initFilter(obj, i);
                }

                // Изменить атрибуты векторного обьекта из загруженных тайлов
                obj.setTileItem = function(data, flag) {
                    var _obj = proxy('setTileItem', { 'obj': this, 'attr': {'data':data, 'flag':(flag ? true:false)} });
                    return _obj;
                }
                // Получить атрибуты векторного обьекта из загруженных тайлов id по identityField
                obj.getTileItem = function(vId) {
                    var _obj = proxy('getTileItem', { 'obj': this, 'attr': vId });
                    if(_obj.geometry) _obj.geometry = gmxAPI.from_merc_geometry(_obj.geometry);
                    return _obj;
                }
                obj.getStat = function() {      // Это только во Flash
                    var _obj = proxy('getStat', { 'obj': this });
                    return _obj;
                }
                obj.setTiles = function(data, flag) {
                    var _obj = proxy('setTiles', { 'obj': obj, 'attr':{'tiles':data, 'flag':(flag ? true:false)} });
                    return _obj;
                }
                obj.addClipPolygon = function(geo) {
                    return proxy('addClipPolygon', { 'obj': obj, 'attr':{'geo':geo} });
                };
                obj.removeClipPolygon = function() {
                    return proxy('removeClipPolygon', { 'obj': obj });
                };

                if (layer.properties.IsRasterCatalog) {
                    var RCMinZoomForRasters = layer.properties.RCMinZoomForRasters || 1;
                    obj.enableTiledQuicklooks(function(o)
                    {
                        //var qURL = tileSenderPrefix + '&x={x}&y={y}&z={z}&idr=' + o.properties[layer.properties.identityField];
                        var qURL = tileSenderPrefixBase + '&x={x}&y={y}&z={z}&LayerName=' + encodeURIComponent(o.properties['GMX_RasterCatalogID']);
                        return qURL;
                    }, RCMinZoomForRasters, layer.properties.TiledQuicklookMaxZoom, tileSenderPrefix);
                    obj.getRCTileUrl = function(x, y, z, pid) {
                        return tileSenderPrefix + '&x='+x+'&y='+y+'&z='+z+'&idr=' + pid;
                    };
                    obj.addImageProcessingHook = function(func) {
                        return proxy('addImageProcessingHook', { 'obj': obj, 'attr':{'func':func} });
                    };
                    obj.removeImageProcessingHook = function() {
                        return proxy('removeImageProcessingHook', { 'obj': obj });
                    };
                } else {
                    if (layer.properties.Quicklook) {
                        /*
                        // если накладываемое изображения с трансформацией как BG закоментарить
                        obj.enableQuicklooks(function(o)
                        {
                            obj.bringToTop();
                            return gmxAPI.applyTemplate(layer.properties.Quicklook, o.properties);
                        });
                        */
                    }
                    if (layer.properties.TiledQuicklook) {
                        obj.enableTiledQuicklooks(function(o)
                        {
                            return gmxAPI.applyTemplate(layer.properties.TiledQuicklook, o.properties);
                        }, layer.properties.TiledQuicklookMinZoom);
                    }
                }
            }

            for (var i = 0, len = obj.filters.length; i < len; i++)
            {
                var filter = obj.filters[i];
                filter.setStyle(filter._attr.regularStyle, filter._attr.hoveredStyle);
                if(filter._attr.clusters) filter.setClusters(filter._attr.clusters);
                delete filter.setVisible;
                delete filter.setStyle;
                delete filter.setFilter;
                delete filter.enableHoverBalloon;
                delete filter.setClusters;
                filter.setZoomBounds = FlashMapObject.prototype.setZoomBounds;
            }

            // Установка видимости по Zoom
            obj.setZoomBounds(stylesMinMaxZoom.minZoom, stylesMinMaxZoom.maxZoom);

            if(!obj.isMiniMap) {     // если это не miniMap
                if (layer.properties.Copyright) {
                    obj.setCopyright(layer.properties.Copyright);
                }
            }
            if(obj_.tilesParent) obj.tilesParent = obj_.tilesParent;
            gmxAPI.extend(obj, {    // переопределение свойств после установки видимости
                removeContextMenuItem: function(itemId) {
                    return proxy('removeContextMenuItem', { obj: obj, attr: {
                        id: itemId
                    }});
                },
                addContextMenuItem: function(text, callback, index) {
                    if(!obj.stateListeners.contextmenu) {
                        obj.addListener('contextmenu', function(attr) {
                            var ev = attr.target;
                            ev.latlng = attr.event.latlng;
                            gmxAPI._leaflet.contextMenu.showMenu({obj:obj, attr: ev}); // Показать меню
                        });
                    }
                    return proxy('addContextMenuItem', { obj: obj, attr: {
                        text: text,
                        index: index,
                        func: function(x, y, target)
                            {
                                if(gmxAPI.proxyType === 'flash') {
                                    x = gmxAPI.from_merc_x(x);
                                    y = gmxAPI.from_merc_y(y);
                                }
                                callback(x, y, target);
                            }
                        }
                    });
                }
                ,freezeLoading: function(pt) {      // установить флаг игнорирования загрузки векторных тайлов
                    obj._isLoadingFreezed = true;
                    proxy('setFreezeLoading', { obj: obj, attr:true });
                    return true;
                }
                ,unfreezeLoading: function(pt) {    // удалить флаг игнорирования загрузки векторных тайлов
                    obj._isLoadingFreezed = false;
                    proxy('setFreezeLoading', { obj: obj, attr:false });
                    return true;
                }
                ,isLoadingFreezed: function(pt) {    // получить флаг игнорирования загрузки векторных тайлов
                    return proxy('isLoadingFreezed', { obj: obj });
                }
            });
            if (obj._isLoadingFreezed) proxy('setFreezeLoading', { obj: obj, attr:true });
            obj.addListener('onChangeLayerVersion', function() {
                initBounds(obj.mercGeometry);
            });
        }

        //obj.mercGeometry = layer.mercGeometry;
        if(gmxAPI.proxyType === 'flash') initBounds(obj.mercGeometry);
        obj.isVisible = isVisible;
        //if (isVisible || gmxAPI.proxyType === 'leaflet') {   // В leaflet версии deferredMethod не нужны
        if (isVisible) {
            createThisLayer();
            //var zIndexCur = getIndexLayer(obj.objectId);
            obj.bringToDepth(zIndex);
            gmxAPI._listeners.dispatchEvent('onLayer', obj, obj); // Вызов Listeners события 'onLayer' - слой теперь инициализирован во Flash
        }
        else
        {
            var deferred = [];
            obj.setVisible = function(flag, notDispatch)
            {
                if (flag)
                {
                    createThisLayer();
                    if(obj.objectId) FlashMapObject.prototype.setVisible.call(obj, flag, notDispatch);  // без Dispatch события
                    for (var i = 0; i < deferred.length; i++) {
                        deferred[i]();
                    }
                    //var zIndexCur = getIndexLayer(obj.objectId);
                    gmxAPI._listeners.dispatchEvent('onLayer', obj, obj); // Вызов Listeners события 'onLayer' - слой теперь инициализирован во Flash
                    gmxAPI._listeners.dispatchEvent('onChangeVisible', obj, true); // слой теперь виден
                    if ('backgroundColor' in obj) gmxAPI.map.setBackgroundColor(obj.backgroundColor);
                }
            }

            if (!isRaster) {
                // Изменять атрибуты векторного обьекта при невидимом слое нельзя
                obj.setTileItem = function(data, flag) {
                    return false;
                }
                // Получить атрибуты векторного обьекта при невидимом слое нельзя
                obj.getTileItem = function(vId) {
                    return null;
                }
            }
            obj.addObject = function(geometry, props, propHiden)
            {
                obj.setVisible(true);
                var newObj = FlashMapObject.prototype.addObject.call(obj, geometry, props, propHiden);
                //FlashMapObject.prototype.setVisible.call(obj, false, true);  // без Dispatch события
                //obj.setVisible(false);
                return newObj;
            }
            for (var i = 0, len = deferredMethodNames.length; i < len; i++) (function(name)
            {
                obj[name] = function(p1, p2, p3, p4) 
                { 
                    deferred.push(function() { obj[name].call(obj, p1, p2, p3, p4); });
                }
            })(deferredMethodNames[i]);

            obj.addListener = function(eventName, handler, level)
            {
                var evID = gmxAPI.newFlashMapId();
                if(eventName === 'onChangeLayerVersion') {
                    gmxAPI._listeners.addListener({'obj': obj, 'evID': evID, 'eventName': eventName, 'func': handler, 'level': level});
                } else {
                    deferred.push(function() {
                        gmxAPI._listeners.addListener({'obj': obj, 'evID': evID, 'eventName': eventName, 'func': handler, 'level': level});
                        if(gmxAPI.proxyType === 'flash') {
                            for (var i = 0; i < obj.filters.length; i++) {
                                gmxAPI._listeners.addListener({'level': level, 'pID': evID, 'obj': obj.filters[i], 'eventName': eventName, 'func': handler});
                            }
                        }
                    });
                }
                return evID;
            }

            if (gmxAPI.proxyType === 'leaflet') obj.bringToDepth(zIndex);
            if (!isRaster)
            {
                obj.getFeatures = function(arg1, arg2, arg3)
                {       
                    obj.setVisible(true, true);
                    obj.getFeatures(arg1, arg2, arg3);
                    FlashMapObject.prototype.setVisible.call(obj, false, true);  // без Dispatch события
                    //obj.setVisible(false);
                }
                obj.getFeatureById = function(arg1, arg2, arg3)
                {       
                    obj.setVisible(true);
                    obj.getFeatureById(arg1, arg2, arg3);
                    FlashMapObject.prototype.setVisible.call(obj, false, true);  // без Dispatch события
                    //obj.setVisible(false);
                }

                for (var i = 0, len = layer.properties.styles.length; i < len; i++) (function(i) {
                    obj.filters[i].setZoomBounds = function(minZoom, maxZoom)
                    {
                        if(!obj.filters[i]['_attr']) obj.filters[i]['_attr'] = {};
                        obj.filters[i]['_attr']['MinZoom'] = minZoom;
                        obj.filters[i]['_attr']['MaxZoom'] = maxZoom;
                        deferred.push(function() {
                            obj.filters[i].setZoomBounds(minZoom, maxZoom);
                            });
                    }
                    obj.filters[i].setVisible = function(flag)
                    {
                        deferred.push(function() {
                            obj.filters[i].setVisible(flag);
                            });
                    }
                    obj.filters[i].setStyle = function(style, activeStyle)
                    {
                        deferred.push(function() {
                            obj.filters[i].setStyle(style, activeStyle);
                            });
                    }
                    obj.filters[i].setFilter = function(sql)
                    {
                        if(!obj.filters[i]['_attr']) obj.filters[i]['_attr'] = {};
                        obj.filters[i]['_attr']['sql'] = sql;
                        deferred.push(function() { 
                            obj.filters[i].setFilter(sql);
                            });
                        return true;
                    }
                    obj.filters[i].enableHoverBalloon = function(callback, attr)
                    {
                        deferred.push(function() {
                            obj.filters[i].enableHoverBalloon(callback, attr);
                            });
                    }
                    obj.filters[i].setClusters = function(attr)
                    {
                        obj.filters[i]._clustersAttr = attr;
                        deferred.push(function() {
                            obj.filters[i].setClusters(attr);
                        });
                    }
                })(i);
            }
        }
        
        if(parentObj.layers[layerName]) {
            for(var i = parentObj.layers.length - 1; i >= 0; i--) { // Удаление слоя из массива
                var prop = parentObj.layers[i].properties;
                if(prop.name === layerName) {
                    parentObj.layers.splice(i, 1);
                    break;
                }
            }
        }
        parentObj.layers.push(obj);
        parentObj.layers[layerName] = obj;
        if (!layer.properties.title) layer.properties.title = 'layer from client ' + layerName;
        if (!layer.properties.title.match(/^\s*[0-9]+\s*$/))
            parentObj.layers[layer.properties.title] = obj;

        obj.addListener('onChangeVisible', function(flag) {    // Изменилась видимость слоя
            gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map, {'from':obj.objectId}); // Проверка map Listeners на hideBalloons
        }, -10);

        obj.addListener('BeforeLayerRemove', function() {    // Удаляется слой
            gmxAPI._listeners.dispatchEvent('AfterLayerRemove', obj, layerName); // Удален слой
        }, -10);
        obj._clearLayer = function() {   // Чистка map.layers при удалении слоя
            //if(!layerName) layerName = obj.properties.name;
            for(var i=0, len=gmxAPI.map.layers.length; i<len; i++) {   // Удаление слоя из массива
                var prop = gmxAPI.map.layers[i].properties;
                if(prop.name === layerName) {
                    gmxAPI.map.layers.splice(i, 1);
                    break;
                }
            }
            for(key in gmxAPI.map.layers) {       // Удаление слоя из хэша
                var prop = gmxAPI.map.layers[key].properties;
                if(prop.name === layerName) {
                    delete gmxAPI.map.layers[key];
                }
            }
        }
        obj.addListener('AfterLayerRemove', function() {   // Удален слой
            obj._clearLayer(obj.properties.name);
        }, 101); // Перед всеми пользовательскими Listeners
        if(obj.objectId) gmxAPI.mapNodes[obj.objectId] = obj;
        gmxAPI._listeners.dispatchEvent('onLayerAdd', gmxAPI.map, obj); // Добавлен слой
        return obj;
    }

    //расширяем FlashMapObject
    gmxAPI.extendFMO('addLayer', function(layer, isVisible, isMerc) {
        //if(layer && layer.geometry && !isMerc) layer.geometry = gmxAPI.merc_geometry(layer.geometry);
        var obj = addLayer(this, layer, isVisible, isMerc);
        gmxAPI._listeners.dispatchEvent('onAddExternalLayer', gmxAPI.map, obj); // Добавлен внешний слой
        return obj;
    } );

})();
;/* ======================================================================
    LayersVersion.js
   ====================================================================== */

// Поддержка версионности слоев
(function()
{
	var intervalID = 0;
    var chkVersionTimeOut = 20000;
	var versionLayers = {};				// Версии слоев по картам

	// Запрос обновления версий слоев карты mapName
	function sendVersionRequest(host, mapName, arr, callback)
	{
		if(arr.length > 0) {
			gmxAPI.sendCrossDomainPostRequest(
				'http://' + host + '/Layer/CheckVersion.ashx',
				{'WrapStyle': 'message', 'layers':'[' + arr.join(',') + ']'},
				function(response) {
					if(response && response.Result && response.Result.length > 0) {
						// Обработка запроса изменения версий слоев
						CheckVersionResponse({host: host, mapName: mapName, arr: response.Result});
					}
					if(callback) callback(response);
				}
			);
		}
	}

    // Проверка версий слоев
    function chkVersion(e)
    {
        if(gmxAPI.isPageHidden()) return;
        var layersArr = gmxAPI.map.layers;
        for(var host in versionLayers) {
            var arr = [];
            for(var mapName in versionLayers[host]) {
                for(var layerName in versionLayers[host][mapName]) {
                    var layer = layersArr[layerName];
                    if(layer && (layer.isVisible || layer.stateListeners.onChangeLayerVersion)) {
                        arr.push('{ "Name":"'+ layerName +'","Version":' + layer.properties.LayerVersion +' }');
                    }
                }
            }
            if(arr.length > 0) {
                sendVersionRequest(host, mapName, arr);
                arr = [];
            }
        }
    }

	var setVersionCheck = function(msek) {
		if(intervalID) clearInterval(intervalID);		
		intervalID = setInterval(chkVersion, msek);
	}
	var mapInitID = gmxAPI._listeners.addListener({'eventName': 'mapInit', 'func': function(map) {
		setVersionCheck(chkVersionTimeOut);
		gmxAPI._listeners.removeListener(null, 'mapInit', mapInitID);
		}
	});

	// Обработка ответа запроса CheckVersion
	function CheckVersionResponse(inp)
	{
		var mapHost = inp.host;
		var arr = [];
		for (var i = 0, len = inp.arr.length; i < len; i++) {
			var ph = inp.arr[i],
                layerName = ph.properties.name,
                layer = gmxAPI.map.layers[layerName],
                mapName = layer.properties.mapName,
                prev = versionLayers[mapHost][mapName],
                ptOld = prev[layerName] || {};
			// обновить версию слоя
			layer.properties.LayerVersion = ph.properties.LayerVersion;
			layer._Processing = chkProcessing(layer, ph.properties);
			var pt = null;
			var attr = {
				processing: layer._Processing,
				notClear: true,
				refresh: true
			};
			if('_temporalTiles' in layer) {		// мультивременной слой	- обновить в Temporal.js
				pt = layer._temporalTiles.getTilesHash(ph.properties, ptOld.tilesHash);
				if(pt.count != ptOld.count || pt.add.length > 0 || pt.del.length > 0) {
					layer.properties.TemporalTiles = ph.properties.TemporalTiles;
					layer.properties.TemporalVers = ph.properties.TemporalVers;
					attr.add = pt.add;
					attr.del = pt.del;

					attr.ut1 = pt.ut1;
					attr.ut2 = pt.ut2;
					attr.dtiles = pt.dtiles;
				}
			} else {
				pt = getTilesHash(ph.properties, ptOld.tilesHash);
				if(pt.count != ptOld.count || pt.add.length > 0 || pt.del.length > 0) {
					layer.properties.tiles = attr.tiles = ph.properties.tiles;
					layer.properties.tilesVers = attr.tilesVers = ph.properties.tilesVers;
					attr.add = pt.add;
					attr.del = pt.del;
				}
			}
			versionLayers[mapHost][mapName][layerName] = { 'LayerVersion': layer.properties.LayerVersion, 'tilesHash': pt.hash, 'count': pt.count };
			layer.geometry = gmxAPI.from_merc_geometry(ph.geometry);	// Обновить геометрию слоя
			gmxAPI._listeners.dispatchEvent('onChangeLayerVersion', layer, layer.properties.LayerVersion );			// Listeners на слое - произошло изменение LayerVersion
			// обновить список тайлов слоя
			if(attr.add || attr.del || attr.dtiles) {
				gmxAPI._cmdProxy('startLoadTiles', { obj: layer, attr: attr });
			}
		}
		return arr;
	}

	// Формирование Hash списка версий тайлов
	function getTilesHash(prop, ph)
	{
		var tiles = prop.tiles || [],
            tilesVers = prop.tilesVers || [],
            len = tiles.length,
            out = {hash:{}, del: {}, add: [], count: len, res: false };		// в hash - Hash списка версий тайлов, в res = true - есть изменения с ph
		for (var i = 0; i < len; i+=3) {
			var x = tiles[i], y = tiles[i+1], z = tiles[i+2], v = tilesVers[i / 3];
			var arr = [x, y, z, v];
			var st = arr.join('_');
			out.hash[st] = true;
			if(ph && !ph[st]) {
				out.add.push(arr);
				out.del[z + '_' + x + '_' + y] = true;
			}
		}
		if(ph) {
			for (var key in ph) {
				if(!out.hash[key]) {
					var arr = key.split('_');
					out.del[arr[2] + '_' + arr[0] + '_' + arr[1]] = true;
				}
			}
		}
		return out;
	}

	// Получить список обьектов слоя добавляемых через addobjects
	function getAddObjects(Processing)
	{
		var arr = [];
		if (Processing.Updated && Processing.Updated.length > 0) {
			arr = arr.concat(Processing.Updated);
		}
		if (Processing.Inserted && Processing.Inserted.length > 0) {
			arr = arr.concat(Processing.Inserted);
		}
		return arr;
	}

	// Обработка списка редактируемых обьектов слоя	//addobjects
	function chkProcessing(obj, prop)
	{
		var flagEditItems = false;
		var removeIDS = {};
		if (prop.Processing.Deleted && prop.Processing.Deleted.length > 0) {		// список удаляемых обьектов слоя
			for (var i = 0, len = prop.Processing.Deleted.length; i < len; i++) {			// добавляемые обьекты также необходимо удалить из тайлов
				removeIDS[prop.Processing.Deleted[i]] = true;
				flagEditItems = true;
			}
		}
		var arr = getAddObjects(prop.Processing);		// addobjects
		for (var i = 0, len = arr.length; i < len; i++) {			// добавляемые обьекты также необходимо удалить из тайлов
			var pt = arr[i];
			removeIDS[pt.id] = true;
			flagEditItems = true;
		}
		var out = {
			removeIDS: removeIDS, 
			addObjects: arr 
		};
		if(flagEditItems) {
			gmxAPI._cmdProxy('setEditObjects', { obj: obj, attr: out });
			gmxAPI.addDebugWarnings({'func': 'chkProcessing', 'warning': 'Processing length: ' + arr.length, 'layer': prop.title});
		}
		return out;
	}
	
	var ret = {
		'chkVersionLayers': function (layers, layer) {
			if(!('LayerVersion' in layer.properties)) return;
			var prop = layer.properties;
			if(!prop.tilesVers && !prop.TemporalVers) return false;
            var mapHost = prop.hostName || layers.properties.hostName;
            var mapName = prop.mapName || layers.properties.name;
            if(!versionLayers[mapHost]) versionLayers[mapHost] = {};
            if(!versionLayers[mapHost][mapName]) versionLayers[mapHost][mapName] = {};
            var layerObj = ('stateListeners' in layer ? layer : gmxAPI.map.layers[prop.name]);
            var pt = ('_temporalTiles' in layerObj ? layerObj._temporalTiles.getTilesHash(prop) : getTilesHash(prop));
            versionLayers[mapHost][mapName][prop.name] = { 'LayerVersion': layer.properties.LayerVersion, 'tilesHash': pt.hash, 'count': pt.count };
		}
		,'chkVersion': function (layer) {		// Обработка списка редактируемых обьектов слоя
			if(!layer || !('Processing' in layer.properties)) return;
			var onLayerID = layer.addListener('onLayer', function(ph) {
				layer.removeListener('onLayer', onLayerID);
				if(!layer.properties.tilesVers && !layer.properties.TemporalVers) return false;
				gmxAPI._layersVersion.chkVersionLayers(layer.parent, layer);
				ph._Processing = chkProcessing(ph, ph.properties);			// слой инициализирован во Flash
			});
			var BeforeLayerRemoveID = layer.addListener('BeforeLayerRemove', function(layerName) {				// Удаляется слой
				layer.removeListener('BeforeLayerRemove', BeforeLayerRemoveID);
				if(layer.properties.name != layerName) return false;
				var mapHost = layer.properties.hostName;
				if(!versionLayers[mapHost]) return false;
				var mapName = layer.properties.mapName;
				if(!versionLayers[mapHost][mapName]) return false;
				delete versionLayers[mapHost][mapName][layer.properties.name];
				//gmxAPI._listeners.dispatchEvent('AfterLayerRemove', layer, layer.properties.name);	// Удален слой
			}, -9);
		}
		,'chkLayerVersion': function (layer, callback) {		// Запросить проверку версии слоя
			var prop = layer.properties;
			if(!prop.tilesVers && !prop.TemporalVers) return false;
			sendVersionRequest(prop.hostName, prop.mapName, ['{ "Name":"'+ prop.name +'","Version":' + prop.LayerVersion +' }'], callback);
		}
		,'setVersionCheck': setVersionCheck						// Переустановка задержки запросов проверки версий слоев
	};
	
	//расширяем namespace
    gmxAPI._layersVersion = ret;
})();
;/* ======================================================================
    Map.js
   ====================================================================== */

//Поддержка map
(function()
{
    var addNewMap = function(rootObjectId, layers, callback)
    {
        var map = new gmxAPI._FMO(rootObjectId, {}, null); // MapObject основной карты
        gmxAPI.map = map;
        gmxAPI.mapNodes[rootObjectId] = map; // основная карта

        if(!layers.properties) layers.properties = {};
        map.properties = layers.properties;
        if(!layers.children) layers.children = [];
        //map.onSetVisible = {};
        map.isVisible = true;
        map.layers = [];
        map.rasters = map;
        map.tiledQuicklooks = map;
        map.vectors = map;
        var getDefaultPos = function(prop) {
            return {
                x: (typeof(prop.DefaultLong) === 'number' ? prop.DefaultLong :(map.needMove ? map.needMove.x : 35))
                ,y: (typeof(prop.DefaultLat) === 'number' ? prop.DefaultLat :(map.needMove ? map.needMove.y : 50))
                ,z: (typeof(prop.DefaultZoom) === 'number' ? prop.DefaultZoom :(map.needMove ? map.needMove.z : 4))
            };
        }
        map.needMove = getDefaultPos(layers.properties);
        map.needSetMode = null;

        // Методы присущие только Map
        map.setDistanceUnit = function(attr) { map.DistanceUnit = attr; return true; }
        map.setSquareUnit = function(attr) { map.SquareUnit = attr; return true; }
        map.getDistanceUnit = function() { return map.DistanceUnit; }
        map.getSquareUnit = function() { return map.SquareUnit; }
        map.sendPNG = function(attr) { var ret = gmxAPI._cmdProxy('sendPNG', { 'attr': attr }); return ret; }
        map.savePNG = function(fileName) { gmxAPI._cmdProxy('savePNG', { 'attr': fileName }); }
        map.trace = function(val) { gmxAPI._cmdProxy('trace', { 'attr': val }); }
        map.setQuality = function(val) { gmxAPI._cmdProxy('setQuality', { 'attr': val }); }
        map.disableCaching = function() { gmxAPI._cmdProxy('disableCaching', {}); }
        map.print = function() { gmxAPI._cmdProxy('print', {}); }
        map.repaint = function() { gmxAPI._cmdProxy('repaint', {}); }
        map.moveTo = function(x, y, z) {
            var pos = {'x':x, 'y':y, 'z':z};
            if(gmxAPI.proxyType == 'leaflet' && map.needMove) {
                if(!pos.z) pos.z =  map.needMove.z || map.getZ();
                map.needMove = pos;
            }
            else {
                //setCurrPosition(null, {'currPosition': {'x':gmxAPI.merc_x(x), 'y':gmxAPI.merc_y(y), 'z':z}});
                map.needMove = null;
                gmxAPI._cmdProxy('moveTo', { 'attr': pos });
            }
        }
        map.slideTo = function(x, y, z) { gmxAPI._cmdProxy('slideTo', { 'attr': {'x':x, 'y':y, 'z':z} }); }
        map.freeze = function() { gmxAPI._cmdProxy('freeze', {}); }
        map.unfreeze = function() { gmxAPI._cmdProxy('unfreeze', {}); }
        map.setCursor = function(url, dx, dy) { gmxAPI._cmdProxy('setCursor', { 'attr': {'url':url, 'dx':dx, 'dy':dy} }); }
        map.clearCursor = function() { gmxAPI._cmdProxy('clearCursor', {}); }
        map.zoomBy = function(dz, useMouse) {
            gmxAPI._cmdProxy('zoomBy', { 'attr': {'dz':-dz, 'useMouse':useMouse} });
            gmxAPI._listeners.dispatchEvent('zoomBy', gmxAPI.map);   // Проверка map Listeners на zoomBy
        }
        map.getBestZ = function(minX, minY, maxX, maxY)
        {
            if ((minX == maxX) && (minY == maxY))
                return 17;
            return Math.max(0, 17 - Math.ceil(Math.log(Math.max(
                Math.abs(gmxAPI.merc_x(maxX) - gmxAPI.merc_x(minX))/gmxAPI.flashDiv.clientWidth,
                Math.abs(gmxAPI.merc_y(maxY) - gmxAPI.merc_y(minY))/gmxAPI.flashDiv.clientHeight
            ))/Math.log(2)));
        }

        var gplForm = false;
        map.loadObjects = function(url, callback)
        {
            var _hostname = gmxAPI.getAPIHostRoot() + "ApiSave.ashx?get=" + encodeURIComponent(url);
            sendCrossDomainJSONRequest(_hostname, function(response)
            {
                if(typeof(response) != 'object' || response['Status'] != 'ok') {
                    gmxAPI.addDebugWarnings({'_hostname': _hostname, 'url': url, 'Error': 'bad response'});
                    return;
                }
                var geometries = gmxAPI.parseGML(response['Result']);
                callback(geometries);
            })
        }
        map.saveObjects = function(geometries, fileName, format)
        {
            var inputName, inputText;
            if (!gplForm)
            {
                gplForm = document.createElement('<form>'),
                inputName = document.createElement('<input>'),
                inputText = document.createElement('<input>');
            }
            else
            {
                gplForm = document.getElementById('download_gpl_form'),
                inputName = gplForm.firstChild,
                inputText = gplForm.lastChild;
            }

            gplForm.setAttribute('method', 'post');
            var _hostname = gmxAPI.getAPIHostRoot();
            gplForm.setAttribute('action', _hostname + 'ApiSave.ashx');
            gplForm.style.display = 'none';
            inputName.value = fileName;
            inputName.setAttribute('name', 'name')
            if (!format)
                format = "gml";
            inputText.value = gmxAPI.createGML(geometries, format.toLowerCase());
            inputText.setAttribute('name', 'text')

            gplForm.appendChild(inputName);
            gplForm.appendChild(inputText);

            document.body.appendChild(gplForm);

            gplForm.submit();
        }

        map.moveToCoordinates = function(text, z)
        {
            return gmxAPI.parseCoordinates(text, function(x, y)
            {
                map.moveTo(x, y, z ? z : map.getZ());
            });
        }
        map.getMinZoom = function() {
            return (gmxAPI.proxyType === 'flash' ?
                (map.zoomControl ? map.zoomControl.getMinZoom() : 17)
                :
                gmxAPI._cmdProxy('getMinZoom')
            );
        }
        map.getMaxZoom = function() {
            return (gmxAPI.proxyType === 'flash' ?
                (map.zoomControl ? map.zoomControl.getMaxZoom() : 17)
                :
                gmxAPI._cmdProxy('getMaxZoom')
            );
        }
        map.zoomToExtent = function(minx, miny, maxx, maxy)
        {
            var x = gmxAPI.from_merc_x((gmxAPI.merc_x(minx) + gmxAPI.merc_x(maxx))/2),
                y = gmxAPI.from_merc_y((gmxAPI.merc_y(miny) + gmxAPI.merc_y(maxy))/2);
            var z = map.getBestZ(minx, miny, maxx, maxy);
            var maxZ = map.getMaxZoom();
            map.moveTo(x, y, (z > maxZ ? maxZ : z));
        }
        map.slideToExtent = function(minx, miny, maxx, maxy)
        {
            var x = gmxAPI.from_merc_x((gmxAPI.merc_x(minx) + gmxAPI.merc_x(maxx))/2),
                y = gmxAPI.from_merc_y((gmxAPI.merc_y(miny) + gmxAPI.merc_y(maxy))/2);
            var z = map.getBestZ(minx, miny, maxx, maxy);
            var maxZ = map.getMaxZoom();
            map.slideTo(x, y, (z > maxZ ? maxZ : z));
        }
        
        var tmp = [   // Для обратной совместимости - методы ранее были в MapObject
            'saveObjects', 'loadObjects', 'getBestZ', 'zoomBy', 'clearCursor', 'setCursor', 'unfreeze', 'freeze', 'slideTo', 'moveTo',
            'repaint', 'print', 'disableCaching', 'setQuality', 'trace', 'savePNG', 'sendPNG', 'moveToCoordinates', 'zoomToExtent', 'slideToExtent'
        ];
        for (var i=0; i<tmp.length; i++) gmxAPI.extendFMO(tmp[i], map[tmp[i]]);
        
        map.stopDragging = function() { gmxAPI._cmdProxy('stopDragging', { }); }
        map.isDragging = function() { return gmxAPI._cmdProxy('isDragging', { }); }
        map.resumeDragging = function() { gmxAPI._cmdProxy('resumeDragging', { }); }
        map.setCursorVisible = function(flag) { gmxAPI._cmdProxy('setCursorVisible', { 'attr': {'flag':flag} }); }
        map.getPosition = function() { gmxAPI.currPosition = gmxAPI._cmdProxy('getPosition', { }); return gmxAPI.currPosition; }
        map.getX = function() { return (map.needMove ? map.needMove['x'] : gmxAPI._cmdProxy('getX', {})); }
        map.getY = function() { return (map.needMove ? map.needMove['y'] : gmxAPI._cmdProxy('getY', {})); }
        map.getZ = function() { return (map.needMove ? map.needMove['z'] : (gmxAPI.currPosition ? gmxAPI.currPosition.z : gmxAPI._cmdProxy('getZ', {}))); }
        map.getMouseX = function() { return gmxAPI._cmdProxy('getMouseX', {}); }
        map.getMouseY = function() { return gmxAPI._cmdProxy('getMouseY', {}); }
        map.isKeyDown = function(code) { return gmxAPI._cmdProxy('isKeyDown', {'attr':{'code':code} }); }
        map.setExtent = function(x1, x2, y1, y2) { return gmxAPI._cmdProxy('setExtent', {'attr':{'x1':x1, 'x2':x2, 'y1':y1, 'y2':y2} }); }
        map.addMapWindow = function(callback) {
            var oID = gmxAPI._cmdProxy('addMapWindow', { 'attr': {'callbackName':function(z) { return callback(z); }} });
            return new gmxAPI._FMO(oID, {}, null);  // MapObject миникарты
        }
        
        map.width  = function() { return gmxAPI._div.clientWidth;  }
        map.height = function() { return gmxAPI._div.clientHeight; }

        map.getItemsFromExtent = function(x1, x2, y1, y2) {
            var arr = [];
            for (var i = 0; i < map.layers.length; i++) arr.push(map.layers[i].objectId);
            return gmxAPI._cmdProxy('getItemsFromExtent', { 'obj': this, 'attr':{'layers':arr, 'extent':{'x1':gmxAPI.merc_x(x1), 'x2':gmxAPI.merc_x(x2), 'y1':gmxAPI.merc_y(y1), 'y2':gmxAPI.merc_y(y2)}} });
        }

        map.getItemsFromPosition = function() {
            var arr = [];
            for (var i = 0; i < map.layers.length; i++) arr.push(map.layers[i].objectId);
            return gmxAPI._cmdProxy('getItemsFromExtent', { 'obj': this, 'attr':{'layers':arr} });
        }
        // Использование SharedObject
        map.setFlashLSO = function(data) { return gmxAPI._cmdProxy('setFlashLSO', {'obj': this, 'attr':data }); }

        map.baseLayersManager = new gmxAPI.BaseLayersManager(map);
        map.controlsManager = new gmxAPI.ControlsManager(map, gmxAPI._div);
        var params = gmxAPI.getURLParams().params;
        if(gmxAPI.proxyType === 'flash') params.gmxControls = 'controlsBase';
        map.controlsManager.setCurrent(params.gmxControls || window.gmxControls || 'controlsBase');
        gmxAPI._listeners.dispatchEvent('mapInit', null, map); // Глобальный Listeners

        var toolHandlers = {};
        var userHandlers = {};
        var updateMapHandler = function(eventName)
        {
            var h1 = toolHandlers[eventName];
            var h2 = userHandlers[eventName];
            gmxAPI._FMO.prototype.setHandler.call(map, eventName, h1 ? h1 : h2 ? h2 : null);
        }
        map.setHandler = function(eventName, callback)
        {
            userHandlers[eventName] = callback;
            updateMapHandler(eventName);
        }
        var setToolHandler = function(eventName, callback)
        {
            toolHandlers[eventName] = callback;
            updateMapHandler(eventName);
        }
        gmxAPI._setToolHandler = setToolHandler;

        var setToolHandlers = function(handlers)
        {
            for (var eventName in handlers)
                setToolHandler(eventName, handlers[eventName]);
        }

        map.getFeatures = function()
        {
            var callback, geometry, str = null;
            for (var i = 0; i < 3; i++)
            {
                var arg = arguments[i];
                if (typeof arg == 'function')
                    callback = arg;
                else if (typeof arg == 'string')
                    str = arg;
                else if (typeof arg == 'object')
                    geometry = arg;
            }
            var layerNames = arguments[3];
            if (!layerNames)
            {
                layerNames = [];
                for (var i = 0; i < map.layers.length; i++)
                {
                    var layer = map.layers[i];
                    if ((layer.properties.type == 'Vector') && layer.AllowSearch)
                        layerNames.push(layer.properties.name);
                }
            }
            if (layerNames.length == 0)
            {
                callback([]);
                return;
            }

            //var searchScript = "/SearchObject/SearchVector.ashx";
            var searchScript = "/VectorLayer/Search.ashx";
            var url = "http://" + map.layers[layerNames[0]].properties.hostName + searchScript;

            var attr, func;
            if(searchScript === "/VectorLayer/Search.ashx") {
                attr = {
                    'WrapStyle': 'message'
                    ,'page': 0
                    ,'pagesize': 100000
                    ,'geometry': true
                    ,'layer': layerNames.join(",")
                    ,'query': (str != null ? str : '')
                };
                
                func = function(searchReq) {
                    var ret = [];
                    if (searchReq.Status == 'ok')
                    {
                        var fields = searchReq.Result.fields;
                        var arr = searchReq.Result.values;
                        for (var i = 0, len = arr.length; i < len; i++)
                        {
                            var req = arr[i];
                            var item = {};
                            var prop = {};
                            for (var j = 0, len1 = req.length; j < len1; j++)
                            {
                                var fname = fields[j];
                                var it = req[j];
                                if (fname === 'geomixergeojson') {
                                    item.geometry = gmxAPI.from_merc_geometry(it);
                                } else {
                                    prop[fname] = it;
                                }
                            }
                            item.properties = prop;
                            ret.push(new gmxAPI._FlashMapFeature( 
                                item.geometry,
                                item.properties,
                                map.layers[layerNames]
                            ));
                        }
                    }      
                    callback(ret);
                };
                if (geometry) {
                    attr['border'] = JSON.stringify(gmxAPI.merc_geometry(geometry));
                }
            } else if(searchScript === "/SearchObject/SearchVector.ashx") {
                func = function(searchReq) {
                    var ret = [];
                    if (searchReq.Status == 'ok')
                    {
                        for (var i = 0; i < searchReq.Result.length; i++)
                        {
                            var req = searchReq.Result[i];
                            if (!ret[req.name])
                                ret[req.name] = [];
                            for (var j = 0; j < req.SearchResult.length; j++)
                            {
                                var item = req.SearchResult[j];
                                ret.push(new gmxAPI._FlashMapFeature( 
                                    gmxAPI.from_merc_geometry(item.geometry),
                                    item.properties,
                                    map.layers[req.name]
                                ));
                            }
                        }
                    }      
                    callback(ret);
                };
                attr = {
                    'WrapStyle': 'message'
                    ,'MapName': map.layers[layerNames[0]].properties.mapName
                    ,'LayerNames': layerNames.join(",")
                    ,'SearchString': (str != null ? encodeURIComponent(str) : '')
                };
                if (geometry) {
                    attr['Border'] = JSON.stringify(gmxAPI.merc_geometry(geometry));
                }
            }
            gmxAPI.sendCrossDomainPostRequest(url, attr, func);
        }

        map.geoSearchAPIRoot = typeof window.searchAddressHost !== 'undefined' ? window.searchAddressHost : gmxAPI.getAPIHostRoot();
        map.sendSearchRequest = function(str, callback)
        {  
            var key = window.KOSMOSNIMKI_SESSION_KEY;
            if (key==null || key == "INVALID")
                key = false;
            sendCrossDomainJSONRequest(
                map.geoSearchAPIRoot + "SearchObject/SearchAddress.ashx?SearchString=" + escape(str) + (key ? ("&key=" + encodeURIComponent(key)) : ""),
                function(res)
                {
                    var ret = {};
                    if (res.Status == 'ok')
                    {
                        for (var i = 0; i < res.Result.length; i++)
                        {
                            var name = res.Result[i].name;
                            if (!ret[name])
                                ret[name] = res.Result[i].SearchResult;
                        }
                    }        
                    callback(ret);
                }
            );
        }
        map.setMinMaxZoom = function(z1, z2) {
            if(gmxAPI.proxyType === 'flash' && gmxAPI.map.zoomControl) gmxAPI.map.zoomControl.setMinMaxZoom(z1, z2);
            return gmxAPI._cmdProxy('setMinMaxZoom', {'attr':{'z1':z1, 'z2':z2} });
        }
        map.setZoomBounds = map.setMinMaxZoom;

        map.grid = {
            setVisible: function(flag) { gmxAPI._cmdProxy('setGridVisible', { 'attr': flag }) }
            ,getVisibility: function() { return gmxAPI._cmdProxy('getGridVisibility', {}) }
            ,setOneDegree: function(flag) { gmxAPI._cmdProxy('setOneDegree', { 'attr': flag }) }
        };
        map.setMinMaxZoom(1, 17);

        if (gmxAPI._drawing) {
            map.drawing = gmxAPI._drawing;
        } else {
            map.drawing = {
                'setHandlers': function() { return false; }
                ,'forEachObject': function() { return false; }
            };
        }

        map.removeContextMenuItem = function(itemId) {
            return gmxAPI._cmdProxy('removeContextMenuItem', { 'attr': {
                id: itemId
            }});
        };
        map.addContextMenuItem = function(text, callback, index) {
            return gmxAPI._cmdProxy('addContextMenuItem', { 'attr': {
                text: text,
                index: index,
                func: function(x, y)
                    {
                        if(gmxAPI.proxyType === 'flash') {
                            x = gmxAPI.from_merc_x(x);
                            y = gmxAPI.from_merc_y(y);
                        }
                        callback(x, y);
                    }
                }
            });
        };

        if (gmxAPI._drawing) {
            map.addContextMenuItem(
                gmxAPI.KOSMOSNIMKI_LOCALIZED("Поставить маркер", "Add marker"),
                function(x, y)
                {
                    map.drawing.addObject({type: "POINT", coordinates: [x, y]});
                }
            );
        }

        var haveOSM = false;

        map.addLayers = function(layers, notMoveFlag, notVisible)
        {
            var reverse = false;
            if(layers.properties.name === gmxAPI.currentMapName) {  // Это основная карта
                if(layers.properties.MinZoom) { // установлен MinZoom карты
                    gmxAPI.mapMinZoom = layers.properties.MinZoom;
                }
                if(layers.properties.MaxZoom) { // установлен MaxZoom карты
                    gmxAPI.mapMaxZoom = layers.properties.MaxZoom;
                    if(gmxAPI.mapMinZoom > gmxAPI.mapMaxZoom) { // mapMinZoom не больше MaxZoom
                        gmxAPI.mapMinZoom = 1;
                    }
                }
            } else if(layers.properties.name === gmxAPI.kosmosnimki_API) {
                reverse = true;
            }
            
            var mapBounds = gmxAPI.getBounds();
            var minLayerZoom = 20;
            forEachLayer(layers, function(layer, isVisible) {
                var visible = (layer.properties.visible ? true : isVisible);
                var lObj = map.addLayer(layer, visible, true);
                if(reverse) {
                    map.layers.pop();
                    map.layers.unshift(lObj);
                }

                if('LayerVersion' in layer.properties && gmxAPI._layersVersion) {
                    gmxAPI._layersVersion.chkVersionLayers(layers, layer);
                }
                if(visible && lObj.mercGeometry) mapBounds.update(lObj.mercGeometry.coordinates);
                var arr = layer.properties.styles || [];
                for (var i = 0; i < arr.length; i++) {
                    var mm = arr[i].MinZoom;
                    minLayerZoom = Math.min(minLayerZoom, mm);
                }
                if (layer.properties.type == "Raster" && layer.properties.MaxZoom > gmxAPI.maxRasterZoom)
                    gmxAPI.maxRasterZoom = layer.properties.MaxZoom;
            }, notVisible);
            //if (layers.properties.UseOpenStreetMap && !haveOSM)
            var baseLayer = map.baseLayersManager.get('OSM');
            //if (!baseLayer !haveOSM)
            if (!baseLayer)
            {
                var o = map.addObject();
                //o.setVisible(false);
                o.bringToBottom();
                //o.setAsBaseLayer("OSM");
                baseLayer = map.baseLayersManager.add('OSM', {});
                    //map.baseLayersManager.add('OSM', {isVisible:false});
                baseLayer.addLayer(o);
                o.setOSMTiles();
                haveOSM = true;
                o.setVisible(false);
/*
                if('miniMap' in map) {
                    var miniOSM = map.miniMap.addObject();
                    miniOSM.setVisible(false);
                    miniOSM.setOSMTiles();
                    miniOSM.setAsBaseLayer("OSM");
                }
*/
            }

            if(gmxAPI.initParams && gmxAPI.initParams['center']) {   // есть переопределение центра карты
                if('x' in gmxAPI.initParams['center']) map.needMove['x'] = gmxAPI.initParams['center']['x'];
                if('y' in gmxAPI.initParams['center']) map.needMove['y'] = gmxAPI.initParams['center']['y'];
                if('z' in gmxAPI.initParams['center']) map.needMove['z'] = gmxAPI.initParams['center']['z'];
                //delete gmxAPI.initParams['center'];
            } else {
                if (typeof(layers.properties.DefaultLat) === 'number'
                    || typeof(layers.properties.DefaultLong) === 'number'
                    || typeof(layers.properties.DefaultZoom) === 'number') {
                    map.needMove = getDefaultPos(layers.properties);
                    setCurrPosition(null, {'currPosition': {
                        'x': gmxAPI.merc_x(map.needMove.x),
                        'y': gmxAPI.merc_y(map.needMove.y),
                        'z': map.needMove.z
                    }});
                } else if(!notMoveFlag && mapBounds && layers.properties.name !== gmxAPI.kosmosnimki_API)
                {
                    var z = map.getBestZ(gmxAPI.from_merc_x(mapBounds.minX), gmxAPI.from_merc_y(mapBounds.minY), gmxAPI.from_merc_x(mapBounds.maxX), gmxAPI.from_merc_y(mapBounds.maxY));
                    if (minLayerZoom != 20)
                        z = Math.max(z, minLayerZoom);
                    if(z > 0)  {
                        var pos = {
                            'x': (mapBounds.minX + mapBounds.maxX)/2,
                            'y': (mapBounds.minY + mapBounds.maxY)/2,
                            'z': z
                        };
                        map.needMove = {
                            'x': gmxAPI.from_merc_x(pos['x']),
                            'y': gmxAPI.from_merc_y(pos['y']),
                            'z': z
                        };
                        setCurrPosition(null, {'currPosition': pos});
                    }
                }
            }
            if (layers.properties.ViewUrl && !window.suppressDefaultPermalink)
            {
                var result = (/permalink=([a-zA-Z0-9]+)/g).exec(layers.properties.ViewUrl);
                if (result)
                {
                    var permalink = result[1];
                    var callbackName = gmxAPI.uniqueGlobalName(function(obj)
                    {
                        if (obj.position) {
                            var pos = {
                                'x': obj.position.x,
                                'y': obj.position.y,
                                'z': 17 - obj.position.z
                            };
                            map.needMove = {
                                'x': gmxAPI.from_merc_x(pos['x']),
                                'y': gmxAPI.from_merc_y(pos['y']),
                                'z': pos['z']
                            };
                            setCurrPosition(null, {'currPosition': pos});
                        }
                        if (obj.drawnObjects && gmxAPI._drawing)
                            for (var i =0; i < obj.drawnObjects.length; i++)
                            {
                                var o = obj.drawnObjects[i];
                                map.drawing.addObject(gmxAPI.from_merc_geometry(o.geometry), o.properties);
                            }
                    });
                    var script = document.createElement("script");
                    script.setAttribute("charset", "UTF-8");
                    script.setAttribute("src", "http://" + layers.properties.hostName + "/TinyReference.ashx?id=" + permalink + "&CallbackName=" + callbackName + "&" + Math.random());
                    document.getElementsByTagName("head").item(0).appendChild(script);
                }
            }
            if(layers.properties.name === gmxAPI.currentMapName) {  // Это основная карта
                var minX = Number(layers.properties.MinViewX);
                var maxX = Number(layers.properties.MaxViewX);
                var minY = Number(layers.properties.MinViewY);
                var maxY = Number(layers.properties.MaxViewY);
                if(minX !== 0 || maxX !== 0 || minY !== 0 || maxY !== 0) {
                    if(minX === 0 && maxX === 0) minX = -180, maxX = 180;
                    if(minY === 0 && maxY === 0) minY = -85, maxY = 85;
                    map.setExtent(minX, maxX, minY, maxY);
                }
                if (gmxAPI.maxRasterZoom > 17 || gmxAPI.mapMinZoom || gmxAPI.mapMaxZoom) {
                    map.setMinMaxZoom(gmxAPI.mapMinZoom || gmxAPI.defaultMinZoom, gmxAPI.mapMaxZoom || gmxAPI.maxRasterZoom || gmxAPI.defaultMaxZoom);
                }
            }

            if (layers.properties.Copyright)
            {
                var obj = map.addObject();
                obj.setCopyright(layers.properties.Copyright);
            }
            if (layers.properties.MiniMapZoomDelta) {
                gmxAPI.miniMapZoomDelta = layers.properties.MiniMapZoomDelta;
            }
        }

        map.getCenter = function(mgeo)
        {
            if(!mgeo) mgeo = map.getScreenGeometry();
            return gmxAPI.geoCenter(mgeo);
        }

        map.getScreenGeometry = function()
        {
            var e = map.getVisibleExtent();
            return {
                type: "POLYGON",
                coordinates: [[[e.minX, e.minY], [e.minX, e.maxY], [e.maxX, e.maxY], [e.maxX, e.minY], [e.minX, e.minY]]]
            };
        }
        map.getVisibleExtent = function()
        {
            var currPos = gmxAPI.currPosition || map.getPosition();
            if(currPos['latlng'] && currPos['latlng']['extent']) {
                return currPos['latlng']['extent'];
            }

            var ww = 2 * gmxAPI.worldWidthMerc;
            var x = currPos['x'] + ww;
            x = x % ww;
            if(x > gmxAPI.worldWidthMerc) x -= ww;
            if(x < -gmxAPI.worldWidthMerc) x += ww;

            var y = currPos['y'];
            var scale = gmxAPI.getScale(currPos['z']);

            var w2 = scale * gmxAPI._div.clientWidth/2;
            var h2 = scale * gmxAPI._div.clientHeight/2;
            var out = {
                minX: gmxAPI.from_merc_x(x - w2),
                minY: gmxAPI.from_merc_y(y - h2),
                maxX: gmxAPI.from_merc_x(x + w2),
                maxY: gmxAPI.from_merc_y(y + h2)
            };
            return out;
        }
        var sunscreen = map.addObject();
        gmxAPI._sunscreen = sunscreen;

        var checkMapSize = function()
        {
            gmxAPI._updatePosition();
            gmxAPI._listeners.dispatchEvent('onResizeMap', map);
        };
        if(gmxAPI.proxyType === 'flash') {
            sunscreen.setStyle({ fill: { color: 0xffffff, opacity: 1 } });
            sunscreen.setRectangle(-180, -85, 180, 85);
            sunscreen.setVisible(false);
            sunscreen.addListener("onResize", function()
            {
                checkMapSize();
                //gmxAPI._updatePosition();
                //gmxAPI._listeners.dispatchEvent('onResizeMap', map);
            });
        
            // if('_miniMapInit' in gmxAPI) {
                // gmxAPI._miniMapInit(gmxAPI._div);
            // }
            
        } else if(gmxAPI.proxyType === 'leaflet') {
            checkMapSize = function()
            {
                return gmxAPI._cmdProxy('checkMapSize');
            }
        }
        map.checkMapSize = checkMapSize;

        var setCurrPosition = function(ev, attr)
        {
            var currPos = (attr && attr.currPosition ? attr.currPosition : map.getPosition());
            
            var eventFlag = (gmxAPI.currPosition && currPos['x'] == gmxAPI.currPosition['x']
                && currPos['y'] == gmxAPI.currPosition['y']
                && currPos['z'] == gmxAPI.currPosition['z']
                ? false : true);

            currPos['latlng'] = {
                'x': gmxAPI.from_merc_x(currPos['x']),
                'y': gmxAPI.from_merc_y(currPos['y']),
                'mouseX': gmxAPI.from_merc_x(currPos['mouseX']),
                'mouseY': gmxAPI.from_merc_y(currPos['mouseY'])
            };
            if(currPos['extent']) {
                if(currPos['extent']['minx'] != 0 || currPos['extent']['maxx'] != 0) {
                    currPos['latlng']['extent'] = {
                        minX: gmxAPI.from_merc_x(currPos['extent']['minX'] || currPos['extent']['minx']),
                        minY: gmxAPI.from_merc_y(currPos['extent']['minY'] || currPos['extent']['miny']),
                        maxX: gmxAPI.from_merc_x(currPos['extent']['maxX'] || currPos['extent']['maxx']),
                        maxY: gmxAPI.from_merc_y(currPos['extent']['maxY'] || currPos['extent']['maxy'])
                    };
                }
            }

            gmxAPI.currPosition = currPos;
            return eventFlag;
        }

        var updatePosition = function(ev, attr)
        {
            var eventFlag = setCurrPosition(ev, attr);
            if(eventFlag) {      // Если позиция карты изменилась - формируем событие positionChanged
                var currPos = gmxAPI.currPosition;
                var z = currPos['z'];

                /** Пользовательское событие positionChanged
                * @function callback
                * @ignore
                * @param {object} атрибуты прослушивателя
                */
                if ('stateListeners' in map && 'positionChanged' in map.stateListeners) {
                    var pattr = {
                        'currZ': z,
                        'currX': currPos['latlng']['x'],
                        'currY': currPos['latlng']['y'],
                        'div': gmxAPI._locationTitleDiv,
                        'screenGeometry': map.getScreenGeometry(),
                        'properties': map.properties
                    };
                    gmxAPI._listeners.dispatchEvent('positionChanged', map, pattr);
                }
            }
        }
        gmxAPI._updatePosition = updatePosition;

        var eventMapObject = map.addObject();
        eventMapObject.setHandler("onMove", updatePosition);
        // onMoveBegin - перед onMove
        // onMoveEnd - после onMove

        //updatePosition();
        setCurrPosition();

        map.setBackgroundColor = function(color)
        {
            map.backgroundColor = color;
            gmxAPI._cmdProxy('setBackgroundColor', { 'obj': map, 'attr':color });
            var isWhite = (0xff & (color >> 16)) > 80;
            var htmlColor = isWhite ? "black" : "white";
            gmxAPI._listeners.dispatchEvent('onChangeBackgroundColor', map, htmlColor);
        }
        
        map.setBackgroundColor(gmxAPI.proxyType === 'leaflet' ? 0xffffff : 0x000001);
        map.defaultHostName = (layers && layers.properties ? layers.properties.hostName : '');
        map.addLayers(layers, false, false);
        
        if(!layers.properties.UseKosmosnimkiAPI) map.moveTo(map.needMove.x, map.needMove.y, map.needMove.z);
        
        if(!map.needSetMode && haveOSM) {   // если нигде не устанавливалась текущая подложка и есть OSM
            if(!gmxAPI._baseLayersArr || gmxAPI._baseLayersHash['OSM']) map.setMode('OSM');
        }

        var startDrag = function(object, dragCallback, upCallback)
        {
            map.freeze();
            sunscreen.setVisible(true);
            setToolHandlers({
                onMouseMove: function(o)
                {
                    var currPosition = map.getPosition();
                    var mouseX = gmxAPI.from_merc_x(currPosition['mouseX']);
                    var mouseY = gmxAPI.from_merc_y(currPosition['mouseY']);
                    dragCallback(mouseX, mouseY, o);
                },
                onMouseUp: function()
                {
                    updatePosition();
                    gmxAPI._stopDrag();
                    if (upCallback)
                        upCallback();
                }
            });
        }
        gmxAPI._startDrag = startDrag;

        var stopDrag = function()
        {
            setToolHandlers({ onMouseMove: null, onMouseUp: null });
            map.unfreeze();
            sunscreen.setVisible(false);
        }
        gmxAPI._stopDrag = stopDrag;

        gmxAPI.extendFMO('startDrag', function(dragCallback, upCallback)
        {
            gmxAPI._startDrag(this, dragCallback, upCallback);
        });

        if(gmxAPI.proxyType === 'leaflet') {
            gmxAPI.extendFMO('enableDragging', function(dragCallback, downCallback, upCallback, options)
            {
                var attr = { 'drag': dragCallback, 'dragstart':downCallback, 'dragend':upCallback, options: options };
                gmxAPI._cmdProxy('enableDragging', { 'obj': this, 'attr':attr });
            });
            gmxAPI.extendFMO('disableDragging', function()
            {
                gmxAPI._cmdProxy('disableDragging', { 'obj': this });
            });
            gmxAPI._FMO.prototype.addDragHandlers = gmxAPI._FMO.prototype.enableDragging;
            gmxAPI._FMO.prototype.removeDragHandlers = gmxAPI._FMO.prototype.disableDragging;
        } else {
            gmxAPI.extendFMO('enableDragging', function(dragCallback, downCallback, upCallback)
            {
                var object = this;
                var mouseDownHandler = function(o)
                {
                    if (downCallback) {
                        var currPosition = map.getPosition();
                        var mouseX = null;
                        var mouseY = null;
                        if(currPosition['latlng'] && 'mouseX' in currPosition['latlng']) {
                            mouseX = currPosition['latlng']['mouseX'];
                            mouseY = currPosition['latlng']['mouseY'];
                        } else {
                            mouseX = gmxAPI.from_merc_x(currPosition['mouseX']);
                            mouseY = gmxAPI.from_merc_y(currPosition['mouseY']);
                        }
                        downCallback(mouseX, mouseY, o);
                    }
                    gmxAPI._startDrag(object, dragCallback, upCallback);
                }
                if (object == map) {
                    setToolHandler("onMouseDown", mouseDownHandler);
                } else {
                    object.setHandler("onMouseDown", mouseDownHandler);
                }
            });

            gmxAPI.extendFMO('disableDragging', function(dragCallback, downCallback, upCallback)
            {
                gmxAPI._FMO.prototype.removeHandler.call(map, 'onMouseMove');
                gmxAPI._FMO.prototype.removeHandler.call(map, 'onMouseUp');
                gmxAPI._FMO.prototype.removeHandler.call(map, 'onMouseDown');
            });
        }

        window.kosmosnimkiBeginZoom = function() 
        {
            if (gmxAPI._drawing && !gmxAPI._drawing.tools['move'].isActive)
                return false;
            gmxAPI.map.freeze();
            sunscreen.setVisible(true);
            var x1 = gmxAPI.map.getMouseX();
            var y1 = gmxAPI.map.getMouseY();
            var x2, y2;
            var rect = gmxAPI.map.addObject();
            rect.setStyle({ outline: { color: 0xa0a0a0, thickness: 1, opacity: 70 } });
            setToolHandlers({
                onMouseMove: function()
                {
                    x2 = gmxAPI.map.getMouseX();
                    y2 = gmxAPI.map.getMouseY();
                    rect.setRectangle(x1, y1, x2, y2);
                },
                onMouseUp: function()
                {
                    setToolHandlers({ onMouseMove: null, onMouseUp: null });
                    gmxAPI.map.unfreeze();
                    sunscreen.setVisible(false);
                    var d = 10*gmxAPI.getScale(gmxAPI.map.getZ());
                    if (!x1 || !x2 || !y1 || !y2 || ((Math.abs(gmxAPI.merc_x(x1) - gmxAPI.merc_x(x2)) < d) && (Math.abs(gmxAPI.merc_y(y1) - gmxAPI.merc_y(y2)) < d)))
                        gmxAPI.map.zoomBy(1, true);
                    else
                        gmxAPI.map.zoomToExtent(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
                    rect.remove();
                }
            });
            return true;
        }

        if(gmxAPI.proxyType === 'flash') {
            var onWheel = function(e)
            {
                if (!e)
                    e = window.event;

                var inMap = false;
                var elem = gmxAPI.compatTarget(e);
                while(elem != null) 
                {
                    if (elem == gmxAPI._div)
                    {
                                inMap = true;
                                break;
                    }
                    elem = elem.parentNode;
                }
        
                if (!inMap)
                    return;

                var delta = 0;
                if (e.wheelDelta) 
                    delta = e.wheelDelta/120; 
                else if (e.detail) 
                    delta = -e.detail/3;

                if (delta)
                    gmxAPI.map.zoomBy(delta > 0 ? 1 : -1, true);

                if (e.preventDefault)
                {
                    e.stopPropagation();
                    e.preventDefault();
                }
                else 
                {
                    e.returnValue = false;
                    e.cancelBubble = true;
                }
            }

            var addHandler = function(div, eventName, handler)
            {
                if (div.attachEvent) 
                    div.attachEvent("on" + eventName, handler); 
                if (div.addEventListener) 
                    div.addEventListener(eventName, handler, false);
            }

            addHandler(window, "mousewheel", onWheel);
            addHandler(document, "mousewheel", onWheel);
            if (window.addEventListener) window.addEventListener('DOMMouseScroll', onWheel, false);
        }
        map.ToolsContainer = gmxAPI._ToolsContainer;
        gmxAPI._listeners.dispatchEvent('mapCreated', null, map); // Глобальный Listeners
        // Deferred методы
        var deferred = function() {
            console.log('Deferred function: ', arguments.callee);
        }
        map.setCoordinatesAlign = deferred; // Позиционирование масштабной шкалы (tr tl br bl)
        map.setCopyrightAlign = deferred;  // Позиционирование Copyright (tr tl br bl bc)
        map.setGeomixerLinkAlign = deferred; // Позиционирование GeomixerLink (tr tl br bl)
        return map;
    }
    //расширяем namespace
    gmxAPI._addNewMap = addNewMap; // Создать map обьект
})();

;/* ======================================================================
    JSON.js
   ====================================================================== */

//Поддержка JSON parser
if (!this.JSON) {
    JSON = {};
	(function () {

		function f(n) {
			// Format integers to have at least two digits.
			return n < 10 ? '0' + n : n;
		}

		if (typeof Date.prototype.toJSON !== 'function') {

			Date.prototype.toJSON = function (key) {

				return this.getUTCFullYear()   + '-' +
					 f(this.getUTCMonth() + 1) + '-' +
					 f(this.getUTCDate())      + 'T' +
					 f(this.getUTCHours())     + ':' +
					 f(this.getUTCMinutes())   + ':' +
					 f(this.getUTCSeconds())   + 'Z';
			};

			String.prototype.toJSON =
			Number.prototype.toJSON =
			Boolean.prototype.toJSON = function (key) {
				return this.valueOf();
			};
		}

		var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
			escapeable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
			gap,
			indent,
			meta = {    // table of character substitutions
				'\b': '\\b',
				'\t': '\\t',
				'\n': '\\n',
				'\f': '\\f',
				'\r': '\\r',
				'"' : '\\"',
				'\\': '\\\\'
			},
			rep;


		function quote(string) {

			escapeable.lastIndex = 0;
			return escapeable.test(string) ?
				'"' + string.replace(escapeable, function (a) {
					var c = meta[a];
					if (typeof c === 'string') {
						return c;
					}
					return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
				}) + '"' :
				'"' + string + '"';
		}


		function str(key, holder) {

			var i,          // The loop counter.
				k,          // The member key.
				v,          // The member value.
				length,
				mind = gap,
				partial,
				value = holder[key];

			if (value && typeof value === 'object' &&
					typeof value.toJSON === 'function') {
				value = value.toJSON(key);
			}

			if (typeof rep === 'function') {
				value = rep.call(holder, key, value);
			}

			switch (typeof value) {
			case 'string':
				return quote(value);

			case 'number':

				return isFinite(value) ? String(value) : 'null';

			case 'boolean':
			case 'null':

				return String(value);

			case 'object':

				if (!value) {
					return 'null';
				}

				gap += indent;
				partial = [];

				if (typeof value.length === 'number' &&
						!value.propertyIsEnumerable('length')) {

					length = value.length;
					for (i = 0; i < length; i += 1) {
						partial[i] = str(i, value) || 'null';
					}

					v = partial.length === 0 ? '[]' :
						gap ? '[\n' + gap +
								partial.join(',\n' + gap) + '\n' +
									mind + ']' :
							  '[' + partial.join(',') + ']';
					gap = mind;
					return v;
				}

				if (rep && typeof rep === 'object') {
					length = rep.length;
					for (i = 0; i < length; i += 1) {
						k = rep[i];
						if (typeof k === 'string') {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				} else {

					for (k in value) {
						if (Object.hasOwnProperty.call(value, k)) {
							v = str(k, value);
							if (v) {
								partial.push(quote(k) + (gap ? ': ' : ':') + v);
							}
						}
					}
				}

				v = partial.length === 0 ? '{}' :
					gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
							mind + '}' : '{' + partial.join(',') + '}';
				gap = mind;
				return v;
			}
		}

		if (typeof JSON.stringify !== 'function') {
			JSON.stringify = function (value, replacer, space) {

				var i;
				gap = '';
				indent = '';

				if (typeof space === 'number') {
					for (i = 0; i < space; i += 1) {
						indent += ' ';
					}

				} else if (typeof space === 'string') {
					indent = space;
				}

				rep = replacer;
				if (replacer && typeof replacer !== 'function' &&
						(typeof replacer !== 'object' ||
						 typeof replacer.length !== 'number')) {
					throw new Error('JSON.stringify');
				}

				return str('', {'': value});
			};
		}

		if (typeof JSON.parse !== 'function') {
			JSON.parse = function (text, reviver) {

				var j;

				function walk(holder, key) {

					var k, v, value = holder[key];
					if (value && typeof value === 'object') {
						for (k in value) {
							if (Object.hasOwnProperty.call(value, k)) {
								v = walk(value, k);
								if (v !== undefined) {
									value[k] = v;
								} else {
									delete value[k];
								}
							}
						}
					}
					return reviver.call(holder, key, value);
				}

				cx.lastIndex = 0;
				if (cx.test(text)) {
					text = text.replace(cx, function (a) {
						return '\\u' +
							('0000' + a.charCodeAt(0).toString(16)).slice(-4);
					});
				}

				if (/^[\],:{}\s]*$/.
	test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@').
	replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
	replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

					j = eval('(' + text + ')');

					return typeof reviver === 'function' ?
						walk({'': j}, '') : j;
				}

				throw new SyntaxError('JSON.parse');
			};
		}
	})();
}
;/* ======================================================================
    ACPrintManager.js
   ====================================================================== */

//Поддержка Печати
(function()
{
	/**
	 * Class for working with browser printing
	 * @see http://www.anychart.com/blog/projects/acprintmanagerlibrary/
	 * @version 0.1
	 * @author Alex Batsuev (alex(at)sibental(dot)com)
	 */
	var ACPrintManager = function() {}

	ACPrintManager.isIE = function() {
		return gmxAPI.isIE;
	}

	ACPrintManager.initIE = function(objId) {
		var obj = document.getElementById(objId);
		if (obj == null) return;
		if (obj.onBeforePrint == undefined || obj.onAfterPrint == undefined) return;
		
		window.attachEvent("onbeforeprint",function(e) {
			
			obj.setAttribute("tmpW",obj.width);
			obj.setAttribute("tmpH",obj.height);
			
			var size = ACPrintManager.getContentSize(obj);
			
			obj.width = size.width;
			obj.height = size.height;
			
			obj.onBeforePrint();
			
			if (obj.getAttribute("tmpW").indexOf("%") != -1 ||
				obj.getAttribute("tmpH").indexOf("%") != -1) {
				//ie percent width or height hack
				obj.focus();
			}
		});
		window.attachEvent("onafterprint",function() {
			obj.onAfterPrint();
			obj.width = obj.getAttribute("tmpW");
			obj.height = obj.getAttribute("tmpH");
		});
	} 

	ACPrintManager.initFF = function(objId, imgData) {

		if (gmxAPI.isIE)
			return;

		var obj = document.getElementById(objId);
		if (obj == null && document.embeds != null) obj = document.embeds[objId];
		if (obj == null) return;
		
		//step #1: get parent node
		var parent = obj.parentNode;
		if (parent == null) return;
		
		//step #2: get header
		var head = document.getElementsByTagName('head');
		head = ((head.length != 1) ? null : head[0]);
		
		//step #3: write normal css rule		
		var style = document.createElement('style');
		style.setAttribute('type','text/css');
		style.setAttribute('media','screen');
		
		var size = ACPrintManager.getContentSize(obj);
		
		var imgDescriptor = 'img#'+objId+'_screen';
		var imgRule = "width: "+size.width+";\n"+
					  "height: "+size.height+";\n"+
					  "padding: 0;\n"+
					  "margin: 0;\n"+
					  "border: 0;\n"+
					  "display: none;";
		style.appendChild(document.createTextNode(imgDescriptor + '{' + imgRule + "}\n"));
		//add style to head
		head.appendChild(style);

		//step #4: write print css rule
		style = document.createElement('style');
		style.setAttribute('type','text/css');
		style.setAttribute('media','print');
		
		//write image style
		imgDescriptor = 'img#'+objId+'_screen';
		imgRule = 'display: block;';
		
		style.appendChild(document.createTextNode(imgDescriptor + '{' + imgRule + '}'));
		
		//write object style
		var objDescriptor = 'embed#'+objId;
		var objRule = 'display: none;';
		style.appendChild(document.createTextNode(objDescriptor + '{' + objRule + '}'));
		
		//add style to head
		head.appendChild(style);

		//step #5: get image
		var needAppend = false;
		var img = document.getElementById('img');
		if (img == null) {
			img = document.createElement('img');
			needAppend = true;
		}
		
		img.src = 'data:image/png;base64,'+imgData;
		img.setAttribute('id',objId+"_screen");
		if (needAppend)
			parent.appendChild(img);
	}

	ACPrintManager.getContentSize = function(obj) {
		var size = {};
		size.width = obj.width;
		size.height = obj.height;
		if (obj.getWidth != undefined) size.width = obj.getWidth()+'px';
		if (obj.getHeight != undefined) size.height = obj.getHeight()+'px';
		return size;
	}
    //расширяем namespace
    window.ACPrintManager = 
    gmxAPI.ACPrintManager = ACPrintManager;
})();
;/* ======================================================================
    wms.js
   ====================================================================== */

//Поддержка WMS
(function()
{
    var wmsProjections = ['EPSG:3395', 'EPSG:4326', 'EPSG:41001'];	// типы проекций
    
    /**
     * Возвращает описание WMS-слоёв от XML, которую вернул сервер на запрос GetCapabilities
     * @memberOf gmxAPI
     * @ignore
     * @returns {Array} - массив объектов с описанием слоёв
    */
    var parseWMSCapabilities = function(response)
	{
        var supportedVersions = {'1.1.1': true, '1.3.0': true};
        var SRSTagName = {'1.1.1': 'SRS', '1.3.0': 'CRS'};
        var BBOXTagName = {'1.1.1': 'LatLonBoundingBox', '1.3.0': 'EX_GeographicBoundingBox'};
		var serviceLayers = [],
			strResp = response.replace(/[\t\n\r]/g, ' '),
			strResp = strResp.replace(/\s+/g, ' '),
            xml = gmxAPI.parseXML(response),
            version = xml.getElementsByTagName('WMS_Capabilities')[0].getAttribute('version'),
			layersXML = xml.getElementsByTagName('Layer');
		
        if (!(version in supportedVersions)) {
            return [];
        }
        
		for (var i = 0; i < layersXML.length; i++)
		{
			var layer = {version: version},
				name = layersXML[i].getElementsByTagName('Name'),
				title = layersXML[i].getElementsByTagName('Title'),
				bbox = layersXML[i].getElementsByTagName(BBOXTagName[version]),
				srs = layersXML[i].getElementsByTagName(SRSTagName[version]);
			
            if (srs.length)
            {
                layer.srs = null; 
                for (var si = 0; si < srs.length; si++)
                {
                    var curSrs = gmxAPI.strip(gmxAPI.getTextContent(srs[si]))
                    
                    if (gmxAPI.valueInArray(wmsProjections, curSrs))
                    {
                        layer.srs = curSrs;
                        break;
                    }
                }
                if (!layer.srs) continue;
            }
			else
                layer.srs = wmsProjections[0];
                
				
			
			if (name.length)
				layer.name = gmxAPI.getTextContent(name[0]);
			
			if (bbox.length)
			{
                if (version == '1.1.1') {
                    layer.bbox = 
                    {
                        minx: Number(bbox[0].getAttribute('minx')),
                        miny: Number(bbox[0].getAttribute('miny')),
                        maxx: Number(bbox[0].getAttribute('maxx')),
                        maxy: Number(bbox[0].getAttribute('maxy'))
                    };
                } else {
                    layer.bbox = 
                    {
                        minx: Number(gmxAPI.getTextContent(bbox[0].getElementsByTagName('westBoundLongitude')[0])),
                        miny: Number(gmxAPI.getTextContent(bbox[0].getElementsByTagName('southBoundLatitude')[0])),
                        maxx: Number(gmxAPI.getTextContent(bbox[0].getElementsByTagName('eastBoundLongitude')[0])),
                        maxy: Number(gmxAPI.getTextContent(bbox[0].getElementsByTagName('northBoundLatitude')[0]))
                    };
                }
			}
			
			if (title.length)
				layer.title = gmxAPI.getTextContent(title[0]);
			
			if (layer.name)
				serviceLayers.push(layer);
		}
		
		return serviceLayers;
	}
    
    /** Формирует URL картинки, который можно использовать для получения WMS слоя для данного положения карты
     * @memberOf gmxAPI
     * @ignore
     * @property {String} url - WMS ссылка.
     * @property {object} props - атрибуты.
     * @property {String} props.srs - тип проекции.
     * @property {String} props.version - версия.
     * @property {String} props.name - Идентификатор слоя.
     * @property {object} props.bbox - ограничение по bounds(в географических координатах).
     * @property {object} requestProperties - атрибуты формата результирующего image.
     * @property {String} requestProperties.format - тип (по умолчанию 'image/jpeg').
     * @property {String} requestProperties.transparent - прозрачность подложки ('TRUE'/'FALSE' по умолчанию 'FALSE').
     * @returns {object} - {url: String, bounds: {Extent}}. bounds в географических координатах.
    */
    var getWMSMapURL = function(url, props, requestProperties)
    {
        var CRSParam = {'1.1.1': 'SRS', '1.3.0': 'CRS'};
        
        requestProperties = requestProperties || {};

        var extend = gmxAPI.map.getVisibleExtent();
        
        console.log('visible', extend);

        var miny = Math.max(extend.minY, -90);
        var maxy = Math.min(extend.maxY, 90);
        var minx = Math.max(extend.minX, -180);
        var maxx = Math.min(extend.maxX, 180);
        
        if (props.bbox)
        {
            minx = Math.max(props.bbox.minx, minx);
            miny = Math.max(props.bbox.miny, miny);
            maxx = Math.min(props.bbox.maxx, maxx);
            maxy = Math.min(props.bbox.maxy, maxy);

            if (minx >= maxx || miny >= maxy)
                return;
        }
        
        var scale = gmxAPI.getScale(gmxAPI.map.getZ());
        var w = Math.round((gmxAPI.merc_x(maxx) - gmxAPI.merc_x(minx))/scale);
        var h = Math.round((gmxAPI.merc_y(maxy) - gmxAPI.merc_y(miny))/scale);

        var isMerc = !(props.srs == wmsProjections[1]);

        var st = url;
        var format = requestProperties.format || 'image/jpeg';
        var transparentParam = requestProperties.transparent ? 'TRUE' : 'FALSE';
        var version = props.version || '1.1.1';
        
        //st = st.replace(/Service=WMS[\&]*/i, '');
        //st = st.replace(/\&$/, '');
        
        st += (st.indexOf('?') == -1 ? '?':'&') + 'request=GetMap&Service=WMS';
        st += "&layers=" + encodeURIComponent(props.name) +
            "&VERSION=" + encodeURIComponent(version) +
            "&" + CRSParam[version] + "=" + encodeURIComponent(props.srs) +
            "&styles=" +
            "&width=" + w +
            "&height=" + h +
            "&bbox=" + (isMerc ? gmxAPI.merc_x(minx) : minx) +
                 "," + (isMerc ? gmxAPI.merc_y(miny) : miny) +
                 "," + (isMerc ? gmxAPI.merc_x(maxx) : maxx) +
                 "," + (isMerc ? gmxAPI.merc_y(maxy) : maxy);

        if (url.indexOf('format=') == -1) st += "&format=" + encodeURIComponent(format);
        if (url.indexOf('transparent=') == -1) st += "&transparent=" + encodeURIComponent(transparentParam);
       
        return {url: st, bounds: {minX: minx, maxX: maxx, minY: miny, maxY: maxy}};
    }
    
    var loadWMS = function(map, container, url, func)
    {
        var urlProxyServer = 'http://' + gmxAPI.serverBase + '/';
        var wmsLayers = [];

		url = url.replace(/Request=GetCapabilities[\&]*/i, '');
		url = url.replace(/\&$/, '');
        var st = url;
        st += (st.indexOf('?') == -1 ? '?':'&') + 'request=GetCapabilities&version=1.1.1';
        var _hostname = urlProxyServer + "ApiSave.ashx?debug=1&get=" + encodeURIComponent(st);
        sendCrossDomainJSONRequest(_hostname, function(response)
        {
            if(typeof(response) != 'object' || response['Status'] != 'ok') {
                gmxAPI.addDebugWarnings({'_hostname': _hostname, 'url': url, 'Error': 'bad response'});
                return;
            }
            var serviceLayers = gmxAPI.parseWMSCapabilities(response['Result']);
            for (var i = 0; i < serviceLayers.length; i++)
            {
                var props = serviceLayers[i];
                var obj = container.addObject(null, props);
                obj.setVisible(false);
				wmsLayers.push(obj);

                (function(obj, props) {
                    var timeout = false;
                    var updateFunc = function() 
                    {
                        if (timeout) clearTimeout(timeout);
                        timeout = setTimeout(function()
                        {
                            var res = getWMSMapURL(url, props);
                            
                            if (res)
                            {
                                var bbox = res.bounds;

                                obj.setImage(
                                    urlProxyServer + "ImgSave.ashx?now=true&get=" + encodeURIComponent(res.url),
                                    bbox.minX, bbox.maxY, bbox.maxX, bbox.maxY, bbox.maxX, bbox.minY, bbox.minX, bbox.minY
                                );
                            }
                        }, 500);
                    }
					// Добавление прослушивателей событий
					obj.addListener('onChangeVisible', function(flag)
						{
							if(flag) updateFunc();
							obj.setHandler("onMove", flag ? updateFunc : null);
						}
					);


                })(obj, props);
            }
            func(wmsLayers);
        })
    }
    
    //расширяем namespace
    gmxAPI.parseWMSCapabilities = parseWMSCapabilities;
    gmxAPI._loadWMS = loadWMS;
    gmxAPI.getWMSMapURL = getWMSMapURL;
})();

;/* ======================================================================
    kml.js
   ====================================================================== */

//Поддержка KML
(function()
{
	var kmlParser = function()
	{
		this.hrefs = {};
		
		this.oldBalloon = false,
		this.oldBalloonIndex = -1;
		
		this.globalStyles = {};
		this.globalStylesMap = {};
		
		this.defaultStyles = 
		{
			'point':{outline:{color:0x0000FF, thickness:1},fill:{color:0xFFFFFF, opacity:20},marker:{size:3}},
			'linestring':{outline:{color:0x0000FF, thickness:1}},
			'polygon':{outline:{color:0x0000FF, thickness:1}}
		}
		
		this.counter = 0;
	}


	kmlParser.prototype.value = function(a) 
	{
		if (!a) {
			return "";
		}
		var b = "";
		if (a.nodeType == 3 || a.nodeType == 4 || a.nodeType == 2) {
			b += a.nodeValue;
		} else if (a.nodeType == 1 || a.nodeType == 9 || a.nodeType == 11) {
			for (var c = 0; c < a.childNodes.length; ++c) {
				b += arguments.callee(a.childNodes[c]);
			}
		}
		
		b = b.replace(/^\s*/,"");
		b = b.replace(/\s*$/,"");
		
		return b;
	}

	kmlParser.prototype.get = function(url, callback, map)
	{
		var _this = this;
		this.globalFlashMap = map;
		var urlProxyServer = 'http://' + gmxAPI.serverBase + '/';
		var _hostname = urlProxyServer + "ApiSave.ashx?debug=1&get=" + encodeURIComponent(url);
		sendCrossDomainJSONRequest(_hostname, function(response)
		{
			if(typeof(response) != 'object' || response['Status'] != 'ok') {
				callback(null);
				gmxAPI.addDebugWarnings({'_hostname': _hostname, 'url': url, 'Error': 'bad response'});
				return;
			}
			var parsed = _this.parse(response['Result']);
			parsed.url = url;
			callback(parsed);
		})
	}

	kmlParser.prototype.parse = function(response)
	{
		var strResp = response.replace(/[\t\n\r]/g, ' '),
			strResp = strResp.replace(/\s+/g, ' '),
			xml = gmxAPI.parseXML(strResp),
			vals = [];

		
		this.globalStyles = {};
		this.globalStylesMap = {};
		
		var styles = xml.getElementsByTagName("Style");
		for (var i = 0; i < styles.length; i++) 
		{
			var styleID = styles[i].getAttribute("id");
			
			if (styleID)
				this.globalStyles['#' + styleID] = this.parseStyle(styles[i]);
		}
		
		var stylesMap = xml.getElementsByTagName("StyleMap");
		for (var i = 0; i < stylesMap.length; i++) 
		{
			var styleID = stylesMap[i].getAttribute("id");
			
			if (styleID)
				this.globalStylesMap['#' + styleID] = this.parseStyleMap(stylesMap[i]);
		}
		
		var placemarks = xml.getElementsByTagName("Placemark");
		for (var i = 0; i < placemarks.length; i++) 
		{
			var val = this.parsePlacemark(placemarks[i])
			
			if (val)
				vals.push(val)
		}
		
		var firstNode = xml.getElementsByTagName('Document')[0];
		var name = false,
			documentChilds = (firstNode ? firstNode.childNodes : []);
		
		for (var i = 0; i < documentChilds.length; ++i)
		{
			if (documentChilds[i].nodeName == 'name')
			{
				name = this.value(documentChilds[i]);
				
				break;
			}
		}
		
		if (!name)
			name = 'KML' + (++this.counter);
		
		var res = {vals: vals, name: name}
		
		return res;
	}

	kmlParser.prototype.parseStyle = function(elem)
	{
		var style = false,
			icons = elem.getElementsByTagName("Icon");
				
		if (icons.length > 0) 
		{
			var href = this.value(icons[0].getElementsByTagName("href")[0]);

			if (!!href) {
				var urlProxyServer = 'http://' + gmxAPI.serverBase + '/';
				href = urlProxyServer + "ImgSave.ashx?now=true&get=" + encodeURIComponent(href);

				style = {marker: {image: href, center: true}}
			}
			else
				style = {marker: {size: 3}, outline:{color:0x0000FF, thickness:1}, fill:{color:0xFFFFFF, opacity:20}}
		}

		var linestyles = elem.getElementsByTagName("LineStyle");
		if (linestyles.length > 0) 
		{
			var width = parseInt(this.value(linestyles[0].getElementsByTagName("width")[0]));
			
			if (width < 1 || isNaN(width)) 
				width = 5;
			
			var color = this.value(linestyles[0].getElementsByTagName("color")[0]),
				aa = color.substr(0,2),
				bb = color.substr(2,2),
				gg = color.substr(4,2),
				rr = color.substr(6,2);
			
			if (!style)
				style = {};
			
			style.outline = {color: isNaN(parseInt('0x' + rr + gg + bb)) ? 0 : parseInt('0x' + rr + gg + bb), thickness: width, opacity: isNaN(parseInt(aa,16)) ? 0 : parseInt(aa,16) / 256};
		}
		
		var polystyles = elem.getElementsByTagName("PolyStyle");
		if (polystyles.length > 0) 
		{
			var fill = parseInt(this.value(polystyles[0].getElementsByTagName("fill")[0])),
				outline = parseInt(this.value(polystyles[0].getElementsByTagName("outline")[0])),
				color = this.value(polystyles[0].getElementsByTagName("color")[0]),
				aa = color.substr(0,2),
				bb = color.substr(2,2),
				gg = color.substr(4,2),
				rr = color.substr(6,2);

			if (polystyles[0].getElementsByTagName("fill").length == 0) 
				fill = 1;
			
			if (polystyles[0].getElementsByTagName("outline").length == 0)
				outline = 1;
			
			if (!style)
				style = {};
			
			style.fill = {color: isNaN(parseInt('0x' + rr + gg + bb)) ? 0 : parseInt('0x' + rr + gg + bb), opacity: isNaN(parseInt(aa,16)) ? 0 : parseInt(aa,16) / 256}

			if (!fill)
				style.fill.opacity = 0;
			
			if (!outline)
				style.outline.opacity = 0;
		}
		
		return style;
	}

	kmlParser.prototype.parseStyleMap = function(elem)
	{
		var pairs = elem.getElementsByTagName('Pair'),
			res = {};
		
		for (var i = 0; i < pairs.length; ++i)
		{
			var key = this.value(pairs[i].getElementsByTagName('key')[0]),
				styleID = this.value(pairs[i].getElementsByTagName('styleUrl')[0]);
			
			if (this.globalStyles[styleID])
				res[key] = this.globalStyles[styleID];
		}
		
		return res;
	}

	kmlParser.prototype.convertCoords = function(coordsStr)
	{
		var res = [],
			coordsPairs = gmxAPI.strip(coordsStr).replace(/[\t\n\r\s]/g,' ').replace(/\s+/g, ' ').replace(/,\s/g, ',').split(' ');
		
		if (coordsStr.indexOf(',') == -1)
		{
			for (var j = 0; j < Math.floor(coordsPairs.length / 2); j++)
				res.push([Number(coordsPairs[2 * j]), Number(coordsPairs[2 * j + 1])])
		}
		else
		{
			for (var j = 0; j < coordsPairs.length; j++)
			{
				var parsedCoords = coordsPairs[j].split(',');
				
				res.push([Number(parsedCoords[0]), Number(parsedCoords[1])])
			}
		}
		
		return res;
	}

	kmlParser.prototype.parsePlacemark = function(elem)
	{
		var placemark = {items:[]},
			name = this.value(elem.getElementsByTagName("name")[0]),
			desc = this.value(elem.getElementsByTagName("description")[0]);
		
		if (desc == "") 
		{
			var desc = this.value(elem.getElementsByTagName("text")[0]);
			desc = desc.replace(/\$\[name\]/,name);
			desc = desc.replace(/\$\[geDirections\]/,"");
		}
		
		if (desc.match(/^http:\/\//i) || desc.match(/^https:\/\//i))
			desc = '<a href="' + desc + '">' + desc + '</a>';
		
		placemark.name = name;
		placemark.desc = desc;
		
		var style = this.value(elem.getElementsByTagName("styleUrl")[0]),
			points = elem.getElementsByTagName('Point'),
			lines = elem.getElementsByTagName('LineString'),
			polygones = elem.getElementsByTagName('Polygon');
		
		for (var i = 0; i < points.length; i++)
		{
			var coords = this.value(points[i].getElementsByTagName('coordinates')[0]),
				convertedCoords = this.convertCoords(coords),
				item = {};
			
			item.geometry = {type: 'POINT', coordinates: convertedCoords[0]}
			
			if (this.globalStyles[style])
				item.style = {normal:this.globalStyles[style]}
			else if (this.globalStylesMap[style])
				item.style = this.globalStylesMap[style]
			else
				item.style = {normal:this.defaultStyles['point']}
			
			placemark.items.push(item);
		}
		
		for (var i = 0; i < lines.length; i++)
		{
			var coords = this.value(lines[i].getElementsByTagName('coordinates')[0]),
				convertedCoords = this.convertCoords(coords),
				item = {};
			
			item.geometry = {type: 'LINESTRING', coordinates: convertedCoords}
			
			if (this.globalStyles[style])
				item.style = {normal:this.globalStyles[style]}
			else if (this.globalStylesMap[style])
				item.style = this.globalStylesMap[style]
			else
				item.style = {normal:this.defaultStyles['linestring']}
			
			placemark.items.push(item);
		}
		
		for (var i = 0; i < polygones.length; i++)
		{
			var coords = [],
				outerCoords = polygones[i].getElementsByTagName('outerBoundaryIs'),
				innerCoords = polygones[i].getElementsByTagName('innerBoundaryIs'),
				resultCoords = [],
				item = {};
			
			if (outerCoords.length)
				coords.push(this.value(outerCoords[0].getElementsByTagName('coordinates')[0]));
			
			if (innerCoords.length)
				coords.push(this.value(innerCoords[0].getElementsByTagName('coordinates')[0]));
			
			for (var index = 0; index < coords.length; index++)
				resultCoords.push(this.convertCoords(coords[index]))
			
			item.geometry = {type: 'POLYGON', coordinates: resultCoords}
			
			if (this.globalStyles[style])
				item.style = {normal:this.globalStyles[style]}
			else if (this.globalStylesMap[style])
				item.style = this.globalStylesMap[style]
			else
				item.style = {normal:this.defaultStyles['polygon']}
			
			placemark.items.push(item);
		}
		
		return placemark;
	}

	kmlParser.prototype.draw = function(vals, parent)
	{
		var bounds = gmxAPI.getBounds(),
			loadingIcons = {},
			_this = this;
		var needBalloonsArray = [];
		var needHandlersArray = [];

		function getItem(parent, item, flag, name, desc) {
			var props = {};
			if(name) props['name'] = name;
			if(desc) props['desc'] = desc;
			var tmp = {
				"geometry": item['geometry'],
				"properties": props
			};
			if (item.style.normal)
			{
				var style = ''; 
				if (item.geometry.type == 'POINT')
				{
					style = item.style.normal;
				}
				else
					style = _this.removeMarkerStyle(item.style.normal);


				tmp['setStyle'] = {'regularStyle': style};
			}
			return tmp;
		}

		function getItems(vals) {
			var out = [];
			for (var i = 0; i < vals.length; ++i)
			{
				if (vals[i].items.length == 1)
				{
					var item = vals[i].items[0];
					out.push(getItem(parent, item, true, vals[i].name, vals[i].desc));
					bounds.update(item.geometry.coordinates);
				}
				else
				{
					var point = false;
					for (var j = 0; j < vals[i].items.length; ++j)
					{
						if (!point && vals[i].items[j].geometry.type == 'POINT') {
							point = vals[i].items[j];
						}
						else {
							var item = vals[i].items[j];
							out.push(getItem(parent, item, false, vals[i].name, vals[i].desc));
							bounds.update(item.geometry.coordinates);
							if (item.geometry.type != 'POINT')
							{
								out.push(getItem(parent, item, false, vals[i].name, vals[i].desc));
							}
						}
					}
					if(point) {
						out.push(getItem(parent, point, false, vals[i].name, vals[i].desc));
						bounds.update(point.geometry.coordinates);
					}
				}
			}
			return out;
		}
		var out = getItems(vals);
		var fobjArray = parent.addObjects(out);

		for (var j = 0; j < fobjArray.length; ++j)
		{
			var elem = fobjArray[j];
			var item = out[j];
			if (item.properties['name']) {
				elem.enableHoverBalloon(function(o)
				{
					var st = "<div style=\"margin-bottom: 10px;font-size:12px;color:#000;\" >" + o.properties['name'] + "</div>";
					if(o.properties['desc']) st += '<br>' + o.properties['desc'];
					return st;
				});
			}
		}
		return {parent: parent, bounds: bounds};
	}

	kmlParser.prototype.removeMarkerStyle = function(style)
	{
		var newStyle = {};
		
		if (style.outline)
			newStyle.outline = style.outline;
		
		if (style.fill)
			newStyle.fill = style.fill;

		return newStyle;
	}

	kmlParser.prototype.createBalloon = function(obj, htmlContent)
	{
		if (this.oldBalloon)
			this.oldBalloon.remove();
		
		if (this.oldBalloonIndex == obj.objectId)
		{
			this.oldBalloonIndex = -1;
			this.oldBalloon = false;
			return false;
		}
		
		var coords = obj.getGeometry().coordinates,
			_this = this;
			
		this.oldBalloon = this.globalFlashMap.addBalloon();
		this.oldBalloon.setPoint(coords[0], coords[1]);
		this.oldBalloon.div.appendChild(htmlContent);
		
		var remove = gmxAPI.makeImageButton("img/close.png", "img/close_orange.png");
		remove.onclick = function()
		{
			_this.oldBalloon.remove();
			_this.oldBalloonIndex = -1;
			_this.oldBalloon = false;
		}
		
		remove.style.position = 'absolute';
		remove.style.right = '9px';
		remove.style.top = '5px';
		remove.style.cursor = 'pointer';
		
		this.oldBalloon.div.appendChild(remove);
		this.oldBalloon.resize();
		this.oldBalloonIndex = obj.objectId;
		return true;
	}

	kmlParser.prototype.drawItem = function(parent, item, flag, name, desc)
	{
		var elem = parent.addObject();
		elem.setGeometry(item.geometry);
		
		if (item.style.normal)
		{
			if (item.geometry.type == 'POINT')
			{
				if (typeof item.style.normal.marker.image != 'undefined' &&
					typeof this.hrefs[item.style.normal.marker.image] == 'undefined')
					elem.setStyle(this.defaultStyles['point']);
				else
				{
					item.style.normal.marker.image = this.hrefs[item.style.normal.marker.image];
					
					if (item.style.normal.marker.fill)
						delete item.style.normal.marker.fill;
		
					if (item.style.normal.marker.outline)
						delete item.style.normal.marker.outline;
					
					elem.setStyle(item.style.normal);
				}
			}
			else
				elem.setStyle(this.removeMarkerStyle(item.style.normal));
		}

		if (flag)
		{
			elem.enableHoverBalloon(function(o)
			{
				return "<div style=\"margin-bottom: 10px;font-size:12px;color:#000;\" >" + name + "</div>" + desc;
			});
		}
		
		return elem;
	}

    //расширяем namespace
    gmxAPI._kmlParser = new kmlParser();

    //расширяем FlashMapObject
	gmxAPI.extendFMO('loadKML', function(url, func)
		{
			var me = this;
			gmxAPI._kmlParser.get(url, function(result)
			{
				if(result) gmxAPI._kmlParser.draw(result.vals, me);
				if (func)
					func(result);
			}, gmxAPI.map);
		}
	);

})();
;/* ======================================================================
    balloon.js
   ====================================================================== */

/** Менеджер управления балунами

Позволяет управлять балунами на карте. 

@memberof map
*/
(function()
{
    /**
     * Менеджер управления балунами (создаётся в API и доступен через свойство карты map.balloonClassObject).
     * @constructor BalloonClass
     */
	function BalloonClass()
	{
		var map = gmxAPI.map;
		var div = gmxAPI._div;
		var apiBase = gmxAPI.getAPIFolderRoot();
		var balloons = [];
        map.balloons = balloons;
		var curMapObject = null;

		var mapX = 0;
		var mapY = 0;
		var stageZoom = 1;						// Коэф. масштабирования браузера
		var scale = 0;
		//map.getPosition();
		var currPos = null;

		// Обновить информацию текущего состояния карты
		function refreshMapPosition(ph)
		{
			currPos = ph || gmxAPI.currPosition || map.getPosition();
			mapX = currPos['x'];
			mapY = currPos['y'];
			scale = gmxAPI.getScale(currPos['z']);
			stageZoom =  currPos['stageHeight'] / div.clientHeight;	// Коэф. масштабирования браузера
		}
		// Формирование ID балуна
		function setID(o)
		{
			var id = o.objectId + '_balloon';
			if(o.properties) {
				var identityField = gmxAPI.getIdentityField(o);
				if(o.properties[identityField]) id +=  '_' + o.properties[identityField];
			}
			return id;
		}

		function chkBalloonText(text, div)
		{
			var type = typeof(text);
			if(type === 'string') div.innerHTML = '<div style="white-space: nowrap;">' + text + '</div>';
			else if(type === 'boolean' && text) div.innerHTML = ""; // затираем только если true
			// в случае type === 'object' ничего не делаем
		}

		function callBalloonHook(o, div) {
            for(var key in o._balloonHook) {
                var hook = o._balloonHook[key],
                    //st = '[' + key + ']',
                    fid = hook.hookID,
                    span = div.getElementsByTagName("span"),
                    notFound = true;
                for (var i = 0, len = span.length; i < len; i++) {
                    var node = span[i];
                    if(node.id === fid) {
                        notFound = false;
                        //node.innerHTML = node.innerHTML.replace(st, '');
                        node.id += '_' + i;
                        hook.callback(o, div, node);
                    }
                }
                if(notFound) hook.callback(o, div, null);
            }
        }
        
		// Текст по умолчанию для балуна (innerHTML)
		function getDefaultBalloonText(o, attr)
		{
			var text = "";
			var identityField = gmxAPI.getIdentityField(o);
			var props = gmxAPI.clone(o.properties);
            if(o._balloonHook) {
                for(var key in o._balloonHook) {
                    props[key] = gmxAPI.applyTemplate(o._balloonHook[key].resStr, props);
                }
            }

			for (var key in props)
			{
				if (key != identityField)
				{
					var value = "" + props[key];
                    if(!o._balloonHook) {
                        if (value.indexOf("http://") == 0)
                            value = "<a href='" + value + "'>" + value + "</a>";
                        else if (value.indexOf("www.") == 0)
                            value = "<a href='http://" + value + "'>" + value + "</a>";
                    }
					text += "<b>" + key + ":</b> " + value + "<br />";
				}
			}
			var summary = o.getGeometrySummary();
			if(summary != '') text += "<br />" + summary;
			return text;
		}
		this.getDefaultBalloonText = getDefaultBalloonText;

		// Проверка наличия параметра по ветке родителей
		function chkAttr(name, o)
		{
			var attr = false;
			var hash = o._hoverBalloonAttr;
			if(hash && name in hash) {
				attr = hash[name];
			}
			if(!attr && o.parent) attr = chkAttr(name, o.parent);
			return attr;
		}
/*
		function setDelayHide()
		{
			if(propsBalloon.delayHide) clearTimeout(propsBalloon.delayHide);
			propsBalloon.delayHide = setTimeout(function()
			{
				propsBalloon.chkMouseOut();
				clearTimeout(propsBalloon.delayHide);
				propsBalloon.delayHide = false;
			}, 100);
		}
		function setDelayShow(text, o)
		{
			if(propsBalloon.delayShow) clearTimeout(propsBalloon.delayShow);
			propsBalloon.delayShow = setTimeout(function()
			{
				propsBalloon.updatePropsBalloon(text);
				clearTimeout(propsBalloon.delayShow);
				propsBalloon.delayShow = false;
                if(o._balloonHook) o._balloonHook.callback(o, balloon.div);
			}, 200);
		}
*/

		function disableHoverBalloon(mapObject)
		{
			var listenersID = mapObject._attr['balloonListeners'];
			for (var key in listenersID) {
				mapObject.removeListener(key, listenersID[key]);
			}
			mapObject._attr['balloonListeners'] = {};
		}
		this.disableHoverBalloon = disableHoverBalloon;

        /** Установка режима пользовательского балуна
        * @memberOf BalloonClass#
        * @param {MapObject} mapObject - обьект карты для которого устанавливается режим балуна.
        * @param {object} callback - пользовательский метод формирования содержимого балуна.
        * @param {object} attr - атрибуты управления балуном.
        * @param {boolean} attr.disableOnMouseOver - отключить балун при наведении указателя(по умолчанию равен false).
        * @param {boolean} attr.disableOnClick - отключить балун при click(по умолчанию равен false).
        * @param {boolean} attr.maxFixedBallons - максимальное количество фиксированных балунов(по умолчанию равен 1).
        */
		function enableHoverBalloon(mapObject, callback, attr)
		{
			var _this = this;
			mapObject._hoverBalloonAttr = (attr ? attr : {});				// Атрибуты управления балуном
			if (callback) {													// Пользовательский метод получения текста для балуна
				this.getDefaultBalloonText = mapObject._hoverBalloonAttr['callback'] = callback;
			} else {
				delete mapObject._hoverBalloonAttr['callback'];
			}

			var handlersObj = {
				onMouseOver: function(o, keyPress)
				{
					if('obj' in o) {
						//if('attr' in o && 'textFunc' in o.attr) keyPress = o.attr;
						if('attr' in o) keyPress = o.attr;
						o = o.obj;
					}
					gmxAPI.contDivPos = {
						'x': gmxAPI.getOffsetLeft(div),
						'y': gmxAPI.getOffsetTop(div)
					};
					if(keyPress && (keyPress['shiftKey'] || keyPress['ctrlKey'])) return false;	// При нажатых не показываем балун
					if (map.isDragging())
						return false;

					if(chkAttr('disableOnMouseOver', mapObject)) {			// Проверка наличия параметра disableOnMouseOver по ветке родителей 
						return false;
					}
					var customBalloonObject = chkAttr('customBalloon', mapObject);		// Проверка наличия параметра customBalloon по ветке родителей 
					if(customBalloonObject) {
						currPos = gmxAPI.currPosition || map.getPosition();
						currPos._x = propsBalloon.mouseX || 0;
						currPos._y = propsBalloon.mouseY || 0;
						var flag = customBalloonObject.onMouseOver(o, keyPress, currPos); // Вызов пользовательского метода вместо или перед балуном
						if(flag) return false;										// Если customBalloon возвращает true выходим
					}

                    if(!o._balloonHook && o.filter && o.filter._balloonHook) o._balloonHook = o.filter._balloonHook;
					//if(keyPress['objType'] == 'cluster') {}; // Надо придумать как бороться с фикс.двойником

					var textFunc = chkAttr('callback', mapObject);			// Проверка наличия параметра callback по ветке родителей 
					if(keyPress) {
						if('textFunc' in keyPress) textFunc = keyPress['textFunc'];
					}
					//var text = (textFunc && (!keyPress['objType'] || keyPress['objType'] != 'cluster') ? textFunc(o, propsBalloon.div) : getDefaultBalloonText(o));
					var text = (textFunc ? textFunc(o, propsBalloon.div) : getDefaultBalloonText(o));
					if(typeof(text) == 'string' && text == '') return false;
					var id = setID(o);
					lastHoverBalloonId = o.objectId;
					
					//if(propsBalloon.delayHide) { clearTimeout(propsBalloon.delayHide); propsBalloon.delayHide = false; }
					if (!fixedHoverBalloons[id]) {
                        if(propsBalloon.delayShow) clearTimeout(propsBalloon.delayShow);
                        propsBalloon.delayShow = setTimeout(function()
                        {
                            propsBalloon.updatePropsBalloon(text);
                            clearTimeout(propsBalloon.delayShow);
                            propsBalloon.delayShow = false;
                            if(o._balloonHook) {
                                callBalloonHook(o, propsBalloon.div)
                            }
                        }, 200);
						//setDelayShow(text);
						//propsBalloon.updatePropsBalloon(text);
					}
					else {
						propsBalloon.updatePropsBalloon(false);
					}

					map.clickBalloonFix = clickBalloonFix;
					return true;
				},
				onMouseOut: function(o) 
				{
					if('obj' in o) {
						o = o.obj;
					}
					var customBalloonObject = chkAttr('customBalloon', mapObject);		// Проверка наличия параметра customBalloon по ветке родителей 
					if(customBalloonObject) {
						var flag = customBalloonObject.onMouseOut(o);
						if(flag) return false;
					}
					if (lastHoverBalloonId == o.objectId) {
						//setDelayHide();
						if(propsBalloon.delayShow) { clearTimeout(propsBalloon.delayShow); propsBalloon.delayShow = false; }
						propsBalloon.updatePropsBalloon(false);
					}
					return true;
				},
				onClick: function(o, keyPress)
				{
					if('obj' in o) {
						if('attr' in o) keyPress = o.attr;
						//if('attr' in o && 'textFunc' in o.attr) keyPress = o.attr;
						o = o.obj;
						if('propForBalloon' in keyPress) o.properties = keyPress.propForBalloon;
					}

					refreshMapPosition();
					var customBalloonObject = chkAttr('customBalloon', mapObject);		// Проверка наличия параметра customBalloon по ветке родителей 
					if(customBalloonObject) {
						currPos._x = propsBalloon.x;
						currPos._y = propsBalloon.y;
						var flag = customBalloonObject.onClick(o, keyPress, currPos);
						if(flag) return false;
					}
					if(chkAttr('disableOnClick', mapObject)) {			// Проверка наличия параметра disableOnMouseOver по ветке родителей 
						return false;
					}
					if(!keyPress) keyPress = {};
					if(keyPress['objType'] === 'cluster') {
						if('clusters' in o) keyPress['textFunc'] = o.clusters.getTextFunc();
						if(keyPress['members']) o['members'] = keyPress['members'];	// члены кластера 
					}
					if(!keyPress['textFunc']) keyPress['textFunc'] = chkAttr('callback', mapObject);			// Проверка наличия параметра callback по ветке родителей 
					return clickBalloonFix(o, keyPress);
				}
			};

			if(mapObject == map) return;								// На map Handlers не вешаем
			if(mapObject._hoverBalloonAttr) {							// есть юзерские настройки балунов
				if(mapObject._hoverBalloonAttr['disableOnMouseOver']) {			// для отключения балунов при наведении на обьект
					handlersObj['onMouseOver'] = null;
					handlersObj['onMouseOut'] = null;
				}
				if(mapObject._hoverBalloonAttr['disableOnClick']) {				// для отключения фиксированных балунов
					handlersObj['onClick'] = null;
				}
				//mapObject._hoverBalloonAttr['disableOnMouseOver']
			}
			//mapObject.setHandlers(handlersObj);
			if(!mapObject._attr['balloonListeners']) mapObject._attr['balloonListeners'] = {};
			disableHoverBalloon(mapObject);
			var level = (attr && attr['level'] ? attr['level'] : -10);
			for (var key in handlersObj) {
				if(handlersObj[key]) {
					var eID = mapObject.addListener(key, handlersObj[key], level);
					mapObject._attr['balloonListeners'][key] = eID;
					//gmxAPI._listeners.bringToBottom(mapObject, key, eID);
				}
			}
		}
		this.enableHoverBalloon = enableHoverBalloon;

		var lastHoverBalloonId = false;
		var fixedHoverBalloons = {};

		function showHoverBalloons()
		{
			for (var key in fixedHoverBalloons)
			{
				var balloon = fixedHoverBalloons[key];
				balloon.setVisible(true);
			}
			positionBalloons();
			for (var key in userBalloons)
			{
				var balloon = userBalloons[key];
				if(balloon._needShow) {
					balloon.setVisible(true);
					delete balloon._needShow;
				}
			}
		}
		this.showHoverBalloons = showHoverBalloons;
		
		function removeHoverBalloons()
		{
			for (var key in fixedHoverBalloons)
			{
				fixedHoverBalloons[key].remove();
				delete fixedHoverBalloons[key];
			}
			gmxAPI._mouseOnBalloon = false;
		}
		this.removeHoverBalloons = removeHoverBalloons;
		
		function hideHoverBalloons(flag, attr)
		{
			if(propsBalloon.isVisible()) propsBalloon.setVisible(false);
			var showFlag = false;
			if(!attr) attr = {};
			for (var key in fixedHoverBalloons)
			{
				var balloon = fixedHoverBalloons[key];
				if(!attr.removeAll && balloon.objType != 'cluster') {
					if(attr.from && balloon.pID != attr.from) continue;
					if(attr.remove) balloon.remove();
					else {
                        balloon.setVisible(false);
                        showFlag = true;
                    }
				}
				else
				{
					fixedHoverBalloons[key].remove();
					delete fixedHoverBalloons[key];
				}
			}
			gmxAPI._mouseOnBalloon = false;
			if(attr.from) return;

			for (var key in userBalloons)
			{
				var balloon = userBalloons[key];
				if(balloon.isVisible) {
					balloon.setVisible(false);
					balloon._needShow = true;
				}
			}
			
/*
			if(flag && showFlag) {
				var timeoutShowHoverBalloons = setTimeout(function()
				{
					clearTimeout(timeoutShowHoverBalloons);
					showHoverBalloons();
				}, 300);
			}
*/
		}
		this.hideHoverBalloons = hideHoverBalloons;

		// Фиксация балуна
		function clickBalloonFix(o, keyPress)
		{
			var OnClickSwitcher = chkAttr('OnClickSwitcher', o);		// Проверка наличия параметра по ветке родителей 
			if(OnClickSwitcher && typeof(OnClickSwitcher) == 'function') {
				var flag = OnClickSwitcher(o, keyPress);				// Вызов пользовательского метода вместо или перед балуном
				if(flag) return true;										// Если OnClickSwitcher возвращает true выходим
			}

			if(chkAttr('disableOnClick', o))	// Проверка наличия параметра disableOnClick по ветке родителей 
				return false;

			var textFunc = chkAttr('clickCallback', o) || chkAttr('callback', o);	// Проверка наличия параметра callback по ветке родителей 
			if(keyPress) {
				if(keyPress['shiftKey'] || keyPress['ctrlKey']) return false;	// При нажатых не показываем балун
				if(keyPress['nodeFilter'] == o.parent.objectId && o.parent._hoverBalloonAttr.callback) textFunc = o.parent._hoverBalloonAttr.callback; // взять параметры балуна от фильтра родителя
				else if('textFunc' in keyPress) textFunc = keyPress['textFunc'];
			}

			var id = setID(o);
			if (!fixedHoverBalloons[id])
			{
				var maxFixedBallons = chkAttr('maxFixedBallons', o) || 1;	// Проверка наличия параметра maxFixedBallons по ветке родителей
				if(maxFixedBallons > 0 && balloons.length > 0)
				{
					if(maxFixedBallons <= balloons.length) {
						var balloon = null;
						for(var i=0; i<balloons.length; i++) {
							if(balloons[i].notDelFlag) continue;
							balloon = balloons[i];
							break;
						}
						if(balloon) {
							var fixedId = balloon.fixedId;
							balloon.remove();
							delete fixedHoverBalloons[fixedId];
						}
					}
				}
				var balloon = addBalloon();
				balloon.setVisible(false);
				balloon.pID = o.parent.objectId;
				if(o.parent && o.parent.parent && o.parent.parent.filters) {
                    balloon.pID = o.parent.parent.objectId;
                    balloon.filter = o.parent;
                    balloon.layer = o.parent.parent;
				}
                balloon.obj = o;
				balloon.fixedId = id;
				balloon.keyPress = keyPress;

				o.balloon = balloon;
				if(keyPress && keyPress['objType']) balloon.objType = keyPress['objType'];

                if(!o._balloonHook && o.filter && o.filter._balloonHook) o._balloonHook = o.filter._balloonHook;
				var text = (textFunc ? textFunc(o, balloon.div) : getDefaultBalloonText(o));
				if(typeof(text) == 'string' && text == '') return false;

				var mx = map.getMouseX();
				var my = map.getMouseY();
				
				if(gmxAPI.proxyType == 'flash') {
					mx = gmxAPI.chkPointCenterX(mx);
				}

				if(balloon.objType === 'cluster') {
                    keyPress.dx = keyPress.dy = 0;
				} else if(o.getGeometryType() == 'POINT') {
					var gObj = o.getGeometry();
					var x = gObj.coordinates[0];
					var y = gObj.coordinates[1];

					//balloon.fixedDeltaX =  (gmxAPI.merc_x(mx) -  gmxAPI.merc_x(x))/scale;
					//balloon.fixedDeltaY =  (gmxAPI.merc_y(my) -  gmxAPI.merc_y(y))/scale;
					mx = x;
					my = y;
					//balloon.fixedDeltaFlag = true;
				}

				balloon.setVisible(true);
				balloon.setPoint(mx, my);
				chkBalloonText(text, balloon.div);
                if(o._balloonHook) {
                    callBalloonHook(o, balloon.div)
                }

				balloon.resize();
				fixedHoverBalloons[id] = balloon;
			}
			else
			{
				fixedHoverBalloons[id].remove();
				delete fixedHoverBalloons[id];
			}
			propsBalloon.updatePropsBalloon(false);
			if(propsBalloon.delayShow) { clearTimeout(propsBalloon.delayShow); propsBalloon.delayShow = false; }
			return true;
		}
		this.clickBalloonFix = clickBalloonFix;

		// Создание DIV и позиционирование балуна
		function createBalloon(outerFlag)
		{
			var tlw = 14;
			var tlh = 14;
			var blw = 14;
			var blh = 41;
			var trw = 18;
			var trh = 13;
			var brw = 20;
			var brh = 41;
			var th = 2;
			var lw = 2;
			var bh = 2;
			var rw = 2;

			var legWidth = 68;

			var balloon = gmxAPI.newStyledDiv({
				position: "absolute",
				'font-family': 'Times New Roman',
/*
				paddingLeft: lw + "px",
				paddingRight: rw + "px",
				paddingTop: th + "px",
				paddingBottom: bh + "px",
*/
				width: "auto",
				//whiteSpace: "nowrap",
				zIndex: 1000
			});
			//if(outerFlag || gmxAPI.proxyType !== 'leaflet') {
				balloon.className = 'gmx_balloon';
				div.appendChild(balloon);
			//} else {
			//	balloon.className = 'gmx_balloon leaflet-pan-anim leaflet-zoom-animated';
			//	gmxAPI._leaflet.LMap['_mapPane'].appendChild(balloon);
			//}

			var css = {
				'table': 'background-color: transparent; width: auto; margin: 2px; border-collapse: collapse; font-size: 11px; font-family: sans-serif;',
				'bg_top_left': 'background-color: transparent; width: 13px; height: 18px; border: 0px none; padding: 1px; display: block; background-position: 2px 9px; background-image: url(\''+apiBase+'img/tooltip-top-left.png\'); background-repeat: no-repeat;',
				'bg_top': 'background-color: transparent; height: 18px; border: 0px none; padding: 0px; background-position: center 9px; background-image: url(\''+apiBase+'img/tooltip-top.png\'); background-repeat: repeat-x;',
				'bg_top_right': 'background-color: transparent; width: 18px; height: 18px; border: 0px none; padding: 1px; display: block; background-position: -5px 9px; background-image: url(\''+apiBase+'img/tooltip-top-right.png\'); background-repeat: no-repeat;',
				'bg_left': 'background-color: transparent; width: 13px; border: 0px none; padding: 1px; background-position: 2px top; background-image: url(\''+apiBase+'img/tooltip-left.png\'); background-repeat: repeat-y;',
				'bg_center': 'background-color: transparent; width: 50px; min-width: 50px; border: 0px none; background-color: white; padding: 4px; padding-right: 14px;',
				'bg_right': 'background-color: transparent; width: 13px; height: 18px; border: 0px none; padding: 1px; background-position: 0px top; background-image: url(\''+apiBase+'img/tooltip-right.png\'); background-repeat: repeat-y;',
				'bg_bottom_left': 'background-color: transparent; width: 13px; height: 18px; border: 0px none; padding: 1px; background-position: 2px top; background-image: url(\''+apiBase+'img/tooltip-bottom-left.png\'); background-repeat: no-repeat;',
				'bg_bottom': 'background-color: transparent; height: 18px; border: 0px none; padding: 1px; background-position: center top; background-image: url(\''+apiBase+'img/tooltip-bottom.png\'); background-repeat: repeat-x;',
				'bg_bottom_right': 'background-color: transparent; width: 18px; height: 18px; border: 0px none; padding: 1px; background-position: -2px top; background-image: url(\''+apiBase+'img/tooltip-bottom-right.png\'); background-repeat: no-repeat;',
				'leg': 'bottom: 18px; left: 0px; width: 68px; height: 41px; position: relative; background-repeat: no-repeat; background-image: url(\''+apiBase+'img/tooltip-leg.png\');'
			};

			var transp = '';
			if(gmxAPI.isChrome || gmxAPI.isIE) transp =  '<img width="10" height="10" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi+P//PwNAgAEACPwC/tuiTRYAAAAASUVORK5CYII=">';	// Для Chrome добавляем невидимый контент в TD
			var body = 
				'<table cols="3" cellspacing="0" cellpadding="0" border="0" style="'+css['table']+'">'+
					'<tr>'+
						'<td style="'+css['bg_top_left']+'">'+transp+'</td>'+
						'<td style="'+css['bg_top']+'">'+transp+'</td>'+
						'<td style="'+css['bg_top_right']+'">'+transp+'</td>'+
					'</tr>'+
					'<tr>'+
						'<td style="'+css['bg_left']+'">'+transp+'</td>'+
						'<td style="'+css['bg_center']+'">'+
							'<div class="kosmosnimki_balloon">'+
							'</div>'+
						'</td>'+
						'<td style="'+css['bg_right']+'">'+transp+'</td>'+
					'</tr>'+
					'<tr>'+
						'<td style="'+css['bg_bottom_left']+'">'+transp+'</td>'+
						'<td style="'+css['bg_bottom']+'">'+transp+'</td>'+
						'<td style="'+css['bg_bottom_right']+'">'+transp+'</td>'+
					'</tr>'+
				'</table>';
			balloon.innerHTML = body;
			var nodes = balloon.getElementsByTagName("div");
			var balloonText = nodes[0];
			
			var imgStyle =	{
				position: "absolute",
				pointerEvents: "none",
				bottom: "-21px",
				right: "15px"
			};
			if(document.doctype) {
				//if(gmxAPI.isChrome || gmxAPI.isSafari || gmxAPI.isIE) 
				if(!window.opera) imgStyle["bottom"] = "-19px";
			} else if(gmxAPI.isIE && document.documentMode >= 8) imgStyle["bottom"] = "-19px";
			var leg = gmxAPI.newElement("img",
				{
					className: 'gmx_balloon_leg',
					src: apiBase + "img/tooltip-leg.png"
				},
				imgStyle
			);
			balloon.appendChild(leg);

			var x = 0;
			var y = 0;
			var legX = null;
			var bposX = 0;
			var bposY = 0;
			var reposition = function()	
			{
				//if(!wasVisible) return;
				var ww = balloon.clientWidth;
				var hh = balloon.clientHeight;
				balloon.style.visibility = (ww == 0 || hh ==0 ? 'hidden' : 'visible'); 

				var screenWidth = div.clientWidth;
				var yy = div.clientHeight - y + 20;

				var xx = (x + ww < screenWidth) ? x : (ww < screenWidth) ? (screenWidth - ww) : 0;
				xx = Math.max(xx, x - ww + legWidth + brw);
				var dx = x - xx;
				if(legX != dx) leg.style.left = dx + "px";
				legX = dx;
				xx += 2;

				if(bposX != xx || bposY != yy) {
					if(balloon.parentNode != div) gmxAPI.position(balloon, xx, yy);
					else gmxAPI.bottomPosition(balloon, xx, yy);
				}
				bposX = xx;
				bposY = yy;
			}

			var updateVisible = function(flag)	
			{
				gmxAPI.setVisible(balloon, flag);
				if (flag && !wasVisible) {
					ret.resize();
				}
				wasVisible = flag;
			}
			var isVisible = function()	
			{
				return wasVisible;
			}

			var wasVisible = true;
			var setMousePos = function(x_, y_)	
			{
				x = this.mouseX = x_;
				y = this.mouseY = y_;
			}

			var ret = {						// Возвращаемый обьект
				outerDiv: balloon,
				div: balloonText,
				leg: leg,
				mouseX: 0,
				mouseY: 0,
				//delayHide: false,
				delayShow: false,
				isVisible: isVisible,
				setVisible: updateVisible,
				setMousePos: setMousePos,
				setScreenPosition: function(x_, y_)
				{
					setMousePos(x_, y_);
					if(wasVisible) reposition();
				},
				resize: function()
				{
					reposition();
				},
				updatePropsBalloon: function(text)
				{
					//ret.outerDiv.style.pointerEvents = 'none';
					updateVisible((text && !buttons ? true : false));
					chkBalloonText(text, balloonText);
					reposition();
				},
				chkMouseOut: function()
				{
					if(propsBalloon.delayHide) updateVisible(false);
				}
				,
				stateListeners: {},
				addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); },
				removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); }
			};
			return ret;
		}

		var propsBalloon = createBalloon(true);		// Balloon для mouseOver
		this.propsBalloon = propsBalloon;
		propsBalloon.setVisible(false);
		propsBalloon.outerDiv.style.zIndex = 10000;
		propsBalloon.outerDiv.style.display = "none";

/*
		document.onmouseover = function(ev)
		{
			var event = gmxAPI.compatEvent(ev);
			if(event && event.target != propsBalloon.leg) setDelayHide();
		}
		document.onmouseout = function(event)
		{
			if(!gmxAPI.contDivPos) return;
			var minx = gmxAPI.contDivPos['x'];
			var maxx = minx + gmxAPI._div.clientWidth;
			var eventX = gmxAPI.eventX(event);
			var miny = gmxAPI.contDivPos['y'];
			var maxy = miny + gmxAPI._div.clientHeight;
			var eventY = gmxAPI.eventY(event);
			if(eventX >= minx && eventX <= maxx && eventY >= miny && eventY <= maxy) return;
			propsBalloon.outerDiv.style.display = "none";
		}
*/
		div.onmouseout = function(ev)		// скрыть балун по наведению если мышь ушла
		{
			if(gmxAPI.proxyType === 'leaflet') return;
			if(propsBalloon.isVisible()) {
				var event = gmxAPI.compatEvent(ev);
				var tg = gmxAPI.compatTarget(event);
				var reltg = event.toElement || event.relatedTarget;
				while (reltg && (reltg != document.documentElement))
				{
					if (reltg == propsBalloon.outerDiv) {
						return;
					}
					reltg = reltg.offsetParent;
				}
				while (tg && (tg != document.documentElement))
				{
					if (tg == propsBalloon.outerDiv)
						return;
					tg = tg.offsetParent;
				}
				propsBalloon.outerDiv.style.display = "none";
			}
		}

		var positionBalloons = function(ph)	
		{
			if(balloons.length < 1) return;
			refreshMapPosition(ph);
			balloons.sort(function(b1, b2)
			{
				return b1.isHovered ? 1 : b2.isHovered ? -1 : (b2.geoY - b1.geoY);
			});
			for (var i = 0; i < balloons.length; i++)
			{
				var bal = balloons[i];
				bal.reposition();
				if(bal.outerDiv.style.zIndex != 1000 + i) bal.outerDiv.style.zIndex = 1000 + i;
			}
		}

		//map.addObject().setHandler("onMove", positionBalloons);
		gmxAPI.contDivPos = null;
		var eventXprev = 0; 
		var eventYprev = 0;
		var buttons = false;
		var mouseMoveTimer = null;
		var onmousemove = function(ev)
		{
			var px = 0;
			var py = 0;
			if(gmxAPI._leaflet && gmxAPI._leaflet['containerPoint']) {
				px = gmxAPI._leaflet['containerPoint']['x'];
				py = gmxAPI._leaflet['containerPoint']['y'];
			} else {
				var event = gmxAPI.compatEvent(ev);
				if(!event) return;
				//buttons = event.buttons;
				var eventX = gmxAPI.eventX(event);
				var eventY = gmxAPI.eventY(event);
				if(eventX == eventXprev && eventY == eventYprev) return;
				eventXprev = eventX; 
				eventYprev = eventY;
				px = eventX;
				py = eventY;
				gmxAPI.contDivPos = {
					'x': gmxAPI.getOffsetLeft(div),
					'y': gmxAPI.getOffsetTop(div)
				};
				px -= gmxAPI.contDivPos['x']; 
				py -= gmxAPI.contDivPos['y'];
			}
			propsBalloon.setScreenPosition(px, py);
		}

		gmxAPI._div.onmousemove = function(ev)
		{
			if(gmxAPI.mousePressed) return;
			onmousemove(ev);
		};
		
		gmxAPI.map.addListener('positionChanged', function(ph)
			{
				if(ph && ph.currZ != Math.floor(ph.currZ)) return;
				positionBalloons();
			}
		, -10);
		
		gmxAPI.map.addListener('onResizeMap', function()
			{
/*			
				gmxAPI.contDivPos = {
					'x': gmxAPI.getOffsetLeft(div),
					'y': gmxAPI.getOffsetTop(div)
				};
*/
				gmxAPI.contDivPos = {
					'x': div.offsetLeft,
					'y': div.offsetTop
				};
				positionBalloons();
			}
		, -10);
		
		function addBalloon(_notDelFlag)
		{
			var balloon = createBalloon();
			balloon.notDelFlag = _notDelFlag;
			balloon.geoX = 0;
			balloon.geoY = 0;
			balloon.isDraging = false;
			balloon.isRemoved = false;
			
			var oldSetVisible = balloon.setVisible;
			balloon.outerDiv.onmouseover = function(ev)
			{
				balloon.isHovered = true;
				positionBalloons();
				gmxAPI._mouseOnBalloon = true;
				if(propsBalloon.isVisible()) {
					propsBalloon.setVisible(false);
					gmxAPI._listeners.dispatchEvent('hideHoverBalloon', gmxAPI.map, {});
				}
			}
			balloon.outerDiv.onmouseout = function()
			{
				balloon.isHovered = false;
				positionBalloons();
				gmxAPI._mouseOnBalloon = false;
			}
			balloon.outerDiv.appendChild(gmxAPI.newElement(
				"img",
				{
					src: apiBase + "img/close.png",
					title: gmxAPI.KOSMOSNIMKI_LOCALIZED("Закрыть", "Close"),
					onclick: function(ev) 
					{ 
						if(balloon.notDelFlag) {
							balloon.setVisible(false);
						}
						else
						{
							balloon.remove();
							balloon.isVisible = false;
						}
						gmxAPI.stopEvent(ev);
						gmxAPI._mouseOnBalloon = false;
						gmxAPI._listeners.dispatchEvent('onClose', balloon, false);
					},
					onmouseover: function()
					{
						this.src = apiBase + "img/close_orange.png";
					},
					onmouseout: function()
					{
						this.src = apiBase + "img/close.png";
					}
				},
				{
					position: "absolute",
					top: "15px",
					right: "15px",
					cursor: "pointer"
				}
			));
			balloon.isVisible = true;
			balloon.reposition = function()
			{
				if (balloon.isVisible)
				{
					refreshMapPosition();

					var sc = scale * stageZoom;
					
					// Смещение Балуна к центру
					var deltaX = 0;
					if(!balloon.isDraging && gmxAPI.proxyType === 'flash') {
						var pos = gmxAPI.chkPointCenterX(this.geoX);
						var centrGEO = gmxAPI.from_merc_x(mapX);
						
						var mind = Math.abs(pos - centrGEO);
						for(var i = 1; i<4; i++) {
							var d1 = Math.abs(pos - centrGEO + i * 360);
							if (d1 < mind) { mind = d1; deltaX = i * 360; }
							d1 = Math.abs(pos - centrGEO - i * 360);
							if (d1 < mind) { mind = d1; deltaX = -i * 360; }
						}
						deltaX = gmxAPI.merc_x(deltaX) / sc;
					}

					var px = (mapX - gmxAPI.merc_x(balloon.geoX))/sc;
					var py = (mapY - gmxAPI.merc_y(balloon.geoY))/sc;
					var x = div.clientWidth/2 - px + deltaX;
					var y = div.clientHeight/2 + py;

					if(balloon.keyPress) {	// если задано смещение в пикселах
						if(balloon.keyPress.dx) x += balloon.keyPress.dx;
						if(balloon.keyPress.dy) y += balloon.keyPress.dy;
					}
					/*if(balloon.fixedDeltaFlag) {
						x += balloon.fixedDeltaX;
						y -= balloon.fixedDeltaY;
					}*/
					var flag = (y < 0 || y > div.clientHeight ? false : true);
					if (flag) {
						if (x < 0 || x > div.clientWidth) flag = false;
					}

					if (flag)
					{
						this.setScreenPosition(x, y);
						oldSetVisible(true);
					}
					else
						oldSetVisible(false);
				}
				else
				{
					oldSetVisible(false);
				}
			}
			balloon.setVisible = function(flag)
			{
				balloon.isVisible = flag;
				this.reposition();
				if(!flag) setTimeout(function() { gmxAPI._mouseOnBalloon = false; }, 20);
			}
			balloon.setPoint = function(x_, y_, isDraging_)
			{
				this.geoX = x_;
				this.geoY = y_;
				this.isDraging = isDraging_;
				positionBalloons();
			}
			balloon.remove = function()
			{
				gmxAPI._mouseOnBalloon = false;
				if(balloon.isRemoved) return false;
				if(balloon.fixedId) delete fixedHoverBalloons[balloon.fixedId];
				for(var i=0; i<balloons.length; i++) {
					if(balloons[i] == balloon) {
						balloons.splice(i, 1);
						break;
					}
				}
				if(this.outerDiv.parentNode) this.outerDiv.parentNode.removeChild(this.outerDiv);
				//div.removeChild(this.outerDiv);
				var gmxNode = gmxAPI.mapNodes[balloon.pID];		// Нода gmxAPI
				gmxAPI._listeners.dispatchEvent('onBalloonRemove', gmxNode, {'obj': balloon.obj});		// balloon удален
				balloon.isRemoved = true;
			}
			balloon.getX = function() { return this.geoX; }
			balloon.getY = function() { return this.geoY; }
			balloons.push(balloon);
			return balloon;
		}
		this.addBalloon = addBalloon;

        /** Установка параметров пользовательского балуна для фильтра слоя
        * @memberOf BalloonClass#
        * @param {Filter} filter - обьект фильтра слоя.
        * @param {object} balloonParams - параметры балуна для фильтра.
        * @param {boolean} balloonParams.DisableBalloonOnMouseMove - отключить балун при наведении указателя(по умолчанию равен false).
        * @param {boolean} balloonParams.DisableBalloonOnClick - отключить балун при click(по умолчанию равен false).
        * @param {String} balloonParams.Balloon - шаблон балуна(по умолчанию равен '').
        */
		var setBalloonFromParams = function(filter, balloonParams)
		{
/*			
			//по умолчанию балуны показываются
			if ( typeof balloonParams.BalloonEnable !== 'undefined' && !balloonParams.BalloonEnable )
			{
				disableHoverBalloon(filter);
				//return;
			}
*/			
			var balloonAttrs = {
				disableOnClick: balloonParams.DisableBalloonOnClick,
				disableOnMouseOver: balloonParams.DisableBalloonOnMouseMove
			}
			
			if ( balloonParams.Balloon )
			{
				filter['_balloonTemplate'] = balloonParams.Balloon;
				enableHoverBalloon(filter, function(o)
					{
                        var props = gmxAPI.clone(o.properties);
                        props.SUMMARY = o.getGeometrySummary();
                        if(o._balloonHook) {
                            for(var key in o._balloonHook) {
                                props[key] = gmxAPI.applyTemplate(o._balloonHook[key].resStr, props);
                            }
                        }

						var text = gmxAPI.applyTemplate(balloonParams.Balloon, props);
						text = text.replace(/\[SUMMARY\]/g, '');
						return text;
					}
					,
					balloonAttrs);
			}
			else
			{
				enableHoverBalloon(filter, null, balloonAttrs);
			}
		}
		this.setBalloonFromParams = setBalloonFromParams;
		
		//явно прописывает все свойства балунов в стиле.
		var applyBalloonDefaultStyle = function(balloonStyle)
		{
			var out = gmxAPI.clone(balloonStyle);
			//слой только что создали - всё по умолчанию!
			if (typeof out.BalloonEnable === 'undefined')
			{
				out.BalloonEnable = true;
				out.DisableBalloonOnClick = false;
				out.DisableBalloonOnMouseMove = true;
			} 
			else
			{
				//поддержка совместимости - если слой уже был, но новых параметров нет 
				if (typeof out.DisableBalloonOnClick === 'undefined')
					out.DisableBalloonOnClick = false;
					
				if (typeof out.DisableBalloonOnMouseMove === 'undefined')
					out.DisableBalloonOnMouseMove = false;
			}
			return out;
		}
		this.applyBalloonDefaultStyle = applyBalloonDefaultStyle;
	}

	var userBalloons = {};
	// Добавление прослушивателей событий
	gmxAPI._listeners.addListener({'level': -10, 'eventName': 'mapInit', 'func': function(map) {
			if(!gmxAPI.map || gmxAPI.map.balloonClassObject) return;
			gmxAPI.map.balloonClassObject = new BalloonClass();
			gmxAPI.map.addListener('zoomBy', function()	{ gmxAPI.map.balloonClassObject.hideHoverBalloons(true); });
			gmxAPI.map.addListener('hideBalloons', function(attr) { gmxAPI.map.balloonClassObject.hideHoverBalloons(null, attr); });
			gmxAPI.map.addListener('onMoveEnd', function() { gmxAPI.map.balloonClassObject.showHoverBalloons(); });

			gmxAPI.map.addListener('clickBalloonFix', function(o) { gmxAPI.map.balloonClassObject.clickBalloonFix(o); });
			gmxAPI.map.addListener('initFilter', function(data)
				{
					var fullStyle = gmxAPI.map.balloonClassObject.applyBalloonDefaultStyle(data['filter']['_attr']);
					gmxAPI.map.balloonClassObject.setBalloonFromParams(data['filter'], fullStyle);
				}
			);
			
			//расширяем FlashMapObject
			gmxAPI.extendFMO('addBalloon', function() {
				var balloon = map.balloonClassObject.addBalloon();
				var id = gmxAPI.newFlashMapId();
				balloon.fixedId = id;
				userBalloons[id] = balloon;
				return balloon;
			});
			gmxAPI.extendFMO('enableHoverBalloon', function(callback, attr) {
                if(this.filters) {
                    this.filters.foreach(function(item) {
                        map.balloonClassObject.enableHoverBalloon(item, callback, attr);
                    });
                } else {
                    map.balloonClassObject.enableHoverBalloon(this, callback, attr);
                }
            });
			gmxAPI.extendFMO('disableHoverBalloon', function() {
                if(this.filters) {
                    this.filters.foreach(function(item) {
                        map.balloonClassObject.disableHoverBalloon(item);
                    });
                } else {
                    map.balloonClassObject.disableHoverBalloon(this);
                }
            });
			gmxAPI.extendFMO('addBalloonHook', function(key, callback) {
                var hookID = gmxAPI.newFlashMapId();
                var res = {
                    key: key
                    ,hookID: hookID
                    ,resStr: "<span id='"+hookID+"'></span>"
                    ,callback: callback
                };
                
                if(this.filters) {
                    this.filters.foreach(function(item) {
                        if(!item._balloonHook) item._balloonHook = {};
                        if(item._balloonHook[key]) return false;
                        item._balloonHook[key] = res;
                    });
                } else {
                    if(!this._balloonHook) this._balloonHook = {};
                    if(this._balloonHook[key]) return false;
                    this._balloonHook[key] = res;
                }
                return true;
            });
			gmxAPI.extendFMO('removeBalloonHook', function(key) {
                if(this.filters) {
                    this.filters.foreach(function(item) {
                        if(item._balloonHook) delete item._balloonHook[key];
                    });
                } else {
                    if(this._balloonHook) delete this._balloonHook[key];
                }
            });
		}
	});
	//gmxAPI.BalloonClass = BalloonClass;
})();
;/* ======================================================================
    drawing.js
   ====================================================================== */

//Управление drawFunctions
(function()
{
	var outlineColor = 0x0000ff;
	var fillColor = 0xffffff;
	var currentDOMObject = null;		// текущий обьект рисования
	
	var regularDrawingStyle = {
		marker: { size: 3 },
		outline: { color: outlineColor, thickness: 3, opacity: 80 },
		fill: { color: fillColor }
	};
	var hoveredDrawingStyle = { 
		marker: { size: 4 },
		outline: { color: outlineColor, thickness: 4 },
		fill: { color: fillColor }
	};

	var getStyle = function(removeDefaults, mObj){
		var out = mObj.getStyle( removeDefaults );
		if(out && !removeDefaults) {
			if(!out.regular) out.regular = regularDrawingStyle;
			if(!out.hovered) out.hovered = hoveredDrawingStyle;
		}
		return out;
	};
	
	var objects = {};
	var drawFunctions = {};

	var chkDrawingObjects = function() {
		for (var id in objects) {
			var cObj = objects[id];
			if(!cObj.geometry) cObj.remove();
		}
	};
	var endDrawing = function() {			// Вызывается при выходе из режима редактирования
		chkDrawingObjects();
		//gmxAPI._listeners.dispatchEvent('endDrawing', drawing, currentDOMObject);	// Генерация события выхода из режима редактирования
		currentDOMObject = null;
	};

	var createDOMObject = function(ret, properties)
	{
		var myId = gmxAPI.newFlashMapId();
		var myContents;
		var callHandler = function(eventName)
		{
			var handlers = gmxAPI.map.drawing.handlers[eventName] || [];
			for (var i = 0; i < handlers.length; i++)
				handlers[i](objects[myId]);

			gmxAPI._listeners.dispatchEvent(eventName, gmxAPI.map.drawing, objects[myId]);
		}
		var addHandlerCalled = false;
		objects[myId] = {
			properties: properties || {},
			setText: ret.setText,
			setVisible: function(flag)
			{
				ret.setVisible(flag);
				this.properties.isVisible = flag;
			},
			update: function(geometry, text)
			{
				if(!geometry) return;				// Если нет geometry ничего не делаем
				this.properties.text = text;
				this.properties.isVisible = ret.isVisible;
				this.geometry = geometry;
				this.balloon = ret.balloon;
				callHandler(addHandlerCalled ? "onEdit" : "onAdd");
				addHandlerCalled = true;
			},
			remove: function() { ret.remove(); },
			removeInternal: function()
			{
				callHandler("onRemove");
				delete objects[myId];
			},
			triggerInternal: function( callbackName ){ callHandler(callbackName); },
			getGeometry: function() { return this.geometry; },
			getLength: function() { return gmxAPI.geoLength(this.geometry); },
			getArea: function() { return gmxAPI.geoArea(this.geometry); },
			getCenter: function() { return gmxAPI.geoCenter(this.geometry); },
			setStyle: function(regularStyle, hoveredStyle) { ret.setStyle(regularStyle, hoveredStyle); },
			getVisibleStyle: function() { return ret.getVisibleStyle(); },
			getStyle: function(removeDefaults) { return ret.getStyle(removeDefaults); },
			stateListeners: {},
			addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); },
			removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); }
		}
		currentDOMObject = ret.domObj = objects[myId];
		return objects[myId];
	}


	drawFunctions.POINT = function(coords, props)
	{
		if (!props)
			props = {};

		var text = props.text;
		if (!text)
			text = "";
		var x, y;
		var obj = false;
		var balloon = false;
		var domObj;
		var isDrawing = true;
		var ret = {};
		var toolsContainer = null;
		if('_tools' in gmxAPI && 'standart' in gmxAPI._tools) {
			toolsContainer = gmxAPI._tools['standart'];
			toolsContainer.currentlyDrawnObject = ret;
		}

		ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;
		ret.stopDrawing = function()
		{
			gmxAPI._cmdProxy('stopDrawing');
			if (!isDrawing)
				return;
			isDrawing = false;
			if (!coords)
			{
				gmxAPI.map.unfreeze();
				gmxAPI._sunscreen.setVisible(false);
				gmxAPI._setToolHandler("onClick", null);
				gmxAPI._setToolHandler("onMouseDown", null);
				gmxAPI.map.clearCursor();
			}
		}

		ret.remove = function()
		{
			if (obj)
			{
				gmxAPI._listeners.dispatchEvent('onRemove', domObj, domObj);
				obj.remove();
				if(balloon) balloon.remove();
				domObj.removeInternal();
			}
		}

		ret.setStyle = function(regularStyle, hoveredStyle) {}

		var done = function(xx, yy)
		{
			obj = gmxAPI.map.addObject();
			balloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.addBalloon(true) : null);	// Редактируемый балун (только скрывать)

			gmxAPI.map.addListener('zoomBy', function() {
				if(balloon.isVisible) gmxAPI.setVisible(balloon.outerDiv, false);
			});
			gmxAPI.map.addListener('onMoveEnd', function() {
				if(balloon.isVisible) {
					gmxAPI.setVisible(balloon.outerDiv, true);
					balloon.reposition();
				}
			});

			var updateDOM = function()
			{
				xx = gmxAPI.chkPointCenterX(xx);
				domObj.update({ type: "POINT", coordinates: [xx, yy] }, text);
			}

			ret.setText = function(newText)
			{
				if(!balloon) return;
				text = newText;
				input.value = newText;
				updateText();
			}

			ret.setVisible = function(flag)
			{
				ret.isVisible = flag;
				obj.setVisible(ret.isVisible);
				if(balloon) balloon.setVisible(ret.isVisible && balloonVisible);
			}
			ret.balloon = balloon;
			ret.getVisibleStyle = function() { return obj.getVisibleStyle(); };
			ret.getStyle = function(removeDefaults) { return getStyle(removeDefaults, obj); };

			var position = function(x, y)
			{
				xx = x;
				yy = y;
				gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': isDragged} });
				obj.setPoint(xx, yy);
				if(balloon) balloon.setPoint(xx, yy, isDragged);
				updateDOM();
			}
			var apiBase = gmxAPI.getAPIFolderRoot();

			obj.setStyle(
				{ 
					marker: { image: apiBase + "img/flag_blau1.png", dx: -6, dy: -36 },
					label: { size: 12, color: 0xffffc0 }
				},
				{ 
					marker: { image: apiBase + "img/flag_blau1_a.png", dx: -6, dy: -36 },
					label: { size: 12, color: 0xffffc0 }
				}
			);

			var startDx, startDy, isDragged = false;
			var clickTimeout = false;
			var needMouseOver = true;
			obj.setHandlers({
				"onClick": function()
				{
					if(domObj.stateListeners['onClick'] && gmxAPI._listeners.dispatchEvent('onClick', domObj, domObj)) return;	// если установлен пользовательский onClick возвращающий true выходим
					if (clickTimeout)
					{
						clearTimeout(clickTimeout);
						clickTimeout = false;
						ret.remove();
					}
					else
					{
						clickTimeout = setTimeout(function() { clickTimeout = false; }, 500);
						if(balloon) {
							balloonVisible = !balloon.isVisible;
							balloon.setVisible(balloonVisible);
							if (balloonVisible)
								setHTMLVisible(true);
							else
							{
								gmxAPI.hide(input);
								gmxAPI.hide(htmlDiv);
							}
						}
					}
				}
				,"onMouseOver": function()
				{
					if(!isDragged && needMouseOver) {
						gmxAPI._listeners.dispatchEvent('onMouseOver', domObj, domObj);
						needMouseOver = false;
					}
				}
				,"onMouseOut": function()
				{
					if(!isDragged && !needMouseOver) {
						gmxAPI._listeners.dispatchEvent('onMouseOut', domObj, domObj);
						needMouseOver = true;
					}
				}
			});

			var dragCallback = function(x, y)
			{
				position(x + startDx, y + startDy);
				gmxAPI._listeners.dispatchEvent('onEdit', domObj, domObj);
			}
			var downCallback = function(x, y)
			{
				x = gmxAPI.chkPointCenterX(x);
				startDx = xx - x;
				startDy = yy - y;
				isDragged = true;
				gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': isDragged} });
			};
			var upCallback = function()
			{
				gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': false} });
				if(balloon) balloon.setPoint(xx, yy, false);
				obj.setPoint(xx, yy);
				isDragged = false;
			}
			obj.enableDragging(dragCallback, downCallback, upCallback);

			if(balloon) {	// Это все касается балуна для маркера
				var htmlDiv = document.createElement("div");
				htmlDiv.onclick = function(event)
				{
					event = event || window.event;
					var e = gmxAPI.compatTarget(event);
					if (e == htmlDiv)
					{
						setHTMLVisible(false);
						input.focus();
					}
				}
				balloon.div.appendChild(htmlDiv);
				var input = document.createElement("textarea");
				input.style.backgroundColor = "transparent";
				input.style.border = 0;
				input.style.overflow = "hidden";
				var fontSize = 16;
				input.style.fontSize = fontSize + 'px';
				input.setAttribute("wrap", "off");
				input.value = text ? text : "";
				var updateText = function() 
				{ 
					var newText = input.value;
					var rows = 1;
					for (var i = 0; i < newText.length; i++)
						if (newText.charAt(i) == '\n'.charAt(0))
							rows += 1;
					input.rows = rows;
					var lines = newText.split("\n");
					var cols = 2;
					for (var i in lines)
						cols = Math.max(cols, lines[i].length + 3);
					input.cols = cols;
					input.style.width = cols * (fontSize - (gmxAPI.isIE ? 5: 6));
					text = newText;
					if(balloon) balloon.resize();
					updateDOM();
				};
				input.onkeyup = updateText;
				input.onblur = function()
				{
					setHTMLVisible(true);
				}
				input.onmousedown = function(e)
				{
					if (!e)
						e = window.event;
					if (e.stopPropagation)
						e.stopPropagation();
					else
						e.cancelBubble = true;
				}
				if(balloon) balloon.div.appendChild(input);

				var setHTMLVisible = function(flag)
				{
					gmxAPI.setVisible(input, !flag);
					gmxAPI.setVisible(htmlDiv, flag);
					if (flag)
						htmlDiv.innerHTML = (gmxAPI.strip(input.value) == "") ? "&nbsp;" : input.value;
					if(balloon) balloon.resize();
				}

				var balloonVisible = (text && (text != "")) ? true : false;
				setHTMLVisible(balloonVisible);

				var getEventPoint = function(event)
				{
					//var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
					var currPos = gmxAPI.map.getPosition();
					var mapX = currPos['x'];
					var mapY = currPos['y'];
					var scale = gmxAPI.getScale(currPos['z']);
					var px = gmxAPI.eventX(event) - gmxAPI.contDivPos['x']; 
					var py = gmxAPI.eventY(event) - gmxAPI.contDivPos['y'];
					return {
						'x': gmxAPI.from_merc_x(mapX + (px - gmxAPI._div.clientWidth/2)*scale)
						,
						'y': gmxAPI.from_merc_y(mapY - (py - gmxAPI._div.clientHeight/2)*scale)
					};
				}
				
				balloon.outerDiv.onmousedown = function(event)
				{
					gmxAPI._cmdProxy('startDrawing');
					gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': true} });
					var eventPoint = getEventPoint(event);
					downCallback(eventPoint['x'], eventPoint['y']);
					gmxAPI._startDrag(obj, dragCallback, upCallback);
					return false;
				}
				balloon.outerDiv.onmouseup = function(event)
				{
					gmxAPI._cmdProxy('stopDrawing');
					gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'POINT', 'isDraging': false} });
					gmxAPI._stopDrag();
					upCallback();
				}
				balloon.outerDiv.onmousemove = function(event)
				{
					if (isDragged)
					{
						var eventPoint = getEventPoint(event);
						position(startDx + eventPoint['x'], startDy + eventPoint['y']);
						gmxAPI.deselect();
						return false;
					}
				}
			}

			domObj = createDOMObject(ret);
			domObj.objectId = obj.objectId;
			position(xx, yy);
			if(balloon) {
				balloon.setVisible(balloonVisible);
				updateText();
			}
			gmxAPI._listeners.dispatchEvent('onAdd', domObj, domObj);

			ret.setVisible(ret.isVisible);
			gmxAPI._listeners.dispatchEvent('onFinish', gmxAPI.map.drawing, domObj);
		}

		if (!coords)
		{
			gmxAPI._sunscreen.bringToTop();
			gmxAPI._sunscreen.setVisible(true);
			var apiBase = gmxAPI.getAPIFolderRoot();
			gmxAPI.map.setCursor(apiBase + "img/flag_blau1.png", -6, -36);
			gmxAPI._setToolHandler("onClick", function() 
			{
				done(gmxAPI.map.getMouseX(), gmxAPI.map.getMouseY());
				if(toolsContainer) {
					toolsContainer.selectTool("move");
					if (gmxAPI.map.isKeyDown(16)) {
						toolsContainer.selectTool("POINT");
					}
				}
				ret.stopDrawing();
			});
		}
		else
			done(coords[0], coords[1]);

		return ret;
	}

	drawFunctions.LINESTRING = function(coords, props)
	{
		if (!props)
			props = {};

		var text = props.text;
		if (!text)
			text = "";

		var ret = {};
		var domObj = false;

		var toolsContainer = null;
		if('_tools' in gmxAPI && 'standart' in gmxAPI._tools) {
			toolsContainer = gmxAPI._tools['standart'];
			toolsContainer.currentlyDrawnObject = ret;
		}

		var propsBalloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.propsBalloon : null);

		var obj = gmxAPI.map.addObject();
		obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);
		obj.setEditable(true);
		
		// Проверка пользовательских Listeners LINESTRING
		var chkEvent = function(eType, out)
		{
			if(gmxAPI.map.drawing.enabledHoverBalloon) {
				var st = (out ? out : false);
				propsBalloon.updatePropsBalloon(st);
			}
			gmxAPI._listeners.dispatchEvent(eType, domObj, domObj);
			gmxAPI._listeners.dispatchEvent(eType, gmxAPI.map.drawing, domObj);
		}
		
		var needMouseOver = true;
		obj.setHandlers({
			onEdit: function()
			{
				var eventName = 'onEdit';
				if (!domObj) {
					domObj = createDOMObject(ret, props);
					domObj.objectId = obj.objectId;
					eventName = 'onAdd';
				}
				callOnChange();
				chkEvent(eventName, false);
			},
			onFinish: function()
			{
				callOnChange();
				gmxAPI._listeners.dispatchEvent('onFinish', domObj, domObj);
				gmxAPI._listeners.dispatchEvent('onFinish', gmxAPI.map.drawing, domObj);
				if(domObj.geometry && toolsContainer) toolsContainer.selectTool("move");
			},
			onRemove: function()
			{
				ret.remove();
			},
			onNodeMouseOver: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				var out = '';
				var type = obj.getGeometryType();
				if (type == "LINESTRING") out = gmxAPI.prettifyDistance(obj.getIntermediateLength());
				else if (type == "POLYGON")	out = obj.getGeometrySummary();
				chkEvent('onNodeMouseOver', out);
				if(needMouseOver) gmxAPI._listeners.dispatchEvent('onMouseOver', domObj, domObj);
				needMouseOver = false;
			},
			onNodeMouseOut: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onNodeMouseOut', false);
				if(!needMouseOver) gmxAPI._listeners.dispatchEvent('onMouseOut', domObj, domObj);
				needMouseOver = true;
			},
			onEdgeMouseOver: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onEdgeMouseOver', gmxAPI.prettifyDistance(obj.getCurrentEdgeLength()));
				if(needMouseOver) gmxAPI._listeners.dispatchEvent('onMouseOver', domObj, domObj);
				needMouseOver = false;
			},
			onEdgeMouseOut: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onEdgeMouseOut', false);
				if(!needMouseOver) gmxAPI._listeners.dispatchEvent('onMouseOut', domObj, domObj);
				needMouseOver = true;
			}
		});

		ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;
		ret.setVisible = function(flag) 
		{ 
			obj.setVisible(flag);
			ret.isVisible = flag;
		}
		ret.setVisible(ret.isVisible);

		ret.remove = function()
		{
			obj.remove();
			if (domObj) {
				gmxAPI._listeners.dispatchEvent('onRemove', domObj, domObj);
				domObj.removeInternal();
			}
		}

		ret.setText = function(newText)
		{
			text = newText;
			callOnChange();
		}

		ret.setStyle = function(regularStyle, hoveredStyle) 
		{
			obj.setStyle(regularStyle, hoveredStyle);
		}

		ret.getVisibleStyle = function() { return obj.getVisibleStyle(); };
		ret.getStyle = function(removeDefaults) { return getStyle(removeDefaults, obj); };

		var callOnChange = function()
		{
			var geom = obj.getGeometry();
			if(domObj) domObj.update(geom, text);
		}

		ret.stopDrawing = function()
		{
			obj.stopDrawing();
		}

		if (coords)
		{
			domObj = createDOMObject(ret, props);
			domObj.objectId = obj.objectId;
			obj.setGeometry({ type: "LINESTRING", coordinates: coords });
			callOnChange();
		}
		else
		{
			obj.startDrawing("LINESTRING");
		}

		return ret;
	}


	drawFunctions.POLYGON = function(coords, props)
	{
		if (gmxAPI.isRectangle(coords))
			return drawFunctions.FRAME(coords, props);

		if (!props)
			props = {};

		var text = props.text;
		if (!text)
			text = "";

		var ret = {};
		var domObj = false;
		var toolsContainer = null;
		if('_tools' in gmxAPI && 'standart' in gmxAPI._tools) {
			toolsContainer = gmxAPI._tools['standart'];
			toolsContainer.currentlyDrawnObject = ret;
		}
		
		var propsBalloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.propsBalloon : null);
		var obj = gmxAPI.map.addObject();
		obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);
		obj.setEditable(true);

		// Проверка пользовательских Listeners POLYGON
		var chkEvent = function(eType, out)
		{
			if(gmxAPI.map.drawing.enabledHoverBalloon) {
				var st = (out ? out : false);
				propsBalloon.updatePropsBalloon(st);
			}
			gmxAPI._listeners.dispatchEvent(eType, domObj, domObj);
			gmxAPI._listeners.dispatchEvent(eType, gmxAPI.map.drawing, domObj);
		}

		var needMouseOver = true;
		obj.setHandlers({
			onEdit: function()
			{
				var eventName = 'onEdit';
				if (!domObj) {
					domObj = createDOMObject(ret, props);
					domObj.objectId = obj.objectId;
					eventName = 'onAdd';
				}
				callOnChange();
				chkEvent(eventName, false);
			},
			onFinish: function()
			{
				gmxAPI._listeners.dispatchEvent('onFinish', domObj, domObj);
				gmxAPI._listeners.dispatchEvent('onFinish', gmxAPI.map.drawing, domObj);
				if(domObj.geometry && toolsContainer) toolsContainer.selectTool("move");
			},
			onRemove: function()
			{
				ret.remove();
			},
			onNodeMouseOver: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onNodeMouseOver', obj.getGeometrySummary());
				if(needMouseOver) gmxAPI._listeners.dispatchEvent('onMouseOver', domObj, domObj);
				needMouseOver = false;
			},
			onNodeMouseOut: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onNodeMouseOut', false);
				if(!needMouseOver) gmxAPI._listeners.dispatchEvent('onMouseOut', domObj, domObj);
				needMouseOver = true;
			},
			onEdgeMouseOver: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onEdgeMouseOver', gmxAPI.prettifyDistance(obj.getCurrentEdgeLength()));
				if(needMouseOver) gmxAPI._listeners.dispatchEvent('onMouseOver', domObj, domObj);
				needMouseOver = false;
			},
			onEdgeMouseOut: function(cobj, attr)
			{
				if(attr && attr['buttonDown']) return;
				chkEvent('onEdgeMouseOut', false);
				if(!needMouseOver) gmxAPI._listeners.dispatchEvent('onMouseOut', domObj, domObj);
				needMouseOver = true;
			}
		});

		ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;
		ret.setVisible = function(flag) 
		{ 
			obj.setVisible(flag); 
			ret.isVisible = flag;
		}
		ret.setVisible(ret.isVisible);

		ret.remove = function()
		{
			obj.remove();
			if (domObj) {
				gmxAPI._listeners.dispatchEvent('onRemove', domObj, domObj);
				domObj.removeInternal();
			}
		}

		ret.setText = function(newText)
		{
			text = newText;
			callOnChange();
		}

		ret.setStyle = function(regularStyle, hoveredStyle) 
		{
			obj.setStyle(regularStyle, hoveredStyle);
		}

		ret.getVisibleStyle = function() { return obj.getVisibleStyle(); };
		ret.getStyle = function(removeDefaults) { return getStyle(removeDefaults, obj); };

		var callOnChange = function()
		{
			var geom = obj.getGeometry();
			if(domObj) domObj.update(geom, text);
		}

		ret.stopDrawing = function()
		{
			obj.stopDrawing();
		}

		if (coords)
		{
			for (var i = 0; i < coords.length; i++) {
				var lastNum = coords[i].length - 1; 
				if (coords[i][0][0] == coords[i][lastNum][0] && coords[i][0][1] == coords[i][lastNum][1]) {
					coords[i].pop();	// если последняя точка совпадает с первой удаляем ее
				}
			}

			domObj = createDOMObject(ret, props);
			domObj.objectId = obj.objectId;
			obj.setGeometry({ type: "POLYGON", coordinates: coords });
			callOnChange();
		}
		else
		{
			obj.startDrawing("POLYGON");
		}

		return ret;
	}
	drawFunctions.FRAME = function(coords, props)
	{
		if (!props)
			props = {};

		var text = props.text;
		if (!text)
			text = "";

		var ret = {};
		var domObj;
		var toolsContainer = null;
		if('_tools' in gmxAPI && 'standart' in gmxAPI._tools) {
			toolsContainer = gmxAPI._tools['standart'];
			toolsContainer.currentlyDrawnObject = ret;
		}

		var obj = gmxAPI.map.addObject();
		gmxAPI._cmdProxy('setAPIProperties', { 'obj': obj, 'attr':{'type':'FRAME'} });

		var borders = obj.addObject();
		var corners = obj.addObject();
		var x1, y1, x2, y2;
		var isDraging = false;
		var eventType = '';

		ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;
		ret.setVisible = function(flag)
		{ 
			obj.setVisible(flag); 
			ret.isVisible = flag;
		}
		ret.setVisible(ret.isVisible);

		borders.setStyle(regularDrawingStyle, hoveredDrawingStyle);

		var x1Border = borders.addObject();
		var y1Border = borders.addObject();
		var x2Border = borders.addObject();
		var y2Border = borders.addObject();

		var propsBalloon = (gmxAPI.map.balloonClassObject ? gmxAPI.map.balloonClassObject.propsBalloon : null);
		var mouseUP = function()
		{
			isDraging = false;
			if(propsBalloon) propsBalloon.updatePropsBalloon(false);
			domObj.triggerInternal("onMouseUp");
			chkEvent(null);
			gmxAPI._cmdProxy('stopDrawing');
		}

		corners.setStyle(regularDrawingStyle, hoveredDrawingStyle);

		var x1y1Corner = corners.addObject();
		var x1y2Corner = corners.addObject();
		var x2y1Corner = corners.addObject();
		var x2y2Corner = corners.addObject();

		// Проверка пользовательских Listeners FRAME
		var chkEvent = function()
		{
			gmxAPI._listeners.dispatchEvent(eventType, domObj, domObj);
			gmxAPI._listeners.dispatchEvent(eventType, gmxAPI.map.drawing, domObj);
		}

		function getGeometryTitle(geom)
		{
			var geomType = geom['type'];
			if (geomType.indexOf("POINT") != -1)
			{
				var c = geom.coordinates;
				return "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Координаты:", "Coordinates:") + "</b> " + gmxAPI.LatLon_formatCoordinates(c[0], c[1]);
			}
			else if (geomType.indexOf("LINESTRING") != -1)
				return "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Длина:", "Length:") + "</b> " + gmxAPI.prettifyDistance(gmxAPI.geoLength(geom));
			else if (geomType.indexOf("POLYGON") != -1)
				return "<b>" + gmxAPI.KOSMOSNIMKI_LOCALIZED("Площадь:", "Area:") + "</b> " + gmxAPI.prettifyArea(gmxAPI.geoArea(geom));
			else
				return "?";
		}

		// Высвечивание балуна в зависимости от типа geometry
		var chkBalloon = function(tp)
		{
			if(!isDraging && propsBalloon) {
				var geom = { type: "POLYGON", coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]] };
				if(gmxAPI.map.drawing.enabledHoverBalloon) {
						switch(tp) {
							case 'x1b':
								geom = { type: "LINESTRING", coordinates: [[[x1, y1], [x1, y2]]] };
								break;
							case 'x2b':
								geom = { type: "LINESTRING", coordinates: [[[x2, y1], [x2, y2]]] };
								break;
							case 'y1b':
								geom = { type: "LINESTRING", coordinates: [[[x1, y1], [x2, y1]]] };
								break;
							case 'y2b':
								geom = { type: "LINESTRING", coordinates: [[[x1, y2], [x2, y2]]] };
								break;
						}
					propsBalloon.updatePropsBalloon(getGeometryTitle(geom));
				}
			}
			chkEvent();
		}

		var repaint = function(flag)
		{
			x1Border.setLine([[x1, y1], [x1, y2]]);
			y1Border.setLine([[x1, y1], [x2, y1]]);
			x2Border.setLine([[x2, y1], [x2, y2]]);
			y2Border.setLine([[x1, y2], [x2, y2]]);

			x1y1Corner.setPoint(x1, y1);
			x1y2Corner.setPoint(x1, y2);
			x2y1Corner.setPoint(x2, y1);
			x2y2Corner.setPoint(x2, y2);

			var geom = { type: "POLYGON", coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]] };
			domObj.update(geom, text);
		}
		var mouseHandler = function(ev) { gmxAPI._listeners.dispatchEvent(ev, domObj, domObj); };
		
		var needMouseOver = true;
				if(!needMouseOver) gmxAPI._listeners.dispatchEvent('onMouseOut', domObj, domObj);
				needMouseOver = true;
		x1Border.setHandlers({
			onMouseOver: function() { eventType = 'onEdgeMouseOver'; chkBalloon('x1b'); if(needMouseOver) mouseHandler('onMouseOver'); needMouseOver = false;},
			onMouseOut: function() { eventType = 'onEdgeMouseOut'; if(!isDraging) mouseUP(); if(!needMouseOver) mouseHandler('onMouseOut'); needMouseOver = true;}
		});
		x2Border.setHandlers({
			onMouseOver: function() { eventType = 'onEdgeMouseOver'; chkBalloon('x2b'); if(needMouseOver) mouseHandler('onMouseOver'); needMouseOver = false;},
			onMouseOut: function() { eventType = 'onEdgeMouseOut'; if(!isDraging) mouseUP(); if(!needMouseOver) mouseHandler('onMouseOut'); needMouseOver = true;}
		});
		y1Border.setHandlers({
			onMouseOver: function() { eventType = 'onEdgeMouseOver'; chkBalloon('y1b'); if(needMouseOver) mouseHandler('onMouseOver'); needMouseOver = false;},
			onMouseOut: function() { eventType = 'onEdgeMouseOut'; if(!isDraging) mouseUP(); if(!needMouseOver) mouseHandler('onMouseOut'); needMouseOver = true;}
		});
		y2Border.setHandlers({
			onMouseOver: function() { eventType = 'onEdgeMouseOver'; chkBalloon('y2b'); if(needMouseOver) mouseHandler('onMouseOver'); needMouseOver = false;},
			onMouseOut: function() { eventType = 'onEdgeMouseOut'; if(!isDraging) mouseUP(); if(!needMouseOver) mouseHandler('onMouseOut'); needMouseOver = true;}
		});

		var objHandlerCorner = {
			onMouseOver: function() { eventType = 'onNodeMouseOver'; chkBalloon(); if(needMouseOver) mouseHandler('onMouseOver'); needMouseOver = false;},
			onMouseOut: function() { eventType = 'onNodeMouseOut'; if(!isDraging) mouseUP(); if(!needMouseOver) mouseHandler('onMouseOut'); needMouseOver = true;}
		};
		x1y1Corner.setHandlers(objHandlerCorner);
		x1y2Corner.setHandlers(objHandlerCorner);
		x2y1Corner.setHandlers(objHandlerCorner);
		x2y2Corner.setHandlers(objHandlerCorner);

		var dragMe = function(tp)
		{
			gmxAPI._cmdProxy('startDrawing');
			isDraging = true;
			chkBalloon(tp)
			repaint();
			eventType = 'onEdit';
			chkEvent(null);
			if(propsBalloon && gmxAPI.map.drawing.enabledHoverBalloon) propsBalloon.updatePropsBalloon(false);
		}
		x1Border.enableDragging(function(x, y) { x1 = x; dragMe('x1b'); }, null, mouseUP);
		y1Border.enableDragging(function(x, y) { y1 = y; dragMe('y1b'); }, null, mouseUP);
		x2Border.enableDragging(function(x, y) { x2 = x; dragMe('x2b'); }, null, mouseUP);
		y2Border.enableDragging(function(x, y) { y2 = y; dragMe('y2b'); }, null, mouseUP);

		x1y1Corner.enableDragging(function(x, y) { x1 = x; y1 = y; dragMe(); }, null, mouseUP);
		x1y2Corner.enableDragging(function(x, y) { x1 = x; y2 = y; dragMe(); }, null, mouseUP);
		x2y1Corner.enableDragging(function(x, y) { x2 = x; y1 = y; dragMe(); }, null, mouseUP);
		x2y2Corner.enableDragging(function(x, y) { x2 = x; y2 = y; dragMe(); }, null, mouseUP);

		var created = false;

		ret.remove = function()
		{
			eventType = 'onRemove';
			chkEvent(null);
			obj.remove();
			domObj.removeInternal();
		}

		ret.setStyle = function(regularStyle, hoveredStyle) 
		{
			borders.setStyle(regularStyle, hoveredStyle);
			corners.setStyle(regularStyle, hoveredStyle);
		}

		ret.getVisibleStyle = function(){
			return borders.getVisibleStyle();
		};
		ret.getStyle = function(removeDefaults) { return getStyle(removeDefaults, borders); };

		ret.stopDrawing = function()
		{
			gmxAPI._cmdProxy('stopDrawing');
			gmxAPI.map.unfreeze();
			gmxAPI._sunscreen.setVisible(false);
			gmxAPI._setToolHandler("onMouseDown", null);
		}

		ret.setText = function(newText)
		{
			text = newText;
			repaint();
		}

		if (coords)
		{
			x1 = coords[0][0][0];
			y1 = coords[0][0][1];
			x2 = coords[0][2][0];
			y2 = coords[0][2][1];
			domObj = createDOMObject(ret, props);
			domObj.objectId = obj.objectId;
			repaint();
			eventType = 'onAdd';
			chkEvent(null);
		}
		else
		{
			gmxAPI._sunscreen.bringToTop();
			gmxAPI._sunscreen.setVisible(true);
			gmxAPI.map.enableDragging(
				function(x, y)
				{
					gmxAPI._cmdProxy('startDrawing');
					isDraging = true;
					x2 = x;
					y2 = y;
					eventType = 'onEdit';
					if (!created) {
						domObj = createDOMObject(ret, props);
						domObj.objectId = obj.objectId;
						eventType = 'onAdd';
					}
					chkEvent(null);
					created = true;
					repaint();
				},
				function(x, y)
				{
					x1 = x;
					y1 = y;
				},
				function()
				{
					gmxAPI._cmdProxy('stopDrawing');
					isDraging = false;
					if(propsBalloon) propsBalloon.updatePropsBalloon(false);
					gmxAPI._setToolHandler("onMouseDown", null);
					if(toolsContainer) toolsContainer.selectTool("move");
					if(domObj) domObj.triggerInternal("onMouseUp");
					eventType = 'onFinish';
					chkEvent(null);
				}
			);
		}

		return ret;
	}

	drawFunctions.zoom = function()
	{
		var x1, y1, x2, y2;
		var rect;
		var toolsContainer = null;
		if('_tools' in gmxAPI && 'standart' in gmxAPI._tools) {
			toolsContainer = gmxAPI._tools['standart'];
		}

		var ret = {
			stopDrawing: function()
			{
				gmxAPI._setToolHandler("onMouseDown", null);
			}
		}
		gmxAPI.map.enableDragging(
			function(x, y)
			{
				x2 = x;
				y2 = y;
				rect.setRectangle(x1, y1, x2, y2);
			},
			function(x, y)
			{
				x1 = x;
				y1 = y;
				rect = gmxAPI.map.addObject();
				rect.setStyle({ outline: { color: 0xa0a0a0, thickness: 1, opacity: 70 } });
			},
			function()
			{
				var d = 10*gmxAPI.getScale(gmxAPI.map.getZ());
				if (!x1 || !x2 || !y1 || !y2 || ((Math.abs(gmxAPI.merc_x(x1) - gmxAPI.merc_x(x2)) < d) && (Math.abs(gmxAPI.merc_y(y1) - gmxAPI.merc_y(y2)) < d)))
					gmxAPI.map.zoomBy(1, true);
				else
					gmxAPI.map.slideToExtent(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
				rect.remove();
				gmxAPI._listeners.dispatchEvent('onFinish', gmxAPI.map.drawing, null);
				if(toolsContainer) toolsContainer.selectTool("move");
			}
		);
		return ret;
	}

	drawFunctions["move"] = function()
	{
	}

	var drawing = {
		handlers: { onAdd: [], onEdit: [], onRemove: [] },
		mouseState: 'up',
		endDrawing: endDrawing,
		stateListeners: {},
		addListener: function(eventName, func) { return gmxAPI._listeners.addListener({'obj': this, 'eventName': eventName, 'func': func}); },
		removeListener: function(eventName, id)	{ return gmxAPI._listeners.removeListener(this, eventName, id); },
		enabledHoverBalloon: true,
		enableHoverBalloon: function()
			{
				this.enabledHoverBalloon = true;
			}
		,
		disableHoverBalloon: function()
			{
				this.enabledHoverBalloon = false;
			}
		,				
		//props опционально
		addObject: function(geom, props)
		{
			if (geom.type.indexOf("MULTI") != -1)
			{
				for (var i = 0; i < geom.coordinates.length; i++)
					this.addObject(
						{ 
							type: geom.type.replace("MULTI", ""),
							coordinates: geom.coordinates[i]
						},
						props
					);
			}
			else
			{
				var o = drawFunctions[geom.type](geom.coordinates, props);
				//gmxAPI._tools['standart'].selectTool("move");
				return o.domObj;
			}
		},
		
		//поддерживаются events: onAdd, onRemove, onEdit
		//onRemove вызывается непосредственно ПЕРЕД удалением объекта
		//для FRAME поддерживается event onMouseUp - завершение изменения формы рамки
		setHandler: function(eventName, callback)
		{
			if (!(eventName in this.handlers)) 
				this.handlers[eventName] = [];
				
			this.handlers[eventName].push(callback);
		},
		setHandlers: function(handlers)
		{
			for (var eventName in handlers)
				this.setHandler(eventName, handlers[eventName]);
		},
		forEachObject: function(callback)
		{
			if(!callback) return;
			for (var id in objects) {
				var cObj = objects[id];
				if(cObj.geometry) callback(cObj);
			}
		}
		,
		toolInitFlags: {
        }
		,
		tools: { 
			setVisible: function(flag) 
			{ 
				if('toolsAll' in gmxAPI.map && 'standartTools' in gmxAPI.map.toolsAll) gmxAPI.map.toolsAll.standartTools.setVisible(flag);
			}
            ,_setVisibleTool: function(id, flag) {
                if(!drawing.toolInitFlags[id]) drawing.toolInitFlags[id] = {};
                drawing.toolInitFlags[id].visible = flag;
            }
            ,POINT: {
                setVisible: function(flag) { drawing.tools._setVisibleTool('POINT', flag); }
            }
            ,FRAME: {
                setVisible: function(flag) { drawing.tools._setVisibleTool('FRAME', flag); }
            }
            ,LINESTRING: {
                setVisible: function(flag) { drawing.tools._setVisibleTool('LINESTRING', flag); }
            }
		}
		,
		addTool: function(tn, hint, regularImageUrl, activeImageUrl, onClick, onCancel)
		{
			var standartTools = (gmxAPI._tools.standart ? gmxAPI._tools.standart : gmxAPI.map.toolsAll.standartTools);
			var ret = standartTools.addTool(tn, {
				'key': tn,
				'activeStyle': {},
				'regularStyle': {},
				'regularImageUrl': regularImageUrl,
				'activeImageUrl': activeImageUrl,
				'onClick': onClick,
				'onCancel': onCancel,
				'hint': hint
			});
			return ret;
		}
		, 
		removeTool: function(tn)
		{
			if(this.tools[tn]) {
				gmxAPI.map.toolsAll.standartTools.removeTool(tn);
			}
		},
		selectTool: function(toolName)
		{
			gmxAPI._tools['standart'].selectTool(toolName);
		}
	}

	//расширяем namespace
    gmxAPI._drawFunctions = drawFunctions;
    gmxAPI._drawing = drawing;

})();
;/* ======================================================================
    Temporal.js
   ====================================================================== */

//Управление временными тайлами
(function()
{
	var TemporalTiles =	function(obj_)		// атрибуты временных тайлов
	{
		var mapObj = obj_,              // Мультивременной слой
            prop = mapObj.properties,   // Свойства слоя от сервера
            TimeTemporal = true,        // Добавлять время в фильтры - пока только для поля layer.properties.TemporalColumnName == 'DateTime'
            oneDay = 1000*60*60*24,     // один день
            temporalData = null,
            currentData = {},           // список тайлов для текущего daysDelta
            ZeroDateString = prop.ZeroDate || '01.01.2008', // нулевая дата
            arr = ZeroDateString.split('.'),
            zn = new Date(  // Начальная дата
                (arr.length > 2 ? arr[2] : 2008),
                (arr.length > 1 ? arr[1] - 1 : 0),
                (arr.length > 0 ? arr[0] : 1)
            ),
            ZeroDate = new Date(zn.getTime()  - zn.getTimezoneOffset()*60000),  // UTC начальная дата шкалы
            hostName = prop.hostName || 'maps.kosmosnimki.ru',
            baseAddress = "http://" + hostName + "/",
            layerName = prop.name || prop.image,
            sessionKey = isRequiredAPIKey( hostName ) ? window.KOSMOSNIMKI_SESSION_KEY : false,
            sessionKey2 = ('sessionKeyCache' in window ? window.sessionKeyCache[prop.mapName] : false),
            prefix = baseAddress + 
                "TileSender.ashx?ModeKey=tile" + 
                "&MapName=" + encodeURIComponent(prop.mapName) + 
                "&LayerName=" + encodeURIComponent(layerName) + 
                (sessionKey ? ("&key=" + encodeURIComponent(sessionKey)) : "") +
                (sessionKey2 ? ("&MapSessionKey=" + encodeURIComponent(sessionKey2)) : "");
        if(prop._TemporalDebugPath) {
            prefix = prop._TemporalDebugPath;
            //temporalData['_TemporalDebugPath'] = prop._TemporalDebugPath;
        }
        var identityField = prop.identityField;
        var TemporalColumnName = prop.TemporalColumnName || 'Date';
        
        // Начальный интервал дат
        var DateEnd = new Date();
        if(prop.DateEnd) {
            var arr = prop.DateEnd.split('.');
            if(arr.length > 2) DateEnd = new Date(arr[2], arr[1] - 1, arr[0]);
        }
        var DateBegin = new Date(DateEnd - oneDay);

		// Формирование Hash списка версий тайлов мультивременного слоя
		function getTilesHash(prop, ph)
		{
			var tdata = prpTemporalTiles(prop.TemporalTiles, prop.TemporalVers, ph);
			var currentData = this.temporalData.currentData;
			var data = getDateIntervalTiles(currentData.dt1, currentData.dt2, tdata);

			var out = {'hash':{}, 'del': {}, 'add': [], 'count': 0 };
			var ptAdd = {};
			for (var key in data.TilesVersionHash) {
				if(!currentData.TilesVersionHash[key]) {
					var arr = key.split('_');
					var st = arr[0] + '_' + arr[1] + '_' + arr[2];
					ptAdd[st] = true;
					out.del[arr[2] + '_' + arr[0] + '_' + arr[1]] = true;
				}
			}
			for (var key in currentData.TilesVersionHash) {
				if(!data.TilesVersionHash[key]) {
					var arr = key.split('_');
					out.del[arr[2] + '_' + arr[0] + '_' + arr[1]] = true;
				}
			}
			for (var key in ptAdd) {
				var arr = key.split('_');
				out.add.push([arr[0], arr[1], arr[2]]);
			}
			out.count = data.dtiles.length / 3;
			out.dtiles = data.dtiles;
			out.ut1 = data.ut1;
			out.ut2 = data.ut2;
			this.temporalData = tdata;						// Обновление temporalData
			this.temporalData.currentData = data;
			return out;
		}
		this.getTilesHash = getTilesHash;

		function prpTemporalTiles(data, vers) {
			var deltaArr = [],      // интервалы временных тайлов [8, 16, 32, 64, 128, 256]
                deltaHash = {},
                ph = {};
            //var arr = [];
            if(!vers) vers = [];
            if(!data) data = [];

            for (var i = 0, len = data.length; i < len; i++) {
                var arr1 = data[i];
                if(!arr1 || !arr1.length || arr1.length < 5) {
                    gmxAPI.addDebugWarnings({'func': 'prpTemporalTiles', 'layer': prop.title, 'alert': 'Error in TemporalTiles array - line: '+nm+''});
                    continue;
                }
                var z = Number(arr1[4]),
                    y = Number(arr1[3]),
                    x = Number(arr1[2]),
                    s = Number(arr1[1]),
                    d = Number(arr1[0]),
                    v = Number(vers[i]),
                    gmxTileKey = z + '_' + x + '_' + y + '_' + v + '_' + s + '_' + d;
                    
                //tiles[gmxTileKey] = {x: x, y: y, z: z, s: s, d: d};
                if (!ph[z]) ph[z] = {};
                if (!ph[z][x]) ph[z][x] = {};
                if (!ph[z][x][y]) ph[z][x][y] = [];
                ph[z][x][y].push(arr1);
                if (!deltaHash[d]) deltaHash[d] = {};
                if (!deltaHash[d][s]) deltaHash[d][s] = [];
                deltaHash[d][s].push([x, y, z, v]);
            }

            var arr = [];
            for (var z in ph)
                for (var x in ph[z])
                    for (var y in ph[z][x])
                        arr.push(x, y, z);

            for (var delta in deltaHash) deltaArr.push(parseInt(delta));
            deltaArr = deltaArr.sort(function (a,b) { return a - b;});
            return {dateTiles: arr, hash: ph, deltaHash: deltaHash, deltaArr: deltaArr};
        }

        temporalData = prpTemporalTiles(prop.TemporalTiles, prop.TemporalVers);

        this.temporalData = temporalData;

        var prpTemporalFilter = function(DateBegin, DateEnd, columnName)	// Подготовка строки фильтра
        {
            var dt1 = DateBegin;		// начало периода
            var dt2 = DateEnd;			// конец периода
            return {
                'dt1': dt1
                ,'dt2': dt2
                ,'ut1': Math.floor(dt1.getTime() / 1000)
                ,'ut2': Math.floor(dt2.getTime() / 1000)
            };
        }

		var getDateIntervalTiles = function(dt1, dt2, tdata) {			// Расчет вариантов от begDate до endDate
			var days = parseInt(1 + (dt2 - dt1)/oneDay);
			var minFiles = 1000;
			var outHash = {};

			function getFiles(daysDelta) {
				var ph = {'files': [], 'dtiles': [], 'tiles': {}, 'TilesVersionHash': {}, 'out': ''};
				var mn = oneDay * daysDelta;
				var zn = parseInt((dt1 - ZeroDate)/mn);
				ph.beg = zn;
				ph.begDate = new Date(ZeroDate.getTime() + daysDelta * zn * oneDay);
				zn = parseInt(zn);
				var zn1 = Math.floor((dt2 - ZeroDate)/mn);
				ph.end = zn1;
				ph.endDate = new Date(ZeroDate.getTime() + daysDelta * oneDay * (zn1 + 1) - 1000);
				zn1 = parseInt(zn1);
				
				var dHash = tdata.deltaHash[daysDelta] || {};
				for (var dz in dHash) {
					if(dz < zn || dz > zn1) continue;
					var arr = dHash[dz] || [];
					for (var i=0; i<arr.length; i++)
					{
						var pt = arr[i];
						var x = pt[0];
						var y = pt[1];
						var z = pt[2];
						var v = pt[3];
						var file = prefix + "&Level=" + daysDelta + "&Span=" + dz + "&z=" + z + "&x=" + x + "&y=" + y + "&v=" + v;
						//if(_TemporalDebugPath) file = _prefix + daysDelta + '/' + dz + '/' + z + '/' + x + '/' + z + '_' + x + '_' + y + '.swf'; // тайлы расположены в WEB папке
						if(!ph.tiles[z]) ph.tiles[z] = {};
						if(!ph.tiles[z][x]) ph.tiles[z][x] = {};
						if(!ph.tiles[z][x][y]) ph.tiles[z][x][y] = [];
						ph.tiles[z][x][y].push(file);
						ph.files.push(file);
						var st = x + '_' + y + '_' + z + '_' + daysDelta + '_' + dz + '_' + v;
						ph.TilesVersionHash[st] = true;
					}
				}
				
				var arr = [];
				for (var z in ph.tiles)
					for (var i in ph.tiles[z])
						for (var j in ph.tiles[z][i])
							arr.push(i, j, z);
				ph.dtiles = arr;
				return ph;
			}

			var deltaArr = tdata.deltaArr;
			var i = deltaArr.length - 1;
			var curDaysDelta = deltaArr[i];
			while (i>=0)
			{
				curDaysDelta = deltaArr[i];
				if(days >= deltaArr[i]) {
					break;
				}
				i--;
			}
			var ph = getFiles(curDaysDelta);
			minFiles = ph.files.length;

			var hash = prpTemporalFilter(dt1, dt2, TemporalColumnName);
			
			var tileDateFunction = function(i, j, z)
			{ 
				var filesHash = ph.tiles || {};
				var outArr = [];
				if(filesHash[z] && filesHash[z][i] && filesHash[z][i][j]) {
					outArr = filesHash[z][i][j];
				}
				return outArr;
			}

			var out = {
					'daysDelta': curDaysDelta
					,'files': ph.files
					,'tiles': ph.tiles
					,'dtiles': ph.dtiles || []		// список тайлов для daysDelta
					,'out': ph.out
					,'beg': ph.beg
					,'end': ph.end
					,'begDate': ph.begDate
					,'endDate': ph.endDate
					,'ut1': hash.ut1
					,'ut2': hash.ut2
					,'dt1': dt1
					,'dt2': dt2
					,'tileDateFunction': tileDateFunction
					,'TilesVersionHash': ph.TilesVersionHash
				};

			return out;
		}
		this.getDateIntervalTiles = getDateIntervalTiles;

		var ddt1 = new Date(); ddt1.setHours(0, 0, 0, 0);		// начало текущих суток
		ddt1 = new Date(ddt1.getTime() - ddt1.getTimezoneOffset()*60000);	// UTC начальная дата
		var ddt2 = new Date(); ddt2.setHours(23, 59, 59, 999);	// конец текущих суток
		ddt2 = new Date(ddt2.getTime() - ddt2.getTimezoneOffset()*60000);	// UTC
		temporalData.currentData = getDateIntervalTiles(ddt1, ddt2, temporalData);	// По умолчанию за текущие сутки

		var me = this;

		var setDateInterval = function(dt1, dt2, tdata)
		{
			if(!tdata) tdata = mapObj._temporalTiles.temporalData;
			var currentData = tdata.currentData;
			if(!dt1) {
				dt1 = currentData.dt1;
			} else {
				currentData.dt1 = dt1; 
			}
			if(!dt2) {
				dt2 = currentData.dt2;
			} else {
				currentData.dt2 = dt2; 
			}

			var oldDt1 = currentData.begDate;
			var oldDt2 = currentData.endDate;
			var oldDaysDelta = currentData.daysDelta;

			var hash = prpTemporalFilter(dt1, dt2, TemporalColumnName);
			var ddt1 = hash.dt1;
			var ddt2 = hash.dt2;
			var data = getDateIntervalTiles(ddt1, ddt2, tdata);
			tdata.currentData = data;
			//mapObj._temporalTiles.temporalData['currentData'] = data;
			if(!mapObj.isVisible) return;

			var attr = {
				dtiles: (data.dtiles ? data.dtiles : []),
				ut1: data.ut1,
				ut2: data.ut2
			};
			if(oldDaysDelta == data.daysDelta && data.dt1 >= oldDt1 && data.dt2 <= oldDt2) {
						// если интервал временных тайлов не изменился и интервал дат не расширяется - только добавление новых тайлов 
				attr.notClear = true;
			} else {
				if(mapObj.tilesParent) {
					mapObj.tilesParent.clearItems();
				}
			}

			resetTiles(attr, mapObj);
			gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map, {'from':mapObj.objectId});	// Проверка map Listeners на hideBalloons
			return data.daysDelta;
		}
		this.setDateInterval = setDateInterval;
		
		var tileDateFunction = function(i, j, z)
		{ 
			var tdata = mapObj._temporalTiles.temporalData;
			var currentData = tdata.currentData;
			var filesHash = currentData.tiles || {};
			var outArr = [];
			if(filesHash[z] && filesHash[z][i] && filesHash[z][i][j]) {
				outArr = filesHash[z][i][j];
			}
			return outArr;
		}
		var setVectorTiles = function()
		{
			var tdata = mapObj._temporalTiles.temporalData;
			var currentData = tdata.currentData;
			var ph = {
				'tileDateFunction': tileDateFunction,
				'dtiles': (currentData.dtiles ? currentData.dtiles : []),
				'temporal': {
					'TemporalColumnName': TemporalColumnName
					,'ut1': currentData.ut1
					,'ut2': currentData.ut2
				}
			};
			mapObj.setVectorTiles(ph.tileDateFunction, identityField, ph.dtiles, ph.temporal);
		}
		this.setVectorTiles = setVectorTiles;

		startLoadTiles = function(attr, obj) {
			var ret = gmxAPI._cmdProxy('startLoadTiles', { 'obj': obj, 'attr':attr });
			return ret;
		}

		this.ut1Prev = 0;
		this.ut2Prev = 0;
		resetTiles = function(attr, obj) {
			if(attr) {
				startLoadTiles(attr, obj);
				if(attr.ut1 == obj._temporalTiles.ut1Prev && attr.ut2 == obj._temporalTiles.ut2Prev) return;
				obj._temporalTiles.ut1Prev = attr.ut1;
				obj._temporalTiles.ut2Prev = attr.ut2;
			}
			for (var i=0; i<obj.filters.length; i++)	{ // переустановка фильтров
				var filt = obj.filters[i];
				if(filt && 'setFilter' in filt) filt.setFilter(filt._sql, true);
			}
		}
        mapObj.setDateInterval = function(dt1, dt2) {
            if(!mapObj._temporalTiles) return false;
            var tdata = mapObj._temporalTiles.temporalData;
            mapObj._temporalTiles.setDateInterval(dt1, dt2, tdata);
            if(!mapObj.isVisible) {
                delete tdata.currentData.begDate;
                delete tdata.currentData.endDate;
            }
            gmxAPI._listeners.dispatchEvent('onChangeDateInterval', mapObj, {'ut1':dt1, 'ut2':dt2});	// Изменился календарик
        };
        mapObj.getDateInterval = function() {
            if(mapObj.properties.type !== 'Vector' || !mapObj._temporalTiles) return null;
            var tdata = mapObj._temporalTiles.temporalData;
            return {
                beginDate: tdata.currentData.dt1
                ,endDate: tdata.currentData.dt2
            };
        };

        mapObj.getTileCounts = function(dt1, dt2) {
            if(mapObj.properties.type !== 'Vector') return 0;
            var tdata = mapObj.properties.tiles;
            var thash = null;
            if(mapObj._temporalTiles) {
                var pt = mapObj._temporalTiles.getDateIntervalTiles(dt1, dt2, mapObj._temporalTiles.temporalData);
                tdata = pt.dtiles;
                thash = pt.tiles;
            }
            return gmxAPI.filterVisibleTiles(tdata, thash);
        };

        // Добавление прослушивателей событий
        mapObj.addListener('onChangeVisible', function(flag) {
            if(flag) {
                mapObj.setDateInterval(
                    mapObj.dt1 || me.temporalData.currentData.dt1
                    ,mapObj.dt2 || me.temporalData.currentData.dt2
                );
                delete mapObj.dt1;
                delete mapObj.dt2;
            }
            //gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map, {'from':mapObj.objectId});	// Проверка map Listeners на hideBalloons
        });
        mapObj.addListener('onLayer', function(obj) {
            var currentData = obj._temporalTiles.temporalData.currentData;
            obj.setDateInterval(currentData.dt1, currentData.dt2);
        });
    }
    //расширяем namespace
    gmxAPI._TemporalTiles = TemporalTiles;
})();
;/* ======================================================================
    Clusters.js
   ====================================================================== */

//Управление клиентской кластеризацией 
(function()
{
	var countKeyName = gmxAPI.KOSMOSNIMKI_LOCALIZED("Количество", "Count");
	var RenderStyle = {		// стили кластеров
		marker: { image: 'http://images.kosmosnimki.ru/clusters/cluster_circ.png', center: true, minScale: 0.5, maxScale: 2, scale: '['+countKeyName+']/50' },
		label: { size: 12, align:'center', color: 0xff00ff, haloColor: 0xffffff, value:'[Метка]', field: countKeyName }
	};
	var HoverStyle = {		// стили кластеров при наведении
		marker: { image: 'http://images.kosmosnimki.ru/clusters/cluster_circ_hov.png', center: true, minScale: 0.5, maxScale: 2, scale: '['+countKeyName+']/50' },
		label: { size: 12, align:'center', color: 0xff0000, haloColor: 0xffffff, value:'[Метка]', field: countKeyName }
	};

	var newProperties = {						// Заполняемые поля properties кластеров
	};
	newProperties[countKeyName] = '[objectInCluster]';	// objectInCluster - количество обьектов попавших в кластер (по умолчанию 'Количество')

	var defaultAttr = {
		'radius': 20,
		'iterationCount': 1,
		'newProperties': newProperties,			// Заполняемые поля properties кластеров
		'RenderStyle': RenderStyle,				// стили кластеров
		'HoverStyle': HoverStyle,				// стили кластеров при наведении
		'clusterView': {},						// Атрибуты отображения членов кластера (при null не отображать)
		'visible': false
	};
	
	var _chkAttr = function(data)
	{
		if(data['radius'] < 1) data['radius'] = 20;
		if(!data['RenderStyle']) data['RenderStyle'] = RenderStyle;
		if(!data['HoverStyle']) data['HoverStyle'] = HoverStyle;
		if(!data['clusterView']) data['clusterView'] = {};
		if(!data['newProperties']) data['newProperties'] = newProperties;
		return data;
	}

	var Clusters =	function(parent)		// атрибуты кластеризации потомков
	{
		this._parent = parent;
		this._attr = gmxAPI.clone(defaultAttr);

		// Добавление прослушивателей событий
		var me = this;
		var evID = null;
		var chkFilter = function(data)
		{
			if(evID) parent.parent.removeListener('onLayer', evID);
			var filter = me._parent;
			if(!filter['clusters'] || !filter['clusters']['attr']) return;	// Кластеризация не устанавливалась
			filter.setClusters(filter['clusters']['attr']);
		}
		evID = parent.parent.addListener('onLayer', chkFilter); // Отложенная установка кластеризации

	};
	Clusters.prototype = {
		'_chkToFlash':	function() {
			if(this._attr.visible && this._parent) gmxAPI._cmdProxy('setClusters', { 'obj': this._parent, 'attr': this._attr });
		}
		,
		'setClustersBalloon':	function(func) {
			this.textFunc = func;
		}
		,
		'getTextFunc':	function() {
			var me = this;
			return this.textFunc || function(o, div)
			{
				var text = "";
				var nProp = me.getProperties();
				var props = o.properties;
				for (var key in nProp)
				{
					var value = "" + props[key];
					if (value.indexOf("http://") == 0)
						value = "<a href='" + value + "'>" + value + "</a>";
					else if (value.indexOf("www.") == 0)
						value = "<a href='http://" + value + "'>" + value + "</a>";
					text += "<b>" + key + ":</b> " + value + "<br />";
				}
				return text;
			}
		},
		'setProperties':function(prop) { var out = {}; for(key in prop) out[key] = prop[key]; this._attr.newProperties = out; this._chkToFlash(); },
		'getProperties':function() { var out = {}; for(key in this._attr.newProperties) out[key] = this._attr.newProperties[key]; return out; },
		'setStyle':		function(style, hoverStyle) { this._attr.RenderStyle = style; this._attr.HoverStyle = (hoverStyle ? hoverStyle : style); this._chkToFlash(); },
		'getStyle':		function() { var out = {}; if(this._attr.RenderStyle) out.RenderStyle = this._attr.RenderStyle; if(this._attr.HoverStyle) out.HoverStyle = this._attr.HoverStyle; return out; },
		'setRadius':	function(radius) { this._attr.radius = radius; this._chkToFlash(); },
		'getRadius':	function() { return this._attr.radius; },
		'setIterationCount':	function(iterationCount) { this._attr.iterationCount = iterationCount; this._chkToFlash(); },
		'getIterationCount':	function() { return this._attr.iterationCount; },
		'getVisible':	function() { return this._attr.visible; },
		'setVisible':	function(flag) { this._attr.visible = (flag ? true : false); if(this._attr.visible) this._chkToFlash(); else gmxAPI._cmdProxy('delClusters', { 'obj': this._parent }); },
		'setClusterView':	function(hash) { this._attr.clusterView = hash; this._chkToFlash(); },
		'getClusterView':	function() { if(!this._attr.clusterView) return null; var out = {}; for(key in this._attr.clusterView) out[key] = this._attr.clusterView[key]; return out; }
	};

	//расширяем namespace
    gmxAPI._Clusters = Clusters;
    gmxAPI._getDefaultClustersAttr = function() { return defaultAttr; }
	
	//расширяем FlashMapObject
	gmxAPI.extendFMO('setClusters', function(attr) { var ph = (attr ? _chkAttr(attr) : this._attr); return gmxAPI._cmdProxy('setClusters', { 'obj': this, 'attr': ph }); });
	gmxAPI.extendFMO('delClusters', function() { 	if(this.clusters && this.clusters.attr) delete this.clusters.attr; return gmxAPI._cmdProxy('delClusters', { 'obj': this }); });
})();
;/* ======================================================================
    miniMap.js
   ====================================================================== */

//Поддержка miniMap
(function()
{
	var miniMapInit = function(div)
	{
		var apiBase = gmxAPI.getAPIFolderRoot();
		var map = gmxAPI.map;

		var miniMapBorderWidth = 5;
		var miniMapLeftBorder = gmxAPI.newStyledDiv({
			position: "absolute",
			top: 0,
			width: miniMapBorderWidth + "px",
			backgroundColor: "#216B9C",
			opacity: 0.5
		});
		var miniMapBottomBorder = gmxAPI.newStyledDiv({
			position: "absolute",
			right: 0,
			height: miniMapBorderWidth + "px",
			backgroundColor: "#216B9C",
			opacity: 0.5,
			fontSize: 0
		});
		div.appendChild(miniMapLeftBorder);
		div.appendChild(miniMapBottomBorder);
		var repaintMiniMapBorders = function()
		{
			gmxAPI.setVisible(miniMapLeftBorder, gmxAPI.miniMapAvailable && miniMapShown);
			gmxAPI.setVisible(miniMapBottomBorder, gmxAPI.miniMapAvailable && miniMapShown);
		}
		var miniMapFrame = gmxAPI.newStyledDiv({
			position: "absolute",
			backgroundColor: "#216b9c",
			opacity: 0.2
		});
		miniMapFrame.onmousedown = function(event)
		{
			var startMouseX = gmxAPI.eventX(event);
			var startMouseY = gmxAPI.eventY(event);
			
			var currPos = gmxAPI.currPosition || map.getPosition();
			var startMapX = currPos['x'];
			var startMapY = currPos['y'];

			var scale = gmxAPI.getScale(miniMapZ);
			
			var mouseMoveMode = new gmxAPI._HandlerMode(document.documentElement, "mousemove", function(event)
			{
				map.moveTo(
					gmxAPI.from_merc_x(startMapX - (gmxAPI.eventX(event) - startMouseX)*scale), 
					gmxAPI.from_merc_y(startMapY + (gmxAPI.eventY(event) - startMouseY)*scale), 
					map.getZ()
				);
				return false;
			});
			var mouseUpMode = new gmxAPI._HandlerMode(document.documentElement, "mouseup", function(event)
			{
				mouseMoveMode.clear();
				mouseUpMode.clear();
			});
			mouseMoveMode.set();
			mouseUpMode.set();
			return false;
		}
		div.appendChild(miniMapFrame);
		var repaintMiniMapFrame = function()
		{
			gmxAPI.setVisible(miniMapFrame, gmxAPI.miniMapAvailable && miniMapShown);
			var scaleFactor = Math.pow(2, map.getZ() - miniMapZ);
			var w = div.clientWidth/scaleFactor;
			var h = div.clientHeight/scaleFactor;
			if ((w >= miniMapSize) || (h >= miniMapSize))
				gmxAPI.setVisible(miniMapFrame, false);
			else
			{
				var ww = (miniMapSize/2 - w/2);
				var hh = (miniMapSize/2 - h/2);
				var ph = { 'top': hh + 'px', 'bottom': '', 'right': ww + 'px', 'left': '' };	// Позиция миникарты по умолчанию tr(TopRight)
				if(miniMapAlign === 'br') {		// Позиция миникарты br(BottomRight)
					ph['left'] = ''; ph['right'] = ww + 'px';
					ph['bottom'] = hh + 'px';	ph['top'] = '';
				} else if(miniMapAlign === 'bl') {	// Позиция миникарты по умолчанию bl(BottomLeft)
					ph['left'] = ww + 'px';		ph['right'] = '';
					ph['bottom'] = hh + 'px';	ph['top'] = '';
				} else if(miniMapAlign === 'tl') {	// Позиция миникарты по умолчанию tl(TopLeft)
					ph['left'] = (miniMapSize/2 - w/2) + 'px'; ph['right'] = '';
				}
				gmxAPI.setPositionStyle(miniMapFrame, ph);
				gmxAPI.size(miniMapFrame, w, h);
			}
		}
		var miniMapZ = 0;
		//var miniMapAvailable = false;
		var miniMapSize = 0;
		var miniMap = map.addMapWindow(function(z) 
		{ 
			var minZoom = ('zoomControl' in gmxAPI.map ? gmxAPI.map.zoomControl.getMinZoom() : 1);
			miniMapZ = Math.max(minZoom, Math.min(gmxAPI.maxRasterZoom, z + gmxAPI.miniMapZoomDelta));
			try { repaintMiniMapFrame(); } catch (e) {
				gmxAPI.addDebugWarnings({'func': 'repaintMiniMapFrame', 'event': e});
			}
			return miniMapZ;
		});
		var miniMapShown = true;
		miniMap.setOpen = function(flag) 
		{
			miniMapShown = flag;
			miniMapToggler.src = apiBase + (miniMapShown ? "img/close_map_a.png" : "img/open_map_a.png");
			resizeMiniMap();
			gmxAPI._FMO.prototype.setVisible.call(map.miniMap, miniMapShown);
		}
		
		var miniMapToggler = gmxAPI.newElement(
			"img",
			{ 
				className: "gmx_miniMapToggler",
				src: apiBase + "img/close_map.png",
				title: gmxAPI.KOSMOSNIMKI_LOCALIZED("Показать/скрыть мини-карту", "Show/hide minimap"),
				onclick: function()
				{
					miniMapShown = !miniMapShown;
					miniMap.setOpen(miniMapShown);
				},
				onmouseover: function()
				{
					miniMapToggler.src = apiBase + (miniMapShown ? "img/close_map_a.png" : "img/open_map_a.png");
				},
				onmouseout: function()
				{
					miniMapToggler.src = apiBase + (miniMapShown ? "img/close_map.png" : "img/open_map.png");
				}
			},
			{
				position: "absolute",
				right: 0,
				top: 0,
				cursor: "pointer"
			}
		);
		div.appendChild(miniMapToggler);

		var resizeMiniMap = function()
		{
			var w = div.clientWidth;
			var h = div.clientHeight;
			miniMapSize = (gmxAPI.miniMapAvailable && miniMapShown) ? Math.round(w/7) : 0;
			miniMapLeftBorder.style.height = (miniMapSize + miniMapBorderWidth) + "px";
			miniMapBottomBorder.style.width = miniMapSize + "px";
			if(miniMapAlign === 'br') {			// Позиция миникарты br(BottomRight)
				miniMap.positionWindow((w - miniMapSize)/w, (h - miniMapSize)/h, 1, 1);
				gmxAPI.setPositionStyle(miniMapLeftBorder, { 'top': '', 'bottom': '0px', 'right': miniMapSize + 'px', 'left': '' });
				gmxAPI.setPositionStyle(miniMapBottomBorder, { 'top': '', 'bottom': miniMapSize + 'px', 'right': '0px', 'left': '' });
				gmxAPI.setPositionStyle(miniMapToggler, { 'top': '', 'bottom': '0px', 'right': '0px', 'left': '' });
			} else if(miniMapAlign === 'bl') {	// Позиция миникарты по умолчанию bl(BottomLeft)
				miniMap.positionWindow(0, (h - miniMapSize)/h, miniMapSize/w, 1);
				gmxAPI.setPositionStyle(miniMapLeftBorder, { 'top': '', 'bottom': '0px', 'right': '', 'left': miniMapSize + 'px' });
				gmxAPI.setPositionStyle(miniMapBottomBorder, { 'top': '', 'bottom': miniMapSize + 'px', 'right': '', 'left': '0px' });
				gmxAPI.setPositionStyle(miniMapToggler, { 'top': '', 'bottom': '0px', 'right': '', 'left': '0px' });
			} else if(miniMapAlign === 'tl') {	// Позиция миникарты по умолчанию tl(TopLeft)
				miniMap.positionWindow(0, 0, miniMapSize/w, miniMapSize/h);
				gmxAPI.setPositionStyle(miniMapLeftBorder, { 'top': '0px', 'bottom': '', 'right': '', 'left': miniMapSize + 'px' });
				gmxAPI.setPositionStyle(miniMapBottomBorder, { 'top': miniMapSize + 'px', 'bottom': '', 'right': '', 'left': '0px' });
				gmxAPI.setPositionStyle(miniMapToggler, { 'top': '0px', 'bottom': '', 'right': '', 'left': '0px' });
			} else {							// Позиция миникарты по умолчанию tr(TopRight)
				miniMap.positionWindow((w - miniMapSize)/w, 0, 1, miniMapSize/h);
				gmxAPI.setPositionStyle(miniMapLeftBorder, { 'top': '0px', 'bottom': '', 'right': miniMapSize + 'px', 'left': '' });
				gmxAPI.setPositionStyle(miniMapBottomBorder, { 'top': miniMapSize + 'px', 'bottom': '', 'right': '0px', 'left': '' });
				gmxAPI.setPositionStyle(miniMapToggler, { 'top': '0px', 'bottom': '', 'right': '0px', 'left': '' });
			}
			repaintMiniMapBorders();
			repaintMiniMapFrame();
		}
		gmxAPI._resizeMiniMap = resizeMiniMap;

		miniMap.setVisible = function(flag) 
		{ 
			gmxAPI._FMO.prototype.setVisible.call(map.miniMap, flag);
			//FlashMapObject.prototype.setVisible.call(map.miniMap, flag);
			gmxAPI.miniMapAvailable = flag;
			gmxAPI.setVisible(miniMapFrame, flag);
			gmxAPI.setVisible(miniMapToggler, flag);
			resizeMiniMap();
		}
		map.miniMap = miniMap;
		map.miniMap.isMiniMap = true;
		map.miniMap.setBackgroundColor(0xffffff);
		//miniMap.setVisible(false);
		var miniMapAlign = 'tr';
		// Изменить позицию miniMap
		map.setMiniMapAlign = function(attr) {
			if(attr['align']) miniMapAlign = attr['align'];
			resizeMiniMap();
		}
		map.addListener('onResizeMap', resizeMiniMap, -12);
		miniMap.setVisible(false);
	}

	gmxAPI._miniMapInit = miniMapInit;

})();
;/* ======================================================================
    QuicklooksFlash.js
   ====================================================================== */

// Quicklooks
(function()
{
	//FlashMapObject.prototype.enableQuicklooks = function(callback)
	var enableQuicklooks = function(callback)
	{
		var flag = true;

		if (this.shownQuicklooks)
			for (var url in this.shownQuicklooks)
				this.shownQuicklooks[url].remove();
		var shownQuicklooks = {};
		this.shownQuicklooks = shownQuicklooks;

		this.addLook = function(o)
		{
			var identityField = gmxAPI.getIdentityField(o.obj);
			var id = 'id_' + o.obj.properties[identityField];
			if (!shownQuicklooks[id])
			{
				var url = callback(o.obj);
				var d1 = 100000000;
				var d2 = 100000000;
				var d3 = 100000000;
				var d4 = 100000000;
				var x1, y1, x2, y2, x3, y3, x4, y4;
				var geom = o.obj.getGeometry();
				var coord = geom.coordinates;
				gmxAPI.forEachPoint(coord, function(p)
				{
					var x = gmxAPI.merc_x(p[0]);
					var y = gmxAPI.merc_y(p[1]);
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

				var q = o.obj.addObject(null, o.obj.properties);
				shownQuicklooks[id] = q;
				q.setStyle({ fill: { opacity: 100 } });
				q.setImage(url, x1, y1, x2, y2, x3, y3, x4, y4);
			}
			else
			{
				shownQuicklooks[id].remove();
				delete shownQuicklooks[id];
			}
		};

		this.addListener('onClick', this.addLook, -5);
	}

	var enableTiledQuicklooks = function(callback, minZoom, maxZoom, tileSenderPrefix)
	{
		var IsRasterCatalog = this.properties.IsRasterCatalog;
		var identityField = this.properties.identityField;
		this.enableTiledQuicklooksEx(function(o, image)
		{
			var path = callback(o);
			var oBounds = gmxAPI.getBounds(o.geometry.coordinates);
			var boundsType = (oBounds && oBounds.minX < -179.999 && oBounds.maxX > 179.999 ? true : false);
			var func = function(i, j, z) {
				if (boundsType && i < 0) i = -i;
				if (path.indexOf("{") >= 0){
                    return path.replace(new RegExp("{x}", "gi"), i).replace(new RegExp("{y}", "gi"), j).replace(new RegExp("{z}", "gi"), z).replace(new RegExp("{key}", "gi"), encodeURIComponent(window.KOSMOSNIMKI_SESSION_KEY));
				}
				else{
					return path + z + "/" + i + "/" + z + "_" + i + "_" + j + ".jpg";
				}
			};
			if(tileSenderPrefix) {
				var ph = {
					'func': func
					,'projectionCode': 0
					,'minZoom': minZoom
					,'maxZoom': maxZoom
					,'tileSenderPrefix': tileSenderPrefix + (IsRasterCatalog ? '&idr=' + o.properties[identityField] : '')
					,'boundsType': boundsType
					,'quicklooks': true
				};
				gmxAPI._cmdProxy('setBackgroundTiles', {'obj': image, 'attr':ph });
			} else 
			{
				image.setTiles(func);
			}
		}, minZoom, maxZoom);
	}

	var enableTiledQuicklooksEx = function(callback, minZoom, maxZoom)
	{
		if(!minZoom) minZoom = 1;
		if(!maxZoom) maxZoom = 18;
		var images = {};
		if (this.tilesParent)
			this.tilesParent.remove();
		var tilesParent = this.addObject();
		this.tilesParent = tilesParent;
		//gmxAPI._cmdProxy('setAPIProperties', { 'obj': this, 'attr':{'addHiddenFill':true} });	// при отсутствии style.fill дополнить невидимым заполнением - ломает старые проекты
		tilesParent.setZoomBounds(minZoom, maxZoom);
		var propsArray = [];
		tilesParent.clearItems  = function()
		{
			for(id in images) {
				images[id].remove();
			}
			images = {};
			propsArray = [];
		}
			
		tilesParent.setZoomBounds(minZoom, maxZoom);
		tilesParent.observeVectorLayer(this, function(arr)
		{
			var identityField = gmxAPI.getIdentityField(tilesParent);
			for (var j = 0; j < arr.length; j++)
			{
				var o = arr[j].item;
				var flag = (!arr[j].isVisibleFilter ? arr[j].onExtent : false);
				var id = 'id_' + o.properties[identityField];
				if (flag && !images[id])
				{
					var image = tilesParent.addObject(o.geometry, o.properties, {'notRedrawOnDrag':true});
					callback(o, image);
					images[id] = image;
					propsArray.push(o.properties);
				}
				else if (!flag && images[id])
				{
					images[id].remove();
					delete images[id];
					for (var i = 0; i < propsArray.length; i++)
					{
						if (propsArray[i][identityField] == o.properties[identityField])
						{
							propsArray.splice(i, 1);
							break;
						}
					}
				}
			}
			return true;
		});
		var me = this;
		this.addListener('onClick', function(o)
		{
			if('obj' in o)  o = o.obj;
			var idt = 'id_' + o.flip();
			var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
			var curZ = currPos['z'];
			if(images[idt] && curZ >= minZoom && curZ <= maxZoom) images[idt].bringToTop();		// только для zoom со снимками
			gmxAPI._listeners.dispatchEvent('onFlip', me, images[idt]);
			return false;
		}, -5);

		this.bringToTopImage = function(id)			// обьект растрового слоя переместить вверх
		{
			var idt = 'id_' + id;
			if(images[idt]) {
				images[idt].bringToTop();
				return true;
			}
			return false;
		};
	}

	//расширяем FlashMapObject
	gmxAPI._listeners.addListener({'eventName': 'mapInit', 'func': function(map) {
			gmxAPI.extendFMO('observeVectorLayer', function(obj, onChange, attr) { obj.addObserver(this, onChange, attr); } );
			gmxAPI.extendFMO('enableTiledQuicklooksEx', enableTiledQuicklooksEx);
			gmxAPI.extendFMO('enableTiledQuicklooks', enableTiledQuicklooks);
			gmxAPI.extendFMO('enableQuicklooks', enableQuicklooks);
		}
	});
})();
;/* ======================================================================
    flashProxy.js
   ====================================================================== */

//Поддержка Flash
(function()
{
	var addObjects = function(parentId, attr) {
		var out = [];
		var data = attr['arr'];
		var fmt = (attr['format'] ? attr['format'] : 'LatLng');
		for (var i=0; i<data.length; i++)	// Подготовка массива обьектов
		{
			var ph = data[i];
			var props = ph['properties'] || null;
			var tmp = {
				"parentId": parentId,
				"geometry": (fmt == 'LatLng' ? gmxAPI.merc_geometry(ph['geometry']) : ph['geometry']),
				"properties": props
			};
			if(ph['setStyle']) tmp['setStyle'] = ph['setStyle'];
			if(ph['setLabel']) tmp['setLabel'] = ph['setLabel'];
			out.push(tmp);
		}
		var _obj = gmxAPI.flashDiv.cmdFromJS('addObjects', out); // Отправить команду в SWF

		out = [];
		var pObj = gmxAPI.mapNodes[parentId];	// обычный MapObject
		for (var i=0; i<_obj.length; i++)	// Отражение обьектов в JS
		{
			var aObj = new gmxAPI._FMO(_obj[i], data[i].properties, pObj);	// обычный MapObject
			out.push(aObj);
			// пополнение mapNodes
			var currID = (aObj.objectId ? aObj.objectId : gmxAPI.newFlashMapId() + '_gen1');
			gmxAPI.mapNodes[currID] = aObj;
			if(aObj.parent) aObj.parent.childsID[currID] = true; 
		}
		return out;
	}

	// Команды в SWF
	var commands = {				// Тип команды
		'setEditObjects':	function(hash)	{							// Установка редактируемых обьектов слоя
			return gmxAPI.flashDiv.cmdFromJS('setEditObjects', { 'objectId':hash.obj.objectId, 'processing':hash['attr'] } );
		}
		,
		'setVisible':	function(hash)	{								// Изменить видимость обьекта
			if(hash['obj']) {
				gmxAPI.flashDiv.cmdFromJS('setVisible', { 'objectId':hash.obj.objectId, 'flag':hash['attr'] } );
			}
		}
		,
		'sendPNG':	function(hash)	{									// Сохранение изображения карты на сервер
			var miniMapFlag = gmxAPI.miniMapAvailable;
			var attr = hash['attr'];
			var flag = (attr.miniMapSetVisible ? true : false);
			if(miniMapFlag != flag) gmxAPI.map.miniMap.setVisible(flag);
			if(attr.func) attr.func = gmxAPI.uniqueGlobalName(attr.func);
			var ret = {'base64': gmxAPI.flashDiv.cmdFromJS('sendPNG', attr)};
			if(miniMapFlag) gmxAPI.map.miniMap.setVisible(miniMapFlag);
			return ret;
		}
		,
		'savePNG':	function(hash)	{									// Сохранить PNG файл экрана
			return gmxAPI.flashDiv.cmdFromJS('savePNG', hash['attr']);
			//return gmxAPI.flashDiv.cmdFromJS('savePNG', { 'fileName':hash['attr'] });
		}
		,
		'setZoomBounds':	function(hash)	{							// Установить ограничения по Zoom
			return gmxAPI.flashDiv.cmdFromJS('setZoomBounds', { 'objectId':hash.obj.objectId, 'minZ':hash['attr']['minZ'], 'maxZ':hash['attr']['maxZ'] });
		}
		,
		'setClusters':	function(hash)	{								// Установить кластеризацию потомков
			var obj = hash['obj'];
			var attr = hash['attr'];
			var ret = {};
			if(attr && 'newProperties' in attr) {
				var keyArray = [];
				var valArray = [];
				for(key in attr['newProperties'])
				{
					keyArray.push(key);
					valArray.push(attr['newProperties'][key]);
				}
				attr['propFields'] = [keyArray, valArray];
				attr['hideFixedBalloons'] = gmxAPI.uniqueGlobalName(function() { gmxAPI.map.balloonClassObject.hideHoverBalloons(false); });
			}
			var flag = ('clusters' in obj);	// видимость кластеров
			if(!flag)
				obj['clusters'] = new gmxAPI._Clusters(obj);
			else
				ret = gmxAPI.flashDiv.cmdFromJS('setClusters', { 'objectId':obj.objectId, 'data':attr });
			attr['visible'] = flag;
			obj['clusters']['attr'] = attr;		// признак наличия кластеризации в SWF
			//if(!obj.parent._hoverBalloonAttr) obj.parent.enableHoverBalloon();	// если балунов не установлено
			return ret;
		}
		,
		'delClusters':	function(hash)	{								// Удалить кластеризацию потомков
			var obj = hash['obj'];
			var ret = gmxAPI.flashDiv.cmdFromJS('delClusters', { 'objectId':obj.objectId });
			if('clusters' in obj && obj['clusters']['attr']) obj['clusters']['attr']['visible'] = false;
			return ret;
		}
		,
		'setGridVisible':	function(hash)	{							// Изменить видимость сетки
			return gmxAPI.flashDiv.cmdFromJS('setGridVisible', { 'flag':hash['attr'] } );
		}
		,
		'getGridVisibility':	function(hash)	{						// получить видимость сетки
			return gmxAPI.flashDiv.cmdFromJS('getGridVisibility', { } );
		}
		,
		'getZoomBounds':	function(hash)	{							// Получить ограничения по Zoom
			return gmxAPI.flashDiv.cmdFromJS('getZoomBounds', { 'objectId':hash.obj.objectId });
		}
		,
		'getDepth':	function(hash)	{									// Получить индекс обьекта
			return gmxAPI.flashDiv.cmdFromJS('getDepth', { 'objectId':hash.obj.objectId });
		}
		,
		'getVisibility':	function(hash)	{							// Получить видимость
			return gmxAPI.flashDiv.cmdFromJS('getVisibility', { 'objectId':hash.obj.objectId });
		}
		,
		'trace':	function(hash)	{									// Сообщение в SWF
			return gmxAPI.flashDiv.cmdFromJS('trace', { 'data':hash['attr'] });
		}
		,
		'setQuality':	function(hash)	{								// Установка Quality
			return gmxAPI.flashDiv.cmdFromJS('setQuality', { 'data':hash['attr'] });
		}
		,
		'disableCaching':	function(hash)	{	// ????
			return gmxAPI.flashDiv.cmdFromJS('disableCaching', { });
		}
		,
		'print':	function(hash)	{									// Печать
			return gmxAPI.flashDiv.cmdFromJS('print', { });
		}
		,
		'repaint':	function(hash)	{		// ????
			return gmxAPI.flashDiv.cmdFromJS('repaint', { });
		}
		,
		'addContextMenuItem':	function(hash)	{						// Добавить пункт в контекстное меню SWF
			if(hash['attr'].func) hash['attr'].func = gmxAPI.uniqueGlobalName(hash['attr'].func);
			return gmxAPI.flashDiv.cmdFromJS('addContextMenuItem', hash['attr']);
		}
		,
		'moveTo':	function(hash)	{									//позиционирует карту по координатам центра и выбирает масштаб
			var attr = hash['attr'];
			attr['x'] = gmxAPI.merc_x(attr['x']);
			attr['y'] = gmxAPI.merc_y(attr['y']);
			return gmxAPI.flashDiv.cmdFromJS('moveTo', attr);
		}
		,
		'slideTo':	function(hash)	{									//плавно позиционирует карту по координатам центра и выбирает масштаб
			var attr = hash['attr'];
			attr['x'] = gmxAPI.merc_x(attr['x']);
			attr['y'] = gmxAPI.merc_y(attr['y']);
			return gmxAPI.flashDiv.cmdFromJS('slideTo', attr);
		}
		,
		'zoomBy':	function(hash)	{									//выбирает масштаб
			return gmxAPI.flashDiv.cmdFromJS('zoomBy', hash['attr']);
		}
		,
		'freeze':	function(hash)	{									// заморозить
			return gmxAPI.flashDiv.cmdFromJS('freeze', { });
		}
		,
		'unfreeze':	function(hash)	{									// разморозить
			return gmxAPI.flashDiv.cmdFromJS('unfreeze', { });
		}
		,
		'setCursor':	function(hash)	{								//установка курсора
			return gmxAPI.flashDiv.cmdFromJS('setCursor', hash['attr']);
		}
		,
		'clearCursor':	function(hash)	{								//убрать курсор
			return gmxAPI.flashDiv.cmdFromJS('clearCursor', { });
		}
		,
		'setCursorVisible':	function(hash)	{							//видимость курсора
			return gmxAPI.flashDiv.cmdFromJS('setCursorVisible', hash['attr']);
		}
		,
		'stopDragging':	function(hash)	{								//убрать флаг Drag
			return gmxAPI.flashDiv.cmdFromJS('stopDragging', { });
		}
		,
		'isDragging':	function(hash)	{								//получить флаг Drag
			return gmxAPI.flashDiv.cmdFromJS('isDragging', { });
		}
		,
		'resumeDragging':	function(hash)	{							//возобновить Drag
			return gmxAPI.flashDiv.cmdFromJS('resumeDragging', { });
		}
		,
		'getPosition':	function(hash)	{								//получить текущие атрибуты SWF
			return gmxAPI.flashDiv.cmdFromJS('getPosition', { });
		}
		,
		'getX':	function(hash)	{										//получить позицию Х центра SWF
			return gmxAPI.from_merc_x(gmxAPI.flashDiv.cmdFromJS('getX', { }));
		}
		,
		'getY':	function(hash)	{										//получить позицию Y центра SWF
			return gmxAPI.from_merc_y(gmxAPI.flashDiv.cmdFromJS('getY', { }));
		}
		,
		'getZ':	function(hash)	{										//получить текущий Z
			return gmxAPI.flashDiv.cmdFromJS('getZ', { });
		}
		,
		'getMouseX':	function(hash)	{								//получить позицию Х MouseX
			return gmxAPI.from_merc_x(gmxAPI.flashDiv.cmdFromJS('getMouseX', { }));
		}
		,
		'getMouseY':	function(hash)	{								//получить позицию Y MouseY
			return gmxAPI.from_merc_y(gmxAPI.flashDiv.cmdFromJS('getMouseY', { }));
		}
		,
		'isKeyDown':	function(hash)	{								//проверить нажатие клавиши в SWF
			return gmxAPI.flashDiv.cmdFromJS('isKeyDown', hash['attr']);
		}
		,
		'setExtent':	function(hash)	{								//установить Extent в SWF
			var attr = {'x1':gmxAPI.merc_x(hash['attr']['x1']), 'x2':gmxAPI.merc_x(hash['attr']['x2']), 'y1':gmxAPI.merc_y(hash['attr']['y1']), 'y2':gmxAPI.merc_y(hash['attr']['y2']) };
			return gmxAPI.flashDiv.cmdFromJS('setExtent', attr);
		}
		,
		'setMinMaxZoom':	function(hash)	{							//установить Zoom ограничения
			return gmxAPI.flashDiv.cmdFromJS('setMinMaxZoom', hash['attr']);
		}
		,
		'addMapWindow':	function(hash)	{								//Создание окна карты
			var attr = hash['attr'];
			if(attr.callbackName) attr.callbackName = gmxAPI.uniqueGlobalName(attr.callbackName);
			return gmxAPI.flashDiv.cmdFromJS('addMapWindow', attr);
		}
		,
		'setStyle':	function(hash)	{									// установить Style обьекта
			gmxAPI.flashDiv.cmdFromJS('setStyle', { 'objectId':hash.obj.objectId, 'data':hash['attr'] } );
		}
		,
		'getStyle':	function(hash)	{									//получить Style обьекта
			return gmxAPI.flashDiv.cmdFromJS('getStyle', { 'objectId':hash.obj.objectId, 'removeDefaults':hash['attr'] });
		}
		,
		'getVisibleStyle':	function(hash)	{							//получить Style обьекта с учетом родителей
			return gmxAPI.flashDiv.cmdFromJS('getVisibleStyle', { 'objectId':hash.obj.objectId });
		}
		,
		'positionWindow':	function(hash)	{							// 
			gmxAPI.flashDiv.cmdFromJS('positionWindow', { 'objectId':hash.obj.objectId, 'data':hash['attr'] } );
		}
		,
		'setBackgroundColor':	function(hash)	{// 
			gmxAPI.flashDiv.cmdFromJS('setBackgroundColor', { 'objectId':hash.obj.objectId, 'color':hash['attr'] } );
		}
		,
		'getChildren':	function(hash)	{							// получить список потомков
			return gmxAPI.flashDiv.cmdFromJS('getChildren', { 'objectId':hash.obj.objectId } );
		}
		,
		'setHandler':	function(hash)	{							// установка обработчика события
			var attr = hash['attr'];
			if(attr.callbackName) attr.callbackName = gmxAPI.uniqueGlobalName(attr.callbackName);
			return gmxAPI.flashDiv.cmdFromJS('setHandler', { 'objectId':hash.obj.objectId, 'eventName':attr['eventName'], 'callbackName':attr['callbackName'] } );
		}
		,
		'removeHandler':	function(hash)	{						// удаление обработчика события
			return gmxAPI.flashDiv.cmdFromJS('removeHandler', { 'objectId':hash.obj.objectId, 'eventName':hash['attr']['eventName'] } );
		}
		,
		'addObject':	function(hash)	{							// добавить обьект
			var attr = gmxAPI.clone(hash['attr']);
			var geo = gmxAPI.merc_geometry(attr['geometry']) || null;
			var ph = { 'objectId':hash.obj.objectId, 'geometry':geo, 'properties':attr['properties'] };
			if(attr['propHiden']) ph['propHiden'] = attr['propHiden'];
			return gmxAPI.flashDiv.cmdFromJS('addObject', ph );
		}
		,
		'addObjects':	function(hash)	{							// добавить обьекты
			return addObjects(hash.obj.objectId, hash['attr']);
		}
		,
		'addObjectsFromSWF':	function(hash)	{					// добавить обьекты из SWF файла
			return gmxAPI.flashDiv.cmdFromJS('addObjectsFromSWF', { 'objectId':hash.obj.objectId, 'attr':hash['attr'] });
		}
		,
		'setVisibilityFilter':	function(hash)	{	// добавить фильтр видимости к обьекту
			return gmxAPI.flashDiv.cmdFromJS('setVisibilityFilter', { 'objectId':hash.obj.objectId, 'sql':hash['attr']['sql'] } );
		}
		,
		'setFilter':	function(hash)	{							// добавить фильтр к обьекту
			return gmxAPI.flashDiv.cmdFromJS('setFilter', { 'objectId':hash.obj.objectId, 'sql':hash['attr']['sql'] } );
		}
		,
		'remove':	function(hash)	{		// удалить обьект
			gmxAPI.flashDiv.cmdFromJS('remove', { 'objectId':hash.obj.objectId } );
		}
		,
		'bringToTop':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('bringToTop', { 'objectId':hash.obj.objectId } );
		}
		,
		'bringToDepth':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('bringToDepth', { 'objectId':hash.obj.objectId, 'zIndex':hash['attr']['zIndex'] } );
		}
		,
		'bringToBottom':	function(hash)	{
			gmxAPI.flashDiv.cmdFromJS('bringToBottom', { 'objectId':hash.obj.objectId } );
		}
		,
		'setActive':	function(hash)	{
			gmxAPI.flashDiv.cmdFromJS('setActive', { 'objectId':hash.obj.objectId, 'flag':hash['attr']['flag'] } );
		}
		,
		'setEditable':	function(hash)	{
			gmxAPI.flashDiv.cmdFromJS('setEditable', { 'objectId':hash.obj.objectId } );
		}
		,
		'startDrawing':	function(hash)	{
			var attr = (hash ? { 'objectId':hash.obj.objectId, 'type':hash['attr']['type'] } : null);
			gmxAPI.flashDiv.cmdFromJS('startDrawing', attr );
		}
		,
		'stopDrawing':	function(hash)	{
			var attr = (hash ? { 'objectId':hash.obj.objectId } : null);
			gmxAPI.flashDiv.cmdFromJS('stopDrawing', attr );
		}
		,
		'isDrawing':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('isDrawing', { 'objectId':hash.obj.objectId } );
		}
		,
		'getIntermediateLength':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('getIntermediateLength', { 'objectId':hash.obj.objectId } );
		}
		,
		'getCurrentEdgeLength':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('getCurrentEdgeLength', { 'objectId':hash.obj.objectId } );
		}
		,
		'setLabel':	function(hash)	{
			gmxAPI.flashDiv.cmdFromJS('setLabel', { 'objectId':hash.obj.objectId, 'label':hash['attr']['label'] } );
		}
		,
		'setBackgroundTiles':	function(hash)	{
			var attr = gmxAPI.clone(hash['attr']);
			if(hash['attr'].func) attr.func = gmxAPI.uniqueGlobalName(hash['attr'].func);
			attr.objectId = hash.obj.objectId;
			gmxAPI.flashDiv.cmdFromJS('setBackgroundTiles', attr );
		}
		,
		'setDisplacement':	function(hash)	{
			gmxAPI.flashDiv.cmdFromJS('setDisplacement', { 'objectId':hash.obj.objectId, 'dx':hash['attr']['dx'], 'dy':hash['attr']['dy'] } );
		}
		,
		'setTileCaching':	function(hash)	{
			gmxAPI.flashDiv.cmdFromJS('setTileCaching', { 'objectId':hash.obj.objectId, 'flag':hash['attr']['flag'] } );
		}
		,
		'clearBackgroundImage':	function(hash)	{
			gmxAPI.flashDiv.cmdFromJS('clearBackgroundImage', { 'objectId':hash.obj.objectId } );
		}
		,
		'setGeometry':	function(hash)	{
			var geo = gmxAPI.merc_geometry(hash['attr']);
			gmxAPI.flashDiv.cmdFromJS('setGeometry', { 'objectId':hash.obj.objectId, 'data':geo } );
		}
		,
		'getGeometry':	function(hash)	{
			var geom = gmxAPI.flashDiv.cmdFromJS('getGeometry', { 'objectId':hash.obj.objectId } );
			if(!geom) return null;
			var out = { "type": geom.type };
			var coords =  gmxAPI.forEachPoint(geom.coordinates, function(c) {
					return [gmxAPI.from_merc_x(c[0]), gmxAPI.from_merc_y(c[1])];
					}
				);
			out["coordinates"] = coords;
			return out;
		}
		,
		'getLength':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('getLength', { 'objectId':hash.obj.objectId } );
		}
		,
		'getArea':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('getArea', { 'objectId':hash.obj.objectId } );
		}
		,
		'getGeometryType':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('getGeometryType', { 'objectId':hash.obj.objectId } );
		}
		,
		'getCenter':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('getCenter', { 'objectId':hash.obj.objectId } );
		}
		,
		'addChildRoot':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('addChildRoot', { 'objectId':hash.obj.objectId } );
		}
		,
		'setVectorTiles':	function(hash)	{
			var attr = hash['attr'];
			if(attr.tileFunction) attr.tileFunction = gmxAPI.uniqueGlobalName(attr.tileFunction);
			return gmxAPI.flashDiv.cmdFromJS('setVectorTiles', { 'objectId':hash.obj.objectId, 'tilesVers':attr['tilesVers'], 'tileFunction':attr['tileFunction'], 'identityField':attr['cacheFieldName'], 'tiles':attr['dataTiles'], 'filesHash':attr['filesHash'] } );
		}
		,
		'setTiles':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('setTiles', { 'objectId':hash.obj.objectId, 'tiles':attr['tiles'], 'flag':attr['flag'] } );
		}
		,
		'startLoadTiles':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('startLoadTiles', { 'objectId':hash.obj.objectId, 'data':hash['attr'] } );
		}
		,
		'getStat':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('getStat', { 'objectId':hash.obj.objectId } );
		}
		,
		'observeVectorLayer':	function(hash)	{
			var attr = gmxAPI.clone(hash['attr']);
			if(hash['attr'].func) attr.func = gmxAPI.uniqueGlobalName(hash['attr'].func);
			attr.objectId = hash.obj.objectId;
			gmxAPI.flashDiv.cmdFromJS('observeVectorLayer', attr );
		}
		,
		'setImageExtent':	function(hash)	{
			gmxAPI.flashDiv.cmdFromJS('setImageExtent', { 'objectId':hash.obj.objectId, 'data':hash['attr'] } );
		}
		,
		'setImage':	function(hash)	{
			var attr = hash['attr'];
			gmxAPI.flashDiv.cmdFromJS('setImage', { 'objectId':hash.obj.objectId, 'url':attr['url'],
				'x1': gmxAPI.merc_x(attr['x1']), 'y1': gmxAPI.merc_y(attr['y1']),
				'x2': gmxAPI.merc_x(attr['x2']), 'y2': gmxAPI.merc_y(attr['y2']),
				'x3': gmxAPI.merc_x(attr['x3']), 'y3': gmxAPI.merc_y(attr['y3']),
				'x4': gmxAPI.merc_x(attr['x4']), 'y4': gmxAPI.merc_y(attr['y4']),
				'tx1':attr['tx1'], 'ty1':attr['ty1'], 'tx2':attr['tx2'], 'ty2':attr['ty2'], 'tx3':attr['tx3'], 'ty3':attr['ty3'], 'tx4':attr['tx4'], 'ty4':attr['ty4']
			} );
		}
		,
		'flip':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('flip', { 'objectId':hash.obj.objectId } );
		}
		,
		'getFeatureById':	function(hash)	{
			var attr = hash['attr'];
			if(attr.func) {
				var func = function(geom, props)
				{
					var ret = null;
					if(geom && geom['type'] != 'unknown') {
						if(typeof(props) === 'object' && props.length > 0) { props = gmxAPI.arrayToHash(props); }
						ret = new gmxAPI._FlashMapFeature(gmxAPI.from_merc_geometry(geom), props, hash.obj);
					} else if(hash.obj._Processing && hash.obj._Processing.addObjects) {
						var arr = hash.obj._Processing.addObjects;
						var identityField = hash.obj.properties.identityField;
						for (var i = 0; i < arr.length; i++) {
							var prop = arr[i].properties;
							if(prop[identityField] == attr['fid']) {
								ret = new gmxAPI._FlashMapFeature(gmxAPI.from_merc_geometry(arr[i].geometry), arr[i].properties, hash.obj);
								break;
							}
						}
					}

					if(ret) {
						attr.func(ret);
					} else {
						gmxAPI.addDebugWarnings({'alert':'Object: ' + attr['fid'] + ' not found in layer: ' + hash.obj.objectId});
					}
				}
				gmxAPI.flashDiv.cmdFromJS('getFeatureById', { 'objectId':hash.obj.objectId, 'fid':attr['fid'], 'func':gmxAPI.uniqueGlobalName(func) } );
			}
		}
		,
		'getFeatures':	function(hash)	{
			var attr = hash['attr'];
			if(attr.func) {
				var geo = (attr.geom ? attr.geom : { type: "POLYGON", coordinates: [[-180, -89, -180, 89, 180, 89, 180, -89]] });
				var bound = gmxAPI.getBounds(geo.coordinates);
				var func = function(geoms, props)
				{
					var ret = [];
					for (var i = 0; i < geoms.length; i++) {
						var cProp = props[i];
						if(typeof(cProp) === 'object' && cProp.length > 0) {
							cProp = gmxAPI.arrayToHash(cProp);
						}
						ret.push(new gmxAPI._FlashMapFeature(
							gmxAPI.from_merc_geometry(geoms[i]),
							cProp,
							hash.obj
						));
					}
					if(hash.obj._Processing && hash.obj._Processing.addObjects) {
						var arr = hash.obj._Processing.addObjects;
						for (var i = 0; i < arr.length; i++) {
							var geom = gmxAPI.from_merc_geometry(arr[i].geometry);
							var bounds = gmxAPI.getBounds(geom.coordinates);
							if(gmxAPI.boundsIntersect(bound, bounds)) {
								ret.push(new gmxAPI._FlashMapFeature(
									geom,
									arr[i].properties,
									hash.obj
								));
							}
						}
					}
					
					attr.func(ret);
				}
				gmxAPI.flashDiv.cmdFromJS('getFeatures', { 'objectId':hash.obj.objectId, 'geom':gmxAPI.merc_geometry(geo), 'func':gmxAPI.uniqueGlobalName(func) } );
			}
		}
		,
		'getTileItem':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('getTileItem', { 'objectId':hash.obj.objectId, 'vId':hash['attr'] } );
		}
		,
		'setTileItem':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('setTileItem', { 'objectId':hash.obj.objectId, 'data':hash['attr']['data'], 'flag':hash['attr']['flag'] } );
		}
		,
		'getItemsFromExtent':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('getItemsFromExtent', { 'objectId':hash.obj.objectId, 'data':hash['attr'] } );
		}
		,
		'setFlashLSO':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('setFlashLSO', { 'objectId':hash.obj.objectId, 'data':hash['attr'] } );
		}
		,
		'setAPIProperties':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('setAPIProperties', { 'objectId':hash.obj.objectId, 'data':hash['attr'] } );
		}
		,
		'getPatternIcon':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('getPatternIcon', { 'data':hash['attr'] } );
		}
		,
		'addItems':	function(hash)	{
			return gmxAPI.flashDiv.cmdFromJS('addItems', { 'objectId':hash.obj.objectId, 'data':hash['attr'] } );
		}
	};

	// Передача команды в SWF
	function FlashCMD(cmd, hash)
	{
		var ret = {};
		if(!gmxAPI.flashDiv) return ret;
//var startTime = (new Date()).getTime();
		var flashDomTest = typeof(gmxAPI.flashDiv);
		ret = (cmd in commands ? commands[cmd].call(commands, hash) : {});
/*
console.log(cmd + ' : ' , hash);
if(!window._debugTimes) window._debugTimes = { 'jsToFlash': { 'timeSum':0, 'callCount':0, 'callFunc':{} } };
var delta = (new Date()).getTime() - startTime;
window._debugTimes.jsToFlash.timeSum += delta;
window._debugTimes.jsToFlash.callCount += 1;
if(!window._debugTimes.jsToFlash.callFunc[cmd]) window._debugTimes.jsToFlash.callFunc[cmd] = { 'timeSum':0, 'callCount':0 };
window._debugTimes.jsToFlash.callFunc[cmd]['timeSum'] += delta;
window._debugTimes.jsToFlash.callFunc[cmd]['callCount'] += 1;
*/
		return ret;
	}
	
	if(typeof deconcept=="undefined"){var deconcept=new Object();}if(typeof deconcept.util=="undefined"){deconcept.util=new Object();}if(typeof deconcept.SWFObjectUtil=="undefined"){deconcept.SWFObjectUtil=new Object();}deconcept.SWFObject=function(_1,id,w,h,_5,c,_7,_8,_9,_a){if(!document.getElementById){return;}this.DETECT_KEY=_a?_a:"detectflash";this.skipDetect=deconcept.util.getRequestParameter(this.DETECT_KEY);this.params=new Object();this.variables=new Object();this.attributes=new Array();if(_1){this.setAttribute("swf",_1);}if(id){this.setAttribute("id",id);}if(w){this.setAttribute("width",w);}if(h){this.setAttribute("height",h);}if(_5){this.setAttribute("version",new deconcept.PlayerVersion(_5.toString().split(".")));}this.installedVer=deconcept.SWFObjectUtil.getPlayerVersion();if(!window.opera&&document.all&&this.installedVer.major>7){deconcept.SWFObject.doPrepUnload=true;}if(c){this.addParam("bgcolor",c);}var q=_7?_7:"high";this.addParam("quality",q);this.setAttribute("useExpressInstall",false);this.setAttribute("doExpressInstall",false);var _c=(_8)?_8:window.location;this.setAttribute("xiRedirectUrl",_c);this.setAttribute("redirectUrl","");if(_9){this.setAttribute("redirectUrl",_9);}};deconcept.SWFObject.prototype={useExpressInstall:function(_d){this.xiSWFPath=!_d?"expressinstall.swf":_d;this.setAttribute("useExpressInstall",true);},setAttribute:function(_e,_f){this.attributes[_e]=_f;},getAttribute:function(_10){return this.attributes[_10];},addParam:function(_11,_12){this.params[_11]=_12;},getParams:function(){return this.params;},addVariable:function(_13,_14){this.variables[_13]=_14;},getVariable:function(_15){return this.variables[_15];},getVariables:function(){return this.variables;},getVariablePairs:function(){var _16=new Array();var key;var _18=this.getVariables();for(key in _18){_16[_16.length]=key+"="+_18[key];}return _16;},getSWFHTML:function(){var _19="";if(navigator.plugins&&navigator.mimeTypes&&navigator.mimeTypes.length){if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","PlugIn");this.setAttribute("swf",this.xiSWFPath);}_19="<embed type=\"application/x-shockwave-flash\" src=\""+this.getAttribute("swf")+"\" width=\""+this.getAttribute("width")+"\" height=\""+this.getAttribute("height")+"\" style=\""+this.getAttribute("style")+"\"";_19+=" id=\""+this.getAttribute("id")+"\" name=\""+this.getAttribute("id")+"\" ";var _1a=this.getParams();for(var key in _1a){_19+=[key]+"=\""+_1a[key]+"\" ";}var _1c=this.getVariablePairs().join("&");if(_1c.length>0){_19+="flashvars=\""+_1c+"\"";}_19+="/>";}else{if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","ActiveX");this.setAttribute("swf",this.xiSWFPath);}_19="<object id=\""+this.getAttribute("id")+"\" classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" width=\""+this.getAttribute("width")+"\" height=\""+this.getAttribute("height")+"\" style=\""+this.getAttribute("style")+"\">";_19+="<param name=\"movie\" value=\""+this.getAttribute("swf")+"\" />";var _1d=this.getParams();for(var key in _1d){_19+="<param name=\""+key+"\" value=\""+_1d[key]+"\" />";}var _1f=this.getVariablePairs().join("&");if(_1f.length>0){_19+="<param name=\"flashvars\" value=\""+_1f+"\" />";}_19+="</object>";}return _19;},write:function(_20){if(this.getAttribute("useExpressInstall")){var _21=new deconcept.PlayerVersion([6,0,65]);if(this.installedVer.versionIsValid(_21)&&!this.installedVer.versionIsValid(this.getAttribute("version"))){this.setAttribute("doExpressInstall",true);this.addVariable("MMredirectURL",escape(this.getAttribute("xiRedirectUrl")));document.title=document.title.slice(0,47)+" - Flash Player Installation";this.addVariable("MMdoctitle",document.title);}}if(this.skipDetect||this.getAttribute("doExpressInstall")||this.installedVer.versionIsValid(this.getAttribute("version"))){var n=(typeof _20=="string")?document.getElementById(_20):_20;n.innerHTML=this.getSWFHTML();return true;}else{if(this.getAttribute("redirectUrl")!=""){document.location.replace(this.getAttribute("redirectUrl"));}}return false;}};deconcept.SWFObjectUtil.getPlayerVersion=function(){var _23=new deconcept.PlayerVersion([0,0,0]);if(navigator.plugins&&navigator.mimeTypes.length){var x=navigator.plugins["Shockwave Flash"];if(x&&x.description){_23=new deconcept.PlayerVersion(x.description.replace(/([a-zA-Z]|\s)+/,"").replace(/(\s+r|\s+b[0-9]+)/,".").split("."));}}else{if(navigator.userAgent&&navigator.userAgent.indexOf("Windows CE")>=0){var axo=1;var _26=3;while(axo){try{_26++;axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash."+_26);_23=new deconcept.PlayerVersion([_26,0,0]);}catch(e){axo=null;}}}else{try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");}catch(e){try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");_23=new deconcept.PlayerVersion([6,0,21]);axo.AllowScriptAccess="always";}catch(e){if(_23.major==6){return _23;}}try{axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash");}catch(e){}}if(axo!=null){_23=new deconcept.PlayerVersion(axo.GetVariable("$version").split(" ")[1].split(","));}}}return _23;};deconcept.PlayerVersion=function(_29){this.major=_29[0]!=null?parseInt(_29[0]):0;this.minor=_29[1]!=null?parseInt(_29[1]):0;this.rev=_29[2]!=null?parseInt(_29[2]):0;};deconcept.PlayerVersion.prototype.versionIsValid=function(fv){if(this.major<fv.major){return false;}if(this.major>fv.major){return true;}if(this.minor<fv.minor){return false;}if(this.minor>fv.minor){return true;}if(this.rev<fv.rev){return false;}return true;};deconcept.util={getRequestParameter:function(_2b){var q=document.location.search||document.location.hash;if(_2b==null){return q;}if(q){var _2d=q.substring(1).split("&");for(var i=0;i<_2d.length;i++){if(_2d[i].substring(0,_2d[i].indexOf("="))==_2b){return _2d[i].substring((_2d[i].indexOf("=")+1));}}}return "";}};deconcept.SWFObjectUtil.cleanupSWFs=function(){var _2f=document.getElementsByTagName("OBJECT");for(var i=_2f.length-1;i>=0;i--){_2f[i].style.display="none";for(var x in _2f[i]){if(typeof _2f[i][x]=="function"){_2f[i][x]=function(){};}}}};if(deconcept.SWFObject.doPrepUnload){if(!deconcept.unloadSet){deconcept.SWFObjectUtil.prepUnload=function(){__flash_unloadHandler=function(){};__flash_savedUnloadHandler=function(){};window.attachEvent("onunload",deconcept.SWFObjectUtil.cleanupSWFs);};window.attachEvent("onbeforeunload",deconcept.SWFObjectUtil.prepUnload);deconcept.unloadSet=true;}}if(!document.getElementById&&document.all){document.getElementById=function(id){return document.all[id];};}

	// Добавить SWF в DOM
	function addSWFObject(apiBase, flashId, ww, hh, v, bg, loadCallback, FlagFlashLSO)
	{
		// Проверка версии FlashPlayer
		if (deconcept.SWFObjectUtil.getPlayerVersion().major < 10) 
			return '';	

		//var url = apiBase + "api.swf?" + Math.random()
		var url = apiBase + "api.swf";
		var o = new deconcept.SWFObject(url, flashId, ww, hh, v, bg);
		o.addParam('allowScriptAccess', 'always');
		o.addParam('wmode', 'opaque');
		o.addVariable("clearCallback", gmxAPI.uniqueGlobalName(function(name) { delete window[name]; }));
		o.addVariable("loadCallback", gmxAPI.uniqueGlobalName(loadCallback));
		if(FlagFlashLSO) {
			o.addVariable("useFlashLSO", true);
			if(FlagFlashLSO.multiSession) o.addVariable("multiSessionLSO", true);
			if(FlagFlashLSO.compress) o.addVariable("compressLSO", true);
		}
		return o;
	}
	
	//расширяем namespace
    gmxAPI._cmdProxy = FlashCMD;			// посылка команд отрисовщику
    gmxAPI._addProxyObject = addSWFObject;	// Добавить SWF в DOM
    gmxAPI.APILoaded = true;				// Флаг возможности использования gmxAPI сторонними модулями
    
})();
;