//************************************
// AIS SEARCH VIEW
//************************************

module.exports = function({aisView, aisScreenSearchModel, aisDbSearchModel, highlight}){
	var instance = $.extend({
        _tableTemplate: '{{#each vessels}}' +
        '<div class="ais_vessel">' +
        '<table border=0><tr><td><span class="position">{{vessel_name}}</span>'+
        '{{#if ts_pos_utc}} <span class="date">({{{ts_pos_utc}}})</span>{{/if}}'+
        '</td><td><i class="icon-ship" vessel="{{aisinfoid this}}" style="{{mf_member}}" title="{{i "AISSearch2.myFleetMember"}}"></i></td>'+
        '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">'+
        //'<i class="clicable icon-info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}"></i>'+
        '<div></td></tr></table>' +
        '</div>' +
        '{{/each}}'+
        '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}',
        _model: aisScreenSearchModel,
        _repaintControls: function(){
            $(this._count).text(_gtxt('AISSearch2.found')+this._model.getCount());
        },
        _doClean: function(){
            $(this._count).text(_gtxt('AISSearch2.found')+0);
        },
        _bindControlEvents: function(){
                var _this = this;
                $('select', this._canvas).change(function(e){
                    var models = [aisScreenSearchModel, aisDbSearchModel];
                    _this._model = models[e.target.options[e.target.selectedIndex].value]; 
                    //_this._model = models[(e.target.selectedOptions[0].value)];
                    $('input', _this._search).val(_this._model.filterString);
                    _this.show();
					nsGmx.leafletMap.removeLayer(highlight);
                });
                this._refresh.parent().click(function(){
                    //console.log(_this._refresh)
                    _this.show();
					nsGmx.leafletMap.removeLayer(highlight);
                })
                $('i', this._search).click(function(e){
                    _this._model.filterString = $(this).siblings('input').val()+'\r';
                    _this.show();
					nsGmx.leafletMap.removeLayer(highlight);
                })
                this._search.keyup(function(e){
                    var input = $('input', this).val() || "";
                    input = input.replace(/^\s+/, "").replace(/\s+$/, "");
                    if (input==_this._model.filterString && e.keyCode!=13)
                        return;
                    _this._model.filterString = input; 
                    if (e.keyCode==13)
                        _this._model.filterString += '\r' 
                    _this.show();
					nsGmx.leafletMap.removeLayer(highlight);
                })
        },
		setModel: function(searchType){this._model = searchType=='screen' ? aisScreenSearchModel : aisDbSearchModel}
    }, aisView);
	aisDbSearchModel.view = instance;
	aisScreenSearchModel.view = instance;
	return instance;
}
