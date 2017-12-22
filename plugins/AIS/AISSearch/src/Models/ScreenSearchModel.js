//************************************
// AIS SCREEN SEARCH MODEL
//************************************

module.exports = function({myFleetMembersModel, aisLayerSearcher, aisSearchView}){
	return {
		
		set view(value){ aisSearchView = value },
		
        _isDirty: true,
        getDirty: function(){return this._isDirty},
        setDirty: function(){this._isDirty = true},
        getCount: function(){
            return this.data ? this.data.vessels.length : 0;
        },
        load: function(actualUpdate){
            var _this = this;
            if (!this._isDirty){
                return Promise.resolve();
            }
            return Promise.all([new Promise(function(resolve, reject){
                aisLayerSearcher.searchScreen({
                    dateInterval: nsGmx.widgets.commonCalendar.getDateInterval(),
                    border: true,
                    group:true
                }, function (json) {
//console.log(json)
                    if (json.Status.toLowerCase()=="ok")
                    {
                        _this.dataSrc = {vessels: json.Result.values.map(function(v){
                            return {vessel_name:v[0], mmsi:v[1], imo:v[2], mf_member:'display:none', 
                        xmin:v[4], xmax:v[5], ymin:v[6], ymax:v[7], maxid:v[3]}
                        })};
                        if (_this._actualUpdate==actualUpdate){
//console.log("ALL CLEAN")
//console.log("1>"+new Date(_this._actualUpdate))
//console.log("2>"+new Date(actualUpdate))
                            _this._isDirty = false;
                        }
                        resolve();
                    }
                    else{
                        reject(json);
                    }
//console.log("LOAD SCREEN SEARCH DONE")
                    //return resolve();
                });
            })
            ,myFleetMembersModel.load()
            ]);
        },
        _actualUpdate: new Date().getTime(),
        filterString: "",
        update: function(){
            var _this = this;
            this._actualUpdate = new Date().getTime();
            var actualUpdate = this._actualUpdate;  
//this.filterString&&console.log(this.filterString+" "+this.filterString.search(/\r$/))
//this.filterString&&console.log(this.filterString.replace(/^\s+/, "").replace(/\s+\r*$/, "")!="")

            this.load(actualUpdate).then(function(){
//console.log("LOADED "+(new Date().getTime()-_this._actualUpdate)+"ms")
//console.log("3>"+new Date(_this._actualUpdate))
//console.log("4>"+new Date(actualUpdate))
                if (_this._actualUpdate==actualUpdate){
                    _this.filterString = _this.filterString.replace(/\r+$/, "");
                    if (_this.dataSrc)
                        if(_this.filterString!=""){
                            _this.data = {vessels:_this.dataSrc.vessels.filter(function(v){
                                return v.vessel_name.search(new RegExp("\\b"+_this.filterString, "ig"))!=-1;
                            })}; 
                        }
                        else{
                            _this.data = {vessels:_this.dataSrc.vessels.map(function(v){return v;})};
                        }
                    
                    if (_this.data)
                        myFleetMembersModel.markMembers(_this.data.vessels);
                    aisSearchView.repaint();
                }
            }, function(json){
                _this.dataSrc = null;
console.log(json)
                if (json.Status.toLowerCase()=="auth" || 
                    (json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function(r){return r.Status.toLowerCase()=="auth"})))
                    _this.data = {msg:[{txt:_gtxt("AISSearch2.auth")}], vessels:[]};
                else{
                    //_this.data = {msg:[{txt:"!!!"}], vessels:[]};
                    console.log(json);
                }
                aisSearchView.repaint();
            });
        }
    }
}