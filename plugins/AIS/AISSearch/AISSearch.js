(function () {
    'use strict';
    var pluginName = 'AISSearch',
        serverPrefix = window.serverBase || 'http://maps.kosmosnimki.ru/',
        serverScript = serverPrefix + 'VectorLayer/Search.ashx',
        publicInterface = {
            pluginName: pluginName,
            afterViewer: function (params) {
                var path = gmxCore.getModulePath(pluginName),
                    _params = L.extend({
                        regularImage: 'ship.png',
                        activeImage: 'active.png'
                    }, params),
                    searchControl = 'getSearchControl' in window.oSearchControl ? window.oSearchControl.getSearchControl() : null,
                /* eslint-disable new-cap*/
                    placeholderDefault = searchControl ? searchControl.GetSearchString() : _gtxt(pluginName + '.placeholder_0'),
                /* eslint-enable */
                    searchBorder = {},
                    lmap = nsGmx.leafletMap,
                    layersByID = nsGmx.gmxMap.layersByID,
                    aisLayerID = params.aisLayerID || '8EE2C7996800458AAF70BABB43321FA4',
                    aisLayer = layersByID[aisLayerID],
                    aisSearchLayerID = params.aisSearchLayerID || aisLayerID,
                    tracksLayerID = params.tracksLayerID || '13E2051DFEE04EEF997DC5733BD69A15',
                    tracksLayer = layersByID[tracksLayerID],
                    sideBar = L.control.gmxSidebar({ className: 'aissearch' }),
                    div = L.DomUtil.create('div', pluginName + '-content'),
                    shap = L.DomUtil.create('div', '', div),
                    title = L.DomUtil.create('span', '', shap),
                    exportIcon = L.DomUtil.create('a', 'icon-export', shap),
                    refresh = L.DomUtil.create('i', 'icon-refresh', shap),
                    bboxInfo = L.DomUtil.create('div', pluginName + '-bboxInfo', div),
                    calendarCont = L.DomUtil.create('div', pluginName + '-calendarCont', div),
                    node = null,
                    file = 'test.csv',
                    blob = null,
                    state = {},
                    trs = [],
                    mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
                    dateInterval = new nsGmx.DateInterval(),
                    isActivePlugin = false,
                    calendar, searchHook, icon, autoCompleteSearchObserver;

                L.DomEvent.on(div, 'click', L.DomEvent.stopPropagation);
                refresh.title = 'Обновить';

                exportIcon.setAttribute('target', '_blank');
                exportIcon.title = 'Экспорт в CSV';
                if (navigator.msSaveBlob) { // IE 10+
                    exportIcon.addEventListener('click', function () {
                        navigator.msSaveBlob(blob, file);
                    }, false);
                }
                if (lmap.hasLayer(aisLayer)) {
                    state[aisLayerID] = true;
                }
                if (lmap.hasLayer(tracksLayer)) {
                    state[tracksLayerID] = true;
                }

                dateInterval
                    .set('dateBegin', mapDateInterval.get('dateBegin'))
                    .set('dateEnd', mapDateInterval.get('dateEnd'))
                    .on('change', function () {
                        if (isActivePlugin) {
                            var d1 = dateInterval.get('dateBegin'),
                                d2 = dateInterval.get('dateEnd');

                            if (aisLayer) {
                                aisLayer.setDateInterval(d1, d2);
                            }
                            if (tracksLayer) {
                                tracksLayer.setDateInterval(d1, d2);
                            }
                        }
                    });
                calendar = new nsGmx.CalendarWidget({
                    // name: 'calendarAIS',
                    dateMax: new Date(),
                    dateInterval: dateInterval,
                    minimized: true,
                    showSwitcher: true
                });
                calendarCont.appendChild(calendar.el);

                publicInterface.setMMSI = function (mmsiArr, bbox) {
                    var filterFunc = function (args) {
                        var mmsi = args.properties[1],
                            i, len;
                        for (i = 0, len = mmsiArr.length; i < len; i++) {
                            if (mmsi === mmsiArr[i]) { return true; }
                        }
                        return false;
                    };
                    if (bbox) { lmap.fitBounds(bbox, { maxZoom: 11 }); }
                    if (aisLayer) {
                        if (mmsiArr.length) {
                            aisLayer.setFilter(filterFunc);
                        } else {
                            aisLayer.removeFilter();
                        }
                        if (!aisLayer._map) {
                            lmap.addLayer(aisLayer);
                        }
                    }
                    if (tracksLayer) {
                        if (mmsiArr.length) {
                            tracksLayer.setFilter(filterFunc);
                        } else {
                            tracksLayer.removeFilter();
                        }
                        if (!tracksLayer._map) {
                            lmap.addLayer(tracksLayer);
                        }
                    }
                };

                function getBorder() {
                    var dFeatures = nsGmx.leafletMap.gmxDrawing.getFeatures();
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
                    } else if (maxX > 180 || minX < -180) {
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
                }

                function getMMSIoptions(str) {
                    var cont = sideBar.getContainer(),
                        dt1 = dateInterval.get('dateBegin'),
                        dt2 = dateInterval.get('dateEnd'),
                        prop = aisLayer ? (aisLayer._gmx ? aisLayer._gmx : aisLayer).properties : {},
                        TemporalColumnName = prop.TemporalColumnName || 'ts_pos_utc',
                        query = '(',
                        columns = '{"Value":"mmsi"},{"Value":"vessel_name"},{"Value":"count(*)", "Alias":"count"}';

                    exportIcon.style.visibility = 'hidden';
                    L.DomEvent.disableScrollPropagation(cont);
                    cont.appendChild(div);
                    title.innerHTML = _gtxt(pluginName + '.title');

                    columns += ',{"Value":"min(STEnvelopeMinX([GeomixerGeoJson]))", "Alias":"xmin"}';
                    columns += ',{"Value":"max(STEnvelopeMaxX([GeomixerGeoJson]))", "Alias":"xmax"}';
                    columns += ',{"Value":"min(STEnvelopeMinY([GeomixerGeoJson]))", "Alias":"ymin"}';
                    columns += ',{"Value":"max(STEnvelopeMaxY([GeomixerGeoJson]))", "Alias":"ymax"}';
                    L.DomUtil.addClass(refresh, 'animate-spin');

                    query += '([' + TemporalColumnName + '] >= \'' + dt1.toJSON() + '\')';
                    query += ' and ([' + TemporalColumnName + '] < \'' + dt2.toJSON() + '\')';
                    if (str) {
                        if (str.search(/[^\d, ]/) === -1) {
                            var arr = str.replace(/ /g, '').split(/,/);
                            query += ' and ([mmsi] IN (' + arr.join(',') + '))';
                        } else {
                            query += ' and ([vessel_name] contains \'' + str + '\')';
                        }
                    }
                    query += ')';

                    searchBorder = getBorder();
                    L.gmxUtil.sendCrossDomainPostRequest(serverScript,
                        {
                            WrapStyle: 'window',
                            border: JSON.stringify(searchBorder),
                            /* eslint-disable camelcase */
                            border_cs: 'EPSG:4326',
                            /* eslint-enable */
                            // out_cs: 'EPSG:3395',
                            // pagesize: 100,
                            // orderdirection: 'desc',
                            orderby: 'vessel_name',
                            layer: aisSearchLayerID,
                            columns: '[' + columns + ']',
                            groupby: '[{"Value":"mmsi"},{"Value":"vessel_name"}]',
                            query: query
                        },
                        function (json) {
                            L.DomUtil.removeClass(refresh, 'animate-spin');
                            if (aisLayer && !aisLayer._map) {
                                lmap.addLayer(aisLayer);
                            }
                            if (tracksLayer && !tracksLayer._map) {
                                lmap.addLayer(tracksLayer);
                            }
                            if (json && json.Status === 'ok' && json.Result) {
                                var pt = json.Result,
                                    fields = pt.fields,
                                    values = pt.values,
                                    indexes = {};
                                fields.map(function (it, i) {
                                    indexes[it] = i;
                                });
                                if (node && node.parentNode) {
                                    node.parentNode.removeChild(node);
                                }
                                trs = [      // чистка строк таблицы
                                    ['#', 'Vessel name', 'MMSI', 'count'].join(';')
                                ];
                                if (values.length) {
                                    node = L.DomUtil.create('select', pluginName + '-selectItem selectStyle', div);
                                    if (params.height) {
                                        node.style.height = params.height + 'px';
                                    }
                                    node.setAttribute('size', 15);
                                    node.setAttribute('multiple', true);
                                    var setView = function (fitBoundsFlag) {
                                        var bbox = null,
                                            filter = [],
                                            i, len;
                                        for (i = 0, len = node.options.length; i < len; i++) {
                                            var it = node.options[i];
                                            if (it.selected) {
                                                filter.push(Number(it.id));
                                                if (fitBoundsFlag) {
                                                    var varr = values[i];
                                                    bbox = [
                                                        [varr[5], varr[3]],
                                                        [varr[6], varr[4]]
                                                    ];
                                                }
                                            }
                                        }
                                        publicInterface.setMMSI(filter, bbox);
                                    };
                                    node.onchange = function () {
                                        setView(false);
                                    };
                                    node.ondblclick = function () {
                                        setView(true);
                                    };

                                    values.map(function (it, i) {
                                        var mmsi = it[indexes.mmsi],
                                            name = it[indexes.vessel_name] || mmsi,
                                            count = it[indexes.count],
                                            val = '(' + count + ') ' + name,
                                            opt = L.DomUtil.create('option', '', node);
                                        opt.setAttribute('id', mmsi);
                                        opt.setAttribute('title', 'mmsi: ' + mmsi);
                                        opt.text = val.replace(/\s+$/, '');

                                        trs.push([(i + 1), name, mmsi, count].join(';'));
                                        return opt;
                                    });
                                    title.innerHTML = _gtxt(pluginName + '.title1') + ': <b>' + values.length + '</b>';
                                    blob = new Blob([trs.join('\n')], { type: 'text/csv;charset=utf-8;' });
                                    file = 'data_' + Date.now() + '.csv';
                                    exportIcon.setAttribute('href', window.URL.createObjectURL(blob));
                                    exportIcon.setAttribute('download', file);
                                    exportIcon.style.visibility = 'visible';
                                } else {
                                    title.innerHTML = _gtxt(pluginName + '.title2');
                                }
                            } else {
                                title.innerHTML = _gtxt(pluginName + '.error');
                            }
                        });
                    bboxInfo.innerHTML = '(<b>по ' + (searchBorder.type !== 'Feature' ? 'экрану' : 'контуру') + '</b>)';
                }

                L.DomEvent.on(refresh, 'click', function () {
                    getMMSIoptions();
                }, this);
                searchHook = function (str) {
                    var res = sideBar && sideBar._map;
                    if (res) {
                        getMMSIoptions(str);
                    }
                    return res;
                };

                /**************************************************************************/

                //Поиск судна для подсказки
                var requestParams = function (searchString) {
                    searchString = searchString.replace(/(^\s+|\s+$)/g, '');
                    //console.log('searchString=' + searchString);
                    var mapDateInterval = nsGmx.widgets.commonCalendar ? nsGmx.widgets.commonCalendar.getDateInterval() :
		            {
		                get: function (when) {
		                    var dt = Date.now();
		                    if (when == 'dateBegin') return new Date(new Date(dt).setDate(new Date(dt).getDate() - 1));
		                    if (when == 'dateEnd') return new Date(dt);
		                }
		            };
                    var dt1 = mapDateInterval.get('dateBegin'),
			            dt2 = mapDateInterval.get('dateEnd'),
                    prop = aisLayer ? (aisLayer._gmx ? aisLayer._gmx : aisLayer).properties : {},
                    TemporalColumnName = prop.TemporalColumnName || 'ts_pos_utc',
                    query = '(',
                    columns = '{"Value":"mmsi"},{"Value":"vessel_name"},{"Value":"max([ts_pos_utc])", Alias:"Last"}';
                    query += '([' + TemporalColumnName + '] >= \'' + dt1.toJSON() + '\')';
                    query += ' and ([' + TemporalColumnName + '] < \'' + dt2.toJSON() + '\')';
                    //console.log(dt1.toJSON() + ' ' + dt2.toJSON());
                    if (searchString) {
                        if (searchString.search(/[^\d, ]/) === -1) {
                            var arr = searchString.replace(/ /g, '').split(/,/);
                            query += ' and ([mmsi] IN (' + arr.join(',') + '))';
                        } else {
                            query += ' and ([vessel_name] contains \'' + searchString + '\')';
                        }
                    }
                    query += ')';

                    searchBorder = getBorder();
                    return {
                        WrapStyle: 'window',
                        border: JSON.stringify(searchBorder),
                        /* eslint-disable camelcase */
                        border_cs: 'EPSG:4326',
                        /* eslint-enable */
                        // out_cs: 'EPSG:3395',
                        // pagesize: 100,
                        orderdirection: 'desc',
                        orderby: 'Last',
                        layer: aisSearchLayerID,
                        columns: '[' + columns + ']',
                        groupby: '[{"Value":"mmsi"},{"Value":"vessel_name"}]',
                        query: query
                    }
                };

                //Наблюдатель за началом обработки запроса для подсказки
                autoCompleteSearchObserver = function (next, deferred, params) {
                    if (params.searchString && params.searchString.search(/\S/g) != -1) {
                        var rp = requestParams(params.searchString);
                        rp.pagesize = 10;
                        L.gmxUtil.sendCrossDomainPostRequest(serverScript,
                        rp,
                        function (json) {
                            if (json.Result) {
                                //console.log(json.Result.values);
                                var arrResult = [];
                                for (var i = 0; i < json.Result.values.length; ++i)
                                    arrResult.push({
                                        label: json.Result.values[i][1],
                                        value: json.Result.values[i][1],
                                        AISObject: json.Result.values[i],
                                        GeoObject: null
                                    });
                                if (arrResult.length > 0) {
                                    // отобразить полученные данные, дальнейшую обработку и геокодер не использовать
                                    //console.log('stop ' + next);
                                    params.callback(arrResult);
                                    deferred.resolve(-1);
                                }
                                else {
                                    // использовать следующий обработчик запроса
                                    //console.log('continue ' + next);
                                    deferred.resolve(next);
                                }
                            }
                            else {
                                console.log(json);
                                deferred.resolve(next);
                            }
                        });
                    }
                    else
                        deferred.resolve(next);
                };

                // Добавим обработку поискового запроса перед отправкой геокодеру
                if (searchControl)
                    searchControl.onAutoCompleteDataSearchStarting({
                        observer: { add: true, observer: autoCompleteSearchObserver },
                        selectItem: function (event, oAutoCompleteItem) {
                            if (oAutoCompleteItem && oAutoCompleteItem.AISObject != null) {
                                //console.log(oAutoCompleteItem.AISObject);
                                var dt = new Date(oAutoCompleteItem.AISObject[2] * 1000);
                                //console.log(dt);
                                var query = '[mmsi]=' + oAutoCompleteItem.AISObject[0] + ' and [ts_pos_utc]=\'' + dt.toJSON() + '\'',
				columns = '[{"Value":"mmsi"},{"Value":"vessel_name"},{"Value":"ts_pos_utc"}';
                                //console.log(query);
                                columns += ',{"Value":"min(STEnvelopeMinX([GeomixerGeoJson]))", "Alias":"xmin"}';
                                columns += ',{"Value":"max(STEnvelopeMaxX([GeomixerGeoJson]))", "Alias":"xmax"}';
                                columns += ',{"Value":"min(STEnvelopeMinY([GeomixerGeoJson]))", "Alias":"ymin"}';
                                columns += ',{"Value":"max(STEnvelopeMaxY([GeomixerGeoJson]))", "Alias":"ymax"}';
                                columns += ']';
                                L.gmxUtil.sendCrossDomainPostRequest(serverScript,
				                { WrapStyle: 'window', query: query, columns: columns, layer: aisSearchLayerID,
				                    groupby: '[{"Value":"mmsi"},{"Value":"vessel_name"},{"Value":"ts_pos_utc"}]'
				                },
				                function (json) {
				                    if (json.Result) {
				                        var AISObject = json.Result.values[0],
						                bbox = [
						                    [AISObject[5], AISObject[3]],
						                    [AISObject[6], AISObject[4]]
						                ];
				                        //console.log(AISObject);
				                        publicInterface.setMMSI([], bbox);
				                    }
				                });
                            }
                        }
                    });

                /**********************************************************************************/

                var iconOpt = {
                    id: pluginName,
                    togglable: true,
                    title: _gtxt(pluginName + '.iconTitle')
                };
				if (!lmap.options.svgSprite) {
                    L.extend(iconOpt, {
						regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
						activeImageUrl: _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage
                    });
				}
				icon = L.control.gmxIcon(iconOpt).on('statechange', function (ev) {
                    isActivePlugin = ev.target.options.isActive;
                    if (isActivePlugin) {
                        var d1 = dateInterval.get('dateBegin'),
                            d2 = dateInterval.get('dateEnd');
                        if (aisLayer) {
                            nsGmx.widgets.commonCalendar.unbindLayer(aisLayerID);
                            aisLayer.setDateInterval(d1, d2);
                            // } else {
                            // console.log("Not found AIS layer: ", aisLayerID);
                        }
                        if (tracksLayer) {
                            nsGmx.widgets.commonCalendar.unbindLayer(tracksLayerID);
                            tracksLayer.setDateInterval(d1, d2);
                        }
                        if (searchControl) {
                            searchControl.addSearchByStringHook(searchHook, 1002);

                            /* eslint-disable new-cap*/
                            if (searchControl.SetPlaceholder) { searchControl.SetPlaceholder(_gtxt(pluginName + '.placeholder_1')); }
                            /* eslint-enable */
                        }
                        lmap.addControl(sideBar);
                        getMMSIoptions();
                    } else {
                        if (searchControl) {
                            searchControl.removeSearchByStringHook(searchHook);
                            /* eslint-disable new-cap*/
                            if (searchControl.SetPlaceholder) { searchControl.SetPlaceholder(placeholderDefault); }
                            /* eslint-enable */
                        }
                        if (sideBar && sideBar._map) {
                            lmap.removeControl(sideBar);
                        }
                        if (aisLayer) {
                            if (!state[aisLayerID]) {
                                lmap.removeLayer(aisLayer);
                            }
                            nsGmx.widgets.commonCalendar.bindLayer(aisLayerID);
                            aisLayer.removeFilter();
                        }
                        if (tracksLayer) {
                            if (!state[tracksLayerID]) {
                                lmap.removeLayer(tracksLayer);
                            }
                            nsGmx.widgets.commonCalendar.bindLayer(tracksLayerID);
                            tracksLayer.removeFilter();
                        }
                    }
                });

                lmap.addControl(icon);
            }
        };

    _translationsHash.addtext('rus', {
        'AISSearch.title': 'Поиск кораблей',
        'AISSearch.title1': 'Найдено кораблей',
        'AISSearch.title2': '<b>Данных не найдено!</b>',
        'AISSearch.error': '<b>Ошибка при получении данных!</b>',
        'AISSearch.iconTitle': 'Поиск кораблей по экрану',
        'AISSearch.placeholder_0': 'Поиск по адресам, координатам',
        'AISSearch.placeholder_1': 'Поиск судна по названию / MMSI'
        // 'AISSearch.placeholder_1': 'Поиск судна по названию / MMSI. Поиск по адресам, координатам, кадастровым номерам'
    });
    _translationsHash.addtext('eng', {
        'AISSearch.title': 'Searching vessels',
        'AISSearch.title1': 'Vessels found',
        'AISSearch.title2': '<b>Vessels not found!</b>',
        'AISSearch.error': '<b>Vessels not found!</b>',
        'AISSearch.iconTitle': 'Search vessels within the view area',
        'AISSearch.placeholder_0': 'Search for addresses, coordinates',
        'AISSearch.placeholder_1': 'Search by vessel name / MMSI'
        // 'AISSearch.placeholder_1' : 'Search by vessel name / MMSI. Search by addresses, coordinates, cadastre number'
    });

    gmxCore.addModule(pluginName, publicInterface, {
        css: pluginName + '.css'
    });
})();
