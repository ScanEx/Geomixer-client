//Поддержка addLayer
(function()
{
 // получить minZoom maxZoom для слоя по фильтрам
 function getMinMaxZoom(prop)
 {
  var minZoom = 20, maxZoom = 0, len = prop.styles.length;
  if (len) {
      for (var i = 0; i < len; i++)
      {
       var style = prop.styles[i];
       minZoom = Math.min(style.MinZoom || gmxAPI.defaultMinZoom, minZoom);
       maxZoom = Math.max(style.MaxZoom || gmxAPI.defaultMaxZoom, maxZoom);
      }
  } else {
    minZoom = 1, maxZoom = 30;
  }
  return {'minZoom': minZoom, 'maxZoom': maxZoom};
 }

 // Подготовка атрибутов фильтра стилей 
 function getFilterAttr(style)
 {
  // Получение стилей фильтра
  var regularStyle = {};
  if (typeof style.StyleJSON != 'undefined')
   regularStyle = style.StyleJSON;
  else if (typeof style.RenderStyle != 'undefined')
   regularStyle = style.RenderStyle;
  else
  {
   // стиль по умолчанию
   if (style.PointSize)
    regularStyle.marker = { size: parseInt(style.PointSize) };
   if (style.Icon)
   {
    var src = (style.Icon.indexOf("http://") != -1) ?
     style.Icon :
     (baseAddress + "/" + style.Icon);
    regularStyle.marker = { image: src, "center": true };
   }
   if (style.BorderColor || style.BorderWidth)
    regularStyle.outline = {
     color: gmxAPI.parseColor(style.BorderColor),
     thickness: parseInt(style.BorderWidth || "1"),
     opacity: (style.BorderWidth == "0" ? 0 : 100)
    };
   if (style.FillColor)
    regularStyle.fill = {
     color: gmxAPI.parseColor(style.FillColor),
     opacity: 100 - parseInt(style.Transparency || "0")
    };

   var label = style.label || style.Label;
   if (label)
   {
    regularStyle.label = {
     field: label.FieldName,
     color: gmxAPI.parseColor(label.FontColor),
     size: parseInt(label.FontSize || "12")
    };
   }
  }

  if (regularStyle.marker)
   regularStyle.marker.center = true;

  var hoveredStyle = null;
  if (typeof style.HoverStyle != 'undefined') hoveredStyle = style.HoverStyle;
  else {
   hoveredStyle = JSON.parse(JSON.stringify(regularStyle));
   if (hoveredStyle.marker && hoveredStyle.marker.size) hoveredStyle.marker.size += 1;
   if (hoveredStyle.outline) hoveredStyle.outline.thickness += 1;
   if (hoveredStyle.fill && 'opacity' in hoveredStyle.fill) hoveredStyle.fill.opacity = Math.min(Number(hoveredStyle.fill.opacity + 20), 100);
  }

  // Получение sql строки фильтра
  var name = '';
  var sql = '';
  if (style.Filter)
  {
   if (/^\s*\[/.test(style.Filter))
   {
    var a = style.Filter.match(/^\s*\[([a-zA-Z0-9_]+)\]\s*([<>=]=?)\s*(.*)$/);
    if (a && (a.length == 4))
    {
     sql = a[1] + " " + a[2] + " '" + a[3] + "'";
    }
   }
   else
   {
    sql = style.Filter;
   }
   if (style.Filter.Name) name = style.Filter.Name; // имя фильтра - для map.layers в виде хэша
  }
  var DisableBalloonOnMouseMove = ('DisableBalloonOnMouseMove' in style ? style.DisableBalloonOnMouseMove : true);
  var out = {
   'name': name,
   'BalloonEnable': style.BalloonEnable || true,
   'DisableBalloonOnClick': style.DisableBalloonOnClick || false,
   'DisableBalloonOnMouseMove': DisableBalloonOnMouseMove,
   'regularStyle': regularStyle,
   'hoveredStyle': hoveredStyle,
   'MinZoom': style.MinZoom || gmxAPI.defaultMinZoom,
   'MaxZoom': style.MaxZoom || gmxAPI.defaultMaxZoom,
   'style': style,
   'sql': sql
  };
  if(style.Balloon) out.Balloon = style.Balloon;
  if(style.clusters) out.clusters = style.clusters;
  return out;
 }

 // Инициализация фильтра
 var initFilter = function(prnt, num)
 {
  var filter = prnt.filters[num];
  var obj_ = prnt.addObject(null, null, {'nodeType': 'filter'});
  filter.objectId = obj_.objectId;

  var attr = filter._attr;
  filter.setFilter(attr.sql || '');

  filter.getPatternIcon = function(size)
  {
   var ph = filter.getStyle(true);
   return gmxAPI.getPatternIcon(ph.regular, size);
  }

  filter.setZoomBounds(attr.MinZoom, attr.MaxZoom);
  filter._attr = attr;
        
  gmxAPI._listeners.dispatchEvent('initFilter', gmxAPI.map, {'filter': filter} ); // Проверка map Listeners на reSetStyles - для балунов

        filter.getBalloonTemplate = function() {
            return filter._balloonTemplate;
        }
  prnt.filters[num] = filter;
  gmxAPI.mapNodes[filter.objectId] = filter;

  var proxy = gmxAPI._cmdProxy;
        gmxAPI.extend(filter, {    // переопределение свойств после установки видимости
            setStyleHook: function(func) {  // Установка стилевой функции пользователя
                return proxy('setStyleHook', { obj: filter, attr:{data: func} });
            }
            ,removeStyleHook: function() {  // удаление стилевой функции пользователя
                return proxy('removeStyleHook', { obj: filter, attr:{data: attr} });
            }
        });
  return filter;
 }

 // Добавление фильтра
 // Ключи :
 // * Balloon: текст баллуна
 // * BalloonEnable: показывать ли баллун
 // * DisableBalloonOnClick: не показывать при клике
 // * DisableBalloonOnMouseMove: не показывать при наведении
 // * RenderStyle: стиль фильтра
 // * MinZoom: мин.зум
 // * MaxZoom: макс.зум
 // * sql: строка фильтра
 var addFilter = function(prnt, style)
 {
   var attr = getFilterAttr(style);

  if(!attr) attr = {};
  var filter = new gmxAPI._FMO(false, {}, prnt); // MapObject для фильтра
  var num = prnt.filters.length;     // Номер фильтра в массиве фильтров
  var lastFilter = (num > 0 ? prnt.filters[num - 1] : null); // Последний существующий фильтр
  if(!attr && lastFilter) {
   attr = gmxAPI.clone(lastFilter._attr);
  }
  if(!attr.MinZoom) attr.MinZoom = gmxAPI.defaultMinZoom;
  if(!attr.MaxZoom) attr.MaxZoom = gmxAPI.defaultMaxZoom;

  filter._attr = attr;
  prnt.filters.push(filter);
  if (attr.name)
   prnt.filters[attr.name] = filter;

  if(!filter.clusters && attr.clusters && '_Clusters' in gmxAPI) {
   filter.clusters = new gmxAPI._Clusters(filter); // атрибуты кластеризации потомков по фильтру
   filter.setClusters(attr.clusters);
  }
        gmxAPI.extend(filter, {         // определение свойств до установки видимости
            setStyleHook: function(func) {
                attr.styleHook = func;
                return true;
            }
            ,removeStyleHook: function() {
                delete attr.styleHook;
                return true;
            }
  });

  gmxAPI._listeners.dispatchEvent('addFilter', prnt, {'filter': filter} );   // Listeners на слое - произошло добавление фильтра
  if(prnt.objectId) filter = initFilter(prnt, num); // если слой виден - инициализация фильтра

  // Удаление фильтра
  filter.remove = function()
  {
   var ret = gmxAPI._FMO.prototype.remove.call(this);
   if(prnt.filters[attr.name]) delete prnt.filters[attr.name];
   for(var i=0; i<prnt.filters.length; i++) {
    if(this == prnt.filters[i]) {
     prnt.filters.splice(i, 1);
     break;
    }
   }
  }
  return filter;
 }

    // Добавление слоя
    var addLayer = function(parentObj, layer, isVisible, isMerc)
    {
        var FlashMapObject = gmxAPI._FMO;
        if (!parentObj.layers)
            parentObj.layers = [];
        
        if (!parentObj.layersParent) {
            parentObj.layersParent = parentObj.addObject(null, null, {'layersParent': true});
        }
        if (!parentObj.overlays)
        {
            parentObj.overlays = parentObj.addObject(null, null, {'overlaysParent': true});
            parentObj.addObject = function(geom, props, propHiden)
            {
                var ret = FlashMapObject.prototype.addObject.call(parentObj, geom, props, propHiden);
                parentObj.overlays.bringToTop();
                return ret;
            }
            
        }
        var proxy = gmxAPI._cmdProxy;

        var getIndexLayer = function(sid)
        { 
            var myIdx = parentObj.layers.length;
            var n = 0;
            for (var i = 0; i < myIdx; i++)
            {
                var l = parentObj.layers[i];
                if (l.objectId && (l.properties.type != "Overlay")) {
                    if (l.objectId == sid) break;
                    n += 1;
                }
            }
            return n;
        }
        
        if (isVisible === undefined)
            isVisible = true;
        
        var obj = new gmxAPI._FMO(false, {}, parentObj);     // MapObject слоя

        var zIndex = parentObj.layers.length;
        if(!layer) layer = {};
        if(!layer.properties) layer.properties = {};
        if(!layer.properties.identityField) layer.properties.identityField = "ogc_fid";

        obj.geometry = layer.geometry;
        if(obj.geometry) {
            if(isMerc) {
                obj.mercGeometry = obj.geometry; 
                obj.geometry = gmxAPI.from_merc_geometry(obj.mercGeometry);
            } else {
                obj.mercGeometry = gmxAPI.merc_geometry(obj.geometry); 
            }
        } else {
            obj.mercGeometry = {
                'type': "POLYGON"
                ,'coordinates': [[
                    [-20037500, -21133310]
                    ,[-20037500, 21133310]
                    ,[20037500, 21133310]
                    ,[20037500, -21133310]
                    ,[-20037500, -21133310]
                ]]
            };
            obj.geometry = gmxAPI.from_merc_geometry(obj.mercGeometry); 
        }
        
        var isRaster = (layer.properties.type == "Raster");
        var layerName = layer.properties.name || layer.properties.image || gmxAPI.newFlashMapId();
        if(!layer.properties.name) layer.properties.name = layerName;
        //obj.geometry = layer.geometry;
        //obj.mercGeometry = layer.mercGeometry;

        obj.properties = layer.properties;
        obj.propHiden = { 'isLayer': true, 'isMerc': isMerc };
        var isOverlay = false;
        var overlayLayerID = gmxAPI.getBaseMapParam("overlayLayerID","");
        if(typeof(overlayLayerID) == 'string') {
            var arr = overlayLayerID.split(",");
            for (var i = 0; i < arr.length; i++) {
                if(layerName == arr[i]) {
                    isOverlay = true;
                    break;
                }
            }
        }

        if (isOverlay)
            layer.properties.type = "Overlay";

        obj.filters = [];
        obj.filters.foreach = function(callback) {
            for (var i = 0, len = obj.filters.length; i < len; i++) {
                if(callback(obj.filters[i], i) === false) return;
            }
        }

        if (!isRaster) {
            if(!layer.properties.styles) {  // стиль-фильтр по умолчанию
                layer.properties.styles = [
                    {
                        'BalloonEnable': true
                        ,'DisableBalloonOnClick': false
                        ,'DisableBalloonOnMouseMove': false
                        ,'MinZoom': gmxAPI.defaultMinZoom
                        ,'MaxZoom': gmxAPI.defaultMaxZoom
                        ,'RenderStyle': {'outline': {'color': 255,'thickness': 1}}
                    }
                ];
            }
            // Добавление начальных фильтров
            for (var i = 0, len = layer.properties.styles.length; i < len; i++) {
                var style = layer.properties.styles[i];
                    //attr = getFilterAttr(style);
                addFilter(obj, style);
            }
            obj.addFilter = function(style) {
                var filter = addFilter(obj, style);
                filter.setStyle(filter._attr.regularStyle, filter._attr.hoveredStyle);
                if(filter._attr.clusters) filter.setClusters(filter._attr.clusters);
                return filter;
            };
            obj.getItem = function(pid, flagMerc) {             // Получить обьект векторного слоя
                return proxy('getItem', { 'obj': obj, 'attr':{layerId:obj.objectId, itemId:pid, flagMerc:flagMerc} });
            };
            obj.addItems = function(attr) {     // добавление обьектов векторного слоя
                return proxy('addItems', { 'obj': obj, 'attr':{'layerId':obj.objectId, 'data': attr} });
            };
            obj.removeItems = function(attr) {  // удаление обьектов векторного слоя 
                return proxy('removeItems', { 'obj': obj, 'attr':{'layerId':obj.objectId, 'data': attr} });
            };
            obj.setSortItems = function(attr) { // установка сортировки обьектов векторного слоя 
                return proxy('setSortItems', { 'obj': obj, 'attr':{'layerId':obj.objectId, 'data': attr} });
            };
            obj.setFlipItems = function(arr, flag) {    // Установить массив flip обьектов
                return proxy('setFlipItems', { 'obj': obj, 'attr':{layerId:obj.objectId, arr: arr, clear: flag} });
            };
            obj.getFlipItems = function() {             // Получить массив id flip обьектов
                return proxy('getFlipItems', { 'obj': obj, 'attr':{layerId:obj.objectId} });
            };
            obj.setRasterViewItems = function(arr) {    // Установить видимость растров обьектов
                return proxy('setRasterViewItems', { 'obj': obj, 'attr':{'layerId':obj.objectId, 'arr': arr} });
            };
            obj.bringToTopItem = function(fid) {        // Добавить обьект к массиву Flips обьектов
                return proxy('addFlip', { 'obj': obj, 'attr':{'layerId':obj.objectId, 'fid': fid} });
            };
            obj.disableFlip = function() {              // Отменить ротацию обьектов слоя
                return proxy('disableFlip', { 'obj': obj, 'attr':{'layerId':obj.objectId} });
            };
            obj.enableFlip = function() {               // Установить ротацию обьектов слоя
                return proxy('enableFlip', { 'obj': obj, 'attr':{'layerId':obj.objectId} });
            };
            obj.setWatcher = function(attr) {           // Установка подглядывателя обьекта под Hover обьектом
                return proxy('setWatcher', { 'obj': obj, 'attr':attr });
            };
            obj.removeWatcher = function() {            // Удалить подглядыватель
                return proxy('removeWatcher', { 'obj': obj });
            };
        }

        var hostName = layer.properties.hostName || gmxAPI.map.defaultHostName || "maps.kosmosnimki.ru";
        var mapName = layer.properties.mapName || gmxAPI.currentMapName || "client_side_layer";
        var baseAddress = "http://" + hostName + "/";
        var sessionKey = isRequiredAPIKey( hostName ) ? window.KOSMOSNIMKI_SESSION_KEY : false;
        var sessionKey2 = ('sessionKeyCache' in window ? window.sessionKeyCache[mapName] : false);
        var isInvalid = (sessionKey == "INVALID");

        var chkCenterX = function(arr)
        { 
            var centerX = 0;
            for (var i = 0; i < arr.length; i++)
            {
                centerX += parseFloat(arr[i][0]);
            }
            centerX /= arr.length;
            var prevCenter = centerX;
            centerX = gmxAPI.chkPointCenterX(centerX);
            var dx = prevCenter - centerX;
            for (var i = 0; i < arr.length; i++)
            {
                arr[i][0] -= dx;
            }
        }

        var bounds = false;    // в меркаторе
        var boundsLatLgn = false;
        var initBounds = function(geom) { // geom в меркаторе
            if (geom) {
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

        var tileSenderPrefixBase = baseAddress + 
            "TileSender.ashx?ModeKey=tile" + 
            "&MapName=" + encodeURIComponent(mapName) + 
            (sessionKey ? ("&key=" + encodeURIComponent(sessionKey)) : "") +
            (sessionKey2 ? ("&MapSessionKey=" + encodeURIComponent(sessionKey2)) : "");

        var tileSenderPrefix = tileSenderPrefixBase + 
            "&LayerName=" + layerName;

        var tileFunction = function(i, j, z)
        {
            if (isRaster)
            {
                if (!bounds) initBounds(obj.mercGeometry);
                var tileSize = gmxAPI.getScale(z)*256;
                var minx = i*tileSize;
                var maxx = minx + tileSize;
                if (maxx < bounds.minX) {
                    i += Math.pow(2, z);
                }
                else if (minx > bounds.maxX) {
                    i -= Math.pow(2, z);
                }
            }

            return tileSenderPrefix + 
                "&z=" + z + 
                "&x=" + i + 
                "&y=" + j;
        }

        gmxAPI.extend(obj, {        // определение свойств до установки видимости
            setDateInterval: function(dt1, dt2) {  // Установка временного интервала
                obj.dt1 = dt1;
                obj.dt2 = dt2;
            },
            getDateInterval: function() {  // Получить временной интервал
                return {
                    beginDate: obj.dt1
                    ,endDate: obj.dt2
                };
            },
            getTileCounts: function(dt1, dt2) {  // Получить количество тайлов по временному интервалу
                return 0;
            },
            setPositionOffset: function(dx, dy) {
                obj.shiftX = dx || 0;
                obj.shiftY = dy || 0;
                if(this.objectId) proxy('setPositionOffset', { obj: obj, attr:{shiftX:obj.shiftX, shiftY: obj.shiftY} });
            }
            ,getPositionOffset: function() {
                return {shiftX: obj.shiftX || 0, shiftY: obj.shiftY || 0};
            }
            ,redrawItem: function(pt) {  // Установка стилевой функции пользователя
                if(this.objectId) return proxy('redrawItem', { obj: obj, attr:pt });
                return false;
            },
            setVisibilityHook: function (func) {
                obj._visibilityHook = func;
                if(this.objectId) return proxy('setFreezeLoading', { obj: obj, attr: obj._isLoadingFreezed });
            },
            removeVisibilityHook: function (func) {
                delete obj._visibilityHook;
                if(this.objectId) return proxy('setFreezeLoading', { obj: obj, attr: obj._isLoadingFreezed });
            },
            
            setStyleHook: function(func) {  // Установка стилевой функции пользователя
                obj.filters.foreach(function(item) { item.setStyleHook(func); });
                return true;
            }
            ,removeStyleHook: function() {  // удаление стилевой функции пользователя
                obj.filters.foreach(function(item) { item.removeStyleHook(); });
                return true;
            }
            ,getStatus: function(pt) {  // Получить состояние слоя по видимому extent
                if(this.objectId) return proxy('getStatus', { obj: obj, attr:pt });
                return {isVisible: false};
            }
            ,freezeLoading: function(pt) {      // установить флаг игнорирования загрузки векторных тайлов
                obj._isLoadingFreezed = true;
                return true;
            }
            ,unfreezeLoading: function(pt) {    // удалить флаг игнорирования загрузки векторных тайлов
                obj._isLoadingFreezed = false;
                return true;
            }
            ,isLoadingFreezed: function(pt) {    // получить флаг игнорирования загрузки векторных тайлов
                return obj._isLoadingFreezed;
            }
            ,chkLayerVersion: function(callback) {  // Запросить проверку версии невидимого слоя
                if (callback) callback({"Status":"notVisible"});
                return false;
            }
        });
        if(obj.properties) {
            if('MetaProperties' in obj.properties) {
                var meta = layer.properties.MetaProperties;
                if('shiftX' in meta || 'shiftY' in meta) {
                    obj.shiftX = meta.shiftX ? meta.shiftX.Value : 0;
                    obj.shiftY = meta.shiftY ? meta.shiftY.Value : 0;
                }
            }
            var isLayerVers = obj.properties.tilesVers || obj.properties.TemporalVers || false;
            if(gmxAPI._layersVersion && isLayerVers) {  // Установлен модуль версий слоев + есть версии тайлов слоя
                gmxAPI._layersVersion.chkVersion(obj);
                obj.chkLayerVersion = function(callback) {
                    gmxAPI._layersVersion.chkLayerVersion(obj, callback);
                }
            }
        }
        if('shiftX' in obj) obj.setPositionOffset(obj.shiftX, obj.shiftY);

        var deferredMethodNames = [
            'getChildren', 'getItemsFromExtent', 'getTileItem', 'setTileItem',
            'getDepth', 'getZoomBounds', 'getVisibility', 'getStyle', 'getIntermediateLength',
            'getCurrentEdgeLength', 'getLength', 'getArea', 'getGeometryType', 'getStat', 'flip',
            'setZoomBounds', 'setBackgroundTiles', 'startLoadTiles', 'setVectorTiles', 'setTiles', 'setTileCaching',
            'setImageExtent', 'setImage', 'bringToTop', 'bringToDepth', 'setDepth', 'bringToBottom',
            'setGeometry', 'setActive',  'setEditable', 'startDrawing', 'stopDrawing', 'isDrawing', 'setLabel', 'setDisplacement',
            'removeHandler', 'clearBackgroundImage', 'addObjects', 'addObjectsFromSWF',
            'setHandler', 'setVisibilityFilter', //'remove', 'removeListener', 'addListener',
            'setClusters',
            'addImageProcessingHook', 'removeImageProcessingHook',
            'addClipPolygon', 'removeClipPolygon',
            'addContextMenuItem', 'removeContextMenuItem',
            'enableDragging', 'disableDragging',
            'redrawItem',
            'setStyle', 'setBackgroundColor', 'setCopyright', 'addObserver', 'enableTiledQuicklooks', 'enableTiledQuicklooksEx'
        ];
        // не используемые команды addChildRoot getFeatureGeometry getFeatureLength getFeatureArea

        var createThisLayer = function()
        {
            var pObj = (isOverlay ? parentObj.overlays : parentObj.layersParent);
            var obj_ = pObj.addObject(obj.geometry, obj.properties, obj.propHiden);
            obj.objectId = obj_.objectId;
            obj_.backgroundColor = obj.backgroundColor;
            obj_.stateListeners = obj.stateListeners;
            if(obj.isBaseLayer) obj_.isBaseLayer = obj.isBaseLayer;
//            if(obj['_temporalTiles']) obj_['_temporalTiles'] = obj['_temporalTiles'];

            var isTemporal = obj.properties.Temporal || false; // признак мультивременного слоя
            if(isTemporal && '_TemporalTiles' in gmxAPI) {
                obj._temporalTiles = new gmxAPI._TemporalTiles(obj);
                
            }
            if(pObj.isMiniMap) {
                obj.isMiniMap = true;   // Все добавляемые к миникарте ноды имеют этот признак
            }
            obj_.getLayerBoundsLatLgn = function() {   // Получение boundsLatLgn
                if (!boundsLatLgn) initBounds(obj.mercGeometry);
                return obj.boundsLatLgnArr ? obj.boundsLatLgnArr[0] : boundsLatLgn;
            }
            obj_.getLayerBounds = obj_.getLayerBoundsLatLgn;
            obj_.getLayerBoundsMerc = function() {    // Получение bounds в меркаторе
                if (!bounds) initBounds(obj.mercGeometry);
                return (obj.boundsArr ? obj.boundsArr : [bounds]);
            }
            obj.addObject = function(geometry, props, propHiden) { return FlashMapObject.prototype.addObject.call(obj, geometry, props, propHiden); }
            obj.tileSenderPrefix = tileSenderPrefix; // Префикс запросов за тайлами
            
            gmxAPI._listeners.dispatchEvent('onLayerCreated', obj, {'obj': obj });
        
            obj.setVisible = function(flag)
            {
                FlashMapObject.prototype.setVisible.call(obj, flag);
            }

            for (var i = 0; i < deferredMethodNames.length; i++)
                delete obj[deferredMethodNames[i]];
            delete obj["getFeatures"];
            delete obj["getFeatureById"];

            obj.setHandler = function(eventName, handler)
            {
                FlashMapObject.prototype.setHandler.call(obj, eventName, handler);
                if(gmxAPI.proxyType === 'flash') {
                    for (var i = 0; i < obj.filters.length; i++)
                        obj.filters[i].setHandler(eventName, handler);
                }
            }
            obj.removeHandler = function(eventName)
            {
                FlashMapObject.prototype.removeHandler.call(obj, eventName);
                if(gmxAPI.proxyType === 'flash') {
                    for (var i = 0; i < obj.filters.length; i++)
                        obj.filters[i].removeHandler(eventName);
                }
            }
            obj.addListener = function(eventName, handler, level)
            {
                var pID = FlashMapObject.prototype.addListener.call(obj, eventName, handler, level);
                if(gmxAPI.proxyType === 'flash') {
                    for (var i = 0; i < obj.filters.length; i++) {
                        var fID = gmxAPI._listeners.addListener({'level': level, 'pID': pID, 'obj': obj.filters[i], 'eventName': eventName, 'func': handler});
                    }
                }
                return pID;
            }
            obj.removeListener = function(eventName, eID)
            {
                FlashMapObject.prototype.removeListener.call(obj, eventName, eID);
                if(gmxAPI.proxyType === 'flash') {
                    for (var i = 0; i < obj.filters.length; i++)
                        obj.filters[i].removeListener(eventName, eID); // Удаляем массив события eventName по id события слоя
                }
            }

            obj._observerOnChange = null;
            obj.addObserver = function(o, onChange, attr)
            {
                var observeByLayerZooms = false;
                if(typeof(o) == 'function') { // вызов без доп. mapObject
                    attr = onChange;
                    onChange = o;
                    o = obj.addObject();
                    observeByLayerZooms = true;
                }
                var fAttr = {
                    'layerId': obj.objectId
                    ,'asArray': true
                    ,'geometryMode': attr && attr.geometryMode ? attr.geometryMode : 'LatLng'
                    ,'ignoreVisibilityFilter': (attr && attr.ignoreVisibilityFilter ? true : false)
                };

                var outCallBacks = function(arr) {
                    var out = [];
                }
                var func = function(arr) {
                    var out = [];
                    for (var i = 0, len = arr.length; i < len; i++) {
                        var item = arr[i];
                        var geo = (gmxAPI.proxyType === 'leaflet' ? item.geometry : gmxAPI.from_merc_geometry(item.geometry));
                        var mObj = new gmxAPI._FlashMapFeature(geo, item.properties, obj);
                        var ph = {'onExtent':item.onExtent, 'item':mObj, 'isVisibleFilter':item.isVisibleFilter, 'status':item.status};
                        out.push(ph);
                    }
                    for (var j = 0, len = obj._observerOnChange.length; j < len; j++) {
                        var ph = obj._observerOnChange[j];
                        if(out.length) ph[0](out);
                    }
                }
                fAttr.func = func;
                
                if(!obj._observerOnChange) {
                    proxy('observeVectorLayer', { 'obj': o, 'attr':fAttr});
                    obj._observerOnChange = [];
                }
                obj._observerOnChange.push([onChange, fAttr.ignoreVisibilityFilter]);
                if(observeByLayerZooms) {
                    proxy('setAPIProperties', { 'obj': obj, 'attr':{'observeByLayerZooms':true} }); // есть новый подписчик события изменения видимости обьектов векторного слоя
                }
            }
            if (obj.stateListeners.onChangeLayerVersion) obj.chkLayerVersion();

            var stylesMinMaxZoom = getMinMaxZoom(layer.properties);
            if (isRaster) {
                var ph = {
                    'func':tileFunction
                    ,'projectionCode':0
                    ,'minZoom': layer.properties['MinZoom']
                    ,'maxZoom': layer.properties['MaxZoom']
                    ,'minZoomView': stylesMinMaxZoom['minZoom'] || 1
                    ,'maxZoomView': stylesMinMaxZoom['maxZoom'] || 30
                    ,'tileSenderPrefix': tileSenderPrefix
                    ,'bounds': bounds
                };
                proxy('setBackgroundTiles', {'obj': obj, 'attr':ph });
            } else
            {
                obj.getFeatures = function()
                {
                    var callback, geometry, str;
                    for (var i = 0; i < 3; i++)
                    {
                        var arg = arguments[i];
                        if (typeof arg == 'function')
                            callback = arg;
                        else if (typeof arg == 'string')
                            str = arg || ' ';
                        else if (typeof arg == 'object')
                            geometry = arg;
                    }
                    //if (!str && (obj.properties.GeometryType == "point")) {
                    if (!str) {
                        proxy('getFeatures', { 'obj': obj, 'attr':{'geom': geometry, 'func': callback}});
                    }
                    else
                    {
                        if (str === ' ') str = '';
                        gmxAPI.map.getFeatures(str, geometry, callback, [obj.properties.name]);  // Поиск через JSONP запрос
                    }
                }
                obj.getFeaturesByCenter = function(func)
                {
                    proxy('getFeatures', { 'obj': obj, 'attr':{'center':true, 'func': func} });
                }

                obj.getFeatureById = function(fid, func)
                {
                    proxy('getFeatureById', { 'obj': obj, 'attr':{'fid':fid, 'func': func} });
                }
                obj.setStyle = function(style, activeStyle)
                {
                    for (var i = 0; i < obj.filters.length; i++)
                        obj.filters[i].setStyle(style, activeStyle);
                }

                if(obj._temporalTiles) { // Для мультивременных слоёв
                    obj._temporalTiles.setVectorTiles();
                } else {
                    if(!layer.properties.tiles) layer.properties.tiles = [];
                    obj.setVectorTiles(tileFunction, layer.properties.identityField, layer.properties.tiles);
                }

                for (var i = 0; i < obj.filters.length; i++) {
                    obj.filters[i] = initFilter(obj, i);
                }

                // Изменить атрибуты векторного обьекта из загруженных тайлов
                obj.setTileItem = function(data, flag) {
                    var _obj = proxy('setTileItem', { 'obj': this, 'attr': {'data':data, 'flag':(flag ? true:false)} });
                    return _obj;
                }
                // Получить атрибуты векторного обьекта из загруженных тайлов id по identityField
                obj.getTileItem = function(vId) {
                    var _obj = proxy('getTileItem', { 'obj': this, 'attr': vId });
                    if(_obj.geometry) _obj.geometry = gmxAPI.from_merc_geometry(_obj.geometry);
                    return _obj;
                }
                obj.getStat = function() {      // Это только во Flash
                    var _obj = proxy('getStat', { 'obj': this });
                    return _obj;
                }
                obj.setTiles = function(data, flag) {
                    var _obj = proxy('setTiles', { 'obj': obj, 'attr':{'tiles':data, 'flag':(flag ? true:false)} });
                    return _obj;
                }
                obj.addClipPolygon = function(geo) {
                    return proxy('addClipPolygon', { 'obj': obj, 'attr':{'geo':geo} });
                };
                obj.removeClipPolygon = function() {
                    return proxy('removeClipPolygon', { 'obj': obj });
                };

                if (layer.properties.IsRasterCatalog) {
                    var RCMinZoomForRasters = layer.properties.RCMinZoomForRasters || 1;
                    obj.enableTiledQuicklooks(function(o)
                    {
                        //var qURL = tileSenderPrefix + '&x={x}&y={y}&z={z}&idr=' + o.properties[layer.properties.identityField];
                        var qURL = tileSenderPrefixBase + '&x={x}&y={y}&z={z}&LayerName=' + encodeURIComponent(o.properties['GMX_RasterCatalogID']);
                        return qURL;
                    }, RCMinZoomForRasters, layer.properties.TiledQuicklookMaxZoom, tileSenderPrefix);
                    obj.getRCTileUrl = function(x, y, z, pid) {
                        return tileSenderPrefix + '&x='+x+'&y='+y+'&z='+z+'&idr=' + pid;
                    };
                    obj.addImageProcessingHook = function(func) {
                        return proxy('addImageProcessingHook', { 'obj': obj, 'attr':{'func':func} });
                    };
                    obj.removeImageProcessingHook = function() {
                        return proxy('removeImageProcessingHook', { 'obj': obj });
                    };
                } else {
                    if (layer.properties.Quicklook) {
                        /*
                        // если накладываемое изображения с трансформацией как BG закоментарить
                        obj.enableQuicklooks(function(o)
                        {
                            obj.bringToTop();
                            return gmxAPI.applyTemplate(layer.properties.Quicklook, o.properties);
                        });
                        */
                    }
                    if (layer.properties.TiledQuicklook) {
                        obj.enableTiledQuicklooks(function(o)
                        {
                            return gmxAPI.applyTemplate(layer.properties.TiledQuicklook, o.properties);
                        }, layer.properties.TiledQuicklookMinZoom);
                    }
                }
            }

            for (var i = 0, len = obj.filters.length; i < len; i++)
            {
                var filter = obj.filters[i];
                filter.setStyle(filter._attr.regularStyle, filter._attr.hoveredStyle);
                if(filter._attr.clusters) filter.setClusters(filter._attr.clusters);
                delete filter.setVisible;
                delete filter.setStyle;
                delete filter.setFilter;
                delete filter.enableHoverBalloon;
                delete filter.setClusters;
                filter.setZoomBounds = FlashMapObject.prototype.setZoomBounds;
            }

            // Установка видимости по Zoom
            obj.setZoomBounds(stylesMinMaxZoom.minZoom, stylesMinMaxZoom.maxZoom);

            if(!obj.isMiniMap) {     // если это не miniMap
                if (layer.properties.Copyright) {
                    obj.setCopyright(layer.properties.Copyright);
                }
            }
            if(obj_.tilesParent) obj.tilesParent = obj_.tilesParent;
            gmxAPI.extend(obj, {    // переопределение свойств после установки видимости
                removeContextMenuItem: function(itemId) {
                    return proxy('removeContextMenuItem', { obj: obj, attr: {
                        id: itemId
                    }});
                },
                addContextMenuItem: function(text, callback, index) {
                    if(!obj.stateListeners.contextmenu) {
                        obj.addListener('contextmenu', function(attr) {
                            var ev = attr.target;
                            ev.latlng = attr.event.latlng;
                            gmxAPI._leaflet.contextMenu.showMenu({obj:obj, attr: ev}); // Показать меню
                        });
                    }
                    return proxy('addContextMenuItem', { obj: obj, attr: {
                        text: text,
                        index: index,
                        func: function(x, y, target)
                            {
                                if(gmxAPI.proxyType === 'flash') {
                                    x = gmxAPI.from_merc_x(x);
                                    y = gmxAPI.from_merc_y(y);
                                }
                                callback(x, y, target);
                            }
                        }
                    });
                }
                ,freezeLoading: function(pt) {      // установить флаг игнорирования загрузки векторных тайлов
                    obj._isLoadingFreezed = true;
                    proxy('setFreezeLoading', { obj: obj, attr:true });
                    return true;
                }
                ,unfreezeLoading: function(pt) {    // удалить флаг игнорирования загрузки векторных тайлов
                    obj._isLoadingFreezed = false;
                    proxy('setFreezeLoading', { obj: obj, attr:false });
                    return true;
                }
                ,isLoadingFreezed: function(pt) {    // получить флаг игнорирования загрузки векторных тайлов
                    return proxy('isLoadingFreezed', { obj: obj });
                }
                ,redrawItem: function(pt) {  // Перерисовать объект векторного слоя
                    return proxy('redrawItem', { obj: obj, attr:pt });
                }
            });
            if (obj._isLoadingFreezed) proxy('setFreezeLoading', { obj: obj, attr:true });
            obj.addListener('onChangeLayerVersion', function() {
                initBounds(obj.mercGeometry);
            });
        }

        //obj.mercGeometry = layer.mercGeometry;
        if(gmxAPI.proxyType === 'flash') initBounds(obj.mercGeometry);
        obj.isVisible = isVisible;
        //if (isVisible || gmxAPI.proxyType === 'leaflet') {   // В leaflet версии deferredMethod не нужны
        if (isVisible) {
            createThisLayer();
            //var zIndexCur = getIndexLayer(obj.objectId);
            obj.bringToDepth(zIndex);
            gmxAPI._listeners.dispatchEvent('onLayer', obj, obj); // Вызов Listeners события 'onLayer' - слой теперь инициализирован во Flash
        }
        else
        {
            var deferred = [];
            obj.setVisible = function(flag, notDispatch)
            {
                if (flag)
                {
                    createThisLayer();
                    if(obj.objectId) FlashMapObject.prototype.setVisible.call(obj, flag, notDispatch);  // без Dispatch события
                    for (var i = 0; i < deferred.length; i++) {
                        deferred[i]();
                    }
                    //var zIndexCur = getIndexLayer(obj.objectId);
                    gmxAPI._listeners.dispatchEvent('onLayer', obj, obj); // Вызов Listeners события 'onLayer' - слой теперь инициализирован во Flash
                    gmxAPI._listeners.dispatchEvent('onChangeVisible', obj, true); // слой теперь виден
                    if ('backgroundColor' in obj) gmxAPI.map.setBackgroundColor(obj.backgroundColor);
                }
            }

            if (!isRaster) {
                // Изменять атрибуты векторного обьекта при невидимом слое нельзя
                obj.setTileItem = function(data, flag) {
                    return false;
                }
                // Получить атрибуты векторного обьекта при невидимом слое нельзя
                obj.getTileItem = function(vId) {
                    return null;
                }
            }
            obj.addObject = function(geometry, props, propHiden)
            {
                obj.setVisible(true);
                var newObj = FlashMapObject.prototype.addObject.call(obj, geometry, props, propHiden);
                //FlashMapObject.prototype.setVisible.call(obj, false, true);  // без Dispatch события
                //obj.setVisible(false);
                return newObj;
            }
            for (var i = 0, len = deferredMethodNames.length; i < len; i++) (function(name)
            {
                obj[name] = function(p1, p2, p3, p4) 
                { 
                    deferred.push(function() { obj[name].call(obj, p1, p2, p3, p4); });
                }
            })(deferredMethodNames[i]);

            obj.addListener = function(eventName, handler, level)
            {
                var evID = gmxAPI.newFlashMapId();
                if(eventName === 'onChangeLayerVersion') {
                    gmxAPI._listeners.addListener({'obj': obj, 'evID': evID, 'eventName': eventName, 'func': handler, 'level': level});
                } else {
                    deferred.push(function() {
                        gmxAPI._listeners.addListener({'obj': obj, 'evID': evID, 'eventName': eventName, 'func': handler, 'level': level});
                        if(gmxAPI.proxyType === 'flash') {
                            for (var i = 0; i < obj.filters.length; i++) {
                                gmxAPI._listeners.addListener({'level': level, 'pID': evID, 'obj': obj.filters[i], 'eventName': eventName, 'func': handler});
                            }
                        }
                    });
                }
                return evID;
            }

            if (gmxAPI.proxyType === 'leaflet') obj.bringToDepth(zIndex);
            if (!isRaster)
            {
                obj.getFeatures = function(arg1, arg2, arg3)
                {       
                    obj.setVisible(true, true);
                    obj.getFeatures(arg1, arg2, arg3);
                    FlashMapObject.prototype.setVisible.call(obj, false, true);  // без Dispatch события
                    //obj.setVisible(false);
                }
                obj.getFeatureById = function(arg1, arg2, arg3)
                {       
                    obj.setVisible(true);
                    obj.getFeatureById(arg1, arg2, arg3);
                    FlashMapObject.prototype.setVisible.call(obj, false, true);  // без Dispatch события
                    //obj.setVisible(false);
                }

                for (var i = 0, len = layer.properties.styles.length; i < len; i++) (function(i) {
                    obj.filters[i].setZoomBounds = function(minZoom, maxZoom)
                    {
                        if(!obj.filters[i]['_attr']) obj.filters[i]['_attr'] = {};
                        obj.filters[i]['_attr']['MinZoom'] = minZoom;
                        obj.filters[i]['_attr']['MaxZoom'] = maxZoom;
                        deferred.push(function() {
                            obj.filters[i].setZoomBounds(minZoom, maxZoom);
                            });
                    }
                    obj.filters[i].setVisible = function(flag)
                    {
                        deferred.push(function() {
                            obj.filters[i].setVisible(flag);
                            });
                    }
                    obj.filters[i].setStyle = function(style, activeStyle)
                    {
                        deferred.push(function() {
                            obj.filters[i].setStyle(style, activeStyle);
                            });
                    }
                    obj.filters[i].setFilter = function(sql)
                    {
                        if(!obj.filters[i]['_attr']) obj.filters[i]['_attr'] = {};
                        obj.filters[i]['_attr']['sql'] = sql;
                        deferred.push(function() { 
                            obj.filters[i].setFilter(sql);
                            });
                        return true;
                    }
                    obj.filters[i].enableHoverBalloon = function(callback, attr)
                    {
                        deferred.push(function() {
                            obj.filters[i].enableHoverBalloon(callback, attr);
                            });
                    }
                    obj.filters[i].setClusters = function(attr)
                    {
                        obj.filters[i]._clustersAttr = attr;
                        deferred.push(function() {
                            obj.filters[i].setClusters(attr);
                        });
                    }
                })(i);
            }
        }
        
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

        obj.addListener('onChangeVisible', function(flag) {    // Изменилась видимость слоя
            gmxAPI._listeners.dispatchEvent('hideBalloons', gmxAPI.map, {'from':obj.objectId}); // Проверка map Listeners на hideBalloons
        }, -10);

        obj.addListener('BeforeLayerRemove', function() {    // Удаляется слой
            gmxAPI._listeners.dispatchEvent('AfterLayerRemove', obj, layerName); // Удален слой
        }, -10);
        obj._clearLayer = function() {   // Чистка map.layers при удалении слоя
            //if(!layerName) layerName = obj.properties.name;
            for(var i=0, len=gmxAPI.map.layers.length; i<len; i++) {   // Удаление слоя из массива
                var prop = gmxAPI.map.layers[i].properties;
                if(prop.name === layerName) {
                    gmxAPI.map.layers.splice(i, 1);
                    break;
                }
            }
            for(key in gmxAPI.map.layers) {       // Удаление слоя из хэша
                var prop = gmxAPI.map.layers[key].properties;
                if(prop.name === layerName) {
                    delete gmxAPI.map.layers[key];
                }
            }
        }
        obj.addListener('AfterLayerRemove', function() {   // Удален слой
            obj._clearLayer(obj.properties.name);
        }, 101); // Перед всеми пользовательскими Listeners
        if(obj.objectId) gmxAPI.mapNodes[obj.objectId] = obj;
        gmxAPI._listeners.dispatchEvent('onLayerAdd', gmxAPI.map, obj); // Добавлен слой
        return obj;
    }

    //расширяем FlashMapObject
    gmxAPI.extendFMO('addLayer', function(layer, isVisible, isMerc) {
        //if(layer && layer.geometry && !isMerc) layer.geometry = gmxAPI.merc_geometry(layer.geometry);
        var obj = addLayer(this, layer, isVisible, isMerc);
        gmxAPI._listeners.dispatchEvent('onAddExternalLayer', gmxAPI.map, obj); // Добавлен внешний слой
        return obj;
    } );

})();
