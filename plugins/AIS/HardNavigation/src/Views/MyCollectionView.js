require("./MyCollection.css")
const BaseView = require('./BaseView.js');

//let _searchString = "";

const MyCollectionView = function ({ model, registerDlg }) {

    _layer = nsGmx.gmxMap.layersByID['FF3D4FD4291040BA9A6139EEE2CE3D23'];

        BaseView.call(this, model);
        this.frame = $(Handlebars.compile(`<div class="hardnav-view">
            <div class="header">
                <table border=1 class="instruments">
                <tr>
                    <td class="but choose">${_gtxt('HardNavigation.choose_reg')}</td>
                    <td class="but create">${_gtxt('HardNavigation.create_reg')}</td>
                </tr>
                </table> 
                <table border=1>
                <tr><td class="hint" colspan="2">${_gtxt('HardNavigation.instr_hint')}</td>
                <td><div class="refresh"><div>${this.gifLoader}</div></div></td></tr>
                </table> 
                <table border=1 class="grid-header">
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
            <div class="footer">
                <table border=1 class="pager">
                    <tr><td class="but arrow arrow-prev"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-left"></use></svg></td>
                    <td class="current">${_gtxt('HardNavigation.page_lbl')} 1/1</td>
                    <td class="but arrow arrow-next"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-right"></use></svg></td></tr>
                </table>  
                <div class="but but-attributes">${_gtxt('HardNavigation.attr_tbl')}</div>          
            </div>
            </div>`
        )());

        this.container = this.frame.find('.grid');
        this.footer = this.frame.find('.footer');

        this.tableTemplate = '{{#each vessels}}' +
            '<div class="hardnav-item">' +
            '<table border=0><tr>' +
            '<td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' +
            '<td><div class="exclude button" title="{{i "Lloyds.vesselExclude"}}"></div></td>' +
            '</tr></table>' +
            '</div>' +
            '{{/each}}' +
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

    },
    _editDialogTemplate = '<div class="obj-edit-canvas" style="overflow: auto; height: 204px;">' +
    '<table class="obj-edit-proptable"><tbody>' +
    '<tr><td style="height: 20px;"><span><span class="edit-obj-geomtitle">Геометрия</span><span id="choose-geom" class="gmx-icon-choose"></span></span></td><td><div style="color: rgb(33, 85, 112); font-size: 12px;"></div></td></tr>' +
    '<tr style="height: 22px;"><td><span style="font-size: 12px;">Name</span></td><td><input class="inputStyle edit-obj-input"></td></tr>' +
    '<tr style="height: 22px;"><td><span style="font-size: 12px;">Type</span></td><td><input class="inputStyle edit-obj-input"></td></tr>' +
    '<tr style="height: 22px;"><td><span style="font-size: 12px;">Origin</span></td><td>${gmx_id}</td></tr>' +
    //'<tr style="height: 22px;"><td><span style="font-size: 12px;">Date</span></td><td><input class="inputStyle edit-obj-input hasDatepicker" id="dp1572007274923"></td></tr>' +
    //'<tr style="height: 22px;"><td><span style="font-size: 12px;">DateChange</span></td><td><input class="inputStyle edit-obj-input hasDatepicker" id="dp1572007274924"></td></tr>' +
    //'<tr style="height: 22px;"><td><span style="font-size: 12px;">State</span></td><td><input class="inputStyle edit-obj-input"></td></tr>' +
    '</table>' +
    '<div class="media-Desc-GUI"><span id="media-Desc-EditLabel" title="${_gtxt("HardNavigation.description_ttl")}">${_gtxt("HardNavigation.description_lbl")}</span><span id="mediaDesc-EditButton" class="buttonLink" title="${_gtxt("HardNavigation.edit_description_ttl")}">${_gtxt("HardNavigation.edit_description_lbl")}</span></div>' + 
    '<div style="margin: 10px 0px; height: 20px;"><span class="buttonLink">${_gtxt("HardNavigation.save")}</span><span class="buttonLink" style="margin-left: 10px;">${_gtxt("HardNavigation.cancel")}</span></div>',
    _listeners = {},
    _layerClickHandler = function (event) {
        var layer = event.target,
            props = layer.getGmxProperties(),
            id = event.gmx.properties[props.identityField];

        layer.bringToTopItem(id);
        //new nsGmx.EditObjectControl(props.name, id, { event: event });
        sendCrossDomainJSONRequest(`${serverBase}VectorLayer/Search.ashx?WrapStyle=func&layer=${props.name}&page=0&pagesize=1&orderby=${props.identityField}&geometry=true&query=[${props.identityField}]=${id}`,
            function (response) {
                if (_stateUI == 'copy_region') {
                    if (response.Status && response.Status.toLowerCase() == 'ok') {
                        let i = response.Result.fields.indexOf('geomixergeojson');
//console.log(L.gmxUtil.geometryToGeoJSON(response.Result.values[0][i], true), `>>${i}`, this, props.name);
                        const obj=nsGmx.leafletMap.gmxDrawing.addGeoJSON(L.gmxUtil.geometryToGeoJSON(response.Result.values[0][i], true)),
                        gmx_id = response.Result.values[0][response.Result.fields.indexOf(props.identityField)],
                        dlg = showDialog(_gtxt('HardNavigation.add_copy'), $(eval('(function(gmx_id){return `' + _editDialogTemplate + '`})('+gmx_id+')'))[0], 400, 300, null, null, null, ()=>{ 
                                const gj = obj[0].toGeoJSON();
console.log(obj[0], gj.geometry.coordinates);  
                                nsGmx.leafletMap.gmxDrawing.remove(obj[0]);

                        });
                    }
                    else
                        console.log(response);

                    _chooseBut.click(); 
                }                
            });
        return true;
    },
    _copyRegion = function(){
        if (_stateUI != 'copy_region'){
            if (_stateUI != '')
                _createBut.click(); 
            _stateUI = 'copy_region';
            _chooseBut.addClass('active');

            for (var iL = 0; iL < nsGmx.gmxMap.layers.length; iL++) {
                var layer = nsGmx.gmxMap.layers[iL],
                    props = layer.getGmxProperties();

                if (layer.disableFlip && layer.disablePopup) {
                    layer.disableFlip();
                    layer.disablePopup();
                }

                if (layer instanceof L.gmx.VectorLayer && props.GeometryType.toLowerCase()=='polygon') {
                    _listeners[props.name] = _layerClickHandler;
                    layer.on('click', _listeners[props.name]);
                }
            }
        }
        else{
            _stateUI = '';
            _chooseBut.removeClass('active');
            nsGmx.gmxMap.layers.forEach( layer=>{
                if (layer.disableFlip && layer.disablePopup) {
                    layer.enableFlip();
                    layer.enablePopup();
                }
            });
            let test = 0;
            for (var layerName in _listeners) {
                nsGmx.gmxMap.layersByID[layerName].off('click', _listeners[layerName]);
//let clickEvent = nsGmx.gmxMap.layersByID[layerName]._events.click;              
//test += clickEvent ? clickEvent.length : 0;
                delete _listeners[layerName];
            }
//console.log(`clicks ${test}`)
        }
    },
    _onDrawStop = function(e){
                    const obj = e.object,
                          lprops = _layer.getGmxProperties(),
                          eoc = new nsGmx.EditObjectControl(lprops.name, null, {drawingObject: obj});
                    //eoc.set('Date', new Date().getTime());                 
                    $(eoc).on('modify', e=>console.log(e.target.getAll()));

                    
                    const rows = $(`span:contains("${_gtxt("Создать объект слоя [value0]", lprops.title)}")`).closest('.ui-dialog').find('tr');                
                    rows.eq(4).hide();                    
                    rows.eq(5).hide();
                    rows.eq(6).hide();
                    rows.eq(7).hide();

                    //nsGmx.leafletMap._container.style.cursor='pointer'; 
                    //nsGmx.leafletMap.gmxDrawing.create('Polygon'); 
                    if (_stateUI == 'create_region')
                        _createBut.click();
            },
    _createRegion = function(){
        if (_stateUI != 'create_region'){
            if (_stateUI != '')
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
        else{
            _stateUI = '';
            _createBut.removeClass('active');    
            nsGmx.leafletMap._container.style.cursor='';     
            nsGmx.leafletMap.gmxDrawing.off('drawstop', _onDrawStop);
console.log(`drawstop ${nsGmx.leafletMap.gmxDrawing._events.drawstop.length}`)

            nsGmx.gmxMap.layers.forEach( layer=>{
                if (layer.disableFlip && layer.disablePopup) {
                    layer.enableFlip();
                    layer.enablePopup();
                }
            });

            nsGmx.leafletMap.gmxDrawing.clearCreate();
        }
    },
    _addRegion = function(){
        this.inProgress(true);
        const obj=nsGmx.leafletMap.gmxDrawing.addGeoJSON({coordinates: [[[170.72753903711163, 60.844910986045214],
            [168.66210900000357, 60.73768601038719],
            [169.2333979948311, 61.17503299842439],
            [169.2333979948311, 61.17503299842439],
            [170.07934598946287, 61.14986199628548],
            [170.72753903711163, 60.844910986045214]
            ]],
            type: "Polygon"});
        _mapHelper.modifyObjectLayer('FF3D4FD4291040BA9A6139EEE2CE3D23', [{properties:{'Name':'Name'}, geometry:{type:'Polygon', coordinates:[[[19005302.71, 8552947.37],
            [18775380.09, 8528526.66],
            [18838975.69, 8628653.04],
            [18838975.69, 8628653.04],
            [18933146.19, 8622852.76],
            [19005302.71, 8552947.37]]]}}]).done(()=>{
                nsGmx.leafletMap.gmxDrawing.remove(obj[0]);
                setTimeout(()=>{
                    nsGmx.gmxMap.layersByID['FF3D4FD4291040BA9A6139EEE2CE3D23']._gmx._chkVersion();
                    this.inProgress(false);
                }, 5000);                
            }); 
    },
    _clean = function () {

    };
    let _stateUI = '',
        _createBut, _chooseBut,        
        _layer;
;

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


};

MyCollectionView.prototype.show = function () {
    this.frame.show();
    //this.searchInput.focus();
    BaseView.prototype.show.apply(this, arguments);
};

module.exports = MyCollectionView;
