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
                return {elem:childs[i], parents: [elem].concat(parents), index: i};
            
            if (typeof childs[i].content.children != 'undefined')
            {
                var res = _findElem(childs[i], attrName, name, [elem].concat(parents));
                
                if (res)
                    return res;
            }
        }
        
        return false;
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
        return _findElem(_tree, attrName, name, [_tree]);
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
    
    this.forEachLayer = function(callback)
    {
        forEachLayer(_tree, callback);
    }
}