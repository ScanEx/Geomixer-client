//Управление показом списка слоёв и поиска по этому списку
var nsGmx = nsGmx || {};

(function(){

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
            filterStrings.push("@Title>\"" + filtersProvider.getTitle() + "\"");
        
        if (filtersProvider.getOwner() !== '')
            filterStrings.push("@Owner=\"" + filtersProvider.getOwner() + "\"");
        
        var type = filtersProvider.getType();
        if (type)
            filterStrings.push("@Type=\"" + type + "\"");
            
        var dateBegin = filtersProvider.getDateBegin();
        var dateEnd = filtersProvider.getDateEnd();
        
        if (dateBegin || dateEnd)
        {
            dateBegin = dateBegin ? dateBegin.valueOf()/1000 : "";
            dateEnd = dateEnd ? ((dateEnd.valueOf()/1000) + 23*3600 + 59*60 + 59): ""; //До конца суток: 23:59:59
            filterStrings.push("@Date=\"" + dateBegin + '-' + dateEnd + "\"");
        }
        
        var layerTags = filtersProvider.getTags();
        layerTags.each(function(id, tag, value)
        {
            if (tag)
                filterStrings.push('"' + tag + '">"' + value + '"');
        });
        
        return '&query=' + encodeURIComponent(filterStrings.join(' AND '));
    }
    
    this.getCount = function(callback)
    {
        var query = getQueryText();
        sendCrossDomainJSONRequest(serverBase + 'Layer/Search.ashx?count=true' + query, function(response)
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
        var sortParams = {};
        sortParams[_gtxt("Тип")] = "Type";
        sortParams[_gtxt("Имя")] = "Title";
        sortParams[_gtxt("Дата")] = "Date";
        sortParams[_gtxt("Владелец")] = "Owner";
        
        var query = getQueryText();
        
        sendCrossDomainJSONRequest(serverBase + 'Layer/Search.ashx?page=' + page + '&pageSize=' + pageSize + "&orderby=" + sortParams[sortParam] + " " + (sortDec ? "DESC" : "ASC") + query, function(response)
        {
            if (!parseResponse(response))
            {
                callback();
                return;
            }
            
            callback(response.Result.Layers);
        })
    }
}

var drawLayers = function(layer, params)
{
	var _params = $.extend({onclick: function(){ removeLayerFromList(); }, enableDragging: true}, params);
	var newLayerProperties = {properties:layer};
	
	newLayerProperties.properties.mapName = _mapHelper.mapProperties.name;
	newLayerProperties.properties.hostName = _mapHelper.mapProperties.hostName;
	newLayerProperties.properties.visible = false;
	
	if (newLayerProperties.properties.type == 'Vector')
		newLayerProperties.properties.styles = [{MinZoom:newLayerProperties.properties.MinZoom, MaxZoom:20, RenderStyle:_mapHelper.defaultStyles[newLayerProperties.properties.GeometryType]}]
	else if (newLayerProperties.properties.type != 'Vector' && !newLayerProperties.properties.MultiLayerID)
		newLayerProperties.properties.styles = [{MinZoom:newLayerProperties.properties.MinZoom, MaxZoom:20}];
	
	var res = _layersTree.drawNode({type: 'layer', content:newLayerProperties}, false, 1),
		icon = res.firstChild.cloneNode(true),
		remove = makeImageButton("img/recycle.png", "img/recycle_a.png"),
		tr,
		tdRemove = (layer.Access == 'edit') ? _td([remove], [['css','textAlign','center']]) : _td(),
		removeLayerFromList = function()
		{
			var active = $(_this.buildedTree).find(".active");
			
			if (active.length && (active[0].parentNode.getAttribute('MapID') || active[0].parentNode.getAttribute('GroupID')))
				_layersTree.copyHandler($(res).find("span[dragg]")[0], active[0].parentNode, false, true)
			else
				_layersTree.copyHandler($(res).find("span[dragg]")[0], $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0], false, true)
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
	
	if (_params.onclick)
	{
		span.onclick = function()
		{
			_params.onclick({ elem: layer, scrollTable: _this });
		}
	}
	
	if (_params.enableDragging)
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
	
	tr.removeLayerFromList = removeLayerFromList;
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this._fields[i].width;
	
	attachEffects(tr, 'hover')
	
	return tr;
}

/** 
Внутри контейнера помещает табличку со списком слоёв и контролами для фильтрации
 @param {HTMLNode} parentDiv Куда помещать контрол
 @param {String} name Уникальное имя этого инстанса
 @param {object} params Параметры отображения списка: <br/>
  * showType <br/>
  * enableDragging <br/>
  * onclick {function({ elem: , scrollTable: })}
 @returns {scrollTable} Контрол со списком слоёв
*/
var createLayersManagerInDiv = function( parentDiv, name, params )
{
	var _params = $.extend({showType: true}, params);
	var canvas = _div(null, [['attr','id','layersList']]),
		searchCanvas = _div(null, [['dir','className','searchCanvas']]),
		_this = this;
	
	var layerName = _input(null, [['dir','className','inputStyle'],['css','width','160px']]),
		layerOwner = _input(null, [['dir','className','inputStyle'],['css','width','160px']]);
	
	var dateBegin = _input(null,[['attr','id', name + 'DateBegin'],['dir','className','inputStyle'],['css','width','100px']]),
		dateEnd = _input(null,[['attr','id', name + 'DateEnd'],['dir','className','inputStyle'],['css','width','100px']]);
	
	
	var typeSel = _select([_option([_t(_gtxt("Любой"))], [['attr','value','']]),
					   _option([_t(_gtxt("Векторный"))], [['attr','value','vector']]),
					   _option([_t(_gtxt("Растровый"))], [['attr','value','raster']]),
					   _option([_t(_gtxt("Мультислой"))], [['attr','value','multilayer']])], [['dir','className','selectStyle'], ['css','width','100px']]);
					   
	_(searchCanvas, [_div([_table([_tbody([_tr([_td([_span([_t(_gtxt("Название"))],[['css','fontSize','12px']])],[['css','width','90px']]), _td([layerName],[['css','width','170px']]),_td([_span([_t(_gtxt("Начало периода"))],[['css','fontSize','12px']])],[['css','width','120px']]), _td([dateBegin])]),
										   _tr([_td([_span([_t(_gtxt("Владелец"))],[['css','fontSize','12px']])]),_td([layerOwner]), _td([_span([_t(_gtxt("Окончание периода"))],[['css','fontSize','12px']])]), _td([dateEnd])]),
										   _tr([_td([_span([_t(_gtxt("Тип"))],[['css','fontSize','12px']])]), _td([typeSel]), _td(), _td()])])],[['css','width','100%']])], [['css','marginBottom','10px']])]);
										   
	if (!_params.showType) 
		$("tr:last", searchCanvas).hide();
	
	_(canvas, [searchCanvas]);
	
	dateBegin.onfocus = dateEnd.onfocus = function()
	{
		try
		{
			this.blur();
		}
		catch(e){}
	}
	
	var tableParent = _div();
    
    var sortColumns = {};
    sortColumns[_gtxt('Имя')] = true;
    sortColumns[_gtxt('Владелец')] = true;
    sortColumns[_gtxt('Дата')] = true;
    
    if (_params.showType)
        sortColumns[_gtxt('Тип')] = true;
	
    var tagsParent = _div();
    _(canvas, [tagsParent]);
    var layerTags = new nsGmx.LayerTags();
    var layerTagSearchControl = new nsGmx.LayerTagSearchControl(layerTags, tagsParent);
    
    var LayersFilterParams = (function()
    {
        layerName.onkeyup = layerOwner.onkeyup = typeSel.onchange = dateBegin.onkeyup = dateEnd.onkeyup = function()
        {
            $(pi).change();
        }
        
        $(layerTags).change(function()
        {
            $(pi).change();
        })
        
        var pi = {
            getTitle:     function() { return layerName.value; },
            getOwner:     function() { return layerOwner.value; },
            getType:      function() { return $("option:selected", typeSel).val() },
            getDateBegin: function() { return $(dateBegin).datepicker('getDate') },
            getDateEnd:   function() { return $(dateEnd).datepicker('getDate') },
            getTags:      function() { return layerTags; }
        }
        
        return pi;
    })();
    
    var layersListProvider = new LayersListProvider(LayersFilterParams);
    var layersTable = new scrollTable();
    layersTable.setDataProvider(layersListProvider);
    
	layersTable.createTable(tableParent, name, 0, 
		["", _gtxt("Тип"), _gtxt("Имя"), _gtxt("Дата"), _gtxt("Владелец"), ""], 
		['1%','5%','45%','24%','20%','5%'], 
		function(layer)
		{
			return drawLayers.apply(this, [layer, _params]);
		}, 
		sortColumns
	);

	_(canvas, [tableParent]);
		
	$("#" + name + "DateBegin,#" + name + "DateEnd", canvas).datepicker(
	{
		beforeShow: function(input)
		{
	    	return {minDate: (input == dateEnd ? $(dateBegin).datepicker("getDate") : null), 
	        	maxDate: (input == dateBegin ? $(dateEnd).datepicker("getDate") : null)}; 
		},
		onSelect: function(dateText, inst) 
		{
			inst.input[0].onkeyup();
		},
		changeMonth: true,
		changeYear: true,
		showOn: "button",
		buttonImage: "img/calendar.png",
		buttonImageOnly: true,
		dateFormat: "dd.mm.yy"
	});
		
	$(parentDiv).empty().append(canvas);
	
	layerName.focus();
    
    return layersTable;
}

nsGmx.createLayersManagerInDiv = createLayersManagerInDiv;
nsGmx.drawLayers = drawLayers;

gmxCore.addModule('LayersManagerControl', {
    createLayersManagerInDiv: createLayersManagerInDiv,
    drawLayers: drawLayers
});

})();