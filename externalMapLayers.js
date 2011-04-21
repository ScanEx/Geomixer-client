if (typeof _abstractTree == 'undefined')
{
	function AbstractTree()
	{
	}

	AbstractTree.prototype.makeSwapChild = function()
	{
		var div = _div(null, [['attr','swap',true],['dir','className','swap'],['css','fontSize','0px']]);
		
		return div;
	}

	AbstractTree.prototype.getChildsUl = function(node)
	{
		var ul = $(node).children("ul");
		
		if (ul.length > 0)
			return ul[0];
		else
			return false;
	}

	var _abstractTree = new AbstractTree();
}

function externalLayersTree()
{
	this.groupLoadingFuncs = [];
	
	this.mapHelper = null;
}

externalLayersTree.prototype.drawTree = function(tree)
{
	var canvas = _ul([this.getChildsList(tree, false, true)], [['dir','className','filetree']]);

	return canvas;
}

externalLayersTree.prototype.getChildsList = function(elem, parentParams, parentVisibility)
{
	// добавляем новый узел
	var li = _li(),
		_this = this;
	
	_(li, [this.drawNode(elem, parentParams,  parentVisibility)]);
	
	if (elem.content && elem.content.children && elem.content.children.length > 0)
	{
		var	childsUl = _ul();
		
		if (!elem.content.properties.expanded)
		{
			childsUl.style.display = 'none';
			childsUl.className = 'hiddenTree';
			
			childsUl.loaded = false;
			
			this.addLoadingFunc(childsUl, elem, parentParams);
		}
		else
		{
			childsUl.loaded = true;
			
			var childs = [];
				
			for (var i = 0; i < elem.content.children.length; i++)
				childs.push(this.getChildsList(elem.content.children[i], elem.content.properties, parentVisibility && elem.content.properties.visible));
		
			_(childsUl, childs)
		}
		
		_(li, [childsUl, _abstractTree.makeSwapChild()])
	}
	else if (elem.children)
	{
		if (elem.children.length > 0)
		{
			var childs = [];
			
			for (var i = 0; i < elem.children.length; i++)
				childs.push(this.getChildsList(elem.children[i], elem.properties, true));	
				
			var	childsUl = _ul(childs);
			
			childsUl.loaded = true;
			
			_(li, [childsUl])
		}
		
		_(li, [_div()])
		
		li.root = true;
	}
	else
		_(li, [_abstractTree.makeSwapChild()])
	
	return li;
}

externalLayersTree.prototype.addLoadingFunc = function(parentCanvas, elem, parentParams)
{
	var func = function()
	{
		$(parentCanvas.parentNode.firstChild).bind('click', function()
		{
			if (!parentCanvas.loaded)
			{
				parentCanvas.loaded = true;
				
				var childs = [];
					
				for (var i = 0; i < elem.content.children.length; i++)
					childs.push(_this.getChildsList(elem.content.children[i], elem.content.properties, _this.getLayerVisibility($(parentCanvas.parentNode).children("div[GroupID]")[0].firstChild)));
				
				_(parentCanvas, childs);
				
				$(parentCanvas).treeview();
				
				_this.addExpandedEvents(parentCanvas);
				
				_this.runLoadingFuncs();
			}
		})
	},
	_this = this;
	
	this.groupLoadingFuncs.push(func);
}

externalLayersTree.prototype.runLoadingFuncs = function()
{
	for (var i = 0; i < this.groupLoadingFuncs.length; i++)
		this.groupLoadingFuncs[i]();
	
	this.groupLoadingFuncs = [];
}

externalLayersTree.prototype.addExpandedEvents = function(parent)
{
	var _this = this;
	
	$(parent).find("div.hitarea").each(function()
	{
		if (!this.clickFunc)
		{
			this.clickFunc = true;
			
			var divClick = this;
			
			if (divClick.parentNode.parentNode.parentNode.getAttribute("multiStyle"))
				return;
			
			$(divClick).bind('click', function()
			{
				var div = $(divClick.parentNode).children("div[MapID],div[GroupID],div[LayerID],div[MultiLayerID]")[0],
					treeElem = _this.mapHelper.findTreeElem(div);
				
				if (!treeElem.parents.length)
					return;
				
				var flag = $(divClick).hasClass("expandable-hitarea");
				treeElem.elem.content.properties.expanded = !flag;
			})
		}
	})
}

externalLayersTree.prototype.drawNode = function(elem, parentParams, parentVisibility)
{
	var div;

	if (elem.type == "layer")
	{
		var childs = this.drawLayer(globalFlashMap.layers[elem.content.properties.name].properties, parentParams, parentVisibility);
		
		if (typeof elem.content.properties.LayerID != 'undefined')
			div = _div(childs, [['attr','LayerID',elem.content.properties.LayerID]]);
		else
			div = _div(childs, [['attr','MultiLayerID',elem.content.properties.MultiLayerID]]);
		
		var multiStyleParent = $(childs).children('[multiStyle]');
		
		if (multiStyleParent.length)
			$(multiStyleParent[0]).treeview();	
		
		div.properties = elem;
		div.properties.content.properties = globalFlashMap.layers[elem.content.properties.name].properties;
	}
	else
	{
		if (elem.properties && elem.properties.MapID)
			div = _div(this.drawHeaderGroupLayer(elem.properties, parentParams), [['attr','MapID',elem.properties.MapID]])
		else
			div = _div(this.drawGroupLayer(elem.content.properties, parentParams, parentVisibility), [['attr','GroupID',elem.content.properties.GroupID]])
		
		div.properties = elem;
	}
	
	$(div).addClass("treeElem");
	
	div.style.margin = '0px';
	div.style.padding = '0px';
	
	div.oncontextmenu = function(e)
	{
		return false;
	}
	
	return div;
}

externalLayersTree.prototype.drawLayer = function(elem, parentParams, layerManagerFlag, parentVisibility)
{
	var box, 
		_this = this;
	
	box = _checkbox(elem.visible, parentParams.list ? 'radio' : 'checkbox', parentParams.GroupID || parentParams.MapID);
	
	box.className = 'box';
	if ($.browser.msie)
		box.style.margin = '0px 0px -2px -2px';
	
	box.setAttribute('box','layer');
	
	box.onclick = function()
	{
		var parentParams = _this.getParentParams(this.parentNode.parentNode);
		
		_this.visibilityFunc(this, this.checked, parentParams.list);
	}
	
	var span = _span([_t(elem.title)], [['dir','className','layer'],['attr','dragg',true]]);
	
	var timer = null,
		clickFunc = function()
		{
			var box = span.parentNode.parentNode.firstChild;
			
			box.checked = true;
			
			var parentParams = _this.getParentParams(span.parentNode.parentNode.parentNode);
			
			_this.visibilityFunc(box, true, parentParams.list);
		},
		dbclickFunc = function()
		{
			var layer = globalFlashMap.layers[elem.name];
		
			if (layer)
				globalFlashMap.zoomToExtent(layer.bounds.minX, layer.bounds.minY, layer.bounds.maxX, layer.bounds.maxY);
		};
	
	span.onclick = function()
	{
		if (timer)
			clearTimeout(timer);
		
		timer = setTimeout(clickFunc, 200)
	}
	
	span.ondblclick = function()
	{
		if (timer)
			clearTimeout(timer);
		
		timer = null;
		
		clickFunc();
		dbclickFunc();
	}
	
	disableSelection(span);
	
	var spanParent = _div([span],[['attr','titleDiv',true],['css','display',($.browser.msie) ? 'inline' : 'inline'],['css','position','relative'],['css','borderBottom','none'],['css','paddingRight','3px']]),
		spanDescr = _span([_t(elem.description ? elem.description : '')],[['dir','className','layerDescription']]);

	if ($.browser.msie)
		spanParent.style.zIndex = 1;
		
	if (elem.type == "Vector")
	{
		var icon = this.mapHelper.createStylesEditorIcon(elem.styles, elem.GeometryType ? elem.GeometryType.toLowerCase() : 'polygon'),
			multiStyleParent = _div(null,[['attr','multiStyle',true]]);
		
		this.mapHelper.createMultiStyle(elem, multiStyleParent, true, layerManagerFlag);
		
		return [box, icon, spanParent, spanDescr, multiStyleParent];
	}
	else
	{
		var borderDescr = _span(),
			metaCount = 0;
		
		for (var key in elem.metadata)
			if (key != "ogc_fid" && key != 'PLCH' && key != 'Field1' && elem.metadata[key] != '' &&  elem.metadata[key] != null)
				metaCount++;
		
		if (elem.metadata && metaCount > 0 || elem.Legend)
		{
			_(borderDescr, [_t('i')], [['css','fontWeight','bold'],['css','fontStyle','italic'],['css','margin','0px 5px'],['css','cursor','pointer']]);
			
			borderDescr.onclick = function()
			{
				_this.showLayerInfo({properties:elem}, {properties: elem.metadata && metaCount > 0 ? elem.metadata : {}}, false)	
			}
		}
		
		return [box, spanParent, spanDescr, borderDescr];
	}
}

externalLayersTree.prototype.drawGroupLayer = function(elem, parentParams, layerManagerFlag, parentVisibility)
{
	var box,
		_this = this;
	
	box = _checkbox(elem.visible, parentParams.list ? 'radio' : 'checkbox', parentParams.GroupID || parentParams.MapID);
		
	box.className = 'box';
	if ($.browser.msie)
		box.style.margin = '-2px -2px -1px -5px';
	
	box.setAttribute('box','group');
	
	box.onclick = function()
	{
		var parentParams = _this.getParentParams(this.parentNode.parentNode);
		
		_this.visibilityFunc(this, this.checked, parentParams.list);
	}
	
	if (elem.alwaysVisible)
		box.style.display = 'none';
	
	var span = _span([_t(elem.title)], [['dir','className','groupLayer'],['attr','dragg',true]]);
	
	var timer = null,
		clickFunc = function()
		{
			if (!elem.alwaysVisible)
			{
				var box = span.parentNode.parentNode.firstChild;
				
				box.checked = true;
				
				var parentParams = _this.getParentParams(span.parentNode.parentNode.parentNode);
				
				_this.visibilityFunc(box, true, parentParams.list);
			}
			
			var clickDiv = $(span.parentNode.parentNode.parentNode).children("div.hitarea");
				
			if (clickDiv.length)
				$(clickDiv[0]).trigger("click");
		},
		dbclickFunc = function()
		{
			var childsUl = _abstractTree.getChildsUl(span.parentNode.parentNode.parentNode);
			
			if (childsUl)
			{
				var bounds = {
						minX: 100000000, 
						minY: 100000000, 
						maxX: -100000000, 
						maxY: -100000000
					};
				
				_this.mapHelper.findChilds(_this.mapHelper.findTreeElem(span.parentNode.parentNode).elem, function(child)
				{
					if (child.type == 'layer' && child.content.properties.LayerID)
					{
						var layerBounds = globalFlashMap.layers[child.content.properties.name].bounds;
					
						bounds.minX = Math.min(layerBounds.minX, bounds.minX);
						bounds.minY = Math.min(layerBounds.minY, bounds.minY);
						bounds.maxX = Math.max(layerBounds.maxX, bounds.maxX);
						bounds.maxY = Math.max(layerBounds.maxY, bounds.maxY);
					}
				});
				
				globalFlashMap.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
			}
		};
	
	span.onclick = function()
	{
		if (timer)
			clearTimeout(timer);
		
		timer = setTimeout(clickFunc, 200)
	}
	
	span.ondblclick = function()
	{
		if (timer)
			clearTimeout(timer);
		
		timer = null;
		
		clickFunc();
		dbclickFunc();
	}
	
	disableSelection(span);
	
	var spanParent = _div([span],[['attr','titleDiv',true],['css','display',($.browser.msie) ? 'inline' : 'inline'],['css','position','relative'],['css','borderBottom','none'],['css','paddingRight','3px']]);
	
	if ($.browser.msie)
		spanParent.style.zIndex = 1;
	
	return [box, spanParent];
}

externalLayersTree.prototype.visibilityFunc = function(box, flag, listFlag)
{
	if (listFlag)
		this.disableRadioGroups(box);
	
	this.setVisibility(box, flag);
}

// выключает все остальные радиобаттоны
externalLayersTree.prototype.disableRadioGroups = function(box)
{
	var parentGroupCanvas = box.parentNode.parentNode.parentNode;
	for (var i = 0; i < parentGroupCanvas.childNodes.length; i++)
	{
		var childDiv = $(parentGroupCanvas.childNodes[i]).children("div[LayerID],div[MultiLayerID]");
		
		if (!childDiv.length)
			childDiv = $(parentGroupCanvas.childNodes[i]).children("div[GroupID]");
		
		var childBox = childDiv[0].firstChild;
		
		if (childBox != box)
			this.setVisibility(childBox, false);
	}
}

externalLayersTree.prototype.findTreeBox = function(child)
{
	var searchStr;
	
	if (child.content.properties.LayerID)
		searchStr = "div[LayerID='" + child.content.properties.LayerID + "']";
	else if (child.content.properties.MultiLayerID)
		searchStr = "div[MultiLayerID='" + child.content.properties.MultiLayerID + "']";
	else
		searchStr = "div[GroupID='" + child.content.properties.GroupID + "']";
	
	var elem = $(searchStr);
	
	if (elem.length)
		return elem[0];
	else
		return false;
}

externalLayersTree.prototype.setVisibility = function(checkbox, flag)
{
	var treeElem = this.mapHelper.findTreeElem(checkbox.parentNode).elem,
		_this = this;
	
	treeElem.content.properties.visible = flag;
	
	if (checkbox.parentNode.getAttribute('GroupID'))
	{
		var parentParams = this.getParentParams(checkbox.parentNode.parentNode);
		
		this.mapHelper.findTreeElems(treeElem, function(child, visflag, list, index)
		{
			if (!visflag || (list && index != 0))
			{
				child.content.properties.visible = false;
				
				var elem = _this.findTreeBox(child);
				
				if (elem)
					elem.firstChild.checked = false;
			}
			else
			{
				child.content.properties.visible = true;
				
				var elem = _this.findTreeBox(child);
				
				if (elem)
					elem.firstChild.checked = true;
			}
		}, flag, parentParams.list)
		
		if (flag)
		{
			if (!this.setLayerVisibility(checkbox))
				this.updateChildLayersMapVisibility(checkbox.parentNode);
		}
		else
			this.updateChildLayersMapVisibility(checkbox.parentNode)
	}
	else
	{
		if (!flag)
			this.layerVisible(checkbox, false);
		else
		{
			this.setLayerVisibility(checkbox);
			
			this.layerVisible(checkbox, true); 
		}
	}
	
	this.updateTreeVisibility(checkbox);
}

externalLayersTree.prototype.layerVisible = function(box, flag)
{
	var layerName = box.parentNode.properties.content.properties.name;
	
	if (globalFlashMap.layers[layerName])
		globalFlashMap.layers[layerName].setVisible(flag);
	
	if (globalFlashMap.layers[layerName].miniLayer)
		globalFlashMap.layers[layerName].miniLayer.setVisible(flag);
}

externalLayersTree.prototype.getLayerVisibility = function(box)
{
	if (!box.checked)
		return false;
	
	var	el = box.parentNode.parentNode.parentNode;
	
	while (!el.root)
	{
		var group = $(el).children("[GroupID]");
		
		if (group.length > 0)
		{
			if (!group[0].firstChild.checked)
				return false;
		}
					
		el = el.parentNode;
	}
	
	return true;
}

// включает все выключенные элементы выше указанного элемента
externalLayersTree.prototype.setLayerVisibility = function(checkbox)
{
	var el = checkbox.parentNode.parentNode.parentNode,
		disabledBoxs = [];
	
	// находим все выключенные группы
	while (!el.root)
	{
		if (el.childNodes[1] && el.childNodes[1].getAttribute('GroupID') != null)
		{
			if (!el.childNodes[1].firstChild.checked)
			{
				el.childNodes[1].firstChild.checked = true;
				
				this.mapHelper.findTreeElem(el.childNodes[1]).elem.content.properties.visible = true;
				
				var listFlag;
				if ($(el.parentNode.parentNode).children("div[GroupID]")[0])
					listFlag = $(el.parentNode.parentNode).children("div[GroupID]")[0].properties.content.properties.list;
				else
					listFlag = $(el.parentNode.parentNode).children("div[MapID]")[0].properties.properties.list;
				
				if (listFlag)
					this.disableRadioGroups(el.childNodes[1].firstChild);
				
				disabledBoxs.push(el.childNodes[1].firstChild);
			}
		}
					
		el = el.parentNode;
	}
	
	if (!disabledBoxs.length)
		return false;
	
	// включаем все слои под верхней выключенной группой
	this.updateChildLayersMapVisibility(disabledBoxs[disabledBoxs.length - 1].parentNode);
	
	return true;
}

// приводит в соответствие видимость слоев на карте вложенным слоям указанного элемента дерева
externalLayersTree.prototype.updateChildLayersMapVisibility = function(div)
{
	var treeParent = div.getAttribute('MapID') ? this.mapHelper.mapTree : this.mapHelper.findTreeElem(div).elem
	
	this.mapHelper.findChilds(treeParent, function(child, visible)
	{
		if (globalFlashMap.layers[child.content.properties.name])
			globalFlashMap.layers[child.content.properties.name].setVisible(visible);
		
		if (globalFlashMap.layers[child.content.properties.name].miniLayer)
			globalFlashMap.layers[child.content.properties.name].miniLayer.setVisible(visible);
	},  div.getAttribute('MapID') ? true : this.getLayerVisibility(div.firstChild))
}

externalLayersTree.prototype.updateTreeVisibility = function(box)
{
}

externalLayersTree.prototype.drawHeaderGroupLayer = function(elem, parentParams)
{
	var span = _span([_t(elem.title)], [['dir','className','groupLayer']]),
		spanParent = _div([span],[['css','display',($.browser.msie) ? 'inline' : 'inline'],['css','position','relative'],['css','borderBottom','none'],['css','paddingRight','3px']]),
		_this = this;

	if ($.browser.msie)
		spanParent.style.zIndex = 1;
	
	return [spanParent];
}

externalLayersTree.prototype.getParentParams = function(li)
{
	var parentParams = li.parentNode.parentNode.childNodes[1].properties,
		listFlag;
	
	if (parentParams.content)
		listFlag = parentParams.content.properties;
	else
		listFlag = parentParams.properties;
	
	return listFlag;
}

externalLayersTree.prototype.removeLayer = function(name)
{
	if (globalFlashMap.layers[name].objectId)
		globalFlashMap.layers[name].remove();

	for (var i = 0; i < globalFlashMap.layers.length; i++)
	{
		if (globalFlashMap.layers[i].properties.name == name)
		{
			globalFlashMap.layers.splice(i, 1);
			
			break;
		}	
	}
	
	delete globalFlashMap.layers[name];
}

externalLayersTree.prototype.showLayerInfo = function(layer, obj, geoInfoFlag)
{
	var trs = [];
	for (var key in obj.properties)
		if (geoInfoFlag || (key != "ogc_fid" && key != 'PLCH' && key != 'Field1' && obj.properties[key] != '' &&  obj.properties[key] != null))
		{
			var content = _div(),
				contentText = String(obj.properties[key]);
			
			if (contentText.indexOf("http://") == 0 || contentText.indexOf("www.") == 0)
				contentText = "<a href=\"" + contentText + "\" target=\"_blank\">" + contentText + "</a>";
			
			content.innerHTML = contentText;
			
			trs.push(_tr([_td([_t(key)], [['css','width','30%']]), _td([content], [['css','width','70%']])]));
		}
	
	var title = _span(null, [['dir','className','title'], ['css','cursor','default']]),
		summary = _span(null, [['dir','className','summary']]),
		div;
	
	if (geoInfoFlag)
	{
		if (layer.properties.GeometryType == "point")
		{
			_(title, [_t(_gtxt("Координаты"))]);
			var coords = obj.getGeometry().coordinates;
			_(summary, [_t(formatCoordinates(merc_x(coords[0]), merc_y(coords[1])))]);
		}
		else if (layer.properties.GeometryType == "linestring")
		{
			_(title, [_t(_gtxt("Длина"))]);
			_(summary, [_t(prettifyDistance(obj.getLength()))]);
		}
		else if (layer.properties.GeometryType == "polygon")
		{
			_(title, [_t(_gtxt("Площадь"))]);
			_(summary, [_t(prettifyArea(obj.getArea()))]);
		}
	}
	
	if ($$('layerPropertiesInfo'))
	{
		div = $$('layerPropertiesInfo');
		
		if (!trs.length && !(layer.properties.type == "Raster" && layer.properties.Legend))
		{
			$(div.parentNode).dialog('close');
			
			return;
		}
		
		removeChilds(div);
		
		_(div, [_div([title], [['css','padding','5px 0px'],['dir','className','drawingObjectsCanvas']]),_table([_tbody(trs)], [['dir','className','vectorInfoParams']])]);
		
		if (geoInfoFlag)
			_(div.firstChild, [summary]);
		
		if (layer.properties.type == "Raster" && layer.properties.Legend)
		{
			var legend = _div();
			
			legend.innerHTML = layer.properties.Legend;
			
			_(div, [legend])
		}
		
		var dialogTitle = div.parentNode.parentNode.firstChild.firstChild;

		removeChilds(dialogTitle);

		_(dialogTitle, [_t(_gtxt("Слой [value0]", layer.properties.title))]);
		
		$(div.parentNode).dialog('open');
	}
	else
	{
		if (!trs.length && !(layer.properties.type == "Raster" && layer.properties.Legend))
			return;
		
		div = _div([_div([title], [['css','padding','5px 0px'],['dir','className','drawingObjectsCanvas']]),_table([_tbody(trs)], [['dir','className','vectorInfoParams']])], [['attr','id','layerPropertiesInfo']]);
		
		if (geoInfoFlag)
			_(div.firstChild, [summary]);

		if (layer.properties.type == "Raster" && layer.properties.Legend)
		{
			var legend = _div();
			
			legend.innerHTML = layer.properties.Legend;
			
			_(div, [legend])
		}
		
		showDialog(_gtxt("Слой [value0]", layer.properties.title), div, 360, 200, false, false, null, function(){return true})
	}
	
	setTimeout(function()
	{
		var titleHeight = $$('layerPropertiesInfo').parentNode.parentNode.firstChild.offsetHeight;

		$($$('layerPropertiesInfo').parentNode).dialog('option', 'height', titleHeight + 6 + div.offsetHeight);
		$($$('layerPropertiesInfo').parentNode).dialog('option', 'minHeight', titleHeight + 6 + div.offsetHeight);
		
		$$('layerPropertiesInfo').parentNode.style.height = div.offsetHeight + 'px';
		$$('layerPropertiesInfo').parentNode.style.minHeight = div.offsetHeight + 'px';
	}, 100)
}

var _externalLayersTree = new externalLayersTree();

