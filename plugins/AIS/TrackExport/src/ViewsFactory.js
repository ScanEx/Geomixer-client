const MyCollectionView = require('./Views/TracksView'),
      MyCollectionModel = require('./Models/TracksModel');
module.exports = function (options) {   
    const _mcm = new MyCollectionModel({layer: options.layer}),
          _mcv = new MyCollectionView({model:_mcm, layer: options.layer}); 
    return {
        create: function () {
            return [_mcv];
        }
    };
}