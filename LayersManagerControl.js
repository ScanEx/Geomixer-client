//Управление показом списка слоёв и поиска по этому списку
var nsGmx = nsGmx || {};

(function(_){

var LayersListProvider = function(filtersProvider)
{
    var _this = this;
    $(filtersProvider).change(function()
    {
        $(_this).change();
    });
    
    var getQueryText = function()
    {
        var filterStrings = [];
        
        if (filtersProvider.getTitle() !== '')
            filterStrings.push("([Title] containsIC '" + filtersProvider.getTitle() + "' or [Name] = GetLayerName('" + filtersProvider.getTitle() + "'))");
        
        if (filtersProvider.getOwner() !== '')
            filterStrings.push("[OwnerNickname] containsIC '" + filtersProvider.getOwner() + "'");
        
        var types = filtersProvider.getTypes();
        var typeFilters = $.map(types, function(type) {
            if (type === 'catalog')
            {
                return "([LayerType]=LayerTypeCode('vector') AND [IsRasterCatalog]=true)"
            }
            else if (type)
            {
                return "[LayerType]=LayerTypeCode('" + type + "')";
            }
        })
        
        if (typeFilters.length > 0) 
            filterStrings.push('(' + typeFilters.join(' OR ') + ')');
            
        var dateBegin = filtersProvider.getDateBegin();
        var dateEnd = filtersProvider.getDateEnd();
        
        dateBegin && filterStrings.push("[DateCreate] >= '" + $.datepicker.formatDate('yy.mm.dd', dateBegin) + "'");
        dateEnd   && filterStrings.push("[DateCreate] < '"  + $.datepicker.formatDate('yy.mm.dd', dateEnd) + "'");
        
        var layerTags = filtersProvider.getTags();
        
        if (layerTags)
        {
            layerTags.each(function(id, tag, value)
            {
                if (tag)
                {
                    if (value !== '')
                        filterStrings.push("[" + tag + "] containsIC '" + value + "'");
                    else
                        filterStrings.push("PropertyExist('" + tag + "')");
                }
            });
        }
        
        return '&query=' + encodeURIComponent(filterStrings.join(' AND '));
    }
    
    this.getCount = function(callback)
    {
        var query = getQueryText();
        sendCrossDomainJSONRequest(serverBase + 'Layer/Search2.ashx?count=true' + query, function(response)
        {
            if (!parseResponse(response))
            {
                callback();
                return;
            }
            callback(response.Result.count);
        })
    }
    
    this.getItems = function(page, pageSize, sortParam, sortDec, callback)
    {
        this.getCountAndItems(page, pageSize, sortParam, sortDec, function(count, items)
        {
            callback(items);
        })
    }
    
    this.getCountAndItems = function(page, pageSize, sortParam, sortDec, callback)
    {
        var sortParams = {};
        sortParams[_gtxt("Имя")] = "title";
        sortParams[_gtxt("Дата создания")] = "datecreate";
        sortParams[_gtxt("Владелец")] = "ownernickname";
        
        var query = getQueryText();
        
        sendCrossDomainJSONRequest(serverBase + 'Layer/Search2.ashx?page=' + page + '&pageSize=' + pageSize + "&orderby=" + sortParams[sortParam] + " " + (sortDec ? "desc" : "") + query, function(response)
        {
            if (!parseResponse(response))
            {
                callback();
                return;
            }
            
            callback(response.Result.count, response.Result.layers);
        })
    }
}

var drawLayers = function(layer, params)
{
	var _params = $.extend({onclick: function(){ removeLayerFromList(); }, enableDragging: true, disabled: false}, params);
	var newLayerProperties = {properties:layer};
	
    var mapProperties = _layersTree.treeModel.getMapProperties();
	newLayerProperties.properties.mapName = mapProperties.name;
	newLayerProperties.properties.hostName = mapProperties.hostName;
	newLayerProperties.properties.visible = false;
    
    // newLayerProperties.properties.type = newLayerProperties.properties.type === 1 ? 'Vector' : 'Raster';
	
	if (newLayerProperties.properties.type == 'Vector')
		newLayerProperties.properties.styles = [{MinZoom:newLayerProperties.properties.VtMaxZoom, MaxZoom:20, RenderStyle:_mapHelper.defaultStyles[newLayerProperties.properties.GeometryType]}]
	else if (newLayerProperties.properties.type != 'Vector' && !newLayerProperties.properties.MultiLayerID)
		newLayerProperties.properties.styles = [{MinZoom:newLayerProperties.properties.MinZoom, MaxZoom:20}];
	
	var res = _layersTree.drawNode({type: 'layer', content:newLayerProperties}, false, 1),
		icon = res.firstChild.cloneNode(true),
		remove = makeImageButton("img/recycle.png", "img/recycle_a.png"),
		tr,
		tdRemove = (layer.Access == 'edit') ? _td([remove], [['css','textAlign','center']]) : _td(),
		removeLayerFromList = function()
		{
			var active = $(_queryMapLayers.buildedTree).find(".active");
			
            var gmxProperties = $(res).find("span[dragg]")[0].parentNode.parentNode.gmxProperties;
			if (active.length && (active[0].parentNode.getAttribute('MapID') || active[0].parentNode.getAttribute('GroupID'))){
                _layersTree.copyHandler(gmxProperties, active[0].parentNode, false, true)
            } else {
                _layersTree.copyHandler(gmxProperties, $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0], false, true);
            }
            $(res).addClass('gmx-disabled');
		},
		_this = this;
	
	_title(remove, _gtxt("Удалить"));
	
	res.firstChild.removeNode(true);
	
	remove.onclick = function()
	{
		if (confirm(_gtxt("Вы действительно хотите удалить этот слой?")))
		{
			var loading = loading = _div([_img(null, [['attr','src','img/progress.gif']]), _t('удаление...')], [['css','marginLeft','5px']]);
		
			$(remove.parentNode.parentNode).replaceWith(_tr([_td([loading], [['attr','colSpan', 5]])]))
            
            var deleteLayerHandler = function(response, id, flag)
            {
                if (!parseResponse(response))
                    return;
                
                if (response.Result == 'deleted')
                    $(_this.getDataProvider()).change();
                else
                    showErrorMessage(_gtxt("Ошибка!"), true, _gtxt("Слоя нет в базе"));
            }
			
			if (newLayerProperties.properties.MultiLayerID)
				sendCrossDomainJSONRequest(serverBase + "MultiLayer/Delete.ashx?WrapStyle=func&MultiLayerID=" + newLayerProperties.properties.MultiLayerID, deleteLayerHandler);
			else	
				sendCrossDomainJSONRequest(serverBase + "Layer/Delete.ashx?WrapStyle=func&LayerID=" + newLayerProperties.properties.LayerID, deleteLayerHandler);
		}
	}
	
	var span = $(res).find("span.layer")[0];
    
    if (_params.disabled)
            $(span).addClass('invisible');
	
	if (!_params.disabled && _params.onclick)
	{
		span.onclick = function()
		{
			_params.onclick({ elem: layer, scrollTable: _this });
		}
	}
    else
    {
        span.onclick = null;
        $(span).css('cursor', 'auto');
    }
    
    span.ondblclick = null;
	
	if (_params.enableDragging && !params.disabled)
	{
		$(res).find("span[dragg]").draggable(
		{
			helper: function(ev)
			{
				return _layersTree.dummyNode(ev.target)
			},
			cursorAt: { left: 5 , top: 10},
			cursor: 'move',
			delay: 200,
			appendTo: document.body
		});
	}
	
	var nameDivInternal = _div([res], [['css','position','absolute'], ['css','width','100%'],['css','padding',"1px 0px"], ['css','overflowX','hidden'],['css','whiteSpace','nowrap']]);
	var nameDiv = _div([nameDivInternal], [['css', 'position', 'relative'], ['css', 'height', '100%']]);
	
	tr = _tr([_td(), _td([icon], [['css','textAlign','center']]), _td([nameDiv]), _td([_t(layer.date)], [['css','textAlign','center'],['dir','className','invisible']]),  _td([_t(layer.Owner)], [['css','textAlign','center'],['dir','className','invisible']]), tdRemove]);
    
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this._fields[i].width;
	
	attachEffects(tr, 'hover')
	
	return tr;
}

/** Внутри контейнера помещает табличку со списком слоёв и контролами для фильтрации
* @param {HTMLNode} parentDiv Куда помещать контрол
* @param {String} name Уникальное имя этого инстанса
* @param {object} params Параметры отображения списка:
*
*  * fixType {String | Vector} Какой тип слоёв показывать. 'vector', 'raster', 'multilayer', 'catalog' или ''. Если '', то добавится контрол с выбором типа слоя. Вектор 
*  * enableDragging {Boolean}
*  * height {Integer} высота всего виджета. Если не указана, то будет применяться дефолтная высота (~460px)
*  * onclick {function({ elem: , scrollTable: })}
*/
var LayerManagerControl = function( parentDiv, name, params )
{
	var _params = $.extend({fixType: [], height: ''}, params);
    
    if (typeof _params.fixType === 'string')
        _params.fixType = [_params.fixType];
        
	var canvas = _div(null, [['attr','id','layersList']]),
		searchCanvas = _div(null, [['dir','className','layersSearchCanvas']]),
		_this = this;
	
	var layerName = _input(null, [['dir','className','inputStyle'],['css','width','185px']]),
		layerOwner = _input(null, [['dir','className','inputStyle'],['css','width','185px']]);
	
	var typeSel = nsGmx.Utils._select([_option([_t(_gtxt("Любой"))], [['attr','value','']]),
					   _option([_t(_gtxt("Векторный"))], [['attr','value','vector']]),
					   _option([_t(_gtxt("Растровый"))], [['attr','value','raster']]),
					   _option([_t(_gtxt("Мультислой"))], [['attr','value','multilayer']]),
					   _option([_t(_gtxt("Каталог растров"))], [['attr','value','catalog']])], [['dir','className','selectStyle'], ['css','width','100px']]);
                       
    var calendar = new nsGmx.CalendarWidget({
        minimized: false, 
        showSwitcher: false,
        dateInterval: new nsGmx.DateInterval({dateBegin: null, dateEnd: null})
    });
    // calendar.init('layerManager', {
        // minimized: false, 
        // showSwitcher: false,
        // dateBegin: null,
        // dateEnd: null
    // });
    
    var _disabledLayers = {};
					   
	_(searchCanvas, [_div([_table([_tbody([_tr([_td([_span([_t(_gtxt("Название"))],[['css','fontSize','12px']])]), _td([layerName])]),
										   _tr([_td([_span([_t(_gtxt("Владелец"))],[['css','fontSize','12px']])]),_td([layerOwner])]),
                                           _tr([_td([_span([_t(_gtxt("Период"))],[['css','fontSize','12px']])]),_td([calendar.canvas[0]])]),
										   _tr([_td([_span([_t(_gtxt("Тип"))],[['css','fontSize','12px']])]), _td([typeSel])])])])], [['css','marginBottom','10px']])]);
								
    $.each(_params.fixType, function(i, type) {
        if (type !== '')
            $("tr:last", searchCanvas).hide();
    });
	
	var tableParent = _div();
    
    var sortColumns = {};
    sortColumns[_gtxt('Имя')] = true;
    sortColumns[_gtxt('Владелец')] = true;
    sortColumns[_gtxt('Дата создания')] = true;

    // Временно сервер не поддерживает сортировку по типу
    // if (_params.fixType.length > 1 || _params.fixType[0] === '')
        // sortColumns[_gtxt('Тип')] = true;
	
    var tagsParent = _div(null, [['css', 'height', '100px'], ['css', 'overflow', 'auto']]);
    
    _(canvas, [_table([_tbody([_tr([
        _td([searchCanvas], [['css', 'width', '50%']]),
        _td([tagsParent])
    ])])], [['css', 'width', '100%']])]);
    
    var LayersFilterParams = (function()
    {
        var prevLayerName, prevLayerOwner;
        
        layerName.oninput = layerName.onkeyup = function()
        {
            if (this.value !== prevLayerName) {
                prevLayerName = this.value;
                $(pi).change();
            }
        }
        
        layerOwner.oninput = layerOwner.onkeyup = function()
        {
            if (this.value !== prevLayerOwner) {
                prevLayerOwner = this.value;
                $(pi).change();
            }
        }
        
        typeSel.onchange = function()
        {
            $(pi).change();
        }
            
        calendar.getDateInterval().on('change', function()
        {
            $(pi).change();
        });
        
        var _layerTags = null;
        
        var pi = {
            setTags: function(layerTags)
            {
                _layerTags = layerTags;
                $(_layerTags).change(function()
                {
                    $(pi).change();
                })
            },
            getTitle:     function() { return layerName.value; },
            getOwner:     function() { return layerOwner.value; },
            getDateBegin: function() { return calendar.getDateInterval().get('dateBegin'); },
            getDateEnd:   function() { return calendar.getDateInterval().get('dateEnd'); },
            getTags:      function() { return _layerTags; },
            getTypes:     function() { return _params.fixType.length > 0 ? _params.fixType : [$("option:selected", typeSel).val()]; }
        }
        
        return pi;
    })();
    
    nsGmx.TagMetaInfo.loadFromServer(function(tagsInfo)
    {
        var layerTags = new nsGmx.LayerTagsWithInfo(tagsInfo);
        new nsGmx.LayerTagSearchControl(layerTags, tagsParent, {inputWidth: 115});
        LayersFilterParams.setTags(layerTags);
    });
    
    var layersListProvider = new LayersListProvider(LayersFilterParams);
    var layersTable = new nsGmx.ScrollTable({height: _params.height ? _params.height - 130 : ''});
    layersTable.setDataProvider(layersListProvider);
    
	layersTable.createTable(tableParent, name, 0, 
		["", _gtxt("Тип"), _gtxt("Имя"), _gtxt("Дата создания"), _gtxt("Владелец"), ""], 
		['1%','5%','45%','24%','20%','5%'], 
		function(layer)
		{
            var curParams = $.extend( {}, _params, {disabled: layer.name in _disabledLayers } );
			return drawLayers.apply(this, [layer, curParams]);
		}, 
		sortColumns
	);

	_(canvas, [tableParent]);

	$(parentDiv).empty().append(canvas);
	
	layerName.focus();
    
    this.getScrollTable = function()
    {
        return layersTable;
    }
    
    /** Деактивировать слои
      @param layerNames {String|String[]} - массив имён слоёв (или просто имя), которые нужно сделать неактивными
    */
    this.disableLayers = function(layerNames)
    {
        if (!$.isArray(layerNames))
            layerNames = [layerNames];
           
        for (var k = 0; k < layerNames.length; k++)
            _disabledLayers[layerNames[k]] = true;
            
        layersTable.repaint();
    }
    
    /** Aктивировать слои
      @param layerNames {String|String[]} - массив имён слоёв (или просто имя), которые нужно сделать активными
    */
    this.enableLayers = function(layerNames)
    {
        if (!$.isArray(layerNames))
            layerNames = [layerNames];
        
        for (var k = 0; k < layerNames.length; k++)
            delete _disabledLayers[layerNames[k]];
            
        layersTable.repaint();
    }

    this.resize = function(h) {
        layersTable.updateHeight(h - 130);
    }
}

nsGmx.LayerManagerControl = LayerManagerControl;
nsGmx.drawLayers = drawLayers;

gmxCore.addModule('LayersManagerControl', {
    LayerManagerControl: LayerManagerControl,
    drawLayers: drawLayers
});

})(nsGmx.Utils._);