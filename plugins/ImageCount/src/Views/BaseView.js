let _clean = function(){  
    let scrollCont = this.container.find('.mCSB_container')
    if (scrollCont[0]){
        scrollCont.empty();
    }
    else{
        this.container.empty();
    }
};

const BaseView = function (model) {
    model.view = this;
    this.model = model;
    this.gifLoader = '<img src="img/progress.gif">';
};

BaseView.prototype = function () {
    return {
        get isActive(){
            return this.frame.is(":visible");
        },
        resize: function (clean) {
            if(!this.frame)
                return;

console.log($('.iconSidebarControl-pane').height(), this.topOffset, this.bottomOffset)
            let h = $('.iconSidebarControl-pane').height() - this.topOffset - this.bottomOffset;
            // if (this.startScreen){
            //     this.startScreen.height(h);
            //     this.container.css({ position:"relative", top: -h+"px" });
            // }
            this.container.height(h);

            if (clean){
                this.container.empty()
            }
        },
        repaint: function(){
            _clean.call(this); 
            
            this.inProgress(false);

            if (!this.model.data)
                return;

            let scrollCont = this.container.find('.mCSB_container'),
            content = $(
                //Handlebars.compile(this.tableTemplate)(this.model.data)
                this.tableTemplate
            ); 

            if (!scrollCont[0]) {
                this.container.append(content).mCustomScrollbar(this.mcsbOptions);
            }
            else {
                $(scrollCont).append(content);
            }

        },
        show: function () {
            if (!this.frame)
                return;
            this.frame.show();
            this.model.update();
        },
        hide: function () {
            this.frame.hide();
        },
        get isVisible(){
            const rc = this.frame[0].getBoundingClientRect();
            return rc.width!=0 && rc.height!=0;
        }
    }
}();

module.exports = BaseView;