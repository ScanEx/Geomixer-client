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

    const _initPromise = new Promise((resolve, reject)=>{
        const layer = nsGmx.gmxMap.layersByID[_layerName];
        if (!layer){
            reject('HardNavigation plugin error: no layer ' + _layerName);
            return;
        }
        const props = nsGmx.gmxMap.layersByID[_layerName]._gmx.properties,
        columns = [];
        props.attributes.forEach((a,i)=>{
            columns.push({Name:a,ColumnSimpleType:props.attrTypes[i],IsPrimary:false,IsIdentity:false,IsComputed:false,expression:`"${a}"`});
        });
        if (props.attributes.indexOf("Name")<0)
            columns.push({Name:'Name',ColumnSimpleType:'String',IsPrimary:false,IsIdentity:false,IsComputed:false,expression:'"Name"'});
        if (props.attributes.indexOf("Type") < 0)
            columns.push({ Name: 'Type', ColumnSimpleType: 'String', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"Type"' });
        if (props.attributes.indexOf("Date") < 0)
            columns.push({ Name: 'Date', ColumnSimpleType: 'Date', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"Date"' });
        if (props.attributes.indexOf("Time") < 0)
            columns.push({ Name: 'Time', ColumnSimpleType: 'Time', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"Time"' });
        if (props.attributes.indexOf("DateChange") < 0)
            columns.push({ Name: 'DateChange', ColumnSimpleType: 'Date', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"DateChange"' });
        if (props.attributes.indexOf("TimeChange") < 0)
            columns.push({ Name: 'TimeChange', ColumnSimpleType: 'Time', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"TimeChange"' });
        if (props.attributes.indexOf("State") < 0)
            columns.push({ Name: 'State', ColumnSimpleType: 'String', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"State"' });
        if (props.attributes.indexOf("Origin") < 0)
            columns.push({ Name: 'Origin', ColumnSimpleType: 'String', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"Origin"' });
        if (props.attributes.indexOf("_mediadescript_") < 0)
            columns.push({ Name: '_mediadescript_', ColumnSimpleType: 'String', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"_mediadescript_"' });

        if (columns.length==props.attributes.length){
            resolve(columns.length); 
        }
        else{       
            const def = nsGmx.asyncTaskManager.sendGmxPostRequest(serverBase + "VectorLayer/Update.ashx", {
                VectorLayerID: _layerName, 
                MetaProperties: JSON.stringify({mediaDescField:{Type:"String",Value:"_mediadescript_"}}),
                Columns: JSON.stringify(columns)}); 
            def.promise().done(r=>resolve(columns.length)).fail(r=>reject(r));
        }
    });

    return {

        isDirty: true,
        updatePromise: Promise.resolved,
        get data() { return _data },
        set data(value) { _data = value; },
        get pagesTotal() { return Math.ceil(_count/_pageSize); },
        set page(value) { 
            if (value<0){
                return;
            }
            if (this.pagesTotal>0 && value>=this.pagesTotal){
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

            _initPromise.then((test)=>{
//console.log(test)
                _count = 0;
                _data.regions.length = 0;
                thisModel.view.inProgress(true);
                thisModel.updatePromise = [function(r){
                    return new Promise((resolve, reject) => {
                        sendCrossDomainJSONRequest(`${window.serverBase}VectorLayer/Search.ashx?Layer=${_layerName}&count=true`, r=>
                            resolve(r)
                        );
                    });
                }, function(r){
                    if (_checkResponse(r)){
                        _count = parseInt(r.Result);
                        //return new Promise((resolve, reject) => {
                        sendCrossDomainJSONRequest(`${window.serverBase}VectorLayer/Search.ashx?Layer=${_layerName}&orderby=gmx_id&orderdirection=DESC&pagesize=${_pageSize}&page=${_page}`, r=>{
                            _data.regions.length = 0;                        
                            if (_checkResponse(r)){
                                //resolve(r); 
                                let result = r.Result,
                                    format = function(d, t){   
                                        if (!d || !t || isNaN(d) || isNaN(t)) 
                                            return '';
                                        let dt = new Date(d*1000 + t*1000 + new Date().getTimezoneOffset()*60*1000);
                                        return `${dt.toLocaleDateString()}<br>${dt.toLocaleTimeString()}`
                                    };
                                _data.fields = result.fields.map(f=>f);
                                for (let i=0; i<result.values.length; ++i){
                                    let reg = {};
                                    for (let j =0; j<result.fields.length; ++j)
                                        reg[result.fields[j]] = result.values[i][j];
                                    reg.id = (reg.Origin && reg.Origin!='') ? reg.Origin : reg.gmx_id;
                                    reg.DateTime = format(reg.Date, reg.Time);
                                    //reg.DateTimeChange = reg.DateChange ? format(reg.DateChange, reg.TimeChange) : format(reg.Date, reg.Time);
                                    reg.DateTimeChange = format(reg.DateChange, reg.TimeChange);
                                    reg.StateColor = reg.State.search(/\barchive\b/)!=-1?"color-red":"color-green";
                                    _data.regions.push(reg);
                                }
    //console.log(_data);
                            }
                            else
                                console.log(r)
                            thisModel.view.repaint();
                            thisModel.isDirty = false;
                            //resolve();
                        });
                        //});
                    }
                    else{
                        console.log(r)
                        thisModel.view.repaint();
                        thisModel.isDirty = false;
                    }
                }]
                .reduce((p, c)=>p.then(c), Promise.resolve());
            })
            .catch(error=>{
                thisModel.data.msg = [{txt:_gtxt('HardNavigation.layer_error')}];
                console.log(error);
                thisModel.view.repaint();
                thisModel.isDirty = false;
            }); // _initPromise
        } // this.update
    };
}