!(function(_){

// events: queryChange, columnsChange
var DefaultSearchParamsManager = function() {
    this._activeColumns = null;
    this._queryTextarea = null;
    this._container = null;
}

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
        '<input class="btn attr-table-params-clear" type="submit" value="{{i "Очистить поиск"}}">' +
        '<input class="btn attr-table-params-find" type="submit" value="{{i "Найти"}}">' +
    '</div>' +
'</div>');*/

DefaultSearchParamsManager.prototype.render = function(container, attributesTable) {
    var info = attributesTable.getLayerInfo(),
        paramsWidth = 300,
        searchButton = makeButton(_gtxt("Найти")),
        cleanButton = makeButton(_gtxt("Очистить поиск")),
        _this = this;
        
    var columnsList = this._columnsList = _div(null, [['dir','className','attrsColumnsList'], ['css','overflowY','auto'],['css','width',paramsWidth - 21 + 'px']]);
    
    this._container = container;

    searchButton.onclick = function()
    {
        $(_this).trigger('queryChange');
    }
    
    cleanButton.onclick = function()
    {
        _this._queryTextarea.value = "";
        $(_this).trigger('queryChange');
    }
    
    this._queryTextarea = _textarea(null, [['dir','className','inputStyle'],['css','overflow','auto'],['css','width','280px'],['css','height','70px']]);
    
    var attrNames = [info.identityField].concat(info.attributes);
    var attrHash = {};
    for (var a = 0; a < attrNames.length; a++) 
        attrHash[attrNames[a]] = [];
        
    var attrProvider = new nsGmx.LazyAttributeValuesProviderFromServer( attrHash, info.name );
    
    var attrSuggestWidget = new nsGmx.AttrSuggestWidget(this._queryTextarea, attrNames, attrProvider);

    var suggestCanvas = attrSuggestWidget.el[0];
    
    _(container, [_div([_div([_t(_gtxt("SQL-условие WHERE"))],[['css','fontSize','12px'],['css','margin','7px 0px 3px 1px']]), this._queryTextarea, suggestCanvas],[['dir','className','attr-query-container'], ['attr','filterTable',true]])])
    
    _(container, [_div([_t(_gtxt("Показывать столбцы") + ":")],[['css','fontSize','12px'],['css','margin','7px 0px 3px 1px']])])
    
    var attrTitles = attributesTable.tableFields.fieldsAsArray;
    if (!this._activeColumns)
    {
        this._activeColumns = {};
        
        for (var i = 0; i < attrTitles.length; ++i)
            this._activeColumns[attrTitles[i]] = true;
    }

    var rowTemplate = 
        '<label title="{{name}}" class="attrs-table-active-row">' + 
            '<input type="checkbox" class="box attrs-table-active-checkbox" {{#active}}checked{{/active}}></input>' +
            '{{name}}' + 
        '</label>';
        
    attrTitles.forEach(function(columnName) {
        var rowUI = $(Handlebars.compile(rowTemplate)({
            active: _this._activeColumns[columnName],
            name: columnName
        })).appendTo(columnsList);
        
        $('input', rowUI).click(function() {
            _this._activeColumns[columnName] = this.checked;
            $(_this).trigger('columnsChange');
        })
    });
    
    
    _(container, [columnsList]);
    
    searchButton.style.marginRight = '17px';
    cleanButton.style.marginRight = '3px';
    _(container, [_div([cleanButton, searchButton],[['css','textAlign','right'],['css','margin','5px 0px 0px 0px'],['css','width',paramsWidth + 'px']])]);
};
    
DefaultSearchParamsManager.prototype.getQuery = function() {
    return this._queryTextarea && this._queryTextarea.value;
}
    
DefaultSearchParamsManager.prototype.getActiveColumns = function() {
    return this._activeColumns;
}
    
DefaultSearchParamsManager.prototype.resize = function(dims) {
    if (this._columnsList) {
        var container = this._container,
            height = dims.height - container.childNodes[0].offsetHeight - container.childNodes[1].offsetHeight - 25 + 'px';
        // $(this._container).find('.attr-table-columns-container')[0].style.height = height;
        $(this._container).find('.attrsColumnsList')[0].style.height = height;
    }
}

nsGmx.AttrTable.DefaultSearchParamsManager = DefaultSearchParamsManager;

})(nsGmx.Utils._);