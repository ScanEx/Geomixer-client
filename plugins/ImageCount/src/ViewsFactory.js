const View = require('./Views/ImageCountView'),
      Model = require('./Models/ImageCountModel');
module.exports = function (options) {   
    const _m = new Model(),
          _v = new View(options.layers, _m); 
    return {
        create: function () {
            return [_v];
        }
    };
}