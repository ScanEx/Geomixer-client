module.exports = function (options) {
    const {dateInterval, daysLimit: _daysLimit} = options, 
          _msd = 24 * 3600 * 1000;
 
    const _dateInterval1 = new nsGmx.DateInterval(),
          _dateInterval2 = new nsGmx.DateInterval();
          
            //_viewCalendar1._dateInputs.datepicker('option', 'minDate', d);
            //_viewCalendar1.onChange({ dateBegin: _dateInterval.get('dateBegin'), dateEnd: _dateInterval.get('dateEnd') });
            //_viewCalendar2._dateInputs.datepicker('option', 'minDate', d);    

 
        _dateInterval1
        .set('dateBegin', dateInterval.get('dateBegin'))
        .set('dateEnd', dateInterval.get('dateEnd'))
        .on('change', function (e) { 
            const st = {dateBegin:_dateInterval1.get('dateBegin'), dateEnd:_dateInterval2.get('dateEnd')}
            dateInterval.loadState(st);
        }.bind(this)); 
        _dateInterval2
        .set('dateBegin', dateInterval.get('dateBegin'))
        .set('dateEnd', dateInterval.get('dateEnd'))
        .on('change', function (e) { 
            const st = {dateBegin:_dateInterval1.get('dateBegin'), dateEnd:_dateInterval2.get('dateEnd')}
            dateInterval.loadState(st);
        }.bind(this));            


    const _calendar = $(`<div><table border=1><tr>
    <td></td>
    <td class="dateBegin"><span class="ui-helper-hidden-accessible"><input type="text"/></span></td>
    <td>&nbsp;&nbsp;&ndash;&nbsp;&nbsp;</td>
    <td class="dateEnd"></td>
    <td></td>
    <td>&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="${_gtxt('AISSearch2.calendar_today')}" src="plugins/AIS/AISSearch/svg/calendar.svg"></td>
    </tr></table></div>`);

    // walkaround with focus at first input in ui-dialog
    //_calendar.append('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');

    const _viewCalendar1 = new nsGmx.CalendarWidget({
                dateInterval: _dateInterval1,
                //name: 'searchInterval',
                container: _calendar.find('.dateBegin'),
                //dateMin: new Date(0, 0, 0),        
                //dateMin: new Date(nsGmx.DateInterval.getUTCDayBoundary().dateBegin.getTime() - _msd*(_daysLimit-1)),
                //dateMax: new Date(3015, 1, 1),
                dateFormat: 'dd.mm.yy',
                minimized: true,
                showSwitcher: false,
                //dateBegin: new Date(),
                //dateEnd: new Date(2000, 10, 10),
                //buttonImage: 'img/calendar.png'
            }),
            _viewCalendar2 = new nsGmx.CalendarWidget({
                dateInterval: _dateInterval2,
                //name: 'searchInterval',
                container: _calendar.find('.dateEnd'),
                //dateMin: new Date(0, 0, 0),        
                //dateMin: new Date(nsGmx.DateInterval.getUTCDayBoundary().dateBegin.getTime() - _msd*(_daysLimit-1)),
                //dateMax: new Date(3015, 1, 1),
                dateFormat: 'dd.mm.yy',
                minimized: true,
                showSwitcher: false,
                //dateBegin: new Date(),
                //dateEnd: new Date(2000, 10, 10),
                //buttonImage: 'img/calendar.png'
            });

            
    //const td = _calendar.find('tr:nth-of-type(1) td');
    //td.eq(td.length - 1).after('<td>&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="'+_gtxt('AISSearch2.calendar_today')+'" src="plugins/AIS/AISSearch/svg/calendar.svg"></td>');
    _calendar.find('.icon-left-open').hide();
    _calendar.find('.icon-right-open').hide();    
    _calendar.find('.default_date').on('click', () => {
        let db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
        dateInterval.loadState({dateBegin: db.dateBegin, dateEnd: db.dateEnd})
        nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
    });

    let _onChangeCallback;
    return {
        _dateInputs: _viewCalendar1._dateInputs,
        el: _calendar.find('table')[0],
        reset: ()=>{_viewCalendar1.reset(); _viewCalendar2.reset();},
        getDateInterval: ()=>dateInterval,

        get onChange(){ 
            return _onChangeCallback;//_viewCalendar.onChange; 
        },
        set onChange(f){
            _onChangeCallback = f;//_viewCalendar.onChange = f; 
        },

        get dateBegin() { return _dateInterval1.get('dateBegin'); },
        // set dateBegin(d) {
        // },
        get dateEnd() { return _dateInterval2.get('dateEnd'); },
        // set dateEnd(d) {
        // },

        set dateBeginEnd(di) {
            if (_dateInterval1.get('dateBegin').getTime()!=di.get('dateBegin').getTime() || 
                _dateInterval2.get('dateEnd').getTime()!=di.get('dateEnd').getTime() ){
                    const db1 = nsGmx.DateInterval.getUTCDayBoundary(di.get('dateBegin')),
                          db2 = nsGmx.DateInterval.getUTCDayBoundary(di.get('dateEnd').setHours(di.get('dateEnd').getHours()-24));
                _dateInterval1.loadState(db1);
                _dateInterval2.loadState(db2);
            }
        },

    }
};