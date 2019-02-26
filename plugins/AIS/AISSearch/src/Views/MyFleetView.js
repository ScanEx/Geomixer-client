require("./MyFleet.css")
const BaseView = require('./BaseView.js');
const GroupList = require('../Controls/GroupList.js');

const _switchLegendIcon = function(showAlternative){
    let ic = this.frame.find('.legend_icon'),
    ica = this.frame.find('.legend_iconalt');
    if (showAlternative){
        ic.hide(); ica.show();
    }
    else{
        ica.hide(); ic.show();
    }
},
_clean = function(){  
    this.frame.find('.ais_vessels input[type="checkbox"]').off('click');    
    this.startScreen.css({ visibility: "hidden" });
};

let _tools;
const MyFleetView = function (model, tools){
    _tools = tools;
    BaseView.call(this, model);
    let settings = []; //DEFAULT SETTINGS
    this.frame = $(Handlebars.compile('<div class="ais_view myfleet_view">' +
    '<table class="instruments">'+
    '<tr><td style="vertical-align:top; padding-right:0">'+
    '<div style="width:140px; margin-bottom: 8px;">{{i "AISSearch2.DisplaySection"}}</div>' +
    '<label class="sync-switch switch"><input type="checkbox">'+
    '<div class="sync-switch-slider switch-slider round"></div></label>' +
    '<span class="sync-switch-slider-description">{{i "AISSearch2.myFleetOnly"}}</span>'+    
    '</td>' +
    '<td style="padding-right:0">' +
    '<div style="width:120px;float:left;" class="setting"><label><input type="checkbox" id="group_name" ' + (settings.indexOf('group_name')<0?'':'checked') + '>{{i "AISSearch2.DisplayGroupName"}}</div>' +
    '<div style="width:120px;float:left;" class="setting"><label><input type="checkbox" id="vessel_name" ' + (settings.indexOf('vessel_name')<0?'':'checked') + '>{{i "AISSearch2.DisplayVesselName"}}</label></div>' +
    '<div style="width:70px;float:left;" class="setting"><label><input type="checkbox" id="sog" ' + (settings.indexOf('sog')<0?'':'checked') + '>{{i "AISSearch2.DisplaySog"}}</label></div>' +
    '<div style="width:45px;float:left;" class="setting"><label><input type="checkbox" id="cog" ' + (settings.indexOf('cog')<0?'':'checked') + '>{{i "AISSearch2.DisplayCog"}}</label></div>' +
    '</td>' +
    '<td><div class="refresh"><div>' + this.gifLoader + '</div></div></td></tr>' +

    '<tr><td colspan="3" style="padding-top:0">' +
    '<table><tr><td>{{i "AISSearch2.NewGroup"}}</td>' +
    '<td><div class="newgroupname"><input type="text" placeholder="{{i "AISSearch2.NewGroupName"}}"/></div></td>' +
    '<td><img class="create clicable" title="{{i "AISSearch2.CreateGroup"}}" src="plugins/AIS/AISSearch/svg/add.svg"></td>' +
    '</tr></table>' +
    '</td></tr>' +
    '</table>'+ 

    '<div class="ais_vessels">'+
    '<table class="results">'+
    '<td><input type="checkbox" checked></td>' +
    '<td class="count"></td></tr></table>'+
    '<div class="ais_vessel">' +
    '<table border=0><tr>' +
    '<td><input type="checkbox" checked></td>' +
    '<td><div class="position">vessel_name</div><div>mmsi: mmsi imo: imo</div></td>' +
    '<td></td>' +  
    '<td><span class="date">ts_pos_utc</span></td>'+
    //'<td><div class="info" vessel="aisjson this" title="i AISSearch2.info">' +
    //'<img src="plugins/AIS/AISSearch/svg/info.svg"><div></td>' +
    '</tr></table>' +
    '</div>' +      
    '</div>' +

    '<table class="start_screen"><tr><td>' +
    '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">' +
    '<div>{{{i "AISSearh2.myfleet_view"}}}' +
    '</div></td></tr></table>' +

    '</div>')());    

    Object.defineProperty(this, "topOffset", {
        get: function () {
            let rv = $('.ais_tabs')[0].getBoundingClientRect().height + 
            this.frame.find('.instruments')[0].getBoundingClientRect().height;
            return rv;
        }
    });  

    this.container = this.frame.find('.ais_vessels');     
    this.startScreen = this.frame.find('.start_screen');
    // DEFAULT SETTINGS
    this.model.markerTemplate =  '<div><table><tr>' +
        '<td style="vertical-align:top">' +
        //'<svg width="12" height="11" fill="#00f" style="{{marker_style}}" viewBox="0 0 260 245"><use xlink:href="#mf_label_icon"/></svg>' +
        '{{{marker}}}' +
        '</td><td>{{{foo}}}</td></tr></table></div>'; 
    
    // craete group controller
    let newGroupNameValid = function(ngn){
        let isValid = ngn.search(/\S/)!=-1;
        this.model.data.groups.forEach(g=>{
            if (isValid)
                isValid = g.title!=ngn;
        });
        return isValid;
    },
    createGroup = function(ngn){
        if (newGroupNameValid.call(this, ngn)){
            this.inProgress(true);
            this.model.createGroup(ngn)
            .then((group)=>{
                this.groupList.appendGroup(group, this.model.data.groups.length-1);
                this.inProgress(false);
            },
            (error)=>{
                this.inProgress(false);
                console.log(error)
            }
            );
        }        
    };
    this.frame.find('.instruments .create').on("click", (e=>{
        let input = this.frame.find('.instruments .newgroupname input'),
        ngn = input.val();
        input.val('');
        createGroup.call(this, ngn);
    }).bind(this))
    this.frame.find('.instruments .newgroupname input').on("keyup", (e=>{
        let ngn = e.target.value;
        if (e.keyCode==13){
            e.target.value = '';
            createGroup.call(this, ngn);
        }
    }).bind(this)); 

    // marker settings
    this.frame.find('.instruments .setting input')
    .on('change', e=>{
        let display = '';
        this.frame.find('.instruments .setting input').each((i, e)=>{
            if (e.checked)
                display += "{{{" + e.id + "}}}";
        });
        if (display=='')
            display = '{{{foo}}}';  
        this.model.markerTemplate =  this.model.markerTemplate.replace(/<td>\{\{\{.+\}\}\}<\/td>/, '<td>' + display + '</td>');
        this.model.drawMarkers();
    })
    
    // visibility controller
    this.frame.find('.instruments .switch input[type="checkbox"]').on("click", this.model.showOnlyMyfleet); 

    // group list
    this.groupList = new GroupList(this.frame);
    this.groupList.onRepaintItem = ((i, elm)=>{
        elm.querySelector('input[type=checkbox]').checked = this.model.isMemberShown(elm.querySelector('.mmsi').innerText);
    }).bind(this);
    this.groupList.onDeleteGroup = (group=>{
        this.inProgress(true);
        this.model.deleteGroup(group);
    }).bind(this);
    
    this.tableTemplate = this.groupList.toString();
    _tools.onLegendSwitched(((showAlternative)=>{
        this.needAltLegend = showAlternative;
        _switchLegendIcon.call(this, this.needAltLegend);
    }).bind(this));
};

MyFleetView.prototype = Object.create(BaseView.prototype);

MyFleetView.prototype.inProgress = function (state) {
    let progress = this.frame.find('.refresh div');
    if (state)
        progress.show();
    else
        progress.hide();
};

MyFleetView.prototype.repaint = function () {
    _clean.call(this);  
    BaseView.prototype.repaint.apply(this, arguments);

    let onlyMyfleet = this.model.showOnlyMyFleet();
    this.frame.find('.instruments .switch input[type="checkbox"]')[0].checked = onlyMyfleet;

    this.groupList.repaint();   
    this.groupList.onCheckItem = this.model.showMembers;
    this.groupList.onChangeGroup = ((mmsi, group)=>{
        let view = this;
        this.inProgress(true);          
        this.model.changeGroup(mmsi, group)
        .then((r)=>{
            view.repaint();
            view.inProgress(false); 
            view.model.drawMarkers();  
        })
        .catch((err)=>{
            console.log(err)
            view.inProgress(false);   
        });
    }).bind(this);
    this.groupList.onExcludeItem = ((ev, mmsi, i) => {
            ev.stopPropagation();
            let view = this;
            let vessel = view.model.vessels[i];
            view.prepare(vessel.mmsi.toString());
            let dlg = $('.ui-dialog:contains("' + vessel.mmsi + '")');
            if (dlg[0]){ 
                dlg.find('.button.addremove').click();
            }
            else{
                view.model.change(vessel).then(function () {
                    view.show();
                })
            }        
    }).bind(this);    
    this.groupList.onGroupMenuShow = ((group)=>{
        let i = parseInt(group.replace(/gr/, ''), 10);
        return {
            marker_style:parseInt(this.model.data.groups[i].marker_style.replace(/#/, ''), 16),
            label_color:parseInt(this.model.data.groups[i].label_color.replace(/#/, ''), 16),
            label_shadow:parseInt(this.model.data.groups[i].label_shadow.color.replace(/#/, ''), 16)
        };
    }).bind(this);
    this.groupList.onChangeGroupStyle = ((group, colors)=>{
        let i = parseInt(group.replace(/gr/, ''), 10);
        this.model.changeGroupStyle(i, colors);
    }).bind(this);
    this.groupList.onSaveGroupStyle = this.model.saveGroupStyle;
    _switchLegendIcon.call(this, this.needAltLegend);
};

MyFleetView.prototype.prepare = function (mmsi) {
    if (this.isActive){
       this.model.freeMember(mmsi);
    }
}

MyFleetView.prototype.hide = function () {
    this.model.showNotOnlyMyfleet();
    BaseView.prototype.hide.apply(this, arguments);
}
// MyFleetView.prototype.show = function () {
//     BaseView.prototype.show.apply(this, arguments); 
// }
module.exports = MyFleetView;