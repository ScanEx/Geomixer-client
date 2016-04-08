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

    this.submenus = [];
	this.currSel = null;
	this.currUnSel = null;
	this.refs = {};

	this.parent = null;
    this.loginContainer = null;
    this._isCreated = false;
    this.defaultHash = 'layers';
};

//предполагает, что если callback возвращает true, то итерирование можно прекратить
UpMenu.prototype._iterateMenus = function(elem, callback) {
    if (!elem.childs) {
        return;
    }

    for (var i = 0; i < elem.childs.length; i++) {
        if (elem.childs[i] && (callback(elem.childs[i]) || this._iterateMenus(elem.childs[i], callback))) {
            return true;
        }
    }
}

/** Добавляет к меню новый элемент верхнего уровня
*
* Если меню уже было нарисовано, вызов этой ф-ции приведёт к перерисовке
*
*    @param {IMenuElem} elem Элемент меню
*/
UpMenu.prototype.addItem = function(elem)
{
    this.submenus.push(elem)
    this._isCreated && this.draw();
}

/** Добавляет к меню новый элемент.
*
* Если меню уже было нарисовано, вызов этой ф-ции приведёт к перерисовке
*
*    @param {IMenuElem} newElem Вставляемый элемент меню
*    @param {String} parentID ID элемента меню, к которому добавляется новый элемент
*    @param {String} [insertBeforeID] ID элемента меню, перед которым нужно вставить пункт меню.
*                    Если не указан, пункт меню будет добавлен в конец списка.
*/
UpMenu.prototype.addChildItem = function(newElem, parentID, insertBeforeID)
{
    this._iterateMenus({childs: this.submenus}, function(elem) {
        if (elem.id && elem.id === parentID) {
            elem.childs = elem.childs || [];
            
            var index = elem.childs.length;
            elem.childs.forEach(function(childElem, i) {
                if (childElem.id === insertBeforeID) {
                    index = i;
                }
            })
            
            elem.childs.splice(index, 0, newElem);

            this._isCreated && this.draw();

            return true;
        }
    }.bind(this));
}

/** Задаёт родителя в DOM дереве для меню
* @param {DOMElement} parent Родительский элемент в DOM дереве
*/
UpMenu.prototype.setParent = function(parent)
{
	this.parent = parent;

	if (parent)
    {
		$(parent).empty();
        parent.appendChild(_span());
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

UpMenu.prototype._template = Handlebars.compile(
'<div class="headerContainer">\
{{#childs}}{{#if id}}\
    <div class = "header1{{#unless childs}} menuClickable{{/unless}}" hash = "{{id}}">\
        <div class = "header1Internal">{{title}}</div>\
        {{#if childs}}\
            <ul class = "header2" id="{{id}}">\
            {{#childs}}{{#if id}}\
                <li class = "header2{{#unless childs}} menuClickable{{/unless}}" hash = "{{id}}">\
                    <div class = "header2{{#if disabled}} menuDisabled{{/if}}{{#delimiter}} menuDelimiter{{/delimiter}}">\
                        <div class = "menuMarkerLeft {{#if checked}} ui-icon ui-icon-check{{/if}}"></div>\
                        {{title}}\
                        {{#if childs}}\
                            <div class = "menuMarkerRight"></div>\
                        {{/if}}\
                    </div>\
                    {{#if childs}}\
                        <ul class = "header3" id="{{id}}">\
                        {{#childs}}{{#if id}}\
                            <li class = "header3 menuClickable" hash = "{{id}}">\
                                <div class = "header3{{#if disabled}} menuDisabled{{/if}}{{#delimiter}} menuDelimiter{{/delimiter}}">\
                                    <div class = "menuMarkerLeft {{#if checked}} ui-icon ui-icon-check{{/if}}"></div>\
                                    {{title}}\
                                </div>\
                            </li>\
                        {{/if}}{{/childs}}\
                        </ul>\
                    {{/if}}\
                </li>\
            {{/if}}{{/childs}}\
            </ul>\
        {{/if}}\
    </div>\
    {{/if}}{{/childs}}\
</div>');

/** Основная функция  - рисует меню по заданной структуре
*/
UpMenu.prototype.draw = function()
{
    var ui = $(this._template({
            childs: this.submenus
        })),
        _this = this;

    $(this.parent.firstChild).empty().append(ui);

    $(ui).find('.header1').each(function() {
        _this.attachEventOnMouseover(this, 'menuActive');
        _this.attachEventOnMouseout(this, 'menuActive');
        $(this).width($(this).width() + 10);
    });

    $(ui).find('li.header2').each(function() {
        _this.attachEventOnMouseover(this, 'menu2Active');
        _this.attachEventOnMouseout(this, 'menu2Active');
    });

    $(ui).find('li.header3').each(function() {
        attachEffects(this, 'menu3Active');
    });

    $(ui).find('.menuClickable').each(function() {
        var id = $(this).attr('hash');
        $(this).click(function() {
            _this.refs[id].disabled || _this.openTab(id);
        });
    });

    this._iterateMenus({childs: this.submenus}, function(elem) {
        _this.refs[elem.id] = elem;
    })

    //убираем все скрытые меню
    for (var d in this.disabledTabs)
        this.disableMenus([d]);

    this._isCreated = true;
}

UpMenu.prototype.checkItem = function(id, isChecked) {
    if (this.refs[id]) {
        this.refs[id].checked = isChecked;
        $(this.parent).find('li[hash=' + id + ']').find('.menuMarkerLeft').toggleClass('ui-icon ui-icon-check', isChecked);
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

UpMenu.prototype.attachEventOnMouseover = function(elem, className)
{
	var _this = this;
	elem.onmouseover = function(e)
	{
		$(this).addClass(className);

		if ($('#' + this.getAttribute('hash'))[0])
			_this.showmenu($('#' + this.getAttribute('hash'))[0]);
	}
}
UpMenu.prototype.attachEventOnMouseout = function(elem, className)
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

			if ($('#' + elem.getAttribute('hash')).length)
				_this.hidemenu($('#' + elem.getAttribute('hash'))[0]);
		}
		catch (e)
		{
			$(elem).removeClass(className)

			if ($('#' + elem.getAttribute('hash')).length)
				_this.hidemenu($('#' + elem.getAttribute('hash'))[0]);
		}
	}
}

UpMenu.prototype.getNavigatePath = function(path) {
	for (var menuIdx = 0; menuIdx < this.submenus.length; menuIdx++)
	{
        var submenu = this.submenus[menuIdx];
        
        if (!submenu) {continue};

		if (path == submenu.id)
		{
            return [submenu.title];
		}

		if (submenu.childs)
		{
			var childsLevel2 = submenu.childs;
			for (var i = 0; i < childsLevel2.length; i++)
			{
                if (!childsLevel2[i]) {continue};
                
				if (childsLevel2[i].childs)
				{
					var childsLevel3 = childsLevel2[i].childs;
					// есть подменю, смотрим там
					for(var j = 0; j < childsLevel3.length; j++)
					{
                        if (!childsLevel3[j]) {continue};
                        
						if (path == childsLevel3[j].id)
						{
                            return [submenu.title, childsLevel2[i].title, childsLevel3[j].title];
						}
					}
				}
				if (path == childsLevel2[i].id)
				{
					// совпадение в меню 2го уровня
                    return [submenu.title, childsLevel2[i].title];
				}
			}
		}
	}

	return [];
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

UpMenu.prototype.go = function(container)
{
	this.setParent(container);

	this.createMenu();

	this.draw();

	this.checkView();

	if (window.location.hash)
	{
		this.currUnsel = function(){};
	}

	this.openTab(this.defaultHash);
}

UpMenu.prototype.openTab = function(id)
{
    if (this.disabledTabs[id] || !this.refs[id]) {
        return;
    }

    var item = this.refs[id];

    this.removeSelections();
	this.hideMenus();

    if (item.func) {
        item.func(id);
    } else {
        var func = item[item.checked ? 'onunsel' : 'onsel'];
        this.checkItem(id, !item.checked);
        func && func(id);
    }
}

/** Блок (контейнер с заголовком) левой панели
    @class
    @param {String} canvasID Уникальный идентификатор блока
    @param {Object} options Параметры
    @param {function} [options.closeFunc] Ф-ция, которая будет вызвана при нажатии на иконку закрытия блока. По умолчанию ничего не делается.
    @param {String[]} [options.path] Массив строк для формирования названия блока (см. метод setTitle()).
                      По умолчанию будет сформирован из верхнего меню ГеоМиксера по canvasID.
    @param {Boolean} [options.showCloseButton=true] Показывать ли кнопку закрытия блока
    @param {Boolean} [options.showMinimizeButton=true] Показывать ли кнопку сворачивания блока
*/
nsGmx.LeftPanelItem = function(canvasID, options) {
    /** Изменение видимости контента ("свёрнутости") панели
     * @event nsGmx.LeftPanelItem.changeVisibility
    */

    options = $.extend({
        closeFunc: function(){},
        showCloseButton: true,
        showMinimizeButton: true
    }, options);
    
    //по умолчанию оставляем только последний элемент списка
    if (!options.path) {
        var menuPath = _menuUp.getNavigatePath(canvasID);
        options.path = menuPath.length ? [menuPath[menuPath.length - 1]] : [];
    }

    var getPathHTML = function(path) {
        if (!path) return '';

        return Handlebars.compile(
            '<tr>' +
                '{{#path}}' +
                    '<td class="leftmenu-path-item {{#last}}menuNavigateCurrent{{/last}}">{{name}}</td>' +
                    '{{^last}}<td><div class="markerRight"></div></td>{{/last}}' +
                '{{/path}}' +
            '</tr>')(
            {
                path: path.map(function(item, index, arr) {
                    return {name: item, last: index === arr.length-1};
                })
            }
        );
    }

    var ui = Handlebars.compile(
        '<div class="leftmenu-canvas {{id}}" id="{{id}}">' +
            '{{#isTitle}}<div class="leftTitle">' +
                '{{#showMinimizeButton}}' + 
                    '<div class = "leftmenu-toggle-zone">' + 
                        '<div class="ui-helper-noselect leftmenu-toggle-icon leftmenu-down-icon"></div>' + 
                    '</div>' +
                '{{/showMinimizeButton}}' +
                '<table class="leftmenu-path ui-helper-noselect">{{{pathTR}}}</table>' +
                '{{#showCloseButton}}<div class="gmx-icon-close"></div>{{/showCloseButton}}' +
            '</div>{{/isTitle}}' +
            '<div class = "workCanvas"></div>' +
        '</div>');

    /**HTML элемент с блоком (содержит шапку и рабочую область)*/
    this.panelCanvas = $(ui({
        isTitle: !!(options.path.length || options.showCloseButton || options.showMinimizeButton),
        id: 'left_' + canvasID,
        pathTR: getPathHTML(options.path),
        showCloseButton: options.showCloseButton,
        showMinimizeButton: options.showMinimizeButton
    }))[0];

    /**Рабочая область блока*/
    this.workCanvas = $(this.panelCanvas).find('.workCanvas')[0];

    /** Программная имитация нажатия кнопки закрытия блока
        @function
    */
    this.close = options.closeFunc;

    var isUICollapsed = false,
        _this = this;
    
    var toggleContentVisibility = function(isCollapsed) {
        if (isUICollapsed !== isCollapsed) {
            isUICollapsed = !isUICollapsed;
            $(_this.workCanvas).toggle();
            $(_this.panelCanvas).find('.leftmenu-toggle-zone div').toggleClass('leftmenu-down-icon leftmenu-right-icon');
            $(_this).trigger('changeVisibility');
        }
    }

    $('.leftmenu-toggle-zone, .leftmenu-path', this.panelCanvas).click(function() {
        toggleContentVisibility(!isUICollapsed);
    });
    
    /** Свернуть панель
        @function
    */
    this.hide = toggleContentVisibility.bind(null, true);
    
    /** Развернуть панель
        @function
    */
    this.show = toggleContentVisibility.bind(null, false);
    
    /** Свёрнута ли панель */
    this.isCollapsed = function() {return isUICollapsed};

    $('.leftTitle .gmx-icon-close',  this.panelCanvas).click(options.closeFunc);

    /** Задать новый заголовок окна
     @param {String[]} [path] Массив строк для формирования названия блока.
                      Предполагается, что последний элемент является собственно названием, а предыдущие - названиями категорий.
    */
    this.setTitle = function(path) {
        $('.leftmenu-path', this.panelCanvas).html(getPathHTML(path));
    }
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

//варианты вызова:
//    function(canvasID, closeFunc, options) - для обратной совместимости
//    function(canvasID, options)
// options - те же, что и в LeftPanelItem
leftMenu.prototype.createWorkCanvas = function(canvasID, closeFunc, options)
{
    if (typeof closeFunc !== 'function') {
        options = closeFunc || {};
        closeFunc = options.closeFunc;
    } else {
        options = options || {};
    }

    options.closeFunc = function() {
        $(_this.parentWorkCanvas).hide();
        closeFunc && closeFunc();
    }

    var _this = this;
	if (!$('#left_' + canvasID).length)
	{
        var leftPanelItem = new nsGmx.LeftPanelItem(canvasID, options);
        this.parentWorkCanvas = leftPanelItem.panelCanvas;
        this.workCanvas = leftPanelItem.workCanvas;
        this.leftPanelItem = leftPanelItem;
        
        // так как мы используем dom элементы для поиска панелей после первого добавления
        // возможно, лучше сделать полноценный менеджер панелей левой вкладки
        this.parentWorkCanvas.leftPanelItem = leftPanelItem;

        $('#leftContentInner').prepend(this.parentWorkCanvas);

		return false;
	}
	else
	{
		this.parentWorkCanvas = $('#left_' + canvasID)[0];
		this.workCanvas = this.parentWorkCanvas.lastChild;
        this.leftPanelItem = this.parentWorkCanvas.leftPanelItem;
        this.leftPanelItem.close = options.closeFunc;

		$(this.parentWorkCanvas).show();
        
        $('#leftContentInner').prepend(this.parentWorkCanvas);

		return true;
	}
}