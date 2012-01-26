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

    var logout = function()
    {
        if (nsGmx.AuthManager.isAccounts() && window.gmxAuthServer)
            sendCrossDomainJSONRequest(window.gmxAuthServer + "Handler/Logout", null, 'callback');
            
        nsGmx.AuthManager.setUserInfo({Login: false});
            
        sendCrossDomainJSONRequest(serverBase + "Logout.ashx?WrapStyle=func&WithoutRedirection=1", function(response)
        {
            if (!parseResponse(response))
                return;
            
            if (globalFlashMap)
                reloadMap();
            else
                window.location.replace(window.location.href.split("?")[0] + (defaultMapID == globalMapName ? "" : ("&" + globalMapName)));
        });
    }
    
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
            failureHandler = function()
            {
                jQuery(newInput).addClass('error');
                jQuery(confirmInput).addClass('error');
                
                newInput.focus();
                
                setTimeout(function()
                    {
                        jQuery(newInput).removeClass('error');
                        jQuery(confirmInput).removeClass('error');
                    }, 2000)
            },
            checkPasswHandler = function(response)
            {
                if (response.Status == 'ok' && response.Result)
                {
                    jQuery(canvas.parentNode).dialog("destroy")
                    canvas.parentNode.removeNode(true);
                    
                    _layersTree.showSaveStatus($$('headerLinks'));
                }
                else
                {
                    if (response.ErrorInfo && typeof response.ErrorInfo.ErrorMessage != 'undefined')
                    {
                        showErrorMessage(response.ErrorInfo.ErrorMessage, true)
                    }
                }
            },
            checkPassw = function()
            {
                if (newInput.value != confirmInput.value)
                {
                    newInput.value = '';
                    confirmInput.value = '';
                    
                    failureHandler();
                    
                    return;
                }
                
                sendCrossDomainJSONRequest(serverBase + "ChangePassword.ashx?WrapStyle=func&old=" + oldInput.value + "&new=" + newInput.value, checkPasswHandler);
                
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
                nsGmx.AuthWidget.showLoginDialog( loginCallback );
            }
            
            _(_container, [_div([span], [['attr','id','log'],['dir','className','log']])]);
        }
        
        var _createLogout = function()
        {
            var loginSpan = makeLinkButton(_gtxt('Выход'));
            
            loginSpan.onclick = function()
            {
                logout();
            }
            
            var userText = _authManager.getLogin();
            if (_authManager.getFullname() !== null && _authManager.getFullname() !== '')
                userText += ' (' + _authManager.getFullname() + ')';
            var userSpan = _span([_t(userText)], [['css','cursor','pointer']]);
            
            userSpan.onclick = function()
            {
                if ( nsGmx.AuthManager.isAccounts() )
                {
                    if (window.gmxAuthServer)
                        window.open(  window.gmxAuthServer + "Account/ChangePassword", '_blank');
                }
                else
                    changePasswordDialog();
            }
            
            if ( nsGmx.AuthManager.isAccounts() )
                $(userSpan).css('color', '#5555FF');
            
            _title(userSpan, _gtxt("Изменение пароля"))
            
            _(_container, [_div([userSpan], [['attr','id','user'],['dir','className','user']]),_div([loginSpan], [['attr','id','log'],['dir','className','log']])]);
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
        
        //просто вызываем статический метод с переданным в виджет параметром
        this.showLoginDialog = function()
        {
            nsGmx.AuthWidget.showLoginDialog(loginCallback);
        }
    }
    
    //Показывает диалог с вводом логина/пароля, посылает запрос на сервер.
    //callback вызовется, если с сервера вернулся положительный ответ
    nsGmx.AuthWidget.showLoginDialog = function(callback)
    {
        if (_dialogCanvas !== null)
            return;
            
        var isMapsSite = typeof mapsSite != 'undefined' && mapsSite;
        var dialogHeight = isMapsSite ? 180 : 135;
        
        var loginInput = _input(null, [['dir','className','inputStyle'],['css','width','160px']]),
            passwordInput = _input(null, [['dir','className','inputStyle'],['css','width','160px'],['attr','type','password']]),
            regLink = makeLinkButton(_gtxt("Регистрация")),
            retriveLink = makeLinkButton(_gtxt("Восстановление пароля")),
            loginButton = makeButton(_gtxt("Вход")),
            curLogin = null,
            curPass = null,
            canvas = _div([_div([_span([_t(_gtxt("Логин"))]), _br(), loginInput, _br(),
                           _span([_t(_gtxt("Пароль"))]), _br(), passwordInput, _br()],[['css','textAlign','center']]),
                           _div([loginButton],[['css','textAlign','center'],['css','margin','5px']])],[['attr','id','loginCanvas']]),
            failureHandler = function()
            {
                $(loginInput).addClass('error');
                $(passwordInput).addClass('error');
                
                loginInput.focus();
                
                setTimeout(function()
                    {
                        $(loginInput).removeClass('error');
                        $(passwordInput).removeClass('error');
                    }, 2000)
            },
            checkLoginHandler = function(response)
            {
                if (response.Status == 'ok' && response.Result)
                {
                    $(canvas.parentNode).dialog("destroy")
                    canvas.parentNode.removeNode(true);
                    _dialogCanvas = null;
                    
                    if (response.Result.IsAccounts)
                    {
                        //авторизуемся на центральном сервере авторизации
                        sendCrossDomainJSONRequest(window.gmxAuthServer + "Handler/Login?login=" + encodeURIComponent(curLogin) + "&password=" + encodeURIComponent(curPass), function()
                        {
                            //TODO: check result
                            callback && callback();
                        }, 'callback');                    
                    }
                    else
                    {
                        callback && callback();
                    }
                    
                }
                else
                {
                    if (response.Status === 'auth' && ('Result' in response) && response.Result.ClassName === 'System.ArgumentException')
                    {
                        var errorDiv = $("<div/>", {'class': 'EmailErrorMessage'}).text(response.Result.Message);
                        $(loginButton).after(errorDiv);
                        setTimeout(function(){
                            errorDiv.hide(500, function(){ errorDiv.remove(); });
                        }, 4000)
                    }
                    failureHandler();
                }
            },
            checkLogin = function()
            {
                var login = loginInput.value;
                sendCrossDomainJSONRequest(serverBase + "Login.ashx?WrapStyle=func&login=" + loginInput.value + "&pass=" + passwordInput.value, checkLoginHandler);
                
                curLogin = loginInput.value;
                curPass = passwordInput.value;
                
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
})(jQuery);