//Плагин для добавления таймлайна для просмотра данных мультивременных слоёв.
(function ($){

_translationsHash.addtext("eng", {
    "Показывать только пересекающиеся с центром экрана": "Show intersected with map center",
    "Показывать на карте только выбранные снимки": "Show on map only selected items",
    "Только выбранные": "Selected only",
    "По центру": "Under crosshair",
    "Добавить к таймлайну": "Add to timeline"
});

_translationsHash.addtext("rus", {
    "Показывать только пересекающиеся с центром экрана": "Показывать только пересекающиеся с центром экрана",
    "Показывать на карте только выбранные снимки": "Показывать на карте только выбранные снимки",
    "Только выбранные": "Только выбранные",
    "По центру": "По центру",
    "Добавить к таймлайну": "Добавить к таймлайну"
});

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
    
    //TODO: научить таймлайн работать с UTC временем, и передавать в него корректные UTC даты
    //Сейчас даты парсятся с локальным смещением
    
    //var timeOffset = (new Date(localValue)).getTimezoneOffset()*60*1000;
    var timeOffset = 0;
    return new Date(localValue - timeOffset);
}

var fromDateToTiles = function(type, date)
{
    var timeOffset = 0; //TODO: научить таймлайн работать с UTC временем
    var dateString = $.datepicker.formatDate('yy.mm.dd', date)
    if (type === 'datetime')
    {
        dateString += nsGmx.Utils.stringDateTime(date.valueOf());
    }
    
    return dateString;
}

var TimelineData = Backbone.Model.extend({
    defaults: {
        allItems: false,        //все ли данные уже загружены
        items: {},              //{layerName1: {id1 : {...}, ...}, layerName2:...}
        userFilters: [],        //function({obj, bounds}, mapCenter, mapExtent) -> bool
        range: {
            start: null,        //Date
            end: null           //Date
        },
        selection: [],          //{layerName1: [id1, id2, ...], layerName2:...}
        layers: [],             //[{name: ..., dateFunction: ..., filterFunction: ...}, ...]
        timelineMode: 'center', //center, screen, none
        mapMode: 'none'         //selected, range, none
    },
    
    _defaultDateFunction: function(layer, obj) {
    
        var temporalColumn = layer.properties.TemporalColumnName,
            type = layer.properties.attrTypes[$.inArray(temporalColumn, layer.properties.attributes)];
        
        return fromTilesToDate(type, obj.properties[temporalColumn]);
    },
    
    _defaultFilterFunction: function(layer, startDate, endDate) {
        var temporalColumn = layer.properties.TemporalColumnName,
            type = layer.properties.attrTypes[$.inArray(temporalColumn, layer.properties.attributes)],
            startStr = fromDateToTiles(type, startDate),
            endStr = fromDateToTiles(type, endDate),
            filterStr = '"' + temporalColumn + '" <= \'' + endStr + '\' AND "' + temporalColumn + '" >= \'' + startStr + '\'';
            
        layer.setVisibilityFilter(filterStr);
    },
    
    bindLayer: function(layerName, options) {
        var newLayerInfo = {
            name: layerName, 
            dateFunction: (options && options.dateFunction) || this._defaultDateFunction,
            filterFunction: (options && options.filterFunction) || this._defaultFilterFunction
        }
        this.trigger('preBindLayer', newLayerInfo);
        
        var layers = this.attributes.layers.slice(0);
        layers.push(newLayerInfo);
        
        this.set('layers', layers);
        this.trigger('bindLayer', layerName);
    },
    
    addFilter: function(filterFunc) {
        this.attributes.userFilters.push(filterFunc);
        this.trigger('change change:userFilters');
    }
})

var MapController = function(data, map) {
    var updateFunctions = {
        none: function(layers) {
            $.each(layers || data.get('layers'), function(i, layerInfo) {
                map.layers[layerInfo.name].setVisibilityFilter();
            })
        },
        
        selected: function(layers) {
            $.each(layers || data.get('layers'), function(i, layerInfo) {
                var layerName = layerInfo.name;
                var layer = map.layers[layerName];
                var identityField = layer.properties.identityField;
                var selection = data.get('selection');
                if (layerName in selection)
                {
                    var queryItems = $.map(selection[layerName], function(objid) {
                        return '"' + identityField + '"=' + objid;
                    })
                    
                    layer.setVisibilityFilter(queryItems.join(' OR '));
                }
                else
                {
                    layer.setVisibilityFilter('"' + identityField + '"=-1');
                }
            })
        },
        
        range: function(layers) {
            var range = data.get('range');
            $.each(layers || data.get('layers'), function(i, layerInfo) {
                layerInfo.filterFunction(map.layers[layerInfo.name], range.start, range.end);
            })
        }
    }

    data.on('change:range', function() {
        if (data.get('mapMode') === 'range') {
            updateFunctions['range']();
        }
    })

    data.on('change:selection', function() {
        if (data.get('mapMode') === 'selected') {
            updateFunctions['selected']();
        }
    })
    
    data.on('change:mapMode', function() {
        updateFunctions[data.get('mapMode')]();
    })
    
    //вклчючим фильтрацию для этого снимка до того, как он будет добавлен в список слоёв таймлайна
    data.on('preBindLayer', function(layerInfo) {
        updateFunctions[data.get('mapMode')]([layerInfo]);
    })
}

var TimelineController = function(data, map) {
    function isPointInPoly(poly, pt){
        var l = poly.length;
        poly[0][0] == poly[l-1][0] && poly[0][1] == poly[l-1][1] && l--;
        for(var c = false, i = -1, j = l - 1; ++i < l; j = i)
            ((poly[i][1] <= pt.y && pt.y < poly[j][1]) || (poly[j][1] <= pt.y && pt.y < poly[i][1]))
            && (pt.x < (poly[j][0] - poly[i][0]) * (pt.y - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])
            && (c = !c);
        return c;
    }
    
    var options = {
        "style": "line",
        "start": new Date(2010, 0, 1),
        "end": new Date(2013, 5, 1),
        width: "100%",
        height: "85px",
        style: "line"
    };
    
    var timeline = null;
    var countSpan = null;
    var container = $('<div/>', {'class': 'timeline-container'});
    
    var modeFilters = {
        'none': function() {return true; },
        'center': function(item, mapCenter, mapExtent)
        {
            var obj = item.obj,
                c = obj.geometry.coordinates,
                intersects = false;
                
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
        },
        'screen': function(item, mapCenter, mapExtent)
        {
            return gmxAPI.boundsIntersect(item.bounds, mapExtent);
        }
    }
    
    var updateLayerItems = function(layerInfo)
    {
        var layerName = layerInfo.name;
        var layer = map.layers[layerName];
        var temporalColumn = layer.properties.TemporalColumnName;
        var identityField = layer.properties.identityField;
        
        var elemsToAdd = [];
        var mapCenter = {x: map.getX(), y: map.getY()};
        var mapExtent = map.getVisibleExtent();
        var items = data.get('items');
        var filters = data.get('userFilters').slice(0);
        
        filters.unshift(modeFilters[data.get('timelineMode')]);

        for (var i in items[layerName])
        {
            var item = items[layerName][i],
                obj = item.obj;
            
            var showItem = true;
            $.each(filters, function(i, filterFunc) {
                showItem = showItem && filterFunc(item, mapCenter, mapExtent);
            })
            
            if (!items[layerName][i].timelineItem && showItem)
            {
                var date = layerInfo.dateFunction(layer, obj),
                    content;
                
                if (layer.properties.NameObject)
                {
                    content = gmxAPI.applyTemplate(layer.properties.NameObject, obj.properties);
                }
                else
                {
                    content = obj.properties[temporalColumn];
                }
                
                elemsToAdd.push({
                    start: date,
                    content: content,
                    userdata: {objID: obj.properties[identityField], layerName: layerName}
                });
            }
            else if (items[layerName][i].timelineItem && !showItem)
            {
                for (var index = 0; index < timeline.items.length; index++)
                {
                    var itemData = timeline.getData()[index].userdata;
                    if (itemData.objID === i && itemData.layerName === layerName)
                    {
                        timeline.deleteItem(index, true);
                        delete items[layerName][i].timelineItem;
                    }
                }
            }
        }
        
        timeline.addItems(elemsToAdd);
        $.each(elemsToAdd, function(i, elem) {
            items[layerName][elem.userdata.objID].timelineItem = timeline.items[timeline.items.length-elemsToAdd.length + i];
        });
    }
    
    var updateCount = function() {
        if (!timeline) return;
        var count = 0;
        var range = timeline.getVisibleChartRange();
        
        $.each(timeline.getData(), function(i, item) {
            item.start >= range.start && item.start <= range.end && count++;
        })
        
        countSpan && countSpan.text('(' + count + ')');
    }
    
    var updateCalendarRange;
    
    var updateItems = function() {
        $.each(data.get('layers'), function(i, layerInfo) {
            updateLayerItems(layerInfo);
        });
        updateCount();
    }
    
    var fireSelectionEvent = function() {
        var selectedItems = [];
        var items = data.get('items');
        
        var selectedIds = {};
                        
        $.each(timeline.getSelection(), function(i, selection)
        {
            var userdata = timeline.getData()[selection.row].userdata;
            var layerName = userdata.layerName;
            selectedIds[layerName] = selectedIds[layerName] || [];
            selectedIds[layerName].push(userdata.objID);
        })
        
        data.set('selection', selectedIds);
    }
    
    var findNextByTime = function(itemIndex, step)
    {
        var sortedItems = $.map(timeline.items, function(item, i)
        {
            return {index: i, date: item.start.valueOf()};
        }).sort(function(a, b)
        {
            return a.date - b.date || a.index - b.index;
        });
        
        var res = null;
        $.each(sortedItems, function(i, item) 
        { 
            if (item.index === itemIndex)
                res = sortedItems[i + step] ? sortedItems[i + step].index : null;
        })
        
        return res;
    }
    
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
        
        fireSelectionEvent();
    }
        
    var createTimelineLazy = function()
    {
        if (timeline) return;
        //gmxAPI._allToolsDIV.appendChild(container[0]);
        $('#flash').append(container[0]);
        map.miniMap && map.miniMap.setVisible(false);
        timeline = new links.Timeline(container[0]);
        timeline.addItemType('line', links.Timeline.ItemLine);
        timeline.draw([], options);
        
        links.events.addListener(timeline, 'select', fireSelectionEvent);
        
        links.Timeline.addEventListener(timeline.dom.content, "dblclick", function(elem) {
            if (timeline.eventParams.itemIndex !== undefined) {
                var items = data.get('items');
                var userdata = timeline.getData()[timeline.eventParams.itemIndex].userdata;
                var geom = items[userdata.layerName][userdata.objID].obj.geometry;
                var b = gmxAPI.getBounds(geom.coordinates);
                
                map.zoomToExtent(b.minX, b.minY, b.maxX, b.maxY);
            }
        });
        
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
        
        var timelineModeSelect = $('<select/>').addClass('selectStyle')
                .append($('<option/>').val('none').text('все'))
                .append($('<option/>').val('screen').text('на экране'))
                .append($('<option/>').val('center').text('над центром'));
                
        timelineModeSelect.change(function() {
            data.set('timelineMode', $(':selected', this).val());
        })
        
        var updateTimelineModeSelect = function() {
            var mode = data.get('timelineMode');
            $('option', timelineModeSelect).each(function(i, option) {
                this.value === mode ? $(this).attr('selected', true) : $(this).removeAttr('selected');
            })
        }
        
        data.on('change:timelineMode', updateTimelineModeSelect);
        updateTimelineModeSelect();
                
        var mapModeSelect = $('<select/>').addClass('selectStyle')
                .append($('<option/>').val('selected').text('выделенные'))
                .append($('<option/>').val('range').text('по датам'))
                .append($('<option/>').val('none').text('все'));
                
        var updateMapModeSelect = function() {
            var mode = data.get('mapMode');
            $('option', mapModeSelect).each(function(i, option) {
                this.value === mode ? $(this).attr('selected', true) : $(this).removeAttr('selected');
            })
        }
        
        data.on('change:mapMode', updateMapModeSelect);
        updateMapModeSelect();
        
        mapModeSelect.change(function() {
            data.set('mapMode', $(':selected', this).val());
        })
        
        var calendarContainer = $('<div/>', {'class': 'timeline-calendar'});
        var calendarControl = new nsGmx.Calendar('timelineCalendar', {minimized: false, showSwitcher: false, container: calendarContainer});
        
        updateCalendarRange = function() {
            if (!timeline) return;
            var range = timeline.getVisibleChartRange();
            
            //TODO: не использовать UTC даты в таймлайне (нужна поддержка отображения UTC).
            var trueStart = nsGmx.Calendar.fromUTC(range.start);
            var trueEnd = nsGmx.Calendar.fromUTC(range.end);
            
            trueStart.setUTCHours(0, 0, 0, 0);
            trueEnd.setUTCHours(23, 59, 59, 0);
            calendarControl.setDateBegin(trueStart, true);
            calendarControl.setDateEnd(trueEnd, true);
            data.set('range', range);
            updateCount();
        };  

        links.events.addListener(timeline, 'rangechanged', updateCalendarRange);
        updateCalendarRange();
        
        $(calendarControl).change(function() {
            // timeline.setVisibleChartRange(calendarControl.getDateBegin(), calendarControl.getDateEnd());
            data.set('range', {start: calendarControl.getDateBegin(), end: calendarControl.getDateEnd()})
        })
                
        countSpan = $('<span/>', {'class': 'count-container'});
        
        var controlsContainer = $('<div/>').addClass('timeline-controls').append(
            $('<div/>').append(
                $('<span>Показывать объекты: на таймлайне</span>'), timelineModeSelect, countSpan,
                $('<span>на карте</span>').css('margin-left', '10px'), mapModeSelect
            ),
            prevDiv, nextDiv,
            calendarContainer
        ).appendTo(container);
    }
    
    data.on('change:userFilters change:items', updateItems);
    
    map.addListener('positionChanged', updateItems);
    
    data.on('change:timelineMode', function() {
        if (data.get('timelineMode') === 'none' && !data.get('allItems')) {
            var defs = [];
            $.each(data.get('layers'), function(i, layerInfo) {
                var def = $.Deferred();
                defs.push(def);
                var layerName = layerInfo.name;
                var layer = map.layers[layerName];
                var identityField = layer.properties.identityField;
                var items = data.get('items');
                
                layer.getFeatures(function(features) {
                    for (var i = 0; i < features.length; i++)
                    {
                        var obj = features[i];
                        var id = obj.properties[identityField];
                        items[layerName][id] = items[layerName][id] || {};
                        items[layerName][id].obj = obj;
                        items[layerName][id].bounds = gmxAPI.getBounds(obj.geometry.coordinates);
                    }
                    def.resolve();
                })
            })
            
            $.when.apply($, defs).done(function() {
                data.set('allItems', true);
                data.trigger('change change:items');
            })
        } else {
            updateItems();
        }
    });
    
    data.on('bindLayer', function(layerName) {
        var layer = map.layers[layerName];
        var identityField = layer.properties.identityField;
        
        createTimelineLazy();
        
        nsGmx.widgets.commonCalendar.get().unbindLayer(layerName);
        layer.setDateInterval(new Date(2000, 1, 1), new Date());
        
        layer.addObserver(function(objs)
        {
            //если мы загрузили все объекты, то нас не особо волнует, попали они на экран или нет...
            if (data.get('allItems')) {
                return;
            }
            
            var items = data.get('items');
            items[layerName] = items[layerName] || {};
            
            for (var i = 0; i < objs.length; i++)
            {
                var obj = objs[i].item;
                var id = obj.properties[identityField];
                if (objs[i].onExtent)
                {
                    items[layerName][id] = items[layerName][id] || {};
                    items[layerName][id].obj = obj;
                    items[layerName][id].bounds = gmxAPI.getBounds(obj.geometry.coordinates);
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
            
            data.trigger('change change:items');
            
        }, {asArray: true, ignoreVisibilityFilter: true})
    })
    
    data.on('change:range', function(){
        if (!timeline) return;
        var currRange = timeline.getVisibleChartRange();
        var newRange = data.get('range');
        
        if (currRange.start.valueOf() !== newRange.start.valueOf() || currRange.end.valueOf() !== newRange.end.valueOf() ) {
            timeline.setVisibleChartRange(nsGmx.Calendar.toUTC(newRange.start), nsGmx.Calendar.toUTC(newRange.end));
            updateCalendarRange && updateCalendarRange();
        }
    })
    
    this.toggle = function(isVisible) {
        container.toggle(isVisible);
    }
}

var TimelineControl = function(map) {
    var data = new TimelineData();
    this.data = data;
    
    var mapController = new MapController(data, map);
    var timelineController = new TimelineController(data, map);
    
    this.bindLayer = function(layerName, options) {
        data.bindLayer(layerName, options);
    }
    
    this.setTimelineMode = function(newMode) {
        data.set('timelineMode', newMode);
    }
    
    this.setMapMode = function(newMode) {
        data.set('mapMode', newMode);
    }
    
    this.setVisibleRange = function(start, end) {
        data.set('range', {start: start, end: end});
    }
    
    this._fromTilesToDate = fromTilesToDate;
    
    this.toggleVisibility = function(isVisible) {
        timelineController.toggle(isVisible);
    }
    
    this.addFilter = function(filterFunc) {
        data.addFilter(filterFunc);
    }
    
    this.updateFilters = function() {
        data.trigger('change:userFilters');
    }
};

var publicInterface = {
    pluginName: 'Timeline Rasters',
    beforeViewer: function(params, map) {
        if (!map) return;
        
        nsGmx.timelineControl = new TimelineControl(map);
    },
	afterViewer: function(params, map)
    {
        if (!map) return;
        
        map.addListener('onToolsMinimized', function(isMinimised) {
            nsGmx.timelineControl.toggleVisibility(!isMinimised);
        })
        
        nsGmx.timelineControl.toggleVisibility(!map.isToolsMinimized());
        
        nsGmx.ContextMenuController.addContextMenuElem({
            title: function() { return _gtxt("Добавить к таймлайну"); },
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