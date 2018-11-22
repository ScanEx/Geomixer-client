require("./MyCollection.css")
const BaseView = require('./BaseView.js');
const SearchControl = require('../Search/SearchControl.js');

//let _searchString = "";

const MyCollectionView = function ({ model, registerDlg }) {
        BaseView.call(this, model);
        this.frame = $(Handlebars.compile('<div class="lloyds_view search_view">' +
            '<table border=0 class="instruments">' +
            '<tr><td class="search_input_container"></td></tr>' +
            '</table>' +   
            '<table class="results">'+
            '<td class="count"></td>' +
            '<td><div class="refresh clicable"><div>' + this.gifLoader + '</div></div></td></tr>' +
            '</table>'+    
            // '<table class="start_screen"><tr><td>' +
            // '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">' +
            // '<div>Здесь будут отображаться<br>результаты поиска по названию,<br>' +
            // 'IMO илм MMSI судна' +
            // '</div></td></tr></table>' +
            '<div class="ais_vessels">'+
            '<div class="ais_vessel">' +
            '<table><tr><div class="position">vessel name</div><div>mmsi:  imo: </div></tr></table>' +
            '</div>' +
            '</div>' +
            '<table class="menu">'+
            '<td class="open clicable"><div>{{i "Lloyds.showRegister"}}</div></td>' +
            '<td class="clean clicable"><div>{{i "Lloyds.cleanList"}}</div></td></tr>' +
            '</table></div>'
        )());

        this.container = this.frame.find('.ais_vessels');
        //this.startScreen = this.frame.find('.start_screen');
        this.searchInput = new SearchControl({tab:this.frame[0], container:this.frame.find('.search_input_container')[0],
            callback:(v=>{
                        if (!this.vessel || this.vessel.mmsi != v.mmsi || !this.frame.find('.ais_positions_date')[0]) {
                            //LOAD INTO LOCAL REGISTRY
                            if (this.model.data.vessels.every(x=>x.rs!=v.rs)){
                                this.model.data.vessels.push(v);
                                this.model.save();
                                this.show();
                            }
                        }
            }).bind(this)
        });
        this.tableTemplate = '{{#each vessels}}' +
            '<div class="ais_vessel">' +
            '<table border=0><tr>' +
            '<td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' +
            '<td><div class="exclude button" title="{{i "Lloyds.vesselExclude"}}"></div></td>' +
            '</tr></table>' +
            '</div>' +
            '{{/each}}' +
            '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
    
        this.frame.find('.menu .open').on('click', ()=>{
            registerDlg.collection = this.model.data.vessels.map(v=>v.rs);
            registerDlg.show();
        })
        this.frame.find('.menu .clean').on('click', (()=>{
            this.model.data.vessels.length = 0;
            this.model.save();
            this.show();
        }).bind(this));        
    },
    _clean = function () {
        //this.startScreen.css({ visibility: "hidden" });
        let count = this.model.data && this.model.data.vessels ? this.model.data.vessels.length : 0;
        this.frame.find('.count').text(_gtxt('Lloyds.found') + count);
    };

MyCollectionView.prototype = Object.create(BaseView.prototype);

MyCollectionView.prototype.inProgress = function (state) {
    let progress = this.frame.find('.refresh div');
    if (state)
        progress.show();
    else
        progress.hide();
};

MyCollectionView.prototype.resize = function () { 
    let h = $('.iconSidebarControl-pane').height() - this.frame.find('.instruments').outerHeight()
    - this.frame.find('.results').outerHeight() - this.frame.find('.menu').outerHeight();
    this.container.height(h+1);
};

MyCollectionView.prototype.repaint = function () { 
    _clean.call(this);
    BaseView.prototype.repaint.call(this); 
    this.frame.find('.exclude').each(((i, elm)=>{
        let inst = this;
        $(elm).on('click', ()=>{
            $(elm).off('click');
            //UPDATE LOCAL REGISTRY
            inst.model.data.vessels.splice(i, 1);
            inst.model.save();
            inst.show();
        })
    }).bind(this));  
};

MyCollectionView.prototype.show = function () {
    this.frame.show();
    this.searchInput.focus();
    BaseView.prototype.show.apply(this, arguments);
};

module.exports = MyCollectionView;
