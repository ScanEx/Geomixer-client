var nsGmx = nsGmx || {};

nsGmx.LayersTree = function( tree )
{
    var _tree = tree;
    
    var _findElem = function(elem, attrName, name, parents)
    {
        var childs = typeof elem.children != 'undefined' ? elem.children : elem.content.children;
        
        for (var i = 0; i < childs.length; i++)
        {
            if (childs[i].content.properties[attrName] == name)
                return {elem:childs[i], parents: [elem].concat(parents || []), index: i};
            
            if (typeof childs[i].content.children != 'undefined')
            {
                var res = _findElem(childs[i], attrName, name, [elem].concat(parents || []));
                
                if (res)
                    return res;
            }
        }
    }
    
    //public
    this.getRawTree = function() 
    {
        return _tree;
    }
    
    this.getMapProperties = function() 
    {
        return _tree.properties;
    }
    
    this.findElem = function(attrName, name)
    {
        return _findElem(_tree, attrName, name);
    }
    
    this.findElemByGmxProperties = function(gmxProperties)
    {
        if (gmxProperties.type == 'group') //группа
            return this.findElem("GroupID", gmxProperties.content.properties.GroupID);
        else if (typeof gmxProperties.content.properties.LayerID !== 'undefined') //слой
            return this.findElem("LayerID", gmxProperties.content.properties.LayerID);
        else if (typeof gmxProperties.content.properties.MultiLayerID !== 'undefined') //мультислой
            return this.findElem("MultiLayerID", gmxProperties.content.properties.MultiLayerID);
    }
    
    this.forEachLayer = function(callback, node)
    {
        gmxAPI.forEachLayer(node || _tree, callback);
    }
    
    // клонирование дерева с возможностью его модификации
    // filterFunc(node) -> {Node|null} - ф-ция, которая может модифицировать узлы дерева. 
    // Вызывается после клонирования очередного узла. Изменения данных можно делать in-place. 
    // Для групп вызывается после обработки всех потомков. Если возвращает null, то узел удаляется
    this.cloneRawTree = function(filterFunc) {
        filterFunc = filterFunc || function(node) {return node;};
        var res = {};
        var forEachLayerRec = function(o)
        {
            if (o.type == "layer") {
                return filterFunc($.extend(true, {}, o));
            }
            else if (o.type == "group") {
                var a = o.content.children;
                var newChildren = [];
                for (var k = 0; k < a.length; k++) {
                    var newNode = forEachLayerRec(a[k]);
                    newNode && newChildren.push(newNode);
                }
                return filterFunc({
                    type: 'group', 
                    content: {
                        children: newChildren,
                        properties: $.extend(true, {}, o.content.properties)
                    }
                })
            }
        }
        
        var newFirstLevelGroups = [];
        for (var k = 0; k < _tree.children.length; k++) {
            var newNode = forEachLayerRec(_tree.children[k]);
            newNode && newFirstLevelGroups.push(newNode);
        }
        
        return {
            properties: $.extend(true, {}, _tree.properties),
            children: newFirstLevelGroups
        }
    }
}