const GroupWidget = function (title){
    
}

GroupWidget.prototype.toString = function () {
    return '<div class="mf_group">' +
    '<table class="results gr{{@index}}"><tr>'+
    '<td><input type="checkbox" checked><div class="upout clicable ui-helper-noselect icon-down-open" style="float: right;"></div></td>' +
    '<td><span class="title">{{title}}</span></td>' +
    '<td class="count">{{vessels.length}}</td>' +    
    '<td>' +
    '{{#unless default}}' +
    '<img class="delete clicable" title="{{i "AISSearch2.DeleteGroup"}}" src="plugins/AIS/AISSearch/svg/delete.svg">' +
    '</td>' +
    '{{/unless}}' +
    '</tr></table>'+
    '{{#each vessels}}' +
    //'{{#unless foovessel}}' +
    '<div class="ais_vessel">' +
    '<table border=0><tr>' +
    '<td><input type="checkbox" checked></td>' +
    '<td><div class="position">{{vessel_name}}</div><div>mmsi: <span class="mmsi">{{mmsi}}</span> imo: <span class="imo">{{imo}}</span></div></td>' +
    '<td><img src="{{icon}}" class="course rotateimg{{icon_rot}} legend_icon"><img src="{{iconAlt}}" class="course rotateimg{{icon_rot}} legend_iconalt">' +
    '<div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">' +
    '<img src="plugins/AIS/AISSearch/svg/info.svg"></div>' +
    '</td>' +
    '<td>' +
    '<div class="ais_info_dialog_close-button exclude" title="{{i "AISSearch2.vesselExclude"}}"></div>' +
    '<span class="date">{{dt_pos_utc}}</span></td>' +
    '</tr></table>' +
    '</div>' +
    //'{{/unless}}' +
    '{{/each}}</div>';
}

module.exports = GroupWidget;