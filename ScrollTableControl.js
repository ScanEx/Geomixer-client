var scrollTable = function( params )
{
    this._params = $.extend(
    {
        limit: 50,
        page: 0,
        pagesCount: 10
    }, params);
    
	this.limit = this._params.limit;
	this.pagesCount = this._params.pagesCount;
	
	this.start = 0;
	this.reportStart = 0;
	
	this.drawFunc = null;
    
    this._pageVals = [];
    this._currValsCount = 0;
    
    this._dataProvider = null;
	
	 // Переход на предыдущую страницу
	this.next = function()
	{
		var _this = this,
			button = makeImageButton('img/next.png', 'img/next_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start += _this.pagesCount;
			_this.reportStart = _this.start * _this.limit;

			_this._drawPagesRow();
			
			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}
		
		_title(button, _gtxt('Следующие [value0] страниц', _this.pagesCount));

		return button;
	}
	
	// Переход на следующую страницу
	this.previous = function()
	{
		var _this = this,
			button = makeImageButton('img/prev.png', 'img/prev_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start -= _this.pagesCount;
			_this.reportStart = _this.start * _this.limit;

			_this._drawPagesRow();

			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}							
		
		_title(button, _gtxt('Предыдущие [value0] страниц', _this.pagesCount));

		return button;
	}
	
	// Переход на первую страницу
	this.first = function()
	{
		var _this = this,
			button = makeImageButton('img/first.png', 'img/first_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start = 0;
			_this.reportStart = _this.start * _this.limit;

			_this._drawPagesRow();

			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}
		
		_title(button, _gtxt('Первая страница'));

		return button;
	}
	
	// Переход на последнюю страницу
	this.last = function()
	{
		var _this = this,
			button = makeImageButton('img/last.png', 'img/last_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start = Math.floor(_this._currValsCount / (_this.pagesCount * _this.limit)) * _this.pagesCount;
			_this.reportStart = Math.floor(_this._currValsCount / _this.limit) * _this.limit;

			_this._drawPagesRow();

			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}
		
		_title(button, _gtxt('Последняя страница'));
		
		return button;
	}
	
	this.limitSel = _select([_option([_t("10")], [['attr','value',10]]),
							 _option([_t("20")], [['attr','value',20]]),
							 _option([_t("50")], [['attr','value',50]]),
							 _option([_t("100")], [['attr','value',100]]),
							 _option([_t("200")], [['attr','value',200]]),
							 _option([_t("500")], [['attr','value',500]])], [['dir','className','selectStyle floatRight'], ['css','width','60px']])
}

scrollTable.prototype.setDataProvider = function( dataProvider )
{
    this._dataProvider = dataProvider;
    this._drawTable();
}

scrollTable.prototype.getDataProvider = function()
{
    return this._dataProvider;
}

// scrollTable.prototype.setActiveFields = function(activeFields)
// {
    // var fieldsSet = {}
    // for (var f = 0; f < activeFields.length; f++)
        // fieldsSet[activeFields[f]] = true;
    
    // for (var f = 0; f < this._fields.length; f++)
        // this._fields[f].isActive = this._fields[f].title in fieldsSet;
            
    // this._drawHeader();
    // this._drawRows();
// }

scrollTable.prototype.activateField = function(name, isActive)
{
    for (var f = 0; f < this._fields.length; f++)
        if (this._fields[f].title == name)
        {
            if (this._fields[f].isActive == isActive)
                return;
                
            this._fields[f].isActive = isActive;
            
            this._drawHeader();
            this._drawRows();
        }
}

scrollTable.prototype._getActiveFields = function()
{
    var res = [];
    for (var f = 0; f < this._fields.length; f++)
        if (this._fields[f].isActive)
            res.push(this._fields[f].title);
            
    return res;
}

scrollTable.prototype._drawRows = function()
{
	var trs = [];

	removeChilds(this.tableBody);
    
    var activeFields = this._getActiveFields();
	
	for (var i = 0; i < this._pageVals.length; i++)
		trs.push(this.drawFunc(this._pageVals[i], i, activeFields));
	
	_(this.tableBody, trs);
	
	if (this._pageVals.length == 0)
		_(this.tableBody, [_tr(null,[['css','height','1px'],['attr','empty', true]])])
	
	removeChilds(this.tableCount)
	
	if (this._currValsCount)
		_(this.tableCount, [_t((this.reportStart + 1) + '-' + (Math.min(this.reportStart + this.limit, this._currValsCount))), _span([_t(' ')],[['css','margin','0px 3px']]), _t("(" + this._currValsCount + ")")]);
	else
		_(this.tableCount, [_t("0-0"), _span([_t(' ')],[['css','margin','0px 3px']]), _t("(0)")]);
}

scrollTable.prototype._drawPages = function(end)
{
	var _this = this;
	for (var i = this.start + 1; i<= end; i++)
	{
		// текущий элемент
 		if (i - 1 == this.reportStart/this.limit)
 		{
		    var el = _span([_t(i.toString())]);
			_(_this.tablePages, [el]);
			$(el).addClass('page');
		}
		else
		{
			var link = makeLinkButton(i.toString());
			
			link.setAttribute('page', i - 1);
			link.style.margin = '0px 2px';
			
			_(_this.tablePages, [link]);
			
			link.onclick = function()
			{
				_this.reportStart = this.getAttribute('page') * _this.limit;
				
				_this._drawPagesRow();
				
				// мозилла
				_this.tableBody.scrollTop = 0;
				// ие
				_this.tableParent.scrollTop = 0;
			};
		}
	}
}

scrollTable.prototype._updatePageData = function(callback)
{
    var _this = this;
    this._dataProvider.getCount(function(count)
    {
        _this._currValsCount = count;
        
        _this._dataProvider.getItems(
            _this.reportStart / _this.limit,
            _this.limit,
            _this.currentSortType, 
            _this.currentSortIndex[_this.currentSortType] == 0, 
            function(values)
            {
                _this._pageVals = values;
                callback();
            }
        )
    });
}

scrollTable.prototype._drawPagesRow = function()
{
    var _this = this;
    this._updatePageData(function()
    {
        // перерисовывем номера страниц
        removeChilds(_this.tablePages);
        
        if (_this._currValsCount > _this.limit)
        {
            var allPages = Math.ceil(_this._currValsCount / _this.limit);
            
            var end = (_this.start + _this.pagesCount <= allPages) ? _this.start + _this.pagesCount : allPages;
            
            if (_this.start - _this.pagesCount >= 0)
                _(_this.tablePages,[_this.first(), _this.previous()]);
            
            _this._drawPages(end);
            
            if (end + 1 <= allPages)
                _(_this.tablePages,[_this.next(), _this.last()]);
        }
        
        _this._drawRows();
    })
    
}

scrollTable.prototype._drawHeader = function()
{
    var tds = [],
        _this = this;
    
    var headerElemFactory = this._isWidthScroll ? _th : _td;
    
	for (var i = 0; i < this._fields.length; i++)
	{
        if (!this._fields[i].isActive)
            continue;
            
        var title = this._fields[i].title;
		var button;
		
		if (title != '' && this._fields[i].isSortable)
		{
			button = makeLinkButton(title);
			
			button.sortType = title;
			
			button.onclick = function()
			{
				_this.currentSortType = this.sortType;
				_this.currentSortIndex[_this.currentSortType] = 1 - _this.currentSortIndex[_this.currentSortType];
				
				_this.start = 0;
				_this.reportStart = _this.start * _this.limit;
				
				_this._drawTable()
                
                $(_this).trigger('sortChange');
			}
		}
		else
			button = _t(title)
		
		tds.push(headerElemFactory([button], [['css','width',this._fields[i].width]]));
	}
    
    $(this._tableHeaderRow).empty();
    _(this._tableHeaderRow, tds);
}

//Если baseWidth == 0, таблица растягивается на весь контейнер по ширине
scrollTable.prototype.createTable = function(parent, name, baseWidth, fields, fieldsWidths, drawFunc, sortableFields, isWidthScroll)
{
	var _this = this;
        
	// this.fieldsWidths = fieldsWidths;
    // this._fields = fields;
    // this._activeFields = $.extend({}, fields);
    this._isWidthScroll = isWidthScroll;
    
    this._fields = [];
    for (var f = 0; f < fields.length; f++)
        this._fields.push({
            title: fields[f],
            width: fieldsWidths[f],
            isSortable: fields[f] in sortableFields,
            isActive: true
        });
    
	
	this.limitSel = switchSelect(this.limitSel,  this.limit)
	
	this.limitSel.onchange = function()
	{
		_this.limit = Number(this.value);
		
		_this.start = 0;
		_this.reportStart = _this.start * _this.limit;
		
		_this._drawTable()
	}
	
	this.tableCount = _div();
	this.tableLimit = _div([this.limitSel]);
	this.tablePages = _div(null,[['dir','className','tablePages']]);

    this.tableBody = _tbody(null,[['attr','id',name + 'TableBody']]);
    
    
    this._tableHeaderRow = _tr();
    if (isWidthScroll)
    {
        this.tableHeader = _thead([this._tableHeaderRow], [['attr','id',name + 'TableHeader'], ['dir','className','tableHeader']]);
    }
    else
    {
        //как формировать фиксированный заголовок таблицы, зависит от того, будет ли у таблицы фиксированный размер или нет
        //TODO: убрать возможность задавать фиксированный размер
        if ( baseWidth )
            this.tableHeader = _tbody([this._tableHeaderRow],[['attr','id',name + 'TableHeader']]);
        else
            this.tableHeader = _tbody([_tr([_td([_table([_tbody([this._tableHeaderRow])])]), _td(null, [['css', 'width', '20px']])])], [['attr','id',name + 'TableHeader']]);
    }
    
    this._drawHeader();
    
    if (isWidthScroll)
    {
        this.tableParent = _div([_table([this.tableHeader, this.tableBody])],
                                [['attr','id',name + 'TableParent'],['dir','className','scrollTable'],['css','width',baseWidth ? baseWidth + 'px' : "100%"], ['css', 'overflow', 'auto']]);
    }
    else
    {
        this.tableParent = _div([
                                _div([_table([this.tableHeader])],[['dir','className','tableHeader']]),
                                _div([_table([this.tableBody])],[['dir','className','tableBody'],['css','width',baseWidth ? baseWidth + 20 + 'px' : "100%"]])
                            ],[['attr','id',name + 'TableParent'],['dir','className','scrollTable'],['css','width',baseWidth ? baseWidth + 'px' : "100%"]])
    }
	
	_(parent, [this.tableParent])
	_(parent, [_table([_tbody([_tr([_td([this.tableCount], [['css','width','20%']]), _td([this.tablePages]), _td([this.tableLimit], [['css','width','20%']])])])], [['css','width','100%']])]);
	
	
	this.drawFunc = drawFunc;
	this.start = 0;
	this.reportStart = 0;
	
	this.currentSortType = null;
	// сортировка по умолчанию	
	for (var name in sortableFields)
	{
		this.currentSortType = name;
		
		break;
	}
	
	this.currentSortIndex = {};
	for (var name in sortableFields)
	{
		this.currentSortIndex[name] = 0;
	}
    
    if (!this._dataProvider)
        this.setDataProvider(new scrollTable.StaticDataProvider());
    
    $(this._dataProvider).change(function()
    {
        _this._drawTable();
    });
    this._drawTable();
}

scrollTable.prototype._drawTable = function()
{
    if (!this.tableBody) return; //ещё не создана таблица
    this._drawPagesRow();
    // var _this = this;
    // this._updatePageData(function()
    // {
	
        // if (_this._currValsCount <= _this.limit)
        // {
            // removeChilds(_this.tablePages);
            
            // _this._drawRows()
        // }
        // else
        // {
            // _this._drawPagesRow();
        // }
    // })
}

scrollTable.prototype.setPage = function(iPage)
{
	if (this.limit*iPage >= this._currValsCount || iPage < 0 || this.reportStart == iPage * this.limit) 
		return;
		
	this.reportStart = iPage * this.limit;
	this.start = Math.floor(iPage/this.pagesCount) * this.pagesCount;
	
	this._drawPagesRow();
	
	this.tableBody.scrollTop = 0;
	this.tableParent.scrollTop = 0;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
    
scrollTable.StaticDataProvider = function()
{
    var _vals = []; //исходный список элементов
    var _filteredVals = []; //список элементов после фильтрации. Валиден только если _isFiltered == true
    
    var _isFiltered = false;
    var _predicate = {}; //фильтры. Ф-ции predicate(name, value, items)->filteredItems
    var _filterVals = {}; //значения фильтров
    
    var _sortFunctions = {};
    var _this = this;
    
    var _filter = function()
    {
        if (_isFiltered) return;
        
        _filteredVals = _vals;
        
        for (var filterElem in _filterVals)
        {
            _filteredVals = _predicate[filterElem](filterElem, _filterVals[filterElem], _filteredVals);
        }
        
        _isFiltered = true;
    }
    
    var _update = function()
    {
        _isFiltered = false;
        $(_this).change();
    }
    
    //IDataProvider interface
    this.getCount = function(callback)
    {
        _filter();
        callback(_filteredVals.length);
    }
    
    this.getItems = function(page, pageSize, sortParam, sortDec, callback)
    {
        var nMin = page*pageSize;
        var nMax = nMin + pageSize;
        _filter();
        var sortDirIndex = sortDec ? 0 : 1;
        var sortedVals = _sortFunctions[sortParam] ? _filteredVals.sort(_sortFunctions[sortParam][sortDirIndex]) : _filteredVals;
        nMin = Math.min(Math.max(nMin, 0), sortedVals.length);
        nMax = Math.min(Math.max(nMax, 0), sortedVals.length);
        callback(sortedVals.slice(nMin, nMax));
    }
    
    //задание/получение исходных данных
    this.setOriginalItems = function(items)
    {
        _vals = items;
        _update();
    }
    
    this.getOriginalItems = function()
    {
        return _vals;
    }
    
    this.filterOriginalItems = function(filterFunction)
    {
        var newOrigData = [];
        for (var i = 0; i < _vals.length; i++)
            if (filterFunction(_vals[i]))
                newOrigData.push(_vals[i]);
                
        _vals = newOrigData;
        _update();
    }
    
    this.addOriginalItem = function(item)
    {
        _vals.push(item);
        _update();
    }
    
    //фильтрация
    this.attachFilterEvents = function(inputField, fieldName, predicate)
    {
        var _this = this;
        
        _predicate[fieldName] = predicate;

        inputField.onkeyup = function()
        {
            if (_filterVals[fieldName] !== this.value)
            {
                _filterVals[fieldName] = this.value;
                _update();
            }
        }
        
        _filterVals[fieldName] = inputField.value;
        _update();
    }
    
    this.addFilter = function(fieldName, predicate)
    {
        _predicate[fieldName] = predicate;
    }
    
    this.setFilterValue = function(fieldName, value)
    {
        _filterVals[fieldName] = value;
        _update();
    }
    
    this.attachSelectFilterEvents = function(selectField, fieldName, predicate)
    {
        var _this = this;
        
        _predicate[fieldName] = predicate;

        selectField.onchange = function()
        {
            _filterVals[fieldName] = this.value;
            _update();
        }
        
        _filterVals[fieldName] = selectField.value;
        _update();
    }
    
    //сортировка
    this.setSortFunctions = function(sortFunctions)
    {
        _sortFunctions = sortFunctions;
    }
};

var //_layersTable = new scrollTable(),
	_mapsTable = new scrollTable(),
	_listTable = new scrollTable();