(function () {
    'use strict';

	window.nsGmx = window.nsGmx || {};

    var pluginName = 'TimeSlider',
		homePath;

    var publicInterface = {
        pluginName: pluginName,

        afterViewer: function (params, map) {
            var layerID = params.layerID,
                layer = nsGmx.gmxMap.layersByID[layerID],
                props = layer.getGmxProperties(),
                isTemporalLayer = (layer instanceof L.gmx.VectorLayer && props.Temporal) || (props.type === 'Virtual' && layer.setDateInterval),
                dialogParams = $.extend({
                    dialogClass: "time-slider-dialog",
                    width: 235,
                    height: 36,
                    position: [694, 124]
                }, params.dialog),
                sliderContainer = document.createElement('div'),
                sliderDiv = document.createElement('div'),
                dateInterval = nsGmx.widgets.commonCalendar.dateInterval;

            $(sliderContainer).addClass('time-slider-container');
            $(sliderDiv).addClass('time-slider-div');
            $(sliderContainer).append(sliderDiv);
            $(sliderContainer).dialog(dialogParams);

            $(sliderDiv).slider();

            if (!isTemporalLayer) {return;}

            dateInterval.on('change', function () {
                $(sliderDiv).slider('option', 'min', dateInterval.get('dateBegin').valueOf());
                $(sliderDiv).slider('option', 'max', dateInterval.get('dateEnd').valueOf());
                $(sliderDiv).slider('value', dateInterval.get('dateEnd').valueOf());
            });

            $(sliderDiv).slider('option', 'min', dateInterval.get('dateBegin').valueOf());
            $(sliderDiv).slider('option', 'max', dateInterval.get('dateEnd').valueOf());
            $(sliderDiv).slider('value', dateInterval.get('dateEnd').valueOf());

            $(sliderDiv).on( "slidechange", function(event, ui) {
                var dateBegin = new Date($(this).slider('option', 'min')),
                    dateEnd = new Date(ui.value);

                layer.setDateInterval(dateBegin, dateEnd);
            });
        }
    };

    if (window.gmxCore) {
		window.gmxCore.addModule(pluginName, publicInterface, {
			css: 'TimeSlider.css'
		});
	} else {
		window.nsGmx[pluginName] = publicInterface;
	}
})();
