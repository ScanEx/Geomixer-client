/** 
  @class
  @virtual
  @name IMenuElem
  @desc Описание пункта верхнего меню ГеоМиксера
  @property {String} id Уникальный идентификатор элемента меню
  @property {String} title Tекст, который будет показываться пользователю
  @property {Function} func Ф-ция, которую нужно вызвать при клике
  @property {IMenuElem[]} childs Массив элементов подменю
*/

/**
    Верхнее меню ГеоМиксера. Может содержать до 3 уровней вложенности элементов.
    @class
*/
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
    this.defaultHash = 'layers';
};

/** Добавляет к меню новый элемент верхнего уровня
*
* Если меню уже было нарисовано, вызов этой ф-ции приведёт к перерисовке
*
*    @param {IMenuElem} elem Элемент меню
*/
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

/** Добавляет к меню новый элемент.
*
* Если меню уже было нарисовано, вызов этой ф-ции приведёт к перерисовке
*
*    @param {IMenuElem} newElem Вставляемый элемент меню
*    @param {String} parentID ID элемента меню, к которому добавляется новый элемент
*/
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

/** Задаёт родителя в DOM дереве для меню
* @param {DOMElement} parent Родительский элемент в DOM дереве
*/
UpMenu.prototype.setParent = function(parent)
{
	this.parent = parent;
	
	if (parent)
    {
		removeChilds(parent);
        _(parent, [_span()]);
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
/** Основная функция  - рисует меню по заданной структуре
*/
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
    
    //убираем все скрытые меню
    for (var d in this.disabledTabs)
        this.disableMenus([d]);
    
    this._isCreated = true;
}
// Создает элемент меню 2го уровня
UpMenu.prototype.makeLevel2 = function(elem)
{
	var div = _div([_t(elem.title)],[['dir','className','header2']]);
	
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

		for (var i = 0; i < elem.childs.length; i++)
		{
			// Формируем сслыку для перехода на этот элемент меню
			var div2 = _div([_t(elem.childs[i].title)],[['dir','className','header3'],['css','cursor','pointer']]),
				li = _li([div2],[['dir','className','header3']]);

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
	_menuUp.openTab(hash);
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
		//else if (id == _tab_hash.recentHash && $$('left_' + id) && $$('left_' + id).style.display == 'none')
        else
		{
			_menuUp.removeSelections();
			_menuUp.hideMenus();
			_menuUp.openTab(id);
		}
		// else 
			// _menuUp.openRef(id);
	}
}

UpMenu.prototype.getNavigatePath = function(path) {
    var items = [];
	
	for (var menuId in this.submenus)
	{
		if (path == menuId)
		{
            return [this.submenus[menuId].title];
		}
        
		if (this.submenus[menuId].childs)
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
                            return [this.submenus[menuId].title, childsLevel2[i].title, childsLevel3[j].title];
						}
					}
				}
				if (path == childsLevel2[i].id)
				{
					// совпадение в меню 2го уровня
                    return [this.submenus[menuId].title, childsLevel2[i].title];
				}
			}
		}
	}

	return tds;
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

/** Показывает все ранее скрытые элементы меню
*/
UpMenu.prototype.enableMenus = function()
{
	for (var name in this.disabledTabs)
	{
		$(this.parent).find("li[hash='" + name + "']").children('div').css('display','');
		
		delete this.disabledTabs[name];
	}
}
/** Скрывает заданные элементы меню
* @param {String[]} arr Массив ID элементов меню, которые нужно скрыть
*/
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
    
    if (!nsGmx.AuthManager.isRole(nsGmx.ROLE_ADMIN)) {
        this.disableMenus(['stileLibrary']);
    }
    
    if (_queryMapLayers.currentMapRights() !== "edit") {
        this.disableMenus(['mapTabsNew']);
    }
	
	if (!nsGmx.AuthManager.canDoAction(nsGmx.ACTION_CREATE_LAYERS))
	{
            this.disableMenus(['layersVector', 'layersRaster', 'layersMultiRaster']);
	}
    
    if (!nsGmx.AuthManager.canDoAction(nsGmx.ACTION_CREATE_MAP))
	{
            this.disableMenus(['mapCreate']);
	}
}

UpMenu.prototype.addLoginCanvas = function()
{
	this.loginContainer = _span(null, [['dir','className','loginCanvas'], ['css','position','relative'], ['css','display','block']]);
	_(this.parent, [this.loginContainer]);
}

UpMenu.prototype.go = function(reloadAfterLoginFlag)
{
	this.setParent($$('menu'));
	
	this.createMenu();
		
	this.draw();
	
	this.checkView();
	
	this.addLoginCanvas();
	
	if (window.location.hash)
	{
		this.currUnsel = function(){};
	}
	
	this.openTab(this.defaultHash);
}

UpMenu.prototype.openTab = function(path)
{
    if (this.disabledTabs[path])
		return;
        
    if (!this.refs[path]) 
		return;
	
	var sel = this.refs[path].onsel;

	sel && sel(path);
}

/** Блок (контейнер с заголовком) левой панели
    @class
    @param {String} canvasID Уникальный идентификатор блока
    @param {Object} options Параметры
    @param {function} [options.closeFunc] Ф-ция, которая будет вызвана при нажатии на иконку закрытия блока. По умолчанию ничего не делается.
    @param {String[]} [options.path] Массив строк для формирования названия блока.
                      Предполагается, что последний элемент является собственно названием, а предыдущие - названиями категорий.
                      По умолчанию будет сформирован из верхнего меню ГеоМиксера по canvasID.
    @param {Boolean} [options.showCloseButton=true] Показывать ли кнопку закрытия блока
    @param {Boolean} [options.showMinimizeButton=true] Показывать ли кнопку сворачивания блока
*/
nsGmx.LeftPanelItem = function(canvasID, options) {

    options = $.extend({
        closeFunc: function(){},
        path: _menuUp.getNavigatePath(canvasID),
        showCloseButton: true,
        showMinimizeButton: true
    }, options);
    
    var ui =
        '<div class="leftmenu-canvas {{id}}" id="{{id}}">' +
            '<div class="leftTitle">' +
                '<table class="leftmenu-path"><tr>' +
                    '{{#path}}' +
                        '<td class="leftmenu-path-item {{#last}}menuNavigateCurrent{{/last}}">{{name}}</td>' +
                        '{{^last}}<td><div class="markerRight"></div></td>{{/last}}' +
                    '{{/path}}' +
                '</tr></table>' +
                '{{#showCloseButton}}<div class="leftmenu-close-icon"></div>{{/showCloseButton}}' +
                '{{#showMinimizeButton}}<div class="leftmenu-toggle-icon leftmenu-down-icon"></div>{{/showMinimizeButton}}' +
            '</div>' +
            '<div class = "workCanvas"></div>' +
        '</div>';
    
    /**HTML элемент с блоком (содержит шапку и рабочую область)*/
    this.panelCanvas = $(Mustache.render(ui, {
        id: 'left_' + canvasID,
        path: options.path.map(function(item, index, arr) {
            return {name: item, last: index === arr.length-1};
        }),
        showCloseButton: options.showCloseButton,
        showMinimizeButton: options.showMinimizeButton
    }))[0];
    
    /**Рабочая область блока*/
    this.workCanvas = $(this.panelCanvas).find('.workCanvas')[0];
    
    /** Программная имитация нажатия кнопки закрытия блока
        @function
    */
    this.close = options.closeFunc;
    
    var _this = this;
    
    $('.leftmenu-toggle-icon', this.panelCanvas).click(function() {
        $(_this.workCanvas).toggle();
        $(this).toggleClass('leftmenu-down-icon leftmenu-right-icon');
    });
    
    $('.leftmenu-close-icon',  this.panelCanvas).click(options.closeFunc);
}

/** Основное меню ГеоМиксера
 * @global
 * @type {UpMenu}
 */
var _menuUp = new UpMenu();

// содержит ссылку на рабочую область для текущей вкладки
var leftMenu = function()
{
	this.workCanvas = null;
	this.parentWorkCanvas = null;
}

leftMenu.prototype.createWorkCanvas = function(canvasID, closeFunc)
{
    var _this = this;
	if (!$$('left_' + canvasID))
	{
        var leftPanelItem = new nsGmx.LeftPanelItem(canvasID, {closeFunc: function() {
            $(_this.parentWorkCanvas).hide();
            closeFunc && closeFunc();
        }});
        this.parentWorkCanvas = leftPanelItem.panelCanvas;
        this.workCanvas = leftPanelItem.workCanvas;
		
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