/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(1);
	__webpack_require__(3);
	
	var pluginName = 'IceDriftPlugin',
	    menuId = pluginName,
	    toolbarIconId = pluginName,
	    cssTable = pluginName,
	    modulePath = gmxCore.getModulePath(pluginName);
	
	var PluginPanel = __webpack_require__(4);
	
	var publicInterface = {
	    pluginName: pluginName,
	    afterViewer: function afterViewer(params, map) {
	
	        var lmap = nsGmx.leafletMap,
	            iconOpt = {
	            id: 'IceDrift',
	            togglable: true,
	            title: _gtxt(pluginName + '.iconTitle')
	        },
	            icon = L.control.gmxIcon(iconOpt).on('statechange', function (ev) {
	            if (!ev.target.options.isActive) {
	                panel.hide();
	            } else {
	                panel.show(ev.target);
	            }
	        });
	        lmap.addControl(icon);
	        var panel = new PluginPanel(icon);
	
	        var button = document.querySelector('.leaflet-gmx-iconSvg-' + iconOpt.id);
	        button.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" id=\"\u0421\u043B\u043E\u0439_1\" data-name=\"\u0421\u043B\u043E\u0439 1\" viewBox=\"0 0 24 24\">\n            <defs><style>.cls-1{opacity:0.5;}</style></defs><title>iceberg</title>\n            <path d=\"M17.42,13h-12A.46.46,0,0,1,5,12.48l.29-3.93a.48.48,0,0,1,.48-.43H7.23a.47.47,0,0,0,.42-.24l.83-1.54h1L10.17,5a.27.27,0,0,1,.09-.12L11.55,3.7a.49.49,0,0,1,.54-.08L14.5,4.73a.53.53,0,0,1,.22.2l.63,1.17a.47.47,0,0,0,.42.24h.89l1.23,6.09A.46.46,0,0,1,17.42,13ZM7.06,11.07H15a.46.46,0,0,0,.47-.54L15,8.24h-.75l-1-1.88a.45.45,0,0,0-.21-.2l-.85-.39-.35.31L10.67,8.24h-1L8.88,9.77a.48.48,0,0,1-.43.25H7.14Z\"/><g class=\"cls-1\"><path d=\"M5.43,11.16h12a.44.44,0,0,1,.48.44l-.29,3.52a.46.46,0,0,1-.48.38H15.62a.47.47,0,0,0-.42.22l-.83,1.37h-1l-.73,1.2a.28.28,0,0,1-.09.1l-1.28,1.07a.54.54,0,0,1-.55.07l-2.41-1a.42.42,0,0,1-.21-.18l-.63-1a.53.53,0,0,0-.43-.22H6.2L5,11.65A.43.43,0,0,1,5.43,11.16Zm10.36,1.7H7.85a.43.43,0,0,0-.47.49l.47,2H8.6l1,1.68a.4.4,0,0,0,.22.18l.85.36.34-.29,1.16-1.93h1L14,14a.49.49,0,0,1,.42-.22h1.31Z\"/></g><path d=\"M19,13H4a.48.48,0,0,1-.48-.46v-1A.48.48,0,0,1,4,11.07H19a.48.48,0,0,1,.48.46v1A.48.48,0,0,1,19,13Z\"/>\n            </svg>";
	    }
	};
	
	gmxCore.addModule(pluginName, publicInterface, {
	    css: cssTable + '.css'
	});

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 2 */,
/* 3 */
/***/ (function(module, exports) {

	'use strict';
	
	_translationsHash.addtext('rus', {
	    'IceDriftPlugin.iconTitle': 'Расчет дрейфа льда',
	    'IceDriftPlugin.count': 'Рассчитать',
	    'IceDriftPlugin.save': 'Сохранить',
	    'IceDriftPlugin.period': 'Срок прогноза',
	    'IceDriftPlugin.speedPercent': 'Процент от скорсти ветра',
	    'IceDriftPlugin.showSentinel': 'Включите слой Sentinel-1',
	    'IceDriftPlugin.setPeriod': 'Введите срок прогноза и нажмите рассчитать',
	    'IceDriftPlugin.setStart': 'Кликните на снимке на ледовое образование',
	    'IceDriftPlugin.abbrHour': 'ч',
	    'IceDriftPlugin.noWindData': 'Нет данных о ветре. Измените дату.',
	    'IceDriftPlugin.cancel': 'Отменить',
	    'IceDriftPlugin.inavalidValue': 'Недопустимое значение'
	});
	_translationsHash.addtext('eng', {
	    'IceDriftPlugin.iconTitle': 'Ice drift forecast',
	    'IceDriftPlugin.count': 'Count',
	    'IceDriftPlugin.save': 'Save',
	    'IceDriftPlugin.period': 'Period',
	    'IceDriftPlugin.speedPercent': 'Wind speed percent',
	    'IceDriftPlugin.showSentinel': 'Activate Sentinel-1 layer',
	    'IceDriftPlugin.setPeriod': 'Choose period and press count',
	    'IceDriftPlugin.setStart': 'Set marker on ice object',
	    'IceDriftPlugin.abbrHour': 'h',
	    'IceDriftPlugin.noWindData': 'No wind data. Change date.',
	    'IceDriftPlugin.cancel': 'Cancel',
	    'IceDriftPlugin.inavalidValue': 'Invalid value'
	});

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var Utils = __webpack_require__(5);
	module.exports = function (pluginButton) {
	    var _find = function _find(path, parent) {
	        if (!parent) parent = document;
	        return parent.querySelector(path);
	    };
	
	    var _serverBase = serverBase && serverBase.replace(/[^:]+:/, document.location.protocol) || document.location.protocol + '//geomixer.scanex.ru/',
	        _lmap = nsGmx.leafletMap,
	        _gmap = nsGmx.gmxMap,
	        _panel = document.createElement('div');
	    _panel.classList.add('IceDrift');
	    _panel.classList.add('panel');
	    _panel.innerHTML = '<table>\n    <tr><td class="button save disabled unselectable control" unselectable="on">' + _gtxt("IceDriftPlugin.save") + '</td>\n    <td class="button cancel disabled unselectable control" unselectable="on">' + _gtxt("IceDriftPlugin.cancel") + '</td></tr>\n    <tr><td class="control">\n\n    <table border="0" class="speedpercent disabled" style="width: 140px;"><tbody><tr><td class="unselectable" unselectable="on">' + _gtxt("IceDriftPlugin.speedPercent") + '</td><td rowspan="2">\n    <input type="text" placeholder="2" style="width: 40px;margin: 6px;"></td></tr></tbody></table> \n    \n    </td>\n    <td style="width:1px"><div>\n    <table class="spinner disabled" border="0">\n    <tbody><tr><td rowspan="3" style="padding-right: 6px; white-space:nowrap">' + _gtxt("IceDriftPlugin.period") + '</td><td class="button up unselectable" unselectable="on">\n<svg width="8" height="6" viewBox="0 0 8 8" version="1.1" xmlns="http://www.w3.org/2000/svg">\n <polygon points="0 8, 8 8, 4 0"></polygon>   \n</svg></td></tr>\n    <tr><td class="period unselectable" unselectable="on">00 ' + _gtxt("IceDriftPlugin.abbrHour") + '</td></tr>\n    <tr><td class="button down unselectable" unselectable="on"><svg width="8" height="6" viewBox="0 0 8 8" version="1.1" xmlns="http://www.w3.org/2000/svg">\n <polygon points="0 0, 4 8, 8 0"></polygon>   \n</svg></td></tr>\n    </tbody></table>\n    </div></td></tr>\n    <tr><td class="button count disabled unselectable control" unselectable="on">' + _gtxt("IceDriftPlugin.count") + '</td><td></td></tr>\n    <tr><td colspan="2"><div class="message unselectable" unselectable="on"><img src="' + _serverBase + 'api/img/progress.gif"><i>' + _gtxt("IceDriftPlugin.setStart") + '</i></div></td></tr>\n    </table>';
	    document.body.appendChild(_panel);
	    var _saveBut = _find('.save', _panel),
	        _cancelBut = _find('.cancel', _panel),
	        _countBut = _find('.count', _panel),
	        _upBut = _find('.up', _panel),
	        _downBut = _find('.down', _panel),
	        _spinner = _find('.spinner', _panel),
	        _period = _find('.period', _panel),
	        _messsagePan = _find('.message i', _panel),
	        _progress = _find('.message img', _panel),
	        _speedPercent = _find('.speedpercent', _panel),
	        _traceIcon = L.divIcon({
	        html: '<div class="iceDriftMrk" style="width:8px;height:8px;border:solid 1px blue"></div>',
	        iconAnchor: [4, 5]
	    }),
	        _startIcon = L.icon({
	        iconUrl: _serverBase + 'api/img/flag_blau1.png',
	        iconAnchor: [6, 34]
	    }),
	        _trace = [];
	
	    var _marker = void 0;
	    var _isSuccess = function _isSuccess(response) {
	        return response.Status && response.Status.toLowerCase() == 'ok';
	    },
	        _searchLayer = function _searchLayer() {
	        return new Promise(function (resolve, reject) {
	            sendCrossDomainJSONRequest(_serverBase + 'Layer/Search2.ashx?' + 'page=0&pageSize=1&orderby=title desc' + ('&query=([Title] containsIC \'icedrift' + _gmap.properties.MapID + '\')'), function (response) {
	                if (_isSuccess(response)) resolve(response.Result);else reject(response);
	            });
	        });
	    },
	        _createLayer = function _createLayer() {
	        return new Promise(function (resolve, reject) {
	            sendCrossDomainJSONRequest(_serverBase + 'VectorLayer/CreateVectorLayer.ashx?' + 'title=icedrift' + _gmap.options.mapName + ' ' + new Date().getTime() + '&columns=[' + '{"Name":"forecast_id","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"forecast_id\\""},' + '{"Name":"start_date","ColumnSimpleType":"Datetime","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"start_date\\""},' + '{"Name":"end_date","ColumnSimpleType":"Datetime","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"end_date\\""},' + '{"Name":"wind_speed","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"wind_speed\\""},' + '{"Name":"wind_angle","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"wind_angle\\""},' + '{"Name":"percent","ColumnSimpleType":"Float","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"percent\\""},' + '{"Name":"distance","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"distance\\""},' + '{"Name":"type","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"type\\""},' + '{"Name":"comments","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"comments\\""}' + ']&geometrytype=point&TemporalLayer=true&TemporalColumnName=start_date', function (r) {
	                if (_isSuccess(r)) {
	                    //console.log('created')
	                    resolve(r.Result.properties.name);
	                } else reject(r);
	            });
	        }).then(function (layerID) {
	            return new Promise(function (resolve, reject) {
	                sendCrossDomainJSONRequest(_serverBase + ('Layer/UpdateSecurity.ashx?LayerID=' + layerID + '&SecurityInfo={"DefAccess":"editrows","Users":[]}'), function (r) {
	                    if (_isSuccess(r)) {
	                        resolve(layerID);
	                    } else reject(r);
	                });
	            });
	        });
	    },
	
	    // _addPercentColumn = function(lid, resolve, reject, vessels){        
	    //     console.log("add percent column");
	    //             sendCrossDomainJSONRequest(_serverBase + 'VectorLayer/Update.ashx?VectorLayerID=' + lid +
	    //                 '&columns=[{"Name":"mmsi","OldName":"mmsi","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"mmsi\\""},{"Name":"imo","OldName":"imo","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"imo\\""},{"Name":"gmx_id","OldName":"gmx_id","ColumnSimpleType":"Integer","IsPrimary":true,"IsIdentity":true,"IsComputed":false,"expression":"\\"gmx_id\\""},{"Name":"group","OldName":"group","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"group\\""},{"Name":"style","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"style\\""}]',
	    //                 function (response) {
	    //                     if (response.Status.toLowerCase() == "ok")
	    //                         setTimeout(function run() {
	    //                             sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
	    //                                 "AsyncTask.ashx?TaskID=" + response.Result.TaskID, function (response) {
	    //                                     if (response.Status.toLowerCase() == "ok")
	    //                                         if (!response.Result.Completed)
	    //                                             setTimeout(run, 1000);
	    //                                         else {
	    //                                             if(response.Result.ErorInfo)
	    //                                                 reject(response);
	    //                                             else
	    //                                                 resolve(vessels);
	    //                                         }
	    //                                     else 
	    //                                         reject(response);
	    //                                 });
	    //                         }, 1000);
	    //                 });
	    // }, 
	    _layerPromise = _searchLayer().then(function (searchResult) {
	        //console.log(searchResult)
	        if (searchResult.count == 0) return _createLayer();else {
	            //console.log('exists')
	            var existedLayerID = searchResult.layers[0].LayerID;
	            if (!_gmap.layersByID[existedLayerID]) {
	                _lmap.once('layeradd', function (e) {
	                    if (e.layer && e.layer.options.layerID == existedLayerID) setTimeout(function () {
	                        _lmap.removeLayer(_gmap.layersByID[existedLayerID]);
	                        window._mapHelper.updateUnloadEvent(false);
	                    }, 200);
	                });
	                window._layersTree.addLayerToTree(existedLayerID);
	                //window._mapHelper.updateUnloadEvent(false);
	            }
	            return existedLayerID;
	        }
	    });
	
	    var _showProgress = function _showProgress(visible) {
	        if (visible) {
	            _messsagePan.innerHTML = '&nbsp;';
	            _progress.style.display = 'inline';
	        } else _progress.style.display = 'none';
	    },
	        _prepareAll = function _prepareAll() {
	        var controls = [_saveBut, _cancelBut, _countBut, _spinner, _speedPercent];
	        controls.forEach(function (c) {
	            c.classList.remove('disabled');
	            c.classList.add('disabled');
	        });
	        _showProgress(false);
	        _messsagePan.innerHTML = _gtxt("IceDriftPlugin.setStart");
	        _find('input', _speedPercent).disabled = true;
	        _layerPromise.then(function (layerID) {
	            var layer = _gmap.layersByID[layerID];
	            if (layer && !layer._map) {
	                _lmap.addLayer(layer);
	            }
	        });
	    },
	        _saveTrace = function _saveTrace(layerID, trace) {
	        var objects = [];
	        trace.forEach(function (tp, i) {
	            return objects.push({ properties: {
	                    start_date: tp.start_date && tp.start_date.getTime() / 1000,
	                    end_date: tp.end_date && tp.end_date.getTime() / 1000,
	                    wind_speed: tp.wind_speed,
	                    wind_angle: tp.wind_angle,
	                    percent: tp.percent,
	                    distance: tp.distance,
	                    type: i == 0 ? 'start point' : 'forecast point'
	                    //comments:                   
	                },
	                geometry: { type: 'Point', coordinates: [tp.lng, tp.lat] }, action: 'insert' });
	        });
	        //console.log(objects);
	        return new Promise(function (resolve, reject) {
	            sendCrossDomainPostRequest(_serverBase + 'VectorLayer/ModifyVectorObjects.ashx', { WrapStyle: 'message', LayerName: layerID, objects: JSON.stringify(objects), geometry_cs: 'EPSG:4326' }, function (r) {
	                //console.log('response', r);  
	                if (_isSuccess(r)) resolve(r.Result);else reject(r);
	            });
	        }).then(function (r) {
	            //console.log(r);  
	            objects.length = 0;
	            r.forEach(function (id) {
	                objects.push({ id: id, properties: { 'forecast_id': r[0] }, action: 'update' });
	            });
	            return new Promise(function (resolve, reject) {
	                sendCrossDomainPostRequest(_serverBase + 'VectorLayer/ModifyVectorObjects.ashx', { WrapStyle: 'message', LayerName: layerID, objects: JSON.stringify(objects) }, function (r) {
	                    if (_isSuccess(r)) resolve(r.Result);else reject(r);
	                });
	            });
	        });
	    },
	        _onCancel = function _onCancel() {
	        if (_cancelBut.classList.contains('disabled')) return;
	        _cleanTrace();
	        _setReady();
	    },
	        _onSave = function _onSave() {
	        if (_saveBut.classList.contains('disabled')) return;
	
	        // 1.6 Save trace and Set ready again
	        _showProgress(true);
	        _layerPromise.then(function (layerID) {
	            var layer = _gmap.layersByID[layerID];
	            if (layer) {
	                if (!layer._map) _lmap.addLayer(layer);
	                return layerID;
	            } else {
	                return _searchLayer().then(function (searchResult) {
	                    //     const layerID = result.layers[0].LayerID;
	                    //     if (!_gmap.layersByID[layerID]){
	                    //         return new Promise((resolve, reject)=>{
	                    //             sendCrossDomainJSONRequest(`${_serverBase}layer/GetLayerJson.ashx?NeedAttrValues=false&LayerName=${layerID}`, r=>{
	                    //                 if (_isSuccess(r)){
	                    //                     Utils.addLayer(r.Result);
	                    //                     resolve(layerID);
	                    //                 }
	                    //                 else
	                    //                     reject(r);
	                    //             })
	                    //         });
	                    //     }
	                    //     else
	                    //         return layerID;
	                    window._layersTree.addLayerToTree(searchResult.layers[0].LayerID);
	                    window._mapHelper.updateUnloadEvent(false);
	                    return searchResult.layers[0].LayerID;
	                });
	            }
	        }).then(function (layerID) {
	            //console.log(layerID)                
	            return _saveTrace(layerID, _trace).then(function () {
	                return layerID;
	            });
	        }).then(function (layerID) {
	            _cleanTrace();
	            _setReady();
	            L.gmx.layersVersion.chkVersion(_gmap.layersByID[layerID]);
	            _showProgress(false);
	
	            window._mapHelper.updateUnloadEvent(false);
	        }).catch(console.log);
	    },
	        _spin = function _spin(dir) {
	        if (_spinner.classList.contains('disabled')) return;
	
	        var cur = parseInt(_period.innerHTML, 10);
	        if (dir == 'up' && cur < 48) cur += 6;
	        if (dir == 'down' && 0 < cur) cur -= 6;
	        _period.innerHTML = ("0" + cur).slice(-2) + ' ' + _gtxt("IceDriftPlugin.abbrHour");
	
	        // 1.5 Enable Count Button
	        if (cur == 0) _countBut.classList.add('disabled');else _countBut.classList.remove('disabled');
	    },
	        _countRun = function _countRun() {
	        if (_countBut.classList.contains('disabled')) return;
	
	        var speedPercent = _find('input', _speedPercent);
	        speedPercent = parseFloat((speedPercent.value != '' ? speedPercent.value : speedPercent.placeholder).replace(/,/, '.'));
	        if (isNaN(speedPercent) || 100 < speedPercent || speedPercent <= 0) {
	            _messsagePan.innerHTML = _gtxt('IceDriftPlugin.inavalidValue');
	            return;
	        }
	
	        var period = parseInt(_period.innerHTML, 10),
	            latlng = _marker._latlng,
	            nearest = function nearest(test) {
	            var a = [0, 0.25, 0.5, 0.75, 1];
	            var intnum = Math.floor(test),
	                mantissa = test - intnum;
	            var i = (a.length - 1) / 2;
	            if (mantissa == a[i]) return a[i];
	            if (mantissa < a[i]) i /= 2;else i += i / 2;
	            if (mantissa == a[i]) return a[i];
	            if (mantissa < a[i]) return intnum + (mantissa - a[i - 1] <= a[i] - mantissa || a[i - 1] == mantissa ? a[i - 1] : a[i]);else return intnum + (a[i + 1] - mantissa <= mantissa - a[i] || a[i + 1] == mantissa ? a[i + 1] : a[i]);
	        },
	            drawMarker = function drawMarker(tracePoint) {
	            var mrk = L.marker([tracePoint.lat, tracePoint.lng], { icon: _traceIcon }).addTo(_lmap);
	            mrk._icon.style.background = 'none';
	            mrk._icon.style.border = 'none';
	            tracePoint.marker = mrk;
	        },
	            forecastPoint = function forecastPoint(startPoint, distance, azimuth) {
	            // lat2 = asin(sin(lat1)*cos(d/R) + cos(lat1)*sin(d/R)*cos(θ))
	            // lon2 = lon1 + atan2(sin(θ)*sin(d/R)*cos(lat1), cos(d/R)−sin(lat1)*sin(lat2))
	            // asin          = arcsin()   
	            // d             = distance (in any unit)   
	            // R             = Radius of the earth (in the same unit as above)  
	            // and hence d/r = is the angular distance (in radians)  
	            // atan2(a,b)    = arctan(b/a)  
	            // θ is the bearing (in radians, clockwise from north);  
	
	            //latitude of second point = la2 =  asin(sin la1 * cos Ad  + cos la1 * sin Ad * cos θ), and
	            //longitude  of second point = lo2 = lo1 + atan2(sin θ * sin Ad * cos la1 , cos Ad – sin la1 * sin la2)
	
	            var lat2 = Math.asin(Math.sin(Math.PI * startPoint.lat / 180) * Math.cos(distance / 6371000) + Math.cos(Math.PI * startPoint.lat / 180) * Math.sin(distance / 6371000) * Math.cos(Math.PI * azimuth / 180)),
	                atan2 = Math.atan2(Math.sin(Math.PI * azimuth / 180) * Math.sin(distance / 6371000) * Math.cos(Math.PI * startPoint.lat / 180), Math.cos(distance / 6371000) - Math.sin(Math.PI * startPoint.lat / 180) * Math.sin(lat2));
	            return {
	                lat: lat2 / Math.PI * 180,
	                lng: startPoint.lng + atan2 / Math.PI * 180,
	                toString: function toString() {
	                    return 'LatLng(' + this.lat + ', ' + this.lng + ')';
	                }
	            };
	        },
	            getForecast = function getForecast(_ref) {
	            var point = _ref.point,
	                moment = _ref.moment,
	                distance = _ref.distance;
	
	            var tracePoint = { start_date: moment, lat: point.lat, lng: point.lng };
	            if (distance) tracePoint.distance = distance;
	            return new Promise(function (resolve, reject) {
	                var momentBase = new Date(Date.UTC(moment.getFullYear(), moment.getMonth(), moment.getDate(), 0, 0, 0));
	                while (moment.getTime() >= momentBase.getTime() + 21600000) {
	                    momentBase = new Date(momentBase.getTime() + 21600000);
	                }
	                var qs = ('0' + momentBase.getUTCDate()).slice(-2) + '.' + ('0' + (momentBase.getUTCMonth() + 1)).slice(-2) + '.' + momentBase.getUTCFullYear() + ' ' + ('0' + momentBase.getUTCHours()).slice(-2) + ':00:00';
	                //console.log(qs);
	                sendCrossDomainJSONRequest(_serverBase + 'VectorLayer/Search.ashx?' + 'columns=[{"Value":"[Lat]"},{"Value":"[Lon]"},{"Value":"[Speed]"},{"Value":"[Angle]"},{"Value":"[DateTime]"},{"Value":"[BeaufortScale]"}]&' + ('layer=7CB878E2BE274837B291E592B2530C39&query="Lat"=' + nearest(point.lat) + ' and "Lon"=' + nearest(point.lng) + ' and "DateTime"=\'' + qs + '\''), function (response) {
	                    if (response.Status && response.Status.toLowerCase() == 'ok') {
	                        if (response.Result.values.length == 0) {
	                            reject();
	                            _showProgress(false);
	                            _messsagePan.innerHTML = _gtxt("IceDriftPlugin.noWindData");
	                            setTimeout(function () {
	                                _setReady();
	                            }, 1500);
	                            return;
	                        }
	                        var fields = {};
	                        response.Result.fields.forEach(function (f, i) {
	                            fields[f] = i;
	                        });
	                        var nextMoment = new Date(momentBase.getTime() + 21600000),
	                            interval = (nextMoment.getTime() - moment.getTime()) / 1000;
	
	                        tracePoint.wind_speed = response.Result.values[0][fields.Speed];
	                        tracePoint.wind_angle = response.Result.values[0][fields.Angle];
	                        tracePoint.percent = speedPercent;
	                        tracePoint.end_date = nextMoment;
	                        _trace.push(tracePoint);
	
	                        //console.log(`${point} speed=${tracePoint.wind_speed} azimuth=${tracePoint.wind_angle} interval=${interval} d=${0.02*tracePoint.wind_speed*interval}`); 
	                        var _distance = speedPercent / 100 * tracePoint.wind_speed * interval,
	                            pointNext = forecastPoint(point, _distance, tracePoint.wind_angle + 180);
	                        resolve({ point: pointNext, moment: nextMoment, distance: _distance });
	                    } else reject(response);
	                });
	            });
	        },
	            tasksChain = [];
	
	        for (var i = period - 6; i > 0; i -= 6) {
	            tasksChain.push(getForecast);
	        }
	        tasksChain.reduce(function (p, f) {
	            return p.then(f);
	        }, getForecast({ point: latlng, moment: _marker.acqdatetime })).then(function (_ref2) {
	            var point = _ref2.point,
	                moment = _ref2.moment,
	                distance = _ref2.distance;
	
	            _trace.push({ start_date: moment, lat: point.lat, lng: point.lng, distance: distance });
	            _trace.forEach(drawMarker);
	
	            _showProgress(false);
	            _messsagePan.innerHTML = '&nbsp;';
	            _saveBut.classList.remove('disabled');
	            _cancelBut.classList.remove('disabled');
	        }).catch(console.log);
	
	        _cleanStartMarker();
	        _period.innerHTML = '00 ' + _gtxt("IceDriftPlugin.abbrHour");
	        _spinner.classList.add('disabled');
	        _speedPercent.classList.add('disabled');
	        _find('input', _speedPercent).disabled = true;
	        _countBut.classList.add('disabled');
	        _showProgress(true);
	    };
	
	    _saveBut.addEventListener('click', _onSave);
	    _cancelBut.addEventListener('click', _onCancel);
	    _upBut.addEventListener('click', function () {
	        return _spin('up');
	    });
	    _downBut.addEventListener('click', function () {
	        return _spin('down');
	    });
	    _countBut.addEventListener('click', _countRun);
	    _lmap.on('layerremove', function (e) {
	        for (var i = 0; i < _sentinelLayers.length; ++i) {
	            if (_sentinelLayers[i].options.layerID == e.layer.options.layerID) {
	                pluginButton.setActive(false);
	                _returnInstance.hide();
	                return;
	            }
	        }
	    });
	
	    var _msgBox = void 0;
	    var _sentinelLayers = [],
	        _onSentinelLayerClick = function _onSentinelLayerClick(e) {
	
	        // 1.4 Set Start Point and enable Spinner
	        _marker = L.marker(e.latlng, { icon: _startIcon });
	        _marker.acqdatetime = new Date(e.gmx.properties.acqdatetime * 1000);
	        _marker.addTo(_lmap);
	
	        _spinner.classList.remove('disabled');
	        _messsagePan.innerHTML = _gtxt('IceDriftPlugin.setPeriod');
	
	        _speedPercent.classList.remove('disabled');
	        _find('input', _speedPercent).disabled = false;
	    },
	        _init = function _init(ctrl) {
	        _sentinelLayers.length = 0;
	        var l = _gmap.layersByID['AF64ECA6B32F437CB6AC72B5E6F85B97'];
	        if (l._map) _sentinelLayers.push(l);
	        if (!_sentinelLayers.length) {
	            ctrl.setActive(false);
	            var content = document.createElement("div");
	            content.innerHTML = '<div style="padding-left:20px">' + _gtxt('IceDriftPlugin.showSentinel') + '</div>';
	            if (!_msgBox) _msgBox = showDialog(_gtxt('IceDriftPlugin.iconTitle'), content, 200, 80, 0, 0, null, function () {
	                _msgBox = null;
	            });
	            return false;
	        } else {
	            return true;
	        }
	    },
	
	    //  _mouseoverHandlers = {}, _mousemoveHandlers = {}, _clickHandlers = {},
	    _setCrossCursor = function _setCrossCursor() {
	        //             _gmap.layers.forEach(l=>{
	        //                             if (l._events && l._events.mouseover && l._events.mouseover.length){
	        //                                 _mouseoverHandlers[l._gmx.layerID] = l._events.mouseover.map(h=>h);
	        //                                 l._events.mouseover.length = 0;
	        //                             }
	        //                             if (l._events && l._events.mousemove && l._events.mousemove.length){
	        //                                 _mousemoveHandlers[l._gmx.layerID] = l._events.mousemove.map(h=>h);
	        //                                 l._events.mousemove.length = 0;
	        //                             }
	        //                             if (l._events && l._events.click && l._events.click.length){
	        //                                 _clickHandlers[l._gmx.layerID] = l._events.click.map(h=>h);
	        //                                 l._events.click.length = 0;
	        //                             }
	        //             });
	        // console.log('_setCrossCursor')
	        //             _lmap.getContainer().style.cursor = 'crosshair';
	        _sentinelLayers.forEach(function (l) {
	            return l.disablePopup();
	        });
	    },
	        _unsetCrossCursor = function _unsetCrossCursor() {
	        // _gmap.layers.forEach(l=>{
	        //     if (l._gmx && _mouseoverHandlers[l._gmx.layerID]){
	        //         l._events.mouseover = _mouseoverHandlers[l._gmx.layerID].map(h=>h);
	        //         l._events.mousemove = _mousemoveHandlers[l._gmx.layerID].map(h=>h);
	        //         l._events.click = _clickHandlers[l._gmx.layerID].map(h=>h);
	        //     }
	        // });                      
	        // _lmap.getContainer().style.cursor = '';         
	        _sentinelLayers.forEach(function (l) {
	            return l.enablePopup();
	        });
	    },
	        _setReady = function _setReady() {
	        _prepareAll();
	
	        // 1.3 Bind Insert Start Point observer   
	        _setCrossCursor();
	        _sentinelLayers.forEach(function (l) {
	            l.once('click', _onSentinelLayerClick);
	            //l.unbindPopup();
	        });
	    },
	        _cleanTrace = function _cleanTrace() {
	        _trace.forEach(function (tp) {
	            return _lmap.removeLayer(tp.marker);
	        });
	        _trace.length = 0;
	    },
	        _cleanStartMarker = function _cleanStartMarker() {
	        if (_marker) {
	            _lmap.removeLayer(_marker);
	            _marker = null;
	        }
	    };
	
	    var _returnInstance = {
	        show: function show(ctrl) {
	            // 1.1 Check Sentinel Layers
	            if (_init(ctrl)) {
	
	                // 1.2 Show Form
	                var rc = ctrl._container.getBoundingClientRect(),
	                    shift = parseInt(getComputedStyle(_find('table', _panel)).borderSpacing);
	                _panel.style.top = rc.bottom + 'px';
	                _panel.style.left = rc.left - shift + 'px';
	
	                _setReady();
	            }
	        },
	        hide: function hide() {
	            // 2.1 HideForm
	            _panel.style.top = '-1000px';
	            _panel.style.left = '-1000px';
	
	            // 2.2 Cleean Map
	            _cleanTrace();
	            _cleanStartMarker();
	            _layerPromise.then(function (layerID) {
	                var layer = _gmap.layersByID[layerID];
	                if (layer && layer._map) _lmap.removeLayer(layer);
	            });
	
	            // 2.3 Unbind Layers observers
	            _sentinelLayers.forEach(function (l) {
	                //l.bindPopup();
	                l.off('click', _onSentinelLayerClick);
	            });
	            _unsetCrossCursor();
	        }
	    };
	    return _returnInstance;
	};

/***/ }),
/* 5 */
/***/ (function(module, exports) {

	"use strict";
	
	module.exports = {};

/***/ })
/******/ ]);
//# sourceMappingURL=IceDriftPlugin.js.map