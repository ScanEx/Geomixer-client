module.exports = function (options) {
    const _baseUrl = window.serverBase || document.location.href.replace(/^(https?:).+/, "$1") + '//maps.kosmosnimki.ru/',
        _aisServices = _baseUrl + "Plugins/AIS/",
        _serverScript = _baseUrl + 'VectorLayer/Search.ashx';
    const { aisLastPoint:_aisLastPoint, 
        screenSearchLayer:_screenSearchLayer, 
        aisLayerID:_aisLayerID, 
        historyLayer:_historyLayer 
    } = options;

    return {
        baseUrl: _baseUrl,
        get screenSearchLayer(){return _screenSearchLayer},
        aisServices: _aisServices,
        getBorder: function () {
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
                    geo = {
                        type: 'MultiPolygon', coordinates: [
                            [[[-180, min.y], [-180, max.y], [maxX, max.y], [maxX, min.y], [-180, min.y]]],
                            [[[minX + 360, min.y], [minX + 360, max.y], [180, max.y], [180, min.y], [minX + 360, min.y]]]
                        ]
                    };
                } else if (maxX > 180) {
                    geo = {
                        type: 'MultiPolygon', coordinates: [
                            [[[minX, min.y], [minX, max.y], [180, max.y], [180, min.y], [minX, min.y]]],
                            [[[-180, min.y], [-180, max.y], [maxX - 360, max.y], [maxX - 360, min.y], [-180, min.y]]]
                        ]
                    };
                }
            }
            return geo;
        },

        formatTime: function (d, local) {
            var temp = new Date(d)
            if (!local)
                temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset())
            return temp.toLocaleTimeString();
        },
        formatDate: function (d, local) {
            var temp = new Date(d)
            if (!local)
                temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset())
            return temp.toLocaleDateString();
        },
        formatDateTime: function (d, local) {
            if (d.isNaN)
                return "";
            var temp = new Date(d)
            if (!local)
                temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset())
            return temp.toLocaleString().replace(/,/, "");
        },

        formatDate2: function (d, local) {
            var dd, m, y, h, mm;
            if (local) {
                dd = ("0" + d.getDate()).slice(-2);
                m = ("0" + (d.getMonth() + 1)).slice(-2);
                y = d.getFullYear();
                h = ("0" + d.getHours()).slice(-2);
                mm = ("0" + d.getMinutes()).slice(-2);
                return dd + "." + m + "." + y + " " + h + ":" + mm +
                    " (" + ("0" + d.getUTCHours()).slice(-2) + ":" + ("0" + d.getUTCMinutes()).slice(-2) + " UTC)";
            }
            else {
                dd = ("0" + d.getUTCDate()).slice(-2);
                m = ("0" + (d.getUTCMonth() + 1)).slice(-2);
                y = d.getUTCFullYear();
                h = ("0" + d.getUTCHours()).slice(-2);
                mm = ("0" + d.getUTCMinutes()).slice(-2);
                var
                    ldd = ("0" + d.getDate()).slice(-2),
                    lm = ("0" + (d.getMonth() + 1)).slice(-2),
                    ly = d.getFullYear(),
                    lh = ("0" + d.getHours()).slice(-2),
                    lmm = ("0" + d.getMinutes()).slice(-2),
                    offset = -d.getTimezoneOffset() / 60;
                return dd + "." + m + "." + y + " <span class='utc'>" + h + ":" + mm + " UTC</span> (" + lh + ":" + lmm + ")"
                //return dd+"."+m+"."+y+" "+h+":"+mm+" UTC <br>"+
                //"<span class='small'>("+ldd+"."+lm+"."+ly+" "+lh+":"+lmm+" UTC"+(offset>0?"+":"")+offset+")</span>";
            }
        },
        placeVesselTypeIcon: function(vessel){
            let protocol = document.location.protocol;            
            // speed icon
            if (vessel.sog >= 8) {
                vessel.iconAlt = protocol + "//geomixer.scanex.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS\\SCF\\sog8-L-100-move.svg";
            }
            else if (4 < vessel.sog && vessel.sog < 8) {
                vessel.iconAlt = protocol + "//geomixer.scanex.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS\\SCF\\sog4_8-L-100-move.svg";
            }
            else if (0 < vessel.sog && vessel.sog <= 4) {
                vessel.iconAlt = protocol + "//geomixer.scanex.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS\\SCF\\sog4-L-100-move.svg";
            }
            else {
                vessel.iconAlt = protocol + "//geomixer.scanex.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS\\SCF\\sog-L-100-stand_red.svg";
            }   
            
            // type icon
            switch (vessel.vessel_type.toLowerCase()) {
                case "cargo":
                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Ccargo-L-100-" +
                        (vessel.sog != 0 ? "move" : "stand") + ".svg"
                    break;
                case "tanker":
                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Ctanker-L-100-" +
                        (vessel.sog != 0 ? "move" : "stand") + ".svg"
                    break;
                case "fishing":
                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cfishing-L-100-" +
                        (vessel.sog != 0 ? "move" : "stand") + ".svg"
                    break;
                case "passenger":
                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cpassenger-L-100-" +
                        (vessel.sog != 0 ? "move" : "stand") + ".svg"
                    break;                
                case "hsc":
                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Chighspeed-L-100-" +
                        (vessel.sog != 0 ? "move" : "stand") + ".svg"
                    break;
                case "pleasure craft":
                case "sailing":
                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cpleasure-L-100-" +
                        (vessel.sog != 0 ? "move" : "stand") + ".svg"
                    break;
                case "unknown": 
                case "reserved": 
                case "other":
                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cother-L-100-" +
                        (vessel.sog != 0 ? "move" : "stand") + ".svg"
                    break;
                default:
                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cspecialcraft-L-100-" +
                        (vessel.sog != 0 ? "move" : "stand") + ".svg"
                    break;
            }
        },

        searchPositionsAgg: function (vessels, dateInterval, callback) {
            //console.log(dateInterval);
            var request = {
                WrapStyle: 'window',
                layer: _historyLayer, //'8EE2C7996800458AAF70BABB43321FA4',//
                orderdirection: 'desc',
                orderby: 'ts_pos_utc',
                columns:'[{"Value":"mmsi"},{"Value":"flag_country"},{"Value":"callsign"},{"Value":"ts_pos_utc"},{"Value":"cog"},{"Value":"sog"},{"Value":"draught"},{"Value":"vessel_type"},'+
                '{"Value":"destination"},{"Value":"ts_eta"},{"Value":"nav_status"},{"Value":"heading"},{"Value":"rot"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]',
                
                query: "([mmsi] IN (" + vessels.join(',') + ")) and '" + dateInterval.dateBegin.toISOString() + "'<=[ts_pos_utc] and [ts_pos_utc]<'" + dateInterval.dateEnd.toISOString() + "'"
            };
            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
        },
        searchPositions: function (vessels, dateInterval, callback) {
            //console.log("searchById");
            var request = {
                WrapStyle: 'window',
                layer: _historyLayer, //'8EE2C7996800458AAF70BABB43321FA4',//
                //orderdirection: 'desc',
                //orderby: 'ts_pos_utc',
                query: "([mmsi] IN (" + vessels.join(',') + ")) and '" + dateInterval.dateBegin.toISOString() + "'<=[ts_pos_utc] and [ts_pos_utc]<'" + dateInterval.dateEnd.toISOString() + "'"
            };
            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
        },
        searchById: function (aid, callback) {
            //console.log("searchById");
            var request = {
                WrapStyle: 'window',
                layer: _aisLayerID, //'8EE2C7996800458AAF70BABB43321FA4'
                columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]',
                query: "([id] IN (" + aid.join(',') + "))"
            };
            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
        },
        searchString: function (searchString, isfuzzy, callback) {
            //console.log(_aisLastPoint+", "+_aisLayerID)
            var query = "";
            if (searchString) {
                searchString = searchString.toUpperCase();
                if (searchString.search(/[^\d, ]/) === -1) {
                    var arr = searchString.replace(/ /g, '').split(/,/);
                    query = "([mmsi] IN (" + arr.join(',') + "))" +
                        "OR ([imo] IN (" + arr.join(',') + "))"
                } else {
                    if (isfuzzy)
                        query = '([vessel_name] startswith \'' + searchString + '\') OR ([vessel_name] contains \' ' + searchString + '\')';
                    else
                        query = '([vessel_name] startswith \'' + searchString + '\') OR ([vessel_name] contains \' ' + searchString + '\')';
                }
            }
            var request = {
                WrapStyle: 'window',
                layer: _aisLastPoint,
                columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"vessel_type"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]',
                //orderdirection: 'desc',
                orderby: 'vessel_name',
                query: query
            };
            if (isfuzzy)
                request.pagesize = 1000;
            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
        },
        searchNames: function (avessels, callback) {
            var a = avessels.reduce((p,c)=>{
                if((c.mmsi && c.mmsi!="") || (c.imo && c.imo!="" && c.imo!=-1)) 
                    p.push(c); 
                return p;
            },[]),
            request = {
                WrapStyle: 'window',
                layer: _aisLastPoint,
                orderdirection: 'desc',
                orderby: 'ts_pos_utc',
                query: a.map(function (v) { return "([mmsi]=" + v.mmsi + (v.imo && v.imo != "" ? (" and [imo]=" + v.imo) : "") + ")" }).join(" or ")
            };
            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
        },
        searchScreen: function (options, callback) {
            var lmap = nsGmx.leafletMap;
            var latLngBounds = lmap.getBounds(),
                sw = latLngBounds.getSouthWest(),
                ne = latLngBounds.getNorthEast(),
                min = { x: sw.lng, y: sw.lat },
                max = { x: ne.lng, y: ne.lat };
            let queryParams = { WrapStyle: 'window', minx: min.x, miny: min.y, maxx: max.x, maxy: max.y, layer: _screenSearchLayer },
            //     layerTreeNode = $(_queryMapLayers.buildedTree).find("div[LayerID='"+_screenSearchLayer+"']")[0];
            // if (layerTreeNode){   
            //     var gmxProp = layerTreeNode.gmxProperties.content.properties;
            //     if (gmxProp.Temporal) {
            //         queryParams.s = options.dateInterval.get('dateBegin').toJSON(),
            //         queryParams.e = options.dateInterval.get('dateEnd').toJSON();
            //     }
            // }
            dateInterval = nsGmx.widgets.commonCalendar.getDateInterval();
            queryParams.s = options.dateInterval.get('dateBegin').toJSON(),
            queryParams.e = options.dateInterval.get('dateEnd').toJSON();
//console.log(queryParams);
            L.gmxUtil.sendCrossDomainPostRequest(_aisServices + "SearchScreen.ashx",
                queryParams,
                callback);
        }
    };
};