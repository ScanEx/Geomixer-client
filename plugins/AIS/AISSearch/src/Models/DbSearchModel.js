//************************************
// DB SEARCH MODEL
//************************************

module.exports = function({aisSearchView, myFleetMembersModel, aisLayerSearcher}){
	return {
		set view(value) {
			aisSearchView = value
		},
        getCount: function(){
            return this.data ? this.data.vessels.length : 0;
        },
        filterString: "",
        _searchString: "",
        update: function(){
            var _this = this;
            this._actualUpdate = new Date().getTime();
            var actualUpdate = this._actualUpdate; 
            
//this.filterString&&console.log(this.filterString+" "+this.filterString.search(/\r$/))
//this.filterString&&console.log(this._searchString+" "+this._searchString.search(/\r$/))
            this.filterString = this.filterString.replace(/\r+$/, "");
 
            new Promise(function(resolve, reject){
                if (_this.filterString.length>0 && _this.filterString!=_this._searchString)
                {
                    _this._searchString = _this.filterString;
                    aisLayerSearcher.searchString(_this._searchString, true, function(response){
                        if (response.Status.toLowerCase()=="ok")
                        {
                            _this.data = {vessels: response.Result.values.map(function(v){
                                return {vessel_name:v[0], mmsi:v[1], imo:v[2], mf_member:'display:none', ts_pos_utc: aisLayerSearcher.formatDate(new Date(v[3]*1000)),
                            xmin:v[4], xmax:v[4], ymin:v[5], ymax:v[5]}
                            })};
                            resolve();
                        }
                        else{
                            reject(response);
                        }
                    })
                }
                else if(_this.filterString.length==0){
                    _this.data = null;
                    resolve();
                }
                else
                    resolve();
            })
            .then(function(){
//console.log("LOADED "+(new Date().getTime()-_this._actualUpdate)+"ms")
                if (_this._actualUpdate==actualUpdate){
                    if (_this.data)
                        myFleetMembersModel.markMembers(_this.data.vessels);
                    aisSearchView.repaint();
                }
            },
            function(response){
console.log(response);                
                if (response.Status.toLowerCase()=="auth" || 
                (response.ErrorInfo && response.ErrorInfo.ErrorMessage.search(/can not access/i)!=-1))
                    _this.data = {msg:[{txt:_gtxt("AISSearch2.auth")}], vessels:[]};
                else
                    console.log(response);
                _this.dataSrc = null;
                aisSearchView.repaint();
            });
        }
    };
}