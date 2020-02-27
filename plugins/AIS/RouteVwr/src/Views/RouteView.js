require("./RouteView.css");
require("../SelectControl.css");
const BaseView = require('./BaseView.js'),
      Request = require('../Request'),
      SelectControl = require('../SelectControl');

const _toDd = function (D, isLng) {
    let dir = D < 0 ? isLng ? 'W' : 'S' : isLng ? 'E' : 'N',
        deg = Math.round((D < 0 ? D = -D : D) * 1000000) / 1000000
    return deg.toFixed(2) + " "//"°"
        + dir
};

const RouteView = function ({ model, layer }) {
    const lmap = nsGmx.leafletMap;
    let thisView = this, vesselList;

    BaseView.call(this, model);

    this.frame = $(Handlebars.compile(`<div class="routevwr-view">
            <div class="header">
                <table border=0 class="instruments unselectable">
                    <tr>
                        <td class="select_container"></td>
                    </tr>
                </table> 

 
            </div> 
            <div class="refresh" style="display: none; padding-top: 100%;padding-left: 50%;"><img src="img/progress.gif"></div>
            <div class="grid"></div>
            <div class="footer unselectable">
       
            </div>
            </div>`
    )());

    this.container = this.frame.find('.grid');
    this.footer = this.frame.find('.footer');  
        
    Request.fetchRequest(
        '/VectorLayer/Search.ashx',
        'layer=910325DE5E544C6A87F1CFB3DE13BCF5&orderby=vessel_name&columns=[{"Value":"vessel_mmsi"},{"Value":"vessel_name"}]&groupby=[{"Value":"vessel_mmsi"},{"Value":"vessel_name"}]',
        'POST'
    )
        .then(r => r.json())
        .then((r => {
//console.log(r)
            if (r.Status && r.Status.toLowerCase() == 'ok' && r.Result) {
                vesselList = r.Result.values.map(v => { return { mmsi: v[0], name: v[1] } });
                this.vessel = vesselList[0];
                this.selectVessel = new SelectControl(this.frame.find('.select_container')[0], vesselList.map(l => l.name), 0,
                    selected => {
                        thisView.route = null;
                        if (routeLine)
                            lmap.removeLayer(routeLine);
                        if (routeNodes.length) {
                            routeNodes.forEach(n => lmap.removeLayer(n));
                            routeNodes.length = 0;
                        }

                        thisView.vessel = vesselList[selected];
                        thisView.model.isDirty = true;
                        thisView.model.update();
                    });
                this.selectVessel.dropDownList.classList.add('routevwr-view');
                this.model.isDirty = true;
                //this.model.update();            
            }
            else
                console.log(r);
        }).bind(this)); 
   
        Object.defineProperty(this, "tableTemplate", {
            get: function () {
                let rv = 
                `<table class="route-table" border="0">
                <tbody><tr>
                <th>voyage_no</th> 
                <th>route_name</th>                     
                <th>calc_etd</span></th>
                <th>calc_eta</span></th>
                </tr>` + 
                this.model.data.routes.map((t,i) => {
                        return `<tr id="${i}">
                        <td><span>${t.voyage_no}</span></td>   
                        <td><span>${t.route_name}</span></td>                    
                        <td><span class="date">${t.calc_etd}</span></td>
                        <td><span class="date">${t.calc_eta}</span></td>
                        </tr>`
                    }).join('') +
                    (this.model.data.msg ? this.model.data.msg.map(m => `<div class="msg">${m.txt}</div>`).join('') : '');   
                rv += `</tbody></table>`;            
                return rv;
            }
        });  

        Object.defineProperty(this, "topOffset", {
            get: function () { 
                return this.frame.find('.header')[0].getBoundingClientRect().height;
            }
        });  
        Object.defineProperty(this, "bottomOffset", {
            get: function () {             
                return this.frame.find('.footer')[0].getBoundingClientRect().height;
            }
        }); 

        let routeLine, routeNodes = [];
        this.route = null;
        const drawMarkers = function(){
            if (!this.route)
                return;
//console.log(this.route);               

            if (routeNodes.length) {
                routeNodes.forEach(n => lmap.removeLayer(n));
                routeNodes.length = 0;
            }

            this.route.wkb_geometry.coordinates.forEach(c=>{
                    let nw = lmap.layerPointToLatLng(lmap.latLngToLayerPoint([c[1], c[0]]).subtract([5, 5]));
                        se = lmap.layerPointToLatLng(lmap.latLngToLayerPoint([c[1], c[0]]).add([4, 4]));
                    let m = L.rectangle([nw, se], {color: "red", weight: 1}).addTo(lmap)
                    routeNodes.push(m);                   
            });  
        }
        nsGmx.leafletMap.on('zoomend', drawMarkers.bind(this))

        this.handleEvent = function(e) {
            switch(e.type) {
              case 'click':  
                let i = parseInt(e.currentTarget.parentElement.id);

                if (routeLine)
                    lmap.removeLayer(routeLine);

                this.route = this.model.data.routes[i];
                let distance = 0,
                    route = this.route,
                    prev,
                    coords = this.route.wkb_geometry.coordinates.map(c=>{
                        if (prev)
                            distance += lmap.distance(prev, [c[1], c[0]]);
                        prev = [c[1], c[0]];
                        return [c[1], c[0]];
                    });
                routeLine = L.polyline(coords, {color: 'red', weight: 2}).addTo(lmap); 
                routeLine.bindPopup(Object.keys(route).map(k=>{
                    return k!='wkb_geometry' && k!='id' ? `<b>${k}:</b> ${route[k]!=null ? route[k] : ''}` : '';                    
                }).join('<br>') + `<br><b>${_gtxt('RouteVwr.dist')}</b> ${Math.round(distance/1000)} ${_gtxt('RouteVwr.km')}`); 
                
                drawMarkers.call(this);

                break;
            }
        };
    },
  
    _clean = function () {
//console.log(this)
        let inst = this;
        this.frame.find('.route-table tr').each((i, e)=>e.removeEventListener('click', inst, false));   
    };

RouteView.prototype = Object.create(BaseView.prototype);

RouteView.prototype.inProgress = function (state) {
    let progress = this.frame.find('div.refresh'), grid = this.frame.find('div.grid');
    if (state){
        grid.hide();
        progress.show();
    }
    else{
        progress.hide();
        grid.show();
    }
};

// RouteView.prototype.resize = function () { 
//     let h = $('.iconSidebarControl-pane').height() - this.frame.find('.instruments').outerHeight()
//     - this.frame.find('.results').outerHeight() - this.frame.find('.menu').outerHeight();
//     this.container.height(h+1);
// };


RouteView.prototype.repaint = function () { 
    _clean.call(this);
    BaseView.prototype.repaint.call(this);  
    let inst = this;
    this.frame.find('.route-table td').each((i, e)=>e.addEventListener('click', inst, false));  
};

RouteView.prototype.show = function () {
    if (!this.frame)
        return;
    BaseView.prototype.show.apply(this, arguments);
};

module.exports = RouteView;
