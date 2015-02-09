var nsGmx = nsGmx || {};

(function() {

var SHARE_TYPES = ['public', 'private'];

nsGmx.Translations.addText('rus', {security: {
    ownerName: 'Владелец',
    shareType: 'Видимость в списках',
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
    }
}});

nsGmx.Translations.addText('eng', {security: {
    ownerName: 'Owner',
    shareType: 'Visible in lists',
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
    }
}});


var removeMapUser = function(user, dataProvider)
{
    dataProvider.filterOriginalItems(function(elem)
    {
        return elem.Login != user.Login;
    });
    
}

var UserInputWidget = function(container)
{
    var isLogin = true;
    var loginInput = _input(null, [['css','width','110px'],['dir','className','selectStyle']]);
    var nicknameInput = _input(null, [['css','width','110px'],['dir','className','selectStyle']]);
    $(nicknameInput).addClass('uiw-inactive');
    
    loginInput.onfocus = function()
    {
        isLogin = true;
        $(loginInput).removeClass('uiw-inactive');
        $(nicknameInput).addClass('uiw-inactive');
    }
    
    nicknameInput.onfocus = function()
    {
        isLogin = false;
        $(nicknameInput).removeClass('uiw-inactive');
        $(loginInput).addClass('uiw-inactive');
    }
    
    _(container, [
                _span([_t(_gtxt("Логин")), loginInput], [['css','fontSize','12px']]), 
                _span([_t(_gtxt("Псевдоним")), nicknameInput], [['css','fontSize','12px'], ['css', 'marginLeft', '20px']])
            ]);
            
    this.getUserInfo = function()
    {
        var value = isLogin ? loginInput.value : nicknameInput.value;
        return {isLogin: isLogin, value: value}
    }
    
    this.showError = function()
    {
        inputError( isLogin ? loginInput : nicknameInput );
    }
    
    this.clear = function()
    {
        loginInput.value = "";
        nicknameInput.value = "";
    }   
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
    
    this._securityTable = new nsGmx.ScrollTable({limit:20, pagesCount: 5});
    this._securityUsersProvider = new nsGmx.ScrollTable.StaticDataProvider();
    
    this._securityTableSuggest = new nsGmx.ScrollTable({limit:20, pagesCount: 5});
    this._securitySuggestProvider = new nsGmx.ScrollTable.StaticDataProvider();
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

//добавляет в container поля поиска и связывает их с фильтрами dataProvider'a
security.prototype._createFilterWidget = function(dataProvider, container)
{
    var inputPredicate = function(value, fieldName, fieldValue)
	{
		if (!value[fieldName])
			return false;
		
		return String(value[fieldName]).toLowerCase().indexOf(fieldValue.toLowerCase()) > -1;
	};
    
    var filterLoginInput = _input(null, [['css','width','110px'],['dir','className','selectStyle']]);
    var filterNicknameInput = _input(null, [['css','width','110px'],['dir','className','selectStyle']]);
    
    _(container, [
        _span([_t(_gtxt("Логин")), filterLoginInput], [['css','fontSize','12px']]), 
        _span([_t(_gtxt("Псевдоним")), filterNicknameInput], [['css','fontSize','12px'], ['css', 'marginLeft', '20px']])
    ]);
    
    dataProvider.attachFilterEvents(filterLoginInput, 'Login', function(fieldName, fieldValue, vals)
    {
        if (fieldValue == "")
            return vals;
        
        var filterFunc = function(value)
            {
                return inputPredicate(value, fieldName, fieldValue);
            },
            local = _filter(filterFunc, vals);
        
        return local;
    });
    
    dataProvider.attachFilterEvents(filterNicknameInput, 'Nickname', function(fieldName, fieldValue, vals)
    {
        if (fieldValue == "")
            return vals;
        
        var filterFunc = function(value)
            {
                return inputPredicate(value, fieldName, fieldValue);
            },
            local = _filter(filterFunc, vals);
        
        return local;
    });
}

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
            
	var isShowUserSuggest = nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_ALL_USERS);
    var isShowFullname    = nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_USER_FULLNAME);
    
	$$('securityDialog') && removeDialog($$('securityDialog').parentNode.parentNode);

	var _this = this;

    var uiTemplate = '<div id="securityDialog" class="security-canvas">' +
        '<div class="security-header">' + 
            '<table class="security-header-table"><tr>' +
                '<td><div>' +
                    '{{i security.ownerName}}: <span class="buttonLink changeOwnerLink">{{ownerName}}</span>' +
                '</div></td>' +
                '<td><div>' +
                    '<table class="security-header-right"><tr>' +
                        '<td>{{i security.shareType}}</td>' +
                        '<td><select class="security-share-select selectStyle">' +
                            '{{#shareTypes}}' +
                                '<option value="{{value}}"{{#isSelected}} selected{{/isSelected}}>{{title}}</option>' +
                            '{{/shareTypes}}' +
                        '</select></td>' +
                        '<td><button class="security-save">{{i Сохранить}}</button></td>' +
                    '</tr></table>' +
                '</div></td>' +
            '</tr></table>' + 
            '<div>{{i security.defAccess}}: ' +
                '<select class="security-defaccess-select selectStyle">' +
                    '{{#defAccessTypes}}' +
                        '<option value="{{value}}"{{#isSelected}} selected{{/isSelected}}>{{title}}</option>' +
                    '{{/defAccessTypes}}' +
                '</select>' +
            '</div>' + 
        '</div>' +
        '{{#isShowUserSuggest}}' +
            '<div class="security-suggest-header">{{i Пользователи без прав доступа:}}</div>' +
            '<div class="suggest-filters-placeholder"></div>' +
            '<div class="suggest-table-placeholder"></div>' +
        '{{/isShowUserSuggest}}' +
        '{{^isShowUserSuggest}}' +
            '<div>' +
                '<span class="add-user-placeholder"></span>' +
                '<span class="buttonLink add-user-button">{{i Добавить пользователя}}</span>' +
            '</div>' +
        '{{/isShowUserSuggest}}' +
        '<div class="security-access-header">{{i Пользователи с правами доступа:}}</div>' +
        '<div class="access-filters-placeholder"></div>' +
        '<div class="access-table-placeholder"></div>' +
    '</div>';
    
    var canvas = $(Mustache.render(uiTemplate, {
        ownerName: securityInfo.SecurityInfo.Owner,
        isShowUserSuggest: isShowUserSuggest,
        shareTypes: SHARE_TYPES.map(function(type) {
            return {
                value: type, 
                title: _gtxt('security.share.' + type), 
                isSelected: type === securityInfo.SecurityInfo.Type
            };
        }),
        defAccessTypes: this.accessTypes.map(function(type) {
            return {
                value: type, 
                title: _gtxt('security.access.' + type), 
                isSelected: type === securityInfo.SecurityInfo.DefAccess
            };
        })
    }))[0];
	
	$('.security-share-select', canvas).change(function() {
		securityInfo.SecurityInfo.Type = this.value;
	})
    
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
	
	//смена владельца карты
	$('.changeOwnerLink', canvas).click(function() {
		var ownerCanvas = _div();
		var tableSuggestParent = _div();
        
		var usersTable = new nsGmx.ScrollTable({limit: 20, pagesCount: 5});
        var usersProvider = new nsGmx.ScrollTable.StaticDataProvider();
		
		if (isShowUserSuggest)
		{
			var sortFuncs = {};
			sortFuncs[_gtxt('Логин')     ] = genSortFunction('Login');
			sortFuncs[_gtxt('Псевдоним') ] = genSortFunction('Nickname');
			sortFuncs[_gtxt('Полное имя')] = genSortFunction('Fullname');
				
			var drawOwnersFunction = function(user)
			{
                user = $.extend({Login: "", Fullname: "", Nickname: ""}, user);
                var tdNickname = _td([_div([_t(user.Nickname)], [['css','cursor','pointer'], ['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);

                var tds;
                
                if (isShowFullname)
                {
                    var tdLogin = _td([_div([_t(user.Login)], [['css','cursor','pointer'], ['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
                    var tdFullname = _td([_div([_t(user.Fullname)], [['css','cursor','pointer'], ['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
                    tds = [tdLogin, tdNickname, tdFullname];
                }
                else
                    tds = [tdNickname];
                
				var tr = _tr(tds);
				
                tr.onclick = function()
				{
					removeDialog(dialogCanvas);
					$('.changeOwnerLink', canvas).text(user.Nickname);
					securityInfo.SecurityInfo.NewOwnerID = user.UserID;
				}
				
				for (var i = 0; i < tr.childNodes.length; i++)
					tr.childNodes[i].style.width = this._fields[i].width;
				
				attachEffects(tr, 'hover');
				
				return tr;
			}
            
            var filterContainer = _div();
            _this._createFilterWidget(usersProvider, filterContainer);
			usersProvider.setOriginalItems( securityInfo.UsersWithoutAccess.concat(securityInfo.SecurityInfo.Users) );
			            
            usersProvider.setSortFunctions(sortFuncs);
            usersTable.setDataProvider(usersProvider);
                        
            if (isShowFullname)
                usersTable.createTable(tableSuggestParent, 'securityOwnerTable', 0, [_gtxt("Логин"), _gtxt("Псевдоним"), _gtxt("Полное имя")], ['33%', '33%', '34%'], drawOwnersFunction, sortFuncs);
            else
                usersTable.createTable(tableSuggestParent, 'securityOwnerTable', 0, [_gtxt("Логин")], ['100%'], drawOwnersFunction, sortFuncs);
          
			_(ownerCanvas, [filterContainer, tableSuggestParent]);
            
            
			
			usersTable.tableParent.style.height = '150px';
			usersTable.tableBody.parentNode.parentNode.style.height = '130px';
		}
		else
		{
            var userInputWidget = new UserInputWidget(ownerCanvas);
			var changeOwnerButton = makeLinkButton(_gtxt("Сменить владельца"));
			changeOwnerButton.onclick = function()
			{
                var res = userInputWidget.getUserInfo();
                var userParam = (res.isLogin ? "Login=" : "Nickname=") + res.value;
                                
				sendCrossDomainJSONRequest(serverBase + _this.getUserSecurityName + "?WrapStyle=func&" + userParam + "&" + _this.propertyName + "=" + _this.propertyValue, function(response)
				{
					if (!parseResponse(response))
						return;
					
					if (response.Result == null || response.Result.IsOwner == true)
					{
						userInputWidget.showError();
						return;
					}
					
					removeDialog(dialogCanvas);
					$('.changeOwnerLink', canvas).text(response.Result.Nickname);
					securityInfo.SecurityInfo.NewOwnerID = response.Result.UserID;
				});
			}
            changeOwnerButton.style.marginLeft = '10px';
            $(ownerCanvas).append(changeOwnerButton);
		}
		
		var dialogCanvas = showDialog(_gtxt("Выберите нового владельца"), ownerCanvas, isShowFullname ? 600 : 500, isShowUserSuggest ? 250 : 70);
	})
	
	var sortFuncs = {};

	sortFuncs[_gtxt('Логин')]      = genSortFunction('Login');
	sortFuncs[_gtxt('Псевдоним')]  = genSortFunction('Nickname');
	sortFuncs[_gtxt('Полное имя')] = genSortFunction('Fullname');
	sortFuncs[_gtxt('Роль')]       = genSortFunction('Role');
	
    this._createFilterWidget(this._securityUsersProvider, $('.access-filters-placeholder', canvas)[0]);
    
	if (isShowUserSuggest)
    {
        this._createFilterWidget(this._securitySuggestProvider, $('.suggest-filters-placeholder', canvas)[0]);

        //Предполагаем, что если мы показываем всех пользователей, то имеем всю инфу о них
        var drawMapUsersSuggest = function(user)
        {
            var add = makeImageButton("img/choose.png", "img/choose_a.png"),
                tr,
                tdAdd = _td([add]);
            
            add.onclick = function()
            {
                if (tr)
                    tr.removeNode(true);
                
                // уберем пользователя из одного списка
                removeMapUser(user, _this._securitySuggestProvider);
                
                // добавим в другой
                _this._addMapUser(user, _this._securityUsersProvider);
            }
            
            var tdLogin = _td([_div([_t(user.Login)], [['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
            var tdNickname = _td([_div([_t(user.Nickname)], [['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
            var tdFullname = _td([_div([_t(user.Fullname)], [['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
            var tdRole = _td([_t(user.Role)], [['css','textAlign','center'],['css','color','#999999']]);
            
            tr = _tr([tdLogin, tdNickname, tdFullname, tdRole, tdAdd]);
            
            for (var i = 0; i < tr.childNodes.length; i++)
                tr.childNodes[i].style.width = this._fields[i].width;
            
            attachEffects(tr, 'hover')
            
            return tr;
        }
	
        this._securitySuggestProvider.setSortFunctions(sortFuncs);
        this._securityTableSuggest.setDataProvider(this._securitySuggestProvider);
		this._securityTableSuggest.createTable($('.suggest-table-placeholder', canvas)[0], 'securitySuggestTable', 300, [_gtxt("Логин"), _gtxt("Псевдоним"), _gtxt("Полное имя"), _gtxt("Роль"), ""], ['25%','25%','30%','15%','5%'], drawMapUsersSuggest, sortFuncs);
	}
	else
    {
        var userInputWidget = new UserInputWidget($('.add-user-placeholder', canvas)[0]);
        
        $('.add-user-button', canvas).click(function(){
            var res = userInputWidget.getUserInfo();
            var userParam = (res.isLogin ? "Login=" : "Nickname=") + res.value;
                
            if (res.value == "")
            {
                userInputWidget.showError();
                return;
            }
            
            var addedUsers = _this._securityUsersProvider.getOriginalItems();
            
            sendCrossDomainJSONRequest(serverBase + _this.getUserSecurityName + "?WrapStyle=func&" + userParam + "&" + _this.propertyName + "=" + _this.propertyValue, function(response)
            {
                if (!parseResponse(response))
                    return;
                
                if (response.Result == null || response.Result.Role == 'admin' || response.Result.IsOwner == true)
                {
                    userInputWidget.showError();
                    return;
                }
                
                //нет ли у нас в таблице такого пользователя?
                for (var i = 0; i < addedUsers.length; ++i)
                    if (addedUsers[i].UserID == response.Result.UserID)
                    {
                        userInputWidget.showError();
                        return;
                    }
                
                delete response.Result.IsOwner;
                response.Result.Access = _this.defaultAccess;
                
                userInputWidget.clear();
                
                // добавим в список пользователей с правами
                _this._addMapUser(response.Result, _this._securityUsersProvider);
            })
        });
        
	}
    
    var fieldNames   = isShowFullname ? [_gtxt("Логин"), _gtxt("Псевдоним"), _gtxt("Полное имя"), _gtxt("Роль"), _gtxt("Доступ"), ""] : [_gtxt("Псевдоним"), _gtxt("Роль"), _gtxt("Доступ"), ""]
    var fieldWidthes = isShowFullname ? ['20%','20%', '20%', '10%', '25%', '5%'] : ['60%','10%','25%','5%'];
    
    this._securityUsersProvider.setSortFunctions(sortFuncs);
    this._securityTable.setDataProvider(this._securityUsersProvider);
	this._securityTable.createTable($('.access-table-placeholder', canvas)[0], 'securityTable', 310, fieldNames, fieldWidthes, function(arg)
	{
		return _this.drawMapUsers.call(this, arg, _this);
	}, sortFuncs);

	// _(canvas, [tableParent]);

	var resize = function()
	{
		var mapTableHeight;
        var dialogWidth = canvas.parentNode.parentNode.offsetWidth;
        
        var nonTableHeight = 
                $('.security-header', canvas).height() + 
                $('.security-suggest-header', canvas).height() + $('.suggest-filters-placeholder', canvas).height() +
                $('.security-access-header', canvas).height() + $('.access-filters-placeholder', canvas).height() + 15;
		
		if (isShowUserSuggest)
		{
			mapTableHeight = Math.floor((canvas.parentNode.offsetHeight - nonTableHeight - 11)/2) - 30;
			
			_this._securityTableSuggest.tableParent.style.width = dialogWidth - 35 - 21 + 'px';
			_this._securityTableSuggest.tableBody.parentNode.parentNode.style.width = dialogWidth - 15 - 21 + 'px';
			_this._securityTableSuggest.tableBody.parentNode.style.width = dialogWidth - 35 - 21 + 'px';

			_this._securityTableSuggest.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = dialogWidth - 12 - 21 + 'px';
			
			_this._securityTableSuggest.tableParent.style.height = mapTableHeight + 'px';
			_this._securityTableSuggest.tableBody.parentNode.parentNode.style.height = mapTableHeight - 20 + 'px';
		}
		else
		{
			mapTableHeight = canvas.parentNode.offsetHeight - nonTableHeight - 30;
		}
        
        _this._securityTable.tableParent.style.width = dialogWidth - 35 - 21 + 'px';
        _this._securityTable.tableBody.parentNode.parentNode.style.width = dialogWidth - 15 - 21 + 'px';
        _this._securityTable.tableBody.parentNode.style.width = dialogWidth - 35 - 21 + 'px';

        _this._securityTable.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = dialogWidth - 12 - 21 + 'px';
        
        _this._securityTable.tableParent.style.height = mapTableHeight + 'px';
        _this._securityTable.tableBody.parentNode.parentNode.style.height = mapTableHeight - 20 + 'px';
	}

	showDialog(_gtxt(this.dialogTitle, this.title), canvas, isShowFullname ? 670 : 571, isShowUserSuggest ? 470 : 370, false, false, resize);
	
    resize();
	
	if ( isShowUserSuggest )
	{
		var vals = [];
		
		for ( var u = 0; u < securityInfo.UsersWithoutAccess.length; u++)
			if ( securityInfo.UsersWithoutAccess[u].Role != nsGmx.ROLE_ADMIN )
				vals.push(securityInfo.UsersWithoutAccess[u]);

		this._securitySuggestProvider.setOriginalItems(vals);
	}

	this._securityUsersProvider.setOriginalItems( securityInfo.SecurityInfo.Users );
}

security.prototype.drawMapUsers = function(user, securityScope)
{
    //иногда бывает, что админы тоже попадают в список людей с доступом
    //но показывать их в этом списке не имеет смысла
    if (user.Role === 'admin') {
        return null;
    }
    
	var remove = makeImageButton('img/closemin.png', 'img/close_orange.png'),
		tdRemove = user.Login == nsGmx.AuthManager.getLogin() ? _td() : _td([remove]),
		maxLayerWidth = this.tableHeader.firstChild.childNodes[0].offsetWidth + 'px',
		accessSel = nsGmx.Utils._select(null, [['dir','className','selectStyle'],['css','width','130px']]),
        isShowFullname = nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_USER_FULLNAME),
		tr;
	
    var accessList = securityScope.accessTypes;
	for (var i = 0; i < accessList.length; ++i) {
		_(accessSel, [_option([_t(_gtxt('security.access.' + accessList[i]))],[['attr', 'value', accessList[i]]])]);
    }

	remove.onclick = function()
	{
		if (tr)
			tr.removeNode(true);
		
		// уберем пользователя из одного списка
		removeMapUser(user, securityScope._securityUsersProvider);
		
		if (nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_ALL_USERS))
		{
			// добавим в другой
			securityScope._addMapUser(user, securityScope._securitySuggestProvider);
		}
	}
	
	switchSelect(accessSel, user.Access);
	
	accessSel.onchange = function()
	{
		user.Access = this.value;
	}
    
    var tdNickname = _td([_div([_t(user.Nickname)], [['css','width',maxLayerWidth],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
    var tdRole  = _td([_t(user.Role)], [['css','textAlign','center'],['css','color','#999999']]);
    var tdAccess = _td([accessSel],[['css','textAlign','center']]);
    
    if (isShowFullname)
    {
        var tdLogin = _td([_div([_t(user.Login)], [['css','width',maxLayerWidth],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
        var tdFullname = _td([_div([_t(user.Fullname)], [['css','width',maxLayerWidth],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
        
        tr = _tr([
            tdLogin,
            tdNickname,
            tdFullname,
            tdRole,
            tdAccess,
            tdRemove
        ]);
    }
    else
    {
        tr = _tr([
            tdNickname,
            tdRole,
            tdAccess,
            tdRemove
        ]);
    }
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this._fields[i].width;
	
	attachEffects(tr, 'hover')
	
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