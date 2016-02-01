(function() {

    _translationsHash.addtext('rus', {
        'AISIntersects.iconTitle' : 'Поиск кораблей по контурам',
        'AISIntersects.Layer' : 'Слой',
        'AISIntersects.Polygon' : 'Контур',
        'AISIntersects.Date' : 'Период',
        'AISIntersects.ships' : 'кораблей',
        'AISIntersects.Total' : 'Всего',
        'AISIntersects.DidNot' : 'В данную гавань не заходили корабли!',
        'AISIntersects.Waiting' : 'Ожидание результатов поиска!',
        'AISIntersects.mmsi' : 'Mmsi',
        'AISIntersects.Ship' : 'Имя судна',
        'AISIntersects.Latitude' : 'Широта',
        'AISIntersects.Longitude' : 'Долгота',
        'AISIntersects.cog' : 'Курс',
        'AISIntersects.ts_pos_utc' : 'Время точки',
        'AISIntersects.callsign' : 'Позывной',
        'AISIntersects.destination' : 'Назначение',
        'AISIntersects.flag_country' : 'Страна',
        'AISIntersects.vessel_type' : 'Тип Судна',
        'AISIntersects.nav_status' : 'Статус',
        'AISIntersects.heading' : 'Heading',
        'AISIntersects.imo' : 'Imo',
        'AISIntersects.sog' : 'Sog'
    });
    _translationsHash.addtext('eng', {
        'AISIntersects.iconTitle' : 'Find ships in polygons',
        'AISIntersects.Layer' : 'Layer',
        'AISIntersects.Polygon' : 'Polygon',
        'AISIntersects.Date' : 'Date',
        'AISIntersects.ships' : 'ships',
        'AISIntersects.Total' : 'Total',
        'AISIntersects.DidNot' : 'Did not enter ships in this area!',
        'AISIntersects.Waiting' : 'Waiting for search result!',
        'AISIntersects.mmsi' : 'Mmsi',
        'AISIntersects.Ship' : 'Ship',
        'AISIntersects.Latitude' : 'Latitude',
        'AISIntersects.Longitude' : 'Longitude',
        'AISIntersects.cog' : 'cog',
        'AISIntersects.ts_pos_utc' : 'ts_pos_utc',
        'AISIntersects.callsign' : 'callsign',
        'AISIntersects.destination' : 'destination',
        'AISIntersects.flag_country' : 'Country',
        'AISIntersects.vessel_type' : 'vessel_type',
        'AISIntersects.nav_status' : 'nav_status',
        'AISIntersects.heading' : 'Heading',
        'AISIntersects.imo' : 'Imo',
        'AISIntersects.sog' : 'Sog'
    });

    var publicInterface = {
        pluginName: 'AISIntersects',
        afterViewer: function(params, map) {
            var path = gmxCore.getModulePath('AISIntersects');
            var _params = $.extend({
                regularImage: 'ship.png',
                activeImage: 'active.png',
                layerName: null
            }, params);
            
            var layerName = _params.layerName;
            
            function popupFunc(ev) {
                var prop = ev.layer.options.prop;
                var txt = '<p>';
                txt += _gtxt('AISIntersects.mmsi') + ': <strong>' + prop.mmsi + '</strong> <br />';
                txt += _gtxt('AISIntersects.Ship') + ': <strong>' + prop.vessel_name + '</strong> <br />';
                txt += '<img src="http://photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi=' + prop.mmsi + '" alt="Ship icon" border="0" /> <br />';
                txt += _gtxt('AISIntersects.Latitude') + ': <strong>' + prop.latitude + '</strong> <br />';
                txt += _gtxt('AISIntersects.Longitude') + ': <strong>' + prop.longitude + '</strong> <br />';
                txt += _gtxt('AISIntersects.cog') + ': <strong>' + prop.cog + '</strong> <br />';
                txt += _gtxt('AISIntersects.ts_pos_utc') + ': <strong>' + prop.ts_pos_utc + '</strong> <br />';
                txt += _gtxt('AISIntersects.callsign') + ': <strong>' + prop.callsign + '</strong> <br />';
                txt += _gtxt('AISIntersects.destination') + ': <strong>' + prop.destination + '</strong> <br />';
                txt += _gtxt('AISIntersects.flag_country') + ': <strong>' + prop.flag_country + '</strong> <br />';
                txt += _gtxt('AISIntersects.vessel_type') + ': <strong>' + prop.vessel_type + '</strong> <br />';
                txt += _gtxt('AISIntersects.nav_status') + ': <strong>' + prop.nav_status + '</strong> <br />';
                txt += _gtxt('AISIntersects.heading') + ': <strong>' + prop.heading + '</strong> <br />';
                txt += _gtxt('AISIntersects.imo') + ': <strong>' + prop.imo + '</strong> <br />';
                txt += _gtxt('AISIntersects.sog') + ': <strong>' + prop.sog + '</strong> <br />';
                txt += '</p>';
                ev.popup.setContent(txt);
            };
            
            var lmap = nsGmx.leafletMap,
                layersByID = nsGmx.gmxMap.layersByID,
                featureGroup = L.featureGroup();

            featureGroup.bindPopup('temp', {maxWidth: 270});
            featureGroup.on('popupopen', popupFunc, featureGroup);
            featureGroup.addTo(lmap);

            function getActiveLayer() {
                var active = $(_queryMapLayers.treeCanvas).find(".active");
                    
                if (active[0] && active[0].parentNode.getAttribute("LayerID") &&
                    active[0].parentNode.gmxProperties.content.properties.type === "Vector")
                {
                    return active[0].parentNode.gmxProperties.content.properties.name;
                }
                return null;
            }

            function myClick(ev) {
                var gmx = ev.gmx,
                    vid = gmx.id,
                    layerID = this._gmx.layerID,
                    popup = ev.target._popup,
                    aisLayerID = layerName || getActiveLayer() || '8EE2C7996800458AAF70BABB43321FA4',    // по умолчанию поиск по слою АИС 
                    dateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
                    dt1 = dateInterval.get('dateBegin'),
                    dt2 = dateInterval.get('dateEnd');

                var aisLayer = layersByID[aisLayerID],
                    prop = aisLayer._gmx.properties,
                    TemporalColumnName = prop.TemporalColumnName;

                var layerSTR = _gtxt('AISIntersects.Layer') + ':&nbsp;<b>' + prop.title + '</b><br>';
                layerSTR += _gtxt('AISIntersects.Polygon') + ':&nbsp;<b>' + vid + '</b><br>';
                layerSTR += _gtxt('AISIntersects.Date') + ':&nbsp;<b>' + dt1.toLocaleString() + '</b>';
                layerSTR += ' - <b>' + dt2.toLocaleString() + '</b><br>';

                var query = "((["+TemporalColumnName+"] >= '" + dt1.toJSON() + "')";
                query += " and (["+TemporalColumnName+"] < '" + dt2.toJSON() + "')";
                query += ")";
                L.gmxUtil.sendCrossDomainPostRequest(
                    'http://maps.kosmosnimki.ru/VectorLayer/Search.ashx'
                    , {
                        WrapStyle: 'window',
                        page: 0,
                        pagesize: 1000,
                        out_cs: 'EPSG:4326',
                        geometry: true,
                        layer: aisLayerID,         // слой в котором ищем обьекты
                        BorderFromLayer: layerID,  // слой в котором границы поиска
                        BorderId: vid,             // id обьекта границы поиска
                        query: query               // Условие отбора
                    }
                    ,function(ph) {
                        var mmsiHash = {},
                            ret = [];
                        if (ph.Status === 'ok') {
                            var fields = ph.Result.fields,
                                arr = ph.Result.values;
                            for (var i = arr.length - 1; i >= 0; i--) {
                                var req = arr[i],
                                    geom = {},
                                    prop = {};
                                for (var j = 0, len1 = req.length; j < len1; j++) {
                                    var fname = fields[j],
                                        it = req[j];
                                    if (fname === 'geomixergeojson') {
                                        geom = it;
                                    } else {
                                        prop[fname] = it;
                                    }
                                }
                                var mmsi = prop.MMSI || prop.mmsi;
                                mmsiHash[mmsi] = { 'prop': prop, 'geometry': geom };
                            }
                            featureGroup.clearLayers();
                            var arrMMSI = [];
                            for (var key in mmsiHash) {
                                arrMMSI.push(key);
                                var item = mmsiHash[key],
                                    coords = item.geometry.coordinates.reverse();
                                L.circleMarker(coords, { color: '#ff0000', fillOpacity: 1, prop: item.prop }).addTo(featureGroup);
                            }
                            arrMMSI = arrMMSI.sort();
                            var mmsiStr = '<div style="max-height: 300px; overflow: auto; font-weight: bold;">';
                            mmsiStr += arrMMSI.join('<br>');
                            mmsiStr += '<div>';

                            var st = layerSTR.replace(/\s/g, '&nbsp;');
                            if(arrMMSI.length) {
                                st += 'mmsi&nbsp;' + _gtxt('AISIntersects.ships') + ':<br>';
                                st += mmsiStr;
                                st += '<hr><br>' + _gtxt('AISIntersects.Total') + ': <b>' + arrMMSI.length + '</b>';
                            } else {
                                st += _gtxt('AISIntersects.DidNot');
                            }
                            popup.setContent(st);
                        } else if (ph.Status == 'error') {
                            alert(ph.ErrorInfo.ErrorMessage);
                        }
                    }
                );
                popup.options.minWidth = 320;
                popup.setContent(_gtxt('AISIntersects.Waiting'));
            }

            //var cont = null;
            var icon = L.control.gmxIcon({
                id: 'aisIntersectIcon', 
                togglable: true,
                regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
                activeImageUrl:  _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage,
                title: _gtxt('AISIntersects.iconTitle')
            }).on('statechange', function(ev) {
                var isActive = ev.target.options.isActive;
                    
                for (var i = 0, len = nsGmx.gmxMap.layers.length; i < len; i++) {
                    var layer = nsGmx.gmxMap.layers[i];
                    if (isActive) {
                        layer.on('click', myClick);
                    } else {
                        layer.off('click', myClick);
                    }
                }
            });
            lmap.addControl(icon);
        }
    };
    gmxCore.addModule('AISIntersects', publicInterface, {});
})();