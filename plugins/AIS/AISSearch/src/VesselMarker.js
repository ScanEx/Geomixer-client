L.Canvas.include({
    _updateVesselMarker: function (layer) {
        if (!this._drawing || layer._empty()) { return; }

        var p = layer._point,
            ctx = this._ctx,
            r = Math.max(Math.round(layer._radius), 1);

        this._drawnLayers[layer._leaflet_id] = layer;

        ctx.strokeStyle = 'red'
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
        //ctx.stroke();
        this._fillStroke(ctx, layer);

        let img = layer.options.img,
        cog = layer.options.cog;
        if (img && cog) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(cog * Math.PI / 180.0);
            ctx.drawImage(img, -(img.width / 2), -(img.height / 2))
            ctx.restore();
        }
    }
});

var VesselMarker = L.CircleMarker.extend({
    _updatePath: function () {
        this._renderer._updateVesselMarker(this);
    }
    // , _containsPoint: function(p) {
    //     return L.CircleMarker.prototype._containsPoint.call(this, p.subtract([0, 10]));
    // }
});

const vesselMarker = function (p, options) {
    return new VesselMarker(p, options);
}

module.exports = vesselMarker;