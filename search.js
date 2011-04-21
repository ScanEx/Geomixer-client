var search =
{
    search: {}
}

var querySearch = function() {
    this.builded = false;

    this.searchField = null;

    this.resultCanvas = null;
    this.searchMapObjects = {};

    this.searchResponse = null;

    this.layersSearchFlag = true;

    this.limit = 10;

    this.countryZoom = 6;
    this.admZoom = 7;
    this.bigWaterZoom = 8;
    this.cityZoom = 11;
    this.villageZoom = 12;
    this.topoZoom = 12;
    this.roadZoom = 13;
    this.streetZoom = 15;
    this.houseZoom = 16;
    this.dtLastSearch = new Date();

    this.searchZoomLevels = {
        "дом": this.houseZoom,

        "грунтовые дороги": this.roadZoom,
        "автодорога с покрытием (шоссе)": this.roadZoom,
        "переулок": this.streetZoom,
        "площадь": this.streetZoom,
        "проезд": this.streetZoom,
        "улица": this.streetZoom,
        "шоссе": this.roadZoom,
        "автодорога с усовершенствованным покрытием (шоссе усовершенствованое)": this.roadZoom,
        "перекресток, круговое движение": this.roadZoom,
        "автомагистраль": this.roadZoom,
        "аллея": this.streetZoom,
        "бульвар": this.streetZoom,
        "грунтовые дороги без покрытия (улучшенные)": this.roadZoom,
        "линия": this.streetZoom,
        "набережная": this.streetZoom,
        "проезд без названия": this.streetZoom,
        "просек": this.roadZoom,
        "просека": this.roadZoom,
        "проспект": this.streetZoom,
        "тупик": this.streetZoom,
        "съезды": this.streetZoom,
        "тракт": this.roadZoom,
        "дорога": this.roadZoom,

        "государство": this.countryZoom,
        "станица": this.villageZoom,
        "поселок": this.villageZoom,
        "городской округ": this.cityZoom,
        "городское поселение": this.cityZoom,
        "город": this.cityZoom,
        "край": this.admZoom,
        "республика": this.admZoom,
        "рабочий поселок": this.villageZoom,
        "дачный поселок": this.villageZoom,
        "город": this.cityZoom,
        "деревня": this.villageZoom,
        "сельское поселение": this.villageZoom,
        "муниципальный район": this.cityZoom,
        "федеральный округ": this.admZoom,
        "автономная область": this.admZoom,
        "автономный округ": this.admZoom,
        "административный округ": this.cityZoom,
        "административный район": this.cityZoom,
        "область": this.admZoom,
        "район": this.admZoom,
        "хутор": this.villageZoom,
        "местечко": this.villageZoom,
        "село": this.villageZoom,

        "бухта": this.bigWaterZoom,
        "водный объект": this.topoZoom,
        "водохранилище": this.bigWaterZoom,
        "моря и океаны": this.bigWaterZoom,
        "озеро": this.bigWaterZoom,
        "остров": this.topoZoom,
        "острова": this.topoZoom,
        "протока": this.topoZoom,
        "старица": this.topoZoom,
        "реки и ручьи пересыхающие": this.topoZoom,
        "маяк": this.topoZoom,
        "пристань": this.topoZoom,
        "реки и ручьи с постоянным водотоком": this.topoZoom,
        "порт": this.topoZoom,
        "пристань с оборудованными  причалами": this.topoZoom,
        "речной порт": this.topoZoom,
        "залив": this.bigWaterZoom,
        "канава": this.topoZoom,
        "канал": this.topoZoom,
        "канал судоходный": this.topoZoom,
        "пруд": this.topoZoom,
        "пруды": this.topoZoom,
        "река": this.topoZoom,
        "ручей": this.topoZoom,
        "пристань без оборудованных причалов": this.topoZoom,
        "реки и ручьи пропадающие, подземные": this.topoZoom,
        "шлюзы": this.topoZoom,

        "жилой квартал": this.streetZoom,
        "квартал населенного пункта": this.streetZoom,
        "комплексная территория": this.streetZoom,
        "микрорайон": this.streetZoom,
        "незастроенная территория": this.streetZoom,
        "промышленная зона": this.streetZoom,
        "ж.д. платформа": this.roadZoom,
        "ж.д. станция": this.roadZoom,
        "метро": this.streetZoom,
        "метро": this.streetZoom,
        "станция монорельсовой транспортной системы": this.streetZoom,
        "разъезды, остановочные и обгонные пункты": this.streetZoom,
        "ж.д. вокзал": this.roadZoom,

        "болото": this.topoZoom,
        "зона отдыха": this.villageZoom,
        "кладбище": this.topoZoom,
        "лес": this.topoZoom,
        "лесничество": this.topoZoom,
        "заповедники, национальные парки": this.topoZoom,
        "питомник": this.topoZoom,
        "сад": this.topoZoom,
        "болота непроходимые": this.topoZoom,
        "болота проходимые": this.topoZoom,
        "дендропарк": this.topoZoom,
        "озелененная территория внутри н.п. (парки, скверы)": this.streetZoom,
        "лесопарк": this.topoZoom,
        "парк": this.streetZoom,
        "парк культуры и отдыха": this.streetZoom,
        "сквер": this.streetZoom,
        "дачные, садовые участки": this.villageZoom,
        "поселок городского типа": this.villageZoom,
        "поселок сельского типа": this.villageZoom,
        "прочие поселения": this.villageZoom,
        "отдельно расположенная часть населенного пункта": this.villageZoom,
        "отдельно расположенные дворы и строения": this.villageZoom,
        "выселок": this.villageZoom,
        "населенный пункт": this.villageZoom,
        "курортный поселок": this.villageZoom,
        "поселок при станции (разъезде)": this.villageZoom,
        "слобода": this.villageZoom,
        "починок": this.villageZoom,

        "понтонный мост": this.roadZoom,
        "аэропорт": this.roadZoom,
        "путепровод": this.roadZoom,
        "пешеходный мост": this.roadZoom,
        "ж.д. мост": this.roadZoom,
        "мосты и путепроводы": this.roadZoom,
        "автомобильный мост": this.roadZoom,
        "туннель": this.roadZoom,
        "эстакада": this.roadZoom

    }

    this.pagesCount = 7;

    // Переход на предыдущую страницу
    this.next = function(vals, name, divChilds, divPages) {
        var _this = this,
			button = makeImageButton('img/next.png', 'img/next_a.png');

        button.style.marginBottom = '-7px';

        button.onclick = function() {
            _this.start[name] += _this.pagesCount;
            _this.reportStart[name] = _this.start[name] * _this.limit;

            _this.drawPagesRow(vals, name, divChilds, divPages);
        }

        _title(button, _gtxt('Следующие [value0] страниц', _this.pagesCount));

        return button;
    }

    // Переход на следующую страницу
    this.previous = function(vals, name, divChilds, divPages) {
        var _this = this,
			button = makeImageButton('img/prev.png', 'img/prev_a.png');

        button.style.marginBottom = '-7px';

        button.onclick = function() {
            _this.start[name] -= _this.pagesCount;
            _this.reportStart[name] = _this.start[name] * _this.limit;

            _this.drawPagesRow(vals, name, divChilds, divPages);
        }

        _title(button, _gtxt('Предыдущие [value0] страниц', _this.pagesCount));

        return button;
    }

    // Переход на первую страницу
    this.first = function(vals, name, divChilds, divPages) {
        var _this = this,
			button = makeImageButton('img/first.png', 'img/first_a.png');

        button.style.marginBottom = '-7px';

        button.onclick = function() {
            _this.start[name] = 0;
            _this.reportStart[name] = _this.start[name] * _this.limit;

            _this.drawPagesRow(vals, name, divChilds, divPages);
        }

        _title(button, _gtxt('Первая страница'));

        return button;
    }

    // Переход на последнюю страницу
    this.last = function(vals, name, divChilds, divPages) {
        var _this = this,
			button = makeImageButton('img/last.png', 'img/last_a.png');

        button.style.marginBottom = '-7px';

        button.onclick = function() {
            _this.start[name] = Math.floor(_this.vals[name].length / (_this.pagesCount * _this.limit)) * _this.pagesCount;
            _this.reportStart[name] = Math.floor(_this.vals[name].length / _this.limit) * _this.limit;

            _this.drawPagesRow(vals, name, divChilds, divPages);
        }

        _title(button, _gtxt('Последняя страница'));

        return button;
    }

    this.downloadVectorForm = null;
}

querySearch.prototype = new leftMenu();

querySearch.prototype.createSearchButton = function(flag) {
    var _this = this;

    this.layersSearchFlag = flag;

    this.searchField = _input(null, [['dir', 'className', 'searchCenter']]);

    if ($.browser.msie)
        this.searchField.style.paddingTop = '4px';

    var searchButton = _div(null, [['dir', 'className', 'searchEnd']]);
    searchButton.onclick = function() {
        _this.search(_this.searchField.value)
    }

    if (!flag) {
        this.searchString = _gtxt("$$search$$_2");

        this.tdSearch = _td([_div(null, [['dir', 'className', 'searchBegin']])], [['css', 'width', '4px'], ['css', 'textAlign', 'right']]);
    }
    else {
        this.searchString = _gtxt("$$search$$_1");

        this.tdSearch = _td([_div(null, [['dir', 'className', 'searchBeginOn']])], [['css', 'width', '21px'], ['css', 'textAlign', 'right'], ['css', 'cursor', 'pointer']]);

        this.tdSearch.onclick = function() {
            _this.layersSearchFlag = !_this.layersSearchFlag;

            _this.updateSearchType();
        }

        attachEffects(this.tdSearch, 'active');

        _title(this.tdSearch, _gtxt('Изменить параметры поиска'));
    }

    searchButton.style.cursor = 'pointer';

    this.searchFieldCanvas = _table([_tbody([_tr([this.tdSearch,
												  _td([this.searchField]),
												  _td([searchButton], [['css', 'width', '20px']])])])], [['css', 'width', '100%']])

    this.searchFieldCanvas.style.marginTop = '3px';

    this.searchField.onkeyup = function(e) {
        var evt = e || window.event;
        if (getkey(evt) == 13) {
            _this.search(this.value)

            return true;
        }
    }

    this.searchField.value = this.searchString;

    this.searchField.onfocus = function() {
        if (this.value == _this.searchString) {
            this.value = '';

            this.style.color = '#153069';
        }
    }

    this.searchField.onblur = function() {
        if (this.value == '') {
            this.style.color = '';

            this.value = _this.searchString;
        }
    }

    this.downloadVectorForm = _form([_input(null, [['attr', 'name', 'name']]),
								 _input(null, [['attr', 'name', 'points']]),
								 _input(null, [['attr', 'name', 'lines']]),
								 _input(null, [['attr', 'name', 'polygons']])], [['css', 'display', 'none'], ['attr', 'method', 'POST'], ['attr', 'action', serverBase + "Shapefile.ashx"]]);


    _($$('searchCanvas'), [this.searchFieldCanvas, this.downloadVectorForm]);

    //autocomplete
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

    $(function() {

        $(".searchCenter").catcomplete({
            minLength: 3,
            source: fnAutoCompleteSource,
            select: fnAutoCompleteSelect
        });
    });


    //функция получения данных для автоподстановки адресного поиска
    function fnAutoCompleteSource(request, response) {
        sendCrossDomainJSONRequest(
			globalFlashMap.geoSearchAPIRoot + "SearchObject/SearchAddress.ashx?IsStrongSearch=0&Limit=10&SearchString=" + escape(request.term),
			function(responseMap) {
			    var arrResult = [];
			    for (var iList in responseMap.Result) {
			        var oResp = responseMap.Result[iList].SearchResult;
			        var name = responseMap.Result[iList].name;
			        for (var i = 0; i < oResp.length; i++) {
			            var sLabel = "";
			            var sCategory = "";
			            var sCategoryDesc = "";
			            for (j = 0; j < oResp[i].Path.length - 1; j++) {
			                if (oResp[i].Path[j][1] != "Российская Федерация" && oResp[i].Path[j][0] != "административный округ") {
			                    if (sCategory.length > 0) { sCategory += ", "; }
			                    sCategory = sCategory + oResp[i].Path[j][0] + " " + oResp[i].Path[j][1];
			                }
			                if (oResp[i].Path[j][1] != "Российская Федерация" && oResp[i].Path[j][0] != "административный округ") {
			                    if (sCategoryDesc.length > 0) { sCategoryDesc = ", " + sCategoryDesc; }
			                    sCategoryDesc = oResp[i].Path[j][0] + " " + oResp[i].Path[j][1] + sCategoryDesc;
			                }
			            }
			            sLabel = oResp[i].Path[oResp[i].Path.length - 1][0] + " " + oResp[i].Path[oResp[i].Path.length - 1][1]
			            arrResult[i] = { label: sLabel, category: sCategory, categoryDesc: sCategoryDesc, response: oResp[i] };
			        }

			        if (oResp.length > 0) break;
			    }
			    //функция определяющая метод сравнения объектов (сортируем сначала по категории, затем по наименованию)
			    var fnCompare = function(a, b) {
			        if (a.category > b.category)
			            return 1;
			        if (a.category < b.category)
			            return -1;
			        if (a.label > b.label)
			            return 1;
			        if (a.label < b.label)
			            return -1;
			        return 0;
			    };
			    arrResult.sort(fnCompare);
			    //Удаляем категории, в которых только 1 объект. 
			    //Это категории, где каждый предыдущий и каждый следующий элемент находится в другой категории
			    for (i = 0; i < arrResult.length; i++) {
			        var oResultObj = arrResult[i];
			        if (oResultObj.category != "" && (
						(i == 0 || oResultObj.category != arrResult[i - 1].category) && (i == arrResult.length - 1 || oResultObj.category != arrResult[i + 1].category))) {
			            oResultObj.label = oResultObj.label + "; " + oResultObj.categoryDesc
			            oResultObj.category = "";
			        }
			    }
			    arrResult.sort(fnCompare);
			    response(arrResult);
			}
		);
    }

    // выбор значения
    function fnAutoCompleteSelect(event, ui) {
        if (ui.item) {
            _this.dtLastSearch = new Date();
            if (!$$('left_search') || $$('left_search').style.display == 'none')
                search.search.load("search");

            _this.showResult(this.value, { "Выбрано": [ui.item.response] });
        }
    }
}

querySearch.prototype.updateSearchType = function() {
    if (this.layersSearchFlag) {
        this.searchString = _gtxt("$$search$$_1");

        if (this.searchField.value == _gtxt("$$search$$_2"))
            this.searchField.value = this.searchString;

        this.tdSearch.firstChild.className = 'searchBeginOn';
    }
    else {
        this.searchString = _gtxt("$$search$$_2");

        if (this.searchField.value == _gtxt("$$search$$_1"))
            this.searchField.value = this.searchString;

        this.tdSearch.firstChild.className = 'searchBeginOff';
    }
}

querySearch.prototype.load = function() {
    if (!this.builded) {
        var _this = this;

        this.resultCanvas = _div(null, [['dir', 'className', 'search']]);

        _(this.workCanvas, [this.resultCanvas])

        this.builded = true;
    }
}

querySearch.prototype.search = function(str) {
    if (Number(new Date()) - this.dtLastSearch < 1000 || $("#ui-active-menuitem").get().length > 0) return; //Если уже ведется поиск по автозаполнению, то обычный не ведем
    $(this.searchField).catcomplete("close");

    if (str == this.searchString || str == '')
        return;

    if (!$$('left_search') || $$('left_search').style.display == 'none')
        search.search.load("search");

    if (!parseCoordinates(str, function(x, y) {
        globalFlashMap.moveTo(x, y, globalFlashMap.getZ());

        globalFlashMap.drawing.addObject({ type: "POINT", coordinates: [x, y] }, { text: str });
    }))
        this.searchRequest(str);
    this.dtLastSearch = new Date();
}

querySearch.prototype.searchByGeometry = function(oGeometry) {
    if (oGeometry == 'undefined')
        return;

    if (!$$('left_search') || $$('left_search').style.display == 'none')
        search.search.load("search");

    if (!layersShown) {
        layersShown = true;
        resizeAll();
    }

    var loading = _div([_img(null, [['attr', 'src', 'img/progress.gif'], ['css', 'marginRight', '10px']]), _t(_gtxt("загрузка..."))], [['css', 'margin', '3px 0px 3px 20px']]),
		_this = this;

    removeChilds(_this.resultCanvas);
    _(this.resultCanvas, [loading]);

    sendCrossDomainJSONRequest(
		globalFlashMap.geoSearchAPIRoot + "SearchObject/SearchAddress.ashx?Limit=100&GeometryJSON=" + escape(JSON.stringify(oGeometry)),
		function(responseMap) {
		    var ret = {};
		    if (responseMap.Status == 'ok') {
		        for (var i = 0; i < responseMap.Result.length; i++) {
		            var name = responseMap.Result[i].name;
		            if (!ret[name])
		                ret[name] = responseMap.Result[i].SearchResult;
		        }
		    }

		    _this.showResult("Объекты здесь", ret);
		}
	);

    this.dtLastSearch = new Date();
}

querySearch.prototype.searchRequest = function(str) {
    if (!layersShown) {
        layersShown = true;

        resizeAll();
    }

    var loading = _div([_img(null, [['attr', 'src', 'img/progress.gif'], ['css', 'marginRight', '10px']]), _t(_gtxt("загрузка..."))], [['css', 'margin', '3px 0px 3px 20px']]),
		_this = this;

    removeChilds(_this.resultCanvas);
    _(this.resultCanvas, [loading]);

    globalFlashMap.sendSearchRequest(str, function(response) {
        var layersToSearch = [];

        _mapHelper.forEachMyLayer(function(layer) {
            if (layer.properties.type == "Vector" && layer.properties.AllowSearch)
                layersToSearch.push(layer);
        });

        if (!layersToSearch.length)
            _this.showResult(str, response);
        else {
            var respCount = 0;

            for (var i = 0; i < layersToSearch.length; ++i) {
                (function(i) {
                    globalFlashMap.layers[layersToSearch[i].properties.name].getFeatures(str, function(resp) {
                        ++respCount;

                        for (var j = 0; j < resp.length; j++) {
                            if (!response[layersToSearch[i].properties.name])
                                response[layersToSearch[i].properties.name] = [];

                            response[layersToSearch[i].properties.name].push({ properties: resp[j].properties, geometry: resp[j].geometry });
                        }

                        if (respCount == layersToSearch.length)
                            _this.showResult(str, response);
                    })
                })(i)
            }
        }
    })
}

querySearch.prototype.showResult = function(str, response) {
    removeChilds(this.resultCanvas);

    this.unload();

    if (!objLength(response)) {
        _(this.resultCanvas, [_div([_t(_gtxt("Поиск не дал результатов"))], [['css', 'margin', '10px 0px 0px 10px']])]);

        return;
    }
    else {
        var foundSomething = false;

        for (var name in response) {
            if (response[name].length > 0) {
                foundSomething = true;

                break;
            }
        }

        if (!foundSomething) {
            _(this.resultCanvas, [_div([_t(_gtxt("Поиск не дал результатов"))], [['css', 'margin', '10px 0px 0px 10px']])]);

            return;
        }
    }

    this.searchResponse = response;

    this.start = {};
    this.reportStart = {};
    this.allPages = {};
    this.vals = {};

    var ulSearch = _ul();

    for (var name in response)
        _(ulSearch, [this.drawSearchResult(name)])

    var removeSpan = makeLinkButton(_gtxt("Очистить")),
		_this = this;

    removeSpan.onclick = function() {
        _this.unload();

        removeChilds(_this.resultCanvas);
    }

    removeSpan.style.marginLeft = '10px';

    _(this.resultCanvas, [removeSpan, _br(), _li([_div([_t(str)], [['css', 'fontSize', '12px']]), ulSearch])])

    $(this.resultCanvas).treeview();

    $(this.resultCanvas).find(".childsCanvas").each(function() {
        this.parentNode.style.padding = '0px';
        this.parentNode.style.background = 'none';
    })
    var arrResults = $(".searchElem").get();
    if (arrResults.length == 1) arrResults[0].onclick();
}

querySearch.prototype.drawSearchResult = function(name) {
    var resp = this.searchResponse[name],
		layer = globalFlashMap.layers[name],
		header,
		nativeMapSearch = false;

    if (layer)
        header = layer.properties.title;
    else {
        header = name;
        nativeMapSearch = true; // База адресного поиска
    }

    var divChilds = _div(null, [['dir', 'className', 'childsCanvas']]),
		divPages = _div(),
		liInner = _li([divChilds, divPages]),
		li = _li([_div([_t(header), _span([_t("(" + resp.length + ")")])], [['dir', 'className', 'searchLayerHeader']]), _ul([liInner])]);

    this.start[name] = 0;
    this.reportStart[name] = 0;
    this.allPages[name] = 0;
    this.vals[name] = resp;

    this.drawTable(resp, name, divChilds, divPages);

    if (!nativeMapSearch && _mapHelper.mapProperties.CanDownloadVectors) {
        var downloadVector = makeLinkButton(_gtxt("Скачать shp-файл"));

        downloadVector.onclick = function() {
            _querySearch.downloadMarkers(name);
        }

        liInner.insertBefore(_div([downloadVector], [['css', 'padding', '2px 0px 6px 1px']]), liInner.firstChild)
    }

    return li;
}

querySearch.prototype.downloadMarkers = function(name) {
    var canvas = _div(),
		filename = _input(null, [['dir', 'className', 'filename'], ['attr', 'value', globalFlashMap.layers[name].properties.title]]),
		_this = this;

    var downloadButton = makeButton(_gtxt("Скачать"));
    downloadButton.onclick = function() {
        if (filename.value == '') {
            $(filename).addClass("error")

            setTimeout(function() { if (filename) $(filename).removeClass("error") }, 2000);

            return
        }

        var objectsByType = {};

        for (var i = 0; i < _this.searchResponse[name].length; i++) {
            var type = _this.searchResponse[name][i].geometry.type;

            if (!objectsByType[type])
                objectsByType[type] = [];

            objectsByType[type].push({ geometry: _this.searchResponse[name][i].geometry, properties: {} });
        }

        _this.downloadVectorForm.childNodes[0].value = filename.value;
        _this.downloadVectorForm.childNodes[1].value = objectsByType["POINT"] ? JSON.stringify(objectsByType["POINT"]).split("%22").join("\\\"") : '';
        _this.downloadVectorForm.childNodes[2].value = objectsByType["LINESTRING"] ? JSON.stringify(objectsByType["LINESTRING"]).split("%22").join("\\\"") : '';
        _this.downloadVectorForm.childNodes[3].value = objectsByType["POLYGON"] ? JSON.stringify(objectsByType["POLYGON"]).split("%22").join("\\\"") : '';

        _this.downloadVectorForm.submit();

        $(canvas.parentNode).dialog("destroy")
        canvas.parentNode.removeNode(true);
    }

    _(canvas, [_div([_t(_gtxt("Введите имя файла для скачивания")), filename], [['css', 'textAlign', 'center']]), _div([downloadButton], [['css', 'height', '25px'], ['css', 'width', '100px'], ['css', 'margin', '15px 0px 0px 100px']])])

    var area = getOffsetRect(this.workCanvas)
    showDialog(_gtxt("Скачать shp-файл"), canvas, 291, 120, 30, area.top + 10)
}

querySearch.prototype.drawTable = function(vals, name, divChilds, divPages) {
    if (vals.length <= this.limit) {
        removeChilds(divPages);

        this.drawRows(vals, name, divChilds)
    }
    else {
        this.allPages[name] = Math.ceil(vals.length / this.limit)

        this.drawPagesRow(vals, name, divChilds, divPages);
    }
}

querySearch.prototype.drawRows = function(vals, name, divChilds) {
    var _this = this;

    if (this.searchMapObjects[name])
        this.searchMapObjects[name].remove();

    var pageObject = globalFlashMap.addObject();

    this.searchMapObjects[name] = pageObject;

    removeChilds(divChilds);

    for (var i = 0; i < vals.length; i++) {
        var elemDiv = _div(null, [['css', 'whiteSpace', 'normal']]);

        if (typeof vals[i].ObjCode != 'undefined' && typeof vals[i].Path != 'undefined') {
            var len = vals[i].Path.length,
				realPath = [];

            for (var j = 0; j < len; j++) {
                var type = vals[i].Path[j][0],
					value = vals[i].Path[j][1];

                if ((type == "государство") || /[a-zA-Z]/.test(value))
                    realPath.push(value);
                else if ((type.indexOf("район") != -1) || (type.indexOf("область") != -1) || (type.indexOf("край") != -1))
                    realPath.push(value + " " + type);
                else
                    realPath.push(type + " " + value);
            }

            var searchElemHeader = _span([_t(realPath[len - 1])], [['dir', 'className', 'searchElem']]);

            (function(x, y, z) {
                searchElemHeader.onclick = function() {
                    globalFlashMap.setMinMaxZoom(1, 17);
                    globalFlashMap.moveTo(x, y, z);

                    return false;
                }
            })(vals[i].CntrLon, vals[i].CntrLat, _this.searchZoomLevels[vals[i].Path[len - 1][0]] || 12)

            _(elemDiv, [searchElemHeader]);

            if (len > 2) {
                var pathDescr = _span();

                for (var j = len - 2; j >= 0; j--)
                    _(pathDescr, [_span([_t(realPath[j] + (j > 0 ? ',' : ''))], [['css', 'marginLeft', '4px']])]);

                _(elemDiv, [pathDescr]);
            }
        }
        else {
            var properties = vals[i].properties,
				title = properties.NAME || properties.Name || properties.name || properties.text || "[объект]";

            var searchElemHeader = _span([_t(title)], [['dir', 'className', 'searchElem']]);

            searchElemHeader.bounds = getBounds(vals[i].geometry.coordinates);

            (function(i) {
                searchElemHeader.onclick = function() {
                    globalFlashMap.setMinMaxZoom(1, 17);

                    var curZ = globalFlashMap.getZ();

                    globalFlashMap.zoomToExtent(this.bounds.minX, this.bounds.minY, this.bounds.maxX, this.bounds.maxY);

                    if (vals[i].geometry.type == "POINT" || globalFlashMap.getZ() > 11)
                        globalFlashMap.moveTo(globalFlashMap.getX(), globalFlashMap.getY(), Math.max(11, curZ))

                    return false;
                }
            })(i);

            _(elemDiv, [searchElemHeader]);

            // эмуляция адресного поиска
            if (typeof substSearch != 'undefined' && substSearch[name]) {

            }
            else {
                var maxCount = 0,
					count = 0;
                for (var propName in properties) {
                    if (propName != 'NAME' && propName != 'Name' && propName != 'name' && propName != 'text')
                        maxCount++;
                }

                for (var propName in properties) {
                    if (propName != 'NAME' && propName != 'Name' && propName != 'name' && propName != 'text') {
                        _(elemDiv, [_t(" "), _span([_t(String(propName))], [['css', 'color', '#475869']]), _t(": " + String(properties[propName]) + ((count < maxCount - 1) ? ',' : ''))]);

                        count++;
                    }
                }
            }
        }

        _(divChilds, [elemDiv]);
    }

    var sortedVals = vals.sort(function(a, b) {
        if (a.CntrLat)
            return b.CntrLat - a.CntrLat;
        else if (a.properties.CenterY)
            return b.properties.CenterY - a.properties.CenterY;
        else
            return 0;
    });

    for (var i = 0; i < sortedVals.length; i++) {
        var elemMap;

        if (typeof sortedVals[i].ObjCode != 'undefined' && typeof sortedVals[i].Path != 'undefined') {
            var len = sortedVals[i].Path.length,
				realPath = [];

            for (var j = 0; j < len; j++) {
                var type = sortedVals[i].Path[j][0],
					value = sortedVals[i].Path[j][1];

                if ((type == "государство") || /[a-zA-Z]/.test(value))
                    realPath.push(value);
                else if ((type.indexOf("район") != -1) || (type.indexOf("область") != -1) || (type.indexOf("край") != -1))
                    realPath.push(value + " " + type);
                else
                    realPath.push(type + " " + value);
            }

            realPath.reverse();

            elemMap = pageObject.addObject({ type: "POINT", coordinates: [sortedVals[i].CntrLon, sortedVals[i].CntrLat] }, { Descr: strip(realPath.join("<br/>")) });
            elemMap.setStyle(this.getSearchStyles()["POINT"][0], this.getSearchStyles()["POINT"][1]);

            elemMap.enableHoverBalloon(function(o) {
                return o.properties.Descr.replace(/;/g, "<br/>");
            });

            if (sortedVals[i].Geometry != 'undefined') {
                elemMap = pageObject.addObject(sortedVals[i].Geometry, { Descr: strip(realPath.join("<br/>")) });
                elemMap.setStyle({ outline: { color: Math.round(0x222222 + 0x999999 * i / sortedVals.length), thickness: 3, opacity: 100} });

                elemMap.enableHoverBalloon(function(o) {
                    return o.properties.Descr.replace(/;/g, "<br/>");
                });
            }
        }
        else {
            var properties = sortedVals[i].properties,
				elemDescription = '';

            var maxCount = 0,
				count = 0;
            for (var propName in properties) {
                if (propName != 'NAME' && propName != 'Name' && propName != 'name' && propName != 'text')
                    maxCount++;
            }

            for (var propName in properties) {
                if (propName != 'NAME' && propName != 'Name' && propName != 'name' && propName != 'text') {
                    elemDescription += '<b>' + String(propName) + "</b>: " + (properties[propName] != null ? String(properties[propName]) : '') + ((count < maxCount - 1) ? ';' : '');

                    count++;
                }
            }

            elemMap = pageObject.addObject(sortedVals[i].geometry, { Descr: elemDescription });

            // эмуляция адресного поиска
            if (typeof substSearch != 'undefined' && substSearch[name]) {
                if (substSearch[name].length > 1)
                    elemMap.setStyle(substSearch[name][0], substSearch[name][1]);
                else
                    elemMap.setStyle(substSearch[name][0]);

                var balloonText = globalFlashMap.layers[name].properties.styles[0].Balloon;

                elemMap.enableHoverBalloon(function(obj) {
                    return balloonText.replace(/\[([a-zA-Z0-9_а-яА-Я]+)\]/g, function() {
                        return properties[arguments[1]];
                    });
                });
            }
            else {
                elemMap.setStyle(this.getSearchStyles()[sortedVals[i].geometry.type][0], this.getSearchStyles()[sortedVals[i].geometry.type][1]);

                elemMap.enableHoverBalloon(function(o) {
                    return o.properties.Descr.replace(/;/g, "<br/>");
                });
            }
        }
    }
}

querySearch.prototype.getSearchStyles = function(type) {
    return {
        'POINT': [
					{ marker: { image: getAPIFolderRoot() + "img/search.png", dx: -14, dy: -38} },
                    { marker: { image: getAPIFolderRoot() + "img/search_a.png", dx: -14, dy: -38} }
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
					{ marker: { image: getAPIFolderRoot() + "img/search.png", dx: -14, dy: -38} },
                    { marker: { image: getAPIFolderRoot() + "img/search_a.png", dx: -14, dy: -38} }
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

querySearch.prototype.drawPages = function(end, vals, name, divChilds, divPages) {
    var _this = this;
    for (var i = this.start[name] + 1; i <= end; i++) {
        // текущий элемент
        if (i - 1 == this.reportStart[name] / this.limit) {
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
                _this.reportStart[name] = this.getAttribute('page') * _this.limit;

                _this.drawPagesRow(vals, name, divChilds, divPages);
            };
        }

    }
}

querySearch.prototype.drawPagesRow = function(vals, name, divChilds, divPages) {
    // перерисовывем номера страниц
    removeChilds(divPages);

    var end = (this.start[name] + this.pagesCount <= this.allPages[name]) ? this.start[name] + this.pagesCount : this.allPages[name];

    if (this.start[name] - this.pagesCount >= 0)
        _(divPages, [this.first(vals, name, divChilds, divPages), this.previous(vals, name, divChilds, divPages)]);

    this.drawPages(end, vals, name, divChilds, divPages);

    if (end + 1 <= this.allPages[name])
        _(divPages, [this.next(vals, name, divChilds, divPages), this.last(vals, name, divChilds, divPages)]);

    this.drawRows(vals.slice(this.reportStart[name], this.reportStart[name] + this.limit), name, divChilds)
}

querySearch.prototype.unload = function() {
    for (var name in this.searchMapObjects)
        if (this.searchMapObjects[name])
        this.searchMapObjects[name].remove();

    this.searchMapObjects = {};
}

querySearch.prototype.unloadPage = function() {
    removeChilds(_querySearch.resultCanvas);

    _querySearch.unload();
}

var _querySearch = new querySearch();

search.search.load = function() {
    var alreadyLoaded = _querySearch.createWorkCanvas(arguments[0], _querySearch.unloadPage);

    if (!alreadyLoaded)
        _querySearch.load()
}

search.search.unload = function() {
}