var nsGmx = nsGmx || {};

(function(){

var BaseLayersControl = function(container, map) {
    var blm = map.baseLayersManager,
        lang = _translationsHash.getLanguage();
    
    $(container).append(
        '<table class="group-editor-blm-table">' +
            '<tr>' + 
                '<td class="group-editor-blm-title">' + _gtxt('Доступные подложки') + '</td>' +
                '<td class="group-editor-blm-title">' + _gtxt('Подложки карты') + '</td>' + 
            '</tr><tr>' + 
                '<td class="group-editor-blm-available"></td>' + 
                '<td class="group-editor-blm-map"></td>' + 
            '</tr>' + 
        '</table>'
    );
    
    var availContainer = $('<ul class="group-editor-blm-ul"></ul>').appendTo($('.group-editor-blm-available', container));
    var mapContainer = $('<ul class="group-editor-blm-ul"></ul>').appendTo($('.group-editor-blm-map', container));
    
    var constructItem = function(id, title) {
        if (title) {
            return $('<li class="group-editor-blm-item">' + title + '</li>').data('baseLayerID', id);
        } else {
            return $('<li class="group-editor-blm-item group-editor-blm-missing-item">' + id + '</li>').data('baseLayerID', id);
        }
    }
    
    var activeIDs = blm.getActiveIDs();
    
    blm.getAll().forEach(function(baseLayer) {
        if (activeIDs.indexOf(baseLayer.id) === -1) {
            var item = constructItem(baseLayer.id, baseLayer[lang]);
            availContainer.append(item);
        }
    })
    
    activeIDs.forEach(function(id) {
        var baseLayer = blm.get(id);
        mapContainer.append(constructItem(id, baseLayer && baseLayer[lang]));
    });
    
    var updateBaseLayers = function() {
        var activeIDs = [];
        mapContainer.children('li').each(function(index, elem) {
            activeIDs.push($(elem).data('baseLayerID'));
        })
        blm.setActiveIDs(activeIDs);
    }
    
    mapContainer.sortable({
        connectWith: '.group-editor-blm-available > ul',
        stop: updateBaseLayers
    });
    availContainer.sortable({
        connectWith: '.group-editor-blm-map > ul',
        stop: updateBaseLayers
    });
}

var GroupVisibilityPropertiesModel = Backbone.Model.extend({
    defaults: {
        isChildRadio: false,
        isVisibilityControl: true,
        isExpanded: false
    }
})

//возвращает массив описания элементов таблицы для использования в mapHelper.createPropertiesTable
//model {GroupVisibilityPropertiesModel} - ассоциированные параметры видимости
//showVisibilityCheckbox {bool} - добавлять ли возможность скрывать чекбокс видимости или нет
var GroupVisibilityPropertiesView = function( model, showVisibilityCheckbox, showExpanded )
{
	var _model = model;
	var boxSwitch = _checkbox(!_model.get('isChildRadio'), 'checkbox'),
		radioSwitch = _checkbox(_model.get('isChildRadio'), 'radio');
	var showCheckbox = _checkbox(_model.get('isVisibilityControl'), 'checkbox');
	var isExpanded = _checkbox(_model.get('isExpanded'), 'checkbox');
	
	showCheckbox.onclick = function()
	{
		_model.set('isVisibilityControl', this.checked );
	}
    
    isExpanded.onclick = function()
	{
		_model.set('isExpanded', this.checked );
	}
	
	boxSwitch.onclick = function()
	{
		this.checked = true;
		radioSwitch.checked = !this.checked;
		
		_model.set('isChildRadio', !this.checked);
	}
	
	radioSwitch.onclick = function()
	{
		this.checked = true;
		boxSwitch.checked = !this.checked;
		
		_model.set('isChildRadio', this.checked );
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
	
	var groupVisibilityProperties = new GroupVisibilityPropertiesModel();
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
                            list: groupVisibilityProperties.get('isChildRadio'), 
                            visible: true, 
                            ShowCheckbox: groupVisibilityProperties.get('isVisibilityControl'), 
                            expanded: groupVisibilityProperties.get('isExpanded'), 
                            initExpand: groupVisibilityProperties.get('isExpanded'), 
                            GroupID: nsGmx.Utils.generateUniqueID()
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

var createGroupEditorProperties = function(div, isMap, mainLayersTree)
{
	var elemProperties = (isMap) ? div.gmxProperties.properties : div.gmxProperties.content.properties,
		trs = [],
		_this = this;
        
    var rawTree = mainLayersTree.treeModel.getRawTree();

	var title = _input(null,[['attr','value',typeof elemProperties.title != 'undefined' ? elemProperties.title : ''],['dir','className','inputStyle'],['css','width','206px']])
	
	var visibilityProperties = new GroupVisibilityPropertiesModel(
        elemProperties.list, 
        typeof elemProperties.ShowCheckbox === 'undefined' ? true : elemProperties.ShowCheckbox, 
        typeof elemProperties.initExpand === 'undefined' ? false : elemProperties.initExpand
    );
	var visibilityPropertiesView = GroupVisibilityPropertiesView(visibilityProperties, !isMap, !isMap);
	visibilityProperties.on('change', function()
	{
		elemProperties.list = visibilityProperties.get('isChildRadio');
		elemProperties.ShowCheckbox = visibilityProperties.get('isVisibilityControl');
		elemProperties.expanded = elemProperties.initExpand = visibilityProperties.get('isExpanded');
        
        _layersTree.treeModel.updateNodeVisibility(mainLayersTree.findTreeElem(div).elem, null);
		
		var curBox = div.firstChild;
		if (!elemProperties.ShowCheckbox)
		{
			curBox.checked = true;
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
			mainLayersTree.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
		}
		
		var ul = _abstractTree.getChildsUl(div.parentNode),
			checkbox = false;
		
		$(ul).children('li').each(function()
		{
			var box = _layersTree.updateListType(this, true);
		})
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
			
			mainLayersTree.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
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
			defLang = $('<span class="defaultMapLangContainer">' + 
                            '<input type="radio" id="defRus" name="defLang" value="rus"></input><label for="defRus">rus</label>' + 
                            '<input type="radio" id="defEng" name="defLang" value="eng"></input><label for="defEng">eng</label>' + 
                        '</span>')[0],
            distUnit = $('<span class="defaultMapLangContainer">' + 
                            '<input type="radio" id="distUnitAuto" name="distUnit" value="auto"></input><label for="distUnitAuto">' + _gtxt('units.auto') + '</label>' + 
                            '<input type="radio" id="distUnitM" name="distUnit" value="m"></input><label for="distUnitM">' + _gtxt('units.m') + '</label>' + 
                            '<input type="radio" id="distUnitKm" name="distUnit" value="km"></input><label for="distUnitKm">' + _gtxt('units.km') + '</label>' + 
                        '</span>')[0],
            squareUnit = $('<span class="defaultMapLangContainer">' + 
                            '<input type="radio" id="squareUnitAuto" name="squareUnit" value="auto"></input><label for="squareUnitAuto">' + _gtxt('units.auto') + '</label>' + 
                            '<input type="radio" id="squareUnitM" name="squareUnit" value="m2"></input><label for="squareUnitM">' + _gtxt('units.m2') + '</label>' + 
                            '<input type="radio" id="squareUnitHa" name="squareUnit" value="ha"></input><label for="squareUnitHa">' + _gtxt('units.ha') + '</label>' + 
                            '<input type="radio" id="squareUnitKm" name="squareUnit" value="km2"></input><label for="squareUnitKm">' + _gtxt('units.km2') + '</label>' + 
                        '</span>')[0],
			downloadVectors = _checkbox(elemProperties.CanDownloadVectors, 'checkbox'),
			downloadRasters = _checkbox(elemProperties.CanDownloadRasters, 'checkbox'),
            WMSLink = _a([_t(_gtxt('ссылка'))], [['attr', 'href', serverBase + 'TileService.ashx?map=' + elemProperties.name]]),
            WMSAccess = _checkbox(elemProperties.WMSAccess, 'checkbox'),
			defLat = _input(null,[['attr','value',elemProperties.DefaultLat !== null ? elemProperties.DefaultLat : ''],['dir','className','inputStyle'],['css','width','62px']]),
			defLong = _input(null,[['attr','value',elemProperties.DefaultLong !== null ? elemProperties.DefaultLong : ''],['dir','className','inputStyle'],['css','width','62px']]),
			defPermalink = _input(null,[['attr','value',elemProperties.ViewUrl != null ? elemProperties.ViewUrl : ''],['dir','className','inputStyle'],['css','width','206px']]),
			defZoom = _input(null,[['attr','value',elemProperties.DefaultZoom != null ? elemProperties.DefaultZoom : ''],['dir','className','inputStyle'],['css','width','60px']]),
			onLoad = _textarea(null,[['dir','className','inputStyle'],['css','width','100%'],['css','height','100%'], ['css','display','block']]),
			copyright = _input(null,[['attr','value',elemProperties.Copyright != null ? elemProperties.Copyright : ''],['dir','className','inputStyle'],['css','width','206px']]),
			minViewX = _input(null,[['attr','value',elemProperties.MinViewX != null && elemProperties.MinViewX != 0 ? elemProperties.MinViewX : ''],['dir','className','inputStyle'],['css','width','60px']]),
			minViewY = _input(null,[['attr','value',elemProperties.MinViewY != null && elemProperties.MinViewY != 0 ? elemProperties.MinViewY : ''],['dir','className','inputStyle'],['css','width','62px']]),
			maxViewX = _input(null,[['attr','value',elemProperties.MaxViewX != null && elemProperties.MaxViewX != 0 ? elemProperties.MaxViewX : ''],['dir','className','inputStyle'],['css','width','60px']]),
			maxViewY = _input(null,[['attr','value',elemProperties.MaxViewY != null && elemProperties.MaxViewY != 0 ? elemProperties.MaxViewY : ''],['dir','className','inputStyle'],['css','width','62px']]),
            minZoom = _input(null,[['attr','value',elemProperties.MinZoom != null ? elemProperties.MinZoom : ''],['dir','className','inputStyle'],['css','width','62px']]),
            maxZoom = _input(null,[['attr','value',elemProperties.MaxZoom != null ? elemProperties.MaxZoom : ''],['dir','className','inputStyle'],['css','width','62px']]);
		
		onLoad.value = elemProperties.OnLoad != null ? elemProperties.OnLoad : '';
		
		useAPI.onclick = function()
		{
			div.gmxProperties.properties.UseKosmosnimkiAPI = this.checked;
			
			rawTree.properties = div.gmxProperties.properties;
		}
        
        $([useAPI, useOSM]).addClass('propertiesTable-checkbox');
        
        $('input[value=' + elemProperties.DefaultLanguage + ']', defLang).attr('checked', 'checked');
        $('input[value=' + elemProperties.DistanceUnit + ']', distUnit).attr('checked', 'checked');
        $('input[value=' + elemProperties.SquareUnit + ']', squareUnit).attr('checked', 'checked');
        
        $('input', defLang).change(function()
		{
			div.gmxProperties.properties.DefaultLanguage = this.value;
			rawTree.properties = div.gmxProperties.properties;
		})
        
        $('input', distUnit).change(function()
		{
			div.gmxProperties.properties.DistanceUnit = this.value;
			rawTree.properties = div.gmxProperties.properties;
            globalFlashMap.setDistanceUnit(this.value);
		})
        
        $('input', squareUnit).change(function()
		{
			div.gmxProperties.properties.SquareUnit = this.value;
			rawTree.properties = div.gmxProperties.properties;
            globalFlashMap.setSquareUnit(this.value);
		})
        
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
            div.gmxProperties.properties.DefaultLat = (this.value === '' || isNaN(Number(this.value))) ? null : Number(this.value);
            rawTree.properties = div.gmxProperties.properties;
			return true;
		}
		
        defLong.onkeyup = function()
		{
			div.gmxProperties.properties.DefaultLong = (this.value === '' || isNaN(Number(this.value))) ? null : Number(this.value);
            rawTree.properties = div.gmxProperties.properties;
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
            div.gmxProperties.properties.DefaultZoom = (this.value === '' || isNaN(Number(this.value))) ? null : Number(this.value);
            rawTree.properties = div.gmxProperties.properties;
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
        
        minZoom.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.gmxProperties.properties.MinZoom = Number(this.value) || null;
                
                rawTree.properties = div.gmxProperties.properties;
			}
			
			return true;
		}
        
        maxZoom.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.gmxProperties.properties.MaxZoom = Number(this.value) || null;
				
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
									//.concat(visibilityPropertiesView)
									.concat(
										[{name: _gtxt("Использовать KosmosnimkiAPI"), elem: useAPI},
										//{name: _gtxt("Использовать OpenStreetMap"), elem: useOSM},
										{name: _gtxt("Язык по умолчанию"), elem: defLang},
										{name: _gtxt("Единицы длины"), elem: distUnit},
										{name: _gtxt("Единицы площади"), elem: squareUnit},
										{name: _gtxt("Ссылка (permalink)"), elem: defPermalink}]
									),
			shownPolicyProperties = [
										{name: _gtxt("Разрешить скачивание"), elem: _table([_tbody([_tr([_td([_t(_gtxt('Векторных слоев'))],[['css','width','100px'],['css','height','20px'],['css','paddingLeft','3px']]), _td([downloadVectors])]),
																					 				_tr([_td([_t(_gtxt('Растровых слоев'))],[['css','width','100px'],['css','height','20px'],['css','paddingLeft','3px']]), _td([downloadRasters])])])])},
                                        {name: _gtxt("WMS доступ"), elem: _div([WMSAccess, WMSLink])}
                                    ],
			shownViewProperties = [
                {
                    name: _gtxt("Начальная позиция"), 
                    elem: _table([_tbody([_tr([
                                    _td([_span([_t(_gtxt('Широта'))],[['css','marginLeft','3px']]), _br(), defLat],[['css','width','70px']]),
                                    _td([_span([_t(_gtxt('Долгота'))],[['css','marginLeft','3px']]), _br(), defLong],[['css','width','70px']]),
                                    _td([_span([_t(_gtxt('Зум'))],[['css','marginLeft','3px']]), _br(), defZoom],[['css','width','68px']])
                                ])])])
                }, {
                    name: _gtxt("Граница"), 
                    elem:_table([_tbody([
                                _tr([
                                    _td(null, [['css','width','70px']]), 
                                    _td([_span([_t(_gtxt('Широта'))],[['css','marginLeft','3px']])],[['css','width','70px']]), 
                                    _td([_span([_t(_gtxt('Долгота'))],[['css','marginLeft','3px']])],[['css','width','68px']])]), 
                                _tr([
                                    _td([_span([_t(_gtxt('Мин'))],[['css','marginLeft','3px']])]), 
                                    _td([minViewY]), 
                                    _td([minViewX])]), 
                                _tr([
                                    _td([_span([_t(_gtxt('Макс'))],[['css','marginLeft','3px']])]), 
                                    _td([maxViewY]), 
                                    _td([maxViewX])])
                            ])])
                }, {
                    name: _gtxt("Мин. зум"),
                    elem: minZoom
                }, {
                    name: _gtxt("Макс. зум"),
                    elem: maxZoom
                }];
                                
		var id = 'mapProperties' + String(Math.random()).substring(2, 12),
			tabMenu = _div([_ul([_li([_a([_t(_gtxt("Общие"))],[['attr','href','#common' + id]])]),
								 _li([_a([_t(_gtxt("Подложки"))],[['attr','href','#baselayers' + id]])]),
								 _li([_a([_t(_gtxt("Доступ"))],[['attr','href','#policy' + id]])]),
								 _li([_a([_t(_gtxt("Поиск"))],[['attr','href','#search' + id]])]),
								 _li([_a([_t(_gtxt("Окно карты"))],[['attr','href','#view' + id]])]),
								 _li([_a([_t(_gtxt("Загрузка"))],[['attr','href','#onload' + id]])]),
								 _li([_a([_t(_gtxt("Плагины"))],[['attr','href','#plugins' + id]])])])]),
			divCommon     = _div(null,[['attr','id','common' + id],['css','width','320px']]),
            divBaseLayers = _div(null,[['attr','id','baselayers' + id],['dir','className','group-editor-tab-container']]),
			divPolicy     = _div(null,[['attr','id','policy' + id],['css','width','320px']]),
			divSearch     = _div(null,[['attr','id','search' + id],['dir','className','group-editor-tab-container'],['css','overflowY','scroll'], ['css','overflowX','hidden']]),
			divView       = _div(null,[['attr','id','view' + id],['css','width','320px']]),
			divOnload     = _div(null,[['attr','id','onload' + id],['dir','className','group-editor-tab-container']]),
			divPlugins    = _div(null,[['attr','id','plugins' + id],['css','width','320px']]);
		
		_(tabMenu, [divCommon, divBaseLayers, divPolicy, divSearch, divView, divOnload, divPlugins]);
        
        var baseLayersControl = new BaseLayersControl(divBaseLayers, globalFlashMap);
		
		_(divCommon, [_table([_tbody(addProperties(shownCommonProperties))],[['css','width','100%'], ['dir','className','propertiesTable']])]);
		_(divPolicy, [_table([_tbody(addProperties(shownPolicyProperties))],[['css','width','100%'], ['dir','className','propertiesTable']])]);
		_(divView,   [_table([_tbody(addProperties(shownViewProperties))],  [['css','width','100%'], ['dir','className','propertiesTable']])]);
		_(divOnload, [_div([onLoad], [['css','position', 'absolute'], ['css','top', '6px'], ['css','bottom', '6px'], ['css','left', '0px'], ['css','right', '10px']])]);
        
        var pluginsEditor = nsGmx.createPluginsEditor(divPlugins, _mapHelper.mapPlugins);
        
        var mapLayersTree = new layersTree({
            showVisibilityCheckbox: true, 
            allowActive: false, 
            allowDblClick: false, 
            showStyle: false,
            visibilityFunc: function(props, isVisible) {
                var origTreeNode = mainLayersTree.treeModel.findElem('LayerID', props.LayerID).elem;
                origTreeNode.content.properties.AllowSearch = isVisible;
            }
        });
        
        //формируем новое дерево - без не-векторных слоёв и пустых папок, 
        //в котором видимость слоя отражает возможность его скачивания
        var searchRawTree = mainLayersTree.treeModel.cloneRawTree(function(node) {
            if (node.type === 'layer') {
                var props = node.content.properties;
                if (props.type !== 'Vector') {
                    return null;
                }
                
                props.visible = !!props.AllowSearch;
                
                return node;
            }
            
            if (node.type === 'group') {
                var children = node.content.children;
                if (!children.length) {
                    return null;
                }
                
                var isVisible = false;
                for (var i = 0; i < children.length; i++) {
                    isVisible = isVisible || children[i].content.properties.visible;
                }
                
                node.content.properties.visible = isVisible;
                return node;
            }
        });
        
        var mapLayersDOM = mapLayersTree.drawTree(searchRawTree, 2);
        $('<div class="group-editor-search-title"/>').text(_gtxt('Выберите слои для поиска по атрибутам')).appendTo(divSearch);
		$(mapLayersDOM).treeview().appendTo(divSearch);
        
        tabMenu.updateFunc = function() {
            var props = div.gmxProperties.properties;
            props.UseKosmosnimkiAPI = useAPI.checked;
            props.UseOpenStreetMap = useOSM.checked;
            props.CanDownloadVectors = downloadVectors.checked;
            props.CanDownloadRasters = downloadRasters.checked;
            props.WMSAccess = WMSAccess.checked;
            
            props.DefaultLat = (isNaN(Number(defLat.value)) || defLat.value === '') ? null : Number(defLat.value);
            props.DefaultLong = (isNaN(Number(defLong.value)) || defLong.value === '') ? null : Number(defLong.value);
            
            props.ViewUrl = defPermalink.checked;
            
            props.DefaultZoom = (isNaN(Number(defZoom.value)) || defZoom.value === '') ? null : Number(defZoom.value);
            
            props.onLoad = onLoad.value;
            props.Copyright = copyright.value;
            
            props.MinViewX = isNaN(Number(minViewX.value)) ? null : Number(minViewX.value);
            props.MinViewY = isNaN(Number(minViewY.value)) ? null : Number(minViewY.value);
            props.MaxViewX = isNaN(Number(maxViewX.value)) ? null : Number(maxViewX.value);
            props.MaxViewY = isNaN(Number(maxViewY.value)) ? null : Number(maxViewY.value);
            props.MaxZoom  = isNaN(Number(maxZoom.value))  ? null : (Number(maxZoom.value) || null);
            props.MinZoom  = isNaN(Number(minZoom.value))  ? null : (Number(minZoom.value) || null);
            
            rawTree.properties = props;
            
            pluginsEditor.update();
        }
        
        tabMenu.closeFunc = function() {
            pluginsEditor.closeParamsDialogs();
        }
		
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

window._mapEditorsHash = {};


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
			canvas.updateFunc();
            canvas.closeFunc();
			return false;
		};
	
	var canvas = createGroupEditorProperties(div, true, _layersTree);
	showDialog(_gtxt('Карта [value0]', elemProperties.title), canvas, 420, 340, pos.left, pos.top, null, closeFunc);
	_mapEditorsHash[elemProperties.MapID] = {
        update: canvas.updateFunc
    };
	
	$(canvas).tabs({active: 0});
	
	canvas.parentNode.style.width = canvas.clientWidth + 'px';
}

gmxCore.addModule('GroupEditor', {
    addSubGroup: addSubGroup,
    createGroupEditor: createGroupEditor,
    createMapEditor: createMapEditor
})

})();