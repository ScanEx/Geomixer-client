var UpMenu = function()
{
    
    this.submenus = {};
	this.level2 = [];
	this.level3 = [];
	this.currSel = null;
	this.currUnSel = null;
	this.refs = {};
    
	this.parent = null;
    this.loginContainer = null;
    this._isCreated = false;
};

UpMenu.prototype.addItem = function(elem)
{
	if (!this.submenus[elem.id])
	{
		this.submenus[elem.id] = new Object();
		this.submenus[elem.id].title = elem.title;
	}
	
	if (elem.childs)
	{
		this.submenus[elem.id].childs = new Array();

		for (var i = 0; i < elem.childs.length; i++)
			this.submenus[elem.id].childs.push(elem.childs[i]);
	}
	
	if (elem.func)
		this.submenus[elem.id].func = elem.func;
	if (elem.onsel)
		this.submenus[elem.id].onsel = elem.onsel;
	if (elem.onunsel)
		this.submenus[elem.id].onunsel = elem.onunsel;
        
    if (this._isCreated)
        this.draw();
}

UpMenu.prototype.addChildItem = function(newElem, parentID)
{
    var _this = this;
	//предполагает, что если callback возвращает true, то итерирование можно прекратить
	var _iterateMenus = function( elem, callback )
	{
		if (typeof elem.childs === 'undefined')
			return;
			
		for (var i = 0; i < elem.childs.length; i++)
		{
			if (callback(elem.childs[i], elem.childs[i].id) )
				return true;
				
			if (_iterateMenus(elem.childs[i], callback) )
				return true;
		}
	}
	
	var _callback = function(elem, id)
	{
		if (id === parentID)
		{
			if (!elem.childs) elem.childs = [];
			elem.childs.push(newElem);
            
            if (_this._isCreated)
                _this.draw();
                
			return true;
		}
	}
	
	for (var m in this.submenus)
	{
		_callback(this.submenus[m], m);
		_iterateMenus(this.submenus[m], _callback);
	}
}

//UpMenu.prototype = new Menu();

UpMenu.prototype.setParent = function(elem)
{
	this.parent = elem;
	
	if (elem)
    {
		removeChilds(elem);
        _(elem, [_span()]);
    }
	
	this.disabledTabs = {};
}

// Показывает элемент меню
UpMenu.prototype.showmenu = function(elem)
{
	elem.style.visibility = 'visible';
}
// Скрывает элемент меню
UpMenu.prototype.hidemenu = function(elem)
{
	elem.style.visibility = 'hidden';
}
// Основная функция  - рисует меню по заданной структуре
UpMenu.prototype.draw = function()
{
	var ul = _ul();
	ul.className = 'header1';
	var lis = [];
	
	for (var menuId in this.submenus)
	{
		var li;
		
		if (this.submenus[menuId].childs)
		{
			var ul2 = _ul(),
				lis2 = [];

			ul2.className = 'header2';
			ul2.id = menuId;
			
			for (var i = 0; i < this.submenus[menuId].childs.length; i++)
			{
				var lev2 = this.makeLevel2(this.submenus[menuId].childs[i]),
					div = lev2.div,
					menu2Id = this.submenus[menuId].childs[i].id;
				
				// Если есть подменю 3го уровня
				if (lev2.ul)
				{
					var li = _li([div, lev2.ul],[['dir','className','header2']]);
					li.setAttribute('hash', menu2Id);
					
					this.attachEventOnMouseover(li, 'menu2Active', 3);
					this.attachEventOnMouseout(li, 'menu2Active', 3);
					
					lis2.push(li);
				}
				// Если нет подменю 3го уровня
				else
				{
					var li = _li([div],[['dir','className','header2'],['css','cursor','pointer']]);
					li.setAttribute('hash', menu2Id);
					
					if (!this.submenus[menuId].childs[i].disabled)
						attachEffects(li, 'menu2Active');
					else
						div.style.cursor = 'default';
					
					lis2.push(li);
				}
			}
			
			_(ul2, lis2);
			
			var div = _div([_t(this.submenus[menuId].title)],[['dir','className','header1']]);
			
			li = _li([div, ul2],[['dir','className','header1']]);
			
			// Запоминаем id для открывания/закрывания меню
			li.setAttribute('hash', menuId);
		}
		else
		{
			var div = _div([_t(this.submenus[menuId].title)],[['dir','className','header1']]);
			
			div.style.cursor = 'pointer';
			
			this.attachEventOnMouseclick(div, menuId);
			
			// Опредеяем действия по загрузке/выгрузке этого элемента меню
			if (this.submenus[menuId].func)
				this.refs[menuId] = {func:this.submenus[menuId].func};
			else	
				this.refs[menuId] = {onsel:this.submenus[menuId].onsel, onunsel:this.submenus[menuId].onunsel};
			
			li = _li([div],[['dir','className','header1']]);
		}
		
		this.attachEventOnMouseover(li, 'menuActive', 2);
		this.attachEventOnMouseout(li, 'menuActive', 2);
		
		lis.push(li);
	}
	
	_(ul, lis);
    removeChilds(this.parent.firstChild);
	_(this.parent.firstChild, [ul]);
    
    this._isCreated = true;
}
// Создает элемент меню 2го уровня
UpMenu.prototype.makeLevel2 = function(elem)
{
	var div = _div([_t(elem.title)],[['dir','className','header2']]);
	
	if ($.browser.msie)
		div.style.height = '100%';

	// Меню на этом уровне
	var names = [];
	
	// Если есть подменю 3го уровня
	if (elem.childs)
	{
		// Имя меню и стрелочка >
		_(div, [_div(null,[['dir','className','menuMarkerRight']])])
		
		var lis2 = [],
			ul2 = _ul();
		ul2.className = 'header3';
		ul2.id = elem.id;
		
		if ($.browser.msie)
			ul2.style.marginTop = '-26px';

		for (var i = 0; i < elem.childs.length; i++)
		{
			// Формируем сслыку для перехода на этот элемент меню
			var div2 = _div([_t(elem.childs[i].title)],[['dir','className','header3'],['css','cursor','pointer']]),
				li = _li([div2],[['dir','className','header3']]);
			
			if ($.browser.msie)
				div2.style.height = '100%';
			
			li.setAttribute('hash', elem.childs[i].id);
			
			if (elem.childs[i].disabled)
			{
				$(div2).addClass("menuDisabled");
				
				div2.style.cursor = 'default';
			}
			else
			{
				this.attachEventOnMouseclick(div2, elem.childs[i].id);
				div.onmouseout = div.onmouseover = null;
				attachEffects(li, 'menu3Active');

				// Опредеяем действия по загрузке/выгрузке этого элемента меню
				if (elem.childs[i].func)
					this.refs[elem.childs[i].id] = {func:elem.childs[i].func};
				else	
					this.refs[elem.childs[i].id] = {onsel:elem.childs[i].onsel, onunsel:elem.childs[i].onunsel};
			}
			
			if (elem.childs[i].style)
				_(div, null, elem.childs[i].style);

			lis2.push(li);
		}
		
		_(ul2, lis2);

		return {'div': div, 'ul': ul2};
	}
	// Если нет подменю 3го уровня
	else
	{
		if (elem.disabled)
			$(div).addClass("menuDisabled");
		else
		{
			this.attachEventOnMouseclick(div, elem.id);
			_(div,null,[['css','cursor','pointer']]);

			// Опредеяем действия по загрузке/выгрузке этого элемента меню
			if (elem.func)
				this.refs[elem.id] = {func:elem.func};
			else
				this.refs[elem.id] = {onsel:elem.onsel, onunsel:elem.onunsel};
		}
		
		if (elem.style)
			_(div, null, elem.style);

		return {'div': div};
	}
}
UpMenu.prototype.removeSelections = function(id)
{
	$('li.menu3Active').removeClass('menu3Active');
	$('li.menu2Active').removeClass('menu2Active');
	$('li.menuActive').removeClass('menuActive');
}
// Закрывает открытые меню
UpMenu.prototype.hideMenus = function()
{
	var _this = this;
	
	$('ul.header2').each(function()
	{
		_this.hidemenu(this);
	})
	$('ul.header3').each(function()
	{
		_this.hidemenu(this);
	})
}
// Открывает закладку
UpMenu.prototype.openRef = function(hash)
{
	_menuUp.removeSelections();
	_menuUp.hideMenus();
	_tab_hash.setHash(hash);
}

UpMenu.prototype.openFunc = function(func)
{
	_menuUp.removeSelections();
	_menuUp.hideMenus();
	
	func();
}

UpMenu.prototype.attachEventOnMouseover = function(elem, className, menu)
{
	var _this = this;
	elem.onmouseover = function(e)
	{
		$(this).addClass(className);
		
		if ($$(this.getAttribute('hash')))
			_this.showmenu($$(this.getAttribute('hash')));
	}
}
UpMenu.prototype.attachEventOnMouseout = function(elem, className, menu)
{
	var _this = this;
	elem.onmouseout = function(e)
	{
		var evt = e || window.event,
			target = evt.srcElement || evt.target,
			relTarget = evt.relatedTarget || evt.toElement,
			elem = this;
		
		try
		{
			while (relTarget)
			{
				if (relTarget == elem)
				{
					stopEvent(e);
					
					return false;
				}
				relTarget = relTarget.parentNode;
			}
			
			$(elem).removeClass(className)
			
			if ($$(elem.getAttribute('hash')))
				_this.hidemenu($$(elem.getAttribute('hash')));
		}
		catch (e)
		{
			$(elem).removeClass(className)
				
			if ($$(elem.getAttribute('hash')))
				_this.hidemenu($$(elem.getAttribute('hash')));
		}
	}
}
UpMenu.prototype.attachEventOnMouseclick = function(elem, id)
{
	var _this = this;
	
	elem.onclick = function()
	{
		if (_this.refs[id].func)
			_menuUp.openFunc(_this.refs[id].func);
		else if (id == _tab_hash.recentHash && $$('left_' + id) && $$('left_' + id).style.display == 'none')
		{
			_menuUp.removeSelections();
			_menuUp.hideMenus();
			_tab_hash.openTab();
		}
		else 
			_menuUp.openRef(id);
	}
}
// Показывает путь в меню к текущему элементу
UpMenu.prototype.showNavigatePath = function(path)
{
	var tds = [];
	
	for (var menuId in this.submenus)
	{
		if (path == menuId)
		{
			tds.push(_td([_t(this.submenus[menuId].title)],[['dir','className','menuNavigateCurrent']]));
			
			return tds;
		}
		else if (this.submenus[menuId].childs)
		{
			var childsLevel2 = this.submenus[menuId].childs;
			for (var i = 0; i < childsLevel2.length; i++)
			{
				
				if (childsLevel2[i].childs)
				{
					var childsLevel3 = childsLevel2[i].childs;
					// есть подменю, смотрим там
					for(var j = 0; j < childsLevel3.length; j++)
					{
						if (path == childsLevel3[j].id) 
						{
						//	tds.push(_td([reload]));
							tds.push(_td([_t(this.submenus[menuId].title)], [['css','color','#153069'],['css','fontSize','12px'],['css','fontFamily','tahoma']]));
							tds.push(_td([_div(null,[['dir','className','markerRight']])], [['attr','vAlign','top']]));
							tds.push(_td([_t(childsLevel2[i].title)], [['css','color','#153069'],['css','fontSize','12px'],['css','fontFamily','tahoma']]));
							tds.push(_td([_div(null,[['dir','className','markerRight']])], [['attr','vAlign','top']]));
							tds.push(_td([_t(childsLevel3[j].title)],[['dir','className','menuNavigateCurrent']]));
							break;
						}
					}
				}
				if (path == childsLevel2[i].id)
				{
					// совпадение в меню 2го уровня
					tds.push(_td([_t(this.submenus[menuId].title)], [['css','color','#153069'],['css','fontSize','12px'],['css','fontFamily','tahoma']]));
					tds.push(_td([_div(null,[['css','width', '10px'],['dir','className','markerRight']])], [['attr','vAlign','top']]));
					tds.push(_td([_t(childsLevel2[i].title)],[['dir','className','menuNavigateCurrent']]));
				}
			}
		}
	}

	return tds;
}

UpMenu.prototype.enableMenus = function()
{
	for (var name in this.disabledTabs)
	{
		$(this.parent).find("li[hash='" + name + "']").children('div').css('display','');
		
		delete this.disabledTabs[name];
	}
}

UpMenu.prototype.disableMenus = function(arr)
{
	for (var i = 0; i < arr.length; i++)
	{
		$(this.parent).find("li[hash='" + arr[i] + "']").children('div').css('display','none');
		
		this.disabledTabs[arr[i]] = true;
	}
}

UpMenu.prototype.checkView = function()
{
	if (!nsGmx.AuthManager.isLogin())
	{
		this.enableMenus();
		
		this.disableMenus(['mapCreate', 'mapSave', 'mapSaveAs', 'layersMenu', 'pictureBinding']);
	}
	else if (_queryMapLayers.currentMapRights() != "edit")
	{
		this.enableMenus();
		
		this.disableMenus(['mapSave', 'mapSaveAs', 'layersVector', 'layersRaster', 'layersMultiRaster']);
	}
	else
	{
		var openFlag = _menuUp.disabledTabs[_tab_hash.recentHash];
		
		this.enableMenus();

		if (openFlag)
			_tab_hash.openTab();
	}
	
	if (!nsGmx.AuthManager.canDoAction(nsGmx.ACTION_CREATE_LAYERS))
	{
            this.disableMenus(['layersVector', 'layersRaster', 'layersMultiRaster']);
	}
}

UpMenu.prototype.addLoginCanvas = function()
{
	this.loginContainer = _li(null, [['dir','className','loginCanvas']]);
	_(this.parent, [this.loginContainer]);
}

UpMenu.prototype.go = function(reloadAfterLoginFlag)
{
	this.setParent($$('menu'));
	
	this.createMenu();
		
	this.draw();
	
	this.checkView();
	
	this.addLoginCanvas();
	
	if (!window.location.hash)
	{
	}
	else
	{
//		window.location.hash = ''
		
		this.currUnsel = function(){};
	}
	
	_tab_hash.loadTabs();
	_tab_hash.openTab();
}

var _menuUp = new UpMenu();

var TabHash = function()
{
	// текущее значение
	this.recentHash = "";
	// вспомогательный ифрйем для ие
	this.tempFrame = null;
	
	this.defaultHash = 'layers';
}

TabHash.prototype.setHash = function(str)
{
	window.location.replace("#" + str);
}

TabHash.prototype.loadTabs = function() 
{
	var temp = (!window.location.hash || window.location.hash == '#') ? this.defaultHash : window.location.hash.replace(/^#/,'');

	this.recentHash = temp;
	setInterval(this.pollHash, 100);
}

TabHash.prototype.unloadTabs = function()
{
	window.clearInterval(this.pollHash)
}
// Открывает закладку по содержимому в hash
TabHash.prototype.openTab = function()
{
	var path = this.recentHash;
	
	if (_menuUp.disabledTabs[path])
	{
		return;
	}
	
	if (_menuUp.currUnsel) 
		_menuUp.currUnsel();
	
	if (!_menuUp.refs[path]) 
		return;
	
	var sel = _menuUp.refs[path].onsel,
		unsel = _menuUp.refs[path].onunsel;
	
	_menuUp.currUnsel = unsel;

	sel && sel.call(this, path);
}
 
TabHash.prototype.pollHash = function() 
{
	document.title = window.shownTitle;
	
	if (window.location.hash == '')
		return;
	
	var temp = window.location.hash.replace(/^#/,'');
	if (temp == _tab_hash.recentHash) 
		return; 

	_tab_hash.recentHash = temp;
	
	_tab_hash.openTab();
}

var _tab_hash = new TabHash();


// содержит ссылку на рабочую область для текущей вкладки
var leftMenu = function()
{
	this.workCanvas = null;
	this.parentWorkCanvas = null;
}

leftMenu.prototype.createWorkCanvas = function(canvasID, closeFunc)
{
	if (!$$('left_' + canvasID))
	{
		this.parentWorkCanvas = _div(null, [['attr', 'id','left_' + canvasID],['css','padding','0px'],['css','width','360'],['dir','className','left_' + canvasID]]);
		this.workCanvas = _div(null, [['dir','className','workCanvas']]);
		
		var toggleButton = makeImageButton('img/menuDown.png', 'img/menuDown_a.png'),
			_this = this;
			
		toggleButton.onclick = function()
		{
			if (_this.workCanvas.style.display != 'none')
			{
				_this.workCanvas.style.display = 'none';
				
				this.setAttribute('src', 'img/menuRight.png');
				this.onmouseover = function()
				{
					this.setAttribute('src', 'img/menuRight_a.png');
				}
				this.onmouseout = function()
				{
					this.setAttribute('src', 'img/menuRight.png');
				}
			}
			else
			{
				_this.workCanvas.style.display = '';
				
				this.setAttribute('src', 'img/menuDown.png');
				this.onmouseover = function()
				{
					this.setAttribute('src', 'img/menuDown_a.png');
				}
				this.onmouseout = function()
				{
					this.setAttribute('src', 'img/menuDown.png');
				}
			}	
		}
		
		toggleButton.className = 'floatLeft';
		toggleButton.style.margin = '4px 2px 0px 5px';
		toggleButton.style.border = '1px solid transparent';
		
		var navigatePath = _menuUp.showNavigatePath(canvasID);
		
		var closeButton = makeImageButton('img/close.png', 'img/close_orange.png');
		closeButton.onclick = function()
		{
			hide($$('left_' + canvasID));
			
			closeFunc && closeFunc();
		}
		
		closeButton.className = 'floatRight';
		closeButton.style.margin = '2px 18px 0px 3px';
		closeButton.style.border = '1px solid transparent';
		
		_(this.parentWorkCanvas, [_div([toggleButton, _table([_tbody([_tr(navigatePath)])],[['css','color','#293D6B'],['css','margin','4px 0px 1px 0px']]), closeButton],[['dir','className','leftTitle']]),
								  this.workCanvas
								  ]);
		
		if ($$('leftContent').childNodes.length == 0)
			_($$('leftContent'), [this.parentWorkCanvas]);
		else
			$$('leftContent').insertBefore(this.parentWorkCanvas, $$('leftContent').firstChild);
		
		return false;
	}
	else
	{
		this.parentWorkCanvas = $$('left_' + canvasID);
		this.workCanvas = this.parentWorkCanvas.lastChild;
		
		show(this.parentWorkCanvas)
		
		if (this.parentWorkCanvas.parentNode.childNodes.length > 0)
			this.parentWorkCanvas.parentNode.insertBefore(this.parentWorkCanvas, this.parentWorkCanvas.parentNode.firstChild);
			
		return true;
	}
}