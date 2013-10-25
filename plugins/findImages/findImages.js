(function() {
    var publicInterface = {
        pluginName: 'findImages',
        afterViewer: function(params, map) {
            var path = gmxCore.getModulePath('findImages');
            var _params = $.extend({
                regularImage: 'ship.png',
                activeImage: 'active.png',
                layerName: null
            }, params);
            
            var layerName = _params.layerName;
            
            if ( !map) {
                return;
            }
            var canvas = $('<div/>');
            var imagesContainer = $('<div/>').appendTo(canvas);
            imagesContainer.show();
            var menu = new leftMenu();
            menu.createWorkCanvas("monitoring", function(){});
            _(menu.workCanvas, canvas, [['css', 'width', '100%']]);

            var findImages = function() {
                imagesContainer.empty();
                var layers = getSearchLayers();
                for (var i = 0, len = layers.length; i < len; i++) {
                    getLayerImages(layers[i]);
                }
            }
            var getLayerImages = function(layerID) {
                var out = [];
                gmxAPI.sendCrossDomainPostRequest(
                    'http://maps.kosmosnimki.ru/VectorLayer/Search.ashx'
                    , {
                        'WrapStyle': 'window'
                        ,'count': 'add'
                        ,'pagesize': 500
                        ,'layer': layerID			            // слой в котором ищем обьекты
                        ,'border': JSON.stringify(geo)	        // геометрия
                    }
                    ,function(ph) {
console.log('asasasas' , ph);
                        var markers = [];
                        var mmsiHash = {};
                        var ret = [];
                        var layer = map.layers[layerID];
                        (function() {
                            if (ph.Status == 'ok')
                            {
                                imagesContainer.append($('<div/>') .text('Слой - ' + layer.properties.title));
                                var fields = ph.Result.fields;
                                var arr = ph.Result.values;
                                for (var i = 0, len = arr.length; i < len; i++)
                                {
                                    var req = arr[i];
                                    var item = {};
                                    var prop = {};
                                    for (var j = 0, len1 = req.length; j < len1; j++)
                                    {
                                        var fname = fields[j];
                                        var it = req[j];
                                        if (fname === 'geomixergeojson') {
                                            item.geometry = gmxAPI.from_merc_geometry(it);
                                        } else {
                                            prop[fname] = it;
                                        }
                                    }
                                    ret.push(prop['ogc_fid']);
                                        var image = prop['Name'];
                                        var ogc_fid = prop['ogc_fid'];
                                        imagesContainer.append($('<div/>').append(
                                            $('<span/>')
                                                .css('cursor', 'pointer')
                                                .css('color', 'red')
                                                .text(' ' + image)
                                                .click(function()
                                                {
                                                    console.log('обьект', ogc_fid, image, layer);
                                                })
                                        ));
                                    
                                }
                                layer.setRasterViewItems(ret);
                            } else if (ph.Status == 'error') {
                                console.log(ph.ErrorInfo.ErrorMessage);
                            }
                        })();
                    }
                );
                return out;
            }

            var toolContainer = new map.ToolsContainer('findImages', {notSticky:1});
            var tool = toolContainer.addTool('findImages', {
                hint: 'Найти снимки'
                ,onClick: findImages
                ,onCancel: null
            });
            toolContainer.setVisible(false);
                
            var geo = null;
            var selectDrawingObject = function() {
                geo = null;
				map.drawing.forEachObject(function(o) { geo = gmxAPI.merc_geometry(o.geometry); });
                toolContainer.setVisible( geo ? true : false);
            }
            map.drawing.addListener('onRemove', function() {
                setTimeout(selectDrawingObject, 0);
            });
            map.drawing.addListener('onFinish', function(params) {
                geo = gmxAPI.merc_geometry(params.geometry);
                toolContainer.setVisible(true);
            });
            var getSearchLayers = function(flag) {
                var out = [];
                for (var i = 0, len = map.layers.length; i < len; i++) {
                    var layer = map.layers[i];
                    if(!flag && !layer.isVisible) continue;
                    if(layer.properties.Quicklook) {
                        out.push(layer.properties.name);
                    }
                }
                return out;
            }
        }
    };
    gmxCore.addModule('findImages', publicInterface, {});
})();