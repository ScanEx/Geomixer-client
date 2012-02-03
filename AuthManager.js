/** Менеджер аудетификационной информации системы. Умеет запрашивать у сервера текущий статус пользователя,
 хранит информацию о ролях и допустимых действиях пользователей с этой ролью.
 @memberOf nsGmx
 @class
 @name AuthManager
*/
var nsGmx = nsGmx || {};
(function($)
{
    $.extend(nsGmx, {
        ROLE_ADMIN        : 'admin', 
        ROLE_USER         : 'user',
        ROLE_GUEST        : 'guest',
        ROLE_UNAUTHORIZED : 'none',
        
        ACTION_CREATE_LAYERS        : 'createData',      // Создавать новые слои (векторные и растровые)
        ACTION_CREATE_MAP           : 'createMap',       // Cоздавать новые карты
        ACTION_SAVE_MAP             : 'saveMap',         // Сохранять карту (нужны права редактирования на карту)
        ACTION_CHANGE_MAP_TYPE      : 'changeType',      // Менять тип карты (публичная/открытая/закрытая и т.п.)
        ACTION_SEE_OPEN_MAP_LIST    : 'openMap',         // Видеть список публичных карт
        ACTION_SEE_PRIVATE_MAP_LIST : 'privateMap',      // Видеть спискок всех карт
        ACTION_SEE_MAP_RIGHTS       : 'seeRights',       // Видеть и редактировать права пользователей (для объектов, владельцем которых является)
        ACTION_SEE_FILE_STRUCTURE   : 'seeFiles',        // Видеть всю файловую структуру сервера, а не только свою дом. директорию
        ACTION_SEE_ALL_USERS        : 'seeUsers',        // Видеть список всех пользователей
        ACTION_SEE_USER_FULLNAME    : 'seeUserFullname', // Видеть полные имена и логины пользователей (а не только псевдонимы)
        ACTION_UPLOAD_FILES         : 'uploadFiles'      // Загружать файлы на сервер через web-интерфейс
    });
    
    var _actions = {};
    _actions[nsGmx.ROLE_ADMIN] = {};    
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_CREATE_LAYERS       ] = true;
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_CREATE_MAP          ] = true;
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_SAVE_MAP            ] = true;
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_SEE_OPEN_MAP_LIST   ] = true;
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_SEE_PRIVATE_MAP_LIST] = true;
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_CHANGE_MAP_TYPE     ] = true;
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_SEE_MAP_RIGHTS      ] = true;
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_SEE_FILE_STRUCTURE  ] = true;
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_SEE_ALL_USERS       ] = true;
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_SEE_USER_FULLNAME   ] = true;
    _actions[nsGmx.ROLE_ADMIN][nsGmx.ACTION_UPLOAD_FILES        ] = true;
    
    _actions[nsGmx.ROLE_USER] = {};
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_CREATE_LAYERS     ] = true;
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_CREATE_MAP        ] = true;
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_SAVE_MAP          ] = true;
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_SEE_OPEN_MAP_LIST ] = true;
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_SEE_MAP_RIGHTS    ] = true;
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_UPLOAD_FILES      ] = true;
    
    _actions[nsGmx.ROLE_GUEST] = {}
    _actions[nsGmx.ROLE_GUEST][nsGmx.ACTION_SEE_OPEN_MAP_LIST ] = true;
    _actions[nsGmx.ROLE_GUEST][nsGmx.ACTION_SAVE_MAP          ] = true;
    
    nsGmx.AuthManager = new function()
    {
        var _userInfo = null;
        var _this = this;
        
        this.getLogin = function()
        {
            if (!_userInfo) return null;
            return _userInfo.Login || null;
        };
        
        this.getNickname = function()
        {
            if (!_userInfo) return null;
            return _userInfo.Nickname || null;
        };
        
        this.getFullname = function()
        {
            if (!_userInfo) return null;
            return _userInfo.Fullname || null;
        };
        
        this.getUserFolder = function()
        {
            if (!_userInfo) return null;
            return _userInfo.Folder;
        };
        
        this.setUserInfo = function(userInfo)
        {
            _userInfo = $.extend({}, {IsAccounts: false, Role: this.ROLE_UNAUTHORIZED}, userInfo);
            $(this).trigger('change');
        };
        
        this.isRole = function(role)
        {
            return _userInfo.Role === role;
        };
        
        this.canDoAction = function(action)
        {
            return _userInfo.Role in _actions && action in _actions[_userInfo.Role];
        };
        
        this.isAccounts = function()
        {
            return _userInfo.IsAccounts;
        };
        
        this.isLogin = function()
        {
            return _userInfo && _userInfo.Login !== false && _userInfo.Role !== this.ROLE_UNAUTHORIZED;
        };
        
        this.checkUserInfo = function(callback, errorCallback)
        {
            var isTokenUsed = false;
            var _processResponse = function( response )
            {
                var resOk = parseResponse(response);
                
                !resOk && errorCallback && errorCallback();
                    
                if (response.Result == null || !resOk)
                {
                    // юзер не авторизован
                    userInfo = function(){return {Login: false}};
                    _this.setUserInfo({Login: false});
                    
                    if (isTokenUsed)
                    {
                        //TODO: обработать ошибку
                    }
                }
                else
                {
                    //юзер с accounts, там не зарегистрирован, но локально авторизован - надо разлогинеть локально
                    if (!isTokenUsed && response.Result.IsAccounts)
                    {
                        sendCrossDomainJSONRequest(serverBase + "Logout.ashx?WrapStyle=func&WithoutRedirection=1");
                        // юзер не авторизован
                        userInfo = function(){return {Login: false}};
                        _this.setUserInfo({Login: false});
                    }
                    else
                    {
                        userInfo = function()
                        {
                            return response.Result;
                        }
                        _this.setUserInfo(response.Result);
                    }
                }
                
                resOk && callback && callback();
            }
        
            if (window.mapsSite && window.gmxAuthServer)
            {
                sendCrossDomainJSONRequest(window.gmxAuthServer + "Handler/Login?action=gettoken", function(response)
                {
                    if (response.Status === 'OK')
                    {
                        isTokenUsed = true;
                        sendCrossDomainJSONRequest(serverBase + 'login.ashx?token=' + response.Result.Id, _processResponse);
                    }
                    else
                    {
                        sendCrossDomainJSONRequest(serverBase + 'User/GetUserInfo.ashx?WrapStyle=func', _processResponse);
                    }
                }, 'callback');
            }
            else
            {
                sendCrossDomainJSONRequest(serverBase + 'User/GetUserInfo.ashx?WrapStyle=func', _processResponse);
            }
            
        }
    }
})(jQuery);