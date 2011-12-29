(function($, oMap){
	var pluginPath;
	_translationsHash.addtext("rus", {
		"Корзина": "Корзина",
		"Отправить заказ": "Отправить заказ",
		"Общая сумма:": "Общая сумма:",
		"Корзина пуста": "Корзина пуста"
	});
	_translationsHash.addtext("eng", {
		"Корзина": "Cart",
		"Отправить заказ": "Send order",
		"Общая сумма:": "Total price:",
		"Корзина пуста": "Cart is empty"
	});
	
	var arrCartObjects = {};
	var oCartDiv = _div(null, [['attr', 'Title', _gtxt("Корзина")]]);
	var oItemList = _div();
	var oItemSummary = _div();
	var oCommentInput = _textarea(null, [['css', 'width', '100%']]);

	var oSendButton = makeLinkButton(_gtxt('Отправить заказ'));
	_(oCartDiv, [oItemList, oItemSummary, _br(), oCommentInput, _br(), oSendButton]);
		
	var drawRow = function(id){
		var title = arrCartObjects[id].title;
		var price = arrCartObjects[id].price;
		
		var oContainer = _div(null, [['css', 'position', 'relative']]);
		var oItem = makeLinkButton(title);
		var oPrice = _span([_t("$" + price.toString())], [['css', 'position', 'absolute'], ['css', 'right', '15px']]);
		
		var remove = makeImageButton('img/closemin.png','img/close_orange.png');
		remove.setAttribute('title', _gtxt('Удалить'));
		remove.style.right = '0px';
		remove.style.top = '-2px';
		remove.style.position = 'absolute';
		_(oContainer, [oItem, oPrice, remove]);
		_(oItemList, [oContainer]);
		remove.onclick = function(){
			delete arrCartObjects[id];
			drawList();
		}
		oItem.onclick = function(){
			var oExtent = getBounds(arrCartObjects[id].geometry.coordinates);
			oMap.zoomToExtent(oExtent.minX, oExtent.minY, oExtent.maxX, oExtent.maxY);
		}
	}

	var totalPrice = 0;
	var idsString = "";
	
	oSendButton.onclick = function(){
		if (idsString == ""){alert("Корзина пуста"); return;}
		_mapHelper.createPermalink(function(id){
			var permalinkUrl = "http://" + window.location.host + window.location.pathname + "?permalink=" + id;
			var EMail = nsGmx.AuthManager.isAccounts() ? escape(nsGmx.AuthManager.getUserName()) : escape("sales@scanex.ru");
			Url = "http://search.kosmosnimki.ru/CreateOrder.ashx?TinyReference=" + escape(permalinkUrl) + "&Surname=" + escape(nsGmx.AuthManager.getUserName()) + "&Name=TilesOrder&Organization=TilesOrder&Email=" + EMail +"&Phone=TilesOrder&Comment=" + escape(oCommentInput.value) + "&ReceiveWay=Tiles";
			location.replace(Url);
		});
		
	}

	var drawList = function(){
		totalPrice = 0;
		idsString = "";
		removeChilds(oItemList);
		removeChilds(oItemSummary);
		
		for (var id in arrCartObjects){
			drawRow(id);
			totalPrice += arrCartObjects[id].price;
			idsString += id + ";";
		}
		if (totalPrice > 0){
			var totalPrice = _span([_t("$" + Math.round(totalPrice*100)/100)], [['css', 'position', 'absolute'], ['css', 'right', '15px']]); //Бывает ошибка округления
			var oSummary = _div([_t(_gtxt("Общая сумма:")), totalPrice])
			oSummary.style.borderTop = '1px solid';
			_(oItemSummary, [oSummary]);
		}
	}
	
	var addToCart = function(oCartObject){
		if (oCartObject.title in arrCartObjects) return;
		arrCartObjects[oCartObject.title] = oCartObject;

		drawList();
		loadMenu();
	}
	
	var loadMenu = function(){
		$(oCartDiv).dialog();
	}
	
	var addMenuItems = function(){
		return [{item: {id:'Cart', title:_gtxt('Корзина'),func:loadMenu},
				parentID: 'servicesMenu'}];
	}
	var publicInterface = {
		addMenuItems: addMenuItems,
		loadMenu: loadMenu,
		addToCart: addToCart
	}

	_mapHelper.customParamsManager.addProvider({
		name: 'Cart',
		loadState: function(state) { for (var oCartObject in state.objectsInCart) { addToCart(state.objectsInCart[oCartObject]);} },
		saveState: function() { return { objectsInCart: arrCartObjects }; }
	});
				
	gmxCore.addModule("Cart", publicInterface, {init: function(module, path)
		{
			pluginPath = path;
		}
	});
})(jQuery, globalFlashMap)