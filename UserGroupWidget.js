(function() {

'use strict';

nsGmx.Translations.addText('rus', {uglw: {
    headerTitle: 'Фильтр',
    listheader: {
        title: 'Название',
        description: 'Описание'
    },
    groupProps: {
        title: 'Название',
        description: 'Описание'
    },
    popover: {
        title: 'Удалить группу',
        ok: 'Ok',
        cancel: 'Отмена'
    },
    shareLabel: 'Права на ресурсы внутри группы:',
    share: {
        'public': 'общие',
        'private': 'раздельные'
    }
}});

nsGmx.Translations.addText('eng', {uglw: {
    headerTitle: 'Filter',
    listheader: {
        title: 'Title',
        description: 'Description'
    },
    groupProps: {
        title: 'Title',
        description: 'Description'
    },
    popover: {
        title: 'Delete group',
        ok: 'Ok',
        cancel: 'Cancel'
    },
    shareLabel: 'Sharing resources among members:',
    share: {
        'public': 'selectively',
        'private': 'by default'
    }
}});

var Group = Backbone.Model.extend({
    idAttribute: 'UserID'
});

var GroupList = Backbone.Collection.extend({
    model: Group
});

var GroupListView = Backbone.View.extend({
    template: Handlebars.compile(
        '<table class="uglw-table">' +
            '<thead class="tableHeader">' +
                '<th class="uglw-table-title">{{i "uglw.listheader.title"}}</th>' +
                '<th class="uglw-table-descr">{{i "uglw.listheader.description"}}</th>' +
                '<th></th>' +
            '</thead><tbody class="tableBody">' +
            '{{#users}}' +
            '<tr class="uglw-row">' +
                '<td><span class="uglw-group-name" data-groupid="{{UserID}}">{{Nickname}}</span></td>' +
                '<td>{{Description}}</td>' +
                '<td><div class="gmx-icon-recycle" data-groupid="{{UserID}}"></div></td>' +
            '</tr>' +
        '{{/users}}</tbody></table>'
    ),
    initialize: function() {
        this.listenTo(this.model, 'reset', this.render);
    },
    render: function() {
        var _this = this;
        var rawAttributes = this.model.map(function(user) {
            return user.attributes;
        });

        this.$el.empty().append($(this.template({users: rawAttributes})));

        this.$el.find('.uglw-group-name').click(function() {
            var groupID = Number($(this).data('groupid'));

            var groupSecurity = new UserGroupSecurity();

            $(groupSecurity).on('savedone', function() {
                _this.trigger('needupdate');
            });

            groupSecurity.propertyValue = groupID;
            groupSecurity.title = _this.model.get(groupID).get('Nickname');
            groupSecurity.getSecurityFromServer(groupID).then(function(res) {
                groupSecurity.createSecurityDialog(res);
                $(groupSecurity._dialogDiv).find('.security-props-title').focus();
            })

        });

        var popoverUI = $(Handlebars.compile('<div>' +
            '<div>{{i "uglw.popover.title"}}?</div>' +
            '<div class="uglw-popover-buttons">' +
                '<button class="uglw-popover-ok">{{i "uglw.popover.ok"}}</button>' +
                '<button class="uglw-popover-cancel">{{i "uglw.popover.cancel"}}</button>' +
            '</div>' +
        '</div>')());

        popoverUI.find('.uglw-popover-ok').click(function() {
            sendCrossDomainJSONRequest(serverBase + 'User/DeleteGroup?GroupID=' + _this._popoverGroupID, function(response) {
                if (!parseResponse(response)) {
                    return;
                };

                _this.trigger('needupdate');
                _this.$el.find('.gmx-icon-recycle').popover('hide');
            });
        });

        popoverUI.find('.uglw-popover-cancel').click(function() {
            _this.$el.find('.gmx-icon-recycle').popover('hide');
        });

        this.$el.find('.gmx-icon-recycle').click(function() {
            var groupID = Number($(this).data('groupid'));
            _this._popoverGroupID = groupID;
        }).popover({
            content: popoverUI[0],
            placement: 'left',
            html: true
        }).on('shown.bs.popover', function(event) {
            _this.$el.find('.gmx-icon-recycle').each(function(i, icon) {
                if (icon !== event.target) {
                    $(icon).popover('hide');
                }
            })
        });
    }
});

nsGmx.UserGroupListWidget = function(container) {
    var ui = $(nsGmx.UserGroupListWidget._mainTemplate()).appendTo(container);

    var groupList = new GroupList();

    var listView = new GroupListView({
        el: ui.find('.uglw-list-placeholder')[0],
        model: groupList
    });

    var refilterUsers = function() {
        nsGmx.security.findUsers(ui.find('.uglw-filter-input').val(), {type: 'Group'}).then(function(users) {
            groupList.reset(users);
        })
    }

    listView.on('needupdate', refilterUsers);

    var lastValue = null;
    ui.find('.uglw-filter-input').on('keyup change', function(){
        if (lastValue !== this.value) {
            lastValue = this.value;
            refilterUsers();
        }
    });

    ui.find('.uglw-filter-input').change();

    ui.find('.uglw-add-icon').click(function() {
        var groupSecurity = new UserGroupSecurity();

        groupSecurity._save = function() {
            var _this = this,
                si = this._securityInfo.SecurityInfo;

            if (this.saveCustomParams()) {
                return;
            }

            var membersJson = si.Users.map(function(user) {
                return {
                    Access: user.Access,
                    UserID: user.UserID
                }
            });

            sendCrossDomainPostRequest(serverBase + 'User/CreateGroup', {
                    WrapStyle: 'message',
                    Nickname: si.Nickname,
                    Description: si.Description,
                    MembersJson: JSON.stringify(membersJson),
                }, function(response) {
                    if (!parseResponse(response)) {
                        return;
                    }

                    $(groupSecurity._dialogDiv).dialog('close');
                    refilterUsers();
                }
            )
        }

        groupSecurity.createSecurityDialog({
            SecurityInfo: {
                Users: []
            }
        }, {showOwner: false});

        $(groupSecurity._dialogDiv).find('.security-props-title').focus();
    });
}

nsGmx.UserGroupListWidget._mainTemplate = Handlebars.compile('<div>' +
    '<div class="uglw-header">' +
        '{{i "uglw.headerTitle"}} <input class="uglw-filter-input inputStyle">' +
        '<div class="uglw-add-icon" title="Добавить группу"></div>' +
    '</div>' +
    '<div class="uglw-list-placeholder"></div>' +
'</div>');

var UserGroupSecurity = function()
{
    this.getSecurityName = "User/GetUserGroupSecurity";
    this.updateSecurityName = "User/UpdateUserGroupSecurity";

    this.propertyName = "UserID";
    this.dialogTitle = "Состав группы [value0]";

    this.accessTypes = ['no', 'view', 'edit'];
}

UserGroupSecurity.prototype = new nsGmx.security();
UserGroupSecurity.prototype.constructor = UserGroupSecurity;

UserGroupSecurity.prototype.saveCustomParams = function() {
    var nicknameInput = this._ui.find('.security-props-title'),
        nickname = nicknameInput.val();

    if (nickname) {
        this._securityInfo.SecurityInfo.Nickname = nickname;
        this._securityInfo.SecurityInfo.Description = this._ui.find('.security-props-description').val();
    } else {
        inputError(nicknameInput[0]);
        return true;
    }

    var publicCheckbox = this._ui.find('#publicRights')[0];

    this._securityInfo.SecurityInfo.SharedResources = publicCheckbox.checked;
}

UserGroupSecurity.prototype.addCustomUI = function(ui, securityInfo) {
    var propsTemplate = Handlebars.compile(
        '<table class="security-props">' +
            '<tr><td>{{i "uglw.groupProps.title"}}:</td><td><input class="security-props-title inputStyle" value="{{Nickname}}"></td></tr>' +
            '<tr><td>{{i "uglw.groupProps.description"}}:</td><td><input class="security-props-description inputStyle" value="{{Description}}"></td></tr>' +
        '</table>' +
        '<div class="security-policy-control">' +
            '<span class="security-policy-label">{{i "uglw.shareLabel"}}</span>' +
            '<span class="security-policy-radiogroup">' +
                '<input id="privateRights" class="policy-checkbox" type="radio" name="groupEditingPolicy" {{#unless SharedResources}} checked {{/unless}}/>' +
                '<label class="security-policy-label" for="privateRights">{{i "uglw.share.private"}}</label>' +
                '<input id="publicRights" class="policy-checkbox" type="radio" name="groupEditingPolicy" {{#if SharedResources}} checked {{/if}}/>' +
                '<label class="security-policy-label" for="publicRights">{{i "uglw.share.public"}}</label>' +
            '</span>' +
        '</div>'
    );

    $(propsTemplate({
        Nickname: securityInfo.Nickname,
        Description: securityInfo.Description,
        SharedResources: securityInfo.SharedResources
    })).appendTo(ui.find('.security-custom-ui'));
}

gmxCore.addModule('UserGroupWidget', {
        UserGroupListWidget: nsGmx.UserGroupListWidget
    }, {
        css: 'css/UserGroupWidget.css'
    }
);

})();
