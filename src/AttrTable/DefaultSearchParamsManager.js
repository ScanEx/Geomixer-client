!(function(_){

// events: queryChange, columnsChange
var DefaultSearchParamsManager = function() {
    this._activeColumns = null;
    this._queryTextarea = null;
    this._container = null;
}

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
    var attrsSuggest = _mapHelper.createSuggestCanvas(attrNames, this._queryTextarea, "\"suggest\"", function(){}, attrProvider, true),
        valuesSuggest = _mapHelper.createSuggestCanvas(attrNames, this._queryTextarea, "\"suggest\"", function(){}, attrProvider),
        opsSuggest = _mapHelper.createSuggestCanvas(['=','>','<','>=','<=','<>','AND','OR','NOT','CONTAINS','()'], this._queryTextarea, " suggest ", function(){});
        
    opsSuggest.style.width = '80px';
    $(opsSuggest).children().css('width','60px');
    
    var divAttr = _div([_t(_gtxt("Атрибут >")), attrsSuggest], [['dir','className','attrsHelperCanvas']]),
        divValue = _div([_t(_gtxt("Значение >")), valuesSuggest], [['dir','className','attrsHelperCanvas'],['css','marginLeft','10px']]),
        divOp = _div([_t(_gtxt("Операция >")), opsSuggest], [['dir','className','attrsHelperCanvas'],['css','marginLeft','10px']]),
        clickFunc = function(div)
        {
            if (document.selection)
            {
                _this._queryTextarea.focus();
                var sel = document.selection.createRange();
                div.sel = sel;
                _this._queryTextarea.blur();
            }
            
            $(divAttr.parentNode.parentNode.parentNode).find(".attrsHelperCanvas").children("[arr]").fadeOut(300, function()
            {
                $(this).remove();
            })
        };

    divAttr.onclick = function()
    {
        clickFunc(attrsSuggest);
        
        $(attrsSuggest).fadeIn(300);
        $(valuesSuggest).fadeOut(300);
        $(opsSuggest).fadeOut(300);
        
        return true;
    }
    
    divValue.onclick = function()
    {
        clickFunc(valuesSuggest);
        
        $(valuesSuggest).fadeIn(300);
        $(attrsSuggest).fadeOut(300);
        $(opsSuggest).fadeOut(300);
        
        return true;
    }
    
    divOp.onclick = function()
    {
        clickFunc(opsSuggest);
        
        $(opsSuggest).fadeIn(300);
        $(attrsSuggest).fadeOut(300);
        $(valuesSuggest).fadeOut(300);
        
        return true;
    }
    
    this._queryTextarea.onclick = function()
    {
        $(attrsSuggest).fadeOut(300);
        $(valuesSuggest).fadeOut(300);
        $(opsSuggest).fadeOut(300);
        
        if (divAttr.childNodes.length > 2)
            divAttr.lastChild.removeNode(true);
        if (divValue.childNodes.length > 2)
            divValue.lastChild.removeNode(true);
        
        return true;
    }
    
    var suggestCanvas = _table([_tbody([_tr([_td([_div([divAttr],[['css','position','relative']])]),
                                             _td([_div([divValue],[['css','position','relative']])]),
                                             _td([_div([divOp],[['css','position','relative']])])])])],[['css','margin','0px 3px']]);
    _(container, [_div([_div([_t(_gtxt("SQL-условие WHERE"))],[['css','fontSize','12px'],['css','margin','7px 0px 3px 1px']]), this._queryTextarea, suggestCanvas],[['attr','filterTable',true]])])
    
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
        $(this._container).find('.attrsColumnsList')[0].style.height = height;
    }
}

nsGmx.AttrTable.DefaultSearchParamsManager = DefaultSearchParamsManager;

})(nsGmx.Utils._);