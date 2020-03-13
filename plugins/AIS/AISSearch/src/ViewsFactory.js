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
          _mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval();

    const _viewCalendar1 = new ViewCalendar({id:'vc1', begin: _mapDateInterval.get('dateBegin'), end: _mapDateInterval.get('dateEnd'), daysLimit: _daysLimit}),
          _viewCalendar2 = new ViewCalendar({id:'vc2', begin: _mapDateInterval.get('dateBegin'), end: _mapDateInterval.get('dateEnd'), daysLimit: _daysLimit});

    _viewCalendar1.onChange = function(e){
        _viewCalendar2.interval = e.interval;
    }

    _viewCalendar2.onChange = function(e){        
        _viewCalendar1.interval = e.interval;
    }    
    ///////////////////////////////////////////////
    
    const _modulePath = options.modulePath,
        _searcher = new Searcher(options),
        _mfm = new MyFleetModel({aisLayerSearcher:_searcher, toolbox:_tools, modulePath: _modulePath}),
        _ssm = new ScreenSearchModel({ aisLayerSearcher: _searcher, myFleetModel: _mfm, vesselLegend: options.vesselLegend }),
        _dbsm = new DbSearchModel(_searcher),
        _dbsv = new DbSearchView(_dbsm, options, _tools, _viewCalendar2),
        _ssv = new ScreenSearchView(_ssm, _tools),
        _mfv = new MyFleetView(_mfm, _tools, _viewCalendar1),
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