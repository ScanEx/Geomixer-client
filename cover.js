/** 
* @name cover
* @namespace Объединяет дополнительные к вьюеру классы, работающие с диапазоном дат. Почти все классы могут использоваться независимо.
*/
(function($){

_translationsHash.addtext("rus", {
							"calendarWidget.Custom" : "Произвольный",
							"calendarWidget.Day" : "День",
							"calendarWidget.Week" : "Неделя",
							"calendarWidget.Month" : "Месяц",
							"calendarWidget.Year" : "Год",
							"calendarWidget.EveryYear" : "Ежегодно",
							"searchBbox.SearchInArea" : "Искать в области",
							"searchBbox.CancelSearchInArea" : "Отменить поиск по области",
							"firesWidget.FireSpots.Description" : "Очаги пожаров",
							"firesWidget.Burnt.Description" : "Границы гарей",
							"firesWidget.DialyCoverage.Description" : "Ежедневное спутниковое покрытие",
							"firesWidget.tooManyDataWarning" : "Слишком много данных - сократите область поиска!",
							"calendarWidget.Period" : "Период"
						 });
						 
_translationsHash.addtext("eng", {
							"calendarWidget.Custom" : "Custom",
							"calendarWidget.Day" : "Day",
							"calendarWidget.Week" : "Week",
							"calendarWidget.Month" : "Month",
							"calendarWidget.Year" : "Year",
							"calendarWidget.EveryYear" : "Every year",
							"searchBbox.SearchInArea" : "Search in area",
							"searchBbox.CancelSearchInArea" : "Cancel search in area",
							"firesWidget.FireSpots.Description" : "Fire spots",
							"firesWidget.Burnt.Description" : "Fire areas",
							"firesWidget.DialyCoverage.Description" : "Daily satellite coverage",
							"firesWidget.tooManyDataWarning" : "Too much data - downsize search area!",
							"calendarWidget.Period" : "Period"
						 });

var _getLayersInGroup = function(map, mapTree, groupTitle)
{
	var res = {};
	var visitor = function(treeElem, isInGroup)
	{
		if (treeElem.type === "layer" && isInGroup)
		{
			res[treeElem.content.properties.name] = map.layers[treeElem.content.properties.name];
		}
		else if (treeElem.type === "group")
		{
			isInGroup = isInGroup || treeElem.content.properties.title == groupTitle;
			var a = treeElem.content.children;
			for (var k = a.length - 1; k >= 0; k--)
				visitor(a[k], isInGroup);
		}
	}

	visitor( {type: "group", content: { children: mapTree.children, properties: {} } }, false );
	return res;
}

/** Bbox, который может быть пустым или занимать весь мир
 @memberOf cover
 @class
 @param param Объект {minX, maxX, minY, maxY}, если нормальный bbox, BoundsExt.EMPTY - если пустое множество,  BoundsExt.WHOLE_WORLD - если весь мир.
*/
var BoundsExt = function( param )
{
	var _isEmpty = false;
	var _isWholeWorld = true;
	var _bounds = null;
	
	if (typeof param !== 'undefined')
	{
		if (param === BoundsExt.EMPTY)
			_isEmpty = true;
		else if (param !== BoundsExt.WHOLE_WORLD && typeof param === "object")
		{
			_isWholeWorld = false;
			_bounds = param;
		}
	}
	
	this.isEmpty = function(){ return _isEmpty; };
	this.isWholeWorld = function(){ return _isWholeWorld; };
	this.getBounds = function(){ return _bounds; };
	
	this.isEqual = function( bounds ) 
	{
		if ( _isEmpty && bounds.isEmpty() ) return true;
		if ( _isWholeWorld && bounds.isWholeWorld() ) return true;
		
		if ( _isEmpty || bounds.isEmpty() || _isWholeWorld || bounds.isWholeWorld() )
			return false;
			
		var b = bounds.getBounds();
		return _bounds.maxX == b.maxX && _bounds.maxY == b.maxY && _bounds.minX == b.minX && _bounds.minY == b.minY;
	};
	
	this.clone = function()
	{
		var param = _bounds;
		if ( _isEmpty ) param = BoundsExt.EMPTY;
		if ( _isWholeWorld ) param = BoundsExt.WHOLE_WORLD;
		return new BoundsExt( param );
	}
	
	this.getIntersection = function( bounds )
	{
		if ( _isEmpty || bounds.isEmpty() )
			return new BoundsExt(BoundsExt.EMPTY);
			
		if ( _isWholeWorld )
			return bounds.clone();
			
		if ( bounds.isWholeWorld() )
			return this.clone();
			
		var b = bounds.getBounds();
		
		if ( !boundsIntersect(_bounds, b) )
		{
			return new BoundsExt(BoundsExt.EMPTY);
		}
			
		return new BoundsExt({
			minX: Math.max(_bounds.minX, b.minX),
			maxX: Math.min(_bounds.maxX, b.maxX),
			minY: Math.max(_bounds.minY, b.minY),
			maxY: Math.min(_bounds.maxY, b.maxY)
		});
	}
}
BoundsExt.EMPTY = "empty";
BoundsExt.WHOLE_WORLD = "world";

var DatePeriod = function()
{
	this.getDateBegin = function(){};
	this.getDateEnd = function(){};
	this.setDateBegin = function(dateBegin){};
	this.setDateEnd = function(dateEnd){};
	this.setDatePeriod = function(datePeriod){};
}

/**
 @memberOf cover
 @class Контрол для задания диапазона дат. Сontrols: два календарика, выбор периода, галочка с выбором года
*/
var Calendar = function()
{
	/** Если изменилась хотя бы одна из дат
	  @name cover.Calendar.change
	  @event
	 */
	 
	this.dateBegin = null;
	this.dateEnd = null;
	
	this.lazyDate = null;
	
	this.lazyDateInited = false;
	
	this.yearBox = null;
	
	//public interface
	
	/**
	 * @function
	 */
	this.getDateBegin = function() { return $(this.dateBegin).datepicker("getDate"); }
	
	/**
	 * @function
	 */	
	this.getDateEnd = function() { return $(this.dateEnd).datepicker("getDate"); }
	
	/**
	 * @function
	 */	
	this.saveState = function()
	{
		return {
			dateBegin: this.getDateBegin().valueOf(),
			dateEnd: this.getDateEnd().valueOf(),
			lazyDate: this.lazyDate.value,
			year: this.yearBox.checked
		}
	}
	
	/**
	 * @function
	 * @param {string} data
	 */
	this.loadState = function( data )
	{
		$(this.dateBegin).datepicker("setDate", new Date(data.dateBegin));
		$(this.dateEnd).datepicker("setDate", new Date(data.dateEnd));
		this.lazyDate.value = data.lazyDate;
		this.yearBox.checked = data.year;
	}	
}

/**
 * Инициализирует календарь.
 * @function
 * @param {Object} params Параметры календаря: <br/>
 * dateMin, dateMax - {Date} граничные даты для календарей <br/>
 * dateFormat - {String} формат даты
 */
Calendar.prototype.init = function( params )
{
	var _this = this;
	
	this.lazyDate = _select([_option([_t(_gtxt("calendarWidget.Custom"))],[['attr','value','']]),
								_option([_t(_gtxt("calendarWidget.Day"))],[['attr','value','day']]),
								_option([_t(_gtxt("calendarWidget.Week"))],[['attr','value','week']]),
								_option([_t(_gtxt("calendarWidget.Month"))],[['attr','value','month']]),
								_option([_t(_gtxt("calendarWidget.Year"))],[['attr','value','year']])
							   ],[['css','width','100px'],['dir','className','selectStyle'],['css','marginBottom','4px']]);
	
	// значение по умолчанию
	this.lazyDate.value = 'day';
	
	this.yearBox = _checkbox(false, 'checkbox');

	this.yearBox.className = 'box';
	if ($.browser.msie)
		this.yearBox.style.margin = '-3px -2px 0px -1px';
	else
		this.yearBox.style.marginLeft = '3px'
	
	_title(this.yearBox, _gtxt("calendarWidget.EveryYear"));
	
	this.dateBegin = _input(null,[['dir','className','inputStyle'],['css','width','100px']]);
	this.dateEnd = _input(null,[['dir','className','inputStyle'],['css','width','100px']]);
	
	this.dateMin = params.dateMin;
	this.dateMax = params.dateMax;
	this.dateMax.setHours(23);
	this.dateMax.setMinutes(59);
	this.dateMax.setSeconds(59);
	
	$([this.dateBegin, this.dateEnd]).datepicker(
	{
		// beforeShow: function(input)
		// {
	    	// return {
	    			// minDate: (input == _this.dateEnd ? $(_this.dateBegin).datepicker("getDate") : _this.dateMin), 
	        		// maxDate: (input == _this.dateBegin ? $(_this.dateEnd).datepicker("getDate") : _this.dateMax)
	        		// }; 
		// },
		onSelect: function(dateText, inst) 
		{
			_this.selectFunc(inst);
			$(_this).trigger('change');
		},
		showAnim: 'fadeIn',
		changeMonth: true,
		changeYear: true,
		minDate: new Date(this.dateMin.valueOf()),
		maxDate: new Date(this.dateMax.valueOf()),
		dateFormat: params.dateFormat
	});
	
	$(this.dateEnd).datepicker("setDate", new Date());
	$(this.dateBegin).datepicker("setDate", this.getBeginByEnd());
}

Calendar.prototype.fixDate = function(date)
{
	date.setHours(12);
	
	return date;
}

Calendar.prototype.fixDay = function(day)
{
	if (day == 0)
		return 6;
	else
		return day - 1;
}

Calendar.prototype.daysAtMonth = function(month, year)
{
	var leap = ( ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0) ) ? 1 : 0,
		days = [31, 28 + leap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	return days[month - 1];
}

Calendar.prototype.daysAtYear = function(year)
{
	var leap = ( ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0) ) ? 1 : 0;

	return 365 + leap;
}

Calendar.prototype.getBeginByEnd = function(endDate)
{
	var end = endDate ? endDate : $(this.dateEnd).datepicker("getDate");
	this.fixDate(end)
	
	switch(this.lazyDate.value)
	{
		case '':
			return $(this.dateBegin).datepicker("getDate");
		case 'day': 
			return end;
		case 'week':
			return new Date(end.valueOf() - this.fixDay(end.getDay()) * 24 * 3600 * 1000);
		case 'month': 
			return new Date(end.getFullYear(), end.getMonth(), 1, 12, 0, 0);
		case 'year':
			return new Date(end.getFullYear(), 0, 1, 12, 0, 0)
	}
}

Calendar.prototype.getEndByBegin = function(beginDate)
{
	var begin = beginDate ? beginDate : $(this.dateBegin).datepicker("getDate");
	this.fixDate(begin)
	
	switch(this.lazyDate.value)
	{
		case '':
			return $(this.dateEnd).datepicker("getDate");
		case 'day': 
			return begin;
		case 'week':
			return new Date(begin.valueOf() + (6 - this.fixDay(begin.getDay())) * 24 * 3600 * 1000);
		case 'month': 
			return new Date(begin.getFullYear(), begin.getMonth(), this.daysAtMonth(begin.getMonth() + 1, begin.getFullYear()), 12, 0, 0);
		case 'year':
			return new Date(begin.getFullYear(), 11, 31, 12, 0, 0)
	}
}

Calendar.prototype.lastPeriodDate = function()
{
	var begin = $(this.dateBegin).datepicker("getDate");
	this.fixDate(begin)
	
	switch(this.lazyDate.value)
	{
		case '':
			return $(this.endBegin).datepicker("getDate");
		case 'day': 
			return begin;
		case 'week':
			var last = new Date(begin.valueOf() + 6 * 24 * 3600 * 1000);
			return new Date(last.getFullYear(), last.getMonth(), last.getDate(), 12, 0, 0);
		case 'month':
			var last = new Date(begin.valueOf() + (this.daysAtMonth(begin.getMonth() + 1, begin.getFullYear()) - 1) * 24 * 3600 * 1000);
			return new Date(last.getFullYear(), last.getMonth(), last.getDate(), 12, 0, 0);
		case 'year':
			var last = new Date(begin.valueOf() + (this.daysAtYear(begin.getFullYear()) - 1) * 24 * 3600 * 1000);
			return new Date(last.getFullYear(), last.getMonth(), last.getDate(), 12, 0, 0);
	}
}

Calendar.prototype.updateBegin = function()
{
	$(this.dateBegin).datepicker("setDate", this.getBeginByEnd());
}

Calendar.prototype.updateEnd = function()
{
	$(this.dateEnd).datepicker("setDate", this.getEndByBegin());
}

Calendar.prototype.getCurrInterval = function()
{
	return 1000*60*60*24 * (this.rangeIndexs[this.currRangeIndex].limit)
}

Calendar.prototype.firstClickFunc = function()
{
	var begin = $(this.dateBegin).datepicker("getDate"),
		end = $(this.dateEnd).datepicker("getDate"),
		newDateBegin,
		newDateEnd;
	
	this.fixDate(begin);
	this.fixDate(end);
	
	if (this.yearBox.checked)
	{
		if (end.valueOf() - begin.valueOf() > 1000*60*60*24 * 365)
			return;
		
		newDateBegin = new Date(begin.getFullYear() - 1, begin.getMonth(), begin.getDate());
		newDateEnd = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
		
		if (newDateBegin < this.dateMin)
			return;
		
		$(this.dateBegin).datepicker("setDate", newDateBegin);
		$(this.dateEnd).datepicker("setDate", newDateEnd);
	}
	else
	{
		if (this.lazyDate.value == '')
		{
			var period = end.valueOf() - begin.valueOf();
			
			newDateBegin = new Date(begin.valueOf() - 1000*60*60*24);
			newDateEnd = new Date(begin.valueOf() - 1000*60*60*24 - period);
			
			if (newDateBegin < this.dateMin)
				return;
			
			$(this.dateEnd).datepicker("setDate", newDateBegin);
			$(this.dateBegin).datepicker("setDate", newDateEnd);
		}
		else
		{
			newDateEnd = new Date(begin.valueOf() - 1000*60*60*24);
			newDateBegin = this.getBeginByEnd(newDateEnd);
			
			if (newDateBegin < this.dateMin)
			{
				return;
			}
			
			$(this.dateEnd).datepicker("setDate", newDateEnd);
			
			this.updateBegin();
		}
	}
	
	$(this).trigger('change');
}

Calendar.prototype.lastClickFunc = function()
{
	var begin = $(this.dateBegin).datepicker("getDate"),
		end = $(this.dateEnd).datepicker("getDate"),
		newDateBegin,
		newDateEnd;

	this.fixDate(begin);
	this.fixDate(end);
	
	if (this.yearBox.checked)
	{
		if (end.valueOf() - begin.valueOf() > 1000*60*60*24 * 365)
			return;
		
		newDateBegin = new Date(begin.getFullYear() + 1, begin.getMonth(), begin.getDate());
		newDateEnd = new Date(end.getFullYear() + 1, end.getMonth(), end.getDate());
		
		if (newDateEnd > this.dateMax)
			return;
		
		$(this.dateBegin).datepicker("setDate", newDateBegin);
		$(this.dateEnd).datepicker("setDate", newDateEnd);
	}	
	else
	{
		if (this.lazyDate.value == '')
		{
			var period = end.valueOf() - begin.valueOf();
			
			newDateBegin = new Date(end.valueOf() + 1000*60*60*24);
			newDateEnd = new Date(end.valueOf() + 1000*60*60*24 + period);
			
			if (newDateEnd > this.dateMax)
				return;
			
			$(this.dateBegin).datepicker("setDate", newDateBegin);
			$(this.dateEnd).datepicker("setDate", newDateEnd);
		}
		else
		{
			newDateBegin = new Date(end.valueOf() + 1000*60*60*24);
			newDateEnd = this.getEndByBegin(newDateBegin);
			
			if (newDateEnd > this.dateMax)
			{
				return;
			}
			
			$(this.dateBegin).datepicker("setDate", newDateBegin);
			
			this.updateEnd();
		}
	}
	
	$(this).trigger('change');
}

Calendar.prototype.selectFunc = function(inst)
{
	if (this.lazyDate.value != '')
	{
		if (inst.input[0] == this.dateEnd)
			this.updateBegin();
		else
			this.updateEnd();
	}
};

/**
* @memberOf cover
* @class Фильтрует слои со спутниковыми покрытиями по интервалу дат и облачности
*/
var CoverControl = function()
{
	this.cloudsIndexes = [];
	this.currCloudsIndex = 2;
}

/**
* @function
*/
CoverControl.prototype.saveState = function()
{
	return { currCloudsIndex: this.currCloudsIndex };
}

/**
* @function
*/
CoverControl.prototype.loadState = function( data )
{
	this.currCloudsIndex = data.currCloudsIndex;
	
	$("#MapCalendar .ui-slider").slider("value", data.currCloudsIndex );
	_title($("#MapCalendar .ui-slider")[0].firstChild, this.cloudsIndexes[data.currCloudsIndex].name);
}

/** Перефильтровывает слои при смене дат
* @function
*/
CoverControl.prototype.loadForDates = function(dateBegin, dateEnd)
{
	this.dateBegin = dateBegin;
	this.dateEnd = dateEnd;
	
	this.setFilters();
}

/**
* @function
* @param {Array} coverLayers Массив имён слоёв для фильтрации
* @param {String} dateAttribute Имя аттрибута слоёв с датой
* @param {String} cloudsAttribute Имя аттрибута слоёв с облачностью
* @param {Array} icons Массив с именами иконок для облачности
* @param {Integer} initCloudIndex Начальная облачность
*/
CoverControl.prototype.init = function(coverLayers, dateAttribute, cloudsAttribute, icons, initCloudIndex)
{
	this.coverLayers = [];
	for (var k = 0; k < coverLayers.length; k++)
	{
		if (typeof coverLayers[k] === 'string' )
			this.coverLayers.push(coverLayers[k]);
		else if ('group' in coverLayers[k])
		{
			var layersHash = _getLayersInGroup(globalFlashMap, _mapHelper.mapTree, coverLayers[k].group);
			for (var l in layersHash)
				this.coverLayers.push(l);
		}
	}
	
	this.dateAttribute = dateAttribute;
	this.cloudsAttribute = cloudsAttribute;
	
	var cloudsCount,
		_this = this;
	
	var commonStyles = globalFlashMap.layers[this.coverLayers[0]].properties.styles,
		cloudsCount = 0;
	
	for (var i = 0; i < icons.length; i++)
		this.cloudsIndexes.push({icon:icons[i]});
	
	for (var i = 0; i < commonStyles.length; ++i)
	{
		if (this.cloudsIndexes[i])
			this.cloudsIndexes[i].name = commonStyles[i].Name;
		
		cloudsCount++;
	}
	
	if ( typeof initCloudIndex != 'undefined' )
		this.currCloudsIndex = initCloudIndex;
		
	this.cloudsCount = Math.round(cloudsCount / 2);
		
	this.commonStyles = commonStyles;
	
	setInterval(function(){
		_this.fixLayers.apply(_this);
	}, 300);
}

CoverControl.prototype.fixLayers = function()
{
	for (var i = 0; i < this.coverLayers.length; ++i)
	{
		var layerId = globalFlashMap.layers[this.coverLayers[i]].properties.LayerID,
			div = $("[LayerID='" + layerId + "']");
		
		if (!div.length)
			continue;
		
		$(div[0]).children("[multiStyle]").hide();
		
		if (typeof _mapHelper == 'undefined') continue;
		
		if ($(div[0]).children("[styleType='multi']").length) {
			var icon = _mapHelper.createGeometryIcon(globalFlashMap.layers[this.coverLayers[i]].properties.styles[0], "polygon");
				
			if ($.browser.msie)
			{
				icon.style.width = '9px';
				icon.style.height = '13px';
				icon.style.margin = '0px 3px -3px 1px';
			}
			
			_title(icon, _gtxt("Редактировать стили"));
			
			icon.geometryType = "polygon";
			
			icon.onclick = function()
			{
				_mapHelper.createLayerEditor(this.parentNode, 1, -1);
			}
			
			$(div[0]).children("[styleType='multi']").replaceWith(icon);
		}
	}
}

CoverControl.prototype.setFilters = function()
{
	for (var i = 0; i < this.coverLayers.length; ++i)
	{
		var name = this.coverLayers[i],
			layer = globalFlashMap.layers[name];
		
		if (!layer)
			continue;
		
		var	properties = layer.properties;
		
		var filterString = "`" + this.dateAttribute + "` >= '" + this.dateBegin + "'" + " AND " + "`" + this.dateAttribute + "` <= '" + this.dateEnd + "'",
			filters = layer.filters;
		
		for (var j = 0; j < this.cloudsCount; j++)
		{
			var lastFilter = properties.styles[j].Filter;
			
			if (j <= this.currCloudsIndex)
			{
				filters[j].setVisible(true);
				filters[j + this.cloudsCount].setVisible(true);
				filters[j].setFilter((lastFilter && lastFilter != "") ? ("(" + lastFilter + ") AND" + filterString) : filterString);
				filters[j + this.cloudsCount].setFilter((lastFilter && lastFilter != "") ? ("(" + lastFilter + ") AND" + filterString) : filterString);
			}
			else
			{
				filters[j].setVisible(false);
				filters[j + this.cloudsCount].setVisible(false);
			}
		}
	}
}

/**
* Добавляет в DOM элементы контролов фильтрации по облачности
* @function
* @param {DOMElement} parent Контейнер для добавляения контрола
*/
CoverControl.prototype.add = function(parent)
{
	var	cloudsSlider = _mapHelper.createSlider(this.currCloudsIndex, function(){}),
		_this = this;
	
	$(cloudsSlider).slider("option", "step", 1);
	$(cloudsSlider).slider("option", "min", 0);
	$(cloudsSlider).slider("option", "max", this.cloudsIndexes.length - 1);
	$(cloudsSlider).slider("option", "value", this.currCloudsIndex);
	$(cloudsSlider).bind("slidestop", function(event, ui)
	{
		_this.currCloudsIndex = ui.value;
		
		_this.setFilters();
		
		_title(cloudsSlider.firstChild, _this.cloudsIndexes[_this.currCloudsIndex].name);
	});
	
	cloudsSlider.style.margin = '10px 3px';
	
	// добавляем раскраску
	cloudsSlider.style.backgroundImage = '';
	var colorTds = [];
	for (var i = 1; i < this.cloudsCount; i++)
	{
		colorTds.push(_td(null,[['css','width', Math.round(100 / (this.cloudsCount - 1)) + 'px'], ['css','height',$.browser.msie ? '6px' : '7px'], ['css','backgroundColor',_mapHelper.convertColor(this.commonStyles[i].RenderStyle.fill.color)]]))
	}
	
	_(cloudsSlider, [_table([_tbody([_tr(colorTds)])],[['css','position','absolute'],['css','left','0px'],['css','top','0px'],['css','border','1px solid #999999']])])
	
	_title(cloudsSlider, _gtxt("Облачность"));
	_title(cloudsSlider.firstChild, this.cloudsIndexes[this.currCloudsIndex].name);
	
	var cloudsLabelDiv = _div(null,[['css','height','16px'],['css','position','relative']]);
	
	for (var i = 0; i < this.cloudsIndexes.length; ++i)
	{
		var img = _img(null,[['attr','src',this.cloudsIndexes[i].icon],['css','position','absolute']]);
		
		img.style.left = (25 * i - 5) + 'px';
		
		_title(img, this.cloudsIndexes[i].name)
		
		_(cloudsLabelDiv, [img])
	}
	
	var trs = [];
	
	trs.push(_tr([_td(),_td([_span([_t(_gtxt("Облачность"))],[['css','fontSize','12px'],['css','margin','0px 10px 0px 7px']])]), _td([cloudsLabelDiv,cloudsSlider],[['attr','colSpan',2]])]));
	trs.push(_tr([_td(null, [['attr','colSpan',2],['css','height','5px']])]));
	
	_(parent, [_table([_tbody(trs)],[['css','marginLeft','20px']])]);
}

/** Фильтрует объекты внутри векторных слоёв по интервалу дат
* @memberOf cover
* @class
*/
var FiltersControl = function()
{
	var _layers = [];
	var _dateAttribute = null;
	var _dateBegin = null;
	var _dateEnd = null;
	var _type = null;
	
	var _setFilters = function()
	{
		var filterLayer = function(layer)
		{
			var	properties = layer.properties;
			
			var filterString = "`" + _dateAttribute + "` >= '" + _dateBegin + "'" + " AND " + "`" + _dateAttribute + "` <= '" + _dateEnd + "'",
				filters = layer.filters;
			
			for (var j = 0; j < filters.length; j++)
			{
				var lastFilter = properties.styles[j].Filter;
				
				filters[j].setFilter((lastFilter && lastFilter != "") ? ("(" + lastFilter + ") AND" + filterString) : filterString);
			}			
		}
		
		if (_type)
		{ //фильтруем все слои данного типа 
			for (var i = 0; i < globalFlashMap.layers.length; ++i)
				if (globalFlashMap.layers[i].properties.type === _type)
					filterLayer(globalFlashMap.layers[i]);
		}
		else
		{ //фильтруем конкретные слои
			for (var i = 0; i < _layers.length; ++i)
			{
				var name = _layers[i],
					layer = globalFlashMap.layers[name];
				
				if (!layer)
					continue;
					
				filterLayer(layer);
			}
		}
	}

	/**
	* Обновляет фильтрацию слоёв при смене дат
	* @function
	*/
	this.loadForDates = function(dateBegin, dateEnd)
	{
		_dateBegin = dateBegin;
		_dateEnd = dateEnd;
		
		_setFilters();
	}
	
	/**
	* @function 
	* @param {Array or string} layers Вектор имён слоёв для фильтрации или тип слоёв для фильтрации (Raster или Vector). В последнем случае фильтруются все слои данного типа
	* @param {string} dateAttribute Имя аттрибута даты в слоях
	*/
	this.init = function(layers, dateAttribute)
	{
		if (typeof layers === 'string')
			_type = layers;
		else
			_layers = layers;
		
		_dateAttribute = dateAttribute;
	}
}

/** Управляет видимостью слоёв в зависимости от диапазона дат. Может фильтровать слои только из определённой группы. Работает только с вьюером. Поддерживает фильтрацию в доп. картах.
	@memberOf cover
	@class 
*/
var LayerFiltersControl = function()
{
	var _calendar = null;
	var _groupTitle = null;
	var _map = null;
	
	//по умолчанию слои фильтруются по дате
	var _filterFunc = function(layer, dateBegin, dateEnd)
	{
		var layerDate = $.datepicker.parseDate('dd.mm.yy', layer.properties.date);
		return dateBegin <= layerDate && layerDate <= dateEnd;
	}
	
	var _getMapLayersAsHash = function()
	{
		var res = {};
		for (var l = 0;l < _map.layers.length; l++)
			res[_map.layers[l].properties.name] = _map.layers[l];
			
		return res;
	}
	
	var _update = function()
	{
		if (typeof _queryExternalMaps.mapsCanvas != 'undefined')
		{
			for (var m = 0; m < _queryExternalMaps.mapsCanvas.childNodes.length; m++)
			{
				var mapElem = _queryExternalMaps.mapsCanvas.childNodes[m].childNodes[0];
				if (mapElem.extLayersTree)
					_updateTree(mapElem.extLayersTree.mapHelper.mapTree, mapElem);
			}
		}
		
		_updateTree(_mapHelper.mapTree, _queryMapLayers.buildedTree);
	}
	
	var _updateTree = function(mapTree, domTreeRoot)
	{
		var dateBegin = _calendar.getDateBegin();
		var dateEnd = _calendar.getDateEnd();
		
		var layers = _groupTitle ? _getLayersInGroup(_map, mapTree, _groupTitle) : _getMapLayersAsHash();
		
		_mapHelper.findTreeElems( mapTree, function(elem)
		{
			if (elem.content.properties.name in layers)
			{
				//var layerDate = $.datepicker.parseDate('dd.mm.yy', layers[elem.content.properties.name].properties.date);
				//var isDateInInterval = dateBegin <= layerDate && layerDate <= dateEnd;
				var isShowLayer = _filterFunc( layers[elem.content.properties.name], dateBegin, dateEnd );
				
				elem.content.properties.visible = isShowLayer;
				layers[elem.content.properties.name].setVisible(isShowLayer);
				
				//если дерево уже создано в dom, ручками устанавливаем галочку
				var childBoxList = $(domTreeRoot).find("div[LayerID='" + elem.content.properties.LayerID + "']");
				if (childBoxList.length > 0)
					childBoxList[0].firstChild.checked = isShowLayer;
			}
		});
	}
	
	/**
	 * @function Инициализитует фильтрацию слоёв. Далее классом будут отслеживаться события календарика.
	 * @param map Основная карта
	 * @param {cover.Calendar} calendar Календарик, который используется для задания дат
	 * @param {Object} params Дополнительные параметры: <br/>
	 *    groupTitle - имя группы, слои в которой нужно фильтровать. Если не задано, будут фильтроваться все слои на карте <br/>
	 *    filterFunc - ф-ция filterFunc(layer, dateBegin, dateEnd) -> Bool. Возвращает true, если слой нужно показать, false чтобы скрыть. По умолчанию происходит фильтрация по дате слоя.
	 */
	this.init = function(map, calendar, params)
	{
		_map = map;
		
		if ( typeof params != 'undefined' )
		{
			_groupTitle = params.groupTitle;
			if (params.filterFunc) 
				_filterFunc = params.filterFunc;
		}
		
		if (_calendar)
			$(_calendar).unbind('change', _update);
			
		_calendar = calendar;
		$(_calendar).bind('change', _update);
		_update();
	}
}

/*
 ************************************
 *          SearchBboxControl       *
 ************************************/
 
 /**
 * @memberOf cover
 * @class
 * Управление ограничевающим прямоугольником для задания области отображения информации. <br/>
 *
 * Добавляет кастомное свойство к FRAME, к которому забинден. <br/>
 *
 * Зависимости: jQuery, API, translations <br/>
 * Элементы UI: кнопка и drawingObject типа FRAME
 */
var SearchBboxControl = function()
{
	 /**
	 * @name cover.SearchBboxControl.change
	 * @event
	 */
	 
	var _elem = null;
	var _button = null;
	var _extent = new BoundsExt();
	var _this = this;
	var _bindingID = Math.random();
	
	var update = function( keepSilence )
	{
		var newExtent = new BoundsExt(_elem ? getBounds( _elem.getGeometry().coordinates ) : BoundsExt.WHOLE_WORLD);
		
		var changed = !newExtent.isEqual(_extent);
		_extent = newExtent;
		
		if ( changed && !keepSilence )
			$(_this).trigger('change');
	};
	
	var bindDrawing = function( elem )
	{
		_elem = elem;
		elem.properties.firesBbox = _bindingID;
		
		$(_button).val(_gtxt('searchBbox.CancelSearchInArea'));
	}
		
	var removeBbox = function()
	{
		if ( !_elem ) return;
		
		delete _elem.properties.firesBbox;
		_elem = null;
		$(_button).val(_gtxt("searchBbox.SearchInArea"));
		update();
	};
	
	/**
	 * @function
	 */	
	this.init = function()
	{
		_button = makeButton(_gtxt("searchBbox.SearchInArea"));
		
		_button.onclick = function()
		{
			if (_elem == null)
				globalFlashMap.drawing.selectTool("FRAME");
			else
			{
				_elem.remove();
			}
		}
	
		var _this = this;
		globalFlashMap.drawing.setHandlers(
		{
			onRemove: function( elem )
			{
				if (elem === _elem) 
					removeBbox();
			}, 
			onMouseUp: function( elem )
			{
				if (!_elem)
					bindDrawing( elem );
					
				update();
			}
		})
	};

	/**
	 * Возвращает контрол, который может быть куда-нибудь помещён
	 * @function
	 */
	this.getButton = function()
	{
		return _button;
	};
	
	/**
	 * Возвращет bbox
	 * @function
	 */
	this.getBbox = function()
	{
		return _extent;
	}
	
	/**
	 * Ищет bbox среди существующих drawing объектов и биндится к нему. drawing должен иметь свойство "firesBbox"
	 * @function
	 */
	this.findBbox = function( checkBindingID )
	{
		var _this = this;
		globalFlashMap.drawing.forEachObject(function(o)
		{
			if ( o.properties.firesBbox && ( typeof checkBindingID == 'undefined' || !checkBindingID || o.properties.firesBbox == _bindingID ) )
			{
				bindDrawing( o );
				update( true ); //мы не хотим генерить event
			}
		})
	}
	
	/**
	 * Предполагается, что сам drawing объект сохраняется кем-то ещё, мы сохраняем только его параметры биндинга
	 * @function
	 */
	this.saveState = function()
	{
		return { bindingID: _bindingID };
	}
	
	/**
	 * @function
	 */
	this.loadState = function( data )
	{
		if ( data.bindingID )
		{
			_bindingID = data.bindingID;
			this.findBbox( true );
		}
		else
			this.findBbox( false );
	}
}

/**
* Сравнивают два extent'а. Оба параметра могут быть null (весь мир) или NaN (пустой bbox)
* @function
* @static
*/
SearchBboxControl.isBoundsEqual = function(ext1, ext2)
{
	if (!ext1 && !ext2) return true;
	if (!ext1 || !ext2) return false;
	
	if (isNaN(ext1) && isNaN(ext2)) return true;
	if (isNaN(ext1) || isNaN(ext2)) return false;
	
	return ext1.maxX == ext2.maxX && ext1.maxY == ext2.maxY && ext1.minX == ext2.minX && ext1.minY == ext2.minY;
}

/**
 * @memberOf cover
 * @class cover
 * Аггрегирует статусы разных событий для нескольких источников (загружаются данные, слишком большая область и т.п.)
 */
var AggregateStatus = function()
{
	/** Изменение состояние аггрегатора, а не отдельных состояний источников
	 * @name cover.AggregateStatus.change
	 * @event
	 */
	var _statuses = {};
	var _statusCommon = true;
	var _this = this;
	
	var _updateCommonStatus = function()
	{
		var newStatus = true;
		for ( var k in _statuses )
			if ( !_statuses[k] )
			{
				newStatus = false;
				break;
			}
			
		var isStatusChanged = newStatus != _statusCommon;
		_statusCommon = newStatus;
			
		if (isStatusChanged) 
			$(_this).trigger('change');
	}
	
	//public
	this.setStatus = function( type, status )
	{
		_statuses[type] = status;
		_updateCommonStatus();
	}
	
	this.getCommonStatus = function(){ return _statusCommon };
}

/*
 ************************************
 *          Data Providers          *
 ************************************/
 
var IDataProvider = {};
// {
	// getDescription: function(){}, //возвращает строчку, которая показывается рядом с checkbox
	// getData: function( dateBegin, dateEnd, bbox, onSucceess, onError ){} //onSucceess(data) - полученные данные; onError(type) - ошибка определённого типа
// };

IDataProvider.ERROR_TOO_MUCH_DATA = 0;
IDataProvider.SERVER_ERROR = 1;
IDataProvider.sendCachedCrossDomainJSONRequest = function(url, callback)
{
	var jsonCache = IDataProvider.sendCachedCrossDomainJSONRequest.jsonCache;
	if (jsonCache[url])
		callback(jsonCache[url]);
	else
		sendCrossDomainJSONRequest(url, function(ret)
		{
			jsonCache[url] = ret;
			callback(jsonCache[url]);
		});
}
IDataProvider.sendCachedCrossDomainJSONRequest.jsonCache = {};

/** Провайдер данных об очагах пожаров
* @memberOf cover
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого берутся данные о пожарах. Default: http://sender.kosmosnimki.ru/
*/
var FireSpotProvider = function( params )
{
	/**
	* @cfg 
	*/
	var _params = $.extend({ host: 'http://sender.kosmosnimki.ru/' }, params );
	
	this.getDescription = function() { return _gtxt("firesWidget.FireSpots.Description"); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
		var urlBbox = bbox ? '&Polygon=POLYGON((' + bbox.minX + ' ' + bbox.minY + ', ' + bbox.minX + ' ' + bbox.maxY + ', ' + bbox.maxX + ' ' + bbox.maxY + ', ' + bbox.maxX + ' ' + bbox.minY + ', ' + bbox.minX + ' ' + bbox.minY + '))' : "";
		//var urlBbox = bbox ? "&MinX=" + bbox.minX + "&MinY=" + bbox.minY + "&MaxX=" + bbox.maxX + "&MaxY=" + bbox.maxY : "";
		var urlFires = _params.host + "Fires.ashx?type=1&StartDate=" + dateBegin + "&EndDate=" + dateEnd + urlBbox;
		
		IDataProvider.sendCachedCrossDomainJSONRequest(urlFires, function(data)
		{
			if (data.Result != 'Ok')
			{
				onError( data.Result == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
				return;
			}
			
			var resArr = [];
			for ( var d = 0; d < data.Response.length; d++ )
			{
				var a = data.Response[d];
				resArr.push({ x: a[1], y: a[0], date: a[4], category: a[3] < 50 ? 0 : (a[3] < 100 ? 1 : 2), balloonProps: {"Время": a[5] + "&nbsp;(Greenwich Mean Time)", "Вероятность": a[2]}});
			}
			onSucceess( resArr );
		});
	}
}

/** Провайдер данных о гарях
* @memberOf cover
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого берутся данные о гарях. Default: http://sender.kosmosnimki.ru/
*/
var FireBurntProvider = function( params )
{
	var _params = $.extend({host: 'http://sender.kosmosnimki.ru/'}, params);
	
	this.getDescription = function() { return _gtxt("firesWidget.Burnt.Description"); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
		var urlBbox = bbox ? "&MinX=" + bbox.minX + "&MinY=" + bbox.minY + "&MaxX=" + bbox.maxX + "&MaxY=" + bbox.maxY : "";
		var urlBurnt = _params.host + "FireSender.ashx?type=2&StartDate=" + dateBegin + "&EndDate=" + dateEnd + urlBbox;
		
		IDataProvider.sendCachedCrossDomainJSONRequest(urlBurnt, function(burntArr)
		{
			if (!burntArr) 
			{
				onError( IDataProvider.ERROR_TOO_MUCH_DATA );
				return;
			}
			
			var resArr = [];
			
			for ( var d = 0; d < burntArr.length; d++ )
			{
				var curBurnt = burntArr[d];
				resArr.push({ geometry: from_merc_geometry(curBurnt[10][0].geometry), balloonProps: {"Тип растительности": curBurnt[3], "Источник": curBurnt[4]}, date: curBurnt[2]});
			}
			
			onSucceess( resArr );
		});
	}
}

/** Провайдер покрытия снимками modis
* @memberOf cover
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого берутся данные покрытии. Default: http://sender.kosmosnimki.ru/ <br/>
* <i> {String} modisImagesHost </i> Путь, с которого будут загружаться тайлы. Default: http://images.kosmosnimki.ru/MODIS/
*/
var ModisImagesProvider = function( params )
{
	
	var _params = $.extend({host: 'http://sender.kosmosnimki.ru/v2/',
							modisImagesHost: 'http://images.kosmosnimki.ru/MODIS/'
						   }, params);
	
	this.getDescription = function() { return _gtxt("firesWidget.DialyCoverage.Description"); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
		//запрашиваем только за первый день периода
		var modisUrl = _params.host + "Operative.ashx?type=0&Date=" + dateBegin;
		
		IDataProvider.sendCachedCrossDomainJSONRequest(modisUrl, function(data)
		{
			if (data.Result != 'Ok')
			{
				onError( data.Result == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
				return;
			}
			
			var resArr = [];
			
			for ( var d = 0; d < data.Response.length; d++ )
			{
				var curImage = data.Response[d];
				resArr.push({ geometry: from_merc_geometry(curImage[3][0].geometry),
							  dirName: params.modisImagesHost + curImage[5].split("\\").join("/"),
							  date: curImage[1]
						    });
			}
			
			onSucceess( resArr );
		});
	}
}

/*
 ************************************
 *            Renderers             *
 ************************************/
 
/** Визуализирует точки пожаров разными иконками в зависимости от их типа
* @memberOf cover
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} fireIcon </i> Иконка для маркеров , которая используется для всех пожаров <br/>
* <i> {Array} fireIcons </i> Вектор для иконок маркеров очагов (3 иконки для слабого, среднего и сильного пожаров). Используется, если не указан fireIcon <br/>
* <i> {String} fireIconsHost </i> Путь, откуда берутся иконки с предеопределёнными названиями. Используется, если нет fireIcon и fireIcons. Default: http://maps.kosmosnimki.ru/images/ <br/>
*/
var FireSpotRenderer = function( params )
{
	var _params = $.extend({ fireIconsHost: 'http://maps.kosmosnimki.ru/images/' }, params);
	
	var _firesObj = null;
	var _balloonProps = {};
	this.bindData = function(data)
	{
		if (_firesObj) _firesObj.remove();
		_balloonProps = {};
		_firesObj = globalFlashMap.addObject();
		_firesObj.setVisible(false);
		
		var weak = _firesObj.addObject();
		var medium = _firesObj.addObject();
		var strong = _firesObj.addObject();
		
		var imageNames = ["","",""];
		if (_params.fireIcon)
			imageNames = [_params.fireIcon, _params.fireIcon, _params.fireIcon];
		else if (_params.fireIcons)
			imageNames = _params.fireIcons;
		else
			imageNames = [ _params.fireIconsHost + "fire_weak.png", _params.fireIconsHost + "fire.png", _params.fireIconsHost + "fire_strong.png" ];
		
		weak.setStyle({ marker: { image: imageNames[0], center: true } });
		medium.setStyle({ marker: { image: imageNames[1], center: true } });
		strong.setStyle({ marker: { image: imageNames[2], center: true } });
		for (var i = 0; i < data.length; i++)
		{
			var a = data[i];
			
			if (!a) continue;
			
			var objContainer = null;
			var addBallonProps = {"Дата": a.date };
			
			if (typeof a.category != 'undefined')
			{
				var isWeak = (a.category == 0);
				var isMedium = (a.category == 1);
				objContainer = (isWeak ? weak : isMedium ? medium : strong);
				addBallonProps["Категория"] = (isWeak ? "Слабый" : isMedium ? "Средний" : "Сильный");
			}
			else
				objContainer = medium;
				
			var obj = objContainer.addObject( { type: "POINT", coordinates: [a.x, a.y] } );
			_balloonProps[obj.objectId] = $.extend({}, a.balloonProps, addBallonProps);
		}
		
		var ballonHoverFunction = function(o)
		{
			var p = _balloonProps[o.objectId];
			
			var res = "";
			for (var i in p )
				res += "<b>" + i + ":</b> " + p[i] + "<br />";
				
			return res + o.getGeometrySummary();
		}
		
		weak.enableHoverBalloon(ballonHoverFunction);
		medium.enableHoverBalloon(ballonHoverFunction);
		strong.enableHoverBalloon(ballonHoverFunction);
	}
	
	this.setVisible = function(flag)
	{
		if (_firesObj) _firesObj.setVisible(flag);
	}
}

/** Рисует на карте гари
* @memberOf cover
* @class
*/
var FireBurntRenderer = function()
{
	var _burntObj = null;
	var _balloonProps = {};
	this.bindData = function(data)
	{
		if (_burntObj) _burntObj.remove();
		_balloonProps = {};
		_burntObj = globalFlashMap.addObject();
		_burntObj.setZoomBounds(1, 17);
		_burntObj.setVisible(false);
		_burntObj.setStyle(
			{ outline: { color: 0xff0000, thickness: 2 }, fill: { color: 0xffffff, opacity: 5 } },
			{ outline: { color: 0xff0000, thickness: 3 }, fill: { color: 0xffffff, opacity: 15 } }
		);
		
		for (var i = 0; i < data.length; i++) 
			(function(b){
				if (!b) return;
				var obj = _burntObj.addObject( b.geometry );
				_balloonProps[obj.objectId] = $.extend({}, b.balloonProps, {"Дата": b.date});
			})(data[i]);
			
		_burntObj.enableHoverBalloon(function(o)
		{
			var p = _balloonProps[o.objectId];
						
			var res = "<b style='color: red;'>СЛЕД ПОЖАРА</b><br />";
			for ( var i in p )
				res += "<b>" + i + ":</b> " + p[i] + "<br />";
				
			return res + o.getGeometrySummary();
		});
	}
	
	this.setVisible = function(flag)
	{
		if (_burntObj) _burntObj.setVisible(flag);
	}
}

/** Рисует на карте картинки MODIS
* @memberOf cover
* @class 
*/
var ModisImagesRenderer = function()
{
	var _imagesObj = null;
	this.bindData = function(data)
	{
		if (_imagesObj) _imagesObj.remove();
		_imagesObj = globalFlashMap.addObject();
		_imagesObj.setZoomBounds(1, 9);
		_imagesObj.setVisible(false);
		
		for (var i = 0; i < data.length; i++) (function(imgData)
		{
			if (!imgData) return;
			
			var img = _imagesObj.addObject(imgData.geometry);
			img.setTiles(function(i, j, z)
			{
				return imgData.dirName + "/" + z + "/" + i + "/" + z + "_" + i + "_" + j + ".jpg";
			});
		})(data[i]);
	}
	
	this.setVisible = function(flag)
	{
		if (_imagesObj) _imagesObj.setVisible(flag);
	}
}

/*
 ************************************
 *            FiresControl          *
 ************************************/
 
 /**
* @memberOf cover
* @class 
*/
var FiresControl = function()
{
	this.dateFiresBegin = null;
	this.dateFiresEnd   = null;
	
	this.requestBbox = new BoundsExt(); //bbox, для которого есть данные на данный момент.
	
	this.dataControllers = {};
	
	this.statusModel = new AggregateStatus();
	this.processingModel = new AggregateStatus();
	
	this.searchBboxController = new SearchBboxControl();
}


//настройки виджета пожаров по умолчанию
FiresControl.DEFAULT_OPTIONS = 
{
	firesHost:       'http://sender.kosmosnimki.ru/v2/',
	imagesHost:      'http://sender.kosmosnimki.ru/v2/',
	burntHost:       'http://sender.kosmosnimki.ru/',
	fireIconsHost:   'http://maps.kosmosnimki.ru/images/',
	modisImagesHost: 'http://images.kosmosnimki.ru/MODIS/',
	
	initExtent: null,

	dateFormat: "dd.mm.yy",
	fires:      true,
	firesInit:  true,
	images:     true,
	imagesInit: true,
	burnt:      false,
	burntInit:  true
}

FiresControl.prototype.saveState = function()
{
	var dc = [];
	for (k in this.dataControllers)
		dc.push({name: this.dataControllers[k].name, visible: this.dataControllers[k].visible});
		
	return {dataContrololersState: dc, bbox: this.searchBboxController.saveState() };
}

FiresControl.prototype.loadState = function( data )
{
	var dc = data.dataContrololersState;
	for (var k = 0; k < dc.length; k++)
		if (dc[k].name in this.dataControllers)
		{
			var curController = this.dataControllers[dc[k].name];
			
			curController.visible = dc[k].visible;
			$("#" + dc[k].name, this._parentDiv).attr({checked: dc[k].visible});
			curController.renderer.setVisible(curController.visible);
		}
			
	this.searchBboxController.loadState(data.bbox);
}

// providerParams: 
//     - isVisible - {Bool, default: true} виден ли по умолчанию сразу после загрузки
//     - isUseDate - {Bool, default: true} зависят ли данные от даты
//     - isUseBbox - {Bool, default: true} зависят ли данные от bbox
FiresControl.prototype.addDataProvider = function( name, dataProvider, dataRenderer, providerParams )
{
	providerParams = $.extend( { isVisible: true, isUseDate: true, isUseBbox: true }, providerParams );
		
	this.dataControllers[name] = { provider: dataProvider, renderer: dataRenderer, visible: providerParams.isVisible, name: name, params: providerParams };
	this.updateCheckboxList();
	if (this.dateFiresBegin && this.dateFiresEnd)
		this.loadForDates( this.dateFiresBegin, this.dateFiresEnd );
}

//Перерисовывает все checkbox'ы. Возможно, стоит оптимизировать
FiresControl.prototype.updateCheckboxList = function()
{
	$("#checkContainer", this._parentDiv).empty();
	var trs = [];
	var _this = this;
	
	for (var k in this.dataControllers)
	{
		var checkbox = _checkbox(this.dataControllers[k].visible, 'checkbox');
		
		if ($.browser.msie)
			checkbox.style.margin = '-3px -2px 0px -1px';
		else
			checkbox.style.marginLeft = '3px';
			
		$(checkbox).attr({id: this.dataControllers[k].name});
	
		(function(dataController){
			checkbox.onclick = function()
			{
				dataController.visible = this.checked;
				_this.loadForDates( _this.dateFiresBegin, _this.dateFiresEnd );
				dataController.renderer.setVisible(this.checked);
			}
		})(this.dataControllers[k]);
		
		var curTr = _tr([_td([checkbox]), _td([_span([_t( this.dataControllers[k].provider.getDescription() )],[['css','marginLeft','3px']])])]);
		trs.push(curTr);
		trs.push(_tr([_td(null, [['attr','colSpan',2],['css','height','5px']])]));
	}
	
	$("#checkContainer", this._parentDiv).append( _table([_tbody(trs)],[['css','marginLeft','24px']]) );
}

FiresControl.prototype.findBbox = function()
{
	this.searchBboxController.findBbox();
}

/** Возвращает bbox, по которому запрашиваются данные.
* @method 
*/
FiresControl.prototype.getBbox = function()
{
	return this._initExtent.getIntersection(this.searchBboxController.getBbox());
}

//предполагаем, что dateBegin, dateEnd не нулевые
FiresControl.prototype.loadForDates = function(dateBegin, dateEnd)
{
	var curExtent = this.getBbox();
	
	var isDatesChanged = !this.dateFiresBegin || !this.dateFiresEnd || dateBegin.getTime() != this.dateFiresBegin.getTime() || dateEnd.getTime() != this.dateFiresEnd.getTime();
	var isBBoxChanged = !curExtent.isEqual(this.requestBbox);
	
/*	if ( !this.requestBbox && !curExtent )
		isBBoxChanged = false;
	else if ( !this.requestBbox || !curExtent )
		isBBoxChanged = true;
	else */
	
	//isBBoxChanged = !SearchBboxControl.isBoundsEqual( this.requestBbox, curExtent );
	
	this.dateFiresBegin = dateBegin;
	this.dateFiresEnd = dateEnd;
	
    var _this = this;
	
	this.requestBbox = curExtent;
    
	for (var k in this.dataControllers)
	{
		var curController = this.dataControllers[k];
		if ( curController.visible && ( (isDatesChanged && curController.params.isUseDate) || (isBBoxChanged && curController.params.isUseBbox) || !curController.data ) )
		{
			//если у нас получилась пустая область запроса, просто говорим рендереру очистить все данные
			if ( curExtent.isEmpty() )
			{
				curController.renderer.bindData( null );
				curController.renderer.setVisible(curController.visible);
			}
			else
			{
				this.processingModel.setStatus( curController.name, false);
				
				(function(curController){
					curController.provider.getData( $.datepicker.formatDate(_this._firesOptions.dateFormat, dateBegin), $.datepicker.formatDate(_this._firesOptions.dateFormat, dateEnd), curExtent.getBounds(), 
						function( data )
						{
							curController.data = data;
							_this.statusModel.setStatus( curController.name, true );
							_this.processingModel.setStatus( curController.name, true);
							curController.renderer.bindData( data );
							curController.renderer.setVisible(curController.visible);
						}, 
						function( type )
						{
							_this.processingModel.setStatus( curController.name, true);
							_this.statusModel.setStatus( curController.name, false);
						}
					)
				})(curController);
			}
		}
	}
}

FiresControl.prototype.add = function(parent, firesOptions, globalOptions)
{
	this._firesOptions = $.extend( {}, FiresControl.DEFAULT_OPTIONS, firesOptions );
	this._initExtent = new BoundsExt( firesOptions.initExtent ? firesOptions.initExtent : BoundsExt.WHOLE_WORLD );
	if ( firesOptions.initExtent && firesOptions.showInitExtent )
	{
		var ie = firesOptions.initExtent;
		var objInitExtent = globalFlashMap.addObject( {type: "POLYGON", coordinates: [[[ie.minX, ie.minY], [ie.minX, ie.maxY], [ie.maxX, ie.maxY], [ie.maxX, ie.minY], [ie.minX, ie.minY]]]} );
		objInitExtent.setStyle( { outline: { color: 0xff0000, thickness: 1, opacity: 20 }, fill: { color: 0xffffff, opacity: 10 } } );
	}
	
	this._parentDiv = parent;
	$(this._parentDiv).append(_div(null, [['dir', 'id', 'checkContainer']]));
	this.globalOptions = globalOptions;
	
	if ( this._firesOptions.fires ) 
		this.addDataProvider( "firedots",
							  new FireSpotProvider( {host: this._firesOptions.firesHost} ),
							  new FireSpotRenderer( {fireIconsHost: this._firesOptions.fireIconsHost} ),
							  { isVisible: this._firesOptions.firesInit } );
							  
	if ( this._firesOptions.burnt ) 
		this.addDataProvider( "burnts",
							new FireBurntProvider( {host: this._firesOptions.burntHost} ),
							new FireBurntRenderer(),
							{ isVisible: this._firesOptions.burntInit } );
						  
	if ( this._firesOptions.images ) 
		this.addDataProvider( "images",
							  new ModisImagesProvider( {host: this._firesOptions.imagesHost, modisImagesHost: this._firesOptions.modisImagesHost} ),
							  new ModisImagesRenderer(),
							  { isVisible: this._firesOptions.imagesInit, isUseBbox: false } );
	
	this.searchBboxController.init();
	var processImg = _img(null, [['attr','src', globalOptions.resourceHost + 'img/progress.gif'],['css','marginLeft','10px'], ['css', 'display', 'none']]);
	
	var trs = [];
	var _this = this;
	
	var internalTable = _table([_tbody([_tr([_td([this.searchBboxController.getButton()]), _td([processImg])])])]);
	trs.push(_tr([_td([internalTable], [['attr','colSpan',2]])]));
	
	$(this.searchBboxController).bind('change', function()
	{
		_this.loadForDates( _this.dateFiresBegin, _this.dateFiresEnd );
	})
	
	var statusDiv = _div([_t(_gtxt('firesWidget.tooManyDataWarning'))], [['css', 'backgroundColor', 'yellow'], ['css','padding','2px'], ['css', 'display', 'none']]);
	trs.push(_tr([_td([statusDiv], [['attr','colSpan',2]])]));
	
	$(this.statusModel).bind('change', function()
	{
		statusDiv.style.display = _this.statusModel.getCommonStatus() ? 'none' : 'block';
	})
	
	$(this.processingModel).bind('change', function()
	{
		processImg.style.display = _this.processingModel.getCommonStatus() ? 'none' : 'block';
	})
	
	$(this._parentDiv).append(_table([_tbody(trs)],[['css','marginLeft','24px']]));
}

/*
{
	resourceHost: "",
	dateFormat: "dd.mm.yy",
	minDate: new Date(2010, 06, 29),
	maxDate: new Date(),
	showYear: false,
	periods: ['','day','week','month'],
	periodDefault: 'day',
	fires: {
		firesHost: 'http://sender.kosmosnimki.ru/',
		imagesHost: 'http://fires2.kosmosnimki.ru/firedots/',
		burntHost: 'http://sender.kosmosnimki.ru/',
		fireIconsHost: 'http://maps.kosmosnimki.ru/images/',
		modisImagesHost: 'http://fires2.kosmosnimki.ru/Modis/',
		
		dateFormat: "dd.mm.yy",
		fires: true,      //Default: true
		firesInit: true,  //Default: true
		images: true,     //Default: true
		imagesInit: true, //Default: true
		burnt: true,      //Default: true
		burntInit: true   //Default: true
		
	},
	cover: {
		dateFormat: "yy-mm-dd",
		dateAttribute: "DATE",
		cloudsAttribute: "CLOUDS",
		icons: ['img/weather/16/0.png','img/weather/16/1.png','img/weather/16/9.png','img/weather/16/2.png','img/weather/16/3.png'],
		layers: ["4A34527C234020A508575274262F45"]
	},
	filters: [
		{
			dateFormat: "yy-mm-dd",
			dateAttribute: "DATE",
			layers: ["6A1F707A19B442A5B6C802D7C7D4EB9D"]
		},
		{
			dateFormat: "yy-mm-dd",
			dateAttribute: "DATE",
			layers: ["4A3409527C234020A508575274262F45"]
		}
	]
}
*/

/** Интерфейс для задания параметров элеметов, зависящих от интервала.
* @memberOf cover
* @class
*/
var MapCalendar = function(params)
{
	this.calendar = new Calendar();
	this.fires = new FiresControl();
	this.cover = new CoverControl();
	this.filters = new FiltersControl();
	this.layerFilters = new LayerFiltersControl();
}

MapCalendar.prototype.saveState = function()
{
	var res = { calendar: this.calendar.saveState() };
	
	if (this.params.fires) res.fires = this.fires.saveState();
	if (this.params.cover) res.cover = this.cover.saveState();
	
	return res;
}

MapCalendar.prototype.loadState = function( data )
{
	this.calendar.loadState( data.calendar );
	if ( data.fires )
	{
		this.fires.loadState( data.fires );
	}
	
	if ( data.cover )
		this.cover.loadState( data.cover );
		
	if ( data.cover || data.fires )
		this.setDates();
}

MapCalendar.prototype.init = function(parent, params)
{
	this.params = params;
	
	var name = 'MapCalendar',
		_this = this;
	
	this.calendar.init( params );
	
	this.calendar.lazyDate.onchange = function() {
		_this.calendar.updateBegin();
		
		_this.setDates();
	}
	
	if (!this.params.showYear) {
		this.calendar.yearBox.style.display = "none";
	}
	if (this.params.periodDefault) {
		this.calendar.lazyDate.value = this.params.periodDefault;
	}
	if (this.params.periods) {
		var allPeriods = ['','day','week','month','year'];
		for (var i = 0; i < allPeriods.length; ++i) {
			if (!valueInArray(this.params.periods, allPeriods[i]))
				$(this.calendar.lazyDate).children("option[value='" + allPeriods[i] + "']").remove();
		}
	}
	
	var globalOptions = {};
	globalOptions.resourceHost = this.params.resourceHost ? this.params.resourceHost : "";	
	
	var	first = makeImageButton(globalOptions.resourceHost + 'img/first.png', globalOptions.resourceHost + 'img/first_a.png'),
		last = makeImageButton(globalOptions.resourceHost + 'img/last.png', globalOptions.resourceHost + 'img/last_a.png');
	
	first.style.marginBottom = '-2px';
	last.style.marginBottom = '-2px';

	first.onclick = function()
	{
		_this.calendar.firstClickFunc();
	}
	
	last.onclick = function()
	{
		_this.calendar.lastClickFunc();
	}
	
	var emptyieinput = _input(null,[['css','width','1px'],['css','border','none'],['css','height','1px']]),
		tdYear = this.params.showYear ? _td([this.calendar.lazyDate, _br(), this.calendar.yearBox, _span([_t(_gtxt("calendarWidget.EveryYear"))],[['css','margin','0px 5px']])],[['attr','colSpan',2]]) : _td([this.calendar.lazyDate, this.calendar.yearBox],[['attr','colSpan',2]]),
		canvas = _div([emptyieinput,
							_table([_tbody([_tr([_td([first]),_td([this.calendar.dateBegin]),_td([this.calendar.dateEnd]),_td([last])]),
											_tr([_td(null, [['attr','colSpan',4],['css','height','15px']])]),
											_tr([_td(), _td([_span([_t(_gtxt("calendarWidget.Period"))],[['css','fontSize','12px'],['css','margin','7px']])]), tdYear]),
											_tr([_td(null, [['attr','colSpan',4],['css','height','5px']])])])])],[['attr','id',name],['css','margin','10px 0px']]);
	
	if (this.params.fires) {
		this.fires.add(canvas, this.params.fires, globalOptions);
	}
	
	if (this.params.cover) {
		this.cover.init(this.params.cover.layers, this.params.cover.dateAttribute, this.params.cover.cloudsAttribute, this.params.cover.icons, this.params.cover.cloud)
		this.cover.add(canvas);
	}
	
	if (this.params.layerFilters)
	{
		this.layerFilters.init(globalFlashMap, this.calendar, this.params.layerFilters);
	}
	
	_(parent, [_div([canvas],[['css','margin','0px 0px 20px 10px']])]);

	emptyieinput.blur();
	
	this.setDates();
	
	$(this.calendar).bind('change', function()
	{
		_this.setDates();
	})
	
	// window.collectCustomParams = function() {
		// var str = "";
		// str += "mapCalendar.calendar.yearBox.checked = " + mapCalendar.calendar.yearBox.checked + ";";
		// str += "mapCalendar.calendar.lazyDate.value = \"" + mapCalendar.calendar.lazyDate.value + "\";";
		// str += "mapCalendar.calendar.dateBegin.value = \"" + mapCalendar.calendar.dateBegin.value + "\";";
		// str += "mapCalendar.calendar.dateEnd.value = \"" + mapCalendar.calendar.dateEnd.value + "\";";
		
		// if (_this.params.fires) {
			// str += "mapCalendar.fires.setFiresVis(" + mapCalendar.fires.firesBox.checked + ");";
			// str += "mapCalendar.fires.firesBox.checked = " + mapCalendar.fires.firesBox.checked + ";";
			// str += "mapCalendar.fires.setImagesVis(" + mapCalendar.fires.imagesBox.checked + ");";
			// str += "mapCalendar.fires.imagesBox.checked = " + mapCalendar.fires.imagesBox.checked + ";";
			// str += "mapCalendar.fires.setBurntVis(" + mapCalendar.fires.burntBox.checked + ");";
			// str += "mapCalendar.fires.burntBox.checked = " + mapCalendar.fires.burntBox.checked + ";";
			// str += "mapCalendar.fires.findBbox();";
		// }
		
		// if (_this.params.cover) {
			// var value = $("#MapCalendar .ui-slider").slider("value");
			// str += "$(\"#MapCalendar .ui-slider\").slider(\"value\"," + value + ");";
			// str += "mapCalendar.cover.currCloudsIndex = " + value + ";";
			// str += "_title($(\"#MapCalendar .ui-slider\")[0].firstChild,\"" + mapCalendar.cover.cloudsIndexes[mapCalendar.cover.currCloudsIndex].name + "\");";
		// }
		
	    // str += "mapCalendar.setDates()"
		
		// str = "timerCalendar = setInterval(function(){if (mapCalendar.calendar && mapCalendar.calendar.yearBox){clearInterval(timerCalendar);" + str + "}}, 100);";
		
	    // return str;
	// }
}

// Конвертировать старый формат сохранения данных о погоде в виде eval-строки в новый формат. 
// Сохранённая строка просто парсится regexp'ом, после чего на основе данных строится структура в новом формате.
MapCalendar.prototype.convertEvalState = function(evalString)
{
	if (!evalString) return;
	
	var yearBoxParse   = /yearBox\.checked = (true|false);/.exec(evalString);
	
	if (!yearBoxParse) return; //какой-то другой пермалинк
	
	var yearBoxParse = yearBoxParse[1];
	var lazyDate  = /lazyDate\.value = "([^;]+)";/.exec(evalString)[1];
	var dateBegin = /dateBegin\.value = "([^;]+)";/.exec(evalString)[1];
	var dateEnd   = /dateEnd\.value = "([^;]+)";/.exec(evalString)[1];
	
	var firesBoxVisParse = /setFiresVis\((true|false)\);/.exec(evalString);
	var firesBoxVis = firesBoxVisParse ? firesBoxVisParse[1] : undefined;
	
	var imagesVisParse   = /setImagesVis\((true|false)\);/.exec(evalString);
	var imagesVis   = imagesVisParse ? imagesVisParse[1] : undefined;
	
	var burntVisParse    = /setBurntVis\((true|false)\);/.exec(evalString);
	var burntVis    = burntVisParse ? burntVisParse[1] : undefined;
	
	var coverValueParse = /slider\"\)\.slider\("value",([^\)]+)\);/.exec(evalString);
	var coverValue = coverValueParse ? coverValueParse[1] : undefined;
	
	var newFormat = { 
		calendar: {
			dateBegin: $.datepicker.parseDate( "dd.mm.yy", dateBegin),
			dateEnd:   $.datepicker.parseDate( "dd.mm.yy", dateEnd),
			lazyDate:  lazyDate,
			year:      yearBox === 'true'
		}
	}
	
	var dc = [];
	
	if (firesBoxVis !== undefined)
		dc.push({name: 'firedots', visible: firesBoxVis === 'true'});

	if (imagesVis !== undefined)
		dc.push({name: 'images', visible: imagesVis === 'true'});

	if (burntVis !== undefined)
		dc.push({name: 'burnts', visible: burntVis === 'true'});
	
	if (dc.length)
	{
		newFormat.fires = {
			dataContrololersState: dc,
			bbox: { bindingID: null }
		}
	}
	
	if (coverValue !== undefined)
		newFormat.cover = { currCloudsIndex: parseInt(coverValue) };
	
	return newFormat;
}

MapCalendar.prototype.setDates = function() {
	var dateBegin = this.calendar.getDateBegin(),
		dateEnd = this.calendar.getDateEnd(),
		format;
	
	if (this.params.fires) {
		// format = this.params.fires.dateFormat;
		
		this.fires.loadForDates(dateBegin, dateEnd);
	}
	
	if (this.params.cover) {
		format = this.params.cover.dateFormat;
		
		this.cover.loadForDates($.datepicker.formatDate(format, dateBegin), $.datepicker.formatDate(format, dateEnd));
	}
	
	if (this.params.filters) {
		for (var i = 0; i < this.params.filters.length; ++i) {
			format = this.params.filters[i].dateFormat;
			
			this.filters.init(this.params.filters[i].layers, this.params.filters[i].dateAttribute);
			this.filters.loadForDates($.datepicker.formatDate(format, dateBegin), $.datepicker.formatDate(format, dateEnd));
		}
	}
}

MapCalendar.prototype.getFireControl = function()
{
	return this.fires;
}


/** Синглетон для доступа к виджету
 * @memberOf cover
 * @class
 */
var mapCalendar = new MapCalendar();

var publicInterface = 
{
	mapCalendar       : mapCalendar,
	FireSpotProvider  : FireSpotProvider,
	FireSpotRenderer  : FireSpotRenderer,
	FireBurntRenderer : FireBurntRenderer,
	FireBurntProvider : FireBurntProvider,
	IDataProvider     : IDataProvider,
	SearchBboxControl : SearchBboxControl
}

if (typeof gmxCore != 'undefined')
	gmxCore.addModule('cover', publicInterface);

//временно помещаем интерфейс в global namespace вне зависимости от наличия менеджера модулей
$.extend(this, publicInterface);

})(jQuery);