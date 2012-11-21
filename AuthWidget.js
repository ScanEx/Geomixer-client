/** Виджет для визуализации информации о текущем статусе пользователя.
* Показывает кнопки Вход/Выход, имя пользователя. Позволяет отослать логин/пароль на сервер, сменить пароль.
 @memberOf nsGmx
 @class
 @name AuthWidget
*/
var nsGmx = nsGmx || {};
(function($)
{
    var _dialogCanvas = null;

    function changePasswordDialog()
    {
        if ($$('changePasswordCanvas'))
            return;
        
        var oldInput = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','type','password']]),
            newInput = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','type','password']]),
            confirmInput = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','type','password']]),
            changeButton = makeButton(_gtxt("Изменить")),
            canvas = _div([_div([_span([_t(_gtxt("Старый пароль"))]), _br(), oldInput, _br(),
                                _span([_t(_gtxt("Новый пароль"))]), _br(), newInput, _br(),
                                _span([_t(_gtxt("Подтвердите пароль"))]), _br(), confirmInput, _br()],[['css','textAlign','center']]),
                           _div([changeButton],[['css','textAlign','center'],['css','margin','5px']])],[['attr','id','changePasswordCanvas']]),
            checkPassw = function()
            {
                if (newInput.value != confirmInput.value)
                {
                    newInput.value = '';
                    confirmInput.value = '';
                    
                    inputError([newInput, confirmInput], 2000);
                    newInput.focus();
                    
                    return;
                }
                
                nsGmx.AuthManager.changePassword(oldInput.value, newInput.value, function()
                {
                    jQuery(canvas.parentNode).dialog("destroy")
                    canvas.parentNode.removeNode(true);
                    
                    _layersTree.showSaveStatus($$('headerLinks'));
                }, function( message )
                {
                    message && showErrorMessage(message, true);
                })
                
                oldInput.value = '';
                newInput.value = '';
                confirmInput.value = '';
            };
        
        showDialog(_gtxt("Изменение пароля"), canvas, 200, 180, false, false);
        canvas.parentNode.style.overflow = 'hidden';	
        
        oldInput.focus();
        
        changeButton.onclick = function()
        {
            checkPassw();
        }
        
        confirmInput.onkeyup = function(e)
        {
            var evt = e || window.event;
            if (getkey(evt) == 13) 
            {	
                checkPassw();
                
                return false;
            }
            
            return true;
        }
    }
    
    nsGmx.AuthWidget = function( container, authManager, loginCallback )
    {
        var _container = container;
        var _authManager = authManager;
        var _this = this;
                
        var _createLogin = function()
        {
            var span = makeLinkButton(_gtxt('Вход'));
            
            span.onclick = function()
            {
				if(window.useAccountsAuth){
					_this.showOAuthDialog( loginCallback );
				}
				else{
					_this.showLoginDialog( loginCallback );
				}
            }
            
            _(_container, [_div([span], [['attr','id','log'],['dir','className','log']])]);
        }
        
        var _createLogout = function()
        {
            var logoutSpan = makeLinkButton(_gtxt('Выход'));
            
            logoutSpan.onclick = function()
            {
                _authManager.logout(function()
                {
                    if (typeof globalFlashMap !== 'undefined')
                        reloadMap();
                    else
                        window.location.replace(window.location.href.split("?")[0] + (defaultMapID == globalMapName ? "" : ("&" + globalMapName)));
                });
            }
            
            var userText = _authManager.getLogin();
            if (_authManager.getFullname() !== null && _authManager.getFullname() !== '')
                userText += ' (' + _authManager.getFullname() + ')';
            var userSpan = _span([_t(userText)], [['css','cursor','pointer']]);
            
            userSpan.onclick = function()
            {
                if ( _authManager.isAccounts() )
                {
                    if (window.gmxAuthServer)
                        window.open(  window.gmxAuthServer + "Account/ChangePassword", '_blank');
                }
                else
                    changePasswordDialog();
            }
            
            if ( _authManager.isAccounts() )
                $(userSpan).css('color', '#5555FF');
            
            _title(userSpan, _gtxt("Изменение пароля"))
            
            _(_container, [_div([logoutSpan], [['attr','id','log'],['dir','className','log']]), _div([userSpan], [['attr','id','user'],['dir','className','user']])]);
        }
        
        var _update = function()
        {
            if ( typeof window.gmxViewerUI != 'undefined' &&  window.gmxViewerUI.hideLogin ) return;
            $(_container).empty();
            
            if (_authManager.isLogin())
            {
                _createLogout();
            }
            else
            {
                _createLogin();
            }
        }
        
        $(_authManager).change(_update);
        _update();
            
		this.showOAuthDialog = function( ){
			window.processAuthentication = function(status){
				if(status == '?OK' && loginCallback) loginCallback();
			}
			var features, w = 400, h = 150, l, t;
			var top = (screen.height - h)/2, left = (screen.width - w)/2;
			features = 'location=0,menubar=0,resizable=0,scrollbars=0,status=0,toolbar=0,width='+w+',height='+h+',left='+left+',top='+top ;
			var redirect_uri = serverBase + 'oAuth/oAuthCallback.ashx?callback=' + escape(gmxAPI.getAPIHostRoot() + 'api/oAuthCallback.html')
			var url = serverBase + 'oAuth/LoginDialog.ashx?redirect_uri=' + escape(redirect_uri)
			window.open(url, '_blank', features);
		}
        //Показывает диалог с вводом логина/пароля, посылает запрос на сервер.
        this.showLoginDialog = function()
        {
            if (_dialogCanvas !== null)
                return;
                
            var isMapsSite = typeof mapsSite != 'undefined' && mapsSite;
            var dialogHeight = isMapsSite ? 190 : 135;
            
            var loginInput = _input(null, [['dir','className','inputStyle'],['css','width','160px']]),
                passwordInput = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','type','password']]),
                regLink = makeLinkButton(_gtxt("Регистрация")),
                retriveLink = makeLinkButton(_gtxt("Восстановление пароля")),
                loginButton = makeButton(_gtxt("Вход")),
                canvas = _div([_div([_span([_t(_gtxt("Логин"))]), _br(), loginInput, _br(),
                               _span([_t(_gtxt("Пароль"))]), _br(), passwordInput, _br()],[['css','textAlign','center']]),
                               _div([loginButton],[['css','textAlign','center'],['css','margin','5px']])],[['attr','id','loginCanvas']]),
                checkLogin = function()
                {
                    _authManager.login(loginInput.value, passwordInput.value, function()
                        { //всё хорошо
                            $(canvas.parentNode).dialog("destroy")
                            canvas.parentNode.removeNode(true);
                            _dialogCanvas = null;
                            loginCallback && loginCallback();
                        }, function(err)
                        { //ошибка
                            if (err.emailWarning)
                            {
                                var errorDiv = $("<div/>", {'class': 'EmailErrorMessage'}).text(err.message);
                                $(loginButton).after(errorDiv);
                                setTimeout(function(){
                                    errorDiv.hide(500, function(){ errorDiv.remove(); });
                                }, 8000)
                            }
                            inputError([loginInput, passwordInput], 2000);
                            loginInput.focus();
                        }
                    );
                    
                    loginInput.value = '';
                    passwordInput.value = '';
                };
            
            _dialogCanvas = canvas;
            
            if (isMapsSite)
            {
                _(canvas, [regLink, _br(), retriveLink]);
            }
            
            showDialog(_gtxt("Пожалуйста, авторизуйтесь"), canvas, 200, dialogHeight, false, false, null, function()
            {
                _dialogCanvas = null;
            });
            
            canvas.parentNode.style.overflow = 'hidden';
            
            loginInput.focus();
            
            loginButton.onclick = function()
            {
                checkLogin();
            }
            regLink.onclick = function()
            {
                window.open(window.gmxAuthServer + 'Account/Registration', '_blank')
            }
            retriveLink.onclick = function()
            {
                window.open(window.gmxAuthServer + 'Account/Retrive', '_blank')
            }
            
            passwordInput.onkeyup = function(e)
            {
                var evt = e || window.event;
                if (getkey(evt) == 13) 
                {	
                    checkLogin();
                    
                    return false;
                }
                
                return true;
            }
        }
        
        this.getContainer = function()
        {
            return _container;
        }
    }
})(jQuery);