(function () {
    'use strict';

var ZINDEX_DEFAULT_FIELD = '_zIndex';
nsGmx.Translations.addText("rus", {
    VectorSorting: {
        menuTitle : 'Сохранить порядок объектов',
        done:       'Порядок объектов сохранён',
        button:     'Добавить',
        askTitle:   'Добавить к слою поле для сортировки?'
    }
});
nsGmx.Translations.addText("eng", {
    VectorSorting: {
        menuTitle:  'Save the order of objects',
        done:       'The order of objects saved',
        button:     'Add',
        askTitle:   'Sorting field should be added to layer'
    }
});

var pluginPath = gmxCore.getModulePath('VectorSorting');

var publicInterface = {
    pluginName: 'Sorting Plugin'
    ,
	afterViewer: function(params, map) {
        nsGmx.ContextMenuController.addContextMenuElem({
            title: _gtxt('VectorSorting.menuTitle')
            ,

            isVisible: function(context) {
                if (context.layerManagerFlag) {return false;}
                var elem = context.elem,
                    layer = nsGmx.gmxMap.layersByID[elem.name],
                    props = layer.getGmxProperties(),
                    sorted = layer.getReorderArrays && layer.getReorderArrays(),
                    isNeedMenu = sorted && sorted.top.length + sorted.bottom.length > 0;
                return isNeedMenu &&
                    props.type === 'Vector' && 
                    (props.GeometryType === 'polygon' || props.GeometryType === 'linestring') &&
                    !context.layerManagerFlag &&
                    _queryMapLayers.layerRights(elem.name) == 'edit';
            },

            clickCallback: function(context) {
                var elem = context.elem,
                    layerID = elem.name,
                    layer = nsGmx.gmxMap.layersByID[layerID],
                    props = layer.getGmxProperties(),
                    sorted = layer.getReorderArrays(),
                    isNeedMenu = sorted.top.length + sorted.bottom.length;

                
                var ZIndexField = props.ZIndexField || ZINDEX_DEFAULT_FIELD;
                var saveReorderArrays = function() {
                    L.gmxUtil.sendCrossDomainPostRequest(
                        'http://' + layer._gmx.hostName + '/VectorLayer/Search.ashx',
                        {
                            WrapStyle: 'window',
                            layer: layerID,
                            columns: '[{"Value":"min([' + ZIndexField + '])","Alias":"min"},{"Value":"max([' + ZIndexField + '])","Alias":"max"}]'
                        },
                        function(ph) {
                            if (!parseResponse(ph)) {
                                return;
                            }
                            
                            var minmax = ph.Result.values[0];
                            var updater = function(startIndex, delta, id, i) {
                                var properties = {};
                                properties[ZIndexField] = startIndex + delta * i;
                                return {id: id, properties: properties, action: 'update'};
                            };

                            var out = [].concat(
                                sorted.bottom.reverse().map(updater.bind(null, minmax[0] - 1, -1)), 
                                sorted.top.map(updater.bind(null, minmax[1] + 1, 1))
                            );
                            if (out.length) {
                                _mapHelper.modifyObjectLayer(layerID, out).done(function() {
                                    layer.clearReorderArrays();
                                    nsGmx.widgets.notifications.stopAction('saveOrders', 'success', _gtxt('VectorSorting.done'));
                                });
                            }
                        }
                    );
                };
                
                var isFieldFound = layer._gmx.tileAttributeIndexes[ZIndexField];
                if (!props.ZIndexField || !isFieldFound) {
                    var dialogGUI = $('<div class="vectorSortingDialog"><button class="vectorSortingDialogButton">'+_gtxt('VectorSorting.button')+'</button></div>').css("text-align", 'center');
                    $('.vectorSortingDialogButton', dialogGUI)
                        .css({padding: '0px 5px', cursor: 'pointer'})
                        .click(function() {
                            var lp = new nsGmx.LayerProperties();
                            lp.initFromServer(layerID).done(function() {
                                if (!props.ZIndexField) {
                                    lp.set('ZIndexField', ZINDEX_DEFAULT_FIELD);
                                }
                                if (!isFieldFound) {
                                    var columns = lp.get('Columns').slice();
                                    columns.push({Name: ZIndexField, ColumnSimpleType: 'integer'});
                                    lp.set('Columns', columns);
                                }
                                lp.save().done(saveReorderArrays);
                            });
                            removeDialog(jDialog);
                        });
                    var jDialog = showDialog(_gtxt('VectorSorting.askTitle'), dialogGUI[0], 330, 75);
                } else {
                    saveReorderArrays();
                }
            }
        }, 'Layer');
    }
};

gmxCore.addModule('VectorSorting', publicInterface);

})();
