require("./TracksView.css");
require("../SearchControl.css");
require("../SelectControl.css");
const BaseView = require('./BaseView.js'),
      Request = require('../../../Common/Request'),
      Calendar = require('../../../Common/Controls/Calendar'),
      SearchControl = require('../../../Common/Controls/SearchControl'),
      SelectControl = require('../../../Common/Controls/SelectControl');

const _searchLayer = 'EE5587AF1F70433AA878462272C0274C',
      _selectLayers = [{name: 'FOS', id: 'ED043040A005429B8F46AAA682BE49C3'}, {name: 'AIS', id: '5790ADDFBDD64880BAC95DF13B8327EA'}];

let _thisView, _layer;

const MyCollectionView = function ({ model, layer }) {
    _thisView = this;

        BaseView.call(this, model);
        this.frame = $(Handlebars.compile(`<div class="trackexport-view">
            <div class="header">
                <table border=0 class="instruments unselectable">
                <tr>
                    <td class="search_input_container"></td>
                    <tr>
                        <td class="select_container"></td>
                    </tr>
                </tr>
                </table> 

                <table border=0><tr>
                <td><div class="calendar"></div></td>
                <td style="vertical-align: top"><div class="reload"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg></div></td>
                <td style="vertical-align: top; width: 50px"><div class="refresh" style="margin: 10px 0 0 20px; display:none">${this.gifLoader}</div></div></td>
                </table></tr> 

                <table border=0 class="grid-header">
                <tr><td class="visibility-all">
                <svg style="display:block"><use xlink:href="#icons_eye"></use></svg>                
                <svg style="display:none"><use xlink:href="#icons_eye-off"></use></svg>
                </td>
                <td>${_gtxt('TrackExport.reg_id')}</td>
                <td>${_gtxt('TrackExport.reg_created')}</td>
                <td>${_gtxt('TrackExport.reg_updated')}</td>
                <td class="color-transparent"><svg><use xlink:href="#icons_eye"></use></td>
                <td class="color-transparent"><svg><use xlink:href="#icons_eye"></use></td>
                <td class="color-transparent"><svg><use xlink:href="#icons_eye"></use></td></tr>
                </table> 
            </div> 
            <div class="grid">

            </div>
            <div class="footer unselectable">
       
            </div>
            </div>`
        )());
        _addCalendar.call(this);

        this.trackLayer = _selectLayers[0].id;
        this.frame.find('.reload').on('click', (e=>{
            if (this.mmsi){
console.log(this.mmsi, this.trackLayer, this.calendar.dateInterval.get('dateBegin'));
                this.model.isDirty = true;
                this.inProgress(true);
                this.show();
            }
        }).bind(this));

        this.container = this.frame.find('.grid');
        this.footer = this.frame.find('.footer');       
        this.selectLayer = new SelectControl(this.frame.find('.select_container')[0], _selectLayers.map(l=>l.name), 0, selected=>{_thisView.trackLayer = _selectLayers[selected].id}); 
        this.selectLayer.dropDownList.classList.add('trackexport-view');     
        this.searchInput = new SearchControl({tab:this.frame[0], container:this.frame.find('.search_input_container')[0], 
            searcher: {
                searchpromise: function(params){
                    var request =  `layer=${_searchLayer}&columns=[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"vessel_type"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]&orderby=vessel_name&${params[0].name}=${params[0].value}`;
                    return Request.fetchRequest('/Plugins/AIS/SearchShip.ashx', request, 'POST');
                },
                parser: function(response){                
                    if (response.Status && response.Status.toLowerCase()=='ok' && response.Result){                    
                        let columns = response.Result.columns,
                            values = response.Result.values;
                        return values.map(v=>{
                            let rv = {};
                            columns.forEach((c, i)=>{rv[c] = v[i]});
                            return rv;
                        });
                    }
                    else{
                        console.log(response);
                        return [];
                    }
                }
            },
            callback:(v=>{
                _thisView.mmsi = v.mmsi;
            }).bind(this)
        });

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

            });

        this.calendar = new Calendar({
            dateInterval: dateInterval,
            name: 'catalogInterval',
            container: calendar,
            dateMin: new Date(0, 0, 0),
            dateMax: new Date(),
            dateFormat: 'dd.mm.yy',
            minimized: false,
            showSwitcher: false
        });

        let tr = calendar.querySelector('tr:nth-of-type(1)');
        tr.insertCell(2).innerHTML = '&nbsp; - &nbsp;';
        tr.insertCell(6).innerHTML = 
        '<img class="default_date" style="cursor:pointer; padding:10px" title="'+_gtxt('TrackExport.calendar_today')+'" src="plugins/AIS/AISSearch/svg/calendar.svg">';
        calendar.querySelector('.default_date').addEventListener('click', () => {
            let db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
            dateInterval.set({
                dateBegin: db.dateBegin,
                dateEnd: db.dateEnd
            });
        });
    },
    _clean = function () {


    };

MyCollectionView.prototype = Object.create(BaseView.prototype);

MyCollectionView.prototype.inProgress = function (state) {
    let progress = this.frame.find('div.refresh');
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
    if (!this.frame)
        return;

    this.searchInput.focus();
    BaseView.prototype.show.apply(this, arguments);
};

module.exports = MyCollectionView;
