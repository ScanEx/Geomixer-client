(function ($, map){
_translationsHash.addtext("rus", {
	"screenshotPlugin.menuTitle" : "Сохранить как PNG",
	"screenshotPlugin.print" : "Напечатать",
	"screenshotPlugin.title" : "Предпросмотр"
});
_translationsHash.addtext("eng", {
	"screenshotPlugin.menuTitle" : "Save as PNG",
	"screenshotPlugin.print" : "Print",
	"screenshotPlugin.title" : "Preview"
});

var printScreeshot = function(url)
{
	popup = window.open();
	popup.document.open();
	popup.document.write("<html><body><img src='" + url + "'></img></body></html>");
	popup.document.close();
	popup.print();
}

var DEFAULT_WIDTH = 600;
var makeScreeshot = function()
{
	map.sendPNG({url: 'http://dev2.kosmosnimki.ru/TestPNG.ashx', func: function(pngUrl)
	{
		var image = new Image();
		image.onload = function()
		{
			var h = DEFAULT_WIDTH/image.width*image.height;
			var img = $("<img></img>").attr({src: pngUrl, width: DEFAULT_WIDTH, height: DEFAULT_WIDTH/image.width*image.height});
			var btnPrint = $("<button></button>").text(_gtxt("screenshotPlugin.print")).click(function(){printScreeshot(pngUrl)});
			var tr1 = $("<tr></tr>").append($("<td align=center></td>").append($("<a></a>").attr({href: pngUrl, target: "_blank"}).append(img)));
			var tr2 = $("<tr></tr>").append($("<td align=center></td>").append(btnPrint));
			var table = $("<table width='100%'></table>").append(tr1).append(tr2);
			
			//var div = $("<div></div>").append(table);
			
			var canvas = showDialog(_gtxt('screenshotPlugin.title'), table[0], DEFAULT_WIDTH+40, h+70);
		}
		image.src = pngUrl;
		
		
		// $(canvas).dialog("option", "height", 700);
		// div.dialog({width: 620, height: 'auto', title: "Screenshot"});
	}});
}

//PluginInterface
var beforeViewer = function(params){
}

var afterViewer = function(params){
	_iconPanel.changeCallcack('print', makeScreeshot);
}

var addMenuItems = function(upMenu){
	
	return [{item: {id:'wiki', title: _gtxt("screenshotPlugin.menuTitle"),func: makeScreeshot},
			parentID: 'mapsMenu'}];
}
 
var publicInterface = {
	beforeViewer: beforeViewer,
	afterViewer: afterViewer,
	addMenuItems: addMenuItems
}

gmxCore.addModule("PrintscreenPlugin", publicInterface);

})(jQuery, globalFlashMap)