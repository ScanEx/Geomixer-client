/** Пожарный плагин
 * @module FireMapplet
 */
(function($){

"use strict";

var initTranslations = function()
{
    _translationsHash.addtext("rus", { firesWidget: {
        "DailyCoverage.Description" : "Космоснимки (MODIS)",
        "TitleFiresScanEx" : "Пожары ScanEx",
        "TitleFiresFIRMS" : "Пожары FIRMS",
        "LayerClusterBalloon" :
            "<div style='margin-bottom: 5px;'><b style='color: red;'>Пожар</b></div>" +
            "<b>Кол-во термоточек:</b> [count]<br/>" +
            "<b>Время наблюдения:</b> [dateRange]<br/>" +
            "<div>[SUMMARY]</div>",
            // "<div style='margin-top: 5px;'><i>Приблизьте карту, чтобы увидеть контур</i></div>",
        "LayerClusterBalloonIndustrial" :
            "<span style='margin-bottom: 5px;'><b style='color: red;'>Пожар</b></span> (вероятный техногенный источник <a target='blank' href='http://fires.kosmosnimki.ru/help.html#techno'>?</a>) <br/>" +
            "<b>Кол-во термоточек:</b> [count]<br/>" +
            "<b>Время наблюдения:</b> [dateRange]<br/>" +
            "<div>[SUMMARY]</div>",
            // "<div style='margin-top: 5px;'><i>Приблизьте карту, чтобы увидеть контур</i></div>",
        "LayerGeometryBalloon" :
            "<div style='margin-bottom: 5px;'><b style='color: red;'>Контур пожара</b></div>" +
            "<b>Кол-во термоточек:</b> [count]<br/>" +
            "<b>Время наблюдения:</b> [dateRange]<br/>" +
            "<div>[SUMMARY]</div>",
        "zoomInMessage": "Приблизьте карту, чтобы увидеть контур"
    }});

    _translationsHash.addtext("eng", { firesWidget: {
        "DailyCoverage.Description" : "Satellite images (MODIS)",
        "TitleFiresScanEx" : "Fires from ScanEx",
        "TitleFiresFIRMS" : "Fires from FIRMS",
        "LayerClusterBalloon" :
            "<div style='margin-bottom: 5px;'><b style='color: red;'>Fire</b></div>" +
            "<b>Number of hotspots:</b> [count]<br/>" +
            "<b>Observation period:</b> [dateRange]<br/>" +
            "<div>[SUMMARY]</div>",
            // "<div style='margin-top: 5px;'><i>Zoom-in to see the outline</i></div>",
        "LayerClusterBalloonIndustrial" :
            "<span style='margin-bottom: 5px;'><b style='color: red;'>Fire</b></span> (probable industrial hotspot <a target='_blank' href='http://fires.kosmosnimki.ru/help.html#techno'>?</a>)<br/>" +
            "<b>Number of hotspots:</b> [count]<br/>" +
            "<b>Observation period:</b> [dateRange]<br/>" +
            "<div>[SUMMARY]</div>",
            // "<div style='margin-top: 5px;'><i>Zoom-in to see the outline</i></div>",
        "LayerGeometryBalloon" :
            "<div style='margin-bottom: 5px;'><b style='color: red;'>Fire outline</b></div>" +
            "<b>Number of hotspots:</b> [count]<br/>" +
            "<b>Observation period:</b> [dateRange]<br/>" +
            "<div>[SUMMARY]</div>",
        "zoomInMessage": "Zoom-in to see the outline"
    }});
}


// Lookup table for pixel dimensions based on scan index of the pixel

var ModisPixelDimensions = [];

function buildModisPixelDimensionsTable()
{
    // Don't rebuild the table if it was already built
    if(ModisPixelDimensions.length > 0){
        return;
    }

    var h = 705.0;        // Terra/Aqua orbit altitude [km]
    var p = 1.0;        // nadir pixel resolution [km]
    var EARTH_RADIUS = 6371.0;
    var SAMPLES = 1354;

    var r = EARTH_RADIUS + h;    /* [km] */
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

/**
 * @memberOf FireMapplet
 * @class
 * Аггрегирует статусы разных событий для нескольких источников (загружаются данные, слишком большая область и т.п.)
 */
var AggregateStatus = function()
{
    /** Изменение состояние аггрегатора, а не отдельных состояний источников
     * @name FireMapplet.AggregateStatus.change
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
    var dateString = datetime.getUTCDate() + "." + (datetime.getUTCMonth()+1) + "." + datetime.getUTCFullYear();
    var timeString = (typeof skipTime === 'undefined' || !skipTime) ? " " + datetime.getUTCHours() + ":" + datetime.getUTCMinutes() + ":" + datetime.getUTCSeconds() : "";
    return dateString + timeString;
}

/*
 ************************************
 *          Data Providers          *
 ************************************/

// IDataProvider interface
//   getDescription: function(){}, //возвращает строчку, которая показывается рядом с checkbox
//   getData: function( dateBegin, dateEnd, bbox, onSucceess, onError ){} //onSucceess(data) - полученные данные; onError(type) - ошибка определённого типа

/** Провайдер покрытия снимками modis
* @memberOf FireMapplet
* @class
* @param {Object} params Параметры класса: <br/>
* <i> {String} host </i> Сервер, с которого загружаются слои с модисом. Default: http://maps.kosmosnimki.ru/<br/>
*/
var ModisImagesProvider = function( params )
{
    var _params = $.extend({host: window.location.protocol + "//maps.kosmosnimki.ru/"}, params)
    var layersNamesToLoad = ['C2E8FE742B754B99A3F89A2D850BAF5B']; //слои, в которых хранятся снимки Terra и Aqua
    var initDone = false;

    this.getDescription = function() { return _gtxt("firesWidget.DailyCoverage.Description"); }
    this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
    {
        _lazyLoadFireLayers(_params).done(function(gmxMap) {
            if (!initDone && _params.zIndex) {
                for (var iL = 0; iL < layersNamesToLoad.length; iL++) {
                    gmxMap.layersByID[layersNamesToLoad[iL]].setZIndex(_params.zIndex);
                }
                initDone = true;
            }
            var modisLayers = [];
            for (var iL = 0; iL < layersNamesToLoad.length; iL++) {
                var layer = gmxMap.layersByID[layersNamesToLoad[iL]];
                layer.setDateInterval(new Date(dateEnd.valueOf() - 24*3600*1000), dateEnd);
                modisLayers.push(layer);
            }

            onSucceess({modisLayers: modisLayers});
        })
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
        var matrixMultiPolygon = [],
            unitedMultiPolygon = [],
            nStartPolygons = 0,
            currentPolygon;

        do {
            nStartPolygons = multiPolygon.length;
            unitedMultiPolygon = [];

            while(multiPolygon.length > 0){
                currentPolygon = multiPolygon.pop();
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
    },
    getPixelMultiPolygon: function(points) {
        var results = [];

        for(var i = 0;i < points.length;i++) {
            var pt = points[i];
            var dims = ModisPixelDimensions[pt[2]];

            var merc = L.Projection.Mercator.project({lat: pt[1], lng: pt[0]});
            var X1 = merc.x;
            var Y1 = merc.y;

            var X2 = X1 + 1000;
            var Y2 = Y1;

            var newLatLng = L.Projection.Mercator.unproject({x: X2, y: Y2});
            var newLat = pt[1];
            var newLon = newLatLng.lng;

            var mdelta = L.gmxUtil.distVincenty(pt[0],pt[1],newLon,newLat);

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
                [corner1x, corner1y],
                [corner2x, corner2y],
                [corner3x, corner3y],
                [corner4x, corner4y]
            ]));
        }

        return results;
    }
}


var dateToString = function(timestamp) {
    var date = new Date(timestamp*1000);

    var lz = function(n) {return n > 9 ? n : '0' + n;};

    return lz(date.getUTCDate()) + '.' + lz(date.getUTCMonth()+1) + '.' + date.getUTCFullYear();
}
//По начальной и конечной дате формирует строчку для отображения интервала дат
var _datePeriodHelper = function(dateMin, dateMax)
{
    if (dateMin === dateMax)
        return dateMin;
    else
        return dateMin + ' - ' + dateMax;
}

/*
 ************************************
 *            Renderers             *
 ************************************/

var _lazyLoadFireLayers = (function()
{
    var loadDeferred = null;

    return function(params)
    {
        //TODO: remove default values
        var _params = $.extend(true, {
            hotspotLayerName: 'A78AC25E0D924258B5AF40048C21F7E7',
            mapName: '3PORS',
            host: 'maps.kosmosnimki.ru'
        }, params);

        if (!loadDeferred)
        {
            if (_params.host.indexOf('http://') === 0)
                _params.host = _params.host.substring(7, _params.host.length - 1);

            loadDeferred = $.Deferred();

            L.gmx.loadMap(_params.mapName, {hostName: _params.host}).then(function(gmxMap)
            {
                var layer = gmxMap.layersByID[_params.hotspotLayerName];

                if (typeof _params.minZoom !== 'undefined')
                {
                    layer.setZoomBounds(_params.minZoom, 17);
                }

                if (nsGmx && nsGmx.widgets && nsGmx.widgets.commonCalendar) {
                    nsGmx.widgets.commonCalendar.unbindLayer(_params.hotspotLayerName);
                }

                loadDeferred.resolve(gmxMap);
            });
        }

        return loadDeferred.promise();
    }
})();

var FireBurntProvider3 = function( params )
{
    this.getDescription = function() {
        return params.title;
    };

    this.getData = function( dateBegin, dateEnd, bbox, onSucceess, onError )
    {
        onSucceess({dateBegin: dateBegin, dateEnd: dateEnd});
    }
}

//рисует кластеры на основе данных о хотспотах векторного слоя
var FireBurntRenderer3 = function(params)
{
    var _params = $.extend(true, {
        minGeomZoom: 8,
        minHotspotZoom: 11,
        hotspotLayerName: 'C13B4D9706F7491EBC6DC70DFFA988C0',
        dailyLayerName: '3E88643A8AC94AFAB4FD44941220B1CE',
        hotspotTimeAttr: 'Timestamp',
        hotspotIDAttr: 'SpotID',
        clusterTimeAttr: 'ClusterDate',
        mapName: 'NDFYK'
    }, params);

    buildModisPixelDimensionsTable();

    var map = params.map,
        rawHotspotsLayer,
        rawClustersLayer,
        clustersGeomLayer,
        clustersLayer,
        observerHotspots,
        observerClusters,
        dateBegin,
        dateEnd;

    var isVisible = false;

    clustersLayer = L.gmx.createLayer({
        properties: {
            title: 'FireClusters',
            name: 'fireClustersLayer' + _params.hotspotLayerName,
            attributes: ['scale', 'count', 'label', 'startDate', 'endDate', 'dateRange', 'isIndustrial'],
            styles: [{
                Filter: '"isIndustrial"=0',
                Balloon: _gtxt('firesWidget.LayerClusterBalloon'),
                MinZoom:1,
                MaxZoom:_params.minGeomZoom - 1,
                RenderStyle: {
                    fill: {
                        radialGradient: {
                            r1: 0,
                            r2: '[scale]*20',
                            addColorStop: [
                                [0, 0xffff00, 50],
                                [1, 0xff0000, 50]
                            ]
                        }
                    },
                    label: {
                        size: 12,
                        color: 0xffffff,
                        haloColor: 0x000000,
                        field: 'label',
                        align: 'center'
                    }
                }
            },
            {
                Filter: '"isIndustrial"=1',
                Balloon: _gtxt('firesWidget.LayerClusterBalloonIndustrial'),
                MinZoom:1,
                MaxZoom:_params.minGeomZoom - 1,
                RenderStyle: {
                    fill: {
                        radialGradient: {
                            r1: 0,
                            r2: '[scale]*20',
                            addColorStop: [
                                [0, 0xffffff, 80],
                                [1, 0xffaa00, 80]
                            ]
                        }
                    }
                }
            }]
        }
    }).addTo(map);

    clustersLayer.on('popupopen', function(event) {
        var popup = event.popup,
            html = popup.getContent(),
            zoomLink = $('<div style="margin-top: 5px;"><a href="javascript:void(0)"><i>' + _gtxt('firesWidget.zoomInMessage') + '</i></a></div>').click(function() {
                map.closePopup(event.popup);
                map.setView(event.gmx.latlng, _params.minGeomZoom + 3);
            });

        var div = $('<div/>').html(html).append(zoomLink);
        event.popup.setContent(div[0]);
    })

    if (_params.zIndex) {
        clustersLayer.setZIndex(_params.zIndex);
    }

    clustersGeomLayer = L.gmx.createLayer({
        properties: {
            type: 'Vector',
            title: 'FirePolygons',
            name: 'fireClustersGeomLayer' + _params.dailyLayerName,
            attributes: ['scale', 'count', 'label', 'startDate', 'endDate', 'dateRange', 'isIndustrial'],
            styles: [{
                Balloon: _gtxt('firesWidget.LayerGeometryBalloon'),
                MinZoom: _params.minGeomZoom,
                MaxZoom: 21,
                RenderStyle: {
                    outline: { color: 0xff0000, thickness: 2 },
                    fill:    { color: 0xff0000, opacity: 15 }
                },
                HoverStyle: {
                    outline: { color: 0xff0000, thickness: 3 },
                    fill:    { color: 0xff0000, opacity: 45 }
                }
            }]
        }
    }).addTo(map);

    if (_params.zIndex) {
        clustersGeomLayer.setZIndex(_params.zIndex);
    }

    var updateLayersVisibility = function() {
        var zoom = map.getZoom();

        observerHotspots && observerHotspots.toggleActive(zoom >= _params.minGeomZoom && isVisible);
        observerClusters && observerClusters.toggleActive(zoom < _params.minGeomZoom && isVisible);

        if (rawHotspotsLayer) {
            if (zoom < _params.minHotspotZoom || !isVisible) {
                if (rawHotspotsLayer._map) map.removeLayer(rawHotspotsLayer);
            } else {
                if (!rawHotspotsLayer._map) map.addLayer(rawHotspotsLayer);
            }
        }
    };

    _lazyLoadFireLayers({mapName: _params.mapName}).done(function(gmxMap)
    {
        rawHotspotsLayer = window.rawHotspotsLayer = gmxMap.layersByID[_params.hotspotLayerName];
        rawClustersLayer = window.rawClustersLayer = gmxMap.layersByID[_params.dailyLayerName];

        if (window.language === 'eng') {
            var engString = "<p>" +
                "<strong>Date:</strong> [DateTime]<br /> " +
                "<strong>Satellite:</strong> [Platform]<br /> " +
                "[SUMMARY]" +
                "</p>",
                styles = rawHotspotsLayer.getStyles(),
                newStyles = [];

            for (var i = 0; i < styles.length; i++) {
                styles[i].Balloon = engString;
            }

            rawHotspotsLayer.setStyles(styles);
        }

        if (nsGmx.widgets && nsGmx.widgets.getCommonCalendar) {
            nsGmx.widgets.commonCalendar.unbindLayer(_params.hotspotLayerName);
            nsGmx.widgets.commonCalendar.unbindLayer(_params.rawClustersLayer);
        }

        if (_params.zIndex) {
            rawHotspotsLayer.setZIndex(_params.zIndex);
        }

        var parseServerDateTime = function(dateStr) {
            var p = dateStr.match(/^(\d\d\d\d).(\d\d).(\d\d)(.(\d\d).(\d\d).(\d\d))?$/); //YYYY.MM.DD HH.MM.SS или без вреемни: YYYY.MM.DD
            if (!p) return null;
            var localDate = new Date(
                parseInt(p[1]), parseInt(p[2]-1), parseInt(p[3]),  //дата
                parseInt(p[5] || 0), parseInt(p[6] || 0), parseInt(p[7] || 0) //время
            );

            var timeOffset = localDate.getTimezoneOffset()*60*1000;
            return localDate - timeOffset;
        }

        var updateClustersByObject = function(layer, estimeteGeometry, clusterAttr, hotspotAttr, countAttr, dateAttr, fromLayer) {
            var clusters = {};
            return function( data ) {
                var objects = [];
                var clustersToRepaint = {};
                var indexes = fromLayer._gmx.tileAttributeIndexes;
                var parseItem = function(item) {
                    var props = item.properties;
                    return {
                        properties: L.gmxUtil.getPropertiesHash(props, indexes),
                        geometry: props[props.length - 1]
                    };
                };
                (data.removed || []).map(function(it) {
                    objects.push({ onExtent: false, item: parseItem(it) });
                });
                (data.added || []).map(function(it) {
                    objects.push({ onExtent: true, item: parseItem(it) });
                });
                for (var k = 0; k < objects.length; k++)
                {
                    var props = objects[k].item.properties;
                    var mult = objects[k].onExtent ? 1 : -1;
                    var count = (countAttr ? props[countAttr] : 1) * mult;

                    if (!props[clusterAttr])
                        continue;

                    var clusterId = '_' + props[clusterAttr];
                    var hotspotId = '_' + props[hotspotAttr];

                    if (!clusters[clusterId]) {
                        clusters[clusterId] = {
                            spots: {},
                            lat: 0,
                            lng: 0,
                            count: 0,
                            startDate: Number.POSITIVE_INFINITY,
                            endDate: Number.NEGATIVE_INFINITY,
                            isIndustrial: false
                        };
                    }
                    var cluster = clusters[clusterId];

                    //два раза одну и ту же точку не добавляем
                    if (hotspotId in cluster.spots && objects[k].onExtent)
                        continue;

                    var coords = objects[k].item.geometry.coordinates,
                        latlng = L.Projection.Mercator.unproject({y: coords[1], x: coords[0]});

                    if (objects[k].onExtent)
                        cluster.spots[hotspotId] = [latlng.lng, latlng.lat, 250]; //TODO: выбрать правильный номер sample
                    else
                        delete cluster.spots[hotspotId];

                    //var hotspotDate = parseServerDateTime(props[dateAttr]);
                    var hotspotDate = props[dateAttr];

                    cluster.lat += count * coords[1];
                    cluster.lng += count * coords[0];
                    cluster.count += count;
                    cluster.startDate = Math.min(cluster.startDate, hotspotDate);
                    cluster.endDate   = Math.max(cluster.endDate,   hotspotDate);
                    cluster.isIndustrial = cluster.isIndustrial || (Number(props.FireType) & 1);

                    clustersToRepaint[clusterId] = true;
                }

                var clustersToAdd = [],
                    itemIDsToRemove = [];

                for (var k in clustersToRepaint)
                {
                    var cluster = clusters[k],
                        count = cluster.count;
                    if (count)
                    {
                        var strStartDate = dateToString(cluster.startDate);
                        var strEndDate = dateToString(cluster.endDate);

                        var newItem = [
                            k,
                            String(Math.pow(Math.log(count+1), 1.3)/3.5),
                            count,
                            count >= 10 ? count : null,
                            cluster.startDate,
                            cluster.endDate,
                            cluster.startDate === cluster.endDate ? strEndDate : strStartDate + '-' + strEndDate,
                            Number(cluster.isIndustrial)
                        ];

                        if (estimeteGeometry) {
                            var points = [];
                            for (var p in clusters[k].spots)
                                points.push(clusters[k].spots[p]);

                            var multiPolygon = _hq.getPixelMultiPolygon(points);
                            var tmpPolygon = _hq.MultiPolygonUnion(multiPolygon);

                            newItem.push({
                                type: 'MULTIPOLYGON',
                                coordinates: tmpPolygon
                            });
                        } else {
                            newItem.push({
                                type: 'POINT',
                                coordinates: [clusters[k].lng / count, clusters[k].lat / count]
                            });
                        }

                        clustersToAdd.push(newItem);
                    } else {
                        itemIDsToRemove.push(k);
                        delete clusters[k];

                    }
                }

                layer.addData(clustersToAdd);
                layer.removeData(itemIDsToRemove);
            }
        }

        observerClusters = rawClustersLayer.addObserver({
            type: 'update',
            callback: updateClustersByObject(clustersLayer, false, 'ParentClusterId', 'ClusterId', 'HotSpotCount', _params.clusterTimeAttr, rawClustersLayer)
        });

        observerHotspots = rawHotspotsLayer.addObserver({
            type: 'update',
            callback: updateClustersByObject(clustersGeomLayer, true, 'ClusterID', _params.hotspotIDAttr, null, _params.hotspotTimeAttr, rawHotspotsLayer)
        });

        map.on('zoomend', updateLayersVisibility);
        updateLayersVisibility();

        var mercBbox = function(latlngBbox) {
            var mercMin = L.Projection.Mercator.project({lat: latlngBbox.min.y, lng: latlngBbox.min.x});
            var mercMax = L.Projection.Mercator.project({lat: latlngBbox.max.y, lng: latlngBbox.max.x});
            return L.gmxUtil.bounds([[mercMin.x, mercMin.y], [mercMax.x, mercMax.y]]);
        }

        var fromMercBbox = function(bbox) {
            var min = L.Projection.Mercator.unproject(bbox.min);
            var max = L.Projection.Mercator.unproject(bbox.max);
            return L.gmxUtil.bounds([[min.lng, min.lat], [max.lng, max.lat]]);
        }

        //если старый
        var getExtendedBbox = function(mercOld, newBbox) {
            var extendBbox = function(bbox) {
                var sx = (bbox.max.x - bbox.min.x)*0.15,
                    sy = (bbox.max.y - bbox.min.y)*0.15;

                return L.gmxUtil.bounds([[bbox.min.x - sx, bbox.min.y - sy], [bbox.max.x + sx, bbox.max.y + sy]]);
            }

            var mercNew = mercBbox(newBbox);

            if (!mercOld) {
                return fromMercBbox(extendBbox(mercNew));
            }

            var oldSquare = (mercOld.max.x - mercOld.min.x) * (mercOld.max.y - mercOld.min.y),
                newSquare = (mercNew.max.x - mercNew.min.x) * (mercNew.max.y - mercNew.min.y);

            if (!mercOld.contains([mercNew.min.x, mercNew.min.y]) || !mercOld.contains([mercNew.max.x, mercNew.max.y]) || 2 * newSquare < oldSquare) {
                return fromMercBbox(extendBbox(mercNew));
            } else {
                return null;
            }
        }

        var updateBbox = function() {
            var observersBbox = observerHotspots.bbox,
                screenBounds = map.getBounds(),
                p1 = screenBounds.getNorthWest(),
                p2 = screenBounds.getSouthEast(),
                newBbox = L.gmxUtil.bounds([[p1.lng, p1.lat], [p2.lng, p2.lat]]),
                extendedBbox = getExtendedBbox(observersBbox, newBbox);

            if (extendedBbox) {
                observerHotspots.setBounds(extendedBbox);
                observerClusters.setBounds(extendedBbox);
            }
        };

        map.on('moveend', updateBbox);
        updateBbox();

        updateLayersDateInterval();
    });

    var updateLayersDateInterval = function() {
        if (!dateBegin || !dateEnd) {
            return;
        }

        rawClustersLayer && rawClustersLayer.setDateInterval(dateBegin, dateEnd);
        rawHotspotsLayer && rawHotspotsLayer.setDateInterval(dateBegin, dateEnd);

        observerClusters && observerClusters.setDateInterval(dateBegin, dateEnd);
        observerHotspots && observerHotspots.setDateInterval(dateBegin, dateEnd);
    }

    this.bindData = function(data)
    {
        dateBegin = data.dateBegin;
        dateEnd = data.dateEnd;
        updateLayersDateInterval();
    }

    this.setVisible = function(visibilityFlag)
    {
        isVisible = visibilityFlag;
        [clustersGeomLayer, clustersLayer].forEach(function(layer) {
            map[visibilityFlag ? 'addLayer' : 'removeLayer'](layer);
        })
        updateLayersVisibility();
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
        if (modisLayers) {
            for (var iL in modisLayers) {
                params.map[flag ? 'addLayer' : 'removeLayer'](modisLayers[iL]);
            }
        }
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

    this.dataControllers = {};

    this.statusModel = new AggregateStatus();
    this.processingModel = new AggregateStatus();

    this._currentVisibility = true;

    this._map = map;

    this._initDeferred = new $.Deferred();

    FireControlCollection.instances.push(this);
    $(FireControlCollection).triggerHandler('newInstance');
}

var FireControlCollection = {instances: []};

//настройки виджета пожаров по умолчанию
FireControl.DEFAULT_OPTIONS =
{
    firesHost:       window.location.protocol + '//sender.kosmosnimki.ru/v3/',
    modisHost:      window.location.protocol + '//maps.kosmosnimki.ru/',
    burntHost:      window.location.protocol +  '//sender.kosmosnimki.ru/',
    fireIconsHost:   window.location.protocol + '//maps.kosmosnimki.ru/images/',

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
    for (var k in this.dataControllers)
        dc.push({name: this.dataControllers[k].name, visible: this.dataControllers[k].visible});

    var resData = {
        version: '1.1.0',
        dataContrololersState: dc
    }

    return resData;
}

FireControl.prototype.loadState = function( data )
{
    var dc = data.dataContrololersState;
    for (var k = 0; k < dc.length; k++) {
        if (dc[k].name in this.dataControllers)
        {
            var curController = this.dataControllers[dc[k].name];

            curController.visible = dc[k].visible;
            $("#" + dc[k].name, this._parentDiv).attr({checked: dc[k].visible});
            curController.renderer.setVisible(curController.visible && this._currentVisibility);
        }
    }

    // if (data.timeShift)
    // {
        // this._timeShift = $.extend({}, data.timeShift);
        // this._updateCalendarTime(this._timeShift);
    // }
}

//вызывает callback когда календарик проинициализирован
FireControl.prototype.whenInited = function(callback)
{
    if (this._initDeferred)
        this._initDeferred.then(callback);
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
    this.update();
}

FireControl.prototype.getRenderer = function( name )
{
    return (name in this.dataControllers) ? this.dataControllers[name].renderer : null;
}

//callback(name, provider, renderer, isVisible)
FireControl.prototype.forEachController = function( callback )
{
    for (var k in this.dataControllers) {
        var ctrl = this.dataControllers[k];
        callback(k, ctrl.provider, ctrl.renderer, ctrl.visible);
    }
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
    var uiTemplate = '<table class = "fireMappletContainer">' +
            '{{#providers}}' +
                '<tr>' +
                    '<td><input id = "{{name}}" type = "checkbox"{{#visible}} checked{{/visible}}></td>' +
                    '<td><label class = "fireMappletLabel" for = "{{name}}">{{description}}</label></td>' +
                '</tr>' +
            '{{/providers}}' +
        '</table>';

    var providers = [],
        _this = this;

    for (var name in this.dataControllers) {
        var dc = this.dataControllers[name];
        providers.push({
            name: dc.name,
            visible: dc.visible,
            description: dc.provider.getDescription()
        })
    }

    var ui = $(Handlebars.compile(uiTemplate)({providers: providers}));

    ui.find('input').click(function() {
        _this.setDataVisibility(this.id, this.checked);
    })

    $("#checkContainer", this._parentDiv).empty().append(ui);
}

FireControl.prototype.setDataVisibility = function(dataName, isVisible) {
    for (var k in this.dataControllers) {
        var dataController = this.dataControllers[k];
        if (dataController.name === dataName) {
            dataController.visible = isVisible;
            this.update();
            dataController.renderer.setVisible(isVisible && this._currentVisibility);
            return;
        }
    }
}

//предполагаем, что dateBegin, dateEnd не нулевые
FireControl.prototype.loadForDates = function(dateBegin, dateEnd)
{
    this.dateFiresBegin = dateBegin;
    this.dateFiresEnd = dateEnd;

    var _this = this;

    for (var k in this.dataControllers)
    {
        var curController = this.dataControllers[k];
        var isDatesChanged = !curController.dateFiresBegin || !curController.dateFiresEnd || dateBegin.getTime() != curController.dateFiresBegin.getTime() || dateEnd.getTime() != curController.dateFiresEnd.getTime();

        if ( curController.visible && ( (isDatesChanged && curController.params.isUseDate) || !curController.data ) )
        {
            curController.dateFiresBegin = dateBegin;
            curController.dateFiresEnd = dateEnd;

            this.processingModel.setStatus( curController.name, false);

            (function(curController){
                curController.curRequestIndex++;
                var requestIndex = curController.curRequestIndex;
                curController.provider.getData( dateBegin, dateEnd, null,
                    function( data )
                    {
                        if (requestIndex != curController.curRequestIndex) return; //был отправлен ещё один запрос за то время, как пришёл этот ответ -> этот ответ пропускаем

                        curController.data = data;
                        _this.processingModel.setStatus( curController.name, true);
                        _this.statusModel.setStatus( curController.name, true );

                        curController.renderer.bindData( data, _this._dateInterval);
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

    $(this).trigger('datechange');
}

FireControl.prototype.add = function(parent, firesOptions, dateInterval)
{
    var resourceHost = typeof gmxCore !== 'undefined' ? gmxCore.getModulePath('FireMapplet') + '../' : '';
    this._firesOptions = $.extend(
        {resourceHost: resourceHost, map: this._map},
        FireControl.DEFAULT_OPTIONS,
        firesOptions
    );

    if ( firesOptions.initExtent && firesOptions.showInitExtent )
    {
        var ie = firesOptions.initExtent;
        var objInitExtent = this._map.addObject( {type: "POLYGON", coordinates: [[[ie.minX, ie.minY], [ie.minX, ie.maxY], [ie.maxX, ie.maxY], [ie.maxX, ie.minY], [ie.minX, ie.minY]]]} );
        objInitExtent.setStyle( { outline: { color: 0xff0000, thickness: 1, opacity: 20 }, fill: { color: 0xffffff, opacity: 10 } } );
    }

    this._parentDiv = parent;

    $(this._parentDiv).prepend($('<div id="checkContainer"></div>'));

    var zIndex = this._firesOptions.zIndex;
    if ( this._firesOptions.images ) {
        this.addDataProvider(
            "images",
            new ModisImagesProvider( {host: this._firesOptions.modisHost, map: this._map} ),
            new ModisImagesRenderer({
                map: this._map,
                zIndex: zIndex || 10000
            }),
            {isVisible: this._firesOptions.imagesInit, isUseBbox: false } );
    }

    if (this._firesOptions.fires) {
        this.addDataProvider(
            "firedots_layer_global", //название должно быть firedots_layer_scanex - оставлено из-за обратной совместимости
            new FireBurntProvider3( {host: this._firesOptions.firesHost, title: this._firesOptions.scanexName || _gtxt("firesWidget.TitleFiresScanEx")} ),
            new FireBurntRenderer3( {
                map: this._map,
                hotspotLayerName: 'F2840D287CD943C4B1122882C5B92565',
                dailyLayerName: 'E58063D97D534BB4BBDFF07FE5CB17F2',
                clusterTimeAttr: 'DateTime',
                hotspotTimeAttr: 'DateTime',
                hotspotIDAttr: 'HotSpotID',
                minHotspotZoom: firesOptions.minHotspotZoom,
                minGeomZoom: firesOptions.minGeomZoom,
                zIndex: zIndex ? zIndex + 1 : 2010000
            }),
            { isVisible: !!this._firesOptions.firesInit }
        );
    }

    if (this._firesOptions.firesGlobal) {
        this.addDataProvider(
            "firedots_layer_scanex", //название должно быть firedots_layer_global - оставлено из-за обратной совместимости
            new FireBurntProvider3( {host: this._firesOptions.firesHost, title: this._firesOptions.FIRMSName || _gtxt("firesWidget.TitleFiresFIRMS")} ),
            new FireBurntRenderer3( {
                map: this._map,
                hotspotLayerName: 'C13B4D9706F7491EBC6DC70DFFA988C0',
                dailyLayerName: '3E88643A8AC94AFAB4FD44941220B1CE',
                clusterTimeAttr: 'ClusterDate',
                hotspotTimeAttr: 'Timestamp',
                hotspotIDAttr: 'SpotID',
                minHotspotZoom: firesOptions.minHotspotZoom,
                minGeomZoom: firesOptions.minGeomZoom,
                zIndex: zIndex ? zIndex + 2 : 2010000
            }),
            { isVisible: !!this._firesOptions.firesGlobalInit }
        );
    }

    this._dateInterval = dateInterval;

    dateInterval.on('change', this.update, this);

    this.update();

    this._initDeferred.resolve();
}

FireControl.prototype.update = function() {
    if (this._dateInterval)
        this.loadForDates(this._dateInterval.get('dateBegin'), this._dateInterval.get('dateEnd'));
}

/** Класс для удобного доступа к данным пожарного мапплета
    @class
    @alias FireMapplet:FireControl2
    @param {gmxAPI.Map} map Карта ГеоМиксера
    @param {Object} params Параметры виджета
    @param {String} [params.data='+fires !images'] Описание данных виджета и их начальной видимости
    @param {nsGmx.CalendarWidget} [params.calendar] Календарь для управления периодом показа пожаров
    @param {DOMNode} [params.container] Контейнер для размещения виджета
*/
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

    var dataNamesDict = {
        images: 'images',
        fires: 'firedots_layer_global',
        firesGlobal: 'firedots_layer_scanex'
    }

    /** Установить видимость определённого типа данных
      @param {String} dataName Имя типа данных. Поддерживается `images`, `fires` и `firesGlobal`
      @param {Boolean} isVisible Видимость типа данных
     */
    this.setDataVisibility = function(dataName, isVisible) {
        dataNamesDict[dataName] && baseFireControl.setDataVisibility(dataNamesDict[dataName], isVisible);
    }

    var baseFireControl = new FireControl(map);

    $(baseFireControl).on('datechange', function() {
        $(this).trigger('datechange');
    }.bind(this))

    var doCreate = function()
    {
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

        if ('firesGlobal' in parsedData)
        {
            fireOptions.firesGlobal = parsedData.firesGlobal.show;
            fireOptions.firesGlobalInit = parsedData.firesGlobal.init;
        }

        if ('burnt' in parsedData)
        {
            fireOptions.burnt = parsedData.burnt.show;
            fireOptions.burntInit = parsedData.burnt.init;
        }

        baseFireControl.add(params.container, fireOptions, params.dateInterval);
    }

    if (typeof params.container === 'string')
        params.container = $('#' + params.container)[0];

    doCreate();

    this.getCalendar = function() {
        return params.calendar;
    }

    //проксируем несколько команд из FireControl

    /** Селиализовать текущее состояние виджета пожаров
     * @return {Object} Простой объект, описывающий состояние виджета
     * @method
    */
    this.saveState = baseFireControl.saveState.bind(baseFireControl);

    /** Применить ранее сериализованное состояние. После применения нужно явно вызвать ф-цию update()
     * @param {Object} data Сериализованное состояние
     * @method
    */
    this.loadState = baseFireControl.loadState.bind(baseFireControl);

    /** Перерисовать данные на карте
     * @method
    */
    this.update = baseFireControl.update.bind(baseFireControl);

    this.getDateBegin = function() {
        return baseFireControl.dateFiresBegin;
    }

    this.getDateEnd = function() {
        return baseFireControl.dateFiresEnd;
    }
}

var initGeoMixerFireControl = _.once(function(params, map) {
    var data = params && params.data;
    if (data && $.isArray(data)) {
        params.data = data[0];
    }

    _queryMapLayers.loadDeferred.done(function() {

        var beforeContainer = _queryMapLayers.getContainerBefore();

        var fireMappletContainer = $(beforeContainer).find('.fireMappletContainer');
        if ($(fireMappletContainer)[0]) return;

        var dateInterval = params.dateInterval = nsGmx.widgets.commonCalendar.getDateInterval();

        var defaultDateInterval = new nsGmx.DateInterval();
        if (defaultDateInterval.get('dateBegin').valueOf() === dateInterval.get('dateBegin').valueOf() &&
            defaultDateInterval.get('dateEnd').valueOf() === dateInterval.get('dateEnd').valueOf())
        {
            //если сейчас на календарике установлен дефолтный интервал, мы его заменяем на дефолтный интервал пожарного календарика
            dateInterval.set(nsGmx.FireCalendarWidget.defaultFireDateInterval());
        }

        //если не указан календарик, то мы будем использовать общий.
        //Однако в этом случае мы хотим, чтобы календарик был под списком провайдеров
        //Поэтому покажем календарик заранее
        if (!nsGmx.widgets.commonCalendar.model.get('isAppended')) { nsGmx.widgets.commonCalendar.show(); }

        var fireCalendar = new nsGmx.FireCalendarWidget({dateInterval: params.dateInterval});
        // nsGmx.widgets.commonCalendar.replaceCalendarWidget(fireCalendar);

        var div = $('<div/>').css('margin', '5px');
        _queryMapLayers.getContainerBefore().prepend(div);

        params.container = div;

        var fireControl = window.fireControl = new FireControl2(map, params);

        //сериализация состояния
        if (!_mapHelper.customParamsManager.isProvider('firesWidget2')) {
            _mapHelper.customParamsManager.addProvider({
                name: 'firesWidget2',
                loadState: function(state) { fireControl.loadState(state); fireControl.update(); },
                saveState: function() { return fireControl.saveState(); }
            });
        }
    })
});

var unload = function () {
    return false;
    // var beforeContainer = _queryMapLayers.getContainerBefore();
    // var fireMappletContainer = $(beforeContainer).find('.fireMappletContainer')[0].parentNode.parentNode;

    // $(beforeContainer).find($(fireMappletContainer)).remove();
};

var publicInterface = {
    pluginName: 'Fire plugin',
    beforeViewer: initGeoMixerFireControl,
    afterViewer: initGeoMixerFireControl,

    //провайдеры данных
    ModisImagesProvider: ModisImagesProvider,

    //рендереры
    ModisImagesRenderer: ModisImagesRenderer,

    FireControl: FireControl,
    FireControl2: FireControl2,
    FireControlCollection: FireControlCollection,
    unload: unload
}

if (window.gmxCore) {
    gmxCore.addModule('FirePlugin', publicInterface, {
        css: 'FirePlugin.css',
        init: function(module, path) {
            initTranslations();
            return gmxCore.loadScriptWithCheck([{
                    check: function(){ return window.SpatialQuery; },
                    script: path + 'spatial_query.js'
                }/*, {
                    check: function(){ return nsGmx.FireCalendarWidget; },
                    script: path + 'FireCalendarWidget.js'
                }*/]
            );
        }
    });
} else {
    initTranslations();
}

})(jQuery);
