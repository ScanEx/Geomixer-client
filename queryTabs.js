//Отображение закладок карты в левой панели

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
		this.tabsCanvas = _div(null, [['dir','className','drawingObjectsCanvas']])
		
		_(this.workCanvas, [this.tabsCanvas]);
		
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
	}
}

queryTabs.prototype.add = function()
{
	var inputTab = _input(null,[['dir','className','inputStyle'],['css','width','240px']]),
		create = makeButton(_gtxt('Создать')),
		createTab = function()
		{
			var mapState = _mapHelper.getMapState(),
				tab = {name:inputTab.value, state:mapState};
			
			_this.tabs.push(tab);
			
			_this.draw(tab);
			
			removeDialog(inputTab.parentNode.parentNode)
		},
		_this = this;
	
	create.onclick = createTab;
	
	inputTab.onkeyup = function(e)
	{
		if (this.value == '')
			$(this).addClass('error');
		else
			$(this).removeClass('error');
		
		var evt = e || window.event;
	  	if (getkey(evt) == 13) 
	  	{	
			createTab();
	  		
	  		return false;
	  	}
		
		return true;
	}
	
	showDialog(_gtxt("Имя закладки"), _div([inputTab, _br(), create],[['css','textAlign','center']]), 280, 100, false, false)
}

queryTabs.prototype.draw = function(tabInfo)
{
	var canvas = _div(null, [['dir','className','canvas']]),
		title = makeLinkButton(tabInfo.name),
		remove = makeImageButton('img/closemin.png','img/close_orange.png'),
		_this = this;
		
	canvas.tabInfo = tabInfo;
	
	title.onclick = function()
	{
		_this.show(tabInfo.state)
	}
	
	title.style.marginLeft = '5px';
	
	remove.onclick = function()
	{
		var index = getOwnChildNumber(canvas);
		
		_this.tabs.splice(index, 1);
		
		canvas.removeNode(true);
	}
	
	remove.className = 'remove';
	
	_(canvas, [_div([title], [['dir','className','item']]), remove])
	
	_(this.tabsCanvas, [canvas]);
}

queryTabs.prototype.show = function(state)
{
	var parsedState = {};
	$.extend(true, parsedState, state)
	
	parsedState.position.x = from_merc_x(state.position.x);
	parsedState.position.y = from_merc_y(state.position.y);
	parsedState.position.z = 17 - state.position.z;
	
	if (state.drawnObjects.length)
	{
		for (var i = 0; i < state.drawnObjects.length; i++)
		{
			parsedState.drawnObjects[i].geometry = from_merc_geometry(state.drawnObjects[i].geometry);
			parsedState.drawnObjects[i].color = state.drawnObjects[i].color || '0000ff';
		}
	}
	
	globalFlashMap.moveTo(parsedState.position.x, parsedState.position.y, parsedState.position.z);
	globalFlashMap.setBaseLayer(parsedState.mode);
	
	globalFlashMap.drawing.forEachObject(function(obj)
	{
		obj.remove();
	})
	
	for (var i = 0; i < parsedState.drawnObjects.length; i++)
	{
		var color = parsedState.drawnObjects[i].color || 0x0000FF,
			thickness = parsedState.drawnObjects[i].thickness || 3,
			opacity = parsedState.drawnObjects[i].opacity || 80,
			elem = globalFlashMap.drawing.addObject(parsedState.drawnObjects[i].geometry, parsedState.drawnObjects[i].properties),
			style = {outline: {color: color, thickness: thickness, opacity: opacity }, marker: { size: 3 }, fill: { color: 0xffffff }};
		
		elem.setStyle(style, {outline: {color: color, thickness: thickness + 1, opacity: Math.min(100, opacity + 20)}, marker: { size: 4 }, fill: { color: 0xffffff }});
	}
	
	_queryMapLayers.applyState(parsedState.condition, parsedState.mapStyles);
}

var _queryTabs = new queryTabs();

_userObjects.addDataCollector('tabs', {
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
	
        if ($$('left_mapTabs'))
            $$('left_mapTabs').removeNode(true);
        
        _queryTabs.builded = false;
        _queryTabs.tabs = data;
        
        mapHelp.tabs.load('mapTabs');
    }
})