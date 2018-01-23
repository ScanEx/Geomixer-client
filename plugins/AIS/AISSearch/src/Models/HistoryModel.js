//************************************
// HISTORY MODEL
//************************************
	
module.exports = function({baseUrl, aisLayerSearcher, polyFind, polyFindIndex}){
			
	let _isDirty = false,
	_view,
	_vessel,
	_historyInterval = {},
	round = function(d, p){
		let isNeg = d<0,
			power = Math.pow(10, p)
		return d?((isNeg?-1:1)*(Math.round((isNeg?d=-d:d)*power)/power)):d
	},
	addUnit = function(v, u){
        return v!=null && v!="" ? v+u : ""; 
    },
	toDd = function(D, lng){
		let dir = D<0?lng?'W':'S':lng?'E':'N',
		deg = Math.round((D<0?D=-D:D)*1000000)/1000000
		return deg+"°"+dir
	},
	formatVessel = function(vessel, formatDate){				
					vessel.cog_sog = vessel.cog || vessel.sog					
					vessel.heading_rot = vessel.heading || vessel.rot				
					vessel.x_y = vessel.longitude || vessel.latitude
					
                    vessel.ts_pos_utc = formatDate(new Date(vessel.ts_pos_utc*1000));
                    //vessel.ts_eta = formatDate(new Date(vessel.ts_eta*1000));
                    vessel.cog = addUnit(round(vessel.cog, 5), "°");
                    vessel.sog = addUnit(round(vessel.sog, 5), " уз");
                    vessel.rot = addUnit(round(vessel.rot, 5), "°/мин");
                    vessel.heading = addUnit(round(vessel.heading, 5), "°");
                    vessel.draught = addUnit(round(vessel.draught, 5), " м");
                    //vessel.length = addUnit(vessel.length, " м");
                    //vessel.width = addUnit(vessel.width, " м");
					vessel.source = vessel.source=='T-AIS'?_gtxt('AISSearch2.tais'):_gtxt('AISSearch2.sais');
					vessel.longitude = toDd(vessel.longitude, true)
					vessel.latitude = toDd(vessel.latitude)
	
                    return vessel;
    }
	return {		
		set view(value){ _view = value },
		get historyInterval(){
			return _historyInterval
		},
		set historyInterval(value){
			_historyInterval = value
		},
		get vessel(){
			return _vessel
		},
		set vessel(value){
			_vessel = value
		},
	
        getDirty: function(){return _isDirty},
        setDirty: function(){_isDirty = true},
        getCount: function(){
            return this.data ? this.data.vessels.length : 0;
        },
        load: function(){
			
            if (!_isDirty)
                return Promise.resolve();
				//return new Promise((resolve)=>setTimeout(resolve, 1000))
				
//console.log('LOAD ' + _historyInterval['dateBegin'].toUTCString() + ' ' + _historyInterval['dateEnd'].toUTCString())     

            var _this = this;
			return new Promise((resolve)=>{				
				aisLayerSearcher.searchPositions([_vessel.mmsi], _historyInterval, function(response){
								if (parseResponse(response)){                    
									let position, positions = [];
									for(var i=0; i<response.Result.values.length; ++i){
										position = {}
										for (var j=0; j<response.Result.fields.length; ++j){
											position[response.Result.fields[j]] = response.Result.values[i][j];
											if(response.Result.fields[j]=='ts_pos_utc')
												position['ts_pos_utc_org'] = response.Result.values[i][j];
										}
										positions.push(formatVessel(position, aisLayerSearcher.formatDate))
									}
									positions.sort((a,b)=>{
										if (a.ts_pos_utc_org > b.ts_pos_utc_org) return -1
										if (a.ts_pos_utc_org < b.ts_pos_utc_org) return 1;
										return 0;
									})
									resolve({Status:"ok", Result:{values:positions}});
								}
								else
									resolve(response)
				})
			})
			.then(function(response) {    
//console.log(response)       
                _isDirty = false;               
                if (response.Status.toLowerCase()=="ok"){
					_this.data = {vessels:response.Result.values}          
                    return Promise.resolve(); 
                }
                else{                                           
                    return Promise.reject(response); 
                }
            });
		},
        update: function(){
            let _this = this,
				actualUpdate = this._actualUpdate = new Date();
            this.load().then(function(){
//console.log(_this.data)
                if (_this._actualUpdate==actualUpdate){
                    _view.repaint();
				}
            }, 
			function(response){
                _this.data = null;
                if (response.Status.toLowerCase()=="auth" || 
                    (response.ErrorInfo && response.ErrorInfo.some && response.ErrorInfo.some(function(r){return r.Status.toLowerCase()=="auth"})))
                    _this.data = {msg:[{txt:_gtxt("AISSearch2.auth")}], vessels:[]};
                else{
                    console.log(response);
                }
                _view.repaint();              
            });
        },
	}

}	
