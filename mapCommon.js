var nsMapCommon = function($){
    var publicInterface = {
        generateWinniePermalink: function() {
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
                    calendar: nsGmx.widgets.commonCalendar.getDateInterval().saveState(),
                    baseLayersManager: lmap.gmxBaseLayersManager.saveState(),
                    layersTree: layersState
                }
            }

            return nsGmx.Utils.TinyReference.create(config, false);
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