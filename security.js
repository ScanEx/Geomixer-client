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

SecurityUserListWidget.prototype.updateHeight = function(height) {
    this._securityTable.updateHeight(height);
}

SecurityUserListWidget._userRowTemplate = Handlebars.compile(
    '<tr>' +
        '<td><div class="security-row-nickname">{{Nickname}}</div></td>' +
        '<td><div class="security-row-fullname">{{Fullname}}</div></td>' +
        '<td><select class="selectStyle security-row-access">{{#access}}' +
            '<option value = "{{value}}"{{#if selected}} selected{{/if}}>{{title}}</option>' +
        '{{/access}}</select></td>' +
        '<td class="security-row-remove-cell"><div class="gmx-icon-recycle"></div></td>' +
    '</tr>'
);

SecurityUserListWidget._drawMapUsers = function(user, securityScope)
{
    var ui = $(SecurityUserListWidget._userRowTemplate({
        Nickname: user.Nickname,
        Fullname: user.FullName,
        access: securityScope.options.accessTypes
            .filter(function(type) {return type !== 'no';})
            .map(function(type) {
                return {
                    title: _gtxt('security.access.' + type),
                    value: type,
                    selected: type === user.Access
                }
            })
    }));
    
    var tr = ui[0];
    
    ui.find('.gmx-icon-recycle').click(function() {
        // уберем пользователя из списка
        securityScope.securityUsersProvider.filterOriginalItems(function(elem) {
            return elem.Nickname !== user.Nickname;
        });
    });
    
    ui.find('.security-row-access').change(function() {
        user.Access = this.value;
    });
    
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

var layerSecurity = function(layerType)
{
    this.getSecurityName = "Layer/GetSecurity.ashx";
    this.updateSecurityName = "Layer/UpdateSecurity.ashx";
    
    this.propertyName = "LayerID";
    this.dialogTitle = "Редактирование прав доступа слоя [value0]";
    
    this.accessTypes = layerType === 'Raster' ? ['no', 'preview', 'view', 'edit'] : ['no', 'preview', 'view', 'editrows', 'edit'];
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

//ф-ция выделена из-за различий между диалогами прав слоёв и диалога состава группы
security.prototype.addCustomUI = function(ui, securityInfo) {
    var defAccessTemplate = Handlebars.compile(
        '<div class="security-def-access">{{i "security.defAccess"}}: ' +
            '<select class="security-defaccess-select selectStyle">' +
                '{{#defAccessTypes}}' +
                    '<option value="{{value}}"{{#isSelected}} selected{{/isSelected}}>{{title}}</option>' +
                '{{/defAccessTypes}}' +
            '</select>' +
        '</div>'
    );
    
    $(defAccessTemplate({
        defAccessTypes: this.accessTypes.map(function(type) {
            return {
                value: type, 
                title: _gtxt('security.access.' + type), 
                isSelected: type === securityInfo.SecurityInfo.DefAccess
            };
        })
    })).appendTo(ui.find('.security-custom-ui'));
}

//ф-ция выделена из-за различий между диалогами прав слоёв и диалога состава группы
security.prototype.saveCustomParams = function(securityInfo, postParams, ui) {
    securityInfo.SecurityInfo.DefAccess = ui.find('.security-defaccess-select').val();
}

security.prototype.createMapSecurityDialog = function(securityInfo)
{
    var _this = this;

    var uiTemplate = '<div id="securityDialog" class="security-canvas">' +
        '<div class="security-header">' + 
            '<button class="security-save">{{i Сохранить}}</button>' +
            '<div class="security-owner-placeholder"></div>' +
        '</div>' +
        
        '<div class="security-custom-ui"></div>' +
        
        '<div class="security-userlist-placeholder"></div>' +
    '</div>';
    
    var canvas = $(Mustache.render(uiTemplate));
    
    this.addCustomUI(canvas, securityInfo);

    $('.security-save', canvas).click(function(){
        securityInfo.SecurityInfo.Users = _this.securityUserListWidget.securityUsersProvider.getOriginalItems();
        
        nsGmx.widgets.notifications.startAction('securitySave');
        var postParams = {WrapStyle: 'window'};
        
        _this.saveCustomParams(securityInfo, postParams, canvas);
        
        postParams.SecurityInfo = JSON.stringify(securityInfo.SecurityInfo);
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
        var dialogWidth = canvas[0].parentNode.parentNode.offsetWidth;
        
        var nonTableHeight = 
            $('.security-header', canvas).height() + 
            $('.security-custom-ui', canvas).height() + 
            $('.security-add-container', canvas).height() + 15;

        mapTableHeight = canvas[0].parentNode.offsetHeight - nonTableHeight - 10;
        
        _this.securityUserListWidget.updateHeight(mapTableHeight);
    }

    showDialog(_gtxt(this.dialogTitle, this.title), canvas[0], 571, 370, false, false, resize);
    
    resize();
}

nsGmx.mapSecurity = mapSecurity;
nsGmx.security = security;
nsGmx.layerSecurity = layerSecurity;
nsGmx.multiLayerSecurity = multiLayerSecurity;

})();