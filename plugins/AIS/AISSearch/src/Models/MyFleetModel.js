const Polyfill = require('../Polyfill');
let emptyGroup = function(title, isDefault, id, style, updateTemplate){
    let ms = "#ffff00",
    lsc = "#ffff00",
    ls = {"color":"#ffff00","text_shadow": "-1px -1px 0 #ffff00, 0px -1px 0 #ffff00, 1px -1px 0 #ffff00, -1px  0px 0 #ffff00, 1px  0px 0 #ffff00, -1px  1px 0 #ffff00, 0px  1px 0 #ffff00, 1px  1px 0 #ffff00"},
    eg = {
    title: title,
    vessels: [],
    get marker_style(){return ms}, 
    set marker_style(c){ms = c},
    //label_shadow:"color:black;-webkit-text-stroke:1px yellow;"
    label_color: "#000000",
    get label_shadow_color(){return lsc},
    get label_shadow(){return ls},
    set label_shadow(c){ 
        lsc = c;
        ls = {"color": c, "text_shadow": "-1px -1px 0 " + c + ", 0px -1px 0 " + c + ", 1px -1px 0 " + c + ", -1px  0px 0 " + c + ", 1px  0px 0 " + c + ", -1px  1px 0 " + c + ", 0px  1px 0 " + c + ", 1px  1px 0 " + c + ""}
    }
    };
    if (isDefault) eg.default = true;
    if (style)
    {
        style = JSON.parse(style);
        eg.marker_style = style.ms;
        eg.label_color = style.lc;
        eg.label_shadow = style.lsc;
        if (isDefault && style.mt && updateTemplate)
            _markerTemplate = style.mt;
    }
    eg.id = id;
    return eg;
}

const VesselData = function () {
    this.groups = []
};

let _tools,
_isDirty = true,
_myFleetLayers = [],
_defaultGroup = _gtxt("AISSearch2.AllGroup"),
_vessels = [],
_mapID,
_prepared,
_actualUpdate,
_markerTemplate = '<div><table><tr>' +
'<td style="vertical-align:top">' +
//'<svg width="12" height="11" fill="#00f" style="{{marker_style}}" viewBox="0 0 260 245"><use xlink:href="#mf_label_icon"/></svg>' +
'{{{marker}}}' +
'</td><td>{{{foo}}}</td></tr></table></div>',
_data,
_view,
_aisLayerSearcher,
_onChangedHandlers = [],
_fireChanged = function(){ _onChangedHandlers.forEach(h=>h()); },
_loadVoyageInfo = function (vessels) {   
    return new Promise(function (resolve, reject) {
        if (!vessels.length){
            reject();
            return;
        }

        let data;
        if (Polyfill.findIndex(vessels, v=>v.mmsi || v.imo)<0){
            data = _parseVoyageInfo({Result:{fields:[], values:[]}}, vessels); 
            resolve(data);
        } 
        else
            _aisLayerSearcher.searchNames(
                vessels,
                function (response) {
                    if (response.Status && response.Status.toLowerCase() == "ok") {
                        data = _parseVoyageInfo(response, vessels);
                        resolve(data);
                    }
                    else {
                        reject(response);
                    }
                });
    });
},
_compareGroups = function(l, r){
    if (l.default)
        return -1;
    if (r.default)
        return 1;        
    if (l.id<r.id)
        return -1;
    if (l.id>r.id)
        return 1;        
    return 0;
},
_parseVoyageInfo = function (response, vessels) {
        let mmsi = response.Result.fields.indexOf("mmsi"),
            vessel_name = response.Result.fields.indexOf("vessel_name"),
            ts_pos_utc = response.Result.fields.indexOf("ts_pos_utc"),
            imo = response.Result.fields.indexOf("imo"),
            lat = response.Result.fields.indexOf("longitude"),
            lon = response.Result.fields.indexOf("latitude"),
            vt = response.Result.fields.indexOf("vessel_type"),
            cog = response.Result.fields.indexOf("cog"),
            sog = response.Result.fields.indexOf("sog"),
            data,
            eg;
        if (_data){ // _data.groups.length>1 || _data.groups[0].vessels_length>0
            data = _data;
            data.groups.forEach(g=>g.vessels.length=0);
        }
        else{
            data = new VesselData();
            vessels.forEach(v=>{
                if (!v.mmsi && !v.imo){
                    if (v.group)
                        eg = emptyGroup(v.group, false, v.gmx_id, v.style, true);
                    else
                        eg = emptyGroup(_defaultGroup, true, v.gmx_id, v.style, true);
                    data.groups.push(eg);
                }
            });
            data.groups.sort(_compareGroups);
//console.log(data);
        }
        response.Result.values.forEach(c => {
            let d = new Date(c[ts_pos_utc] * 1000),
                member = {
                    vessel_name: c[vessel_name], mmsi: c[mmsi], imo: c[imo],
                    ts_pos_utc: _aisLayerSearcher.formatDateTime(d), dt_pos_utc: _aisLayerSearcher.formatDate(d),
                    ts_pos_org: c[ts_pos_utc],
                    xmin: c[lat], xmax: c[lat], ymin: c[lon], ymax: c[lon],
                    vessel_type: c[vt], cog: c[cog], sog: c[sog]
                };
            member.icon_rot = Math.round(member.cog / 15) * 15;
            _aisLayerSearcher.placeVesselTypeIcon(member);

            let i = Polyfill.findIndex(vessels, function (v) {
                return v.mmsi == member.mmsi;
            }),
                gn = i<0 ? "" : (!vessels[i].group ? _defaultGroup : vessels[i].group);
            if (gn != "") {
                i = Polyfill.findIndex(data.groups, function (g) {
                    return g.title == gn;
                });
                data.groups[i].vessels.push(member);
            }
        });

        //thisInst.data.vessels.sort(function (a, b) { return +(a.vessel_name > b.vessel_name) || +(a.vessel_name === b.vessel_name) - 1; })
//console.log("PARSE VI " + data.groups.reduce((p,c)=>p+c.vessels.length, 0))
        return data;
},
_persistGroupsLook = function(count, groups){
    return new Promise((resolve, reject)=>{
        let temp = [], style;
        for (let i=0; i<groups.length; ++i){
            style = {ms: groups[i].marker_style, lc: groups[i].label_color, lsc: groups[i].label_shadow_color};
            if(groups[i].default)
                style.mt = _markerTemplate;
            temp.push({
                properties:{style:JSON.stringify(style)}, 
                id:groups[i].id, action:"update"
            });
        }
        if (!FormData.prototype.set) { 
            sendCrossDomainJSONRequest(_aisLayerSearcher.baseUrl +
                'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] +
                '&objects=' + encodeURIComponent(JSON.stringify(temp)),
                function (r) {
                    if (!r.Status || r.Status.toLowerCase() != "ok")
                        console.log(r);
                    resolve(count + 1);
                }
            );                    
        }
        else {
            let form = new FormData();
            form.set('WrapStyle', 'none');
            form.set('LayerName', _myFleetLayers[0]);
            form.set('objects', JSON.stringify(temp));
            fetch(_aisLayerSearcher.baseUrl + 'VectorLayer/ModifyVectorObjects.ashx', {
                credentials: 'include',
                method: "POST",
                body: form
            })
                .then((r) => r.json())
                .then((r) => {
                    if (!r.Status || r.Status.toLowerCase() != "ok")
                        console.log(r);
                    resolve(count + 1);
                })
                .catch(err => {
                    console.log(err);
                    resolve(count + 1);
                });
        }                 
    });
    } 
;

module.exports = function ({aisLayerSearcher, toolbox}) {    
    _tools = toolbox;
    _aisLayerSearcher = aisLayerSearcher;
    _mapID = String($(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.MapID);
    let addGroupField = function(lid, resolve, reject, vessels){
console.log("add group and style field");
        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/Update.ashx?VectorLayerID=' + lid +
            '&columns=[{"Name":"mmsi","OldName":"mmsi","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"mmsi\\""},{"Name":"imo","OldName":"imo","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"imo\\""},{"Name":"gmx_id","OldName":"gmx_id","ColumnSimpleType":"Integer","IsPrimary":true,"IsIdentity":true,"IsComputed":false,"expression":"\\"gmx_id\\""},{"Name":"group","OldName":"group","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"group\\""},{"Name":"style","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"style\\""}]',
            function (response) {
                if (response.Status.toLowerCase() == "ok")
                    setTimeout(function run() {
                        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                            "AsyncTask.ashx?TaskID=" + response.Result.TaskID, function (response) {
                                if (response.Status.toLowerCase() == "ok")
                                    if (!response.Result.Completed)
                                        setTimeout(run, 1000);
                                    else {
                                        if(response.Result.ErorInfo)
                                            reject(response);
                                        else
                                            resolve(vessels);
                                    }
                                else 
                                    reject(response);
                            });
                    }, 1000);
            });
        },  
        addDefaultGroup = function(resolve, reject, vessels){
            sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] +
                '&objects=[{"properties":{"group": null},"action":"insert"}]',
                function (response) {
                    if (response.Status.toLowerCase() == "ok") {                           
                        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                            'VectorLayer/Search.ashx?layer=' + _myFleetLayers[0] +
                            '&query="group" is null and "mmsi" is null and "imo" is null',
                            function (response) {                                          
                                if (response.Status.toLowerCase() == "ok" && response.Result.values && response.Result.values.length>0) {
                                    let f = response.Result.fields, v = response.Result.values;  
                                    console.log("insert def group");
                                    vessels.push({imo:null, mmsi:null, group:null, gmx_id:v[0][f.indexOf('gmx_id')]});
                                    resolve(vessels);
                                }
                                else
                                    reject(response);
                            })
                    }
                    else
                        reject(response);
                }
            ); 
        },
        fetchMyFleet = function (lid) {
            return new Promise(function (resolve, reject) {
                sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + "VectorLayer/Search.ashx?layer=" + lid,
                    function (response) {
                        if (response.Status.toLowerCase() == "ok") {
                            let v = response.Result.values,
                                f = response.Result.fields,
                                vessels = [];
                            for (let i = 0; i < v.length; ++i) {
                                vessels.push({})
                                for (let j = 0; j < f.length; ++j){
                                    vessels[i][f[j]] = v[i][j];
                                }
                            }

                            new Promise((rs, rj)=>{
                                if (f.indexOf('group')<0 || f.indexOf('style')<0)
                                    addGroupField(lid, rs, rj, vessels);
                                else 
                                    rs();
                            }).then(()=>{
                                if (Polyfill.findIndex(vessels, v=>!v.imo&&!v.mmsi&&!v.group)<0)
                                    addDefaultGroup(resolve, reject, vessels);
                                else
                                    resolve(vessels);
                            },  r=>reject(r));
                        }
                        else
                            reject(response);
                    });
            })
        };

    _prepared = new Promise((resolve, reject) => {
        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
            "User/GetUserInfo.ashx",
            function (response) {
                if (response.Status.toLowerCase() == "ok" && response.Result)
                    resolve(response);
                if (response.Status.toLowerCase() == "ok" && !response.Result)
                    reject({Status:"auth"});
                else
                    reject(response);
            });
    })
    .then((response) => {
            let nickname = response.Result.Nickname;
            return new Promise((resolve, reject) => {				
                if ((nickname == 'scf_captain' || nickname == 'scf_captain2020' || nickname == 'scf_master2020')
                 && _mapID=='KGEJB')
					resolve({Status:"ok", Result:{count:1, layers:[{LayerID:"0A5CE9C59487441689ABF3031991BF2F"}]}});
				else
                    sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                        "Layer/Search2.ashx?page=0&pageSize=50&orderby=title &query=([Title]='myfleet" + _mapID + "' and [OwnerNickname]='" + nickname + "')",
                        function (response) {
                            if (response.Status.toLowerCase() == "ok" && response.Result.count > 0)
                                resolve(response);
                            else 
                                reject(response); // no my fleet layer
                        });
            });
    })
    .then((response) => {
            let lid = response.Result.layers[0].LayerID;
            _myFleetLayers.push(lid);
            return fetchMyFleet(lid)
        }
        ,(rejectedResponse) => {
            if (rejectedResponse.Status && rejectedResponse.Status.toLowerCase() == "ok")
                return Promise.resolve([]); // no mf layer
            else
                return Promise.reject(rejectedResponse); // smth wrong
        }
    )
    .then((vessels=>{
//console.log('INIT REPAINT MAP')
        _vessels = vessels.map(v=>v);
        _tools.specialVesselFilters = {key: "drawMarker", value: (args, ai, displayed)=>{          
            let vessel = Polyfill.find(_vessels, v=>{
                return v.mmsi && v.mmsi==args.properties[ai.mmsi];
            })
            if (vessel){
                let group = Polyfill.find(_vessels, v=>(!v.mmsi && !v.imo && v.group==vessel.group));
                if (vessel.group)
                    group = emptyGroup(vessel.group, false, group.gmx_id, group.style);
                else
                    group = emptyGroup(_defaultGroup, true, group.gmx_id, group.style);
                _tools.drawMyFleetMarker(args, _markerTemplate, group, ai, 
                    (displayed=="all" || displayed.indexOf(vessel.mmsi.toString())>=0) && _view.notDisplayed.indexOf(vessel.mmsi.toString())<0);
            }
        }}
        // _repaintMap(vessels); // only on init
        return Promise.resolve();
    }).bind(this));

    return {
        get isDirty() { return _isDirty; },
        set isDirty(value) { _isDirty = value; },
        get data() { return _data; },
        set data(value) { _data = value; },
        get view() { return _view; },
        set view(value) { _view = value; },
        get vessels(){
            let myfleet = _data.groups.reduce((p, c) => {
                c.vessels.forEach(v=>{if(v.mmsi)p.push({mmsi:v.mmsi, imo:v.imo})});
                return p;
            }, []);
            return myfleet;
        },
        findIndex: function (vessel) {
            if (_vessels.length == 0)
                return -1;
            return Polyfill.findIndex(_vessels, function (v) {
                return v.mmsi == vessel.mmsi && v.imo == vessel.imo;
            })
        },
        load: function (actualUpdate) {
            var thisInst = this;
            return _prepared.then(()=>{
                if (_myFleetLayers.length == 0 || !thisInst.isDirty)
                    return Promise.resolve();

                return fetchMyFleet(_myFleetLayers[0]) 
                    .then(vessels=>{
                        _vessels = vessels;
                        return _loadVoyageInfo(vessels);
                    })
                    .then(data=>{
                        _data=data;
                        _isDirty = false;
                        return Promise.resolve();
                    })
                    .catch(error=>{
                        _isDirty = false;
                        return Promise.reject(error);
                    });
            });
        },
        update: function () {
            _actualUpdate = new Date().getTime();
            let thisModel = this,
                actualUpdate = _actualUpdate;
            this.view.inProgress(true);
            this.load(actualUpdate).then(
                function () {
                    if (_actualUpdate == actualUpdate) {
                        thisModel.view.inProgress(false);
                        if (_data)
                            thisModel.view.repaint();
                    }
                }, 
                function (json) {
                    thisModel.dataSrc = null;
                    if ((json.Status && json.Status.toLowerCase() == "auth") ||
                        (json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function (r) { return r.Status.toLowerCase() == "auth" })))
                        thisModel.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], groups: [] };
                    else {
                        //thisModel.data = {msg:[{txt:"!!!"}], vessels:[]};
                        console.log(json);
                    }
                    thisModel.view.inProgress(false);
                    thisModel.view.repaint();
                });
        },
        get markerTemplate(){
            return _markerTemplate;
        },
        set markerTemplate(v){_markerTemplate = v;},
        markMembers: function (vessels) {
            if (this.data && this.data.groups){
                let membCounter = 0;
                this.data.groups.forEach(function (g) {
                    g.vessels.forEach(function (v) {
                        let i = Polyfill.findIndex(vessels, function (vv) { return v.mmsi == vv.mmsi && v.imo == v.imo });
                        if (i>-1){
                            let member = vessels[i]
                            member.mf_member = "visibilty:visible";
                            vessels.splice(i, 1);
                            vessels.splice(membCounter++, 0, member);
                        }
                    });
                });
            }
        },
        createGroup: function(name){
            if (!_myFleetLayers.length)
                return Promise.reject({Status:"error", ErrorInfo:"no data"});

            return new Promise((resolve, reject)=>{
                sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                    'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] +
                    '&objects=[{"properties":{ "group": "' + name.replace(/"/g, '\\\"') + '"},"action":"insert"}]',
                    function (response) {
                        if (response.Status.toLowerCase() == "ok") {                           
                            sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                                'VectorLayer/Search.ashx?layer=' + _myFleetLayers[0] +
                                '&query="group"=\'' + name.replace(/'/g, "''") + '\'',
                                function (response) {                                          
                                    if (response.Status.toLowerCase() == "ok" && response.Result.values && response.Result.values.length>0) {
                                        let f = response.Result.fields, v = response.Result.values;  
                                        let group = emptyGroup(name, false, v[0][f.indexOf('gmx_id')]);
                                        _data.groups.push(group);
                                        _vessels.push({gmx_id: v[0][f.indexOf('gmx_id')], mmsi:null, imo:null, group:name})
                                        resolve(group);
                                    }
                                    else
                                        reject(response);
                                })
                        }
                        else
                            reject(response);
                    }
                ); 
            });
        },
        deleteGroup: function(group){
            let objects = [], thisModel = this, i, j=-1;
            for (i = 0; i < _vessels.length; ++i) {
                if (_vessels[i].group == group) {
                    if (!_vessels[i].mmsi && !_vessels[i].imo) {
                        j = i;
                        objects.push({ id: _vessels[i].gmx_id, action: "delete" });
                    }
                    else {
                        _vessels[i].group = null;
                        objects.push({ properties: _vessels[i], id: _vessels[i].gmx_id, action: "update" });
                    }
                }
            }
            if (j<0)
                return;
            i = Polyfill.findIndex(_data.groups, g=>g.id==_vessels[j].gmx_id);
// console.log(i+", "+j + " - "+ _data.groups[i].id +" "+_vessels[j].gmx_id);    
            _data.groups.splice(i, 1);
            _data.groups.sort(_compareGroups);
// console.log(_data.groups)
// console.log(_vessels);            
            _vessels.splice(j, 1);
            sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] +
                '&objects=' + JSON.stringify(objects),
                function (response) {
                    if (response.Status.toLowerCase() == "ok") {
                        thisModel.isDirty = true;
                        thisModel.update();
                    }
                    else
                        console.log(response);
                }
            ); 
        },
        set onChanged(callback){ _onChangedHandlers.push(callback) },
        changeMembers: function (vessel) {
            var remove = false;
            for (var i = 0; i < _vessels.length; ++i) {
                if (_vessels[i].imo == vessel.imo && _vessels[i].mmsi == vessel.mmsi) {
                    remove = _vessels[i].gmx_id;
                    _vessels.splice(i, 1);
                    //_tools.eraseMyFleetMarker(vessel.mmsi);
                }
            }
            return new Promise((resolve, reject) => {
                if (!_myFleetLayers.length){
                    sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                        'VectorLayer/CreateVectorLayer.ashx?Title=myfleet' + _mapID + '&geometrytype=point&Columns=' +
                        '[{"Name":"mmsi","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"mmsi\\""},{"Name":"imo","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"imo\\""},{"Name":"group","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"group\\""},{"Name":"style","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"style\\""}]',
                        function (response) {
                            if (response.Status.toLowerCase() == "ok") {
                                _myFleetLayers.push(response.Result.properties.name);
                                addDefaultGroup(resolve, reject, []);
                            }
                            else
                                reject(response); // creation failed
                        }
                    );
                }
                else
                    resolve();
            })
            .then(()=>{
                return new Promise((resolve, reject) => {
                    if (!remove)
                        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                            'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] +
                            '&objects=[{"properties":{ "imo": ' + vessel.imo + ', "mmsi": ' + vessel.mmsi + '},"action":"insert"}]',
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
                })
                .then(
                function () {
                    this.isDirty = true;
                    _fireChanged();
                    return Promise.resolve();
                }.bind(this),
                function (response) {
                    console.log(response);
                    this.isDirty = true;
                    return Promise.resolve();
                }.bind(this));
            });
        },
        changeGroup: function(mmsi, group)  {   
            let i=Polyfill.findIndex(_vessels, (v)=>{return v.mmsi==mmsi})
            if (i<0) 
                return Promise.reject(mmsi);
            _vessels[i].group = group;
            return new Promise((resolve, reject)=>{
                sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl +
                    'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] +
                    '&objects=[' +
                    '{"properties":' + JSON.stringify(_vessels[i]) +
                    ',"id":' + _vessels[i].gmx_id + ',"action":"update"}]', (r)=>{
                    if (r.Status && r.Status.toLowerCase()=="ok"){
                        let i, j, found = false;
                        for (i=0; i<_data.groups.length; ++i){
                            for (j=0; j<_data.groups[i].vessels.length; ++j){
                                found = _data.groups[i].vessels[j].mmsi==mmsi;
                                if (found) break;
                            }                            
                            if (found) break; 
                        } 
                        let temp = _data.groups[i].vessels.splice(j, 1)[0];
                        i = !group?0:Polyfill.findIndex(_data.groups, g=>g.title==group)
                        _data.groups[i].vessels.push(temp);
                        resolve(r);
                    }
                    else
                        reject(r);
                });
            });
        },        
        saveLabelSettings: function(count){
            let groups = [];
            for (let i = 0; i < _data.groups.length; ++i) {
                if (_data.groups[i].default){
                    groups.push(_data.groups[i]);
                    break;
                }
            }
            return _persistGroupsLook(count, groups);
        },        
        saveGroupStyle: function(count){
            return _persistGroupsLook(count, _data.groups);
        },
        changeGroupStyle: function(i, colors){
            _data.groups[i].marker_style = colors.marker_style;
            _data.groups[i].label_color = colors.label_color;
            _data.groups[i].label_shadow = colors.label_shadow;
            _tools.highlightMarker(i, this.data.groups[i]);
            
            let g = _data.groups[i],
            group = Polyfill.find(_vessels, v=>(!v.mmsi && !v.imo && v.gmx_id==g.id)),
            style = {ms: g.marker_style, lc: g.label_color, lsc: g.label_shadow_color};
            if(g.default)
                style.mt = _markerTemplate;
            group.style = JSON.stringify(style);
//console.log(group)
//console.log(this.data.groups[i].marker_style)
        },
        loadTracks: function(){
console.log(_tools.historyInterval)                  
            const di = _tools.historyInterval;
            _vessels.forEach(v=>{ 
                new Promise((resolve) => {
                    _aisLayerSearcher.searchPositionsAgg2(v.mmsi, {dateBegin: di.get('dateBegin'), dateEnd: di.get('dateEnd')}, function (response) {
//console.log(response)       
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
                                    p[d].positions.push(_tools.formatPosition(obj, _aisLayerSearcher));
                                    p[d].count = p[d].count + 1;
                                }
                                else
                                    p[d] = { mmsi: v.mmsi, imo: obj['imo'], ts: obj['ts_pos_org'], positions: [_tools.formatPosition(obj, _aisLayerSearcher)], count: 1 };
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
                        resolve(response);
                    });
                })
                .then(function (response) {
                    if (response.Status && response.Status.toLowerCase()=='ok' && response.Result && response.Result.values)
                        _tools.showTrack(response.Result.values, console.log);
                    else
                        console.log(response);
                })
            });
        }
    };
}