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
        
        ACTION_CREATE_LAYERS        : 'createData',
        ACTION_CREATE_MAP           : 'createMap',
        ACTION_SAVE_MAP             : 'saveMap',
        ACTION_CHANGE_MAP_TYPE      : 'changeType',
        ACTION_SEE_OPEN_MAP_LIST    : 'openMap',
        ACTION_SEE_PRIVATE_MAP_LIST : 'privateMap',
        ACTION_SEE_MAP_RIGHTS       : 'seeRights',
        ACTION_SEE_FILE_STRUCTURE   : 'seeFiles',
        ACTION_SEE_ALL_USERS        : 'seeUsers'
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
    
    _actions[nsGmx.ROLE_USER] = {};
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_CREATE_LAYERS     ] = true;
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_CREATE_MAP        ] = true;
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_SAVE_MAP          ] = true;
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_SEE_OPEN_MAP_LIST ] = true;
    _actions[nsGmx.ROLE_USER][nsGmx.ACTION_SEE_MAP_RIGHTS    ] = true;
    
    _actions[nsGmx.ROLE_GUEST] = {}
    _actions[nsGmx.ROLE_GUEST][nsGmx.ACTION_SEE_OPEN_MAP_LIST ] = true;
    _actions[nsGmx.ROLE_GUEST][nsGmx.ACTION_CREATE_MAP        ] = true;
    _actions[nsGmx.ROLE_GUEST][nsGmx.ACTION_SAVE_MAP          ] = true;
    
    nsGmx.AuthManager = new function()
    {
        var _userInfo = null;
        this.getUserName = function()
        {
            if (!_userInfo) return null;
            return _userInfo.Login;
        };
        this.getUserFolder = function()
        {
            if (!_userInfo) return null;
            return _userInfo.Folder;
        };
        
        var setUserInfo = function(userInfo)
        {
            _userInfo = $.extend({}, {isAccounts: false, Role: this.ROLE_UNAUTHORIZED}, userInfo);
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
            return _userInfo.isAccounts;
        };
        
        this.isLogin = function()
        {
            return _userInfo && _userInfo.Login !== false && _userInfo.Role !== this.ROLE_UNAUTHORIZED;
        };
        
        this.checkUserInfo = function(callback, errorCallback)
        {
            sendCrossDomainJSONRequest(serverBase + 'User/GetUserInfo.ashx?WrapStyle=func', function(response)
            {
                var resOk = parseResponse(response);
                
                !resOk && errorCallback && errorCallback();
                    
                if (response.Result == null || !resOk)
                {
                    // юзер не авторизован
                    userInfo = function(){return {Login: false}};
                    setUserInfo({Login: false});
                }
                else
                {
                    userInfo = function()
                    {
                        return response.Result;
                    }
                    setUserInfo(response.Result);
                }
                
                resOk && callback && callback();
            })
        }
    }
})(jQuery);