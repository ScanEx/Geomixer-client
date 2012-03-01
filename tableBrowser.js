var tableBrowser = function()
{
	this.parentCanvas = null;
	
	this.sortFuncs = 
	{
		name:[
			function(_a,_b){var a = String(_a).toLowerCase(), b = String(_b).toLowerCase(); if (a > b) return 1; else if (a < b) return -1; else return 0},
			function(_a,_b){var a = String(_a).toLowerCase(), b = String(_b).toLowerCase(); if (a < b) return 1; else if (a > b) return -1; else return 0}
		]
	};
		
	this.currentSortType = 'name';
	this.currentSortIndex = 
	{
		name: 0
	};
	
	this.tables = [];
}

tableBrowser.prototype.createBrowser = function(closeFunc)
{
	if ($$('tableBrowserDialog'))
	{
		$($$('tableBrowserDialog').parentNode).dialog("destroy");
		
		$$('tableBrowserDialog').parentNode.removeNode(true);
	}
	
	var canvas = _div(null, [['attr','id','tableBrowserDialog']]);
	
	showDialog(_gtxt("Список таблиц"), canvas, 300, 300, false, false);
	
	this.parentCanvas = canvas;
	this.closeFunc = closeFunc;
	
	if (!this.tables.length)
		this.loadInfo();
	else
		this.loadInfoHandler(this.tables)
}

tableBrowser.prototype.close = function(name)
{
	this.closeFunc(name);
	
	var canvas = $$('tableBrowserDialog');
	
	$(canvas.parentNode).dialog("destroy");
	
	canvas.parentNode.removeNode(true);
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
	
	this.currentSortFunc = this.sortFuncs['name'][0];
	
	this.tablesCanvas = _div(null, [['dir','className','fileCanvas']]);	
	
	_(this.parentCanvas, [this.tablesCanvas]);
	
	this.reloadTables();
}

tableBrowser.prototype.reloadTables = function()
{
	removeChilds(this.tablesCanvas)
	
	_(this.tablesCanvas, [this.draw()]);
}

tableBrowser.prototype.draw = function()
{
	var nameSort = makeLinkButton(_gtxt("Имя")),
		trs = [],
		_this = this;
	
	nameSort.sortType = 'name';
	
	nameSort.onclick = function()
	{
		_this.currentSortType = this.sortType;
		_this.currentSortIndex[_this.currentSortType] = 1 - _this.currentSortIndex[_this.currentSortType];
		
		_this.reloadTables();
	}
	
	this.tables = this.tables.sort(this.getCurrentSortFunc());
	
	for (var i = 0; i < this.tables.length; i++)
	{
		var	tdName = _td([_t(this.tables[i])],[['css','fontSize','12px']]),
			returnButton = makeImageButton("img/choose.png", "img/choose_a.png"),
			tr = _tr([_td([returnButton]), tdName]);
		
		returnButton.style.cursor = 'pointer';
		returnButton.style.marginLeft = '5px';
	
		_title(returnButton, _gtxt("Выбрать"));
			
		(function(i){
			returnButton.onclick = function()
			{
				_this.close(_this.tables[i]);
			}
		})(i);
		
		attachEffects(tr, 'hover')
		
		trs.push(tr)
	}
	
	return _table([_thead([_tr([_td(null, [['css','width','25px']]),_td([nameSort], [['css','textAlign','left']])])]), _tbody(trs)], [['css','width','100%']]);
}

tableBrowser.prototype.getCurrentSortFunc = function()
{
	return this.sortFuncs[this.currentSortType][this.currentSortIndex[this.currentSortType]];
}

var _tableBrowser = new tableBrowser();