//рисует диалог со списком карт.
//позволяет загрузить карту, просмотреть слои карты, перетащить слой в текущую карту
!(function(_){

nsGmx.MapsManagerControl = function()
{
    var _this = this;
    this._activeIndex = 0;
    this._mapsTable = new nsGmx.ScrollTable();
    this._canvas = _div(null, [['attr','id','mapsList']]);
    this._mapPreview = null;
    
    $(this._canvas).append('<div class="gmx-icon-progress"></div>');
    
    this._dialogDiv = showDialog(_gtxt("Список карт"), this._canvas, 571, 360, 535, 130, this._resize.bind(this));
    
    sendCrossDomainJSONRequest(serverBase + "Map/GetMaps.ashx?WrapStyle=func", function(response)
    {
        $(_this._canvas).empty();
        
        if (!parseResponse(response))
            return;

        _this._drawMapsDialog(response.Result);
    })
    this._previewMapName = null;
}

nsGmx.MapsManagerControl.prototype._resize = function() {
    var canvas = this._canvas,
        mapsTable = this._mapsTable,
        mapPreview = this._mapPreview;
        
    var dialogWidth = canvas.parentNode.parentNode.offsetWidth;
    mapsTable.tableParent.style.width = dialogWidth - 15 - 21 + 'px';
    mapsTable.tableBody.parentNode.parentNode.style.width = dialogWidth + 5 - 21 + 'px';
    mapsTable.tableBody.parentNode.style.width = dialogWidth - 15 - 21 + 'px';

    mapsTable.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = dialogWidth - 12 - 21 + 'px';

    mapsTable.tableParent.style.height = '200px';
    mapsTable.tableBody.parentNode.parentNode.style.height = '170px';
    
    if (mapPreview) {
        mapPreview.style.height = canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - 250 + 'px';
        mapPreview.style.width = dialogWidth + 5 - 21 + 'px';
    }
}

nsGmx.MapsManagerControl.prototype._drawMapsDialog = function(mapsList)
{
    var searchUITemplate = Handlebars.compile(
        '<div class="mapslist-search">' +
            '<table class="mapslist-search-table"><tr>' +
                '<td>' +
                    '{{i "Название"}}<input class="inputStyle mapslist-search-name">' +
                '</td><td>' +
                    '{{i "Владелец"}}<input class="inputStyle mapslist-search-owner">' +
                '</td>' +
            '</tr></table>' +
        '</div>');
        
    var searchCanvas = $(searchUITemplate())[0];
	var canvas = this._canvas,
		name = 'maps',
        mapsTable = this._mapsTable,
		_this = this;
	
	var mapNameInput = $('.mapslist-search-name', searchCanvas)[0],
        mapOwnerInput = $('.mapslist-search-owner', searchCanvas)[0];
	_(canvas, [searchCanvas]);
	
	var tableParent = _div(),
		sortFuncs = {};
			
	var sign = function(n1, n2) { return n1 < n2 ? -1 : (n1 > n2 ? 1 : 0) };
	var sortFuncFactory = function(f1, f2) {
		return [
			function(_a,_b){ return sign(f1(_a), f1(_b)) || sign(f2(_a), f2(_b)); },
			function(_b,_a){ return sign(f1(_a), f1(_b)) || sign(f2(_a), f2(_b)); }
		]
	}
	
    var idFunc = function(_a){ return _a.Name; };
    var titleFunc = function(_a){ return String(_a.Title).toLowerCase(); };
    var ownerFunc = function(_a){ return String(_a.Owner).toLowerCase(); };
    var dateFunc  = function(_a){ return _a.LastModificationDateTime; };
    
	sortFuncs[_gtxt('Имя')]                 = sortFuncFactory(titleFunc, idFunc);
	sortFuncs[_gtxt('Владелец')]            = sortFuncFactory(ownerFunc, idFunc);
	sortFuncs[_gtxt('Последнее изменение')] = sortFuncFactory(dateFunc, idFunc);
	
	mapsTable.createTable(tableParent, name, 410, ["", _gtxt("Имя"), _gtxt("Владелец"), _gtxt("Последнее изменение"), ""], ['5%', '55%', '15%', '15%', '5%'], function(map, i)
    {
        return _this._drawMaps.call(this, map, i, _this);
    }, sortFuncs);
    
    mapsTable.getDataProvider().setSortFunctions(sortFuncs);
	
	var inputPredicate = function(value, fieldValue)
    {
        return !!value && String(value).toLowerCase().indexOf(fieldValue) > -1;
    };

    $([mapNameInput, mapOwnerInput]).bind('keydown', function(event) {
        var numItems = mapsTable.getVisibleItems().length;
        
        if (event.keyCode === 13) {
            var firstItem = mapsTable.getVisibleItems()[_this._activeIndex];
            firstItem && window.location.replace(window.location.href.split(/\?|#/)[0] + "?" + firstItem.Name);
        }
        
        if (event.keyCode === 38) {
            _this._activeIndex = Math.max(0, Math.min(_this._activeIndex - 1, numItems - 1));
            $(mapsTable.getDataProvider()).change();
            event.preventDefault();
        }
        
        if (event.keyCode === 40) {
            _this._activeIndex = Math.max(0, Math.min(_this._activeIndex + 1, numItems - 1));
            $(mapsTable.getDataProvider()).change();
            event.preventDefault();
        }
    })
    
	mapsTable.getDataProvider().attachFilterEvents(mapNameInput, 'Title', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "") {
			return vals;
        }
        
        fieldValue = fieldValue.toLowerCase();
		
        return vals.filter(function(value) {
            return inputPredicate(value[fieldName], fieldValue) || value['Name'].toLowerCase() === fieldValue;
        });
	})
	
	mapsTable.getDataProvider().attachFilterEvents(mapOwnerInput, 'Owner', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "") {
			return vals;
        }
        
        fieldValue = fieldValue.toLowerCase();
        
        return vals.filter(function(value) {
            return inputPredicate(value[fieldName], fieldValue);
        });
	})

	_(canvas, [tableParent]);
	
	mapsTable.tableHeader.firstChild.childNodes[1].style.textAlign = 'left';

	this._resize();
	
	mapsTable.getDataProvider().setOriginalItems(mapsList);
	
	mapNameInput.focus();
}

nsGmx.MapsManagerControl.prototype._drawMaps = function(map, mapIndex, mapsManager)
{
	var name = makeLinkButton(map.Title),
        img_url = map.Name === mapsManager._previewMapName ? 'img/collapse-arrow-se.png' : 'img/collapse-arrow-right.gif',
		load = makeImageButton(img_url, img_url),
		remove = makeImageButton("img/recycle.png", "img/recycle_a.png");

	_title(name, _gtxt("Загрузить"));
	_title(load, _gtxt("Показать"));
	_title(remove, _gtxt("Удалить"));
	
    name.className = name.className + ' maps-manager-mapname';
	
	name.onclick = function()
	{
		window.location.replace(window.location.href.split(/\?|#/)[0] + "?" + map.Name);
	}
    
    nsGmx.ContextMenuController.bindMenuToElem(name, 'MapListItem', function(){return true;},
    {
        name: map.Name
	});
	
	load.onclick = function()
	{
		$(mapsManager._mapPreview).empty();
		
		var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]);
		
        if (!mapsManager._mapPreview) {
            mapsManager._mapPreview = _div(null, [['css','marginTop','5px'],['css','borderTop','1px solid #216B9C'],['css','overflowY','auto']]);
            $(mapsManager._canvas).append(mapsManager._mapPreview);
            $(mapsManager._dialogDiv).dialog('option', 'height', 550);
            $(mapsManager._dialogDiv).dialog('option', 'minHeight', 550);
            mapsManager._resize();
            
        }
		_(mapsManager._mapPreview, [loading]);
        

		// раз уж мы список получили с сервера, то и карты из этого списка точно нужно загружать с него же...
		mapsManager._loadMapJSON(window.serverBase, map.Name, mapsManager._mapPreview); 

        $(mapsManager._mapsTable.getDataProvider()).change();
	}
	
	remove.onclick = function()
	{
		if (map.Name == defaultMapID)
		{
			showErrorMessage(_gtxt("$$phrase$$_14"), true)
			
			return;
		}
		
		if (map.Name == globalMapName)
		{
			showErrorMessage(_gtxt("$$phrase$$_15"), true)
			
			return;
		}
		
		if (confirm(_gtxt("Вы действительно хотите удалить эту карту?")))
		{
			var loading = loading = _div([_img(null, [['attr','src','img/progress.gif']]), _t(_gtxt('удаление...'))], [['css','marginLeft','5px']]);
		
			$(remove.parentNode.parentNode).replaceWith(_tr([_td([loading], [['attr','colSpan', 5]])]))
			
			sendCrossDomainJSONRequest(serverBase + "Map/Delete.ashx?WrapStyle=func&MapID=" + map.MapID, function(response){mapsManager._deleteMapHandler(response, map.MapID)});
		}
	}
	
	var date = new Date(map.LastModificationDateTime*1000);
	var modificationDateString = $.datepicker.formatDate('dd.mm.yy', date); // + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	
	var tr = _tr([
		_td([load], [['css','textAlign','center']]), 
		_td([name]), 
		_td([_t(map.Owner)], [['css','textAlign','center'],['dir','className','invisible maps-manager-owner'], ['dir','title',map.Owner]]), 
		_td([_t(modificationDateString)], [['css','textAlign','center'],['dir','className','invisible']]), 
		_td([remove], [['css','textAlign','center']])
	]);
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this._fields[i].width;
	
	attachEffects(tr, 'hover');
    
    if (mapsManager._activeIndex === mapIndex) {
        $(tr).addClass('maps-manager-active');
    }
	
	return tr;
}

nsGmx.MapsManagerControl.prototype._deleteMapHandler = function(response, id)
{
	if (!parseResponse(response))
		return;
	
    var mapsTable = this._mapsTable;
    
	if (response.Result == 'deleted')
	{
        mapsTable.start = 0;
		mapsTable.reportStart = mapsTable.start * mapsTable.limit;
        mapsTable.getDataProvider().filterOriginalItems(function(elem)
		{
			return elem.MapID != id;
		});
	}
	else
		showErrorMessage(_gtxt("Ошибка!"), true, _gtxt("Слоя нет в базе"))
}

nsGmx.MapsManagerControl.prototype._loadMapJSON = function(host, name, parent)
{
	//loadMapJSON(host, name, function(layers)
    this._previewMapName = name;
    
    var hostName = L.gmxUtil.normalizeHostname(host),
        apiKey = window.mapsSite ? window.apiKey : null; //передаём apiKey только если не локальная версия ГеоМиксера
    
    L.gmx.gmxMapManager.getMap(hostName, apiKey, name, window.gmxSkipTiles).then(function(mapInfo) {
        var previewLayersTree = new layersTree({showVisibilityCheckbox: false, allowActive: false, allowDblClick: false}),
            ul = previewLayersTree.drawTree(mapInfo, 2);

        $(ul).treeview();

        //раскрываем группы по клику
        $(ul).click(function(event) {
            if ($(event.target).hasClass('groupLayer')) {
                var clickDiv = $(event.target.parentNode.parentNode.parentNode).children("div.hitarea");
                clickDiv.length && $(clickDiv[0]).trigger('click');
            }
        })
		
		$(parent).empty();
        
        var hint = $('<div class="mapslist-hint">' + _gtxt('maplist.hint') + '</div>');

		_(parent, [hint[0], ul]);
		
		_queryMapLayers.addDraggable(parent);
	})
}

nsGmx.ContextMenuController.addContextMenuElem({
    title: function() { return "Открыть в новом окне"; },
    clickCallback: function(context)
    {
        window.open(window.location.href.split(/\?|#/)[0] + "?" + context.name, '_blank');
    }
}, 'MapListItem');

})(nsGmx.Utils._);