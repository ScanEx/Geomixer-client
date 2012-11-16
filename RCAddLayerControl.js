nsGmx.RCAddLayerControl = function(map, layerName)
{
    var infoContainer = $('<div/>');
    var InfoControl = function(container)
    {
        var curProcID = 0;
        var loaderImage = $('<img/>', {src: 'img/loader2.gif'}).hide();
        var statusContainer = $('<span/>', {'class': 'RCAdd-info-container'});
        
        container.append(loaderImage, statusContainer);
        
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
    }
    var infoControl = new InfoControl(infoContainer);
    var id = map.layers[layerName].properties.name;
    
    var existLayerCanvas = $('<div/>', {id: 'existlayer' + id});
    var newLayerCanvas   = $('<div/>', {id: 'newlayer' + id});
    var mapLayerCanvas   = $('<div/>', {id: 'maplayer' + id});
    
    var tabMenu = _div([_ul([_li([_a([_t("Существующие слои")],[['attr','href','#existlayer' + id]])]),
                             _li([_a([_t("Слои из карты")],[['attr','href','#maplayer' + id]])]),
                             _li([_a([_t("Новый слой")],[['attr','href','#newlayer' + id]])])
                            ])]);
        
    $(tabMenu).append(existLayerCanvas, newLayerCanvas, mapLayerCanvas);
    var dialogCanvas = $('<div/>').append(tabMenu, infoContainer);
    
    var suggestLayersControl = new nsGmx.LayerManagerControl(existLayerCanvas, 'addimage', {
            fixType: 'raster', 
            enableDragging: false,
            onclick: function(clickContext) {
                infoControl.startProcess();
                _mapHelper.modifyObjectLayer(layerName, [{properties: {GM_LayerName: clickContext.elem.name}}])
                    .done(function()
                    {
                        infoControl.doneProcess('Добавлен слой' + ' "' + clickContext.elem.title + '"');
                    })
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
                    _mapHelper.modifyObjectLayer(layerName, [{properties: {GM_LayerName: taskInfo.Result.properties.name}}])
                        .done(function()
                        {
                            infoControl.doneProcess('Добавлен слой' + ' "' + taskInfo.Result.properties.title + '"');
                        })
                })
            }
        }
    );
    
    var previewLayersTree = new layersTree({showVisibilityCheckbox: false, allowActive: true, allowDblClick: false});
    previewLayersTree.mapHelper = _mapHelper;
    
    var treeContainer = $('<div/>').css({'overflow-y': 'scroll', 'height': 400, 'margin-bottom': 10});
    
    var ul = previewLayersTree.drawTree(_layersTree.treeModel.getRawTree(), 2);
    $(ul).treeview().appendTo(treeContainer);
    
    var addButton = makeLinkButton("Добавить выбранные слои");
    
    addButton.onclick = function()
    {
        var activeElem = previewLayersTree.getActive();
        if (!activeElem) return;
        
        var objectsToAdd = [];
        
        $(activeElem.parentNode).find("div[LayerID],div[MultiLayerID]").each(function()
        {
            var props = this.gmxProperties.content.properties;
            if (props.type === 'Raster' && props.LayerID)
                objectsToAdd.push({properties: {GM_LayerName: props.name}});
        })
        
        if (objectsToAdd.length > 0)
        {
            infoControl.startProcess();
            _mapHelper.modifyObjectLayer(layerName, objectsToAdd)
                .done(function()
                {
                    infoControl.doneProcess('Добавлены новые слои (' + objectsToAdd.length + ')');
                })
        }
    }
    
    mapLayerCanvas.append(treeContainer, addButton);
    
    $(tabMenu).tabs();
    
    showDialog('Выбирите снимок', dialogCanvas[0], {width: 550, height: 550});
}