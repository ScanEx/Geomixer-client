require('./Controls/L.CanvasOverlay');
const vesselMarker  = require('./VesselMarker');
const Polyfill = require('./Polyfill');

module.exports = function (options) {
    const _lmap = nsGmx.leafletMap,
        _layersByID = nsGmx.gmxMap.layersByID;
      let _aisLayer = _layersByID[options.aisLayerID],
          _screenSearchLayer = _layersByID[options.searchLayer],
          _lastPointLayerAlt = _layersByID[options.lastPointLayerAlt],
          _lastPointLayerAltFact = _layersByID[options.lastPointLayerAlt];

    let   _almmsi, _tlmmsi, _aldt, _tldt;
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
    _setVesselFilter = function(){
        if (_screenSearchLayer) {
            _screenSearchLayer.removeFilter();  

            if (_displayedVessels!="all" || _notDisplayedVessels.length || _specialVesselFilters) {            
                let ai = _screenSearchLayer._gmx.tileAttributeIndexes, fields = [];
                for (var k in ai)
                    fields[ai[k]] = k;
                _screenSearchLayer.setFilter((args) => {

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

    const _tracks = {}, _tracksAlt = {}, 
    _tracksMF = {}, _tracksAltMF = {}, 
    _canvas = L.canvas(),
    _addMarker = function(p, ep, group, style, placeVesselTypeIcon){
        if (placeVesselTypeIcon)
            placeVesselTypeIcon(p);
        var options = {
            radius: 10,
            fillColor: style != 'SPEED' ? p.color.value : p.colorAlt.value,
            fillOpacity: 0.25,
            weight: 1,
            color: 'SPEED' ? p.color.value : p.colorAlt.value,
            cog: parseInt(p.cog),
            img: style != 'SPEED' ? p.img : p.imgAlt,
            renderer: _canvas,
            pid: p.id,
            next: !ep ? null : L.latLng(ep.ymax, ep.xmax < 0 ? 360 + ep.xmax : ep.xmax),
            ts: new Date()
        },
        m = vesselMarker(L.latLng(p.ymax, p.xmax < 0 ? 360 + p.xmax : p.xmax), options);
        m.on('click', e => console.log(e.target.options.pid, e.target.options.ts))
        group.addLayer(m);                
    },
    _addMarkers = function (data, next, style, placeVesselTypeIcon) {
        const group = L.layerGroup(null, {renderer: _canvas});

        for (var i = 0; i < data.length; i++) {               
            if (data[i].positions)   {         
                for (var j = 0; j < data[i].positions.length; j++) {
                    var p = data[i].positions[j];
                    if (data[i].positions[j+1])
                        _addMarker(p, data[i].positions[j+1], group, style, placeVesselTypeIcon);
                    else
                        _addMarker(p, null, group, style, placeVesselTypeIcon);
                }
            }
            else{
                if (data[i+1])
                    _addMarker(data[i], data[i+1], group, style, placeVesselTypeIcon);
                else{
                    _addMarker(data[i], next, group, style, placeVesselTypeIcon);
                }
            }

        }
        return group;
    }
    let _prevCursor = null;

    document.body.addEventListener('mousemove', e=>{
        if (!_canvas._container)
            return;
         _canvas._onMouseMove(e); 
        if(_canvas._container.className.search(/interactive/)>-1){ 
                if (_canvas._map._container.style.cursor != 'pointer'){
                    _prevCursor = _canvas._map._container.style.cursor;
                    _canvas._map._container.style.cursor = 'pointer'
                } 
            } 
            else {
                if (_prevCursor !== null){
                    _canvas._map._container.style.cursor = _prevCursor;
                    _prevCursor = null;
                }
            }
    });
    document.body.addEventListener('click', e=>{
        if (!_canvas._container)
            return;
        if(_canvas._container.className.search(/interactive/)>-1)
            _canvas._onClick(e);
    });     

    return {
        set specialVesselFilters({key, value}) {
            if (!_specialVesselFilters)
                _specialVesselFilters = {};
            _specialVesselFilters[key] = value;
            //_setVesselFilter();
        },
        get hasAlternativeLayers(){ return _lastPointLayerAlt; },
        get needAltLegend(){
            //return !!(_lastPointLayerAlt && _lastPointLayerAlt._map); 
            return !!(_lastPointLayerAltFact && _lastPointLayerAltFact._map); 
        },
        get historyInterval(){return _historyInterval;},
        set historyInterval(v){_historyInterval = v;},

        ///////////////////////
        removeMyFleetTrack: function (mmsi){
            mmsi = mmsi.toString();
            if (_tracksMF[mmsi]){
                _lmap.removeLayer(_tracksMF[mmsi]);
                _lmap.removeLayer(_tracksAltMF[mmsi]);
                delete _tracksMF[mmsi];
                delete _tracksAltMF[mmsi];
            }
        },   
        showMyFleetTrack: function (vessels, onclick, aisLayerSearcher) {
            //console.log(vessels);
            if (!vessels) {
                for (let t in _tracksMF) {   
                    // if (_tracksMF[t].options.renderer)
                    //     _lmap.removeLayer(_tracksMF[t].options.renderer)
                    // if (_tracksAltMF[t].options.renderer)
                    //     _lmap.removeLayer(_tracksAltMF[t].options.renderer)  
                    _lmap.removeLayer(_tracksMF[t]);
                    _lmap.removeLayer(_tracksAltMF[t]);
                    delete _tracksMF[t];
                    delete _tracksAltMF[t];
                }
                return;
            }   
/*
            function addMarkers(data, style) {
                //const canvas = L.canvas(),
                const group = L.layerGroup(null, {renderer: _canvas});

                for (var i = 0; i < data.length; i++)                
                for (var j = 0; j < data[i].positions.length; j++) {

                    var p = data[i].positions[j];
                    aisLayerSearcher.placeVesselTypeIcon(p);
                    var options = {
                        radius: 10,
                        fillColor: style != 'SPEED' ? p.color.value : p.colorAlt.value,
                        fillOpacity: 0.25,
                        weight: 1,
                        color: "#000000",
                        cog: parseInt(p.cog),
                        img: style != 'SPEED' ? p.img : p.imgAlt,
                        renderer: _canvas,
                        pid: p.id
                    },
                    m = vesselMarker(L.latLng(p.ymax, p.xmax < 0 ? 360 + p.xmax : p.xmax), options);
                    m.on('click', e=>console.log(e.target.options.pid))
                    group.addLayer(m);
                }
                return group;
            }
*/
            if (vessels.length && vessels[0].mmsi) {
//console.log(vessels)
//return;
                let trackId = vessels[0].mmsi.toString();
                if (!_tracksMF[trackId] && vessels[0].positions.length) {

                    _tracksMF[trackId] = _addMarkers(vessels, null, 'TYPE', aisLayerSearcher.placeVesselTypeIcon);
                    _tracksAltMF[trackId] = _addMarkers(vessels, null,  'SPEED', aisLayerSearcher.placeVesselTypeIcon);
//console.log(_tracksMF[trackId])
                    if (_canvas._container)
                        _canvas._container.style.pointerEvents = 'none';
                        
                    let mmsi; 
                    for (let t in _tracks){ 
                        mmsi = t.replace(/_.+/, '')
                        if (mmsi==trackId)
                            break;
                        else
                            mmsi = false;
                    }
                    if (!mmsi){
                        if (!this.needAltLegend)
                            _lmap.addLayer(_tracksMF[trackId]);
                        else
                            _lmap.addLayer(_tracksAltMF[trackId]);
                    }
                    else
                        console.log(mmsi + " hidden")
                }
            }
        
        },
        showMyFleetTrack2: function (vessels, onclick, aisLayerSearcher) {
//console.log(vessels);
            if (!vessels){
                for (let t in _tracksMF){
                    _lmap.removeLayer(_tracksMF[t]);
                    _lmap.removeLayer(_tracksAltMF[t]);
                    delete _tracksMF[t];
                    delete _tracksAltMF[t];
                }
                return;
            }
            const drawRotatedImage = function (ctx, image, x, y, angle) { 
                ctx.save(); 
                ctx.translate(x, y);
                ctx.rotate(angle * Math.PI/180.0);
                ctx.drawImage(image, -(image.width/2), -(image.height/2));
                ctx.restore();
                // ctx.drawImage(image, x, y); 
            },
            drawingOnCanvas = function (canvasOverlay, params){
                var ctx = params.canvas.getContext('2d'),
                data = params.options.data;
                if (!data.length)
                   return;
//console.log(//data, 
//     params.options.markers);
                ctx.clearRect(0, 0, params.canvas.width, params.canvas.height); 
                ctx.beginPath();
                ctx.lineWidth = 2;
                ctx.globalCompositeOperation = 'destination-over';
                let startPt = null, count = 0;
                for (var i = 0; i < data.length; i++) {
                    var positions = data[i].positions;
                    count += positions.length;
                    for (var j = 0; j < positions.length; j++) {
                        if(!positions[j].img)
                            aisLayerSearcher.placeVesselTypeIcon(positions[j]);

                        if (params.options.markers == 'SPEED')
                            ctx.strokeStyle = positions[j].colorAlt.value;
                        else
                            ctx.strokeStyle = positions[j].color.value;

                        var y = positions[j].ymax, x = positions[j].xmax<0 ? 360 + positions[j].xmax : positions[j].xmax;
                        //if (params.bounds.contains([y, x])) {
                        if (params.buffer.contains([y, x])) {
                            var dot = canvasOverlay._map.latLngToContainerPoint([y, x]);
                            dot.x = dot.x + params.offset; dot.y = dot.y + params.offset;
                            drawRotatedImage(ctx, params.options.markers=='SPEED' ? positions[j].imgAlt : positions[j].img, dot.x, dot.y, parseInt(positions[j].cog));
                            if (!startPt){
                                startPt = dot;
                                ctx.moveTo(dot.x, dot.y);
                            }
                            else
                                ctx.lineTo(dot.x, dot.y);  
                        }                  
                    }
                }
                ctx.stroke(); 
//console.log(`DRAW END ${count}`)
            };

            if (vessels.length && vessels[0].mmsi) {
                let trackId = vessels[0].mmsi.toString();
                if (!_tracksMF[trackId]) {
                    _tracksMF[trackId] = L.canvasOverlay();
                    _tracksMF[trackId].params({ data: vessels, markers: "TYPE" })
                        .drawing(drawingOnCanvas);
                    _tracksAltMF[trackId] = L.canvasOverlay();
                    _tracksAltMF[trackId].params({ data: vessels, markers: "SPEED" })
                        .drawing(drawingOnCanvas);
            
                    let mmsi; 
                    for (let t in _tracks){ 
                        mmsi = t.replace(/_.+/, '')
                        if (mmsi==trackId)
                            break;
                        else
                            mmsi = false;
                    }
                    if (!mmsi){
                        if (!this.needAltLegend)
                            _lmap.addLayer(_tracksMF[trackId]);
                        else
                            _lmap.addLayer(_tracksAltMF[trackId]);
                    }
                    else
                        console.log(mmsi + " hidden")
                }
            }
        },

        ///////////////////////

        
        showTrack: function (vessels, onclick) {
            if (!vessels){               
                let mmsi; 
                for (let t in _tracks){   
                    if (!mmsi){
                        mmsi = t.replace(/_.+/, '')
                        if(_tracksMF[mmsi]){
console.log('add '+mmsi)
                            if (!this.needAltLegend)
                                _lmap.addLayer(_tracksMF[mmsi]);
                            else
                                _lmap.addLayer(_tracksAltMF[mmsi]);
                        }
                    }
                    _lmap.removeLayer(_tracks[t]);
                    _lmap.removeLayer(_tracksAlt[t]);
                    delete _tracks[t];
                    delete _tracksAlt[t];
                }
                return;
            }
           
            if (vessels.length && _tracksMF[vessels[0].mmsi]){
                _lmap.removeLayer(_tracksMF[vessels[0].mmsi]);
                _lmap.removeLayer(_tracksAltMF[vessels[0].mmsi]);
console.log('remove ' + vessels[0].mmsi)
            }
                
            for (let i = 0; i < vessels.length; ++i){
                let trackId = vessels[i].mmsi + '_' + vessels[i].imo + '_' + vessels[i].ts;
                if (vessels[i].positions.length) {
                    if (!_tracks[trackId]) {
                        let next = null;
                        _tracks[trackId] = _addMarkers(vessels[i].positions, next, 'TYPE');
                        _tracksAlt[trackId] = _addMarkers(vessels[i].positions, next, 'SPEED');
//console.log(i, _tracks[trackId])
                        if (_canvas._container) 
                            _canvas._container.style.pointerEvents = 'none';
                            
                        if (!this.needAltLegend)
                            _lmap.addLayer(_tracks[trackId]);
                        else
                            _lmap.addLayer(_tracksAlt[trackId]);
                    }
                }
                else {
                    //if (_tracks[trackId]){
                    _lmap.removeLayer(_tracks[trackId]);
                    _lmap.removeLayer(_tracksAlt[trackId]);
                    delete _tracks[trackId];
                    delete _tracksAlt[trackId];
                    //}
                }
            }
        },

        showTrack2: function (vessels, onclick) {
            if (!vessels){               
                let mmsi; 
                for (let t in _tracks){   
                    if (!mmsi){
                        mmsi = t.replace(/_.+/, '')
                        if(_tracksMF[mmsi]){
console.log('add '+mmsi)
                            if (!this.needAltLegend)
                                _lmap.addLayer(_tracksMF[mmsi]);
                            else
                                _lmap.addLayer(_tracksAltMF[mmsi]);
                        }
                    }
                    _lmap.removeLayer(_tracks[t]);
                    _lmap.removeLayer(_tracksAlt[t]);
                    delete _tracks[t];
                    delete _tracksAlt[t];
                }
                return;
            }
            const drawRotatedImage = function (ctx, image, x, y, angle) { 
                ctx.save(); 
                ctx.translate(x, y);
                ctx.rotate(angle * Math.PI/180.0);
                ctx.drawImage(image, -(image.width/2), -(image.height/2));
                ctx.restore();
                //ctx.drawImage(image, x, y); 
            },
            drawingOnCanvas = function (canvasOverlay, params){
                var ctx = params.canvas.getContext('2d'),
                data = params.options.data;
                if (!data.length)
                    return;
// console.log(data, 
//      params.options.markers);
                ctx.clearRect(0, 0, params.canvas.width, params.canvas.height); 
                ctx.beginPath();
                if (data.length)
                if (params.options.markers == 'SPEED')
                    ctx.strokeStyle = data[0].colorAlt.value;
                else
                    ctx.strokeStyle = data[0].color.value;
                ctx.lineWidth = 2;
                ctx.globalCompositeOperation = 'destination-over';
                let startPt = null, inBuffer = false;
                const getDot = function(x, y){
                        var dot = canvasOverlay._map.latLngToContainerPoint([y, x]);
                        dot.x = dot.x + params.offset; dot.y = dot.y + params.offset;
                        return dot;
                };
                for (var i = 0; i < data.length; i++) {
                    var y = data[i].ymax, x = data[i].xmax<0 ? 360 + data[i].xmax : data[i].xmax;
                    //if (params.bounds.contains([y, x])) {
                    inBuffer = params.buffer.contains([y, x]) ; 
                    if (inBuffer) {
                        let dot = getDot(x, y);
                        drawRotatedImage(ctx, params.options.markers=='SPEED'?data[i].imgAlt:data[i].img, dot.x, dot.y, parseInt(data[i].cog));
                        if (!startPt){
                            startPt = dot;
                            ctx.moveTo(dot.x, dot.y);
                        }
                        else
                            ctx.lineTo(dot.x, dot.y);                    
                    }
                }
//console.log(params.options.lastPos)
                if (inBuffer && params.options.lastPos){
                    let lastPos = params.options.lastPos,
                    y = lastPos.ymax, x = lastPos.xmax<0 ? 360 + lastPos.xmax : lastPos.xmax,
                    dot = getDot(x, y);
                    ctx.lineTo(dot.x, dot.y); 
                }
                ctx.stroke(); 
            };
//console.log(vessels)
            if (vessels.length && _tracksMF[vessels[0].mmsi]){
                _lmap.removeLayer(_tracksMF[vessels[0].mmsi]);
                _lmap.removeLayer(_tracksAltMF[vessels[0].mmsi]);
console.log('remove ' + vessels[0].mmsi)
            }
                
            for (let i = 0; i < vessels.length; ++i){
                let trackId = vessels[i].mmsi + '_' + vessels[i].imo + '_' + vessels[i].ts;
                if (vessels[i].positions.length) {
                    if (!_tracks[trackId]) {
                        _tracks[trackId] = L.canvasOverlay();
                        _tracks[trackId].params({ data: vessels[i].positions, lastPos: vessels[i].lastPos, markers: "TYPE" })
                            .drawing(drawingOnCanvas);
                        _tracksAlt[trackId] = L.canvasOverlay();
                        _tracksAlt[trackId].params({ data: vessels[i].positions, lastPos: vessels[i].lastPos, markers: "SPEED" })
                            .drawing(drawingOnCanvas);
                        if (!this.needAltLegend)
                            _lmap.addLayer(_tracks[trackId]);
                        else
                            _lmap.addLayer(_tracksAlt[trackId]);
                    }
                }
                else {
                    //if (_tracks[trackId]){
                    _lmap.removeLayer(_tracks[trackId]);
                    _lmap.removeLayer(_tracksAlt[trackId]);
                    delete _tracks[trackId];
                    delete _tracksAlt[trackId];
                    //}
                }
            }
        },
        hideVesselsOnMap: function (vessels) {
console.log('hideOnMap', vessels)
            const addLayers = function(mmsi){ // RESTORE PREV HIDDEN
//console.log('hideOnMap', mmsi,trackMmsi)
                    let trackMmsi;
                    for (let k in _tracks){   
                        trackMmsi = k.replace(/_.+/, '');    
                        if (trackMmsi==mmsi)            
                            if (!this.needAltLegend)
                            _lmap.addLayer(_tracks[k]);
                            else
                            _lmap.addLayer(_tracksAlt[k]);
                    }

                    if (trackMmsi!=mmsi){
                        if(_tracksMF[mmsi]) {
                            if (!this.needAltLegend)
                            _lmap.addLayer(_tracksMF[mmsi]);
                            else
                            _lmap.addLayer(_tracksAltMF[mmsi]);
                        }
                    } 
            };

            if (vessels && vessels.length){
                _notDisplayedVessels.forEach(mmsi=>addLayers.call(this, mmsi));
                _notDisplayedVessels = vessels.map(v=>v);
                _notDisplayedVessels.forEach(mmsi=>{
                    if(_tracksMF[mmsi]) {
                        _lmap.removeLayer(_tracksMF[mmsi]);
                        _lmap.removeLayer(_tracksAltMF[mmsi]);
                    }
                    for (let k in _tracks){   
                        let trackMmsi = k.replace(/_.+/, '');    
                        if (trackMmsi==mmsi) {
                        _lmap.removeLayer(_tracks[k]);
                        _lmap.removeLayer(_tracksAlt[k]);
                        }
                    }
                });
            }
            else{
                _notDisplayedVessels.forEach(mmsi=>addLayers.call(this, mmsi));
                _notDisplayedVessels.length = 0;
            }
            _setVesselFilter();
        },
        restoreDefault: function(){                   
            _lmap.addLayer(_screenSearchLayer);
            _lastPointLayerAlt && _lmap.removeLayer(_lastPointLayerAlt); 
        },
        showVesselsOnMap: function (shownVessels, leaveTracks, leaveMfTracks) {  
console.log('showOnMap', shownVessels, leaveTracks, leaveMfTracks)          
            _displayedVessels = shownVessels!="all" ? shownVessels.map(v=>v) : "all"; 
            _setVesselFilter();

            // SHOW ALL TRACKS ON NOT DISPLAY ONLY OR ON LEAVING TAB 
            if (shownVessels == "all") {
                    let mmsi;                
                    for (let k in _tracks) {
                        if (!mmsi)
                            mmsi = k.replace(/_.+/, '');
                        if (!this.needAltLegend)
                            _lmap.addLayer(_tracks[k]);
                        else
                            _lmap.addLayer(_tracksAlt[k]);
                    }
                    for (let k in _tracksMF) {
                        if (!mmsi || k!=mmsi) {
                            if (!this.needAltLegend)
                                _lmap.addLayer(_tracksMF[k]);
                            else
                                _lmap.addLayer(_tracksAltMF[k]);
                        }
                    }
            }
            if (shownVessels != "all") {
                // HIDE OTHER TRACKS ON DISPLAY ONLY OR ON RETURN TO TAB (MY FLEET)
                if (!leaveTracks) {
                        for (let k in _tracks) {
                            let mmsi = k.replace(/_.+/, '');
                            if (shownVessels.indexOf(mmsi)<0){
                                _lmap.removeLayer(_tracks[k]);
                                _lmap.removeLayer(_tracksAlt[k]);
                            }
                        }
                }
                // HIDE OTHER TRACKS ON DISPLAY ONLY OR ON RETURN TO TAB (DBSEARCH)
                if (!leaveMfTracks) {
                        for (let k in _tracksMF) {
                            _lmap.removeLayer(_tracksMF[k]);
                            _lmap.removeLayer(_tracksAltMF[k]);
                        }
                }
            }
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
            _switchLayers(_screenSearchLayer, _lastPointLayerAlt);
            let temp = _screenSearchLayer;
            _screenSearchLayer = _lastPointLayerAlt;
            _lastPointLayerAlt = temp;

            _setVesselFilter();
            _legendSwitched(showAlternative);

//console.log(showAlternative, this.needAltLegend)
            for (let t in _tracks){
                //if (_notDisplayedVessels.indexOf(t)<0)
                if (this.needAltLegend){
                    _lmap.removeLayer(_tracks[t]);
                    _lmap.addLayer(_tracksAlt[t]);
                }
                else{
                    _lmap.addLayer(_tracks[t]);
                    _lmap.removeLayer(_tracksAlt[t]);
                }
            }
            for (let t in _tracksMF){
                if (_notDisplayedVessels.indexOf(t)<0)
                if (this.needAltLegend){
                    _lmap.removeLayer(_tracksMF[t]);
                    _lmap.addLayer(_tracksAltMF[t]);
                }
                else{
                    _lmap.addLayer(_tracksMF[t]);
                    _lmap.removeLayer(_tracksAltMF[t]);
                }
            }
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
    }

    };
}