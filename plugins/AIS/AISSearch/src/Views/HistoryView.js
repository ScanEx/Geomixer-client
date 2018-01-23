//************************************
// HISTORY VIEW
//************************************
require('./HistoryView.css')
	
module.exports = function({aisView, historyModel, gifLoader}){
	let _frame, _container, _refresh, _caption, _calendar,
	_dateInterval = new nsGmx.DateInterval(),
	_template = '<div class="ais_view history_view">'+ 
					//HIST FORM      
					'<div class="calendar"></div>'+             
                    '<table border=0 class="instruments">'+
                    '<tr><td><div class="caption">&nbsp;</div></td><td></td><td><div class="refresh"><div>'+gifLoader+'</div></div></td></tr>'+
                    '</table>'+                    
                    '<div class="ais_vessels"><div class="ais_vessel">NO HISTORY</div></div>'+
	'</div>'
	const instance = $.extend({
		get model(){ return this._model },
		set vessel(value){ 
			_caption.text(value.vessel_name) 
			this._model.vessel = value
            let mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval()
			if (!value.ts_pos_utc){				
				this._model.historyInterval = {dateBegin:mapDateInterval.get('dateBegin'), dateEnd:null}			
				_dateInterval.set('dateBegin', this._model.historyInterval['dateBegin'])				
				this._model.historyInterval.dateEnd = mapDateInterval.get('dateEnd')	
				_dateInterval.set('dateEnd', this._model.historyInterval['dateEnd']) 
			}
			else{
				let a = value.ts_pos_utc.replace(/ [\s\S]+$/g, '').split('.'),
					dateEnd = new Date(new Date().setHours(24,0,0,0))			
				this._model.historyInterval = {dateBegin: new Date(Date.UTC(a[2], parseInt(a[1])-1, a[0], 0, 0, 0, 0)), dateEnd:null}			
				_dateInterval.set('dateBegin', this._model.historyInterval['dateBegin'])				
				this._model.historyInterval.dateEnd = new Date(Date.UTC(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate(), 0, 0, 0, 0))
				_dateInterval.set('dateEnd', this._model.historyInterval['dateEnd'])
			}
			this._model.setDirty()	
		},
		template: _template,
        _tableTemplate: '{{#each vessels}}' +
        '<div class="ais_vessel">' +
        '<table border=0><tr><td><span>({{{ts_pos_utc}}})</span></td><td><span class="show_voyage_info" title="{{i "AISSearch2.voyageInfo"}}">...</span></td></tr></table>'+
        '<div class="voyage_info"><table>'+
		'<tr><td>X | Y:</td><td>{{longitude}} {{#if x_y}}&nbsp;{{/if}} {{latitude}}</td></tr>'+
		'<tr><td>COG | SOG:</td><td>{{cog}} {{#if cog_sog}}&nbsp;{{/if}} {{sog}}</td></tr>'+
		'<tr><td>HDG | ROT:</td><td>{{heading}} {{#if heading_rot}}&nbsp;{{/if}} {{rot}}</td></tr>'+
		'<tr><td>Осадка:</td><td>{{draught}}</td></tr>'+
        '</table></div>' +
        '</div>' +
        '{{/each}}'+
        '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}',
        _model: historyModel,	
		doClean: function(){
			$('.show_voyage_info', _container).off('click')
		},
		
        get _frame(){ return _frame },
        get _container(){ return _container },
        get _refresh(){ return _refresh },
		get _caption(){ return _caption },
		get _calendar(){ return _calendar },
                
		createForm: function(){
			
			_frame = $('.history_view', this.canvas)
			_container = $('.history_view .ais_vessels', this.canvas)
			_refresh = $('.history_view .refresh div', this.canvas)
			_caption = $('.history_view .caption', this.canvas)
			_calendar = $('.history_view .calendar', this.canvas)				
			

	        // walkaround with focus at first input in ui-dialog
            _calendar.append('<span class="ui-helper-hidden-accessible"><input type="text"/></span>')
            let mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval();
            _dateInterval
                    .set('dateBegin', mapDateInterval.get('dateBegin'))
                    .set('dateEnd', mapDateInterval.get('dateEnd'))
                    .on('change', function (e) { 
					if (this._model.historyInterval['dateEnd'])
						if (this._model.historyInterval['dateBegin'].getTime()!=_dateInterval.get('dateBegin').getTime ||
						this._model.historyInterval['dateEnd'].getTime()!=_dateInterval.get('dateEnd').getTime){
//console.log(this._model.historyInterval['dateBegin'].toUTCString() + ' ' + (this._model.historyInterval['dateEnd'] && this._model.historyInterval['dateEnd'].toUTCString())) 
//console.log('CHANGE ' + _dateInterval.get('dateBegin').toUTCString() + ' ' + _dateInterval.get('dateEnd').toUTCString()) 
							this._model.historyInterval['dateBegin']=_dateInterval.get('dateBegin')
							this._model.historyInterval['dateEnd']=_dateInterval.get('dateEnd')
							this._model.setDirty()
							this.show();	
						}
                }.bind(this));
				
                let calendar = new nsGmx.CalendarWidget({
                    dateInterval: _dateInterval,
                    name: 'fobConsumptionInterval',
                    container: _calendar,
                    dateMin: new Date(0, 0, 0),
                    dateMax: new Date(3015, 1, 1),
                    dateFormat: 'dd.mm.yy',
                    minimized: false,
                    showSwitcher: false,
                    dateBegin: new Date(),
                    dateEnd: new Date(2000, 10, 10),
                    //buttonImage: 'img/calendar.png'
                })				
				//sidebarControl && sidebarControl.on('closing', ()=>calendar.reset())
				$(this.canvas).on('click', (e)=>{
					if(e.target.classList.toString().search(/CalendarWidget/)<0){ 
						calendar.reset()
					}
				})

				
		}
    }, aisView);
	historyModel.view = instance
	return instance
}