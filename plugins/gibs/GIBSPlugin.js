/** Плагин для интеграции в ГеоМиксер данных NASA Global Imagery Browse Services (GIBS)
*/
(function ($){

var NASA_URL_PREFIX = 'https://map1a.vis.earthdata.nasa.gov/wmts-webmerc/';

var NASA_LAYERS = {
    MODIS_Terra_CorrectedReflectance_TrueColor: {zoom: 9, title: 'Terra Corrected TrueColor'},
    MODIS_Terra_CorrectedReflectance_Bands721:  {zoom: 9, title: 'Terra Corrected Bands 721'},
    MODIS_Terra_CorrectedReflectance_Bands367:  {zoom: 9, title: 'Terra Corrected Bands 367'},
    MODIS_Aqua_CorrectedReflectance_TrueColor:  {zoom: 9, title: 'Aqua Corrected TrueColor'},
    MODIS_Aqua_CorrectedReflectance_Bands721:   {zoom: 9, title: 'Aqua Corrected Bands 721'},

    MODIS_Terra_SurfaceReflectance_Bands143:    {zoom: 8, title: 'Terra Surface Bands 143'},
    MODIS_Terra_SurfaceReflectance_Bands721:    {zoom: 8, title: 'Terra Surface Bands 721'},
    MODIS_Terra_SurfaceReflectance_Bands121:    {zoom: 9, title: 'Terra Surface Bands 121'},
    MODIS_Aqua_SurfaceReflectance_Bands143:     {zoom: 8, title: 'Aqua Surface Bands 143'},
    MODIS_Aqua_SurfaceReflectance_Bands721:     {zoom: 8, title: 'Aqua Surface Bands 721'},
    MODIS_Aqua_SurfaceReflectance_Bands121:     {zoom: 9, title: 'Aqua Surface Bands 121'},

    VIIRS_CityLights_2012: {zoom: 8, title: 'VIIRS City Lights 2012'}
};

/** Слой для подгрузки данных из NASA Global Imagery Browse Services (GIBS)
 * @param {String} layerName Имя слоя GIBS (см https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+Available+Imagery+Products)
 * @param {L.Map} Карта ГеоМиксера
 * @param {Object} [params] Дополнительные параметры
 * @param {Boolean} [params.visible] Видим ли слой по умолчанию
 * @param {nsGmx.CalendarWidget} [params.calendar] Календарь, который задаёт за какое число показывать данные
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
        layerZoom = (NASA_LAYERS[layerName] && NASA_LAYERS[layerName].zoom) || 7;

    var initLayer = function() {
        var isVisible;
        if (gmxLayer) {
            isVisible = map.hasLayer(gmxLayer);
            map.removeLayer(gmxLayer);
        } else {
            isVisible = params.visible;
        }

        gmxLayer = L.tileLayer(_this._url, {
            minZoom: 1,
            maxZoom: layerZoom,
            attribution: '<a href="https://earthdata.nasa.gov/gibs">NASA EOSDIS GIBS</a>'
        })

        isVisible && map.addLayer(gmxLayer);
    }

    initLayer();

    var updateDate = function() {
        _this.setDate(calendar.getDateEnd());
    }

    /** Установить дату показа снимков
      @param {Date} newDate Дата (используется с точностью до дня)
    */
    this.setDate = function(newDate) {
        var dateStr = $.datepicker.formatDate('yy-mm-dd', nsGmx.CalendarWidget.toUTC(newDate));
        this._url = urlPrefix + dateStr + '/GoogleMapsCompatible_Level' + layerZoom + '/{z}/{y}/{x}.jpg';

        initLayer();
    }

    this.remove = function() {
        map.removeLayer(gmxLayer);
    }

    /** Связать с календарём для задания даты снимков. Будет использована конечная дата интервала календаря.
     * @param {nsGmx.CalendarWidget} newCalendar Календарь
    */
    this.bindToCalendar = function(newCalendar) {
        calendar && $(calendar).off('change', updateDate);
        $(newCalendar).on('change', updateDate);
        calendar = newCalendar;
        updateDate();
    }

    /** Задать видимость слоя
     @param {Boolean} isVisible Видимость слоя
     */
    this.setVisibility = function(isVisible) {
        map[isVisible ? 'addLayer' : 'removeLayer'](gmxLayer);
    }

    calendar && this.bindToCalendar(calendar);
    params.initDate && this.setDate(params.initDate);
}

var overlayLayerProxies = [];

var GIBSProxyLayer = function() {}

GIBSProxyLayer.prototype.initFromDescription = function(layerDescription) {
    var props = layerDescription.properties;

    if (!props.MetaProperties['gibs-layername']) {
         return new L.gmx.DummyLayer(props);
    }

    var layerName = props.MetaProperties['gibs-layername'].Value,
        isTransparent = !!props.MetaProperties['gibs-transparent'];

    try {
        var layer = new L.GIBSLayer(layerName, {transparent: isTransparent});
    } catch(e) {
        return new L.gmx.DummyLayer(props);
    }

    layer.getGmxProperties = function() {
        return props;
    }

    layer.setDateInterval = function(dateBegin, dateEnd) {
        this.setDate(dateEnd);
        return this;
    }

    return layer;
}

var publicInterface = {
    pluginName: 'GIBS Plugin',
    GIBSLayer: GIBSLayer,

    //параметры: layer (может быть несколько) - имя слоя в GIBS
	afterViewer: function(params)
    {
        params = $.extend({
            layer: ['MODIS_Terra_CorrectedReflectance_TrueColor']
        }, params);

        if (!$.isArray(params.layer)) {
            params.layer = [params.layer];
        }

        var calendar = nsGmx.widgets.commonCalendar.get();

        var layersControl = nsGmx.leafletMap.gmxControlsManager.get('layers');

        params.layer.forEach(function(layerName) {
            var gibsLayer = new GIBSLayer(layerName, nsGmx.leafletMap, {
                calendar: calendar,
                visible: false
            });

            var proxyLayer = {
                onAdd: function() {
                    gibsLayer.setVisibility(true);
                },
                onRemove: function() {
                    gibsLayer.setVisibility(false);
                }
            }

            layersControl.addOverlay(proxyLayer, NASA_LAYERS[layerName].title);
            overlayLayerProxies.push(proxyLayer);
        })
            if (params.layer.length && !nsGmx.widgets.commonCalendar.model.get('isAppended')) { nsGmx.widgets.commonCalendar.show(); }
    },

    unload: function() {
        var layersControl = nsGmx.leafletMap.gmxControlsManager.get('layers');
        overlayLayerProxies.forEach(function(layer){
            layersControl.removeLayer(layer);
            nsGmx.leafletMap.removeLayer(layer);
        });
    }
}

gmxCore.addModule('GIBSPlugin', publicInterface, {
    init: function(module, path) {
        return gmxCore.loadModule('GIBSVirtualLayer', path + 'leaflet-GIBS/src/GeoMixerGIBSLayer.js');
    }
});

})(jQuery);
