'use strict';

(function () {
    'use strict';

    window.nsGmx = window.nsGmx || {};

    var pluginName = 'crisismap-validation-plugin';

    var publicInterface = {
        pluginName: pluginName,

        afterViewer: function afterViewer(params, map) {
            if (window.nsGmx) {
                if (params.layers) {
                    var layers = params.layers.split(', ');
                    for (var i = 0; i < layers.length; i++) {
                        var layer = nsGmx.gmxMap.layersByID[layers[i]];
                        layer.addPopupHook('toponyms', function (properties, div, node, hooksCount) {
                            var cleared = properties.toponyms.replace(/\\{3}/ig, ''),
                                parsed = JSON.parse(cleared),
                                toponyms = parsed.map(function (arr) {
                                    return arr[0];
                                }),
                                list = document.createElement('ul');
                                list.className = 'popup-validation-list'

                            toponyms.forEach(fillList);

                            div.appendChild(list);
                                console.log(toponyms);

                            function fillList(toponym) {
                                var elem = document.createElement('li');
                                elem.innerHTML = toponym;
                                list.appendChild(elem);
                            }
                        });
                    }
                }
            }
        }
    };

    if (window.gmxCore) {
        window.gmxCore.addModule(pluginName, publicInterface, {
            css: './css/main.css',
            init: function init(module, path) {}
        });
    } else {
        window.nsGmx[pluginName] = publicInterface;
    }
})();
