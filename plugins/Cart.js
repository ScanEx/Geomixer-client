(function($){
	var pluginPath;
	_translationsHash.addtext("rus", {
		"Корзина": "Корзина",
		"Отправить заказ": "Отправить заказ",
		"Общая сумма:": "Общая сумма:"
	});
	_translationsHash.addtext("eng", {
		"Корзина": "Cart",
		"Отправить заказ": "Send order",
		"Общая сумма:": "Total price:"
	});
	
	var arrMapObjects = {};
	var oCartDiv = _div(null, [['attr', 'Title', _gtxt("Корзина")]]);
	var oItemList = _div();
	var oItemSummary = _div();
	var oCommentInput = _textarea(null, [['css', 'width', '100%']]);

	var oSendButton = _a([_t(_gtxt('Отправить заказ'))], [['attr', 'href', 'mailto:sales@scanex.ru']]);
	_(oCartDiv, [oItemList, oItemSummary, _br(), oCommentInput, _br(), oSendButton]);
		
	var drawRow = function(id){
		var oMapObject = arrMapObjects[id].mapObject;
		var price = arrMapObjects[id].price;
		
		var oContainer = _div(null, [['css', 'position', 'relative']]);
		var oItem = _span([_t(oMapObject.properties.scene_id)]);
		var oPrice = _span([_t("$" + price.toString())], [['css', 'position', 'absolute'], ['css', 'right', '15px']]);
		
		var remove = makeImageButton('img/closemin.png','img/close_orange.png');
		remove.setAttribute('title', _gtxt('Удалить'));
		remove.style.right = '0px';
		remove.style.top = '-2px';
		remove.style.position = 'absolute';
		_(oContainer, [oItem, oPrice, remove]);
		_(oItemList, [oContainer]);
		remove.onclick = function(){
			delete arrMapObjects[id];
			drawList();
		}
	}

	var totalPrice = 0;
	var idsString = "";
	
	var updateSendLink = function(){
		var sSubject = escape("Ikonos_pikkolo order");
		var sBody = escape("Login: " + nsGmx.AuthManager.getUserName() + "\nComment:\n" + oCommentInput.value);
		if (idsString != ""){sBody += escape("\nscene_ids: " + idsString);}
		
		oSendButton.href = "mailto:sales@scanex.ru?subject=" + sSubject + "&body=" + sBody;
	}
	oCommentInput.onblur = updateSendLink;

	var drawList = function(){
		totalPrice = 0;
		idsString = "";
		removeChilds(oItemList);
		removeChilds(oItemSummary);
		
		for (var id in arrMapObjects){
			drawRow(id);
			totalPrice += arrMapObjects[id].price;
			idsString += id + ";";
		}
		if (totalPrice > 0){
			var totalPrice = _span([_t("$" + Math.round(totalPrice*100)/100)], [['css', 'position', 'absolute'], ['css', 'right', '15px']]); //Бывает ошибка округления
			var oSummary = _div([_t(_gtxt("Общая сумма:")), totalPrice])
			oSummary.style.borderTop = '1px solid';
			_(oItemSummary, [oSummary]);
		}
		updateSendLink();
	}
	
	var addToCart = function(oMapObject){
		if (oMapObject.properties.scene_id in arrMapObjects) return;
		arrMapObjects[oMapObject.properties.scene_id] = {
			mapObject: oMapObject,
			price: Math.round(oMapObject.getArea()/10000)/100
		}
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

	gmxCore.addModule("Cart", publicInterface, {init: function(module, path)
		{
			pluginPath = path;
		}
	});
})(jQuery)