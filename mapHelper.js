var mapHelp =
{
	mapHelp: {},
	serviceHelp: {},
	tabs: {},
	externalMaps : {}
}


var mapHelper = function()
{
	this.builded = false;
	
	this.defaultStyles = 
	{
		'point':{outline:{color:0x0000FF, thickness:1},marker:{size:3}, fill:{color:0xFFFFFF, opacity:20}},
		'linestring':{outline:{color:0x0000FF, thickness:1}},
		'polygon':{outline:{color:0x0000FF, thickness:1}, fill:{color:0xFFFFFF, opacity:20}}
	}
	
	this.stylesDialogsHash = {};
	this.drawingDialogsHash = {};
	
	this.layerEditorsHash = {};
	this.groupEditorsHash = {};
	this.mapEditorsHash = {};
	
	this.attrValues = {};
	
	this.asyncTasks = {};
	
	// контролирует пользовательские объекты, которые являются редактируемыми контурами растровых слоёв.
	// все такие объекты не будут сериализоваться
	this.drawingBorders = (function()
	{
		var _borders = {};
	
		//не будем сериализовать все пользовательские объекты, являющиеся контурами слоёв, так как это временные объекты
		nsGmx.DrawingObjectCustomControllers.addDelegate({
			isSerializable: function(obj)
			{
				for (var name in _borders)
					if (_borders[name] === obj) 
						return false;
				
				return true;
			}
		});

		return {
			set: function(name, obj)
			{
				_borders[name] = obj;
			},
			get: function(name)
			{
				return _borders[name];
			},
			length: function()
			{
				return objLength(_borders);
			},
			
			//callback(name, obj)
			forEach: function(callback)
			{
				for (var name in _borders)
					callback(name, _borders[name]);
			},
			
			updateBorder: function(name, span)
			{
				if (!_borders[name])
					return;
				
				if (span)
				{
					_(span, [_t(prettifyArea(geoArea(_borders[name].geometry.coordinates)))])
					
					return;
				}
				
				if (!$$('drawingBorderDescr' + name))
					return;
				
				removeChilds($$('drawingBorderDescr' + name));
				
				_($$('drawingBorderDescr' + name), [_t(prettifyArea(geoArea(_borders[name].geometry.coordinates)))])
			}, 
			
			//Удаляет объект из списка контуров слоя
			//?removeDrawring {bool, default: false} - удалять ли сам пользовательский объект
			removeRoute: function(name, removeDrawing)
			{
				if (!(name in _borders))
					return;
					
				if (typeof removeDrawing !== 'undefined' && removeDrawing)
					_borders[name].remove();
				
				delete _borders[name];
				
				if ($$('drawingBorderDescr' + name))
					removeChilds($$('drawingBorderDescr' + name));
			}
		}
	})();
	
	this.unsavedChanges = false;
	
}

mapHelper.prototype = new leftMenu();

// Менеджер кастомных параметров карты. 
// Содержит набор провайдеров доп. параметров, которые могут сохранять и загружать данные из хранилища параметров
// Данные загружаются один раз. Возможна асинхронная загрузка данных/добавление провайдеров.
// Порядок вызова провайдеров не определён
mapHelper.prototype.customParamsManager = (function()
{
	var _providers = []; 
	var _params = []; //хранит параметры, которые не были загружены провайдерами
	
	var loadProviderState = function( provider )
	{
		if ( provider.name in _params && typeof provider.loadState !== 'undefined')
		{
			provider.loadState( _params[ provider.name ] );
			delete _params[ provider.name ];
		}
	}
	
	return {
		saveParams: function()
		{
			if ( !_providers.length ) return;
			var params = {};
			for (var p = 0; p < _providers.length; p++ )
			{
				if (typeof _providers[p].saveState !== 'undefined')
				params[_providers[p].name] = _providers[p].saveState();
			}
				
			return params;
		},
		loadParams: function(params)
		{
			_params = params;
			for (var p = 0; p < _providers.length; p++ )
				loadProviderState( _providers[p] );
		},
		
		//интерфейс провайдера: name, saveState(), loadState(state)
		addProvider: function(provider)
		{
			_providers.push( provider );
			loadProviderState( provider );
		}
	}
})();

mapHelper.prototype.updateUnloadEvent = function(flag)
{
	if (typeof flag != 'undefined')
		this.unsavedChanges = flag;
	
	if (this.unsavedChanges)
	{
		window.onbeforeunload = function(e)
		{
			return _gtxt("В дереве слоев остались несохраненные изменения!");
		}
	}
	else
		window.onbeforeunload = null;
}

mapHelper.prototype.forEachMyLayer = function(callback)
{
	forEachLayer(this.mapTree, function(layer)
	{
		callback(globalFlashMap.layers[layer.properties.name]);
	});
}

mapHelper.prototype.getMapBounds = function()
{
	var x = globalFlashMap.getX(), y = globalFlashMap.getY(), z = globalFlashMap.getZ(),
		scale = Math.pow(2, -z) * 156543.033928041,
		w = $$('flash').clientWidth,
		h = $$('flash').clientHeight,
		wGeo = w * scale,
		hGeo = h * scale;
	
	var top = from_merc_y(merc_y(y) + hGeo/2),
		bottom = from_merc_y(merc_y(y) - hGeo/2),
		left = from_merc_x(merc_x(x) - wGeo/2),
		right = from_merc_x(merc_x(x) + wGeo/2);
	
	top = Math.min(top, 90);
	bottom = Math.max(bottom, -90);
	left = Math.max(left, -180);
	right = Math.min(right, 180);
	
	return {top: top, left: left, bottom: bottom, right: right, width: w, height: h}
}

mapHelper.prototype.convertColor = function(intColor)
{
	var r,g,b;
	
	b = (intColor % 256).toString(16);
	if (b.length == 1)
		b = '0' + b;
	
	intColor = Math.floor(intColor / 256);
	g = (intColor % 256).toString(16);
	if (g.length == 1)
		g = '0' + g;
	
	intColor = Math.floor(intColor / 256);
	r = (intColor % 256).toString(16);
	if (r.length == 1)
		r = '0' + r;
	
	return '#' + r + g + b;
}

mapHelper.prototype.setMapStyle = function(parentObject, templateStyle)
{
	if (templateStyle.marker && typeof templateStyle.marker.image != 'undefined')
	{
		try
		{
			parentObject.setStyle(templateStyle);
		}
		catch(e)
		{
		}
	}
	else
	{
		var hoverStyle = {};
		$.extend(true, hoverStyle, templateStyle);
		
		if (templateStyle.outline && typeof templateStyle.outline.thickness != 'undefined')
			hoverStyle.outline.thickness = Number(templateStyle.outline.thickness) + 1;
		
		if (templateStyle.fill && typeof templateStyle.fill.opacity != 'undefined')
			hoverStyle.fill.opacity = Math.min(Number(templateStyle.fill.opacity + 20), 100);
		
		parentObject.setStyle(templateStyle, hoverStyle);
	}
}

mapHelper.prototype.setBalloon = function(filter, template)
{
	filter.enableHoverBalloon(function(o)
	{
		return template.replace(/\[([a-zA-Z0-9_а-яА-Я ]+)\]/g, function()
		{
			var key = arguments[1];
			if (key == "SUMMARY")
				return o.getGeometrySummary();
			else
				return o.properties[key];
		});
	});
}

mapHelper.prototype.updateMapStyles = function(newStyles, name, newProperties)
{
	// удалим старые фильтры
	for (var i = 0; i < globalFlashMap.layers[name].filters.length; i++)
	{
		globalFlashMap.layers[name].filters[i].remove();
	}
	
	globalFlashMap.layers[name].filters = [];
	
	// добавим новые
	for (var i = 0; i < newStyles.length; i++)
	{
		var newFilter = globalFlashMap.layers[name].addObject();
		
		if (newStyles[i].Filter)
			newFilter.setFilter(newStyles[i].Filter);
		else
			newFilter.setFilter();
		
		globalFlashMap.balloonClassObject.setBalloonFromParams(newFilter, newStyles[i]);
		// if (typeof newStyles[i].BalloonEnable == 'undefined' || newStyles[i].BalloonEnable)
		// {
			// if (newStyles[i].Balloon)
				// this.setBalloon(newFilter, newStyles[i].Balloon);
			// else
				// newFilter.enableHoverBalloon();
		// }
		// else
			// newFilter.disableHoverBalloon();
		
		newFilter.setStyle(newStyles[i].RenderStyle);
		
		newFilter.setZoomBounds(Number(newStyles[i].MinZoom), Number(newStyles[i].MaxZoom));
		
		globalFlashMap.layers[name].filters.push(newFilter);
	}
	
	var properties = typeof newProperties == 'undefined' ? globalFlashMap.layers[name].properties : newProperties;
	
	if (properties.TiledQuicklook && properties.TiledQuicklookMinZoom && 
		!isNaN(Number(properties.TiledQuicklookMinZoom)) && Number(properties.TiledQuicklookMinZoom) > 0)
	{
		if (properties.TiledQuicklookMaxZoom && 
			!isNaN(Number(properties.TiledQuicklookMaxZoom)) && Number(properties.TiledQuicklookMaxZoom) > 0 &&
			Number(properties.TiledQuicklookMaxZoom) >= Number(properties.TiledQuicklookMinZoom))
		{
			globalFlashMap.layers[name].enableTiledQuicklooks(function(o)
			{
				return properties.TiledQuicklook.replace(/\[([a-zA-Z0-9_а-яА-Я ]+)\]/g, function()
				{
					return o.properties[arguments[1]];
				});
			}, Number(properties.TiledQuicklookMinZoom), Number(properties.TiledQuicklookMaxZoom));
		}
		else
		{
			globalFlashMap.layers[name].enableTiledQuicklooks(function(o)
			{
				return properties.TiledQuicklook.replace(/\[([a-zA-Z0-9_а-яА-Я ]+)\]/g, function()
				{
					return o.properties[arguments[1]];
				});
			}, Number(properties.TiledQuicklookMinZoom));
		}
	}
	
	if (properties.Quicklook)
	{
		globalFlashMap.layers[name].enableQuicklooks(function(o)
		{
			return properties.Quicklook.replace(/\[([a-zA-Z0-9_а-яА-Я ]+)\]/g, function()
			{
				return o.properties[arguments[1]];
			});
		});
	}
}

mapHelper.prototype.updateTreeStyles = function(newStyles, div)
{
	div.properties.content.properties.styles = newStyles;
	
	var multiStyleParent = $(div).children('[multiStyle]')[0];
	
	var parentIcon = $(div).children("[styleType]")[0],
		newIcon = _mapHelper.createStylesEditorIcon(newStyles, div.properties.content.properties.GeometryType.toLowerCase());
		newIcon.onclick = function()
		{
			_mapHelper.createLayerEditor(div, 1, div.properties.content.properties.styles.length > 1 ? -1 : 0);
		}
		
	$(parentIcon).replaceWith(newIcon);
	
	removeChilds(multiStyleParent);
	
	_mapHelper.createMultiStyle(div.properties.content.properties, multiStyleParent)
}

mapHelper.prototype.getLocalScale = function(x, y)
{
	return distVincenty(x, y, from_merc_x(merc_x(x) + 40), from_merc_y(merc_y(y) + 30))/50;
};

mapHelper.prototype.restoreTinyReference = function(id, callbackSuccess, errorCallback)
{
	window.suppressDefaultPermalink = true;
	sendCrossDomainJSONRequest(serverBase + "TinyReference/Get.ashx?id=" + id, function(response)
	{
		//если пермалинк не найден, сервер не возвращает ошибку, а просто пустой результат
		if ( !parseResponse(response) || !response.Result )
		{
			if (errorCallback) errorCallback();
			return;
		}
		
		var obj = JSON.parse(response.Result);
		
		if (obj.position)
		{
			obj.position.x = from_merc_x(obj.position.x);
			obj.position.y = from_merc_y(obj.position.y);
			obj.position.z = 17 - obj.position.z;
			if (obj.drawnObjects)
				for (var i in obj.drawnObjects)
				{
					obj.drawnObjects[i].geometry = from_merc_geometry(obj.drawnObjects[i].geometry);
					obj.drawnObjects[i].color = obj.drawnObjects[i].color || '0000ff';
				}
		}
		callbackSuccess(obj);
	});
}

mapHelper.prototype.addTinyReference = function()
{
	var a = _a([_img(null,[['attr','src','img/link.gif'],['css','margin','0px 3px -2px 0px']]),_t(_gtxt("Сохранить состояние карты"))],[['attr','href','javascript:void(0)']]),
		_this = this;
	
	a.onclick = function()
	{
		_this.showPermalink()
	}
		
	$$('headerSubCanvas').insertBefore(a, $$('headerSubCanvas').firstChild)
}

mapHelper.prototype.getMapState = function()
{
	var drawnObjects = [],
		condition = {expanded:{}, visible:{}};
	
	globalFlashMap.drawing.forEachObject(function(o) 
	{
		if (!nsGmx.DrawingObjectCustomControllers.isSerializable(o))
			return;
			
		var elem = {properties: o.properties, color: o.color, geometry: merc_geometry(o.geometry)};
		
		if (o.geometry.type != "POINT")
		{
			//var style = $(o.canvas).find("div.colorIcon")[0].getStyle();
			var style = o.getStyle();
			
			elem.thickness = style.regular.outline.thickness;
			elem.color = style.regular.outline.color;
			elem.opacity = style.regular.outline.opacity;
		}
		
		if ( o.balloon ) elem.isBalloonVisible = o.balloon.isVisible;
		
		drawnObjects.push(elem);
	});
	
	this.findTreeElems(this.mapTree, function(elem)
	{
		if (elem.type == 'group')
		{
			var groupId = elem.content.properties.GroupID;

			if (!$("div[GroupID='" + groupId + "']").length)
				return;
			
			condition.visible[groupId] = elem.content.properties.visible;
			condition.expanded[groupId] = elem.content.properties.expanded;
		}
		else
		{
			if (elem.content.properties.LayerID && !$("div[LayerID='" + elem.content.properties.LayerID + "']").length)
				return;
			else if (elem.content.properties.MultiLayerID && !$("div[MultiLayerID='" + elem.content.properties.MultiLayerID + "']").length)
				return;
			
			condition.visible[elem.content.properties.name] = elem.content.properties.visible;
		}
	})
	
	var mapState = {
		mode: globalFlashMap.getBaseLayer(),
		mapName: globalMapName,
		position: { 
			x: merc_x(globalFlashMap.getX()), 
			y: merc_y(globalFlashMap.getY()), 
			z: 17 - globalFlashMap.getZ() 
		},
		mapStyles: this.getMapStyles(),
		drawnObjects: drawnObjects,
		isFullScreen: layersShown ? "false" : "true",
		condition: condition,
		language: window.language,
		customParams : typeof window.collectCustomParams != 'undefined' ? window.collectCustomParams() : null,
		customParamsCollection: this.customParamsManager.saveParams()
	}
	
	return mapState;
}

mapHelper.prototype.getMapStyles = function()
{
	var styles = {};
	
	this.findChilds(this.mapTree, function(child)
	{
		if (child.content.properties.type == "Vector" && $("div[LayerID='" + child.content.properties.LayerID + "']").length)
			styles[child.content.properties.name] = child.content.properties.styles;
	}, true);
	
	return styles;
}

mapHelper.prototype.showPermalink = function()
{
	var _this = this,
		mapState = this.getMapState();
	
	sendCrossDomainPostRequest(serverBase + "TinyReference/Create.ashx",
								{
									WrapStyle: 'window',
									content: JSON.stringify(mapState)
								}, 
								function(response)
								{
									if (!parseResponse(response))
										return;
									
									var id = response.Result,
										input = _input(null, [['dir','className','inputStyle'],['attr','value',"http://" + window.location.host + window.location.pathname + "?permalink=" + id + (defaultMapID == globalMapName ? "" : ("&" + globalMapName))],['css','width','270px']])
				
									showDialog(_gtxt("Ссылка на текущее состояние карты:"), _div([input]), 311, 80, false, false);
									
									input.select();
								})
}

mapHelper.prototype.createFilterHeader = function(filtersCanvas, elem, elemCanvas)
{
	var _this = this;
	
	var addButton =  makeLinkButton(_gtxt('Добавить стиль'));
	addButton.onclick = function()
	{
		if (!_layersTree.getLayerVisibility(elemCanvas.parentNode.firstChild))
			_layersTree.setVisibility(elemCanvas.parentNode.firstChild, true);
		
		var lastStyle = elemCanvas.parentNode.properties.content.properties.styles[elemCanvas.parentNode.properties.content.properties.styles.length - 1],
			newStyle = {},
			newFilter = globalFlashMap.layers[elem.name].addObject();
		
		newFilter.setFilter();
		
		//копируем состояние балунов с последнего стиля
		newStyle.Balloon = lastStyle.Balloon;
		newStyle.BalloonEnable = lastStyle.BalloonEnable;
		newStyle.DisableBalloonOnClick = lastStyle.DisableBalloonOnClick;
		newStyle.DisableBalloonOnMouseMove = lastStyle.DisableBalloonOnMouseMove;
		globalFlashMap.balloonClassObject.setBalloonFromParams(newFilter, newStyle);
		
		// if (lastStyle.Balloon)
		// {
			// newStyle.Balloon = lastStyle.Balloon;
			// _this.setBalloon(newFilter, newStyle.Balloon);
		// }
		
		newStyle.MinZoom = lastStyle.MinZoom;
		newStyle.MaxZoom = lastStyle.MaxZoom;
		newFilter.setZoomBounds(Number(newStyle.MinZoom), Number(newStyle.MaxZoom));
		
		newStyle.RenderStyle = lastStyle.RenderStyle;
		newFilter.setStyle(newStyle.RenderStyle);
		
		globalFlashMap.layers[elem.name].filters.push(newFilter);
		
		var filter = _this.createLoadingFilter(newFilter, newStyle, elem.GeometryType.toLowerCase(), elem.attributes, elemCanvas, false);
			
		_(filtersCanvas, [filter]);
		
		_this.updateFilterMoveButtons(filter)
		_this.updateFilterMoveButtons(filtersCanvas.childNodes[filtersCanvas.childNodes.length - 2])
		
		$(filter.firstChild).treeview();
		
		_this.attachLoadingFilterEvent(filter, newFilter, newStyle, elem.GeometryType.toLowerCase(), elem.attributes, elemCanvas, false)
	}
	
	addButton.style.marginLeft = '10px';
	
	return _div([addButton],[['css','height','20px'],['css','padding','5px']]);
}

mapHelper.prototype.updateFilterMoveButtons = function(filter)
{
	var num = getOwnChildNumber(filter),
		upButton = $(filter).find("[filterMoveButton='up']")[0],
		downButton = $(filter).find("[filterMoveButton='down']")[0],
		removeButton = $(filter).find("[filterMoveButton='remove']")[0];
	
	if (num == 0 || filter.parentNode.childNodes.length == 1)
		upButton.style.visibility = 'hidden';
	else
		upButton.style.visibility = 'visible';
		
	if (num == filter.parentNode.childNodes.length - 1)
		downButton.style.visibility = 'hidden';
	else
		downButton.style.visibility = 'visible';
	
	if (num == 0)
		removeButton.style.visibility = 'hidden';
	else
		removeButton.style.visibility = 'visible';
}

mapHelper.prototype.createQuicklookCanvas = function(elem, attrs)
{
	var quicklookText = _textarea(null, [['attr','paramName','Quicklook'],['dir','className','inputStyle'],['css','overflow','auto'],['css','width','250px'],['css','height','50px']]),
		setQuicklook = function()
		{
			var layer = globalFlashMap.layers[elem.name];
			
			if (quicklookText.value != '')
			{
				layer.enableQuicklooks(function(o)
				{
					return quicklookText.value.replace(/\[([a-zA-Z0-9_а-яА-Я ]+)\]/g, function()
					{
						return o.properties[arguments[1]];
					});
				});
			}
		},
		_this = this;
	
	quicklookText.value = (elem.Quicklook) ? elem.Quicklook : '';
	
	quicklookText.onkeyup = function()
	{
		setQuicklook();
		
		return true;
	}
	
	var atrsSuggest = this.createSuggestCanvas(attrs ? attrs : [], quicklookText, '[suggest]', setQuicklook);
	
	quicklookText.onfocus = function()
	{
		atrsSuggest.style.display = 'none';
		
		return true;
	}
	
	var divAttr = _div([_t(_gtxt("Атрибут >")), atrsSuggest], [['dir','className','attrsHelperCanvas']]);
	
	divAttr.onclick = function()
	{
		if (atrsSuggest.style.display == 'none')
			$(atrsSuggest).fadeIn(500);
		
		return true;
	}
	
	var suggestCanvas = _table([_tbody([_tr([_td([_div([divAttr],[['css','position','relative']])])])])],[['css','margin','0px 3px']]);

	return _div([_t(_gtxt("Накладываемое изображение")), _br(), quicklookText, suggestCanvas],[['css','marginTop','10px']]);
}

mapHelper.prototype.createTiledQuicklookCanvas = function(elem, attrs)
{
	var tiledQuicklookText = _textarea(null, [['attr','paramName','TiledQuicklook'],['dir','className','inputStyle'],['css','overflow','auto'],['css','width','250px'],['css','height','50px']]),
		tiledQuickLookMinZoom = _input(null, [['attr','paramName','TiledQuicklookMinZoom'],['dir','className','inputStyle'], ['css','width','40px']]),
		tiledQuickLookMaxZoom = _input(null, [['attr','paramName','TiledQuicklookMaxZoom'],['dir','className','inputStyle'], ['css','width','40px']]),
		setQuicklook = function()
		{
			var layer = globalFlashMap.layers[elem.name];
			
			if (tiledQuicklookText.value != '' && tiledQuickLookMinZoom.value != '' && 
				!isNaN(Number(tiledQuickLookMinZoom.value)) && Number(tiledQuickLookMinZoom.value) > 0)
			{
				if (tiledQuickLookMaxZoom.value != '' && 
				!isNaN(Number(tiledQuickLookMaxZoom.value)) && Number(tiledQuickLookMaxZoom.value) > 0 &&
				Number(tiledQuickLookMaxZoom.value) >= Number(tiledQuickLookMinZoom.value))
				{
					layer.enableTiledQuicklooks(function(o)
					{
						return tiledQuicklookText.value.replace(/\[([a-zA-Z0-9_а-яА-Я ]+)\]/g, function()
						{
							return o.properties[arguments[1]];
						});
					}, Number(tiledQuickLookMinZoom.value), Number(tiledQuickLookMaxZoom.value));
				}
				else
				{
					layer.enableTiledQuicklooks(function(o)
					{
						return tiledQuicklookText.value.replace(/\[([a-zA-Z0-9_а-яА-Я ]+)\]/g, function()
						{
							return o.properties[arguments[1]];
						});
					}, Number(tiledQuickLookMinZoom.value));
				}
			}
		},
		_this = this;
	
	tiledQuicklookText.value = (elem.TiledQuicklook) ? elem.TiledQuicklook : '';
	tiledQuickLookMinZoom.value = (elem.TiledQuicklookMinZoom) ? elem.TiledQuicklookMinZoom : '';
	tiledQuickLookMaxZoom.value = (elem.TiledQuicklookMaxZoom) ? elem.TiledQuicklookMaxZoom : '';
	
	tiledQuicklookText.onkeyup = function()
	{
		setQuicklook();
		
		return true;
	}
	
	tiledQuickLookMinZoom.onkeyup = function()
	{
		setQuicklook();
		
		return true;
	}
	
	tiledQuickLookMaxZoom.onkeyup = function()
	{
		setQuicklook();
		
		return true;
	}
	
	var atrsSuggest = this.createSuggestCanvas(attrs ? attrs : [], tiledQuicklookText, '[suggest]', setQuicklook);
	
	tiledQuicklookText.onfocus = function()
	{
		atrsSuggest.style.display = 'none';
		
		return true;
	}
	
	var divAttr = _div([_t(_gtxt("Атрибут >")), atrsSuggest], [['dir','className','attrsHelperCanvas']]);
	
	divAttr.onclick = function()
	{
		if (atrsSuggest.style.display == 'none')
			$(atrsSuggest).fadeIn(500);
		
		return true;
	}
	
	var suggestCanvas = _table([_tbody([_tr([_td([_div([divAttr],[['css','position','relative']])])])])],[['css','margin','0px 3px']]);

	return _div([_t(_gtxt("Накладываемые тайлы")), _br(), tiledQuicklookText, suggestCanvas, _div([_t(_gtxt("Отображать с зума")), tiledQuickLookMinZoom, _t(_gtxt("По")), tiledQuickLookMaxZoom],[['css','paddingLeft','3px']])],[['css','marginTop','10px']]);
}

mapHelper.prototype.makeStyle = function(style)
{
	var givenStyle = {};
	
	if (typeof style.RenderStyle != 'undefined')
		givenStyle = style.RenderStyle;
	else if (style.outline || style.marker)
		givenStyle = style;
	else
	{
		if (style.PointSize)
			givenStyle.marker = { size: parseInt(style.PointSize) };
		if (style.Icon)
		{
			var src = (style.Icon.indexOf("http://") != -1) ?
				style.Icon :
				(baseAddress + "/" + style.Icon);
			givenStyle.marker = { image: src, center: true };
		}
		if (style.BorderColor || style.BorderWidth)
			givenStyle.outline = {
				color: parseColor(style.BorderColor),
				thickness: parseInt(style.BorderWidth || "1")
			};
		if (style.FillColor)
			givenStyle.fill = {
				color: parseColor(style.FillColor),
				opacity: 100 - parseInt(style.Transparency || "0")
			};
	
		var label = style.label || style.Label;
		if (label)
			givenStyle.label = {
				field: label.FieldName,
				color: parseColor(label.FontColor),
				size: parseInt(label.FontSize || "12")
			};
	}
	
	return givenStyle;
}

mapHelper.prototype.createColorPicker = function(color, showFunc, hideFunc, changeFunc)
{
	var colorPicker = _div(null, [['dir','className','colorSelector'], ['css','backgroundColor',this.convertColor(color)]]);
	
	$(colorPicker).ColorPicker({
		color: this.convertColor(color),
		onShow: showFunc,
		onHide: hideFunc,
		onChange: changeFunc
	});
	
	_title(colorPicker, _gtxt("Цвет"));
			
	return colorPicker;
}

mapHelper.prototype.createSlider = function(opacity, changeFunc)
{
	var divSlider = _div(null, [['css','width','86px'],['css','height','8px'],['css','border','1px solid #cdcdcd']]);
	
	$(divSlider).slider(
		{
			min:0,
			max:100,
			step:1,
			value: opacity,
			slide: function(event, ui)
			{
				changeFunc(event, ui);
				
				_title(divSlider.firstChild, ui.value)
			}
		});
	
	divSlider.firstChild.style.zIndex = 1;
	
	if ($.browser.msie)
	{
		divSlider.firstChild.style.fontSize = '5px';
		divSlider.firstChild.style.width = '12px';
		divSlider.firstChild.style.height = '14px';
		divSlider.firstChild.style.marginTop = '-2px';
	}
	
	divSlider.style.width = '100px';
	divSlider.style.border = 'none';
	divSlider.style.backgroundImage = 'url(img/slider.png)';
	
	divSlider.firstChild.style.border = 'none';
	divSlider.firstChild.style.width = '12px';
	divSlider.firstChild.style.height = '14px';
	divSlider.firstChild.style.marginLeft = '-6px';
	
	if ($.browser.msie)
		divSlider.firstChild.style.top = '-1px';
	else
		divSlider.firstChild.style.top = '-3px';

	divSlider.firstChild.style.background = 'transparent url(img/sliderIcon.png) no-repeat';
	
	divSlider.firstChild.onmouseover = function()
	{
		divSlider.firstChild.style.backgroundImage = 'url(img/sliderIcon_a.png)';
	}
	divSlider.firstChild.onmouseout = function()
	{
		divSlider.firstChild.style.backgroundImage = 'url(img/sliderIcon.png)';
	}
	
	_title(divSlider.firstChild, opacity)
	_title(divSlider, _gtxt("Прозрачность"));
	
	return divSlider;
}

mapHelper.prototype.createSelect = function(value, count, changeFunc)
{
	var sel = _select(null, [['dir','className','selectStyle'],['css','width','50px']]);
	
	for (var i = 0; i < count; i++)
		_(sel, [_option([_t(String(i + 1))], [['attr','value', i + 1]])])
	
	switchSelect(sel, value);
	
	sel.onchange = changeFunc;
	
	return sel;
}

mapHelper.prototype.createInput = function(value, changeFunc)
{
	var input = _input(null, [['dir','className','inputStyle'],['css','width','30px'],['attr','value',value]]);
	
	input.onkeyup = changeFunc;
	
	return input;
}

//Интерфейс для провайдеров значений параметров
function ILazyAttributeValuesProvider()
{
	this.isAttributeExists = function( attrName ){};
	this.getValuesForAttribute = function( attrName, callback ){};
};

//Простая обёртка над массивами для обратной совместимости
function LazyAttributeValuesProviderFromArray( attributes )
{
	var _attrs = attributes;

	this.isAttributeExists = function( attrName )
	{
		return attrName in _attrs; 
	};
	
	this.getValuesForAttribute = function( attrName, callback )
	{
		if ( attrName in _attrs )
			callback(_attrs[attrName]);
		else
			callback();
	};
};
LazyAttributeValuesProviderFromArray.prototype = new ILazyAttributeValuesProvider();

//При необходимости этот провайдер будет запрашивать значения аттрибутов у сервера
function LazyAttributeValuesProviderFromServer( attributes, layerID )
{
	var _attrs = attributes;
	var _layerID = layerID;
	var _isInited = false;
	var _isProcessing = false;
	
	//в процессе ожидания ответа от сервера мы можем получать запросы на разные аттрибуты
	//важно все их правильно сохранить и выхвать при получении данных
	var _callbacks = {};

	this.isAttributeExists = function( attrName )
	{
		return attrName in _attrs; 
	};
	
	this.getValuesForAttribute = function( attrName, callback )
	{
		if ( !(attrName in _attrs) ) //вообще нет такого имени
			callback();
		else if ( _attrs[attrName].length ) //есть вектор значений!
			callback( _attrs[attrName] ); 
		else if (_isInited) //вектора значений всё ещё нет и уже ходили на сервер - второй раз пробовать не будем...
			callback(); 
		else
		{
			if ( !(attrName in _callbacks) )
				_callbacks[attrName] = [];
			
			_callbacks[attrName].push(callback);
			
			if (_isProcessing) return;
			//идём на сервер и запрашиваем значения аттрибутов!
			
			_isProcessing = true;
			sendCrossDomainJSONRequest(serverBase + "VectorLayer/GetVectorAttrValues.ashx?WrapStyle=func&LayerID=" + _layerID, function(response)
			{
				_isInited = true;
				_isProcessing = false;
				if (!parseResponse(response))
				{
					for (var n in _callbacks)
						for (var k = 0; k < _callbacks[n].length; k++)
							_callbacks[n][k]();
					return;
				}
				
				_attrs = response.Result;
				for (var n in _callbacks)
					for (var k = 0; k < _callbacks[n].length; k++)
						_callbacks[n][k](_attrs[n]);
			});
		}
	};
}
LazyAttributeValuesProviderFromServer.prototype = new ILazyAttributeValuesProvider();


mapHelper.prototype.createSuggestCanvas = function(values, textarea, textTamplate, func, valuesArr, addValueFlag)
{
	var _this = this;
	
	if ( typeof valuesArr != 'undefined' && valuesArr && !(valuesArr instanceof ILazyAttributeValuesProvider) )
		valuesArr = new LazyAttributeValuesProviderFromArray(valuesArr);
	
	var canvas = _div(null, [['dir','className','attrsHelper']]);
	canvas.style.display = 'none';
	
	canvas.onmouseout = function(e)
	{
		var evt = e || window.event,
			target = evt.srcElement || evt.target,
			relTarget = evt.relatedTarget || evt.toElement;
		
		if (canvas.getAttribute('arr'))
		{
			try 
			{		
				while (relTarget)
				{
					if (relTarget == canvas)
						return;
					relTarget = relTarget.parentNode;
				}
				$(canvas).fadeOut(300, function(){$(this).remove();});
			}
			catch (e)
			{
				if (target == canvas)
					$(canvas).fadeOut(300, function(){$(this).remove();});
			}
		}
	}
			
	for (var i = 0; i < values.length; i++)
	{
		var div = _div([_t(String(values[i]))], [['dir','className','attrsHelperElem']]);
		
		(function(value)
		{
			div.onmouseover = function()
			{
				var _curDiv = this;
				$(this.parentNode).children(".attrsHelperHover").removeClass("attrsHelperHover");
				$(this).addClass('attrsHelperHover');
				
				if (typeof valuesArr == 'undefined' || valuesArr == false)
					return;
				
				$(canvas.parentNode).children("[arr]").each(function()
				{
					if (this.getAttribute('arr') != value)
					{
						$(this).fadeOut(300, function()
						{
							$(this).remove();
						})
					}
				})
				
				// if (typeof valuesArr[value] == 'undefined' || !valuesArr[value].length)
					// return;
				if (!valuesArr.isAttributeExists(value)) return;
				
				if (!$(canvas.parentNode).children("[arr='" + value + "']").length)
				{
					this.timer = setTimeout(function()
					{
						valuesArr.getValuesForAttribute( value, function(attrValues){
							
							if ( !attrValues || !$(_curDiv).hasClass("attrsHelperHover") ) return;
							
							var canvasArr = _mapHelper.createSuggestCanvas(attrValues, textarea, 'suggest', function()
								{
									func();
									
									$(canvasArr.parentNode.childNodes[1]).fadeOut(300);
									
									canvasArr.removeNode(true);
								}, false, addValueFlag);
							
							canvasArr.style.left = '105px';
							canvasArr.style.height = '70px';
							canvasArr.style.width = '100px';
							
							$(canvasArr).children().css('width','80px');
							
							canvasArr.setAttribute('arr', value);
							
							_(canvas.parentNode, [canvasArr]);
							
							$(canvasArr).fadeIn(300);
							
							//stopEvent(e);
						})
						
					}, 300);
				}
			}
		})(values[i])
		
		div.onmouseout = function(e)
		{
			var evt = e || window.event,
				target = evt.srcElement || evt.target,
				relTarget = evt.relatedTarget || evt.toElement;
			
			if ($(target).hasClass('attrsHelperHover') && relTarget == this.parentNode)
				$(this).removeClass('attrsHelperHover');
			
			if (this.timer)
				clearTimeout(this.timer);
		};
		
		(function(value)
		{
			div.onclick = function(e)
			{
				var val = value;
				if (this.parentNode.getAttribute('arr') != null)
				{
					if (isNaN(Number(val)))
						val = "\'" + val + "\'";
					
					if (addValueFlag)
						val = "\"" + this.parentNode.getAttribute('arr') + "\"" + ' = ' + val;
				}
				
				insertAtCursor(textarea, val, this.parentNode.sel);
				
				$(canvas).fadeOut(300);
				
				if (this.timer)
					clearTimeout(this.timer);
				
				$(canvas.parentNode).children("[arr]").fadeOut(300, function()
						{
							$(this).remove();
						})
				
				func();
				
				stopEvent(e);
			}
		})(textTamplate.replace(/suggest/g, values[i]));
		
		_title(div, values[i]);
		
		_(canvas, [div]);
	}
	
	return canvas;
}

mapHelper.prototype.createFilterEditorInner = function(filter, attrs, elemCanvas)
{
	var filterText = _textarea(null, [['dir','className','inputStyle'],['css','overflow','auto'],['css','width','250px'],['css','height','50px']]),
		setFilter = function()
		{
			var filterNum = getOwnChildNumber(filterText.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode),
				filter = globalFlashMap.layers[elemCanvas.parentNode.properties.content.properties.name].filters[filterNum];
			
			if (filterText.value != '')
			{
				var parsed = filter.setFilter(filterText.value);
				
				if (!parsed)
					$(filterText).addClass("error");
				else
					$(filterText).removeClass("error");
			}
			else
			{
				filter.setFilter();
					
				$(filterText).removeClass("error");
			}
		},
		_this = this;

	filterText.value = filter;
	
	filterText.onkeyup = function()
	{
		setFilter();
		
		return true;
	}
	
	var mapName = elemCanvas.parentNode.properties.content.properties.mapName,
		layerName = elemCanvas.parentNode.properties.content.properties.name,
		attrsSuggest = this.createSuggestCanvas(attrs ? attrs : [], filterText, "\"suggest\"", setFilter, this.attrValues[mapName][layerName], true),
		valuesSuggest = this.createSuggestCanvas(attrs ? attrs : [], filterText, "\"suggest\"", setFilter, this.attrValues[mapName][layerName]),
		opsSuggest = this.createSuggestCanvas(['=','>','<','>=','<=','<>','AND','OR','NOT','IN','LIKE','()'], filterText, " suggest ", setFilter);
	
	opsSuggest.style.width = '80px';
	$(opsSuggest).children().css('width','60px');
	
	var divAttr = _div([_t(_gtxt("Атрибут >")), attrsSuggest], [['dir','className','attrsHelperCanvas']]),
		divValue = _div([_t(_gtxt("Значение >")), valuesSuggest], [['dir','className','attrsHelperCanvas'],['css','marginLeft','10px']]),
		divOp = _div([_t(_gtxt("Операция >")), opsSuggest], [['dir','className','attrsHelperCanvas'],['css','marginLeft','10px']]),
		clickFunc = function(div)
		{
			if (document.selection)
			{
				filterText.focus();
				var sel = document.selection.createRange();
				div.sel = sel;
				filterText.blur();
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
	
	filterText.onclick = function()
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
											 _td([_div([divOp],[['css','position','relative']])])])])],[['css','margin','0px 3px']]),
		div = _div([filterText, suggestCanvas],[['attr','filterTable',true]])
	
	div.getFilter = function()
	{
		return filterText.value;
	};
	div.setFilter = function()
	{
		setFilter();
	};
	
	return div;
}

mapHelper.prototype.createFilterEditor = function(filterParam, attrs, elemCanvas)
{
	var filter = (typeof filterParam == 'undefined') ? '' : filterParam;
	
	if (!this.attrValues[elemCanvas.parentNode.properties.content.properties.mapName][elemCanvas.parentNode.properties.content.properties.name])
	{
		var div = _div([_t(_gtxt("Авторизуйтесь для редактирования фильтров"))],[['css','padding','5px 0px 5px 5px'],['css','color','red']]);
		
		div.getFilter = function()
		{
			return filter;
		};
		div.setFilter = function(){};
		
		div.setAttribute('filterTable', true);
		
		return div;
	}
	else
		return this.createFilterEditorInner(filter, attrs, elemCanvas);
}

//identityField - будем исключать из списка аттрибутов, показываемых в балуне, так как это внутренняя техническая информация
mapHelper.prototype.createBalloonEditor = function(balloonParams, attrs, elemCanvas, identityField)
{
	var _this = this;
	var balloonText = _textarea(null, [['dir','className','inputStyle'],['css','overflow','auto'],['css','width','251px'],['css','height','80px']]),
		setBalloon = function()
		{
			var filterNum = getOwnChildNumber(balloonText.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode),
				filter = globalFlashMap.layers[elemCanvas.parentNode.properties.content.properties.name].filters[filterNum];
			globalFlashMap.balloonClassObject.setBalloonFromParams(filter, div.getBalloonState());
			// if (box.checked)
			// {
				// if (balloonText.value != '')
					// _this.setBalloon(filter, balloonText.value);
				// else
					// filter.enableHoverBalloon();
			// }
			// else
				// filter.disableHoverBalloon();
		},
		defaultBalloonText = function()
		{
			var sortAttrs = attrs.sort(),
				text = "";
			
			for (var i = 0; i < sortAttrs.length; ++i)
			{
				var key = sortAttrs[i];
				
				if (key !== identityField)
					text += "<b>" + key + ":</b> [" + key + "]<br />" + br;
			}
			
			text += "<br />" + br + "[SUMMARY]";
			
			return text;
		},
		boxClick = _checkbox(!balloonParams.DisableBalloonOnClick && balloonParams.BalloonEnable, 'checkbox'),
		boxMove = _checkbox(!balloonParams.DisableBalloonOnMouseMove && balloonParams.BalloonEnable, 'checkbox'),
		br = $.browser.msie ? "\n\r" : "\n",
		_this = this;
	
	boxClick.className = 'box';
	if ($.browser.msie)
		boxClick.style.margin = '-3px -2px 0px -2px';
	
	boxClick.onclick = function()
	{
		setBalloon();
	}
	
	boxMove.className = 'box';
	if ($.browser.msie)
		boxMove.style.margin = '-3px -2px 0px -2px';
	
	boxMove.onclick = function()
	{
		setBalloon();
	}	
	
	balloonText.value = (balloonParams.Balloon) ? balloonParams.Balloon : defaultBalloonText();
	
	balloonText.onkeyup = function()
	{
		setBalloon();
		
		return true;
	}
	
	var atrsSuggest = this.createSuggestCanvas(attrs ? attrs : [], balloonText, '[suggest]', setBalloon);
	
	balloonText.onfocus = function()
	{
		atrsSuggest.style.display = 'none';
		
		return true;
	}
	
	var divAttr = _div([_t(_gtxt("Атрибут >")), atrsSuggest], [['dir','className','attrsHelperCanvas']]);
	
	divAttr.onclick = function()
	{
		if (atrsSuggest.style.display == 'none')
			$(atrsSuggest).fadeIn(500);
		
		return true;
	}
	
	var suggestCanvas = _table([_tbody([_tr([_td([_div([divAttr],[['css','position','relative']])])])])],[['css','margin','0px 3px']]);

	var div = _div([_div([boxClick, _span([_t(_gtxt("Показывать при клике"))],[['css','marginLeft','5px']])],[['css','margin','2px 0px 4px 3px']]), 
					_div([boxMove, _span([_t(_gtxt("Показывать при наведении"))],[['css','marginLeft','5px']])],[['css','margin','2px 0px 4px 3px']]), 
	                balloonText, suggestCanvas],[['attr','balloonTable',true]]);
	
	div.getBalloon = function()
	{
		return balloonText.value == defaultBalloonText() ? '' : balloonText.value;
	};
	
	div.getBalloonEnable = function()
	{
		return boxClick.checked || boxMove.checked;
	};
	
	div.getBalloonDisableOnClick = function()
	{
		return boxClick.checked;
	};
	
	div.getDisableBalloonOnMouseMove = function()
	{
		return boxMove.checked;
	};
	
	div.getBalloonState = function()
	{
		var state = {
			BalloonEnable: boxClick.checked || boxMove.checked,
			DisableBalloonOnClick: !boxClick.checked,
			DisableBalloonOnMouseMove: !boxMove.checked
		}
		
		if (balloonText.value !== defaultBalloonText())
			state.Balloon = balloonText.value;
		
		return state;
	}
	
	return div;
}

mapHelper.prototype.showStyle = function(elem)
{
	var div = $(elem).find("[fade]")[0];
	
	$(div).fadeIn(300);
}
mapHelper.prototype.hideStyle = function(elem)
{
	var div = $(elem).find("[fade]")[0];
	
	$(div).fadeOut(300);
}

mapHelper.prototype.checkZoom = function(minZoomInput, maxZoomInput)
{
	if (minZoomInput.value == '' ||
		isNaN(Number(minZoomInput.value)) ||
		Number(minZoomInput.value) != Math.floor(Number(minZoomInput.value)) ||
		Number(minZoomInput.value) < 1 ||
		Number(minZoomInput.value) > 21)
		$(minZoomInput).addClass("error");
	else
		$(minZoomInput).removeClass("error");
		
	if (maxZoomInput.value == '' ||
		isNaN(Number(maxZoomInput.value)) ||
		Number(maxZoomInput.value) != Math.floor(Number(maxZoomInput.value)) ||
		Number(maxZoomInput.value) < 1 ||
		Number(maxZoomInput.value) > 21)
		$(maxZoomInput).addClass("error");
	else
		$(maxZoomInput).removeClass("error");
	
	if (!$(minZoomInput).hasClass("error") &&
		!$(maxZoomInput).hasClass("error") &&
		Number(minZoomInput.value) > Number(maxZoomInput.value))
	{
		$(minZoomInput).addClass("error");
		$(maxZoomInput).addClass("error");
	}
	
	if ($(minZoomInput).hasClass("error") ||
		$(maxZoomInput).hasClass("error"))
		return false
	else
		return true;
}

mapHelper.prototype.createLoadingFilter = function(parentObject, parentStyle, geometryType, attrs, elemCanvas, openedFlag)
{
	var templateStyle = {},
		nameInput = _input(null, [['dir','className','inputStyle'],['attr','paramName','Name'],['css','width','210px'],['attr','value', parentStyle.Name || '']]),
		ulFilterParams = _ul(),
		liFilter = _li([_div([nameInput]), ulFilterParams]),
		ulFilter = _ul([liFilter]),
		filterCanvas = _div([ulFilter],[['dir','className','filterCanvas']]),
		_this = this;
		
	$.extend(true, templateStyle, this.makeStyle(parentStyle));
	
	_title(nameInput, _gtxt("Имя фильтра"));
	
	filterCanvas.getStyle = function()
	{
		return templateStyle;
	}
	
	filterCanvas.getFilter = function()
	{
		return parentStyle.Filter;
	}
	
	filterCanvas.getBalloon = function()
	{
		return parentStyle.Balloon;
	}
	
	filterCanvas.getBalloonEnable = function()
	{
		return (typeof parentStyle.BalloonEnable != 'undefined' ? parentStyle.BalloonEnable : true);
	};
	
	filterCanvas.getBalloonDisableOnClick = function()
	{
		return parentStyle.DisableBalloonOnClick;
	};
	
	filterCanvas.getDisableBalloonOnMouseMove = function()
	{
		return parentStyle.DisableBalloonOnMouseMove;
	};
	
	filterCanvas.getBalloonState = function()
	{
		var state = {
			BalloonEnable: !parentStyle.DisableBalloonOnMouseMove || !parentStyle.DisableBalloonOnClick,
			DisableBalloonOnClick: parentStyle.DisableBalloonOnClick,
			DisableBalloonOnMouseMove: parentStyle.DisableBalloonOnMouseMove,
			Balloon: parentStyle.Balloon
		}
		
		return state;
	}
	
	filterCanvas.addFilterParams = function(filterParams)
	{
		filterParams.Name = nameInput.value;
		filterParams.MinZoom = parentStyle.MinZoom;
		filterParams.MaxZoom = parentStyle.MaxZoom;
	}
	
	filterCanvas.removeColorPickers = function(){}
	
	if (!openedFlag)
	{
		ulFilterParams.loaded = false;

		ulFilterParams.style.display = 'none';
		ulFilterParams.className = 'hiddenTree';
	}
	else
	{
		ulFilterParams.loaded = true;
		
		this.createFilter(parentObject, parentStyle, geometryType, attrs, elemCanvas, ulFilterParams, false);
	}
	
	var moveUp = makeImageButton('img/up.png', 'img/up_a.png'),
		moveDown = makeImageButton('img/down.png', 'img/down_a.png');
	
	moveUp.onclick = function()
	{
		this.src = 'img/up.png';
		
		var firstNum = getOwnChildNumber(this.parentNode.parentNode.parentNode.parentNode) - 1;
		
		_this.swapFilters(elemCanvas.parentNode, firstNum, this.parentNode.parentNode.parentNode.parentNode.parentNode);
	}
	
	moveDown.onclick = function()
	{
		this.src = 'img/down.png';
		
		var firstNum = getOwnChildNumber(this.parentNode.parentNode.parentNode.parentNode);
		
		_this.swapFilters(elemCanvas.parentNode, firstNum, this.parentNode.parentNode.parentNode.parentNode.parentNode);
	}
	
	if ($.browser.msie)
	{
		moveUp.style.margin = '0px 1px 0px 2px';
		moveDown.style.margin = '0px 1px 0px 2px';
	}
	else
	{
		moveUp.style.margin = '0px 1px -3px 2px';
		moveDown.style.margin = '0px 1px -3px 2px';
	}
	
	moveUp.setAttribute('filterMoveButton','up');
	moveDown.setAttribute('filterMoveButton','down');
	
	_title(moveUp, _gtxt("Переместить фильтр вверх"));
	_title(moveDown, _gtxt("Переместить фильтр вниз"));
	
	_(liFilter.firstChild, [moveDown, moveUp])

	var remove = makeImageButton('img/closemin.png', 'img/close_orange.png')
	remove.onclick = function()
	{
		var num = getOwnChildNumber(filterCanvas),
			filters = globalFlashMap.layers[elemCanvas.parentNode.properties.content.properties.name].filters,
			newFilters = [];
		
		for (var i = 0; i < filters.length; i++)
			if (i != num)
				newFilters.push(filters[i])
		
		globalFlashMap.layers[elemCanvas.parentNode.properties.content.properties.name].filters = newFilters;
		
		var filtersParent = filterCanvas.parentNode;
		
		filterCanvas.removeNode(true);

		_this.updateFilterMoveButtons(filtersParent.childNodes[num - 1])
		
		parentObject.remove();
	}
	
	remove.setAttribute('filterMoveButton','remove');
	
	remove.style.width = '16px';
	remove.style.height = '16px';
	
	if ($.browser.msie)
		remove.style.margin = '0px 1px 0px 2px';
	else
		remove.style.margin = '0px 1px -3px 2px';
		
	_title(remove, _gtxt("Удалить фильтр"))
	
	_(liFilter.firstChild, [remove])
	
	return filterCanvas;
}

mapHelper.prototype.swapFilters = function(div, firstNum, filterCanvas)
{
	var filters = globalFlashMap.layers[div.properties.content.properties.name].filters,
		newFilters = [];
	
	for (var i = 0; i < filters.length; i++)
	{
		if (i < firstNum || i > firstNum + 1)
			newFilters.push(filters[i])
		else if (i == firstNum)
			newFilters.push(filters[i + 1])
		else if (i == firstNum + 1)
			newFilters.push(filters[i - 1])
	}
	
	globalFlashMap.layers[div.properties.content.properties.name].filters = newFilters;
	
	if (!div.firstChild.checked)
		_click(div.firstChild)
	
	globalFlashMap.layers[div.properties.content.properties.name].filters[firstNum].bringToDepth(firstNum + 1);
	
	$(filterCanvas.childNodes[firstNum]).before(filterCanvas.childNodes[firstNum + 1]);
	
	this.updateFilterMoveButtons(filterCanvas.childNodes[firstNum]);
	this.updateFilterMoveButtons(filterCanvas.childNodes[firstNum + 1]);
}

mapHelper.prototype.attachLoadingFilterEvent = function(filterCanvas, parentObject, parentStyle, geometryType, attrs, elemCanvas)
{
	var _this = this;
	
	$(filterCanvas.firstChild.firstChild.firstChild).bind('click', function()
	{
		var ulFilterParams = _abstractTree.getChildsUl(filterCanvas.firstChild.firstChild);
		
		if (!ulFilterParams.loaded)
		{
			ulFilterParams.loaded = true;
			
			_this.createFilter(parentObject, parentStyle, geometryType, attrs, elemCanvas, ulFilterParams, true);
		}
	})
}

mapHelper.prototype.createFilter = function(parentObject, parentStyle, geometryType, attrs, elemCanvas, ulParent, treeviewFlag)
{
	var templateStyle = {},
		_this = this;
	
	$.extend(true, templateStyle, this.makeStyle(parentStyle));
	
	var filterInput = _textarea([_t(parentStyle.Filter || '')], [['dir','className','inputStyle'],['css','overflow','auto'],['css','margin','1px 0px'],['css','width','260px'],['css','height','40px']]),
		minZoomInput = _input(null, [['dir','className','inputStyle'],['attr','paramName','MinZoom'],['css','width','30px'],['attr','value', parentStyle.MinZoom || 1]]),
		maxZoomInput = _input(null, [['dir','className','inputStyle'],['attr','paramName','MaxZoom'],['css','width','30px'],['attr','value', parentStyle.MaxZoom || 17]]),
		liMinZoom = _li([_div([_table([_tbody([_tr([_td([_span([_t(_gtxt("Мин. зум"))],[['css','fontSize','12px']])],[['css','width','60px']]),_td([minZoomInput])])])])])]),
		liMaxZoom = _li([_div([_table([_tbody([_tr([_td([_span([_t(_gtxt("Макс. зум"))],[['css','fontSize','12px']])],[['css','width','60px']]),_td([maxZoomInput])])])])])]),
		ulfilterExpr = _ul([_li([_div()],[['css','paddingLeft','0px'],['css','background','none']])]),
		liLabel = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulLabel = _ul([liLabel]),
		liBalloon = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulBalloon = _ul([liBalloon]),
		liStyle = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulStyle = _ul([liStyle]);
	
	// zoom
	this.checkZoom(minZoomInput, maxZoomInput);
	
	minZoomInput.onkeyup = maxZoomInput.onkeyup = function()
	{
		if (_this.checkZoom(minZoomInput, maxZoomInput))
		{
			var filterNum = getOwnChildNumber(ulParent.parentNode.parentNode.parentNode),
				filter = globalFlashMap.layers[elemCanvas.parentNode.properties.content.properties.name].filters[filterNum];
			
			if (!globalFlashMap.layers[elemCanvas.parentNode.properties.content.properties.name].objectId)
				_click(elemCanvas.parentNode.firstChild)
				
			filter.setZoomBounds(Number(minZoomInput.value), Number(maxZoomInput.value));
		}
		
		return true;
	}
	
	// label
	
	var labelAttrSel = _select([_option([_t('')],[['attr','value','']])],[['dir','className','selectStyle'],['css','width','142px']]),
		fontSizeInput = _input(null, [['dir','className','inputStyle'],['attr','labelParamName','FontSize'],['css','width','30px'],['attr','value', templateStyle.label && templateStyle.label.size || '']]),
		checkedLabelColor = (typeof templateStyle.label != 'undefined' && typeof templateStyle.label.color != 'undefined') ? templateStyle.label.color : 0x000000,
		checkedLabelHaloColor = (typeof templateStyle.label != 'undefined' && typeof templateStyle.label.haloColor != 'undefined') ? templateStyle.label.haloColor : 0x000000,
		labelColor = this.createColorPicker(checkedLabelColor,
			function (colpkr){
				$(colpkr).fadeIn(500);
				return false;
			},
			function (colpkr){
				$(colpkr).fadeOut(500);
				return false;
			},
			function (hsb, hex, rgb) {
				labelColor.style.backgroundColor = '#' + hex;
				
				if (typeof templateStyle.label == 'undefined')
					return;
				
				templateStyle.label.color = labelColor.hex = parseInt('0x' + hex);
				
				_this.setMapStyle(parentObject, templateStyle);
			}),
		labelHaloColor = this.createColorPicker(checkedLabelHaloColor,
			function (colpkr){
				$(colpkr).fadeIn(500);
				return false;
			},
			function (colpkr){
				$(colpkr).fadeOut(500);
				return false;
			},
			function (hsb, hex, rgb) {
				labelHaloColor.style.backgroundColor = '#' + hex;
				
				if (typeof templateStyle.label == 'undefined')
					return;
				
				templateStyle.label.haloColor = labelHaloColor.hex = parseInt('0x' + hex);
				
				_this.setMapStyle(parentObject, templateStyle);
			});
	
	_title(labelColor, _gtxt("Цвет заливки"));
	_title(labelHaloColor, _gtxt("Цвет обводки"));
	_title(fontSizeInput, _gtxt("Размер шрифта"));
	_title(labelAttrSel, _gtxt("Имя атрибута"));
	
	if (attrs)
	{
		for (var i = 0; i < attrs.length; i++)
			_(labelAttrSel, [_option([_t(attrs[i])],[['attr','value',attrs[i]]])]);
		
		labelAttrSel = switchSelect(labelAttrSel, (templateStyle.label && templateStyle.label.field) ? templateStyle.label.field : '')
	}
	
	labelAttrSel.onchange = function()
	{		
		if (this.value != '')
		{
			if (typeof templateStyle.label == 'undefined')
			{
				templateStyle.label = {};
				templateStyle.label.field = this.value;
				templateStyle.label.color = $(liLabel).find(".colorSelector")[0].hex;
				templateStyle.label.size = Number(fontSizeInput.value);
			}
			else
				templateStyle.label.field = this.value;
		}
		else
			delete templateStyle.label;

		_this.setMapStyle(parentObject, templateStyle);
	}
	
	fontSizeInput.onkeyup = function()
	{
		if (typeof templateStyle.label == 'undefined')
			return;
		
		templateStyle.label.size = Number(this.value);
		
		_this.setMapStyle(parentObject, templateStyle);
	}
	
	_(liLabel.lastChild, [_table([_tbody([_tr([_td([labelColor]),_td([labelHaloColor]),_td([labelAttrSel]),_td([fontSizeInput])])])])])	
	
	if (typeof templateStyle.label == 'undefined')
	{
		ulLabel.style.display = 'none';
		ulLabel.className = 'hiddenTree';
	}
	
	// filter
	
	var filterEditor = this.createFilterEditor(parentStyle.Filter, attrs, elemCanvas);
	
	_(ulfilterExpr.lastChild.lastChild, [filterEditor]);

	if (typeof parentStyle.Filter == 'undefined' || filterEditor.childNodes.length == 1)
	{
		ulfilterExpr.style.display = 'none';
		ulfilterExpr.className = 'hiddenTree';
	}
	
	// balloon
	globalFlashMap.balloonClassObject.applyBalloonDefaultStyle(parentStyle);
	/*var balloonProps = {
		Ballon: parentStyle.Balloon, 
		BalloonEnable: typeof parentStyle.BalloonEnable !== 'undefined' ? parentStyle.BalloonEnable : true,
		DisableBalloonOnMouseMove: typeof parentStyle.DisableBalloonOnMouseMove != 'undefined' ? parentStyle.DisableBalloonOnMouseMove : false,
		DisableBalloonOnClick: typeof parentStyle.DisableBalloonOnClick != 'undefined' ? parentStyle.DisableBalloonOnClick : false,
	}*/
	
	var balloonEditor = this.createBalloonEditor(parentStyle, attrs, elemCanvas, elemCanvas.parentNode.properties.content.properties.identityField);
	
	_(liBalloon.lastChild, [balloonEditor]);
	
	if (typeof parentStyle.Balloon == 'undefined')
	{
		ulBalloon.style.display = 'none';
		ulBalloon.className = 'hiddenTree';
	}
	
	// common
	
	_(ulParent, [liMinZoom, liMaxZoom, _li([_div([_span([_t(_gtxt("Фильтр"))],[['css','fontSize','12px']])]), ulfilterExpr]), _li([_div([_span([_t(_gtxt("Подпись"))],[['css','fontSize','12px']])]), ulLabel]), _li([_div([_span([_t(_gtxt("Балун"))],[['css','fontSize','12px']])]), ulBalloon]),  _li([_div([_span([_t(_gtxt("Символика"))],[['css','fontSize','12px']])]), ulStyle])]);
	
	if (treeviewFlag)
		$(ulParent).treeview();
	
	// styles
	
	this.createStyleEditor(liStyle.lastChild, parentObject, templateStyle, geometryType, elemCanvas);
	
	ulParent.parentNode.parentNode.parentNode.getStyle = function()
	{
		return templateStyle;
	}
	
	ulParent.parentNode.parentNode.parentNode.removeColorPickers = function()
	{
		$(liStyle.lastChild).find(".colorSelector").each(function()
		{
			if ($$($(this).data("colorpickerId")))
				$$($(this).data("colorpickerId")).removeNode(true);
		})
		
		$$($(labelColor).data("colorpickerId")).removeNode(true);
	}
}

mapHelper.prototype.FillStyleControl = function(initStyle, params)
{
    var _params = $.extend({showSelectors: true}, params);
    var _fillStyle = $.extend(true, {fill: 
        {color: 0xFFFFFF, 
         opacity: 50, 
         image: "", 
         pattern: {
            width: 8, 
            step: 0, 
            colors: [0x000000,0xFFFFFF], 
            style: 'diagonal1'
        }}}, initStyle).fill;
    
	var _this = this;
	var selectorDiv = $("<div/>", {'class': "fillStyleSelectorDiv"});
    
    var colorContainer = $("<div/>");
    var patternContainer = $("<div/>");
    var imagePatternContainer = $("<div/>");
	
	var colorIcon      = $("<img/>", {src: 'img/styles/color.png',   title: _gtxt("Заливка цветом")}).data('type', 'color');
	var patternIcon    = $("<img/>", {src: 'img/styles/pattern.png', title: _gtxt("Заливка штриховкой")}).data('type', 'pattern');
	var patternURLIcon = $("<img/>", {src: 'img/styles/globe.gif',   title: _gtxt("Заливка рисунком")}).data('type', 'bitmapPattern');
    
    var controls = {
		"color":         {icon: colorIcon,      control: colorContainer},
		"pattern":       {icon: patternIcon,    control: patternContainer},
		"bitmapPattern": {icon: patternURLIcon, control: imagePatternContainer}
	};
    
    var initFillStyle = initStyle.fill || {};
    
    var activeFillType = null;
    if ('image' in initFillStyle)
        activeFillType = 'bitmapPattern';
    else if ('pattern' in initFillStyle)
        activeFillType = 'pattern';
    else if ('color' in initFillStyle)
        activeFillType = 'color';
        
    for (var c in controls)
        if (c == activeFillType)
            controls[c].icon.addClass('selectedType');
        else
            controls[c].control.hide();
	
    var selectorIconsDiv = $('<div/>')
        .append(colorIcon)
        .append(patternIcon)
        .append(patternURLIcon);
        
	selectorDiv.append($("<span>Заливка</span><br/>"));
    
    if (_params.showSelectors)
        selectorDiv.append(selectorIconsDiv);
    
	$("img", selectorDiv).click(function()
	{
		activeFillType = $(this).data('type');
		for (var k in controls)
			if (k === activeFillType)
				$(controls[k].control).show(500);
			else
				$(controls[k].control).hide(500);
		
		$("img", selectorDiv).removeClass('selectedType');
		$(this).addClass('selectedType');
        $(_this).change();
	});
    
    var fillColor = _fillStyle.color;
	var fillOpacity = _fillStyle.opacity;
    
	//выбор цвета
	var fillColorPicker = _mapHelper.createColorPicker(fillColor,
		function (colpkr){
			$(colpkr).fadeIn(500);
			return false;
		},
		function (colpkr){
			$(colpkr).fadeOut(500);
            $(_this).change();
			return false;
		},
		function (hsb, hex, rgb) {
			fillColorPicker.style.backgroundColor = '#' + hex;
            fillColor = parseInt("0x" + hex);
            $(_this).change();
		}),
	fillOpacitySlider = _mapHelper.createSlider(fillOpacity,
		function(event, ui)
		{
            fillOpacity = ui.value;
            $(_this).change();
		});
		
	colorContainer.append($("<table/>").append($("<tr/>")
		.append($("<td/>").append(fillColorPicker))
		.append($("<td/>").append(fillOpacitySlider))
	));
	
	//выбор внешнего паттерна
	var patternURL = $("<input/>", {"type":"text", title: _gtxt("URL рисунка")}).val(_fillStyle.image).change(function()
    {
        $(_this).change();
    });
	imagePatternContainer.append(patternURL);
	
	//выбор втроенных паттернов
    var patternTypeIcons = [
        ['horizontal', 'img/styles/horisontal.png'],
        ['vertical',   'img/styles/vertical.png'  ],
        ['diagonal1',  'img/styles/diagonal1.png' ],
        ['diagonal2',  'img/styles/diagonal2.png' ],
        ['circle',     'img/styles/circle.png'    ],
        ['cross',      'img/styles/cross.png'     ]
    ];
    
    var patternStyleSelector = $("<div/>", {id: "patternStyleSelector"});
    for (var i = 0; i < patternTypeIcons.length; i++)
    {
        var icon = $('<img/>', {src: patternTypeIcons[i][1]}).data("style", patternTypeIcons[i][0]);
        patternStyleSelector.append(icon);
        if (patternTypeIcons[i][0] === _fillStyle.pattern.style)
            icon.addClass('activePatternType');
    }
        
    $("img", patternStyleSelector).click(function()
    {
        $("img", patternStyleSelector).removeClass('activePatternType');
        $(this).addClass('activePatternType');
        _fillStyle.pattern.style = $(this).data("style");
        $(_this).change();
    });
    
    var patternOpacity = _fillStyle.opacity;
	var patternOpacitySlider = _mapHelper.createSlider( _fillStyle.opacity, function(event, ui)
    {
        patternOpacity = ui.value;
        $(_this).change();
    });
	$(patternOpacitySlider).attr({id: "patternOpacitySlider"});
    
    var patternOpacityContainer = $('<div/>', {'class': 'patternOpacityContainer'})
        .append($('<table/>').append($('<tr/>')
            .append($('<td/>').append($('<img/>', {src:'img/styles/pattern-opacity.PNG', 'class': 'opacityIcon'})))
            .append($('<td/>').append(patternOpacitySlider))
        ));
		
	var widthIcon = $("<img/>", {src: 'img/styles/pattern-width.PNG'});
	var stepIcon = $("<img/>", {src: 'img/styles/pattern-step.PNG', 'class': 'stepIcon'});
	
    var widthInput = $("<input/>", {'class': 'widthInput', title: _gtxt("Ширина паттерна")}).val(_fillStyle.pattern.width).change(function()
    {
        $(_this).change();
    });
    
    var stepInput = $("<input/>", {title: _gtxt("Ширина отступа")}).val(_fillStyle.pattern.step).change(function()
    {
        $(_this).change();
    });
    
	var widthStepInputs = $("<table/>", {'class': "widthStepTable"}).append($("<tr/>")
		.append($("<td/>").append(widthIcon).append(widthInput))
		.append($("<td/>").append(stepIcon).append(stepInput))
	);
	
	var PatternColorControl = function(parentDiv, initColors)
	{
		var _parentDiv = $(parentDiv);
		var _colors = initColors;
        var _this = this;
		var _redraw = function()
		{
			_parentDiv.empty();
			var table = $('<table/>', {'class': 'patternColorControl'});
			for (var k = 0; k < _colors.length; k++)
			(function(k){
				
				if (_colors[k] === null) return;
				
				var colorPicker = _mapHelper.createColorPicker(_colors[k],
					function (colpkr){
						$(colpkr).fadeIn(500);
						return false;
					},
					function (colpkr){
						$(colpkr).fadeOut(500);
                        $(_this).change();
						return false;
					},
					function (hsb, hex, rgb) {
						colorPicker.style.backgroundColor = '#' + hex;
						_colors[k] = parseInt('0x' + hex);
                        $(_this).change();
					});
				colorPicker.style.width = '100%';
				
				var deleteIcon = makeImageButton('img/close.png', 'img/close_orange.png');
					deleteIcon.onclick = function()
					{
						_colors[k] = null;
						_redraw();
                        $(_this).change();
					}
			
				table.append($("<tr/>")
					.append($("<td/>", {'class': 'patternColorPicker'}).append(colorPicker))
					.append($("<td/>", {'class': 'patternColorDelete'}).append(deleteIcon))
				);
				
			})(k);
			
			var addIcon = makeImageButton('img/zoom_plus.png', 'img/zoom_plus_a.png');
			addIcon.onclick = function()
			{
				var initColor = 0x00FF00;
				for (var c = 0; c < _colors.length; c++)
					if (_colors[c] !== null) 
						initColor = _colors[c];
						
				_colors.push(initColor);
				_redraw();
                $(_this).change();
			};
			
			table.append($("<tr/>")
				.append($("<td/>", {'class': 'patternColorPicker'}))
				.append($("<td/>").append(addIcon))
			);
			
			_parentDiv.append(table);
		}
		
		_redraw();
        
        this.getColors = function()
        {
            var res = [];
            for (var c = 0; c < _colors.length; c++)
                if (_colors[c] !== null )
                    res.push(_colors[c]);
            return res; 
        }
	}
	
	var patternColorSelector = $("<div/>");
	var patternColorControl = new PatternColorControl(patternColorSelector, _fillStyle.pattern.colors);
    $(patternColorControl).change(function()
    {
        $(_this).change();
    });
	
	patternContainer.append(patternStyleSelector).append(patternOpacityContainer).append(widthStepInputs).append(patternColorSelector);
		
	var fillControlsDiv = $("<div/>", {'class': 'fillStyleControls'}).append(colorContainer).append(imagePatternContainer).append(patternContainer);
	
    //public interface
	this.getSelector = function()
	{
		return selectorDiv;
	}
	
	this.getControls = function()
	{
		return fillControlsDiv;
	}
    
    this.getFillStyle = function()
    {
        var fillStyle = {};
        if (activeFillType === 'color')
        {
            fillStyle.color = fillColor;
            fillStyle.opacity = fillOpacity;
        }
        else if (activeFillType === 'bitmapPattern')
        {
            fillStyle.image = patternURL.val();
        } 
        else if (activeFillType === 'pattern')
        {
            fillStyle.pattern = { 
                style: _fillStyle.pattern.style,
                width: parseInt(widthInput.val()),
                step: parseInt(stepInput.val()),
                colors: patternColorControl.getColors()
            };
            fillStyle.opacity = patternOpacity;
        }
        
        return fillStyle;
    }
    
    this.setVisibleSelectors = function(isVisible)
    {
        if (isVisible)
            selectorIconsDiv.show(500);
        else
            selectorIconsDiv.hide(500);
    }
}

mapHelper.prototype.createStyleEditor = function(parent, parentObject, templateStyle, geometryType, elemCanvas)
{
	var markerSizeParent = _tr(),
        outlineParent = _tr(),
		fillParent = _tr(),
		iconParent = _tr(),
		outlineTitleTds = [],
		fillTitleTds = [],
		iconTitleTds = [],
		outlineTds = [],
		fillTds = [],
		iconTds = [],
		inputUrl,
		fillToggle,
		outlineToggle,
		iconToggle,
		showIcon,
		showMarker,
		hideIcon,
		angle,
		scale,
		_this = this;
	
	_(parent, [_table([_tbody([outlineParent, markerSizeParent, fillParent, iconParent])],[['css','marginLeft','-20px']])]);
	
	var fillStyleControl = new this.FillStyleControl(templateStyle, {showSelectors: geometryType !== 'point'});
    $(fillStyleControl).change(function()
    {
        var fillStyle = fillStyleControl.getFillStyle();
        templateStyle.fill = fillStyle;
        _this.setMapStyle(parentObject, templateStyle);
    });
	
	showIcon = function()
	{
		_this.hideStyle(outlineParent);
		_this.hideStyle(fillParent);
        fillStyleControl.setVisibleSelectors(false);
		_this.showStyle(iconParent);
		
		templateStyle.marker = {};
		templateStyle.marker.image = inputUrl.value;
		templateStyle.marker.center = true;
		
		delete templateStyle.outline;
		delete templateStyle.fill;

		if (geometryType == "point")
		{
			if (typeof elemCanvas.parentNode.properties != 'undefined' &&
				elemCanvas.parentNode.properties.content.properties.description &&
				String(elemCanvas.parentNode.properties.content.properties.description).toLowerCase().indexOf('карта ветра') == 0)
			{
				if (angle.value != '')
					templateStyle.marker.angle = angle.value;
				
				if (scale.value != '')
					templateStyle.marker.scale = scale.value;
				
				templateStyle.marker.color = $(iconParent).find(".colorSelector")[0].hex;				
			}
            _this.hideStyle(markerSizeParent);
		}
		
		if (geometryType != "linestring")
        {
			fillToggle.disabled = true;
        }
			
		_this.setMapStyle(parentObject, templateStyle);
	}
	
	showMarker = function()
	{
		_this.showStyle(outlineParent);
        _this.showStyle(markerSizeParent);
		_this.hideStyle(iconParent);
		
		if (geometryType != "linestring")
		{
			if (fillToggle.checked)
            {
				_this.showStyle(fillParent);
                fillStyleControl.setVisibleSelectors(true);
            }
			
			if (geometryType == "point")
			{
				templateStyle.marker = {};
				templateStyle.marker.size = Number($(markerSizeParent).find(".inputStyle").val());
			}
			
            templateStyle.fill = fillStyleControl.getFillStyle();			
			fillToggle.disabled = false;
		}
		
		if (geometryType != "point" && typeof templateStyle.marker != 'undefined')
			delete templateStyle.marker;
		
		templateStyle.outline = {};
		templateStyle.outline.thickness = Number($(outlineParent).find(".inputStyle")[0].value);
		templateStyle.outline.color = $(outlineParent).find(".colorSelector")[0].hex;
		templateStyle.outline.opacity = $($(outlineParent).find(".ui-slider")[0]).slider('option', 'value');

		_this.setMapStyle(parentObject, templateStyle);
	}
	
	outlineToggle = _checkbox(geometryType == "point" && typeof templateStyle.marker != 'undefined' && typeof templateStyle.marker.image == 'undefined' || geometryType != "point" && (typeof templateStyle.marker == 'undefined' || typeof templateStyle.marker != 'undefined' && typeof templateStyle.marker.image == 'undefined'),'radio');
	outlineToggle.onclick = function()
	{
		showMarker();
		
		iconToggle.checked = false;
		this.checked = true;
	}
	
	outlineTitleTds.push(_td([outlineToggle],[['css','width','20px'],['css','height','24px']]));
	outlineTitleTds.push(_td([_t(_gtxt("Граница"))],[['css','width','70px']]));
	
	var outlineColor = this.createColorPicker((templateStyle.outline && typeof templateStyle.outline.color != 'undefined') ? templateStyle.outline.color : 0x0000FF,
		function (colpkr){
			$(colpkr).fadeIn(500);
			return false;
		},
		function (colpkr){
			$(colpkr).fadeOut(500);
			return false;
		},
		function (hsb, hex, rgb) {
			outlineColor.style.backgroundColor = '#' + hex;
			
			templateStyle.outline.color = outlineColor.hex = parseInt('0x' + hex);
			
			if (elemCanvas.nodeName == 'DIV')
				$(elemCanvas).find(".borderIcon")[0].style.borderColor = '#' + hex;
			
			_this.setMapStyle(parentObject, templateStyle);
		})
	
	if (templateStyle.outline && typeof templateStyle.outline.color != 'undefined')
		outlineColor.hex = templateStyle.outline.color;
	else
		outlineColor.hex = 0x0000FF;

	outlineTds.push(_td([outlineColor],[['css','width','40px']]));
		
	var divSlider = this.createSlider((templateStyle.outline && typeof templateStyle.outline.opacity != 'undefined') ? templateStyle.outline.opacity : 100,
			function(event, ui)
			{
				templateStyle.outline.opacity = ui.value;
				
				_this.setMapStyle(parentObject, templateStyle);
			})

	outlineTds.push(_td([divSlider],[['css','width','100px'],['css','padding','4px 5px 3px 5px']]));
	
	var outlineThick = this.createInput((templateStyle.outline && typeof templateStyle.outline.thickness != 'undefined') ? templateStyle.outline.thickness : 2,
			function()
			{
				templateStyle.outline.thickness = Number(this.value);
				
				_this.setMapStyle(parentObject, templateStyle);
				
				return true;
			});

	_title(outlineThick, _gtxt("Толщина линии"));
	
	outlineTds.push(_td([outlineThick],[['css','width','30px']]));
	
	var dashInput = _input(null, [['attr', 'value', templateStyle.outline && typeof templateStyle.outline.dashes != 'undefined' ? templateStyle.outline.dashes : ''],['dir','className','inputStyle'],['css','width','140px']]),
		dashSelect = _select(null, [['dir','className','selectStyle'],['css','width','50px'],['css','fontSize','12px'],['css','fontWeight','bold']]),
		borderValues = {
				"1" : "",
				"2" : "4,4",
				"3" : "2,2",
				"4" : "6,3,2,3",
				"5" : "6,3,2,3,2,3",
				"6" : "2,4",
				"7" : "6,6",
				"8" : "7,6,2,6",
				"9" : "8,4,8,4,2,4"
			},
		dashSelector = _div(null,[['dir','className','colorSelector']]),
		dashTable = _table(null, [['css','position','absolute'],['css','left','-1px'],['css','top','-57px'],['css','zIndex',2]]),
		dashedTds = [],
		dashFunc = function()
		{
			var arr = dashInput.value.split(","),
				correct = true;
			
			if (arr.length % 2 == 0)
			{
				for (var i = 0; i < arr.length; i++)
				{
					arr[i] = Number(arr[i]);
					
					if (isNaN(arr[i]) || arr[i] <= 0)
					{
						correct = false;
						
						break;
					}
				}
			}
			else
				correct = false;
			
			if (correct)
				templateStyle.outline.dashes = arr;
			else
			{
				if (templateStyle.outline.dashes)
					delete templateStyle.outline.dashes;
			}
			
			_this.setMapStyle(parentObject, templateStyle);
		};
	
	if (geometryType != "point")
	{
		var dashTrs = []
		for (var i = 1; i <= 7; i+=3)
		{
			var dashTds = [];
			for (var j = i; j <= i + 2; j++)
			{
				var dashTd = _td([_img(null,[['attr','src','img/dash' + j + '.png']])],[['css','border','1px solid #000000'],['css','cursor','pointer']]);
				
				(function(j){
					dashTd.onclick = function(e)
					{
						dashSelector.style.backgroundImage = 'url(img/dash' + j + '.png)';
						
						dashInput.value = borderValues[String(j)];
						dashFunc();
						
						$(dashTable).fadeOut(500);
						
						stopEvent(e);
					}
				})(j)
				
				dashTds.push(dashTd)
			}
			
			dashTrs.push(_tr(dashTds))
		}
		
		_(dashTable, [_tbody(dashTrs)]);
		
		_(dashSelector, [dashTable]);
		
		dashSelector.onclick = function()
		{
			$(dashTable).fadeIn(500);
		}
		
		dashInput.onfocus = dashSelector.onblur = function()
		{
			$(dashTable).fadeOut(500);
		}
		
		dashTable.style.display = 'none';
		
		dashedTds.push(_td([dashSelector]));
		dashedTds.push(_td([dashInput],[['attr','colSpan',2]]));

		for (var borderValue in borderValues)
		{
			if (borderValues[borderValue] == dashInput.value)
			{
				dashSelector.style.backgroundImage = 'url(img/dash' + borderValue + '.png)';
				
				break;
			}
		}
		
		dashSelect.style.marginLeft = '2px';
		
		dashInput.onkeyup = function()
		{
			dashFunc();
			
			return true;
		}
	}
	else
		dashedTds = [_td(),_td(),_td()]
	
	if (geometryType != "linestring")
	{
		fillToggle = _checkbox(typeof templateStyle.fill != 'undefined','checkbox');
		fillToggle.onclick = function()
		{
            fillStyleControl.setVisibleSelectors(this.checked);
			if (this.checked)
			{
                 templateStyle.fill = fillStyleControl.getFillStyle();
				_this.showStyle(fillParent);
				
				//templateStyle.fill = {};
				//templateStyle.fill.color = $(fillParent).find(".colorSelector")[0].hex;
				//templateStyle.fill.opacity = $($(fillParent).find(".ui-slider")[0]).slider('option', 'value');
				
				//if (elemCanvas.nodeName == 'DIV')
					//$(elemCanvas).find(".fillIcon")[0].style.backgroundColor = $(fillParent).find(".colorSelector")[0].style.backgroundColor;
																
				_this.setMapStyle(parentObject, templateStyle);
			}
			else
			{
				_this.hideStyle(fillParent);
				
				delete templateStyle.fill;
				
				if (elemCanvas.nodeName == 'DIV')
					$(elemCanvas).find(".fillIcon")[0].style.backgroundColor = "#FFFFFF";
				
				_this.setMapStyle(parentObject, templateStyle);
			}
		}
		
		fillTitleTds.push(_td([fillToggle],[['css','width','20px'],['css','height','24px']]));
		//fillTitleTds.push(_td([_t(_gtxt("Заливка"))],[['css','width','70px']]));
		fillTitleTds.push(_td([fillStyleControl.getSelector()[0]],[['css','width','70px']]));
		
		var checkedFillColor = (typeof templateStyle.fill != 'undefined' && typeof templateStyle.fill.color != 'undefined') ? templateStyle.fill.color : 0xFFFFFF,
			checkedFillOpacity = (typeof templateStyle.fill != 'undefined' && typeof templateStyle.fill.opacity != 'undefined') ? templateStyle.fill.opacity : 0,
			fillColor = this.createColorPicker(checkedFillColor,
				function (colpkr){
					$(colpkr).fadeIn(500);
					return false;
				},
				function (colpkr){
					$(colpkr).fadeOut(500);
					return false;
				},
				function (hsb, hex, rgb) {
					fillColor.style.backgroundColor = '#' + hex;
					
					templateStyle.fill.color = fillColor.hex = parseInt('0x' + hex);
					
					if (elemCanvas.nodeName == 'DIV')
						$(elemCanvas).find(".fillIcon")[0].style.backgroundColor = '#' + hex;
					
					_this.setMapStyle(parentObject, templateStyle);
				}),
			fillSlider = this.createSlider(checkedFillOpacity,
				function(event, ui)
				{
					templateStyle.fill.opacity = ui.value;
					
					_this.setMapStyle(parentObject, templateStyle);
				});
		
		fillColor.hex = checkedFillColor;
		
		fillTds.push(_td([fillColor],[['css','width','40px']]));
		fillTds.push(_td([fillSlider],[['css','width','100px'],['css','padding','4px 5px 3px 5px']]));
	}

	iconToggle = _checkbox(templateStyle.marker && typeof templateStyle.marker.image != 'undefined','radio');
	iconToggle.onclick = function()
	{
		showIcon();
		
		outlineToggle.checked = false;
		this.checked = true;
	}
	
	iconTitleTds.push(_td([iconToggle],[['css','width','20px'],['css','height','24px'],['attr','vAlign','top'],['css','paddingTop',$.browser.msie ? '2px' : '5px']]));
	iconTitleTds.push(_td([_t(_gtxt("Маркер URL"))],[['css','width','70px'],['attr','vAlign','top'],['css','paddingTop','5px']]));

	inputUrl = _input(null, [['dir','className','inputStyle'],['attr','value', (typeof templateStyle.marker != 'undefined' && templateStyle.marker.image) ? templateStyle.marker.image : ''],['css','width','180px']]);
	
	inputUrl.onkeyup = function()
	{
		if (this.value != '')
/*		{
			showMarker();
			
			outlineToggle.checked = true;
			iconToggle.checked = false;
		}
		else*/
		{
			showIcon();
			
			outlineToggle.checked = false;
			iconToggle.checked = true;
		}
		
		if (typeof templateStyle.marker == 'undefined')
			templateStyle.marker = {};
			
		templateStyle.marker.image = this.value;
		
		_this.setMapStyle(parentObject, templateStyle);
	}
	
	_title(inputUrl, _gtxt("Url изображения"));
	
	if (geometryType == "point")
	{
		// var markerSize = this.createInput(templateStyle.marker && templateStyle.marker.size || 3,
			// function()
			// {
				// templateStyle.marker.size = Number(this.value);
				
				// _this.setMapStyle(parentObject, templateStyle);
				
				// return true;
			// })
		
		// _title(markerSize, _gtxt("Размер точек"));
		//fillTds.push(_td([markerSize],[['css','width','30px']]));
        
        var markerSizeInput = this.createInput(templateStyle.marker && templateStyle.marker.size || 3,
			function()
			{
				templateStyle.marker.size = Number(this.value);
				
				_this.setMapStyle(parentObject, templateStyle);
				
				return true;
			})
		
        _title(markerSizeInput, _gtxt("Размер точек"));
		
        var markerSizeTds = [_td(), _td([_t("Размер")]), _td([markerSizeInput], [['attr','fade',true]])];
        _(markerSizeParent, markerSizeTds, [['attr','fade',true]]);
		
		
		if (typeof elemCanvas.parentNode.properties != 'undefined' &&
			elemCanvas.parentNode.properties.content.properties.description &&
			String(elemCanvas.parentNode.properties.content.properties.description).toLowerCase().indexOf('карта ветра') == 0)
		{
			var markerColor = this.createColorPicker((templateStyle.marker && typeof templateStyle.marker.color != 'undefined') ? templateStyle.marker.color : 0xFF00FF,
				function (colpkr){
					$(colpkr).fadeIn(500);
					return false;
				},
				function (colpkr){
					$(colpkr).fadeOut(500);
					return false;
				},
				function (hsb, hex, rgb) {
					markerColor.style.backgroundColor = '#' + hex;
					
					templateStyle.marker.color = markerColor.hex = parseInt('0x' + hex);
					
					_this.setMapStyle(parentObject, templateStyle);
				})
			
			if (templateStyle.marker && typeof templateStyle.marker.color != 'undefined')
				markerColor.hex = templateStyle.marker.color;
			else
				markerColor.hex = 0xFF00FF;
		
			scale = _input(null, [['dir','className','inputStyle'],['attr','value', (templateStyle.marker && templateStyle.marker.scale) ? templateStyle.marker.scale : ''],['css','width','68px']]);
			
			scale.onkeyup = function()
			{
				if (this.value != '')
					templateStyle.marker.scale = this.value;
				else
					delete templateStyle.marker.scale;
				
				_this.setMapStyle(parentObject, templateStyle);
			}
			
			_title(scale, _gtxt("Масштаб"))
			
			angle = _input(null, [['dir','className','inputStyle'],['attr','value', (templateStyle.marker && templateStyle.marker.angle) ? templateStyle.marker.angle : ''],['css','width','68px']]);
			
			angle.onkeyup = function()
			{
				if (this.value != '')
					templateStyle.marker.angle = this.value;
				else
					delete templateStyle.marker.angle;
				
				_this.setMapStyle(parentObject, templateStyle);
			}
			
			_title(angle, _gtxt("Угол поворота"))
			
			iconTds.push(_td([_table([_tbody([_tr([_td([inputUrl], [['attr','colSpan',3]])]),
												_tr([_td([markerColor], [['css','paddingLeft','1px']]), _td([angle]), _td([scale], [['css','paddingRight','3px']])])])])]));
		}
		else
			iconTds.push(_td([inputUrl]));
	}
	else if (geometryType == "polygon" || geometryType == "linestring")
	{
	//	hide(iconParent);
	
		iconTds.push(_td([inputUrl]));
		
		if (geometryType == "linestring")
			hide(fillParent);
	}
	
	_(outlineParent, outlineTitleTds.concat(_td([_div([_table([_tbody([_tr(outlineTds), _tr(dashedTds)])])],[['attr','fade',true]])])));
    
	//_(fillParent, fillTitleTds.concat(_td([_div([_table([_tbody([_tr(fillTds)])])],[['attr','fade',true]])])));
    var topPadding = geometryType === "point" ? "0px" : "10px";
	 fillTitleTds = fillTitleTds.concat(_td([fillStyleControl.getControls()[0]], [['attr','fade',true], ['css', 'paddingTop', topPadding]]));
	 _(fillParent, fillTitleTds);
	
	_(iconParent, iconTitleTds.concat(_td([_div([_table([_tbody([_tr(iconTds)])])],[['attr','fade',true]])])));
	
//	if (geometryType == "point")
//	{
		if (templateStyle.marker && typeof templateStyle.marker.image != 'undefined')
		{
			$(outlineParent).find("[fade]")[0].style.display = 'none';
			$(fillParent).find("[fade]")[0].style.display = 'none';
			$(iconParent).find("[fade]")[0].style.display = '';
		}
		else
		{
			$(outlineParent).find("[fade]")[0].lastChild.style.display = '';
			$(fillParent).find("[fade]")[0].style.display = '';
			$(iconParent).find("[fade]")[0].style.display = 'none';
		}
//	}
	
	if (geometryType != "linestring" && typeof templateStyle.fill == 'undefined')
		$(fillParent).find("[fade]")[0].style.display = 'none';
}

mapHelper.prototype.createStylesEditorIcon = function(parentStyles, type)
{
	var icon;
	
	if (isArray(parentStyles) && parentStyles.length > 1)
		icon =  _img(null, [['attr','src','img/misc.png'],['css','margin','0px 2px -3px 4px'],['css','cursor','pointer'],['attr','styleType','multi']]);
	else 
	{
		var parentStyle = this.makeStyle(parentStyles[0]);
		
		if (parentStyle.marker && parentStyle.marker.image)
		{
			if (typeof parentStyle.marker.color == 'undefined')
			{
				icon = _img(null, [['attr','src',parentStyle.marker.image],['dir','className','icon'],['attr','styleType','icon']]);
				
				var fixFunc = function()
					{
						var width = icon.offsetWidth,
							height = icon.offsetHeight,
							scaleX = 14.0 / width,
							scaleY = 14.0 / height,
							scale = Math.min(scaleX, scaleY);
						
						setTimeout(function()
						{
							icon.style.width = Math.round(width * scale) + 'px';
							icon.style.height = Math.round(height * scale) + 'px';
						}, 10);
					},
					loadFunc = function()
					{
						if (icon.offsetWidth)
							fixFunc();
						else
							setTimeout(loadFunc, 50)
					};
				
				icon.onload = function()
				{
					loadFunc();
				}
			}
			else
			{
				var dummyStyle = {};
				
				$.extend(dummyStyle, parentStyle);
				
				dummyStyle.outline = {color: parentStyle.marker.color, opacity: 100};
				dummyStyle.fill = {color: parentStyle.marker.color, opacity: 100};
				
				icon = this.createGeometryIcon(dummyStyle, type);
			
				if ($.browser.msie)
				{
					icon.style.width = '9px';
					icon.style.height = '13px';
					icon.style.margin = '0px 3px -3px 1px';
				}
			}
		}
		else
		{
			icon = this.createGeometryIcon(parentStyle, type);
			
			if ($.browser.msie)
			{
				icon.style.width = '9px';
				icon.style.height = '13px';
				icon.style.margin = '0px 3px -3px 1px';
			}
		}
	}
	
	_title(icon, _gtxt("Редактировать стили"));
	
	icon.geometryType = type;
	
	return icon;
}

mapHelper.prototype.createGeometryIcon = function(parentStyle, type)
{
	var icon = _div(null, [['css','display',($.browser.msie) ? 'inline' : 'inline-block'],['dir','className','colorIcon'],['attr','styleType','color'],['css','backgroundColor','#FFFFFF']]);
	
	if (type.indexOf('linestring') < 0)
	{
		var fill = _div(null, [['dir','className','fillIcon'],['css','backgroundColor',(parentStyle.fill && typeof parentStyle.fill.color != 'undefined') ? this.convertColor(parentStyle.fill.color) : "#FFFFFF"]]),
			border = _div(null, [['dir','className','borderIcon'],['attr','styleType','color'],['css','borderColor',(parentStyle.outline && typeof parentStyle.outline.color != 'undefined') ? this.convertColor(parentStyle.outline.color) : "#0000FF"]]),
			fillOpacity = (parentStyle.fill && typeof parentStyle.fill.opacity != 'undefined') ? parentStyle.fill.opacity : 100,
			borderOpacity = (parentStyle.outline && typeof parentStyle.outline.opacity != 'undefined') ? parentStyle.outline.opacity : 100;
		
		if ($.browser.msie)
		{
			fill.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity=" + fillOpacity + ")";
			border.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity=" + borderOpacity + ")";
			
			border.style.width = '9px';
			border.style.height = '13px';
		}
		else
		{
			fill.style.opacity = fillOpacity / 100;
			border.style.opacity = borderOpacity / 100;
		}
		
		if (type.indexOf('point') > -1)
		{
			if ($.browser.msie)
			{
				border.style.height = '7px';
				fill.style.height = '5px';
				border.style.width = '7px';
				fill.style.width = '5px';
			}
			else
			{
				border.style.height = '5px';
				fill.style.height = '5px';
				border.style.width = '5px';
				fill.style.width = '5px';
			}
			
			border.style.top = '3px';
			fill.style.top = '4px';
			border.style.left = '1px';
			fill.style.left = '2px';
		}
		
		_(icon, [border, fill]);
	}
	else
	{
		var border = _div(null, [['dir','className','borderIcon'],['attr','styleType','color'],['css','borderColor',(parentStyle.outline && typeof parentStyle.outline.color != 'undefined') ? this.convertColor(parentStyle.outline.color) : "#0000FF"]]),
			borderOpacity = (parentStyle.outline && typeof parentStyle.outline.opacity != 'undefined') ? parentStyle.outline.opacity : 100;

		if ($.browser.msie)
		{
			border.style.filter = "progid:DXImageTransform.Microsoft.Alpha(opacity=" + borderOpacity + ")";
			
			border.style.width = '5px';
			border.style.height = '13px';
		}
		else
		{
			border.style.opacity = borderOpacity / 100;
			
			border.style.width = '4px';
			border.style.height = '13px';
		}
		
		border.style.borderTop = 'none';
		border.style.borderBottom = 'none';
		border.style.borderLeft = 'none';
		
		_(icon, [border]);
	}
	
	icon.oncontextmenu = function(e)
	{
		return false;
	}
	
	return icon;
}

mapHelper.prototype.createLoadingLayerEditorProperties = function(div, parent, layerProperties)
{
	var elemProperties = div.properties.content.properties,
		loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t('загрузка...')], [['css','margin','3px 0px 3px 20px']]),
		layerRights = _queryMapLayers.layerRights(elemProperties.name)
		_this = this;
	
	if (!layerRights)
	{
		_(parent, [_div([_t(_gtxt("Авторизуйтесь для редактирования настроек слоя"))],[['css','padding','5px 0px 5px 5px'],['css','color','red']])]);
	}
	else if (layerRights != "edit")
	{
		_(parent, [_div([_t(_gtxt("Недостаточно прав для редактирования настроек слоя"))],[['css','padding','5px 0px 5px 5px'],['css','color','red']])]);
	}
	else
	{
		if (elemProperties.type == "Vector")
		{
			_this.createLayerEditorProperties(div, div.properties.content.properties.type, parent, layerProperties);
			
			return;
		}
		else
		{
			if (elemProperties.LayerID)
			{
				_(parent, [loading]);
			
				sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerInfo.ashx?WrapStyle=func&LayerID=" + elemProperties.LayerID, function(response)
				{
					if (!parseResponse(response))
						return;
					
					loading.removeNode(true);
					
					_this.createLayerEditorProperties(div, div.properties.content.properties.type, parent, response.Result)
				})
			}
		}
	}
}

mapHelper.prototype.createLayerEditorProperties = function(div, type, parent, properties)
{
	var getFileExt = function(path)
	{
		return String(path).substr(String(path).lastIndexOf('.') + 1, path.length);
	}
	
	var _this = this,
		vectorRetilingFlag = false;

	var title = _input(null,[['attr','fieldName','title'],['attr','value',div ? (div.properties.content.properties.title ? div.properties.content.properties.title : '') :  (typeof properties.Title != 'undefined' ? properties.Title : '')],['dir','className','inputStyle'],['css','width','220px']])
	title.onkeyup = function()
	{
		if (div)
		{
			var span = $(div).find(".layer")[0];
		
			removeChilds(span);
			
			_(span, [_t(title.value)]);

			div.properties.content.properties.title = title.value;
			
			_this.findTreeElem(div).elem.content.properties = div.properties.content.properties;
		}
		
		return true;
	}
	
	var copyright = _input(null,[['attr','fieldName','copyright'],['attr','value',div ? (div.properties.content.properties.Copyright ? div.properties.content.properties.Copyright : '') : (typeof properties.Copyright != 'undefined' ? properties.Copyright : '')],['dir','className','inputStyle'],['css','width','220px']])
	copyright.onkeyup = function()
	{
		if (div)
		{
			globalFlashMap.layers[div.properties.content.properties.name].setCopyright(copyright.value);
			
			div.properties.content.properties.Copyright = copyright.value;
			
			_this.findTreeElem(div).elem.content.properties = div.properties.content.properties;
		}
		
		return true;
	}
	
	var legend = _input(null,[['attr','fieldName','Legend'],['attr','value',div ? (div.properties.content.properties.Legend ? div.properties.content.properties.Legend : '') : (typeof properties.Legend != 'undefined' ? properties.Legend : '')],['dir','className','inputStyle'],['css','width','220px']])
	legend.onkeyup = function()
	{
		if (div)
		{
			div.properties.content.properties.Legend = legend.value;
			
			_this.findTreeElem(div).elem.content.properties = div.properties.content.properties;
		}
		
		return true;
	}
	
	var descr = _textarea(null,[['attr','fieldName','description'],['dir','className','inputStyle'],['css','width','220px'],['css','height','50px']]);
	descr.value = div ? (div.properties.content.properties.description ? div.properties.content.properties.description : '') : (properties.Description != null ? properties.Description : '');
	
	descr.onkeyup = function()
	{
		if (div)
		{
			var span = $(div).find(".layerDescription")[0];
		
			removeChilds(span);
			
			span.innerHTML = descr.value;

			div.properties.content.properties.description = descr.value;
			
			_this.findTreeElem(div).elem.content.properties = div.properties.content.properties;
		}
		
		return true;
	}
	
	var dateField = _input(null,[['attr','fieldName','date'],['attr','value', typeof properties.Date != null ? properties.Date : ''],['dir','className','inputStyle'],['css','width','100px']]);
	
	if (!div)
	{
		var today = new Date(),
			todayDate = today.getDate(),
			todayMonth = today.getMonth() + 1,
			todayYear = today.getFullYear();
		
		// Для растровых слоёв заставим пользователя вводить дату, для векторых подставляем сегодняшний день по умолчанию
		if (type === "Vector")
		{
		dateField.value = (todayDate < 10 ? '0' + todayDate : todayDate) + '.' + (todayMonth < 10 ? '0' + todayMonth : todayMonth) + '.' + todayYear;
	}
		else
		{
			dateField.value = '';
		}
	}

	var shownProperties = [];
		
	shownProperties.push({name: _gtxt("Имя"), field: 'Title', elem: title});
	shownProperties.push({name: _gtxt("Копирайт"), field: 'Copyright', elem: copyright});
	
	if (div)
		shownProperties.push({name: _gtxt("ID"), field: 'Name'});
							
	shownProperties.push({name: _gtxt("Описание"), field: 'Description', elem: descr});
	
	if (type != "Vector")
		shownProperties.push({name: _gtxt("Легенда"), field: 'Legend', elem: legend});
	
	shownProperties.push({name: _gtxt("Дата"), field: 'Date', elem: dateField});
	
	var columnsParent = _div();
	var encodingParent = _div();
	var temporalLayerParent = _div(null, [['dir', 'className', 'TemporalLayer']]);
	
	//event: change
	var encodingWidget = (function()
	{
		var _encodings = {
			'windows-1251': 'windows-1251',
			'utf-8': 'utf-8',
			'koi8-r': 'koi8-r',
			'utf-7': 'utf-7',
			'iso-8859-5': 'iso-8859-5',
			'koi8-u': 'koi8-u',
			'cp866': 'cp866'
			
		};
		var _DEFAULT_ENCODING = 'windows-1251';
		var _curEncoding = _DEFAULT_ENCODING;
		
		//
		var _public = {
			drawWidget: function(container, initialEncoding)
			{
				initialEncoding = initialEncoding || _DEFAULT_ENCODING;
				var select = $("<select></select>").addClass('selectStyle VectorLayerEncodingInput');
				select.change(function()
				{
					_curEncoding = $('option:selected', select).val();
					$(_public).change();
				});
				
				var isStandard = false;
				for (var enc in _encodings)
				{
					var opt = $('<option></option>').val(enc).text(enc);
					
					if (_encodings[enc] === initialEncoding)
					{
						opt.attr('selected', 'selected');
						_curEncoding = enc;
						isStandard = true;
					}
						
					select.append(opt);
				}
				
				var anotherCheckbox = $("<input></input>", {'class': 'box', type: 'checkbox', id: 'otherEncoding'});
				var anotherInput = $("<input></input>", {'class': 'VectorLayerEncodingInput'});
				
				if (!isStandard)
				{
					anotherCheckbox[0].checked = 'checked';
					anotherInput.val(initialEncoding);
					select.attr('disabled', 'disabled');
				}
				else
				{
					anotherInput.attr('disabled', 'disabled');
				}
				
				anotherInput.bind('keyup', function()
				{
					_curEncoding = this.value;
					$(_public).change();
				});
				
				anotherCheckbox.click(function()
				{
					if (this.checked)
					{
						select.attr('disabled', 'disabled');
						anotherInput.removeAttr('disabled');
						anotherInput.focus();
						_curEncoding = anotherInput.val();
					}
					else
					{
						select.removeAttr('disabled');
						anotherInput.attr('disabled', 'disabled');
						_curEncoding = $('option:selected', select).val();
					}
					$(_public).change();
				});
				
				
				var tr1 = $("<tr></tr>")
					.append($("<td></td>").text(_gtxt("Кодировка")))
					.append($("<td></td>").append(select));
					
				var tr2 = $("<tr></tr>")
					.append($("<td></td>").append(anotherCheckbox).append($("<label></label>", {'for': 'otherEncoding'}).text(_gtxt("Другая"))))
					.append($("<td></td>").append(anotherInput));
				
				$(container)
					.append($("<table></table>", {'class': 'VectorLayerEncoding'})
						.append(tr1).append(tr2));
			},
			getServerEncoding: function()
			{
				return _curEncoding;
			}
		}
		
		return _public;
	})();
	
	if (type == "Vector")
	{
		var shapePath = _input(null,[['attr','fieldName','ShapePath.Path'],['attr','value',!properties.ShapePath ? properties.GeometryTable.TableName : properties.ShapePath.Path],['dir','className','inputStyle'],['css','width','220px']]),
			shapeFileLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
			tableLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
			trPath = _tr([_td([_t(_gtxt("Файл")), shapeFileLink, _br(), _t(_gtxt("Таблица")), tableLink],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
						  _td([shapePath, columnsParent, encodingParent, temporalLayerParent])]),
			tilePath = _div([_t(typeof properties.TilePath.Path != null ? properties.TilePath.Path : '')],[['css','marginLeft','3px'],['css','width','220px'],['css','whiteSpace','nowrap'],['css','overflowX','hidden']]),
			trTiles = _tr([_td([_t(_gtxt("Каталог с тайлами"))],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
						  _td([tilePath])]);
			// trTimeLayer = _tr([_td([_t("Временнóй слой")],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
						  // _td([_t("test")])]);
		
		shapePath.oldValue = shapePath.value;
		
		shapePath.onkeyup = function()
		{
			if (this.value != this.oldValue)
				vectorRetilingFlag = true;
			
			return true;
		}
		
		if (div && getFileExt(shapePath.value) === 'shp')
		{
			encodingWidget.drawWidget(encodingParent, properties.EncodeSource);
		}
		
		_title(tilePath, typeof properties.TilePath.Path != null ? properties.TilePath.Path : '')
		
		if (properties.ShapePath && properties.ShapePath.Path != null && properties.ShapePath.Path != '' && !properties.ShapePath.Exists)
			$(shapePath).addClass('error');

		if (properties.TilePath.Path != null && properties.TilePath.Path != '' && !properties.TilePath.Exists)
			tilePath.style.color = 'red';
		
		shapeFileLink.onclick = function()
		{
			_fileBrowser.createBrowser(_gtxt("Файл"), ['shp','tab', 'xls', 'xlsx', 'xlsm', 'mif', 'gpx', 'kml'], function(path)
			{
				shapePath.value = path;
				vectorRetilingFlag = true;
				
				var index = String(path).lastIndexOf('.'),
					ext = String(path).substr(index + 1, path.length);
				
				if (title.value == '')
				{
					var indexSlash = String(path).lastIndexOf('\\'),
						fileName = String(path).substring(indexSlash + 1, index);
					
					title.value = fileName;
				}
				
				if (valueInArray(['xls', 'xlsx', 'xlsm'], ext))
					_this.selectColumns(columnsParent, {url: serverBase + "VectorLayer/GetExcelColumns.ashx?WrapStyle=func&ExcelFile=" + encodeURIComponent(path) })
				else
					removeChilds(columnsParent);
					
				$(encodingParent).empty();
				if (ext === 'shp')
				{
					encodingWidget.drawWidget(encodingParent);
				}
			})
		}
		
		var temporalLayerParams = (function()
		{
			var PERIOD_STEP = 4;
			var _minPeriod = 1;
			var _maxPeriod = 1;
			var _columnName = null;
			var _isTemporal = false;
			return {
				setPeriods: function(minPeriod, maxPeriod) { _minPeriod = minPeriod; _maxPeriod = maxPeriod; },
				setColumnName: function(name) { _columnName = name; },
				getColumnName: function() { return _columnName; },
				getPeriodString: function()
				{
					var curPeriod = _minPeriod;
					var periods = [];
					while ( curPeriod <= _maxPeriod )
					{
						periods.push(curPeriod);
						curPeriod *= PERIOD_STEP;
					}
					return periods.join(',');
				},
				setTemporal: function(isTemporal) { _isTemporal = isTemporal; },
				getTemporal: function() { return _isTemporal; }
			}
		})();
		
		var TemporalLayerParamsControl = function( parentDiv, paramsModel, columns )
		{
			var temporalCheckbox = $("<input></input>", {'class': 'box', type: 'checkbox', id: 'timeLayer'});
			temporalCheckbox.change(function()
			{
				paramsModel.setTemporal(this.checked);
				propertiesTable.css('display', this.checked ? '' : 'none');
			});
			
			if (columns.length ==0)
				temporalCheckbox.attr('disabled', 'disabled');
			
			$(parentDiv)
				.append(temporalCheckbox)
				.append(
					$("<label></label>", {'for': 'timeLayer'}).text(_gtxt("Временнóй слой"))
				);
			
			var temporalPeriods = [1, 4, 16, 64, 256, 1024, 4096];
			
			var addOptions = function(select)
			{
				for (var k = 0; k < temporalPeriods.length; k++)
					select.append($("<option></option>", {periodIndex: k}).text(temporalPeriods[k]));
			}
				
			var selectMinPeriod = $("<select></select>", {'class': 'selectStyle'});
			addOptions(selectMinPeriod);
			var selectMaxPeriod = selectMinPeriod.clone();
			
			$([selectMinPeriod[0], selectMaxPeriod[0]]).change(function()
			{
				var minPeriod = parseInt($("option:selected", selectMinPeriod).attr('periodIndex'));
				var maxPeriod = parseInt($("option:selected", selectMaxPeriod).attr('periodIndex'));
				if (minPeriod > maxPeriod)
				{
					$([selectMinPeriod[0], selectMaxPeriod[0]]).addClass('ErrorPeriod');
				}
				else
				{
					$([selectMinPeriod[0], selectMaxPeriod[0]]).removeClass('ErrorPeriod');
					paramsModel.setPeriods(temporalPeriods[minPeriod], temporalPeriods[maxPeriod]);
				}
			});
			
			var selectDateColumn = $("<select></select>", {'class': 'selectStyle'});
			for (var i = 0; i < columns.length; i++)
			{
				selectDateColumn.append($("<option></option>").text(columns[i].Name));
			}
			
			selectDateColumn.change(function()
			{
				paramsModel.setColumnName( $("option:selected", this).val() );
			});
			
			temporalLayerParams.setColumnName(columns[0].Name);
			
			var tr0 = $('<tr></tr>')
						.append($('<td></td>').text(_gtxt('Колонка даты')))
						.append($('<td></td>').append(selectDateColumn));
			
			var tr1 = $('<tr></tr>')
						.append($('<td></td>').text(_gtxt('Минимальный период')))
						.append($('<td></td>').append(selectMinPeriod));
						
			var tr2 = $('<tr></tr>')
						.append($('<td></td>').text(_gtxt('Максимальный период')))
						.append($('<td></td>').append(selectMaxPeriod));
			
			var propertiesTable = $('<table></table>').append(tr0).append(tr1).append(tr2).appendTo(parentDiv);
			propertiesTable.css('display', 'none');
		}
		
		tableLink.onclick = function()
		{
			_tableBrowser.createBrowser(function(name)
			{
				shapePath.value = name;
				vectorRetilingFlag = true;
				
				if (title.value == '')
					title.value = name;
				
				_this.selectColumns(columnsParent, {url: serverBase + "VectorLayer/GetTableCoordinateColumns.ashx?WrapStyle=func&TableName=" + encodeURIComponent(name)})
				
				sendCrossDomainJSONRequest(serverBase + "VectorLayer/GetTableColumns.ashx?ColumnTypes=date&SourceName=" + encodeURIComponent(name), function(response)
				{
					if (!parseResponse(response)) return;
					var columns = response.Result;
					
					new TemporalLayerParamsControl(temporalLayerParent, temporalLayerParams, columns);
				});
			})
		}

		shapeFileLink.style.marginLeft = '3px';
		tableLink.style.marginLeft = '3px';
		
		var index = String(shapePath.value).lastIndexOf('.'),
			ext = String(shapePath.value).substr(index + 1, shapePath.value.length);
				
		// слой создан по таблице или excel файлу
		// и есть какие-нибудь данные
		if ((!properties.ShapePath || valueInArray(['xls', 'xlsx', 'xlsm'], ext)) && (properties.GeometryTable.XCol || properties.GeometryTable.YCol) &&
			properties.GeometryTable.Columns.length)
		{
			this.selectColumns(columnsParent, {
				fields: properties.GeometryTable.Columns,
				defaultX: properties.GeometryTable.XCol,
				defaultY: properties.GeometryTable.YCol
			});
			// var selectLat = _select(null, [['attr','selectLat',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]),
				// selectLon = _select(null, [['attr','selectLon',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]);

			// for (var i = 0; i < properties.GeometryTable.Columns.length; i++)
			// {
				// var opt = _option([_t(properties.GeometryTable.Columns[i])], [['attr','value',properties.GeometryTable.Columns[i]]]);
				
				// _(selectLat, [opt.cloneNode(true)]);
				// _(selectLon, [opt.cloneNode(true)]);
			// }
			
			// selectLon = switchSelect(selectLon, properties.GeometryTable.XCol);

			// selectLat = switchSelect(selectLat, properties.GeometryTable.YCol);
			
			// _(columnsParent, [_table([_tbody([_tr([_td([_span([_t(_gtxt("Y (широта)"))],[['css','margin','0px 3px']])], [['css','width','73px'],['css','border','none']]), _td([selectLat], [['css','width','150px'],['css','border','none']])]),
										// _tr([_td([_span([_t(_gtxt("X (долгота)"))],[['css','margin','0px 3px']])], [['css','width','73px'],['css','border','none']]), _td([selectLon], [['css','width','150px'],['css','border','none']])])])])])

		}
		
		shownProperties.push({tr:trPath});
		
		if (div)
			shownProperties.push({tr:trTiles});
		
		// shownProperties.push({tr:trTimeLayer});
		
		var boxSearch = _checkbox(div ? (div.properties.content.properties.AllowSearch ? div.properties.content.properties.AllowSearch : false) : (typeof properties.AllowSearch != 'undefined' ? properties.AllowSearch : false), 'checkbox');
		boxSearch.setAttribute('fieldName', 'AllowSearch');

		boxSearch.className = 'box';
		if ($.browser.msie)
			boxSearch.style.margin = '-3px -2px 0px -1px';
		else
			boxSearch.style.marginLeft = '3px';

		boxSearch.onclick = function()
		{
			if (div)
			{
				div.properties.content.properties.AllowSearch = this.checked;
				
				_this.findTreeElem(div).elem.content.properties = div.properties.content.properties;
			}
			
			return true;
		}
		
		if (div)
			shownProperties.push({name: _gtxt("Разрешить поиск"), elem: boxSearch});
			
		//редактирование полей слоя
		var boxManualAttributes = _checkbox(false, 'checkbox');
		var addAttribute = makeLinkButton("Добавить аттрибут");
		addAttribute.onclick = function()
		{
			attrModel.addAttribute(attrModel.TYPES.STRING, "NewAttribute");
		}
		
		//events: newAttribute, delAttribute, updateAttribute
		var attrModel = (function()
		{
			var _attributes = [];
			return {
				addAttribute: function(type, name)
				{
					_attributes.push({type: type, name: name});
					$(this).trigger('newAttribute');
				},
				changeName: function(idx, newName)
				{
					_attributes[idx].name = newName;
					$(this).trigger('updateAttribute');
				},
				changeType: function(idx, newType)
				{
					_attributes[idx].type = newType;
					$(this).trigger('updateAttribute');
				},
				deleteAttribute: function(idx)
				{
					//delete _attributes[idx];
					_attributes.splice(idx, 1);
					$(this).trigger('delAttribute');
				},
				getAttribute: function(idx){ return _attributes[idx]; },
				getCount: function(){ return _attributes.length; }
			}
		})();
		attrModel.TYPES = 
			{
				DOUBLE:   {user: 'Float',    server: 'float'},
				STRING:   {user: 'String',   server: 'string'},
				TIME:     {user: 'Time',     server: 'time'},
				DATETIME: {user: 'DateTime', server: 'datetime'},
				INTEGER:  {user: 'Integer',  server: 'integer'}
			};
		
		var attrView = (function()
		{
			var _parent = null;
			var _model = null;
			var _trs = [];
			
			var createTypeSelector = function()
			{
				var s = _select(null, [['css', 'width', '100px']]);
				for (var type in attrModel.TYPES)
					$(s).append(_option([_t(attrModel.TYPES[type].user)], [['dir', 'attrType', attrModel.TYPES[type]], ['attr', 'id', attrModel.TYPES[type].server]]));
				return s;
			}
			
			var redraw = function()
			{
				if (!_model) return;
				
				$(_parent).empty();
				_trs = [];
				
				for (var i = 0; i < _model.getCount(); i++)
				{
					var attr = _model.getAttribute(i);
					//if (!attr) continue;
					
					var typeSelector = createTypeSelector();
					typeSelector.attrIdx = i;
					$('#' + attr.type.server, typeSelector).attr('selected', 'selected');
					
					$(typeSelector).bind('change', function()
					{
						var attrType = $('option:selected', this)[0].attrType;
						_model.changeType(this.attrIdx, attrType);
					});
					
					var nameSelector = _input(null, [['attr', 'class', 'customAttrNameInput']]);
					
					$(nameSelector).attr({attrIdx: i}).val(attr.name);
					
					$(nameSelector).bind('change', function()
					{
						var idx = $(this).attr('attrIdx');
						var name = $(this).val();
						
						_model.changeName(idx, name);
					});
					
					var deleteIcon = makeImageButton("img/close.png", "img/close_orange.png");
					deleteIcon.attrIdx = i;
					deleteIcon.onclick = function()
					{
						_model.deleteAttribute(this.attrIdx);
					}
					
					var moveIcon = _img(null, [['attr', 'src', "img/moveIcon.gif"], ['dir', 'className', 'moveIcon'], ['css', 'cursor', 'move']]);
					
					_trs.push(_tr([_td([nameSelector]), _td([typeSelector]), _td([deleteIcon]), _td([moveIcon])]));
				}
				
				var tbody = _tbody(_trs);
				$(tbody).sortable({axis: 'y', handle: '.moveIcon'});
				$(_parent).append(_table([tbody], [['dir', 'className', 'customAttributes']]));
			}
			return {
				init: function(parent, model)
				{
					_parent = parent;
					_model = model;
					$(_model).bind('newAttribute', function(idx)
					{
						redraw();
					});
					
					$(_model).bind('delAttribute', function()
					{
						redraw();
					});
					
					$(_model).bind('updateAttribute', function()
					{
						//alert('change');
					});					
				}
			}
		})();
		
        //временно отключили
		// var attrViewParent = _div();
		// var createLayerFields = _tr([_td([boxManualAttributes, _span([_t("Задать аттрибуты вручную")]), _br(), addAttribute, _br(), attrViewParent], [['attr', 'colspan', 2]])]);
		// attrView.init(attrViewParent, attrModel);
		
		// shownProperties.push({tr: createLayerFields});
	}
	else
	{
	/*	var wmsBox = _checkbox(properties.WMSAccess, "checkbox");
		
		wmsBox.setAttribute('fieldName', 'WMSAccess');
		wmsBox.style.display = 'none';*/
				
		if (typeof properties.ShapePath == 'undefined')
			properties.ShapePath = {Path: null, Exists: true}
		
		var shapePath = _input(null,[['attr','fieldName','ShapePath.Path'],['attr','value',properties.ShapePath.Path != null ? properties.ShapePath.Path : ''],['dir','className','inputStyle'],['css','width','220px']]),
			tilePath = _input(null,[['attr','fieldName','TilePath.Path'],['attr','value',properties.TilePath.Path != null ? properties.TilePath.Path : ''],['dir','className','inputStyle'],['css','width','220px']]),
			tileCatalogLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
			tileFileLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
			shapeLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
			drawingBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
			drawingBorderDescr = _span(null, [['attr','id','drawingBorderDescr' + properties.Name],['css','color','#215570'],['css','marginLeft','3px']]),
			removeBorder = makeImageButton('img/closemin.png','img/close_orange.png'),
			divBorder = _div([drawingBorderDescr, removeBorder]),
			trPath = _tr([_td([_t(_gtxt("Каталог")), tileCatalogLink, _br(), _t(_gtxt("Файл")), tileFileLink],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
						  _td([tilePath])]),
			trShape = _tr([_td([_t(_gtxt("Граница")), shapeLink],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
							_td([shapePath, divBorder])]),
			shapeVisible = function(flag)
			{
				if (flag)
				{
					shapePath.style.display = '';
					divBorder.style.display = 'none';
				}
				else
				{
					shapePath.style.display = 'none';
					divBorder.style.display = '';
				}
			};
		
		divBorder.style.cssText = "height:22px; padding-top:3px;";
		
		removeBorder.style.cssText = "height:16px;padding:0;width:16px;cursor:pointer;margin:-1px 0px -3px 5px;";
		
		_title(removeBorder, _gtxt("Удалить"));
		
		removeBorder.onclick = function()
		{
			shapeVisible(true);
			_this.drawingBorders.removeRoute(properties.Name, true);
			
			// if (_this.drawingBorders[properties.Name])
			// {
				// _this.drawingBorders[properties.Name].remove();
				
				// delete _this.drawingBorders[properties.Name];
			// }
			}
		
		if (div)
		{
			_(trShape.firstChild, [_br(), _t(_gtxt("Контур")), drawingBorderLink]);

			if (typeof properties.ShapePath.Path != 'undefined' && properties.ShapePath.Path != null && properties.ShapePath.Path != '')
				shapeVisible(true);	
			else
			{
				shapeVisible(false);
				
				// добавим маленький сдвиг, чтобы рисовать полигон, а не прямоугольник
				properties.ShapePath.Geometry.coordinates[0][0][0] += 0.00001;
				properties.ShapePath.Geometry.coordinates[0][0][1] += 0.00001;
				
				// чтобы если бы последняя точка совпадала с первой, то этобы ни на что не повлияло
				var pointCount = properties.ShapePath.Geometry.coordinates[0].length;
				properties.ShapePath.Geometry.coordinates[0][pointCount-1][0] += 0.00001;
				properties.ShapePath.Geometry.coordinates[0][pointCount-1][1] += 0.00001;
				
				var drawingBorder = globalFlashMap.drawing.addObject(from_merc_geometry(properties.ShapePath.Geometry));
			
				drawingBorder.setStyle({outline: {color: 0x0000FF, thickness: 3, opacity: 80 }, marker: { size: 3 }, fill: { color: 0xffffff }}, {outline: {color: 0x0000FF, thickness: 4, opacity: 100}, marker: { size: 4 }, fill: { color: 0xffffff }});
				
				//this.drawingBorders[properties.Name] = drawingBorder;
				this.drawingBorders.set(properties.Name, drawingBorder);
				
				this.drawingBorders.updateBorder(properties.Name, drawingBorderDescr);
			}
		}
		else
			shapeVisible(true);	
		
		if (properties.ShapePath && properties.ShapePath.Path != null && properties.ShapePath.Path != '' && !properties.ShapePath.Exists)
			$(shapePath).addClass('error');

		if (properties.TilePath.Path != null && properties.TilePath.Path != '' && !properties.TilePath.Exists)
			$(tilePath).addClass('error');
		
		tileCatalogLink.onclick = function()
		{
			_fileBrowser.createBrowser(_gtxt("Каталог"), [], function(path)
			{
				tilePath.value = path;
				
				if (title.value == '')
				{
					var indexSlash = String(path).lastIndexOf('\\'),
						fileName = String(path).substring(indexSlash + 1, path.length);
					
					title.value = fileName;
				}
			})
		}
		
		tileFileLink.onclick = function()
		{
			_fileBrowser.createBrowser(_gtxt("Файл"), ['jpeg', 'jpg', 'tif', 'png', 'img'], function(path)
			{
				tilePath.value = path;
				
				var index = String(path).lastIndexOf('.'),
					ext = String(path).substr(index + 1, path.length);
				
				if (title.value == '')
				{
					var indexSlash = String(path).lastIndexOf('\\'),
						fileName = String(path).substring(indexSlash + 1, index);
					
					title.value = fileName;
				}
			})
		}
		
		shapeLink.onclick = function()
		{
			_fileBrowser.createBrowser(_gtxt("Граница"), ['mif','tab','shp'], function(path)
			{
				shapePath.value = path;
				
				shapeVisible(true);
			})
		}
		
		drawingBorderLink.onclick = function()
		{
			_this.chooseDrawingBorderDialog(properties.Name, function()
			{
				shapeVisible(false);
			});
		}
		
		tileCatalogLink.style.marginLeft = '3px';
		tileFileLink.style.marginLeft = '3px';
		shapeLink.style.marginLeft = '3px';
		drawingBorderLink.style.marginLeft = '3px';
	//	wmsBox.style.marginLeft = '3px';
		
	//	shownProperties.push({name: "WMS", field: 'WMSAccess', elem:wmsBox});
		shownProperties.push({tr:trPath});
		shownProperties.push({tr:trShape});
	}
	
	// for (var i = 0; i < shownProperties.length; i++)
	// {
		// var td;
		// if (typeof shownProperties[i].tr != 'undefined')
		// {
			// trs.push(shownProperties[i].tr);
			
			// continue;
		// }
		// else if (typeof shownProperties[i].elem != 'undefined')
			// td = _td([shownProperties[i].elem]);
		// else
			// td = _td([_t(properties[shownProperties[i].field] != null ? properties[shownProperties[i].field] : '')],[['css','padding','0px 3px']]);
		
		// td.style.border = '1px solid #DEDEDE';
		
		// var tr = _tr([_td([_t(shownProperties[i].name)],[['css','width','70px'],['css','paddingLeft','5px'],['css','fontSize','12px']]), td])
		
		// trs.push(tr);
	// }
	
	var trs = this.createPropertiesTable(shownProperties, properties, {leftWidth: 70});
	_(parent, [_div([_table([_tbody(trs)],[['dir','className','propertiesTable']])])]);
	
	// смотрим, а не выполняются ли для этого слоя задачи
	var haveTask = false;
	if (div)
	{
		for (var id in this.asyncTasks)
			if (this.asyncTasks[id] == div.properties.content.properties.name)
			{
				haveTask = true;
				
				break;		
			}
	}
	
	if (!haveTask)
	{
		var saveButton = makeLinkButton(div ? _gtxt("Изменить") : _gtxt("Создать"));
		
        saveButton.style.marginLeft = '10px';
		
		saveButton.onclick = function()
		{
			var isCustomAttributes = type === "Vector" && boxManualAttributes.checked;
			var errorFlag = false,
				checkFields = (type == "Vector" ? ['title', 'date'] : ['title', 'date']);
				
			if (!isCustomAttributes)
				checkFields.push(type == "Vector" ? 'ShapePath.Path' : 'TilePath.Path');
				
			for (var i = 0; i < checkFields.length; i++)
			{
				var inputField = $(parent).find("[fieldName='" + checkFields[i] + "']");
				
				if (inputField.length && inputField[0].value == '')
				{
					errorFlag = true;

					(function(input)
					{
						$(input).addClass('error');
						
						setTimeout(function()
						{
							if (input)
								$(input).removeClass('error')
						}, 2000)
					})(inputField[0])
				}
			}
			
			if (errorFlag)
				return;
			
			if (type == "Vector")
			{
				var cols = '',
					updateParams = '',
					encoding = '&EncodeSource=' + encodingWidget.getServerEncoding(),
					needRetiling = false,
					colXElem = $(columnsParent).find("[selectLon]"),
					colYElem = $(columnsParent).find("[selectLat]"),
					layerTitle = title.value,
					temporalParams = '';
				
				if ( temporalLayerParams.getTemporal() )
					temporalParams = '&TemporalLayer=true&TemporalColumnName=' + temporalLayerParams.getColumnName() + '&TemporalPeriods=' + temporalLayerParams.getPeriodString();
				
				if (colXElem.length && colYElem.length)
					cols = '&ColY=' + colYElem[0].value + '&ColX=' + colXElem[0].value;
				
				if (div)
				{
					needRetiling = vectorRetilingFlag;
					
					updateParams = '&VectorLayerID=' + div.properties.content.properties.LayerID;
					
					var oldGeometryDadaSource = !properties.ShapePath ? properties.GeometryTable.TableName : properties.ShapePath.Path;
					
					// если изменились поля с геометрией, то нужно тайлить заново и перегрузить слой в карте
					if ($(parent).find("[fieldName='ShapePath.Path']")[0].value != oldGeometryDadaSource ||
						colXElem.length && colXElem[0].value != properties.GeometryTable.XCol ||
						colYElem.length && colYElem[0].value != properties.GeometryTable.YCol)
						needRetiling = true;
				}
				
				if (needRetiling)
					updateParams += '&NeedRetiling=true';
				
				if (isCustomAttributes)
				{
					var count = attrModel.getCount();
					var columnsString = "&FieldsCount=" + count;
					for (var k = 0; k < count; k++){
						columnsString += "&fieldName" + k + "=" + attrModel.getAttribute(k).name + "&fieldType" + k + "=" + attrModel.getAttribute(k).type.server;
					}
					
					sendCrossDomainJSONRequest(serverBase + "VectorLayer/CreateVectorLayer.ashx?WrapStyle=func&Title=" + title.value + "&Copyright=" + copyright.value + 
															"&Description=" + descr.value + "&Date=" + dateField.value + "&MapName=" + _mapHelper.mapProperties.name + cols + updateParams + columnsString, function(response)
					{
						if (!parseResponse(response))
								return;
						
						_this.asyncTasks[response.Result.TaskID] = div ? div.properties.content.properties.name : true;
						_queryMapLayers.asyncCreateLayer(response.Result, layerTitle);
					});
				}
				else
				{
					sendCrossDomainJSONRequest(serverBase + "VectorLayer/" + (!div ? "Insert.ashx" : "Update.ashx") + "?WrapStyle=func&Title=" + title.value + "&Copyright=" + copyright.value + "&Description=" + descr.value + "&Date=" + dateField.value + "&GeometryDataSource=" + $(parent).find("[fieldName='ShapePath.Path']")[0].value + "&MapName=" + _mapHelper.mapProperties.name + cols + updateParams + encoding + temporalParams, function(response)
						{
							if (!parseResponse(response))
								return;
						
							_this.asyncTasks[response.Result.TaskID] = div ? div.properties.content.properties.name : true;
							
							if (div)
								_queryMapLayers.asyncUpdateLayer(response.Result, properties, needRetiling);
							else
								_queryMapLayers.asyncCreateLayer(response.Result, layerTitle);
						})
				}
			}
			else
			{
				var params = {
						WrapStyle: "window",
						Title: title.value,
						Copyright: copyright.value,
						Legend: legend.value,
						Description: descr.value,
						"Date": dateField.value,
						TilePath: $(parent).find("[fieldName='TilePath.Path']")[0].value,
						BorderFile: typeof _this.drawingBorders.get(properties.Name) == 'undefined' ? $(parent).find("[fieldName='ShapePath.Path']")[0].value : '',
						BorderGeometry: typeof _this.drawingBorders.get(properties.Name) == 'undefined' ? '' : JSON.stringify(merc_geometry(_this.drawingBorders.get(properties.Name).geometry)),
						MapName: _mapHelper.mapProperties.name
					},
					needRetiling = false,
					layerTitle = title.value;
				
				if (div)
				{
					params["RasterLayerID"] = div.properties.content.properties.LayerID;
					
					var oldShapePath = properties.ShapePath.Path,
						oldTilePath = properties.TilePath.Path,
						oldDrawing = properties.ShapePath.Geometry;
					
					// если изменились поля с геометрией, то нужно тайлить заново и перегрузить слой в карте
					if ($(parent).find("[fieldName='ShapePath.Path']")[0].value != oldShapePath ||
						$(parent).find("[fieldName='TilePath.Path']")[0].value != oldTilePath ||
						oldDrawing && typeof _this.drawingBorders.get(properties.Name) != 'undefined' && JSON.stringify(_this.drawingBorders.get(properties.Name)) != JSON.stringify(oldDrawing) ||
						!oldDrawing && typeof _this.drawingBorders.get(properties.Name) != 'undefined' ||
						oldDrawing && typeof _this.drawingBorders.get(properties.Name) == 'undefined')
						needRetiling = true;
				}
				
				params["GeometryChanged"] = needRetiling;
				
				sendCrossDomainPostRequest(serverBase + "RasterLayer/" + (!div ? "Insert.ashx" : "Update.ashx"), params, function(response)
					{
						if (!parseResponse(response))
							return;
					
						_this.asyncTasks[response.Result.TaskID] = div ? div.properties.content.properties.name : true;
						
						if (div)
							_queryMapLayers.asyncUpdateLayer(response.Result, properties, needRetiling);
						else
							_queryMapLayers.asyncCreateLayer(response.Result, layerTitle);
					})
			}
			
			var dialog = parent.parentNode.parentNode;
			
			$(dialog).dialog("close")
			$(dialog).dialog("destroy");
			
			dialog.removeNode(true);
			
			if (div)
				delete _this.layerEditorsHash[div.properties.content.properties.name];
		}
		
		_(parent, [_div([saveButton], [['css','paddingTop','10px']])])
	}
	
	$(dateField).datepicker(
		{
			beforeShow: function(input)
			{
		    	return {maxDate: new Date()}; 
			},
			changeMonth: true,
			changeYear: true,
			showAnim: 'fadeIn',
			showOn: "button",
			buttonImage: "img/calendar.png",
			buttonImageOnly: true,
			dateFormat: "dd.mm.yy"
		});
	
	if (!div)
		title.focus();
}

mapHelper.prototype.chooseDrawingBorderDialog = function(name, closeFunc)
{
	if ($$('drawingBorderDialog' + name))
		return;
	
	var polygons = [],
		_this = this;
	
	globalFlashMap.drawing.forEachObject(function(obj)
	{
		if (obj.geometry.type == 'POLYGON')
			polygons.push(obj);
	})
	
	if (!polygons.length)
		showErrorMessage(_gtxt("$$phrase$$_17"), true, _gtxt("$$phrase$$_12"));
	else
	{
		var trs = [];
		
		for (var i = 0; i < polygons.length; i++)
		{
			var	coords = polygons[i].geometry.coordinates,
				title = _span([_t(_gtxt("многоугольник"))], [['dir','className','title']]),
				summary = _span([_t("(" + prettifyArea(geoArea(coords)) + ")")], [['dir','className','summary']]),
				tdName = _td([title, summary]),
				returnButton = makeImageButton("img/choose.png", "img/choose_a.png"),
				tr = _tr([_td([returnButton]), tdName]);
			
			returnButton.style.cursor = 'pointer';
			returnButton.style.marginLeft = '5px';
				
			(function(i){
				returnButton.onclick = function()
				{
					//_this.drawingBorders[name] = polygons[i];
					_this.drawingBorders.set(name, polygons[i]);
					_this.drawingBorders.updateBorder(name);
					
					removeDialog($$('drawingBorderDialog' + name).parentNode);
					
					closeFunc();
				}
			})(i);
			
			attachEffects(tr, 'hover')
			
			trs.push(tr)
		}
	
		var table = _table([_tbody(trs)], [['css','width','100%']]);
		
		showDialog(_gtxt("Выбор контура"), _div([table], [['attr','id','drawingBorderDialog' + name],['dir','className','drawingObjectsCanvas'],['css','width','220px']]), 250, 180, false, false)
	}
}

/** Виджет для выбора полей для X и Y координат из списка полей
* @function
* @param parent {DOMElement} - контейнер для размещения виджета
* @param params {object} - параметры ф-ции (должны быть либо url, либо fields):
*   - url {string}- запросить список полей у сервера. В ответе - вектор из имён полей
*   - fields {array of string}- явный список полей
*   - defaultX {string} - дефолтное значение поля X (не обязятелен)
*   - defaultY {string} - дефолтное значение поля Y (не обязятелен)
*/
mapHelper.prototype.selectColumns = function(parent, params)
{
	var doCreate = function(fields)
	{
		removeChilds(parent);
	
		if (fields && fields.length > 0)
	{
			var selectLat = _select(null, [['attr','selectLat',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]),
				selectLon = _select(null, [['attr','selectLon',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]);

			for (var i = 0; i < fields.length; i++)
			{
				var opt = _option([_t(fields[i])], [['attr','value',fields[i]]]);
		
				_(selectLat, [opt.cloneNode(true)]);
				_(selectLon, [opt.cloneNode(true)]);
	}
	
			_(parent, [_table([_tbody([_tr([_td([_span([_t(_gtxt("Y (широта)"))],[['css','margin','0px 3px']])], [['css','width','73px'],['css','border','none']]), _td([selectLat], [['css','width','150px'],['css','border','none']])]),
										_tr([_td([_span([_t(_gtxt("X (долгота)"))],[['css','margin','0px 3px']])], [['css','width','73px'],['css','border','none']]), _td([selectLon], [['css','width','150px'],['css','border','none']])])])])])
	
			if (params.defaultX)
				selectLon = switchSelect(selectLon, params.defaultX);
	
			if (params.defaultY)
				selectLat = switchSelect(selectLat, params.defaultY);
		}
	}
	
	if (params.url)
	{
	var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t('загрузка...')], [['css','margin','3px 0px 3px 20px']]);
	
	removeChilds(parent);
	_(parent, [loading])
	
		sendCrossDomainJSONRequest(params.url, function(response)
	{
		removeChilds(parent);
	
		if (!parseResponse(response))
			return;
		
			doCreate( response.Result );
		});
	}
	else
		{
		doCreate( params.fields );
	}
	
	// var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t('загрузка...')], [['css','margin','3px 0px 3px 20px']]);
	
	// removeChilds(parent);
	// _(parent, [loading])
	
	// sendCrossDomainJSONRequest(url, function(response)
	// {
		// removeChilds(parent);
	
		// if (!parseResponse(response))
			// return;
		
		// if (response.Result && response.Result.length > 0)
		// {
			// var selectLat = _select(null, [['attr','selectLat',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]),
				// selectLon = _select(null, [['attr','selectLon',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]);

			// for (var i = 0; i < response.Result.length; i++)
			// {
				// var opt = _option([_t(response.Result[i])], [['attr','value',response.Result[i]]]);
				
				// _(selectLat, [opt.cloneNode(true)]);
				// _(selectLon, [opt.cloneNode(true)]);
			// }
			
			// _(parent, [_table([_tbody([_tr([_td([_span([_t(_gtxt("Y (широта)"))],[['css','margin','0px 3px']])], [['css','width','73px'],['css','border','none']]), _td([selectLat], [['css','width','150px'],['css','border','none']])]),
										// _tr([_td([_span([_t(_gtxt("X (долгота)"))],[['css','margin','0px 3px']])], [['css','width','73px'],['css','border','none']]), _td([selectLon], [['css','width','150px'],['css','border','none']])])])])])
		// }
	// })
}

mapHelper.prototype.createNewLayer = function(type)
{
	if ($$('new' + type + 'Layer'))
		return;

	var parent = _div(null, [['attr','id','new' + type + 'Layer']]),
		height = (type == 'Vector') ? 270 : 285;

    if (type !== 'Multi')
    {
		var properties = {Title:'', Description: '', Date: '', TilePath: {Path:''}, ShapePath: {Path:''}};
        showDialog(type != 'Vector' ? _gtxt('Создать растровый слой') : _gtxt('Создать векторный слой'), parent, 330, height, false, false);
        this.createLayerEditorProperties(false, type, parent, properties);
    }
    else
    { //мультислой
        var _this = this;
        sendCrossDomainJSONRequest(serverBase + "MultiLayer/GetInsertInfo.ashx", function(response)
        {
            if (!parseResponse(response))
                return;
                
            _this.doCreateMultiLayerEditor({title: '', description: ''}, [], response.Result.LayersToAdd, null);
        });
    }
}

mapHelper.prototype.updateTask = function(taskInfo, title)
{
	if (!taskInfo.Completed)
	{
		var taskDiv;
		
		if (!$$(taskInfo.TaskID))
		{
			taskDiv = _div(null, [['attr','id',taskInfo.TaskID],['css','margin','5px 0px 5px 5px']]);
			
			_($$('layersStatus'), [taskDiv])
		}
		else
		{
			taskDiv = $$(taskInfo.TaskID);
			
			removeChilds(taskDiv);
		}
		
		_(taskDiv, [_span([_t(title + ':')], [['css','color','#153069'],['css','margin','0px 3px']]), _t(taskInfo.Status)])	
		
		setTimeout(function()
		{
			sendCrossDomainJSONRequest(serverBase + "AsyncTask.ashx?WrapStyle=func&TaskID=" + taskInfo.TaskID, function(response)
			{
				if (!parseResponse(response))
					return;
				
				_mapHelper.updateTask(response.Result, title)
			});
		}, 2000)
	}
	else
	{
		delete this.asyncTasks[taskInfo.TaskID];
		
		$$(taskInfo.TaskID).removeNode(true);
		
		if (!$$('layersStatus').childNodes.length)
		{
			$($$('layersStatus').parentNode).dialog('destroy');
			
			$$('layersStatus').parentNode.removeNode(true);
		}
	}
}

// Формирует набор элементов tr используя контролы из shownProperties.
// Параметры:
// - shownProperties: массив со следующими свойствами:
//   * tr - если есть это свойство, то оно помещается в tr, все остальные игнорируются
//   * name - названия свойства, которое будет писаться в левой колонке
//   * elem - если есть, то в правую колонку помещается этот элемент
//   * field - если нет "elem", в правый столбец подставляется layerProperties[field]
// - layerProperties - просто хеш строк для подстановки в правую колонку
// - style:
//   * leftWidth - ширина левой колонки в пикселях
mapHelper.prototype.createPropertiesTable = function(shownProperties, layerProperties, style)
{
	var _styles = $.extend({leftWidth: 100}, style);
	var trs = [];
	for (var i = 0; i < shownProperties.length; i++)
	{
		var td;
		if (typeof shownProperties[i].tr !== 'undefined')
		{
			trs.push(shownProperties[i].tr);
			continue;
		}
		
		if (typeof shownProperties[i].elem !== 'undefined')
			td = _td([shownProperties[i].elem]);
		else
			td = _td([_t(layerProperties[shownProperties[i].field] != null ? layerProperties[shownProperties[i].field] : '')],[['css','padding','0px 3px']]);
		
		var tr = _tr([_td([_t(shownProperties[i].name)],[['css','width', _styles.leftWidth + 'px'],['css','paddingLeft','5px'],['css','fontSize','12px']]), td]);
		
		trs.push(tr);
	}
	
	return trs;
}

mapHelper.prototype.createGroupEditorProperties = function(div, isMap)
{
	var elemProperties = (isMap) ? div.properties.properties : div.properties.content.properties,
		trs = [],
		_this = this;

	var title = _input(null,[['attr','value',typeof elemProperties.title != 'undefined' ? elemProperties.title : ''],['dir','className','inputStyle'],['css','width','206px']])
	
	var visibilityProperties = new layersTree.GroupVisibilityPropertiesModel(elemProperties.list, typeof elemProperties.ShowCheckbox === 'undefined' ? true : elemProperties.ShowCheckbox);
	// var visibilityProperties = new _layersTree.GroupVisibilityPropertiesModel(true, elemProperties.list);
	var visibilityPropertiesView = layersTree.GroupVisibilityPropertiesView(visibilityProperties, !isMap);
	$(visibilityProperties).change(function()
	{
		elemProperties.list = visibilityProperties.isChildRadio();
		elemProperties.ShowCheckbox = visibilityProperties.isVisibilityControl();
		
		var curBox = div.firstChild;
		if (!elemProperties.ShowCheckbox)
		{
			curBox.checked = true;
			_layersTree.visibilityFunc(curBox, true, false, false);
			
			curBox.style.display = 'none';
			curBox.isDummyCheckbox = true;
		}
		else
		{
			curBox.style.display = 'block';
			delete curBox.isDummyCheckbox;
		}
		
		if (isMap) {
			_this.mapTree.properties = div.properties.properties;
		} else {
			_this.findTreeElem(div).elem.content.properties = div.properties.content.properties;
		}
		
		var ul = _abstractTree.getChildsUl(div.parentNode),
			checkbox = false;
		
		$(ul).children('li').each(function()
		{
			var box = _layersTree.updateListType(this, true);
			
			if (box.checked && !box.isDummyCheckbox)
				checkbox = box; // последний включенный чекбокс
		})
		
		if (checkbox && _layersTree.getLayerVisibility(checkbox))
			_layersTree.visibilityFunc(checkbox, true, div.properties.content ? div.properties.content.properties.list : div.properties.properties.list);		
	});
	
	title.onkeyup = function()
	{
		if (title.value == '')
		{
			$(title).addClass('error');
			
			return;
		}
		else
			$(title).removeClass('error');
		
		var span = $(div).find(".groupLayer")[0];
		
		removeChilds(span);
		
		_(span, [_t(title.value)]);
		
		if (isMap)
		{
			div.properties.properties.title = title.value;
			
			_this.mapTree.properties = div.properties.properties;
		}
		else
		{
			div.properties.content.properties.title = title.value;
			
			_this.findTreeElem(div).elem.content.properties = div.properties.content.properties;
		}
		
		return true;
	}
		
	var addProperties = function(shownProperties)
	{		
		return _this.createPropertiesTable(shownProperties, elemProperties, {leftWidth: 100});
	};
	
	if (isMap)
	{
		var useAPI = _checkbox(elemProperties.UseKosmosnimkiAPI, 'checkbox'),
			useOSM = _checkbox(elemProperties.UseOpenStreetMap, 'checkbox'),
		//	showBalloons = _checkbox(elemProperties.ShowPropertiesBalloons, 'checkbox'),
			downloadVectors = _checkbox(elemProperties.CanDownloadVectors, 'checkbox'),
			downloadRasters = _checkbox(elemProperties.CanDownloadRasters, 'checkbox'),
            WMSAccess = _checkbox(elemProperties.WMSAccess, 'checkbox'),
		//	searchVectors = _checkbox(elemProperties.CanSearchVector, 'checkbox'),
			defLat = _input(null,[['attr','value',elemProperties.DefaultLat != null && elemProperties.DefaultLat != 0 ? elemProperties.DefaultLat : ''],['dir','className','inputStyle'],['css','width','62px']]),
			defLong = _input(null,[['attr','value',elemProperties.DefaultLong != null && elemProperties.DefaultLong != 0 ? elemProperties.DefaultLong : ''],['dir','className','inputStyle'],['css','width','62px']]),
			defPermalink = _input(null,[['attr','value',elemProperties.ViewUrl != null ? elemProperties.ViewUrl : ''],['dir','className','inputStyle'],['css','width','206px']]),
			defZoom = _input(null,[['attr','value',elemProperties.DefaultZoom && elemProperties.DefaultZoom != 0 != null ? elemProperties.DefaultZoom : ''],['dir','className','inputStyle'],['css','width','60px']]),
			zoomDelta = _input(null,[['attr','value',elemProperties.MiniMapZoomDelta && elemProperties.MiniMapZoomDelta != 0 != null ? elemProperties.MiniMapZoomDelta : ''],['dir','className','inputStyle'],['css','width','60px']]),
			//zoomDelta = _input(null,[['attr','value',elemProperties.MiniMapZoomDelta && elemProperties.MiniMapZoomDelta != 0 != null ? elemProperties.MiniMapZoomDelta : ''],['dir','className','inputStyle'],['css','width','60px']]),
			onLoad = _textarea(null,[['dir','className','inputStyle'],['css','width','310px'],['css','height','250px']]),
			copyright = _input(null,[['attr','value',elemProperties.Copyright != null ? elemProperties.Copyright : ''],['dir','className','inputStyle'],['css','width','206px']]),
			minViewX = _input(null,[['attr','value',elemProperties.MinViewX != null && elemProperties.MinViewX != 0 ? elemProperties.MinViewX : ''],['dir','className','inputStyle'],['css','width','60px']]),
			minViewY = _input(null,[['attr','value',elemProperties.MinViewY != null && elemProperties.MinViewY != 0 ? elemProperties.MinViewY : ''],['dir','className','inputStyle'],['css','width','62px']]),
			maxViewX = _input(null,[['attr','value',elemProperties.MaxViewX != null && elemProperties.MaxViewX != 0 ? elemProperties.MaxViewX : ''],['dir','className','inputStyle'],['css','width','60px']]),
			maxViewY = _input(null,[['attr','value',elemProperties.MaxViewY != null && elemProperties.MaxViewY != 0 ? elemProperties.MaxViewY : ''],['dir','className','inputStyle'],['css','width','62px']]);
		
		onLoad.value = elemProperties.OnLoad != null ? elemProperties.OnLoad : '';
		
		useAPI.onclick = function()
		{
			div.properties.properties.UseKosmosnimkiAPI = this.checked;
			
			_this.mapTree.properties = div.properties.properties;
		}
		useOSM.onclick = function()
		{
			div.properties.properties.UseOpenStreetMap = this.checked;
			
			_this.mapTree.properties = div.properties.properties;
		}
	/*	searchVectors.onclick = function()
		{
			div.properties.properties.CanSearchVector = this.checked;
			
			_this.mapTree.properties = div.properties.properties;
		}*/
	/*	showBalloons.onclick = function()
		{
			div.properties.properties.ShowPropertiesBalloons = this.checked;
			
			_this.mapTree.properties = div.properties.properties;
		}*/
		downloadVectors.onclick = function()
		{
			div.properties.properties.CanDownloadVectors = this.checked;
			
			_this.mapTree.properties = div.properties.properties;
		}
		downloadRasters.onclick = function()
		{
			div.properties.properties.CanDownloadRasters = this.checked;
			
			_this.mapTree.properties = div.properties.properties;
		}
        
        WMSAccess.onclick = function()
		{
			div.properties.properties.WMSAccess = this.checked;
			
			_this.mapTree.properties = div.properties.properties;
		}
		
		defLat.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.properties.properties.DefaultLat = Number(this.value);
				
				_this.mapTree.properties = div.properties.properties;
			}
			
			return true;
		}
		defLong.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.properties.properties.DefaultLong = Number(this.value);
				
				_this.mapTree.properties = div.properties.properties;
			}
			
			return true;
		}
		defPermalink.onkeyup = function()
		{
			div.properties.properties.ViewUrl = this.value;
			
			_this.mapTree.properties = div.properties.properties;
			
			return true;
		}
		defZoom.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.properties.properties.DefaultZoom = Number(this.value);
			
				_this.mapTree.properties = div.properties.properties;
			}
			
			return true;
		}
		zoomDelta.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.properties.properties.MiniMapZoomDelta = Number(this.value);
			
				_this.mapTree.properties = div.properties.properties;
			}
			
			return true;
		}
		
		onLoad.onkeyup = function()
		{
			div.properties.properties.OnLoad = this.value;
			
			_this.mapTree.properties = div.properties.properties;
			
			return true;
		}
		
		copyright.onkeyup = function()
		{
			div.properties.properties.Copyright = this.value;
			
			_this.mapTree.properties = div.properties.properties;
			
			return true;
		}
		
		minViewX.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.properties.properties.MinViewX = Number(this.value);
				
				_this.mapTree.properties = div.properties.properties;
			}
			
			return true;
		}
		
		minViewY.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.properties.properties.MinViewY = Number(this.value);
				
				_this.mapTree.properties = div.properties.properties;
			}
			
			return true;
		}
		
		maxViewX.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.properties.properties.MaxViewX = Number(this.value);
				
				_this.mapTree.properties = div.properties.properties;
			}
			
			return true;
		}
		
		maxViewY.onkeyup = function()
		{
			if (!isNaN(Number(this.value)))
			{
				div.properties.properties.MaxViewY = Number(this.value);
				
				_this.mapTree.properties = div.properties.properties;
			}
			
			return true;
		}
		
		if (!$.browser.msie)
		{
			useAPI.style.margin = "0px 4px 0px 3px";
			useOSM.style.margin = "0px 4px 0px 3px";
		//	searchVectors.style.margin = "0px 4px 0px 3px";
		//	showBalloons.style.margin = "0px 4px 0px 3px";
            WMSAccess.style.margin = "0px 4px 0px 3px";
		}
		
		var shownCommonProperties = [
										{name: _gtxt("Имя"), field: 'title', elem: title},
										{name: _gtxt("ID"), field: 'name'},
										{name: _gtxt("Копирайт"), field: 'Copyright', elem: copyright}
									]
									//{name: _gtxt("Вид вложенных элементов"), elem: _div([boxSwitch, radioSwitch])},
									.concat(visibilityPropertiesView)
									.concat(
										[{name: _gtxt("Использовать KosmosnimkiAPI"), elem: useAPI},
										{name: _gtxt("Использовать OpenStreetMap"), elem: useOSM},
										{name: _gtxt("Ссылка (permalink)"), elem: defPermalink},
									//	{name: _gtxt("Показывать всплывающие подсказки"), elem: showBalloons},
										{name: _gtxt("Масштабирование в миникарте"), elem: zoomDelta}]
									),
			shownPolicyProperties = [/*{name: _gtxt("Разрешить поиск в векторных слоях"), elem: searchVectors},*/
										{name: _gtxt("Разрешить скачивание"), elem: _table([_tbody([_tr([_td([_t(_gtxt('Векторных слоев'))],[['css','width','100px'],['css','height','20px'],['css','paddingLeft','3px']]), _td([downloadVectors])]),
																					 				_tr([_td([_t(_gtxt('Растровых слоев'))],[['css','width','100px'],['css','height','20px'],['css','paddingLeft','3px']]), _td([downloadRasters])])])])},
                                        {name: _gtxt("WMS доступ"), elem: WMSAccess}
                                    ],
			shownViewProperties = [{name: _gtxt("Начальная позиция"), elem: _table([_tbody([_tr([_td([_span([_t(_gtxt('Широта'))],[['css','marginLeft','3px']]), _br(), defLat],[['css','width','70px']]),
																					   _td([_span([_t(_gtxt('Долгота'))],[['css','marginLeft','3px']]), _br(), defLong],[['css','width','70px']]),
																					   _td([_span([_t(_gtxt('Зум'))],[['css','marginLeft','3px']]), _br(), defZoom],[['css','width','68px']])])])])},
								{name: _gtxt("Граница"), elem:_table([_tbody([_tr([_td(null, [['css','width','70px']]), _td([_span([_t(_gtxt('Широта'))],[['css','marginLeft','3px']])],[['css','width','70px']]), _td([_span([_t(_gtxt('Долгота'))],[['css','marginLeft','3px']])],[['css','width','68px']])]), _tr([_td([_span([_t(_gtxt('Мин'))],[['css','marginLeft','3px']])]), _td([minViewY]), _td([minViewX])]), _tr([_td([_span([_t(_gtxt('Макс'))],[['css','marginLeft','3px']])]), _td([maxViewY]), _td([maxViewX])])])])}];
		
		var id = 'mapProperties' + String(Math.random()).substring(2, 12),
			tabMenu = _div([_ul([_li([_a([_t(_gtxt("Общие"))],[['attr','href','#common' + id]])]),
								 _li([_a([_t(_gtxt("Доступ"))],[['attr','href','#policy' + id]])]),
								 _li([_a([_t(_gtxt("Окно карты"))],[['attr','href','#view' + id]])]),
								 _li([_a([_t(_gtxt("Загрузка"))],[['attr','href','#onload' + id]])])])]),
			divCommon = _div(null,[['attr','id','common' + id],['css','width','320px']]),
			divPolicy = _div(null,[['attr','id','policy' + id],['css','width','320px']]);
			divView = _div(null,[['attr','id','view' + id],['css','width','320px']]);
			divOnload = _div(null,[['attr','id','onload' + id],['css','width','320px']]);
		
		_(tabMenu, [divCommon, divPolicy, divView, divOnload]);
		
		_(divCommon, [_table([_tbody(addProperties(shownCommonProperties))],[['css','width','100%'], ['dir','className','propertiesTable']])]);
		_(divPolicy, [_table([_tbody(addProperties(shownPolicyProperties))],[['css','width','100%'], ['dir','className','propertiesTable']])]);
		_(divView,   [_table([_tbody(addProperties(shownViewProperties))],  [['css','width','100%'], ['dir','className','propertiesTable']])]);
		_(divOnload, [onLoad])
		
		return tabMenu;
	}
	else
	{
		var shownProperties = [{name: _gtxt("Имя"), field: 'title', elem: title}].concat(visibilityPropertiesView);
								//{name: _gtxt("Вид вложенных элементов"), field: 'list', elem: _div([boxSwitch, radioSwitch])}];

		return _div([_table([_tbody(addProperties(shownProperties))],[['css','width','100%']])],[['css','width','320px'], ['dir','className','propertiesTable']]);
	}
}

//получает с сервера информацию о мультислое и рисует диалог редактирования его настроек
mapHelper.prototype.createMultiLayerEditorServer = function(elemProperties, div)
{
    var _this = this;
    sendCrossDomainJSONRequest(serverBase + "MultiLayer/GetMultiLayerFullInfo.ashx?MultiLayerID=" + elemProperties.MultiLayerID, function(response)
    {
        if (!parseResponse(response))
            return;
            
        _this.doCreateMultiLayerEditor(elemProperties, response.Result.Layers, response.Result.LayersToAdd, div);
    })
}

mapHelper.prototype.doCreateMultiLayerEditor = function(elemProperties, layers, layersToAdd, div)
{
    var commonLayersListDiv = _div(null, [['css', 'height', '100%'], ['css', 'width', '100%']]);
    var selectedLayersDiv = _div(null, [['css', 'height', '100%'], ['css', 'margin', '10px 10px 0px 0px']]);
    
    var selectedLayersTable = new scrollTable();
    
    var _this = this;
    
    _queryMapLayers.layersList = layersToAdd;

    _queryMapLayers._createLayersManagerInDiv(commonLayersListDiv, 'multilayers', {
        showType: false, 
        enableDragging: false,
        onclick: function(context)
        {
            var filteredValues = _filter(function(elem)
            {
                return elem.LayerID != context.elem.LayerID;
            }, context.scrollTable.vals);
            
            context.scrollTable.setValues(filteredValues);
            
            context.scrollTable.drawFilterTable();
            
            selectedLayersTable.setValues(selectedLayersTable.vals.concat([context.elem]));
            selectedLayersTable.drawFilterTable();
        }
    });
    
    
    selectedLayersTable.createTable(selectedLayersDiv, 'selectedLayersTables', 0, 
        ["", _gtxt("Тип"), _gtxt("Имя"), _gtxt("Дата"), _gtxt("Владелец"), "", "", ""],
        ['1%','5%','40%','19%','20%', '5%', '5%', '5%'], 
        function(layer)
        {
            var baseTR = _queryMapLayers.drawLayers.apply(this, [layer, {onclick: null, enableDragging: false}]);
            var downButton = makeImageButton('img/down.png', 'img/down_a.png');
            var upButton = makeImageButton('img/up.png', 'img/up_a.png');
            var deleteButton = makeImageButton('img/recycle.png', 'img/recycle_a.png');
            var _this = this;
            deleteButton.onclick = function()
            {
                var filteredValues = _filter(function(elem)
                {
                    return elem.LayerID != layer.LayerID;
                }, _this.vals);
                _this.setValues(filteredValues);
                _this.drawFilterTable();
            }
            downButton.onclick = function()
            {
                for (var i = 0; i < _this.vals.length-1; i++)
                    if (_this.vals[i].LayerID === layer.LayerID)
                    {
                        _this.vals.splice(i, 1);
                        _this.vals.splice(i+1, 0, layer);
                        _this.setValues(_this.vals);
                        _this.drawFilterTable();
                        break;
                    }
            }
            upButton.onclick = function()
            {
                for (var i = 1; i < _this.vals.length; i++)
                    if (_this.vals[i].LayerID === layer.LayerID)
                    {
                        _this.vals.splice(i, 1);
                        _this.vals.splice(i-1, 0, layer);
                        _this.setValues(_this.vals);
                        _this.drawFilterTable();
                        break;
                    }
            }
            $('td:last', baseTR).remove(); //удаляем правый отступ
            $(baseTR).append($("<td></td>").append(downButton));
            $(baseTR).append($("<td></td>").append(upButton));
            $(baseTR).append($("<td></td>").append(deleteButton));
            return baseTR;
        }, {});
    
    selectedLayersTable.setValues(layers);
    selectedLayersTable.drawFilterTable();
    
    var propertiesDiv = _div(null, [['css', 'width', '100%'], ['css', 'height', '100%']]);
    var shownProperties = [];
    var title = _input(null,[['attr','fieldName','title'],['attr','value', elemProperties.title],['dir','className','inputStyle'],['css','width','220px']])
    title.onkeyup = function()
    {
        if (div)
        {
            var span = $(div).find(".layer")[0];
        
            removeChilds(span);
            
            _(span, [_t(title.value)]);

            div.properties.content.properties.title = title.value;
            
            _this.findTreeElem(div).elem.content.properties = div.properties.content.properties;
        }
        
        return true;
    }
    var descr = _textarea(null,[['attr','fieldName','description'],['dir','className','inputStyle'],['css','width','220px'],['css','height','50px']]);
    descr.value = elemProperties.description;
    
    descr.onkeyup = function()
    {
        if (div)
        {
            var span = $(div).find(".layerDescription")[0];
        
            removeChilds(span);
            
            span.innerHTML = descr.value;

            div.properties.content.properties.description = descr.value;
            
            _this.findTreeElem(div).elem.content.properties = div.properties.content.properties;
        }
        
        return true;
    }
    
    shownProperties.push({name: _gtxt("Имя"), field: 'Title', elem: title});
    shownProperties.push({name: _gtxt("Описание"), field: 'Description', elem: descr});
    
    var trs = this.createPropertiesTable(shownProperties, elemProperties, {leftWidth: 70});
    _(propertiesDiv, [_table([_tbody(trs)],[['dir','className','propertiesTable']])]);
    
    var isCreate = div === null;
    var saveButton = makeLinkButton(isCreate ? _gtxt("Создать") : _gtxt("Изменить"));
    saveButton.onclick = function()
    {
        var errorElems = [];
        
        if (title.value === '') errorElems.push(title);
        if (!selectedLayersTable.vals.length) errorElems.push(selectedLayersDiv);
        
        for (var i = 0; i < errorElems.length; i++)
            (function(elem)
            {
                $(elem).addClass('error');                
                setTimeout(function()
                {
                    if (elem)
                        $(elem).removeClass('error')
                }, 2000)
            })(errorElems[i]);
        
        if (errorElems.length) return;
        
        var layers = [];
        for (var l = 0; l < selectedLayersTable.vals.length; l++)
            layers.push({LayerID: selectedLayersTable.vals[l].LayerID});
            
        var updateInfo = {Properties: {MultiLayerID: elemProperties.MultiLayerID, Title: title.value, Description: descr.value, WMSAccess: false}, Layers: layers, LayersChanged: true};
        
        var scriptName = isCreate ? "Insert.ashx" : "Update.ashx";
        
        sendCrossDomainJSONRequest(serverBase + "MultiLayer/" + scriptName + "?MultiLayerInfo=" + encodeURIComponent(JSON.stringify(updateInfo)), function(response)
        {
            if ( !parseResponse(response) ) 
                return;
                
            var layerDiv = null;
            
            if (!isCreate)
            {
                layerDiv = $(_queryMapLayers.buildedTree).find("[MultiLayerID='" + response.Result.properties.MultiLayerID + "']")[0];
            }
                
            var newLayerProperties = $.extend(true, response.Result.properties,
            {
                mapName:  _this.mapProperties.name,
                hostName: _this.mapProperties.hostName,
                visible:  isCreate ? true : layerDiv.properties.content.properties.visible,
                styles:   isCreate ? [{MinZoom: response.Result.properties.MinZoom, MaxZoom: 21}] : layerDiv.properties.content.properties.styles
            });
            var convertedCoords = from_merc_geometry(response.Result.geometry);
            
            
            if (!isCreate)
                _queryMapLayers.removeLayer(newLayerProperties.name);

            _layersTree.addLayersToMap({content:{properties:newLayerProperties, geometry:convertedCoords}});
            
            var divParent = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
            
            var li = _layersTree.getChildsList({type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}}, divParent.properties, false, true);
            
            
            
            var divElem = $(li).children("div[MultiLayerID]")[0],
                index = _mapHelper.findTreeElem(divElem).index;
                
            if (isCreate)
            {
                _abstractTree.addNode(_queryMapLayers.buildedTree.firstChild, li);
                _mapHelper.addTreeElem(divParent, index, {type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}});
            }
            else
            {
                $(layerDiv.parentNode).replaceWith(li);
                _mapHelper.findTreeElem($(li).children("div[MultiLayerID]")[0]).elem = {type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}};
            }
                
            _queryMapLayers.addSwappable(li);
            _queryMapLayers.addDraggable(li);
            _layersTree.updateListType(li);
            _mapHelper.updateUnloadEvent(true);
            
            $(jQueryDialog).dialog("close");
			$(jQueryDialog).dialog("destroy");
            jQueryDialog.removeNode(true);
        });
    }
    
    var dialogDiv = _div();
    _(dialogDiv, [_table([_tbody([
        _tr([
            _td([_table([_tbody([
                _tr([_td([propertiesDiv])]),
                _tr([_td([selectedLayersDiv])])
            ])], [['css', 'width', '100%']])], [['css', 'verticalAlign', 'top']]),
            //propertiesDiv]),
            _td([commonLayersListDiv], [['css', 'width', '60%']])]),
        /*_tr([
            _td([selectedLayersDiv], [['css', 'height', '50%']])
            ]), */
        _tr([_td([saveButton], [['attr', 'colspan', '2']])])
    ])], [['css', 'width', '100%'], ['css', 'height', '100%']])]);
    
    var jQueryDialog = showDialog(_gtxt('Мультислой [value0]', elemProperties.title), dialogDiv, 900, 500, false, false, null);
}

mapHelper.prototype.createLayerEditor = function(div, selected, openedStyleIndex)
{
	var elemProperties = div.properties.content.properties,
		_this = this;
	
	if (elemProperties.type == "Vector")
	{
		if (typeof this.layerEditorsHash[elemProperties.name] != 'undefined')
		{
			if (this.layerEditorsHash[elemProperties.name] != false &&
				$(this.layerEditorsHash[elemProperties.name]).tabs('option', 'selected') != selected)
				$(this.layerEditorsHash[elemProperties.name]).tabs('option', 'selected', selected);
			
			return;
		}
		
		this.layerEditorsHash[elemProperties.name] = false;
		
		var mapName = div.properties.content.properties.mapName,
			layerName = div.properties.content.properties.name,
			createTabs = function(layerProperties)
			{
				var id = 'layertabs' + elemProperties.name,
					divProperties = _div(null,[['attr','id','properties' + id]]),
					divStyles = _div(null,[['attr','id','styles' + id]]),
					divQuicklook,
					tabMenu;
				
				if (div.properties.content.properties.GeometryType == 'polygon' &&
					div.properties.content.properties.description &&
					String(div.properties.content.properties.description).toLowerCase().indexOf('спутниковое покрытие') == 0)
				{
					divQuicklook = _div(null,[['attr','id','quicklook' + id]]);
					
					tabMenu = _div([_ul([_li([_a([_t(_gtxt("Свойства"))],[['attr','href','#properties' + id]])]),
										 _li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + id]])]),
										 _li([_a([_t(_gtxt("Накладываемое изображение"))],[['attr','href','#quicklook' + id]])])])]);
					
					_(tabMenu, [divProperties, divStyles, divQuicklook]);
					
					_(divQuicklook, [_this.createQuicklookCanvas(elemProperties, elemProperties.attributes)]);
					_(divQuicklook, [_this.createTiledQuicklookCanvas(elemProperties, elemProperties.attributes)]);
				}
				else
				{
					tabMenu = _div([_ul([_li([_a([_t(_gtxt("Свойства"))],[['attr','href','#properties' + id]])]),
										 _li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + id]])])])]);
					
					_(tabMenu, [divProperties, divStyles]);
				}
				
				var parentIcon = $(div).children("[styleType]")[0],
					filtersCanvas = _div(),
					filterHeader = _this.createFilterHeader(filtersCanvas, elemProperties, parentIcon),
					filters = globalFlashMap.layers[elemProperties.name].filters;
				
				for (var i = 0; i < filters.length; i++)
				{
					var filter = _this.createLoadingFilter(filters[i], elemProperties.styles[i], elemProperties.GeometryType, elemProperties.attributes, parentIcon, (i == openedStyleIndex));
	
					_(filtersCanvas, [filter]);
					
					$(filter.firstChild).treeview();
					
					_this.attachLoadingFilterEvent(filter, filters[i], elemProperties.styles[i], elemProperties.GeometryType, elemProperties.attributes, parentIcon)
				}
				
				for (var i = 0; i < filtersCanvas.childNodes.length; i++)
					_this.updateFilterMoveButtons(filtersCanvas.childNodes[i])
			
				_(divStyles, [filterHeader, filtersCanvas]);
				
				var pos = _this.getDialogPos(div, true, 390),
					closeFunc = function()
					{
						var newStyles = _this.updateStyles(filtersCanvas),
							multiStyleParent = $(div).children('[multiStyle]')[0];
						
						for (var i = 0; i < filtersCanvas.childNodes.length; i++)
							filtersCanvas.childNodes[i].removeColorPickers();
						
						elemProperties.styles = newStyles;
												
						if (div.properties.content.properties.GeometryType == 'polygon' &&
							div.properties.content.properties.description &&
							String(div.properties.content.properties.description).toLowerCase().indexOf('спутниковое покрытие') == 0 &&
							divQuicklook)
						{
							elemProperties.Quicklook = $(divQuicklook).find("[paramName='Quicklook']")[0].value;
							
							elemProperties.TiledQuicklook = $(divQuicklook).find("[paramName='TiledQuicklook']")[0].value;
							
							var TiledQuicklookMinZoomValue = $(divQuicklook).find("[paramName='TiledQuicklookMinZoom']")[0].value,
								TiledQuicklookMaxZoomValue = $(divQuicklook).find("[paramName='TiledQuicklookMaxZoom']")[0].value;
							
							if (TiledQuicklookMinZoomValue != '' && !isNaN(Number(TiledQuicklookMinZoomValue)))
								elemProperties.TiledQuicklookMinZoom = Number(TiledQuicklookMinZoomValue);
							else
								elemProperties.TiledQuicklookMinZoom = null;
							
							if (TiledQuicklookMaxZoomValue != '' && !isNaN(Number(TiledQuicklookMaxZoomValue)))
								elemProperties.TiledQuicklookMaxZoom = Number(TiledQuicklookMaxZoomValue);
							else
								elemProperties.TiledQuicklookMaxZoom = null;
						}
						
						var multiFiltersFlag = (parentIcon.getAttribute('styleType') == 'multi' && filtersCanvas.childNodes.length > 1), // было много стилей и осталось
							colorIconFlag = (parentIcon.getAttribute('styleType') == 'color' && filtersCanvas.childNodes.length == 1 && (typeof newStyles[0].RenderStyle.marker != 'undefined') && (typeof newStyles[0].RenderStyle.marker.image == 'undefined')); // была не иконка и осталась
						
						if (multiFiltersFlag) {}
						else if (colorIconFlag) {}
						else
						{
							var newIcon = _this.createStylesEditorIcon(newStyles, div.properties.content.properties.GeometryType.toLowerCase());
							newIcon.onclick = function()
							{
								_this.createLayerEditor(div, 1, div.properties.content.properties.styles.length > 1 ? -1 : 0);
							}
							
							$(parentIcon).replaceWith(newIcon);
						}
						
						removeChilds(multiStyleParent);
						
						_this.createMultiStyle(elemProperties, multiStyleParent)
						
						delete _this.layerEditorsHash[elemProperties.name];
						
						_this.findTreeElem(div).elem.content.properties = elemProperties;
						
						return false;
					};
				
				_this.createLoadingLayerEditorProperties(div, divProperties, layerProperties);
				
				showDialog(_gtxt('Слой [value0]', elemProperties.title), tabMenu, 330, 390, pos.left, pos.top, null, closeFunc);
				_this.layerEditorsHash[elemProperties.name] = tabMenu;
				
				// при сохранении карты сбросим все временные стили в json карты
				tabMenu.closeFunc = closeFunc;
				
				$(tabMenu).tabs({selected: selected});
				
				$(filtersCanvas).find("[filterTable]").each(function()
				{
					this.setFilter();
				})
				
				if (selected == 1 && openedStyleIndex > 0)
					tabMenu.parentNode.scrollTop = ($.browser.msie ? 54 : 58) + openedStyleIndex * ($.browser.msie ? 34 : 32);
			};
		
		if (!this.attrValues[mapName])
			this.attrValues[mapName] = {};

		sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerInfo.ashx?WrapStyle=func&&NeedAttrValues=false&LayerID=" + div.properties.content.properties.LayerID, function(response)
		{
			if (!parseResponse(response))
				return;
			
			_this.attrValues[mapName][layerName] = new LazyAttributeValuesProviderFromServer(response.Result.Attributes, div.properties.content.properties.LayerID);
			
			createTabs(response.Result);
		})
	}
	else
	{
		if (elemProperties.LayerID)
		{
			if (this.layerEditorsHash[elemProperties.name])
				return;
			
			this.layerEditorsHash[elemProperties.name] = true;
			
			var id = 'layertabs' + elemProperties.name,
				tabMenu = _div([_ul([_li([_a([_t(_gtxt("Свойства"))],[['attr','href','#properties' + id]])]),
									 _li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + id]])])])]),
				divProperties = _div(null,[['attr','id','properties' + id]]),
				divStyles = _div(null,[['attr','id','styles' + id]]);
			
			_(tabMenu, [divProperties, divStyles]);
			
			var parentObject = globalFlashMap.layers[div.properties.content.properties.name],
				parentStyle = div.properties.content.properties.styles[0],
				minZoomInput = _input(null, [['dir','className','inputStyle'],['attr','paramName','MinZoom'],['css','width','30px'],['attr','value', parentStyle.MinZoom || 1]]),
				maxZoomInput = _input(null, [['dir','className','inputStyle'],['attr','paramName','MaxZoom'],['css','width','30px'],['attr','value', parentStyle.MaxZoom || 21]]),
				liMinZoom = _li([_div([_table([_tbody([_tr([_td([_span([_t("Мин. зум")],[['css','fontSize','12px']])],[['css','width','100px']]),_td([minZoomInput])])])])])]),
				liMaxZoom = _li([_div([_table([_tbody([_tr([_td([_span([_t("Макс. зум")],[['css','fontSize','12px']])],[['css','width','100px']]),_td([maxZoomInput])])])])])]);
			
			this.checkZoom(minZoomInput, maxZoomInput);
			
			minZoomInput.onkeyup = maxZoomInput.onkeyup = function()
			{
				if (_this.checkZoom(minZoomInput, maxZoomInput))
					parentObject.setZoomBounds(Number(minZoomInput.value), Number(maxZoomInput.value));
				
				return true;
			}

			_(divStyles, [_ul([liMinZoom, liMaxZoom])]);

			this.createLoadingLayerEditorProperties(div, divProperties);
			
			var pos = this.getDialogPos(div, true, 330),
				closeFunc = function()
				{
					div.properties.content.properties.styles[0].MinZoom = minZoomInput.value;
					div.properties.content.properties.styles[0].MaxZoom = maxZoomInput.value;
					
					delete _this.layerEditorsHash[elemProperties.name];
					
					_this.findTreeElem(div).elem.content.properties = div.properties.content.properties;
					
					// if (_this.drawingBorders.[elemProperties.name])
					// {
						// _this.drawingBorders[elemProperties.name].remove();
						
						// delete _this.drawingBorders[elemProperties.name];
					// }
					_this.drawingBorders.removeRoute(elemProperties.name, true);
					
					if ($$('drawingBorderDialog' + elemProperties.name))
						removeDialog($$('drawingBorderDialog' + elemProperties.name).parentNode);
					
					return false;
				};
			
			showDialog(_gtxt('Слой [value0]', elemProperties.title), tabMenu, 330, 330, pos.left, pos.top, null, closeFunc);
			
			$(tabMenu).tabs({selected: 0});
		}
		else
		{
			//window.open(serverBase + "MultiLayer/Edit.aspx?MultiLayerID=" + elemProperties.MultiLayerID, "_blank")
            this.createMultiLayerEditorServer(elemProperties, div);
        }
	}
}

mapHelper.prototype.createGroupEditor = function(div)
{
	var elemProperties = div.properties.content.properties,
		_this = this;
	
	if (this.groupEditorsHash[elemProperties.GroupID])
		return;
	
	var pos = this.getDialogPos(div, true, 140),
		closeFunc = function()
		{
			delete _this.groupEditorsHash[elemProperties.GroupID];
			
			return false;
		};
	
	var canvas = this.createGroupEditorProperties(div, false);
	showDialog(_gtxt('Группа [value0]', elemProperties.title), canvas, 340, 140, pos.left, pos.top, null, closeFunc);
	this.groupEditorsHash[elemProperties.GroupID] = true;
	
	canvas.parentNode.style.width = canvas.clientWidth + 'px';
}

mapHelper.prototype.createMapEditor = function(div)
{
	var elemProperties = div.properties.properties,
		_this = this;
	
	if (this.mapEditorsHash[elemProperties.MapID])
		return;
	
	var pos = this.getDialogPos(div, true, 530),
		closeFunc = function()
		{
			delete _this.mapEditorsHash[elemProperties.MapID];
			
			return false;
		};
	
	var canvas = this.createGroupEditorProperties(div, true);
	showDialog(_gtxt('Карта [value0]', elemProperties.title), canvas, 340, 330, pos.left, pos.top, null, closeFunc);
	this.mapEditorsHash[elemProperties.MapID] = true;
	
	$(canvas).tabs({selected: 0});
	
	canvas.parentNode.style.width = canvas.clientWidth + 'px';
}

mapHelper.prototype.createDrawingStylesEditorIcon = function(style, type)
{
	var icon = this.createGeometryIcon(style, type);
	
	if ($.browser.msie)
	{
		icon.style.width = '9px';
		icon.style.height = '13px';
		icon.style.margin = '0px 3px -3px 1px';
	}
	
	_title(icon, _gtxt("Редактировать стиль"));
	
	return icon;
}

mapHelper.prototype.createDrawingStylesEditor = function(parentObject, style, elemCanvas)
{
	var _this = this,
		templateStyle = {};
	
	$.extend(true, templateStyle, style);
	
	elemCanvas.onclick = function()
	{
		var canvas = _div(null,[['css','marginTop','10px']]),
			outlineParent = _tr(),
			outlineTitleTds = [],
			outlineTds = [];
		
		outlineTitleTds.push(_td([_t(_gtxt("Граница"))],[['css','width','70px']]));
		
		var outlineColor = _this.createColorPicker(templateStyle.outline.color,
			function (colpkr){
				$(colpkr).fadeIn(500);
				return false;
			},
			function (colpkr){
				$(colpkr).fadeOut(500);
				return false;
			},
			function (hsb, hex, rgb) {
				outlineColor.style.backgroundColor = '#' + hex;
				
				templateStyle.outline.color = outlineColor.hex = parseInt('0x' + hex);
				
				$(elemCanvas).find(".borderIcon")[0].style.borderColor = '#' + hex;
				
				_this.setMapStyle(parentObject, templateStyle);
			})
		
		outlineColor.hex = templateStyle.outline.color;
		
		_title(outlineColor, _gtxt("Цвет"));

		outlineTds.push(_td([outlineColor],[['css','width','40px']]));
			
		var divSlider = _this.createSlider(templateStyle.outline.opacity,
				function(event, ui)
				{
					templateStyle.outline.opacity = ui.value;
					
					_this.setMapStyle(parentObject, templateStyle);
				})
		
		_title(divSlider, _gtxt("Прозрачность"));

		outlineTds.push(_td([divSlider],[['css','width','100px'],['css','padding','4px 5px 3px 5px']]));
		
		var outlineThick = _this.createInput((templateStyle.outline && typeof templateStyle.outline.thickness != 'undefined') ? templateStyle.outline.thickness : 2,
				function()
				{
					templateStyle.outline.thickness = Number(this.value);
					
					_this.setMapStyle(parentObject, templateStyle);
					
					return true;
				}),
			closeFunc = function()
			{
				var newIcon = _this.createDrawingStylesEditorIcon(templateStyle, parentObject.geometry.type.toLowerCase());
				_mapHelper.createDrawingStylesEditor(parentObject, templateStyle, newIcon);
				
				$(elemCanvas).replaceWith(newIcon);
				
				$(canvas).find(".colorSelector").each(function()
				{
					$$($(this).data("colorpickerId")).removeNode(true);
				});
			};
		
		_title(outlineThick, _gtxt("Толщина линии"));
		
		outlineTds.push(_td([outlineThick],[['css','width','30px']]));
		
		_(outlineParent, outlineTitleTds.concat(_td([_div([_table([_tbody([_tr(outlineTds)])])],[['attr','fade',true]])])));
		
		var text = _input(null, [['attr','value', parentObject.properties.text ? parentObject.properties.text : ""],['dir','className','inputStyle'],['css','width','180px']]);
		text.onkeyup = function()
		{
			parentObject.properties.text = this.value;
			
			removeChilds(parentObject.text);
			
			_(parentObject.text, [_t(this.value ? this.value.replace(/<[^<>]*>/g, " ") : "")]);
			
			if (this.value)
				parentObject.title.style.display = 'none';
			else
				parentObject.title.style.display = '';
			
			return true;
		}
		
		_(canvas, [_table([_tbody([_tr([_td([_t(_gtxt("Описание"))], [['css','width','70px']]), _td([text])])])]), _br(), _table([_tbody([outlineParent])])])
		
		var pos = _this.getDialogPos(elemCanvas, false, 80);
		showDialog(_gtxt('Редактирование стилей объекта'), canvas, 280, 110, pos.left, pos.top, false, closeFunc)
	}
	
	elemCanvas.getStyle = function()
	{
		return templateStyle;
	}
}

mapHelper.prototype.createWFSStylesEditor = function(parentObject, style, elemCanvas, geometryType, divCanvas)
{
	var _this = this,
		templateStyle = {};
	
	$.extend(true, templateStyle, style);
	
	elemCanvas.onclick = function()
	{
		var canvasStyles = _div(null,[['css','marginTop','10px']]),
			canvasCharts = _div(null,[['css','marginTop','10px']]),
			closeFunc = function()
			{
				var newIcon = _this.createStylesEditorIcon([{MinZoom:1,MaxZoom:21,RenderStyle:templateStyle}], geometryType);
				_mapHelper.createWFSStylesEditor(parentObject, templateStyle, newIcon, geometryType, divCanvas);
				
				$(elemCanvas).replaceWith(newIcon);
				
				$(canvasStyles).find(".colorSelector").each(function()
				{
					$$($(this).data("colorpickerId")).removeNode(true);
				});
				
				var layerElemCanvas = $(divCanvas).find("[geometryType='" + geometryType.toUpperCase() + "']")[0];
				layerElemCanvas.graphDataType = $(canvasCharts).find("select")[0].value;
				layerElemCanvas.graphDataProperties = $(canvasCharts).find("input")[0].value;
			};
		
		var id = 'wfstabs' + String(Math.random()).substring(2, 9),
			tabMenu = _div([_ul([_li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + id]])]),
								 _li([_a([_t(_gtxt("Диаграммы"))],[['attr','href','#graph' + id]])])])]),
			divStyles = _div(null,[['attr','id','styles' + id]]),
			divGraph = _div(null,[['attr','id','graph' + id]]);
		
		_(tabMenu, [divStyles, divGraph]);
		
		_mapHelper.createStyleEditor(canvasStyles, parentObject, templateStyle, geometryType, elemCanvas);
		canvasStyles.firstChild.style.marginLeft = '0px';
		_(divStyles, [canvasStyles]);
		
		_mapHelper.createChartsEditor(canvasCharts, $(divCanvas).find("[geometryType='" + geometryType.toUpperCase() + "']")[0]);
		canvasCharts.firstChild.style.marginLeft = '0px';
		_(divGraph, [canvasCharts]);
		
		var pos = _this.getDialogPos(elemCanvas, false, 160);
		showDialog(_gtxt('Редактирование стилей объекта'), tabMenu, 310, 160, pos.left, pos.top, false, closeFunc);
		
		$(tabMenu).tabs({selected: 0});
	}
	
	elemCanvas.getStyle = function()
	{
		return templateStyle;
	}
}

mapHelper.prototype.createChartsEditor = function(parent, elemCanvas)
{
	var graphTypeSel = _select([_option([_t(_gtxt("График по времени"))], [['attr','value','func']]),
								_option([_t(_gtxt("Круговая"))], [['attr','value','pie']])], [['dir','className','selectStyle'],['css','width','180px']]),
		propertiesMask = _input(null, [['dir','className','inputStyle'],['css','width','180px']]);
	
	switchSelect(graphTypeSel, elemCanvas.graphDataType);
	propertiesMask.value = elemCanvas.graphDataProperties;
	
	_(parent, [_table([_tbody([_tr([_td([_t(_gtxt("Тип"))], [['css','width','100px']]), _td([graphTypeSel])]),
								_tr([_td([_t(_gtxt("Маска атрибутов"))]), _td([propertiesMask])])])])]);
}

mapHelper.prototype.getDialogPos = function(div, offsetFlag, height)
{
	var pos = getOffsetRect(div),
		left = pos.left + 30,
		top = pos.top - 10,
		windowHeight = getWindowHeight();
	
	if (offsetFlag)
	{
		$(div).children('div,img').each(function()
		{ 
			if (!this.getAttribute('multiStyle'))
				left += this.offsetWidth;
		})
	}
	
	if (top + 15 + height > windowHeight)
		top -= (top + 15 + height - windowHeight);
	
	return {left: left, top: top}
}

mapHelper.prototype.createMultiStyle = function(elem, multiStyleParent, treeviewFlag, layerManagerFlag)
{
	var filters = elem.styles;
	
	if (filters.length < 2)
	{
		multiStyleParent.style.display = 'none';
		
		return;
	}
	
	multiStyleParent.style.display = '';
	
	var ulFilters = _ul();
	
	for (var i = 0; i < filters.length; i++)
	{
		var icon = this.createStylesEditorIcon([elem.styles[i]], elem.GeometryType.toLowerCase()),
			name = elem.styles[i].Name || elem.styles[i].Filter || 'Без имени ' + (i + 1),
			li = _li([_div([icon, _span([_t(name)],[['css','marginLeft','3px']])])]);
		
		if (!layerManagerFlag)
		{ 
			(function(i)
			{
				icon.onclick = function()
				{
					_mapHelper.createLayerEditor(multiStyleParent.parentNode, 1, i);
				}
			})(i);
		}
		
		_(ulFilters, [li])
	}
	
	ulFilters.style.display = 'none';
	ulFilters.className = 'hiddenTree';
	
	_(multiStyleParent, [_ul([_li([_div([_t(_gtxt("Стили слоя"))]), ulFilters])])]);
	
	if (typeof treeviewFlag == 'undefined')
		$(multiStyleParent.firstChild).treeview();
}

mapHelper.prototype.updateStyles = function(filterCanvas)
{
	var styles = [];
	
	for (var i = 0; i < filterCanvas.childNodes.length; i++)
	{
		var filter = filterCanvas.childNodes[i],
			newFilterStyle = {};
		
		if (!_abstractTree.getChildsUl(filter.firstChild.firstChild).childNodes.length)
			filter.addFilterParams(newFilterStyle);
		else
		{
			$(filter).find("[paramName]").each(function()
			{
				newFilterStyle[this.getAttribute('paramName')] = this.value;
			})
		}
		
		var filterValueElem = $(filter).find("[filterTable]").length > 0 ? $(filter).find("[filterTable]")[0] : filter,
			filterValue = filterValueElem.getFilter();
		if (filterValue != '' && filterValue != null)
			newFilterStyle.Filter = filterValue;
		
		var balloonValueElem = $(filter).find("[balloonTable]").length > 0 ? $(filter).find("[balloonTable]")[0] : filter,
			balloonValue = balloonValueElem.getBalloon();
			
		$.extend(newFilterStyle, balloonValueElem.getBalloonState());
		
		if (newFilterStyle.Filter == '')
			delete newFilterStyle.Filter;
		if (newFilterStyle.Name == '')
			delete newFilterStyle.Name;
		
		newFilterStyle.MinZoom = Number(newFilterStyle.MinZoom);
		newFilterStyle.MaxZoom = Number(newFilterStyle.MaxZoom);
		
		if (isNaN(newFilterStyle.MinZoom))
			newFilterStyle.MinZoom = 1;
		if (isNaN(newFilterStyle.MinZoom))
			newFilterStyle.MinZoom = 21;
		
		newFilterStyle.RenderStyle = filter.getStyle();
		
		styles.push(newFilterStyle);
	}
	
	return styles;
}

mapHelper.prototype.load = function()
{
	var _this = this;
	
	if (!this.builded)
	{
		var fileName;
		
		if (typeof window.gmxViewerUI !== 'undefined' && typeof window.gmxViewerUI.usageFilePrefix !== 'undefined')
			fileName = window.gmxViewerUI.usageFilePrefix;
		else
			fileName = window.gmxJSHost ? window.gmxJSHost + "usageHelp" : "usageHelp";
		
		fileName += _gtxt("helpPostfix");
		
		_mapHelper._loadHelpTextFromFile(fileName, function( text )
		{
			var div = _div(null, [['dir','className','help']]);
			div.innerHTML = text;
			_(_this.workCanvas, [div]);
		});
		
		this.builded = true;
	}
}

mapHelper.prototype._loadHelpTextFromFile = function( fileName, callback, num, data )
{
	var proceess = function( text )
	{
		if (num ) text = text.replace("{gmxVersion}", num);
		if (data) text = text.replace("{gmxData}", data);
		callback(text);
	}
	
	if (fileName.indexOf("http://") !== 0)
		$.ajax({url: fileName, success: proceess});
	else
		sendCrossDomainJSONRequest(serverBase + "ApiSave.ashx?get=" + encodeURIComponent(fileName), function(response)
		{
			proceess(response.Result);
		});	
}

mapHelper.prototype.version = function()
{
	var _this = this;
	if (!$$('version'))
	{
		function showVersion(num, data)
		{
			var div = $("<div></div>");
			
			var fileName;
			
			if (typeof window.gmxViewerUI !== 'undefined' && typeof window.gmxViewerUI.helpFilePrefix !== 'undefined')
				fileName = window.gmxViewerUI.helpFilePrefix;
			else
				fileName = window.gmxJSHost ? window.gmxJSHost + "help" : "help";
			
			fileName += _gtxt("helpPostfix");
			
			_mapHelper._loadHelpTextFromFile( fileName, function( text )
			{
				div.html(text);
				showDialog(_gtxt("О проекте"), div[0], 320, 300, false, false);
			}, num, data );			
			}
			
		if (!this.versionNum)
		{
			var _this = this;
			
			$.ajax({
				url: '../version.txt',
				success: function(resp)
				{
				  _this.versionNum = strip(String(resp.split('\n')[0]));
				  _this.versionData = strip(String(resp.split('\n')[1]));
				  
				  showVersion(_this.versionNum, _this.versionData)
				},
				error: function(resp)
				{
				  _this.versionNum = '1.6';
				  _this.versionData = _gtxt('файл версии отсутствует');
				  
				  showVersion('1.6', _this.versionData)
				},
				dataType: 'text'
			});

		}
		else
			showVersion(this.versionNum, this.versionData)
	}
}

mapHelper.prototype.userFeedback = function()
{
	var feedbackMarkers = [globalFlashMap.addObject({type:'POINT', coordinates: [0, 0]}), globalFlashMap.addObject({type:'POINT', coordinates: [0, 0]})];
	
  	feedbackMarkers[0].setStyle({marker: {image: "img/au.png"}},{marker: {image: "img/auh.png"}});
  	feedbackMarkers[1].setStyle({marker: {image: "img/bu.png"}},{marker: {image: "img/buh.png"}});
	
	feedbackMarkers[0].setVisible(false);
	feedbackMarkers[1].setVisible(false);
	
	for (var i = 0; i < 2; i++)
	{
		(function(i)
		{
	    	feedbackMarkers[i].setHandler('onMouseDown', function()
	    	{
	    		var draggedPoint = feedbackMarkers[i],
	    			dx = draggedPoint.getGeometry().coordinates[0] - globalFlashMap.getMouseX(),
	    			dy = draggedPoint.getGeometry().coordinates[1] - globalFlashMap.getMouseY();

				globalFlashMap.freeze();
				globalFlashMap.setHandler('onMouseMove', function()
				{
					draggedPoint.setPoint(globalFlashMap.getMouseX() + dx, globalFlashMap.getMouseY() + dy);
				});
	    	});
	    	feedbackMarkers[i].setHandler('onMouseUp', function()
	    	{
	    		globalFlashMap.unfreeze();
				globalFlashMap.setHandler('onMouseMove', null);
	    	});
    	})(i)
	}
	
	var reasonSelect = _select([_option([_t(_gtxt("Отсутствие объекта на карте"))],[['attr','value','1']]),
								_option([_t(_gtxt("Неверное название объекта"))],[['attr','value','2']]),
								_option([_t(_gtxt("Объекта не должно быть на карте"))],[['attr','value','3']]),
								_option([_t(_gtxt("Неправильное расположене объекта"))],[['attr','value','4']]),
								_option([_t(_gtxt("Другое"))],[['attr','value','5']])], [['dir','className','selectStyle'],['css','width','250px'],['css','fontSize','13px']]),
		spanAction = _span(),
		descrField = _textarea(null, [['dir','className','inputStyle'],['css','width','250px'],['css','height','70px'],['css','fontSize','13px']]),
		nameField = _input(null, [['dir','className','inputStyle'],['css','width','250px'],['css','fontSize','13px']]),
		emailField = _input(null, [['dir','className','inputStyle'],['css','width','250px'],['css','fontSize','13px']]),
		submitButton = makeButton(_gtxt("Отправить"));
	
	reasonSelect.onchange = function()
	{
		var mapBounds = _mapHelper.getMapBounds();
		feedbackMarkers[0].setGeometry({type:'POINT', coordinates: [globalFlashMap.getX(),globalFlashMap.getY()]})
		feedbackMarkers[1].setGeometry({type:'POINT', coordinates: [mapBounds.left + 0.6 * (mapBounds.right - mapBounds.left), mapBounds.bottom + 0.4 * (mapBounds.top - mapBounds.bottom)]})
		
		removeChilds(spanAction);
			
		switch (this.selectedIndex)
		{
			case 0: 
				feedbackMarkers[0].setVisible(true);
				feedbackMarkers[1].setVisible(false);
				
				_(spanAction, [_t(_gtxt("$$userHelp$$_1"))])
				
				break;
			case 1: 
				feedbackMarkers[0].setVisible(true);
				feedbackMarkers[1].setVisible(false);
				
				_(spanAction, [_t(_gtxt("$$userHelp$$_2"))])
				
				break;
			case 2: 
				feedbackMarkers[0].setVisible(true);
				feedbackMarkers[1].setVisible(false);
				
				_(spanAction, [_t(_gtxt("$$userHelp$$_3"))])
				
				break;
			case 3: 
				feedbackMarkers[0].setVisible(true);
				feedbackMarkers[1].setVisible(true);
				
				_(spanAction, [_t(_gtxt("$$userHelp$$_4"))])
				
				break;
			case 4: 
				feedbackMarkers[0].setVisible(true);
				feedbackMarkers[1].setVisible(false);
				
				break;
		}
	}
	
	descrField.onkeyup = function(e)
	{
		if (this.value != '')
			submitButton.disabled = false;
		else
			submitButton.disabled = true;
	}

	submitButton.disabled = true;
	
	submitButton.onclick = function()
	{
	}
	
	var canvas = _div([_span([_t(_gtxt("Причина ошибки:"))], [['css','color','#000000'],['css','fontSize','13px']]), _br(), reasonSelect, _br(),
					   _span([_t(_gtxt("Как исправить ошибку?"))], [['css','color','#000000'],['css','fontSize','13px']]), 
					   _div([spanAction],[['css','height','35px'],['css','padding','0px 4px']]),
					   descrField, _br(),
					   _span([_t(_gtxt("Мое имя:"))], [['css','color','#000000'],['css','fontSize','13px']]), _br(), nameField, _br(),
					   _span([_t(_gtxt("Мой e-mail:"))], [['css','color','#000000'],['css','fontSize','13px']]), _br(), emailField,
					   _div([submitButton],[['css','textAlign','center'],['css','marginTop','5px']])]),
		closeFunc = function()
			{
				feedbackMarkers[0].remove();
				feedbackMarkers[1].remove();
			};
	
	showDialog(_gtxt("Сообщить об ошибке на карте"), canvas, 284, 310, 300, 250, null, closeFunc);
	
	canvas.parentNode.style.width = canvas.offsetWidth + 'px';

	reasonSelect.onchange();
}

mapHelper.prototype.createAPIMapDialog = function()
{
	var options = {
			requestAPIKey: (this.mapProperties.UseKosmosnimkiAPI || this.mapProperties.hostName == "maps.kosmosnimki.ru") && window.apiKey !== false,
			saveBaseLayers: false
		};
		
	if (window.defaultLayersVisibility) options.defaultLayersVisibility = window.defaultLayersVisibility;
	
	nsMapCommon.createAPIMapDialog(
		_mapHelper.mapProperties.name, 
		_mapHelper.mapProperties.hostName, 
		options
	);
}

mapHelper.prototype.print = function()
{
		//var printMap = this.createAPIMap(false),
		var loadFunc = uniqueGlobalName(function()
			{
				var drawnObjects = [],
					layersVisibility = {};
				
				_mapHelper.forEachMyLayer(function(layer)
				{
					layersVisibility[layer.properties.name] = layer.isVisible;
				});
				
				globalFlashMap.drawing.forEachObject(function(o) 
				{
					var elem = {properties: o.properties, color: o.color, geometry: o.geometry};
					
					if (o.geometry.type != "POINT")
					{
						//var style = $(o.canvas).find("div.colorIcon")[0].getStyle();
						var style = o.getStyle();
						
						elem.thickness = style.regular.outline.thickness;
						elem.color = style.regular.outline.color;
						elem.opacity = style.regular.outline.opacity;
					}
					
					drawnObjects.push(elem);
				});
				
				var mapState = {
					host: _mapHelper.mapProperties.hostName,
					mode: globalFlashMap.getBaseLayer(),
					mapName: globalMapName,
					position: { 
						x: globalFlashMap.getX(), 
						y: globalFlashMap.getY(), 
						z: globalFlashMap.getZ()
					},
					layersVisibility: layersVisibility,
					drawnObjects: drawnObjects,
					language: window.language,
					grid: _mapHelper.gridView
				}
				
				if ( window.apiKey )
					mapState.apiKey = window.apiKey;
				
				return mapState;
			}),
			printDoc = window.open("print-iframe.html?" + loadFunc, "_blank", "width=" + String(640) + ",height=" + String(getWindowHeight()) + ",resizable=yes,scrollbars=yes");
		
		printDoc.document.close();
		
		var interval = setInterval(function()
		{
			if (printDoc.createFlashMap)
			{
				clearInterval(interval);
				
				printDoc.resize();
			}
		}, 200)
		
		return false;
}

mapHelper.prototype.findElem = function(elem, attrName, name, parents)
{
	var childs = typeof elem.children != 'undefined' ? elem.children : elem.content.children;
	
	for (var i = 0; i < childs.length; i++)
	{
		if (childs[i].content.properties[attrName] == name)
			return {elem:childs[i], parents: [elem].concat(parents), index: i};
		
		if (typeof childs[i].content.children != 'undefined')
		{
			var res = this.findElem(childs[i], attrName, name, [elem].concat(parents));
			
			if (res)
				return res;
		}
	}
	
	return false;
}

mapHelper.prototype.removeTreeElem = function(div)
{
	var elem = this.findTreeElem(div);
	
	if (typeof elem.parents[0].children != 'undefined')
		elem.parents[0].children.splice(elem.index, 1);
	else
		elem.parents[0].content.children.splice(elem.index, 1);
}

mapHelper.prototype.addTreeElem = function(div, index, elemProperties)
{
	var elem = this.findTreeElem(div);
	
	if (typeof elem.elem.children != 'undefined')
		elem.elem.children.splice(index, 0, elemProperties);
	else
		elem.elem.content.children.splice(index, 0, elemProperties);
}

mapHelper.prototype.findTreeElem = function(div)
{
	if (div.getAttribute("MapID"))
		return {elem:this.mapTree, parents:[], index:false};
	else if (div.getAttribute("GroupID"))
		return this.findElem(this.mapTree, "GroupID", div.getAttribute("GroupID"), [this.mapTree]);
	else if (div.getAttribute("LayerID"))
		return this.findElem(this.mapTree, "LayerID", div.getAttribute("LayerID"), [this.mapTree]);
	else if (div.getAttribute("MultiLayerID"))
		return this.findElem(this.mapTree, "MultiLayerID", div.getAttribute("MultiLayerID"), [this.mapTree]);
}

mapHelper.prototype.findChilds = function(treeElem, callback, flag)
{
	var childsArr = treeElem.content ? treeElem.content.children : treeElem.children;
	if (childsArr)
	{
		for (var i = 0; i < childsArr.length; i++)
		{
			var child = childsArr[i];
			
			if (child.type == 'group')
				this.findChilds(child, callback, flag && child.content.properties.visible)
			else
				callback(child, flag && child.content.properties.visible);
		}
	}
}

mapHelper.prototype.findTreeElems = function(treeElem, callback, flag, list)
{
	var childsArr = treeElem.content ? treeElem.content.children : treeElem.children;
	
	for (var i = 0; i < childsArr.length; i++)
	{
		var child = childsArr[i];
		
		if (child.type == 'group')
		{
			callback(child, flag, treeElem.content ? treeElem.content.properties.list : treeElem.properties.list, i);
			
			this.findTreeElems(child, callback, flag && child.content.properties.visible, treeElem.content ? treeElem.content.properties.list : treeElem.properties.list)
		}
		else
			callback(child, flag, treeElem.content ? treeElem.content.properties.list : treeElem.properties.list, i);
	}
}

var _mapHelper = new mapHelper();


mapHelp.mapHelp.load = function()
{
	var alreadyLoaded = _mapHelper.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_mapHelper.load()
}

mapHelp.mapHelp.unload = function()
{
}

mapHelp.serviceHelp.load = function()
{
	var alreadyLoaded = _serviceHelper.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_serviceHelper.load()
}
mapHelp.serviceHelp.unload = function()
{
}

var serviceHelper = function()
{
	this.builded = false;

}

serviceHelper.prototype = new leftMenu();

serviceHelper.prototype.load = function()
{
	var _this = this;
	if (!this.builded)
	{		
		var fileName;
		
		if (typeof window.gmxViewerUI !== 'undefined' && typeof window.gmxViewerUI.servicesFilePrefix !== 'undefined')
			fileName = window.gmxViewerUI.servicesFilePrefix;
		else
			fileName = window.gmxJSHost ? window.gmxJSHost + "servicesHelp" : "servicesHelp";
		
		fileName += _gtxt("helpPostfix");
		
		_mapHelper._loadHelpTextFromFile(fileName, function( text )
		{
			var div = _div(null, [['dir','className','help']]);
			div.innerHTML = text;
			_(_this.workCanvas, [div]);
		});
		
		this.builded = true;
	}
}	

var _serviceHelper = new serviceHelper();

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
		
		if (elem.geometry.type != "POINT")
		{
			var icon = _mapHelper.createDrawingStylesEditorIcon(style, elem.geometry.type.toLowerCase());
			_mapHelper.createDrawingStylesEditor(elem, style, icon);
			
			$(elem.canvas).find("div.colorIcon").replaceWith(icon);
		}
	}
	
	_queryMapLayers.applyState(parsedState.condition, parsedState.mapStyles);
}

var _queryTabs = new queryTabs();

mapHelp.tabs.load = function()
{
	var alreadyLoaded = _queryTabs.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_queryTabs.load()
}
mapHelp.tabs.unload = function()
{
}


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
		
		hostButton.value = (window.mapHostName ? window.mapHostName : parseUri(window.location.href).host);
		
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

		this.mapsCanvas = _div(null,[['dir','className','drawingObjectsCanvas'],['css','paddingLeft','0px']]);
		
		_(this.workCanvas, [this.mapsCanvas]);
		
		for (var i = 0; i < this.maps.length; ++i)
			this.addMapElem(this.maps[i].hostName, this.maps[i].mapName);
		
		
		this.builded = true;
	}
}

queryExternalMaps.prototype.addMapElem = function(hostName, mapName)
{
	var mapElem = _div(),
		div = _div(null, [['css','position','relative'],['css','margin','2px 0px']]),
		remove = makeImageButton('img/closemin.png','img/close_orange.png');
	
	for (var i = 0; i < this.mapsCanvas.childNodes.length; ++i)
	{
		var divChild = this.mapsCanvas.childNodes[i];
		
		if (divChild.hostName == hostName && divChild.mapName == mapName)
			return;
	}
	
	div.hostName = hostName;
	div.mapName = mapName;
	
	remove.className = 'remove';
	remove.style.right = '7px';
	
	_(div, [mapElem, remove]);
	_(this.mapsCanvas, [div]);
	
	this.addMap(hostName, mapName, mapElem);
	
	remove.onclick = function()
	{
		div.removeNode(true);
		
		if (!mapElem.extLayersTree)
			return;
		
		forEachLayer(mapElem.extLayersTree.mapHelper.mapTree, function(layer, isVisible) 
		{ 
			var name = layer.properties.name;
			
			if (globalFlashMap.layers[name].external)
				mapElem.extLayersTree.removeLayer(name);
		});
	}
}

queryExternalMaps.prototype.addMap = function(hostName, mapName, parent)
{
	var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px'],['css','width','16px'],['css','height','16px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]),
		_this = this;

	_(parent, [loading]);
	
	this.loadMap(hostName, mapName, function(treeJSON)
	{
		if (treeJSON == null)
		{
			loading.parentNode.parentNode.removeNode(true);
			
			showErrorMessage(_gtxt("Невозможно загрузить карту [value0] с домена [value1]", mapName, hostName), true);
			
			return;
		}
		
		var extMapHelper = new externalMapHelper(),
			extLayersTree = new externalLayersTree();
		
		extMapHelper.mapTree = treeJSON;
		extLayersTree.mapHelper = extMapHelper;
		
		var	tree = extLayersTree.drawTree(treeJSON);
		$(tree).treeview();
		extLayersTree.runLoadingFuncs();
		
		loading.removeNode(true);
		_(parent, [tree]);
		
		parent.extLayersTree = extLayersTree;
	});
}

queryExternalMaps.prototype.loadMap = function(hostName, mapName, callback)
{
	loadMapJSON(hostName, mapName, function(layers)
	{
		if (layers != null)
		{
			forEachLayer(layers, function(layer, isVisible) 
			{ 
				var name = layer.properties.name;
				
				if (!globalFlashMap.layers[name])
				{
					globalFlashMap.addLayer(layer, isVisible);
					globalFlashMap.layers[name].setVisible(isVisible);
					globalFlashMap.layers[name].bounds = getLayerBounds(globalFlashMap.layers[name].geometry.coordinates[0], globalFlashMap.layers[name]);
					
					globalFlashMap.layers[name].external = true;
				}
			});
			
			if (layers.properties.Copyright)
			{
				var obj = globalFlashMap.addObject();
				obj.setCopyright(layers.properties.Copyright);
			}
			if (layers.properties.OnLoad)
			{
				try { eval("_kosmosnimki_temp=(" + layers.properties.OnLoad + ")")(globalFlashMap); }
				catch (e) { alert(e); }
			}
			
			var data = layers;
			data.properties.hostName = hostName;
			
			callback(data);
			$(_queryExternalMaps).trigger('map_loaded', data);
		}
		else
		{
			callback(null);
			$(_queryExternalMaps).trigger('map_loaded', null);
		}
	}, 
	function()
	{
		callback(null);
		$(_queryExternalMaps).trigger('map_loaded', null);
	});
}

var _queryExternalMaps = new queryExternalMaps();

mapHelp.externalMaps.load = function()
{
	var alreadyLoaded = _queryExternalMaps.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_queryExternalMaps.load()
}
mapHelp.externalMaps.unload = function()
{
}

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
}

userObjects.prototype.load = function()
{
	this.loadWFS();
	this.loadWMS();
	this.loadTabs();
	this.loadExternalMaps();
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