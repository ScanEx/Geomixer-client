var nsGmx = nsGmx || {};

(function($){

/** Управляет видимостью слоёв в зависимости от диапазона дат. 
    Может фильтровать слои только из определённой группы. Работает только с вьюером. Поддерживает фильтрацию в доп. картах.
	@memberOf cover
	@class 
*/
var LayerFiltersControl = function()
{
	var _calendar = null;
	var _groupTitle = null;
	var _layers = null;
	var _map = null;
	
	//по умолчанию слои фильтруются по дате
	var _defaultFilterFunc = function(layer, dateBegin, dateEnd)
	{
		var layerDate = $.datepicker.parseDate('dd.mm.yy', layer.properties.date);
		return dateBegin <= layerDate && layerDate <= dateEnd;
	}
	
	var _filterFunc = _defaultFilterFunc;
	
	var _IterateElems = function(treeElem, callback, parentVisible)
	{
		var visible = parentVisible && (treeElem.content ? treeElem.content.properties.visible : true);
		var childsArr = treeElem.content ? treeElem.content.children : treeElem.children;
		
		for (var i = 0; i < childsArr.length; i++)
		{
			var child = childsArr[i];
			
			if (child.type == 'group')
			{
				callback(child, visible);
				
				_IterateElems(child, callback, visible)
			}
			else
				callback(child, visible);
		}
	}
	
	var _getMapLayersAsHash = function()
	{
		var res = {};
		for (var l = 0;l < _map.layers.length; l++)
			res[_map.layers[l].properties.name] = _map.layers[l];
			
		return res;
	}
	
	var _update = function()
	{
		if (typeof _queryExternalMaps.mapsCanvas != 'undefined')
		{
			for (var m = 0; m < _queryExternalMaps.mapsCanvas.childNodes.length; m++)
			{
				var mapElem = _queryExternalMaps.mapsCanvas.childNodes[m].childNodes[0];
				if (mapElem.extLayersTree)
					_updateTree(mapElem.extLayersTree, mapElem.extLayersTree._mapTree, mapElem);
			}
		}
		
		_updateTree(_layersTree, _layersTree._mapTree, _queryMapLayers.buildedTree);
	}
	
	var _updateTree = function(layersTree, mapTree, domTreeRoot)
	{
		var dateBegin = _calendar.getDateBegin();
		var dateEnd = _calendar.getDateEnd();
		
		var layers = [];
		
		if (_layers)
			layers = nsMapCommon.selectLayersFromTree(_map, mapTree, _layers).asHash();
		else 
			layers = _groupTitle ? nsMapCommon.selectLayersFromTree(_map, mapTree, [{group: _groupTitle}]).asHash() : _getMapLayersAsHash();
		
		_IterateElems( mapTree, function(elem, parentVisible)
		{
			if (elem.content.properties.name in layers)
			{
				var isShowLayer = _filterFunc( layers[elem.content.properties.name], dateBegin, dateEnd );
                layersTree.treeModel.setNodeVisibility(elem, isShowLayer);
			}
		}, true);
	}
	
	/**
	 * @function Инициализитует фильтрацию слоёв. Далее классом будут отслеживаться события календарика.
	 * @param map Основная карта
	 * @param {cover.Calendar} calendar Календарик, который используется для задания дат
	 * @param {Object} params Дополнительные параметры: <br/>
	 *    groupTitle - имя группы, слои в которой нужно фильтровать. Устарело, используйте layers <br/>
	 *    layers - вектор из имён слоёв или указаний на группу, которые нужно фильтровать. Если не задано, будут фильтроваться все слои на карте.<br/>
	 *    filterFunc - ф-ция filterFunc(layer, dateBegin, dateEnd) -> Bool. Возвращает true, если слой нужно показать, false чтобы скрыть. По умолчанию происходит фильтрация по дате слоя.
	 */
	this.init = function(map, calendar, params)
	{
		_map = map;
		
		if ( typeof params != 'undefined' )
		{
			_groupTitle = params.groupTitle;
			_layers = params.layers;
			if (params.filterFunc) 
				_filterFunc = params.filterFunc;
		}
		
		if (_calendar)
			$(_calendar).unbind('change', _update);
			
		_calendar = calendar;
		$(_calendar).bind('change', _update);
		_update();
		
		$(_queryExternalMaps).bind('map_loaded', _update);
	}
	
	this.update = function() { _update() };
}

if ( typeof gmxCore !== 'undefined' )
{
	gmxCore.addModule('LayerFiltersControl', {
		LayerFiltersControl: LayerFiltersControl
	});
}

nsGmx.LayerFiltersControl = LayerFiltersControl;

})(jQuery);