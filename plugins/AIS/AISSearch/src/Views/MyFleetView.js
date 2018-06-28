const BaseView = require('./BaseView.js');
const MyFleetView = function (model){
    BaseView.apply(this, arguments);
    this.topOffset = 80;
    this.frame = $(Handlebars.compile('<div class="ais_view myfleet_view">' +
    '<table class="results">'+
    '<tr><td class="count"></td>' +
    '<td><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div>' + this.gifLoader + '</div></div></td></tr>' +
    '</table>'+

    '<div class="ais_vessels">'+
    '<div class="ais_vessel">' +
    '<table border=0><tr><td><div class="position">vessel_name</div><div>mmsi: mmsi imo: imo</div></td>' +
    //'<td><i class="icon-ship" vessel="aisinfoid this" style="visibility:hidden" title="AISSearch2"></i></td>' +
    '<td><span class="date">ts_pos_utc</span></td>'+
    '<td><div class="info" vessel="aisjson this" title="i AISSearch2.info">' +
    '<img src="plugins/AIS/AISSearch/svg/info.svg">' +
    '<div></td></tr></table>' +
    '</div>' +      
    '</div>' +
    '</div>')());
    this.container = this.frame.find('.ais_vessels');    
    this.tableTemplate = '{{#each vessels}}' +
    '<div class="ais_vessel">' +
    '<table border=0><tr><td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' +
    //'<td><i class="icon-ship" vessel="{{aisinfoid this}}" style="visibility:hidden" title="{{i "AISSearch2.myFleetMember"}}"></i></td>' +
    '<td><img src="{{icon}}" class="rotateimg{{icon_rot}}"></td>' +  
    '<td><span class="date">{{dt_pos_utc}}</span></td>'+
    '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">' +
    '<img src="plugins/AIS/AISSearch/svg/info.svg">' +
    '<div></td></tr></table>' +
    '</div>' +
    '{{/each}}' +
    '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
};

MyFleetView.prototype = Object.create(BaseView.prototype);

// let _clean = function(){ 
//     //this.frame.find('.count').text(_gtxt('AISSearch2.found') + 0); 
//     let scrollCont = this.container.find('.mCSB_container')
//     if (scrollCont[0])
//         scrollCont.empty();
//     else
//         this.container.empty();
// };

MyFleetView.prototype.inProgress = function (state) {
    let progress = this.frame.find('.refresh div');
    if (state)
        progress.show();
    else
        progress.hide();
};

/*
MyFleetView.prototype.repaint = function () {
    _clean.call(this);  
    BaseView.prototype.repaint.apply(this, arguments);
};

MyFleetView.prototype.show = function (){ 
//console.log('show MyFleetView')
    BaseView.prototype.show.apply(this, arguments);
};
MyFleetView.prototype.hide = function (){   
//console.log('hide MyFleetView')
    BaseView.prototype.hide.apply(this, arguments);
};
*/
module.exports = MyFleetView;