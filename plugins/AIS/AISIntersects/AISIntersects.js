(function() {

    _translationsHash.addtext("rus", {
        "AISIntersects.iconTitle" : "Поиск кораблей по контурам"
    });
    _translationsHash.addtext("eng", {
        "AISIntersects.iconTitle" : "Find ships in polygons"
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
            
            if ( !map) {
                return;
            }
            var setText = function(o, div) {
                var prop = o.properties;
                var txt = '<p>';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Mmsi', 'mmsi') + ': <strong>' + prop.mmsi + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Имя судна', 'Ship') + ': <strong>' + prop.vessel_name + '</strong> <br />';
                txt += '<img src="http://photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi=' + prop.mmsi + '" alt="Ship icon" border="0" /> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Широта', 'Latitude') + ': <strong>' + prop.latitude + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Долгота', 'Longitude') + ': <strong>' + prop.longitude + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Курс', 'cog') + ': <strong>' + prop.cog + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Время точки', 'ts_pos_utc') + ': <strong>' + prop.ts_pos_utc + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Позывной', 'callsign') + ': <strong>' + prop.callsign + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Назначение', 'destination') + ': <strong>' + prop.destination + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Страна', 'flag_country') + ': <strong>' + prop.flag_country + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Тип Судна', 'vessel_type') + ': <strong>' + prop.vessel_type + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Статус', 'nav_status') + ': <strong>' + prop.nav_status + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Heading', 'heading') + ': <strong>' + prop.heading + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Imo', 'imo') + ': <strong>' + prop.imo + '</strong> <br />';
                txt += '' + gmxAPI.KOSMOSNIMKI_LOCALIZED('Sog', 'sog') + ': <strong>' + prop.sog + '</strong> <br />';
                txt += '</p>';
                return txt;
            };
            
            var cont = null;
            var mapListenerId = null;
            var toolContainer = new map.ToolsContainer('addObject', {style: {padding: '0px'}});
            var tool = toolContainer.addTool('addObject', {
                hint: _gtxt('AISIntersects.iconTitle'),
                regularStyle: {padding: '0px', display: 'list-item'},
                activeStyle: {backgroundColor: 'red'},
                regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
                activeImageUrl:  _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage,
                onClick: function() {
                    function getActiveLayer() {
                        var out = null;
                        var active = $(_queryMapLayers.treeCanvas).find(".active");
                        if (active && active[0] && active[0].parentNode.getAttribute("LayerID") &&
                            active[0].parentNode.gmxProperties.content.properties.type === "Vector")
                        {
                            var activeLayerName = active[0].parentNode.gmxProperties.content.properties.name;
                            var layer = gmxAPI.map.layers[activeLayerName];
                            var dateInterval = layer.getDateInterval();
                            if(dateInterval) {
                                out = {
                                    layerID: activeLayerName
                                    ,TemporalColumnName: layer.properties.TemporalColumnName
                                    ,begDate: dateInterval.beginDate
                                    ,endDate: dateInterval.endDate
                                };
                            }
                        }
                        return out;
                    }
                    
                    function myClick(obj, div) {
                        var ogc_fid = obj['properties'].ogc_fid;
                        var layerProp = obj.layer['properties'];
                        var layer = layerProp.name;
                        var layerSTR = gmxAPI.KOSMOSNIMKI_LOCALIZED('Слой', 'Layer') + ':&nbsp;<b>' + layerProp.title + '</b><br>';
                        layerSTR += gmxAPI.KOSMOSNIMKI_LOCALIZED('Контур', 'Polygon') + ':&nbsp;<b>' + ogc_fid + '</b><br>';
                        var searchLayerAttr = getActiveLayer();
                        if(!searchLayerAttr || !searchLayerAttr.layerID || !searchLayerAttr.TemporalColumnName) {
                            var res = gmxAPI.KOSMOSNIMKI_LOCALIZED('Не указан активный слой для поиска!', 'No active layer to search!');
                            //alert(gmxAPI.KOSMOSNIMKI_LOCALIZED('Не указан активный слой для поиска!', 'No active layer to search!'));
                            return res;
                        }

                        var TemporalColumnName = searchLayerAttr.TemporalColumnName;
                        var dt1 = searchLayerAttr.begDate;
                        var zn = gmxAPI.pad2(dt1.getDate()) + "." + gmxAPI.pad2(dt1.getMonth() + 1) + "." + dt1.getFullYear() + ' ' + gmxAPI.pad2(dt1.getHours()) + ":" + gmxAPI.pad2(dt1.getMinutes()) + ":" + gmxAPI.pad2(dt1.getSeconds());
                        layerSTR += gmxAPI.KOSMOSNIMKI_LOCALIZED('Период', 'Date') + ':&nbsp;<b>' + zn + '</b>';
                        var query = "((["+TemporalColumnName+"] >= '" + zn + "')";
                        dt1 = searchLayerAttr.endDate;
                        zn = gmxAPI.pad2(dt1.getDate()) + "." + gmxAPI.pad2(dt1.getMonth() + 1) + "." + dt1.getFullYear() + ' ' + gmxAPI.pad2(dt1.getHours()) + ":" + gmxAPI.pad2(dt1.getMinutes()) + ":" + gmxAPI.pad2(dt1.getSeconds());
                        layerSTR += ' - <b>' + zn + '</b><br>';
                        query += " and (["+TemporalColumnName+"] < '" + zn + "')";
                        query += ")";
                        gmxAPI.sendCrossDomainPostRequest(
                            'http://maps.kosmosnimki.ru/VectorLayer/Search.ashx'
                            , {
                                'WrapStyle': 'window'
                                ,'page': 0
                                ,'pagesize': 1000
                                ,'geometry': true
                                ,'layer': searchLayerAttr.layerID			// слой в котором ищем обьекты
                                ,'BorderFromLayer': layerProp.name	// слой в котором границы поиска
                                ,'BorderId': ogc_fid		// id обьекта границы поиска
                                ,'query': query				// Условие отбора
                            }
                            ,function(ph) {
                                var markers = [];
                                var mmsiHash = {};
                                var ret = [];
                                if (ph.Status == 'ok')
                                {
                                    var fields = ph.Result.fields;
                                    var arr = ph.Result.values;
                                    for (var i = 0, len = arr.length; i < len; i++)
                                    {
                                        var req = arr[i];
                                        var item = {};
                                        var prop = {};
                                        for (var j = 0, len1 = req.length; j < len1; j++)
                                        {
                                            var fname = fields[j];
                                            var it = req[j];
                                            if (fname === 'geomixergeojson') {
                                                item.geometry = gmxAPI.from_merc_geometry(it);
                                            } else {
                                                prop[fname] = it;
                                            }
                                        }
                                        var mmsi = prop['MMSI'] || prop['mmsi'];
                                        mmsiHash[mmsi] = {'prop': prop, 'geometry': item.geometry};
                                    }
                                    if(cont) cont.remove();
                                    cont = map.addObject();
                                    var arrMMSI = [];
                                    for (var key in mmsiHash)
                                    {
                                        arrMMSI.push(key);
                                        var item = mmsiHash[key];
                                        var obj = cont.addObject(item.geometry, item.prop);
                                        obj.setStyle(
                                            { marker: { image: "img/search.png", dx: -15, dy: -35 } }, 
                                            { marker: { image: "img/search_a.png", dx: -15, dy: -35 } }
                                        );
                                        obj.enableHoverBalloon(setText, {'disableOnMouseOver': true});	
                                        markers.push(obj);
                                    }
                                    arrMMSI = arrMMSI.sort();
                                    var mmsiStr = '<div style="height: 300px; overflow: auto; font-weight: bold;">';
                                    mmsiStr += arrMMSI.join('<br>');
                                    mmsiStr += '<div>';

                                    var st = layerSTR.replace(/\s/g, '&nbsp;');
                                    if(markers.length) {
                                        st += 'mmsi&nbsp;'+gmxAPI.KOSMOSNIMKI_LOCALIZED("кораблей", "ships")+':<br>';
                                        st += mmsiStr;
                                        st += '<hr><br>'+gmxAPI.KOSMOSNIMKI_LOCALIZED("Всего", "Total")+': <b>' + markers.length + '</b>';
                                    } else {
                                        st += gmxAPI.KOSMOSNIMKI_LOCALIZED('В данную гавань не заходили корабли!', 'Did not enter ships in this area!');
                                    }
                                    div.innerHTML = st;
                                    //console.log('Найдены: ', mmsiHash, ph);
                                } else if (ph.Status == 'error') {
                                    alert(ph.ErrorInfo.ErrorMessage);
                                }
                            }
                        );
                        return gmxAPI.KOSMOSNIMKI_LOCALIZED('Ожидание результатов поиска!', "Waiting for search result!");
                    };
                    for (var i = 0, len = map.layers.length; i < len; i++) {
                        var layer = map.layers[i];
                        layer.enableHoverBalloon(myClick, {'disableOnMouseOver': true});
                    }
                },
                onCancel: function(){
                    for (var i = 0, len = map.layers.length; i < len; i++) {
                        var layer = map.layers[i];
                        layer.enableHoverBalloon(null, {'disableOnMouseOver': true});
                    }
                }
            });
            /*for (var i = 0, len = tool.row.childNodes.length; i < len; i++) {
                var td = tool.row.childNodes[i];
                td.style.padding = '0px';
            }*/
            
        }
    };
    
    gmxCore.addModule('AISIntersects', publicInterface, {});
})();