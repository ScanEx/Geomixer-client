var nsGmx = nsGmx || {};

(function() {

'use strict';

var SHARE_TYPES = ['public', 'private'];

nsGmx.Translations.addText('rus', {security: {
    ownerName: 'Владелец',
    defAccess: 'Доступ для всех',
    access: {
        empty: ' ',
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
    addOkText: 'Добавить',
    select: {
        'selectedLayers': 'Выделено слоев для назначения прав: '
    }
}});

nsGmx.Translations.addText('eng', {security: {
    ownerName: 'Owner',
    defAccess: 'Public access',
    access: {
        empty: ' ',
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
    addOkText: 'Add',
    select: {
        'selectedLayers': 'Selected'
    }
}});

var usersHash = {};

var autocompleteLabelTemplate = Handlebars.compile(
    '<a class="security-autocomplete-item">' +
    '{{#if showIcon}}<span class="{{#if IsGroup}}security-group-icon{{else}}security-user-icon{{/if}}"></span>{{/if}}' +
        '<span>{{Nickname}}{{#if Login}}\u00A0({{Login}}){{/if}}</span>' +
    '</a>'
);

//на input вешается autocomplete со списком пользователей.
//кроме того, по нажатию enter происходит генерация события enterpress
var wrapUserListInput = function(input, options) {
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
            security.findUsers(request.term, {maxRecords: 10, type: options && options.type}).then(function(userInfos) {
                cbResponse(userInfos.map(function(userInfo) {
                    usersHash[userInfo.Nickname] = userInfo;
                    return {value: userInfo.Nickname, label: ''};
                }));
            }, cbResponse.bind(null, []));
        }
    });

    $(input).data("ui-autocomplete")._renderItem = function(ul, item) {
        var userInfo = usersHash[item.value],
            templateParams = $.extend({showIcon: options && options.showIcon}, userInfo);
        return $('<li></li>')
            .append($(autocompleteLabelTemplate(templateParams)))
            .appendTo(ul);
    }
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

    wrapUserListInput(ownerAddInput, {type: 'User'});

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
            security.findUsers(name, {maxRecords: 1}).then(function(userInfos) {
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

// @param {String[]} options.accessTypes массив прав доступа
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
    wrapUserListInput(addInput, {showIcon: true});

    $('.security-add-ok', ui).click(function() {
        var input = $('.security-add-input', ui),
            name = input.val();

        var addedUsers = _this.securityUsersProvider.getOriginalItems();
        if (_.findWhere(addedUsers, {Nickname: name})) {
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
            security.findUsers(name, {maxRecords: 1}).then(function(userInfos) {
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
        '<td class="security-row-nickname">' +
            '<span class="{{#if IsGroup}}security-group-icon{{else}}security-user-icon{{/if}}"></span>' +
            '<span title="{{Nickname}}">{{Nickname}}</span>' +
        '</td>' +
        '<td><div class="security-row-fullname" title="{{Fullname}}">{{Fullname}}</div></td>' +
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
        Fullname: user[user.IsGroup ? 'Description' : 'FullName'],
        IsGroup: user.IsGroup,
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

var layersGroupSecurity = function()
{
    this.getSecurityName = "Map/GetSecurity.ashx";
    this.updateSecurityName = "Layer/LayersGroupUpdateSecurity";

    this.propertyName = "MapID";
    this.groupPropertyName = "Layers";
    this.dialogTitle = "Редактирование прав доступа слоев карты [value0]";

    this.accessTypes = ['no', 'view', 'edit'];
}

layersGroupSecurity.prototype = new security();
layersGroupSecurity.prototype.constructor = layersGroupSecurity;

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

    this.getSecurityFromServer(value).then(this.createSecurityDialog.bind(this));
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
security.prototype.saveCustomParams = function() {
    this._securityInfo.SecurityInfo.DefAccess = this._ui.find('.security-defaccess-select').val();
}

security.prototype._save = function() {
    var si = this._securityInfo;
    si.SecurityInfo.Users = this.securityUserListWidget.securityUsersProvider.getOriginalItems();

    nsGmx.widgets.notifications.startAction('securitySave');
    var postParams = {WrapStyle: 'window'};

    if (this.saveCustomParams()) {
        return;
    }

    postParams.SecurityInfo = JSON.stringify(si.SecurityInfo);
    postParams[this.propertyName] = this.propertyValue;

    if (this.groupPropertyName) {
        postParams[this.groupPropertyName] = this.propertyValue;
    } else {
        postParams[this.propertyName] = this.propertyValue;                         // имя слоя / группы
    }
    sendCrossDomainPostRequest(serverBase + this.updateSecurityName, postParams, function(response) {
        if (!parseResponse(response)) {
            nsGmx.widgets.notifications.stopAction('securitySave');
            return;
        }

        nsGmx.widgets.notifications.stopAction('securitySave', 'success', _gtxt('Сохранено'));

        $(this).trigger('savedone', si);
    })
}

security.prototype.createSecurityDialog = function(securityInfo, options)
{
    options = $.extend({showOwner: true}, options);
    var _this = this;

    this._securityInfo = securityInfo;

    var uiTemplate = '<div id="securityDialog" class="security-canvas">' +
        '<div class="security-header">' +
            '<button class="security-save">{{i "Сохранить"}}</button>' +
                '{{#if showOwner}}<div class="security-owner-placeholder"></div>{{/if}}' +
        '</div>' +

        '<div class="security-custom-ui"></div>' +

        '<div class="security-userlist-placeholder"></div>' +
    '</div>';

    var canvas = this._ui = $(Handlebars.compile(uiTemplate)({
        showOwner: options.showOwner
    }));

    this.addCustomUI(canvas, securityInfo);

    $('.security-save', canvas).click(function(){
        _this._save();
    });

    if (options.showOwner) {
        new SecurityOwnerWidget(securityInfo.SecurityInfo, $('.security-owner-placeholder', canvas));
    }

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

    this._dialogDiv = showDialog(_gtxt(this.dialogTitle, this.title), canvas[0], 571, 370, false, false, resize);

    resize();
}

//делает запрос на сервер и возвращает список пользователей по запросу query
//options = {maxRecords, type}; type: All / User / Group
security.findUsers = function(query, options) {
    var def = new L.gmx.Deferred();
    var maxRecordsParamStr = options && options.maxRecords ? '&maxRecords=' + options.maxRecords : '';
    var typeParamStr = '&type=' + (options && options.type || 'All');
    sendCrossDomainJSONRequest(serverBase + 'User/FindUser?query=' + encodeURIComponent(query) + maxRecordsParamStr + typeParamStr, function(response) {
        if (!parseResponse(response)) {
            def.reject(response);
            return;
        }

        def.resolve(response.Result);
    })

    return def;
}


// кастомный интерфейс - отдельная функция - дерево слоев для виджета группового редактирования слоев
layersGroupSecurity.prototype.createSecurityDialog = function(securityInfo, options)
{
    var groupLayers = [];
    var _this = this;
    options = $.extend({showOwner: true}, options);
    this._securityInfo = securityInfo;

    var uiTemplate = '<div id="securityDialog" class="security-canvas">' +
        '<div class="security-header">' +
            '<button class="security-save">{{i "Сохранить"}}</button>' +
                '{{#if showOwner}}<div class="security-owner-placeholder"></div>{{/if}}' +
        '</div>' +
        '<div class="security-custom-ui"></div>' +
        '<div class="security-counter"></div>' +
        '<div class="security-default-access"></div>' +

        '<div class="security-userlist-placeholder"></div>' +

    '</div>';

    var canvas = this._ui = $(Handlebars.compile(uiTemplate)({
        showOwner: options.showOwner
    }));

    this.addCustomUI(canvas, securityInfo, groupLayers, canvas, resize);

    // кастомная функция для манипуляции securityInfo, если есть выделенные слои
    if (this.groupPropertyName) {
        this.propertyValue = groupLayers.map(function(item){
            return item.ID;
        });
    }

    $('.security-save', canvas).click(function(){                               // обработчик кнопки "Сохранить" в данном контексте
        _this._save();
    });

    $('.security-save', canvas).mouseenter(function(){
        if (_this.groupPropertyName) {
            _this.propertyValue = groupLayers.map(function(item){
                return item.ID;
            });
        }
    });

    if (options.showOwner) {
        new SecurityOwnerWidget(securityInfo.SecurityInfo, $('.security-owner-placeholder', canvas));
    }

    this._dialogDiv = showDialog(_gtxt(this.dialogTitle, this.title), canvas[0], 571, 370, false, false, resize);
    function resize()
    {
        var mapTableHeight;
        var dialogWidth = canvas[0].parentNode.parentNode.offsetWidth;
        var nonTableHeight =
            $('.security-header', canvas).height() +
            $('.security-custom-ui', canvas).height() +
            $('.security-counter', canvas).height() +
            $('.security-default-access', canvas).height() +
            $('.security-add-container', canvas).height() + 25;

        mapTableHeight = canvas[0].parentNode.offsetHeight - nonTableHeight - 10;
        if (_this.securityUserListWidget) {
            _this.securityUserListWidget.updateHeight(mapTableHeight);
        }
    }

    resize();
}

// кастомный интерфейс - отдельная функция - дерево слоев для виджета группового редактирования слоев
layersGroupSecurity.prototype.addCustomUI = function(ui, securityInfo, groupLayers, canvas, resizeFunc) {
    var _this = this,
        counter = 0,
        actualCounter = {counter: counter},
        countDiv = $('.security-counter', canvas),
        countTemplate = Handlebars.compile(
            '<table class="security-count-table">' +
                '<tbody>' +
                    '<tr>' +
                        '<td>{{i "security.select.selectedLayers"}}</td>' +
                        '<td>{{counter}}</td>' +
                    '</tr>' +
                '</tbody>' +
            '</table>'
        ),
        templateSecurityInfo = {
            Users: []
        },
        tree,
        rawTree,
        drawnTree,
        defAccessDiv = $('.security-default-access', canvas),
        defAccessTemplate = Handlebars.compile(
            '<div class="security-def-access">{{i "security.defAccess"}}: ' +
                '<select class="security-defaccess-select selectStyle">' +
                    '{{#defAccessTypes}}' +
                        '<option value="{{value}}"{{#isSelected}} selected{{/isSelected}}>{{title}}</option>' +
                    '{{/defAccessTypes}}' +
                '</select>' +
            '</div>'
        ),
        userList = $('.security-userlist-placeholder', canvas);

    // модификация исходного дерева - остаются только слои с правами на редактирование
    rawTree = window._layersTree.treeModel.cloneRawTree(function(node) {
        var props = node.content.properties;
        props.visible = false;
        if (node.type === 'layer') {
            if (props.Access !== 'edit') {
                return null;
            }
            return node;
        }
        if (node.type === 'group') {
            var children = node.content.children;
            if (!children.length) {
                return null;
            }
            return node;
        }
    });

    // создание дерева слоев
    tree = new layersTree({
        showVisibilityCheckbox: true,
        allowActive: true,
        allowDblClick: false,
        showStyle: false,
        visibilityFunc: function(props, isVisible) {
            if (isVisible) {
                counter++;

                //    обработка различных вариаций прав в группе слоев
                //   если выделен один слой, рисуются его права
                //   если у выделенных слоев одинаковые права, рисуются одни права на всех
                //   если у выделенных слоев разные права, рисуется пустой диалог
                //   если у выделенных слоев разные права, в выпадающий список выбора дефолтных прав проставляется пустое поле

                // обрабатывает ответ с сервера c правами слоев

                if (props.MultiLayerID) {
                    var securityDialog = new nsGmx.multiLayerSecurity();
                    securityDialog.getSecurityFromServer(props.MultiLayerID).then(handleResponse);
                } else {
                    var securityDialog = new nsGmx.layerSecurity(props.type);
                    securityDialog.getSecurityFromServer(props.LayerID).then(handleResponse);
                }

            }

            if (!isVisible) {
                counter--;
                for (var i = 0; i < groupLayers.length; i++) {
                    if (groupLayers[i].ID === props.LayerID || groupLayers[i].ID === props.MultiLayerID) {
                        groupLayers.splice(i, 1);
                    }
                }

                if (counter > 0 && groupLayers.length) {
                    drawAccess();
                } else {
                    $(defAccessDiv).empty();
                    userList.empty();
                }
            }

            function handleResponse(res) {
                var users = res.SecurityInfo.Users;
                res.type = props.type;

                groupLayers.push(res);
                drawAccess();
                resizeFunc();
            }
            
            // рисует оба виджета - доступа по умолчанию и списка пользователей для каждого слоя
            function drawAccess() {
                drawDefaultAccess(groupLayers, defAccessDiv, checkSameDefaultAccess);
                drawUsersList(groupLayers, userList, checkSameUsersAccess);
            }

            // рисует доступ по умолчанию
            function drawDefaultAccess(array, container, filterFunction) {
                var accessTypes;
                if (checkSameLayersType(array)) {
                    accessTypes = array[0].type === 'Raster' ? ['no', 'preview', 'view', 'edit'] : ['no', 'preview', 'view', 'editrows', 'edit'];
                } else {
                    accessTypes = ['no', 'preview', 'view', 'edit'];
                }

                var defTemplateJSON = {
                    defAccessTypes: accessTypes.map(function(type) {
                        return {
                            value: type,
                            title: _gtxt('security.access.' + type),
                            isSelected: undefined
                        };
                    })
                };

                $(container).empty();

                // протавляем значение в выпадающем списке прав по умолчанию
                if (filterFunction(array)) {
                    var types = defTemplateJSON.defAccessTypes;
                    for (var i = 0; i < types.length; i++) {
                        if (types[i].value === array[0].SecurityInfo.DefAccess) {
                            types[i].isSelected = true;
                        }
                    }
                    $(defAccessTemplate(defTemplateJSON)).appendTo(ui.find('.security-default-access'));
                } else {
                    accessTypes.unshift('empty');
                    defTemplateJSON = {
                        defAccessTypes: accessTypes.map(function(type) {
                            return {
                                value: type,
                                title: _gtxt('security.access.' + type),
                                isSelected: type === 'empty'
                            };
                        })
                    };

                    $(defAccessTemplate(defTemplateJSON)).appendTo(ui.find('.security-default-access'));
                }
            }

            // рисует список пользователей для каждого слоя
            function drawUsersList(array, container, filterFunction) {
                container.empty();
                if (filterFunction(array)) {
                    _this.securityUserListWidget = new SecurityUserListWidget(array[0].SecurityInfo, container, {accessTypes: _this.accessTypes});
                } else {
                    _this.securityUserListWidget = new SecurityUserListWidget(templateSecurityInfo, container, {accessTypes: _this.accessTypes});
                }
            }

            // проверяет, совпадают ли права по умолчанию для всех выделенных слоев
            function checkSameDefaultAccess(array) {
                var first = array[0].SecurityInfo.DefAccess;
                return array.every(function(element) {
                    return element.SecurityInfo.DefAccess === first;
                });
            }

            // проверяет, совпадают ли отдельные права для всех выделенных слоев
            function checkSameUsersAccess(array) {
                var first = array[0].SecurityInfo.Users;
                return array.every(function(element) {
                    return _.isEqual(element.SecurityInfo.Users, first);
                });
            }

            // проверяет, совпадают ли типы для всех выделенных слоев (вектор/растр)
            function checkSameLayersType(array) {
                var first = array[0].type;
                return array.every(function(element) {
                    return element.type === first;
                });
            }

            // показываем счетчик выделенных слоев под деревом
            actualCounter = {counter: counter},
            $(countDiv).html(countTemplate(actualCounter));
            resizeFunc();
        }
    });
    drawnTree = tree.drawTree(rawTree, 2);

    $(drawnTree).treeview().    appendTo(ui.find('.security-custom-ui'));
    $(countDiv).html(countTemplate(actualCounter));

}

nsGmx.mapSecurity = mapSecurity;
nsGmx.security = security;
nsGmx.layerSecurity = layerSecurity;
nsGmx.multiLayerSecurity = multiLayerSecurity;
nsGmx.layersGroupSecurity = layersGroupSecurity;


})();
