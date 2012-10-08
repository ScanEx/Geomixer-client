(function()
{
    var createAISLayer = function(map, name, csvtext)
    {
        var splitLine = function(line)
        {
            if (!line) return [];
            return $.map(line.match(/"[^"]*"/g), function(str) { return str.split('"')[1]; });
        }
        
        var convertCoordinates = function(row)
        {
            if (row.length < 6) return;
            var parsedLat = row[4].match(/^(\d+).(\d+\.?\d*) (N|S)/);
            var parsedLng = row[5].match(/^(\d+).(\d+\.?\d*) (E|W)/);
            
            if (!parsedLat || !parsedLng)
            {
                console.log(row);
                return;
            }
            
            var lat = parseFloat(parsedLat[1]) + parseFloat(parsedLat[2])/60.0;
            var lon = parseFloat(parsedLng[1]) + parseFloat(parsedLng[2])/60.0;
            
            if (parsedLat[3] == 'S') lat = -lat;
            if (parsedLng[3] == 'W') lon = -lon;
            
            row[4] = lat;
            row[5] = lon;
            
            return row;
        }
        
        var lines = csvtext.split('\n');
        
        var headers = splitLine(lines.shift());
        
        var data = [];
        $.each(lines, function(i, row){ data.push(convertCoordinates(splitLine(row))) });
        
        var columnsString = "&FieldsCount=" + headers.length;
        for (var k = 0; k < headers.length; k++) {
            columnsString += "&fieldName" + k + "=" + encodeURIComponent(headers[k]) + "&fieldType" + k + "=string";
        }
        
        var mapProperties = _layersTree.treeModel.getMapProperties();
        sendCrossDomainJSONRequest(serverBase + "VectorLayer/CreateVectorLayer.ashx?WrapStyle=func" + 
            "&Title=" + encodeURIComponent(name) + 
            "&Copyright=" + 
            "&Description=" + 
            "&MapName=" + encodeURIComponent(mapProperties.name) + 
            columnsString +
            "&geometrytype=POINT",
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
                        properties[headers[iH]] = data[iR][iH];
                    
                    objs.push({
                        action: 'insert',
                        properties: properties,
                        geometry: gmxAPI.merc_geometry({type: 'POINT', coordinates: [data[iR][5], data[iR][4]]})
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
                    //console.log(file);
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        createAISLayer(map, file.name.substring(0, file.name.length - 4), evt.target.result);
                    };
                    reader.readAsText(file);
                })
                
                //console.log(e);
                return false;
            })
            
            var menu = new leftMenu();
            menu.createWorkCanvas("aisdnd", function(){});
            _(menu.workCanvas, [canvas[0]], [['css', 'height', '300px'], ['css', 'width', '100%']]);
            
            //showDialog('Test DnD', canvas[0], {width: 300, height: 300});
        }
    };
    
    gmxCore.addModule('AISImportPlugin', publicInterface, 
	{
        require: ['utilities']
        /*init: function(module, path)
		{
            return gmxCore.loadScriptWithCheck([{
                check: function(){ return jQuery.fn.filedrop; },
                script: path + 'jquery.filedrop.js'
            }]);
        }*/
	});
})();