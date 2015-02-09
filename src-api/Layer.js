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
        if (!parentObj.overlays)
        {
            parentObj.overlays = parentObj.addObject(null, null, {'overlaysParent': true});
            parentObj.addObject = function(geom, props, propHiden) {
                var ret = FlashMapObject.prototype.addObject.call(parentObj, geom, props, propHiden);
                parentObj.overlays.bringToTop();
                return ret;
            }
        }
        var proxy = gmxAPI._cmdProxy;
        
        if (isVisible === undefined)
            isVisible = true;
        
        var zIndex = parentObj.layers.length;
        if(!layer) layer = {};
        if(!layer.properties) layer.properties = {};
        if(!layer.properties.identityField) layer.properties.identityField = "ogc_fid";

        var isRaster = (layer.properties.type == "Raster");
        var layerName = layer.properties.name || layer.properties.image || gmxAPI.newFlashMapId();
        if(!layer.properties.name) layer.properties.name = layerName;

        var pObj = parentObj.layersParent
        var obj = pObj.addObject(null, layer.properties);
        obj.tilesParent = layer.properties.IsRasterCatalog ? obj : null; 
        obj.geometry = layer.geometry;
        obj.properties = layer.properties;
        if(parentObj.layers[layerName]) {
            for(var i = parentObj.layers.length - 1; i >= 0; i--) { // Удаление слоя из массива
                var prop = parentObj.layers[i].properties;
                if(prop.name === layerName) {
                    parentObj.layers.splice(i, 1);
                    break;
                }
            }
        }
        parentObj.layers.push(obj);
        parentObj.layers[layerName] = obj;
        if (!layer.properties.LayerVersion) obj.notServer = true;
        if (!layer.properties.title) layer.properties.title = 'layer from client ' + layerName;
        if (!layer.properties.title.match(/^\s*[0-9]+\s*$/))
            parentObj.layers[layer.properties.title] = obj;

        var filters = [],
            styles = layer.properties.styles || [];
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
            var geom = obj.geometry;
            bounds = gmxAPI.getBounds(geom.coordinates);
            obj.bounds = boundsLatLgn = {
                minX: gmxAPI.from_merc_x(bounds.minX),
                minY: gmxAPI.from_merc_y(bounds.minY),
                maxX: gmxAPI.from_merc_x(bounds.maxX),
                maxY: gmxAPI.from_merc_y(bounds.maxY)
            };
            if (geom.type === 'MULTIPOLYGON') {
                obj.boundsArr = [];
                obj.boundsLatLgnArr = [];
                for (var i = 0, len = geom.coordinates.length; i < len; i++) {
                    var ext = gmxAPI.getBounds(geom.coordinates[i]);
                    obj.boundsArr.push(ext);
                    obj.boundsLatLgnArr.push({
                        minX: gmxAPI.from_merc_x(ext.minX),
                        minY: gmxAPI.from_merc_y(ext.minY),
                        maxX: gmxAPI.from_merc_x(ext.maxX),
                        maxY: gmxAPI.from_merc_y(ext.maxY)
                    });
                }
            }
        };
        var getBoundsMerc = function() {
            if (!bounds) initBounds(obj.mercGeometry);
            return bounds;
        };
        var getBoundsLatLng = function() {
            if (!bounds) initBounds(obj.mercGeometry);
            return boundsLatLgn;
        };
        obj.getLayerBounds = function() {           // Получение boundsLatLgn для внешних плагинов
            //var gmxlayer = gmxAPI.map.layersByID[layerName];
            if (!boundsLatLgn) initBounds(obj.mercGeometry);
            return obj.boundsLatLgnArr ? obj.boundsLatLgnArr[0] : boundsLatLgn;
        }
        obj.getLayerBoundsArrayMerc = function() {      // Получение массива bounds в меркаторе
            if (!boundsLatLgn) initBounds(obj.mercGeometry);
            return (obj.boundsArr ? obj.boundsArr : [bounds]);
        }
        
        obj.getBoundsMerc = function() {            // Получение boundsMerc в меркаторе
            return getBoundsMerc();
        }

        gmxAPI.extend(obj, {        // определение свойств до установки видимости
            addBalloonHook: function(func) {
                console.log('addBalloonHook', arguments);
            },
            setImageProcessingHook: function(func) {
                return gmxAPI._cmdProxy('setImageProcessingHook', { 'obj': obj, 'attr':{'func':func} });
            },

            removeImageProcessingHook: function() {
                return gmxAPI._cmdProxy('removeImageProcessingHook', { 'obj': obj });
            },

            setDateInterval: function(dt1, dt2) {  // Установка временного интервала
                //console.log('setDateInterval на растровом слое');
            },
            getDateInterval: function() {  // Получить временной интервал
                //console.log('getDateInterval на растровом слое');
                return {
                    beginDate: obj.dt1
                    ,endDate: obj.dt2
                };
            }
        });
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
