(function(){
    _translationsHash.addtext('rus', {WeatherPlugin: {
        WindButton : 'Ветер',
        WeatherButton : 'Погода'
    }});
    _translationsHash.addtext('eng', {WeatherPlugin: {
        WindButton : 'Wind',
        WeatherButton : 'Weather'
    }});

    gmxCore.addModule('WeatherPlugin', {
        pluginName: 'Weather',
        afterViewer: function(params, map) {
            var lmap = nsGmx.leafletMap,
                controlsManager = lmap.gmxControlsManager,
                gmxLayers = controlsManager.get('layers'),
                weatherLayer = L.windWeatherLayer({type: 'weather'}),
                windLayer = L.windWeatherLayer({type: 'wind'});

            gmxLayers.addOverlay(weatherLayer, _gtxt('WeatherPlugin.WeatherButton'));
            gmxLayers.addOverlay(windLayer, _gtxt('WeatherPlugin.WindButton'));
        }
    })
})();
/*
 * L.WindWeatherLayer  - wind and weather layers for leaflet
*/
(function() {
    var rus = {
        weekdays: ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'],
        tods: ['ночь','утро','день','вечер'],
        dir: ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'],
        accordingTo: 'По данным'
    };
    var _gtxt = function (key) {
        return L.gmxLocale ? L.gmxLocale.getText(key) : null;
    };
    if (L.gmxLocale) {
        L.gmxLocale.addText({
            eng: {
                WeatherPlugin: {
                    weekdays: ['ВС','ПН','ВТ','СР','ЧТ','ПТ','СБ'],
                    tods: ['ночь','утро','день','вечер'],
                    dir: ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'],
                    AccordingTo: 'According to the data from'
                 }
            },
            rus: {
                WeatherPlugin: rus
            }
        });
    }
    var dataGlobal = null,
        weatherURL = 'http://maps.kosmosnimki.ru/Weather.ashx',
        imagesHost = 'http://maps.kosmosnimki.ru/api/img/weather/',
        accordingTo = _gtxt('WeatherPlugin.AccordingTo') || rus.accordingTo,
        weekdays = _gtxt('WeatherPlugin.weekdays') || rus.weekdays,
        tods = _gtxt('WeatherPlugin.tods') || rus.tods,
        dir = _gtxt('WeatherPlugin.dir') || rus.dir,
        styles = [],
        callbacks = [],
        defGlobal = new L.gmx.Deferred(),
        weatherOptions = {
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        },
        windOptions = {
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            iconUrl: imagesHost + 'wind.png'
        },
        hsl2filter = function (h, s, l) {
            return 'hue-rotate(' + h + 'deg) saturate(' + s + '%) brightness(' + l + '%)';
        },
        popupFunc = function (ev) {
            var layer = ev.layer,
                opt = layer.options,
                num = opt.num,
                type = opt.type,
                it = dataGlobal.items[num],
                popup = ev.popup;

            var str = '<span style="font-size:14px; font-weight:bold; color:#000;">' + it.Name + '</span><br/>';
            str += '<table style="width:'+(type === 'weather' ? 375 : 200) + 'px;"><tbody>';
            for (var i = 0, len = it.Forecast.length; i < len; ++i) {
                var pt = it.Forecast[i];
                var imgIcon = (pt.Precipitation < 9) ? pt.Precipitation : pt.Cloudiness,
                    pres = Math.round((pt.PressureMax + pt.PressureMin) / 2),
                    rel = Math.round((pt.HumidityMax + pt.HumidityMin) / 2),
                    date = new Date(Number(pt.DateTime.replace("/Date(","").replace(")/","")));
              
                str += '<tr>' +
                    '<td style="width:70px">' + weekdays[date.getDay()] + ', ' + tods[pt.TimeOfDay] + '</td>';

                if (type === 'weather') {
                    str += '<td style="width:80px;text-align:center;">' + (pt.TemperatureMin > 0 ? '+' : '') + pt.TemperatureMin + '..' + (pt.TemperatureMax > 0 ? '+' : '') + pt.TemperatureMax + '</td>';
                }
                str += '<td style="width:20px;text-align:right;">' + dir[pt.WindDirection] + '</td>' +
                    '<td style="width:80px;text-align:center;">' + pt.WindMin + '-' + pt.WindMax + ' м/с' +'</td>';
                if (type === 'weather') {
                    str += '<td style="width:70px;text-align:center;">' + pres + ' м.р.с.</td>' +
                        '<td style="width:35px;text-align:center;">' + rel + '%</td>' +
                        '<td style="width:20px;"><img style="width:16px;height:16px;" src="' + imagesHost + '16/' + imgIcon + '.png"></td>';
                }
                str += '</tr>';
            }
            str += '</table></tbody>';
            str += '<div style="margin-top:5px; font-size:10px; text-align:right; font-family: sans-serif;">' + accordingTo + ' <a href="http://gismeteo.ru" target="_blank">Gismeteo.ru</a></div>';
            popup.setContent(str);
        };

    var parseData = function (arr) {
        var weather = [],
            wind = [],
            items = [];
        for (var i = 0, len = arr.length; i < len; i++) {
            var it = arr[i];
            if (it.Error !== null) {continue;}
            var forecast = it.Forecast,
                icon = 0,
                angle = 0,
                scale = 1,
                filter = '',
                latlng = [it.Lat, it.Lng];

            if (forecast && forecast.length) {
                icon = forecast[0].Precipitation < 9
                    ? forecast[0].Precipitation
                    : forecast[0].Cloudiness
                ;
                angle = forecast[0].WindDirection * 45;
                var pow = Math.floor((forecast[0].WindMax + forecast[0].WindMin) / 2);
                if (pow <= 4) {
                    filter = hsl2filter(223, 100, 44);
                    scale = 0.5;
                } else if (pow <= 8) {
                    filter = hsl2filter(5, 100, 51);
                    scale = 0.6;
                } else if (pow <= 12) {
                    filter = hsl2filter(163, 100, 48);
                    scale = 0.7;
                } else if (pow <= 16) {
                    filter = hsl2filter(90, 100, 49);
                    scale = 0.8;
                } else if (pow <= 20) {
                    filter = hsl2filter(64, 100, 50);
                    scale = 0.8;
                } else {
                    filter = hsl2filter(3, 100, 43);
                    scale = 1;
                }
            }
            items.push(it);

            weatherOptions.iconUrl = imagesHost + '24/' + icon + '.png';
            weather.push(
                L.marker(latlng,
                {
                    type: 'weather',
                    num: i,
                    icon: L.icon(weatherOptions)
                })
            );

            var w = 32 * scale,
                w2 = w / 2;
            windOptions.iconSize = [w, w];
            windOptions.iconAnchor = [w2, w2];

            wind.push(
                L.marker(latlng,
                {
                    type: 'wind',
                    num: i,
                    icon: L.icon(windOptions),
                    //opacity: scale,
                    filter: filter,
                    iconAngle: angle
                })
            );
        }
        dataGlobal = {
            items: items,
            weather: weather,
            wind: wind
        };
        defGlobal.resolve(arr);
    };

    var getData = function (params) {
        if (!params) params = {};
        if ('callback' in params) {callbacks.push(params.callback);}
        if (!dataGlobal) {
            dataGlobal = {};
            L.gmxUtil.requestJSONP(
                params.weatherURL || 'http://maps.kosmosnimki.ru/Weather.ashx',
                {
                    WrapStyle: 'func',
                    country: params.countryCode || 0
                }
            ).then(function(json) {
                parseData(
                    json && json.Status === 'ok' && json.Result ?
                    json.Result :
                    null
                );
            });
        }
    };

    var _old__setPos = L.Marker.prototype._setPos;
    L.Marker.include({
        _updateImg: function(i, a, s) {
            a = L.point(s).divideBy(2)._subtract(L.point(a));
            var opt = this.options,
                transform = '';
            transform += ' translate(' + -a.x + 'px, ' + -a.y + 'px)';
            transform += ' rotate(' + opt.iconAngle + 'deg)';
            transform += ' translate(' + a.x + 'px, ' + a.y + 'px)';
            i.style[L.DomUtil.TRANSFORM] += transform;
            if ('filter' in opt) {
                i.style.filter = opt.filter;
            }
        },

        setIconAngle: function (iconAngle) {
            this.options.iconAngle = iconAngle;
            if (this._map) {
                this.update();
            }
        },

        _setPos: function (pos) {
            if (this._icon) {
                this._icon.style[L.DomUtil.TRANSFORM] = '';
            }
            if (this._shadow) {
                this._shadow.style[L.DomUtil.TRANSFORM] = '';
            }

            _old__setPos.apply(this,[pos]);

            var opt = this.options;
            if (opt.iconAngle) {
                var a = opt.icon.options.iconAnchor,
                    s = opt.icon.options.iconSize,
                    i;
                if (this._icon) {
                    i = this._icon;
                    this._updateImg(i, a, s);
                }
                if (this._shadow) {
                    if (opt.icon.options.shadowAnchor) {
                        a = opt.icon.options.shadowAnchor;
                    }
                    s = opt.icon.options.shadowSize;
                    i = this._shadow;
                    this._updateImg(i, a, s);
                }
            }
        }
    });

L.WindWeatherLayer = L.FeatureGroup.extend({
    options: {
        type: 'weather'
    },

    _addItems: function (arr) {
        var type = this.options.type,
            arr = dataGlobal[type];
        for (var i = 0, len = arr.length; i < len; i++) {
            this.addLayer(arr[i]);
        }
    },

    onAdd: function (map) {
        L.FeatureGroup.prototype.onAdd.call(this, map);
        if (!dataGlobal) {
            getData();
        }
        var _this = this;
        defGlobal.then(function() {
            _this._addItems();
        });
    },

    initialize: function (options) {
        L.setOptions(this, options);
        if ('imagesHost' in this.options) {imagesHost = this.options.imagesHost;}
        if ('weatherURL' in this.options) {weatherURL = this.options.weatherURL;}
        L.FeatureGroup.prototype.initialize.call(this, []);
        this.bindPopup('temp', {maxWidth: options.type === 'weather' ? 370 : 170});
        this.on('popupopen', popupFunc, this)
    }
});
L.windWeatherLayer = function (options) {
    return new L.WindWeatherLayer(options);
};
})();
