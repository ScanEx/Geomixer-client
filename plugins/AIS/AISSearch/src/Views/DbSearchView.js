require("./DbSearch.css")
const BaseView = require('./BaseView.js');

let _searchString = "",
    _setSearchInputValue = function (s) {
        let searchBut = this.frame.find('.filter .search'),
            removeBut = this.frame.find('.filter .remove'),
            _searchString = s;
            
        this.searchInput.val(_searchString);
        if (s != "") {
            removeBut.show();
            searchBut.hide();
        }
        else
            removeBut.click();
    },
    _highlight,
    _tools,
    _displayedOnly = null;

const DbSearchView = function ({ model, highlight, tools }) {
    BaseView.call(this, model);
    _highlight = highlight;
    _tools = tools;
    this.topOffset = 240;
    this.frame = $(Handlebars.compile('<div class="ais_view search_view">' +
        '<table border=0 class="instruments">' +
        '<tr><td colspan="2"><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/>' +
        '<div><img class="search clicable" src="plugins/AIS/AISSearch/svg/search.svg">' +
        '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg">' +
        '</div></div>' +

        '</td></tr>' +
        '<tr><td class="time" colspan="2"><span class="label">{{i "AISSearch2.time_switch"}}:</span>' +
        '<span class="utc on unselectable" unselectable="on">UTC</span><span class="local unselectable" unselectable="on">{{i "AISSearch2.time_local"}}</span>'+
        '<span class="sync-switch-slider-description" style="padding: 0;margin-left: 10px;line-height:12px">{{i "AISSearch2.thisVesselOnly"}}</span>'+ 
        '<label class="sync-switch switch only_this" style="margin-left:5px"><input type="checkbox">'+
        '<div class="sync-switch-slider switch-slider round"></div></label>' +
        '</td>' +

        '<tr><td><div class="calendar"></div></td>' +
        '<td style="padding-left:5px;padding-right:25px;vertical-align:top;"><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}">' +
        '<div class="progress">' + this.gifLoader + '</div>' +
        '<div class="reload"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#2f3c47" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></div>' +
        '</div></td></tr>' +
        '</table>' +

        '<table class="start_screen"><tr><td>' +
        '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">' +
        '<div>{{{i "AISSearh2.searchresults_view"}}}' +
        '</div></td></tr></table>' +

        '<div class="ais_history">' +
        '<table class="ais_positions_date"><tr><td>NO HISTORY FOUND</td></tr></table>' +
        '</div>' +
        '<div class="suggestions"><div class="suggestion">SOME VESSEL<br><span>mmsi:0, imo:0</span></div></div>' +
        '</div>'
    )());
    this.container = this.frame.find('.ais_history');
    this.startScreen = this.frame.find('.start_screen');
    this.tableTemplate = '{{#if msg}}<div class="message">{{msg}}</div>{{/if}}' +
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
            this.model.historyInterval = { dateBegin: dateInterval.get('dateBegin'), dateEnd: dateInterval.get('dateEnd') };
            this.model.isDirty = true;
            this.show();
        }.bind(this));

    this.calendar = new nsGmx.CalendarWidget({
        dateInterval: dateInterval,
        name: 'searchInterval',
        container: calendar,
        dateMin: new Date(0, 0, 0),
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
        suggestions.hide();
    }).bind(this));

    this.frame.find('.time .only_this  input[type="checkbox"]').click((e=>{
        _displayedOnly = null;
//console.log(this.model.data.vessels[0].positions[0].mmsi.toString())
        if (e.currentTarget.checked && this.frame.find('.show_info')[0] ) {
            _displayedOnly = [this.model.data.vessels[0].positions[0].mmsi.toString()];
            _tools.showOtherMarkers([this.model.data.vessels[0].positions[0].mmsi.toString()])
        }
        else
            _tools.showOtherMarkers();
        _tools.hideVesselMarkers([], _displayedOnly);  
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

    this.searchInput = this.frame.find('.filter input');

    let searchBut = this.frame.find('.filter .search'),
        removeBut = this.frame.find('.filter .remove'),
        delay,
        suggestions = this.frame.find('.suggestions'),
        suggestionsCount = 5,
        suggestionsFrame = { first: 0, current: 0, last: suggestionsCount - 1 },
        found = { values: [] },
        searchDone = function () {
            if (found.values.length > 0) {
                _searchString = found.values[suggestionsFrame.current].vessel_name;
                this.searchInput.val(_searchString);
                let v = found.values[suggestionsFrame.current];
                if (!this.vessel || this.vessel.mmsi != v.mmsi || !this.frame.find('.ais_positions_date')[0]) {
                    this.vessel = v;
                    this.show();
                }
            }
            else {
                _clean.call(this);
                _cleanMap();
            }
        },
        doSearch = function (actualId) {
            //console.log(_searchString)
            new Promise(function (resolve, reject) {
                this.model.searcher.searchString(_searchString, true, function (response) {
                    if (response.Status.toLowerCase() == "ok") {
                        found = {
                            values: response.Result.values.map(function (v) {
                                return { vessel_name: v[0], mmsi: v[1], imo: v[2], ts_pos_utc: v[3], ts_pos_org: v[3], vessel_type: v[4] }
                            })
                        };
                        resolve();
                    }
                    else {
                        reject(response);
                    }
                })
            }.bind(this))
                .then(function () { 
                    
                    if (actualId!=delay)
                        return;

                    // SUCCEEDED
                    if (found.values.length == 0) {
                        suggestions.hide();
                        return;
                    }

//console.log("ss: "+_searchString)
                    if (_searchString=="") {
                        suggestions.hide();
                        return;
                    }

                    let scrollCont = suggestions.find('.mCSB_container'),
                        content = $(Handlebars.compile(
                            '{{#each values}}<div class="suggestion" id="{{@index}}">{{vessel_name}}<br><span>mmsi:{{mmsi}}, imo:{{imo}}</span></div>{{/each}}'
                        )(found));
                    if (!scrollCont[0])
                        suggestions.html(content).mCustomScrollbar();
                    else
                        $(scrollCont).html(content);

                    let suggestion = suggestions.find('.suggestion');
                    if (!suggestions.is(':visible')) {
                        let cr = this.frame.find('.filter')[0].getBoundingClientRect();
                        suggestions.show();
                        suggestions.offset({ left: cr.left, top: cr.bottom - 3 });
                        suggestions.outerWidth(cr.width)
                    }

                    suggestions.innerHeight(suggestion[0].getBoundingClientRect().height *
                        (found.values.length > suggestionsCount ? suggestionsCount : found.values.length));
                    suggestionsFrame = { first: 0, current: 0, last: suggestionsCount - 1 };
                    suggestion.eq(suggestionsFrame.current).addClass('selected');
                    suggestion.click(e => {
                        suggestionsFrame.current = e.currentTarget.id;
                        searchDone.call(this);
                    });
                    //console.log("doFilter2 "+_searchString)
                }.bind(this),
                function (response) { // FAILED
                    console.log(response);
                });
        };
    removeBut.click(function (e) {
        this.searchInput.val('');
        this.searchInput.focus();
        clearTimeout(delay)
        removeBut.hide();
        searchBut.show();
        suggestions.hide();
        _clean.call(this);
        _cleanMap();
        //nsGmx.leafletMap.removeLayer(highlight);
    }.bind(this));
    this.searchInput.keydown(function (e) {
        let suggestion = suggestions.find('.suggestion.selected');
        if (suggestions.is(':visible')) {
            if (e.keyCode == 38) {
                if (suggestionsFrame.current > 0) {
                    suggestionsFrame.current--;
                    suggestion.removeClass('selected').prev().addClass('selected');
                }
            }
            else if (e.keyCode == 40) {
                if (suggestionsFrame.current < found.values.length - 1) {
                    suggestionsFrame.current++;
                    suggestion.removeClass('selected').next().addClass('selected');
                }
            }
            if (suggestionsFrame.last < suggestionsFrame.current) {
                suggestionsFrame.last = suggestionsFrame.current;
                suggestionsFrame.first = suggestionsFrame.last - (suggestionsCount - 1);
            }
            if (suggestionsFrame.first > suggestionsFrame.current) {
                suggestionsFrame.first = suggestionsFrame.current;
                suggestionsFrame.last = suggestionsFrame.first + (suggestionsCount - 1);
            }
            suggestions.mCustomScrollbar("scrollTo", "#" + suggestionsFrame.first, { scrollInertia: 0 });
        }
    });

    let prepareSearchInput = function (temp, keyCode) {
        removeBut.show();
        searchBut.hide();
        if (_searchString == temp && (!keyCode || keyCode != 13))
            return false;
        _searchString = temp;
        clearTimeout(delay);
        if (_searchString == "") {
            removeBut.click();
            return false;
        }
        return true;
    }
    this.searchInput.keyup(function (e) {
        let temp = (this.searchInput.val() || "")
            .replace(/^\s+/, "").replace(/\s+$/, "");
        if (!prepareSearchInput(temp, e.keyCode))
            return;
        if (e.keyCode == 13) {
            suggestions.hide();
            searchDone.call(this);
        }
        else
            delay = setTimeout((() => {
                doSearch.apply(this, [delay])
            }).bind(this), 200);
        //nsGmx.leafletMap.removeLayer(highlight);
    }.bind(this));
    this.searchInput.on("paste", function (e) {
        let temp = ((e.originalEvent || window.clipboardData).clipboardData.getData('text') || "")
            .replace(/^\s+/, "").replace(/\s+$/, "");
        if (!prepareSearchInput(temp))
            return;
        delay = setTimeout((() => {
            doSearch.apply(this, [delay])
        }).bind(this), 200);
    }.bind(this));
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
},
_cleanMap = function(){
    _displayedOnly = null;
    _tools.showOtherMarkers(_displayedOnly);  
    _tools.hideVesselMarkers([], _displayedOnly);
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
    '<td><img src="{{icon}}" class="rotateimg{{icon_rot}}"></td>' +
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
        this.frame.find('.ais_positions_date').each((i, el) => {
            if (_tools.displayedTrack.dates) {
                let modelDate = new Date(this.model.data.vessels[i].positions[0].ts_pos_org * 1000).setUTCHours(0, 0, 0, 0)
                for (let j = 0; j < _tools.displayedTrack.dates.list.length; ++j) {
                    let trackDate = _tools.displayedTrack.dates.list[j];
                    if (modelDate === trackDate.getTime()) {
                        $(el).find('.track input')[0].checked = true;
                        break;
                    }
                }
            }
            else
                $(el).find('.track input')[0].checked = true;
        });
    }
}

DbSearchView.prototype.repaint = function () {
    _clean.call(this);
    BaseView.prototype.repaint.apply(this, arguments); 

    _prepare_history.call(this);

//console.log("REPAINT")
    if (this.frame.find('.time .only_this  input[type="checkbox"]')[0].checked) {
        _displayedOnly = [this.model.data.vessels[0].positions[0].mmsi.toString()];
        _tools.showOtherMarkers(_displayedOnly); 
        _tools.hideVesselMarkers([], _displayedOnly);  
    }

    let open_pos = this.frame.find('.open_positions');
    open_pos.each((ind, elm) => {
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
                let infoDialog = this.infoDialogView,
                    vessel = this.vessel;
                vi_cont.find('.ais_positions .show_info').click(((e) => {
                    let i = e.currentTarget.id.replace(/show_info/, ""),
                        position = this.model.data.vessels[ind].positions[i];
                    position.vessel_name = vessel.vessel_name;
                    position.imo = vessel.imo;
                    position.latitude = position.ymax;
                    position.longitude = position.xmax;
                    position.source = position.source_orig;
                    //console.log(vessel)
                    //console.log(position)
                    infoDialog.show(position, false);
                    e.stopPropagation();
                }).bind(this));
                vi_cont.find('.ais_positions .show_pos').click(((e) => {
                    //showPosition
                    let i = e.currentTarget.id.replace(/show_pos/, ""),
                        vessel = this.model.data.vessels[ind].positions[parseInt(i)];
                    this.positionMap(vessel, this.calendar.getDateInterval());
                    this.frame.find('.track input')[ind].checked = true;                    
                    let dates = getDates.call(this);
                    this.showTrack({mmsi:this.model.data.vessels[0].positions[0].mmsi}, dates, [], _displayedOnly);
                    e.stopPropagation();
                }).bind(this));
            }
        }).bind(this))
    })

    let getDates = function(){
        let dates = [];
        this.frame.find('.ais_positions_date .track').each((i, el)=>{            
            if ($('input', el)[0].checked)
                dates.push(
                    new Date(new Date(1000*this.model.data.vessels[i].positions[0].ts_pos_utc).setUTCHours(0,0,0,0))
                );
        })
        return dates;
    };

    this.frame.find('.ais_positions_date .track input[type="checkbox"]').click(((e)=>{
        let calendarInterval = this.calendar.getDateInterval(),
        interval = {dateBegin:calendarInterval.get("dateBegin"), dateEnd:calendarInterval.get("dateEnd")};
        nsGmx.widgets.commonCalendar.setDateInterval(interval.dateBegin, interval.dateEnd);
        let dates = getDates.call(this);
        this.showTrack({mmsi:this.model.data.vessels[0].positions[0].mmsi}, dates, [], _displayedOnly);
    }).bind(this));

    if (this.model.data.vessels.length == 1)
        open_pos.eq(0).click();

    if (this.vessel.lastPosition)
        this.positionMap(this.vessel, this.calendar.getDateInterval());
};


Object.defineProperty(DbSearchView.prototype, "vessel", {
    get() {
        return this.model.vessel;
    },
    set(v) {
        _setSearchInputValue.call(this, v.vessel_name);
        _searchString = v.vessel_name;
        
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

    _tools.showOtherMarkers(_displayedOnly);  
    _tools.hideVesselMarkers([], _displayedOnly); 

    if (!this.vessel)
        return;
    BaseView.prototype.show.apply(this, arguments);
};

DbSearchView.prototype.hide = function () {
    _tools.showOtherMarkers(); // throwaway filter  
    BaseView.prototype.hide.apply(this, arguments);
};

DbSearchView.prototype.showTrack = function (vessel, dates) {
    let dlg = $('.ui-dialog:contains("' + vessel.mmsi + '")');
    $('.showtrack').attr('title', _gtxt('AISSearch2.show_track'))
        .removeClass('ais active');
    if (dlg[0]) 
        dlg.find('.showtrack').attr('title', _gtxt('AISSearch2.hide_track'))
        .addClass('ais active')
    _tools.showTrack([vessel.mmsi], dates, [], _displayedOnly);
};

DbSearchView.prototype.positionMap = function (vessel, interval) {
    if (interval) {    
        // interval = {dateBegin:interval.get("dateBegin"), dateEnd:interval.get("dateEnd")};
        // nsGmx.widgets.commonCalendar.setDateInterval(interval.dateBegin, interval.dateEnd);        
        nsGmx.widgets.commonCalendar.setDateInterval(interval.get("dateBegin"), interval.get("dateEnd"));
    }
    let xmin = vessel.xmin ? vessel.xmin : vessel.longitude,
        xmax = vessel.xmax ? vessel.xmax : vessel.longitude,
        ymin = vessel.ymin ? vessel.ymin : vessel.latitude,
        ymax = vessel.ymax ? vessel.ymax : vessel.latitude,
        zoom = nsGmx.leafletMap.getZoom();
    // nsGmx.leafletMap.fitBounds([
    //     [ymin, xmin],
    //     [ymax, xmax]
    // ], {
    //         maxZoom: (zoom < 9 ? 12 : zoom)
    //     });
    nsGmx.leafletMap.setView([ymax, xmax<0?(360+xmax):xmax], (zoom < 9 ? 12 : zoom));
    nsGmx.leafletMap.removeLayer(_highlight);
    _highlight.vessel = vessel;
    _highlight.setLatLng([ymax, xmax<0?(360+xmax):xmax]).addTo(nsGmx.leafletMap);
};

module.exports = DbSearchView;