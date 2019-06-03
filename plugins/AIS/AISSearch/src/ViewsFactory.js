const ScreenSearchView = require('./Views/ScreenSearchView'),
    ScreenSearchModel = require('./Models/ScreenSearchModel'),
    MyFleetView = require('./Views/MyFleetView'),
    MyFleetModel = require('./Models/MyFleetModel'),
    DbSearchView = require('./Views/DbSearchView'),
    DbSearchModel = require('./Models/DbSearchModel'),
    InfoDialogView = require('./Views/InfoDialogView'),
    Searcher = require('./Search/Searcher');

module.exports = function (options) {
    const _tools = options.tools,
        _searcher = new Searcher(options),
        _mfm = new MyFleetModel({aisLayerSearcher:_searcher, toolbox:_tools}),
        _ssm = new ScreenSearchModel({ aisLayerSearcher: _searcher, myFleetModel: _mfm, vesselLegend: options.vesselLegend }),
        _dbsm = new DbSearchModel(_searcher),
        _dbsv = new DbSearchView({model:_dbsm, highlight:options.highlight, tools:_tools}),
        _ssv = new ScreenSearchView(_ssm, _tools),
        _mfv = new MyFleetView(_mfm, _tools),
        _idv = new InfoDialogView({
            tools:_tools,
            aisLayerSearcher: _searcher, 
            modulePath: options.modulePath,
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