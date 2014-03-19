var nsGmx = nsGmx || {};

(function($){

var initTranslations = function()
{
    _translationsHash.addtext("rus", { calendarWidget: {
                                Custom:       " ",
                                Day:          "День",
                                Week:         "Неделя",
                                Month:        "Месяц",
                                Year:         "Год",
                                EveryYear:    "Ежегодно",
                                ExtendedView: "Расширенный поиск",
                                Period:       "Задать период",
                                UTC:          "Всемирное координированное время"
                             }});
                             
    _translationsHash.addtext("eng", { calendarWidget: {
                                Custom :       " ",
                                Day :          "Day",
                                Week :         "Week",
                                Month :        "Month",
                                Year :         "Year",
                                EveryYear :    "Every year",
                                ExtendedView : "Extended search",
                                UTC:           "Coordinated Universal Time"
                             }});
}

/** Параметры календаря
 * @typedef nsGmx.Calendar~Parameters
 * @property {Date} [dateMin] минимальная граничная дата для календарей, null - без ограничений
 * @property {Date} [dateMax] максимальная граничная дата для календарей, null - без ограничений
 * @property {String} [dateFormat='dd.mm.yy'] формат даты
 * @property {bool} [minimized=true] показывать ли минимизированный или развёрнутый виджет в начале
 * @property {bool} [showSwitcher=true] показывать ли иконку для разворачивания/сворачивания периода
 * @property {Date} [dateBegin=<текущая дата>] начальная дата интервала
 * @property {Date} [dateEnd=<текущая дата>] конечная дата интервала
 * @property {bool} [showTime=false] показывать ли время
 * @property {String} [container] куда добавлять календарик
 */

/** Контрол для задания диапазона дат. Даты календарика всегда в UTC, а не в текущем поясе.
 @alias nsGmx.Calendar
 @class
 @param {String} name Имя календаря
 @param {nsGmx.Calendar~Parameters} params Параметры календаря
*/
var Calendar = function(name, params)
{
    /** Сформированный DOM node с виджетом. Нужно использовать, если не указан параметр `container` в {@link nsGmx.Calendar~Parameters}
     * @memberOf nsGmx.Calendar.prototype
     * @member {DOMNode} canvas
    */
	this.canvas = null;
    
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
	  @name nsGmx.Calendar.change
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
	
	/** Получить начальную дату
	 * @return {Date} начальная дата
	 */
	this.getDateBegin = function()
	{
		var date = Calendar.fromUTC($(this.dateBegin).datepicker("getDate"));
        
        if (date)
        {
            date.setUTCHours(_this._timeBegin.hours);
            date.setUTCMinutes(_this._timeBegin.minutes);
            date.setUTCSeconds(_this._timeBegin.seconds);
        }
		return date;
	}
    	
	/** Получить конечную дату дату
	 * @return {Date} конечная дата
	 */
	this.getDateEnd = function() 
	{
		// return $(this.dateEnd).datepicker("getDate"); 
		var date = Calendar.fromUTC($(this.dateEnd).datepicker("getDate"));
        if (date)
        {
            date.setUTCHours(_this._timeEnd.hours);
            date.setUTCMinutes(_this._timeEnd.minutes);
            date.setUTCSeconds(_this._timeEnd.seconds);
        }
		return date;
	}
    
	/** Установить начальную дату периода
	 * @param {Date} date Начальная дата
	 */
    this.setDateBegin = function(date, keepSilence)
    {
        if (date)
        {
            _this._timeBegin.hours = date.getUTCHours();
            _this._timeBegin.minutes = date.getUTCMinutes();
            _this._timeBegin.seconds = date.getUTCSeconds();
        }
        $(this.dateBegin).datepicker("setDate", Calendar.toUTC(date));
        _updateInfo();
        keepSilence || $(this).change();
    }
    
	/** Установить конечную дату периода
	 * @param {Date} date Конечная дата
	 */
    this.setDateEnd = function(date, keepSilence)
    {
        if (date)
        {
            _this._timeEnd.hours = date.getUTCHours();
            _this._timeEnd.minutes = date.getUTCMinutes();
            _this._timeEnd.seconds = date.getUTCSeconds();
        }
        
        $(this.dateEnd).datepicker("setDate", Calendar.toUTC(date));
        _updateInfo();
        keepSilence || $(this).change();
    }
    
    /** Установить даты периода
	 * @param {Date} dateBegin Начальная дата
	 * @param {Date} dateEnd Конечная дата
	 */
    this.setDates = function(dateBegin, dateEnd) {
        this.setDateBegin(dateBegin, true);
        this.setDateBegin(dateEnd);
    }
	
	/** Получить верхнюю границу возможных дат периода
     * @return {Date} верхняя граница возможных периодов
	 */
	this.getDateMax = function() { return this.dateMax; }
	
	/** Получить нижнуюю границу возможных дат периода
     * @return {Date} нижняя граница возможных периодов
	 */
	this.getDateMin = function() { return this.dateMin; }
    
	/** Установить нижнуюю границу возможных дат периода
     * @param {Date} dateMin нижняя граница возможных периодов
	 */
    this.setDateMin = function(dateMin)
    {
        this.dateMin = dateMin;
        $([this.dateBegin, this.dateEnd]).datepicker('option', 'minDate', dateMin ? Calendar.toUTC(dateMin) : null);
    }
    
    /** Установить верхнюю границу возможных дат периода
     * @param {Date} dateMax верхняя граница возможных периодов
	 */
    this.setDateMax = function(dateMax)
    {
        this.dateMax = dateMax;
        if (dateMax) {
            var utcDate = Calendar.toUTC(dateMax);
            utcDate.setHours(23);
            utcDate.setMinutes(59);
            utcDate.setSeconds(59);
            $([this.dateBegin, this.dateEnd]).datepicker('option', 'maxDate', utcDate);
        } else {
            $([this.dateBegin, this.dateEnd]).datepicker('option', 'maxDate', null);
        }
    }
    
    /** Нужно ли показывать время под календариком
     * @param {Boolean} isShowTime Показывать ли время
     */
    this.setShowTime = function(isShowTime)
    {
        this._params.showTime = isShowTime;
        _updateInfo();
    }
	
	/** Сериализация состояния виджета
	 * @return {Object} Сериализованное состояние
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
	
	/** Восстановить состояние виджета по сериализованным данным
	 * @param {Object} data Сериализованное состояние календарика
	 */
	this.loadState = function( data )
	{
		$(this.dateBegin).datepicker("setDate", Calendar.toUTC(new Date(data.dateBegin)));
		$(this.dateEnd).datepicker("setDate", Calendar.toUTC(new Date(data.dateEnd)));
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
        var prevDate = this.getDateBegin();
		this._updateBegin();
        var newDate = this.getDateBegin();
		
		if ( !keepSilence && prevDate.valueOf() !== newDate.valueOf() )
			$(this).triggerHandler('change');
	}
	
	this.getModeController = function() {
		return this._visModeController;
	}
    
    this.setSwitcherVisibility = function(isVisible) {
        this.moreIcon && $(this.moreIcon).toggle(isVisible);
    }
    
    if (typeof name !== 'undefined')
        this.init(name, params);
}

Calendar.fromUTC = function(date)
{
    if (!date) return null;
    var timeOffset = date.getTimezoneOffset()*60*1000;
    return new Date(date.valueOf() - timeOffset);
}

Calendar.toUTC = function(date)
{
    if (!date) return null;
    var timeOffset = date.getTimezoneOffset()*60*1000;
    return new Date(date.valueOf() + timeOffset);
}

/**
 * Инициализирует календарь.
 * @function
 * @param {String} name Имя календаря
 * @param {nsGmx.Calendar~Parameters} params Параметры календаря
 */
Calendar.prototype.init = function( name, params )
{
	var _this = this;
	this._name = name;

	this._params = $.extend({
		minimized: true,
		showSwitcher: true,
        showTime: false,
        dateMax: null,
        dateMin: null,
        dateFormat: 'dd.mm.yy'
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
		_this._updateBegin();
		$(_this).triggerHandler('change');
	}
	
	this.yearBox = _checkbox(false, 'checkbox');

	this.yearBox.className = 'box';
    this.yearBox.style.marginLeft = '3px'
	
	_title(this.yearBox, _gtxt("calendarWidget.EveryYear"));
	
	this.dateBegin = _input(null,[['dir','className','inputStyle'],['css','width','70px']]);
	this.dateEnd = _input(null,[['dir','className','inputStyle'],['css','width','70px']]);
	
	this.dateMin = this._params.dateMin;
	this.dateMax = this._params.dateMax;
    
    if (this.dateMax) {
        this.dateMax.setHours(23);
        this.dateMax.setMinutes(59);
        this.dateMax.setSeconds(59);
    };
	
	$([this.dateBegin, this.dateEnd]).datepicker(
	{
		onSelect: function(dateText, inst) 
		{
			_this._selectFunc(inst);
			$(_this).triggerHandler('change');
		},
		showAnim: 'fadeIn',
		changeMonth: true,
		changeYear: true,
		minDate: this.dateMin ? Calendar.toUTC(this.dateMin) : null,
		maxDate: this.dateMax ? Calendar.toUTC(this.dateMax) : null,
		dateFormat: this._params.dateFormat,
		defaultDate: Calendar.toUTC(this.dateMax || new Date())
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
    
    this.first = $('<div class = "PeriodCalendar-iconFirst"></div>').click(this._firstClickFunc.bind(this))[0];
    this.last = $('<div class = "PeriodCalendar-iconLast"></div>').click(this._firstClickFunc.bind(this))[0];

    this.moreIcon = $(Mustache.render(
        '<div class="PeriodCalendar-iconMore {{iconClass}}" title="{{i calendarWidget.ExtendedView}}"></div>', 
        {
            iconClass: this._params.minimized ? 'PeriodCalendar-iconExpand' : 'PeriodCalendar-iconCollapse'
        }
    )).click(_this._visModeController.toggleMode.bind(_this._visModeController)).toggle(!!this._params.showSwitcher)[0];

    this._visModeController.setMode(this._params.minimized ? _this._visModeController.SIMPLE_MODE : _this._visModeController.ADVANCED_MODE);

	this.canvas = _div([_span([//emptyieinput,
					_table([_tbody([_tr([_td([this.first]),_td([this.dateBegin]),_td([this.dateEnd], [['dir', 'className', 'onlyMaxVersion']]),_td([this.last]) , _td([this.moreIcon])]),
									_tr([_td(), _td(null, [['attr', 'id', 'dateBeginInfo']]),_td(null, [['attr', 'id', 'dateEndInfo'], ['dir', 'className', 'onlyMaxVersion']]),_td()])/*,
									_tr([_td(null, [['attr','colSpan',4],['css','height','5px']])], [['dir', 'className', 'onlyMaxVersion']])*/ /*,
									_tr([_td(), _td([_span([_t(_gtxt("calendarWidget.Period"))],[['css','margin','4px']])]), tdYear], [['dir', 'className', 'onlyMaxVersion']])*/
									])])], [['attr', 'id', 'calendar']])
					],
				[['attr','id',this._name], ['dir','className','PeriodCalendar']]);
				
	//emptyieinput.blur();
	
	$(this._visModeController).change(function()
	{
		var isSimple = _this._visModeController.getMode() === _this._visModeController.SIMPLE_MODE;
		$("#calendar .onlyMinVersion", _this.canvas).toggle(isSimple);
		$("#calendar .onlyMaxVersion", _this.canvas).toggle(!isSimple);
		
		_this.setLazyDate(isSimple ? 'day' : '', true);
        $(_this).triggerHandler('change'); //всегда генерим событие, так как в целом состояние календаря изменилось
		
        $(_this.moreIcon)
            .toggleClass('PeriodCalendar-iconExpand', isSimple)
            .toggleClass('PeriodCalendar-iconCollapse', !isSimple);
	});
					
	$("#calendar .onlyMinVersion", this.canvas).toggle(this._params.minimized);
	$("#calendar .onlyMaxVersion", this.canvas).toggle(!this._params.minimized);
	
	var curUTCDate = new Date((new Date()).valueOf() + (new Date()).getTimezoneOffset()*60*1000);
	
	if (typeof this._params.dateEnd === 'undefined')
		$(this.dateEnd).datepicker("setDate", curUTCDate);
	else
		$(this.dateEnd).datepicker("setDate", this._params.dateEnd);
	
	if (typeof this._params.dateBegin === 'undefined')
		//если не выбран период, то по умолчанию мы устанавливаем одинаковые даты
		$(this.dateBegin).datepicker("setDate", this.lazyDate.value === '' ? curUTCDate : this._getBeginByEnd() );
	else
		$(this.dateBegin).datepicker("setDate", this._params.dateBegin );
        
    if (this._params.container)
    {
        if (typeof this._params.container === 'string')
            $('#' + this._params.container).append(this.canvas);
        else
            $(this._params.container).append(this.canvas);
    }
}

Calendar.prototype._fixDate = function(date)
{
	if (date) 
        date.setHours(12);
	
	return date;
}

Calendar.prototype._fixDay = function(day)
{
	if (day == 0)
		return 6;
	else
		return day - 1;
}

Calendar.prototype._daysAtMonth = function(month, year)
{
	var leap = ( ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0) ) ? 1 : 0,
		days = [31, 28 + leap, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	return days[month - 1];
}

Calendar.prototype._getBeginByEnd = function(endDate)
{
	var end = endDate ? endDate : $(this.dateEnd).datepicker("getDate");
    
    if (!end) return null;
    
	this._fixDate(end)
	
	switch(this.lazyDate.value)
	{
		case '':
			return $(this.dateBegin).datepicker("getDate");
		case 'day': 
			return end;
		case 'week':
			return new Date(end.valueOf() - this._fixDay(end.getDay()) * 24 * 3600 * 1000);
		case 'month': 
			return new Date(end.getFullYear(), end.getMonth(), 1, 12, 0, 0);
		case 'year':
			return new Date(end.getFullYear(), 0, 1, 12, 0, 0)
	}
}

Calendar.prototype._getEndByBegin = function(beginDate)
{
	var begin = beginDate ? beginDate : $(this.dateBegin).datepicker("getDate");
    
    if (!begin) return null;
    
	this._fixDate(begin)
	
	switch(this.lazyDate.value)
	{
		case '':
			return $(this.dateEnd).datepicker("getDate");
		case 'day': 
			return begin;
		case 'week':
			return new Date(begin.valueOf() + (6 - this._fixDay(begin.getDay())) * 24 * 3600 * 1000);
		case 'month': 
			return new Date(begin.getFullYear(), begin.getMonth(), this._daysAtMonth(begin.getMonth() + 1, begin.getFullYear()), 12, 0, 0);
		case 'year':
			return new Date(begin.getFullYear(), 11, 31, 12, 0, 0)
	}
}

Calendar.prototype._updateBegin = function()
{
	$(this.dateBegin).datepicker("setDate", this._getBeginByEnd());
}

Calendar.prototype._updateEnd = function()
{
	$(this.dateEnd).datepicker("setDate", this._getEndByBegin());
}

Calendar.prototype._firstClickFunc = function()
{
	var begin = $(this.dateBegin).datepicker("getDate"),
		end = $(this.dateEnd).datepicker("getDate"),
		newDateBegin,
		newDateEnd;
        
    if (!begin || !end) return;
	
	this._fixDate(begin);
	this._fixDate(end);
	
	if (this.yearBox.checked)
	{
		if (end.valueOf() - begin.valueOf() > 1000*60*60*24 * 365)
			return;
		
		newDateBegin = new Date(begin.getFullYear() - 1, begin.getMonth(), begin.getDate());
		newDateEnd = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());
		
		if (this.dateMin && newDateBegin < this.dateMin)
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
			
			if (this.dateMin && newDateBegin < this.dateMin)
				return;
			
			$(this.dateEnd).datepicker("setDate", newDateBegin);
			$(this.dateBegin).datepicker("setDate", newDateEnd);
		}
		else
		{
			newDateEnd = new Date(begin.valueOf() - 1000*60*60*24);
			newDateBegin = this._getBeginByEnd(newDateEnd);
			
			if (this.dateMin && newDateBegin < this.dateMin)
			{
				return;
			}
			
			$(this.dateEnd).datepicker("setDate", newDateEnd);
			
			this._updateBegin();
		}
	}
	
	$(this).triggerHandler('change');
}

Calendar.prototype._lastClickFunc = function()
{
	var begin = $(this.dateBegin).datepicker("getDate"),
		end = $(this.dateEnd).datepicker("getDate"),
		newDateBegin,
		newDateEnd;
        
    if (!begin || !end) return;

	this._fixDate(begin);
	this._fixDate(end);
	
	if (this.yearBox.checked)
	{
		if (end.valueOf() - begin.valueOf() > 1000*60*60*24 * 365)
			return;
		
		newDateBegin = new Date(begin.getFullYear() + 1, begin.getMonth(), begin.getDate());
		newDateEnd = new Date(end.getFullYear() + 1, end.getMonth(), end.getDate());
		
		if (this.dateMax && newDateEnd > this.dateMax)
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
			
			if (this.dateMax && newDateEnd > this.dateMax)
				return;
			
			$(this.dateBegin).datepicker("setDate", newDateBegin);
			$(this.dateEnd).datepicker("setDate", newDateEnd);
		}
		else
		{
			newDateBegin = new Date(end.valueOf() + 1000*60*60*24);
			newDateEnd = this._getBeginByEnd(newDateBegin);
			
			if (this.dateMax && newDateEnd > this.dateMax)
			{
				return;
			}
			
			$(this.dateBegin).datepicker("setDate", newDateBegin);
			
			this._updateEnd();
		}
	}
	
	$(this).triggerHandler('change');
}

Calendar.prototype._selectFunc = function(inst)
{
	if (this.lazyDate.value != '')
	{
		if (inst.input[0] == this.dateEnd)
			this._updateBegin();
		else
			this._updateEnd();
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
        css: 'DateTimePeriodControl.css',
        init: function(module, path)
		{
            initTranslations();
            
            return gmxCore.loadScriptWithCheck([
                {
                    check: function(){ return jQuery.ui; },
                    script: path + 'jquery/jquery-ui-1.7.2.custom.min.js',
                    css: path + 'jquery/jquery-ui-1.7.2.custom.css'
                },
                {
                    check: function(){ return window.Mustache; },
                    script: path + 'jquery/mustache.js'
                }
            ]);
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