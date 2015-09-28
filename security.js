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

var removeMapUser = function(user, dataProvider)
{
    dataProvider.filterOriginalItems(function(elem)
    {
        return elem.Nickname !== user.Nickname;
    });
}

var security = function()
{
    this.mapTypeSel = null;
    this.mapAccessSel = null;
    
    this.defaultAccess = null;
    
    this.getSecurityName = null;
    this.updateSecurityName = null;
    this.getUserSecurityName = null;
    
    this.propertyValue = null;
    this.title = null;
    
    this._securityTable = new nsGmx.ScrollTable({limit: 500, showFooter: false});
    this._securityUsersProvider = new nsGmx.ScrollTable.StaticDataProvider();
}

var mapSecurity = function()
{
    this.getSecurityName = "Map/GetSecurity.ashx";
    this.updateSecurityName = "Map/UpdateSecurity.ashx";
    this.getUserSecurityName = "Map/GetUserSecurity.ashx";
    
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
    this.getUserSecurityName = "Layer/GetUserSecurity.ashx";
    
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
    this.getUserSecurityName = "MultiLayer/GetUserSecurity.ashx";
    
    this.propertyName = "MultiLayerID";
    this.dialogTitle = "Редактирование прав доступа слоя [value0]";
    
    this.accessTypes = ['no', 'view', 'edit'];
}

multiLayerSecurity.prototype = new security();
multiLayerSecurity.prototype.constructor = multiLayerSecurity;

security.prototype.getRights = function(value, title)
{
    var _this = this;
    
    this.propertyValue = value;
    this.title = title;
    
    sendCrossDomainJSONRequest(serverBase + this.getSecurityName + "?WrapStyle=func&IncludeAdmin=true&" + this.propertyName + "=" + this.propertyValue, function(response)
    {
        if (!parseResponse(response))
            return;
        
        _this.createMapSecurityDialog(response.Result)
    })
}

security.prototype.createMapSecurityDialog = function(securityInfo)
{
    var genSortFunction = function(field)
    {
        return [
            function(a,b){if (a[field] > b[field]) return 1; else if (a[field] < b[field]) return -1; else return 0},
            function(a,b){if (a[field] < b[field]) return 1; else if (a[field] > b[field]) return -1; else return 0}
        ];
    }
            
    var isShowFullname    = nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_USER_FULLNAME);
    
    $$('securityDialog') && removeDialog($$('securityDialog').parentNode.parentNode);

    var _this = this;

    var uiTemplate = '<div id="securityDialog" class="security-canvas">' +
        '<div class="security-header">' + 
            '<table class="security-header-table"><tr>' +
                '<td>' +
                    '<span>{{i security.ownerName}}: </span>' +
                '</td><td class="security-owner-cell">' +
                    '<span class="buttonLink changeOwnerLink security-owner-change">{{ownerName}}</span>' +
                    '<div class="security-owner-container ui-front" style="display:none">' +
                        '<input class="security-owner-input inputStyle">' +
                        '<button class="security-owner-ok">Сменить</button>' +
                        '<button class="security-owner-cancel">Отмена</button>' +
                    '</div>' +
                '</td><td>' +
                    '<button class="security-save">{{i Сохранить}}</button>' +
                '</td>' +
            '</tr></table>' + 
            '<div>{{i security.defAccess}}: ' +
                '<select class="security-defaccess-select selectStyle">' +
                    '{{#defAccessTypes}}' +
                        '<option value="{{value}}"{{#isSelected}} selected{{/isSelected}}>{{title}}</option>' +
                    '{{/defAccessTypes}}' +
                '</select>' +
            '</div>' + 
        '</div>' +
        '<div class="security-add-container ui-front">' +
            '<span class="security-access-label">{{i security.addHeaderLabel}}</span>' +
            '<input class="security-add-input inputStyle">' +
            '<button class="security-add-ok">{{i security.addOkText}}</button>' +
        '</div>' +
        '<div class="access-table-placeholder"></div>' +
    '</div>';
    
    var canvas = $(Mustache.render(uiTemplate, {
        ownerName: securityInfo.SecurityInfo.Owner,
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
    
    this.defaultAccess = 'view';
    
    $('.security-save', canvas).click(function(){
        securityInfo.SecurityInfo.Users = _this._securityUsersProvider.getOriginalItems();
        
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
    })
    
    $('.security-owner-cancel', canvas).click(function() {
        $('.changeOwnerLink', canvas).click();
    });
    
    $('.changeOwnerLink', canvas).click(function() {
        $(this).toggle();
        $('.security-owner-container', canvas).toggle();
        $('.security-owner-input', canvas).val('').focus();
    });
    
    var ownerAddInput = $('.security-owner-input', canvas);
    ownerAddInput.on('enterpress', function() {
        $('.security-owner-ok', canvas).click();
    });
    
    wrapUserListInput(ownerAddInput);
    
    $('.security-owner-ok', canvas).click(function() {
        var input = $('.security-owner-input', canvas),
            name = input.val();
            
        var doChangeUser = function(user) {
            $('.changeOwnerLink', canvas).text(user.Nickname);
            securityInfo.SecurityInfo.NewOwnerID = user.UserID;
            $('.changeOwnerLink', canvas).click();
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

    var sortFuncs = {};

    sortFuncs[_gtxt('Псевдоним')]  = genSortFunction('Nickname');
    sortFuncs[_gtxt('Полное имя')] = genSortFunction('FullName');
    sortFuncs[_gtxt('Доступ')]     = genSortFunction('Access');
    
    $('.security-add-ok', canvas).click(function() {
        var input = $('.security-add-input', canvas),
            name = input.val();
        
        var addedUsers = _this._securityUsersProvider.getOriginalItems();
        if (nsGmx._.findWhere(addedUsers, {Nickname: name})) {
            inputError(input[0]);
            return;
        }
        
        var doAddUser = function(user) {
            _this._addMapUser(user, _this._securityUsersProvider);
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

    var fieldNames   = [_gtxt("Псевдоним"), _gtxt("Полное имя"), /*_gtxt("Роль"),*/ _gtxt("Доступ"), ""];
    var fieldWidthes = ['35%', '35%', '25%','5%'];

    this._securityUsersProvider.setSortFunctions(sortFuncs);
    this._securityTable.setDataProvider(this._securityUsersProvider);
    this._securityTable.createTable($('.access-table-placeholder', canvas)[0], 'securityTable', 0, fieldNames, fieldWidthes, function(arg)
    {
        return _this._drawMapUsers.call(this, arg, _this);
    }, sortFuncs);

    var resize = function()
    {
        var mapTableHeight;
        var dialogWidth = canvas.parentNode.parentNode.offsetWidth;
        
        var nonTableHeight = 
            $('.security-header', canvas).height() + 
            $('.security-add-container', canvas).height() + 15;

        mapTableHeight = canvas.parentNode.offsetHeight - nonTableHeight - 10;
        
        _this._securityTable.updateHeight(mapTableHeight);
    }

    showDialog(_gtxt(this.dialogTitle, this.title), canvas, isShowFullname ? 670 : 571, 370, false, false, resize);
    
    var addInput = $('.security-add-input', canvas);
    addInput.on('enterpress', function() {
        $('.security-add-ok', canvas).click();
    })
    wrapUserListInput(addInput);
    
    resize();

    this._securityUsersProvider.setOriginalItems( securityInfo.SecurityInfo.Users );
}

security.prototype._drawMapUsers = function(user, securityScope)
{
    var remove = makeImageButton('img/recycle.png', 'img/recycle_a.png'),
        tdRemove = user.Login == nsGmx.AuthManager.getLogin() ? _td() : _td([remove], [['css', 'textAlign', 'center']]),
        accessSel = nsGmx.Utils._select(null, [['dir','className','selectStyle'],['css','width','130px']]),
        isShowFullname = nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_USER_FULLNAME),
        tr;
    
    var accessList = securityScope.accessTypes;
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
        removeMapUser(user, securityScope._securityUsersProvider);
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

security.prototype._addMapUser = function(user, dataProvider)
{
    var existedUser = $.extend( {Access: this.defaultAccess}, user );
    
    dataProvider.addOriginalItem(existedUser);
}

nsGmx.mapSecurity = mapSecurity;
nsGmx.layerSecurity = layerSecurity;
nsGmx.multiLayerSecurity = multiLayerSecurity;

})();