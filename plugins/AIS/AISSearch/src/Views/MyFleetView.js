require("./MyFleet.css")
const BaseView = require('./BaseView.js');
const GroupList = require('../Controls/GroupList.js');

const _switchLegendIcon = function(showAlternative){
    let ic = this.frame.find('.legend_icon'),
    ica = this.frame.find('.legend_iconalt');
    if (showAlternative){
        ic.hide(); //ica.show();
        ica.each( (i,e)=>e.style.display="");
    }
    else{
        ica.hide(); //ic.show();
        ic.each( (i,e)=>e.style.display="");
    }
},
_clean = function(){  
    this.frame.find('.ais_vessels input[type="checkbox"]').off('click');    
    this.startScreen.css({ visibility: "hidden" });
};

let _tools, 
_displayedOnly=[], 
_notDisplayed=[],
_saveLabelSettingsPromise = Promise.resolve(0);

const MyFleetView = function (model, tools){
    BaseView.apply(this, arguments);
    _tools = tools; 
    _tools.onLegendSwitched(((showAlternative)=>{
        _switchLegendIcon.call(this, _tools.needAltLegend);
    }).bind(this));

    let settings = []; //DEFAULT SETTINGS
    this.frame = $(Handlebars.compile('<div class="ais_view myfleet_view">' +
    '<table class="instruments">'+
    '<tr><td style="vertical-align:top; padding-right:0">'+

    '<div style="width:140px; margin-bottom: 8px;">{{i "AISSearch2.DisplaySection"}}</div>' +

        '<div style="margin-bottom: 5px;"><label class="sync-switch switch groups_vessels"><input type="checkbox">'+
        '<div class="sync-switch-slider switch-slider round"></div></label>' +
        '<span class="sync-switch-slider-description">{{i "AISSearch2.myFleetOnly"}}</span></div>'+  

        '<label class="sync-switch switch all_tracks"><input type="checkbox">'+
        '<div class="sync-switch-slider switch-slider round"></div></label>' +
        '<span class="sync-switch-slider-description" >{{i "AISSearch2.shipsTracks"}}</span>'+ 
            
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
            let th = $('.ais_tabs')[0].getBoundingClientRect().height,
            ih = this.frame.find('.instruments')[0].getBoundingClientRect().height,
            rv = th + ih;
            this.frame.find('.instruments').height(ih);
            return rv;
        }
    });  

    this.container = this.frame.find('.ais_vessels');     
    this.startScreen = this.frame.find('.start_screen');
    
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
    .on('change', (e=>{
        let display = '';
        this.frame.find('.instruments .setting input').each((i, e)=>{
            if (e.checked)
                display += "{{{" + e.id + "}}}";
        });
        if (display=='')
            display = '{{{foo}}}';  
        this.model.markerTemplate =  this.model.markerTemplate.replace(/<td>\{\{\{.+\}\}\}<\/td>/, '<td>' + display + '</td>');
        if (_displayedOnly.length)          
            _tools.showVesselsOnMap(_displayedOnly);
        else
            _tools.showVesselsOnMap("all"); 
            
        _saveLabelSettingsPromise = _saveLabelSettingsPromise.then(((c)=>{return this.model.saveLabelSettings(c);}).bind(this));
    }).bind(this));
  
       
    // tracks controller
    this.frame.find('.instruments .switch.all_tracks input[type="checkbox"]').on("click", 
        function(e){
            if (e.currentTarget.checked) {                  
                this.model.loadTracks();
            }
            else {
                //this.model
            }            
        }.bind(this)
    ); 

    // visibility controller
    this.frame.find('.instruments .switch.groups_vessels input[type="checkbox"]').on("click", 
        function(e){
            _displayedOnly.length = 0;
            if (e.currentTarget.checked) {
                _displayedOnly = this.model.vessels.map(v=>v.mmsi.toString());         
                _tools.showVesselsOnMap(_displayedOnly);
            }
            else
                _tools.showVesselsOnMap("all"); 
//console.log("showVesselsOnMap");            
        }.bind(this)
    ); 

    // group list
    this.groupList = new GroupList(this.frame);
    this.groupList.onRepaintItem = ((i, elm)=>{
        elm.querySelector('input[type=checkbox]').checked = _notDisplayed.indexOf(elm.querySelector('.mmsi').innerText)<0;
    }).bind(this);
    this.groupList.onDeleteGroup = (group=>{
        this.inProgress(true);
        this.model.deleteGroup(group);
    }).bind(this);
    
    this.tableTemplate = this.groupList.toString();
};

MyFleetView.prototype = Object.create(BaseView.prototype);

Object.defineProperty(MyFleetView.prototype, "notDisplayed", {
    get() {
        return _notDisplayed;
    }
});

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
    // MEMBERS ON MAP
    _displayedOnly.length = 0;
    if (!this.model.vessels.length)
        this.frame.find('.instruments .switch.groups_vessels input[type="checkbox"]')[0].checked = false;    
    if (this.frame.find('.instruments .switch.groups_vessels input[type="checkbox"]')[0].checked) {
        _displayedOnly = this.model.vessels.map(v=>v.mmsi.toString());         
        _tools.showVesselsOnMap(_displayedOnly);
    } 
    else         
        _tools.showVesselsOnMap("all");

    _tools.hideVesselsOnMap(_notDisplayed); 
// console.log("showVesselsOnMap");     
// console.log("hideVesselsOnMap");  
    ///////////////// 

    let labelSettings = this.model.markerTemplate.match(/(?!\{\{\{)[^\{\}]+(?=\}\}\})/g),
    labelSettingCtrl;
    for (var i in labelSettings){
        labelSettingCtrl = this.frame.find('.instruments .setting input#' + labelSettings[i])[0];
        if (labelSettingCtrl)
            labelSettingCtrl.checked = true;
    }

    this.groupList.repaint();  
    
    // GROUP LIST EVENTS
    this.groupList.onCheckItem = function(uncheked){
        if (uncheked.length)
            _notDisplayed=uncheked.map(mmsi=>mmsi);
        else
            _notDisplayed.length = 0;
        _tools.hideVesselsOnMap(uncheked);
// console.log("hideVesselsOnMap");
    }
    this.groupList.onChangeGroup = ((mmsi, group)=>{
        let view = this;
        this.inProgress(true);          
        this.model.changeGroup(mmsi, group)
        .then((r)=>{
            view.repaint();
            view.inProgress(false);  
        })
        .catch((err)=>{
            console.log(err)
            view.inProgress(false);   
        });
    }).bind(this);
    this.groupList.onExcludeItem = ((ev, mmsi, i) => {
            ev.stopPropagation();
            let thisView = this;
            let vessel = thisView.model.vessels[i];
            
            thisView.beforeExcludeMember(vessel.mmsi.toString());

            let dlg = $('.ui-dialog:contains("' + vessel.mmsi + '")');
            if (dlg[0]){ 
                dlg.find('.button.addremove').click();
            }
            else{
                thisView.model.changeMembers(vessel).then(function () {
                    thisView.show();
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
    _switchLegendIcon.call(this, _tools.needAltLegend);
};

MyFleetView.prototype.beforeExcludeMember = function (strMmsi) {
    _displayedOnly = _displayedOnly.filter(m => m != strMmsi);
    _notDisplayed = _notDisplayed.filter(m => m != strMmsi);
}

MyFleetView.prototype.hide = function () {
    BaseView.prototype.hide.apply(this, arguments); 
    _tools.showVesselsOnMap("all");
    _tools.hideVesselsOnMap([]);
}

// MyFleetView.prototype.show = function () {
//     BaseView.prototype.show.apply(this, arguments);  
//     _switchLegendIcon.call(this, _tools.needAltLegend);
// }

module.exports = MyFleetView;