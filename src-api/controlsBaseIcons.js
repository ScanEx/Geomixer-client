// Стандартные контролы
(function()
{
    "use strict";
    var titles = {
        locationTxt: gmxAPI.KOSMOSNIMKI_LOCALIZED("Текущие координаты центра карты", "Current center coordinates")
        ,coordFormatChange: gmxAPI.KOSMOSNIMKI_LOCALIZED("Сменить формат координат", "Toggle coordinates format")
        ,print: gmxAPI.KOSMOSNIMKI_LOCALIZED("Печать", "Print")
        ,permalink: gmxAPI.KOSMOSNIMKI_LOCALIZED("Пермалинк", "Link to the map")
        ,boxZoom: gmxAPI.KOSMOSNIMKI_LOCALIZED("Увеличение", "BoxZoom")
        ,marker: gmxAPI.KOSMOSNIMKI_LOCALIZED("Маркер", "Marker")
        ,polygon: gmxAPI.KOSMOSNIMKI_LOCALIZED("Полигон", "Polygon")
        ,line: gmxAPI.KOSMOSNIMKI_LOCALIZED("Линия", "Line")
        ,rectangle: gmxAPI.KOSMOSNIMKI_LOCALIZED("Рамка", "Rectangle")
        ,toggleVisibility: gmxAPI.KOSMOSNIMKI_LOCALIZED("Показать/Скрыть", "Show/Hide")
    }
    var styleIcon = {        // стиль ноды иконок по умолчанию
        backgroundImage: "url('../../api/img/iconeControls.png')"
        ,borderRadius: '4px'
        ,display: 'block'
        ,cursor: 'pointer'
        ,width: '30px'
        ,height: '30px'
        ,marginLeft: '6px'
        ,styleFloat: 'left'
        ,cssFloat: 'left'
    };
    var standart = {        // интерфейс для обратной совместимости
        addTool: function (tn, attr) {      // Добавление иконки или оверлея
            //console.log('tool addTool', tn, attr); // wheat
            if(!attr) attr = {};
            var ret = null;
            if(attr.overlay && Controls.controlsHash.layers) {
                attr.id = tn;
                if(!attr.rus) attr.rus = attr.hint || attr.id;
                if(!attr.eng) attr.eng = attr.hint || attr.id;
                
                Controls.controlsHash.layers.addOverlay(tn, attr);
                ret = Controls.controlsHash.layers;

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
            return Controls.controlsHash[id] || null;
        }
        ,
        removeTool: function(id) {              // Удалить control
            return Controls.removeControl(id);
        }
        ,
        setVisible: function(id, flag) {        // видимость
            var control = Controls.controlsHash[id];
        }
        ,
        selectTool: function (id) {
            var control = Controls.controlsHash[id];
        }
    };
    var initControls = function() {
        var outControls = {};
        var mbl = gmxAPI.map.baseLayersManager;
        var controlsManager = gmxAPI.map.controlsManager;
        var defaultStyle = {
            //backgroundImage: 'url("../../api/img/iconeControls.png")'
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
            addTo: function (map) {
                Controls.controlsHash[this.options.id] = this;
                this._map = map;

                var container = this._container = this.onAdd(map),
                    pos = this.getPosition(),
                    corner = map._controlCorners[pos] || map._controlContainer;

                L.DomUtil.addClass(container, 'leaflet-control');

                if (pos.indexOf('bottom') !== -1) {
                    corner.insertBefore(container, corner.firstChild);
                } else {
                    corner.appendChild(container);
                }

                return this;
            }
			,setVisible: function(flag) {
                if(!flag) flag = false;
                if(this._container) {
                    this._container.style.display = flag ? 'block' : 'none';
                }
                this.options.isVisible = flag;
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
                Controls.controlsHash[this.options.id] = this;
                var ret = this._initLayout();
                //gmxAPI.setStyleHTML(this._container, this.options.style || defaultStyle);
                if(this.options.onAdd) this.options.onAdd.call(this, ret);
                
                return ret;
            }
            ,setActive: function(flag, notToggle) {
                var container = this._container,
                    opt = this.options;
                if(flag) {
                    if(!notToggle) opt.isActive = true;
                    if(opt.srcHover) this._Image.src = opt.srcHover;
                    L.DomUtil.addClass(container, 'leaflet-control-Active');
                } else {
                    if(!notToggle) opt.isActive = false;
                    if(opt.src) this._Image.src = opt.src;
                    L.DomUtil.removeClass(container, 'leaflet-control-Active');
                }
            }
            ,setActiveTool: function(flag) {    // обратная совместимость
                this.setActive(flag);
            }
            ,getInterface: function() {
                return this;
            }
        });
        L.control.gmxControl = function (options) {
          return new L.Control.gmxControl(options);
        }

        // gmxZoom - контрол Zoom
        L.Control.gmxZoom = L.Control.Zoom.extend({
            options: {
                current: ''
                ,collapsed: false
                ,zoomslider: true
                ,isVisible: true
                ,stepY: 7
            }
            ,_y_min: 9              // min Y слайдера
            ,isDragging: false      // min Y слайдера
            ,_listeners: {}
            ,
            onAdd: function (map) {
                Controls.controlsHash[this.options.id] = this;
                var zoomName = 'gmx_zoomParent',
                    container = L.DomUtil.create('div', zoomName);

                this._map = map;
                this._zoomPlaque = L.DomUtil.create('div', 'gmx_zoomPlaque', container);

                this._zoomInButton  = this._createDiv(container, 
                        'gmx_zoomPlus',  'Zoom in',  this._zoomIn,  this);
                this._zoomOutButton = this._createDiv(container, 
                        'gmx_zoomMinus', 'Zoom out', this._zoomOut, this);

                map.on('zoomend zoomlevelschange', this._updateDisabled, this);
                if(this.options.zoomslider) {
                    this._chkZoomLevelsChange(container);
                }
/*                var key = 'onMinMaxZoom';
                this._listeners[key] = gmxAPI.map.addListener(key, function(ph) {
                    this._chkZoomLevelsChange(container);
                    var attr = ph.attr;
                    // zoomControl.minZoom = attr.minZoom;
                    // zoomControl.maxZoom = attr.maxZoom;
                    // zoomControl.setZoom(attr.currZ);
                    // zoomControl.repaint();
                });
*/
                return container;
            }
            ,
            _createDiv: function (container, className, title, fn, context) {
                var link = L.DomUtil.create('div', className, container);
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
            onRemove: function (map) {
                map.off('zoomend zoomlevelschange', this._updateDisabled, this);
            }
            ,
            _setPosition: function () {
                var my = this,
                    MinZoom = my._map.getMinZoom(),
                    y = my._y_max - (my._zoom - MinZoom) * 7;

                my._zoomVal.innerHTML = my._zoom;
                L.DomUtil.setPosition(my._zoomPointer, L.point(4, y));
            }
            ,
            _getZoomByY: function (y) {
                if(y < this._y_min) y = this._y_min;
                else if(y > this._y_max) y = this._y_max;

                return 0 + Math.floor((this._y_max - y) / this.options.stepY);
            }
            ,
            _setSliderSize: function () {
                var my = this,
                    map = my._map,
                    MinZoom = map.getMinZoom(),
                    MaxZoom = map.getMaxZoom(),
                    delta = MaxZoom - MinZoom;
                var height = 7 * (delta + 1);
                my._y_max = height + 3;
                my._zoomSliderBG.style.height = height + 'px';
                height += 66;
                if(my._zoomSliderCont.style.display !== 'block') height = 60;
                my._zoomPlaque.style.height = height + 'px';
            }
            ,
            _chkZoomLevelsChange: function (container) {
                var my = this,
                    map = my._map,
                    MinZoom = map.getMinZoom(),
                    MaxZoom = map.getMaxZoom();

                if(MinZoom !== my._MinZoom || MaxZoom !== my._MaxZoom) {
                    var delta = MaxZoom - MinZoom;
                    if(delta > 0) {
                        if(!my._zoomSliderCont) {
                            my._zoomSliderCont  = my._createDiv(container, 'gmx_sliderCont');
                            my._zoomSliderBG  = my._createDiv(my._zoomSliderCont, 'gmx_sliderBG');
                            L.DomEvent.on(my._zoomSliderBG, 'click', function (ev) {
                                my._zoom = my._getZoomByY(ev.layerY) + map.getMinZoom();
                                my._map.setZoom(my._zoom);
                            }, my);
                            my._zoomPointer  = my._createDiv(my._zoomSliderCont, 'gmx_zoomPointer');
                            my._zoomVal  = my._createDiv(my._zoomPointer, 'gmx_zoomVal');
                            L.DomEvent.on(container, 'mouseover', function (ev) {
                                my._zoomSliderCont.style.display = 'block';
                                my._setSliderSize();
                            });
                            var mouseout = function () {
                                my._zoomSliderCont.style.display = 'none';
                                my._setSliderSize();
                            };
                            L.DomEvent.on(container, 'mouseout', function (ev) {
                                if(my._draggable._moving) return;
                                mouseout();
                            });
                            var draggable = new L.Draggable(my._zoomPointer);
                            draggable.on('drag', function (ev) {
                                var pos = ev.target._newPos;
                                my._zoom = my._getZoomByY(pos.y) + map.getMinZoom();
                                my._setPosition();
                            });
                            draggable.on('dragend', function (ev) {
                                my._map.setZoom(my._zoom);
                                mouseout();
                            });
                            draggable.enable();
                            my._draggable = draggable;
                        }
                        my._setSliderSize();
                    }
                    my._MinZoom = MinZoom, my._MaxZoom = MaxZoom;
                }
                my._zoom = map._zoom;
                my._setPosition();
            }
            ,
            _updateDisabled: function (ev) {
                var map = this._map,
                    className = 'leaflet-disabled';

                L.DomUtil.removeClass(this._zoomInButton, className);
                L.DomUtil.removeClass(this._zoomOutButton, className);

                if (map._zoom === map.getMinZoom()) {
                    L.DomUtil.addClass(this._zoomOutButton, className);
                }
                if (map._zoom === map.getMaxZoom()) {
                    L.DomUtil.addClass(this._zoomInButton, className);
                }
                this._zoom = map._zoom;
                if(this.options.zoomslider) {
                    if(ev.type === 'zoomlevelschange') this._chkZoomLevelsChange(this._container);
                    this._setPosition();
                }
            }
			,setVisible: function(flag) {
                if(this._container) {
                    this._container.style.display = flag ? 'block' : 'none';
                }
            }
        });
        L.control.gmxZoom = function (options) {
          return new L.Control.gmxZoom(options);
        }
        var gmxZoom = L.control.gmxZoom({
            id: 'gmxZoom'
        });

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

        gmxZoom.addTo(gmxAPI._leaflet.LMap);
        //outControls.gmxZoom = gmxZoom;

        // gmxLayers - контрол слоев
        L.Control.gmxLayers = L.Control.Layers.extend({
            options: {
                current: ''
                ,collapsed: false
                ,isVisible: true
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
                    mbl.setCurrent((this.current ? this._layers[layerId].layer.id : ''));
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

                var baseLayersPresent = false,
                    overlaysPresent = false,
                    i, obj,
                    len, arr = [];

                for (i in this._layers) {
                    obj = this._layers[i];
                    arr.push(obj);
                }
                arr.sort(function (a,b) {
                    var n1 = a.layer.getIndex();
                    var n2 = b.layer.getIndex();
                    return n1 - n2;
                });
                for (i = 0, len = arr.length; i < len; i++) {
                    obj = arr[i];
                    this._addItem(obj);
                    overlaysPresent = overlaysPresent || obj.overlay;
                    baseLayersPresent = baseLayersPresent || !obj.overlay;
                }
                this._container.style.display = len > 0 ? 'block' : 'none';

                this._separator.style.display = overlaysPresent && baseLayersPresent ? '' : 'none';
                
                if(this.current) this.setCurrent(this.current, true);
            }
            ,
            setIndex: function (ph, index) {
                var layerId = ph._leaflet_id;
if(!layerId) return;
                var overlay = this._layers[layerId].overlay;
                var cont = overlay ? this._baseLayersList : this._baseLayersList;
                if(index < 0) index = 0;
                
                for(var i=0, len = cont.childNodes.length; i<len; i++) {
                    var node = cont.childNodes[i];
                    var control = node.control;
                    if(layerId == control.layerId) {
                        if(index >= len - 1) {
                            cont.appendChild(node);
                        } else {
                            var before = cont.childNodes[index + 1];
                            cont.insertBefore(node, before);
                        }
                        break;
                    }
                }
                for(var i=0, baseLayerIndex = 0, overlayIndex = 0, len = cont.childNodes.length; i<len; i++) {
                    var node = cont.childNodes[i];
                    var control = node.control;
                    var obj = this._layers[control.layerId];
                    if(obj.overlay) {
                        obj.layer.index = overlayIndex++;
                    } else {
                        obj.layer.index = baseLayerIndex++;
                    }
                }
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
                Controls.controlsHash[this.options.id] = this;
                L.Control.Layers.prototype.onAdd.call(this, map);
                
                var my = this;
                var mbl = gmxAPI.map.baseLayersManager;
                var util = {
                    addBaseLayerTool: function (ph) {
                        if(!ph.isVisible) return;
                        var id = ph.id;
                        if (!my._baseLayersHash[id]) {
                            my._baseLayersHash[id] = ph;
                        }
                        var baseLayer = my._baseLayersHash[id];
                        var name = gmxAPI.KOSMOSNIMKI_LOCALIZED(baseLayer.rus, baseLayer.eng) || id;
                        var layers = baseLayer.layers || [];
                        //if(layers.length > 0) {
                            ph.index = my._baseLayersList.childNodes.length;
                            my.addBaseLayer(baseLayer, name);
                        //}
                    }
                    ,
                    chkExists: function() {     // Получить уже установленные подложки
                        var arr = mbl.getAll();
                        for(var i=0, len = arr.length; i<len; i++) {
                            if(arr[i].isVisible !== false) util.addBaseLayerTool(arr[i]);
                        }
                        var id = mbl.getCurrentID();
                        if(my._baseLayersHash[id]) my._baseLayersHash[id].select();
                    }
                    ,
                    onIndexChange: function(ph) {
                        var id = ph.id;
                        var index = ph.getIndex();
                        my.setIndex(ph, index);
                    }
                    ,
                    onVisibleChange: function(ph) {
                        var id = ph.id;
                        if(!ph.isVisible) {
                            my.removeLayer(ph);
                            if(my.current === id) my.current = null;
                       
                        } else {
                            var name = gmxAPI.KOSMOSNIMKI_LOCALIZED(ph.rus, ph.eng) || id;
                            if(ph.overlay) my.addOverlay(ph, name);
                            else util.addBaseLayerTool(ph);
                        }
                    }
                }

                var key = 'onAdd';
                this._listeners[key] = mbl.addListener(key, util.addBaseLayerTool);
                key = 'onLayerChange';
                this._listeners[key] = mbl.addListener(key, util.addBaseLayerTool);
                key = 'onVisibleChange';
                this._listeners[key] = mbl.addListener(key, util.onVisibleChange);
                key = 'onIndexChange';
                this._listeners[key] = mbl.addListener(key, util.onIndexChange);
                key = 'onSetCurrent';
                this._listeners[key] = mbl.addListener(key, function(bl) {
                    if(!bl) return;
                    bl.isVisible = true;
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
            }
            ,
            onRemove: function (map) {
                L.Control.Layers.prototype.onRemove.call(this, map);
                var mbl = gmxAPI.map.baseLayersManager;
                for(var key in this._listeners) mbl.removeListener(key, this._listeners[key]);
                this._listeners = {};
                delete Controls.controlsHash.layers;
            }
            ,getInterface: function() {
                var my = this;
                return {
                    addOverlay: function (id, attr) {
                        this.id = id;
                        gmxAPI._tools[id] = this;
                        var name = gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng) || id;
                        attr.overlay = true;
                        attr.getIndex = function () {
                            return my._overlaysList.childNodes.length;
                        }
                        my.addOverlay(attr, name);
                    }
                    ,setActiveTool: function (flag) {
                        return my.setVisibility(this.id, flag);
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
        L.control.gmxLayers = function (options) {
          return new L.Control.gmxLayers({}, {}, options);
        }
        var gmxLayers = L.control.gmxLayers({id:'layers'});
        gmxLayers.addTo(gmxAPI._leaflet.LMap);
        //outControls.layers = gmxLayers;
        //gmxAPI._leaflet.gmxLayers = gmxLayers;

        // HideControls - кнопка управления видимостью всех контролов
        L.Control.hideControls = L.Control.gmxControl.extend({
            setVisibility: function (flag, allFlag) {
                this.options.isVisible = flag;
                for(var key in Controls.controlsHash) {
                    var item = Controls.controlsHash[key];
                    if(item != this || allFlag) {
                        //if('setVisible' in item) item.setVisible(flag);
                        //else 
                        if(item._container) item._container.style.display = flag && item.options.isVisible ? 'block' : 'none';
                        else {
                            console.warn('hideControls', item);
                        }
                    }
                }
            }
            ,
            _toggleVisible: function (e) {
                L.DomEvent.stopPropagation(e);
                var flag = !this.options.isVisible;
                this.setVisibility(flag);
                // this.options.isVisible = flag;
                // for(var key in Controls.controlsHash) {
                    // var item = Controls.controlsHash[key];
                    // if(item != this) {
                        // if('setVisible' in item) item.setVisible(flag);
                        // else if(item._container) item._container.style.display = flag ? 'block' : 'none';
                        // else {
                            // console.warn('hideControls', item);
                        // }
                    // }
                // }
            }
        });
        L.control.hideControls = function (options) {
          return new L.Control.hideControls(options);
        }

        var hideControls = L.control.hideControls({
            title: titles.toggleVisibility
            ,id: 'hide'
            ,onclick: function(e) {
                this._toggleVisible(e);
            }
        });
        gmxAPI.extend(gmxAPI.map.allControls, {
            setVisible: function(flag) {
                hideControls.setVisibility(flag, true);
            },
            minimize: function() {
                this.setVisible(false);
            },
            maximize: function() {
                this.setVisible(true);
            }
        });

        hideControls.addTo(gmxAPI._leaflet.LMap);
        //outControls.hideControls = hideControls;

        // BottomBG - подвал background
        L.Control.BottomBG = L.Control.gmxControl.extend({
            onAdd: function (map) {
                Controls.controlsHash[this.options.id] = this;
                var className = 'gmx_copyright_location',
                    container = L.DomUtil.create('div', className);

                L.DomUtil.create('div', className + '_bg', container);
                this._map = map;

                return container;
            }
        });
        var bottomBG = new L.Control.BottomBG({
            className: 'gmx_copyright_location_bg'
            ,id: 'bottomBG'
            ,position: 'bottom'
        });
        bottomBG.addTo(gmxAPI._leaflet.LMap);
        //outControls.bottomBG = bottomBG;

        // LocationControls - 
        L.Control.LocationControls = L.Control.gmxControl.extend({
            onAdd: function (map) {
                Controls.controlsHash[this.options.id] = this;
                var className = 'gmx_location',
                    container = L.DomUtil.create('div', className),
                    my = this;

                this.locationTxt = L.DomUtil.create('span', 'gmx_locationTxt', container);
                this.locationTxt.title = titles.locationTxt;
                this.coordFormatChange = L.DomUtil.create('span', 'gmx_coordFormatChange', container);
                this.coordFormatChange.title = titles.coordFormatChange;
                this.scaleBar = L.DomUtil.create('span', 'gmx_scaleBar', container);
                this.scaleBarTxt = L.DomUtil.create('span', 'gmx_scaleBarTxt', container);
                this._map = map;

                var util = {
                    checkPositionChanged: function(ev) {
                        var attr = gmxAPI.getScaleBarDistance();
                        if (!attr || (attr.txt === my._scaleBarText && attr.width === my._scaleBarWidth)) return;
                        my._scaleBarText = attr.txt;
                        my._scaleBarWidth = attr.width;
                        util.repaintScaleBar();
                    }
                    ,
                    repaintScaleBar: function() {
                        if (my._scaleBarText) {
                            gmxAPI.size(my.scaleBar, my._scaleBarWidth, 4);
                            my.scaleBarTxt.innerHTML = my._scaleBarText;
                            gmxAPI._listeners.dispatchEvent('scaleBarRepainted', gmxAPI.map, container.clientWidth);
                        }
                    }
                    ,coordFormat: 0
                    ,
                    setCoordinatesFormat: function(num, screenGeometry) {
                        if(!num) num = this.coordFormat;
                        if(num < 0) num = this.coordFormatCallbacks.length - 1;
                        else if(num >= this.coordFormatCallbacks.length) num = 0;
                        this.coordFormat = num;
                        if(!screenGeometry) screenGeometry = gmxAPI.map.getScreenGeometry();
                        var attr = {screenGeometry: screenGeometry, properties: gmxAPI.map.properties };
                        var res = this.coordFormatCallbacks[num](my.locationTxt, attr);		// если есть res значит запомним ответ
                        if(res && my.prevCoordinates != res) my.locationTxt.innerHTML = res;
                        my.prevCoordinates = res;
                        gmxAPI._listeners.dispatchEvent('onSetCoordinatesFormat', gmxAPI.map, num);
                    }
                    ,
                    coordFormatCallbacks: [		// методы формирования форматов координат
                        function() { return util.getCoordinatesText(); },
                        function() { return util.getCoordinatesText(); },
                        function() { return util.getCoordinatesText(); }
                    ]
                    ,
                    getCoordinatesText: function(currPos) {
                        return gmxAPI.getCoordinatesText(currPos, this.coordFormat);
                    }
                    ,
                    showCoordinates: function() {        //окошко с координатами
                        if (this.coordFormat > 2) return; // только для стандартных форматов.
                        var oldText = this.getCoordinatesText();
                        var text = window.prompt(titles.locationTxt + ':', oldText);
                        if (text && (text != oldText))
                            gmxAPI.map.moveToCoordinates(text);
                    }
                    ,
                    nextCoordinatesFormat: function() {
                        this.coordFormat += 1;
                        this.setCoordinatesFormat(this.coordFormat);
                    }
                }
                
                L.DomEvent.on(this.coordFormatChange, 'click', function (ev) { util.nextCoordinatesFormat(); }, this);
                L.DomEvent.on(this.locationTxt, 'click', function (ev) { util.showCoordinates(); }, this);
                this._checkPositionChanged =function (ev) {
                    util.checkPositionChanged(ev);
                }
                map.on('moveend', this._checkPositionChanged, this);
                this._setCoordinatesFormat =function (ev) {
                    util.setCoordinatesFormat(util.coordFormat);
                }
                map.on('move', this._setCoordinatesFormat, this);
                
                gmxAPI.map.geomixerLinkSetVisible = function(flag) {
                };
                gmxAPI.map.scaleBar = {
                    setVisible: function(flag) {
                        gmxAPI.setVisible(my.scaleBar, flag);
                    }
                };
                gmxAPI.map.coordinates = {
                    setVisible: function(flag) 
                    { 
                        container.style.display = flag ? 'block' : 'none';
                    }
                    ,
                    addCoordinatesFormat: function(func) 
                    { 
                        util.coordFormatCallbacks.push(func);
                        return util.coordFormatCallbacks.length - 1;
                    }
                    ,
                    removeCoordinatesFormat: function(num) 
                    { 
                        util.coordFormatCallbacks.splice(num, 1);
                        return util.coordFormatCallbacks.length - 1;
                    }
                    ,
                    setFormat: util.setCoordinatesFormat
                }
                
                return container;
            }
            ,getWidth: function() { 
                return this._container.clientWidth;
            }
            ,
            onRemove: function (map) {
                map.off('moveend', this._checkPositionChanged, this);
                map.off('move', this._setCoordinatesFormat, this);
            }
        });
        var locationControl = new L.Control.LocationControls({
            position: 'bottomright'
            ,id: 'locationControl'
        });
        locationControl.addTo(gmxAPI._leaflet.LMap);
        //outControls.locationControl = locationControl;

        // CopyrightControls - Copyright
        L.Control.CopyrightControls = L.Control.gmxControl.extend({
            onAdd: function (map) {
                Controls.controlsHash[this.options.id] = this;
                var className = 'gmx_copyright_location',
                    container = this._container = L.DomUtil.create('span', className);

                this._map = map;
                var my = this;
                var util = {
                    items: []
                    ,addItem: function(obj) {
                        var flag = true;
                        this.items.forEach(function(item, i) {
                            if(obj === item) {
                                flag = false;
                                return false;   // Уже есть такой
                            }
                        });
                        if(flag) {
                            this.items.push(obj);
                            this.redraw();
                        }
                    }
                    ,
                    removeItem: function(obj) {
                        this.items.forEach(function(item, i) {
                            if(obj === item) {
                                util.items.splice(i, 1);
                                util.redraw();
                                return false;
                            }
                        });
                    }
                    ,
                    redraw: function() {            // перерисовать
                        var currPos = gmxAPI.currPosition || gmxAPI.map.getPosition();
                        if(!currPos.latlng || !currPos.latlng.extent) return;
                        var texts = [
                            //первым всегда будет располагаться копирайт СканЭкс. 
                            "<a target='_blank' style='color: inherit;' href='http://maps.kosmosnimki.ru/Apikey/License.html'>&copy; 2007-2013 " + gmxAPI.KOSMOSNIMKI_LOCALIZED("&laquo;СканЭкс&raquo;", "RDC ScanEx") + "</a>"
                        ];
                        this.items.forEach(function(item, i) {
                            if (!item.copyright || !item.objectId || !item.getVisibility()) return;  // обьекта нет на экране или без копирайта
                            if (item.geometry) {
                                var bounds = item.bounds || gmxAPI.getBounds(item.geometry.coordinates);
                                if(!gmxAPI.extIntersect(currPos.latlng.extent, bounds)) return;
                            }
                            texts.push(item.copyright.split("<a").join("<a target='_blank' style='color: inherit;'"));
                        });
                        if(gmxAPI.proxyType == 'leaflet') texts.push("<a target='_blank' style='color: inherit;' href='http://leafletjs.com'>&copy; Leaflet</a>");

                        var text = texts.join(' ');

                        if(this.currentText != text) {
                            this.currentText = text;
                            container.innerHTML = text;
                            gmxAPI._listeners.dispatchEvent('copyrightRepainted', gmxAPI.map, text);
                        }
                        util.chkWidth();
                    }
                    ,
                    chkWidth: function(locationWidth) {
                        if(Controls.controlsHash.locationControl
                            && 'getWidth' in Controls.controlsHash.locationControl
                            ) {
                            var width = my._container.parentNode.clientWidth - 30 - Controls.controlsHash.locationControl.getWidth();
                            my._container.style.width = (width > 0 ? width : 0) + 'px';
                        }
                    }
                };

                gmxAPI.extend(gmxAPI.map, {
                    addCopyrightedObject: function(obj) {
                        util.addItem(obj);
                    }
                    ,removeCopyrightedObject: function(obj) {
                        util.removeItem(obj);
                    }
                    ,setCopyrightVisibility: function(obj) {
                        //copyrightControl.setVisible(obj);
                    } 
                    ,updateCopyright: function() {
                        util.redraw();
                    } 
                    ,setCopyrightAlign: function(attr) {    // Изменить позицию контейнера копирайтов
                        //if(attr.align) copyrightControl.copyrightAlign = attr.align;
                        //copyrightControl.setPosition();
                    }
                });
                map.on('moveend', function (ev) {
                    util.redraw();
                }, this);
                util.onChangeBackgroundColorID = gmxAPI.map.addListener('onChangeBackgroundColor', function(htmlColor) {
                    util.redraw();
                });
                return container;
            }
        });

        var copyrightControls = new L.Control.CopyrightControls({
            position: 'bottomleft'
            ,id: 'copyrightControls'
        });
        copyrightControls.addTo(gmxAPI._leaflet.LMap);
        //outControls.copyrightControls = copyrightControls;

        // PrintControl - кнопка печати
        var printControl = L.control.gmxControl({
            title: titles.print
            ,id: 'print'
            //,type: 'print'
            ,isVisible: false
        });
        printControl.addTo(gmxAPI._leaflet.LMap);
        //outControls.printControl = printControl;

        // PermalinkControl - кнопка пермалинка
        var permalinkControl = L.control.gmxControl({
            title: titles.permalink
            ,isVisible: false
            ,id: 'permalink'
        });
        permalinkControl.addTo(gmxAPI._leaflet.LMap);
        //outControls.permalinkControl = permalinkControl;

        // DrawingZoomControl - кнопка boxZoom
        var drawingZoomControl = L.control.gmxControl({
            title: titles.boxZoom
            ,isActive: false
            ,id: 'drawingZoom'
            ,onclick: function(e) {
                var className = 'leaflet-control-icons leaflet-control-' + this.options.id + '-Active';
                if(!gmxAPI._drawing.BoxZoom) {
                    gmxAPI._drawFunctions.zoom();
                    L.DomUtil.addClass(this._container, className);
                } else {
                    gmxAPI._drawing.activeState = false;
                    gmxAPI._drawing.BoxZoom = false;
                    L.DomUtil.removeClass(this._container, className);
                }
            }
            ,onAdd: function(cont) {
                Controls.controlsHash[this.options.id] = this;
                var my = this;
                this._map.on('boxzoomend', function() {
                    L.DomUtil.removeClass(my._container, 'leaflet-control-' + my.options.id + '-Active');
                });
            }

        });
        drawingZoomControl.addTo(gmxAPI._leaflet.LMap);
        //outControls.drawingZoomControl = drawingZoomControl;

        // DrawingPointControl - кнопка маркера
        var drawingPointControl = L.control.gmxControl({
            title: titles.marker
            ,isActive: false
            ,onFinishID: null
            ,id: 'drawingPoint'
            ,onclick: function(e) {
                var my = this;
                var className = 'leaflet-control-icons leaflet-control-' + this.options.id + '-Active';
                var stop = function() {
                    L.DomUtil.removeClass(my._container, className);
                    my.options.isActive = false;
                    if(my.options.onFinishID) gmxAPI.map.drawing.removeListener('onFinish', my.options.onFinishID);
                    my.options.onFinishID = null;
                };
                if(!this.options.onFinishID) {
                    this.options.onFinishID = gmxAPI.map.drawing.addListener('onFinish', stop);
                }
                if(!this.options.isActive) {
                    gmxAPI._drawFunctions.POINT();
                    L.DomUtil.addClass(this._container, className);
                    this.options.isActive = true;
                } else {
                    gmxAPI._drawing.endDrawing();
                    stop();
                }
            }
        });
        drawingPointControl.addTo(gmxAPI._leaflet.LMap);
        //outControls.drawingPointControl = drawingPointControl;

        L.Control.Drawing = L.Control.extend({
            options: {
                position: 'topleft'
            },

            _createButton: function (item, container, fn, context) {
                var className = 'leaflet-control-Drawing-' + item.key;
                var link = L.DomUtil.create('div', className, container);
                link.title = item.hint;

                var stop = L.DomEvent.stopPropagation;

                L.DomEvent
                    .on(link, 'click', stop)
                    .on(link, 'mousedown', stop)
                    .on(link, 'dblclick', stop)
                    .on(link, 'click', L.DomEvent.preventDefault)
                    .on(link, 'click', fn, context);

                return link;
            },

            onAdd: function (map) {
                Controls.controlsHash[this.options.id] = this;
                var zoomName = 'leaflet-control-Drawing',
                    container = L.DomUtil.create('div', 'leaflet-control-Drawing');

                L.DomEvent.on(container, 'mouseover', function (e) {
                    container.style.height = '98px';
                });
                L.DomEvent.on(container, 'mouseout', function (e) {
                    container.style.height = '30px';
                });

                this._map = map;
                var arr = [
                {
                    key: "POLYGON",
                    style: {
                        backgroundPosition: '-503px -33px'
                    }
                    ,
                    hoverStyle: {
                        backgroundPosition: '-503px -2px'
                    }
                    ,onClick: gmxAPI._drawFunctions.POLYGON
                    ,onCancel: gmxAPI._drawing.endDrawing
                    ,hint: titles.polygon
                }
                ,
                {
                    key: "LINESTRING",
                    style: {
                        backgroundPosition: '-393px -33px'
                    }
                    ,
                    hoverStyle: {
                        backgroundPosition: '-393px -2px'
                    }
                    ,onClick: gmxAPI._drawFunctions.LINESTRING
                    ,onCancel: gmxAPI._drawing.endDrawing
                    ,hint: titles.line
                }
                ,
                {
                    key: "FRAME",
                    style: {
                        backgroundPosition: '-269px -33px'
                    }
                    ,
                    hoverStyle: {
                        backgroundPosition: '-269px -2px'
                    }
                    ,onClick: gmxAPI._drawFunctions.FRAME
                    ,onCancel: gmxAPI._drawing.endDrawing
                    ,hint: titles.rectangle
                }
                ];
                var my = this;
                var items = {};
                arr.forEach(function(item) {
                    var key = item.key;
                    var fn = function() {
                        var target = items[key];
                        var className = 'leaflet-control-Drawing-' + key + '-Active';
                        var stop = function() {
                            L.DomUtil.removeClass(target, className);
                            my.options.isActive = false;
                            if(my.options.onFinishID) gmxAPI.map.drawing.removeListener('onFinish', my.options.onFinishID);
                            my.options.onFinishID = null;
                        };
                        if(!my.options.onFinishID) {
                            my.options.onFinishID = gmxAPI.map.drawing.addListener('onFinish', stop);
                        }
                        if(!my.options.isActive) {
                            gmxAPI._drawFunctions[key]();
                            if(target != target.parentNode.firstChild) {
                                target.parentNode.insertBefore(target, target.parentNode.firstChild);
                            }
                            L.DomUtil.addClass(target, className);
                            my.options.isActive = true;
                        } else {
                            gmxAPI._drawing.endDrawing();
                            stop();
                        }
                    }
                    items[key] = my._createButton(item,  container, fn, my);
                });
                this.options.items = items;
                return container;
            },
            setPosition: function (key, num) {
                var target = this.options.items[key];
                if (target) {
                    if (num < -1) num = 0;
                    if (num >= this._container.childNodes.length - 1) {
                        this._container.appendChild(target);
                    } else {
                        var source = this._container.childNodes[num];
                        this._container.insertBefore(target, source);
                    }
                }
            },
            onRemove: function (map) {
console.log('onRemove ', this);
                //map.off('zoomend zoomlevelschange', this._updateDisabled, this);
            }
        });
        L.control.gmxDrawing = function (options) {
          return new L.Control.Drawing(options);
        }
        // if(!gmxAPI.isMobile) {
        var gmxDrawing = L.control.gmxDrawing({id: 'gmxDrawing', isVisible: true});
        gmxDrawing.addTo(gmxAPI._leaflet.LMap);
        //outControls.gmxDrawing = gmxDrawing;

        //gmxAPI.extend(Controls.controlsHash, outControls);

        //Управление ToolsAll
        (function()
        {
            //Управление ToolsAll
            /** Класс управления ToolsAll
            * @function
            * @memberOf api
            * @param {cont} HTML контейнер для tools
            */
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
                    addTool: function (tn, attr) {
                        //console.log('tool addTool', tn, attr); // wheat
                        if(!attr) attr = {};
                        var ret = null;
                        if(attr.overlay && Controls.controlsHash.layers) {
                        //if(attr.overlay && gmxAPI._leaflet.gmxLayers) {
                            attr.id = tn;
                            if(!attr.rus) attr.rus = attr.hint || attr.id;
                            if(!attr.eng) attr.eng = attr.hint || attr.id;
                            
                            var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                            if(layersControl) {
                                layersControl.addOverlay(tn, attr);
                                ret = layersControl;
                            }
                        } else {
                            ret = Controls.addControl(tn, attr);
                            // var controls = gmxAPI.map.controlsManager.getCurrent();
                            // if(controls && 'addControl' in controls) {
                                // ret = controls.addControl(tn, attr);
                            // }
                        }
                        gmxAPI._tools[tn] = ret;
                        return ret;
                    }
                };
                //gmxAPI._tools[name] = cont;
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

        return Controls.controlsHash;
    };

    /**
     * Описание класса Control.
     * @typedef {Object} Control
     * @property {String} id - Идентификатор типа контролов.
     * @property {Function} init - Ф-ция для инициализации.
     * @property {boolean} isVisible - Флаг видимости(по умолчанию true).
     * @property {Array} [Control] items - Массив контролов данного типа контролов.
     * @property {Function} setVisible [boolean=] - Установка видимости(по умолчанию false).
     * @property {Function} remove - Удаление набора контролов.
    */
	var Controls = {
        id: 'controlsBaseIcons'
        ,isVisible: true
        ,controlsHash: {}
        ,remove: function() {      // удаление
            for(var key in this.controlsHash) {
                var item = this.controlsHash[key];
                if('remove' in item) item.remove();
            }
            this.controlsHash = {};
        }
        ,getControl: function(id) {
            //if(id === 'layers') id = 'gmxLayers';   // обратная совместимость
            var control = this.controlsHash[id] || null;
            return (control && 'getInterface' in control ? control.getInterface() : control);
        }
        ,setControl: function(id, control) {
            if(Controls.controlsHash[id]) return false;
            Controls.controlsHash[id] = control;
            control.addTo(gmxAPI._leaflet.LMap);
            return true;
        }
        ,addControl: function(key, pt) {
            var id = key || pt.id;
            if(Controls.controlsHash[id]) return null; // такой контрол уже имеется
            var title = pt.title || pt.hint;
			var attr = {
                id: id
                ,rus: pt.rus || title
                ,eng: pt.eng || title
                ,style: gmxAPI.extend(pt.style, styleIcon, true)
                ,hoverStyle: pt.hoverStyle
            };
            var className = 'leaflet-control-' + id;

            if(pt.regularImageUrl) {
                attr.src = pt.regularImageUrl;
                attr.style = {
                    position: 'relative'
                    ,background: 'rgba(154, 154, 154, 0.7)'

                };
            }
            if(pt.activeImageUrl) {
                attr.srcHover = pt.activeImageUrl;
                attr.hoverStyle = {
                    position: 'relative'
                    ,background: 'rgba(154, 154, 154, 1)'
                };
            }
            if(pt.onClick) attr.onClick = pt.onClick;
            if(pt.onCancel) attr.onCancel = pt.onCancel;
            //if(pt.overlay) attr.onCancel = pt.onCancel;
            if(!attr.src) {     // Текстовый контрол
                className += ' leaflet-control-Text';
                if(pt.innerHTML) attr.innerHTML = pt.innerHTML;
                else {
                    attr.innerHTML = gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng)
                }
            } else {
                className += ' leaflet-control-';
                className += (pt.width === 'auto' ? 'userIcons' : 'icons');
            }

            // Добавление пользовательского контрола
            var userControl = L.control.gmxControl({
                title: gmxAPI.KOSMOSNIMKI_LOCALIZED(attr.rus, attr.eng)
                ,isActive: false
                ,style: {}
                ,className: className
                ,src: attr.src || null
                ,srcHover: attr.srcHover || null
                ,onFinishID: null
                ,id: id
                ,onAdd: function() {
                    //gmxAPI.setStyleHTML(this._container, attr.style);
                    Controls.controlsHash[this.options.id] = this;
                    var my = this;
                    var container = this._container;
                    if(attr.innerHTML) {
                        container.innerHTML = attr.innerHTML;
                        L.DomUtil.addClass(container, 'leaflet-control-Text');
                    } else if(pt.regularImageUrl) {
                        this._Image = L.DomUtil.create('img', 'leaflet-control-Image');
                        container.appendChild(this._Image);
                        L.DomUtil.addClass(container, 'leaflet-control-userIcons');
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
                        this.setActive(true);
                    } else {
                        if(attr.onCancel) attr.onCancel.call(this);
                        this.setActive(false);
                    }
                }
            });
            userControl.addTo(gmxAPI._leaflet.LMap);
            Controls.controlsHash[id] = userControl;
            return userControl;
        }
        ,initControls: initControls
        ,
        removeControl: function (id) {
            var control = this.controlsHash[id];
            if(control && control._map && 'removeFrom' in control) control.removeFrom(control._map);
            delete this.controlsHash[id];
            return control;
        }
        // остальное для обратной совместимости
        // ,
        // forEach: function(callback) {
			// for (var i = 0, len = this.items.length; i < len; i++) {
				// if(callback(this.items[i], i) === false) return;
            // }
        // }
        // ,
        // selectTool: function (id) {
            // var control = this.controlsHash[id];
        // }
        // ,
        // setVisible: function(flag) {
            // if(!arguments.length) flag = !this.isVisible;
            // this.forEach(function(item, i) {
                // item.setVisible(flag);
            // });
            // this.isVisible = flag;
        // }
        //,
        // addTool: function (tn, attr) {
// console.log('tool addTool', tn, attr); // wheat
//return;
            // if(!attr) attr = {};
            // var ret = null;
            // if(attr.overlay && gmxAPI._leaflet.gmxLayers) {
                // attr.id = tn;
                // if(!attr.rus) attr.rus = attr.hint || attr.id;
                // if(!attr.eng) attr.eng = attr.hint || attr.id;
                
                // var layersControl = gmxAPI.map.controlsManager.getControl('layers');
                // if(layersControl) ret = layersControl.addOverlay(tn, attr);
            // } else {
                // var controls = gmxAPI.map.controlsManager.getCurrent();
                // if(controls && 'addControl' in controls) {
                    // ret = controls.addControl(tn, attr);
                // }
            // }
            // return ret;
        // }
        // ,getToolByName: function(id) {
            // return this.controlsHash[id] || null;
        // }
	}
    if(!gmxAPI._controls) gmxAPI._controls = {};
    gmxAPI._controls[Controls.id] = Controls;
})();
