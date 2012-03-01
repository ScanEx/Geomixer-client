(function(){

var mapLayersList = 
{
	mapLayersList:{}
}

var queryMapLayersList = function()
{
	this.builded = false;
	
	this.mapEvent = false;
}

queryMapLayersList.prototype = new leftMenu();

queryMapLayersList.prototype.load = function()
{
	_(this.workCanvas, [_table([_tbody([_tr([_td([_span([_t(_gtxt("Шкала прозрачности"))],[['css','marginLeft','15px'],['css','color','#153069'],['css','fontSize','12px']])]), _td([_queryMapLayers.rasterLayersSlider(_queryMapLayersList.workCanvas)])])])])]);
	
	var canvas = _div(null, [['attr','id','extendLayersList'],['css','marginLeft','10px']]),
		searchCanvas = _div(null, [['dir','className','searchCanvas']]),
		name = 'list',
		_this = this;
	
	var layerName = _input(null, [['dir','className','inputStyle'],['css','width','100%'], ['css', 'margin', '1px 0px']]),
		layerOwner = _input(null, [['dir','className','inputStyle'],['css','width','100%'], ['css', 'margin', '1px 0px']]);

	var intersectSel = _select(
							   [_option([_t(_gtxt("По границе экрана"))], [['attr','value','bounds']]),
								_option([_t(_gtxt("По центру экрана"))], [['attr','value','center']])], 
							[['dir','className','selectStyle'], ['css','width','100%'], ['css', 'margin', '1px 0px']]);
	
	this._isIntersectCenter = false;
							
	$(intersectSel).change(function()
	{
		_this._isIntersectCenter = this.value === 'center';
		_this.reloadList();
	});
	
	var typeSel = _select([_option([_t(_gtxt("Любой"))], [['attr','value','']]),
						   _option([_t(_gtxt("Векторный"))], [['attr','value','Vector']]),
						   _option([_t(_gtxt("Растровый"))], [['attr','value','Raster']])], [['dir','className','selectStyle'], ['css','width','100%'], ['css', 'margin', '1px 0px']]);
	
	var dateIntervalControl = new nsGmx.Calendar();
	
	//находим даты самого раннего и позднего слоёв
	var minDate = null;
	var maxDate = null;
	for (var k = 0; k < globalFlashMap.layers.length; k++)
		if (globalFlashMap.layers[k].properties.date)
		{
			var layerDate = $.datepicker.parseDate('dd.mm.yy', globalFlashMap.layers[k].properties.date);
			minDate = (minDate && minDate < layerDate) ? minDate : layerDate;
			maxDate = (maxDate && maxDate > layerDate) ? maxDate : layerDate;
		}
	
	dateIntervalControl.init('searchLayers', {
		minimized: false,
		showSwitcher: false,
		dateMin:   minDate,
		dateMax:   maxDate,
		dateBegin: minDate,
		dateEnd:   maxDate
	});
	
	_(searchCanvas, [_div([_table([_tbody([_tr([_td([_span([_t(_gtxt("Название"))],[['css','fontSize','12px']])],[['css','width','130px']]), _td([layerName])]),
											_tr([_td([_span([_t(_gtxt("Тип"))],[['css','fontSize','12px']])]),_td([typeSel])]),
											//_tr([_td([_span([_t(_gtxt("Начало периода"))],[['css','fontSize','12px']])]), _td([dateBegin])]),
											_tr([_td([_span([_t(_gtxt("Период"))],[['css','fontSize','12px']])]), _td([dateIntervalControl.canvas])]),
											_tr([_td([_span([_t(_gtxt("Пересечение"))],[['css','fontSize','12px']])]),_td([intersectSel])], [['dir', 'className', 'intersection']])
											])])], [['css','marginBottom','10px']])]);
	
	_(canvas, [searchCanvas]);
	
	var scrollDiv = $("<div></div>", {className: 'layersScroll'});
	var scrollCheckbox = _checkbox(false, 'checkbox');
	scrollDiv.append(scrollCheckbox).append($("<label></label>", {'for': 'otherEncoding'}).text(_gtxt("Пролистывать слои")));
	this._isLayersScrollActive = false;
	$(scrollCheckbox).change(function()
	{
		_this._isLayersScrollActive = scrollCheckbox.checked;
		if (scrollCheckbox.checked)
		{
			sliderDiv.show();
			_this._updateSliderVisibility(_this._scrollDiv.slider('option', 'value'));
		}
		else
			sliderDiv.hide();
	})
	
	var sliderDiv = $("<div></div>", {id: 'layersScrollSlider'}).hide();
	scrollDiv.append(sliderDiv);
	
	$(canvas).append(scrollDiv);
	
	var tableParent = _div(),
		sortFuncs = {};
	
	sortFuncs[_gtxt('Имя')] = [
				function(a,b){if (a._sort_title > b._sort_title) return 1; else if (a._sort_title < b._sort_title) return -1; else return 0},
				function(a,b){if (a._sort_title < b._sort_title) return 1; else if (a._sort_title > b._sort_title) return -1; else return 0}
			];
	sortFuncs[_gtxt('Тип')] = [
				function(a,b){if (a._sort_type > b._sort_type) return 1; else if (a._sort_type < b._sort_type) return -1; else return 0},
				function(a,b){if (a._sort_type < b._sort_type) return 1; else if (a._sort_type > b._sort_type) return -1; else return 0}
			];
	sortFuncs[_gtxt('Дата')]  = [
				function(a,b)
				{
					if (!a._sort_date || !b._sort_date)
						return 0;
					
					if (a._sort_date > b._sort_date) return 1; else if (a._sort_date < b._sort_date) return -1; else return 0;				
				},
				function(a,b)
				{
					if (!a._sort_date || !b._sort_date)
						return 0;
					
					if (b._sort_date > a._sort_date) return 1; else if (b._sort_date < a._sort_date) return -1; else return 0;
				}
			];
	
	_listTable.limit = 20;
	_listTable.pagesCount = 5;
    
	_listTable.createTable(tableParent, name, 310, [_gtxt("Тип"), _gtxt("Имя"), _gtxt("Дата")], ['10%','65%','25%'], this.drawExtendLayers, sortFuncs);
    _listTable.getDataProvider().setSortFunctions(sortFuncs);
	
	$(_listTable).bind('sortChange', function(){ _this._updateSlider()} );
	$(_listTable.getDataProvider()).change(function(){ _this._updateSlider()});
	
	var inputPredicate = function(value, fieldName, fieldValue)
		{
			if (!value.properties[fieldName])
				return false;
		
			return String(value.properties[fieldName]).toLowerCase().indexOf(fieldValue.toLowerCase()) > -1;
		},
		selectPredicate = function(value, fieldName, fieldValue)
		{
			if (!value.properties[fieldName])
				return false;
				
			return fieldValue.toLowerCase() == String(value.properties[fieldName]).toLowerCase();
		},
		beginDatePredicate = function(value, fieldName, fieldValue, beginDate, endDate)
		{
			var valueDate = value['_sort_date'];
			
			if (!valueDate)
				return false;
			
			if (endDate)
				return valueDate >= beginDate && valueDate <= endDate;
			else
				return valueDate >= beginDate;
		},
		endDatePredicate = function(value, fieldName, fieldValue, beginDate, endDate)
		{
			var valueDate = value['_sort_date'];
			
			if (!valueDate)
				return false;
			
			if (beginDate)
				return valueDate >= beginDate && valueDate <= endDate;
			else
				return valueDate <= endDate;
		};
	
	_listTable.getDataProvider().attachFilterEvents(layerName, 'title', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var filterFunc = function(value)
				{
					return inputPredicate(value, fieldName, fieldValue);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
	
	_listTable.getDataProvider().addFilter('DateBegin', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var beginDate = dateIntervalControl.getDateBegin(),
			endDate = dateIntervalControl.getDateEnd(),
			filterFunc = function(value)
				{
					return beginDatePredicate(value, fieldName, fieldValue, beginDate ? beginDate : null, endDate ? endDate : null);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})	
		
	_listTable.getDataProvider().addFilter('DateEnd', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var beginDate = dateIntervalControl.getDateBegin(),
			endDate = dateIntervalControl.getDateEnd(),
			filterFunc = function(value)
				{
					return endDatePredicate(value, fieldName, fieldValue, beginDate, endDate);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	});
	
	$(dateIntervalControl).change(function()
	{
		_listTable.getDataProvider().setFilterValue('DateBegin', dateIntervalControl.getDateBegin());
		_listTable.getDataProvider().setFilterValue('DateEnd', dateIntervalControl.getDateEnd());
	});
	
	_listTable.getDataProvider().attachSelectFilterEvents(typeSel, 'type', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var filterFunc = function(value)
				{
					return selectPredicate(value, fieldName, fieldValue);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
	
	var resize = function()
	{
		_listTable.tableParent.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';
		_listTable.tableBody.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 15 - 21 + 'px';
		_listTable.tableBody.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';

		_listTable.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 12 - 21 + 'px';
		
		_listTable.tableParent.style.height = canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - 25 - 10 - 10 + 'px';
		_listTable.tableBody.parentNode.parentNode.style.height = canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - 25 - 20 - 10 - 10 + 'px';
	}
	
	_(canvas, [tableParent]);
	_(this.workCanvas, [canvas]);
	
	_listTable.tableBody.parentNode.style.width = '100%';
	_listTable.tableParent.style.width = '330px';
	_listTable.tableBody.parentNode.parentNode.style.height = 'auto';
	_listTable.tableBody.parentNode.parentNode.style.overflowY = 'auto';
	_listTable.tableParent.style.height = 'auto';
	_listTable.tableParent.parentNode.lastChild.style.width = '333px';
	
	_listTable.tableHeader.firstChild.childNodes[1].style.textAlign = 'left';
}

//делает видимым только один слой с индексом nVisible
queryMapLayersList.prototype._updateSliderVisibility = function(nVisible)
{
    var curLayer = _listTable.getDataProvider().getOriginalItems()[nVisible];
	if (!this._isLayersScrollActive || typeof curLayer === 'undefined') return;
	
	var layerName = curLayer.properties.name;
	var baseMapName = window.baseMap.id;
	
	for (var k = 0; k < globalFlashMap.layers.length; k++)
		if (globalFlashMap.layers[k].properties.mapName !== baseMapName) //слои базовой карты не трогаем
	{
			var isVisible = layerName == globalFlashMap.layers[k].properties.name;
			if (isVisible !== globalFlashMap.layers[k].isVisible)
				globalFlashMap.layers[k].setVisible(isVisible);
		}
}

queryMapLayersList.prototype._updateSlider = function()
{
	if (typeof _listTable.getDataProvider().getOriginalItems().length == 0)
		return;

	var container = $("#layersScrollSlider");
	container.empty();
	var _this = this;
	var slideFunction = function(value)
		{
		_this._updateSliderVisibility(value)
		_listTable.setPage( Math.floor(value / (_listTable.limit)) );
	}
	
	this._scrollDiv = $("<div></div>");
	this._scrollDiv.slider({
		max: _listTable.getDataProvider().getOriginalItems().length - 1,
		slide: function(event, ui) { slideFunction(ui.value); }
	});
	
	
	var prevDiv = makeImageButton("img/prev.png", "img/prev_a.png");
	_title(prevDiv, _gtxt("Предыдущий слой"));
	prevDiv.onclick = function()
	{
		var curValue = _this._scrollDiv.slider('option', 'value');
		if ( curValue == _this._scrollDiv.slider('option', 'min') ) 
			return;
			
		_this._scrollDiv.slider( 'option', 'value', curValue - 1);
		slideFunction(curValue - 1);
	}
	
	var nextDiv = makeImageButton("img/next.png", "img/next_a.png");
	_title(nextDiv, _gtxt("Следующий слой"));
	nextDiv.onclick = function()
	{
		var curValue = _this._scrollDiv.slider('option', 'value');
		if ( curValue == _this._scrollDiv.slider('option', 'max') ) 
			return;
			
		_this._scrollDiv.slider( 'option', 'value', curValue + 1 );
		slideFunction(curValue + 1);
	}
	
	var table = $("<table></table>")
					.append($("<tr></tr>")
						.append($("<td></td>", {id: "scrollTD"}).append(this._scrollDiv))
						.append($("<td></td>").append(prevDiv))
						.append($("<td></td>").append(nextDiv))
					)
	
	container.append(table);
	
	if (_listTable.getDataProvider().getOriginalItems().length == 0)
		this._scrollDiv.slider('option', 'disabled', true);
	else
		this._updateSliderVisibility(0);
}

queryMapLayersList.prototype.drawExtendLayers = function(mapLayer)
{
	var elem = mapLayer.properties,
		span = _span([_t(elem.title)], [['dir','className','layer']]),
		layerElems = [],
		timer = null,
		box,
		clickFunc = function()
		{
			//_layersTree.setListActive(span);
			//_queryMapLayers.activeListLayer = elem.name;
			
			globalFlashMap.layers[elem.name].setVisible(true);
			
			box.checked = true;
		},
		dbclickFunc = function()
		{
			if (!_queryMapLayers.builded)
				mapLayers.mapLayers.load('layers');
			
			var layer = globalFlashMap.layers[elem.name];
		
			if (layer)
			{
				var minLayerZoom = _layersTree.getMinLayerZoom(layer);				
				_layersTree.layerZoomToExtent(layer.bounds, minLayerZoom);
			}
			
			/* временно отключили разворачиание дерева
			
			var div;
			
			if (elem.LayerID)
				div = $(_queryMapLayers.treeCanvas).find("div[LayerID='" + elem.LayerID + "']");
			else
				div = $(_queryMapLayers.treeCanvas).find("div[MultiLayerID='" + elem.MultiLayerID + "']");
			
			// слой еще не нарисован, нужно развернуть дерево
			// либо развернем все родительские группы
			var treeElem,
				groupParent = _queryMapLayers.treeCanvas;
			
			if (elem.LayerID)	
				treeElem = _mapHelper.findElem(_mapHelper.mapTree, "LayerID", elem.LayerID, []);
			else
				treeElem = _mapHelper.findElem(_mapHelper.mapTree, "MultiLayerID", elem.MultiLayerID, []);
			
			for (var i = treeElem.parents.length - 2; i >= 0; i--) // корень не считаем
			{
				if (!treeElem.parents[i].content.properties.expanded)
				{
					var group = $(groupParent).find("div[GroupID='" + treeElem.parents[i].content.properties.GroupID + "']")[0];
					
					if ($(group.parentNode.firstChild).hasClass('expandable-hitarea'))
						$(group.parentNode.firstChild).trigger("click");
					
					groupParent = group.parentNode;
				}
			}
			
			if (elem.LayerID)
				div = $(groupParent).find("div[LayerID='" + elem.LayerID + "']");
			else
				div = $(groupParent).find("div[MultiLayerID='" + elem.MultiLayerID + "']");
			
			var spanLayer = $(div[0]).find("span.layer")[0];
			
			_layersTree.setActive(spanLayer);
			
			var box = spanLayer.parentNode.parentNode.firstChild;
			
			box.checked = true;
			
			var parentParams = _layersTree.getParentParams(spanLayer.parentNode.parentNode.parentNode);
			
			_layersTree.visibilityFunc(box, true, parentParams.list);
			
		//	$(_queryMapLayers.treeButton).trigger("click");
			
			var scroll = getOffsetRect(spanLayer).top - $$('header').offsetHeight;
			
			if (scroll > 100)
				scroll = scroll - 100;
			
			$$('leftContent').scrollTop = scroll;
			
			*/
		};

	span.layerName = elem.name;
	span.type = elem.type;
	
	span.onclick = function()
	{
		if (timer)
			clearTimeout(timer);
		
		timer = setTimeout(clickFunc, 200)
	}
	
	span.ondblclick = function()
	{
		if (timer)
			clearTimeout(timer);
		
		timer = null;
		
		clickFunc();
		dbclickFunc();
	}
	
	disableSelection(span);
	
	var spanParent = _div([span],[['attr','titleDiv',true],['css','display',($.browser.msie) ? 'inline' : 'inline'],['css','position','relative'],['css','borderBottom','none'],['css','paddingRight','3px']]);

	if ($.browser.msie)
		spanParent.style.zIndex = 1;

	if (_queryMapLayers.activeListLayer == elem.name)
		$(spanParent).addClass("active");	

	box = _checkbox(globalFlashMap.layers[elem.name].isVisible, 'checkbox');
	
	box.className = 'box';
	if ($.browser.msie)
		box.style.margin = '-3px -2px 0px -2px';
	
	box.onclick = function()
	{
		globalFlashMap.layers[elem.name].setVisible(this.checked);
	}
	
	globalFlashMap.layers[elem.name].addListener("onChangeVisible", function(attr)
	{
		box.checked = attr;
	});
	
	if (elem.type == "Vector")
	{
		var icon = _mapHelper.createStylesEditorIcon(elem.styles, elem.GeometryType ? elem.GeometryType.toLowerCase() : 'polygon'),
		
		//layerElems = [box, icon, spanParent];
		layerElems = _table([_tbody([_tr([_td([box]), _td([icon]), _td([spanParent], [['css', 'width', '100%'], ['css','whiteSpace','nowrap']])])])], [['dir', 'className', 'listLayerTable']]);
	}
	else
		// layerElems = [box, spanParent];
		layerElems = _table([_tbody([_tr([_td([box]), _td([spanParent], [['css', 'width', '100%'], ['css','whiteSpace','nowrap']])])])], [['dir', 'className', 'listLayerTable']]);
	
	
	var icon = _img(null, [['attr','src', (elem.type == "Vector") ? 'img/vector.png' : 'img/rastr.png' ],['css','marginLeft','3px']]),
		tr,
		_this = this;
	
	var maxLayerWidth = this.tableHeader.firstChild.childNodes[1].offsetWidth + 'px';
	
	tr = _tr([_td([icon], [['css','textAlign','center']]), _td([_div([layerElems], [['css','width',maxLayerWidth],['css','overflowX','hidden'],['css','whiteSpace','nowrap']])]), _td([_t(elem.date)], [['css','textAlign','center'],['dir','className','invisible']])]);
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this._fields[i].width;
	
	attachEffects(tr, 'hover')
	
	return tr;
}

queryMapLayersList.prototype.attachMapChangeEvent = function()
{
	_queryMapLayersList.reloadList();
	
	var timer = null;
	
	this._listenerId = globalFlashMap.addListener("positionChanged", function()
	{
		if (timer)
			clearTimeout(timer);
			
		timer = setTimeout(function(){ _queryMapLayersList.reloadList(); }, 200)
	})
	
	this.mapEvent = true;
}

queryMapLayersList.prototype.detachMapChangeEvent = function()
{
    if ( typeof this._listenerId !== undefined )
        globalFlashMap.removeListener( "positionChanged", this._listenerId );
	
	this.mapEvent = false;
}

queryMapLayersList.prototype.reloadList = function()
{
	var extendLayers = [];
	
	//window.baseMap.id будет принудительно выставлен API при инициализации, даже если его нет в config.js
	var baseMapName = window.baseMap.id;
	
	for (var i = 0; i < globalFlashMap.layers.length; i++)
	{
		//не показываем слои из базовой подложки
		if (globalFlashMap.layers[i].properties.mapName === baseMapName)
			continue;
		
		var bounds = globalFlashMap.layers[i].bounds;
		
		var isIntersected = null;
		if (this._isIntersectCenter)
		{
			var x = globalFlashMap.getX();
			var y = globalFlashMap.getY();
			isIntersected = x > bounds.minX && x < bounds.maxX && y > bounds.minY && y < bounds.maxY;
		}
		else
		{
			var extend = globalFlashMap.getVisibleExtent();
			isIntersected = boundsIntersect(extend, bounds);
		}
		
		if (isIntersected)
		{
			// оптимизируем данные для сортировки
			
			var val = globalFlashMap.layers[i];
			
			val._sort_title = val.properties['title'];
			val._sort_type = val.properties['type'];
			val._sort_date = val.properties['date'] || false;
			
			if (val._sort_date)
			{
				var dateParts = val.properties['date'].split('.');
				
				if (dateParts.length != 3)
					val._sort_date = false;
				else
					val._sort_date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]).valueOf();
			}
			
			extendLayers.push(val)
		}
	}

	_listTable.start = 0;
	_listTable.reportStart = 0;
	
	_listTable.getDataProvider().setOriginalItems(extendLayers);	
}

var _queryMapLayersList = new queryMapLayersList();

mapLayersList.mapLayersList.load = function()
{
	var alreadyLoaded = _queryMapLayersList.createWorkCanvas(arguments[0], function()
	{
		if (_queryMapLayersList.mapEvent)
			_queryMapLayersList.detachMapChangeEvent();
		
		_layersTree.updateChildLayersMapVisibility($(_queryMapLayers.buildedTree.firstChild).children("[MapID]")[0])
	});
	
	if (!alreadyLoaded)
		_queryMapLayersList.load()
	
	if (!_queryMapLayersList.mapEvent)
		_queryMapLayersList.attachMapChangeEvent();
}
mapLayersList.mapLayersList.unload = function()
{
};

gmxCore.addModule('mapLayersList', {
    load: mapLayersList.mapLayersList.load,
    unload: mapLayersList.mapLayersList.unload
})

})();