const Polyfill = require('../Polyfill');
module.exports = function (searcher) {
    let _actualUpdate,
        _data = JSON.parse(localStorage.getItem("lloyds_collection"));
    if (!_data)
        _data = { vessels: [] }; 
        // {
        //     vessels: [
        //         { vessel_name: 'ACACIA', mmsi: 371044000, imo: 9476599 },
        //         { vessel_name: 'AKADEMIK FERSMAN', mmsi: 273455310, imo: 8313958 },
        //         { vessel_name: 'BALTIMORE BRIDGE', mmsi: 371111000, imo: 9463281 }
        //     ]};
    return {
        searcher: searcher,
        isDirty: true,
        get data() { return _data },
        set data(value) { _data = value; },
        save: function(){
            localStorage.setItem("lloyds_collection", JSON.stringify(_data));
        },
        update: function () {
                this.view.repaint();
        }
    };
}