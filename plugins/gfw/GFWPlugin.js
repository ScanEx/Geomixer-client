/** Global Forest Watch Tree Loss/Gain layer plugin
*/
(function ($){

var GFWSlider = L.Control.extend({
    includes: L.Mixin.Events,
    _yearBegin: 2001,
    _yearEnd: 2015,
    _setYears: function(yearBegin, yearEnd) {
        this._yearBegin = yearBegin;
        this._yearEnd = yearEnd;
        this.fire('yearschange', {yearBegin: this._yearBegin, yearEnd: this._yearEnd});
    },
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
        
        var ui = this._ui = $(template({
            labels: labels
        }));
        
        ui.find('.gfw-slider-container').slider({
            min: 2001,
            max: 2015,
            values: [this._yearBegin, this._yearEnd],
            range: true,
            change: function(event, ui) {
                this._setYears(ui.values[0], ui.values[1]);
            }.bind(this)
        });
        
        ui.on('mousedown', function(event) {
            event.stopPropagation();
        });
        
        return ui[0];
    },
    
    onRemove: function() {
    },
    
    saveData: function() {
        return {
            version: '1.0.0',
            yearBegin: this._yearBegin,
            yearEnd: this._yearEnd
        }
    },
    
    loadData: function(data) {
        if (this._ui) {
            this._ui.find('.gfw-slider-container').slider('option', 'values', [data.yearBegin, data.yearEnd]);
        } else {
            this._setYears(data.yearBegin, data.yearEnd);
        }
    }
});

var GFWLayer = L.TileLayer.Canvas.extend({
    options: {
        async: true,
        attribution: '<a href="http://glad.umd.edu/"> Hansen|UMD|Google|USGS|NASA </a>'
    },
    _yearBegin: 2001,
    _yearEnd: 2015,
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
        
        img.src = 'http://storage.googleapis.com/earthenginepartners-hansen/tiles/gfw2015/loss_tree_year_25/' + zoom + '/' + tilePoint.x + '/' + tilePoint.y + '.png';
    },
    setYearInterval: function(yearBegin, yearEnd) {
        this._yearBegin = yearBegin;
        this._yearEnd = yearEnd;
        this.redraw();
    }
})

var GeoMixerGFWLayer = function() {
    this._layer = new GFWLayer();
    this._slider = new GFWSlider({position: 'bottomright'});
    this.options = {
        attribution: this._layer.options.attribution
    }
    
    this._slider.on('yearschange', function(data) {
        this._layer.setYearInterval(data.yearBegin, data.yearEnd);
    }, this)
};

GeoMixerGFWLayer.prototype.initFromDescription = function(layerDescription) {
    this._gmxProperties = layerDescription.properties;
    return this;
}

GeoMixerGFWLayer.prototype.getGmxProperties = function() {
    return this._gmxProperties;
}

GeoMixerGFWLayer.prototype.onAdd = function(map) {
    map.addLayer(this._layer);
    map.addControl(this._slider);
}

GeoMixerGFWLayer.prototype.onRemove = function(map) {
    map.removeLayer(this._layer);
    map.removeControl(this._slider);
}

GeoMixerGFWLayer.prototype.setZIndex = function() {
    return this._layer.setZIndex.apply(this._layer, arguments);
}

 
var publicInterface = {
    pluginName: 'GFW Plugin',
    
    preloadMap: function() {
        L.gmx.addLayerClass('GFW', GeoMixerGFWLayer);
    },
    
    afterViewer: function(params){
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
            }, 
            options: {
                attribution: layer.options.attribution
            }
        }
        
        nsGmx.leafletMap.gmxControlsManager.get('layers').addOverlay(proxyLayer, 'GFW Tree Loss');
        
        slider.on('yearschange', function(data) {
            layer.setYearInterval(data.yearBegin, data.yearEnd);
        })
        
        _mapHelper.customParamsManager.addProvider({
            name: 'gfwplugin',
            loadState: function(state) {
                state.visible && nsGmx.leafletMap.addLayer(proxyLayer);
                slider.loadData(state.slider);
            },
            saveState: function() {
                return {
                    version: '1.0.0',
                    visible: nsGmx.leafletMap.hasLayer(proxyLayer),
                    slider: slider.saveData()
                }
            }
        });
    },
    
    unload: function() {
        //TODO: implement
    }
}

gmxCore.addModule('GFWPlugin', publicInterface, {
    css: 'GFWPlugin.css'
});

})(jQuery);