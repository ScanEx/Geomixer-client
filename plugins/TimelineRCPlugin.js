//Плагин для добавления таймлайна для просмотра данных мультивременных слоёв.
(function ($){

var fromTilesToDate = function(type, value)
{
    var localDateValue;
    if (type === 'datetime')
    {
        localDateValue = $.datepicker.parseDateTime('yy.mm.dd', 'hh:mm:ss', value);
    }
    else
    {
        localDateValue = $.datepicker.parseDate('yy.mm.dd', value);
    }
    
    if (localDateValue === null) return null;
        
    var localValue = localDateValue.valueOf();
    var timeOffset = (new Date(localValue)).getTimezoneOffset()*60*1000;
    return new Date(localValue - timeOffset);
}

var TimelineControl = function(map)
{
    var _this = this;
    var container = $('<div/>', {'class': 'timeline-container'});
    
    var bindedLayers = [];
    var items = {};
    var timeline;
    var filters = [];
    
    var mapCenter = null;
    
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
            && (pt.x < (poly[j][0] - poly[i][0]) * (pt.y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
            && (c = !c);
        return c;
    }
    
    var createTimelineLazy = function()
    {
        if (timeline) return;
        container.appendTo($('body'));
        timeline = new links.Timeline(container[0]);
        timeline.addItemType('line', links.Timeline.ItemLine);
        timeline.draw([], options);
        
        links.events.addListener(timeline, 'select', updateSelection);
        
        var prevDiv = makeImageButton("img/prev.png", "img/prev_a.png");
        _title(prevDiv, _gtxt("Предыдущий слой"));
        prevDiv.onclick = function()
        {
            activateNextItem(-1);
        }
        $(prevDiv).addClass('timeline-controls');
        
        var nextDiv = makeImageButton("img/next.png", "img/next_a.png");
        _title(nextDiv, _gtxt("Следующий слой"));
        
        nextDiv.onclick = function()
        {
            activateNextItem(1);
        }
        $(nextDiv).addClass('timeline-controls');
        
        var controlsContainer = $('<div/>').append(prevDiv, nextDiv).appendTo(container);
    }
    
    var findNextByTime = function(itemIndex, step)
    {
        var sortedItems = $.map(timeline.items, function(item, i)
        {
            return {index: i, date: item.start.valueOf()};
        }).sort(function(a, b)
        {
            return a.date === b.date ? a.index - b.index : a.date - b.date
        });
        
        var res = null;
        $.each(sortedItems, function(i, item) 
        { 
            if (item.index === itemIndex)
                res = sortedItems[i + step] ? sortedItems[i + step].index : null;
        })
        
        return res;
    }
    
    
    var updateSelection = function()
    {
        var selectedIds = {};
        var selectedItems = [];
        
        $.each(timeline.getSelection(), function(i, selection)
        {
            var userdata = timeline.getData()[selection.row].userdata;
            var layerName = userdata.layerName;
            selectedIds[layerName] = selectedIds[layerName] || [];
            selectedIds[layerName].push(userdata.objID);
            
            selectedItems.push(items[layerName][userdata.objID].obj);
        })
        
        $.each(bindedLayers, function(i, layerName)
        {
            var layer = map.layers[layerName];
            if (layerName in selectedIds)
            {
                var queryItems = $.map(selectedIds[layerName], function(objid)
                {
                    return '"' + layer.properties.identityField + '"=' + objid;
                })
                
                layer.setVisibilityFilter(queryItems.join(' OR '));
            }
            else
            {
                layer.setVisibilityFilter('"' + layer.properties.identityField + '"=-1');
            }
        })
        
        $(_this).trigger('select', {selection: selectedItems});
    };
    
    var activateNextItem = function(step)
    {
        var curSelection = timeline.getSelection();
        if (curSelection.length > 0)
        {
            var newIndex = findNextByTime(curSelection[0].row, step);
            
            if (newIndex !== null)
            {
                curSelection[0].row = newIndex;
                timeline.setSelection(curSelection);
            }
        }
        updateSelection();
    }
    
    var filterByScreenCenter = function(obj)
    {
        var intersects = false;
        var c = obj.geometry.coordinates;
        if (obj.geometry.type == "POLYGON")
        {
            intersects = isPointInPoly(c[0], mapCenter);
        }
        else
        {
            for (var r = 0; r < c.length; r++)
                intersects = intersects || isPointInPoly(c[r][0], mapCenter);
        }
        
        return intersects;
    }
    filters.push(filterByScreenCenter);
    
    var updateTimelineItems = function(layerName)
    {
        var layer = map.layers[layerName];
        var temporalColumn = layer.properties.TemporalColumnName;
        var identityField = layer.properties.identityField;
        
        var elemsToAdd = [];
        mapCenter = {x: map.getX(), y: map.getY()};
        for (var curLayer in items)
        {
            for (var i in items[curLayer])
            {
                var obj = items[curLayer][i].obj;
                
                var showItem = true;
                $.each(filters, function(item, filterFunc) {
                    showItem = showItem && filterFunc(obj);
                })
                
                if (!items[curLayer][i].timelineItem && showItem)
                {
                    var type = layer.properties.attrTypes[$.inArray(temporalColumn, layer.properties.attributes)],
                        date = fromTilesToDate(type, obj.properties[temporalColumn]),
                        content;
                    
                    if (layer.properties.NameObject)
                    {
                        content = gmxAPI.applyTemplate(layer.properties.NameObject, obj.properties) + ' (' + obj.properties[temporalColumn] + ')';
                    }
                    else
                    {
                        content = obj.properties[temporalColumn];
                    }
                    
                    elemsToAdd.push({
                        start: date, 
                        content: content,
                        userdata: {objID: obj.properties[identityField], layerName: curLayer}
                    });
                }
                else if (items[curLayer][i].timelineItem && !showItem)
                {
                    for (var index = 0; index < timeline.items.length; index++)
                    {
                        var itemData = timeline.getData()[index].userdata;
                        if (itemData.objID === i && itemData.layerName === curLayer)
                        {
                            timeline.deleteItem(index, true);
                            delete items[curLayer][i].timelineItem;
                        }
                    }
                }
            }
        }
        
        timeline.addItems(elemsToAdd);
        for (var i = 0; i < elemsToAdd.length; i++)
            items[layerName][elemsToAdd[i].userdata.objID].timelineItem = timeline.items[timeline.items.length-elemsToAdd.length + i];
    }
    
    //public interface
    this.addFilter = function(filterFunc)
    {
        filters.push(filterFunc);
        $.each(bindedLayers, function(i, layerName) { updateTimelineItems(layerName); });
    }
    
    this.eachItem = function(layerName, callback)
    {
        items[layerName] && $.each(items[layerName], callback);
    }
    
    this.update = function()
    {
        $.each(bindedLayers, function(i, layerName) { updateTimelineItems(layerName); });
    }
    
    //@param {Array} selection Массив объектов вида {layerName: , id: }
    this.setSelection = function(selection)
    {
        var timelineSelection = [];
        $.each(timeline.getData(), function(timelineIndex, timelineItem) {
            var userdata = timelineItem.userdata;
            var founded = false;
            $.each(selection, function(i, item) {
                founded = founded || (item.layerName === userdata.layerName && item.id === userdata.objID);
            })
            
            founded && timelineSelection.push({row: timelineIndex});
        })
        
        timeline.setSelection(timelineSelection);
        updateSelection();
    }
    
    this.bindLayer = function(layerName)
    {
        createTimelineLazy();
        bindedLayers.push(layerName);
        items[layerName] = items[layerName] || {};
        nsGmx.widgets.commonCalendar.get().unbindLayer(layerName);
        
        var layer = map.layers[layerName];
        var identityField = layer.properties.identityField;
        
        if (!layer.properties.Temporal) return;
        
        layer.setDateInterval(new Date(2000, 1, 1), new Date())
        layer.setVisibilityFilter('"' + identityField + '"=-1');
        
        
        map.addListener('positionChanged', function() {
            updateTimelineItems(layerName);
        })
        
        layer.addObserver(function(objs)
        {
            for (var i = 0; i < objs.length; i++)
            {
                var obj = objs[i].item;
                var id = obj.properties[identityField];
                if (objs[i].onExtent)
                {
                    items[layerName][id] = items[layerName][id] || {};
                    items[layerName][id].obj = obj;
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
            
            updateTimelineItems(layerName);
        }, {asArray: true, ignoreVisibilityFilter: true})
    }
}

var publicInterface = {
    pluginName: 'Timeline Rasters',
    beforeViewer: function(params, map) {
        if (!map) return;
        
        nsGmx.timelineControl = new TimelineControl(map);
    },
	afterViewer: function(params, map)
    {
        if (!map) return;
        
        nsGmx.ContextMenuController.addContextMenuElem({
            title: function() { return "Добавить к таймлайну"; },
            isVisible: function(context)
            {
                return !context.layerManagerFlag && 
                        context.elem.type == "Vector" &&
                        context.elem.Temporal &&
                        context.elem.IsRasterCatalog;
            },
            clickCallback: function(context)
            {
                nsGmx.timelineControl.bindLayer(context.elem.name);
            }
        }, 'Layer');
    }
    //, fromTilesToDate: fromTilesToDate
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