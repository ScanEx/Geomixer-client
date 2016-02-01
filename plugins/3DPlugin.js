(function($){

var publicInterface = {
    pluginName: '3DDemo',
    afterViewer: function()
    {
        var LMap = nsGmx.leafletMap;
        var icon = L.control.gmxIcon({
            id: '3D', 
            text: '3D'
        }).on('click', function(ev) {
            var center = LMap.getCenter(),
                x = Math.round(center.lng),
                y = Math.round(center.lat);

            window.open("http://kosmosnimki.ru/3d/index.html?x=" + x + "&y=" + y, '_blank');
        });
        LMap.addControl(icon);
    }
}

window.gmxCore && window.gmxCore.addModule('3DPlugin', publicInterface);

})(jQuery);