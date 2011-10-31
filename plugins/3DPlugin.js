(function($){

var publicInterface = {
    afterViewer: function()
    {
        var button3D = $('<div/>', {'class': 'plugin3D-button'}).text('3D').click(function()
        {
            var x = Math.round(merc_x(globalFlashMap.getX()));
            var y = Math.round(merc_y(globalFlashMap.getY()));
            window.open("http://kosmosnimki.ru/3d/index.html?x=" + x + "&y=" + y, '_blank');
        });
        
        var background3D = $('<div/>', {'class': 'plugin3D-background'});
        $(globalFlashMap.allControls.div).append(background3D).append(button3D);
    }
}

if ( typeof gmxCore !== 'undefined' )
{
	gmxCore.addModule('3DPlugin', publicInterface, 
	{ init: function(module, path)
		{
			var doLoadCss = function()
			{
				path = path || window.gmxJSHost || "";
				$.getCSS(path + "3DPlugin.css");
			}
			
			if ('getCSS' in $)
				doLoadCss();
			else
				$.getScript(path + "../jquery/jquery.getCSS.js", doLoadCss);
		}
	});
}

})(jQuery);