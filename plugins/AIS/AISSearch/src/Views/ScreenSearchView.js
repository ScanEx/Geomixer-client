const BaseView = require('./BaseView.js');
const ScreenSearchView = function (model) {
    BaseView.apply(this, arguments);
    this.topOffset = 180;
    this.frame = $(Handlebars.compile('<div class="ais_view search_view">' +

        '<table border=0 class="instruments">' +
        //'<tr><td colspan="2"><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/><i class="icon-flclose clicable"></div></td></tr>'+
        '<tr><td><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filterName"}}"/>' +
        '<div><img class="search clicable" src="plugins/AIS/AISSearch/svg/search.svg">' +
        '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg">' +
        '</div></div>' +
        '<div>&nbsp;</div>'+
        '</td></tr>' + 
        '</table>' +

        '<table class="results">'+
        '<tr><td class="count"></td>' +
        '<td><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div>' + this.gifLoader + '</div></div></td></tr>' +
        '</table>'+
        // '<table class="start_screen"><tr><td>'+
        // '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">'+
        // '<div>Здесь будут отображаться<br>результаты поиска</div></td></tr></table>'+
        '<div class="ais_vessels">'+
        '<div class="ais_vessel">' +
        '<table border=0><tr><td><div class="position">NO VESSELS</div><div>mmsi: 0 imo: 0</div></td>' +
        '<td><i class="icon-ship" vessel="" title=""></i></td>' +
        '<td><span class="date"></span></td>'+
        '<td><div class="info" vessel="aisjson this" title="i AISSearch2.info">' +
        '<img src="plugins/AIS/AISSearch/svg/info.svg">' +
        '</div></td></tr></table>' +
        '</div>' +       
        '</div>' +
        
        '</div>'
    )());
    this.container = this.frame.find('.ais_vessels');
    //this.startScreen = this.frame.find('.start_screen');
    this.tableTemplate = '{{#each vessels}}' +
        '<div class="ais_vessel">' +
        '<table border=0><tr><td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' +       
        '<td><img src="{{icon}}" class="rotateimg{{icon_rot}}"></td>' +
        
        //'<td><i class="icon-ship" vessel="{{aisinfoid this}}" style="{{mf_member}}" title="{{i "AISSearch2.myFleetMember"}}"></i></td>' +
        '<td><span vessel="{{aisinfoid this}}" style="{{mf_member}}" title="{{i "AISSearch2.myFleetMember"}}">'+        
        '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px" height="14px" viewBox="0 0 14 14" xml:space="preserve">' +
        '<g style="fill: #48aff1;">' +
        '<path class="st0" d="M13.4,11H0.6c-0.2,0-0.4,0.1-0.5,0.3c-0.1,0.2-0.1,0.4,0,0.6l1.2,1.8C1.4,13.9,1.6,14,1.8,14h9.9   c0.2,0,0.3-0.1,0.4-0.2l1.7-1.8c0.2-0.2,0.2-0.4,0.1-0.7C13.9,11.1,13.7,11,13.4,11z"/>' +
        '<path class="st0" d="M9.3,9.7h2.9c0.2,0,0.4-0.1,0.5-0.3c0.1-0.2,0.1-0.4,0-0.6L9.8,4.5C9.7,4.3,9.4,4.2,9.2,4.3   C8.9,4.4,8.7,4.6,8.7,4.9v4.3C8.7,9.5,9,9.7,9.3,9.7z"/>' +
        '<path class="st0" d="M1.2,9.7H7c0.3,0,0.6-0.3,0.6-0.6V0.6c0-0.3-0.2-0.5-0.4-0.6C6.9-0.1,6.7,0,6.5,0.3L0.7,8.8   C0.6,9,0.5,9.2,0.6,9.4C0.7,9.6,0.9,9.7,1.2,9.7z"/>' +
        '</g>' +
        '</svg></span></td>'+
        
        '<td><span class="date">{{ts_pos_utc}}</span></td>'+
        '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">' +
        '<img src="plugins/AIS/AISSearch/svg/info.svg">' +
        '</div></td></tr></table>' +
        '</div>' +
        '{{/each}}' +
        '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';

    let cleanFilter = this.frame.find('.remove'),
        filterReady = this.frame.find('.search'),
        filterInput = this.frame.find('input'),
        delay,
        doFilter = function(){
            this.model.setFilter();             
            this.repaint();
//console.log("doFilter")
        };
        cleanFilter.click(function(e){
            if (this.model.filterString === '')
                return;
            filterInput.val('');
            this.model.filterString = '';  
            clearTimeout(delay)
            doFilter.call(this);
            //nsGmx.leafletMap.removeLayer(highlight);
        }.bind(this))
        filterInput.keyup(function(e){            
            let input = filterInput.val() || "";
            input = input.replace(/^\s+/, "").replace(/\s+$/, "");
            if (input===""){
                filterReady.show();
                cleanFilter.hide();
            }
            else{
                cleanFilter.show();
                filterReady.hide();
            }

            if (input==this.model.filterString && e.keyCode!=13)
                return;
            this.model.filterString = input; 
            if (e.keyCode==13)
                this.model.filterString += '\r' ;  
            clearTimeout(delay)
            delay = setTimeout((() => { doFilter.call(this) }).bind(this), 500);
            //nsGmx.leafletMap.removeLayer(highlight);
        }.bind(this))
    
    let needUpdate = function(){
        this.model.isDirty = true;
        if (this.container.is(':visible')) {
 
            clearTimeout(delay)
            delay = setTimeout((() => { this.model.update() }).bind(this), 300);  
        }
    };
    nsGmx.leafletMap.on('moveend', needUpdate.bind(this));
    nsGmx.widgets.commonCalendar.getDateInterval().on('change', needUpdate.bind(this));
};

ScreenSearchView.prototype = Object.create(BaseView.prototype);

let _clean = function () {
    this.frame.find('.count').text(_gtxt('AISSearch2.found') + 0); 
};

ScreenSearchView.prototype.inProgress = function (state) {
    let progress = this.frame.find('.refresh div');
    if (state)
        progress.show();
    else
        progress.hide();
};

let
_firstRowsPos = 0,
_firstRowsNum = 40,
_firstRowsShift = 20,
_setEventHandlers = function(){
    let thisInst = this;
    this.container.find('.info', ).off('click').on('click', function (e) {
        let target = $(this),
            vessel = JSON.parse(target.attr('vessel'))
//console.log(vessel)
        thisInst.infoDialogView && thisInst.infoDialogView.show(vessel, (v) => {
//console.log(v)
            vessel.xmin = vessel.xmax = v.longitude
            vessel.ymin = vessel.ymax = v.latitude
            if (vessel.hasOwnProperty('ts_pos_utc')) {
                 vessel.ts_pos_utc = v.ts_pos_utc;
                 vessel.ts_pos_org = v.ts_pos_org;
                 v.dt_pos_utc && $(this).closest('tr').find('.date').html(v.dt_pos_utc);
            }
            target.attr('vessel', JSON.stringify(vessel))
        });
        e.stopPropagation();
    });
    this.container.find('.ais_vessel').off('click').on('click', function () {
//console.log(JSON.parse($(this).find('.info').attr('vessel')))
        let v = JSON.parse($(this).find('.info').attr('vessel'));                
        v.lastPosition = true;
        thisInst.infoDialogView.showPosition(v);
    }); 
//console.log("repaint "+(new Date()-start)+"ms" )      
}

ScreenSearchView.prototype.repaint = function () {
    _clean.call(this);
    this.frame.find('.count').text(_gtxt('AISSearch2.found')+this.model.data.vessels.length);   
    //BaseView.prototype.repaint.apply(this, arguments);
    ////////////////////////////////////////////////////
    let start = new Date();

    //_clean.call(this);
    this.container.find('.info').off('click');
    this.container.find('.ais_vessel', ).off('click');   
    let scrollCont = this.container.find('.mCSB_container')
    if (scrollCont[0])
        scrollCont.empty();
    else
        this.container.empty();
    if (!this.model.data)
        return;
    let thisInst = this,
        tempFirst = this.model.data.vessels.slice(0, _firstRowsNum),
        content = $(Handlebars.compile(this.tableTemplate)({msg:this.model.data.msg, vessels:tempFirst})),
        mcsTopPctPrev = 0,
        rowH;
    _firstRowsPos = _firstRowsNum;

    if (!scrollCont[0]) {
        this.container.mCustomScrollbar("destroy").append(content).mCustomScrollbar({
            //scrollInertia: 0,//this.model.data.vessels.length > _firstRowsNum ? 0 : 600,
            callbacks:{
                onBeforeUpdate: function(){console.log("onBeforeUpdate")},
                onUpdate: function(){console.log("onUpdate")},
                //onScroll:function(){
                whileScrolling: /*scrollingHandler*/function(){                    
//console.log("% " + this.mcs.topPct + " pos" + _firstRowsPos)
                    if (this.mcs.topPct==100 && mcsTopPctPrev != 100 && thisInst.model.data.vessels.length > _firstRowsPos){
                        let start = _firstRowsPos - _firstRowsNum + _firstRowsShift,
                            end = _firstRowsPos + _firstRowsShift;
                        if (thisInst.model.data.vessels.length-start <= thisInst.container.height()/rowH)
                            start = thisInst.model.data.vessels.length - _firstRowsNum;
///console.log(">"+start+", "+end)
                        tempFirst = thisInst.model.data.vessels.slice(start, end),
                        _firstRowsPos += _firstRowsShift;                       
                        let scrollCont = thisInst.container.find('.mCSB_container');
                        scrollCont.html(Handlebars.compile(thisInst.tableTemplate)({vessels:tempFirst}));  
//console.log("h="+rowH) 
                        setTimeout(()=>{
                            thisInst.container.mCustomScrollbar("scrollTo",
                                -rowH * _firstRowsShift + thisInst.container.height(), {
                                    scrollInertia: 0,
                                    callbacks: false
                                });
                            _setEventHandlers.call(thisInst);
                        }, 200);
                    }
                    if (this.mcs.topPct == 0 && mcsTopPctPrev != 0 && _firstRowsPos > _firstRowsNum) {
//console.log(_firstRowsPos)
                        let start = _firstRowsPos - _firstRowsShift - _firstRowsNum,
                            end = _firstRowsPos - _firstRowsShift;
//console.log("<"+start + ", " + end)
                        tempFirst = thisInst.model.data.vessels.slice(start, end),
                        _firstRowsPos -= _firstRowsShift;                       
                        let scrollCont = thisInst.container.find('.mCSB_container');
                        scrollCont.html(Handlebars.compile(thisInst.tableTemplate)({ vessels: tempFirst })); 
//console.log("h="+rowH)
                        setTimeout(() => {
                            thisInst.container.mCustomScrollbar("scrollTo",
                                rowH * _firstRowsShift, {
                                    scrollInertia: 0,
                                    callbacks: false
                                })
                            _setEventHandlers.call(thisInst);
                        }, 200);
                    }
                    mcsTopPctPrev = this.mcs.topPct;
                }
            }
        });
        scrollCont = this.container.find('.mCSB_container');
        rowH = scrollCont.height()/$('.ais_vessel', scrollCont).length;
    }
    else {
        scrollCont.append(content);
        this.container.mCustomScrollbar("scrollTo", "top", {scrollInertia:0, callbacks:false, timeout:200});
    }
    _setEventHandlers.call(this);
/*
    this.container.find('.info', ).on('click', function (e) {
        let target = $(this),
            vessel = JSON.parse(target.attr('vessel'))
//console.log(vessel)
        thisInst.infoDialogView && thisInst.infoDialogView.show(vessel, (v) => {
//console.log(v)
            vessel.xmin = vessel.xmax = v.longitude
            vessel.ymin = vessel.ymax = v.latitude
            if (vessel.hasOwnProperty('ts_pos_utc')) {
                 vessel.ts_pos_utc = v.ts_pos_utc;
                 vessel.ts_pos_org = v.ts_pos_org;
                 v.dt_pos_utc && $(this).closest('tr').find('.date').html(v.dt_pos_utc);
            }
            target.attr('vessel', JSON.stringify(vessel))
        });
        e.stopPropagation();
    });
    this.container.find('.ais_vessel').on('click', function () {
//console.log(JSON.parse($(this).find('.info').attr('vessel')))
        let v = JSON.parse($(this).find('.info').attr('vessel'));                
        v.lastPosition = true;
        thisInst.infoDialogView.showPosition(v);
    }); 
//console.log("repaint "+(new Date()-start)+"ms" )  
*/
    ////////////////////////////////////////////////////
};

ScreenSearchView.prototype.show = function () {
    BaseView.prototype.show.apply(this, arguments);
    this.frame.find('.filter input').focus();
};

/*
ScreenSearchView.prototype.hide = function () {
//console.log('hide ScreenSearchView')
    BaseView.prototype.hide.apply(this, arguments);
};
*/
module.exports = ScreenSearchView;