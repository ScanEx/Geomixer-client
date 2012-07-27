//рисует диалог со списком карт.
//позволяет загрузить карту, просмотреть слои карты, перетащить слой в текущую карту
(function(){

nsGmx.MapsManagerControl = function()
{
    var _this = this;
    sendCrossDomainJSONRequest(serverBase + "Map/GetMaps.ashx?WrapStyle=func", function(response)
    {
        if (!parseResponse(response))
            return;

        _this._drawMapsDialog(response.Result);
    })
}

nsGmx.MapsManagerControl.prototype._drawMapsDialog = function(mapsList)
{
	var canvas = _div(null, [['attr','id','mapsList']]),
		searchCanvas = _div(null, [['dir','className','searchCanvas']]),
		name = 'maps',
		_this = this;
	
	var mapNameInput = _input(null, [['dir','className','inputStyle'],['css','width','160px']]);
	var mapOwnerInput = _input(null, [['dir','className','inputStyle'],['css','width','160px']]);
	
	_(searchCanvas, [_div([_table([_tbody([_tr([
        _td([_span([_t(_gtxt("Название"))],[['css','fontSize','12px']])],[['css','width','90px']]),
        _td([mapNameInput],[['css','width','170px']]),
        _td([_span([_t(_gtxt("Владелец"))],[['css','fontSize','12px']])],[['css','width','92px']]),
        _td([mapOwnerInput])
    ])])],[['css','width','100%']])], [['css','marginBottom','10px']])]);
	
	_(canvas, [searchCanvas]);
	
	var tableParent = _div(),
		sortFuncs = {};
			
	var sign = function(n1, n2) { return n1 < n2 ? -1 : (n1 > n2 ? 1 : 0) };
	var sortFuncFactory = function(toNumFunc)
	{
		return [
			function(_a,_b){ return sign(toNumFunc(_a), toNumFunc(_b)); },
			function(_a,_b){ return sign(toNumFunc(_b), toNumFunc(_a)); }
		]
	}
	
	sortFuncs[_gtxt('Имя')]                 = sortFuncFactory(function(_a){ return String(_a.Title).toLowerCase(); });
	sortFuncs[_gtxt('Владелец')]            = sortFuncFactory(function(_a){ return String(_a.Owner).toLowerCase(); });
	sortFuncs[_gtxt('Последнее изменение')] = sortFuncFactory(function(_a){ return _a.LastModificationDateTime });
	
	_mapsTable.createTable(tableParent, name, 410, ["", "", _gtxt("Имя"), _gtxt("Владелец"), _gtxt("Последнее изменение"), ""], ['5%', '5%', '55%', '15%', '15%', '5%'], function(map)
        {
            return _this._drawMaps.call(this, map, _this);
        }, sortFuncs);
    _mapsTable.getDataProvider().setSortFunctions(sortFuncs);
	
	var inputPredicate = function(value, fieldName, fieldValue)
		{
			if (!value[fieldName])
				return false;
		
			return String(value[fieldName]).toLowerCase().indexOf(fieldValue.toLowerCase()) > -1;
		};
	
	_mapsTable.getDataProvider().attachFilterEvents(mapNameInput, 'Title', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var filterFunc = function(value)
				{
					return inputPredicate(value, fieldName, fieldValue) || inputPredicate(value, 'Name', fieldValue);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
	
	_mapsTable.getDataProvider().attachFilterEvents(mapOwnerInput, 'Owner', function(fieldName, fieldValue, vals)
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
	
	this._mapPreview = _div(null, [['css','marginTop','5px'],['css','borderTop','1px solid #216B9C'],['css','overflowY','auto']]);
	
	_(canvas, [this._mapPreview]);
	
	var resize = function()
	{
		_mapsTable.tableParent.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';
		_mapsTable.tableBody.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 15 - 21 + 'px';
		_mapsTable.tableBody.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';

		_mapsTable.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 12 - 21 + 'px';

		_mapsTable.tableParent.style.height = '200px';
		_mapsTable.tableBody.parentNode.parentNode.style.height = '170px';
		
		_this._mapPreview.style.height = canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - 250 + 'px';
		_this._mapPreview.style.width = canvas.parentNode.parentNode.offsetWidth - 15 - 21 + 'px';
	}
		
	showDialog(_gtxt("Список карт"), canvas, 571, 470, 535, 130, resize);
	
	_mapsTable.tableHeader.firstChild.childNodes[1].style.textAlign = 'left';

	resize();
	
	_mapsTable.getDataProvider().setOriginalItems(mapsList);
	
	mapNameInput.focus();
}

nsGmx.MapsManagerControl.prototype._drawMaps = function(map, mapsManager)
{
	var name = makeLinkButton(map.Title),
		load = makeImageButton("img/choose.png", "img/choose_a.png"),
		addExternal = makeImageButton("img/prev.png", "img/prev_a.png"),
		remove = makeImageButton("img/recycle.png", "img/recycle_a.png");
	
	_title(name, _gtxt("Загрузить"));
	_title(load, _gtxt("Показать"));
	_title(addExternal, _gtxt("Добавить"));
	_title(remove, _gtxt("Удалить"));
	
	name.style.textDecoration = 'none';
	
	name.onclick = function()
	{
		window.location.replace(window.location.href.split(/\?|#/)[0] + "?" + map.Name);
	}
	
	load.onclick = function()
	{
		removeChilds(mapsManager._mapPreview);
		
		var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]);
		
		_(mapsManager._mapPreview, [loading]);
		
		// раз уж мы список получили с сервера, то и карты из этого списка точно нужно загружать с него же...
		mapsManager._loadMapJSON(window.serverBase, map.Name, mapsManager._mapPreview); 
	}
	
	addExternal.onclick = function()
	{
		_queryExternalMaps.addMapElem(_layersTree.treeModel.getMapProperties().hostName, map.Name);
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
		_td([addExternal], [['css','textAlign','center']]), 
		_td([load], [['css','textAlign','center']]), 
		_td([name]), 
		_td([_t(map.Owner)], [['css','textAlign','center'],['dir','className','invisible']]), 
		_td([_t(modificationDateString)], [['css','textAlign','center'],['dir','className','invisible']]), 
		_td([remove], [['css','textAlign','center']])
	]);
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this._fields[i].width;
	
	attachEffects(tr, 'hover')
	
	return tr;
}

nsGmx.MapsManagerControl.prototype._deleteMapHandler = function(response, id)
{
	if (!parseResponse(response))
		return;
	
	if (response.Result == 'deleted')
	{
        _mapsTable.start = 0;
		_mapsTable.reportStart = _mapsTable.start * _mapsTable.limit;
        _mapsTable.getDataProvider().filterOriginalItems(function(elem)
		{
			return elem.MapID != id;
		});
	}
	else
		showErrorMessage(_gtxt("Ошибка!"), true, _gtxt("Слоя нет в базе"))
}

nsGmx.MapsManagerControl.prototype._loadMapJSON = function(host, name, parent)
{
	loadMapJSON(host, name, function(layers)
	{
		var previewMapHelper = new mapHelper();
        var previewLayersTree = new layersTree({showVisibilityCheckbox: false, allowActive: false, allowDblClick: false});
		
		//previewMapHelper.mapTree = layers;
        previewMapHelper._treeView = previewLayersTree;
		previewLayersTree.mapHelper = previewMapHelper;
        
        var ul = previewLayersTree.drawTree(layers, 2);
		
		$(ul).treeview();
		
		removeChilds(parent);

		_(parent, [ul])
		
		_queryMapLayers.addDraggable(parent);
	})
}

})();