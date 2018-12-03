/*
const ScreenSearchView = require('./Views/ScreenSearchView'),
    ScreenSearchModel = require('./Models/ScreenSearchModel'),
    MyFleetView = require('./Views/MyFleetView'),
    MyFleetModel = require('./Models/MyFleetModel'),
    DbSearchView = require('./Views/DbSearchView'),
    DbSearchModel = require('./Models/DbSearchModel'),
    InfoDialogView = require('./Views/InfoDialogView'),
    Toolbox = require('./Toolbox.js');
*/
const MyCollectionView = require('./Views/MyCollectionView'),
      MyCollectionModel = require('./Models/MyCollectionModel'),
      RegisterDlgView = require('./Views/RegisterDlgView'),
      RegisterModel = require('./Models/RegisterModel'),
      Searcher = require('./Search/Searcher');
module.exports = function (options) {   
    const _searcher = new Searcher(options),
          _rm = new RegisterModel(_searcher),
          _rdv = new RegisterDlgView({model:_rm/*, highlight:options.highlight, tools:_tools*/}),
          _mcm = new MyCollectionModel(_searcher),
          _mcv = new MyCollectionView({model:_mcm/*, highlight:options.highlight, tools:_tools*/, registerDlg: _rdv}); 
    return {
        create: function () {
            return [_mcv];
        }
    }
    /*
    const _tools = new Toolbox(options),
        //_layersByID = nsGmx.gmxMap.layersByID,
        _searcher = new Searcher(options),
        _mfm = new MyFleetModel(_searcher),
        _ssm = new ScreenSearchModel({ aisLayerSearcher: _searcher, myFleetModel: _mfm }),
        _dbsm = new DbSearchModel(_searcher),
        _dbsv = new DbSearchView({model:_dbsm, highlight:options.highlight, tools:_tools}),
        _ssv = new ScreenSearchView(_ssm),
        _mfv = new MyFleetView(_mfm, _tools),
        _idv = new InfoDialogView({
            tools:_tools,
            aisLayerSearcher: _searcher, 
            modulePath: options.modulePath,
            aisView: _dbsv, 
            myFleetMembersView: _mfv
        });
        _ssv.infoDialogView = _idv;
        _mfv.infoDialogView = _idv;
        _dbsv.infoDialogView = _idv;
    return {
        get infoDialogView(){
            return _idv;
        },
        create: function () {
            return [ _dbsv, _ssv, _mfv ];
        }
    };
    */
}