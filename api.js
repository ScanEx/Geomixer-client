/** 
* @name api
* @namespace Описание API JS
*/
if(typeof deconcept=="undefined"){var deconcept=new Object();}if(typeof deconcept.util=="undefined"){deconcept.util=new Object();}if(typeof deconcept.SWFObjectUtil=="undefined"){deconcept.SWFObjectUtil=new Object();}deconcept.SWFObject=function(_1,id,w,h,_5,c,_7,_8,_9,_a){if(!document.getElementById){return;}this.DETECT_KEY=_a?_a:"detectflash";this.skipDetect=deconcept.util.getRequestParameter(this.DETECT_KEY);this.params=new Object();this.variables=new Object();this.attributes=new Array();if(_1){this.setAttribute("swf",_1);}if(id){this.setAttribute("id",id);}if(w){this.setAttribute("width",w);}if(h){this.setAttribute("height",h);}if(_5){this.setAttribute("version",new deconcept.PlayerVersion(_5.toString().split(".")));}this.installedVer=deconcept.SWFObjectUtil.getPlayerVersion();if(!window.opera&&document.all&&this.installedVer.major>7){deconcept.SWFObject.doPrepUnload=true;}if(c){this.addParam("bgcolor",c);}var q=_7?_7:"high";this.addParam("quality",q);this.setAttribute("useExpressInstall",false);this.setAttribute("doExpressInstall",false);var _c=(_8)?_8:window.location;this.setAttribute("xiRedirectUrl",_c);this.setAttribute("redirectUrl","");if(_9){this.setAttribute("redirectUrl",_9);}};deconcept.SWFObject.prototype={useExpressInstall:function(_d){this.xiSWFPath=!_d?"expressinstall.swf":_d;this.setAttribute("useExpressInstall",true);},setAttribute:function(_e,_f){this.attributes[_e]=_f;},getAttribute:function(_10){return this.attributes[_10];},addParam:function(_11,_12){this.params[_11]=_12;},getParams:function(){return this.params;},addVariable:function(_13,_14){this.variables[_13]=_14;},getVariable:function(_15){return this.variables[_15];},getVariables:function(){return this.variables;},getVariablePairs:function(){var _16=new Array();var key;var _18=this.getVariables();for(key in _18){_16[_16.length]=key+"="+_18[key];}return _16;},getSWFHTML:function(){var _19="";if(navigator.plugins&&navigator.mimeTypes&&navigator.mimeTypes.length){if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","PlugIn");this.setAttribute("swf",this.xiSWFPath);}_19="<embed type=\"application/x-shockwave-flash\" src=\""+this.getAttribute("swf")+"\" width=\""+this.getAttribute("width")+"\" height=\""+this.getAttribute("height")+"\" style=\""+this.getAttribute("style")+"\"";_19+=" id=\""+this.getAttribute("id")+"\" name=\""+this.getAttribute("id")+"\" ";var _1a=this.getParams();for(var key in _1a){_19+=[key]+"=\""+_1a[key]+"\" ";}var _1c=this.getVariablePairs().join("&");if(_1c.length>0){_19+="flashvars=\""+_1c+"\"";}_19+="/>";}else{if(this.getAttribute("doExpressInstall")){this.addVariable("MMplayerType","ActiveX");this.setAttribute("swf",this.xiSWFPath);}_19="<object id=\""+this.getAttribute("id")+"\" classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" width=\""+this.getAttribute("width")+"\" height=\""+this.getAttribute("height")+"\" style=\""+this.getAttribute("style")+"\">";_19+="<param name=\"movie\" value=\""+this.getAttribute("swf")+"\" />";var _1d=this.getParams();for(var key in _1d){_19+="<param name=\""+key+"\" value=\""+_1d[key]+"\" />";}var _1f=this.getVariablePairs().join("&");if(_1f.length>0){_19+="<param name=\"flashvars\" value=\""+_1f+"\" />";}_19+="</object>";}return _19;},write:function(_20){if(this.getAttribute("useExpressInstall")){var _21=new deconcept.PlayerVersion([6,0,65]);if(this.installedVer.versionIsValid(_21)&&!this.installedVer.versionIsValid(this.getAttribute("version"))){this.setAttribute("doExpressInstall",true);this.addVariable("MMredirectURL",escape(this.getAttribute("xiRedirectUrl")));document.title=document.title.slice(0,47)+" - Flash Player Installation";this.addVariable("MMdoctitle",document.title);}}if(this.skipDetect||this.getAttribute("doExpressInstall")||this.installedVer.versionIsValid(this.getAttribute("version"))){var n=(typeof _20=="string")?document.getElementById(_20):_20;n.innerHTML=this.getSWFHTML();return true;}else{if(this.getAttribute("redirectUrl")!=""){document.location.replace(this.getAttribute("redirectUrl"));}}return false;}};deconcept.SWFObjectUtil.getPlayerVersion=function(){var _23=new deconcept.PlayerVersion([0,0,0]);if(navigator.plugins&&navigator.mimeTypes.length){var x=navigator.plugins["Shockwave Flash"];if(x&&x.description){_23=new deconcept.PlayerVersion(x.description.replace(/([a-zA-Z]|\s)+/,"").replace(/(\s+r|\s+b[0-9]+)/,".").split("."));}}else{if(navigator.userAgent&&navigator.userAgent.indexOf("Windows CE")>=0){var axo=1;var _26=3;while(axo){try{_26++;axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash."+_26);_23=new deconcept.PlayerVersion([_26,0,0]);}catch(e){axo=null;}}}else{try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");}catch(e){try{var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");_23=new deconcept.PlayerVersion([6,0,21]);axo.AllowScriptAccess="always";}catch(e){if(_23.major==6){return _23;}}try{axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash");}catch(e){}}if(axo!=null){_23=new deconcept.PlayerVersion(axo.GetVariable("$version").split(" ")[1].split(","));}}}return _23;};deconcept.PlayerVersion=function(_29){this.major=_29[0]!=null?parseInt(_29[0]):0;this.minor=_29[1]!=null?parseInt(_29[1]):0;this.rev=_29[2]!=null?parseInt(_29[2]):0;};deconcept.PlayerVersion.prototype.versionIsValid=function(fv){if(this.major<fv.major){return false;}if(this.major>fv.major){return true;}if(this.minor<fv.minor){return false;}if(this.minor>fv.minor){return true;}if(this.rev<fv.rev){return false;}return true;};deconcept.util={getRequestParameter:function(_2b){var q=document.location.search||document.location.hash;if(_2b==null){return q;}if(q){var _2d=q.substring(1).split("&");for(var i=0;i<_2d.length;i++){if(_2d[i].substring(0,_2d[i].indexOf("="))==_2b){return _2d[i].substring((_2d[i].indexOf("=")+1));}}}return "";}};deconcept.SWFObjectUtil.cleanupSWFs=function(){var _2f=document.getElementsByTagName("OBJECT");for(var i=_2f.length-1;i>=0;i--){_2f[i].style.display="none";for(var x in _2f[i]){if(typeof _2f[i][x]=="function"){_2f[i][x]=function(){};}}}};if(deconcept.SWFObject.doPrepUnload){if(!deconcept.unloadSet){deconcept.SWFObjectUtil.prepUnload=function(){__flash_unloadHandler=function(){};__flash_savedUnloadHandler=function(){};window.attachEvent("onunload",deconcept.SWFObjectUtil.cleanupSWFs);};window.attachEvent("onbeforeunload",deconcept.SWFObjectUtil.prepUnload);deconcept.unloadSet=true;}}if(!document.getElementById&&document.all){document.getElementById=function(id){return document.all[id];};}var getQueryParamValue=deconcept.util.getRequestParameter;var FlashObject=deconcept.SWFObject;var SWFObject=deconcept.SWFObject;

var gmxAPI = {
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
		return this.getIdentityField(obj.parent);
	}
}

var isIE = (navigator.appName.indexOf("Microsoft") != -1);

function setBg(t, imageName)
{
	if (isIE)
		t.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + imageName + "',sizingMethod='scale')";
	else
		t.style.backgroundImage = "url('" + imageName + "')";
}

function deselect()
{
	if (window.disableDeselect)
		return;
	if(document.selection && document.selection.empty) 
		try { document.selection.empty(); } catch (e) {}
}

function compatEvent(event) {return event || window.event; }

function compatTarget(event)
{
	if (!event)
		event = window.event;
	return (event.srcElement != null) ? event.srcElement : event.target;
}

function eventX(event) 
{
	if (document.documentElement && document.documentElement.scrollLeft)
		theLeft = document.documentElement.scrollLeft;
	else theLeft = document.body.scrollLeft;
	return compatEvent(event).clientX + theLeft;
}

function eventY(event) 
{
	if (document.documentElement && document.documentElement.scrollTop)
		theTop = document.documentElement.scrollTop;
	else theTop = document.body.scrollTop;
	return compatEvent(event).clientY + theTop; 
}

var getOffsetLeft = function(div)
{
  var ret = 0;
  while (div && div.tagName != 'HTML')
  {
    ret += div.offsetLeft;
    div = div.offsetParent;
  }
  return ret;
}
var getOffsetTop = function(div)
{
  var ret = 0;
  while (div && div.tagName != 'HTML')
  {
    ret += div.offsetTop;
    div = div.offsetParent;
  }
  return ret;
}

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

function GlobalHandlerMode(event, handler)
{
	return new HandlerMode(document.documentElement, event, handler);
}




function newElement(tagName, props, style)
{
	var elem = document.createElement(tagName);
	if (props)
	{
		for (var key in props)
			elem[key] = props[key];
	}
	elem.style.border = 0;
	elem.style.margin = 0;
	elem.style.padding = 0;
	if (style)
	{
		for (var key in style)
		{
			var value = style[key];
			elem.style[key] = value;
			if (key == "opacity")
				elem.style.filter = "alpha(opacity=" + Math.round(value*100) + ")";
		}
	}
	return elem;
}

function newStyledDiv(style)
{
	return newElement("div", false, style);
}

function newSpan(innerHTML)
{
	return newElement("span", { innerHTML: innerHTML });
}

function newDiv(className, innerHTML)
{
	return newElement("div", { className: className, innerHTML: innerHTML });
}

function show(div)
{
	div.style.visibility = "visible";
	div.style.display = "block";
}

function hide(div)
{
	div.style.visibility = "hidden";
	div.style.display = "none";
}

function setPositionStyle(div, attr)
{
	for(var key in attr) div.style[key] = attr[key];
}

function position(div, x, y)
{
	div.style.left = x + "px";
	div.style.top = y + "px";
}

function bottomPosition(div, x, y)
{
	div.style.left = x + "px";
	div.style.bottom = y + "px";
}

function size(div, w, h)
{
	div.style.width = w + "px";
	div.style.height = h + "px";
}

function positionSize(div, x, y, w, h)
{
	position(div, x, y);
	size(div, w, h);
}

function setVisible(div, flag) 
{ 
	(flag ? show : hide)(div);
}

function getScriptURL(scriptName)
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

function getScriptBase(scriptName)
{
	var url = getScriptURL(scriptName);
	return url.substring(0, url.indexOf(scriptName));
}

function sendCrossDomainJSONRequest(url, callback)
{
	var script = document.createElement("script");
	script.setAttribute("charset", "UTF-8");
	var callbackName = uniqueGlobalName(function(obj)
	{
		callback(obj);
		window[callbackName] = false;
		document.getElementsByTagName("head").item(0).removeChild(script);
	});
	script.setAttribute("src", url + "&CallbackName=" + callbackName + "&" + Math.random());
	document.getElementsByTagName("head").item(0).appendChild(script);
}

function strip(s)
{
	return s.replace(/^\s*/, "").replace(/\s*$/, "");
}

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

function parseColor(str)
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

function forEachPoint(coords, callback)
{
	if (coords.length == 0) return [];
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
		for (var i = 0; i < coords.length; i++)
			ret.push(forEachPoint(coords[i], callback));
		return ret;
	}
}

function transformGeometry(geom, callbackX, callbackY)
{
	return !geom ? geom : { 
		type: geom.type, 
		coordinates: forEachPoint(geom.coordinates, function(p) 
		{ 
			return [callbackX(p[0]), callbackY(p[1])];
		})
	}
}

function merc_geometry(geom)
{
	return transformGeometry(geom, merc_x, merc_y);
}

function from_merc_geometry(geom)
{
	return transformGeometry(geom, from_merc_x, from_merc_y);
}

function getBounds(coords)
{
	var ret = { 
		minX: 100000000, 
		minY: 100000000, 
		maxX: -100000000, 
		maxY: -100000000,
		update: function(data)
		{
			forEachPoint(data, function(p)
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

function boundsIntersect(b1, b2)
{
	return ((b1.minX < b2.maxX) && (b1.minY < b2.maxY) && (b2.minX < b1.maxX) && (b2.minY < b1.maxY));
}

function isRectangle(coords)
{
	return (coords && (coords[0].length == 5) && ((coords[0][0][0] == coords[0][1][0]) || (coords[0][0][1] == coords[0][1][1])));
}

var lastFlashMapId = 0;
var newFlashMapId = function()
{
	lastFlashMapId += 1;
	return "random_" + lastFlashMapId;
}

var uniqueGlobalName = function(thing)
{
	var id = newFlashMapId();
	window[id] = thing;
	return id;
}

var memoize = function(func)
{
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
}

var getHostAndPath = function(url)
{
	var u = parseUri(url);
	if (u.host == "")
		return "";
	var s = u.host + u.directory;
	if (s.charAt(s.length - 1) == "/")
		s = s.substring(0, s.length - 1);
	return s;
}

var getAPIFolderRoot = memoize(function()
{
	return getScriptBase("api.js");
});

var getAPIHost = memoize(function()
{
	var apiHost = getHostAndPath(getAPIFolderRoot());
	return /(.*)\/[^\/]*/.exec((apiHost != "") ? apiHost : getHostAndPath(window.location.href))[1]; //удаляем последний каталог в адресе
});

var getAPIHostRoot = memoize(function()
{
	return "http://" + getAPIHost() + "/";
});

function getScale(z)
{
	return Math.pow(2, -z)*156543.033928041;
}

var flashMapAlreadyLoading = false;

function isRequiredAPIKey( hostName )
{
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

function forEachLayer(layers, callback)
{
	var forEachLayerRec = function(o, isVisible)
	{
		isVisible = isVisible && o.content.properties.visible;
		if (o.type == "layer")
			callback(o.content, isVisible);
		else if (o.type == "group")
		{
			var a = o.content.children;
			for (var k = a.length - 1; k >= 0; k--)
				forEachLayerRec(a[k], isVisible);
		}
	}
	forEachLayerRec({type: "group", content: { children: layers.children, properties: { visible: true } } }, true);
}

function loadVariableFromScript(url, name, callback, onError, useTimeout)
{
	window[name] = undefined;
	var script = document.createElement("script");
	var done = false;
	
	script.onerror = function()
		{
		if (!done)
		{
			// alert('onerror');
			clearInterval(intervalError);
			if (onError) onError();
			done = true;
		}
	}
	
	script.onload = function()
	{
		if (!done)
		{
			// alert('onload');
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
			//alert('onreadystatechange: ' + this.readyState);
			if ( this.readyState === 'loaded' )
			{
				clearInterval(intervalError);
				
				if ( window[name] !== undefined )
					callback(window[name]);
				else if (onError) onError();
				done = true;
			}
		}
	}
	
	// alert('readyState exists');
		var intervalError = setInterval(function()
		{
		if (!done)
		{
			if (script.readyState === 'loaded')
			{
				clearInterval(intervalError);
				if (typeof window[name] === 'undefined')
				{
					//canceled = true;
					if (onError) onError();
				}
				done = true;
			}
	}
	}, 50);
	
	script.setAttribute("charset", "UTF-8");
	document.getElementsByTagName("head").item(0).appendChild(script);
	script.setAttribute("src", url);

	//var startTime = (new Date()).getTime();
	//var canceled = false;
	// var interval = setInterval(function()
	// {
		// alert(window[name]);
		// if (window[name] !== undefined)
		// {
			// clearInterval(interval);
			// if (!canceled)
				// callback(window[name]);
		// }
		// else if (useTimeout && ((new Date()).getTime() - startTime > 10000))
		// {
			// clearInterval(interval);
			
			// if (!canceled)
				// onError();
			
			// canceled = true;
		// }
	// }, 500);
}

function KOSMOSNIMKI_LOCALIZED(rus, eng)
{
	return (window.KOSMOSNIMKI_LANGUAGE == "English") ? eng : rus;
}

var APIKeyResponseCache = {};
var sessionKeyCache = {};
var KOSMOSNIMKI_SESSION_KEY = false;
var alertedAboutAPIKey = false;

function loadMapJSON(hostName, mapName, callback, onError)
{
	if (hostName.indexOf("http://") == 0)
		hostName = hostName.slice(7);
	if (hostName.charAt(hostName.length-1) == '/')
		hostName = hostName.slice(0, -1);
		
	//относительный путь в загружаемой карте
	if (hostName.charAt(0) == '/')
		hostName = getAPIHost() + hostName;
	
	if (flashMapAlreadyLoading)
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
		loadVariableFromScript(
			"http://" + hostName + "/TileSender.ashx?ModeKey=map&MapName=" + mapName + (key ? ("&key=" + encodeURIComponent(key)) : "") + "&" + Math.random(),
			"getLayers",
			function(f)
			{
				var layers = f();
				if (layers)
				{
					layers.properties.hostName = hostName;
					window.sessionKeyCache[mapName] = layers.properties.MapSessionKey;
					forEachLayer(layers, function(layer)
					{ 
						layer.properties.mapName = layers.properties.name;
						layer.properties.hostName = hostName;
						layer.geometry = from_merc_geometry(layer.geometry);
					});
				}
				callback(layers);
				flashMapAlreadyLoading = false;
			},
			function()
			{
				flashMapAlreadyLoading = false;
				if (onError)
					onError();
			},
			onError ? true : false
		);
	}

	if ( isRequiredAPIKey( hostName ) )
	{
		var haveNoAPIKey = function()
		{
			alertAboutAPIKey(KOSMOSNIMKI_LOCALIZED("Не указан API-ключ!", "API key not specified!"));
			window.KOSMOSNIMKI_SESSION_KEY = "INVALID";
			finish();
		}

		var useAPIKey = function(key)
		{
			var processResponse = function(response)
			{
				if (response.Result.Status)
					window.KOSMOSNIMKI_SESSION_KEY = response.Result.Key;
				else
					alertAboutAPIKey(KOSMOSNIMKI_LOCALIZED("Указан неверный API-ключ!", "Incorrect API key specified!"));
				finish();
			}
			if (APIKeyResponseCache[key])
				processResponse(APIKeyResponseCache[key]);
			else
			{
				var apikeyRequestHost = window.apikeyRequestHost  ? window.apikeyRequestHost  : "maps.kosmosnimki.ru";
				sendCrossDomainJSONRequest(
					"http://" + apikeyRequestHost + "/ApiKey.ashx?WrapStyle=func&Key=" + key,
					function(response)
					{
						APIKeyResponseCache[key] = response;
						processResponse(response);
					}
				);
			}
		}
		var apiHost = parseUri(getAPIFolderRoot()).hostOnly;
		if (apiHost == "") 
			apiHost = parseUri(window.location.href).hostOnly;
		var apiKeyResult = (/key=([a-zA-Z0-9]+)/).exec(getScriptURL("api.js"));

		if ((apiHost == "localhost") || apiHost.match(/127\.\d+\.\d+\.\d+/))
			useAPIKey("localhost");
		else if (apiKeyResult)
			useAPIKey(apiKeyResult[1]);
		else if (window.apiKey)
			useAPIKey(window.apiKey);
		else if (!getScriptURL("config.js"))
			loadVariableFromScript(
				getScriptBase("api.js") + "config.js",
				"apiKey",
				function(key)
				{
					if (key)
						useAPIKey(key);
					else
						haveNoAPIKey();
				}
			);
		else
			haveNoAPIKey();
	}
	else
		finish();
}

function parseCoordinates(text, callback)
{
	// should understand the following formats:
	// 55.74312, 37.61558
	// 55°44'35" N, 37°36'56" E
	// 4187347, 7472103

	if (text.match(/[йцукенгшщзхъфывапролджэячсмитьбюЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮqrtyuiopadfghjklzxcvbmQRTYUIOPADFGHJKLZXCVBM]/))
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
		x = merc_x(ty);
		y = merc_y(tx);
	}
	if (Math.max(text.indexOf("N"), text.indexOf("S")) > Math.max(text.indexOf("E"), text.indexOf("W")))
	{
		var t = merc_y(from_merc_x(x));
		x = merc_x(from_merc_y(y));
		y = t;
	}
	if (text.indexOf("W") != -1)
		x = -x;
	if (text.indexOf("S") != -1)
		y = -y;
	callback(from_merc_x(x), from_merc_y(y));
	return true;
}


function createFlashMap(div, arg1, arg2, arg3)
{
	if (deconcept.SWFObjectUtil.getPlayerVersion().major < 10)
		return false;	

	if (!arg2 && !arg3)
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
		loadMapJSON(hostName, mapName, function(layers)
		{
			if (layers != null)
				(layers.properties.UseKosmosnimkiAPI ? createKosmosnimkiMapInternal : createFlashMapInternal)(div, layers, callback);
			else
				callback(null);
		});
	}
	return true;
}

var createKosmosnimkiMap = createFlashMap;
var makeFlashMap = createFlashMap;

function createFlashMapInternal(div, layers, callback)
{
	if (div.style.position != "absolute")
		div.style.position = "relative";

	history.navigationMode = 'compatible';
	var body = document.getElementsByTagName("body").item(0);
	if (body && !body.onunload)
		body.onunload = function() {};
	if (!window.onunload)
		window.onunload = function() {};

	var apiBase = getAPIFolderRoot();
	//var aspBase = "http://" + (layers ? layers.properties.hostName : apiBase) + "/";

	var focusLink = document.createElement("a");
	var flashId = newFlashMapId();
	var o = new SWFObject(apiBase + "api.swf?" + Math.random(), flashId, "100%", "100%", "10", "#ffffff");
	o.addParam('allowScriptAccess', 'always');
	o.addParam('wmode', 'opaque');
	o.addVariable("clearCallback", uniqueGlobalName(function(name) { delete window[name]; }));
	var loadCallback = function(rootObjectId)
	{ 
		if (!window.__flash__toXML)
		{
			setTimeout(function() { loadCallback(rootObjectId); }, 100);
			return;
		}

		try {

			var flashDiv = document.getElementById(flashId);
			var needToStopDragging = false;
			flashDiv.onmouseout = function() 
			{ 
				needToStopDragging = true;
				flashDiv.setCursorVisible(false);
			}
			flashDiv.onmouseover = function()
			{
				if (needToStopDragging)
					flashDiv.stopDragging();
				flashDiv.setCursorVisible(true);
				needToStopDragging = false;
			}
			flashDiv.style.MozUserSelect = "none";

			var FlashMapObject = function(objectId_, properties_, parent_)
			{
				this.objectId = objectId_;
				for (var key in properties_)
					if (properties_[key] == "null")
						properties_[key] = "";
				this.properties = properties_;
				this.parent = parent_;
				this.flashId = flashId;
			}

			// Передача команды в SWF
			function FlashCMD(cmd, hash)
			{
				var ret = {};
				var obj = hash['obj'] || null;	// Целевой обьект команды
				var attr = hash['attr'] || '';
				switch (cmd) {				// Тип команды
					case 'setVisible':		// Изменить видимость обьекта
						if(obj) {
							flashDiv.cmdFromJS(cmd, { 'objectId':obj.objectId, 'flag':attr } );
							if (attr && obj.backgroundColor)
								map.setBackgroundColor(obj.backgroundColor);
							if (obj.copyright)
								map.updateCopyright();
							var func = map.onSetVisible[obj.objectId];
							if (func)
								func(attr);
						}
						break;
					case 'sendPNG':			// Сохранение изображения карты на сервер
						var miniMapFlag = miniMap.getVisibility();
						var flag = (attr.miniMapSetVisible ? true : false);
						miniMap.setVisible(flag);
						if(attr.func) attr.func = uniqueGlobalName(attr.func);
						ret['base64'] = flashDiv.cmdFromJS(cmd, attr);
						miniMap.setVisible(miniMapFlag);
						break;
				}
				return ret;
			}

			FlashMapObject.prototype.trace = function(val) { flashDiv.trace(val); }
			FlashMapObject.prototype.setQuality = function(val) { flashDiv.setQuality(val); }
			FlashMapObject.prototype.disableCaching = function() { flashDiv.disableCaching(); }
			FlashMapObject.prototype.print = function() { flashDiv.print(); }
			FlashMapObject.prototype.savePNG = function(fileName) { flashDiv.savePNG(fileName); }
			FlashMapObject.prototype.sendPNG = function(attr) {
				var ret = FlashCMD('sendPNG', { 'attr': attr });
				return ret;
			}
			FlashMapObject.prototype.repaint = function() { flashDiv.repaint(); }
			FlashMapObject.prototype.moveTo = function(x, y, z) 
			{ 
				flashDiv.moveTo(merc_x(x), merc_y(y), 17 - z);
			}
			FlashMapObject.prototype.slideTo = function(x, y, z) 
			{ 
				flashDiv.slideTo(merc_x(x), merc_y(y), 17 - z);
			}
			FlashMapObject.prototype.moveToCoordinates = function(text, z)
			{
				var me = this;
				return parseCoordinates(text, function(x, y)
				{
					me.moveTo(x, y, z ? z : me.getZ());
				});
			}
			FlashMapObject.prototype.getBestZ = function(minX, minY, maxX, maxY)
			{
				if ((minX == maxX) && (minY == maxY))
					return 17;
				return Math.max(0, 17 - Math.ceil(Math.log(Math.max(
					Math.abs(merc_x(maxX) - merc_x(minX))/flashDiv.clientWidth,
					Math.abs(merc_y(maxY) - merc_y(minY))/flashDiv.clientHeight
				))/Math.log(2)));
			}
			FlashMapObject.prototype.zoomToExtent = function(minx, miny, maxx, maxy)
			{
				this.moveTo(
					from_merc_x((merc_x(minx) + merc_x(maxx))/2),
					from_merc_y((merc_y(miny) + merc_y(maxy))/2),
					this.getBestZ(minx, miny, maxx, maxy)
				);
			}
			FlashMapObject.prototype.slideToExtent = function(minx, miny, maxx, maxy)
			{
				this.slideTo(
					from_merc_x((merc_x(minx) + merc_x(maxx))/2),
					from_merc_y((merc_y(miny) + merc_y(maxy))/2),
					this.getBestZ(minx, miny, maxx, maxy)
				);
			}
			FlashMapObject.prototype.zoomBy = function(dz, useMouse) {
				map.balloonClassObject.hideHoverBalloons(true);
				flashDiv.zoomBy(-dz, useMouse);
			}
			FlashMapObject.prototype.freeze = function() { flashDiv.freeze(); }
			FlashMapObject.prototype.unfreeze = function() { flashDiv.unfreeze(); }
			FlashMapObject.prototype.setCursor = function(url, dx, dy) { flashDiv.setCursor(url, dx, dy); }
			FlashMapObject.prototype.clearCursor = function() { flashDiv.clearCursor(); }
			FlashMapObject.prototype.getX = function() { return from_merc_x(flashDiv.getX()); }
			FlashMapObject.prototype.getY = function() { return from_merc_y(flashDiv.getY()); }
			FlashMapObject.prototype.getZ = function() { return 17 - flashDiv.getZ(); }
			FlashMapObject.prototype.getMouseX = function() { return from_merc_x(flashDiv.getMouseX()); }
			FlashMapObject.prototype.getMouseY = function() { return from_merc_y(flashDiv.getMouseY()); }
			FlashMapObject.prototype.getPosition = function() { return flashDiv.getPosition(); }

			FlashMapObject.prototype.isKeyDown = function(code) { return flashDiv.isKeyDown(code); }

			var propertiesFromArray = function(a)
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

			FlashMapObject.prototype.getChildren = function()
			{
				var arr = flashDiv.getChildren(this.objectId);
				var ret = [];
				for (var i = 0; i < arr.length; i++)
					ret.push(new FlashMapObject(arr[i].id, propertiesFromArray(arr[i].properties), this));
				return ret;
			}

			FlashMapObject.prototype.setHandler = function(eventName, handler)
			{
				var me = this;
				flashDiv.setHandler(this.objectId, eventName, handler ? uniqueGlobalName(function(subObjectId, a, attr)
				{
					handler(new FlashMapObject(subObjectId, propertiesFromArray(a), me), attr);
				}) : null);
			}
			FlashMapObject.prototype.removeHandler = function(eventName)
			{
				flashDiv.removeHandler(this.objectId, eventName);
			}

			FlashMapObject.prototype.setHandlers = function(handlers)
			{
				for (var key in handlers)
					this.setHandler(key, handlers[key]);
			}

			/** Добавление набора статических объектов на карту
			* @function
			* @memberOf api
			* @param {array} data массив добавляемых обьектов
			* @return {array} массив добавленных обьектов
			* @see api.FlashMapObject#addObject
			* @see <a href="http://kosmosnimki.ru/geomixer/docs/api_samples/ex_static_multi.html">» Пример использования</a>.
			* @author <a href="mailto:saleks@scanex.ru">Sergey Alexseev</a>
			*/
			FlashMapObject.prototype.addObjects = function(data) {
				var out = [];
				for (var i=0; i<data.length; i++)	// Подготовка массива обьектов
				{
					var ph = data[i];
					var props = ph['properties'] || null;
					var tmp = {
						"parentId": this.objectId,
						"geometry": merc_geometry(ph['geometry']),
						"properties": props
					};
					if(ph['setStyle']) tmp['setStyle'] = ph['setStyle'];
					if(ph['setLabel']) tmp['setLabel'] = ph['setLabel'];
					out.push(tmp);
				}
				var _obj = flashDiv.addObjects(out);	// Отправить команду в SWF

				out = [];
				for (var i=0; i<_obj.length; i++)	// Отражение обьектов в JS
				{
					out.push(new FlashMapObject(_obj[i], data[i].properties, this));
				}
				return out;
			}
			FlashMapObject.prototype.addObject = function(geometry, props) {
				var geo = merc_geometry(geometry);
				var obj = flashDiv.addObject(this.objectId, geo, props);
				if(!obj) obj = false;
				return new FlashMapObject(obj, props, this);
			}
			FlashMapObject.prototype.setFilter = function(sql) {
				return flashDiv.setFilter(this.objectId, sql);
			}
			FlashMapObject.prototype.remove = function()
			{
				if (this.copyright) 
					map.removeCopyrightedObject(this);
					
				if(this.objectId) flashDiv.remove(this.objectId); // Удалять в SWF только если там есть обьект
			}
			FlashMapObject.prototype.bringToTop = function() { return flashDiv.bringToTop(this.objectId); }
			FlashMapObject.prototype.bringToBottom = function() { flashDiv.bringToBottom(this.objectId); }
			FlashMapObject.prototype.bringToDepth = function(n) { return flashDiv.bringToDepth(this.objectId, n); }
			FlashMapObject.prototype.setDepth = FlashMapObject.prototype.bringToDepth;
			FlashMapObject.prototype.setZoomBounds = function(minZoom, maxZoom) { flashDiv.setZoomBounds(this.objectId, minZoom, maxZoom); }
			FlashMapObject.prototype.setVisible = function(flag) 
			{
/*
				FlashCMD('setVisible', { 'obj': this, 'attr': flag });
*/
				flashDiv.setVisible(this.objectId, flag); 
				if (flag && this.backgroundColor)
					map.setBackgroundColor(this.backgroundColor);
				if (this.copyright)
					map.updateCopyright();
				var func = map.onSetVisible[this.objectId];
				if (func)
					func(flag);
			}
			FlashMapObject.prototype.getVisibility = function() { return flashDiv.getVisibility(this.objectId); }
			FlashMapObject.prototype.setStyle = function(style, activeStyle) {
				flashDiv.setStyle(this.objectId, style, activeStyle);
			}
			FlashMapObject.prototype.getStyle = function( removeDefaults ) { return flashDiv.getStyle(this.objectId, typeof removeDefaults == 'undefined' ? false : removeDefaults); }
			FlashMapObject.prototype.setActive = function(flag) { flashDiv.setActive_(this.objectId, flag); }
			FlashMapObject.prototype.setEditable = function() { flashDiv.setEditable(this.objectId); }
			FlashMapObject.prototype.startDrawing = function(type) { flashDiv.startDrawing(this.objectId, type); }
			FlashMapObject.prototype.stopDrawing = function(type) { flashDiv.stopDrawing(this.objectId); }
			FlashMapObject.prototype.isDrawing = function() { return flashDiv.isDrawing(this.objectId); }
			FlashMapObject.prototype.getIntermediateLength = function() { return flashDiv.getIntermediateLength(this.objectId); }
			FlashMapObject.prototype.getCurrentEdgeLength = function() { return flashDiv.getCurrentEdgeLength(this.objectId); }
			FlashMapObject.prototype.setLabel = function(label) { flashDiv.setLabel(this.objectId, label); }
			FlashMapObject.prototype.setGeometry = function(geometry) {
				var geom =  merc_geometry(geometry);
				flashDiv.setGeometry(this.objectId, geom);
			}
			FlashMapObject.prototype.getGeometry = function() 
			{ 
				var geom = flashDiv.getGeometry(this.objectId);
				var out = { "type": geom.type };
				var coords =  forEachPoint(geom.coordinates, function(c) {
							return [from_merc_x(c[0]), from_merc_y(c[1])];
							}
					);
				out["coordinates"] = coords;
				return out;
			}
			FlashMapObject.prototype.getLength = function(arg1, arg2, arg3, arg4)
			{
				return arg1 ? geoLength(arg1, arg2, arg3, arg4) : flashDiv.getLength(this.objectId);
			}
			FlashMapObject.prototype.getArea = function(arg)
			{
				return arg ? geoArea(arg) : flashDiv.getArea(this.objectId);
			}
			FlashMapObject.prototype.getCenter = function(arg1, arg2, arg3, arg4)
			{
				return arg1 ? geoCenter(arg1, arg2, arg3, arg4) : flashDiv.getCenter(this.objectId);
			}
			FlashMapObject.prototype.getGeometryType = function()
			{
				return flashDiv.getGeometryType(this.objectId);
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

				var n = 100;            //кол-во точек
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

				var circle = [];
				var coordinates = [];

				for (var fi = 0; fi < 2*Math.PI + 0.000001; fi += (2*Math.PI/n))
				{
					var v = v_fi(fi, a, b);
					for (var i=0; i<3; i++)
						circle[i] = VR[i] + d*v[i];

					var t1 = (180*Math.asin(circle[2]/R)/Math.PI);
					var r = Math.sqrt(circle[0]*circle[0]+circle[1]*circle[1]);
					var t2 = circle[1]<0 ? -180*Math.acos(circle[0]/r)/Math.PI :
						180*Math.acos(circle[0]/r)/Math.PI;

					if (t2 < x - 180)
						t2 += 360;
					else if (t2 > x + 180)
						t2 -= 360;

					coordinates.push([t2, t1]);
				}

				this.setPolygon(coordinates);
			}
			FlashMapObject.prototype.clearBackgroundImage = function() { flashDiv.clearBackgroundImage(this.objectId); }
			FlashMapObject.prototype.setImageExtent = function(attr)
			{
				this.setStyle({ fill: { color: 0x000000, opacity: 100 } });
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
				flashDiv.setImageExtent(this.objectId, attr);
			}
			FlashMapObject.prototype.setImage = function(url, x1, y1, x2, y2, x3, y3, x4, y4, tx1, ty1, tx2, ty2, tx3, ty3, tx4, ty4)
			{
				this.setStyle({ fill: { color: 0x000000, opacity: 100 } });
				if (tx1)
					flashDiv.setImage(this.objectId, url, merc_x(tx1), merc_y(ty1), merc_x(tx2), merc_y(ty2), merc_x(tx3), merc_y(ty3), merc_x(tx4), merc_y(ty4), x1, y1, x2, y2, x3, y3, x4, y4);
				else
				{
					this.setPolygon([[x1, y1], [x2, y2], [x3, y3], [x4, y4], [x1, y1]]);
					flashDiv.setImage(this.objectId, url, merc_x(x1), merc_y(y1), merc_x(x2), merc_y(y2), merc_x(x3), merc_y(y3), merc_x(x4), merc_y(y4));
				}
			}
			FlashMapObject.prototype.setBackgroundTiles = function(imageUrlFunction, projectionCode) { flashDiv.setBackgroundTiles(this.objectId, uniqueGlobalName(imageUrlFunction), projectionCode); }
			FlashMapObject.prototype.setDisplacement = function(dx, dy) { flashDiv.setDisplacement(this.objectId, dx, dy); }
			FlashMapObject.prototype.setTiles = FlashMapObject.prototype.setBackgroundTiles;
			FlashMapObject.prototype.setTileCaching = function(flag) { flashDiv.setTileCaching(this.objectId, flag); }
			FlashMapObject.prototype.setVectorTiles = function(dataUrlFunction, cacheFieldName, dataTiles) 
			{ 
				flashDiv.setVectorTiles(this.objectId, uniqueGlobalName(dataUrlFunction), cacheFieldName, dataTiles);
			}
			FlashMapObject.prototype.loadJSON = function(url)
			{
				flashDiv.loadJSON(this.objectId, url);
			}
			FlashMapObject.prototype.addMapWindow = function(callback) 
			{ 
				return new FlashMapObject(flashDiv.addMapWindow(
					uniqueGlobalName(function(z) { return 17 - callback(17 - z); })
				), {}, null);
			}
			FlashMapObject.prototype.positionWindow = function(x1, y1, x2, y2) { flashDiv.positionWindow(this.objectId, x1, y1, x2, y2); }
			FlashMapObject.prototype.setCopyright = function(copyright)
			{
				this.copyright = copyright;
				map.addCopyrightedObject(this);
			}
			FlashMapObject.prototype.setBackgroundColor = function(color)
			{ 
				this.backgroundColor = color;
				flashDiv.setBackgroundColor(this.objectId, color);
				if (this.objectId == map.objectId)
				{
					var isWhite = (0xff & (color >> 16)) > 80;
					var htmlColor = isWhite ? "black" : "white";
					coordinates.style.fontSize = "14px";
					coordinates.style.color = htmlColor;
					scaleBar.style.border = "1px solid " + htmlColor;
					scaleBar.style.fontSize = "11px";
					scaleBar.style.color = htmlColor;
					copyright.style.fontSize = "11px";
					copyright.style.color = htmlColor;
					changeCoords.src = apiBase + "img/" + (isWhite ? "coord_reload.png" : "coord_reload_orange.png");
				}
			}

			FlashMapObject.prototype.getGeometrySummary = function()
			{
				var geomType = this.getGeometryType();
				if (geomType.indexOf("POINT") != -1)
				{
					var c = this.getGeometry().coordinates;
					return "<b>" + KOSMOSNIMKI_LOCALIZED("Координаты:", "Coordinates:") + "</b> " + formatCoordinates(merc_x(c[0]), merc_y(c[1]));
				}
				else if (geomType.indexOf("LINESTRING") != -1)
					return "<b>" + KOSMOSNIMKI_LOCALIZED("Длина:", "Length:") + "</b> " + prettifyDistance(this.getLength());
				else if (geomType.indexOf("POLYGON") != -1)
					return "<b>" + KOSMOSNIMKI_LOCALIZED("Площадь:", "Area:") + "</b> " + prettifyArea(this.getArea());
				else
					return "?";
			}


			FlashMapObject.prototype.addBalloon = function()
			{
				return map.balloonClassObject.addBalloon();
			}
			FlashMapObject.prototype.enableHoverBalloon = function(callback, attr)
			{
				map.balloonClassObject.enableHoverBalloon(this, callback, attr);
			}
			FlashMapObject.prototype.disableHoverBalloon = function()
			{
				map.balloonClassObject.disableHoverBalloon();
			}

			FlashMapObject.prototype.setToolImage = function(imageName, activeImageName)
			{
				this.setStyle(
					{ marker: { image: apiBase + "img/" + imageName } },
					activeImageName ? { marker: { image: apiBase + "img/" + activeImageName } } : null
				);
			}

			FlashMapObject.prototype.enableQuicklooks = function(callback)
			{
				var flag = true;

				if (this.shownQuicklooks)
					for (var url in this.shownQuicklooks)
						this.shownQuicklooks[url].remove();
				var shownQuicklooks = {};
				this.shownQuicklooks = shownQuicklooks;

				this.setHandler("onClick", function(o)
				{
					try {
					var identityField = gmxAPI.getIdentityField(o);
					var id = 'id_' + o.properties[identityField];
					if (!shownQuicklooks[id])
					{
						var url = callback(o);
						var d1 = 100000000;
						var d2 = 100000000;
						var d3 = 100000000;
						var d4 = 100000000;
						var x1, y1, x2, y2, x3, y3, x4, y4;
						forEachPoint(o.getGeometry().coordinates, function(p)
						{
							var x = merc_x(p[0]);
							var y = merc_y(p[1]);
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

						var q = o.addObject(null, o.properties);
						shownQuicklooks[id] = q;
						q.setStyle({ fill: { opacity: 100 } });
						q.setImage(url, x1, y1, x2, y2, x3, y3, x4, y4);
					}
					else
					{
						shownQuicklooks[id].remove();
						delete shownQuicklooks[id];
					}
					} catch (e) { alert(e); }
				});
			}

			FlashMapObject.prototype.enableTiledQuicklooks = function(callback, minZoom, maxZoom)
			{
				this.enableTiledQuicklooksEx(function(o, image)
				{
					var path = callback(o);
					image.setTiles(function(i, j, z) 
					{
						return path + z + "/" + i + "/" + z + "_" + i + "_" + j + ".jpg";
					});
				}, minZoom, maxZoom);
			}

			FlashMapObject.prototype.enableTiledQuicklooksEx = function(callback, minZoom, maxZoom)
			{
				var images = {};
				if (this.tilesParent)
					this.tilesParent.remove();
				var tilesParent = this.addObject();
				this.tilesParent = tilesParent;
				tilesParent.setZoomBounds(minZoom, maxZoom ? maxZoom : 18);
				var propsArray = [];
				var flipCounts = {};
				var updateImageDepth = function(o)
				{
					var identityField = gmxAPI.getIdentityField(o);
					var id = 'id_' + o.properties[identityField];
					var props = o.properties;

					// Установка балуна для тайлов меньше Zoom растров
					var curZ = map.getZ();
					var flag = (minZoom && curZ < minZoom ? true : false);
					var mZ = (maxZoom ? maxZoom : 18);
					if(!flag && curZ > mZ) flag = true;
					if(flag) map.balloonClassObject.clickBalloonFix(o);
					///// End

					if (!images[id]) {
						return;
					}
					var lastDate = props.date || props.DATE;
					var lastFc = flipCounts[id];
					var n = 0;
					for (var i = 0; i < propsArray.length; i++)
					{
						var pa = propsArray[i];
						var date = pa.date || pa.DATE;
						var fc = flipCounts["id_" + pa[identityField]];
						var isHigher = false;
						if (!lastFc)
							isHigher = !fc ? (lastDate && (date > lastDate)) : (fc < 0);
						else if (lastFc > 0)
							isHigher = !fc || (fc < lastFc);
						else if (lastFc < 0)
							isHigher = fc && (fc < lastFc);

						if (!isHigher)
							n += 1;
					}
					images[id].bringToDepth(n - 1);
				}
				tilesParent.setZoomBounds(minZoom, maxZoom ? maxZoom : 18);
				tilesParent.observeVectorLayer(this, function(o, flag)
				{
					var identityField = gmxAPI.getIdentityField(o);
					var id = 'id_' + o.properties[identityField];
					if (flag && !images[id])
					{
						var image = tilesParent.addObject(o.geometry, o.properties);
						callback(o, image);
						images[id] = image;
						propsArray.push(o.properties);
						updateImageDepth(o);
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
				});
				this.setHandler("onClick", function(o)
				{
					try {
						var identityField = gmxAPI.getIdentityField(o);
						var id = 'id_' + o.properties[identityField];
						flipCounts[id] = o.flip();
						updateImageDepth(o);
					} catch (e) { alert(e); }
				});
			}

			FlashMapObject.prototype.flip = function() { return flashDiv.flip(this.objectId); }

			var FlashMapFeature = function(geometry, properties, layer)
			{
				this.geometry = geometry;
				this.properties = properties;
				this.layer = layer;
			}
			FlashMapFeature.prototype.getGeometry = function()
			{
				return this.geometry;
			}
			FlashMapFeature.prototype.getLength = function()
			{
				return geoLength(this.geometry);
			}
			FlashMapFeature.prototype.getArea = function()
			{
				return geoArea(this.geometry);
			}

			function reSetStyles(styles, obj)
			{
				for (var i = 0; i < styles.length; i++)
				{
					var style = styles[i];
					var givenStyle = {};
					if (typeof style.StyleJSON != 'undefined')
						givenStyle = style.StyleJSON;
					else if (typeof style.RenderStyle != 'undefined')
						givenStyle = style.RenderStyle;
					else
					{
						if (style.PointSize)
							givenStyle.marker = { size: parseInt(style.PointSize) };
						if (style.Icon)
						{
							var src = (style.Icon.indexOf("http://") != -1) ?
								style.Icon :
								(baseAddress + "/" + style.Icon);
							givenStyle.marker = { image: src, "center": true };
						}
						if (style.BorderColor || style.BorderWidth)
							givenStyle.outline = {
								color: parseColor(style.BorderColor),
								thickness: parseInt(style.BorderWidth || "1"),
								opacity: (style.BorderWidth == "0" ? 0 : 100)
							};
						if (style.FillColor)
							givenStyle.fill = {
								color: parseColor(style.FillColor),
								opacity: 100 - parseInt(style.Transparency || "0")
							};

						var label = style.label || style.Label;
						if (label)
						{
							givenStyle.label = {
								field: label.FieldName,
								color: parseColor(label.FontColor),
								size: parseInt(label.FontSize || "12")
							};
						}
					}

					if (givenStyle.marker)
						givenStyle.marker.center = true;

					var hoveredStyle = JSON.parse(JSON.stringify(givenStyle));
					if (hoveredStyle.marker && hoveredStyle.marker.size)
						hoveredStyle.marker.size += 1;
					if (hoveredStyle.outline)
						hoveredStyle.outline.thickness += 1;

					var filter = obj.addObject();
					var filterSet = false;
					if (style.Filter)
					{
						if (/^\s*\[/.test(style.Filter))
						{
							var a = style.Filter.match(/^\s*\[([a-zA-Z0-9_]+)\]\s*([<>=]=?)\s*(.*)$/);
							if (a && (a.length == 4))
							{
								filter.setFilter(a[1] + " " + a[2] + " '" + a[3] + "'");
								filterSet = true;
							}
						}
						else
						{
							filter.setFilter(style.Filter);
							filterSet = true;
						}
					}
					if (!filterSet)
						filter.setFilter();
					filter.setZoomBounds(style.MinZoom, style.MaxZoom);
					filter.setStyle(givenStyle, hoveredStyle);
					
					map.balloonClassObject.applyBalloonDefaultStyle(style);
					map.balloonClassObject.setBalloonFromParams(filter, style);

					if(obj.filters[i]) obj.filters[i].objectId = filter.objectId;
				}
			}

			var maxRasterZoom = 1;
			var initialLayersAdded = false;
			FlashMapObject.prototype.addLayer = function(layer, isVisible)
			{
				if (!this.layers)
					this.layers = [];
				if (!this.layersParent)
					this.layersParent = this.addObject();
				if (!this.overlays)
				{
					this.overlays = this.addObject();
					this.addObject = function(geom, props)
					{
						var ret = FlashMapObject.prototype.addObject.call(this, geom, props);
						this.overlays.bringToTop();
						return ret;
					}
				}

				if (isVisible === undefined)
					isVisible = true;

				if(!layer.properties.identityField) layer.properties.identityField = "ogc_fid";
				var isRaster = (layer.properties.type == "Raster");
				var t = layer.properties.name || layer.properties.image;
				var obj = new FlashMapObject(false, {}, this);
				obj.geometry = layer.geometry;
				obj.properties = layer.properties;
				var me = this;
				var isOverlay = false;
				var arr = getBaseMapParam("overlayLayerID","").split(",");
				for (var i = 0; i < arr.length; i++) {
					if(t == arr[i]) {
						isOverlay = true;
						break;
					}
				}

				if (isOverlay)
					layer.properties.type = "Overlay";

				obj.filters = [];
				if (!isRaster)
				{
					for (var i = 0; i < layer.properties.styles.length; i++)
					{
						var tmp = new FlashMapObject(false, {}, this);
						obj.filters.push(tmp);
						var style = layer.properties.styles[i];
						if (style.Filter && style.Filter.Name)
							obj.filters[style.Filter.Name] = tmp;
					}
				}

				var baseAddress = "http://" + layer.properties.hostName + "/";
				//var sessionKey = (layer.properties.hostName.indexOf("maps.kosmosnimki.ru") != -1 || window.KOSMOSNIMKI_SESSION_KEY) ? window.KOSMOSNIMKI_SESSION_KEY : false;
				var sessionKey = isRequiredAPIKey( layer.properties.hostName ) ? window.KOSMOSNIMKI_SESSION_KEY : false;
				var sessionKey2 = window.sessionKeyCache[layer.properties.mapName];
				var isInitial = !initialLayersAdded;
				var isInvalid = (sessionKey == "INVALID");

				var bounds = false;
				if (layer.geometry)
					bounds = getBounds(merc_geometry(layer.geometry).coordinates);
				var tileFunction = function(i, j, z)
				{ 
					if (bounds)
					{
						var tileSize = getScale(z)*256;
						var minx = i*tileSize;
						var maxx = minx + tileSize;
						if (maxx < bounds.minX) {
							i += Math.pow(2, z);
						}
						else if (minx > bounds.maxX) {
							i -= Math.pow(2, z);
						}
					}

					return baseAddress + 
						"TileSender.ashx?ModeKey=tile" + 
						"&MapName=" + layer.properties.mapName + 
						"&LayerName=" + t + 
						"&z=" + z + 
						"&x=" + i + 
						"&y=" + j + 
						(sessionKey ? ("&key=" + encodeURIComponent(sessionKey)) : "") +
						(sessionKey2 ? ("&MapSessionKey=" + sessionKey2) : "");
				}

				var deferredMethodNames = ["setHandler", "setStyle", "setBackgroundColor", "setCopyright", "addObserver", "enableTiledQuicklooks", "enableTiledQuicklooksEx"];

				var createThisLayer = function()
				{
					var obj_ = (isOverlay ? me.overlays : me.layersParent).addObject(obj.geometry, obj.properties);
					obj.objectId = obj_.objectId;
					obj.isVisible = true;
					obj.setVisible = function(flag)
					{
						FlashMapObject.prototype.setVisible.call(obj, flag);
						obj.isVisible = flag;
					}
					for (var i = 0; i < deferredMethodNames.length; i++)
						delete obj[deferredMethodNames[i]];
					delete obj["getFeatures"];
					delete obj["getFeatureById"];
					if (!isRaster)
					{
						obj.setHandler = function(eventName, handler)
						{
							FlashMapObject.prototype.setHandler.call(obj, eventName, handler);
							for (var i = 0; i < obj.filters.length; i++)
								obj.filters[i].setHandler(eventName, handler);
						}
					}
					obj.addObserver = function(o, onChange)
					{
						flashDiv.observeVectorLayer(
							o.objectId,
							obj.objectId,
							uniqueGlobalName(function(geom, props, flag)
							{
								onChange(new FlashMapFeature(from_merc_geometry(geom), props, obj), flag);
							})
						);
					}
					if (isRaster) {
						obj.setBackgroundTiles(tileFunction);
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
									str = arg;
								else if (typeof arg == 'object')
									geometry = arg;
							}
							if (!str && (obj.properties.GeometryType == "point"))
								flashDiv.getFeatures(
									obj.objectId, 
									merc_geometry(geometry ? geometry : { type: "POLYGON", coordinates: [[-180, -89, -180, 89, 180, 89, 180, -89]] }),
									uniqueGlobalName(function(geoms, props)
									{
										var ret = [];
										for (var i = 0; i < geoms.length; i++)
											ret.push(new FlashMapFeature(
												from_merc_geometry(geoms[i]),
												props[i],
												obj
											));
										callback(ret);
									})
								);
							else
								map.getFeatures(str, geometry, callback, [obj.properties.name]);
						}

						obj.getFeatureById = function(fid, func)
						{
							flashDiv.getFeatureById(
								obj.objectId,
								fid,
								uniqueGlobalName(function(geom, props)
								{
									func(new FlashMapFeature(
										from_merc_geometry(geom),
										props,
										obj
									));
								})
							);
						}

						obj.setVectorTiles(tileFunction, layer.properties.identityField, layer.properties.tiles);
						obj.setStyle = function(style, activeStyle)
						{
							for (var i = 0; i < obj.filters.length; i++)
								obj.filters[i].setStyle(style, activeStyle);
						}

						reSetStyles(layer.properties.styles, obj);
						obj.reSetStyles =  function(styles)
						{
							for (var i = 0; i < obj.filters.length; i++) {
								obj.filters[i].remove();
							}
							reSetStyles(styles, obj);
						}
						obj.getStat = function() {
							var _obj = flashDiv.getStat(obj.objectId);
							return _obj;
						}
						obj.setTiles = function(data) {
							var _obj = flashDiv.setTiles(obj.objectId, data);
							return _obj;
						}

						if (layer.properties.Quicklook)
							obj.enableQuicklooks(function(o)
							{
								return gmxAPI.applyTemplate(layer.properties.Quicklook, o.properties);
							});
						if (layer.properties.TiledQuicklook)
							obj.enableTiledQuicklooks(function(o)
							{
								return gmxAPI.applyTemplate(layer.properties.TiledQuicklook, o.properties);
							}, layer.properties.TiledQuicklookMinZoom);
					}

					for (var i = 0; i < obj.filters.length; i++)
					{
						var filter = obj.filters[i];
						delete filter["setVisible"];
						delete filter["setStyle"];
						delete filter["setFilter"];
						delete filter["enableHoverBalloon"];
					}

					var minStyleZoom = 20, maxStyleZoom = 0;
					for (var i = 0; i < layer.properties.styles.length; i++)
					{
						var style = layer.properties.styles[i];
						minStyleZoom = Math.min(style.MinZoom, minStyleZoom);
						maxStyleZoom = Math.max(style.MaxZoom, maxStyleZoom);
					}
					if (!isInvalid) {
						obj.setZoomBounds(minStyleZoom, maxStyleZoom);
					} else {
						obj.setZoomBounds(20, 20);
					}

					if (layer.properties.Copyright)
						obj.setCopyright(layer.properties.Copyright);
				}

				if (isVisible)
					createThisLayer();
				else
				{
					var deferred = [];
					obj.setVisible = function(flag)
					{
						if (flag)
						{
							createThisLayer();
							var n = 0;
							for (var i = 0; i < myIdx; i++)
							{
								var l = me.layers[i];
								if (l.objectId && (l.properties.type != "Overlay"))
									n += 1;
							}
							obj.bringToDepth(n);
							for (var i = 0; i < deferred.length; i++)
								deferred[i]();
							if(obj.objectId) flashDiv.setVisible(obj.objectId, flag);
						}
						obj.isVisible = flag;
					}
					obj.addObject = function(geometry, props)
					{
						obj.setVisible(true);
						var newObj = flashDiv.addObject(obj.objectId, geometry, props);
						obj.setVisible(false);
						return new FlashMapObject(newObj, props, obj);
					}
					for (var i = 0; i < deferredMethodNames.length; i++) (function(name)
					{
						obj[name] = function(p1, p2, p3, p4) 
						{ 
							deferred.push(function() { obj[name].call(obj, p1, p2, p3, p4); });
						}
					})(deferredMethodNames[i]);
					if (!isRaster)
					{
						obj.getFeatures = function(arg1, arg2, arg3)
						{							
							obj.setVisible(true);
							obj.getFeatures(arg1, arg2, arg3);
							obj.setVisible(false);
						}
						obj.getFeatureById = function(arg1, arg2, arg3)
						{							
							obj.setVisible(true);
							obj.getFeatureById(arg1, arg2, arg3);
							obj.setVisible(false);
						}
						for (var i = 0; i < layer.properties.styles.length; i++) (function(i)
						{
							obj.filters[i].setVisible = function(flag)
							{
								deferred.push(function() { obj.filters[i].setVisible(flag); });
							}
							obj.filters[i].setStyle = function(style, activeStyle)
							{
								deferred.push(function() { obj.filters[i].setStyle(style, activeStyle); });
							}
							obj.filters[i].setFilter = function(sql)
							{
								deferred.push(function() { obj.filters[i].setFilter(sql); });
								return true;
							}
							obj.filters[i].enableHoverBalloon = function(callback)
							{
								deferred.push(function() { obj.filters[i].enableHoverBalloon(callback); });
							}
						})(i);
					}
				}

				if (isRaster && (layer.properties.MaxZoom > maxRasterZoom))
					maxRasterZoom = layer.properties.MaxZoom;
				var myIdx = this.layers.length;
				this.layers.push(obj);
				this.layers[t] = obj;
				if (!layer.properties.title.match(/^\s*[0-9]+\s*$/))
					this.layers[layer.properties.title] = obj;
				return obj;
			}

			FlashMapObject.prototype.observeVectorLayer = function(obj, onChange)
			{
				obj.addObserver(this, onChange);
			}

			FlashMapObject.prototype.addOSM = function()
			{
				var osm = this.addObject();
				osm.setOSMTiles();
				return osm;
			}

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
					return "http://" + letter + ".tile.osmosnimki.ru/kosmo" + KOSMOSNIMKI_LOCALIZED("", "-en") + "/" + z + "/" + i + "/" + j + ".png";
				}
				this.setBackgroundTiles(function(i, j, z)
				{
					var size = Math.pow(2, z - 1);
					return func(i + size, size - j - 1, z);
				}, 1);
				
				this.setCopyright("<a href='http://openstreetmap.org'>&copy; OpenStreetMap</a>, <a href='http://creativecommons.org/licenses/by-sa/2.0/'>CC-BY-SA</a>");
					
				this.setBackgroundColor(0xffffff);
				this.setTileCaching(false);
			}

			var map = new FlashMapObject(rootObjectId, {}, null);
			map.onSetVisible = {};
			map.layers = [];
			map.rasters = map;
			map.tiledQuicklooks = map;
			map.vectors = map;
			map.balloonClassObject = new BalloonClass(map, flashDiv, div, apiBase);

			var toolHandlers = {};
			var userHandlers = {};
			var updateMapHandler = function(eventName)
			{
				var h1 = toolHandlers[eventName];
				var h2 = userHandlers[eventName];
				FlashMapObject.prototype.setHandler.call(map, eventName, h1 ? h1 : h2 ? h2 : null);
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
			var setToolHandlers = function(handlers)
			{
				for (var eventName in handlers)
					setToolHandler(eventName, handlers[eventName]);
			}

			map.getFeatures = function()
			{
				var callback, geometry, str;
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
				if (!geometry)
					geometry = { type: "POLYGON", coordinates: [[-180, -89, -180, 89, 180, 89, 180, -89, -180, -89]] };
				var url = "http://" + map.layers[layerNames[0]].properties.hostName + "/SearchObject/SearchVector.ashx" + 
					"?LayerNames=" + layerNames.join(",") + 
					"&MapName=" + map.layers[layerNames[0]].properties.mapName +
					(str ? ("&SearchString=" + escape(str)) : "") +
					(geometry ? ("&border=" + JSON.stringify(merc_geometry(geometry))) : "");
				sendCrossDomainJSONRequest(
					url,
					function(searchReq)
					{
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
									ret.push(new FlashMapFeature( 
										from_merc_geometry(item.geometry),
										item.properties,
										map.layers[req.name]
									));
								}
							}
						}						
						callback(ret);
					}
				);
			}

			map.geoSearchAPIRoot = typeof window.searchAddressHost !== 'undefined' ? window.searchAddressHost : getAPIHostRoot();
			map.sendSearchRequest = function(str, callback)
			{
				sendCrossDomainJSONRequest(
					map.geoSearchAPIRoot + "SearchObject/SearchAddress.ashx?SearchString=" + escape(str),
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

			map.addContextMenuItem = function(text, callback)
			{
				flashDiv.addContextMenuItem(text, uniqueGlobalName(function(x, y)
				{
					callback(from_merc_x(x), from_merc_y(y));
				}));
			}

			map.addContextMenuItem(
				KOSMOSNIMKI_LOCALIZED("Поставить маркер", "Add marker"),
				function(x, y)
				{
					map.drawing.addObject({type: "POINT", coordinates: [x, y]});
				}
			);
			map.grid = {
				setVisible: function(flag) { flashDiv.setGridVisible(flag); },
				getVisibility: function(flag) { return flashDiv.getGridVisibility(); }
			};

			var allTools = newStyledDiv({ position: "absolute", top: 0, left: 0 });
			div.appendChild(allTools);

			var baseLayers = {};
			var currentBaseLayerName = false;
			FlashMapObject.prototype.setAsBaseLayer = function(name)
			{
				if (!baseLayers[name])
					baseLayers[name] = [];
				baseLayers[name].push(this);
				map.baseLayerControl.repaint();
			}
			map.setBaseLayer = function(name)
			{
				for (var oldName in baseLayers)
					if (oldName != name)
						for (var i = 0; i < baseLayers[oldName].length; i++)
							baseLayers[oldName][i].setVisible(false);
				currentBaseLayerName = name;
				var newBaseLayers = baseLayers[currentBaseLayerName];
				if (newBaseLayers)
					for (var i = 0; i < newBaseLayers.length; i++)
						newBaseLayers[i].setVisible(true);
				map.baseLayerControl.repaint();
				if (map.baseLayerControl.onChange)
					map.baseLayerControl.onChange(name);
			}
			map.getBaseLayer = function()
			{
				return currentBaseLayerName;
			}
			var baseLayerDiv = newStyledDiv({
				position: "absolute",
				left: "40px",
				top: "40px",
				display: "none",
				fontWeight: "bold",
				textAlign: "center"
			});
			var baseLayerBg = newStyledDiv({
				position: "absolute",
				left: "40px",
				top: "40px",
				backgroundColor: "#016a8a",
				opacity: 0.5
			});
			allTools.appendChild(baseLayerBg);
			allTools.appendChild(baseLayerDiv);
			map.baseLayerControl = {
				isVisible: true,
				setVisible: function(flag)
				{
					this.isVisible = flag;
					this.updateVisibility();
				},
				updateVisibility: function()
				{
					var haveBaseLayers = false;
					for (var key in baseLayers)
						haveBaseLayers = true;
					var flag = haveBaseLayers && this.isVisible;
					setVisible(baseLayerBg, flag);
					setVisible(baseLayerDiv, flag);
				},
				repaint: function()
				{
					baseLayerDiv.innerHTML = "";
					for (var name in baseLayers) (function(name)
					{
						if (name == currentBaseLayerName)
						{
							baseLayerDiv.appendChild(newElement(
								"div",
								{ innerHTML: name },
								{ 
									padding: "15px",
									paddingTop: "8px", 
									paddingBottom: "9px", 
									fontSize: "12px",
									fontFamily: "sans-serif",
									color: "orange"
								}
							));
						}
						else
						{
							baseLayerDiv.appendChild(newElement(
								"div",
								{
									innerHTML: name,
									onmouseover: function() { this.style.color = "orange"; },
									onmouseout: function() { this.style.color = "white"; },
									onclick: function() { map.setBaseLayer(name); }
								},
								{ 
									padding: "15px", 
									paddingTop: "8px", 
									paddingBottom: "9px", 
									fontSize: "12px",
									fontFamily: "sans-serif",
									cursor: "pointer", 
									color: "white" 
								}
							));
						}
					})(name);
					setTimeout(function()
					{
						baseLayerBg.style.width = baseLayerDiv.clientWidth + "px";
						baseLayerBg.style.height = baseLayerDiv.clientHeight + "px";
					}, 50);
					this.updateVisibility();
				}, 
				getBaseLayerNames: function()
				{
					var res = [];
					for (var k in baseLayers) res.push(k);
					return res;
				},
				getBaseLayerLayers: function(name)
				{
					return baseLayers[name];
				}
			}

			var zoomParent = newStyledDiv({
				position: "absolute",
				left: "40px",
				top: "5px"
			});
			allTools.appendChild(zoomParent);
			var zoomPlaque = newStyledDiv({
				backgroundColor: "#016a8a",
				opacity: 0.5,
				position: "absolute",
				left: 0,
				top: 0
			});
			zoomParent.appendChild(zoomPlaque);

			zoomParent.appendChild(newElement(
				"img",
				{
					src: apiBase + "img/zoom_minus.png",
					onclick: function()
					{
						map.zoomBy(-1);
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
			));
			var zoomPlus = newElement(
				"img",
				{
					src: apiBase + "img/zoom_plus.png",
					onclick: function()
					{
						map.zoomBy(1);
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
			)
			zoomParent.appendChild(zoomPlus);

			var zoomArr = [];
			var zoomObj = false;
			for (var i = 0; i < 20; i++) (function(i)
			{
				var zoomObj_ = newElement(
					"img",
					{
						src: apiBase + "img/zoom_raw.png",
						title: "" + (i + 1),
						onclick: function()
						{
							map.zoomBy(i + minZoom - map.getZ());
						},
						onmouseover: function()
						{
							this.src = apiBase + "img/zoom_active.png";
							this.title = "" + (i + minZoom);
						},
						onmouseout: function()
						{
							this.src = (this == zoomObj) ? (apiBase + "img/zoom_active.png") : (apiBase + "img/zoom_raw.png");
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
				zoomParent.appendChild(zoomObj_);
				zoomArr.push(zoomObj_);
			})(i);

			var minZoom, maxZoom;
			map.zoomControl = {
				isVisible: true,
				isMinimized: false,
				setVisible: function(flag)
				{
					setVisible(zoomParent, flag);
					this.isVisible = flag;
					positionTimeBar();
				},
				repaint: function()
				{
					var dz = maxZoom - minZoom + 1;
					var gap = this.isMinimized ? 8 : 12*dz;
					position(zoomPlus, 20 + gap, 7);
					size(zoomPlaque, 43 + gap, 32);
					map.zoomControl.width = 43 + gap;
					for (var i = 0; i < zoomArr.length; i++)
						setVisible(zoomArr[i], !this.isMinimized && (i < dz));
					positionTimeBar();
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

			FlashMapObject.prototype.setMinMaxZoom = function(z1, z2)
			{ 
				minZoom = z1;
				maxZoom = z2;
				map.zoomControl.repaint();
				flashDiv.setMinMaxZoom(z1, z2);
			}





			var timeBarWidth = 100;
			var leftMarkX = 0;
			var rightMarkX = timeBarWidth;

			var timeBarParent = newStyledDiv({
				position: "absolute",
				top: "5px",
				display: "none"
			});
			allTools.appendChild(timeBarParent);
			var timeBarPlaque = newStyledDiv({
				backgroundColor: "#016a8a",
				opacity: 0.5,
				position: "absolute",
				left: 0,
				top: 0,
				height: "32px"
			});
			timeBarParent.appendChild(timeBarPlaque);
			var timeBar = newStyledDiv({
				position: "absolute",
				height: "4px",
				border: "1px solid white",
				backgroundColor: "#387eaa",
				top: "13px",
				left: "13px"
			});
			timeBarParent.appendChild(timeBar);
 
			timeBar.style.width = timeBarWidth + 12 + "px";
			timeBarPlaque.style.width = timeBarWidth + 40 + "px";

			var positionTimeBar = function()
			{
				position(
					timeBarParent, 
					40 + (map.zoomControl.isVisible ? (map.zoomControl.width + 3) : 0),
					5
				);
			}

			var minTime, maxTime;
			var tickMarks = [];
			var timeBarMinYear = 2050;
			window.updateTimeBarMinYear = function(year)
			{
				if (year >= timeBarMinYear)
					return;
				timeBarMinYear = year;
				minTime = new Date(year, 6, 1).getTime();
				maxTime = new Date().getTime();

				for (var i = 0; i < tickMarks.length; i++)
					timeBar.removeChild(tickMarks[i]);
				tickMarks = [];

				var curTime = new Date(year, 1, 1).getTime();
				while (curTime < maxTime)
				{
					var tickMark = newStyledDiv({
						position: "absolute",
						height: "4px",
						top: 0,
						width: 0,
						borderLeft: "1px solid #b0b0b0",
						left: 6 + Math.round(timeBarWidth*(curTime - minTime)/(maxTime - minTime)) + "px"
					});
					tickMarks.push(tickMark);
					timeBar.appendChild(tickMark);
					var curDate = new Date(curTime);
					curTime = new Date(curDate.getFullYear(), curDate.getMonth() + 1, curDate.getDate()).getTime();
				}
				updateTimeBar();
			}

			var mouseInMark = false;
			var leftMark = newElement(
				"img",
				{
					src: apiBase + "img/sliderIcon.png",
					onmousedown: function(event)
					{
						return startDraggingMark(event, false);
					},
					onmouseover: function()
					{
						this.src = apiBase + "img/sliderIcon_a.png";
						repaintDateTooltip(false);
						mouseInMark = true;
					},
					onmouseout: function()
					{
						this.src = apiBase + "img/sliderIcon.png";
						hide(dateTooltip);
						mouseInMark = false;
					}
				},
				{
					display: "block",
					position: "absolute",
					top: "-5px",
					width: "12px",
					height: "14px",
					cursor: "pointer",
					marginLeft: "-6px"
				}
			);
			timeBar.appendChild(leftMark);
 
			var rightMark = newElement(
				"img",
				{
					src: apiBase + "img/sliderIcon.png",
					onmousedown: function(event)
					{
						return startDraggingMark(event, true);
					},
					onmouseover: function()
					{
						this.src = apiBase + "img/sliderIcon_a.png";
						repaintDateTooltip(true);
						mouseInMark = true;
					},
					onmouseout: function()
					{
						this.src = apiBase + "img/sliderIcon.png";
						hide(dateTooltip);
						mouseInMark = false;
					}
				},
				{
					display: "block",
					position: "absolute",
					top: "-5px",
					width: "12px",
					height: "14px",
					cursor: "pointer",
					marginLeft: "6px"
				}
			);
			timeBar.appendChild(rightMark);

			var pad2 = function(value)
			{
				return (value < 10) ? ("0" + value) : value;
			}
 
			var getDateByX = function(x)
			{
				return new Date(minTime + (x/timeBarWidth)*(maxTime - minTime));
			}

			var getDateString = function(date)
			{
				return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
			}

			var getDatePretty = function(date)
			{
				return date.getDate() + " " + ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"][date.getMonth()] + " " + date.getFullYear();
			}
 
			var filterUpdateTimeout = false;
 
			var updateTimeBar = function()
			{
				if (!map.timeBar.isVisible)
					return;
				leftMark.style.left = leftMarkX + "px";
				rightMark.style.left = rightMarkX + "px";
				var leftDate = getDateByX(leftMarkX);
				var rightDate = getDateByX(rightMarkX);
				var leftDateString = getDateString(leftDate);
				var rightDateString = getDateString(rightDate);
				if (filterUpdateTimeout)
					clearTimeout(filterUpdateTimeout);
				filterUpdateTimeout = setTimeout(function()
				{
					for (var i = 0; i < map.layers.length; i++)
					{
						var layer = map.layers[i];
						if ((layer.isVisible || layer.hiddenByTimeBar) && (layer.properties.type == "Vector") && (layer.properties.description.toLowerCase() == "спутниковое покрытие"))
						{
							var attrs = layer.properties.attributes;
							var hasDateAttribute = false;
							for (var j = 0; j < attrs.length; j++)
							{
								var attr = attrs[j];
								if (attr.toLowerCase() == "date")
								{
									hasDateAttribute = true;
									var filterString = "`" + attr + "` >= '" + leftDateString + "' AND `" + attr + "` <= '" + rightDateString + "'";
									var filters = layer.filters;
									for (var k = 0; k < filters.length; k++)
									{
										var lastFilter = layer.properties.styles[k].Filter;
										filters[k].setFilter((lastFilter && (lastFilter == "")) ? ("(" + lastFilter + ") AND" + filterString) : filterString);
									}
								}
							}
							if (!hasDateAttribute)
							{
								var date = layer.properties.date;
								if (date.length == 10)
								{
									var date2 = date.substring(6, 10) + "-" + date.substring(3, 5) + "-" + date.substring(0, 2);
									var dateInRange = ((date2 >= leftDateString) && (date2 <= rightDateString));
									if (layer.isVisible && !dateInRange)
									{
										//layer.hiddenByTimeBar = true;
										//layer.setVisible(false);
									}
									else if (!layer.isVisible && layer.hiddenByTimeBar && dateInRange)
									{
										layer.hiddenByTimeBar = false;
										layer.setVisible(true);
									}
								}
							}
						}
					}
					filterUpdateTimeout = false;
				}, 50);
			}
 
			var startDraggingMark = function(event, isRight)
			{
				var startMouseX = eventX(event);
				var startX = isRight ? rightMarkX : leftMarkX;
				document.documentElement.onmousemove = function(event)
				{
					var newX = startX + (eventX(event) - startMouseX);
					if (isRight)
						rightMarkX = Math.max(leftMarkX, Math.min(timeBarWidth, newX));
					else
						leftMarkX = Math.min(rightMarkX, Math.max(0, newX));
					repaintDateTooltip(isRight);
					updateTimeBar();
					return false;
				}
				document.documentElement.onmouseup = function(event)
				{
					document.documentElement.onmousemove = null;
					document.documentElement.onmouseup = null;
					if (event && event.stopPropagation)
						event.stopPropagation();
					if (!mouseInMark)
						hide(dateTooltip);
					return false;
				}
				if (event && event.stopPropagation)
					event.stopPropagation();
				return false;
			}

			var dateTooltip = newStyledDiv({
				position: "absolute",
				top: "30px",
				padding: "3px",
				fontSize: "11px",
				fontFamily: "sans-serif",
				border: "1px solid black",
				backgroundColor: "#ffffe0",
				whiteSpace: "nowrap",
				display: "none"
			});
			timeBar.appendChild(dateTooltip);

			var repaintDateTooltip = function(isRight)
			{
				show(dateTooltip);
				var x = isRight ? rightMarkX : leftMarkX;
				dateTooltip.style.left = x + (isRight ? 10 : 0);
				dateTooltip.innerHTML = getDatePretty(getDateByX(x));
			}

			map.timeBar = {
				isVisible: false,
				setVisible: function(flag)
				{
					this.isVisible = flag;
					setVisible(timeBarParent, flag);
					if (flag)
						updateTimeBar();
				}
			}
			window.updateTimeBarMinYear(2010);

			map.setMinMaxZoom(1, 17);

			var haveOSM = false;

			var miniMapZoomDelta = -4;
			map.addLayers = function(layers)
			{
				var b = getBounds();
				var minLayerZoom = 20;
				forEachLayer(layers, function(layer, isVisible) 
				{ 
					map.addLayer(layer, isVisible);
					b.update(layer.geometry.coordinates);
					for (var i = 0; i < layer.properties.styles.length; i++)
						minLayerZoom = Math.min(minLayerZoom, layer.properties.styles[i].MinZoom);
				});
				if (layers.properties.UseOpenStreetMap && !haveOSM)
				{
					var o = map.addObject();
					o.bringToBottom();
					o.setOSMTiles();
					o.setAsBaseLayer("OSM");
					haveOSM = true;

					if (!miniMapAvailable)
					{
						map.miniMap.setVisible(true);
						var miniOSM = map.miniMap.addObject();
						miniOSM.setOSMTiles();
						miniOSM.setAsBaseLayer("OSM");
						map.setBaseLayer("OSM");
					}
					else
					{
						var miniOSM = map.miniMap.addObject();
						miniOSM.setOSMTiles();
						miniOSM.setAsBaseLayer("OSM");
						miniOSM.setVisible(false);
						o.setVisible(false);
					}
				}
				if (layers.properties.DefaultLat && layers.properties.DefaultLong && layers.properties.DefaultZoom)
					map.moveTo(
						parseFloat(layers.properties.DefaultLong),
						parseFloat(layers.properties.DefaultLat),
						parseInt(layers.properties.DefaultZoom)
					);
				else
				{
					var z = map.getBestZ(b.minX, b.minY, b.maxX, b.maxY);
					if (minLayerZoom != 20)
						z = Math.max(z, minLayerZoom);
					map.moveTo(
						from_merc_x((merc_x(b.minX) + merc_x(b.maxX))/2),
						from_merc_y((merc_y(b.minY) + merc_y(b.maxY))/2),
						z
					);
				}
				if (layers.properties.ViewUrl && !window.suppressDefaultPermalink)
				{
					var result = (/permalink=([a-zA-Z0-9]+)/g).exec(layers.properties.ViewUrl);
					if (result)
					{
						var permalink = result[1];
						var callbackName = uniqueGlobalName(function(obj)
						{
							if (obj.position)
								map.moveTo(from_merc_x(obj.position.x), from_merc_y(obj.position.y), 17 - obj.position.z);
							if (obj.drawnObjects)
								for (var i =0; i < obj.drawnObjects.length; i++)
								{
									var o = obj.drawnObjects[i];
									map.drawing.addObject(from_merc_geometry(o.geometry), o.properties);
								}
						});
						var script = document.createElement("script");
						script.setAttribute("charset", "UTF-8");
						script.setAttribute("src", "http://" + layers.properties.hostName + "/TinyReference.ashx?id=" + permalink + "&CallbackName=" + callbackName + "&" + Math.random());
						document.getElementsByTagName("head").item(0).appendChild(script);
					}
				}
				if (layers.properties.MinViewX)
				{
					map.setExtent(
						layers.properties.MinViewX,
						layers.properties.MaxViewX,
						layers.properties.MinViewY,
						layers.properties.MaxViewY
					);
				}
				if (maxRasterZoom > 17)
					map.setMinMaxZoom(1, maxRasterZoom);
				if (layers.properties.Copyright)
				{
					var obj = map.addObject();
					obj.setCopyright(layers.properties.Copyright);
				}
				if (layers.properties.MiniMapZoomDelta)
					miniMapZoomDelta = layers.properties.MiniMapZoomDelta;
				if (layers.properties.OnLoad)
				{
					try { eval("_kosmosnimki_temp=(" + layers.properties.OnLoad + ")")(map); }
					catch (e) { alert('Error in baseMap maplet: ' + e); }
				}
			}
			FlashMapObject.prototype.setExtent = function(x1, x2, y1, y2)
			{
				flashDiv.setExtent(merc_x(x1), merc_x(x2), merc_y(y1), merc_y(y2));
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
				var currPosition = map.getPosition();
				var x = currPosition['x'];
				var y = currPosition['y'];
				var scale = getScale(currPosition['z']);

				var w2 = scale*div.clientWidth/2;
				var h2 = scale*div.clientHeight/2;
				return {
					minX: from_merc_x(x - w2),
					minY: from_merc_y(y - h2),
					maxX: from_merc_x(x + w2),
					maxY: from_merc_y(y + h2)
				};
			}
			var getLocalScale = function(x, y)
			{
				return distVincenty(x, y, from_merc_x(merc_x(x) + 40), from_merc_y(merc_y(y) + 30))/50;
			}

			map.stateListeners = {};
			/** Пользовательские Listeners изменений состояния карты
			* @function addMapStateListener
			* @memberOf api - добавление прослушивателя
			* @param {eventName} название события
			* @param {func} вызываемый метод
			* @return {id} присвоенный id прослушивателя
			* @see <a href="http://mapstest.kosmosnimki.ru/api/ex_locationTitleDiv.html">» Пример использования</a>.
			* @author <a href="mailto:saleks@scanex.ru">Sergey Alexseev</a>
			*/
			map.addMapStateListener = function(eventName, func)
			{
				if(!map.stateListeners[eventName]) map.stateListeners[eventName] = [];
				var id = newFlashMapId();
				map.stateListeners[eventName].push({"id": id, "func": func });
				return id;
			}
			/** Пользовательские Listeners изменений состояния карты
			* @function removeMapStateListener
			* @memberOf api - удаление прослушивателя
			* @param {eventName} название события
			* @param {id} вызываемый метод
			* @return {Bool} true - удален false - не найден
			* @see <a href="http://mapstest.kosmosnimki.ru/api/ex_locationTitleDiv.html">» Пример использования</a>.
			* @author <a href="mailto:saleks@scanex.ru">Sergey Alexseev</a>
			*/
			map.removeMapStateListener = function(eventName, id)
			{
				if(!map.stateListeners[eventName]) return false;
				var arr = [];
				for (var i=0; i<map.stateListeners[eventName].length; i++)
				{
					if(id != map.stateListeners[eventName][i]["id"]) arr.push(map.stateListeners[eventName][i]);
				}
				map.stateListeners[eventName] = arr;
				return true;
			}

			/** Отображение строки текущего положения карты
			* @function
			* @memberOf api - перегружаемый внешними плагинами
			* @param {object['div']} элемент DOM модели для отображения строки, где будет показываться текущее положение карты
			* @param {object['screenGeometry']} геометрия видимой части экрана
			* @param {object['properties']} свойства карты
			* @see <a href="http://mapstest.kosmosnimki.ru/api/ex_locationTitleDiv.html">» Пример использования</a>.
			* @author <a href="mailto:saleks@scanex.ru">Sergey Alexseev</a>
			*/
			map.setLocationTitleDiv = null;
			var locationTitleDiv = newElement(
				"div",
				{
				},
				{
				}
			);
			div.appendChild(locationTitleDiv);


			var coordinatesAttr = {
				'x': '27px'						// отступ по горизонтали
				,'y': '25px'					// по вертикали
				,'x1': '5px'					// отступ по горизонтали иконки смены формата координат
				,'scaleBar': {
					'bottom': {
						'x': '27px'				// отступ по горизонтали для scaleBar
						,'y': '47px'			// по вертикали
					}
					,'top': {
						'x': '27px'				// отступ по горизонтали для scaleBar
						,'y': '3px'				// по вертикали
					}
				}
			};

			var scaleBar = newStyledDiv({
				position: "absolute",
				right: coordinatesAttr['scaleBar']['bottom']['x'],
				bottom: coordinatesAttr['scaleBar']['bottom']['y'],
				textAlign: "center"
			});
			div.appendChild(scaleBar);
			
			map.scaleBar = { setVisible: function(flag) { setVisible(scaleBar, flag); } };
			var scaleBarText, scaleBarWidth;
			var repaintScaleBar = function()
			{
				if (scaleBarText)
				{
					size(scaleBar, scaleBarWidth, 16);
					scaleBar.innerHTML = scaleBarText;
				}
			}
			var coordinates = newElement(
				"div",
				{
					onclick: function()
					{
						var oldText = getCoordinatesText();
						var text = window.prompt(KOSMOSNIMKI_LOCALIZED("Текущие координаты центра карты:", "Current center coordinates:"), oldText);
						if (text && (text != oldText))
							map.moveToCoordinates(text);
					}
				},
				{
					position: "absolute",
					right: coordinatesAttr['x'],
					bottom: coordinatesAttr['y'],
					cursor: "pointer"
				}
			);
			div.appendChild(coordinates);

			var coordFormat = 0;
			var changeCoords = newElement(
				"img", 
				{ 
					src: apiBase + "img/coord_reload.png",
					title: KOSMOSNIMKI_LOCALIZED("Сменить формат координат", "Toggle coordinates format"),
					onclick: function()
					{
						coordFormat += 1;
						coordinates.innerHTML = getCoordinatesText();
					}
				},
				{
					position: "absolute",
					right: coordinatesAttr['x1'],
					bottom: coordinatesAttr['y'],
					cursor: "pointer"
				}
			);
			div.appendChild(changeCoords);

			map.coordinates = {
				setVisible: function(flag) 
				{ 
					setVisible(coordinates, flag); 
					setVisible(changeCoords, flag); 
				}
			}

			var getCoordinatesText = function(currPosition)
			{
				if(!currPosition) currPosition = map.getPosition();
				var x = from_merc_x(currPosition['x']);
				var y = from_merc_y(currPosition['y']);
				if (x > 180)
					x -= 360;
				if (x < -180)
					x += 360;
				x = merc_x(x);
				y = merc_y(y);
				if (coordFormat%3 == 0)
					return formatCoordinates(x, y);
				else if (coordFormat%3 == 1)
					return formatCoordinates2(x, y);
				else
					return Math.round(x) + ", " + Math.round(y);
			}

			map.setCoordinatesAlign = function(attr) {			// Изменить позицию контейнера координат
				var align = attr['align'];
				if(align === 'br') {		// Позиция br(BottomRight)
					setPositionStyle(coordinates, { 'top': '', 'bottom': coordinatesAttr['y'], 'right': coordinatesAttr['x'], 'left': '' });
					setPositionStyle(changeCoords, { 'top': '', 'bottom': coordinatesAttr['y'], 'right': coordinatesAttr['x1'], 'left': '' });
					setPositionStyle(scaleBar, { 'top': '', 'bottom': coordinatesAttr['scaleBar']['bottom']['y'], 'right': coordinatesAttr['scaleBar']['bottom']['x'], 'left': '' });
				} else if(align === 'bl') {		// Позиция bl(BottomLeft)
					setPositionStyle(coordinates, { 'top': '', 'bottom': coordinatesAttr['y'], 'right': '', 'left': coordinatesAttr['x'] });
					setPositionStyle(changeCoords, { 'top': '', 'bottom': coordinatesAttr['y'], 'right': '', 'left': coordinatesAttr['x1'] });
					setPositionStyle(scaleBar, { 'top': '', 'bottom': coordinatesAttr['scaleBar']['bottom']['y'], 'right': '', 'left': coordinatesAttr['scaleBar']['bottom']['x'] });
				} else if(align === 'tr') {		// Позиция tr(TopRight)
					setPositionStyle(coordinates, { 'top': coordinatesAttr['y'], 'bottom': '', 'right': coordinatesAttr['x'], 'left': '' });
					setPositionStyle(changeCoords, { 'top': coordinatesAttr['y'], 'bottom': '', 'right': coordinatesAttr['x1'], 'left': '' });
					setPositionStyle(scaleBar, { 'top': coordinatesAttr['scaleBar']['top']['y'], 'bottom': '', 'right': coordinatesAttr['scaleBar']['top']['x'], 'left': '' });
				} else if(align === 'tl') {		// Позиция tl(TopLeft)
					setPositionStyle(coordinates, { 'top': coordinatesAttr['y'], 'bottom': '', 'right': '', 'left': coordinatesAttr['x'] });
					setPositionStyle(changeCoords, { 'top': coordinatesAttr['y'], 'bottom': '', 'right': '', 'left': coordinatesAttr['x1'] });
					setPositionStyle(scaleBar, { 'top': coordinatesAttr['scaleBar']['top']['y'], 'bottom': '', 'right': '', 'left': coordinatesAttr['scaleBar']['top']['x'] });
				}
			}

			// Begin: Блок управления копирайтами
			var copyrightAttr = {
				'x': '26px'					// отступ по горизонтали
				,'y': '7px'					// отступ по вертикали
			};
			var copyright = newElement(
				"span",
				{},
				{
					position: "absolute",
					right: copyrightAttr['x'],
					bottom: copyrightAttr['y']
				}
			);
			var copyrightAlign = '';
			div.appendChild(copyright);
			// Изменить позицию контейнера копирайтов
			map.setCopyrightAlign = function(attr) {
				if(attr['align']) {
					copyrightAlign = attr['align'];
				}
				copyrightPosition();
			}
			var copyrightedObjects = [];
			map.addCopyrightedObject = function(obj)
			{
				var exists = false;
				for (var i = 0; i < copyrightedObjects.length; i++)
					if (copyrightedObjects[i] == obj)
					{
						exists = true;
						break;
					}
					
				if (!exists)
				{
					copyrightedObjects.push(obj);
					map.updateCopyright();
				}
				
			}
			map.removeCopyrightedObject = function(obj)
			{
				var foundID = -1;
				for (var i = 0; i < copyrightedObjects.length; i++)
					if (copyrightedObjects[i] == obj)
					{
						foundID = i;
						break;
					}
					
				if ( foundID >= 0 )
				{
					copyrightedObjects.splice(foundID, 1);
					map.updateCopyright();
				}
					
				
			}
			
			var copyrightUpdateTimeout = false;
			var copyrightLastAlign = null;

			// Изменить координаты HTML элемента
			function copyrightPosition()
			{
				var center = (div.clientWidth - copyright.clientWidth) / 2;
				if(copyrightLastAlign != copyrightAlign) {
					copyrightLastAlign = copyrightAlign;
					if(copyrightAlign === 'bc') {				// Позиция bc(BottomCenter)
						setPositionStyle(copyright, { 'top': '', 'bottom': copyrightAttr['y'], 'right': '', 'left': center + 'px' });
					} else if(copyrightAlign === 'br') {		// Позиция br(BottomRight)
						setPositionStyle(copyright, { 'top': '', 'bottom': copyrightAttr['y'], 'right': copyrightAttr['x'], 'left': '' });
					} else if(copyrightAlign === 'bl') {		// Позиция bl(BottomLeft)
						setPositionStyle(copyright, { 'top': '', 'bottom': copyrightAttr['y'], 'right': '', 'left': copyrightAttr['x'] });
					} else if(copyrightAlign === 'tc') {		// Позиция tc(TopCenter)
						setPositionStyle(copyright, { 'top': '0px', 'bottom': '', 'right': '', 'left': center + 'px' });
					} else if(copyrightAlign === 'tr') {		// Позиция tr(TopRight)
						setPositionStyle(copyright, { 'top': '0px', 'bottom': '', 'right': copyrightAttr['x'], 'left': '' });
					} else if(copyrightAlign === 'tl') {		// Позиция tl(TopLeft)
						setPositionStyle(copyright, { 'top': '0px', 'bottom': '', 'right': '', 'left': copyrightAttr['x'] });
					}
				}
			}

			map.updateCopyright = function()
			{
				if (!copyrightUpdateTimeout)
				{
					copyrightUpdateTimeout = setTimeout(function()
					{
						var currPosition = map.getPosition();
						var x = from_merc_x(currPosition['x']);
						var y = from_merc_y(currPosition['y']);
						var texts = {};
						for (var i = 0; i < copyrightedObjects.length; i++)
						{
							var obj = copyrightedObjects[i];
							if (obj.copyright && obj.objectId && flashDiv.getVisibility(obj.objectId))
							{
								if (obj.geometry)
								{
									var bounds = getBounds(obj.geometry.coordinates);
									if ((x < bounds.minX) || (x > bounds.maxX) || (y < bounds.minY) || (y > bounds.maxY))
										continue;
								}
								texts[obj.copyright] = true;
							}
						}
						
						//первым всегда будет располагаться копирайт СканЭкс. 
						//Если реализовать возможность задавать порядок отображения копирайтов, можно тоже самое сделать более культурно...
						var text = "<a target='_blank' style='color: inherit;' href='http://maps.kosmosnimki.ru/Apikey/License.html'>&copy; 2007-2011 " + KOSMOSNIMKI_LOCALIZED("&laquo;СканЭкс&raquo;", "RDC ScanEx") + "</a>";
						
						for (var key in texts)
						{
							if (text != "")
								text += " ";
							text += key.split("<a").join("<a target='_blank' style='color: inherit;'");
						}
						copyright.innerHTML = text;
						copyrightUpdateTimeout = false;
						if(copyrightAlign) {
							copyrightPosition();
						}
					}, 0);
				}
			}
			// End: Блок управления копирайтами

			var sunscreen = map.addObject();
			sunscreen.setStyle({ fill: { color: 0xffffff, opacity: 1 } });
			sunscreen.setRectangle(-180, -85, 180, 85);
			sunscreen.setVisible(false);

			var miniMapBorderWidth = 5;
			var miniMapLeftBorder = newStyledDiv({
				position: "absolute",
				top: 0,
				width: miniMapBorderWidth + "px",
				backgroundColor: "#216B9C",
				opacity: 0.5
			});
			var miniMapBottomBorder = newStyledDiv({
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
				setVisible(miniMapLeftBorder, miniMapAvailable && miniMapShown);
				setVisible(miniMapBottomBorder, miniMapAvailable && miniMapShown);
			}
			var miniMapFrame = newStyledDiv({
				position: "absolute",
				backgroundColor: "#216b9c",
				opacity: 0.2
			});
			miniMapFrame.onmousedown = function(event)
			{
				var startMouseX = eventX(event);
				var startMouseY = eventY(event);
				
				var currPosition = map.getPosition();
				var startMapX = currPosition['x'];
				var startMapY = currPosition['y'];

				var scale = getScale(miniMapZ);
				
				var mouseMoveMode = new HandlerMode(document.documentElement, "mousemove", function(event)
				{
					map.moveTo(
						from_merc_x(startMapX - (eventX(event) - startMouseX)*scale), 
						from_merc_y(startMapY + (eventY(event) - startMouseY)*scale), 
						map.getZ()
					);
					return false;
				});
				var mouseUpMode = new HandlerMode(document.documentElement, "mouseup", function(event)
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
				setVisible(miniMapFrame, miniMapAvailable && miniMapShown);
				var scaleFactor = Math.pow(2, map.getZ() - miniMapZ);
				var w = div.clientWidth/scaleFactor;
				var h = div.clientHeight/scaleFactor;
				if ((w >= miniMapSize) || (h >= miniMapSize))
					setVisible(miniMapFrame, false);
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
					setPositionStyle(miniMapFrame, ph);
					size(miniMapFrame, w, h);
				}
			}
			var miniMapZ = 0;
			var miniMapAvailable = false;
			var miniMapSize = 0;
			var miniMap = map.addMapWindow(function(z) 
			{ 
				miniMapZ = Math.max(minZoom, Math.min(maxRasterZoom, z + miniMapZoomDelta));
				try { repaintMiniMapFrame(); } catch (e) {}
				return miniMapZ;
			});
			var miniMapShown = true;
			var miniMapToggler = newElement(
				"img",
				{ 
					src: apiBase + "img/close_map.png",
					title: KOSMOSNIMKI_LOCALIZED("Показать/скрыть мини-карту", "Show/hide minimap"),
					onclick: function()
					{
						miniMapShown = !miniMapShown;
						miniMapToggler.src = apiBase + (miniMapShown ? "img/close_map_a.png" : "img/open_map_a.png");
						resizeMiniMap();
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
				miniMapSize = (miniMapAvailable && miniMapShown) ? Math.round(w/7) : 0;
				miniMapLeftBorder.style.height = (miniMapSize + miniMapBorderWidth) + "px";
				miniMapBottomBorder.style.width = miniMapSize + "px";
				if(miniMapAlign === 'br') {			// Позиция миникарты br(BottomRight)
					miniMap.positionWindow((w - miniMapSize)/w, (h - miniMapSize)/h, 1, 1);
					setPositionStyle(miniMapLeftBorder, { 'top': '', 'bottom': '0px', 'right': miniMapSize + 'px', 'left': '' });
					setPositionStyle(miniMapBottomBorder, { 'top': '', 'bottom': miniMapSize + 'px', 'right': '0px', 'left': '' });
					setPositionStyle(miniMapToggler, { 'top': '', 'bottom': '0px', 'right': '0px', 'left': '' });
				} else if(miniMapAlign === 'bl') {	// Позиция миникарты по умолчанию bl(BottomLeft)
					miniMap.positionWindow(0, (h - miniMapSize)/h, miniMapSize/w, 1);
					setPositionStyle(miniMapLeftBorder, { 'top': '', 'bottom': '0px', 'right': '', 'left': miniMapSize + 'px' });
					setPositionStyle(miniMapBottomBorder, { 'top': '', 'bottom': miniMapSize + 'px', 'right': '', 'left': '0px' });
					setPositionStyle(miniMapToggler, { 'top': '', 'bottom': '0px', 'right': '', 'left': '0px' });
				} else if(miniMapAlign === 'tl') {	// Позиция миникарты по умолчанию tl(TopLeft)
					miniMap.positionWindow(0, 0, miniMapSize/w, miniMapSize/h);
					setPositionStyle(miniMapLeftBorder, { 'top': '0px', 'bottom': '', 'right': '', 'left': miniMapSize + 'px' });
					setPositionStyle(miniMapBottomBorder, { 'top': miniMapSize + 'px', 'bottom': '', 'right': '', 'left': '0px' });
					setPositionStyle(miniMapToggler, { 'top': '0px', 'bottom': '', 'right': '', 'left': '0px' });
				} else {							// Позиция миникарты по умолчанию tr(TopRight)
					miniMap.positionWindow((w - miniMapSize)/w, 0, 1, miniMapSize/h);
					setPositionStyle(miniMapLeftBorder, { 'top': '0px', 'bottom': '', 'right': miniMapSize + 'px', 'left': '' });
					setPositionStyle(miniMapBottomBorder, { 'top': miniMapSize + 'px', 'bottom': '', 'right': '0px', 'left': '' });
					setPositionStyle(miniMapToggler, { 'top': '0px', 'bottom': '', 'right': '0px', 'left': '' });
				}
				repaintMiniMapBorders();
				repaintMiniMapFrame();
			}

			miniMap.setVisible = function(flag) 
			{ 
				FlashMapObject.prototype.setVisible.call(miniMap, flag);
				miniMapAvailable = flag;
				setVisible(miniMapFrame, flag);
				setVisible(miniMapToggler, flag);
				resizeMiniMap();
			}
			map.miniMap = miniMap;
			miniMap.setVisible(false);
			var miniMapAlign = 'tr';
			// Изменить позицию miniMap
			map.setMiniMapAlign = function(attr) {
				if(attr['align']) miniMapAlign = attr['align'];
				resizeMiniMap();
			}

			var geomixerLink = newElement(
				"a",
				{
					href: "http://kosmosnimki.ru/geomixer",
					target: "_blank"
				},
				{
					position: "absolute",
					left: "8px",
					bottom: "8px"
				}
			);
			geomixerLink.appendChild(newElement(
				"img",
				{
					src: apiBase + "img/geomixer_logo_api.png",
					title: KOSMOSNIMKI_LOCALIZED("© 2007-2011 ИТЦ «СканЭкс»", "(c) 2007-2011 RDC ScanEx"),
					width: 130,
					height: 34
				},
				{
					border: 0
				}
			));
			div.appendChild(geomixerLink);
			map.setGeomixerLinkAlign = function(attr) {				// Изменить позицию ссылки на Geomixer
				var align = attr['align'];
				if(align === 'br') {			// Позиция br(BottomRight)
					setPositionStyle(geomixerLink, { 'top': '', 'bottom': '8px', 'right': '8px', 'left': '' });
				} else if(align === 'bl') {		// Позиция bl(BottomLeft)
					setPositionStyle(geomixerLink, { 'top': '', 'bottom': '8px', 'right': '', 'left': '8px' });
				} else if(align === 'tr') {		// Позиция tr(TopRight)
					setPositionStyle(geomixerLink, { 'top': '8px', 'bottom': '', 'right': '8px', 'left': '' });
				} else if(align === 'tl') {		// Позиция tl(TopLeft)
					setPositionStyle(geomixerLink, { 'top': '8px', 'bottom': '', 'right': '', 'left': '8px' });
				}
			}

			sunscreen.setHandler("onResize", resizeMiniMap);

			var copyrightUpdateTimeout2 = false;
			var updatePosition = function()
			{
				var currPosition = map.getPosition();

				var z = currPosition['z'];
				if (z == Math.round(z))
				{
					var metersPerPixel = getLocalScale(from_merc_x(currPosition['x']), from_merc_y(currPosition['y']))*getScale(z);
					for (var i = 0; i < 30; i++)
					{
						var distance = [1, 2, 5][i%3]*Math.pow(10, Math.floor(i/3));
						var w = distance/metersPerPixel;
						if (w > 100)
						{
							var name = prettifyDistance(distance);
							if ((name != scaleBarText) || (w != scaleBarWidth))
							{
								scaleBarText = name;
								scaleBarWidth = w;
								repaintScaleBar();
							}
							break;
						}
					}
				}
				var newZoomObj = zoomArr[Math.round(z) - minZoom];
				if (newZoomObj != zoomObj)
				{
					if (zoomObj)
						zoomObj.src = apiBase + "img/zoom_raw.png";
					zoomObj = newZoomObj;
					zoomObj.src = apiBase + "img/zoom_active.png";
				}
				coordinates.innerHTML = getCoordinatesText(currPosition);

				/** Пользовательское событие positionChanged
				* @function callback
				* @param {object} атрибуты прослушивателя
				*/
				if ('positionChanged' in map.stateListeners) {
					var attr = {'div': locationTitleDiv, 'screenGeometry': map.getScreenGeometry(), 'properties': map.properties };
					var arr = map.stateListeners['positionChanged'];
					for (var i=0; i<arr.length; i++)
					{
						arr[i].func(attr);
					}
				}				

				if (copyrightUpdateTimeout2)
					clearTimeout(copyrightUpdateTimeout2);
				copyrightUpdateTimeout2 = setTimeout(function()
				{
					map.updateCopyright();
					copyrightUpdateTimeout2 = false;
				}, 250);
			}
			map.addObject().setHandler("onMove", updatePosition);
			updatePosition();

			map.setBackgroundColor(0x000001);
			miniMap.setBackgroundColor(0xffffff);

			map.defaultHostName = layers.properties.hostName;
			map.addLayers(layers);

			var outlineColor = 0x0000ff;
			var fillColor = 0xffffff;
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
			var regularLastLineStyle = { outline: { color: outlineColor, thickness: 1 } };
			var activeLastLineStyle = { outline: { color: outlineColor, thickness: 2 } };

			var startDrag = function(object, dragCallback, upCallback)
			{
				map.freeze();
				sunscreen.setVisible(true);
				setToolHandlers({
					onMouseMove: function(o)
					{
						dragCallback(map.getMouseX(), map.getMouseY(), o);
					},
					onMouseUp: function()
					{
						stopDrag();
						if (upCallback)
							upCallback();
					}
				});
			}

			var stopDrag = function()
			{
				setToolHandlers({ onMouseMove: null, onMouseUp: null });
				map.unfreeze();
				sunscreen.setVisible(false);
			}

			FlashMapObject.prototype.startDrag = function(dragCallback, upCallback)
			{
				startDrag(this, dragCallback, upCallback);
			}

			FlashMapObject.prototype.enableDragging = function(dragCallback, downCallback, upCallback)
			{
				var object = this;
				var mouseDownHandler = function(o)
				{
					if (downCallback)
						downCallback(map.getMouseX(), map.getMouseY(), o);
					startDrag(object, dragCallback, upCallback);
				}
				if (object == map) {
					setToolHandler("onMouseDown", mouseDownHandler);
				} else {
					object.setHandler("onMouseDown", mouseDownHandler);
				}
			}

			var drawFunctions = {};

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
				currentlyDrawnObject = ret;

				ret.isVisible = (props.isVisible == undefined) ? true : props.isVisible;

				ret.stopDrawing = function()
				{
					if (!isDrawing)
						return;
					isDrawing = false;
					if (!coords)
					{
						map.unfreeze();
						sunscreen.setVisible(false);
						setToolHandler("onClick", null);
						setToolHandler("onMouseDown", null);
						map.clearCursor();
					}
				}

				ret.remove = function()
				{
					if (isDrawing)
						selectTool("move");
					if (obj)
					{
						obj.remove();
						balloon.remove();
						domObj.removeInternal();
					}
				}

				ret.setStyle = function(regularStyle, hoveredStyle) {}

				var done = function(xx, yy)
				{
					var updateDOM = function()
					{
						domObj.update({ type: "POINT", coordinates: [xx, yy] }, text);
					}

					ret.setText = function(newText)
					{
						text = newText;
						input.value = newText;
						updateText();
					}

					obj = map.addObject();
					balloon = map.balloonClassObject.addBalloon();
					ret.setVisible = function(flag)
					{
						ret.isVisible = flag;
						obj.setVisible(ret.isVisible);
						balloon.setVisible(ret.isVisible && balloonVisible);
					}
					ret.balloon = balloon;
					ret.getStyle = function( removeDefaults ){ return obj.getStyle( removeDefaults ); };

					var position = function(x, y)
					{
						xx = x;
						yy = y;
						obj.setPoint(xx, yy);
						balloon.setPoint(xx, yy);
						updateDOM();
					}

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

					var htmlDiv = document.createElement("div");
					htmlDiv.onclick = function(event)
					{
						event = event || window.event;
						var e = compatTarget(event);
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
						input.style.width = cols * (fontSize - (isIE ? 5: 6));
						text = newText;
						balloon.resize();
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
					balloon.div.appendChild(input);

					var setHTMLVisible = function(flag)
					{
						setVisible(input, !flag);
						setVisible(htmlDiv, flag);
						if (flag)
							htmlDiv.innerHTML = (strip(input.value) == "") ? "&nbsp;" : input.value;
						balloon.resize();
					}

					var balloonVisible = (text && (text != "")) ? true : false;
					setHTMLVisible(balloonVisible);

					var clickTimeout = false;
					obj.setHandler("onClick", function()
					{
						if (clickTimeout)
						{
							clearTimeout(clickTimeout);
							clickTimeout = false;
							ret.remove();
						}
						else
						{
							clickTimeout = setTimeout(function() { clickTimeout = false; }, 500);
							balloonVisible = !balloon.isVisible;
							balloon.setVisible(balloonVisible);
							if (balloonVisible)
								setHTMLVisible(true);
							else
							{
								hide(input);
								hide(htmlDiv);
							}
						}
					});
					var startDx, startDy, isDragged = false;
					var dragCallback = function(x, y)
					{
						position(x + startDx, y + startDy);
					}
					var downCallback = function(x, y)
					{
						startDx = xx - x;
						startDy = yy - y;
						isDragged = true;
					};
					var upCallback = function()
					{
						isDragged = false;
					}
					obj.enableDragging(dragCallback, downCallback, upCallback);

					balloon.outerDiv.onmousedown = function(event)
					{
						downCallback(
							from_merc_x(mapX + (eventX(event) - getOffsetLeft(div) - div.clientWidth/2)*scale),
							from_merc_y(mapY - (eventY(event) - getOffsetTop(div) - div.clientHeight/2)*scale)
						);
						startDrag(obj, dragCallback, upCallback);
						return false;
					}
					balloon.outerDiv.onmouseup = function(event)
					{
						stopDrag();
						upCallback();
					}
					balloon.outerDiv.onmousemove = function(event)
					{
						if (isDragged)
						{
							position(
								startDx + from_merc_x(mapX + (eventX(event) - getOffsetLeft(div) - div.clientWidth/2)*scale),
								startDy + from_merc_y(mapY - (eventY(event) - getOffsetTop(div) - div.clientHeight/2)*scale)
							);
							deselect();
							return false;
						}
					}

					domObj = createDOMObject(ret);
					position(xx, yy);
					balloon.setVisible(balloonVisible);
					updateText();

					ret.setVisible(ret.isVisible);
				}

				if (!coords)
				{
					sunscreen.bringToTop();
					sunscreen.setVisible(true);
					map.setCursor(apiBase + "img/flag_blau1.png", -6, -36);
					setToolHandler("onClick", function() 
					{
						done(map.getMouseX(), map.getMouseY());
						selectTool("move");
						if (map.isKeyDown(16))
							selectTool("POINT");
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
				var propsBalloon = map.balloonClassObject.propsBalloon;

				var obj = map.addObject();
				obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);
				obj.setEditable(true);
				obj.setHandlers({
					onEdit: function()
					{
						if (!domObj)
							domObj = createDOMObject(ret);
						callOnChange();
					},
					onFinish: function()
					{
						selectTool("move");
					},
					onRemove: function()
					{
						ret.remove();
					},
					onNodeMouseOver: function()
					{
						if (obj.getGeometryType() == "LINESTRING")
							propsBalloon.updatePropsBalloon(prettifyDistance(obj.getIntermediateLength()));
					},
					onNodeMouseOut: function()
					{
						propsBalloon.updatePropsBalloon(false);
					},
					onEdgeMouseOver: function()
					{
						propsBalloon.updatePropsBalloon(prettifyDistance(obj.getCurrentEdgeLength()));
					},
					onEdgeMouseOut: function()
					{
						propsBalloon.updatePropsBalloon(false);
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
					if (obj.isDrawing())
						selectTool("move");
					obj.remove();
					if (domObj)
						domObj.removeInternal();
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

				ret.getStyle = function(removeDefaults){ return obj.getStyle(removeDefaults); };

				var callOnChange = function()
				{
					var geom = obj.getGeometry();
					if(domObj) domObj.update(geom, text);
				}

				currentlyDrawnObject = ret;

				ret.stopDrawing = function()
				{
					obj.stopDrawing();
				}

				if (coords)
				{
					domObj = createDOMObject(ret);
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
				if (isRectangle(coords))
					return drawFunctions.FRAME(coords, props);

				if (!props)
					props = {};

				var text = props.text;
				if (!text)
					text = "";

				var ret = {};
				var domObj = false;

				var propsBalloon = map.balloonClassObject.propsBalloon;
				var obj = map.addObject();
				obj.setStyle(regularDrawingStyle, hoveredDrawingStyle);
				obj.setEditable(true);
				obj.setHandlers({
					onEdit: function()
					{
						if (!domObj)
							domObj = createDOMObject(ret);
						callOnChange();
					},
					onFinish: function()
					{
						selectTool("move");
					},
					onRemove: function()
					{
						ret.remove();
					},
					onNodeMouseOver: function()
					{
						propsBalloon.updatePropsBalloon(obj.getGeometrySummary());
					},
					onNodeMouseOut: function()
					{
						propsBalloon.updatePropsBalloon(false);
					},
					onEdgeMouseOver: function()
					{
						propsBalloon.updatePropsBalloon(prettifyDistance(obj.getCurrentEdgeLength()));
					},
					onEdgeMouseOut: function()
					{
						propsBalloon.updatePropsBalloon(false);
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
					if (obj.isDrawing())
						selectTool("move");
					obj.remove();
					if (domObj)
						domObj.removeInternal();
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

				ret.getStyle = function(removeDefaults){ return obj.getStyle(removeDefaults); };

				var callOnChange = function()
				{
					var geom = obj.getGeometry();
					if(domObj) domObj.update(geom, text);
				}

				currentlyDrawnObject = ret;

				ret.stopDrawing = function()
				{
					obj.stopDrawing();
				}

				if (coords)
				{
					domObj = createDOMObject(ret);
					var lastNum = coords[0].length - 1; 
					if (coords[0][0][0] == coords[0][lastNum][0] && coords[0][0][1] == coords[0][lastNum][1]) {
						coords[0].pop();	// если последняя точка совпадает с первой удаляем ее
					}
					obj.setGeometry({ type: "POLYGON", coordinates: coords });
					callOnChange();
				}
				else
				{
					obj.startDrawing("POLYGON");
				}

				return ret;
			}

			function getGeometryTitleMerc(geom)
			{
				var geomType = geom['type'];
				if (geomType.indexOf("POINT") != -1)
				{
					var c = geom.coordinates;
					return "<b>" + KOSMOSNIMKI_LOCALIZED("Координаты:", "Coordinates:") + "</b> " + formatCoordinates(merc_x(c[0]), merc_y(c[1]));
				}
				else if (geomType.indexOf("LINESTRING") != -1)
					return "<b>" + KOSMOSNIMKI_LOCALIZED("Длина:", "Length:") + "</b> " + prettifyDistance(geoLength(geom));
				else if (geomType.indexOf("POLYGON") != -1)
					return "<b>" + KOSMOSNIMKI_LOCALIZED("Площадь:", "Area:") + "</b> " + prettifyArea(geoArea(geom));
				else
					return "?";
			}

			drawFunctions.FRAME = function(coords, props)
			{
				if (!props)
					props = {};

				var text = props.text;
				if (!text)
					text = "";

				var ret = {};
				currentlyDrawnObject = ret;
				var domObj;

				var obj = map.addObject();

				var borders = obj.addObject();
				var corners = obj.addObject();
				var x1, y1, x2, y2;
				var isDraging = false;

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

				var propsBalloon = map.balloonClassObject.propsBalloon;
				var mouseUP = function()
				{
					isDraging = false;
					propsBalloon.updatePropsBalloon(false);
					domObj.triggerInternal("onMouseUp");
				}

				corners.setStyle(regularDrawingStyle, hoveredDrawingStyle);

				var x1y1Corner = corners.addObject();
				var x1y2Corner = corners.addObject();
				var x2y1Corner = corners.addObject();
				var x2y2Corner = corners.addObject();

				// Высвечивание балуна в зависимости от типа geometry
				var chkBalloon = function(tp)
				{
					var geom = { type: "POLYGON", coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]] };
					if(!isDraging) {
						switch(tp) {
							case 'x1b':
							case 'x2b':
								geom = { type: "LINESTRING", coordinates: [[[x1, y1], [x1, y2]]] };
								break;
							case 'y1b':
							case 'y2b':
								geom = { type: "LINESTRING", coordinates: [[[x1, y1], [x2, y1]]] };
								break;
						}
					}
					propsBalloon.updatePropsBalloon(getGeometryTitleMerc(geom));
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

				var objHandlersX = {
					onMouseOver: function() { chkBalloon('x1b') },
					onMouseOut: function() { if(!isDraging) mouseUP(); }
				};
				x1Border.setHandlers(objHandlersX);
				x2Border.setHandlers(objHandlersX);
				var objHandlersY = {
					onMouseOver: function() { chkBalloon('y1b') },
					onMouseOut: function() { if(!isDraging) mouseUP(); }
				};
				y1Border.setHandlers(objHandlersY);
				y2Border.setHandlers(objHandlersY);

				var objHandlerCorner = {
					onMouseOver: chkBalloon
				};
				x1y1Corner.setHandlers(objHandlerCorner);
				x1y2Corner.setHandlers(objHandlerCorner);
				x2y1Corner.setHandlers(objHandlerCorner);
				x2y2Corner.setHandlers(objHandlerCorner);

				var dragMe = function(tp)
				{
					isDraging = true;
					chkBalloon(tp)
					repaint();
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

				if (coords)
				{
					x1 = coords[0][0][0];
					y1 = coords[0][0][1];
					x2 = coords[0][2][0];
					y2 = coords[0][2][1];
					domObj = createDOMObject(ret, props);
					repaint();
				}
				else
				{
					sunscreen.bringToTop();
					sunscreen.setVisible(true);
					map.enableDragging(
						function(x, y)
						{
							isDraging = true;
							x2 = x;
							y2 = y;
							if (!created)
								domObj = createDOMObject(ret, props);
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
							isDraging = false;
							propsBalloon.updatePropsBalloon(false);
							setToolHandler("onMouseDown", null);
							selectTool("move");
							if(domObj) domObj.triggerInternal("onMouseUp");
						}
					);
				}

				ret.remove = function()
				{
					obj.remove();
					domObj.removeInternal();
				}

				ret.setStyle = function(regularStyle, hoveredStyle) 
				{
					borders.setStyle(regularStyle, hoveredStyle);
					corners.setStyle(regularStyle, hoveredStyle);
				}

				ret.getStyle = function(removeDefaults){ return borders.getStyle(removeDefaults); };

				ret.stopDrawing = function()
				{
					map.unfreeze();
					sunscreen.setVisible(false);
					setToolHandler("onMouseDown", null);
				}

				ret.setText = function(newText)
				{
					text = newText;
					repaint();
				}

				return ret;
			}

			drawFunctions.zoom = function()
			{
				var x1, y1, x2, y2;
				var rect;
				currentlyDrawnObject = {
					stopDrawing: function()
					{
						setToolHandler("onMouseDown", null);
					}
				}
				map.enableDragging(
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
						rect = map.addObject();
						rect.setStyle({ outline: { color: 0xa0a0a0, thickness: 1, opacity: 70 } });
					},
					function()
					{
						var d = 10*getScale(map.getZ());
						if (!x1 || !x2 || !y1 || !y2 || ((Math.abs(merc_x(x1) - merc_x(x2)) < d) && (Math.abs(merc_y(y1) - merc_y(y2)) < d)))
							map.zoomBy(1, true);
						else
							map.slideToExtent(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
						rect.remove();
						selectTool("move");
					}
				);
			}

			window.kosmosnimkiBeginZoom = function() 
			{
				if (activeToolName != "move")
					return false;
				map.freeze();
				sunscreen.setVisible(true);
				var x1 = map.getMouseX();
				var y1 = map.getMouseY();
				var x2, y2;
				var rect = map.addObject();
				rect.setStyle({ outline: { color: 0xa0a0a0, thickness: 1, opacity: 70 } });
				setToolHandlers({
					onMouseMove: function()
					{
						x2 = map.getMouseX();
						y2 = map.getMouseY();
						rect.setRectangle(x1, y1, x2, y2);
					},
					onMouseUp: function()
					{
						setToolHandlers({ onMouseMove: null, onMouseUp: null });
						map.unfreeze();
						sunscreen.setVisible(false);
						var d = 10*getScale(map.getZ());
						if (!x1 || !x2 || !y1 || !y2 || ((Math.abs(merc_x(x1) - merc_x(x2)) < d) && (Math.abs(merc_y(y1) - merc_y(y2)) < d)))
							map.zoomBy(1, true);
						else
							map.zoomToExtent(Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
						rect.remove();
					}
				});
				return true;
			}

			var createDOMObject = function(ret, properties)
			{
				var myId = newFlashMapId();
				var myContents;
				var callHandler = function(eventName)
				{
					var handlers = map.drawing.handlers[eventName] || [];
					for (var i = 0; i < handlers.length; i++)
						handlers[i](objects[myId]);
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
						//this.properties = { text: text, isVisible: ret.isVisible };
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
					getLength: function() { return geoLength(this.geometry); },
					getArea: function() { return geoArea(this.geometry); },
					getCenter: function() { return geoCenter(this.geometry); },
					setStyle: function(regularStyle, hoveredStyle) { ret.setStyle(regularStyle, hoveredStyle); },
					getStyle: function(removeDefaults) { return ret.getStyle(removeDefaults); }
				}
				ret.domObj = objects[myId];
				return objects[myId];
			}

			drawFunctions["move"] = function() {}

			//Begin: tools
			var objects = {};
			var currentlyDrawnObject = false;
			var activeToolName = false;
			var toolControls = {};

			var toolPlaqueX = 5;
			var toolPlaqueY = 40;
			var toolSize = 24;
			var toolPadding = 4;
			var toolSpacing = 8;
			var toolPlaque = newStyledDiv({
				position: "absolute",
				left: toolPlaqueX + "px",
				top: toolPlaqueY + "px",
				width: (toolSize + 2*toolPadding) + "px",
				backgroundColor: "#016a8a",
				opacity: 0.5
			});
			allTools.appendChild(toolPlaque);
						
			var toolsMinimized;
			var toolPlaqueControl = newElement(
				"img",
				{
					onclick: function()
					{
						if (toolsMinimized)
							map.maximizeTools();
						else
							map.minimizeTools();
					},
					onmouseover: function()
					{
						if (toolsMinimized)
							this.src = apiBase + "img/tools_off_a.png";
						else
							this.src = apiBase + "img/tools_on_a.png";
					},
					onmouseout: function()
					{
						if (toolsMinimized)
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
			
			var toolPlaqueBackground = newStyledDiv({
				position: "absolute",
				left: "5px",
				top: "5px",
				width: "32px",
				height: "32px",
				backgroundColor: "#016a8a",
				opacity: 0.5
			});
			div.appendChild(toolPlaqueBackground);
			div.appendChild(toolPlaqueControl);
			map.minimizeTools = function()
			{
				toolsMinimized = true;
				toolPlaqueControl.src = apiBase + "img/tools_off.png";
				toolPlaqueControl.title = KOSMOSNIMKI_LOCALIZED("Показать инструменты", "Show tools");
				setVisible(allTools, false);
			}
			map.maximizeTools = function()
			{
				toolsMinimized = false;
				toolPlaqueControl.src = apiBase + "img/tools_on.png";
				toolPlaqueControl.title = KOSMOSNIMKI_LOCALIZED("Скрыть инструменты", "Hide tools");
				setVisible(allTools, true);
				map.baseLayerControl.repaint();
			}
			map.maximizeTools();

			map.allControls = {
				div: allTools,
				setVisible: function(flag)
				{
					setVisible(toolPlaqueBackground, flag);
					setVisible(toolPlaqueControl, flag);
					setVisible(allTools, flag);
				},
				minimize: map.minimizeTools,
				maximize: map.maximizeTools
			}
			
			map.drawing = {
				handlers: { onAdd: [], onEdit: [], onRemove: [] },
				
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
						selectTool("move");
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
					for (var id in objects)
						callback(objects[id]);
				},
				tools: { 
					setVisible: function(flag) 
					{ 
						setVisible(toolPlaque, flag);
						setVisible(toolsContainer, flag);
					}
				},
				addTool: function(tn, hint, regularImageUrl, activeImageUrl, onClick, onCancel)
				{
					var control = newElement(
						"img",
						{
							src: regularImageUrl,
							title: hint,
							onclick: function()
							{
								selectTool(tn);
							},
							onmouseover: function()	
							{
								this.src = activeImageUrl;
							},
							onmouseout: function()	
							{
								this.src = (tn == activeToolName) ? activeImageUrl : regularImageUrl;
							}
						},
						{
							position: "absolute",
							left: (toolPlaqueX + toolPadding) + "px",
							cursor: "pointer"
						}
					);
					map.drawing.tools[tn] = {
						isVisible: true,
						control: control,
						setVisible: function(flag) 
						{
							this.isVisible = flag;
							positionTools();
						},
						setToolImage: function(a1, a2) {},
						repaint: function()
						{
							this.control.src = (tn == activeToolName) ? activeImageUrl : regularImageUrl;
						},
						onClick: onClick,
						onCancel: onCancel,
						select: function()
						{
							selectTool(tn);
						}
					}
					toolsContainer.appendChild(control);
					toolControls[tn] = control;
					toolTypes.push(tn);
					positionTools();
					return map.drawing.tools[tn];
				}, 
				selectTool: function(toolName)
				{
					selectTool(toolName);
				}
			}

			var positionTools = function()
			{
				var k = 0;
				for (var i = 0; i < toolTypes.length; i++)
				{
					var tool = map.drawing.tools[toolTypes[i]];
					setVisible(tool.control, tool.isVisible);
					if (tool.isVisible)
					{
						tool.control.style.top = (toolPlaqueY + toolPadding + k*(toolSize + toolSpacing)) + "px";
						k += 1;
					}
				}
				toolPlaque.style.height = (k*toolSize + 2*toolPadding + (k - 1)*toolSpacing) + "px";
			}

			var toolTypes = [];
			var toolTypes_ = ["move", "zoom", "POINT", "LINESTRING", "POLYGON", "FRAME"];
			var imageNames = ["move", "select", "marker", "line", "polygon", "frame"];
			var toolHints = ["Перемещение", "Увеличение", "Маркер", "Линия", "Полигон", "Рамка"];
			var toolHintsEng = ["Move", "Zoom", "Marker", "Line", "Polygon", "Rectangle"];
			var toolsContainer = newStyledDiv({ position: "absolute", top: 0, left: 0 });
			allTools.appendChild(toolsContainer);
			for (var i = 0; i < toolTypes_.length; i++)
			{
				map.drawing.addTool(
					toolTypes_[i], 
					KOSMOSNIMKI_LOCALIZED(toolHints[i], toolHintsEng[i]),
					apiBase + "img/" + imageNames[i] + "_tool.png",
					apiBase + "img/" + imageNames[i] + "_tool_a.png",
					drawFunctions[toolTypes_[i]],
					function() {}
				);
			}

			var selectTool = function(toolName)
			{
				if (toolName == activeToolName)
					toolName = "move";
				if (currentlyDrawnObject && 'stopDrawing' in currentlyDrawnObject)
					currentlyDrawnObject.stopDrawing();
				
				currentlyDrawnObject = false;
				if (toolName != activeToolName)
				{
					var oldToolName = activeToolName;
					activeToolName = toolName;
					for (var i = 0; i < toolTypes.length; i++)
					{
						var tn = toolTypes[i];
						var tool = map.drawing.tools[tn];
						if (tn == oldToolName)
							tool.onCancel();
						tool.repaint();
					}
					map.drawing.tools[activeToolName].onClick();
				}
			}

			selectTool("move");

			var onWheel = function(e)
			{
				if (!e)
					e = window.event;
	
				var inMap = false;
				var elem = compatTarget(e);
				while(elem != null) 
				{
					if (elem == div)
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
					map.zoomBy(delta > 0 ? 1 : -1, true);

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
			if (window.addEventListener)
				window.addEventListener('DOMMouseScroll', onWheel, false);


			FlashMapObject.prototype.loadKML = function(url, func)
			{
				var me = this;
				_kmlParser.get(url, function(result)
				{
					_kmlParser.draw(result.vals, me);
					if (func)
						func();
				}, map);
			}
			FlashMapObject.prototype.loadGML = function(url, func)
			{
				var me = this;
				sendCrossDomainJSONRequest(getAPIHostRoot() + "ApiSave.ashx?get=" + encodeURIComponent(url), function(response)
				{
					var geometries = parseGML(response);
					for (var i = 0; i < geometries.length; i++)
						me.addObject(geometries[i], null);
					if (func)
						func();
				})
			}
			FlashMapObject.prototype.loadWFS = FlashMapObject.prototype.loadGML;

			FlashMapObject.prototype.loadWMS = function(url, func)
			{
				var me = this;
				var wmsProj = ['EPSG:4326','EPSG:3395','EPSG:41001'];

				sendCrossDomainJSONRequest(getAPIHostRoot() + "ApiSave.ashx?debug=1&get=" + encodeURIComponent(url + '?request=GetCapabilities'), function(response)
				{
					var layersXML = parseXML(response).getElementsByTagName('Layer');
	
					for (var i = 0; i < layersXML.length; i++)(function(layerXML)
					{
						var props = {};
			
						var nameXML = layerXML.getElementsByTagName('Name');
						var titleXML = layerXML.getElementsByTagName('Title');
						var bboxXML = layerXML.getElementsByTagName('LatLonBoundingBox');
						var srsXML = layerXML.getElementsByTagName('SRS');
		
						if (srsXML.length)
							props.srs = strip(getTextContent(srsXML[0]));
						else
							props.srs = wmsProj[0];

						if (wmsProj.indexOf(props.srs) == -1)
							return;

						if (nameXML.length)
							props.name = getTextContent(nameXML[0]);
						else
							return;
			
						var bbox = false;
						if (bboxXML.length)
						{
							bbox = 
							{
								minx: Number(bboxXML[0].getAttribute('minx')),
								miny: Number(bboxXML[0].getAttribute('miny')),
								maxx: Number(bboxXML[0].getAttribute('maxx')),
								maxy: Number(bboxXML[0].getAttribute('maxy'))
							};
						}

						if (titleXML.length)
							props.title = getTextContent(titleXML[0]);

						var obj = me.addObject(null, props);
						obj.setVisible(false);
						map.onSetVisible[obj.objectId] = function(flag)
						{
							obj.setHandler("onMove", flag ? updateFunc : null);
						}

						var timeout = false;
						var updateFunc = function()
						{
							if (timeout)
								clearTimeout(timeout);
							timeout = setTimeout(function()
							{
								var x = map.getX(), y = map.getY(), z = map.getZ(),
									scale = getScale(z),
									w = div.clientWidth,
									h = div.clientHeight,
									wGeo = w*scale,
									hGeo = h*scale;
/*
				var currPosition = map.getPosition();
				var x = from_merc_x(currPosition['x']);
				var y = from_merc_y(currPosition['y']);
				var z = currPosition['z'];
				scale = getScale(z);
*/

								var miny = Math.max(from_merc_y(merc_y(y) - hGeo/2), -90);
								var maxy = Math.min(from_merc_y(merc_y(y) + hGeo/2), 90);
								var minx = Math.max(from_merc_x(merc_x(x) - wGeo/2), -180);
								var maxx = Math.min(from_merc_x(merc_x(x) + wGeo/2), 180);
		
								if (bbox)
								{
									minx = Math.max(bbox.minx, minx);
									miny = Math.max(bbox.miny, miny);
									maxx = Math.min(bbox.maxx, maxx);
									maxy = Math.min(bbox.maxy, maxy);
				
									if (minx >= maxx || miny >= maxy)
										return;
								}
			
								var isMerc = (props.srs == wmsProj[0]);
			
								obj.setImage(
									url + "?request=GetMap&layers=" + props.name + 
										"&srs=" + props.srs + 
										"&format=image/jpeg&styles=" + 
										"&width=" + w + 
										"&height=" + h + 
										"&bbox=" + (isMerc ? minx : merc_x(minx)) + 
										"," + (isMerc ? miny : merc_y(miny)) + 
										"," + (isMerc ? maxx : merc_x(maxx)) + 
										"," + (isMerc ? maxy : merc_y(maxy)),
									minx, maxy, maxx, maxy, maxx, miny, minx, miny
								);
							}, 500);
						}			
					})(layersXML[i]);

					func();
				})
			}			

			FlashMapObject.prototype.loadMap = function(arg1, arg2, arg3)
			{
				var hostName = map.defaultHostName;
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
					me.addLayers(layers);
					if (callback)
						callback();
				});
			}

			var gplForm = false;
			FlashMapObject.prototype.loadObjects = function(url, callback)
			{
				sendCrossDomainJSONRequest(getAPIHostRoot() + "ApiSave.ashx?get=" + encodeURIComponent(url), function(response)
				{
					var geometries = parseGML(response);
					callback(geometries);
				})
			}
			FlashMapObject.prototype.saveObjects = function(geometries, fileName, format)
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
					gplForm = $('download_gpl_form'),
					inputName = gplForm.firstChild,
					inputText = gplForm.lastChild;
				}
	
				gplForm.setAttribute('method', 'post');
				gplForm.setAttribute('action', getAPIHostRoot() + 'ApiSave.ashx');
				gplForm.style.display = 'none';
				inputName.value = fileName;
				inputName.setAttribute('name', 'name')
				if (!format)
					format = "gml";
				inputText.value = createGML(geometries, format.toLowerCase());
				inputText.setAttribute('name', 'text')
	
				gplForm.appendChild(inputName);
				gplForm.appendChild(inputText);
	
				document.body.appendChild(gplForm);
	
				gplForm.submit();
			}

			if (callback)
				callback(map);

			initialLayersAdded = true;

		} catch (e) {
			var err = '';
			if(e.lineNumber) {
				err += 'api.js Line: ' + e.lineNumber + '\n' + e;
			}
			else {
				err += e + '\n';
			}
			alert(err);
		}
	}

	o.addVariable("loadCallback", uniqueGlobalName(loadCallback));
	o.write(div);

	return true;
}

function getBaseMapParam(paramName, defaultValue)
{
	return (window.baseMap && window.baseMap[paramName]) ? window.baseMap[paramName] : defaultValue;
}

function createKosmosnimkiMapInternal(div, layers, callback)
{
	var oldGetLayers = window.getLayers;
	var finish = function()
	{
		loadMapJSON(
			getBaseMapParam("hostName", "maps.kosmosnimki.ru"), 
			getBaseMapParam("id", "1D30C72D02914C5FB90D1D448159CAB6"), 
			function(kosmoLayers)
			{
				createFlashMapInternal(div, kosmoLayers, function(map)
				{
					for (var i = 0; i < map.layers.length; i++) {
						var obj = map.layers[i];
						obj.setVisible(false);
					}
					var mapString = KOSMOSNIMKI_LOCALIZED("Карта", "Map");
					var satelliteString = KOSMOSNIMKI_LOCALIZED("Снимки", "Satellite");
					var hybridString = KOSMOSNIMKI_LOCALIZED("Гибрид", "Hybrid");
					
					var mapLayerNames = getBaseMapParam("mapLayerID", "").split(',');
					var mapLayers = [];
					for (var i = 0; i < mapLayerNames.length; i++)
						if (mapLayerNames[i] in map.layers)
						{
							var mapLayer = map.layers[mapLayerNames[i]];
							//mapLayer.setVisible(true);						// Слои BaseMap должны быть видимыми
							mapLayer.setAsBaseLayer(mapString);
							mapLayer.setBackgroundColor(0xffffff);
							mapLayers.push(mapLayer);
						}
					
					var satelliteLayerNames = getBaseMapParam("satelliteLayerID", "").split(",");
					var satelliteLayers = [];
					
					for (var i = 0; i < satelliteLayerNames.length; i++)
						if (satelliteLayerNames[i] in map.layers)
							satelliteLayers.push(map.layers[satelliteLayerNames[i]]);
							
					for (var i = 0; i < satelliteLayers.length; i++)
					{
						satelliteLayers[i].setAsBaseLayer(satelliteString)
						satelliteLayers[i].setBackgroundColor(0x000001);
					}
					
					var overlayLayerNames = getBaseMapParam("overlayLayerID", "").split(',');
					var isAnyExists = false;
					var overlayLayers = [];
					for (var i = 0; i < overlayLayerNames.length; i++)
						if (overlayLayerNames[i] in map.layers)
						{
							isAnyExists = true;
							var overlayLayer = map.layers[overlayLayerNames[i]];
							overlayLayer.setAsBaseLayer(hybridString);
							overlayLayers.push(overlayLayer);
						}
					
					if (isAnyExists)
					{
						for (var i = 0; i < satelliteLayers.length; i++)
							satelliteLayers[i].setAsBaseLayer(hybridString);						
					}
					
					//var overlayLayer = map.layers[getBaseMapParam("overlayLayerID", KOSMOSNIMKI_LOCALIZED("FFE60CFA7DAF498381F811C08A5E8CF5", "BCCCE2BDC9BF417DACF27BB4D481FAD9"))];
					// if (overlayLayer)
					// {
						// for (var i = 0; i < satelliteLayers.length; i++)
							// satelliteLayers[i].setAsBaseLayer(hybridString);
						// overlayLayer.setAsBaseLayer(hybridString);
						// var extraLayer = map.layers["C547CFF462634F03BCE939275C339D5F"];
						// if (extraLayer)
							// extraLayer.setAsBaseLayer(hybridString);
					// }
					
					var setOSMEmbed = function(layer)
					{
						layer.enableTiledQuicklooksEx(function(o, image)
						{
							image.setOSMTiles(true);
							//image.setCopyright("<a href='http://openstreetmap.org'>&copy; OpenStreetMap</a>, <a href='http://creativecommons.org/licenses/by-sa/2.0/'>CC-BY-SA</a>");
							image.setZoomBounds(parseInt(o.properties["text"]), 18);
						}, 10, 18);
					}
					
					var osmEmbed = map.layers["06666F91C6A2419594F41BDF2B80170F"];
					if (osmEmbed)
					{
						osmEmbed.setAsBaseLayer(mapString);
						setOSMEmbed(osmEmbed);
					}

					var setCopyright = function(o, z1, z2, text)
					{
						var c = o.addObject();
						c.setZoomBounds(z1, z2);
						c.setCopyright(text);
						return c;
					}

					if (mapLayers.length > 0)
					{
						setCopyright(
							mapLayers[0], 
							1, 
							9, 
							"<a href='http://www.bartholomewmaps.com/'>&copy; Collins Bartholomew</a>"
						);

						var obj = setCopyright(
							mapLayers[0],
							10,
							20,
							"<a href='http://www.geocenter-consulting.ru/'>&copy; " + KOSMOSNIMKI_LOCALIZED("ЗАО &laquo;Геоцентр-Консалтинг&raquo;", "Geocentre Consulting") + "</a>"
						);
						obj.geometry = { type: "LINESTRING", coordinates: [29, 40, 180, 80] };
					}
					
					//те же копирайты, что и для карт
					if (overlayLayers.length > 0)
					{
						setCopyright(
								overlayLayers[0], 
								1, 
								9, 
								"<a href='http://www.bartholomewmaps.com/'>&copy; Collins Bartholomew</a>"
						);
						
						var obj = setCopyright(
							overlayLayers[0],
							10,
							20,
							"<a href='http://www.geocenter-consulting.ru/'>&copy; " + KOSMOSNIMKI_LOCALIZED("ЗАО &laquo;Геоцентр-Консалтинг&raquo;", "Geocentre Consulting") + "</a>"
						);
						
						obj.geometry = { type: "LINESTRING", coordinates: [29, 40, 180, 80] };
					}


					if ( satelliteLayers.length > 0 )
					{
						setCopyright(
							satelliteLayers[0],
							1,
							5,
							"<a href='http://www.nasa.gov'>&copy; NASA</a>"
						);

						setCopyright(
							satelliteLayers[0],
							6,
							13,
							"<a href='http://www.es-geo.com'>&copy; Earthstar Geographics</a>"
						);

						var obj = setCopyright(
							satelliteLayers[0],
							6,
							14,
							"<a href='http://www.antrix.gov.in/'>&copy; ANTRIX</a>"
						);
						obj.geometry = from_merc_geometry({ type: "LINESTRING", coordinates: [1107542, 2054627, 5048513, 8649003] });

						setCopyright(
							satelliteLayers[0],
							9,
							17,
							"<a href='http://www.geoeye.com'>&copy; GeoEye Inc.</a>"
						);
					}

					var currentMode = false;
					map.baseLayerControl.onChange = function(name)
					{ 
						currentMode = (name == mapString) ? "map" : (name == satelliteString) ? "satellite" : "hybrid";
					}
					map.getMode = function()
					{ 
						return currentMode;
					}
					map.setMode = function(mode) 
					{
						map.setBaseLayer({ map: mapString, satellite: satelliteString, hybrid: hybridString }[mode]);
					}
					map.setMode(mapLayers.length > 0 ? "map" : "satellite");
					map.miniMap.setVisible(true);
					
					for (var m = 0; m < mapLayers.length; m++)
						map.miniMap.addLayer(mapLayers[m]);
					
					if (osmEmbed)
					{
						map.miniMap.addLayer(osmEmbed);
						setOSMEmbed(map.miniMap.layers[osmEmbed.properties.name]);
					}
		                
					if (!window.baseMap || !window.baseMap.hostName || (window.baseMap.hostName == "maps.kosmosnimki.ru"))
						map.geoSearchAPIRoot = typeof window.searchAddressHost !== 'undefined' ? window.searchAddressHost : "http://maps.kosmosnimki.ru/";
		
					if (layers)
					{
						map.defaultHostName = layers.properties.hostName;
						window.getLayers = function() { return layers; }
						map.addLayers(layers);
						map.properties = layers.properties;
					}

					callback(map);
				});
			},
			function()
			{
				window.getLayers = oldGetLayers;
				createFlashMapInternal(div, layers, callback);
			}
		);
	}

	if (!getScriptURL("config.js"))
	{
		loadVariableFromScript(
			getScriptBase("api.js") + "config.js",
			"defaultMapID",
			finish
		);
	}
	else
		finish();
}

function forEachPointAmb(arg, callback)
{
	forEachPoint(arg.length ? arg : arg.coordinates, callback);
}

function geoLength(arg1, arg2, arg3, arg4)
{
	if (arg4)
		return distVincenty(arg1, arg2, arg3, arg4);
	var currentX = false, currentY = false, length = 0;
	forEachPointAmb(arg1, function(p)
	{
		if (currentX && currentY)
			length += parseFloat(distVincenty(currentX, currentY, p[0], p[1]));
		currentX = p[0];
		currentY = p[1];
	});
	return length;
}

function geoArea(arg)
{
	if (arg.type == "MULTIPOLYGON")
	{
		var ret = 0;
		for (var i = 0; i < arg.coordinates.length; i++)
			ret += geoArea({ type: "POLYGON", coordinates: arg.coordinates[i] });
		return ret;
	}
	else if (arg.type == "POLYGON")
	{
		var ret = geoArea(arg.coordinates[0]);
		for (var i = 1; i < arg.coordinates.length; i++)
			ret -= geoArea(arg.coordinates[i]);
		return ret;
	}
	else if (arg.length)
	{
		var pts = [];
		forEachPoint(arg, function(p) { pts.push(p); });
		return fragmentArea(pts);
	}
	else
		return 0;
}

function geoCenter(arg1, arg2, arg3, arg4)
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
		forEachPointAmb(arg1, function(p)
		{
			minX = Math.min(minX, p[0]);
			minY = Math.min(minY, p[1]);
			maxX = Math.max(maxX, p[0]);
			maxY = Math.max(maxY, p[1]);
		});
	}
	return [
		from_merc_x((merc_x(minX) + merc_x(maxX))/2),
		from_merc_y((merc_y(minY) + merc_y(maxY))/2)
	];
}

function convertCoords(coordsStr)
{
	var res = [],
		coordsPairs = strip(coordsStr).replace(/\s+/,' ').split(' ');
	
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

function parseGML(response)
{
	var geometries = [],
		strResp = response.replace(/[\t\n\r]/g, ' '),
		strResp = strResp.replace(/\s+/g, ' '),
		coordsTag = /<gml:coordinates>([-0-9.,\s]*)<\/gml:coordinates>/,
		pointTag = /<gml:Point>[\s]*<gml:coordinates>[-0-9.,\s]*<\/gml:coordinates>[\s]*<\/gml:Point>/g,
		lineTag = /<gml:LineString>[\s]*<gml:coordinates>[-0-9.,\s]*<\/gml:coordinates>[\s]*<\/gml:LineString>/g,
		polyTag = /<gml:Polygon>[\s]*(<gml:outerBoundaryIs>[\s]*<gml:LinearRing>[\s]*<gml:coordinates>[-0-9.,\s]*<\/gml:coordinates>[\s]*<\/gml:LinearRing>[\s]*<\/gml:outerBoundaryIs>){0,1}[\s]*(<gml:innerBoundaryIs>[\s]*<gml:LinearRing>[\s]*<gml:coordinates>[-0-9.,\s]*<\/gml:coordinates>[\s]*<\/gml:LinearRing>[\s]*<\/gml:innerBoundaryIs>){0,1}[\s]*<\/gml:Polygon>/g,
		outerTag = /<gml:outerBoundaryIs>(.*)<\/gml:outerBoundaryIs>/,
		innerTag = /<gml:innerBoundaryIs>(.*)<\/gml:innerBoundaryIs>/
	
	if (strResp.indexOf('gml:posList') > -1)
	{
		coordsTag = /<gml:posList>([-0-9.,\s]*)<\/gml:posList>/,
		pointTag = /<gml:Point>[\s]*<gml:posList>[-0-9.,\s]*<\/gml:posList>[\s]*<\/gml:Point>/g,
		lineTag = /<gml:LineString>[\s]*<gml:posList>[-0-9.,\s]*<\/gml:posList>[\s]*<\/gml:LineString>/g,
		polyTag = /<gml:Polygon>[\s]*(<gml:exterior>[\s]*<gml:LinearRing>[\s]*<gml:posList>[-0-9.,\s]*<\/gml:posList>[\s]*<\/gml:LinearRing>[\s]*<\/gml:exterior>){0,1}[\s]*(<gml:interior>[\s]*<gml:LinearRing>[\s]*<gml:posList>[-0-9.,\s]*<\/gml:posList>[\s]*<\/gml:LinearRing>[\s]*<\/gml:interior>){0,1}[\s]*<\/gml:Polygon>/g,
		outerTag = /<gml:exterior>(.*)<\/gml:exterior>/,
		innerTag = /<gml:interior>(.*)<\/gml:interior>/
	}
	else if (strResp.indexOf('<kml') > -1)
	{
		coordsTag = /<coordinates>([-0-9.,\s]*)<\/coordinates>/,
		pointTag = /<Point>[^P]*<\/Point>/g,
		lineTag = /<LineString>[^L]*<\/LineString>/g,
		polyTag = /<Polygon>[^P]*<\/Polygon>/g,
		outerTag = /<outerBoundaryIs>(.*)<\/outerBoundaryIs>/,
		innerTag = /<innerBoundaryIs>(.*)<\/innerBoundaryIs>/
	}
	
	strResp = strResp.replace(pointTag, function(str)
	{
		var coords = getTagValue(str, coordsTag),
			parsedCoords = convertCoords(coords);
		
		geometries.push({type: 'POINT', coordinates:parsedCoords[0]})
		
		return '';
	})
	
	strResp = strResp.replace(lineTag, function(str)
	{
		var coords = getTagValue(str, coordsTag),
			parsedCoords = convertCoords(coords)

		geometries.push({type: 'LINESTRING', coordinates: parsedCoords});
		
		return '';
	})
	
	strResp = strResp.replace(polyTag, function(str)
	{
		var coords = [],
			outerCoords = getTagValue(str, outerTag),
			innerCoords = getTagValue(str, innerTag),
			resultCoords = [];
		
		if (outerCoords)
			coords.push(getTagValue(outerCoords, coordsTag));
		
		if (innerCoords)
			coords.push(getTagValue(innerCoords, coordsTag));
		
		for (var index = 0; index < coords.length; index++)
			resultCoords.push(convertCoords(coords[index]))
		
		geometries.push({type: 'POLYGON', coordinates: resultCoords});
		
		return '';
	})
	
	return geometries;
}

function createGML(geometries, format)
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

function getTagValue(str, tag)
{
	var res = null;
	
	str.replace(tag, function()
	{
		res = arguments[1];
	})
	
	return res;
}


var PI = 3.14159265358979;

function deg_rad(ang)
{
   	return ang * (PI/180.0)
}

function deg_decimal(rad)
{ 
	return (rad/PI) * 180.0;
}

function merc_x(lon) {
    var r_major = 6378137.000;
    return r_major * deg_rad(lon);
}

function from_merc_x(x) {
    var r_major = 6378137.000;
    return deg_decimal(x/r_major);
}

function merc_y(lat) {
    if (lat > 89.5)
        lat = 89.5;
    if (lat < -89.5)
        lat = -89.5;
    var r_major = 6378137.000;
    var r_minor = 6356752.3142;
    var temp = r_minor / r_major;
    var es = 1.0 - (temp * temp);
    var eccent = Math.sqrt(es);
    var phi = deg_rad(lat);
    var sinphi = Math.sin(phi);
    var con = eccent * sinphi;
    var com = .5 * eccent;
    con = Math.pow(((1.0-con)/(1.0+con)), com);
    var ts = Math.tan(.5 * ((PI*0.5) - phi))/con;
    var y = 0 - r_major * Math.log(ts);
    return y;
}

function from_merc_y (y)
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

	return deg_decimal(Phi);
}

function merc(lon,lat) {
    return [merc_x(x),merc_y(y)];
}

function from_merc(x,y) {
    return [from_merc_x(x),from_merc_y(y)];
}

function distVincenty(lon1,lat1,lon2,lat2) 
{
  	var p1 = new Object();
  	var p2 = new Object();
	
  	p1.lon =  deg_rad(lon1);
  	p1.lat =  deg_rad(lat1);
  	p2.lon =  deg_rad(lon2);
  	p2.lat =  deg_rad(lat2);

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



    var sm_a = 6378137.0;
    var sm_b = 6356752.314;
    var sm_EccSquared = 6.69437999013e-03;

    var UTMScaleFactor = 0.9996;


    function DegToRad (deg)
    {
        return (deg / 180.0 * PI)
    }

    function RadToDeg (rad)
    {
        return (rad / PI * 180.0)
    }

    function ArcLengthOfMeridian (phi)
    {
        var alpha, beta, gamma, delta, epsilon, n;
        var result;
        n = (sm_a - sm_b) / (sm_a + sm_b);
        alpha = ((sm_a + sm_b) / 2.0)
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

    function UTMCentralMeridian (zone)
    {
        var cmeridian;

        cmeridian = DegToRad (-183.0 + (zone * 6.0));
    
        return cmeridian;
    }

    function FootpointLatitude (y)
    {
        var y_, alpha_, beta_, gamma_, delta_, epsilon_, n;
        var result;
        
        n = (sm_a - sm_b) / (sm_a + sm_b);
        alpha_ = ((sm_a + sm_b) / 2.0)
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



    function MapLatLonToXY (phi, lambda, lambda0, xy)
    {
        var N, nu2, ep2, t, t2, l;
        var l3coef, l4coef, l5coef, l6coef, l7coef, l8coef;
        var tmp;

        ep2 = (Math.pow (sm_a, 2.0) - Math.pow (sm_b, 2.0)) / Math.pow (sm_b, 2.0);
        nu2 = ep2 * Math.pow (Math.cos (phi), 2.0);
        N = Math.pow (sm_a, 2.0) / (sm_b * Math.sqrt (1 + nu2));
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
    
    
    
    function MapXYToLatLon (x, y, lambda0, philambda)
    {
        var phif, Nf, Nfpow, nuf2, ep2, tf, tf2, tf4, cf;
        var x1frac, x2frac, x3frac, x4frac, x5frac, x6frac, x7frac, x8frac;
        var x2poly, x3poly, x4poly, x5poly, x6poly, x7poly, x8poly;
    	
        phif = FootpointLatitude (y);
        ep2 = (Math.pow (sm_a, 2.0) - Math.pow (sm_b, 2.0))
              / Math.pow (sm_b, 2.0);
        cf = Math.cos (phif);
        nuf2 = ep2 * Math.pow (cf, 2.0);
        Nf = Math.pow (sm_a, 2.0) / (sm_b * Math.sqrt (1 + nuf2));
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



    function LatLonToUTMXY (lat, lon, zone, xy)
    {
        MapLatLonToXY (lat, lon, UTMCentralMeridian (zone), xy);

        xy[0] = xy[0] * UTMScaleFactor + 500000.0;
        xy[1] = xy[1] * UTMScaleFactor;
        if (xy[1] < 0.0)
            xy[1] = xy[1] + 10000000.0;

        return zone;
    }
    
    function UTMXYToLatLon (x, y, zone, southhemi, latlon)
    {
        var cmeridian;
        	
        x -= 500000.0;
        x /= UTMScaleFactor;
        	
        if (southhemi)
        y -= 10000000.0;
        		
        y /= UTMScaleFactor;
        
        cmeridian = UTMCentralMeridian (zone);
        MapXYToLatLon (x, y, cmeridian, latlon);
        	
        return;
    }


function truncate9(x)
{
	return ("" + x).substring(0, 9);
}

function prettifyDistance(length)
{
	if (length < 1000)
		return Math.round(length) + KOSMOSNIMKI_LOCALIZED(" м", " m");
	if (length < 100000)
		return (Math.round(length/10)/100) + KOSMOSNIMKI_LOCALIZED(" км", " km");
	return Math.round(length/1000) + KOSMOSNIMKI_LOCALIZED(" км", " km");
}

function prettifyArea(area)
{
	if (area < 100000)
		return Math.round(area) + KOSMOSNIMKI_LOCALIZED(" кв. м", " sq. m");
	if (area < 100000000)
		return ("" + (Math.round(area/10000)/100)).replace(".", ",") + KOSMOSNIMKI_LOCALIZED(" кв. км", " sq.km");
	return (Math.round(area/1000000)) + KOSMOSNIMKI_LOCALIZED(" кв. км", " sq. km");
}

var lambertCoefX = 100*distVincenty(0, 0, 0.01, 0);
var lambertCoefY = 100*distVincenty(0, 0, 0, 0.01)*180/PI;

function fragmentArea(points)
{
	var pts = [];
	for (var i in points)
		pts.push([points[i][0], Math.sin(points[i][1]*PI/180)]);
	var area = 0;
	for (var i in pts)
	{
		var ipp = (i == (pts.length - 1) ? 0 : (parseInt(i) + 1));
		area += (pts[i][0]*pts[ipp][1] - pts[ipp][0]*pts[i][1]);
	}
	return Math.abs(area*lambertCoefX*lambertCoefY/2);
}

function fragmentAreaMercator(points)
{
	var pts = [];
	for (var i in points)
		pts.push([from_merc_x(points[i][0]), from_merc_y(points[i][1])]);
	return fragmentArea(pts);
}


function formatDegreesSimple(angle)
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

function pad2(t)
{
	return (t < 10) ? ("0" + t) : ("" + t);
}

function formatDegrees(angle)
{
	angle = Math.round(10000000*angle)/10000000 + 0.00000001;
	var a1 = Math.floor(angle);
	var a2 = Math.floor(60*(angle - a1));
	var a3 = pad2(3600*(angle - a1 - a2/60)).substring(0, 2);
	return pad2(a1) + "°" + pad2(a2) + "'" + a3 + '"';
}

function formatCoordinates(x, y)
{
	var lat_ = from_merc_y(y);
	var lon_ = from_merc_x(x);
	return  formatDegrees(Math.abs(lat_)) + (lat_ > 0 ? " N, " : " S, ") + 
		formatDegrees(Math.abs(lon_)) + (lon_ > 0 ? " E" : " W");
}


var trunc = function(x)	
{
	return ("" + (Math.round(10000000*x)/10000000 + 0.00000001)).substring(0, 9);
}

function formatCoordinates2(x, y)
{
	var lat_ = from_merc_y(y);
	var lon_ = from_merc_x(x);
	return  trunc(Math.abs(lat_)) + (lat_ > 0 ? " N, " : " S, ") + 
		trunc(Math.abs(lon_)) + (lon_ > 0 ? " E" : " W");
}

if (!this.JSON) {
    JSON = {};
}
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


/**
 * Class for working with browser printing
 * @see http://www.anychart.com/blog/projects/acprintmanagerlibrary/
 * @version 0.1
 * @author Alex Batsuev (alex(at)sibental(dot)com)
 */
var ACPrintManager = function() {}

ACPrintManager.isIE = function() {
	return isIE;
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

	if (isIE)
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
	sendCrossDomainJSONRequest(getAPIHostRoot() + "ApiSave.ashx?debug=1&get=" + encodeURIComponent(url), function(response)
	{
		var parsed = _this.parse(response);
		parsed.url = url;
		callback(parsed);
	})
}

function parseXML(str)
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
		alert(e)
	}
	
	return xmlDoc;
}

function getTextContent(node)
{
	if (typeof node.textContent != 'undefined')
		return node.textContent;
	
	var data = '';
	for (var i = 0; i < node.childNodes.length; i++)
		data += node.childNodes[i].data;
	
	return data;
}

kmlParser.prototype.parse = function(response)
{
	var strResp = response.replace(/[\t\n\r]/g, ' '),
		strResp = strResp.replace(/\s+/g, ' '),
		xml = parseXML(strResp),
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
    
    var name = false,
    	documentChilds = xml.getElementsByTagName('Document')[0].childNodes;
    
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

		if (!!href)
			style = {marker: {image: href, center: true}}
		else
			style = {marker: {size: 3}, outline:{color:0x0000FF, thickness:1}, fill:{color:0xFFFFFF, opacity:20}}
	}

	var linestyles = elem.getElementsByTagName("LineStyle");
	if (linestyles.length > 0) 
	{
		var width = parseInt(this.value(linestyles[0].getElementsByTagName("width")[0]));
		
		if (width < 1) 
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
		coordsPairs = strip(coordsStr).replace(/[\t\n\r\s]/g,' ').replace(/\s+/g, ' ').replace(/,\s/g, ',').split(' ');
	
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
	var bounds = getBounds(),
		loadingIcons = {},
		_this = this;
	
	for (var i = 0; i < vals.length; ++i)
	{
		if (vals[i].items.length == 1)
		{
			var item = vals[i].items[0];
			
			if (item.geometry.type == 'POINT')
			{
				var elem = this.drawItem(parent, item, true, vals[i].name, vals[i].desc);
				
				if (typeof item.style.normal.marker.image != 'undefined' &&
					typeof this.hrefs[item.style.normal.marker.image] == 'undefined')
				{
					if (typeof loadingIcons[item.style.normal.marker.image] == 'undefined')
						loadingIcons[item.style.normal.marker.image] = []
					
					loadingIcons[item.style.normal.marker.image].push({elem:elem, style:item.style})
				}
			}
			else
				this.drawItem(parent, item, true, vals[i].name, vals[i].desc)
			
			bounds.update(item.geometry.coordinates);
		}
		else
		{
			var point = false,
				neighbours = [],
				neighbourElems = [];
			
			for (var j = 0; j < vals[i].items.length; ++j)
			{
				if (!point && vals[i].items[j].geometry.type == 'POINT')
					point = vals[i].items[j];
				else
					neighbours.push(vals[i].items[j])
			}
			
			var elem = this.drawItem(parent, point, false);
			
			if (point.style.normal && 
				(typeof point.style.normal.marker.image != 'undefined') &&
				(typeof this.hrefs[point.style.normal.marker.image] == 'undefined'))
			{
				if (typeof loadingIcons[point.style.normal.marker.image] == 'undefined')
					loadingIcons[point.style.normal.marker.image] = []
				
				loadingIcons[point.style.normal.marker.image].push({elem:elem, style:point.style})
			}
			
			bounds.update(point.geometry.coordinates);
			
			for (var j = 0; j < neighbours.length; ++j)
			{
				if (neighbours[j].geometry.type != 'POINT')
				{
					var neighbourElem = this.drawItem(parent, neighbours[j], false)
						
					bounds.update(neighbours[j].geometry.coordinates);

					neighbourElems.push({elem:neighbourElem, style:neighbours[j].style});
				}
			}
			
			(function(neighbourElems, name, desc){
				elem.setHandlers({
					onMouseOver: function(o)
					{
						for (var k = 0; k < neighbourElems.length; ++k)
						{
							if (neighbourElems[k].style.highlight)
								neighbourElems[k].elem.setStyle(_this.removeMarkerStyle(neighbourElems[k].style.highlight))
						}
					},
					onMouseOut: function(o) 
					{
						for (var k = 0; k < neighbourElems.length; ++k)
						{
							if (neighbourElems[k].style.highlight)
								neighbourElems[k].elem.setStyle(_this.removeMarkerStyle(neighbourElems[k].style.normal))
						}
					},
					onClick: function(o)
					{
						var div = document.createElement("div");
						div.innerHTML = "<div style=\"margin-bottom: 10px;font-size:12px;color:#000;\" >" + name + "</div>" + desc;
						
						_this.createBalloon(o, div);
					}
				})
			})(neighbourElems, vals[i].name, vals[i].desc)
		}
	}

	for (var url in loadingIcons)
	{
		(function(url){
			sendCrossDomainJSONRequest(getAPIHostRoot() + "ImgSave.ashx?get=" + encodeURIComponent(url), function(response)
			{
				if (response.Status != 'ok')
					return;
				
				var id = response.Result;
				
				_this.hrefs[url] = getAPIHostRoot() + "ImgSave.ashx?id=" + id;
				
				for (var i = 0; i < loadingIcons[url].length; ++i)
				{
					var style = loadingIcons[url][i].style.normal;
					
					style.marker.image = _this.hrefs[url];
					
					if (style.fill)
						delete style.fill;

					if (style.outline)
						delete style.outline;
					
					loadingIcons[url][i].elem.setStyle(style);
				}
			})
			
		})(url)
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

function makeImageButton(url, urlHover)
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
	
	var remove = makeImageButton("img/close.png", "img/close_orange.png");
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

var _kmlParser = new kmlParser();

/** Класс управления балунами
* @function
* @memberOf api
* @param {map} ссылка на обьект карты
* @param {flashDiv} ссылка на SWF обьект
* @param {div} ссылка HTML контейнер карты
* @param {apiBase} URL основного домена
* @see <a href="http://kosmosnimki.ru/geomixer/docs/">» Пример использования</a>.
* @author <a href="mailto:saleks@scanex.ru">Sergey Alexseev</a>
*/
function BalloonClass(map, flashDiv, div, apiBase)
{
	var balloons = [];
	var curMapObject = null;

	var mapX = 0;
	var mapY = 0;
	var stageZoom = 1;						// Коэф. масштабирования браузера
	var scale = 0;
	map.getPosition();

	// Обновить информацию текущего состояния карты
	function refreshMapPosition()
	{
		currPosition = map.getPosition();
		mapX = currPosition['x'];
		mapY = currPosition['y'];
		scale = getScale(currPosition['z']);
		stageZoom =  currPosition['stageHeight'] / div.clientHeight;	// Коэф. масштабирования браузера
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

	// Текст по умолчанию для балуна (innerHTML)
	function getDefaultBalloonText(o)
	{
		var text = "";
		var identityField = gmxAPI.getIdentityField(o);
		var props = o.properties;
		for (var key in props)
		{
			if (key != identityField)
			{
				var value = "" + props[key];
				if (value.indexOf("http://") == 0)
					value = "<a href='" + value + "'>" + value + "</a>";
				else if (value.indexOf("www.") == 0)
					value = "<a href='http://" + value + "'>" + value + "</a>";
				text += "<b>" + key + ":</b> " + value + "<br />";
			}
		}
		text += "<br />" + o.getGeometrySummary();
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

	function disableHoverBalloon(mapObject)
	{
		mapObject.setHandlers({ onMouseOver: null, onmouseOut: null, onMouseDown: null, onClick: null });
	}
	this.disableHoverBalloon = disableHoverBalloon;

	// Задать пользовательский тип балунов
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
				if(keyPress && (keyPress['shiftKey'] || keyPress['ctrlKey'])) return;	// При нажатых не показываем балун
				if (flashDiv.isDragging())
					return;

				if(chkAttr('disableOnMouseOver', mapObject)) {			// Проверка наличия параметра disableOnMouseOver по ветке родителей 
					return;
				}

				var textFunc = chkAttr('callback', mapObject);			// Проверка наличия параметра callback по ветке родителей 
				var text = (textFunc ? textFunc(o) : getDefaultBalloonText(o));
				if(!text) return;
				var id = setID(o);
				lastHoverBalloonId = o.objectId;
				
				if (!fixedHoverBalloons[id]) {
					propsBalloon.updatePropsBalloon(text);
				}
				else {
					propsBalloon.updatePropsBalloon(false);
				}

				map.clickBalloonFix = clickBalloonFix;
			},
			onMouseOut: function(o) 
			{ 
				if (lastHoverBalloonId == o.objectId) {
					propsBalloon.updatePropsBalloon(false);
				}
			},
			onClick: clickBalloonFix
		};

		if(mapObject._hoverBalloonAttr) {							// есть юзерские настройки балунов
			if(mapObject._hoverBalloonAttr['disableOnMouseOver']) {			// для отключения балунов при наведении на обьект
				handlersObj['onMouseOver'] = null;
				handlersObj['onMouseOut'] = null;
			}
			if(mapObject._hoverBalloonAttr['disableOnClick']) {				// для отключения фиксированных балунов
				handlersObj['onClick'] = null;
			}
		}
		mapObject.setHandlers(handlersObj);
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
	}
	
	function hideHoverBalloons(flag)
	{
		for (var key in fixedHoverBalloons)
		{
			var balloon = fixedHoverBalloons[key];
			balloon.setVisible(false);
		}
		if(flag) {
			
			var timeoutShowHoverBalloons = setTimeout(function()
			{
				clearTimeout(timeoutShowHoverBalloons);
				showHoverBalloons();
			}, 300);
		}
	}
	this.hideHoverBalloons = hideHoverBalloons;

	// Фиксация балуна
	function clickBalloonFix(o, keyPress)
	{
		var OnClickSwitcher = chkAttr('OnClickSwitcher', o);		// Проверка наличия параметра по ветке родителей 
		if(OnClickSwitcher && typeof(OnClickSwitcher) == 'function') {
			var flag = OnClickSwitcher(o, keyPress);				// Вызов пользовательского метода вместо или перед балуном
			if(flag) return;										// Если OnClickSwitcher возвращает true выходим
		}

		if(chkAttr('disableOnClick', o))	// Проверка наличия параметра disableOnClick по ветке родителей 
			return;

		var textFunc = chkAttr('callback', o);			// Проверка наличия параметра callback по ветке родителей 
		if(keyPress) {
			if(keyPress['shiftKey'] || keyPress['ctrlKey']) return;	// При нажатых не показываем балун
			if(keyPress['nodeFilter'] == o.parent.objectId && o.parent._hoverBalloonAttr.callback) textFunc = o.parent._hoverBalloonAttr.callback; // взять параметры балуна от фильтра родителя
		}

		var text = (textFunc ? textFunc(o) : getDefaultBalloonText(o));
		if(!text) return;
		var id = setID(o);
		if (!fixedHoverBalloons[id])
		{
			var maxFixedBallons = chkAttr('maxFixedBallons', o) || 1;	// Проверка наличия параметра maxFixedBallons по ветке родителей
			if(maxFixedBallons > 0 && balloons.length > 0)
			{
				if(maxFixedBallons <= balloons.length) {
					var balloon = balloons[0];
					var fixedId = balloon.fixedId;
					balloon.remove();
					delete fixedHoverBalloons[fixedId];
				}
			}
			var balloon = addBalloon();
			balloon.fixedId =  id;

			var mx = map.getMouseX();
			var my = map.getMouseY();
			
			if(o.getGeometryType() == 'POINT') {
				var gObj = o.getGeometry();
				var x = gObj.coordinates[0];
				var y = gObj.coordinates[1];

				balloon.fixedDeltaX =  (merc_x(mx) -  merc_x(x))/scale;
				balloon.fixedDeltaY =  (merc_y(my) -  merc_y(y))/scale;
				mx = x;
				my = y;
				balloon.fixedDeltaFlag = true;
			}

			balloon.setPoint(mx, my);
			balloon.div.innerHTML = text;
			balloon.resize();
			fixedHoverBalloons[id] = balloon;
			balloon.setVisible(true);
		}
		else
		{
			fixedHoverBalloons[id].remove();
			delete fixedHoverBalloons[id];
		}
		propsBalloon.updatePropsBalloon(false);
	}
	this.clickBalloonFix = clickBalloonFix;

	// Создание DIV и позиционирование балуна
	function createBalloon()
	{
		var tlw = 14;
		var tlh = 14;
		var blw = 14;
		var blh = 41;
		var trw = 18;
		var trh = 13;
		var brw = 15;
		var brh = 41;
		var th = 2;
		var lw = 2;
		var bh = 2;
		var rw = 2;

		var legWidth = 68;

		var balloon = newStyledDiv({
			position: "absolute",

			paddingLeft: lw + "px",
			paddingRight: rw + "px",
			paddingTop: th + "px",
			paddingBottom: bh + "px",

			width: "auto",
			whiteSpace: "nowrap",
			zIndex: 1000
		});
		div.appendChild(balloon);

		var css = {
			'table': 'margin: 0px; border-collapse: collapse;',
			'bg_top_left': 'background-color: transparent; width: 13px; height: 18px; border: 0px none; padding: 1px; display: block; background-position: 2px 9px; background-image: url(\''+apiBase+'img/tooltip-top-left.png\'); background-repeat: no-repeat;',
			'bg_top': 'background-color: transparent; height: 18px; border: 0px none; padding: 1px; background-position: center 9px; background-image: url(\''+apiBase+'img/tooltip-top.png\'); background-repeat: repeat-x;',
			'bg_top_right': 'background-color: transparent; width: 18px; height: 18px; border: 0px none; padding: 1px; display: block; background-position: -5px 9px; background-image: url(\''+apiBase+'img/tooltip-top-right.png\'); background-repeat: no-repeat;',
			'bg_left': 'background-color: transparent; width: 13px; border: 0px none; padding: 1px; background-position: 2px top; background-image: url(\''+apiBase+'img/tooltip-left.png\'); background-repeat: repeat-y;',
			'bg_center': 'background-color: transparent; width: 50px; min-width: 50px; border: 0px none; background-color: white; white-space: nowrap; padding: 4px; padding-right: 14px;',
			'bg_right': 'background-color: transparent; width: 13px; height: 18px; border: 0px none; padding: 1px; background-position: 0px top; background-image: url(\''+apiBase+'img/tooltip-right.png\'); background-repeat: repeat-y;',
			'bg_bottom_left': 'background-color: transparent; width: 13px; height: 18px; border: 0px none; padding: 1px; background-position: 2px top; background-image: url(\''+apiBase+'img/tooltip-bottom-left.png\'); background-repeat: no-repeat;',
			'bg_bottom': 'background-color: transparent; height: 18px; border: 0px none; padding: 1px; background-position: center top; background-image: url(\''+apiBase+'img/tooltip-bottom.png\'); background-repeat: repeat-x;',
			'bg_bottom_right': 'background-color: transparent; width: 18px; height: 18px; border: 0px none; padding: 1px; background-position: -2px top; background-image: url(\''+apiBase+'img/tooltip-bottom-right.png\'); background-repeat: no-repeat;',
			'leg': 'bottom: 18px; left: 0px; width: 68px; height: 41px; position: relative; background-repeat: no-repeat; background-image: url(\''+apiBase+'img/tooltip-leg.png\');'
		};

		var body = '\
			<table cols="3" cellspacing="0" cellpadding="0" border="0" style="'+css['table']+'">\
				<tr>\
					<td style="'+css['bg_top_left']+'"></td>\
					<td style="'+css['bg_top']+'"></td>\
					<td style="'+css['bg_top_right']+'"></td>\
				</tr>\
				<tr>\
					<td style="'+css['bg_left']+'"></td>\
					<td style="'+css['bg_center']+'">\
						<div style="white-space: nowrap;" class="kosmosnimki_balloon">\
						</div>\
					</td>\
					<td style="'+css['bg_right']+'"></td>\
				</tr>\
				<tr>\
					<td style="'+css['bg_bottom_left']+'"></td>\
					<td style="'+css['bg_bottom']+'"></td>\
					<td style="'+css['bg_bottom_right']+'"></td>\
				</tr>\
			</table>\
		';
		balloon.innerHTML = body;
		var nodes = balloon.getElementsByTagName("div");
		var balloonText = nodes[0];
		
		var leg = newElement("img",
			{
				src: apiBase + "img/tooltip-leg.png"
			},
			{
				position: "absolute",
				bottom: "-21px",
				right: "15px"
			}
		);
		balloon.appendChild(leg);

		var x = 0;
		var y = 0;
		var reposition = function()	
		{
			var ww = balloon.clientWidth;
			var hh = balloon.clientHeight;

			var screenWidth = div.clientWidth;
			var xx = (x + ww < screenWidth) ? x : (ww < screenWidth) ? (screenWidth - ww) : 0;
			xx = Math.max(xx, x - ww + legWidth + brw);
			var dx = x - xx;
			leg.style.left = dx + "px";
			bottomPosition(balloon, xx + 2, div.clientHeight - y + 20);
		}

		var updateVisible = function(flag)	
		{
			setVisible(balloon, flag);
			if (flag && !wasVisible)
				ret.resize();
			wasVisible = flag;
		}

		var wasVisible = true;

		var ret = {						// Возвращаемый обьект
			outerDiv: balloon,
			div: balloonText,
			setVisible: updateVisible,
			setScreenPosition: function(x_, y_)
			{
				x = x_;
				y = y_;
				reposition();
			},
			resize: function()
			{
				reposition();
			},
			updatePropsBalloon: function(text)
			{
				updateVisible(text ? true : false);
				if (text)
				{
					balloonText.innerHTML = text;
					reposition();
				}
				else
					balloonText.innerHTML = "";
			}
		};
		return ret;
	}

	var propsBalloon = createBalloon();		// Balloon для mouseOver
	this.propsBalloon = propsBalloon;
	propsBalloon.setVisible(false);
	propsBalloon.outerDiv.style.zIndex = 10000;
	propsBalloon.outerDiv.style.display = "none";
	new GlobalHandlerMode("mousemove", function(event)
	{
		propsBalloon.setScreenPosition(
			eventX(event) - getOffsetLeft(div), 
			eventY(event) - getOffsetTop(div)
		);
	}).set();
	div.onmouseout = function(event)
	{
		var tg = compatTarget(event);
		if (!event)
			event = window.event;
		var reltg = event.toElement || event.relatedTarget;
		while (reltg && (reltg != document.documentElement))
		{
			if (reltg == propsBalloon.outerDiv)
				return;
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
	propsBalloon.outerDiv.onmouseover = function()
	{
		if (flashDiv.isDragging())
		{
			needToStopDragging = false;
			propsBalloon.updatePropsBalloon(false);
			flashDiv.resumeDragging();
		}
	}

	var positionBalloons = function()	
	{
		refreshMapPosition();
		balloons.sort(function(b1, b2)
		{
			return b1.isHovered ? 1 : b2.isHovered ? -1 : (b2.geoY - b1.geoY);
		});
		for (var i = 0; i < balloons.length; i++)
		{
			balloons[i].reposition();
			balloons[i].outerDiv.style.zIndex = 1000 + i;
		}
	}
	map.addObject().setHandler("onMove", positionBalloons);

	function addBalloon()
	{
		var balloon = createBalloon();
		balloon.geoX = 0;
		balloon.geoY = 0;
		var oldSetVisible = balloon.setVisible;
		balloon.div.onmouseover = function()
		{
			balloon.isHovered = true;
			positionBalloons();
		}
		balloon.div.onmouseout = function()
		{
			balloon.isHovered = false;
			positionBalloons();
		}
		balloon.outerDiv.appendChild(newElement(
			"img",
			{
				src: apiBase + "img/close.png",
				title: KOSMOSNIMKI_LOCALIZED("Закрыть", "Close"),
				onclick: function() 
				{ 
					balloon.remove();
					balloon.isVisible = false;
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
				var x = div.clientWidth/2 - (mapX - merc_x(this.geoX))/sc;
				var y = div.clientHeight/2 + (mapY - merc_y(this.geoY))/sc;
				if(this.fixedDeltaFlag) {
					x += balloon.fixedDeltaX;
					y -= balloon.fixedDeltaY;
				}
				if ((x >= 0) && (x <= div.clientWidth) && (y >= 0) && (y <= div.clientHeight))
				{
					this.setScreenPosition(x, y);
					oldSetVisible(true);
				}
				else
					oldSetVisible(false);
			}
			else
				oldSetVisible(false);
		}
		balloon.setVisible = function(flag)
		{
			balloon.isVisible = flag;
			this.reposition();
		}
		balloon.setPoint = function(x_, y_)
		{
			this.geoX = x_;
			this.geoY = y_;
			positionBalloons();
		}
		balloon.remove = function()
		{
			if(balloon.fixedId) delete fixedHoverBalloons[balloon.fixedId];
			var i = 0;
			while ((i < balloons.length) && (balloons[i] != this))
				i += 1;
			if (i < balloons.length)
			{
				balloons.splice(i, 1);
				div.removeChild(this.outerDiv);
			}
		}
		balloon.getX = function() { return this.geoX; }
		balloon.getY = function() { return this.geoY; }
		balloons.push(balloon);
		return balloon;
	}
	this.addBalloon = addBalloon;


	//Параметры:
	// * Balloon: текст баллуна
	// * BalloonEnable: показывать ли баллун
	// * DisableBalloonOnClick: не показывать при клике
	// * DisableBalloonOnMouseMove: не показывать при наведении
	var setBalloonFromParams = function(filter, balloonParams)
	{
		//по умолчанию балуны показываются
		if ( typeof balloonParams.BalloonEnable !== 'undefined' && !balloonParams.BalloonEnable )
		{
			disableHoverBalloon(filter);
			return;
		}
		
		var balloonAttrs = {
			disableOnClick: balloonParams.DisableBalloonOnClick,
			disableOnMouseOver: balloonParams.DisableBalloonOnMouseMove
		}
		
		if ( balloonParams.Balloon )
		{
			enableHoverBalloon(filter, function(o)
			{
				return gmxAPI.applyTemplate(
					gmxAPI.applyTemplate(balloonParams.Balloon, o.properties),
					{ SUMMARY: o.getGeometrySummary() }
				);
			}, balloonAttrs);
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
		//слой только что создали - всё по умолчанию!
		if (typeof balloonStyle.BalloonEnable === 'undefined')
		{
			balloonStyle.BalloonEnable = true;
			balloonStyle.DisableBalloonOnClick = false;
			balloonStyle.DisableBalloonOnMouseMove = true;
		} 
		else
		{
			//поддержка совместимости - если слой уже был, но новых параметров нет 
			if (typeof balloonStyle.DisableBalloonOnClick === 'undefined')
				balloonStyle.DisableBalloonOnClick = false;
				
			if (typeof balloonStyle.DisableBalloonOnMouseMove === 'undefined')
				balloonStyle.DisableBalloonOnMouseMove = false;
		}
	}
	this.applyBalloonDefaultStyle = applyBalloonDefaultStyle;
}
