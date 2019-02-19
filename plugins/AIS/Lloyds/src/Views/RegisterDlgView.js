require("./RegisterDialog.css")
const BaseView = require('./BaseView.js');

const RegisterDlgView = function ({ model }) {
    BaseView.call(this, model);

    Object.defineProperty(this, "collection", {
        set: (value=>{
//console.log(value)
//console.log(this.model.data.vessels)
        this.model.data.vessels = this.model.data.vessels.filter(v=>value.indexOf(v.RS)!==-1)
//console.log(this.model.data.vessels)
        let new_tasks = value.filter(v=>!this.model.data.vessels || !this.model.data.vessels.some(cv=>cv.RS==v));
//console.log(new_tasks)
        if (new_tasks.length>0){
            this.model.tasks = new_tasks
            .map(id=>fetch("//kosmosnimki.ru/demo/lloyds/api/v1/Ship/Get/"+id))
            this.model.isDirty = true;
        }
//console.log(this.model.isDirty)
    }).bind(this)});

    this.frame = $(Handlebars.compile('<div class="lloyds_register_dlg_view">' +
    '<div><table class="instruments unselectable" border=0><tr><td>' + 
    '<div class="fieldstree_selector"><span>{{i "Lloyds.fieldsSelector"}}</span></div><div class="rollout"></div>' +
    '<div class="fieldstree_display" style="display:none">' +
    '<div class="select"><div class="fieldstree_selector"><span>{{i "Lloyds.fieldsSelector"}}</span></div><div class="rollout up">&nbsp;</div></div>' +
    '<hr>' + 
    '<div class="fieldstree_panel"></div>' +
    '</div>' +    
    '</td><td><div class="refresh" style="display:none">' + this.gifLoader + '</div></td></tr></table></div>' +
    '<div class="vessels_columns unselectable"><table><tr>' + 
    '<td class="column">&nbsp;</td>' + 
    '</tr></table></div><div class="vessels"></div><div class="export button">Экспорт</div><iframe class="export download" style="display:none"></iframe>' +
    '</div>')())
    this.container = this.frame.find('.vessels');
    let frame = this.frame;
    this.mcsbOptions = {
        axis: "yx",
        callbacks: {
            whileScrolling: function () {
                if (this.mcs.direction=="x")
                    frame.find('.vessels_columns table').css({position:"relative", left:this.mcs.left+"px"})
            },
            onScrollStart: function(){ 
                if(!frame.find('.fieldstree_display').is(':hover'))
                    frame.find('.rollout.up:visible').mousedown() 
            }
        }
    };

    // FIELDSSELECTOR
    this.model.loadMeta().then((() => {
        let feeldsTree = '<ul>';
        for (let i = 0; i < this.model.data.columns.length; ++i) {
            feeldsTree += '<li class="section"><div class="lloyds_dialog_button branch_expand" style="display:none"/><div class="lloyds_dialog_button branch_shrink"/>'+
            '<input type="checkbox" value="' + i + '" '+(this.model.data.columns[i].checked?'checked':'')+'><label>' + this.model.data.columns[i].caption  + '</label>'
            feeldsTree += '<ul>';
            for (let j = 0; this.model.data.columns[i].nodes && j < this.model.data.columns[i].nodes.length; ++j) {
                feeldsTree += '<li><div class="lloyds_dialog_button branch_expand"/><div class="lloyds_dialog_button branch_shrink" style="display:none"/><input type="checkbox" value="' + i+'.'+j + '" '+
                (this.model.data.columns[i].nodes[j].checked?'checked':'')+'><label>' + this.model.data.columns[i].nodes[j].caption + '</label>'
                feeldsTree += '<ul style="display:none">';
                for (let k = 0; this.model.data.columns[i].nodes[j].nodes && k < this.model.data.columns[i].nodes[j].nodes.length; ++k) {
                    if (this.model.data.columns[i].nodes[j].nodes[k]){
                        if (this.model.data.columns[i].nodes[j].nodes[k].name=="LRIMOShipNo" ||
                         this.model.data.columns[i].nodes[j].nodes[k].name=="ShipName"){
                            this.model.data.columns[i].nodes[j].nodes[k].checked = true;
                            this.model.data.columns[i].nodes[j].nodes[k].disabled = true;
                         }

                        feeldsTree += '<li><input type="checkbox" value="' + i+'.'+j+'.'+k + '" '+
                        (this.model.data.columns[i].nodes[j].nodes[k].checked ? 'checked ':'')+
                        (this.model.data.columns[i].nodes[j].nodes[k].disabled ? 'disabled="disabled"':'')+                        
                        '><label>' + this.model.data.columns[i].nodes[j].nodes[k].caption + ' <span>(' + this.model.data.columns[i].nodes[j].nodes[k].trans + ')</span>' + '</label></li>'
                    }
                }
                feeldsTree += '</ul>';
                feeldsTree += "</li>";
            }
            feeldsTree += '</ul>';
            feeldsTree += "</li>";
        }
        feeldsTree += "</ul>";
        this.feeldsTree = $(feeldsTree);
    }).bind(this))
}

RegisterDlgView.prototype = Object.create(BaseView.prototype);

const _export = function(ev){
    let form = new FormData(),
    columns = [];
    //this.frame.find('input.export:checked').each((i,v)=>v.classList[2] && _vesselsToExport.push(v.classList[2]))
    if (!_vesselsToExport.length){
        console.log('Nothing to export');
        return;
    }
    this.frame.find('.column').each((i,c)=>c.classList[1] && columns.push(c.classList[1]))
    form.append('vessels', _vesselsToExport) 
    form.append('columns', columns) 
    this.inProgress(true);
    fetch(window.serverBase + "plugins/ais/lloydsexport.ashx",
    {
        method: "POST",
        mode: 'cors',
        body: form,
        credentials: 'include'
    })
    .then(function(res){ return res.text(); })
    .then(function(data){ 
        this.inProgress(false);
        if (data.search(/ERROR:/)!=-1){
            return Promise.reject(data)
        }
        this.frame.find(".export.download")[0].src = window.serverBase + "plugins/ais/lloydsexport.ashx?id=" + data
    }.bind(this))
    .catch((function(data){
        this.inProgress(false);
        console.log( data ) 
    }).bind(this))
},
_clean = function () {
        this.container.empty();
        this.container.attr("class", "vessels")
    },
    _showFieldsTree = (e, panel) => {
        if (!panel.is(':visible')) {
            panel.show()
            panel.offset(panel.siblings('.fieldstree_selector').offset())
        }
        else
            panel.hide()
        e.stopPropagation();
    },
    _showFieldsTreeBranch = (e, lbl)=>{
        let b = $(e.currentTarget)
        .hide()
        .siblings(lbl).show();
        if (lbl == '.branch_shrink')
            b.siblings('ul').show();
        else
            b.siblings('ul').hide();
        e.stopPropagation();
    }
    
let _dialog,
    _dialogRect = JSON.parse(localStorage.getItem("lloyds_rect")),
    _dialogW = _dialogRect?_dialogRect.w:710, _dialogH = _dialogRect?_dialogRect.h:450,
    _containerH = _dialogH - 215,
    _vesselsToExport = []// _dialogRect?_dialogRect.ch:280;

RegisterDlgView.prototype.show = function () {
    if (!_dialog){
        _clean.call(this);
        BaseView.prototype.show.apply(this, arguments);
        this.resize({dx:0, dy:0});

        let canvas = this.frame,
            screen = $('#all')[0],
            sw = parseFloat(window.getComputedStyle(screen).width),
            sh = parseFloat(window.getComputedStyle(screen).height),
            posX = (sw - _dialogW) / 2.0,
            posY = (sh - _dialogH) / 2.0,
            isMaximized = false,
            columns = this.model.data.columns,
            columns_ts = this.model.data.columnsTs;

        _dialog = showDialog("register", canvas[0], {
            /*width: _dialogW, height: _dialogH,*/ 
            posX: posX, posY: posY,
            closeFunc: (() => { 
                _dialog = null; 
                localStorage.setItem("lloyds_columns", JSON.stringify({timestamp: columns_ts, nodes:columns}));
                localStorage.setItem("lloyds_rect", JSON.stringify({w:_dialogW, h:_dialogH, ch:_containerH}));
                this.frame.find('.export.download')[0].src = "";
            }).bind(this)            
        });
        $(_dialog).dialog({
            resizable: true, resize: ((event, ui) => {
                this.resize({ dy: ui.size.height - _dialogH });
                _dialogW = ui.size.width;
                _dialogH = ui.size.height;
                if (!$('.vessels .mCSB_scrollTools_horizontal').is(':visible'))                
                    this.frame.find('.vessels_columns table').css({position:"relative", left:0})
            }).bind(this),
            /*width: _dialogW, height: _dialogH*/
        });
        $(_dialog).parent().css({'min-width': '600px', 'width': _dialogW, 'height': _dialogH})
        $(_dialog).parent().find('.ui-dialog-content').css('min-width', '600px');
        isMaximized = false;

        // TITLEBAR	
        canvas.parent('div').css({ 'margin': '0', 'overflow': 'hidden' })
        let titlebar = $(_dialog).parent().find('.ui-dialog-titlebar').css('padding', '0')
            .html('<table class="lloyds_dialog_titlebar"><tr>' +
            '<td><div class="choose">' + _gtxt("Lloyds.dlgTitle") +
            '</div></td>' +
            '<td class="window_button" id="expandbut" title="' + _gtxt("Lloyds.expandButton") + '"><div class="lloyds_dialog_button expand"></div></td>' +
            '<td class="window_button" id="shrink" title="' + _gtxt("Lloyds.shrinkButton") + '" style="display:none"><div class="lloyds_dialog_button shrink"></div></td>' +
            '<td class="window_button" id="closebut" title="' + _gtxt("Lloyds.closeButton") + '"><div class="lloyds_dialog_button close"></div></td>' +
            '</tr></table>');

        $('#closebut', titlebar).on('click', (e) => { 
                if (isMaximized)
                    this.resize({dy : _dialogH - parseFloat(window.getComputedStyle($('#all')[0]).height)});
                $(_dialog).dialog("close"); 
            }
        )
        $('#shrink', titlebar).on('click', (e) => {
            $(e.currentTarget).hide()
            $(_dialog).dialog({width:_dialogW, height:_dialogH});
            titlebar.find('#expandbut').show();          
            this.resize({dy : _dialogH - parseFloat(window.getComputedStyle($('#all')[0]).height)});
            $(_dialog).dialog({ resizable: true });
            isMaximized = false;
        })
        $('#expandbut', titlebar).on('click', (e) => {
            $(e.currentTarget).hide()
            let screen = $('#all')[0],
                sw = parseFloat(window.getComputedStyle(screen).width),
                sh = parseFloat(window.getComputedStyle(screen).height);
            $(_dialog).dialog({width:sw, height:sh});
            titlebar.find('#shrink').show();            
            this.resize({dy : sh - _dialogH});
            $(_dialog).dialog({ resizable: false });
            isMaximized = true;
        })

        // EXPORT
        this.frame.find('.export.button').click(_export.bind(this))    

        // FIELDSSELECTOR
        if (this.feeldsTree) {
            $('.lloyds_register_dlg_view').parents('.ui-dialog').on("mousedown", (e => {
                this.frame.find('.rollout.up:visible').mousedown()
            }).bind(this))
           
            this.frame.find('.fieldstree_panel').text('').append(this.feeldsTree).mCustomScrollbar();
            this.frame.find('.fieldstree_selector').on('mousedown', (e => {
                _showFieldsTree(e, this.frame.find('.fieldstree_display'));
            }).bind(this));
            this.frame.find('.rollout').on('mousedown', (e => {
                _showFieldsTree(e, this.frame.find('.fieldstree_display'));
            }).bind(this));
            this.feeldsTree.find('.branch_expand').on('mousedown', e => _showFieldsTreeBranch(e, '.branch_shrink'));
            this.feeldsTree.find('.branch_shrink').on('mousedown', e => _showFieldsTreeBranch(e, '.branch_expand'));
            this.feeldsTree.find('input[type="checkbox"]').on('mousedown', (e => {
                let chb = e.currentTarget,
                    id = chb.value.split("."),
                    node = columns[id[0]], parent;
                for (let i=1; i<id.length; ++i){
                    parent = node;
                    node = node.nodes[id[i]];
                }                
                let s=[node], n; 
                while(s.length){
                    n=s.pop(); 
                    if (!n.disabled)
                        n.checked = !chb.checked;
                    n.nodes && n.nodes.forEach(x=>s.push(x))
                } 
                if (parent)      
                    parent.checked = parent.nodes.every(x=>x.checked); 
//console.log(parent)
//console.log(node)
                if (chb.checked) {
                    $(chb).parents('ul').siblings('input:not([disabled])').each((i, elm) => { elm.checked = false });
                    $(chb).siblings('ul').find('input:not([disabled])').each((i, elm) => { elm.checked = false })
                }
                else {
                    $(chb).siblings('ul').find('input').each((i, elm) => { elm.checked = true })
                    let uls = $(chb).parents('ul')
                    for (let i = 0; i < uls.length; ++i) {
                        let inputs = uls.eq(i).find('li input'),
                            checked = uls.eq(i).find('li input:checked');
//console.log(inputs.length +"=="+ (checked.length+1))
//console.log(uls.eq(i).siblings('input'))
                        if (inputs.length == checked.length+1 && uls.eq(i).siblings('input')[0])
                            uls.eq(i).siblings('input')[0].checked = true;
                    }
                }
                this.repaint();
                e.stopPropagation();
            }).bind(this));
            this.feeldsTree.find('label').on('mousedown', e => {
                $(e.currentTarget).siblings('input[type="checkbox"]').mousedown().click();
                e.stopPropagation();
            })
        }
    }
};

const _repaintExport = function(){     
    this.frame.find('.export.get:not(.all)').click((e=>{
        if (!$(e.target).is(':checked')){
            this.frame.find('.export.get.all')[0].checked=0;
            _vesselsToExport.splice(_vesselsToExport.indexOf(e.target.classList[2]),1)
        }
        else{
            _vesselsToExport.push(e.target.classList[2])
        }
    }).bind(this))
    .each((i, el)=>{
        el.checked = _vesselsToExport.indexOf(el.classList[2])!=-1?1:0;
    })    

    this.frame.find('.export.get.all').click((e=>{
        _vesselsToExport.length = 0;
        this.frame.find('.export.get:not(.all)').each((i,el)=>{
            el.checked=$(e.target).is(':checked')?1:0;
            if (el.checked)
                _vesselsToExport.push(el.classList[2]);
        })
    }).bind(this))[0].checked = this.model.data.vessels.length==0 || this.frame.find('.export.get:not(.all):not(:checked)').length>0?0:1;
}

RegisterDlgView.prototype.repaint = function () {
    if (!this.frame.is(":visible"))
        return true;
    if (this.model.data.columns)
        this.frame.find('.vessels_columns').html(
        Handlebars.compile('<table><tr><td><div class="column"><input type="checkbox" class="export get all"><div></div></div></td>{{#each columns}}{{#each nodes}}{{#each nodes}}'+
        '{{#if checked}}'+
        '<td><div class="column {{name}}">{{caption}}<div>{{trans}}</div></div></td>'+
        '{{/if}}'+
        '{{/each}}{{/each}}{{/each}}</tr></table>')
        (this.model.data))

    this.tableTemplate = '<table class="vessels_data">{{#each vessels}}<tr>';
    this.tableTemplate += '<td><div><input type="checkbox" class="export get {{LRIMOShipNo}}"></div></td>';
    for (let i=0; i<this.model.data.columns.length; ++i)
    for (let j=0; this.model.data.columns[i].nodes && j<this.model.data.columns[i].nodes.length; ++j)
    for (let k=0; this.model.data.columns[i].nodes[j].nodes && k<this.model.data.columns[i].nodes[j].nodes.length; ++k)
        if (this.model.data.columns[i].nodes[j].nodes[k].checked)
            this.tableTemplate += '<td><div>{{'+this.model.data.columns[i].nodes[j].nodes[k].name+'}}</div></td>';
    this.tableTemplate += '</tr>' +
    '{{/each}}</table>{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';

    BaseView.prototype.repaint.apply(this, arguments);

    _repaintExport.call(this);

    let columns = this.frame.find('.vessels_columns tr:nth-of-type(1) td div:has(div)'),
        cells = this.frame.find('.vessels_data tr:nth-of-type(1) td div'),
        getOuterWidth = function(el){
            let s = window.getComputedStyle(el),
            w = parseFloat(s.width.replace(/\D+$/, '')) // ,
            // pl = parseFloat(s["padding-left"].replace(/\D+$/, '')),
            // pr = parseFloat(s["padding-right"].replace(/\D+$/, '')),
            // bl = parseFloat(s["border-left-width"].replace(/\D+$/, '')),
            // br = parseFloat(s["border-right-width"].replace(/\D+$/, ''));
//console.log("get " + (w + pl + pr + bl + br) + " = " + w  + " + "+ pl + " + " + pr + " + " + bl + " + " + br)
            return w; // + pl + pr + bl + br;
        },
        setOuterWidth = function(el, w1){
        //     let s = window.getComputedStyle(el),
        //     pl = parseFloat(s["padding-left"].replace(/\D+$/, '')),
        //     pr = parseFloat(s["padding-right"].replace(/\D+$/, '')),
        //     bl = parseFloat(s["border-left-width"].replace(/\D+$/, '')),
        //     br = parseFloat(s["border-right-width"].replace(/\D+$/, ''));
            let w = w1; // - (pl + pr + bl + br);
//console.log("set " + w + " = " + w1 + " - "+ pl + " - " + pr + " - " + bl + " - " + br)
            el.style.width = w  + "px";
        };
    if (cells.length > 0) {
        $('.vessels_data tr:last-child').after('<tr>'+$('.vessels_columns table tr').html()+'</tr>')
        let cont_w = this.frame.find('.vessels').width()
        this.frame.find('.vessels_data').width(cont_w)
            .parent().width(cont_w);
        columns.each((i, el) => {
            let w = getOuterWidth(cells[i])
            setOuterWidth(el, w)
            setOuterWidth(cells[i], w)
            setOuterWidth(cells.eq(i).parent()[0], w)
            //console.log(cells.eq(i).outerWidth() + " " + getOuterWidth(cells[i])+" "+$(el).outerWidth())        
        }) 
        let calc_w = getOuterWidth(this.frame.find('.vessels_data')[0]); 
//console.log("cont_w "+cont_w + " calc_w "+calc_w)
        if (calc_w>cont_w){
            setOuterWidth(this.frame.find('.vessels_data')[0], calc_w)
            setOuterWidth(this.frame.find('.vessels_data').parent()[0], calc_w)
        }
        $('.vessels_data tr:last-child').remove()
    }
};

RegisterDlgView.prototype.inProgress = function (state) {
    let progress = this.frame.find('.refresh');
    if (state)
        progress.show();
    else
        progress.hide();
};

RegisterDlgView.prototype.resize = function ({dx, dy}) {
    _containerH += dy;
    this.container.height(_containerH);
    
    // let calc_w = parseFloat(getComputedStyle(this.container[0]).width),
    //     columns = this.frame.find('.vessels_columns tr:nth-of-type(1) td div');
    // if (calc_w>columns.length*200){
    //     this.frame.find('.vessels_data').width(calc_w)
    //     .parent().width(calc_w);  
    // }
};

module.exports = RegisterDlgView;
