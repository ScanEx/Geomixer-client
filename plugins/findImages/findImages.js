(function() {
    var publicInterface = {
        pluginName: 'findImages',
        afterViewer: function(params, map) {
          
            if ( !map) {
                return;
            }
            
            var server2object = function(fields, values) {
                var item = {};
                var props = {};
                
                for (var j = 0, len1 = values.length; j < len1; j++)
                {
                    var fname = fields[j];
                    var it = values[j];
                    if (fname === 'geomixergeojson') {
                        item.geometry = gmxAPI.from_merc_geometry(it);
                    } else {
                        props[fname] = it;
                    }
                }
                
                item.properties = props;
                return item;
            }
            
            var layerNames = ['076EFE8A3D66461BBEC1234B006DE272', '378F08F3C00043528A70CE6878E7F487'];
            
            var selectedImagesLayer = map.addLayer({properties: {
                IsRasterCatalog: false,
                RCMinZoomForRasters: 1,
                title: 'Express Sales Results',
                styles: [{
                    RenderStyle: {outline: {color: 0x0000ff, thickness: 3}, fill: {opacity: 0}}
                }]
            }});
            
            layerNames.forEach(function(layerName) {
                map.layers[layerName].disableFlip();
                map.layers[layerName].addListener('onClick', function(event) {
                    if (!event.attr.ctrlKey) {
                        return;
                    }
                    gmxAPI.sendCrossDomainPostRequest(
                        'http://maps.kosmosnimki.ru/VectorLayer/Search.ashx',
                        {
                            WrapStyle: 'window',
                            pagesize: 1,
                            layer: layerName,
                            geometry: true,
                            query: '[ogc_fid]=' + event.obj.properties.ogc_fid
                            //,'columns': "[{'Value': '[ogc_fid]'}, {'Value':'[Name]'}]"
                        },
                        function(response) {
                            if (!parseResponse(response)) {
                                return;
                            }
                            
                            var newObj = server2object(response.Result.fields, response.Result.values[0]);
                            newObj.properties.ogc_fid = nsGmx.Utils.generateUniqueID();
                            selectedImagesLayer.addItems([newObj]);
                        }
                    )
                });
            })
            
            selectedImagesLayer.addListener('onClick', function(event) {
                if (!event.attr.ctrlKey) {
                        return;
                }
                selectedImagesLayer.removeItems([event.obj.properties.ogc_fid]);
            })

            var findImages = function() {
                layerNames.forEach(getLayerImages);
            }
            var getLayerImages = function(layerName) {
                var out = [];
                gmxAPI.sendCrossDomainPostRequest(
                    'http://maps.kosmosnimki.ru/VectorLayer/Search.ashx'
                    , {
                        'WrapStyle': 'window'
                        ,'count': 'add'
                        ,'pagesize': 1000
                        ,'layer': layerName			            // слой в котором ищем обьекты
                        ,'border': JSON.stringify(geo)	        // геометрия
                        ,'geometry': true
                        //,'columns': "[{'Value': '[ogc_fid]'}, {'Value':'[Name]'}]"
                    }
                    ,function(ph) {
                        var items = [];
                        var layer = map.layers[layerName];
                        
                        if (ph.Status == 'ok')
                        {
                            var fields = ph.Result.fields;
                            var arr = ph.Result.values;
                            for (var i = 0, len = arr.length; i < len; i++)
                            {
                                var item = server2object(fields, arr[i]);
                                item.properties.ogc_fid = nsGmx.Utils.generateUniqueID();
                                
                                items.push(item);
                            }
                            selectedImagesLayer.addItems(items);
                        } else if (ph.Status == 'error') {
                            console.log(ph.ErrorInfo.ErrorMessage);
                        }
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
            // var getSearchLayers = function(flag) {
                // var out = [];
                // for (var i = 0, len = map.layers.length; i < len; i++) {
                    // var layer = map.layers[i];
                    // if(!flag && !layer.isVisible) continue;
                    // if(layer.properties.Quicklook || layer.properties.IsRasterCatalog) {
                        // if(layer.properties.IsRasterCatalog) {
                            // // установка режима просмотра растров по onClick за пределами Мин. зум КР
                            // // аналог атрибута layer.properties['rasterView']
                            // // gmxAPI._cmdProxy('setAPIProperties', { 'obj': layer, 'attr':{'rasterView': 'onClick'} });
                        // }
                        // out.push(layer.properties.name);
                    // }
                // }
                // return out;
            // }
        }
    };
    gmxCore.addModule('findImages', publicInterface, {});
})();