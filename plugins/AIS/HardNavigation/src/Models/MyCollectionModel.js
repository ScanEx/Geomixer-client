const Polyfill = require('../Polyfill');
module.exports = function (options) {
    let _actualUpdate,
        _data,
        _page = 0,
        _pageSize = 14, 
        _count = 0;
        
    const _layerName = options.layer,
    _checkResponse = function(r){return (r && r.Status && r.Status.toLowerCase()=='ok');};
    if (!_data)
        _data = { regions: [] }; 

    return {
        isDirty: true,
        get data() { return _data },
        set data(value) { _data = value; },
        get pagesTotal() { return Math.ceil(_count/_pageSize); },
        set page(value) { 
            if (value<0){
                return;
            }
            if (value>=this.pagesTotal){
                return;
            }
            _page = value; 
            this.isDirty = true;
            this.update();
        },
        get page() { return _page; },
        previousPage: function(){
            if (!this.isDirty)
                this.page = _page - 1;
        },
        nextPage: function(){
            if (!this.isDirty)
                this.page = _page + 1;
        },
        update: function () {
            const thisModel = this;
            if (!thisModel.isDirty)
                return;
            _count = 0;
            _data.regions.length = 0;
            thisModel.view.inProgress(true);
            [function(r){
                return new Promise((resolve, reject) => {
                    sendCrossDomainJSONRequest(`${window.serverBase}VectorLayer/Search.ashx?Layer=${_layerName}&count=true`, r=>
                        resolve(r)
                    );
                });
            }, function(r){
                if (_checkResponse(r)){
                    _count = parseInt(r.Result);
                    sendCrossDomainJSONRequest(`${window.serverBase}VectorLayer/Search.ashx?Layer=${_layerName}&orderby=gmx_id&orderdirection=DESC&pagesize=${_pageSize}&page=${_page}`, r=>{
                        if (_checkResponse(r)){
                            //resolve(r); 
                            let result = r.Result,
                                format = function(d, t){   
                                    if (!d || !t || isNaN(d) || isNaN(t)) 
                                        return '';
                                    let dt = new Date(d*1000 + t*1000 + new Date().getTimezoneOffset()*60*1000);
                                    return `${dt.toLocaleDateString()}<br>${dt.toLocaleTimeString()}`
                                };
                            for (let i=0; i<result.values.length; ++i){
                                let reg = {};
                                for (let j =0; j<result.fields.length; ++j)
                                    reg[result.fields[j]] = result.values[i][j];
                                reg.id = reg.gmx_id + ((reg.Origin && reg.Origin!='')?'_':'') + reg.Origin;
                                reg.DateTime = format(reg.Date, reg.Time);
                                reg.DateTimeChange = format(reg.DateChange, reg.TimeChange);
                                reg.StateColor = reg.State=="archive"?"color-red":"color-green";
                                _data.regions.push(reg);
                            }
//console.log(_data);
                        }
                        else
                            console.log(r)
                        thisModel.view.repaint();
                        thisModel.isDirty = false;
                    });
                }
                else{
                    console.log(r)
                    thisModel.view.repaint();
                    thisModel.isDirty = false;
                }
            }]
            .reduce((p, c)=>p.then(c), Promise.resolve());
        }
    };
}