
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
    pluginName: 'HelpEmail',
	afterViewer: function(params)
	{
		var _params = $.extend({
            EMail: "help@kosmosnimki.ru", 
            Message: {
                rus: "Что-то не работает - напишите нам в техническую поддержку!", 
                eng: "Something works wrong? Write an e-mail to our support!"
            }
        }, params);
            
		_translationsHash.addtext("rus", {
			"HelpEmailPlugin.Message" : _params.Message.rus
		});
		_translationsHash.addtext("eng", {
			"HelpEmailPlugin.Message" : _params.Message.eng
		});
		
		var interval = setInterval(function(){
			if (_queryMapLayers.buildedTree){
				clearInterval(interval);
                var sMapID = _layersTree.treeModel.getMapProperties().name;
				var sSubject = escape("BugReport: MapID=" + sMapID + " ; Login=" + nsGmx.AuthManager.getLogin());
				var sBody = escape("MapUrl: http://maps.kosmosnimki.ru/api/index.html?" + sMapID);
				var sAddress = "mailto:" + _params.EMail + "?subject=" + sSubject + "&body=" + sBody; 
				var oLink = _a([_t(_gtxt("HelpEmailPlugin.Message"))], [[ "attr", "href", sAddress]]);
				oLink.style.textDecoration = "none";
				var oLinkDiv = _div([oLink, _br(), _a([_t(_params.EMail)], [["attr", "href", "mailto:" + _params.EMail]])], [["attr", "align", "center"]]);
				oLinkDiv.style.width = "325px";
				oLinkDiv.style.border = "1px solid";
				oLinkDiv.style.padding = "3px 5px 3px 5px";
				oLinkDiv.style.margin = "5px 0px 5px 13px";
                _(document.getElementById("leftPanelFooter"), [oLinkDiv]);
				resizeAll();
			}
		} , 200);
	}
}

gmxCore.addModule("HelpEmailPlugin", publicInterface);

})(jQuery, globalFlashMap)