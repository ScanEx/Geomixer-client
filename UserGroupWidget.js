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
    }
}});

var Group = Backbone.Model.extend({});

var GroupList = Backbone.Collection.extend({
    model: Group
});

//делает запрос на сервер и возвращает список пользователей по запросу query
//options = {maxRecords, type}; type: All / User / Group
var findUsers = function(query, options) {
    var def = new L.gmx.Deferred();
    var maxRecordsParamStr = options && options.maxRecords ? '&maxRecords=' + maxRecords : '';
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
        var rawAttributes = this.model.map(function(user) {
            return user.attributes;
        });
        
        this.$el.empty().append($(this.template({users: rawAttributes})));
        this.$el.find('.uglw-group-name').click(function() {
            var groupID = Number($(this).data('groupid'));
            ShowUserGroupDialog(groupID);
        })
        
        this.$el.find('.gmx-icon-recycle').click(function() {
            var groupID = Number($(this).data('groupid'));
            console.log('remove', groupID);
        })
    }
});
    
nsGmx.UserGroupListWidget = function(container) {
    var ui = $(nsGmx.UserGroupListWidget._mainTemplate()).appendTo(container);
    
    var groupList = new GroupList();
    
    var listView = new GroupListView({
        el: ui.find('.uglw-list-placeholder')[0],
        model: groupList
    });
    
    var lastValue = null;
    ui.find('.uglw-filter-input').on('keyup change', function(){
        if (lastValue !== this.value) {
            lastValue = this.value;
            findUsers(this.value, {type: 'Group'}).then(function(users) {
                groupList.reset(users);
            })
        }
    });
    
    ui.find('.uglw-filter-input').change();
    
    ui.find('.uglw-add-icon').click(function() {
        ShowUserGroupDialog();
    });
}

nsGmx.UserGroupListWidget._mainTemplate = Handlebars.compile('<div>' +
    '<div class="uglw-header">' +
        '{{i "uglw.headerTitle"}} <input class="uglw-filter-input inputStyle">' +
        '<div class="uglw-add-icon security-add-icon" title="Добавить группу"></div>' +
    '</div>' +
    '<div class="uglw-list-placeholder"></div>' +
'</div>');

var ShowUserGroupDialog = function(groupID) {
    
    var doShow = function(groupInfo) {
        if (groupID) {
            var groupSecurity = new UserGroupSecurity();
            groupSecurity.propertyValue = groupID;
            groupSecurity.getSecurityFromServer(groupID).then(function(res) {
                groupSecurity.createMapSecurityDialog(res);
            })
        } else {

        }
    }
    
    if (groupID) {
        sendCrossDomainJSONRequest(serverBase + 'User/GroupInfo?groupID=' + groupID, function(response) {
            if (!parseResponse(response)) {
                return;
            }
            
            var container = $('<div/>');
            
            doShow(response.Result);
        })
    } else {
        doShow();
    }
}

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

UserGroupSecurity.prototype.saveCustomParams = function(securityInfo, postParams, ui) {
    postParams.Nickname = ui.find('.security-props-title').val();
    postParams.Description = ui.find('.security-props-description').val();
}

UserGroupSecurity.prototype.addCustomUI = function(ui, securityInfo) {
    var propsTemplate = Handlebars.compile(
        '<div class="security-props">' +
            '<div><span>{{i "uglw.groupProps.title"}}</span><input class="security-props-title inputStyle" value="{{Nickname}}"></div>' +
            '<div><span>{{i "uglw.groupProps.description"}}</span><input class="security-props-description inputStyle" value="{{Description}}"></div>' +
        '</div>'
    );

    $(propsTemplate({
        Nickname: securityInfo.Nickname,
        Description: securityInfo.Description
    })).appendTo(ui.find('.security-custom-ui'));
}

gmxCore.addModule('UserGroupWidget', {
        UserGroupListWidget: nsGmx.UserGroupListWidget
    }, {
        css: 'css/UserGroupWidget.css'
    }
);

})();