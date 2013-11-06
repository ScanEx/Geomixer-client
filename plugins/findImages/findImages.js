(function() {
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
    
    var SceneCollection = function(layer, tableDataProvider) {
        
        this.add = function(items) {
            layer.addItems(items);
            tableDataProvider.addOriginalItems(items);
        }
        
        this.remove = function(itemID) {
            layer.removeItems([itemID]);
            tableDataProvider.filterOriginalItems(function(item) {
                return item.properties.ogc_fid !== itemID;
            });
        }
    }
            
    var publicInterface = {
        pluginName: 'findImages',
        afterViewer: function(params, map) {
          
            if ( !map) {
                return;
            }
            
            var layerNames = ['076EFE8A3D66461BBEC1234B006DE272', '378F08F3C00043528A70CE6878E7F487'];
            
            var selectedImagesLayer = map.addLayer({properties: {
                IsRasterCatalog: false,
                RCMinZoomForRasters: 8,
                title: 'Express Sales Results',
                styles: [{
                    RenderStyle: {outline: {color: 0xff8800, thickness: 3}, fill: {opacity: 0}}
                }]
            }});
            
            layerNames.forEach(function(layerName) {
                map.layers[layerName].disableFlip();
                map.layers[layerName].addListener('onClick', function(event) {
                    if (!event.attr.ctrlKey) {
                        return;
                    }
                    
                    //отправляем запрос на сервер, чтобы получить полную геометрию
                    gmxAPI.sendCrossDomainPostRequest(
                        'http://maps.kosmosnimki.ru/VectorLayer/Search.ashx',
                        {
                            WrapStyle: 'window',
                            pagesize: 1,
                            layer: layerName,
                            geometry: true,
                            query: '[ogc_fid]=' + event.obj.properties.ogc_fid
                        },
                        function(response) {
                            if (!parseResponse(response)) {
                                return;
                            }
                            
                            var newObj = server2object(response.Result.fields, response.Result.values[0]);
                            newObj.properties.ogc_fid = nsGmx.Utils.generateUniqueID();
                            sceneCollection.add([newObj]);
                        }
                    )
                });
            })
            
            selectedImagesLayer.addListener('onClick', function(event) {
                if (!event.attr.ctrlKey) {
                        return;
                }
                sceneCollection.remove(event.obj.properties.ogc_fid);
            })

            // var findImages = function(geometry) {
                // layerNames.forEach(function(layerName) {
                    // getLayerImages();
                // })
            // }
            
            var getLayerImages = function(layerName, geometry) {
                var out = [];
                gmxAPI.sendCrossDomainPostRequest(
                    'http://maps.kosmosnimki.ru/VectorLayer/Search.ashx'
                    , {
                        'WrapStyle': 'window'
                        ,'count': 'add'
                        ,'pagesize': 1000
                        ,'layer': layerName
                        ,'border': JSON.stringify(gmxAPI.merc_geometry(geometry))
                        ,'geometry': true
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
                            sceneCollection.add(items);
                        } else if (ph.Status == 'error') {
                            console.log(ph.ErrorInfo.ErrorMessage);
                        }
                    }
                );
                return out;
            }

            // var toolContainer = new map.ToolsContainer('findImages', {notSticky:1});
            // var tool = toolContainer.addTool('findImages', {
                // hint: 'Найти снимки'
                // ,onClick: findImages
                // ,onCancel: null
            // });
            // toolContainer.setVisible(false);
            
            //var geo = null;
            
            // var selectDrawingObject = function() {
                // geo = null;
				// map.drawing.forEachObject(function(o) { geo = gmxAPI.merc_geometry(o.geometry); });
                // toolContainer.setVisible( geo ? true : false);
            // }
            
            // map.drawing.addListener('onRemove', function() {
                // setTimeout(selectDrawingObject, 0);
            // });
            
            // map.drawing.addListener('onFinish', function(params) {
                // geo = gmxAPI.merc_geometry(params.geometry);
                // toolContainer.setVisible(true);
            // });
            
            var canvas = $('<div/>').css('height', '220px');
            
            var menu = new leftMenu();
            menu.createWorkCanvas("aisdnd", function(){});
            _(menu.workCanvas, [canvas[0]], [['css', 'width', '100%']]);
            
            var addScenesBtn = $('<span class="buttonLink">Добавить сцены по объектам</span>').click(function() {
                layerNames.forEach(function(layerName) {
                    map.drawing.forEachObject(function(obj) {
                        getLayerImages(layerName, obj.geometry);
                    })
                })
            }).appendTo(canvas);
            
            var scenesDiv = $('<div/>').appendTo(canvas);
            var ScrollTable = gmxCore.getModule("ScrollTableControl").ScrollTable;
            var sceneTable = new ScrollTable({height: 170});
            var dataProvider = new ScrollTable.StaticDataProvider();
            sceneTable.setDataProvider(dataProvider);
            sceneTable.createTable({
                parent: scenesDiv[0],
                name: 'sales_scene_list',
                fields: ['ID'],
                fieldsWidths: ['100%'],
                drawFunc: function(item) {
                    return $('<tr><td>' + item.properties.Name + '</td></tr>')[0];
                }
            });
            
            var sceneCollection = new SceneCollection(selectedImagesLayer, dataProvider);
        }
    };
    gmxCore.addModule('findImages', publicInterface, {});
})();