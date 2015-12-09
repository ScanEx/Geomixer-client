(function (_) {
    'use strict';

var ZINDEX_DEFAULT_FIELD = '_zIndex';
nsGmx.Translations.addText("rus", {
    'VectorSorting.menuTitle' : 'Сохранить порядок объектов',
    'VectorSorting.done' : 'Порядок объектов сохранён',
    'VectorSorting.button' : 'Создать',
    'VectorSorting.askField' : 'Создать поле "' + ZINDEX_DEFAULT_FIELD + '"?'
});
nsGmx.Translations.addText("eng", {
    "VectorSorting.menuTitle" : 'Save the order of objects',
    'VectorSorting.done' : 'The order of objects saved',
    'VectorSorting.button' : 'Create',
    'VectorSorting.askField' : 'Create field "' + ZINDEX_DEFAULT_FIELD + '"?'
});

var pluginPath = gmxCore.getModulePath('VectorSorting');

var publicInterface = {
    pluginName: 'Sorting Plugin'
    ,
	afterViewer: function(params, map) {
        nsGmx.ContextMenuController.addContextMenuElem({
            title: function() {
                return _gtxt('VectorSorting.menuTitle'); 
            },

            isVisible: function(context) {
                var elem = context.elem,
                    layer = nsGmx.gmxMap.layersByID[elem.name],
                    props = layer.getGmxProperties(),
                    sorted = layer.getReorderArrays(),
                    isNeedMenu = sorted.top.length + sorted.bottom.length;
                return isNeedMenu &&
                    props.type === 'Vector' && 
                    (props.GeometryType === 'polygon' || props.GeometryType === 'linestring') &&
                    // props.ZIndexField &&
                    !context.layerManagerFlag && 
                    _queryMapLayers.currentMapRights() === "edit";
            },

            clickCallback: function(context) {
                var elem = context.elem,
                    layerID = elem.name,
                    layer = nsGmx.gmxMap.layersByID[layerID],
                    props = layer.getGmxProperties(),
                    sorted = layer.getReorderArrays(),
                    isNeedMenu = sorted.top.length + sorted.bottom.length;

                if (isNeedMenu) {
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
                                if (ph.Status === 'ok' && ph.Result) {
                                    var minmax = ph.Result.values[0],
                                        minStart =  minmax[0] - 1,
                                        maxStart =  minmax[1] + 1,
                                        out = [];

                                    sorted.bottom.map(function(id, i) {
                                        var properties = {};
                                        properties[ZIndexField] = minStart - i;
                                        out.push({id: id, properties: properties, action: 'update'});
                                    });

                                    sorted.top.map(function(id, i) {
                                        var properties = {};
                                        properties[ZIndexField] = maxStart + i;
                                        out.push({id: id, properties: properties, action: 'update'});
                                    });

                                    if (out.length) {
                                        _mapHelper.modifyObjectLayer(layerID, out).done(function() {
                                            layer.clearReorderArrays();
                                            nsGmx.widgets.notifications.stopAction('saveOrders', 'success', _gtxt('VectorSorting.done'));
                                        });
                                    }
                                } else {
                                    console.error('Server return:', ph);
                                }
                            }
                        );
                    };
                    
                    var isFieldFound = layer._gmx.tileAttributeIndexes[ZIndexField];
                    if (!props.ZIndexField || !isFieldFound) {
                        var addField = makeButton(_gtxt('VectorSorting.button'));
                        addField.onclick = function() {
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
                                lp.save().done(function() {
                                    saveReorderArrays();
                                });
                            });
                            removeDialog(jDialog);
                        };
                        var jDialog = showDialog(_gtxt('VectorSorting.askField'), _div([addField],[['css','textAlign','center']]), 220, 75);
                    } else {
                        saveReorderArrays();
                    }
                }
            }
        }, 'Layer');
    }
};

gmxCore.addModule('VectorSorting', publicInterface);

})(nsGmx.Utils._);
