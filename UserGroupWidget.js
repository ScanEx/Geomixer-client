(function() {

'use strict';

nsGmx.Translations.addText('rus', {uglw: {
    headerTitle: 'Фильтр',
    listhead: {
        title: 'Название',
        description: 'Описание'
    }
}});

nsGmx.Translations.addText('eng', {uglw: {
    headerTitle: 'Filter',
    listhead: {
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
                '<th class="uglw-table-title">{{i "uglw.listhead.title"}}</th>' +
                '<th class="uglw-table-descr">{{i "uglw.listhead.description"}}</th>' +
                '<th></th>' +
            '</thead><tbody class="tableBody">' +
            '{{#users}}' +
            '<tr class="uglw-row">' +
                '<td><span class="uglw-group-name" data-groupid="{{UserID}}">{{Title}}</span></td>' +
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
        // var container = $('<div/>');
        // var userGroupWidget = new nsGmx.UserGroupWidget(container, groupInfo);
        // container.dialog();
        
        if (groupID) {
            var groupSecurity = new nsGmx.userGroupSecurity();
            groupSecurity.getSecurityFromServer(groupID).then(function(res) {
                groupSecurity.createGroupSecurityDialog(res);
            })
        } else {
            // groupSecurity.createGroupSecurityDialog({SecurityInfo: {}});
        }
        // groupSecurity.getRights(groupID, groupInfo.Title);
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


var UserList = Backbone.Model.extend({});
var UserListView = Backbone.View.extend({
    template: Handlebars.compile(
        '<table class="uglw-table">' +
            '<thead class="tableHeader">' +
                '<th class="uglw-table-title">{{i "ugw.listhead.nickname"}}</th>' +
                '<th class="uglw-table-descr">{{i "ugw.listhead.fullname"}}</th>' +
                '<th class="uglw-table-descr">{{i "ugw.listhead.fullname"}}</th>' +
                '<th></th>' +
            '</thead><tbody class="tableBody">' +
            '{{#users}}' +
            '<tr class="uglw-row">' +
                '<td><span class="uglw-group-name" data-groupid="{{UserID}}">{{Title}}</span></td>' +
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


/*nsGmx.UserGroupWidget = function(container, groupInfo) {
    this._groupInfo = groupInfo;
    this._ui = $(nsGmx.UserGroupWidget._mainTemplate(groupInfo)).appendTo(container);
}

nsGmx.UserGroupWidget.prototype = {
    getGroupInfo: function() {
        return {
            
        }
    }
}

nsGmx.UserGroupWidget._mainTemplate = Handlebars.compile('<div>' +
    '<table>' +
        '<tr>' +
            '<td>Название</td>' +
            '<td><input class="inputStyle" value="{{Title}}"></td>' +
        '</tr>' +
        '<tr>' +
            '<td>Описание</td>' +
            '<td><input class="inputStyle" value="{{Description}}"></td>' +
        '</tr>' +
    '</table>' +
    '<div class="ugw-users-placeholder"></div>' +
'</div>');*/

gmxCore.addModule('UserGroupWidget', {
        UserGroupListWidget: nsGmx.UserGroupListWidget
    }, {
        css: 'css/UserGroupWidget.css'
    }
);

})();