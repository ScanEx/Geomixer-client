var MapSerializer = L.Class.extend({
    initialize: function(map) {
        this.map = map;
    },
    saveState: function() {
        return {
            version: '1.0.0',
            position: {
                x: this.map.getCenter().lng,
                y: this.map.getCenter().lat,
                z: this.map.getZoom()
            }
        };
    },
    loadState: function(data) {
        this.map.setView([data.position.y, data.position.x], data.position.z);
    }
});

window.addEventListener('load', function() {
    var map = L.map(document.body).setView([51.505, 30], 4);

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var permalinkManager = new nsGmx.PermalinkManager({
        provider: new nsGmx.Auth.Server({
            root: 'http://maps.kosmosnimki.ru'
        })
    });

    permalinkManager.setIdentity('map', new MapSerializer(map));

    var shareIconControl = new nsGmx.ShareIconControl({
        permalinkManager: permalinkManager,
        permalinkUrlTemplate: 'http://fires.ru?permalink={{permalinkId}}',
        embeddedUrlTemplate: 'http://fires.ru/embedded.html{{#if permlalinkId}}?permalink={{permlalinkId}}{{/if}}',
        previewUrlTemplate: 'http://fires.ru/iframePreview.html?width={{width}}&height={{height}}&permalinkUrl={{{embeddedUrl}}}'
    });

    map.addControl(shareIconControl);

    window.shareIconControl = shareIconControl;
    window.permalinkManager = permalinkManager;
    window.map = map;
});