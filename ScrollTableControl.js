var scrollTable = function()
{
	this.limit = 50;
	this.pagesCount = 10;
	
	this.start = 0;
	this.reportStart = 0;
	this.allPages = 0;
	
	this.drawFunc = null;
    
    this._pageVals = [];
    this._currValsCount = 0;
	
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
                             
    this._dataProvider = null;
    
    this.setDataProvider(new scrollTable.StaticDataProvider());
}

scrollTable.prototype.setDataProvider = function( dataProvider )
{
    this._dataProvider = dataProvider;
}

scrollTable.prototype.getDataProvider = function()
{
    return this._dataProvider;
}

scrollTable.prototype._drawRows = function()
{
	var trs = [];

	removeChilds(this.tableBody);
	
	for (var i = 0; i < this._pageVals.length; i++)
		trs.push(this.drawFunc(this._pageVals[i]));
	
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
            _this.reportStart, 
            _this.reportStart + _this.limit, 
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
	// перерисовывем номера страниц
	removeChilds(this.tablePages);
	
	var end = (this.start + this.pagesCount <= this.allPages) ? this.start + this.pagesCount : this.allPages;
	
	if (this.start - this.pagesCount >= 0)
		_(this.tablePages,[this.first(), this.previous()]);
	
	this._drawPages(end);
	
	if (end + 1 <= this.allPages)
		_(this.tablePages,[this.next(), this.last()]);

    var _this = this;
    this._updatePageData(function()
    {
        _this._drawRows();
    })
    
}

//Если baseWidth == 0, таблица растягивается на весь контейнер по ширине
scrollTable.prototype.createTable = function(parent, name, baseWidth, fields, fieldsWidths, drawFunc, sortFuncs)
{
	var tds = [],
		_this = this;
        
    this._dataProvider.setSortFunctions(sortFuncs);
	
	this.fieldsWidths = fieldsWidths;
	
	for (var i = 0; i < fields.length; i++)
	{
		var button;
		
		if (fields[i] != '' && sortFuncs[fields[i]])
		{
			button = makeLinkButton(fields[i]);
			
			button.sortType = fields[i];
			
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
			button = _t(fields[i])
		
		tds.push(_td([button], [['css','width',this.fieldsWidths[i]]]))
	}
	
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

	//как формировать фиксированный заголовок таблицы, зависит от того, будет ли у таблицы фиксированный размер или нет
	//TODO: убрать возможность задавать фиксированный размер
	if ( baseWidth )
		this.tableHeader = _tbody([_tr(tds)],[['attr','id',name + 'TableHeader']]);
	else
		this.tableHeader = _tbody([_tr([_td([_table([_tbody([_tr(tds)])])]), _td(null, [['css', 'width', '20px']])])], [['attr','id',name + 'TableHeader']]);
		
	this.tableBody = _tbody(null,[['attr','id',name + 'TableBody']]);
	this.tableParent = _div([
							_div([_table([this.tableHeader])],[['dir','className','tableHeader']]),
							_div([_table([this.tableBody])],[['dir','className','tableBody'],['css','width',baseWidth ? baseWidth + 20 + 'px' : "100%"]])
						],[['attr','id',name + 'TableParent'],['dir','className','scrollTable'],['css','width',baseWidth ? baseWidth + 'px' : "100%"]])
	
	_(parent, [this.tableParent])
	_(parent, [_table([_tbody([_tr([_td([this.tableCount], [['css','width','20%']]), _td([this.tablePages]), _td([this.tableLimit], [['css','width','20%']])])])], [['css','width','100%']])]);
	
	
	this.drawFunc = drawFunc;
	this.start = 0;
	this.reportStart = 0;
	this.allPages = 0;
	
	this.sortFuncs = sortFuncs;
	
	this.currentSortType = null;
	// сортировка по умолчанию	
	for (var name in this.sortFuncs)
	{
		this.currentSortType = name;
		
		break;
	}
	
	this.currentSortIndex = {};
	for (var name in this.sortFuncs)
	{
		this.currentSortIndex[name] = 0;
	}
    
    $(this._dataProvider).change(function()
    {
        _this._updatePageData(function()
        {
            _this._drawTable();
        })
    });
}

scrollTable.prototype._drawTable = function()
{
    var _this = this;
    this._updatePageData(function()
    {
	
        if (_this._currValsCount <= _this.limit)
        {
            removeChilds(_this.tablePages);
            
            _this._drawRows()
        }
        else
        {
            _this.allPages = Math.ceil(_this._currValsCount / _this.limit)

            _this._drawPagesRow();
        }
    })
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
    
    this.getItems = function(nMin, nMax, sortParam, sortDec, callback)
    {
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

var _layersTable = new scrollTable(),
	_mapsTable = new scrollTable(),
	_listTable = new scrollTable();