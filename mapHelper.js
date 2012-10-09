var nsGmx = nsGmx || {};

nsGmx.mapHelper = {
    
}

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
    this._treeView = false;
	
	this.defaultStyles = 
	{
		'point':{outline:{color:0x0000FF, thickness:1},marker:{size:3}, fill:{color:0xFFFFFF, opacity:20}},
		'linestring':{outline:{color:0x0000FF, thickness:1}},
		'polygon':{outline:{color:0x0000FF, thickness:1}, fill:{color:0xFFFFFF, opacity:20}}
	}
	
	this.stylesDialogsHash = {};
	this.drawingDialogsHash = {};
	
	this.layerEditorsHash = {};
	
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
		
		newFilter.setStyle(newStyles[i].RenderStyle);
        
        if (newStyles[i].clusters)
            newFilter.setClusters(newStyles[i].clusters);
		
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

//TODO: remove isEditableStyles
mapHelper.prototype.updateTreeStyles = function(newStyles, div, isEditableStyles)
{
    isEditableStyles = typeof isEditableStyles === 'undefined' || isEditableStyles;
	div.gmxProperties.content.properties.styles = newStyles;
	
	var multiStyleParent = $(div).children('[multiStyle]')[0];
	
	var parentIcon = $(div).children("[styleType]")[0],
		newIcon = _mapHelper.createStylesEditorIcon(newStyles, div.gmxProperties.content.properties.GeometryType.toLowerCase(), {addTitle: isEditableStyles});
        
        
    // if ( isEditableStyles )
    // {
		// newIcon.onclick = function()
		// {
			// _mapHelper.createLayerEditor(div, 1, div.gmxProperties.content.properties.styles.length > 1 ? -1 : 0);
		// }
    // }
		
	$(parentIcon).empty().append(newIcon).attr('styleType', $(newIcon).attr('styleType'));
	
	removeChilds(multiStyleParent);
	
	_mapHelper.createMultiStyle(div.gmxProperties.content.properties, multiStyleParent)
}

mapHelper.prototype.restoreTinyReference = function(id, callbackSuccess, errorCallback)
{
	window.suppressDefaultPermalink = true;
	sendCrossDomainJSONRequest(serverBase + "TinyReference/Get.ashx?id=" + id, function(response)
	{
		//если пермалинк не найден, сервер не возвращает ошибку, а просто пустой результат
		if ( !parseResponse(response) || !response.Result )
		{
			errorCallback && errorCallback();
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
	
	this.findTreeElems(_layersTree.treeModel.getRawTree(), function(elem)
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
	
	return {
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
}

mapHelper.prototype.getMapStyles = function()
{
	var styles = {};
	
	this.findChilds(_layersTree.treeModel.getRawTree(), function(child)
	{
		if (child.content.properties.type == "Vector" && $("div[LayerID='" + child.content.properties.LayerID + "']").length)
			styles[child.content.properties.name] = child.content.properties.styles;
	}, true);
	
	return styles;
}

mapHelper.prototype.showPermalink = function()
{
	this.createPermalink(function(id){
									var input = _input(null, [['dir','className','inputStyle'],['attr','value',"http://" + window.location.host + window.location.pathname + "?permalink=" + id + (defaultMapID == globalMapName ? "" : ("&" + globalMapName))],['css','width','270px']])
				
									showDialog(_gtxt("Ссылка на текущее состояние карты:"), _div([input]), 311, 80, false, false);
									
									input.select();
								});
}

mapHelper.prototype.createPermalink = function(callback)
{
	var mapState = this.getMapState();
	
	sendCrossDomainPostRequest(serverBase + "TinyReference/Create.ashx",
								{
									WrapStyle: 'window',
									content: JSON.stringify(mapState)
								}, 
								function(response)
								{
									if (!parseResponse(response))
										return;
									
									callback(response.Result);
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
		
		var lastStyle = elemCanvas.parentNode.gmxProperties.content.properties.styles[elemCanvas.parentNode.gmxProperties.content.properties.styles.length - 1],
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

mapHelper.prototype.createSuggestCanvas = function(values, textarea, textTamplate, func, valuesArr, addValueFlag)
{
	var _this = this;
	
	if ( typeof valuesArr != 'undefined' && valuesArr && !(valuesArr instanceof nsGmx.ILazyAttributeValuesProvider) )
		valuesArr = new nsGmx.LazyAttributeValuesProviderFromArray(valuesArr);
	
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
				filter = globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters[filterNum];
			
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
	
	var mapName = elemCanvas.parentNode.gmxProperties.content.properties.mapName,
		layerName = elemCanvas.parentNode.gmxProperties.content.properties.name,
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
	
	if (!this.attrValues[elemCanvas.parentNode.gmxProperties.content.properties.mapName][elemCanvas.parentNode.gmxProperties.content.properties.name])
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
				filter = globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters[filterNum];
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
    
    filterCanvas.getClusterStyle = function()
	{
		return parentStyle.clusters;
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
			filters = globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters,
			newFilters = [];
		
		for (var i = 0; i < filters.length; i++)
			if (i != num)
				newFilters.push(filters[i])
		
		globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters = newFilters;
		
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
	var filters = globalFlashMap.layers[div.gmxProperties.content.properties.name].filters,
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
	
	globalFlashMap.layers[div.gmxProperties.content.properties.name].filters = newFilters;
	
	if (!div.firstChild.checked)
		_click(div.firstChild)
	
	globalFlashMap.layers[div.gmxProperties.content.properties.name].filters[firstNum].bringToDepth(firstNum + 1);
	
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
	
    var zoomPropertiesControl = new nsGmx.ZoomPropertiesControl(parentStyle.MinZoom, parentStyle.MaxZoom);
    
	var filterInput = _textarea([_t(parentStyle.Filter || '')], [['dir','className','inputStyle'],['css','overflow','auto'],['css','margin','1px 0px'],['css','width','260px'],['css','height','40px']]),
        liMinZoom = zoomPropertiesControl.getMinLi(),
		liMaxZoom = zoomPropertiesControl.getMaxLi(),
		ulfilterExpr = _ul([_li([_div()],[['css','paddingLeft','0px'],['css','background','none']])]),
		liLabel = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulLabel = _ul([liLabel]),
		liBalloon = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulBalloon = _ul([liBalloon]),
		liStyle = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulStyle = _ul([liStyle]),
        liClusters = _li([_div()],[['css','paddingLeft','0px'],['css','background','none']]),
		ulClusters = _ul([liClusters]),
        clusterCheckbox,
        clusterControl;
        
    if (geometryType == 'point')
    {
        clusterControl = new nsGmx.ClusterParamsControl(liClusters, parentStyle.clusters);
        $(clusterControl).change(function()
        {
            var filterNum = getOwnChildNumber(ulParent.parentNode.parentNode.parentNode),
                    filter = globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters[filterNum];
                    
            if (clusterControl.isApplyCluster())
            {
                filter.setClusters(clusterControl.getClusterStyle());
            }
            else
            {
                filter.delClusters();
            }
        })
        
        clusterCheckbox = _checkbox(clusterControl.isApplyCluster(), 'checkbox');
        clusterCheckbox.style.marginTop = '2px';
        clusterCheckbox.onchange = function()
        {
            clusterControl.applyClusters(this.checked);
        }
        
        if (!clusterControl.isApplyCluster())
        {
            ulClusters.style.display = 'none';
            ulClusters.className = 'hiddenTree';
        }
    }
        
	// zoom
	$(zoomPropertiesControl).change(function()
    {
        var filterNum = getOwnChildNumber(ulParent.parentNode.parentNode.parentNode),
				filter = globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].filters[filterNum];
			
        if (!globalFlashMap.layers[elemCanvas.parentNode.gmxProperties.content.properties.name].objectId)
            _click(elemCanvas.parentNode.firstChild)
            
        filter.setZoomBounds(this.getMinZoom(), this.getMaxZoom());
    })
	
	// label
	
	var labelAttrSel = nsGmx.Utils._select([_option([_t('')],[['attr','value','']])],[['dir','className','selectStyle'],['css','width','142px']]),
		fontSizeInput = _input(null, [['dir','className','inputStyle'],['attr','labelParamName','FontSize'],['css','width','30px'],['attr','value', templateStyle.label && templateStyle.label.size || '']]),
		checkedLabelColor = (typeof templateStyle.label != 'undefined' && typeof templateStyle.label.color != 'undefined') ? templateStyle.label.color : 0x000000,
		checkedLabelHaloColor = (typeof templateStyle.label != 'undefined' && typeof templateStyle.label.haloColor != 'undefined') ? templateStyle.label.haloColor : 0x000000,
		labelColor = nsGmx.Controls.createColorPicker(checkedLabelColor,
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
				
				nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
			}),
		labelHaloColor = nsGmx.Controls.createColorPicker(checkedLabelHaloColor,
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
				
				nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
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

		nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
	}
	
	fontSizeInput.onkeyup = function()
	{
		if (typeof templateStyle.label == 'undefined')
			return;
		
		templateStyle.label.size = Number(this.value);
		
		nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
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
	parentStyle = globalFlashMap.balloonClassObject.applyBalloonDefaultStyle(parentStyle);
	
	var balloonEditor = this.createBalloonEditor(parentStyle, attrs, elemCanvas, elemCanvas.parentNode.gmxProperties.content.properties.identityField);
	
	_(liBalloon.lastChild, [balloonEditor]);
	
	if (typeof parentStyle.Balloon == 'undefined')
	{
		ulBalloon.style.display = 'none';
		ulBalloon.className = 'hiddenTree';
	}
	
	// common
    
	_(ulParent, [
        liMinZoom, liMaxZoom, 
        _li([_div([_span([_t(_gtxt("Фильтр"))],[['css','fontSize','12px']])]), ulfilterExpr]),
        _li([_div([_span([_t(_gtxt("Подпись"))],[['css','fontSize','12px']])]), ulLabel]), 
        _li([_div([_span([_t(_gtxt("Балун"))],[['css','fontSize','12px']])]), ulBalloon]),
        _li([_div([_span([_t(_gtxt("Символика"))],[['css','fontSize','12px']])]), ulStyle])
    ]);
    
    if (geometryType == 'point')
    {
        _(ulParent, [_li([
            _div([clusterCheckbox, 
            _span([_t(_gtxt("Кластеризация"))],[['css','fontSize','12px'], ['css', 'marginLeft', '4px']])]), 
            ulClusters
        ])])
    }
	
	if (treeviewFlag)
		$(ulParent).treeview();
	
	// styles
	
    var isWindLayer = typeof elemCanvas.parentNode.gmxProperties != 'undefined' &&
				elemCanvas.parentNode.gmxProperties.content.properties.description &&
				String(elemCanvas.parentNode.gmxProperties.content.properties.description).toLowerCase().indexOf('карта ветра') == 0;
	var resObject = this.createStyleEditor(liStyle.lastChild, templateStyle, geometryType, isWindLayer);
    
    $(resObject).change(function()
    {
        nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
    })
	
	ulParent.parentNode.parentNode.parentNode.getStyle = function()
	{
		return templateStyle;
	}
    
    ulParent.parentNode.parentNode.parentNode.getClusterStyle = function()
	{
		return clusterControl && clusterControl.isApplyCluster() ? clusterControl.getClusterStyle() : null;
	}
	
	ulParent.parentNode.parentNode.parentNode.removeColorPickers = function()
	{
		$(liStyle.lastChild).find(".colorSelector").each(function()
		{
			if ($$($(this).data("colorpickerId")))
				$$($(this).data("colorpickerId")).removeNode(true);
		})
		
        if ($$($(labelColor).data("colorpickerId")))
            $$($(labelColor).data("colorpickerId")).removeNode(true);
	}
}

mapHelper.ImageInputControl = function(initURL)
{
    var prevValue = initURL || '';
    var inputUrl = _input(null, [['dir','className','inputStyle'],['attr','value', prevValue], ['css','width','180px']]);
    _title(inputUrl, _gtxt("URL изображения"));
    
    var _this = this;
    
    var update = function()
    {
        if (inputUrl.value != prevValue)
        {
            prevValue = inputUrl.value;
            $(_this).change();
        }
    }
    
    var mainDiv = $("<div/>").append(inputUrl);
    inputUrl.onkeyup = inputUrl.change = update;
    
    if (nsGmx.AuthManager.canDoAction(nsGmx.ACTION_UPLOAD_FILES))
    {
        var userImageIcon = makeImageButton("img/choose2.png", "img/choose2_a.png");
        userImageIcon.onclick = function()
        {
            var imagesDir = nsGmx.AuthManager.getUserFolder() + '\\images';
            sendCrossDomainJSONRequest(serverBase + 'FileBrowser/CreateFolder.ashx?WrapStyle=func&FullName=' + encodeURIComponent(imagesDir), function(response)
            {
                if (!parseResponse(response))
                    return;
                    
                _fileBrowser.createBrowser(_gtxt("Изображение"), ['jpg', 'jpeg', 'png', 'gif', 'swf'], function(path)
                {
                    var relativePath = path.substring(imagesDir.length);
                    if (relativePath[0] == '\\') 
                        relativePath = relativePath.substring(1);
                        
                    inputUrl.value = serverBase + "GetImage.ashx?usr=" + encodeURIComponent(nsGmx.AuthManager.getLogin()) + "&img=" + encodeURIComponent(relativePath);
                    update();
                }, {startDir: imagesDir, restrictDir: imagesDir})
            })
        }
        mainDiv.append(userImageIcon);
    }

    this.getControl = function()
    {
        return mainDiv[0];
    }
    
    this.value = function()
    {
        return inputUrl.value;
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
    else //if ('color' in initFillStyle)
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
        
	selectorDiv.append($("<span/>").text(_gtxt("Заливка"))).append($("<br/>"));
    
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
	var fillColorPicker = nsGmx.Controls.createColorPicker(fillColor,
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
	fillOpacitySlider = nsGmx.Controls.createSlider(fillOpacity,
		function(event, ui)
		{
            fillOpacity = ui.value;
            $(_this).change();
		});
		
	colorContainer.append($("<table/>").append($("<tr/>")
		.append($("<td/>").append(fillColorPicker))
		.append($("<td/>", {'class': 'fillColorOpacity'}).append(fillOpacitySlider))
	));
    
    var patternURL = new mapHelper.ImageInputControl(_fillStyle.image);
    $(patternURL).change(function()
    {
        $(_this).change();
    });
    imagePatternContainer.append(patternURL.getControl());
	
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
	var patternOpacitySlider = nsGmx.Controls.createSlider( _fillStyle.opacity, function(event, ui)
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
				
				var colorPicker = nsGmx.Controls.createColorPicker(_colors[k],
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
            fillStyle.image = patternURL.value();
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
            selectorIconsDiv.show();
        else
            selectorIconsDiv.hide();
    }
}

mapHelper.prototype.createStyleEditor = function(parent, templateStyle, geometryType, isWindLayer)
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
        resObject = {},
		_this = this;
	
	// _(parent, [_table([_tbody([outlineParent, markerSizeParent, fillParent, iconParent])],[['css','marginLeft','-20px']])]);
	_(parent, [_table([_tbody([outlineParent, markerSizeParent, fillParent, iconParent])])]);
	
	var fillStyleControl = new this.FillStyleControl(templateStyle, {showSelectors: geometryType !== 'point'});
    fillStyleControl.setVisibleSelectors(typeof templateStyle.fill != 'undefined');
    $(fillStyleControl).change(function()
    {
        var fillStyle = fillStyleControl.getFillStyle();
        templateStyle.fill = fillStyle;
        $(resObject).change();
    });
	
	showIcon = function()
	{
		_this.hideStyle(outlineParent);
		_this.hideStyle(fillParent);
        fillStyleControl.setVisibleSelectors(false);
        fillParent.style.display = 'none';
		_this.showStyle(iconParent);
		
		templateStyle.marker = {};
		templateStyle.marker.image = inputUrl.value();
		templateStyle.marker.center = true;
		
		delete templateStyle.outline;
		delete templateStyle.fill;

		if (geometryType == "point")
		{
            if ( isWindLayer )
			{
				if (angle.value != '')
					templateStyle.marker.angle = angle.value;
				
				if (scale.value != '')
					templateStyle.marker.scale = scale.value;
				
				templateStyle.marker.color = $(iconParent).find(".colorSelector")[0].hex;				
			}
            _this.hideStyle(markerSizeParent);
            markerSizeParent.style.display = 'none';
		}
		
		if (geometryType != "linestring")
        {
			fillToggle.disabled = true;
        }
			
		$(resObject).change();
	}
	
	showMarker = function()
	{
		_this.showStyle(outlineParent);
        _this.showStyle(markerSizeParent);
        markerSizeParent.style.display = '';
		_this.hideStyle(iconParent);
		
		if (geometryType != "linestring")
		{
            fillParent.style.display = '';
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

		$(resObject).change();
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
	
	var outlineColor = nsGmx.Controls.createColorPicker((templateStyle.outline && typeof templateStyle.outline.color != 'undefined') ? templateStyle.outline.color : 0x0000FF,
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
			
			$(resObject).change();
		})
	
	if (templateStyle.outline && typeof templateStyle.outline.color != 'undefined')
		outlineColor.hex = templateStyle.outline.color;
	else
		outlineColor.hex = 0x0000FF;

	outlineTds.push(_td([outlineColor],[['css','width','40px']]));
		
	var divSlider = nsGmx.Controls.createSlider((templateStyle.outline && typeof templateStyle.outline.opacity != 'undefined') ? templateStyle.outline.opacity : 100,
			function(event, ui)
			{
				templateStyle.outline.opacity = ui.value;
				
				$(resObject).change();
			})

	outlineTds.push(_td([divSlider],[['css','width','100px'],['css','padding','4px 5px 3px 5px']]));
	
	var outlineThick = nsGmx.Controls.createInput((templateStyle.outline && typeof templateStyle.outline.thickness != 'undefined') ? templateStyle.outline.thickness : 2,
			function()
			{
				templateStyle.outline.thickness = Number(this.value);
				
				$(resObject).change();
				
				return true;
			});

	_title(outlineThick, _gtxt("Толщина линии"));
	
	outlineTds.push(_td([outlineThick],[['css','width','30px']]));
	
	var dashInput = _input(null, [['attr', 'value', templateStyle.outline && typeof templateStyle.outline.dashes != 'undefined' ? templateStyle.outline.dashes : ''],['dir','className','inputStyle'],['css','width','140px']]),
		dashSelect = nsGmx.Utils._select(null, [['dir','className','selectStyle'],['css','width','50px'],['css','fontSize','12px'],['css','fontWeight','bold']]),
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
			
			$(resObject).change();
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

				$(resObject).change();
			}
			else
			{
				_this.hideStyle(fillParent);
				
				delete templateStyle.fill;
				
				// if (elemCanvas.nodeName == 'DIV')
					// $(elemCanvas).find(".fillIcon")[0].style.backgroundColor = "#FFFFFF";
				
				$(resObject).change();
			}
		}
		
		fillTitleTds.push(_td([fillToggle],[['css','width','20px'],['css','height','24px']]));
		//fillTitleTds.push(_td([_t(_gtxt("Заливка"))],[['css','width','70px']]));
		fillTitleTds.push(_td([fillStyleControl.getSelector()[0]],[['css','width','70px']]));
		
		var checkedFillColor = (typeof templateStyle.fill != 'undefined' && typeof templateStyle.fill.color != 'undefined') ? templateStyle.fill.color : 0xFFFFFF,
			checkedFillOpacity = (typeof templateStyle.fill != 'undefined' && typeof templateStyle.fill.opacity != 'undefined') ? templateStyle.fill.opacity : 0,
			fillColor = nsGmx.Controls.createColorPicker(checkedFillColor,
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
					
					// if (elemCanvas.nodeName == 'DIV')
						// $(elemCanvas).find(".fillIcon")[0].style.backgroundColor = '#' + hex;
					
					$(resObject).change();
				}),
			fillSlider = nsGmx.Controls.createSlider(checkedFillOpacity,
				function(event, ui)
				{
					templateStyle.fill.opacity = ui.value;
					
					$(resObject).change();
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

    var inputUrl = new mapHelper.ImageInputControl((typeof templateStyle.marker != 'undefined' && templateStyle.marker.image) ? templateStyle.marker.image : '');
    $(inputUrl).change(function()
    {
        if (inputUrl.value() != '')
		{
			showIcon();
			
			outlineToggle.checked = false;
			iconToggle.checked = true;
		}
		
		if (typeof templateStyle.marker == 'undefined')
			templateStyle.marker = {};
			
		templateStyle.marker.image = inputUrl.value();
		
		$(resObject).change();
    });
    
	//inputUrl = _input(null, [['dir','className','inputStyle'],['attr','value', (typeof templateStyle.marker != 'undefined' && templateStyle.marker.image) ? templateStyle.marker.image : ''],['css','width','180px']]);	
	// inputUrl.onkeyup = function()
	// {
		// if (this.value != '')
		// {
			// showIcon();
			
			// outlineToggle.checked = false;
			// iconToggle.checked = true;
		// }
		
		// if (typeof templateStyle.marker == 'undefined')
			// templateStyle.marker = {};
			
		// templateStyle.marker.image = this.value;
		
		// $(templateStyle).change();
	// }
	
	//_title(inputUrl, _gtxt("Url изображения"));
	
	if (geometryType == "point")
	{        
        var markerSizeInput = nsGmx.Controls.createInput(templateStyle.marker && templateStyle.marker.size || 3,
			function()
			{
				templateStyle.marker.size = Number(this.value);
				
				$(resObject).change();
				
				return true;
			})
		
        _title(markerSizeInput, _gtxt("Размер точек"));
		
        var markerSizeTds = [_td(), _td([_t(_gtxt("Размер"))]), _td([markerSizeInput], [['attr','fade',true]])];
        _(markerSizeParent, markerSizeTds, [['attr','fade',true]]);
		
		
		// if (typeof elemCanvas.parentNode.gmxProperties != 'undefined' &&
			// elemCanvas.parentNode.gmxProperties.content.properties.description &&
			// String(elemCanvas.parentNode.gmxProperties.content.properties.description).toLowerCase().indexOf('карта ветра') == 0)
        if ( isWindLayer )
		{
			var markerColor = nsGmx.Controls.createColorPicker((templateStyle.marker && typeof templateStyle.marker.color != 'undefined') ? templateStyle.marker.color : 0xFF00FF,
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
					
					$(resObject).change();
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
				
				$(resObject).change();
			}
			
			_title(scale, _gtxt("Масштаб"))
			
			angle = _input(null, [['dir','className','inputStyle'],['attr','value', (templateStyle.marker && templateStyle.marker.angle) ? templateStyle.marker.angle : ''],['css','width','68px']]);
			
			angle.onkeyup = function()
			{
				if (this.value != '')
					templateStyle.marker.angle = this.value;
				else
					delete templateStyle.marker.angle;
				
				$(resObject).change();
			}
			
			_title(angle, _gtxt("Угол поворота"))
			
			iconTds.push(_td([_table([_tbody([_tr([_td([inputUrl.getControl()], [['attr','colSpan',3]])]),
												_tr([_td([markerColor], [['css','paddingLeft','1px']]), _td([angle]), _td([scale], [['css','paddingRight','3px']])])])])]));
		}
		else
			iconTds.push(_td([inputUrl.getControl()]));
	}
	else if (geometryType == "polygon" || geometryType == "linestring")
	{
	//	hide(iconParent);
	
		iconTds.push(_td([inputUrl.getControl()]));
		
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
        
    return resObject;
}

//params:
//  * addTitle {bool, default: true} 
mapHelper.prototype.createStylesEditorIcon = function(parentStyles, type, params)
{
    var _params = $.extend({addTitle: true}, params);
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
				icon = _img(null, [['dir','className','icon'],['attr','styleType','icon']]);
				
				var fixFunc = function()
					{
						var width = this.width,
							height = this.height,
							scaleX = 14.0 / width,
							scaleY = 14.0 / height,
							scale = Math.min(scaleX, scaleY);
						
						setTimeout(function()
						{
							icon.style.width = Math.round(width * scale) + 'px';
							icon.style.height = Math.round(height * scale) + 'px';
						}, 10);
					}
				
				icon.onload = fixFunc;
                icon.src = parentStyle.marker.image;
			}
			else
			{
				var dummyStyle = {};
				
				$.extend(dummyStyle, parentStyle);
				
				dummyStyle.outline = {color: parentStyle.marker.color, opacity: 100};
				dummyStyle.fill = {color: parentStyle.marker.color, opacity: 100};
				
				icon = nsGmx.Controls.createGeometryIcon(dummyStyle, type);
			
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
			icon = nsGmx.Controls.createGeometryIcon(parentStyle, type);
			
			if ($.browser.msie)
			{
				icon.style.width = '9px';
				icon.style.height = '13px';
				icon.style.margin = '0px 3px -3px 1px';
			}
		}
	}
	
    if (_params.addTitle)
        _title(icon, _gtxt("Редактировать стили"));
	
	icon.geometryType = type;
	
	return icon;
}

mapHelper.prototype.createLoadingLayerEditorProperties = function(div, parent, layerProperties, params)
{
	var elemProperties = div.gmxProperties.content.properties,
		loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]),
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
			_this.createLayerEditorProperties(div, div.gmxProperties.content.properties.type, parent, layerProperties, params);
			
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
					
					_this.createLayerEditorProperties(div, div.gmxProperties.content.properties.type, parent, response.Result, params)
				})
			}
		}
	}
}

mapHelper.prototype.createLayerEditorProperties = function(div, type, parent, properties, params)
{
    var _this = this;
    nsGmx.TagMetaInfo.loadFromServer(function(tagsInfo)
    {
        if (tagsInfo)
            _this._createLayerEditorPropertiesWithTags(div, type, parent, properties, tagsInfo, params);
    })
}

mapHelper.prototype._createLayerEditorPropertiesWithTags = function(div, type, parent, properties, tagsInfo, params)
{
    var _params = $.extend({addToMap: true, doneCallback: null}, params);
	var getFileExt = function(path)
	{
		return String(path).substr(String(path).lastIndexOf('.') + 1, path.length);
	}
	
	var _this = this;

	var title = _input(null,[['attr','fieldName','title'],['attr','value',div ? (div.gmxProperties.content.properties.title ? div.gmxProperties.content.properties.title : '') :  (typeof properties.Title != 'undefined' ? properties.Title : '')],['dir','className','inputStyle'],['css','width','220px']])
	title.onkeyup = function()
	{
		if (div)
		{
			var span = $(div).find(".layer")[0];
		
			removeChilds(span);
			
			_(span, [_t(title.value)]);

			div.gmxProperties.content.properties.title = title.value;
			
			_this.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
		}
		
		return true;
	}
	
	var copyright = _input(null,[['attr','fieldName','copyright'],['attr','value',div ? (div.gmxProperties.content.properties.Copyright ? div.gmxProperties.content.properties.Copyright : '') : (typeof properties.Copyright != 'undefined' ? properties.Copyright : '')],['dir','className','inputStyle'],['css','width','220px']])
	copyright.onkeyup = function()
	{
		if (div)
		{
			globalFlashMap.layers[div.gmxProperties.content.properties.name].setCopyright(copyright.value);
			
			div.gmxProperties.content.properties.Copyright = copyright.value;
			
			_this.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
		}
		
		return true;
	}
	
	var legend = _input(null,[['attr','fieldName','Legend'],['attr','value',div ? (div.gmxProperties.content.properties.Legend ? div.gmxProperties.content.properties.Legend : '') : (typeof properties.Legend != 'undefined' ? properties.Legend : '')],['dir','className','inputStyle'],['css','width','220px']])
	legend.onkeyup = function()
	{
		if (div)
		{
			div.gmxProperties.content.properties.Legend = legend.value;
			
			_this.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
		}
		
		return true;
	}
	
	var descr = _textarea(null,[['attr','fieldName','description'],['dir','className','inputStyle'],['css','width','220px'],['css','height','50px']]);
	descr.value = div ? (div.gmxProperties.content.properties.description ? div.gmxProperties.content.properties.description : '') : (properties.Description != null ? properties.Description : '');
	
	descr.onkeyup = function()
	{
		if (div)
		{
			var span = $(div).find(".layerDescription")[0];
		
			removeChilds(span);
			
			span.innerHTML = descr.value;

			div.gmxProperties.content.properties.description = descr.value;
			
			_this.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
		}
		
		return true;
	}
	
	var shownProperties = [];
		
	shownProperties.push({name: _gtxt("Имя"), field: 'Title', elem: title});
	shownProperties.push({name: _gtxt("Копирайт"), field: 'Copyright', elem: copyright});
	
	if (div)
		shownProperties.push({name: _gtxt("ID"), field: 'Name'});
							
	shownProperties.push({name: _gtxt("Описание"), field: 'Description', elem: descr});
	
	if (type != "Vector")
		shownProperties.push({name: _gtxt("Легенда"), field: 'Legend', elem: legend});
	
	var encodingParent = _div();
    var layerTagsParent = _div(null, [['dir', 'className', 'layertags-container']]);
	//var temporalLayerParent = _div(null, [['dir', 'className', 'TemporalLayer']]);
    
    var collapsableTagsParent = _div();
    new nsGmx.Controls.CollapsibleWidget(_gtxt('Метаданные'), $('<div/>').appendTo(collapsableTagsParent), layerTagsParent, type === "Vector");
    
    $(layerTagsParent).appendTo(collapsableTagsParent);
	
	//event: change
	var encodingWidget = new nsGmx.ShpEncodingWidget();
    
    var convertedTagValues = {};
    for (var mp in properties.MetaProperties)
    {
        var tagtype = properties.MetaProperties[mp].Type;
        convertedTagValues[mp] = {Type: tagtype, Value: nsGmx.Utils.convertFromServer(tagtype, properties.MetaProperties[mp].Value)};
    }
    
    var layerTags = new nsGmx.LayerTags(tagsInfo, convertedTagValues);
    var layerTagsControl = new nsGmx.LayerTagSearchControl(layerTags, layerTagsParent);
	
	if (type == "Vector")
	{
		var shapePath = _input(null,[['attr','fieldName','ShapePath.Path'],['attr','value',!properties.ShapePath ? properties.GeometryTable.TableName : properties.ShapePath.Path],['dir','className','inputStyle'],['css','width', '200px']]),
			shapeFileLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
			tableLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
			// trPath = _tr([_td([_t(_gtxt("Файл")), shapeFileLink, _br(), _t(_gtxt("Таблица")), tableLink],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
						  // _td([shapePath, columnsParent, encodingParent])]),
			tilePath = _div([_t(typeof properties.TilePath.Path != null ? properties.TilePath.Path : '')],[['css','marginLeft','3px'],['css','width','220px'],['css','whiteSpace','nowrap'],['css','overflowX','hidden']]),
			trTiles = _tr([_td([_t(_gtxt("Каталог с тайлами"))],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
						  _td([tilePath])]),
            tableColumnsParent = _div(),
            xlsColumnsParent = _div();
		
		shapePath.oldValue = shapePath.value;
        
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
				
				var index = String(path).lastIndexOf('.'),
					ext = String(path).substr(index + 1, path.length);
				
				if (title.value == '')
				{
					var indexSlash = String(path).lastIndexOf('\\'),
						fileName = String(path).substring(indexSlash + 1, index);
					
					title.value = fileName;
				}
				
				if (valueInArray(['xls', 'xlsx', 'xlsm'], ext))
					_this.selectColumns(xlsColumnsParent, {url: serverBase + "VectorLayer/GetExcelColumns.ashx?WrapStyle=func&ExcelFile=" + encodeURIComponent(path) })
				else
					removeChilds(xlsColumnsParent);
					
				$(encodingParent).empty();
				if (ext === 'shp')
				{
					encodingWidget.drawWidget(encodingParent);
				}
			})
		}
        
		tableLink.onclick = function()
		{
			_tableBrowser.createBrowser(function(name)
			{
				tablePath.value = name;
				
				if (title.value == '')
					title.value = name;
				
				_this.selectColumns(tableColumnsParent, {url: serverBase + "VectorLayer/GetTableCoordinateColumns.ashx?WrapStyle=func&TableName=" + encodeURIComponent(name)})
				
				sendCrossDomainJSONRequest(serverBase + "VectorLayer/GetTableColumns.ashx?ColumnTypes=date,datetime&SourceName=" + encodeURIComponent(name), function(response)
				{
					if (!parseResponse(response)) return;
					var columns = response.Result;
					
					temporalLayerViewTable.updateColumns(columns);
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
			this.selectColumns(properties.ShapePath ? xlsColumnsParent : tableColumnsParent, {
				fields: properties.GeometryTable.Columns,
				defaultX: properties.GeometryTable.XCol,
				defaultY: properties.GeometryTable.YCol
			});
		}
		
		//shownProperties.push({tr:trPath});
		
		if (div)
			shownProperties.push({tr:trTiles});
            		
		// shownProperties.push({tr:trTimeLayer});
		
		var boxSearch = _checkbox(div ? (div.gmxProperties.content.properties.AllowSearch ? div.gmxProperties.content.properties.AllowSearch : false) : (typeof properties.AllowSearch != 'undefined' ? properties.AllowSearch : false), 'checkbox');
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
				div.gmxProperties.content.properties.AllowSearch = this.checked;
				
				_this.findTreeElem(div).elem.content.properties = div.gmxProperties.content.properties;
			}
			
			return true;
		}
		
		if (div)
			shownProperties.push({name: _gtxt("Разрешить поиск"), elem: boxSearch});
        
		var addAttribute = makeLinkButton(_gtxt("Добавить атрибут"));
		addAttribute.onclick = function()
		{
			attrModel.addAttribute(attrModel.TYPES.STRING, "NewAttribute");
		}
		
		//events: newAttribute, delAttribute, updateAttribute, change
		var attrModel = (function()
		{
			var _attributes = [];
			return {
				addAttribute: function(type, name)
				{
					_attributes.push({type: type, name: name});
					$(this).triggerHandler('newAttribute');
					$(this).triggerHandler('change');
				},
				changeName: function(idx, newName)
				{
					_attributes[idx].name = newName;
					$(this).triggerHandler('updateAttribute');
					$(this).triggerHandler('change');
				},
				changeType: function(idx, newType)
				{
					_attributes[idx].type = newType;
					$(this).triggerHandler('updateAttribute');
					$(this).triggerHandler('change');
				},
				deleteAttribute: function(idx)
				{
					//delete _attributes[idx];
					_attributes.splice(idx, 1);
					$(this).triggerHandler('delAttribute');
					$(this).triggerHandler('change');
				},
				getAttribute: function(idx){ return _attributes[idx]; },
				getCount: function(){ return _attributes.length; }
			}
		})();
		attrModel.TYPES = {
            DOUBLE:   {user: 'Float',    server: 'float'    },
            INTEGER:  {user: 'Integer',  server: 'integer'  },
            STRING:   {user: 'String',   server: 'string'   },
            TIME:     {user: 'Time',     server: 'time'     },
            DATE:     {user: 'Date',     server: 'date'     },
            DATETIME: {user: 'DateTime', server: 'datetime' },
            INTEGER:  {user: 'Integer',  server: 'integer'  },
            BOOL:     {user: 'Boolean',  server: 'boolean'  }
        };
		
		var attrView = (function()
		{
			var _parent = null;
			var _model = null;
			var _trs = [];
			
			var createTypeSelector = function()
			{
				var s = nsGmx.Utils._select(null, [['css', 'width', '83px'], ['dir', 'className', 'selectStyle']]);
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
					
					var nameSelector = _input(null, [['attr', 'class', 'customAttrNameInput inputStyle'], ['css', 'width', '80px']]);
					
					$(nameSelector).attr({attrIdx: i}).val(attr.name);
					
					$(nameSelector).bind('keyup', function()
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
					
					var moveIcon = _img(null, [['attr', 'src', "img/moveIcon.gif"], ['dir', 'className', 'moveIcon'], ['css', 'cursor', 'move'], ['css', 'width', '13px']]);
					
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
		
        var selectedSource = 0;
        
        var geometryTypes = [
            { title: _gtxt('многоугольники'), type: 'POLYGON'    },
            { title: _gtxt('линии'),          type: 'LINESTRING' },
            { title: _gtxt('точки'),          type: 'POINT'      }
        ];
        
        var geometryTypeSelect = $('<select/>', {'class': 'selectStyle'}).css('width', '110px');
        for (var g = 0; g < geometryTypes.length; g++)
            $('<option/>').text(geometryTypes[g].title).val(geometryTypes[g].type).appendTo(geometryTypeSelect);
            
        var attrViewParent = _div();
        var attrContainer = _div([
            _div([
                _div([_span([_t('Геометрия: ')], [['css', 'height', '20px'], ['css', 'verticalAlign', 'middle']]), geometryTypeSelect[0]]),
                addAttribute
            ]),
            _div([attrViewParent], [['css', 'margin', '3px']])
        ], [['css', 'marginLeft', '3px']]);
        
        //var createLayerFields = _tr([_td([boxManualAttributes, _span([_t(_gtxt("Задать атрибуты вручную"))]), attrContainer], [['attr', 'colSpan', 2]])]);
        attrView.init(attrViewParent, attrModel);
    
        //shownProperties.push({tr: createLayerFields});
        
        var sourceCheckbox = $('<form/>')
            .append($('<input/>', {type: 'radio', name: 'sourceCheckbox', id: 'chxFileSource', checked: 'checked'}).data('containerIdx', 0))
            .append($('<label/>', {'for': 'chxFileSource'}).text(_gtxt('Файл'))).append('<br/>')
            .append($('<input/>', {type: 'radio', name: 'sourceCheckbox', id: 'chxTableSource'}).data('containerIdx', 1))
            .append($('<label/>', {'for': 'chxTableSource'}).text(_gtxt('Таблица'))).append('<br/>')
            .append($('<input/>', {type: 'radio', name: 'sourceCheckbox', id: 'chxManualSource'}).data('containerIdx', 2))
            .append($('<label/>', {'for': 'chxManualSource'}).text(_gtxt('Вручную')));
            
        $(sourceCheckbox).find('input, label').css({verticalAlign: 'middle'});
        $(sourceCheckbox).find('label').css({marginLeft: 2});
            
        var sourceTab2 = $('<div/>');
        var sourceTr2 = _tr([_td([sourceCheckbox[0]], [['css','padding','5px'], ['css', 'verticalAlign', 'top'], ['css', 'lineHeight', '18px']]), _td([sourceTab2[0]])]);
        
        if (!div)
            shownProperties.push({tr: sourceTr2});
        
        sourceCheckbox.find('input').click(function()
        {
            var activeIdx = $(this).data('containerIdx');
            $(sourceTab).tabs('select', activeIdx);
        });
        
        var sourceTab = _div([_ul([
            _li([_a([_t(_gtxt('Файл'))],   [['attr','href','#fileSource' + properties.name]])]),
            _li([_a([_t(_gtxt('Таблица'))],[['attr','href','#tableSource' + properties.name]])]),
            _li([_a([_t(_gtxt('Вручную'))],[['attr','href','#manualSource' + properties.name]])])
        ], [['css', 'display', 'none']])]);
        
        var sourceFile = _div(null, [['dir', 'id', 'fileSource' + properties.name]])
        _(sourceFile, [shapePath, shapeFileLink, encodingParent, xlsColumnsParent]);
        
        var tablePath = _input(null,[
            ['attr','fieldName','GeometryTable.TableName'],
            ['attr','value',properties.GeometryTable ? properties.GeometryTable.TableName : ''],
            ['dir','className','inputStyle'],
            ['css','width', '200px']
        ]);
        var temporalLayerParentTable = _div(null, [['dir', 'className', 'TemporalLayer']]);
        var temporalLayerParamsTable = new nsGmx.TemporalLayerParams();
        var temporalLayerViewTable = new nsGmx.TemporalLayerParamsControl(temporalLayerParentTable, temporalLayerParamsTable, []);
        
        var TableCSParent = _div();
        var TableCSSelect = $('<select/>', {'class': 'selectStyle'}).css('width', '165px')
            .append($('<option>').val('EPSG:4326').text(_gtxt('Широта/Долгота (EPSG:4326)')))
            .append($('<option>').val('EPSG:3395').text(_gtxt('Меркатор (EPSG:3395)')));
            
        if (properties.TableCS)
            TableCSSelect.find('[value="' + properties.TableCS +'"]').attr('selected', 'selected');
            
        $(TableCSParent).append($('<span/>').text(_gtxt('Проекция')).css('margin', '3px')).append(TableCSSelect);
        
        var sourceTable = _div([tablePath, tableLink, TableCSParent, temporalLayerParentTable, tableColumnsParent], [['dir', 'id', 'tableSource' + properties.name]])
        
        var temporalLayerParamsManual = new nsGmx.TemporalLayerParams();
        var temporalLayerParentManual = _div(null, [['dir', 'className', 'TemporalLayer']]);
        var temporalLayerViewManual = new nsGmx.TemporalLayerParamsControl(temporalLayerParentManual, temporalLayerParamsManual, []);
        var sourceManual = _div([attrContainer, temporalLayerParentManual], [['dir', 'id', 'manualSource' + properties.name]])
        $(attrModel).change(function()
        {
            var count = attrModel.getCount();
            var columns = [];
            for (var k = 0; k < count; k++){
                var attr = attrModel.getAttribute(k);
                if (attr.type.server == 'date' || attr.type.server == 'datetime')
                    columns.push({Name: attrModel.getAttribute(k).name});
            }
            temporalLayerViewManual.updateColumns(columns);
        });
        
        var sourceContainers = [sourceFile, sourceTable, sourceManual];
        
        var sourceTr;
        if (!div)
        {            
            // _(sourceTab2[0], sourceContainers);
            _(sourceTab, sourceContainers);
            selectedSource = 0;
            $(sourceTab).tabs({
                selected: selectedSource,
                select: function(event, ui)
                {
                    selectedSource = ui.index;
                }
            });
            _(sourceTab2[0], [sourceTab]);
            // sourceTr = _tr([_td([sourceTab], [['dir', 'id', 'layerSource'], ['dir', 'colSpan', 2]])]);
            // shownProperties.push({tr: sourceTr});
        }
        else
        {
            if (properties.ShapePath && properties.ShapePath.Path) //из файла
            {
                selectedSource = 0;
                //sourceTab = _div([, ]);
                shownProperties.push({name: _gtxt("Файл"), elem: sourceFile});
                // sourceTr = _tr([_td([_t('Источник данных (файл)')]), _td([sourceFile], [['dir', 'id', 'layerSource']])]);
            }
            else if (properties.GeometryTable && properties.GeometryTable.TableName)
            {
                selectedSource = 1;
                // sourceTr = _tr([_td([_t('Источник данных (таблица)')]), _td([sourceTable], [['dir', 'id', 'layerSource']])]);
                shownProperties.push({name: _gtxt("Таблица"), elem: sourceTable});
                //sourceTab = _div([_div([_t('Источник данных (таблица):')]), sourceTable]);
            }
            else
            {
                selectedSource = 2;
                // sourceTab = _div();
            }
        }
        
        
        // //Каталог растров
        // var updateRCControls = function()
        // {
            // $('#RDCollapsableHeader', parent).toggle(RCCheckbox[0].checked);
            // $('#RCMaskForRasterTitle, #RCMaskForRasterPath', parent).toggle(RCCheckbox[0].checked && !RDCollapsableWidget.isCollapsed());
        // }
        
        // var RCCheckbox = $('<input/>', {type: 'checkbox', id: 'RCCreate-checkbox'})
            // .css('margin-left', '3px')
            // .change(updateRCControls);
        var rasterCatalogDiv = $('<div/>');//.append(RCCheckbox);
        shownProperties.push({name: "Каталог растров", elem: rasterCatalogDiv[0], iddom: 'RCCreate-container'});
        
        // var RCPropertiesGroup = _div();
        // var RDCollapsableWidget = new nsGmx.Controls.CollapsibleWidget('Автоматическое создание слоёв', $('<div/>').appendTo(RCPropertiesGroup), [], true);
        // shownProperties.push({tr:_tr([_td([RCPropertiesGroup], [['attr', 'colSpan', 2], ['attr', 'id', 'RDCollapsableHeader']])])});
        
        // var RCMaskForRasterTitle = $('<input/>').addClass('inputStyle').css('width', '220px').val(properties.RCMaskForRasterTitle || '');
        // var RCMaskForRasterPath = $('<input/>').addClass('inputStyle').css('width', '220px').val(properties.RCMaskForRasterPath || '');
        
        // shownProperties.push({name: 'Шаблон имени', elem: RCMaskForRasterTitle[0], iddom: 'RCMaskForRasterTitle'});
        // shownProperties.push({name: 'Шаблон тайлов', elem: RCMaskForRasterPath[0], iddom: 'RCMaskForRasterPath'});
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
        
        var appendMetadata = function(data)
        {
            if (!data) return;
            
            var convertedTagValues = {};
            for (var mp in data)
            {
                var tagtype = data[mp].Type;
                layerTags.addNewTag(mp, nsGmx.Utils.convertFromServer(tagtype, data[mp].Value), tagtype);
            }
            
            if (title.value == '' )
            {
                var platform = layerTags.getTagByName('platform');
                var dateTag  = layerTags.getTagByName('acdate');
                var timeTag  = layerTags.getTagByName('actime');
                
                if (typeof platform !== 'undefined' && typeof dateTag !== 'undefined' && typeof timeTag !== 'undefined')
                {
                    var timeOffset = (new Date()).getTimezoneOffset()*60*1000;
                    
                    var dateInt = nsGmx.Utils.convertToServer('Date', dateTag.value);
                    var timeInt = nsGmx.Utils.convertToServer('Time', timeTag.value);
                    
                    var date = new Date( (dateInt+timeInt)*1000 + timeOffset );
                    
                    var dateString = $.datepicker.formatDate('yy.mm.dd', date);
                    var timeString = $.datepicker.formatTime('hh:mm', {hour: date.getHours(), minute: date.getMinutes()});
                    
                    title.value = platform.value + '_' + dateString + '_' + timeString + '_UTC';
                }
            }
        }
		
		tileFileLink.onclick = function()
		{
			_fileBrowser.createBrowser(_gtxt("Файл"), ['jpeg', 'jpg', 'tif', 'png', 'img', 'tiles', 'cpyr'], function(path)
			{
				tilePath.value = path;
                
                sendCrossDomainJSONRequest(serverBase + 'Layer/GetMetadata.ashx?basepath=' + encodeURIComponent(path), function(response)
                {
                    if (!parseResponse(response))
                        return;
                        
                    appendMetadata(response.Result.MetaProperties);
                    
                    if (title.value == '')
                    {
                        var indexExt = String(path).lastIndexOf('.');
                        var indexSlash = String(path).lastIndexOf('\\'),
                            fileName = String(path).substring(indexSlash + 1, indexExt);
                        
                        title.value = fileName;
                    }
                })
			})
		}
		
		shapeLink.onclick = function()
		{
			_fileBrowser.createBrowser(_gtxt("Граница"), ['mif','tab','shp'], function(path)
			{
				shapePath.value = path;
				
				shapeVisible(true);
                
                sendCrossDomainJSONRequest(serverBase + 'Layer/GetMetadata.ashx?geometryfile=' + encodeURIComponent(path), function(response)
                {
                    if (!parseResponse(response))
                        return;
                        
                    appendMetadata(response.Result.MetaProperties);
                })
			})
		}
		
		drawingBorderLink.onclick = function()
		{
            nsGmx.Controls.chooseDrawingBorderDialog( properties.Name, function(polygon)
			{
                _this.drawingBorders.set(properties.Name, polygon);
                _this.drawingBorders.updateBorder(properties.Name);
				shapeVisible(false);
                
			}, {geomType: 'POLYGON', errorMessage: _gtxt("$$phrase$$_17")} );
		}
		
		tileCatalogLink.style.marginLeft = '3px';
		tileFileLink.style.marginLeft = '3px';
		shapeLink.style.marginLeft = '3px';
		drawingBorderLink.style.marginLeft = '3px';

		shownProperties.push({tr:trPath});
		shownProperties.push({tr:trShape});
	}
    
    shownProperties.push({tr:_tr([_td([collapsableTagsParent], [['attr', 'colSpan', 2]])])});
		
	var trs = this.createPropertiesTable(shownProperties, properties, {leftWidth: 70});
	_(parent, [_div([_table([_tbody(trs)],[['dir','className','propertiesTable']])])]);
    
    // в IE инициализировать чекбоксы можно только после их добавления в DOM-дерево
    $('input#chxFileSource').attr('checked', 'checked');
    
    //Обновим отображение каталога растров после создания виджета
    if (type === "Vector")
    {
        var rcProperties;
        if (div && div.gmxProperties.content.properties.IsRasterCatalog)
        {
            rcProperties = {
                IsRasterCatalog: true,
                TiledQuicklookMaxZoom: div.gmxProperties.content.properties.TiledQuicklookMaxZoom,
                TiledQuicklookMinZoom: div.gmxProperties.content.properties.TiledQuicklookMinZoom,
                RCMaskForRasterPath:  properties.RCMaskForRasterPath,
                RCMaskForRasterTitle: properties.RCMaskForRasterTitle,
                ColumnTagLinks: properties.ColumnTagLinks
            }
            // RCCheckbox.attr('checked', 'checked');
            // updateRCControls();
        }
        var rasterCatalogControl = new nsGmx.LayerRasterCatalogControl(rasterCatalogDiv, rcProperties);
        // RDCollapsableWidget.addManagedElements([$('#RCMaskForRasterTitle', parent), $('#RCMaskForRasterPath', parent)]);
        // updateRCControls();
    }
	
	// смотрим, а не выполняются ли для этого слоя задачи
	var haveTask = false;
	if (div)
	{
		for (var id in this.asyncTasks)
			if (this.asyncTasks[id] == div.gmxProperties.content.properties.name)
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
            var mapProperties = _layersTree.treeModel.getMapProperties();
			var isCustomAttributes = type === "Vector" && selectedSource === 2;
			var errorFlag = false,
				checkFields = (type == "Vector" ? ['title', 'date'] : ['title', 'date']);
				
			if (!isCustomAttributes)
			if (type !== "Vector")
				checkFields.push('TilePath.Path');
			else if (selectedSource == 0)
				checkFields.push('ShapePath.Path');
			else if (selectedSource == 1)
				checkFields.push('GeometryTable.TableName');
				
			for (var i = 0; i < checkFields.length; i++)
			{
				var inputField = $(parent).find("[fieldName='" + checkFields[i] + "']");
				
				if (inputField.length && inputField[0].value == '')
				{
					errorFlag = true;
					inputError(inputField[0], 2000);
				}
			}
			
			if (errorFlag)
				return;
                
            var metaProperties = {};
            layerTags.eachValid(function(id, tag, value)
            {
                var type = layerTags.getTagMetaInfo().getTagType(tag);
                var value = nsGmx.Utils.convertToServer(type, value);
                if (value !== null)
                    metaProperties[tag] = {Value: value, Type: type};
            })
            
            var metadataString = '&MetaProperties=' + encodeURIComponent(JSON.stringify(metaProperties));
			
			if (type == "Vector")
			{
				var cols = '',
					updateParams = '',
					encoding = '&EncodeSource=' + encodeURIComponent(encodingWidget.getServerEncoding()),
					columnsParent = selectedSource == 0 ? xlsColumnsParent : tableColumnsParent,
					colXElem = $(columnsParent).find("[selectLon]"),
					colYElem = $(columnsParent).find("[selectLat]"),
					layerTitle = title.value,
					temporalParams = '',
                    tableCSParam = selectedSource == 1 ? '&TableCS=' + encodeURIComponent(TableCSSelect.find(':selected').val()) : '',
                    RCParams = '';
                    
                var rcProps = rasterCatalogControl.getRCProperties();
                if (rcProps.IsRasterCatalog)
                {
                    RCParams = '&IsRasterCatalog=true';
                    if ( rcProps.RCMaskForRasterPath ) RCParams += '&RCMaskForRasterPath=' + encodeURIComponent(rcProps.RCMaskForRasterPath);
                    if ( rcProps.RCMaskForRasterTitle ) RCParams += '&RCMaskForRasterTitle=' + encodeURIComponent(rcProps.RCMaskForRasterTitle);
                    if ( rcProps.ColumnTagLinks ) RCParams += '&ColumnTagLinks=' + encodeURIComponent(JSON.stringify(rcProps.ColumnTagLinks));
                }
                else
                {
                    RCParams = '&IsRasterCatalog=false';
                }
				
				var temporalLayerParams = selectedSource == 1 ? temporalLayerParamsTable : temporalLayerParamsManual;
				if ( temporalLayerParams.getTemporal() )
					temporalParams = '&TemporalLayer=true&TemporalColumnName=' + encodeURIComponent(temporalLayerParams.getColumnName()) + '&TemporalPeriods=' + encodeURIComponent(temporalLayerParams.getPeriodString());
				
				if (colXElem.length && colYElem.length)
					cols = '&ColY=' + encodeURIComponent(colYElem[0].value) + '&ColX=' + encodeURIComponent(colXElem[0].value);
				
				if (div)
				{
					updateParams = '&VectorLayerID=' + div.gmxProperties.content.properties.LayerID;
				}
				
				if (isCustomAttributes)
				{
					var count = attrModel.getCount();
					var columnsString = "&FieldsCount=" + count;
					for (var k = 0; k < count; k++){
						columnsString += "&fieldName" + k + "=" + encodeURIComponent(attrModel.getAttribute(k).name) + "&fieldType" + k + "=" + attrModel.getAttribute(k).type.server;
					}
                    
                    var geomType = $(':selected', geometryTypeSelect).val();
					
					sendCrossDomainJSONRequest(serverBase + "VectorLayer/CreateVectorLayer.ashx?WrapStyle=func" + 
                        "&Title=" + encodeURIComponent(title.value) + 
                        "&Copyright=" + encodeURIComponent(copyright.value) + 
                        "&Description=" + encodeURIComponent(descr.value) + 
                        "&MapName=" + encodeURIComponent(mapProperties.name) + 
                        cols + columnsString + temporalParams +
                        "&geometrytype=" + geomType +
                        metadataString +
                        RCParams, 
						function(response)
						{
							if (!parseResponse(response))
									return;
							
							var targetDiv = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];
							var gmxProperties = {type: 'layer', content: response.Result};
							gmxProperties.content.properties.mapName = mapProperties.name;
							gmxProperties.content.properties.hostName = mapProperties.hostName;
							gmxProperties.content.properties.visible = true;
							
							gmxProperties.content.properties.styles = [{
                                MinZoom: gmxProperties.content.properties.MinZoom, 
                                MaxZoom:21, 
                                RenderStyle:_mapHelper.defaultStyles[gmxProperties.content.properties.GeometryType]
                            }];
							
							_layersTree.copyHandler(gmxProperties, targetDiv, false, true);
						}
					);
				}
				else
				{
					var geometryDataSource = selectedSource == 0 ? shapePath.value : tablePath.value;
					sendCrossDomainJSONRequest(serverBase + "VectorLayer/" + (div ? "Update.ashx" : "Insert.ashx") + "?WrapStyle=func" + 
                        "&Title=" + encodeURIComponent(title.value) + 
                        "&Copyright=" + encodeURIComponent(copyright.value) + 
                        "&Description=" + encodeURIComponent(descr.value) + 
                        "&GeometryDataSource=" + encodeURIComponent(geometryDataSource) + 
                        "&MapName=" + encodeURIComponent(mapProperties.name) + 
                        cols + updateParams + encoding + temporalParams + metadataString + tableCSParam + RCParams, 
                        function(response)
						{
							if (!parseResponse(response))
								return;
						
							
							var task = nsGmx.asyncTaskManager.addTask(response.Result, div ? div.gmxProperties.content.properties.name : null);
                            
                            
                            if (div)
                            {
                                _queryMapLayers.asyncUpdateLayer(task, properties, true);
                            }
                            else 
                            {
                                if (_params.addToMap)
                                    _queryMapLayers.asyncCreateLayer(task, layerTitle);
                            }
                            
                            _params.doneCallback && _params.doneCallback(task, layerTitle);
						}
                    )
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
						TilePath: $(parent).find("[fieldName='TilePath.Path']")[0].value,
						BorderFile: typeof _this.drawingBorders.get(properties.Name) == 'undefined' ? $(parent).find("[fieldName='ShapePath.Path']")[0].value : '',
						BorderGeometry: typeof _this.drawingBorders.get(properties.Name) == 'undefined' ? '' : JSON.stringify(merc_geometry(_this.drawingBorders.get(properties.Name).geometry)),
						MapName: mapProperties.name,
                        MetaProperties: JSON.stringify(metaProperties)
					},
					needRetiling = false,
					layerTitle = title.value;
				
				if (div)
				{
					params["RasterLayerID"] = div.gmxProperties.content.properties.LayerID;
					
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
					
						//_this.asyncTasks[response.Result.TaskID] = div ? div.gmxProperties.content.properties.name : true;
                        var task = nsGmx.asyncTaskManager.addTask(response.Result, div ? div.gmxProperties.content.properties.name : null);
						
						if (div)
                        {
							_queryMapLayers.asyncUpdateLayer(task, properties, needRetiling);
                        }
						else
                        {
                            if (_params.addToMap)
                                _queryMapLayers.asyncCreateLayer(task, layerTitle);
                        }
                        
                        _params.doneCallback && _params.doneCallback(task, layerTitle);
					})
			}

			if (div)
				delete _this.layerEditorsHash[div.gmxProperties.content.properties.name];
		}
		
		_(parent, [_div([saveButton], [['css','paddingTop','10px']])])
	}
	
	if (!div)
		title.focus();
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
			var selectLat = nsGmx.Utils._select(null, [['attr','selectLat',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]),
				selectLon = nsGmx.Utils._select(null, [['attr','selectLon',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]);

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
	var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]);
	
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
}

mapHelper.prototype.createNewLayer = function(type)
{
	if ($$('new' + type + 'Layer'))
		return;

	var parent = _div(null, [['attr','id','new' + type + 'Layer']]),
		height = (type == 'Vector') ? 340 : 360;

    if (type !== 'Multi')
    {
		var properties = {Title:'', Description: '', Date: '', TilePath: {Path:''}, ShapePath: {Path:''}};
        var dialogDiv = showDialog(type != 'Vector' ? _gtxt('Создать растровый слой') : _gtxt('Создать векторный слой'), parent, 325, height, false, false);
        this.createLayerEditorProperties(false, type, parent, properties, 
            {
                doneCallback: function() 
                {
                    removeDialog(dialogDiv); 
                }
            }
        );
    }
    else
    { //мультислой
        var _this = this;
        nsGmx.createMultiLayerEditorNew( this._treeView );
    }
}

// Формирует набор элементов tr используя контролы из shownProperties.
// Параметры:
// - shownProperties: массив со следующими свойствами:
//   * tr - если есть это свойство, то оно помещается в tr, все остальные игнорируются
//   * name - названия свойства, которое будет писаться в левой колонке
//   * elem - если есть, то в правую колонку помещается этот элемент
//   * field - если нет "elem", в правый столбец подставляется layerProperties[field]
//   * iddom - id для DOM элемента. Не применяется, если прямо указано tr
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
		
        if (shownProperties[i].iddom)
            _(tr, [], [['attr', 'id', shownProperties[i].iddom]]);
        
		trs.push(tr);
	}
	
	return trs;
}

mapHelper.prototype.createLayerEditor = function(div, selected, openedStyleIndex)
{
	var elemProperties = div.gmxProperties.content.properties,
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
		
		var mapName = elemProperties.mapName,
			layerName = elemProperties.name,
			createTabs = function(layerProperties)
			{
				var id = 'layertabs' + elemProperties.name,
					divProperties = _div(null,[['attr','id','properties' + id]]),
					divStyles = _div(null,[['attr','id','styles' + id]]),
					divQuicklook,
					tabMenu;
				
				if (elemProperties.GeometryType == 'polygon' &&
					elemProperties.description &&
					String(elemProperties.description).toLowerCase().indexOf('спутниковое покрытие') == 0)
				{
					divQuicklook = _div(null,[['attr','id','quicklook' + id]]);
					
					tabMenu = _div([_ul([_li([_a([_t(_gtxt("Общие"))],[['attr','href','#properties' + id]])]),
										 _li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + id]])]),
										 _li([_a([_t(_gtxt("Накладываемое изображение"))],[['attr','href','#quicklook' + id]])])])]);
					
					_(tabMenu, [divProperties, divStyles, divQuicklook]);
					
					_(divQuicklook, [_this.createQuicklookCanvas(elemProperties, elemProperties.attributes)]);
					_(divQuicklook, [_this.createTiledQuicklookCanvas(elemProperties, elemProperties.attributes)]);
				}
				else
				{
					tabMenu = _div([_ul([_li([_a([_t(_gtxt("Общие"))],[['attr','href','#properties' + id]])]),
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
				
				var pos = nsGmx.Utils.getDialogPos(div, true, 390),
                    updateFunc = function()
                    {
                        var newStyles = _this.updateStyles(filtersCanvas);
                        elemProperties.styles = newStyles;
                        
                        _this.findTreeElem(div).elem.content.properties = elemProperties;
                        
                        if (elemProperties.GeometryType == 'polygon' &&
							elemProperties.description &&
							String(elemProperties.description).toLowerCase().indexOf('спутниковое покрытие') == 0 &&
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
                    },
					closeFunc = function()
					{
                        updateFunc();
                        
						var newStyles = _this.updateStyles(filtersCanvas),
							multiStyleParent = $(div).children('[multiStyle]')[0];
						
						for (var i = 0; i < filtersCanvas.childNodes.length; i++)
							filtersCanvas.childNodes[i].removeColorPickers();
												
						var multiFiltersFlag = (parentIcon.getAttribute('styleType') == 'multi' && filtersCanvas.childNodes.length > 1), // было много стилей и осталось
							colorIconFlag = (parentIcon.getAttribute('styleType') == 'color' && filtersCanvas.childNodes.length == 1 && (typeof newStyles[0].RenderStyle.marker != 'undefined') && (typeof newStyles[0].RenderStyle.marker.image == 'undefined')); // была не иконка и осталась
						
						if (multiFiltersFlag) {}
						else if (colorIconFlag) {}
						else
						{
							var newIcon = _this.createStylesEditorIcon(newStyles, elemProperties.GeometryType.toLowerCase());
							
							$(parentIcon).empty().append(newIcon).attr('styleType', $(newIcon).attr('styleType'));
						}
						
						removeChilds(multiStyleParent);
						
						_this.createMultiStyle(elemProperties, multiStyleParent)
						
						return false;
					};
				
				_this.createLoadingLayerEditorProperties(div, divProperties, layerProperties, {doneCallback: function()
                {
                    removeDialog(divDialog);
                }});
				
				var divDialog = showDialog(_gtxt('Слой [value0]', elemProperties.title), tabMenu, 350, 470, pos.left, pos.top, null, function()
                {
                    closeFunc();
                    delete _this.layerEditorsHash[elemProperties.name];
                });
                
				_this.layerEditorsHash[elemProperties.name] = tabMenu;
				
				// при сохранении карты сбросим все временные стили в json карты
				tabMenu.closeFunc = closeFunc;
				tabMenu.updateFunc = updateFunc;
				
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

		sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerInfo.ashx?WrapStyle=func&&NeedAttrValues=false&LayerID=" + elemProperties.LayerID, function(response)
		{
			if (!parseResponse(response))
				return;
			
			_this.attrValues[mapName][layerName] = new nsGmx.LazyAttributeValuesProviderFromServer(response.Result.Attributes, elemProperties.LayerID);
			
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
				tabMenu = _div([_ul([_li([_a([_t(_gtxt("Общие"))],[['attr','href','#properties' + id]])]),
									 _li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + id]])])])]),
				divProperties = _div(null,[['attr','id','properties' + id]]),
				divStyles = _div(null,[['attr','id','styles' + id]]);
			
			_(tabMenu, [divProperties, divStyles]);
			
            
			var parentObject = globalFlashMap.layers[elemProperties.name],
				parentStyle = elemProperties.styles[0];
                
            var zoomPropertiesControl = new nsGmx.ZoomPropertiesControl(parentStyle.MinZoom, parentStyle.MaxZoom),
                liMinZoom = zoomPropertiesControl.getMinLi(),
                liMaxZoom = zoomPropertiesControl.getMaxLi();
			
            $(zoomPropertiesControl).change(function()
            {
                parentObject.setZoomBounds(this.getMinZoom(), this.getMaxZoom());
            });

			_(divStyles, [_ul([liMinZoom, liMaxZoom])]);

			this.createLoadingLayerEditorProperties(div, divProperties, null, {doneCallback: function()
                {
                    removeDialog(divDialog);
                }}
            );
			
			var pos = nsGmx.Utils.getDialogPos(div, true, 330),
				closeFunc = function()
				{
					elemProperties.styles[0].MinZoom = zoomPropertiesControl.getMinZoom();
					elemProperties.styles[0].MaxZoom = zoomPropertiesControl.getMaxZoom();
					
					delete _this.layerEditorsHash[elemProperties.name];
					
					_this.findTreeElem(div).elem.content.properties = elemProperties;
					
					_this.drawingBorders.removeRoute(elemProperties.name, true);
					
					if ($$('drawingBorderDialog' + elemProperties.name))
						removeDialog($$('drawingBorderDialog' + elemProperties.name).parentNode);
					
					return false;
				};
			
			var divDialog = showDialog(_gtxt('Слой [value0]', elemProperties.title), tabMenu, 330, 410, pos.left, pos.top, null, closeFunc);
			
			$(tabMenu).tabs({selected: 0});
		}
		else
		{
            nsGmx.createMultiLayerEditorServer(elemProperties, div, this._treeView);
        }
	}
}

mapHelper.prototype.createWFSStylesEditor = function(parentObject, style, geometryType, divCanvas)
{
	var _this = this,
		templateStyle = {};
	
	$.extend(true, templateStyle, style);
    
    var elemCanvas = _mapHelper.createStylesEditorIcon([{MinZoom:1, MaxZoom: 21, RenderStyle: style.regularStyle}], geometryType);
    var spanIcon = _span([elemCanvas]);
    
	spanIcon.onclick = function()
	{
        var listenerId = parentObject.addListener('onSetStyle', function(style)
            {
                var newIcon = _this.createStylesEditorIcon([{MinZoom:1,MaxZoom:21,RenderStyle:style.regularStyle}], geometryType);
                $(spanIcon).empty().append(newIcon).attr('styleType', $(newIcon).attr('styleType'));
            });
            
		var canvasStyles = _div(null,[['css','marginTop','10px']]),
			canvasCharts = _div(null,[['css','marginTop','10px']]),
			closeFunc = function()
			{
				$(canvasStyles).find(".colorSelector").each(function()
				{
					var colorPicker = $$($(this).data("colorpickerId"));
                    if (colorPicker)
                         colorPicker.removeNode(true);
				});
				
				var layerElemCanvas = $(divCanvas).find("[geometryType='" + geometryType.toUpperCase() + "']")[0];
				layerElemCanvas.graphDataType = $(canvasCharts).find("select")[0].value;
				layerElemCanvas.graphDataProperties = $(canvasCharts).find("input")[0].value;
                
                parentObject.removeMapStateListener('onSetStyle', listenerId);
			};
		
		var id = 'wfstabs' + String(Math.random()).substring(2, 9),
			tabMenu = _div([_ul([_li([_a([_t(_gtxt("Стили"))],[['attr','href','#styles' + id]])]),
								 _li([_a([_t(_gtxt("Диаграммы"))],[['attr','href','#graph' + id]])])])]),
			divStyles = _div(null,[['attr','id','styles' + id]]),
			divGraph = _div(null,[['attr','id','graph' + id]]);
		
		_(tabMenu, [divStyles, divGraph]);
		
		var resObject = _mapHelper.createStyleEditor(canvasStyles, templateStyle, geometryType, false);
        
        $(resObject).change(function()
        {
            nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
        })
        
		canvasStyles.firstChild.style.marginLeft = '0px';
		_(divStyles, [canvasStyles]);
		
		_mapHelper.createChartsEditor(canvasCharts, $(divCanvas).find("[geometryType='" + geometryType.toUpperCase() + "']")[0]);
		canvasCharts.firstChild.style.marginLeft = '0px';
		_(divGraph, [canvasCharts]);
		
		var pos = nsGmx.Utils.getDialogPos(spanIcon, false, 160);
		showDialog(_gtxt('Редактирование стилей объекта'), tabMenu, 330, 180, pos.left, pos.top, false, closeFunc);
		
		$(tabMenu).tabs({selected: 0});
	}
	
	spanIcon.getStyle = function()
	{
		return templateStyle;
	}
    
    return spanIcon;
}

mapHelper.prototype.createChartsEditor = function(parent, elemCanvas)
{
	var graphTypeSel = nsGmx.Utils._select([_option([_t(_gtxt("График по времени"))], [['attr','value','func']]),
								_option([_t(_gtxt("Круговая"))], [['attr','value','pie']])], [['dir','className','selectStyle'],['css','width','180px']]),
		propertiesMask = _input(null, [['dir','className','inputStyle'],['css','width','180px']]);
	
	switchSelect(graphTypeSel, elemCanvas.graphDataType);
	propertiesMask.value = elemCanvas.graphDataProperties;
	
	_(parent, [_table([_tbody([_tr([_td([_t(_gtxt("Тип"))], [['css','width','100px']]), _td([graphTypeSel])]),
								_tr([_td([_t(_gtxt("Маска атрибутов"))]), _td([propertiesMask])])])])]);
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
		var icon = this.createStylesEditorIcon([elem.styles[i]], elem.GeometryType.toLowerCase(), {addTitle: !layerManagerFlag}),
			name = elem.styles[i].Name || elem.styles[i].Filter || 'Без имени ' + (i + 1),
            iconSpan = _span([icon]),
			li = _li([_div([iconSpan, _span([_t(name)],[['css','marginLeft','3px']])])]);
            
        $(iconSpan).attr('styleType', $(icon).attr('styleType'));
		
		if (!layerManagerFlag)
		{ 
			(function(i)
			{
				iconSpan.onclick = function()
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
        
        var clusterStyle = filter.getClusterStyle();
        if (clusterStyle)
            newFilterStyle.clusters = clusterStyle;
		
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

mapHelper.prototype.createAPIMapDialog = function()
{
    var mapProperties = _layersTree.treeModel.getMapProperties();
	var options = {
			requestAPIKey: (mapProperties.UseKosmosnimkiAPI || mapProperties.hostName == "maps.kosmosnimki.ru") && window.apiKey !== false,
			saveBaseLayers: false
		};
		
	if (window.defaultLayersVisibility) options.defaultLayersVisibility = window.defaultLayersVisibility;
	
	nsMapCommon.createAPIMapDialog(
		mapProperties.name, 
		mapProperties.hostName, 
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
					host: _layersTree.treeModel.getMapProperties().hostName,
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

//TODO: depricated, remove
mapHelper.prototype.removeTreeElem = function(div)
{
    return this._treeView.removeTreeElem(div);
}

//TODO: depricated, remove
mapHelper.prototype.addTreeElem = function(div, index, elemProperties)
{
    return this._treeView.addTreeElem(div);
}

//TODO: depricated, remove
mapHelper.prototype.findTreeElem = function(div)
{
    return this._treeView.findTreeElem(div);
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

mapHelp.tabs.load = function()
{
	var alreadyLoaded = _queryTabs.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_queryTabs.load()
}
mapHelp.tabs.unload = function()
{
}

mapHelp.externalMaps.load = function()
{
	var alreadyLoaded = _queryExternalMaps.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_queryExternalMaps.load()
}
mapHelp.externalMaps.unload = function()
{
}

//Динамически подгружаемые части вьюера

//Редактирование мультислоя
nsGmx.createMultiLayerEditorServer = gmxCore.createDeferredFunction('MultiLayerEditor', 'createMultiLayerEditorServer');
nsGmx.createMultiLayerEditorNew = gmxCore.createDeferredFunction('MultiLayerEditor', 'createMultiLayerEditorNew');

//Редактирование карты и группы
nsGmx.addSubGroup = gmxCore.createDeferredFunction('GroupEditor', 'addSubGroup');
nsGmx.createGroupEditor = gmxCore.createDeferredFunction('GroupEditor', 'createGroupEditor');
nsGmx.createMapEditor = gmxCore.createDeferredFunction('GroupEditor', 'createMapEditor');
