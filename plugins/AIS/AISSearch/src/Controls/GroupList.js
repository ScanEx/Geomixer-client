const GroupWidget = require('./GroupWidget.js');

let _onRepaintItemHandler,
_onCheckItem,
_onExcludeItem,
_onChangeGroup,
_onDeleteGroup,
_onGroupMenuShow,
_onChangeGroupStyle,
_rolledupGroups = {},
_cp1, _cp2, _cp3,
_getFiltered = function(){
    let filtered = [];
    let group = this.frame.find('.mf_group'), selectAll, selectOne;
    for (let i = 0; i < group.length; i++){
        selectAll = group.eq(i).find('.results input[type="checkbox"]');
        selectOne = group.eq(i).find('.ais_vessel input[type="checkbox"]');
        selectAll[0].checked = true;
        for (let j = 0; j < selectOne.length; j++)
            if (!selectOne[j].checked) {
                filtered.push(selectOne[j].closest('.ais_vessel').querySelector('.mmsi').innerText);
                selectAll[0].checked = false;
            }
    }
    return filtered;
},
_setCheckBoxes = function(){
    this.frame.find('.ais_vessel').each(_onRepaintItemHandler);            
    this.frame.find('.results input[type="checkbox"]')
    .each((i,e)=>{
        let check = true; 
        e.closest('.mf_group').querySelectorAll('input').forEach((e,i)=>check = check && e.checked); 
        e.checked = check;
    });
},
_setGroupCommands = function(){
    this.frame.find('.results input[type="checkbox"]').off("click").on("click", ((e)=>{
        let group = $(e.target).closest('.mf_group');
        group.find('.ais_vessel input[type="checkbox"]').each((i, elm)=>{
            elm.checked = e.target.checked;
        }) 
        let filtered = _getFiltered.call(this);
        _onCheckItem(filtered);
    }).bind(this)); 
           
    this.frame.find('.results').off("contextmenu").on("contextmenu", (e=>{  
        e.preventDefault();
        let values= e.currentTarget.classList.values(), 
        cssClass, group;
        while (!cssClass || !cssClass.done){
            cssClass = values.next(); 
            group = cssClass.value;
            if (group && group.search(/^gr\d/)==0)
                break;
        }
//console.log("group "+group);
        // if(!e.currentTarget.querySelector(".delete"))
        //     return; 
        let ctxMenu = this.contextMenu,//$('.mf_group_menu'),
        evnt = e;
        if (_cp1)
            _cp1.remove();
        if (_cp2)
            _cp2.remove();   
        if (_cp3)
            _cp3.remove();           
        ctxMenu.html('');
        let colorChangeHandler = function(c, cs){
            //console.log(c); 
            //console.log(cs);
            _groupStyleChanged = true;
            
            cs.style.backgroundColor = "#" + c;
            let c1 = cp1.style.backgroundColor,
            c2 = cp2.style.backgroundColor,
            c3 = cp3.style.backgroundColor
            _onChangeGroupStyle(group, {
                marker_style: c1.substr(0,3)=="rgb" ? nsGmx.Utils.rgb2hex(c1) : c1,
                label_color: c2.substr(0,3)=="rgb" ? nsGmx.Utils.rgb2hex(c2) : c2,
                label_shadow: c3.substr(0,3)=="rgb" ? nsGmx.Utils.rgb2hex(c3) : c3 
            })
        },
        colors = _onGroupMenuShow(group),
        cp1 = nsGmx.Controls.createColorPicker(colors.marker_style, ()=>{}, ()=>{}, (c1, c2, c3)=>{colorChangeHandler(c2, cp1)}),
        cp2 = nsGmx.Controls.createColorPicker(colors.label_color, ()=>{}, ()=>{}, (c1, c2, c3)=>{colorChangeHandler(c2, cp2)}),
        cp3 = nsGmx.Controls.createColorPicker(colors.label_shadow, ()=>{}, ()=>{}, (c1, c2, c3)=>{colorChangeHandler(c2, cp3)});
        _cp1 = document.querySelector("#"+$(cp1).data('colorpickerId'));
        _cp2 = document.querySelector("#"+$(cp2).data('colorpickerId'));
        _cp3 = document.querySelector("#"+$(cp3).data('colorpickerId'));
        $(_cp1).on('mouseleave', (e)=>{if(!e.relatedTarget || !e.relatedTarget.closest('.mf_group_menu')) _hideContextMenu.call(this, e); $(cp1).ColorPickerHide()});
        $(_cp2).on('mouseleave', (e)=>{if(!e.relatedTarget || !e.relatedTarget.closest('.mf_group_menu')) _hideContextMenu.call(this, e); $(cp2).ColorPickerHide()});
        $(_cp3).on('mouseleave', (e)=>{if(!e.relatedTarget || !e.relatedTarget.closest('.mf_group_menu')) _hideContextMenu.call(this, e); $(cp3).ColorPickerHide()});
        cp1.title = "";
        cp2.title = "";
        cp3.title = "";
        let div = $('<div class="command marker_color"></div>');         
        ctxMenu.append(div.append(cp1).append("<span>"+_gtxt("AISSearch2.markerShadow")+"</span>"));
        div = $('<div class="command label_color"></div>');         
        ctxMenu.append(div.append(cp2).append("<span>"+_gtxt('AISSearch2.labelColor')+"</span>"));
        div = $('<div class="command label_shadow"></div>');         
        ctxMenu.append(div.append(cp3).append("<span>"+_gtxt('AISSearch2.labelShadow')+"</span>"));
        ctxMenu.append('<div class="command remove">' + _gtxt("AISSearch2.DeleteGroupCommand") + '</div>');
        
        $(cp1).on('click', e=>$(_cp1).offset({left:$('.colorpicker:visible').offset().left+20}));       
        $(cp2).on('click', e=>$(_cp2).offset({left:$('.colorpicker:visible').offset().left+20}));       
        $(cp3).on('click', e=>$(_cp3).offset({left:$('.colorpicker:visible').offset().left+20}));
        ctxMenu.find('.command.marker_color').on("click",(e)=>{            
            $(cp1).click();
        })
        ctxMenu.find('.command.label_color').on("click",(e)=>{             
            $(cp2).click();
        })
        ctxMenu.find('.command.label_shadow').on("click",(e)=>{             
            $(cp3).click();
        })
        
        if (e.currentTarget.querySelector(".delete")) {
            ctxMenu.find('.command.remove').show().on("click", (e) => {
                _onDeleteGroup(evnt.currentTarget.querySelector('.title').innerText);
                ctxMenu.hide();
            })
        }
        else{
            ctxMenu.find('.command.remove').hide();
        }
        ctxMenu.show();
        ctxMenu[0].style.left = (e.clientX - 10) + "px";
        if ((e.clientY - 10 + ctxMenu[0].offsetHeight) < window.innerHeight) {
            ctxMenu[0].style.top = (e.clientY - 10) + "px";
            ctxMenu[0].style.bottom = "";//"auto";
        }
        else {  
            ctxMenu[0].style.bottom = (window.innerHeight - e.clientY - 10) + "px";
            ctxMenu[0].style.top = "";//"auto";
        }
    }).bind(this));

    this.frame.find('.results .upout').off("click").on("click", (e=>{
        let arrow = e.currentTarget,
            title = arrow.closest('.results').querySelector('.title').innerText,
            cl = arrow.classList,
            vessels = arrow.closest('.mf_group').querySelectorAll('.ais_vessel');
        if (cl.contains('icon-down-open')){
            cl.remove('icon-down-open');
            cl.add('icon-right-open');
            vessels.forEach(v=>v.style.display='none');
            _rolledupGroups[title] = true;
        }
        else{
            cl.add('icon-down-open');
            cl.remove('icon-right-open');
            vessels.forEach(v=>v.style.display='block');
            delete(_rolledupGroups[title]);
        }
//console.log(_rolledupGroups)
    }).bind(this))    
    .each((i,el)=>{
        let title = el.closest('.results').querySelector('.title').innerText;
        if (_rolledupGroups[title]){
            el.classList.remove('icon-right-open');
            el.classList.add('icon-down-open');
            el.click();            
        }
    });
    _rolledupGroups = {};
    this.frame.find('.results .icon-right-open').each((i, el) => {
        _rolledupGroups[el.closest('.results').querySelector('.title').innerText] = true;
    })

    this.frame.find('.results .delete')
    .off("click").on("click", (e=>{
        _onDeleteGroup(e.currentTarget.closest('.results').querySelector('.title').innerText);
    }).bind(this));
},
_onSaveGroupStyle,
_groupStyleChanged,
_saveStylePromise = Promise.resolve(0),
_hideContextMenu = function (e){
    this.contextMenu.hide();
    //if (e.currentTarget.querySelector('.colorSelector') || e.currentTarget.classList.contains('colorpicker'))
    if (_groupStyleChanged){
        _groupStyleChanged = false;
        _saveStylePromise = _saveStylePromise.then(_onSaveGroupStyle);
    }
};

const GroupList = function (frame) {
    this.frame = frame;
       
    // context menu
    this.contextMenu = $('<div class="mf_group_menu"></div>')
    .on('mouseleave', (e=>{
        if(!e.relatedTarget || !e.relatedTarget.closest('.colorpicker')){
            _hideContextMenu.call(this, e);
            $('.colorpicker:visible').hide();
        }
    }).bind(this));
    $('body').append(this.contextMenu); 

    this.repaint = function(){
        _setCheckBoxes.call(this);
        _setGroupCommands.call(this);

        // exclude memeber control
        this.frame.find('.ais_vessel .exclude').each((i, elm)=>{
            $(elm).on('click', (ev)=>{
                $(elm).off('click');
                _onExcludeItem(ev, elm.closest('.ais_vessel').querySelector('.mmsi').innerText, i);
            })
        });

        // memeber visibility control
        this.frame.find('.ais_vessel input[type="checkbox"]').each(((i, elm)=>{
            $(elm).off('click').on('click', (e => {
                e.stopPropagation();
                let filtered = _getFiltered.call(this);
                _onCheckItem(filtered);
            }).bind(this));
        }).bind(this));  
        
        // context menu event handler
        this.frame.find('.ais_vessel').off("contextmenu").on("contextmenu", (e=>{
            e.preventDefault();
            let mmsi = e.currentTarget.querySelector('.mmsi'),
            ctxMenu = this.contextMenu,//$('.mf_group_menu'),
            groupblock = e.currentTarget.closest('.mf_group'),
            group = groupblock.querySelector('.results .title').innerText,
            groups = this.frame.find('.results .title'),
            template = '';
            if (groups.length==1)
                return;

            groups.each((i,g)=>{
                if (i>0 && g.innerText!=group)
                    template += ('<div class="command">' + g.innerText + '</div>');
            });
            if (template!='')
                template = ('<div>' + _gtxt("AISSearch2.AddIntoGroup") + '</div>') + template;
            if (groupblock.previousSibling){
                if (template!='')
                    template += ('<div class="command remove">' + _gtxt("AISSearch2.RemoveFromGroup") + '</div>');
                else
                    template += ('<div class="command remove lonely">' + _gtxt("AISSearch2.RemoveFromGroup") + '</div>');
            }
            ctxMenu.html(template);
            
            ctxMenu.find('.command').on("click",(e)=>{
                if(!e.currentTarget.classList.contains('remove'))
                    _onChangeGroup(mmsi.innerText, e.currentTarget.innerText);
                else
                    _onChangeGroup(mmsi.innerText, null);                
                ctxMenu.hide();
            });
            ctxMenu.show();
            ctxMenu[0].style.left = (e.clientX - 10) + "px";
            if ((e.clientY - 10 + ctxMenu[0].offsetHeight) < window.innerHeight) {
                ctxMenu[0].style.top = (e.clientY - 10) + "px";
                ctxMenu[0].style.bottom = "";//"auto";
            }
            else {  
                ctxMenu[0].style.bottom = (window.innerHeight - e.clientY - 10) + "px";
                ctxMenu[0].style.top = "";//"auto";
            }
        }).bind(this));       
    };

    // events
    Object.defineProperty(this, "onChangeGroup", {
        set: function (callback) {
            _onChangeGroup = callback;
        }
    });
    Object.defineProperty(this, "onDeleteGroup", {
        set: function (callback) {
            _onDeleteGroup = callback;
        }
    });
    Object.defineProperty(this, "onRepaintItem", {
        set: function (callback){
            _onRepaintItemHandler = callback;
        }
    }); 
    Object.defineProperty(this, "onCheckItem", {
        set: function (callback){
            _onCheckItem = callback;
        }
    }); 
    Object.defineProperty(this, "onExcludeItem", {
        set: function (callback){
            _onExcludeItem = callback;
        }
    }); 
    Object.defineProperty(this, "onGroupMenuShow", {
        set: function (callback){
            _onGroupMenuShow = callback;
        }
    }); 
    Object.defineProperty(this, "onChangeGroupStyle", {
        set: function (callback){
            _onChangeGroupStyle = callback;
        }
    }); 
    Object.defineProperty(this, "onSaveGroupStyle", {
        set: function (callback){
            _onSaveGroupStyle = callback;
        }
    }); 
      
    // template
    this.toString = function () {
        return '{{#each groups}}' + GroupWidget.prototype.toString.call() + '{{/each}}' +
            '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
    } 
}

GroupList.prototype.appendGroup = function(group, index){
    this.frame.find('.mf_group').eq(0).parent().append(Handlebars.compile(GroupWidget.prototype.toString.call().replace(/\{\{@index\}\}/, index))(group));    
    _setGroupCommands.call(this);
}

module.exports = GroupList;