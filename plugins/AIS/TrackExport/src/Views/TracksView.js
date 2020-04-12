require("./TracksView.css");
require("../SearchControl.css");
require("../SelectControl.css");
const BaseView = require('./BaseView.js'),
      Request = require('../Request'),
      Calendar = require('../Calendar'),
      SearchControl = require('../SearchControl'),
      SelectControl = require('../SelectControl');

const _toDd = function (D, isLng) {
    let dir = D < 0 ? isLng ? 'W' : 'S' : isLng ? 'E' : 'N',
        deg = Math.round((D < 0 ? D = -D : D) * 1000000) / 1000000
    return deg.toFixed(2) + " "//"°"
        + dir
};

const _searchLayer = 'EE5587AF1F70433AA878462272C0274C',//'CE660F806D164FE58556638D752A4203',
      _selectLayers = [
        {
            name: 'FOS', id: 'ED043040A005429B8F46AAA682BE49C3', sort: 'timestamp',            
            columns: JSON.stringify([{"Value":"mmsi"},{"Value":"timestamp"},{"Value":"course"},{"Value":"speed"},{"Value":"port_of_destination"},{"Value":"eta"},{"Value":"heading"},{"Value":"lon"},{"Value":"lat"}]),
            get vesselQuery() { return `([imo] IN (${_thisView.imo})) and `; },
            get query() { return this.vesselQuery + `'${_thisView.calendar.dateInterval.get('dateBegin').toISOString()}'<=[timestamp] and [timestamp]<'${_thisView.calendar.dateInterval.get('dateEnd').toISOString()}'`;},
            parseData: function(fields, value, getVicon){                             
                let tzOffset = new Date().getTimezoneOffset(), ts = value[fields.indexOf('timestamp')],
                utcDate = new Date((value[fields.indexOf('timestamp')] + tzOffset*60)*1000), locDate =  new Date(value[fields.indexOf('timestamp')]*1000);                
                return {
                    ts: ts,
                    cog: value[fields.indexOf('course')], sog: value[fields.indexOf('speed')],
                    utc_date: utcDate.toLocaleDateString(), utc_time: utcDate.toLocaleTimeString(),
                    local_date: locDate.toLocaleDateString(), local_time: locDate.toLocaleTimeString(),
                    lat: _toDd(value[fields.indexOf('lat')]), lon: _toDd(value[fields.indexOf('lon')], true),
                    latitude: value[fields.indexOf('lat')], longitude: value[fields.indexOf('lon')],
                    vicon: getVicon('Undefined', value[fields.indexOf('course')], value[fields.indexOf('speed')])
                }

            }
        }, 
        {
            name: 'AIS', sort: 'ts_pos_utc', id: '8EE2C7996800458AAF70BABB43321FA4', //'5790ADDFBDD64880BAC95DF13B8327EA', 
            columns: JSON.stringify([{"Value":"mmsi"},{"Value":"flag_country"},{"Value":"callsign"},{"Value":"ts_pos_utc"},{"Value":"cog"},{"Value":"sog"},{"Value":"draught"},{"Value":"vessel_type"},{"Value":"destination"},{"Value":"ts_eta"},{"Value":"nav_status"},{"Value":"heading"},{"Value":"rot"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]),
            get query() {return `([mmsi] IN (${_thisView.mmsi})) and '${_thisView.calendar.dateInterval.get('dateBegin').toISOString()}'<=[ts_pos_utc] and [ts_pos_utc]<'${_thisView.calendar.dateInterval.get('dateEnd').toISOString()}'`;},
            parseData: function(fields, value, getVicon){                             
                let tzOffset = new Date().getTimezoneOffset(), ts = value[fields.indexOf('ts_pos_utc')],
                utcDate = new Date((value[fields.indexOf('ts_pos_utc')] + tzOffset*60)*1000), locDate =  new Date(value[fields.indexOf('timestamp')]*1000);                
                return {
                    ts: ts,
                    cog: value[fields.indexOf('cog')], sog: value[fields.indexOf('sog')],
                    utc_date: utcDate.toLocaleDateString(), utc_time: utcDate.toLocaleTimeString(),
                    local_date: locDate.toLocaleDateString(), local_time: locDate.toLocaleTimeString(),
                    lat: _toDd(value[fields.indexOf('latitude')]), lon: _toDd(value[fields.indexOf('longitude')], true),
                    latitude: value[fields.indexOf('latitude')], longitude: value[fields.indexOf('longitude')],
                    vicon: getVicon(value[fields.indexOf('vessel_type')], value[fields.indexOf('cog')], value[fields.indexOf('sog')])
                }

            }       
        }
        ];

let _thisView, _layer;

const TracksView = function ({ model, layer }) {
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
                <td style="vertical-align: top"><div class="reload" title="${_gtxt('TrackExport.reload')}"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"></path></svg></div></td>
                </table></tr> 
 
            </div> 
            <div class="refresh" style="display: none; padding-top: 100%;padding-left: 50%;"><img src="img/progress.gif"></div>
            <div class="grid"></div>
            <div class="footer unselectable">
       
            </div>
            </div>`
        )());
        _addCalendar.call(this);

        this.trackLayer = _selectLayers[0];
        this.frame.find('.reload').on('click', (e=>{
            let db = _thisView.calendar.dateInterval.get('dateBegin'),
                de = _thisView.calendar.dateInterval.get('dateEnd'),
                daysDiff = Math.ceil((de.getTime() - db.getTime()) / (24*3600000));
//console.log(_thisView.calendar, daysDiff)
            if ((this.mmsi || this.imo) && daysDiff<8) {
                this.model.isDirty = true;
                this.inProgress(true);
                this.show();
            }
            else{
                this.model.free(); 
                if(daysDiff>7)
                    this.model.data.msg = [{txt:_gtxt('TrackExport.intervalExceeds')}];
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
                    _thisView.imo =  null;
                    _thisView.vname = null;
                    _thisView.model.free();
                    _thisView.repaint();
                }
                else{
                    _thisView.mmsi =  v.mmsi;
                    _thisView.imo =  v.imo;
                    _thisView.vname = v.vessel_name;
                }

            }).bind(this)
        });

        Object.defineProperty(this, "tableTemplate", {
            get: function () {
                let totalPositions = this.model.data.total,
                    rv = (!totalPositions ? `` : `<table class="track-table"><tr>
                        <td></td>
                        <td>
                        <span class='export shape' title="${_gtxt("TrackExport.export")}">shp</span> 
                        <span class='export geojson' title="${_gtxt("TrackExport.export")}">geojson</span> 
                        <span class='export gpx' title="${_gtxt("TrackExport.export")}">gpx</span> 
                        </td>
                        <td><div class="track all"><input type="checkbox" checked title="${_gtxt("TrackExport.allDailyTracks")}"></div></td>
                        <td><div class="count">${totalPositions}</div></td></tr></table>`) +                    
                    this.model.data.tracks.map((t,i) => {
                        return `<table class="track-table" border="0">
                        <tbody><tr>
                        <td><div class="open_positions track_${i} ui-helper-noselect icon-right-open ${this.model.data.tracks.length>1 ? 'icon-right-open' : 'icon-down-open'} " title="${_gtxt('TrackExport.positions')}"></div></td>
                        <td><span class="date">${t.utc_date}</span></td>
                        <td><div class="track"><input type="checkbox" checked title="${_gtxt('TrackExport.dailyTrack')}" id="${i}"></div></td>
                        <td><div class="count">${t.positions.length}</div></td></tr></tbody></table>

                        <div class="track_${i}" >${_thisView.model.data.tracks.length==1 ? _renderPosTable(i) : ""}</div>`;
                    }).join('') +
                    (this.model.data.msg ? this.model.data.msg.map(m => `<div class="msg">${m.txt}</div>`).join('') : '');
                return rv;
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
    _renderPosTable = function(i){
        let t = _thisView.model.data.tracks[i];
            return `<table class="positions-table"><tbody>` +
            t.positions.map((p,j) => { return `<tr>                
            <td><span class="utc_time">${p.utc_time}</span><span class="local_time">${p.local_time}</span></td>
            <td><span class="utc_date">${t.utc_date}</span><span class="local_date">${p.local_date}</span></td>
            <td>${p.lon}&nbsp;&nbsp;${p.lat}</td>
            <td>${p.vicon ? p.vicon.svg : ''}</td><td></td>
            <td><div class="show_pos" id="${i}_${j}" title="${_gtxt('TrackExport.position')}"><img src="plugins/AIS/AISSearch/svg/center.svg"></div></td>
            </tr>
            <tr><td colspan="6" class="more"><hr><div class="vi_more"></div></td></tr>`;}).join('') + 
            `</tbody></table>`;
    },
    _addCalendar = function(){            
        const calendar = this.frame.find('.calendar')[0];
        // walkaround with focus at first input in ui-dialog
        calendar.innerHTML = ('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');

        const mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
              dateInterval = new nsGmx.DateInterval(),
              msd = 24*3600000;
    
        dateInterval
            .set('dateBegin', mapDateInterval.get('dateBegin'))
            .set('dateEnd', mapDateInterval.get('dateEnd'))
            .on('change', function (e) {
                let d = new Date(e.attributes.dateEnd.getTime() - msd*7);
                _thisView.calendar._dateInputs.datepicker('option', 'minDate', d);
                if (e.attributes.dateBegin.getTime()<d.getTime())
                    e.attributes.dateBegin = new Date(d.getTime());
// console.log(d)
// console.log(_thisView.calendar.dateInterval.get('dateBegin'))
            });

        this.calendar = new Calendar({
            dateInterval: dateInterval,
            name: 'catalogInterval',
            container: calendar,
            dateMin: new Date(nsGmx.DateInterval.getUTCDayBoundary().dateBegin.getTime() - msd*6),
            //dateMax: new Date(),
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
        this.frame.find('.open_positions').off('click', _onOpenPosClick);
        this.frame.find('.track-table .track:not(".all") input').off('click', _onShowTrack),
        this.frame.find('.track-table .track.all input').off('click', _onShowAllTracks),
        this.frame.find('.show_pos').off('click', _onShowPos);
        this.frame.find('.track-table .export').off('click', _onExport);
    };

TracksView.prototype = Object.create(BaseView.prototype);

TracksView.prototype.inProgress = function (state) {
    let progress = this.frame.find('div.refresh'), grid = this.frame.find('div.grid');
    if (state){
        grid.hide();
        progress.show();
    }
    else{
        progress.hide();
        grid.show();
    }
};

// TracksView.prototype.resize = function () { 
//     let h = $('.iconSidebarControl-pane').height() - this.frame.find('.instruments').outerHeight()
//     - this.frame.find('.results').outerHeight() - this.frame.find('.menu').outerHeight();
//     this.container.height(h+1);
// };

const _onOpenPosClick = function(e){
        let icon = $(e.target), id;
        for (var i=0; e.target.classList[i]; ++i){
            if (e.target.classList[i].search(/track_/)!=-1){
                id = e.target.classList[i];
                break;
            }
        }
        if (icon.is('.icon-down-open')) {
            icon.removeClass('icon-down-open').addClass('.icon-right-open');
            if(id){
                let div = $(`.${id}:not(.open_positions)`);
                div.hide();
                if (id!='track_0'){
                    div.find('.show_pos').off('click', _onShowPos);
                    div.html('');
                }
            }
        }
        else {
            icon.addClass('icon-down-open').removeClass('.icon-right-open');
            if (id){
                let div = $(`.${id}:not(.open_positions)`);
                if (!$(`.${id} .positions-table`)[0]){
                    div.html(_renderPosTable(parseInt(id.split('_')[1])));
                    div.find('.show_pos').on('click', _onShowPos);
                }
                div.show(); 
            }                
        }
    }, 
    _onShowAllTracks = function(e){
        let showTrack = _thisView.frame.find('.track-table .track:not(".all") input'),
            showAllTracks = _thisView.frame.find('.track-table .track.all input'); 
        showTrack.each((i, el)=>{
            el.checked = showAllTracks[0].checked;
            if (showAllTracks[0].checked)
                _thisView.model.drawTrack(el.id);
            else
                _thisView.model.eraseTrack(el.id);
        });
    },
    _onShowTrack = function(e){
        let showTrack = _thisView.frame.find('.track-table .track:not(".all") input'),
            showAllTracks = _thisView.frame.find('.track-table .track.all input'); 
        let id = parseInt(e.currentTarget.id);
        if (e.currentTarget.checked)
            _thisView.model.drawTrack(id);
        else
            _thisView.model.eraseTrack(id);

        let checkAll = true;
        showTrack.each((i, el)=>{checkAll = checkAll && el.checked});
        showAllTracks[0].checked = checkAll;
    },
    _onShowPos = function(e){
        let ij = e.currentTarget.id.split('_'), pos = _thisView.model.data.tracks[ij[0]].positions[ij[1]];
        //_thisView.model.fitToTrack(ij[0]);
        nsGmx.leafletMap.setView([pos.latitude, pos.longitude]);
    },
    _onExport = function(e){
        let type = e.currentTarget.className.replace(/export */, ''),
        tracks = _thisView.model.data.tracks,
        trackLine = tracks.reduce((p,c)=>{
            c.positions.forEach(pos=>p.push([pos.longitude, pos.latitude])); 
            return p;
        }, []),
        features = [{geometry:L.gmxUtil.geometryToGeoJSON({type:'LINESTRING', coordinates:trackLine})}];
        let getFilename = function(){
            let spart = tracks[0].utc_date, //`${s.getFullYear()}_${s.getMonth()+1}_${s.getDate()}`,
            epart = tracks.length>1 ? '_' +  tracks[tracks.length-1].utc_date: ''; //tracks.length>1 ? `_${e.getFullYear()}_${e.getMonth()+1}_${e.getDate()}` : '';
            return `${_thisView.vname}_${spart}${epart}`.replace(/[!\?\:<>"'#]/g, '').replace(/[ \.\/\\-]/g, '_');
        }
        nsGmx.Utils.downloadGeometry(features, {fileName: getFilename(), format: type}); 
//console.log(features, {fileName: `${_thisView.vname}_${tracks[0].utc_date}${tracks.length>1?'_' + tracks[tracks.length-1].utc_date:''}`.replace(/ |\./g, '_'), format: type,});
    };

TracksView.prototype.repaint = function () { 
    _clean.call(this);
    BaseView.prototype.repaint.call(this);      
    
    this.frame.find('.open_positions').on('click', _onOpenPosClick);
    this.frame.find('.track-table .track:not(".all") input').on('click', _onShowTrack);
    this.frame.find('.track-table .track.all input').on('click', _onShowAllTracks);
    this.frame.find('.track-table .export').on('click', _onExport);

    this.frame.find('.track_0 .positions-table .show_pos').on('click', _onShowPos);
};

TracksView.prototype.show = function () {
    if (!this.frame)
        return;

    this.searchInput.focus();
    BaseView.prototype.show.apply(this, arguments);
};

module.exports = TracksView;
