(function() {

    _translationsHash.addtext("rus", {
        "add2MapPlugin.iconTitle" : "Добавить новый объект"
    });
    _translationsHash.addtext("eng", {
        "add2MapPlugin.iconTitle" : "Add new object"
    });

    var DEFAULT_ICON = 'img/add2map/add-24.ico';

    var parseParams = function(params) {
        var res = null;
        for (var p in params) {
            var m = p.match(/(regularImage|activeImage|layerName)(.*)/);
            if (!m) continue;

            var id = 'id' + m[2];

            res = res || {};
            res[id] = res[id] || {};
            res[id][m[1]] = params[p];
        }

        return res || { 'id': {
            regularImage: DEFAULT_ICON
        }};
    }

    var publicInterface = {
        pluginName: 'Add2Map',
        afterViewer: function(params, map) {

            if (!map) {return;}

            var path = gmxCore.getModulePath('Add2MapPlugin');
            var lmap = nsGmx.leafletMap,
                layersByID = nsGmx.gmxMap.layersByID;

            var parsedParams = parseParams(params);
            $.each(parsedParams, function(id, toolParams) {
                var layerName = toolParams.layerName,
                    regularImage = toolParams.regularImage || DEFAULT_ICON,
                    activeImage = toolParams.activeImage || regularImage,
                    lastDrawingFeature = null;

                var icon = L.control.gmxIcon({
                    id: 'add2mapIcon',
                    togglable: true,
                    regularImageUrl: regularImage.search(/^https?:\/\//) !== -1 ? regularImage : path + regularImage,
                    activeImageUrl:  activeImage.search(/^https?:\/\//) !== -1 ? activeImage : path + activeImage,
                    title: _gtxt('add2MapPlugin.iconTitle')
                }).on('statechange', function(ev) {
                    var control = ev.target,
                        activeLayer = null;

                    if (control.options.isActive) {
                        activeLayer = layerName;
                        var active = $(_queryMapLayers.treeCanvas).find(".active");

                        if (!activeLayer && active[0] && active[0].parentNode.getAttribute("LayerID") &&
                            active[0].parentNode.gmxProperties.content.properties.type === "Vector")
                        {
                            activeLayer = active[0].parentNode.gmxProperties.content.properties.name;
                        }

                        if (!activeLayer) {
                            return;
                        }

                        var layerRights = _queryMapLayers.layerRights(activeLayer);
                        if (layerRights !== 'edit' && layerRights !== 'editrows') {
                            nsGmx.widgets.authWidget.showLoginDialog();
                            return;
                        }

                        var type = layersByID[activeLayer]._gmx.properties.GeometryType.toUpperCase();
                        var geojson = L.gmxUtil.geometryToGeoJSON({
                            type: type
                        });
                        var addDone = function (ev) {
                            lastDrawingFeature.off('drawstop', addDone);
                            var editControl = new nsGmx.EditObjectControl(activeLayer, null, {
                                drawingObject: lastDrawingFeature
                            });
                            lastDrawingFeature = null;
                            icon.setActive();
                        };
                        var addBegin = function (ev) {
                            lastDrawingFeature = ev.object;
                            lastDrawingFeature.on('drawstop', addDone);
                            lmap.gmxDrawing.off('add', addBegin);
                        };

                        lmap.gmxDrawing.on('add', addBegin);
                        lmap.gmxDrawing.create(geojson.type);
                    } else {
                        if (lastDrawingFeature) {
                            lastDrawingFeature.remove();
                            lastDrawingFeature = null;
                        }
                        lmap.gmxDrawing.create(); //прекратить рисование
                    }
                });
                lmap.addControl(icon);
            });
        }
    };

    gmxCore.addModule('Add2MapPlugin', publicInterface, {css: 'Add2MapPlugin.css'});
})();
