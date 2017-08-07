var fieldsTable2;

(function () {
    var sizes = ["20%", "20%", "20%", "40%"];
    // var aliases = { "Num": "ID", "Name": "Номер", "Kultura": "Культура", "Area_zak": "Площадь зак. (га)", "Area": "Площадь (га)" };
    var defaultAliases = { "Num": "ID", "Width": "Width", "Length": "Length"};
    //var aliases = { "name": "название", "value": "значение" };
    //var sumFieldName = "value";

    function showFieldsTableMenu(layer, aliases) {
        var props = layer.getGmxProperties && layer.getGmxProperties(),
            attrs = props.attributes;

        if (!aliases) {
            aliases = {};

            for (var i = 0; i < attrs.length; i++) {
                aliases[attrs[i]] = attrs[i];
            }

        }

        // ugly
        if (props.name === 'AE797ADB33054FAABCBCCD2181502F49') {
            aliases = {"Width": "Width", "Length": "Length"};
        }

        aliases = aliases || defaultAliases;

        aliases['buttons'] = 'buttons';
        // nsGmx.leafletMap.addLayer(layer);

        if (fieldsTable2 && props.name == fieldsTable2._layerName) {
            return;
        }

        if (fieldsTable2) {
            fieldsTable2.clearCache();
            fieldsTable2.removeAllSelection();
            fieldsTable2.clear();
            fieldsTable2 = null;
        }

        var fieldsMenu = new LeftMenuEx();
        fieldsTable2 = new FieldsTableEx(
            fieldsMenu,
            aliases,
            props.identityField,
            props.attributes,
            sizes);
        fieldsTable2.showFieldsTable(props);
    };

    function initLayersTreeDoubleClick() {
        _layersTree.treeModel.forEachNode(function (node) {
            if (node.type === "layer") {
                var l = nsGmx.gmxMap.layersByID[node.content.properties.name];
                //var prop = gmxAPI.map.layers[node.content.properties.name].properties;
                var prop = l.getGmxProperties();
                if (prop.type === "Vector" && 'detection_technique' in prop.MetaProperties) {
                    $(node).on('dblclick', function () {
                        showFieldsTableMenu(node.content.properties);
                    })
                }
            }
        });
    };

    var publicInterface = {
        pluginName: 'FieldsTablePlugin',
        afterViewer: function (params) {
            //инициализация после того, как дерево загрузится
            initLayersTreeDoubleClick();

            //автоматически показать таблицу
            if (params.autoloadId) {
                var layer = nsGmx.gmxMap.layersByID[params.autoloadId];
                if (layer) {
                        if (params.fields) {
                            var fields = params.fields.split(', '),
                                fieldsObj = {};

                            for (var i = 0; i < fields.length; i++) {
                                fieldsObj[fields[i]] = fields[i];
                            }
                        }

                    showFieldsTableMenu(layer, fieldsObj);
                }
            }
        }
    };

    window.gmxCore && window.gmxCore.addModule('FieldsTablePlugin', publicInterface, {
        init: function (module, path) {
            return $.when(
                gmxCore.loadScript(path + "LeftMenuEx.js"),
                gmxCore.loadScript(path + "FieldsTableEx.js"),
                gmxCore.loadScript(path + "/themesModule/styleHookManager.js"),
                gmxCore.loadScript(path + "/themesModule/shared.js")
            );
        },
        css: 'style.css'
    });
})();
