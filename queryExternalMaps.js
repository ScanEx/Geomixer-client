//Загрузка и отображение дополнительных карт в левой панели
!(function(_) {

var queryExternalMaps = function()
{
	this.maps = [];
	this.loadedMaps = {};
}

queryExternalMaps.prototype = new leftMenu();

queryExternalMaps.prototype.load = function()
{
	if (!this.builded)
	{
		var hostButton = _input(null, [['dir','className','inputStyle'],['css','width','200px']]),
			nameButton = _input(null, [['dir','className','inputStyle'],['css','width','200px']]),
			loadButton = makeButton(_gtxt("Загрузить")),
			addMap = makeLinkButton(_gtxt("Добавить карту")),
			paramsTable = _table([_tbody([_tr([_td([_t(_gtxt("Хост"))],[['css','colSpan',2],['css','paddingTop','3px']])]),
											_tr([_td([hostButton]), _td()]),
											_tr([_td([_t(_gtxt("Имя"))],[['css','colSpan',2]])]),
											_tr([_td([nameButton]), _td([loadButton])])])],[['css','margin','3px 0px 0px 10px']]),
			_this = this;

		_(this.workCanvas, [_div([addMap],[['css','margin','5px 0px 5px 10px']]), paramsTable]);

		paramsTable.style.display = 'none';

		hostButton.value = window.serverBase;

		addMap.onclick = function()
		{
			if (paramsTable.style.display == 'none')
				paramsTable.style.display = '';
			else
				paramsTable.style.display = 'none';
		}

		loadButton.onclick = function()
		{
			if (hostButton.value == '')
				inputError(hostButton);

			if (nameButton.value == '')
				inputError(nameButton);

			if (hostButton.value == '' || nameButton.value == '')
				return;

			_this.addMapElem(hostButton.value, nameButton.value);

			nameButton.value = '';
		}

		this.mapsCanvas = _div(null,[['dir','className','drawingObjectsCanvas externalMapsCanvas'],['css','paddingLeft','0px'], ['attr', 'id', 'externalMapsCanvas']]);

		_(this.workCanvas, [this.mapsCanvas]);

		this.builded = true;

		for (var i = 0; i < this.maps.length; ++i)
			this.addMapElem(this.maps[i].hostName, this.maps[i].mapName, true);
	}
}

queryExternalMaps.prototype.addMapElem = function(hostName, mapName, silent)
{
    this.createWorkCanvas('externalMaps');
    this.load();

	var mapElem = _div(),
		div = _div(null, [['css','position','relative'],['css','margin','2px 0px 2px 14px']]),
		remove = $('<div class="gmx-icon-close"></div>'),
        mapInfo,
        _this = this;

    for (var i = 0; i < this.maps.length; i++) {
        var map = this.maps[i];
        if (map.hostName === hostName && map.mapName === mapName) {
            if (map.container) {
                return;
            }
            mapInfo = map;
            break;
        }
    }

    if (!mapInfo) {
        mapInfo = {
            hostName: hostName,
            mapName: mapName
        }
        this.maps.push(mapInfo);
    }

    mapInfo.container = div

	div.hostName = hostName;
	div.mapName = mapName;

	_(div, [mapElem, remove[0]]);
	_(this.mapsCanvas, [div]);

	this.addMap(hostName, mapName, mapElem, silent);

	remove.click(function()
	{
		div.removeNode(true);

		if (!mapElem.extLayersTree)
			return;

		mapElem.extLayersTree.treeModel.forEachLayer(function(layer, isVisible)
		{
			var name = layer.properties.name;

			if (nsGmx.layersByID[name].external)
				_queryMapLayers.removeLayer(name);
		});

        for (var i = 0; i < _this.maps.length; i++) {
            var map = _this.maps[i];
            if (map.hostName === hostName && map.mapName === mapName) {
                _this.maps.splice(i, 1);
                break;
            }
        }
	})
}

queryExternalMaps.prototype.addMap = function(hostName, mapName, parent, silent)
{
	var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px'],['css','width','16px'],['css','height','16px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]),
		_this = this;

	_(parent, [loading]);

	this.loadMap(hostName, mapName, function(gmxMap)
	{
		if (gmxMap == null)
		{
			loading.parentNode.parentNode.removeNode(true);

			silent || showErrorMessage(_gtxt("Невозможно загрузить карту [value0] с домена [value1]", mapName, hostName), true);

			return;
		}

        var extLayersTree = new layersTree({showVisibilityCheckbox: true, allowActive: false, allowDblClick: true});

		var	tree = extLayersTree.drawTree(gmxMap.rawTree, 2);
		$(tree).treeview();
		extLayersTree.runLoadingFuncs();

		loading.removeNode(true);
		_(parent, [tree]);

        //добавляем перетаскивание в основную карту только если доп. карта с того же домена
        if ( hostName === _layersTree.treeModel.getMapProperties().hostName )
            _queryMapLayers.addDraggable(parent);

		parent.extLayersTree = extLayersTree;
	});
}

queryExternalMaps.prototype.loadMap = function(hostName, mapName, callback)
{
    var _this = this;
	L.gmx.loadMap(mapName, {
        hostName: hostName,
        leafletMap: nsGmx.leafletMap,
        apiKey: window.apiKey,
        srs: nsGmx.leafletMap.options.srs || '',
        isGeneralized: window.mapOptions && 'isGeneralized' in window.mapOptions ? window.mapOptions.isGeneralized : true,
        skipTiles: nsGmx.leafletMap.options.skipTiles || ''
    }).then(function(gmxMap)
	{
        for (var i = 0; i < gmxMap.layers.length; i++) {
            var layer = gmxMap.layers[i];
            var id = layer.getGmxProperties().name;

            layer.external = true;

            if (!(id in nsGmx.gmxMap.layersByID)) {
                nsGmx.gmxMap.addLayer(layer);
            }
        }

        if (gmxMap.properties.Copyright)
        {
            var copyrightLayer = {
                options: {
                    attribution: gmxMap.properties.Copyright
                },
                onAdd: function() {},
                onRemove: function() {}
            }

            copyrightLayer.addTo(nsGmx.leafletMap);
        }

        gmxMap.properties.hostName = hostName;

        callback(gmxMap);
        $(_queryExternalMaps).triggerHandler('map_loaded', gmxMap);

        for (var i = 0; i < _this.maps.length; i++) {
            var map = _this.maps[i];
            if (map.hostName === hostName && map.mapName === mapName) {
                map.tree = layers;
                break;
            }
        }
	},
	function()
	{
		callback(null);
		$(_queryExternalMaps).triggerHandler('map_loaded', null);
	});
}

var _queryExternalMaps = new queryExternalMaps();
window._queryExternalMaps = _queryExternalMaps;

nsGmx.userObjectsManager.addDataCollector('externalMaps', {
    collect: function()
    {
        if (!_queryExternalMaps.workCanvas)
            return;

        var value = [];

        $(_queryExternalMaps.workCanvas.lastChild).children("div").each(function()
        {
            value.push({hostName:this.hostName, mapName:this.mapName})
        })

        if (!value.length)
            return null;

        return value;
    },
    load: function(data)
    {
        if (!data || !data.length)
            return;

        $('#left_externalMaps').remove();

        _queryExternalMaps.builded = false;
        _queryExternalMaps.maps = data;

        mapHelp.externalMaps.load('externalMaps');
    }
});

})(nsGmx.Utils._);
