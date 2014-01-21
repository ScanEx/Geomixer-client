var nsGmx = nsGmx || {};
nsGmx.Utils = nsGmx.Utils || {};

(function()
{
    var domManipulation = {
        // _el(nodeName, [childs], [attrs])
        _el: function(str, childs, attributes)
        {
            var el = document.createElement(str),
                children = childs,
                attrs = attributes;
            
            if (children)
                _childs(el, children)
                
            if (attrs && attrs.length)
                _attr(el, attrs)
            
            return el;
        },
        // _(elem, [childs], [attrs])
        _: function(ent,childs,attributes)
        {
            var el = ent,
                children = childs,
                attrs = attributes;

            if (children)
                _childs(el, children)
                
            if (attrs && attrs.length)
                _attr(el, attrs)
            
            return el;
        },
        // _t("some text")
        _t: function(str)
        {
            return document.createTextNode(String(str));
        },
        // children - всегда массив
        _childs: function(el, children)
        {
            for (var i = 0; i < children.length; ++i)
                el.appendChild(children[i]);
        },
        //[['css','width','100%']]
        //[['dir','className','name']]
        //[['attr','colSpan',2]]
        _attr: function(el, attrs)
        {
            for (var i = 0; i < attrs.length; ++i)
            {	
                var atr = attrs[i],
                    type = atr[0];

                switch(type)
                {
                    case 'css':
                        (el.style[atr[1]] = atr[2]);
                        break;
                    case 'dir':
                        el[atr[1]] = atr[2];
                        break;
                    case 'attr':
                        el.setAttribute(atr[1], atr[2]);
                        break;
                }
            }
        },        
        _table: function(children,attrs){return _el('TABLE',children,attrs)},
        _caption: function(children,attrs){return _el('CAPTION',children,attrs)},
        _thead: function(children,attrs){return _el('THEAD',children,attrs)},
        _tbody: function(children,attrs){return _el('TBODY',children,attrs)},
        _tfoot: function(children,attrs){return _el('TFOOT',children,attrs)},
        _textarea: function(children,attrs){return _el('TEXTAREA',children,attrs)},
        _th: function(children,attrs){return _el('TH',children,attrs);} ,
        _tr: function(children,attrs){return _el('TR',children,attrs);},
        _td: function(children,attrs){return _el('TD',children,attrs);},
        _span: function(children,attrs){return _el('SPAN',children,attrs);},
        _label: function(children,attrs){return _el('LABEL',children,attrs);},
        _li: function(children,attrs){return _el('LI',children,attrs);},
        _ul: function(children,attrs){return _el('UL',children,attrs);},
        _div: function(children,attrs){return _el('DIV',children,attrs);},
        //_checkbox: function(attrs){return _el('INPUT',null,(attrs&&attrs.concat([['attr','type','checkbox']]))||[['attr','type','checkbox']]);},
        _radio: function(attrs){return _el('INPUT',null,(attrs&&attrs.concat([['attr','type','radio']]))||[['attr','type','radio']])},
        _button: function(children,attrs){return _el('BUTTON',children,attrs)},
        _a: function(children,attrs){return _el('A',children,attrs)},
        _select: function(children,attrs){return _el('SELECT',children,attrs)},
        _option: function(children,attrs){return _el('OPTION',children,attrs);},
        _form: function(children,attrs){return _el('FORM',children,attrs)},
        _iframe: function(children,attrs){return _el('IFRAME',children,attrs)},
        _image: function(children,attrs){return _el('IMG',children,attrs)},
        _img: function(children,attrs){return _el('IMG',children,attrs)},
        _br: function(){return _el('BR')},
        _hr: function(){return _el('HR')},
        _p: function(children,attrs){return _el('P',children,attrs)},
        _b: function(children,attrs){return _el('B',children,attrs)},
        _i: function(children,attrs){return _el('I',children,attrs)},
        _nobr: function(children,attrs){return _el('NOBR',children,attrs)},
        _parametrs: function(children){return _el('PARAMS',children)},
        _input: function(children,attrs){return _el('INPUT',children,attrs)},
        _tinput: function(attrs){return _el('INPUT',null,(attrs&&attrs.concat([['attr','type','text']]))||[['attr','type','text']])},
        _embed: function(children,attrs){return _el('EMBED',children,attrs)},
        _object: function(children,attrs){return _el('OBJECT',children,attrs)},
        _param: function(children,attrs){return _el('PARAM',children,attrs)}
    }
    
    jQuery.extend(window, domManipulation);      //для обратной совместимости
    jQuery.extend(nsGmx.Utils, domManipulation);
})();

function isArray(a)
{
	return a && (typeof a =='object') && (a.constructor == Array)
}

if (window.Node && window.Node.prototype)
{
	Node.prototype.removeNode = function() 
	{
		var parent = this.parentNode;
		parent && parent.removeChild(this);
	}
}

function _click(el)
{
	if (el.click)
		el.click();
	else if (el.onclick)
		el.onclick();
	else
	{
		var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("click", true, true, window,0, 0, 0, 0, 0, false, false, false, false, 0, null);
		el.dispatchEvent(evt);
	}
}

var gmxPrev$$ = typeof $$ == 'undefined' ? undefined : $$;
function gmxRestore$$() { if (typeof gmxPrev$$ != 'undefined') $$ = gmxPrev$$; }

var $$ = function(element) 
{
	return document.getElementById(element);
}

function removeChilds(el)
{
	while (el.firstChild)
		el.removeChild(el.firstChild);
	
	return el;
}
 
function getkey(e)
{
	if (window.event)
		return window.event.keyCode;
	else if (e)	
		return e.which;
	else
		return null;
}

function show(elem)
{
	elem.style.display = '';
}
function hide(elem)
{
	elem.style.display = 'none';
}
function hidden(elem)
{
	elem.style.visibility = 'hidden';
}
function visible(elem)
{
	elem.style.visibility = 'visible';
}
function switchSelect(sel, value)
{
	if (!sel.options || !sel.options.length)
		return sel;
	
	for (var i = 0; i < sel.options.length; i++)
	{
		if (value == sel.options[i].value)
		{
			sel.options[i].selected = true;
			
			sel.selectedIndex = i;
			
			break;
		}
	}

	return sel;
}
function objLength(obj)
{
	var cnt = 0;
	for (var field in obj) cnt++;
	
	return cnt;
}
function valueInArray(arr, value)
{
	for (var i = 0; i < arr.length; i++)
		if (arr[i] == value)
			return true;
	
	return false;
}
function getOffsetRect(elem)
{
    var box = elem.getBoundingClientRect(),
    	body = document.body,
    	docElem = document.documentElement,
    	scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
    	scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
    	clientTop = docElem.clientTop || body.clientTop || 0,
    	clientLeft = docElem.clientLeft || body.clientLeft || 0,
    	top  = box.top +  scrollTop - clientTop,
    	left = box.left + scrollLeft - clientLeft;
	
    return { top: Math.round(top), left: Math.round(left) }
}
function attachEffects(elem, className)
{
	elem.onmouseover = function()
	{
		jQuery(this).addClass(className)
	}
	elem.onmouseout = function(e)
	{
		var evt = e || window.event,
			target = evt.srcElement || evt.target,
			relTarget = evt.relatedTarget || evt.toElement;
		
		try 
		{		
			while (relTarget)
			{
				if (relTarget == elem)
					return;
				relTarget = relTarget.parentNode;
			}
			
			jQuery(elem).removeClass(className)
		}
		catch (e)
		{
			jQuery(elem).removeClass(className)
		}
	}
}
function makeButton(value, id)
{
	var inp = _input(null, [['dir','className','btn'],['attr','type','submit'],['attr','value',value]]);
	if (typeof id != 'undefined' && id != null)
		inp.id = id;
	
	inp.style.padding = '0px 5px';
	
	return inp;
}
function makeImageButton(url, urlHover)
{
	var btn = _img();
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
function makeLinkButton(text)
{
	var span = _span([_t(String(text))],[['dir','className','buttonLink']]);
	
	attachEffects(span, 'buttonLinkHover')
	
	return span;
}
function makeHelpButton(helpText){
	var btn = makeImageButton(getAPIHostRoot() + 'api/img/help.gif');
	btn.setAttribute('title', helpText)
	btn.onclick = function(){
		showDialog('', _t(helpText), 300, 150);
	}
	return btn;
}

function getOwnChildNumber(elem)
{
	for (var i = 0; i < elem.parentNode.childNodes.length; i++)
		if (elem == elem.parentNode.childNodes[i])
			return i;
}
function stopEvent(e) 
{
	if(!e) var e = window.event;
	
	//e.cancelBubble is supported by IE - this will kill the bubbling process.
	e.cancelBubble = true;
	e.returnValue = false;

	//e.stopPropagation works only in Firefox.
	if (e.stopPropagation) 
	{
		e.stopPropagation();
		e.preventDefault();
	}
	return false;
}

//Показывает диалог (на основе jQuery UI dialog)
//Параметры можно передавать явно и в виде объекта params:
//1. showDialog(title, content, width, height, ?posX, ?posY, ?resizeFunc, ?closeFunc)
//2. showDialog(title, content, params)
//Параметры:
// - title {string} Заголовок диалога
// - content {HTMLDomElement} контент диалога
// - width, height {int} высота и ширина диалога (обязательные параметры!)
// - posX, posY {int} положение диалога относительно экрана. Если не задано - по центру
// - resizeFunc {function} будет вызываться при изменении размера диалога
// - closeFunc {function} будет вызываться при закрытии диалога
// - setMinSize {bool} если true (по умолчанию), будут заданы минимальная ширина и высота, равные начальным размерам (width, height)
function showDialog(title, content, width, height, posX, posY, resizeFunc, closeFunc)
{
    var params = null;
    if (arguments.length == 3)
    {
        params = $.extend({
            posX: false, 
            posY: false,
            setMinSize: true
        }, width);
    }
    else
    {
        params = {
            width: width,
            height: height,
            posX: posX,
            posY: posY,
            resizeFunc: resizeFunc,
            closeFunc: closeFunc,
            setMinSize: true
        }
    }
	var canvas = _div([content]);
	
	_(document.body, [canvas])
	var dialogParams = {
        width: params.width,
        height: params.height,
        title: title,
        position: params.posX == false ? 'center' : [params.posX, params.posY],
        resizable: true,
        resize: function()
        {
            canvas.style.width = 'auto';
            canvas.style.height = canvas.parentNode.clientHeight - canvas.parentNode.firstChild.clientHeight - 6 + 'px';
            
            // баги ие
            // if (jQuery.browser.msie)
                // canvas.parentNode.style.width = canvas.parentNode.firstChild.offsetWidth + 'px';
            
            params.resizeFunc && params.resizeFunc();
        },
        close: function(ev, ui)
        {
            if (params.closeFunc && params.closeFunc())
                return;

            removeDialog(canvas);
        }
    };
    
    if (params.setMinSize)
    {
        dialogParams.minWidth = params.width;
        dialogParams.minHeight = params.height;
    }
                        
    jQuery(canvas).dialog(dialogParams);
	
	canvas.parentNode.style.height = params.height + 'px';
	canvas.style.height = params.height - canvas.parentNode.firstChild.clientHeight - 6 + 'px';
							
	var dialog = canvas.parentNode;
	dialog.style.overflow = '';
	
	jQuery(dialog).children("div.ui-resizable-se").removeClass("ui-icon")
				.removeClass("ui-icon-gripsmall-diagonal-se")
				.removeClass("ui-icon-grip-diagonal-se");
	
	return canvas;
}

function removeDialog(canvas)
{
	jQuery(canvas).dialog('destroy');
	
	canvas.removeNode(true);
}

function showErrorMessage(message, removeFlag, title)
{
	var canvas = _div([_t(message)],[['dir','className','errorDialog']]);
	
	showDialog(typeof title != 'undefined' ? title : "Ошибка!", canvas, 250, 150, false, false);
	
	if (removeFlag)
	{
		setTimeout(function()
		{
			if (canvas)
			{
				jQuery(canvas.parentNode).dialog("destroy")
				canvas.parentNode.removeNode(true);
			}
		}, 2500)
	}
}

function _checkbox(flag, type, name)
{
	var box = _input(null, [['attr','type',type]]);
    box.checked = flag;
		
    if (name)
        box.setAttribute('name', name);
	
	return box;
}

function insertAtCursor(myField, myValue, sel) 
{
    if (myField.id && window.tinyMCE && tinyMCE.get(myField.id)) {
        tinyMCE.execInstanceCommand(myField.id, "mceInsertContent", false, myValue);
        return;
    }
    
	if (document.selection)
	{
		if (typeof sel != 'undefined')
			sel.text = myValue;
		else
		{
			myField.focus();
			var sel = document.selection.createRange();
			sel.text = myValue;
		}
	}
	else if (myField.selectionStart || myField.selectionStart == '0')
	{
		var startPos = myField.selectionStart,
			endPos = myField.selectionEnd;
		
		myField.value = myField.value.substring(0, startPos) + myValue + myField.value.substring(endPos, myField.value.length);
	}
	else 
		myField.value += myValue;
}

/* ----------------------------- */
function sendRequest(url, callback, body)
{
	var xmlhttp;
	if (typeof XMLHttpRequest != 'undefined') 
		xmlhttp = new XMLHttpRequest();
	else 
		try { xmlhttp = new ActiveXObject("Msxml2.XMLHTTP"); } 
		catch (e) { try {xmlhttp = new ActiveXObject("Microsoft.XMLHTTP"); } catch (E) {}}
	
	xmlhttp.open(body ? "POST" : "GET", url, true);
	if (body)
	{
		xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xmlhttp.setRequestHeader('Content-length', body.length);
	}
	xmlhttp.onreadystatechange = function() { if (xmlhttp.readyState == 4) callback(xmlhttp); }
	xmlhttp.send(body || "");	
}

function sendJSONRequest(url, callback)
{
	sendRequest(url, function(xmlhttp)
	{
		var text = xmlhttp.responseText;
		callback(JSON.parse(text));
	});
}

nsGmx.Utils.uniqueGlobalName = (function()
{
    var freeid = 0;
    return function(thing)
    {
        var id = 'gmx_unique_' + freeid++;
        window[id] = thing;
        return id;
    }
})();

/** Посылает кросс-доменный GET запрос к серверу с использованием транспорта JSONP.
 * 
 * @memberOf nsGmx.Utils
 * @param {String} url URL сервера.
 * @param {Function} callback Ф-ция, которая будет вызвана при получении от сервера результата.
 * @param {String} [callbackParamName=CallbackName] Имя параметра для задания имени ф-ции ответа.
 * @param {Function} [errorCallback] Ф-ция, которая будет вызвана в случае ошибки запроса к серверу
 */
function sendCrossDomainJSONRequest(url, callback, callbackParamName, errorCallback)
{
	callbackParamName = callbackParamName || 'CallbackName';
    
    var script = document.createElement("script");
	script.setAttribute("charset", "UTF-8");
	var callbackName = nsGmx.Utils.uniqueGlobalName(function(obj)
	{
		callback && callback(obj);
		window[callbackName] = false;
		document.getElementsByTagName("head").item(0).removeChild(script);
	});
    
    var sepSym = url.indexOf('?') == -1 ? '?' : '&';
    
    if (errorCallback) {
        script.onerror = errorCallback;
    }
    
	script.setAttribute("src", url + sepSym + callbackParamName + "=" + callbackName + "&" + Math.random());
	document.getElementsByTagName("head").item(0).appendChild(script);
}

function createCookie(name, value, days)
{
	if (days)
	{
		var date = new Date();
		date.setTime(date.getTime() + (days*24*60*60*1000));
		var expires = "; expires=" + date.toGMTString();
	}
	else
		var expires = "";
	document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name)
{
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i = 0; i < ca.length; i++)
	{
		var c = ca[i];
		while (c.charAt(0)==' ')
			c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) == 0)
			return c.substring(nameEQ.length, c.length);
	}
	return null;
}

function eraseCookie(name)
{
	createCookie(name, "", -1);
}

function getWindowWidth()
{
	var myWidth = 0;
	
	if (typeof (window.innerWidth) == 'number') 
		myWidth = window.innerWidth;
	else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight)) 
		myWidth = document.documentElement.clientWidth;
	else if (document.body && (document.body.clientWidth || document.body.clientHeight))
	{
		myWidth = document.body.clientWidth;
	}
	
	return myWidth;
}

function getWindowHeight()
{
	var myHeight = 0;
	
	if (typeof (window.innerWidth) == 'number' )
		myHeight = window.innerHeight;
	else if (document.documentElement && (document.documentElement.clientWidth || document.documentElement.clientHeight))
		myHeight = document.documentElement.clientHeight;
	else if (document.body && (document.body.clientWidth || document.body.clientHeight))
		myHeight = document.body.clientHeight;
	
	return myHeight;
}

function strip(s)
{
	return s.replace(/^\s*/, "").replace(/\s*$/, "");
}

var replacements = {};
for (var rus in (temp = {
	"qwertyuiopasdfghjklzxcvbnm_1234567890" :
	"qwertyuiopasdfghjklzxcvbnm_1234567890",
	"абвгдезийклмнопрстуфыэ ":
	"abvgdeziyklmnoprstufye_",
	"ёжчхцшщюя":
	"yozhchkhtsshshyuya",
	"ьъ":
	"",
	".":
	"."
}))
{
	var eng = temp[rus],
		k = eng.length/rus.length;
	for (var i = 0; i < rus.length; i++)
	{
		var r = rus.substring(i, i + 1),
			e = eng.substring(i*k, (i + 1)*k);
		replacements[r] = e;
		replacements[r.toUpperCase()] = e.toUpperCase();
	}
}

function translit(name)
{
	var result = "";
	for (var i = 0; i < name.length; i++)
		result += (replacements[name.substring(i, i + 1)] || "");
	
	return result;
}

var layersShown = true,
	layerManagerShown = false,
	leftContentHeightDecrease = 0; //насколько уменьшать высоту левой панели (для плагинов)

function loadFunc(iframe, callback)
{
	var win = iframe.contentWindow;

    //skip first onload in safari
    if ( jQuery.browser.safari && !iframe.safariSkipped)
    {
        iframe.safariSkipped = true;
        return;
    }
	
	if (iframe.loaded)
	{
		var data = decodeURIComponent(win.name.replace(/\n/g,'\n\\'));
        iframe.removeNode(true);
		
		var parsedData;
		try
		{
			parsedData = JSON.parse(data)
		}
		catch(e)
		{
			parsedData = {Status:"error",ErrorInfo: {ErrorMessage: "JSON.parse exeption", ExceptionType:"JSON.parse", StackTrace: data}}
		}
		
		callback && callback(parsedData);
	}
	else
	{
		win.location = 'about:blank';
        iframe.loaded = true;
	}
	
}

function createPostIframe(id, callback)
{
	var userAgent = navigator.userAgent.toLowerCase(),
		callbackName = nsGmx.Utils.uniqueGlobalName(function()
		{
			loadFunc(iframe, callback);
		}),
		iframe;

	try {
		iframe = document.createElement('<iframe style="display:none" onload="' + callbackName + '()" src="javascript:true" id="' + id + '" name="' + id + '"></iframe>');
    }
	catch(e)
	{
		iframe = document.createElement("iframe");
		iframe.style.display = 'none';
		iframe.setAttribute('id', id);
		iframe.setAttribute('name', id);
		iframe.src = 'javascript:true';
		iframe.onload = window[callbackName];
	}	

	return iframe;
}

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
        
        request.iframe.removeNode(true);
        request.callback && request.callback(dataObj);
    }
    
    //совместимость с IE8
    if (window.addEventListener) {
        window.addEventListener('message', processMessage);
    } else {
        window.attachEvent('onmessage', processMessage);
    }
    
    function createPostIframe2(id, callback, url)
    {
        var uniqueId = 'id'+(lastRequestId++);
        
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
    
    window.createPostIframe2 = createPostIframe2;

}();

/** Посылает кроссдоменный POST запрос
*
* @memberOf nsGmx.Utils
* @param {String} url URL запроса
* @param {Object} params Хэш параметров-запросов
* @param {Function} [callback] Callback, который вызывается при приходе ответа с сервера. Единственный параметр ф-ции - собственно данные
* @param {DOMElement} [baseForm] базовая форма запроса. Используется, когда нужно отправить на сервер файл. 
*                                В функции эта форма будет модифицироваться, но после отправления запроса будет приведена к исходному виду.
*/
function sendCrossDomainPostRequest(url, params, callback, baseForm)
{
	var form,
		rnd = String(Math.random()),
		id = '$$iframe_' + url + rnd;

	var iframe = createPostIframe2(id, callback, url),
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
		try {
			form = document.createElement('<form id=' + id + '" enctype="multipart/form-data" style="display:none" target="' + id + '" action="' + url + '" method="post"></form>');
        }
		catch (e)
		{
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

(function() {

    var hooks = {};
    
    /** Добавляет "хук", который будет вызван при ответе сервера соответвующего типа
    * @param type {object} - тип хука (соответствует полю "Status" ответа сервера) или '*' - добавить к любому ответу
    * @param hookFunction {function(response, customErrorDescriptions)} - собственно хук
    */
    window.addParseResponseHook = function(type, hookFunction) {
        hooks[type] = hooks[type] || [];
        hooks[type].push(hookFunction);
    }

    /** Обрабатывает результат выполнения серверного скрипта.
    * Для выполнения действий вызывает "хуки" соответствующиего типа, добавленные через addParseResponseHook()
    * @function
    * 
    * @param response {object} - JSON, вернувшийся с сервера
    * @param customErrorDescriptions {object} - хэш "тип ошибки" -> "кастомное сообщение пользователям".
    * @return true, если статус ответа "ok", иначе false
    */
    window.parseResponse = function(response, customErrorDescriptions)
    {
        var responseHooks = (hooks[response.Status] || []).concat(hooks['*'] || []);
        for (var h = 0; h < responseHooks.length; h++)
            responseHooks[h](response, customErrorDescriptions);
        
        return response.Status == 'ok';
    }

})();

function _title(elem, title)
{
	elem.setAttribute('title', title);
}

function _filter(callback, obj) 
{
    var result = [];
    
    for(var i = 0; i < obj.length; ++i)
		if (callback(obj[i]))
			result.push(obj[i]);
	
    return result;
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

function disableSelection(target)
{
	if (typeof target.onselectstart != "undefined")
	    target.onselectstart = function(){return false}
	else if (typeof target.style.MozUserSelect != "undefined")
	    target.style.MozUserSelect = "none"
	else 
	    target.onmousedown = function(){return false}
}

function parsePropertiesDate(str)
{
	if (str == null || str == "")
		return 0;
	
	var dateParts = str.split('.');
				
	if (dateParts.length != 3)
		return 0;
					
	return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]).valueOf();
}

function stringDate(msec)
{
	var date = new Date(msec);
		excDate = date.getDate(),
		excMonth = date.getMonth() + 1,
		excYear = date.getFullYear();
	
	return (excDate < 10 ? '0' + excDate : excDate) + '.' + (excMonth < 10 ? '0' + excMonth : excMonth) + '.' + excYear;
}

function stringTime(msec)
{
	var date = new Date(msec);
		excHour = date.getHours(),
		excMin = date.getMinutes(),
		excSec = date.getSeconds();
	
	return (excHour < 10 ? '0' + excHour : excHour) + ':' + (excMin < 10 ? '0' + excMin : excMin) + ':' + (excSec < 10 ? '0' + excSec : excSec);
}

function stringDateTime(msec)
{
	var date = new Date(msec);
		excHour = date.getHours(),
		excMin = date.getMinutes(),
		excSec = date.getSeconds();
	
	return stringDate(msec) + ' ' + stringTime(msec);
}

/** Подсвечивает красным input, убирает подсветку через некоторое время
*
* @param {HTMLDOMElement|Array<HTMLDOMElement>} input - целевой input-элемент или массив таких элементов
* @param {integer} delay - время подсвечивания ошибки в миллисекундах
*/
function inputError(input, delay)
{
    delay = delay || 1000;
    if (!isArray(input)) 
        input = [input];
    
    for (var k = 0; k < input.length; k++)
        jQuery(input[k]).addClass('error');
	
	setTimeout(function()
	{
        for (var k = 0; k < input.length; k++)
            if (input[k])
                jQuery(input[k]).removeClass('error');
	}, delay)
}

function equals(x, y)
{
	for(p in y)
	{
	    if(typeof(x[p])=='undefined') {return false;}
	}

	for(p in y)
	{
	    if (y[p])
	    {
	        switch(typeof(y[p]))
	        {
	                case 'object':
	                        if (!equals(x[p], y[p])) { return false }; break;
	                case 'function':
	                        if (typeof(x[p])=='undefined' || (p != 'equals' && y[p].toString() != x[p].toString())) { return false; }; break;
	                default:
	                        if (y[p] != x[p]) { return false; }
	        }
	    }
	    else
	    {
	        if (x[p])
	        {
	            return false;
	        }
	    }
	}

	for(p in x)
	{
	    if(typeof(y[p])=='undefined') {return false;}
	}

	return true;
}

/**
    @namespace nsGmx.Utils
    @description Разнообразные вспомогательные ф-ции
*/
$.extend(nsGmx.Utils, {

    /**
        Возвращает уникальную строку (16 символов из букв и латинских цифр)
        @function
        @memberOf nsGmx.Utils
    */
    generateUniqueID: function()
    {
        var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
            randomstring = '';
        
        for (var i = 0; i < 16; i++) 
        {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.charAt(rnum);
        }
        
        return randomstring;
    },
    /**
        Преобразует цвет, заданный в виде числа (0xaabbcc) в строку вида #aabbcc
        @function
        @memberOf nsGmx.Utils
    */
    convertColor: function(intColor)
    {
        var r,g,b;
        
        b = (intColor % 256).toString(16);
        if (b.length == 1)
            b = '0' + b;
        
        intColor = Math.floor(intColor / 256);
        g = (intColor % 256).toString(16);
        if (g.length == 1)
            g = '0' + g;
        
        intColor = Math.floor(intColor / 256);
        r = (intColor % 256).toString(16);
        if (r.length == 1)
            r = '0' + r;
        
        return '#' + r + g + b;
    },
	
	/** Возвращает позицию окна такую, чтобы окно не мешало текущему элементу
        @memberOf nsGmx.Utils
    */
	getDialogPos: function(div, offsetFlag, height)
	{
		var pos = getOffsetRect(div),
			left = pos.left + 30,
			top = pos.top - 10,
			windowHeight = getWindowHeight();
		
		if (offsetFlag)
		{
			$(div).children('div,img').each(function()
			{ 
				if (!this.getAttribute('multiStyle'))
					left += this.offsetWidth;
			})
		}
		
		if (top + 15 + height > windowHeight)
			top -= (top + 15 + height - windowHeight);
		
		return {left: left, top: top}
	},
	
	/** Устанавливает обычный стиль и генерит похожий стиль при наведении мышки 
    @memberOf nsGmx.Utils
	@param mapObject {MapObject} Объект на карте
	@param templateStyle {Style} Стиль, похожий на который надо установить*/
	setMapObjectStyle: function(mapObject, templateStyle)
	{
        var hoverStyle = {};
        $.extend(true, hoverStyle, templateStyle);
		if (templateStyle.marker && typeof templateStyle.marker.image != 'undefined')
		{
			try
			{
				mapObject.setStyle(templateStyle, hoverStyle);
			}
			catch(e)
			{
			}
		}
		else
		{
			if (templateStyle.outline && typeof templateStyle.outline.thickness != 'undefined')
				hoverStyle.outline.thickness = Number(templateStyle.outline.thickness) + 1;
			
			if (templateStyle.fill && typeof templateStyle.fill.opacity != 'undefined')
				hoverStyle.fill.opacity = Math.min(Number(templateStyle.fill.opacity + 20), 100);
			
			mapObject.setStyle(templateStyle, hoverStyle);
		}
	},
    /** Конвертация данных между форматами сервера и клиента. Используется в тегах слоёв и в атрибутах объектов векторных слоёв.
    *
    * Форматы сервера:
    *
    *  * datetime - unix timestamp
    *  * date - unix timestamp, кратный 24*3600 секунд
    *  * time - кол-во секунд с полуночи
    *
    * Форматы клиента:
    * 
    *  * все числа превращаются в строки
    *  * дата - строка в формате dd.mm.yy
    *  * время - строка в формате hh:mm:ss
    *  * дата-время - dd.mm.yy hh:mm:ss
    *
    * @memberOf nsGmx.Utils
    */
    convertFromServer: function(type, value)
    {
        //if (value === null) return "null";
        
        if (!type) {
            return value;
        }
        
        var lowerCaseType = type.toLowerCase();
        
        if (lowerCaseType == 'string')
        {
            return value !== null ? value : ''; //все null интерпретируем как пустые строки!
        }
        else if (lowerCaseType == 'integer' || lowerCaseType == 'float' || lowerCaseType == 'number')
        {
            return value !== null ? String(value) : '';
        }
        else if (lowerCaseType == 'date')
        {
            if (value === null) return '';
            
            var timeOffset = (new Date(value*1000)).getTimezoneOffset()*60*1000;
            return $.datepicker.formatDate('dd.mm.yy', new Date(value*1000 + timeOffset));
        }
        else if (lowerCaseType == 'time')
        {
            if (value === null) return '';
            
            var timeOffset = (new Date(value*1000)).getTimezoneOffset()*60*1000;
            var tempInput = $('<input/>').timepicker({timeOnly: true, timeFormat: "hh:mm:ss"});
            $(tempInput).timepicker('setTime', new Date(value*1000 + timeOffset));
            return $(tempInput).val();
        }
        else if (lowerCaseType == 'datetime')
        {
            if (value === null) return '';
            
            var timeOffset = (new Date(value*1000)).getTimezoneOffset()*60*1000;
            var tempInput = $('<input/>').datetimepicker({timeOnly: false, timeFormat: "hh:mm:ss"});
            $(tempInput).datetimepicker('setDate', new Date(value*1000 + timeOffset));
            return $(tempInput).val();
        }
        
        return value;
    },
    
    /** Конвертация данных между форматами сервера и клиента. Используется в тегах слоёв и в атрибутах объектов векторных слоёв.
    * Описание форматов см. в {@link nsGmx.Utils.convertFromServer}
    * Если конвертация невозможна для данного типа, возвращает null
    * @memberOf nsGmx.Utils
    */
    convertToServer: function(type, value)
    {
        if (!type) {
            return value;
        }
        
        var lowerCaseType = type.toLowerCase();
        
        if (lowerCaseType == 'string')
        {
            return value;
        }
        else if (lowerCaseType == 'integer' || lowerCaseType == 'float' || lowerCaseType == 'number')
        {
            if (value === '') return null;
            var num = Number(value);
            return isNaN(num) ? null : num;
        }
        else if (lowerCaseType == 'date')
        {
            var localDateValue = $.datepicker.parseDate('dd.mm.yy', value);
            if (localDateValue === null) return null;
            
            var localValue = localDateValue.valueOf()/1000;
            var timeOffset = (new Date(localValue*1000)).getTimezoneOffset()*60;
            return localValue - timeOffset;
        }
        else if (lowerCaseType == 'time')
        {
            var resTime = $.datepicker.parseTime('hh:mm:ss', value);
            if (!resTime) return null;
            
            return resTime.hour*3600 + resTime.minute*60 + resTime.second;
        }
        else if (lowerCaseType == 'datetime')
        {
            var localDateValue = $.datepicker.parseDateTime('dd.mm.yy', 'hh:mm:ss', value);
            if (localDateValue === null) return null;
            
            var localValue = localDateValue.valueOf()/1000;
            var timeOffset = (new Date(localValue*1000)).getTimezoneOffset()*60;
            return localValue - timeOffset;
        }
        
        return value;        
    },
	
	
	login: function(redirect_uri, authServerBase, callback, authServer, isHidden){
		var oAuthServer = authServer || 'MyKosmosnimki';
		window.gmxGetServerBase = function(){ 
			return authServerBase 
		}
		var redirectUri = redirect_uri + (redirect_uri.indexOf('?')>0 ? '&' : '?') + 'authServer=' + oAuthServer;
		window.gmxProcessAuthentication = function(userInfo){
			callback && callback(userInfo);
		}
		var features, w = 600, h = 350, l, t;
		var handlerName = 'LoginDialog';
		if (oAuthServer != 'MyKosmosnimki') {
			handlerName += oAuthServer;
			h = 400;
		}
		var url = authServerBase + handlerName + '.ashx?redirect_uri=' + escape(redirectUri);
		
		if (!isHidden){
			var top = (screen.height - h)/2, left = (screen.width - w)/2;
			features = 'location=0,menubar=0,resizable=0,status=0,toolbar=0,width='+w+',height='+h+',left='+left+',top='+top ;
			
			window.open(url, '_blank', features);
		}else{
			$('<iframe />', {
				 'src': url
				,'style': 'display: block !important; position: absolute; left: -99999px;' 
			}).appendTo('body'); //стиль такой кривой иначе будет бага в FF
		}
    },
    
    /** Загружает пользовательский shp файл.
    * Проверяет на ошибки, выводит предупреждения и ошибки в виде стандартный диалогов.
    * 
    * @memberof nsGmx.Utils 
    * @param {File|Form} shpSource Либо форма с полем file, в которой пользователь выбрал файл, либо HTML5 File.
    * @return Возвращает jQuery Promise (аргумент ф-ции - массив объектов из shp файла)
    */
    parseShpFile: (function() //приватные данные
    {
        var translationsAdded = false;
        var addTranslationsLazy = function()
        {
            if (translationsAdded) return;
            _translationsHash.addtext("rus", {
                                "loadShape.Errors.FileTooBigException" : "Файл слишком большой. Ограничение на размер файла 1000 Кб.",
                                "loadShape.Errors.ErrorUploadExeption" : "Произошла ошибка при попытке загрузить файл.",
                                "loadShape.Errors.NoGeometryFile"      : "Загруженный файл не содержит геометрических данных.",
                                "loadShape.Errors.ErrorUploadNoDependentFiles" : "Не найдено необходимых зависимых файлов. Запакуйте все файлы в ZIP архив и повторите загрузку."
                             });
                             
            _translationsHash.addtext("eng", {
                                "loadShape.Errors.FileTooBigException" : "Too big file. File size limit is 1000 Kb.",
                                "loadShape.Errors.ErrorUploadExeption" : "Error during file uploading.",
                                "loadShape.Errors.NoGeometryFile"      : "There are no geometry in uploaded file.",
                                "loadShape.Errors.ErrorUploadNoDependentFiles" : "Not found the necessary dependent files. Add all files in a ZIP archive and upload it again."
                             });
                             
            translationsAdded = true;
        }
                         
        //непосредственно ф-ция
        return function(shpFileForm) {
            var def = $.Deferred();
            
            addTranslationsLazy();
            
            var errorMessages = {
                "CommonUtil.FileTooBigException" : _gtxt("loadShape.Errors.FileTooBigException"),
                "CommonUtil.ErrorUploadExeption" : _gtxt("loadShape.Errors.ErrorUploadExeption"),
                "CommonUtil.NoGeometryFile"      : _gtxt("loadShape.Errors.NoGeometryFile"),
                "CommonUtil.ErrorUploadNoDependentFiles": _gtxt("loadShape.Errors.ErrorUploadNoDependentFiles")
            };
            
            if (window.File && shpFileForm instanceof window.File) {
                if (!window.FormData) {
                    def.reject();
                    return false;
                }
                
                var formData = new FormData();
                formData.append('file', shpFileForm);
                var xhr = new XMLHttpRequest();
                xhr.open('POST', serverBase + 'ShapeLoader.ashx');
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        response = JSON.parse(xhr.responseText.substr(1, xhr.responseText.length-2));
                        
                        if (!parseResponse(response, errorMessages)) {
                            def.reject();
                        } else {
                            def.resolve(response.Result);
                        }
                        //console.log(response.Result);
                    }
                };
                
                xhr.send(formData);
            } else {
                sendCrossDomainPostRequest(serverBase + "ShapeLoader.ashx", {WrapStyle: "window"}, function(response)
                {
                    if (parseResponse(response, errorMessages))
                        def.resolve(response.Result);
                    else
                        def.reject(response);
                }, shpFileForm)
            }
            
            return def.promise();
        }
        
    })(),
    
    /** Объединяет массив полигонов/мультиполигонов в новый полигон/мультиполигон
    * @memberof nsGmx.Utils
    */
    joinPolygons: function(objs)
    {
        var polygonObjects = [];
        for (var i = 0; i < objs.length; i++)
        {
            var geom = objs[i].geometry;
            if (geom.type == 'POLYGON')
            {
                polygonObjects.push(geom.coordinates);
            }
            else if (objs[i].geometry.type == 'MULTIPOLYGON')
            {
                for (var iC = 0; iC < geom.coordinates.length; iC++)
                    polygonObjects.push(geom.coordinates[iC]);
            }
        }
        
        if (polygonObjects.length > 1)
            return {type: "MULTIPOLYGON", coordinates: polygonObjects}
        else if (polygonObjects.length == 1)
        {
            isCreatedDrawing = true;
            return {type: "POLYGON", coordinates: polygonObjects[0]}
        }
        else
            return null;
    },
    showDialog: window.showDialog
});

window.gmxCore && window.gmxCore.addModule('utilities', nsGmx.Utils);