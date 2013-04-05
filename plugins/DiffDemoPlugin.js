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
    
    gmxCore.addModule('DiffDemoPlugin', {
        pluginName: 'DiffDemoPlugin',
        afterViewer: function(params, map)
        {
            var canvas = $('<div/>').css('height', '200px');
            var menu = new leftMenu();
            menu.createWorkCanvas("monitoring", function(){});
            _(menu.workCanvas, [canvas[0]], [['css', 'width', '100%']]);

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
            //$(nsGmx.timelineControl).bind('select', function(event, params)
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
                
                // $.each(selection, function(i, obj)
                // {
                    // selectedContainer.append($('<div/>').append(
                        // $('<span/>').text(obj.properties.acqdate + (obj.properties.sceneid ? ' (' + obj.properties.sceneid + ')' : '')),
                        // $('<span/>', {'class': 'diff-info-link'})
                            // .text('i')
                            // .click(function()
                            // {
                                // nsGmx.Controls.showLayerInfo({properties: {title: obj.properties.sceneid}}, obj);
                            // })
                    // ))
                // })
            })
            
            nsGmx.timelineControl.addFilter(function(obj)
            {
                return !filterCheckbox[0].checked || !!obj.properties.isReference;
            })
            
            // var diffLayerName = 'B25D21207AD14009882D1396C517B101';
            var diffLayerName = '74A7BB2DF9A34F0C940D929A57D51D47';
            var imagesLayerName = '7237E7DF4DCC40788FFE363D3CC7FBFA';
            map.layers[imagesLayerName].setStyle({fill: {opacity: 0}});
            
            
            nsGmx.timelineControl.bindLayer(imagesLayerName);
            
            var infoContainer = $('<div/>').appendTo(canvas);
            var diffManager = new DiffManager(map, imagesLayerName, infoContainer);
            
            var findImagesByID = function(mainImage, refImage)
            {
                var res = {};
                nsGmx.timelineControl.eachItem(imagesLayerName, function(objID, item)
                {
                    if (item.obj.properties.GM_LayerName === mainImage)
                        res.mainProps = item.obj.properties;
                        
                    if (item.obj.properties.GM_LayerName === refImage)
                        res.refProps = item.obj.properties;
                })
                
                return res;
            }
            
            // var constructImageDescr = function(properties)
            // {
                // var t = [];
                // //properties.platform && t.push(properties.platform);
                // properties.sceneid && t.push(properties.sceneid);
                
                // var descr = " (" + t.join(', ') + ")";
                
                // return properties.acqdate + (t.length ? descr : "");
            // }

            // map.layers[diffLayerName].enableHoverBalloon(function(obj, div)
                // {
                    // var props = obj.properties;
                    // var images = findImagesByID(props.MainImage, props.RefImage);
                    
                    // $(div).css('white-space', 'nowrap').append(
                        // $('<div/>').text('Основной снимок: ' + constructImageDescr(images.mainProps)),
                        // $('<div/>').text('Базовый снимок: ' + constructImageDescr(images.refProps)),
                        // $('<div/>').text('Комментарий: ' + props['Comment'])
                    // )
                    
                    // return {};
                // }, 
                // {disableOnMouseOver: true}
            // )
            
            map.layers[diffLayerName].addListener('onClick', function(event)
            {
                selectedContainer.hide();
                infoContainer.show();
                
                var props = event.obj.properties;
                diffManager.setDiff(props.mainimage, props.refimage, props.comment);
            })
        }
    }, 
    {
        css: 'DiffDemoPlugin.css'/*,
        require: ['TimelineRCPlugin']*/
    })

})();