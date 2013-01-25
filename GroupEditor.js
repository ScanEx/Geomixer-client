var nsGmx = nsGmx || {};

(function(){

var createGroupId = function()
{
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
		randomstring = '';
	
	for (var i = 0; i < 16; i++) 
	{
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.charAt(rnum);
	}
	
	return randomstring;
}

var GroupVisibilityPropertiesModel = function(isChildRadio, isVisibilityControl, isExpanded)
{
	var _isChildRadio = isChildRadio;
	var _isVisibilityControl = isVisibilityControl;
    var _isExpanded = isExpanded;
	
	this.isVisibilityControl = function() { return _isVisibilityControl; }
	this.isChildRadio = function() { return _isChildRadio; }
	this.isExpanded = function() { return _isExpanded; }
	
	this.setVisibilityControl = function(isVisibilityControl)
	{
		var isChange = _isVisibilityControl !== isVisibilityControl;
		_isVisibilityControl = isVisibilityControl;
		if (isChange) $(this).change();
	}
	
	this.setChildRadio = function(isChildRadio)
	{
		var isChange = _isChildRadio !== isChildRadio;
		_isChildRadio = isChildRadio;
		if (isChange) $(this).change();
	}
    
    this.setExpanded = function(isExpanded)
	{
		var isChange = _isExpanded !== isExpanded;
		_isExpanded = isExpanded;
		if (isChange) $(this).change();
	}
}

//возвращает массив описания элементов таблицы для использования в mapHelper.createPropertiesTable
//model {GroupVisibilityPropertiesModel} - ассоциированные параметры видимости
//showVisibilityCheckbox {bool} - добавлять ли возможность скрывать чекбокс видимости или нет
var GroupVisibilityPropertiesView = function( model, showVisibilityCheckbox, showExpanded )
{
	var _model = model;
	var boxSwitch = _checkbox(!_model.isChildRadio(), 'checkbox'),
		radioSwitch = _checkbox(_model.isChildRadio(), 'radio');
	var showCheckbox = _checkbox(_model.isVisibilityControl(), 'checkbox');
	var isExpanded = _checkbox(_model.isExpanded(), 'checkbox');
	
	showCheckbox.onclick = function()
	{
		_model.setVisibilityControl( this.checked );
	}
    
    isExpanded.onclick = function()
	{
		_model.setExpanded( this.checked );
	}
	
	boxSwitch.onclick = function()
	{
		this.checked = true;
		radioSwitch.checked = !this.checked;
		
		_model.setChildRadio( !this.checked );
	}
	
	radioSwitch.onclick = function()
	{
		this.checked = true;
		boxSwitch.checked = !this.checked;
		
		_model.setChildRadio( this.checked );
	}
	
	var ret = [{name: _gtxt("Вид вложенных элементов"), field: 'list', elem: _div([boxSwitch, radioSwitch])}];
	
	if (showVisibilityCheckbox)
		ret.push({name: _gtxt("Показывать чекбокс видимости"), elem: _div([showCheckbox])});
        
    if (showExpanded)
		ret.push({name: _gtxt("Разворачивать автоматически"), elem: _div([isExpanded])});
	
	return ret;
}

/** Показывает диалог добавления новой подгруппы
  @param div {HTMLNode} - куда добавлять новую подгруппу (группа или карта)
  @param layersTree {layersTree} - дерево главной карты
*/
var addSubGroup = function(div, layersTree)
{
	var ul = _abstractTree.getChildsUl(div.parentNode),
		newIndex;
	
	if (!ul)
		newIndex = 0;
	else
		newIndex = ul.childNodes.length + 1;
	
	var groupVisibilityProperties = new GroupVisibilityPropertiesModel( false, true, false );
	var groupVisibilityPropertiesControls = new GroupVisibilityPropertiesView( groupVisibilityProperties, true, true );
	
	var elemProperties = (div.gmxProperties.content) ? div.gmxProperties.content.properties : div.gmxProperties.properties,
	    newName = elemProperties.title,
		inputIndex = _input(null,[['attr','value', newName + ' ' + newIndex],['dir','className','inputStyle'],['css','width','140px']]),
		create = makeButton(_gtxt('Создать')),
		pos = nsGmx.Utils.getDialogPos(div, true, 100),
		createSubGroup = function()
		{
			if (inputIndex.value == '')
				return;
			
			var parentProperties = div.gmxProperties,
				newGroupProperties = {
                    type:'group', 
                    content:{
                        properties:{
                            title:inputIndex.value, 
                            list: groupVisibilityProperties.isChildRadio(), 
                            visible: true, 
                            ShowCheckbox: groupVisibilityProperties.isVisibilityControl(), 
                            expanded: groupVisibilityProperties.isExpanded(), 
                            initExpand: groupVisibilityProperties.isExpanded(), 
                            GroupID: createGroupId()
                        }, children:[]
                    }
                },
				li = _layersTree.getChildsList(newGroupProperties, parentProperties, false, div.getAttribute('MapID') ? true : _layersTree.getLayerVisibility(div.firstChild));
			
			_queryMapLayers.addDraggable(li)
			
			_queryMapLayers.addDroppable(li);
			
			_queryMapLayers.addSwappable(li);
			
			layersTree.addTreeElem(div, 0, newGroupProperties);
			
			var childsUl = _abstractTree.getChildsUl(div.parentNode);
			
			if (childsUl)
			{
				_abstractTree.addNode(div.parentNode, li);
				
				_layersTree.updateListType(li, true);
				
				if (!childsUl.loaded)
					li.removeNode(true)
			}
			else
			{
				_abstractTree.addNode(div.parentNode, li);
				
				_layersTree.updateListType(li, true);
			}
			
			$(dialogDiv).dialog('destroy');
			dialogDiv.removeNode(true);
			
			_mapHelper.updateUnloadEvent(true);
		};
	
	create.onclick = createSubGroup;
	
	inputIndex.onkeyup = function(e)
	{
		if (this.value == '')
			$(this).addClass('error');
		else
			$(this).removeClass('error');
		
		var evt = e || window.event;
	  	if (getkey(evt) == 13) 
	  	{	
			createSubGroup();
	  		
	  		return false;
	  	}
		
		return true;
	}
	
	create.style.marginTop = '5px';
	
	var parentDiv = _div([inputIndex, _br(), create],[['css','textAlign','center']]);
	var trs = [{name: _gtxt("Имя группы"), elem: inputIndex}].concat(groupVisibilityPropertiesControls);
	
	var trsControls = _mapHelper.createPropertiesTable(trs, elemProperties, {leftWidth: 100});
	var propsTable = _div([_table([_tbody(trsControls)],[['dir','className','propertiesTable']])]);
	_(parentDiv, [propsTable, _br(), create]);
	
	var dialogDiv = showDialog(_gtxt("Введите имя группы"), parentDiv, 270, 210, pos.left, pos.top);
}

var createGroupEditorProperties = function(div, isMap, layersTree)
{
	var elemProperties = (isMap) ? div.gmxProperties.properties : div.gmxProperties.content.properties,
		trs = [],
		_this = this;
        
    var rawTree = layersTree.treeModel.getRawTree();

	var title = _input(null,[['attr','value',typeof elemProperties.title != 'undefined' ? elemProperties.title : ''],['dir','className','inputStyle'],['css','width','206px']])
	
	var visibilityProperties = new GroupVisibilityPropertiesModel(
        elemProperties.list, 
        typeof elemProperties.ShowCheckbox === 'undefined' ? true : elemProperties.ShowCheckbox, 
        typeof elemProperties.initExpand === 'undefined' ? false : elemProperties.initExpand
    );
	var visibilityPropertiesView = GroupVisibilityPropertiesView(visibilityProperties, !isMap, !isMap);
	$(visibilityProperties).change(function()
	{
		elemProperties.list = visibilityProperties.isChildRadio();
		elemProperties.ShowCheckbox = visibilityProperties.isVisibilityControl();
		elemProperties.expanded = elemProperties.initExpand = visibilityProperties.isExpanded();
		
		var curBox = div.firstChild;
		if (!elemProperties.ShowCheckbox)
		{
			curBox.checked = true;
			_layersTree.visibilityFunc(curBox, true, false, false);
			
			curBox.style.display = 'none';
			curBox.isDummyCheckbox = true;
		}
		else
		{
			curBox.style.display = 'block';
			delete curBox.isDummyCheckbox;
		}
		
		if (isMap) {
			rawTree.properties = div.gmxProperties.properties;
		} else {
			layersTree.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
		}
		
		var ul = _abstractTree.getChildsUl(div.parentNode),
			checkbox = false;
		
		$(ul).children('li').each(function()
		{
			var box = _layersTree.updateListType(this, true);
			
			if (box.checked && !box.isDummyCheckbox)
				checkbox = box; // последний включенный чекбокс
		})
		
		if (checkbox && _layersTree.getLayerVisibility(checkbox))
			_layersTree.visibilityFunc(checkbox, true, div.gmxProperties.content ? div.gmxProperties.content.properties.list : div.gmxProperties.properties.list);		
	});
	
	title.onkeyup = function()
	{
		if (title.value == '')
		{
			$(title).addClass('error');
			
			return;
		}
		else
			$(title).removeClass('error');
		
		var span = $(div).find(".groupLayer")[0];
		
		removeChilds(span);
		
		_(span, [_t(title.value)]);
		
		if (isMap)
		{
			div.gmxProperties.properties.title = title.value;
			
			rawTree.properties = div.gmxProperties.properties;
		}
		else
		{
			div.gmxProperties.content.properties.title = title.value;
			
			layersTree.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
		}
		
		return true;
	}
		
	var addProperties = function(shownProperties)
	{		
		return _mapHelper.createPropertiesTable(shownProperties, elemProperties, {leftWidth: 100});
	};
	
	if (isMap)
	{
		var useAPI = _checkbox(elemProperties.UseKosmosnimkiAPI, 'checkbox'),
			useOSM = _checkbox(elemProperties.UseOpenStreetMap, 'checkbox'),
		//	showBalloons = _checkbox(elemProperties.ShowPropertiesBalloons, 'checkbox'),
			downloadVectors = _checkbox(elemProperties.CanDownloadVectors, 'checkbox'),
			downloadRasters = _checkbox(elemProperties.CanDownloadRasters, 'checkbox'),
            WMSLink = _a([_t(_gtxt('ссылка'))], [['attr', 'href', serverBase + 'TileService.ashx?map=' + elemProperties.name]]),
            WMSAccess = _checkbox(elemProperties.WMSAccess, 'checkbox'),
		//	searchVectors = _checkbox(elemProperties.CanSearchVector, 'checkbox'),
			defLat = _input(null,[['attr','value',elemProperties.DefaultLat != null && elemProperties.DefaultLat != 0 ? elemProperties.DefaultLat : ''],['dir','className','inputStyle'],['css','width','62px']]),
			defLong = _input(null,[['attr','value',elemProperties.DefaultLong != null && elemProperties.DefaultLong != 0 ? elemProperties.DefaultLong : ''],['dir','className','inputStyle'],['css','width','62px']]),
			defPermalink = _input(null,[['attr','value',elemProperties.ViewUrl != null ? elemProperties.ViewUrl : ''],['dir','className','inputStyle'],['css','width','206px']]),
			defZoom = _input(null,[['attr','value',elemProperties.DefaultZoom && elemProperties.DefaultZoom != 0 != null ? elemProperties.DefaultZoom : ''],['dir','className','inputStyle'],['css','width','60px']]),
			zoomDelta = _input(null,[['attr','value',elemProperties.MiniMapZoomDelta && elemProperties.MiniMapZoomDelta != 0 != null ? elemProperties.MiniMapZoomDelta : ''],['dir','className','inputStyle'],['css','width','60px']]),
			//zoomDelta = _input(null,[['attr','value',elemProperties.MiniMapZoomDelta && elemProperties.MiniMapZoomDelta != 0 != null ? elemProperties.MiniMapZoomDelta : ''],['dir','className','inputStyle'],['css','width','60px']]),
			onLoad = _textarea(null,[['dir','className','inputStyle'],['css','width','310px'],['css','height','250px']]),
			copyright = _input(null,[['attr','value',elemProperties.Copyright != null ? elemProperties.Copyright : ''],['dir','className','inputStyle'],['css','width','206px']]),
			minViewX = _input(null,[['attr','value',elemProperties.MinViewX != null && elemProperties.MinViewX != 0 ? elemProperties.MinViewX : ''],['dir','className','inputStyle'],['css','width','60px']]),
			minViewY = _input(null,[['attr','value',elemProperties.MinViewY != null && elemProperties.MinViewY != 0 ? elemProperties.MinViewY : ''],['dir','className','inputStyle'],['css','width','62px']]),
			maxViewX = _input(null,[['attr','value',elemProperties.MaxViewX != null && elemProperties.MaxViewX != 0 ? elemProperties.MaxViewX : ''],['dir','className','inputStyle'],['css','width','60px']]),
			maxViewY = _input(null,[['attr','value',elemProperties.MaxViewY != null && elemProperties.MaxViewY != 0 ? elemProperties.MaxViewY : ''],['dir','className','inputStyle'],['css','width','62px']]);
		
		onLoad.value = elemProperties.OnLoad != null ? elemProperties.OnLoad : '';
		
		useAPI.onclick = function()
		{
			div.gmxProperties.properties.UseKosmosnimkiAPI = this.checked;
			
			rawTree.properties = div.gmxProperties.properties;
		}
		useOSM.onclick = function()
		{
			div.gmxProperties.properties.UseOpenStreetMap = this.checked;
			
			rawTree.properties = div.gmxProperties.properties;
		}
		downloadVectors.onclick = function()
		{
			div.gmxProperties.properties.CanDownloadVectors = this.checked;
			
			rawTree.properties = div.gmxProperties.properties;
		}
		downloadRasters.onclick = function()
		{
			div.gmxProperties.properties.CanDownloadRasters = this.checked;
			
			rawTree.properties = div.gmxProperties.properties;
		}
        
        WMSAccess.onclick = function()
		{
			div.gmxProperties.properties.WMSAccess = this.checked;
			
			rawTree.properties = div.gmxProperties.properties;
            
            $(WMSLink).toggle(this.checked);
		}
		
		defLat.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.gmxProperties.properties.DefaultLat = Number(this.value);
				
				rawTree.properties = div.gmxProperties.properties;
			}
			
			return true;
		}
		defLong.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.gmxProperties.properties.DefaultLong = Number(this.value);
				
				rawTree.properties = div.gmxProperties.properties;
			}
			
			return true;
		}
		defPermalink.onkeyup = function()
		{
			div.gmxProperties.properties.ViewUrl = this.value;
			
			rawTree.properties = div.gmxProperties.properties;
			
			return true;
		}
		defZoom.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.gmxProperties.properties.DefaultZoom = Number(this.value);
			
				rawTree.properties = div.gmxProperties.properties;
			}
			
			return true;
		}
		zoomDelta.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.gmxProperties.properties.MiniMapZoomDelta = Number(this.value);
			
				rawTree.properties = div.gmxProperties.properties;
			}
			
			return true;
		}
		
		onLoad.onkeyup = function()
		{
			div.gmxProperties.properties.OnLoad = this.value;
			
			rawTree.properties = div.gmxProperties.properties;
			
			return true;
		}
		
		copyright.onkeyup = function()
		{
			div.gmxProperties.properties.Copyright = this.value;
			
			rawTree.properties = div.gmxProperties.properties;
			
			return true;
		}
		
		minViewX.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.gmxProperties.properties.MinViewX = Number(this.value);
				
				rawTree.properties = div.gmxProperties.properties;
			}
			
			return true;
		}
		
		minViewY.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.gmxProperties.properties.MinViewY = Number(this.value);
				
				rawTree.properties = div.gmxProperties.properties;
			}
			
			return true;
		}
		
		maxViewX.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.gmxProperties.properties.MaxViewX = Number(this.value);
				
				rawTree.properties = div.gmxProperties.properties;
			}
			
			return true;
		}
		
		maxViewY.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.gmxProperties.properties.MaxViewY = Number(this.value);
				
				rawTree.properties = div.gmxProperties.properties;
			}
			
			return true;
		}
        
        WMSAccess.style.verticalAlign = "middle";
        $(WMSLink).toggle(elemProperties.WMSAccess);
		
		var shownCommonProperties = [
										{name: _gtxt("Имя"), field: 'title', elem: title},
										{name: _gtxt("ID"), field: 'name'},
										{name: _gtxt("Копирайт"), field: 'Copyright', elem: copyright}
									]
									.concat(visibilityPropertiesView)
									.concat(
										[{name: _gtxt("Использовать KosmosnimkiAPI"), elem: useAPI},
										{name: _gtxt("Использовать OpenStreetMap"), elem: useOSM},
										{name: _gtxt("Ссылка (permalink)"), elem: defPermalink},
										{name: _gtxt("Масштабирование в миникарте"), elem: zoomDelta}]
									),
			shownPolicyProperties = [
										{name: _gtxt("Разрешить скачивание"), elem: _table([_tbody([_tr([_td([_t(_gtxt('Векторных слоев'))],[['css','width','100px'],['css','height','20px'],['css','paddingLeft','3px']]), _td([downloadVectors])]),
																					 				_tr([_td([_t(_gtxt('Растровых слоев'))],[['css','width','100px'],['css','height','20px'],['css','paddingLeft','3px']]), _td([downloadRasters])])])])},
                                        {name: _gtxt("WMS доступ"), elem: _div([WMSAccess, WMSLink])}
                                    ],
			shownViewProperties = [{name: _gtxt("Начальная позиция"), elem: _table([_tbody([_tr([_td([_span([_t(_gtxt('Широта'))],[['css','marginLeft','3px']]), _br(), defLat],[['css','width','70px']]),
																					   _td([_span([_t(_gtxt('Долгота'))],[['css','marginLeft','3px']]), _br(), defLong],[['css','width','70px']]),
																					   _td([_span([_t(_gtxt('Зум'))],[['css','marginLeft','3px']]), _br(), defZoom],[['css','width','68px']])])])])},
								{name: _gtxt("Граница"), elem:_table([_tbody([_tr([_td(null, [['css','width','70px']]), _td([_span([_t(_gtxt('Широта'))],[['css','marginLeft','3px']])],[['css','width','70px']]), _td([_span([_t(_gtxt('Долгота'))],[['css','marginLeft','3px']])],[['css','width','68px']])]), _tr([_td([_span([_t(_gtxt('Мин'))],[['css','marginLeft','3px']])]), _td([minViewY]), _td([minViewX])]), _tr([_td([_span([_t(_gtxt('Макс'))],[['css','marginLeft','3px']])]), _td([maxViewY]), _td([maxViewX])])])])}];
		
		var id = 'mapProperties' + String(Math.random()).substring(2, 12),
			tabMenu = _div([_ul([_li([_a([_t(_gtxt("Общие"))],[['attr','href','#common' + id]])]),
								 _li([_a([_t(_gtxt("Доступ"))],[['attr','href','#policy' + id]])]),
								 _li([_a([_t(_gtxt("Окно карты"))],[['attr','href','#view' + id]])]),
								 _li([_a([_t(_gtxt("Загрузка"))],[['attr','href','#onload' + id]])]),
								 _li([_a([_t(_gtxt("Плагины"))],[['attr','href','#plugins' + id]])])])]),
			divCommon = _div(null,[['attr','id','common' + id],['css','width','320px']]),
			divPolicy = _div(null,[['attr','id','policy' + id],['css','width','320px']]);
			divView = _div(null,[['attr','id','view' + id],['css','width','320px']]);
			divOnload = _div(null,[['attr','id','onload' + id],['css','width','320px']]);
			divPlugins = _div(null,[['attr','id','plugins' + id],['css','width','320px']]);
		
		_(tabMenu, [divCommon, divPolicy, divView, divOnload, divPlugins]);
		
		_(divCommon, [_table([_tbody(addProperties(shownCommonProperties))],[['css','width','100%'], ['dir','className','propertiesTable']])]);
		_(divPolicy, [_table([_tbody(addProperties(shownPolicyProperties))],[['css','width','100%'], ['dir','className','propertiesTable']])]);
		_(divView,   [_table([_tbody(addProperties(shownViewProperties))],  [['css','width','100%'], ['dir','className','propertiesTable']])]);
		_(divOnload, [onLoad])
        
        var mapPlugins = nsGmx.createPluginsEditor(divPlugins, _mapHelper.mapPlugins);
        $(mapPlugins).change(function()
        {
            _mapHelper.mapPlugins = [];
            mapPlugins.each(function(p)
            {
                _mapHelper.mapPlugins.push(p);
            });
        });
		
		return tabMenu;
	}
	else
	{
		var shownProperties = [{name: _gtxt("Имя"), field: 'title', elem: title}].concat(visibilityPropertiesView);

		return _div([_table([_tbody(addProperties(shownProperties))],[['css','width','100%']])],[['css','width','320px'], ['dir','className','propertiesTable']]);
	}
}

var _groupEditorsHash = {};

/** Создаёт диалог редактирование свойств группы. Есть проверка на создание дублирующих диалогов
 @param div {HTMLHNode} - элемент дерева, соответствующий редактируемой группе
*/
var createGroupEditor = function(div)
{
	var elemProperties = div.gmxProperties.content.properties
	
	if (_groupEditorsHash[elemProperties.GroupID])
		return;
	
	var pos = nsGmx.Utils.getDialogPos(div, true, 140),
		closeFunc = function()
		{
			delete _groupEditorsHash[elemProperties.GroupID];
			
			return false;
		};
	
	var canvas = createGroupEditorProperties(div, false, _layersTree);
	showDialog(_gtxt('Группа [value0]', elemProperties.title), canvas, 340, 160, pos.left, pos.top, null, closeFunc);
	_groupEditorsHash[elemProperties.GroupID] = true;
	
	canvas.parentNode.style.width = canvas.clientWidth + 'px';
}

var _mapEditorsHash = {};


/** Создаёт диалог редактирование свойств группы. Есть проверка на создание дублирующих диалогов
 @param div {HTMLHNode} - элемент дерева, соответствующий редактируемой карте
*/
var createMapEditor = function(div)
{
	var elemProperties = div.gmxProperties.properties,
		_this = this;
	
	if (_mapEditorsHash[elemProperties.MapID])
		return;
	
	var pos = nsGmx.Utils.getDialogPos(div, true, 530),
		closeFunc = function()
		{
			delete _mapEditorsHash[elemProperties.MapID];
			
			return false;
		};
	
	var canvas = createGroupEditorProperties(div, true, _layersTree);
	showDialog(_gtxt('Карта [value0]', elemProperties.title), canvas, 345, 330, pos.left, pos.top, null, closeFunc);
	_mapEditorsHash[elemProperties.MapID] = true;
	
	$(canvas).tabs({selected: 0});
	
	canvas.parentNode.style.width = canvas.clientWidth + 'px';
}

gmxCore.addModule('GroupEditor', {
    addSubGroup: addSubGroup,
    createGroupEditor: createGroupEditor,
    createMapEditor: createMapEditor
})

})();