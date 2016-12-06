//Отображение закладок карты в левой панели

//TODO: сделать глобально доступным
nsGmx.Controls = nsGmx.Controls || {};
nsGmx.Controls.LanguageSelector = function(container, defLang) {

    var LANGUAGES = [
            {lang: 'rus', title: 'rus'},
            {lang: 'eng', title: 'eng'}
        ],
        lang = null,
        _this = this;

    var template = Handlebars.compile('<div class = "language-container">' +
        '{{#langs}}' +
            '<span data-lang = "{{lang}}" class="language-item">{{title}}</span>' +
        '{{/langs}}' +
    '</div>');

    $(container).empty().append($(template({langs: LANGUAGES})));

    var update = function() {
        var newLang = $(this).data('lang'),
            prevLang = lang;

        if (newLang !== prevLang) {
            lang = newLang;
            $(this).addClass('language-selected')
                .siblings().removeClass('language-selected');
            $(_this).trigger('change', [prevLang, newLang]);
        }
    }

    $(container).find('span').click(update);
    update.bind($(container).find('span')[0])();

    this.getLang = function() {return lang;};
}

var queryTabs = function()
{
	this.builded = false;

	this.tabsCanvas = null;

	this.tabs = [];
}

queryTabs.prototype = new leftMenu();

queryTabs.prototype.load = function()
{
	if (!this.builded)
	{
		var _this = this;
		this.tabsCanvas = _div(null, [['dir','className','tabsCanvas']])

		this.workCanvas.appendChild(this.tabsCanvas);

		for (var i = 0; i < this.tabs.length; i++)
			this.draw(this.tabs[i]);

		this.builded = true;

		$(this.tabsCanvas).sortable({
			axis: 'y',
			tolerance: 'pointer',
			containment: 'parent'
		});
		$(this.tabsCanvas).bind('sortupdate', function(event, ui)
		{
			var orderedTabs = [];
			$(_this.tabsCanvas).children().each(function()
			{
				orderedTabs.push(this.tabInfo);
			})

			_this.tabs = orderedTabs;
		});

        this.leftPanelItem.hide();
	}
}

queryTabs.prototype.add = function(tabInfo, tabIndex)
{
    var isNew = typeof tabIndex === 'undefined';
    tabInfo = tabInfo || {
        name_rus: '',
        description_rus: '',
        name_eng: '',
        description_eng: ''
    };

    if (typeof tabInfo.name_rus === 'undefined') {
        tabInfo.name_rus = tabInfo.name;
    }

    if (typeof tabInfo.description_rus === 'undefined') {
        tabInfo.description_rus = tabInfo.description;
    }

    var uiTemplate = Handlebars.compile(
        '<div class = "addtabs-container">' +
            '<div class = "addtabs-info">{{i "Название"}}</div>' +
            '<input class = "addtabs-title-input inputStyle" value="{{title}}"><br>' +
            '<div class = "addtabs-info">{{i "Описание"}}</div>' +
            '<textarea class = "addtabs-title-description inputStyle">{{description}}</textarea><br>' +
            '<button class = "addtabs-create">{{buttonTitle}}</button>' +
            '<div class = "addtabs-lang-placeholder"></div>' +
        '</div>');


    var titleLoc = {rus: tabInfo.name_rus, eng: tabInfo.name_eng};
    var descrLoc = {rus: tabInfo.description_rus, eng: tabInfo.description_eng};
    var ui = $(uiTemplate({
            title: titleLoc.rus,
            description: descrLoc.rus,
            buttonTitle: isNew ? _gtxt('Создать') : _gtxt('Изменить')
        })),
        titleInput = $('.addtabs-title-input', ui);

    var updateDataLoc = function(lang) {
        titleLoc[lang] = titleInput.val();
        descrLoc[lang] = $('.addtabs-title-description', ui).val();
    }

    var langControl = new nsGmx.Controls.LanguageSelector(ui.find('.addtabs-lang-placeholder'));
    $(langControl).change(function(event, prevLang, newLang) {
        updateDataLoc(prevLang);
        titleInput.val(titleLoc[newLang]);
        $('.addtabs-title-description', ui).val(descrLoc[newLang]);
    })

    titleInput.keyup(function(e) {
        $(this).toggleClass('error', this.value == '');

        if (e.keyCode == 13)
        {
			createTab();
	  		return false;
	  	}

		return true;
    });

    titleInput.focus();

	var createTab = function() {
            updateDataLoc(langControl.getLang());
            var mapState = _mapHelper.getMapState(),
                tab = {
                    name: titleLoc.rus || titleLoc.eng,
                    description: descrLoc.rus || descrLoc.eng,

                    name_rus: titleLoc.rus,
                    description_rus: descrLoc.rus,
                    name_eng: titleLoc.eng,
                    description_eng: descrLoc.eng,

                    state: mapState
                };

            if (isNew) {
            _this.tabs.push(tab);
            } else {
                _this.tabs[tabIndex] = tab;
            }
            _this.draw(tab, tabIndex);

            removeDialog(dialogDiv);
        },
        _this = this;

    $('.addtabs-create', ui).click(createTab);

	var dialogDiv = showDialog(_gtxt("Имя закладки"), ui[0], 280, 230, false, false);
}

queryTabs.prototype.draw = function (tabInfo, tabIndex)
{
    var selectValLoc = function(paramName) {
        var lang = nsGmx.Translations.getLanguage();
        return tabInfo[paramName + '_' + lang] || tabInfo[paramName];
    }

    var tmpl = Handlebars.compile('<div class="canvas">' +
        '<div class="buttonLink tabName" title="{{description}}">{{name}}</div>' +
        '<div class="gmx-icon-edit"></div>' +
        '<div class="gmx-icon-close"></div>' +
    '</div>');


    var canvas = $(tmpl({
            name: selectValLoc('name'),
            description: selectValLoc('description')
        }))[0];
    var _this = this;

	canvas.tabInfo = tabInfo;

    $('.tabName', canvas).click(this.show.bind(this, tabInfo.state));

    $('.gmx-icon-close', canvas).click(function() {
		var index = getOwnChildNumber(canvas);

		_this.tabs.splice(index, 1);

		canvas.removeNode(true);
	})

    $('.gmx-icon-edit', canvas).click(function() {
        var index = getOwnChildNumber(canvas);
        _this.add(_this.tabs[index], index);
    }).toggle(_queryMapLayers.currentMapRights() === "edit");

    if (typeof tabIndex === 'undefined') {
        $(this.tabsCanvas).append(canvas);
    } else {
        $(this.tabsCanvas).find('.canvas').eq(tabIndex).replaceWith(canvas);
    }
}

queryTabs.prototype.show = function(state)
{
	var parsedState = {},
        lmap = nsGmx.leafletMap,
        gmxDrawing = lmap.gmxDrawing;

	$.extend(true, parsedState, state);
    var pos = parsedState.position;

    lmap.setView(L.Projection.Mercator.unproject(L.point(pos.x, pos.y)), 17 - pos.z);

    for (var i = 0; i < state.drawnObjects.length; i++)
    {
        parsedState.drawnObjects[i].geometry = L.gmxUtil.geometryToGeoJSON(state.drawnObjects[i].geometry, true);
    }

    lmap.gmxBaseLayersManager.setCurrentID(lmap.gmxBaseLayersManager.getIDByAlias(parsedState.mode));

    //удаляем все фичи
    gmxDrawing.getFeatures().slice(0).forEach(gmxDrawing.remove.bind(gmxDrawing));

	for (var i = 0; i < parsedState.drawnObjects.length; i++)
	{
        //старый формат - число, новый - строка
		var rawColor = parsedState.drawnObjects[i].color,
            color = (typeof rawColor === 'number' ? '#' + L.gmxUtil.dec2hex(rawColor) : rawColor) || '#0000FF',
			thickness = parsedState.drawnObjects[i].thickness || 2,
			opacity = parsedState.drawnObjects[i].opacity || 80;

        gmxDrawing.addGeoJSON(parsedState.drawnObjects[i].geometry, {
            lineStyle: {
                color: color,
                weight: thickness,
                opacity: opacity/100
            }
        });
	}

	_queryMapLayers.applyState(parsedState.condition, parsedState.mapStyles);

    if (typeof parsedState.customParamsCollection !== 'undefined')
        _mapHelper.customParamsManager.loadParams(parsedState.customParamsCollection);

    if (parsedState.openPopups) {
        for (var l in parsedState.openPopups) {
            var layer = nsGmx.gmxMap.layersByID[l];
            if (layer && layer.addPopup) {
                parsedState.openPopups[l].forEach(layer.addPopup.bind(layer));
            }
        }
    }
}

var _queryTabs = new queryTabs();

nsGmx.userObjectsManager.addDataCollector('tabs', {
    collect: function()
    {
        if (!_queryTabs.tabs.length)
            return null;

        var tabs = [];

        for (var i = 0; i < _queryTabs.tabs.length; i++)
        {
            var tab = {};

            $.extend(tab, _queryTabs.tabs[i]);

            tabs.push(tab);
        }

        return tabs;
    },
    load: function(data)
    {
        if (!data || !data.length)
            return;

        $('#left_mapTabs').remove();

        _queryTabs.builded = false;
        _queryTabs.tabs = data;

        mapHelp.tabs.load('mapTabs');
    }
})
