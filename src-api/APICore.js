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
	mapNodes: {}	// ноды mapObjects
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
    buildGUID: [/*#buildinclude<__buildGUID__>*/][0]		// GUID текущей сборки
	,
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
    leafletPlugins: {}
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
    loadCSS: function(href) {
        var css = document.createElement("link");
        css.setAttribute("type", "text/css");
        css.setAttribute("rel", "stylesheet");
        //css.setAttribute("media", "screen");
        css.setAttribute("href", href);
        document.getElementsByTagName("head").item(0).appendChild(css);
	}
    ,
    loadJS: function(item, callback, callbackError) {
        var script = document.createElement("script");
        script.setAttribute("charset", item.charset || "windows-1251");
        script.setAttribute("src", item.src);
        item.readystate = 'loading';
        script.onload = function(ev) {
            var count = 0;
            if(item.count) count = item.count--;
            if(count === 0) item.readystate = 'loaded';
            if(callback) callback(item);
            else if(item.callback) item.callback(item);
            document.getElementsByTagName("head").item(0).removeChild(script);
        };
        script.onerror = function(ev) {
            item.readystate = 'error';
            if(callbackError) callbackError(item);
            else if(item.callbackError) item.callbackError(item);
            document.getElementsByTagName("head").item(0).removeChild(script);
        };
        document.getElementsByTagName("head").item(0).appendChild(script);
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
    getPatternIcon: function(ph, size) {
        return gmxAPI._cmdProxy('getPatternIcon', { 'attr':{'size': size || 32, 'style':ph} });
    }
	,
	loadVariableFromScript: function(url, name, callback, onError, useTimeout) {
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
    whenLoaded: function (func) {
        func();
    }
	,
	isRectangle: function(coords)
	{
		return (coords && coords[0] && (coords[0].length == 5 || coords[0].length == 4)
			//&& coords[0][4][0] == coords[0][0][0] && coords[0][4][1] == coords[0][0][1]
			&& ((coords[0][0][0] == coords[0][1][0]) || (coords[0][0][1] == coords[0][1][1]))
			&& ((coords[0][1][0] == coords[0][2][0]) || (coords[0][1][1] == coords[0][2][1]))
			&& ((coords[0][2][0] == coords[0][3][0]) || (coords[0][2][1] == coords[0][3][1]))
			&& ((coords[0][3][0] == coords[0][0][0]) || (coords[0][3][1] == coords[0][0][1]))
			//&& ((coords[0][3][0] == coords[0][4][0]) || (coords[0][3][1] == coords[0][4][1]))
		);
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
		return (arr && arr.length > 1 ? arr[1] : '');	 //удаляем последний каталог в адресе
	})
	,
	getAPIHostRoot: memoize(function()
	{
		return "http://" + gmxAPI.getAPIHost() + "/";
	})
});

window.gmxAPI.serverBase = 'maps.kosmosnimki.ru';		// HostName основной карты по умолчанию
window.gmxAPI.proxyType = 'flash';						// Тип отображения
window.gmxAPI.miniMapAvailable = false;

})();

// Блок методов глобальной области видимости
//var kosmosnimki_API = "1D30C72D02914C5FB90D1D448159CAB6";

var tmp = [
	'merc_x', 'from_merc_x', 'merc_y', 'from_merc_y'
];
var len = tmp.length;
for (var i=0; i<len; i++) window[tmp[i]] = gmxAPI[tmp[i]];

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
    function removeListener(obj, eventName, id) {
        var arr = getArr(eventName, obj);
        var out = [];
        for (var i=0, len = arr.length; i<len; i++) {
            if(id && id != arr[i].id && id != arr[i].pID) out.push(arr[i]);
        }
        if(obj) {
            obj.stateListeners[eventName] = out;
            if(out.length === 0) {
                if('removeHandler' in obj && (!obj.handlers || !obj.handlers[eventName])) obj.removeHandler(eventName);
                delete obj.stateListeners[eventName];
            }
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

gmxAPI.forEachLayer = function(layers, callback, notVisible) {
    gmxAPI.forEachNode(layers, function(node, isVisible, nodeDepth) {
        node.type === 'layer' && callback(node.content, isVisible, nodeDepth);
    }, notVisible)
}

// gmxAPI.forEachLayer = forEachLayer;

var APIKeyResponseCache = {};
var sessionKeyCache = {};
var KOSMOSNIMKI_SESSION_KEY = false;
var alertedAboutAPIKey = false;

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

FlashMapObject.prototype = {
    // setFilter: function(sql) {
    // },
    // setStyle: function(style, activeStyle) {
        // var attr = {'regularStyle':style, 'hoveredStyle':activeStyle};
        // gmxAPI._cmdProxy('setStyle', { 'obj': this, 'attr':attr });
        // gmxAPI._listeners.dispatchEvent('onSetStyle', this, attr);
        // gmxAPI._listeners.dispatchEvent('onStyleChange', this.parent, this);
    // },
    // remove: function() {
    // },
    setVisible: function(flag, notDispatch) {
        gmxAPI._cmdProxy('setVisible', { 'obj': this, 'attr': flag, 'notView': notDispatch });
    // },
    // getVisibility: function() {
    // },
    // getVisibleStyle: function() {
        // return gmxAPI._cmdProxy('getVisibleStyle', { 'obj': this });
    // },
    // setPolygon: function(coords) {
        // this.setGeometry({ type: "POLYGON", coordinates: [coords] });
    // },
    // setGeometry: function(geometry) {
        // gmxAPI._cmdProxy('setGeometry', { 'obj': this, 'attr':geometry });
    // },
    // bringToTop: function() {
        // return gmxAPI._cmdProxy('bringToTop', { 'obj': this });
    },
    getZoomBounds: function() {
        return gmxAPI._cmdProxy('getZoomBounds', { 'obj': this });
    },
    addObject: function(geometry, props, propHiden) {
        var objID = gmxAPI._cmdProxy('addObject', { 'obj': this, 'attr':{ 'geometry':geometry, 'properties':props, 'propHiden':propHiden }});
        if(!objID) objID = false;
        var pObj = new FlashMapObject(objID, props, this);	// обычный MapObject
        // пополнение mapNodes
        var currID = (pObj.objectId ? pObj.objectId : gmxAPI.newFlashMapId() + '_gen1');
        gmxAPI.mapNodes[currID] = pObj;
        if(pObj.parent) {
            pObj.parent.childsID[currID] = true;
        }
        if(propHiden) pObj.propHiden = propHiden;
        pObj.isVisible = true;
        return pObj;
    // },
    // setBackgroundTiles: function(imageUrlFunction, projectionCode, minZoom, maxZoom, minZoomView, maxZoomView, attr) {
    // },
    // setZoomBounds: function(minZoom, maxZoom) {
    // },
    // setCopyright: function(copyright, z1, z2, geo) {
    }
};
if(gmxAPI._handlers) gmxAPI._handlers.Init();		// Инициализация handlers
})();
/*
//Управление ToolsAll
(function()
{
    var _gtxt = function (key, key1) {
        return L.gmxLocale.getLanguage() === 'rus' ? key : key1;
    };
    //Управление ToolsAll
    function ToolsAll(cont)
    {
        this.toolsAllCont = gmxAPI._allToolsDIV;
        gmxAPI._toolsContHash = {};
    }
    var userControls = {};
    gmxAPI._ToolsAll = ToolsAll;
    gmxAPI._tools = {
        standart: {    // интерфейс для обратной совместимости
            addTool: function (tn, attr) {
                var LMap = nsGmx.leafletMap;
                var layersControl = LMap.gmxControlsManager.get('layers');
                //var layersControl = window.v2.controls.gmxLayers;
                //console.log('tool addTool', tn, attr); // wheat
                if(!attr) attr = {};
                attr.id = tn;
                if(!attr.rus) attr.rus = attr.hint || attr.id;
                if(!attr.eng) attr.eng = attr.hint || attr.id;
                var ret = null;
                if(attr.overlay && layersControl) {
                    ret = layersControl.addOverlay(attr, tn);
                } else {
                    attr.title = _gtxt(attr.rus, attr.eng);
                    attr.toggle = !!attr.onCancel;
                    attr.stateChange = function (control) {
                        if (control.options.isActive) attr.onClick(gmxAPI._tools[tn]);
                        else attr.onCancel(gmxAPI._tools[tn]);
                    };
                    ret = new L.Control.gmxIcon(attr).addTo(LMap);
                }
                gmxAPI._tools[tn] = ret;
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
                var LMap = nsGmx.leafletMap;
                var control = gmxAPI._tools[id] || LMap.gmxControlsManager.get(id);
                if (control) {
                    if (id === 'POINT') {
                        //control = Controls.items.drawingPoint;
                        if ('onclick' in control.options) {
                            control.options.onclick();
                        }
                    }
                    control.setActive(id);
                }
            }
        }
    };

    function ToolsContainer(name, attr) {
        return {
            addTool: gmxAPI._tools.standart.addTool
        };
    }
    gmxAPI._ToolsContainer = ToolsContainer;
})();
*/