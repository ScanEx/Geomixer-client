let _actualUpdate,
_myFleetModel,
_aisLayerSearcher,
_vesselLegend;

const ScreenSearchModel = function ({aisLayerSearcher, myFleetModel, vesselLegend}) {

    let thisInstance = this;
    myFleetModel.onChanged = function(){
        thisInstance.isDirty = true;
        if (thisInstance.view.isActive)
            thisInstance.update();
    };
    _aisLayerSearcher = aisLayerSearcher;
    _myFleetModel = myFleetModel;
    _vesselLegend = vesselLegend;
    this.filterString = "";
    this.isDirty = true;
};

ScreenSearchModel.prototype.load = function (actualUpdate) {
    if (!this.isDirty)
        return Promise.resolve();

    let thisInst = this;
    let s = new Date();
    return Promise.all([
        new Promise(function (resolve, reject) {
            _aisLayerSearcher.searchScreen({
                dateInterval: nsGmx.widgets.commonCalendar.getDateInterval(),
                border: true,
                group: true
            }, function (json) {
//console.log("RECEIVED "+((new Date()-s)/1000));
                if (json.Status.toLowerCase() == "ok") {
//console.log(json.Result.elapsed);
                    s = new Date();
                    thisInst.dataSrc = {
                        vessels: json.Result.values.map(function (v) {
                            let d = new Date(v[12]),//nsGmx.widgets.commonCalendar.getDateInterval().get('dateBegin'),
                            vessel = {
                                vessel_name: v[0], mmsi: v[1], imo: v[2], mf_member: 'visibility:hidden', 
                                ts_pos_utc: _aisLayerSearcher.formatDate(d), ts_pos_org: Math.floor(d.getTime()/1000),
                                xmin: v[4], xmax: v[5], ymin: v[6], ymax: v[7], maxid: v[3],
                                vessel_type: v[8], sog: v[9], cog: v[10], heading: v[11]
                            };
                            //if (_myFleetModel.findIndex(vessel)>=0)
                            //    vessel.mf_member = "visibility:visible";
                            vessel.icon_rot = Math.round(vessel.cog/15)*15;
                            _aisLayerSearcher.placeVesselTypeIcon(vessel);
                            return vessel;
                        })
                    };
//console.log(("MAP "+((new Date()-s)/1000)))
                    if (_actualUpdate == actualUpdate) {
                        //console.log("ALL CLEAN")
                        //console.log("1>"+new Date(thisInst._actualUpdate))
                        //console.log("2>"+new Date(actualUpdate))
                        thisInst.isDirty = false;
                    }
                    resolve();
                }
                else {
                    reject(json);
                }
            });
        })
        , _myFleetModel.load()
    ]);
};
ScreenSearchModel.prototype.setFilter = function () {
    this.filterString = this.filterString.replace(/\r+$/, "");
    if (this.dataSrc){
        let groupsDict = {}, groupsAltDict= {},
        updateGroups = function(v, a, d, ic){  
            if (ic) {
                let group = d[ic.url];
                if (!group) {
                    a.push({ url: ic.url, name: ic.name, count: 1 });
                    d[ic.url] = a[a.length - 1];
                }
                else
                    group.count++;
            }
        };

        this.data = { groups: [], groupsAlt: [] };        
        if (this.filterString != "") {
            this.data.vessels = this.dataSrc.vessels.filter(((v) => {
                if (v.vessel_name.search(new RegExp("\\b" + this.filterString, "ig")) != -1) {
                    updateGroups(v, this.data.groups, groupsDict, _vesselLegend.getIcon(v.vessel_type, 1));
                    updateGroups(v, this.data.groupsAlt, groupsAltDict, _vesselLegend.getIconAlt("v.vessel_name", v.sog));
                    return true;
                }
                else
                    return false;
            }).bind(this));
        }
        else {
            this.data.vessels = this.dataSrc.vessels.map((v) => {
                updateGroups(v, this.data.groups, groupsDict, _vesselLegend.getIcon(v.vessel_type, 1));
                updateGroups(v, this.data.groupsAlt, groupsAltDict, _vesselLegend.getIconAlt("v.vessel_name", v.sog));
                return v;
            });
        }
    }
};
ScreenSearchModel.prototype.sortData = function () {
        let sortGrups = function(a, b) {
            return b.count - a.count;
          }
        this.data.groups.sort(sortGrups);
        this.data.groupsAlt.sort(sortGrups);
        // let sortNames = (a,b)=>{
        //     if (a.vessel_name == b.vessel_name)
        //         return 0;
        //     else
        //         return a.vessel_name > b.vessel_name ? 1 : -1;
        // };  
        // this.data.vessels.sort((a,b)=>{
        //     let a_member = _myFleetModel.findIndex(a)>=0,
        //         b_member = _myFleetModel.findIndex(b)>=0;
        //     if (a_member)
        //         a.mf_member = "visibility:visible";
        //     if (b_member)
        //         b.mf_member = "visibility:visible";
        //     if ((!a_member && !b_member) || (a_member && b_member))
        //         return 0; //sortNames(a,b);
        //     else if (a_member && !b_member)
        //         return -1;
        //     else if (!a_member && b_member)
        //         return 1;
        // });
};
ScreenSearchModel.prototype.update = function () {
    if (!this.isDirty)
        return;
    _actualUpdate = new Date().getTime();
    let thisInst = this,
        actualUpdate = _actualUpdate;
    this.view.inProgress(true);       

let s = new Date()
    this.load(actualUpdate).then(function () {
        if (_actualUpdate == actualUpdate) {
//console.log(thisInst.dataSrc)
            if (thisInst.dataSrc)
                _myFleetModel.markMembers(thisInst.dataSrc.vessels);
//console.log("this.load "+((new Date()-s)/1000))
s = new Date()
            thisInst.setFilter();  
//console.log("thisInst.setFilter "+((new Date()-s)/1000))
s = new Date()
            thisInst.sortData();   
//console.log("thisInst.sortData "+((new Date()-s)/1000))           
            thisInst.view.inProgress(false);

s = new Date()
            thisInst.view.repaint(); 
//console.log("thisInst.view.repaint "+((new Date()-s)/1000))  
        }
    }, function (json) {
        thisInst.dataSrc = null;
//console.logconsole.log(json)
        if (json.Status.toLowerCase() == "auth" ||
            (json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function (r) { return r.Status.toLowerCase() == "auth" })))
            thisInst.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], vessels: [] };
        else {
            //thisInst.data = {msg:[{txt:"!!!"}], vessels:[]};
            console.log(json);
        }
        thisInst.view.inProgress(false);
        thisInst.view.repaint();
    });
};

module.exports = ScreenSearchModel;