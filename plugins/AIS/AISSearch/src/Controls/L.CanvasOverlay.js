/*
  - added _layerAdd, _canvasMargin
  - modified _animateZoom, _reset

  inspired & portions taken from  :  http://bl.ocks.org/Sumbera/11114288, https://github.com/Leaflet/Leaflet.heat
*/

const _canvasMargin = 400;

L.CanvasOverlay = L.Class.extend({

    _layerAdd: function(e){
        L.DomUtil = L.DomUtil || {}; 
        L.DomUtil.getTranslateString = L.DomUtil.getTranslateString || function (t){
            var e = L.Browser.webkit3d, i="translate" + ( e ? "3d" : "") + "(", n=( e ? ",0" : "") + ")"; 
            return i + t.x + "px," + t.y + "px" + n
        };

        var map = e.target;

		// check in case layer gets added and then removed before the map is ready
		if (!map.hasLayer(this)) { return; }

		this._map = map;
		this._zoomAnimated = map._zoomAnimated;

		if (this.getEvents) {
			var events = this.getEvents();
			map.on(events, this);
			this.once('remove', function () {
				map.off(events, this);
			}, this);
		}

		this.onAdd(map);

		if (this.getAttribution && map.attributionControl) {
			map.attributionControl.addAttribution(this.getAttribution());
		}

		this.fire('add');
		map.fire('layeradd', {layer: this});
    },

    fire: function(en){
//console.log(en)
    },

    initialize: function (userDrawFunc, options) {
        this._userDrawFunc = userDrawFunc;
        L.setOptions(this, options);
    },

    drawing: function (userDrawFunc) {
        this._userDrawFunc = userDrawFunc;
        return this;
    },

    params:function(options){
        L.setOptions(this, options);
        return this;
    },
    
    canvas: function () {
        return this._canvas;
    },
/*
    redraw: function () {
console.log('REDRAW', this._frame)
        if (!this._frame) {
            this._frame = L.Util.requestAnimFrame(this._redraw, this);
        }
        return this;
    },    
*/ 
    onAdd: function (map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-aistracks-layer');

        var size = this._map.getSize();
        this._canvas.width = size.x + _canvasMargin;
        this._canvas.height = size.y + _canvasMargin;   

        var animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

        map._panes.overlayPane.appendChild(this._canvas);

        map.on('moveend', this._reset, this);
        map.on('resize',  this._resize, this);

        if (map.options.zoomAnimation && L.Browser.any3d) {
            map.on('zoomanim', this._animateZoom, this);
        }
        
        this._reset();
    },

    onRemove: function (map) {
        map.getPanes().overlayPane.removeChild(this._canvas);
 
        map.off('moveend', this._reset, this);
        map.off('resize', this._resize, this);

        if (map.options.zoomAnimation) {
            map.off('zoomanim', this._animateZoom, this);
        }
        this._canvas = null;
    },

    addTo: function (map) {
        map.addLayer(this);
        return this;
    },

    _resize: function (resizeEvent) {
        this._canvas.width  = resizeEvent.newSize.x + _canvasMargin;
        this._canvas.height = resizeEvent.newSize.y + _canvasMargin;
        this._reset();
    },
    _reset: function () {
        var topLeft = this._map.containerPointToLayerPoint([0, 0]).subtract({x: _canvasMargin/2, y: _canvasMargin/2});
        //L.DomUtil.setPosition(this._canvas, topLeft);
        this._canvas.style['transform'] = L.DomUtil.getTranslateString(topLeft) ;

//console.log('RESET', topLeft, this._canvas.style.transform);
        this._redraw();
    },

    _redraw: function () {
        var size     = this._map.getSize();
        var bounds   = this._map.getBounds();
        var zoomScale = (size.x * 180) / (20037508.34  * (bounds.getEast() - bounds.getWest())); // resolution = 1/zoomScale
        var zoom = this._map.getZoom();
     
        // console.time('process');

        if (this._userDrawFunc) {
            this._userDrawFunc(this,
                                {
                                    canvas   :this._canvas,
                                    bounds   : bounds,
                                    buffer: {
                                        contains: function (pt) {
                                            let w = bounds.getWest(), e = bounds.getEast(),
                                                n = bounds.getNorth(), s = bounds.getSouth();
                                            return s - 0.5 <= pt[0] && pt[0] <= n + 0.5 &&
                                                w - 1 <= pt[1] && pt[1] <= e + 1;
                                        }
                                    },
                                    size     : size,
                                    zoomScale: zoomScale,
                                    zoom : zoom,
                                    options: this.options,
                                    offset: _canvasMargin/2
                               });
        }
       
       
        // console.timeEnd('process');
        
        this._frame = null;
    },

    _animateZoom: function (e) {
        var scale = this._map.getZoomScale(e.zoom),
            //offset = this._map._getCenterOffset(e.center)._multiplyBy(-scale).subtract(this._map._getMapPanePos());
            w = this._canvas.offsetWidth, h = this._canvas.offsetHeight,
            offset;
        
        if (scale == 2)
            offset = this._map.containerPointToLayerPoint([0, 0]).subtract({x: w/2, y: h/2}).subtract({x: _canvasMargin/2, y: _canvasMargin/2});
        else
            offset = this._map.containerPointToLayerPoint([0, 0]).add({x: w/4, y: h/4}).subtract({x: _canvasMargin/2, y: _canvasMargin/2});

        //this._canvas.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
        this._canvas.style['transform'] = L.DomUtil.getTranslateString(offset) + ' scale(' + scale + ')';
    }
});

L.canvasOverlay = function (userDrawFunc, options) {
    return new L.CanvasOverlay(userDrawFunc, options);
};