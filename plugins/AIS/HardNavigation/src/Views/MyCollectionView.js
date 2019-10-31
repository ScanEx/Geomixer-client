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

        _layer.setFilter(reg=>{
            let id = reg.properties[0].toString(),
                state = reg.properties[5];
            if (!_hidden[id] && state=='archive')
                _hidden[id] = true;
            if (_hidden[id] && !_visible[id])// FIELDS!!!
            {   
                //console.log(reg.properties[0])
                return false;
            }
            else{
                //console.log(_hidden)
                return true;
            }
        })

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
        //_addCalendar.call(this);

        this.container = this.frame.find('.grid');
        this.footer = this.frame.find('.footer');

        this.tableTemplate = '<table border=0 class="grid">{{#each regions}}<tr id="{{gmx_id}}">' +                
                '<td class="visibility">' +
                '<svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></svg>' +
                '<svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye-off"></use></svg></td>' +
                '<td>{{id}}</td>' +
                '<td>{{{DateTime}}}</td>' +
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
console.log(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
                //nsGmx.widgets.commonCalendar.setDateInterval(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
            }.bind(this));

        this.calendar = new nsGmx.CalendarWidget({
            dateInterval: dateInterval,
            name: 'catalogInterval',
            container: calendar,
            dateMin: new Date(0, 0, 0),
            dateMax: new Date(3015, 1, 1),
            dateFormat: 'dd.mm.yy',
            minimized: false,
            showSwitcher: false
        })

        let tr = calendar.querySelector('tr:nth-of-type(1)');
        tr.insertCell(2).innerHTML = '&nbsp;&nbsp;–&nbsp;&nbsp;';
        tr.insertCell(5).innerHTML = 
        '<img class="default_date" style="cursor:pointer; padding-right:10px" title="'+_gtxt('HardNavigation.calendar_today')+'" src="plugins/AIS/AISSearch/svg/calendar.svg">';
 
        let td = tr.insertCell(6);
        td.innerHTML = '<div class="select"><select class=""><option value="00" selected>00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24">24</option></div></select>';       
        tr.insertCell(7).innerHTML = '&nbsp;&nbsp;–&nbsp;&nbsp;';       
        td = tr.insertCell(8);
        td.innerHTML = '<div class="select"><select class=""><option value="00">00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24" selected>24</option></div></select>';       
        

        calendar.querySelector('.default_date').addEventListener('click', () => {
            let db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
            this.calendar.getDateInterval().set('dateBegin', db.dateBegin);
            this.calendar.getDateInterval().set('dateEnd', db.dateEnd);
console.log(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
            //nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
        });
    },
    _checkVersion = function(){
        setTimeout(()=>{
            L.gmx.layersVersion.chkVersion(_layer);
            setTimeout(()=>{
                L.gmx.layersVersion.chkVersion(_layer);
                setTimeout(()=>{
                    L.gmx.layersVersion.chkVersion(_layer);                    
                }, 2000);
            }, 2000);                                            
        }, 2000);
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
                                //date = result.values[0][result.fields.indexOf('Date')],
                                //time = result.values[0][result.fields.indexOf('Time')],
                                name = result.values[0][result.fields.indexOf('Name')],
                                type = result.values[0][result.fields.indexOf('Type')],    
                                media = result.values[0][result.fields.indexOf('_mediadescript_')],                   
                                eoc = new nsGmx.EditObjectControl(props.name, null, {drawingObject: obj[0]}),
                                dt = new Date(); 
                            eoc.initPromise.done(()=>{      
                                eoc.set('Origin', gmx_id);     
                                eoc.set('Name', name); 
                                eoc.set('Type', type);  
                                eoc.set('_mediadescript_', media);       
                                //eoc.set('Time', time); 
                                //eoc.set('Date', date);       
                                eoc.set('Time', dt.getTime()/1000); 
                                eoc.set('Date', dt.getTime()/1000); 
                        
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
                                sendCrossDomainJSONRequest(`${serverBase}VectorLayer/ModifyVectorObjects.ashx?WrapStyle=func&LayerName=${props.name}&objects=[{"properties":{"State":"archive"},"id":"${id}","action":"update"}]`,
                                    function (response) {

                                        delete _visible[id];
                                        _hidden[id] = true;

                                        _thisView.model.page = 0; // model update
                                        _checkVersion();
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

MyCollectionView.prototype.repaint = function () { 
    _clean.call(this);
    BaseView.prototype.repaint.call(this); 

    if (this.model.pagesTotal){
        const pages = this.frame.find('.pages');
        pages.text(`${this.model.page+1} / ${this.model.pagesTotal}`);

        $('.grid tr').each((i, el)=>{
            let id = el.id, 
            svg = el.querySelectorAll('svg'), vis=0, hid=1;
            if (_hidden[id] && !_visible[id]){ vis = 1; hid = 0; } 
            svg[hid].style.display = 'none';
            svg[vis].style.display = 'block';
        });

        this.frame.find('.grid .visibility').on('click', e=>{
            let td = e.currentTarget,
                id = td.parentElement.id,
                svg = td.querySelectorAll('svg'),
                vis = 0, hid = 1;
            if (!_hidden[id] || _visible[id]){
                _hidden[id] = true;
                delete _visible[id];
                vis = 1; hid = 0;
            }
            else{
                delete _hidden[id];
                _visible[id] = true;
                vis = 0; hid = 1;
            }
            svg[hid].style.display = 'none';
            svg[vis].style.display = 'block';
            _layer.repaint();
//console.log(_hidden, _visible)
        });

        this.frame.find('.grid .show').on('click', e=>{
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
        });

        this.frame.find('.grid .state').on('click', e=>{
            let td = e.currentTarget,
            id = td.parentElement.id,
            state = '';

            if (td.className.search(/green/)!=-1)
                state = 'archive';

            delete _visible[id];
            if (state=='archive')
                _hidden[id] = true;
            else
                delete _hidden[id];

            sendCrossDomainJSONRequest(`${serverBase}VectorLayer/ModifyVectorObjects.ashx?WrapStyle=func&LayerName=${_layer.getGmxProperties().name}&objects=[{"properties":{"State":"${state}"},"id":"${id}","action":"update"}]`,
            function (response) {
                if (response.Status && response.Status.toLowerCase() == 'ok') {
                    _thisView.inProgress(true);
                    _thisView.model.isDirty = true;
                    _thisView.model.update();
                }
                else
                    console.log(response);
            });                
        });

        this.frame.find('.grid .edit').on('click', e=>{

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
                eoc.set('TimeChange', dt.getTime()/1000); 
                eoc.set('DateChange', dt.getTime()/1000);
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
            });                   
            $(eoc).on('close', e=>{
                if (isDelete)
                    _thisView.model.page = 0;
                _stateUI = '';            
            });
            
        })
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
