//Поддержка WMS
(function()
{
    var wmsProjections = ['EPSG:3395', 'EPSG:4326', 'EPSG:41001'];	// типы проекций
    
    /**
     * Возвращает описание WMS-слоёв от XML, которую вернул сервер на запрос GetCapabilities
     * @memberOf gmxAPI
     * @ignore
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
            xml = gmxAPI.parseXML(response),
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
                for (var si = 0; si < srs.length; si++)
                {
                    var curSrs = gmxAPI.strip(gmxAPI.getTextContent(srs[si]))
                    
                    if (gmxAPI.valueInArray(wmsProjections, curSrs))
                    {
                        layer.srs = curSrs;
                        break;
                    }
                }
                if (!layer.srs) continue;
            }
			else
                layer.srs = wmsProjections[0];
                
				
			
			if (name.length)
				layer.name = gmxAPI.getTextContent(name[0]);
			
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
                        minx: Number(gmxAPI.getTextContent(bbox[0].getElementsByTagName('westBoundLongitude')[0])),
                        miny: Number(gmxAPI.getTextContent(bbox[0].getElementsByTagName('southBoundLatitude')[0])),
                        maxx: Number(gmxAPI.getTextContent(bbox[0].getElementsByTagName('eastBoundLongitude')[0])),
                        maxy: Number(gmxAPI.getTextContent(bbox[0].getElementsByTagName('northBoundLatitude')[0]))
                    };
                }
			}
			
			if (title.length)
				layer.title = gmxAPI.getTextContent(title[0]);
			
			if (layer.name)
				serviceLayers.push(layer);
		}
		
		return serviceLayers;
	}
    
    /** Формирует URL картинки, который можно использовать для получения WMS слоя для данного положения карты
     * @memberOf gmxAPI
     * @ignore
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

        var extend = gmxAPI.map.getVisibleExtent();
        
        console.log('visible', extend);

        var miny = Math.max(extend.minY, -90);
        var maxy = Math.min(extend.maxY, 90);
        var minx = Math.max(extend.minX, -180);
        var maxx = Math.min(extend.maxX, 180);
        
        if (props.bbox)
        {
            minx = Math.max(props.bbox.minx, minx);
            miny = Math.max(props.bbox.miny, miny);
            maxx = Math.min(props.bbox.maxx, maxx);
            maxy = Math.min(props.bbox.maxy, maxy);

            if (minx >= maxx || miny >= maxy)
                return;
        }
        
        var scale = gmxAPI.getScale(gmxAPI.map.getZ());
        var w = Math.round((gmxAPI.merc_x(maxx) - gmxAPI.merc_x(minx))/scale);
        var h = Math.round((gmxAPI.merc_y(maxy) - gmxAPI.merc_y(miny))/scale);

        var isMerc = !(props.srs == wmsProjections[1]);

        var st = url;
        var format = requestProperties.format || 'image/jpeg';
        var transparentParam = requestProperties.transparent ? 'TRUE' : 'FALSE';
        var version = props.version || '1.1.1';
        
        //st = st.replace(/Service=WMS[\&]*/i, '');
        //st = st.replace(/\&$/, '');
        
        st += (st.indexOf('?') == -1 ? '?':'&') + 'request=GetMap&Service=WMS';
        st += "&layers=" + encodeURIComponent(props.name) +
            "&VERSION=" + encodeURIComponent(version) +
            "&" + CRSParam[version] + "=" + encodeURIComponent(props.srs) +
            "&styles=" +
            "&width=" + w +
            "&height=" + h +
            "&bbox=" + (isMerc ? gmxAPI.merc_x(minx) : minx) +
                 "," + (isMerc ? gmxAPI.merc_y(miny) : miny) +
                 "," + (isMerc ? gmxAPI.merc_x(maxx) : maxx) +
                 "," + (isMerc ? gmxAPI.merc_y(maxy) : maxy);

        if (url.indexOf('format=') == -1) st += "&format=" + encodeURIComponent(format);
        if (url.indexOf('transparent=') == -1) st += "&transparent=" + encodeURIComponent(transparentParam);
       
        return {url: st, bounds: {minX: minx, maxX: maxx, minY: miny, maxY: maxy}};
    }
    
    var loadWMS = function(map, container, url, func)
    {
        var urlProxyServer = 'http://' + gmxAPI.serverBase + '/';
        var wmsLayers = [];

		url = url.replace(/Request=GetCapabilities[\&]*/i, '');
		url = url.replace(/\&$/, '');
        var st = url;
        st += (st.indexOf('?') == -1 ? '?':'&') + 'request=GetCapabilities&version=1.1.1';
        var _hostname = urlProxyServer + "ApiSave.ashx?debug=1&get=" + encodeURIComponent(st);
        sendCrossDomainJSONRequest(_hostname, function(response)
        {
            if(typeof(response) != 'object' || response['Status'] != 'ok') {
                gmxAPI.addDebugWarnings({'_hostname': _hostname, 'url': url, 'Error': 'bad response'});
                return;
            }
            var serviceLayers = gmxAPI.parseWMSCapabilities(response['Result']);
            for (var i = 0; i < serviceLayers.length; i++)
            {
                var props = serviceLayers[i];
                var obj = container.addObject(null, props);
                obj.setVisible(false);
				wmsLayers.push(obj);

                (function(obj, props) {
                    var timeout = false;
                    var updateFunc = function() 
                    {
                        if (timeout) clearTimeout(timeout);
                        timeout = setTimeout(function()
                        {
                            var res = getWMSMapURL(url, props);
                            
                            if (res)
                            {
                                var bbox = res.bounds;

                                obj.setImage(
                                    urlProxyServer + "ImgSave.ashx?now=true&get=" + encodeURIComponent(res.url),
                                    bbox.minX, bbox.maxY, bbox.maxX, bbox.maxY, bbox.maxX, bbox.minY, bbox.minX, bbox.minY
                                );
                            }
                        }, 500);
                    }
					// Добавление прослушивателей событий
					obj.addListener('onChangeVisible', function(flag)
						{
							if(flag) updateFunc();
							obj.setHandler("onMove", flag ? updateFunc : null);
						}
					);


                })(obj, props);
            }
            func(wmsLayers);
        })
    }
    
    //расширяем namespace
    gmxAPI.parseWMSCapabilities = parseWMSCapabilities;
    gmxAPI._loadWMS = loadWMS;
    gmxAPI.getWMSMapURL = getWMSMapURL;
})();

