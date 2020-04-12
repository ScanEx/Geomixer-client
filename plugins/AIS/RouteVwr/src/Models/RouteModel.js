const Request = require('../Request');

module.exports = function (options) {

    const _lmap = nsGmx.leafletMap,
        _tracks = [], _vmarkers = [];

    const _data = {routes:[], msg:[]}; 
    return {
        isDirty: false,
        get data() { return _data },
        set data(value) { _data = value; },
        load: function(){
            if (!this.view.vessel)
                return Promise.resolve({Status: 'error', ErrorInfo: 'no vessels'});
                
            return Request.fetchRequest(
                '/VectorLayer/Search.ashx',
                'layer=910325DE5E544C6A87F1CFB3DE13BCF5&out_cs=EPSG:4326&columns=[{"Value":"*"}]&orderby=calc_etd&orderdirection=desc&query="vessel_mmsi"=' + this.view.vessel.mmsi,
                'POST'
            )
            .then(r => r.json());           
        },
        update: function () {
//console.log('UPDATE', this.isDirty)   
            if (!this.isDirty)
                return;
//console.log(this.view.vessel)
            this.view.inProgress(true);
            this.load().then((r => {
//console.log(r)

                    this.data.routes.length = 0;
                    const routes = this.data.routes,
                          markersPromise = Promise.resolve();
                    const checkResponse = function(r){
                        return r.Status && r.Status.toLowerCase() == 'ok' && r.Result;
                    };
                    if (checkResponse(r)) {
                        r.Result.values.forEach(v => {
                            let route = {};
                            r.Result.fields.forEach((f, i) => {
                                if (f=='calc_etd' || f=='calc_eta'){ 
                                    let d = new Date(v[i]*1000);
                                    d.setHours(d.getHours() + d.getTimezoneOffset()/60);
                                    route[f] = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`                       
                                }
                                else if (f=='vessel_voyage')
                                    markersPromise.then(r=>{  
                                        route[f] = v[i];
                                        const vessel_voyage = route[f];
                                        return Request.fetchRequest(
                                        '/VectorLayer/Search.ashx',
                                        `layer=D76844C98D26445B8E3D56C9CAA5480E&query="vessel_voyage"='${vessel_voyage}'`,
                                        'POST'
                                        );
                                    })
                                    .then(r=>r.json())
                                    .then(r=>{
                                        if (checkResponse(r)){
//console.log(r)
                                            if (route.markers)
                                                route.markers.length = 0;
                                            else
                                                route.markers = []; 
                                            r.Result.values.forEach(v=>{                                           
                                                let marker = {};
                                                r.Result.fields.forEach((f, i)=>{
                                                    if (r.Result.types[i]=='datetime' && v[i]){
                                                        let d = new Date(v[i]*1000);
                                                        d.setHours(d.getHours() + d.getTimezoneOffset()/60);
                                                        marker[f]= `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`  
                                                    }
                                                    else
                                                        marker[f] = v[i];
                                                });
                                                route.markers.push(marker);
                                            });
                                        }
                                        else{
                                            this.data.msg = 'error';
                                            console.log(route[f], r);
                                        }
                                        return Promise.resolve();
                                    })
                                else
                                    route[f] = v[i];
                            });
                            routes.push(route);
                        });
                    }
                    else {
                        this.data.msg = 'error';
                        console.log(r);
                    }
                    return markersPromise;
                }).bind(this))
                .then((r=>{
//console.log(this.data)
                    this.view.inProgress(false)
                    this.view.repaint();
                    this.isDirty = false;
                }).bind(this)); 


        }

    };
}
