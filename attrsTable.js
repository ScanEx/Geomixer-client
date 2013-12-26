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
    var _countURL = null,
        _dataURL = null,
        _countParams = null,
        _dataParams = null;
    
    //IDataProvider interface
    this.getCount = function(callback)
    {
        if (!_countURL)
        {
            callback();
            return;
        }
        
        sendCrossDomainPostRequest(_countURL, _countParams, function(response)
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
        if (!_dataURL)
        {
            callback();
            return;
        }
        
        var offset = "&page=" + page,
            limit = "&pagesize=" + pageSize,
            sortAttr = "&orderby=" + (sortParam || _params.defaultSortParam),
            sortOrder = "&orderdirection=" + (sortDec ? "DESC" : "ASC");
            
        var params = $.extend({
            page: page,
            pagesize: pageSize,
            orderby: sortParam || _params.defaultSortParam,
            orderdirection: sortDec ? "DESC" : "ASC"
        }, _dataParams);
            
        sendCrossDomainPostRequest(_dataURL, params, function(response)
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
    this.setRequests = function(countURL, countParams, dataURL, dataParams)
    {
        _countURL = countURL;
        _countParams = countParams || {};
        _countParams.WrapStyle = 'message';
        
        _dataURL = dataURL;
        _dataParams = dataParams || {};
        _dataParams.WrapStyle = 'message';
        
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
	this.layerTitle = layerTitle || '';
	
	this.filterData = null;
	
	this.textarea = null;
	this.activeColumns = null;
	
	this.resizeFunc = function(){};
    
    this._listenerId = null;
    
    this._isLayerOnMap = !!globalFlashMap.layers[this.layerName];
}

attrsTable.prototype.getLayerInfo = function()
{
    return this.layerInfo;
}

attrsTable.prototype.getInfo = function(origCanvas, outerSizeProvider, params)
{
    var _this = this;
    
	if (!origCanvas && $$('attrsTableDialog' + this.layerName))
		return;
        
    origCanvas && $(origCanvas).empty();
	
	var canvas = origCanvas || _div(null,[['attr','id','attrsTableDialog' + this.layerName]])
		loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]),
		_this = this;
	
	_(canvas, [loading])

    if (!origCanvas)
    {
        outerSizeProvider = function() {
            return {
                width: canvas.parentNode.parentNode.offsetWidth,
                height: canvas.parentNode.offsetHeight
            }
        }
        
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
                    if ( _this._listenerId !== null && _this._isLayerOnMap )
                        globalFlashMap.layers[_this.layerName].removeListener( 'onChangeLayerVersion', _this._listenerId );
                },
                setMinSize: false
            }
        )
    }
	
	sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerJson.ashx?WrapStyle=func&LayerName=" + this.layerName, function(response)
	{
		if (!parseResponse(response))
			return;
		
		loading.removeNode(true);
		
        _this.layerInfo = response.Result.properties;
        
		_this.drawDialog(response.Result.properties, canvas, outerSizeProvider, params);
	})
}

attrsTable.prototype.drawDialog = function(info, canvas, outerSizeProvider, params)
{
    var _params = $.extend({
        hideDownload: false, 
        hideActions: false, 
        onClick: null
    }, params);
        
	var paramsWidth = 300,
		tdParams = _td(null,[['css','width',paramsWidth + 'px'],['attr','vAlign','top']]),
		tdTable = _td(null, [['attr','vAlign','top']]),
		columnsList = _div(null, [['css','overflowY','auto'],['css','width',paramsWidth - 21 + 'px']]),
		paramsButton = makeLinkButton(_gtxt("Показать параметры поиска")),
		searchButton = makeButton(_gtxt("Найти")),
		cleanButton = makeButton(_gtxt("Очистить поиск")),
		addObjectButton = makeLinkButton(_gtxt("Добавить объект")),
		oldCanvasWidth = false,
		_this = this;
        
    var downloadSection = $('<div>' +
        '<span class="buttonLink attrsDownloadLink" data-format="Shape">' + _gtxt("Скачать shp") + '</span>' +
        '<span class="buttonLink attrsDownloadLink" data-format="gpx">'   + _gtxt("Скачать gpx") + '</span>' +
        '<span class="buttonLink attrsDownloadLink" data-format="csv">'   + _gtxt("Скачать csv") + '</span>' +
    '</div>');
    
    $('span', downloadSection).click(function() {
        downloadLayer($(this).data('format'));
    });

    this._serverDataProvider = new ServerDataProvider();
    var updateSearchString = function()
    {
        _this._serverDataProvider.setRequests(
            serverBase + 'VectorLayer/Search.ashx', {count: true, layer: _this.layerName, query: _this.textarea.value},
            serverBase + 'VectorLayer/Search.ashx', {layer: _this.layerName, query: _this.textarea.value}
        );
    }
    
    var hostName = serverBase.match(/^https?:\/\/(.*)\/$/)[1];
    
    var downloadLayer = function(format) {
        _layersTree.downloadVectorLayer(
            _this.layerName, 
            hostName,
            format,
            _this.textarea.value
        );
    }

    if (info.GeometryType === 'polygon') {
        $('[data-format="gpx"]', downloadSection).hide();
    }
    
	paramsButton.onclick = function()
	{
		oldCanvasWidth = outerSizeProvider().width;
		
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
    
    if (_params.hideActions)
        $(addObjectButton).hide();
	
	tdParams.style.display = 'none';
	
	var name = 'attrsTable' + info.name;
                        
	var attrNames = [info.identityField].concat(info.attributes);
    var fielsWidth = _params.hideActions ? [] : [""];
    var attrNamesHash = {};
    for (var f = 0; f < attrNames.length; f++)
    {
        fielsWidth.push("");
        attrNamesHash[attrNames[f]] = true;
    }
    
    _params.hideDownload && downloadSection.hide();

    this.divTable2 = _div(null, [['css','overflow','auto'], ['dir', 'className', 'attrsTableBody']]);
    var tdTable2 = _td([this.divTable2, downloadSection[0]], [['attr','vAlign','top']]);
    this.table2 = new scrollTable({pagesCount: 10, limit: 20});
    var drawTableItem2 = function(elem, curIndex, activeHeaders)
    {
        tds = [];

        var showButton = makeImageButton('img/choose.png','img/choose_a.png'),
            editButton = makeImageButton('img/edit.png'),
            deleteButton = makeImageButton("img/recycle.png", "img/recycle_a.png"),
            tdControl = _td([_div([showButton, editButton, deleteButton],[['css','width','45px']])], [['css','width','45px']]);
        
        editButton.style.marginLeft = '5px';
        editButton.style.width = '12px';
        deleteButton.style.marginLeft = '5px';

        editButton.onclick = function()
        {
            var id = elem.values[elem.fields[info.identityField].index];
            new nsGmx.EditObjectControl(_this.layerName, id);
        }
        
        deleteButton.onclick = function()
        {
            var remove = makeButton(_gtxt("Удалить"));
            remove.onclick = function()
            {
                var id = elem.values[elem.fields[info.identityField].index];
                _mapHelper.modifyObjectLayer(_this.layerName, [{action: 'delete', id: id}]).done(function()
                {
                    removeDialog(jDialog);
                })
            };
            
            var jDialog = showDialog(_gtxt("Удалить объект?"), _div([remove],[['css','textAlign','center']]), 150, 60);
        }
        
        showButton.onclick = function()
        {
            var id = elem.values[elem.fields[info.identityField].index];
            sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&layer=" + _this.layerName + "&page=0&pagesize=1&geometry=true&query=" + encodeURIComponent("[" + info.identityField + "]=" + id), function(response) {
                if (!parseResponse(response))
                    return;
                    
                var columnNames = response.Result.fields;
                var row = response.Result.values[0];
                for (var i = 0; i < row.length; ++i)
                {
                    if (columnNames[i] === 'geomixergeojson' && row[i])
                    {
                        var geom = from_merc_geometry(row[i]);
                        var bounds = getBounds(geom.coordinates);
                        globalFlashMap.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
                    }
                }
            })
        }
        
        _title(deleteButton, _gtxt("Удалить"))
        _title(editButton, _gtxt("Редактировать"))
        _title(showButton, _gtxt("Показать"))
        
        if (!_params.hideActions)
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
        
        if (_params.onClick) {
            tr.onclick = function()
            {
                _params.onClick(elem);
            }
            tr.style.cursor = 'pointer';
        }
        
        return tr;
    }
    
	this.textarea = _textarea(null, [['dir','className','inputStyle'],['css','overflow','auto'],['css','width','280px'],['css','height','70px']]);
    
    updateSearchString();
    
    var tableFields = _params.hideActions ? attrNames : [""].concat(attrNames);
    
    this.table2.setDataProvider(this._serverDataProvider);
    this.table2.createTable(this.divTable2, 'attrs', 0, tableFields, fielsWidth, drawTableItem2, attrNamesHash, true);
	
	_(canvas, [_div([paramsButton, addObjectButton],[['css','margin','10px 0px 10px 1px']])])
	_(canvas, [_table([_tbody([_tr([tdParams, tdTable2])])],['css','width','100%'])])
	
    var attrHash = {};
    for (var a = 0; a < attrNames.length; a++) 
        attrHash[attrNames[a]] = [];
        
    var attrProvider = new nsGmx.LazyAttributeValuesProviderFromServer( attrHash, info.LayerID );
	var attrsSuggest = _mapHelper.createSuggestCanvas(attrNames, this.textarea, "\"suggest\"", function(){}, attrProvider, true),
		valuesSuggest = _mapHelper.createSuggestCanvas(attrNames, this.textarea, "\"suggest\"", function(){}, attrProvider),
		opsSuggest = _mapHelper.createSuggestCanvas(['=','>','<','>=','<=','<>','AND','OR','NOT','CONTAINS','()'], this.textarea, " suggest ", function(){});
		
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
	
	var resizeFunc = function()
	{
        
		var dialogWidth = oldCanvasWidth || outerSizeProvider().width;
		
		oldCanvasWidth = false;
		
		canvas.childNodes[1].style.width = dialogWidth - 21 - 10 + 'px';
		tdTable2.style.width = dialogWidth - tdParams.offsetWidth - 21 - 10 + 'px';
		_this.divTable2.style.width = dialogWidth - tdParams.offsetWidth - 21 - 10 + 'px';
		
        var dialogHeight = outerSizeProvider().height;
		_this.divTable2.style.height = dialogHeight - canvas.firstChild.offsetHeight - 25 - 10 - 30 + 'px';
		columnsList.style.height = _this.divTable2.offsetHeight - tdParams.firstChild.offsetHeight - tdParams.childNodes[1].offsetHeight - 25 + 'px';
        
        _this.table2.updateHeight(parseInt(_this.divTable2.style.height));
	}
	
	this.resizeFunc = resizeFunc;
	
	resizeFunc();
	
	this.columnsNames = columnsNames;
    
    if (this._isLayerOnMap)
    {
        this._listenerId = globalFlashMap.layers[this.layerName].addListener('onChangeLayerVersion', 
            function() {
                _this._serverDataProvider.serverChanged();
            }
        );
    }
}

var attrsTableHash = function()
{
	this.hash = {};
}

attrsTableHash.prototype.create = function(name, canvas, outerSizeProvider, params)
{
	if (name in this.hash)
	{
		this.hash[name].getInfo(canvas, outerSizeProvider, params);
	}
	else
	{
        var title = globalFlashMap.layers[name] ? globalFlashMap.layers[name].properties.title : '';
        var newAttrsTable = new attrsTable(name, title);
		newAttrsTable.getInfo(canvas, outerSizeProvider, params);
		
		this.hash[name] = newAttrsTable;
	}
    
    return this.hash[name];
}

scrollTable.AttributesServerDataProvider = ServerDataProvider;

window._attrsTableHash = new attrsTableHash();

})();