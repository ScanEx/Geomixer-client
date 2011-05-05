var Menu = function()
{
	this.submenus = {};
	this.level2 = [];
	this.level3 = [];
	this.currSel = null;
	this.currUnSel = null;
	this.refs = {};
}

Menu.prototype.addItem = function(elem)
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
}

var UpMenu = function()
{
	this.parent = null;
};

UpMenu.prototype = new Menu();

UpMenu.prototype.setParent = function(elem)
{
	this.parent = elem;
	
	if (elem)
		removeChilds(elem);
	
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
			
			var divLeft = _div(null,[['dir','className','buttonLeft']]),
				divRight = _div(null,[['dir','className','buttonRight']]),
				div = _div([_t(this.submenus[menuId].title)],[['dir','className','header1']]);
			
		//	li = _li([_table([_tbody([_tr([_td([divLeft]),_td([div]),_td([divRight])])])]), ul2],[['dir','className','header1']]);
			li = _li([div, ul2],[['dir','className','header1']]);
			
			// Запоминаем id для открывания/закрывания меню
			li.setAttribute('hash', menuId);
		}
		else
		{
			var divLeft = _div(null,[['dir','className','buttonLeft']]),
				divRight = _div(null,[['dir','className','buttonRight']]),
				div = _div([_t(this.submenus[menuId].title)],[['dir','className','header1']]);
			
			div.style.cursor = 'pointer';
			
			this.attachEventOnMouseclick(div, menuId);
			
			// Опредеяем действия по загрузке/выгрузке этого элемента меню
			if (this.submenus[menuId].func)
				this.refs[menuId] = {func:this.submenus[menuId].func};
			else	
				this.refs[menuId] = {onsel:this.submenus[menuId].onsel, onunsel:this.submenus[menuId].onunsel};
			
		//	li = _li([_table([_tbody([_tr([_td([divLeft]),_td([div]),_td([divRight])])])])],[['dir','className','header1']]);
			li = _li([div],[['dir','className','header1']]);
		}
		
		this.attachEventOnMouseover(li, 'menuActive', 2);
		this.attachEventOnMouseout(li, 'menuActive', 2);
		
		lis.push(li);
	}
	
	_(ul, lis);
	_(this.parent, [ul]);
	
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
	if (!nsMapCommon.AuthorizationManager.isLogin())// || userInfo().Role == 'Accounts')
	{
		this.enableMenus();
		
		this.disableMenus(['mapCreate', 'mapSave', 'mapSaveAs', 'layersMenu', 'pictureBinding', 'kml']);
	}
	else if (/*userInfo().Login && */_queryMapLayers.currentMapRights() != "edit")
	{
		this.enableMenus();
		
		this.disableMenus(['mapSave', 'mapSaveAs', 'layersVector', 'layersRaster']);
	}
	else
	{
		var openFlag = _menuUp.disabledTabs[_tab_hash.recentHash];
		
		this.enableMenus();

		if (openFlag)
			_tab_hash.openTab();
	}
	
	if (!nsMapCommon.AuthorizationManager.canDoAction(nsMapCommon.AuthorizationManager.ACTION_CREATE_LAYERS))
	{
		this.disableMenus(['layersVector', 'layersRaster']);
	}
}

UpMenu.prototype.addLoginCanvas = function()
{
	var li = _li([_div(null, [['attr','id','user'],['dir','className','user']]),_div(null, [['attr','id','log'],['dir','className','log']])],[['dir','className','loginCanvas']]);
	
	_(this.parent.firstChild, [li]);
}
UpMenu.prototype.addSearchCanvas = function()
{
	var li = _li(null,[['dir','className','searchCanvas'],['attr','id','searchCanvas']]);
	
	_(this.parent.firstChild, [li]);
}

UpMenu.prototype.addLogin = function(reloadAfterLoginFlag)
{
	if ( typeof window.gmxViewerUI != 'undefined' &&  window.gmxViewerUI.hideLogin ) return;
	
	removeChilds($$('log'));
	
	var span = makeLinkButton(_gtxt('Вход'))
	
	span.onclick = function()
	{
		login(reloadAfterLoginFlag);
	}
	
	_($$('log'), [span])
}

UpMenu.prototype.addLogout = function()
{
	if ( typeof window.gmxViewerUI != 'undefined' &&  window.gmxViewerUI.hideLogin ) return;

	removeChilds($$('log'));
	
	var span = makeLinkButton(_gtxt('Выход'));
	
	span.onclick = function()
	{
		logout();
	}
	
	_($$('log'), [span])
}

UpMenu.prototype.go = function(reloadAfterLoginFlag)
{
	this.setParent($$('menu'));
	
	this.createMenu();
		
	this.draw();
	
	this.checkView();
	
	this.addLoginCanvas();

	this.addLogin(reloadAfterLoginFlag);
	
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

var scrollTable = function()
{
	this.limit = 50;
	this.pagesCount = 10;
	
	this.start = 0;
	this.reportStart = 0;
	this.allPages = 0;
	this.vals = [];
	
	this.drawFunc = null;
	
	 // Переход на предыдущую страницу
	this.next = function(vals)
	{
		var _this = this,
			button = makeImageButton('img/next.png', 'img/next_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start += _this.pagesCount;
			_this.reportStart = _this.start * _this.limit;

			_this.drawPagesRow(vals);
			
			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}
		
		_title(button, _gtxt('Следующие [value0] страниц', _this.pagesCount));

		return button;
	}
	
	// Переход на следующую страницу
	this.previous = function(vals)
	{
		var _this = this,
			button = makeImageButton('img/prev.png', 'img/prev_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start -= _this.pagesCount;
			_this.reportStart = _this.start * _this.limit;

			_this.drawPagesRow(vals);

			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}							
		
		_title(button, _gtxt('Предыдущие [value0] страниц', _this.pagesCount));

		return button;
	}
	
	// Переход на первую страницу
	this.first = function(vals)
	{
		var _this = this,
			button = makeImageButton('img/first.png', 'img/first_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start = 0;
			_this.reportStart = _this.start * _this.limit;

			_this.drawPagesRow(vals);

			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}
		
		_title(button, _gtxt('Первая страница'));

		return button;
	}
	
	// Переход на последнюю страницу
	this.last = function(vals)
	{
		var _this = this,
			button = makeImageButton('img/last.png', 'img/last_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start = Math.floor(_this.vals.length / (_this.pagesCount * _this.limit)) * _this.pagesCount;
			_this.reportStart = Math.floor(_this.vals.length / _this.limit) * _this.limit;

			_this.drawPagesRow(vals);

			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}
		
		_title(button, _gtxt('Последняя страница'));
		
		return button;
	}
	
	this.limitSel = _select([_option([_t("10")], [['attr','value',10]]),
							 _option([_t("20")], [['attr','value',20]]),
							 _option([_t("50")], [['attr','value',50]]),
							 _option([_t("100")], [['attr','value',100]]),
							 _option([_t("200")], [['attr','value',200]]),
							 _option([_t("500")], [['attr','value',500]])], [['dir','className','selectStyle floatRight'], ['css','width','60px']])
}

scrollTable.prototype.createTable = function(parent, name, baseWidth, fields, fieldsWidths, drawFunc, sortFuncs)
{
	var tds = [],
		_this = this;
	
	this.fieldsWidths = fieldsWidths;
	
	for (var i = 0; i < fields.length; i++)
	{
		var button;
		
		if (fields[i] != '' && sortFuncs[fields[i]])
		{
			button = makeLinkButton(fields[i]);
			
			button.sortType = fields[i];
			
			button.onclick = function()
			{
				_this.currentSortType = this.sortType;
				_this.currentSortIndex[_this.currentSortType] = 1 - _this.currentSortIndex[_this.currentSortType];
				
				_this.start = 0;
				_this.reportStart = _this.start * _this.limit;
				
				_this.drawTable(_this.currVals)
			}
		}
		else
			button = _t(fields[i])
		
		tds.push(_td([button], [['css','width',this.fieldsWidths[i]]]))
	}
	
	this.limitSel = switchSelect(this.limitSel,  this.limit)
	
	this.limitSel.onchange = function()
	{
		_this.limit = Number(this.value);
		
		_this.start = 0;
		_this.reportStart = _this.start * _this.limit;
		
		_this.drawTable(_this.currVals)
	}
	
	this.tableCount = _div();
	this.tableLimit = _div([this.limitSel]);
	this.tablePages = _div(null,[['dir','className','tablePages']]);
	this.tableHeader = _tbody([_tr(tds)],[['attr','id',name + 'TableHeader']]);
	this.tableBody = _tbody(null,[['attr','id',name + 'TableBody']]);
	this.tableParent = _div([
							_div([_table([this.tableHeader])],[['dir','className','tableHeader']]),
							_div([_table([this.tableBody])],[['dir','className','tableBody'],['css','width',baseWidth + 20 + 'px']])
						],[['attr','id',name + 'TableParent'],['dir','className','scrollTable'],['css','width',baseWidth + 'px']])
	
	_(parent, [this.tableParent])
	_(parent, [_table([_tbody([_tr([_td([this.tableCount], [['css','width','20%']]), _td([this.tablePages]), _td([this.tableLimit], [['css','width','20%']])])])], [['css','width','100%']])]);
	
	
	this.drawFunc = drawFunc;
	this.start = 0;
	this.reportStart = 0;
	this.allPages = 0;
	this.vals = [];
	
	this.predicate = {};
	
	this.filterVals = {};
	
	this.sortFuncs = sortFuncs;
	
	// сортировка по умолчанию	
	for (var name in this.sortFuncs)
	{
		this.currentSortType = name;
		
		break;
	}
	
	this.currentSortIndex = {};
	for (var name in this.sortFuncs)
	{
		this.currentSortIndex[name] = 0;
	}
}

scrollTable.prototype.addEmptyRow = function()
{
	if (this.tableBody.childNodes.length == 0)
		_(this.tableBody, [_tr(null,[['css','height','1px'],['attr','empty', true]])])
}

scrollTable.prototype.getCurrentSortFunc = function()
{
	return this.sortFuncs[this.currentSortType][this.currentSortIndex[this.currentSortType]];
}

scrollTable.prototype.drawTable = function(vals)
{
	this.currVals = vals;
	
	var vals = vals.sort(this.getCurrentSortFunc());
	
	if (vals.length <= this.limit)
	{
		removeChilds(this.tablePages);
		
		this.drawRows(vals)
	}
	else
	{
		this.allPages = Math.ceil(vals.length / this.limit)

		this.drawPagesRow(vals);
	}
}

scrollTable.prototype.drawRows = function(vals)
{
	var trs = [];

	removeChilds(this.tableBody);
	
	for (var i = 0; i < vals.length; i++)
		trs.push(this.drawFunc(vals[i]));
/*	var trs = vals.map(function(val)
	{
		return _this.drawFunc(val)
	})*/
	
	_(this.tableBody, trs);
	
	this.addEmptyRow();
	
	removeChilds(this.tableCount)
	
	if (this.currVals.length)
		_(this.tableCount, [_t((this.reportStart + 1) + '-' + (Math.min(this.reportStart + this.limit, this.currVals.length))), _span([_t(' ')],[['css','margin','0px 3px']]), _t("(" + this.currVals.length + ")")]);
	else
		_(this.tableCount, [_t("0-0"), _span([_t(' ')],[['css','margin','0px 3px']]), _t("(0)")]);
}

scrollTable.prototype.drawPages = function(end, vals)
{
	var _this = this;
	for (var i = this.start + 1; i<= end; i++)
	{
		// текущий элемент
 		if (i - 1 == this.reportStart/this.limit)
 		{
		    var el = _span([_t(i.toString())]);
			_(_this.tablePages, [el]);
			$(el).addClass('page');
		}
		else
		{
			var link = makeLinkButton(i.toString());
			
			link.setAttribute('page', i - 1);
			link.style.margin = '0px 2px';
			
			_(_this.tablePages, [link]);
			
			link.onclick = function()
			{
				_this.reportStart = this.getAttribute('page') * _this.limit;
				
				_this.drawPagesRow(vals);
				
				// мозилла
				_this.tableBody.scrollTop = 0;
				// ие
				_this.tableParent.scrollTop = 0;
			};
		}
	}
}

scrollTable.prototype.drawPagesRow = function(vals)
{
	// перерисовывем номера страниц
	removeChilds(this.tablePages);
	
	var end = (this.start + this.pagesCount <= this.allPages) ? this.start + this.pagesCount : this.allPages;
	
	if (this.start - this.pagesCount >= 0)
		_(this.tablePages,[this.first(vals), this.previous(vals)]);
	
	this.drawPages(end, vals);
	
	if (end + 1 <= this.allPages)
		_(this.tablePages,[this.next(vals), this.last(vals)]);
	
	// рисуем выбранный участок таблицы
	this.drawRows(vals.slice(this.reportStart, this.reportStart + this.limit))
}

scrollTable.prototype.isEmptyBody = function()
{
	return (this.tableBody.firstChild.getAttribute('empty') == true);
}

scrollTable.prototype.attachFilterEvents = function(inputField, fieldName, predicate)
{
	var _this = this;
	
	_this.predicate[fieldName] = predicate;

	inputField.onkeyup = function()
	{	
	//	if (_this.isEmptyBody())
	//		return;

		_this.filterVals[fieldName] = this.value;
		
		_this.drawFilterTable();
	}
}

scrollTable.prototype.attachSelectFilterEvents = function(selectField, fieldName, predicate)
{
	var _this = this;
	
	_this.predicate[fieldName] = predicate;

	selectField.onchange = function()
	{	
	//	if (_this.isEmptyBody())
	//		return;

		_this.filterVals[fieldName] = this.value;
		
		_this.drawFilterTable();
	}
}

scrollTable.prototype.drawFilterTable = function()
{
	var localValues = this.vals;
	
	for (var filterElem in this.filterVals)
	{
		localValues = this.predicate[filterElem](filterElem, this.filterVals[filterElem], localValues);
	}
	
	this.drawTable(localValues)
}

var _layersTable = new scrollTable(),
	_mapsTable = new scrollTable(),
	_listTable = new scrollTable();

var iconPanel = function()
{
	var _this = this;
	this.parent = null;
	
	var _createIcon = function(url, urlHover)
	{
		var div = _div(null, [['dir','className', 'toolbarIcon']]);
		
		div.style.backgroundImage = "url(" + url + ")";
		
		div.onmouseover = function()
		{
			div.style.backgroundImage = "url(" + urlHover + ")";
		}

		div.onmouseout = function()
		{
			div.style.backgroundImage = "url(" + url + ")";
		}
		
		return div;
	}

	this.create = function(parentCanvas)
	{
		this.parent = _tr();
		
		var div = _div([_table([_tbody([this.parent])],[['dir','className','iconsParent']])],[['css','padding','0px 10px']]);

		if (parentCanvas == $$('iconPanel'))
		{
			div.style.borderLeft = '1px solid #216b9c'
		}
		
		if ($.browser.msie)
			div.style.width = '100%';
		else
			parentCanvas.style.height = '34px';
		
		_(parentCanvas, [div]);
	}
	
	this.add = function(iconId, name, url, urlHover, callback, hiddenFlag)
	{
		var div = _createIcon(url, urlHover),
			elem = _td([div],[['css','width','38px'],['attr','vAlign','top'], ['attr', 'id', iconId]]);
		
		elem.onclick = function()
		{
			callback.apply(elem, arguments);
		}
		
		if (hiddenFlag)
			elem.style.display = 'none';
		
		elem.style.cursor = 'pointer';
		
		_title(elem, name);
		
		_(this.parent, [elem]);
	}
	
	this.addDelimeter = function(delimeterId, floatRight, hiddenFlag)
	{
		var img = _img(null, [['attr','src','img/toolbar/toolbarDelimeter.png']]),
			elem = _td([img], [['css','width','10px'], ['attr', 'id', delimeterId]]);
		
		img.style.left = '0px';
		img.style.top = '0px';
		
		img.style.width = '10px';
		img.style.height = '33px';
		
		if ((typeof floatRight != 'undefined') && (floatRight == true))
			elem.className = 'iconRight';
		
		if (hiddenFlag)
			elem.style.display = 'none';
		
		_(this.parent, [elem])
	}
	
	this.setVisible = function(iconId, isVisible)
	{
		var displayValue = isVisible ? '' : 'none';
		$('#'+iconId, this.parent).css({display: displayValue});
	}

	//TODO: вынести из класса
	this.addSearchCanvas = function()
	{
		var td = _td(null,[['dir','className','searchCanvas'],['attr','id','searchCanvas']]);
		
		_(this.parent, [td]);
	}

	//TODO: вынести из класса
	this.addMapName = function(name)
	{
		var parent;
		if (!$$('iconMapName'))
		{
			var div = _div([_t(name)], [['attr','id','iconMapName'], ['dir','className','iconMapName']])
				td = _td([div],[['css','paddingTop','2px']]);
			
			_(this.parent, [_td([_t(_gtxt("Карта"))], [['css','color','#153069'],['css','fontSize','12px'],['css','paddingTop','2px'],['css','fontFamily','tahoma']]),
							_td([_div(null,[['dir','className','markerRight'],['css','marginLeft','-3px']])],[['attr','vAlign','top'],['css','paddingTop',($.browser.msie ? '8px' : '10px')]]),
							td]);
		}
		else
		{
			removeChilds($$('iconMapName'));
			
			$($$('iconMapName'), [_t(name)])
		}
	}

	//TODO: вынести из класса
	this.addUserActions = function()
	{
		
		if (!this.parent)
			return;
			
		var ids = ['saveMap', 'createVectorLayer', 'createRasterLayer', 'userDelimeter'];
		
		for (var i = 0; i < ids.length; i++)
			this.setVisible(ids[i], true);
	}

	//TODO: вынести из класса
	this.removeUserActions = function()
	{
		if (!this.parent)
			return;
			
		var ids = ['saveMap', 'createVectorLayer', 'createRasterLayer', 'userDelimeter'];
		
		for (var i = 0; i < ids.length; i++)
			this.setVisible(ids[i], false);
	}
}

var _iconPanel = new iconPanel(),
	_leftIconPanel = new iconPanel();

