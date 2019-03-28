module.exports = function (aisLayerSearcher) {
    let _actualUpdate,
        _round = function (d, p) {
            let isNeg = d < 0,
                power = Math.pow(10, p)
            return d ? ((isNeg ? -1 : 1) * (Math.round((isNeg ? d = -d : d) * power) / power)) : d
        },
        _addUnit = function (v, u) {
            return v != null && v != "" ? v + u : "";
        },
        _toDd = function (D, lng) {
            let dir = D < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
                deg = Math.round((D < 0 ? D = -D : D) * 1000000) / 1000000
            return deg.toFixed(2) + " "//"°"
                + dir
        },
        _formatPosition = function (vessel) {
            vessel.cog_sog = vessel.cog && vessel.sog
            vessel.heading_rot = vessel.heading && vessel.rot
            vessel.x_y = vessel.longitude && vessel.latitude
            let d = new Date(vessel.ts_pos_utc * 1000)
            let eta = new Date(vessel.ts_eta * 1000)
            vessel.tm_pos_utc = _formatTime(d);
            vessel.tm_pos_loc = _formatTime(d, true);
            vessel.dt_pos_utc = _formatDate(d);
            vessel.dt_pos_loc = _formatDate(d, true);
            vessel.eta_utc = aisLayerSearcher.formatDateTime(eta);
            vessel.eta_loc = aisLayerSearcher.formatDateTime(eta, true);
            vessel.icon_rot = Math.round(vessel.cog/15)*15;
            vessel.cog = _addUnit(_round(vessel.cog, 5), "°");
            vessel.rot = _addUnit(_round(vessel.rot, 5), "°/мин");
            vessel.heading = _addUnit(_round(vessel.heading, 5), "°");
            vessel.draught = _addUnit(_round(vessel.draught, 5), " м");
            //vessel.length = _addUnit(vessel.length, " м");
            //vessel.width = _addUnit(vessel.width, " м");
            //vessel.source = 'plugins/AIS/AISSearch/svg/satellite-ais.svg'//vessel.source=='T-AIS'?_gtxt('AISSearch2.tais'):_gtxt('AISSearch2.sais');
            vessel.source_orig = vessel.source;
            vessel.source = vessel.source=='T-AIS'?'plugins/AIS/AISSearch/svg/waterside-radar.svg':'plugins/AIS/AISSearch/svg/satellite-ais.svg';
	            
            vessel.xmin = vessel.longitude;
            vessel.xmax = vessel.longitude;           
            vessel.ymin = vessel.latitude;
            vessel.ymax = vessel.latitude; 

            vessel.longitude = _toDd(vessel.longitude, true);
            vessel.latitude = _toDd(vessel.latitude);
            aisLayerSearcher.placeVesselTypeIcon(vessel);
            vessel.sog = _addUnit(_round(vessel.sog, 5), " уз");

            return vessel;
        },
        _formatTime = function (d, local) {
            var temp = new Date(d)
            if (!local)
                temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset())
            return temp.toLocaleTimeString();
        },
        _formatDate = function (d, local) {
            var temp = new Date(d)
            if (!local)
                temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset())
            return temp.toLocaleDateString();
        }
    return {
        searcher: aisLayerSearcher,
        filterString: "",
        isDirty: false,
        load: function (actualUpdate) {
            if (!this.isDirty)
                return Promise.resolve();
            //return new Promise((resolve)=>setTimeout(resolve, 1000))
            //console.log('LOAD ' + _historyInterval['dateBegin'].toUTCString() + ' ' + _historyInterval['dateEnd'].toUTCString())     
            var _this = this;
            return new Promise((resolve) => {
                aisLayerSearcher.searchPositionsAgg([_this.vessel.mmsi], _this.historyInterval, function (response) {
                    if (parseResponse(response)) {
                        let position, positions = [],
                            fields = response.Result.fields,
                            groups = response.Result.values.reduce((p, c) => {
                                let obj = {}, d;
                                for (var j = 0; j < fields.length; ++j) {
                                    obj[fields[j]] = c[j];
                                    if (fields[j] == 'ts_pos_utc'){
                                        let dt = c[j], t = dt - dt % (24 * 3600);
                                        d = new Date(t * 1000);
                                        obj['ts_pos_org'] = c[j];
                                    }
                                }
                                if (p[d]) {
                                    p[d].positions.push(_formatPosition(obj));
                                    p[d].count = p[d].count + 1;
                                }
                                else
                                    p[d] = { ts_pos_utc: _formatDate(d), positions: [_formatPosition(obj)], count: 1 };
                                return p;
                            }, {});
                        let counter = 0;
                        for (var k in groups) {
                            groups[k]["n"] = counter++;
                            positions.push(groups[k]);
                        }
                        resolve({ Status: "ok", Result: { values: positions, total: response.Result.values.length } });
                    }
                    else
                        resolve(response)
                })
            })
                .then(function (response) {
                    //console.log(response)       
                    _this.isDirty = false;
                    if (response.Status.toLowerCase() == "ok") {
                        _this.data = { vessels: response.Result.values, total: response.Result.total }
                        return Promise.resolve();
                    }
                    else {
                        return Promise.reject(response);
                    }
                });
        },
        update: function () {
            if (!this.vessel || !this.isDirty)
                return;

            _actualUpdate = new Date().getTime();
            let _this = this,
                actualUpdate = _actualUpdate;
            this.view.inProgress(true);
            //this.filterString&&console.log(this.filterString+" "+this.filterString.search(/\r$/))
            //this.filterString&&console.log(this.filterString.replace(/^\s+/, "").replace(/\s+\r*$/, "")!="")            

            this.load(actualUpdate).then(function () {
                //console.log("LOADED "+(new Date().getTime()-_this._actualUpdate)+"ms")
                //console.log("3>"+new Date(_this._actualUpdate))
                //console.log("4>"+new Date(actualUpdate))
                if (_actualUpdate == actualUpdate) {
//_this.data.vessels && (_this.data.vessels.length>0) && console.log(_this.data.vessels[0].positions[0])                    
                    _this.view.inProgress(false);
                    _this.view.repaint();
                }
            }, function (json) {
                _this.dataSrc = null;
                console.log(json)
                if (json.Status.toLowerCase() == "auth" ||
                    (json.ErrorInfo && json.ErrorInfo.some &&
                        json.ErrorInfo.some(function (r) { return r.Status.toLowerCase() == "auth" })) ||
                    (json.ErrorInfo && json.ErrorInfo.ErrorMessage.search(/not access/i) != -1))
                    _this.data = { msg: _gtxt("AISSearch2.auth"), vessels: [] };
                else {
                    //_this.data = {msg:[{txt:"!!!"}], vessels:[]};
                    console.log(json);
                }
                _this.view.inProgress(false);
                _this.view.repaint();
            });
        }
    };
};