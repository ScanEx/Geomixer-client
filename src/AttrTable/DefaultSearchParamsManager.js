!(function() {

// events: queryChange, columnsChange
var DefaultSearchParamsManager = function() {
    this._activeColumns = null;
    this._queryTextarea = null;
    this._container = null;
};

/*var template = Handlebars.compile('<div>' +
    '<div>' +
        '<div class="attr-table-query-title">{{i "SQL-условие WHERE"}}</div>' +
        '<textarea class="inputStyle attr-table-query"></textarea>' +
        '<table class="attr-table-query-suggest"></table>' +
    '</div>' +
    '<div class="attr-table-fields-header">{{i "Показывать столбцы"}}:</div>' +
    '<div class="attr-table-columns-container">' +
    '</div>' +
    '<div class="attr-table-params-buttons">' +
        '<span class="bbuttonLink">{{i "Очистить поиск"}}"</span>' +
        '<span class="bbuttonLink">{{i "Найти"}}"</span>' +
    '</div>' +
'</div>');*/

DefaultSearchParamsManager.prototype.drawSearchUI = function(container, attributesTable) {
    var info = attributesTable.getLayerInfo(),
        paramsWidth = 300,
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

    var geomUI = $(Handlebars.compile('<span>' +
        '<span class="attr-table-geomtitle">{{i "Искать внутри полигона"}}</span>' +
        '<span class="gmx-icon-choose"></span>' +
        '<span class="attr-table-geom-placeholder"></span>' +
    '</span>')());

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
    this._queryTextarea = nsGmx.Utils._textarea(null, [['dir', 'className', 'inputStyle'], ['css', 'overflow', 'auto'], ['css', 'width', '280px'], ['css', 'height', '70px']]);

    var attrNames = [info.identityField].concat(info.attributes);
    var attrHash = {};
    for (var a = 0; a < attrNames.length; a++) {
        attrHash[attrNames[a]] = [];
    }

    var attrProvider = new nsGmx.LazyAttributeValuesProviderFromServer(attrHash, info.name);

    var attrSuggestWidget = new nsGmx.AttrSuggestWidget(this._queryTextarea, attrNames, attrProvider);

    var suggestCanvas = attrSuggestWidget.el[0];

    /*CLEAN/SEARCH BUTTONS*/
    var buttonsContainer = document.createElement('div'),
        searchButton = nsGmx.Utils.makeLinkButton(_gtxt('Найти')),
        cleanButton = nsGmx.Utils.makeLinkButton(_gtxt('Очистить поиск'));

    $(buttonsContainer).addClass('clean-search-buttons-container');
    $(buttonsContainer).append(cleanButton);
    $(buttonsContainer).append(searchButton);

    searchButton.onclick = function() {
        $(_this).trigger('queryChange');
    };

    $(searchButton).addClass('search-button');

    cleanButton.onclick = function() {
        _this._queryTextarea.value = '';
        _this._geometryInfoRow && _this._geometryInfoRow.RemoveRow();
        _this._geometryInfoRow = null;

        $(_this).trigger('queryChange');
    };

    searchButton.style.marginRight = '17px';
    cleanButton.style.marginRight = '3px';

    /*COMPILE*/

    $(container).append(hideButtonContainer);
    $(container).append(geomUI);

    nsGmx.Utils._(container, [nsGmx.Utils._div([nsGmx.Utils._div([nsGmx.Utils._t(_gtxt('SQL-условие WHERE'))], [['css', 'fontSize', '12px'], ['css', 'margin', '7px 0px 3px 1px']]), this._queryTextarea, suggestCanvas], [['dir', 'className', 'attr-query-container'], ['attr', 'filterTable', true]])]);
    $(container).append(buttonsContainer);

    // nsGmx.Utils._(container, [nsGmx.Utils._div([cleanButton, searchButton], [['css', 'textAlign', 'right'], ['css', 'margin', '5px 0px 0px 0px'], ['css', 'width', paramsWidth + 'px']])]);
};

DefaultSearchParamsManager.prototype.drawUpdateUI = function(container, attributesTable) {

    var paramsWidth = 300,
        hideButton = nsGmx.Utils.makeLinkButton(_gtxt('Скрыть')),
        _this = this;

    hideButton.onclick = function() {
        var tableTd = container.nextSibling,
            originalButton = $(tableTd).find('.attr-table-udpate-button');

        if ($(originalButton).hasClass('gmx-disabled')) {
            $(originalButton).removeClass('gmx-disabled');
        }

        container.style.display = 'none';
        attributesTable.resizeFunc();
    };

    var ui = document.createElement('div');

    ui.innerHTML = 'Hello Update';

    container.innerHTML = 'Hello Update';
    $(container).append(hideButton);


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
