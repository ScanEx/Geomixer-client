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
            var LMap = nsGmx.leafletMap,
                layersByID = nsGmx.gmxMap.layersByID;
            
            var parsedParams = parseParams(params);
            $.each(parsedParams, function(id, toolParams) {
                var layerName = toolParams.layerName;
                
                var regularImage = toolParams.regularImage || DEFAULT_ICON;
                var activeImage = toolParams.activeImage || regularImage;
                
                var mapListenerId = null;
                var icon = new L.Control.gmxIcon({
                    id: 'add2mapIcon', 
                    togglable: true,
                    regularImageUrl: regularImage.search(/^https?:\/\//) !== -1 ? regularImage : path + regularImage,
                    //activeImageUrl:  activeImage.search(/^https?:\/\//) !== -1 ? activeImage : path + activeImage,
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
                            LMap.gmxDrawing.off('add', addDone, this);
                            icon.setActive();
                            var geojson = ev.object.toGeoJSON();
                            geojson.geometry.type = geojson.geometry.type.toUpperCase();
                            var editControl = new nsGmx.EditObjectControl(activeLayer, null, {
                                drawingObject: ev.object
                            });
                        };

                        LMap.gmxDrawing.on('add', addDone, this);
                        LMap.gmxDrawing.create(geojson.type);
                    }
                });
                LMap.addControl(icon);
            });
        }
    };
    
    gmxCore.addModule('Add2MapPlugin', publicInterface, {css: 'Add2MapPlugin.css'});
})();