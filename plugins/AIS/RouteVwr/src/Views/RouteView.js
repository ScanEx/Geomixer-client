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

const _searchLayer = 'EE5587AF1F70433AA878462272C0274C';

let _thisView, _layer, _selectVessel;

const RouteView = function ({ model, layer }) {
    _thisView = this;
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
        .then(r=>r.json())
        .then((r=>{
//console.log(r)
            if (r.Status && r.Status.toLowerCase()=='ok' && r.Result){
                _selectVessel = r.Result.values.map(v => {return{ mmsi: v[0], name: v[1] }});
                this.vessel = _selectVessel[0];
                this.selectVessel = new SelectControl(this.frame.find('.select_container')[0], _selectVessel.map(l => l.name), 0, selected => { _thisView.trackLayer = _selectVessel[selected] }); 
                this.selectVessel.dropDownList.classList.add('routevwr-view'); 
                this.model.isDirty = true;
                //this.model.update();            
            } 
            else    
                console.log(r);   
        }).bind(this)); 
   
        Object.defineProperty(this, "tableTemplate", {
            get: function () {
                let rv = this.model.data.routes.map((t,i) => {
                        return `<table class="route-table" border="0">
                        <tbody><tr>
                        <td><span>${t.vessel_mmsi}</span></td> 
                        <td><span>${t.vessel_name}</span></td>                      
                        <td><span class="date">${t.calc_etd}</span></td>
                        <td><span class="date">${t.calc_eta}</span></td>
                        </tr></tbody></table>`
                    }).join('') +
                    (this.model.data.msg ? this.model.data.msg.map(m => `<div class="msg">${m.txt}</div>`).join('') : '');               
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
    }, 
    _renderPosTable = function(i){
        let t = _thisView.model.data.routes[i];
            return `<table class="positions-table"><tbody>` +
            t.positions.map((p,j) => { return `<tr>                
            <td><span class="utc_time">${p.utc_time}</span><span class="local_time">${p.local_time}</span></td>
            <td><span class="utc_date">${t.utc_date}</span><span class="local_date">${p.local_date}</span></td>
            <td>${p.lon}&nbsp;&nbsp;${p.lat}</td>
            <td>${p.vicon ? p.vicon.svg : ''}</td><td></td>
            <td><div class="show_pos" id="${i}_${j}" title="${_gtxt('RouteVwr.position')}"><img src="plugins/AIS/AISSearch/svg/center.svg"></div></td>
            </tr>
            <tr><td colspan="6" class="more"><hr><div class="vi_more"></div></td></tr>`;}).join('') + 
            `</tbody></table>`;
    },
    _clean = function () {
        this.frame.find('.open_positions').off('click', _onOpenPosClick);
        this.frame.find('.track-table .track:not(".all") input').off('click', _onShowTrack),
        this.frame.find('.track-table .track.all input').off('click', _onShowAllTracks),
        this.frame.find('.show_pos').off('click', _onShowPos);
        this.frame.find('.track-table .export').off('click', _onExport);
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

const _onOpenPosClick = function(e){
        let icon = $(e.target), id;
        for (var i=0; e.target.classList[i]; ++i){
            if (e.target.classList[i].search(/track_/)!=-1){
                id = e.target.classList[i];
                break;
            }
        }
        if (icon.is('.icon-down-open')) {
            icon.removeClass('icon-down-open').addClass('.icon-right-open');
            if(id){
                let div = $(`.${id}:not(.open_positions)`);
                div.hide();
                if (id!='track_0'){
                    div.find('.show_pos').off('click', _onShowPos);
                    div.html('');
                }
            }
        }
        else {
            icon.addClass('icon-down-open').removeClass('.icon-right-open');
            if (id){
                let div = $(`.${id}:not(.open_positions)`);
                if (!$(`.${id} .positions-table`)[0]){
                    div.html(_renderPosTable(parseInt(id.split('_')[1])));
                    div.find('.show_pos').on('click', _onShowPos);
                }
                div.show(); 
            }                
        }
    }, 
    _onShowAllTracks = function(e){
        let showTrack = _thisView.frame.find('.track-table .track:not(".all") input'),
            showAllTracks = _thisView.frame.find('.track-table .track.all input'); 
        showTrack.each((i, el)=>{
            el.checked = showAllTracks[0].checked;
            if (showAllTracks[0].checked)
                _thisView.model.drawTrack(el.id);
            else
                _thisView.model.eraseTrack(el.id);
        });
    },
    _onShowTrack = function(e){
        let showTrack = _thisView.frame.find('.track-table .track:not(".all") input'),
            showAllTracks = _thisView.frame.find('.track-table .track.all input'); 
        let id = parseInt(e.currentTarget.id);
        if (e.currentTarget.checked)
            _thisView.model.drawTrack(id);
        else
            _thisView.model.eraseTrack(id);

        let checkAll = true;
        showTrack.each((i, el)=>{checkAll = checkAll && el.checked});
        showAllTracks[0].checked = checkAll;
    },
    _onShowPos = function(e){
        let ij = e.currentTarget.id.split('_'), pos = _thisView.model.data.routes[ij[0]].positions[ij[1]];
        //_thisView.model.fitToTrack(ij[0]);
        nsGmx.leafletMap.setView([pos.latitude, pos.longitude]);
    },
    _onExport = function(e){
        let type = e.currentTarget.className.replace(/export */, ''),
        tracks = _thisView.model.data.routes,
        trackLine = tracks.reduce((p,c)=>{
            c.positions.forEach(pos=>p.push([pos.longitude, pos.latitude])); 
            return p;
        }, []),
        features = [{geometry:L.gmxUtil.geometryToGeoJSON({type:'LINESTRING', coordinates:trackLine})}];
        let getFilename = function(){
            let spart = tracks[0].utc_date, //`${s.getFullYear()}_${s.getMonth()+1}_${s.getDate()}`,
            epart = tracks.length>1 ? '_' +  tracks[tracks.length-1].utc_date: ''; //tracks.length>1 ? `_${e.getFullYear()}_${e.getMonth()+1}_${e.getDate()}` : '';
            return `${_thisView.vname}_${spart}${epart}`.replace(/[!\?\:<>"'#]/g, '').replace(/[ \.\/\\-]/g, '_');
        }
        nsGmx.Utils.downloadGeometry(features, {fileName: getFilename(), format: type}); 
//console.log(features, {fileName: `${_thisView.vname}_${tracks[0].utc_date}${tracks.length>1?'_' + tracks[tracks.length-1].utc_date:''}`.replace(/ |\./g, '_'), format: type,});
    };

RouteView.prototype.repaint = function () { 
    _clean.call(this);
    BaseView.prototype.repaint.call(this);      
    
    // this.frame.find('.open_positions').on('click', _onOpenPosClick);
    // this.frame.find('.track-table .track:not(".all") input').on('click', _onShowTrack);
    // this.frame.find('.track-table .track.all input').on('click', _onShowAllTracks);
    // this.frame.find('.track-table .export').on('click', _onExport);

    // this.frame.find('.track_0 .positions-table .show_pos').on('click', _onShowPos);
};

RouteView.prototype.show = function () {
    if (!this.frame)
        return;
    BaseView.prototype.show.apply(this, arguments);
};

module.exports = RouteView;
