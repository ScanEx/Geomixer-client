const Request = require('../../../Common/Request');

module.exports = function (options) {
    const _data = {tracks:[]};        
    const _layerName = options.layer;

    return {
        isDirty: false,
        get data() { return _data },
        set data(value) { _data = value; },
        update: function () {
            const thisModel = this;
            return Promise.resolve().then(()=>{
                if (thisModel.isDirty)
                {
                    thisModel.view.inProgress(true); 
                    _data.tracks.length = 0;   
                    _data.tracks.msg = 0;                          
                    return Request.searchRequest({
                        layer: thisModel.view.trackLayer.id,
                        orderdirection: 'desc',
                        orderby: thisModel.view.trackLayer.sort,
                        columns: thisModel.view.trackLayer.columns,
                        query: thisModel.view.trackLayer.query
                    }, 'POST').then(r=>{
console.log(r)
                        _data.total = r.values.length;
                        r.values.forEach(p=>{
                            let data = thisModel.view.trackLayer.parseData(r.fields, p),
                                lastTrack = _data.tracks[_data.tracks.length-1];
                            if (!lastTrack || lastTrack.positions[0].utc_date!=data.utc_date){
                                lastTrack = {utc_date: data.utc_date, positions: []};
                                _data.tracks.push(lastTrack);
                            }
                            lastTrack.positions.push(data);
                        });
                    });
                    // return new Promise(resolve=>{ // Load
                    //     setTimeout(()=>{
                    //         _data.msg = [{txt:'HELLO'}];
                    //         resolve();
                    //     }, 2000);
                    // }).catch(console.log);
                } // if (thisModel.isDirty)
            }).then(()=>{               
                    thisModel.view.repaint();
                    thisModel.isDirty = false;
            });

        } // this.update
    };
}