
(function ($){
_translationsHash.addtext("rus", {
	"HelpEmailPlugin.Message" : "Что-то не работает - напишите нам в техническую поддержку!"
});

_translationsHash.addtext("eng", {
	"HelpEmailPlugin.Message" : "Something works wrong? Write an e-mail to our support!"
});
 
var publicInterface = {
	afterViewer: function()
	{
		var interval = setInterval(function(){
			if (_queryMapLayers.buildedTree){
				leftContentHeightDecrease = 50;
				clearInterval(interval);
				var sSubject = escape("BugReport: MapID=" + _mapHelper.mapProperties.name + " ; Login=" + nsGmx.AuthManager.getLogin());
				var sBody = escape("MapUrl: http://maps.kosmosnimki.ru/api/index.html?" + _mapHelper.mapProperties.name);
				var sAddress = "mailto:help@kosmosnimki.ru?subject=" + sSubject + "&body=" + sBody; 
				var oLink = _a([_t(_gtxt("HelpEmailPlugin.Message"))], [[ "attr", "href", sAddress]]);
				oLink.style.textDecoration = "none"
				var oLinkDiv = _div([oLink, _br(), _a([_t("help@kosmosnimki.ru")], [["attr", "href", "mailto:help@kosmosnimki.ru"]])], [["attr", "align", "center"]])
				oLinkDiv.style.position = "absolute";
				oLinkDiv.style.width = "325px";
				oLinkDiv.style.bottom = "5px";
				oLinkDiv.style.left = "13px";
				oLinkDiv.style.border = "1px solid";
				oLinkDiv.style.padding = "3px 5px 3px 5px";
				_(document.getElementById("all"), [oLinkDiv]);
				resizeAll();
			}
		} , 200);
	}
}

gmxCore.addModule("HelpEmailPlugin", publicInterface);

})(jQuery, globalFlashMap)