(function(){

/** Провайдер данных для {@link nsGmx.ScrollTable}. Получает данные от сервера в формате ГеоМиксера
* @alias nsGmx.ScrollTable.AttributesServerDataProvider
* @class
* @extends nsGmx.ScrollTable.IDataProvider
*/
var ServerDataProvider = function(params)
{
    var _params = $.extend({
            defaultSortParam: 'ogc_fid',
            titleToParams: {}
        }, params);
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
        
        var explicitSortParam = (sortParam || sortParam === '') ? (_params.titleToParams[sortParam] || sortParam) : _params.defaultSortParam;

        var params = $.extend({
            page: page,
            pagesize: pageSize,
            orderby: explicitSortParam,
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
    
    /** Задать endpoint для получения от сервера данных об объекта и их количестве
     * @param {String} countURL URL скрипта для запроса общего количества объектов
     * @param {Object} countParams Параметры запроса для количеством объектов
     * @param {String} dataURL URL скрипта для запроса самих объектов
     * @param {Object} dataParams Параметры запроса самих объектов. К этим параметрам будут добавлены параметры для текущей страницы в формате запросов ГеоМиксера
    */
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
	
	this.queryTextarea = null;
	this.activeColumns = null;
	
	this.resizeFunc = function(){};
    
    this._listenerId = null;
    
    this._isLayerOnMap = !!globalFlashMap.layers[this.layerName];
    
    this.tableFields = {
        fieldsAsArray: [],
        fieldsAsHash: {},
        titleToField: {},
        init: function(fieldParams, info) {
            var _this = this;
            this.fieldsAsHash = {};
            this.titleToField = {};
            this.fieldsAsArray = [];
            if (!fieldParams) {
                this.fieldsAsArray = [info.identityField].concat(info.attributes);
                this.fieldsAsArray.forEach(function(name) {
                    _this.fieldsAsHash[name] = true;
                    _this.titleToField[name] = name;
                })
            } else {
                fieldParams.forEach(function(field) {
                    _this.fieldsAsArray.push(field.title);
                    _this.fieldsAsHash[field.title] = true;
                    _this.titleToField[field.title] = field.name;
                })
            }
        }
    }
}

attrsTable.prototype.getLayerInfo = function()
{
    return this._layerInfo;
}

attrsTable.prototype.getInfo = function(origCanvas, outerSizeProvider, params)
{
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
                    this.resizeFunc.apply(this,arguments);
                }.bind(this),
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
		
        _this._layerInfo = response.Result.properties;
        
        _this._layerColumns = [
            {Value: 'GeomIsEmpty([geomixergeojson])', Alias: '__GeomIsEmpty__'},
            {Value: '[' + response.Result.properties.identityField + ']'}
        ];
        
        var attrs = response.Result.properties.attributes;
        for (var k = 0; k < attrs.length; k++) {
            _this._layerColumns.push({Value: '[' + attrs[k] + ']'});
        }
        
		_this.drawDialog(response.Result.properties, canvas, outerSizeProvider, params);
	})
}

attrsTable.prototype._updateSearchString = function(query) {
    this._serverDataProvider.setRequests(
        serverBase + 'VectorLayer/Search.ashx', {layer: this.layerName, query: query, count: true},
        serverBase + 'VectorLayer/Search.ashx', {layer: this.layerName, query: query, columns: JSON.stringify(this._layerColumns)}
    );
}

// events: queryChange, columnsChange
var defaultSearchParamsManager = {
    _activeColumns: null,
    _queryTextarea: null,
    _container: null,
    render: function(container, attributesTable) {
        var info = attributesTable.getLayerInfo(),
            paramsWidth = 300,
            searchButton = makeButton(_gtxt("Найти")),
            cleanButton = makeButton(_gtxt("Очистить поиск")),
            _this = this;
            
        var columnsList = this._columnsList = _div(null, [['dir','className','attrsColumnsList'], ['css','overflowY','auto'],['css','width',paramsWidth - 21 + 'px']]);
        
        this._container = container;

        searchButton.onclick = function()
        {
            $(_this).trigger('queryChange');
        }
        
        cleanButton.onclick = function()
        {
            _this._queryTextarea.value = "";
            $(_this).trigger('queryChange');
        }
        
        this._queryTextarea = _textarea(null, [['dir','className','inputStyle'],['css','overflow','auto'],['css','width','280px'],['css','height','70px']]);
        
        var attrNames = [info.identityField].concat(info.attributes);
        var attrHash = {};
        for (var a = 0; a < attrNames.length; a++) 
            attrHash[attrNames[a]] = [];
            
        var attrProvider = new nsGmx.LazyAttributeValuesProviderFromServer( attrHash, info.name );
        var attrsSuggest = _mapHelper.createSuggestCanvas(attrNames, this._queryTextarea, "\"suggest\"", function(){}, attrProvider, true),
            valuesSuggest = _mapHelper.createSuggestCanvas(attrNames, this._queryTextarea, "\"suggest\"", function(){}, attrProvider),
            opsSuggest = _mapHelper.createSuggestCanvas(['=','>','<','>=','<=','<>','AND','OR','NOT','CONTAINS','()'], this._queryTextarea, " suggest ", function(){});
            
        opsSuggest.style.width = '80px';
        $(opsSuggest).children().css('width','60px');
        
        var divAttr = _div([_t(_gtxt("Атрибут >")), attrsSuggest], [['dir','className','attrsHelperCanvas']]),
            divValue = _div([_t(_gtxt("Значение >")), valuesSuggest], [['dir','className','attrsHelperCanvas'],['css','marginLeft','10px']]),
            divOp = _div([_t(_gtxt("Операция >")), opsSuggest], [['dir','className','attrsHelperCanvas'],['css','marginLeft','10px']]),
            clickFunc = function(div)
            {
                if (document.selection)
                {
                    _this._queryTextarea.focus();
                    var sel = document.selection.createRange();
                    div.sel = sel;
                    _this._queryTextarea.blur();
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
        
        this._queryTextarea.onclick = function()
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
        _(container, [_div([_div([_t(_gtxt("SQL-условие WHERE"))],[['css','fontSize','12px'],['css','margin','7px 0px 3px 1px']]), this._queryTextarea, suggestCanvas],[['attr','filterTable',true]])])
        
        _(container, [_div([_t(_gtxt("Показывать столбцы") + ":")],[['css','fontSize','12px'],['css','margin','7px 0px 3px 1px']])])
        
        var attrTitles = attributesTable.tableFields.fieldsAsArray;
        if (!this._activeColumns)
        {
            this._activeColumns = {};
            
            for (var i = 0; i < attrTitles.length; ++i)
                this._activeColumns[attrTitles[i]] = true;
        }

        var rowTemplate = 
            '<label title="{{name}}" class="attrs-table-active-row">' + 
                '<input type="checkbox" class="box attrs-table-active-checkbox" {{#active}}checked{{/active}}></input>' +
                '{{name}}' + 
            '</label>';
            
        attrTitles.forEach(function(columnName) {
            var rowUI = $(Mustache.render(rowTemplate, {
                active: _this._activeColumns[columnName],
                name: columnName
            })).appendTo(columnsList);
            
            $('input', rowUI).click(function() {
                _this._activeColumns[columnName] = this.checked;
                $(_this).trigger('columnsChange');
            })
        });
        
        
        _(container, [columnsList]);
        
        searchButton.style.marginRight = '17px';
        cleanButton.style.marginRight = '3px';
        _(container, [_div([cleanButton, searchButton],[['css','textAlign','right'],['css','margin','5px 0px 0px 0px'],['css','width',paramsWidth + 'px']])]);
    },
    
    getQuery: function() {
        return this._queryTextarea && this._queryTextarea.value;
    },
    
    getActiveColumns: function() {
        return this._activeColumns;
    },
    
    resize: function(dims) {
        if (this._columnsList) {
            var container = this._container,
                height = dims.height - container.childNodes[0].offsetHeight - container.childNodes[1].offsetHeight - 25 + 'px';
            $(this._container).find('.attrsColumnsList')[0].style.height = height;
        }
    }
}

attrsTable.prototype.drawDialog = function(info, canvas, outerSizeProvider, params)
{
    var _params = $.extend({
        hideDownload: false,
        hideActions: false,
        hideRowActions: false,
        hideSearchParams: false,
        onClick: null,
        searchParamsManager: defaultSearchParamsManager
        /*attributes: [] */
    }, params);
        
	var paramsWidth = 300,
		tdParams = _td(null,[['css','width',paramsWidth + 'px'],['attr','vAlign','top']]),
		tdTable = _td(null, [['attr','vAlign','top']]),
		paramsButton = makeLinkButton(_gtxt("Показать параметры поиска")),
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

    this.tableFields.init(_params.attributes, info);
    
    this._serverDataProvider = new ServerDataProvider({titleToParams: $.extend(this.tableFields.titleToField, {'': '__GeomIsEmpty__'})});
    
    var hostName = serverBase.match(/^https?:\/\/(.*)\/$/)[1];
    
    if (!_params.hideSearchParams) {
        var searchParamsManager = _params.searchParamsManager;
        searchParamsManager.render(tdParams, this);
        $(searchParamsManager).on({
            queryChange: function() {
                _this.offset = 0;
                _this._updateSearchString(searchParamsManager.getQuery());
            },
            columnsChange: function() {
                var columns = searchParamsManager.getActiveColumns ? searchParamsManager.getActiveColumns() : _this.tableFields.fieldsAsHash;
                for (var k in columns) {
                    _this.table2.activateField(k, columns[k]);
                }
            }
        })
    }
    
    this._updateSearchString('');
    
    var downloadLayer = function(format) {
        _layersTree.downloadVectorLayer(
            _this.layerName, 
            hostName,
            format,
            _this.queryTextarea.value
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
    
   _params.hideSearchParams && $(paramsButton).hide();
	
	addObjectButton.onclick = function()
	{
        new nsGmx.EditObjectControl(_this.layerName);
	}
	
	addObjectButton.style.marginLeft = '20px';
    
    if (_params.hideActions)
        $(addObjectButton).hide();
	
	tdParams.style.display = 'none';
	
	var name = 'attrsTable' + info.name;
    
    var attrNames = this.tableFields.fieldsAsArray;
    var fielsWidth = new Array(_params.hideRowActions ? attrNames.length: attrNames.length + 1).join('0').split('0');
    var attrNamesHash = this.tableFields.fieldsAsHash;
    
    _params.hideDownload && downloadSection.hide();

    this.divTable2 = _div(null, [['css','overflow','auto'], ['dir', 'className', 'attrsTableBody']]);
    var tdTable2 = _td([this.divTable2, downloadSection[0]], [['attr','vAlign','top']]);
    this.table2 = new nsGmx.ScrollTable({pagesCount: 10, limit: 20});
    var drawTableItem2 = function(elem, curIndex, activeHeaders)
    {
        var tds = [];

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
        
        _title(deleteButton, _gtxt("Удалить"));
        _title(editButton, _gtxt("Редактировать"));
        _title(showButton, _gtxt("Показать"));
        
        $(showButton).toggle(!elem.values[elem.fields['__GeomIsEmpty__'].index]);
        
        if (!_params.hideRowActions)
            tds.push(tdControl);
        
        for (var j = 0; j < activeHeaders.length; ++j)
        {
            if (activeHeaders[j] == "")
                continue;
                
            var fieldName = _this.tableFields.titleToField[activeHeaders[j]];
                
            if (fieldName in elem.fields)
            {
                var valIndex = elem.fields[fieldName].index,
                    td = _td();
                
                _(td, [_t(nsGmx.Utils.convertFromServer(elem.fields[fieldName].type, elem.values[valIndex]))])
                
                if (elem.fields[fieldName].type == 'integer')
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
    
    var tableFields = _params.hideRowActions ? attrNames : [""].concat(attrNames);
    
    this.table2.setDataProvider(this._serverDataProvider);
    this.table2.createTable(this.divTable2, 'attrs', 0, tableFields, fielsWidth, drawTableItem2, $.extend(attrNamesHash, {'': true}), true);
	
	_(canvas, [_div([paramsButton, addObjectButton],[['css','margin','10px 0px 10px 1px']])])
	_(canvas, [_table([_tbody([_tr([tdParams, tdTable2])])],['css','width','100%'])])
	
	var resizeFunc = function()
	{
		var dialogWidth = oldCanvasWidth || outerSizeProvider().width;
		
		oldCanvasWidth = false;
		
		canvas.childNodes[1].style.width = dialogWidth - 21 - 10 + 'px';
		tdTable2.style.width = dialogWidth - tdParams.offsetWidth - 21 - 10 + 'px';
		_this.divTable2.style.width = dialogWidth - tdParams.offsetWidth - 21 - 10 + 'px';
		
        var dialogHeight = outerSizeProvider().height;
		_this.divTable2.style.height = dialogHeight - canvas.firstChild.offsetHeight - 25 - 10 - 30 + 'px';
		
        _this.table2.updateHeight(parseInt(_this.divTable2.style.height));
        _params.searchParamsManager.resize && _params.searchParamsManager.resize({
            width: tdParams.offsetWidth,
            height: _this.divTable2.offsetHeight
        });
	}
	
	this.resizeFunc = resizeFunc;
	
	resizeFunc();
    
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
    this.hooks = [];
}

attrsTableHash.prototype.create = function(name, canvas, outerSizeProvider, params)
{
    params = params || {};
    this.hooks.forEach(function(hook) {
        params = hook(params) || params;
    })
    
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

attrsTableHash.prototype.addHook = function(paramsHook) {
    this.hooks.push(paramsHook);
}

window.nsGmx = window.nsGmx || {};

window.nsGmx.ScrollTable.AttributesServerDataProvider = ServerDataProvider;

window._attrsTableHash = new attrsTableHash();

/** Менеджер поискового интерфейса таблицы атрибутов. 
    Используется в таблице атрибутов для задания кастомизированного интерфейса поиска объектов слоя.
    Генерирует события queryChange и columnsChange
  @typedef IAttrTableSearchManager
  @memberOf nsGmx
  @prop {function(container, attrTable)} render Ф-ция для отрисовки кастомизированного интерфейса в контейнере. Параметры: container, attrTable
  @prop {function(): String} getQuery Получить SQL запрос за данными
  @prop {function(): Object} getActiveColumns Получить хеш с описанием активности колонок (имя колонки -> true/false)
  @prop {function(dims)} resize Ф-ция для реакции на изменения размера диалога. dims - целевые размеры контейнера (width, height)
*/

/** Показать таблицу атрибутов векторного слоя
  @func createAttributesTable
  @memberOf nsGmx
  @param {String} layerName ID слоя
  @param {DOMElement} canvas Контейнер, куда поместить таблицу атрибутов. Если не указано, будет создан новый диалог
  @param {function} outerSizeProvider Ф-ция для определения текущих размеров контейнера. Должна возвращать объект с полями width и height. Применяется только если указан canvas.
  @param {Object} params Дополнительные параметры
  @param {Boolean} [params.hideDownload=false] Скрыть секцию с вариантами скачивания данных
  @param {Boolean} [params.hideActions=false] Скрыть секцию с добавлением объекта
  @param {Boolean} [params.hideRowActions=false] Скрыть столбец таблицы с действиями над отдельными объектами 
  @param {Boolean} [params.hideSearchParams=false] Скрыть секцию с параметрами поиска
  @param {function} [params.onClick] Ф-ция, которая будет вызываться при клике на строчке таблицы. Первым параметром передаётся объект, по которому кликнули
  @param {Array} [params.attributes] Массив, определяющий, какие атрибуты показывать. Каждый элемент - объект с полями "name" (исходное название атрибута) и title (как отображать в таблице). 
                 Если атрибута нет в массиве, он не будет показан в таблице. Если массив не указан, показываются все атрибуты
  @param {nsGmx.IAttrTableSearchManager} [params.searchParamsManager] Менеджер UI для поиска в таблице атрибутов
  @return Интерфейс для управления таблицей атрибутов
*/

window.nsGmx.createAttributesTable = window._attrsTableHash.create.bind(window._attrsTableHash);


/** Добавить хук для изменения параметров при вызове таблицы атрибутов
  @func addAttributesTableHook
  @memberOf nsGmx
  @param {function(params):Object} paramsHook Хук, который вызывается при каждом вызове диалога редактирования и может модифицировать параметры диалога (первый параметр)
*/
window.nsGmx.addAttributesTableHook = function(paramsHook) {
    window._attrsTableHash.addHook(paramsHook);
};

})();