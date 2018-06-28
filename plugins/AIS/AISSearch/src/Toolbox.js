module.exports = function (options) {
    const _layersByID = nsGmx.gmxMap.layersByID,
          _aisLayer = _layersByID[options.aisLayerID],
          _tracksLayer = _layersByID[options.tracksLayerID];
    let _displaingTrack = {mmsi:null};

    return {
        displaingTrack: _displaingTrack,
        showTrack: function (mmsiArr, bbox) {
            var lmap = nsGmx.leafletMap;
            var filterFunc = function (args) {
                var mmsi = args.properties[1],
                    i, len;
                for (i = 0, len = mmsiArr.length; i < len; i++) {
                    if (mmsi === mmsiArr[i]) { return true; }
                }
                return false;
            };
            if (bbox) { lmap.fitBounds(bbox, { maxZoom: 11 }); }
    // console.log(_aisLayer._gmx.layerID)
    // console.log(_tracksLayer._gmx.layerID)
            if (_aisLayer || _tracksLayer)
                _displaingTrack.mmsi = mmsiArr[0];
            else
                _displaingTrack.mmsi = null;
            if (_aisLayer) {
                if (mmsiArr.length) {
                    _aisLayer.setFilter(filterFunc);
                    if (!_aisLayer._map) {
                        lmap.addLayer(_aisLayer);
                    }
                } else {
                    _aisLayer.removeFilter();
                    lmap.removeLayer(_aisLayer);
                }
            }
            if (_tracksLayer) {
                if (mmsiArr.length) {
                    _tracksLayer.setFilter(filterFunc);
                    if (!_tracksLayer._map) {
                        lmap.addLayer(_tracksLayer);
                    }
                } else {
                    _tracksLayer.removeFilter();
                    lmap.removeLayer(_tracksLayer);
                }
            }
        }
    };
}