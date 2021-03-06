const MyCollectionView = require('./Views/HardNavView'),
      MyCollectionModel = require('./Models/HardNavModel');
module.exports = function (options) {   
    const _mcm = new MyCollectionModel({layer: options.layer}),
          _mcv = new MyCollectionView({model:_mcm, layer: options.layer}); 
    return {
        create: function () {
            return [_mcv];
        }
    };
}