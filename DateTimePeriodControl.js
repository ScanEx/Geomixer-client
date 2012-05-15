var nsGmx = nsGmx || {};

(function($){

var initTranslations = function()
{
    _translationsHash.addtext("rus", {
                                "calendarWidget.Custom" : " ",
                                "calendarWidget.Day" : "День",
                                "calendarWidget.Week" : "Неделя",
                                "calendarWidget.Month" : "Месяц",
                                "calendarWidget.Year" : "Год",
                                "calendarWidget.EveryYear" : "Ежегодно",
                                "calendarWidget.ExtendedView" : "Расширенный поиск",
                                "calendarWidget.Period" : "Задать период",
                                "calendarWidget.UTC": "Всемирное координированное время"
                             });
                             
    _translationsHash.addtext("eng", {
                                "calendarWidget.Custom" : " ",
                                "calendarWidget.Day" : "Day",
                                "calendarWidget.Week" : "Week",
                                "calendarWidget.Month" : "Month",
                                "calendarWidget.Year" : "Year",
                                "calendarWidget.EveryYear" : "Every year",
                                "calendarWidget.ExtendedView" : "Extended search",
                                "calendarWidget.UTC": "Coordinated Universal Time"
                             });
}

/**
 @memberOf cover
 @class Контрол для задания диапазона дат. Сontrols: два календарика, выбор периода, галочка с выбором года
*/
var Calendar = function()
{
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
				$(this).triggerHandler('change');
			},
			toggleMode: function() 
			{
				this.setMode(curMode === this.SIMPLE_MODE ? this.ADVANCED_MODE : this.SIMPLE_MODE );
			}
		}
		
		var curMode = publicInterface.SIMPLE_MODE;
		
		return publicInterface;
	})();
	
	/** Если изменилась хотя бы одна из дат
	  @name cover.Calendar.change
	  @event
	 */
	 
	this.dateBegin = null;
	this.dateEnd = null;
	
	this.lazyDate = null;
	
	this.lazyDateInited = false;
	
	this.yearBox = null;
	
	this._timeBegin = { hours: 0, minutes: 0, seconds: 0 };
	this._timeEnd   = { hours: 0, minutes: 0, seconds: 0 };
	
	var _this = this;
	
	var _updateInfo = function()
	{
        if (!_this._params.showTime) return;
        
		function f(n) {
			// Format integers to have at least two digits.
			return n < 10 ? '0' + n : n;
		}
		function getStr ( time ) { return f(time.hours) + ":" + f(time.minutes) /*+ ":" + f(time.seconds)*/ };
		
		$('#dateBeginInfo', _this.canvas).text( getStr( _this._timeBegin ) + " (UTC)" ).attr('title', _gtxt('calendarWidget.UTC'));
		$('#dateEndInfo'  , _this.canvas).text( getStr( _this._timeEnd ) + " (UTC)").attr('title', _gtxt('calendarWidget.UTC'));
	}
	
	//public interface
	
	/**
	 * @function
	 */
	this.getDateBegin = function()
	{
		var date = $(this.dateBegin).datepicker("getDate");
        
        if (date)
        {
            date.setHours(_this._timeBegin.hours);
            date.setMinutes(_this._timeBegin.minutes);
            date.setSeconds(_this._timeBegin.seconds);
        }
		return date;
	}
    	
	/**
	 * @function
	 */	
	this.getDateEnd = function() 
	{
		// return $(this.dateEnd).datepicker("getDate"); 
		var date = $(this.dateEnd).datepicker("getDate");
        if (date)
        {
            date.setHours(_this._timeEnd.hours);
            date.setMinutes(_this._timeEnd.minutes);
            date.setSeconds(_this._timeEnd.seconds);
        }
		return date;
	}
    
	/**
	 * @function
	 */	    
    this.setDateBegin = function(date)
    {
        if (date)
        {
            _this._timeBegin.hours = date.getUTCHours();
            _this._timeBegin.minutes = date.getMinutes();
            _this._timeBegin.seconds = date.getSeconds();
        }
        $(this.dateBegin).datepicker("setDate", date);
        _updateInfo();
        $(this).change();
    }
    
	/**
	 * @function
	 */	    
    this.setDateEnd = function(date)
    {
        if (date)
        {
            _this._timeEnd.hours = date.getUTCHours();
            _this._timeEnd.minutes = date.getMinutes();
            _this._timeEnd.seconds = date.getSeconds();
            $(this.dateEnd).datepicker("setDate", date);
        }
        _updateInfo();
        $(this).change();
    }
	
	/**
	 * @function
	 */	
	this.getDateMax = function() { return this.dateMax; }
	
	/**
	 * @function
	 */
	this.getDateMin = function() { return this.dateMin; }
    
    this.setDateMin = function(dateMin)
    {
        this.dateMin = dateMin;
        $([this.dateBegin, this.dateEnd]).datepicker('option', 'minDate', 
            new Date(this.dateMin.valueOf() + this.dateMin.getTimezoneOffset()*60*1000)
        )
    }
    
    this.setDateMax = function(dateMax)
    {
        this.dateMax = dateMax;
        this.dateMax.setHours(23);
        this.dateMax.setMinutes(59);
        this.dateMax.setSeconds(59);
        $([this.dateBegin, this.dateEnd]).datepicker('option', 'maxDate', 
            new Date(this.dateMax.valueOf() + this.dateMin.getTimezoneOffset()*60*1000)
        )
    }
    
    /**
    */
    this.setShowTime = function(isShowTime)
    {
        this._params.showTime = isShowTime;
        _updateInfo();
    }
	
	/**
	 * @function
	 */	
	this.saveState = function()
	{
		return {
			dateBegin: this.getDateBegin().valueOf(),
			dateEnd: this.getDateEnd().valueOf(),
			lazyDate: this.lazyDate.value,
			year: this.yearBox.checked,
			vismode: this._visModeController.getMode()
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
		this._visModeController.setMode(data.vismode);
	}
	
	/**
	 * @function
	 */
	this.setTimeBegin = function( hours, minutes, seconds )
	{
		this._timeBegin = {
			hours: hours,
			minutes: minutes,
			seconds: seconds
		}
		
		_updateInfo();
	}
	
	/**
	 * @function
	 */
	this.setTimeEnd = function( hours, minutes, seconds )
	{
		this._timeEnd = {
			hours: hours,
			minutes: minutes,
			seconds: seconds
		}
		
		_updateInfo();
	}
	
	
	
	this.setLazyDate = function(lazyDate, keepSilence)
	{
		this.lazyDate.value = lazyDate;
		this.updateBegin();
		
		if (!keepSilence) 
			$(this).triggerHandler('change');
	}
	
	this.getModeController = function()
	{
		return this._visModeController;
	}
}

/**
 * Инициализирует календарь.
 * @function
 * @param {String} name Имя календаря
 * @param {Object} params Параметры календаря: <br/>
 * dateMin, dateMax - {Date} граничные даты для календарей <br/>
 * dateFormat - {String} формат даты <br/>
 * resourceHost - {String} откуда берём иконки <br/>
 * minimized - {bool} показывать ли минимизированный или развёрнутый виджет в начале<br/>
 * showSwitcher - {bool} показывать ли иконку для разворачивания/сворачивания периода<br/>
 * dateBegin, dateEnd - {Date} текущие даты для календарей <br/>
 * showTime - {bool} показывать ли время (default: true)
 */
Calendar.prototype.init = function( name, params )
{
	var _this = this;
	this._name = name;
    
    //Если загружен как модуль, берём ресурсы из папки модуля, иначе локально относительно html
    var resourceHost = typeof gmxCore !== 'undefined' ? gmxCore.getModulePath('DateTimePeriodControl') || '' : '';
	
	this._params = $.extend({
		resourceHost: resourceHost,
		minimized: true,
		showSwitcher: true,
        showTime: true,
        dateMax: new Date(),
        dateMin: new Date(1900, 1, 1)
	}, params)
	
	this.lazyDate = nsGmx.Utils._select([_option([_t(_gtxt("calendarWidget.Custom"))],[['attr','value','']]),
								_option([_t(_gtxt("calendarWidget.Day"))],[['attr','value','day']]),
								_option([_t(_gtxt("calendarWidget.Week"))],[['attr','value','week']]),
								_option([_t(_gtxt("calendarWidget.Month"))],[['attr','value','month']]),
								_option([_t(_gtxt("calendarWidget.Year"))],[['attr','value','year']])
							   ],[['css','width','70px'],['dir','className','selectStyle'],['css','marginBottom','4px']]);
	
	// значение по умолчанию
	this.lazyDate.value = this._params.minimized ? 'day' : '';
	
	this.lazyDate.onchange = function() {
		_this.updateBegin();
		$(_this).triggerHandler('change');
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
	
	this.dateMin = this._params.dateMin;
	this.dateMax = this._params.dateMax;
	this.dateMax.setHours(23);
	this.dateMax.setMinutes(59);
	this.dateMax.setSeconds(59);
	
	$([this.dateBegin, this.dateEnd]).datepicker(
	{
		onSelect: function(dateText, inst) 
		{
			_this.selectFunc(inst);
			$(_this).triggerHandler('change');
		},
		showAnim: 'fadeIn',
		changeMonth: true,
		changeYear: true,
		minDate: new Date(this.dateMin.valueOf() + this.dateMin.getTimezoneOffset()*60*1000),
		maxDate: new Date(this.dateMax.valueOf() + this.dateMin.getTimezoneOffset()*60*1000),
		dateFormat: this._params.dateFormat,
		defaultDate: new Date(this.dateMax.valueOf() + this.dateMin.getTimezoneOffset()*60*1000)
	});
	
	if (!this._params.showYear) {
		this.yearBox.style.display = "none";
	}
	
	if (this._params.periodDefault) {
		this.lazyDate.value = this._params.periodDefault;
	}
	
	if (this._params.periods) {
		var allPeriods = ['','day','week','month','year'];
		for (var i = 0; i < allPeriods.length; ++i) {
			if (!valueInArray(this._params.periods, allPeriods[i]))
				$(this.lazyDate).children("option[value='" + allPeriods[i] + "']").remove();
		}
	}
	
	this.first = makeImageButton(this._params.resourceHost + 'img/first.png', this._params.resourceHost + 'img/first_a.png');
	this.last = makeImageButton(this._params.resourceHost + 'img/last.png', this._params.resourceHost + 'img/last_a.png');
	
	this.first.style.marginBottom = '-2px';
	this.last.style.marginBottom = '-2px';

	this.first.onclick = function()
	{
		_this.firstClickFunc();
	}
	
	this.last.onclick = function()
	{
		_this.lastClickFunc();
	}
	
	this.moreIcon = _img(null, [['attr', 'src', 'http://kosmosnimki.ru/img/' + (this._params.minimized ? 'expand.gif' : 'collapse.gif')], ['css', 'margin', '0 0 4px 0'], ['css', 'cursor', 'pointer'], ['attr', 'title', _gtxt('calendarWidget.ExtendedView')]]);
	this._visModeController.setMode(this._params.minimized ? _this._visModeController.SIMPLE_MODE : _this._visModeController.ADVANCED_MODE)
		
	this.moreIcon.onclick = function()
	{
		_this._visModeController.toggleMode();
	}
	
	if (!this._params.showSwitcher)
	{
		$(this.moreIcon).hide();
	}
	
	var emptyieinput = _input(null,[['css','width','1px'],['css','border','none'],['css','height','1px']]);
		//tdYear = this.params.showYear ? _td([this.calendar.lazyDate, _br(), this.calendar.yearBox, _span([_t(_gtxt("calendarWidget.EveryYear"))],[['css','margin','0px 5px']])],[['attr','colSpan',2]]) : _td([this.calendar.lazyDate, this.calendar.yearBox],[['attr','colSpan',2]]);
	
	this.canvas = _div([_span([emptyieinput,
					_table([_tbody([_tr([_td([this.first]),_td([this.dateBegin]),_td([this.dateEnd], [['dir', 'className', 'onlyMaxVersion']]),_td([this.last]) , _td([this.moreIcon])]),
									_tr([_td(), _td(null, [['attr', 'id', 'dateBeginInfo']]),_td(null, [['attr', 'id', 'dateEndInfo'], ['dir', 'className', 'onlyMaxVersion']]),_td()])/*,
									_tr([_td(null, [['attr','colSpan',4],['css','height','5px']])], [['dir', 'className', 'onlyMaxVersion']])*/ /*,
									_tr([_td(), _td([_span([_t(_gtxt("calendarWidget.Period"))],[['css','margin','4px']])]), tdYear], [['dir', 'className', 'onlyMaxVersion']])*/
									])])], [['attr', 'id', 'calendar']])
					],
				[['attr','id',this._name], ['dir','className','PeriodCalendar']]);
				
	emptyieinput.blur();
	
	$(this._visModeController).change(function()
	{
		var isSimple = _this._visModeController.getMode() === _this._visModeController.SIMPLE_MODE;
		$("#calendar .onlyMinVersion", _this.canvas).css({display: isSimple ? '': 'none'});
		$("#calendar .onlyMaxVersion", _this.canvas).css({display: isSimple ? 'none': ''});
		
		_this.setLazyDate(isSimple ? 'day' : '', true);
		
		_this.moreIcon.src = 'http://kosmosnimki.ru/img/' + (isSimple ? 'expand.gif' : 'collapse.gif');
		
		// if ( isSimple )
			// _this.setDates();
	});
					
	$("#calendar .onlyMinVersion", this.canvas).css({display: this._params.minimized ? '' : 'none'});
	$("#calendar .onlyMaxVersion", this.canvas).css({display: this._params.minimized ? 'none' : ''});
	
	var curUTCDate = new Date((new Date()).valueOf() + (new Date()).getTimezoneOffset()*60*1000);
	
	if (typeof this._params.dateEnd === 'undefined')
		$(this.dateEnd).datepicker("setDate", curUTCDate);
	else
		$(this.dateEnd).datepicker("setDate", this._params.dateEnd);
	
	if (typeof this._params.dateBegin === 'undefined')
		//если не выбран период, то по умолчанию мы устанавливаем одинаковые даты
		$(this.dateBegin).datepicker("setDate", this.lazyDate.value === '' ? curUTCDate : this.getBeginByEnd() );
	else
		$(this.dateBegin).datepicker("setDate", this._params.dateBegin );
}

Calendar.prototype.fixDate = function(date)
{
	if (date) 
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
    
    if (!end) return null;
    
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
    
    if (!begin) return null;
    
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
        
    if (!begin || !end) return;
	
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
	
	$(this).triggerHandler('change');
}

Calendar.prototype.lastClickFunc = function()
{
	var begin = $(this.dateBegin).datepicker("getDate"),
		end = $(this.dateEnd).datepicker("getDate"),
		newDateBegin,
		newDateEnd;
        
    if (!begin || !end) return;

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
	
	$(this).triggerHandler('change');
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
        var begin = $(this.dateBegin).datepicker("getDate");
        var end   = $(this.dateEnd).datepicker("getDate");
        
		if ( end && begin > end )
		{
			var dateToFix = inst.input[0] == this.dateEnd ? this.dateBegin : this.dateEnd;
			$(dateToFix).datepicker( "setDate", $(inst.input[0]).datepicker("getDate") );
		}
	}
};

var publicInterface = {
	Calendar: Calendar
}

if ( typeof gmxCore !== 'undefined' )
{
	gmxCore.addModule('DateTimePeriodControl', publicInterface, 
	{ 
        init: function(module, path)
		{
            initTranslations();
			var doLoadCss = function()
			{
				path = path || window.gmxJSHost || "";
				jQuery.getCSS(path + "DateTimePeriodControl.css");
			}
			
			if ('getCSS' in $)
				doLoadCss();
			else
				jQuery.getScript(path + "jquery/jquery.getCSS.js", doLoadCss);
		},
        require: ['translations', 'utilities']
	});
}
else
{
    initTranslations();
}

nsGmx.Calendar = Calendar;

})(jQuery);