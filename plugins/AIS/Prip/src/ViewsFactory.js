const PripView = require('./Views/PripView'),
      PripModel = require('./Models/PripModel');

module.exports = function (options) {
    const _pm1 = new PripModel("http://kosmosnimki.ru/demo/prip/actual.ashx?zone=murm"),
        _pv1 = new PripView(_pm1),
        _pm2 = new PripModel("http://kosmosnimki.ru/demo/prip/actual.ashx?zone=arkh"),
        _pv2 = new PripView(_pm2),
        _pm3 = new PripModel("http://kosmosnimki.ru/demo/prip/actual.ashx?zone=west"),
        _pv3 = new PripView(_pm3),
        _pm4 = new PripModel("http://kosmosnimki.ru/demo/prip/actual.ashx?zone=east"),
        _pv4 = new PripView(_pm4);

    return {
        create: function () {
            return [_pv1, _pv2, _pv3, _pv4];
        }
    };
}