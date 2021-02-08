//const Request = require('../Request');

//////////////////////////


module.exports = function (options) {

    const 
        _lmap = nsGmx.leafletMap, 
        _dataChanged = function(){
            _data.result = null;
            this.isDirty = true;
            this.update();
        }
        _data = {
        system:'', 
        interval:null, 
        polygon:null, 
        result: null
    };
  
    return {
        set interval(v){
            if (!_data.interval){
                _data.interval = v;
                _data.interval.on('change', ()=>{
                    _dataChanged.call(this);
                });
            }
        },
        set system(v){
            _data.system = v;
            _dataChanged.call(this);
        },
        set polygon(v){
            _data.polygon = v;
            //v.on('remove', console.log)
            _dataChanged.call(this);
        },
        isDirty: true,
        get data() { return _data },
        set data(value) { _data = value; },
        update: function () {
//console.log('IMC UPDATE', _data, this.isDirty)
            if (!this.isDirty)
                return;

            const thisModel = this;
            return Promise.resolve().then(()=>{
                thisModel.view.repaint();  
                thisModel.isDirty = false;
            });

        }, // this.update
        count: function(){
            const _thisModel = this, p = this.data.polygon, s = this.data.system;
            if (!p){
                return Promise.reject('polygon');
            }
            if (!s){
                return Promise.reject('system');
            }
            else{
                const params = {
                    WrapStyle:'message', layer: s,
                    query:p.feature.geometry.type=='Polygon'?`intersects([geomixergeojson], GeometryFromGeoJson('{"type":"${p.feature.geometry.type}","coordinates":[${p.feature.geometry.coordinates.map(a=>`[${a.map(c=>`[${c[0]},${c[1]}]`).join(',')}]`).join(',')}]}', 4326)) and [acqdate]>='07.02.2021' and [acqdate]<='07.02.2021'`:
`intersects([geomixergeojson], GeometryFromGeoJson('{"type":"${p.feature.geometry.type}","coordinates":[${p.feature.geometry.coordinates.map(a=>`[${a.map(v=>`[${v.map(c=>`[${c[0]},${c[1]}]`).join(',')}]`).join(',')}]`).join(',')}]}', 4326)) and [acqdate]>='07.02.2021' and [acqdate]<='07.02.2021'`
            }
console.log(params)

                return new Promise(resolve=>{
                    //setTimeout(
                        sendCrossDomainPostRequest(
                            'https://geomixer.scanex.ru/VectorLayer/Search.ashx',
                            params, response=>{
                                console.log(response)
                        _data.result = 0;
                        _thisModel.isDirty = true;
                        _thisModel.update();
                        resolve();
                    });
                    //}, 1000);
                });
            }
        }
    };
}