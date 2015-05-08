L.WWFAlarm = L.TileLayer.Canvas.extend({
    options: {
        async: true
    },
    _tileTemplate: 'http://maps.kosmosnimki.ru/TileService.ashx?request=gettile&layername={layerID}&srs=EPSG:3857&z={z}&x={x}&y={y}&format=png&Map={mapID}',
    
    drawTile: function(canvas, tilePoint, zoom) {
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
                    data[p+0] = Math.floor((365-v)*coeff);
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
        
        img.crossOrigin = 'Anonymous';
        
        img.src = L.Util.template(this._tileTemplate, {
            x: tilePoint.x,
            y: tilePoint.y,
            z: zoom,
            layerID: 'C53699CEACAF4D8AB0ACF1A4D152D85A',
            mapID: '1D116AC56D694C0B8CDCA87C06D1961A'
        });
    },
    setDateInterval: function(dateBegin, dateEnd) {
        this._minDate = dateBegin;
        this._maxDate = dateEnd;
        this.redraw();
        return this;
    }
})