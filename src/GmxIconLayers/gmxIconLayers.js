window.nsGmx.Translations.addText('rus', {
    gmxIconLayers: {
        zoominpls: 'Приблизьте карту, чтобы активировать слой',
        zoomoutpls: 'Отдалите карту, чтобы активировать слой'
    }
});

window.nsGmx.Translations.addText('eng', {
    gmxIconLayers: {
        zoominpls: 'Zoom in to enable layer',
        zoomoutpls: 'Zoom out to enable layer'
    }
});

window.L.Control.GmxIconLayers = window.L.Control.IconLayers.extend({
    _updateLayers: function() {
        var lang = nsGmx && nsGmx.Translations && nsGmx.Translations.getLanguage() || 'rus';
        var blm = this._baseLayersManager;
        var layers = blm.getActiveIDs().map(function(id) {
            var layer = blm.get(id);
            if (!layer) {
                return null;
            } else {
                return {
                    layer: layer,
                    icon: layer.options.icon,
                    title: layer.options[lang]
                }
            }
        }).filter(function(e) {
            return e;
        });

        this.setLayers(layers);
        this.setActiveLayer(
            blm.get(
                blm.getCurrentID()
            )
        );

        this._updateDisabledLayers();
    },
    _updateDisabledLayers: function() {
        this._disabledLayerIds = this._map ? this._baseLayersManager.getActiveIDs().map(function(id) {
            return this._baseLayersManager.get(id);
        }.bind(this)).filter(function(l) {
            return !!l && (this._map.getZoom() < l.options.minZoom || this._map.getZoom() > l.options.maxZoom);
        }.bind(this)).map(function(l) {
            return L.stamp(l) + '';
        }) : [];
        this._updateDisabledLayersStyle();
    },
    _updateDisabledLayersStyle: function() {
        var els = this._container ? this._container.getElementsByClassName('leaflet-iconLayers-layerCell') : [];

        Array.prototype.slice.call(els).map(function(el) {
            var elId = el.getAttribute('data-layerid');
            if (this._disabledLayerIds.indexOf(elId) + 1) {
                L.DomUtil.addClass(el, 'leaflet-iconLayers-layerCell_disabled');
            } else {
                L.DomUtil.removeClass(el, 'leaflet-iconLayers-layerCell_disabled');
            }
        }.bind(this));
    },
    _updatePopoversContent: function() {
        var els = this._container ? this._container.getElementsByClassName('leaflet-iconLayers-layerCell') : [];

        var defaultTemplate = (new $.fn.popover.Constructor()).getDefaults().template;

        function createPopover(el, text) {
            $(el).popover({
                viewport: {
                    selector: this._map && this._map.getContainer(),
                    padding: 10
                },
                container: this._map && this._map.getContainer(),
                content: text,
                trigger: 'manual',
                placement: this.options.position.indexOf('bottom') != -1 ? 'top' : 'bottom',
                html: true,
                template: $(defaultTemplate).css('pointer-events', 'none')[0].outerHTML
            });
            if (el.mouseIsOver) {
                $(el).popover('show');
            }
        }

        Array.prototype.slice.call(els).map(function(el) {
            var elId = el.getAttribute('data-layerid');
            var layerEl = el.getElementsByClassName('leaflet-iconLayers-layer')[0];
            var layer = this._layers[elId].layer;
            if (layer.options.maxZoom && this._map && this._map.getZoom() > layer.options.maxZoom) {
                $(layerEl).popover('destroy');
                createPopover.call(this, layerEl, nsGmx.Translations.getText('gmxIconLayers.zoomoutpls'));
            } else if (layer.options.minZoom && this._map && this._map.getZoom() < layer.options.minZoom) {
                $(layerEl).popover('destroy');
                createPopover.call(this, layerEl, nsGmx.Translations.getText('gmxIconLayers.zoominpls'));
            } else if (layer.options.description) {
                $(layerEl).popover('destroy');
                createPopover.call(this, layerEl, layer.options.description);
            } else {
                $(layerEl).popover('destroy');
            }
        }.bind(this));
    },
    _createLayerElement: function(layerObj) {
        var layer = layerObj.layer;
        var el = L.Control.IconLayers.prototype._createLayerElement.call(this, layerObj);
        var shutterEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerShutter');
        $(el).prepend(shutterEl);
        el.addEventListener('mouseover', function(e) {
            e.currentTarget.mouseIsOver = true;
            $(e.currentTarget).popover('show');
        });
        el.addEventListener('mouseout', function(e) {
            e.currentTarget.mouseIsOver = false;
            $(e.currentTarget).popover('hide');
        });
        return el;
    },
    _render: function() {
        L.Control.IconLayers.prototype._render.apply(this, arguments);
        this._updateDisabledLayers();
        this._updatePopoversContent();
    },
    _onLayerClick: function(e) {
        e.stopPropagation();
        $(e.currentTarget).find('.leaflet-iconLayers-layer').popover('hide')
        var layerId = e.currentTarget.getAttribute('data-layerid');
        if (this._disabledLayerIds.indexOf(layerId) === -1) {
            var layer = this._layers[layerId];
            this.setActiveLayer(layer.layer);
        }
        this.expand();
    },
    initialize: function(gmxBaseLayersManager, options) {
        L.Control.IconLayers.prototype.initialize.call(this, [], L.extend(options || {}, {
            manageLayers: false
        }));

        this._baseLayersManager = gmxBaseLayersManager;
        this._updateLayers();

        this.on('activelayerchange', function(le) {
            this._baseLayersManager.setCurrentID(le.layer.id);
        }.bind(this));

        this._baseLayersManager.on('baselayeradd', this._updateLayers.bind(this));
        this._baseLayersManager.on('baselayerremove', this._updateLayers.bind(this));
        this._baseLayersManager.on('baselayeractiveids', this._updateLayers.bind(this));
        this._baseLayersManager.on('baselayerchange', this._updateLayers.bind(this));
        this._baseLayersManager.on('baselayerlayerschange', this._updateLayers.bind(this));
    },
    onAdd: function() {
        var container = L.Control.IconLayers.prototype.onAdd.apply(this, arguments);
        this._map.on('zoomend', function() {
            this._updateDisabledLayers();
            this._updatePopoversContent();
        }.bind(this));
        return container;
    }
});
