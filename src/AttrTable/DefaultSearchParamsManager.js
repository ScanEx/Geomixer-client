!(function() {

// events: queryChange, columnsChange
var DefaultSearchParamsManager = function() {
    this._activeColumns = null;
    this._queryTextarea = null;
    this._searchValue = null;
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
    this._queryTextarea.placeholder = '"field"=value';
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

    /*CLEAN/SEARCH BUTTONS*/
    var buttonsContainer = document.createElement('div'),
        searchButton = nsGmx.Utils.makeLinkButton(_gtxt('Найти')),
        cleanButton = nsGmx.Utils.makeLinkButton(_gtxt('Очистить поиск'));

    $(buttonsContainer).addClass('clean-search-buttons-container');
    // $(buttonsContainer).append(cleanButton);
    $(buttonsContainer).append(searchButton);

    searchButton.onclick = function() {

        $(_this).trigger('queryChange');
    };

    $(searchButton).addClass('search-button');

    cleanButton.onclick = function() {
        _this._queryTextarea.value = '';
        _this._geometryInfoRow && _this._geometryInfoRow.RemoveRow();
        _this._geometryInfoRow = null;
        _this._searchValue = this._queryTextarea.value;
        $(_this).trigger('queryChange');
    };

    searchButton.style.marginRight = '17px';
    cleanButton.style.marginRight = '3px';

    /*COMPILE*/
    $(container).append(hideButtonContainer);
    nsGmx.Utils._(container, [nsGmx.Utils._div([nsGmx.Utils._div([nsGmx.Utils._t(_gtxt('SQL-условие WHERE'))], [['css', 'fontSize', '12px'], ['css', 'margin', '7px 0px 3px 1px']]), this._queryTextarea, suggestCanvas], [['dir', 'className', 'attr-query-container'], ['attr', 'filterTable', true]])]);
    $(container).append(geomUIContainer);
    $(container).append(buttonsContainer);
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
