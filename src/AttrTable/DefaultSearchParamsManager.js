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

    /* SEARCH INSIDE POLYGON */
    this._geometryInfoRow = null;

    var geomUIContainer = document.createElement('div');
    $(geomUIContainer).addClass('attr-table-geometry-container');

    var geomUI = $(Handlebars.compile('<span>' +
        '<span class="attr-table-geomtitle">{{i "Искать внутри полигона"}}</span>' +
        '<span class="gmx-icon-choose"></span>' +
        '<span class="attr-table-geom-placeholder"></span>' +
    '</span>')());

    $(geomUIContainer).append(geomUI);

    geomUI.find('.gmx-icon-choose').click(function() {
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
            {geomType: 'POLYGON'}
        );
    });

    /*SQL TEXTAREA*/
    this._queryTextarea = nsGmx.Utils._textarea(null, [['dir', 'className', 'inputStyle'], ['dir', 'className', 'attr-table-query-area'], ['css', 'overflow', 'auto'], ['css', 'width', '300px']]);
    this._queryTextarea.placeholder = '"field1" = 1 AND "field2" = \'value\'';
    this._queryTextarea.value = _this._searchValue;
    this._queryTextarea.oninput = function(e) {_this._searchValue = e.target.value};

    var attrNames = [info.identityField].concat(info.attributes);
    var attrHash = {};
    for (var a = 0; a < attrNames.length; a++) {
        attrHash[attrNames[a]] = [];
    }

    var attrProvider = new nsGmx.LazyAttributeValuesProviderFromServer(attrHash, info.name);

    var suggestionCallback = function () {
        $(_this._queryTextarea).trigger('input');
    }

    var attrSuggestWidget = new nsGmx.AttrSuggestWidget(this._queryTextarea, attrNames, attrProvider, suggestionCallback);

    var suggestCanvas = attrSuggestWidget.el[0];

    $(suggestCanvas).css('margin-right', '9px');

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
    nsGmx.Utils._(container, [nsGmx.Utils._div([nsGmx.Utils._span([nsGmx.Utils._t(_gtxt('SQL-условие WHERE'))], [['css', 'fontSize', '12px'], ['css', 'margin', '7px 0px 3px 1px']]), cleanButton, this._queryTextarea, suggestCanvas], [['dir', 'className', 'attr-query-container'], ['attr', 'filterTable', true]])]);
    $(container).append(geomUIContainer);
    $(container).append(buttonsContainer);
};

DefaultSearchParamsManager.prototype.drawUpdateUI = function(container, attributesTable) {
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

    /* SELECT COLUMN */
    var selectColumnContainer = document.createElement('div'),
        attrsTemplate = Handlebars.compile('<select class="attrs-select">' +
                            '{{#each this.attrs}}' +
                                '<option value="{{this}}">' +
                                    '{{this}}' +
                                '</option>' +
                            '{{/each}}' +
                        '</select>'),
        attrsUI,
        hideButton = nsGmx.Utils.makeLinkButton(_gtxt('Скрыть'));

        attrsUI = attrsTemplate({attrs: info.attributes});


        console.log(info.attributes);

    $(selectColumnContainer).append(window._gtxt("Обновить колонки"));
    $(selectColumnContainer).append(attrsUI);

    /* VALUE TEXTAREA */
    this._valueTextarea = nsGmx.Utils._textarea(null, [['dir', 'className', 'inputStyle'], ['dir', 'className', 'attr-table-query-area'], ['css', 'overflow', 'auto'], ['css', 'width', '300px']]);
    this._valueTextarea.placeholder = '"field1" = 1 AND "field2" = \'value\'';
    this._valueTextarea.value = _this._setValue;
    this._valueTextarea.oninput = function(e) {_this._setValue = e.target.value};

    var attrNames = [info.identityField].concat(info.attributes);
    var attrHash = {};
    for (var a = 0; a < attrNames.length; a++) {
        attrHash[attrNames[a]] = [];
    }

    var attrProvider = new nsGmx.LazyAttributeValuesProviderFromServer(attrHash, info.name);

    var suggestionCallback = function () {
        $(_this._valueTextarea).trigger('input');
    }

    var attrSuggestWidget = new nsGmx.AttrSuggestWidget(this._valueTextarea, attrNames, attrProvider, suggestionCallback);

    var suggestCanvas = attrSuggestWidget.el[0];

    $(suggestCanvas).css('margin-right', '9px');

    container.onclick = function(evt) {
        if (evt.target === container) {
            $(suggestCanvas).find('.suggest-helper').fadeOut(100);
            return true;
        }
    };

    /* UPDATE QUERY TEXTAREA */
    this._updateQueryTextarea = nsGmx.Utils._textarea(null, [['dir', 'className', 'inputStyle'], ['dir', 'className', 'attr-table-query-area'], ['css', 'overflow', 'auto'], ['css', 'width', '300px']]);
    this._updateQueryTextarea.placeholder = '"field1" = 1 AND "field2" = \'value\'';
    this._updateQueryTextarea.value = _this._setUpdateQueryValue;
    this._updateQueryTextarea.oninput = function(e) {_this._setUpdateQueryValue = e.target.value};

    var attrNames = [info.identityField].concat(info.attributes);
    var attrHash = {};
    for (var a = 0; a < attrNames.length; a++) {
        attrHash[attrNames[a]] = [];
    }

    var attrProvider = new nsGmx.LazyAttributeValuesProviderFromServer(attrHash, info.name);

    var suggestionCallback = function () {
        $(_this._updateQueryTextarea).trigger('input');
    }

    var attrSuggestWidget2 = new nsGmx.AttrSuggestWidget(this._updateQueryTextarea, attrNames, attrProvider, suggestionCallback);

    var suggestCanvas2 = attrSuggestWidget2.el[0];

    $(suggestCanvas).css('margin-right', '9px');

    container.onclick = function(evt) {
        if (evt.target === container) {
            $(suggestCanvas).find('.suggest-helper').fadeOut(100);
            return true;
        }
    };

    /*STATUS BAR*/

    /*APPLY BUTTON*/
    var applyButtonContainer = document.createElement('div'),
        applyButton = nsGmx.Utils.makeLinkButton(_gtxt('Применить'));

    $(applyButtonContainer).addClass('apply-button-container');
    $(applyButtonContainer).append(applyButton);

    applyButton.onclick = function() {

        // $(_this).trigger('queryChange');
    };

    $(applyButton).addClass('apply-button');

    /*COMPILE*/
    $(container).append(hideButtonContainer);
    $(container).append(selectColumnContainer);
    nsGmx.Utils._(container, [nsGmx.Utils._div([nsGmx.Utils._span([nsGmx.Utils._t(_gtxt('Значение'))], [['css', 'fontSize', '12px'], ['css', 'margin', '7px 0px 3px 1px'], ['css', 'display', 'inline-block']]), this._valueTextarea, suggestCanvas], [['dir', 'className', 'attr-query-container'], ['attr', 'filterTable', true]])]);
    nsGmx.Utils._(container, [nsGmx.Utils._div([nsGmx.Utils._span([nsGmx.Utils._t(_gtxt('SQL-условие WHERE'))], [['css', 'fontSize', '12px'], ['css', 'margin', '7px 0px 3px 1px'], ['css', 'display', 'inline-block']]), this._updateQueryTextarea, suggestCanvas2], [['dir', 'className', 'attr-query-container'], ['attr', 'filterTable', true]])]);
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

DefaultSearchParamsManager.prototype.getActiveColumns = function() {
    return this._activeColumns;
};

DefaultSearchParamsManager.prototype.resize = function(dims) {
};

nsGmx.AttrTable.DefaultSearchParamsManager = DefaultSearchParamsManager;

})();
