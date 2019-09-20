require("./RcView.css");
const RcBaseView = require('./RcBaseView.js');
const Constants= require('../Constants.js');
const RcView = function (model, vid){
    RcBaseView.call(this, model);
    //this.topOffset = 80;
    Object.defineProperty(this, 'topOffset',  { get: function () { 
        return document.querySelector('.rc_instruments').getBoundingClientRect().height;
    }});
    this.frame = document.createElement('div');
    this.frame.className = 'rc_view';
    this.frame.classList.add(vid);
    this.frame.innerHTML = `<div class="rc_all">
    <div><ul class="rc_content"><li><div><div></li></ul></div>    
    </div>`;
    
    this.container = this.frame.querySelector('.rc_all'); 

    this.tableTemplate = '{{#if msg}}<div>{{msg}}</div>{{/if}}' +
        '<ul class="rc_content">{{#each groups}}' + 
        '<li class="rc_layer_group"><ul><div class="rc_group_name">{{name}}</div>' +
        '{{#each layers}}' +
        '<li class="rc_layer"><table id="layer{{id}}"><tr><td class="timeline-icon"></td>' +
        '<td class="visibility"><img src="' + Constants.MODULE_PATH +'img/unchecked.png"><img src="' + Constants.MODULE_PATH +'img/checked.png"></td>' +
        '<td>{{title}}</td></tr><tr><td></td><td></td><td class="rc_layer_desc">{{{description}}}</td></tr></table></li>' +
        '{{/each}}</ul></li>' +
        '{{/each}}</ul>';

    let handler = function (e) {
        let ls = JSON.parse(localStorage.getItem('layerState'));
        if (!ls) ls = {};
        if (!ls[e.layerID]) ls[e.layerID] = {};
        if (!ls[e.layerID].timeline){
            ls[e.layerID].timeline = true;

            let checkTimeline = true,
            layers = this.container.querySelectorAll('table');
            for(var i=0; i<layers.length; ++i){
                let lid = layers[i].id.replace(/^layer/, ''),
//console.log(ls[lid])
                props = nsGmx.gmxMap.layersByID[lid]._gmx && nsGmx.gmxMap.layersByID[lid]._gmx.properties;
                if (props && props.Temporal && (props.IsRasterCatalog || (props.Quicklook && props.Quicklook !== 'null'))) 
                if ((!ls[lid] || !ls[lid].timeline) && layers[i].getBoundingClientRect().width){
                    checkTimeline = false;
                    break;
                }
            }
            /* 
            if (checkTimeline)
                this.instruments.querySelector('.switch input').checked = 1;
            */
        }
        else{
            ls[e.layerID].timeline = false;
            /* 
            if (this.container.querySelector('#layer' + e.layerID).getBoundingClientRect().width)
                this.instruments.querySelector('.switch input').checked = 0;
            */    
        }
        localStorage.setItem('layerState', JSON.stringify(ls));
    }
    nsGmx.timeLineControl.on('layerAdd', handler.bind(this));
    nsGmx.timeLineControl.on('layerRemove', handler.bind(this));
};


RcView.prototype = Object.create(RcBaseView.prototype);

RcView.prototype.inProgress = function (state) {
    if (state){
        this.frame.style.background = 'url(\'img/progress.gif\') center no-repeat';
    }
    else{
        this.frame.style.backgroundImage = 'none';
    }
};

let toggleTimeline = function(layerID, add){
    let tlc = nsGmx.timeLineControl,
        layer = nsGmx.gmxMap.layersByID[layerID];
    if (add) {
        if (!tlc._map) { nsGmx.leafletMap.addControl(tlc); }
        tlc.addLayer(layer);
    } else {
        if (tlc._map)
        tlc.removeLayer(layer);
    }    
}

RcView.prototype.filter = function (n) {
    const groups = this.container.querySelectorAll('.rc_content .rc_layer_group'),
    temp = localStorage.getItem('layerState'),
    layerState = JSON.parse(temp);
    let checkTimeline = true;
    for (let i=0; i < groups.length; ++i){
        let group = groups[i].querySelector('.rc_group_name'),
            groupID = group.innerText,
            layers = groups[i].querySelectorAll('table');
        if (0==n)
            localStorage.removeItem('groupState');            
        if ((i+1)==n)
            localStorage.setItem('groupState', groupID);

        if (n==0 || (i+1)==n){
            groups[i].style.display = 'block';  

            for (let j=0; j<layers.length; ++j){
                let lid = layers[j].id.replace(/^layer/, '');
//console.log(layers[j].id, layerState[lid])
                if (layerState && layerState[lid]){
                    if (layerState[lid].visible)
                        nsGmx.leafletMap.addLayer(nsGmx.gmxMap.layersByID[lid]);
                    if (layerState[lid].timeline)
                        toggleTimeline( lid, true);
                    else
                        checkTimeline = false;
                }
                else{                    
                    let props = nsGmx.gmxMap.layersByID[lid]._gmx && nsGmx.gmxMap.layersByID[lid]._gmx.properties;
                    if (props && props.Temporal && (props.IsRasterCatalog || (props.Quicklook && props.Quicklook !== 'null')))   
                        checkTimeline = false;
                }
            }
        }
        else{
            for (let j=0; j<layers.length; ++j){
                let lid = layers[j].id.replace(/^layer/, '');
                nsGmx.leafletMap.removeLayer(nsGmx.gmxMap.layersByID[lid]);
                toggleTimeline( lid, false);
            }
            groups[i].style.display = 'none';
        }
    }    
    localStorage.setItem('layerState', temp);
    /*
    this.instruments.querySelector('.switch input').checked = groups.length && checkTimeline ? 1 : 0;
    */
};

let last, 
setVisibility = function (e) {
//console.log(e.target.getGmxProperties().name, e.type);
        let lid = e.target.getGmxProperties().name;//e.target.options.layerID;   
        if (last == lid) {
            last = null;
            return;
        }
        last = lid;    
        let ls = JSON.parse(localStorage.getItem('layerState'));
        if (!ls) ls = {};
        if (!ls[lid]) ls[lid] = {};
        let cb = document.querySelectorAll('.rc_view #layer' + lid + ' .visibility img');
//console.log(lid, nsGmx.gmxMap.layersByID[lid], nsGmx.gmxMap.layersByID[lid]._map)
        if (e.type=='add') { //nsGmx.gmxMap.layersByID[lid]._map
            ls[lid].visible = true;
            cb[0].style.display = 'none';
            cb[1].style.display = 'inline';
        }
        else {
            ls[lid].visible = false;
            cb[0].style.display = 'inline';
            cb[1].style.display = 'none';
        }
        localStorage.setItem('layerState', JSON.stringify(ls));
    }

RcView.prototype.repaint = function () {
    RcBaseView.prototype.repaint.apply(this, arguments);

    let nl = this.container.querySelectorAll('.rc_content li table'),
    groupState = localStorage.getItem('groupState');
//console.log(groupState);
    for (let i=0; i<nl.length; ++i){
        let cb = nl[i].querySelectorAll('.visibility img'),
        lid = nl[i].id.replace(/^layer/, '');

        nsGmx.gmxMap.layersByID[lid].on('add', setVisibility.bind(this));
        nsGmx.gmxMap.layersByID[lid].on('remove', setVisibility.bind(this));

        cb[1].style.display = 'none';

        cb[0].addEventListener('click', e=>{
            cb[0].style.display = 'none';
            cb[1].style.display = 'inline';
            nsGmx.leafletMap.addLayer(nsGmx.gmxMap.layersByID[lid]);
        });
        cb[1].addEventListener('click', e=>{
            cb[0].style.display = 'inline';
            cb[1].style.display = 'none';
            nsGmx.leafletMap.removeLayer(nsGmx.gmxMap.layersByID[lid]);
        });
    }

    if (groupState){
        nl = this.container.querySelectorAll('.rc_content .rc_group_name');
        for (let i=0; i<nl.length; ++i)
            if (nl[i].innerText==groupState){
                this.filter(i+1);
                break;
            }
    }
    else
        this.filter(0);

};

module.exports = RcView;