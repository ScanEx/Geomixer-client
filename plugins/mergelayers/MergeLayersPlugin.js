(function ($){
    
nsGmx.Translations.addText("rus", {
    MergeLayersPlugin: {
        menuTitle : 'Объединить слои'
    }
});

nsGmx.Translations.addText("eng", {
    MergeLayersPlugin: {
        menuTitle:  'MergeLayers'
    }
});

var template = Handlebars.compile('<div class="mergeLayers-container">' +
    '<div class="mergeLayers-controls">' +
        '<span>Выбрано слоёв: </span>' +
        '<span class="mergeLayers-count">0</span>' +
        '<button class="mergeLayers-merge">Объединить</button>' +
    '</div>' +
    '<div class="mergeLayers-name-container">' +
        '<span>Название нового слоя: </span>' +
        '<input class="inputStyle mergeLayers-name" value="merge result">' +
    '</div>' +
    '<div class="mergeLayers-info">Выберите слои для объединения</div>' +
    '<div class="mergeLayers-tree"></div>' +
'</div>');

var publicInterface = {
    pluginName: 'Merge Layers Plugin',
    afterViewer: function(params, map) {
        _menuUp.addChildItem({
            id: 'mergeLayers', 
            title:_gtxt('MergeLayersPlugin.menuTitle'), 
            func: function() {
                var menu = new leftMenu();
                menu.createWorkCanvas("mergelayers", {
                    path: ['Объединение слоёв карты'],
                    closeFunc: function() {
                        _menuUp.checkItem('mergeLayers', false);
                    }
                });
                _menuUp.checkItem('mergeLayers', true);
                
                //формируем новое дерево - без невекторных слоёв и пустых папок
                var searchRawTree = new nsGmx.LayersTree(_layersTree.treeModel.cloneRawTree(function(node) {
                    var props = node.content.properties;
                        props.visible = false;
                    if (node.type === 'layer') {
                        return props.type === 'Vector' && node;
                    } else {
                        props.ShowCheckbox = true;
                        props.list = false;
                        props.expanded = false;
                        return node.content.children.length > 0 && node;
                    }
                }));
                
                var ui = $(template());
                
                var selectedCount = 0;
                var countPlaceholder = ui.find('.mergeLayers-count');
                var mapLayersTree = new layersTree({
                    showVisibilityCheckbox: true, 
                    allowActive: false, 
                    allowDblClick: false, 
                    showStyle: false,
                    visibilityFunc: function(props, isVisible) {
                        selectedCount += isVisible ? 1 : -1;
                        countPlaceholder.text(selectedCount);
                    }
                });
                
                ui.find('.mergeLayers-merge').click(function() {
                    nsGmx.widgets.notifications.startAction('mergeLayers');
                    var promises = [];
                    searchRawTree.forEachLayer(function(layer, isVisible) {
                        if (!isVisible) {return;}
                        
                        promises.push(_mapHelper.searchObjectLayer(layer.properties.name, {includeGeometry: true}).then(function(objects) {
                            console.log(objects);
                            return objects;
                        }));
                    });
                    $.when.apply(null, promises).then(function(/* founded objects */) {
                        var objects = [].concat.apply([], arguments)
                        .map(function(obj) {
                            obj.properties = {};
                            return obj;
                        });
                        
                        var combinedLayerProps = new nsGmx.LayerProperties(),
                            layerTitle = ui.find('.mergeLayers-name').val();
                        combinedLayerProps.initFromViewer('Vector', null, {
                            Title: layerTitle,
                            SourceType: 'manual',
                            GeometryType: 'POLYGON',
                            Columns: []
                        });
                    
                        combinedLayerProps.save().then(function(response) {
                            if (!parseResponse(response)) {
                                return;
                            }
                            
                            var layerName = response.Result.properties.name;
                            
                            _layersTree.addLayerToTree(layerName);
                            
                            _mapHelper.modifyObjectLayer(layerName, objects).then(function() {
                                nsGmx.widgets.notifications.stopAction('mergeLayers', 'success', 'Объединённый слой ' + layerTitle + 'добавлен в карту');
                            })
                            
                        }, function(error) {
                            nsGmx.widgets.notifications.stopAction('mergeLayers', 'failure', 'Не удалось объединить слои');
                            console.log(error);
                        })
                    })
                })
                
                var mapLayersDOM = mapLayersTree.drawTree(searchRawTree.getRawTree(), 2);
                
                $(mapLayersDOM).treeview().appendTo(ui.find('.mergeLayers-tree'));
                
                ui.appendTo(menu.workCanvas);
            }
        }, 'instrumentsMenu');
    }
}

gmxCore.addModule('MergeLayersPlugin', publicInterface, {
    css: 'MergeLayersPlugin.css'
});

})(jQuery);