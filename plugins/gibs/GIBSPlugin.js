/** Плагин для интеграции в ГеоМиксер данных NASA Global Imagery Browse Services (GIBS)
*/
(function ($){

var NASA_URL_PREFIX = 'https://map1a.vis.earthdata.nasa.gov/wmts-webmerc/';

var NASA_LAYERS = {
    MODIS_Terra_CorrectedReflectance_TrueColor: 9,
    MODIS_Terra_CorrectedReflectance_Bands721: 9,
    MODIS_Terra_CorrectedReflectance_Bands367: 9,
    MODIS_Aqua_CorrectedReflectance_TrueColor: 9,
    MODIS_Aqua_CorrectedReflectance_Bands721: 9,
    
    MODIS_Terra_SurfaceReflectance_Bands143: 8,
    MODIS_Terra_SurfaceReflectance_Bands721: 8,
    MODIS_Terra_SurfaceReflectance_Bands121: 9,
    MODIS_Aqua_SurfaceReflectance_Bands143: 8,
    MODIS_Aqua_SurfaceReflectance_Bands721: 8,
    MODIS_Aqua_SurfaceReflectance_Bands121: 9,
    
    VIIRS_CityLights_2012: 8
};

/** Слой для подгрузки данных из NASA Global Imagery Browse Services (GIBS)
 * @param {String} layerName Имя слоя GIBS (см https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products)
 * @param {gmxAPI.Map} Карта ГеоМиксера
 * @param {Object} [params] Дополнительные параметры
 * @param {Boolean} [params.visible] Видим ли слой по умолчанию
 * @param {nsGmx.Calendar} [params.calendar] Календарь, который задаёт за какое число показывать данные
 * @param {Date} [params.initDate] Начальная дата (если не указан params.calendar)
*/
var GIBSLayer = function(layerName, map, params) {

    var params = $.extend({
        visible: false,
        calendar: null,
        initDate: null
    }, params);
    
    if (params.calendar) {
        params.initDate = params.calendar.getDateEnd();
    }
    
    var urlPrefix = NASA_URL_PREFIX + layerName + '/default/',
        calendar = params.calendar,
        gmxLayer,
        _this = this,
        layerZoom = NASA_LAYERS[layerName] || 7;
    
    var initLayer = function() {
        var isVisible;
        if (gmxLayer) {
            isVisible = gmxLayer.getVisibility();
            gmxLayer.remove();
        } else {
            isVisible = params.visible;
        }
        
        gmxLayer = map.addObject(null);
        gmxLayer.setZoomBounds(1, layerZoom);
        gmxLayer.setPolygon([-180, -85, -180, 85, 180, 85, 180, -85, -180, -85]);
        gmxLayer.setVisible(isVisible);
        gmxLayer.setCopyright("<a href='https://earthdata.nasa.gov/gibs'>NASA EOSDIS GIBS</a>");
    }
    
    initLayer();
    
    var updateDate = function() {
        _this.setDate(calendar.getDateEnd());
    }
    
    /** Установить дату показа снимков
      @param {Date} newDate Дата (используется с точностью до дня)
    */
    this.setDate = function(newDate) {
        var dateStr = $.datepicker.formatDate('yy-mm-dd', nsGmx.Calendar.toUTC(newDate));
        var url = urlPrefix + dateStr + '/GoogleMapsCompatible_Level' + layerZoom + '/';
        
        initLayer();
        gmxLayer.setBackgroundTiles(function(i, j, z) {
            var size = Math.pow(2, z - 1);
                x = i + size,
                y = size - j - 1;
                
            return url + z + '/' + y + '/' + x + '.jpg';
        }, 1);
    }
    
    this.remove = function() {
        gmxLayer.remove();
    }
    
    /** Связать с календарём для задания даты снимков. Будет использована конечная дата интервала календаря.
     * @param {nsGmx.Calendar} newCalendar Календарь
    */
    this.bindToCalendar = function(newCalendar) {
        calendar && $(calendar).off('change', updateDate);
        $(newCalendar).on('change', updateDate);
        calendar = newCalendar;
    }
    
    /** Задать видимость слоя
     @param {Boolean} isVisible Видимость слоя
     */
    this.setVisibility = function(isVisible) {
        gmxLayer.setVisible(isVisible);
    }
    
    calendar && this.bindToCalendar(calendar);
    params.initDate && this.setDate(params.initDate);
}

var toolContainer = null;
var gibsLayers = [];
 
var publicInterface = {
    pluginName: 'GIBS Plugin',
    GIBSLayer: GIBSLayer,
    
    //параметры: layer (может быть несколько) - имя слоя в GIBS
	afterViewer: function(params, map)
    {
        params = $.extend({
            layer: ['MODIS_Terra_CorrectedReflectance_TrueColor']
        }, params);
        
        if (!$.isArray(params.layer)) {
            params.layer = [params.layer];
        }
        
        var calendar = nsGmx.widgets.commonCalendar.get();
        
        toolContainer = new gmxAPI._ToolsContainer('gibs');
            
        params.layer.forEach(function(layerName) {
            var gibsLayer = new GIBSLayer(layerName, map, {
                calendar: calendar,
                visible: false
            });
            
            toolContainer.addTool(layerName, {
                overlay: true,
                onClick: gibsLayer.setVisibility.bind(gibsLayer, true),
                onCancel: gibsLayer.setVisibility.bind(gibsLayer, false),
                hint: layerName
            })
            
            gibsLayers.push(gibsLayer);
        })
        
        params.layer.length && nsGmx.widgets.commonCalendar.show();
    },
    
    unload: function() {
        toolContainer && toolContainer.remove();
        gibsLayers.forEach(function(layer) {layer.remove();});
    }
}

gmxCore.addModule('GIBSPlugin', publicInterface);

})(jQuery);