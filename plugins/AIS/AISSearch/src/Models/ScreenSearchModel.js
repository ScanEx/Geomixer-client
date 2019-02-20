module.exports = function ({aisLayerSearcher, myFleetModel}) {
    let _actualUpdate;
    return {
        filterString: "",
        isDirty: true,
        load: function (actualUpdate) {
            if (!this.isDirty) {
                return Promise.resolve();
            }
            let thisInst = this;
            return Promise.all([new Promise(function (resolve, reject) {
                aisLayerSearcher.searchScreen({
                    dateInterval: nsGmx.widgets.commonCalendar.getDateInterval(),
                    border: true,
                    group: true
                }, function (json) {
//console.log(json.Result.values[0][12])
                    if (json.Status.toLowerCase() == "ok") {
                        thisInst.dataSrc = {
                            vessels: json.Result.values.map(function (v) {
                                let d = new Date(v[12]),//nsGmx.widgets.commonCalendar.getDateInterval().get('dateBegin'),
                                vessel = {
                                    vessel_name: v[0], mmsi: v[1], imo: v[2], mf_member: 'visibility:hidden', 
                                    ts_pos_utc: aisLayerSearcher.formatDate(d), ts_pos_org: Math.floor(d.getTime()/1000),
                                    xmin: v[4], xmax: v[5], ymin: v[6], ymax: v[7], maxid: v[3],
                                    vessel_type: v[8], sog: v[9], cog: v[10], heading: v[11]
                                };
                                vessel.icon_rot = Math.round(vessel.cog/15)*15;
                                aisLayerSearcher.placeVesselTypeIcon(vessel);
                                return vessel;
                            })
                        };
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
                ,myFleetModel.load()
            ]);
        },
        setFilter: function () {
            this.filterString = this.filterString.replace(/\r+$/, "");
            if (this.dataSrc){
                if (this.filterString != "") {
                    this.data = {
                        vessels: this.dataSrc.vessels.filter(((v)=>{
                            return v.vessel_name.search(new RegExp("\\b" + this.filterString, "ig")) != -1;
                        }).bind(this))
                    };
                }
                else {
                    this.data = { vessels: this.dataSrc.vessels.map((v)=>v) };
                }
            }
        },
        update: function () {
//let start = new Date();
            if (!this.isDirty)
                return;
            _actualUpdate = new Date().getTime();
            let thisInst = this,
                actualUpdate = _actualUpdate;
            this.view.inProgress(true);
            //this.filterString&&console.log(this.filterString+" "+this.filterString.search(/\r$/))
            //this.filterString&&console.log(this.filterString.replace(/^\s+/, "").replace(/\s+\r*$/, "")!="")            

            this.load(actualUpdate).then(function () {
                if (_actualUpdate == actualUpdate) {
//console.log(thisInst.dataSrc)
                    if (thisInst.dataSrc)
                        myFleetModel.markMembers(thisInst.dataSrc.vessels);
                    thisInst.setFilter();                 
                    thisInst.view.inProgress(false);
                    thisInst.view.repaint();
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
        }
    };
};