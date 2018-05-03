(function () {
    'use strict';

	window.nsGmx = window.nsGmx || {};

    let pluginName = 'domrf-plugin',
        publicInterface = {
            pluginName: pluginName,
            afterViewer: function (params, map) {
    			if (window.nsGmx) {
                    
                }
            }
    };

    if (window.gmxCore) {
		window.gmxCore.addModule(pluginName, publicInterface, {
			css: './domrfPlugin.css',
			init: function(module, path) {}
		});
	} else {
		window.nsGmx[pluginName] = publicInterface;
	}
})();
