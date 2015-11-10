
_translationsHash.addtext("rus", {
                            "tableBrowser.title" : "Список таблиц",
                            "tableBrowser.filterText" : "Фильтр по названию"
                         });
                         
_translationsHash.addtext("eng", {
                            "tableBrowser.title" : "Tables list",
                            "tableBrowser.filterText" : "Filter by name"
                         });                         

var tableBrowser = function()
{
	this.sortFuncs = 
	{
		name:[
			function(_a,_b){var a = String(_a).toLowerCase(), b = String(_b).toLowerCase(); if (a > b) return 1; else if (a < b) return -1; else return 0},
			function(_a,_b){var a = String(_a).toLowerCase(), b = String(_b).toLowerCase(); if (a < b) return 1; else if (a > b) return -1; else return 0}
		]
	};
	
	this.tables = [];
}

tableBrowser.prototype.createBrowser = function(closeFunc)
{
    var canvas = $('#tableBrowserDialog');
    
	if (canvas)
	{
		canvas.parent().dialog("destroy");
		
		canvas.parent().remove();
	}
		
	this.closeFunc = closeFunc;
	
	if (!this.tables.length)
		this.loadInfo();
	else
		this.loadInfoHandler(this.tables)
}

tableBrowser.prototype.close = function(name)
{
	this.closeFunc(name);
	
	var canvas = $('#tableBrowserDialog');
	
	$(canvas).parent().dialog("destroy");
	
	$(canvas).parent().remove();
}

tableBrowser.prototype.loadInfo = function()
{
	sendCrossDomainJSONRequest(serverBase + "VectorLayer/GetGeometryTables.ashx?WrapStyle=func", function(response)
	{
		if (!parseResponse(response))
			return;
		
		_tableBrowser.loadInfoHandler(response.Result)
	})
}

tableBrowser.prototype.loadInfoHandler = function(tables)
{
	this.tables = tables;
    
    var _this = this;
    var renderTableRow = function(table)
    {
        var	tdName = _td([_t(table)],[['css','fontSize','12px']]),
			returnButton = makeImageButton("img/choose.png", "img/choose_a.png"),
			tr = _tr([_td([returnButton]), tdName], [['dir', 'className', 'tableTableRow']]);
		
		returnButton.style.cursor = 'pointer';
		returnButton.style.marginLeft = '5px';
	
		_title(returnButton, _gtxt("Выбрать"));
			
        returnButton.onclick = function()
        {
            _this.close(table);
        }
		
		attachEffects(tr, 'hover');
        
        for (var i = 0; i < tr.childNodes.length; i++)
            tr.childNodes[i].style.width = this._fields[i].width;
        
        return tr;
    }
    
    var sortFuncs = {};
    sortFuncs[_gtxt('Имя')] = this.sortFuncs['name'];
    
    var tableProvider = new nsGmx.ScrollTable.StaticDataProvider();
    tableProvider.setOriginalItems(this.tables);
    tableProvider.setSortFunctions(sortFuncs);
    
    var tableTable = new nsGmx.ScrollTable({limit:5000, pagesCount: 5, height: 220, showFooter: false});
    tableTable.setDataProvider(tableProvider);
    
    var tableParent = _div(null, [['dir', 'id', 'tableBrowserDialog']]);
    tableTable.createTable({
        parent: tableParent, 
        name: 'tableTable', 
        width: 0, 
        fields: ['', _gtxt('Имя')], 
        fieldsWidths: ['10%', '90%'], 
        sortableFields: sortFuncs,
        drawFunc: renderTableRow, 
        isWidthScroll: false
    });
    
    var filterInput = _input(null, [['css','width','150px'],['dir','className','selectStyle']]);
    $(tableParent).prepend(filterInput).prepend($('<span/>', {'class': 'tableFilter'}).text(_gtxt("tableBrowser.filterText") + ": "));
    tableProvider.attachFilterEvents(filterInput, 'Table', function(fieldName, fieldValue, vals)
    {
        return vals.filter(function(val) {
            return String(val).toLowerCase().indexOf(fieldValue.toLowerCase()) > -1;
        });
    });
    
    showDialog( _gtxt("tableBrowser.title"), tableParent, {width: 300, height: 300} );
}

var _tableBrowser = new tableBrowser();