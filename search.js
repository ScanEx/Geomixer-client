//Необходимо подключить JS-библиотеки: jquery, jquery-ui, api.js, utilites.js, treeview.js, translations.js, gmxCore.js, 	файл локализации
//						стили: jquery, jquery-ui, search.css, treeview.css, buttons.css
(function(){

// Возвращает полное наименование объекта, состоящее и типа и наименования.
// sType - Наименование типа объекта 
// sName - Наименование объекта
var GetFullName = function(sType, sName){
	var sFullName = "";
	
	if (sType==null || sType == "государство" || /[a-zA-Z]/.test(sName))
		sFullName = sName;
	else if ((sType.indexOf("район") != -1) || (sType.indexOf("область") != -1) || (sType.indexOf("край") != -1))
		sFullName = sName + " " + sType;
	else
		sFullName = sType + " " + sName;
	
	return sFullName;
};

//Возвращает полный путь к объекту
//oFoundObject - найденный объект
//sObjectsSeparator - разделитель между дочерним элементом и родителем в строке пути
//bParentAfter - признак того, что родительский элемент идет после дочернего
var GetPath = function(oFoundObject, sObjectsSeparator, bParentAfter){
	if (oFoundObject == null) return "";
	var oParentObj = oFoundObject.Parent;
	if (oParentObj != null && (oParentObj.ObjName == "Российская Федерация" || oParentObj.TypeName == "административный округ")) {
		oParentObj = oParentObj.Parent;
	}
	
	if (oParentObj != null){
		if (bParentAfter){
			return GetFullName(oFoundObject.TypeName, oFoundObject.ObjName) + sObjectsSeparator + GetPath(oParentObj, sObjectsSeparator);
		}
		else{
			return GetPath(oParentObj, sObjectsSeparator) + sObjectsSeparator + GetFullName(oFoundObject.TypeName, oFoundObject.ObjName);
		}
	}
	else{
		return GetFullName(oFoundObject.TypeName, oFoundObject.ObjName);
	}
}

//Возвращает строку, соединяющую переданные свойства
var GetPropertiesString = function(oProps, sPropSeparator){
	var sResultString = "";
	if (oProps != null){
		for (var sPropName in oProps){
			if (sResultString != "") sResultString += sPropSeparator;
			sResultString += sPropName + ": " + oProps[sPropName];
		}
	}
	return sResultString;
}

//Контрол, состоящий из поля поиска с подсказками и кнопкой поиска по векторным слоям
//oInitContainer - Объект, в котором находится контрол (div) - обязательный
//params = {} - Параметры:
//	* layersSearchFlag - Признак видимости кнопки поиска по векторным слоям
//	* Search = function(event, SearchString, layersSearchFlag) -  осуществляет поиск по строке поиска и признаку "Искать по векторным слоям"
//	* AutoCompleteSource = function(request, response) - возвращает данные для автозаполнения: [{label:..., category: ...}]
//	* AutoCompleteSelect = function(event, oAutoCompleteItem) - вызывается при выборе из строки автозаполнения
var SearchInput = function (oInitContainer, params) {
	var Container = oInitContainer; //Объект, в котором находится контрол (div)
	var layersSearchFlag = params.layersSearchFlag; //Признак видимости кнопки поиска по векторным слоям
	var _this = this;	
	if (Container == null) throw "SearchInput.Container is null";
	//if (Search == null) throw "SearchInput.Search is null";
		
	this.GetSearchString = function(){return searchField.value};
	this.SetSearchString = function(value) {searchField.value = value};
	if (params.Search != null) $(this).bind('Search', params.Search)
	if (params.AutoCompleteSelect != null) $(this).bind('AutoCompleteSelect', params.AutoCompleteSelect)
		
	var dtLastSearch = new Date();
	var searchField = _input(null, [['dir', 'className', 'searchCenter']]);
    if ($.browser.msie)
		searchField.style.paddingTop = '4px';
	var sDefaultValue;
	
	var divSearchBegin, tdSearchBegin;
	var tdSearchButton = _td([_div(null, [['dir', 'className', 'searchEnd']])], [['dir', 'className', 'searchEndTD']]);
	
	var fnSearch = function(){
		$(_this).triggerHandler('Search', [searchField.value, layersSearchFlag]);
	}
    tdSearchButton.onclick = fnSearch;
	
	var updateSearchType = function() {
		var bChangeValue = (searchField.value == sDefaultValue);
	
		if (layersSearchFlag) {
			sDefaultValue = _gtxt("$$search$$_1");
			divSearchBegin.className = 'searchBeginOn';
		}
		else {
			sDefaultValue = _gtxt("$$search$$_2");
			divSearchBegin.className = 'searchBeginOff';
		}
		
		if (bChangeValue) searchField.value = sDefaultValue;
	}
	
	if (!layersSearchFlag) {
        sDefaultValue = _gtxt("$$search$$_2");
		divSearchBegin = _div(null, [['dir', 'className', 'searchBegin']]);
        tdSearchBegin = _td([divSearchBegin], [['dir', 'className', 'searchBeginTD']]);
    }
    else {
        sDefaultValue = _gtxt("$$search$$_1");
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
									[['dir', 'className', 'SearchInputControl']])

    //searchFieldCanvas.style.marginTop = '3px';

    searchField.onkeyup = function(e) {
        var evt = e || window.event;
        if (getkey(evt) == 13) {
			if (Number(new Date()) - dtLastSearch < 1000 || $("#ui-active-menuitem").get().length > 0) return; //Если уже ведется поиск по автозаполнению, то обычный не ведем
			if($(searchField).catcomplete != null)$(searchField).catcomplete("close");
            fnSearch();
            return true;
        }
    }

    searchField.onfocus = function() {
        if (this.value == sDefaultValue) {
            this.value = '';

            this.style.color = '#153069';
        }
    }

    searchField.onblur = function() {
        if (this.value == '') {
            this.style.color = '';

            this.value = sDefaultValue;
        }
    }

    _(Container, [searchFieldCanvas]);
	
	//Добавляем автокомплит только если задана функция источника данных для него
	if (params.AutoCompleteSource != null)
	{
		$.widget("custom.catcomplete", $.ui.autocomplete, {
			_renderMenu: function(ul, items) {
				var self = this,
					currentCategory = "";
				$.each(items, function(index, item) {
					if (item.category != currentCategory) {
						ul.append("<li class='ui-autocomplete-category'>" + item.category + "</li>");
						currentCategory = item.category;
					}
					self._renderItem(ul, item);
				});
			}
		});

		
		// выбор значения
		function fnAutoCompleteSelect(event, ui) {
			if (ui.item) {
				dtLastSearch = new Date();
				$(_this).triggerHandler('AutoCompleteSelect', [ui.item]);
			}
		}
		
		function fnAutoCompleteSource(request, response){
			if (Number(new Date()) - dtLastSearch > 5000) {
				params.AutoCompleteSource(request, response);
			}
			else
			{
				response([]);
			}
		}
		
		$(function() {
			$(".searchCenter").catcomplete({
				minLength: 3,
				source: fnAutoCompleteSource,
				select: fnAutoCompleteSelect
			});
		});
	}
};

//Контрол, отображающий результаты поиска в виде списка
//oInitContainer - Объект, в котором находится контрол (div), обязательный
//params = {} - Параметры:
//	* ImagesHost - строка пути к картинкам
//  * onDisplayedObjectsChanged = function (event, iDataSourceN, arrDisplayedObjects) {...} - Вызывается при изменении списка отображаемых объектов
//		- iDataSourceN - Номер источника данных (группы результатов поиска)
//		- arrDisplayedObjects - список объектов в группе
//  * onObjectClick = function (event, oClickedObject) {...} - Вызывается при клике по найденному объекту
//	* onDownloadSHP = function (event, filename, arrObjectsToDownload) {} - Вызывается при скачивании SHP-файла
var ResultList = function(oInitContainer, params){
	var Container = oInitContainer;
	var _this = this;
	var sImagesHost = "http://maps.kosmosnimki.ru/api/img";
	if (params != null){
		if (params.ImagesHost != null) sImagesHost = params.ImagesHost;
		//Вызывается при изменении списка отображаемых объектов
		if(params.onDisplayedObjectsChanged != null){$(this).bind('onDisplayedObjectsChanged', params.onDisplayedObjectsChanged);};
		//Вызывается при клике по найденному объекту
		if(params.onObjectClick != null){$(this).bind('onObjectClick', params.onObjectClick);};
		//Вызвается при скачивании SHP-файла
		if(params.onDownloadSHP != null){$(this).bind('onDownloadSHP', params.onDownloadSHP);};
	}
	
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
	
	//Удаляет все найденные объекты из результатов поиска
	var unload = function(){
		for(i=0; i<arrDisplayedObjects.length; i++){
			SetDisplayedObjects(i, []);
		}
		removeChilds(oResultCanvas);
	}
    // Переход на следующие страницы
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

    // Переход на предыдущие страницы
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

    // Переход на первую страницу
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

    // Переход на последнюю страницу
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
	
	//Добавляет объект в список найденных результатов
	var drawObject = function(oFoundObject, elemDiv, bIsParent)
	{
		var	realPath = GetFullName(oFoundObject.TypeName, oFoundObject.ObjName);
		if (oFoundObject.Parent != null) realPath += ",";
		
		var searchElemHeader = _span([_t(realPath)], [['dir', 'className', bIsParent?'searchElemParent':'searchElem']]);
		searchElemHeader.onclick = function(){$(_this).triggerHandler('onObjectClick', [oFoundObject]);};

		_(elemDiv, [searchElemHeader]);
		if (oFoundObject.Parent != null) drawObject(oFoundObject.Parent, elemDiv, true);
		if (oFoundObject.properties != null) _(elemDiv, [_t(GetPropertiesString(oFoundObject.properties, "; "))]);
	}
	
	// Рисует строки списка
	var drawRows = function(iDataSourceN, divChilds) {
		var arrObjects = arrDisplayedObjects[iDataSourceN];
		removeChilds(divChilds);

		for (var i = 0; i < arrObjects.length; i++) {
			var elemDiv = _div(null, [['dir', 'className', 'SearchResultRow']]);
			drawObject(arrObjects[i], elemDiv)
			_(divChilds, [elemDiv]);
		}

	}
	
	//рисует номера страниц списка
	//end - последний номер 
	//iDataSourceN = номер источника данных
	//divChilds - раздел для элементов списка
	//divPages - раздел для номеров страниц списка
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

	//Рисует одну из страниц списка
	//iDataSourceN = номер источника данных
	//divChilds - раздел для элементов списка
	//divPages - раздел для номеров страниц списка
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

	//Рисует таблицу для результатов источника данных
	//iDataSourceN = номер источника данных
	//divChilds - раздел для элементов списка
	//divPages - раздел для номеров страниц списка
	var drawTable = function(iDataSourceN, divChilds, divPages) {
		var oDataSource = arrTotalResultSet[iDataSourceN];
		
		if (oDataSource.SearchResult.length <= iLimit) {
			removeChilds(divPages);
			SetDisplayedObjects(iDataSourceN, oDataSource.SearchResult);
			drawRows(iDataSourceN, divChilds)
		}
		else {
			oDataSource.allPages = Math.ceil(oDataSource.SearchResult.length / iLimit)

			drawPagesRow(iDataSourceN, divChilds, divPages);
		}
	}
	
	//Обрабатывает событие нажатия на кнопку "Скачать SHP-файл"
	//iDataSourceN = номер источника данных
	var downloadMarkers = function(iDataSourceN) {
		var oDataSource = arrTotalResultSet[iDataSourceN];
		var canvas = _div(),
			filename = _input(null, [['dir', 'className', 'filename'], ['attr', 'value', oDataSource.name]]);

		var downloadButton = makeButton(_gtxt("Скачать"));
		downloadButton.onclick = function() {
			if (filename.value == '') {
				$(filename).addClass("error")

				setTimeout(function() { if (filename) $(filename).removeClass("error") }, 2000);

				return;
			}
			$(_this).triggerHandler('onDownloadSHP', [filename, oDataSource.SearchResult]);
			
			$(canvas.parentNode).dialog("destroy")
			canvas.parentNode.removeNode(true);
		}

		_(canvas, [_div([_t(_gtxt("Введите имя файла для скачивания")), filename], [['dir', 'className', 'DownloadSHPButtonText']]), _div([downloadButton], [['dir', 'className', 'DownloadSHPButton']])]);

		var area = getOffsetRect(Container)
		showDialog(_gtxt("Скачать shp-файл"), canvas, 291, 120, 30, area.top + 10)
	}

	//Отображает результаты поиска с источника данных
	//iDataSourceN = номер источника данных
	var drawSearchResult = function(iDataSourceN) {
		var oDataSource = arrTotalResultSet[iDataSourceN];
		
		var arrDataSourceList = oDataSource.SearchResult;
		var header = oDataSource.name;

		var divChilds = _div(null, [['dir', 'className', 'childsCanvas']]),
			divPages = _div(),
			liInner = _li([divChilds, divPages]),
			li = _li([_div([_t(header), _span([_t("(" + arrDataSourceList.length + ")")])], [['dir', 'className', 'searchLayerHeader']]), _ul([liInner])]);

		oDataSource.start = 0;
		oDataSource.reportStart = 0;
		oDataSource.allPages = 0;

		drawTable(iDataSourceN, divChilds, divPages);

		if (oDataSource.CanDownloadVectors) {
			var downloadVector = makeLinkButton(_gtxt("Скачать shp-файл"));

			downloadVector.onclick = function() {
				downloadMarkers(iDataSourceN);
			}

			liInner.insertBefore(_div([downloadVector], [['dir', 'className', 'SearchDownloadShpLink']]), liInner.firstChild)
		}

		return li;
	}
	
	//Отображает результаты поиска в списке
	//sTotalListName - заголовок итогового результата
	//arrTotalList = [{name:DataSourceName, CanDownloadVectors:CanDownloadVectors, SearchResult:arrDataSourceList[oObjFound,...]},...]
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
			_(ulSearch, [drawSearchResult(iDataSourceN)])

		var removeSpan = makeLinkButton(_gtxt("Очистить"));
		removeSpan.onclick = function() {
			unload();
		}
		removeSpan.style.marginLeft = '10px';

		_(oResultCanvas, [removeSpan, _br(), _li([_div([_t(sTotalListName)], [['dir', 'className', 'SearchResultListClear']]), ulSearch])])
		$(oResultCanvas).treeview();
		$(oResultCanvas).find(".childsCanvas").each(function() {
			this.parentNode.style.padding = '0px';
			this.parentNode.style.background = 'none';
		})
	}
	//Возвращает список объектов, которые отображаются на текущей странице
	this.GetDisplayedObjects = function(){return arrDisplayedObjects; };
	var SetDisplayedObjects = function(iDataSourceN, value) {
		arrDisplayedObjects[iDataSourceN] = value;
		$(_this).triggerHandler('onDisplayedObjectsChanged',[iDataSourceN, arrDisplayedObjects[iDataSourceN]])
	};
	
	//Показывает режим загрузки
	this.ShowLoading = function(){
		removeChilds(oResultCanvas);
		_(oResultCanvas, [oLoading]);
	}
	
	//Показывает сообщение об ошибке
	this.ShowError = function(){
		removeChilds(oResultCanvas);
		_(oResultCanvas, [_t("Произошла ошибка")])
	}
	
	//Очищает результаты поиска
	this.Unload = function(){unload();};
};

//Предоставляет функции, отображающие найденные объекты на карте
//oInitMap - карта, на которой будут рисоваться объекты
//params = {} - Параметры:
//	* ImagesHost - строка пути к картинкам
var ResultRenderer = function(oInitMap, params){
	var oMap = oInitMap;
	if (oMap == null)  throw "ResultRenderer.Map is null";
	
	var sImagesHost = ( params != null && params.ImagesHost != null) ? params.ImagesHost: "http://maps.kosmosnimki.ru/api/img";
	
	var arrContainer = [];
	var iCount = 0;
	
	var getSearchStyles = function() {
		return {
			'POINT': [
						{ marker: { image: sImagesHost + "/search.png", dx: -14, dy: -38} },
						{ marker: { image: sImagesHost + "/search_a.png", dx: -14, dy: -38} }
					],
			'LINESTRING': [
						{ outline: { color: 0xff9b18, thickness: 2, opacity: 80} },
						{ outline: { color: 0xff9b18, thickness: 3, opacity: 100} }
					],
			'POLYGON': [
						{ outline: { color: 0xff9b18, thickness: 2, opacity: 80 }, fill: { color: 0x216B9C, opacity: 20} },
						{ outline: { color: 0xff9b18, thickness: 3, opacity: 100 }, fill: { color: 0x216B9C, opacity: 40} }
					],
			'MULTIPOINT': [
						{ marker: { image: sImagesHost + "/search.png", dx: -14, dy: -38} },
						{ marker: { image: sImagesHost + "/search_a.png", dx: -14, dy: -38} }
					],
			'MULTILINESTRING': [
						{ outline: { color: 0xff9b18, thickness: 2, opacity: 80} },
						{ outline: { color: 0xff9b18, thickness: 3, opacity: 100} }
					],
			'MULTIPOLYGON': [
						{ outline: { color: 0xff9b18, thickness: 2, opacity: 80 }, fill: { color: 0x216B9C, opacity: 20} },
						{ outline: { color: 0xff9b18, thickness: 3, opacity: 100 }, fill: { color: 0x216B9C, opacity: 40} }
					]
		};
	}

	var DrawObject = function(oContainer, oFoundObject, iPosition){
		var sDescr = "<b>" + GetFullName(oFoundObject.TypeName, oFoundObject.ObjName) + "</b><br/>" + GetPath(oFoundObject.Parent, "<br/>", true);
		if (oFoundObject.properties != null) sDescr += "<br/>" + GetPropertiesString(oFoundObject.properties, "<br/>")
		var fnBaloon = function(o) {
			return o.properties.Descr.replace(/;/g, "<br/>");
		};
		
		//Рисуем центр объекта
		if (oFoundObject.Geometry != null && oFoundObject.Geometry.type == 'POINT') {
			elemMap = oContainer.addObject(oFoundObject.Geometry, { Descr: sDescr });
			elemMap.setStyle(getSearchStyles()["POINT"][0], getSearchStyles()["POINT"][1]);
		}
		else{
			elemMap = oContainer.addObject({ type: "POINT", coordinates: [oFoundObject.CntrLon, oFoundObject.CntrLat] }, { Descr: sDescr });
			elemMap.setStyle(getSearchStyles()["POINT"][0], getSearchStyles()["POINT"][1]);
		}
		elemMap.enableHoverBalloon(fnBaloon);

		//Рисуем контур объекта
		if (oFoundObject.Geometry != null && oFoundObject.Geometry.type != 'POINT') {
			elemMap = oContainer.addObject(oFoundObject.Geometry, { Descr: sDescr });
			elemMap.setStyle({ outline: { color: Math.round(0x222222 + 0x999999*iPosition/iCount), thickness: 3, opacity: 100} });

			elemMap.enableHoverBalloon(fnBaloon);
		}
	};
	
	//Центрует карту по переданному объекту
	var CenterObject = function(oFoundObject){
		var iZoom = 100;
		if (oFoundObject.MinLon != null && oFoundObject.MaxLon != null && oFoundObject.MinLat != null && oFoundObject.MaxLat != null){
			oMap.zoomToExtent(oFoundObject.MinLon, oFoundObject.MinLat, oFoundObject.MaxLon, oFoundObject.MaxLat);
		}
		else
		{
			var dCntrLon = oFoundObject.CntrLon || oFoundObject.Geometry.coordinates[0],
				dCntrLat = oFoundObject.CntrLat || oFoundObject.Geometry.coordinates[1]
			
			oMap.setMinMaxZoom(1, 17);
			oMap.moveTo(dCntrLon, dCntrLat, 16);
		}
	};
	
	//Центрует карту по переданному объекту
	this.CenterObject = function(oFoundObject){
		CenterObject(oFoundObject);
	}
	
	//Рисует объекты на карте
	this.DrawObjects = function(iDataSourceN, arrFoundObjects){
		if (arrContainer[iDataSourceN] != null) arrContainer[iDataSourceN].remove();
		arrContainer[iDataSourceN] = oMap.addObject();
		arrContainer[iDataSourceN].setVisible(false);
		iCount = arrFoundObjects.length;
		for (var i = 0; i < arrFoundObjects.length; i++){
			DrawObject(arrContainer[iDataSourceN], arrFoundObjects[i], i);
		}
		arrContainer[iDataSourceN].setVisible(true);
		if (iDataSourceN == 0 && arrFoundObjects.length == 1) CenterObject(arrFoundObjects[0]);
	}
};

//Контрол, отображающий результаты поиска в виде списка с нанесением на карту
//oInitContainer - Объект, в котором находится контрол результатов поиска в виде списка(div)
//oInitMap - карта, на которой будут рисоваться объекты
//params = {} - Параметры:
//	* ImagesHost - строка пути к картинкам
//  * onDisplayedObjectsChanged = function (event, iDataSourceN, arrDisplayedObjects) {...} - Вызывается при изменении списка отображаемых объектов
//		- iDataSourceN - Номер источника данных (группы результатов поиска)
//		- arrDisplayedObjects - список объектов в группе
//  * onObjectClick = function (event, oClickedObject) {...} - Вызывается при клике по найденному объекту
//	* onDownloadSHP = function (event, filename, arrObjectsToDownload) {} - Вызывается при скачивании SHP-файла
var ResultListMap = function(oInitContainer, oInitMap, params){
	var oRenderer = new ResultRenderer(oInitMap);
	var _this = this;
	var sImagesHost = "";
	if (params != null){
		//Вызывается при изменении списка отображаемых объектов
		if(params.onDisplayedObjectsChanged != null){$(_this).bind('onDisplayedObjectsChanged', params.onDisplayedObjectsChanged);};
		//Вызывается при клике по найденному объекту
		if(params.onObjectClick != null){$(_this).bind('onObjectClick', params.onObjectClick);};
		//Вызвается при скачивании SHP-файла	
		if(params.onDownloadSHP != null){$(_this).bind('onDownloadSHP', params.onDownloadSHP);};
		
		sImagesHost = params.ImagesHost;
	}
	
	var fnDisplayedObjectsChanged = function(event, iDataSourceN, arrFoundObjects){
		oRenderer.DrawObjects(iDataSourceN, arrFoundObjects);
		$(_this).triggerHandler('onDisplayedObjectsChanged', [iDataSourceN, arrFoundObjects])
	}
	
	var fnObjectClick = function(event, oFoundObject){
		oRenderer.CenterObject(oFoundObject)
		$(_this).triggerHandler('onObjectClick', [oFoundObject])
	}
	
	var fnDownloadSHP = function(event, filename, arrObjectsToDownload){
		$(_this).triggerHandler('onDownloadSHP', [filename, arrObjectsToDownload])
	}
	
	var lstResult = new ResultList(oInitContainer, {
		ImagesHost: sImagesHost,
		onDisplayedObjectsChanged: fnDisplayedObjectsChanged,
		onObjectClick: fnObjectClick,
		onDownloadSHP: fnDownloadSHP
	});
	
	//Отображает результаты поиска в списке
	//sTotalListName - заголовок итогового результата
	//arrTotalList = [{Name:DataSourceName, CanDownloadVectors:CanDownloadVectors, SearchResult:arrDataSourceList[oObjFound,...]},...]
	this.ShowResult = function(sTotalListName, arrTotalList){
		lstResult.ShowResult(sTotalListName, arrTotalList);
	}
		
	//Показывает режим загрузки
	this.ShowLoading = function(){
		lstResult.ShowLoading();
	}
	
	//Показывает сообщение об ошибке
	this.ShowError = function(){
		lstResult.ShowError();
	}
	
	//Очищает результаты поиска
	this.Unload = function(){lstResult.Unload();};
}

//Посылает запрос к поисковому серверу
//ServerBase - Адрес сервера, на котором установлен поисковый модуль Geomixer'а
//mapHelper - Предоставляет методы для работы с картой. Необходим только для работы поиска по векторным слоям
var SearchDataProvider = function(ServerBase, mapHelper){
	var sServerBase = ServerBase;
	if (sServerBase == null || sServerBase.length < 7) {throw "Error in SearchDataProvider: sServerBase is not supplied"};
	var oMapHelper = mapHelper;

	var iDefaultLimit = 100;
	
	//Осуществляет поиск по произвольным параметрам
	// params = {} - Параметры:
	//	* callback = function(response) - вызывается после получения ответа от сервера
	//	* SearchString - строка для поиска
	//	* IsStrongSearch - признак того, что искать только целые слова
	//	* Geometry - искать только объекты, пересекающие данную геометрию
	//	* Limit - максимальное число найденных объектов
	var fnSearch = function(params)	{
		var callback = params.callback;
		var sQueryString = "SearchString=" + escape(params.SearchString);
		if (params.Geometry != null) sQueryString += "&GeometryJSON=" + escape(JSON.stringify(params.Geometry));
		if (params.Limit != null) sQueryString += "&Limit=" + escape(params.Limit.toString());
		if (params.IsStrongSearch != null) sQueryString += "&IsStrongSearch=" + escape(params.IsStrongSearch ? "1" : "0");
		//if (sFormatName != null) sQueryString += "&Format=" + escape(sFormatName);
		sendCrossDomainJSONRequest(sServerBase + "/SearchObject/SearchAddress.ashx?" + sQueryString, function(response){
			if (response.Status == 'ok') {callback(response.Result)}
			else {throw response.ErrorInfo.ErrorMessage;}
		});
	};
	
	//Осуществляет поиск по переданной строке
	// params = {} - Параметры:
	//	* callback = function(arrResultDataSources) - вызывается после получения ответа от сервера
	//	* SearchString - строка для поиска
	//	* IsStrongSearch - признак того, что искать только целые слова
	this.SearchByString = function(params){
		fnSearch({callback: params.callback, SearchString: params.SearchString, IsStrongSearch: params.IsStrongSearch, Limit: params.Limit});
	};
	
	//Осуществляет поиск по произвольным параметрам
	// params = {} - Параметры:
	//	* callback = function(arrResultDataSources) - вызывается после получения ответа от сервера
	//	* SearchString - строка для поиска
	//	* IsStrongSearch - признак того, что искать только целые слова
	//	* Geometry - искать только объекты, пересекающие данную геометрию
	//	* Limit - максимальное число найденных объектов
	this.Search = function(params){
		fnSearch({
			callback: params.callback, 
			SearchString: params.SearchString, 
			IsStrongSearch: params.IsStrongSearch, 
			Limit: params.Limit == null ? iDefaultLimit : params.Limit,
			Geometry: params.Geometry
		});
	};
	
	// Осуществляет поиск по векторным слоям
	// sInitSearchString - строка для поиска
	// oInitGeometry - геометрия, в которой ведется поиск
	// callback = function(arrResultDataSources) - вызывается после окончания поиска
	this.LayerSearch = function(sInitSearchString, oInitGeometry, callback){
		//var geometry = JSON.stringify(merc_geometry({ type: "POLYGON", coordinates: [[-180, -89, -180, 89, 180, 89, 180, -89, -180, -89]] }));
		var arrResult = [];
		if (oMapHelper == null) {
			callback(arrResult);
			return;
		}
		
		var layersToSearch = [];
        oMapHelper.forEachMyLayer(function(layer) {
            if (layer.properties.type == "Vector" && layer.properties.AllowSearch)
                layersToSearch.push(layer);
        });
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
										arrLayerResult.push({ 
											ObjName: req.SearchResult[j].properties.NAME || req.SearchResult[j].properties.Name || req.SearchResult[j].properties.name || req.SearchResult[j].properties.text || "[объект]",
											properties: req.SearchResult[j].properties, 
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
	
	// Возвращает адрес сервера, на котором установлен поисковый модуль Geomixer'а
	this.GetServerBase = function(){
		return sServerBase;
	}
}

// Предоставляет функции обработки найденных данных
// oInitSearchDataProvider - предоставляет данные
var SearchLogic = function(oInitSearchDataProvider){
	var oSearchDataProvider = oInitSearchDataProvider;
	var _this = this;
	if(oSearchDataProvider == null) throw "Error in SearchLogic: oSearchDataProvider is not supplied";
	
	// Возращает сгуппированные данные для отображения подсказок поиска в функции callback
	// sSearchString - строка, по которой надо выдать подсказку
	// callback = function(arrResult) {...} - вызывается когда подсказка готова
	//	* arrResult = [{label, category,...}] - массив найденных результатов
	this.AutoCompleteData = function (sSearchString, callback){
		_this.SearchByString({SearchString: sSearchString, IsStrongSearch: 0, Limit:10, callback: function(arrResultDataSources){
			var arrResult = [];
			var arrCategories = _this.GroupByCategory(arrResultDataSources)[0].Categories;
			for (var i in arrCategories){
				if (arrCategories[i] != null){
					for (var j=0; j<arrCategories[i].GeoObjects.length; j++){
						var sLabel = arrCategories[i].GeoObjects[j].ObjName + " " + arrCategories[i].GeoObjects[j].TypeName;
						if (arrCategories[i].Name == "" && arrCategories[i].GeoObjects[j].Parent != null) {
							sLabel += "; " + GetPath(arrCategories[i].GeoObjects[j].Parent, ", ", true);
						}
						arrResult.push({label: sLabel, category: arrCategories[i].Name, GeoObject: arrCategories[i].GeoObjects[j]});
					}
				}
			}
			callback(arrResult);
		}});
	}
	
	//Группирует по категории
	//arrInitDataSources - Массив ответов от поисковых серверов
	this.GroupByCategory = function(arrInitDataSources)	{
		var arrResultDataSources = [];
		for(var i=0; i<arrInitDataSources.length; i++){
			arrResultDataSources[i] = {	name: arrInitDataSources[i].name, 
										CanDownloadVectors: arrInitDataSources[i].CanDownloadVectors, 
										Categories: []};
			var oDataSource = arrInitDataSources[i].SearchResult;
			var Categories = arrResultDataSources[i].Categories;
			var CategoriesIndex = {};
			for(var j=0; j<oDataSource.length; j++){
				var sCategory = "";
				var sCategoryDesc = "";
				var iPriority = 9999999;
				var iCatID = 0;
				if(oDataSource[j].Parent != null)
				{
					iCatID = oDataSource[j].Parent.ObjCode;
					sCategory = GetPath(oDataSource[j].Parent, ", ", false);
					sCategoryDesc = GetPath(oDataSource[j].Parent, ", ", true);
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
	
	//Осуществляет поиск по произвольным параметрам
	// params = {} - Параметры:
	//  * layersSearchFlag - признак необходимости искать по векторным слоям
	//	* callback = function(arrResultDataSources) - вызывается после получения ответа от сервера
	//	* SearchString - строка для поиска
	//	* IsStrongSearch - признак того, что искать только целые слова
	//	* Limit - максимальное число найденных объектов
	this.SearchByString = function(params){
		oSearchDataProvider.SearchByString({SearchString: params.SearchString, IsStrongSearch: params.IsStrongSearch, Limit:params.Limit,
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
}

//Контрол, содержащий все все компоненты поиска и обеспечивающий их взаимодействие между собой
//params = {} - Параметры:
//	* ServerBase - Адрес сервера, на котором установлен поисковый модуль Geomixer'а
//	* ImagesHost - строка пути к картинкам
//	* ContainerInput - Объект, в котором находится контрол поискового поля (div)
//	* layersSearchFlag - Признак видимости кнопки поиска по векторным слоям
//	* ContainerList - Объект, в котором находится контрол результатов поиска в виде списка(div)
//	* Map - карта, на которой будут рисоваться объекты
//	* MapHelper - вспомогательный компонент для работы с картой
//  * onDisplayedObjectsChanged = function (event, iDataSourceN, arrDisplayedObjects) {...} - Вызывается при изменении списка отображаемых объектов
//  * onObjectClick = function (event, oClickedObject) {...} - Вызывается при клике по найденному объекту
var SearchControl = function (params){
	var _this = this;
	//Вызывается при изменении списка отображаемых объектов
	if(params.onDisplayedObjectsChanged != null){$(this).bind('onDisplayedObjectsChanged', params.onDisplayedObjectsChanged);};
	//Вызывается при клике по найденному объекту
	if(params.onObjectClick != null){$(this).bind('onObjectClick', params.onObjectClick);};
	
	var oSearchDataProvider = new SearchDataProvider(params.ServerBase,	params.mapHelper);
	var oLogic = new SearchLogic(oSearchDataProvider);
		
	var downloadVectorForm = _form([_input(null, [['attr', 'name', 'name']]),
							 _input(null, [['attr', 'name', 'points']]),
							 _input(null, [['attr', 'name', 'lines']]),
							 _input(null, [['attr', 'name', 'polygons']])], [['css', 'display', 'none'], ['attr', 'method', 'POST'], ['attr', 'action', params.ServerBase + "/Shapefile.ashx"]]);
	
	_(params.ContainerList, [downloadVectorForm]);
	
	//Осуществляет загрузку SHP-файла
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
	
	var fnAutoCompleteSource = function (request, response) {
		oLogic.AutoCompleteData(request.term, response);
	}

	var fnBeforeSearch = function(){
		$(_this).triggerHandler('onBeforeSearch');
	}
	
	var fnAfterSearch = function(){
		$(_this).triggerHandler('onAfterSearch');
	}
	
	//Осуществляет поиск
	var fnSearchByString = function(event, SearchString, layersSearchFlag)
	{
		try{
			lstResult.ShowLoading();
			fnBeforeSearch();
			oLogic.SearchByString({SearchString: SearchString, IsStrongSearch: true, layersSearchFlag: layersSearchFlag, callback: function(response) {
				lstResult.ShowResult(SearchString, response);
				fnAfterSearch();
			}});
		}
		catch (e){
			lstResult.ShowError();
		}
	}
	
	//Осуществляет выбор объекта из подсказки
	var fnSelect = function(event, oAutoCompleteItem){
		if (fnBeforeSearch != null) fnBeforeSearch();
		lstResult.ShowResult(oAutoCompleteItem.label, [{ name: "Выбрано", SearchResult: [oAutoCompleteItem.GeoObject] }]);
		if (fnAfterSearch != null) fnAfterSearch();
	}
	
	//Результаты поиска
	var lstResult = new ResultListMap(params.ContainerList, params.Map, {ImagesHost: params.ImagesHost, onDownloadSHP: fnDownloadSHP});
	//Строка ввода поискового запроса
	var btnSearch = new SearchInput(params.ContainerInput, {
		ImagesHost: params.ImagesHost,
		layersSearchFlag: true,
		Search: fnSearchByString,
		AutoCompleteSource: fnAutoCompleteSource,
		AutoCompleteSelect: fnSelect
	});
	
		
	var onDisplayedObjectsChanged = function(event, iDataSourceN, arrFoundObjects){
		$(_this).triggerHandler('onDisplayedObjectsChanged', [iDataSourceN, arrFoundObjects])
	}
	
	var onObjectClick = function(event, oFoundObject){
		$(_this).triggerHandler('onObjectClick', [oFoundObject])
	}
	$(lstResult).bind('onDisplayedObjectsChanged', onDisplayedObjectsChanged);
	$(lstResult).bind('onObjectClick', onObjectClick);
	
	//Осуществляет поиск по произвольным параметрам, но только по адресной базе
	// params = {} - Параметры:
	//	* SearchString - строка для поиска
	//	* IsStrongSearch - признак того, что искать только целые слова
	//	* Geometry - искать только объекты, пересекающие данную геометрию
	//	* Limit - максимальное число найденных объектов
	this.Search = function(params){
		try{
			var sSearchString = params.SearchString || '';
			if (sSearchString == '' && params.Geometry == null) throw "Error in SearchControl: Не заданы параметры поиска!";
			if (sSearchString == '') sSearchString = 'Поиск по выделенной области';
			lstResult.ShowLoading();
			if (fnBeforeSearch != null) fnBeforeSearch();
			oSearchDataProvider.Search({
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
	
	//Показывает режим загрузки
	this.ShowLoading = function(){
		lstResult.ShowLoading();
	}
	
	//Очищает результаты поиска
	this.Unload = function(){lstResult.Unload();};
}

//Контрол, содержащий все все компоненты поиска и обеспечивающий их взаимодействие между собой
//params = {} - Параметры, Передаются в метод Init():
//	* ServerBase - Адрес сервера, на котором установлен поисковый модуль Geomixer'а
//	* layersSearchFlag - Признак видимости кнопки поиска по векторным слоям
//	* Menu - Меню, в котором находится контрол результатов поиска в виде списка(div)
//	* Map - карта, на которой будут рисоваться объекты
//	* MapHelper - вспомогательный компонент для работы с картой
var SearchGeomixer = function(params){
	var _this = this;
	var oMenu;
	if (params != null) oMenu = params.Menu;
	var oSearchControl;
	
	var oSearchInputDiv = _div();
	var oSearchResultDiv = _div();
	var workCanvas;
	
	_title(oSearchInputDiv, _gtxt('Изменить параметры поиска'));
	
	var fnBeforeSearch = function(event){
		$(_this).triggerHandler('onBeforeSearch');
	}
	
	var fnAfterSearch = function(event){
		$(_this).triggerHandler('onAfterSearch');
	}
	
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
		$(_this).triggerHandler('onBeforeSearch');
		fnLoad();
	}
	
	var fnAfterSearch = function(event){
		$(_this).triggerHandler('onAfterSearch');
	}
	
	var onDisplayedObjectsChanged = function(event, iDataSourceN, arrFoundObjects){
		$(_this).triggerHandler('onDisplayedObjectsChanged', [iDataSourceN, arrFoundObjects])
	}
	
	var onObjectClick = function(event, oFoundObject){
		$(_this).triggerHandler('onObjectClick', [oFoundObject])
	}
	
	//Инициализирует контрол
	this.Init = function(params){
		if (oMenu == null) oMenu = params.Menu;
		if (oMenu == null) throw "Error in SearchGeomixer: Menu is null";
		_($$('searchCanvas'), [oSearchInputDiv]);
		oSearchControl = new SearchControl({ServerBase: params.ServerBase, 
											ImagesHost: params.ServerBase + "/api/img",
											ContainerInput: oSearchInputDiv, 
											layersSearchFlag: params.layersSearchFlag,
											ContainerList: oSearchResultDiv,
											Map: params.Map,
											mapHelper: params.mapHelper,
											BeforeSearch: fnBeforeSearch,
											AfterSearch:params.AfterSearch});
		$(oSearchControl).bind('onBeforeSearch', fnBeforeSearch);
		$(oSearchControl).bind('onAfterSearch', fnAfterSearch);
		$(oSearchControl).bind('onDisplayedObjectsChanged', onDisplayedObjectsChanged);
		$(oSearchControl).bind('onObjectClick', onObjectClick);
	}
	
	this.Load = function(){
		fnLoad();
	}
	
	this.Unload = function(){
		fnUnload();
	}
			
	//Осуществляет поиск по произвольным параметрам, но только по адресной базе
	// params = {} - Параметры:
	//	* SearchString - строка для поиска
	//	* IsStrongSearch - признак того, что искать только целые слова
	//	* Geometry - искать только объекты, пересекающие данную геометрию
	//	* Limit - максимальное число найденных объектов
	this.Search = function(params){
		oSearchControl.Search({
			SearchString: params.SearchString, 
			IsStrongSearch: params.IsStrongSearch, 
			Limit: params.Limit,
			Geometry: params.Geometry
		});
	};
}

var publicInterface = {
	SearchGeomixer: SearchGeomixer,
	SearchControl: SearchControl,
	SearchInput: SearchInput,
	ResultList: ResultList,
	ResultRenderer: ResultRenderer,
	ResultListMap: ResultListMap,
	SearchDataProvider: SearchDataProvider,
	SearchLogic: SearchLogic,
	GetFullName: GetFullName,
	GetPath: GetPath
}

gmxCore.addModule("search", publicInterface)

})(); 

