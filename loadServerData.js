!(function(_) {
    
var wmsProjections = ['EPSG:3395', 'EPSG:4326', 'EPSG:41001'];	// типы проекций
    
var getTextContent = function(node) {
    if (typeof node.textContent != 'undefined')
        return node.textContent;
    
    var data = '';
    for (var i = 0; i < node.childNodes.length; i++)
        data += node.childNodes[i].data;
    
    return data;
}

var getScale = function(z)
{
    return Math.pow(2, -z)*156543.033928041;
}

/** Формирует URL картинки, который можно использовать для получения WMS слоя для данного положения карты
 * @property {String} url - WMS ссылка.
 * @property {object} props - атрибуты.
 * @property {String} props.srs - тип проекции.
 * @property {String} props.version - версия.
 * @property {String} props.name - Идентификатор слоя.
 * @property {object} props.bbox - ограничение по bounds(в географических координатах).
 * @property {object} requestProperties - атрибуты формата результирующего image.
 * @property {String} requestProperties.format - тип (по умолчанию 'image/jpeg').
 * @property {String} requestProperties.transparent - прозрачность подложки ('TRUE'/'FALSE' по умолчанию 'FALSE').
 * @returns {object} - {url: String, bounds: {Extent}}. bounds в географических координатах.
*/
var getWMSMapURL = function(url, props, requestProperties)
{
    var CRSParam = {'1.1.1': 'SRS', '1.3.0': 'CRS'};
    
    requestProperties = requestProperties || {};

    var lmap = nsGmx.leafletMap,
        extend = lmap.getBounds();
    
    var miny = Math.max(extend.getSouth(), -90);
    var maxy = Math.min(extend.getNorth(), 90);
    var minx = Math.max(extend.getWest(), -180);
    var maxx = Math.min(extend.getEast(), 180);
    
    if (props.bbox)
    {
        minx = Math.max(props.bbox.minx, minx);
        miny = Math.max(props.bbox.miny, miny);
        maxx = Math.min(props.bbox.maxx, maxx);
        maxy = Math.min(props.bbox.maxy, maxy);

        if (minx >= maxx || miny >= maxy)
            return;
    }
    
    var mercMin = L.Projection.Mercator.project({lat: miny, lng: minx}),
        mercMax = L.Projection.Mercator.project({lat: maxy, lng: maxx});
    
    var scale = getScale(lmap.getZoom());
    var w = Math.round((mercMax.x - mercMin.x)/scale);
    var h = Math.round((mercMax.y - mercMin.y)/scale);

    var isMerc = !(props.srs == wmsProjections[1]);

    var st = url;
    var format = requestProperties.format || 'image/jpeg';
    var transparentParam = requestProperties.transparent ? 'TRUE' : 'FALSE';
    var version = props.version || '1.1.1';
    var isV130 = version === '1.3.0';
    
    //st = st.replace(/Service=WMS[\&]*/i, '');
    //st = st.replace(/\&$/, '');
    
    st += (st.indexOf('?') == -1 ? '?':'&') + 'request=GetMap&Service=WMS';
    st += "&layers=" + encodeURIComponent(props.name) +
        "&VERSION=" + encodeURIComponent(version) +
        "&" + CRSParam[version] + "=" + encodeURIComponent(props.srs) +
        "&styles=" +
        "&width=" + w +
        "&height=" + h +
        "&bbox=" + (isMerc ? mercMin.x : isV130 ? miny : minx) +
             "," + (isMerc ? mercMin.y : isV130 ? minx : miny) +
             "," + (isMerc ? mercMax.x : isV130 ? maxy : maxx) +
             "," + (isMerc ? mercMax.y : isV130 ? maxx : maxy);

    if (url.indexOf('format=') == -1) st += "&format=" + encodeURIComponent(format);
    if (url.indexOf('transparent=') == -1) st += "&transparent=" + encodeURIComponent(transparentParam);
   
    return {url: st, bounds: {minX: minx, maxX: maxx, minY: miny, maxY: maxy}};
}

/**
 * Возвращает описание WMS-слоёв от XML, которую вернул сервер на запрос GetCapabilities
 * @returns {Array} - массив объектов с описанием слоёв
*/
var parseWMSCapabilities = function(response)
{
    var supportedVersions = {'1.1.1': true, '1.3.0': true};
    var SRSTagName = {'1.1.1': 'SRS', '1.3.0': 'CRS'};
    var BBOXTagName = {'1.1.1': 'LatLonBoundingBox', '1.3.0': 'EX_GeographicBoundingBox'};
    var serviceLayers = [],
        strResp = response.replace(/[\t\n\r]/g, ' '),
        strResp = strResp.replace(/\s+/g, ' '),
        xml = parseXML(response),
        mainTag = xml.getElementsByTagName('WMS_Capabilities')[0] || xml.getElementsByTagName('WMT_MS_Capabilities')[0],
        version = mainTag.getAttribute('version'),
        layersXML = xml.getElementsByTagName('Layer');
    
    if (!(version in supportedVersions)) {
        return [];
    }
    
    for (var i = 0; i < layersXML.length; i++)
    {
        var layer = {version: version},
            name = layersXML[i].getElementsByTagName('Name'),
            title = layersXML[i].getElementsByTagName('Title'),
            bbox = layersXML[i].getElementsByTagName(BBOXTagName[version]),
            srs = layersXML[i].getElementsByTagName(SRSTagName[version]);
        
        if (srs.length)
        {
            layer.srs = null;
            var supportedSrs = {};
            for (var si = 0; si < srs.length; si++)
            {
                var srsName = strip(getTextContent(srs[si]));
                supportedSrs[srsName] = true;
            }
            
            //порядок имеет значение!
            for (var p = 0; p < wmsProjections.length; p++) {
                if (wmsProjections[p] in supportedSrs) {
                    layer.srs = wmsProjections[p];
                    break;
                }
            }
            if (!layer.srs) continue;
        }
        else {
            layer.srs = wmsProjections[0];
        }

        if (name.length)
            layer.name = getTextContent(name[0]);
        
        if (bbox.length)
        {
            if (version == '1.1.1') {
                layer.bbox = 
                {
                    minx: Number(bbox[0].getAttribute('minx')),
                    miny: Number(bbox[0].getAttribute('miny')),
                    maxx: Number(bbox[0].getAttribute('maxx')),
                    maxy: Number(bbox[0].getAttribute('maxy'))
                };
            } else {
                layer.bbox = 
                {
                    minx: Number(getTextContent(bbox[0].getElementsByTagName('westBoundLongitude')[0])),
                    miny: Number(getTextContent(bbox[0].getElementsByTagName('southBoundLatitude')[0])),
                    maxx: Number(getTextContent(bbox[0].getElementsByTagName('eastBoundLongitude')[0])),
                    maxy: Number(getTextContent(bbox[0].getElementsByTagName('northBoundLatitude')[0]))
                };
            }
        }
        
        if (title.length)
            layer.title = getTextContent(title[0]);
        
        if (layer.name)
            serviceLayers.push(layer);
    }
    
    return serviceLayers;
}

var loadServerData = window.loadServerData =
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
	
	return {feature:{}, geometry:{type: 'Point', coordinates: this.swapCoordinates([Number(coords[0]), Number(coords[1])])}}
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
		return {feature:{}, geometry:{type: 'LineString', coordinates: points}}
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
	
	return {feature:{}, geometry:{type: 'Polygon', coordinates: components}}
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
	
	this.customParams = undefined;
}

queryServerData.prototype = new leftMenu();

/**
    Загружает виджет для добавления/просмотра WMS/WFS слоёв
 @param protocol
 @param parseFunc 
 @param drawFunc
 @param customParamsManager {object}- контролер дополнительных параметров. Имеет методы: <br/> 
        - init(targetDiv)->void Добавляет контрол к элементу targetDiv<br/>
        - collect()->Object Возвращает выбранные пользователем объекты<br/>
 @param version {string} Версия протокола, которая будет использоваться
*/
queryServerData.prototype.load = function(protocol, parseFunc, drawFunc, customParamsManager, version)
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
	
	var inputField = _input(null, [['dir','className','inputStyle'],['css','width','200px']]);
	
	this.parentCanvas = _div(null, [['dir','className','serverDataCanvas']]);
	
	var goButton = makeButton(_gtxt("Загрузить")),
		_this = this;
		
	var doGetCapabilities = function()
	{
		if (inputField.value != '')
		{
			if ( customParamsManager )
				_this.customParams = customParamsManager.collect();
				
			_this.getCapabilities(protocol, strip(inputField.value), parseFunc, drawFunc);
				
			inputField.value = '';
		}
		else
			inputError(inputField);
	}
	
	goButton.onclick = doGetCapabilities;
	
	$(inputField).on('keydown', function(e)
	{
		if (e.keyCode === 13)
	  	{
			doGetCapabilities();
	  		return false;
	  	}
	});
	
	var canvas = _div([_div([_span([_t(_gtxt("URL сервера"))])], [['css','marginBottom','3px']]),_table([_tbody([_tr([_td([inputField]),_td([goButton])])])], [['css','marginBottom','5px']])],[['css','margin','3px 0px 0px 10px']])
	
	if (customParamsManager)
	{
		var customParamsDiv = _div();
		$(canvas).append(customParamsDiv);
		_this.customParams = customParamsManager.init(customParamsDiv);
	}	

	_(this.workCanvas, [canvas, this.parentCanvas])
}

queryServerData.prototype.getCapabilities = function(protocol, url, parseFunc, drawFunc, version)
{
	var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]),
		_this = this;
	
	if (this.parentCanvas.childNodes.length == 0)
		_(this.parentCanvas, [loading]);
	else
		this.parentCanvas.insertBefore(loading, this.parentCanvas.firstChild);
	
    var capabilitiesUrl = 
            url.replace(/REQUEST=GetCapabilities[\&]*/i, '')
               .replace(new RegExp('SERVICE=' + protocol + '[\&]', 'i'), '')
               .replace(/\&$/, '');
    
    capabilitiesUrl += capabilitiesUrl.indexOf('?') !== -1 ? '&' : '?';
    capabilitiesUrl += 'REQUEST=GetCapabilities&SERVICE=' + protocol;
    
    if (version) {
        capabilitiesUrl += '&VERSION=' + version;
    }
    
	sendCrossDomainJSONRequest(serverBase + "ApiSave.ashx?get=" + encodeURIComponent(capabilitiesUrl), function(response) {
		if (!parseResponse(response)) return;

		var servicelayers = parseFunc.call(_this, response.Result);

		drawFunc.call(_this, servicelayers, url, loading, undefined, _this.customParams);
	})
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
	
	sendCrossDomainJSONRequest(serverBase + "ApiSave.ashx?get=" + encodeURIComponent(url), function(response)
	{
		if (!parseResponse(response)) return;
		var geometries = parseGML(response.Result, format, srs);
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
		globalFlashMap.saveObjects(geometries, nsGmx.Utils.translit(fileName));
	});
	
	return false;
}

queryServerData.prototype.drawGML = function(geometries, url, parentTreeCanvas, box, header, loadLayerParams)
{
	var parent = {
					'Point': L.gmx.createLayer({properties: {}}).addTo(nsGmx.leafletMap),
					'LineString': L.gmx.createLayer({properties: {}}).addTo(nsGmx.leafletMap),
					'Polygon': L.gmx.createLayer({properties: {}}).addTo(nsGmx.leafletMap)
				},
		styles = {
					'Point': typeof loadLayerParams != 'undefined' && loadLayerParams['point'] ? loadLayerParams['point'].RenderStyle : { marker: { size: 2 }, outline: { color: 0x0000ff, thickness: 1 } },
					'LineString': typeof loadLayerParams != 'undefined' && loadLayerParams['linestring'] ? loadLayerParams['linestring'].RenderStyle : { outline: { color: 0x0000ff, thickness: 2 } },
					'Polygon': typeof loadLayerParams != 'undefined' && loadLayerParams['polygon'] ? loadLayerParams['polygon'].RenderStyle : { outline: { color: 0x0000ff, thickness: 2, opacity: 100 }, fill: {color: 0xffffff, opacity: 20} }
				};
	// parent['POINT'].setStyle(styles['POINT']);
	// parent['LINESTRING'].setStyle(styles['LINESTRING']);
	// parent['POLYGON'].setStyle(styles['POLYGON']);
	
	var geomsPresent = {},
		bounds = L.gmxUtil.bounds(),
        items = {'Point': [], 'LineString': [], 'Polygon': []};
	
	for (var i = 0; i < geometries.length; i++)
	{
		//var elem = parent[geometries[i].geometry.type].addObject(geometries[i].geometry);
        items[geometries[i].geometry.type].push([L.gmxUtil.geoJSONtoGeometry(geometries[i].geometry, true)]);
        //parent[geometries[i].geometry.type].addItems();
		
		/*if (objLength(geometries[i].feature) > 0)
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
		}*/

		geomsPresent[geometries[i].geometry.type] = true;

		bounds.extendArray(geometries[i].geometry.coordinates[0]);
	}

    parent['Point'].addData(items['Point']);
    parent['LineString'].addData(items['LineString']);
    parent['Polygon'].addData(items['Polygon']);

	var divCanvas = _div(),
		divChilds = _div(),
		spanHeader = _span([_t(url.length < 45 ? url : url.substr(0, 45) + '...')]),
		_this = this;
	
	var clickFunc = function(flag)
	{
        var lmap = nsGmx.leafletMap,
            method = flag ? 'addLayer' : 'removeLayer';
        lmap[method](parent['Point']);
        lmap[method](parent['LineString']);
        lmap[method](parent['Polygon']);

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
		
		//globalFlashMap.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
        nsGmx.leafletMap.fitBounds([[bounds.min.y, bounds.min.x], [bounds.max.y, bounds.max.x]]);
	}
	
	parentTreeCanvas.clear = function()
	{
        var lmap = nsGmx.leafletMap;
		lmap.removeLayer(parent['Point']);
		lmap.removeLayer(parent['LineString']);
		lmap.removeLayer(parent['Polygon']);
		
		divCanvas.removeNode(true);
	}
	
	box.onclick = function()
	{
		clickFunc.call(_this, this.checked);
	}
	
	$(parentTreeCanvas).empty();
	
	if (parentTreeCanvas.childNodes.length == 0)
		_(parentTreeCanvas, [divCanvas]);
	else
		parentTreeCanvas.insertBefore(divCanvas, parentTreeCanvas.firstChild);
	
	_(divCanvas, [divChilds]);
	
	// for (var type in geomsPresent)
	// {
		// var elemCanvas = _div(null, [['css','padding','2px'],['attr','geometryType', type]]),
			// //icon = _mapHelper.createStylesEditorIcon([{MinZoom:1,MaxZoom:20,RenderStyle:styles[type]}], type.toLowerCase()),
			// spanElem = _span(null, [['dir','className','layerfeature']]);
		
		// if (type == 'Point')
			// _(spanElem, [_t(_gtxt('точки'))]);
		// else if (type == 'LineString')
			// _(spanElem, [_t(_gtxt('линии'))]);
		// else if (type == 'Polygon')
			// _(spanElem, [_t(_gtxt('полигоны'))]);

        // var icon;
		// (function(type){
			// icon = _mapHelper.createWFSStylesEditor(parent[type], styles[type], type.toLowerCase(), divCanvas)
		// })(type);
		
		// if (typeof loadLayerParams != 'undefined' && loadLayerParams[type.toLowerCase()])
		// {
			// var info = loadLayerParams[type.toLowerCase()];
			
			// elemCanvas.graphDataType = info.graphDataType;
			// elemCanvas.graphDataProperties = info.graphDataProperties;
		// }
		// else
		// {
			// elemCanvas.graphDataType = "func";
			// elemCanvas.graphDataProperties = "";
		// }
		
		// _(elemCanvas, [icon, spanElem])
		// _(divChilds, [elemCanvas]);
		
	// }
	
	//globalFlashMap.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
    nsGmx.leafletMap.fitBounds([[bounds.min.y, bounds.min.x], [bounds.max.y, bounds.max.x]]);
	
	box.checked = true;
}

//loadParams - параметры для отдельных слоёв
//serverParams - параметры сервера, которые были указаны пользователем.
queryServerData.prototype.drawWMS = function(serviceLayers, url, replaceElem, loadParams, serverParams)
{
	var ulCanvas = _ul(null, [['css','paddingBottom','5px'], ['attr','url',url]]),
		ulChilds = _ul(),
		remove = makeImageButton('img/closemin.png','img/close_orange.png'),
		_this = this,
        lmap = nsGmx.leafletMap;
	
	$(replaceElem).replaceWith(ulCanvas)
    
    $(ulCanvas).data('serverParams', serverParams);
	
	remove.onclick = function()
	{
		for (var i = 0; i < ulChilds.childNodes.length; i++)
        {
			ulChilds.childNodes[i].firstChild.lastChild.clear && ulChilds.childNodes[i].firstChild.lastChild.clear();
            lmap.removeLayer(ulChilds.childNodes[i].firstChild.lastChild.gmxObject);
		}
        
		this.parentNode.parentNode.parentNode.removeNode(true);
	}
	
	remove.className = 'remove';
	remove.style.right = '0px';
	
	_(ulCanvas, [_li([_div([_span([_t(url.length < 45 ? url : url.substr(0, 45) + '...')],[['dir','className','urlHeader']]), remove],[['css','position','relative']]), ulChilds])])
	
	var clickFunc = function(layer, parent, flag)
	{
		if (!flag) {
			lmap.removeLayer(parent);
        } else {
			updateFunc(layer, parent);
			lmap.addLayer(parent);
		}
	}

	var updateFunc = function(layer, parent)
	{
        var requestParams = {}
		if (serverParams && serverParams.format)
        {
            requestParams.format = "image/" + serverParams.format;
            requestParams.transparent = serverParams.format === 'png';
        }
        
        var res = getWMSMapURL(url, layer, requestParams);
        
        if (res)
        {
            var b = res.bounds;
            parent.clearLayers();
            parent.addLayer(L.imageOverlay(serverBase + "ImgSave.ashx?now=true&get=" + encodeURIComponent(res.url), L.latLngBounds([[b.minY, b.minX], [b.maxY, b.maxX]])));
        }
	}
	
	serviceLayers.forEach(function(layer)
	{
		var elemCanvas = _div(null, [['css','padding','2px']]),
			box = _checkbox(false, 'checkbox'),
			spanElem = _span([_t(layer.title)], [['css','cursor','pointer'],['dir','className','layerfeature']]),
			parent = L.layerGroup().addTo(nsGmx.leafletMap);

        spanElem.gmxObject = parent;

		box.className = 'floatLeft';

        spanElem.onclick = function()
        {
            if (!box.checked)
                box.checked = true;
            
            clickFunc(layer, parent, true);
        }
        box.onclick = function()
        {
            clickFunc(layer, parent, this.checked);
        }
        box.update = function()
        {
            updateFunc(layer, parent);
        }
		
		box.setAttribute('layerName', layer.name);
		
		_(elemCanvas, [box, spanElem]);
		_(ulChilds, [_li([elemCanvas])]);
		
		if (typeof loadParams != 'undefined' && loadParams[layer.name])
			$(spanElem).trigger("click");
	});

	$(ulCanvas).treeview();

	nsGmx.leafletMap.on('moveend', function()
	{
        var boxes = ulChilds.getElementsByTagName('input');

        for (var i = 0; i < boxes.length; i++)
        {
            if (boxes[i].checked)
                boxes[i].update();
        }
	})
}

//Добавляет контрол выбора формата запроса к WMS и возвращает его в параметре format (пример: "png", "jpg")
queryServerData.prototype.customWMSParamsManager = (function()
{
	var _targetDiv = null;
	return {
		init: function(targetDiv) 
		{
			var select = nsGmx.Utils._select([_option([_t('png')]), _option([_t('jpeg')])], [['dir','className','selectStyle'], ['css', 'width', '60px']]);
			_targetDiv = targetDiv;
			_(_targetDiv, [_t(_gtxt('Формат изображения') + ': '), select]);
			_targetDiv.style.marginBottom = '5px';
		},
		collect: function() {
			return { format: $("option:selected", _targetDiv).text() };
		}
	}
})();

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

	var formatSelect = nsGmx.Utils._select([_option([_t("JSON")], [['attr','value','json']]),
								_option([_t("GML / KML")], [['attr','value','gml']])], [['dir','className','selectStyle'],['css','width','100px']]);

	_(divFormat, [formatSelect]);

	var clickFunc = function(layer, flag, elemCanvas, box, header, loadLayerParams)
	{
		if (flag) {
			var newFormat = formatSelect.value;
			
			// загружаем данные только один раз
			if (!elemCanvas.loaded || elemCanvas.format != newFormat)
			{
				elemCanvas.clear && elemCanvas.clear();
				
                var separator = url.indexOf('?') !== -1 ? '&' : '?';
                
				var objUrl = url + separator + "request=GetFeature&version=1.0.0&typeName=" + layer.name;
				
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
		}
	}
	
	for (var i = 0; i < serviceLayers.length; i++)
	{
		var elemCanvas = _div(null, [['css','padding','2px']]),
			box = _checkbox(false, 'checkbox'),
			spanElem = _span([_t(serviceLayers[i].title != '' ? serviceLayers[i].title : serviceLayers[i].name)],[['css','cursor','pointer'],['dir','className','layerfeature']]),
			elemChilds = _div(null, [['css','marginLeft','20px']]);

		box.className = 'floatLeft';

		box.setAttribute('layerName', serviceLayers[i].name);
		
		(function(layer, parentTreeCanvas, box, header){
			spanElem.onclick = function()
			{
				if (!box.checked)
					box.checked = true;
				
				clickFunc.call(_this, layer, true, parentTreeCanvas, box, header);
			}
			box.onclick = function()
			{
				clickFunc.call(_this, layer, this.checked, parentTreeCanvas, box, header);
			}
		})(serviceLayers[i], elemChilds, box, spanElem);
		
		_(elemCanvas, [box, _div([spanElem],[['css','display','inline']]), elemChilds])
		_(ulChilds, [_li([elemCanvas])])
			
		if (typeof loadParams != 'undefined' && loadParams[serviceLayers[i].name])
		{
			if (!box.checked)
				box.checked = true;
			
			formatSelect.value = loadParams[serviceLayers[i].name].format;
			clickFunc.call(_this, serviceLayers[i], true, elemChilds, box, spanElem, loadParams[serviceLayers[i].name].info);
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
		_queryServerDataWFS.load('WFS', _queryServerDataWFS.parseWFSCapabilities, _queryServerDataWFS.drawWFS, null, '1.0.0');
}
loadServerData.WFS.unload = function()
{
//	removeChilds($$('leftContent'))
}

loadServerData.WMS.load = function()
{
	var alreadyLoaded = _queryServerDataWMS.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_queryServerDataWMS.load('WMS', parseWMSCapabilities, _queryServerDataWMS.drawWMS, _queryServerDataWMS.customWMSParamsManager);
}
loadServerData.WMS.unload = function()
{
//	removeChilds($$('leftContent'))
}

nsGmx.userObjectsManager.addDataCollector('wms', {
    collect: function()
    {
        if (!_queryServerDataWMS.workCanvas)
            return null;
        
        var value = {};
        
        $(_queryServerDataWMS.workCanvas.lastChild).children("ul[url]").each(function()
        {
            var url = this.getAttribute('url');
            var serverParams = $(this).data('serverParams');
            
            value[url] = {params: serverParams, layersVisibility: {}};
            
            $(this).find("input[type='checkbox']").each(function()
            {
                if (this.checked)
                {
                    value[url].layersVisibility[this.getAttribute('layerName')] = true;
                }
            })
        })
        
        if (!objLength(value))
            return null;
        
        return value;
    },
    
    load: function(data)
    {
        if (!data)
            return;

        $('#left_wms').remove();
        
        _queryServerDataWMS.builded = false;
        
        loadServerData.WMS.load('wms');
        
        for (var url in data)
        {
            (function(loadParams)
            {
                //поддержка старого формата данных
                if (!('layersVisibility' in loadParams))
                {
                    loadParams = {layersVisibility: loadParams};
                }
                
                _queryServerDataWMS.getCapabilities('WMS', url, parseWMSCapabilities, function(serviceLayers, url, replaceElem)
                {
                    _queryServerDataWMS.drawWMS(serviceLayers, url, replaceElem, loadParams.layersVisibility, loadParams.params);
                })
            })(data[url])
        }
    }
})

nsGmx.userObjectsManager.addDataCollector('wfs', {
    collect: function()
    {
        if (!_queryServerDataWFS.workCanvas)
            return null;
        
        var value = {};
        
        $(_queryServerDataWFS.workCanvas.lastChild).children("ul[url]").each(function()
        {
            var url = this.getAttribute('url');
            
            value[url] = {};
            
            $(this).find("input[type='checkbox']").each(function()
            {
                if (this.checked)
                {
                    var wfsLayerInfo = {};
                    
                    $(this.parentNode.lastChild).find(".colorIcon").each(function()
                    {
                        wfsLayerInfo[this.geometryType] = {RenderStyle: this.getStyle(), graphDataType: this.parentNode.graphDataType, graphDataProperties: this.parentNode.graphDataProperties}
                    })
                    
                    value[url][this.getAttribute('layerName')] = {format: this.parentNode.lastChild.format, info: wfsLayerInfo};
                }
            })
        })
        
        if (!objLength(value))   
            return null;
        
        return value;
    },
    
    load: function(data)
    {
        if (!data)
            return;

        $('#left_wfs').remove();
        
        _queryServerDataWFS.builded = false;
        
        loadServerData.WFS.load('wfs');
        
        for (var url in data)
        {
            (function(loadParams)
            {
                _queryServerDataWFS.getCapabilities('WFS', url, _queryServerDataWFS.parseWFSCapabilities, function(serviceLayers, url, replaceElem)
                {
                    _queryServerDataWFS.drawWFS(serviceLayers, url, replaceElem, loadParams);
                }, '1.0.0')
            })(data[url])
        }
    }
});

})(nsGmx.Utils._);