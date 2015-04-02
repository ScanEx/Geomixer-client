(function(){
    _translationsHash.addtext('rus', {WeatherPlugin: {
        WindButton : 'Ветер',
        WeatherButton : 'Погода'
    }});
    _translationsHash.addtext('eng', {WeatherPlugin: {
        WindButton : 'Wind',
        WeatherButton : 'Weather'
    }});

    gmxCore.addModule('WeatherPlugin', {
        pluginName: 'Weather',
        afterViewer: function(params, map) {
            gmxAPI.loadJS({src: 'http://scanex.github.io/Leaflet.WindWeatherPlugin/src/L.WindWeatherLayer.js', charset: 'utf8'},
                function(item) {
                    var LMap = gmxAPI._leaflet.LMap,
                        controlsManager = LMap.gmxControlsManager,
                        gmxLayers = controlsManager.get('layers'),
                        weatherLayer = L.windWeatherLayer({type: 'weather'}),
                        windLayer = L.windWeatherLayer({type: 'wind'});

                    gmxLayers.addOverlay(weatherLayer, _gtxt('WeatherPlugin.WeatherButton'));
                    gmxLayers.addOverlay(windLayer, _gtxt('WeatherPlugin.WindButton'));
                }
            );
        }
    })
})();
