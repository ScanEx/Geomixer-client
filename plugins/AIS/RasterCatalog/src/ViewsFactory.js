const RcView = require('./Views/RcView'),
      RcModel = require('./Models/RcModel');

module.exports = function (options) {
    const _m = new RcModel(options);
    return {
        create: function () {
            return [new RcView(_m, 'first')];
        }
    };
}