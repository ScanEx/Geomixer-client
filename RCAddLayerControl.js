// Контрол для добавления в каталог растров новых слоёв. 
// Позволяет выбирать из существующих на сервере слоёв, слоёв внутри карты и создавать новый слой
nsGmx.RCAddLayerControl = function(map, layerName)
{
    var currRCName = '';
    var currAttrControl = null;
    var infoContainer = $('<div/>').css('margin-top', '5px');
    var InfoControl = function(container)
    {
        var curProcID = 0;
        var loaderImage = $('<img/>', {src: 'img/loader2.gif'}).hide();
        var statusContainer = $('<span/>', {'class': 'RCAdd-info-container'});
        var warningContainer = $('<span/>', {'class': 'RCAdd-warning-container'});
        
        container.append(loaderImage, statusContainer, warningContainer);
        
        this.startProcess = function()
        {
            loaderImage.show();
            return curProcID++;
        }
        
        this.doneProcess = function(message)
        {
            loaderImage.hide();
            $(statusContainer).empty().show().text(message).fadeOut(2000, 'easeInExpo');
        }
        
        this.failProcess = function(message)
        {
            //$(container).empty().show().text(message).fadeOut(2000, 'easeInExpo');
        }
        
        this.warning = function(message) {
            $(warningContainer).empty().show().text(message).fadeOut(2000, 'easeInExpo');
        }
    }
    var infoControl = new InfoControl(infoContainer);
    
    var LayersToAddWidget = function(parent) {
        var objsByLayer = {};
        var dataProvider = new scrollTable.StaticDataProvider();
        var table = new scrollTable();
        table.setDataProvider(dataProvider);
        
        table.createTable({
            parent: parent[0],
            name: 'objtoadd',
            fields: [_gtxt('Каталог Растров'), _gtxt('Растр'), ''],
            fieldsWidths: ['50%', '50%', '20px'],
            drawFunc: function(item) {
                var removeIcon = makeImageButton("img/recycle.png", "img/recycle_a.png");
                removeIcon.onclick = function() {
                    var identityField = item.layerprops.identityField;
                    var id = item.obj[identityField];
                    dataProvider.filterOriginalItems(function(addedItem) {
                        return addedItem.obj[identityField] !== id;
                    })
                }
                //либо однострочное имя, либо просто id
                var objname = item.layerprops.NameObject ? gmxAPI.applyTemplate(item.layerprops.NameObject, item.obj) : item.obj[item.layerprops.identityField];
                var tr = _tr([
                    _td([_t(item.layerprops.title)], [['dir', 'className', 'RCAdd-vis-td']]),
                    _td([_t(objname)],               [['dir', 'className', 'RCAdd-vis-td']]),
                    _td([removeIcon],                [['dir', 'className', 'RCAdd-vis-remove']])
                ])
                
                for (var i = 0; i < tr.childNodes.length; i++)
                    tr.childNodes[i].style.width = this._fields[i].width;
                    
                return tr;
            }
        })
        
        this.addObject = function(layerprops, obj) {
            objsByLayer[layerprops.name] = objsByLayer[layerprops.name] || {};
            objsByLayer[layerprops.name][obj[layerprops.identityField]] = true;
            dataProvider.addOriginalItem({layerprops: layerprops, obj: obj});
        }
        
        this.getObjects = function() {
            return dataProvider.getOriginalItems();
        }
        
        this.clear = function() {
            dataProvider.setOriginalItems([]);
            objsByLayer = {};
        }
        
        this.isExist = function(layerprops, obj) {
            return objsByLayer[layerprops.name] && objsByLayer[layerprops.name][obj[layerprops.identityField]];
        }
    }
    
    var id = map.layers[layerName].properties.name;
    var existLayerCanvas = $('<div/>', {id: 'existlayer' + id});
    var mapLayerCanvas   = $('<div/>', {id: 'maplayer' + id});
    var RCLayerCanvas    = $('<div/>', {id: 'rclayer' + id});
    var newLayerCanvas   = $('<div/>', {id: 'newlayer' + id}).css('height', '480px');
    var visLayerCanvas   = $('<div/>', {id: 'vislayer' + id});
    
    var tabMenu = _div([_ul([_li([_a([_t(_gtxt("Существующие слои"))],[['attr','href','#existlayer' + id]])]),
                             _li([_a([_t(_gtxt("Слои из карты"))],[['attr','href','#maplayer' + id]])]),
                             _li([_a([_t(_gtxt("Слои из КР"))],[['attr','href','#rclayer' + id]])]),
                             _li([_a([_t(_gtxt("Новый слой"))],[['attr','href','#newlayer' + id]])]),
                             _li([_a([_t(_gtxt("С экрана"))],[['attr','href','#vislayer' + id]])])
                            ])]);
        
    $(tabMenu).append(existLayerCanvas, newLayerCanvas, RCLayerCanvas, mapLayerCanvas, visLayerCanvas);
    var dialogCanvas = $('<div/>').append(tabMenu, infoContainer);
    
    var suggestLayersControl = new nsGmx.LayerManagerControl(existLayerCanvas, 'addimage', {
            fixType: 'raster', 
            enableDragging: false,
            onclick: function(clickContext) {
                infoControl.startProcess();
                _mapHelper.modifyObjectLayer(layerName, [{source: {layerName: clickContext.elem.name}}])
                    .done(function()
                    {
                        infoControl.doneProcess(_gtxt('Добавлен растр') + ' "' + clickContext.elem.title + '"');
                    })
            }
        });
        
    var RCLayerLayerCanvas = $('<div/>').appendTo(RCLayerCanvas);
    var RCLayerObjectCanvas = $('<div/>').appendTo(RCLayerCanvas).css({
        'border-top-width': '1px', 
        'border-top-style': 'solid',
        'border-top-color': '#216B9C'
    });
    
    var sizeProvider = function() {
        return {
            width: dialogCanvas[0].parentNode.parentNode.offsetWidth,
            height: dialogCanvas[0].parentNode.offsetHeight - RCLayerLayerCanvas[0].offsetHeight
        }
    }
    
    var RCLayersControl = new nsGmx.LayerManagerControl(RCLayerLayerCanvas, 'addrclayer', {
            fixType: 'catalog',
            enableDragging: false,
            height: 300,
            onclick: function(clickContext) {
                currRCName = clickContext.elem.name;
                currAttrControl = window._attrsTableHash.create(currRCName, RCLayerObjectCanvas[0], sizeProvider, {
                    hideActions: true,
                    onClick: function(elem) {
                        var idfield = currAttrControl.getLayerInfo().identityField;
                        var objid = elem.values[elem.fields[idfield].index];
                        
                        _mapHelper.modifyObjectLayer(layerName, [{source: {rc: currRCName, rcobj: objid}}]);
                    }
                });
            }
        });
        
    var newLayerProperties = {Title:'', Description: '', Date: '', TilePath: {Path:''}, ShapePath: {Path:''}};
    nsGmx.createLayerEditorProperties(null, 'Raster', newLayerCanvas[0], newLayerProperties, null,
        {
            addToMap: false, 
            doneCallback: function(task)
            {
                infoControl.startProcess();
                task.deferred.done(function(taskInfo)
                {
                    _mapHelper.modifyObjectLayer(layerName, [{source: {layerName: taskInfo.Result.properties.name}}])
                        .done(function()
                        {
                            infoControl.doneProcess(_gtxt('Добавлен растр') + ' "' + taskInfo.Result.properties.title + '"');
                        })
                })
            }
        }
    );
    
    var visLayersWidget = new LayersToAddWidget($('<div/>').appendTo(visLayerCanvas));
    var addVisLayersButton = makeLinkButton(_gtxt("Добавить выбранные растры"));
    addVisLayersButton.onclick = function() {
        infoControl.startProcess();
        var objs = $.map(visLayersWidget.getObjects(), function(item) {
            return {source: {rc: item.layerprops.name, rcobj: item.obj[item.layerprops.identityField] }}; 
        });
        _mapHelper.modifyObjectLayer(layerName, objs).done(function() {
            visLayersWidget.clear();
            infoControl.doneProcess(_gtxt('Добавлены растры') + ' (' + objs.length + ')');
        });
    }
    
    $(addVisLayersButton).appendTo(visLayerCanvas);
    
    var previewLayersTree = new layersTree({showVisibilityCheckbox: false, allowActive: true, allowDblClick: false});
    previewLayersTree.mapHelper = _mapHelper;
    
    var treeContainer = $('<div/>').css({'overflow-y': 'scroll', 'height': 400, 'margin-bottom': 10});
    
    var ul = previewLayersTree.drawTree(_layersTree.treeModel.getRawTree(), 2);
    $(ul).treeview().appendTo(treeContainer);
    
    var addMapButton = makeLinkButton(_gtxt("Добавить выбранные растры"));
    
    addMapButton.onclick = function()
    {
        var activeElem = previewLayersTree.getActive();
        if (!activeElem) return;
        
        var objectsToAdd = [];
        
        $(activeElem.parentNode).find("div[LayerID],div[MultiLayerID]").each(function()
        {
            var props = this.gmxProperties.content.properties;
            if (props.type === 'Raster' && props.LayerID)
                objectsToAdd.push({source: {layerName: props.name}});
        })
        
        if (objectsToAdd.length > 0)
        {
            infoControl.startProcess();
            _mapHelper.modifyObjectLayer(layerName, objectsToAdd)
                .done(function()
                {
                    infoControl.doneProcess(_gtxt('Добавлены растры') + ' (' + objectsToAdd.length + ')');
                })
        }
    }
    
    mapLayerCanvas.append(treeContainer, addMapButton);
    
    var listeners = [];
    var clearListeners = function() {
        for (var i = 0; i < listeners.length; i++) {
            var pt = listeners[i];
            var layer = globalFlashMap.layers[pt['layerName']];
            layer && layer.removeListener('onClick', pt['listenerId']);
        }
        listeners = [];
    }
    
    $(tabMenu).tabs({
        select: function(event, ui) {
            if (ui.index === 4) {
                listeners = [];
                for (var iL = 0; iL < globalFlashMap.layers.length; iL++)
                {
                    var layer = globalFlashMap.layers[iL];
                    if (layer.properties.type === 'Vector' && layer.properties.IsRasterCatalog)
                    {
                        var listenerId = layer.addListener('onClick', function(attr)
                        {
                            var obj = attr.obj;
                            var layer = obj.parent;
                            var id = obj.properties[layer.properties.identityField];
                            
                            if (!obj.properties['GMX_RasterLayerID']) {
                                infoControl.warning(_gtxt('Выбранный объект не имеет растра'));
                                return true;
                            }
                            
                            if (visLayersWidget.isExist(layer.properties, obj.properties)) {
                                infoControl.warning(_gtxt('Этот растр уже был выбран'));
                                return true;
                            }
                            
                            visLayersWidget.addObject(layer.properties, obj.properties);
                            return true;	// Отключить дальнейшую обработку события
                        });
                        listeners.push({layerName: layer.properties.name, listenerId: listenerId});
                    }
                }
            } else {
                clearListeners();
            }
        }
    });
    
    showDialog(_gtxt('Добавить снимки'), dialogCanvas[0], {
        width: 550, 
        height: 550, 
        resizeFunc: function() {
            currAttrControl && currAttrControl.resizeFunc();
        },
        closeFunc: function() {
            clearListeners();
        }
    });
}