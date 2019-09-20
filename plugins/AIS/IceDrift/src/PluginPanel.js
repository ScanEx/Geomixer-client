
const Utils = require('./Utils.js');
module.exports = function (pluginButton) {
    const _find = function(path, parent){
        if(!parent)
            parent = document;
        return parent.querySelector(path);
    }; 

    const _serverBase = (serverBase && serverBase.replace(/[^:]+:/, document.location.protocol)) || (document.location.protocol + '//geomixer.scanex.ru/'),
    _lmap = nsGmx.leafletMap,
    _gmap = nsGmx.gmxMap,
    _panel = document.createElement('div');
    _panel.classList.add('IceDrift');
    _panel.classList.add('panel');
    _panel.innerHTML = `<table>
    <tr><td class="button save disabled unselectable control" unselectable="on">${_gtxt("IceDriftPlugin.save")}</td>
    <td class="button cancel disabled unselectable control" unselectable="on">${_gtxt("IceDriftPlugin.cancel")}</td></tr>
    <tr><td class="control">

    <table border="0" class="speedpercent disabled" style="width: 140px;"><tbody><tr><td class="unselectable" unselectable="on">${_gtxt("IceDriftPlugin.speedPercent")}</td><td rowspan="2">
    <input type="text" placeholder="2" style="width: 40px;margin: 6px;"></td></tr></tbody></table> 
    
    </td>
    <td style="width:1px"><div>
    <table class="spinner disabled" border="0">
    <tbody><tr><td rowspan="3" style="padding-right: 6px; white-space:nowrap">${_gtxt("IceDriftPlugin.period")}</td><td class="button up unselectable" unselectable="on">
<svg width="8" height="6" viewBox="0 0 8 8" version="1.1" xmlns="http://www.w3.org/2000/svg">
 <polygon points="0 8, 8 8, 4 0"></polygon>   
</svg></td></tr>
    <tr><td class="period unselectable" unselectable="on">00 ${_gtxt("IceDriftPlugin.abbrHour")}</td></tr>
    <tr><td class="button down unselectable" unselectable="on"><svg width="8" height="6" viewBox="0 0 8 8" version="1.1" xmlns="http://www.w3.org/2000/svg">
 <polygon points="0 0, 4 8, 8 0"></polygon>   
</svg></td></tr>
    </tbody></table>
    </div></td></tr>
    <tr><td class="button count disabled unselectable control" unselectable="on">${_gtxt("IceDriftPlugin.count")}</td><td></td></tr>
    <tr><td colspan="2"><div class="message unselectable" unselectable="on"><img src="${_serverBase}api/img/progress.gif"><i>${_gtxt("IceDriftPlugin.setStart")}</i></div></td></tr>
    </table>`;
    document.body.appendChild(_panel);
    const _saveBut = _find('.save', _panel),
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
    
    let _marker;
    const _isSuccess = function(response){
        return response.Status && response.Status.toLowerCase()=='ok';
    },
    _searchLayer = function(){
        return new Promise((resolve, reject)=>{
            sendCrossDomainJSONRequest(`${_serverBase}Layer/Search2.ashx?` +
            `page=0&pageSize=1&orderby=title desc`+
            `&query=([Title] containsIC 'icedrift${_gmap.properties.MapID}')`, response=>{
                if (_isSuccess(response))
                    resolve(response.Result);
                else
                    reject(response);
            })
        })
    },
    _createLayer = function(){        
        return new Promise((resolve, reject)=>{
            sendCrossDomainJSONRequest(_serverBase + 'VectorLayer/CreateVectorLayer.ashx?' + 
            'title=icedrift' + _gmap.options.mapName + ' ' + (new Date()).getTime() + '&columns=[' + 
            '{"Name":"forecast_id","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"forecast_id\\""},' + 
            '{"Name":"start_date","ColumnSimpleType":"Datetime","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"start_date\\""},' + 
            '{"Name":"end_date","ColumnSimpleType":"Datetime","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"end_date\\""},' + 
            '{"Name":"wind_speed","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"wind_speed\\""},' + 
            '{"Name":"wind_angle","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"wind_angle\\""},' + 
            '{"Name":"percent","ColumnSimpleType":"Float","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"percent\\""},' + 
            '{"Name":"distance","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"distance\\""},' + 
            '{"Name":"type","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"type\\""},' + 
            '{"Name":"comments","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"comments\\""}' + 
            ']&geometrytype=point&TemporalLayer=true&TemporalColumnName=start_date', 
            r=>{
                if (_isSuccess(r)){
//console.log('created')
                    resolve(r.Result.properties.name);
                }
                else
                    reject(r);
            });
        })
        .then(layerID=>{   
            return new Promise((resolve, reject)=>{
                sendCrossDomainJSONRequest(_serverBase + `Layer/UpdateSecurity.ashx?LayerID=${layerID}&SecurityInfo={"DefAccess":"editrows","Users":[]}`,
                    r => {
                        if (_isSuccess(r)) {
                            resolve(layerID);
                        }
                        else
                            reject(r);
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
    _layerPromise = _searchLayer()
    .then(searchResult=>{
//console.log(searchResult)
        if (searchResult.count==0)
            return _createLayer();
        else{
//console.log('exists')
            const existedLayerID = searchResult.layers[0].LayerID;
            if (!_gmap.layersByID[existedLayerID]){
                _lmap.once('layeradd', e=>{
                    if (e.layer && e.layer.options.layerID==existedLayerID)   
                        setTimeout(()=>{
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

    const _showProgress = function(visible){
        if (visible){
            _messsagePan.innerHTML = '&nbsp;';
            _progress.style.display = 'inline';
        }
        else
            _progress.style.display = 'none';
    },
    _prepareAll = function(){
        const controls = [_saveBut, _cancelBut, _countBut, _spinner, _speedPercent];
        controls.forEach(c=>{
            c.classList.remove('disabled'); 
            c.classList.add('disabled');
        });
        _showProgress(false);
        _messsagePan.innerHTML = _gtxt("IceDriftPlugin.setStart");
        _find('input', _speedPercent).disabled = true;
        _layerPromise
        .then(layerID=>{
            const layer = _gmap.layersByID[layerID];
            if (layer && !layer._map){
                _lmap.addLayer(layer);
            }
        });
    },  
    _saveTrace = function(layerID, trace){                
        const objects = [];
        trace.forEach((tp, i)=>objects.push({properties:{
                start_date: tp.start_date && tp.start_date.getTime()/1000,
                end_date: tp.end_date && tp.end_date.getTime()/1000,
                wind_speed: tp.wind_speed,
                wind_angle: tp.wind_angle,
                percent: tp.percent,
                distance: tp.distance,
                type: i==0?'start point':'forecast point',
                //comments:                   
            }, 
            geometry:{type:'Point', coordinates :[tp.lng, tp.lat]}, action:'insert'}));
//console.log(objects);
        return new Promise((resolve, reject)=>{
            sendCrossDomainPostRequest(`${_serverBase}VectorLayer/ModifyVectorObjects.ashx`, 
            {WrapStyle: 'message', LayerName: layerID, objects: JSON.stringify(objects), geometry_cs: 'EPSG:4326'}, r=>{
//console.log('response', r);  
                if (_isSuccess(r))
                    resolve(r.Result);
                else
                    reject(r);
            });
        })
        .then(r=>{
//console.log(r);  
            objects.length = 0;
            r.forEach(id=>{
                objects.push({id:id, properties:{'forecast_id': r[0]}, action:'update'})
            })
            return new Promise((resolve, reject)=>{         
                sendCrossDomainPostRequest(`${_serverBase}VectorLayer/ModifyVectorObjects.ashx`,
                {WrapStyle: 'message', LayerName: layerID, objects: JSON.stringify(objects)}, r=>{
                    if (_isSuccess(r))
                        resolve(r.Result);
                    else
                        reject(r);
                });
            });
        });
    },
    _onCancel = function(){
        if (_cancelBut.classList.contains('disabled'))
            return;
        _cleanTrace();
        _setReady();
    },
    _onSave = function(){
        if (_saveBut.classList.contains('disabled'))
            return;

        // 1.6 Save trace and Set ready again
        _showProgress(true);
        _layerPromise
        .then(layerID=>{
            const layer = _gmap.layersByID[layerID];
            if (layer){
                if (!layer._map)
                    _lmap.addLayer(layer);
                return layerID;
            }
            else{
                return _searchLayer()
                .then(searchResult=>{
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
        })
        .then(layerID=>{
//console.log(layerID)                
            return _saveTrace(layerID, _trace).then(()=>layerID);
        })
        .then(layerID=>{
            _cleanTrace();
            _setReady();
            L.gmx.layersVersion.chkVersion(_gmap.layersByID[layerID]);
            _showProgress(false);
            
            window._mapHelper.updateUnloadEvent(false);
        })
        .catch(console.log);
    },
    _spin = function(dir){
        if (_spinner.classList.contains('disabled'))
            return;

        let cur = parseInt(_period.innerHTML, 10);
        if (dir == 'up' && cur < 48)
            cur += 6;
        if (dir == 'down' && 0 < cur)
            cur -= 6;
        _period.innerHTML = `${("0" + cur).slice(-2)} ${_gtxt("IceDriftPlugin.abbrHour")}`;

        // 1.5 Enable Count Button
        if (cur==0)        
            _countBut.classList.add('disabled');
        else
            _countBut.classList.remove('disabled');
    },
    _countRun = function(){
        if (_countBut.classList.contains('disabled'))
            return;

        let speedPercent = _find('input', _speedPercent);
        speedPercent = parseFloat((speedPercent.value!=''?speedPercent.value:speedPercent.placeholder).replace(/,/, '.'));
        if (isNaN(speedPercent) || 100<speedPercent || speedPercent<=0){
            _messsagePan.innerHTML = _gtxt('IceDriftPlugin.inavalidValue');
            return;
        }

        const period = parseInt(_period.innerHTML, 10),
        latlng = _marker._latlng,
        nearest = function(test){
            const a = [0, 0.25, 0.5, 0.75, 1];
            const intnum = Math.floor(test),
            mantissa = test-intnum;
            let i = (a.length-1)/2;
            if (mantissa==a[i]) return a[i];
            if (mantissa<a[i])
                i/=2;
            else
                i+=i/2;
            if (mantissa == a[i]) return a[i];
            if (mantissa<a[i])
                return intnum+(mantissa-a[i-1]<=a[i]-mantissa || a[i-1]==mantissa ? a[i-1] : a[i]);
            else 
                return intnum+(a[i+1]-mantissa<=mantissa-a[i] || a[i+1]==mantissa ? a[i+1] : a[i]);
        },
        drawMarker = function(tracePoint){
            const mrk = L.marker([tracePoint.lat, tracePoint.lng], {icon: _traceIcon}).addTo(_lmap);
            mrk._icon.style.background = 'none';
            mrk._icon.style.border = 'none';
            tracePoint.marker = mrk;
        },
        forecastPoint = function(startPoint, distance, azimuth){ 
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

            const lat2 = Math.asin(Math.sin(Math.PI*startPoint.lat/180) * Math.cos(distance/6371000)  + Math.cos (Math.PI*startPoint.lat/180) * Math.sin(distance/6371000) * Math.cos(Math.PI*azimuth/180)),
            atan2 = Math.atan2(Math.sin(Math.PI*azimuth/180) * Math.sin(distance/6371000) * Math.cos(Math.PI*startPoint.lat/180), 
                               Math.cos(distance/6371000) - Math.sin(Math.PI*startPoint.lat/180) * Math.sin(lat2))
            return {
                lat:  lat2/Math.PI*180, 
                lng: startPoint.lng + atan2/Math.PI*180,
                toString: function(){return `LatLng(${this.lat}, ${this.lng})`}
            }
        },
        getForecast = function ({point, moment, distance}) {
            const tracePoint = {start_date: moment, lat: point.lat, lng: point.lng};
            if (distance)
                tracePoint.distance = distance;
            return new Promise((resolve, reject) => {
                let  momentBase = new Date(Date.UTC(moment.getFullYear(), moment.getMonth(), moment.getDate(), 0, 0, 0));
                while (moment.getTime()>=(momentBase.getTime() + 21600000)){
                    momentBase = new Date(momentBase.getTime() + 21600000);
                }
                const qs = `${('0'+momentBase.getUTCDate()).slice(-2)}.${('0'+(momentBase.getUTCMonth()+1)).slice(-2)}.${momentBase.getUTCFullYear()} ${('0'+momentBase.getUTCHours()).slice(-2)}:00:00`;
//console.log(qs);
                sendCrossDomainJSONRequest(_serverBase + `VectorLayer/Search.ashx?` +
                    `columns=[{"Value":"[Lat]"},{"Value":"[Lon]"},{"Value":"[Speed]"},{"Value":"[Angle]"},{"Value":"[DateTime]"},{"Value":"[BeaufortScale]"}]&` +
                    `layer=7CB878E2BE274837B291E592B2530C39&query="Lat"=${nearest(point.lat)} and "Lon"=${nearest(point.lng)} and "DateTime"='${qs}'`
                    , response => {
                        if (response.Status && response.Status.toLowerCase() == 'ok') {
                            if (response.Result.values.length==0){
                                reject();
                                _showProgress(false);
                                _messsagePan.innerHTML = _gtxt("IceDriftPlugin.noWindData");
                                setTimeout(()=>{
                                    _setReady();
                                }, 1500);
                                return;
                            }
                            const fields = {};
                            response.Result.fields.forEach((f,i)=>{fields[f]=i});
                            const nextMoment = new Date(momentBase.getTime() + 21600000),
                            interval = (nextMoment.getTime()-moment.getTime())/1000;
                            
                            tracePoint.wind_speed = response.Result.values[0][fields.Speed];
                            tracePoint.wind_angle = response.Result.values[0][fields.Angle];
                            tracePoint.percent = speedPercent;
                            tracePoint.end_date = nextMoment;
                            _trace.push(tracePoint);

//console.log(`${point} speed=${tracePoint.wind_speed} azimuth=${tracePoint.wind_angle} interval=${interval} d=${0.02*tracePoint.wind_speed*interval}`); 
                            const distance = (speedPercent/100) * tracePoint.wind_speed * interval, 
                            pointNext = forecastPoint(point, distance, tracePoint.wind_angle + 180);
                            resolve({point: pointNext, moment: nextMoment, distance: distance});
                        }
                        else
                            reject(response);
                    }
                );
            });
        },
        tasksChain = [];

        for (let i=period-6; i>0; i-=6){
            tasksChain.push(getForecast);
        }
        tasksChain.reduce((p, f) => p.then(f), getForecast({point: latlng, moment: _marker.acqdatetime}))
        .then(({point, moment, distance})=>{
            _trace.push({start_date: moment, lat: point.lat, lng: point.lng, distance: distance});
            _trace.forEach(drawMarker);

            _showProgress(false);
            _messsagePan.innerHTML = '&nbsp;';
            _saveBut.classList.remove('disabled');
            _cancelBut.classList.remove('disabled');
        })
        .catch(console.log);      
        
        _cleanStartMarker();        
        _period.innerHTML = `00 ${_gtxt("IceDriftPlugin.abbrHour")}`;
        _spinner.classList.add('disabled');
        _speedPercent.classList.add('disabled');
        _find('input', _speedPercent).disabled = true;
        _countBut.classList.add('disabled');
        _showProgress(true);
    };

    _saveBut.addEventListener('click', _onSave);
    _cancelBut.addEventListener('click', _onCancel);
    _upBut.addEventListener('click', ()=>_spin('up'));
    _downBut.addEventListener('click', ()=>_spin('down'));
    _countBut.addEventListener('click', _countRun);    
    _lmap.on('layerremove', e=>{
        for (let i=0; i<_sentinelLayers.length; ++i){
            if (_sentinelLayers[i].options.layerID==e.layer.options.layerID){
                pluginButton.setActive(false);
                _returnInstance.hide();
                return;
            }
        }
    })

    let _msgBox;
    const _sentinelLayers = [],
    _onSentinelLayerClick = function(e){

        // 1.4 Set Start Point and enable Spinner
        _marker = L.marker(e.latlng, { icon: _startIcon });
        _marker.acqdatetime = new Date(e.gmx.properties.acqdatetime*1000);
        _marker.addTo(_lmap);

        _spinner.classList.remove('disabled');
        _messsagePan.innerHTML = _gtxt('IceDriftPlugin.setPeriod');
        
        _speedPercent.classList.remove('disabled');
        _find('input', _speedPercent).disabled = false;
    },
    _init = function(ctrl){
        _sentinelLayers.length = 0;
        const l = _gmap.layersByID['AF64ECA6B32F437CB6AC72B5E6F85B97'];
        if (l._map)
            _sentinelLayers.push(l);                
        if (!_sentinelLayers.length){
            ctrl.setActive(false);
            let content = document.createElement("div");
            content.innerHTML = '<div style="padding-left:20px">' + _gtxt('IceDriftPlugin.showSentinel') + '</div>';
            if (!_msgBox)
                _msgBox = showDialog(_gtxt('IceDriftPlugin.iconTitle'), content, 200, 80, 0,0, null, ()=>{_msgBox=null});
            return false;
        }
        else{
            return true;
        }
    },
//  _mouseoverHandlers = {}, _mousemoveHandlers = {}, _clickHandlers = {},
    _setCrossCursor =  function(){                       
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
        _sentinelLayers.forEach(l=>l.disablePopup());
    },
    _unsetCrossCursor =  function(){ 
        // _gmap.layers.forEach(l=>{
        //     if (l._gmx && _mouseoverHandlers[l._gmx.layerID]){
        //         l._events.mouseover = _mouseoverHandlers[l._gmx.layerID].map(h=>h);
        //         l._events.mousemove = _mousemoveHandlers[l._gmx.layerID].map(h=>h);
        //         l._events.click = _clickHandlers[l._gmx.layerID].map(h=>h);
        //     }
        // });                      
        // _lmap.getContainer().style.cursor = '';         
        _sentinelLayers.forEach(l=>l.enablePopup());
    },
    _setReady = function(){
        _prepareAll();                
        
        // 1.3 Bind Insert Start Point observer   
        _setCrossCursor();         
        _sentinelLayers.forEach(l=>{
            l.once('click', _onSentinelLayerClick);
            //l.unbindPopup();
        });
    },
    _cleanTrace = function(){
        _trace.forEach(tp=>_lmap.removeLayer(tp.marker));
        _trace.length = 0;
    },
    _cleanStartMarker = function(){
        if (_marker) {
            _lmap.removeLayer(_marker);
            _marker = null;
        }        
    };

    const _returnInstance = {
        show: function (ctrl) {
            // 1.1 Check Sentinel Layers
            if (_init(ctrl)){  

                // 1.2 Show Form
                const rc = ctrl._container.getBoundingClientRect(),
                    shift = parseInt(getComputedStyle(_find('table', _panel)).borderSpacing);
                _panel.style.top = rc.bottom + 'px';
                _panel.style.left = rc.left - shift + 'px';
                
                _setReady();
            }

        },
        hide: function(){ 
            // 2.1 HideForm
            _panel.style.top = '-1000px';
            _panel.style.left = '-1000px';

            // 2.2 Cleean Map
            _cleanTrace();
            _cleanStartMarker();        
            _layerPromise
            .then(layerID=>{
                const layer = _gmap.layersByID[layerID]
                if (layer && layer._map)
                    _lmap.removeLayer(layer);
            });

            // 2.3 Unbind Layers observers
            _sentinelLayers.forEach(l => {
                //l.bindPopup();
                l.off('click', _onSentinelLayerClick);
            });
            _unsetCrossCursor();
        }
    };
    return _returnInstance;
}

