(function ($){
var template = '<div class="mergeLayers-container">\
<div class="mergeLayers-controls">\
<span>Выбрано слоёв: </span>\
<span class="mergeLayers-count">0</span>\
<button class="mergeLayers-merge">Объединить</button>\
</div>\
<div class="mergeLayers-name-container">\
<span>Название нового слоя: </span>\
<input class="inputStyle mergeLayers-name" value="merge result">\
</div>\
<div class="mergeLayers-info">Выберите слои для объединения</div>\
<div class="mergeLayers-tree"></div>\
</div>';

var publicInterface = {
    pluginName: 'Merge Layers Plugin',
    afterViewer: function(params, map) {
		var menuUp = window.nsGmx.menuUp || window._menuUp;
        menuUp.addChildItem({
            id: 'mergeLayers', 
            title: 'Объединить слои', 
            func: function() {
                var menu = new (nsGmx.leftMenu || window.leftMenu)();
                menu.createWorkCanvas('mergelayers', {
                    path: ['Объединение слоёв карты'],
                    closeFunc: function() {
                        menuUp.checkItem('mergeLayers', false);
                    }
                });
                menuUp.checkItem('mergeLayers', true);
                
                //формируем новое дерево - без невекторных слоёв и пустых папок
                var searchRawTree = new nsGmx.LayersTree(window._layersTree.treeModel.cloneRawTree(function(node) {
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
                
                var cont = L.DomUtil.create('div', 'mergeLayers-container');
				cont.innerHTML = template;
                
                var selectedCount = 0,
					countPlaceholder = cont.getElementsByClassName('mergeLayers-count')[0],
					mapLayersTree = new layersTree({
						showVisibilityCheckbox: true, 
						allowActive: false, 
						allowDblClick: false, 
						showStyle: false,
						visibilityFunc: function(props, isVisible) {
							selectedCount += isVisible ? 1 : -1;
							countPlaceholder.innerHTML = selectedCount;
						}
					});
                
                cont.getElementsByClassName('mergeLayers-merge')[0].onclick = function() {
                    nsGmx.widgets.notifications.startAction('mergeLayers');
                    var layers = [],
						columns = {};
                    searchRawTree.forEachLayer(function(layer, isVisible) {
                        if (!isVisible) {return;}

                        var props = layer.properties,
							id = props.name;
							lObj = nsGmx.gmxMap.layersByID[id];
						layers.push({
							id: id,
							types: lObj.getTileAttributeTypes()
						});
						props.attributes.forEach(function(name, i) {
							columns[name] = {
								Name: name,
								ColumnSimpleType: props.attrTypes[i]
							};
						});
                    });
					var arrKeys = Object.keys(columns),
						sel = layers.map(function(item) {
							return 'select ' +  arrKeys.map(function(key) {
								return item.types[key] ? key : 'null as ' + key;
							}).join(',') + ', GeomixerGeoJson from [' + item.id + ']';
						}).join(' UNION ALL ');

					var combinedLayerProps = new nsGmx.LayerProperties();
					combinedLayerProps.initFromViewer('Vector', null, {
						Title: cont.getElementsByClassName('mergeLayers-name')[0].value,
						SourceType: 'manual',
						GeometryType: 'POLYGON',
						Columns: arrKeys.map(function(name) { return columns[name]; })
					});
				
					combinedLayerProps.save().then(function(response) {
						if (response.Status === 'ok') {
							var props = response.Result.properties;
							L.gmx.getJSON('//maps.kosmosnimki.ru/VectorLayer/QuerySelect',{
								params: {
									WrapStyle: 'none',
									sql: 'insert into [' + props.name + '] (' + arrKeys.join(',') + ', GeomixerGeoJson) (' + sel + ')'
								},
								options: {type: 'json'}
							}).then(function(json) {
								if (json.res && json.res.Status === 'ok') {
									window._layersTree.addLayerToTree(props.name);
									nsGmx.widgets.notifications.stopAction('mergeLayers', 'success', 'Объединённый слой ' + props.title + 'добавлен в карту');
								} else {
									nsGmx.widgets.notifications.stopAction('mergeLayers', 'failure', 'Не удалось объединить слои');
								}
							}.bind(this));
						}
                    });
                };

                var mapLayersDOM = mapLayersTree.drawTree(searchRawTree.getRawTree(), 2);
                $(mapLayersDOM).treeview().appendTo(cont.getElementsByClassName('mergeLayers-tree')[0]);

				menu.workCanvas.appendChild(cont);
            }
        }, 'instrumentsMenu');
    }
}

gmxCore.addModule('MergeLayersPlugin', publicInterface, {
    css: 'MergeLayersPlugin.css'
});

})(jQuery);
