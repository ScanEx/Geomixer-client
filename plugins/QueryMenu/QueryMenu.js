(function () {
    'use strict';

	window.nsGmx = window.nsGmx || {};

    window._translationsHash.addtext("rus", { queryMenuPlugin: {
        "set": "установить"
    }});

    window._translationsHash.addtext("eng", { queryMenuPlugin: {
        "set": "set"
    }});

    var pluginName = 'QueryMenu',
		homePath;

    var publicInterface = {
        pluginName: pluginName,

        afterViewer: function (params, map) {
            var arr = params.layers.split(', '),
                layers = [],
                dialogParams = $.extend({
                    width: 250,
                    height: 70,
                    posX: 454,
                    posY: 125
                }, params.dialog),
                template = window.Handlebars.compile('' +
                    '<span class="query-menu-title">{{title}}</span>' +
                    '<input class="query-menu-input" type="text"></input>' +
                    '<input class="query-menu-button" type="button" value={{i "queryMenuPlugin.set"}}></input>'
                ),
                root = document.createElement('div'),
                content = template({
                    title: params.title
                });

            for (var i = 0; i < arr.length; i++) {
                layers.push(nsGmx.gmxMap.layersByID[arr[i]]);
            };

            $(root).html(content);

            $('.query-menu-button', root).on('click', function (e) {

                var filter = params.query + $('.query-menu-input', root).val();
                for (var i = 0; i < layers.length; i++) {
                    var oldStyle = layers[i].getStyle(),
                        newStyle = $.extend(true, {}, oldStyle);

                    newStyle.Filter = filter;

                    layers[i].setStyle(newStyle);
                }
            });

            window.nsGmx.Utils.showDialog('', root, dialogParams);
        }
    };

    if (window.gmxCore) {
		window.gmxCore.addModule(pluginName, publicInterface, {
			css: 'QueryMenu.css'
		});
	} else {
		window.nsGmx[pluginName] = publicInterface;
	}
})();
