
let _calcHeight = function () {
    let H = $('.iconSidebarControl-pane').height() - this.topOffset;
    return (H);
};

const BaseView = function (model) {
    model.view = this;
    this.model = model;
    this.gifLoader = '<img src="img/progress.gif">';
};

let _clean = function(){ 
    let scrollCont = $(this.container).find('.mCSB_container');
    if (scrollCont[0])
        scrollCont.empty();
    else
        $(this.container).empty();
//console.log("EMPTY ON BASE.CLEAN")
};

BaseView.prototype = function () {
    return {
        get isActive(){
            let rc = this.frame.getBoundingClientRect();
            return rc.width==0 && rc.height==0;
        },
        resize: function (clean) {
            let h = _calcHeight.call(this);
            if (this.startScreen){
                this.startScreen.height(h);
                $(this.container).css({ position:"relative", top: -h+"px" });
            }
            $(this.container).height(h);

            if (clean){
                $(this.container).empty()
            }
        },
        repaint: function(){
            _clean.call(this);  
            if (!this.model.data)
                return;
            let scrollCont = $(this.container).find('.mCSB_container'),
            content = $(Handlebars.compile(this.tableTemplate)(this.model.data));
            if (!scrollCont[0]) {
                $(this.container).append(content).mCustomScrollbar();
            }
            else {
                $(scrollCont).append(content);
            }
        },
        show: function () {
            this.frame.style.display = 'block';
            this.model.update();
        },
        hide: function () {
            this.frame.style.display = 'none';
        }
    }
}();

module.exports = BaseView;