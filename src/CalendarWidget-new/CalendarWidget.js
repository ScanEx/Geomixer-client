(function($){

'use strict';

var _gtxt = nsGmx.Translations.getText.bind(nsGmx.Translations),
    toMidnight = nsGmx.DateInterval.toMidnight;


    nsGmx.Translations.addText("rus", { CalendarWidget: {
        ShowIconTitle:     "Выбрать дату",
        createDateInterval: "Задать интервал",
        resetDateInterval:  "Сбросить интервал",
        selectDateInterval: "Применить",
        hour:               "ч.",
        from: "с",
        to: "до"
    }});

    nsGmx.Translations.addText("eng", { CalendarWidget: {
        ShowIconTitle:     "Select date",
        createDateInterval: "Create date interval",
        resetDateInterval:  "Reset date interval",
        selectDateInterval: "Select date interval",
        hour:               "h.",
        from: "from",
        to: "to"
    }});

    var template = '' +
        '<div>' +
            '<div class = "CalendarWidget-row CalendarWidget-dates">' +
                '<span class = "CalendarWidget-iconScrollLeft icon-left-open"></span>' +
                '<span class = "CalendarWidget-dates-outside">' +
                    '<span class = "CalendarWidget-inputCell CalendarWidget-inputCell-inputBegin"><input class = "CalendarWidget-dateBegin" readonly></span>' +
                    '<span class = "CalendarWidget-inputCell CalendarWidget-inputCell-inputMiddle">-</span>' +
                    '<span class = "CalendarWidget-inputCell CalendarWidget-inputCell-inputEnd"><input class = "CalendarWidget-dateEnd" readonly></span>' +
                '</span>' +
                '<span class = "CalendarWidget-iconScrollLeft ui-helper-noselect icon-right-open"></span>' +
                '<span class = "CalendarWidget-show-calendar-icon {{showCalendarIconClass}}" title = "{{showCalendarIconTitle}}"></span>' +
            '</div>' +
            '<div class = "CalendarWidget-row CalendarWidget-times">' +
                '<span class = "CalendarWidget-timeCell">' +
                '<select class="time-select begin-time-select">' +
                    '{{#each this.hoursBegin}}' +
                    '<option value="{{this.hour}}"' +
                        '{{#if this.current}} selected="selected"{{/if}}>' +
                        '{{this.hour}} {{i "CalendarWidget.hour"}}' +
                    '</option>' +
                    '{{/each}}' +
                '</select>' +
                '</span>' +
                '<span>-</span>' +
                '<span class = "CalendarWidget-timeCell">' +
                '<select class="time-select end-time-select">' +
                    '{{#each this.hoursEnd}}' +
                    '<option value="{{this.hour}}"' +
                        '{{#if this.current}} selected="selected"{{/if}}>' +
                        '{{this.hour}} {{i "CalendarWidget.hour"}}' +
                    '</option>' +
                    '{{/each}}' +
                '</select>' +
                '</span>' +
            '</div>' +
        '</div>';

/** Параметры календаря
 * @typedef nsGmx.CalendarWidget~Parameters
 * @property {nsGmx.DateInterval} dateInterval Временной интервал, который нужно менять
 * @property {Date} [dateMin] минимальная граничная дата для календарей, null - без ограничений
 * @property {Date} [dateMax] максимальная граничная дата для календарей, null - без ограничений
 * @property {String} [dateFormat='dd.mm.yy'] формат даты
 * @property {bool} [minimized=true] показывать ли минимизированный или развёрнутый виджет в начале
 * @property {bool} [showSwitcher=true] показывать ли иконку для разворачивания/сворачивания периода
 * @property {Date} [dateBegin=<текущая дата>] начальная дата интервала
 * @property {Date} [dateEnd=<текущая дата>] конечная дата интервала
 * @property {String|DOMNode} [container] куда добавлять календарик
 * @property {String} [buttonImage] URL иконки для активации календариков
 */

/** Контрол для задания диапазона дат. Даты календарика всегда в UTC, а не в текущем поясе.
 @description Виджет для выбора интервала дат. Пользователь при помощи datepicker'ов выбирает два дня (год, месяц, число),
              затем выбранные значения при помощи ф-ции `_updateModel()` переводятся в интервал дат ({@link nsGmx.DateInterval}).
              Так же виджет реагирует на изменения модели (с использованием ф-ции `_updateWidget()`)
 @alias nsGmx.CalendarWidget
 @extends nsGmx.GmxWidget
 @class
 @param {nsGmx.CalendarWidget~Parameters} options Параметры календаря
*/
var Calendar1 = nsGmx.GmxWidget.extend({
    tagName: 'div',
    className: 'CalendarWidget ui-widget',
    template: Handlebars.compile(template),
    events: {
        // 'click .CalendarWidget-dates-outside': function () {
        //     this.showCalendar();
        // },
        'click .CalendarWidget-show-calendar-icon': 'showCalendar',
        'click .CalendarWidget-iconScrollLeft': function () {
            this._shiftDates(-1);
        },
        'click .CalendarWidget-iconScrollRight': function () {
            this._shiftDates(1);
        }
    },

    initialize: function(options) {
        var _this = this;
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
        this._dateInterval = options.dateInterval;
        this._opened = false;

        $.datepicker.setDefaults({

            onSelect: function(dateText, inst){
                this._selectFunc(inst.input);
            }.bind(this),
            minDate: this._dateMin ? Calendar1.toUTC(this._dateMin) : null,
            maxDate: this._dateMax ? Calendar1.toUTC(this._dateMax) : null,
            changeMonth: true,
            changeYear: true,
            dateFormat: 'dd.mm.yy',
            defaultDate: Calendar1.toUTC(this._dateMax || new Date()),
            buttonImageOnly: true,
            constrainInput: true
        });

        this.calendarTemplates = {
            beginTemplate: Handlebars.compile('' +
                '<div class="outside-calendar-container">' +
                    '<div class="begin-outside-calendar">' +
                    '</div>' +
                    '<div class="time-container begin-time-container">' +
                    '</div>' +
                    '<div class="time-placeholder begin-time-placeholder" hidden>' +
                    '</div>' +
                        '<span class="calendar-button createdateinterval-button">' +
                        '{{i "CalendarWidget.createDateInterval"}}'+
                        '</span>' +
                        '<span class="calendar-button resetdateinterval-button" hidden>' +
                            '{{i "CalendarWidget.resetDateInterval"}}'+
                        '</span>' +
                '</div>'
            ),
            endTemplate: Handlebars.compile('' +
                '<div class="outside-calendar-container">' +
                    '<div class="end-outside-calendar">' +
                    '</div>' +
                    '<div class="time-container end-time-container">' +
                    '</div>' +
                    '<div class="time-placeholder end-time-placeholder" hidden>' +
                    '</div>' +
                    '<span class="calendar-button selectdateinterval-button disabled">' +
                        '{{i "CalendarWidget.selectDateInterval"}}'+
                    '</span>' +
                '</div>'
            ),
            timeTemplate: Handlebars.compile('' +
                '<div class="time-picker-container">' +
                    '<span class="time-picker-label">{{label}}</span>' +
                    '<select class="time-select">' +
                        '{{#each this.timeIntervals}}' +
                        '<option value="{{this.hour}}"' +
                            '{{#if this.current}} selected="selected"{{/if}}>' +
                            '{{this.hour}}' +
                        '</option>' +
                        '{{/each}}' +
                    '</select>' +
                '</div>'
            )
        };

        var dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            hourBegin = this._getTime(dateBegin, 'begin'),
            hourEnd = this._getTime(dateEnd, 'end'),
            hoursBegin = this._getHoursList(hourBegin, 'begin'),
            hoursEnd = this._getHoursList(hourEnd, 'end');

        this.$el.html(this.template({
            showCalendarIconClass:'icon-calendar-empty',
            showCalendarIconTitle: _gtxt('CalendarWidget.ShowIconTitle'),
            hoursBegin: hoursBegin,
            hoursEnd: hoursEnd
        }));

        // если есть контейнер, куда прикреплять виджет календаря
        if (options.container) {
            if (typeof options.container === 'string')
                $('#' + options.container).append(this.$el);
            else
                $(options.container).append(this.$el);
        }

        this._updateWidget();

        this._dateInterval.on('change', this._updateWidget, this);

        $('#leftMenu').on('click', function (e) {
            if (e.target.className !== 'CalendarWidget-show-calendar-icon icon-calendar-empty' &&
                e.target.className !== 'layers-before' &&
                e.target.className.indexOf('time-select') === -1 &&
                e.target.className !== 'calendar-container'
            ) {
                $(".calendar-outside .ui-dialog-titlebar-close").trigger('click');
                _this._opened = false;
            }
        })

        this.$('.time-select').on('input', this._selectTime.bind(this));

        //for backward compatibility
        this.canvas = this.$el;
    },

    _selectTime: function (e) {
        var ms = this._convertTimeValueToMs(e.target.value),
            isBegin = $(e.target).hasClass('begin-time-select'),
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            hourBegin = this._getTime(dateBegin, 'begin'),
            hourEnd = this._getTime(dateEnd, 'end'),
            msBegin = this._convertTimeValueToMs(hourBegin),
            msEnd = this._convertTimeValueToMs(hourEnd);

        this._dateInterval.set({
            dateBegin: isBegin ? new Date(dateBegin.valueOf() + (ms - msBegin)) : dateBegin,
            dateEnd: isBegin ? dateEnd : new Date(dateEnd.valueOf() + (ms - msEnd))
        });
    },

    showCalendar: function () {
        var _this = this,
            beginInput = this.$('.CalendarWidget-dateBegin')[0],
            endInput = this.$('.CalendarWidget-dateEnd')[0],
            dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            oneDayPeriod = (dateEnd.valueOf() - dateBegin.valueOf() === dayms),
            endMidnight = (dateEnd.valueOf() === toMidnight(dateEnd).valueOf());

        this.beginCalendar = $(this.calendarTemplates.beginTemplate({oneDayPeriod: oneDayPeriod}));
        this.endCalendar = $(this.calendarTemplates.endTemplate({}));

        var createIntervalButton = $('.createdateinterval-button', this.beginCalendar),
            resetIntervalButton = $('.resetdateinterval-button', this.beginCalendar),
            selectIntervalButton = $('.selectdateinterval-button', this.endCalendar),
            beginDialogOptions = {
                dialogClass: "calendar-outside begin-calendar",
                draggable: false,
                resizable: false,
                width: 224.8,
                height: 280,
                position: [372, 105],
                resizeFunc: function () {
                    return false;
                },
                closeFunc: function () {
                    _this._dateBegin.datepicker("destroy");
                },
            },
            endDialogOptions = {
                dialogClass: "calendar-outside end-calendar",
                draggable: false,
                resizable: false,
                width: 224.8,
                height: 280,
                position: [610, 105],
                resizeFunc: function () {
                    return false;
                },
                closeFunc: function () {
                    _this._dateEnd.datepicker("destroy");
                }
            };

        // this.setActive(false);

        oneDayPeriod ? this.setMode(Calendar1.SIMPLE_MODE) : this.setMode(Calendar1.ADVANCED_MODE);

        this._dateBegin = $('.begin-outside-calendar', this.beginCalendar);
        this._dateEnd = $('.end-outside-calendar', this.endCalendar);

        this._dateInputs = this._dateBegin.add(this._dateEnd);

        this._dateInputs.datepicker();

        this._dateBegin.datepicker('setDate', Calendar1.toUTC(dateBegin));
        this._dateEnd.datepicker('setDate', oneDayPeriod || endMidnight ? Calendar1.toUTC(new Date(dateEnd.valueOf() - dayms)) : Calendar1.toUTC(dateEnd));

        $(this.beginCalendar).dialog(beginDialogOptions);
        this._opened = true;

        if (this.getMode() === Calendar1.ADVANCED_MODE) {
            $(createIntervalButton).toggle(false);
            $(resetIntervalButton).toggle(true);
            // this._showTime(dateBegin, dateEnd);
            $(this.endCalendar).dialog(endDialogOptions);
            this._opened = true;
        }

        // кнопки в первом календаре
        $(createIntervalButton).on('click', function () {
            var begin = _this._dateInterval.get('dateBegin'),
                end = _this._dateInterval.get('dateEnd');

            _this.setMode(Calendar1.ADVANCED_MODE);
            $(_this.endCalendar).dialog(endDialogOptions);
            _this._opened = true;

            // _this._showTime(begin, end);

            $(this).toggle(false);
            $(resetIntervalButton).toggle(true);
        })

        $(resetIntervalButton).on('click', function () {
            var dateBegin = toMidnight(_this._dateInterval.get('dateBegin'));
            _this.setMode(Calendar1.SIMPLE_MODE);
            _this._dateBegin.datepicker('setDate', Calendar1.toUTC(dateBegin));
            _this._dateEnd.datepicker('setDate', Calendar1.toUTC(dateBegin));
            $(".calendar-outside.end-calendar .ui-dialog-titlebar-close").trigger('click');
            _this._opened = false;

            $(this).toggle(false);
            $(createIntervalButton).toggle(true);
            _this._dateInterval.set({
                dateBegin: dateBegin,
                dateEnd: new Date(dateBegin.valueOf() + dayms)
            })
            // _this._showTime(false);
        })

        // кнопка во втором календаре
        $(selectIntervalButton).on('click', function () {
            _this._updateModel();
            _this.setActive(true);
            _this._enableCreateIntervalButton();
        })
    },

    _enableCreateIntervalButton: function (e) {
        var dayms = nsGmx.DateInterval.MS_IN_DAY,
            selectIntervalButton = $('.selectdateinterval-button'),
            dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            beginTimeValue = this._convertTimeValueToMs(e && e.target === $('.begin-time-select', this)[0] ? $(e.target).val() : $('.begin-time-select option:selected').val()),
            endTimeValue = this._convertTimeValueToMs(e && e.target === $('.end-time-select', this)[0] ? $(e.target).val() : $('.end-time-select option:selected').val()),
            calendarDateBegin = this.getDateBegin(),
            calendarDateEnd = this.getDateEnd(),
            newDateBegin = new Date(calendarDateBegin.valueOf() + beginTimeValue),
            newDateEnd = new Date(calendarDateEnd.valueOf() + endTimeValue);

        // если даты в итоге не поменялись или вторая дата больше первой
        if ((newDateBegin.valueOf() === dateBegin.valueOf() && newDateEnd.valueOf() === dateEnd.valueOf()) ||
            newDateBegin.valueOf() >= newDateEnd.valueOf()) {
                $(selectIntervalButton).addClass('disabled');
        } else {
            $(selectIntervalButton).removeClass('disabled');
        }
    },

    _convertTimeValueToMs: function (value) {
        var ms = Number(value)*1000*3600;
        return ms;
    },

    _getTime: function (date, position) {
        var dayms = nsGmx.DateInterval.MS_IN_DAY,
            offset, hours;

        if (position === 'begin') {
            offset = date.valueOf() - toMidnight(date).valueOf();
        } else {
            if (date.valueOf() === toMidnight(date).valueOf()) {
                offset = dayms;
            } else {
                offset = date.valueOf() - toMidnight(date).valueOf();
            }
        };

        hours = offset/(3600*1000);

        return hours;
    },

    _getHoursList: function (activeHour, position) {
        var dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            sameDay = toMidnight(dateBegin).valueOf() === toMidnight(dateEnd).valueOf()/* || toMidnight(dateEnd).valueOf() - toMidnight(dateBegin).valueOf() === dayms*/,
            hourBegin = this._getTime(dateBegin, 'begin'),
            hourEnd = this._getTime(dateEnd, 'end'),
            timeIntervals = [],
            min, max;

        // разруливаем конфликты внутри селектов для избежания выбора некорректного времени
        if (position === 'begin') {
            min = 0;
        } else {
            if (sameDay) {
                min = hourBegin + 1;
            } else {
                min = 1;
            }
        }

        if (position === 'begin') {
            if (sameDay) {
                max = hourEnd;
            } else {
                max = 24;
            }
        } else {
            max = 25;
        }

        for (var i = min; i < max; i++) {
            timeIntervals.push({hour: i, current: false});
        }

        for (var j = 0; j < timeIntervals.length; j++) {
            if (j === activeHour && timeIntervals[j]) {
                timeIntervals[j].current = true;
            }
        }
        return timeIntervals;
    },

    _fillTimeSelect: function (timeIntervals) {
        var str = '';
        for (var i = 0; i < timeIntervals.length; i++) {
            str += '<option value=' + timeIntervals[i].hour + '>' + timeIntervals[i].hour + ' ' + _gtxt('CalendarWidget.hour') + '</option>';
        }

        return str;
    },

    _shiftDates: function(delta) {
        var dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd');

        if (!dateBegin || !dateEnd) {
            return;
        }

        var shift = (dateEnd - dateBegin) * delta,
            newDateBegin = new Date(dateBegin.valueOf() + shift),
            newDateEnd = new Date(dateEnd.valueOf() + shift);

        if ((!this._dateMin || toMidnight(this._dateMin) <= toMidnight(newDateBegin)) &&
            (!this._dateMax || toMidnight(this._dateMax) >= toMidnight(newDateEnd)))
        {
            // updateModel
            this._dateInterval.set({
                dateBegin: newDateBegin ? newDateBegin : null,
                dateEnd: newDateEnd ? newDateEnd : null
            });
        }
    },

    _selectFunc: function(activeInput) {
        var begin = this.getDateBegin(),
            end = this.getDateEnd(),
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            selectIntervalButton = $('.selectdateinterval-button');

        if (end && begin && begin > end) {
            var dateToFix = activeInput[0] == this._dateEnd[0] ? this._dateBegin : this._dateEnd;

            dateToFix.datepicker('setDate', $(activeInput[0]).datepicker('getDate'));
        }
        if (this._curMode === Calendar1.SIMPLE_MODE) {
            if (!begin != !end || begin && begin.valueOf() !== end.valueOf()) {
                this._dateEnd.datepicker('setDate', this._dateBegin.datepicker('getDate'));
            }
            this._dateInterval.set({
                dateBegin: begin ? begin : null,
                dateEnd: end ? new Date(begin.valueOf() + nsGmx.DateInterval.MS_IN_DAY) : null
            });
        } else if (this._curMode === Calendar1.ADVANCED_MODE) {
            this._enableCreateIntervalButton();
        }
    },

    _updateModel: function() {
        // получаем значения с дейтпикеров и переводим их в локальное время
        var dateBegin = this.getDateBegin(),
            dateEnd = this.getDateEnd(),
            // значение часов
            beginTimeValue = this._convertTimeValueToMs($('.begin-time-select option:selected').val()),
            endTimeValue = this._convertTimeValueToMs($('.end-time-select option:selected').val()),
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            // если второй день захвачен полностью
            fullDay = endTimeValue === dayms;

        // добавим время к часам (в локальном времени)
        dateBegin = new Date(dateBegin.valueOf() + beginTimeValue);
        dateEnd = new Date(dateEnd.valueOf() + endTimeValue);

        this._dateInterval.set({
            dateBegin: dateBegin ? dateBegin : null,
            dateEnd: dateEnd ? dateEnd : null
        });
    },

    _updateWidget: function() {
        var dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            hourBegin = this._getTime(dateBegin, 'begin'),
            hourEnd = this._getTime(dateEnd, 'end'),
            hoursBegin = this._getHoursList(hourBegin, 'begin'),
            hoursEnd = this._getHoursList(hourEnd, 'end'),
            strBegin = this._fillTimeSelect(hoursBegin),
            strEnd = this._fillTimeSelect(hoursEnd),
            beginInput = this.$('.CalendarWidget-dateBegin')[0],
            endInput = this.$('.CalendarWidget-dateEnd')[0],
            timeBegin = this.$('.begin-time-select')[0],
            timeEnd = this.$('.end-time-select')[0],
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            newDateEnd;

        if (!dateBegin || !dateEnd) {
            return;
        };

        var newDateBegin = Calendar1.toUTC(dateBegin),
            newDateEnd = Calendar1.toUTC(new Date(dateEnd));

        console.log(dateBegin);
        console.log(dateEnd);

        console.log(hourBegin);
        console.log(hourEnd);

        // если календарь показывает ровно один день,
        // прибавляем 24 часа к первой дате, чтобы получить сутки
        if (dateEnd.valueOf() === toMidnight(dateEnd).valueOf()) {
            newDateEnd = Calendar1.toUTC(new Date(dateEnd - dayms));
        }

        $(beginInput).val(Calendar1.formatDate(newDateBegin));
        $(endInput).val(Calendar1.formatDate(newDateEnd));

        $(timeBegin).html(strBegin);
        $(timeEnd).html(strEnd);

        $(timeBegin).val(hourBegin);
        $(timeEnd).val(hourEnd);
    },

    setActive: function (value) {
        var active = this.active;
        if (value !== active) {
            this.active = value;
        }

        if (this.active) {
            this.$el.removeClass('gmx-disabled')
        } else {
            this.$el.addClass('gmx-disabled')
        }
    },

    //public interface

    /** Закрыть все открытые datepicker'ы.
     * @return {nsGmx.CalendarWidget} this
     */
    reset: function() {
        this._dateInputs.datepicker('hide');
        return this;
    },

    /** Сериализация состояния виджета
     * @return {Object} Сериализованное состояние
     */
    saveState: function() {
        return {
            version: '1.1.0',
            vismode: this.getMode()
        }
    },

    /** Восстановить состояние виджета по сериализованным данным
     * @param {Object} data Сериализованное состояние календарика
     */
    loadState: function( data ) {
        this.setMode(data.vismode);
    },

    /** Получить начальную дату
     * @return {Date} начальная дата
     */
    getDateBegin: function() {
        return Calendar1.fromUTC(this._dateBegin.datepicker('getDate'));
    },

    /** Получить конечную дату
     * @return {Date} конечная дата
     */
    getDateEnd: function() {
        return Calendar1.fromUTC(this._dateEnd.datepicker('getDate'));
    },

    /** Получить верхнюю границу возможных дат периода
     * @return {Date} верхняя граница возможных периодов
     */
    getDateMax: function() {
        return this._dateMax;
    },

    /** Получить нижнуюю границу возможных дат периода
     * @return {Date} нижняя граница возможных периодов
     */
    getDateMin: function() {
        return this._dateMin;
    },

    /** Установить нижнуюю границу возможных дат периода
     * @param {Date} dateMin нижняя граница возможных периодов
     */
    setDateMin: function(dateMin) {
        this._dateMin = dateMin;
        this._dateInputs.datepicker('option', 'minDate', dateMin ? Calendar1.toUTC(dateMin) : null);
    },

    /** Установить верхнюю границу возможных дат периода
     * @param {Date} dateMax верхняя граница возможных периодов
     */
    setDateMax: function(dateMax) {
        // var titleContainer = this.$('.CalendarWidget-forecast');

        this._dateMax = dateMax;
        if (dateMax) {
            var utcDate = Calendar1.toUTC(dateMax);
            if (this._dateInputs) {
                this._dateInputs.datepicker('option', 'maxDate', utcDate);
            }

            if (dateMax > new Date()) {
            //     $(titleContainer).attr('title', _gtxt('CalendarWidget.tooltip') + ' ' +
            //     ('0' + dateMax.getDate()).slice(-2) + '-' +
            //     ('0' + (dateMax.getMonth() + 1)).slice(-2) + '-' +
            //     dateMax.getFullYear());
            //     $(titleContainer).show();
            // } else {
            //     $(titleContainer).hide();
            }

        } else {
            if (this._dateInputs) {
                this._dateInputs.datepicker('option', 'maxDate', null);
            }
        }
    },

    setSwitcherVisibility: function(isVisible) {
        this._showCalendarIcon && this._showCalendarIcon.toggle(isVisible);
    },

    getDateInterval: function() {
        return this._dateInterval;
    },

    getMode: function() {
        return this._curMode;
    },

    setMode: function(mode) {
        if (this._curMode === mode) {
            return this;
        }

        this._curMode = mode;
    }

}, {
    /* static methods */

    // date показывает в utc
    // нужно вычесть отрицательную разницу
    // utc 13:00
    // 13:00 - (-3 часа) = 16:00
    // locale 16:00
    // return locale date
    fromUTC: function(date) {
        if (!date) return null;
        var timeOffset = date.getTimezoneOffset()*60*1000;
        return new Date(date.valueOf() - timeOffset);
    },
    toUTC: function(date) {
        if (!date) return null;
        var timeOffset = date.getTimezoneOffset()*60*1000;
        return new Date(date.valueOf() + timeOffset);
    },
    formatDate: function(date) {
        var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [day, month, year].join('.');
    },
    SIMPLE_MODE: 1,
    ADVANCED_MODE: 2
});

nsGmx.CalendarWidget1 = Calendar1;

})(jQuery);
