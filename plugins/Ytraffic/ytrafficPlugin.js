(function(){
   // add to config.js
   // {pluginName: 'YtrafficPlugin', file: 'plugins/Ytraffic/ytrafficPlugin.js', module: 'YtrafficPlugin', mapPlugin: true, isPublic: true},

    _translationsHash.addtext('rus', {YtrafficPlugin: {
        trafficButton : 'Загруженность дорог'
    }});
    _translationsHash.addtext('eng', {YtrafficPlugin: {
        trafficButton : 'Traffic'
    }});

    gmxCore.addModule('YtrafficPlugin', {
        pluginName: 'Ytraffic',
        afterViewer: function(params, map) {
            L.TileLayer.Traffic = L.TileLayer.extend({
                getTileUrl: function (tilePoint) {
                    var dt = new Date(),
                        day = dt.getDay(),
                        tm = 2 * dt.getHours() + (dt.getMinutes() > 29 ? 1 : 0);

                    return L.Util.template(this._url, L.extend({
                        tstamp: dt.getTime(),
                        d: (day < 10 ? '0' : '') + day,
                        t: (tm < 10 ? '0' : '') + tm,
                        s: this._getSubdomain(tilePoint),
                        z: tilePoint.z,
                        x: tilePoint.x,
                        y: tilePoint.y
                    }, this.options));
                }
            });
            L.tileLayer.traffic = function (url, options) {
                return new L.TileLayer.Traffic(url, options);
            };

            var lmap = nsGmx.leafletMap,
                controlsManager = lmap.gmxControlsManager,
                gmxCopyright = controlsManager.get('copyright'),
                gmxLayers = controlsManager.get('layers');

            gmxLayers.addOverlay(L.tileLayer.traffic('http://tile.digimap.ru/jams_prediction_{d}_{t}/{z}/{x}/{y}.png?t={tstamp}', {
                // minZoom: 1,
                maxNativeZoom: 20
            }), _gtxt('YtrafficPlugin.trafficButton') + '_текущая');

			var now = Date.now();
            gmxLayers.addOverlay(L.tileLayer('http://tile.digimap.ru/jams_prediction_03_19/{z}/{x}/{y}.png?t=' + now, {
                // minZoom: 1,
                maxNativeZoom: 20
            }), _gtxt('YtrafficPlugin.trafficButton') + '_Среда 9.30');
            gmxLayers.addOverlay(L.tileLayer('http://tile.digimap.ru/jams_prediction_03_28/{z}/{x}/{y}.png?t=' + now, {
                // minZoom: 1,
                maxNativeZoom: 20
            }), _gtxt('YtrafficPlugin.trafficButton') + '_Среда 14.00');
            gmxLayers.addOverlay(L.tileLayer('http://tile.digimap.ru/jams_prediction_03_36/{z}/{x}/{y}.png?t=' + now, {
                // minZoom: 1,
                maxNativeZoom: 20
            }), _gtxt('YtrafficPlugin.trafficButton') + '_Среда 18.00');
            gmxLayers.addOverlay(L.tileLayer('http://tile.digimap.ru/jams_prediction_03_42/{z}/{x}/{y}.png?t=' + now, {
                // minZoom: 1,
                maxNativeZoom: 20
            }), _gtxt('YtrafficPlugin.trafficButton') + '_Среда 21.00');
        }
    })
})();
