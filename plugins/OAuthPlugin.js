(function($){

gmxCore.addModule('OAuthPlugin', {
    beforeMap : function(params)
    {
        nsGmx.AuthManager.addCheckUserMethod({
            canAuth: function()
            {
                var OAuthCode = readCookie("OAuthCookie");
                return OAuthCode || window.location.search.search(/code=([^=&]+)/) != -1;
            },
            doAuth: function(callback, errorCallback)
            {
                var res = window.location.search.match(/code=([^=&]+)/);
                if (res)
                {
                    var code = res[1];
                    createCookie("OAuthCookie", code);
                    //alert(code);
                    window.location.replace(window.location.href.split("?")[0]);
                }
                else
                {
                    var OAuthCode = readCookie("OAuthCookie");
                    
                    if (OAuthCode)
                    {
                        eraseCookie("OAuthCookie");
                        //послать code на сервер!
                        alert(OAuthCode);
                    }
                    
                    callback();
                }
            }
        })
    },
    afterViewer: function(params)
    {
        var path = gmxCore.getModulePath('OAuthPlugin');
        var container = nsGmx.widgets.authWidget.getContainer();
        var googleIcon = $('<img/>', {src: path + 'img/oauth/google.png'}).css({float: 'right', margin: '8px 2px 0px 0px' }).click(function()
        {
           nsGmx.Utils.getMapStateAsPermalink(function(parmalinkID)
            {
                createCookie("TempPermalink", parmalinkID);
                createCookie("TinyReference", parmalinkID);
                //window.location.replace(window.location.href.split("?")[0] + "?permalink=" + parmalinkID + (defaultMapID == globalMapName ? "" : ("&" + globalMapName)));
                
                var redirectURI = encodeURIComponent(window.location.href.split("?")[0]);
                var clientID = encodeURIComponent('425251706774.apps.googleusercontent.com');
                var scope = encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email');
                window.location = 'https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=' + clientID + '&redirect_uri=' + redirectURI + '&scope=' + scope;
            })
        });
        
        $(container).prepend( googleIcon );
    }
});

})(jQuery);