var userObjects = function()
{
	this.data = {};
}

userObjects.prototype.collect = function()
{
	this.collectWFS();
	this.collectWMS();
	this.collectTabs();
	this.collectExternalMaps();
    this.collectMapPlugins();
}

userObjects.prototype.load = function()
{
	this.loadWFS();
	this.loadWMS();
	this.loadTabs();
	this.loadExternalMaps();
    this.loadMapPlugins();
}

userObjects.prototype.collectTabs = function()
{
	if (!_queryTabs.tabs.length)
		return;
	
	var tabs = [];
	
	for (var i = 0; i < _queryTabs.tabs.length; i++)
	{
		var tab = {};
		
		$.extend(tab, _queryTabs.tabs[i]);
		
		tabs.push(tab);
	}
	
	this.data['tabs'] = tabs;
}
userObjects.prototype.loadTabs = function()
{
	if (!this.data['tabs'] || !this.data['tabs'].length)
		return;
	
	if ($$('left_mapTabs'))
		$$('left_mapTabs').removeNode(true);
	
	_queryTabs.builded = false;
	_queryTabs.tabs = this.data['tabs'];
	
	mapHelp.tabs.load('mapTabs');
}
userObjects.prototype.collectWMS = function()
{
	if (!_queryServerDataWMS.workCanvas)
		return;
	
	var value = {};
	
	$(_queryServerDataWMS.workCanvas.lastChild).children("ul[url]").each(function()
	{
		var url = this.getAttribute('url');
		
		$(this).find("input[type='checkbox']").each(function()
		{
			if (this.checked)
			{
				if (!value[url])
					value[url] = {};
				
				value[url][this.getAttribute('layerName')] = true;
			}
		})
	})
	
	if (!objLength(value))
	{
		if (this.data['wms'])
			delete this.data['wms'];
		
		return;
	}
	
	this.data['wms'] = value;
}
userObjects.prototype.loadWMS = function()
{
	if (!this.data['wms'])
		return;

	if ($$('left_wms'))
		$$('left_wms').removeNode(true);
	
	_queryServerDataWMS.builded = false;
	
	loadServerData.WMS.load('wms');
	
	for (var url in this.data['wms'])
	{
		(function(loadParams)
		{
			_queryServerDataWMS.getCapabilities(url, _queryServerDataWMS.parseWMSCapabilities, function(serviceLayers, url, replaceElem)
			{
				_queryServerDataWMS.drawWMS(serviceLayers, url, replaceElem, loadParams);
			})
		})(this.data['wms'][url])
	}
}
userObjects.prototype.collectWFS = function()
{
	if (!_queryServerDataWFS.workCanvas)
		return;
	
	var value = {};
	
	$(_queryServerDataWFS.workCanvas.lastChild).children("ul[url]").each(function()
	{
		var url = this.getAttribute('url');
		
		$(this).find("input[type='checkbox']").each(function()
		{
			if (this.checked)
			{
				var wfsLayerInfo = {};
				
				$(this.parentNode.lastChild).find(".colorIcon").each(function()
				{
					wfsLayerInfo[this.geometryType] = {RenderStyle: this.getStyle(), graphDataType: this.parentNode.graphDataType, graphDataProperties: this.parentNode.graphDataProperties}
				})
				
				if (!value[url])
					value[url] = {}
				
				value[url][this.getAttribute('layerName')] = {format: this.parentNode.lastChild.format, info: wfsLayerInfo};
			}
		})
	})
	
	if (!objLength(value))
	{
		if (this.data['wfs'])
			delete this.data['wfs'];
		
		return;
	}
	
	this.data['wfs'] = value;
}
userObjects.prototype.loadWFS = function()
{
	if (!this.data['wfs'])
		return;

	if ($$('left_wfs'))
		$$('left_wfs').removeNode(true);
	
	_queryServerDataWFS.builded = false;
	
	loadServerData.WFS.load('wfs');
	
	for (var url in this.data['wfs'])
	{
		(function(loadParams)
		{
			_queryServerDataWFS.getCapabilities(url, _queryServerDataWFS.parseWFSCapabilities, function(serviceLayers, url, replaceElem)
			{
				_queryServerDataWFS.drawWFS(serviceLayers, url, replaceElem, loadParams);
			})
		})(this.data['wfs'][url])
	}
}

userObjects.prototype.collectMapPlugins = function()
{
    if (_mapHelper.mapPlugins)
        this.data['mapPlugins'] = _mapHelper.mapPlugins;
}

userObjects.prototype.loadMapPlugins = function()
{
    if (this.data['mapPlugins'])
    {
        for (var p = 0; p < this.data['mapPlugins'].length; p++)
            nsGmx.pluginsManager.setUsePlugin(this.data['mapPlugins'][p], true);
        
        _mapHelper.mapPlugins = this.data['mapPlugins'];
    }
    else
    {
        _mapHelper.mapPlugins = [];
    }
}

userObjects.prototype.collectExternalMaps = function()
{
	if (!_queryExternalMaps.workCanvas)
		return;
	
	var value = [];
	
	$(_queryExternalMaps.workCanvas.lastChild).children("div").each(function()
	{
		value.push({hostName:this.hostName, mapName:this.mapName})
	})
	
	if (!value.length)
	{
		if (this.data['externalMaps'])
			delete this.data['externalMaps'];
		
		return;
	}
	
	this.data['externalMaps'] = value;
}
userObjects.prototype.loadExternalMaps = function()
{
	if (!this.data['externalMaps'] || !this.data['externalMaps'].length)
		return;
	
	if ($$('left_externalMaps'))
		$$('left_externalMaps').removeNode(true);
	
	_queryExternalMaps.builded = false;
	_queryExternalMaps.maps = this.data['externalMaps'];
	
	mapHelp.externalMaps.load('externalMaps');
}

var _userObjects = new userObjects();
