const RouteView = require('./Views/RouteView'),
      RouteModel = require('./Models/RouteModel');
module.exports = function (options) {   
    const _mcm = new RouteModel({layer: options.layer}),
          _mcv = new RouteView({model:_mcm, layer: options.layer}); 
    return {
        create: function () {
            return [_mcv];
        }
    };
}