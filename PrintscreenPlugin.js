(function ($){
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

//var _pluginParams = {serverHost: "http://mapstest.kosmosnimki.ru/ImgSave.ashx"};

var printScreeshot = function(url)
{
	var popup = window.open();
	popup.document.open();
	popup.document.write("<html><body><img src='" + url + "'></img></body></html>");
	popup.document.close();
	popup.print();
}

//почему-то стандартный метод для opera не работает, а этот не работает в chrome :)
var printScreeshotOpera = function(url) {

	function makepage(src) {
	  return "<html>\n" +
		"<head>\n" +
		"<title>Temporary Printing Window</title>\n" +
		"<script>\n" +
		"function step1() {\n" +
		"  setTimeout('step2()', 10);\n" +
		"}\n" +
		"function step2() {\n" +
		"  window.print();\n" +
		"  window.close();\n" +
		"}\n" +
		"</scr" + "ipt>\n" +
		"</head>\n" +
		"<body onLoad='step1()'>\n" +
		"<img src='" + src + "'/>\n" +
		"</body>\n" +
		"</html>\n";
	}

  var link = "about:blank";
  var pw = window.open(link,"_new");
  pw.document.open();
  pw.document.write(makepage(url));
  pw.document.close();
}

var DEFAULT_WIDTH = 600;
var makeScreeshot = function()
{
	var showScreenshot = function(response)
	{
		response = JSON.parse(response);
		
		if (!parseResponse(response)) return;
		
		var pngUrl = serverBase + "ImgSave.ashx?id=" + response.Result;
		
		var image = new Image();
		image.onload = function()
		{
			var h = DEFAULT_WIDTH/image.width*image.height;
			var img = $("<img></img>").attr({src: pngUrl, width: DEFAULT_WIDTH, height: DEFAULT_WIDTH/image.width*image.height});
			
			var btnPrint = makeButton(_gtxt("screenshotPlugin.print"));
			btnPrint.onclick = function()
			{
				$.browser.opera ? printScreeshotOpera(pngUrl) : printScreeshot(pngUrl);
			};
			btnPrint.style.marginTop = "10px";
			btnPrint.style.padding = "3px 9px";
			btnPrint.style.fontSize = "12px";
			
			//var tr1 = $("<tr></tr>").append($("<td align=center></td>").append($("<a></a>").attr({href: pngUrl, target: "_blank"}).append(img)));
			var tr1 = $("<tr></tr>")
				.append($("<td align=center></td>")
					.append($("<a></a>").append(img).css('cursor', 'pointer').click(function()
						{
							var popup = window.open();
							popup.document.open();
							popup.document.write("<html><body><table>" + 
												 "<tr><td><img src='" + pngUrl + "'></img></td></tr>" +
												 "<tr><td align='center'><button>"+ _gtxt("screenshotPlugin.print") +"</button></td></tr>" +
												 "</table></body></html>");
							popup.document.close();
							$('button', popup.document).click(function(){ printScreeshot(pngUrl);} );
						})
					)
				);
			
			var tr2 = $("<tr></tr>").append($("<td align=center></td>").append(btnPrint));
			var table = $("<table width='100%'></table>").append(tr1).append(tr2);
			
			var canvas = showDialog(_gtxt('screenshotPlugin.title'), table[0], DEFAULT_WIDTH+40, h+80);
		}
		image.src = pngUrl;
	};
	
	// showScreenshot( "data:image/png;base64," + map.sendPNG({getBase64: true}).base64 );
	
	//имя передаём только ради разширения, из которого сервер вытащит тип картинки
	globalFlashMap.sendPNG({url: serverBase + 'ImgSave.ashx?filename=a.png&WrapStyle=None', func: showScreenshot});
}

//PluginInterface
var beforeViewer = function(params){
}

var afterViewer = function(params){
	//_pluginParams = $.extend(_pluginParams, params);

	_iconPanel.changeCallcack('print', makeScreeshot);
}

var addMenuItems = function(upMenu){
	
	return [{item: {id:'savepng', title: _gtxt("screenshotPlugin.menuTitle"),func: makeScreeshot},
			parentID: 'mapsMenu'}];
}
 
var publicInterface = {
    pluginName: 'PrintscreenPlugin',
	beforeViewer: beforeViewer,
	afterViewer: afterViewer,
	addMenuItems: addMenuItems
}

gmxCore.addModule("PrintscreenPlugin", publicInterface);

})(jQuery)