require("./DbSearch.css");
require("../Controls/SearchControl.css");
const BaseView = require('./BaseView.js'),
SearchControl = require('../Controls/SearchControl');

let _searchLayer,
    _highlight,
    _tools,
    _displayedOnly = [],
    _displayed = [],
    _viewState = {
        get displayedOnly(){return _displayedOnly;},
        get displayed(){
            return _displayed;
        },
        showTracks: function(trackBuilder, needAlt){
            trackBuilder.showHistoryTracks(this.displayed, needAlt);
        },
        hideTracks: function(trackBuilder, needAlt){
            //trackBuilder.hideHistoryTracks(_notDisplayed, needAlt);
        },
        cleanTracks: function(trackBuilder){
            _displayed = trackBuilder.cleanHistoryTracks();
        }
    };
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
const DbSearchView = function (model, options, tools, viewCalendar) {
    BaseView.call(this, model, tools);
    _searchLayer = options.aisLastPoint;
    _highlight = options.highlight;
    _tools = tools;
    _viewState.view = this;
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

        '<td style="vertical-align:top;"><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}">' +
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

        this.calendar = viewCalendar;
        this.frame.find('.calendar').append(this.calendar.el);
        this.calendar.onChange = function (e) {
            const changes = {
                dateBegin: e.interval.begin, 
                dateEnd: e.interval.end
            };
            this.model.historyInterval = changes;
            this.model.isDirty = true;

//console.log('dbsearch.historyInterval', this.model.historyInterval) 
  
            nsGmx.leafletMap.removeLayer(_highlight);                   
            if (this.isActive){  
                nsGmx.widgets.commonCalendar.setDateInterval(changes.dateBegin, changes.dateEnd);
                this.show();  
            }  

        }.bind(this);

    this.frame.find('.time .only_this  input[type="checkbox"]').click((e=>{
        _displayedOnly.length = 0;
        if (e.currentTarget.checked && this.frame.find('.ais_positions_date:not(.header)')[0] ) {
            _displayedOnly.push(this.model.data.vessels[0].positions[0].mmsi.toString()); 
        }        
        _tools.showVesselsOnMap(_viewState);
 
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
        searchPromise: function(params){
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
            if (_displayedOnly.length) 
                this.frame.find('.time .only_this  input[type="checkbox"]').click();
            this.vessel = null;
        }
    }).bind(this)
});
   
};

DbSearchView.prototype = Object.create(BaseView.prototype);

const _clean = function () {
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

DbSearchView.prototype.repaint = function () {
    _clean.call(this);
    BaseView.prototype.repaint.call(this); 

    if (this.model.data.msg)
        this.frame.find('.ais_positions_date.header').hide();

// console.log("REPAINT") 
    _tools.clearMyFleetMarkers();
    _displayedOnly.length = 0; 
    if (this.frame.find('.time .only_this  input[type="checkbox"]')[0].checked) {
        _displayedOnly.push(this.model.data.vessels[0].positions[0].mmsi.toString());  
    }         
    _tools.showVesselsOnMap(_viewState);

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
                    this.positionMap(position, this.calendar.interval);

                    this.frame.find('.track:not(.all) input')[ind].checked = true; 
                    allTracksInput[0].checked = (this.frame.find('.track:not(.all) input:checked').length==this.model.data.vessels.length);  

                    let v = this.model.data.vessels[ind], nv = this.model.data.vessels[ind+1];
                    this.showTrack([{
                        mmsi: v.positions[0].mmsi, imo: v.positions[0].imo, ts: v.positions[0].ts_pos_org,
                        positions: v.positions,
                        end: nv && nv.positions ? nv.positions[0] : null
                    }], ({p})=>showInfoDialog(p));

                    e.stopPropagation();
                }).bind(this));
            }
        }).bind(this));
    });

    const allTracksInput = this.frame.find('.ais_positions_date .track.all input[type="checkbox"]'),
          tracksInputs = this.frame.find('.ais_positions_date .track:not(.all) input[type="checkbox"]');

    allTracksInput.click(((e) => {        
        //setMapCalendar(this.calendar);
        this.frame.find('.ais_positions_date .track:not(.all) input').each((i, el) => {
            el.checked = e.target.checked;
        });

        let vessels = [], dv = this.model.data.vessels;
        dv.forEach((v, i) => { 
            let nv = dv[i+1];
            vessels.push({ 
                mmsi: v.positions[0].mmsi, imo: v.positions[0].imo, ts: v.positions[0].ts_pos_org, lastPos: v.lastPos,
                positions: e.target.checked ? v.positions : [],
                end: nv && nv.positions ? nv.positions[0] : null
            });
        });
        this.showTrack(vessels, ({p})=>showInfoDialog(p));
    }).bind(this));
    tracksInputs.each(((i, el)=>{
        let vessels = this.model.data.vessels, v = vessels[i], nv = vessels[i+1];
        el.addEventListener('click', ((e)=>{ 

            allTracksInput[0].checked = (this.frame.find('.ais_positions_date .track:not(.all) input:checked').length==vessels.length);
            
            this.showTrack([{
                mmsi: v.positions[0].mmsi, imo: v.positions[0].imo, ts: v.positions[0].ts_pos_org, lastPos: v.lastPos,
                positions: e.target.checked ? v.positions : [],
                end: nv && nv.positions ? nv.positions[0] : null
            }], ({p})=>showInfoDialog(p));

        }).bind(this));
    }).bind(this));

    if (this.model.data.vessels.length == 1)
        openPos.eq(0).click();

    tracksInputs.eq(0).click();

    if (this.vessel.lastPosition){
        this.positionMap(this.vessel, this.calendar.interval);
        this.vessel.lastPosition = false;
    }   
    
//     const intervalEnd = this.model.data.vessels.length;
//     if (intervalEnd){
//         const lastDate = new Date(this.model.data.vessels[intervalEnd-1].positions[0].ts_pos_org*1000);
//         lastDate.setUTCHours(0,0,0,0); 
// //console.log(this.model.historyInterval)   
//         if (this.calendar.dateBegin.getTime()<lastDate.getTime()){
//             this.calendar.dateBegin = lastDate;
// //console.log(lastDate, calendarlastDate)  
// //console.log(this.model.historyInterval) 
//         }       
//     }
};

Object.defineProperty(DbSearchView.prototype, "vessel", {
    get() {
        return this.model.vessel;
    },
    set(v) {
        this.model.vessel = v;
        if (!v)
            return;
            
        this.searchInput.searchString = v.vessel_name;        
        let positionDate = nsGmx.DateInterval.getUTCDayBoundary(new Date((v.ts_pos_org||v.ts_pos_utc) * 1000)),
            checkInterval = this.calendar.interval;
        if (positionDate.dateBegin < checkInterval.begin || checkInterval.end < positionDate.dateEnd){
            this.calendar.interval = { begin: positionDate.dateBegin, end: positionDate.dateEnd };   
        }
        else
            this.model.historyInterval = { dateBegin: checkInterval.begin, dateEnd: checkInterval.end };
        this.model.isDirty = true;
    }
});

DbSearchView.prototype.show = function () {
    BaseView.prototype.show.call(this); 
    this.searchInput.focus();       
    _tools.showVesselsOnMap(_viewState); 
};

DbSearchView.prototype.hide = function () { 
    if (!this.isActive)
        return;

    BaseView.prototype.hide.call(this); 
    _tools.cleanMap(_viewState);
};

DbSearchView.prototype.showTrack = function (vessels, onclick) {

    _displayed = _tools.showHistoryTrack(vessels, onclick); 

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
        nsGmx.widgets.commonCalendar.setDateInterval(interval.begin, interval.end);

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

    nsGmx.leafletMap.setView([ymax, xmax < -90 ? (360 + xmax) : xmax], (zoom < 9 ? 12 : zoom));
    nsGmx.leafletMap.removeLayer(_highlight);
    _highlight.vessel = vessel;
    _highlight.setLatLng([ymax, xmax < -90 ? (360 + xmax) : xmax]).addTo(nsGmx.leafletMap);
};

DbSearchView.prototype.formatDate = function (d, local){
    return _tools.formatDate(d, local);
};

DbSearchView.prototype.formatPosition = function (obj, searcher){
    return _tools.formatPosition(obj, searcher);
};

module.exports = DbSearchView;