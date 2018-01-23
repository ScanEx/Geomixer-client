//************************************
// MY FLEET MODEL
//************************************
	
module.exports = function({baseUrl, myFleetLayers, aisLayerSearcher, myFleetMembersView, polyFind, polyFindIndex}){
	return {		
		set view(value){ myFleetMembersView = value },	
		set mapLayers(value){ myFleetLayers = value },
		//get mapLayers(){ return myFleetLayers },
		
		findIndex: function(vessel){
			if (!this.data)
				return -1;
			return polyFindIndex(this.data.vessels, function(v){
                return v.mmsi==vessel.mmsi && v.imo==vessel.imo;
            })
		},
		
        _isDirty: true,
        getDirty: function(){return this._isDirty},
        setDirty: function(){this._isDirty = true},
        _parseFilter: function(filter){
            var vessels = [];
            var attributes = filter.toLowerCase().replace(/and \[ts_pos_utc\].+$/, "").split("or");
//console.log(attributes);
            var myRe = /\[*([^\[\]=]+)\]*=([^ \)]+)\)? *\)?( |$)/ig;
            var myArray;
            for (var i=0; i<attributes.length; ++i){
                var vessel = null;
                while ((myArray = myRe.exec(attributes[i])) !== null) {
                    if (!vessel) vessel = {};
                    vessel[myArray[1]] = myArray[2];
                }
                if (vessel)
                    vessels.push(vessel);
            }  
//console.log(vessels);   
            return vessels;  
        },
        getCount: function(){
            return this.data ? this.data.vessels.length : 0;
        },
        layers: [],
        load: function(){
            var _this = this;
            //var layerId = myFleetLayers

            if (myFleetLayers.length==0)
                this.data = {msg:[{txt:_gtxt("AISSearch2.nomyfleet")}]};

            if (myFleetLayers.length==0 || !this._isDirty)
                return Promise.resolve();

            this.layers = [];
            var errors = [],
                promises = myFleetLayers.map(function(lid){return new Promise(function(resolve, reject) {
                        sendCrossDomainJSONRequest(baseUrl + "Layer/GetLayerInfo.ashx?NeedAttrValues=false&LayerName=" +
                        lid, function(response){   
//console.log(response);                         
                            if (response.Status.toLowerCase()=="ok")
                                _this.layers.push({layerId:lid, parentLayerId:response.Result.ParentLayer, filter:response.Result.Filter});
                            else
                                errors.push(response);
                            resolve(response); 
                        }); 
                    })})
                
            return Promise.all(promises)
            .then(function() { 
//console.log(_this.layers)                                    
                            if (_this.layers.length>0){
                                var layer = polyFind(_this.layers, function(l){return l.parentLayerId!='13E2051DFEE04EEF997DC5733BD69A15' && l.filter!="([mmsi]=-1000)";})// NOT TRACKS
//console.log(layer)      
                                if (!layer)
                                    return Promise.resolve({Status:"ok", Result:{values:[]}});
//console.log(layer.filter)                                    
                                var vessels = _this._parseFilter(layer.filter);
                                return new Promise(function(resolve, reject) {
                                    aisLayerSearcher.searchNames(
                                        vessels,
                                        //vessels.map(function(v){return v.mmsi}), 
                                        //vessels.map(function(v){return v.imo}),
                                        function(response){ 
                                            resolve(response);
                                        });
                                });
                            }
                            else{
                                return Promise.resolve({Status:"error", ErrorInfo:errors});
                            }
                        }
            )
            .then(function(response) {  
//console.log(response)  
//console.log("LOAD MY FLEET FINISH")               
                        if (response.Status.toLowerCase()=="ok"){                          
                            _this.data = {vessels:response.Result.values.reduce(function(p,c){
								var mmsi = response.Result.fields.indexOf("mmsi"), 
								vessel_name = response.Result.fields.indexOf("vessel_name"), 
								ts_pos_utc = response.Result.fields.indexOf("ts_pos_utc"),
								imo = response.Result.fields.indexOf("imo"),
								lat = response.Result.fields.indexOf("longitude"),
								lon = response.Result.fields.indexOf("latitude");
                                if (!p.some(function(v){return v.mmsi==c[mmsi]})) {
                                    var d = new Date(c[ts_pos_utc]*1000);
                                    p.push({vessel_name:c[vessel_name], mmsi:c[mmsi], imo:c[imo], ts_pos_utc: aisLayerSearcher.formatDate(d),
                                    xmin:c[lat], xmax:c[lat], ymin:c[lon], ymax:c[lon]}); 
                                }
                                return p;
                            }, [])}; 
							_this.data.vessels.sort(function(a,b){return +(a.vessel_name > b.vessel_name) || +(a.vessel_name === b.vessel_name) - 1;})
                            _this._isDirty = false;                         
                            return Promise.resolve(); 
                        }
                        else{                                           
                            return Promise.reject(response); 
                        }
                    });
        },
        update: function(){
            var _this = this;
            this._actualUpdate = new Date();
            var actualUpdate = this._actualUpdate;
            this.load().then(function(){
//console.log(_this.layers)
                if (_this._actualUpdate==actualUpdate)
                    myFleetMembersView.repaint();
            }, function(response){
                _this.data = null;
                if (response.Status.toLowerCase()=="auth" || 
                    (response.ErrorInfo && response.ErrorInfo.some && response.ErrorInfo.some(function(r){return r.Status.toLowerCase()=="auth"})))
                    _this.data = {msg:[{txt:_gtxt("AISSearch2.auth")}], vessels:[]};
                else{
                    console.log(response);
                }
                myFleetMembersView.repaint();              
            });
        },
        markMembers:function(vessels){
            if (this.data && this.data.vessels)
            this.data.vessels.forEach(function(v){
                var member = polyFind(vessels, function(vv){return v.mmsi==vv.mmsi && v.imo==v.imo});
                if (member)
                    member.mf_member = "display:inline";
            });
        },
        // Layer filter example "(([mmsi]=273452320 and [imo]=8971059) or ([mmsi]=273349220 and [imo]=8811015)) and [ts_pos_utc]>=2017-07-08"
        changeFilter: function(vessel){
//console.log(this.data);
            var add = true, temp = {vessels:[]}, vessels = this.data.vessels;
            for (var i=0; i< this.data.vessels.length; ++i){
                if ( this.data.vessels[i].imo==vessel.imo &&  this.data.vessels[i].mmsi==vessel.mmsi)
                    add = false;
                else
                    temp.vessels.push(this.data.vessels[i]);
            }
            if (add)
                    temp.vessels.push(vessel);
            this.data = temp;
            var _this = this;
            this.layers.forEach(function(layer){
                layer.filter = _this.data.vessels.length==0?
                "([mmsi]=-1000)":
                _this.data.vessels.map(function(v){
                    return layer.parentLayerId!='13E2051DFEE04EEF997DC5733BD69A15'? // IS TRACKS
                    "([mmsi]="+v.mmsi+" and [imo]="+v.imo+")":
                    "([mmsi]="+v.mmsi+")";
                }).join(" or ");

                /*
                        var editFilter = layer.parentLayerId!='13E2051DFEE04EEF997DC5733BD69A15'? // IS TRACKS
                        "([mmsi]="+vessel.mmsi+" and [imo]="+vessel.imo+")":
                        "([mmsi]="+vessel.mmsi+")";
                        if(layer.filter.search(/(mmsi|imo)/i)!=-1){

                            var conditions = layer.filter.replace(/\( *(\(.+\)) *\).*$/, "$1").split(" or "),
                            pos = conditions.indexOf(editFilter);
//console.log(conditions)
                            if (pos!=-1)
                                conditions.splice(pos, 1);
                            else
                                conditions.push(editFilter);
                            if (conditions.length>0)
                                layer.filter = conditions.join(" or ");
                            else
                                layer.filter = "(1=0)";
                        }
                        else{
                            layer.filter = editFilter;
                        }
                */
                var today = new Date(new Date()-3600*24*7*1000);
                today = today.getFullYear()+"-"+("0"+(today.getMonth()+1)).slice(-2)+"-"+("0"+today.getDate()).slice(-2);
				if (layer.filter!="([mmsi]=-1000)"){
					if (layer.parentLayerId!='13E2051DFEE04EEF997DC5733BD69A15')
						layer.filter = "("+layer.filter+") and [ts_pos_utc]>='"+ today +"'";
					else
						layer.filter = "("+layer.filter+") and [Date]>='"+ today +"'";
				}
//console.log(layer.filter)
            });
            return Promise.all(this.layers.map(function(l){
                /* return new Promise(function(resolve){
                    var t = setTimeout(function(){
                        resolve();
                    }, 1000);
                });
               */
                        return new Promise(function(resolve, reject) {
                        sendCrossDomainJSONRequest(baseUrl + 
                        "VectorLayer/Update.ashx?VectorLayerID="+l.layerId+"&filter=" +
                        l.filter, function(response){
                            if (response.Status.toLowerCase() == "ok") 
                                setTimeout(function run() {

                                    sendCrossDomainJSONRequest(baseUrl + 
                                    "AsyncTask.ashx?TaskID="+response.Result.TaskID, function(response){
                                        if (response.Status.toLowerCase() == "ok") 
                                            if (!response.Result.Completed)
                                                setTimeout(run, 1000);
                                            else{
                                                if(response.Result.ErorInfo){
                                                    console.log(response)
                                                    reject();
                                                }
                                                else
                                                    resolve();
                                        }
                                        else{
                                            console.log(response)
                                            reject();
                                        }

                                    });
                                }, 1000);
                            else{
                                console.log(response);
                                reject();
                            }
                        }); 
                        });
                
                    })
            ).then(
            //return Promise.resolve().then(
            function(){
                this._isDirty = true;
//console.log(this.data);
                L.gmx.layersVersion.chkVersion();
                return Promise.resolve();
            }.bind(this),
            function(){
                return Promise.reject();
            });
        }
    }; 
}	
