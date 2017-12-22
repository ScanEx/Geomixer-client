//************************************
// MY FLEET VIEW
//************************************
module.exports = function({aisView, myFleetMembersModel}){
	const instance = $.extend({
		get model(){ return this._model },
        _tableTemplate: '{{#each vessels}}' +
        '<div class="ais_vessel">' +
        '<table border=0><tr><td><span class="position">{{vessel_name}}</span> <span class="date">({{{ts_pos_utc}}})</span></td>'+
        '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">'+
        //'<i class="clicable icon-info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}"></i>'+
        '</div></td></tr></table>' +
        '</div>' +
        '{{/each}}'+
        '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}',
        _model: myFleetMembersModel
    }, aisView);
	myFleetMembersModel.view = instance
	return instance
}