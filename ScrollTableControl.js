var scrollTable = function()
{
	this.limit = 50;
	this.pagesCount = 10;
	
	this.start = 0;
	this.reportStart = 0;
	this.allPages = 0;
	this.vals = [];
	
	this.drawFunc = null;
	
	 // Переход на предыдущую страницу
	this.next = function(vals)
	{
		var _this = this,
			button = makeImageButton('img/next.png', 'img/next_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start += _this.pagesCount;
			_this.reportStart = _this.start * _this.limit;

			_this._drawPagesRow(vals);
			
			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}
		
		_title(button, _gtxt('Следующие [value0] страниц', _this.pagesCount));

		return button;
	}
	
	// Переход на следующую страницу
	this.previous = function(vals)
	{
		var _this = this,
			button = makeImageButton('img/prev.png', 'img/prev_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start -= _this.pagesCount;
			_this.reportStart = _this.start * _this.limit;

			_this._drawPagesRow(vals);

			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}							
		
		_title(button, _gtxt('Предыдущие [value0] страниц', _this.pagesCount));

		return button;
	}
	
	// Переход на первую страницу
	this.first = function(vals)
	{
		var _this = this,
			button = makeImageButton('img/first.png', 'img/first_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start = 0;
			_this.reportStart = _this.start * _this.limit;

			_this._drawPagesRow(vals);

			_this.tableBody.scrollTop = 0;
			_this.tableParent.scrollTop = 0;
		}
		
		_title(button, _gtxt('Первая страница'));

		return button;
	}
	
	// Переход на последнюю страницу
	this.last = function(vals)
	{
		var _this = this,
			button = makeImageButton('img/last.png', 'img/last_a.png');
		
		button.style.marginBottom = '-7px';
		
		button.onclick = function()
		{
			_this.start = Math.floor(vals.length / (_this.pagesCount * _this.limit)) * _this.pagesCount;
			_this.reportStart = Math.floor(vals.length / _this.limit) * _this.limit;

			_this._drawPagesRow(vals);

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

// scrollTable.prototype.addEmptyRow = function()
// {
	// if (this.tableBody.childNodes.length == 0)
		// _(this.tableBody, [_tr(null,[['css','height','1px'],['attr','empty', true]])])
// }

scrollTable.prototype._getCurrentSortFunc = function()
{
	if (!this.currentSortType) return;
	
	return this.sortFuncs[this.currentSortType][this.currentSortIndex[this.currentSortType]];
}

scrollTable.prototype._drawRows = function(vals)
{
	var trs = [];

	removeChilds(this.tableBody);
	
	for (var i = 0; i < vals.length; i++)
		trs.push(this.drawFunc(vals[i]));
/*	var trs = vals.map(function(val)
	{
		return _this.drawFunc(val)
	})*/
	
	_(this.tableBody, trs);
	
	if (vals.length == 0)
		_(this.tableBody, [_tr(null,[['css','height','1px'],['attr','empty', true]])])
	
	// this.addEmptyRow();
	
	removeChilds(this.tableCount)
	
	if (this.currVals.length)
		_(this.tableCount, [_t((this.reportStart + 1) + '-' + (Math.min(this.reportStart + this.limit, this.currVals.length))), _span([_t(' ')],[['css','margin','0px 3px']]), _t("(" + this.currVals.length + ")")]);
	else
		_(this.tableCount, [_t("0-0"), _span([_t(' ')],[['css','margin','0px 3px']]), _t("(0)")]);
}

scrollTable.prototype._drawPages = function(end, vals)
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
				
				_this._drawPagesRow(vals);
				
				// мозилла
				_this.tableBody.scrollTop = 0;
				// ие
				_this.tableParent.scrollTop = 0;
			};
		}
	}
}

scrollTable.prototype._drawPagesRow = function(vals)
{
	// перерисовывем номера страниц
	removeChilds(this.tablePages);
	
	var end = (this.start + this.pagesCount <= this.allPages) ? this.start + this.pagesCount : this.allPages;
	
	if (this.start - this.pagesCount >= 0)
		_(this.tablePages,[this.first(vals), this.previous(vals)]);
	
	this._drawPages(end, vals);
	
	if (end + 1 <= this.allPages)
		_(this.tablePages,[this.next(vals), this.last(vals)]);
	
	// рисуем выбранный участок таблицы
	this._drawRows(vals.slice(this.reportStart, this.reportStart + this.limit))
}

//Если baseWidth == 0, таблица растягивается на весь контейнер по ширине
scrollTable.prototype.createTable = function(parent, name, baseWidth, fields, fieldsWidths, drawFunc, sortFuncs)
{
	var tds = [],
		_this = this;
	
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
				
				_this.drawTable()
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
		
		_this.drawTable()
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
	this.vals = [];
	
	this.predicate = {};
	
	this.filterVals = {};
	
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
}

scrollTable.prototype.setValues = function(vals)
{
	this.vals = vals;
	// $(this).trigger('changeData');
}

scrollTable.prototype.drawTable = function()
{
	//this.currVals = vals;
	
	var curSortFunc = this._getCurrentSortFunc();
	if (curSortFunc)
		this.currVals = this.currVals.sort(this._getCurrentSortFunc());
		
	$(this).trigger('changeData'); //TODO: сделать более тонкую проверку изменения условий изменения фильтрованных значений
	var vals = this.currVals;
	
	if (vals.length <= this.limit)
	{
		removeChilds(this.tablePages);
		
		this._drawRows(vals)
	}
	else
	{
		this.allPages = Math.ceil(vals.length / this.limit)

		this._drawPagesRow(vals);
	}
}

scrollTable.prototype.isEmptyBody = function()
{
	return (this.tableBody.firstChild.getAttribute('empty') == true);
}

scrollTable.prototype.attachFilterEvents = function(inputField, fieldName, predicate)
{
	var _this = this;
	
	_this.predicate[fieldName] = predicate;

	inputField.onkeyup = function()
	{	
	//	if (_this.isEmptyBody())
	//		return;

		_this.filterVals[fieldName] = this.value;
		_this.drawFilterTable();
		//$(_this).trigger('changeData');
	}
}

scrollTable.prototype.addFilter = function(fieldName, predicate)
{
	this.predicate[fieldName] = predicate;
	// $(this).trigger('changeData');
}

scrollTable.prototype.setFilterValue = function(fieldName, value)
{
	this.filterVals[fieldName] = value;
}

scrollTable.prototype.attachSelectFilterEvents = function(selectField, fieldName, predicate)
{
	var _this = this;
	
	_this.predicate[fieldName] = predicate;

	selectField.onchange = function()
	{	
	//	if (_this.isEmptyBody())
	//		return;

		_this.filterVals[fieldName] = this.value;
		_this.drawFilterTable();
		//$(_this).trigger('changeData');
	}
}

scrollTable.prototype.drawFilterTable = function()
{
	var localValues = this.vals;
	
	for (var filterElem in this.filterVals)
	{
		localValues = this.predicate[filterElem](filterElem, this.filterVals[filterElem], localValues);
	}
	
	this.currVals = localValues;
	this.drawTable()
}

scrollTable.prototype.setPage = function(iPage)
{
	if (this.limit*iPage >= this.currVals.length || iPage < 0 || this.reportStart == iPage * this.limit) 
		return;
		
	this.reportStart = iPage * this.limit;
	this.start = Math.floor(iPage/this.pagesCount) * this.pagesCount;
	
	this._drawPagesRow(this.currVals);
	
	this.tableBody.scrollTop = 0;
	this.tableParent.scrollTop = 0;
}

var _layersTable = new scrollTable(),
	_mapsTable = new scrollTable(),
	_listTable = new scrollTable();