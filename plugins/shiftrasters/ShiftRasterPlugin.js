/*
    Плагин с пользовательским интерфейсом сдвига растровых слоёв и каталогов растров
*/
(function() {

    _translationsHash.addtext("rus", { shiftRastersPlugin: {
        title: 'Сдвигайте растр правой кнопкой мыши',
        saveBtnTitle: 'Готово',
        cancelBtnTitle: 'Отмена',
        startBtnTitle: 'Сдвинуть',
        layerPropertiesTitle: 'Включить сдвиг растров',
        contextTitle: 'Сдвинуть слой'
    }});
    
    _translationsHash.addtext("eng", { shiftRastersPlugin: {
        title: 'Use right mouse button to shift raster',
        saveBtnTitle: 'Done',
        cancelBtnTitle: 'Cancel',
        startBtnTitle: 'Shift',
        layerPropertiesTitle: 'Enable rasters shift',
        contextTitle: 'Shift Layer'
    }});
    
    var rowUITemplate = Handlebars.compile(
        '<span>\
            <div class="shift-rasters-title">{{i "shiftRastersPlugin.title"}}</div>\
            <div class="shift-rasters-container">\
                <div id="slider-placeholder" class="shift-rasters-slider"></div>\
                <span class = "shift-rasters-label">dx</span> \
                <input class="inputStyle shift-rasters-input" id="dx"></input> \
                <span class = "shift-rasters-label">dy</span> \
                <input class="inputStyle shift-rasters-input" id="dy"></input> \
                {{#showButtons}}\
                    <button class="shift-rasters-btn" id="btnStart">{{i "shiftRastersPlugin.startBtnTitle"}}</button> \
                    <button class="shift-rasters-btn" id="btnSave">{{i "shiftRastersPlugin.saveBtnTitle"}}</button> \
                    <button class="shift-rasters-btn" id="btnCancel">{{i "shiftRastersPlugin.cancelBtnTitle"}}</button>\
                {{/showButtons}}\
            </div>\
        </span>');

    L.Draggable.RightButton = L.Draggable.extend({
        _onDown: function (e) {
            this._moved = false;

            if (e.shiftKey || ((e.button !== 2) && !e.touches)) { return; }

            L.DomEvent.stopPropagation(e);

            if (L.Draggable._disabled) { return; }

            L.DomUtil.disableImageDrag();
            L.DomUtil.disableTextSelection();

            if (this._moving) { return; }

            var first = e.touches ? e.touches[0] : e;

            this._startPoint = new L.Point(first.clientX, first.clientY);
            this._startPos = this._newPos = L.DomUtil.getPosition(this._element);

            L.DomEvent
                .on(document, L.Draggable.MOVE[e.type], this._onMove, this)
                .on(document, L.Draggable.END[e.type], this._onUp, this);
        }
    });

    //события: click:save, click:cancel, click:start
    var ShiftLayerView = function(canvas, shiftParams, layer, params) {
        params = $.extend({
            initState: false,
            showButtons: true
        }, params)
        var _this = this,
            lmap = nsGmx.leafletMap,
            dragging;

        var dragUtils = {
            curOffset: null,
            dragstart: function (ev) {
                lmap.dragging.disable();
                L.DomUtil.disableImageDrag();
                var posOffset = layer.getPositionOffset();
                dragUtils.curOffset = {
                    shiftX: posOffset.shiftX,
                    shiftY: posOffset.shiftY,
                    _startPos: ev.target._startPos
                };
                shiftParams.set({state: 'dragstart'});
            },
            drag: function (ev) {
                var target = ev.target,
                    deltaPos = target._newPos.subtract(dragUtils.curOffset._startPos),
                    deltaPosMerc = deltaPos.divideBy(256 / L.gmxUtil.tileSizes[lmap.getZoom()]);

                shiftParams.set({
                    state: 'drag',
                    dx: dragUtils.curOffset.shiftX + deltaPosMerc.x,
                    dy: dragUtils.curOffset.shiftY - deltaPosMerc.y
                });
            },
            dragend: function (ev) {
                lmap.dragging.enable();
                L.DomUtil.enableImageDrag();
                shiftParams.set({state: 'dragend'});
            },
            createDragging: function () {
                dragging = new L.Draggable.RightButton(layer._tileContainer, lmap.getContainer());
                dragging
                    .on('dragstart', dragUtils.dragstart)
                    .on('dragend', dragUtils.dragend)
                    .on('drag', dragUtils.drag);

                dragging.enable();
            },
            deleteDragging: function () {
                dragging
                    .off('dragstart', dragUtils.dragstart)
                    .off('dragend', dragUtils.dragend)
                    .off('drag', dragUtils.drag);

                dragging.disable();
            }
        };

        var updateLayerOpacity = function(opacity) {
            layer.setRasterOpacity(opacity/100);
        }
        
        var isActiveState = params.initState;
        var updateState = function() {
            $('#btnCancel, #btnSave, #slider-placeholder', ui).toggle(isActiveState);
            $('#btnStart', ui).toggle(!isActiveState);
            $('.shift-rasters-input' ,ui).prop('disabled', !isActiveState);
            
            if (isActiveState) {
                updateLayerOpacity($('#slider-placeholder > div', ui).slider('value'));
            } else {
                updateLayerOpacity(100);
            }

            if (isActiveState) {
                dragUtils.createDragging();
                if (lmap.contextmenu) { lmap.contextmenu.removeHooks(); }
                layer.fire('dragenabled');
            } else {
                if (dragging) {
                    dragUtils.deleteDragging();
                    dragging = null;
                }
                if (lmap.contextmenu) { lmap.contextmenu.addHooks(); }
                layer.fire('dragdisabled');
            }
        }
        lmap.on({
            mouseout: function() {
                if (isActiveState) {
                    dragging.disable();
                }
            },
            mouseover: function() {
                if (isActiveState) {
                    dragging.enable();
                }
            },
            zoomend: function() {
                if (dragging) {
                    dragUtils.deleteDragging();
                    dragUtils.createDragging();
                }
            }
        });

        var ui = $(rowUITemplate({showButtons: params.showButtons})).appendTo(canvas);
        
        var sliderUI = nsGmx.Controls.createSlider(80, function(event, ui) {
            updateLayerOpacity(ui.value);
        });
        
        $(sliderUI).appendTo($('#slider-placeholder', ui));
        
        updateState();
        
        $('button', canvas).click(function() {
            var eventName = {btnCancel: 'cancel', btnSave: 'save', btnStart: 'start'}[this.id];
            $(_this).trigger('click:' + eventName);
        });
        
        var updateParamsUI = function() {
            var dx = Math.floor(shiftParams.get('dx'));
            var dy = Math.floor(shiftParams.get('dy'));
            var curDx = parseFloat($('#dx', canvas).val() || 0);
            var curDy = parseFloat($('#dy', canvas).val() || 0);
            
            if (!isNaN(curDx) && Math.floor(curDx) !== dx) {
                $('#dx', canvas).val(dx);
            }
            
            if (!isNaN(curDy) && Math.floor(curDy) !== dy) {
                $('#dy', canvas).val(dy);
            }
            
            layer.setPositionOffset(shiftParams.get('dx'), shiftParams.get('dy'));
        };
        
        shiftParams.on('change', updateParamsUI);
        updateParamsUI();
        
        $('input', canvas).bind('change keyup', function() {
            shiftParams.set({
                dx: parseFloat($('#dx', canvas).val()) || 0,
                dy: parseFloat($('#dy', canvas).val()) || 0
            });
        });

        this.setState = function(isActive) {
            isActiveState = isActive;
            updateState();
        }
        
        updateState();
    }
    
    var menu, currentView;
    
    //geom в latlng, а dx и dy в меркаторе
    var shiftMercGeometry = function(geom, dx, dy) {
        var transform = function(p) {
            var merc = L.Projection.Mercator.project({lat: p[1], lng: p[0]}),
                latlng = L.Projection.Mercator.unproject({y: merc.y + dy, x: merc.x + dx});
            merc = L.Projection.Mercator.project(latlng);
            return [merc.x, merc.y];
        }
        return L.gmxUtil.transformGeometry(geom, transform);
    }

    var publicInterface = {
        pluginName: 'Shift Rasters Plugin',
        afterViewer: function(params, map) {
        
            //размещаем дополнительный параметр в диалоге редактирования свойств слоя
            gmxCore.loadModule('LayerEditor').done(function() {
                nsGmx.LayerEditor.addInitHook(function(layerEditor, layerProperties, params){
                    
                    var metaProps = layerProperties.get('MetaProperties'),
                        isRC = layerProperties.get('RC').get('IsRasterCatalog'),
                        shiftXName = 'shiftXfield',
                        shiftYName = 'shiftYfield',
                        shiftXDefault = 'shiftX',
                        shiftYDefault = 'shiftY',
                        isShift = metaProps.getTagByName(shiftXName) && metaProps.getTagByName(shiftYName);
                        
                    if (!isRC) {
                        return;
                    }

                    var uiTemplate = Handlebars.compile(
                        '<label class = "shift-rasters-properties">' +
                            '<input type="checkbox" id="shift-rasters" {{#isShift}}checked{{/isShift}}>' + 
                            '{{i "shiftRastersPlugin.layerPropertiesTitle"}}' +
                        '</label>');
                    
                    var ui = $(uiTemplate({isShift: isShift}));
                    
                    $(layerEditor).on('premodify', function() {
                        var xId = metaProps.getTagIdByName(shiftXName);
                        var yId = metaProps.getTagIdByName(shiftYName);
                        
                        var isChecked = $('#shift-rasters', ui).prop( "checked" );
                        
                        if (isChecked) {
                            xId || metaProps.addNewTag(shiftXName, shiftXDefault, 'String');
                            yId || metaProps.addNewTag(shiftYName, shiftYDefault, 'String');
                        } else {
                            metaProps.deleteTag(xId);
                            metaProps.deleteTag(yId);
                        }
                        
                        layerProperties.set('MetaProperties', metaProps);
                        
                        if (isRC && isChecked) {
                            var columns = layerProperties.get('Columns').slice();
                            
                            if (!_.findWhere(columns, {Name: shiftXDefault})) {
                                columns.push({Name: shiftXDefault, ColumnSimpleType: 'Float'});
                            }
                            
                            if (!_.findWhere(columns, {Name: shiftYDefault})) {
                                columns.push({Name: shiftYDefault, ColumnSimpleType: 'Float'});
                            }
                            
                            layerProperties.set('Columns', columns);
                        }
                    })

                    params.additionalUI = params.additionalUI || {};
                    params.additionalUI.advanced = params.additionalUI.advanced || [];
                    params.additionalUI.advanced.push(ui[0]);
                })
            })
        
            //объекты каталога растров
            nsGmx.EditObjectControl.addParamsHook(function(layerName, objectId, params) {
                var metaProps = nsGmx.gmxMap.layersByID[layerName].getGmxProperties().MetaProperties;
                if (!metaProps.shiftXfield || !metaProps.shiftYfield) {
                    return params;
                }
                
                var shiftXfield = metaProps.shiftXfield.Value,
                    shiftYfield = metaProps.shiftYfield.Value;
                
                params = params || {};
                params.fields = params.fields || [];
                
                var hideField = function(name) {
                    var fieldDescription = _.findWhere(params.fields, {name: name});
                    if (fieldDescription) {
                        fieldDescription.hide = true;
                    } else {
                        params.fields.push({name: name, hide: true});
                    }
                }
                
                hideField(shiftXfield);
                hideField(shiftYfield);
                
                params.fields.unshift({
                    title: "Сдвиг растра",
                    view: {
                        getUI: function(editDialog) {
                            var layer = editDialog.getLayer();

                            var canvas = $('<div/>'),
                                dx = parseFloat(editDialog.get(shiftXfield)) || 0,
                                dy = parseFloat(editDialog.get(shiftYfield)) || 0,
                                shiftParams = new Backbone.Model({
                                    dx: dx,
                                    dy: dy
                                }),
                                originalShiftParams,
                                props = L.extend({}, layer.getGmxProperties()),
                                geomDx = dx,
                                geomDy = dy;

                            props.LayerID = props.name = null;
                            props.tiles = props.tilesVers = [];
                            
                            var shiftLayer = L.gmx.createLayer({properties: props, geometry: layer._gmx.geometry}).addTo(map).setZIndex(5000000);
                            shiftLayer._gmx.tileAttributeIndexes = layer._gmx.tileAttributeIndexes;

                            var shiftView = new ShiftLayerView(canvas, shiftParams, shiftLayer, {initState: true, showButtons: false});
                            $(editDialog).on('close', function() {
                                shiftView.setState(false);
                                map.removeLayer(shiftLayer);
                                layer.removeFilter();
                            });
                            
                            var startPos = [dx, dy];
                            var shiftPos = [0, 0];
                            shiftParams.on('change', function() {
                                var dx = shiftParams.get('dx'),
                                    dy = shiftParams.get('dy'),
                                    state = shiftParams.get('state'),
                                    drawingObj = editDialog.getGeometryObj();

                                editDialog.set(shiftXfield, shiftParams.get('dx'));
                                editDialog.set(shiftYfield, shiftParams.get('dy'));
                                
                                var ddx = shiftParams.get('dx') - geomDx,
                                    ddy = shiftParams.get('dy') - geomDy;
                                    
                                geomDx += ddx;
                                geomDy += ddy;
                                
                                if (state === 'dragstart') {
                                    shiftPos = [0, 0];
                                } else if (state === 'dragend') {
                                    drawingObj.setOffsetToGeometry(shiftPos[0], shiftPos[1]);
                                    shiftPos = [0, 0];
                                    startPos = [dx, dy];
                                    shiftParams.set({
                                        state: ''
                                    })
                                } else if (state === 'drag') {
                                    shiftPos[0] += ddx;
                                    shiftPos[1] += ddy;
                                    drawingObj.setPositionOffset(shiftPos[0], shiftPos[1]);
                                } else {
                                    drawingObj.setOffsetToGeometry(dx - startPos[0], dy - startPos[1]);
                                    startPos = [dx, dy];
                                }
                            })
                            
                            var initLayer = function() {
                                dx = parseFloat(editDialog.get(shiftXfield)) || 0;
                                dy = parseFloat(editDialog.get(shiftYfield)) || 0;
                                
                                shiftParams.set({
                                    dx: dx,
                                    dy: dy
                                })

                                originalShiftParams = shiftParams.clone();

                                var gmx = layer._gmx,
                                    indexes = gmx.tileAttributeIndexes,
                                    properties = editDialog.getAll(),
                                    id = editDialog.get(gmx.identityField),
                                    geo = shiftMercGeometry(editDialog.getGeometry(), -dx, -dy);
                                    data = [];

                                for (var key in indexes) {
                                    data[indexes[key]] = shiftXfield === key || shiftYfield === key ? 0 : properties[key];
                                }
                                        
                                geo.type = geo.type.toUpperCase();
                                data.push(geo);
                                shiftLayer.addData([data]);
                                layer.setFilter(function(it) {
                                    return it.id !== id;
                                });
                            }
                            
                            initLayer();
                            
                            return canvas[0];
                        }
                    }
                });
                return params;
            })
            
            //растровый слой и КР целиком
            nsGmx.ContextMenuController.addContextMenuElem({
                title: _gtxt('shiftRastersPlugin.contextTitle'),
                isVisible: function(context) {
                    var layerRights = _queryMapLayers.layerRights(context.elem.name);
                    return layerRights == 'edit' || layerRights == 'editrows';
                },
                clickCallback: function(context) {
                    currentView && currentView.setState(false);
                    menu && menu.leftPanelItem.close();
                    
                    var layerName = context.elem.name,
                        layer = nsGmx.gmxMap.layersByID[layerName],
                        posOffset = layer.getPositionOffset(),
                        shiftParams = new Backbone.Model({
                            dx: parseFloat(posOffset.shiftX) || 0,
                            dy: parseFloat(posOffset.shiftY) || 0
                        }),
                        originalShiftParams = shiftParams.clone();
                    
                    menu = new leftMenu();
                    menu.createWorkCanvas('ShiftRasters', {
                        closeFunc: function() {
                            currentView.setState(false);
                            if (originalShiftParams) {
                                layer.setPositionOffset(originalShiftParams.get('dx'), originalShiftParams.get('dy'));
                            }
                            menu = null;
                        },
                        path: ['Сдвиг растрового слоя']
                    });
                    
                    $(menu.workCanvas).empty();
                    var canvas = $('<div/>').css({height: '45px', width: '100%'}).appendTo(menu.workCanvas);
                    
                    currentView = new ShiftLayerView(canvas, shiftParams, layer, {initState: true});
                    
                    $(currentView).on('click:save', function(){
                        gmxCore.loadModule('LayerProperties').done(function() {
                            var layerProperties = new nsGmx.LayerProperties();
                            layerProperties.initFromServer(layerName).done(function() {
                                var metaProperties = layerProperties.get('MetaProperties');
                                var xId = metaProperties.getTagIdByName('shiftX');
                                var yId = metaProperties.getTagIdByName('shiftY');
                                xId ? metaProperties.updateTag(xId, 'shiftX', shiftParams.get('dx'), 'Number') : metaProperties.addNewTag('shiftX', shiftParams.get('dx'), 'Number');
                                yId ? metaProperties.updateTag(yId, 'shiftY', shiftParams.get('dy'), 'Number') : metaProperties.addNewTag('shiftY', shiftParams.get('dy'), 'Number');
                                
                                layerProperties.save().done(function(response) {
                                    layer.chkLayerVersion && layer.chkLayerVersion();
                                });
                            });
                        });
                        originalShiftParams = null;
                        currentView.setState(false);
                        menu.leftPanelItem.close();
                    })

                    $(currentView).on('click:cancel', function() {
                        currentView.setState(false);
                        menu.leftPanelItem.close();
                    })
                }
            }, 'Layer');
        }
    };
    
    gmxCore.addModule('ShiftRastersPlugin', publicInterface, {css: 'ShiftRasterPlugin.css'});
})();