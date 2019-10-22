const Polyfill = require('../Polyfill');
module.exports = function (searcher) {
    let _actualUpdate,
        _data;
    if (!_data)
        _data = { vessels: [] }; 

    return {
        searcher: searcher,
        isDirty: true,
        get data() { return _data },
        set data(value) { _data = value; },

        update: function () {
            const th = this;
            setTimeout(()=>
                th.view.repaint()
                , 500);
        }
    };
}