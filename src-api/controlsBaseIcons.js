// Стандартные контролы
(function()
{
    "use strict";
    var titles = {
        locationTxt: gmxAPI.KOSMOSNIMKI_LOCALIZED("Текущие координаты центра карты", "Current center coordinates")
        ,scaleBarChange: gmxAPI.KOSMOSNIMKI_LOCALIZED("Сменить формат масштаба", "Toggle scale bar format")
        ,coordFormatChange: gmxAPI.KOSMOSNIMKI_LOCALIZED("Сменить формат координат", "Toggle coordinates format")
        ,print: gmxAPI.KOSMOSNIMKI_LOCALIZED("Печать", "Print")
        ,permalink: gmxAPI.KOSMOSNIMKI_LOCALIZED("Постоянная ссылка", "Link to the map")
        ,boxZoom: gmxAPI.KOSMOSNIMKI_LOCALIZED("Увеличение", "BoxZoom")
        ,marker: gmxAPI.KOSMOSNIMKI_LOCALIZED("Маркер", "Marker")
        ,polygon: gmxAPI.KOSMOSNIMKI_LOCALIZED("Многоугольник", "Polygon")
        ,line: gmxAPI.KOSMOSNIMKI_LOCALIZED("Линия", "Line")
        ,rectangle: gmxAPI.KOSMOSNIMKI_LOCALIZED("Прямоугольник", "Rectangle")
        ,toggleVisibility: gmxAPI.KOSMOSNIMKI_LOCALIZED("Показать/Скрыть", "Show/Hide")
    };
    var _mzoom = [
        'M 1:500 000 000',  //  0   156543.03392804
        'M 1:300 000 000',  //  1   78271.51696402 
        'M 1:150 000 000',  //  2   39135.75848201 
        'M 1:80 000 000',   //  3   19567.879241005 
        'M 1:40 000 000',   //  4   9783.9396205025 
        'M 1:20 000 000',   //  5   4891.96981025125 
        'M 1:10 000 000',   //  6   2445.98490512563 
        'M 1:5 000 000',    //  7   1222.99245256281 
        'M 1:2500 000',     //  8   611.496226281406 
        'M 1:1 000 000',    //  9   305.748113140703 
        'M 1:500 000',      //  10  152.874056570352 
        'M 1:300 000',      //  11  76.437028285176 
        'M 1:150 000',      //  12  38.218514142588 
        'M 1:80 000',       //  13  19.109257071294 
        'M 1:40 000',       //  14  9.554628535647 
        'M 1:20 000',       //  15  4.777314267823 
        'M 1:10 000',       //  16  2.388657133912 
        'M 1:5 000',        //  17  1.194328566956 
        'M 1:2 500',        //  18  0.597164283478 
        'M 1:1 250',        //  19  0.298582141739 
        'M 1:625'           //  20  0.149291070869
    ];
    var styleIcon = {        // стиль ноды иконок по умолчанию
        borderRadius: '4px'
        ,display: 'block'
        ,cursor: 'pointer'
        //,width: '30px'
        //,height: '30px'
        ,marginLeft: '6px'
        ,styleFloat: 'left'
        ,cssFloat: 'left'
    };
    var standart = {        // интерфейс для обратной совместимости
        addTool: function (tn, attr) {      // Добавление иконки или оверлея
            //console.log('tool addTool', tn, attr); // wheat
            if(!attr) attr = {};
            var ret = null;
            if(attr.overlay && Controls.items.layers) {
                attr.id = tn;
                if(!attr.rus) attr.rus = attr.hint || attr.id;
                if(!attr.eng) attr.eng = attr.hint || attr.id;
                Controls.items.layers.addOverlay(tn, attr);
                ret = Controls.items.layers;

                // var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                // if(layersControl) ret = layersControl.addOverlay(tn, attr);
            } else {
                ret = Controls.addControl(tn, attr);
                // var controls = gmxAPI.map.controlsManager.getCurrent();
                // if(controls && 'addControl' in controls) {
                    // ret = controls.addControl(tn, attr);
                // }
            }
            return ret;
        }
        ,getToolByName: function(id) {
            return Controls.items[id] || null;
        }
        ,
        removeTool: function(id) {              // Удалить control
            return Controls.removeControl(id);
        }
        ,
        setVisible: function(id, flag) {        // видимость
            var control = Controls.items[id];
        }
        ,
        selectTool: function (id) {
            var control = Controls.items.drawing || Controls.items.gmxDrawing;
            if (id === 'move') {
                return;
            } else if (id === 'POINT') {
                id = 'Point';
            } else if (id === 'POLYGON') {
                id = 'Polygon';
            } else if (id === 'FRAME') {
                id = 'Rectangle';
            } else if (id === 'LINESTRING') {
                id = 'Polyline';
            }

            control.setActive(id);
        }
    };
    var initControls = function() {
        var LMap = gmxAPI._leaflet.LMap,
            outControls = {},
            mbl = gmxAPI.map.baseLayersManager,
            controlsManager = gmxAPI.map.controlsManager;
        var defaultStyle = {
            cursor: 'pointer'
            ,width: '30px'
            ,height: '30px'
            ,clear: 'none'
        }

        // gmxControl - прототип контрола из одной кнопки
        L.Control.gmxControl = L.Control.extend({
            options: {
                isVisible: true,
                id: '',
                onclick: null,
                onAdd: null,
                position: 'topleft'
            }
            ,
            /** Установка видимости контрола.
            * @memberOf gmxControl#
            * @param {boolean} flag - флаг видимости контрола.
            */
            setVisible: function(flag) {
                if(!flag) flag = false;
                if(this._container) {
                    this._container.style.display = flag ? 'block' : 'none';
                }
                this.options.isVisible = flag;
            }
			,
            /** Установка флага активности контрола.
            * @memberOf gmxControl#
            * @param {boolean} flag - флаг активности контрола.
            */
            setActive: function(flag, notToggle) {
                var container = this._container,
                    opt = this.options,
                    isActive = opt.isActive || false;
                if(flag) {
                    if(!notToggle) opt.isActive = true;
                    if(opt.srcHover) this._Image.src = opt.srcHover;
                    L.DomUtil.addClass(container, 'leaflet-control-Active');
                } else {
                    if(!notToggle) opt.isActive = false;
                    if(opt.src) this._Image.src = opt.src;
                    L.DomUtil.removeClass(container, 'leaflet-control-Active');
                }
                if(!notToggle && isActive !== opt.isActive) gmxAPI._listeners.dispatchEvent('onActiveChanged', controlsManager, {id: this.options.id, isActive: opt.isActive, target: this});
            }
            ,
            addTo: function (map) {
                if (this.options.id) Controls.items[this.options.id] = this;
                this._map = map;

                var container = this._container = this.onAdd(map),
                    pos = this.getPosition(),
                    corner = map._controlCorners[pos] || map._controlContainer;

                container.id = this.options.id;
                L.DomUtil.addClass(container, 'leaflet-control');
                L.DomEvent
                    .on(container, 'mousemove', L.DomEvent.stopPropagation);

                if (pos.indexOf('bottom') !== -1) {
                    corner.insertBefore(container, corner.firstChild);
                } else {
                    corner.appendChild(container);
                }

                return this;
            }
			,
            _createDiv: function (container, className, title, fn, context) {
                var link = L.DomUtil.create('div', className, container);
                if(!this.options.isVisible) link.style.display = 'none';
                if(title) link.title = title;

                var stop = L.DomEvent.stopPropagation;

                L.DomEvent
                    .on(link, 'click', stop)
                    .on(link, 'mousedown', stop)
                    .on(link, 'dblclick', stop)
                    .on(link, 'click', L.DomEvent.preventDefault)
                    .on(link, 'click', fn || stop, context);

                return link;
            }
            ,
            _gmxOnClick: function (ev) {
                if(this.options.onclick) this.options.onclick.call(this, {id: this.options.id, target: this});
                gmxAPI._listeners.dispatchEvent('onClick', controlsManager, {id: this.options.id, target: this});
            }
            ,
            _initLayout: function () {
                var className = this.options.className || 'leaflet-control-icons leaflet-control-' + this.options.id;
                var container = this._container = this._createDiv(null, className, this.options.title, this._gmxOnClick, this);
                return container;
            }
            ,
            onAdd: function (map) {
                if (this.options.id) Controls.items[this.options.id] = this;
                var ret = this._initLayout();
                //gmxAPI.setStyleHTML(this._container, this.options.style || defaultStyle);
                if(this.options.onAdd) this.options.onAdd.call(this, ret);
                
                return ret;
            }
            ,setActiveTool: function(flag) {    // обратная совместимость
                this.options.isActive = !flag;
                this._gmxOnClick();
            }
            ,remove: function() {
                var it = Controls.items[this.options.id];
                if (it && this._map) it.removeFrom(this._map);
            }
        });
        /**
         * Описание класса gmxControl.
         * Наследует класс <a href="http://leafletjs.com/reference.html#control">L.Control</a>.
         * @typedef {Object} gmxControl
         * @property {object} options - опции контрола.
         * @property {String} options.id - идентификатор контрола.
         * @property {boolean} options.isVisible - Флаг видимости(по умолчанию true).
         * @property {boolean} options.isActive - Флаг активности(по умолчанию false).
         * @property {Function} options.onclick - Ф-ция обработчик события click(по умолчанию null).
         * @property {Function} options.onAdd - Ф-ция обработчик события добавления контрола к карте(по умолчанию null).
        */
        L.control.gmxControl = function (options) {
          return new L.Control.gmxControl(options);
        }

        // gmxZoom - контрол Zoom
        var gmxZoom = null;
        //if (false && L.Control.gmxZoom) {
        if (L.Control.gmxZoom) {
            gmxZoom = L.control.gmxZoom();
            Controls.items[gmxZoom.options.id] = gmxZoom;
        }
		gmxAPI.map.zoomControl = {
			setVisible: function(flag) {
				gmxZoom.setVisible(flag);
			},
			setZoom: function(z) {
			},
			repaint: function() {
			},
			setMinMaxZoom: function(z1, z2) {
			}
            ,
			getMinZoom: function()
			{
				return gmxAPI.map.getMinZoom();
			},
			getMaxZoom: function()
			{
				return gmxAPI.map.getMaxZoom();
			}
            ,minimize: function(){}
            ,maximize: function(){}
		}

        gmxZoom.addTo(LMap);
        //outControls.gmxZoom = gmxZoom;

        // gmxLayers - контрол слоев
        var gmxLayers = null;
        L.Control.gmxLayers = L.Control.Layers.extend({
            options: {
                current: ''
                ,collapsed: false
                ,isVisible: true
                //,hideBaseLayers: true
            }
            ,
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
            _update: function () {
                //L.Control.Layers.prototype._update.call(this);
                if (!this._container) {
                    return;
                }

                this._baseLayersList.innerHTML = '';
                this._overlaysList.innerHTML = '';

                var overlays = [],
                    i, obj, id,
                    len, hash = {};

                for (i in this._layers) {
                    obj = this._layers[i];
                    if(obj.overlay) overlays.push(obj);
                    hash[obj.layer.id] = obj;
                }
                var activeIDs = mbl.getActiveIDs();
                for (i = 0, len = activeIDs.length; i < len; i++) {
                    id = activeIDs[i];
                    obj = hash[id];
                    if(!obj || (!obj.overlay && !mbl.get(id))) continue;
                    this._addItem(obj);
                }
                if(overlays.length) {
                    for (i = 0, len = overlays.length; i < len; i++) {
                        this._addItem(overlays[i]);
                    }
                }
                len = activeIDs.length + overlays.length;

                var display = overlays.length && activeIDs.length ? '' : 'none';
                if (this.options.hideBaseLayers) {
                    display = 'none';
                    this._baseLayersList.style.display = display;
                    if (overlays.length === 0) len = 0;
                }
                this._container.style.visibility = len > 0 ? 'visible' : 'hidden';
                this._separator.style.display = display;
                if(this.current) this.setCurrent(this.current, true);
            }
            ,setVisible: function(flag) {
                if(!flag) flag = false;
                if(this._container) {
                    this._container.style.display = flag ? 'block' : 'none';
                }
                this.options.isVisible = flag;
            }
            ,
            setVisibility: function (id, flag) {
                var target = this._findTargetByID(id);
                if(target) {
                    target.checked = (flag ? true : false);
                    var item = this._layers[target.layerId];
                    if(item && item.overlay && item.layer) {
                        item.layer.isActive = target.checked;
                        return true;
                    }
                }
                return false;
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
                this.current = null;
                for(var i=0, len = this._form.length; i<len; i++) {
                    var input = this._form[i];
                    if(id == input.layerId) {
                        if(!skipChkInput) this._chkInput(input);
                        this.current = id;
                        input.checked = true;
                    }
                    var item = this._layers[input.layerId];
                    if(item.overlay && item.layer.isActive) input.checked = true;
                }
            }
            ,
            _chkInput: function (target) {
                //var layers = this._layers;
                var layerId = String(target.layerId);
                var isActive = target.checked;
                var item = this._layers[layerId].layer;
                var overlay = item.overlay;
                if(overlay) {
                    if(isActive) {
                        if(item.onClick) item.onClick();
                    } else {
                        if(item.onCancel) item.onCancel();
                    }
                    item.isActive = isActive;
                }
                return layerId;
            }
            ,_listeners: {}
            ,_baseLayersHash: {}
            ,
            onAdd: function (map) {
                if (this.options.id) Controls.items[this.options.id] = this;
                var cont = L.Control.Layers.prototype.onAdd.call(this, map);
                //L.Control.Layers.prototype.onAdd.call(this, map);
                L.DomEvent
                    .on(cont, 'mousemove', L.DomEvent.stopPropagation);
                
                this._container.id = this.options.id;
                var my = this;
                var mbl = gmxAPI.map.baseLayersManager;
                var util = {
                    addBaseLayerTool: function (baseLayer) {
                        var id = baseLayer.id;
                        var name = gmxAPI.KOSMOSNIMKI_LOCALIZED(baseLayer.rus, baseLayer.eng) || id;
                        my.addBaseLayer(baseLayer, name);
                    }
                    ,
                    chkExists: function() {     // Получить уже установленные подложки
                        var activeIDs = mbl.getActiveIDs();
                        for (var i = 0, len = activeIDs.length; i < len; i++) {
                            var id = activeIDs[i];
                            var baseLayer = mbl.get(id);
                            if(baseLayer)  {
                                util.addBaseLayerTool(baseLayer);
                            }
                        }
                        mbl.setCurrentID(mbl.getCurrentID());
                    }
                    ,
                    onActiveChanged: function() {
                        var i, obj, id,
                            len, hash = {};

                        for (i in my._layers) {
                            obj = my._layers[i];
                            hash[obj.layer.id] = obj;
                        }
                        var activeIDs = mbl.getActiveIDs();
                        for (var i = 0, len = activeIDs.length; i < len; i++) {
                            var id = activeIDs[i];
                            var baseLayer = mbl.get(id);
                            if(baseLayer) {
                                delete hash[id];
                                util.addBaseLayerTool(baseLayer);
                            }
                        }
                        for (i in hash) {
                            obj = hash[i];
                            my.removeLayer(obj);
                        }
                    }
                }

                var key = 'onAdd';
                this._listeners[key] = mbl.addListener(key, util.onActiveChanged);
                key = 'onLayerChange';
                this._listeners[key] = mbl.addListener(key, util.onActiveChanged);
                key = 'onActiveChanged';
                this._listeners[key] = mbl.addListener(key, util.onActiveChanged);

                key = 'onSetCurrent';
                this._listeners[key] = mbl.addListener(key, function(bl) {
                    if(!bl || !mbl.isActiveID(bl.id)) {
                        for(var i=0, len = my._form.length; i<len; i++) {
                            var input = my._form[i];
                            var item = my._layers[input.layerId];
                            if(!item.overlay) input.checked = false;
                        }
                        my.current = '';
                        return;
                    }
                    //bl.isVisible = true;
                    if(!bl._leaflet_id) util.addBaseLayerTool(bl);
                    my.setCurrent(bl._leaflet_id);
                });
                key = 'onRemove';
                this._listeners[key] = mbl.addListener(key, function(bl) {
                    var layer = my._layers[bl._leaflet_id];
                    my.removeLayer(layer);
                    delete my._layers[bl._leaflet_id];
                    my._update();
                });

                util.chkExists();
                return this._container;
            },
            onRemove: function (map) {
                L.Control.Layers.prototype.onRemove.call(this, map);
                var mbl = gmxAPI.map.baseLayersManager;
                for(var key in this._listeners) mbl.removeListener(key, this._listeners[key]);
                this._listeners = {};
                delete Controls.items.layers;
            }
            ,
            getControl: function (id) {       // Получить контрол
                var my = this;
                for (i in my._layers) {
                    var layer = this._layers[i].layer;
                    var obj = this._layers[i];
                    if (layer.overlay && id === layer.id) {
                        return layer;
                    }
                }
                return null;
            }
            ,
            addOverlayTool: function (id, attr) {       // совместимость c addTool
                var my = this;
                var name = gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng) || id;
                attr.overlay = true;
                attr.getIndex = function () {
                    return my._overlaysList.childNodes.length;
                }

                attr.setActiveTool = function (flag) {
                    if (flag) {
                        this.onClick();
                    } else {
                        this.onCancel();
                    }
                    my.setVisibility(id, flag);
                }

                this.addOverlay(attr, name);
                return {
                    id: id
                    ,layer: attr
                    ,setActiveTool: function (flag) {
                        return attr.setActiveTool(flag);
                    }
                    ,setVisible: function(flag) {
                        if('setVisible' in my) my.setVisible(flag);
                        else if(my._container) my._container.style.display = flag ? 'block' : 'none';
                    }
                    ,remove: function() {
                        my.removeFrom(gmxAPI._leaflet.LMap);
                    }
                };
            }
        });
        /**
         * Описание класса L.control.gmxLayers.
         * Наследует класс <a href="http://leafletjs.com/reference.html#control-layers">L.Control.Layers</a>.
         * @typedef {Object} gmxLayers
         * @property {object} options - опции контрола.
         * @property {String} options.id - идентификатор контрола.
        */
        L.control.gmxLayers = function (options) {
          return new L.Control.gmxLayers({}, {}, options);
        }
        gmxLayers = L.control.gmxLayers({id:'layers'});
        gmxLayers.addTo(LMap);
        //outControls.layers = gmxLayers;
        //gmxAPI._leaflet.gmxLayers = gmxLayers;

        // HideControls - кнопка управления видимостью всех контролов
        var hideControls = null;
        if (L.Control.gmxHide) {
            hideControls = L.control.gmxHide();
            hideControls.on('click', function (ev) {
                var control = ev.target;
                gmxAPI._listeners.dispatchEvent('onChangeControlsVisibility', gmxAPI.map, control.options.isVisible);
            });
            Controls.items[hideControls.options.id] = hideControls;
        }
        gmxAPI.extend(gmxAPI.map.allControls, {
            setVisible: function(flag) {
                hideControls.setActive(flag);
            },
            minimize: function() {
                this.setVisible(false);
            },
            maximize: function() {
                this.setVisible(true);
            }
        });

        LMap.addControl(hideControls);

        // BottomBG - подвал background
        var bottomBG = L.control.gmxBottom();
        bottomBG.addTo(LMap);
        Controls.items[bottomBG.options.id] = bottomBG;

        var gmxLogo = L.control.gmxLogo();
        Controls.items[gmxLogo.options.id] = gmxLogo;
        gmxLogo.addTo(LMap);
        
        // LocationControls - 
        var locationControl = L.control.gmxLocation({id: 'locationControl'});
        Controls.items[locationControl.options.id] = locationControl;
        locationControl.addTo(LMap);

        gmxAPI.map.scaleBar = {
            setVisible: function(flag) {}
        };
        gmxAPI.map.coordinates = {
            setVisible: function(flag) { }
            ,
            addCoordinatesFormat: function(func) { }
            ,
            removeCoordinatesFormat: function(num) { }
            ,
            setFormat: function(num) { }
        }

        // CopyrightControls - Copyright
        var copyrightControls = null;
        // if (false && L.Control.gmxCopyright) {
        if (L.Control.gmxCopyright) {
            copyrightControls = L.control.gmxCopyright({mapCopyright: gmxAPI.map.properties.Copyright || ''});
            Controls.items[copyrightControls.options.id] = copyrightControls;
            gmxAPI.map.addListener('scaleBarRepainted', function(width) {
                LMap.fire('onChangeLocationSize', {locationSize: width});
            });
            var util = {
                addItem: function(obj, copyright, z1, z2, geo) {
                    util.removeItem(obj, copyright);
                    var bounds = null;
                    if (geo) {
                        bounds = gmxAPI.getBounds(geo.coordinates);
                    } else if (obj.geometry) {
                        bounds = obj.bounds || gmxAPI.getBounds(obj.geometry.coordinates);
                    }
                    if (!z1) z1 = 0;
                    if (!z2) z2 = 100;
                    if (!obj.gmxCopyright) obj.gmxCopyright = [];
                    obj.gmxCopyright.push({
                        attribution: copyright,
                        minZoom: z1,
                        maxZoom: z2,
                        bounds: bounds ? L.latLngBounds(L.latLng(bounds.minY, bounds.minX), L.latLng(bounds.maxY, bounds.maxX)) : null
                    });
                    var node = gmxAPI._leaflet.mapNodes[obj.objectId];
                    if (node.leaflet) {
                        node.leaflet.options.gmxCopyright = obj.gmxCopyright;
                    }
                    copyrightControls._redraw();
                    return true;
                }
                ,
                removeItem: function(obj, copyright) {
                    if (obj.gmxCopyright) {
                        var arr = [];
                        obj.gmxCopyright.forEach(function(item, i) {
                            if(copyright && copyright !== item.attribution) {
                                arr.push(item);
                            }
                        });
                        obj.gmxCopyright = arr;
                        var node = gmxAPI._leaflet.mapNodes[obj.objectId];
                        if (node.leaflet) {
                            node.leaflet.options.gmxCopyright = obj.gmxCopyright;
                        }
                    }
                }
            };
            gmxAPI.extend(gmxAPI.map, {
                addCopyrightedObject: function(obj, copyright, z1, z2, geo) {
                    copyrightControls.setMapCopyright(copyright);
                    //util.addItem(obj, copyright, z1, z2, geo);
                }
                ,removeCopyrightedObject: function(obj) {
                    copyrightControls.setMapCopyright('');
                    // util.removeItem(obj);
                    // copyrightControls._redraw();
                }
                ,setCopyrightVisibility: function(obj) {
                    //copyrightControl.setVisible(obj);
                } 
                ,updateCopyright: function() {
                    copyrightControls._redraw();
                } 
                ,setCopyrightAlign: function(attr) {    // Изменить позицию контейнера копирайтов
                    //if(attr.align) copyrightControl.copyrightAlign = attr.align;
                    //copyrightControl.setPosition();
                }
            });
        }
        copyrightControls.addTo(LMap);
        //outControls.copyrightControls = copyrightControls;

        // PrintControl - кнопка печати
        var printControl = null;
            printControl = L.control.gmxControl({
                title: titles.print
                ,id: 'print'
                //,type: 'print'
                ,isVisible: false
            });
            printControl.addTo(LMap);
            printControl.setVisible(false);

        // PermalinkControl - кнопка пермалинка
        var permalinkControl = null;
        // if (L.Control.gmxIcon) {
            // permalinkControl = new L.Control.gmxIcon({
                // id: 'permalink',
                // title: L.gmxLocale.addText({
                    // 'eng': {
                        // 'permalink': 'Link to the map'
                    // },
                    // 'rus': {
                        // 'permalink': 'Пермалинк'
                    // }
                // }).getText('permalink'),
                // onAdd: function (control) {
                    // control._container.style.backgroundImage = 'url("img/iconControls.png")';
                    // control._container.style.backgroundPosition = '-534px -33px';
                // }
             // })
              // .on('click', function (ev) {
                    // var control = ev.target;
                    // gmxAPI._listeners.dispatchEvent('onClick', controlsManager, {id: control.options.id, target: control});
            // });
            // permalinkControl.setVisible = function () {};
            // Controls.items[permalinkControl.options.id] = permalinkControl;
        // } else {
            permalinkControl = L.control.gmxControl({
                title: titles.permalink
                ,isVisible: false
                ,id: 'permalink'
            });
        // }
        permalinkControl.addTo(LMap);
        permalinkControl.setVisible(false);
        //outControls.permalinkControl = permalinkControl;

        // DrawingZoomControl - кнопка boxZoom
        var drawingZoomControl = null;
        if (L.Control.gmxIcon) {
            drawingZoomControl = new L.Control.gmxIcon({
                id: 'boxzoom',
                togglable: true,
                // style: {backgroundImage: 'url("http://maps.kosmosnimki.ru/api/img/iconControls.png")', backgroundPosition: '-627px -33px'},
                // styleActive: {backgroundPosition: '-627px -2px'},
                title: L.gmxLocale.addText({
                    'eng': {
                        'boxZoom': 'BoxZoom'
                    },
                    'rus': {
                        'boxZoom': 'Увеличение'
                    }
                }).getText('boxZoom'),
                onAdd: function (control) {
                    //console.log('onAdd', this, arguments);
                    var map = control._map,
                        _onMouseDown = map.boxZoom._onMouseDown;
                    map.boxZoom._onMouseDown = function (e) {
                        _onMouseDown.call(map.boxZoom, {
                            clientX: e.clientX,
                            clientY: e.clientY,
                            which: 1,
                            shiftKey: true
                        });
                    }
                    map.on('boxzoomend', function () {
                        map.dragging.enable();
                        map.boxZoom.removeHooks();
                        control.setActive(false);
                    });
                    // control._container.style.backgroundImage = 'url("img/iconControls.png")';
                    // control._container.style.backgroundPosition = '-627px -33px';
                }
             })
              .on('statechange', function (ev) {
                    //console.log('statechange', arguments, ev.target.options.isActive);
                    var control = ev.target,
                        map = control._map;
                    if (control.options.isActive) {
                        map.dragging.disable();
                        map.boxZoom.addHooks();
                    } else {
                        map.dragging.enable();
                        map.boxZoom.removeHooks();
                    }
              });
            Controls.items[drawingZoomControl.options.id] = drawingZoomControl;
        }
        drawingZoomControl.addTo(LMap);
        //outControls.drawingZoomControl = drawingZoomControl;

        var gmxDrawing = null;
        // if (false) {
        if (L.Control.gmxDrawing) {
            var drawOptions = {
                iconUrl: 'http://maps.kosmosnimki.ru/api/img/flag_blau1.png',
                popupAnchor: [2, -18],
                iconSize: [33, 41],
                iconAnchor: [6, 36]
            };
            gmxDrawing = L.control.gmxDrawing({drawOptions: drawOptions});
            gmxAPI._drawing.needListeners(LMap.gmxDrawing);
            Controls.items[gmxDrawing.options.id] = gmxDrawing;
            gmxDrawing.on('activechange', function () {
                gmxAPI._drawing.activeState = gmxDrawing.activeIcon ? true : false;
            });
        }
        gmxDrawing.addTo(LMap);
        //outControls.gmxDrawing = gmxDrawing;

        //gmxAPI.extend(Controls.controlsHash, outControls);

        //Управление ToolsAll
        (function()
        {
            //Управление ToolsAll
            function ToolsAll(cont)
            {
                this.toolsAllCont = gmxAPI._allToolsDIV;
                gmxAPI._toolsContHash = {};
            }
            gmxAPI._ToolsAll = ToolsAll;

            function ToolsContainer(name, attr) {
                //console.log('ToolsContainer', name, attr);
                if(!attr) attr = {};
                var cont = {
                    items: {}
                    ,addTool: function (tn, attr) {
                        //console.log('tool addTool', tn, attr); // wheat
                        if(!attr) attr = {};
                        var item = {};
                        var ret = null;
                        if(attr.overlay && Controls.items.layers) {
                            attr.id = tn;
                            if(!attr.rus) attr.rus = attr.hint || attr.id;
                            if(!attr.eng) attr.eng = attr.hint || attr.id;
                            
                            var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                            if(layersControl) {
                                ret = layersControl.addOverlayTool(tn, attr);
                                item.overlay = true;
                            }
                        } else {
                            ret = Controls.addControl(tn, attr);
                            item.icon = true;
                        }
                        gmxAPI._tools[tn] = ret;
                        item.res = ret;
                        cont.items[tn] = item;
                        return ret;
                    }
                    ,remove: function() {
                        var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                        for (var tn in cont.items) {
                            var tool = cont.items[tn];
                            if (tool.res)  {
                                if (tool.overlay) layersControl.removeLayer(tool.res.layer);
                                else {
                                    Controls.removeControl(tn);
                                }
                            }
                        }
                    }
                    ,setToolIndex: function() {
                    }
                    ,removeTool: function(tn) {
                        Controls.removeControl(tn);
                    }
                };
                return cont;
            }
            gmxAPI._ToolsContainer = ToolsContainer;
        })();
        
        if('_ToolsAll' in gmxAPI) {
            this.toolsAll = new gmxAPI._ToolsAll(parent);
        }
        gmxAPI._tools = {
            standart: standart
        }
        var attr = {
            'properties': { 'className': 'gmxTools' }
            ,
            'style': { }
            ,
            'contType': 2	// режим отключения выбора item
        };

        var baseLayersTools = new gmxAPI._ToolsContainer('baseLayers', attr);
        gmxAPI.baseLayersTools = baseLayersTools;

        return Controls.items;
    };

    /**
     * Описание класса Controls.
     * @constructor Controls
     * @property {String} id - Идентификатор набора контролов.
     * @property {boolean} isVisible - Флаг видимости(по умолчанию true).
     * @property {hash} items - список контролов(ниже перечислены создаваемые в API контролы по умолчанию).
     * @property {L.Control.hideControls} items.hide - <a href="global.html#hideControls">контрол управления видимостью</a>.
     * @property {L.Control.gmxLayers} items.layers - <a href="global.html#gmxLayers">контрол слоев</a>.
     * @property {L.Control.gmxZoom} items.gmxZoom - <a href="global.html#gmxZoom">контрол Zoom</a>.
     * @property {L.Control.Drawing} items.gmxDrawing - <a href="global.html#Drawing">контрол рисования геометрий</a>.
     * @property {L.Control.LocationControls} items.locationControl - <a href="global.html#LocationControls">контрол отображения текущего положения карты</a>.
     * @property {L.Control.CopyrightControls} items.copyrightControls - <a href="global.html#CopyrightControls">контрол копирайтов</a>.
     * @property {L.Control.gmxControl} items.print - контрол печати.
     * @property {L.Control.gmxControl} items.permalink - контрол пермалинка.
     * @property {L.Control.gmxControl} items.drawingZoom - контрол зуммирования по прямоугольнику.
     * @property {L.Control.gmxControl} items.drawingPoint - контрол установки маркера.
    */
	var Controls = {
        id: 'controlsBaseIcons'
        ,isVisible: true
        ,items: {}
        ,
        /** Получить контрол по его идентификатору
        * @memberOf Controls#
        * @param {String} id идентификатор контрола.
        * @returns {Control| null} возвращает контрол либо null если контрол с данным идентификатором не найден
        */
        getControl: function(id) {
            var control = this.items[id] || null;
            if (!control) {
                control = this.items.layers.getControl(id) || null;
            }
            return control;
        }
        ,
        /** Добавить контрол
        * @memberOf Controls#
        * @param {String} id - идентификатор контрола.
        * @param {Object} pt - атрибуты контрола.
        * @param {String} pt.regularImageUrl - URL иконки контрола.
        * @param {String} pt.activeImageUrl - URL иконки при наведении мыши.
        * @param {Object} pt.style - регулярный стиль контрола.
        * @param {Object} pt.hoverStyle - стиль при наведении мыши.
        * @param {String} pt.rus - наименование русскоязычное(по умолчанию равен id).
        * @param {String} pt.eng - наименование англоязычное(по умолчанию равен id).
        * @param {Function} pt.onClick - функция при включении активности контрола (по умолчанию null).
        * @param {Function} pt.onCancel - функция при выключении активности контрола (по умолчанию null).
        * @returns {Control|null} созданный контрол либо null если контрол с данным идентификатором уже существует.
        */
        addControl: function(id, pt) {
            if(!id) id = pt.id;
            if(Controls.items[id]) return null; // такой контрол уже имеется
            var title = pt.title || pt.hint;
			var attr = {
                id: id
                ,rus: pt.rus || title
                ,eng: pt.eng || title
                ,notToggle: pt.notToggle || false
                ,style: gmxAPI.extend(pt.style, styleIcon)
                ,hoverStyle: pt.hoverStyle
            };
            var className = 'leaflet-control-' + id,
                imageClassName = 'leaflet-control-Image';

            if(pt.regularImageUrl) {
                attr.src = pt.regularImageUrl;
                // attr.style = {
                    // position: 'relative'
                    // ,background: 'rgba(154, 154, 154, 0.7)'
                // };
            }
            if(pt.activeImageUrl) {
                attr.srcHover = pt.activeImageUrl;
                // attr.hoverStyle = {
                    // position: 'relative'
                    // ,background: 'rgba(154, 154, 154, 1)'
                // };
            }
            if(pt.onClick) attr.onClick = pt.onClick;
            if(pt.onCancel) attr.onCancel = pt.onCancel;
            else if(pt.onClick) attr.onCancel = pt.onClick;

            //if(pt.overlay) attr.onCancel = pt.onCancel;
            if(!attr.src) {     // Текстовый контрол
                className += ' leaflet-control-Text';
                if(pt.innerHTML) attr.innerHTML = pt.innerHTML;
                else {
                    attr.innerHTML = gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng)
                }
            } else {
                className += ' leaflet-control-userIcons';
                if (!pt.style) {
                    className += ' leaflet-control-ImageAuto';
                }
            }

            // Добавление пользовательского контрола
            var userControl = null;
            if (L.Control.gmxIcon) {
                var it = {
                    id: id,
                    title: gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng),
                    togglable: !attr.notToggle
                    // ,
                    // style: attr.style,
                    // hoverStyle: attr.hoverStyle
                };
                if(attr.src) {
                    it.regularImageUrl = attr.src;
                } else {
                    it.text = it.title;
                    it.style = {width: 'auto'};
                }
                if(attr.srcHover) {
                    it.activeImageUrl = attr.srcHover;
                }
                userControl = new L.Control.gmxIcon(it)
                  .on('click', function (ev) {
                        var control = ev.target;
                        if(!control.options.togglable || control.options.isActive) {
                            if(attr.onClick) attr.onClick.call(control);
                        } else {
                            if(attr.onCancel) attr.onCancel.call(control);
                        }
                        gmxAPI._listeners.dispatchEvent('onClick', gmxAPI.map.controlsManager, {id: control.options.id, target: control});
                });
            } else {
                userControl = L.control.gmxControl({
                    title: gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng)
                    ,isActive: false
                    ,notToggle: attr.notToggle || false
                    ,style: {}
                    ,className: className
                    ,src: attr.src || null
                    ,srcHover: attr.srcHover || null
                    ,onFinishID: null
                    ,id: id
                    ,onAdd: function() {
                        if (this.options.id) Controls.items[this.options.id] = this;
                        var my = this,
                            container = this._container;
                        if(attr.innerHTML) {
                            container.innerHTML = attr.innerHTML;
                            L.DomUtil.addClass(container, 'leaflet-control-Text');
                        } else if(pt.regularImageUrl) {
                            gmxAPI.setStyleHTML(this._container, attr.style);
                            this._Image = L.DomUtil.create('img', imageClassName);
                            container.appendChild(this._Image);
                            L.DomUtil.addClass(container, className);
                            //L.DomUtil.addClass(container, 'leaflet-control-userIcons');
                        }
                        L.DomEvent.on(container, 'mouseover', function (e) {
                            my.setActive(true, true);
                        });
                        L.DomEvent.on(container, 'mouseout', function (e) {
                            if(!my.options.isActive) my.setActive(false, true);
                        });
                        this.setActive(false);
                    }
                    ,onclick: function(e) {
                        var container = this._container;
                        if(!this.options.isActive) {
                            if(attr.onClick) attr.onClick.call(this);
                            this.setActive(true, this.options.notToggle);
                        } else {
                            if(attr.onCancel) attr.onCancel.call(this);
                            this.setActive(false, this.options.notToggle);
                        }
                    }
                });
            }
            userControl.addTo(gmxAPI._leaflet.LMap);
            Controls.items[id] = userControl;
            return userControl;
        }
        ,
        /** Удаление контрола по его идентификатору.
        * @memberOf Controls#
        * @param {String} id идентификатор контрола.
        * @returns {Control} возвращает удаленный контрол либо null если он не найден
        */
        removeControl: function (id) {
            var control = this.items[id];
            if(control && control._map && 'removeFrom' in control) control.removeFrom(control._map);
            delete this.items[id];
            return control;
        }
        ,
        /** Удаление набора контролов.
        * @memberOf Controls#
        */
        remove: function() {      // удаление
            for(var key in this.items) {
                var item = this.items[key];
                if('remove' in item) item.remove();
            }
            this.items = {};
        }
        ,
        setControl: function(id, control) {
            if(Controls.items[id]) return false;
            Controls.items[id] = control;
            control.addTo(gmxAPI._leaflet.LMap);
            return true;
        }
        ,initControls: initControls
	}
    if(!gmxAPI._controls) gmxAPI._controls = {};
    gmxAPI._controls[Controls.id] = Controls;
})();
