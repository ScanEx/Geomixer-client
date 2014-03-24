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
    
    var rowUITemplate = 
        '<span>\
            <div class="shift-rasters-title">{{i shiftRastersPlugin.title}}</div>\
            <div class="shift-rasters-container">\
                <div id="slider-placeholder" class="shift-rasters-slider"></div>\
                <span class = "shift-rasters-label">dx</span> \
                <input class="inputStyle shift-rasters-input" id="dx"></input> \
                <span class = "shift-rasters-label">dy</span> \
                <input class="inputStyle shift-rasters-input" id="dy"></input> \
                {{#showButtons}}\
                    <button class="shift-rasters-btn" id="btnStart">{{i shiftRastersPlugin.startBtnTitle}}</button> \
                    <button class="shift-rasters-btn" id="btnSave">{{i shiftRastersPlugin.saveBtnTitle}}</button> \
                    <button class="shift-rasters-btn" id="btnCancel">{{i shiftRastersPlugin.cancelBtnTitle}}</button>\
                {{/showButtons}}\
            </div>\
        </span>';
        
    //события: click:save, click:cancel, click:start
    var ShiftLayerView = function(canvas, shiftParams, layer, params) {
        params = $.extend({
            initState: false,
            showButtons: true
        }, params)
        var _this = this;
        
        var sx, sy;
        
        var drag = function( x, y, o ) {        // Вызывается при mouseMove при нажатой мышке
            shiftParams.set({
                dx: gmxAPI.merc_x(x) - sx,
                dy: gmxAPI.merc_y(y) - sy
            });
        };
        
        var dragStart = function( x, y, o ) {      // Вызывается при mouseDown
            sx = gmxAPI.merc_x( x ) - shiftParams.get('dx');
            sy = gmxAPI.merc_y( y ) - shiftParams.get('dy');
        };
        
        var updateLayerOpacity = function(opacity) {
            (layer.tilesParent || layer).setStyle({fill: {opacity: opacity}});
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
                layer.addDragHandlers(drag, dragStart, null, {rightButton: true});
            } else {
                layer.removeDragHandlers();
            }
        }

        var ui = $(Mustache.render(rowUITemplate, {showButtons: params.showButtons})).appendTo(canvas);
        
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
        var transformX = function(x) {
            return gmxAPI.from_merc_x(gmxAPI.merc_x(x) + dx);
        }
        
        var transformY = function(y) {
            return gmxAPI.from_merc_y(gmxAPI.merc_y(y) + dy);
        }
        
        return gmxAPI.transformGeometry(geom, transformX, transformY);
    }

    var publicInterface = {
        pluginName: 'Shift Rasters Plugin',
        afterViewer: function(params, map) {
        
            //размещаем дополнительный параметр в диалоге редактирования свойств слоя
            gmxCore.loadModule('LayerEditor').done(function() {
                nsGmx.LayerEditor.addInitHook(function(layerEditor, layerProperties, params){
                    
                    var metaProps = layerProperties.get('MetaProperties'),
                        isRC = layerProperties.get('RC').get('IsRasterCatalog'),
                        shiftXName = isRC ? 'shiftXfield' : 'shiftX',
                        shiftYName = isRC ? 'shiftYfield' : 'shiftY',
                        shiftXDefault = isRC ? 'shiftX' : 0,
                        shiftYDefault = isRC ? 'shiftY' : 0,
                        shiftPropType = isRC ? 'String' : 'Number',
                        isShift = metaProps.getTagByName(shiftXName) && metaProps.getTagByName(shiftYName);

                    var uiTemplate = 
                        '<label class = "shift-rasters-properties">' +
                            '<input type="checkbox" id="shift-rasters" {{#isShift}}checked{{/isShift}}>' + 
                            '{{i shiftRastersPlugin.layerPropertiesTitle}}' +
                        '</label>';
                    
                    var ui = $(Mustache.render(uiTemplate, {isShift: isShift}));
                    
                    $(layerEditor).on('premodify', function() {
                        var xId = metaProps.getTagIdByName(shiftXName);
                        var yId = metaProps.getTagIdByName(shiftYName);
                        
                        var isChecked = $('#shift-rasters', ui).prop( "checked" );
                        
                        if (isChecked) {
                            xId || metaProps.addNewTag(shiftXName, shiftXDefault, shiftPropType);
                            yId || metaProps.addNewTag(shiftYName, shiftYDefault, shiftPropType);
                        } else {
                            metaProps.deleteTag(xId);
                            metaProps.deleteTag(yId);
                        }
                        
                        layerProperties.set('MetaProperties', metaProps);
                        
                        if (isRC && isChecked) {
                            var columns = layerProperties.get('Columns').slice();
                            
                            if (!nsGmx._.findWhere(columns, {Name: shiftXDefault})) {
                                columns.push({Name: shiftXDefault, ColumnSimpleType: 'Float'});
                            }
                            
                            if (!nsGmx._.findWhere(columns, {Name: shiftYDefault})) {
                                columns.push({Name: shiftYDefault, ColumnSimpleType: 'Float'});
                            }
                            
                            layerProperties.set('Columns', columns);
                        }
                    })

                    var tabName = layerProperties.get('Type') === 'Vector' ? 'advanced' : 'main';
                    
                    params.additionalUI = params.additionalUI || {};
                    params.additionalUI[tabName] = params.additionalUI[tabName] || [];
                    params.additionalUI[tabName].push(ui[0]);
                })
            })
        
            //объекты каталога растров
            nsGmx.EditObjectControl.addParamsHook(function(layerName, objectId, params) {
                var metaProps = map.layers[layerName].properties.MetaProperties;
                if (!metaProps.shiftXfield || !metaProps.shiftYfield) {
                    return params;
                }
                
                var shiftXfield = metaProps.shiftXfield.Value,
                    shiftYfield = metaProps.shiftYfield.Value;
                
                params = params || {};
                params.fields = params.fields || [];
                
                var hideField = function(name) {
                    var fieldDescription = nsGmx._.findWhere(params.fields, {name: name});
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
                            $(editDialog).on('close', function() {
                                shiftLayer.remove();
                                layer.setVisibilityFilter();
                            });

                            var canvas = $('<div/>'),
                                dx = parseFloat(editDialog.get(shiftXfield)) || 0,
                                dy = parseFloat(editDialog.get(shiftYfield)) || 0,
                                shiftParams = new Backbone.Model({
                                    dx: dx,
                                    dy: dy
                                }),
                                originalShiftParams,
                                shiftLayer = map.addLayer({properties: {
                                    IsRasterCatalog: true,
                                    RCMinZoomForRasters: 1,
                                    Quicklook: layer.properties.Quicklook,
                                    styles: [{BalloonEnable: false}]
                                }}),
                                geomDx = dx,
                                geomDy = dy;
                                
                            var shiftView = new ShiftLayerView(canvas, shiftParams, shiftLayer, {initState: true, showButtons: false});
                            
                            shiftParams.on('change', function() {
                                editDialog.set(shiftXfield, shiftParams.get('dx'));
                                editDialog.set(shiftYfield, shiftParams.get('dy'));
                                
                                var ddx = shiftParams.get('dx') - geomDx,
                                    ddy = shiftParams.get('dy') - geomDy,
                                    shiftedGeom = shiftMercGeometry(editDialog.getGeometry(), ddx, ddy);
                                    
                                geomDx += ddx;
                                geomDy += ddy;
                                
                                editDialog.getGeometryObj().setGeometry(shiftedGeom);
                            })
                            
                            var initLayer = function() {
                                dx = parseFloat(editDialog.get(shiftXfield)) || 0;
                                dy = parseFloat(editDialog.get(shiftYfield)) || 0;
                                
                                shiftParams.set({
                                    dx: dx,
                                    dy: dy
                                })

                                originalShiftParams = shiftParams.clone();

                                shiftLayer.addItems([{
                                    id: 1,
                                    properties: editDialog.getAll(),
                                    geometry: shiftMercGeometry(editDialog.getGeometry(), -dx, -dy)
                                }]);
                            
                                var identityField = layer.properties.identityField;
                                layer.setVisibilityFilter('"' + identityField + '" <> \'' + editDialog.get(identityField) + '\'');
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
                    var layerName = context.elem.name,
                        layer = map.layers[layerName],
                        isRC = layer.properties.IsRasterCatalog,
                        shiftXName = isRC ? 'shiftXfield' : 'shiftX',
                        shiftYName = isRC ? 'shiftYfield' : 'shiftY',
                        metaProps = layer.properties.MetaProperties;
                    
                    return metaProps[shiftXName] && metaProps[shiftYName];
                },
                clickCallback: function(context) {
                    var layerName = context.elem.name,
                        layer = map.layers[layerName],
                        posOffset = layer.getPositionOffset(),
                        shiftParams = new Backbone.Model({
                            dx: parseFloat(posOffset.shiftX) || 0,
                            dy: parseFloat(posOffset.shiftY) || 0
                        }),
                        originalShiftParams = shiftParams.clone();
                    
                    if (!menu) {
                        menu = new leftMenu();
                        menu.createWorkCanvas("", function(){});
                        $(menu.workCanvas).css('width', '100%');
                    }
                    
                    var removeView = function() {
                        currentView.setState(false);
                        $(menu.workCanvas).empty();
                    }
                    
                    currentView && removeView();
                    
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
                        removeView();
                    })

                    $(currentView).on('click:cancel', function() {
                        layer.setPositionOffset(originalShiftParams.get('dx'), originalShiftParams.get('dy'));
                        removeView();
                    })
                }
            }, 'Layer');
        }
    };
    
    gmxCore.addModule('ShiftRastersPlugin', publicInterface, {css: 'ShiftRasterPlugin.css'});
})();