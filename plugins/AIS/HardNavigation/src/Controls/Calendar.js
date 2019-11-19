const SIMPLE_MODE = 1,
      ADVANCED_MODE = 2;
const _toMidnight = nsGmx.DateInterval.toMidnight, 
    _fromUTC = function (date) {
        if (!date) return null;
        var timeOffset = date.getTimezoneOffset() * 60 * 1000;
        return new Date(date.valueOf() - timeOffset);
    }, 
    _toUTC = function(date) {
        if (!date) return null;
        var timeOffset = date.getTimezoneOffset()*60*1000;
        return new Date(date.valueOf() + timeOffset);
    },
    _setMode = function(mode) {
        if (this._curMode === mode) {
            return this;
        }

        //this.reset();
        this._dateInputs.datepicker('hide');

        this._curMode = mode;
        var isSimple = mode === SIMPLE_MODE;

        $el.find('.CalendarWidget-onlyMaxVersion').toggle(!isSimple);

        this._moreIcon
            .toggleClass('icon-calendar', isSimple)
            .toggleClass('icon-calendar-empty', !isSimple)
            .attr('title', isSimple ? _gtxt('CalendarWidget.ExtendedViewTitle') : _gtxt('CalendarWidget.MinimalViewTitle'));


        var dateBegin = this._dateBegin.datepicker('getDate'),
            dateEnd = this._dateEnd.datepicker('getDate');

        if (isSimple && dateBegin && dateEnd && dateBegin.valueOf() !== dateEnd.valueOf()) {
            _selectFunc.call(this, this._dateEnd);
            _updateModel().call(this);
        }

        //this.trigger('modechange');

        return this;
    },
    _selectFunc = function(activeInput) {
        var begin = this._dateBegin.datepicker('getDate');
        var end   = this._dateEnd.datepicker('getDate');

        if (end && begin && begin > end) {
            var dateToFix = activeInput[0] == this._dateEnd[0] ? this._dateBegin : this._dateEnd;
            dateToFix.datepicker('setDate', $(activeInput[0]).datepicker('getDate'));
        } else if (this._curMode === SIMPLE_MODE) {
            //либо установлена только одна дата, либо две, но отличающиеся
            if (!begin != !end || begin && begin.valueOf() !== end.valueOf()) {
                this._dateEnd.datepicker('setDate', this._dateBegin.datepicker('getDate'));
            }
        }
    },
    _updateModel = function() {
        var dateBegin = _fromUTC(this._dateBegin.datepicker('getDate')),
            dateEnd = _fromUTC(this._dateEnd.datepicker('getDate'));

        this.dateInterval.set({
            dateBegin: dateBegin ? _toMidnight(dateBegin) : null,
            dateEnd: dateEnd ? _toMidnight(dateEnd.valueOf() + nsGmx.DateInterval.MS_IN_DAY) : null
        });
    },
    _updateWidget = function() {
        var dateBegin = this.dateInterval.get('dateBegin'),
            dateEnd = this.dateInterval.get('dateEnd'),
            dayms = nsGmx.DateInterval.MS_IN_DAY;

        if (!dateBegin || !dateEnd) {
            return;
        };

        var isValid = !(dateBegin % dayms) && !(dateEnd % dayms);

        var newDateBegin = _toUTC(dateBegin),
            newDateEnd;
        if (isValid) {
            newDateEnd = _toUTC(new Date(dateEnd - dayms));
            if (dateEnd - dateBegin > dayms) {
                this.setMode(ADVANCED_MODE);
            }
        } else {
            newDateEnd = _toUTC(dateEnd);
            this.setMode(ADVANCED_MODE);
        }

        //если мы сюда пришли после выбора интервала в самом виджете, вызов setDate сохраняет фокус на input-поле
        //возможно, это какая-то проблема jQueryUI.datepicker'ов.
        //чтобы этого избежать, явно проверяем, нужно ли изменять дату
        var prevDateBegin = this._dateBegin.datepicker('getDate'),
            prevDateEnd = this._dateEnd.datepicker('getDate');

        if (!prevDateBegin || prevDateBegin.valueOf() !== newDateBegin.valueOf()) {
            this._dateBegin.datepicker('setDate', newDateBegin);
        }

        if (!prevDateEnd || prevDateEnd.valueOf() !== newDateEnd.valueOf()) {
            this._dateEnd.datepicker('setDate', newDateEnd);
        }
    },
    _shiftDates = function(delta) {
        var dateBegin = _fromUTC(this._dateBegin.datepicker('getDate')),
            dateEnd = _fromUTC(this._dateEnd.datepicker('getDate'));

        if (!dateBegin || !dateEnd) {
            return;
        }

        var shift = (dateEnd - dateBegin + nsGmx.DateInterval.MS_IN_DAY) * delta,
            newDateBegin = new Date(dateBegin.valueOf() + shift),
            newDateEnd = new Date(dateEnd.valueOf() + shift);

        if ((!this._dateMin || _toMidnight(this._dateMin) <= _toMidnight(newDateBegin)) &&
            (!this._dateMax || _toMidnight(this._dateMax) >= _toMidnight(newDateEnd)))
        {
            this._dateBegin.datepicker('setDate', _toUTC(newDateBegin));
            this._dateEnd.datepicker('setDate', _toUTC(newDateEnd));

            _updateModel.call(this);
        }
    };

module.exports = function(options){

    $el = $('<div class="CalendarWidget ui-widget"></div>');

    this.template = Handlebars.compile(`
    <table>
    <tr>
        <td><div class = "CalendarWidget-iconScrollLeft ui-helper-noselect icon-left-open"></div></td>
        <td class = "CalendarWidget-inputCell"><input class = "gmx-input-text CalendarWidget-dateBegin"></td>
        <td class = "CalendarWidget-inputCell CalendarWidget-onlyMaxVersion"><input class = "gmx-input-text CalendarWidget-dateEnd"></td>
        <td><div class = "CalendarWidget-iconScrollRight ui-helper-noselect icon-right-open" ></div></td>
        <td><div class = "CalendarWidget-iconMore {{moreIconClass}}" title = "{{moreIconTitle}}"></div></td>
        <td><div class = "CalendarWidget-forecast" hidden>{{forecast}}</div></td>
    </tr><tr>
        <td></td>
        <td class = "CalendarWidget-dateBeginInfo"></td>
        <td class = "CalendarWidget-dateEndInfo"></td>
        <td></td>
        <td></td>
    </tr>
</table>
<div class="CalendarWidget-footer"></div>`);

    options = $.extend({
        minimized: true,
        showSwitcher: true,
        dateMax: null,
        dateMin: null,
        dateFormat: 'dd.mm.yy',
        name: null
    }, options);

    this._dateMin = options.dateMin;
    this._dateMax = options.dateMax;
    this.dateInterval = options.dateInterval;

    $el.html(this.template({
        moreIconClass: options.minimized ? 'icon-calendar' : 'icon-calendar-empty',
        moreIconTitle: options.minimized ? _gtxt('CalendarWidget.ExtendedViewTitle') : _gtxt('CalendarWidget.MinimalViewTitle'),
        forecast: _gtxt('CalendarWidget.forecast')
    }));

    this._moreIcon = $el.find('.CalendarWidget-iconMore')
        .toggle(!!options.showSwitcher);

    this._dateBegin = $el.find('.CalendarWidget-dateBegin');
    this._dateEnd = $el.find('.CalendarWidget-dateEnd');
    this._dateInputs = this._dateBegin.add(this._dateEnd);

    $el.find('.CalendarWidget-iconScrollLeft').on('click', function() {
        _shiftDates.call(this, -1);
    }.bind(this));
    $el.find('.CalendarWidget-iconScrollRight').on('click', function() {
        _shiftDates.call(this, 1);
    }.bind(this));

    this._dateInputs.datepicker({
        onSelect: function(dateText, inst){
            _selectFunc.call(this, inst.input);
            _updateModel.call(this);
        }.bind(this),
        showAnim: 'fadeIn',
        changeMonth: true,
        changeYear: true,
        minDate: this._dateMin ? _toUTC(this._dateMin) : null,
        maxDate: this._dateMax ? _toUTC(this._dateMax) : null,
        dateFormat: options.dateFormat,
        defaultDate: _toUTC(this._dateMax || new Date()),
        showOn: options.buttonImage ? 'both' : 'focus',
        buttonImageOnly: true
    });

    //устанавливаем опцию после того, как добавили календарик в canvas
    if (options.buttonImage) {
        this._dateInputs.datepicker('option', 'buttonImage', options.buttonImage);
    }

    $el.find('.CalendarWidget-onlyMaxVersion').toggle(!options.minimized);

    options.dateBegin && this._dateBegin.datepicker('setDate', _toUTC(options.dateBegin));
    options.dateEnd && this._dateEnd.datepicker('setDate', _toUTC(options.dateEnd));

    if (options.container) {
        if (typeof options.container === 'string')
            $('#' + options.container).append($el);
        else
            $(options.container).append($el);
    }

    _setMode.call(this, options.minimized ? SIMPLE_MODE : ADVANCED_MODE);

    _updateWidget.call(this);

    this.dateInterval.on('change', function(){_updateWidget.call(this)}.bind(this), this);

    //for backward compatibility
    this.canvas = $el;
}