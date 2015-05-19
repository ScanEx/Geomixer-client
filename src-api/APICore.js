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
    getPatternIcon: function(ph, size) {
        return null;
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
	this.childsID = {};			// Хэш ID потомков
}
// расширение FlashMapObject
gmxAPI.extendFMO = function(name, func) {	FlashMapObject.prototype[name] = func;	}
gmxAPI._FMO = FlashMapObject;
var nextId = 0;							// следующий ID mapNode

FlashMapObject.prototype = {
    setVisible: function(flag, notDispatch) {
        var lmap = nsGmx.leafletMap,
            layerID = this.properties.name,
            myLayer = nsGmx.gmxMap.layersByID[layerID];

            if (myLayer) {
                if (flag) {
                    lmap.addLayer(myLayer);
                } else {
                    lmap.removeLayer(myLayer);
                }
            }
    },
    addObject: function(geometry, props, propHiden) {
        nextId++;
        var objID = 'id' + nextId;
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
    }
};
    gmxAPI.extendFMO('addListener', function(eventName, func, level) {
    });
    gmxAPI._leaflet = {};
})();

//Поддержка map
(function()
{
    var addNewMap = function(rootObjectId, layers, callback)
    {
        var map = new gmxAPI._FMO(rootObjectId, {}, null); // MapObject основной карты
        map.geoSearchAPIRoot = 'http://maps.kosmosnimki.ru/';

        window.globalFlashMap = map;
        gmxAPI.map = map;
        gmxAPI.mapNodes[rootObjectId] = map; // основная карта

        if(!layers.properties) layers.properties = {};
        map.properties = layers.properties;
        if(!layers.children) layers.children = [];
        map.isVisible = true;
        map.layers = [];

        map.addLayers = function(layers, notMoveFlag, notVisible) {
            for (var iL = 0; iL < nsGmx.gmxMap.layers.length; iL++) {
                var layer = nsGmx.gmxMap.layers[iL],
                    props = layer.getGmxProperties(),
                    layerID = props.name;

                if(!gmxAPI.map.layers[layerID]) {
                    map.addLayer(layer, props.visible ? true : notVisible, true);
                }
            }
        }

        // map.defaultHostName = map.properties.hostName || '';
        map.addLayers(layers, false, false);
        
        return map;
    }
    //расширяем namespace
    gmxAPI._addNewMap = addNewMap; // Создать map обьект
})();
//Поддержка addLayer
(function()
{
    // Добавление слоя
    var addLayer = function(parentObj, layer, isVisible, isMerc) {
        var FlashMapObject = gmxAPI._FMO;
        if (!parentObj.layers)
            parentObj.layers = [];
      
        if (!parentObj.layersParent) {
            parentObj.layersParent = parentObj.addObject(null, null, {'layersParent': true});
        }
        
        if (isVisible === undefined)
            isVisible = true;
        
        var prop = layer.getGmxProperties();
        if (!prop.identityField) prop.identityField = "ogc_fid";

        var layerName = prop.name || prop.image;
        if(!prop.name) prop.name = layerName;

        var pObj = parentObj.layersParent
        var obj = pObj.addObject(null, prop);
        obj.geometry = layer.geometry;
        obj.properties = prop;
        if(parentObj.layers[layerName]) {
            for(var i = parentObj.layers.length - 1; i >= 0; i--) { // Удаление слоя из массива
                //var prop = parentObj.layers[i].properties;
                if(parentObj.layers[i].properties.name === layerName) {
                    parentObj.layers.splice(i, 1);
                    break;
                }
            }
        }
        parentObj.layers.push(obj);
        parentObj.layers[layerName] = obj;
        if (!prop.LayerVersion) obj.notServer = true;
        if (!prop.title) prop.title = 'layer from client ' + layerName;
        if (!prop.title.match(/^\s*[0-9]+\s*$/))
            parentObj.layers[prop.title] = obj;

        var filters = [],
            styles = prop.styles || [];
        for (var i = 0, len = styles.length; i < len; i++) {
            var filter = obj.addObject(null, {}); // MapObject для фильтра
            filter.type = 'filter';
            filter._attr = styles[i];
            filters.push(filter);
        }
        obj.filters = filters;

        var bounds = false;    // в меркаторе
        var boundsLatLgn = false;
        var initBounds = function() { // geom в меркаторе
            var geom = obj.geometry,
                coords = geom ? geom.coordinates : [[[-20037508, -20037508], [20037508, 20037508]]];
            bounds = gmxAPI.getBounds(coords);
            var sw = L.Projection.Mercator.unproject({x: bounds.minX, y: bounds.minY});
            var ne = L.Projection.Mercator.unproject({x: bounds.maxX, y: bounds.maxY});
            obj.bounds = boundsLatLgn = {
                minX: sw.lng,
                minY: sw.lat,
                maxX: ne.lng,
                maxY: ne.lat
            };
        };
        obj.getLayerBounds = function() {           // Получение boundsLatLgn для внешних плагинов
            if (!boundsLatLgn) initBounds();
            return boundsLatLgn;
        }
        obj.isVisible = isVisible;
        return obj;
    }

    //расширяем FlashMapObject
    gmxAPI.extendFMO('addLayer', function(layer, isVisible, isMerc) {
        var obj = addLayer(this, layer, isVisible, isMerc);
        //gmxAPI._listeners.dispatchEvent('onAddExternalLayer', gmxAPI.map, obj); // Добавлен внешний слой
        return obj;
    } );

})();
