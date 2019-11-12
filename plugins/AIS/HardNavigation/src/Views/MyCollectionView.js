require("./MyCollection.css")
const BaseView = require('./BaseView.js');

let _stateUI = '',
_createBut, _chooseBut,        
_layer, 
_thisView,
_hidden = {},
_visible = {};

const MyCollectionView = function ({ model, layer }) {
    _thisView = this;

        _layer = nsGmx.gmxMap.layersByID[layer];
        if (!_layer){
            model.isDirty = false;
            return;
        }

        nsGmx.widgets.commonCalendar.getDateInterval().on('change', e=>{
            _hidden = {};
            _visible = {};
            _layer.repaint(); 
            if (!_thisView.isVisible){
                //_thisView.repaint();
                _thisView.inProgress(true);
                _thisView.model.isDirty = true;
            }
        });
        _layer.setFilter(_isVisible);

        BaseView.call(this, model);
        this.frame = $(Handlebars.compile(`<div class="hardnav-view">
            <div class="header">
                <table border=0>
                <tr><td class="hint" colspan="2">${_gtxt('HardNavigation.instr_hint')}</td>
                <td><div class="refresh"><div style="display:none">${this.gifLoader}</div></div></td></tr>
                </table> 

                <table border=0 class="instruments unselectable">
                <tr>
                    <td class="but choose"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#selectreg"></use></svg>${_gtxt('HardNavigation.choose_reg')}</td>
                    <td class="but create"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#polygon"></use></svg>${_gtxt('HardNavigation.create_reg')}</td>
                </tr>
                </table> 

                <div class="calendar"></div>

                <table border=0 class="grid-header">
                <tr><td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></svg></td>
                <td>${_gtxt('HardNavigation.reg_id')}</td>
                <td>${_gtxt('HardNavigation.reg_created')}</td>
                <td>${_gtxt('HardNavigation.reg_updated')}</td>
                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>
                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>
                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>
                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td></tr>
                </table> 
            </div> 
            <div class="grid">

            </div>
            <div class="footer unselectable">
                <table border=0 class="pager">
                    <tr><td class="but arrow arrow-prev"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-left"></use></svg></td>
                    <td class="current">${_gtxt('HardNavigation.page_lbl')} <span class="pages"></span></td>
                    <td class="but arrow arrow-next"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-right"></use></svg></td></tr>
                </table>  
                <div class="but but-attributes">${_gtxt('HardNavigation.attr_tbl')}</div>          
            </div>
            </div>`
        )());
        _addCalendar.call(this);

        this.container = this.frame.find('.grid');
        this.footer = this.frame.find('.footer');

        this.tableTemplate = '<table border=0 class="grid">{{#each regions}}<tr id="{{gmx_id}}">' +                
                '<td class="visibility">' +
                '<svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></svg>' +
                '<svg style="display:none"><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye-off"></use></svg></td>' +
                '<td class="identity">{{id}}</td>' +
                '<td class="identity">{{{DateTime}}}</td>' +
                '<td>{{{DateTimeChange}}}</td>' +
                '<td class="{{StateColor}} state"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#circle"></use></svg></td>' +
                '<td class="edit"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#pen"></use></svg></td>' +
                '<td class="show"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#target"></use></svg></td>' +
                '<td class="info"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#info"></use></svg></td>' +
            '</tr>{{/each}}</table>' +
            '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';

        Object.defineProperty(this, "topOffset", {
            get: function () { 
                return this.frame.find('.header')[0].getBoundingClientRect().height;
            }
        });  
        Object.defineProperty(this, "bottomOffset", {
            get: function () {             
                return this.frame.find('.footer')[0].getBoundingClientRect().height;
            }
        }); 

        _chooseBut = this.frame.find('.but.choose');
        _createBut = this.frame.find('.but.create');       
        _chooseBut.on('click', _copyRegion.bind(this));      
        _createBut.on('click', _createRegion.bind(this));
             
        this.frame.find('.but.arrow-prev').on('click', this.model.previousPage.bind(this.model));      
        this.frame.find('.but.arrow-next').on('click', this.model.nextPage.bind(this.model));
        this.frame.find('.but.but-attributes').on('click', ()=>nsGmx.createAttributesTable(layer));

    },  
    
    _isActual = function(reg){
        const mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
            atttributes = _layer.getGmxProperties().attributes,
            iOrigin = atttributes.indexOf("Origin") + 1,
            iState = atttributes.indexOf("State") + 1,
            iDate = atttributes.indexOf("Date") + 1,
            iTime = atttributes.indexOf("Time") + 1,
            iDateChange = atttributes.indexOf("DateChange") + 1,
            iTimeChange = atttributes.indexOf("TimeChange") + 1,
            iNextDatetCh = atttributes.indexOf("NextDateChange") + 1,
            iNextTimeCh = atttributes.indexOf("NextTimeChange") + 1,
            id = reg.properties[iOrigin] == '' ? reg.properties[0].toString() : reg.properties[iOrigin],
            state = !reg.properties[iState] ? '' : reg.properties[atttributes.indexOf("State") + 1],
            dtBegin = mapDateInterval.get('dateBegin').getTime(),
            dtEnd = mapDateInterval.get('dateEnd').getTime();

        let curVer = {d:reg.properties[iDateChange] * 1000, t:reg.properties[iTimeChange] * 1000, get dt(){return this.d+this.t;}},
            nextVer = {d:reg.properties[iNextDatetCh] * 1000, t:reg.properties[iNextTimeCh] * 1000, get dt(){return this.d+this.t;}};
        if (curVer.d === 0){
            curVer.d = reg.properties[iDate] * 1000;
            curVer.t = reg.properties[iTime] * 1000;
        }

        if (curVer.dt<dtEnd){
            if (nextVer.d==0 && (state.search(/archive/)<0 || curVer.dt>=dtBegin))
                return true;
            else if (nextVer.dt>=dtEnd)
                   return true;
            else 
                return false;
        }
        else
            return false;
    },
    _isActual0 = function(reg){
        const mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
            atttributes = _layer.getGmxProperties().attributes,
            iOrigin = atttributes.indexOf("Origin") + 1,
            iState = atttributes.indexOf("State") + 1,
            iDate = atttributes.indexOf("Date") + 1,
            iTime = atttributes.indexOf("Time") + 1,
            iDateChange = atttributes.indexOf("DateChange") + 1,
            iTimeChange = atttributes.indexOf("TimeChange") + 1,
            id = reg.properties[iOrigin] == '' ? reg.properties[0].toString() : reg.properties[iOrigin],
            state = !reg.properties[iState] ? '' : reg.properties[atttributes.indexOf("State") + 1],
            dtBegin = mapDateInterval.get('dateBegin').getTime(),
            dtEnd = mapDateInterval.get('dateEnd').getTime();

        let version = {d:reg.properties[iDateChange] * 1000, t:reg.properties[iTimeChange] * 1000};
        if (version.d === 0){
            version.d = reg.properties[iDate] * 1000;
            version.t = reg.properties[iTime] * 1000;
        }
 
//console.log(`>>${id}`, version, version.d < dtEnd)
        if (version.d < dtEnd){
            let test = true, isLatest = true;               
            // Search region of same id and the more late version on a certain moment
            for(let key in _layer.getDataManager()._activeTileKeys) { 
                test = true;
                let data = _layer.getDataManager()._tiles[key].tile.data;
                if (data)
                for(let i=0; i<data.length; ++i){
                    let curId = data[i][iOrigin] != '' ? data[i][iOrigin] : data[i][0],
                        curVersion = { d: data[i][iDateChange] * 1000, t: data[i][iTimeChange] * 1000 };
                    if (curVersion.d == 0)
                        curVersion = { d: data[i][iDate] * 1000, t: data[i][iTime] * 1000 };
                    if (curId != id) continue;
                    if (curVersion.d >= dtEnd) {isLatest = false; continue;}
                    test = !(version.d < curVersion.d || (version.d == curVersion.d && version.t < curVersion.t));
                    if (!test) {
//console.log(curId, curVersion)
                        break;
                    }
                }
                if (!test) break;
            }
            if (test && isLatest && state.search(/archive/)>-1 && version.d < dtBegin)
                return false;
            return test ;
        }
        else
            return false;
    },
    _isVisible = function(reg){
        const id = reg.properties[0].toString();

        if (_visible[id])
            return true;

        if (_hidden[id] || !_isActual(reg))
            return false;
        else
            return true;
    },
    _addCalendar = function(){
            
        let calendar = this.frame.find('.calendar')[0];
        // walkaround with focus at first input in ui-dialog
        calendar.innerHTML = ('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');

        let mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
            dateInterval = new nsGmx.DateInterval();

        dateInterval
            .set('dateBegin', mapDateInterval.get('dateBegin'))
            .set('dateEnd', mapDateInterval.get('dateEnd'))
            .on('change', function (e) {
//console.log(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
                nsGmx.widgets.commonCalendar.setDateInterval(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));                
                if (_thisView.isVisible){
                    _thisView.inProgress(true);
                    _thisView.model.isDirty = true;
                    _thisView.model.update();
                }
            }.bind(this));

        this.calendar = new nsGmx.CalendarWidget({
            dateInterval: dateInterval,
            name: 'catalogInterval',
            container: calendar,
            dateMin: new Date(0, 0, 0),
            dateMax: new Date(),
            dateFormat: 'dd.mm.yy',
            minimized: false,
            showSwitcher: false
        })

        calendar.querySelector('.CalendarWidget-dateBegin').style.display = 'none';
        let tr = calendar.querySelector('tr:nth-of-type(1)');
        //tr.insertCell(2).innerHTML = '&nbsp;&nbsp;–&nbsp;&nbsp;';
        tr.insertCell(4).innerHTML = 
        '<img class="default_date" style="cursor:pointer; padding-right:10px" title="'+_gtxt('HardNavigation.calendar_today')+'" src="plugins/AIS/AISSearch/svg/calendar.svg">';
 
        // let td = tr.insertCell(6);
        // td.innerHTML = '<div class="select"><select class=""><option value="00" selected>00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24">24</option></div></select>';       
        // tr.insertCell(7).innerHTML = '&nbsp;&nbsp;–&nbsp;&nbsp;';       
        // td = tr.insertCell(8);
        // td.innerHTML = '<div class="select"><select class=""><option value="00">00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24" selected>24</option></div></select>';       
        

        calendar.querySelector('.default_date').addEventListener('click', () => {
            let db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
            this.calendar.getDateInterval().set('dateBegin', db.dateBegin);
            this.calendar.getDateInterval().set('dateEnd', db.dateEnd);
//console.log(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
            nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);              
            if (_thisView.isVisible){
                _thisView.inProgress(true);
                _thisView.model.isDirty = true;
                _thisView.model.update();
            }
        });
    },
    _checkVersion = function(){
        setTimeout(()=>{
            L.gmx.layersVersion.chkVersion(_layer);
//console.log('ChV')                   
            setTimeout(()=>{
                L.gmx.layersVersion.chkVersion(_layer);
//console.log('ChV')                   
                setTimeout(()=>{
                    L.gmx.layersVersion.chkVersion(_layer); 
//console.log('ChV')                   
                }, 3000);
            }, 3000);                                            
        }, 3000);
    },
    _layerClickHandler = function (event) {
        var layer = event.target,
            props = layer.getGmxProperties(),
            id = event.gmx.properties[props.identityField];

        layer.bringToTopItem(id);
                sendCrossDomainJSONRequest(`${serverBase}VectorLayer/Search.ashx?WrapStyle=func&layer=${props.name}&page=0&pagesize=1&orderby=${props.identityField}&geometry=true&query=[${props.identityField}]=${id}`,
                function (response) {
                    if (_stateUI == 'copy_region') {
                        if (response.Status && response.Status.toLowerCase() == 'ok') {
                            const result = response.Result,
                                i = result.fields.indexOf('geomixergeojson'),
                                obj=nsGmx.leafletMap.gmxDrawing.addGeoJSON(L.gmxUtil.geometryToGeoJSON(result.values[0][i], true)),
                                gmx_id = result.values[0][result.fields.indexOf(props.identityField)],
                                origin = parseInt(result.values[0][result.fields.indexOf('Origin')]),
                                date = parseInt(result.values[0][result.fields.indexOf('Date')]),
                                time = parseInt(result.values[0][result.fields.indexOf('Time')]),
                                name = result.values[0][result.fields.indexOf('Name')],
                                type = result.values[0][result.fields.indexOf('Type')],    
                                media = result.values[0][result.fields.indexOf('_mediadescript_')],                   
                                eoc = new nsGmx.EditObjectControl(props.name, null, {drawingObject: obj[0]}),
                                dt = new Date(); 
                            eoc.initPromise.done(()=>{      
                                eoc.set('Origin', origin && origin!='' ? origin : gmx_id);     
                                eoc.set('Name', name); 
                                eoc.set('Type', type);  
                                eoc.set('_mediadescript_', media);       
                                eoc.set('Time', date + time); 
                                eoc.set('Date', date + time);       
                                eoc.set('TimeChange', dt.getTime()/1000); 
                                eoc.set('DateChange', dt.getTime()/1000); 
                        
                                const dlg = $(`span:contains("${_gtxt("Создать объект слоя [value0]", props.title)}")`).closest('.ui-dialog');
                                dlg.find('tr').each((i, el)=>{
                                    let name = el.querySelectorAll('td')[0].innerText;
                                    if (name.search(/\b(gmx_id|Name|Type|Date|Time)\b/i)<0)
                                    //if (i==0 || name.search(/\b(State)\b/i)==0)
                                        el.style.display = 'none';
                                });  
                                dlg.find(`.buttonLink:contains("${_gtxt("Создать")}")`).on('click', e=>{
                                    _thisView.inProgress(true);
                                });  
                            });
                            $(eoc).on('modify', e=>{
//console.log(e.target.getAll());
                                let values = e.target.getAll();
                                sendCrossDomainJSONRequest(`${serverBase}VectorLayer/ModifyVectorObjects.ashx?WrapStyle=func&LayerName=${props.name}&objects=[{"properties":{"State":"archive","NextDateChange":${values.DateChange},"NextTimeChange":${values.TimeChange}},"id":"${id}","action":"update"}]`,
                                    function (response) {
                                        _thisView.model.page = 0; // model update                                                       
                                        _thisView.model.updatePromise.then(_checkVersion);

                                        if (response.Status && response.Status.toLowerCase() == 'ok') {
                                        }
                                        else {
                                            console.log(response);
                                        }
                                    });

                            });                      
                        }
                        else{
                            console.log(response);
                        }
                        _chooseBut.click(); 
                    }                
                });
        return true;
    },
    _copyRegion = function(){
        const layer = _layer,
              props = layer.getGmxProperties();
        if (_stateUI == 'create_region' || _stateUI == '') {
            if (_stateUI == 'create_region')
                _createBut.click();

            _stateUI = 'copy_region';
            _chooseBut.addClass('active');
            if (layer.disableFlip && layer.disablePopup) {
                layer.disableFlip();
                layer.disablePopup();
            }
            layer.on('click', _layerClickHandler);
        }
        else if (_stateUI == 'copy_region'){
            _stateUI = '';
            _chooseBut.removeClass('active');
            if (layer.disableFlip && layer.disablePopup) {
                layer.enableFlip();
                layer.enablePopup();
            }
            layer.off('click', _layerClickHandler);
        }
    },
    _onDrawStop = function(e){
                    const obj = e.object,
                          lprops = _layer.getGmxProperties(),
                          eoc = new nsGmx.EditObjectControl(lprops.name, null, {drawingObject: obj});
                    eoc.initPromise.done(()=>{      
                        let dt = new Date();        
                        eoc.set('Time', dt.getTime()/1000); 
                        eoc.set('Date', dt.getTime()/1000);                    
                        const dlg = $(`span:contains("${_gtxt("Создать объект слоя [value0]", lprops.title)}")`).closest('.ui-dialog');
                        dlg.find('tr').each((i, el)=>{
                            let name = el.querySelectorAll('td')[0].innerText;
                            if (name.search(/\b(gmx_id|Name|Type|Date|Time)\b/i)<0)
                                el.style.display = 'none';
                        }); 
                        dlg.find(`.buttonLink:contains("${_gtxt("Создать")}")`).on('click', e=>{
                            _thisView.inProgress(true);
                        });   
                    });                              
                    $(eoc).on('modify', e=>{
                        _thisView.model.page = 0; // Model update
                        _thisView.model.updatePromise.then(_checkVersion);
                    });
                    // Continue command
                    //nsGmx.leafletMap._container.style.cursor='pointer'; 
                    //nsGmx.leafletMap.gmxDrawing.create('Polygon'); 

                    // Discontinue command
                    if (_stateUI == 'create_region')
                        _createBut.click();
            },
    _createRegion = function(){
        if (_stateUI == 'copy_region' || _stateUI == ''){
            if (_stateUI == 'copy_region')
                _chooseBut.click();  
            _stateUI = 'create_region'; 
            _createBut.addClass('active'); 
            nsGmx.leafletMap.gmxDrawing.on('drawstop', _onDrawStop);

            nsGmx.gmxMap.layers.forEach( layer=>{
                if (layer.disableFlip && layer.disablePopup) {
                    layer.disableFlip();
                    layer.disablePopup();
                }
            });
 
            nsGmx.leafletMap._container.style.cursor='pointer';   
            nsGmx.leafletMap.gmxDrawing.create('Polygon');
        }
        else if (_stateUI == 'create_region'){
            _stateUI = '';
            _createBut.removeClass('active');    
            nsGmx.leafletMap._container.style.cursor='';     
            nsGmx.leafletMap.gmxDrawing.off('drawstop', _onDrawStop);
//console.log(`drawstop ${nsGmx.leafletMap.gmxDrawing._events.drawstop.length}`)

            nsGmx.gmxMap.layers.forEach( layer=>{
                if (layer.disableFlip && layer.disablePopup) {
                    layer.enableFlip();
                    layer.enablePopup();
                }
            });

            nsGmx.leafletMap.gmxDrawing.clearCreate();
        }
    },
    _clean = function () {

        this.frame.find('.grid .info').off('click', _infoClickHandler);
        this.frame.find('.grid .visibility').off('click', _visClickHandler);
        this.frame.find('.grid .show').off('click', _showClickHandler);
        //this.frame.find('.grid .state').off('click', _stateClickHandler);
        this.frame.find('.grid .edit').off('click', _editClickHandler);

    };

MyCollectionView.prototype = Object.create(BaseView.prototype);

MyCollectionView.prototype.inProgress = function (state) {
    let progress = this.frame.find('.refresh div');
    if (state)
        progress.show();
    else
        progress.hide();
};

// MyCollectionView.prototype.resize = function () { 
//     let h = $('.iconSidebarControl-pane').height() - this.frame.find('.instruments').outerHeight()
//     - this.frame.find('.results').outerHeight() - this.frame.find('.menu').outerHeight();
//     this.container.height(h+1);
// };

const _infoClickHandler = function(e){
        let td = e.currentTarget,
            id = td.parentElement.id,
            descData = _layer._gmx.dataManager.getItem(parseInt(id)).properties[_layer.getGmxProperties().attributes.indexOf('_mediadescript_') + 1],
            mediaDescDialog = jQuery('<div class="mediaDesc-Div"><img src="plugins/external/GMXPluginMedia/addit/media_img_load.gif"></img></div>');

        mediaDescDialog.dialog({
            title: _gtxt('mediaPlugin2.mediaDescDialogTitleRead.label'),
            width: 510,
            height: 505, //dialogSettings.dialogDescHeight,
            minHeight: 505, //dialogSettings.dialogDescHeight,
            maxWidth: 510,
            minWidth: 510,
            modal: false,
            autoOpen: false,
            dialogClass: 'media-DescDialog',
            close: function () { mediaDescDialog.dialog('close').remove(); }
        });

        mediaDescDialog.html('<div class="media-descDiv">' + descData + '</div>');
        mediaDescDialog.dialog('open');
    },
     _visClickHandler = function(e){
        let td = e.currentTarget,
            id = td.parentElement.id,
            svg = td.querySelectorAll('svg'),
            vis = 0, hid = 1;
        if (svg[0].style.display != 'none'){
            delete _visible[id];
            _hidden[id] = true;
            vis = 1; hid = 0;
        }
        else{
            _visible[id] = true;
            delete _hidden[id];
            vis = 0; hid = 1;
        }
        svg[hid].style.display = 'none';
        svg[vis].style.display = 'block';
        _layer.repaint();
//console.log(_hidden)
    },
    _showClickHandler = function(e){
        var id = e.currentTarget.parentElement.id,
            layer = _layer,
            props = layer.getGmxProperties(),
            layerName = props.name;
        sendCrossDomainJSONRequest(window.serverBase + 'VectorLayer/Search.ashx?WrapStyle=func&layer=' + layerName + '&page=0&pagesize=1&geometry=true&query=' + encodeURIComponent('[' + props.identityField + ']=' + id), function(response) {
            if (!window.parseResponse(response)) {
                return;
            }
            var columnNames = response.Result.fields;
            var row = response.Result.values[0];
            //for (var i = 0; i < row.length; ++i)
            var i = columnNames.indexOf('geomixergeojson');
            {
                if (columnNames[i] === 'geomixergeojson' && row[i])
                {
                    var fitBoundsOptions = layer ? {maxZoom: layer.options.maxZoom} : {};

                    var geom = L.gmxUtil.geometryToGeoJSON(row[i], true);
                    var bounds = L.gmxUtil.getGeometryBounds(geom);
                    nsGmx.leafletMap.fitBounds([
                        [bounds.min.y, bounds.min.x],
                        [bounds.max.y, bounds.max.x]
                    ], fitBoundsOptions);						
                }
            }
        });
    },
    _stateClickHandler = function(e){
        let td = e.currentTarget,
        id = td.parentElement.id,
        state = '';

        if (td.className.search(/green/)!=-1)
            state = 'archive';

        sendCrossDomainJSONRequest(`${serverBase}VectorLayer/ModifyVectorObjects.ashx?WrapStyle=func&LayerName=${_layer.getGmxProperties().name}&objects=[{"properties":{"State":"${state}"},"id":"${id}","action":"update"}]`,
        function (response) {
            if (response.Status && response.Status.toLowerCase() == 'ok') {
                _thisView.inProgress(true);
                _thisView.model.isDirty = true;
                _thisView.model.update();                                                      
                _thisView.model.updatePromise.then(_checkVersion);
            }
            else
                console.log(response);
        });                
    },
    _editClickHandler = function(e){

        if (_stateUI != '')
            return;
        _stateUI = 'edit_region';

        let id = e.currentTarget.parentElement.id,
            layerName = _layer.getGmxProperties().name,
            layerTitle = _layer.getGmxProperties().title,
            eoc = new nsGmx.EditObjectControl(layerName, id),
            dt = new Date(); 
        let isDelete = false; 
        eoc.initPromise.done(()=>{        
            //eoc.set('TimeChange', dt.getTime()/1000); 
            //eoc.set('DateChange', dt.getTime()/1000);
            const dlg = $(`span:contains("${_gtxt("Редактировать объект слоя [value0]", layerTitle)}")`).closest('.ui-dialog');
            dlg.find('tr').each((i, el)=>{
                let name = el.querySelectorAll('td')[0].innerText;
                if (i>1 && name.search(/\b(Name|Type)\b/i)<0)
                    el.style.display = 'none';
            });                 
            dlg.find(`.buttonLink:contains("${_gtxt("Изменить")}")`).on('click', e=>{
                _thisView.inProgress(true);
            });                 
            dlg.find(`.buttonLink:contains("${_gtxt("Удалить")}")`).on('click', e=>{
                _thisView.inProgress(true);
                isDelete = true;
            }); 
        });            
        $(eoc).on('modify', e=>{
///console.log(e.target.getAll(), dt);
            _thisView.model.isDirty = true;                       
            _thisView.model.update();                
            _thisView.model.updatePromise.then(_checkVersion);
        });                   
        $(eoc).on('close', e=>{
            if (isDelete)
                _thisView.model.page = 0;
            _stateUI = '';            
        });        
    };

MyCollectionView.prototype.repaint = function () { 
    _clean.call(this);
    BaseView.prototype.repaint.call(this); 

    if (this.model.pagesTotal){
        const pager = this.frame.find('.pager'),
        pages = pager.find('.pages');
        pager.css('visibility', 'visible');
        pages.text(`${this.model.page+1} / ${this.model.pagesTotal}`);

        $('.grid tr').each((i, el)=>{
            let id = el.id, 
            svg = el.querySelectorAll('svg');
//console.log(id, _layer.getDataManager().getItem(parseInt(id)));
            const attr = _layer.getGmxProperties().attributes,
                  props = [id];
            props[attr.indexOf('Date')+1] = _thisView.model.data.regions[i].Date;
            props[attr.indexOf('Time')+1] = _thisView.model.data.regions[i].Time;
            props[attr.indexOf('DateChange')+1] = _thisView.model.data.regions[i].DateChange;
            props[attr.indexOf('TimeChange')+1] = _thisView.model.data.regions[i].TimeChange;
            props[attr.indexOf("NextDateChange") + 1] = _thisView.model.data.regions[i].NextDateChange;
            props[attr.indexOf("NextTimeChange") + 1] = _thisView.model.data.regions[i].NextTimeChange;
            props[attr.indexOf('State')+1] = _thisView.model.data.regions[i].State;
            props[attr.indexOf('Origin')+1] = _thisView.model.data.regions[i].Origin;
            const reg = {properties: props};
//console.log(reg);
            if (!_isVisible(reg)){
                svg[0].style.display = 'none';
                svg[1].style.display = 'block';
            }
            if (!_isActual(reg))
                el.classList.add('nonactual');
            else
                el.classList.remove('nonactual');
        });

        this.frame.find('.grid .info').on('click', _infoClickHandler);
        this.frame.find('.grid .visibility').on('click', _visClickHandler);
        this.frame.find('.grid .show').on('click', _showClickHandler);
        //this.frame.find('.grid .state').on('click', _stateClickHandler);
        this.frame.find('.grid .state').css('cursor', 'default');
        this.frame.find('.grid .edit').on('click', _editClickHandler);
    }
    else{
        this.frame.find('.pager').css('visibility', 'hidden');
    }
};

MyCollectionView.prototype.show = function () {
    if (!this.frame)
        return;

    if (!_layer._map)
        nsGmx.leafletMap.addLayer(_layer);

    this.frame.show();
    //this.searchInput.focus();
    BaseView.prototype.show.apply(this, arguments);
};

module.exports = MyCollectionView;
