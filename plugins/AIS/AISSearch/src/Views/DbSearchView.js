require("./DbSearch.css");
require("../Controls/SearchControl.css");
const BaseView = require('./BaseView.js'),
SearchControl = require('../Controls/SearchControl');

let // _searchString = "",
    // _setSearchInputValue = function (s) {
    //     let searchBut = this.frame.find('.filter .search'),
    //         removeBut = this.frame.find('.filter .remove'),
    //         _searchString = s;
            
    //     this.searchInput.val(_searchString);
    //     if (s != "") {
    //         removeBut.show();
    //         searchBut.hide();
    //     }
    //     else
    //         removeBut.click();
    // },
    _searchLayer,
    _highlight,
    _tools,
    _displayedOnly = [];
const _switchLegendIcon = function(showAlternative){
    let ic = this.frame.find('.legend_icon'),
    ica = this.frame.find('.legend_iconalt');
    if (showAlternative){
        ic.hide(); ica.show();
    }
    else{
        ica.hide(); ic.show();
    }
};
const DbSearchView = function (model, options, tools) {
    BaseView.call(this, model, tools);
    _searchLayer = options.aisLastPoint;
    _highlight = options.highlight;
    _tools = tools;
    this.frame = $(Handlebars.compile('<div class="ais_view search_view">' +
        '<table border=0 class="instruments">' +
        '<tr><td colspan="2" class="search_input_container">' + 
        
        //'<div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/>' +
        //'<div><img class="search clicable" src="plugins/AIS/AISSearch/svg/search.svg">' +
        //'<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg">' +
        //'</div></div>' + 
        '' +

        '</td></tr>' +
        '<tr><td class="time" colspan="2"><span class="label">{{i "AISSearch2.time_switch"}}:</span>' +
        '<span class="utc on unselectable" unselectable="on">UTC</span><span class="local unselectable" unselectable="on">{{i "AISSearch2.time_local"}}</span>'+
        '<span class="sync-switch-slider-description" style="padding: 0;margin-left: 10px;line-height:12px">{{i "AISSearch2.thisVesselOnly"}}</span>'+ 
        '<label class="sync-switch switch only_this" style="margin-left:5px"><input type="checkbox">'+
        '<div class="sync-switch-slider switch-slider round"></div></label>' +
        '</td></tr>' +

        '<tr><td><style>' + 
        '#ui-datepicker-div .ui-datepicker-next {height: 1.8em !important;}' +
        '#ui-datepicker-div .ui-datepicker-next span.ui-icon.ui-icon-circle-triangle-e {background: url(img/arrows.png) no-repeat 0 -18px !important;}' +
        '#ui-datepicker-div .ui-datepicker-next.ui-state-hover span.ui-icon.ui-icon-circle-triangle-e {background: url(img/arrows.png) no-repeat 0 -38px !important;}' +
        '</style><div class="calendar"></div></td>' +

        '<td style="padding-left:5px;padding-right:25px;vertical-align:top;"><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}">' +
        '<div class="progress">' + this.gifLoader + '</div>' +
        '<div class="reload"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#2f3c47" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></div>' +
        '</div></td></tr>' +
        '</table>' +

        '<div class="ais_history">' +
        '<table class="ais_positions_date"><tr><td>NO HISTORY FOUND</td></tr></table>' +
        '</div>' +
        '<table class="start_screen"><tr><td>' +
        '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">' +
        '<div>{{{i "AISSearh2.searchresults_view"}}}' +
        '</div></td></tr></table>' +

        //'<div class="suggestions"><div class="suggestion">SOME VESSEL<br><span>mmsi:0, imo:0</span></div></div>' +
        '</div>'
    )());

    Object.defineProperty(this, "topOffset", {
        get: function () {
            let th = $('.ais_tabs')[0].getBoundingClientRect().height,
            ih = this.frame.find('.instruments')[0].getBoundingClientRect().height,
            rv = th + ih;
            this.frame.find('.instruments').height(ih);
            return rv;
        }
    });  

    this.container = this.frame.find('.ais_history');
    this.startScreen = this.frame.find('.start_screen');
    this.tableTemplate = '{{#if msg}}<div class="message">{{msg}}</div>{{/if}}' +

    '<table class="ais_positions_date header"><tr>' +
    '<td></td>' +
    '<td><span class="date"></span></td>' +
    '<td><div class="track all"><input type="checkbox" title="{{i "AISSearch2.allDailyTracks"}}"></div></td>' +
    '<td><div class="count">{{total}}</div></td></tr></table>' +

        '{{#each vessels}}' +
        '<table class="ais_positions_date" border=0><tr>' +
        '<td><div class="open_positions ui-helper-noselect icon-right-open" title="{{i "AISSearch2.voyageInfo"}}"></div></td>' +
        '<td><span class="date">{{{ts_pos_utc}}}</span></td>' +
        '<td><div class="track" date="{{{ts_pos_utc}}}"><input type="checkbox" title="{{i "AISSearch2.dailyTrack"}}"></div></td>' +
        '<td><div class="count">{{count}}</div></td></tr></table>' +
        '<div id="voyage_info{{n}}"></div>' +
        '{{/each}}';

    let calendar = this.frame.find('.calendar');

    // walkaround with focus at first input in ui-dialog
    calendar.append('<span class="ui-helper-hidden-accessible"><input type="text"/></span>')
    let mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
        dateInterval = new nsGmx.DateInterval();
    dateInterval
        .set('dateBegin', mapDateInterval.get('dateBegin'))
        .set('dateEnd', mapDateInterval.get('dateEnd'))
        .on('change', function (e) {
//console.log(this.model.historyInterval) 
//console.log('CHANGE ' + dateInterval.get('dateBegin').toUTCString() + ' ' + dateInterval.get('dateEnd').toUTCString()) 
            let d = new Date(e.attributes.dateEnd.getTime() - msd*(28+1));
            this.calendar._dateInputs.datepicker('option', 'minDate', d);

            this.model.historyInterval = { dateBegin: dateInterval.get('dateBegin'), dateEnd: dateInterval.get('dateEnd') };
            this.model.isDirty = true;
            this.show();
        }.bind(this));
    _tools.historyInterval = dateInterval;
    const msd = 24*3600000;
    this.calendar = new nsGmx.CalendarWidget({
        dateInterval: dateInterval,
        name: 'searchInterval',
        container: calendar,
        //dateMin: new Date(0, 0, 0),        
        dateMin: new Date(nsGmx.DateInterval.getUTCDayBoundary().dateBegin.getTime() - msd*28),
        dateMax: new Date(3015, 1, 1),
        dateFormat: 'dd.mm.yy',
        minimized: false,
        showSwitcher: false,
        dateBegin: new Date(),
        dateEnd: new Date(2000, 10, 10),
        //buttonImage: 'img/calendar.png'
    })

    let td = calendar.find('tr:nth-of-type(1) td');
    td.eq(1).after('<td style="font-weight:bold">&nbsp;&nbsp;&ndash;&nbsp;&nbsp;</td>');
    td.eq(td.length - 1).after('<td>&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="'+_gtxt('AISSearch2.calendar_today')+'" src="plugins/AIS/AISSearch/svg/calendar.svg"></td>');
    calendar.find('.default_date').on('click', () => {
        let db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
        this.calendar.getDateInterval().set('dateBegin', db.dateBegin);
        this.calendar.getDateInterval().set('dateEnd', db.dateEnd);
        nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
    })

    //sidebarControl && sidebarControl.on('closing', ()=>calendar.reset())
    this.frame.on('click', ((e) => {
        if (e.target.classList.toString().search(/CalendarWidget/) < 0) {
            this.calendar.reset()
        }
        //suggestions.hide();
    }).bind(this));

    this.frame.find('.time .only_this  input[type="checkbox"]').click((e=>{
        _displayedOnly.length = 0;
        if (e.currentTarget.checked && this.frame.find('.ais_positions_date:not(.header)')[0] ) {
            _displayedOnly.push(this.model.data.vessels[0].positions[0].mmsi.toString());         
            _tools.showVesselsOnMap(_displayedOnly);
        }
        else{            
            _tools.showVesselsOnMap("all");  
        }
    }).bind(this));

    _tools.onLegendSwitched((()=>{
        _switchLegendIcon.call(this, _tools.needAltLegend);
    }).bind(this));

    this.frame.find('.time .utc,.local').click((e => {
        let trg = $(e.currentTarget);
        if (!trg.is('.on')) {
            this.frame.find('.time span').removeClass("on");
            trg.addClass('on')
            if (trg.is('.utc')) {
                this.frame.find('.utc_time').show();
                this.frame.find('.local_time').hide();
                this.frame.find('.utc_date').show();
                this.frame.find('.local_date').hide();
            }
            else {
                this.frame.find('.utc_time').hide();
                this.frame.find('.local_time').show();
                this.frame.find('.utc_date').hide();
                this.frame.find('.local_date').show();
            }
        }

    }).bind(this));

    this.frame.find('.refresh .reload').click((e=>{
        if (e.currentTarget.style.display="block"){
            this.model.isDirty = true;
            this.model.update();
        }
    }).bind(this));

    this.searchInput = new SearchControl({tab:this.frame[0], container:this.frame.find('.search_input_container')[0], 
    searcher: {
        searchpromise: function(params){
            var request =  `layer=${_searchLayer}&columns=[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"vessel_type"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]&orderby=vessel_name&${params[0].name}=${params[0].value}`;
            //return Request.fetchRequest('/Plugins/AIS/SearchShip.ashx', request, 'POST');
            return fetch(document.location.protocol + window.serverBase.replace(/^https?:/, '') + 'Plugins/AIS/SearchShip.ashx', {                
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                method: 'POST', 
                mode: 'cors',
                body: encodeURI(request)
            });
        },
        parser: function(response){ 
//console.log(response)               
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
//console.log(v)               
        if (v) {
            if (!this.vessel || this.vessel.mmsi != v.mmsi || !this.frame.find('.ais_positions_date:not(.header)')[0]) {
                this.vessel = v;
                this.show();
            }
        }
        else {
            _clean.call(this);
            _cleanMap.call(this);
        }
    }).bind(this)
});
   
};

DbSearchView.prototype = Object.create(BaseView.prototype);

let _clean = function () {
    this.frame.find('.open_positions').off('click');
    this.frame.find('.ais_positions_date .track input[type="checkbox"]').off('click');
    let scrollCont = this.container.find('.mCSB_container')
    if (scrollCont[0])
        scrollCont.empty();
    else
        this.container.empty();
    //console.log("EMPTY ON SELF.CLEAN "+this)
    this.startScreen.css({ visibility: "hidden" });
    nsGmx.leafletMap.removeLayer(_highlight);
    this.showTrack();
},
_cleanMap = function(){  
    if (_displayedOnly.length) 
        this.frame.find('.time .only_this  input[type="checkbox"]').click();
};

DbSearchView.prototype.inProgress = function (state) {
    let progress = this.frame.find('.refresh div.progress'),
    reload = this.frame.find('.refresh div.reload');
    if (state){
        progress.show();
        reload.hide();
    }
    else{
        progress.hide();
        reload.show();
    }
};

let _vi_template = '<table class="ais_positions">' +
    '{{#each positions}}' +
    '<tr>' +
    '<td  title="{{i "AISSearch2.info"}}"><img class="show_info" id="show_info{{@index}}" src="plugins/AIS/AISSearch/svg/info.svg"></td>' +
    '<td><span class="utc_time">{{tm_pos_utc}}</span><span class="local_time">{{tm_pos_loc}}</span></td>' +
    '<td><span class="utc_date">{{dt_pos_utc}}</span><span class="local_date">{{dt_pos_loc}}</span></td>' +
    '<td><img src="{{icon}}" class="legend_icon rotateimg{{icon_rot}}"><img src="{{iconAlt}}" class="legend_iconalt rotateimg{{icon_rot}}"></td>' +
    '<td><img src="{{source}}"></td>' +
    '<td>{{longitude}}&nbsp;&nbsp;{{latitude}}</td>' +
    '<td><div class="show_pos" id="show_pos{{@index}}" title="{{i "AISSearch2.position"}}"><img src="plugins/AIS/AISSearch/svg/center.svg"></div></td>' +
    '</tr>' +
    '<tr><td colspan="7" class="more"><hr><div class="vi_more">' +

    '<div class="c1">COG | SOG:</div><div class="c2">&nbsp;{{cog}} {{#if cog_sog}}&nbsp;{{/if}} {{sog}}</div>' +
    '<div class="c1">HDG | ROT:</div><div class="c2">&nbsp;{{heading}} {{#if heading_rot}}&nbsp;{{/if}} {{rot}}</div>' +
    '<div class="c1">{{i "AISSearch2.draught"}}:</div><div class="c2">&nbsp;{{draught}}</div>' +
    '<div class="c1">{{i "AISSearch2.destination"}}:</div><div class="c2">&nbsp;{{destination}}</div>' +
    '<div class="c1">{{i "AISSearch2.nav_status"}}:</div><div class="c2">&nbsp;{{nav_status}}</div>' +
    '<div class="c1">ETA:</div><div class="c2">&nbsp;<span class="utc_time">{{eta_utc}}</span><span class="local_time">{{eta_loc}}</span></div>' +

    '</div></td></tr>' +
    '{{/each}}' +
    '</table>';

let _prepare_history = function(){   
//console.log(_tools.displayedTrack)     
    if (this.model.data.vessels.length>0 && _tools.displayedTrack && 
        _tools.displayedTrack.mmsi==this.model.data.vessels[0].positions[0].mmsi){
        let checkTrack, modelDate, trackDate, checkAllTracks = this.frame.find('.ais_positions_date.header .track input')[0];
        checkAllTracks.checked = true;          
        this.frame.find('.ais_positions_date:not(.header)').each((i, el) => {
            if (_tools.displayedTrack.dates) {
                modelDate = new Date(this.model.data.vessels[i].positions[0].ts_pos_org * 1000).setUTCHours(0, 0, 0, 0); 
                checkTrack = false;
                for (let j = 0; j < _tools.displayedTrack.dates.list.length; ++j) {
                    trackDate = _tools.displayedTrack.dates.list[j];
                    if (modelDate === trackDate.getTime()) {
                        checkTrack = $(el).find('.track:not(.all) input')[0];
                        checkTrack.checked = true;
                        break;
                    }
                }
                if (!checkTrack)
                    checkAllTracks.checked = false; 
            }
            else
                $(el).find('.track input:not(.all)')[0].checked = true;
        });
    }
//console.log(this.model.data.vessels)
    if (this.model.data.msg)
    this.frame.find('.ais_positions_date.header').hide();
}

DbSearchView.prototype.repaint = function () {
    _clean.call(this);
    BaseView.prototype.repaint.apply(this, arguments); 

    _prepare_history.call(this);

//console.log("REPAINT") 
    _tools.clearMyFleetMarkers();
    _displayedOnly.length = 0; 
    if (this.frame.find('.time .only_this  input[type="checkbox"]')[0].checked) {
        _displayedOnly.push(this.model.data.vessels[0].positions[0].mmsi.toString());         
        _tools.showVesselsOnMap(_displayedOnly);
    }     
    else {  
        _tools.showVesselsOnMap("all"); 
    }  

    let openPos = this.frame.find('.open_positions'),    
        infoDialog = this.infoDialogView,
        thisVessel = this.vessel,
        showInfoDialog = function(position){
            position.vessel_name = thisVessel.vessel_name;
            position.latitude = position.ymax;
            position.longitude = position.xmax;
            position.source = position.source_orig;
            infoDialog.show(position, false);
        };
    openPos.each((ind, elm) => {
        $(elm).click(((e) => {
            let icon = $(e.target),
                vi_cont = this.frame.find('#voyage_info' + ind);
            if (icon.is('.icon-down-open')) {
                icon.removeClass('icon-down-open').addClass('.icon-right-open');
                vi_cont.find('.ais_positions td[class!="more"]').off('click')
                vi_cont.empty();
            }
            else {
                icon.addClass('icon-down-open').removeClass('.icon-right-open');
                vi_cont.html(Handlebars.compile(_vi_template)(this.model.data.vessels[ind]));
                if (this.frame.find('.time .local').is('.on')) {
                    vi_cont.find('.utc_time').hide();
                    vi_cont.find('.local_time').show();
                    vi_cont.find('.utc_date').hide();
                    vi_cont.find('.local_date').show();
                }
                //switchLegendIcons();
                _switchLegendIcon.call(this, _tools.needAltLegend);
                vi_cont.find('.ais_positions td[class!="more"]').click((e) => {
                    let td = $(e.currentTarget);
                    if (td.is('.active')) {
                        td.removeClass('active')
                        td.siblings().removeClass('active')
                        td.parent().next().find('td').removeClass('active')
                    }
                    else {
                        td.addClass('active')
                        td.siblings().addClass('active')
                        td.parent().next().find('td').addClass('active')
                    }
                });
                vi_cont.find('.ais_positions .show_info').click(((e) => {
                    let i = e.currentTarget.id.replace(/show_info/, ""),
                        position = this.model.data.vessels[ind].positions[i];
                    position.vessel_name = thisVessel.vessel_name;
                    position.latitude = position.ymax;
                    position.longitude = position.xmax;
                    position.source = position.source_orig;
                    infoDialog.show(position, false);
                    e.stopPropagation();
                }).bind(this));
                vi_cont.find('.ais_positions .show_pos').click(((e) => {
                    //showPosition
                    let i = e.currentTarget.id.replace(/show_pos/, ""),
                        position = this.model.data.vessels[ind].positions[parseInt(i)];
                    this.positionMap(position, this.calendar.getDateInterval());

                    this.frame.find('.track:not(.all) input')[ind].checked = true; 
                    allTracksInput[0].checked = (this.frame.find('.track:not(.all) input:checked').length==this.model.data.vessels.length);  

                    let v = this.model.data.vessels[ind];
                    this.showTrack([{
                        mmsi: v.positions[0].mmsi, imo: v.positions[0].imo, ts: v.positions[0].ts_pos_org,
                        positions: v.positions
                    }], showInfoDialog);

                    e.stopPropagation();
                }).bind(this));
            }
        }).bind(this));
    });

    const allTracksInput = this.frame.find('.ais_positions_date .track.all input[type="checkbox"]'),
          tracksInputs = this.frame.find('.ais_positions_date .track:not(.all) input[type="checkbox"]'),
          setMapCalendar = function(calendar){
              let calendarInterval = calendar.getDateInterval(),
                  interval = { dateBegin: calendarInterval.get("dateBegin"), dateEnd: calendarInterval.get("dateEnd") };
              nsGmx.widgets.commonCalendar.setDateInterval(interval.dateBegin, interval.dateEnd);              
          };
    allTracksInput.click(((e) => {        
        setMapCalendar(this.calendar);
        this.frame.find('.ais_positions_date .track:not(.all) input').each((i, el) => {
            el.checked = e.target.checked;
        });

        let vessels = this.model.data.vessels.map(v => { return { 
            mmsi: v.positions[0].mmsi, imo: v.positions[0].imo, ts: v.positions[0].ts_pos_org,
            positions: e.target.checked ? v.positions : [] } 
        });
        this.showTrack(vessels, showInfoDialog);
    }).bind(this));
    tracksInputs.each(((i, el)=>{
        let v = this.model.data.vessels[i];
        el.addEventListener('click', ((e)=>{ 
            setMapCalendar(this.calendar);
            allTracksInput[0].checked = (this.frame.find('.ais_positions_date .track:not(.all) input:checked').length==this.model.data.vessels.length);
            
            this.showTrack([{
                mmsi: v.positions[0].mmsi, imo: v.positions[0].imo, ts: v.positions[0].ts_pos_org,
                positions: e.target.checked ? v.positions : []
            }], showInfoDialog);

        }).bind(this));
    }).bind(this));

    if (this.model.data.vessels.length == 1)
        openPos.eq(0).click();
        
    //if (this.withTrack){
        tracksInputs.eq(0).click();
    //    this.withTrack = false;
    //}

    if (this.vessel.lastPosition){
        this.positionMap(this.vessel, this.calendar.getDateInterval());
        this.vessel.lastPosition = false;
    }   
    
    const intervalEnd = this.model.data.vessels.length;
    if (intervalEnd){
        const lastDate = new Date(this.model.data.vessels[intervalEnd-1].positions[0].ts_pos_org*1000),
              di = this.calendar.getDateInterval(),
              calendarlastDate = di.get('dateBegin');
        lastDate.setUTCHours(0,0,0,0); 
//console.log(this.model.historyInterval)   
        if (calendarlastDate.getTime()<lastDate.getTime()){
            di.set('dateBegin', lastDate);
            this.model.historyInterval.dateBegin = lastDate;
//console.log(lastDate, calendarlastDate)  
//console.log(this.model.historyInterval) 
        }       
    }
};

Object.defineProperty(DbSearchView.prototype, "vessel", {
    get() {
        return this.model.vessel;
    },
    set(v) {
        this.searchInput.searchString = v.vessel_name;        
        let positionDate = nsGmx.DateInterval.getUTCDayBoundary(new Date(v.ts_pos_org * 1000));
        this.model.vessel = null;
        let checkInterval = this.calendar.getDateInterval();
// console.log(positionDate.dateBegin + '<' + checkInterval.get('dateBegin'))
// console.log(checkInterval.get('dateEnd') + '<' + positionDate.dateEnd)
        if (positionDate.dateBegin < checkInterval.get('dateBegin') || checkInterval.get('dateEnd') < positionDate.dateEnd){
            this.calendar.getDateInterval().set('dateBegin', positionDate.dateBegin);
            this.calendar.getDateInterval().set('dateEnd', positionDate.dateEnd);      
            this.model.historyInterval = { dateBegin: positionDate.dateBegin, dateEnd: positionDate.dateEnd };
        }
        else
            this.model.historyInterval = { dateBegin: checkInterval.get('dateBegin'), dateEnd: checkInterval.get('dateEnd') };
        this.model.vessel = v;
        this.model.isDirty = true;
    }
});

DbSearchView.prototype.show = function () {
    this.frame.show();
    this.searchInput.focus();
    BaseView.prototype.show.apply(this, arguments); 
    if (!this.vessel)
        return;
        
    if (!_tools.displayedTrack)
        this.frame.find('.ais_positions_date .track input[type="checkbox"]').each((i,e)=>{e.checked = false;});

    if (_displayedOnly.length)        
        _tools.showVesselsOnMap(_displayedOnly); 
    else
        _tools.showVesselsOnMap("all");
};

DbSearchView.prototype.hide = function () { 
    BaseView.prototype.hide.apply(this, arguments); 
    _tools.showVesselsOnMap("all");
};

DbSearchView.prototype.showTrack = function (vessels, onclick) {

    _tools.showTrack(vessels, onclick);   

    if (!vessels || !Array.isArray(vessels))
        return;

    vessels.forEach(vessel => {
        let dlg = $('.ui-dialog:contains("' + vessel.mmsi + '")');
        $('.showtrack').attr('title', _gtxt('AISSearch2.show_track'))
            .removeClass('ais active');
        if (dlg[0])
            dlg.find('.showtrack').attr('title', _gtxt('AISSearch2.hide_track'))
                .addClass('ais active');
    });
};

DbSearchView.prototype.positionMap = function (vessel, interval) {
//console.log("positionMap")
    if (interval)       
        nsGmx.widgets.commonCalendar.setDateInterval(interval.get("dateBegin"), interval.get("dateEnd"));

    if (!vessel.xmax && !vessel.longitude && !vessel.ymax && !vessel.latitude){
        vessel.longitude = this.model.data.vessels[0].positions[0].xmax;
        vessel.latitude = this.model.data.vessels[0].positions[0].ymax;
//console.log(vessel);
//console.log(this.model.data.vessels[0].positions[0]);
    }
        
    let xmin = vessel.xmin ? vessel.xmin : vessel.longitude,
        xmax = vessel.xmax ? vessel.xmax : vessel.longitude,
        ymin = vessel.ymin ? vessel.ymin : vessel.latitude,
        ymax = vessel.ymax ? vessel.ymax : vessel.latitude,
        zoom = nsGmx.leafletMap.getZoom();

    nsGmx.leafletMap.setView([ymax, xmax<0?(360+xmax):xmax], (zoom < 9 ? 12 : zoom));
    nsGmx.leafletMap.removeLayer(_highlight);
    _highlight.vessel = vessel;
    _highlight.setLatLng([ymax, xmax<0?(360+xmax):xmax]).addTo(nsGmx.leafletMap);
};

DbSearchView.prototype.formatDate = function (d, local){
    return _tools.formatDate(d, local);
};

DbSearchView.prototype.formatPosition = function (obj, searcher){
    return _tools.formatPosition(obj, searcher);
};

module.exports = DbSearchView;