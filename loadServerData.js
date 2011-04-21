var loadServerData = 
{
	WFS:{},
	WMS:{}
}

/* Порядок координат в WFS зависит от формата SRS (http://geoserver.org/display/GEOSDOC/2.+WFS+-+Web+Feature+Service)
    * EPSG:xxxx: longitude/latitude (supported in WFS 1.1 requests too)
    * http://www.opengis.net/gml/srs/epsg.xml#xxxx: longitude/latitude (supported in WFS 1.1 requests too)
    * urn:x-ogc:def:crs:EPSG:xxxx: latitude/longitude
*/

var wfsParser = function()
{
	this.gmlns = 'http://www.opengis.net/gml';
	this.kmlns = 'http://earth.google.com/kml/2.0';
	
	this.axisOrder = null;
}

wfsParser.prototype.elementsNS = function(node,uri,name)
{
	var elements=[];
	
	if (node.getElementsByTagNameNS)
		elements = node.getElementsByTagNameNS(uri,name);
	else
	{
		var allNodes = node.getElementsByTagName("*"),
			potentialNode,
			fullName;
		
		for (var i = 0, len = allNodes.length; i < len ; ++i)
		{
			potentialNode = allNodes[i];
			fullName = (potentialNode.prefix) ? (potentialNode.prefix + ":" + name) : name;
			if ((name == "*") || (fullName == potentialNode.nodeName))
			{
				if( (uri == "*") || (uri == potentialNode.namespaceURI))
					elements.push(potentialNode);
			}
		}
	}
	
	return elements;
}

wfsParser.prototype.getChildValue = function(node, def)
{
	var value = def || "";
	if (node)
	{
		for(var child = node.firstChild; child; child = child.nextSibling)
		{
			switch (child.nodeType)
			{
				case 3:
				case 4: value += child.nodeValue;
			}
		}
	}
	
	return value;
}

wfsParser.prototype.parse = function(response, srs)
{
	var geometries = [],
		strResp = response.replace(/[\t\n\r]/g, ' '),
		strResp = strResp.replace(/\s+/g, ' '),
		xml = parseXML(strResp),
		parsedNS = strResp.indexOf('<kml') > -1 ? this.kmlns : this.gmlns;
	
	this.axisOrder = srs && srs.indexOf("urn:") == 0 ? 'latlong' : 'longlat';
	
	var order = ["Polygon","LineString","Point"];
	
	for (var i = 0, len = order.length; i < len; ++i)
	{
		var type = order[i],
			nodeList = this.elementsNS(xml.documentElement,parsedNS,type);
		
		for (var j = 0; j < nodeList.length; ++j)
		{
			geometry = this['parse' + type].apply(this,[nodeList[j]]);
			
			if (geometry)
				geometries.push(geometry);
		}
	}
	
	return geometries;
}

wfsParser.prototype.parsePoint = function(node)
{
	var coordString,
		coords=[],
		nodeList = this.elementsNS(node,this.gmlns,"pos");
	
	if (nodeList.length > 0)
	{
		coordString = strip(nodeList[0].firstChild.nodeValue);
		coords = coordString.split(" ");
	}
	if (coords.length == 0)
	{
		nodeList = this.elementsNS(node,this.gmlns,"coordinates");
		
		if (nodeList.length > 0)
		{
			coordString = strip(nodeList[0].firstChild.nodeValue);
			coords = coordString.split(",");
		}
	}
	if (coords.length == 0)
	{
		nodeList = this.elementsNS(node,this.gmlns,"coord");
		
		if (nodeList.length > 0)
		{
			var xList = this.elementsNS(nodeList[0],this.gmlns,"X"),
				yList = this.elementsNS(nodeList[0],this.gmlns,"Y");
			
			if (xList.length > 0 && yList.length > 0)
				coords = [xList[0].firstChild.nodeValue, yList[0].firstChild.nodeValue];
		}
	}
	
	return {feature:{}, geometry:{type: 'POINT', coordinates: this.swapCoordinates([Number(coords[0]), Number(coords[1])])}}
}

wfsParser.prototype.parseLineString = function(node)
{
	var nodeList,
		coordString,
		coords = [],
		points = [],
		nodeList = this.elementsNS(node,this.gmlns,"posList");
	
	if (nodeList.length > 0)
	{
		coordString = strip(this.getChildValue(nodeList[0]));
		coords = coordString.split(" ");
		
		for (var i = 0; i < coords.length / 2; ++i)
		{
			j = i * 2;
			x = coords[j];
			y = coords[j + 1];
			
			points.push(this.swapCoordinates([Number(coords[j]), Number(coords[j + 1])]));
		}
	}
	if (coords.length == 0)
	{
		nodeList = this.elementsNS(node,this.gmlns,"coordinates");
		
		if (nodeList.length > 0)
		{
			coordString = strip(this.getChildValue(nodeList[0]));
			coordString = coordString.replace(/\s*,\s*/g,",");
			
			var pointList = coordString.split(" ");
			
			for (var i = 0; i < pointList.length; ++i)
			{
				coords = pointList[i].split(",");
				
				points.push(this.swapCoordinates([Number(coords[0]), Number(coords[1])]));
			}
		}
	}
	
	if (points.length != 0)
	{
		return {feature:{}, geometry:{type: 'LINESTRING', coordinates: points}}
	}
	else
		return false
		
}

wfsParser.prototype.parsePolygon = function(node)
{
	var nodeList = this.elementsNS(node,this.gmlns,"LinearRing"),
		components = [];
	
	if (nodeList.length > 0)
	{
		var ring;
		
		for (var i = 0; i < nodeList.length; ++i)
		{
			ring = this.parseLineString.apply(this,[nodeList[i],true]);
			
			if (ring)
				components.push(ring.geometry.coordinates);
		}
	}
	
	return {feature:{}, geometry:{type: 'POLYGON', coordinates: components}}
}

wfsParser.prototype.swapCoordinates = function(arr)
{
	if (this.axisOrder == 'latlong')
		return [arr[1], arr[0]]
	else
		return [arr[0], arr[1]];
}

var _wfsParser = new wfsParser();

var jsonParser = function()
{
	this.axisOrder = null;
}

jsonParser.prototype.parse = function(response, srs)
{
	var resp = JSON.parse(response),
		geometries = [];
	
	this.axisOrder = srs && srs.indexOf("urn:") == 0 ? 'latlong' : 'longlat';
	
	for (var i = 0; i < resp.features.length; i++)
	{
		if (resp.features[i].geometry.type.toLowerCase().indexOf('point') > -1)
			this.parsePoint(resp.features[i], geometries);
		else if (resp.features[i].geometry.type.toLowerCase().indexOf('linestring') > -1)
			this.parseLineString(resp.features[i], geometries);
		else if (resp.features[i].geometry.type.toLowerCase().indexOf('polygon') > -1)
			this.parsePolygon(resp.features[i], geometries);
	}
	
	return geometries;
}

jsonParser.prototype.parsePoint = function(feature, geometryArr)
{
	if (feature.geometry.type.toLowerCase().indexOf('multi') < 0)
		geometryArr.push({feature: feature, geometry:{type: 'POINT', coordinates: this.swapCoordinates(feature.geometry.coordinates)}});
	else
	{
		for (var i = 0; i < feature.geometry.coordinates.length; i++)
			geometryArr.push({feature: feature, geometry:{type: 'POINT', coordinates: this.swapCoordinates(feature.geometry.coordinates[i])}})
	}
}
jsonParser.prototype.parseLineString = function(feature, geometryArr)
{
	if (feature.geometry.type.toLowerCase().indexOf('multi') < 0)
	{
		var newCoords = [];
		
		for (var j = 0; j < feature.geometry.coordinates.length; j++)
			newCoords.push(this.swapCoordinates(feature.geometry.coordinates[j]))
		
		geometryArr.push({feature: feature, geometry:{type: 'LINESTRING', coordinates: newCoords}});
	}
	else
	{
		for (var i = 0; i < feature.geometry.coordinates.length; i++)
		{
			var newCoords = [];
		
			for (var j = 0; j < feature.geometry.coordinates[i].length; j++)
				newCoords.push(this.swapCoordinates(feature.geometry.coordinates[i][j]))
			
			geometryArr.push({feature: feature, geometry:{type: 'LINESTRING', coordinates: newCoords}});
		}
	}
}
jsonParser.prototype.parsePolygon = function(feature, geometryArr)
{
	if (feature.geometry.type.toLowerCase().indexOf('multi') < 0)
	{
		var newCoords = [];
		
		for (var k = 0; k < feature.geometry.coordinates.length; j++)
		{
			var newCoords2 = [];
			
			for (var j = 0; j < feature.geometry.coordinates[k].length; k++)
				newCoords2.push(this.swapCoordinates(feature.geometry.coordinates[k][j]))
			
			newCoords.push(newCoords2)
		}
		
		geometryArr.push({feature: feature, geometry:{type: 'POLYGON', coordinates: newCoords}});
	}
	else
	{
		for (var i = 0; i < feature.geometry.coordinates.length; i++)
		{
			var newCoords = [];
			
			for (var k = 0; k < feature.geometry.coordinates[i].length; k++)
			{
				var newCoords2 = [];
				
				for (var j = 0; j < feature.geometry.coordinates[i][k].length; j++)
					newCoords2.push(this.swapCoordinates(feature.geometry.coordinates[i][k][j]))
				
				newCoords.push(newCoords2)
			}
			
			geometryArr.push({feature: feature, geometry:{type: 'POLYGON', coordinates: newCoords}});
		}
	}
}
jsonParser.prototype.swapCoordinates = function(arr)
{
	if (this.axisOrder == 'latlong')
		return [arr[1], arr[0]]
	else
		return [arr[0], arr[1]];
}

var _jsonParser = new jsonParser();

var queryServerData = function()
{
	this.inputField = null;
	this.parentCanvas = null;
	
	this.wfsFormats = {};
	
	this.oldBalloon = false;
	this.oldBalloonIndex = -1;
	
	this.proj = ['EPSG:4326','EPSG:3395','EPSG:41001'];
}

queryServerData.prototype = new leftMenu();

queryServerData.prototype.load = function(parseFunc, drawFunc)
{
	window.convertCoords = function(coordsStr)
	{
		var res = [],
			coordsPairs = strip(coordsStr).replace(/\s+/,' ').split(' ');
		
		if (coordsStr.indexOf(',') == -1)
		{
			for (var j = 0; j < Math.floor(coordsPairs.length / 2); j++)
				res.push([Number(coordsPairs[2 * j + 1]), Number(coordsPairs[2 * j])])
		}
		else
		{
			for (var j = 0; j < coordsPairs.length; j++)
			{
				var parsedCoords = coordsPairs[j].split(',');
				
				res.push([Number(parsedCoords[1]), Number(parsedCoords[0])])
			}
		}
		
		return res;
	}
	
	window.parseGML = function(response, format, srs)
	{
		if (format == 'gml')
			return _wfsParser.parse(response, srs);
		else if (format == 'json')
			return _jsonParser.parse(response, srs);
		else
			return [];
	}
	
	var inputField = _input(null, [['dir','className','inputStyle'],['css','width','200px']]),
		inputError = function()
		{
			$(inputField).addClass('error');
			
			setTimeout(function()
			{
				if (inputField)
					$(inputField).removeClass('error');
			}, 1000)
		};
	
	this.parentCanvas = _div(null, [['dir','className','serverDataCanvas']]);
	
	var goButton = makeButton(_gtxt("Загрузить")),
		_this = this;
	
	goButton.onclick = function()
	{
		if (inputField.value != '')
		{
			_this.getCapabilities(strip(inputField.value), parseFunc, drawFunc);
				
			inputField.value = '';
		}
		else
			inputError();
	}
	
	inputField.onkeydown = function(e)
	{
		var evt = e || window.event;
	  	if (getkey(evt) == 13) 
	  	{	
			if (inputField.value != '')
			{
				_this.getCapabilities(strip(inputField.value), parseFunc, drawFunc);
					
				inputField.value = '';
			}
			else
				inputError();
	  		
	  		return false;
	  	}
	}
	
	var canvas = _div([_div([_span([_t(_gtxt("URL сервера"))])], [['css','marginBottom','3px']]),_table([_tbody([_tr([_td([inputField]),_td([goButton])])])], [['css','marginBottom','5px']])],[['css','margin','3px 0px 0px 10px']])

	_(this.workCanvas, [canvas, this.parentCanvas])
}

queryServerData.prototype.getCapabilities = function(url, parseFunc, drawFunc)
{
	var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t('загрузка...')], [['css','margin','3px 0px 3px 20px']]),
		_this = this;
	
	if (this.parentCanvas.childNodes.length == 0)
		_(this.parentCanvas, [loading]);
	else
		this.parentCanvas.insertBefore(loading, this.parentCanvas.firstChild);
	
	sendCrossDomainJSONRequest(getAPIHostRoot() + "ApiSave.ashx?debug=1&get=" + encodeURIComponent(url + '?request=GetCapabilities'), function(response)
	{
		var servicelayers = parseFunc.call(_this, response);
		
		drawFunc.call(_this, servicelayers, url, loading);
	})
}

queryServerData.prototype.parseWMSCapabilities = function(response)
{
	var serviceLayers = [],
		strResp = response.replace(/[\t\n\r]/g, ' '),
		strResp = strResp.replace(/\s+/g, ' '),
		layersXML = parseXML(response).getElementsByTagName('Layer');
	
	for (var i = 0; i < layersXML.length; i++)
	{
		var layer = {},
			name = layersXML[i].getElementsByTagName('Name'),
			title = layersXML[i].getElementsByTagName('Title'),
			bbox = layersXML[i].getElementsByTagName('LatLonBoundingBox'),
			srs = layersXML[i].getElementsByTagName('SRS');
		
		if (srs.length)
		{
			layer.srs = getTextContent(srs[0]);
			layer.srs = strip(layer.srs);
			
			if (!valueInArray(this.proj, layer.srs))
				continue;
		}
		else
			layer.srs = this.proj[0];
		
		if (name.length)
			layer.name = getTextContent(name[0]);
		
		if (bbox.length)
		{
			layer.bbox = 
			{
				minx: Number(bbox[0].getAttribute('minx')),
				miny: Number(bbox[0].getAttribute('miny')),
				maxx: Number(bbox[0].getAttribute('maxx')),
				maxy: Number(bbox[0].getAttribute('maxy'))
			};
		}
		
		if (title.length)
			layer.title = getTextContent(title[0]);
		
		if (layer.name)
			serviceLayers.push(layer);
	}
	
	return serviceLayers;
}

queryServerData.prototype.parseWFSCapabilities = function(response)
{
	var serviceLayers = [],
		strResp = response.replace(/[\t\n\r]/g, ' '),
		strResp = strResp.replace(/\s+/g, ' '),
		featuresXML = parseXML(response).getElementsByTagName('FeatureType');
	
	for (var i = 0; i < featuresXML.length; i++)
	{
		var layer = {},
			name = featuresXML[i].getElementsByTagName('Name'),
			title = featuresXML[i].getElementsByTagName('Title'),
			srs = featuresXML[i].getElementsByTagName('DefaultSRS');
		
		if (name.length)
			layer.name = getTextContent(name[0]);
		
		if (title.length)
			layer.title = getTextContent(title[0]);
		
		if (srs.length)
			layer.srs = getTextContent(srs[0]);
		
		if (layer.name)
			serviceLayers.push(layer);
	}
	
	return serviceLayers;
}

queryServerData.prototype.loadGML = function(url, parentTreeCanvas, box, header, format, loadLayerParams, srs)
{
	var _this = this;
	
	sendCrossDomainJSONRequest(getAPIHostRoot() + "ApiSave.ashx?get=" + encodeURIComponent(url), function(response)
	{
		var geometries = parseGML(response, format, srs);
		_this.drawGML(geometries, url, parentTreeCanvas, box, header, loadLayerParams);
	})
}

queryServerData.prototype.saveGML = function(geometries)
{
	if (typeof geometries == 'undefined' || geometries == null)
	{
		geometries = [];
		
		globalFlashMap.drawing.forEachObject(function(ret)
		{
			geometries.push(ret.geometry);
		})
	}
	
	window.promptFunction(_gtxt('Введите имя gml-файла для скачивания:'), 'objects.gml', function(fileName)
	{
		globalFlashMap.saveObjects(geometries, translit(fileName));
	});
	
	return false;
}

queryServerData.prototype.drawGML = function(geometries, url, parentTreeCanvas, box, header, loadLayerParams)
{
	var parent = {
					'POINT': globalFlashMap.addObject(),
					'LINESTRING': globalFlashMap.addObject(),
					'POLYGON': globalFlashMap.addObject()
				},
		styles = {
					'POINT': typeof loadLayerParams != 'undefined' && loadLayerParams['point'] ? loadLayerParams['point'].RenderStyle : { marker: { size: 2 }, outline: { color: 0x0000ff, thickness: 1 } },
					'LINESTRING': typeof loadLayerParams != 'undefined' && loadLayerParams['linestring'] ? loadLayerParams['linestring'].RenderStyle : { outline: { color: 0x0000ff, thickness: 2 } },
					'POLYGON': typeof loadLayerParams != 'undefined' && loadLayerParams['polygon'] ? loadLayerParams['polygon'].RenderStyle : { outline: { color: 0x0000ff, thickness: 2, opacity: 100 }, fill: {color: 0xffffff, opacity: 20} }
				};
	parent['POINT'].setStyle(styles['POINT']);
	parent['LINESTRING'].setStyle(styles['LINESTRING']);
	parent['POLYGON'].setStyle(styles['POLYGON']);
	
	var geomsPresent = {},
		bounds = getBounds();
	
	for (var i = 0; i < geometries.length; i++)
	{
		var elem = parent[geometries[i].geometry.type].addObject(geometries[i].geometry);
		
		if (objLength(geometries[i].feature) > 0)
		{
			(function(i)
			{
				elem.setHandler("onClick", function(obj)
				{
					var elemCanvas = $(divCanvas).find("[geometryType='" + geometries[i].geometry.type + "']")[0];
					
					if (!elemCanvas.graphDataProperties ||
						!geometries[i].feature.properties)
						return;
					
					var balloonCanvas = _div();
						
					if (!_diagram.createBalloon(obj, balloonCanvas))
						return;
					
					if (_diagram.createDateTimeDiagramByAttrs(balloonCanvas, 500, 300, geometries[i].feature.properties, elemCanvas.graphDataProperties))
						_diagram.oldBalloon.resize();
				})
			})(i);
		}
		
		geomsPresent[geometries[i].geometry.type] = true;
		
		bounds.update(geometries[i].geometry.coordinates);
	}
	
	var divCanvas = _div(),
		divChilds = _div(),
		spanHeader = _span([_t(url.length < 45 ? url : url.substr(0, 45) + '...')]),
		_this = this;
	
	var clickFunc = function(flag)
	{
		parent['POINT'].setVisible(flag);
		parent['LINESTRING'].setVisible(flag);
		parent['POLYGON'].setVisible(flag);
		
		if (flag)
			show(divChilds);
		else
			hide(divChilds);
	}
	
	parentTreeCanvas.loaded = function() // переопределим функцию загрузки слоя на центрирование
	{
		if (!box.checked)
		{
			clickFunc.call(_this, true);
			
			box.checked = true;
		}
		
		globalFlashMap.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
	}
	
	parentTreeCanvas.clear = function()
	{
		parent['POINT'].remove();
		parent['LINESTRING'].remove();
		parent['POLYGON'].remove();
		
		divCanvas.removeNode(true);
	}
	
	box.onclick = function()
	{
		clickFunc.call(_this, this.checked);
	}
	
	removeChilds(parentTreeCanvas);
	
	if (parentTreeCanvas.childNodes.length == 0)
		_(parentTreeCanvas, [divCanvas]);
	else
		parentTreeCanvas.insertBefore(divCanvas, parentTreeCanvas.firstChild);
	
	_(divCanvas, [divChilds]);
	
	for (var type in geomsPresent)
	{
		var elemCanvas = _div(null, [['css','padding','2px'],['attr','geometryType', type]]),
			icon = _mapHelper.createStylesEditorIcon([{MinZoom:1,MaxZoom:20,RenderStyle:styles[type]}], type.toLowerCase()),
			spanElem = _span(null, [['dir','className','layerfeature']]);
		
		if (type == 'POINT')
			_(spanElem, [_t(_gtxt('точки'))]);
		else if (type == 'LINESTRING')
			_(spanElem, [_t(_gtxt('линии'))]);
		else if (type == 'POLYGON')
			_(spanElem, [_t(_gtxt('многоугольники'))]);
		
		(function(type){
			_mapHelper.createWFSStylesEditor(parent[type], styles[type], icon, type.toLowerCase(), divCanvas)
		})(type);
		
		if (typeof loadLayerParams != 'undefined' && loadLayerParams[type.toLowerCase()])
		{
			var info = loadLayerParams[type.toLowerCase()];
			
			elemCanvas.graphDataType = info.graphDataType;
			elemCanvas.graphDataProperties = info.graphDataProperties;
		}
		else
		{
			elemCanvas.graphDataType = "func";
			elemCanvas.graphDataProperties = "";
		}
		
		_(elemCanvas, [icon, spanElem])
		_(divChilds, [elemCanvas]);
		
	}
	
	globalFlashMap.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
	
	box.checked = true;
}

queryServerData.prototype.drawWMS = function(serviceLayers, url, replaceElem, loadParams)
{
	var ulCanvas = _ul(null, [['css','paddingBottom','5px'], ['attr','url',url]]),
		ulChilds = _ul(),
		remove = makeImageButton('img/closemin.png','img/close_orange.png'),
		_this = this;
	
	$(replaceElem).replaceWith(ulCanvas)
	
	remove.onclick = function()
	{
		for (var i = 0; i < ulChilds.childNodes.length; i++)
			ulChilds.childNodes[i].firstChild.lastChild.clear && ulChilds.childNodes[i].firstChild.lastChild.clear();
		
		this.parentNode.parentNode.parentNode.removeNode(true);
	}
	
	remove.className = 'remove';
	remove.style.right = '0px';
	
	_(ulCanvas, [_li([_div([_span([_t(url.length < 45 ? url : url.substr(0, 45) + '...')],[['dir','className','urlHeader']]), remove],[['css','position','relative']]), ulChilds])])
	
	var clickFunc = function(layer, parent, flag)
	{
		if (!flag)
			parent.setVisible(false);
		else
		{
			updateFunc(layer, parent);
						
			parent.setVisible(true);
		}
	}
	var updateFunc = function(layer, parent)
	{
		var mapBounds = _mapHelper.getMapBounds(),
			minx = mapBounds.left,
			miny = mapBounds.bottom,
			maxx = mapBounds.right,
			maxy = mapBounds.top;
		
		if (layer.bbox)
		{
			minx = Math.max(layer.bbox.minx, minx);
			miny = Math.max(layer.bbox.miny, miny);
			maxx = Math.min(layer.bbox.maxx, maxx);
			maxy = Math.min(layer.bbox.maxy, maxy);
			
			if (minx >= maxx || miny >= maxy)
				return
		}
		
		var srsMinx = minx,
			srsMiny = miny,
			srsMaxx = maxx,
			srsMaxy = maxy;
		
		if (layer.srs != _queryServerDataWMS.proj[0])
		{
			srsMinx = merc_x(minx),
			srsMiny = merc_y(miny),
			srsMaxx = merc_x(maxx),
			srsMaxy = merc_y(maxy);
		}
		
		var imgUrl = url + "?request=GetMap&layers=" + layer.name + "&srs=" + layer.srs + "&format=image/jpeg&styles=&width=" + mapBounds.width + "&height=" + mapBounds.height + "&bbox=" + srsMinx + "," + srsMiny + "," + srsMaxx + "," + srsMaxy;
		
		parent.setImage(imgUrl, minx, maxy, maxx, maxy, maxx, miny, minx, miny);
	}
	
	for (var i = 0; i < serviceLayers.length; i++)
	{
		var elemCanvas = _div(null, [['css','padding','2px']]),
			box = _checkbox(false, 'checkbox'),
			spanElem = _span([_t(serviceLayers[i].title)], [['css','cursor','pointer'],['dir','className','layerfeature']]),
			parent = globalFlashMap.rasters.addObject();
		
		box.className = 'floatLeft';
		
		if ($.browser.msie)
			box.style.margin = '-3px -2px 0px -2px';
			
		(function(layer, parent, box){
			spanElem.onclick = function()
			{
				if (!box.checked)
					box.checked = true;
				
				clickFunc.call(_this, layer, parent, true);
			}
			box.onclick = function()
			{
				clickFunc.call(_this, layer, parent, this.checked);
			}
			box.update = function()
			{
				updateFunc(layer, parent);
			}
		})(serviceLayers[i], parent, box);
		
		box.setAttribute('layerName', serviceLayers[i].name);
		
		_(elemCanvas, [box, spanElem]);
		_(ulChilds, [_li([elemCanvas])]);
		
		if (typeof loadParams != 'undefined' && loadParams[serviceLayers[i].name])
			$(spanElem).trigger("click");
	}
	
	$(ulCanvas).treeview();
	
	var timer = null;
	
	globalFlashMap.setHandler('onMove', function()
	{
		if (timer)
			clearTimeout(timer);
		
		timer = setTimeout(function()
		{
			var boxes = ulChilds.getElementsByTagName('input');
			
			for (var i = 0; i < boxes.length; i++)
			{
				if (boxes[i].checked)
					boxes[i].update();
			}
		}, 500)
	})
}

queryServerData.prototype.drawWFS = function(serviceLayers, url, replaceElem, loadParams)
{
	var ulCanvas = _ul(null, [['css','paddingBottom','5px'], ['attr','url',url]]),
		ulChilds = _ul(),
		divFormat = _div(),
		remove = makeImageButton('img/closemin.png','img/close_orange.png'),
		_this = this;
	
	$(replaceElem).replaceWith(ulCanvas)
	
	remove.onclick = function()
	{
		for (var i = 0; i < ulChilds.childNodes.length; i++)
			ulChilds.childNodes[i].firstChild.lastChild.clear && ulChilds.childNodes[i].firstChild.lastChild.clear();
		
		this.parentNode.parentNode.parentNode.removeNode(true);
	}
	
	remove.className = 'remove';
	remove.style.right = '0px';
	
	_(ulCanvas, [_li([_div([_span([_t(url.length < 45 ? url : url.substr(0, 45) + '...')],[['dir','className','urlHeader']]), divFormat, remove],[['css','position','relative']]), ulChilds])]);
	
	var formatSelect = _select([_option([_t("JSON")], [['attr','value','json']]),
								_option([_t("GML / KML")], [['attr','value','gml']])], [['dir','className','selectStyle'],['css','width','100px']])
	
	_(divFormat, [_table([_tbody([_tr([_td([formatSelect])])])], [['css','marginLeft','5px']])])
	
	var clickFunc = function(layer, parent, flag, elemCanvas, box, header, loadLayerParams)
	{
		if (!flag)
			parent.setVisible(false);
		else
		{
			var newFormat = formatSelect.value;
			
			// загружаем данные только один раз
			if (!elemCanvas.loaded || elemCanvas.format != newFormat)
			{
				elemCanvas.clear && elemCanvas.clear();
				
				var objUrl = url + "?request=GetFeature&typeName=" + layer.name;
				
				if (formatSelect.value == 'json')
					objUrl += '&outputFormat=json'
				
				_this.loadGML(objUrl, elemCanvas, box, header, newFormat, loadLayerParams, layer.srs);
				
				elemCanvas.loaded = true;
				elemCanvas.format = newFormat;
				
				var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px']]);
		
				_(elemCanvas, [loading]);
			}
			else
			{
				if (typeof elemCanvas.loaded == 'function')
					elemCanvas.loaded();
			}
			
			parent.setVisible(true);
		}
	}
	
	for (var i = 0; i < serviceLayers.length; i++)
	{
		var elemCanvas = _div(null, [['css','padding','2px']]),
			box = _checkbox(false, 'checkbox'),
			spanElem = _span([_t(serviceLayers[i].title != '' ? serviceLayers[i].title : serviceLayers[i].name)],[['css','cursor','pointer'],['dir','className','layerfeature']]),
			elemChilds = _div(null, [['css','marginLeft','20px']]),
			parent = globalFlashMap.addObject();
		
		box.className = 'floatLeft';
		
		box.setAttribute('layerName', serviceLayers[i].name);
		
		if ($.browser.msie)
			box.style.margin = '-3px -2px 0px -2px';
		
		(function(layer, parent, parentTreeCanvas, box, header){
			spanElem.onclick = function()
			{
				if (!box.checked)
					box.checked = true;
				
				clickFunc.call(_this, layer, parent, true, parentTreeCanvas, box, header);
			}
			box.onclick = function()
			{
				clickFunc.call(_this, layer, parent, this.checked, parentTreeCanvas, box, header);
			}
		})(serviceLayers[i], parent, elemChilds, box, spanElem);
		
		_(elemCanvas, [box, _div([spanElem],[['css','display','inline']]), elemChilds])
		_(ulChilds, [_li([elemCanvas])])
			
		if (typeof loadParams != 'undefined' && loadParams[serviceLayers[i].name])
		{
			if (!box.checked)
				box.checked = true;
			
			formatSelect.value = loadParams[serviceLayers[i].name].format;
			clickFunc.call(_this, serviceLayers[i], parent, true, elemChilds, box, spanElem, loadParams[serviceLayers[i].name].info);
		}
	}
	
	$(ulCanvas).treeview();
}


var _queryServerDataWFS = new queryServerData(),
	_queryServerDataWMS = new queryServerData();

loadServerData.WFS.load = function()
{
	var alreadyLoaded = _queryServerDataWFS.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_queryServerDataWFS.load(_queryServerDataWFS.parseWFSCapabilities, _queryServerDataWFS.drawWFS)
}
loadServerData.WFS.unload = function()
{
//	removeChilds($$('leftContent'))
}

loadServerData.WMS.load = function()
{
	var alreadyLoaded = _queryServerDataWMS.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_queryServerDataWMS.load(_queryServerDataWMS.parseWMSCapabilities, _queryServerDataWMS.drawWMS)
}
loadServerData.WMS.unload = function()
{
//	removeChilds($$('leftContent'))
}