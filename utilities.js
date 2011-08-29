// _el(nodeName, [childs], [attrs])
function _el(str, childs, attributes)
{
	var el = document.createElement(str),
		children = childs,
		attrs = attributes;
	
	if (children)
		_childs(el, children)
		
	if (attrs && attrs.length)
		_attr(el, attrs)
	
	return el;
}
// _(elem, [childs], [attrs])
function _(ent,childs,attributes)
{
	var el = ent,
		children = childs,
		attrs = attributes;

	if (children)
		_childs(el, children)
		
	if (attrs && attrs.length)
		_attr(el, attrs)
	
	return el;
}
// _t("some text")
function _t(str)
{
	return document.createTextNode(String(str));
}
// children - всегда массив
function _childs(el, children)
{
	for (var i = 0; i < children.length; ++i)
		el.appendChild(children[i]);
}
//[['css','width','100%']]
//[['dir','className','name']]
//[['attr','colSpan',2]]
function _attr(el, attrs)
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
}
 
function _table(children,attrs){return _el('TABLE',children,attrs)}
function _caption(children,attrs){return _el('CAPTION',children,attrs)}
function _thead(children,attrs){return _el('THEAD',children,attrs)}
function _tbody(children,attrs){return _el('TBODY',children,attrs)}
function _tfoot(children,attrs){return _el('TFOOT',children,attrs)}
function _textarea(children,attrs){return _el('TEXTAREA',children,attrs)}
function _th(children,attrs){return _el('TH',children,attrs);} 
function _tr(children,attrs){return _el('TR',children,attrs);}
function _td(children,attrs){return _el('TD',children,attrs);}
function _span(children,attrs){return _el('SPAN',children,attrs);}
function _label(children,attrs){return _el('LABEL',children,attrs);}
function _li(children,attrs){return _el('LI',children,attrs);}
function _ul(children,attrs){return _el('UL',children,attrs);}
function _div(children,attrs){return _el('DIV',children,attrs);}
//function _checkbox(attrs){return _el('INPUT',null,(attrs&&attrs.concat([['attr','type','checkbox']]))||[['attr','type','checkbox']]);}
function _radio(attrs){return _el('INPUT',null,(attrs&&attrs.concat([['attr','type','radio']]))||[['attr','type','radio']])}
function _button(children,attrs){return _el('BUTTON',children,attrs)}
function _a(children,attrs){return _el('A',children,attrs)}
function _select(children,attrs){return _el('SELECT',children,attrs)}
function _option(children,attrs){return _el('OPTION',children,attrs);}
function _form(children,attrs){return _el('FORM',children,attrs)}
function _iframe(children,attrs){return _el('IFRAME',children,attrs)}
function _image(children,attrs){return _el('IMG',children,attrs)}
function _img(children,attrs){return _el('IMG',children,attrs)}
function _br(){return _el('BR')}
function _hr(){return _el('HR')}
function _p(children,attrs){return _el('P',children,attrs)}
function _b(children,attrs){return _el('B',children,attrs)}
function _i(children,attrs){return _el('I',children,attrs)}
function _nobr(children,attrs){return _el('NOBR',children,attrs)}
function _param(children){return _el('PARAM',children)}
function _parametrs(children){return _el('PARAMS',children)}
function _select(children,attrs){return _el('SELECT',children,attrs)}
function _input(children,attrs){return _el('INPUT',children,attrs)}
function _tinput(attrs){return _el('INPUT',null,(attrs&&attrs.concat([['attr','type','text']]))||[['attr','type','text']])}
function _embed(children,attrs){return _el('EMBED',children,attrs)}
function _object(children,attrs){return _el('OBJECT',children,attrs)}
function _param(children,attrs){return _el('PARAM',children,attrs)}

function isArray(a)
{
	return a && (typeof a =='object') && (a.constructor == Array)
}
/*
if (![].map) 
{
	Array.prototype.map = function(callback)
	{
		var arr = [];
		
		for (var i = 0; i < this.length; i++)
			arr.push(callback(this[i]))
		
		return arr;
	}
}*/

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

function showDialog(title, content, width, height, posX, posY, resizeFunc, closeFunc)
{
	var canvas = _div([content]);
	
	_(document.body, [canvas])
	jQuery(canvas).dialog({width:width,height:height,minWidth:width,minHeight:height,
						title: title,
						position: posX == false ? 'center' : [posX, posY],
						resizable: true,
						resize: function()
						{
							canvas.style.width = 'auto';
							canvas.style.height = canvas.parentNode.clientHeight - canvas.parentNode.firstChild.clientHeight - 6 + 'px';
							
							// баги ие
							if (jQuery.browser.msie)
								canvas.parentNode.style.width = canvas.parentNode.firstChild.offsetWidth + 'px';
							
							resizeFunc && resizeFunc();
						},
						close: function(ev, ui)
						{
							var res;
							
							if (closeFunc)
								res = closeFunc();
							
							if (res)
								return;
							
							jQuery(canvas).dialog("destroy")
								
							canvas.removeNode(true);
						}});
	
	canvas.parentNode.style.height = height + 'px';
	canvas.style.height = height - canvas.parentNode.firstChild.clientHeight - 6 + 'px';
							
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
	var box;
	if (jQuery.browser.msie)
	{
		var nameTag = "";
		
		if (name)
			nameTag = " name=\"" + name + "\"";
		
		// костыль для ие
		if (flag)
			box = window.document.createElement("<input type=\"" + type + "\" checked=\"true\"" + nameTag + "></input>");
		else
			box = window.document.createElement("<input type=\"" + type + "\"" + nameTag + "></input>");
	}
	else
	{
		box = _input(null, [['attr','type',type]]);
		box.checked = flag;
		
		if (name)
			box.setAttribute('name', name);
	}
	
	return box;
}

function insertAtCursor(myField, myValue, sel) 
{
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
	layerManagerShown = false;

function resizeAll()
{
	var top = 0,
		bottom = 0,
		right = 0,
		left = Number(layersShown) * 360 + Number(layerManagerShown * 300);
	
	$$("flash").style.left = left + 'px';
	$$("flash").style.top = top + 'px';
	$$("flash").style.width = getWindowWidth() - left - right + 'px';
	$$("flash").style.height = getWindowHeight() - top - 35 - 60 * Number(layersShown) - bottom + 'px';
	
	if (layersShown)
	{
		show($$("leftMenu"));
		
		jQuery("#header").find("[hidable]").css("display",'');
		$$('header').style.height = '95px';
		
		$$("leftContent").style.height = getWindowHeight() - top - bottom - 95 + 'px';
	}
	else
	{
		hide($$("leftMenu"))

		jQuery("#header").find("[hidable]").css("display",'none')
		$$('header').style.height = '35px';
	}
}

function getLayerBounds(c, layer)
{
	var ret = getBounds(c);
	ret.centerX = from_merc_x((merc_x(ret.minX) + merc_x(ret.maxX))/2);
	ret.centerY = from_merc_y((merc_y(ret.minY) + merc_y(ret.maxY))/2);
	ret.getScreenZ = function()
	{
		var z = globalFlashMap.getBestZ(ret.minX, ret.minY, ret.maxX, ret.maxY);
		if (layer && layer.properties.styles && layer.properties.styles[0])
			z = Math.max(z, layer.properties.styles[0].MinZoom);
		
		return z;
	}
	
	return ret;
}

function loadFunc(iframe, callback)
{
	var win = iframe.contentWindow;
	
	try
	{
		//skip first onload in safari
		if (!iframe.loaded && (win.location == 'about:blank' || win.location == 'javascript:true'))
			return;
	}
	catch (e) {}
	
	if (iframe.loaded)
	{
		var data = decodeURIComponent(win.name.replace(/\n/g,'\n\\'));
		
		if (jQuery.browser.mozilla)
		{
	/*		setTimeout(function(){
				iframe.contentWindow.history.back();
				
				// если удалить без переключения контекста, то предыдущее действие не сработает
				setInterval(function(){
					iframe.removeNode(true);
				}, 0);
			}, 0);*/
			iframe.removeNode(true);
		}
		else
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
		
		callback(parsedData);
	}
	else
	{
		win.location = 'about:blank';
	}
	
	iframe.loaded = true;
}

function createPostIframe(id, callback)
{
	var userAgent = navigator.userAgent.toLowerCase(),
		callbackName = uniqueGlobalName(function()
		{
			loadFunc(iframe, callback);
		}),
		iframe;

	if (/msie/.test(userAgent) && !/opera/.test(userAgent))
		iframe = document.createElement('<iframe style="display:none" onload="' + callbackName + '()" src="javascript:true" id="' + id + '" name="' + id + '"></iframe>');
	else
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

function sendCrossDomainPostRequest(url, params, callback)
{
	var form,
		rnd = String(Math.random()),
		id = '$$iframe_' + url + rnd;

	var userAgent = navigator.userAgent.toLowerCase(),
		iframe = createPostIframe(id, callback);
	
	if (/msie/.test(userAgent) && !/opera/.test(userAgent))
		form = document.createElement('<form id=' + id + '" enctype="multipart/form-data" style="display:none" target="' + id + '" action="' + url + '" method="post"></form>');
	else
	{
		form = document.createElement("form");
		form.style.display = 'none';
		form.setAttribute('enctype', 'multipart/form-data');
		form.target = id;
		form.setAttribute('method', 'POST');
		form.setAttribute('action', url);
		form.id = id;
	}
	
	for (var paramName in params)
	{
		var input = document.createElement("input");
		
		input.setAttribute('type', 'hidden');
		input.setAttribute('name', paramName);
		input.setAttribute('value', params[paramName]);
		
		form.appendChild(input)
	}
	
	document.body.appendChild(form);
	document.body.appendChild(iframe);
	
	form.submit();
	
	form.parentNode.removeChild(form);
}

function login(reloadAfterLoginFlag)
{
	if ($$('loginCanvas'))
		return;
		
	var isMapsSite = typeof mapsSite != 'undefined' && mapsSite;
	var dialogHeight = isMapsSite ? 180 : 135;
	
	var loginInput = _input(null, [['dir','className','inputStyle'],['css','width','160px']]),
		passwordInput = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','type','password']]),
		regLink = makeLinkButton(_gtxt("Регистрация")),
		retriveLink = makeLinkButton(_gtxt("Восстановление пароля")),
		loginButton = makeButton(_gtxt("Вход")),
		canvas = _div([_div([_span([_t(_gtxt("Логин"))]), _br(), loginInput, _br(),
					   _span([_t(_gtxt("Пароль"))]), _br(), passwordInput, _br()],[['css','textAlign','center']]),
					   _div([loginButton],[['css','textAlign','center'],['css','margin','5px']])],[['attr','id','loginCanvas']]),
		failureHandler = function()
		{
			jQuery(loginInput).addClass('error');
			jQuery(passwordInput).addClass('error');
			
			loginInput.focus();
			
			setTimeout(function()
				{
					jQuery(loginInput).removeClass('error');
					jQuery(passwordInput).removeClass('error');
				}, 2000)
		},
		checkLoginHandler = function(response)
		{
			if (response.Status == 'ok' && response.Result)
			{
				jQuery(canvas.parentNode).dialog("destroy")
				canvas.parentNode.removeNode(true);
				
				if (reloadAfterLoginFlag)
					window.location.reload();
				else
					reloadMap();
			}
			else
				failureHandler();
		},
		checkLogin = function()
		{
			var login = loginInput.value;
			sendCrossDomainJSONRequest(serverBase + "Login.ashx?WrapStyle=func&login=" + loginInput.value + "&pass=" + passwordInput.value, checkLoginHandler);
			
			loginInput.value = '';
			passwordInput.value = '';
		};
	
	//if (typeof localSite == 'undefined' || !localSite)
	if (typeof mapsSite != 'undefined' && mapsSite)
	{
		_(canvas, [regLink, _br(), retriveLink]);
	}
	
	showDialog(_gtxt("Пожалуйста, авторизуйтесь"), canvas, 200, dialogHeight, false, false);
	canvas.parentNode.style.overflow = 'hidden';	
	
	loginInput.focus();
	
	loginButton.onclick = function()
	{
		checkLogin();
	}
	regLink.onclick = function()
	{
		window.open('http://account.kosmosnimki.ru/Registration.aspx', '_blank')
	}
	retriveLink.onclick = function()
	{
		window.open('http://account.kosmosnimki.ru/Retrive.aspx', '_blank')
	}
	
	passwordInput.onkeyup = function(e)
	{
		var evt = e || window.event;
	  	if (getkey(evt) == 13) 
	  	{	
			checkLogin();
	  		
	  		return false;
	  	}
	  	
	  	return true;
	}
}

function logout()
{
	window.userInfo = function(){return {Login: false}};

	sendCrossDomainJSONRequest(serverBase + "Logout.ashx?WrapStyle=func&WithoutRedirection=1", function(response)
	{
		if (!parseResponse(response))
			return;
		
		if (globalFlashMap)
			reloadMap();
		else
			window.location.replace(window.location.href.split("?")[0] + (defaultMapID == globalMapName ? "" : ("&" + globalMapName)));
	});
}

function reloadMap()
{
	// сохраняем состояние карты и перезагружаем ее
	var mapState = _mapHelper.getMapState();
	
	// туда же сохраним созданные объекты
	_userObjects.collect();
	mapState.userObjects = JSON.stringify(_userObjects.data);
	
	sendCrossDomainPostRequest(serverBase + "TinyReference/Create.ashx",
						{
							WrapStyle: 'window',
							content: JSON.stringify(mapState)
						}, 
						function(response)
						{
							if (!parseResponse(response))
								return;
							
							var id = response.Result;
							
							createCookie("TempPermalink", id);
							
							window.location.replace(window.location.href.split("?")[0] + "?permalink=" + id + (defaultMapID == globalMapName ? "" : ("&" + globalMapName)));
						})
}

function parseResponse(response)
{
	if (response.Status == 'ok')
		return true
	else if (response.Status == 'auth')
	{
		if ( nsMapCommon.AuthorizationManager.isAccounts() )
		{
			showErrorMessage(_gtxt("Недостаточно прав для совершения операции"), true)
		}
		else
		{
			_menuUp.addLogin();
			removeChilds($$('user'));
			login();
		}
		
		return false;
	}
	else if (response.Status == 'error')
	{
		var canvas = _div([_div([_t([String(response.ErrorInfo.ErrorMessage)])],[['css','color','red']])]),
			textarea = false,
			resize = function()
			{
				if (textarea)
					textarea.style.height = textarea.parentNode.parentNode.offsetHeight - canvas.firstChild.offsetHeight - 6 + 'px';
			}
		
		if (typeof response.ErrorInfo.ExceptionType != 'undefined' && response.ErrorInfo.ExceptionType != '' && response.ErrorInfo.StackTrace != null)
		{
			textarea = _textarea(null,[['dir','className','inputStyle error'],['css','width','100%'],['css','padding','0px'],['css','margin','0px'],['css','border','none']]);
			
			textarea.value = response.ErrorInfo.StackTrace;
			_(canvas, [textarea]);
		}
		
		showDialog(_gtxt("Ошибка сервера"), canvas, 220, 170, false, false, resize)
		
		if (typeof response.ErrorInfo.ExceptionType != 'undefined' && response.ErrorInfo.ExceptionType != '' && response.ErrorInfo.StackTrace != null)
			resize();
			
		canvas.parentNode.style.overflow = 'hidden';	
		
		return false;
	}
}

function addUserActions()
{
	if ( !nsMapCommon.AuthorizationManager.isAccounts() )
	{
		_queryMapLayers.addUserActions();
		
		if (_queryMapLayers.currentMapRights() == "edit")
			_iconPanel.addUserActions();
		
		if (!nsMapCommon.AuthorizationManager.canDoAction(nsMapCommon.AuthorizationManager.ACTION_CREATE_LAYERS))
		{
			_iconPanel.setVisible('createRasterLayer', false);
			_iconPanel.setVisible('createVectorLayer', false);
		}
	}
}
function removeUserActions()
{
	_queryMapLayers.removeUserActions();
	
	_iconPanel.removeUserActions();
}

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

function disableSelection(target)
{
	if (typeof target.onselectstart != "undefined")
	    target.onselectstart = function(){return false}
	else if (typeof target.style.MozUserSelect != "undefined")
	    target.style.MozUserSelect = "none"
	else 
	    target.onmousedown = function(){return false}
}

// Показывает контектное меню для конкретного элемента. 
// В Opera меню показывается при наведении на элемент в течении некоторого времени, во всех остальных браузерах - по правому клику.
// Меню исчезает при потери фокуса
// Параметры:
// * elem {DOMElement} - элемент, на который навешивается меню
// * menu {DOMElement} - собственно меню
// * checkFunc {Function, checkFunc()->Bool} - если возвращает false, то ничего не показывается...
// * suggestTimeout {float} - задержка в мс перед показом меню в Opera
function _context(elem, menu, checkFunc, suggestTimeout)
{
	if (jQuery.browser.opera)
	{
		elem.onmouseover = function()
		{
			if (typeof checkFunc !== 'undefined' && !checkFunc())
				return;
			
			this.timer = setTimeout(function()
			{
				elem.timer = null;
				
				menu.style.top = elem.offsetHeight + 'px';
				
				jQuery(menu).fadeIn(500);
				
				elem.style.backgroundColor = '#DAEAF3';
			}, suggestTimeout)
		}
		
		elem.onmouseout = function(e)
		{
			if (typeof checkFunc !== 'undefined' && !checkFunc())
				return;
			
			if (this.timer)
				clearTimeout(this.timer);

			var evt = e || window.event,
				target = evt.srcElement || evt.target,
				relTarget = evt.relatedTarget || evt.toElement;
			
			while (relTarget)
			{
				if (relTarget == elem)
					return;
				relTarget = relTarget.parentNode;
			}
			
			elem.style.backgroundColor = '';

			jQuery(menu).fadeOut(500);
		}
		
		_(elem, [menu]);
	}
	else
	{
		elem.oncontextmenu = function(e)
		{
			if (typeof checkFunc != 'undefined')
			{
				if (!checkFunc())
					return false;
			}
			
			var contextMenu = _div([menu],[['dir','className','contextMenu'], ['attr','id','contextMenuCanvas']])
			
			var evt = e || window.event;
			
			hidden(contextMenu);
			_(document.body, [contextMenu])
			
			// определение координат курсора для ie
			if (evt.pageX == null && evt.clientX != null )
			{
				var html = document.documentElement
				var body = document.body
				
				evt.pageX = evt.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html.clientLeft || 0)
				evt.pageY = evt.clientY + (html && html.scrollTop || body && body.scrollTop || 0) - (html.clientTop || 0)
			}
			
			if (evt.pageX + contextMenu.clientWidth < getWindowWidth())
				contextMenu.style.left = evt.pageX - 5 + 'px';
			else
				contextMenu.style.left = evt.pageX - contextMenu.clientWidth + 5 + 'px';
			
			if (evt.pageY + contextMenu.clientHeight < getWindowHeight())
				contextMenu.style.top = evt.pageY - 5 + 'px';
			else
				contextMenu.style.top = evt.pageY - contextMenu.clientHeight + 5 + 'px';
			
			visible(contextMenu)
			
			var menuArea = contextMenu.getBoundingClientRect();
			
			contextMenu.onmouseout = function(e)
			{
				var evt = e || window.event;
				
				// определение координат курсора для ie
				if (evt.pageX == null && evt.clientX != null )
				{
					var html = document.documentElement
					var body = document.body
					
					evt.pageX = evt.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html.clientLeft || 0)
					evt.pageY = evt.clientY + (html && html.scrollTop || body && body.scrollTop || 0) - (html.clientTop || 0)
				}
				
				if (evt.pageX <= menuArea.left || evt.pageX >= menuArea.right ||
					evt.clientY <= menuArea.top || evt.clientY >= menuArea.bottom)
					contextMenu.removeNode(true)
			}
			
			return false;
		}
	}
}

function _contextClose()
{
	if ($$('contextMenuCanvas'))
		$$('contextMenuCanvas').removeNode(true)
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

function stringDateTime(msec)
{
	var date = new Date(msec);
		excHour = date.getHours(),
		excMin = date.getMinutes(),
		excSec = date.getSeconds();
	
	return stringDate(msec) + ' ' +  (excHour < 10 ? '0' + excHour : excHour) + ':' + (excMin < 10 ? '0' + excMin : excMin) + ':' + (excSec < 10 ? '0' + excSec : excSec);
}

function inputError(input)
{
	jQuery(input).addClass('error');
	
	setTimeout(function()
	{
		if (input)
			jQuery(input).removeClass('error');
	}, 1000)
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

function addUserName()
{
	if ( typeof window.gmxViewerUI != 'undefined' &&  window.gmxViewerUI.hideLogin ) return;
	
	removeChilds($$('user'));
	
	var span = _span([_t(userInfo().Login)], [['css','cursor','pointer']]);
	
	span.onclick = function()
	{
		if ( nsMapCommon.AuthorizationManager.isAccounts() )
			window.open('http://account.kosmosnimki.ru/ChangePassword.aspx', '_blank');
		else
			changePassword();
	}
	
	_title(span, _gtxt("Изменение пароля"))
	
	_($$('user'), [span])
}

function changePassword()
{
	if ($$('changePasswordCanvas'))
		return;
	
	var oldInput = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','type','password']]),
		newInput = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','type','password']]),
		confirmInput = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','type','password']]),
		changeButton = makeButton(_gtxt("Изменить")),
		canvas = _div([_div([_span([_t(_gtxt("Старый пароль"))]), _br(), oldInput, _br(),
					   		_span([_t(_gtxt("Новый пароль"))]), _br(), newInput, _br(),
							_span([_t(_gtxt("Подтвердите пароль"))]), _br(), confirmInput, _br()],[['css','textAlign','center']]),
					   _div([changeButton],[['css','textAlign','center'],['css','margin','5px']])],[['attr','id','changePasswordCanvas']]),
		failureHandler = function()
		{
			jQuery(newInput).addClass('error');
			jQuery(confirmInput).addClass('error');
			
			newInput.focus();
			
			setTimeout(function()
				{
					jQuery(newInput).removeClass('error');
					jQuery(confirmInput).removeClass('error');
				}, 2000)
		},
		checkPasswHandler = function(response)
		{
			if (response.Status == 'ok' && response.Result)
			{
				jQuery(canvas.parentNode).dialog("destroy")
				canvas.parentNode.removeNode(true);
				
				_layersTree.showSaveStatus($$('headerLinks'));
			}
			else
			{
				if (response.ErrorInfo && typeof response.ErrorInfo.ErrorMessage != 'undefined')
					showErrorMessage(response.ErrorInfo.ErrorMessage, true)
			}
		},
		checkPassw = function()
		{
			if (newInput.value != confirmInput.value)
			{
				newInput.value = '';
				confirmInput.value = '';
				
				failureHandler();
				
				return;
			}
			
			sendCrossDomainJSONRequest(serverBase + "ChangePassword.ashx?WrapStyle=func&old=" + oldInput.value + "&new=" + newInput.value, checkPasswHandler);
			
			oldInput.value = '';
			newInput.value = '';
			confirmInput.value = '';
		};
	
	showDialog(_gtxt("Изменение пароля"), canvas, 200, 180, false, false);
	canvas.parentNode.style.overflow = 'hidden';	
	
	oldInput.focus();
	
	changeButton.onclick = function()
	{
		checkPassw();
	}
	
	confirmInput.onkeyup = function(e)
	{
		var evt = e || window.event;
	  	if (getkey(evt) == 13) 
	  	{	
			checkPassw();
	  		
	  		return false;
	  	}
	  	
	  	return true;
	}
}