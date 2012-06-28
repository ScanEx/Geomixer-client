(function(){

var getScreenGeometry = function(latlngX, latlngY, z)
{
    var ww = 2 * gmxAPI.worldWidthMerc;
    var x = gmxAPI.merc_x(latlngX) + ww;
    x = x % ww;
    if(x > gmxAPI.worldWidthMerc) x -= ww;
    if(x < -gmxAPI.worldWidthMerc) x += ww;

    var y = gmxAPI.merc_y(latlngY);
    var scale = gmxAPI.getScale(z);

    var w2 = scale * gmxAPI._div.clientWidth/2;
    var h2 = scale * gmxAPI._div.clientHeight/2;
    var e = {
        minX: gmxAPI.from_merc_x(x - w2),
        minY: gmxAPI.from_merc_y(y - h2),
        maxX: gmxAPI.from_merc_x(x + w2),
        maxY: gmxAPI.from_merc_y(y + h2)
    };
    
    return {
        type: "POLYGON",
        coordinates: [[[e.minX, e.minY], [e.minX, e.maxY], [e.maxX, e.maxY], [e.maxX, e.minY], [e.minX, e.minY]]]
    };
}

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
        var menuCanvas = _div(null, [['css', 'padding', '0px 20px 0px 3px']]);
        var createMenuLazy = function()
        {
            if (menuCreated) return;
            var menu = new leftMenu();
            menu.createWorkCanvas("monitoring_demo", function(){});
            _(menu.workCanvas, [menuCanvas]);
            menuCreated = true;
        }
        // var _params = $.extend({eventLayerName: '4B4E9CB3FF9C4B01B378486FFDA42C9B', imagesLayerName: '14D281B634BE445F83781B528275AF64'}, params);
        var _params = $.extend({
            dateAttrName: 'Date', 
            idAttrName: 'id',
            eventLayerName: '9C83E5446B324D61866DD461F1960C15', 
            imagesLayerName: '11916F0E290D40CE936EAAE74210EDBA'
        }, params);
        
        var drawImage = function(imageInfo)
        {
            var dateString = $.datepicker.formatDate('dd.mm.yy', parseMSDate(imageInfo.properties[_params.dateAttrName])),
                nameLink = makeLinkButton(imageInfo.properties.Name);
                
            nameLink.onclick = function()
            {
                imageLayer.setVisibilityFilter('"' + _params.idAttrName + '"=' + imageInfo.properties[_params.idAttrName]);
            }
            
            var tr = _tr([
                _td([nameLink]),
                _td([_t(dateString)])
            ]);
            
            for (var i = 0; i < tr.childNodes.length; i++)
                tr.childNodes[i].style.width = this._fields[i].width;
                
            $("td", tr).css('textAlign', 'center');
                
            return tr;
        }
        
        if (! (_params.eventLayerName in map.layers) )
            return;
            
        var imageLayer = map.layers[_params.imagesLayerName];
        
        map.layers[_params.eventLayerName].addListener('onClick', function(feature)
        {
            var geom = feature.obj.getGeometry();
            var bounds = gmxAPI.getBounds(geom.coordinates);
            map.moveTo( (bounds.minX + bounds.maxX)/2, (bounds.minY + bounds.maxY)/2, 10);
            
            var requestParams = {
                LayerNames: imageLayer.properties.name,
                MapName: imageLayer.properties.mapName,
                SearchString: "",
                border: JSON.stringify(gmxAPI.merc_geometry(geom)),
                WrapStyle: 'window'
            };

            sendCrossDomainPostRequest(serverBase + "SearchObject/SearchVector.ashx", requestParams, function(searchReq)
            {
                var imagesTable = new scrollTable();
                var dataProvider = new scrollTable.StaticDataProvider();
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
                
                var canvas = _div();                
                imagesTable.createTable(canvas, "MonitoringImageInfo", 0, ["Имя", "Дата"], ["70%", "30%"], drawImage, {'Дата': true});
                imagesTable.setSortParams('Дата', 1);
                createMenuLazy();
                $(menuCanvas).empty().append(canvas);
                
                //showDialog("Список изображений", canvas, 350, 400);
            });
        })
    }
}

gmxCore.addModule("MonitoringPlugin", publicInterface);

})()