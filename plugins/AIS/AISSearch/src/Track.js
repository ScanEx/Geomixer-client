const vesselMarker = require('./VesselMarker');
module.exports = function (options) {

    const _lmap = nsGmx.leafletMap,
        _tracks = {}, _tracksAlt = {},
        _tracksMF = {}, _tracksAltMF = {},
        _canvas = L.canvas(),
        _addMarker = function (p, ep, group, onclick, style, placeVesselTypeIcon) {
            if (placeVesselTypeIcon)
                placeVesselTypeIcon(p);
            var options = {
                radius: 10,
                fillColor: style != 'SPEED' ? p.color.value : p.colorAlt.value,
                fillOpacity: 0.25,
                weight: 2,
                color: 'SPEED' ? p.color.value : p.colorAlt.value,
                cog: parseInt(p.cog),
                img: style != 'SPEED' ? p.img : p.imgAlt,
                renderer: _canvas,
                pid: p.id,
                next: !ep ? null : L.latLng(ep.ymax, ep.xmax < 0 ? 360 + ep.xmax : ep.xmax),
                ts: new Date()
            },
                m = vesselMarker(L.latLng(p.ymax, p.xmax < 0 ? 360 + p.xmax : p.xmax), options);
            m.on('click', e => onclick({ p, pid: p.id }));
            group.addLayer(m);
        },
        _addMarkers = function (data, next, onclick, style, placeVesselTypeIcon) {
            const group = L.layerGroup(null, { renderer: _canvas });
            for (var i = 0; i < data.length; i++) {
                if (data[i].positions) {
                    for (var j = 0; j < data[i].positions.length; j++) {
                        var p = data[i].positions[j];
                        p.mmsi = data[i].mmsi; p.imo = data[i].imo;
                        if (data[i].positions[j + 1])
                            _addMarker(p, data[i].positions[j + 1], group, onclick, style, placeVesselTypeIcon);
                        else
                            _addMarker(p, null, group, onclick, style, placeVesselTypeIcon);
                    }
                }
                else {
                    if (data[i + 1])
                        _addMarker(data[i], data[i + 1], group, onclick, style, placeVesselTypeIcon);
                    else {
                        _addMarker(data[i], next, group, onclick, style, placeVesselTypeIcon);
                        if (next) {
                            _addMarker(next, null, group, onclick, style, placeVesselTypeIcon);
                        }
                    }
                }
            }
            return group;
        }
    let _prevCursor = null, _historyMmsi = null;

    document.body.addEventListener('mousemove', e => {
        if (!_canvas._container)
            return;
        _canvas._onMouseMove(e);
        if (_canvas._container.className.search(/interactive/) > -1) {
            if (_canvas._map._container.style.cursor != 'pointer') {
                _prevCursor = _canvas._map._container.style.cursor;
                _canvas._map._container.style.cursor = 'pointer'
            }
        }
        else {
            if (_prevCursor !== null) {
                _canvas._map._container.style.cursor = _prevCursor;
                _prevCursor = null;
            }
        }
    });
    document.body.addEventListener('click', e => {
        if (!_canvas._container)
            return;
        if (_canvas._container.className.search(/interactive/) > -1){
//console.log('canvas', e)
            _canvas._onClick(e);
        }
    }, true);

    return {
        showHistoryTrack: function (vessels, onclick, needAltLegend) {
            if (!vessels) { // CLEAN ALL  
                for (let t in _tracks) {
                    _lmap.removeLayer(_tracks[t]);
                    _lmap.removeLayer(_tracksAlt[t]);
                    delete _tracks[t];
                    delete _tracksAlt[t];
                }
                return [];
            }

            for (let i = 0; i < vessels.length; ++i) {
                let trackId = vessels[i].mmsi + '_' + vessels[i].imo + '_' + vessels[i].ts;
                if (vessels[i].positions.length) {
                    if (!_tracks[trackId]) {
                        _tracks[trackId] = _addMarkers(vessels[i].positions, vessels[i].end, p => onclick(p, false), 'TYPE');
                        _tracksAlt[trackId] = _addMarkers(vessels[i].positions, vessels[i].end, p => onclick(p, false), 'SPEED');
                        //console.log(i, _tracks[trackId])

                        if (!needAltLegend)
                            _lmap.addLayer(_tracks[trackId]);
                        else
                            _lmap.addLayer(_tracksAlt[trackId]);
                    }
                }
                else { // HIDE SOME
                    _lmap.removeLayer(_tracks[trackId]);
                    _lmap.removeLayer(_tracksAlt[trackId]);
                    delete _tracks[trackId];
                    delete _tracksAlt[trackId];
                }
            }

            if (_canvas._container)
                _canvas._container.style.pointerEvents = 'none';
            
            return Object.keys(_tracks);
        },

        showMyFleetTrack: function (vessels, onclick, aisLayerSearcher, viewState, needAltLegend) {
            //console.log(vessels);
            if (!vessels) {
                for (let t in _tracksMF) {   
                    _lmap.removeLayer(_tracksMF[t]);
                    _lmap.removeLayer(_tracksAltMF[t]);
                    delete _tracksMF[t];
                    delete _tracksAltMF[t];
                }
                return;
            }   

            if (vessels.length && vessels[0].mmsi) {
                let trackId = vessels[0].mmsi.toString();
                if (_tracksMF[trackId]){                    
                    _lmap.removeLayer(_tracksMF[trackId]);
                    _lmap.removeLayer(_tracksAltMF[trackId]);
                }
                if (vessels[0].positions.length) {

                    _tracksMF[trackId] = _addMarkers(vessels, null, onclick, 'TYPE', aisLayerSearcher.placeVesselTypeIcon);
                    _tracksAltMF[trackId] = _addMarkers(vessels, null,  onclick, 'SPEED', aisLayerSearcher.placeVesselTypeIcon);

                    if (viewState.isViewActive && viewState.notDisplayed.indexOf(trackId)<0)
                        if (!needAltLegend)
                            _lmap.addLayer(_tracksMF[trackId]);
                        else
                            _lmap.addLayer(_tracksAltMF[trackId]);

                    if (_canvas._container)
                        _canvas._container.style.pointerEvents = 'none'; 
                }
            }
        },

        showMyFleetTracks: function(displayed, needAltLegend){
            const a = displayed=='all' ? Object.keys(_tracksMF) : displayed;
            a.forEach(mmsi => {
                if (_tracksMF[mmsi])
                    if (!needAltLegend)
                        _lmap.addLayer(_tracksMF[mmsi]);
                    else
                        _lmap.addLayer(_tracksAltMF[mmsi]);
            });
        },
        hideMyFleetTracks: function(notDisplayed, needAltLegend){
            const a = Object.keys(_tracksMF);
            a.forEach(mmsi => {
                if (notDisplayed.indexOf(mmsi) < 0) {
                    if (!needAltLegend)
                        !_tracksMF[mmsi]._map && _lmap.addLayer(_tracksMF[mmsi]);
                    else
                        !_tracksAltMF[mmsi]._map && _lmap.addLayer(_tracksAltMF[mmsi]);
                }
                else {
                    _lmap.removeLayer(_tracksMF[mmsi]);
                    _lmap.removeLayer(_tracksAltMF[mmsi]);
                }
            });
        },
        cleanMyFleetTracks: function(){
            for (let k in _tracksMF){
                _lmap.removeLayer(_tracksMF[k]);
                _lmap.removeLayer(_tracksAltMF[k]);
            }
        },
        showHistoryTracks: function(displayed, needAltLegend){
            const a = Object.keys(_tracks);
            a.forEach(id => {
                if (displayed.indexOf(id) > -1) {
                    if (!needAltLegend)
                        !_tracks[id]._map && _lmap.addLayer(_tracks[id]);
                    else
                        !_tracksAlt[id]._map && _lmap.addLayer(_tracksAlt[id]);
                }
                else {
                    _lmap.removeLayer(_tracks[id]);
                    _lmap.removeLayer(_tracksAlt[id]);
                }
            });

        },
        cleanHistoryTracks: function(){
            const ra = [];
            for (let k in _tracks){
                if (_tracks[k]._map || _tracksAlt[k]._map)
                    ra.push(k);
                _lmap.removeLayer(_tracks[k]);
                _lmap.removeLayer(_tracksAlt[k]);
            }
            return ra;
        },

       
        switchLegend: function(needAltLegend, notDisplayedVessels){
            for (let t in _tracks){
                //if (notDisplayedVessels.indexOf(t)<0)
                if (needAltLegend){
                    if (_tracks[t]._map){
                    _lmap.removeLayer(_tracks[t]);
                    _lmap.addLayer(_tracksAlt[t]);
                    }
                }
                else{
                    if (_tracksAlt[t]._map){
                    _lmap.removeLayer(_tracksAlt[t]);
                    _lmap.addLayer(_tracks[t]);
                    }
                }
            }
            
            for (let t in _tracksMF){
                if (notDisplayedVessels.indexOf(t)<0){
                    if (needAltLegend){
                        if (_tracksMF[t]._map){
                            _lmap.removeLayer(_tracksMF[t]);
                            _lmap.addLayer(_tracksAltMF[t]);
                        }
                    }
                    else{
                        if (_tracksAltMF[t]._map){
                            _lmap.removeLayer(_tracksAltMF[t]);
                            _lmap.addLayer(_tracksMF[t]);
                        }
                    }
                }
            }
        },

        removeMyFleetTrack: function (mmsi){            
            mmsi = mmsi.toString();
            if (_tracksMF[mmsi]){
                _lmap.removeLayer(_tracksMF[mmsi]);
                _lmap.removeLayer(_tracksAltMF[mmsi]);
                delete _tracksMF[mmsi];
                delete _tracksAltMF[mmsi];
            }
        }, 

    };
}