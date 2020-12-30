const BaseView = require('./BaseView.js');
let _tools, _delayedRepaint;
const ScreenSearchView = function (model, tools) {
    BaseView.apply(this, arguments);

    _tools = tools;          
    _tools.onLegendSwitched(((showAlternative)=>{
        if (this.isActive) {    
            this.model.data && this.model.data.vessels && this.repaint();
            if (this.hideAisSwitch[0].checked)
                _tools.hideAisData(true);
        }
        else{
            _delayedRepaint = true;
        }
    }).bind(this));

    this.frame = $(Handlebars.compile('<div class="ais_view screensearch_view">' +

        '<table border=0 class="instruments">' +
        //'<tr><td colspan="2"><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/><i class="icon-flclose clicable"></div></td></tr>'+
        '<tr><td><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filterName"}}"/>' +
        '<div><img class="search clicable" src="plugins/AIS/AISSearch/svg/search.svg">' +
        '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg">' +
        '</div></div>' +
        '</td></tr>' + 

        '<tr><td style="padding-top:0px">' +'<label class="sync-switch switch hide_ais" style="margin-left:5px"><input type="checkbox">'+
        '<div class="sync-switch-slider switch-slider round"></div></label>' + 
        '<span class="sync-switch-slider-description" style="padding: 0;line-height:12px">{{i "AISSearch2.hideAisData"}}</span>'+ 
        '<div>&nbsp;</div>'+
        '</td></tr>' + 

        '</table>' +

        '<table class="results">'+
        '<tr><td class="count"></td>' +
        '<td><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div>' + this.gifLoader + '</div></div></td></tr>' +
        '<tr><td colspan="2" style="padding:0px"><div class="groups"></div></td></tr>' +
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
    Object.defineProperty(this, "topOffset", {
        get: function () {
            let th = $('.ais_tabs')[0].getBoundingClientRect().height,
            ih = this.frame.find('.instruments')[0].getBoundingClientRect().height,
            rh = this.frame.find('.results')[0].getBoundingClientRect().height,
            rv = th + ih + rh;
            this.frame.find('.instruments').height(ih);
            return rv;
        }
    });    
    this.container = this.frame.find('.ais_vessels');
    //this.startScreen = this.frame.find('.start_screen');
    this.tableTemplate = '{{#each vessels}}' +
        '<div class="ais_vessel">' +
        '<table border=0><tr><td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' +       
        '<td><img src="{{icon}}" class="rotateimg{{icon_rot}} legend_icon"><img src="{{iconAlt}}" class="rotateimg{{icon_rot}} legend_iconalt"></td>' +
        
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
        doFilter = function(){
            this.model.setFilter(); 
        };
        cleanFilter.click(function(e){
            if (this.model.filterString === '')
                return;
            filterInput.val('');
            this.model.filterString = '';  
            filterReady.show();
            cleanFilter.hide();
            doFilter.call(this);
            //nsGmx.leafletMap.removeLayer(highlight);
        }.bind(this));
        filterInput.keyup(function(e){            
            let input = filterInput.val() || "";
            input = input.replace(/^\s+/, "").replace(/\s+$/, "");
 
            if (input==this.model.filterString)// && e.keyCode!=13
                return; 

            if (input==''){
                filterReady.show();
                cleanFilter.hide();
                this.model.filterString = input;
                doFilter.call(this);
            }
            else{
                cleanFilter.show();
                filterReady.hide();
            }
            this.model.filterString = input; 
            //if (e.keyCode==13){
            if (e.keyCode!=13){
                doFilter.call(this);
                //nsGmx.leafletMap.removeLayer(highlight);
            }
            //}
        }.bind(this))
    
    let needUpdate = function(){
        this.model.isDirty = true;
        if (this.isActive)
            this.model.update();
    };
    nsGmx.leafletMap.on('moveend', needUpdate.bind(this));
    nsGmx.widgets.commonCalendar.getDateInterval().on('change', needUpdate.bind(this));

    this.hideAisSwitch = this.frame.find('.instruments .hide_ais  input[type="checkbox"]');
    this.hideAisSwitch.click((e=>{
        _tools.hideAisData(e.currentTarget.checked);
    }).bind(this));

    
    this.model.update(); //warm up

};

ScreenSearchView.prototype = Object.create(BaseView.prototype);

const _clean = function () {
    this.frame.find('.count').text(_gtxt('AISSearch2.found') + 0); 
},
_switchLegendIcon = function(showAlternative){
    let ic = this.frame.find('.legend_icon'),
    ica = this.frame.find('.legend_iconalt');
    if (showAlternative){
        ic.hide(); ica.show();
    }
    else{
        ica.hide(); ic.show();
    }
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
    this.frame.find('.show_groups').on('click', function () {
        arrowHead = arrowHead == 'icon-down-open' ? 'icon-right-open': 'icon-down-open';
        this.repaint();
    }.bind(this));     
}

let arrowHead = 'icon-down-open';
ScreenSearchView.prototype.repaint = function () {
    if (!this.isActive){
        _delayedRepaint = true;
        return;
    }

    _delayedRepaint = false;
//let startRep = new Date();
//console.log("REPAINT")
    //_clean.call(this);
    this.frame.find('.count').html('<div class="show_groups clicable ui-helper-noselect ' + arrowHead + '" ' +
    'style="margin-right:5px;display:inline"></div>' + 
    _gtxt('AISSearch2.found') + this.model.data.vessels.length); 
    //BaseView.prototype.repaint.apply(this, arguments);

    this.frame.find('.groups')[0].innerHTML = '';
    const groupsRef = !_tools.needAltLegend ? this.model.data.groups :  this.model.data.groupsAlt;
    groupsRef.forEach(g=>{if(/length/i.test(g.name)) g.name = g.name.replace(/,.+/, '') })
    if (this.model.data.groups && this.model.data.groups.length && arrowHead == 'icon-down-open') //{
        this.frame.find('.groups')[0].innerHTML = (Handlebars.compile('<table>' +
            '{{#each groups}}' +
            '<tr><td><table style="margin:0"><tr><td style="width:22px; height:24px; padding:0"><img src="{{url}}" ></td></tr></table></td><td><div class="group_name">{{name}}</div></td><td>{{count}}</td></tr>' +
            '{{/each}}' +
            '</table>')({groups: groupsRef}));
    //     this.frame.find('.groups img').each((i,img)=>$(img).on('load', ()=>{
    //         if(i==groupsRef.length-1) BaseView.prototype.resize.apply(this, arguments);
    //     } ));  
    // }
    // else{
        BaseView.prototype.resize.apply(this, arguments);   
    //}
     
    ////////////////////////////////////////////////////
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
                onScroll:function(){                    
                    thisInst.scroledPx = this.mcs.top;
                    //console.log("onScroll " + this.mcs.top + " " + thisInst.container.is(':visible'));
                },
                whileScrolling: /*scrollingHandler*/function(){                     
//console.log("whileScrolling " + this.mcs.top + "px " + thisInst.container.is(':visible')+" ss "+thisInst.startShow)                  
//console.log("% " + this.mcs.topPct + " pos" + _firstRowsPos)
                    if (thisInst.startShow && this.mcs.top == 0){
                        return;
                    }
                    else
                    thisInst.startShow = false;
                        
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
                            thisInst.scroledPx = -rowH * _firstRowsShift + thisInst.container.height();
                            thisInst.container.mCustomScrollbar("scrollTo",
                            thisInst.scroledPx, {
                                    scrollInertia: 0,
                                    callbacks: false
                            });
                            _setEventHandlers.call(thisInst);
                        }, 200);
                        _switchLegendIcon.call(thisInst, _tools.needAltLegend);
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
                            thisInst.scroledPx = rowH * _firstRowsShift;
                            thisInst.container.mCustomScrollbar("scrollTo",
                                thisInst.scroledPx, {
                                    scrollInertia: 0,
                                    callbacks: false
                                }
                            );
                            _setEventHandlers.call(thisInst);
                        }, 200);
                        _switchLegendIcon.call(thisInst, _tools.needAltLegend);
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
    _switchLegendIcon.call(this, _tools.needAltLegend);
//console.log((new Date().getTime()-startRep)/1000)
};

ScreenSearchView.prototype.show = function () {
    this.startShow = true;
    BaseView.prototype.show.apply(this, arguments);

    if (_delayedRepaint && !this.model.isDirty)
        this.repaint();

    this.frame.find('.filter input').focus();

    if (this.scroledPx) {
        this.container.mCustomScrollbar("scrollTo",
            this.scroledPx, { scrollInertia: 0, callbacks: false }
        );
    }  
    
    _tools.hideAisData(this.hideAisSwitch[0].checked);
};
ScreenSearchView.prototype.hide = function () {
    if (!this.isActive)
        return;
    _tools.hideAisData(false);
    BaseView.prototype.hide.call(this);
};

module.exports = ScreenSearchView;