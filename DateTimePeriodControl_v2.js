var nsGmx = nsGmx || {};

(function($){

var initTranslations = function()
{
    _translationsHash.addtext("rus", { calendarWidget: {
        ExtendedViewTitle: "Выбор периода",
        MinimalViewTitle:  "Свернуть",
        UTC:               "Всемирное координированное время"
     }});
                             
    _translationsHash.addtext("eng", { calendarWidget: {
        ExtendedViewTitle: "Period selection",
        MinimalViewTitle:  "Minimize",
        UTC:               "Coordinated Universal Time"
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
 * @property {String} [buttonImage] URL иконки для активации календариков
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
	
	this._timeBegin = { hours: 0, minutes: 0, seconds: 0 };
	this._timeEnd   = { hours: 0, minutes: 0, seconds: 0 };
	
	var _this = this;
	
	var _updateInfo = function()
	{
        if (!_this._params.showTime) {
            $('#dateBeginInfo, #dateEndInfo', _this.canvas).empty();
            return;
        }
        
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
    	
	/** Получить конечную дату
	 * @return {Date} конечная дата
	 */
	this.getDateEnd = function() 
	{
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
        this.setDateEnd(dateEnd);
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
			lazyDate: this.lazyDate,
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
		this.lazyDate = data.lazyDate;
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
		this.lazyDate = lazyDate;
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

	this.dateMin = this._params.dateMin;
	this.dateMax = this._params.dateMax;
    
    if (this.dateMax) {
        this.dateMax.setHours(23);
        this.dateMax.setMinutes(59);
        this.dateMax.setSeconds(59);
    };
    
    this.lazyDate = this._params.periodDefault || (this._params.minimized ? 'day': '');

    this._visModeController.setMode(this._params.minimized ? _this._visModeController.SIMPLE_MODE : _this._visModeController.ADVANCED_MODE);
    
    this.canvas = $(Mustache.render(
        '<div id = "{{name}}" class = "PeriodCalendar"><span id = "calendar"><table>' + 
            '<tr>' +
                '<td><div class = "PeriodCalendar-iconScroll PeriodCalendar-iconFirst"></div></td>' + 
                '<td class = "date-box"><input class = "inputStyle PeriodCalendar-dateBegin"></td>' + 
                '<td class = "date-box onlyMaxVersion"><input class = "inputStyle PeriodCalendar-dateEnd"></td>' + 
                '<td><div class = "PeriodCalendar-iconScroll PeriodCalendar-iconLast" ></div></td>' + 
                '<td><div class = "PeriodCalendar-iconMore {{moreIconClass}}" title = "{{moreIconTitle}}"></div></td>' +
            '</tr><tr>' +
                '<td></td>' + 
                '<td id = "dateBeginInfo"></td>' + 
                '<td id = "dateEndInfo" class = "onlyMaxVersion"></td>' + 
                '<td></td>' + 
                '<td></td>' + 
            '</tr>' +
        '</table></span></div>',
        {
            moreIconClass: this._params.minimized ? 'PeriodCalendar-iconExpand' : 'PeriodCalendar-iconCollapse',
            moreIconTitle: this._params.minimized ? _gtxt('calendarWidget.ExtendedViewTitle') : _gtxt('calendarWidget.MinimalViewTitle'),
            name: this._name
        }
    ));
    
    this.moreIcon = this.canvas.find('.PeriodCalendar-iconMore')
                    .click(_this._visModeController.toggleMode.bind(_this._visModeController)).toggle(!!this._params.showSwitcher)[0];
                    
    this.first = this.canvas.find('.PeriodCalendar-iconFirst').click(this._firstClickFunc.bind(this))[0];
    this.last = this.canvas.find('.PeriodCalendar-iconLast').click(this._lastClickFunc.bind(this))[0];
    
    this.dateBegin = this.canvas.find('.PeriodCalendar-dateBegin')[0];
    this.dateEnd = this.canvas.find('.PeriodCalendar-dateEnd')[0];
    
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
		defaultDate: Calendar.toUTC(this.dateMax || new Date()),
        showOn: this._params.buttonImage ? 'both' : 'focus',
        buttonImageOnly: true
	});

    //устанавливаем опцию после того, как добавили календарик в canvas
    if (this._params.buttonImage) {
        $([this.dateBegin, this.dateEnd]).datepicker('option', 'buttonImage', this._params.buttonImage);
    }

	$(this._visModeController).change(function()
	{
		var isSimple = _this._visModeController.getMode() === _this._visModeController.SIMPLE_MODE;
		$("#calendar .onlyMaxVersion", _this.canvas).toggle(!isSimple);
		
		_this.setLazyDate(isSimple ? 'day' : '', true);
        $(_this).triggerHandler('change'); //всегда генерим событие, так как в целом состояние календаря изменилось
		
        $(_this.moreIcon)
            .toggleClass('PeriodCalendar-iconExpand', isSimple)
            .toggleClass('PeriodCalendar-iconCollapse', !isSimple);
        $(_this.moreIcon).attr('title', isSimple ? _gtxt('calendarWidget.ExtendedViewTitle') : _gtxt('calendarWidget.MinimalViewTitle'));
	});

	$("#calendar .onlyMaxVersion", this.canvas).toggle(!this._params.minimized);

	var curUTCDate = new Date((new Date()).valueOf() + (new Date()).getTimezoneOffset()*60*1000);

	if (typeof this._params.dateEnd === 'undefined')
		$(this.dateEnd).datepicker("setDate", curUTCDate);
	else
		$(this.dateEnd).datepicker("setDate", this._params.dateEnd);

	if (typeof this._params.dateBegin === 'undefined')
		//если не выбран период, то по умолчанию мы устанавливаем одинаковые даты
		$(this.dateBegin).datepicker("setDate", this.lazyDate === '' ? curUTCDate : this._getBeginByEnd() );
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
	
	switch(this.lazyDate)
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
	
	switch(this.lazyDate)
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

    if (this.lazyDate == '')
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

    if (this.lazyDate == '')
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

	$(this).triggerHandler('change');
}

Calendar.prototype._selectFunc = function(inst)
{
	if (this.lazyDate != '')
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
	gmxCore.addModule('DateTimePeriodControl_v2', publicInterface, 
	{
        css: 'DateTimePeriodControl_v2.css',
        init: function(module, path)
		{
            initTranslations();
            
            return gmxCore.loadScriptWithCheck([
                {
                    check: function(){ return jQuery.ui; },
                    script: path + 'jquery/jquery-ui-1.10.4.min.js',
                    css: [path + 'css/jquery-ui-1.10.4.css', path + 'css/jquery-ui-1.10.4-gmx.css']
                },
                {
                    check: function(){ return window.Mustache; },
                    script: path + 'jquery/mustache.js'
                }
            ]);
		},
        require: ['translations']
	});
}
else
{
    initTranslations();
}

nsGmx.Calendar = Calendar;

})(jQuery);