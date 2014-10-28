(function() {

    _translationsHash.addtext("rus", {
        "WebglFilters.iconTitle" : "Показать/Скрыть контура векторных тайлов активного слоя"
    });
    _translationsHash.addtext("eng", {
        "WebglFilters.iconTitle" : "Show/Hide active vector layer tiles bounds"
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
                var menu = null;
                var testLayer = null;
                var cont = null;
                var mapListenerId = null;
                var toolContainer = new map.ToolsContainer('addObject', {style: {padding: '0px'}});
                var tool = toolContainer.addTool('addObject', {
                    hint: _gtxt('WebglFilters.iconTitle'),
                    regularStyle: {padding: '0px', display: 'list-item'},
                    activeStyle: {backgroundColor: 'red'},
                    regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
                    activeImageUrl:  _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage,
                    onClick: function() {
                        var canvas = fx.canvas();
                        var WebglFilters = L.gmx.WebglFilters;
                        var div = $('<div/>');
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
                            if (active && active[0] && active[0].parentNode.getAttribute("LayerID"))
                            {
                                var activeLayerName = active[0].parentNode.gmxProperties.content.properties.name;
                                var layer = gmxAPI.map.layers[activeLayerName];
                                var dateInterval = layer.getDateInterval();
                                out = gmxAPI.map.layers[activeLayerName];
                            } else if (params.DefaultLayerID) {
                                var blm = gmxAPI.map.baseLayersManager,
                                    layers = blm.getLayers(blm.getCurrentID());

                                if (layers && layers.length) {
                                    out = gmxAPI.mapNodes[layers[0].objectId];
                                }
                            }
                            
                            return out;
                        }
                        var testLayerID = null,
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
                    },
                    onCancel: function(){
                        if(menu && menu.workCanvas) menu.workCanvas.parentNode.removeNode(menu.workCanvas);
                        if(testLayer) testLayer.removeImageProcessingHook();
                        
                    }
                });
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