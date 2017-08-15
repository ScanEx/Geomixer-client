var fieldsTable2;

(function () {
    var sizes = ["15%", "15%", "15%", "20%", "15%", "20%"];
    var defaultAliases = { "Num": "ID", "Width": "Width", "Length": "Length"};

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
        if (props.name === 'BAF152F0340C4A1E96FC830E64CA4633') {
            aliases = {"width": "width", "length": "length", "status": "status", "speed": "speed"};
        }

        aliases = aliases || defaultAliases;

        aliases['buttons'] = 'buttons';

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
        fieldsTable2 = new VesselSARDetection(
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
        pluginName: 'VesselSARDetectionPlugin',
        afterViewer: function (params) {
            //инициализация после того, как дерево загрузится
            initLayersTreeDoubleClick();

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

    window.gmxCore && window.gmxCore.addModule('VesselSARDetectionPlugin', publicInterface, {
        init: function (module, path) {
            return $.when(
                gmxCore.loadScript(path + "LeftMenuEx.js"),
                gmxCore.loadScript(path + "VesselSARDetection.js"),
                gmxCore.loadScript(path + "/themesModule/styleHookManager.js"),
                gmxCore.loadScript(path + "/themesModule/shared.js")
            );
        },
        css: 'style.css'
    });
})();
