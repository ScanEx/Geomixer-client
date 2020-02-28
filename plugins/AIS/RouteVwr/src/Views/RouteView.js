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
        
    this.vesselListPromise = Request.fetchRequest(
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
       
            }
            else
                console.log(r);

//console.log('LIST DONE')          
        this.model.isDirty = true;      
        return Promise.resolve();

    }).bind(this)); 

    Object.defineProperty(this, "tableTemplate", {
        get: function () {
            let rv =
                `<table class="route-table" border="0">
                <tbody><tr>
                <th></th>
                <th>${_gtxt('RouteVwr.route_name')}</th>                     
                <th>${_gtxt('RouteVwr.calc_etd')}</th>
                <th>${_gtxt('RouteVwr.calc_eta')}</th>
                </tr>` +
                this.model.data.routes.map((t, i) => {
                    return `<tr id="${i}">                    
                        <td><svg class="position-icon" style="width: 14px;height: 14px;margin-left:5px;"><use xlink:href="#routevwr_icons_position-icon"></use></svg></td> 
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
    const drawMarkers = function () {
        if (!this.route || !this.route.markers)
            return;
        //console.log(this.route);  

        if (routeNodes.length) {
            routeNodes.forEach(n => lmap.removeLayer(n));
            routeNodes.length = 0;
        }

        this.route.markers.forEach(m => {
            let nw = lmap.layerPointToLatLng(lmap.latLngToLayerPoint([m.lat, m.lon]).subtract([5, 5]));
            se = lmap.layerPointToLatLng(lmap.latLngToLayerPoint([m.lat, m.lon]).add([4, 4]));
            let marker = L.rectangle([nw, se], { color: "red", weight: 1 }).addTo(lmap);
            marker.bindPopup(Object.keys(m).map(k => {
                return k != 'wkb_geometry' && k != 'id' ? `<b>${k}:</b> ${m[k] != null ? m[k] : ''}` : '';
            }).join('<br>'));
            routeNodes.push(marker);
        });
    }
    nsGmx.leafletMap.on('zoomend', drawMarkers.bind(this))

    this.handleEvent = function (e) {
        switch (e.type) {
            case 'click':

                let tr = e.currentTarget.parentElement,
                    i = parseInt(tr.id);

                if (tr.className.search(/\bactive\b/)!=-1 && e.currentTarget.querySelector('svg.position-icon') && routeLine){
                    lmap.fitBounds(routeLine.getBounds());
                    return;
                }

                if (routeLine)
                    lmap.removeLayer(routeLine);

                if (tr.className.search(/\bactive\b/)!=-1){
                    tr.className = tr.className.replace(/ active/, '');
                    if (routeNodes.length) {
                        routeNodes.forEach(n => lmap.removeLayer(n));
                        routeNodes.length = 0;
                    }
                    return;
                }
                else{
                    let siblings = tr.parentElement.children;
                    for (let j=0; j<siblings.length; ++j)
                        siblings[j].className = siblings[j].className.replace(/ active/, '');
                    tr.className += ' active';
                }

                this.route = this.model.data.routes[i];
                let distance = 0,
                    route = this.route,
                    prev,
                    coords = this.route.wkb_geometry.coordinates.map(c => {
                        if (prev)
                            distance += lmap.distance(prev, [c[1], c[0]]);
                        prev = [c[1], c[0]];
                        return [c[1], c[0]];
                    });
                routeLine = L.polyline(coords, { color: 'red', weight: 2 }).addTo(lmap);
                lmap.fitBounds(routeLine.getBounds());

                let popup = [];
                Object.keys(route).forEach(k => {
                    if (k != 'wkb_geometry' && k != 'id' && k != 'markers')
                        popup.push(`<b>${k}:</b> ${route[k] != null ? route[k] : ''}`);
                })
                routeLine.bindPopup(popup.join('<br>') + `<br><br><b>${_gtxt('RouteVwr.dist')}</b> ${Math.round(distance / 1000)} ${_gtxt('RouteVwr.km')}`);

                drawMarkers.call(this);

                break;
        }
    };
},
_clean = function () {
//console.log(this)
    let inst = this;
    this.frame.find('.route-table tr').each((i, e) => e.removeEventListener('click', inst, false));
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
    let thisView = this;
    this.vesselListPromise.then(r=>
        BaseView.prototype.show.apply(thisView, arguments)
    );
};

module.exports = RouteView;
