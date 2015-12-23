'use strict';

/** Тестирование виртуальных слоёв в ГеоМиксере
*/
(function (){

var publicInterface = {
    pluginName: 'Virtual Layers',
    
    afterViewer: function() {
        gmxCore.loadModule('LayerEditor').then(function() {
            nsGmx.LayerEditor.addInitHook(function(layerEditor, layerProperties, params) {
                if (layerProperties.get('Type') !== 'Virtual') {
                    return;
                }
                
                $(layerEditor).on('premodify', function() {
                    layerProperties.set('ContentID', ui.find('.vlayer-contentid').val());
                });
                
                var template = Handlebars.compile('<div type="vlayer-container">' +
                    '<span class="vlayer-label">Тип слоя</span>' +
                    '<input class="vlayer-contentid inputStyle" value="{{ContentID}}">' +
                '</div>');
                
                var ui = $(template({ContentID: layerProperties.get('ContentID')}));
                
                params.additionalUI = params.additionalUI || {};
                params.additionalUI.main = params.additionalUI.advanced || [];
                params.additionalUI.main.push(ui);
            });
        });
        
        _menuUp.addChildItem({
            id:'createVirtualLayer',
            title: 'Виртуальный',
            func: function() {
                var parent = _div(null, [['attr','id','newVirtualLayer'], ['css', 'height', '100%']]),
                    properties = {Title:'', Description: '', Date: ''};

                var dialogDiv = showDialog('Создать виртуальный слой', parent, 340, 340, false, false);

                nsGmx.createLayerEditor(false, 'Virtual', parent, properties, {
                    doneCallback: function() {
                        removeDialog(dialogDiv); 
                    }
                });
            }
        }, 'createLayer');
    }
}

gmxCore.addModule('VirtualLayersPlugin', publicInterface, {css: 'VirtualLayers.css'});

})();