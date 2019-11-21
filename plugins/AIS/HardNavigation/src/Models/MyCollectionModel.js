const Polyfill = require('../Polyfill');
module.exports = function (options) {
    let _actualUpdate,
        _data,
        _page = 0,
        _pageSize = 12, 
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
            columns.push({Name:a,OldName:a,ColumnSimpleType:props.attrTypes[i],IsPrimary:false,IsIdentity:false,IsComputed:false,expression:`"${a}"`});
        });
        if (props.attributes.indexOf("Name")<0)
            columns.push({Name:'Name', ColumnSimpleType:'String',IsPrimary:false,IsIdentity:false,IsComputed:false,expression:'"Name"'});
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
        
        if (props.attributes.indexOf("NextDateChange") < 0)
            columns.push({ Name: 'NextDateChange', ColumnSimpleType: 'Date', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"NextDateChange"' });
        if (props.attributes.indexOf("NextTimeChange") < 0)
            columns.push({ Name: 'NextTimeChange', ColumnSimpleType: 'Time', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"NextTimeChange"' });
        
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
            this.updatePromise = this.update();
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
        displayCondition: function(dtBegin, dtEnd){
            return `"Date"<'${dtEnd}' and ("DateChange" is null or "DateChange"<'${dtEnd}') and (("NextDateChange" is null and ("State"<>'archive' or ("Date">='${dtBegin}' and "DateChange" is null) or "DateChange">='${dtBegin}')) or "NextDateChange">='${dtEnd}')`;
        },
        update: function () {
            const thisModel = this;
            if (!thisModel.isDirty)
                return;

            const mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
                  formatDt = function (dt) { return `${dt.getFullYear()}-${('0' + (dt.getMonth() + 1)).slice(-2)}-${('0' + dt.getDate()).slice(-2)}` },
                  dtBegin = formatDt(mapDateInterval.get('dateBegin')),
                  dtEnd = formatDt(mapDateInterval.get('dateEnd')),
                  queryStr = thisModel.displayCondition(dtBegin, dtEnd);

            return _initPromise.then((test)=>{
//console.log(test)
                _count = 0;
                _data.regions.length = 0;
                thisModel.view.inProgress(true);
                return [
                function(r){
                    return new Promise((resolve, reject) => {
                        sendCrossDomainJSONRequest(`${window.serverBase}VectorLayer/Search.ashx?Layer=${_layerName}&count=true` + 
                        `&query=${queryStr}`, r=>
                            resolve(r)
                        );
                    });
                },
                function(r){
                    return new Promise((resolve, reject) => {
                        _data.regions.length = 0;
//console.log(r)
                        if (_checkResponse(r)){
                                _count = parseInt(r.Result);
                                sendCrossDomainJSONRequest(`${window.serverBase}VectorLayer/Search.ashx?Layer=${_layerName}&orderby=gmx_id&orderdirection=DESC&pagesize=${_pageSize}&page=${_page}` +
                                    `&query=${queryStr}`, 
                                    r => {                                        
                                        if (_checkResponse(r)) {
                                            let result = r.Result,
                                                format = function (d, t) {
                                                    if (!d || !t || isNaN(d) || isNaN(t))
                                                        return '';
                                                    let dt = new Date(d * 1000 + t * 1000 + new Date().getTimezoneOffset() * 60 * 1000);
                                                    return `${dt.toLocaleDateString()}<br>${dt.toLocaleTimeString()}`
                                                };
                                            _data.fields = result.fields.map(f => f);
                                            for (let i = 0; i < result.values.length; ++i) {
                                                let reg = {};
                                                for (let j = 0; j < result.fields.length; ++j)
                                                    reg[result.fields[j]] = result.values[i][j];
                                                reg.id = (reg.Origin && reg.Origin != '') ? reg.Origin : reg.gmx_id;
                                                reg.DateTime = format(reg.Date, reg.Time);
                                                //reg.DateTimeChange = reg.DateChange ? format(reg.DateChange, reg.TimeChange) : format(reg.Date, reg.Time);
                                                reg.DateTimeChange = format(reg.DateChange, reg.TimeChange);
                                                //const temp = new Date(), checkChange = reg.DateChange || reg.Date, today = Date.UTC(temp.getUTCFullYear(), temp.getUTCMonth(), temp.getUTCDate()) / 1000;
//console.log(checkChange, today)
                                                //reg.StateColor = reg.State.search(/\barchive\b/) != -1 ? "color-blue" : (checkChange == today ? "color-red" : "color-yellow");
                                                reg.StateColor = reg.State == 'archive' ? "color-blue" : (reg.State == 'active1' ? "color-red" : "color-yellow");
                                                _data.regions.push(reg);
                                            }
//console.log(_data);                  
                                            resolve(_data.regions);
                                        }
                                        else
                                            console.log(r);
                                        thisModel.view.repaint();
                                        thisModel.isDirty = false;
                            });
                        }
                        else {
                            resolve(_data.regions);
                            console.log(r)
                            thisModel.view.repaint();
                            thisModel.isDirty = false;
                        }  
                    });
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