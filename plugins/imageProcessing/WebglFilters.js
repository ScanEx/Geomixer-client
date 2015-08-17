(function() {

    _translationsHash.addtext('rus', {
        'WebglFilters.title' : 'Включить/Выключить фильтры растров активного слоя'
    });
    _translationsHash.addtext('eng', {
        'WebglFilters.title' : 'Show/Hide raster filters'
    });

    var publicInterface = {
        pluginName: 'WebglFilters',
        afterViewer: function(params, lmap) {
            var path = gmxCore.getModulePath('WebglFilters');
            var _params = $.extend({
                regularImage: 'standart.png',
                activeImage: 'active.png'
            }, params);
            
            var layersByID = nsGmx.gmxMap.layersByID,
                blm = lmap.gmxBaseLayersManager,
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
                        menu.createWorkCanvas('WebglFiltersMenu', function(){});
                        _(menu.workCanvas, [div[0]], [['css', 'width', '100%']]);
                        WebglFilters.initFiltersSelector();

                        function getActiveLayer() {
                            var out = null;
                            var active = $(_queryMapLayers.treeCanvas).find('.active');
                            if (active && active[0] && active[0].parentNode.getAttribute('LayerID')) {
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
                            testLayer.setRasterHook(function(dstCanvas, srcImage, sx, sy, sw, sh, dx, dy, dw, dh, info) {
                                var texture = canvas.texture(srcImage);
                                canvas.draw(texture);
                                L.gmx.WebglFilters.code(canvas).update();
                                var ptx = dstCanvas.getContext('2d');
                                ptx.drawImage(canvas, sx, sy, sw, sh, dx, dy, dw, dh);
                            }); 
                        }
                    } else {
                        if(menu && menu.workCanvas) menu.workCanvas.parentNode.removeNode(menu.workCanvas);
                        if(testLayer) testLayer.removeImageProcessingHook();
                    }
                });
            lmap.addControl(filtersIcon);
        }
    };
    gmxCore.addModule('WebglFilters', publicInterface, {
        init: function (module, path) {
            return $.when(
                gmxCore.loadScript(path + 'glfx.js'),
                gmxCore.loadScript(path + 'demo.js')
            );
        },
        css: 'demo.css'
    });
})();