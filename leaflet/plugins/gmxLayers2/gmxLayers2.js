L.Control.GmxLayers2 = L.Control.Layers.extend({
    options: {
        collapsed: true,
        autoZIndex: false,
        id: 'layers'
    },

    initialize: function (baseLayers, overlays, options) {
        L.Control.Layers.prototype.initialize.call(this, baseLayers, overlays, options);
    },
    onAdd: function (map) {
        L.Control.Layers.prototype.onAdd.call(this, map);
        this._initLayout();
        this._update();

        map
            .on('layeradd', this._onLayerChange, this)
            .on('layerremove', this._onLayerChange, this);

            this._iconClick = function () {
                if (this._iconContainer) {
                    this.setActive(!this.options.isActive);
                    this._update();
                    if (this.options.stateChange) { this.options.stateChange(this); }
                }
            };
            var stop = L.DomEvent.stopPropagation;
            L.DomEvent
                .on(this._iconContainer, 'mousemove', stop)
                .on(this._iconContainer, 'touchstart', stop)
                .on(this._iconContainer, 'mousedown', stop)
                .on(this._iconContainer, 'dblclick', stop)
                .on(this._iconContainer, 'click', stop)
                .on(this._iconContainer, 'click', this._iconClick, this);

        return this._container;
    },

    _initLayout: function () {
        var controlClassName = 'leaflet-control-layers2',
            prefix = 'leaflet-gmx-iconSvg',
            iconClassName =  prefix + ' ' + prefix + '-overlays svgIcon',
            listClassName = 'leaflet-control-layers',
            container = this._container = L.DomUtil.create('div', controlClassName),
            iconContainer = this._iconContainer = L.DomUtil.create('div', iconClassName),
            listContainer = this._listContainer = L.DomUtil.create('div', listClassName);

        var openingDirection = this.options.direction || 'bottom';

        L.DomUtil.addClass(listContainer, listClassName + '-' + openingDirection);
        if (this.options.title) { this._iconContainer.title = this.options.title; }

		this._prefix = prefix;

        //Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
        container.setAttribute('aria-haspopup', true);

        if (!L.Browser.touch) {
            L.DomEvent
                .disableClickPropagation(container)
                .disableScrollPropagation(container);
        } else {
            L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
        }

        var placeHolder = this._placeHolder = L.DomUtil.create('div', 'layers-placeholder');
        placeHolder.innerHTML = this.options.placeHolder;

        var form = this._form = L.DomUtil.create('form', listClassName + '-list');

        if (this.options.collapsed) {

          var useHref = '#' + 'overlays';
          iconContainer.innerHTML = '<svg role="img" class="svgIcon">\
              <use xlink:href="' + useHref + '"></use>\
            </svg>';

            var link = this._layersLink = L.DomUtil.create('a', '', listContainer);
            link.href = '#';
            link.title = 'Layers';

            if (L.Browser.touch) {
                L.DomEvent
                    .on(iconContainer, 'click', L.DomEvent.stop)
                    .on(iconContainer, 'click', this._expand, this);
            }
            //Work around for Firefox android issue https://github.com/Leaflet/Leaflet/issues/2033
            L.DomEvent.on(form, 'click', function () {
                setTimeout(L.bind(this._onInputClick, this), 0);
            }, this);

            this._map.on('click', this._collapse, this);
        } else {
            this._expand();
        }

        this._baseLayersList = L.DomUtil.create('div', listClassName + '-base', form);
        this._separator = L.DomUtil.create('div', listClassName + '-separator', form);
        this._overlaysList = L.DomUtil.create('div', listClassName + '-overlays', form);

        listContainer.appendChild(form);
        listContainer.appendChild(placeHolder);
        container.appendChild(iconContainer);
        container.appendChild(listContainer);
    },


    _addItemObject: function (obj) {
        var label = this._addItem(obj);
        if (obj.layer && obj.layer._gmx && obj.layer._gmx.layerID) {
            label.className = '_' + obj.layer._gmx.layerID;
        }
    },

    _update: function () {
        if (!this._listContainer) {
            return;
        }
        var options = this.options;

        if (!options.isActive) {
            this._form.style.display = 'none';
            this._placeHolder.style.display = 'none';
            return;
        }

        this._baseLayersList.innerHTML = '';
        this._overlaysList.innerHTML = '';

        var baseLayersPresent = false,
            overlaysPresent = false,
            i, len, obj;

        for (i in this._layers) {
            obj = this._layers[i];
            if (obj.overlay) {
                this._addItemObject(obj);
                overlaysPresent = true;
            } else {
                baseLayersPresent = true;
            }
        }

        this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
        this._form.style.display = overlaysPresent || baseLayersPresent ? '' : 'none';
        this._placeHolder.style.display = overlaysPresent || baseLayersPresent ? 'none' : '';
    },

    setActive: function (active, skipEvent) {
        var options = this.options,
            togglable = options.togglable || options.toggle;
        if (togglable) {
            var prev = options.isActive,
                prefix = this._prefix,
                className = prefix + '-' + options.id,
                container = this._iconContainer;

            options.isActive = active;
            if (active) {
                L.DomUtil.addClass(container, prefix + '-active');
                L.DomUtil.addClass(container, className + '-active');
                if (container.children.length) {
                    L.DomUtil.addClass(container, prefix + '-externalImage-active');
                }
                if (options.styleActive) { this.setStyle(options.styleActive); }

        		L.DomUtil.addClass(this._listContainer, 'leaflet-control-layers-expanded');
            } else {
                L.DomUtil.removeClass(container, prefix + '-active');
                L.DomUtil.removeClass(container, className + '-active');
                if (container.children.length) {
                    L.DomUtil.removeClass(container, prefix + '-externalImage-active');
                }
                if (options.style) { this.setStyle(options.style); }
                L.DomUtil.removeClass(this._listContainer, 'leaflet-control-layers-expanded');
            }
        }
    },

    addTo: function (map) {
        // L.Control.prototype.addTo.call(this, map);
        L.Control.GmxIcon.prototype.addTo.call(this, map);
        if (this.options.addBefore) {
            this.addBefore(this.options.addBefore);
        }
        return this;
    },

    addBefore: function (id) {
        var parentNode = this._parent && this._parent._container;
        if (!parentNode) {
            parentNode = this._map && this._map._controlCorners[this.getPosition()];
        }
        if (!parentNode) {
            this.options.addBefore = id;
        } else {
            for (var i = 0, len = parentNode.childNodes.length; i < len; i++) {
                var it = parentNode.childNodes[i];
                if (id === it._id) {
                    parentNode.insertBefore(this._container, it);
                    break;
                }
            }
        }
        return this;
    }
});

L.Control.gmxLayers2 = L.Control.GmxLayers2;
L.control.gmxLayers2 = function (baseLayers, overlays, options) {
  return new L.Control.GmxLayers2(baseLayers, overlays, options);
};
