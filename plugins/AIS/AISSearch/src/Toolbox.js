const Polyfill = require('./Polyfill');
module.exports = function (options) {
    const _layersByID = nsGmx.gmxMap.layersByID;
      let _aisLayer = _layersByID[options.aisLayerID],
          _tracksLayer = _layersByID[options.tracksLayerID],
          _screenSearchLayer = _layersByID[options.screenSearchLayer],
          _lastPointLayerAlt = _layersByID[options.lastPointLayerAlt],
          _tracksLayerAlt = _layersByID[options.tracksLayerAlt],
          _historyLayerAlt = _layersByID[options.historyLayerAlt];

    let _almmsi = _aisLayer.getGmxProperties().attributes.indexOf("mmsi") + 1, 
        _tlmmsi = Polyfill.findIndex(_tracksLayer.getGmxProperties().attributes, function(p){return "mmsi"==p.toLowerCase();}) + 1,
        _aldt = _aisLayer.getGmxProperties().attributes.indexOf("ts_pos_utc") + 1, 
        _tldt = Polyfill.findIndex(_tracksLayer.getGmxProperties().attributes, function(p){return "date"==p.toLowerCase();}) + 1;
//console.log(_almmsi+" "+_aldt)
//console.log(_tlmmsi+" "+_tldt)	

    let _displaingTrack = {mmsi:null},
    _displayingMyFleet = null,
    _filtered = [],
    _filterFunc = function (args) {
        let dates = _displaingTrack.dates ? _displaingTrack.dates.list : null,
        mmsiArr = [];
        mmsiArr.push(_displaingTrack.mmsi);

        let mmsi = args.properties[args.properties.length > 20 ? _almmsi : _tlmmsi],
            dt = new Date(new Date(args.properties[args.properties.length > 20 ? _aldt : _tldt] * 1000).setUTCHours(0, 0, 0, 0)),
            i, j, len;
        for (i = 0, len = mmsiArr.length; i < len; i++) {
            if (mmsi === mmsiArr[i] && _filtered.indexOf(mmsi)<0 
            && (!_displayingMyFleet || _displayingMyFleet.indexOf(mmsi)>=0)) { 
                if (dates)
                    for (j=0; j<dates.length; ++j){
                        if (dates[j].getTime()==dt.getTime()){
                            return true;
                        }
                    }
                else{
                    return true; 
                }
            }
        }
        return false;
    }, 
    _setTrackFilter = function(){
        
        let lmap = nsGmx.leafletMap;
        if (_aisLayer) {
            if (_displaingTrack.mmsi) {
                _aisLayer.setFilter(_filterFunc);
                if (!_aisLayer._map) {
                    lmap.addLayer(_aisLayer);
                }
            } else {
                _aisLayer.removeFilter();
                lmap.removeLayer(_aisLayer);
            }
        }
        if (_tracksLayer) {
            if (_displaingTrack.mmsi) {
                _tracksLayer.setFilter(_filterFunc);
                if (!_tracksLayer._map) {
                    lmap.addLayer(_tracksLayer);
                }
            } else {
                _tracksLayer.removeFilter();
                lmap.removeLayer(_tracksLayer);
            }
        }
    }, 
    _setMyFleetFilter = function(){
        _setTrackFilter();
//console.log(_displayingMyFleet)
//console.log(_filtered)
        let lmap = nsGmx.leafletMap;
        if (_screenSearchLayer) {
            if (_displayingMyFleet || _filtered.length) {
                _screenSearchLayer.setFilter((args) => {
                    let mmsi = args.properties[1];
                    if (_filtered.indexOf(mmsi) < 0){
                        if (_displayingMyFleet && _displayingMyFleet.indexOf(mmsi) < 0)
                            return false;
                        else
                            return true;
                    }
                    else
                        return false;
                });
            } else {
                _screenSearchLayer.removeFilter();
            }
        }

    },
    _switchLayers = function(l1, l2){
        //l1 && console.log(l1.getGmxProperties().name +" "+ !!(l1._map))
        let lmap = nsGmx.leafletMap;
        if (l1 && l1._map && l2){
            lmap.removeLayer(l1);
            lmap.addLayer(l2);
        }
    } ;

    return {
        get displaingTrack(){ return _displaingTrack; },
        set displaingTrack(value){ _displaingTrack = value; },
        get displayingMyFleet(){ return _displayingMyFleet; },
        set displayingMyFleet(value){ _displayingMyFleet = value; },
        get filtered(){ return _filtered; },
        set filtered(value){ _filtered = value; },
        get hasAlternativeLayers(){ return !!_lastPointLayerAlt; },
        showTrack: function (mmsiArr, dates) { //bbox) {
            _displaingTrack = { mmsi:mmsiArr && mmsiArr.length? mmsiArr[0] : null};
            if (dates)
                _displaingTrack.dates = { mmsi:mmsiArr[0], list:dates };
            //if (bbox) { lmap.fitBounds(bbox, { maxZoom: 11 }); }
            if (_aisLayer || _tracksLayer)
                _displaingTrack.mmsi = mmsiArr[0];
            else
                _displaingTrack.mmsi = null;
            _setTrackFilter();
        },
        hideOnMap: function () { 
            _setMyFleetFilter();
        },
        hideAllOnMap: function () { 
            _setMyFleetFilter();
        },
        switchLayers: function(showAlternative){
                _switchLayers(_screenSearchLayer, _lastPointLayerAlt);
                let temp = _screenSearchLayer;
                _screenSearchLayer = _lastPointLayerAlt;
                _lastPointLayerAlt = temp;
                _switchLayers(_aisLayer, _historyLayerAlt);
                temp = _aisLayer;
                _aisLayer = _historyLayerAlt;
                _historyLayerAlt = temp;
                _switchLayers(_tracksLayer, _tracksLayerAlt);
                temp = _tracksLayer;
                _tracksLayer = _tracksLayerAlt;
                _tracksLayerAlt = temp;
                _setMyFleetFilter();
        }
    };
}