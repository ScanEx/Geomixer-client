
(function ($){
/*
_translationsHash.addtext("rus", {
	"HelpEmailPlugin.Message" : "Что-то не работает - напишите нам в техническую поддержку!"
});

_translationsHash.addtext("eng", {
	"HelpEmailPlugin.Message" : "Something works wrong? Write an e-mail to our support!"
});
 */
 
var publicInterface = {
	afterViewer: function(params)
	{
		var _params = params.extend({EMail: "help@kosmosnimki.ru", Message: {rus: "Что-то не работает - напишите нам в техническую поддержку!", eng: "Something works wrong? Write an e-mail to our support!"}});
		_translationsHash.addtext("rus", {
			"HelpEmailPlugin.Message" : _params.Message.rus
		});
		_translationsHash.addtext("eng", {
			"HelpEmailPlugin.Message" : _params.Message.eng
		});
		
		var interval = setInterval(function(){
			if (_queryMapLayers.buildedTree){
				leftContentHeightDecrease = 50;
				clearInterval(interval);
				var sSubject = escape("BugReport: MapID=" + _mapHelper.mapProperties.name + " ; Login=" + nsGmx.AuthManager.getLogin());
				var sBody = escape("MapUrl: http://maps.kosmosnimki.ru/api/index.html?" + _mapHelper.mapProperties.name);
				var sAddress = "mailto:" + _params.EMail + "?subject=" + sSubject + "&body=" + sBody; 
				var oLink = _a([_t(_gtxt("HelpEmailPlugin.Message"))], [[ "attr", "href", sAddress]]);
				oLink.style.textDecoration = "none"
				var oLinkDiv = _div([oLink, _br(), _a([_t(_params.EMail)], [["attr", "href", "mailto:" + _params.EMail]])], [["attr", "align", "center"]])
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