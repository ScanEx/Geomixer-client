var nsGmx = nsGmx || {}

$('#flash').droppable({
    drop: function(event, ui) {
        var obj = ui.draggable[0].gmxDrawingObject;

        if (obj) {
            var text = Functions.GetFullName(obj.TypeName, obj.ObjName);
            nsGmx.leafletMap.gmxDrawing.addGeoJSON({
                type: 'Feature',
                geometry: L.gmxUtil.geometryToGeoJSON(obj.Geometry)
            }, {text: text});
        }
    }
})

window._translationsHash.addtext("rus", {
    "Текущее местоположение отображается только для России и Украины": "Текущее местоположение отображается только для России и Украины",
    "Следующие [value0] страниц": "Следующие [value0] страниц",
    "Следующие [value0] страницы": "Следующие [value0] страницы",
    "Следующая страница": "Следующая страница",
    "Следующая [value0] страница": "Следующая [value0] страница",
    "Предыдущие [value0] страниц" : "Предыдущие [value0] страниц",
    "Первая страница" : "Первая страница",
    "Последняя страница" : "Последняя страница"
});
window._translationsHash.addtext("eng", {
    "Текущее местоположение отображается только для России и Украины": "Current location is shown only for Russia and Ukraine",
    "Следующие [value0] страниц": "Next [value0] pages",
    "Следующие [value0] страницы": "Next [value0] pages",
    "Следующая страница": "Next page",
    "Следующая [value0] страница": "Next [value0] pages",
    "Предыдущие [value0] страниц" : "Previous [value0] pages",
    "Первая страница" : "First page",
    "Последняя страница" : "Last page"
});

var imagesHost = window.serverBase + "/api/img";

/** Вспомогательные функции
 @namespace Functions
 @memberOf Search
*/
var Functions = {

	/** Возвращает полное наименование объекта, состоящее из типа и наименования
	 @static
	 @param sType Наименование типа объекта
	 @param sName Наименование объекта
    */
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
    * @memberOf Search.Functions
    *
	* @param oFoundObject найденный объект
	* @param sObjectsSeparator разделитель между дочерним элементом и родителем в строке пути
	* @param bParentAfter признак того, что родительский элемент идет после дочернего
	* @param sObjNameField название свойства, из которого брать наименование
    */
	GetPath: function(/*object*/ oFoundObject,/* string */ sObjectsSeparator, /* bool */ bParentAfter, /* string */ sObjNameField){
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
 @class Предоставляет функции, отображающие найденные объекты на карте
 @memberof Search
 @param {L.Map} map карта, на которой будут рисоваться объекты
 @param {string} sInitImagesHost - строка пути к картинкам
 @param {bool} bInitAutoCenter - если true, карта будет центрироваться по 1ому найденному объекту*/
var ResultRenderer = function(map, sInitImagesHost, bInitAutoCenter){
	if (map == null)  throw "ResultRenderer.Map is null";

	var sImagesHost = sInitImagesHost || "http://maps.kosmosnimki.ru/api/img";
	var bAutoCenter = (bInitAutoCenter == null) || bInitAutoCenter;

    this.arrContainer = ['aa'];
	var counts = [];

	/** возвращает стили найденных объектов, используется только для точки*/
	var getSearchIcon = function(iPosition) {
        iPosition = Math.min(iPosition, 9);
        return L.icon({
            iconUrl: sImagesHost + "/search/search_" + (iPosition + 1).toString() + ".png",
            iconAnchor: [15, 38],
            popupAnchor: [0, -28]
        });

		// return [
						// { marker: { image: sImagesHost + "/search/search_" + (iPosition + 1).toString() + ".png", dx: -14, dy: -38} },
						// { marker: { image: sImagesHost + "/search/search_" + (iPosition + 1).toString() + "a.png", dx: -14, dy: -38} }
				// ];
	}

    var bindHoverPopup = function(layer, content) {
        layer.bindPopup(content);
    }

	/**Помещает объект на карту
	@param {MapObject} oContainer контейнер, содержащий в себе объекты текущей группы результатов поиска
	@param {MapObject} oFoundObject добавляемый объект
	@param {int} iPosition порядковый номер добавляемого объекта в группе
	@param {int} iCount общее количество объектов в группе
    @return {Object} Нарисованные на карте объекты: хеш с полями center и boundary */
	var DrawObject = function(oContainer, oFoundObject, iPosition, iCount){
        var color = Math.round(0x22 + 0x99*iPosition/iCount);
		var sDescr = "<b>" + Functions.GetFullName(oFoundObject.TypeName, oFoundObject.ObjName) + "</b><br/>" + Functions.GetPath(oFoundObject.Parent, "<br/>", true);
		if (oFoundObject.properties != null) sDescr += "<br/>" + Functions.GetPropertiesString(oFoundObject.properties, "<br/>");

        sDescr = sDescr.replace(/;/g, "<br/>");

		var fnBaloon = function(o) {
			return o.properties.Descr.replace(/;/g, "<br/>");
		};
		var centerMapElem,
            boundaryMapElem;
		//Рисуем центр объекта
		if (oFoundObject.Geometry != null && (oFoundObject.Geometry.type).toUpperCase() == 'POINT') {
            centerMapElem = L.marker([oFoundObject.Geometry.coordinates[1], oFoundObject.Geometry.coordinates[0]], {
                icon: getSearchIcon(iPosition)
            });
            bindHoverPopup(centerMapElem, sDescr);
            oContainer.addLayer(centerMapElem);
		}
		else if (oFoundObject.CntrLon != null && oFoundObject.CntrLat != null){
            centerMapElem = L.marker([oFoundObject.CntrLat, oFoundObject.CntrLon], {
                icon: getSearchIcon(iPosition)
            });

            bindHoverPopup(centerMapElem, sDescr);
            oContainer.addLayer(centerMapElem);
		}


		//Рисуем контур объекта
		if (oFoundObject.Geometry != null && (oFoundObject.Geometry.type).toUpperCase() != 'POINT') {
            boundaryMapElem = L.geoJson(L.gmxUtil.geometryToGeoJSON(oFoundObject.Geometry), {
                style: function(feature) {
                    return
                },
                onEachFeature: function(feature, layer) {
                    layer.setStyle({
                        color: '#' + (0x1000000 + (color << 16) + (color << 8) + color).toString(16).substr(-6),
                        weight: 3,
                        opacity: 0.6,
                        fill: false
                    });

                    bindHoverPopup(layer, sDescr)
                }
            });

            oContainer.addLayer(boundaryMapElem);
		}

        return {center: centerMapElem, boundary: boundaryMapElem};
	};

	/**Центрует карту по переданному объекту*/
	var CenterObject = function(oFoundObject){
		if (!oFoundObject) return;
		var iZoom = oFoundObject.TypeName == "г." ? 9 : 15;
        if (oFoundObject.Geometry == null) {
		    if (oFoundObject.MinLon != null && oFoundObject.MaxLon != null && oFoundObject.MinLat != null && oFoundObject.MaxLat != null
                && oFoundObject.MaxLon - oFoundObject.MinLon < 1e-9 && oFoundObject.MaxLat - oFoundObject.MinLat < 1e-9)
			    map.setView([oFoundObject.CntrLat, oFoundObject.CntrLon], iZoom);
		    else
			    map.fitBounds([[oFoundObject.MinLat, oFoundObject.MinLon], [oFoundObject.MaxLat, oFoundObject.MaxLon]]);
        }
		else
		{
           if ((oFoundObject.Geometry.type).toUpperCase() == 'POINT') {
		        if (oFoundObject.MinLon != oFoundObject.MaxLon && oFoundObject.MinLat != oFoundObject.MaxLat) {
			        map.fitBounds([[oFoundObject.MinLat, oFoundObject.MinLon], [oFoundObject.MaxLat, oFoundObject.MaxLon]]);
                } else {
                    var c = oFoundObject.Geometry.coordinates;
			        map.setView([c[1], c[0]], iZoom);
                }
		    }
		    else {
                var bounds = L.gmxUtil.getGeometryBounds(oFoundObject.Geometry);
			    //var oExtent = getBounds(oFoundObject.Geometry.coordinates);
			    map.fitBounds([[bounds.min.y, bounds.min.x], [bounds.max.y, bounds.max.x]]);
            }
		}
	};

	/**Центрует карту по переданному объекту
	@param {MapObject} oFoundObject объект, который нужно поместить в центр
	@returns {void}*/
	this.CenterObject = function(oFoundObject){
		CenterObject(oFoundObject);
	}

	/** Рисует объекты на карте.
	@param {int} iDataSourceN № источника данных (группы результатов поиска)
	@param {Array} arrFoundObjects Массив объектов для отрисовки. Каждый объект имеет свойства
	@param {bool} [options.append=false] Добавить к существующим объектам для источника данных, а не удалять их
	@return {Array} Нарисованные на карте объекты: массив хешей с полями center и boundary
    */
	this.DrawObjects = function(iDataSourceN, arrFoundObjects, options){
        options = $.extend({append: false}, options);

        if (!options.append && this.arrContainer[iDataSourceN]) {
            map.removeLayer(this.arrContainer[iDataSourceN]);
            delete this.arrContainer[iDataSourceN];
        }

        if (!this.arrContainer[iDataSourceN]) {
            this.arrContainer[iDataSourceN] = L.layerGroup();
            counts[iDataSourceN] = 0;
        }

		iCount = arrFoundObjects.length;

        var mapObjects = [];

        counts[iDataSourceN] += arrFoundObjects.length;

		//Отрисовываем задом наперед, чтобы номер 1 был сверху от 10ого
		for (var i = arrFoundObjects.length - 1; i >= 0; i--){
			mapObjects.unshift(DrawObject(this.arrContainer[iDataSourceN], arrFoundObjects[i], counts[iDataSourceN] + i - arrFoundObjects.length, counts[iDataSourceN]));
		}

		this.arrContainer[iDataSourceN].addTo(map);
		if (bAutoCenter && iDataSourceN == 0) CenterObject(arrFoundObjects[0]);

        return mapObjects;
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
			$(locationTitleDiv).empty();
			if(arrResultDataSources.length>0 && arrResultDataSources[0].SearchResult.length>0){
				drawObject(arrResultDataSources[0].SearchResult[0], locationTitleDiv);
			}
			else{
				_(locationTitleDiv, [_t(_gtxt("Текущее местоположение отображается только для России и Украины"))]);
			}
		}});
	};

	if (oMap.coordinates) oMap.coordinates.addCoordinatesFormat(setLocationTitleDiv);
}

var ResultList = function(oInitContainer, ImagesHost){
	/**Объект, в котором находится контрол (div)*/
    // создается в начале searchLogic.showResult
	var Container = oInitContainer;
	var _this = this;
    this.oRenderer = new ResultRenderer(nsGmx.leafletMap, imagesHost, true);

	var sImagesHost = ImagesHost || "http://maps.kosmosnimki.ru/api/img";

	var arrDisplayedObjects = []; //Объекты, которые отображаются на текущей странице
	var iLimit = 10; //Максимальное количество результатов на странице
	var iPagesCount = 7; //Количество прокручиваемых страниц при нажатии на двойные стрелки
	if (Container == null) throw "ResultList.Container is null";

	var oResultCanvas;
	var arrTotalResultSet = [];

	if(oResultCanvas == null)
	{
		oResultCanvas = nsGmx.Utils._div(null, [['dir', 'className', 'searchResultCanvas']]);
        Container.appendChild(oResultCanvas);
	}
	var oLoading = nsGmx.Utils._div([_img(null, [['attr', 'src', sImagesHost + '/progress.gif'], ['dir', 'className', 'searchResultListLoadingImg']]), _t(_gtxt("загрузка..."))], [['dir', 'className', 'searchResultListLoading']]);
	var fnNotFound = function(){nsGmx.Utils._(oResultCanvas, [nsGmx.Utils._div([_t(_gtxt("Поиск не дал результатов"))], [['dir', 'className', 'SearchResultListNotFound']])]);};

	/**Удаляет все найденные объекты из результатов поиска*/
	var unload = function(){
		for(i=0; i<arrDisplayedObjects.length; i++){
			SetDisplayedObjects(i, []);
		}
		$(oResultCanvas).empty();
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

		nsGmx.Utils._(elemDiv, [searchElemHeader]);
		if (oFoundObject.Parent != null) drawObject(oFoundObject.Parent, elemDiv, true);
		if (oFoundObject.properties != null) nsGmx.Utils._(elemDiv, [document.createTextNode(" " + Functions.GetPropertiesString(oFoundObject.properties, "; "))]);
	}

	/** Рисует строки списка*/
	var drawRows = function(iDataSourceN, divChilds) {
		var arrObjects = arrDisplayedObjects[iDataSourceN];
		$(divChilds).empty();
		var tbody = _tbody();
		for (var i = 0; i < arrObjects.length; i++) {
			var elemTR = _tr(null, [['dir', 'className', 'SearchResultRow']]);
			var elemTD = _td(null, [['dir', 'className', 'SearchResultText']]);
			nsGmx.Utils._(elemTR, [_td([_t((i+1).toString() + ".")], [['dir', 'className','searchElemPosition']]), elemTD]);
			drawObject(arrObjects[i], elemTD);

			// загрузка SHP Файла
			if (window.gmxGeoCodeShpDownload && arrObjects[i].Geometry != null) {
			    var shpFileLink = _span([_t(".shp")], [['dir', 'className', 'searchElem'], ['attr', 'title', 'скачать SHP-файл'], ['attr', 'number', i]]);

			    shpFileLink.onclick = function () {
			        var obj = arrObjects[$(this).attr('number')];
			        var objsToDownload = [obj];
			        $(_this).triggerHandler('onDownloadSHP', [obj.ObjCode, objsToDownload]);
			    };
			   nsGmx.Utils._(elemTD, [_t(" ")]);
			   nsGmx.Utils._(elemTD, [shpFileLink]);
			}

            elemTD.gmxDrawingObject = arrObjects[i];

            $(elemTD).draggable({
                scroll: false,
                appendTo: document.body,
                helper: 'clone',
                distance: 10
            });

			nsGmx.Utils._(tbody, [elemTR]);
		}
		nsGmx.Utils._(divChilds, [_table([tbody])]);

	}

	/**рисует номера страниц списка
	@param end - последний номер
	@param iDataSourceN - номер источника данных
	@param divChilds - раздел для элементов списка
	@param divPages - раздел для номеров страниц списка*/
	var drawPages = function(end, iDataSourceN, divChilds, divPages) {
		var oDataSource = arrTotalResultSet[iDataSourceN];
		for (var i = oDataSource.start + 1; i <= end; i++) {
			// текущий элемент
			if (i - 1 == oDataSource.reportStart / iLimit) {
				var el = _span([_t(i.toString())]);
				nsGmx.Utils._(divPages, [el]);
				$(el).addClass('page');
			}
			else {
				var link = makeLinkButton(i.toString());

				link.setAttribute('page', i - 1);
				link.style.margin = '0px 2px';

				nsGmx.Utils._(divPages, [link]);

				link.onclick = function() {
					arrTotalResultSet[iDataSourceN].reportStart = this.getAttribute('page') * iLimit;

					drawPagesRow(iDataSourceN, divChilds, divPages);
				};
			}

		}
	}

	/**Рисует одну из страниц списка
	@param iDataSourceN - номер источника данных
	@param divChilds - раздел для элементов списка
	@param divPages - раздел для номеров страниц списка*/
	var drawPagesRow = function(iDataSourceN, divChilds, divPages) {
		var oDataSource = arrTotalResultSet[iDataSourceN];

		// перерисовывем номера страниц
		$(divPages).empty();

		var end = (oDataSource.start + iPagesCount <= oDataSource.allPages) ? oDataSource.start + iPagesCount : oDataSource.allPages;

		if (oDataSource.start - iPagesCount >= 0)
			nsGmx.Utils._(divPages, [first(iDataSourceN, divChilds, divPages), previous(iDataSourceN, divChilds, divPages)]);

		drawPages(end, iDataSourceN, divChilds, divPages);

		if (end + 1 <= oDataSource.allPages)
			nsGmx.Utils._(divPages, [next(iDataSourceN, divChilds, divPages), last(iDataSourceN, divChilds, divPages)]);

		SetDisplayedObjects(iDataSourceN, oDataSource.SearchResult.slice(oDataSource.reportStart, oDataSource.reportStart + iLimit));
		drawRows(iDataSourceN, divChilds);
	}

	/**Рисует таблицу для результатов источника данных
	@param iDataSourceN - номер источника данных
	@param divChilds - раздел для элементов списка
	@param divPages - раздел для номеров страниц списка*/
	var drawTable = function(iDataSourceN, divChilds, divPages) {
		var oDataSource = arrTotalResultSet[iDataSourceN];

		if (oDataSource.SearchResult.length <= iLimit) {
			$(divPages).empty();
			SetDisplayedObjects(iDataSourceN, oDataSource.SearchResult);
			drawRows(iDataSourceN, divChilds);
		}
		else {
			oDataSource.allPages = Math.ceil(oDataSource.SearchResult.length / iLimit);

			drawPagesRow(iDataSourceN, divChilds, divPages);
		}
	}

	/**Обрабатывает событие нажатия на кнопку "Скачать SHP-файл"
	@param iDataSourceN - номер источника данных*/
	var downloadMarkers = function(iDataSourceN) {
		var oDataSource = arrTotalResultSet[iDataSourceN];
		var canvas = nsGmx.Utils._div(),
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
			$(_this).triggerHandler('onDownloadSHP', [filename.value, oDataSource.SearchResult]);

			$(canvas.parentNode).dialog("destroy").remove();
		}

		nsGmx.Utils._(canvas, [nsGmx.Utils._div([_t(_gtxt("Введите имя файла для скачивания")), filename], [['dir', 'className', 'DownloadSHPButtonText']]), nsGmx.Utils._div([downloadButton], [['dir', 'className', 'DownloadSHPButton']])]);

		var area = getOffsetRect(Container);
		showDialog(_gtxt("Скачать shp-файл"), canvas, 291, 120, 30, area.top + 10);
	}

	/**Отображает результаты поиска с источника данных
	@param iDataSourceN - номер источника данных*/
	var drawSearchResult = function(iDataSourceN) {
		var oDataSource = arrTotalResultSet[iDataSourceN];

		var arrDataSourceList = oDataSource.SearchResult;
		var header = oDataSource.name;

		var divChilds = nsGmx.Utils._div(null, [['dir', 'className', 'SearchResultListChildsCanvas']]),
			divPages = nsGmx.Utils._div(),
			liInner = _li([divChilds, divPages]),
			li;
		if (arrTotalResultSet.length == 1){
			li = nsGmx.Utils._ul([liInner]);
		}
		else{
			li = _li([nsGmx.Utils._div([_t(header), _span([_t("(" + arrDataSourceList.length + ")")])], [['dir', 'className', 'searchLayerHeader']]), nsGmx.Utils._ul([liInner])]);
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

			liInner.insertBefore(nsGmx.Utils._div([downloadVector], [['dir', 'className', 'SearchDownloadShpLink']]), liInner.firstChild);
		}

		return li;
	}

    var fnDisplayedObjectsChanged = function(event, iDataSourceN, arrFoundObjects){
        _this.oRenderer.DrawObjects.call(_this.oRenderer, iDataSourceN, arrFoundObjects);
        /** Вызывается при изменении отображаемого списка найденных объектов(ведь они отображаются не все)
        @name Search.ResultListMap.onDisplayedObjectsChanged
        @event
        @param {int} iDataSourceN № источника данных(группы результатов поиска)
        @param {object[]} arrDSDisplayedObjects Результаты поиска, которые необходимо отобразить в текущей группе*/
        // $(_this).triggerHandler('onDisplayedObjectsChanged', [iDataSourceN, arrFoundObjects]);
    }

    var fnObjectClick = function(event, oFoundObject){
        _this.oRenderer.CenterObject(oFoundObject);

        /** Вызывается при клике на найденный объект в списке результатов поиска
        @name Search.ResultListMap.onObjectClick
        @event
        @param {object} oFoundObject Найденный объект*/
        // $(oSearchResultDiv).triggerHandler('onObjectClick', [oFoundObject]);
    }

    var fnDownloadSHP = function(event, filename, arrObjectsToDownload){
        /** Вызывается при необходимости осуществить загрузку SHP-файла с результатами поиска
        @name Search.ResultListMap.onDownloadSHP
        @event
        @param {string} filename Имя файла, которой необходимо будет сформировать
        @param {object[]} SearchResult Результаты поиска, которые необходимо сохранить в файл*/
        // $(oSearchResultDiv).triggerHandler('onDownloadSHP', [filename, arrObjectsToDownload]);
    }


    $(_this).bind('onDisplayedObjectsChanged', fnDisplayedObjectsChanged);
    $(_this).bind('onObjectClick', fnObjectClick);
    $(_this).bind('onDownloadSHP', fnDownloadSHP);

	/**Отображает результаты поиска в списке
	@param sTotalListName - заголовок итогового результата
	@param {Array.<Object>} arrTotalList. Массив объектов со следующими свойствами{name:DataSourceName, CanDownloadVectors:CanDownloadVectors, SearchResult:arrDataSourceList[oObjFound,...]}
	@returns {void}
	*/
	this.ShowResult = function(sTotalListName, arrTotalList){
		arrTotalResultSet = arrTotalList;
	    $(oResultCanvas).empty();
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

		var ulSearch = nsGmx.Utils._ul();

		for (var iDataSourceN  = 0; iDataSourceN < arrTotalResultSet.length; iDataSourceN++)
			nsGmx.Utils._(ulSearch, [drawSearchResult(iDataSourceN)]);

		if (arrTotalResultSet.length == 1){
			nsGmx.Utils._(oResultCanvas, [ulSearch]);
		}
		else{
			nsGmx.Utils._(oResultCanvas, [_li([nsGmx.Utils._div([_t(sTotalListName)], [['dir', 'className', 'SearchTotalHeader']]), ulSearch])]);
		}

        if (typeof($.fn.treeview) === 'function') {
            $(oResultCanvas).treeview();
        }

		$(oResultCanvas).find(".SearchResultListChildsCanvas").each(function() {
			this.parentNode.style.padding = '0px';
			this.parentNode.style.background = 'none';
		})
	}


    /**Создается переключатель страниц
    @param results - набор результатов
    @param onclick - обработчик нажатия переключателя страниц
    @returns {void}*/
    this.CreatePager = function (results, onclick) {

        function makeNavigButton(pager, img, imga, id, title) {
            var b = makeImageButton(sImagesHost + img, sImagesHost + imga);
            b.style.marginBottom = '-7px';
            $(b).attr('id', id)
            nsGmx.Utils._title(b, title);
            nsGmx.Utils._(pager, [b]);
            return b;
        }

        containerList = Container;
        $('#respager').remove();
        //var pager = nsGmx.Utils._div([_t('всего: ' + results[0].ResultsCount)], [["attr", "id", "respager"]]);
        var pager = nsGmx.Utils._div([_t('')], [["attr", "id", "respager"]]);
        nsGmx.Utils._(containerList, [pager]);

        var pcount = results[0].SearchResult[0] ? Math.ceil(results[0].SearchResult[0].OneOf / iLimit) : 0;
        if (pcount > 1) {
            var first = makeNavigButton(pager, '/first.png', '/first_a.png', 'firstpage', _gtxt('Первая страница'));
            $(first).bind('click', function () {
                fnShowPage(0);
            });
            var prev = makeNavigButton(pager, '/prev.png', '/prev_a.png', 'prevpages', _gtxt('Предыдущие [value0] страниц', iPagesCount));
            $(prev).bind('click', function () {
                fnShowPage(parseInt($('#page1').text()) - iPagesCount - 1);
            });
            $(first).hide();
            $(prev).hide();

            for (var i = 0; i < iPagesCount && i < pcount; ++i) {
                var pagelink = makeLinkButton(i + 1);
                $(pagelink).attr('id', 'page' + (i + 1));
                if (i == 0){
                    $(pagelink).attr('class', 'page')
                    attachEffects(pagelink, '');
                }
                $(pagelink).bind('click', onclick);
                nsGmx.Utils._(pager, [pagelink, _t(' ')]);
            }

            var remains = pcount % iPagesCount;
            var nextPages = pcount/iPagesCount<2 ? remains : iPagesCount
            var nextButTitle = 'Следующие [value0] страниц';
            if (nextPages == 1)
                nextButTitle = 'Следующая страница';
            if (nextPages % 10 == 1 && nextPages != 1 && nextPages != 11)
                nextButTitle = 'Следующая [value0] страница';
            if (1 < nextPages % 10 && nextPages % 10 < 5 && (nextPages<10 || nextPages > 20))
                nextButTitle = 'Следующие [value0] страницы';
            var next = makeNavigButton(pager, '/next.png', '/next_a.png', 'nextpages', _gtxt(nextButTitle, nextPages));
            $(next).bind('click', function () {
                fnShowPage(parseInt($('#page' + iPagesCount).text()));
            });
            var last = makeNavigButton(pager, '/last.png', '/last_a.png', 'lastpage', _gtxt('Последняя страница'));
            $(last).bind('click', function () {
                var lastindex = (remains == 0 ? iPagesCount : remains)
                fnShowPage(pcount - lastindex, $('#page' + lastindex));
            });

            if (iPagesCount >= pcount) {
                $(next).hide();
                $(last).hide();
            }
        }

        var fnShowPage = function (n, active) {
            //alert(n + "\n" + pcount);
            for (var i = 0; i < iPagesCount; ++i) {//pcount
                if (i + n < pcount) {
                    $('#page' + (i + 1)).text(i + n + 1);
                    $('#page' + (i + 1)).show();
                }
                else
                    $('#page' + (i + 1)).hide();
            }

            if (n < iPagesCount) {
                $('#prevpages').hide(); $('#firstpage').hide();
            }
            else {
                $('#prevpages').show(); $('#firstpage').show();
            }

            if (n + iPagesCount < pcount) {
                $('#nextpages').show(); $('#lastpage').show();
                var rest = pcount - n - iPagesCount;
                var nextPages = rest < iPagesCount ? rest : iPagesCount
                var nextButTitle = 'Следующие [value0] страниц';
                if (nextPages == 1)
                    nextButTitle = 'Следующая страница';
                if (nextPages % 10 == 1 && nextPages != 1 && nextPages != 11)
                    nextButTitle = 'Следующая [value0] страница';
                if (1 < nextPages % 10 && nextPages % 10 < 5 && (nextPages < 10 || nextPages > 20))
                    nextButTitle = 'Следующие [value0] страницы';
                $('#nextpages').attr('title', _gtxt(nextButTitle, nextPages));
            }
            else {
                $('#nextpages').hide(); $('#lastpage').hide();
            }

            if (active == null) active = $('#prevpages~span')[0];
            $(active).trigger('click');
        }
    }
    /*----------------------------------------------------------*/

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
        console.log(_this);
	};

	/** Показывает режим загрузки
	@returns {void}*/
	this.ShowLoading = function(){
	    $('#respager').remove();
        $(oResultCanvas).empty();
        // Container.appendChild(oResultCanvas);
		nsGmx.Utils._(oResultCanvas, [oLoading]);
	}

	/**Показывает сообщение об ошибке
	@returns {void}*/
	this.ShowError = function(){
		$(oResultCanvas).empty();
		nsGmx.Utils._(oResultCanvas, [_t("Произошла ошибка")]);
	}

	/**Очищает результаты поиска
	@returns {void}*/
	this.Unload = function(){unload();};
	/** Возвращает контрол, в котором находится данный контрол*/
	this.getContainer = function(){return Container;};
};

nsGmx.SearchLogic = function () {
    this.init = function (params) {
        this.oMenu = params.oMenu || new leftMenu();
        this.oSearchResultDiv = document.createElement('div');
        var workCanvas;
        this.oSearchResultDiv.className = 'ddfdfdf';
        this.oSearchResultDiv.title = window._gtxt('Изменить параметры поиска');

        console.log(this.oSearchResultDiv);

        var fnLoad = function(){
            if (oMenu != null){
                var alreadyLoaded = voMenu.createWorkCanvas("search", fnUnload);
                if(alreadyLoaded) {
                    // $(this.oMenu.workCanvas).empty();
                    $(this.oSearchResultDiv).empty();
                };
                // this.oMenu.workCanvas.appendChild(this.oSearchResultDiv);
            }
        }
        var fnUnload = function(){
            // if (oSearchControl != null)oSearchControl.Unload();
        }
        var fnBeforeSearch = function(event){
            /** Вызывается перед началом поиска
            @name Search.SearchGeomixer.onBeforeSearch
            @event */
            $(this.oSearchResultDiv).triggerHandler('onBeforeSearch');
            fnLoad();
        }
        var fnAfterSearch = function(event){
            /** Вызывается после окончания поиска
            @name Search.SearchGeomixer.onAfterSearch
            @event */
            $(this.oSearchResultDiv).triggerHandler('onAfterSearch');
        }
        var onDisplayedObjectsChanged = function(event, iDataSourceN, arrFoundObjects){
            /** Вызывается при изменении отображаемого списка найденных объектов(ведь они отображаются не все)
            @name Search.SearchGeomixer.onDisplayedObjectsChanged
            @event
            @param {int} iDataSourceN № источника данных(группы результатов поиска)
            @param {object[]} arrDSDisplayedObjects Результаты поиска, которые необходимо отобразить в текущей группе*/
            $(this.oSearchResultDiv).triggerHandler('onDisplayedObjectsChanged', [iDataSourceN, arrFoundObjects]);
        }
        var onObjectClick = function(event, oFoundObject){
            /** Вызывается при клике на найденный объект в списке результатов поиска
            @name Search.SearchGeomixer.onObjectClick
            @event
            @param {object} oFoundObject Найденный объект*/
            $(this.oSearchResultDiv).triggerHandler('onObjectClick', [oFoundObject]);
        };
        $(this.oSearchResultDiv).bind('onBeforeSearch', fnBeforeSearch);
        $(this.oSearchResultDiv).bind('onAfterSearch', fnAfterSearch);
        $(this.oSearchResultDiv).bind('onDisplayedObjectsChanged', onDisplayedObjectsChanged);
        $(this.oSearchResultDiv).bind('onObjectClick', onObjectClick);
    };

    this.fnLoad = function(){
        console.log('aa');
        if (this.oMenu != null){
            var alreadyLoaded = this.oMenu.createWorkCanvas("search", this.fnUnload);
            if(!alreadyLoaded) {
                this.oMenu.workCanvas.appendChild(this.oSearchResultDiv);
                // $(this.oMenu.workCanvas).empty();
            }
            $(this.oSearchResultDiv).empty();
        }
    };

    this.fnUnload = function () {

    };

    this.showResult = function (response) {
        this.fnLoad();
        console.log(response);

        var lstResult = new ResultList(this.oSearchResultDiv, imagesHost);
        console.log(lstResult);
                    lstResult.ShowLoading();
        lstResult.ShowResult('sdsds', response);





        // $(lstResult).bind('onObjectClick', fnObjectClick);
        // $(lstResult).bind('onDownloadSHP', fnDownloadSHP);
    }
}
