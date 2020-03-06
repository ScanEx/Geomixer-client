const ScreenSearchView = require('./Views/ScreenSearchView'),
    ScreenSearchModel = require('./Models/ScreenSearchModel'),
    MyFleetView = require('./Views/MyFleetView'),
    MyFleetModel = require('./Models/MyFleetModel'),
    DbSearchView = require('./Views/DbSearchView'),
    DbSearchModel = require('./Models/DbSearchModel'),
    InfoDialogView = require('./Views/InfoDialogView'),
    Searcher = require('./Search/Searcher'),
    ViewCalendar = require('./Controls/Calendar');

module.exports = function (options) {

    const _tools = options.tools,
          _daysLimit = 14,
          _mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
          _dateInterval = new nsGmx.DateInterval();

    _dateInterval
        .set('dateBegin', _mapDateInterval.get('dateBegin'))
        .set('dateEnd', _mapDateInterval.get('dateEnd'))
        .on('change', function (e) { 
            const di = [_dateInterval.get('dateBegin'), _dateInterval.get('dateEnd')];
console.log('CHANGE1 ' + di[0].toUTCString() + ' ' + di[1].toUTCString()) 
// console.log(_viewCalendar1);
            if (_viewCalendar1)  
                if (_viewCalendar1.dateBegin.getTime() != _dateInterval.get("dateBegin").getTime() || 
                _viewCalendar1.dateEnd.getTime() != _dateInterval.get("dateEnd").getTime()){           
                    _viewCalendar1.dateBeginEnd =  _dateInterval;
                }        
//console.log(_viewCalendar2);
            if (_viewCalendar2)
               if (_viewCalendar2.dateBegin.getTime() != _dateInterval.get("dateBegin").getTime() || 
               _viewCalendar2.dateEnd.getTime() != _dateInterval.get("dateEnd").getTime()){  
                    _viewCalendar2.dateBeginEnd =  _dateInterval;
            }

            _viewCalendar1.onChange({ dateBegin: _dateInterval.get('dateBegin'), dateEnd: _dateInterval.get('dateEnd') })
            _viewCalendar2.onChange({ dateBegin: _dateInterval.get('dateBegin'), dateEnd: _dateInterval.get('dateEnd') });

            nsGmx.widgets.commonCalendar.setDateInterval(_dateInterval.get("dateBegin"), _dateInterval.get("dateEnd")); 
        }.bind(this));
    _tools.historyInterval = _dateInterval;
    
    const _viewCalendar1 = new ViewCalendar({dateInterval: _dateInterval, daysLimit: _daysLimit}),
          _viewCalendar2 = new ViewCalendar({dateInterval: _dateInterval, daysLimit: _daysLimit});


    ///////////////////////////////////////////////
    
    const _modulePath = options.modulePath,
        _searcher = new Searcher(options),
        _mfm = new MyFleetModel({aisLayerSearcher:_searcher, toolbox:_tools, modulePath: _modulePath}),
        _ssm = new ScreenSearchModel({ aisLayerSearcher: _searcher, myFleetModel: _mfm, vesselLegend: options.vesselLegend }),
        _dbsm = new DbSearchModel(_searcher),
        _dbsv = new DbSearchView(_dbsm, options, _tools, _viewCalendar1),
        _ssv = new ScreenSearchView(_ssm, _tools),
        _mfv = new MyFleetView(_mfm, _tools, _viewCalendar2),
        _idv = new InfoDialogView({
            tools:_tools,
            aisLayerSearcher: _searcher, 
            modulePath: _modulePath,
            aisView: _dbsv, 
            myFleetView: _mfv,
            menuId: options.menuId
        });
        _ssv.infoDialogView = _idv;
        _mfv.infoDialogView = _idv;
        _dbsv.infoDialogView = _idv;
    return {
        // get tools(){
        //     return _tools;
        // },
        get infoDialogView(){
            return _idv;
        },
        create: function () {
            return [ _mfv, _dbsv, _ssv ];
        }
    };
}