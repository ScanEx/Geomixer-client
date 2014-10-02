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
		this.tabsCanvas = _div(null, [['dir','className','tabsCanvas']])
		
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
    var uiTemplate = 
        '<div class = "addtabs-container">' +
            '<div class = "addtabs-info">{{i Название}}</div>' + 
            '<input class = "addtabs-title-input inputStyle"><br>' + 
            '<div class = "addtabs-info">{{i Описание}}</div>' + 
            '<textarea class = "addtabs-title-description inputStyle"></textarea><br>' + 
            '<button class = "addtabs-create">{{i Создать}}</button>' +
        '</div>';
        
    var ui = $(Mustache.render(uiTemplate)),
        titleInput = $('.addtabs-title-input', ui);
    
    titleInput.keyup(function(e) {
        if (this.value == '')
			$(this).addClass('error');
		else
			$(this).removeClass('error');
		
	  	if (e.keyCode == 13) 
	  	{	
			createTab();
	  		
	  		return false;
	  	}
		
		return true;
    })
             
	var createTab = function() {
            var mapState = _mapHelper.getMapState(),
                tab = {
                    name: titleInput.val(),
                    description: $('.addtabs-title-description', ui).val(),
                    state: mapState
                };
            
            _this.tabs.push(tab);
            _this.draw(tab);
            
            removeDialog(dialogDiv);
        },
        _this = this;
	
    $('.addtabs-create', ui).click(createTab);
	
	var dialogDiv = showDialog(_gtxt("Имя закладки"), ui[0], 280, 210, false, false)
}

queryTabs.prototype.draw = function(tabInfo)
{
    var tmpl = '<div class="canvas"><div class="buttonLink tabName">{{name}}</div><div class="gmx-icon-close"></div>';
    var canvas = $(Mustache.render(tmpl, {name: tabInfo.name}))[0];

    var _this = this;

	canvas.tabInfo = tabInfo;
	
    $('.tabName', canvas).click(function() {
	    if (tabInfo.description) {
	        title.title = tabInfo.description;
	    }
		_this.show(tabInfo.state)
	})
	
    $('.gmx-icon-close', canvas).click(function() {
		var index = getOwnChildNumber(canvas);
		
		_this.tabs.splice(index, 1);
		
		canvas.removeNode(true);
	})
    
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
	globalFlashMap.setMode(parsedState.mode);
	
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
    
    if ( typeof parsedState.customParamsCollection != 'undefined')
        _mapHelper.customParamsManager.loadParams(parsedState.customParamsCollection);
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