var nsGmx = nsGmx || {};

(function() {

var SHARE_TYPES = ['public', 'private'];

nsGmx.Translations.addText('rus', {security: {
    ownerName: 'Владелец',
    defAccess: 'Доступ для всех',
    access: {
        no: 'нет доступа',
        view: 'просмотр',
        edit: 'редактирование',
        editrows: 'редактирование объектов',
        preview: 'предпросмотр'
    },
    share: {
        'public': 'публичный',
        'private': 'частный'
    },
    addHeaderLabel: 'Введите пользователя или группу',
    addOkText: 'Добавить'
}});

nsGmx.Translations.addText('eng', {security: {
    ownerName: 'Owner',
    defAccess: 'Public access',
    access: {
        no: 'no access',
        view: 'view only',
        edit: 'edit',
        editrows: 'edit objects',
        preview: 'preview'
    },
    share: {
        'public': 'public',
        'private': 'private'
    },
    addHeaderLabel: 'Enter user or group',
    addOkText: 'Add'
}});

//делает запрос на сервер и возвращает список пользователей по запросу query
var findUsers = function(query, maxRecords) {
    var def = new L.gmx.Deferred();
    var maxRecordsParamStr = maxRecords ? '&maxRecords=' + maxRecords : '';
    sendCrossDomainJSONRequest(serverBase + 'User/FindUser?query=' + encodeURIComponent(query) + maxRecordsParamStr, function(response) {
        if (!parseResponse(response)) {
            def.reject(response);
            return;
        }
        
        def.resolve(response.Result);
    })
    
    return def;
}

var usersHash = {};

var automplateLabelTemplate = Handlebars.compile('{{Nickname}}{{#if Login}}\u00A0({{Login}}){{/if}}');
//на input вешается autocomplete со списком пользователей.
//кроме того, по нажатию enter происходит генерация события enterpress
var wrapUserListInput = function(input) {
    input.on('keydown', function(event) {
        if (event.keyCode === 13) {
            //setTimeout нужен чтобы autocomplete не дописывал выбранное значение в input после того, как мы его очистим
            setTimeout(function() {
                $(this).trigger('enterpress');
            }.bind(this), 0);
        }
    });
    input.autocomplete({
        source: function(request, cbResponse) {
            findUsers(request.term, 10).then(function(userInfos) {
                cbResponse(userInfos.map(function(userInfo) {
                    usersHash[userInfo.Nickname] = userInfo;
                    return {value: userInfo.Nickname, label: automplateLabelTemplate(userInfo)};
                }));
            }, cbResponse.bind(null, []));
        }
    });
}

var SecurityOwnerWidget = function(securityInfo, container) {
    var ui = $(SecurityOwnerWidget._template({
        ownerName: securityInfo.Owner
    })).appendTo(container);
    
    $('.security-owner-cancel', ui).click(function() {
        $('.changeOwnerLink', ui).click();
    });
    
    $('.changeOwnerLink', ui).click(function() {
        $(this).toggle();
        $('.security-owner-container', ui).toggle();
        $('.security-owner-input', ui).val('').focus();
    });
    
    var ownerAddInput = $('.security-owner-input', ui);
    ownerAddInput.on('enterpress', function() {
        $('.security-owner-ok', ui).click();
    });
    
    wrapUserListInput(ownerAddInput);
    
    $('.security-owner-ok', ui).click(function() {
        var input = $('.security-owner-input', ui),
            name = input.val();
            
        var doChangeUser = function(user) {
            $('.changeOwnerLink', ui).text(user.Nickname);
            securityInfo.NewOwnerID = user.UserID;
            $('.changeOwnerLink', ui).click();
        }
        
        if (name in usersHash) {
            doChangeUser(usersHash[name]);
        } else {
            findUsers(name, 1).then(function(userInfos) {
                if (userInfos[0] && userInfos[0].Nickname.toLowerCase() === name.toLowerCase()) {
                    doChangeUser(userInfos[0]);
                } else {
                    inputError(input[0]);
                }
            }, inputError.bind(null, input[0]));
        }
    });
}

SecurityOwnerWidget._template = Handlebars.compile(
    '<div class = security-owner>' +
        '<span>{{i "security.ownerName"}}: </span>' +
        '<span class="buttonLink changeOwnerLink security-owner-change">{{ownerName}}</span>' +
        '<div class="security-owner-container ui-front" style="display:none">' +
            '<input class="security-owner-input inputStyle">' +
            '<button class="security-owner-ok">Сменить</button>' +
            '<button class="security-owner-cancel">Отмена</button>' +
        '</div>' +
    '</div>');
    
//@param {String[]} options.accessTypes массив прав доступа
var SecurityUserListWidget = function(securityInfo, container, options) {
    var _this = this;
    
    this.options = options;
    
    var ui = $(SecurityUserListWidget._template()).appendTo(container);
    
    var sortFuncs = {};
    
    var genSortFunction = function(field)
    {
        return [
            function(a,b){if (a[field] > b[field]) return 1; else if (a[field] < b[field]) return -1; else return 0},
            function(a,b){if (a[field] < b[field]) return 1; else if (a[field] > b[field]) return -1; else return 0}
        ];
    }

    sortFuncs[_gtxt('Псевдоним')]  = genSortFunction('Nickname');
    sortFuncs[_gtxt('Полное имя')] = genSortFunction('FullName');
    sortFuncs[_gtxt('Доступ')]     = genSortFunction('Access');
    
    var fieldNames   = [_gtxt("Псевдоним"), _gtxt("Полное имя"), /*_gtxt("Роль"),*/ _gtxt("Доступ"), ""];
    var fieldWidthes = ['35%', '35%', '25%','5%'];
    
    this._securityTable = new nsGmx.ScrollTable({limit: 500, showFooter: false});
    this.securityUsersProvider = new nsGmx.ScrollTable.StaticDataProvider();
    
    this.securityUsersProvider.setSortFunctions(sortFuncs);
    this._securityTable.setDataProvider(this.securityUsersProvider);
    this._securityTable.createTable($('.access-table-placeholder', ui)[0], 'securityTable', 0, fieldNames, fieldWidthes, function(arg){
        return SecurityUserListWidget._drawMapUsers.call(this, arg, _this);
    }, sortFuncs);
    
    var addInput = $('.security-add-input', ui);
    addInput.on('enterpress', function() {
        $('.security-add-ok', ui).click();
    })
    wrapUserListInput(addInput);
    
    $('.security-add-ok', ui).click(function() {
        var input = $('.security-add-input', ui),
            name = input.val();
        
        var addedUsers = _this.securityUsersProvider.getOriginalItems();
        if (nsGmx._.findWhere(addedUsers, {Nickname: name})) {
            inputError(input[0]);
            return;
        }
        
        var doAddUser = function(user) {
            _this._addMapUser(user);
            input.val('').focus();
        }
        
        if (name in usersHash) {
            doAddUser(usersHash[name]);
        } else {
            findUsers(name, 1).then(function(userInfos) {
                //TODO: обработать ситуацию, когда пользователь вводит email
                if (userInfos[0] && userInfos[0].Nickname.toLowerCase() === name.toLowerCase()) {
                    doAddUser(userInfos[0]);
                } else {
                    inputError(input[0]);
                }
            }, inputError.bind(null, input[0]));
        }
    });
    
    this.securityUsersProvider.setOriginalItems( securityInfo.Users );
}

SecurityUserListWidget.DEFAULT_ACCESS = 'view';

SecurityUserListWidget.prototype._addMapUser = function(user) {
    var existedUser = $.extend( {Access: SecurityUserListWidget.DEFAULT_ACCESS}, user );
    this.securityUsersProvider.addOriginalItem(existedUser);
}

SecurityUserListWidget.prototype._removeMapUser = function(user)
{
    this.securityUsersProvider.filterOriginalItems(function(elem) {
        return elem.Nickname !== user.Nickname;
    });
}

SecurityUserListWidget.prototype.updateHeight = function(height) {
    this._securityTable.updateHeight(height);
}

SecurityUserListWidget._drawMapUsers = function(user, securityScope)
{
    var remove = makeImageButton('img/recycle.png', 'img/recycle_a.png'),
        tdRemove = user.Login == nsGmx.AuthManager.getLogin() ? _td() : _td([remove], [['css', 'textAlign', 'center']]),
        accessSel = nsGmx.Utils._select(null, [['dir','className','selectStyle'],['css','width','130px']]),
        isShowFullname = nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_USER_FULLNAME),
        tr;
    
    var accessList = securityScope.options.accessTypes;
    for (var i = 0; i < accessList.length; ++i) {
        //в списках пользователей нет смысла показывать пункт "нет доступа"
        if (accessList[i] !== 'no') {
            _(accessSel, [_option([_t(_gtxt('security.access.' + accessList[i]))],[['attr', 'value', accessList[i]]])]);
        }
    }

    remove.onclick = function()
    {
        if (tr)
            tr.removeNode(true);
        
        // уберем пользователя из списка
        securityScope._removeMapUser(user);
    }
    
    switchSelect(accessSel, user.Access);
    
    accessSel.onchange = function()
    {
        user.Access = this.value;
    }
    
    var tdNickname = _td([_div([_t(user.Nickname)], [['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
    var tdAccess = _td([accessSel],[['css','textAlign','center']]);
    
    var tdLogin = _td([_div([_t(user.Login)], [['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
    var tdFullname = _td([_div([_t(user.FullName || '')], [['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
    
    tr = _tr([
        tdNickname,
        tdFullname,
        tdAccess,
        tdRemove
    ]);
    
    for (var i = 0; i < tr.childNodes.length; i++)
        tr.childNodes[i].style.width = this._fields[i].width;
    
    attachEffects(tr, 'hover');
    
    return tr;
}

SecurityUserListWidget._template = Handlebars.compile(
    '<div class = "security-userlist">' +
        '<div class="security-add-container ui-front">' +
            '<span class="security-access-label">{{i "security.addHeaderLabel"}}: </span>' +
            '<input class="security-add-input inputStyle">' +
            '<button class="security-add-ok">{{i "security.addOkText"}}</button>' +
        '</div>' +
        '<div class="access-table-placeholder"></div>' +
    '</div>');


var security = function()
{
    this.mapTypeSel = null;
    this.mapAccessSel = null;
    
    this.defaultAccess = null;
    
    this.getSecurityName = null;
    this.updateSecurityName = null;
    
    this.propertyValue = null;
    this.title = null;
    
    //this._securityTable = new nsGmx.ScrollTable({limit: 500, showFooter: false});
    //this._securityUsersProvider = new nsGmx.ScrollTable.StaticDataProvider();
}

var mapSecurity = function()
{
    this.getSecurityName = "Map/GetSecurity.ashx";
    this.updateSecurityName = "Map/UpdateSecurity.ashx";
    
    this.propertyName = "MapID";
    this.dialogTitle = "Редактирование прав доступа карты [value0]";

    this.accessTypes = ['no', 'view', 'edit'];
}

mapSecurity.prototype = new security();
mapSecurity.prototype.constructor = mapSecurity;

var layerSecurity = function()
{
    this.getSecurityName = "Layer/GetSecurity.ashx";
    this.updateSecurityName = "Layer/UpdateSecurity.ashx";
    
    this.propertyName = "LayerID";
    this.dialogTitle = "Редактирование прав доступа слоя [value0]";
    
    this.accessTypes = ['no', 'preview', 'view', 'editrows', 'edit'];
}

layerSecurity.prototype = new security();
layerSecurity.prototype.constructor = layerSecurity;

var multiLayerSecurity = function()
{
    this.getSecurityName = "MultiLayer/GetSecurity.ashx";
    this.updateSecurityName = "MultiLayer/UpdateSecurity.ashx";
    
    this.propertyName = "MultiLayerID";
    this.dialogTitle = "Редактирование прав доступа слоя [value0]";
    
    this.accessTypes = ['no', 'view', 'edit'];
}

multiLayerSecurity.prototype = new security();
multiLayerSecurity.prototype.constructor = multiLayerSecurity;


var userGroupSecurity = function()
{
    this.getSecurityName = "User/GetUserGroupSecurity";
    this.updateSecurityName = "User/UpdateUserGroupSecurity";
    
    this.propertyName = "UserID";
    this.dialogTitle = "Состав группы [value0]";
    
    this.accessTypes = ['no', 'view', 'edit'];
}

userGroupSecurity.prototype = new security();
userGroupSecurity.prototype.constructor = userGroupSecurity;

security.prototype.getSecurityFromServer = function(id) {
    var def = $.Deferred();
    
    sendCrossDomainJSONRequest(serverBase + this.getSecurityName + "?WrapStyle=func&IncludeAdmin=true&" + this.propertyName + "=" + id, function(response)
    {
        if (!parseResponse(response)) {
            def.reject(response);
            return;
        }
        
        def.resolve(response.Result);
    })
    
    return def;
}

security.prototype.getRights = function(value, title)
{
    var _this = this;
    
    this.propertyValue = value;
    this.title = title;
    
    this.getSecurityFromServer(value).then(this.createMapSecurityDialog.bind(this));
}

security.prototype.createMapSecurityDialog = function(securityInfo)
{
    $$('securityDialog') && removeDialog($$('securityDialog').parentNode.parentNode);

    var _this = this;

    var uiTemplate = '<div id="securityDialog" class="security-canvas">' +
        '<div class="security-header">' + 
            '<button class="security-save">{{i Сохранить}}</button>' +
            '<div class="security-owner-placeholder"></div>' +
        '</div>' +
        
        '<div class="security-def-access">{{i security.defAccess}}: ' +
            '<select class="security-defaccess-select selectStyle">' +
                '{{#defAccessTypes}}' +
                    '<option value="{{value}}"{{#isSelected}} selected{{/isSelected}}>{{title}}</option>' +
                '{{/defAccessTypes}}' +
            '</select>' +
        '</div>' + 
        
        '<div class="security-userlist-placeholder"></div>' +
    '</div>';
    
    var canvas = $(Mustache.render(uiTemplate, {
        defAccessTypes: this.accessTypes.map(function(type) {
            return {
                value: type, 
                title: _gtxt('security.access.' + type), 
                isSelected: type === securityInfo.SecurityInfo.DefAccess
            };
        })
    }))[0];
    
    $('.security-defaccess-select', canvas).change(function() {
        securityInfo.SecurityInfo.DefAccess = this.value;
    })
    
    $('.security-save', canvas).click(function(){
        securityInfo.SecurityInfo.Users = _this.securityUserListWidget.securityUsersProvider.getOriginalItems();
        
        nsGmx.widgets.notifications.startAction('securitySave');
        var postParams = {WrapStyle: 'window', SecurityInfo: JSON.stringify(securityInfo.SecurityInfo)};
        postParams[_this.propertyName] = _this.propertyValue;
        
        sendCrossDomainPostRequest(serverBase + _this.updateSecurityName, postParams, function(response) {
            if (!parseResponse(response)) {
                nsGmx.widgets.notifications.stopAction('securitySave');
                return;
            }
            
            nsGmx.widgets.notifications.stopAction('securitySave', 'success', _gtxt('Сохранено'));
        })
    });
    
    new SecurityOwnerWidget(securityInfo.SecurityInfo, $('.security-owner-placeholder', canvas));
    this.securityUserListWidget = new SecurityUserListWidget(securityInfo.SecurityInfo, $('.security-userlist-placeholder', canvas), {accessTypes: this.accessTypes});
    
    var resize = function()
    {
        var mapTableHeight;
        var dialogWidth = canvas.parentNode.parentNode.offsetWidth;
        
        var nonTableHeight = 
            $('.security-header', canvas).height() + 
            $('.security-def-access', canvas).height() + 
            $('.security-add-container', canvas).height() + 15;

        mapTableHeight = canvas.parentNode.offsetHeight - nonTableHeight - 10;
        
        _this.securityUserListWidget.updateHeight(mapTableHeight);
    }

    showDialog(_gtxt(this.dialogTitle, this.title), canvas, 571, 370, false, false, resize);
    
    resize();
}

security.prototype._addMapUser = function(user, dataProvider)
{
    var existedUser = $.extend( {Access: this.defaultAccess}, user );
    
    dataProvider.addOriginalItem(existedUser);
}


//TODO: refactor
userGroupSecurity.prototype.createGroupSecurityDialog = function(securityInfo)
{
    $$('securityDialog') && removeDialog($$('securityDialog').parentNode.parentNode);

    var _this = this;

    var uiTemplate = '<div id="securityDialog" class="security-canvas">' +
        '<div class="security-header">' + 
            '<button class="security-save">{{i Сохранить}}</button>' +
            '<div class="security-owner-placeholder"></div>' +
        '</div>' +
        
        '<div class="security-props">' +
            '<div><span>Название</span><input class="security-props-title inputStyle" value={{Title}}></div>' +
            '<div><span>Описание</span><input class="security-props-description inputStyle" value={{Description}}></div>' +
        '</div>' +

        '<div class="security-userlist-placeholder"></div>' +
    '</div>';
    
    var canvas = $(Mustache.render(uiTemplate, {
        Title: securityInfo.Title,
        Description: securityInfo.Description
    }))[0];
    
    $('.security-save', canvas).click(function(){
        securityInfo.SecurityInfo.Users = _this.securityUserListWidget.securityUsersProvider.getOriginalItems();
        securityInfo.Title = $('.security-props-title', canvas).val();
        securityInfo.Description = $('.security-props-description', canvas).val();
        
        nsGmx.widgets.notifications.startAction('securitySave');
        
        var postParams = {
            WrapStyle: 'window', 
            SecurityInfo: JSON.stringify(securityInfo.SecurityInfo),
            Title: securityInfo.Title,
            Description: securityInfo.Description
        };
        
        postParams[_this.propertyName] = securityInfo.ID;
        
        sendCrossDomainPostRequest(serverBase + _this.updateSecurityName, postParams, function(response) {
            if (!parseResponse(response)) {
                nsGmx.widgets.notifications.stopAction('securitySave');
                return;
            }
            
            nsGmx.widgets.notifications.stopAction('securitySave', 'success', _gtxt('Сохранено'));
        })
    });
    
    new SecurityOwnerWidget(securityInfo.SecurityInfo, $('.security-owner-placeholder', canvas));
    this.securityUserListWidget = new SecurityUserListWidget(securityInfo.SecurityInfo, $('.security-userlist-placeholder', canvas), {accessTypes: this.accessTypes});
    
    var resize = function()
    {
        var mapTableHeight;
        var dialogWidth = canvas.parentNode.parentNode.offsetWidth;
        
        var nonTableHeight = 
            $('.security-header', canvas).height() + 
            $('.security-props', canvas).height() + 
            $('.security-add-container', canvas).height() + 15;

        mapTableHeight = canvas.parentNode.offsetHeight - nonTableHeight - 10;
        
        _this.securityUserListWidget.updateHeight(mapTableHeight);
    }

    showDialog(_gtxt(this.dialogTitle, this.title), canvas, 571, 370, false, false, resize);
    
    resize();
}

nsGmx.mapSecurity = mapSecurity;
nsGmx.layerSecurity = layerSecurity;
nsGmx.multiLayerSecurity = multiLayerSecurity;
nsGmx.userGroupSecurity = userGroupSecurity;

})();