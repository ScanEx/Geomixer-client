//************************************
// AIS LAYERS SEARCHER
//************************************

module.exports = function({baseUrl,  aisServiceUrl, aisLastPoint, screenSearchLayer, aisLayerID}){
	return {
        _serverScript: baseUrl + 'VectorLayer/Search.ashx',
		
		set aisLastPoint(value){
			aisLastPoint = value
		},
		set aisLayerID(value){
			aisLayerID = value
		},
		set screenSearchLayer(value){
			screenSearchLayer = value
		},
		get aisLayerID(){
			return aisLayerID
		},			
		
        getBorder :function () {
            var lmap = nsGmx.leafletMap;
            var dFeatures = lmap.gmxDrawing.getFeatures();
            if (dFeatures.length) { return dFeatures[dFeatures.length - 1].toGeoJSON(); }
            var latLngBounds = lmap.getBounds(),
                sw = latLngBounds.getSouthWest(),
                ne = latLngBounds.getNorthEast(),
                min = { x: sw.lng, y: sw.lat },
                max = { x: ne.lng, y: ne.lat },
                minX = min.x,
                maxX = max.x,
                geo = { type: 'Polygon', coordinates: [[[minX, min.y], [minX, max.y], [maxX, max.y], [maxX, min.y], [minX, min.y]]] },
                w = (maxX - minX) / 2;

            if (w >= 180) {
                    geo = { type: 'Polygon', coordinates: [[[-180, min.y], [-180, max.y], [180, max.y], [180, min.y], [-180, min.y]]] };
            } 
            else if (maxX > 180 || minX < -180) {
                var center = ((maxX + minX) / 2) % 360;
                if (center > 180) { center -= 360; }
                else if (center < -180) { center += 360; }
                minX = center - w; maxX = center + w;
                if (minX < -180) {
                    geo = { type: 'MultiPolygon', coordinates: [
                                    [[[-180, min.y], [-180, max.y], [maxX, max.y], [maxX, min.y], [-180, min.y]]],
                                    [[[minX + 360, min.y], [minX + 360, max.y], [180, max.y], [180, min.y], [minX + 360, min.y]]]
                                ]
                    };
                } else if (maxX > 180) {
                    geo = { type: 'MultiPolygon', coordinates: [
                                    [[[minX, min.y], [minX, max.y], [180, max.y], [180, min.y], [minX, min.y]]],
                                    [[[-180, min.y], [-180, max.y], [maxX - 360, max.y], [maxX - 360, min.y], [-180, min.y]]]
                                ]
                    };
                }
            }
            return geo;
        },   
        formatDate: function(d, local){
            var dd,m,y,h,mm;
            if (local){
                dd = ("0"+d.getDate()).slice(-2);
                m = ("0"+(d.getMonth()+1)).slice(-2);
                y = d.getFullYear();
                h = ("0"+d.getHours()).slice(-2);
                mm = ("0"+d.getMinutes()).slice(-2);
				return dd+"."+m+"."+y+" "+h+":"+mm+
				" ("+("0"+d.getUTCHours()).slice(-2)+":"+("0"+d.getUTCMinutes()).slice(-2)+" UTC)";
            }
            else{
                dd = ("0"+d.getUTCDate()).slice(-2);
                m = ("0"+(d.getUTCMonth()+1)).slice(-2);
                y = d.getUTCFullYear();
                h = ("0"+d.getUTCHours()).slice(-2);
                mm = ("0"+d.getUTCMinutes()).slice(-2);
				var
                ldd = ("0"+d.getDate()).slice(-2),
                lm = ("0"+(d.getMonth()+1)).slice(-2),
                ly = d.getFullYear(),
                lh = ("0"+d.getHours()).slice(-2),
                lmm = ("0"+d.getMinutes()).slice(-2),
				offset = -d.getTimezoneOffset()/60;				
				return dd+"."+m+"."+y+" <span class='utc'>"+h+":"+mm+" UTC</span> ("+lh+":"+lmm+")"
				//return dd+"."+m+"."+y+" "+h+":"+mm+" UTC <br>"+
				//"<span class='small'>("+ldd+"."+lm+"."+ly+" "+lh+":"+lmm+" UTC"+(offset>0?"+":"")+offset+")</span>";
            }
        }, 
        searchById: function(aid, callback){
//console.log("searchById");
            var request =  {
                            WrapStyle: 'window',
                            layer: aisLayerID, //'8EE2C7996800458AAF70BABB43321FA4'
                            columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"longitude"},{"Value":"latitude"}]',
                            query: "([id] IN (" + aid.join(',') + "))"
            };
            L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);
        },
        searchString: function(searchString, isfuzzy, callback){
//console.log(aisLastPoint+", "+aisLayerID)
            var query = ""; 
            if (searchString) {
                searchString = searchString.toUpperCase();
                    if (searchString.search(/[^\d, ]/) === -1) {
                            var arr = searchString.replace(/ /g, '').split(/,/);
                            query = "([mmsi] IN (" + arr.join(',') + "))"+
                            "OR ([imo] IN (" + arr.join(',') + "))"
                    } else {
                        if (isfuzzy)
                            query = '([vessel_name] startswith \'' + searchString + '\') OR ([vessel_name] contains \' ' + searchString + '\')';
                        else
                            query = '([vessel_name] startswith \'' + searchString + '\') OR ([vessel_name] contains \' ' + searchString + '\')';
                    }
            }
            var request =  {
                            WrapStyle: 'window',
                            layer: aisLastPoint, 
                            columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"longitude"},{"Value":"latitude"}]',
                            orderdirection: 'desc',
                            orderby: 'ts_pos_utc',
                            query: query
            };
            if (isfuzzy)
                request.pagesize = 1000;
            L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);
        },      
        searchNames: function(avessels, callback){
            var request =  {
                            WrapStyle: 'window',
                            layer: aisLastPoint, 
                            orderdirection: 'desc',
                            orderby: 'ts_pos_utc',
                            query: avessels.map(function(v){return "([mmsi]="+v.mmsi+(v.imo && v.imo!=""?(" and [imo]="+v.imo):"")+")"}).join(" or ")
                            //([mmsi] IN (" + ammsi.join(',') + "))"+
                            //"and ([imo] IN (" + aimo.join(',') + "))"
            };
//console.log(request)
            L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);
        },
        searchScreen:  function(options, callback) {
            var lmap = nsGmx.leafletMap;
            var dt1 = options.dateInterval.get('dateBegin'),
                dt2 = options.dateInterval.get('dateEnd');
                //query += '([' + TemporalColumnName + '] >= \'' + dt1.toJSON() + '\')';
                //query += ' and ([' + TemporalColumnName + '] < \'' + dt2.toJSON() + '\')';
            var latLngBounds = lmap.getBounds(),
                sw = latLngBounds.getSouthWest(),
                ne = latLngBounds.getNorthEast(),
                min = { x: sw.lng, y: sw.lat },
                max = { x: ne.lng, y: ne.lat };
//console.log(min);
//console.log(max);
            L.gmxUtil.sendCrossDomainPostRequest(aisServiceUrl + "SearchScreen.ashx", 
            {WrapStyle: 'window',s:dt1.toJSON(),e:dt2.toJSON(),minx:min.x,miny:min.y,maxx:max.x,maxy:max.y, layer:screenSearchLayer}, 
            callback);
        },
		searchByCoords(x, y){
			//VectorLayer/Search.ashx?layer=2AA3504D346343A1A5505BDC75D96EC2&pagesize=1&query=longitude>=129.052004 and  longitude<=129.052006 and latitude>=35.01017333332 and latitude<=35.01017333334
            var x = x.toString(),
			y = y.toString()
			var request =  {
                            WrapStyle: 'window',
                            layer: aisLayer,
                            query: "longitude>="+x.replace(/(\d)$/, parseInt(x.slice(-1))-1)+" and  longitude<="+x.replace(/(\d)$/, parseInt(x.slice(-1))+1)+
							" and latitude>="+y.replace(/(\d)$/, parseInt(y.slice(-1))-1)+" and latitude<="+y.replace(/(\d)$/, parseInt(y.slice(-1))+1)
            };
console.log(request)
            //L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);			
		}
    };  
}