require("./TracksView.css");
require("../SearchControl.css");
require("../SelectControl.css");
const BaseView = require('./BaseView.js'),
      Request = require('../../../Common/Request'),
      Calendar = require('../../../Common/Controls/Calendar'),
      SearchControl = require('../../../Common/Controls/SearchControl'),
      SelectControl = require('../../../Common/Controls/SelectControl');

const _searchLayer = 'EE5587AF1F70433AA878462272C0274C',
      _selectLayers = [
        {
            name: 'FOS', id: 'ED043040A005429B8F46AAA682BE49C3', sort: 'timestamp',            
            columns: JSON.stringify([{"Value":"mmsi"},{"Value":"timestamp"},{"Value":"course"},{"Value":"speed"},{"Value":"port_of_destination"},{"Value":"eta"},{"Value":"heading"},{"Value":"lon"},{"Value":"lat"}]),
            get vesselQuery() { return `([imo] IN (${_thisView.imo})) and `; },
            get query() { return this.vesselQuery + `'${_thisView.calendar.dateInterval.get('dateBegin').toISOString()}'<=[timestamp] and [timestamp]<'${_thisView.calendar.dateInterval.get('dateEnd').toISOString()}'`;}
        }, 
        {
            name: 'AIS', id: '5790ADDFBDD64880BAC95DF13B8327EA', sort: 'ts_pos_utc',
            columns: JSON.stringify([{"Value":"mmsi"},{"Value":"flag_country"},{"Value":"callsign"},{"Value":"ts_pos_utc"},{"Value":"cog"},{"Value":"sog"},{"Value":"draught"},{"Value":"vessel_type"},{"Value":"destination"},{"Value":"ts_eta"},{"Value":"nav_status"},{"Value":"heading"},{"Value":"rot"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]),
            get query() {return `([mmsi] IN (${_thisView.mmsi})) and '${_thisView.calendar.dateInterval.get('dateBegin').toISOString()}'<=[ts_pos_utc] and [ts_pos_utc]<'${_thisView.calendar.dateInterval.get('dateEnd').toISOString()}'`;}
        }
        ];

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
 
            </div> 
            <div class="grid">

            </div>
            <div class="footer unselectable">
       
            </div>
            </div>`
        )());
        _addCalendar.call(this);

        this.trackLayer = _selectLayers[0];
        this.frame.find('.reload').on('click', (e=>{
            if (this.mmsi){
                this.model.isDirty = true;
                this.inProgress(true);
                this.show();
            }
            else{
                this.model.data.track.length = 0;
                this.model.data.msg.length = 0;
                this.repaint();
            }
        }).bind(this));

        this.container = this.frame.find('.grid');
        this.footer = this.frame.find('.footer');       
        this.selectLayer = new SelectControl(this.frame.find('.select_container')[0], _selectLayers.map(l=>l.name), 0, selected=>{_thisView.trackLayer = _selectLayers[selected]}); 
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
                if(!v){
                    _thisView.mmsi =  null;
                    _thisView.model.data.track.length = 0;
                    _thisView.model.data.msg.length = 0;
                    _thisView.repaint();
                }
                else{
                    _thisView.mmsi =  v.mmsi;
                    _thisView.imo =  v.imo;
                }

            }).bind(this)
        });

        Object.defineProperty(this, "tableTemplate", {
            get: function () {
                return  
                    this.model.data.tracks.map((t,i) => {
                        return `<table class="track-table" border="1">
                <tbody><tr>
                <td><div class="open_positions ui-helper-noselect icon-right-open icon-down-open" title="Параметры движения"></div></td>
                <td><span class="date">${t.utc_date}</span></td>
                <td><div class="track"><input type="checkbox" title="трек за сутки"></div></td>
                <td><div class="count">${t.positions.length}</div></td></tr></tbody></table>
                <div class="positions ${i}">
                <table class="positions-table"><tbody>` +
                t.positions.map((p,j) => { return `<tr>                
                <td><span class="utc_time">${p.utc_time}</span><span class="local_time">${p.local_time}</span></td>
                <td><span class="utc_date">${t.utc_date}</span><span class="local_date">${p.utc_date}</span></td>
                <td>${p.lon}&nbsp;&nbsp;${p.lat}</td><td>
                <div class="showpos ${i} ${j}" title="положение"><img src="plugins/AIS/AISSearch/svg/center.svg"></div></td>
                </tr>`;}).join('') + 
                + `</tbody></table>`;
                /*
                <tr>
                <td title="информация"><img class="show_info" id="show_info0" src="plugins/AIS/AISSearch/svg/info.svg"></td>
                <td><span class="utc_time">16:48:13</span><span class="local_time">19:48:13</span></td>
                <td><span class="utc_date">02.12.2019</span><span class="local_date">02.12.2019</span></td>
                <td><img src="http://maps.kosmosnimki.ru/api/img/AIS/tanker-L-100-move.svg" class="legend_icon rotateimg330"><img src="http://geomixer.scanex.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&amp;img=AIS%5CSCF%5Csog8-L-100-move.svg" class="legend_iconalt rotateimg330" style="display: none;"></td>
                <td><img src="plugins/AIS/AISSearch/svg/satellite-ais.svg"></td>
                <td>73.96 E&nbsp;&nbsp;72.50 N</td><td>
                <div class="show_pos" id="show_pos0" title="положение"><img src="plugins/AIS/AISSearch/svg/center.svg"></div></td>
                </tr>
                <tr><td colspan="7" class="more"><hr>
                <div class="vi_more">
                <div class="c1">COG | SOG:</div><div class="c2">&nbsp;327.10001° &nbsp; 11 уз</div>
                <div class="c1">HDG | ROT:</div><div class="c2">&nbsp;328° &nbsp; 2°/мин</div>
                <div class="c1">Осадка:</div><div class="c2">&nbsp;9.3 м</div>
                <div class="c1">Назначение:</div><div class="c2">&nbsp;RU SAB &gt; RU MMK</div>
                <div class="c1">Статус:</div><div class="c2">&nbsp;Under Way Using Engine</div>
                <div class="c1">ETA:</div><div class="c2">&nbsp;<span class="utc_time">05.12.2019 18:00:00</span><span class="local_time">05.12.2019 21:00:00</span></div>
                </div></td></tr>;
                */
                    }).join('') +
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
