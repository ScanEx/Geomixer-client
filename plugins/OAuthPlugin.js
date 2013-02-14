(function($){

gmxCore.addModule('OAuthPlugin', {

    afterViewer: function(params)
    {
		if (nsGmx.AuthManager.isLogin())return;
        var path = gmxCore.getModulePath('OAuthPlugin');
        var container = nsGmx.widgets.authWidget.getContainer();
        var googleIcon = $('<img/>', {src: path + 'img/oauth/google.png'}).css({float: 'right', margin: '8px 2px 0px 0px' }).click(function()
        {
           _mapHelper.getMapStateAsPermalink(function(parmalinkID)
            {
                createCookie("TempPermalink", parmalinkID);
                createCookie("TinyReference", parmalinkID);
                //window.location.replace(window.location.href.split("?")[0] + "?permalink=" + parmalinkID + (defaultMapID == globalMapName ? "" : ("&" + globalMapName)));
                
                //var redirectURI = encodeURIComponent(window.location.href.split("?")[0]);
                //var clientID = encodeURIComponent('425251706774.apps.googleusercontent.com');
                //var scope = encodeURIComponent('https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email');
                //window.location = 'https://accounts.google.com/o/oauth2/auth?response_type=code&client_id=' + clientID + '&redirect_uri=' + redirectURI + '&scope=' + scope;
				var redirect_uri = gmxAPI.getAPIHostRoot() + 'api/oAuthCallback.html';
				nsGmx.Utils.login(redirect_uri, serverBase + 'oAuth/', function(){
					window.location.replace(window.location.href.split("?")[0] + "?permalink=" + parmalinkID + (defaultMapID == globalMapName ? "" : ("&" + globalMapName)));
				}
				, 'Google');
            })
        });
        
        $(container).prepend( googleIcon );
    }
});

})(jQuery);