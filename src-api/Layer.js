//Поддержка addLayer
(function()
{
    // Добавление слоя
    var addLayer = function(parentObj, layer, isVisible, isMerc) {
        var FlashMapObject = gmxAPI._FMO;
        if (!parentObj.layers)
            parentObj.layers = [];
      
        if (!parentObj.layersParent) {
            parentObj.layersParent = parentObj.addObject(null, null, {'layersParent': true});
        }
        // if (!parentObj.overlays)
        // {
            // parentObj.overlays = parentObj.addObject(null, null, {'overlaysParent': true});
            // parentObj.addObject = function(geom, props, propHiden) {
                // var ret = FlashMapObject.prototype.addObject.call(parentObj, geom, props, propHiden);
                // parentObj.overlays.bringToTop();
                // return ret;
            // }
        // }
        
        if (isVisible === undefined)
            isVisible = true;
        
        // var zIndex = parentObj.layers.length;
        var prop = layer.getGmxProperties();

        //if(!layer) layer = {};
        //if (!layer.properties) layer.properties = {};
        if (!prop.identityField) prop.identityField = "ogc_fid";

        var isRaster = (prop.type == "Raster");
        var layerName = prop.name || prop.image;
        if(!prop.name) prop.name = layerName;

        var pObj = parentObj.layersParent
        var obj = pObj.addObject(null, prop);
        // obj.tilesParent = layer.properties.IsRasterCatalog ? obj : null; 
        obj.geometry = layer.geometry;
        obj.properties = prop;
        if(parentObj.layers[layerName]) {
            for(var i = parentObj.layers.length - 1; i >= 0; i--) { // Удаление слоя из массива
                //var prop = parentObj.layers[i].properties;
                if(parentObj.layers[i].properties.name === layerName) {
                    parentObj.layers.splice(i, 1);
                    break;
                }
            }
        }
        parentObj.layers.push(obj);
        parentObj.layers[layerName] = obj;
        if (!prop.LayerVersion) obj.notServer = true;
        if (!prop.title) prop.title = 'layer from client ' + layerName;
        if (!prop.title.match(/^\s*[0-9]+\s*$/))
            parentObj.layers[prop.title] = obj;

        var filters = [],
            styles = prop.styles || [];
        for (var i = 0, len = styles.length; i < len; i++) {
            var filter = obj.addObject(null, {}); // MapObject для фильтра
            gmxAPI._leaflet.mapNodes[filter.objectId].type = 'filter';
            filter.type = 'filter';
            filter._attr = styles[i];
            filters.push(filter);
        }
        obj.filters = filters;

        var bounds = false;    // в меркаторе
        var boundsLatLgn = false;
        var initBounds = function() { // geom в меркаторе
            var geom = obj.geometry,
                coords = geom ? geom.coordinates : [[[-20037508, -20037508], [20037508, 20037508]]];
            bounds = gmxAPI.getBounds(coords);
            var sw = L.Projection.Mercator.unproject({x: bounds.minX, y: bounds.minY});
            var ne = L.Projection.Mercator.unproject({x: bounds.maxX, y: bounds.maxY});
            obj.bounds = boundsLatLgn = {
                minX: sw.lng,
                minY: sw.lat,
                maxX: ne.lng,
                maxY: ne.lat
            };
        };
        obj.getLayerBounds = function() {           // Получение boundsLatLgn для внешних плагинов
            if (!boundsLatLgn) initBounds();
            return boundsLatLgn;
        }

        gmxAPI._cmdProxy(isRaster ? 'setBackgroundTiles' : 'setVectorTiles', {'obj': obj });

        obj.isVisible = isVisible;
        return obj;
    }

    //расширяем FlashMapObject
    gmxAPI.extendFMO('addLayer', function(layer, isVisible, isMerc) {
        var obj = addLayer(this, layer, isVisible, isMerc);
        //gmxAPI._listeners.dispatchEvent('onAddExternalLayer', gmxAPI.map, obj); // Добавлен внешний слой
        return obj;
    } );

})();
