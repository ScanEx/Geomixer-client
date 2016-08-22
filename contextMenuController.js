!(function() {
//Контроллёр контектных меню и соответствующие пункты всех меню...

nsGmx = nsGmx || {};

/** 
* Контроллёр контекстных меню.
* @class
* @name ContextMenuController
* @memberOf nsGmx
* 
* @description Позволяет добавлять элементы контектсного меню разного типа и привязывать меню к отдельным DOM элементам. 
* Возможно динамическое создание меню при клике на объекте. Элементам меню передаётся контекст, 
* указанный при привязке меню к элементу (он так же может создаваться в момент клика на элементе)
* Каждый элемент меню - отдельный объект, они независимо добавляются в контроллер. 
* При создании меню определённого типа из этого набора выбираются нужные элементы.
*/
nsGmx.ContextMenuController = (function()
{
	var _menuItems = {};
	var SUGGEST_TIMEOUT = 700;
	
	// Показывает контектное меню для конкретного элемента. 
	// В Opera меню показывается при наведении на элемент в течении некоторого времени, во всех остальных браузерах - по правому клику.
	// Меню исчезает при потере фокуса
	// Параметры:
	// * elem {DOMElement} - элемент, на который навешивается меню
	// * menuFunc {Function, menuFunc()->DomElement} - функция, создающая меню
	// * checkFunc {Function, checkFunc()->Bool} - если возвращает false, то ничего не показывается...
	var _context = function(elem, menuFunc, checkFunc)
	{
        var menu = null;
        elem.oncontextmenu = function(e)
        {
            if (typeof checkFunc != 'undefined' && !checkFunc())
                return false;
                
            if (menu && menu.parentNode) 
                menu.parentNode.removeChild(menu);
                
            menu = menuFunc();
            if (!menu) return false;
            
            var contextMenu = _div([menu],[['dir','className','contextMenu'], ['attr','id','contextMenuCanvas']])
            
            var evt = e || window.event;
            
            hidden(contextMenu);
            document.body.appendChild(contextMenu)
            
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
                {
                    menu = null;
                    contextMenu.removeNode(true);
                }
            }
            
            return false;
        }
	}	
	
	var _contextClose = function()
	{
        $('#contextMenuCanvas').remove();
	}	
	
	var _generateMenuDiv = function(type, context)
	{
        var uiTemplate = Handlebars.compile('<div>' +
            '{{#menuItems}}' +
                '{{#if separator}}<div class = "contextMenuSeparator"></div>{{/if}}' + 
                '<div class = "contextMenuItem" data-itemIndex="{{index}}">{{title}}</div>' +
            '{{/menuItems}}' +
        '</div>');
        
		var items = _menuItems[type],
            visibleItems = [];
		
		for (var e = 0; e < items.length; e++) {
			var menuElem = items[e];
            if (menuElem.isVisible && !menuElem.isVisible(context)) {
                continue;
            }
            
            visibleItems.push({
                index: e,
                title: typeof menuElem.title === 'function' ? menuElem.title() : menuElem.title,
                separator: menuElem.isSeparatorBefore && menuElem.isSeparatorBefore(context)
            });
        }
        
        if (visibleItems.length) {
            var ui = $(uiTemplate({menuItems: visibleItems}));
            ui.find('.contextMenuItem').click(function() {
                var itemIndex = Number($(this).data('itemindex'));
                context.contentMenuArea = getOffsetRect(this);
                context.contentMenuType = type;
                _contextClose();
                _menuItems[type][itemIndex].clickCallback(context);
            });
            
            return ui[0];
        }
        
        return null;
	}
	
	//public interface
	return {
	
		/**
		 * Добавляет новый пункт меню
         * @memberOf nsGmx.ContextMenuController
		 * @function
		 * @param {nsGmx.ContextMenuController.IContextMenuElem} menuItem Элемент контекстного меню
		 * @param {String | String[]} menuType Тип меню (например: "Layer", "Map", "Group"). Если массив, то данный элемент применяется в нескольких типах меню
		 */
		addContextMenuElem: function(menuItem, menuType)
		{
			if (typeof menuType === 'string')
				menuType = [menuType];
				
			for (var i = 0; i < menuType.length; i++)
			{
				_menuItems[menuType[i]] = _menuItems[menuType[i]] || [];
				_menuItems[menuType[i]].push(menuItem);
			}
		},
		
		/**
		 * Добавляет к DOM элементу контекстное меню
		 * @function
         * @memberOf nsGmx.ContextMenuController
		 * @param {DOMElement} elem Целевой DOM-элемент
		 * @param {String} type Тип меню
		 * @param {function():Boolean} checkFunc Проверка, показывать ли сейчас меню. Если ф-ция возвращает false, меню не показывается
		 * @param {Object|function(context):Object} context Контекст, который будет передан в элемент меню при клике на DOM-элементе. 
		 *        Если контект - ф-ция, она будет вызвана непосредственно при клике. В контекст при клике будут добавлены элементы contentMenuArea и contentMenuType.
		 */
		bindMenuToElem: function(elem, type, checkFunc, context)
		{
			_context(elem, function()
			{
				if (typeof context === 'function')
					context = context(); //
					
				return _generateMenuDiv(type, context);
			}, checkFunc, SUGGEST_TIMEOUT)
		}
	}
})();


/** Интерфейс для задания контекстного меню пользователей
* @class
* @name nsGmx.ContextMenuController.IContextMenuElem
*/

/** Нужно ли отображать данный пункт меню для данного элемента и типа дерева. Необязательная (по умолчанию отображается)
@function
@name isVisible
@memberOf nsGmx.ContextMenuController.IContextMenuElem.prototype
@param {Object} context - контекст, специфический для конкретного типа меню
*/

/** Нужно ли рисовать перед данным пунктом разделитель (гориз. черту). Необязательная (по умолчанию не рисуется)
@function
@name isSeparatorBefore
@memberOf nsGmx.ContextMenuController.IContextMenuElem.prototype
@param {Object} context - контекст, специфический для конкретного типа меню
*/

/** Вызывается при клике по соответствующему пункту меню
* @function
* @name clickCallback
* @memberOf nsGmx.ContextMenuController.IContextMenuElem.prototype
* @param {object} context - контекст, который был передан при привязке меню к DOM-элементу. В контекст будут добавлены поля:
* 
*  * contentMenuArea {Object} - координаты верхнего левого угла пункта меню, на которое было нажатие. {left: int, top: int}. Если нужно привязаться к месту текущего клика
*  * contentMenuType {String}- тип вызванного контекстного меню. Актуально, если элемент меню используется в нескольких типах меню.
*/

/** Строка или ф-ция, которую нужно отображать в контекстном меню. Если ф-ция, то она будет вызываться при каждом формировании меню и должна возвращать строку.
@name title
@memberOf nsGmx.ContextMenuController.IContextMenuElem.prototype
*/


//Все заголовки элементов меню заданы как ф-ции, так как на момент выполенения этого кода неизвестен выбранный язык системы

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// Контекстное меню слоёв ////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/*
В контексте типа "Layer" присутствуют следующие атрибуты:
 * layerManagerFlag {int} Тип дерева
 * elem Элемент (слой), для которого стротся меню
 * tree {layersTree} Текущее дерево, внутри которого находится слой
*/

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Свойства"); },
	isVisible: function(context)
	{
		return !context.layerManagerFlag && nsGmx.AuthManager.isLogin();
	},
	clickCallback: function(context)
	{
		var div;
		if (context.elem.MultiLayerID)
			div = $(_queryMapLayers.buildedTree).find("div[MultiLayerID='" + context.elem.MultiLayerID + "']")[0];
		else
			div = $(_queryMapLayers.buildedTree).find("div[LayerID='" + context.elem.name + "']")[0];
		_mapHelper.createLayerEditor(div, context.tree, 'main', div.gmxProperties.content.properties.styles.length > 1 ? -1 : 0);
	}
}, 'Layer');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Стили"); },
	isVisible: function(context)
	{
		return !context.layerManagerFlag && context.elem.type === "Vector" && _queryMapLayers.currentMapRights() === "edit";
	},
	clickCallback: function(context)
	{
        nsGmx.createStylesDialog(context.elem, context.tree);
	}
}, 'Layer');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Таблица атрибутов"); },
	isVisible: function(context)
	{
		return !context.layerManagerFlag && (_queryMapLayers.currentMapRights() === "edit" || _queryMapLayers.layerRights(context.elem.name) == 'edit' || _queryMapLayers.layerRights(context.elem.name) === 'editrows') && context.elem.type === "Vector";
	},
	clickCallback: function(context)
	{
		nsGmx.createAttributesTable(context.elem.name);
	}
}, 'Layer');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Права доступа"); },
	isVisible: function(context)
	{
		return !context.layerManagerFlag && 
				nsGmx.AuthManager.canDoAction( nsGmx.ACTION_SEE_MAP_RIGHTS ) && 
				_queryMapLayers.layerRights(context.elem.name) === 'edit';
	},
	clickCallback: function(context) {
		if (context.elem.MultiLayerID) {
            var securityDialog = new nsGmx.multiLayerSecurity();
			securityDialog.getRights(context.elem.MultiLayerID, context.elem.title);
        } else {
            var securityDialog = new nsGmx.layerSecurity(context.elem.type);
			securityDialog.getRights(context.elem.name, context.elem.title);
        }
	}
}, 'Layer');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Скачать"); },
	isVisible: function(context)
	{
		return !context.layerManagerFlag && 
				( _queryMapLayers.currentMapRights() === "edit" || (_queryMapLayers.currentMapRights() == "view" && nsGmx.AuthManager.isLogin() ) ) && 
				context.elem.type == "Vector" &&
				context.tree.treeModel.getMapProperties().CanDownloadVectors;
	},
	clickCallback: function(context)
	{
		_mapHelper.downloadVectorLayer({
            name: context.elem.name,
            host: context.elem.hostName
        });
	}
}, 'Layer');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Удалить"); },
	isVisible: function(context)
	{
		return !context.layerManagerFlag && _queryMapLayers.currentMapRights() === "edit";
	},
	clickCallback: function(context)
	{
		_queryMapLayers.removeLayer(context.elem.name)
		
		var div;
			
		if (context.elem.MultiLayerID)
			div = $(_queryMapLayers.buildedTree).find("div[MultiLayerID='" + context.elem.MultiLayerID + "']")[0];
		else
			div = $(_queryMapLayers.buildedTree).find("div[LayerID='" + context.elem.name + "']")[0];
		
		var treeElem = _layersTree.findTreeElem(div).elem,
			node = div.parentNode,
			parentTree = node.parentNode;
		
		_layersTree.removeTreeElem(div);

		node.removeNode(true);
		
		_abstractTree.delNode(null, parentTree, parentTree.parentNode);
		
		_mapHelper.updateUnloadEvent(true);
	}
}, 'Layer');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Добавить снимки"); },
	isVisible: function(context)
	{
        var layerRights = _queryMapLayers.layerRights(context.elem.name);
		return !context.layerManagerFlag &&
               (layerRights === 'edit' || layerRights === 'editrows') && 
               context.elem.type == "Vector" &&
               context.elem.IsRasterCatalog;
	},
	clickCallback: function(context)
	{
        new nsGmx.RCAddLayerControl(nsGmx.gmxMap, context.elem.name);
	}
}, 'Layer');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Копировать стиль"); },
	isVisible: function(context)
	{
		return context.elem.type == "Vector" && 
		       (context.layerManagerFlag || _queryMapLayers.currentMapRights() === "edit");
	},
	isSeparatorBefore: function(context)
	{
		return !context.layerManagerFlag;
	},
	clickCallback: function(context)
	{            
		var rawTree = context.tree.treeModel,
            elem;
        if (context.elem.MultiLayerID)
			elem = rawTree.findElem("MultiLayerID", context.elem.MultiLayerID).elem;
		else
			elem = rawTree.findElem("LayerID", context.elem.name).elem;

        nsGmx.ClipboardController.addItem('LayerStyle', {type: context.elem.GeometryType, style: elem.content.properties.styles});
	}
}, 'Layer');

var applyStyleContentMenuItem = {
	title: function() { return _gtxt("Применить стиль"); },
	isVisible: function(context)
	{
        if (context.layerManagerFlag || 
            _queryMapLayers.currentMapRights() !== "edit" || 
            nsGmx.ClipboardController.getCount('LayerStyle') === 0 ) 
        {
            return false;
        }
        
        if (context.contentMenuType === 'Layer') {
            return context.elem.type == "Vector" && 
                nsGmx.ClipboardController.get('LayerStyle', -1).type === context.elem.GeometryType;
        } else { //группы
            return true;
        }
	},
	clickCallback: function(context)
	{
		var 
            newStyles = nsGmx.ClipboardController.get('LayerStyle', -1).style,
            stylesType = nsGmx.ClipboardController.get('LayerStyle', -1).type;
            
		if (context.contentMenuType === 'Layer') {
            var div;
            if (context.elem.MultiLayerID)
                div = $(_queryMapLayers.buildedTree).find("div[MultiLayerID='" + context.elem.MultiLayerID + "']")[0];
            else
                div = $(_queryMapLayers.buildedTree).find("div[LayerID='" + context.elem.name + "']")[0];
            
            div.gmxProperties.content.properties.styles = newStyles;
            
            _mapHelper.updateMapStyles(newStyles, context.elem.name);
            
            _mapHelper.updateTreeStyles(newStyles, div, context.tree, true);
        } else { //группа
            var tree = context.tree.treeModel,
                node = tree.findElemByGmxProperties(context.div.gmxProperties).elem;
                
            tree.forEachLayer(function(layerContent) {
                if (layerContent.properties.type !== "Vector" || layerContent.properties.GeometryType !== stylesType){
                    return;
                };
                
                layerContent.properties.styles = newStyles;
                _mapHelper.updateMapStyles(newStyles, layerContent.properties.name);
                
                var div = context.tree.findUITreeElem({content: layerContent});
                if (div) {
                    // div.gmxProperties.content.properties.styles = newStyles;
                    _mapHelper.updateTreeStyles(newStyles, div, context.tree, true);
                }
            }, node);
        }
	}
};

nsGmx.ContextMenuController.addContextMenuElem(applyStyleContentMenuItem, 'Layer');

///////////////////////////////////////////////////////////////////////////////
/////////////////////////// Контекстное меню групп ////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/*
В контексте типа "Group" присутствуют следующие атрибуты:
 * div {DOMElement} Элемент дерева, для которого стротся меню
 * tree {layersTree} Текущее дерево карты
*/

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Свойства"); },
	clickCallback: function(context)
	{
		nsGmx.createGroupEditor(context.div);
	}
}, 'Group');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Добавить подгруппу"); },
	clickCallback: function(context)
	{
		nsGmx.addSubGroup(context.div, context.tree);
	}
}, 'Group');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Удалить"); },
	clickCallback: function(context)
	{
		context.tree.removeGroup(context.div);
		_mapHelper.updateUnloadEvent(true);
	}
}, 'Group');

nsGmx.ContextMenuController.addContextMenuElem(applyStyleContentMenuItem, 'Group');
///////////////////////////////////////////////////////////////////////////////
/////////////////////////// Контекстное меню карты ////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/*
В контексте типа "Map" присутствуют следующие атрибуты:
 * div {DOMElement} Элемент дерева, для которого стротся меню
 * tree {layersTree} Текущее дерево карты
*/
nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Свойства"); },
	clickCallback: function(context)
	{
		nsGmx.createMapEditor(context.div);
	}
}, 'Map');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Добавить подгруппу"); },
	clickCallback: function(context)
	{
		nsGmx.addSubGroup(context.div, context.tree);
	}
}, 'Map');

nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Права доступа"); },
	clickCallback: function(context)
	{
        var securityDialog = new nsGmx.mapSecurity();
		securityDialog.getRights(context.tree.treeModel.getMapProperties().MapID, context.tree.treeModel.getMapProperties().title);
	},
	isVisible: function(context)
	{
		return nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_MAP_RIGHTS) &&
            (_queryMapLayers.currentMapRights() === "edit" || nsGmx.AuthManager.isRole(nsGmx.ROLE_ADMIN));
	}
}, 'Map');

//групповое редактирование слоев
nsGmx.ContextMenuController.addContextMenuElem({
	title: function() { return _gtxt("Права доступа к слоям"); },
	isVisible: function(context)
	{
		var treeModel = context.tree.treeModel,
			layersFlag = false,
			layersRights = false;
		treeModel.forEachNode(function (node) {
			if (node.type !== 'group') {
				layersFlag = true;
				if (_queryMapLayers.layerRights(node.content.properties.LayerID) === 'edit') {
					layersRights = true;
				}
			}
		});

		return nsGmx.AuthManager.canDoAction( nsGmx.ACTION_SEE_MAP_RIGHTS ) &&
			layersFlag &&
			layersRights;
	},
	clickCallback: function(context) {
        var securityDialog = new nsGmx.layersGroupSecurity(),
			props = _layersTree.treeModel.getMapProperties();
		securityDialog.getRights(props.MapID, props.title);

	}
}, 'Map');

})();
