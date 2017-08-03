(function () {
    'use strict';

	window.nsGmx = window.nsGmx || {};

    var pluginName = 'AttributionMenu',
		homePath;

    var publicInterface = {
        pluginName: pluginName,

        afterViewer: function (params, map) {
            if (!params.layers) return;
            var layers = params.layers.split(','),
                dialogOptions = {
                    position: 'top',
                    anchor: [75, $('#flash').width() - 220],
                    size: [200, 110]
                },
                calendarDateInterval = nsGmx.widgets.commonCalendar.dateInterval,
                content = '<div></div>',
                query,
                layer;

            for (var i = 0; i < layers.length; i++) {
                layer = layers[i];

                if (layer === '0468B68A9D904623A6093EE22A8B290E') {
                    content += '' +
                        '<div>' +
                            '<h6>За период</h6>' +
                            '<div class="oil-time-value"></div>' +
                            '<div class="oil-find">обнаружено разливов</div>' +
                                '<div class="oil-value"></div>' +
                        '</div>';

                    bindCounter(calendarDateInterval);

                    calendarDateInterval.on('change', bindCounter);
                }
            }

            var dialog = L.control.dialog(dialogOptions)
                .setContent(content)
                .addTo(map);

            nsGmx.leafletMap.on('resize', function () {
                dialog.setLocation([75, $('#flash').width() - 220]);
            })

            function parseDate(date) {
                var mm = date.getMonth() + 1; // getMonth() is zero-based
                var dd = date.getDate();

                return [
                    (dd>9 ? '' : '0') + dd,
                    (mm>9 ? '' : '0') + mm,
                    date.getFullYear()
                ].join('.');
            };

            function bindCounter(dateInterval) {
                var dateInterval = dateInterval || this,
                    db = parseDate(dateInterval.get('dateBegin')),
                    de = parseDate(dateInterval.get('dateEnd')),
                    query = "([date_real]>='" + db + "') and ([date_real]<'" + de + "')",
                    reqParams = {
                        layer: layer,
                        query: query,
                        count: true
                    },
                    url = window.serverBase + 'VectorLayer/Search.ashx?' + $.param(reqParams);


                sendCrossDomainJSONRequest(url,
                    function (res) {
                        $('.oil-time-value').html(db + ' - ' + de);
                        $('.oil-value').html('<h2>' + res.Result + '</h2>');
                    }
                )
            }
        }
    };

    if (window.gmxCore) {
		window.gmxCore.addModule(pluginName, publicInterface, {
			css: 'AttributionMenu.css'
		});
	} else {
		window.nsGmx[pluginName] = publicInterface;
	}
})();
