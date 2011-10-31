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
	var isShowUserSuggest = nsMapCommon.AuthorizationManager.canDoAction(nsMapCommon.AuthorizationManager.ACTION_SEE_ALL_USERS);
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
		securityInfo.SecurityInfo.Users = _securityTable.vals;
		
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
	
	var inputPredicate = function(value, fieldName, fieldValue)
	{
		if (!value[fieldName])
			return false;
		
		return String(value[fieldName]).toLowerCase().indexOf(fieldValue.toLowerCase()) > -1;
	};	
	
	//смена владельца карты
	var changeOwnerLink = makeLinkButton(securityInfo.SecurityInfo.Owner);
	changeOwnerLink.setAttribute('id', 'changeOwnerLink');
	changeOwnerLink.onclick = function()
	{
		var canvas = _div();
		var tableSuggestParent = _div();
		var usersTable = new scrollTable();
		var filterOwnerInput = _input(null, [['css','width','110px'],['dir','className','selectStyle']]);
		
		if (isShowUserSuggest)
		{
		
			var sortFuncs = {};
			sortFuncs[_gtxt('Логин')] = [
					function(a,b){if (a.Login > b.Login) return 1; else if (a.Login < b.Login) return -1; else return 0},
					function(a,b){if (a.Login < b.Login) return 1; else if (a.Login > b.Login) return -1; else return 0}
				];
				
			var drawOwnersFunction = function(user)
			{
				var tr = _tr([_td([_div([_t(user.Login)], [['css','cursor','pointer'], ['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])])]);
				
				tr.onclick = function()
				{
					removeDialog(dialogCanvas);
					$('#changeOwnerLink').text(user.Login);
					securityInfo.SecurityInfo.NewOwnerID = user.UserID;
				}
				
				for (var i = 0; i < tr.childNodes.length; i++)
					tr.childNodes[i].style.width = this.fieldsWidths[i];
				
				attachEffects(tr, 'hover');
				
				return tr;
			}
			
			usersTable.limit = 20;
			usersTable.pagesCount = 5;
			usersTable.createTable(tableSuggestParent, 'securityOwnerTable', 300, [_gtxt("Логин")], ['100%'], drawOwnersFunction, sortFuncs);
			_(canvas, [_div([_t(_gtxt("Логин")), filterOwnerInput], [['css','fontSize','12px']]), tableSuggestParent]);
			
			usersTable.attachFilterEvents(filterOwnerInput, 'Login', function(fieldName, fieldValue, vals)
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
			
			usersTable.setValues( securityInfo.UsersWithoutAccess.concat(securityInfo.SecurityInfo.Users) );
			usersTable.drawFilterTable();
			
			usersTable.tableParent.style.height = '150px';
			usersTable.tableBody.parentNode.parentNode.style.height = '130px';
		}
		else
		{
			var changeOwnerButton = makeLinkButton(_gtxt("Сменить владельца"));
			changeOwnerButton.onclick = function()
			{
				sendCrossDomainJSONRequest(serverBase + _this.getUserSecurityName + "?WrapStyle=func&Login=" + filterOwnerInput.value + "&" + _this.propertyName + "=" + _this.propertyValue, function(response)
				{
					if (!parseResponse(response))
						return;
					
					if (response.Result == null || response.Result.IsOwner == true)
					{
						inputError(filterOwnerInput);
						return;
					}
					
					removeDialog(dialogCanvas);
					$('#changeOwnerLink').text(response.Result.Login);
					securityInfo.SecurityInfo.NewOwnerID = response.Result.UserID;
				});
			}
			_(canvas, [_div([_t(_gtxt("Логин")), filterOwnerInput, changeOwnerButton], [['css','fontSize','12px']]), tableSuggestParent]);
			
		}
		
		var dialogCanvas = showDialog(_gtxt("Выберите нового владельца"), canvas, 350, isShowUserSuggest ? 250 : 70);
	}
	
	var ownerInfo = _div([_t(_gtxt('Владелец') + ": "), changeOwnerLink], [['css','fontSize','12px'], ['css','margin','5px 0px 10px 0px'], ['css','height','25px']]);
	var typeInfo = _div([_table([_tbody([_tr([_td([_t(_gtxt("Тип"))],[['css','width','40px'],['css','fontSize','12px'],['css','textAlign','right']]), _td([this.mapTypeSel]), _td([saveButton],[['css','paddingLeft','30px']])])])],[['dir','className','floatRight']])],[['css','margin','5px 0px 10px 0px'],['css','height','25px']]);
	_(canvas, [_table([_tbody([_tr([_td([ownerInfo]), _td([typeInfo])])])], [['css', 'width', '100%']])]);
	
	var addMapUserButton = makeLinkButton(_gtxt("Добавить пользователя")),
		addMapUserInput = _input(null, [['css','width','110px'],['dir','className','selectStyle']]),
		addMapUserSuggestInput = _input(null, [['css','width','110px'],['dir','className','selectStyle']]);

	addMapUserButton.onclick = function()
	{
		if (addMapUserInput.value == "")
		{
			inputError(addMapUserInput);
			
			return;
		}
		
		var alreadyAddedFlag = false;
		
		for (var i = 0; i < _securityTable.vals.length; ++i)
			if (_securityTable.vals[i].Login == addMapUserInput.value)
			{
				alreadyAddedFlag = true;
				
				break;
			}
		
		if (alreadyAddedFlag)
		{
			inputError(addMapUserInput);
			
			return;
		}
		
		sendCrossDomainJSONRequest(serverBase + _this.getUserSecurityName + "?WrapStyle=func&Login=" + addMapUserInput.value + "&" + _this.propertyName + "=" + _this.propertyValue, function(response)
		{
			if (!parseResponse(response))
				return;
			
			if (response.Result == null || response.Result.Role == 'admin' || response.Result.IsOwner == true)
			{
				inputError(addMapUserInput);
				return;
			}
			
			delete response.Result.IsOwner;
			response.Result.Access = _this.defaultAccess;
			
			addMapUserInput.value = "";
			_securityTable.filterVals = {};
			
			// добавим в другой
			_security.addMapUser(response.Result, _securityTable);				
		})
	}

	var tableParent = _div(),
		tableSuggestParent = _div(),
		sortFuncs = {};

	sortFuncs[_gtxt('Логин')] = [
				function(a,b){if (a.Login > b.Login) return 1; else if (a.Login < b.Login) return -1; else return 0},
				function(a,b){if (a.Login < b.Login) return 1; else if (a.Login > b.Login) return -1; else return 0}
			];
	sortFuncs[_gtxt('Роль')] = [
				function(a,b){if (a.Role > b.Role) return 1; else if (a.Role < b.Role) return -1; else return 0},
				function(a,b){if (a.Role < b.Role) return 1; else if (a.Role > b.Role) return -1; else return 0}
			];
	
	if (isShowUserSuggest)
		_(canvas, [_div([_span([_t(_gtxt("Пользователи без прав доступа:"))],[['css','fontSize','12px'],['css','fontWeight','bold']]), _br(), _table([_tbody([_tr([_td([_t(_gtxt("Логин"))],[['css','fontSize','12px'],['css','textAlign','right']]), _td([addMapUserSuggestInput])])])]), _br(), tableSuggestParent])]);
	else
		_(canvas, [_div()]);
	
	if (isShowUserSuggest)
	{
		_securityTableSuggest.limit = 20;
		_securityTableSuggest.pagesCount = 5;
		_securityTableSuggest.createTable(tableSuggestParent, 'securitySuggestTable', 300, [_gtxt("Логин"), _gtxt("Роль"), ""], ['80%','15%','5%'], this.drawMapUsersSuggest, sortFuncs);
		
		_securityTableSuggest.attachFilterEvents(addMapUserSuggestInput, 'Login', function(fieldName, fieldValue, vals)
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
		
		_securityTableSuggest.tableHeader.firstChild.childNodes[0].style.textAlign = 'left';
		_securityTableSuggest.tableHeader.firstChild.childNodes[0].style.paddingLeft = '3px';
			
		_(canvas, [tableSuggestParent]);
	}
	else
		_(canvas, [_div()])

	if (isShowUserSuggest)
		_(canvas, [_div([_span([_t(_gtxt("Пользователи с правами доступа:"))],[['css','fontSize','12px'],['css','fontWeight','bold']]), _br(), _table([_tbody([_tr([_td([_t(_gtxt("Логин"))],[['css','fontSize','12px'],['css','textAlign','right']]), _td([addMapUserInput])])])]), _br(), tableParent],[['css','borderTop','1px solid #999'],['css','marginTop','10px']])]);
	else
		_(canvas, [_div([_span([_t(_gtxt("Пользователи с правами доступа:"))],[['css','fontSize','12px'],['css','fontWeight','bold']]), _br(), _table([_tbody([_tr([_td([_t(_gtxt("Логин"))],[['css','fontSize','12px'],['css','textAlign','right']]), _td([addMapUserInput]), _td([addMapUserButton])])])]), _br(), tableParent])]);
	
	_securityTable.limit = 20;
	_securityTable.pagesCount = 5;
	_securityTable.createTable(tableParent, 'securityTable', 310, [_gtxt("Логин"), _gtxt("Роль"), "", ""], ['60%','10%','25%','5%'], function(arg)
	{
		return _this.drawMapUsers.call(this,arg,_this);
	}, sortFuncs);

	_securityTable.attachFilterEvents(addMapUserInput, 'Login', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var filterFunc = function(value)
				{
					return inputPredicate(value, fieldName, fieldValue);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
		
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
			mapTableHeight = (canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - canvas.childNodes[1].offsetHeight - canvas.childNodes[3].offsetHeight - 25 - 20 - 10);
			
			_securityTable.tableParent.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';
			_securityTable.tableBody.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 15 - 21 + 'px';
			_securityTable.tableBody.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';

			_securityTable.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 12 - 21 + 'px';
			
			_securityTable.tableParent.style.height = mapTableHeight + 'px';
			_securityTable.tableBody.parentNode.parentNode.style.height = mapTableHeight - 15 + 'px';
		}
	}

	showDialog(_gtxt(this.dialogTitle, this.title), canvas, 571, isShowUserSuggest ? 470 : 370, false, false, resize);
	
	_securityTable.tableHeader.firstChild.childNodes[0].style.textAlign = 'left';
	_securityTable.tableHeader.firstChild.childNodes[0].style.paddingLeft = '3px';
	_(_securityTable.tableHeader.firstChild.childNodes[2], [_span([_t(_gtxt("Доступ"))],[['css','fontSize','12px'],['css','color','#293D6B']])])
	
	resize();
	
	if ( isShowUserSuggest )
	{
		var vals = [];
		
		for ( var u = 0; u < securityInfo.UsersWithoutAccess.length; u++)
			if ( securityInfo.UsersWithoutAccess[u].Role != nsMapCommon.AuthorizationManager.ROLE_ADMIN )
				vals.push(securityInfo.UsersWithoutAccess[u]);

		_securityTableSuggest.setValues(vals);
		_securityTableSuggest.drawFilterTable();
	}

	_securityTable.setValues( securityInfo.SecurityInfo.Users );
	_securityTable.drawFilterTable();
}

security.prototype.drawMapUsers = function(user, securityScope)
{
	var remove = makeImageButton('img/closemin.png', 'img/close_orange.png'),
		tdRemove = user.Login == userInfo().Login ? _td() : _td([remove]),
		maxLayerWidth = this.tableHeader.firstChild.childNodes[0].offsetWidth + 'px',
		accessSel = _select(null, [['dir','className','selectStyle'],['css','width','110px']]),
		tr,
		_this = this;
	
	for (var i = 0; i < user.AccessList.length; ++i)
		_(accessSel, [_option([_t(securityScope.mapAccessArr[user.AccessList[i]])],[['attr','value',user.AccessList[i]]])])

//	switchSelect(accessSel, securityScope.defaultAccess);
	
	remove.onclick = function()
	{
		if (tr)
			tr.removeNode(true);
		
		// уберем пользователя из одного списка
		_security.removeMapUser(user, _securityTable);
		
		if (nsMapCommon.AuthorizationManager.canDoAction(nsMapCommon.AuthorizationManager.ACTION_SEE_ALL_USERS))
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

	tr = _tr([_td([_div([_t(user.Login)], [['css','width',maxLayerWidth],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]), _td([_t(user.Role)], [['css','textAlign','center'],['css','color','#999999']]), _td([accessSel],[['css','textAlign','center']]), tdRemove]);
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this.fieldsWidths[i];
	
	attachEffects(tr, 'hover')
	
	return tr;
}

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
		
		if (nsMapCommon.AuthorizationManager.canDoAction(nsMapCommon.AuthorizationManager.ACTION_SEE_ALL_USERS))
		{
			// уберем пользователя из одного списка
			_security.removeMapUser(user, _securityTableSuggest);
		}
		
		// добавим в другой
		_security.addMapUser(user, _securityTable);
	}
	
	tr = _tr([_td([_div([_t(user.Login)], [['css','width','140px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','padding','1px 0px 1px 3px'],['css','fontSize','12px']])]), _td([_t(user.Role)], [['css','textAlign','center'],['css','color','#999999']]), tdAdd]);
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this.fieldsWidths[i];
	
	attachEffects(tr, 'hover')
	
	return tr;
}

security.prototype.removeMapUser = function(user, list)
{
	// list.vals = _filter(function(elem)
	// {
		// return elem.Login != user.Login;
	// }, list.vals);
	
	// list.currVals = _filter(function(elem)
	// {
		// return elem.Login != user.Login;
	// }, list.currVals);
	var filteredValues = _filter(function(elem)
	{
		return elem.Login != user.Login;
	}, list.vals);
	
	list.setValues(filteredValues);
	_security.drawFilterTable(list);
}

security.prototype.addMapUser = function(user, list)
{
	var existedUser = {};
	
	$.extend(existedUser, user)
	
	existedUser.Access = _security.defaultAccess;
	list.vals.push(existedUser);
	
	list.setValues(list.vals);
	
	list.start = 0;
	list.reportStart = 0;
	list.allPages = 0;
	
	_security.drawFilterTable(list)
}

security.prototype.drawFilterTable = function(list)
{
	// var hasFilter = false;
	
	// for (var name in list.filterVals)
		// if (list.filterVals[name] != "")
		// {
			// hasFilter = true;
			
			// break;
		// }
	
	// if (!hasFilter)
		// list.drawTable()
	// else
		// list.drawFilterTable();
		
	list.drawFilterTable()
}

var _securityTable = new scrollTable(),
	_securityTableSuggest = new scrollTable();

var _security = new security(),
	_mapSecurity = new mapSecurity(),
	_layerSecurity = new layerSecurity(),
	_multiLayerSecurity = new multiLayerSecurity();
