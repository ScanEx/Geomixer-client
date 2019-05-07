let PRODUCTION = false,
    SIDEBAR2 = false;
if (has('SIDEBAR2'))
    SIDEBAR2 = true;
if (has('PRODUCTION'))
    PRODUCTION = true;

let _calcHeight = function () {  
// console.log($('.iconSidebarControl-pane').height());
// console.log($('.ais_panel_footer').height());
// console.log(this.topOffset);
    return $('.iconSidebarControl-pane').height() - $('.ais_panel_footer').height() 
    - this.topOffset + 2;
};

let _tools;
const BaseView = function (model, tools) {
    model.view = this;
    this.model = model;
    this.gifLoader = '<img src="img/progress.gif">';
    _tools = tools;
};

let _clean = function(){ 
    this.container.find('.info').off('click');
    this.container.find('.position', ).off('click');   
    let scrollCont = this.container.find('.mCSB_container')
    if (scrollCont[0])
        scrollCont.empty();
    else
        this.container.empty();
//console.log("EMPTY ON BASE.CLEAN")
};

BaseView.prototype = function () {
    return {
        get isActive(){
            return this.frame.is(":visible");
        },
        resize: function (clean) {
            let h = _calcHeight.call(this);
            if (this.startScreen && $('.iconSidebarControl-pane:visible')[0]){
                let bb = $('.iconSidebarControl-pane:visible')[0].getBoundingClientRect();
                this.startScreen.css({ position:"absolute", left: bb.left+"px", top: (bb.height/2-50)+"px", 
                width: bb.width+"px"});
            }
            this.container.height(h);

            if (clean){
                this.container.empty()
            }
        },
        repaint: function(){
            _clean.call(this);            
//console.log(this.model.data)
            if (!this.model.data)
                return;
            let scrollCont = this.container.find('.mCSB_container'),
            content = $(Handlebars.compile(this.tableTemplate)(this.model.data));
            if (!scrollCont[0]) {
                this.container.append(content).mCustomScrollbar();
            }
            else {
                $(scrollCont).append(content);
            }

            var _this = this;
            this.container.find('.info', ).on('click', function (e) {
                let target = $(this),
                    vessel = JSON.parse(target.attr('vessel'))
//console.log(vessel)
                _this.infoDialogView && _this.infoDialogView.show(vessel, (v) => {
//console.log(v)
                    vessel.xmin = vessel.xmax = v.longitude
                    vessel.ymin = vessel.ymax = v.latitude
                    if (vessel.hasOwnProperty('ts_pos_utc')) {
                         vessel.ts_pos_utc = v.ts_pos_utc;
                         vessel.ts_pos_org = v.ts_pos_org;
                         v.dt_pos_utc && $(this).closest('tr').find('.date').html(v.dt_pos_utc);
                    }
                    target.attr('vessel', JSON.stringify(vessel))
                });
                e.stopPropagation();
            });
            this.container.find('.ais_vessel').on('click', function () {
                let v = JSON.parse($(this).find('.info').attr('vessel'));                
                v.lastPosition = true;
                v.xmax = null;
                v.xmin = null;
                v.ymax = null;
                v.ymin = null;
                _this.infoDialogView.showPosition(v);
            });      
        },
        show: function () {
            _tools.restoreDefault();
            this.frame.show();
            this.model.update();
        },
        hide: function () {
            this.frame.hide();
        }
    }
}();

module.exports = BaseView;