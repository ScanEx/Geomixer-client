module.exports = function (options) {
    const {id, dateInterval, daysLimit: _daysLimit, mapDateInterval} = options, 
          _msd = 24 * 3600 * 1000,
          _utcLimits = function(dt){
              dt  = dt || (new Date());
                return {
                    begin: new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate())), 
                    end: new Date(Date.UTC(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1))
                }
          };

    const _calendar = $(`<div class="${id}"><table border=0>    
    <tr>   
    <td></td>
    <td class="dateBegin"><span class="ui-helper-hidden-accessible"><input type="text"/></span>
    <input type="text" class="gmx-input-text CalendarWidget-dateBegin">
    </td>
    <td>&nbsp;&nbsp;&ndash;&nbsp;&nbsp;</td>
    <td class="dateEnd"><input type="text" class="gmx-input-text CalendarWidget-dateEnd"></td>
    <td></td>
    <td>&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="${_gtxt('AISSearch2.calendar_today')}" src="plugins/AIS/AISSearch/svg/calendar.svg"></td>
    </tr>    
    </table></div>`);
    
    let _now = new Date(),
        _begin = options.begin ? new Date(options.begin) : _utcLimits(_now).begin,
        _end =  options.end ? new Date(options.end) : _utcLimits(_now).end,
        _current = new Date(_end.getTime() - _msd),
        _onChangeCallbacks = [];

    const _setBegin = function(dt){
              _begin = new Date(dt);
          },
          _setEnd = function(dt){
              _end = new Date(dt);
          },
          _onChangeHandler = function(s, dp){
              const b = _beginCtl.datepicker('getDate'),
                    e = _endCtl.datepicker('getDate');
              let maxd = e;
              if (b>e){
                  if (this.id === _beginCtl[0].id){
                    _setBegin(_utcLimits(b).begin);
                    _setEnd(_utcLimits(b).end);
                    _endCtl.datepicker( "setDate", b);
                    maxd = b;
                  }
                  else{  
                    _setEnd(_utcLimits(e).end);
                    _setBegin(_utcLimits(e).begin);
                    _beginCtl.datepicker( "setDate", e);
                  }
              }
              else{
                _setBegin(_utcLimits(b).begin);
                _setEnd(_utcLimits(e).end);
              }
             
              _beginCtl.datepicker( "option", {minDate: new Date(maxd.getTime() - (_daysLimit - 1) * _msd), maxDate: maxd});
              
              _onChangeCallbacks.forEach(cb=>cb({interval: _thisInstance.interval}));
//console.log(_thisInstance.interval);

          },
          _beginCtl = _calendar.find( ".CalendarWidget-dateBegin" ).datepicker({
              onSelect: _onChangeHandler,
              minDate: '-' + _daysLimit,
              maxDate: _current
            }),
          _endCtl = _calendar.find( ".CalendarWidget-dateEnd" ).datepicker({
              onSelect: _onChangeHandler,
              maxDate: _current
            });

    _beginCtl.datepicker( "setDate", _begin);
    _endCtl.datepicker( "setDate", _current);

    // walkaround with focus at first input in ui-dialog
    //_calendar.append('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');
  
    _calendar.find('.default_date').on('click', function() {
        const limits = _utcLimits();
        _thisInstance.interval = { begin: limits.begin, end: limits.end };
    });

    const _thisInstance =  {
        el: _calendar[0],
        set onChange(cb) { 
            _onChangeCallbacks.push(cb); 
        },

        set begin(dt){
            _setBegin(dt); _beginCtl.datepicker( "setDate", dt); 
            //_onChangeCallbacks.forEach(cb=>cb({interval: this.interval}));
        },
        get begin(){ return new Date(_begin); },

        set end(dt){
            const dpEnd = new Date(dt.getTime() - _msd);
            _beginCtl.datepicker( "option", {minDate: new Date(end.getTime() - (_daysLimit - 1) * _msd), maxDate: dpEnd});

            _setEnd(dt); _endCtl.datepicker( "setDate", dpEnd ); 
            //_onChangeCallbacks.forEach(cb=>cb({interval: this.interval}));
        },
        get end(){ return new Date(_end); },

        set interval(di){     

            const pickerEnd = new Date(di.end.getTime() - _msd);
            _beginCtl.datepicker( "option", {minDate: new Date(pickerEnd.getTime() - (_daysLimit - 1) * _msd), maxDate: pickerEnd});

            _setBegin(di.begin); _beginCtl.datepicker( "setDate", di.begin);
            _setEnd(di.end);  _endCtl.datepicker( "setDate", pickerEnd);
//console.log(this.interval) 
            _onChangeCallbacks.forEach(cb=>cb({interval: this.interval}));
        },
        get interval(){ return { begin: new Date(_begin), end: new Date(_end)}; }

    }
  
    return _thisInstance;
};