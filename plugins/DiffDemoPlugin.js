(function(){
    var DiffManager = function(map, layerName, container)
    {
        var SEPARATOR = ';';
        var _images = null;
        var _layer = map.layers[layerName];
        var _this = this;
        
        var mainQuery = '';
        var refQuery = '';
        
        var mainIDs = [];
        var refIDs = [];
        
        var isMainActive = true;
        
        var mainImageContainer = $('<div/>').appendTo(container);
        var refImageContainer = $('<div/>').appendTo(container);
        
        _layer.addListener('onClick', function()
        {
            if (mainQuery == '' || refQuery == '')
                return;
                
            isMainActive = !isMainActive;
            updateLayerVisibility();
            
            return true;
        }, 1000);
        
        var updateLayerVisibility = function()
        {
            _layer.setVisibilityFilter(isMainActive ? mainQuery : refQuery);
            mainImageContainer.toggleClass('diff-info-active', isMainActive);
            refImageContainer.toggleClass('diff-info-active', !isMainActive);
        }
        
        var drawInfoRow = function(sceneid, container)
        {
            if (_images[sceneid])
            {
                container.append($('<div/>')
                    .append($('<span/>').text(_images[sceneid].sceneid + " (" + _images[sceneid].acqdate + ")"))
                    .append($('<span/>', {'class': 'diff-info-link'})
                        .text('i')
                        .click(function()
                        {
                            nsGmx.Controls.showLayerInfo({properties: {title: sceneid}}, {properties: _images[sceneid]});
                        })
                    )
                )
            }
        }
        
        this.deferred = $.Deferred();
        this.setDiff = function(mainImagesStr, refImagesStr, comment)
        {
            this.deferred.done(function()
            {
                mainImageContainer.empty();
                
                if (!mainImagesStr)
                {
                    mainQuery = refQuery = '';
                    return;
                }
                var mainImages = $.map(mainImagesStr.split(SEPARATOR), $.trim);
                var refImages  = $.map(refImagesStr.split(SEPARATOR),  $.trim);
               
                mainImageContainer.append($('<div/>', {'class': 'diff-info-header'}).text('Базовые снимки:'));
                
                mainQuery = $.map(mainImages, function(sceneid) {
                    drawInfoRow(sceneid, mainImageContainer);
                    return '"sceneid"=\'' + sceneid + '\'';
                }).join(' OR ');
               
                refImageContainer.empty().append($('<div/>', {'class': 'diff-info-header'}).text('Референсные снимки:'));
                refQuery = $.map(refImages, function(sceneid) {
                    drawInfoRow(sceneid, refImageContainer);
                    return '"sceneid"=\'' + sceneid + '\'';
                }).join(' OR ');
                
                updateLayerVisibility();
            })
        }
        
        _layer.getFeatures(function(features) {
            _images = {};
            $.each(features, function(i, f) {
                _images[f.properties.sceneid] = f.properties;
            })
            _this.deferred.resolve();
        })
    }
    
    var g_diffLayerNames = [];
    var g_instance = null;
    
    var DiffDemoPlugin = function(canvas, map) {
        var filterContainer = $('<div/>', {'class': 'diff-filter-container'}).appendTo(canvas);
        var filterCheckbox = $('<input\>', {type: 'checkbox', id: 'diff-filter-checkbox', 'class': 'diff-filter-checkbox'})
            .appendTo(filterContainer)
            .click(function()
            {
                nsGmx.timelineControl.updateFilters();
            });
            
        var filterLable = $('<label/>', {'for': 'diff-filter-checkbox'}).text('Только референсные снимки').appendTo(filterContainer);
        
        var selectedContainer = $('<div/>').appendTo(canvas);
        
        nsGmx.timelineControl.data.on('change:selection', function()
        {
            selectedContainer.show();
            infoContainer.hide();
            
            diffManager.setDiff();
            selectedContainer.empty();
            var selection = nsGmx.timelineControl.data.get('selection');
            var items = nsGmx.timelineControl.data.get('items');
            
            $.each(selection, function(layerName, layerIDs) {
                $.each(layerIDs, function(i, id) {
                    var obj = items[layerName][id].obj;
                    selectedContainer.append($('<div/>').append(
                        $('<span/>').text(obj.properties.acqdate + (obj.properties.sceneid ? ' (' + obj.properties.sceneid + ')' : '')),
                        $('<span/>', {'class': 'diff-info-link'})
                            .text('i')
                            .click(function()
                            {
                                nsGmx.Controls.showLayerInfo({properties: {title: obj.properties.sceneid}}, obj);
                            })
                    ))
                });
            });
        })
        
        nsGmx.timelineControl.addFilter(function(obj)
        {
            return !filterCheckbox[0].checked || !!obj.properties.isReference;
        })
        
        // var diffLayerNames = [
            // '40FA9DB23E2B4AB7A1E6F0629E4C7DED',
            // '52ED8C885BE44C26B60E94EA693AE78C',
            // '7D14D41850A94B5BB7E14BA9F8F0CDFF',
            // 'ABA3288DCEAE49B183F79A645332469C',
            // '316EEF5D7BDD4611B0A85FA530B52B8B',
            // 'A31E7BB451BF4FB298D1A24156AE0000',
            // 'E9E73B2FAC484B1EA792B69B4C719FE5',
            // 'AB245405E5C64548944BE3AD691C23BE'
        // ];
        
        var imagesLayerName = '7FAD43F636AC4A0E8A39327F54CE68D6';
        map.layers[imagesLayerName].setStyle({fill: {opacity: 0}});
        map.layers[imagesLayerName].setSortItems(function(a, b) {
            return a.properties.acqdate > b.properties.acqdate ? 1 : -1;
        })
        
        nsGmx.timelineControl.setMapMode('selected');
        nsGmx.timelineControl.bindLayer(imagesLayerName);
        
        var infoContainer = $('<div/>').appendTo(canvas);
        var diffManager = new DiffManager(map, imagesLayerName, infoContainer);
        
        var findImagesByID = function(mainImage, refImage)
        {
            var res = {};
            nsGmx.timelineControl.eachItem(imagesLayerName, function(objID, item)
            {
                if (item.obj.properties.GMX_RasterCatalogID === mainImage)
                    res.mainProps = item.obj.properties;
                    
                if (item.obj.properties.GMX_RasterCatalogID === refImage)
                    res.refProps = item.obj.properties;
            })
            
            return res;
        }
        
        this.bindDiffEvents = function() {
            for (var k = 0; k < g_diffLayerNames.length; k++) {
                map.layers[g_diffLayerNames[k]] && map.layers[g_diffLayerNames[k]].addListener('onClick', function(event)
                {
                    selectedContainer.hide();
                    infoContainer.show();
                    
                    var props = event.obj.properties;
                    diffManager.setDiff(props.mainimage, props.refimage, props.comment);
                })
            }
        }
        
        this.bindDiffEvents();
        
        $('#flash').bind('keydown', function(event) {
        
            if (event.keyCode !== 32) {
                return;
            }
            
            for (var k = 0; k < g_diffLayerNames.length; k++) {
                map.layers[g_diffLayerNames[k]].setVisible(false);
            }
        })
        
        $('#flash').bind('keyup', function(event) {
            if (event.keyCode !== 32) {
                return;
            }
            
            for (var k = 0; k < g_diffLayerNames.length; k++) {
                map.layers[g_diffLayerNames[k]].setVisible(true);
            }
        })
    }
    
    gmxCore.addModule('DiffDemoPlugin', {
        pluginName: 'DiffDemoPlugin',
        setDiffLayerNames: function(layerNames) {
            g_diffLayerNames = layerNames;
            g_instance && g_instance.bindDiffEvents();
        },
        afterViewer: function(params, map)
        {
            var canvas = $('<div/>').css('height', '200px');
            var menu = new leftMenu();
            menu.createWorkCanvas("monitoring", function(){});
            _(menu.workCanvas, [canvas[0]], [['css', 'width', '100%']]);

            g_instance = new DiffDemoPlugin(canvas, map);
        }
    }, 
    {
        css: 'DiffDemoPlugin.css'
    })

})();