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
        sync: "Single dateinterval",
        daily: "daily",
        on: "Layers sync on",
        off: "Layers sync off",
        all: "Интервал для всех слоев"
    }});

    var calendarWidgetTemplate = '' +
        '<div class="commoncalendar-container">' +
            '<div class="calendar-layers-container">' +
                '<div class="calendar-container">' +
                    '<div class="calendar-widget-container"></div>' +
                    // '<div class="calendar-sync-button"></div>' +
                '</div>' +
            '</div>' +
            '<div class="sync-switch-container">' +
                '<label class="sync-switch">' +
                    '<input type="checkbox"' +
                    '{{#if synchronyzed}}checked{{/if}}' +
                    '>' +
                    '<div class="sync-switch-slider round"></div>' +
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
            this.listenTo(this.model, 'change:dailyFilter', this.applyDailyFilter);
            this.listenTo(this.model, 'change:active', this.activate);
        },

        setDateInterval: function (dateBegin, dateEnd, layer) {
            if (layer) {
                this.setCurrentLayer(layer);
            }

            var oldBegin = this.dateInterval.get('dateBegin').valueOf(),
                oldEnd = this.dateInterval.get('dateEnd').valueOf();

            if (oldBegin === dateBegin.valueOf() && oldEnd === dateEnd.valueOf()) {
                this.trigger('change:dateInterval');
            } else {
                this.dateInterval.set({
                    dateBegin: dateBegin,
                    dateEnd: dateEnd
                });
            }
        },

        setCurrentLayer: function (layer) {
            var props = layer.getGmxProperties();

            this.model.set('currentLayer', props.LayerID);
        },

        changeCurrentLayer: function (e) {
            var _this = this,
                title = e.target.value,
                layer = nsGmx.gmxMap.layersByTitle[title],
                layerID = layer.getGmxProperties().LayerID;

            _this.model.set('currentLayer', layerID);
        },

        log: function () {
            var f = function(list) {
                var layers = nsGmx.gmxMap.layers;

                for (var i = 0; i < layers.length; i++) {
	               var layer = layers[i],
                        props = layer.getGmxProperties(),
                        t = props.title,
                        isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.setDateInterval);
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
                    dateMax: _this.dateInterval.get('dateEnd'),
                    dateInterval: _this.dateInterval
                });

                this.dateInterval.on('change', this.updateTemporalLayers.bind(this, null));

                this.model.set('calendar', calendar);
            this.updateTemporalLayers();
            }

            return this.model.get('calendar');
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
        },

        hide: function() {
            var attrs = this.model.toJSON();
            attrs._isAppended && $(this.get().canvas).hide();
            this.model.set('isAppended', false);
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
            var layers = nsGmx.gmxMap.layers,
                attrs = this.model.toJSON(),
                layerTitle,
                unbindedTemporalLayers = attrs.unbindedTemporalLayers,
                clone = {};

            // clone object
            for (var variable in unbindedTemporalLayers) {
                if (unbindedTemporalLayers.hasOwnProperty(variable)) {
                    clone[variable] = unbindedTemporalLayers[variable];
                }
            };

            clone[layerName] = true;
            this.model.set('unbindedTemporalLayers', clone);
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
                maxDate = null;

            if (!attrs.calendar) {return;}

            if (synchronyzed) {
                for (var i = 0, len = layers.length; i < len; i++) {
                    var layer = layers[i],
                    props = layer.getGmxProperties(),
                    isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.setDateInterval);

                    if (isTemporalLayer && !(props.name in attrs.unbindedTemporalLayers)) {
                        if (props.DateEnd) {
                            var localeDate = $.datepicker.parseDate('dd.mm.yy', props.DateEnd);
                            layersMaxDates.push(localeDate);
                        }

                        this._updateOneLayer(layer, dateBegin, dateEnd);
                    }
                }
            } else {
                if (currentLayer) {
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

                if (maxDate > new Date()) {
                    attrs.calendar.setDateMax(nsGmx.CalendarWidget.fromUTC(maxDate));
                } else {
                    attrs.calendar.setDateMax(new Date());
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

            if ($(layersList).selectmenu("instance")) {
                $(layersList).selectmenu("destroy");
            }

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                    if (layer.getGmxProperties) {
                        var props = layer.getGmxProperties(),
                            isVisible = props.visible,
                            isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.setDateInterval);

                        if (isTemporalLayer && isVisible) {
                            temporalLayers.push(layer);
                        }
                    }
                }

            for (var i = 0; i < temporalLayers.length; i++) {
                var layer = temporalLayers[i],
                    props = layer.getGmxProperties(),
                    title = props.title;
                    str += '<option value=' + title + '>' + title + '</option>';
            };

            $(layersList).html(str);

            if (currentLayer) {
                var l = nsGmx.gmxMap.layersByID[currentLayer],
                    currentTitle = l.getGmxProperties().title;
                this.$('.layersList option[value="' + currentTitle + '"]').prop("selected", true);

            // установим текщим первый слой из списка
            } else if (!currentLayer && temporalLayers.length) {
                var props = temporalLayers[0].getGmxProperties(),
                    layerID = props.LayerID,
                    title = props.title;

                // this.model.set('currentLayer', layerID);
                this.$('.layersList option[value="' + title + '"]').prop("selected", true);
            }

            $(layersList).selectmenu({
                change: function (e) {
                    var title = $(e.currentTarget).text(),
                        layer = nsGmx.gmxMap.layersByTitle[title];

                    dateInterval = layer.getDateInterval();

                    if (dateInterval.beginDate && dateInterval.endDate) {
                        dateBegin = dateInterval.beginDate,
                        dateEnd = dateInterval.endDate;
                    } else {
                        dateInterval = new nsGmx.DateInterval();
                        dateBegin = dateInterval.beginDate,
                        dateEnd = dateInterval.endDate;
                    }

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
                dateInterval, dateBegin, dateEnd;

            if (synchronyzed) {
                this.model.set('currentLayer', null);
                $(listContainer).hide();
            } else {
                if (currentLayer) {
                    return;
                } else {
                    var temporalLayers = [];

                    $(listContainer).show();
                    this.updateVisibleTemporalLayers(layers);

                    for (var i = 0; i < layers.length; i++) {
                        var layer = layers[i];
                        if (layer.getGmxProperties) {
                            var props = layer.getGmxProperties(),
                            isVisible = props.visible,
                            isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.setDateInterval);

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
            this.model.set('dailyFilter', !this.model.get('dailyFilter'));
        },

        applyDailyFilter: function () {
            var _this = this,
                layers = nsGmx.gmxMap.layers,
                attrs = this.model.toJSON(),
                dailyFilter = attrs.dailyFilter,
                synchronyzed = attrs.synchronyzed,
                currentLayer = attrs.currentLayer,
                listContainer = this.$('.unsync-layers-container'),
                layersList = this.$('.layersList'),
                dateInterval, dateBegin, dateEnd;

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];

                if (layer.getGmxProperties) {
                    var props = layer.getGmxProperties(),
                        isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.setDateInterval);

                    if (isTemporalLayer) {
                        layer.addLayerFilter(function(item) {
                            console.log(item);
                            return item;
                        })
                    }
                }
            }

            console.log(dailyFilter);
        }
    });

    nsGmx.CommonCalendarWidget = CommonCalendar;

})(jQuery);
