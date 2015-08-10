// WWF Alarm raster layer. Extends L.TileLayer.Canvas
// Layer creation:
//   new L.WWFAlarm(<layerID>, <mapID>)
L.WWFAlarm = L.TileLayer.Canvas.extend({
    options: {
        async: true
    },
    _tileTemplate: 'http://maps.kosmosnimki.ru/TileService.ashx?request=gettile&NearestNeighbor=true&layername={layerID}&srs=EPSG:3857&z={z}&x={x}&y={y}&format=png&Map={mapID}',
    _minDate: 1,
    _maxDate: 365,
    _lossThreshold: 0,
    _confThreshold: 0,
    initialize: function(layerID, mapID, options) {
        this._layerID = layerID;
        this._mapID = mapID;
        L.Util.setOptions(this, options);
        this._colorTable = L.WWFAlarm.genPalette(365);
    },
    drawTile: function(canvas, tilePoint, zoom) {
        var img = new Image(),
            ct = this._colorTable;
        
        img.onload = function() {
            var ctx = canvas.getContext('2d');
            
            ctx.drawImage(img, 0, 0);
            
            var imgData = ctx.getImageData(0, 0, 256, 256),
                data = imgData.data,
                minVal = this._minDate,
                maxVal = this._maxDate,
                lossTh = this._lossThreshold,
                confTh = this._confThreshold;
            
            for (var p = 0; p < 256*256*4; p += 4) {
                var v = data[p] + (data[p+1]&0xf << 8);
                var c = data[p+1] >> 6;
                if (v >= minVal && v <= maxVal && data[p+2] >= lossTh && (data[p+1] >> 6) >= confTh) {  
                    data[p+0] = ct[4*v+0];
                    data[p+1] = ct[4*v+1];
                    data[p+2] = ct[4*v+2];
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
            layerID: this._layerID,
            mapID: this._mapID
        });
    },
    
    //dateBegin, dateEnd - number of days since beginning of the year (1 - January 1, etc)
    setDateInterval: function(dateBegin, dateEnd) {
        this._minDate = dateBegin;
        this._maxDate = dateEnd;
        this.redraw();
        return this;
    },
    
    //lossThreshold - 0-100
    setLossThreshold: function(lossThreshold) {
        this._lossThreshold = lossThreshold;
        this.redraw();
        return this;
    },
    
    //confThreshold - 0-3
    setConfThreshold: function(confThreshold) {
        this._confThreshold = confThreshold;
        this.redraw();
        return this;
    }
})

L.WWFAlarm.genPalette = function(size) {
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = 1;
    
    L.WWFAlarm.drawPalette(canvas);
    
    var ctxData = canvas.getContext('2d').getImageData(0, 0, size, 1).data;
    return Array.prototype.slice.call(ctxData);
}

L.WWFAlarm.drawPalette = function(canvas) {
    var ctx = canvas.getContext('2d');

    var grad = ctx.createLinearGradient(0,0,canvas.width-1,0);
    grad.addColorStop(0, 'blue');
    grad.addColorStop(1/3, 'cyan');
    grad.addColorStop(2/3, 'yellow');
    grad.addColorStop(1, 'red');
    
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,canvas.width, canvas.height);
}