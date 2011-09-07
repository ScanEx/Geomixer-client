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

var _pluginParams = {serverURL: "http://dev2.kosmosnimki.ru/TestPNG.ashx"};

var printScreeshot = function(url)
{
	var popup = window.open();
	popup.document.open();
	popup.document.write("<html><body><img src='" + url + "'></img></body></html>");
	popup.document.close();
	popup.print();
}

var DEFAULT_WIDTH = 600;
var makeScreeshot = function()
{
	var showScreenshot = function(pngUrl)
	{
		var image = new Image();
		image.onload = function()
		{
			var h = DEFAULT_WIDTH/image.width*image.height;
			var img = $("<img></img>").attr({src: pngUrl, width: DEFAULT_WIDTH, height: DEFAULT_WIDTH/image.width*image.height});
			
			// var btnPrint = $("<button></button>").text(_gtxt("screenshotPlugin.print")).click();
			var btnPrint = makeButton(_gtxt("screenshotPlugin.print"));
			btnPrint.onclick = function()
			{
				printScreeshot(pngUrl)
			};
			btnPrint.style.marginTop = "10px";
			btnPrint.style.padding = "3px 9px";
			btnPrint.style.fontSize = "12px";
			
			//var tr1 = $("<tr></tr>").append($("<td align=center></td>").append($("<a></a>").attr({href: pngUrl, target: "_blank"}).append(img)));
			var tr1 = $("<tr></tr>")
				.append($("<td align=center></td>")
					.append($("<a></a>").append(img).attr({href: "javascript:0"}).click(function()
						{
							var popup = window.open();
							popup.document.open();
							popup.document.write("<html><body><table>" + 
												 "<tr><td><img src='" + pngUrl + "'></img></td></tr>" +
												 "<tr><td align='center'><button>"+ _gtxt("screenshotPlugin.print") +"</button></td></tr>" +
												 "</table></body></html>");
							popup.document.close();
						})
					)
				);
			
			var tr2 = $("<tr></tr>").append($("<td align=center></td>").append(btnPrint));
			var table = $("<table width='100%'></table>").append(tr1).append(tr2);
			
			//var div = $("<div></div>").append(table);
			
			var canvas = showDialog(_gtxt('screenshotPlugin.title'), table[0], DEFAULT_WIDTH+40, h+80);
		}
		image.src = pngUrl;
	};
	
	// showScreenshot( "data:image/png;base64," + map.sendPNG({getBase64: true}).base64 );
	map.sendPNG({url: _pluginParams.serverURL, func: showScreenshot});
}

//PluginInterface
var beforeViewer = function(params){
}

var afterViewer = function(params){
	_pluginParams = $.extend(_pluginParams, params);

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