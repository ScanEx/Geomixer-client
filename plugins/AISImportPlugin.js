//Плагин для импорта csv файлов из системы AIS в Геомиксер. 
//Просто перетаскиваешь файл на левую панель - получается слой в дереве слоёв со всеми точками судов
!(function(_)
{
    var addDataToLayer = function(map, layerName, data, headers)
    {
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
                LayerName: layerName, 
                objects: objects
            }, function(response)
            {
                if (!parseResponse(response))
                    return;
                    
                map.layers[layerName].chkLayerVersion();
            }
        );
    }
    
    var parseData = function(csvtext)
    {
        var splitLine = function(line)
        {
            if (!line) return [];
            var headersWithQuotes = line.match(/"[^"]*"/g);
            return headersWithQuotes ? $.map(headersWithQuotes, function(str) { return str.split('"')[1]; }) : line.split(',');
        }
        
        var parseDateTime = function(dateStr)
        {
            var pt = dateStr.match(/^(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})$/);
            return pt ? Date.UTC(pt[1], pt[2]-1, pt[3], pt[4], pt[5], pt[6])/1000 : null;
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
                
                row[3] = parseDateTime(row[3]);
                
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
        
        return {
            data: data,
            headers: headers,
            type: type
        }
    }
    
    var createAISLayer = function(map, name, csvtext, createTemporal)
    {
        var pd = parseData(csvtext);
        
        var Columns = [];
        
        for (var k = 0; k < pd.headers.length; k++) {
            Columns.push({
                Name: pd.headers[k], 
                ColumnSimpleType: 'String',
                IsPrimary: false, 
                IsIdentity: false, 
                IsComputed: false
            });
        }
        
        var temporalParams;
        if (pd.type === 'archive')
        {
            Columns[3].ColumnSimpleType = 'DateTime'
            if (createTemporal)
            {
                temporalParams = new nsGmx.TemporalLayerParams({
                    isTemporal: true,
                    minPeriod: 1,
                    maxPeriod: 64,
                    columnName: Columns[3].Name
                })
            }
        }
        
        var layerProperties = new nsGmx.LayerProperties({
            Type: 'Vector',
            Title: name,
            GeometryType: 'POINT',
            Columns: Columns,
            SourceType: 'manual',
            Temporal: temporalParams
        })
        
        layerProperties.save(false, function(response) {
            if (!parseResponse(response))
                return;
                
            var mapProperties = _layersTree.treeModel.getMapProperties();
                
            var targetDiv = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
            var gmxProperties = {type: 'layer', content: response.Result};
            gmxProperties.content.properties.mapName = mapProperties.name;
            gmxProperties.content.properties.hostName = mapProperties.hostName;
            gmxProperties.content.properties.visible = true;
            
            gmxProperties.content.properties.styles = [{
                MinZoom: gmxProperties.content.properties.VtMaxZoom, 
                MaxZoom:21, 
                RenderStyle:_mapHelper.defaultStyles[gmxProperties.content.properties.GeometryType]
            }];
            
            _layersTree.copyHandler(gmxProperties, targetDiv, false, true);
            
            addDataToLayer(map, gmxProperties.content.properties.name, pd.data, pd.headers);
        })
    }
    
    var addToAISLayer = function(map, csvtext)
    {
        var active = $(_queryMapLayers.buildedTree).find(".active");
        
        if (!active.length)
        {
            alert('Сделайте активным слой с AIS данными!');
            return;
        }
        
        var pd = parseData(csvtext);
        var layerName = active[0].parentNode.gmxProperties.content.properties.name;
        
        addDataToLayer(map, layerName, pd.data, pd.headers);
    }
    
    var publicInterface = {
        afterViewer: function(params, map)
        {
            if (_queryMapLayers.currentMapRights() !== "edit")
                return;
                
            var canvas = $('<div/>');
            var dropZone = $('<div/>').css({'text-align': 'center', 'padding-top': '30%', 'font-size': '30px', height: '100px'}).text('Перетащите сюда AIS файлы').appendTo(canvas);
            dropZone.bind('dragover', function()
            {
                return false;
            });
            
            dropZone.bind('drop', function(e)
            {
                $.each(e.originalEvent.dataTransfer.files, function(index, file)
                {
                    var reader = new FileReader();
                    reader.onload = function(evt) {
                        if (chkAddToLayer[0].checked)
                            addToAISLayer(map, evt.target.result)
                        else
                            createAISLayer(map, file.name.substring(0, file.name.length - 4), evt.target.result, chkTemporal[0].checked);
                    };
                    reader.readAsText(file);
                })
                
                return false;
            })
            
            var chkTemporal = $('<input/>', {type: 'checkbox', id: 'aisimport-temporal'}).css('margin', '3px').appendTo(canvas);
            var chkAddToLayer = $('<input/>', {type: 'checkbox', id: 'aisimport-addtolayer'}).css('margin', '3px').appendTo(canvas);
            
            canvas.append(
                $('<div/>')
                    .append(chkTemporal)
                    .append($('<label/>', {'for': 'aisimport-temporal'}).text('Мультивременной слой')),
                $('<div/>')
                    .append(chkAddToLayer)
                    .append($('<label/>', {'for': 'aisimport-addtolayer'}).text('Добавить в активный слой'))
            )
            
            var menu = new leftMenu();
            menu.createWorkCanvas("aisdnd", function(){});
            _(menu.workCanvas, [canvas[0]], [['css', 'width', '100%']]);
        }
    };
    
    gmxCore.addModule('AISImportPlugin', publicInterface, 
	{
        require: ['utilities', 'LayerProperties']
	});
})(nsGmx.Utils._);