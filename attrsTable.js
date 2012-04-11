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

var ServerDataProvider = function()
{
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
            sortAttr = "&orderby=" + (sortParam || "ogc_fid"),
            sortOrder = "&orderdirection=" + (sortDec ? "DESC" : "ASC");
            
        sendCrossDomainJSONRequest(_dataRequest + offset + limit + sortAttr + sortOrder, function(response)
        {
            if (!parseResponse(response))
            {
                callback();
                return;
            }
            
            var fieldsSet = {};
            
            for (var f = 0; f < response.Result.fields.length; f++)
                fieldsSet[response.Result.fields[f]] = f;
            
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
	
	this.drawingBorders = {};
    this.originalGeometry = {};
}

attrsTable.prototype.getInfo = function()
{
	if ($$('attrsTableDialog' + this.layerName))
		return;
	
	var canvas = _div(null,[['attr','id','attrsTableDialog' + this.layerName]])
		loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]),
		_this = this;
	
	_(canvas, [loading])

	showDialog(_gtxt("Таблица атрибутов слоя [value0]", this.layerTitle), canvas, 800, 500, false, false, function(){_this.resizeFunc.apply(_this,arguments)})
	
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
		_this.editObject();
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
            editButton = makeImageButton('img/misc.png'),
            tdControl = _td([_div([showButton, editButton],[['css','width','35px']])]);
        
        editButton.style.marginLeft = '5px';

        editButton.onclick = function()
        {
            _this.editObject(elem.values)
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
        
        _title(editButton, _gtxt("Редактировать"))
        _title(showButton, _gtxt("Показать"))
        
        tds.push(tdControl);
        
        for (var j = 0; j < activeHeaders.length; ++j)
        {
            if (activeHeaders[j] == "")
                continue;
                
            if (activeHeaders[j] in elem.fields)
            {
                var valIndex = elem.fields[activeHeaders[j]],
                    strData = String(elem.values[valIndex]),
                    td = _td();
                
                _(td, [_t(strData)])
                
                if (!isNaN(Number(elem.values[valIndex])))
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

attrsTable.prototype.editObject = function(row)
{
	if ($$('attrsTableDialogEdit' + this.layerName + (row ? row[0] : '0')))
		return;
	
	var canvas = _div(null,[['attr','id','attrsTableDialogEdit' + this.layerName + (row ? row[0] : '0')]]),
		createButton,
		trs = [],
		tdGeometry = _td(),
		_this = this;
	
	if (row)
		createButton = makeLinkButton(_gtxt("Изменить"));
	else
		createButton = makeLinkButton(_gtxt("Создать"));
	
	createButton.onclick = function()
	{
		var properties = {};
		$(".inputStyle", canvas).each(function(index, elem)
		{
			properties[elem.rowName] = $(elem).val();
		});
		
        var obj = {action: 'update', properties: properties, id: row[0]};
        if ( 'ogc_fid' + row[0] in _this.drawingBorders)
        {
            var curGeomString = JSON.stringify(_this.drawingBorders['ogc_fid' + row[0]].getGeometry());
            var origGeomString = JSON.stringify(_this.originalGeometry['ogc_fid' + row[0]]);
            
            if (origGeomString !== curGeomString)
            {
                //showErrorMessage(_gtxt("Геометрия не сохранена. Эта возможность будет реализована в будущих версиях Геомиксера."));
                //var div = $("<div/>").text(_gtxt("Геометрия не сохранена. Эта возможность будет реализована в будущих версиях платформы."));
                //showDialog(_gtxt("", this.layerTitle), canvas, 800, 500, false, false, function(){_this.resizeFunc.apply(_this,arguments)});
                obj.geometry = gmxAPI.merc_geometry(_this.drawingBorders['ogc_fid' + row[0]].getGeometry());
            }
        }
            
		var objects = JSON.stringify([obj]);
		
		sendCrossDomainPostRequest(serverBase + "VectorLayer/ModifyVectorObjects.ashx", {WrapStyle: 'window', LayerName: _this.layerName, objects: objects}, function(response)
		{
            if (!parseResponse(response))
                return;
            
            var newItem = {
                properties: properties
            }
            
            newItem.properties.ogc_fid = row[0];
            
            globalFlashMap.layers[_this.layerName].setTileItem(newItem, false);
			//_this.getLength();
            _this._serverDataProvider.serverChanged();
            
            closeFunc();
            $(dialogDiv).dialog("destroy");
		});
	}
	
	var resizeFunc = function(event, ui)
	{
		if (row)
		{
			if ($(canvas).children("[loading]").length)
				return;
			
			canvas.firstChild.style.height = canvas.parentNode.offsetHeight - 25 - 10 - 10 + 'px';
		}
		else
			canvas.firstChild.style.height = canvas.parentNode.offsetHeight - 25 - 10 - 10 + 'px';
	}
	
	var closeFunc = function()
	{
		if (row)
		{
			if (_this.drawingBorders['ogc_fid' + row[0]])
			{
				_this.drawingBorders['ogc_fid' + row[0]].remove();
				
				delete _this.drawingBorders['ogc_fid' + row[0]];
                delete _this.originalGeometry['ogc_fid' + row[0]];
			}
			
			if ($$('attrDrawingBorderDialog' + _this.layerName + row[0]))
				removeDialog($$('attrDrawingBorderDialog' + _this.layerName + row[0]).parentNode);
		}
	}
	
	var dialogDiv = showDialog(row ? _gtxt("Редактировать объект слоя [value0]", this.layerTitle) : _gtxt("Создать объект слоя [value0]", this.layerTitle), canvas, 400, 300, false, false, resizeFunc, closeFunc)
	
	if (row)
	{
		var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px'],['attr','loading',true]]);
	
		_(canvas, [loading])
		
		sendCrossDomainJSONRequest(serverBase + "VectorLayer/Search.ashx?WrapStyle=func&layer=" + this.layerName + "&page=0&pagesize=1&orderby=" + this._identityField + "&geometry=true&query='" + this._identityField + "'=" + row[0], function(response)
		{
			if (!parseResponse(response))
				return;
                
            var columnNames = response.Result.fields;
			
			$(canvas).children("[loading]").remove();
			
			var geometryRow = response.Result.values[0];
			
			for (var i = 0; i < geometryRow.length; ++i)
			{
				var tdValue = _td();
				
				if (i == 0)
				{
                    //временно отключаем выбор геометрии...
                    
					var objectEdit = _span(null, [['attr','id','objectEdit' + _this.layerName + geometryRow[1]],['css','color','#215570'],['css','marginLeft','3px'],['css','fontSize','12px']]);

					if (geometryRow[0].type == "POINT" || geometryRow[0].type == "LINESTRING" || geometryRow[0].type == "POLYGON")
					{
						
						// добавим маленький сдвиг, чтобы рисовать полигон, а не прямоугольник
                        /*	if (geometryRow[0].type == "POLYGON")
						{
							geometryRow[0].coordinates[0][0][0] += 0.00001;
							geometryRow[0].coordinates[0][0][1] += 0.00001;
						}*/
						
                        var geom = from_merc_geometry(geometryRow[0]);
						var drawingBorder = globalFlashMap.drawing.addObject(geom);
                        _this.originalGeometry['ogc_fid' + geometryRow[1]] = drawingBorder.getGeometry();
					
						drawingBorder.setStyle({outline: {color: 0x0000FF, thickness: 3, opacity: 80 }, marker: { size: 3 }, fill: { color: 0xffffff }}, {outline: {color: 0x0000FF, thickness: 4, opacity: 100}, marker: { size: 4 }, fill: { color: 0xffffff }});
						
						_this.drawingBorders['ogc_fid' + geometryRow[1]] = drawingBorder;
						
						_this.updateObjectGeometry(geometryRow[1], objectEdit);
						
						_(tdValue, [objectEdit]);
					}
					else
					{
						var info = _span([_t(geometryRow[0].type)], [['css','marginLeft','3px'],['css','fontSize','12px']]);
						
						_title(info, JSON.stringify(geometryRow[0].coordinates));
					}
					
					var drawingBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png");
					
					drawingBorderLink.onclick = function()
					{
						_this.chooseDrawingBorderDialog(geometryRow[1]);
					}
					
					drawingBorderLink.style.margin = '0px 5px 0px 3px';
                    
					trs.push(_tr([_td([_span([_t(_gtxt("Геометрия")), drawingBorderLink],[['css','fontSize','12px']])],[['css','height','20px']]), tdValue]))
				}
				else if (i == 1)
				{
					_(tdValue, [_span([_t(geometryRow[i])],[['css','marginLeft','3px'],['css','fontSize','12px']])])
						
					trs.push(_tr([_td([_span([_t(columnNames[i])],[['css','fontSize','12px']])],[['css','height','20px']]), tdValue]))
				}
				else
				{
					var input = _input(null,[['attr','value',geometryRow[i]],['css','width','200px'],['dir','className','inputStyle'], ['dir', 'rowName', columnNames[i]]]);
					
					_(tdValue, [input]);
					
					trs.push(_tr([_td([_span([_t(columnNames[i])],[['css','fontSize','12px']])]), tdValue]))
				}
			}
			
			_(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
			
			_(canvas, [_div([createButton],[['css','margin','10px 0px'],['css','height','20px']])]);
			
			resizeFunc();
		})
	}
	else
	{
		var objectEdit = _span(null, [['attr','id','objectEdit' + _this.layerName +'0'],['css','color','#215570'],['css','marginLeft','3px'],['css','fontSize','12px']]);

		var drawingBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png");
		
		drawingBorderLink.onclick = function()
		{
			_this.chooseDrawingBorderDialog('0');
		}
		
		drawingBorderLink.style.margin = '0px 5px 0px 3px';
		
		trs.push(_tr([_td([_span([_t(_gtxt("Геометрия")), drawingBorderLink],[['css','fontSize','12px']])],[['css','height','20px']]), _td([objectEdit])]));
		
		for (var i = 1; i < _this.columnsNames.length; ++i)
		{
			var input = _input(null,[['css','width','200px'],['dir','className','inputStyle']]);
			
			trs.push(_tr([_td([_span([_t(_this.columnsNames[i])],[['css','fontSize','12px']])]), _td([input])]))
		}
		
		_(canvas, [_div([_table([_tbody(trs)])],[['css','overflow','auto']])]);
		
		_(canvas, [_div([createButton],[['css','margin','10px 0px'],['css','height','20px']])]);
		
		resizeFunc();
	}
}

attrsTable.prototype.chooseDrawingBorderDialog = function(ogc_fid)
{
	if ($$('attrDrawingBorderDialog' + this.layerName + ogc_fid))
		return;
	
	var objects = [],
		_this = this;
	
	globalFlashMap.drawing.forEachObject(function(obj)
	{
		objects.push(obj);
	})
	
	if (!objects.length)
		showErrorMessage(_gtxt("$$phrase$$_12"), true, _gtxt("$$phrase$$_12"));
	else
	{
		var trs = [];
		
		for (var i = 0; i < objects.length; i++)
		{
			var type = objects[i].geometry.type,
				coords = objects[i].geometry.coordinates,
				title = _span(null, [['dir','className','title']]),
				summary = _span(null, [['dir','className','summary']]),
				tdName = _td([title, summary]),
				returnButton = makeImageButton("img/choose.png", "img/choose_a.png"),
				tr = _tr([_td([returnButton]), tdName]);
			
			if (type == "POINT")
			{
				_(title, [_t(_gtxt("точка"))]);
				_(summary, [_t("(" + formatCoordinates(merc_x(coords[0]), merc_y(coords[1])) + ")")]);
			}
			else if (type == "LINESTRING")
			{
				_(title, [_t(_gtxt("линия"))]);
				_(summary, [_t("(" + prettifyDistance(geoLength(coords)) + ")")]);
			}
			else if (type == "POLYGON")
			{
				_(title, [_t(isRectangle(coords) ? _gtxt("прямоугольник") : _gtxt("многоугольник"))]);
				_(summary, [_t("(" + prettifyArea(geoArea(coords)) + ")")]);
			}
			
			returnButton.style.cursor = 'pointer';
			returnButton.style.marginLeft = '5px';
				
			(function(i){
				returnButton.onclick = function()
				{
					_this.drawingBorders['ogc_fid' + ogc_fid] = objects[i];
					
					_this.updateObjectGeometry(ogc_fid);
					
					removeDialog($$('attrDrawingBorderDialog' + _this.layerName + ogc_fid).parentNode);
				}
			})(i);
			
			attachEffects(tr, 'hover')
			
			trs.push(tr)
		}
	
		var table = _table([_tbody(trs)], [['css','width','100%']]);
		
		showDialog(_gtxt("Выбор контура"), _div([table], [['attr','id','attrDrawingBorderDialog' + this.layerName + ogc_fid],['dir','className','drawingObjectsCanvas'],['css','width','220px']]), 250, 180, false, false)
	}
}

attrsTable.prototype.updateObjectGeometry = function(ogc_fid, span)
{
	if (!this.drawingBorders['ogc_fid' + ogc_fid])
		return;
	
	var type = this.drawingBorders['ogc_fid' + ogc_fid].geometry.type,
		coords = this.drawingBorders['ogc_fid' + ogc_fid].geometry.coordinates,
		prettify = function()
		{
			if (type == "POINT")
				return formatCoordinates(merc_x(coords[0]), merc_y(coords[1]))
			else if (type == "LINESTRING")
				return prettifyDistance(geoLength(coords));
			else if (type == "POLYGON")
				return prettifyArea(geoArea(coords));
		}
	
	if (span)
	{
		_(span, [_t(prettify())])
		
		return;
	}
	
	if (!$$('objectEdit' + this.layerName + ogc_fid))
		return;
	
	removeChilds($$('objectEdit' + this.layerName + ogc_fid));
	
	_($$('objectEdit' + this.layerName + ogc_fid), [_t(prettify())])
}

attrsTable.prototype.removeObjectGeometry = function(ogc_fid)
{
	delete this.drawingBorders['ogc_fid' + ogc_fid];
	
	if ($$('objectEdit' + this.layerName + ogc_fid))
		removeChilds($$('objectEdit' + this.layerName + ogc_fid));
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

window._attrsTableHash = new attrsTableHash();

})();