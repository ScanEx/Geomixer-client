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
    //this.filterString = "";
    this.isDirty = true;
};

let _filterString = '';
Object.defineProperty(ScreenSearchModel.prototype, "filterString", {
    get() {
        return _filterString;
    },
    set(v) {
        _filterString = v;
    }
});

let _filterPromise;
ScreenSearchModel.prototype.setFilter = function (s) {        
    this.view.inProgress(true);  
    if (this.filterString=='')
    {
        this.data.vessels = this.dataSrc.vessels.map(v=>v);
        this.data.groups = this.dataSrc.groups.map(g=>g)
        this.data.groupsAlt = this.dataSrc.groupsAlt.map(g=>g);
        
        this.sortData();
        this.view.inProgress(false);
        this.view.repaint(); 
    }
    else{
        const thisModel = this;
        if (_filterPromise)
            _filterPromise.cancel = true; 
        _filterPromise = {
            cancel: false, 
            run: function(){
                const inst=this; 
                return new Promise(function(rs, rj){
                    setTimeout( function(){
                        if (inst.cancel || !thisModel.data)
                            rj(0);
                        thisModel.data.vessels = [], thisModel.data.groups = [], thisModel.data.groupsAlt = [];
                        const filter = new RegExp(`^${thisModel.filterString}| ${thisModel.filterString}`, "ig");
//console.log(`[${filter}]`);
                        let icons = {}, setGroups = function(ic, a){
                                if (icons[ic.name]==undefined){
                                    icons[ic.name] = a.length;
                                    a.push({ url: ic.url, name: ic.name, count: 1})
                                }
                                else
                                    a[icons[ic.name]].count = a[icons[ic.name]].count + 1;
                        };

                        const a = thisModel.dataSrc.vessels;
                        for (var i=0, v; i<a.length; ++i){
                            if (inst.cancel) rj(0);
                            v=a[i];
                            if (v.vessel_name.search(filter)>-1){
                                thisModel.data.vessels.push(v);
                                let ic = _vesselLegend.getIcon(v.vessel_type, 1);
                                setGroups(ic, thisModel.data.groups);
                                ic = _vesselLegend.getIconAlt(v.vessel_, parseInt(v.sog));
                                setGroups(ic, thisModel.data.groupsAlt);
                            }
                        }
                        if (inst.cancel) rj(0);

                        rs(thisModel.filterString);
                    }, 500);
                });
            }
        };
        _filterPromise.run().then(function(r){
//console.log(`<${r}>`);
            thisModel.sortData();
            thisModel.view.inProgress(false);
            thisModel.view.repaint(); 
        }, ()=>{});

        // this.data.vessels = [], this.data.groups = [], this.data.groupsAlt = [];
        // const filter = new RegExp(`^${this.filterString}| ${this.filterString}`, "ig");
        // let icons = {}, setGroups = function(ic, a){
        //         if (icons[ic.name]==undefined){
        //             icons[ic.name] = a.length;
        //             a.push({ url: ic.url, name: ic.name, count: 1})
        //         }
        //         else
        //             a[icons[ic.name]].count = a[icons[ic.name]].count + 1;
        // };
        // this.dataSrc.vessels.forEach(v=>{
        //     if (v.vessel_name.search(filter)>-1){
        //         this.data.vessels.push(v);
        //         let ic = _vesselLegend.getIcon(v.vessel_type, 1);
        //         setGroups(ic, this.data.groups);
        //         ic = _vesselLegend.getIconAlt(v.vessel_, parseInt(v.sog));
        //         setGroups(ic, this.data.groupsAlt);
        //     }
        // });
        // this.sortData();
        // this.view.inProgress(false);
        // this.view.repaint(); 
    }
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

                    // thisInst.filterString = thisInst.filterString.replace(/\r+$/, ""); !!!!!!TO DO FILTER

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
                        }),
                        groups: [], 
                        groupsAlt: []
                    };

                    thisInst.data = { groups: [], groupsAlt: [] }; 
                    for (let k in json.Result.groups){
                        let ic = _vesselLegend.getIcon(k, 1)
                        thisInst.data.groups.push({ url: ic.url, name: ic.name, count: json.Result.groups[k]});
                    }
                    for (let k in json.Result.groupsAlt){
                        if (!isNaN(k)){
                            let ic = _vesselLegend.getIconAlt("ABC", parseInt(k))
                            thisInst.data.groupsAlt.push({ url: ic.url, name: ic.name, count: json.Result.groupsAlt[k]});
                        }
                    }
                    thisInst.dataSrc.groups = thisInst.data.groups.map(g=>g)
                    thisInst.dataSrc.groupsAlt = thisInst.data.groupsAlt.map(g=>g)

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
            if (thisInst.dataSrc)
                _myFleetModel.markMembers(thisInst.dataSrc.vessels);  
            if (thisInst.filterString!=''){
                thisInst.setFilter();
            }
            else{                
                thisInst.data.vessels = thisInst.dataSrc.vessels;
                
                thisInst.sortData();         
                thisInst.view.inProgress(false);
                thisInst.view.repaint(); 
            }
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