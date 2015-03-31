//Не используется: оставлен для обратной совместимости.

/** 
* @namespace cover
* @description Объединяет дополнительные к вьюеру классы, работающие с диапазоном дат. Почти все классы могут использоваться независимо.
*/
(function($){

_translationsHash.addtext("rus", {
							"calendarWidget.Custom" : " ",
							"calendarWidget.Day" : "День",
							"calendarWidget.Week" : "Неделя",
							"calendarWidget.Month" : "Месяц",
							"calendarWidget.Year" : "Год",
							"calendarWidget.EveryYear" : "Ежегодно",
							"searchBbox.SearchInArea" : "Искать в области",
							"searchBbox.CancelSearchInArea" : "Отменить поиск по области",
							"firesWidget.FireSpots.Description" : "Очаги пожаров",
							"firesWidget.Burnt.Description" : "Границы гарей",
							"firesWidget.DialyCoverage.Description" : "Космоснимки",
							"firesWidget.tooManyDataWarning" : "Слишком много данных - сократите область поиска!",
							"firesWidget.FireCombinedDescription" : "Пожары",
							"firesWidget.ExtendedView" : "Расширенный поиск",
							"firesWidget.AdvancedSearchButton" : "Искать по области",
							"calendarWidget.Period" : "Задать период"
						 });
						 
_translationsHash.addtext("eng", {
							"calendarWidget.Custom" : " ",
							"calendarWidget.Day" : "Day",
							"calendarWidget.Week" : "Week",
							"calendarWidget.Month" : "Month",
							"calendarWidget.Year" : "Year",
							"calendarWidget.EveryYear" : "Every year",
							"searchBbox.SearchInArea" : "Search in area",
							"searchBbox.CancelSearchInArea" : "Cancel search in area",
							"firesWidget.FireSpots.Description" : "Fire spots",
							"firesWidget.Burnt.Description" : "Fire areas",
							"firesWidget.DialyCoverage.Description" : "Satellite images",
							"firesWidget.tooManyDataWarning" : "Too much data - downsize search area!",
							"firesWidget.FireCombinedDescription" : "Fires",
							"firesWidget.ExtendedView" : "Extended search",
							"firesWidget.AdvancedSearchButton" : "Search inside area",
							"calendarWidget.Period" : "Set period"
						 });

var _groupLayersHelper = function(map, mapTree, description)
{
	var _array = [];
	var _hash = {};
	
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
	
	for (var k = 0; k < description.length; k++)
		if ( typeof description[k] === "string" )
		{
			_hash[description[k]] = map.layers[description[k]];
			_array.push( map.layers[description[k]] );
		}
		else if ('group' in description[k])
		{
			var groupHash = _getLayersInGroup(map, mapTree, description[k].group);
			for (var l in groupHash)
			{
				_hash[l] = groupHash[l];
				_array.push( groupHash[l] );
			}
		}
		
	return {
		asArray: function() { return _array; },
		asHash: function() { return _hash; },
		names: function()
		{
			var res = [];
			
			for (var l in _hash) 
				res.push(l);
				
			return res;
		}
	}
}

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
	
	/* Находится ли даннный bbox полностью внутри bounds
	*/
	this.isInside = function( bounds )
	{
		if ( _isEmpty || bounds.isWholeWorld() ) return true;
		if ( _isWholeWorld || bounds.isEmpty() ) return false;
		
		var b = bounds.getBounds();
		return _bounds.maxX <= b.maxX && _bounds.maxY <= b.maxY && _bounds.minX >= b.minX && _bounds.minY >= b.minY;
	}
	
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

var Calendar = function()
{	 
	this.dateBegin = null;
	this.dateEnd = null;
	
	this.lazyDate = null;
	
	this.lazyDateInited = false;
	
	this.yearBox = null;
	
	//public interface
	
	this.getDateBegin = function() { return $(this.dateBegin).datepicker("getDate"); }
	
	this.getDateEnd = function() { return $(this.dateEnd).datepicker("getDate"); }
	
	this.saveState = function()
	{
		return {
			dateBegin: this.getDateBegin().valueOf(),
			dateEnd: this.getDateEnd().valueOf(),
			lazyDate: this.lazyDate.value,
			year: this.yearBox.checked
		}
	}
	
	this.loadState = function( data )
	{
		$(this.dateBegin).datepicker("setDate", new Date(data.dateBegin));
		$(this.dateEnd).datepicker("setDate", new Date(data.dateEnd));
		this.lazyDate.value = data.lazyDate;
		this.yearBox.checked = data.year;
	}
	
	this.setLazyDate = function(lazyDate, keepSilence)
	{
		this.lazyDate.value = lazyDate;
		this.updateBegin();
		
		if (!keepSilence) 
			$(this).trigger('change');
	}
}

Calendar.prototype.init = function( params )
{
	var _this = this;
	
	this.lazyDate = nsGmx.Utils._select([_option([_t(_gtxt("calendarWidget.Custom"))],[['attr','value','']]),
								_option([_t(_gtxt("calendarWidget.Day"))],[['attr','value','day']]),
								_option([_t(_gtxt("calendarWidget.Week"))],[['attr','value','week']]),
								_option([_t(_gtxt("calendarWidget.Month"))],[['attr','value','month']]),
								_option([_t(_gtxt("calendarWidget.Year"))],[['attr','value','year']])
							   ],[['css','width','70px'],['dir','className','selectStyle'],['css','marginBottom','4px']]);
	
	// значение по умолчанию
	this.lazyDate.value = 'day';
	
	this.lazyDate.onchange = function() {
		_this.updateBegin();
		$(_this).trigger('change');
	}
	
	this.yearBox = _checkbox(false, 'checkbox');

	this.yearBox.className = 'box';
	if ($.browser.msie)
		this.yearBox.style.margin = '-3px -2px 0px -1px';
	else
		this.yearBox.style.marginLeft = '3px'
	
	_title(this.yearBox, _gtxt("calendarWidget.EveryYear"));
	
	this.dateBegin = _input(null,[['dir','className','inputStyle'],['css','width','70px']]);
	this.dateEnd = _input(null,[['dir','className','inputStyle'],['css','width','70px']]);
	
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
		minDate: new Date(this.dateMin.valueOf() + this.dateMin.getTimezoneOffset()*60*1000),
		maxDate: new Date(this.dateMax.valueOf() + this.dateMin.getTimezoneOffset()*60*1000),
		dateFormat: params.dateFormat,
		defaultDate: new Date(this.dateMax.valueOf() + this.dateMin.getTimezoneOffset()*60*1000)
	});
	
	$(this.dateEnd).datepicker("setDate", new Date((new Date()).valueOf() + (new Date()).getTimezoneOffset()*60*1000));
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
	else {
		if ( $(this.dateBegin).datepicker("getDate") > $(this.dateEnd).datepicker("getDate") )
		{
			var dateToFix = inst.input[0] == this.dateEnd ? this.dateBegin : this.dateEnd;
			$(dateToFix).datepicker( "setDate", $(inst.input[0]).datepicker("getDate") );
		}
	}
};

/**
* @memberOf cover
* @class Фильтрует слои со спутниковыми покрытиями по интервалу дат и облачности
*/
var CoverControl = function()
{
	this.cloudsIndexes = [];
	this.currCloudsIndex = 4;
	this.commonStyles = null;
	this.cloudsCount = 0;
	this.coverLayers = [];
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
	
	if (typeof this.cloudsIndexes[data.currCloudsIndex] !== 'undefined')
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

CoverControl.prototype._updateStyles = function()
{
	if ( this.commonStyles || this.coverLayers.length == 0 ) return;
	
	var commonStyles = globalFlashMap.layers[this.coverLayers[0]].properties.styles,
		cloudsCount = 0;
	
	for (var i = 0; i < this._icons.length; i++)
		this.cloudsIndexes.push({icon:this._icons[i]});
	
	for (var i = 0; i < commonStyles.length; ++i)
	{
		if (this.cloudsIndexes[i])
			this.cloudsIndexes[i].name = commonStyles[i].Name;
		
		cloudsCount++;
	}
	
	if ( typeof this._initCloudIndex !== 'undefined' )
		this.currCloudsIndex = this._initCloudIndex;
		
	this.cloudsCount = Math.round(cloudsCount / 2);
	this.commonStyles = commonStyles;
	
	if (typeof this.cloudsIndexes[this.currCloudsIndex] !== 'undefined' && $("#MapCalendar .ui-slider").length > 0)
		_title($("#MapCalendar .ui-slider")[0].firstChild, this.cloudsIndexes[this.currCloudsIndex].name);
}

CoverControl.prototype._updateLayers = function()
{
	if (typeof _mapHelper === 'undefined') return;
	//проверим основную карту
	this.coverLayers = _groupLayersHelper( globalFlashMap, _mapHelper.mapTree, this._coverLayersDescription ).names();

	//и все дополнительные тоже будем фильтровать
	if (typeof _queryExternalMaps.mapsCanvas != 'undefined')
	{
		for (var m = 0; m < _queryExternalMaps.mapsCanvas.childNodes.length; m++)
		{
			var mapElem = _queryExternalMaps.mapsCanvas.childNodes[m].childNodes[0];
			if (mapElem.extLayersTree)
				this.coverLayers = this.coverLayers.concat( _groupLayersHelper( globalFlashMap, mapElem.extLayersTree.mapHelper.mapTree, this._coverLayersDescription ).names() );
		}
	}
}

CoverControl.prototype._addWidget = function()
{
	if (this.cloudsIndexes.length == 0 || !this._parent ) return;
	
	var	cloudsSlider = nsGmx.Controls.createSlider(this.currCloudsIndex, function(){}),
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
		colorTds.push(_td(null,[['css','width', Math.round(100 / (this.cloudsCount - 1)) + 'px'], ['css','height',$.browser.msie ? '6px' : '7px'], ['css','backgroundColor', nsGmx.Utils.convertColor(this.commonStyles[i].RenderStyle.fill.color)]]))
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
	
	_(this._parent, [_table([_tbody(trs)],[['css','marginLeft','20px']])]);
	this._parent = null;
}

/**
* @function
* @param {Array} coverLayersDescription Массив имён слоёв для фильтрации
* @param {String} dateAttribute Имя аттрибута слоёв с датой
* @param {String} cloudsAttribute Имя аттрибута слоёв с облачностью
* @param {Array} icons Массив с именами иконок для облачности
* @param {Integer} initCloudIndex Начальная облачность
*/
CoverControl.prototype.init = function(coverLayersDescription, dateAttribute, cloudsAttribute, icons, initCloudIndex)
{
	this._coverLayersDescription = coverLayersDescription;
	this._initCloudIndex = initCloudIndex;
	this._icons = icons;
	
	this.dateAttribute = dateAttribute;
	this.cloudsAttribute = cloudsAttribute;
	
	this._updateLayers();
	
	this._updateStyles();
	
	var _this = this;
	
	if (typeof _queryExternalMaps !== 'undefined')
	{
		$(_queryExternalMaps).bind('map_loaded', function()
		{
			_this._updateLayers();
			_this._updateStyles();
			_this._addWidget();
			_this.setFilters();
		});
	}
	
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
			var icon = nsGmx.Controls.createGeometryIcon(globalFlashMap.layers[this.coverLayers[i]].properties.styles[0], "polygon");
				
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
				_mapHelper.createLayerEditor(this.parentNode, _layersTree, 'styles', -1);
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
* Добавляет в DOM контрол фильтрации по облачности
* @function
* @param {DOMElement} parent Контейнер для добавляения контрола
*/
CoverControl.prototype.add = function(parent)
{
	this._parent = parent;
	this._updateLayers();
	this._updateStyles();
	this._addWidget();
	
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
	
	if (typeof _queryExternalMaps !== 'undefined')
		$(_queryExternalMaps).bind('map_loaded', _setFilters);
}

/** Управляет видимостью слоёв в зависимости от диапазона дат. Может фильтровать слои только из определённой группы. Работает только с вьюером. Поддерживает фильтрацию в доп. картах.
	@memberOf cover
	@class 
*/
var LayerFiltersControl = function()
{
	var _calendar = null;
	var _groupTitle = null;
	var _layers = null;
	var _map = null;
	
	//по умолчанию слои фильтруются по дате
	var _defaultFilterFunc = function(layer, dateBegin, dateEnd)
	{
		var layerDate = $.datepicker.parseDate('dd.mm.yy', layer.properties.date);
		return dateBegin <= layerDate && layerDate <= dateEnd;
	}
	
	var _filterFunc = _defaultFilterFunc;
	
	var _IterateElems = function(treeElem, callback, parentVisible)
	{
		var visible = parentVisible && (treeElem.content ? treeElem.content.properties.visible : true);
		var childsArr = treeElem.content ? treeElem.content.children : treeElem.children;
		
		for (var i = 0; i < childsArr.length; i++)
		{
			var child = childsArr[i];
			
			if (child.type == 'group')
			{
				callback(child, visible);
				
				_IterateElems(child, callback, visible)
			}
			else
				callback(child, visible);
		}
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
					_updateTree(mapElem.extLayersTree, mapElem.extLayersTree.mapHelper.mapTree, mapElem);
			}
		}
		
		_updateTree(_layersTree, _mapHelper.mapTree, _queryMapLayers.buildedTree);
	}
	
	var _updateTree = function(layersTree, mapTree, domTreeRoot)
	{
		var dateBegin = _calendar.getDateBegin();
		var dateEnd = _calendar.getDateEnd();
		
		var layers = [];
		
		if (_layers)
			layers = _groupLayersHelper(_map, mapTree, _layers).asHash();
		else 
			layers = _groupTitle ? _groupLayersHelper(_map, mapTree, [{group: _groupTitle}]).asHash() : _getMapLayersAsHash();
		
		_IterateElems( mapTree, function(elem, parentVisible)
		{
			if (elem.content.properties.name in layers)
			{
				var isShowLayer = _filterFunc( layers[elem.content.properties.name], dateBegin, dateEnd );
                layersTree.treeModel.setNodeVisibility(elem, isShowLayer);
			}
		}, true);
	}
	
	/**
	 * @function Инициализитует фильтрацию слоёв. Далее классом будут отслеживаться события календарика.
	 * @param map Основная карта
	 * @param {cover.Calendar} calendar Календарик, который используется для задания дат
	 * @param {Object} params Дополнительные параметры: <br/>
	 *    groupTitle - имя группы, слои в которой нужно фильтровать. Устарело, используйте layers <br/>
	 *    layers - вектор из имён слоёв или указаний на группу, которые нужно фильтровать. Если не задано, будут фильтроваться все слои на карте.<br/>
	 *    filterFunc - ф-ция filterFunc(layer, dateBegin, dateEnd) -> Bool. Возвращает true, если слой нужно показать, false чтобы скрыть. По умолчанию происходит фильтрация по дате слоя.
	 */
	this.init = function(map, calendar, params)
	{
		_map = map;
		
		if ( typeof params != 'undefined' )
		{
			_groupTitle = params.groupTitle;
			_layers = params.layers;
			if (params.filterFunc) 
				_filterFunc = params.filterFunc;
		}
		
		if (_calendar)
			$(_calendar).unbind('change', _update);
			
		_calendar = calendar;
		$(_calendar).bind('change', _update);
		_update();
		
		$(_queryExternalMaps).bind('map_loaded', _update);
	}
	
	this.update = function() { _update() };
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
	
	var _bindDrawing = function( elem )
	{
		if (_elem)
			delete _elem.properties.firesBbox;
			
		_elem = elem;
		elem.properties.firesBbox = _bindingID;
		
		$(_button).val(_gtxt('searchBbox.CancelSearchInArea'));
	}
	
	this.removeBbox = function( keepSilence )
	{
		if ( !_elem ) return;
		
		delete _elem.properties.firesBbox;
		_elem = null;
		$(_button).val(_gtxt("searchBbox.SearchInArea"));
		update( keepSilence );
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
					_this.removeBbox();
			}, 
			onMouseUp: function( elem )
			{
				//if (!_elem)
				//	_bindDrawing( elem );
					
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
				_bindDrawing( o );
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
	
	this.bindDrawing = function( elem, keepSilence )
	{
		_bindDrawing( elem );
		update( keepSilence );
	}
	
	this.bindNewDrawing = function( geometry, properties, styles, keepSilence )
	{
		properties.firesBbox = _bindingID;
		var elem = globalFlashMap.drawing.addObject(geometry, properties);
		elem.setStyle( styles.regular, styles.hovered);
		_bindDrawing( elem );
		update( keepSilence );
	}
	
	this.getDrawing = function()
	{
		return _elem;
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
 * @class
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

var _formatDateForServer = function( datetime )
{
	var dateString = datetime.getDate() + "." + (datetime.getMonth()+1) + "." + datetime.getFullYear();
	var timeString = datetime.getHours() + ":00:00";
	return dateString + " " + timeString;
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
	
	var _params = $.extend({host: 'http://sender.kosmosnimki.ru/v3/',
							modisImagesHost: 'http://images.kosmosnimki.ru/MODIS/'
						   }, params);
	
	this.getDescription = function() { return _gtxt("firesWidget.DialyCoverage.Description"); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
		//запрашиваем только за первый день периода
		var modisUrl = _params.host + "DBWebProxy.ashx?Type=GetModisV2&Date=" + _formatDateForServer(dateEnd);
		
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
				resArr.push({ geometry: from_merc_geometry(curImage[3]),
							  dirName: params.modisImagesHost + curImage[4].split("\\").join("/"),
							  date: curImage[1]
						    });
			}
			
			onSucceess( resArr );
		});
	}
}

var _createHoverFunction = function(params, balloonProps)
{
	var addGeometrySummary = typeof params.addGeometrySummary !== 'undefined' ? params.addGeometrySummary : true;
	
	return function(o)
	{
		var p = balloonProps[o.objectId];
		
		if (!p) return;
					
		var res = typeof params.title !== 'undefined' ? params.title : "";
		for ( var i in p )
			res += "<b>" + i + ":</b> " + p[i] + "<br />";
		
		if (addGeometrySummary)
			res += o.getGeometrySummary();
		
		return res + (typeof params.endTitle !== 'undefined' ? "<br/>" + params.endTitle : "");
	}
}

var _hq = {
	getDistant: function(cpt, bl) {
		var Vy = bl[1][0] - bl[0][0];
		var Vx = bl[0][1] - bl[1][1];
		return (Vx * (cpt[0] - bl[0][0]) + Vy * (cpt[1] -bl[0][1]))
	},
	findMostDistantPointFromBaseLine: function(baseLine, points) {
		var maxD = 0;
		var maxPt = new Array();
		var newPoints = new Array();
		for (var idx in points) {
			var pt = points[idx];
			var d = this.getDistant(pt, baseLine);
			
			if ( d > 0) {
				newPoints.push(pt);
			} else {
				continue;
			}
			
			if ( d > maxD ) {
				maxD = d;
				maxPt = pt;
			}
		
		} 
		return {'maxPoint':maxPt, 'newPoints':newPoints}
	},

	buildConvexHull: function(baseLine, points) {
		
		var convexHullBaseLines = new Array();
		var t = this.findMostDistantPointFromBaseLine(baseLine, points);
		if (t.maxPoint.length) {
			convexHullBaseLines = convexHullBaseLines.concat( this.buildConvexHull( [baseLine[0],t.maxPoint], t.newPoints) );
			convexHullBaseLines = convexHullBaseLines.concat( this.buildConvexHull( [t.maxPoint,baseLine[1]], t.newPoints) );
			return convexHullBaseLines;
		} else {       
			return [baseLine];
		}    
	},
	getConvexHull: function(points) {	

		if (points.length == 1)
			return [[points[0], points[0]]];
			
		//find first baseline
		var maxX, minX;
		var maxPt, minPt;
		for (var idx in points) {
			var pt = points[idx];
			if (pt[0] > maxX || !maxX) {
				maxPt = pt;
				maxX = pt[0];
			}
			if (pt[0] < minX || !minX) {
				minPt = pt;
				minX = pt[0];
			}
		}
		var ch = [].concat(this.buildConvexHull([minPt, maxPt], points),
						   this.buildConvexHull([maxPt, minPt], points))
		return ch;
	}
}

//По начальной и конечной дате формирует строчку для отображения интервала дат
var _datePeriodHelper = function(dateMin, dateMax)
{
	if (dateMin === dateMax)
		return dateMin;
	else
		return dateMin + ' - ' + dateMax;
}

/** Провайдер данных об очагах и кластерах пожаров
* @memberOf cover
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого берутся данные о пожарах. Default: http://sender.kosmosnimki.ru/
* <i> {Bool} onlyPoints </i> Возвращать только очаги без класетеров
* <i> {Bool} onlyClusters </i> Возвращать только кластеры без очагов
* <i> {String} description </i> ID текста для описания в _translation_hash. Default: firesWidget.FireSpotClusters.Description
*/
var FireSpotClusterProvider = (function(){

	//этот кэш хранит уже обработанные данные с построенными границами кластеров и т.п.
	var _cache = {};
	var _lastRequestId = 0;
	
	var _processResponce = function(data)
	{
		if (data.Result != 'Ok')
		{
			//onError( data.Result == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
			return data.Result;
		}
		
		var resArr = [];
		var clusters = {};
		var dailyClusters = {};
		var clusterCentroids = {};
		for ( var d = 0; d < data.Response.length; d++ )
		{
			var a = data.Response[d];
			var dateInt = $.datepicker.parseDate('yy.mm.dd', a[3]).valueOf();
			var hotSpot = {clusterId: a[2], hotspotId: a[7], x: a[1], y: a[0], date: a[3], dateInt: dateInt, category: a[6] < 50 ? 0 : (a[4] < 100 ? 1 : 2), balloonProps: {"Время": a[4] + "&nbsp;(Greenwich Mean Time)"/*, "Вероятность": a[5]*/} };
			resArr.push(hotSpot);
			var clusterID = 'id' + a[2];
			
			if (a[2] !== null && a[2] >= 0)
			{
				if (typeof clusters[clusterID] === 'undefined')
				{
					clusters[clusterID] = [];
					dailyClusters[clusterID] = {};
					clusterCentroids[clusterID] = {x: 0, y:0};
				}
					
				clusters[clusterID].push([hotSpot.x, hotSpot.y]);
				clusterCentroids[clusterID].x += hotSpot.x;
				clusterCentroids[clusterID].y += hotSpot.y;
				
				if (typeof dailyClusters[clusterID][hotSpot.date] === 'undefined')
					dailyClusters[clusterID][hotSpot.date] = [];
					
				dailyClusters[clusterID][hotSpot.date].push([hotSpot.x, hotSpot.y]);
			}
		}
		
		var resDialyClusters = [];
		var clustersMinMaxDates = {};
		for (var k in dailyClusters)
		{
			var minDate = null;
			var maxDate = null;
			for (var d in dailyClusters[k])
			{
				var curDate = $.datepicker.parseDate('yy.mm.dd', d).valueOf();
				minDate = minDate != null ? Math.min(curDate, minDate) : curDate;
				maxDate = maxDate != null ? Math.max(curDate, maxDate) : curDate;
			}
			
			var numberDays = maxDate - minDate;
			
			clustersMinMaxDates[k] = {min: $.datepicker.formatDate('yy.mm.dd', new Date(minDate)), max: $.datepicker.formatDate('yy.mm.dd', new Date(maxDate))};
			
			for (var d in dailyClusters[k])
			{
				var daysFromBegin = ($.datepicker.parseDate('yy.mm.dd', d).valueOf() - minDate)/(24*3600*1000);
				var colorIndex = Math.round(($.datepicker.parseDate('yy.mm.dd', d).valueOf() - minDate)/numberDays*127);
				var lines = _hq.getConvexHull(dailyClusters[k][d]);
				var polyCoordinates = [lines[0][0]];
		
				for (var l = 0; l < lines.length; l++)
					polyCoordinates.push(lines[l][1]);
				
				resDialyClusters.push( { geometry: {type: "POLYGON", coordinates: [polyCoordinates]}, styleID: colorIndex, balloonProps: {"Кол-во очагов пожара": clusters[k].length, "Дата": d, "День:": daysFromBegin} } );
			}
		}
		
		var resClusters = [];
		for (var k in clusters)
		{
			var lines = _hq.getConvexHull(clusters[k]);
			var polyCoordinates = [lines[0][0]];
	
			for (var l = 0; l < lines.length; l++)
				polyCoordinates.push(lines[l][1]);
			
			resClusters.push( { geometry: {type: "POLYGON", coordinates: [polyCoordinates]}, x: clusterCentroids[k].x/clusters[k].length, y: clusterCentroids[k].y/clusters[k].length,
								label: clusters[k].length,
								points: clusters[k].length,
								clusterId: k.substr(2),
								balloonProps: {"Кол-во горячих точек": clusters[k].length, 
											   "Период наблюдения": _datePeriodHelper(clustersMinMaxDates[k].min, clustersMinMaxDates[k].max)}
							 } );
		}
		
		return {fires: resArr, clusters: resClusters, dialyClusters: resDialyClusters};
	}
	
	//кэширует уже обработанные данные
	//гарантирует, что будут вызываться калбеки только для последнего запроса на сервер
	var _addRequestCallback = function(url, callback)
	{
		if (!(url in _cache))
		{
			_lastRequestId++;
			var curRequestId = _lastRequestId;
			_cache[url] = {status: 'waiting', data: null, callbacks: [callback]};
			IDataProvider.sendCachedCrossDomainJSONRequest(url, function(data)
			{
				if (curRequestId !== _lastRequestId) return;
				
				_cache[url].status = 'done';
				_cache[url].data = _processResponce(data);
				for (var k = 0; k < _cache[url].callbacks.length; k++)
					_cache[url].callbacks[k](_cache[url].data);
			});
		} else {
			if (_cache[url].status === 'done')
				callback(_cache[url].data);
			else
				_cache[url].callbacks.push(callback);
		}
	}
	
	return function( params )
	{
		var _params = $.extend({
			host: 'http://sender.kosmosnimki.ru/',
			requestType: 'GetClustersPointsBBoxV2',
			onlyPoints: false, 
			onlyClusters: false, 
			onlyDialyClusters: false, 
			description: "firesWidget.FireSpotClusters.Description"
		}, params );
		
		this.getDescription = function() { return _gtxt(_params.description); }
		this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
		{
			var urlBbox = bbox ? '&MinX='+ bbox.minX + '&MinY='+ bbox.minY + '&MaxX='+ bbox.maxX + '&MaxY='+ bbox.maxY : "";
			// var urlFires = _params.host + "DBWebProxy.ashx?Type=" + _params.requestType + "&StartDate=" + dateBegin + "&EndDate=" + dateEnd + urlBbox;
			var urlFires = _params.host + "DBWebProxy.ashx?Type=" + _params.requestType + "&StartDate=" + _formatDateForServer(dateBegin) + "&EndDate=" + _formatDateForServer(dateEnd) + urlBbox;
			
			//IDataProvider.sendCachedCrossDomainJSONRequest(urlFires, function(data)
			_addRequestCallback(urlFires, function(data)
			{
				if (typeof data === 'string')
				{
					onError( data == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
					return;
				}
				if (_params.onlyClusters)
					onSucceess( data.clusters );
				else if (_params.onlyDialyClusters)
					onSucceess( data.dialyClusters );
				else if (_params.onlyPoints)
					onSucceess( data.fires );
				else
					onSucceess( data );
			});
		}
	}
})();

/** Провайдер данных о кластерах пожаров
* @memberOf cover
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого берутся данные о пожарах. Default: http://sender.kosmosnimki.ru/v3/
* <i> {String} description </i> ID текста для описания в _translation_hash. Default: firesWidget.FireClustersSimple.Description
*/
var FireClusterSimpleProvider = function( params )
{
	var _params = $.extend({requestType: "GetClustersInfoBbox",  host: 'http://sender.kosmosnimki.ru/v3/', description: "firesWidget.FireClustersSimple.Description" }, params );
	
	this.getDescription = function() { return _gtxt(_params.description); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
	
		var urlBbox = bbox ? '&MinX='+ bbox.minX + '&MinY='+ bbox.minY + '&MaxX='+ bbox.maxX + '&MaxY='+ bbox.maxY : "";
		var urlFires = _params.host + "DBWebProxy.ashx?Type=" + _params.requestType + "&StartDate=" + _formatDateForServer(dateBegin) + "&EndDate=" + _formatDateForServer(dateEnd) + urlBbox;
		//var urlFires = _params.host + "DBWebProxy.ashx?Type=GetClusters&StartDate=" + dateBegin + "&EndDate=" + dateEnd + urlBbox;
		
		IDataProvider.sendCachedCrossDomainJSONRequest(urlFires, function(data)
		{
			if (data.Result != 'Ok')
			{
				onError( data.Result == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
				return;
			}
			
			var resArr = [];
			var clusters = [];
			for ( var d = 0; d < data.Response.length; d++ )
			{
				var a = data.Response[d];
				// var t = globalFlashMap.addObject();
				// t.setCircle(a[2], a[1], 10000);
				
				// var geom = [];
				// for (var i = 0; i < a[8].coordinates[0].length; i++)
					// geom.push([a[8].coordinates[0][i][1], a[8].coordinates[0][i][0]]);
				
				//var hotSpot = { x: a[2], y: a[1], power: a[7], points: a[5], label: a[5], balloonProps: {"Кол-во очагов пожара": a[5], "Мощность": Number(a[7]).toFixed(), "Дата начала": a[3], "Дата конца": a[4]} };
				var hotSpot = { clusterId: a[0], geometry: a[8], power: a[7], points: a[5], label: a[5], dateBegin: a[3], dateEnd: a[4] /*, balloonProps: {"Кол-во очагов пожара": a[5], "Мощность": Number(a[7]).toFixed(), "Дата начала": a[3], "Дата конца": a[4]}*/ };
				// var hotSpot = { geometry: {type: "POLYGON", coordinates: [geom]}, power: a[7], points: a[5], label: a[5], balloonProps: {"Кол-во очагов пожара": a[5], "Мощность": Number(a[7]).toFixed(), "Дата начала": a[3], "Дата конца": a[4]} };
				resArr.push(hotSpot);
			}
			
			onSucceess( resArr );
		});
	}
}

var CombinedProvider = function( description, providers )
{
	var _providers = providers;
	
	this.getDescription = function() { return _gtxt(description); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
		var totalResponces = 0;
		var providerResponces = [];
		for (var i = 0; i < _providers.length; i++)
			(function(i) {
				_providers[i].getData( dateBegin, dateEnd, bbox, 
					function( data )
					{
						providerResponces[i] = data;
						totalResponces++;
						
						if (totalResponces === _providers.length)
							onSucceess( providerResponces );
					},
					function( type )
					{
						onError( type );
					}
				)
			})(i);
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
	var _params = $.extend({ fireIconsHost: 'http://maps.kosmosnimki.ru/images/', minZoom: 1, maxZoom: 17, customStyleProvider: null, onclick: null, bringToDepth: false }, params);
	
	var _depthContainer = globalFlashMap.addObject();
	if (_params.bringToDepth) _depthContainer.bringToDepth(_params.bringToDepth);
	
	var _firesObj = null;
	var _balloonProps = {};
	this.bindData = function(data)
	{
		if (_firesObj) _firesObj.remove();
		_balloonProps = {};
		_firesObj = _depthContainer.addObject();
		_firesObj.setVisible(false);
		
		var weak = _firesObj.addObject();
		var medium = _firesObj.addObject();
		var strong = _firesObj.addObject();
		
		weak.setZoomBounds(_params.minZoom, _params.maxZoom);
		medium.setZoomBounds(_params.minZoom, _params.maxZoom);
		strong.setZoomBounds(_params.minZoom, _params.maxZoom);
		
		if (_params.customStyleProvider === null)
		{
			var imageNames = ["","",""];
			if (_params.fireIcon)
				imageNames = [_params.fireIcon, _params.fireIcon, _params.fireIcon];
			else if (_params.fireIcons)
				imageNames = _params.fireIcons;
			else
				imageNames = [ _params.fireIconsHost + "fire_weak.png", _params.fireIconsHost + "fire.png", _params.fireIconsHost + "fire_strong.png" ];
				
			weak.setStyle({ marker: { image: imageNames[0], center: true} });
			medium.setStyle({ marker: { image: imageNames[1], center: true} });
			strong.setStyle({ marker: { image: imageNames[2], center: true } });
		}
		
		if (_params.bringToDepth)
		{
			weak.bringToDepth(_params.bringToDepth);
			medium.bringToDepth(_params.bringToDepth);
			strong.bringToDepth(_params.bringToDepth);
		}

		var _obj = {'weak': {'node':weak, 'arr': [], 'balloonProps': []}, 'medium': {'node':medium, 'arr': [], 'balloonProps': []}, 'strong': {'node':strong, 'arr': [], 'balloonProps': []}};
		for (var i = 0; i < data.length; i++)
		{
			var a = data[i];
			
			if (!a) continue;
			
			var objContainer = null;
			var addBallonProps = {"Дата": a.date };
			
			var key = 'medium';
			if (typeof a.category != 'undefined')
			{
				var isWeak = (a.category == 0);
				var isMedium = (a.category == 1);
				objContainer = (isWeak ? weak : isMedium ? medium : strong);
				key = (isWeak ? 'weak' : isMedium ? 'medium' : 'strong');
				addBallonProps["Категория"] = (isWeak ? "Слабый" : isMedium ? "Средний" : "Сильный");
			}
			else
				objContainer = medium;
				
			var objProperties = a.hotspotId ? {hotspotId: a.hotspotId } : {};
			objProperties.dateInt = a.dateInt;
			objProperties.clusterId = a.clusterId;
			_obj[key].arr.push( {geometry: { type: "POINT", coordinates: [a.x, a.y] }, properties: objProperties, src: a} );
			
			if (typeof a.balloonProps !== 'undefined')
				_obj[key].balloonProps.push( $.extend({}, a.balloonProps, addBallonProps) );
			else
				_obj[key].balloonProps.push( null );
		}
		for (var k in _obj)
		{
			var ph = _obj[k];
			if(ph.arr.length > 0) {
				var arr = ph.node.addObjects( ph.arr );
				for (var i = 0; i < arr.length; i++)
				{
					_balloonProps[arr[i].objectId] = ph.balloonProps[i];
				}
				
				//кастомные стили для каждого объекта
				if (_params.customStyleProvider)
					for (var i = 0; i < arr.length; i++)
						arr[i].setStyle(_params.customStyleProvider(ph.arr[i].src));
				
				//метки
				for (var i = 0; i < arr.length; i++){
					if (typeof ph.arr[i].src.label !== 'undefined'){
						arr[i].setLabel(ph.arr[i].src.label);
					}
				}
				
				
			}
		}
		
		var ballonHoverFunction = _createHoverFunction(_params, _balloonProps);
		
		weak.enableHoverBalloon(ballonHoverFunction);
		medium.enableHoverBalloon(ballonHoverFunction);
		strong.enableHoverBalloon(ballonHoverFunction);
		
		if (_params.onclick !== 'undefined')
		{
			weak.setHandler  ('onClick', _params.onclick );
			medium.setHandler('onClick', _params.onclick );
			strong.setHandler('onClick', _params.onclick );
		}
	}
	
	this.filterByDate = function(date)
	{
		if (!_firesObj) return;
		
		var filter = "`dateInt`='" + date + "'";
		_firesObj.setFilter(filter);
	}
	
	this.setVisible = function(flag)
	{
		if (_firesObj) _firesObj.setVisible(flag);
	}
	
	this.bindClickEvent = function(handler)
	{
		_params.onclick = handler;
	}
}

/** Рисует на карте гари
* @memberOf cover
* @class
*/
var FireBurntRenderer = function( params )
{
	var defaultStyle = [
			{ outline: { color: 0xff0000, thickness: 2 }, fill: { color: 0xffffff, opacity: 5 } },
			{ outline: { color: 0xff0000, thickness: 3 }, fill: { color: 0xffffff, opacity: 15 } }
		];
	var _params = $.extend({ minZoom: 1, maxZoom: 17, defStyle: defaultStyle, bringToDepth: false, title: "<b style='color: red;'>СЛЕД ПОЖАРА</b><br />" }, params);
	var _burntObj = null;
	
	var _depthContainer = globalFlashMap.addObject();
	if (_params.bringToDepth) _depthContainer.bringToDepth(_params.bringToDepth);
	
	var _balloonProps = {};
	this.bindData = function(data)
	{
		if (_burntObj) _burntObj.remove();
		_balloonProps = {};
		_burntObj = _depthContainer.addObject();
		_burntObj.setZoomBounds(_params.minZoom, _params.maxZoom);
		_burntObj.setVisible(false);
		_burntObj.setStyle( _params.defStyle[0], _params.defStyle[1] );
		
		for (var i = 0; i < data.length; i++)
			(function(b){
				if (!b) return;
				if (b.geometry.coordinates[0].length == 2)
				{
					b.geometry.type = "POINT";
					b.geometry.coordinates = b.geometry.coordinates[0];
				}
				
				var obj = _burntObj.addObject( b.geometry );
				
				// var debObj = globalFlashMap.addObject( b.geometry );
				// debObj.setStyle({ outline: { color: 0xff00ff, thickness: 1, dashes: [3,3] }, fill: { color: 0xff00ff, opacity: 10 } });
				// console.log(obj.getGeometry());
				
				if (typeof b.styleID !== 'undefined' && typeof _params.styles != 'undefined' && typeof _params.styles[b.styleID] != 'undefined')
					obj.setStyle( _params.styles[b.styleID][0], _params.styles[b.styleID][1] );
					
				if (typeof b.balloonProps !== 'undefined')
					_balloonProps[obj.objectId] = $.extend({}, b.balloonProps, {"Дата": b.date});
				else
					_balloonProps[obj.objectId] = null;
					
			})(data[i]);
			
		_burntObj.enableHoverBalloon(_createHoverFunction(_params, _balloonProps));
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
var ModisImagesRenderer = function( params )
{
	var _params = $.extend( {}, params );
	
	var _imagesObj = null;
	this.bindData = function(data)
	{
		if (_imagesObj) _imagesObj.remove();
		_imagesObj = globalFlashMap.addObject();
		
		if ( typeof _params.depth !== 'undefined' )
			_imagesObj.bringToDepth( _params.depth );
		
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

var CombinedFiresRenderer = function( params )
{
	var _params = $.extend({ fireIconsHost: 'http://maps.kosmosnimki.ru/images/'}, params);
	var customStyleProvider = function(obj)
	{
		var style = { marker: { image: _params.fireIconsHost + 'fire_sample.png', center: true, scale: String(Math.sqrt(obj.points)/5)} };
		if (obj.label >= 10)
			style.label = { size: 12, color: 0xffffff, align: 'center'};
		return style;
	}
	
	var defStyle = [
		{ outline: { color: 0xff0000, thickness: 2 }, fill: { color: 0xff0000, opacity: 15 }, marker: {size: 2, color: 0xff0000, thickness: 1} },
		{ outline: { color: 0xff0000, thickness: 2 }, fill: { color: 0xff0000, opacity: 15 }, marker: {size: 2, color: 0xff0000, thickness: 1} }
	];
	
	var wholeDefStyle = [
		{ outline: { color: 0xff00ff, thickness: 1, dashes: [3,3] }, fill: { color: 0xff00ff, opacity: 7 } },
		{ outline: { color: 0xff00ff, thickness: 1, dashes: [3,3] }, fill: { color: 0xff00ff, opacity: 7 } }
	];
	
	var _clustersRenderer = new FireSpotRenderer({maxZoom: 7, customStyleProvider: customStyleProvider, title: "<div style='margin-bottom: 5px;'><b style='color: red;'>Пожар</b></div>", endTitle: "<div style='margin-top: 5px;'><i>Приблизьте карту, чтобы увидеть контур</i></div>"});
	var _wholeFireRenderer = new FireBurntRenderer({minZoom: 8, defStyle: wholeDefStyle, title: "<div style='margin-bottom: 5px;'><b style='color: red;'>Контур пожара</b></div>"/*, bringToDepth: -1*/});
	var _geometryRenderer = new FireBurntRenderer({minZoom: 8, defStyle: defStyle, title: "<div style='margin-bottom: 5px;'><b style='color: red;'>Контур пожара</b></div>"/*, bringToDepth: 100*/, addGeometrySummary: false});
	var _hotspotRenderer  = new FireSpotRenderer({title: "<div style='margin-bottom: 5px;'><b style='color: red;'>Очаг пожара</b></div>", minZoom: 11});
	var _curData = null;
	
	//это некоторый хак для того, чтобы объединить в балунах контуров пожаров оперативную и историческую информацию о пожарах.
	var mergeBalloonsData = function(data)
	{
		//будем переносить данные из инсторических в оперативных кластеры
		var clusterHash = {};
		
		for (var cl = 0; cl < data[1].length; cl++)
			clusterHash['id'+data[1][cl].clusterId] = data[1][cl];
		
		for ( var cl = 0; cl < data[0].clusters.length; cl++ )
		{
			var id = 'id' + data[0].clusters[cl].clusterId;
			if (id in clusterHash)
				$.extend( data[0].clusters[cl].balloonProps, {
					"Период горения": _datePeriodHelper(clusterHash[id].dateBegin, clusterHash[id].dateEnd),
					"Выгоревшая площадь": prettifyArea(geoArea(clusterHash[id].geometry))
				});
		}
	}
	
	this.bindData = function(data)
	{
		mergeBalloonsData(data);
	
		_curData = data;
		_clustersRenderer.bindData(data[0].clusters);
		_geometryRenderer.bindData(data[0].clusters);
		_hotspotRenderer.bindData(data[0].fires);
		_wholeFireRenderer.bindData(data[1]);
	}
	
	this.setVisible = function(flag)
	{
		_clustersRenderer.setVisible(flag);
		_geometryRenderer.setVisible(flag);
		_hotspotRenderer.setVisible(flag);
		_wholeFireRenderer.setVisible(flag);
	}
	
	this.filterByDate = function(date)
	{
		_clustersRenderer.filterByDate(date);
	}
	
	this.bindSpotClickEvent = function(handler)
	{
		_hotspotRenderer.bindClickEvent(handler);
	}
	
	this.bindClusterClickEvent = function(handler)
	{
		_clustersRenderer.bindClickEvent(handler);
	}
	
	this.getHotspotIDsByClusterID = function(clusterId)
	{
		var resArr = [];
		for (var hp = 0; hp < _curData[0].fires.length; hp++)
		{
			if (_curData[0].fires[hp].clusterId == clusterId)
				resArr.push(_curData[0].fires[hp].hotspotId);
		}
		
		return resArr;
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
	
	this._currentVisibility = true;
	
	this._timeShift = null;
}


//настройки виджета пожаров по умолчанию
FiresControl.DEFAULT_OPTIONS = 
{
	firesHost:       'http://sender.kosmosnimki.ru/v3/',
	imagesHost:      'http://sender.kosmosnimki.ru/v3/',
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
	
	var resData = {
		dataContrololersState: dc, 
		bbox: this.searchBboxController.saveState() 
	}
	
	if (this._timeShift)
		$.extend(true, resData, {timeShift: this._timeShift});
	
	return resData;
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
			curController.renderer.setVisible(curController.visible && this._currentVisibility);
		}
		
	if (data.timeShift)
		this._timeShift = $.extend({}, data.timeShift);
			
	this.searchBboxController.loadState(data.bbox);
}


FiresControl.prototype.setVisible = function(isVisible)
{
	this._currentVisibility = isVisible;
	for (var k in this.dataControllers)
	{
		var controller = this.dataControllers[k];
		controller.renderer.setVisible(isVisible ? controller.visible : false);
	}
}

// providerParams: 
//     - isVisible - {Bool, default: true} виден ли по умолчанию сразу после загрузки
//     - isUseDate - {Bool, default: true} зависят ли данные от даты
//     - isUseBbox - {Bool, default: true} зависят ли данные от bbox
FiresControl.prototype.addDataProvider = function( name, dataProvider, dataRenderer, providerParams )
{
	providerParams = $.extend( { isVisible: true, isUseDate: true, isUseBbox: true }, providerParams );
		
	this.dataControllers[name] = { 
		provider: dataProvider, 
		renderer: dataRenderer, 
		visible: providerParams.isVisible, 
		name: name, 
		params: providerParams,
		curRequestIndex: 0 //для отслеживания устаревших запросов
	};
	
	this._updateCheckboxList();
	if (this.dateFiresBegin && this.dateFiresEnd)
		this.loadForDates( this.dateFiresBegin, this.dateFiresEnd );
}

FiresControl.prototype.getRenderer = function( name )
{
	return (name in this.dataControllers) ? this.dataControllers[name].renderer : null;
}

FiresControl.prototype._doFiltering = function(date)
{
	for (var k in this.dataControllers)
	{
		var renderer = this.dataControllers[k].renderer;
		if (typeof renderer.filterByDate !== 'undefined')
			renderer.filterByDate(date);
	}
}

//Перерисовывает все checkbox'ы. Возможно, стоит оптимизировать
FiresControl.prototype._updateCheckboxList = function()
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
				dataController.renderer.setVisible(this.checked && _this._currentVisibility);
			}
		})(this.dataControllers[k]);
		
		var curTr = _tr([_td([checkbox]), _td([_span([_t( this.dataControllers[k].provider.getDescription() )],[['css','marginLeft','3px']])])]);
		trs.push(curTr);
		trs.push(_tr([_td(null, [['attr','colSpan',2],['css','height','2px']])]));
	}
	
	$("#checkContainer", this._parentDiv).append( _table([_tbody(trs)],[['css','marginLeft','4px']]) );
}

FiresControl.prototype.findBbox = function()
{
	this.searchBboxController.findBbox();
}

FiresControl.prototype._addTimeShift = function(date)
{
	if (!this._timeShift) return;
	
	date.setHours(this._timeShift.hours);
	date.setMinutes(this._timeShift.minutes);
	date.setSeconds(this._timeShift.seconds);
}

FiresControl.prototype._updateDateInfo = function()
{
	var infoContainter = $('#datesInfo', this._parentDiv);
	infoContainter.empty();
	
	// var dateBeginString = $.datepicker.formatDate('yy.mm.dd', this.dateFiresBegin) + ;
	var dateBeginString = _formatDateForServer(this.dateFiresBegin) + " - " + _formatDateForServer(this.dateFiresEnd) + " UTC";
	
	infoContainter.text(dateBeginString);
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
	
	//в упрощённом режиме будем запрашивать за последние 24 часа, а не за календартный день
	if (this._visModeController.getMode() ===  this._visModeController.SIMPLE_MODE)
	{	
		this._addTimeShift(dateBegin);
		this._addTimeShift(dateEnd);
		
		dateBegin.setTime(dateBegin.getTime() - 24*60*60*1000);
		
		// var now = new Date();
		// dateBegin.setHours(now.getUTCHours());
		// dateBegin.setMinutes(now.getUTCMinutes());
		// dateBegin.setSeconds(now.getUTCSeconds());
		
		// dateEnd.setHours(now.getUTCHours());
		// dateEnd.setMinutes(now.getUTCMinutes());
		// dateEnd.setSeconds(now.getUTCSeconds());
	}
	else
	{
		dateEnd.setTime(dateEnd.getTime() + 24*60*60*1000); //увеличиваем верхнюю границу на сутки
	}
		
	var curExtent = this.getBbox();
	
	var isDatesChanged = !this.dateFiresBegin || !this.dateFiresEnd || dateBegin.getTime() != this.dateFiresBegin.getTime() || dateEnd.getTime() != this.dateFiresEnd.getTime();
	
	var isBBoxChanged = !curExtent.isEqual(this.requestBbox);
	//var isBBoxChanged = !curExtent.isInside(this.requestBbox) || !this.statusModel.getCommonStatus();
	
	this.dateFiresBegin = dateBegin;
	this.dateFiresEnd = dateEnd;
	
	this._updateDateInfo();
	
    var _this = this;
	
	if (isBBoxChanged || isDatesChanged) {
		this.requestBbox = curExtent;
	}
	
	for (var k in this.dataControllers)
	{
		var curController = this.dataControllers[k];
		if ( curController.visible && ( (isDatesChanged && curController.params.isUseDate) || (isBBoxChanged && curController.params.isUseBbox) || !curController.data ) )
		{
			//если у нас получилась пустая область запроса, просто говорим рендереру очистить все данные
			if ( curExtent.isEmpty() )
			{
				curController.renderer.bindData( null );
				curController.renderer.setVisible(curController.visible && this._currentVisibility);
			}
			else
			{
				this.processingModel.setStatus( curController.name, false);
				
				(function(curController){
					curController.curRequestIndex++;
					var requestIndex = curController.curRequestIndex;
					//curController.provider.getData( $.datepicker.formatDate(_this._firesOptions.dateFormat, dateBegin), $.datepicker.formatDate(_this._firesOptions.dateFormat, dateEnd), curExtent.getBounds(), 
					curController.provider.getData( dateBegin, dateEnd, curExtent.getBounds(), 
						function( data )
						{
							if (requestIndex != curController.curRequestIndex) return; //был отправлен ещё один запрос за то время, как пришёл этот ответ -> этот ответ пропускаем
							
							curController.data = data;
							_this.processingModel.setStatus( curController.name, true);
							_this.statusModel.setStatus( curController.name, true );
							
							curController.renderer.bindData( data );
							curController.renderer.setVisible(curController.visible && _this._currentVisibility);
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

FiresControl.prototype.add = function(parent, firesOptions, globalOptions, visModeController, calendar)
{
	this._visModeController = visModeController;
	this._calendar = calendar;
	
	this._firesOptions = $.extend( {}, FiresControl.DEFAULT_OPTIONS, firesOptions );
	this._initExtent = new BoundsExt( firesOptions.initExtent ? firesOptions.initExtent : BoundsExt.WHOLE_WORLD );
	if ( firesOptions.initExtent && firesOptions.showInitExtent )
	{
		var ie = firesOptions.initExtent;
		var objInitExtent = globalFlashMap.addObject( {type: "POLYGON", coordinates: [[[ie.minX, ie.minY], [ie.minX, ie.maxY], [ie.maxX, ie.maxY], [ie.maxX, ie.minY], [ie.minX, ie.minY]]]} );
		objInitExtent.setStyle( { outline: { color: 0xff0000, thickness: 1, opacity: 20 }, fill: { color: 0xffffff, opacity: 10 } } );
	}
	
	this._parentDiv = parent;
	this.globalOptions = globalOptions;
	
	$(this._parentDiv).prepend(_div(null, [['dir', 'id', 'checkContainer']]));	
	
	if ( this._firesOptions.firesOld ) 
		this.addDataProvider( "firedots_old",
							  new FireSpotProvider( {host: this._firesOptions.firesHost} ),
							  new FireSpotRenderer( {fireIconsHost: this._firesOptions.fireIconsHost} ),
							  { isVisible: this._firesOptions.firesOldInit } );
							  
	if ( this._firesOptions.burnt ) 
		this.addDataProvider( "burnts",
							new FireBurntProvider( {host: this._firesOptions.burntHost} ),
							new FireBurntRenderer(),
							{ isVisible: this._firesOptions.burntInit } );
						  
	if ( this._firesOptions.images ) 
		this.addDataProvider( "images",
							  new ModisImagesProvider( {host: this._firesOptions.imagesHost, modisImagesHost: this._firesOptions.modisImagesHost} ),
							  new ModisImagesRenderer( {depth: this._firesOptions.modisDepth } ),
							  { isVisible: this._firesOptions.imagesInit, isUseBbox: false } );
							  
	if ( this._firesOptions.fires )
	{
		var spotProvider = new FireSpotClusterProvider({host: this._firesOptions.host || 'http://sender.kosmosnimki.ru/v3/', description: "firesWidget.FireCombinedDescription", requestType: this._firesOptions.requestType});
		var wholeClusterProvider = new FireClusterSimpleProvider();
		
		this.addDataProvider( "firedots",
							  new CombinedProvider( "firesWidget.FireCombinedDescription", [spotProvider, wholeClusterProvider] ),
							  new CombinedFiresRenderer(), 
							  { isVisible: this._firesOptions.firesInit } );
    }
	
	this.searchBboxController.init();
	
	//var processImg = _img(null, [['attr','src', globalOptions.resourceHost + 'img/progress.gif'],['css','marginLeft','10px'], ['css', 'display', 'none']]);
	var processImg = _img(null, [['attr','src', globalOptions.resourceHost + 'img/loader.gif']]);
	var processDiv = _table([_tbody([_tr([_td([processImg], [['css', 'textAlign', 'center']])])])], [['css', 'zIndex', '1000'], ['css', 'width', '100%'], ['css', 'height', '100%'], ['css', 'position', 'absolute'], ['css', 'display', 'table'], ['css', 'top', '0px'], ['css', 'left', '0px']]);
	
	var flashDiv = document.getElementById(globalFlashMap.flashId);
	
	
	_(flashDiv.parentNode, [processDiv]);
	
	var trs = [];
	var _this = this;
	
	var restrictByVisibleExtent = function( keepSilence )
	{
		var deltaX = 400;
		var deltaY = 150;
		var flashDiv = document.getElementById(globalFlashMap.flashId);
		var mapExtent = globalFlashMap.getVisibleExtent();
		var x = merc_x(globalFlashMap.getX());
		var y = merc_y(globalFlashMap.getY());
		var scale = getScale(globalFlashMap.getZ());
		var w2 = scale*(flashDiv.clientWidth-deltaX)/2;
		var h2 = scale*(flashDiv.clientHeight-deltaY)/2;
		var mapExtent = {
			minX: from_merc_x(x - w2),
			minY: from_merc_y(y - h2),
			maxX: from_merc_x(x + w2),
			maxY: from_merc_y(y + h2)
		};
				
		var geometry = {type: "POLYGON", coordinates: 
			[[[mapExtent.minX, mapExtent.minY],
			  [mapExtent.minX, mapExtent.maxY],
			  [mapExtent.maxX, mapExtent.maxY],
			  [mapExtent.maxX, mapExtent.minY],
			  [mapExtent.minX, mapExtent.minY]]]};
		
		var outlineColor = 0xff0000;
		var fillColor = 0xffffff;
		var regularDrawingStyle = {
			marker: { size: 3 },
			outline: { color: outlineColor, thickness: 3, opacity: 80 },
			fill: { color: fillColor }
		};
		var hoveredDrawingStyle = { 
			marker: { size: 4 },
			outline: { color: outlineColor, thickness: 4 },
			fill: { color: fillColor }
		};
		
		// obj.setStyle( regularDrawingStyle, hoveredDrawingStyle );
		
		var curDrawing = _this.searchBboxController.getDrawing();
		
		// _this.searchBboxController.bindDrawing(obj, keepSilence);
		_this.searchBboxController.bindNewDrawing(geometry, {}, {regular: regularDrawingStyle, hovered: hoveredDrawingStyle}, keepSilence);
		
		if (curDrawing)
			curDrawing.remove();
	}
	
	// var trackVisibleArea = true;
	// globalFlashMap.setHandler('onMove', function()
	// {
		// if (!trackVisibleArea || _this._visModeController.getMode() ===  _this._visModeController.SIMPLE_MODE) return;
		// var savedExtent = globalFlashMap.getVisibleExtent();
		// setTimeout(function()
		// {
			// if (!trackVisibleArea) return;
			// var curExtent = globalFlashMap.getVisibleExtent();
			// if ( curExtent.minX === savedExtent.minX && curExtent.maxX === savedExtent.maxX && 
				 // curExtent.minY === savedExtent.minY && curExtent.maxY === savedExtent.maxY )
				 // {
					// restrictByVisibleExtent();
				 // }
		// }, 1000);
	// })
	
	var button = $("<button>").attr('className', 'findFiresButton')[0];
	
	$(button).text(_gtxt('firesWidget.AdvancedSearchButton'));
	// $(button)
		// .append($("<img>").attr({src: globalOptions.resourceHost + "img/select_tool_a.png"}))
		// .append($("<span>").text(_gtxt('firesWidget.AdvancedSearchButton')));
		
	// $(button).append($("<table>").
				// append($("<tbody>").
					// append($("<tr>").
						// append($("<td>").
							// append($("<img>").attr({src: globalOptions.resourceHost + "img/select_tool_a.png"}))).
						// append($("<td>").
							// append($("<span>").text(_gtxt('firesWidget.AdvancedSearchButton')))))));
	
	$(this.searchBboxController).bind('change', function()
	{
		if (_this.searchBboxController.getBbox().isWholeWorld() && _this._visModeController.getMode() ===  _this._visModeController.ADVANCED_MODE)
			restrictByVisibleExtent(true);
			
		var dateBegin = _this._calendar.getDateBegin();
		var dateEnd = _this._calendar.getDateEnd();
		
		_this.loadForDates( _this._calendar.getDateBegin(), _this._calendar.getDateEnd() );
	})
	
	button.onclick = function()
	{
		if ( _this.searchBboxController.getBbox().isWholeWorld() )
		{
			//пользователь нажал на поиск, а рамки у нас нет -> добавим рамку по размеру окна.
			restrictByVisibleExtent(true);
		}
		_this.loadForDates( _this._calendar.getDateBegin(), _this._calendar.getDateEnd() );
	};
	$(button).css({display: 'none'});
	
	$(this._visModeController).bind('change', function()
	{
		if ( _this._visModeController.getMode() ===  _this._visModeController.SIMPLE_MODE )
		{
			$(button).css({display: 'none'});
			var curDrawing = _this.searchBboxController.getDrawing();
			
			if (curDrawing)
			{
				_this.searchBboxController.removeBbox( true );
				curDrawing.remove();
			}
			
			var now = new Date();
			_this._timeShift = {
				hours: now.getUTCHours(), 
				minutes: now.getUTCMinutes(), 
				seconds: now.getUTCSeconds()
			};
		}
		else 
		{	
			if ( _this.searchBboxController.getBbox().isWholeWorld() )
			{
				//пользователь нажал на поиск, а рамки у нас нет -> добавим рамку по размеру окна.
				restrictByVisibleExtent(true);
			}
			this._timeShift = null;
			
			//$(button).css({display: ''});
		}
		_this.loadForDates( _this._calendar.getDateBegin(), _this._calendar.getDateEnd() );
	});
	
	var now = new Date();
	this._timeShift = {
		hours: now.getUTCHours(), 
		minutes: now.getUTCMinutes(), 
		seconds: now.getUTCSeconds()
	};
	
	var internalTable = _table([_tbody([_tr([_td([button])/*, _td([processImg])*/])])], [['css', 'marginLeft', '15px']]);
	trs.push(_tr([_td([internalTable], [['attr','colSpan',2]])]));
	
	var statusDiv = _div([_t(_gtxt('firesWidget.tooManyDataWarning'))], [['css', 'backgroundColor', 'yellow'], ['css','padding','2px'], ['css', 'display', 'none']]);
	trs.push(_tr([_td([statusDiv], [['attr','colSpan',2]])]));
	
	$(this.statusModel).bind('change', function()
	{
		statusDiv.style.display = _this.statusModel.getCommonStatus() ? 'none' : 'block';
	})
	
	$(this.processingModel).bind('change', function()
	{
		processDiv.style.display = _this.processingModel.getCommonStatus() /*|| _this._visModeController.getMode() === _this._visModeController.SIMPLE_MODE*/ ? 'none' : '';
	})
	
	$(this._parentDiv).append(_table([_tbody(trs)],[['css','marginLeft','0px']]));
	$(this._parentDiv).append(_div(null, [['dir', 'id', 'datesInfo']]));
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
	if (typeof nsGmx !== 'undefined' && typeof nsGmx.DrawingObjectCustomControllers !== 'undefined')
	{
		nsGmx.DrawingObjectCustomControllers.addDelegate(
		{
			isHidden: function(obj)
			{
				return typeof obj.options.firesBbox !== 'undefined';
			}
		});
	}
	
	this.calendar = new Calendar();
	this.fires = new FiresControl();
	this.cover = new CoverControl();
	this.filters = new FiltersControl();
	this.layerFilters = new LayerFiltersControl();
	
	this._visModeController = (function()
	{
		var publicInterface = {
			SIMPLE_MODE: 1,
			ADVANCED_MODE: 2,
			getMode: function() 
			{ 
				return curMode; 
			},
			setMode: function(mode) { 
				curMode = mode;
				$(this).trigger('change');
			},
			toggleMode: function() 
			{
				this.setMode(curMode === this.SIMPLE_MODE ? this.ADVANCED_MODE : this.SIMPLE_MODE );
			}
		}
		
		var curMode = publicInterface.SIMPLE_MODE;
		
		return publicInterface;
	})();
	
	//требуется jQuery 1.5+
	this._initDeferred = $.Deferred ? new $.Deferred() : null;
}

//вызывает callback когда календарик проинициализирован
MapCalendar.prototype.whenInited = function( callback )
{
	if (this._initDeferred)
		this._initDeferred.done( callback );
}

MapCalendar.prototype.saveState = function()
{
	var res = { calendar: this.calendar.saveState() };
	
	if (this.params.fires) res.fires = this.fires.saveState();
	if (this.params.cover) res.cover = this.cover.saveState();
	
	res.vismode = this._visModeController.getMode();
	
	return res;
}

MapCalendar.prototype.loadState = function( data )
{
	this.calendar.loadState( data.calendar );
	
	if ( data.fires )
	{
		this.fires.loadState( data.fires );
	}
	
	if (data.vismode)
		this._visModeController.setMode(data.vismode);
	else
		this._visModeController.setMode(this._visModeController.ADVANCED_MODE); //для старых пермалинков должен быть включён развёрнутый режим, примерно как и было раньше.	
	
	if ( data.cover )
		this.cover.loadState( data.cover );
		
	if ( data.cover || data.fires )
		this.setDates();
		
	if (this.layerFilters)
		this.layerFilters.update();
}

MapCalendar.prototype.init = function(parent, params)
{
	this.params = $.extend({minimized: true}, params);
	
	var name = 'MapCalendar',
		_this = this;
	
	this.calendar.init( params );
	
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
	globalOptions.resourceHost = this.params.resourceHost || "";	
	
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
		tdYear = this.params.showYear ? _td([this.calendar.lazyDate, _br(), this.calendar.yearBox, _span([_t(_gtxt("calendarWidget.EveryYear"))],[['css','margin','0px 5px']])],[['attr','colSpan',2]]) : _td([this.calendar.lazyDate, this.calendar.yearBox],[['attr','colSpan',2]]);
		
	
	var moreIcon = _img(null, [['attr', 'src', 'http://kosmosnimki.ru/img/expand.gif'], ['css', 'margin', '0 0 4px 0'], ['css', 'cursor', 'pointer'], ['attr', 'title', _gtxt('firesWidget.ExtendedView')]]);
	var canvas;
		
	moreIcon.onclick = function()
	{
		_this._visModeController.toggleMode();
	}
	
	$(this._visModeController).bind('change', function()
	{
		var isSimple = _this._visModeController.getMode() === _this._visModeController.SIMPLE_MODE;
		$("#calendar .onlyMinVersion", canvas).css({display: isSimple ? '': 'none'});
		$("#calendar .onlyMaxVersion", canvas).css({display: isSimple ? 'none': ''});
		
		_this.calendar.setLazyDate(isSimple ? 'day' : '', true);
		
		moreIcon.src = 'http://kosmosnimki.ru/img/' + (isSimple ? 'expand.gif' : 'collapse.gif');
		
		if ( isSimple )
			_this.setDates();
	});

	canvas = _div([_span([emptyieinput,
						_table([_tbody([_tr([_td([first]),_td([this.calendar.dateBegin]),_td([this.calendar.dateEnd], [['dir', 'className', 'onlyMaxVersion']]),_td([last]) , _td([moreIcon])])/*,
										_tr([_td(null, [['attr','colSpan',4],['css','height','5px']])], [['dir', 'className', 'onlyMaxVersion']])*/ /*,
										_tr([_td(), _td([_span([_t(_gtxt("calendarWidget.Period"))],[['css','margin','4px']])]), tdYear], [['dir', 'className', 'onlyMaxVersion']])*/
										])])], [['attr', 'id', 'calendar']])
						],
					[['attr','id',name],['css','margin','10px 0px']]);
					
	$("#calendar .onlyMinVersion", canvas).css({display: this.params.minimized ? '' : 'none'});
	$("#calendar .onlyMaxVersion", canvas).css({display: this.params.minimized ? 'none' : ''});
	
	if (this.params.fires) {
		this.fires.add(canvas, this.params.fires, globalOptions, _this._visModeController, this.calendar);
	}
	
	if (this.params.cover) {
		this.cover.init(this.params.cover.layers, this.params.cover.dateAttribute, this.params.cover.cloudsAttribute, this.params.cover.icons, this.params.cover.cloud)
		this.cover.add(canvas);
	}
	
	if (this.params.layerFilters)
	{
		this.layerFilters.init(globalFlashMap, this.calendar, this.params.layerFilters);
	}
	
	_(parent, [_div([canvas],[['css','margin','0px 0px 10px 10px']])]);

	emptyieinput.blur();
	
	this.setDates();
	
	$(this.calendar).bind('change', function()
	{
		_this.setDates();
	})
	
	if (this._initDeferred)
		this._initDeferred.resolve();
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
		
		//if (this._visModeController.getMode() == this._visModeController.SIMPLE_MODE)
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

MapCalendar.prototype.getCalendar = function()
{
	return this.calendar;
}
MapCalendar.prototype.getModeController = function()
{
	return this._visModeController;
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
	gmxCore.addModule('cover', publicInterface, 
	{ init: function(module, path)
		{
			var doLoadCss = function()
			{
				path = path || window.gmxJSHost || "";
				$.getCSS(path + "fires.css");
			}
			
			if ('getCSS' in $) 
				doLoadCss();
			else
				$.getScript(path + "jquery/jquery.getCSS.js", doLoadCss);
		}
	});

//временно помещаем интерфейс в global namespace вне зависимости от наличия менеджера модулей
$.extend(this, publicInterface);

})(jQuery);