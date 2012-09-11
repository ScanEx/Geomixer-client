/*

1. Получение размера таблицы
-> Params:
{
	name: "name", // имя таблицы
	query: "\"Attr1\" = 'abc' AND \"Attr2\" in (2,3)" // запрос
}
<- Result:
1234 // число записей, удовлетворяющих запросу

2. Получение содержимого таблицы
-> Params:
{
	name: "name", // имя таблицы
	offset: 0, // начиная с какой записи
	limit: 50, // сколько записей
	query: "\"Attr1\" = 'abc' AND \"Attr2\" in (2,3)", // запрос
	sortAttr: "Attr1", // имя атрибута, по которому производить сортировку (по умолчанию layer.properties.identityField || ogc_fid)
	sortOrder: 0 // направление сортировки (по умолчанию - по возрастанию)
}

<- Result:
{
	fields: ["Attr1","Attr2", ..., "AttrN"], // заголовок таблицы, поле ogc_fid всегда идут первыми
	data: [["Value01","Value02", ..., "Value0N"], ["Value11","Value12", ..., "Value1N"], ..., ["ValueK1","ValueK2", ..., "ValueKN"]] // сами данные
}

*/

(function(){

var ServerDataProvider = function(params)
{
    var _params = $.extend({defaultSortParam: 'ogc_fid'}, params);
    var _countRequest = null;
    var _dataRequest = null;
    
    //IDataProvider interface
    this.getCount = function(callback)
    {
        if (!_countRequest)
        {
            callback();
            return;
        }
        
        sendCrossDomainJSONRequest(_countRequest, function(response)
        {
            if (!parseResponse(response))
            {
                callback();
                return;
            }
            callback(response.Result);
        })
    }
    
    this.getItems = function(page, pageSize, sortParam, sortDec, callback)
    {
        if (!_dataRequest)
        {
            callback();
            return;
        }
        
        var offset = "&page=" + page,
            limit = "&pagesize=" + pageSize,
            sortAttr = "&orderby=" + (sortParam || _params.defaultSortParam),
            sortOrder = "&orderdirection=" + (sortDec ? "DESC" : "ASC");
            
        sendCrossDomainJSONRequest(_dataRequest + offset + limit + sortAttr + sortOrder, function(response)
        {
            if (!parseResponse(response))
            {
                callback();
                return;
            }
            
            var fieldsSet = {};
            
            if (response.Result.fields)
            {
                for (var f = 0; f < response.Result.fields.length; f++)
                    fieldsSet[response.Result.fields[f]] = { index: f, type: response.Result.types[f] };
            }
            
            var res = [];
            for (var i = 0; i < response.Result.values.length; i++)
                res.push({
                    fields: fieldsSet,
                    values: response.Result.values[i]
                });
            
            callback(res);
        })
    }
    
    //Задание запросов
    this.setRequests = function(countRequest, dataRequest)
    {
        _countRequest = countRequest;
        _dataRequest = dataRequest;
        $(this).change();
    }
    
    this.serverChanged = function()
    {
        $(this).change();
    }
}

ServerDataProvider.convertValuesToHash = function(objParameters)
{
    var resHash = {};
    for (var i in objParameters.fields)
        resHash[i] = objParameters.values[objParameters.fields[i].index];
        
    return resHash;
}

var attrsTable = function(layerName, layerTitle)
{
	this.layerName = layerName;
	this.layerId = globalFlashMap.layers[layerName].properties.LayerID;
	this.layerTitle = layerTitle;
	
	this.filterData = null;
	
	this.textarea = null;
	this.activeColumns = null;
	
	this._identityField = globalFlashMap.layers[layerName].properties.identityField;
	
	this.resizeFunc = function(){};
    
    this._listenerId = null;
}

attrsTable.prototype.getInfo = function()
{
    var _this = this;
    
	if ($$('attrsTableDialog' + this.layerName))
		return;
	
	var canvas = _div(null,[['attr','id','attrsTableDialog' + this.layerName]])
		loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]),
		_this = this;
	
	_(canvas, [loading])

	showDialog(_gtxt("Таблица атрибутов слоя [value0]", this.layerTitle), canvas, 
        {
            width: 800, 
            height: 500, 
            resizeFunc: function()
            {
                _this.resizeFunc.apply(_this,arguments)
            },
            closeFunc: function()
            {
                if (_this._listenerId !== null)
                    globalFlashMap.layers[_this.layerName].removeListener( 'onChangeLayerVersion', _this._listenerId );
            },
            setMinSize: false
        }
    )
	
	sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerInfo.ashx?WrapStyle=func&LayerID=" + this.layerId, function(response)
	{
		if (!parseResponse(response))
			return;
		
		loading.removeNode(true);
		
		_this.drawDialog(response.Result);
	})
}

attrsTable.prototype.drawDialog = function(info)
{
	var canvas = $$('attrsTableDialog' + info.Name),
		paramsWidth = 300,
		tdParams = _td(null,[['css','width',paramsWidth + 'px'],['attr','vAlign','top']]),
		tdTable = _td(null, [['attr','vAlign','top']]),
		columnsList = _div(null, [['css','overflowY','auto'],['css','width',paramsWidth - 21 + 'px']]),
		paramsButton = makeLinkButton(_gtxt("Показать параметры поиска")),
		searchButton = makeButton(_gtxt("Найти")),
		cleanButton = makeButton(_gtxt("Очистить поиск")),
		addObjectButton = makeLinkButton(_gtxt("Добавить объект")),
		oldCanvasWidth = false,
		_this = this;
	
    this._serverDataProvider = new ServerDataProvider();
    var updateSearchString = function()
    {
        _this._serverDataProvider.setRequests(
            serverBase + "VectorLayer/Search.ashx?WrapStyle=func&count=true&layer=" + _this.layerName + "&query=" + encodeURIComponent(_this.textarea.value),
            serverBase + "VectorLayer/Search.ashx?WrapStyle=func&layer=" + _this.layerName + "&query=" + encodeURIComponent(_this.textarea.value)
        );
    }
    
	paramsButton.onclick = function()
	{
		oldCanvasWidth = canvas.parentNode.parentNode.offsetWidth;
		
		if (tdParams.style.display == 'none')
		{
			this.innerHTML = _gtxt("Скрыть параметры поиска");
			tdParams.style.display = '';
		}
		else
		{
			this.innerHTML = _gtxt("Показать параметры поиска");
			tdParams.style.display = 'none';
		}
		
		resizeFunc();
	}
	
	searchButton.onclick = function()
	{
		_this.offset = 0;
        updateSearchString();
	}
	
	cleanButton.onclick = function()
	{
		_this.textarea.value = "";
		_this.offset = 0;
        updateSearchString();
	}	
	
	addObjectButton.onclick = function()
	{
        new nsGmx.EditObjectControl(_this.layerName);
	}
	
	addObjectButton.style.marginLeft = '20px';
	
	tdParams.style.display = 'none';
	
	var name = 'attrsTable' + info.Name;
                        
	var attrNames = [this._identityField].concat(globalFlashMap.layers[info.Name].properties.attributes);
    var fielsWidth = [""];
    var attrNamesHash = {};
    for (var f = 0; f < attrNames.length; f++)
    {
        fielsWidth.push("");
        attrNamesHash[attrNames[f]] = true;
    }
                        
    this.divTable2 = _div(null, [['css','overflow','auto'], ['dir', 'className', 'attrsTableBody']]);
    var tdTable2 = _td([this.divTable2], [['attr','vAlign','top']]);
    this.table2 = new scrollTable({pagesCount: 10, limit: 20});
    var drawTableItem2 = function(elem, curIndex, activeHeaders)
    {
        tds = [];

        var showButton = makeImageButton('img/choose.png','img/choose_a.png'),
            editButton = makeImageButton('img/edit.png'),
            deleteButton = makeImageButton("img/recycle.png", "img/recycle_a.png"),
            tdControl = _td([_div([showButton, editButton, deleteButton],[['css','width','45px']])]);
        
        editButton.style.marginLeft = '5px';
        editButton.style.width = '12px';
        deleteButton.style.marginLeft = '5px';

        editButton.onclick = function()
        {
            var id = elem.values[elem.fields[_this._identityField].index];
            new nsGmx.EditObjectControl(_this.layerName, id);
        }
        
        deleteButton.onclick = function()
        {
            var remove = makeButton(_gtxt("Удалить"));
            remove.onclick = function()
            {
                var id = elem.values[elem.fields[_this._identityField].index];
                var objects = JSON.stringify([{action: 'delete', id: id}]);
                sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", {WrapStyle: 'window', LayerName: _this.layerName, objects: objects}, function(response)
                {
                    if (!parseResponse(response))
                        return;
                    
                    removeDialog(jDialog);
                    globalFlashMap.layers[_this.layerName].chkLayerVersion();
                });
            };
            
            var jDialog = showDialog(_gtxt("Удалить объект?"), _div([remove],[['css','textAlign','center']]), 150, 60);
        }
        
        showButton.onclick = function()
        {
            globalFlashMap.layers[_this.layerName].getFeatureById(elem.values[0], function(result)
            {
                globalFlashMap.layers[_this.layerName].setVisible(true);
                
                var bounds = getBounds(result.geometry.coordinates);
                globalFlashMap.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
            }); 
        }
        
        _title(deleteButton, _gtxt("Удалить"))
        _title(editButton, _gtxt("Редактировать"))
        _title(showButton, _gtxt("Показать"))
        
        tds.push(tdControl);
        
        for (var j = 0; j < activeHeaders.length; ++j)
        {
            if (activeHeaders[j] == "")
                continue;
                
            if (activeHeaders[j] in elem.fields)
            {
                var valIndex = elem.fields[activeHeaders[j]].index,
                    td = _td();
                
                _(td, [_t(nsGmx.Utils.convertFromServer(elem.fields[activeHeaders[j]].type, elem.values[valIndex]))])
                
                if (elem.fields[activeHeaders[j]].type == 'integer')
                    td.style.textAlign = 'right';
                
                tds.push(td);
            }
            else
            {
                tds.push(_td());
            }
        }
        
        var tr = _tr(tds);
        
        if (curIndex % 2 != 0)
            tr.className = 'odd';
        
        return tr;
    }
    
	this.textarea = _textarea(null, [['dir','className','inputStyle'],['css','overflow','auto'],['css','width','280px'],['css','height','70px']]);
    
    updateSearchString();
    
    this.table2.setDataProvider(this._serverDataProvider);
    this.table2.createTable(this.divTable2, 'attrs', 0, [""].concat(attrNames), fielsWidth, drawTableItem2, attrNamesHash, true);
	
	_(canvas, [_div([paramsButton, addObjectButton],[['css','margin','10px 0px 10px 1px']])])
	_(canvas, [_table([_tbody([_tr([tdParams, tdTable2])])],['css','width','100%'])])
	
	
	var attrsSuggest = _mapHelper.createSuggestCanvas(attrNames, this.textarea, "\"suggest\"", function(){}, info.Attributes, true),
		valuesSuggest = _mapHelper.createSuggestCanvas(attrNames, this.textarea, "\"suggest\"", function(){}, info.Attributes),
		opsSuggest = _mapHelper.createSuggestCanvas(['=','>','<','>=','<=','<>','AND','OR','NOT','IN','LIKE','()'], this.textarea, " suggest ", function(){});
		
	opsSuggest.style.width = '80px';
	$(opsSuggest).children().css('width','60px');
	
	var divAttr = _div([_t(_gtxt("Атрибут >")), attrsSuggest], [['dir','className','attrsHelperCanvas']]),
		divValue = _div([_t(_gtxt("Значение >")), valuesSuggest], [['dir','className','attrsHelperCanvas'],['css','marginLeft','10px']]),
		divOp = _div([_t(_gtxt("Операция >")), opsSuggest], [['dir','className','attrsHelperCanvas'],['css','marginLeft','10px']]),
		clickFunc = function(div)
		{
			if (document.selection)
			{
				_this.textarea.focus();
				var sel = document.selection.createRange();
				div.sel = sel;
				_this.textarea.blur();
			}
			
			$(divAttr.parentNode.parentNode.parentNode).find(".attrsHelperCanvas").children("[arr]").fadeOut(300, function()
			{
				$(this).remove();
			})
		};

	divAttr.onclick = function()
	{
		clickFunc(attrsSuggest);
		
		$(attrsSuggest).fadeIn(300);
		$(valuesSuggest).fadeOut(300);
		$(opsSuggest).fadeOut(300);
		
		return true;
	}
	
	divValue.onclick = function()
	{
		clickFunc(valuesSuggest);
		
		$(valuesSuggest).fadeIn(300);
		$(attrsSuggest).fadeOut(300);
		$(opsSuggest).fadeOut(300);
		
		return true;
	}
	
	divOp.onclick = function()
	{
		clickFunc(opsSuggest);
		
		$(opsSuggest).fadeIn(300);
		$(attrsSuggest).fadeOut(300);
		$(valuesSuggest).fadeOut(300);
		
		return true;
	}
	
	this.textarea.onclick = function()
	{
		$(attrsSuggest).fadeOut(300);
		$(valuesSuggest).fadeOut(300);
		$(opsSuggest).fadeOut(300);
		
		if (divAttr.childNodes.length > 2)
			divAttr.lastChild.removeNode(true);
		if (divValue.childNodes.length > 2)
			divValue.lastChild.removeNode(true);
		
		return true;
	}
	
	var suggestCanvas = _table([_tbody([_tr([_td([_div([divAttr],[['css','position','relative']])]),
											 _td([_div([divValue],[['css','position','relative']])]),
											 _td([_div([divOp],[['css','position','relative']])])])])],[['css','margin','0px 3px']]);
	_(tdParams, [_div([_div([_t(_gtxt("SQL-условие WHERE"))],[['css','fontSize','12px'],['css','margin','7px 0px 3px 1px']]), this.textarea, suggestCanvas],[['attr','filterTable',true]])])
	
	_(tdParams, [_div([_t(_gtxt("Показывать столбцы") + ":")],[['css','fontSize','12px'],['css','margin','7px 0px 3px 1px']])])
	
	var columnsNames = [].concat(attrNames);
	
	if (!this.activeColumns)
	{
		this.activeColumns = {};
		
		for (var i = 0; i < attrNames.length; ++i)
			this.activeColumns[attrNames[i]] = true;
	}
		
	for (var i = 0; i < columnsNames.length; ++i)
	{
		var box = _checkbox(this.activeColumns[columnsNames[i]], 'checkbox'),
			columnName = _div([box, _span([_t(columnsNames[i])],[['css','margin','3px'],['css','fontSize','12px']])], [['css','width',paramsWidth - 42 + 'px'],['css','overflowX','hidden'],['css','whiteSpace','nowrap'],['css','margin','4px 0px 2px 3px']]);
		
		_title(columnName, columnsNames[i])
		
		box.className = 'box';
		if ($.browser.msie)
			box.style.margin = '-3px -2px 0px -2px';
		
		(function(columnsName)
		{
			box.onclick = function()
			{
				_this.activeColumns[columnsName] = this.checked;
				_this.table2.activateField(columnsName, this.checked);
			}
		})(columnsNames[i])
		
		_(columnsList, [columnName])
	}	
	
	_(tdParams, [columnsList]);
	
	searchButton.style.marginRight = '17px';
	cleanButton.style.marginRight = '3px';
	_(tdParams, [_div([cleanButton, searchButton],[['css','textAlign','right'],['css','margin','5px 0px 0px 0px'],['css','width',paramsWidth + 'px']])])
	
	var resizeFunc = function(event, ui)
	{
		var dialogWidth = oldCanvasWidth ? oldCanvasWidth : canvas.parentNode.parentNode.offsetWidth;
		
		oldCanvasWidth = false;
		
		canvas.childNodes[1].style.width = dialogWidth - 21 - 10 + 'px';
		tdTable2.style.width = dialogWidth - tdParams.offsetWidth - 21 - 10 + 'px';
		_this.divTable2.style.width = dialogWidth - tdParams.offsetWidth - 21 - 10 + 'px';
		
		_this.divTable2.style.height = canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - 25 - 10 - 30 + 'px';
		columnsList.style.height = _this.divTable2.offsetHeight - tdParams.firstChild.offsetHeight - tdParams.childNodes[1].offsetHeight - 25 + 'px';
	}
	
	this.resizeFunc = resizeFunc;
	
	resizeFunc();
	
	this.columnsNames = columnsNames;
    
	this._listenerId = globalFlashMap.layers[this.layerName].addListener('onChangeLayerVersion', 
        function() {
            _this._serverDataProvider.serverChanged();
        }
    );
}

attrsTable.prototype.showLoading = function()
{
	//this.tableParent.style.display = 'none';
	//this.tableLimit.parentNode.parentNode.parentNode.parentNode.style.display = 'none';
	
	//var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px'],['attr','loading',true]]);
	
	//_(this.tableParent.parentNode, [loading])
}

attrsTable.prototype.hideLoading = function()
{
	// this.tableParent.style.display = '';
	// this.tableLimit.parentNode.parentNode.parentNode.parentNode.style.display = '';
	
	// $(this.tableParent.parentNode).children("[loading]").remove();
}

var attrsTableHash = function()
{
	this.hash = {};
}

attrsTableHash.prototype.create = function(name)
{
	if (name in this.hash)
	{
		this.hash[name].getInfo();
	}
	else
	{
		var properties = globalFlashMap.layers[name].properties,
			newAttrsTable = new attrsTable(properties.name, properties.title);
		
		newAttrsTable.getInfo();
		
		this.hash[name] = newAttrsTable;
	}
}

scrollTable.AttributesServerDataProvider = ServerDataProvider;

window._attrsTableHash = new attrsTableHash();

})();