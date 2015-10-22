/** Global Forest Watch Tree Loss/Gain layer plugin
*/
(function ($){

var GFWLayer = null;

var GFWSlider = L.Control.extend({
    includes: L.Mixin.Events,
    _yearBegin: 2001,
    _yearEnd: 2014,
    onAdd: function(map) {
        var template = Handlebars.compile(
            '<div class = "gfw-slider">' + 
                '<div class = "gfw-slider-container"></div>' +
                '<div class = "gfw-slider-labels">' +
                    '{{#labels}}' +
                        '<div class = "gfw-label-item">{{.}}</div>' +
                    '{{/labels}}' +
                '</div>' +
            '</div>'
        );
        
        var labels = [];
        for (var year = 2001; year <= 2014; year++) {
            labels.push(year);
        }
        
        var ui = $(template({
            labels: labels
        }));
        
        ui.find('.gfw-slider-container').slider({
            min: 2001,
            max: 2014,
            values: [this._yearBegin, this._yearEnd],
            range: true,
            change: function(event, ui) {
                this._yearBegin = ui.values[0];
                this._yearEnd = ui.values[1];
                this.fire('yearschange', {yearBegin: this._yearBegin, yearEnd: this._yearEnd});
            }.bind(this)
        });
        
        ui.on('mousedown', function(event) {
            event.stopPropagation();
        });
        
        return ui[0];
    },
    onRemove: function() {
    }
});

function defineClass() {
    GFWLayer = L.TileLayer.Canvas.Mercator.extend({
        options: {async: true, tilesCRS: L.CRS.EPSG3857},
        _yearBegin: 2001,
        _yearEnd: 2014,
        _drawLayer: function(img, ctx, z) {
            var imgData = ctx.getImageData(0, 0, 256, 256),
                data = imgData.data,
                exp = z < 11 ? 0.3 + ((z - 3) / 20) : 1;
                
            for (var i = 0; i < 256; ++i) {
                for (var j = 0; j < 256; ++j) {
                    var pixelPos = (j * 256 + i) * 4,
                        yearLoss = 2000 + data[pixelPos + 2],
                        intensity = data[pixelPos],
                        scale = Math.pow(intensity/256, exp) * 256;

                    if (yearLoss >= this._yearBegin && yearLoss < this._yearEnd) {
                        data[pixelPos] = 220;
                        data[pixelPos + 1] = (72 - z) + 102 - (3 * scale / z);
                        data[pixelPos + 2] = (33 - z) + 153 - ((intensity) / z);
                        data[pixelPos + 3] = z < 13 ? scale : intensity;
                    } else {
                        data[pixelPos + 3] = 0;
                    }
                }
            }
            
            ctx.putImageData(imgData, 0, 0);
        },
        drawTile: function(canvas, tilePoint, zoom) {
            var img = new Image();
            img.crossOrigin = "Anonymous";
            img.onload = function() {
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 256, 256);
                this._drawLayer(img, ctx, zoom);
                this.tileDrawn(canvas);
            }.bind(this);
            
            img.src = 'http://earthengine.google.org/static/hansen_2014/gfw_loss_tree_year_25_2014/' + zoom + '/' + tilePoint.x + '/' + tilePoint.y + '.png';
        },
        setYearInterval: function(yearBegin, yearEnd) {
            this._yearBegin = yearBegin;
            this._yearEnd = yearEnd;
            this.redraw();
        }
    })
}
 
var publicInterface = {
    pluginName: 'GFW Plugin',
    
    afterViewer: function(params){
        defineClass();
        var layer = new GFWLayer();
        var slider = new GFWSlider({position: 'bottomright'});
        
        var proxyLayer = {
            onAdd: function(map) {
                map.addLayer(layer);
                map.addControl(slider);
            },
            onRemove: function(map) {
                map.removeLayer(layer);
                map.removeControl(slider);
            }
        }
        
        nsGmx.leafletMap.gmxControlsManager.get('layers').addOverlay(proxyLayer, 'GFW Tree Loss');
        
        slider.on('yearschange', function(data) {
            layer.setYearInterval(data.yearBegin, data.yearEnd);
        })
    },
    
    unload: function() {
        //TODO: implement
    }
}

gmxCore.addModule('GFWPlugin', publicInterface, {
    init: function(params, path) {
        return gmxCore.loadScriptWithCheck([{
            check: function() {return L.TileLayer.Canvas.Mercator; },
            script: path + 'TileLayer.Mercator.js'
        }])
    },
    css: 'GFWPlugin.css'
});

})(jQuery);