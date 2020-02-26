const MyCollectionView = require('./Views/RouteView'),
      MyCollectionModel = require('./Models/RouteModel');
module.exports = function (options) {   
    const _mcm = new MyCollectionModel({layer: options.layer}),
          _mcv = new MyCollectionView({model:_mcm, layer: options.layer}); 
    return {
        create: function () {
            return [_mcv];
        }
    };
}