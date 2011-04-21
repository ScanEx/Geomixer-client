function externalMapHelper()
{
	this.mapTree = null;
}

externalMapHelper.prototype.forEachMyLayer = function(callback)
{
	if (!getLayers)
		return;
	
	forEachLayer(getLayers(), function(layer)
	{
		callback(globalFlashMap.layers[layer.properties.name]);
	});
}

externalMapHelper.prototype.getMapBounds = function()
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

externalMapHelper.prototype.convertColor = function(intColor)
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

externalMapHelper.prototype.setMapStyle = function(parentObject, templateStyle)
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

externalMapHelper.prototype.setBalloon = function(filter, template)
{
	filter.enableHoverBalloon(function(o)
	{
		return template.replace(/\[([a-zA-Z0-9_а-яА-Я]+)\]/g, function()
		{
			var key = arguments[1];
			if (key == "SUMMARY")
				return o.getGeometrySummary();
			else
				return o.properties[key];
		});
	});
}

externalMapHelper.prototype.makeStyle = function(style)
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

externalMapHelper.prototype.updateMapStyles = function(newStyles, name, newProperties)
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
		
		if (newStyles[i].Balloon)
			this.setBalloon(newFilter, newStyles[i].Balloon);
		else
			newFilter.enableHoverBalloon();
		
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
				return properties.TiledQuicklook.replace(/\[([a-zA-Z0-9_а-яА-Я]+)\]/g, function()
				{
					return o.properties[arguments[1]];
				});
			}, Number(properties.TiledQuicklookMinZoom), Number(properties.TiledQuicklookMaxZoom));
		}
		else
		{
			globalFlashMap.layers[name].enableTiledQuicklooks(function(o)
			{
				return properties.TiledQuicklook.replace(/\[([a-zA-Z0-9_а-яА-Я]+)\]/g, function()
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
			return properties.Quicklook.replace(/\[([a-zA-Z0-9_а-яА-Я]+)\]/g, function()
			{
				return o.properties[arguments[1]];
			});
		});
	}
}

externalMapHelper.prototype.updateTreeStyles = function(newStyles, div)
{
	div.properties.content.properties.styles = newStyles;
	
	var multiStyleParent = $(div).children('[multiStyle]')[0],
		_this = this;
	
	var parentIcon = $(div).children("[styleType]")[0],
		newIcon = this.createStylesEditorIcon(newStyles, div.properties.content.properties.GeometryType.toLowerCase());
		newIcon.onclick = function()
		{
			_this.createLayerEditor(div, 1, div.properties.content.properties.styles.length > 1 ? -1 : 0);
		}
		
	$(parentIcon).replaceWith(newIcon);
	
	removeChilds(multiStyleParent);
	
	this.createMultiStyle(div.properties.content.properties, multiStyleParent)
}

externalMapHelper.prototype.createStylesEditorIcon = function(parentStyles, type)
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

externalMapHelper.prototype.createGeometryIcon = function(parentStyle, type)
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

externalMapHelper.prototype.createMultiStyle = function(elem, multiStyleParent, treeviewFlag, layerManagerFlag)
{
	var filters = elem.styles,
		_this = this;
	
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
					_this.createLayerEditor(multiStyleParent.parentNode, 1, i);
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

externalMapHelper.prototype.findElem = function(elem, attrName, name, parents)
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

externalMapHelper.prototype.removeTreeElem = function(div)
{
	var elem = this.findTreeElem(div);
	
	if (typeof elem.parents[0].children != 'undefined')
		elem.parents[0].children.splice(elem.index, 1);
	else
		elem.parents[0].content.children.splice(elem.index, 1);
}

externalMapHelper.prototype.addTreeElem = function(div, index, elemProperties)
{
	var elem = this.findTreeElem(div);
	
	if (typeof elem.elem.children != 'undefined')
		elem.elem.children.splice(index, 0, elemProperties);
	else
		elem.elem.content.children.splice(index, 0, elemProperties);
}

externalMapHelper.prototype.findTreeElem = function(div)
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

externalMapHelper.prototype.findChilds = function(treeElem, callback, flag)
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

externalMapHelper.prototype.findTreeElems = function(treeElem, callback, flag, list)
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

var _externalMapHelper = new externalMapHelper();

