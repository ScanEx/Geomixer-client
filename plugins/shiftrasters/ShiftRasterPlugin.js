/*
    Плагин с пользовательским интерфейсом сдвига растровых слоёв и каталогов растров
*/
(function() {

    _translationsHash.addtext("rus", {
        'shiftRastersPlugin.toolHint': 'Допривязка растрового слоя'
    });
    
    _translationsHash.addtext("eng", {
        'shiftRastersPlugin.toolHint': 'Raster layer shift'
    });
    
    var ui = 
        '<div>\
            <div class = "shift-rasters-title">Сдвигайте слой на карте</div> \
            <span class = "shift-rasters-label">dx</span> \
            <input class="shift-rasters-input" id="dx"></input> \
            <span class = "shift-rasters-label">dy</span> \
            <input class="shift-rasters-input" id="dy"></input> \
            <button class="shift-rasters-btn" id="btnSave">Сохранить</button> \
            <button class="shift-rasters-btn" id="btnCancel">Отмена</button> \
        </div>';

    var publicInterface = {
        pluginName: 'Shift Rasters Plugin',
        afterViewer: function(params, map) {
            nsGmx.ContextMenuController.addContextMenuElem({
                title: 'Сдвинуть слой',
                isVisible: function(context) {
                    return true;
                },
                clickCallback: function(context) {
                    var layerName = context.elem.name,
                        layer = map.layers[layerName],
                        posOffset = layer.getPositionOffset(),
                        shiftParams = new Backbone.Model({
                            dx: parseFloat(posOffset.shiftX),
                            dy: parseFloat(posOffset.shiftY)
                        }),
                        originalShiftParams = shiftParams.clone();
                    
                    var menu = new leftMenu();
                    menu.createWorkCanvas("", function(){});
                    $(menu.workCanvas).css('width', '100%');
                    
                    $('#btnCancel', menu.workCanvas).click(); //если мы перетаскивали другой объект, то отменим его перетаскивание
                    
                    var canvas = $('<div/>').css({height: '45px', width: '100%'}).appendTo(menu.workCanvas);
                    $(ui).appendTo(canvas);
                    
                    shiftParams.on('change', function() {
                        $('#dx', canvas).val(Math.floor(shiftParams.get('dx')));
                        $('#dy', canvas).val(Math.floor(shiftParams.get('dy')));
                        layer.setPositionOffset(shiftParams.get('dx'), shiftParams.get('dy'));
                    })
                    
                    shiftParams.trigger('change');
                    
                    $('input', canvas).bind('change keyup', function() {
                        shiftParams.set({
                            dx: $('#dx', canvas).val(),
                            dy: $('#dy', canvas).val()
                        });
                    });
                    
                    $('#btnSave', canvas).click(function() {
                        gmxCore.loadModule('LayerProperties').done(function() {
                            var layerProperties = new nsGmx.LayerProperties();
                            layerProperties.initFromServer(layerName).done(function() {
                                var metaProperties = layerProperties.get('MetaProperties');
                                metaProperties.shiftX = {Value: shiftParams.get('dx'), Type: 'Number'};
                                metaProperties.shiftY = {Value: shiftParams.get('dy'), Type: 'Number'};
                                layerProperties.save().done(function(response) {
                                    layer.disableDragging();
                                    $(menu.workCanvas).empty();
                                    layer.chkLayerVersion && layer.chkLayerVersion();
                                });
                            });
                        });
                    });
                    
                    $('#btnCancel', canvas).click(function() {
                        layer.setPositionOffset(originalShiftParams.get('dx'), originalShiftParams.get('dy'));
                        layer.disableDragging();
                        $(menu.workCanvas).empty();
                    });
                    
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
                    layer.enableDragging(drag, dragStart);
                }
            }, 'Layer');
        }
    };
    
    gmxCore.addModule('ShiftRastersPlugin', publicInterface, {css: 'ShiftRasterPlugin.css'});
})();