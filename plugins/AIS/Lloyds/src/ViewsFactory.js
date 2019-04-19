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
}