const Request = require('../../../Common/Request');

//////////////////////////

const _defaultViconColor = '#999',
    _getUnderWayIcon = function (cog, sog, type_color, group_style) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(${ (!cog ? 0 : cog)}deg)"><title>sog: ${sog}${_gtxt('TrackExport.kn')} cog: ${cog}°</title><path style="fill:${ type_color};" d="M13.8,20.07a1,1,0,0,1-.69-0.28l-1.79-1.72a0.72,0.72,0,0,0-1,0L8.52,19.79a1,1,0,0,1-.69.28,1,1,0,0,1-1-1V8.65c0-1.52,1.55-7.59,4-7.59s4,6.07,4,7.59V19a1,1,0,0,1-1,1h0Z"/><path style="fill:${ group_style};" d="M10.82,1.57c1.93,0,3.5,5.57,3.5,7.09V19a0.52,0.52,0,0,1-.51.53,0.49,0.49,0,0,1-.34-0.14l-1.79-1.72a1.22,1.22,0,0,0-1.71,0L8.17,19.42a0.49,0.49,0,0,1-.34.14A0.52,0.52,0,0,1,7.32,19V8.65c0-1.51,1.57-7.09,3.5-7.09h0m0-1c-3,0-4.5,6.72-4.5,8.09V19a1.52,1.52,0,0,0,1.51,1.53,1.49,1.49,0,0,0,1-.42l1.79-1.72a0.22,0.22,0,0,1,.32,0l1.79,1.72a1.49,1.49,0,0,0,1,.42A1.52,1.52,0,0,0,15.32,19V8.65c0-1.37-1.51-8.09-4.5-8.09h0Z"/><ellipse style="fill:#fff;" cx="10.82" cy="10.54" rx="1.31" ry="1.35"/><path style="fill:#fff;" d="M10.73,3.34h0.12a0.35,0.35,0,0,1,.35.35v6.85a0,0,0,0,1,0,0H10.38a0,0,0,0,1,0,0V3.69A0.35,0.35,0,0,1,10.73,3.34Z"/></svg>`;
    },
    _getAtAnchorIcon = function (cog, sog, type_color, group_style) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(${ (!cog ? 0 : cog)}deg)"><title>sog: ${sog}${_gtxt('TrackExport.kn')} cog: ${cog}°</title><rect style="fill:${ type_color};stroke:${ group_style};stroke-miterlimit:10;" x="5.9" y="5.6" width="9.19" height="9.19" rx="2" ry="2" transform="translate(-4.13 10.41) rotate(-45)"/><circle style="fill:#fff;" cx="10.5" cy="10.19" r="1.5"/></svg>`;
    },

    _vicons = [], _viconsDict = {},
    _styleLayer = '-EE5587AF1F70433AA878462272C0274C',
    _getVicons = function () {
        if (!_styleLayer || !nsGmx.gmxMap.layersByID[_styleLayer])
            return;
        nsGmx.gmxMap.layersByID[_styleLayer]._gmx.properties.gmxStyles.styles.forEach(s => {
        let icon = {
            "filter": s.Filter, 
            "url": s.RenderStyle.iconUrl.replace(/^https?:/, "")
                .replace(/^\/\/kosmosnimki.ru/, "//www.kosmosnimki.ru"), "name": s.Name
        };
        _vicons.push(icon);
        _viconsDict[icon.filter] = icon;
    });
// console.log(_icons);
// console.log(_iconsDict);
},
_getViconSvgPromise = function (ic) {
    return new Promise(resolve => {
        let httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function () {
            if (httpRequest.readyState === 4) {
                ic["svg"] = httpRequest.responseText;
                let a = /\.cls-1{fill:(#[^};]+)/.exec(ic.svg);
                ic.color = _defaultViconColor;
                if (a && a.length)
                    ic.color = a[1];
                resolve();
            }
        }
        httpRequest.open("GET", document.location.protocol + ic.url.replace(/^https?:/, ""));
        httpRequest.send();
    })
},
_getVicon = function(vessel_type, cog, sog){ 
    for(let f in _viconsDict){
        let re1 = new RegExp("'"+vessel_type+"'"),
        re2 = new RegExp(sog != 0 ? ">0" : "=0");
//console.log(vessel_type+" "+sog+" "+f+" "+f.search(re1)+" "+f.search(re2))
        if(f.search(re1)!=-1 && f.search(re2)!=-1){
            return {color: _viconsDict[f].color, svg:(sog != 0 ? _getUnderWayIcon(cog, sog, _viconsDict[f].color, '#fff') : _getAtAnchorIcon(cog, sog, _viconsDict[f].color, '#fff'))};
        }
    }
    return {color: '#f00', svg:(sog != 0 ? _getUnderWayIcon(cog, sog, _defaultViconColor, '#fff') : _getAtAnchorIcon(cog, sog, _defaultViconColor, sog, '#fff'))};
};
let _loadViconPromise;

//////////////////////////

module.exports = function (options) {

    const _lmap = nsGmx.leafletMap,
        _tracks = [], _vmarkers = [];
       
    _getVicons();
    _loadViconPromise = Promise.all(_vicons.map(_getViconSvgPromise));

    const _data = {tracks:[], msg:[]};        
    const _layerName = options.layer;

    return {
        isDirty: false,
        get data() { return _data },
        set data(value) { _data = value; },
        free: function(){
            _data.total = null;
            _data.tracks.length = 0;
            _data.msg.length = 0;
            _tracks.forEach(t=>{
                _lmap.removeLayer(t);
            });
            _tracks.length = 0;
            _vmarkers.length = 0; 
        },
        fitToTrack: function(i){
            _lmap.fitBounds(_tracks[i].getBounds());
        },
        drawTrack: function(i){
            _tracks[i].addTo(_lmap);         
        },
        eraseTrack: function(i){
            _lmap.removeLayer(_tracks[i]);         
        },
        update: function () {

            if (!this.isDirty)
                return;

            const thisModel = this;
            return Promise.resolve().then(()=>{
                    thisModel.free();                       
                    return Request.searchRequest({
                        layer: thisModel.view.trackLayer.id,
                        orderdirection: 'desc',
                        orderby: thisModel.view.trackLayer.sort,
                        columns: thisModel.view.trackLayer.columns,
                        query: thisModel.view.trackLayer.query
                    }, 'POST').then(r=>{
                        return _loadViconPromise.then(()=>{
//console.log(r)
                        if (!r.values.length){
                            _data.msg = [{txt:_gtxt('TrackExport.nodata')}];
                        }
                        else{
                            _data.total = r.values.length;
                            r.values.forEach(p=>{
                                let data = thisModel.view.trackLayer.parseData(r.fields, p, _getVicon),
                                    lastTrack = _data.tracks[_data.tracks.length-1];
                                if (!lastTrack || lastTrack.positions[0].utc_date!=data.utc_date){
                                    lastTrack = { utc_date: data.utc_date, positions: [] };
                                    _data.tracks.push(lastTrack);
                                }
                                lastTrack.positions.push(data);
                            });
                        }
                        });
                    });
            }).then(()=>{    
                
                // draw track on map
                if (_data.tracks.length){
                    let lastPos, wholeDistance = 0;
                    thisModel.view.repaint();
                    _data.tracks.forEach(t=>{
                        t.distance = 0;
                        let temp, latlngs = t.positions.map(p=>{
                            if (temp)
                                t.distance = t.distance + _lmap.distance(temp, [p.latitude, p.longitude]);
                            temp = [p.latitude, p.longitude];
                            return temp;
                        });
                        if (lastPos){
                            t.distance = t.distance + _lmap.distance(lastPos, latlngs[0]);
                            latlngs = [lastPos].concat(latlngs);
                        }
                        lastPos = temp;  
                        let line = L.polyline(latlngs, {color: t.positions[0] && t.positions[0].vicon ? t.positions[0].vicon.color : 'red'}).addTo(_lmap); 
                        line.bindPopup(`<b>${thisModel.view.vname}</b><br>${t.utc_date}<br>${(t.distance/1000).toFixed(3)} ${_gtxt('TrackExport.km')}`);                    
                        _tracks.push(line);
                        
                        wholeDistance = wholeDistance + t.distance;
                    });
                    
                    _lmap.fitBounds(_tracks[0].getBounds());
                }
  
                thisModel.isDirty = false;
            });

        } // this.update
    };
}