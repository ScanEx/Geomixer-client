(function (_) {
    'use strict';
// todo:
//  1. Если у слоя нет атрибута для сохранения порядка объектов, ему показывается предупреждающий диалог (как в плагине описаний)
//  2. В процессе сохранения изменений показывается стандартная крутилка Редактора, после окончания - надписть “Порядок объектов сохранён”

nsGmx.Translations.addText("rus", {
    'VectorSorting.menuTitle' : 'Сохранить порядок объектов'
});
nsGmx.Translations.addText("eng", {
    "VectorSorting.menuTitle" : 'Save the order of objects'
});

var publicInterface = {
    pluginName: 'Sorting Plugin'
    ,
	afterViewer: function(params, map) {
        nsGmx.ContextMenuController.addContextMenuElem({
            title: function() {
                return _gtxt("VectorSorting.menuTitle"); 
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
                    props.ZIndexField &&
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
                    L.gmxUtil.sendCrossDomainPostRequest(
                        'http://' + layer._gmx.hostName + '/VectorLayer/Search.ashx',
                        {
                            WrapStyle: 'window',
                            layer: layerID,
                            columns: '[{"Value":"min([' + props.ZIndexField + '])","Alias":"min"},{"Value":"max([' + props.ZIndexField + '])","Alias":"max"}]'
                        },
                        function(ph) {
                            if (ph.Status === 'ok' && ph.Result) {
                                var minmax = ph.Result.values[0],
                                    minStart =  minmax[0] - 1,
                                    maxStart =  minmax[1] + 1,
                                    out = [];

                                sorted.bottom.map(function(id, i) {
                                    var properties = {};
                                    properties[props.ZIndexField] = minStart - i;
                                    out.push({id: id, properties: properties, action: 'update'});
                                });

                                sorted.top.map(function(id, i) {
                                    var properties = {};
                                    properties[props.ZIndexField] = maxStart + i;
                                    out.push({id: id, properties: properties, action: 'update'});
                                });

                                if (out.length) {
                                    _mapHelper.modifyObjectLayer(layerID, out).done(function() {
                                        layer.clearReorderArrays();
                                        //mediaDescDialog.dialog('close').remove();
                                    });
                                }
                            } else {
                                console.error('Server return:', ph);
                            }
                        }
                    );
                }
            }
        }, 'Layer');
    }
};

gmxCore.addModule('VectorSorting', publicInterface);

})(nsGmx.Utils._);
