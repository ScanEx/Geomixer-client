// WWF Alarm raster layer. Extends L.TileLayer.Canvas
// Layer creation:
//   new L.WWFAlarm(<layerID>, <mapID>)
L.WWFAlarm = L.TileLayer.Canvas.extend({
    options: {
        async: true
    },
    _tileTemplate: 'http://maps.kosmosnimki.ru/TileService.ashx?request=gettile&layername={layerID}&srs=EPSG:3857&z={z}&x={x}&y={y}&format=png&Map={mapID}',
    _minDate: 1,
    _maxDate: 365,
    _probThreshold: 0,
    initialize: function(layerID, mapID, options) {
        this._layerID = layerID;
        this._mapID = mapID;
        L.Util.setOptions(this, options);
    },
    drawTile: function(canvas, tilePoint, zoom) {
        var img = new Image();
        
        img.onload = function() {
            var ctx = canvas.getContext('2d');
            
            ctx.drawImage(img, 0, 0);
            
            var imgData = ctx.getImageData(0, 0, 256, 256),
                data = imgData.data,
                minVal = this._minDate,
                maxVal = this._maxDate,
                th = this._probThreshold,
                coeff = 256/365;
            
            for (var p = 0; p < 256*256*4; p += 4) {
                var v = data[p] + data[p+1];
                if (v >= minVal && v <= maxVal && data[p+2] >= th) {
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
    
    //probThreshold - 0-100
    setProbabilityThreshold: function(probThreshold) {
        this._probThreshold = probThreshold;
        this.redraw();
        return this;
    }
})