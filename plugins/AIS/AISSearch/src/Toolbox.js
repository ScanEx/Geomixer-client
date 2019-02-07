const Polyfill = require('./Polyfill');
module.exports = function (options) {
    const _layersByID = nsGmx.gmxMap.layersByID,
          _aisLayer = _layersByID[options.aisLayerID],
          _tracksLayer = _layersByID[options.tracksLayerID],
          _screenSearchLayer = _layersByID[options.screenSearchLayer];
    let   _almmsi, 
          _tlmmsi, 
          _aldt, 
          _tldt;

    try{
          _almmsi = _aisLayer.getGmxProperties().attributes.indexOf("mmsi") + 1, 
          _tlmmsi = Polyfill.findIndex(_tracksLayer.getGmxProperties().attributes, function(p){return "mmsi"==p.toLowerCase();}) + 1,
          _aldt = _aisLayer.getGmxProperties().attributes.indexOf("ts_pos_utc") + 1, 
          _tldt = Polyfill.findIndex(_tracksLayer.getGmxProperties().attributes, function(p){return "date"==p.toLowerCase();}) + 1;
// console.log(_almmsi+" "+_aldt)
// console.log(_tlmmsi+" "+_tldt)
    }
    catch(ex){}

    let _displayedTrack = {mmsi:null},
    _filterFunc = function (args, filtered, displayedVessel) {
        let dates = _displayedTrack.dates ? _displayedTrack.dates.list : null,
        mmsiArr = [];
        mmsiArr.push(_displayedTrack.mmsi);

        let mmsi = args.properties[args.properties.length > 20 ? _almmsi : _tlmmsi].toString(),
            dt = new Date(new Date(args.properties[args.properties.length>20 ? _aldt : _tldt]*1000).setUTCHours(0,0,0,0)),
            i, j, len;
        for (i = 0, len = mmsiArr.length; i < len; i++) {
            if (mmsi == mmsiArr[i] && filtered.indexOf(mmsi)<0 
            && (!displayedVessel || displayedVessel.indexOf(mmsi)>=0)) { 
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
    _setTrackFilter = function(filtered, displayedVessel){
//console.log(_displayedTrack)
        let lmap = nsGmx.leafletMap;
        if (_aisLayer) {
            if (_displayedTrack.mmsi) {
                _aisLayer.setFilter((args)=>_filterFunc(args, filtered, displayedVessel));
                if (!_aisLayer._map) {
                    lmap.addLayer(_aisLayer);
                }
            } else {
                _aisLayer.removeFilter();
                lmap.removeLayer(_aisLayer);
            }
        }
        if (_tracksLayer) {
            if (_displayedTrack.mmsi) {
                _tracksLayer.setFilter((args)=>_filterFunc(args, filtered, displayedVessel));
                if (!_tracksLayer._map) {
                    lmap.addLayer(_tracksLayer);
                }
            } else {
                _tracksLayer.removeFilter();
                lmap.removeLayer(_tracksLayer);
            }
        }
    }, 
    _setVesselFilter = function(filtered, displayedVessel){
// console.log(displayedVessel)
// console.log(filtered)
        let lmap = nsGmx.leafletMap;
        if (_screenSearchLayer) {
            if (displayedVessel || filtered.length) {
                _screenSearchLayer.setFilter((args) => {
                    let mmsi = args.properties[1].toString();
                    if (filtered.indexOf(mmsi) < 0){
                        if (displayedVessel && displayedVessel.indexOf(mmsi) < 0)
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
    _markers,
    _visibleMarkers = [],
    _markerMustBeShown = function(mmsi, filtered){
        return (!_visibleMarkers.length && filtered.indexOf(mmsi.toString())<0)
        || _visibleMarkers.indexOf(mmsi.toString())>=0;
    },
    _repaintOtherMarkers = function(data, markerTemplate, filtered){ 
        if (!data)
            return;
            
        let di = nsGmx.widgets.commonCalendar.getDateInterval();
        if (!_markers)
            _markers = L.layerGroup().addTo(nsGmx.leafletMap);
        else
            _markers.clearLayers();
//console.log(filtered)
//console.log(_visibleMarkers)
        let label_line = function(label, label_color, label_shadow){
            if (label!="")
            return '<div style="height:14px;">'+
            '<div class="label_shadow" style="height:14px;color' + label_shadow.color + ";text-shadow:" + label_shadow.text_shadow + '">' + label + '</div>'+
            '<div class="label_color" style="position:relative;top:-14px;color:' + label_color + '">' + label + '</div></div>';
            else
            return "";
        },
        marker = function(vessel, marker_style){
            let type_color = "#000";
            switch(vessel.vessel_type){
                case "Cargo": type_color = "#33a643"; break;
                case "Fishing": type_color = "#f44336"; break;
                case "Tanker": type_color = "#246cbd"; break;
                case "Passenger": type_color = "#c6b01d"; break;
                case "HSC": type_color = "#ff6f00"; break;
                case 'Pleasure Craft': 
                case 'Sailing': type_color = "#9c27b0"; break;
                case 'Dredging':
                case 'Law Enforcement':
                case 'Medical Transport':
                case 'Military':
                case 'Pilot':
                case 'Port Tender':
                case 'SAR':
                case 'Ships Not Party to Armed Conflict':
                case 'Spare':
                case 'Towing':
                case 'Tug':
                case 'Vessel With Anti-Pollution Equipment':
                case 'WIG':
                case 'Diving': type_color = "#9b4628"; break;
            }
            return vessel.sog ?
            '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!vessel.cog?0:vessel.cog) + 'deg)"><title>1</title><path style="fill:' + type_color + ';" d="M13.8,20.07a1,1,0,0,1-.69-0.28l-1.79-1.72a0.72,0.72,0,0,0-1,0L8.52,19.79a1,1,0,0,1-.69.28,1,1,0,0,1-1-1V8.65c0-1.52,1.55-7.59,4-7.59s4,6.07,4,7.59V19a1,1,0,0,1-1,1h0Z"/><path style="fill:' + marker_style + ';" d="M10.82,1.57c1.93,0,3.5,5.57,3.5,7.09V19a0.52,0.52,0,0,1-.51.53,0.49,0.49,0,0,1-.34-0.14l-1.79-1.72a1.22,1.22,0,0,0-1.71,0L8.17,19.42a0.49,0.49,0,0,1-.34.14A0.52,0.52,0,0,1,7.32,19V8.65c0-1.51,1.57-7.09,3.5-7.09h0m0-1c-3,0-4.5,6.72-4.5,8.09V19a1.52,1.52,0,0,0,1.51,1.53,1.49,1.49,0,0,0,1-.42l1.79-1.72a0.22,0.22,0,0,1,.32,0l1.79,1.72a1.49,1.49,0,0,0,1,.42A1.52,1.52,0,0,0,15.32,19V8.65c0-1.37-1.51-8.09-4.5-8.09h0Z"/><ellipse style="fill:#fff;" cx="10.82" cy="10.54" rx="1.31" ry="1.35"/><path style="fill:#fff;" d="M10.73,3.34h0.12a0.35,0.35,0,0,1,.35.35v6.85a0,0,0,0,1,0,0H10.38a0,0,0,0,1,0,0V3.69A0.35,0.35,0,0,1,10.73,3.34Z"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!vessel.cog?0:vessel.cog) + 'deg)"><title>1</title><rect style="fill:' + type_color + ';stroke:' + marker_style + ';stroke-miterlimit:10;" x="5.9" y="5.6" width="9.19" height="9.19" rx="2" ry="2" transform="translate(-4.13 10.41) rotate(-45)"/><circle style="fill:#fff;" cx="10.5" cy="10.19" r="1.5"/></svg>';
        };
        for (let i = 0; i < data.groups.length; ++i) {
//console.log(data.groups[i].marker_style);
            for (let j = 0; j < data.groups[i].vessels.length; ++j) {
                if (_markerMustBeShown(data.groups[i].vessels[j].mmsi, filtered)){
                    if (di.get("dateBegin").getTime()<=data.groups[i].vessels[j].ts_pos_org*1000 && 
                    data.groups[i].vessels[j].ts_pos_org*1000<di.get("dateEnd").getTime()){ 
                        let temp = {};
                        temp.group_name = label_line(data.groups[i].default?"":(data.groups[i].title), data.groups[i].label_color, data.groups[i].label_shadow)
                        temp.vessel_name = label_line(data.groups[i].vessels[j].vessel_name, data.groups[i].label_color, data.groups[i].label_shadow);    
                        temp.sog = label_line(data.groups[i].vessels[j].sog + _gtxt("AISSearch2.KnotShort"), data.groups[i].label_color, data.groups[i].label_shadow);  
                        temp.cog = label_line(isNaN(data.groups[i].vessels[j].cog)?"":data.groups[i].vessels[j].cog.toFixed(1) + "&deg;", data.groups[i].label_color, data.groups[i].label_shadow);    
                        temp.marker = marker(data.groups[i].vessels[j], data.groups[i].marker_style);
                        let m = L.marker([data.groups[i].vessels[j].ymin, data.groups[i].vessels[j].xmin>0?data.groups[i].vessels[j].xmin:360+data.groups[i].vessels[j].xmin],
                            {
                                id:data.groups[i].vessels[j].mmsi,
                                icon: L.divIcon({
                                    className: 'mf_label gr' + i,
                                    html: Handlebars.compile(markerTemplate)(temp)
                                }),
                                zIndexOffset:1000
                            });
                        m.id = data.groups[i].vessels[j].mmsi;
                        _markers.addLayer(m);
                    }
                }
            }
        }
    };

    return {
        get displayedTrack(){ return _displayedTrack; },
        set displayedTrack(value){ _displayedTrack = value; },
        showTrack: function (mmsiArr, dates, filtered, displayedVessel) { 
            _displayedTrack = { mmsi:mmsiArr && mmsiArr.length? mmsiArr[0] : null};
            if (dates)
                _displayedTrack.dates = { mmsi:mmsiArr[0], list:dates };
            if (_aisLayer || _tracksLayer)
                _displayedTrack.mmsi = mmsiArr[0];
            else
                _displayedTrack.mmsi = null;
            _setTrackFilter(filtered, displayedVessel);
        },
        hideVesselMarkers: function (filtered, displayedVessel) {
            _setTrackFilter(filtered, displayedVessel);
            _setVesselFilter(filtered, displayedVessel);
        },
        showOtherMarkers: function(onlyThis){
            if (!onlyThis) {
                _visibleMarkers.length = 0;
            }
            else {
                _visibleMarkers = onlyThis.map(m=>m);
            }
            _screenSearchLayer.fire('versionchange');
        },
        repaintOtherMarkers: _repaintOtherMarkers,
        highlightMarker: function(i, group){
            $('.mf_label.gr'+i+' svg').each((i,e)=>{
                let paths = e.querySelectorAll('path');
                if(paths[1])
                    paths[1].style.fill = group.marker_style;
            })
            $('.mf_label.gr'+i+' svg rect').css({"stroke":group.marker_style});

            $('.mf_label.gr'+i+' .label_color').css({"color":group.label_color});
            $('.mf_label.gr'+i+' .label_shadow').css({"color":group.label_shadow.color, "text-shadow":group.label_shadow.text_shadow});
        }
    };
}