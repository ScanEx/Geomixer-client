!(function($, _) {

var modulePath = "";

//TODO: вынести переключалку страниц в отдельный модуль
var appendTranslations = function()
{
    _translationsHash.addtext("rus", {
        "Следующие [value0] страниц" : "Следующие [value0] страниц",
        "Предыдущие [value0] страниц" : "Предыдущие [value0] страниц",
        "Первая страница" : "Первая страница",
        "Последняя страница" : "Последняя страница"
    });

    _translationsHash.addtext("eng", {
        "Следующие [value0] страниц" : "Next [value0] pages",
        "Предыдущие [value0] страниц" : "Previous [value0] pages",
        "Первая страница" : "First page",
        "Последняя страница" : "Last page"
    });
}

/** Интерфейс провайдера данных таблицы {@link nsGmx.ScrollTable}
 * @class nsGmx.ScrollTable.IDataProvider
 * @abstract
 */

/** Получить общее количество объектов
  @method nsGmx.ScrollTable.IDataProvider#getCount
  @param {function(Number)} callback Ф-ция, которую нужно вызвать с общим количеством объектов
*/

/** Это событие должно генерироваться при любом изменении набора данных. Приведёт к перерисовке таблицы
  @event nsGmx.ScrollTable.IDataProvider#change
*/

/** Получить массив объектов для отрисовки на странице
  @method nsGmx.ScrollTable.IDataProvider#getItems
  @param {Number} page Номер страницы (нумерация с нуля)
  @param {Number} pageSize Размер страницы
  @param {String} sortParam По какому атрибуту сортировать
  @param {Boolean} sortDec Направление сортировки (true - по убыванию)
  @param {function(Array)} callback Ф-ция, которую нужно вызвать с результирующим массивом объектов. Структура самих объектов определяется провайдером
*/

/** Получить массив объектов для отрисовки на страницы и общее количество данных за один запрос.
    Альтернатива раздельным запросам getItems() и getCount(). Можно реализовать либо эту ф-цию, либо две другие
  @method nsGmx.ScrollTable.IDataProvider#getCountAndItems
  @param {Number} page Номер страницы (нумерация с нуля)
  @param {Number} pageSize Размер страницы
  @param {String} sortParam По какому атрибуту сортировать
  @param {Boolean} sortDec Направление сортировки (true - по убыванию)
  @param {function(count:Number, objs:Object[])} callback Ф-ция, которую нужно вызвать с полученным результатом.
         Первый параметр - общее количество объектов, второй - массив объектов для данной страницы.
*/

/** Таблица с разбиением данных по страницам. Сильно кастомизируемый виджет. Поддерживает различные провайдеры данных и рендереры.
 * @class
 * @alias nsGmx.ScrollTable
 */
var scrollTable = function( params )
{
    /** Перед перерисовкой данных
     * @event nsGmx.ScrollTable#beforeRedraw
     */

    /** После перерисовки данных
     * @event nsGmx.ScrollTable#redraw
     */

    /** Изменились параметры сортировки
     * @event nsGmx.ScrollTable#sortChange
     */

    this._params = $.extend(
    {
        limit: 50,
        page: 0,
        pagesCount: 10,
        height: '',
        showFooter: true
    }, params);

	this.limit = this._params.limit;
	this.pagesCount = this._params.pagesCount;

	this.start = 0;
	this.reportStart = 0;

	this.drawFunc = null;

    this._requestID = 0;
    this._pageVals = [];
    this._currValsCount = 0;

    this._dataProvider = null;

	 // Переход на предыдущую страницу
	this.next = function()
	{
		var _this = this,
			button = makeImageButton(modulePath + 'img/next.png', modulePath + 'img/next_a.png');

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
			button = makeImageButton(modulePath + 'img/prev.png', modulePath + 'img/prev_a.png');

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
			button = makeImageButton(modulePath + 'img/first.png', modulePath + 'img/first_a.png');

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
			button = makeImageButton(modulePath + 'img/last.png', modulePath + 'img/last_a.png');

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

    var _this = this;
    this._status = {
        _state: false,
        start: function() {
            this._state = true;
            var me = this;
            setTimeout(function() {
                if (me._state) {
                    $(_this.statusContainer).siblings().hide();
                    $(_this.statusContainer).show();
                }
            }, 100);
        },
        stop: function() {
            $(_this.statusContainer).siblings().show();
            $(_this.statusContainer).hide();
            this._state = false;
        }
    }

	this.limitSel = nsGmx.Utils._select([_option([_t("10")], [['attr','value',10]]),
							 _option([_t("20")], [['attr','value',20]]),
							 _option([_t("50")], [['attr','value',50]]),
							 _option([_t("100")], [['attr','value',100]]),
							 _option([_t("200")], [['attr','value',200]]),
							 _option([_t("500")], [['attr','value',500]])], [['dir','className','selectStyle floatRight'], ['css','width','60px']])
}

/** Установка провайдера данных
 @param {nsGmx.ScrollTable.IDataProvider} dataProvider Провайдер данных
 */
scrollTable.prototype.setDataProvider = function( dataProvider )
{
    this._dataProvider = dataProvider;
    this._drawTable();
}

/** Получить текущий провайдер данных
 @return {nsGmx.ScrollTable.IDataProvider} Текущий провайдер данных
 */
scrollTable.prototype.getDataProvider = function()
{
    return this._dataProvider;
}

/** Изменить активность (видимость) колонки в таблице
  @param {String} name имя колонки
  @param {Boolean} isActive активность (видимость) колонки
*/
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
	var trs = [],
        tr;

    $(this).triggerHandler('beforeRedraw');

	$(this.tableBody).empty();

    var activeFields = this._getActiveFields();

	for (var i = 0; i < this._pageVals.length; i++)
    {
        tr = this.drawFunc(this._pageVals[i], i, activeFields);
		tr && trs.push(tr);
    }

	_(this.tableBody, trs);

	if (this._pageVals.length == 0)
		_(this.tableBody, [_tr(null,[['css','height','1px'],['attr','empty', true]])])

	$(this.tableCount).empty();

    this.statusContainer = _div(null, [['dir', 'className', 'fileBrowser-progress'], ['css', 'display', 'none']]);

	if (this._currValsCount) {
		_(this.tableCount, [_span([
            _t((this.reportStart + 1) + '-' + (Math.min(this.reportStart + this.limit, this._currValsCount))),
            _span([_t(' ')],[['css','margin','0px 3px']]),
            _t("(" + this._currValsCount + ")")
        ]), this.statusContainer]);
    }
	else {
		_(this.tableCount, [_span([_t("0-0"), _span([_t(' ')],[['css','margin','0px 3px']]), _t("(0)")]), this.statusContainer]);
    }

    $(this).triggerHandler('redraw');
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

    if (this._dataProvider.getCountAndItems)
    {
        var requestID = this._requestID++;
        this._status.start();
        _this._dataProvider.getCountAndItems(
            _this.reportStart / _this.limit,
            _this.limit,
            _this.currentSortType,
            _this.currentSortIndex[_this.currentSortType] == 1,
            function(count, values)
            {
                if (requestID !== _this._requestID - 1) {
                    _this._status.stop();
                    return;
                }

                _this._currValsCount = count;


                //если данных стало слишком мало, мы встанем на первую страницу и перезапросим данные ещё раз
                if (_this.reportStart > _this._currValsCount)
                {
                    requestID = _this._requestID++;

                    _this.start = _this.reportStart = 0; //на первую страницу

                    _this._dataProvider.getCountAndItems(
                        _this.reportStart / _this.limit,
                        _this.limit,
                        _this.currentSortType,
                        _this.currentSortIndex[_this.currentSortType] == 1,
                        function(count, values)
                        {
                            _this._status.stop();
                            if (requestID !== _this._requestID - 1)
                                return;

                            _this._pageVals = values;
                            callback();
                        }
                    )
                }
                else
                {
                    _this._status.stop();
                    _this._pageVals = values;
                    callback();
                }
            }
        )
    }
    else
    {
        this._status.start();
        this._dataProvider.getCount(function(count)
        {
            _this._currValsCount = count;

            //вообще-то при обновлении данных мы не изменяем текущей страницы
            //однако если данных стало слишком мало, то текущую страницу сохранить нельзя,
            //и мы переключимся на первую
            if (_this.reportStart >= _this._currValsCount)
            {
                _this.start = _this.reportStart = 0;
            }

            _this._dataProvider.getItems(
                _this.reportStart / _this.limit,
                _this.limit,
                _this.currentSortType,
                _this.currentSortIndex[_this.currentSortType] == 1,
                function(values)
                {
                    _this._status.stop();
                    _this._pageVals = values || [];
                    callback();
                }
            )
        });
    }
}

scrollTable.prototype._drawPagesRow = function()
{
    var _this = this;
    this._updatePageData(function()
    {
        // перерисовывем номера страниц
        $(_this.tablePages).empty();

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

    this._fields.forEach(function(field) {
        if (!field.isActive)
            return;

        var title = field.title,
            button;

		if (title != '' && field.isSortable)
		{
			button = makeLinkButton(title);

			button.sortType = title;
		}
		else
			button = _t(title)

        var td = headerElemFactory([button], [['css','width',field.width]]);

        if (field.isSortable) {
            $(td).click(function() {
                _this.setSortParams(title, 1 - _this.currentSortIndex[title]);
            })
        }

		tds.push(td);
    })

    $(this._tableHeaderRow).empty();
    _(this._tableHeaderRow, tds);
}

//Если baseWidth == 0, таблица растягивается на весь контейнер по ширине

/** Нарисовать таблицу
* @param {Object} params
* @param {DOMElement} params.parent Контейнер для помещения результата отрисовки
* @param {String} params.name Уникальное имя таблицы
* @param {Number} [params.baseWidth] Какой ширины должна быть таблица. Если не указано, будет занимать 100% контейнера
* @param {String[]} params.fields массив имён колонок
* @param {String[]} params.fieldsWidths массив с описанием ширины колонок. Описание даётся в терминах css
* @param {function} params.drawFunc Ф-ция отрисовки одной строки таблицы. На вход - объект для отрисовки (полученный от провайдера). На выходе - "tr" элемент
* @param {Object} [params.sortableFields] Хеш для указания возможности сортировки колонок (будет включена для всех ключей хеша)
* @param {Boolean} [params.isWidthScroll] Трубется ли возможность прокрутки данных по горизонтали
*/
scrollTable.prototype.createTable = function(parent, name, baseWidth, fields, fieldsWidths, drawFunc, sortableFields, isWidthScroll)
{
    var params = null
    //передача параметров в виде структуры
    if (arguments.length === 1)
    {
        params = $.extend(true, {
            sortableFields: {}
        }, parent);
    }
    else
    {
        params = {
            parent: parent,
            name: name,
            baseWidth: baseWidth,
            fields: fields,
            fieldsWidths: fieldsWidths,
            drawFunc: drawFunc,
            sortableFields: sortableFields,
            isWidthScroll: isWidthScroll
        }
    }

    var name = params.name;

	var _this = this;
    this._isWidthScroll = params.isWidthScroll;

    this._fields = [];
    for (var f = 0; f < params.fields.length; f++)
        this._fields.push({
            title: params.fields[f],
            width: params.fieldsWidths[f],
            isSortable: params.fields[f] in params.sortableFields,
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
    if (this._isWidthScroll)
    {
        this.tableHeader = _thead([this._tableHeaderRow], [['attr','id',name + 'TableHeader'], ['dir','className','tableHeader']]);
    }
    else
    {
        //как формировать фиксированный заголовок таблицы, зависит от того, будет ли у таблицы фиксированный размер или нет
        //TODO: убрать возможность задавать фиксированный размер
        if ( params.baseWidth )
            this.tableHeader = _tbody([this._tableHeaderRow],[['attr','id',name + 'TableHeader']]);
        else
            this.tableHeader = _tbody([_tr([_td([_table([_tbody([this._tableHeaderRow])])]), _td(null, [['css', 'width', '20px']])])], [['attr','id',name + 'TableHeader']]);
    }

    this._drawHeader();

    if (this._isWidthScroll)
    {
        this.tableParent = _div([_table([this.tableHeader, this.tableBody], [['css', 'width', '100%']])],
                                [['attr','id',name + 'TableParent'],['dir','className','scrollTable'],['css','width', baseWidth ? baseWidth + 'px' : "100%"], ['css', 'height', this._params.height], ['css', 'overflow', 'auto']]);
    }
    else
    {
        this.tableParent = _div([
                                _div([_table([this.tableHeader])],[['dir','className','tableHeader']]),
                                _div([_table([this.tableBody])],[['dir','className','tableBody'],['css', 'height', this._params.height ? (this._params.height - 20) + 'px' : ''], ['css','width', params.baseWidth ? params.baseWidth + 20 + 'px' : "100%"]])
                            ],[['attr','id',name + 'TableParent'],['dir','className','scrollTable'], ['css', 'height', this._params.height ? this._params.height + 'px' : ''], ['css','width', params.baseWidth ? params.baseWidth + 'px' : "100%"]])
    }

	_(params.parent, [this.tableParent])

    if (this._params.showFooter)
        _(params.parent, [_table([_tbody([_tr([_td([this.tableCount], [['css','width','20%']]), _td([this.tablePages]), _td([this.tableLimit], [['css','width','20%']])])])], [['css','width','100%']])]);


	this.drawFunc = params.drawFunc;
	this.start = 0;         //Первый номер страницы, показываемый на экране (это не текущая страница!)
	this.reportStart = 0;   //Первый номер элемента на текущей странице

	this.currentSortType = null;
	// сортировка по умолчанию
	for (var name in params.sortableFields)
	{
		this.currentSortType = name;

		break;
	}

	this.currentSortIndex = {};
	for (var name in params.sortableFields)
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

scrollTable.prototype.updateHeight = function( height )
{
    if (this._isWidthScroll)
    {
        this.tableParent.style.height = (height - 40) + 'px';
    }
    else
    {
        $(this.tableParent).find('.tableBody').height(height - 20);
        $(this.tableParent).height(height);
    }
}

scrollTable.prototype._drawTable = function()
{
    if (!this.tableBody) return; //ещё не создана таблица
    this._drawPagesRow();
}

/** Выбрать страницу для показа
@param {Number} page Номер страницы (нумерация с нуля)
*/
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

/** Получить массив объектов, которые нарисованы в данный момент
 @return {Array} массив объектов в формате провайдера данных
*/
scrollTable.prototype.getVisibleItems = function()
{
    return this._pageVals;
}

/** Задать параметры сортровки
 @param {String} sortType Имя колонки для сортировки
 @param {Boolean} sortDirection Направление сортровки (false - по возрастанию, true - по убыванию)
*/
scrollTable.prototype.setSortParams = function(sortType, sortDirection)
{
    this.currentSortType = sortType;
    this.currentSortIndex[this.currentSortType] = sortDirection;

    this.start = 0;
    this.reportStart = this.start * this.limit;

    this._drawTable()

    $(this).triggerHandler('sortChange');
}

/** Получить текущее направление сортировки.
 @return {Boolean} false - по возрастанию, true - по убыванию
*/
scrollTable.prototype.getSortDirection = function()
{
    return this.currentSortIndex[this.currentSortType] == 1
}

/** Получить по какой колонке происходит сортровка
 @return Имя колонки
*/
scrollTable.prototype.getSortType = function()
{
    return this.currentSortType;
}

/** Перерисовать текущую страницу без перезапроса данных у провайдера */
scrollTable.prototype.repaint = function()
{
    this._drawRows();
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Провайдер данных для {@link nsGmx.ScrollTable}.
* Хранит статический массив данных, умеет их фильтровать и упорядочивать.
* @class
* @extends nsGmx.ScrollTable.IDataProvider
*/
scrollTable.StaticDataProvider = function( originalData )
{
    var _vals = originalData || []; //исходный список элементов
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

    /** синхронный вариант getCount() */
    this.getCountDirect = function()
    {
        _filter();
        return _filteredVals.length;
    }

    /** синхронный вариант getItems() */
    this.getItemsDirect = function(page, pageSize, sortParam, sortDec)
    {
        var nMin = page*pageSize;
        var nMax = nMin + pageSize;
        _filter();
        var sortDirIndex = sortDec ? 1 : 0;
        var sortedVals;

        if (_sortFunctions[sortParam])
        {
            if (typeof _sortFunctions[sortParam] === 'function') //если нет ф-ции для сортировки в обратном порядке, инвертируем прямую ф-цию
                sortedVals = _filteredVals.sort(function(a, b) { return (1-2*sortDirIndex) * _sortFunctions[sortParam](a, b); });
            else
                sortedVals = _filteredVals.sort(_sortFunctions[sortParam][sortDirIndex]);
        }
        else
            sortedVals = _filteredVals;

        nMin = Math.min(Math.max(nMin, 0), sortedVals.length);
        nMax = Math.min(Math.max(nMax, 0), sortedVals.length);
        return sortedVals.slice(nMin, nMax);
    }

    //IDataProvider interface
    this.getCount = function(callback)
    {
        callback(this.getCountDirect());
    }

    this.getItems = function(page, pageSize, sortParam, sortDec, callback)
    {
        callback(this.getItemsDirect(page, pageSize, sortParam, sortDec, callback));
    }

    /** задание исходных данных */
    this.setOriginalItems = function(items)
    {
        _vals = items;
        _update();
    }

    /** получение исходных данных */
    this.getOriginalItems = function()
    {
        return _vals;
    }

    /** Фильтруем исходные данные
    * @param {function(val:Object):Boolean} filterFunction ф-ция для фильтрации. На вход принимает элемент массива данных, возвращает false, если элемент отфильтровывается, иначе true
    */
    this.filterOriginalItems = function(filterFunction)
    {
        var newOrigData = [];
        for (var i = 0; i < _vals.length; i++)
            if (filterFunction(_vals[i]))
                newOrigData.push(_vals[i]);

        _vals = newOrigData;
        _update();
    }

    /** Добавляем новый элемент в исходные данные */
    this.addOriginalItem = function(item)
    {
        _vals.push(item);
        _update();
    }

    /** Добавляем массив элементов в исходные данные */
    this.addOriginalItems = function(itemArr)
    {
        _vals = _vals.concat(itemArr);
        _update();
    }

    //фильтрация
    this.attachFilterEvents = function(inputField, fieldName, predicate)
    {
        var _this = this;

        _predicate[fieldName] = predicate;

        $(inputField).bind('keyup', function()
        {
            if (_filterVals[fieldName] !== this.value)
            {
                _filterVals[fieldName] = this.value;
                _update();
            }
        })

        _filterVals[fieldName] = inputField.value;
        _update();
    }

    /** Добавить ф-цию фильтрации исходных данных
        @param {String} fieldName Имя фильтра
        @param {function} predicate Ф-ция фильтрации: predicate(name, value, items)->filteredItems
    */
    this.addFilter = function(fieldName, predicate)
    {
        _predicate[fieldName] = predicate;
    }

    /** Установить значение для фильтра
        @param {String} fieldName Имя фильтра
        @param {String} value Значение для фильтрации
    */
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

    /** Задать ф-ции сортировки
     @param {Object} sortFunctions Хеш из ф-ций {Имя столбца -> ф-ция или массив из двух ф-ций}.
        Если массив из двух ф-ций, то первая используется для сортировки по возрастанию, вторая - по убыванию.
        Если просто ф-ция, то по убыванию используется инвертная к ней.
        Формат ф-ции совпадает с ф-цией для sort().
    */
    this.setSortFunctions = function(sortFunctions)
    {
        _sortFunctions = sortFunctions;
    }
};

// простое стравнение по атрибутам объекта.
// Использование: genAttrSort(func(a)->value), genAttrSort(attrName), genAttrSort(attrName1, attrName2)
scrollTable.StaticDataProvider.genAttrSort = function(attrName1, attrName2)
{
    if (typeof attrName1 === 'function')
    {
        return function(a, b) {
            var av = attrName1(a),
                bv = attrName1(b);
            if (av > bv)      return 1;
            else if (av < bv) return -1;
            else              return 0;
        }
    }
    else if (attrName2)
    {
        return function(a, b) {
            var av = a[attrName1][attrName2];
            var bv = b[attrName1][attrName2];
            if (av > bv)      return 1;
            else if (av < bv) return -1;
            else              return 0;
        }
    } else {
        return function(a, b) {
            var av = a[attrName1];
            var bv = b[attrName1];
            if (av > bv)      return 1;
            else if (av < bv) return -1;
            else              return 0;
        }
    }
}

//если есть вьюер, добавляем для него переменные в глобальный namespace
if ('nsGmx' in window && 'GeomixerFramework' in window.nsGmx)
{
    window.scrollTable = scrollTable; //Depricated - use nsGmx
    window.nsGmx.ScrollTable = scrollTable;
}

if (typeof window.gmxCore !== 'undefined')
{
    gmxCore.addModule("ScrollTableControl",
        {
            ScrollTable: scrollTable
        },
        {
            require: ['translations', 'utilities'],
            css: 'table.css',
            init: function(module, path)
            {
                modulePath = path || "";
                appendTranslations();
            }
        }
    );
}

})(jQuery, nsGmx.Utils._);
