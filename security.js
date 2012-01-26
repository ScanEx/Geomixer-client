var security = function()
{
	this.mapTypeSel = null;
	this.mapAccessSel = null;
	
	this.mapAccessArr = {};
	this.defaultAccess = null;
	
	
	this.getSecurityName = null;
	this.updateSecurityName = null;
	this.getUserSecurityName = null;
	
	this.propertyValue = null;
	this.title = null;
}

security.UserInputWidget = function(container)
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

var mapSecurity = function()
{
	this.getSecurityName = "Map/GetSecurity.ashx";
	this.updateSecurityName = "Map/UpdateSecurity.ashx";
	this.getUserSecurityName = "Map/GetUserSecurity.ashx";
	
	this.propertyName = "MapID";
	this.dialogTitle = "Редактирование прав доступа карты [value0]";
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
}

multiLayerSecurity.prototype = new security();
multiLayerSecurity.prototype.constructor = multiLayerSecurity;

//добавляет в container поля поиска и связывает их с фильтрами table
security.prototype._createFilterWidget = function(table, container)
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
    
    table.getDataProvider().attachFilterEvents(filterLoginInput, 'Login', function(fieldName, fieldValue, vals)
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
    
    table.getDataProvider().attachFilterEvents(filterNicknameInput, 'Nickname', function(fieldName, fieldValue, vals)
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
	if ($$('securityDialog'))
		removeDialog($$('securityDialog'))
	
	var canvas = _div(null, [['attr','id','securityDialog']]),
		_this = this;
	
	this.mapTypeSel = _select(null, [['dir','className','selectStyle'],['css','width','160px']]);
	
	for (var i = 0; i < securityInfo.SecurityDescription.Types.length; ++i)
		_(this.mapTypeSel, [_option([_t(securityInfo.SecurityDescription.Types[i][1])],[['attr','value',securityInfo.SecurityDescription.Types[i][0]]])])
	
	switchSelect(this.mapTypeSel, securityInfo.SecurityInfo.Type);
	
	this.mapTypeSel.onchange = function()
	{
		securityInfo.SecurityInfo.Type = this.value;
	}
	
	_security.defaultAccess = securityInfo.SecurityDescription.DefaultAccess;
	
	for (var i = 0; i < securityInfo.SecurityDescription.AccessList.length; ++i)
		this.mapAccessArr[securityInfo.SecurityDescription.AccessList[i][0]] = securityInfo.SecurityDescription.AccessList[i][1];
	
	var saveButton = makeButton(_gtxt("Сохранить"));
	
	saveButton.onclick = function()
	{
		securityInfo.SecurityInfo.Users = _securityTable.getDataProvider().getOriginalItems();
		
		var loading = _img(null, [['attr','src','img/loader2.gif'],['attr','savestatus','true'],['css','margin','8px 0px 0px 10px']]);
		_($$('headerLinks'), [loading]);
		
		var postParams = {WrapStyle: 'window', SecurityInfo: JSON.stringify(securityInfo.SecurityInfo)};
		postParams[_this.propertyName] = _this.propertyValue;
		
		sendCrossDomainPostRequest(serverBase + _this.updateSecurityName, postParams, 
							function(response)
							{
								if (!parseResponse(response))
									return;
								
								_layersTree.showSaveStatus($$('headerLinks'));
							})
	}
	
	//смена владельца карты
	var changeOwnerLink = makeLinkButton(securityInfo.SecurityInfo.Owner);
	changeOwnerLink.setAttribute('id', 'changeOwnerLink');
	changeOwnerLink.onclick = function()
	{
		var canvas = _div();
		var tableSuggestParent = _div();
		var usersTable = new scrollTable();
		
		if (isShowUserSuggest)
		{
			var sortFuncs = {};
			sortFuncs[_gtxt('Логин')     ] = genSortFunction('Login');
			sortFuncs[_gtxt('Псевдоним') ] = genSortFunction('Nickname');
			sortFuncs[_gtxt('Полное имя')] = genSortFunction('Fullname');
				
			var drawOwnersFunction = function(user)
			{
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
					$('#changeOwnerLink').text(user.Nickname);
					securityInfo.SecurityInfo.NewOwnerID = user.UserID;
				}
				
				for (var i = 0; i < tr.childNodes.length; i++)
					tr.childNodes[i].style.width = this.fieldsWidths[i];
				
				attachEffects(tr, 'hover');
				
				return tr;
			}
			
			usersTable.limit = 20;
			usersTable.pagesCount = 5;
            
            if (isShowFullname)
                usersTable.createTable(tableSuggestParent, 'securityOwnerTable', 0, [_gtxt("Логин"), _gtxt("Псевдоним"), _gtxt("Полное имя")], ['33%', '33%', '34%'], drawOwnersFunction, sortFuncs);
            else
                usersTable.createTable(tableSuggestParent, 'securityOwnerTable', 0, [_gtxt("Логин")], ['100%'], drawOwnersFunction, sortFuncs);
          
            var filterContainer = _div();
            _this._createFilterWidget(usersTable, filterContainer);
            
			_(canvas, [filterContainer, tableSuggestParent]);
            
			usersTable.getDataProvider().setOriginalItems( securityInfo.UsersWithoutAccess.concat(securityInfo.SecurityInfo.Users) );
			
			usersTable.tableParent.style.height = '150px';
			usersTable.tableBody.parentNode.parentNode.style.height = '130px';
		}
		else
		{
            var userInputWidget = new security.UserInputWidget(canvas);
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
					$('#changeOwnerLink').text(response.Result.Nickname);
					securityInfo.SecurityInfo.NewOwnerID = response.Result.UserID;
				});
			}
            changeOwnerButton.style.marginLeft = '10px';
            $(canvas).append(changeOwnerButton);
		}
		
		var dialogCanvas = showDialog(_gtxt("Выберите нового владельца"), canvas, isShowFullname ? 600 : 500, isShowUserSuggest ? 250 : 70);
	}
	
	var ownerInfo = _div([_t(_gtxt('Владелец') + ": "), changeOwnerLink], [['css','fontSize','12px'], ['css','margin','5px 0px 10px 0px'], ['css','height','25px']]);
	var typeInfo = _div([_table([_tbody([_tr([_td([_t(_gtxt("Тип"))],[['css','width','40px'],['css','fontSize','12px'],['css','textAlign','right']]), _td([this.mapTypeSel]), _td([saveButton],[['css','paddingLeft','30px']])])])],[['dir','className','floatRight']])],[['css','margin','5px 0px 10px 0px'],['css','height','25px']]);
	_(canvas, [_table([_tbody([_tr([_td([ownerInfo]), _td([typeInfo])])])], [['css', 'width', '100%']])]);
	
	var tableParent = _div(),
		tableSuggestParent = _div(),
		sortFuncs = {};

	sortFuncs[_gtxt('Логин')]      = genSortFunction('Login');
	sortFuncs[_gtxt('Псевдоним')]  = genSortFunction('Nickname');
	sortFuncs[_gtxt('Полное имя')] = genSortFunction('Fullname');
	sortFuncs[_gtxt('Роль')]       = genSortFunction('Role');
	
    var userFiltersContainer = _div();
    this._createFilterWidget(_securityTable, userFiltersContainer);
    
	if (isShowUserSuggest)
    {
        var suggestFilterContainer = _div();
        this._createFilterWidget(_securityTableSuggest, suggestFilterContainer);
        
		_(canvas, [_div([
            _span([_t(_gtxt("Пользователи без прав доступа:"))],[['css','fontSize','12px'],['css','fontWeight','bold']]), _br(),
            suggestFilterContainer, _br(),
            tableSuggestParent
        ])]);
	
		_securityTableSuggest.limit = 20;
		_securityTableSuggest.pagesCount = 5;
		_securityTableSuggest.createTable(tableSuggestParent, 'securitySuggestTable', 300, [_gtxt("Логин"), _gtxt("Псевдоним"), _gtxt("Полное имя"), _gtxt("Роль"), ""], ['25%','25%','30%','15%','5%'], this.drawMapUsersSuggest, sortFuncs);
		
        
        
		_(canvas, [tableSuggestParent]);
		_(canvas, [_div([
            _span([_t(_gtxt("Пользователи с правами доступа:"))],[['css','fontSize','12px'],['css','fontWeight','bold']]), _br(), 
            //_table([_tbody([_tr([_td([_t(_gtxt("Логин"))],[['css','fontSize','12px'],['css','textAlign','right']]), _td([addMapUserInput])])])]), _br(), 
            userFiltersContainer
        ],[['css','borderTop','1px solid #999'],['css','marginTop','10px']])]);
	}
	else
    {
        var addMapUserButton = makeLinkButton(_gtxt("Добавить пользователя"));
        var addUserContainer = _div(null, [['css', 'marginBottom', '15px']]);
        var userInputWidget = new security.UserInputWidget(addUserContainer);
        
        addMapUserButton.style.marginLeft = '10px';
        addMapUserButton.onclick = function()
        {
            var res = userInputWidget.getUserInfo();
            var userParam = (res.isLogin ? "Login=" : "Nickname=") + res.value;
                
            if (res.value == "")
            {
                userInputWidget.showError();
                return;
            }
            
            var addedUsers = _securityTable.getDataProvider().getOriginalItems();
            
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
                //_securityTable.filterVals = {};
                
                // добавим в список пользователей с правами
                _security.addMapUser(response.Result, _securityTable);
            })
        }
        _(addUserContainer, [addMapUserButton]);
		_(canvas, [_div([
            addUserContainer,
            _span([_t(_gtxt("Пользователи с правами доступа:"))],[['css','fontSize','12px'],['css','fontWeight','bold']]), _br(), 
            userFiltersContainer
        ])]);
	}
    
	_securityTable.limit = 20;
	_securityTable.pagesCount = 5;
    
    var fieldNames   = isShowFullname ? [_gtxt("Логин"), _gtxt("Псевдоним"), _gtxt("Полное имя"), _gtxt("Роль"), _gtxt("Доступ"), ""] : [_gtxt("Псевдоним"), _gtxt("Роль"), _gtxt("Доступ"), ""]
    var fieldWidthes = isShowFullname ? ['20%','20%', '20%', '10%', '25%', '5%'] : ['60%','10%','25%','5%'];
    
	_securityTable.createTable(tableParent, 'securityTable', 310, fieldNames, fieldWidthes, function(arg)
	{
		return _this.drawMapUsers.call(this,arg,_this);
	}, sortFuncs);

	_(canvas, [tableParent]);

	var resize = function()
	{
		var mapTableHeight;
		
		if (isShowUserSuggest)
		{
			mapTableHeight = Math.floor((canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - canvas.childNodes[1].offsetHeight - canvas.childNodes[3].offsetHeight - 50 - 30 - 20) / 2 );
			
			_securityTableSuggest.tableParent.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';
			_securityTableSuggest.tableBody.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 15 - 21 + 'px';
			_securityTableSuggest.tableBody.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';

			_securityTableSuggest.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 12 - 21 + 'px';
			
			_securityTableSuggest.tableParent.style.height = mapTableHeight + 'px';
			_securityTableSuggest.tableBody.parentNode.parentNode.style.height = mapTableHeight - 20 + 'px';
		
		
			_securityTable.tableParent.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';
			_securityTable.tableBody.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 15 - 21 + 'px';
			_securityTable.tableBody.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';

			_securityTable.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 12 - 21 + 'px';
			
			_securityTable.tableParent.style.height = mapTableHeight + 'px';
			_securityTable.tableBody.parentNode.parentNode.style.height = mapTableHeight - 20 + 'px';
		}
		else
		{
			//mapTableHeight = (canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - canvas.childNodes[1].offsetHeight - canvas.childNodes[3].offsetHeight - 25 - 20 - 10);
			mapTableHeight = (canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - canvas.childNodes[1].offsetHeight - 25 - 20 - 10);
			
			_securityTable.tableParent.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';
			_securityTable.tableBody.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 15 - 21 + 'px';
			_securityTable.tableBody.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';

			_securityTable.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 12 - 21 + 'px';
			
			_securityTable.tableParent.style.height = mapTableHeight + 'px';
			_securityTable.tableBody.parentNode.parentNode.style.height = mapTableHeight - 15 + 'px';
		}
	}

	showDialog(_gtxt(this.dialogTitle, this.title), canvas, isShowFullname ? 670 : 571, isShowUserSuggest ? 470 : 370, false, false, resize);
	
    resize();
	
	if ( isShowUserSuggest )
	{
		var vals = [];
		
		for ( var u = 0; u < securityInfo.UsersWithoutAccess.length; u++)
			if ( securityInfo.UsersWithoutAccess[u].Role != nsGmx.ROLE_ADMIN )
				vals.push(securityInfo.UsersWithoutAccess[u]);

		_securityTableSuggest.getDataProvider().setOriginalItems(vals);
	}

	_securityTable.getDataProvider().setOriginalItems( securityInfo.SecurityInfo.Users );
}

security.prototype.drawMapUsers = function(user, securityScope)
{
	var remove = makeImageButton('img/closemin.png', 'img/close_orange.png'),
		tdRemove = user.Login == nsGmx.AuthManager.getLogin() ? _td() : _td([remove]),
		maxLayerWidth = this.tableHeader.firstChild.childNodes[0].offsetWidth + 'px',
		accessSel = _select(null, [['dir','className','selectStyle'],['css','width','110px']]),
        isShowFullname = nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_USER_FULLNAME),
		tr,
		_this = this;
	
	for (var i = 0; i < user.AccessList.length; ++i)
		_(accessSel, [_option([_t(securityScope.mapAccessArr[user.AccessList[i]])],[['attr','value',user.AccessList[i]]])])

	remove.onclick = function()
	{
		if (tr)
			tr.removeNode(true);
		
		// уберем пользователя из одного списка
		_security.removeMapUser(user, _securityTable);
		
		if (nsGmx.AuthManager.canDoAction(nsGmx.ACTION_SEE_ALL_USERS))
		{
			// добавим в другой
			_security.addMapUser(user, _securityTableSuggest);
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
		tr.childNodes[i].style.width = this.fieldsWidths[i];
	
	attachEffects(tr, 'hover')
	
	return tr;
}

//Предполагаем, что если мы показываем всех пользователей, то имеем всю инфу о них
security.prototype.drawMapUsersSuggest = function(user)
{
	var add = makeImageButton("img/choose.png", "img/choose_a.png"),
		tr,
		tdAdd = _td([add]),
		_this = this;
	
	add.onclick = function()
	{
		if (tr)
			tr.removeNode(true);
		
        // уберем пользователя из одного списка
        _security.removeMapUser(user, _securityTableSuggest);
        
		// добавим в другой
		_security.addMapUser(user, _securityTable);
	}
    
    var tdLogin = _td([_div([_t(user.Login)], [['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
    var tdNickname = _td([_div([_t(user.Nickname)], [['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
    var tdFullname = _td([_div([_t(user.Fullname)], [['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]);
	var tdRole = _td([_t(user.Role)], [['css','textAlign','center'],['css','color','#999999']]);
    
	tr = _tr([tdLogin, tdNickname, tdFullname, tdRole, tdAdd]);
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this.fieldsWidths[i];
	
	attachEffects(tr, 'hover')
	
	return tr;
}

security.prototype.removeMapUser = function(user, list)
{
    list.getDataProvider().filterOriginalItems(function(elem)
    {
        return elem.Login != user.Login;
    });
    
}

security.prototype.addMapUser = function(user, list)
{
	var existedUser = {};
	
	$.extend(existedUser, user)
	
	existedUser.Access = _security.defaultAccess;

	list.start = 0;
	list.reportStart = 0;
	list.allPages = 0;
    
    list.getDataProvider().addOriginalItem(existedUser);
}

var _securityTable = new scrollTable(),
	_securityTableSuggest = new scrollTable();

var _security = new security(),
	_mapSecurity = new mapSecurity(),
	_layerSecurity = new layerSecurity(),
	_multiLayerSecurity = new multiLayerSecurity();