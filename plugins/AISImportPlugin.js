(function()
{
    var createAISLayer = function(map, name, csvtext)
    {
        var splitLine = function(line)
        {
            if (!line) return [];
            var headersWithQuotes = line.match(/"[^"]*"/g);
            return headersWithQuotes ? $.map(headersWithQuotes, function(str) { return str.split('"')[1]; }) : line.split(',');
        }
        
        var convertCoordinates = function(row, type)
        {
            var geometry;
            if (row.length < 6) return;
            
            if (type === 'operative')
            {
                var parsedLat = row[4].match(/^(\d+).(\d+\.?\d*) (N|S)/);
                var parsedLng = row[5].match(/^(\d+).(\d+\.?\d*) (E|W)/);
                
                if (!parsedLat || !parsedLng)
                {
                    console && console.log(row);
                    return;
                }
                
                var lat = parseFloat(parsedLat[1]) + parseFloat(parsedLat[2])/60.0;
                var lon = parseFloat(parsedLng[1]) + parseFloat(parsedLng[2])/60.0;
                
                if (parsedLat[3] == 'S') lat = -lat;
                if (parsedLng[3] == 'W') lon = -lon;
                
                row[4] = lat;
                row[5] = lon;
                
                geometry = {type: 'POINT', coordinates: [row[5], row[4]]}
            }
            else
            {
                row[28] = parseFloat(row[28]);
                row[29] = parseFloat(row[29]);
                
                if (!row[28] ||!row[29])
                {
                    console && console.log(row);
                    return;
                }
                
                geometry = {type: 'POINT', coordinates: [row[28], row[29]]}
            }
            
            return {geometry: geometry, properties: row};
        }
        
        var lines = csvtext.split('\n');
        
        var headers = splitLine(lines.shift());
        var type = headers[4] === 'Latitude' ? 'operative' : 'archive';
        
        var data = [];
        $.each(lines, function(i, row){data.push(convertCoordinates(splitLine(row), type)) });
        
        // var columnsString = "&FieldsCount=" + headers.length;
        // for (var k = 0; k < headers.length; k++) {
            // columnsString += "&fieldName" + k + "=" + encodeURIComponent(headers[k]) + "&fieldType" + k + "=string";
        // }
        
        var mapProperties = _layersTree.treeModel.getMapProperties();
        
        var requestParams = {
            WrapStyle: 'window',
            Title: name,
            MapName: mapProperties.name,
            geometrytype: 'POINT',
            FieldsCount: headers.length
        }
        
        for (var k = 0; k < headers.length; k++) {
            requestParams["fieldName" + k] = headers[k];
            requestParams["fieldType" + k] = 'string';
        }
        
        sendCrossDomainPostRequest(serverBase + "VectorLayer/CreateVectorLayer.ashx", 
            requestParams,
            function(response)
            {
                if (!parseResponse(response))
                    return;
                    
                var targetDiv = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
                var gmxProperties = {type: 'layer', content: response.Result};
                gmxProperties.content.properties.mapName = mapProperties.name;
                gmxProperties.content.properties.hostName = mapProperties.hostName;
                gmxProperties.content.properties.visible = true;
                
                gmxProperties.content.properties.styles = [{
                    MinZoom: gmxProperties.content.properties.MinZoom, 
                    MaxZoom:21, 
                    RenderStyle:_mapHelper.defaultStyles[gmxProperties.content.properties.GeometryType]
                }];
                
                _layersTree.copyHandler(gmxProperties, targetDiv, false, true);
                
                //add data
                var objs = [];
                for (var iR = 0; iR < data.length; iR++) {
                
                    if (typeof data[iR] === 'undefined') continue;
                    
                    var properties = {};
                    
                    for (var iH = 0; iH < headers.length; iH++)
                        properties[headers[iH]] = data[iR].properties[iH];
                    
                    objs.push({
                        action: 'insert',
                        properties: properties,
                        geometry: gmxAPI.merc_geometry(data[iR].geometry)
                    });
                }
                
                var objects = JSON.stringify(objs);
                sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", 
                    {
                        WrapStyle: 'window', 
                        LayerName: gmxProperties.content.properties.name, 
                        objects: objects
                    }, function(response)
                    {
                        if (!parseResponse(response))
                            return;
                            
                        map.layers[gmxProperties.content.properties.name].chkLayerVersion();
                    }
                );
            })
    }
    
    var publicInterface = {
        afterViewer: function(params, map)
        {
            if (_queryMapLayers.currentMapRights() !== "edit")
                return;
                
            var canvas = $('<div/>').css({height: '100%', 'text-align': 'center', 'padding-top': '30%', 'font-size': '30px'}).text('Перетащите сюда AIS файлы');
            canvas.bind('dragover', function()
            {
                return false;
            });
            
            canvas.bind('drop', function(e)
            {
                $.each(e.originalEvent.dataTransfer.files, function(index, file)
                {
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        createAISLayer(map, file.name.substring(0, file.name.length - 4), evt.target.result);
                    };
                    reader.readAsText(file);
                })
                
                return false;
            })
            
            var menu = new leftMenu();
            menu.createWorkCanvas("aisdnd", function(){});
            _(menu.workCanvas, [canvas[0]], [['css', 'height', '300px'], ['css', 'width', '100%']]);
        }
    };
    
    gmxCore.addModule('AISImportPlugin', publicInterface, 
	{
        require: ['utilities']
	});
})();