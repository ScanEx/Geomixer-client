require("../../icons.svg");
require("./ImageCountView.css");
const BaseView = require('./BaseView.js')//,
      //Request = require('../Request'),
      //Calendar = require('../Calendar'),
      //SearchControl = require('../SearchControl'),
      //SelectControl = require('../SelectControl');

const ImageCountView = function (layers, model) {
    const _thisView = this;
    BaseView.call(this, model);

        this.frame = $(`<div class="imagecount-view">
        <div class="header">
        <div class="system">
        ${Object.keys(layers).map(k=>`<label><input id="system" name="system" type="radio" value="${k}">${layers[k]}</label><br>`).join('')}
        </div>
        <div class="but choose"><svg><use xlink:href="#icons_selectreg"></use></svg>Выбор района</div>
        <div class="calendar"></div>
        </div>
        <div class="results" style="border: solid 1px red"></div>
        </div>`);
        this.container = this.frame.find('.results');
        this.frame.find('.choose').on('click', e=>{
            const drawObjects  = nsGmx.leafletMap.gmxDrawing.items, mapLayers = nsGmx.leafletMap._layers;
            $(e.target).toggleClass('active');
            console.log(e.target)
            if ($(e.target).is('.active')){
                drawObjects.forEach(l=>{
                    var t = l.options.type.toLowerCase(); 
                    if(t=='rectangle'||t=='polygon'){                        
                        console.log(t, l._layers)
                        l.disableEdit();
                    }
                });
                Object.keys(mapLayers).forEach(k=>{
                    var l = mapLayers[k], t = l.feature && l.feature.geometry.type.toLowerCase(); 
                    if (t=='polygon' || t=='rectangle')  
                        console.log(k, mapLayers[k])
                });
            }
            else{
                Object.keys(mapLayers).forEach(k=>{
                    var l = mapLayers[k], t = l.feature && l.feature.geometry.type.toLowerCase(); 
                    if (t=='polygon' || t=='rectangle')  
                        console.log(k, mapLayers[k])
                });
                drawObjects.forEach(l=>{
                    var t = l.options.type.toLowerCase(); 
                    if(t=='rectangle'||t=='polygon'){                        
                        console.log(t, l._layers)
                        l.enableEdit();
                    }
                });
            }
            // nsGmx.leafletMap.gmxDrawing.getFeatures().forEach(f=>{
            //     var t = f.options.type.toLowerCase(); 
            //     if(t=='rectangle'||t=='polygon'){
            //         console.log(f.options.type, f._layers)
            //     }})
        });
        Object.defineProperty(this, "tableTemplate", {
            get: function () {
                let //totalPositions = this.model.data.total,
                    rv = `<div style="width:200px; height: 200px; background-color:green"></div>`;
                return rv;
            }
        });  

        Object.defineProperty(this, "topOffset", {
            get: function () { 
                return this.frame.find('.header')[0] && this.frame.find('.header')[0].getBoundingClientRect().height;
            }
        });  
        Object.defineProperty(this, "bottomOffset", {
            get: function () {             
                return 20;//this.frame.find('.footer')[0] && this.frame.find('.footer')[0].getBoundingClientRect().height;
            }
        }); 
    };

ImageCountView.prototype = Object.create(BaseView.prototype);

ImageCountView.prototype.inProgress = function (state) {
    let progress = this.frame.find('div.refresh'), grid = this.frame.find('div.grid');
    if (state){
        grid.hide();
        progress.show();
    }
    else{
        progress.hide();
        grid.show();
    }
};

ImageCountView.prototype.repaint = function () { 
console.log('IMC REPAINT')
    //_clean.call(this);
    BaseView.prototype.repaint.call(this);      
};

ImageCountView.prototype.show = function () {
console.log('IMC SHOW')
    if (!this.frame)
        return;
    BaseView.prototype.show.apply(this, arguments);
};

module.exports = ImageCountView;
