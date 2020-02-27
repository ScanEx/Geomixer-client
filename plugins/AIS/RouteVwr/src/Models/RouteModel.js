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
            return Request.fetchRequest(
                '/VectorLayer/Search.ashx',
                'layer=910325DE5E544C6A87F1CFB3DE13BCF5&out_cs=EPSG:4326&columns=[{"Value":"*"}]&orderby=calc_etd&orderdirection=desc&query="vessel_mmsi"=' + this.view.vessel.mmsi,
                'POST'
            )
            .then(r => r.json());           
        },
        update: function () {
            if (!this.isDirty)
                return;
//console.log(this.view.vessel)
            this.view.inProgress(true);
            this.load().then((r => {
//console.log(r)
                    if (r.Status && r.Status.toLowerCase() == 'ok' && r.Result) {
                        _selectVessel = r.Result.values.map(v => { return { mmsi: v[0], name: v[1] } });
                        this.data.routes = [];
                        let routes = this.data.routes;
                        r.Result.values.forEach(v => {
                            let route = {};
                            r.Result.fields.forEach((f, i) => {
                                if (f=='calc_etd' || f=='calc_eta'){ 
                                    let d = new Date(v[i]*1000);
                                    d.setHours(d.getHours() + d.getTimezoneOffset()/60);
                                    route[f] = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`                       
                                }
                                else
                                    route[f] = v[i];
                            })
                            routes.push(route);
                        });
                    }
                    else {
                        this.data.msg = 'hello';
                        console.log(r);
                    }
console.log(this.data)

                    this.view.inProgress(false)
                    this.view.repaint();
                    this.isDirty = false;
                }).bind(this)); 


        }

    };
}
