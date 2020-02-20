module.exports = function (aisLayerSearcher) {
    let _actualUpdate;
    return {
        searcher: aisLayerSearcher,
        filterString: "",
        isDirty: false,
        load: function (actualUpdate) {
            if (!this.isDirty)
                return Promise.resolve();
 
            var _this = this;
            return new Promise((resolve) => {
                aisLayerSearcher.searchPositionsAgg2(_this.vessel.mmsi, _this.historyInterval, function (response) {
//console.log(response)       
                    if (parseResponse(response)) {
                        let position, positions = [], previous,
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
                                    p[d].positions.push(_this.view.formatPosition(obj, aisLayerSearcher));
                                    p[d].count = p[d].count + 1;
                                }
                                else{
                                    p[d] = { ts_pos_utc: _this.view.formatDate(d), positions: [_this.view.formatPosition(obj, aisLayerSearcher)], count: 1 };
                                    if (previous) // todo check date diff!!
                                        previous.lastPos = {xmax: p[d].positions[0].xmax, ymax: p[d].positions[0].ymax};
                                }
                                previous = p[d];
                                return p;
                            }, {});
//console.log(groups)       
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