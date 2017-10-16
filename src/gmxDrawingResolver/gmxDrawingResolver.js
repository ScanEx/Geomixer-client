var nsGmx = nsGmx || {};

nsGmx.leafletMap.gmxControlIconManager

var gmxDrawingResolver = function (icons) {
    onAdd: function (map) {
        var _this = this;
        this.setActive = function (key) {
            if (map.gmxDrawing) {
                map.gmxDrawing.bringToFront();
                map.gmxDrawing.create(key, _this.options.drawOptions);
            }
        };
        this.on('activechange', function (ev) {
            var activeIcon = ev.activeIcon;
            for (var i = 0, len = drawingIcons.length; i < len; i++) {
                if (activeIcon === drawingIcons[i]) {
                    return;
                }
            }
            _this.setActive();
        });

        if (map.gmxDrawing) {
            map.gmxDrawing.on('drawstop', function (ev) {
                var opt = ev.object._obj.options || {};
                if (!opt.ctrlKey && !opt.shiftKey) {
                    _this.setActiveIcon();
                } else {
                    _this.setActive(ev.object.options.type);
                }
            }, this);
        }
        var addIcon = function (key) {
            return L.control.gmxIcon({
                id: key,
                //className: 'leaflet-gmx-icon-sprite',
                title: _this._locale && 'getText' in _this._locale ? _this._locale.getText(key) : key,
                togglable: true
              })
              .on('statechange', function (ev) {
                var opt = ev.target.options,
                    id = opt.id;

                if (id === _this.activeIcon) {
                    _this.setActive();
                } else if (opt.isActive) {
                    _this.setActive(id);
                }
            });
        };
        var defaultIcons = this.options.items || drawingIcons;
        this.options.items = [];
        defaultIcons.forEach(function (it) {
            _this.options.items.push(it instanceof L.Control.GmxIcon ? it : addIcon(it));
        });
        return L.Control.GmxIconGroup.prototype.onAdd.call(this, map);
    }
}
