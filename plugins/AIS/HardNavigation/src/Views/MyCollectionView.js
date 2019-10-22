require("./MyCollection.css")
const BaseView = require('./BaseView.js');

//let _searchString = "";

const MyCollectionView = function ({ model, registerDlg }) {
        BaseView.call(this, model);
        this.frame = $(Handlebars.compile(`<div class="hardnav-view">
            <div class="header">
                <table border=1 class="instruments">
                <tr><td class="but choose">${_gtxt('HardNavigation.choose_reg')}</td><td class="but create">${_gtxt('HardNavigation.create_reg')}</td></tr>
                </table> 
                <table border=1>
                <tr><td class="hint" colspan="2">${_gtxt('HardNavigation.instr_hint')}</td>
                <td><div class="refresh"><div>${this.gifLoader}</div></div></td></tr>
                </table> 
                <table border=1 class="grid-header">
                <tr><td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></svg></td>
                <td>${_gtxt('HardNavigation.reg_id')}</td>
                <td>${_gtxt('HardNavigation.reg_created')}</td>
                <td>${_gtxt('HardNavigation.reg_updated')}</td>
                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>
                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>
                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>
                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td></tr>
                </table> 
            </div> 
            <div class="grid">

            </div>
            <div class="footer">
                <table border=1 class="pager">
                    <tr><td class="but arrow arrow-prev"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-left"></use></svg></td>
                    <td class="current">${_gtxt('HardNavigation.page_lbl')} 1/1</td>
                    <td class="but arrow arrow-next"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-right"></use></svg></td></tr>
                </table>  
                <div class="but but-attributes">${_gtxt('HardNavigation.attr_tbl')}</div>          
            </div>
            </div>`
        )());

        this.container = this.frame.find('.grid');
        this.footer = this.frame.find('.footer');

        this.tableTemplate = '{{#each vessels}}' +
            '<div class="hardnav-item">' +
            '<table border=0><tr>' +
            '<td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' +
            '<td><div class="exclude button" title="{{i "Lloyds.vesselExclude"}}"></div></td>' +
            '</tr></table>' +
            '</div>' +
            '{{/each}}' +
            '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';

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
    _clean = function () {

    };

MyCollectionView.prototype = Object.create(BaseView.prototype);

MyCollectionView.prototype.inProgress = function (state) {
    let progress = this.frame.find('.refresh div');
    if (state)
        progress.show();
    else
        progress.hide();
};

// MyCollectionView.prototype.resize = function () { 
//     let h = $('.iconSidebarControl-pane').height() - this.frame.find('.instruments').outerHeight()
//     - this.frame.find('.results').outerHeight() - this.frame.find('.menu').outerHeight();
//     this.container.height(h+1);
// };

MyCollectionView.prototype.repaint = function () { 
    _clean.call(this);
    BaseView.prototype.repaint.call(this); 


};

MyCollectionView.prototype.show = function () {
    this.frame.show();
    //this.searchInput.focus();
    BaseView.prototype.show.apply(this, arguments);
};

module.exports = MyCollectionView;
