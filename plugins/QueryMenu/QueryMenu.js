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
            var arr = params.layers && params.layers.split(', '),
                layers = [],
                dialogParams = $.extend({
                    dialogClass: "query-menu-dialog",
                    width: 235,
                    height: 36,
                    position: [454, 124]
                }, params.dialog),
                template = window.Handlebars.compile('' +
                    '<div class="query-menu-container">' +
                        '<span class="query-menu-title">{{title}}</span>' +
                        '<input class="query-menu-input" type="text"></input>' +
                        '<input class="query-menu-button" type="button" value={{i "queryMenuPlugin.set"}}></input>' +
                    '</div>'
                ),
                root = document.createElement('div'),
                content = template({
                    title: params.title
                });

            if (arr) {
                for (var i = 0; i < arr.length; i++) {
                    layers.push(nsGmx.gmxMap.layersByID[arr[i]]);
                };
            }


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
            $(root).dialog(dialogParams);
            // window.nsGmx.Utils.showDialog('', root, dialogParams);
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
