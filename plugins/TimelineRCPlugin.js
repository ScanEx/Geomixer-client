(function ($){

var TimelineControl = function(map)
{
    var container = $('<div/>', {'class': 'timeline-container'}).appendTo($('body'));
    
    var selectionLayer = null;
    
    var options = {
        "style": "line",
        "start": new Date(2010, 0, 1),
        "end": new Date(2013, 0, 1),
        width: "100%",
        height: "85px",
        style: "line"
    };
    
    function isPointInPoly(poly, pt){
        var l = poly.length;
        poly[0][0] == poly[l-1][0] && poly[0][1] == poly[l-1][1] && l--;
        for(var c = false, i = -1, j = l - 1; ++i < l; j = i)
            ((poly[i][1] <= pt.y && pt.y < poly[j][1]) || (poly[j][1] <= pt.y && pt.y < poly[i][1]))
            //&& (poly[j][1] !== poly[i][1])
            && (pt.x < (poly[j][0] - poly[i][0]) * (pt.y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
            && (c = !c);
        return c;
    }
    
    var timeline = new links.Timeline(container[0]);
    timeline.addItemType('line', links.Timeline.ItemLine);
    
    timeline.draw([], options);
    
    links.events.addListener(timeline, 'select', function()
    {
        var selection = timeline.getSelection();
        if (selection.length)
        {
            var userdata = timeline.getItem(selection[0].row).userdata;
            selectionLayer = map.layers[userdata.layerName];
            selectionLayer.setVisibilityFilter('"' + selectionLayer.properties.identityField + '"=' + userdata.objID );
            // map.drawing.addObject(items[userdata.layerName][userdata.objID].obj.geometry);
        }
        else
        {
            selectionLayer && selectionLayer.setVisibilityFilter('"' + selectionLayer.properties.identityField + '"=-1');
            selectionLayer = null;
        }
    });
    
    var items = {};
        
    this.bindLayer = function(layerName)
    {
        items[layerName] = items[layerName] || {};
        nsGmx.widgets.commonCalendar.get().unbindLayer(layerName);
        
        var layer = map.layers[layerName];
        layer.setDateInterval(new Date(2000, 1, 1), new Date())
        layer.setVisibilityFilter('"' + layer.properties.identityField + '"=-1');
        
        if (!layer.properties.Temporal) return;
        
        var temporalColumn = layer.properties.TemporalColumnName;
        var identityField = layer.properties.identityField;
        
            var updateTimelineItems = function()
            {
                    var count = 0;
                    var elemsToAdd = [];
                    var pt = {x: map.getX(), y: map.getY()};
                    for (var curLayer in items)
                    {
                        for (var i in items[curLayer])
                        {
                            count++;
                            var obj = items[curLayer][i].obj;
                            
                            var intersects = false;
                            var c = obj.geometry.coordinates;
                            if (obj.geometry.type == "POLYGON")
                            {
                                intersects = isPointInPoly(c[0], pt);
                            }
                            else
                            {
                                for (var r = 0; r < c.length; r++)
                                    intersects = intersects || isPointInPoly(c[r][0], pt);
                            }
                            
                            if (!items[curLayer][i].timelineItem && intersects)
                            {
                                var date = $.datepicker.parseDate('yy.mm.dd', obj.properties[temporalColumn]);
                                elemsToAdd.push({start: date, content: obj.properties[temporalColumn], userdata: {objID: obj.properties[identityField], layerName: curLayer}});
                            }
                            else if (items[curLayer][i].timelineItem && !intersects)
                            {
                                var index = timeline.getItemIndex(items[curLayer][i].timelineItem.dom);
                                timeline.deleteItem(index, true);
                                delete items[curLayer][i].timelineItem;
                            }
                        }
                    }
                    
                    timeline.addItems(elemsToAdd);
                    for (var i = 0; i < elemsToAdd.length; i++)
                        items[layerName][elemsToAdd[i].userdata.objID].timelineItem = timeline.items[timeline.items.length-elemsToAdd.length + i];
            }
        
        map.addListener('positionChanged', updateTimelineItems)
        
        layer.addObserver(function(objs)
        {
            for (var i = 0; i < objs.length; i++)
            {
                var obj = objs[i].item;
                var id = obj.properties[identityField];
                if (objs[i].onExtent)
                {
                    items[layerName][id] = {obj: obj};
                }
                else
                {
                    if (items[layerName][id].timelineItem)
                    {
                        var index = timeline.getItemIndex(items[layerName][id].timelineItem.dom);
                        timeline.deleteItem(index, true);
                    }
                    delete items[layerName][id];
                }
            }
            
            updateTimelineItems();
            
        }, {asArray: true, ignoreVisibilityFilter: true})
    }
}

var publicInterface = {
    pluginName: 'Timeline Rasters',
	afterViewer: function(params, map)
    {
        var timelineControl = new TimelineControl(map);
        //timelineControl.bindLayer('3316DA0BFB8E4D6B8161AE9D8DC62CA5');
        
        nsGmx.ContextMenuController.addContextMenuElem({
            title: function() { return "Добавить к таймлайну"; },
            isVisible: function(context)
            {
                //console.log(context.elem);
                return !context.layerManagerFlag && 
                        context.elem.type == "Vector" &&
                        context.elem.Temporal &&
                        context.elem.IsRasterCatalog;
            },
            clickCallback: function(context)
            {
                timelineControl.bindLayer(context.elem.name);
            }
        }, 'Layer');
    }
}

gmxCore.addModule("TimelineRCPlugin", publicInterface, {
        css: 'TimelineRCPlugin.css',
        init: function(module, path)
        {
            var def = $.Deferred();
            gmxCore.loadScriptWithCheck([
                {
                    check: function(){ return window.links; },
                    script: path + 'timeline/timeline.js',
                    css: path + 'timeline/timeline.css'
                }
            ]).done(function()
            {
                gmxCore.loadScriptWithCheck([
                {
                    check: function(){ return window.links.ItemLine; },
                    script: path + 'timeline/LineItem.js'
                }]).done(function()
                {
                    def.resolve();
                })
            });
            
            return def;
        }
    });

})(jQuery)