!(function() {
    var pluginName = 'WebglFilters',
		lang = window.language,
		localeHash = {
			rus: {
				title: 'Вкл/Выкл фильтры растров активного слоя'
			},
			eng: {
				title: 'Show/Hide raster filters'
			}
		},
		getTxt = function(key) {
			var arr = key.split('.');
			return localeHash[lang][arr[arr.length - 1]] || '';
		};

    var publicInterface = {
        pluginName: pluginName,
        afterViewer: function(params, lmap) {
            var path = gmxCore.getModulePath(pluginName);
            var _params = L.extend({
                regularImage: 'standart.png',
                activeImage: 'active.png'
            }, params);
            
            var layersByID = nsGmx.gmxMap.layersByID,
                blm = lmap.gmxBaseLayersManager,
                menu = null,
                testLayer = null,
				isActive = false,
				webglFilters = L.gmx.WebglFilters,
				canvas = fx.canvas(),
				getActiveLayer = function() {
					var out = null,
						active = window._queryMapLayers.treeCanvas.querySelector('.active');
					if (active && active.parentNode.getAttribute('LayerID')) {
						var activeLayerId = active.parentNode.gmxProperties.content.properties.name;
						out = layersByID[activeLayerId];
					} else {
						var layers = blm.get(blm.getCurrentID());
						if (layers && layers.length) { out = layers[0]; }
					}
					return out;
				},
				clearWebglFilters = function() {
					if(menu && menu.workCanvas) menu.workCanvas.parentNode.removeNode(menu.workCanvas);
					if(testLayer) testLayer.removeRasterHook();
				},
				addWebglFilters = function(gmxLayer) {
					gmxLayer._gmx.crossOrigin = 'use-credentials';
					webglFilters.callback = function() {
						gmxLayer.repaint();
					};
					gmxLayer.setRasterHook(function(dstCanvas, srcImage, sx, sy, sw, sh, dx, dy, dw, dh, info) {
						try {
							var texture = canvas.texture(srcImage);
						} catch(ev) {
							// console.log(ev);
							return;
						}
						canvas.draw(texture);
						webglFilters.code(canvas).update();
						var ptx = dstCanvas.getContext('2d');
						ptx.drawImage(canvas, sx, sy, sw, sh, dx, dy, dw, dh);
					});
					gmxLayer.repaint();
				};
			$(window._layersTree).on('activeNodeChange', function() {
				// console.log('triggered', arguments)
				if (isActive) {
					if(testLayer) {
						testLayer.removeRasterHook();
					}
					testLayer = getActiveLayer();
					if(testLayer) {
						addWebglFilters(testLayer);
					}
				}
			});
            
            lmap.addControl(L.control.gmxIcon({
                    id: 'filtersIcon', 
                    togglable: true,
                    className: 'leaflet-gmx-icon-sprite',
                    regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
                    activeImageUrl:  _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage,
                    title: getTxt('title')
                }).on('statechange', function(ev) {
					isActive = ev.target.options.isActive;
                    if (isActive) {
                        menu = new window.leftMenu();
                        menu.createWorkCanvas(pluginName + 'Menu', function(){});
                        var div = L.DomUtil.create('div', pluginName, menu.workCanvas);
                        div.innerHTML = '<table class="properties">'
                            + '<tbody><tr>'
                            + '<th>Filter:</th>'
                            + '<td><select class="filters">' + webglFilters.getFiltersOptions() + '</select>&nbsp;&nbsp;&nbsp;<input type="checkbox" checked /> - вкл/выкл</td>'
                            + '</tr><tr><th>Code:</th><td><code class="codeWebgl"></code>'
                            + '</td></tr></tbody></table>';
    
						L.DomEvent.on(div.querySelector('input'), 'change', function (ev) {
							if(testLayer) {
								if (ev.target.checked) {
									addWebglFilters(testLayer);
								} else {
									testLayer.removeRasterHook();
								}
							}
						}, this);
						webglFilters.initFiltersSelector();

                        testLayer = getActiveLayer();
						
                        if(testLayer) {
							addWebglFilters(testLayer);
                        }
                    } else {
                        clearWebglFilters();
                    }
                })
			);
        }
    };
    gmxCore.addModule(pluginName, publicInterface, {
        init: function (module, path) {
            return $.when(
                gmxCore.loadScript(path + 'glfx.js'),
                gmxCore.loadScript(path + 'demo.js')
            );
        },
        css: 'demo.css'
    });
})();
