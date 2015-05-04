L.WWFAlarm = L.TileLayer.Canvas.extend({
    options: {
        async: true
    },
    drawTile: function(canvas, point, zoom) {
        var img = new Image();
        
        img.onload = function() {
            var ctx = canvas.getContext('2d');
            
            ctx.drawImage(img, 0, 0);
            
            var imgData = ctx.getImageData(0, 0, 256, 256),
                data = imgData.data,
                minVal = this._minDate,
                maxVal = this._maxDate,
                coeff = 256/365;
            
            for (var p = 0; p < 256*256*4; p += 4) {
                var v = data[p] + data[p+1];
                if (v >= minVal && v <= maxVal) {
                    data[p] = Math.floor((365-v)*coeff);
                    data[p+1] = Math.floor(v*coeff);
                } else {
                    data[p+3] = 0;
                }
            }
            
            ctx.putImageData(imgData, 0, 0);
            
            this.tileDrawn(canvas);
        }.bind(this);
        
        img.onerror = function() {
            this.tileDrawn(canvas);
        }.bind(this);
        
        img.src = '';
    }
})