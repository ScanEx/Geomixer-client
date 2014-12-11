(function() {

    _translationsHash.addtext("rus", {
        
    });
    
    _translationsHash.addtext("eng", {
        
    });
    
    var drawPalette = function(canvas) {
        var w = canvas.width,
            h = canvas.height,
            ctx = canvas.getContext('2d'),
            coeff = 256/w;
            
        ctx.lineWidth = 15;
        for (var l = 0; l < w; l++) {
            var r = Math.floor((w-l)*coeff),
                g = Math.floor(l*coeff);
            ctx.strokeStyle = 'rgb(' + r + ', ' + g + ', 0)';
            ctx.beginPath();
            ctx.moveTo(l, 0);
            ctx.lineTo(l, h-1);
            ctx.stroke();
        }
    }
    
    var publicInterface = {
        pluginName: 'WWF Plugin',
        afterViewer: function(params, map) {
            var leftPanel = new nsGmx.LeftPanelItem('wwf', {
                path: ['Мониторинг нарушений']
            });
            
            var ui = $(
                '<div class="wwf-container">' +
                    '<div class="wwf-slider"></div>' +
                    '<canvas class="wwf-palette"></canvas>' +
                    '<div class="wwf-info"></div>' +
                '</div>'),
                slider = ui.find('.wwf-slider');
                
            var updateInfo = function(min, max) {
                ui.find('.wwf-info').html('Фильтр по дням: ' + min + ' - ' + max);
            }
            
            slider.slider({
                min: 1,
                max: 356,
                range: true,
                values: [1, 365],
                change: function(event, sliderUI) {
                    updateInfo(sliderUI.values[0], sliderUI.values[1]);
                    map.layers[layerID].repaint();
                }
            });
            
            updateInfo(1, 356);
            
            drawPalette(ui.find('.wwf-palette')[0]);
            
            ui.appendTo(leftPanel.workCanvas);
            var parentContainer = $('#leftContentInner').length ? $('#leftContentInner') : $('#leftContent');
            parentContainer.prepend(leftPanel.panelCanvas);
            
            var layerID = params && params.layerID || '3F5FA68D2821459D8CF1A6DE493BE337';
            map.layers[layerID].setImageProcessingHook(function(image, options) {
                
                var canvas = document.createElement('canvas');
                canvas.width = canvas.height = 256;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                
                var imgData = ctx.getImageData(0, 0, 256, 256),
                    data = imgData.data,
                    minVal = slider.slider('values', 0) - 1,
                    maxVal = slider.slider('values', 1) - 1,
                    coeff = 256/356;
                
                for (var p = 0; p < 256*256*4; p += 4) {
                    var a = data[p+3];
                    if (a > 0) {
                        var v = data[p] + data[p+1];
                        
                        if (v >= minVal && v <= maxVal) {
                            data[p] = Math.floor((356-v)*coeff);
                            data[p+1] = Math.floor(v*coeff);
                        } else {
                            data[p+3] = 0;
                        }
                    }
                }
                
                ctx.putImageData(imgData, 0, 0);
                
                return canvas;
            })
        }
    };
    
    gmxCore.addModule('WWFPlugin', publicInterface, {css: 'WWFPlugin.css'});
})();