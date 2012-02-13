//Необходимо подключить JS-библиотеки: jquery, jquery-ui, api.js, utilites.js, treeview.js, translations.js, gmxCore.js, 	файл локализации
//						стили: jquery, jquery-ui, search.css, treeview.css, buttons.css

/** 
* @name Search
* @namespace Содержит необходимое для поиска
* @description Содержит необходимое для поиска
*/
(function($){

_translationsHash.addtext("rus", {
	"Текущее местоположение отображается только для России и Украины": "Текущее местоположение отображается только для России и Украины"
});

_translationsHash.addtext("eng", {
	"Текущее местоположение отображается только для России и Украины": "Current location is shown only for Russia and Ukraine"
});


/** Вспомогательные функции
 @memberOf Search*/
var Functions = {

	/** Возвращает полное наименование объекта, состоящее из типа и наименования
	 @static
	 @param sType Наименование типа объекта 
	 @param sName Наименование объекта*/
	GetFullName: function(/** string */sType, /** string */sName){
		var sFullName = "";
		
		if (sType==null || sType == "государство" || sType == "г." || /[a-zA-Z]/.test(sName))
			sFullName = sName;
		else if ((sType.indexOf("район") != -1) || (sType.indexOf("область") != -1) || (sType.indexOf("край") != -1))
			sFullName = sName + " " + sType;
		else
			sFullName = sType + " " + sName;
		
		return sFullName;
	},

	/** Возвращает полный путь к объекту
	 @static
	 @param oFoundObject найденный объект
	 @param sObjectsSeparator разделитель между дочерним элементом и родителем в строке пути
	 @param bParentAfter признак того, что родительский элемент идет после дочернего
	 @param sObjNameField название свойства, из которого брать наименование*/	
	GetPath: function(/**object*/ oFoundObject,/** string */ sObjectsSeparator, /** bool */ bParentAfter, /** string */ sObjNameField){
		if (sObjNameField == null) sObjNameField = "ObjName";
		if (oFoundObject == null) return "";
		var oParentObj = oFoundObject.Parent;
		if (oParentObj != null && (oParentObj.ObjName == "Российская Федерация" || oParentObj.TypeName == "административный округ")) {
			oParentObj = oParentObj.Parent;
		}
		var sObjectName = (oFoundObject.CountryCode != 28000 && oFoundObject.CountryCode != 310000183) ? oFoundObject[sObjNameField] : this.GetFullName(oFoundObject.TypeName, oFoundObject[sObjNameField]);
		if (oParentObj != null && oParentObj[sObjNameField] != null && oParentObj[sObjNameField]){
			if (bParentAfter){
				return sObjectName + sObjectsSeparator + this.GetPath(oParentObj, sObjectsSeparator,  bParentAfter, sObjNameField);
			}
			else{
				return this.GetPath(oParentObj, sObjectsSeparator,  bParentAfter, sObjNameField) + sObjectsSeparator + sObjectName;
			}
		}
		else{
			return sObjectName;
		}
	},

	/** Возвращает строку, соединяющую переданные свойства
	 @static
	 @param oProps - Свойства
	 @param sObjectsSeparator Разделитель 2х свойств в строке*/	
	GetPropertiesString: function(/**object[]*/oProps,/**string*/ sPropSeparator, /**object[]*/arrDisplayFields){
		var sResultString = "";
		if (oProps != null){
			for (var sPropName in oProps){
				if (sResultString != "") sResultString += sPropSeparator;
				sResultString += sPropName + ": " + oProps[sPropName];
			}
		}
		return sResultString;
	}
}

/** Конструктор
 @memberOf Search
 @class Контрол, состоящий из поля поиска с подсказками и кнопкой поиска по векторным слоям
 @param oInitContainer Объект, в котором находится контрол (div) - обязательный
 @param params Параметры: <br/>
	<i>layersSearchFlag</i> - {bool} Признак видимости кнопки поиска по векторным слоям <br/>
	<i>Search</i> = function(event, SearchString, layersSearchFlag) -  осуществляет поиск по строке поиска и признаку "Искать по векторным слоям" <br/>
	<i>AutoCompleteSource</i> = function(request, response) - возвращает данные для автозаполнения: [{label:..., category: ...}] <br/>
	<i>AutoCompleteSelect</i> = function(event, oAutoCompleteItem) - вызывается при выборе из строки автозаполнения*/
var SearchInput = function (oInitContainer, params) {
	/**Объект, в котором находится контрол (div)*/
	var Container = oInitContainer;
	/**Признак видимости кнопки поиска по векторным слоям*/
	var layersSearchFlag = params.layersSearchFlag;
	var _this = this;	
	if (Container == null) throw "SearchInput.Container is null";
	var _sDefalutAddressVectorLabel = _gtxt("$$search$$_1");
	var _sDefalutAddressLabel = _gtxt("$$search$$_2");
	/** Возвращает содержимое поля поиска
	@function
	@see Search.SearchInput#SetSearchString*/
	this.GetSearchString = function(){return searchField.value};

	/** Устанавливает содержимое поля поиска
	@function
	@see Search.SearchInput#GetSearchString*/
	this.SetSearchString = function(value) {searchField.value = value};
	if (params.Search != null) $(this).bind('Search', params.Search);
	if (params.AutoCompleteSelect != null) $(this).bind('AutoCompleteSelect', params.AutoCompleteSelect)
		
	var dtLastSearch = new Date();
	/**Текстовое поле для ввода поискового запроса*/
	var searchField = _input(null, [['dir', 'className', 'searchCenter']]);
    if ($.browser.msie)
		searchField.style.paddingTop = '4px';
	var sDefaultValue;
	
	var divSearchBegin, tdSearchBegin;
	var tdSearchButton = _td([_div(null, [['dir', 'className', 'searchEnd']])], [['dir', 'className', 'searchEndTD']]);
	
	/**Вызывает событие необходимости начать поиск*/
	var fnSearch = function(){
		/** Вызывается при необходимости начать поиск (обработчик события его осуществляет)
		@name Search.SearchInput.Search
		@event
		@param {string} SearchString строка для поиска
		@param {bool} layersSearchFlag признак необходимости осуществлять поиск по векторным слоям*/
		$(_this).triggerHandler('Search', [searchField.value, layersSearchFlag]);
	}
    tdSearchButton.onclick = fnSearch;
	
	/** Смена признака необходимости проводить поиск по векторным слоям*/
	var updateSearchType = function() {
		var bChangeValue = (searchField.value == sDefaultValue);
	
		if (layersSearchFlag) {
			sDefaultValue = _sDefalutAddressVectorLabel;
			divSearchBegin.className = 'searchBeginOn';
		}
		else {
			sDefaultValue = _sDefalutAddressLabel;
			divSearchBegin.className = 'searchBeginOff';
		}
		
		if (bChangeValue) searchField.value = sDefaultValue;
	}
	
	if (!layersSearchFlag) {
        sDefaultValue = _sDefalutAddressLabel;
		divSearchBegin = _div(null, [['dir', 'className', 'searchBegin']]);
        tdSearchBegin = _td([divSearchBegin], [['dir', 'className', 'searchBeginTD']]);
    }
    else {
        sDefaultValue = _sDefalutAddressVectorLabel;
		divSearchBegin = _div(null, [['dir', 'className', 'searchBeginOn']]);
		tdSearchBegin = _td([divSearchBegin], [['dir', 'className', 'searchBeginOnTD']]);
        divSearchBegin.onclick = function() {
            layersSearchFlag = !layersSearchFlag;

            updateSearchType(layersSearchFlag);
        }
        attachEffects(divSearchBegin, 'active');
        _title(divSearchBegin, _gtxt('Изменить параметры поиска'));
    }
	searchField.value = sDefaultValue;

    var searchFieldCanvas = _table(	[_tbody([_tr([tdSearchBegin, _td([searchField], [['dir', 'className', 'searchCenterTD']]), tdSearchButton])])], 
									[['dir', 'className', 'SearchInputControl']]);

    searchField.onkeyup = function(e) {
        var evt = e || window.event;
        if (getkey(evt) == 13) {
			if (Number(new Date()) - dtLastSearch < 1000 || $("#ui-active-menuitem").get().length > 0) return; //Если уже ведется поиск по автозаполнению, то обычный не ведем
			dtLastSearch = new Date();
			if($(searchField).autocomplete != null)$(searchField).autocomplete("close");
            fnSearch();
            return true;
        }
    }

    searchField.onfocus = function() {
        if (this.value == sDefaultValue) {
            this.value = '';
			
			$(this).addClass('searchCenterValueExists');
        }
    }

    searchField.onblur = function() {
        if (this.value == '') {
            this.value = sDefaultValue;
			
			$(this).removeClass('searchCenterValueExists');
        }
    }

    _(Container, [searchFieldCanvas]);
	
	//Добавляем автокомплит только если задана функция источника данных для него
	if (params.AutoCompleteSource != null)
	{
		
		/** выбор значения из подсказки
		@param {object} event Событие
		@param {object} ui Элемент управления, вызвавший событие*/
		function fnAutoCompleteSelect(event, ui) {
			if (ui.item) {
				dtLastSearch = new Date();
				/** Вызывается при выборе значения из всплывающей подсказки
				@name Search.SearchInput.AutoCompleteSelect
				@event
				@param {object} AutoCompleteItem Выбранное значение*/
				$(_this).triggerHandler('AutoCompleteSelect', [ui.item]);
			}
		}
		
		/** Возвращает данные подсказки
		@param {object} request запрос (request.term - строка запроса)
		@param {object[]} Массив значений для отображения в подсказке*/
		function fnAutoCompleteSource(request, response){
			/** Слова, содержащиеся в строке поиска */
			$(searchField).autocomplete("widget")[0].arrSearchWords = request.term.replace(/[^\wа-яА-Я]+/, "|").split("|");
			params.AutoCompleteSource(request, function(arrResult){
				if (Number(new Date()) - dtLastSearch > 5000) {
					response(arrResult);
				}
				else
				{
					response([]);
				}
			});
		}
		
		$(function() {
			$(searchField).autocomplete({
				minLength: 3,
				source: fnAutoCompleteSource,
				select: fnAutoCompleteSelect,
				//appendTo: searchField,
				open: function(event, ui){
					var oMenu = $(searchField).autocomplete("widget")[0];
					oMenu.style.left = oMenu.offsetLeft - divSearchBegin.clientWidth + 1;
					oMenu.style.width = Container.clientWidth - 6;
				}
			});
		});
		
		/** Слова, содержащиеся в строке поиска */
		$(searchField).autocomplete("widget")[0].arrSearchWords = [];
		
		$.ui.autocomplete.prototype._renderItem = function( ul, item) {
			var t = item.label;
			for (var i=0; i<ul[0].arrSearchWords.length; i++){
				if(ul[0].arrSearchWords[i].length > 1){
					var re = new RegExp(ul[0].arrSearchWords[i], 'ig') ;
					t = t.replace(re, function(str, p1, p2, offset, s){
						return "<span class='ui-autocomplete-match'>" + str + "</span>";
					});
				}
			}
			return $( "<li></li>" )
				.data( "item.autocomplete", item )
				.append( "<a>" + t + "</a>" )
				.appendTo( ul );
		};

	}
	/** Возвращает контрол, в котором находится данный контрол*/
	this.getContainer = function(){return Container;}
	
	/** Устанавливает значение по умолчанию вместо "Поиск по адресной базе"*/
	this.setAddressVectorDefault = function(value){
		if(searchField.value == _sDefalutAddressLabel) searchField.value = value;
		if(sDefaultValue == _sDefalutAddressLabel) sDefaultValue = value;
		_sDefalutAddressVectorLabel = value;
	}
	
	/** Устанавливает значение по умолчанию вместо "Поиск по векторным слоям и адресной базе"*/
	this.setAddressDefault = function(value){
		if(searchField.value == _sDefalutAddressLabel) searchField.value = value;
		if(sDefaultValue == _sDefalutAddressLabel) sDefaultValue = value;
		_sDefalutAddressLabel = value;
	}
};

/** Конструктор
 @class Контрол, отображающий результаты поиска в виде списка
 @memberOf Search
 @param {object} oInitContainer Объект, в котором находится контрол (div), обязательный
 @param {string} ImagesHost - строка пути к картинкам*/
var ResultList = function(oInitContainer, ImagesHost){
	/**Объект, в котором находится контрол (div)*/
	var Container = oInitContainer;
	var _this = this;
	var sImagesHost = ImagesHost || "http://maps.kosmosnimki.ru/api/img";
		
	var arrDisplayedObjects = []; //Объекты, которые отображаются на текущей странице
	var iLimit = 10; //Максимальное количество результатов на странице
	var iPagesCount = 7; //Количество прокручиваемых страниц при нажатии на двойные стрелки
	if (Container == null) throw "ResultList.Container is null";
	
	var oResultCanvas;
	var arrTotalResultSet = [];
		
	if(oResultCanvas == null) 
	{
		oResultCanvas = _div(null, [['dir', 'className', 'searchResultCanvas']]);
		_(Container, [oResultCanvas]);
	}
	var oLoading = _div([_img(null, [['attr', 'src', sImagesHost + '/progress.gif'], ['dir', 'className', 'searchResultListLoadingImg']]), _t(_gtxt("загрузка..."))], [['dir', 'className', 'searchResultListLoading']]);
	var fnNotFound = function(){_(oResultCanvas, [_div([_t(_gtxt("Поиск не дал результатов"))], [['dir', 'className', 'SearchResultListNotFound']])]);};
	
	/**Удаляет все найденные объекты из результатов поиска*/
	var unload = function(){
		for(i=0; i<arrDisplayedObjects.length; i++){
			SetDisplayedObjects(i, []);
		}
		removeChilds(oResultCanvas);
	}
    /** Переход на следующие страницы*/
    var next = function(iDataSourceN, divChilds, divPages) {
        var button = makeImageButton(sImagesHost + '/next.png', sImagesHost + '/next_a.png');

        button.style.marginBottom = '-7px';

        button.onclick = function() {
			var oDataSource = arrTotalResultSet[iDataSourceN];
            oDataSource.start += iPagesCount;
            oDataSource.reportStart = oDataSource.start * iLimit;

            drawPagesRow(iDataSourceN, divChilds, divPages);
        }

        _title(button, _gtxt('Следующие [value0] страниц', iPagesCount));

        return button;
    }

    /** Переход на предыдущие страницы*/
    var previous = function(iDataSourceN, divChilds, divPages) {
        var button = makeImageButton(sImagesHost + '/prev.png', sImagesHost + '/prev_a.png');

        button.style.marginBottom = '-7px';

        button.onclick = function() {
			var oDataSource = arrTotalResultSet[iDataSourceN];
            oDataSource.start -= iPagesCount;
            oDataSource.reportStart = oDataSource.start * iLimit;

            drawPagesRow(iDataSourceN, divChilds, divPages);
        }

        _title(button, _gtxt('Предыдущие [value0] страниц', iPagesCount));

        return button;
    }

    /** Переход на первую страницу*/
    var first = function(iDataSourceN, divChilds, divPages) {
        var _this = this,
			button = makeImageButton(sImagesHost + '/first.png', sImagesHost + '/first_a.png');

        button.style.marginBottom = '-7px';

        button.onclick = function() {
			var oDataSource = arrTotalResultSet[iDataSourceN];
            oDataSource.start = 0;
            oDataSource.reportStart = oDataSource.start * iLimit;

            drawPagesRow(iDataSourceN, divChilds, divPages);
        }

        _title(button, _gtxt('Первая страница'));

        return button;
    }

    /** Переход на последнюю страницу*/
    var last = function(iDataSourceN, divChilds, divPages) {
        var _this = this,
			button = makeImageButton(sImagesHost + '/last.png', sImagesHost + '/last_a.png');

        button.style.marginBottom = '-7px';

        button.onclick = function() {
			var oDataSource = arrTotalResultSet[iDataSourceN];
            oDataSource.start = Math.floor((oDataSource.SearchResult.length - 1)/ (iPagesCount * iLimit)) * iPagesCount;
            oDataSource.reportStart = Math.floor((oDataSource.SearchResult.length - 1)/ (iLimit)) * iLimit;

            drawPagesRow(iDataSourceN, divChilds, divPages);
        }

        _title(button, _gtxt('Последняя страница'));

        return button;
    }
	
	/**Добавляет объект в список найденных результатов*/
	var drawObject = function(oFoundObject, elemDiv, bIsParent)
	{
		var	realPath = (oFoundObject.CountryCode != 28000 && oFoundObject.CountryCode != 310000183)  ? oFoundObject.ObjName : Functions.GetFullName(oFoundObject.TypeName, oFoundObject.ObjName);
		if (oFoundObject.Parent != null) realPath += ",";
		
		var searchElemHeader = _span([_t(realPath)], [['dir', 'className', bIsParent?'searchElemParent':'searchElem']]);

		/** Вызывается при клике на найденный объект в списке результатов поиска
		@name Search.ResultList.onObjectClick
		@event
		@param {object} oFoundObject Найденный объект*/
		searchElemHeader.onclick = function(){$(_this).triggerHandler('onObjectClick', [oFoundObject]);};

		_(elemDiv, [searchElemHeader]);
		if (oFoundObject.Parent != null) drawObject(oFoundObject.Parent, elemDiv, true);
		if (oFoundObject.properties != null) _(elemDiv, [document.createTextNode(" " + Functions.GetPropertiesString(oFoundObject.properties, "; "))]);
	}
	
	/** Рисует строки списка*/
	var drawRows = function(iDataSourceN, divChilds) {
		var arrObjects = arrDisplayedObjects[iDataSourceN];
		removeChilds(divChilds);
		var tbody = _tbody();
		for (var i = 0; i < arrObjects.length; i++) {
			var elemTR = _tr(null, [['dir', 'className', 'SearchResultRow']]);
			var elemTD = _td();
			_(elemTR, [_td([_t((i+1).toString() + ".")], [['dir', 'className','searchElemPosition']]), elemTD]);
			drawObject(arrObjects[i], elemTD);
			_(tbody, [elemTR]);
		}
		_(divChilds, [_table([tbody])]);

	}
	
	/**рисует номера страниц списка
	@param end - последний номер 
	@param iDataSourceN = номер источника данных
	@param divChilds - раздел для элементов списка
	@param divPages - раздел для номеров страниц списка*/
	var drawPages = function(end, iDataSourceN, divChilds, divPages) {
		var oDataSource = arrTotalResultSet[iDataSourceN];
		for (var i = oDataSource.start + 1; i <= end; i++) {
			// текущий элемент
			if (i - 1 == oDataSource.reportStart / iLimit) {
				var el = _span([_t(i.toString())]);
				_(divPages, [el]);
				$(el).addClass('page');
			}
			else {
				var link = makeLinkButton(i.toString());

				link.setAttribute('page', i - 1);
				link.style.margin = '0px 2px';

				_(divPages, [link]);

				link.onclick = function() {
					arrTotalResultSet[iDataSourceN].reportStart = this.getAttribute('page') * iLimit;

					drawPagesRow(iDataSourceN, divChilds, divPages);
				};
			}

		}
	}

	/**Рисует одну из страниц списка
	@param iDataSourceN = номер источника данных
	@param divChilds - раздел для элементов списка
	@param divPages - раздел для номеров страниц списка*/
	var drawPagesRow = function(iDataSourceN, divChilds, divPages) {
		var oDataSource = arrTotalResultSet[iDataSourceN];
		
		// перерисовывем номера страниц
		removeChilds(divPages);

		var end = (oDataSource.start + iPagesCount <= oDataSource.allPages) ? oDataSource.start + iPagesCount : oDataSource.allPages;

		if (oDataSource.start - iPagesCount >= 0)
			_(divPages, [first(iDataSourceN, divChilds, divPages), previous(iDataSourceN, divChilds, divPages)]);

		drawPages(end, iDataSourceN, divChilds, divPages);

		if (end + 1 <= oDataSource.allPages)
			_(divPages, [next(iDataSourceN, divChilds, divPages), last(iDataSourceN, divChilds, divPages)]);
		
		SetDisplayedObjects(iDataSourceN, oDataSource.SearchResult.slice(oDataSource.reportStart, oDataSource.reportStart + iLimit));
		drawRows(iDataSourceN, divChilds);
	}

	/**Рисует таблицу для результатов источника данных
	@param iDataSourceN = номер источника данных
	@param divChilds - раздел для элементов списка
	@param divPages - раздел для номеров страниц списка*/
	var drawTable = function(iDataSourceN, divChilds, divPages) {
		var oDataSource = arrTotalResultSet[iDataSourceN];
		
		if (oDataSource.SearchResult.length <= iLimit) {
			removeChilds(divPages);
			SetDisplayedObjects(iDataSourceN, oDataSource.SearchResult);
			drawRows(iDataSourceN, divChilds);
		}
		else {
			oDataSource.allPages = Math.ceil(oDataSource.SearchResult.length / iLimit);

			drawPagesRow(iDataSourceN, divChilds, divPages);
		}
	}
	
	/**Обрабатывает событие нажатия на кнопку "Скачать SHP-файл"
	@param iDataSourceN = номер источника данных*/
	var downloadMarkers = function(iDataSourceN) {
		var oDataSource = arrTotalResultSet[iDataSourceN];
		var canvas = _div(),
			filename = _input(null, [['dir', 'className', 'filename'], ['attr', 'value', oDataSource.name]]);

		var downloadButton = makeButton(_gtxt("Скачать"));
		downloadButton.onclick = function() {
			if (filename.value == '') {
				inputError(filename, 2000);

				return;
			}

			/** Вызывается при необходимости осуществить загрузку SHP-файла с результатами поиска
			@name Search.ResultList.onDownloadSHP
			@event
			@param {string} filename Имя файла, которой необходимо будет сформировать
			@param {object[]} SearchResult Результаты поиска, которые необходимо сохранить в файл*/
			$(_this).triggerHandler('onDownloadSHP', [filename, oDataSource.SearchResult]);
			
			$(canvas.parentNode).dialog("destroy");
			canvas.parentNode.removeNode(true);
		}

		_(canvas, [_div([_t(_gtxt("Введите имя файла для скачивания")), filename], [['dir', 'className', 'DownloadSHPButtonText']]), _div([downloadButton], [['dir', 'className', 'DownloadSHPButton']])]);

		var area = getOffsetRect(Container);
		showDialog(_gtxt("Скачать shp-файл"), canvas, 291, 120, 30, area.top + 10);
	}

	/**Отображает результаты поиска с источника данных
	@param iDataSourceN = номер источника данных*/
	var drawSearchResult = function(iDataSourceN) {
		var oDataSource = arrTotalResultSet[iDataSourceN];
		
		var arrDataSourceList = oDataSource.SearchResult;
		var header = oDataSource.name;

		var divChilds = _div(null, [['dir', 'className', 'SearchResultListChildsCanvas']]),
			divPages = _div(),
			liInner = _li([divChilds, divPages]),
			li;
		if (arrTotalResultSet.length == 1){
			li = _ul([liInner]);
		}
		else{
			li = _li([_div([_t(header), _span([_t("(" + arrDataSourceList.length + ")")])], [['dir', 'className', 'searchLayerHeader']]), _ul([liInner])]);
		}
		
		oDataSource.start = 0;
		oDataSource.reportStart = 0;
		oDataSource.allPages = 0;

		drawTable(iDataSourceN, divChilds, divPages);

		if (oDataSource.CanDownloadVectors) {
			var downloadVector = makeLinkButton(_gtxt("Скачать shp-файл"));

			downloadVector.onclick = function() {
				downloadMarkers(iDataSourceN);
			}

			liInner.insertBefore(_div([downloadVector], [['dir', 'className', 'SearchDownloadShpLink']]), liInner.firstChild);
		}

		return li;
	}

	/**Отображает результаты поиска в списке
	@param sTotalListName - заголовок итогового результата
	@param arrTotalList = [{name:DataSourceName, CanDownloadVectors:CanDownloadVectors, SearchResult:arrDataSourceList[oObjFound,...]},...]
	@returns {void}
	*/
	this.ShowResult = function(sTotalListName, arrTotalList){
		arrTotalResultSet = arrTotalList;
	    removeChilds(oResultCanvas);
		arrDisplayedObjects = [];
		if (!objLength(arrTotalResultSet)) {
			fnNotFound();
			return;
		}
		else {
			var foundSomething = false;

			for (var i = 0; i < arrTotalResultSet.length; i++) {
				if (arrTotalResultSet[i].SearchResult.length > 0) {
					foundSomething = true;
					break;
				}
			}
			if (!foundSomething) {
				fnNotFound();
				return;
			}
		}
		
		var ulSearch = _ul();
		
		for (var iDataSourceN  = 0; iDataSourceN < arrTotalResultSet.length; iDataSourceN++)
			_(ulSearch, [drawSearchResult(iDataSourceN)]);

		if (arrTotalResultSet.length == 1){
			_(oResultCanvas, [ulSearch]);
		}
		else{
			_(oResultCanvas, [_li([_div([_t(sTotalListName)], [['dir', 'className', 'SearchTotalHeader']]), ulSearch])]);
		}
		
		$(oResultCanvas).treeview();
		$(oResultCanvas).find(".SearchResultListChildsCanvas").each(function() {
			this.parentNode.style.padding = '0px';
			this.parentNode.style.background = 'none';
		})
	}
	
	/**Возвращает список объектов, которые отображаются на текущей странице во всех разделах*/
	this.GetDisplayedObjects = function(){return arrDisplayedObjects; };
	var SetDisplayedObjects = function(iDataSourceN, value) {
		arrDisplayedObjects[iDataSourceN] = value;
		
		/** Вызывается при изменении отображаемого списка найденных объектов(ведь они отображаются не все)
		@name Search.ResultList.onDisplayedObjectsChanged
		@event
		@param {int} iDataSourceN № источника данных(группы результатов поиска)
		@param {object[]} arrDSDisplayedObjects Результаты поиска, которые необходимо отобразить в текущей группе*/
		$(_this).triggerHandler('onDisplayedObjectsChanged',[iDataSourceN, arrDisplayedObjects[iDataSourceN]]);
	};
	
	/** Показывает режим загрузки
	@returns {void}*/
	this.ShowLoading = function(){
		removeChilds(oResultCanvas);
		_(oResultCanvas, [oLoading]);
	}
	
	/**Показывает сообщение об ошибке
	@returns {void}*/
	this.ShowError = function(){
		removeChilds(oResultCanvas);
		_(oResultCanvas, [_t("Произошла ошибка")]);
	}
	
	/**Очищает результаты поиска
	@returns {void}*/
	this.Unload = function(){unload();};
	/** Возвращает контрол, в котором находится данный контрол*/
	this.getContainer = function(){return Container;};
};

/** Конструктор
 @class Предоставляет функции, отображающие найденные объекты на карте
 @memberof Search
 @param {object} oInitMap карта, на которой будут рисоваться объекты
 @param {string} sInitImagesHost - строка пути к картинкам
 @param {bool} bInitAutoCenter - если true, карта будет центрироваться по 1ому найденному объекту*/
var ResultRenderer = function(oInitMap, sInitImagesHost, bInitAutoCenter){
	var oMap = oInitMap;
	if (oMap == null)  throw "ResultRenderer.Map is null";
	
	var sImagesHost = sInitImagesHost || "http://maps.kosmosnimki.ru/api/img";
	var bAutoCenter = (bInitAutoCenter == null) || bInitAutoCenter;
	
	var arrContainer = [];
	var iCount = 0;
	
	/** возвращает стили найденных объектов, используется только для точки*/
	var getSearchStyle = function(iPosition) {
		return [
						{ marker: { image: sImagesHost + "/search/search_" + (iPosition + 1).toString() + ".png", dx: -14, dy: -38} },
						{ marker: { image: sImagesHost + "/search/search_" + (iPosition + 1).toString() + "a.png", dx: -14, dy: -38} }
				];
	}

	/**Помещает объект на карту
	@param {MapObject} oContainer контейнер, содержащий в себе объекты текущей группы результатов поиска
	@param {MapObject} oFoundObject добавляемый объект
	@param {int} iPosition порядковый номер добавляемого объекта в группе*/
	var DrawObject = function(oContainer, oFoundObject, iPosition){
		var sDescr = "<b>" + Functions.GetFullName(oFoundObject.TypeName, oFoundObject.ObjName) + "</b><br/>" + Functions.GetPath(oFoundObject.Parent, "<br/>", true);
		if (oFoundObject.properties != null) sDescr += "<br/>" + Functions.GetPropertiesString(oFoundObject.properties, "<br/>");
		var fnBaloon = function(o) {
			return o.properties.Descr.replace(/;/g, "<br/>");
		};
		var elemMap;
		//Рисуем центр объекта
		if (oFoundObject.Geometry != null && oFoundObject.Geometry.type == 'POINT') {
			elemMap = oContainer.addObject(oFoundObject.Geometry, { Descr: sDescr });
			elemMap.setStyle(getSearchStyle(iPosition)[0], getSearchStyle(iPosition)[1]);
			elemMap.enableHoverBalloon(fnBaloon);
		}
		else if (oFoundObject.CntrLon != null && oFoundObject.CntrLat != null){
			elemMap = oContainer.addObject({ type: "POINT", coordinates: [oFoundObject.CntrLon, oFoundObject.CntrLat] }, { Descr: sDescr });
			elemMap.setStyle(getSearchStyle(iPosition)[0], getSearchStyle(iPosition)[1]);
			elemMap.enableHoverBalloon(fnBaloon);
		}
		

		//Рисуем контур объекта
		if (oFoundObject.Geometry != null && oFoundObject.Geometry.type != 'POINT') {
			elemMap = oContainer.addObject(oFoundObject.Geometry, { Descr: sDescr });
			elemMap.setStyle({ outline: { color: Math.round(0x222222 + 0x999999*iPosition/iCount), thickness: 3, opacity: 60} });

			elemMap.enableHoverBalloon(fnBaloon);
		}
	};
	
	/**Центрует карту по переданному объекту*/
	var CenterObject = function(oFoundObject){
		if (!oFoundObject) return;
		var iZoom = (oFoundObject.TypeName != "дом жилой" ) ? oMap.getZ() : 15;
		if (oFoundObject.MinLon != null && oFoundObject.MaxLon != null && oFoundObject.MinLat != null && oFoundObject.MaxLat != null){
			oMap.zoomToExtent(oFoundObject.MinLon, oFoundObject.MinLat, oFoundObject.MaxLon, oFoundObject.MaxLat);
		}
		else if (oFoundObject.Geometry!=null && oFoundObject.Geometry.type != 'POINT'){
			var oExtent = getBounds(oFoundObject.Geometry.coordinates);
			oMap.zoomToExtent(oExtent.minX, oExtent.minY, oExtent.maxX, oExtent.maxY);
		}
		else
		{
			var dCntrLon = oFoundObject.CntrLon || oFoundObject.Geometry.coordinates[0], dCntrLat = oFoundObject.CntrLat || oFoundObject.Geometry.coordinates[1];
			oMap.moveTo(dCntrLon, dCntrLat, iZoom);
		}
	};
	
	/**Центрует карту по переданному объекту
	@param {MapObject} oFoundObject объект, который нужно поместить в центр
	@returns {void}*/
	this.CenterObject = function(oFoundObject){
		CenterObject(oFoundObject);
	}
	
	/** Рисует объекты на карте
	@param {int} iDataSourceN № источника данных (группы результатов поиска)
	@returns {void}*/
	this.DrawObjects = function(iDataSourceN, arrFoundObjects){
		if (arrContainer[iDataSourceN] != null) arrContainer[iDataSourceN].remove();
		arrContainer[iDataSourceN] = oMap.addObject();
		arrContainer[iDataSourceN].setVisible(false);
		iCount = arrFoundObjects.length;
		//Отрисовываем задом наперед, чтобы номер 1 был сверху от 10ого
		for (var i = arrFoundObjects.length - 1; i >= 0; i--){
			DrawObject(arrContainer[iDataSourceN], arrFoundObjects[i], i);
		}
		arrContainer[iDataSourceN].setVisible(true);
		if (bAutoCenter && iDataSourceN == 0) CenterObject(arrFoundObjects[0]);
	}
};

/** Конструктор
 @class Предоставляет функции, отображающие найденные объекты на карте
 @memberof Search
 @param {object} oInitMap карта, на которой будут рисоваться объекты
 @param {function} fnSearchLocation = function({Geometry, callback})- функция поиска объектов по переданной геометрии*/
var LocationTitleRenderer = function(oInitMap, fnSearchLocation){
	var _this = this;
	var oMap = oInitMap;
	var dtLastSearch;
	
	/**Добавляет объект в список найденных результатов*/
	var drawObject = function(oFoundObject, elemDiv)
	{
		if (oFoundObject.Parent != null) drawObject(oFoundObject.Parent, elemDiv, true);
		var	realPath = oFoundObject.IsForeign ? oFoundObject.ObjName : Functions.GetFullName(oFoundObject.TypeName, oFoundObject.ObjName);
		
		var searchElemHeader = _span([_t(realPath)], [['dir', 'className', 'searchLocationPath']]);

		/** Вызывается при клике на найденный объект в списке результатов поиска
		@name Search.ResultList.onObjectClick
		@event
		@param {object} oFoundObject Найденный объект*/
		searchElemHeader.onclick = function(){$(_this).triggerHandler('onObjectClick', [oFoundObject]);};
		
		if (oFoundObject.Parent != null) _(elemDiv, [_t("->")]);
		_(elemDiv, [searchElemHeader]);
	}

	var setLocationTitleDiv = function(div, attr) {
		if (dtLastSearch && Number(new Date()) - dtLastSearch < 300) return;
		dtLastSearch = new Date();
		
		var locationTitleDiv = div;

		fnSearchLocation({Geometry: attr['screenGeometry'], callback: function(arrResultDataSources){
			removeChilds(locationTitleDiv);
			if(arrResultDataSources.length>0 && arrResultDataSources[0].SearchResult.length>0){
				drawObject(arrResultDataSources[0].SearchResult[0], locationTitleDiv);
			}
			else{
				_(locationTitleDiv, [_t(_gtxt("Текущее местоположение отображается только для России и Украины"))]);
			}
		}});
	};
	
	oMap.coordinates.addCoordinatesFormat(setLocationTitleDiv);
}

/** Возвращает контрол, отображающий результаты поиска в виде списка с нанесением на карту 
 @memberof Search
 @param {object} oInitContainer Объект, в котором находится контрол результатов поиска в виде списка(div)
 @param {object} oInitMap карта, на которой будут рисоваться объекты
 @param {string} ImagesHost - строка пути к картинкам
 @param {bool} bInitAutoCenter - если true, карта будет центрироваться по 1ому найденному объекту
 @returns {Search.ResultListMap}*/
var ResultListMapGet = function(oInitContainer, oInitMap, sImagesHost, bInitAutoCenter){
	var oRenderer = new ResultRenderer(oInitMap, sImagesHost, bInitAutoCenter);
	var lstResult = new ResultList(oInitContainer, sImagesHost);
	ResultListMap.apply(this, [lstResult, oRenderer]);
}

ResultListMapGet.prototype = ResultListMap;

/** Конструктор
 @class Контрол, отображающий результаты поиска в виде списка с нанесением на карту
 @memberof Search
 @param lstResult Контрол результатов поиска в виде списка
 @param oRenderer Объект, предоставляющий функции отрисовки найденных объектов на карте*/
var ResultListMap = function(lstResult, oRenderer){
	var _this = this;
	
	var fnDisplayedObjectsChanged = function(event, iDataSourceN, arrFoundObjects){
		oRenderer.DrawObjects(iDataSourceN, arrFoundObjects);
		/** Вызывается при изменении отображаемого списка найденных объектов(ведь они отображаются не все)
		@name Search.ResultListMap.onDisplayedObjectsChanged
		@event
		@param {int} iDataSourceN № источника данных(группы результатов поиска)
		@param {object[]} arrDSDisplayedObjects Результаты поиска, которые необходимо отобразить в текущей группе*/
		$(_this).triggerHandler('onDisplayedObjectsChanged', [iDataSourceN, arrFoundObjects]);
	}
	
	var fnObjectClick = function(event, oFoundObject){
		oRenderer.CenterObject(oFoundObject);
		
		/** Вызывается при клике на найденный объект в списке результатов поиска
		@name Search.ResultListMap.onObjectClick
		@event
		@param {object} oFoundObject Найденный объект*/
		$(_this).triggerHandler('onObjectClick', [oFoundObject]);
	}
	
	var fnDownloadSHP = function(event, filename, arrObjectsToDownload){
		/** Вызывается при необходимости осуществить загрузку SHP-файла с результатами поиска
		@name Search.ResultListMap.onDownloadSHP
		@event
		@param {string} filename Имя файла, которой необходимо будет сформировать
		@param {object[]} SearchResult Результаты поиска, которые необходимо сохранить в файл*/
		$(_this).triggerHandler('onDownloadSHP', [filename, arrObjectsToDownload]);
	}
	
	$(lstResult).bind('onDisplayedObjectsChanged', fnDisplayedObjectsChanged);
	$(lstResult).bind('onObjectClick', fnObjectClick);
	$(lstResult).bind('onDownloadSHP', fnDownloadSHP);
	
	/**Отображает результаты поиска в списке
	@param sTotalListName - заголовок итогового результата
	@param arrTotalList [{name:DataSourceName, CanDownloadVectors:CanDownloadVectors, SearchResult:arrDataSourceList[oObjFound,...]},...]
	@returns {void}*/
	this.ShowResult = function(sTotalListName, arrTotalList){
		lstResult.ShowResult(sTotalListName, arrTotalList);
	}

	/**Показывает режим загрузки
	@returns {void}*/
	this.ShowLoading = function(){
		lstResult.ShowLoading();
	}
	
	/**Показывает сообщение об ошибке
	@returns {void}*/
	this.ShowError = function(){
		lstResult.ShowError();
	}

	/**Центрует карту по переданному объекту
	@param {MapObject} oFoundObject объект, который нужно поместить в центр
	@returns {void}*/
	this.CenterObject = function(oFoundObject){
		oRenderer.CenterObject(oFoundObject);
	}
	
	/**Очищает результаты поиска
	@returns {void}*/
	this.Unload = function(){lstResult.Unload();};
	/** Возвращает контейнер, содержащий список найденных объектов*/
	this.getContainerList = function(){return lstResult.getContainer();};
}

/**Конструктор
 @class SearchDataProvider Посылает запрос к поисковому серверу
 @memberof Search
 @param {string} sInitServerBase Адрес сервера, на котором установлен поисковый модуль Geomixer'а
 @param {object} oInitMap карта, на которой будут рисоваться объекты
 @param {string[]} arrDisplayFields список атрибутов векторных слоев, которые будут отображаться в результатах поиска*/
var SearchDataProvider = function(sInitServerBase, oInitMap, arrDisplayFields){
	var sServerBase = sInitServerBase;
	if (sServerBase == null || sServerBase.length < 7) {throw "Error in SearchDataProvider: sServerBase is not supplied"};
	var oMap = oInitMap;
	var iDefaultLimit = 100;
	var _this = this;
	/**Осуществляет поиск по произвольным параметрам
	@param {object} params Параметры: </br>
		<i>callback</i> = function(arrResultDataSources) - вызывается после получения ответа от сервера </br>
		<i>SearchString</i> - строка для поиска </br>
		<i>IsStrongSearch</i> - признак того, что искать только целые слова </br>
		<i>Geometry</i> - искать только объекты, пересекающие данную геометрию </br>
		<i>Limit</i> - максимальное число найденных объектов
		<i>WithoutGeometry<i> - не передавать геометрию в результатах поиска
		<i>RequestType<i> - Тип запроса к серверу
	@returns {void}*/
	var fnSearch = function(params)	{
		var callback = params.callback;
		var sQueryString = "RequestType=" + escape(params.RequestType);
		if (params.SearchString != null) sQueryString += "&SearchString=" + escape(params.SearchString);
		if (params.Geometry != null) sQueryString += "&GeometryJSON=" + escape(JSON.stringify(params.Geometry));
		if (params.Limit != null) sQueryString += "&Limit=" + escape(params.Limit.toString());
		if (params.ID != null) sQueryString += "&ID=" + escape(params.ID.toString());
		if (params.IsStrongSearch != null) sQueryString += "&IsStrongSearch=" + escape(params.IsStrongSearch ? "1" : "0");
		if (params.WithoutGeometry != null) sQueryString += "&WithoutGeometry=" + escape(params.WithoutGeometry ? "1" : "0");
		//if (sFormatName != null) sQueryString += "&Format=" + escape(sFormatName);
		sendCrossDomainJSONRequest(sServerBase + "SearchObject/SearchAddress.ashx?" + sQueryString, function(response){
			if (response.Status == 'ok') {callback(response.Result);}
			else {throw response.ErrorInfo.ErrorMessage;}
		});
	};
	
	/**Осуществляет поиск по переданной строке
	@param {object} params Параметры: </br>
		<i>callback</i> = function(arrResultDataSources) - вызывается после получения ответа от сервера </br>
		<i>SearchString</i> - строка для поиска </br>
		<i>IsStrongSearch</i> - признак того, что искать только целые слова </br>
		<i>Limit</i> - максимальное число найденных объектов
		<i>WithoutGeometry<i> - не передавать геометрию в результатах поиска
	@returns {void}*/
	this.SearchByString = function(params){
		fnSearch({callback: params.callback, SearchString: params.SearchString, IsStrongSearch: params.IsStrongSearch, Limit: params.Limit, WithoutGeometry: params.WithoutGeometry, RequestType: "SearchObject"});
	};
	
	/**Получает информацию об объекте
	@param {object} params Параметры: </br>
		<i>callback</i> = function(arrResultDataSources) - вызывается после получения ответа от сервера </br>
		<i>ID</i> - идентификатор объекта </br>
	@returns {void}*/
	this.SearchID = function(params){
		fnSearch({callback: params.callback, ID: params.ID, RequestType: "ID"});
	}
	
	/**Осуществляет поиск текущего местонахождения
	@param {object} params Параметры: </br>
		<i>callback</i> = function(arrResultDataSources) - вызывается после получения ответа от сервера </br>
		<i>Geometry</i> - искать только объекты, пересекающие данную геометрию </br>
	@returns {void}*/
	this.SearchLocation = function(params){
		fnSearch({callback: params.callback, Geometry: params.Geometry, WithoutGeometry: true, RequestType: "Location"});
	}
	
	/**Осуществляет поиск по произвольным параметрам
	@param {object} params Параметры: </br>
		<i>callback</i> = function(arrResultDataSources) - вызывается после получения ответа от сервера </br>
		<i>SearchString</i> - строка для поиска </br>
		<i>IsStrongSearch</i> - признак того, что искать только целые слова </br>
		<i>Geometry</i> - искать только объекты, пересекающие данную геометрию </br>
		<i>Limit</i> - максимальное число найденных объектов
		<i>WithoutGeometry<i> - не передавать геометрию в результатах поиска
	@returns {void}*/
	this.Search = function(params){
		fnSearch({
			callback: params.callback, 
			SearchString: params.SearchString, 
			IsStrongSearch: params.IsStrongSearch, 
			Limit: params.Limit == null ? iDefaultLimit : params.Limit,
			Geometry: params.Geometry,
			WithoutGeometry: params.WithoutGeometry,
			RequestType: "SearchObject"
		});
	};
	
	/**Осуществляет поиск по векторным слоям
	@returns {void}*/
	this.LayerSearch = function(sInitSearchString, oInitGeometry, callback){
		//var geometry = JSON.stringify(merc_geometry({ type: "POLYGON", coordinates: [[-180, -89, -180, 89, 180, 89, 180, -89, -180, -89]] }));
		var arrResult = [];
		if(!oMap){
			callback(arrResult);
			return;
		}
		
		var layersToSearch = [];
		for(var i=0; i< oMap.layers.length; i++){
            if (oMap.layers[i].properties.type == "Vector" && oMap.layers[i].properties.AllowSearch && oMap.layers[i].isVisible)
                layersToSearch.push(oMap.layers[i]);
        }
		var iRespCount = 0;

		if (layersToSearch.length > 0){
			for (var iLayer = 0; iLayer < layersToSearch.length; iLayer++) {
				(function(iLayer){
					var url = "http://" + layersToSearch[iLayer].properties.hostName + "/SearchObject/SearchVector.ashx" + 
					"?LayerNames=" + layersToSearch[iLayer].properties.name + 
					"&MapName=" + layersToSearch[iLayer].properties.mapName +
					(sInitSearchString ? ("&SearchString=" + escape(sInitSearchString)) : "") +
					(oInitGeometry ? ("&border=" + JSON.stringify(merc_geometry(oInitGeometry))) : "");
					sendCrossDomainJSONRequest(
						url,
						function(searchReq)
						{
							iRespCount++;
							var arrLayerResult = [];
							if (searchReq.Status == 'ok')
							{
								for (var iServer = 0; iServer < searchReq.Result.length; iServer++)
								{
									var req = searchReq.Result[iServer];
									for (var j = 0; j < req.SearchResult.length; j++)
									{
										var arrDisplayProperties = {};
										if (!arrDisplayFields) {
											arrDisplayProperties = req.SearchResult[j].properties;
										}
										else {
											for (var iProperty=0; iProperty<arrDisplayFields.length; iProperty++){
												var sPropName = arrDisplayFields[iProperty];
												if(sPropName in req.SearchResult[j].properties) {
													arrDisplayProperties[sPropName] = req.SearchResult[j].properties[sPropName];
												}
											}
										}
										arrLayerResult.push({ 
											ObjName: req.SearchResult[j].properties.NAME || req.SearchResult[j].properties.Name || req.SearchResult[j].properties.name || req.SearchResult[j].properties.text || req.SearchResult[j].properties["Название"] || "[объект]",
											properties: arrDisplayProperties, 
											Geometry: from_merc_geometry(req.SearchResult[j].geometry) 
										});
									}
								}
							}		
							if(arrLayerResult.length > 0) arrResult.push({name: layersToSearch[iLayer].properties.title, SearchResult: arrLayerResult, CanDownloadVectors: true});						

							if (iRespCount == layersToSearch.length){
								callback(arrResult);
								return;
							}
						}
					);
				})(iLayer);
			}
		}
		else{
			callback(arrResult);
		}
	}
	
	/**Возвращает адрес сервера, на котором установлен поисковый модуль Geomixer'а*/
	this.GetServerBase = function(){
		return sServerBase;
	}
}

/**Возращает класс, который предоставляет функции обработки найденных данных
 @memberof Search
 @param {string} ServerBase Адрес сервера, на котором установлен поисковый модуль Geomixer'а
 @param {object} oInitMap карта, на которой будут рисоваться объекты
 @param {bool} WithoutGeometry - по умолчанию не передавать геометрию в результатах поиска
 @param {string[]} arrDisplayFields список атрибутов векторных слоев, которые будут отображаться в результатах поиска
 @returns {Search.SearchLogic}*/
var SearchLogicGet = function(ServerBase, oInitMap, WithoutGeometry, arrDisplayFields){
	SearchLogic.apply(this, [new SearchDataProvider(ServerBase, oInitMap), WithoutGeometry, arrDisplayFields]);
}
SearchLogicGet.prototype = SearchLogic;

/**Конструктор
 @class Предоставляет функции обработки найденных данных
 @memberof Search
 @param {object} oInitSearchDataProvider источник данных для обработки
 @param {bool} WithoutGeometry - по умолчанию не передавать геометрию в результатах поиска
*/
var SearchLogic = function(oInitSearchDataProvider, WithoutGeometry){
	var oSearchDataProvider = oInitSearchDataProvider;
	var _this = this;
	if(oSearchDataProvider == null) throw "Error in SearchLogic: oSearchDataProvider is not supplied";
			
	/** Возращает полный путь к объекту для отображения в подсказке
	@param oFoundObject Найденный объект
	@param sObjNameField название свойства, из которого брать наименование
	@param sObjNameField название свойства, из которого брать наименование родительского объекта
	*/
	var fnGetLabel = function(oFoundObject, sObjNameField, sObjNameFieldParent){
		var sLabel = Functions.GetFullName(oFoundObject.TypeName, oFoundObject[sObjNameField]);
		if (oFoundObject.Parent != null) sLabel += ", " + Functions.GetPath(oFoundObject.Parent, ", ", true, sObjNameFieldParent);
		return sLabel;
	}
	
	/**Возращает сгуппированные данные для отображения подсказок поиска в функции callback
	@param {string} SearchString строка, по которой надо выдать подсказку
	@param callback = function(arrResult) {...} - вызывается когда подсказка готова
	@returns {void}*/
	this.AutoCompleteData = function (SearchString, callback){
		_this.SearchByString({SearchString: SearchString, IsStrongSearch: 0, Limit:10, WithoutGeometry: WithoutGeometry, callback: function(arrResultDataSources){
			var arrResult = [];
			var sSearchRegExp = new RegExp("("+SearchString.replace(/[^\wа-яА-Я]+/, "|")+")", "i");
			for(var iDS=0; iDS<arrResultDataSources.length; iDS++){
				for(var iFoundObject=0; iFoundObject<arrResultDataSources[iDS].SearchResult.length; iFoundObject++){
					var oFoundObject = arrResultDataSources[iDS].SearchResult[iFoundObject];
					var sLabel = fnGetLabel(oFoundObject, "ObjName", "ObjName"), sValue = Functions.GetFullName(oFoundObject.TypeName, oFoundObject.ObjName);
					if(/[a-zA-Z]/.test(SearchString)){
						if(oFoundObject.ObjAltNameEng && oFoundObject.ObjAltNameEng.match(sSearchRegExp)){
							sLabel = fnGetLabel(oFoundObject, "ObjAltNameEng", "ObjNameEng");
							sValue = sLabel;
							if (oFoundObject.ObjAltName && !/[a-zA-Z]/.test(oFoundObject.ObjName)) sLabel += ' | ' + fnGetLabel(oFoundObject, "ObjAltName", "ObjName");
						}
						else{
							sLabel = fnGetLabel(oFoundObject, "ObjNameEng", "ObjNameEng");
							sValue = sLabel;
							if (oFoundObject.ObjName && !/[a-zA-Z]/.test(oFoundObject.ObjName)) sLabel += ' | ' + fnGetLabel(oFoundObject, "ObjName", "ObjName");
						}
					}
					else{
						if(oFoundObject.ObjAltName && oFoundObject.ObjAltName.match(sSearchRegExp)){
							sLabel = fnGetLabel(oFoundObject, "ObjAltName", "ObjName");
							sValue = sLabel;
							if (oFoundObject.ObjAltNameEng) sLabel += ' | ' + fnGetLabel(oFoundObject, "ObjAltNameEng", "ObjNameEng");
						}
						else{
							sLabel = fnGetLabel(oFoundObject, "ObjName", "ObjName");
							sValue = sLabel;
							if (oFoundObject.ObjNameEng) sLabel += ' | ' + fnGetLabel(oFoundObject, "ObjNameEng", "ObjNameEng");
						}
					}
					arrResult.push({
						label: sLabel,
						value: sValue,
						GeoObject: oFoundObject});
				}
				if(arrResult.length>0) break;
			}
			callback(arrResult);
		}});
	}
	
	/** Группирует по категории
	@param {Array} arrInitDataSources Массив ответов от поисковых серверов
	@returns {Array} Массив сгруппированых по категориям данных*/
	this.GroupByCategory = function(arrInitDataSources)	{
		var arrResultDataSources = [];
		for(var i=0; i<arrInitDataSources.length; i++){
			arrResultDataSources[i] = {	name: arrInitDataSources[i].name, 
										CanDownloadVectors: arrInitDataSources[i].CanDownloadVectors, 
										SearchResult: []};
			var oDataSource = arrInitDataSources[i].SearchResult;
			var Categories = arrResultDataSources[i].SearchResult;
			var CategoriesIndex = {};
			for(var j=0; j<oDataSource.length; j++){
				var sCategory = "";
				var sCategoryDesc = "";
				var iPriority = 9999999;
				var iCatID = 0;
				if(oDataSource[j].Parent != null)
				{
					iCatID = oDataSource[j].Parent.ObjCode;
					sCategory = Functions.GetPath(oDataSource[j].Parent, ", ", false);
					sCategoryDesc = Functions.GetPath(oDataSource[j].Parent, ", ", true);
					iPriority = oDataSource[j].Parent.Priority;
				}
				if(CategoriesIndex[iCatID]==null) {
					CategoriesIndex[iCatID] = Categories.push({Name: sCategory, Priority: iPriority, GeoObjects: []}) - 1;
				}
				Categories[CategoriesIndex[iCatID]].GeoObjects.push(oDataSource[j]);
			}
			for(var j in Categories){
				if(Categories[j].GeoObjects.length == 1 && Categories[j].Name != ""){
					if(CategoriesIndex["0"]==null) {
						CategoriesIndex["0"] = Categories.push({Name: "", Priority: 9999999, GeoObjects: []})-1;
					}
					Categories[CategoriesIndex["0"]].GeoObjects.push(Categories[j].GeoObjects[0]);
					Categories[j] = null;
				}
			}
			Categories.sort(function(a, b){
				if (a == null || b == null) return 0;
				if (a.Priority < b.Priority)
					return 1;
				if (a.Priority > b.Priority)
					return -1;
				if (a.Name > b.Name)
					return 1;
				if (a.Name < b.Name)
					return -1;
				return 0;
			});
		}
		return arrResultDataSources;
	}
	
	/**Осуществляет поиск по переданной строке
	@param {object} params Параметры: </br>
		<i>callback</i> = function(arrResultDataSources) - вызывается после получения ответа от сервера </br>
		<i>layersSearchFlag</i> - признак необходимости искать по векторным слоям </br>
		<i>SearchString</i> - строка для поиска </br>
		<i>IsStrongSearch</i> - признак того, что искать только целые слова </br>
		<i>Limit</i> - максимальное число найденных объектов
		<i>WithoutGeometry<i> - не передавать геометрию в результатах поиска
	@returns {void}*/
	this.SearchByString = function(params){
		oSearchDataProvider.SearchByString({SearchString: params.SearchString, IsStrongSearch: params.IsStrongSearch, Limit:params.Limit, WithoutGeometry: params.WithoutGeometry || WithoutGeometry,
											callback: function(response) {
				for(var i=0; i<response.length; i++)	response[i].CanDownloadVectors = false;
				if (params.layersSearchFlag){
					var arrLayerSearchResult = oSearchDataProvider.LayerSearch(params.SearchString, null, function(arrLayerSearchResult){
						params.callback(response.concat(arrLayerSearchResult));
					});
				}
				else {
					params.callback(response);
				}
			}
		});
	};
	
	/**Получает информацию об объекте
	@param {object} params Параметры: </br>
		<i>callback</i> = function(arrResultDataSources) - вызывается после получения ответа от сервера </br>
		<i>ID</i> - идентификатор объекта </br>
	@returns {void}*/
	this.SearchID = function(params){
		oSearchDataProvider.SearchID({callback: params.callback, ID: params.ID});
	}
	
	/**Осуществляет поиск текущего местонахождения
	@param {object} params Параметры: </br>
		<i>callback</i> = function(arrResultDataSources) - вызывается после получения ответа от сервера </br>
		<i>Geometry</i> - искать только объекты, пересекающие данную геометрию </br>
	@returns {void}*/
	this.SearchLocation = function(params){
		oSearchDataProvider.SearchLocation({callback: params.callback, Geometry: params.Geometry});
	}
	
	/**Осуществляет поиск по произвольным параметрам
	@param {object} params Параметры: </br>
		<i>callback</i> = function(arrResultDataSources) - вызывается после получения ответа от сервера </br>
		<i>SearchString</i> - строка для поиска </br>
		<i>IsStrongSearch</i> - признак того, что искать только целые слова </br>
		<i>Geometry</i> - искать только объекты, пересекающие данную геометрию </br>
		<i>Limit</i> - максимальное число найденных объектов
		<i>WithoutGeometry<i> - не передавать геометрию в результатах поиска
		<i>RequestType<i> - Тип запроса к серверу
	@returns {void}*/
	this.Search = function(params){
		oSearchDataProvider.Search({
			callback: params.callback, 
			SearchString: params.SearchString, 
			IsStrongSearch: params.IsStrongSearch, 
			Limit: params.Limit == null ? iDefaultLimit : params.Limit,
			Geometry: params.Geometry,
			WithoutGeometry: params.WithoutGeometry
		});
	};
	
	/** Возвращает адрес сервера, на котором установлен поисковый модуль Geomixer'а */
	this.GetServerBase = function(){
		return oSearchDataProvider.GetServerBase();
	}
}

/** Возвращает контрол, содержащий все все компоненты поиска и обеспечивающий их взаимодействие между собой
@memberof Search
@param {object} params Параметры: </br>
		<i>ServerBase</i> - Адрес сервера, на котором установлен поисковый модуль Geomixer'а </br>
		<i>ImagesHost</i> - строка пути к картинкам </br>
		<i>ContainerInput</i> - Объект, в котором находится контрол поискового поля (div) </br>
		<i>layersSearchFlag</i> - Признак видимости кнопки поиска по векторным слоям </br>
		<i>ContainerList</i> - Объект, в котором находится контрол результатов поиска в виде списка(div) </br>
		<i>Map</i> - карта, на которой будут рисоваться объекты </br>
		<i>WithoutGeometry<i> - не передавать геометрию в результатах поиска
 @returns {Search.SearchControl} */
var SearchControlGet = function (params){
	var oLogic = new SearchLogicGet(params.ServerBase, params.Map, params.WithoutGeometry);
	var fnAutoCompleteSource = function (request, response) {
		oLogic.AutoCompleteData(request.term, response);
	}
	/**Результаты поиска*/
	var lstResult = new ResultListMapGet(params.ContainerList, params.Map, params.ImagesHost);
	/**Строка ввода поискового запроса*/
	var btnSearch = new SearchInput(params.ContainerInput, {
		ImagesHost: params.ImagesHost,
		layersSearchFlag: params.layersSearchFlag,
		AutoCompleteSource: fnAutoCompleteSource
	});
	var oLocationTitleRenderer = new LocationTitleRenderer(params.Map, oLogic.SearchLocation);
	SearchControl.apply(this, [btnSearch, lstResult, oLogic, oLocationTitleRenderer]);
}
SearchControlGet.prototype = SearchControl;

/** Конструктор
 @class Контрол, содержащий все все компоненты поиска и обеспечивающий их взаимодействие между собой
 @memberof Search
 @param oInitInput Текстовое поле ввода
 @param oInitResultListMap Отображение результатов поиска
 @param oInitLogic Слой бизнес-логики
 @param oInitLocationTitleRenderer Отображение на карте текущего местоположения*/
var SearchControl = function(oInitInput, oInitResultListMap, oInitLogic, oInitLocationTitleRenderer){
	var _this = this;
	
	var oLogic = oInitLogic;
	/**Результаты поиска*/
	var lstResult = oInitResultListMap;
	/**Строка ввода поискового запроса*/
	var btnSearch = oInitInput;
	
	var oLocationTitleRenderer = oInitLocationTitleRenderer;
	
	var downloadVectorForm = _form([_input(null, [['attr', 'name', 'name']]),
							 _input(null, [['attr', 'name', 'points']]),
							 _input(null, [['attr', 'name', 'lines']]),
							 _input(null, [['attr', 'name', 'polygons']])], [['css', 'display', 'none'], ['attr', 'method', 'POST'], ['attr', 'action', oLogic.GetServerBase() + "/Shapefile.ashx"]]);
	
	_(oInitResultListMap.getContainerList(), [downloadVectorForm]);
	
	/**Осуществляет загрузку SHP-файла*/
	var fnDownloadSHP = function(filename, arrObjectsToDownload){
		var objectsByType = {};

		for (var i = 0; i < arrObjectsToDownload.length; i++) {
			var type = arrObjectsToDownload[i].Geometry.type;

			if (!objectsByType[type])
				objectsByType[type] = [];

			objectsByType[type].push({ geometry: arrObjectsToDownload[i].Geometry, properties: {} });
		}

		downloadVectorForm.childNodes[0].value = filename.value;
		downloadVectorForm.childNodes[1].value = objectsByType["POINT"] ? JSON.stringify(objectsByType["POINT"]).split("%22").join("\\\"") : '';
		downloadVectorForm.childNodes[2].value = objectsByType["LINESTRING"] ? JSON.stringify(objectsByType["LINESTRING"]).split("%22").join("\\\"") : '';
		downloadVectorForm.childNodes[3].value = objectsByType["POLYGON"] ? JSON.stringify(objectsByType["POLYGON"]).split("%22").join("\\\"") : '';

		downloadVectorForm.submit();
	};

	var fnBeforeSearch = function(){
		/** Вызывается перед началом поиска
		@name Search.SearchControl.onBeforeSearch
		@event*/
		$(_this).triggerHandler('onBeforeSearch');
	}
	
	var fnAfterSearch = function(){
		/** Вызывается после окончания поиска
		@name Search.SearchControl.onBeforeSearch
		@event*/
		$(_this).triggerHandler('onAfterSearch');
	}
	
	/**Осуществляет поиск*/
	var fnSearchByString = function(event, SearchString, layersSearchFlag)
	{
		try{
			fnBeforeSearch();
			if (!parseCoordinates(SearchString, function(x, y) {
				globalFlashMap.moveTo(x, y, globalFlashMap.getZ());
				globalFlashMap.drawing.addObject({ type: "POINT", coordinates: [x, y] }, { text: SearchString });
				
				fnAfterSearch();
			})){
				lstResult.ShowLoading();
				oLogic.SearchByString({SearchString: SearchString, IsStrongSearch: true, layersSearchFlag: layersSearchFlag, callback: function(response) {
					lstResult.ShowResult(SearchString, response);
					fnAfterSearch();
				}});
			}
		}
		catch (e){
			lstResult.ShowError();
		}
	}
	
	/**Осуществляет выбор объекта из подсказки*/
	var fnSelect = function(event, oAutoCompleteItem){
		if (fnBeforeSearch != null) fnBeforeSearch();
		lstResult.ShowResult(oAutoCompleteItem.label, [{ name: "Выбрано", SearchResult: [oAutoCompleteItem.GeoObject] }]);
		if (fnAfterSearch != null) fnAfterSearch();
	}

			
	var onDisplayedObjectsChanged = function(event, iDataSourceN, arrFoundObjects){
		/** Вызывается при изменении отображаемого списка найденных объектов(ведь они отображаются не все)
		@name Search.SearchControl.onDisplayedObjectsChanged
		@event
		@param {int} iDataSourceN № источника данных(группы результатов поиска)
		@param {object[]} arrDSDisplayedObjects Результаты поиска, которые необходимо отобразить в текущей группе*/
		$(_this).triggerHandler('onDisplayedObjectsChanged', [iDataSourceN, arrFoundObjects]);
	}
	
	var onObjectClick = function(event, oFoundObject){
		/** Вызывается при клике на найденный объект в списке результатов поиска
		@name Search.SearchControl.onObjectClick
		@event
		@param {object} oFoundObject Найденный объект*/
		$(_this).triggerHandler('onObjectClick', [oFoundObject]);
	}
	
	$(lstResult).bind('onDisplayedObjectsChanged', onDisplayedObjectsChanged);
	$(lstResult).bind('onObjectClick', onObjectClick);
	$(lstResult).bind('onDownloadSHP', fnDownloadSHP);
	$(btnSearch).bind('Search', fnSearchByString);
	$(btnSearch).bind('AutoCompleteSelect', fnSelect);
	if (oLocationTitleRenderer != null) {
		$(oLocationTitleRenderer).bind('onObjectClick', function(event, oFoundObject){
			lstResult.CenterObject(oFoundObject);
			onObjectClick(event, oFoundObject);
		});
	}
	/**Осуществляет поиск по произвольным параметрам по адресной базе
	@param {object} params Параметры: </br>
		<i>SearchString</i> - строка для поиска </br>
		<i>IsStrongSearch</i> - признак того, что искать только целые слова </br>
		<i>Geometry</i> - искать только объекты, пересекающие данную геометрию </br>
		<i>Limit</i> - максимальное число найденных объектов
	@returns {void}*/
	this.Search = function(params){
		try{
			var sSearchString = params.SearchString || '';
			if (sSearchString == '' && params.Geometry == null) throw "Error in SearchControl: Не заданы параметры поиска!";
			if (sSearchString == '') sSearchString = 'Поиск по выделенной области';
			lstResult.ShowLoading();
			if (fnBeforeSearch != null) fnBeforeSearch();
			oLogic.Search({
				SearchString: params.SearchString, 
				IsStrongSearch: params.IsStrongSearch, 
				Limit: params.Limit,
				Geometry: params.Geometry,
				callback: function(arrResultDataSources){
					lstResult.ShowResult(sSearchString, arrResultDataSources);
					if (fnAfterSearch != null) fnAfterSearch();
				}
			});
		}
		catch (e){
			lstResult.ShowError();
		}
	};
	
	/**Возвращает стоку поиска*/
	this.GetSearchString = function(){
		return btnSearch.GetSearchString();
	}
	
	/**Устанавливает строку поиска*/
	this.SetSearchString = function(value){
		btnSearch.SetSearchString(value);
	}
	
	/**Показывает режим загрузки
	@returns {void}*/
	this.ShowLoading = function(){
		lstResult.ShowLoading();
	}
	
	/**Очищает результаты поиска
	@returns {void}*/
	this.Unload = function(){lstResult.Unload();};
}

/**Конструктор без параметров
 @class SearchGeomixer Контрол, содержащий все все компоненты поиска и встраивающий их во Viewer
 @memberof Search*/
var SearchGeomixer = function(){
	var _this = this;
	var oMenu;
	var oSearchControl;
	
	var oSearchInputDiv = _div();
	var oSearchResultDiv = _div();
	var workCanvas;
	
	_title(oSearchInputDiv, _gtxt('Изменить параметры поиска'));
	
	var fnLoad = function(){
		if (oMenu != null){
			var alreadyLoaded = oMenu.createWorkCanvas("search", fnUnload);
			if(!alreadyLoaded) _(oMenu.workCanvas, [oSearchResultDiv]);
		}
	}
	var fnUnload = function(){
		if (oSearchControl != null)oSearchControl.Unload();
	}
		
	var fnBeforeSearch = function(event){
		/** Вызывается перед началом поиска
		@name Search.SearchGeomixer.onBeforeSearch
		@event */
		$(_this).triggerHandler('onBeforeSearch');
		fnLoad();
	}
	
	var fnAfterSearch = function(event){
		/** Вызывается после окончания поиска
		@name Search.SearchGeomixer.onAfterSearch
		@event */
		$(_this).triggerHandler('onAfterSearch');
	}
	
	var onDisplayedObjectsChanged = function(event, iDataSourceN, arrFoundObjects){
		/** Вызывается при изменении отображаемого списка найденных объектов(ведь они отображаются не все)
		@name Search.SearchGeomixer.onDisplayedObjectsChanged
		@event
		@param {int} iDataSourceN № источника данных(группы результатов поиска)
		@param {object[]} arrDSDisplayedObjects Результаты поиска, которые необходимо отобразить в текущей группе*/
		$(_this).triggerHandler('onDisplayedObjectsChanged', [iDataSourceN, arrFoundObjects]);
	}
	
	var onObjectClick = function(event, oFoundObject){
		/** Вызывается при клике на найденный объект в списке результатов поиска
		@name Search.SearchGeomixer.onObjectClick
		@event
		@param {object} oFoundObject Найденный объект*/
		$(_this).triggerHandler('onObjectClick', [oFoundObject]);
	}

	/**Инициализирует контрол
	@param {object} params Параметры: </br>
		<i>ServerBase</i> - Адрес сервера, на котором установлен поисковый модуль Geomixer'а </br>
		<i>ContainerInput</i> - Объект, в котором находится контрол поискового поля (div) </br>
		<i>layersSearchFlag</i> - Признак видимости кнопки поиска по векторным слоям </br>
		<i>ContainerList</i> - Объект, в котором находится контрол результатов поиска в виде списка(div) </br>
		<i>Map</i> - карта, на которой будут рисоваться объекты </br>
		<i>MapHelper</i> - вспомогательный компонент для работы с картой </br>
	@returns {void}*/
	this.Init = function(params){
		if (oMenu == null) oMenu = params.Menu;
		if (oMenu == null) throw "Error in SearchGeomixer: Menu is null";
		_(params.ContainerInput, [oSearchInputDiv]);
		oSearchControl = new SearchControlGet({ServerBase: params.ServerBase, 
											ImagesHost: params.ServerBase + "/api/img",
											ContainerInput: oSearchInputDiv, 
											layersSearchFlag: params.layersSearchFlag,
											ContainerList: oSearchResultDiv,
											Map: params.Map});
		$(oSearchControl).bind('onBeforeSearch', fnBeforeSearch);
		$(oSearchControl).bind('onAfterSearch', fnAfterSearch);
		$(oSearchControl).bind('onDisplayedObjectsChanged', onDisplayedObjectsChanged);
		$(oSearchControl).bind('onObjectClick', onObjectClick);
	}
	
	/** Загружает контрол в левое меню
	@returns {void}*/
	this.Load = function(){
		fnLoad();
	}
	
	/** Выгружает контрол из левого меню
	@returns {void}*/
	this.Unload = function(){
		fnUnload();
	}
	
	/**Осуществляет поиск по произвольным параметрам по адресной базе
	@param {object} params Параметры: </br>
		<i>SearchString</i> - строка для поиска </br>
		<i>IsStrongSearch</i> - признак того, что искать только целые слова </br>
		<i>Geometry</i> - искать только объекты, пересекающие данную геометрию </br>
		<i>Limit</i> - максимальное число найденных объектов
	@returns {void}*/
	this.Search = function(params){
		oSearchControl.Search({
			SearchString: params.SearchString, 
			IsStrongSearch: params.IsStrongSearch, 
			Limit: params.Limit,
			Geometry: params.Geometry
		});
	};
	
	/**Возвращает стоку поиска*/
	this.GetSearchString = function(){
		return oSearchControl.GetSearchString();
	}
	
	/**Устанавливает строку поиска*/
	this.SetSearchString = function(value){
		oSearchControl.SetSearchString(value);
	}
}

var publicInterface = {
	SearchGeomixer: SearchGeomixer,
	SearchControl: SearchControl,
	SearchControlGet: SearchControlGet,
	SearchInput: SearchInput,
	ResultList: ResultList,
	ResultRenderer: ResultRenderer,
	ResultListMap: ResultListMap,
	ResultListMapGet: ResultListMapGet,
	SearchDataProvider: SearchDataProvider,
	SearchLogic: SearchLogic,
	SearchLogicGet: SearchLogicGet,
	LocationTitleRenderer: LocationTitleRenderer,
	Functions: Functions
}

gmxCore.addModule("search", publicInterface);

})(jQuery); 