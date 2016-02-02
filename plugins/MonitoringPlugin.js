(function(){

var parseMSDate = function(dateString)
{
    var dateInt = parseInt(dateString.match(/Date\((\d+)\)/)[1]);
    return new Date(dateInt);
}

var publicInterface = 
{
	afterViewer: function(params, map)
    {
        var menuCreated = false;
        var eventsCanvas = _div();
        var imagesCanvas = _div();
        var filtersCanvas = _div(null, [['css', 'display', 'table-cell']]);
        var menuCanvas = _div([filtersCanvas, eventsCanvas, imagesCanvas], [['css', 'padding', '0px 20px 0px 3px']]);
        
        var activeImageManager = {
            _id: null,
            set: function(newId)
            {
                this._id = newId;
                $(this).change();
            },
            get: function()
            {
                return this._id;
            }
        }
        
        $(activeImageManager).change(function()
        {
            var activeid = activeImageManager.get();
            // $(".imageRow", imagesCanvas).removeClass("activeImageRow");
            $(".imageRow", imagesCanvas).each(function(index, tr)
            {
                if ($(tr).data('imageid') == activeid)
                    $(tr).addClass('activeImageRow');
                else
                    $(tr).removeClass('activeImageRow');
            })
            
            if (activeid !== null)
            {
                imageLayer.setVisibilityFilter('"' + _params.idAttrName + '"=' + activeid);
                imageLayer.setVisible(true);
            }
            else
            {
                imageLayer.setVisible(false);
            }
        });
        
        var createMenuLazy = function()
        {
            if (menuCreated) return;
            var menu = new leftMenu();
            menu.createWorkCanvas("monitoring_demo", function(){});
            menu.workCanvas.appendChild(menuCanvas);
            menuCreated = true;
        }
        // var _params = $.extend({eventLayerName: '4B4E9CB3FF9C4B01B378486FFDA42C9B', imagesLayerName: '14D281B634BE445F83781B528275AF64'}, params);
        var _params = $.extend({
            dateAttrName: 'Date', 
            idAttrName: 'id',
            eventLayerName: '9C83E5446B324D61866DD461F1960C15', 
            imagesLayerName: '11916F0E290D40CE936EAAE74210EDBA',
            eventZoom: 14
        }, params);
        
        var imageLayer = map.layers[_params.imagesLayerName];
        var eventLayer = map.layers[_params.eventLayerName];
        
        var drawImageRow = function(imageInfo)
        {
            var dateString = $.datepicker.formatDate('dd.mm.yy', parseMSDate(imageInfo.properties[_params.dateAttrName])),
                nameLink = makeLinkButton(imageInfo.properties.Name);
                
            nameLink.onclick = function()
            {
                var newId = imageInfo.properties[_params.idAttrName];
                var prevId = activeImageManager.get();
                
                activeImageManager.set(newId === prevId ? null : newId);
            }
            
            var tr = _tr([
                _td([nameLink]),
                _td([_t(dateString)])
            ]);
            
            for (var i = 0; i < tr.childNodes.length; i++)
                tr.childNodes[i].style.width = this._fields[i].width;
                
            $("td", tr).css('textAlign', 'center');
            $(tr).data('imageid', imageInfo.properties[_params.idAttrName]).addClass('imageRow');
                
            return tr;
        }
        var drawEventRow = function(event)
        {
            var name = event.values[event.fields['OBJECT1'].index];
            var link = makeLinkButton(name);
            link.onclick = function()
            {
                var identityField = eventLayer.properties.identityField;
                var objectId = event.values[event.fields[identityField].index];
                sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&layer=" + _params.eventLayerName + "&page=0&pagesize=1&orderby=" + identityField + "&geometry=true&query='" + identityField + "'=" + objectId, function(response)
                {
                    showEventInfo(gmxAPI.from_merc_geometry(response.Result.values[0][0]));
                });
            }
            
            return _tr([
                _td([link])
            ]);
        }
        
        var curDrawingObject = null;
        var showEventInfo = function(geom)
        {
            curDrawingObject && curDrawingObject.remove();
            curDrawingObject = map.drawing.addObject($.extend(true, {}, geom));
            
            activeImageManager.set(null);
            var bounds = gmxAPI.getBounds(geom.coordinates);
            map.moveTo( 
                (bounds.minX + bounds.maxX)/2, 
                (bounds.minY + bounds.maxY)/2, 
                map.getBestZ(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY) 
            );
            
            var requestParams = {
                LayerNames: imageLayer.properties.name,
                MapName: imageLayer.properties.mapName,
                SearchString: "",
                border: JSON.stringify(gmxAPI.merc_geometry(geom)),
                WrapStyle: 'window'
            };

            sendCrossDomainPostRequest(serverBase + "SearchObject/SearchVector.ashx", requestParams, function(searchReq)
            {
                var imagesTable = new nsGmx.ScrollTable();
                var dataProvider = new nsGmx.ScrollTable.StaticDataProvider();
                dataProvider.setOriginalItems (searchReq.Result[0].SearchResult);
                dataProvider.setSortFunctions({'Дата': [
                    function(a,b){
                        if (a.properties[_params.dateAttrName] > b.properties[_params.dateAttrName]) 
                            return 1; 
                        else if (a.properties[_params.dateAttrName] < b.properties[_params.dateAttrName]) 
                            return -1; 
                        else 
                            return 0
                    },
                    function(a,b){
                        if (a.properties[_params.dateAttrName] < b.properties[_params.dateAttrName]) 
                            return 1; 
                        else if (a.properties[_params.dateAttrName] > b.properties[_params.dateAttrName]) 
                            return -1;
                        else
                            return 0
                    }
                ]});
                
                imagesTable.setDataProvider(dataProvider);
                
                //var canvas = _div();
                $(imagesCanvas).empty();
                imagesTable.createTable(imagesCanvas, "MonitoringImageInfo", 0, ["Имя", "Дата"], ["70%", "30%"], drawImageRow, {'Дата': true});
                imagesTable.setSortParams('Дата', 1);
                createMenuLazy();
                // $(imagesCanvas).empty().append(canvas);
            });
        }
        
        if (! (_params.eventLayerName in map.layers) )
            return;
            
        if (imageLayer.properties.Temporal)
        {
            nsGmx.widgets.commonCalendar.get().unbindLayer(_params.imagesLayerName);
            imageLayer.setDateInterval(new Date(2000, 1, 1), new Date(2100, 1, 1));
        }
        
        eventLayer.addListener('onClick', function(feature)
        {
            showEventInfo(feature.obj.getGeometry());
        })
        
        var eventsTable = new nsGmx.ScrollTable();
        var eventsDataProvider = new nsGmx.AttrTable.ServerDataProvider();
        
        var updateEventRequests = function(query)
        {
            eventsDataProvider.setRequests(
                serverBase + 'VectorLayer/Search.ashx', {count: true, layer: _params.eventLayerName, query: query},
                serverBase + 'VectorLayer/Search.ashx', {layer: _params.eventLayerName, query: query}
            );
        }
        updateEventRequests('');
        
        eventsTable.setDataProvider(eventsDataProvider);
        
        $(eventsCanvas).empty();
        eventsTable.createTable(eventsCanvas, "MonitoringEvents", 0, ["Событие"], ["100%"], drawEventRow, {});
        
        createMenuLazy();
        
        var typeAttrName = 'OBJECT_TYP';
        var Filters = function()
        {
            var def = $.Deferred();
            var types = {};
            //получаем все типы объектов
            eventsDataProvider.getItems(0, 10000, 'ogc_fid', true, function(events)
            {
                //console.log(events);
                for (var iE = 0; iE < events.length; iE++)
                    types[events[iE].values[events[iE].fields[typeAttrName].index]] = {isActive: true};
                
                def.resolve();
            })
            
            this.then = function(callback)
            {
                def.then(callback);
            }
            
            this.each = function(callback)
            {
                for (var t in types)
                    callback(t, types[t]);
            }
            
            this.setState = function(name, state)
            {
                types[name] = state;
                $(this).change();
            }
            
            this.getState = function(name)
            {
                return types[name];
            }
            
            this.toggleState = function(name)
            {
                if (!(name in types)) return;
                types[name].isActive = !types[name].isActive;
                $(this).change();
            }
        }
        
        var FiltersView = function(container, filters)
        {
            var draw = function()
            {
                $(container).empty();
                filters.each(function(name, state)
                {
                    var div = $('<div/>').addClass('eventFilterButton').text(name).click(function()
                    {
                        filters.toggleState(name);
                    });
                    
                    if (state.isActive)
                        div.addClass('eventFilterOn');
                        
                    $(container).append(div);
                });
            }
            filters.then(function()
            {
                $(filters).change(draw);
                draw();
            })
        }
        
        var filters = new Filters();
        var filtersView = new FiltersView(filtersCanvas, filters);
        
        filters.then(function()
        {
            $(filters).change(function()
            {
                var queries = [];
                filters.each(function(name, state)
                {
                    if (state.isActive)
                        queries.push('("OBJECT_TYP"=\'' + name + '\')')
                })
                
                var query = queries.length > 0 ? queries.join(" OR ") : '"OBJECT_TYP"=\'__NOT_EXISTS_VALUE__\'';
                updateEventRequests(query);
                eventLayer.setVisibilityFilter(query);
            })
        })
    }
}

gmxCore.addModule("MonitoringPlugin", publicInterface, {css: 'MonitoringPlugin.css'});

})()