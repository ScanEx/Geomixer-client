const Polyfill = require('../Polyfill');
module.exports = function (aisLayerSearcher) {

    let _myFleetLayers = [],
        _vessels = [],
        _mapID = String($(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.MapID),
        fetchMyFleet = function (lid) {
            return new Promise(function (resolve, reject) {
                //console.log(lid)
                sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + "VectorLayer/Search.ashx?layer=" + lid,
                    function (response) {
                        //console.log(response);
                        if (response.Status.toLowerCase() == "ok") {
                            let v = response.Result.values,
                                f = response.Result.fields,
                                mmsi = f.indexOf('mmsi');
                            for (let i = 0; i < v.length; ++i) {
                                if (v[i][mmsi]){
                                    let t = {};
                                    for (let j = 0; j < f.length; ++j)
                                        t[f[j]] = v[i][j];
                                    _vessels.push(t)
                                }
                            }
                        }
                        else
                            console.log(response);
                        resolve(response);
                    });
            })
        };
        
    let _prepared = new Promise((resolve, reject) => {
//console.log("MF USER")               
            sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                "User/GetUserInfo.ashx",
                function (response) {
                    if (response.Status.toLowerCase() == "ok" && response.Result)
                        resolve(response);
                    else
                        reject(response);
                }
            );
        })
        .then((response) => {
//console.log("MF LAYER")               
            let nickname = response.Result.Nickname;
            return new Promise((resolve, reject) => {
                sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                    "Layer/Search2.ashx?page=0&pageSize=50&orderby=title &query=([Title]='myfleet" + _mapID + "' and [OwnerNickname]='" + nickname + "')",
                    function (response) {
                        if (response.Status.toLowerCase() == "ok" && response.Result.count > 0)
                            resolve(response);
                        else
                            reject(response);
                    });
            })
        })
        .then((response) => {
//console.log("MF VESSELS")   
            let lid = response.Result.layers[0].LayerID;
            _myFleetLayers.push(lid);
            _vessels.length = 0;
            return fetchMyFleet(lid)
        }
        ,(rejectedResponse) => {
            if (rejectedResponse.Status && rejectedResponse.Status.toLowerCase() == "ok"){
//console.log("MF NOT FOUND") 
                return Promise.resolve([]);   
            }
            else
                return Promise.reject(rejectedResponse);
        }
        )        
        .catch(error=>{
            console.log(error);
            return Promise.reject(error);
        });

    let _actualUpdate,
        _data;
    return {
        isDirty: true,
        get data() { return _data; },
        set data(value) { _data = value; },
        findIndex: function (vessel) {
            if (_vessels.length == 0)
                return -1;
            return Polyfill.findIndex(_vessels, function (v) {
                return v.mmsi == vessel.mmsi && v.imo == vessel.imo;
            })
        },
        load: function (actualUpdate) {
            var thisInst = this;
            return _prepared.then((r)=>{
                if (r && r.Status && r.Status.toLowerCase()=="auth")
                    return Promise.reject(r);
                // if (_myFleetLayers.length == 0)
                //     thisInst.data = { msg: [{ txt: _gtxt("AISSearch2.nomyfleet") }], vessels: [] };
                if (_myFleetLayers.length == 0 || !thisInst.isDirty)
                    return Promise.resolve();

            _vessels.length = 0;
            return fetchMyFleet(_myFleetLayers[0])
                .then(function () { 
//console.log("MF GET VI")    
//console.log(_vessels)                    
                    if (_vessels.length == 0)
                        return Promise.resolve({ Status: "ok", Result: { values: [] } });

                    return new Promise(function (resolve, reject) {
                        aisLayerSearcher.searchNames(
                            _vessels,
                            //vessels.map(function(v){return v.mmsi}), 
                            //vessels.map(function(v){return v.imo}),
                            function (response) {
                                resolve(response);
                            });
                    });
                })
                .then(function (response) {  
//console.log("MF FORMAT")    
//console.log(response)                              
                    if (response.Status.toLowerCase() == "ok") {
                        thisInst.data = {
                            vessels: response.Result.values.reduce(function (p, c) {
                                var mmsi = response.Result.fields.indexOf("mmsi"),
                                    vessel_name = response.Result.fields.indexOf("vessel_name"),
                                    ts_pos_utc = response.Result.fields.indexOf("ts_pos_utc"),
                                    imo = response.Result.fields.indexOf("imo"),
                                    lat = response.Result.fields.indexOf("longitude"),
                                    lon = response.Result.fields.indexOf("latitude"),
                                    vt = response.Result.fields.indexOf("vessel_type"),
                                    cog = response.Result.fields.indexOf("cog"),
                                    sog = response.Result.fields.indexOf("sog");
                                if (!p.some(function (v) { return v.mmsi == c[mmsi] })) {
                                    var d = new Date(c[ts_pos_utc] * 1000),
                                        member = {
                                        vessel_name: c[vessel_name], mmsi: c[mmsi], imo: c[imo],
                                        ts_pos_utc: aisLayerSearcher.formatDateTime(d), dt_pos_utc: aisLayerSearcher.formatDate(d),
                                        ts_pos_org: c[ts_pos_utc],
                                        xmin: c[lat], xmax: c[lat], ymin: c[lon], ymax: c[lon],
                                        vessel_type: c[vt], cog: c[cog], sog: c[sog]
                                        };
                                        member.icon_rot = Math.round(member.cog/15)*15;
                                        aisLayerSearcher.placeVesselTypeIcon(member);
                                    p.push(member);
                                }
                                return p;
                            }, [])
                        };
                        thisInst.data.vessels.sort(function (a, b) { return +(a.vessel_name > b.vessel_name) || +(a.vessel_name === b.vessel_name) - 1; })
                        thisInst.isDirty = false;
                        return Promise.resolve();
                    }
                    else {
                        return Promise.reject(response);
                    }
                })
                .catch(error=>{
                    thisInst.isDirty = false;
                    return Promise.reject(error);
                });                
            },
            (problem)=>{
                thisInst.isDirty = false;
                return Promise.reject(problem);
            });
        },
        update: function () {
            //if (!this.isDirty)
            //    return;
            _actualUpdate = new Date().getTime();
            let _this = this,
                actualUpdate = _actualUpdate;
            this.view.inProgress(true);

            this.load(actualUpdate).then(function () {
                if (_actualUpdate == actualUpdate) {
                    _this.view.inProgress(false);
//console.log(_this.data)
                    _this.view.repaint();
                }
            }, function (json) {
                _this.dataSrc = null;
                console.log(json)
                if (json.Status.toLowerCase() == "auth" ||
                    (json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function (r) { return r.Status.toLowerCase() == "auth" })))
                    _this.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], vessels: [] };
                else {
                    //_this.data = {msg:[{txt:"!!!"}], vessels:[]};
                    console.log(json);
                }
                _this.view.inProgress(false);
                _this.view.repaint();
            });
        },
        markMembers: function (vessels) {
            //console.log(vessels.length)
            if (this.data && this.data.vessels){
                let membCounter = 0;
                this.data.vessels.forEach(function (v) {
                    let i = Polyfill.findIndex(vessels, function (vv) { return v.mmsi == vv.mmsi && v.imo == v.imo });
                    if (i>-1){
                        let member = vessels[i]
                        member.mf_member = "visibilty:visible";
                        vessels.splice(i, 1);
                        vessels.splice(membCounter++, 0, member);
                    }
                });
            }
        },
        changeFilter: function (vessel) {
            //console.log(vessel);
            //console.log(_vessels);

            return _prepared
            .then(r=>{
                if (!_myFleetLayers.length){
//console.log("MF CREATE")        
                    return new Promise((resolve, reject) => {
                        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                            'VectorLayer/CreateVectorLayer.ashx?Title=myfleet' + _mapID + '&geometrytype=point&Columns=' +
                            '[{"Name":"mmsi","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"mmsi\\""},{"Name":"imo","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"imo\\""}]',
                            function (response) {
                                if (response.Status.toLowerCase() == "ok") {
                                    _myFleetLayers.push(response.Result.properties.name)
                                    resolve([]);
                                }
                                else {
                                    reject(response);
                                }
                            }
                        );
                    });
                }
            })
            .then(r=>{
                var remove = false;
                for (var i = 0; i < _vessels.length; ++i) {
                    if (_vessels[i].imo == vessel.imo && _vessels[i].mmsi == vessel.mmsi) {
                        remove = _vessels[i].gmx_id;
                        _vessels.splice(i, 1);
                    }
                }
                //console.log(remove);
                return new Promise((resolve, reject) => {
                    if (!remove)
                        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                            'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] +
                            '&objects=[{"properties":{ "imo": ' + vessel.imo + ', "mmsi": ' + vessel.mmsi + '},' +
                            '"geometry":{"type":"Point","coordinates":[0,0]},"action":"insert"}]',
                            function (response) {
                                if (response.Status.toLowerCase() == "ok") {
                                    resolve();
                                    _vessels.push({ "mmsi": vessel.mmsi, "imo": vessel.imo, "gmx_id": response.Result[0] });
                                }
                                else
                                    reject(response);
                            })
                    else
                        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                            'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] +
                            '&objects=[{"id":' + remove + ',"action":"delete"}]',
                            function (response) {
                                if (response.Status.toLowerCase() == "ok")
                                    resolve();
                                else
                                    reject(response);
                            })
                });
            })
            .then(
                function () {
                    this.isDirty = true;
                    //console.log(this.data);
                    //L.gmx.layersVersion.chkVersion();
                    return Promise.resolve();
                }.bind(this),
                function (response) {
                    this.isDirty = true;
                    console.log(response);
                    return Promise.resolve();
                }.bind(this)
            );
        }
    };
}