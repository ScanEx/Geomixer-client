(function($){


var initTranslations = function()
{
    _translationsHash.addtext("rus", {
                                "searchBbox.SearchInArea" : "Искать в области",
                                "searchBbox.CancelSearchInArea" : "Отменить поиск по области",
                                "firesWidget.FireSpots.Description" : "Очаги пожаров",
                                "firesWidget.Burnt.Description" : "Границы гарей",
                                "firesWidget.DialyCoverage.Description" : "Космоснимки",
                                "firesWidget.tooManyDataWarning" : "Слишком много данных - сократите область поиска!",
                                "firesWidget.FireCombinedDescription" : "Пожары",
                                "firesWidget.ExtendedView" : "Расширенный поиск",
                                "firesWidget.AdvancedSearchButton" : "Искать по области"
                             });
                             
    _translationsHash.addtext("eng", {
                                "searchBbox.SearchInArea" : "Search in area",
                                "searchBbox.CancelSearchInArea" : "Cancel search in area",
                                "firesWidget.FireSpots.Description" : "Fire spots",
                                "firesWidget.Burnt.Description" : "Fire areas",
                                "firesWidget.DialyCoverage.Description" : "Satellite images",
                                "firesWidget.tooManyDataWarning" : "Too much data - downsize search area!",
                                "firesWidget.FireCombinedDescription" : "Fires",
                                "firesWidget.ExtendedView" : "Extended search",
                                "firesWidget.AdvancedSearchButton" : "Search inside area"
                             });
}
						 
						 
// Lookup table for pixel dimensions based on scan index of the pixel

var ModisPixelDimensions = [];

function buildModisPixelDimensionsTable()
{
	// Don't rebuild the table if it was already built
	if(ModisPixelDimensions.length > 0){
		return;
	}
	
	var h = 705.0;		// Terra/Aqua orbit altitude [km]
	var p = 1.0;		// nadir pixel resolution [km]
	var EARTH_RADIUS = 6371.0;
    var SAMPLES = 1354;
    
	var r = EARTH_RADIUS + h;	/* [km] */
	var s = p / h;                  /* [rad] */

	for(var sample = 0;sample<1354;sample++){
		var theta = sample * s + 0.5 * s - (0.5*SAMPLES) * s;
		var cos_theta = Math.cos(theta);

		var temp = Math.pow((EARTH_RADIUS/r),2.0) - Math.pow(Math.sin(theta),2.0);
		var sqrt_temp = Math.sqrt(temp);

		var DS = EARTH_RADIUS * s * (cos_theta/sqrt_temp - 1.0)*1000;
		var DT = r*s*(cos_theta - sqrt_temp)*1000;
		ModisPixelDimensions[sample] = [DS,DT];
	}
}


 /*
 ************************************
 *             BoundsExt            *
 ************************************/
						 
/** Bbox, который может быть пустым или занимать весь мир
 @memberOf FireMapplet
 @class
 @param param Объект {minX, maxX, minY, maxY}, если нормальный bbox, BoundsExt.EMPTY - если пустое множество,  BoundsExt.WHOLE_WORLD - если весь мир.
*/
var BoundsExt = function( param )
{
	var _isEmpty = false;
	var _isWholeWorld = true;
	var _bounds = null;
	
	if (typeof param !== 'undefined')
	{
		if (param === BoundsExt.EMPTY)
			_isEmpty = true;
		else if (param !== BoundsExt.WHOLE_WORLD && typeof param === "object")
		{
			_isWholeWorld = false;
			_bounds = param;
		}
	}
	
	this.isEmpty = function(){ return _isEmpty; };
	this.isWholeWorld = function(){ return _isWholeWorld; };
	this.getBounds = function(){ return _bounds; };
	
	this.isEqual = function( bounds ) 
	{
		if ( _isEmpty && bounds.isEmpty() ) return true;
		if ( _isWholeWorld && bounds.isWholeWorld() ) return true;
		
		if ( _isEmpty || bounds.isEmpty() || _isWholeWorld || bounds.isWholeWorld() )
			return false;
			
		var b = bounds.getBounds();
		return _bounds.maxX == b.maxX && _bounds.maxY == b.maxY && _bounds.minX == b.minX && _bounds.minY == b.minY;
	};
	
	/* Находится ли даннный bbox полностью внутри bounds
	*/
	this.isInside = function( bounds )
	{
		if ( _isEmpty || bounds.isWholeWorld() ) return true;
		if ( _isWholeWorld || bounds.isEmpty() ) return false;
		
		var b = bounds.getBounds();
		return _bounds.maxX <= b.maxX && _bounds.maxY <= b.maxY && _bounds.minX >= b.minX && _bounds.minY >= b.minY;
	}
	
	this.clone = function()
	{
		var param = _bounds;
		if ( _isEmpty ) param = BoundsExt.EMPTY;
		if ( _isWholeWorld ) param = BoundsExt.WHOLE_WORLD;
		return new BoundsExt( param );
	}
	
	this.getIntersection = function( bounds )
	{
		if ( _isEmpty || bounds.isEmpty() )
			return new BoundsExt(BoundsExt.EMPTY);
			
		if ( _isWholeWorld )
			return bounds.clone();
			
		if ( bounds.isWholeWorld() )
			return this.clone();
			
		var b = bounds.getBounds();
		
		if ( !boundsIntersect(_bounds, b) )
		{
			return new BoundsExt(BoundsExt.EMPTY);
		}
			
		return new BoundsExt({
			minX: Math.max(_bounds.minX, b.minX),
			maxX: Math.min(_bounds.maxX, b.maxX),
			minY: Math.max(_bounds.minY, b.minY),
			maxY: Math.min(_bounds.maxY, b.maxY)
		});
	}
}
BoundsExt.EMPTY = "empty";
BoundsExt.WHOLE_WORLD = "world";

/*
 ************************************
 *          SearchBboxControl       *
 ************************************/
 
 /**
 * @memberOf FireMapplet
 * @class
 * Управление ограничевающим прямоугольником для задания области отображения информации. <br/>
 *
 * Добавляет кастомное свойство к FRAME, к которому забинден. <br/>
 *
 * Зависимости: jQuery, API, translations <br/>
 * Элементы UI: кнопка и drawingObject типа FRAME
 */
var SearchBboxControl = function(map)
{
	 /**
	 * @name cover.SearchBboxControl.change
	 * @event
	 */
	 
	var _elem = null;
	var _button = null;
	var _extent = new BoundsExt();
	var _this = this;
	var _bindingID = Math.random();
	
	var update = function( keepSilence )
	{
		var newExtent = new BoundsExt(_elem ? getBounds( _elem.getGeometry().coordinates ) : BoundsExt.WHOLE_WORLD);
		
		var changed = !newExtent.isEqual(_extent);
		_extent = newExtent;
		
		if ( changed && !keepSilence )
			$(_this).triggerHandler('change');
	};
	
	var _bindDrawing = function( elem )
	{
		var prevElem = _elem;
			
		_elem = elem;
		elem.properties.firesBbox = _bindingID;
		
		//
		$(_button).val(_gtxt('searchBbox.CancelSearchInArea'));
		
		//удаляем в самом конце, после того, как забиндили новый элемент
		if (prevElem) prevElem.remove();
	}
	
	this.removeBbox = function( keepSilence )
	{
		if ( !_elem ) return;
		
		delete _elem.properties.firesBbox;
		_elem = null;
		$(_button).val(_gtxt("searchBbox.SearchInArea"));
		update( keepSilence );
	};
	
	/**
	 * @function
	 */	
	this.init = function()
	{
		_button = makeButton(_gtxt("searchBbox.SearchInArea"));
		
		_button.onclick = function()
		{
			if (_elem == null)
				map.drawing.selectTool("FRAME");
			else
			{
				_elem.remove();
			}
		}
	
		var _this = this;
		map.drawing.setHandlers(
		{
			onRemove: function( elem )
			{
				if (elem === _elem) 
					_this.removeBbox();
			}, 
			onMouseUp: function( elem )
			{
				update();
			}
		})
	};

	/**
	 * Возвращает контрол, который может быть куда-нибудь помещён
	 * @function
	 */
	this.getButton = function()
	{
		return _button;
	};
	
	/**
	 * Возвращет bbox
	 * @function
	 */
	this.getBbox = function()
	{
		return _extent;
	}
	
	/**
	 * Ищет bbox среди существующих drawing объектов и биндится к нему. drawing должен иметь свойство "firesBbox"
	 * @function
	 */
	this.findBbox = function( checkBindingID )
	{
		var _this = this;
		map.drawing.forEachObject(function(o)
		{
			if ( o.properties.firesBbox && ( typeof checkBindingID == 'undefined' || !checkBindingID || o.properties.firesBbox == _bindingID ) )
			{
				_bindDrawing( o );
				update( true ); //мы не хотим генерить event
			}
		})
	}
	
	/**
	 * Предполагается, что сам drawing объект сохраняется кем-то ещё, мы сохраняем только его параметры биндинга
	 * @function
	 */
	this.saveState = function()
	{
		return { bindingID: _bindingID };
	}
	
	/**
	 * @function
	 */
	this.loadState = function( data )
	{
		if ( data.bindingID )
		{
			_bindingID = data.bindingID;
			this.findBbox( true );
		}
		else
			this.findBbox( false );
	}
	
	this.bindDrawing = function( elem, keepSilence )
	{
		_bindDrawing( elem );
		update( keepSilence );
	}
	
	this.bindNewDrawing = function( geometry, properties, styles, keepSilence )
	{
		properties.firesBbox = _bindingID;
		var elem = map.drawing.addObject(geometry, properties);
		elem.setStyle( styles.regular, styles.hovered);
		_bindDrawing( elem );
		update( keepSilence );
	}
	
	this.getDrawing = function()
	{
		return _elem;
	}
}

/**
 * @memberOf FireMapplet
 * @class cover
 * Аггрегирует статусы разных событий для нескольких источников (загружаются данные, слишком большая область и т.п.)
 */
var AggregateStatus = function()
{
	/** Изменение состояние аггрегатора, а не отдельных состояний источников
	 * @name cover.AggregateStatus.change
	 * @event
	 */
	var _statuses = {};
	var _statusCommon = true;
	var _this = this;
	
	var _updateCommonStatus = function()
	{
		var newStatus = true;
		for ( var k in _statuses )
			if ( !_statuses[k] )
			{
				newStatus = false;
				break;
			}
			
		var isStatusChanged = newStatus != _statusCommon;
		_statusCommon = newStatus;
			
		if (isStatusChanged) 
			$(_this).triggerHandler('change');
	}
	
	//public
	this.setStatus = function( type, status )
	{
		_statuses[type] = status;
		_updateCommonStatus();
	}
	
	this.getCommonStatus = function(){ return _statusCommon };
}

var _formatDateForServer = function( datetime, skipTime )
{
	var dateString = datetime.getDate() + "." + (datetime.getMonth()+1) + "." + datetime.getFullYear();
	var timeString = (typeof skipTime === 'undefined' || !skipTime) ? " " + datetime.getHours() + ":" + datetime.getMinutes() + ":" + datetime.getSeconds() : "";
	return dateString + timeString;
}

/*
 ************************************
 *          Data Providers          *
 ************************************/
 
var IDataProvider = {};
// {
	// getDescription: function(){}, //возвращает строчку, которая показывается рядом с checkbox
	// getData: function( dateBegin, dateEnd, bbox, onSucceess, onError ){} //onSucceess(data) - полученные данные; onError(type) - ошибка определённого типа
// };

IDataProvider.ERROR_TOO_MUCH_DATA = 0;
IDataProvider.SERVER_ERROR = 1;
IDataProvider.sendCachedCrossDomainJSONRequest = function(url, callback)
{
	var jsonCache = IDataProvider.sendCachedCrossDomainJSONRequest.jsonCache;
	if (jsonCache[url])
    {
		jsonCache[url].done(callback);
    }
	else
    {
        jsonCache[url] = $.Deferred().done(callback);
		sendCrossDomainJSONRequest(url, function(ret)
		{
			jsonCache[url].resolve(ret);
		});
    }
}
IDataProvider.sendCachedCrossDomainJSONRequest.jsonCache = {};

/** Провайдер данных об очагах пожаров
* @memberOf FireMapplet
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого берутся данные о пожарах. Default: http://sender.kosmosnimki.ru/
*/
var FireSpotProvider = function( params )
{
	var _params = $.extend({ host: 'http://sender.kosmosnimki.ru/' }, params );
	
	this.getDescription = function() { return _gtxt("firesWidget.FireSpots.Description"); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
		var urlBbox = bbox ? '&Polygon=POLYGON((' + bbox.minX + ' ' + bbox.minY + ', ' + bbox.minX + ' ' + bbox.maxY + ', ' + bbox.maxX + ' ' + bbox.maxY + ', ' + bbox.maxX + ' ' + bbox.minY + ', ' + bbox.minX + ' ' + bbox.minY + '))' : "";
		//var urlBbox = bbox ? "&MinX=" + bbox.minX + "&MinY=" + bbox.minY + "&MaxX=" + bbox.maxX + "&MaxY=" + bbox.maxY : "";
		var urlFires = _params.host + "Fires.ashx?type=1&StartDate=" + dateBegin + "&EndDate=" + dateEnd + urlBbox;
		
		IDataProvider.sendCachedCrossDomainJSONRequest(urlFires, function(data)
		{
			if (data.Result != 'Ok')
			{
				onError( data.Result == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
				return;
			}
			
			var resArr = [];
			for ( var d = 0; d < data.Response.length; d++ )
			{
				var a = data.Response[d];
				resArr.push({
                    x: a[1], 
                    y: a[0], 
                    date: a[4], 
                    category: a[3] < 50 ? 0 : (a[3] < 100 ? 1 : 2), 
                    balloonProps: {
                        "Время наблюдения": a[5] + ' ' + a[4] + " (UTC)", 
                        //"Время": a[5] + "&nbsp;(Greenwich Mean Time)", 
                        "Вероятность": a[2]
                    }
                });
			}
			onSucceess( resArr );
		});
	}
}

/** Провайдер данных о гарях
* @memberOf FireMapplet
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого берутся данные о гарях. Default: http://sender.kosmosnimki.ru/
*/
var FireBurntProvider = function( params )
{
	var _params = $.extend({host: 'http://sender.kosmosnimki.ru/'}, params);
	
	this.getDescription = function() { return _gtxt("firesWidget.Burnt.Description"); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
		var urlBbox = bbox ? "&MinX=" + bbox.minX + "&MinY=" + bbox.minY + "&MaxX=" + bbox.maxX + "&MaxY=" + bbox.maxY : "";
		var urlBurnt = _params.host + "FireSender.ashx?type=2&StartDate=" + dateBegin + "&EndDate=" + dateEnd + urlBbox;
		
		IDataProvider.sendCachedCrossDomainJSONRequest(urlBurnt, function(burntArr)
		{
			if (!burntArr) 
			{
				onError( IDataProvider.ERROR_TOO_MUCH_DATA );
				return;
			}
			
			var resArr = [];
			
			for ( var d = 0; d < burntArr.length; d++ )
			{
				var curBurnt = burntArr[d];
				resArr.push({ geometry: from_merc_geometry(curBurnt[10][0].geometry), balloonProps: {"Тип растительности": curBurnt[3], "Источник": curBurnt[4]}, date: curBurnt[2]});
			}
			
			onSucceess( resArr );
		});
	}
}

/** Провайдер покрытия снимками modis
* @memberOf FireMapplet
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого загружаются слои с модисом. Default: http://maps.kosmosnimki.ru/<br/>
*/
var ModisImagesProvider = function( params )
{
    var _params = $.extend({host: "http://maps.kosmosnimki.ru/", map: window.globalFlashMap}, params)
    var layersNamesToLoad = ['EB271FC4D2AD425A9BAA78ADEA041AB9', '533FCC7439DA4A2EB97A2BE77887A462'],
        //leftToLoad = layersNamesToLoad.length,
        modisLayers = {},
        overallDeferred = null;
        
	var addModisLayers = function(callback)
    {
        if (overallDeferred)
        {
            overallDeferred.done(function()
            {
                callback(modisLayers);
            });
            return;
        }
        
        var deferreds = [];
        for (var iL = 0; iL < layersNamesToLoad.length; iL++)
            (function(layerName)
            {
                var curDef = new $.Deferred();
                deferreds.push(curDef);
                sendCrossDomainJSONRequest(_params.host + "Layer/GetLayerJson.ashx?WrapStyle=func&LayerName=" + layerName, function(response)
                {
                    if (!parseResponse(response))
                        return;
                    
                    var layerProperties = {type:'layer', content: response.Result};
                    
                    layerProperties.content.properties.styles = [
                        {
                            "Name":"контура",
                            "MinZoom":1,
                            "MaxZoom":2,
                            "BalloonEnable":true,
                            "DisableBalloonOnClick":false,
                            "DisableBalloonOnMouseMove":true,
                            "RenderStyle":{"outline":{"color":255,"thickness":1},"fill":{"color":16777215,"opacity":0}}
                        },
                        {
                            "Name":"изображения",
                            "MinZoom":3,
                            "MaxZoom":10,
                            "BalloonEnable":true,
                            "DisableBalloonOnClick":false,
                            "DisableBalloonOnMouseMove":true,
                            "RenderStyle":{}
                        }
                    ]
                    
                    var TiledQuicklook = _params.host + 'TileSenderSimple.ashx?TilePath=OperativeMODIS[TILES]/';
                    
                    layerProperties.content.properties.mapName = _params.map.properties.name;
                    layerProperties.content.properties.hostName = _params.host.substring(7, _params.host.length-1);
                    layerProperties.content.properties.visible = true;
                    
                    _params.map.addLayer(layerProperties.content, true);
                    modisLayers[layerName] = _params.map.layers[layerName];
                    // modisLayers[layerName].filters[1].setFilter("`IsDay` = 'True'");
                    modisLayers[layerName].filters[1].setFilter("`IsDay` = 'True'");
                    
                    modisLayers[layerName].enableTiledQuicklooks(function(o)
                    {
                        return TiledQuicklook.replace(/\[([a-zA-Z0-9_а-яА-Я ]+)\]/g, function()
                        {
                            return o.properties[arguments[1]];
                        });
                    }, 3, 10);
                    
                    curDef.resolve();

                })
            })( layersNamesToLoad[iL] );
        
        overallDeferred = $.when.apply($, deferreds).done(function()
        {
            callback(modisLayers);
        });
       
    }
	
	this.getDescription = function() { return _gtxt("firesWidget.DialyCoverage.Description"); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
        addModisLayers(function(layers)
        {
            for (var iL in layers)
                layers[iL].setDateInterval(dateBegin, dateEnd);
                
            onSucceess({modisLayers: layers});
        })
	}
}

var _createHoverFunction = function(params, balloonProps)
{
	var addGeometrySummary = typeof params.addGeometrySummary !== 'undefined' ? params.addGeometrySummary : true;
	
	return function(o)
	{
		var p = balloonProps[o.objectId];
		
		if (!p) return;
					
		var res = typeof params.title !== 'undefined' ? params.title : "";
		for ( var i in p )
			res += "<b>" + i + ":</b> " + p[i] + "<br />";
		
		if (addGeometrySummary)
			res += o.getGeometrySummary();
		
		return res + (typeof params.endTitle !== 'undefined' ? "<br/>" + params.endTitle : "");
	}
}

var _hq = {
	getDistant: function(cpt, bl) {
		var Vy = bl[1][0] - bl[0][0];
		var Vx = bl[0][1] - bl[1][1];
		return (Vx * (cpt[0] - bl[0][0]) + Vy * (cpt[1] -bl[0][1]))
	},
	findMostDistantPointFromBaseLine: function(baseLine, points) {
		var maxD = 0;
		var maxPt = new Array();
		var newPoints = new Array();
		for (var idx in points) {
			var pt = points[idx];
			var d = this.getDistant(pt, baseLine);
			
			if ( d > 0) {
				newPoints.push(pt);
			} else {
				continue;
			}
			
			if ( d > maxD ) {
				maxD = d;
				maxPt = pt;
			}
		
		} 
		return {'maxPoint':maxPt, 'newPoints':newPoints}
	},

	buildConvexHull: function(baseLine, points) {
		
		var convexHullBaseLines = new Array();
		var t = this.findMostDistantPointFromBaseLine(baseLine, points);
		if (t.maxPoint.length) {
			convexHullBaseLines = convexHullBaseLines.concat( this.buildConvexHull( [baseLine[0],t.maxPoint], t.newPoints) );
			convexHullBaseLines = convexHullBaseLines.concat( this.buildConvexHull( [t.maxPoint,baseLine[1]], t.newPoints) );
			return convexHullBaseLines;
		} else {       
			return [baseLine];
		}    
	},
	getConvexHull: function(points) {	

		if (points.length == 1)
			return [[points[0], points[0]]];
			
		//find first baseline
		var maxX, minX;
		var maxPt, minPt;
		for (var idx in points) {
			var pt = points[idx];
			if (pt[0] > maxX || !maxX) {
				maxPt = pt;
				maxX = pt[0];
			}
			if (pt[0] < minX || !minX) {
				minPt = pt;
				minX = pt[0];
			}
		}
		var ch = [].concat(this.buildConvexHull([minPt, maxPt], points),
						   this.buildConvexHull([maxPt, minPt], points))
		return ch;
	},
	MultiPolygonUnion: function(multiPolygon)
	{
		var matrixMultiPolygon = [];
		var unitedMultiPolygon = [];
		var nStartPolygons = 0;
		
		do {
			nStartPolygons = multiPolygon.length;
			unitedMultiPolygon = [];
			
			while(multiPolygon.length > 0){
				currentPolygon = multiPolygon.pop()
				var iOther = 0;
				
				// Check if it overlaps with any remaining polygons
				while(iOther < multiPolygon.length) {
				
					var unionResults = currentPolygon.union(multiPolygon[iOther]);
					
					if(unionResults != null){
						currentPolygon = unionResults;
						multiPolygon.splice(iOther,1);
					} else {
						iOther++;
					}					
				}			
				unitedMultiPolygon.push(currentPolygon)				
			}
			multiPolygon = unitedMultiPolygon;
		}while(multiPolygon.length < nStartPolygons);
		
		for(var i = 0; i < unitedMultiPolygon.length;i++) {
			var poly = unitedMultiPolygon[i].to_point_array_2d();
			poly.push(poly[0]); 
			
			matrixMultiPolygon.push([poly]);
		}	
		
		return matrixMultiPolygon;
		
		/*
		
		var currentPolygon = [];
		
		
		function getPolygonBBox(polygon){
			bbox = [1000,1000,-1000,-1000];
			for(var i = 0;i < polygon.length) {
				if(polygon[i][0] < bbox[0])
					bbox[0] = polygon[i][0];
				if(polygon[i][1] < bbox[1])
					bbox[1] = polygon[i][1];
				if(polygon[i][0] > bbox[0])
					bbox[2] = polygon[i][0];
				if(polygon[i][1] > bbox[1])
					bbox[3] = polygon[i][1];
			}
			return bbox;
		}
		
		// For every polygon
		while((currentPolygon = multiPolygon.pop()) != null) {
			
			
			curBbox = getPolygonBBox(currentPolygon);
			
			
			// Check if it overlaps with any remaining polygons
			for(var iOther = 0;iOther < multiPolygon.length;iOther++) {
				otherBbox = getPolygonBBox(currentPolygon);
				
				// First check the bounding boxes, if they dont overlap, skip checking for intersetctions.
				if(otherBbox[0] > curBbox[3] || otherBbox[3] < curBbox[0] || otherBbox[1] > curBbox[4] || otherBbox[4] < curBbox[1]){
					continue;
				}
				
				// Otherwise lets check if any of the lines intersect
				newPoly1 = []
				for(var iCurLine = 0;iCurLine < polygon.length-1) {
					curStart = currentPolygon[iCurLine];
					curEnd = currentPolygon[iCurLine+1];
					
					curHoriz = (curStart[1] == curEnd[1]);
					
					for(var iOtherLine = 0;iOtherLine < multiPolygon[iOther].length-1) {
						othStart = currentPolygon[iCurLine];
						othEnd = currentPolygon[iCurLine+1];
						
						othHoriz = (othStart[1] == othEnd[1]);
						
						// Since the lines are horizontal or vertical we can easily check intersections
						// Cases:
						//    a) Both Vertical - no intersection
						//    b) Both horizontal = no intersection
						//    c) One is to the left, to the right to the top to the bottom of the other - no intersection.
						//    d) otherwise intersection at a point that is the Y of the horizontal, and the X of vertical line.
						
						if(curHoriz == othHoriz){
							continue;
						}
						if(curHoriz == 1 && ((curStart[1] > othStart[1] && curStart[1] > othEnd[1]) || curStart[1] < othStart[1] && curStart[1] < othEnd[1])) {
							continue
						}
						if(curHoriz == 0 && ((curStart[0] > othStart[0] && curStart[0] > othEnd[0]) || curStart[0] < othStart[0] && curStart[0] < othEnd[0])) {
							continue
						}
						
						if(curHoriz == 1) {
							intersection = [othStart[0] curStart[1]];
						}else{
							intersection = [curStart[0] othStart[1]];
						}
					}
					
				}
			}
			
			unitedMultiPolygon.push(currentPolygon);
		}
		*/
		return unitedMultiPolygon;
		
	},
	getPixelMultiPolygon: function(points) {
		results = [];
		
		for(var i = 0;i < points.length;i++) {
			var pt = points[i];
			var dims = ModisPixelDimensions[pt[2]];
			
			var X1 = merc_x(pt[0]);
			var Y1 = merc_y(pt[1]);
			
			var X2 = X1 + 1000;
			var Y2 = Y1;
			
			var newLat = pt[1];
			var newLon = from_merc_x(X2);
			
			var mdelta = distVincenty(pt[0],pt[1],newLon,newLat);

			var h_scale = dims[0] / mdelta;
			var v_scale = dims[1] / mdelta;
			
					
			var h_dx = 0.5*(X2 - X1)*h_scale;
			var h_dy = 0.5*(Y2 - Y1)*h_scale;
			
			var v_dx = 0.5*(Y2-Y1)*v_scale;
			var v_dy = 0.5*(X2-X1)*v_scale;
			
			var frontX = X1 + h_dx;
			var frontY = Y1 + h_dy;
			
			var backX = X1 - h_dx;
			var backY = Y1 - h_dy;
		
			var corner1x =  frontX + v_dx;
			var corner1y =  frontY + v_dy;
		
			var corner2x =  frontX - v_dx;
			var corner2y =  frontY - v_dy;
		
			var corner3x =  backX - v_dx;
			var corner3y =  backY - v_dy;
			
			var corner4x =  backX + v_dx;
			var corner4y =  backY + v_dy;    
			
			
			results.push( SpatialQuery.$p([
				[from_merc_x(corner1x),from_merc_y(corner1y)],
				[from_merc_x(corner2x),from_merc_y(corner2y)],
				[from_merc_x(corner3x),from_merc_y(corner3y)],
				[from_merc_x(corner4x),from_merc_y(corner4y)]
				]));
		}
		
		return results;
	}
}

//По начальной и конечной дате формирует строчку для отображения интервала дат
var _datePeriodHelper = function(dateMin, dateMax)
{
	if (dateMin === dateMax)
		return dateMin;
	else
		return dateMin + ' - ' + dateMax;
}

/** Провайдер данных об очагах и кластерах пожаров
* @memberOf FireMapplet
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого берутся данные о пожарах. Default: http://sender.kosmosnimki.ru/
* <i> {Bool} onlyPoints </i> Возвращать только очаги без класетеров
* <i> {Bool} onlyClusters </i> Возвращать только кластеры без очагов
* <i> {String} description </i> ID текста для описания в _translation_hash. Default: firesWidget.FireSpotClusters.Description
*/
var FireSpotClusterProvider = (function(){

	//этот кэш хранит уже обработанные данные с построенными границами кластеров и т.п.
	var _cache = {};
	var _lastRequestId = 0;
	
	var _processResponce = function(data)
	{
		if (data.Result != 'Ok')
		{
			//onError( data.Result == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
			return data.Result;
		}
		
		var resArr = [];
		var clusters = {};
		var clusterCentroids = {};
		var clustersMinMaxDates = {};
        
        var updateMinMaxDates = function(id, hotSpot)
        {
            var mm = clustersMinMaxDates[id];
            var datetimeStr = hotSpot.date + ' ' + hotSpot.time;
            var localValue = $.datepicker.parseDateTime('yy.mm.dd', 'hh:mm', datetimeStr).valueOf()/1000;
            var timeOffset = (new Date(localValue*1000)).getTimezoneOffset()*60;
            
            var datetimeInt = localValue - timeOffset;
            
            if (mm.min === null || mm.min > datetimeInt) 
            {
                mm.min = datetimeInt;
                mm.minStr = datetimeStr;
            }
            
            if (mm.max === null || mm.max < datetimeInt)
            {
                mm.max = datetimeInt;
                mm.maxStr = datetimeStr;
            }
        }
        
		for ( var d = 0; d < data.Response.length; d++ )
		{
			var a = data.Response[d];
            var parsedTime = $.datepicker.parseTime('hh:mm', a[4]);
			var dateInt = $.datepicker.parseDate('yy.mm.dd', a[3]).valueOf()/1000 + parsedTime.hour*3600 + parsedTime.minute*60;
            var datetimeString = $.datepicker.formatTime('yy.mm.dd', a[3]).valueOf()/1000 + parsedTime.hour*3600 + parsedTime.minute*60;
            
			var hotSpot = {
                clusterId: a[2], 
                hotspotId: a[7], 
                x: a[1], 
                y: a[0], 
				trackId: a[8],
                date: a[3], 
                time: a[4], 
                dateInt: dateInt, 
                category: a[6] < 50 ? 0 : (a[4] < 100 ? 1 : 2), 
                balloonProps: {
                    "Время наблюдения": a[3] + ' ' + a[4] + " (UTC)"
                    //"Время": a[4] + "&nbsp;(Greenwich Mean Time)"
                } 
            };
            
			resArr.push(hotSpot);
			var clusterID = 'id' + a[2];
			
			if (a[2] !== null && a[2] >= 0)
			{
				if (typeof clusters[clusterID] === 'undefined')
				{
					clusters[clusterID] = [];
					clusterCentroids[clusterID] = {x: 0, y:0};
                    clustersMinMaxDates[clusterID] = { min: null, max: null };
				}
					
				clusters[clusterID].push([hotSpot.x, hotSpot.y,hotSpot.trackId]);
				clusterCentroids[clusterID].x += hotSpot.x;
				clusterCentroids[clusterID].y += hotSpot.y;
                
                updateMinMaxDates(clusterID, hotSpot);				
			}
		}
				
		var resClusters = [];
		
		// Compute convex hulls for all clusters. We will compute pixel areas later, on demand
		for(var k in clusters) {

			resClusters.push({ 
					x: clusterCentroids[k].x/clusters[k].length, 
					y: clusterCentroids[k].y/clusters[k].length,
					label: clusters[k].length,
					points: clusters[k].length,
					clusterId: k.substr(2),
					balloonProps: {
						"Кол-во точек пожаров": clusters[k].length, 
						"Время наблюдения": _datePeriodHelper(clustersMinMaxDates[k].minStr, clustersMinMaxDates[k].maxStr)
					}
				});
		}
		
		return {fires: resArr, clusters: resClusters, clusterData: clusters};
	}
	
	//кэширует уже обработанные данные
	//гарантирует, что будут вызываться калбеки только для последнего запроса на сервер
	var _addRequestCallback = function(url, callback)
	{
		if (!(url in _cache))
		{
			_lastRequestId++;
			var curRequestId = _lastRequestId;
			_cache[url] = {status: 'waiting', data: null, callbacks: [callback]};
			IDataProvider.sendCachedCrossDomainJSONRequest(url, function(data)
			{
				if (curRequestId !== _lastRequestId) return;
				
                _cache[url].status = 'done';
                _cache[url].data = _processResponce(data);
                for (var k = 0; k < _cache[url].callbacks.length; k++)
                    _cache[url].callbacks[k](_cache[url].data);
			});
		} else {
			if (_cache[url].status === 'done')
				callback(_cache[url].data);
			else
				_cache[url].callbacks.push(callback);
		}
	}
	
	return function( params )
	{
		var _params = $.extend({
			host: 'http://sender.kosmosnimki.ru/',
			requestType: 'GetClustersPointsBBoxV2',
			onlyPoints: false, 
			onlyClusters: false, 
			description: "firesWidget.FireSpotClusters.Description"
		}, params );
		
		this.getDescription = function() { return _gtxt(_params.description); }
		this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
		{
			var urlBbox = bbox ? '&MinX='+ bbox.minX + '&MinY='+ bbox.minY + '&MaxX='+ bbox.maxX + '&MaxY='+ bbox.maxY : "";
            var restrictionString = "";
            if (_params.minPower !== null)
                restrictionString += '&Power=' + _params.minPower;
            if (_params.minConfidence !== null)
                restrictionString += '&Conf=' + _params.minConfidence;
                
			var urlFires = _params.host + "DBWebProxy.ashx?Type=" + _params.requestType + 
                "&StartDate=" + _formatDateForServer(dateBegin) + 
                "&EndDate=" + _formatDateForServer(dateEnd) + 
                urlBbox + 
                restrictionString;
			
			//IDataProvider.sendCachedCrossDomainJSONRequest(urlFires, function(data)
			_addRequestCallback(urlFires, function(data)
			{
				if (typeof data === 'string')
				{
					onError( data == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
					return;
				}
                data.fires.dateBegin = dateBegin;
                data.fires.dateEnd = dateEnd;
				if (_params.onlyClusters)
					onSucceess( data.clusters );
				else if (_params.onlyPoints)
					onSucceess( data.fires );
				else
					onSucceess( data );
			});
		}
	}
})();

/** Провайдер данных о кластерах пожаров
* @memberOf FireMapplet
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого берутся данные о пожарах. Default: http://sender.kosmosnimki.ru/v3/
* <i> {String} description </i> ID текста для описания в _translation_hash. Default: firesWidget.FireClustersSimple.Description
*/
var FireClusterSimpleProvider = function( params )
{
	var _params = $.extend({requestType: "GetClustersInfoBbox",  host: 'http://sender.kosmosnimki.ru/v3/', description: "firesWidget.FireClustersSimple.Description" }, params );
	
	this.getDescription = function() { return _gtxt(_params.description); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
        //кластеры пожаров мы показываем только когда есть ограничение по экстенту
        if (!bbox)
        {
            onSucceess([]);
            return;
        }
        
		var urlBbox = bbox ? '&MinX='+ bbox.minX + '&MinY='+ bbox.minY + '&MaxX='+ bbox.maxX + '&MaxY='+ bbox.maxY : "";
		var urlFires = _params.host + "DBWebProxy.ashx?Type=" + _params.requestType + "&StartDate=" + _formatDateForServer(dateBegin) + "&EndDate=" + _formatDateForServer(dateEnd) + urlBbox;
		
		IDataProvider.sendCachedCrossDomainJSONRequest(urlFires, function(data)
		{
			if (data.Result != 'Ok')
			{
				onError( data.Result == 'TooMuch' ? IDataProvider.ERROR_TOO_MUCH_DATA : IDataProvider.SERVER_ERROR );
				return;
			}
			
			var resArr = [];
			var clusters = [];
			for ( var d = 0; d < data.Response.length; d++ )
			{
				var a = data.Response[d];

				var hotSpot = {
                    clusterId: a[0], 
                    geometry: a[8], 
                    power: a[7], 
                    points: a[5], 
                    label: a[5], 
                    dateBegin: a[3], 
                    dateEnd: a[4], 
                    balloonProps: {
                        "Кол-во точек пожаров": a[5], 
                        //"Мощность": Number(a[7]).toFixed(),
                        "Период горения": _datePeriodHelper(a[3], a[4]),
                        // "Дата начала": a[3]
                        // "Дата конца": a[4]
                        "Площадь горения": prettifyArea(geoArea(a[8]))
                    }
                };
				resArr.push(hotSpot);
			}
			
			onSucceess( resArr );
		});
	}
}

var CombinedProvider = function( description, providers )
{
	var _providers = providers;
	
	this.getDescription = function() { return _gtxt(description); }
	this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
	{
		var totalResponces = 0;
		var providerResponces = [];
		for (var i = 0; i < _providers.length; i++)
			(function(i) {
				_providers[i].getData( dateBegin, dateEnd, bbox, 
					function( data )
					{
						providerResponces[i] = data;
						totalResponces++;
						
						if (totalResponces === _providers.length)
							onSucceess( providerResponces );
					},
					function( type )
					{
						onError( type );
					}
				)
			})(i);
	}
}

/*
 ************************************
 *            Renderers             *
 ************************************/
 
/** Визуализирует точки пожаров разными иконками в зависимости от их типа
* @memberOf FireMapplet
* @class 
* @param {Object} params Параметры класса: <br/>
* <i> {String} fireIcon </i> Иконка для маркеров , которая используется для всех пожаров <br/>
* <i> {Array} fireIcons </i> Вектор для иконок маркеров очагов (3 иконки для слабого, среднего и сильного пожаров). Используется, если не указан fireIcon <br/>
* <i> {String} fireIconsHost </i> Путь, откуда берутся иконки с предеопределёнными названиями. Используется, если нет fireIcon и fireIcons. Default: http://maps.kosmosnimki.ru/images/ <br/>
*/
var FireSpotRenderer = function( params )
{
	var _params = $.extend({
        fireIconsHost: 'http://maps.kosmosnimki.ru/images/', 
        minZoom: 1, 
        maxZoom: 17, 
        customStyleProvider: null, 
        onclick: null, 
        bringToDepth: false, 
        map: window.globalFlashMap
    }, params);
	
	var _depthContainer = _params.map.addObject();
	if (_params.bringToDepth) _depthContainer.bringToDepth(_params.bringToDepth);
	
	var _firesObj = null;
	var _balloonProps = {};
	this.bindData = function(data)
	{
		if (_firesObj) _firesObj.remove();
        _firesObj = null;
        
        if (!data) return;
        
		_balloonProps = {};
		_firesObj = _depthContainer.addObject();
		_firesObj.setVisible(false);
		
		var weak = _firesObj.addObject();
		var medium = _firesObj.addObject();
		var strong = _firesObj.addObject();
		
		weak.setZoomBounds(_params.minZoom, _params.maxZoom);
		medium.setZoomBounds(_params.minZoom, _params.maxZoom);
		strong.setZoomBounds(_params.minZoom, _params.maxZoom);
		
		if (_params.customStyleProvider === null)
		{
			var imageNames = ["","",""];
			if (_params.fireIcon)
				imageNames = [_params.fireIcon, _params.fireIcon, _params.fireIcon];
			else if (_params.fireIcons)
				imageNames = _params.fireIcons;
			else
				imageNames = [ _params.fireIconsHost + "fire_weak.png", _params.fireIconsHost + "fire.png", _params.fireIconsHost + "fire_strong.png" ];
				
			weak.setStyle({ marker: { image: imageNames[0], center: true} });
			medium.setStyle({ marker: { image: imageNames[1], center: true} });
			strong.setStyle({ marker: { image: imageNames[2], center: true } });
		}
		
		if (_params.bringToDepth)
		{
			weak.bringToDepth(_params.bringToDepth);
			medium.bringToDepth(_params.bringToDepth);
			strong.bringToDepth(_params.bringToDepth);
		}

		var _obj = {'weak': {'node':weak, 'arr': [], 'balloonProps': []}, 'medium': {'node':medium, 'arr': [], 'balloonProps': []}, 'strong': {'node':strong, 'arr': [], 'balloonProps': []}};
		for (var i = 0; i < data.length; i++)
		{
			var a = data[i];
			
			if (!a) continue;
			
			var objContainer = null;
			// var addBallonProps = {"Дата": a.date };
			var addBallonProps = {};
			
			var key = 'medium';
			if (typeof a.category != 'undefined')
			{
				var isWeak = (a.category == 0);
				var isMedium = (a.category == 1);
				objContainer = (isWeak ? weak : isMedium ? medium : strong);
				key = (isWeak ? 'weak' : isMedium ? 'medium' : 'strong');
				addBallonProps["Категория"] = (isWeak ? "Слабый" : isMedium ? "Средний" : "Сильный");
			}
			else
				objContainer = medium;
				
			var objProperties = a.hotspotId ? {hotspotId: a.hotspotId } : {};
			objProperties.dateInt = a.dateInt;
			objProperties.clusterId = a.clusterId;
			_obj[key].arr.push( {geometry: { type: "POINT", coordinates: [a.x, a.y] }, properties: objProperties, src: a} );
			
			if (typeof a.balloonProps !== 'undefined')
				_obj[key].balloonProps.push( $.extend({}, a.balloonProps, addBallonProps) );
			else
				_obj[key].balloonProps.push( null );
		}
		for (var k in _obj)
		{
			var ph = _obj[k];
			if(ph.arr.length > 0) {
				
				//кастомные стили для каждого объекта
				if (_params.customStyleProvider)
                {
					for (var i = 0; i < ph.arr.length; i++)
						//arr[i].setStyle(_params.customStyleProvider(ph.arr[i].src));
						ph.arr[i].setStyle = {'regularStyle': _params.customStyleProvider(ph.arr[i].src)};
                }
				
				//метки
				for (var i = 0; i < ph.arr.length; i++){
					if (typeof ph.arr[i].src.label !== 'undefined'){
                        ph.arr[i].setLabel = ph.arr[i].src.label;
						//arr[i].setLabel(ph.arr[i].src.label);
					}
				}
                
				var arr = ph.node.addObjects( ph.arr );
                
                for (var i = 0; i < arr.length; i++)
				{
					_balloonProps[arr[i].objectId] = ph.balloonProps[i];
				}
			}
		}
		
		var ballonHoverFunction = _createHoverFunction(_params, _balloonProps);
		
		weak.enableHoverBalloon(ballonHoverFunction);
		medium.enableHoverBalloon(ballonHoverFunction);
		strong.enableHoverBalloon(ballonHoverFunction);
		
		if (_params.onclick)
		{
			weak.setHandler  ('onClick', _params.onclick );
			medium.setHandler('onClick', _params.onclick );
			strong.setHandler('onClick', _params.onclick );
		}
	}
	
	this.filterByDate = function(date)
	{
		if (!_firesObj) return;
		
		var filter = "`dateInt`='" + date + "'";
		_firesObj.setFilter(filter);
	}
	
	this.setVisible = function(flag)
	{
		if (_firesObj) _firesObj.setVisible(flag);
	}
	
	this.bindClickEvent = function(handler)
	{
		_params.onclick = handler;
	}
}

var FireSpotRendererLayer = function( params )
{
    var _params = $.extend({
        pointLayerName: 'A78AC25E0D924258B5AF40048C21F7E7', 
        geomLayerName: '51905F330AD84C23B4C0F5ABFDACEBE5',
        mapName: '3PORS', 
        host: 'maps.kosmosnimki.ru'}, params);
    
    var requestSent = false;
    var curPeriod = null;
    var curVisibility = false;
    
    var loadFireLayers = function()
    {
        if (requestSent) return;
        requestSent = true;
        _params.map.loadMap(_params.host, _params.mapName, function(data)
        {
            var layer = _params.map.layers[_params.pointLayerName];
            if (curPeriod)
            {
                if (typeof _params.minZoom !== 'undefined')
                {
                    //var maxZoom = layer.getZoomBounds();
                    layer.setZoomBounds(_params.minZoom, 17);
                }
                
                layer.setDateInterval(curPeriod.dateBegin, curPeriod.dateEnd);
            }
            
            _params.map.layers[_params.pointLayerName].setVisible(curVisibility)
        });
    }
    
    
    this.bindData = function(data)
	{
        curPeriod = {dateBegin: data.dateBegin, dateEnd: data.dateEnd};
        loadFireLayers();
        
        if (_params.pointLayerName in _params.map.layers)
        {
            _params.map.layers[_params.pointLayerName].setDateInterval(data.dateBegin, data.dateEnd);
        }
    }
    
    this.setVisible = function(flag)
	{
        curVisibility = flag;
        loadFireLayers();
        
        if (_params.pointLayerName in _params.map.layers)
        {
            _params.map.layers[_params.pointLayerName].setVisible(flag);
        }
	}
}

/** Рисует на карте гари
* @memberOf FireMapplet
* @class
*/
var FireBurntRenderer = function( params )
{
	var defaultStyle = [
			{ outline: { color: 0xff0000, thickness: 2 }, fill: { color: 0xffffff, opacity: 5 } },
			{ outline: { color: 0xff0000, thickness: 3 }, fill: { color: 0xffffff, opacity: 15 } }
		];
	var _params = $.extend({
        minZoom: 1,
        maxZoom: 17, 
        defStyle: defaultStyle, 
        bringToDepth: false, 
        title: "<b style='color: red;'>СЛЕД ПОЖАРА</b><br />",
        map: window.globalFlashMap
    }, params);
    
	var _burntObj = null;
	
	var _depthContainer = _params.map.addObject();
	if (typeof _params.bringToDepth !== 'undefined')
        _depthContainer.bringToDepth(_params.bringToDepth);
	
	var _balloonProps = {};
	this.bindData = function(data)
	{
		if (_burntObj) _burntObj.remove();
        _burntObj = null;
        
        if (!data) return;
	        
		_balloonProps = {};
		_burntObj = _depthContainer.addObject();
		_burntObj.setZoomBounds(_params.minZoom, _params.maxZoom);
		_burntObj.setVisible(false);
		_burntObj.setStyle( _params.defStyle[0], _params.defStyle[1] );
		
		for (var i = 0; i < data.length; i++)
			(function(b){
				if (!b) return;
				if (b.geometry.coordinates[0].length == 2)
				{
					b.geometry.type = "POINT";
					b.geometry.coordinates = b.geometry.coordinates[0];
				}
				
				var obj = _burntObj.addObject( b.geometry );

				if (typeof b.styleID !== 'undefined' && typeof _params.styles != 'undefined' && typeof _params.styles[b.styleID] != 'undefined')
					obj.setStyle( _params.styles[b.styleID][0], _params.styles[b.styleID][1] );
					
				if (typeof b.balloonProps !== 'undefined'){					
					_balloonProps[obj.objectId] = $.extend({}, b.balloonProps, {"Дата": b.date});
				}else{
					_balloonProps[obj.objectId] = null;
				}
					
			})(data[i]);
			
		_burntObj.enableHoverBalloon(_createHoverFunction(_params, _balloonProps));

		
	}
	
	this.setVisible = function(flag)
	{
		if (_burntObj) _burntObj.setVisible(flag);
	}
}

/** Рисует на карте гари
* @memberOf FireMapplet
* @class
*/
var FireBurntRenderer2 = function( params )
{
	var defaultStyle = [
			{ outline: { color: 0xff0000, thickness: 2 }, fill: { color: 0xffffff, opacity: 5 } },
			{ outline: { color: 0xff0000, thickness: 3 }, fill: { color: 0xffffff, opacity: 15 } }
		];
	var _params = $.extend({
        minZoom: 1,
        maxZoom: 17, 
        defStyle: defaultStyle, 
        title: "<b style='color: red;'>СЛЕД ПОЖАРА</b><br />",
        map: window.globalFlashMap
    }, params);
    
	var _burntObj = null;
	
	var clusterData = {};
	var clusterObjects = {};
	var resClustersData = {};
	
	var _depthContainer = _params.map.addObject();
	if (_params.bringToDepth !== 'undefined') 
        _depthContainer.bringToDepth(_params.bringToDepth);
	
	var _balloonProps = {};
    
    var updateClusters = function()
    {		
        var z = gmxAPI.map.getZ();
        if ( z > _params.maxZoom || z < _params.minZoom ) 
            return;
			
		// Compute modis pixel dimensions table
		buildModisPixelDimensionsTable();
		
        // console.time('onMoveEnd');
        var bounds = gmxAPI.map.getVisibleExtent();

        for (var cCluster in resClustersData)
        {
            
            var clusterId = resClustersData[cCluster].clusterId;
            var balloonProps = resClustersData[cCluster].balloonProps;
            
            // Check if cluster is within bounds, if it is we compute geometry for it.
            if(resClustersData[cCluster].x < bounds.minX || resClustersData[cCluster].x > bounds.maxX || resClustersData[cCluster].y < bounds.minY || resClustersData[cCluster].y > bounds.maxY){
                continue;
            }
            
            multiPolygon = _hq.getPixelMultiPolygon(clusterData["id"+clusterId]);
                
            tmpPolygon = _hq.MultiPolygonUnion(multiPolygon);
            
            polyCoordinates = tmpPolygon;
            
            var geometry = {type: "MULTIPOLYGON", coordinates: polyCoordinates};
 
			var strArea = prettifyArea(geoArea(geometry));
			
            // clusterObjects[clusterId].remove();
            var obj = _burntObj.addObject( geometry );
            
            clusterObjects[clusterId] = obj;
            
            if (typeof balloonProps !== 'undefined')
			{
                _balloonProps[obj.objectId] = $.extend({}, balloonProps, {"Дата": resClustersData[cCluster].date,"Площадь горения":strArea});
            }else{
                _balloonProps[obj.objectId] = null;
            }
            
            delete resClustersData[cCluster];
            
        }
        //console.profileEnd();
        // console.timeEnd('onMoveEnd');
    };
    
    gmxAPI.map.addListener('onMoveEnd', updateClusters);
    
	this.bindData = function(data)
	{
		if (_burntObj) _burntObj.remove();
        _burntObj = null;
        
        if (!data) return;
		
		if(typeof data.clusterData !== 'undefined'){
			clusterData = $.extend(true, {}, data.clusterData);
		}
		if(typeof data.clusters !== 'undefined'){
			resClustersData = $.extend(true, {}, data.clusters);
		}
        
		_balloonProps = {};
		_burntObj = _depthContainer.addObject();
		_burntObj.setZoomBounds(_params.minZoom, _params.maxZoom);
		_burntObj.setVisible(false);
		_burntObj.setStyle( _params.defStyle[0], _params.defStyle[1] );
        
        updateClusters();
        
        _burntObj.enableHoverBalloon(_createHoverFunction(_params, _balloonProps));
	}
	
	this.setVisible = function(flag)
	{
		if (_burntObj) _burntObj.setVisible(flag);
	}
}

/** Рисует на карте картинки MODIS
* @memberOf FireMapplet
* @class 
*/
var ModisImagesRenderer = function( params )
{
    var modisLayers = null;
	this.bindData = function(data)
	{
        if (data)
            modisLayers = data.modisLayers;
	}
	
	this.setVisible = function(flag)
	{
		if (modisLayers)
            for (iL in modisLayers)
                modisLayers[iL].setVisible(flag);
	}
}

var CombinedFiresRenderer = function( params )
{
	var _params = $.extend({ map: window.globalFlashMap, fireIconsHost: 'http://maps.kosmosnimki.ru/images/', minGeometryZoom: 8, minWholeFireZoom: 8, maxClustersZoom: 7}, params);
	var customStyleProvider = function(obj)
	{
		var style = { marker: { image: _params.fireIconsHost + 'fire_sample.png', center: true, scale: String(Math.sqrt(obj.points)/5)} };
		if (obj.label >= 10)
			style.label = { size: 12, color: 0xffffff, align: 'center'};
		return style;
	}
	
	var defStyle = [
		{ outline: { color: 0xff0000, thickness: 2 }, fill: { color: 0xff0000, opacity: 15 }, marker: {size: 2, color: 0xff0000, thickness: 1} },
		{ outline: { color: 0xff4444, thickness: 2 }, fill: { color: 0xff4444, opacity: 40 }, marker: {size: 2, color: 0xff0000, thickness: 1} }
	];
	
	var wholeDefStyle = [
		{ outline: { color: 0xff00ff, thickness: 1, dashes: [3,3] }, fill: { color: 0xff00ff, opacity: 7 } },
		{ outline: { color: 0xff00ff, thickness: 1, dashes: [3,3] }, fill: { color: 0xff00ff, opacity: 7 } }
	];
	
	var _clustersRenderer  = new FireSpotRenderer  ({map: _params.map, maxZoom: _params.maxClustersZoom,  title: "<div style='margin-bottom: 5px;'><b style='color: red;'>Пожар</b></div>", endTitle: "<div style='margin-top: 5px;'><i>Приблизьте карту, чтобы увидеть контур</i></div>", customStyleProvider: customStyleProvider});
	var _wholeFireRenderer = new FireBurntRenderer ({bringToDepth: 0, map: _params.map, minZoom: _params.minWholeFireZoom,  defStyle: wholeDefStyle, title: "<div style='margin-bottom: 5px;'><b style='color: red;'>Суммарный контур пожара</b></div>", addGeometrySummary: false});
	var _geometryRenderer  = new FireBurntRenderer2 ({bringToDepth: 1, map: _params.map, minZoom: _params.minGeometryZoom,  defStyle: defStyle, title: "<div style='margin-bottom: 5px;'><b style='color: red;'>Контур пожара</b></div>", addGeometrySummary: false});
	var _hotspotRenderer   = new FireSpotRendererLayer  ({map: _params.map, minZoom: _params.minHotspotZoom, title: "<div style='margin-bottom: 5px;'><b style='color: red;'>Очаг пожара</b></div>"});
	var _curData = null;
	
	//это некоторый хак для того, чтобы объединить в балунах контуров пожаров оперативную и историческую информацию о пожарах.
	var mergeBalloonsData = function(data)
	{
        if (!data) return;
		//будем переносить данные из инсторических в оперативных кластеры
		var clusterHash = {};
		
		for (var cl = 0; cl < data[1].length; cl++)
			clusterHash['id'+data[1][cl].clusterId] = data[1][cl];
		
		for ( var cl = 0; cl < data[0].clusters.length; cl++ )
		{
			var id = 'id' + data[0].clusters[cl].clusterId;
			if (id in clusterHash)
				$.extend( data[0].clusters[cl].balloonProps, {
					"Период горения": _datePeriodHelper(clusterHash[id].dateBegin, clusterHash[id].dateEnd),
					"Выгоревшая площадь": prettifyArea(geoArea(clusterHash[id].geometry))
				});
		}
	}
	
	this.bindData = function(data, calendar)
	{
		//mergeBalloonsData(data);
        
        data = data || [{clusters: null, fires: null}, null];
	
		_curData = data;
		_clustersRenderer.bindData(data[0].clusters);
		_geometryRenderer.bindData(data[0]);
		_hotspotRenderer.bindData(data[0].fires);
        
        if ( calendar.getModeController().getMode() !==  calendar.getModeController().SIMPLE_MODE )
            _wholeFireRenderer.bindData(data[1]);
        else
            _wholeFireRenderer.bindData( null );
	}
	
	this.setVisible = function(flag)
	{
		_clustersRenderer.setVisible(flag);
		_geometryRenderer.setVisible(flag);
		_hotspotRenderer.setVisible(flag);
		_wholeFireRenderer.setVisible(flag);
	}
	
	this.filterByDate = function(date)
	{
		_clustersRenderer.filterByDate(date);
	}
	
	this.bindSpotClickEvent = function(handler)
	{
		_hotspotRenderer.bindClickEvent(handler);
	}
	
	this.bindClusterClickEvent = function(handler)
	{
		_clustersRenderer.bindClickEvent(handler);
	}
	
	this.getHotspotIDsByClusterID = function(clusterId)
	{
		var resArr = [];
		for (var hp = 0; hp < _curData[0].fires.length; hp++)
		{
			if (_curData[0].fires[hp].clusterId == clusterId)
				resArr.push(_curData[0].fires[hp].hotspotId);
		}
		
		return resArr;
	}
}

/*
 ************************************
 *            FireControl          *
 ************************************/
 
 /**
* @memberOf FireMapplet
* @class 
*/
var FireControl = function(map)
{
	this.dateFiresBegin = null;
	this.dateFiresEnd   = null;
	
	this.requestBbox = new BoundsExt(); //bbox, для которого есть данные на данный момент.
	
	this.dataControllers = {};
	
	this.statusModel = new AggregateStatus();
	this.processingModel = new AggregateStatus();
	
	this.searchBboxController = new SearchBboxControl(map);
	
	this._currentVisibility = true;
	
	this._timeShift = null;
	
	this._map = map;
	
	this._initDeferred = new $.Deferred();
	
	FireControlCollection.instances.push(this);
	$(FireControlCollection).triggerHandler('newInstance');
}

var FireControlCollection = {instances: []};

//настройки виджета пожаров по умолчанию
FireControl.DEFAULT_OPTIONS = 
{
	firesHost:       'http://sender.kosmosnimki.ru/v3/',
	modisHost:      'http://maps.kosmosnimki.ru/',
	burntHost:       'http://sender.kosmosnimki.ru/',
	fireIconsHost:   'http://maps.kosmosnimki.ru/images/',
	//modisImagesHost: 'http://images.kosmosnimki.ru/MODIS/',
	
	initExtent: null,
    
    minPower: null,
    minConfidence: null,

	fires:      true,
	firesInit:  true,
	images:     true,
	imagesInit: true,
	burnt:      false,
	burntInit:  true
}

FireControl.prototype.saveState = function()
{
	var dc = [];
	for (k in this.dataControllers)
		dc.push({name: this.dataControllers[k].name, visible: this.dataControllers[k].visible});
	
	var resData = {
		dataContrololersState: dc, 
		bbox: this.searchBboxController.saveState() 
	}
	
	if (this._timeShift)
		$.extend(true, resData, {timeShift: this._timeShift});
	
	return resData;
}

FireControl.prototype.loadState = function( data )
{
	var dc = data.dataContrololersState;
	for (var k = 0; k < dc.length; k++)
		if (dc[k].name in this.dataControllers)
		{
			var curController = this.dataControllers[dc[k].name];
			
			curController.visible = dc[k].visible;
			$("#" + dc[k].name, this._parentDiv).attr({checked: dc[k].visible});
			curController.renderer.setVisible(curController.visible && this._currentVisibility);
		}
		
	if (data.timeShift)
		this._timeShift = $.extend({}, data.timeShift);
			
	this.searchBboxController.loadState(data.bbox);
}

//вызывает callback когда календарик проинициализирован
FireControl.prototype.whenInited = function( callback )
{
	if (this._initDeferred)
		this._initDeferred.done( callback );
}


FireControl.prototype.setVisible = function(isVisible)
{
	this._currentVisibility = isVisible;
	for (var k in this.dataControllers)
	{
		var controller = this.dataControllers[k];
		controller.renderer.setVisible(isVisible ? controller.visible : false);
	}
}

// providerParams: 
//     - isVisible - {Bool, default: true} виден ли по умолчанию сразу после загрузки
//     - isUseDate - {Bool, default: true} зависят ли данные от даты
//     - isUseBbox - {Bool, default: true} зависят ли данные от bbox
FireControl.prototype.addDataProvider = function( name, dataProvider, dataRenderer, providerParams )
{
	providerParams = $.extend( { isVisible: true, isUseDate: true, isUseBbox: true }, providerParams );
		
	this.dataControllers[name] = { 
		provider: dataProvider, 
		renderer: dataRenderer, 
		visible: providerParams.isVisible, 
		name: name, 
		params: providerParams,
		curRequestIndex: 0 //для отслеживания устаревших запросов
	};
	
	this._updateCheckboxList();
	//if (this.dateFiresBegin && this.dateFiresEnd)
	this.update();
}

FireControl.prototype.getRenderer = function( name )
{
	return (name in this.dataControllers) ? this.dataControllers[name].renderer : null;
}

FireControl.prototype._doFiltering = function(date)
{
	for (var k in this.dataControllers)
	{
		var renderer = this.dataControllers[k].renderer;
		if (typeof renderer.filterByDate !== 'undefined')
			renderer.filterByDate(date);
	}
}

//Перерисовывает все checkbox'ы. Возможно, стоит оптимизировать
FireControl.prototype._updateCheckboxList = function()
{
	$("#checkContainer", this._parentDiv).empty();
	var trs = [];
	var _this = this;
	
	for (var k in this.dataControllers)
	{
		var checkbox = _checkbox(this.dataControllers[k].visible, 'checkbox');
		
		$(checkbox).attr({id: this.dataControllers[k].name});
	
		(function(dataController){
			checkbox.onclick = function()
			{
				dataController.visible = this.checked;
				_this.update();
				dataController.renderer.setVisible(this.checked && _this._currentVisibility);
			}
		})(this.dataControllers[k]);
		
		var curTr = _tr([_td([checkbox]), _td([_span([_t( this.dataControllers[k].provider.getDescription() )],[['css','marginLeft','3px']])])]);
		trs.push(curTr);
	}
	
	$("#checkContainer", this._parentDiv).append( _table([_tbody(trs)],[['css','marginLeft','4px']]) );
}

FireControl.prototype.findBbox = function()
{
	this.searchBboxController.findBbox();
}

FireControl.prototype._addTimeShift = function(date)
{
	if (!this._timeShift) return;
	
	date.setHours(this._timeShift.hours);
	date.setMinutes(this._timeShift.minutes);
	date.setSeconds(this._timeShift.seconds);
}

/** Возвращает bbox, по которому запрашиваются данные.
* @method 
*/
FireControl.prototype.getBbox = function()
{
	return this._initExtent.getIntersection(this.searchBboxController.getBbox());
}

//предполагаем, что dateBegin, dateEnd не нулевые
FireControl.prototype.loadForDates = function(dateBegin, dateEnd)
{
	
	// //в упрощённом режиме будем запрашивать за последние 24 часа, а не за календартный день
	if (this._visModeController.getMode() ===  this._visModeController.SIMPLE_MODE)
	{	
		// this._addTimeShift(dateBegin);
		// this._addTimeShift(dateEnd);
		
		dateBegin.setTime(dateBegin.getTime() - 24*60*60*1000);
	}
	// else
	// {
		// dateEnd.setTime(dateEnd.getTime() + 24*60*60*1000); //увеличиваем верхнюю границу на сутки
	// }
		
	var curExtent = this.getBbox();
	
	var isDatesChanged = !this.dateFiresBegin || !this.dateFiresEnd || dateBegin.getTime() != this.dateFiresBegin.getTime() || dateEnd.getTime() != this.dateFiresEnd.getTime();
	
	var isBBoxChanged = !curExtent.isEqual(this.requestBbox);
	//var isBBoxChanged = !curExtent.isInside(this.requestBbox) || !this.statusModel.getCommonStatus();
	
	this.dateFiresBegin = dateBegin;
	this.dateFiresEnd = dateEnd;
	
    var _this = this;
	
	if (isBBoxChanged || isDatesChanged) {
		this.requestBbox = curExtent;
	}
	
	for (var k in this.dataControllers)
	{
		var curController = this.dataControllers[k];
		if ( curController.visible && ( (isDatesChanged && curController.params.isUseDate) || (isBBoxChanged && curController.params.isUseBbox) || !curController.data ) )
		{
			//если у нас получилась пустая область запроса, просто говорим рендереру очистить все данные
			if ( curExtent.isEmpty() )
			{
				curController.renderer.bindData( null );
				curController.renderer.setVisible(curController.visible && this._currentVisibility);
			}
			else
			{
				this.processingModel.setStatus( curController.name, false);
				
				(function(curController){
					curController.curRequestIndex++;
					var requestIndex = curController.curRequestIndex;
					curController.provider.getData( dateBegin, dateEnd, curExtent.getBounds(), 
						function( data )
						{
							if (requestIndex != curController.curRequestIndex) return; //был отправлен ещё один запрос за то время, как пришёл этот ответ -> этот ответ пропускаем
							
							curController.data = data;
							_this.processingModel.setStatus( curController.name, true);
							_this.statusModel.setStatus( curController.name, true );
							
							curController.renderer.bindData( data, _this._calendar );
							curController.renderer.setVisible(curController.visible && _this._currentVisibility);
						}, 
						function( type )
						{
							_this.processingModel.setStatus( curController.name, true);
							_this.statusModel.setStatus( curController.name, false);
						}
					)
				})(curController);
			}
		}
	}
}

FireControl.prototype.add = function(parent, firesOptions, calendar)
{
    var resourceHost = typeof gmxCore !== 'undefined' ? gmxCore.getModulePath('FireMapplet') + '../' || '' : '';
	this._firesOptions = $.extend( {resourceHost: resourceHost, map: this._map}, FireControl.DEFAULT_OPTIONS, firesOptions );
    
	/*
	console.log('testing FireControl');
	var myLayer = gmxAPI.map.layers["FireHotSpots3"];
	myLayer.addListener('onTileLoadedURL', function(ph) {
		var layer = ph.obj;
		var tileID = ph.attr.data.tileID;
		var arr = ph.attr.data.data;
		var params = tileID.split('_');
		var bounds = gmxAPI.getTileBounds(params[0],params[1],params[2]);

		
	});*/
	
	
	this._initExtent = new BoundsExt( firesOptions.initExtent ? firesOptions.initExtent : BoundsExt.WHOLE_WORLD );
	if ( firesOptions.initExtent && firesOptions.showInitExtent )
	{
		var ie = firesOptions.initExtent;
		var objInitExtent = this._map.addObject( {type: "POLYGON", coordinates: [[[ie.minX, ie.minY], [ie.minX, ie.maxY], [ie.maxX, ie.maxY], [ie.maxX, ie.minY], [ie.minX, ie.minY]]]} );
		objInitExtent.setStyle( { outline: { color: 0xff0000, thickness: 1, opacity: 20 }, fill: { color: 0xffffff, opacity: 10 } } );
	}
	
	this._parentDiv = parent;
	
	$(this._parentDiv).prepend(_div(null, [['dir', 'id', 'checkContainer']]));	
	
	if ( this._firesOptions.firesOld ) 
		this.addDataProvider( "firedots_old",
							  new FireSpotProvider( {host: this._firesOptions.firesHost} ),
							  new FireSpotRenderer( {fireIconsHost: this._firesOptions.fireIconsHost} ),
							  { isVisible: this._firesOptions.firesOldInit } );
							  
	if ( this._firesOptions.burnt ) 
		this.addDataProvider( "burnts",
							new FireBurntProvider( {host: this._firesOptions.burntHost} ),
							new FireBurntRenderer(),
							{ isVisible: this._firesOptions.burntInit } );
						  
	if ( this._firesOptions.images ) 
		this.addDataProvider( "images",
							  new ModisImagesProvider( {host: this._firesOptions.modisHost, map: this._map} ),
							  new ModisImagesRenderer( {depth: this._firesOptions.modisDepth } ),
							  { isVisible: this._firesOptions.imagesInit, isUseBbox: false } );
							  
	if ( this._firesOptions.fires )
	{
		var spotProvider = new FireSpotClusterProvider({
            host:          this._firesOptions.host || 'http://sender.kosmosnimki.ru/v3/',
            description:   "firesWidget.FireCombinedDescription",
            requestType:   this._firesOptions.requestType,
            minPower:      this._firesOptions.minPower,
            minConfidence: this._firesOptions.minConfidence
        });
		var wholeClusterProvider = new FireClusterSimpleProvider({
            host: this._firesOptions.wholeClustersHost,
            requestType:  this._firesOptions.wholeClusterRequestType
        });
		
		this.addDataProvider( "firedots",
							  new CombinedProvider( "firesWidget.FireCombinedDescription", [spotProvider, wholeClusterProvider] ),
							  new CombinedFiresRenderer( this._firesOptions ), 
							  { isVisible: this._firesOptions.firesInit } );
    }
	
    this._calendar = calendar;
	this._visModeController = calendar.getModeController();
    
	this.searchBboxController.init();
	
	//var processImg = _img(null, [['attr','src', globalOptions.resourceHost + 'img/progress.gif'],['css','marginLeft','10px'], ['css', 'display', 'none']]);
	var processImg = _img(null, [['attr','src', this._firesOptions.resourceHost + 'img/loader.gif']]);
	var processDiv = _table([_tbody([_tr([_td([processImg], [['css', 'textAlign', 'center']])])])], [['css', 'zIndex', '1000'], ['css', 'width', '100%'], ['css', 'height', '100%'], ['css', 'position', 'absolute'], ['css', 'display', 'none'], ['css', 'top', '0px'], ['css', 'left', '0px']]);
	
	var flashDiv = document.getElementById(this._map.flashId);
	
	
	_(flashDiv.parentNode, [processDiv]);
	
	var trs = [];
	var _this = this;
	
	var restrictByVisibleExtent = function( keepSilence )
	{
		var deltaX = 400;
		var deltaY = 150;
		var flashDiv = document.getElementById(_this._map.flashId);
		var mapExtent = _this._map.getVisibleExtent();
		var x = merc_x(_this._map.getX());
		var y = merc_y(_this._map.getY());
		var scale = getScale(_this._map.getZ());
		var w2 = scale*(flashDiv.clientWidth-deltaX)/2;
		var h2 = scale*(flashDiv.clientHeight-deltaY)/2;
		var mapExtent = {
			minX: from_merc_x(x - w2),
			minY: from_merc_y(y - h2),
			maxX: from_merc_x(x + w2),
			maxY: from_merc_y(y + h2)
		};
				
		var geometry = {type: "POLYGON", coordinates: 
			[[[mapExtent.minX, mapExtent.minY],
			  [mapExtent.minX, mapExtent.maxY],
			  [mapExtent.maxX, mapExtent.maxY],
			  [mapExtent.maxX, mapExtent.minY],
			  [mapExtent.minX, mapExtent.minY]]]};
		
		var outlineColor = 0xff0000;
		var fillColor = 0xffffff;
		var regularDrawingStyle = {
			marker: { size: 3 },
			outline: { color: outlineColor, thickness: 3, opacity: 80 },
			fill: { color: fillColor }
		};
		var hoveredDrawingStyle = { 
			marker: { size: 4 },
			outline: { color: outlineColor, thickness: 4 },
			fill: { color: fillColor }
		};
		
		var curDrawing = _this.searchBboxController.getDrawing();
		
		_this.searchBboxController.bindNewDrawing(geometry, {}, {regular: regularDrawingStyle, hovered: hoveredDrawingStyle}, keepSilence);
		
		if (curDrawing)
			curDrawing.remove();
	}
    
	var button = $("<button>").attr('className', 'findFiresButton')[0];
	
	$(button).text(_gtxt('firesWidget.AdvancedSearchButton'));
	
	// $(this._calendar).change( function()
	// {
		// _this.update();
		// updateTimeInfo();
	// });
	
	
	// $(button)
		// .append($("<img>").attr({src: globalOptions.resourceHost + "img/select_tool_a.png"}))
		// .append($("<span>").text(_gtxt('firesWidget.AdvancedSearchButton')));
		
	// $(button).append($("<table>").
				// append($("<tbody>").
					// append($("<tr>").
						// append($("<td>").
							// append($("<img>").attr({src: globalOptions.resourceHost + "img/select_tool_a.png"}))).
						// append($("<td>").
							// append($("<span>").text(_gtxt('firesWidget.AdvancedSearchButton')))))));
	
	$(this.searchBboxController).change(function()
	{
		if (_this.searchBboxController.getBbox().isWholeWorld() && _this._visModeController.getMode() ===  _this._visModeController.ADVANCED_MODE)
			restrictByVisibleExtent(true);
			
		_this.update();
	})
	
	button.onclick = function()
	{
		if ( _this.searchBboxController.getBbox().isWholeWorld() )
		{
			//пользователь нажал на поиск, а рамки у нас нет -> добавим рамку по размеру окна.
			restrictByVisibleExtent(true);
		}
		_this.update();
	};
	
	var updateTimeInfo = function()
	{
		if ( _this._visModeController.getMode() ===  _this._visModeController.SIMPLE_MODE )
		{
			var now = new Date();
			_this._timeShift = {
				hours: now.getUTCHours(), 
				minutes: now.getUTCMinutes(), 
				seconds: now.getUTCSeconds()
			};
			
			if (_this._timeShift.hours == 23)
			{
				_this._calendar.setTimeBegin( _this._timeShift.hours, 23, 59 );
				_this._calendar.setTimeEnd( _this._timeShift.hours, 23, 59 );
			}
			else
			{
				_this._calendar.setTimeBegin( _this._timeShift.hours+1, 0, 0 );
				_this._calendar.setTimeEnd( _this._timeShift.hours+1, 0, 0 );
			}			
		}
		else
		{
			_this._timeShift = null;
			
			//если выбран сегодняшний день, показываем время не 23:59, а до текущего часа
			var maxDayString = $.datepicker.formatDate('yy.mm.dd', _this._calendar.getDateMax());
			var curDayString = $.datepicker.formatDate('yy.mm.dd', _this._calendar.getDateEnd());
			
			_this._calendar.setTimeBegin( 0, 0, 0 );
			var curHour = (new Date()).getUTCHours();
			
			if (maxDayString != curDayString || curHour === 23)
			{
				_this._calendar.setTimeEnd( 23, 59, 59 );
			}
			else
			{
				_this._calendar.setTimeEnd( curHour+1, 0, 0 );
			}
		}
	}
	
	updateTimeInfo();
    
	// $(this._visModeController).bind('change', function()
	$(this._calendar).bind('change', function()
	{
		if ( _this._visModeController.getMode() ===  _this._visModeController.SIMPLE_MODE )
		{
			$(button).css({display: 'none'});
			var curDrawing = _this.searchBboxController.getDrawing();
			
			if (curDrawing)
			{
				_this.searchBboxController.removeBbox( true );
				curDrawing.remove();
			}
		}
		else 
		{
			if ( _this.searchBboxController.getBbox().isWholeWorld() )
			{
				//пользователь нажал на поиск, а рамки у нас нет -> добавим рамку по размеру окна.
				restrictByVisibleExtent(true);
			}

			
			//$(button).css({display: ''});
		}
		updateTimeInfo();
		_this.update();
	});
	
	var internalTable = _table([_tbody([_tr([_td([button])/*, _td([processImg])*/])])], [['css', 'marginLeft', '15px']]);
	trs.push(_tr([_td([internalTable], [['attr','colSpan',2]])]));
	
	$(internalTable).css({display: 'none'});
	
	var statusDiv = _div([_t(_gtxt('firesWidget.tooManyDataWarning'))], [['css', 'backgroundColor', 'yellow'], ['css','padding','2px'], ['css', 'display', 'none']]);
	trs.push(_tr([_td([statusDiv], [['attr','colSpan',2]])]));
	
	$(this.statusModel).bind('change', function()
	{
		statusDiv.style.display = _this.statusModel.getCommonStatus() ? 'none' : 'block';
	})
	
	$(this.processingModel).bind('change', function()
	{
		processDiv.style.display = _this.processingModel.getCommonStatus() /*|| _this._visModeController.getMode() === _this._visModeController.SIMPLE_MODE*/ ? 'none' : '';
	})
	
	$(this._parentDiv).append(_table([_tbody(trs)],[['css','marginLeft','0px'], ['attr', 'id', 'fireMappletInfo']]));
	//$(this._parentDiv).append(_div(null, [['dir', 'id', 'datesInfo']]));
	
	this.update();
	
	this._initDeferred.resolve();
	
}

FireControl.prototype.update = function()
{
	if (this._calendar)
		this.loadForDates( this._calendar.getDateBegin(), this._calendar.getDateEnd() );
}

var FireControl2 = function(map, params)
{
    params = params || {};
    params.data = params.data || "+fires !images";
    
    var parseParams = function(params)
    {
        var arr = params.split(' ');
        var res = {}
        for (var p = 0; p < arr.length; p++)
        {
            var parsed = arr[p].match(/([!+-]?)(\w+)/);
            if (!parsed) return;
            
            res[parsed[2]] = {
                init: parsed[1] !== '!',
                show: parsed[1] !== '-'
            };
        }
        return res;
    }
    
    var parsedData = parseParams(params.data);
    
    this.getProviderParams = function(providerName)
    {
        return parsedData[providerName];
    }
    
    var baseFireControl = new FireControl(map);

    var doCreate = function()
    {
        if (typeof params.calendar === 'undefined')
        {
            //в ГеоМиксере берём общий календарь, иначе создаём новый
            if (window.nsGmx && nsGmx.widgets && nsGmx.widgets.commonCalendar)
            {
                params.calendar = nsGmx.widgets.commonCalendar.get();
                nsGmx.widgets.commonCalendar.show();
                nsGmx.widgets.commonCalendar.get().setShowTime(true);
            }
            else
            {
                var mCalendar = gmxCore.getModule('DateTimePeriodControl');
                params.calendar = new mCalendar.Calendar();
                params.calendar.init('FireCalendar', {
					minimized: true,
					dateMin: new Date(2009, 05, 29),
					dateMax: new Date(),
                    dateFormat: "dd.mm.yy",
                    showTime: true
				});
                $(params.container).append(params.calendar.canvas);
            }
        }
        
        var fireOptions = $.extend({}, params);
        
        if ('images' in parsedData)
        {
            fireOptions.images = parsedData.images.show;
            fireOptions.imagesInit = parsedData.images.init;
        }
        
        if ('fires' in parsedData)
        {
            fireOptions.fires = parsedData.fires.show;
            fireOptions.firesInit = parsedData.fires.init;
        }
        
        if ('burnt' in parsedData)
        {
            fireOptions.burnt = parsedData.burnt.show;
            fireOptions.burntInit = parsedData.burnt.init;
        }
        
        baseFireControl.add(params.container, fireOptions, params.calendar);
    }
    
    if (typeof params.container === 'string')
        params.container = $('#' + params.container)[0];
        
    if (!params.container)
    {
        //в Геомиксере будем добавлять непосредственно перед деревом слоёв
        if ('_queryMapLayers' in window)
        {
            $(_queryMapLayers).bind('load', function()
            {
                //если не указан календарик, то мы будем использовать общий. 
                //Однако в этом случае мы хотим, чтобы календарик был под списком провайдеров
                //Поэтому покажем календарик заранее
                if (typeof params.calendar === 'undefined')
                    nsGmx.widgets.commonCalendar.show();
                
                var table = $(_queryMapLayers.workCanvas).children("table")[0],
                    div = _div(null, [['css', 'margin', '5px']])
                $(table).after(div);
                
                params.container = div;
                
                doCreate();
            });
        }
        else
            return; //ошибка
    }
    else
    {
        doCreate();
    }
    
    return baseFireControl;
}

var publicInterface = {
    IDataProvider: IDataProvider,
    
    //провайдеры данных
    FireSpotProvider: FireSpotProvider,
    FireBurntProvider: FireBurntProvider,
    ModisImagesProvider: ModisImagesProvider,
    FireSpotClusterProvider: FireSpotClusterProvider,
    FireClusterSimpleProvider: FireClusterSimpleProvider,
    CombinedProvider: CombinedProvider,
    
    //рендереры
    FireSpotRenderer: FireSpotRenderer,
    FireBurntRenderer: FireBurntRenderer,
    ModisImagesRenderer: ModisImagesRenderer,
    CombinedFiresRenderer: CombinedFiresRenderer,
    
	FireControl: FireControl,
	FireControl2: FireControl2,
	FireControlCollection: FireControlCollection
}

if ( typeof gmxCore !== 'undefined' )
{
	gmxCore.addModule('FireMapplet', publicInterface, 
	{ 
        css: 'FireMapplet.css',
        init: function(module, path)
		{
            if (typeof gmxCore.loadScriptWithCheck === 'undefined')
            {
                alert('Плагин пожаров не совместим с данной версией ГеоМиксера! Необходима версия 1.9.1 или старше');
                return;
            }
            
            initTranslations();
            return gmxCore.loadScriptWithCheck([
                {
                    check: function(){ return jQuery.datepicker.parseDateTime; },
                    script: path + '../jquery/jquery-ui-timepicker-addon.js'
                },
                {
                    check: function(){ return window.SpatialQuery; },
                    script: path + 'spatial_query.js'
                }
            ]);
		},
        require: ['DateTimePeriodControl']
	});
}
else
    initTranslations();

})(jQuery);