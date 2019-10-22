const MyCollectionView = require('./Views/MyCollectionView'),
      MyCollectionModel = require('./Models/MyCollectionModel');
module.exports = function (options) {   
    const _mcm = new MyCollectionModel(),
          _mcv = new MyCollectionView({model:_mcm}); 
    return {
        create: function () {
            return [_mcv];
        }
    };
}