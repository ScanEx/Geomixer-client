var nsMapCommon = function($){
	var publicInterface = {
		//options:
		//    apiKey: String
		//    defaultLayersVisibility: Object {mapName => visibility}
		//    saveBaseLayers: Bool. Добавлять ли команды конструирования базовых слоёв (не работает для слоёв не из карты и без properties.title)
		createAPIMap: function(mapName, hostName, options)
		{
			var id = 'flash' + Math.random(),
				br = "\n",
				mapText = "<div>" + br + "\t<div id=\"" + id + "\" style=\"width: 600px; height: 400px; overflow:hidden;\"></div>" + br;
			
			if ( options && options.apiKey )
				mapText += "\t<script charset=\"windows-1251\" src=\"http://maps.kosmosnimki.ru/api/api.js?key=" + options.apiKey + "\"></script>" + br;
			else
				//mapText += "\t<script charset=\"windows-1251\" src=\"" + serverBase + "api/api.js?\"></script>" + br;
				mapText += "\t<script charset=\"windows-1251\" src=\"" + getAPIHostRoot() + "api/api.js?\"></script>" + br;
				
			mapText += "\t<script>" + br;
			
			mapText += "\t\tcreateFlashMap(document.getElementById(\"" + id + "\"), \"" + hostName + "\", \"" + mapName + "\", function(map)" + br;
			mapText += "\t\t{" + br;
			mapText += "\t\t\tglobalFlashMap = map;" + br;
			mapText += "\t\t\tmap.moveTo(" + globalFlashMap.getX() + ", " + globalFlashMap.getY() + ", " + globalFlashMap.getZ() + ");" + br;
			
			var currentBaseLayerName = globalFlashMap.getBaseLayer();
			var baseLayersVisibility = {};
			var baseLayersStructure = [];
			var baseLayerIDs = globalFlashMap.baseLayersManager.getActiveIDs();
			
			for (var k = 0; k < baseLayerIDs.length; k++)
			{
                var baseLayerID = baseLayerIDs[k];
                var isVisible = baseLayerID == currentBaseLayerName;
				var baseLayerLayers = globalFlashMap.baseLayersManager.get(baseLayerID).layers;
				for (var b = 0; b < baseLayerLayers.length; b++)
				{
                    if (baseLayerLayers[b].objectId) {
                        baseLayersVisibility[baseLayerLayers[b].objectId] = isVisible;
                    }
                    
					if (baseLayerLayers[b].properties && baseLayerLayers[b].properties.title) {
						baseLayersStructure.push ({title: baseLayerLayers[b].properties.title, baseLayer: baseLayerIDs[k]});
                    }
				}
			}
			
			if (options && options.saveBaseLayers)
				for ( var k = 0; k < baseLayersStructure.length; k++ )
					mapText += "\t\t\tmap.layers[\"" + baseLayersStructure[k].title + "\"].setAsBaseLayer(\"" + baseLayersStructure[k].baseLayer + "\");" + br;
			
			if ( globalFlashMap.getBaseLayer() )
				mapText += "\t\t\tmap.setBaseLayer(\"" + currentBaseLayerName + "\");" + br;
			
			mapText += "\t\t\tmap.minimizeTools();" + br;
			
			//по умолчанию сетка отключена
			if ( globalFlashMap.grid.getVisibility() )
				mapText += "\t\t\tmap.grid.setVisible(true);" + br;
			
			globalFlashMap.drawing.forEachObject(function(o) 
			{
				var elemId = 'elem' + String(Math.random()).split(".")[1];
				var apiStyles = o.getStyle(true);
				mapText += "\t\t\tvar " + elemId + " = map.drawing.addObject(" + JSON.stringify(o.geometry) + ", " + JSON.stringify(o.properties) + ")" +  br;
				mapText += "\t\t\t" + elemId + ".setStyle(" + JSON.stringify(apiStyles.regular) + ", " + JSON.stringify(apiStyles.hovered) + ")" + br;
			});
			
			var defaultLayersVisibility = options && options.defaultLayersVisibility ? options.defaultLayersVisibility : {};
			
			for (var k = 0; k < globalFlashMap.layers.length; k++)
			{
				var layer = globalFlashMap.layers[k];
				var name = layer.properties.title;// || layer.properties.image;
				var isVisible = typeof layer.isVisible == 'undefined' ? false : layer.isVisible;
				var needUpdateAfterBaseLayers = (layer.objectId in baseLayersVisibility) && baseLayersVisibility[layer.objectId] != isVisible;
				var needUpdateDefault = !(layer.objectId in baseLayersVisibility) && (!(layer.properties.name in defaultLayersVisibility) || defaultLayersVisibility[layer.properties.name] != isVisible);
				if ( needUpdateAfterBaseLayers || needUpdateDefault )
					mapText += "\t\t\tmap.layers[\"" + name + "\"].setVisible(" + isVisible + ");" +  br;
			}
			
			mapText += "\t\t});" + br;
			mapText += "\t</script>" + br + "</div>";
			
			return mapText;
		},
		
		//options:
		//    requestAPIKey: Bool. По умолчанию - true
		//    requestTerms: Bool (если true, нужно указать termsURL) По умолчанию - false
		//    termsURL: String (требует requestTerms==true) Нет значения по умолчанию
		//    initialLayerVisibility: Object (имя слоя => видимость)
		//    saveBaseLayers: Bool. Добавлять ли команды конструирования базовых слоёв (не работает для слоёв не из карты и без properties.title)
		//    onBeforeGenerate: function(). Вызывается непосредственно перед генерацией кода
		//    onAfterGenerate: function(). Вызывается непосредственно после генерации кода
		createAPIMapDialog: function(mapName, hostName, options)
		{
            var mapProps = nsGmx.gmxMap.properties,
                lmap = nsGmx.leafletMap,
                center = lmap.getCenter(),
                layersState = {expanded: {}, visible: {}};
                
            _layersTree.treeModel.forEachNode(function(elem) {
                var props = elem.content.properties;
                if (elem.type == 'group') {
                    var groupId = props.GroupID;

                    if ($("div[GroupID='" + groupId + "']").length || props.changedByViewer) {
                        layersState.expanded[groupId] = props.expanded;
                    }
                } else {
                    if (props.changedByViewer) {
                        layersState.visible[props.name] = props.visible;
                    }
                }
            });
                
                
            
            var config = {
                app: {
                    gmxMap: {
                        mapID: mapProps.name
                    }
                },
                state: {
                    map: {
                        position: {
                            x: center.lng,
                            y: center.lat,
                            z: lmap.getZoom()
                        }
                    },
                    calendar: nsGmx.widgets.commonCalendar.get().saveState(),
                    drawingManager: lmap.gmxDrawing.saveState(),
                    baseLayersManager: lmap.gmxBaseLayersManager.saveState(),
                    layersTree: layersState
                }
            }
            
            nsGmx.Utils.TinyReference.create(config).then(function(id) {
                console.log('http://winnie.kosmosnimki.ru/viewer.html?config=' + id);
            })
		},
		/**
		* Выбирает данные из дерева слоёв по описанию слоёв и групп
		* @param {FlashMapObject} map - текущая карта
		* @param {object} mapTree - дерево, в котором нужно искать
		* @param {array} description - массив с описанием нужных слоёв. Каждый элемент массива может быть либо строкой (имя слоя), либо объектом {group: '<groupName>'} - выбрать все слои из группы
		*/
		selectLayersFromTree: function(map, mapTree, description)
		{
			var _array = [];
			var _hash = {};
			
			var _getLayersInGroup = function(map, mapTree, groupTitle)
			{
				var res = {};
				var visitor = function(treeElem, isInGroup)
				{
					if (treeElem.type === "layer" && isInGroup)
					{
						res[treeElem.content.properties.name] = map.layers[treeElem.content.properties.name];
					}
					else if (treeElem.type === "group")
					{
						isInGroup = isInGroup || treeElem.content.properties.title == groupTitle;
						var a = treeElem.content.children;
						for (var k = a.length - 1; k >= 0; k--)
							visitor(a[k], isInGroup);
					}
				}

				visitor( {type: "group", content: { children: mapTree.children, properties: {} } }, false );
				return res;
			}	
			
			for (var k = 0; k < description.length; k++)
				if ( typeof description[k] === "string" )
				{
					_hash[description[k]] = map.layers[description[k]];
					_array.push( map.layers[description[k]] );
				}
				else if ('group' in description[k])
				{
					var groupHash = _getLayersInGroup(map, mapTree, description[k].group);
					for (var l in groupHash)
					{
						_hash[l] = groupHash[l];
						_array.push( groupHash[l] );
					}
				}
				
			return {
				asArray: function() { return _array; },
				asHash: function() { return _hash; },
				names: function()
				{
					var res = [];
					
					for (var l in _hash) 
						res.push(l);
						
					return res;
				}
			}
		}
	};
	
	if (typeof gmxCore !== 'undefined')
	{
		gmxCore.addModule('MapCommon', publicInterface);
	}
	
	return publicInterface;
}(jQuery);