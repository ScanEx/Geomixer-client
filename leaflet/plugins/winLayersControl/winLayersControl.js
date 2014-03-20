(function(){
    "use strict";
    if(!window.gmxAPI) window.gmxAPI = {};
    window.gmxAPI.addMyLayersControl = function() {
		var apiHost = gmxAPI.getAPIFolderRoot();
        gmxAPI.loadCSS(apiHost + "leaflet/plugins/winLayersControl/winLayersControl.css");
        //gmxAPI.loadCSS(apiHost + "http://localhost/api/leaflet/plugins/winLayersControl/winLayersControl.css");
        var mbl = gmxAPI.map.baseLayersManager;     // manager базовых подложек
        var types = {   // 2 типа подложек map и satellite
            map: 'map'
            ,OSM: 'map'
            ,satellite: 'satellite'
            ,hidryd: 'satellite'
        };
        
        // gmxLayers - контрол слоев
        L.Control.gmxLayersWindow = L.Control.gmxLayers.extend({
            _initLayout: function () {
                var className = 'leaflet-control-layers',
                    container = this._container = L.DomUtil.create('div', className);

                //Makes this work on IE10 Touch devices by stopping it from firing a mouseout event when the touch is released
                container.setAttribute('aria-haspopup', true);

                if (!L.Browser.touch) {
                    L.DomEvent.disableClickPropagation(container);
                    L.DomEvent.on(container, 'mousewheel', L.DomEvent.stopPropagation);
                } else {
                    L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
                }

                var form = this._form = L.DomUtil.create('form', 'overlays');
                //var form = this._form = L.DomUtil.create('form', className + '-list overlays');

                if (this.options.collapsed) {
                    if (!L.Browser.android) {
                        L.DomEvent
                            .on(container, 'mouseover', this._expand, this)
                            .on(container, 'mouseout', this._collapse, this);
                    }
                    var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
                    link.href = '#';
                    link.title = 'Layers';

                    if (L.Browser.touch) {
                        L.DomEvent
                            .on(link, 'click', L.DomEvent.stop)
                            .on(link, 'click', this._expand, this);
                    }
                    else {
                        L.DomEvent.on(link, 'focus', this._expand, this);
                    }

                    this._map.on('click', this._collapse, this);
                    // TODO keyboard accessibility
                } else {
                    this._expand();
                }

                this._baseLayersList = L.DomUtil.create('div', className + '-base', container);
                this._baseLayersList1 = L.DomUtil.create('div', className + '-base1', container);
                this.arrow = L.DomUtil.create('div', 'arrow', container);
                // var stop = L.DomEvent.stopPropagation;
                // L.DomEvent
                    // .on(this._baseLayersList, 'mouseover', stop)
                    // .on(this._baseLayersList, 'mouseout', stop);
                this._separator = L.DomUtil.create('div', className + '-overlaysSelector', form);
                this._separatorSpan = L.DomUtil.create('span', '', this._separator);
                this._separatorSpan.innerHTML = gmxAPI.KOSMOSNIMKI_LOCALIZED("Слои", "Layers");
                this._overlaysList = L.DomUtil.create('div', className + '-overlays', form);
                this._overlaysList.style.display = 'none';
                L.DomEvent
                    .on(form, 'mouseover', function () {this._overlaysList.style.display = 'block'; }, this)
                    .on(form, 'mouseout', function () {this._overlaysList.style.display = 'none'; }, this);

                this._toggle = function (flag) {
                    if(flag) L.DomUtil.addClass(this.arrow, 'arrVert');
                    else L.DomUtil.removeClass(this.arrow, 'arrVert');
                    for(var i = 1, len = this._baseLayersList.childNodes.length; i < len; i++) {
                        this._baseLayersList.childNodes[i].style.display = flag ? 'block' : 'none';
                    }
                    for(var i = 1, len = this._baseLayersList1.childNodes.length; i < len; i++) {
                        this._baseLayersList1.childNodes[i].style.display = flag ? 'block' : 'none';
                    }
                    if(!this.current) return;
                    var item = this._layers[this.current];
                    if(item && !item.overlay) {
                        if(item._type === 'map') {
                            this._baseLayersList.style.display = 'none';
                            this._baseLayersList1.style.display = 'block';
                        } else {
                            this._baseLayersList.style.display = 'block';
                            this._baseLayersList1.style.display = 'none';
                        }
                    }
                };
                L.DomEvent
                    .on(this._baseLayersList, 'mouseover', function () {this._toggle(true); }, this)
                    .on(this._baseLayersList, 'mouseout', function () {this._toggle(false); }, this)
                    .on(this._baseLayersList1, 'mouseover', function () {this._toggle(true); }, this)
                    .on(this._baseLayersList1, 'mouseout', function () { this._toggle(false); }, this);

                container.appendChild(form);
            },
            _update: function () {
                this._baseLayersList1.innerHTML = '';
                L.Control.Layers.prototype._update.call(this);
                
                var setEmpty = function () {
                    mbl.setCurrentID('');
                    this._toggle(false);
                }
                var itemDiv = L.DomUtil.create('div', 'empty', this._baseLayersList);
                var name = L.DomUtil.create('div', 'name', itemDiv);
                name.innerHTML = 'Пустая';
                L.DomEvent.on(itemDiv, 'click', setEmpty, this);
                itemDiv = L.DomUtil.create('div', 'empty', this._baseLayersList1);
                name = L.DomUtil.create('div', 'name', itemDiv);
                name.innerHTML = 'Пустая';
                L.DomEvent.on(itemDiv, 'click', setEmpty, this);
                this._toggle(false);
            },
            _addItem: function (obj) {
                var className = '',
                    layer = obj.layer,
                    id = layer.id;

                var container = obj.overlay;
                if(!obj.overlay) {
                    obj._type = layer.type || types[id] || 'satellite';
                    container = (obj._type === 'map' ? this._baseLayersList : this._baseLayersList1);
                    var itemDiv = L.DomUtil.create('div', id, container);
                    if(layer.style) gmxAPI.setStyleHTML(itemDiv, layer.style);

                    var name = L.DomUtil.create('div', 'name', itemDiv);
                    name.innerHTML = ' ' + obj.name;
                    L.DomEvent.on(itemDiv, 'click', this._onInputClick, this);
                    itemDiv.layerId = L.stamp(obj.layer);
                    //this._form.push(itemDiv);
                    return itemDiv;
                }

                var label = document.createElement('label'),
                    input,
                    checked = this._map.hasLayer(obj.layer);

                if (obj.overlay) {
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    input.className = 'leaflet-control-layers-selector';
                    input.defaultChecked = checked;
                } else {
                    input = this._createRadioElement('leaflet-base-layers', checked);
                }

                input.layerId = L.stamp(obj.layer);

                L.DomEvent.on(input, 'click', this._onInputClick, this);

                var name = document.createElement('span');
                name.innerHTML = ' ' + obj.name;

                label.appendChild(input);
                label.appendChild(name);

                var container = obj.overlay ? this._overlaysList : this._baseLayersList;
                container.appendChild(label);

                return label;
            },
            _onInputClick: function (ev) {
                var layerId = this._chkInput(ev.target);
                if(!this._layers[layerId].overlay) {
                    if(this.current != layerId) {
                        this.current = layerId;
                        ev.target.checked = true;
                    } else {
                        this.current = null;
                        ev.target.checked = false;
                    }
                    mbl.setCurrentID((this.current ? this._layers[layerId].layer.id : ''));
                }
            }
            ,
            _findTargetByID: function (id) {  // Найти input поле подложки или оверлея
                for(var i=0, len = this._form.length; i<len; i++) {
                    var target = this._form[i];
                    var item = this._layers[target.layerId];
                    if(item && item.layer && id == item.layer.id) return target;
                }
                return null;
            }
            ,
            setCurrent: function (id, skipChkInput) {
                var arr = this._form;
                if(this._layers[id] && !this._layers[id].overlay) {
                    arr = [];
                    for(var i=0, len = this._baseLayersList.childNodes.length; i<len; i++) arr.push(this._baseLayersList.childNodes[i]);
                    for(var i=0, len = this._baseLayersList1.childNodes.length; i<len; i++) arr.push(this._baseLayersList1.childNodes[i]);
                }
                for(var i=0, len = arr.length; i<len; i++) {
                    var input = arr[i];
                    if(id == input.layerId) {
                        if(!skipChkInput) this._chkInput(input);
                        this.current = id;
                        input.checked = true;
                    }
                    var item = this._layers[input.layerId];
                    if(item && item.overlay && item.layer.isActive) input.checked = true;
                }
                this._toggle(false);
            }
        });
        L.control.gmxLayersWindow = function (options) {
          return new L.Control.gmxLayersWindow({}, {}, options);
        }
        var gmxLayers = L.control.gmxLayersWindow({
            collapsed: false
        });
        return gmxLayers;
    };
})();
