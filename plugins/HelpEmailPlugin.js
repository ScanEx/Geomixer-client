(function ($, _){
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
        
        _queryMapLayers.loadDeferred.then(function() {
            var oLink = _t(_gtxt("HelpEmailPlugin.Message"));
            var oLinkDiv = _div([oLink, _br(), _a([_t(_params.EMail)], [["attr", "href", "mailto:" + _params.EMail]])], [["attr", "align", "center"]]);
            oLinkDiv.style.width = "325px";
            oLinkDiv.style.border = "1px solid";
            oLinkDiv.style.padding = "3px 5px 3px 5px";
            oLinkDiv.style.margin = "5px 0px 5px 13px";
            _(document.getElementById("leftPanelFooter"), [oLinkDiv]);
            resizeAll();
        });
    }
}

gmxCore.addModule("HelpEmailPlugin", publicInterface);

})(jQuery, nsGmx.Utils._);