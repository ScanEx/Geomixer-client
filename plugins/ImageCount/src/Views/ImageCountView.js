require("../../icons.svg");
require("./ImageCountView.css");
const BaseView = require('./BaseView.js')
      Calendar = require('../Calendar');
const ImageCountView = function (layers, model) {
    const 
    _thisView = this,
    _drawPolygons = [],
    _borderPolygons = [],
    _addCalendar = function(){            
        const calendar = this.frame.find('.calendar')[0];
        // walkaround with focus at first input in ui-dialog
        calendar.innerHTML = ('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');

        const mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
              dateInterval = new nsGmx.DateInterval(),
              msd = 24*3600000;
    
        dateInterval
            .set('dateBegin', mapDateInterval.get('dateBegin'))
            .set('dateEnd', mapDateInterval.get('dateEnd'));
//             .on('change', function (e) {
//                 //let d = new Date(e.attributes.dateEnd.getTime() - msd*7);
//                 //_thisView.calendar._dateInputs.datepicker('option', 'minDate', d);
//                 // if (e.attributes.dateBegin.getTime()<d.getTime())
//                 //     e.attributes.dateBegin = new Date(d.getTime());
// //console.log(_thisView.calendar.dateInterval.get('dateBegin'), _thisView.calendar.dateInterval.get('dateEnd'))
//             });

        this.calendar = new Calendar({
            dateInterval: dateInterval,
            name: 'catalogInterval',
            container: calendar,
            //dateMin: new Date(nsGmx.DateInterval.getUTCDayBoundary().dateBegin.getTime() - msd*6),
            //dateMax: new Date(),
            dateFormat: 'dd.mm.yy',
            minimized: false,
            showSwitcher: false
        });

        let tr = calendar.querySelector('tr:nth-of-type(1)');
        tr.insertCell(2).innerHTML = '&nbsp; - &nbsp;';
        tr.insertCell(6).innerHTML = 
        '<img class="default_date" style="cursor:pointer; padding:10px" title="'+_gtxt('ImageCount.calendar_today')+'" src="plugins/AIS/AISSearch/svg/calendar.svg">';
        calendar.querySelector('.default_date').addEventListener('click', () => {
            let db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
            dateInterval.set({
                dateBegin: db.dateBegin,
                dateEnd: db.dateEnd
            });
        });
    },
    _selectBorder = function(e){
//console.log(e.target)
        _thisView.frame.find('.choose').click();
        _thisView.model.polygon = e.target;
    };
    BaseView.call(this, model);

        this.frame = $(`<div class="imagecount-view">
        <div class="header">
        <div class="select-label label1">${_gtxt('ImageCount.SelectSystem')}</div>
        <div class="system">
        ${Object.keys(layers).map(k=>`<label><input id="system" name="system" type="radio" value="${k}">${layers[k]}</label><br>`).join('')}
        </div>
        <div class="but choose">${_gtxt('ImageCount.SelectBorder')}<svg><use xlink:href="#icons_selectreg"></use></svg></div>
        
        <style>#ui-datepicker-div .ui-datepicker-next {height: 1.8em !important;}#ui-datepicker-div .ui-datepicker-next span.ui-icon.ui-icon-circle-triangle-e {background: url(img/arrows.png) no-repeat 0 -18px !important;}#ui-datepicker-div .ui-datepicker-next.ui-state-hover span.ui-icon.ui-icon-circle-triangle-e {background: url(img/arrows.png) no-repeat 0 -38px !important;}</style>    
 
        <div class="select-label label2">${_gtxt('ImageCount.SelectInterval')}</div>       
        <div class="calendar" style="padding: 0px 0 20px 20px;"></div>      
        <div><div class="but-count">${_gtxt("ImageCount.Count")}</div></div>
        </div>
        <div class="results"></div>
        </div>`);
        this.container = this.frame.find('.results');
        this.frame.find('.system input').on('click', function(e){
            _thisView.model.system = e.target.value;
        })
        this.frame.find('.but-count').on('click', function(e){
            _thisView.container.find('.params .count').text('');
            _thisView.inProgress(true);
            _thisView.model.count()
            .catch(error=>{
                _thisView.inProgress(false);
                if (error=='polygon' || error=='system')
                    _thisView.container.find(`.exclamation`).show();
                console.log(error)
            });
        })
        this.frame.find('.choose').on('click', e=>{
            const drawObjects  = nsGmx.leafletMap.gmxDrawing.items, mapLayers = nsGmx.leafletMap._layers;
            $(e.target).toggleClass('active');
            if ($(e.target).is('.active')){
                _drawPolygons.length = 0;
                _borderPolygons.length = 0;
                drawObjects.forEach(l=>{
                    var t = l.options.type.toLowerCase(); 
                    if(t=='rectangle'||t=='polygon'){  
                        _drawPolygons.push(l);
                        l.disableEdit();
                    }
                });                      
//console.log(_drawPolygons)
                Object.keys(mapLayers).forEach(k=>{
                    var l = mapLayers[k], t = l.feature && l.feature.geometry.type.toLowerCase(); 
                    if (t=='polygon' || t=='multipolygon' || t=='rectangle') { 
                        mapLayers[k].on('click', _selectBorder);
                        _borderPolygons.push(mapLayers[k]);             
                    }
                });
//console.log(_borderPolygons)
            }
            else{
                _borderPolygons.forEach(bp=>bp.off('click', _selectBorder));
                _drawPolygons.forEach(dp=>dp.enableEdit());
                _drawPolygons.length = 0;
                _borderPolygons.length = 0;           
            }

        });
        this.drawTable = function(d) {
                let p = d.polygon, 
                    b = this.frame.find('.CalendarWidget-dateBegin').val(), e=this.frame.find('.CalendarWidget-dateEnd').val(),
                    r = d.result,
                    sl = this.frame.find('.system input:checked').parent(),
                    rv = '<div class="params">';
                rv += `<div>${sl[0]?sl.text():_gtxt("ImageCount.NoSystem")+' <span class="exclamation">!</span>'}</div>`;    
                if (p){
                    const g = p.feature.geometry
                    if (g.type=='Polygon')
                    rv += `<div class="polygon">${_gtxt('ImageCount.Polygon')}, ${_gtxt('ImageCount.vertices')}: ${g.coordinates[0].length-1}</div>`;
                    else
                    rv += `<div class="polygon">${_gtxt('ImageCount.MultiPolygon')}: ${g.coordinates.length}</div>`;
                    rv += `<div>${p._popup?p._popup._content.replace(/<br\/?>[\s\S]+/i, ''):''}</div>`;
                }
                else
                    rv += `<div>${_gtxt('ImageCount.NoBorder')} <span class="exclamation">!</span></div>`;                                        
                rv += `<div>${b} - ${e}</div>`; 
                if (r!==null){
                    rv += `<div class="count">${_gtxt('ImageCount.Result')}: ${r}</div>`; 
                }
                rv += `<div class="icon-refresh-gif refresh"></div>`;

                return rv;
        };  

        Object.defineProperty(this, "topOffset", {
            get: function () { 
                return this.frame.find('.header')[0] && this.frame.find('.header')[0].getBoundingClientRect().height;
            }
        });  
        Object.defineProperty(this, "bottomOffset", {
            get: function () {             
                return 20;//this.frame.find('.footer')[0] && this.frame.find('.footer')[0].getBoundingClientRect().height;
            }
        }); 

        _addCalendar.call(this);
        this.model.interval = this.calendar.dateInterval;
    };

ImageCountView.prototype = Object.create(BaseView.prototype);

ImageCountView.prototype.inProgress = function (state) {
    let progress = this.frame.find('div.refresh');
    if (state){
        progress.show();
    }
    else{
        progress.hide();
    }
};

ImageCountView.prototype.repaint = function () { 
    //_clean.call(this);
    BaseView.prototype.repaint.call(this); 
    this.container.find('.polygon').on('click', ()=>{
        nsGmx.leafletMap.fitBounds(this.model.data.polygon._bounds);        
    })   
};

// ImageCountView.prototype.show = function () {
//     if (!this.frame)
//         return;
//     BaseView.prototype.show.apply(this, arguments);
// };

module.exports = ImageCountView;
