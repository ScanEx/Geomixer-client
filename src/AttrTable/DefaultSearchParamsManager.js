!(function() {

// events: queryChange, columnsChange
var DefaultSearchParamsManager = function() {
    this._activeColumns = null;
    this._queryTextarea = null; // textArea in search panel
    this._searchValue = '';     // value of this._queryTextarea
    this._valueTextarea = null; // upper textArea in update panel
    this._setValue = '';        // value of this._queryTextarea
    this._updateQueryTextarea = null; // lower textArea in update panel
    this._setUpdateQueryValue = '';   // value of this._updateQueryTextarea
    this._container = null;

    /* SEARCH INSIDE POLYGON */
    this._geometryInfoRow = null;
};

DefaultSearchParamsManager.prototype.drawSearchUI = function(container, attributesTable) {
    var info = attributesTable.getLayerInfo(),
        paramsWidth = 320,
        _this = this;

    this._container = container;

    /* HIDE BUTTON */
    var hideButtonContainer = document.createElement('div'),
        hideButton = nsGmx.Utils.makeLinkButton(_gtxt('Скрыть'));

    $(hideButton).addClass('attr-table-hide-button');
    $(hideButtonContainer).addClass('attr-table-hide-button-container');
    $(hideButtonContainer).append(hideButton);

    hideButton.onclick = function() {
        var tableTd = container.nextSibling,
            originalButton = $(tableTd).find('.attr-table-find-button');

        if ($(originalButton).hasClass('gmx-disabled')) {
            $(originalButton).removeClass('gmx-disabled');
        }
        container.style.display = 'none';
        attributesTable.resizeFunc();
    };

    var middleContainer = document.createElement('div');
    $(middleContainer).addClass('attr-table-middle-container');

    /* SEARCH INSIDE POLYGON */

    var geomUIContainer = this.drawGeomUI();

    /*SQL TEXTAREA*/
    this._queryTextarea = nsGmx.Utils._textarea(null, [['dir', 'className', 'inputStyle'], ['dir', 'className', 'attr-table-query-area'], ['css', 'overflow', 'auto'], ['css', 'width', '300px']]);
    this._queryTextarea.placeholder = '"field1" = 1 AND "field2" = \'value\'';
    this._queryTextarea.value = _this._searchValue;
    this._queryTextarea.oninput = function(e) {_this._searchValue = e.target.value};

    var attrNames = [info.identityField].concat(info.attributes, [window._gtxt('gmx_geometry')]);
    var attrHash = {};
    for (var a = 0; a < attrNames.length; a++) {
        attrHash[attrNames[a]] = [];
    }

    var attrProvider = new nsGmx.LazyAttributeValuesProviderFromServer(attrHash, info.name);

    var suggestionCallback = function () {
        $(_this._queryTextarea).trigger('input');
    }

    var attrSuggestWidget = new nsGmx.AttrSuggestWidget([this._queryTextarea], attrNames, attrProvider, null, ['attrs', 'operators', 'functions']);

    var suggestCanvas = attrSuggestWidget.el[0];

    $(suggestCanvas).css('margin-right', '9px');

    var suggestionCallback = function () {
        $(this.currentTextArea).trigger('input');
    }

    attrSuggestWidget.setCallback(suggestionCallback);

    container.onclick = function(evt) {
        if (evt.target === container) {
            $(suggestCanvas).find('.suggest-helper').fadeOut(100);
            return true;
        }
    };

    /*CLEAN/SEARCH BUTTONS*/
    var buttonsContainer = document.createElement('div'),
        searchButton = nsGmx.Utils.makeLinkButton(_gtxt('Найти')),
        cleanButton = nsGmx.Utils.makeLinkButton(_gtxt('Очистить'));

    $(buttonsContainer).addClass('clean-search-buttons-container');
    $(buttonsContainer).append(searchButton);

    searchButton.onclick = function() {

        $(_this).trigger('queryChange');
    };

    $(searchButton).addClass('search-button');
    $(cleanButton).addClass('clean-button');

    cleanButton.onclick = function() {
        _this._queryTextarea.value = '';
        _this._geometryInfoRow && _this._geometryInfoRow.RemoveRow();
        _this._geometryInfoRow = null;
        _this._searchValue = _this._queryTextarea.value;
        $(_this).trigger('queryChange');
    };

    /*COMPILE*/
    $(container).append(hideButtonContainer);
    $(container).append(middleContainer);
    nsGmx.Utils._(middleContainer, [nsGmx.Utils._div([nsGmx.Utils._span([nsGmx.Utils._t(_gtxt('WHERE'))], [['css', 'fontSize', '12px'], ['css', 'margin', '7px 0px 3px 1px']]), cleanButton, this._queryTextarea, suggestCanvas], [['dir', 'className', 'attr-query-container'], ['attr', 'filterTable', true]])]);
    $(middleContainer).append(geomUIContainer);
    $(container).append(buttonsContainer);
};

DefaultSearchParamsManager.prototype.drawUpdateUI = function(container, attributesTable) {
    var info = attributesTable.getLayerInfo(),
        paramsWidth = 320,
        _this = this;

    this.currentColumnName = "",
    this._container = container;

    var geomUIContainer = this.drawGeomUI();

    /* HIDE BUTTON */
    var hideButtonContainer = document.createElement('div'),
        hideButton = nsGmx.Utils.makeLinkButton(_gtxt('Скрыть'));

    $(hideButton).addClass('attr-table-hide-button');
    $(hideButtonContainer).addClass('attr-table-hide-button-container');
    $(hideButtonContainer).append(hideButton);

    hideButton.onclick = function() {
        var tableTd = container.nextSibling,
            originalButton = $(tableTd).find('.attr-table-find-button');

        if ($(originalButton).hasClass('gmx-disabled')) {
            $(originalButton).removeClass('gmx-disabled');
        }
        container.style.display = 'none';
        attributesTable.resizeFunc();
    };

    var middleContainer = document.createElement('div');
    $(middleContainer).addClass('attr-table-middle-container');

    /* SELECT COLUMN */
    var selectColumnContainer = document.createElement('div'),
        attrsTemplate = Handlebars.compile('<select class="attrs-select selectStyle">' +
                            '{{#each this.attrs}}' +
                                '<option value="{{this}}">' +
                                    '{{this}}' +
                                '</option>' +
                            '{{/each}}' +
                        '</select>'),
        attrsUI = $(attrsTemplate({
            attrs: ['---' + window._gtxt("Выберите колонку").toLowerCase() + '---'].concat(info.attributes)
        }))[0],
        hideButton = nsGmx.Utils.makeLinkButton(_gtxt('Скрыть'));

    $(selectColumnContainer).append(window._gtxt("Обновить колонку"));
    $(selectColumnContainer).append(attrsUI);

    attrsUI.onchange = function (e) {
        _this.currentColumnName = e.target.value;
    }

    /* VALUE TEXTAREA */
    this._valueTextarea = nsGmx.Utils._textarea(null, [['dir', 'className', 'inputStyle'], ['dir', 'className', 'attr-table-query-area'], ['css', 'overflow', 'auto'], ['css', 'margin-top', '3px'], ['css', 'width', '300px'], ['css', 'height', '80px']]);
    this._valueTextarea.placeholder = '"field1" = 1 AND "field2" = \'value\'';
    this._valueTextarea.value = _this._setValue;
    this._valueTextarea.oninput = function(e) {_this._setValue = e.target.value};

    /* UPDATE QUERY TEXTAREA */
    this._updateQueryTextarea = nsGmx.Utils._textarea(null, [['dir', 'className', 'inputStyle'], ['dir', 'className', 'attr-table-query-area'], ['css', 'overflow', 'auto'], ['css', 'margin-top', '3px'], ['css', 'width', '300px'], ['css', 'height', '80px']]);
    this._updateQueryTextarea.placeholder = '"field1" = 1 AND "field2" = \'value\'';
    this._updateQueryTextarea.value = _this._setUpdateQueryValue;

    this._updateQueryTextarea.oninput = function(e) {_this._setUpdateQueryValue = e.target.value};

    var attrNames = [info.identityField].concat(info.attributes, [window._gtxt('gmx_geometry')]);
    var attrHash = {};
    for (var a = 0; a < attrNames.length; a++) {
        attrHash[attrNames[a]] = [];
    }

    var attrProvider = new nsGmx.LazyAttributeValuesProviderFromServer(attrHash, info.name);

    var attrSuggestWidget = new nsGmx.AttrSuggestWidget([this._valueTextarea, this._updateQueryTextarea], attrNames, attrProvider, null, ['attrs', 'operators', 'functions']);
    var suggestCanvas = attrSuggestWidget.el[0];
    $(suggestCanvas).css('margin-right', '9px');


    var suggestionCallback = function () {
        $(this.currentTextArea).trigger('input');
    }

    attrSuggestWidget.setCallback(suggestionCallback);

    this._valueTextarea.onfocus = function(e) {attrSuggestWidget.setActiveTextArea(e.target)};
    this._updateQueryTextarea.onfocus = function(e) {attrSuggestWidget.setActiveTextArea(e.target)};


    container.onclick = function(evt) {
        if (evt.target === container) {
            $(suggestCanvas).find('.suggest-helper').fadeOut(100);
            return true;
        }
    };

    /*STATUS BAR*/

    var statusBar = $(Handlebars.compile(
        '<div class="column-update-spinholder">' +
            '<span class="spinHolder" style="display:none">' +
                '<img src="img/progress.gif"/>' +
                '<span class="spinMessage"></span>' +
                '</span>' +
            '<span class="spinErrorMessage" style="display:none"></span>' +
        '</div>')({}))[0];

    /*APPLY BUTTON*/
    var applyButtonContainer = document.createElement('div'),
        applyButton = nsGmx.Utils.makeLinkButton(_gtxt('Применить'));

    $(applyButtonContainer).addClass('apply-button-container');
    $(applyButtonContainer).append(applyButton);

    applyButton.onclick = function() {

        var spinHolder = $(statusBar).find('.spinHolder');
        var spinErrorMessage = $(statusBar).find('.spinErrorMessage');

        $(spinErrorMessage).hide();

        if (!_this.currentColumnName || _this.currentColumnName === '---' + window._gtxt("Выберите колонку").toLowerCase() + '---') {

            $(spinErrorMessage).html(window._gtxt('Выберите колонку'));
            $(spinErrorMessage).show();
            return;
        }

        $(spinHolder).show();

        var updateQuery = _this._valueTextarea && _this._valueTextarea.value ? _this._valueTextarea.value : '';
        var whereQuery = _this._updateQueryTextarea && _this._updateQueryTextarea.value ? _this._updateQueryTextarea.value : '';

        whereQuery = _this.addGeomQuery(whereQuery);

        var url = window.serverBase + 'VectorLayer/QueryScalar';
            // 'UPDATE ' + '"' + attributesTable.layerName + '"' +
            // 'SET ' +  '"' + _this.currentColumnName + '"' + '=' + updateQuery + (whereQuery ? ('WHERE ' + whereQuery) : "");
		var sql = encodeURIComponent ('UPDATE "' + attributesTable.layerName + '" SET "' + _this.currentColumnName + '" = ' + updateQuery + (whereQuery ? ('WHERE ' + whereQuery) : ""));

        fetch(url, {
             method: 'POST',
             credentials: 'include',
             mode: 'cors',
			 headers: { 'Content-Type': 'application/x-www-form-urlencoded'},
			 body: 'sql=' + sql
          }).then(toJson)
          .then(resCallback)
          .catch(catchErr);

         function toJson(res) {
             return res.text();
         }

        function resCallback(res) {
            var json, result, fields, types, values;

            $(spinHolder).hide();
            json = JSON.parse(res);
            result = json.Result;

            if (json.Status === 'error') {
                throw new Error(json.ErrorInfo.ErrorMessage);
            }

            $(attributesTable._serverDataProvider).change();
        }

        function catchErr(e) {
            $(spinHolder).hide();
            $(spinErrorMessage).html(window._gtxt('Ошибка'));
            $(spinErrorMessage).show();
        }
    };

    $(applyButton).addClass('apply-button');

    /*COMPILE*/
    $(container).append(hideButtonContainer);
    $(container).append(middleContainer);
    $(middleContainer).append(selectColumnContainer);
    $(middleContainer).append(selectColumnContainer);
    nsGmx.Utils._(middleContainer, [nsGmx.Utils._div([nsGmx.Utils._span([nsGmx.Utils._t(_gtxt('VALUE'))], [['css', 'fontSize', '12px'], ['css', 'margin', '4px 0px 3px 1px'], ['css', 'display', 'inline-block']]), this._valueTextarea], [['dir', 'className', 'attr-query-container'], ['attr', 'filterTable', true]])]);
    nsGmx.Utils._(middleContainer, [nsGmx.Utils._div([nsGmx.Utils._span([nsGmx.Utils._t(_gtxt('WHERE'))], [['css', 'fontSize', '12px'], ['css', 'margin', '4px 0px 3px 1px'], ['css', 'display', 'inline-block']]), this._updateQueryTextarea, suggestCanvas], [['dir', 'className', 'attr-query-container'], ['attr', 'filterTable', true]])]);
    $(middleContainer).append(geomUIContainer);
    $(middleContainer).append(statusBar);
    $(container).append(applyButtonContainer);
}

DefaultSearchParamsManager.prototype.getQuery = function() {
    var query = this._queryTextarea && this._queryTextarea.value,
        drawingObject = this._geometryInfoRow && this._geometryInfoRow.getDrawingObject(),
        geom = drawingObject && drawingObject.toGeoJSON().geometry,
        geomStr = geom ? 'intersects([geomixergeojson], GeometryFromGeoJson(\'' + JSON.stringify(geom) + '\', 4326))' : '',
        resQuery = (query && geomStr) ? '(' + query + ') AND ' + geomStr : (query || geomStr);
    return resQuery;
};

DefaultSearchParamsManager.prototype.addGeomQuery = function(query) {
    var drawingObject = this._geometryInfoRow && this._geometryInfoRow.getDrawingObject(),
        geom = drawingObject && drawingObject.toGeoJSON().geometry,
        geomStr = geom ? 'intersects([geomixergeojson], GeometryFromGeoJson(\'' + JSON.stringify(geom) + '\', 4326))' : '',
        resQuery = (query && geomStr) ? '(' + query + ') AND ' + geomStr : (query || geomStr);
    return resQuery;
};

DefaultSearchParamsManager.prototype.drawGeomUI = function() {
    var geomUIContainer = document.createElement('div');
    var geomUI = $(Handlebars.compile('<span>' +
        '<span class="attr-table-geomtitle">{{i "Искать по пересечению с объектом"}}</span>' +
        '<span class="gmx-icon-choose"></span>' +
        '<span class="attr-table-geom-placeholder"></span>' +
    '</span>')());

    $(geomUIContainer).addClass('attr-table-geometry-container');
    $(geomUIContainer).append(geomUI);

    geomUI.find('.gmx-icon-choose').click(onGeometrySelectButtonClick);


    var _this = this;

    function onGeometrySelectButtonClick() {
        nsGmx.Controls.chooseDrawingBorderDialog(
            'attrTable',
            function(drawingObject) {
                _this._geometryInfoRow && _this._geometryInfoRow.RemoveRow();
                var InfoRow = gmxCore.getModule('DrawingObjects').DrawingObjectInfoRow;
                _this._geometryInfoRow = new InfoRow(
                    nsGmx.leafletMap,
                    geomUI.find('.attr-table-geom-placeholder')[0],
                    drawingObject,
                    {
                        editStyle: false,
                        allowDelete: true
                    }
                );

                $(_this._geometryInfoRow).on('onRemove', function() {
                    _this._geometryInfoRow && _this._geometryInfoRow.RemoveRow();
                    _this._geometryInfoRow = null;
                });
            },
            {geomType: null}
        );
    }

    return geomUIContainer;
}

DefaultSearchParamsManager.prototype.getActiveColumns = function() {
    return this._activeColumns;
};

DefaultSearchParamsManager.prototype.resize = function(dims) {
};

nsGmx.AttrTable.DefaultSearchParamsManager = DefaultSearchParamsManager;

})();
