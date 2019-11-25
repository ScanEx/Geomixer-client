require("./MyCollection.css")
const BaseView = require('./BaseView.js'),
      Request = require('../Request'),
      Calendar = require('../Controls/Calendar.js');

let _stateUI = '', _createBut, _chooseBut, _layer, _thisView, _selectedReg = false,
    _hidden = {}, _visible = {};
const _highlightSelected = function(turnOn){
          if (_selectedReg) {
              const tr = _thisView.frame.find('tr#' + _selectedReg);
              if (tr[0])
                  if (turnOn)
                      (tr[0].style.backgroundColor = '#eee');
                  else
                      (tr[0].style.backgroundColor = '');
          }
      },
      _serverBase = window.serverBase.replace(/^https?:/, document.location.protocol),
      _sendRequest = function(url, method){
        return new Promise((resolve, reject) => { 
            const callback = response => {
                if (!response.Status || response.Status.toLowerCase() != 'ok' || !response.Result) {
                    reject(response);
                }
                else
                    resolve(response.Result);
            };           
            if (!method || method == 'GET')
                sendCrossDomainJSONRequest(url, callback);
        });

      },
      _searchRequest = function(params){
          let qs = '';
          for (let p in params) {
              if (qs != '')
                qs += '&';
            qs += p + '=' + (typeof params[p]=='object' ? JSON.stringify(params[p]) : params[p]);
          }
          if (qs != '')
            qs = '&' + qs;
          const url = `${_serverBase}VectorLayer/Search.ashx?layer=${_layer.getGmxProperties().name}${qs}`;
          //`query="State"='active1'&columns=[{"Value":"[gmx_id]"},{"Value":"[Date]"},{"Value":"[DateChange]"},{"Value":"[Time]"},{"Value":"[TimeChange]"}]`;
          return _sendRequest(url);
      };

const MyCollectionView = function ({ model, layer }) {
    _thisView = this;

        _layer = nsGmx.gmxMap.layersByID[layer];
        if (!_layer){
            model.isDirty = false;
            return;
        }

        nsGmx.widgets.commonCalendar.getDateInterval().on('change', di=>{ 
            if (!_thisView.isVisible) {
                _thisView.calendar.dateInterval.set({
                    dateBegin: di.get('dateBegin'),
                    dateEnd: di.get('dateEnd')
                });
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
                    <td class="but choose"><svg><use xlink:href="#icons_selectreg"></use></svg>${_gtxt('HardNavigation.choose_reg')}</td>
                    <td class="but create"><svg><use xlink:href="#icons_polygon"></use></svg>${_gtxt('HardNavigation.create_reg')}</td>
                </tr>
                </table> 

                <div class="calendar"></div>
                <div class="calendar2"></div>

                <table border=0 class="grid-header">
                <tr><td class="visibility-all">
                <svg style="display:block"><use xlink:href="#icons_eye"></use></svg>                
                <svg style="display:none"><use xlink:href="#icons_eye-off"></use></svg>
                </td>
                <td>${_gtxt('HardNavigation.reg_id')}</td>
                <td>${_gtxt('HardNavigation.reg_created')}</td>
                <td>${_gtxt('HardNavigation.reg_updated')}</td>
                <td class="color-transparent"><svg><use xlink:href="#icons_eye"></use></td>
                <td class="color-transparent"><svg><use xlink:href="#icons_eye"></use></td>
                <td class="color-transparent"><svg><use xlink:href="#icons_eye"></use></td></tr>
                </table> 
            </div> 
            <div class="grid">

            </div>
            <div class="footer unselectable">
                <table border=0 class="pager">
                    <tr><td class="but arrow arrow-prev"><svg><use xlink:href="#icons_arrow-left"></use></svg></td>
                    <td class="current">${_gtxt('HardNavigation.page_lbl')} <span class="pages"></span></td>
                    <td class="but arrow arrow-next"><svg><use xlink:href="#icons_arrow-right"></use></svg></td></tr>
                </table>  
                <div class="but but-attributes">${_gtxt('HardNavigation.attr_tbl')}</div>          
            </div>
            </div>`
        )());
        _addCalendar.call(this);

        this.container = this.frame.find('.grid');
        this.footer = this.frame.find('.footer');

        // this.tableTemplate = '<table border=0 class="grid">{{#each regions}}<tr id="{{gmx_id}}">' +                
        //         '<td class="visibility">' +
        //         '<svg style="display:block"><use xlink:href="#icons_eye"></use></svg>' +
        //         '<svg style="display:none"><use xlink:href="#icons_eye-off"></use></svg></td>' +
        //         '<td class="identity">{{id}}</td>' +
        //         '<td class="identity">{{{DateTime}}}</td>' +
        //         '<td>{{{DateTimeChange}}}</td>' +
        //         '<td class="{{StateColor}} state"><svg><use xlink:href="#icons_circle"></use></svg></td>' +
        //         '<td class="edit"><svg><use xlink:href="#icons_pen"></use></svg></td>' +
        //         '<td class="show"><svg><use xlink:href="#icons_target"></use></svg></td>' +
        //         //'<td class="info"><svg><use xlink:href="#icons_info"></use></svg></td>' +
        //     '</tr>{{/each}}</table>' +
        //     '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';

        Object.defineProperty(this, "tableTemplate", {
            get: function () {
                return '<table border=0 class="grid">' +
                    this.model.data.regions.map(r => {
                        if (r.page == _thisView.model.page)
                            return `<tr id="${r.gmx_id}">                
                                <td class="visibility">
                                <svg style="display:block"><use xlink:href="#icons_eye"></use></svg>
                                <svg style="display:none"><use xlink:href="#icons_eye-off"></use></svg></td>
                                <td class="identity">${r.id}</td>
                                <td class="identity">${r.DateTime}</td>
                                <td>${r.DateTimeChange}</td>
                                <td class="${r.StateColor} state"><svg><use xlink:href="#icons_circle"></use></svg></td>
                                <td class="edit"><svg><use xlink:href="#icons_pen"></use></svg></td>
                                <td class="show"><svg><use xlink:href="#icons_target"></use></svg></td>
                            </tr>`;
                        else
                            return '';
                    }).join('') +
                    '</table>' +
                    (this.model.data.msg ? this.model.data.msg.map(m => `<div class="msg">${m.txt}</div>`).join('') : '');
            }
        });  

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

        this.frame.find('.but.arrow-prev').on('click', ()=>{
            _thisView.model.previousPage.call(_thisView.model);
            _thisView.model.updatePromise.then(()=>{
                _thisView.repaint();
                _highlightSelected(true);
            });
        });      
        this.frame.find('.but.arrow-next').on('click', ()=>{
            _thisView.model.nextPage.call(_thisView.model);
            _thisView.model.updatePromise.then(()=>{
                _thisView.repaint();
                _highlightSelected(true);
            });
        });
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
            iNextDateCh = atttributes.indexOf("NextDateChange") + 1,
            iNextTimeCh = atttributes.indexOf("NextTimeChange") + 1,
            id = reg.properties[iOrigin] == '' ? reg.properties[0].toString() : reg.properties[iOrigin],
            state = !reg.properties[iState] ? '' : reg.properties[atttributes.indexOf("State") + 1],
            dtBegin = mapDateInterval.get('dateBegin').getTime(),
            dtEnd = mapDateInterval.get('dateEnd').getTime();

        let curVer = {d:reg.properties[iDateChange] * 1000, t:reg.properties[iTimeChange] * 1000, get dt(){return this.d+this.t;}},
            nextVer = {d:reg.properties[iNextDateCh] * 1000, t:reg.properties[iNextTimeCh] * 1000, get dt(){return this.d+this.t;}};
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
    _isVisible = function(reg){
        const id = reg.properties[0].toString();

        if (_visible[id])
            return true;

        if (_hidden[id] || !_isActual(reg))
            return false;
        else
            return true;
    },
    _toggleDisplay = function(a, visible, hidden){
        a[visible].style.display = 'block';
        a[hidden].style.display = 'none';
    },
    _addCalendar = function(){            
        const calendar = this.frame.find('.calendar')[0];
        // walkaround with focus at first input in ui-dialog
        calendar.innerHTML = ('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');

        const mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
              dateInterval = new nsGmx.DateInterval();
    
        dateInterval
            .set('dateBegin', mapDateInterval.get('dateBegin'))
            .set('dateEnd', mapDateInterval.get('dateEnd'))
            .on('change', function (e) {
//console.log(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
                _hidden = {};
                _visible = {};
                _layer.repaint();
                _thisView.inProgress(true);
                _thisView.model.isDirty = true;
                if (_thisView.isVisible){
                    nsGmx.widgets.commonCalendar.setDateInterval(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));  
                    _thisView.model.page = 0;   
                    _thisView.model.update();             
                }
            });

        this.calendar = new Calendar({
            dateInterval: dateInterval,
            name: 'catalogInterval',
            container: calendar,
            dateMin: new Date(0, 0, 0),
            dateMax: new Date(),
            dateFormat: 'dd.mm.yy',
            minimized: true,
            showSwitcher: false
        });

        let tr = calendar.querySelector('tr:nth-of-type(1)');
        tr.insertCell(4).innerHTML = 
        '<img class="default_date" style="cursor:pointer; padding-right:10px" title="'+_gtxt('HardNavigation.calendar_today')+'" src="plugins/AIS/AISSearch/svg/calendar.svg">';
        calendar.querySelector('.default_date').addEventListener('click', () => {
            let db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
            dateInterval.set({
                dateBegin: db.dateBegin,
                dateEnd: db.dateEnd
            });
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
        delete _visible[id];

        layer.bringToTopItem(id);
                sendCrossDomainJSONRequest(`${_serverBase}VectorLayer/Search.ashx?WrapStyle=func&layer=${props.name}&page=0&pagesize=1&orderby=${props.identityField}&geometry=true&query=[${props.identityField}]=${id}`,
                function (response) {
                    if (_stateUI == 'copy_region') {
                        if (response.Status && response.Status.toLowerCase() == 'ok') {
                            _selectedReg = id;
                            _highlightSelected(true);

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
                                eoc.set('State', 'active1');  
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
                                const values = e.target.getAll();
                                Request.modifyRequest({
                                    LayerName:props.name,
                                    objects:`[{"properties":{"State":"archive","NextDateChange":${values.DateChange},"NextTimeChange":${values.TimeChange}},"id":${id},"action":"update"}`
                                })
                                .then(function (response) {
                                    _thisView.model.page = 0;
                                    _thisView.model.isDirty = true;
                                    _thisView.model.update().then(_checkVersion);
                                });
                            });   
                            $(eoc).on('close', e=>{
                                _highlightSelected(false);
                                _selectedReg = false;          
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
            eoc = new nsGmx.EditObjectControl(lprops.name, null, { drawingObject: obj });
        eoc.initPromise.done(() => {
            let dt = new Date();
            eoc.set('Time', dt.getTime() / 1000);
            eoc.set('Date', dt.getTime() / 1000);
            eoc.set('State', 'active1');
            const dlg = $(`span:contains("${_gtxt("Создать объект слоя [value0]", lprops.title)}")`).closest('.ui-dialog');
            dlg.find('tr').each((i, el) => {
                let name = el.querySelectorAll('td')[0].innerText;
                if (name.search(/\b(gmx_id|Name|Type|Date|Time)\b/i) < 0)
                    el.style.display = 'none';
            });
            dlg.find(`.buttonLink:contains("${_gtxt("Создать")}")`).on('click', e => {
                _thisView.inProgress(true);
            });
        });
        $(eoc).on('modify', e => {
            Promise.resolve().then(()=>{
                _thisView.model.page = 0;
                _thisView.model.isDirty = true;
                _thisView.model.update().then(r => {
                    const gmx_id = _thisView.model.data.regions[0].gmx_id; //r[0].gmx_id;
                    Request.modifyRequest({
                        LayerName:_layer.getGmxProperties().name,
                        objects:`[{"properties":{"Origin":${gmx_id}},"id":${gmx_id},"action":"update"}]`
                    })
                })
                .then(_checkVersion);            

                // Continue command
                //nsGmx.leafletMap._container.style.cursor='pointer'; 
                //nsGmx.leafletMap.gmxDrawing.create('Polygon'); 

                // Discontinue command
                if (_stateUI == 'create_region')
                    _createBut.click();
            });
        });
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

        this.frame.find('.visibility-all').off('click', _visAllClickHandler);
        //this.frame.find('.grid .info').off('click', _infoClickHandler);
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
    _visAllClickHandler = function(e){
        const hidden = Object.keys(_hidden),
              td = e.currentTarget,
              svgAll = td.querySelectorAll('svg'),
              ldm = _layer.getDataManager();
        if (!hidden.length){
            const data = _thisView.model.data;
            data.regions.forEach(v => {
                let id = v.gmx_id, svg = _thisView.frame.find(`tr#${id} td.visibility svg`);
                delete _visible[id];
                _hidden[id] = true;
                if (svg[0])
                    _toggleDisplay(svg, 1, 0);
            });
            _layer.repaint();
            _toggleDisplay(svgAll, 1, 0);
        }
        else{
            hidden.forEach(id=>{
                let svg = _thisView.frame.find(`tr#${id} td.visibility svg`);
                delete _hidden[id];
                _visible[id] = true;
                if (svg[0]) {
                    _toggleDisplay(svg, 0, 1);
                }
            });
            _toggleDisplay(svgAll, 0, 1);
            _layer.repaint();
        }
    },
     _visClickHandler = function(e){
        let td = e.currentTarget,
            id = td.parentElement.id,
            svg = td.querySelectorAll('svg'),
            vis = 0, hid = 1,
            svgAll = _thisView.frame.find('.visibility-all svg');
        if (svg[0].style.display != 'none'){
            delete _visible[id];
            _hidden[id] = true;
            //vis = 1; hid = 0;
            _toggleDisplay(svg, 1, 0);
            _toggleDisplay(svgAll, 1, 0);
        }
        else{
            _visible[id] = true;
            delete _hidden[id];
            //vis = 0; hid = 1;
            _toggleDisplay(svg, 0, 1);
            if(!Object.keys(_hidden).length){
                _toggleDisplay(svgAll, 0, 1);
            }
        }
        _layer.repaint();
//console.log(_hidden)
    },
    _showClickHandler = function(e){
        var id = e.currentTarget.parentElement.id,
            layer = _layer,
            props = layer.getGmxProperties(),
            layerName = props.name;
        sendCrossDomainJSONRequest(_serverBase + 'VectorLayer/Search.ashx?WrapStyle=func&layer=' + layerName + '&page=0&pagesize=1&geometry=true&query=' + encodeURIComponent('[' + props.identityField + ']=' + id), function(response) {
            if (!window.parseResponse(response)) {
                console.log(response);
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

        sendCrossDomainJSONRequest(`${_serverBase}VectorLayer/ModifyVectorObjects.ashx?WrapStyle=func&LayerName=${_layer.getGmxProperties().name}&objects=[{"properties":{"State":"${state}"},"id":"${id}","action":"update"}]`,
        function (response) {
            if (response.Status && response.Status.toLowerCase() == 'ok') {
                _thisView.inProgress(true);
                _thisView.model.isDirty = true;
                _thisView.model.update().then(_checkVersion);
            }
            else
                console.log(response);
        });                
    },
    _editClickHandler = function(e){

        if (_stateUI != '')
            return;
        _stateUI = 'edit_region';


        let tr = e.currentTarget.parentElement,
            id = tr.id,
            layerName = _layer.getGmxProperties().name,
            layerTitle = _layer.getGmxProperties().title,
            eoc = new nsGmx.EditObjectControl(layerName, id),
            dt = new Date(); 

        tr.style.backgroundColor = '#eee'; 

        let isDelete = false, isModify = false; 
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
                isModify = true;
            });                 
            dlg.find(`.buttonLink:contains("${_gtxt("Удалить")}")`).on('click', e=>{
                _thisView.inProgress(true);
                isDelete = true;
            }); 
        });            
//         $(eoc).on('modify', e=>{
// console.log('modify')
// ///console.log(e.target.getAll(), dt);
//             _thisView.model.isDirty = true;                       
//             _thisView.model.update()               
//             .then(_checkVersion);
//         });                   
        $(eoc).on('close', e=>{
            if (isDelete){
                delete _hidden[id];
                _thisView.model.page = 0;
            }
            if (isDelete || isModify){
                _thisView.model.isDirty = true;
                _thisView.model.update().then(_checkVersion);
            }
            _stateUI = ''; 
            tr.style.backgroundColor = '';            
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
                _toggleDisplay(svg, 1, 0);
            }
            if (!_isActual(reg))
                el.classList.add('nonactual');
            else
                el.classList.remove('nonactual');
        });

        let svgAll = this.frame.find('.visibility-all svg'), vis = 0, hid = 1;
        if (Object.keys(_hidden).length){ vis = 1, hid = 0; }
        _toggleDisplay(svgAll, vis, hid);      

        this.frame.find('.visibility-all').on('click', _visAllClickHandler);
        //this.frame.find('.grid .info').on('click', _infoClickHandler);
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

    //this.searchInput.focus();
    BaseView.prototype.show.apply(this, arguments);
};

module.exports = MyCollectionView;
