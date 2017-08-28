// COMMON CalendarWidget

var nsGmx = nsGmx || {};

(function($){

    nsGmx.Translations.addText("rus", { CommonCalendarWidget: {
        Timeline:    "Таймлайн",
        select: "Выберите мультивременной слой",
        sync: "Единый интервал для слоев",
        daily: "посуточно",
        on: "Включить синхронизацию слоев",
        off: "Выключить синхронизацию слоев",
        all: "Интервал для всех слоев"
    }});

    nsGmx.Translations.addText("eng", { CommonCalendarWidget: {
        Timeline:     "Timeline",
        select: "Select temporal layer",
        sync: "Single date interval",
        daily: "daily",
        on: "Layers sync on",
        off: "Layers sync off",
        all: "Интервал для всех слоев"
    }});

    var toMidnight = nsGmx.DateInterval.toMidnight,
        dayms = nsGmx.DateInterval.MS_IN_DAY;

    var calendarWidgetTemplate = '' +
        '<div class="commoncalendar-container">' +
            '<div class="calendar-layers-container">' +
                '<div class="calendar-container">' +
                    '<div class="calendar-widget-container"></div>' +
                '</div>' +
            '</div>' +
            '<div class="sync-switch-container switch-container">' +
                '<label class="sync-switch switch">' +
                    '<input type="checkbox"' +
                    '{{#if synchronyzed}}checked{{/if}}' +
                    '>' +
                    '<div class="sync-switch-slider switch-slider round"></div>' +
                '</label>' +
                '<span class="sync-switch-slider-description">{{i "CommonCalendarWidget.sync"}}</span>' +
                '<label class="daily-switch">' +
                    '<input type="checkbox"' +
                    '{{#if dailyFilter}}checked{{/if}}' +
                    '>' +
                    '{{i "CommonCalendarWidget.daily"}}' +
                '</label>' +
            '</div>' +
            '<div class="unsync-layers-container" style="display: none">' +
                '<select class="layersList">' +
                    '{{#each this.layers}}' +
                    '<option value="{{this.layer}}"' +
                        '{{#if this.current}} selected="selected"{{/if}}>' +
                        '{{this.layer}}' +
                    '</option>' +
                    '{{/each}}' +
                '</select>' +
            '</div>' +
        '</div>' ;
    'use strict';

    var _gtxt = nsGmx.Translations.getText.bind(nsGmx.Translations);

    var CommonCalendarModel = window.Backbone.Model.extend({
        defaults: {
            active: true,
            currentLayer: null,
            calendar: null,
            isAppended: false,
            unbindedTemporalLayers: {},
            dailyFiltersHash: {},
            dailyFilter: true,
            synchronyzed: true
        }
    });

    var CommonCalendar = window.Backbone.View.extend({
        tagName: 'div',
        model: new CommonCalendarModel(),
        className: 'CommonCalendarWidget ui-widget',
        template: Handlebars.compile(calendarWidgetTemplate),
        events: {
            'change .sync-switch': 'toggleSync',
            'change .daily-switch': 'toggleDailyFilter',
            'change .layersList': 'changeCurrentLayer'
        },
        initialize: function (options) {
            var _this = this;

            this.$el.html(this.template({
                synchronyzed: _this.model.get('synchronyzed'),
                layers: _this.model.get('visibleTemporalLayers'),
                dailyFilter: _this.model.get('dailyFilter')
            }));

            //for backward compatibility
            this.canvas = this.$el;
            this.dateInterval = new nsGmx.DateInterval();

            this.listenTo(this.model, 'change:synchronyzed', this.updateSync);
            this.listenTo(this.model, 'change:dailyFilter', (function () {
                this.handleFiltersHash();
                this.applyDailyFilter();
            }).bind(this));

            this.dateInterval.on('change', function () {
                _this.updateVisibleTemporalLayers(nsGmx.gmxMap.layers);
                if (_this.model.get('dailyFilter')) {
                    _this.applyDailyFilter();
                }
            });

            this._fillFiltersHash();
        },

        _fillFiltersHash: function(layers) {
            layers = layers || nsGmx.gmxMap.layers;

            var dailyFiltersHash = {};

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i],
                    props = layer.getGmxProperties(),
                    layerID = props.LayerID,
                    isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.getDateInterval);

                if (isTemporalLayer) {
                    dailyFiltersHash[layerID] = true;
                }

                this.model.set('dailyFiltersHash', dailyFiltersHash);
            }
        },

        _clearFiltersHash: function (layers) {
            layers = layers || nsGmx.gmxMap.layers;

            var dailyFiltersHash = {};

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i],
                    props = layer.getGmxProperties(),
                    layerID = props.LayerID,
                    isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.getDateInterval);

                if (isTemporalLayer) {
                    dailyFiltersHash[layerID] = false;
                }

                this.model.set('dailyFiltersHash', dailyFiltersHash);
            }
        },

        setDateInterval: function (dateBegin, dateEnd, layer) {
            if (layer) {
                this.setCurrentLayer(layer);
            }

            var oldBegin = this.dateInterval.get('dateBegin').valueOf(),
                oldEnd = this.dateInterval.get('dateEnd').valueOf();

            if (oldBegin === dateBegin.valueOf() && oldEnd === dateEnd.valueOf()) {
                this.updateTemporalLayers();

                this.updateVisibleTemporalLayers(nsGmx.gmxMap.layers);
                if (this.model.get('dailyFilter')) {
                    this.applyDailyFilter();
                }
                this.trigger('change:dateInterval');
            } else {
                this.dateInterval.set({
                    dateBegin: dateBegin,
                    dateEnd: dateEnd
                });
            }

            if (this.dateInterval.get('dailyFilter')) {
                this.applyDailyFilter();
            }
        },

        setCurrentLayer: function (layer) {
            var props = layer.getGmxProperties();

            this.model.set('currentLayer', props.LayerID);
        },

        changeCurrentLayer: function (e) {
            var _this = this,
                layerID = e.target.value;

            _this.model.set('currentLayer', layerID);
        },

        log: function () {
            var f = function(list) {
                var layers = nsGmx.gmxMap.layers;

                for (var i = 0; i < layers.length; i++) {
	               var layer = layers[i],
                        props = layer.getGmxProperties(),
                        t = props.title,
                        isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.getDateInterval);
                        int = layer.getDateInterval();

                    if (isTemporalLayer && int) {
                        var b = int.beginDate.toString(),
                            e = int.endDate.toString();
                        list.push({
                            title: t,
                            beginDate: b,
                            endDate: e
                        });
                    }
	            }
	               console.table(list);
            };
            f([]);
        },

        getDateInterval: function () {
            return this.dateInterval;
        },

        get: function() {
            var attrs = this.model.toJSON(),
                _this = this,
                calendar;

            if (!attrs.calendar) {
                calendar = new nsGmx.CalendarWidget1({
                    minimized: false,
                    dateMin: new Date(2000, 1, 1),
                    dateMax: new Date(Date.now() + dayms) > _this.dateInterval.get('dateEnd') ? new Date(Date.now() + dayms) : _this.dateInterval.get('dateEnd'),
                    dateInterval: _this.dateInterval
                });

                this.dateInterval.on('change', this.updateTemporalLayers.bind(this, null));

                this.model.set('calendar', calendar);
            this.updateTemporalLayers();
            }

            return this.model.get('calendar');
        },

        replaceCalendarWidget: function(newCalendar) {
            this._calendar = newCalendar;

            //заменим виджет перед деревом слоёв
            if (this._isAppended) {
                var doChange = function() {
                    var calendarDiv = $('<div class="commoncalendar-container"></div>').append(newCalendar.canvas);
                    // special for steppe project
                    if (nsGmx.gmxMap.properties.MapID === '0786A7383DF74C3484C55AFC3580412D') {
                        _queryMapLayers.getContainerAfter().find('.commoncalendar-container').replaceWith(calendarDiv);
                    } else {
                        _queryMapLayers.getContainerBefore().findcommoncalendar-container('.commoncalendar-container').replaceWith(calendarDiv);
                    }
                }
                //явная проверка, так как хочется быть максимально синхронными в этом методе
                if (_queryMapLayers.loadDeferred.state() === 'resolved') {
                    doChange();
                } else {
                    _queryMapLayers.loadDeferred.then(doChange);
                }
            }
        },

        show: function() {
            var calendarDiv = this.$('.calendar-widget-container'),
                calendarCanvas = this.get().canvas;

            $(_queryMapLayers.getContainerBefore()).append(calendarCanvas[0]);

            var doAdd = function() {
                calendarDiv.append(calendarCanvas);

                var commonCanvas = this.canvas;

                // special for steppe Project
                if (nsGmx.gmxMap.properties.MapID === '0786A7383DF74C3484C55AFC3580412D') {
                    _queryMapLayers.getContainerAfter().append(commonCanvas);
                } else {
                    _queryMapLayers.getContainerBefore().append(commonCanvas);
                }
                this.model.set('isAppended', true);
            }.bind(this);

            if (!this.model.get('isAppended')) {
                //явная проверка, так как хочется быть максимально синхронными в этом методе
                if (_queryMapLayers.loadDeferred.state() === 'resolved') {
                    doAdd();
                } else {
                    _queryMapLayers.loadDeferred.then(doAdd);
                }
            }

            return this;
        },

        hide: function() {
            var attrs = this.model.toJSON();
            attrs._isAppended && $(this.get().canvas).hide();
            this.model.set('isAppended', true);

            return this;
        },

        bindLayer: function(layerName) {
            var attrs = this.model.toJSON(),
                unbindedTemporalLayers = attrs.unbindedTemporalLayers,
                clone = {};

            // clone object
            for (var variable in unbindedTemporalLayers) {
                if (unbindedTemporalLayers.hasOwnProperty(variable)) {
                    clone[variable] = unbindedTemporalLayers[variable];
                }
            };

            delete clone[layerName];

            this.model.set('unbindedTemporalLayers', clone);
            this.updateTemporalLayers();
        },

        unbindLayer: function(layerName) {
            var attrs = this.model.toJSON(),
                layer = nsGmx.gmxMap.layersByID[layerName],
                props = layer.getGmxProperties(),
                unbindedTemporalLayers = attrs.unbindedTemporalLayers,
                clone = {};

            layer.removeLayerFilter({id: 'dailyFilter'});
            // clone object
            for (var variable in unbindedTemporalLayers) {
                if (unbindedTemporalLayers.hasOwnProperty(variable)) {
                    clone[variable] = unbindedTemporalLayers[variable];
                }
            };

            clone[layerName] = true;
            this.model.set('unbindedTemporalLayers', clone);
            this.updateTemporalLayers();
        },

        _updateOneLayer: function(layer, dateBegin, dateEnd) {
            var props = layer.getGmxProperties();
            if (props.maxShownPeriod) {
                var msecPeriod = props.maxShownPeriod*24*3600*1000;
                var newDateBegin = new Date( Math.max(dateBegin.valueOf(), dateEnd.valueOf() - msecPeriod));
                layer.setDateInterval(newDateBegin, dateEnd);
            } else {
                layer.setDateInterval(dateBegin, dateEnd);
            }
        },

        updateTemporalLayers: function() {
            var layers = layers || nsGmx.gmxMap.layers,
                attrs = this.model.toJSON(),
                synchronyzed = attrs.synchronyzed,
                dateBegin = this.dateInterval.get('dateBegin'),
                dateEnd = this.dateInterval.get('dateEnd'),
                currentLayer = attrs.currentLayer,
                layersMaxDates = [],
                maxDate = null,
                localeDate;

            if (!attrs.calendar) {return;}

            if (synchronyzed) {
                for (var i = 0, len = layers.length; i < len; i++) {
                    var layer = layers[i],
                    props = layer.getGmxProperties(),
                    isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.getDateInterval);

                    if (isTemporalLayer && !(props.name in attrs.unbindedTemporalLayers)) {
                        if (props.DateEnd) {
                            if (typeof props.DateEnd === "string") {
                                localeDate = $.datepicker.parseDate('dd.mm.yy', props.DateEnd);
                            } else if (typeof props.DateEnd === "number") {
                                localeDate = new Date(props.DateEnd);
                            }

                            layersMaxDates.push(localeDate);
                        }

                        this._updateOneLayer(layer, dateBegin, dateEnd);
                    }
                }
            } else {
                if (currentLayer && !(currentLayer in attrs.unbindedTemporalLayers)) {
                    currentLayer = nsGmx.gmxMap.layersByID[currentLayer];
                    this._updateOneLayer(currentLayer, dateBegin, dateEnd);
                } else {
                    return;
                }
            }

            if (layersMaxDates.length > 0) {
                layersMaxDates.sort(function(a, b) {
                    return b - a;
                });

                maxDate = new Date(layersMaxDates[0]);

                if (maxDate > attrs.calendar.getDateMax()) {
                    attrs.calendar.setDateMax(nsGmx.CalendarWidget.fromUTC(new Date(maxDate.valueOf() + dayms)));
                }

                this.model.set('calendar', attrs.calendar);
            }
        },

        onDateIntervalChanged: function (e) {
            var attrs = this.model.toJSON(),
                currentLayer = attrs.currentLayer,
                layer = e.target,
                props,
                layerName,
                dateInterval, dateBegin, dateEnd;

            if (!currentLayer) {
                return;
            }

            props = layer.getGmxProperties(),
            layerID = props.LayerID;

            if (layerID in attrs.unbindedTemporalLayers) {
                return;
            }

            if (layerID === currentLayer) {
                if (props.maxShownPeriod) { return; }
                dateInterval = layer.getDateInterval(),
                dateBegin = dateInterval.beginDate,
                dateEnd = dateInterval.endDate;

                this.setDateInterval(dateBegin, dateEnd, layer);
            }
        },

        updateVisibleTemporalLayers: function (layers) {
            var _this = this,
                attrs = this.model.toJSON(),
                currentLayer = attrs.currentLayer,
                layersList = this.$('.layersList'),
                temporalLayers = [],
                layersArr = [],
                str = '';

            $.widget( "ui.temporallayersmenu", $.ui.selectmenu, {
                _renderItem: function(ul, item) {
                    var li = $( "<li>" );

                    if ( item.value ) {
                        var l = nsGmx.gmxMap.layersByID[item.value],
                            props = l.getGmxProperties(),
                            di = l.getDateInterval && l.getDateInterval(),
                            dateBegin, dateEnd,
                            hourBegin, hourEnd,
                            newDateBegin, newDateEnd,
                            str = '';

                        if (di) {
                            var now = new Date(),
                                dateBeginToMidnight = new Date(now - now % dayms);

                            // dateBegin = di.beginDate;
                            // dateEnd = di.endDate);
                            dateBegin = di.beginDate || dateBeginToMidnight;
                            dateEnd = di.endDate || new Date(dateBeginToMidnight.valueOf() + dayms);
                            hourBegin = nsGmx.CalendarWidget1.prefixTimeValue(nsGmx.CalendarWidget1.getTime(dateBegin, 'begin'));
                            hourEnd = nsGmx.CalendarWidget1.prefixTimeValue(nsGmx.CalendarWidget1.getTime(dateEnd, 'end'));
                            newDateBegin = nsGmx.CalendarWidget1.toUTC(dateBegin);
                            newDateEnd = nsGmx.CalendarWidget1.toUTC(dateEnd);

                            // если календарь показывает ровно один день,
                            // прибавляем 24 часа к первой дате, чтобы получить сутки
                            if (dateEnd.valueOf() === toMidnight(dateEnd).valueOf()) {
                                newDateEnd = nsGmx.CalendarWidget1.toUTC(new Date(dateEnd - dayms));
                            }

                            str = '<span class=\'layerslist-title\'>' +  props.title + '</span>' + ' ' +
                                  '<span class=\'layerslist-dates-times\'>' + nsGmx.CalendarWidget1.formatDate(newDateBegin) + ' - ' + nsGmx.CalendarWidget1.formatDate(newDateEnd) +
                                  ' | ' + hourBegin + '-' + hourEnd + '</span>';

                        }

                        $(li).html(str);
                        $(li).prop('layerID', item.value);

                        return li.appendTo( ul );
                    }
                },
                _renderMenu: function( ul, items ) {
                    var that = this;
                    $.each( items, function( index, item ) {
                        that._renderItemData( ul, item );
                    });
                }
            });

            if ($(layersList).temporallayersmenu("instance")) {
                $(layersList).temporallayersmenu("destroy");
            }

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                    if (layer.getGmxProperties) {
                        var props = layer.getGmxProperties(),
                            isVisible = props.visible,
                            isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.getDateInterval);

                        if (isTemporalLayer && isVisible) {
                            temporalLayers.push(layer);
                        }
                    }
                }

            for (var i = 0; i < temporalLayers.length; i++) {
                var layer = temporalLayers[i],
                    props = layer.getGmxProperties(),
                    layerID = props.LayerID;

                str += '<option value=' + layerID + '>' + props.title + '</option>';
            };

            $(layersList).html(str);

            if (currentLayer) {
                var l = nsGmx.gmxMap.layersByID[currentLayer];

                this.$('.layersList option').each(function () {
                    if ($(this).val() === currentLayer) {
                        $(this).prop("selected", true);
                    }
                })

            // установим текщим первый слой из списка
            } else if (!currentLayer && temporalLayers.length) {
                var props = temporalLayers[0].getGmxProperties(),
                    layerID = props.LayerID;

                this.$('.layersList option[value="' + layerID + '"]').prop("selected", true);
            }

            $(layersList).temporallayersmenu({
                change: function (e) {
                    var layerID = $(e.currentTarget).prop('layerID'),
                        layer = nsGmx.gmxMap.layersByID[layerID],
                        filters = layer._gmx.dataManager._filtersView,
                        layerFilters = filters[layerID],
                        dateBegin, dateEnd;

                    dateInterval = layer.getDateInterval();

                    if (dateInterval.beginDate && dateInterval.endDate) {
                        dateBegin = dateInterval.beginDate;
                        dateEnd = dateInterval.endDate;
                    } else {
                        dateInterval = new nsGmx.DateInterval();
                        dateBegin = dateInterval.get('dateBegin');
                        dateEnd = dateInterval.get('dateEnd');
                    }

                    if (layerFilters) {
                        if ('screen_dailyFilter' in layerFilters) {
                            _this.$('.daily-switch input').prop("checked", true);
                        } else {
                            _this.$('.daily-switch input').prop("checked", false);
                        }
                    }

                    _this.$('.layersList option[value="' + layerID + '"]').prop("selected", true);
                    _this.setDateInterval(dateBegin, dateEnd, layer);

                }
            });
        },

        toggleSync: function () {
            this.model.set('synchronyzed', !this.model.get('synchronyzed'));
        },

        updateSync: function () {
            var _this = this,
                layers = nsGmx.gmxMap.layers,
                attrs = this.model.toJSON(),
                synchronyzed = attrs.synchronyzed,
                currentLayer = attrs.currentLayer,
                listContainer = this.$('.unsync-layers-container'),
                layersList = this.$('.layersList'),
                dateBegin, dateEnd;

            if (synchronyzed) {
                dateBegin = _this.dateInterval.get('dateBegin'),
                dateEnd = _this.dateInterval.get('dateEnd'),
                _this.setDateInterval(dateBegin, dateEnd);
                this.model.set('currentLayer', null);
                this.model.set('currentLayer', null);
                this.$('.sync-switch input').prop("checked", true);
                $(listContainer).hide();
            } else {
                if (currentLayer) {
                    return;
                } else {
                    var temporalLayers = [];

                    this.$('.sync-switch input').prop("checked", false);
                    $(listContainer).show();
                    this.updateVisibleTemporalLayers(layers);

                    for (var i = 0; i < layers.length; i++) {
                        var layer = layers[i];
                        if (layer.getGmxProperties) {
                            var props = layer.getGmxProperties(),
                            isVisible = props.visible,
                            isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.getDateInterval);

                            if (isTemporalLayer && isVisible) {
                                temporalLayers.push(layer);
                            }
                        }
                    }
                    if (!temporalLayers.length) {
                        this.model.set('currentLayer', null);
                    } else {
                        var props = temporalLayers[0].getGmxProperties(),
                        layerID = props.LayerID;
                        this.model.set('currentLayer', layerID);
                    }
                }
            }
        },

        toggleDailyFilter: function () {
            var attrs = this.model.toJSON(),
                calendar = attrs.calendar;

            calendar.model.set('dailyFilter', !this.model.get('dailyFilter'));
            this.model.set('dailyFilter', !this.model.get('dailyFilter'));
        },

        setDailyFilter: function (active) {
            var attrs = this.model.toJSON(),
                calendar = attrs.calendar;

            calendar.model.set('dailyFilter', active);
            this.model.set('dailyFilter', active);
        },

        handleFiltersHash: function () {
            var attrs = this.model.toJSON(),
                synchronyzed = attrs.synchronyzed,
                currentLayer = attrs.currentLayer,
                dateInterval = this.dateInterval,
                calendar = attrs.calendar,
                dailyFilter = attrs.dailyFilter,
                dailyFiltersHash = attrs.dailyFiltersHash;

            if (dailyFilter) {
                if (currentLayer) {
                    dailyFiltersHash[currentLayer] = true;
                } else {
                    this._fillFiltersHash();
                }
            } else {
                if (currentLayer) {
                    dailyFiltersHash[currentLayer] = false;
                } else {
                    this._clearFiltersHash();
                }
            }
        },

        applyDailyFilter: function (layers) {
            var temporalLayers = layers || nsGmx.gmxMap.layers,
                _this = this,
                attrs = this.model.toJSON(),
                dailyFilter = attrs.dailyFilter,
                dailyFiltersHash = attrs.dailyFiltersHash,
                synchronyzed = attrs.synchronyzed,
                currentLayer = attrs.currentLayer,
                dateInterval = this.dateInterval,
                calendar = attrs.calendar,
                dateBegin = this.dateInterval.get('dateBegin'),
                dateEnd = this.dateInterval.get('dateEnd'),
                hourBegin = Number(nsGmx.CalendarWidget1.getTime(dateBegin, 'begin')) * 1000 * 3600,
                hourEnd = Number(nsGmx.CalendarWidget1.getTime(dateEnd, 'end')) * 1000 * 3600;
                temporalLayers;

            if (synchronyzed) {
                temporalLayers = nsGmx.gmxMap.layers;
            }

            if (!synchronyzed && !currentLayer) {
                return;
            }

            for (var i = 0; i < temporalLayers.length; i++) {
                var l = temporalLayers[i],
                    p = l.getGmxProperties && l.getGmxProperties(),
                    layerName;

                if (!p) {
                    continue;
                }

                layerName = p.name;

                if (layerName in attrs.unbindedTemporalLayers) {
                    continue;
                }

                (function (x) {
                var layer = temporalLayers[x];

                if (layer.getGmxProperties) {
                        var props = layer.getGmxProperties(),
                            isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.getDateInterval);

                        if (isTemporalLayer && layer.getDataManager) {

                            if (!synchronyzed && layer.getDateInterval()) {
                                dateInterval = layer.getDateInterval();
                                if (dateInterval.beginDate && dateInterval.endDate) {
                                    dateBegin = dateInterval.beginDate;
                                    dateEnd = dateInterval.endDate;
                                    hourBegin = Number(nsGmx.CalendarWidget1.getTime(dateBegin, 'begin')) * 1000 * 3600,
                                    hourEnd = Number(nsGmx.CalendarWidget1.getTime(dateEnd, 'end')) * 1000 * 3600;
                                }
                            }

                            var dm = layer.getDataManager(),
                                dmOpt = dm.options,
                                fullDays,
                                intervals = [];

                            if (dmOpt.Temporal) {
                                var tmpKeyNum = dm.tileAttributeIndexes[dmOpt.TemporalColumnName];
                            }

                            if (hourEnd < dayms) {
                                fullDays = toMidnight(dateEnd).valueOf() - toMidnight(dateBegin).valueOf() + dayms;
                            } else if (hourEnd === dayms) {
                                fullDays = toMidnight(dateEnd).valueOf() - toMidnight(dateBegin).valueOf();
                            }

                            for (var i = 0; i < fullDays; i+= dayms) {
                                intervals.push({
                                    begin: toMidnight(dateBegin).valueOf() + hourBegin + i,
                                    end: toMidnight(dateBegin).valueOf() + hourEnd + i
                                });
                            }

                            if (dailyFilter && dailyFiltersHash[props.LayerID]) {
                                layer.addLayerFilter(function (item) {
                                    var itemDate = item.properties[tmpKeyNum] * 1000,
                                        inside = false;
                                    for (var j = 0; j < intervals.length; j++) {
                                        if (intervals[j].begin <= itemDate && itemDate <= intervals[j].end) {
                                            inside = true;
                                            break;
                                        }
                                    }
                                    //
                                    // if (inside) {
                                    //     console.log(layer.getGmxProperties().title + ' / ' + 'loaded');
                                    // } else {
                                    //     console.log(layer.getGmxProperties().title + ' / ' + 'filtered');
                                    // }
                                    return inside;
                                }, {id: 'dailyFilter'});

                                _this.$('.daily-switch input').prop("checked", true);

                            } else {
                                layer.removeLayerFilter({id: 'dailyFilter'});
                                _this.$('.daily-switch input').prop("checked", false);
                            }
                        }
                    }
                }(i));
            }
        }
    });

    nsGmx.CommonCalendarWidget = CommonCalendar;

})(jQuery);
