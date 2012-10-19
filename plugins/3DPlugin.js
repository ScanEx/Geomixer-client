(function($){

var publicInterface = {
    pluginName: '3DDemo',
    afterViewer: function()
    {
        gmxAPI.baseLayersTools.addTool('3DDemo', {
            hint: '3D',
            onClick: function()
            {
                var x = Math.round(merc_x(globalFlashMap.getX()));
                var y = Math.round(merc_y(globalFlashMap.getY()));
                window.open("http://kosmosnimki.ru/3d/index.html?x=" + x + "&y=" + y, '_blank');
            }
        })
    }
}

window.gmxCore && window.gmxCore.addModule('3DPlugin', publicInterface);

})(jQuery);