var mapLayers = 
{
	mapLayers:{}
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
	
	this.groupLoadingFuncs = [];
}

// layerManagerFlag == 0 для дерева слева
// layerManagerFlag == 1 для списка слоев
// layerManagerFlag == 2 для списка карт

layersTree.prototype.drawTree = function(tree, layerManagerFlag)
{
	var canvas = _ul([this.getChildsList(tree, false, layerManagerFlag, true)], [['dir','className','filetree']]);
    this.treeModel = new nsGmx.LayersTree(tree);
    this._mapTree = tree; //используйте this.treeModel для доступа к исходному дереву

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
        
        // initExpand - временное свойство, сохраняющее начальное состояние развёрнутости группы.
        // В expanded будет храниться только текущее состояние (не сохраняется)
        if (typeof elem.content.properties.initExpand == 'undefined')
            elem.content.properties.initExpand = elem.content.properties.expanded;
		
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
					treeElem = _this.findTreeElem(div);
				
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
            globalFlashMap.layers[elemProperties.name].addListener("onChangeVisible", function(attr)
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
                
                _this.layerZoomToExtent(layer.getLayerBounds(), minLayerZoom);
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
    
    var borderDescr = _span();
    if (elem.MetaProperties)
    {
        var props = {};
        var count = 0;
        for (key in elem.MetaProperties)
        {
            var tagtype = elem.MetaProperties[key].Type;
            props[key] = nsGmx.Utils.convertFromServer(tagtype, elem.MetaProperties[key].Value);
            count++;
        }
        
        if (count)
        {
            _(borderDescr, [_t('i')], [['css','fontWeight','bold'],['css','fontStyle','italic'],['css','margin','0px 5px'],['css','cursor','pointer']]);
            borderDescr.onclick = function()
            {
                _this.showLayerInfo({properties:elem}, {properties: props});
            }
        }
    }    
		
	if (elem.type == "Vector")
	{
		var icon = this.mapHelper.createStylesEditorIcon(elem.styles, elem.GeometryType ? elem.GeometryType.toLowerCase() : 'polygon', {addTitle: !layerManagerFlag}),
			multiStyleParent = _div(null,[['attr','multiStyle',true]]),
            iconSpan = _span([icon]);
        
        if ( elem.styles.length == 1 && elem.name in globalFlashMap.layers )
        {
            globalFlashMap.layers[elem.name].filters[0].addListener('onSetStyle', function(style)
            {
                if (globalFlashMap.layers[elem.name].filters.length == 1)
                {
                    var newIcon = _this.mapHelper.createStylesEditorIcon([{MinZoom:1, MaxZoom: 21, RenderStyle: style.regularStyle}], elem.GeometryType ? elem.GeometryType.toLowerCase() : 'polygon', {addTitle: !layerManagerFlag});
                    $(iconSpan).empty().append(newIcon);
                }
            });
        }
            
        $(iconSpan).attr('styleType', $(icon).attr('styleType'));
		
		this.mapHelper.createMultiStyle(elem, multiStyleParent, true, layerManagerFlag);
		
		if (!layerManagerFlag)
		{
			if (!parentVisibility || !elem.visible)
				$(multiStyleParent).addClass("invisible")
			
			iconSpan.onclick = function()
			{
				_this.mapHelper.createLayerEditor(this.parentNode, 1,  iconSpan.parentNode.gmxProperties.content.properties.styles.length > 1 ? -1 : 0);
			}
			
		}
        
        if (this._renderParams.showVisibilityCheckbox)
			return [box, iconSpan, spanParent, spanDescr, borderDescr, multiStyleParent];
		else
			return [iconSpan, spanParent, spanDescr, borderDescr, multiStyleParent];
	}
	else
	{
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

//Показывает аттрибутивную информацию объекта в виде таблички в отдельном диалоге
layersTree.prototype.showLayerInfo = function(layer, obj)
{
	var trs = [];
    var typeSpans = {};
	for (var key in obj.properties)
    {
        var content = _div(),
            contentText = String(obj.properties[key]);
        
        if (contentText.indexOf("http://") == 0 || contentText.indexOf("www.") == 0)
            contentText = "<a href=\"" + contentText + "\" target=\"_blank\">" + contentText + "</a>";
        
        content.innerHTML = contentText;
        
        var typeSpan = _span([_t(key)]);
        
        typeSpans[key] = typeSpan;
        
        trs.push(_tr([_td([typeSpan], [['css','width','30%']]), _td([content], [['css','width','70%']])]));
    }
	
	var title = _span(null, [['dir','className','title'], ['css','cursor','default']]),
		summary = _span(null, [['dir','className','summary']]),
		div;
	
	if ($$('layerPropertiesInfo'))
	{
		div = $$('layerPropertiesInfo');
		
		if (!trs.length && !(layer.properties.type == "Raster" && layer.properties.Legend))
		{
			$(div.parentNode).dialog('close');
			
			return;
		}
		
		removeChilds(div);
		
		_(div, [_table([_tbody(trs)], [['dir','className','vectorInfoParams']])]);
		
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
		
		div = _div([_table([_tbody(trs)], [['dir','className','vectorInfoParams']])], [['attr','id','layerPropertiesInfo']]);

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
    
    nsGmx.TagMetaInfo.loadFromServer(function(tagInfo)
    {
        for (var key in typeSpans)
        {
            if (tagInfo.isTag(key))
                $(typeSpans[key]).attr('title', tagInfo.getTagDescription(key));
        }
    });
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
					
					_this.mapHelper.findChilds(_this.findTreeElem(span.parentNode.parentNode).elem, function(child)
					{
						if (child.type == 'layer' && (child.content.properties.LayerID || child.content.properties.MultiLayerID) )
						{
							var layer = globalFlashMap.layers[child.content.properties.name],
								layerBounds = layer.getLayerBounds();
						
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
		
		_this.removeTreeElem(div);
		
		div.parentNode.removeNode(true);
		
		_abstractTree.delNode(null, parentTree, parentTree.parentNode)
		
		$(span.parentNode.parentNode).dialog('destroy');
		span.parentNode.parentNode.removeNode(true);
		
		_mapHelper.updateUnloadEvent(true);
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
		
	var treeElem = this.findTreeElem(checkbox.parentNode).elem;
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
				
				this.findTreeElem(el.childNodes[1]).elem.content.properties.visible = true;
				
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
	var treeParent = div.getAttribute('MapID') ? this.treeModel.getRawTree() : this.findTreeElem(div).elem
	
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

	this.removeTreeElem(spanSource.parentNode.parentNode);
	this.addTreeElem(divDestination, 0, spanSource.parentNode.parentNode.gmxProperties);

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
	
	_mapHelper.updateUnloadEvent(true);
}
layersTree.prototype.swapHandler = function(spanSource, divDestination)
{
	var node = divDestination.parentNode,
		parentTree = spanSource.parentNode.parentNode.parentNode.parentNode;
	
	if (node == spanSource.parentNode.parentNode.parentNode)
		return;
	
	this.removeTreeElem(spanSource.parentNode.parentNode);
	
	var divElem = $(divDestination.parentNode).children("div[GroupID],div[LayerID],div[MultiLayerID]")[0],
		divParent = $(divDestination.parentNode.parentNode.parentNode).children("div[MapID],div[GroupID]")[0],
		index = this.findTreeElem(divElem).index;
	
	this.addTreeElem(divParent, index + 1, spanSource.parentNode.parentNode.gmxProperties);

	_abstractTree.swapNode(node, spanSource.parentNode.parentNode.parentNode);
	
	this.updateListType(spanSource.parentNode.parentNode.parentNode);
	
	// удалим старый узел
	_abstractTree.delNode(node, parentTree, parentTree.parentNode);
	
	_mapHelper.updateUnloadEvent(true);
}

layersTree.prototype.copyHandler = function(gmxProperties, divDestination, swapFlag, addToMap)
{
    var _this = this;
    //var gmxProperties = spanSource.parentNode.parentNode.gmxProperties;
	var isFromList = typeof gmxProperties.content.geometry === 'undefined';
	var layerProperties = (gmxProperties.type !== 'layer' || !isFromList) ? gmxProperties : false,
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
                if ( _this.treeModel.findElemByGmxProperties(gmxProperties) )
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
					index = _this.findTreeElem(divElem).index;
			
				_this.addTreeElem(divParent, index + 1, layerProperties);

				_abstractTree.swapNode(node, li);
				
				_this.updateListType(li, true);
			}
			else
			{
				_this.addTreeElem(divDestination, 0, layerProperties);

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
			
			_mapHelper.updateUnloadEvent(true);
		},
		_this = this;
	
	if (!layerProperties)
	{
		if (gmxProperties.content.properties.LayerID)
		{
			sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerJson.ashx?WrapStyle=func&LayerName=" + gmxProperties.content.properties.name, function(response)
			{
				if (!parseResponse(response))
					return;
				
				layerProperties = {type:'layer', content: response.Result};
				
				if (layerProperties.content.properties.type == 'Vector')
					layerProperties.content.properties.styles = [{MinZoom:layerProperties.content.properties.MaxZoom, MaxZoom:21, RenderStyle:_this.mapHelper.defaultStyles[layerProperties.content.properties.GeometryType]}]
				else if (layerProperties.content.properties.type != 'Vector' && !layerProperties.content.properties.MultiLayerID)
					layerProperties.content.properties.styles = [{MinZoom:layerProperties.content.properties.MinZoom, MaxZoom:21}];
				
				layerProperties.content.properties.mapName = _this.treeModel.getMapProperties().name;
				layerProperties.content.properties.hostName = _this.treeModel.getMapProperties().hostName;
				layerProperties.content.properties.visible = true;
				
				copyFunc();
			})
		}
		else
		{
			sendCrossDomainJSONRequest(serverBase + "MultiLayer/GetMultiLayerJson.ashx?WrapStyle=func&MultiLayerID=" + gmxProperties.content.properties.MultiLayerID, function(response)
			{
				if (!parseResponse(response))
					return;
				
				layerProperties = {type:'layer', content: response.Result};
				
				layerProperties.content.properties.styles = [{MinZoom:layerProperties.content.properties.MinZoom, MaxZoom:20}];
				
				layerProperties.content.properties.mapName = _this.treeModel.getMapProperties().name;
				layerProperties.content.properties.hostName = _this.treeModel.getMapProperties().hostName;
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
			//globalFlashMap.layers[name].bounds = getLayerBounds( elem.content.geometry.coordinates[0], globalFlashMap.layers[name]);
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

layersTree.prototype.removeTreeElem = function(div)
{
	var elem = this.findTreeElem(div);
	
	if (typeof elem.parents[0].children != 'undefined')
		elem.parents[0].children.splice(elem.index, 1);
	else
		elem.parents[0].content.children.splice(elem.index, 1);
}

layersTree.prototype.addTreeElem = function(div, index, elemProperties)
{
	var elem = this.findTreeElem(div);
	
	if (typeof elem.elem.children != 'undefined')
		elem.elem.children.splice(index, 0, elemProperties);
	else
		elem.elem.content.children.splice(index, 0, elemProperties);
        
    $(this.treeModel.getRawTree()).triggerHandler('addTreeElem', [elemProperties]);
}

layersTree.prototype.findTreeElem = function(div)
{
	if (div.getAttribute("MapID"))
		return {elem:this.treeModel.getRawTree(), parents:[], index: false};
	else if (div.getAttribute("GroupID"))
		return this.treeModel.findElem("GroupID", div.getAttribute("GroupID"));
	else if (div.getAttribute("LayerID"))
		return this.treeModel.findElem("LayerID", div.getAttribute("LayerID"));
	else if (div.getAttribute("MultiLayerID"))
		return this.treeModel.findElem("MultiLayerID", div.getAttribute("MultiLayerID"));
}

//Дерево основной карты
var _layersTree = new layersTree({showVisibilityCheckbox: true, allowActive: true, allowDblClick: true});
_mapHelper._treeView = _layersTree;
_layersTree.mapHelper = _mapHelper;

//Виджет в левой панели для отображения основного дерева
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

	var parentElem = typeof div == 'undefined' ? _layersTree.treeModel.getRawTree() : _layersTree.findTreeElem(div).elem,
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
        
        $(this).triggerHandler('load');
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
				var treeElem = !active.length ? {elem: _layersTree.treeModel.getRawTree(), parents:[], index:false} : _layersTree.findTreeElem(active[0].parentNode);
				
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
    var mapProperties = _layersTree.treeModel.getMapProperties();
	return mapProperties ? mapProperties.Access : "none";
}

queryMapLayers.prototype.layerRights = function(name)
{
	return globalFlashMap.layers[name].properties.Access;
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
			_layersTree.copyHandler(ui.draggable[0].parentNode.parentNode.gmxProperties, this, false, !isFromExternalMaps)
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
        
        var gmxProperties = ui.draggable[0].parentNode.parentNode.gmxProperties;
		
		if (!layerManager)
			_layersTree.swapHandler(ui.draggable[0], this)
		else
			_layersTree.copyHandler(gmxProperties, this, true, !isFromExternalMaps)
	}})
}
queryMapLayers.prototype.removeSwappable = function(parent)
{
	$(parent).find("div[swap]").droppable('destroy');
}

queryMapLayers.prototype.asyncCreateLayer = function(task, title)
{
    var _this = this;
    task.deferred.fail(function(taskInfo)
    {
		taskInfo.Status = 'error';
		
		parseResponse(taskInfo);
		
		return;
	}).done(function(taskInfo)
    {
		var newLayerProperties = taskInfo.Result.properties;
		
        var mapProperties = _layersTree.treeModel.getMapProperties()
		newLayerProperties.mapName = mapProperties.name;
		newLayerProperties.hostName = mapProperties.hostName;
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
			index = _layersTree.findTreeElem(divElem).index;
	
		_layersTree.addTreeElem(divParent, index, {type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}});
		
		_queryMapLayers.addSwappable(li);
		
		_queryMapLayers.addDraggable(li);

		_layersTree.updateListType(li);
		
		_mapHelper.updateUnloadEvent(true);
    })
	
	var update = function(taskInfo)
	{
		var taskDiv;
		
		if (!$$(taskInfo.TaskID))
		{
			taskDiv = _div(null, [['attr','id',taskInfo.TaskID]]);
			
			var active = $(_this.buildedTree).find(".active");
			
			if (active.length && (active[0].parentNode.getAttribute('MapID') || active[0].parentNode.getAttribute('GroupID')))
				_abstractTree.addNode(active[0].parentNode.parentNode, _li([taskDiv, _div(null,[['css','height','5px'],['css','fontSize','0px']])]));
			else
				_abstractTree.addNode(_this.buildedTree.firstChild, _li([taskDiv, _div(null,[['css','height','5px'],['css','fontSize','0px']])]));
		}
		else
		{
			taskDiv = $$(taskInfo.TaskID);
			
			removeChilds(taskDiv);
		}
		
		_(taskDiv, [_span([_t(title + ':')], [['css','color','#153069'],['css','margin','0px 3px']]), _t(taskInfo.Status)])
	}
    
    $(task).bind('update', update);
    
    if (task.getCurrentStatus() === 'processing')
        update(task.getCurrentResult());
}

queryMapLayers.prototype.asyncUpdateLayer = function(task, properties, needRetiling)
{
    var _this = this;
    task.deferred
        .done(function(taskInfo)
        {
            if (needRetiling)
            {
                var newLayerProperties = taskInfo.Result.properties,
                    layerDiv = $(_queryMapLayers.buildedTree).find("[LayerID='" + properties.LayerID + "']")[0];
                
                var mapProperties = _layersTree.treeModel.getMapProperties();
                newLayerProperties.mapName = mapProperties.name;
                newLayerProperties.hostName = mapProperties.hostName;
                newLayerProperties.visible = layerDiv.gmxProperties.content.properties.visible;
                
                newLayerProperties.styles = layerDiv.gmxProperties.content.properties.styles;
                
                var convertedCoords = from_merc_geometry(taskInfo.Result.geometry);
                
                _this.removeLayer(newLayerProperties.name);
                
                _layersTree.addLayersToMap({content:{properties:newLayerProperties, geometry:convertedCoords}});
                
                var newLayer = globalFlashMap.layers[newLayerProperties.name],
                    parentProperties = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0].gmxProperties,
                    li = _layersTree.getChildsList({type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}}, parentProperties, false, _layersTree.getLayerVisibility(layerDiv.firstChild));
                
                    $(layerDiv.parentNode).replaceWith(li);
                    
                    _layersTree.findTreeElem($(li).children("div[LayerID]")[0]).elem = {type:'layer', content:{properties:newLayerProperties, geometry:convertedCoords}}				

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
        }).fail(function(taskInfo)
        {
            taskInfo.Status = 'error';
            parseResponse(taskInfo);
            return;
        })
    	
    var update = function(taskInfo)
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
	}
    
    $(task).bind('update', update);
    
    if (task.getCurrentStatus() === 'processing')
        update(task.getCurrentResult());
}

queryMapLayers.prototype.removeLayer = function(name)
{
    if ( typeof globalFlashMap.layers[name] !== 'undefined' )
        globalFlashMap.layers[name].remove();
}

queryMapLayers.prototype.getLayers = function()
{
    this.createLayersManager();
}

queryMapLayers.prototype.createLayersManager = function()
{
	var canvas = _div();
	var layerManagerControl = new nsGmx.LayerManagerControl(canvas, 'layers');
    
    var existLayers = [];
    for (var i = 0; i < globalFlashMap.layers.length; i++)
        existLayers.push(globalFlashMap.layers[i].properties.name);
        
    layerManagerControl.disableLayers(existLayers);
    
	showDialog(_gtxt("Список слоев"), canvas, 571, 475, 535, 130);
}

queryMapLayers.prototype.getMaps = function()
{
	if (!$$('mapsList'))
        new nsGmx.MapsManagerControl();
}

queryMapLayers.prototype.createMapDialog = function(title, buttonName, func, addLink)
{
	var input = _input(null, [['attr','value', ''],['css','margin','10px 10px 15px 10px'],['dir','className','inputStyle'],['css','width','220px']]),
		button = makeButton(buttonName),
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
				inputError(input);
	  		
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
			inputError(input);
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
};

(function()
{

    var saveMapInternal = function(scriptName, mapTitle, callback)
    {
        _userObjects.collect();
        $(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.UserData = JSON.stringify(_userObjects.getData());
        
        for (var name in _mapHelper.layerEditorsHash)
            _mapHelper.layerEditorsHash[name] && _mapHelper.layerEditorsHash[name].updateFunc();
        
        var saveTree = {};
        
        $.extend(true, saveTree, _layersTree.treeModel.getRawTree())
        
        //раскрываем все группы так, как записано в свойствах групп
        _mapHelper.findTreeElems(saveTree, function(child, flag)
        {
            if (child.type == "group")
            {
                var props = child.content.properties;
                props.expanded = typeof props.initExpand !== 'undefined' ? props.initExpand : false;
                delete props.initExpand;
            }
        }, true);
        
        var params = {
                WrapStyle: 'window',
                MapID: String($(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.MapID), 

                MapJson: JSON.stringify(saveTree)
            }
            
        if (mapTitle)
            params.Title = mapTitle;
        
        sendCrossDomainPostRequest(serverBase + scriptName, params, 
            function(response)
            {
                if (!parseResponse(response))
                    return;
                
                callback && callback(response.Result);
                
                _mapHelper.updateUnloadEvent(false);
                
                _layersTree.showSaveStatus($$('headerLinks'));
            }
        )
    }
    
    queryMapLayers.prototype.saveMap = function()
    {
        $('#headerLinks').find("[savestatus]").remove();
        
        var loading = _img(null, [['attr','src','img/loader2.gif'],['attr','savestatus','true'],['css','margin','8px 0px 0px 10px']]);
        _($$('headerLinks'), [loading]);
        
        sendCrossDomainJSONRequest(serverBase + "Map/GetMapVersion.ashx?WrapStyle=func&MapName=" + _layersTree.treeModel.getMapProperties().name, function(response)
        {
            if (!parseResponse(response))
            {
                loading.removeNode(true);
                
                return;
            }
            
            var doSave = function()
            {
                saveMapInternal("Map/SaveMap.ashx", null, function()
                    {
                        _layersTree.treeModel.getMapProperties().Version = response.Result + 1;
                    });
            }
            
            if (response.Result > _layersTree.treeModel.getMapProperties().Version)
            {
                if (confirm(_gtxt("Карта имеет более новую версию. Сохранить?")))
                {
                    doSave();
                }
                else
                {
                    loading.removeNode(true);
                    return;
                }
            }
            else
                doSave();
        })
    }

    queryMapLayers.prototype.saveMapAs = function(name)
    {
        $('#headerLinks').find("[savestatus]").remove();
        
        var loading = _img(null, [['attr','src','img/loader2.gif'],['attr','savestatus','true'],['css','margin','8px 0px 0px 10px']]);
        _($$('headerLinks'), [loading]);
        
        saveMapInternal("Map/SaveAs.ashx", name);
    }

})();

var _queryMapLayers = new queryMapLayers();

mapLayers.mapLayers.load = function()
{
	var alreadyLoaded = _queryMapLayers.createWorkCanvas(arguments[0]);
	
	if (!alreadyLoaded)
		_queryMapLayers.load()
}
mapLayers.mapLayers.unload = function()
{
}