var mapLayers = 
{
	mapLayers:{},
	mapLayersList:{}
}

AbstractTree = function()
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

AbstractTree.prototype.toggle = function(box)
{
	box.onclick = function()
	{
		$(this.parentNode)
			.find(">.hitarea")
				.swapClass('collapsable-hitarea', 'expandable-hitarea')
				.swapClass('lastCollapsable-hitarea', 'lastExpandable-hitarea')
			.end()
			.swapClass('collapsable', 'expandable')
			.swapClass('lastCollapsable', 'lastExpandable')
		
		if ($(this.parentNode).hasClass('expandable') || $(this.parentNode).hasClass('lastExpandable'))
			hide(_abstractTree.getChildsUl(this.parentNode))
		else
			show(_abstractTree.getChildsUl(this.parentNode))
	}
}
AbstractTree.prototype.addNode = function(node, newNodeCanvas)
{
	var childsUl = _abstractTree.getChildsUl(node);
	
	if (childsUl)
		childsUl.insertBefore(newNodeCanvas, childsUl.firstChild)
	else
	{
		// если первый потомок
		var newSubTree = _ul([newNodeCanvas]);
		//_(node, [newSubTree, this.makeSwapChild()]);
		node.insertBefore(newSubTree, node.lastChild)
			
		newSubTree.loaded = true;
		
		var div = _div(null, [['dir','className','hitarea']]);
		
		if ($(node).hasClass("last"))
		{
			$(div).addClass('lastCollapsable-hitarea');
			$(div).addClass('collapsable-hitarea');
			$(node).addClass('lastCollapsable');
		}
		else
		{
			$(div).addClass('collapsable-hitarea');
			$(node).addClass('collapsable');
		}
		
		this.toggle(div);
		
		node.insertBefore(div, node.firstChild);
		
		_layersTree.addExpandedEvents(node);
		
		if ($(newNodeCanvas).hasClass('collapsable'))
		{
			$(newNodeCanvas).addClass('lastCollapsable')
			$(newNodeCanvas).children('div.hitarea').addClass('lastCollapsable-hitarea')
		}
		if ($(newNodeCanvas).hasClass('expandable'))
		{
			$(newNodeCanvas).addClass('lastExpandable')
			$(newNodeCanvas).children('div.hitarea').addClass('lastExpandable-hitarea')
		}
		if (!$(newNodeCanvas).hasClass('lastCollapsable') && !$(newNodeCanvas).hasClass('lastExpandable'))
			$(newNodeCanvas).addClass('last');
	}
	
	$(_abstractTree.getChildsUl(node)).children(":not(li:last)").each(function()
	{
		$(this).removeClass('last').replaceClass('lastCollapsable', 'collapsable').replaceClass('lastExpandable', 'expandable');
		$(this).children('div.lastCollapsable-hitarea').replaceClass('lastCollapsable-hitarea', 'collapsable-hitarea');
		$(this).children('div.lastExpandable-hitarea').replaceClass('lastExpandable-hitarea', 'expandable-hitarea');
	})
}
AbstractTree.prototype.delNode = function(node, parentTree, parent)
{
	if (parentTree.childNodes.length == 0)
	{
		// потомков не осталось, удалим контейнеры
		parentTree.removeNode(true);
		parent.firstChild.removeNode(true);
		
		// изменим дерево родителя
		$(parent).removeClass("collapsable")
		$(parent).replaceClass("lastCollapsable","last")
	}
	else
	{
		// изменим дерево родителя
		if ($(parentTree).children("li:last").hasClass("collapsable"))
		{
			$(parentTree).children("li:last").addClass("lastCollapsable");

			$(parentTree).children("li:last").each(function()
				{
					$(this.firstChild).addClass("lastCollapsable-hitarea");
				})
		}
		else
			$(parentTree).children("li:last").addClass("last")
	}
}

AbstractTree.prototype.swapNode = function(node, newNodeCanvas)
{
	$(node).after(newNodeCanvas)
		
	$(node.parentNode).children(":not(li:last)").each(function()
	{
		$(this).removeClass('last').replaceClass('lastCollapsable', 'collapsable').replaceClass('lastExpandable', 'expandable');
		$(this).children('div.lastCollapsable-hitarea').replaceClass('lastCollapsable-hitarea', 'collapsable-hitarea');
		$(this).children('div.lastExpandable-hitarea').replaceClass('lastExpandable-hitarea', 'expandable-hitarea');
	})
	
	// изменим дерево родителя
	if ($(node.parentNode).children("li:last").hasClass("collapsable"))
	{
		$(node.parentNode).children("li:last").addClass("lastCollapsable");

		$(node.parentNode).children("li:last").each(function()
			{
				$(this.firstChild).addClass("lastCollapsable-hitarea");
			})
	}
	else if ($(node.parentNode).children("li:last").hasClass("expandable"))
	{
		$(node.parentNode).children("li:last").addClass("lastExpandable");

		$(node.parentNode).children("li:last").each(function()
			{
				$(this.firstChild).addClass("lastExpandable-hitarea");
			})
	}
	else
		$(node.parentNode).children("li:last").addClass("last")
}

var _abstractTree = new AbstractTree();

//renderParams:
//  * showVisibilityCheckbox {Bool} - показывать или нет checkbox видимости
//  * allowActive {Bool} - возможен ли в дереве активный элемент
//  * allowDblClick {Bool} - переходить ли по двойному клику к видимому экстенту слоя/группы
var layersTree = function( renderParams )
{
    this._renderParams = $.extend({
        showVisibilityCheckbox: true, 
        allowActive: true, 
        allowDblClick: true
    }, renderParams);
    
	// тип узла
	this.type = null;
	
	// содержимое узла
	this.content = null;
	
	this.shownQuicklooks = {};
	this.shownQuicklooksParent = null;
	
	this.condition = {visible:{},expanded:{}};
	
	this.mapStyles = {};
	
//	this.permalinkActions = [];
	
	this.groupLoadingFuncs = [];
		
	//this.copiedStyle = null;
}

// layerManagerFlag == 0 для дерева слева
// layerManagerFlag == 1 для списка слоев
// layerManagerFlag == 2 для списка карт

layersTree.prototype.drawTree = function(tree, layerManagerFlag)
{
	var canvas = _ul([this.getChildsList(tree, false, layerManagerFlag, true)], [['dir','className','filetree']]);

	return canvas;
}

layersTree.prototype.getChildsList = function(elem, parentParams, layerManagerFlag, parentVisibility)
{
	// добавляем новый узел
	var li = _li(),
		_this = this;
	
	_(li, [this.drawNode(elem, parentParams, layerManagerFlag, parentVisibility)]);
	
	if (elem.content && elem.content.children && elem.content.children.length > 0)
	{
		var	childsUl = _ul();
		
		if (!elem.content.properties.expanded)
		{
			childsUl.style.display = 'none';
			childsUl.className = 'hiddenTree';
			
			if (!layerManagerFlag)
			{
				childsUl.loaded = false;
				
				this.addLoadingFunc(childsUl, elem, parentParams, layerManagerFlag);
			}
			else
			{
				childsUl.loaded = true;
				
				var childs = [];
				
				for (var i = 0; i < elem.content.children.length; i++)
					childs.push(this.getChildsList(elem.content.children[i], elem.content.properties, layerManagerFlag, true));
			
				_(childsUl, childs)
			}
		}
		else
		{
			childsUl.loaded = true;
			
			var childs = [];
				
			for (var i = 0; i < elem.content.children.length; i++)
				childs.push(this.getChildsList(elem.content.children[i], elem.content.properties, layerManagerFlag, parentVisibility && elem.content.properties.visible));
		
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
				childs.push(this.getChildsList(elem.children[i], elem.properties, layerManagerFlag, true));	
				
			var	childsUl = _ul(childs);
			
			childsUl.loaded = true;
			
			_(li, [childsUl])
		}
		
		_(li, [_div()])
		
		li.root = true;
	}
	else
		_(li, [_abstractTree.makeSwapChild()])
	
	// видимость слоя в дереве
	if (!nsGmx.AuthManager.isRole(nsGmx.ROLE_ADMIN) &&
		elem.type && elem.type == 'layer' &&
		typeof invisibleLayers != 'undefined' && invisibleLayers[elem.content.properties.name])
		li.style.display = 'none';
	
	return li;
}

layersTree.prototype.addLoadingFunc = function(parentCanvas, elem, parentParams, layerManagerFlag)
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
					childs.push(_this.getChildsList(elem.content.children[i], elem.content.properties, layerManagerFlag, _this.getLayerVisibility($(parentCanvas.parentNode).children("div[GroupID]")[0].firstChild)));
				
				_(parentCanvas, childs);
				
				if (_queryMapLayers.currentMapRights() == "edit")
				{
					_queryMapLayers.addDraggable(parentCanvas);
					
					if (!layerManagerFlag)
					{
						_queryMapLayers.addDroppable(parentCanvas);
						
						_queryMapLayers.addSwappable(parentCanvas);
					}
				}
				
				$(parentCanvas).treeview();
				
				_layersTree.addExpandedEvents(parentCanvas);
				
				_this.runLoadingFuncs();
				
				_queryMapLayers.applyState(_this.condition, _this.mapStyles, $(parentCanvas.parentNode).children("div[GroupID]")[0]);
			}
		})
	},
	_this = this;
	
	this.groupLoadingFuncs.push(func);
}

layersTree.prototype.runLoadingFuncs = function()
{
	for (var i = 0; i < this.groupLoadingFuncs.length; i++)
		this.groupLoadingFuncs[i]();
	
	this.groupLoadingFuncs = [];
}

layersTree.prototype.addExpandedEvents = function(parent)
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

layersTree.prototype.drawNode = function(elem, parentParams, layerManagerFlag, parentVisibility)
{
	var div;
    var _this = this;

	if (elem.type == "layer")
	{
        var elemProperties = !layerManagerFlag ? globalFlashMap.layers[elem.content.properties.name].properties : elem.content.properties;
		var childs = this.drawLayer(elemProperties, parentParams, layerManagerFlag, parentVisibility);
		
		if (typeof elem.content.properties.LayerID != 'undefined')
			div = _div(childs, [['attr','LayerID',elem.content.properties.LayerID]]);
		else
			div = _div(childs, [['attr','MultiLayerID',elem.content.properties.MultiLayerID]]);
            
        if (this._renderParams.showVisibilityCheckbox && layerManagerFlag !== 1)
        {
            globalFlashMap.layers[elemProperties.name].addMapStateListener("onChangeVisible", function(attr)
            {
                var box = div.firstChild;
                if (attr != box.checked)
                {
                    box.checked = attr;
                    var parentParams = _this.getParentParams(div.parentNode);
                    _this.visibilityFunc(box, box.checked, parentParams.list);
                }
            });
        }
		
		var multiStyleParent = $(childs).children('[multiStyle]');
		
		if (multiStyleParent.length)
			$(multiStyleParent[0]).treeview();	
	//	if ($(childs[childs.length - 1]).hasClass('hiddenTree')) // несколько стилей
	//		$(childs[childs.length - 1]).treeview();
		
		div.gmxProperties = elem;
		div.gmxProperties.content.properties = elemProperties;
	}
	else
	{
		if (elem.properties && elem.properties.MapID)
			div = _div(this.drawHeaderGroupLayer(elem.properties, parentParams, layerManagerFlag), [['attr','MapID',elem.properties.MapID]])
		else
			div = _div(this.drawGroupLayer(elem.content.properties, parentParams, layerManagerFlag, parentVisibility), [['attr','GroupID',elem.content.properties.GroupID]])
		
		div.gmxProperties = elem;
	}
	
	div.oncontextmenu = function(e)
	{
		return false;
	}
	
	return div;
}

layersTree.prototype.setActive = function(span)
{
	$(_queryMapLayers.treeCanvas).find(".active").removeClass("active");
	
	$(span.parentNode).addClass("active");
}

layersTree.prototype.setListActive = function(span)
{
	$(_queryMapLayers.listCanvas).find(".active").removeClass("active");
	
	$(span.parentNode).addClass("active");
}

layersTree.prototype.getMinLayerZoom = function(layer)
{
	var minLayerZoom = 20;
	
	for (var i = 0; i < layer.properties.styles.length; i++)
		minLayerZoom = Math.min(minLayerZoom, layer.properties.styles[i].MinZoom);
	
	return minLayerZoom
}

layersTree.prototype.layerZoomToExtent = function(bounds, minZoom)
{
	var z = globalFlashMap.getBestZ(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
	if (minZoom != 20)
		z = Math.max(z, minZoom);
	globalFlashMap.moveTo(
		from_merc_x((merc_x(bounds.minX) + merc_x(bounds.maxX))/2),
		from_merc_y((merc_y(bounds.minY) + merc_y(bounds.maxY))/2),
		z
	);
}

layersTree.prototype.drawLayer = function(elem, parentParams, layerManagerFlag, parentVisibility)
{
	var box, 
		_this = this;
	
	//if (!layerManagerFlag)
	if (this._renderParams.showVisibilityCheckbox)
	{
		box = _checkbox(elem.visible, parentParams.list ? 'radio' : 'checkbox', parentParams.GroupID || parentParams.MapID);
		
		box.className = 'box';
		if ($.browser.msie)
			box.style.margin = '-3px -2px 0px -2px';
		
		box.setAttribute('box','layer');
		
		box.onclick = function()
		{
			var parentParams = _this.getParentParams(this.parentNode.parentNode);
			
			_this.visibilityFunc(this, this.checked, parentParams.list);
		}
	}
	
	var span = _span([_t(elem.title)], [['dir','className','layer'],['attr','dragg',true]]);
	
	// if (!layerManagerFlag)
	// {
    var timer = null,
        clickFunc = function()
        {
            if (_this._renderParams.allowActive)
                _this.setActive(span);
            
            if (_this._renderParams.showVisibilityCheckbox)
            {
                var box = span.parentNode.parentNode.firstChild;
                
                box.checked = true;
                
                var parentParams = _this.getParentParams(span.parentNode.parentNode.parentNode);
                
                _this.visibilityFunc(box, true, parentParams.list);
            }
        },
        dbclickFunc = function()
        {
            var layer = globalFlashMap.layers[elem.name];
        
            if (layer)
            {
                var minLayerZoom = _this.getMinLayerZoom(layer);
                
                _this.layerZoomToExtent(layer.bounds, minLayerZoom);
            }
        };
    
    span.onclick = function()
    {
        if (timer)
            clearTimeout(timer);
        
        timer = setTimeout(clickFunc, 200)
    }
    
    if (this._renderParams.allowDblClick)
    {
        span.ondblclick = function()
        {
            if (timer)
                clearTimeout(timer);
            
            timer = null;
            
            clickFunc();
            dbclickFunc();
        }
    }
    
    disableSelection(span);
	// }
	
	var spanParent = _div([span],[['attr','titleDiv',true],['css','display',($.browser.msie) ? 'inline' : 'inline'],['css','position','relative'],['css','borderBottom','none'],['css','paddingRight','3px']]),
		spanDescr = _span(null,[['dir','className','layerDescription']]);
		
	spanDescr.innerHTML = elem.description ? elem.description : '';

	if ($.browser.msie)
		spanParent.style.zIndex = 1;
		
	if (layerManagerFlag == 1)
		return [_img(null, [['attr','src', (elem.type == "Vector") ? 'img/vector.png' : (typeof elem.MultiLayerID != 'undefined' ? 'img/multi.png' : 'img/rastr.png')],['css','marginLeft','3px']]), spanParent, spanDescr];
	
	if (this._renderParams.showVisibilityCheckbox && !globalFlashMap.layers[elem.name].isVisible)
		$(spanParent).addClass("invisible")
	
	nsGmx.ContextMenuController.bindMenuToElem(spanParent, 'Layer', function(){return true;}, {
		layerManagerFlag: layerManagerFlag,
		elem: elem, 
		tree: this
	});
		
	if (elem.type == "Vector")
	{
		var icon = this.mapHelper.createStylesEditorIcon(elem.styles, elem.GeometryType ? elem.GeometryType.toLowerCase() : 'polygon', {addTitle: !layerManagerFlag}),
			multiStyleParent = _div(null,[['attr','multiStyle',true]]);
		
		this.mapHelper.createMultiStyle(elem, multiStyleParent, true, layerManagerFlag);
		
		if (!layerManagerFlag)
		{
			if (!parentVisibility || !elem.visible)
				$(multiStyleParent).addClass("invisible")
			
			icon.onclick = function()
			{
				_this.mapHelper.createLayerEditor(this.parentNode, 1,  icon.parentNode.gmxProperties.content.properties.styles.length > 1 ? -1 : 0);
			}
			
		}
        
        if (this._renderParams.showVisibilityCheckbox)
			return [box, icon, spanParent, spanDescr, multiStyleParent];
		else
			return [icon, spanParent, spanDescr, multiStyleParent];
	}
	else
	{
		var borderDescr = _span(),
			metaCount = 0;;
		
		for (var key in elem.metadata)
			if (key != elem.identityField && key != 'PLCH' && key != 'Field1' && elem.metadata[key] != '' &&  elem.metadata[key] != null)
				metaCount++;
		
		if (elem.metadata && metaCount > 0 || elem.Legend)
		{
			_(borderDescr, [_t('i')], [['css','fontWeight','bold'],['css','fontStyle','italic'],['css','margin','0px 5px'],['css','cursor','pointer']]);
			
			borderDescr.onclick = function()
			{
				_this.showLayerInfo({properties:elem}, {properties: elem.metadata && metaCount > 0 ? elem.metadata : {}}, false, elem.identityField)
			}
		}
		
		if (this._renderParams.showVisibilityCheckbox)
			return [box, spanParent, spanDescr, borderDescr];
		else
			return [spanParent, spanDescr, borderDescr];
	}
}

layersTree.prototype.downloadVectorLayer = function(name, mapHostName)
{
    var layer = globalFlashMap.layers[name];
    window.location.href = "http://" + mapHostName + "/" + "DownloadLayer.ashx" + 
			"?t=" + layer.properties.name;
}

//При клике на объекте показывает аттрибутивную информацию объекта в виде красивой таблицы. 
//На данный момент нигде не используется
layersTree.prototype.showInfo = function(layer)
{
	if (layer.properties.type != 'Vector')
		return;
	
	if (layer.properties.Quicklook != null && layer.properties.Quicklook != '')
		return;
	
	var _this = this;
	
	layer.setHandler("onClick", function(obj)
	{
		_this.showLayerInfo(layer, obj, true, layer.properties.identityField)
	})
}

//Показывает аттрибутивную информацию объекта в виде таблички в отдельном диалоге
layersTree.prototype.showLayerInfo = function(layer, obj, geoInfoFlag, identityField)
{
	var trs = [];
	for (var key in obj.properties)
		if (geoInfoFlag || (key != identityField && key != 'PLCH' && key != 'Field1' && obj.properties[key] != '' &&  obj.properties[key] != null))
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

        var dialogDiv = $$('layerPropertiesInfo').parentNode;
		$(dialogDiv).dialog('option', 'height', titleHeight + 6 + div.offsetHeight);
		$(dialogDiv).dialog('option', 'minHeight', titleHeight + 6 + div.offsetHeight);
		
		dialogDiv.style.height = div.offsetHeight + 'px';
		dialogDiv.style.minHeight = div.offsetHeight + 'px';
        
        if ($.browser.msie)
        {
            dialogDiv.parentNode.style.height = div.offsetHeight + 'px';
            dialogDiv.parentNode.style.minHeight = div.offsetHeight + 'px';
        }
	}, 100)
}

layersTree.prototype.drawGroupLayer = function(elem, parentParams, layerManagerFlag, parentVisibility)
{
	var box,
		_this = this;
	
	if (!layerManagerFlag)
	{
		box = _checkbox(elem.visible, parentParams.list ? 'radio' : 'checkbox', parentParams.GroupID || parentParams.MapID);
		
		box.className = 'box';
		if ($.browser.msie)
			box.style.margin = '-3px -2px 0px -2px';
		
		box.setAttribute('box','group');
		
		box.onclick = function()
		{
			var parentParams = _this.getParentParams(this.parentNode.parentNode);
			
			_this.visibilityFunc(this, this.checked, parentParams.list);
		}
		
		if (typeof elem.ShowCheckbox !== 'undefined' && !elem.ShowCheckbox)
		{
			box.isDummyCheckbox = true;
			box.style.display = 'none';
        }
	}
	
	var span = _span([_t(elem.title)], [['dir','className','groupLayer'],['attr','dragg',true]]);
	
	if (!layerManagerFlag)
	{
		var timer = null,
			clickFunc = function()
			{
                if (_this._renderParams.allowActive)
                    _this.setActive(span);
				
                if (_this._renderParams.showVisibilityCheckbox)
                {
                    var box = span.parentNode.parentNode.firstChild;
                    
                    box.checked = true;
                    
                    if (!box.isDummyCheckbox)
                    {
                        var parentParams = _this.getParentParams(span.parentNode.parentNode.parentNode);
                        _this.visibilityFunc(box, true, parentParams.list);
                    }
                        
                    var clickDiv = $(span.parentNode.parentNode.parentNode).children("div.hitarea");
                        
                    if (clickDiv.length)
                        $(clickDiv[0]).trigger("click");
                }
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
						},
						minLayerZoom = 20;
					
					_this.mapHelper.findChilds(_this.mapHelper.findTreeElem(span.parentNode.parentNode).elem, function(child)
					{
						if (child.type == 'layer' && child.content.properties.LayerID)
						{
							var layer = globalFlashMap.layers[child.content.properties.name],
								layerBounds = layer.bounds;
						
							bounds.minX = Math.min(layerBounds.minX, bounds.minX);
							bounds.minY = Math.min(layerBounds.minY, bounds.minY);
							bounds.maxX = Math.max(layerBounds.maxX, bounds.maxX);
							bounds.maxY = Math.max(layerBounds.maxY, bounds.maxY);
							
							minLayerZoom = Math.min(minLayerZoom, _this.getMinLayerZoom(layer));
						}
					});
					
					_this.layerZoomToExtent(bounds, minLayerZoom);
				}
			};
		
		span.onclick = function()
		{
			if (timer)
				clearTimeout(timer);
			
			timer = setTimeout(clickFunc, 200)
		}
		
        if (this._renderParams.allowDblClick)
        {
            span.ondblclick = function()
            {
                if (timer)
                    clearTimeout(timer);
                
                timer = null;
                
                clickFunc();
                dbclickFunc();
            }
        }
		
		disableSelection(span);
	}
	
	var spanParent = _div([span],[['attr','titleDiv',true],['css','display',($.browser.msie) ? 'inline' : 'inline'],['css','position','relative'],['css','borderBottom','none'],['css','paddingRight','3px']]);
	
	if ($.browser.msie)
		spanParent.style.zIndex = 1;
	
	if (!layerManagerFlag)
	{
		if (!parentVisibility || !elem.visible)
			$(spanParent).addClass("invisible")
		
		nsGmx.ContextMenuController.bindMenuToElem(spanParent, 'Group', function()
		{
				return _queryMapLayers.currentMapRights() == "edit";
		}, 
		function(){
			return {
				div: spanParent.parentNode,
				tree: _this
		}
		});
		
		return [box, spanParent];
	}
	else
		return [spanParent];
}
layersTree.prototype.drawHeaderGroupLayer = function(elem, parentParams, layerManagerFlag)
{
	var span = _span([_t(elem.title)], [['dir','className','groupLayer']]),
		spanParent = _div([span],[['css','display',($.browser.msie) ? 'inline' : 'inline'],['css','position','relative'],['css','borderBottom','none'],['css','paddingRight','3px']]),
		_this = this;

	if ($.browser.msie)
		spanParent.style.zIndex = 1;
	
	if (layerManagerFlag)
		return [spanParent];

	span.onclick = function()
	{
		if (_this._renderParams.allowActive)
            _this.setActive(this);
	}
	
	nsGmx.ContextMenuController.bindMenuToElem(spanParent, 'Map', function()
	{
		return _queryMapLayers.currentMapRights() == "edit";
	}, 
	function() 
	{
		return {
			div: spanParent.parentNode,
			tree: _this
	}
	});

	return [spanParent];
}

layersTree.prototype.createGroupId = function()
{
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz",
		randomstring = '';
	
	for (var i = 0; i < 16; i++) 
	{
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.charAt(rnum);
	}
	
	return randomstring;
}

layersTree.prototype.removeGroup = function(div)
{
	var box = _checkbox(false, 'checkbox'),
		remove = makeButton(_gtxt("Удалить")),
		span = _span([_t(_gtxt("Включая вложенные слои"))]),
		pos = nsGmx.Utils.getDialogPos(div, true, 90),
		_this = this;
	
	if (!$.browser.msie)
		span.style.marginLeft = '5px';
	
	remove.style.marginTop = '10px';

	remove.onclick = function()
	{
		var parentTree = div.parentNode.parentNode,
			childsUl = _abstractTree.getChildsUl(div.parentNode);
		
		if (box.checked)
		{
			if (childsUl)
			{
				// удаляем все слои
				$(childsUl).find("div[LayerID],div[MultiLayerID]").each(function()
				{
					_queryMapLayers.removeLayer(this.gmxProperties.content.properties.name)
				})
			}
		}
		else
		{
			var divDestination = $(parentTree.parentNode).children("div[MapID],div[GroupID]")[0];
			
			if (childsUl)
			{
				// переносим все слои наверх
				$(childsUl).find("div[LayerID],div[MultiLayerID]").each(function()
				{
					var spanSource = $(this).find("span.layer")[0];
						
					_this.moveHandler(spanSource, divDestination);
				})
			}
		}
		
		_this.mapHelper.removeTreeElem(div);
		
		div.parentNode.removeNode(true);
		
		_abstractTree.delNode(null, parentTree, parentTree.parentNode)
		
		$(span.parentNode.parentNode).dialog('destroy');
		span.parentNode.parentNode.removeNode(true);
		
		_this.mapHelper.updateUnloadEvent(true);
	}
	
	showDialog(_gtxt("Удаление группы [value0]", div.gmxProperties.content.properties.title), _div([box, span, _br(), remove],[['css','textAlign','center']]), 250, 90, pos.left, pos.top)
}

layersTree.prototype.showSaveStatus = function(parent)
{
	if (this.timer)
		clearTimeout(this.timer)
	
	$(parent).find("[savestatus]").remove();
			
	var divStatus = _div([_span([_t(_gtxt("Сохранено"))],[['css','marginLeft','10px'],['css','color','#33AB33']])], [['css','paddingTop','10px'],['attr','savestatus',true]]);
	
	_(parent, [divStatus])
	
	this.timer = setTimeout(function()
		{
			divStatus.removeNode(true);
		}, 1500)
}

// выключает все остальные радиобаттоны
layersTree.prototype.disableRadioGroups = function(box)
{
	var parentGroupCanvas = box.parentNode.parentNode.parentNode;
	for (var i = 0; i < parentGroupCanvas.childNodes.length; i++)
	{
		var childDiv = $(parentGroupCanvas.childNodes[i]).children("div[LayerID],div[MultiLayerID]");
		
		if (!childDiv.length)
			childDiv = $(parentGroupCanvas.childNodes[i]).children("div[GroupID]");
		
		var childBox = childDiv[0].firstChild;
		
		if (childBox != box && !childBox.isDummyCheckbox)
			this.setVisibility(childBox, false);
	}
}

layersTree.prototype.visibilityFunc = function(box, flag, listFlag, forceChildVisibility)
{
	//if (box.isDummyCheckbox) return;
	
	if (listFlag)
		this.disableRadioGroups(box);
	
	this.setVisibility(box, flag, forceChildVisibility);
}

layersTree.prototype.findTreeBox = function(child)
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

layersTree.prototype.setVisibility = function(checkbox, flag, forceChildVisibility)
{
	if (typeof forceChildVisibility === 'undefined') 
		forceChildVisibility = true;
		
	var treeElem = this.mapHelper.findTreeElem(checkbox.parentNode).elem;
	var _this = this;
	treeElem.content.properties.visible = flag;
	
	if (checkbox.parentNode.getAttribute('GroupID'))
	{
		if (flag)
			this.setLayerVisibility(checkbox);
	
		var parentParams = this.getParentParams(checkbox.parentNode.parentNode);

		// Делаем видимость всех потомков узла дерева такой же, как видимость этого слоя. 
		if (forceChildVisibility)
		{
			this.mapHelper.findTreeElems(treeElem, function(child, visflag, list, index)
			{
				if (!visflag || (list && index != 0))
				{
					child.content.properties.visible = false;
					
					var elem = _this.findTreeBox(child);
					
					if (elem)
					{
						elem.firstChild.checked = false;
						_this.setVisibility(elem.firstChild, false);
					}
				}
				else
				{
					child.content.properties.visible = true;
					
					var elem = _this.findTreeBox(child);
					
					if (elem)
					{
						elem.firstChild.checked = true;
						_this.setVisibility(elem.firstChild, true);
					}
				}
			}, flag, parentParams.list);
		}
	
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

layersTree.prototype.layerVisible = function(box, flag)
{
	var layerName = box.parentNode.gmxProperties.content.properties.name;
	
	if (globalFlashMap.layers[layerName])
		globalFlashMap.layers[layerName].setVisible(flag);
	
	if (globalFlashMap.layers[layerName].miniLayer)
		globalFlashMap.layers[layerName].miniLayer.setVisible(flag);
}

layersTree.prototype.getLayerVisibility = function(box)
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
layersTree.prototype.setLayerVisibility = function(checkbox)
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
				
				$(el.childNodes[1].childNodes[1]).removeClass("invisible")
				
				var listFlag;
				if ($(el.parentNode.parentNode).children("div[GroupID]")[0])
					listFlag = $(el.parentNode.parentNode).children("div[GroupID]")[0].gmxProperties.content.properties.list;
				else
					listFlag = $(el.parentNode.parentNode).children("div[MapID]")[0].gmxProperties.properties.list;
				
				if (listFlag)
					this.disableRadioGroups(el.childNodes[1].firstChild);
				
				disabledBoxs.push(el.childNodes[1].firstChild);
			}
		}
					
		el = el.parentNode;
	}
	
	if (!disabledBoxs.length)
		return;
	
	// включаем все слои под верхней выключенной группой
	this.updateChildLayersMapVisibility(disabledBoxs[disabledBoxs.length - 1].parentNode);
}

// приводит в соответствие видимость слоев на карте вложенным слоям указанного элемента дерева
layersTree.prototype.updateChildLayersMapVisibility = function(div)
{
	var treeParent = div.getAttribute('MapID') ? this.mapHelper.mapTree : this.mapHelper.findTreeElem(div).elem
	
	this.mapHelper.findChilds(treeParent, function(child, visible)
	{
		if (globalFlashMap.layers[child.content.properties.name])
			globalFlashMap.layers[child.content.properties.name].setVisible(visible);
		
		if (globalFlashMap.layers[child.content.properties.name].miniLayer)
			globalFlashMap.layers[child.content.properties.name].miniLayer.setVisible(visible);
	},  div.getAttribute('MapID') ? true : this.getLayerVisibility(div.firstChild))
	
	var ulChilds = _abstractTree.getChildsUl(div.parentNode);

	if (ulChilds)
	{
		var _this = this;
		
		$(ulChilds).find("input[box]").each(function()
		{
			_this.updateTreeVisibility(this);
		})
	}
}

layersTree.prototype.updateTreeVisibility = function(box)
{
	// ie8 не поддерживает opacity в css. wtf
	
	if (this.getLayerVisibility(box))
	{
		$(box.parentNode).children("[titleDiv]").removeClass("invisible");
		$(box.parentNode).children("[multiStyle]").removeClass("invisible");
	}
	else
	{
		$(box.parentNode).children("[titleDiv]").addClass("invisible");
		$(box.parentNode).children("[multiStyle]").addClass("invisible");
	}
}

layersTree.prototype.dummyNode = function(node)
{
	var text = node.innerHTML;
	
	return div = _div([_t(text)],[['dir','className','dragableDummy']]);
}

layersTree.prototype.moveHandler = function(spanSource, divDestination)
{
	var node = divDestination.parentNode,
		parentTree = spanSource.parentNode.parentNode.parentNode.parentNode;

	this.mapHelper.removeTreeElem(spanSource.parentNode.parentNode);
	this.mapHelper.addTreeElem(divDestination, 0, spanSource.parentNode.parentNode.gmxProperties);

	// добавим новый узел
	var childsUl = _abstractTree.getChildsUl(node);
	
	if (childsUl)
	{
		_abstractTree.addNode(node, spanSource.parentNode.parentNode.parentNode);
		
		this.updateListType(spanSource.parentNode.parentNode.parentNode);
		
		if (!childsUl.loaded)
			spanSource.parentNode.parentNode.parentNode.removeNode(true)
	}
	else
	{
		_abstractTree.addNode(node, spanSource.parentNode.parentNode.parentNode);

		this.updateListType(spanSource.parentNode.parentNode.parentNode);
	}
	
	// удалим старый узел
	_abstractTree.delNode(node, parentTree, parentTree.parentNode);
	
	this.mapHelper.updateUnloadEvent(true);
}
layersTree.prototype.swapHandler = function(spanSource, divDestination)
{
	var node = divDestination.parentNode,
		parentTree = spanSource.parentNode.parentNode.parentNode.parentNode;
	
	if (node == spanSource.parentNode.parentNode.parentNode)
		return;
	
	this.mapHelper.removeTreeElem(spanSource.parentNode.parentNode);
	
	var divElem = $(divDestination.parentNode).children("div[GroupID],div[LayerID],div[MultiLayerID]")[0],
		divParent = $(divDestination.parentNode.parentNode.parentNode).children("div[MapID],div[GroupID]")[0],
		index = this.mapHelper.findTreeElem(divElem).index;
	
	this.mapHelper.addTreeElem(divParent, index + 1, spanSource.parentNode.parentNode.gmxProperties);

	_abstractTree.swapNode(node, spanSource.parentNode.parentNode.parentNode);
	
	this.updateListType(spanSource.parentNode.parentNode.parentNode);
	
	// удалим старый узел
	_abstractTree.delNode(node, parentTree, parentTree.parentNode);
	
	this.mapHelper.updateUnloadEvent(true);
}
layersTree.prototype.copyHandler = function(spanSource, divDestination, swapFlag, addToMap)
{
    var _this = this;
	var isFromList = typeof spanSource.parentNode.parentNode.gmxProperties.content.geometry === 'undefined';
	var layerProperties = (spanSource.parentNode.parentNode.gmxProperties.type !== 'layer' || !isFromList) ? spanSource.parentNode.parentNode.gmxProperties : false,
		copyFunc = function()
		{
			// если копируем слой из списка, но не из карты
			if (layerProperties.type == 'layer' && isFromList)
				layerProperties.content.geometry = from_merc_geometry(layerProperties.content.geometry);
			
			if (addToMap)
            {
                if ( !_this.addLayersToMap(layerProperties) )
                    return;
            }
            else
            {
                if ( _this.mapHelper.findTreeElem(spanSource.parentNode.parentNode) )
                {
                    if (layerProperties.type === 'layer')
                        showErrorMessage(_gtxt("Слой '[value0]' уже есть в карте", layerProperties.content.properties.title), true)
                    else
                        showErrorMessage(_gtxt("Группа '[value0]' уже есть в карте", layerProperties.content.properties.title), true)
                        
                    return;
                }
                    
            }
			
			var node = divDestination.parentNode,
				parentProperties = swapFlag ? $(divDestination.parentNode.parentNode.parentNode).children("div[GroupID],div[MapID]")[0].gmxProperties : divDestination.gmxProperties,
				li;
			
			if (swapFlag)
			{
				var parentDiv = $(divDestination.parentNode.parentNode.parentNode).children("div[GroupID],div[MapID]")[0];
				
				li = _this.getChildsList(layerProperties, parentProperties, false, parentDiv.getAttribute('MapID') ? true : _this.getLayerVisibility(parentDiv.firstChild));
			}
			else
				li = _this.getChildsList(layerProperties, parentProperties, false, _this.getLayerVisibility(divDestination.firstChild));
			
			if (layerProperties.type == 'group')
			{
				// добавляем группу
				if (_abstractTree.getChildsUl(li))
				{
					var div = _div(null, [['dir','className','hitarea']]);
					
					if (layerProperties.content.properties.expanded)
					{
						$(div).addClass('collapsable-hitarea');
						$(li).addClass('collapsable');
					}
					else
					{
						$(div).addClass('expandable-hitarea');
						$(li).addClass('expandable');
					}
					
					_abstractTree.toggle(div);
					
					li.insertBefore(div, li.firstChild);
					
					$(li).treeview();
					
					// если копируем из карты
					if (isFromList)
                        _layersTree.runLoadingFuncs();
				}
				
				_queryMapLayers.addDraggable(li)
				
				_queryMapLayers.addDroppable(li);
			}
			else
			{
				_queryMapLayers.addDraggable(li);
				
				if (layerProperties.type == 'layer' && layerProperties.content.properties.styles.length > 1)
					$(li).treeview();
			}
			
			_queryMapLayers.addSwappable(li);
			
			if (swapFlag)
			{
				var divElem = $(divDestination.parentNode).children("div[GroupID],div[LayerID],div[MultiLayerID]")[0],
					divParent = $(divDestination.parentNode.parentNode.parentNode).children("div[MapID],div[GroupID]")[0],
					index = _this.mapHelper.findTreeElem(divElem).index;
			
				_this.mapHelper.addTreeElem(divParent, index + 1, layerProperties);

				_abstractTree.swapNode(node, li);
				
				_this.updateListType(li, true);
			}
			else
			{
				_this.mapHelper.addTreeElem(divDestination, 0, layerProperties);

				var childsUl = _abstractTree.getChildsUl(node);
				
				if (childsUl)
				{
					_abstractTree.addNode(node, li);
					
					_this.updateListType(li, true);
					
					if (!childsUl.loaded)
						li.removeNode(true)
				}
				else
				{
					_abstractTree.addNode(node, li);
					
					_this.updateListType(li, true);
				}
			}
			
			_this.mapHelper.updateUnloadEvent(true);
		},
		_this = this;
	
	if (!layerProperties)
	{
		if (spanSource.parentNode.parentNode.gmxProperties.content.properties.LayerID)
		{
			sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerJson.ashx?WrapStyle=func&LayerName=" + spanSource.parentNode.parentNode.gmxProperties.content.properties.name, function(response)
			{
				if (!parseResponse(response))
					return;
				
				layerProperties = {type:'layer', content: response.Result};
				
				if (layerProperties.content.properties.type == 'Vector')
					layerProperties.content.properties.styles = [{MinZoom:layerProperties.content.properties.MaxZoom, MaxZoom:21, RenderStyle:_this.mapHelper.defaultStyles[layerProperties.content.properties.GeometryType]}]
				else if (layerProperties.content.properties.type != 'Vector' && !layerProperties.content.properties.MultiLayerID)
					layerProperties.content.properties.styles = [{MinZoom:layerProperties.content.properties.MinZoom, MaxZoom:21}];
				
				layerProperties.content.properties.mapName = _this.mapHelper.mapProperties.name;
				layerProperties.content.properties.hostName = _this.mapHelper.mapProperties.hostName;
				layerProperties.content.properties.visible = true;
				
				copyFunc();
			})
		}
		else
		{
			sendCrossDomainJSONRequest(serverBase + "MultiLayer/GetMultiLayerJson.ashx?WrapStyle=func&MultiLayerID=" + spanSource.parentNode.parentNode.gmxProperties.content.properties.MultiLayerID, function(response)
			{
				if (!parseResponse(response))
					return;
				
				layerProperties = {type:'layer', content: response.Result};
				
				layerProperties.content.properties.styles = [{MinZoom:layerProperties.content.properties.MinZoom, MaxZoom:20}];
				
				layerProperties.content.properties.mapName = _this.mapHelper.mapProperties.name;
				layerProperties.content.properties.hostName = _this.mapHelper.mapProperties.hostName;
				layerProperties.content.properties.visible = true;
				
				copyFunc();
			})
		}
	}
	else
		copyFunc();
}

layersTree.prototype.addLayersToMap = function(elem)
{
	if (typeof elem.content.properties.GroupID != 'undefined')
	{
		for (var i = 0; i < elem.content.children.length; i++)
		{
			var res = this.addLayersToMap(elem.content.children[i]);
			
			if (!res)
				return false;
		}
	}
	else
	{
		var layer = elem.content,
			name = layer.properties.name;

		if (!globalFlashMap.layers[name])
		{
			var visibility = typeof layer.properties.visible != 'undefined' ? layer.properties.visible : false;
			
			globalFlashMap.addLayer(layer, visibility);
			
			globalFlashMap.layers[name].setVisible(visibility);
			globalFlashMap.layers[name].bounds = getLayerBounds( elem.content.geometry.coordinates[0], globalFlashMap.layers[name]);
			
			//this.showInfo(globalFlashMap.layers[name])
		}
		else
		{
			showErrorMessage( _gtxt("Слой '[value0]' уже есть в карте", globalFlashMap.layers[name].properties.title), true );
			return false;
		}
	}
	
	return true;
}

layersTree.prototype.getParentParams = function(li)
{
    //при визуализации дерева в него добавляются новые элементы. Используем хак, чтобы понять, было отрисовано дерево или нет
	var parentParams = li.parentNode.parentNode.childNodes[1].tagName == "DIV" ? li.parentNode.parentNode.childNodes[1].gmxProperties : li.parentNode.parentNode.childNodes[0].gmxProperties,
		listFlag;
	
	if (parentParams.content)
		listFlag = parentParams.content.properties;
	else
		listFlag = parentParams.properties;
	
	return listFlag;
}

layersTree.prototype.updateListType = function(li, skipVisible)
{
    //при визуализации дерева в него добавляются новые элементы. Используем хак, чтобы понять, было отрисовано дерево или нет
	var parentParams = li.parentNode.parentNode.childNodes[1].tagName == "DIV" ? li.parentNode.parentNode.childNodes[1].gmxProperties : li.parentNode.parentNode.childNodes[0].gmxProperties,
		listFlag;
	
	if (parentParams.content)
		listFlag = parentParams.content.properties.list;
	else
		listFlag = parentParams.properties.list;
	
	var box = $(li).children("div[MapID],div[GroupID],div[LayerID],div[MultiLayerID]")[0].firstChild,
		newBox,
		_this = this;
	
	if (listFlag)
		newBox = _checkbox(box.checked, 'radio', (parentParams.content) ? parentParams.content.properties.GroupID : parentParams.properties.MapID)
	else
		newBox = _checkbox(box.checked, 'checkbox', (parentParams.content) ? parentParams.content.properties.GroupID : parentParams.properties.MapID)
	
	newBox.className = 'box';
	if ($.browser.msie)
		newBox.style.margin = '-3px -2px 0px -2px';
	
	if (box.getAttribute('box') == 'group')
		newBox.setAttribute('box', 'group');
	
	$(box).replaceWith(newBox);
	
	newBox.onclick = function()
	{
		_this.visibilityFunc(this, this.checked, listFlag);
	}
	
	if ( box.isDummyCheckbox )
	{
		newBox.isDummyCheckbox = true;
		newBox.style.display = 'none';
	}
	
	if (typeof skipVisible == 'undefined')
	{
		if (listFlag)
			this.disableRadioGroups(newBox);
		
		this.updateMapLayersVisibility(newBox.parentNode.parentNode);
		
		if (newBox.parentNode.getAttribute('GroupID'))
			this.updateChildLayersMapVisibility(newBox.parentNode)
		
		this.updateTreeVisibility(newBox);
	//	this.visibilityFunc(newBox, newBox.checked, listFlag);
	}
	
	return newBox;
}

layersTree.prototype.updateMapLayersVisibility = function(li)
{
	var _this = this;
	
	$(li).find("div[LayerID],div[MultiLayerID]").each(function()
	{
		if (this.gmxProperties.content.properties.visible &&
			_this.getLayerVisibility(this.firstChild))
			globalFlashMap.layers[this.gmxProperties.content.properties.name].setVisible(true);
		else
			globalFlashMap.layers[this.gmxProperties.content.properties.name].setVisible(false);
	})
}

var _layersTree = new layersTree({showVisibilityCheckbox: true, allowActive: true, allowDblClick: true});
_layersTree.mapHelper = _mapHelper;

var queryMapLayers = function()
{
	this.buildedTree = null;
	this.builded = false;
	
	this.buttonsCanvas = _div();
}

queryMapLayers.prototype = new leftMenu();

queryMapLayers.prototype.addLayers = function(data, condition, mapStyles)
{
	if (condition)
		_layersTree.condition = condition;

	if (mapStyles)
		_layersTree.mapStyles = mapStyles;
			
	this.buildedTree = _layersTree.drawTree(data);
}

queryMapLayers.prototype.applyState = function(condition, mapLayersParam, div)
{
	if (!objLength(condition.visible) && !objLength(condition.expanded) && !objLength(mapLayersParam))
		return;

	var parentElem = typeof div == 'undefined' ? _mapHelper.mapTree : _mapHelper.findTreeElem(div).elem,
		visFlag = typeof div == 'undefined' ? true : _layersTree.getLayerVisibility(div.firstChild),
		_this = this;
	
	_mapHelper.findTreeElems(parentElem, function(elem, visibleFlag)
	{
		if (elem.type == 'group')
		{
			var groupId = elem.content.properties.GroupID;
			
			if (typeof condition.visible[groupId] != 'undefined' && elem.content.properties.visible != condition.visible[groupId])
			{
				elem.content.properties.visible = condition.visible[groupId];
				
				var group = $(_this.buildedTree).find("div[GroupID='" + groupId + "']");
				
				if (group.length)
					group[0].firstChild.checked = condition.visible[groupId];
			}
			
			if (typeof condition.expanded[groupId] != 'undefined' && elem.content.properties.expanded != condition.expanded[groupId])
			{
				elem.content.properties.expanded = condition.expanded[groupId];
				
				var group = $(_this.buildedTree).find("div[GroupID='" + groupId + "']");
				
				if (group.length)
				{
					var clickDiv = $(group[0].parentNode).children("div.hitarea");
					
					if (clickDiv.length)
						$(clickDiv[0]).trigger("click");
				}
			}
		}
		else
		{
			if (typeof condition.visible[elem.content.properties.name] != 'undefined' && elem.content.properties.visible != condition.visible[elem.content.properties.name])
			{
				elem.content.properties.visible = condition.visible[elem.content.properties.name];
				
				var layerProperties = globalFlashMap.layers[elem.content.properties.name].properties,
					layer = false;
				
				if (layerProperties.LayerID)
					layer = $(_this.buildedTree).find("div[LayerID='" + layerProperties.LayerID + "']");
				else
					layer = $(_this.buildedTree).find("div[MultiLayerID='" + layerProperties.MultiLayerID + "']");
				
				if (layer.length)
					layer[0].firstChild.checked = condition.visible[elem.content.properties.name];
			}
			
			if (elem.content.properties.type == "Vector" && typeof mapLayersParam != 'undefined' &&  typeof mapLayersParam[elem.content.properties.name] != 'undefined' &&
				!_this.equalStyles(elem.content.properties.styles, mapLayersParam[elem.content.properties.name]))
			{
				// что-то менялось в стилях
				var layerProperties = globalFlashMap.layers[elem.content.properties.name].properties,
					newStyles = mapLayersParam[elem.content.properties.name],
					div = $(_this.buildedTree).find("div[LayerID='" + layerProperties.LayerID + "']");
				
				elem.content.properties.styles = newStyles;
				
				if (!globalFlashMap.layers[elem.content.properties.name].objectId)
				{
					globalFlashMap.layers[elem.content.properties.name].setVisible(true);
					
					_mapHelper.updateMapStyles(newStyles, elem.content.properties.name, elem.content.properties);
					
					globalFlashMap.layers[elem.content.properties.name].setVisible(visibleFlag);
				}
				else
					_mapHelper.updateMapStyles(newStyles, elem.content.properties.name, elem.content.properties);
				
				if (div.length)
				{
					div = div[0];
					
					_mapHelper.updateTreeStyles(newStyles, div, true);
				}
			}
		}
	}, visFlag)
	
	var parentCanvas = typeof div == 'undefined' ? $(this.buildedTree.firstChild).children("[MapID]")[0] : div;
		
	_layersTree.updateChildLayersMapVisibility(parentCanvas)
}

queryMapLayers.prototype.equalStyles = function(style1, style2)
{
	if (style1.length != style2.length)
		return false;
	
	for (var i = 0; i < style1.length; i++)
		if (!equals(style1[i], style2[i]))
			return false;
	
	return true;
}

queryMapLayers.prototype.load = function(data)
{
	if (this.buildedTree && !this.builded)
	{
		var _this = this;

		this.treeCanvas = _div();
				
		_(this.workCanvas, [_table([_tbody([_tr([_td([_span([_t(_gtxt("Шкала прозрачности"))],[['css','marginLeft','10px'],['css','color','#153069'],['css','fontSize','12px']])]), _td([this.rasterLayersSlider(_queryMapLayers.treeCanvas)])])])])]);

		_(this.workCanvas, [this.treeCanvas]);
		
		_(this.treeCanvas, [this.buildedTree]);

		$(this.buildedTree).treeview();
		
		_layersTree.runLoadingFuncs();
		
		_layersTree.addExpandedEvents(this.buildedTree);
		
		this.applyState(_layersTree.condition, _layersTree.mapStyles);

		this.builded = true;
	}
}

queryMapLayers.prototype.rasterLayersSlider = function(parent)
{
	var templateStyle = {fill: {opacity: 100}},
		slider = nsGmx.Controls.createSlider(100,
			function(event, ui)
			{
				templateStyle.fill.opacity = ui.value;
				
				var active = $(parent).find(".active");
				
				// слой
				if (active[0] && active[0].parentNode.getAttribute("LayerID") && active[0].parentNode.gmxProperties.content.properties.type != "Vector")
				{
					globalFlashMap.layers[active[0].parentNode.gmxProperties.content.properties.name].setStyle(templateStyle);
					
					return;
				}
				// слой из списка
				else if (active[0] && (active[0].firstChild.type == "Raster" || active[0].firstChild.type == "Overlay"))
				{
					globalFlashMap.layers[active[0].firstChild.layerName].setStyle(templateStyle);
					
					return;
				}
				
				// группа или карта
				var treeElem = !active.length ? {elem:_mapHelper.mapTree, parents:[], index:false} : _mapHelper.findTreeElem(active[0].parentNode);
				
				_mapHelper.findChilds(treeElem.elem, function(child)
				{
					var props = child.content.properties;
					var layer = globalFlashMap.layers[props.name];
					if (props.type == "Raster" || props.type == "Overlay")
						layer.setStyle(templateStyle);
					else if (props.type == "Vector")
					{
						if (layer.shownQuicklooks)
							layer.shownQuicklooks.setStyle(templateStyle);
						if (layer.tilesParent)
							layer.tilesParent.setStyle(templateStyle);
					}
				}, true);
			}),
		elem = _div([slider], [['css','width','120px']]);
	
	slider.style.margin = '10px';
	slider.style.backgroundColor = '#F4F4F4';
		
	_title(slider, _gtxt("Прозрачность выбранного слоя/группы/карты"));
	
	return _div([elem],[['css','padding','5px 0px 0px 15px']]);
}

queryMapLayers.prototype.currentMapRights = function()
{
	return _mapHelper.mapProperties ? _mapHelper.mapProperties.Access : "none";
}

queryMapLayers.prototype.layerRights = function(name)
{
	return globalFlashMap.layers[name].properties.Access;
}

queryMapLayers.prototype.saveMap = function()
{
	$('#headerLinks').find("[savestatus]").remove();
	
	var loading = _img(null, [['attr','src','img/loader2.gif'],['attr','savestatus','true'],['css','margin','8px 0px 0px 10px']]);
	_($$('headerLinks'), [loading]);
	
	var saveMapInternal = function(newVersion)
	{
		_userObjects.collect();
		$(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.UserData = JSON.stringify(_userObjects.getData());
		
		for (var name in _mapHelper.layerEditorsHash)
			_mapHelper.layerEditorsHash[name] && _mapHelper.layerEditorsHash[name].closeFunc();
		
		var saveTree = {};
		
		$.extend(true, saveTree, _mapHelper.mapTree)
		// закрываем все группы
		_mapHelper.findTreeElems(saveTree, function(child, flag)
		{
			if (child.type == "group")
				child.content.properties.expanded = false;
		}, true);
		
		sendCrossDomainPostRequest(serverBase + "Map/SaveMap.ashx", 
									{
										WrapStyle: 'window',
										MapID: String($(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.MapID), 

										MapJson: JSON.stringify(saveTree)
									}, 
									function(response)
									{
										if (!parseResponse(response))
											return;
										
										_mapHelper.mapProperties.Version = newVersion + 1;
										
										_mapHelper.updateUnloadEvent(false);
										
										_layersTree.showSaveStatus($$('headerLinks'));
									})
	}
	
	sendCrossDomainJSONRequest(serverBase + "Map/GetMapVersion.ashx?WrapStyle=func&MapName=" + _mapHelper.mapProperties.name, function(response)
	{
		if (!parseResponse(response))
		{
			loading.removeNode(true);
			
			return;
		}
		
		if (response.Result > _mapHelper.mapProperties.Version)
		{
			if (confirm(_gtxt("Карта имеет более новую версию. Сохранить?")))
				saveMapInternal(response.Result);
			else
				loading.removeNode(true);
		}
		else
			saveMapInternal(response.Result);
	})
}

queryMapLayers.prototype.addUserActions = function()
{
	if (this.currentMapRights() == "edit")
	{
		this.addDraggable(this.treeCanvas);
		
		this.addDroppable(this.treeCanvas);
		
		this.addSwappable(this.treeCanvas);
	}
}

queryMapLayers.prototype.removeUserActions = function()
{
//	removeChilds(this.buttonsCanvas);
	
	this.removeDraggable(this.treeCanvas);
	
	this.removeDroppable(this.treeCanvas);
	
	this.removeSwappable(this.treeCanvas);
}

queryMapLayers.prototype.addDraggable = function(parent)
{
	$(parent).find("span[dragg]").draggable(
	{
		helper: function(ev)
		{
			return _layersTree.dummyNode(ev.target)
		},
		cursorAt: { left: 5 , top: 10},
		appendTo: document.body
	});
}
queryMapLayers.prototype.removeDraggable = function(parent)
{
	$(parent).find("span[dragg]").draggable('destroy');
}

queryMapLayers.prototype.addDroppable = function(parent)
{
	$(parent).find("div[GroupID],div[MapID]").droppable({accept: "span[dragg]", hoverClass: 'droppableHover', drop: function(ev, ui)
	{
		$('body').css("cursor", '');
		
		// удалим элемент, отображающий копирование
		ui.helper[0].removeNode(true)
		
		// уберем заведомо ложные варианты - сам в себя, копирование условий
		if (this == ui.draggable[0].parentNode.parentNode) return;
		
		var circle = false,
			layerManager = false;
			
		$(this).parents().each(function()
		{
			if ($(this).prev().length > 0 && $(this).prev()[0] == ui.draggable[0].parentNode.parentNode)
				circle = true;
		})
			
		if (circle) return;
			
        var isFromExternalMaps = false;
		$(ui.draggable[0].parentNode.parentNode).parents().each(function()
		{
			if (this == $$('layersList') || this == $$('mapsList') || this == $$('externalMapsCanvas') )
				layerManager = true;
                
            if ( this == $$('externalMapsCanvas') )
                isFromExternalMaps = true;
		})
		
		if (!layerManager)
			_layersTree.moveHandler(ui.draggable[0], this)
		else				
			_layersTree.copyHandler(ui.draggable[0], this, false, !isFromExternalMaps)
	}})
}
queryMapLayers.prototype.removeDroppable = function(parent)
{
	$(parent).find("div[GroupID],div[MapID]").droppable('destroy');
}

queryMapLayers.prototype.addSwappable = function(parent)
{
	$(parent).find("div[swap]").droppable({accept: "span[dragg]", hoverClass: 'swap-droppableHover', drop: function(ev, ui)
	{
		$('body').css("cursor", '');
		
		// удалим элемент, отображающий копирование
		ui.helper[0].removeNode(true);
        
        //проверим, не идёт ли копирование группы внутрь самой себя
		var circle = false;
			
		$(this).parents().each(function()
		{
			if ($(this).prev().length > 0 && $(this).prev()[0] == ui.draggable[0].parentNode.parentNode)
				circle = true;
		})
        
        if (circle) return;
		
		var layerManager = false;
		
        var isFromExternalMaps = false;
		$(ui.draggable[0].parentNode.parentNode).parents().each(function()
		{
			if ( this == $$('layersList') || this == $$('mapsList') || this == $$('externalMapsCanvas') )
				layerManager = true;
                
            if ( this == $$('externalMapsCanvas') )
                isFromExternalMaps = true;
		})
		
		if (!layerManager)
			_layersTree.swapHandler(ui.draggable[0], this)
		else
			_layersTree.copyHandler(ui.draggable[0], this, true, !isFromExternalMaps)
	}})
}
queryMapLayers.prototype.removeSwappable = function(parent)
{
	$(parent).find("div[swap]").droppable('destroy');
}

queryMapLayers.prototype.asyncCreateLayer = function(taskInfo, title)
{
	if (taskInfo.ErrorInfo)
	{
		taskInfo.Status = 'error';
		
		parseResponse(taskInfo);
		
		return;
	}
	
	if (!taskInfo.Completed)
	{
		var taskDiv;
		
		if (!$$(taskInfo.TaskID))
		{
			taskDiv = _div(null, [['attr','id',taskInfo.TaskID]]);
			
			var active = $(this.buildedTree).find(".active");
			
			if (active.length && (active[0].parentNode.getAttribute('MapID') || active[0].parentNode.getAttribute('GroupID')))
				_abstractTree.addNode(active[0].parentNode.parentNode, _li([taskDiv, _div(null,[['css','height','5px'],['css','fontSize','0px']])]));
			else
				_abstractTree.addNode(this.buildedTree.firstChild, _li([taskDiv, _div(null,[['css','height','5px'],['css','fontSize','0px']])]));
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
				
				_queryMapLayers.asyncCreateLayer(response.Result, title)
			});
		}, 2000)
	}
	else
	{
		delete _mapHelper.asyncTasks[taskInfo.TaskID];
		
		var newLayerProperties = taskInfo.Result.properties;
		
		newLayerProperties.mapName = _mapHelper.mapProperties.name;
		newLayerProperties.hostName = _mapHelper.mapProperties.hostName;
		newLayerProperties.visible = true;
		
		if (!newLayerProperties.styles)
		{
			if (newLayerProperties.type == 'Vector')
				newLayerProperties.styles = [{MinZoom:newLayerProperties.MaxZoom, MaxZoom:21, RenderStyle:_mapHelper.defaultStyles[newLayerProperties.GeometryType]}]
			else if (newLayerProperties.type != 'Vector' && !newLayerProperties.MultiLayerID)
				newLayerProperties.styles = [{MinZoom:newLayerProperties.MinZoom, MaxZoom:21}];
		}
		
		var convertedCoords = from_merc_geometry(taskInfo.Result.geometry);

		_layersTree.addLayersToMap({content:{properties:newLayerProperties, geometry:convertedCoords}});
		
		var newLayer = globalFlashMap.layers[newLayerProperties.name],
			parentDiv = $($$(taskInfo.TaskID).parentNode.parentNode.parentNode).children("div[GroupID],div[MapID]")[0];
			parentProperties = parentDiv.gmxProperties,
			li = _layersTree.getChildsList({type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}}, parentProperties, false, parentDiv.getAttribute('MapID') ? true : _layersTree.getLayerVisibility(parentDiv.firstChild));
		
		if ($($$(taskInfo.TaskID).parentNode).hasClass("last"))
			$(li).addClass("last");
		
		$($$(taskInfo.TaskID).parentNode).replaceWith(li);
		
		var divElem = $(li).children("div[LayerID]")[0],
			divParent = $(li.parentNode.parentNode).children("div[MapID],div[GroupID]")[0],
			index = _mapHelper.findTreeElem(divElem).index;
	
		_mapHelper.addTreeElem(divParent, index, {type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}});
		
		//_layersTree.showInfo(newLayer)

		_queryMapLayers.addSwappable(li);
		
		_queryMapLayers.addDraggable(li);

		_layersTree.updateListType(li);
		
		_mapHelper.updateUnloadEvent(true);
	}
}

queryMapLayers.prototype.asyncUpdateLayer = function(taskInfo, properties, needRetiling)
{
	if (taskInfo.ErrorInfo)
	{
		taskInfo.Status = 'error';
		
		parseResponse(taskInfo);
		
		return;
	}
	
	if (!taskInfo.Completed)
	{
		var taskDiv;
		
		if (!$$(taskInfo.TaskID))
		{
			taskDiv = _div(null, [['attr','id',taskInfo.TaskID]]);
			
			var layerDiv = $(_queryMapLayers.buildedTree).find("[LayerID='" + properties.LayerID + "']")[0];
			
			layerDiv.style.display = 'none';
			
			$(layerDiv).before(taskDiv);
		}
		else
		{
			taskDiv = $$(taskInfo.TaskID);
			
			removeChilds(taskDiv);
		}
		
		_(taskDiv, [_span([_t(properties.Title + ':')], [['css','color','#153069'],['css','margin','0px 3px']]), _t(taskInfo.Status)])	
		
		setTimeout(function()
		{
			sendCrossDomainJSONRequest(serverBase + "AsyncTask.ashx?WrapStyle=func&TaskID=" + taskInfo.TaskID, function(response)
			{
				if (!parseResponse(response))
					return;
				
				_queryMapLayers.asyncUpdateLayer(response.Result, properties, needRetiling)
			});
		}, 2000)
	}
	else
	{
		delete _mapHelper.asyncTasks[taskInfo.TaskID];
		
		if (needRetiling)
		{
			var newLayerProperties = taskInfo.Result.properties,
				layerDiv = $(_queryMapLayers.buildedTree).find("[LayerID='" + properties.LayerID + "']")[0];
			
			newLayerProperties.mapName = _mapHelper.mapProperties.name;
			newLayerProperties.hostName = _mapHelper.mapProperties.hostName;
			newLayerProperties.visible = layerDiv.gmxProperties.content.properties.visible;
			
			newLayerProperties.styles = layerDiv.gmxProperties.content.properties.styles;
			
			var convertedCoords = from_merc_geometry(taskInfo.Result.geometry);
			
			this.removeLayer(newLayerProperties.name);
			
			_layersTree.addLayersToMap({content:{properties:newLayerProperties, geometry:convertedCoords}});
			
			var newLayer = globalFlashMap.layers[newLayerProperties.name],
				parentProperties = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0].gmxProperties,
				li = _layersTree.getChildsList({type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}}, parentProperties, false, _layersTree.getLayerVisibility(layerDiv.firstChild));
			
				$(layerDiv.parentNode).replaceWith(li);
				
				_mapHelper.findTreeElem($(li).children("div[LayerID]")[0]).elem = {type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}}				

				_queryMapLayers.addSwappable(li);
				
				_queryMapLayers.addDraggable(li);

				_layersTree.updateListType(li);		
		}
		else
		{
			$$(taskInfo.TaskID).removeNode(true);
		
			var layerDiv = $(_queryMapLayers.buildedTree).find("[LayerID='" + properties.LayerID + "']")[0];
				
			layerDiv.style.display = '';
		}
	}
}

queryMapLayers.prototype.removeLayer = function(name)
{
    if ( typeof globalFlashMap.layers[name] !== 'undefined' )
        globalFlashMap.layers[name].remove();
}

queryMapLayers.prototype.getLayers = function()
{
	if (!$$('layersList'))
		sendCrossDomainJSONRequest(serverBase + "Layer/GetLayers.ashx?WrapStyle=func", this.getLayersHandler)
}

queryMapLayers.prototype.getLayersHandler = function(response)
{
	if (!parseResponse(response))
		return;
	
	_queryMapLayers.layersList = response.Result.Layers.concat(response.Result.MultiLayers);

	_queryMapLayers.createLayersManager();
}

/** 
Внутри контейнера помещает табличку со списком слоёв и контролами для фильтрации
 @param {HTMLNode} parentDiv Куда помещать контрол
 @param {String} name Уникальное имя этого инстанса
 @param {object} params Параметры отображения списка: <br/>
  * showType <br/>
  * enableDragging <br/>
  * onclick {function({ elem: , scrollTable: })}
 @returns {scrollTable} Контрол со списком слоёв
*/
queryMapLayers.prototype._createLayersManagerInDiv = function( parentDiv, name, params )
{
	var _params = $.extend({showType: true}, params);
	var canvas = _div(null, [['attr','id','layersList']]),
		searchCanvas = _div(null, [['dir','className','searchCanvas']]),
		_this = this;
	
	var layerName = _input(null, [['dir','className','inputStyle'],['css','width','160px']]),
		layerOwner = _input(null, [['dir','className','inputStyle'],['css','width','160px']]);
	
	var dateBegin = _input(null,[['attr','id', name + 'DateBegin'],['dir','className','inputStyle'],['css','width','100px']]),
		dateEnd = _input(null,[['attr','id', name + 'DateEnd'],['dir','className','inputStyle'],['css','width','100px']]);
	
	
	var typeSel = _select([_option([_t(_gtxt("Любой"))], [['attr','value','']]),
					   _option([_t(_gtxt("Векторный"))], [['attr','value','Vector']]),
					   _option([_t(_gtxt("Растровый"))], [['attr','value','Raster']]),
					   _option([_t(_gtxt("Мультислой"))], [['attr','value','MultiLayer']])], [['dir','className','selectStyle'], ['css','width','100px']]);
					   
	_(searchCanvas, [_div([_table([_tbody([_tr([_td([_span([_t(_gtxt("Название"))],[['css','fontSize','12px']])],[['css','width','90px']]), _td([layerName],[['css','width','170px']]),_td([_span([_t(_gtxt("Начало периода"))],[['css','fontSize','12px']])],[['css','width','120px']]), _td([dateBegin])]),
										   _tr([_td([_span([_t(_gtxt("Владелец"))],[['css','fontSize','12px']])]),_td([layerOwner]), _td([_span([_t(_gtxt("Окончание периода"))],[['css','fontSize','12px']])]), _td([dateEnd])]),
										   _tr([_td([_span([_t(_gtxt("Тип"))],[['css','fontSize','12px']])]), _td([typeSel]), _td(), _td()])])],[['css','width','100%']])], [['css','marginBottom','10px']])]);
										   
	if (!_params.showType) 
		$("tr:last", searchCanvas).hide();
	
	_(canvas, [searchCanvas]);
	
	dateBegin.onfocus = dateEnd.onfocus = function()
	{
		try
		{
			this.blur();
		}
		catch(e){}
	}
	
	var tableParent = _div(),
		sortFuncs = {};
	
	sortFuncs[_gtxt('Имя')] = [
				function(a,b){if (a._sort_title > b._sort_title) return 1; else if (a._sort_title < b._sort_title) return -1; else return 0},
				function(a,b){if (a._sort_title < b._sort_title) return 1; else if (a._sort_title > b._sort_title) return -1; else return 0}
			];
			
	if (_params.showType)
	{
		sortFuncs[_gtxt('Тип')] = [
					function(a,b){if (a._sort_type > b._sort_type) return 1; else if (a._sort_type < b._sort_type) return -1; else return 0},
					function(a,b){if (a._sort_type < b._sort_type) return 1; else if (a._sort_type > b._sort_type) return -1; else return 0}
				];
	}
	sortFuncs[_gtxt('Владелец')] = [
				function(a,b){if (a._sort_Owner > b._sort_Owner) return 1; else if (a._sort_Owner < b._sort_Owner) return -1; else return 0},
				function(a,b){if (a._sort_Owner < b._sort_Owner) return 1; else if (a._sort_Owner > b._sort_Owner) return -1; else return 0}
			];
	sortFuncs[_gtxt('Дата')]  = [
				function(a,b)
				{
					if (!a._sort_date || !b._sort_date)
						return 0;
					
					if (a._sort_date > b._sort_date) return 1; else if (a._sort_date < b._sort_date) return -1; else return 0;				
				},
				function(a,b)
				{
					if (!a._sort_date || !b._sort_date)
						return 0;
					
					if (b._sort_date > a._sort_date) return 1; else if (b._sort_date < a._sort_date) return -1; else return 0;
				}
			];
	
	_layersTable.createTable(tableParent, name, 0, 
		["", _gtxt("Тип"), _gtxt("Имя"), _gtxt("Дата"), _gtxt("Владелец"), ""], 
		['1%','5%','45%','24%','20%','5%'], 
		function(layer)
		{
			return _this.drawLayers.apply(this, [layer, _params]);
		}, 
		sortFuncs
	);
	
	// оптимизируем данные для сортировки
	var valuesToSort = [];
	
	for (var i = 0; i < _queryMapLayers.layersList.length; i++)
	{
		var val = _queryMapLayers.layersList[i];
		
		val._sort_title = val['title'] ? String(val['title']).toLowerCase() : false;
		if (_params.showType)
			val._sort_type = val['type'] ? val['type'] : false;
		val._sort_Owner = val['Owner'] ? String(val['Owner']).toLowerCase() : false;
		val._sort_date = val['date'] || false;
		
		if (val._sort_date)
		{
			var dateParts = val['date'].split('.');
			
			if (dateParts.length != 3)
				val._sort_date = false;
			else
				val._sort_date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]).valueOf();
		}
		
		valuesToSort.push(val)
	}
	
	var inputPredicate = function(value, fieldName, fieldValue)
		{
			if (!value[fieldName])
				return false;
			
			return String(value[fieldName]).toLowerCase().indexOf(fieldValue.toLowerCase()) > -1;
		},
		selectPredicate = function(value, fieldName, fieldValue)
		{
			return fieldValue == value['_sort_type'];
		},
		beginDatePredicate = function(value, fieldName, fieldValue, beginDate, endDate)
		{
			var valueDate = value['_sort_date'];
			
			if (!valueDate)
				return false;
			
			if (endDate)
				return valueDate >= beginDate && valueDate <= endDate;
			else
				return valueDate >= beginDate;
		},
		endDatePredicate = function(value, fieldName, fieldValue, beginDate, endDate)
		{
			var valueDate = value['_sort_date'];
			
			if (!valueDate)
				return false;
			
			if (beginDate)
				return valueDate >= beginDate && valueDate <= endDate;
			else
				return valueDate <= endDate;
		};
	
	_layersTable.getDataProvider().attachFilterEvents(layerName, 'title', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var filterFunc = function(value)
				{
					return inputPredicate(value, fieldName, fieldValue);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
	
	_layersTable.getDataProvider().attachFilterEvents(layerOwner, 'Owner', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var filterFunc = function(value)
				{
					return inputPredicate(value, fieldName, fieldValue);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
	
	_layersTable.getDataProvider().attachFilterEvents(dateBegin, 'DateBegin', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var beginDate = $(dateBegin).datepicker('getDate'),
			endDate = $(dateEnd).datepicker('getDate'),
			filterFunc = function(value)
				{
					return beginDatePredicate(value, fieldName, fieldValue, beginDate ? beginDate.valueOf() : null, endDate ? endDate.valueOf() : null);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
		
	_layersTable.getDataProvider().attachFilterEvents(dateEnd, 'DateEnd', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var beginDate = $(dateBegin).datepicker('getDate'),
			endDate = $(dateEnd).datepicker('getDate'),
			filterFunc = function(value)
				{
					return endDatePredicate(value, fieldName, fieldValue, beginDate ? beginDate.valueOf() : null, endDate ? endDate.valueOf() : null);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
	
	if (_params.showType)
	{
		_layersTable.getDataProvider().attachSelectFilterEvents(typeSel, 'type', function(fieldName, fieldValue, vals)
		{
			if (fieldValue == "")
				return vals;
			
			var filterFunc = function(value)
					{
						return selectPredicate(value, fieldName, fieldValue);
					},
				local = _filter(filterFunc, vals);
			
			return local;
		})
	}
	
	_(canvas, [tableParent]);
	
	var unloadedLayersList = _filter(function(elem)
		{
			return typeof globalFlashMap.layers[elem.name] == 'undefined';
		}, valuesToSort);
	
	_layersTable.getDataProvider().setOriginalItems(unloadedLayersList);
	
	$("#" + name + "DateBegin,#" + name + "DateEnd", canvas).datepicker(
	{
		beforeShow: function(input)
		{
	    	return {minDate: (input == dateEnd ? $(dateBegin).datepicker("getDate") : null), 
	        	maxDate: (input == dateBegin ? $(dateEnd).datepicker("getDate") : null)}; 
		},
		onSelect: function(dateText, inst) 
		{
			inst.input[0].onkeyup();
		},
		changeMonth: true,
		changeYear: true,
		showOn: "button",
		buttonImage: "img/calendar.png",
		buttonImageOnly: true,
		dateFormat: "dd.mm.yy"
	});
		
	$(parentDiv).empty().append(canvas);
	
	layerName.focus();
    
    return _layersTable;
}

queryMapLayers.prototype.createLayersManager = function()
{
	var canvas = _div();
	this._createLayersManagerInDiv(canvas, 'layers');
	showDialog(_gtxt("Список слоев"), canvas, 571, 470, 535, 130);
}

queryMapLayers.prototype.drawLayers = function(layer, params)
{
	var _params = $.extend({onclick: function(){ removeLayerFromList(); }, enableDragging: true}, params);
	var newLayerProperties = {properties:layer};
	
	newLayerProperties.properties.mapName = _mapHelper.mapProperties.name;
	newLayerProperties.properties.hostName = _mapHelper.mapProperties.hostName;
	newLayerProperties.properties.visible = false;
	
	if (newLayerProperties.properties.type == 'Vector')
		newLayerProperties.properties.styles = [{MinZoom:newLayerProperties.properties.MinZoom, MaxZoom:20, RenderStyle:_mapHelper.defaultStyles[newLayerProperties.properties.GeometryType]}]
	else if (newLayerProperties.properties.type != 'Vector' && !newLayerProperties.properties.MultiLayerID)
		newLayerProperties.properties.styles = [{MinZoom:newLayerProperties.properties.MinZoom, MaxZoom:20}];
	
	var res = _layersTree.drawNode({type: 'layer', content:newLayerProperties}, false, 1),
		icon = res.firstChild.cloneNode(true),
		remove = makeImageButton("img/recycle.png", "img/recycle_a.png"),
		tr,
		tdRemove = (layer.Access == 'edit') ? _td([remove], [['css','textAlign','center']]) : _td(),
		removeLayerFromList = function()
		{
			if (tr)
				tr.removeNode(true);
			
            _this.getDataProvider().filterOriginalItems(function(elem)
			{
				return elem.name != layer.name;
			});
			
			var active = $(_this.buildedTree).find(".active");
			
			if (active.length && (active[0].parentNode.getAttribute('MapID') || active[0].parentNode.getAttribute('GroupID')))
				_layersTree.copyHandler($(res).find("span[dragg]")[0], active[0].parentNode, false, true)
			else
				_layersTree.copyHandler($(res).find("span[dragg]")[0], $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0], false, true)
		},
		_this = this;
	
	_title(remove, _gtxt("Удалить"));
	
	res.firstChild.removeNode(true);
	
	remove.onclick = function()
	{
		if (confirm(_gtxt("Вы действительно хотите удалить этот слой?")))
		{
			var loading = loading = _div([_img(null, [['attr','src','img/progress.gif']]), _t('удаление...')], [['css','marginLeft','5px']]);
		
			$(remove.parentNode.parentNode).replaceWith(_tr([_td([loading], [['attr','colSpan', 5]])]))
			
			if (newLayerProperties.properties.MultiLayerID)
				sendCrossDomainJSONRequest(serverBase + "MultiLayer/Delete.ashx?WrapStyle=func&MultiLayerID=" + newLayerProperties.properties.MultiLayerID, function(response){_queryMapLayers.deleteLayerHandler(response, newLayerProperties.properties.MultiLayerID, true)});
			else	
				sendCrossDomainJSONRequest(serverBase + "Layer/Delete.ashx?WrapStyle=func&LayerID=" + newLayerProperties.properties.LayerID, function(response){_queryMapLayers.deleteLayerHandler(response, newLayerProperties.properties.LayerID)});
		}
	}
	
	var span = $(res).find("span.layer")[0];
	
	if (_params.onclick)
	{
		span.onclick = function()
		{
			_params.onclick({ elem: layer, scrollTable: _this });
		}
	}
	
	if (_params.enableDragging)
	{
		$(res).find("span[dragg]").draggable(
		{
			helper: function(ev)
			{
				return _layersTree.dummyNode(ev.target)
			},
			cursorAt: { left: 5 , top: 10},
			cursor: 'move',
			delay: 200,
			appendTo: document.body
		});
	}
	
	var nameDivInternal = _div([res], [['css','position','absolute'], ['css','width','100%'],['css','padding',"1px 0px"], ['css','overflowX','hidden'],['css','whiteSpace','nowrap']]);
	var nameDiv = _div([nameDivInternal], [['css', 'position', 'relative'], ['css', 'height', '100%']]);
	
	tr = _tr([_td(), _td([icon], [['css','textAlign','center']]), _td([nameDiv]), _td([_t(layer.date)], [['css','textAlign','center'],['dir','className','invisible']]),  _td([_t(layer.Owner)], [['css','textAlign','center'],['dir','className','invisible']]), tdRemove]);
	
	tr.removeLayerFromList = removeLayerFromList;
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this.fieldsWidths[i];
	
	attachEffects(tr, 'hover')
	
	return tr;
}

queryMapLayers.prototype.deleteLayerHandler = function(response, id, flag)
{
	if (!parseResponse(response))
		return;
	
	if (response.Result == 'deleted')
	{
        _layersTable.start = 0;
		_layersTable.reportStart = _layersTable.start * _layersTable.limit;
        _layersTable.getDataProvider().filterOriginalItems(function(elem)
		{
			if (typeof flag != 'undefined' && flag)
				return elem.MultiLayerID != id;
			else
				return elem.LayerID != id;
		});
	}
	else
		showErrorMessage(_gtxt("Ошибка!"), true, "Слоя нет в базе")
}

queryMapLayers.prototype.getMaps = function()
{
	if (!$$('mapsList'))
		sendCrossDomainJSONRequest(serverBase + "Map/GetMaps.ashx?WrapStyle=func", this.getMapsHandler)
}

queryMapLayers.prototype.getMapsHandler = function(response)
{
	if (!parseResponse(response))
		return;
	
	_queryMapLayers.mapsList = response.Result;

	_queryMapLayers.createMapsManager();
}

queryMapLayers.prototype.createMapsManager = function()
{
	var canvas = _div(null, [['attr','id','mapsList']]),
		searchCanvas = _div(null, [['dir','className','searchCanvas']]),
		name = 'maps',
		_this = this;
	
	this.mapName = _input(null, [['dir','className','inputStyle'],['css','width','160px']]);
	this.mapOwner = _input(null, [['dir','className','inputStyle'],['css','width','160px']]);
	
	_(searchCanvas, [_div([_table([_tbody([_tr([_td([_span([_t(_gtxt("Название"))],[['css','fontSize','12px']])],[['css','width','90px']]), _td([this.mapName],[['css','width','170px']]),_td([_span([_t(_gtxt("Владелец"))],[['css','fontSize','12px']])],[['css','width','92px']]), _td([this.mapOwner])])])],[['css','width','100%']])], [['css','marginBottom','10px']])]);
	
	_(canvas, [searchCanvas]);
	
	var tableParent = _div(),
		sortFuncs = {};
			
	var sign = function(n1, n2) { return n1 < n2 ? -1 : (n1 > n2 ? 1 : 0) };
	var sortFuncFactory = function(toNumFunc)
	{
		return [
			function(_a,_b){ return sign(toNumFunc(_a), toNumFunc(_b)); },
			function(_a,_b){ return sign(toNumFunc(_b), toNumFunc(_a)); }
		]
	}
	
	sortFuncs[_gtxt('Имя')]                 = sortFuncFactory(function(_a){ return String(_a.Title).toLowerCase(); });
	sortFuncs[_gtxt('Владелец')]            = sortFuncFactory(function(_a){ return String(_a.Owner).toLowerCase(); });
	sortFuncs[_gtxt('Последнее изменение')] = sortFuncFactory(function(_a){ return _a.LastModificationDateTime });
	
	_mapsTable.createTable(tableParent, name, 410, ["", "", _gtxt("Имя"), _gtxt("Владелец"), _gtxt("Последнее изменение"), ""], ['5%', '5%', '55%', '15%', '15%', '5%'], this.drawMaps, sortFuncs);
	
	var inputPredicate = function(value, fieldName, fieldValue)
		{
			if (!value[fieldName])
				return false;
		
			return String(value[fieldName]).toLowerCase().indexOf(fieldValue.toLowerCase()) > -1;
		};
	
	_mapsTable.getDataProvider().attachFilterEvents(this.mapName, 'Title', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var filterFunc = function(value)
				{
					return inputPredicate(value, fieldName, fieldValue) || inputPredicate(value, 'Name', fieldValue);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
	
	_mapsTable.getDataProvider().attachFilterEvents(this.mapOwner, 'Owner', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var filterFunc = function(value)
				{
					return inputPredicate(value, fieldName, fieldValue);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})

	_(canvas, [tableParent]);
	
	this.mapPreview = _div(null, [['css','marginTop','5px'],['css','borderTop','1px solid #216B9C'],['css','overflowY','auto']]);
	
	_(canvas, [this.mapPreview]);
	
	var resize = function()
	{
		_mapsTable.tableParent.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';
		_mapsTable.tableBody.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 15 - 21 + 'px';
		_mapsTable.tableBody.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';

		_mapsTable.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 12 - 21 + 'px';

		_mapsTable.tableParent.style.height = '200px';
		_mapsTable.tableBody.parentNode.parentNode.style.height = '170px';
		
		_this.mapPreview.style.height = canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - 250 + 'px';
		_this.mapPreview.style.width = canvas.parentNode.parentNode.offsetWidth - 15 - 21 + 'px';
	}
		
	showDialog(_gtxt("Список карт"), canvas, 571, 470, 535, 130, resize);
	
	_mapsTable.tableHeader.firstChild.childNodes[1].style.textAlign = 'left';

	resize();
	
	_mapsTable.getDataProvider().setOriginalItems(_queryMapLayers.mapsList);	
	
	this.mapName.focus();
}

queryMapLayers.prototype.drawMaps = function(map)
{
	var name = makeLinkButton(map.Title),
		load = makeImageButton("img/choose.png", "img/choose_a.png"),
		addExternal = makeImageButton("img/prev.png", "img/prev_a.png"),
		remove = makeImageButton("img/recycle.png", "img/recycle_a.png");
	
	_title(name, _gtxt("Загрузить"));
	_title(load, _gtxt("Показать"));
	_title(addExternal, _gtxt("Добавить"));
	_title(remove, _gtxt("Удалить"));
	
	name.style.textDecoration = 'none';
	
	name.onclick = function()
	{
		window.location.replace(window.location.href.split(/\?|#/)[0] + "?" + map.Name);
	}
	
	load.onclick = function()
	{
		removeChilds(_queryMapLayers.mapPreview);
		
		var loading = _div([_img(null, [['attr','src','img/progress.gif'],['css','marginRight','10px']]), _t(_gtxt('загрузка...'))], [['css','margin','3px 0px 3px 20px']]);
		
		_(_queryMapLayers.mapPreview, [loading]);
		
		
		//_queryMapLayers.loadMapJSON(_mapHelper.mapProperties.hostName, map.Name, _queryMapLayers.mapPreview)
		
		// раз уж мы список получили с сервера, то и карты из этого списка точно нужно загружать с него же...
		_queryMapLayers.loadMapJSON(window.serverBase, map.Name, _queryMapLayers.mapPreview); 
	}
	
	addExternal.onclick = function()
	{
		_queryExternalMaps.addMapElem(_mapHelper.mapProperties.hostName, map.Name)
	}
	
	remove.onclick = function()
	{
		if (map.Name == defaultMapID)
		{
			showErrorMessage(_gtxt("$$phrase$$_14"), true)
			
			return;
		}
		
		if (map.Name == globalMapName)
		{
			showErrorMessage(_gtxt("$$phrase$$_15"), true)
			
			return;
		}
		
		if (confirm(_gtxt("Вы действительно хотите удалить эту карту?")))
		{
			var loading = loading = _div([_img(null, [['attr','src','img/progress.gif']]), _t(_gtxt('удаление...'))], [['css','marginLeft','5px']]);
		
			$(remove.parentNode.parentNode).replaceWith(_tr([_td([loading], [['attr','colSpan', 5]])]))
			
			sendCrossDomainJSONRequest(serverBase + "Map/Delete.ashx?WrapStyle=func&MapID=" + map.MapID, function(response){_queryMapLayers.deleteMapHandler(response, map.MapID)});
		}
	}
	
	var date = new Date(map.LastModificationDateTime*1000);
	var modificationDateString = $.datepicker.formatDate('dd.mm.yy', date); // + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
	
	var tr = _tr([
		_td([addExternal], [['css','textAlign','center']]), 
		_td([load], [['css','textAlign','center']]), 
		_td([name]), 
		_td([_t(map.Owner)], [['css','textAlign','center'],['dir','className','invisible']]), 
		_td([_t(modificationDateString)], [['css','textAlign','center'],['dir','className','invisible']]), 
		_td([remove], [['css','textAlign','center']])
	]);
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this.fieldsWidths[i];
	
	attachEffects(tr, 'hover')
	
	return tr;
}

queryMapLayers.prototype.deleteMapHandler = function(response, id)
{
	if (!parseResponse(response))
		return;
	
	if (response.Result == 'deleted')
	{
        _mapsTable.start = 0;
		_mapsTable.reportStart = _mapsTable.start * _mapsTable.limit;
        _mapsTable.getDataProvider().filterOriginalItems(function(elem)
		{
			return elem.MapID != id;
		});
	}
	else
		showErrorMessage(_gtxt("Ошибка!"), true, _gtxt("Слоя нет в базе"))
}

queryMapLayers.prototype.loadMapJSON = function(host, name, parent)
{
	var _this = this;
	
	loadMapJSON(host, name, function(layers)
	{
		var previewMapHelper = new mapHelper();
        var previewLayersTree = new layersTree({showVisibilityCheckbox: false, allowActive: false, allowDblClick: false});
		
		previewMapHelper.mapTree = layers;
		previewLayersTree.mapHelper = previewMapHelper;
        
        var ul = previewLayersTree.drawTree(layers, 2);
        // var ul = _layersTree.drawTree(layers, 2);
		
		$(ul).treeview();
		
	//	_layersTree.runLoadingFuncs();
		
		removeChilds(parent);

		_(parent, [ul])
		
		_this.addDraggable(parent);
	})
}

queryMapLayers.prototype.createMapDialog = function(title, buttonName, func, addLink)
{
	var input = _input(null, [['attr','value', ''],['css','margin','10px 10px 15px 10px'],['dir','className','inputStyle'],['css','width','220px']]),
		button = makeButton(buttonName),
		inputError = function()
		{
			$(input).addClass('error');
			
			setTimeout(function()
			{
				if (input)
					$(input).removeClass('error');
			}, 1000)
		},
		canvas = _div([input, button],[['css','textAlign','center']]);
		_this = this;
	
	input.onkeydown = function(e)
	{
		var evt = e || window.event;
	  	if (getkey(evt) == 13) 
	  	{
	  		if (input.value != '')
	  		{
				func(input.value);
				
				$(canvas.parentNode).dialog("destroy")
				canvas.parentNode.removeNode(true);
			}
			else
				inputError();
	  		
	  		return false;
	  	}
	}
	
	button.onclick = function()
	{
		if (input.value != '')
		{
			func(input.value);
			
			$(canvas.parentNode).dialog("destroy")
			canvas.parentNode.removeNode(true);
		}
		else
			inputError();
	}
	
	if (addLink)
		_(canvas, [addLink]);
	
	showDialog(title, canvas, 280, 110 + (addLink ? 20 : 0), false, false);
	
	canvas.parentNode.style.overflow = 'hidden';
}

queryMapLayers.prototype.createMap = function(name)
{
	sendCrossDomainJSONRequest(serverBase + 'Map/Insert.ashx?WrapStyle=func&Title=' + name, function(response)
	{
		if (!parseResponse(response))
			return;
		
		window.location.replace(window.location.href.split(/\?|#/)[0] + "?" + response.Result);
	})
}

queryMapLayers.prototype.saveMapAs = function(name)
{
	$('#headerLinks').find("[savestatus]").remove();
	
	var loading = _img(null, [['attr','src','img/loader2.gif'],['attr','savestatus','true'],['css','margin','8px 0px 0px 10px']]);
	_($$('headerLinks'), [loading]);
	
	_userObjects.collect();
	$(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.UserData = JSON.stringify(_userObjects.getData());
	
	for (var name in _mapHelper.layerEditorsHash)
		_mapHelper.layerEditorsHash[name] && _mapHelper.layerEditorsHash[name].closeFunc();
	
	var saveTree = {};
	
	$.extend(true, saveTree, _mapHelper.mapTree)
	// закрываем все группы
	_mapHelper.findTreeElems(saveTree, function(child, flag)
	{
		if (child.type == "group")
			child.content.properties.expanded = false;
	}, true);
	
	sendCrossDomainPostRequest(serverBase + "Map/SaveAs.ashx", 
								{
									WrapStyle: 'window',
									Title: name,
									MapID: String($(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.MapID), 
									MapJson: JSON.stringify(saveTree)
								}, 
								function(response)
								{
									if (!parseResponse(response))
										return;
									
									_mapHelper.updateUnloadEvent(false);
									
									_layersTree.showSaveStatus($$('headerLinks'));
								})
}

var _queryMapLayers = new queryMapLayers();

var queryMapLayersList = function()
{
	this.builded = false;
	
	this.mapEvent = false;
}

queryMapLayersList.prototype = new leftMenu();

queryMapLayersList.prototype.load = function()
{
	_(this.workCanvas, [_table([_tbody([_tr([_td([_span([_t(_gtxt("Шкала прозрачности"))],[['css','marginLeft','15px'],['css','color','#153069'],['css','fontSize','12px']])]), _td([_queryMapLayers.rasterLayersSlider(_queryMapLayersList.workCanvas)])])])])]);
	
	var canvas = _div(null, [['attr','id','extendLayersList'],['css','marginLeft','10px']]),
		searchCanvas = _div(null, [['dir','className','searchCanvas']]),
		name = 'list',
		_this = this;
	
	var layerName = _input(null, [['dir','className','inputStyle'],['css','width','100%'], ['css', 'margin', '1px 0px']]),
		layerOwner = _input(null, [['dir','className','inputStyle'],['css','width','100%'], ['css', 'margin', '1px 0px']]);
	
	// var dateBegin = _input(null,[['attr','id', name + 'DateBegin'],['dir','className','inputStyle'],['css','width','100px']]),
		// dateEnd = _input(null,[['attr','id', name + 'DateEnd'],['dir','className','inputStyle'],['css','width','100px']]);
	
	var intersectSel = _select(
							   [_option([_t(_gtxt("По границе экрана"))], [['attr','value','bounds']]),
								_option([_t(_gtxt("По центру экрана"))], [['attr','value','center']])], 
							[['dir','className','selectStyle'], ['css','width','100%'], ['css', 'margin', '1px 0px']]);
	
	this._isIntersectCenter = false;
							
	$(intersectSel).change(function()
	{
		_this._isIntersectCenter = this.value === 'center';
		_this.reloadList();
	});
	
	var typeSel = _select([_option([_t(_gtxt("Любой"))], [['attr','value','']]),
						   _option([_t(_gtxt("Векторный"))], [['attr','value','Vector']]),
						   _option([_t(_gtxt("Растровый"))], [['attr','value','Raster']])], [['dir','className','selectStyle'], ['css','width','100%'], ['css', 'margin', '1px 0px']]);
	
	var dateIntervalControl = new nsGmx.Calendar();
	
	//находим даты самого раннего и позднего слоёв
	var minDate = null;
	var maxDate = null;
	for (var k = 0; k < globalFlashMap.layers.length; k++)
		if (globalFlashMap.layers[k].properties.date)
		{
			var layerDate = $.datepicker.parseDate('dd.mm.yy', globalFlashMap.layers[k].properties.date);
			minDate = (minDate && minDate < layerDate) ? minDate : layerDate;
			maxDate = (maxDate && maxDate > layerDate) ? maxDate : layerDate;
		}
	
	dateIntervalControl.init('searchLayers', {
		minimized: false,
		showSwitcher: false,
		dateMin:   minDate,
		dateMax:   maxDate,
		dateBegin: minDate,
		dateEnd:   maxDate
	});
	
	_(searchCanvas, [_div([_table([_tbody([_tr([_td([_span([_t(_gtxt("Название"))],[['css','fontSize','12px']])],[['css','width','130px']]), _td([layerName])]),
											_tr([_td([_span([_t(_gtxt("Тип"))],[['css','fontSize','12px']])]),_td([typeSel])]),
											//_tr([_td([_span([_t(_gtxt("Начало периода"))],[['css','fontSize','12px']])]), _td([dateBegin])]),
											_tr([_td([_span([_t(_gtxt("Период"))],[['css','fontSize','12px']])]), _td([dateIntervalControl.canvas])]),
											_tr([_td([_span([_t(_gtxt("Пересечение"))],[['css','fontSize','12px']])]),_td([intersectSel])], [['dir', 'className', 'intersection']])
											])])], [['css','marginBottom','10px']])]);
	
	_(canvas, [searchCanvas]);
	
	var scrollDiv = $("<div></div>", {className: 'layersScroll'});
	var scrollCheckbox = _checkbox(false, 'checkbox');
	scrollDiv.append(scrollCheckbox).append($("<label></label>", {'for': 'otherEncoding'}).text(_gtxt("Пролистывать слои")));
	this._isLayersScrollActive = false;
	$(scrollCheckbox).change(function()
	{
		_this._isLayersScrollActive = scrollCheckbox.checked;
		if (scrollCheckbox.checked)
		{
			sliderDiv.show();
			_this._updateSliderVisibility(_this._scrollDiv.slider('option', 'value'));
		}
		else
			sliderDiv.hide();
	})
	
	var sliderDiv = $("<div></div>", {id: 'layersScrollSlider'}).hide();
	scrollDiv.append(sliderDiv);
	
	$(canvas).append(scrollDiv);
	
	var tableParent = _div(),
		sortFuncs = {};
	
	sortFuncs[_gtxt('Имя')] = [
				function(a,b){if (a._sort_title > b._sort_title) return 1; else if (a._sort_title < b._sort_title) return -1; else return 0},
				function(a,b){if (a._sort_title < b._sort_title) return 1; else if (a._sort_title > b._sort_title) return -1; else return 0}
			];
	sortFuncs[_gtxt('Тип')] = [
				function(a,b){if (a._sort_type > b._sort_type) return 1; else if (a._sort_type < b._sort_type) return -1; else return 0},
				function(a,b){if (a._sort_type < b._sort_type) return 1; else if (a._sort_type > b._sort_type) return -1; else return 0}
			];
	sortFuncs[_gtxt('Дата')]  = [
				function(a,b)
				{
					if (!a._sort_date || !b._sort_date)
						return 0;
					
					if (a._sort_date > b._sort_date) return 1; else if (a._sort_date < b._sort_date) return -1; else return 0;				
				},
				function(a,b)
				{
					if (!a._sort_date || !b._sort_date)
						return 0;
					
					if (b._sort_date > a._sort_date) return 1; else if (b._sort_date < a._sort_date) return -1; else return 0;
				}
			];
	
	_listTable.limit = 20;
	_listTable.pagesCount = 5;
	_listTable.createTable(tableParent, name, 310, [_gtxt("Тип"), _gtxt("Имя"), _gtxt("Дата")], ['10%','65%','25%'], this.drawExtendLayers, sortFuncs);
	
	$(_listTable).bind('sortChange', function(){ _this._updateSlider()} );
	$(_listTable.getDataProvider()).change(function(){ _this._updateSlider()});
	
	var inputPredicate = function(value, fieldName, fieldValue)
		{
			if (!value.properties[fieldName])
				return false;
		
			return String(value.properties[fieldName]).toLowerCase().indexOf(fieldValue.toLowerCase()) > -1;
		},
		selectPredicate = function(value, fieldName, fieldValue)
		{
			if (!value.properties[fieldName])
				return false;
				
			return fieldValue.toLowerCase() == String(value.properties[fieldName]).toLowerCase();
		},
		beginDatePredicate = function(value, fieldName, fieldValue, beginDate, endDate)
		{
			var valueDate = value['_sort_date'];
			
			if (!valueDate)
				return false;
			
			if (endDate)
				return valueDate >= beginDate && valueDate <= endDate;
			else
				return valueDate >= beginDate;
		},
		endDatePredicate = function(value, fieldName, fieldValue, beginDate, endDate)
		{
			var valueDate = value['_sort_date'];
			
			if (!valueDate)
				return false;
			
			if (beginDate)
				return valueDate >= beginDate && valueDate <= endDate;
			else
				return valueDate <= endDate;
		};
	
	_listTable.getDataProvider().attachFilterEvents(layerName, 'title', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var filterFunc = function(value)
				{
					return inputPredicate(value, fieldName, fieldValue);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
	
	_listTable.getDataProvider().addFilter('DateBegin', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var beginDate = dateIntervalControl.getDateBegin(),
			endDate = dateIntervalControl.getDateEnd(),
			filterFunc = function(value)
				{
					return beginDatePredicate(value, fieldName, fieldValue, beginDate ? beginDate : null, endDate ? endDate : null);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})	
		
	_listTable.getDataProvider().addFilter('DateEnd', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var beginDate = dateIntervalControl.getDateBegin(),
			endDate = dateIntervalControl.getDateEnd(),
			filterFunc = function(value)
				{
					return endDatePredicate(value, fieldName, fieldValue, beginDate, endDate);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	});
	
	$(dateIntervalControl).change(function()
	{
		_listTable.getDataProvider().setFilterValue('DateBegin', dateIntervalControl.getDateBegin());
		_listTable.getDataProvider().setFilterValue('DateEnd', dateIntervalControl.getDateEnd());
	});
	
	_listTable.getDataProvider().attachSelectFilterEvents(typeSel, 'type', function(fieldName, fieldValue, vals)
	{
		if (fieldValue == "")
			return vals;
		
		var filterFunc = function(value)
				{
					return selectPredicate(value, fieldName, fieldValue);
				},
			local = _filter(filterFunc, vals);
		
		return local;
	})
	
	var resize = function()
	{
		_listTable.tableParent.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';
		_listTable.tableBody.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 15 - 21 + 'px';
		_listTable.tableBody.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 35 - 21 + 'px';

		_listTable.tablePages.parentNode.parentNode.parentNode.parentNode.style.width = canvas.parentNode.parentNode.offsetWidth - 12 - 21 + 'px';
		
		_listTable.tableParent.style.height = canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - 25 - 10 - 10 + 'px';
		_listTable.tableBody.parentNode.parentNode.style.height = canvas.parentNode.offsetHeight - canvas.firstChild.offsetHeight - 25 - 20 - 10 - 10 + 'px';
	}
	
	_(canvas, [tableParent]);
	_(this.workCanvas, [canvas]);
	
	_listTable.tableBody.parentNode.style.width = '100%';
	_listTable.tableParent.style.width = '330px';
	_listTable.tableBody.parentNode.parentNode.style.height = 'auto';
	_listTable.tableBody.parentNode.parentNode.style.overflowY = 'auto';
	_listTable.tableParent.style.height = 'auto';
	_listTable.tableParent.parentNode.lastChild.style.width = '333px';
	
	_listTable.tableHeader.firstChild.childNodes[1].style.textAlign = 'left';
}

//делает видимым только один слой с индексом nVisible
queryMapLayersList.prototype._updateSliderVisibility = function(nVisible)
{
    var curLayer = _listTable.getDataProvider().getOriginalItems()[nVisible];
	if (!this._isLayersScrollActive || typeof curLayer === 'undefined') return;
	
	var layerName = curLayer.properties.name;
	var baseMapName = window.baseMap.id;
	
	for (var k = 0; k < globalFlashMap.layers.length; k++)
		if (globalFlashMap.layers[k].properties.mapName !== baseMapName) //слои базовой карты не трогаем
	{
			var isVisible = layerName == globalFlashMap.layers[k].properties.name;
			if (isVisible !== globalFlashMap.layers[k].isVisible)
				globalFlashMap.layers[k].setVisible(isVisible);
		}
}

queryMapLayersList.prototype._updateSlider = function()
{
	if (typeof _listTable.getDataProvider().getOriginalItems().length == 0)
		return;

	var container = $("#layersScrollSlider");
	container.empty();
	var _this = this;
	var slideFunction = function(value)
		{
		_this._updateSliderVisibility(value)
		_listTable.setPage( Math.floor(value / (_listTable.limit)) );
	}
	
	this._scrollDiv = $("<div></div>");
	this._scrollDiv.slider({
		max: _listTable.getDataProvider().getOriginalItems().length - 1,
		slide: function(event, ui) { slideFunction(ui.value); }
	});
	
	
	var prevDiv = makeImageButton("img/prev.png", "img/prev_a.png");
	_title(prevDiv, _gtxt("Предыдущий слой"));
	prevDiv.onclick = function()
	{
		var curValue = _this._scrollDiv.slider('option', 'value');
		if ( curValue == _this._scrollDiv.slider('option', 'min') ) 
			return;
			
		_this._scrollDiv.slider( 'option', 'value', curValue - 1);
		slideFunction(curValue - 1);
	}
	
	var nextDiv = makeImageButton("img/next.png", "img/next_a.png");
	_title(nextDiv, _gtxt("Следующий слой"));
	nextDiv.onclick = function()
	{
		var curValue = _this._scrollDiv.slider('option', 'value');
		if ( curValue == _this._scrollDiv.slider('option', 'max') ) 
			return;
			
		_this._scrollDiv.slider( 'option', 'value', curValue + 1 );
		slideFunction(curValue + 1);
	}
	
	var table = $("<table></table>")
					.append($("<tr></tr>")
						.append($("<td></td>", {id: "scrollTD"}).append(this._scrollDiv))
						.append($("<td></td>").append(prevDiv))
						.append($("<td></td>").append(nextDiv))
					)
	
	container.append(table);
	
	if (_listTable.getDataProvider().getOriginalItems().length == 0)
		this._scrollDiv.slider('option', 'disabled', true);
	else
		this._updateSliderVisibility(0);
}

queryMapLayersList.prototype.drawExtendLayers = function(mapLayer)
{
	var elem = mapLayer.properties,
		span = _span([_t(elem.title)], [['dir','className','layer']]),
		layerElems = [],
		timer = null,
		box,
		clickFunc = function()
		{
			//_layersTree.setListActive(span);
			//_queryMapLayers.activeListLayer = elem.name;
			
			globalFlashMap.layers[elem.name].setVisible(true);
			
			box.checked = true;
		},
		dbclickFunc = function()
		{
			if (!_queryMapLayers.builded)
				mapLayers.mapLayers.load('layers');
			
			var layer = globalFlashMap.layers[elem.name];
		
			if (layer)
			{
				var minLayerZoom = _layersTree.getMinLayerZoom(layer);				
				_layersTree.layerZoomToExtent(layer.bounds, minLayerZoom);
			}
			
			/* временно отключили разворачиание дерева
			
			var div;
			
			if (elem.LayerID)
				div = $(_queryMapLayers.treeCanvas).find("div[LayerID='" + elem.LayerID + "']");
			else
				div = $(_queryMapLayers.treeCanvas).find("div[MultiLayerID='" + elem.MultiLayerID + "']");
			
			// слой еще не нарисован, нужно развернуть дерево
			// либо развернем все родительские группы
			var treeElem,
				groupParent = _queryMapLayers.treeCanvas;
			
			if (elem.LayerID)	
				treeElem = _mapHelper.findElem(_mapHelper.mapTree, "LayerID", elem.LayerID, []);
			else
				treeElem = _mapHelper.findElem(_mapHelper.mapTree, "MultiLayerID", elem.MultiLayerID, []);
			
			for (var i = treeElem.parents.length - 2; i >= 0; i--) // корень не считаем
			{
				if (!treeElem.parents[i].content.properties.expanded)
				{
					var group = $(groupParent).find("div[GroupID='" + treeElem.parents[i].content.properties.GroupID + "']")[0];
					
					if ($(group.parentNode.firstChild).hasClass('expandable-hitarea'))
						$(group.parentNode.firstChild).trigger("click");
					
					groupParent = group.parentNode;
				}
			}
			
			if (elem.LayerID)
				div = $(groupParent).find("div[LayerID='" + elem.LayerID + "']");
			else
				div = $(groupParent).find("div[MultiLayerID='" + elem.MultiLayerID + "']");
			
			var spanLayer = $(div[0]).find("span.layer")[0];
			
			_layersTree.setActive(spanLayer);
			
			var box = spanLayer.parentNode.parentNode.firstChild;
			
			box.checked = true;
			
			var parentParams = _layersTree.getParentParams(spanLayer.parentNode.parentNode.parentNode);
			
			_layersTree.visibilityFunc(box, true, parentParams.list);
			
		//	$(_queryMapLayers.treeButton).trigger("click");
			
			var scroll = getOffsetRect(spanLayer).top - $$('header').offsetHeight;
			
			if (scroll > 100)
				scroll = scroll - 100;
			
			$$('leftContent').scrollTop = scroll;
			
			*/
		};

	span.layerName = elem.name;
	span.type = elem.type;
	
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

	if (_queryMapLayers.activeListLayer == elem.name)
		$(spanParent).addClass("active");	

	box = _checkbox(globalFlashMap.layers[elem.name].isVisible, 'checkbox');
	
	box.className = 'box';
	if ($.browser.msie)
		box.style.margin = '-3px -2px 0px -2px';
	
	box.onclick = function()
	{
		globalFlashMap.layers[elem.name].setVisible(this.checked);
	}
	
	globalFlashMap.layers[elem.name].addMapStateListener("onChangeVisible", function(attr)
	{
		box.checked = attr;
	});
	
	if (elem.type == "Vector")
	{
		var icon = _mapHelper.createStylesEditorIcon(elem.styles, elem.GeometryType ? elem.GeometryType.toLowerCase() : 'polygon'),
		
		//layerElems = [box, icon, spanParent];
		layerElems = _table([_tbody([_tr([_td([box]), _td([icon]), _td([spanParent], [['css', 'width', '100%'], ['css','whiteSpace','nowrap']])])])], [['dir', 'className', 'listLayerTable']]);
	}
	else
		// layerElems = [box, spanParent];
		layerElems = _table([_tbody([_tr([_td([box]), _td([spanParent], [['css', 'width', '100%'], ['css','whiteSpace','nowrap']])])])], [['dir', 'className', 'listLayerTable']]);
	
	
	var icon = _img(null, [['attr','src', (elem.type == "Vector") ? 'img/vector.png' : 'img/rastr.png' ],['css','marginLeft','3px']]),
		tr,
		_this = this;
	
	var maxLayerWidth = this.tableHeader.firstChild.childNodes[1].offsetWidth + 'px';
	
	tr = _tr([_td([icon], [['css','textAlign','center']]), _td([_div([layerElems], [['css','width',maxLayerWidth],['css','overflowX','hidden'],['css','whiteSpace','nowrap']])]), _td([_t(elem.date)], [['css','textAlign','center'],['dir','className','invisible']])]);
	
	for (var i = 0; i < tr.childNodes.length; i++)
		tr.childNodes[i].style.width = this.fieldsWidths[i];
	
	attachEffects(tr, 'hover')
	
	return tr;
}

queryMapLayersList.prototype.attachMapChangeEvent = function()
{
	_queryMapLayersList.reloadList();
	
	var timer = null;
	
	globalFlashMap.setHandler("onMove", function()
	{
		if (timer)
			clearTimeout(timer);
			
		timer = setTimeout(function(){ _queryMapLayersList.reloadList(); }, 200)
	})
	
	this.mapEvent = true;
}

queryMapLayersList.prototype.detachMapChangeEvent = function()
{
	globalFlashMap.setHandler("onMove", function(){})
	
	this.mapEvent = false;
}

queryMapLayersList.prototype.reloadList = function()
{
	var extendLayers = [];
	
	//window.baseMap.id будет принудительно выставлен API при инициализации, даже если его нет в config.js
	var baseMapName = window.baseMap.id;
	
	for (var i = 0; i < globalFlashMap.layers.length; i++)
	{
		//не показываем слои из базовой подложки
		if (globalFlashMap.layers[i].properties.mapName === baseMapName)
			continue;
		
		var bounds = globalFlashMap.layers[i].bounds;
		
		var isIntersected = null;
		if (this._isIntersectCenter)
		{
			var x = globalFlashMap.getX();
			var y = globalFlashMap.getY();
			isIntersected = x > bounds.minX && x < bounds.maxX && y > bounds.minY && y < bounds.maxY;
		}
		else
		{
			var extend = globalFlashMap.getVisibleExtent();
			isIntersected = boundsIntersect(extend, bounds);
		}
		
		if (isIntersected)
		{
			// оптимизируем данные для сортировки
			
			var val = globalFlashMap.layers[i];
			
			val._sort_title = val.properties['title'];
			val._sort_type = val.properties['type'];
			val._sort_date = val.properties['date'] || false;
			
			if (val._sort_date)
			{
				var dateParts = val.properties['date'].split('.');
				
				if (dateParts.length != 3)
					val._sort_date = false;
				else
					val._sort_date = new Date(dateParts[2], dateParts[1] - 1, dateParts[0]).valueOf();
			}
			
			extendLayers.push(val)
		}
	}

	_listTable.start = 0;
	_listTable.reportStart = 0;
	_listTable.allPages = 0;
	
	_listTable.getDataProvider().setOriginalItems(extendLayers);	
}

var _queryMapLayersList = new queryMapLayersList();

mapLayers.mapLayers.load = function()
{
	var alreadyLoaded = _queryMapLayers.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_queryMapLayers.load()
}
mapLayers.mapLayers.unload = function()
{
}

mapLayers.mapLayersList.load = function()
{
	var alreadyLoaded = _queryMapLayersList.createWorkCanvas(arguments[0], function()
	{
		if (_queryMapLayersList.mapEvent)
			_queryMapLayersList.detachMapChangeEvent();
		
		_layersTree.updateChildLayersMapVisibility($(_queryMapLayers.buildedTree.firstChild).children("[MapID]")[0])
	});
	
	if (!alreadyLoaded)
		_queryMapLayersList.load()
	
	if (!_queryMapLayersList.mapEvent)
		_queryMapLayersList.attachMapChangeEvent();
}
mapLayers.mapLayersList.unload = function()
{
};
