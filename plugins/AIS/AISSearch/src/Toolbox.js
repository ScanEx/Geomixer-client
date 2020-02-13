const Track  = require('./Track');
const Polyfill = require('./Polyfill');

module.exports = function (options) {
    const _lmap = nsGmx.leafletMap,
        _layersByID = nsGmx.gmxMap.layersByID,
        _aisLayer = _layersByID[options.aisLayerID],
        _screenSearchLayer = _layersByID[options.searchLayer],
        //_lastPointLayerAltFact = _layersByID[options.lastPointLayerAlt],
        _lastPointLayerAlt = _layersByID[options.lastPointLayerAlt];

    let _curLegendLayer = _screenSearchLayer, _prevLegendLayer = _lastPointLayerAlt;

    let _almmsi, _tlmmsi, _aldt, _tldt;
    let _needAltLegend = false;
    try{
          _almmsi = _aisLayer.getGmxProperties().attributes.indexOf("mmsi") + 1, 
          _aldt = _aisLayer.getGmxProperties().attributes.indexOf("ts_pos_utc") + 1;
// console.log(_almmsi+" "+_aldt)
// console.log(_tlmmsi+" "+_tldt)
    }
    catch(ex){}

    let _displayedVessels = "all",  
    _notDisplayedVessels = [],
    _filterFunc = function (args) {
        let mmsiArr = [];
        let mmsi = args.properties[args.properties.length > 20 ? _almmsi : _tlmmsi].toString(),
            dt = new Date(new Date(args.properties[args.properties.length>20 ? _aldt : _tldt]*1000).setUTCHours(0,0,0,0)),
            i, j;
        for (i = 0; i < mmsiArr.length; i++) {
            if (mmsi == mmsiArr[i]) { 
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
    _specialVesselFilters,
    // _setVesselFilter = function(){
    //     if (_screenSearchLayer) {
    //         _screenSearchLayer.removeFilter();  

    //         if (_displayedVessels!="all" || _notDisplayedVessels.length || _specialVesselFilters) {            
    //             let ai = _screenSearchLayer._gmx.tileAttributeIndexes, fields = [];
    //             for (var k in ai)
    //                 fields[ai[k]] = k;
    //             _screenSearchLayer.setFilter((args) => {

    //                 for(var f in _specialVesselFilters)
    //                         _specialVesselFilters[f](args, ai, _displayedVessels);

    //                 let mmsi = args.properties[ai.mmsi].toString();
    //                 if ((_displayedVessels=="all" || _displayedVessels.indexOf(mmsi) >= 0) && 
    //                     _notDisplayedVessels.indexOf(mmsi) < 0)
    //                     return true;
    //                 else
    //                     return false;
    //             });
    //         } 
    //     }

    // },
    _setVesselFilter = function(){
        if (_curLegendLayer) {
            _curLegendLayer.removeFilter();  

            if (_displayedVessels!="all" || _notDisplayedVessels.length || _specialVesselFilters) {            
                let ai = _curLegendLayer._gmx.tileAttributeIndexes, fields = [];
                for (var k in ai)
                    fields[ai[k]] = k;
                    _curLegendLayer.setFilter((args) => {

                    for(var f in _specialVesselFilters)
                            _specialVesselFilters[f](args, ai, _displayedVessels);

                    let mmsi = args.properties[ai.mmsi].toString();
                    if ((_displayedVessels=="all" || _displayedVessels.indexOf(mmsi) >= 0) && 
                        _notDisplayedVessels.indexOf(mmsi) < 0)
                        return true;
                    else
                        return false;
                });
            } 
        }

    },
    _historyInterval,
    _markers,
    _visibleMarkers = [],
    _icons = {},
    _getSvg = function(url){
        let svg = _icons[url]
        if (!svg){
            return new Promise(resolve=>{
                let httpRequest = new XMLHttpRequest();
                httpRequest.onreadystatechange = function () {
                    if (httpRequest.readyState === 4) {
                        _icons[url] = httpRequest.responseText
                        resolve(_icons[url]);
                    }
                }
                httpRequest.open("GET", document.location.protocol + url.replace(/^https?:/, ""));
                httpRequest.send();
            })
        }
        return Promise.resolve(svg);
    },
    _markerIcon = function(icon, cog, sog, vtype, group_style){ 
        return _getSvg(icon).then(
            svg=>{
                let type_color = '#00f',
                    a = /\.cls-1{fill:(#[^};]+)/.exec(svg)
                if (a && a.length)
                    type_color = a[1];
//console.log(type_color)
                if (sog)
                    return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!cog ? 0 : cog) + 'deg)"><title>1</title><path style="fill:' + type_color + ';" d="M13.8,20.07a1,1,0,0,1-.69-0.28l-1.79-1.72a0.72,0.72,0,0,0-1,0L8.52,19.79a1,1,0,0,1-.69.28,1,1,0,0,1-1-1V8.65c0-1.52,1.55-7.59,4-7.59s4,6.07,4,7.59V19a1,1,0,0,1-1,1h0Z"/><path style="fill:' + group_style + ';" d="M10.82,1.57c1.93,0,3.5,5.57,3.5,7.09V19a0.52,0.52,0,0,1-.51.53,0.49,0.49,0,0,1-.34-0.14l-1.79-1.72a1.22,1.22,0,0,0-1.71,0L8.17,19.42a0.49,0.49,0,0,1-.34.14A0.52,0.52,0,0,1,7.32,19V8.65c0-1.51,1.57-7.09,3.5-7.09h0m0-1c-3,0-4.5,6.72-4.5,8.09V19a1.52,1.52,0,0,0,1.51,1.53,1.49,1.49,0,0,0,1-.42l1.79-1.72a0.22,0.22,0,0,1,.32,0l1.79,1.72a1.49,1.49,0,0,0,1,.42A1.52,1.52,0,0,0,15.32,19V8.65c0-1.37-1.51-8.09-4.5-8.09h0Z"/><ellipse style="fill:#fff;" cx="10.82" cy="10.54" rx="1.31" ry="1.35"/><path style="fill:#fff;" d="M10.73,3.34h0.12a0.35,0.35,0,0,1,.35.35v6.85a0,0,0,0,1,0,0H10.38a0,0,0,0,1,0,0V3.69A0.35,0.35,0,0,1,10.73,3.34Z"/></svg>';
                else
                    return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!cog ? 0 : cog) + 'deg)"><title>1</title><rect style="fill:' + type_color + ';stroke:' + group_style + ';stroke-miterlimit:10;" x="5.9" y="5.6" width="9.19" height="9.19" rx="2" ry="2" transform="translate(-4.13 10.41) rotate(-45)"/><circle style="fill:#fff;" cx="10.5" cy="10.19" r="1.5"/></svg>';
            }
        );
    },
    _eraseMyFleetMarker = function(mmsi){
        if (!_markers)
            _markers = L.layerGroup().addTo(_lmap);
        else{
            let layers = _markers.getLayers(), layer;
            for (var i in layers)
                if (layers[i].id==mmsi){
                    layer = layers[i];
                    break;
                }
                layer && _markers.removeLayer(layer);
        }
    },
    _drawMyFleetMarker = function(args, markerTemplate, group, ai, isVisible){ 
        let data = args.properties;
        let di = nsGmx.widgets.commonCalendar.getDateInterval();
        let icon = args.parsedStyleKeys.iconUrl;//args.parsedStyleKeys.iconUrl.replace(/.+(\/|%5C)(?=[^\/]+$)/, '')
        _eraseMyFleetMarker(data[ai.mmsi]);

        if (!isVisible)
            return;

        let label_line = function(label, label_color, label_shadow){
            if (label!="")
            return '<div style="height:14px;">'+
            '<div class="label_shadow" style="height:14px;color' + label_shadow.color + ";text-shadow:" + label_shadow.text_shadow + '">' + label + '</div>'+
            '<div class="label_color" style="position:relative;top:-14px;color:' + label_color + '">' + label + '</div></div>';
            else
            return "";
        }
        if (di.get("dateBegin").getTime()<=data[ai.ts_pos_utc]*1000 && data[ai.ts_pos_utc]*1000<di.get("dateEnd").getTime()){ 
            _markerIcon(icon, data[ai.cog], data[ai.sog], data[ai.vessel_type], group.marker_style).then(marker=>{

                _eraseMyFleetMarker(data[ai.mmsi]);

                let temp = {};
                temp.group_name = label_line(group.default?"":(group.title), group.label_color, group.label_shadow)
                temp.vessel_name = label_line(data[ai.vessel_name], group.label_color, group.label_shadow);    
                temp.sog = label_line(data[ai.sog] + _gtxt("AISSearch2.KnotShort"), group.label_color, group.label_shadow);  
                temp.cog = label_line(isNaN(data[ai.cog])?"":data[ai.cog].toFixed(1) + "&deg;", group.label_color, group.label_shadow);                 
                temp.marker = marker;
                let m = L.marker([data[ai.latitude], data[ai.longitude]>0?data[ai.longitude]:360+data[ai.longitude]],
                    {
                        id:data[ai.mmsi],
                        icon: L.divIcon({
                            className: 'mf_label gr' + group.id,
                            html: Handlebars.compile(markerTemplate)(temp)
                        }),
                        zIndexOffset:1000
                    });
                m.id = data[ai.mmsi];
                _markers.addLayer(m);
            });
        }

    },
    _switchLayers = function(l1, l2){
        //l1 && console.log(l1.getGmxProperties().name +" "+ !!(l1._map))
        if (!l2 || l2._map)
            return;
        if (l1 && l2){
            _lmap.removeLayer(l1);
            _lmap.addLayer(l2);
        }
    },
    _legendSwitchedHandlers = [],
    _legendSwitched = function(showAlternative){
        _legendSwitchedHandlers.forEach(h=>h(showAlternative));
    },

    _round = function (d, p) {
        let isNeg = d < 0,
            power = Math.pow(10, p)
        return d ? ((isNeg ? -1 : 1) * (Math.round((isNeg ? d = -d : d) * power) / power)) : d
    },
    _addUnit = function (v, u) {
        return v != null && v != "" ? v + u : "";
    },        
    _toDd = function (D, lng) {
        let dir = D < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
            deg = Math.round((D < 0 ? D = -D : D) * 1000000) / 1000000
        return deg.toFixed(2) + " "//"°"
            + dir
    };

    const _trackBuilder = new Track();

    return {
        set specialVesselFilters({key, value}) {
            if (!_specialVesselFilters)
                _specialVesselFilters = {};
            _specialVesselFilters[key] = value;
            //_setVesselFilter();
        },
        get hasAlternativeLayers(){ return _lastPointLayerAlt; },
        get needAltLegend(){
            //return !!(_lastPointLayerAltFact && _lastPointLayerAltFact._map); 
            return _needAltLegend;
        },
        get historyInterval(){return _historyInterval;},
        set historyInterval(v){_historyInterval = v;},

        ///////////////////////
        removeMyFleetTrack: function (mmsi){
            _trackBuilder.removeMyFleetTrack(mmsi);
        }, 

        showMyFleetTrack: function (vessels, onclick, aisLayerSearcher, viewState) {
            _trackBuilder.showMyFleetTrack (vessels, onclick, aisLayerSearcher, viewState, this.needAltLegend);
        },
     
        showHistoryTrack: function (vessels, onclick) {
            return _trackBuilder.showHistoryTrack(vessels, onclick, this.needAltLegend);
        },

        restoreDefault: function(){                   
            // _lmap.addLayer(_screenSearchLayer);
            // _lastPointLayerAlt && _lmap.removeLayer(_lastPointLayerAlt);              
            _lmap.addLayer(_curLegendLayer);
            _prevLegendLayer && _lmap.removeLayer(_prevLegendLayer); 
        },

        cleanMap: function(viewState){
            _displayedVessels = 'all';
            _notDisplayedVessels.length = 0;
            _setVesselFilter();   

            viewState.cleanTracks(_trackBuilder, this.needAltLegend);
        },

        hideVesselsOnMap: function (viewState, comment) {      
            if (viewState.notDisplayed.length)
                _notDisplayedVessels = viewState.notDisplayed.map(v => v);
            else
                _notDisplayedVessels.length = 0;
//console.log('hideOnMap', comment, _notDisplayedVessels)           
            _setVesselFilter();
            viewState.hideTracks(_trackBuilder, this.needAltLegend);
        },

        showVesselsOnMap: function (viewState) { 
            _displayedVessels = viewState.displayedOnly && viewState.displayedOnly.length ? viewState.displayedOnly.map(v=>v) : "all"; 
//console.log('showOnMap', _displayedVessels)           
            _setVesselFilter();

            viewState.showTracks(_trackBuilder, this.needAltLegend);
        },

        redrawMarkers: function () {
            _setVesselFilter();
        },

        clearMyFleetMarkers: function(){
//console.log("clearMyFleetMarkers")
            _markers && _markers.clearLayers();
        },

        eraseMyFleetMarker: _eraseMyFleetMarker,

        drawMyFleetMarker: _drawMyFleetMarker,

        highlightMarker: function(i, group){
            $('.mf_label.gr'+group.id+' svg').each((i,e)=>{
                let paths = e.querySelectorAll('path');
                if(paths[1])
                    paths[1].style.fill = group.marker_style;
            })
            $('.mf_label.gr'+group.id+' svg rect').css({"stroke":group.marker_style});

            $('.mf_label.gr'+group.id+' .label_color').css({"color":group.label_color});
            $('.mf_label.gr'+group.id+' .label_shadow').css({"color":group.label_shadow.color, "text-shadow":group.label_shadow.text_shadow});
        },

        switchLegend: function(showAlternative){
            // _switchLayers(_screenSearchLayer, _lastPointLayerAlt);
            // let temp = _screenSearchLayer;
            // _screenSearchLayer = _lastPointLayerAlt;
            // _lastPointLayerAlt = temp;
            // _needAltLegend = !!(_lastPointLayerAltFact && _lastPointLayerAltFact._map);
            
            _needAltLegend = showAlternative;

            _switchLayers(_curLegendLayer, _prevLegendLayer);
            let temp = _curLegendLayer;
            _curLegendLayer = _prevLegendLayer;
            _prevLegendLayer = temp;

            _setVesselFilter();
            _legendSwitched(showAlternative);

            _trackBuilder.switchLegend(this.needAltLegend, _notDisplayedVessels);            
        },

        onLegendSwitched: function(handler){    
            _legendSwitchedHandlers.push(handler);
        },

        formatPosition: function (vessel, aisLayerSearcher) {
            vessel.cog_sog = vessel.cog && vessel.sog
            vessel.heading_rot = vessel.heading && vessel.rot
            vessel.x_y = vessel.longitude && vessel.latitude
            let d = new Date(vessel.ts_pos_utc * 1000)
            let eta = new Date(vessel.ts_eta * 1000)
            vessel.tm_pos_utc = this.formatTime(d);
            vessel.tm_pos_loc = this.formatTime(d, true);
            vessel.dt_pos_utc = this.formatDate(d);
            vessel.dt_pos_loc = this.formatDate(d, true);
            vessel.eta_utc = aisLayerSearcher.formatDateTime(eta);
            vessel.eta_loc = aisLayerSearcher.formatDateTime(eta, true);
            vessel.icon_rot = Math.round(vessel.cog/15)*15;
            vessel.cog = _addUnit(_round(vessel.cog, 5), "°");
            vessel.rot = _addUnit(_round(vessel.rot, 5), "°/мин");
            vessel.heading = _addUnit(_round(vessel.heading, 5), "°");
            vessel.draught = _addUnit(_round(vessel.draught, 5), " м");
            //vessel.length = _addUnit(vessel.length, " м");
            //vessel.width = _addUnit(vessel.width, " м");
            //vessel.source = 'plugins/AIS/AISSearch/svg/satellite-ais.svg'//vessel.source=='T-AIS'?_gtxt('AISSearch2.tais'):_gtxt('AISSearch2.sais');
            vessel.source_orig = vessel.source;
            vessel.source = vessel.source=='T-AIS'?'plugins/AIS/AISSearch/svg/waterside-radar.svg':'plugins/AIS/AISSearch/svg/satellite-ais.svg';
                
            vessel.xmin = vessel.longitude;
            vessel.xmax = vessel.longitude;           
            vessel.ymin = vessel.latitude;
            vessel.ymax = vessel.latitude; 
        
            vessel.longitude = _toDd(vessel.longitude, true);
            vessel.latitude = _toDd(vessel.latitude);
            aisLayerSearcher.placeVesselTypeIcon(vessel);
            vessel.sog = _addUnit(_round(vessel.sog, 5), " уз");
        
            return vessel;
        },
        formatTime: function (d, local) {
            var temp = new Date(d)
            if (!local)
                temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset())
            return temp.toLocaleTimeString();
        },
        formatDate: function (d, local) {
            var temp = new Date(d)
            if (!local)
                temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset())
            return temp.toLocaleDateString();
        },

        hideAisData: function(isNeeded){
            if (isNeeded){
                _lmap.removeLayer(_screenSearchLayer);
                _lmap.removeLayer(_lastPointLayerAlt);
                _markers && _lmap.removeLayer(_markers);
            }
            else{
                _lmap.addLayer(_curLegendLayer);
                _markers && _lmap.addLayer(_markers);
                // if(!_needAltLegend)
                // _lmap.addLayer(_screenSearchLayer);
                // else
                // //_lmap.addLayer(_lastPointLayerAltFact);
                // _lmap.addLayer(_lastPointLayerAlt);
            }
        }
    };
}