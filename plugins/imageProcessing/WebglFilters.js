(function() {

    _translationsHash.addtext("rus", {
        "WebglFilters.title" : "Включить/Выключить фильтры растров активного слоя"
    });
    _translationsHash.addtext("eng", {
        "WebglFilters.title" : "Show/Hide raster filters"
    });

    var publicInterface = {
        pluginName: 'WebglFilters',
        afterViewer: function(params, map) {
            var path = gmxCore.getModulePath('WebglFilters');
            var _params = $.extend({
                regularImage: 'standart.png',
                activeImage: 'active.png',
                layerName: null
            }, params);
            
            var layerName = _params.layerName;
            
            if ( !map) {
                return;
            }

            //var WebGLcanvas = null;

            var pluginLoaded = function() {
                var LMap = nsGmx.leafletMap,
                    layersByID = nsGmx.gmxMap.layersByID,
                    blm = LMap.gmxBaseLayersManager,
                    menu = null,
                    testLayer = null;
                
                var filtersIcon = new L.Control.gmxIcon({
                        id: 'filtersIcon', 
                        togglable: true,
                        className: 'leaflet-gmx-icon-sprite',
                        regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
                        activeImageUrl:  _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage,
                        title: _gtxt('WebglFilters.title')
                    }).on('statechange', function(ev) {
                        var control = ev.target,
                            testLayerID = null;
                        if (control.options.isActive) {
                            var canvas = fx.canvas(),
                                WebglFilters = L.gmx.WebglFilters,
                                div = $('<div/>');
                            var str = '<table id="properties">'
                                + '<tbody><tr>'
                                + '<th>Filter:</th>'
                                + '<td><select id="filters">'+WebglFilters.getFiltersOptions()+'</select></td>'
                                + '</tr><tr><th>Code:</th><td><code id="codeWebgl"></code>'
                                + '</td></tr></tbody></table>';
        
                            div.append(
                                $(str)
                            );
                            menu = new leftMenu();
                            menu.createWorkCanvas("WebglFiltersMenu", function(){});
                            _(menu.workCanvas, [div[0]], [['css', 'width', '100%']]);
                            WebglFilters.initFiltersSelector();

                            function getActiveLayer() {
                                var out = null;
                                var active = $(_queryMapLayers.treeCanvas).find(".active");
                                if (active && active[0] && active[0].parentNode.getAttribute("LayerID")) {
                                    var activeLayerName = active[0].parentNode.gmxProperties.content.properties.name;
                                    out = layersByID[activeLayerName];
                                } else {
                                    var layers = blm.get(blm.getCurrentID());
                                    if (layers && layers.length) {out = layers[0];}
                                }
                                return out;
                            }

                            testLayer = getActiveLayer();
                            if(testLayer) {
                                L.gmx.WebglFilters.callback = function() {
                                    testLayer.repaint();
                                };
                                testLayer.setImageProcessingHook(function(img, attrs) {
                                    var texture = canvas.texture(img);
                                    canvas.draw(texture);
                                    L.gmx.WebglFilters.code(canvas).update();
                                    var canvasOut = document.createElement('canvas');
                                    canvasOut.width = canvasOut.height = 256;
                                    var ctx = canvasOut.getContext('2d');
                                    ctx.drawImage(canvas, 0, 0);
                                    return canvasOut;
                                }, 'anonymous') ; 
                            }
                        } else {
                            if(menu && menu.workCanvas) menu.workCanvas.parentNode.removeNode(menu.workCanvas);
                            if(testLayer) testLayer.removeImageProcessingHook();
                        }
                    });
                LMap.addControl(filtersIcon);
            };
            gmxAPI.loadCSS(path + 'demo.css');
            var arr = [
                {src: path + 'glfx.js'}
                ,{src: path + 'demo.js'}
            ];
            if (arr.length) {
                var count = 0,
                    loadItem = function() {
                        gmxAPI.loadJS(arr.shift(), function(item) {
                            if (arr.length === 0) pluginLoaded();
                            else loadItem();
                        });
                    };
                loadItem();
            } else {
                pluginLoaded();
            }

        }
    };
    gmxCore.addModule('WebglFilters', publicInterface, {});
})();