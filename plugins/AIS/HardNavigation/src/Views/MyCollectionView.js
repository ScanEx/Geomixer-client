require("./MyCollection.css")
const BaseView = require('./BaseView.js');

//let _searchString = "";

const MyCollectionView = function ({ model, registerDlg }) {
        BaseView.call(this, model);
        this.frame = $(Handlebars.compile(`<div class="hardnav-view">
            <div class="header">
                <table border=1 class="instruments">
                <tr><td class="but choose">${_gtxt('HardNavigation.choose_reg')}</td><td class="but create">${_gtxt('HardNavigation.create_reg')}</td></tr>
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
        
        this.frame.find('.but.choose').on('click', _copyRegion.bind(this));      
        this.frame.find('.but.create').on('click', _createRegion.bind(this));

    },
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
                        const obj=nsGmx.leafletMap.gmxDrawing.addGeoJSON(L.gmxUtil.geometryToGeoJSON(response.Result.values[0][i], true));
                    }
                    else
                        console.log(response);
                    this.frame.find('.but.choose').click(); 
                }                
            }.bind(this));
        return true;
    },
    _copyRegion = function(){
        const but = this.frame.find('.but.choose');
        if (_stateUI != 'copy_region'){
            if (_stateUI != '')
                this.frame.find('.but.create').click(); 
            _stateUI = 'copy_region';
            but.addClass('active');

            for (var iL = 0; iL < nsGmx.gmxMap.layers.length; iL++) {
                var layer = nsGmx.gmxMap.layers[iL],
                    props = layer.getGmxProperties();

                if (layer.disableFlip && layer.disablePopup) {
                    layer.disableFlip();
                    layer.disablePopup();
                }

                if (layer instanceof L.gmx.VectorLayer && props.GeometryType.toLowerCase()=='polygon') {
                    _listeners[props.name] = _layerClickHandler;
                    layer.on('click', _listeners[props.name].bind(this));
                }
            }
        }
        else{
            _stateUI = '';
            but.removeClass('active');
            nsGmx.gmxMap.layers.forEach( layer=>{
                if (layer.disableFlip && layer.disablePopup) {
                    layer.enableFlip();
                    layer.enablePopup();
                }
            });
            for (var layerName in _listeners) {
                nsGmx.gmxMap.layersByID[layerName].off('click', _listeners[layerName]);
                delete _listeners[layerName];
            }
        }
    },
    _onDrawStop = function(e){
                    const gj = e.object.toGeoJSON();
                    console.log(gj.geometry);   
                    //nsGmx.leafletMap._container.style.cursor='pointer'; 
                    //nsGmx.leafletMap.gmxDrawing.create('Polygon'); 
                    if (_stateUI == 'create_region')
                        this.frame.find('.but.create').click();
            },
    _createRegion = function(){
        const but = this.frame.find('.but.create');

        if (_stateUI != 'create_region'){
            if (_stateUI != '')
                this.frame.find('.but.choose').click();  
            _stateUI = 'create_region'; 
            but.addClass('active');          
            nsGmx.leafletMap.gmxDrawing.on('drawstop', _onDrawStop.bind(this));

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
            but.removeClass('active');    
            nsGmx.leafletMap._container.style.cursor='';     
            nsGmx.leafletMap.gmxDrawing.off('drawstop', _onDrawStop);

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
    let _stateUI = '';

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
