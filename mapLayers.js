!(function(_) {

var mapLayers =
{
	mapLayers:{}
}

window.mapLayers = mapLayers;

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
			$(div).addClass('lastCollapsable-hitarea collapsable-hitarea');
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
window._abstractTree = _abstractTree;

//renderParams:
//  * showVisibilityCheckbox {Bool} - показывать или нет checkbox видимости
//  * allowActive {Bool} - возможен ли в дереве активный элемент
//  * allowDblClick {Bool} - переходить ли по двойному клику к видимому экстенту слоя/группы
//  * showStyle {Bool} - показывать ли иконку стилей
//  * visibilityFunc {function(layerProps, isVisible)} - ф-ция, которая будет выполнена при изменении видимости слоя.
//    По умолчанию устанавливает видимость соответствующего слоя в API
//
//события:
//  * layerVisibilityChange - при изменении видимости слоя (параметр - элемент дерева с изменившимся слоем)
//  * addTreeElem - добавили новый элемент дерева (параметр - новый элемент)
//  * activeNodeChange - изменили активную ноду дерева (парамер - div активной ноды)
var layersTree = function( renderParams )
{
    this._renderParams = $.extend({
        showVisibilityCheckbox: true,
        allowActive: true,
        allowDblClick: true,
        showStyle: true,
        visibilityFunc: function(props, isVisible) {
            if (props.name in nsGmx.gmxMap.layersByID) {
                nsGmx.leafletMap[isVisible ? 'addLayer' : 'removeLayer'](nsGmx.gmxMap.layersByID[props.name]);
            }
        }
    }, renderParams);

	// тип узла
	this.type = null;

	// содержимое узла
	this.content = null;

	this.condition = {visible:{},expanded:{}};

	this.mapStyles = {};

	this.groupLoadingFuncs = [];

    this._treeCanvas = null; //контейнер отрисованного дерева слоёв

    this._layerViewHooks = [];
}

layersTree.prototype.addLayerViewHook = function(hook) {
    hook && this._layerViewHooks.push(hook);
}

layersTree.prototype._applyLayerViewHooks = function(div, layerProps) {
    this._layerViewHooks.forEach(function(hook) {
        hook(div, layerProps);
    })
}

// layerManagerFlag == 0 для дерева слева
// layerManagerFlag == 1 для списка слоев
// layerManagerFlag == 2 для списка карт

layersTree.prototype.drawTree = function(tree, layerManagerFlag)
{
	var permalinkParams = this.LayersTreePermalinkParams;

	if (permalinkParams) {
		var tempTree = new nsGmx.LayersTree(tree);

		tempTree.forEachNode(function(elem) {
			var props = elem.content.properties,
			id = elem.type == 'group' ? props.GroupID : props.LayerID;

			if (id in permalinkParams) {
				props.permalinkParams = permalinkParams[id];
			}
		});

		tree = tempTree.getRawTree();
	}

	this._treeCanvas = _ul([this.getChildsList(tree, false, layerManagerFlag, true)], [['dir','className','filetree']]);
    this.treeModel = new nsGmx.LayersTree(tree);
    this._mapTree = tree; //Устарело: используйте this.treeModel для доступа к исходному дереву

    this.treeModel.forEachLayer(function(layerContent, isVisible) {
        layerContent.properties.initVisible = layerContent.properties.visible;
    });

    var _this = this;
    $(this.treeModel).on('nodeVisibilityChange', function(event, elem) {
        var props = elem.content.properties;

        _this.updateVisibilityUI(elem);
        props.changedByViewer = true;

        if (elem.type === 'layer') {
            _this._renderParams.visibilityFunc(props, props.visible);
            $(_this).triggerHandler('layerVisibilityChange', [elem]);
        }
    })

    nsGmx.leafletMap.on('layeradd layerremove', function(event) {
        if (event.layer.getGmxProperties) {
            var name = event.layer.getGmxProperties().name;

            //добавился именно слой из основной карты, а не просто с таким же ID
            if (event.layer === nsGmx.gmxMap.layersByID[name]) {
                var searchRes = _this.treeModel.findElem('name', name);
                if (searchRes && (!layerManagerFlag || layerManagerFlag == 0)) {
                    _this.treeModel.setNodeVisibility(searchRes.elem, nsGmx.leafletMap.hasLayer(event.layer));
                }
            }
        }
    });

    return this._treeCanvas;
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
        // var elemProperties = !layerManagerFlag ? nsGmx.gmxMap.layersByID[elem.content.properties.name].getGmxProperties(): elem.content.properties;

		var elemProperties;
		if (nsGmx.gmxMap.layersByID[elem.content.properties.name]) {
			elemProperties = !layerManagerFlag ? nsGmx.gmxMap.layersByID[elem.content.properties.name].getGmxProperties(): elem.content.properties;
		} else {
			elemProperties = elem.content.properties;
		}

		var childs = this.drawLayer(elemProperties, parentParams, layerManagerFlag, parentVisibility);

		if (typeof elem.content.properties.LayerID != 'undefined')
			div = _div(childs, [['attr','LayerID',elem.content.properties.LayerID]]);
		else if (typeof elem.content.properties.MultiLayerID != 'undefined')
			div = _div(childs, [['attr','MultiLayerID',elem.content.properties.MultiLayerID]]);
        else
            div = _div(childs, [['attr','LayerID',elem.content.properties.name]]);

		div.gmxProperties = elem;
		div.gmxProperties.content.properties = elemProperties;

        this._applyLayerViewHooks(div, elemProperties);
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
	$(this._treeCanvas).find(".active").removeClass("active");

    if (span) {
        $(span.parentNode).addClass("active");
        $(this).triggerHandler("activeNodeChange", [span.parentNode.parentNode]);
    } else {
        $(this).triggerHandler("activeNodeChange", [null]);
    }
}

layersTree.prototype.getActive = function()
{
    var activeDiv = $(this._treeCanvas).find(".active");
    return activeDiv[0] ? activeDiv[0].parentNode : null;
}

layersTree.prototype.getMinLayerZoom = function(layer)
{
    if (!layer.getStyles) {
        return 1;
    }

    var minLayerZoom = 20,
        styles = layer.getStyles();

    for (var i = 0; i < styles.length; i++) {
        minLayerZoom = Math.min(minLayerZoom, styles[i].MinZoom);
    }

    return minLayerZoom;
}

layersTree.prototype.layerZoomToExtent = function(bounds, minZoom)
{
    if (!bounds) return;

    var lmap = nsGmx.leafletMap,
        z = lmap.getBoundsZoom(bounds);

	if (minZoom !== 20) {
		z = Math.max(z, minZoom);
    }

    z = Math.min(lmap.getMaxZoom(), Math.max(lmap.getMinZoom(), z));

    //анимация приводит к проблемам из-за бага https://github.com/Leaflet/Leaflet/issues/3249
    //а указать явно zoom в fitBounds нельзя
    //TODO: enable animation!
    lmap.fitBounds(bounds, {animation: false});

    //если вызывать setZoom всегда, карта начнёт глючить (бага Leaflet?)
    if (z !== lmap.getZoom()) {
        lmap.setZoom(z);
    }
}

layersTree.prototype.drawLayer = function(elem, parentParams, layerManagerFlag, parentVisibility)
{
	var box,
		_this = this;

	if (this._renderParams.showVisibilityCheckbox)
	{
		box = _checkbox(elem.visible, parentParams.list ? 'radio' : 'checkbox', parentParams.GroupID || parentParams.MapID);

		box.className = 'box layers-visibility-checkbox';

		box.setAttribute('box','layer');

		box.onclick = function()
		{
            _this.treeModel.setNodeVisibility(_this.findTreeElem(this.parentNode).elem, this.checked);
		}
	}

	var span = _span([_t(elem.title)], [['dir','className','layer'],['attr','dragg',true]]);

    var timer = null,
        clickFunc = function()
        {
            var treeNode = _this.findTreeElem(span.parentNode.parentNode).elem;
            $(treeNode).triggerHandler('click', [treeNode]);

            if (_this._renderParams.allowActive)
                _this.setActive(span);

            if (_this._renderParams.showVisibilityCheckbox)
            {
                _this.treeModel.setNodeVisibility(treeNode, true);
            }
        },
        dbclickFunc = function()
        {
            var treeNode = _this.findTreeElem(span.parentNode.parentNode).elem;
            var layer = nsGmx.gmxMap.layersByID[elem.name];
            $(treeNode).triggerHandler('dblclick', [treeNode]);
            if (treeNode.content.geometry && layer && layer.getBounds) {
                var minLayerZoom = _this.getMinLayerZoom(layer);
                _this.layerZoomToExtent(layer.getBounds(), minLayerZoom);
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

	var spanParent = _div([span],[['attr','titleDiv',true],['css','display','inline'],['css','position','relative'],['css','borderBottom','none'],['css','paddingRight','3px']]),
		spanDescr = _span(null,[['dir','className','layerDescription']]);

	spanDescr.innerHTML = elem.description ? elem.description : '';

	if (layerManagerFlag == 1)
		return [_img(null, [['attr','src', (elem.type == "Vector") ? 'img/vector.png' : (typeof elem.MultiLayerID != 'undefined' ? 'img/multi.png' : 'img/rastr.png')],['css','marginLeft','3px']]), spanParent, spanDescr];

	if (this._renderParams.showVisibilityCheckbox && !elem.visible) {
		$(spanParent).addClass("invisible");
    }

	nsGmx.ContextMenuController.bindMenuToElem(spanParent, 'Layer', function(){return true;}, {
		layerManagerFlag: layerManagerFlag,
		elem: elem,
		tree: this
	});

    var borderDescr = _span();

    var count = 0;
    var props = {};
    if (elem.MetaProperties)
    {
        for (key in elem.MetaProperties)
        {
            var tagtype = elem.MetaProperties[key].Type;
            props[key] = nsGmx.Utils.convertFromServer(tagtype, elem.MetaProperties[key].Value);
            count++;
        }
    }

    if (count || elem.Legend)
    {
        _(borderDescr, [_t('i')], [['dir','className','layerInfoButton']]);
        borderDescr.onclick = function()
        {
            nsGmx.Controls.showLayerInfo({properties:elem}, {properties: props});
        }
    }

	if (elem.type == "Vector")
	{
		var icon = _mapHelper.createStylesEditorIcon(elem.styles, elem.GeometryType ? elem.GeometryType.toLowerCase() : 'polygon', {addTitle: !layerManagerFlag}),
			multiStyleParent = _div(null,[['attr','multiStyle',true]]),
            iconSpan = _span([icon]);

        if ( elem.styles.length === 1 && elem.name in nsGmx.gmxMap.layersByID )
        {
            var layer = nsGmx.gmxMap.layersByID[elem.name];
            layer.on('stylechange', function() {
                if (layer.getStyles().length === 1)
                {
                    var style = L.gmxUtil.toServerStyle(layer.getStyles()[0].RenderStyle);
                    var newIcon = _mapHelper.createStylesEditorIcon(
                        [{MinZoom:1, MaxZoom: 21, RenderStyle: style}],
                        elem.GeometryType ? elem.GeometryType.toLowerCase() : 'polygon',
                        {addTitle: !layerManagerFlag}
                    );
                    $(iconSpan).empty().append(newIcon);
                }
            });
        }

        $(iconSpan).attr('styleType', $(icon).attr('styleType'));

		_mapHelper.createMultiStyle(elem, this, multiStyleParent, true, layerManagerFlag);

		if (!layerManagerFlag)
		{
			if (!parentVisibility || !elem.visible)
				$(multiStyleParent).addClass("invisible")

			iconSpan.onclick = function()
			{
				if (_queryMapLayers.currentMapRights() == "edit") {
                    nsGmx.createStylesDialog(elem, _this);
                }
			}
		}

        var resElems = [spanParent, spanDescr, borderDescr];

        if (this._renderParams.showStyle) {
            resElems.push(multiStyleParent);
            resElems.unshift(iconSpan);
        }
        this._renderParams.showVisibilityCheckbox && resElems.unshift(box);

        return resElems;
	}
	else
	{
		if (this._renderParams.showVisibilityCheckbox)
			return [box, spanParent, spanDescr, borderDescr];
		else
			return [spanParent, spanDescr, borderDescr];
	}
}

layersTree.prototype.drawGroupLayer = function(elem, parentParams, layerManagerFlag, parentVisibility)
{
	var box,
		_this = this;

	if (this._renderParams.showVisibilityCheckbox)
	{
		box = _checkbox(elem.visible, parentParams.list ? 'radio' : 'checkbox', parentParams.GroupID || parentParams.MapID);

		box.className = 'box layers-visibility-checkbox';

		box.setAttribute('box','group');

		box.onclick = function()
		{
            _this.treeModel.setNodeVisibility(_this.findTreeElem(this.parentNode).elem, this.checked);
		}

		if (typeof elem.ShowCheckbox !== 'undefined' && !elem.ShowCheckbox)
		{
			box.isDummyCheckbox = true;
			box.style.display = 'none';
        }
	}

	var span = _span([_t(elem.title)], [['dir','className','groupLayer'],['attr','dragg',true]]);

    var timer = null,
        clickFunc = function()
        {
            if (_this._renderParams.allowActive)
                _this.setActive(span);

            if (_this._renderParams.showVisibilityCheckbox)
            {
                var div = span.parentNode.parentNode;

                if (div.gmxProperties.content.properties.ShowCheckbox) {
                    _this.treeModel.setNodeVisibility(_this.findTreeElem(div).elem, true);
                }

                var clickDiv = $(div.parentNode).children("div.hitarea");
                if (clickDiv.length)
                    $(clickDiv[0]).trigger("click");
            }
        },
        dbclickFunc = function()
        {
            var childsUl = _abstractTree.getChildsUl(span.parentNode.parentNode.parentNode);

            if (childsUl)
            {
                var bounds = new L.LatLngBounds(),
                    minLayerZoom = 20;

                _mapHelper.findChilds(_this.findTreeElem(span.parentNode.parentNode).elem, function(child)
                {
                    if (child.type == 'layer' && (child.content.properties.LayerID || child.content.properties.MultiLayerID) && child.content.geometry)
                    {
                        	var layer = nsGmx.gmxMap.layersByID[child.content.properties.name];
							bounds.extend(layer.getBounds());

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

	var spanParent = _div([span],[['attr','titleDiv',true],['css','display','inline'],['css','position','relative'],['css','borderBottom','none'],['css','paddingRight','3px']]);

    if (this._renderParams.showVisibilityCheckbox && (!parentVisibility || !elem.visible)) {
        $(spanParent).addClass("invisible");
    }

	if (!layerManagerFlag)
	{

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
    }

    if (this._renderParams.showVisibilityCheckbox)
        return [box, spanParent];
	else
		return [spanParent];
}
layersTree.prototype.drawHeaderGroupLayer = function(elem, parentParams, layerManagerFlag)
{
	var span = _span([_t(elem.title)], [['dir','className','groupLayer']]),
		spanParent = _div([span],[['css','display','inline'],['css','position','relative'],['css','borderBottom','none'],['css','paddingRight','3px']]),
		_this = this;

	if (this._renderParams.allowActive) {
        span.onclick = function()
        {
            _this.setActive(this);
        }
    }

    if (!layerManagerFlag)
    {
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
            }
        );
    }

	return [spanParent];
}

layersTree.prototype.removeGroup = function(div)
{
    var template = Handlebars.compile('<div class="removeGroup-container">' +
        '{{#if anyChildren}}' +
            '<label><input type="checkbox" checked class="removeGroup-layers">{{i "Включая вложенные слои"}}</label><br>' +
        '{{/if}}' +
        '<button class="removeGroup-remove">{{i "Удалить"}}</button>' +
    '</div>');
    var groupNode = _layersTree.treeModel.findElemByGmxProperties(div.gmxProperties).elem;

    var ui = $(template({anyChildren: groupNode.content.children.length > 0})),
        pos = nsGmx.Utils.getDialogPos(div, true, 90),
        _this = this;

    ui.find('.removeGroup-remove').click(function() {
        var parentTree = div.parentNode.parentNode,
            childsUl = _abstractTree.getChildsUl(div.parentNode);

        if (ui.find('.removeGroup-layers').prop('checked')) {
            _layersTree.treeModel.forEachLayer(function(layerContent) {
                _queryMapLayers.removeLayer(layerContent.properties.name);
            }, groupNode);
        } else {
            //TODO: не работает, когда группа не раскрыта или раскрыта не полностью
            var divDestination = $(parentTree.parentNode).children("div[MapID],div[GroupID]")[0];

            if (childsUl) {
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

        $(dialogDiv).dialog('destroy');
        dialogDiv.removeNode(true);

        _mapHelper.updateUnloadEvent(true);

        _this.updateZIndexes();
    });

    var title = _gtxt("Удаление группы [value0]", div.gmxProperties.content.properties.title);
    var dialogDiv = showDialog(title, ui[0], 250, 100, pos.left, pos.top);
}

//по элементу дерева слоёв ищет соответствующий элемент в DOM представлении
layersTree.prototype.findUITreeElem = function(elem)
{
	var props = elem.content.properties,
        searchStr;

	if (props.LayerID)
		searchStr = "div[LayerID='" + props.LayerID + "']";
	else if (props.MultiLayerID)
		searchStr = "div[MultiLayerID='" + props.MultiLayerID + "']";
	else if (props.GroupID)
		searchStr = "div[GroupID='" + props.GroupID + "']";
    else
        searchStr = "div[LayerID='" + props.name + "']";

    return $(this._treeCanvas).find(searchStr)[0];
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

//Устанавливает галочку в checkbox и нужный стиль DOM ноде дерева в зависимости от видимости
//ничего не трогает вне ноды и в самом дереве
layersTree.prototype.updateVisibilityUI = function(elem) {
    var div = this.findUITreeElem(elem);
    if (div) {
        var isVisible = elem.content.properties.visible;
        $(div).children("[titleDiv], [multiStyle]").toggleClass("invisible", !isVisible);
        div.firstChild.checked = isVisible;
    }
}

layersTree.prototype.dummyNode = function(node)
{
	var text = node.innerHTML;

    if (text.length > 40) {
        text = text.substring(0, 37) + '...';
    }

	return div = _div([_t(text)],[['dir','className','dragableDummy']]);
}

//проходится по всем слоям дерева и устанавливает им z-индексы в соответствии с их порядком в дереве
layersTree.prototype.updateZIndexes = function() {
    var curZIndex = 0;

    this.treeModel.forEachLayer(function(layerContent, isVisible, nodeDepth) {
        var layer = nsGmx.gmxMap.layersByID[layerContent.properties.name];

        var zIndex = curZIndex++;
        layer.setZIndex && layer.setZIndex(zIndex);
    })
}

layersTree.prototype.moveHandler = function(spanSource, divDestination)
{
	var node = divDestination.parentNode,
        divSource = spanSource.parentNode.parentNode.parentNode,
		parentTree = divSource.parentNode,
        parentElem = this.findTreeElem($(divSource).children("div[GroupID],div[LayerID],div[MultiLayerID]")[0]).parents[0];

	this.removeTreeElem(spanSource.parentNode.parentNode);
	this.addTreeElem(divDestination, 0, spanSource.parentNode.parentNode.gmxProperties);

	// добавим новый узел
	var childsUl = _abstractTree.getChildsUl(node);

	if (childsUl)
	{
		_abstractTree.addNode(node, divSource);

		this.updateListType(divSource);

		if (!childsUl.loaded)
			divSource.removeNode(true)
	}
	else
	{
		_abstractTree.addNode(node, divSource);

		this.updateListType(divSource);
	}

    parentElem && parentElem.content && this.treeModel.updateNodeVisibility(parentElem);

	// удалим старый узел
	_abstractTree.delNode(node, parentTree, parentTree.parentNode);

	_mapHelper.updateUnloadEvent(true);

    this.updateZIndexes();
}

layersTree.prototype.swapHandler = function(spanSource, divDestination)
{
	var node = divDestination.parentNode,
        divSource = spanSource.parentNode.parentNode.parentNode,
		parentTree = divSource.parentNode,
        parentElem = this.findTreeElem($(divSource).children("div[GroupID],div[LayerID],div[MultiLayerID]")[0]).parents[0];

	if (node == divSource)
		return;

	this.removeTreeElem(spanSource.parentNode.parentNode);

	var divElem = $(divDestination.parentNode).children("div[GroupID],div[LayerID],div[MultiLayerID]")[0],
		divParent = $(divDestination.parentNode.parentNode.parentNode).children("div[MapID],div[GroupID]")[0],
		index = this.findTreeElem(divElem).index;

	this.addTreeElem(divParent, index + 1, spanSource.parentNode.parentNode.gmxProperties);

	_abstractTree.swapNode(node, divSource);

	this.updateListType(divSource);

    parentElem && parentElem.content && this.treeModel.updateNodeVisibility(parentElem);

	// удалим старый узел
	_abstractTree.delNode(node, parentTree, parentTree.parentNode);

	_mapHelper.updateUnloadEvent(true);

    this.updateZIndexes();
}

layersTree.prototype.copyHandler = function(gmxProperties, divDestination, swapFlag, addToMap)
{
    var _this = this;
	var isFromList = typeof gmxProperties.content.geometry === 'undefined';
	var layerProperties = (gmxProperties.type !== 'layer' || !isFromList) ? gmxProperties : false,
		copyFunc = function()
		{
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

                _abstractTree.addNode(node, li);
                _this.updateListType(li, true);

				if (childsUl && !childsUl.loaded)
				{
                    li.removeNode(true)
				}
			}

			_mapHelper.updateUnloadEvent(true);

            _this.updateZIndexes();
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
					layerProperties.content.properties.styles = [{MinZoom:1, MaxZoom:21, RenderStyle: layerProperties.content.properties.IsPhotoLayer ? _mapHelper.defaultPhotoIconStyles[layerProperties.content.properties.GeometryType] : _mapHelper.defaultStyles[layerProperties.content.properties.GeometryType]}]
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

//не работает для мультислоёв
layersTree.prototype.addLayerToTree = function(layerName) {
    var gmxProperties = {
        type: 'layer',
        content: {
            properties: {
                LayerID: layerName,
                name: layerName
            }
        }
    };

    var targetDiv = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0];

    this.copyHandler(gmxProperties, targetDiv, false, true);
}

//геометрия слоёв должна быть в координатах меркатора
layersTree.prototype.addLayersToMap = function(elem)
{
	var DEFAULT_VECTOR_LAYER_ZINDEXOFFSET = 2000000;

	var layerOrder = nsGmx.gmxMap.rawTree.properties.LayerOrder,
		currentZoom = nsGmx.leafletMap.getZoom();

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

        if (!nsGmx.gmxMap.layersByID[name])
        {
			var visibility = typeof layer.properties.visible != 'undefined' ? layer.properties.visible : false,
				rcMinZoom = layer.properties.RCMinZoomForRasters,
            	layerOnMap = L.gmx.createLayer(layer, {
            		layerID: name,
            		hostName: window.serverBase,
					zIndexOffset: null,
					srs: nsGmx.leafletMap.options.srs || '',
					skipTiles: nsGmx.leafletMap.options.skipTiles || '',
					isGeneralized: window.mapOptions && 'isGeneralized' in window.mapOptions ? window.mapOptions.isGeneralized : true
            });

			updateZIndex(layerOnMap);
            nsGmx.gmxMap.addLayer(layerOnMap);

            visibility && nsGmx.leafletMap.addLayer(layerOnMap);

            layerOnMap.getGmxProperties().changedByViewer = true;

			nsGmx.leafletMap.on('zoomend', function(e) {
				currentZoom = nsGmx.leafletMap.getZoom();

				for (var l = 0; l < nsGmx.gmxMap.layers.length; l++) {
					var layer = nsGmx.gmxMap.layers[l];

					updateZIndex(layer);
				}
			});
        }
        else
        {
            showErrorMessage( _gtxt("Слой '[value0]' уже есть в карте", nsGmx.gmxMap.layersByID[name].getGmxProperties().title), true );
            return false;
        }
    }

	function updateZIndex (layer) {
		var props = layer.getGmxProperties();

        switch (layerOrder) {
            case 'VectorOnTop':
            if (props.type === 'Vector') {
                if (props.IsRasterCatalog) {
                    var rcMinZoom = props.RCMinZoomForRasters;
                    layer.setZIndexOffset(currentZoom < rcMinZoom ? DEFAULT_VECTOR_LAYER_ZINDEXOFFSET : 0);
                } else {
                    layer.setZIndexOffset(DEFAULT_VECTOR_LAYER_ZINDEXOFFSET);
                }
            }
            break;
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
		newBox = _checkbox(
            box.checked,
            listFlag ? 'radio' : 'checkbox',
            parentParams.content ? parentParams.content.properties.GroupID : parentParams.properties.MapID
        ),
		_this = this;

	newBox.className = 'box layers-visibility-checkbox';

	if (box.getAttribute('box') == 'group')
		newBox.setAttribute('box', 'group');

	$(box).replaceWith(newBox);

	newBox.onclick = function()
	{
		_this.treeModel.setNodeVisibility(_this.findTreeElem(this.parentNode).elem, this.checked);
	}

	if ( box.isDummyCheckbox )
	{
		newBox.isDummyCheckbox = true;
		newBox.style.display = 'none';
	}

	if (!skipVisible)
	{
        var parentDiv = $(newBox.parentNode.parentNode.parentNode.parentNode).children("div[GroupID]")[0];
        parentDiv && this.treeModel.updateNodeVisibility(this.findTreeElem(parentDiv).elem, this.findTreeElem(newBox.parentNode).elem);
	}

	return newBox;
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
		return this.treeModel.findElem("name", div.getAttribute("LayerID"));
	else if (div.getAttribute("MultiLayerID"))
		return this.treeModel.findElem("name", div.getAttribute("MultiLayerID"));
}

//Дерево основной карты
var _layersTree = new layersTree({showVisibilityCheckbox: true, allowActive: true, allowDblClick: true});

window.layersTree = layersTree;
window._layersTree = _layersTree;

//Виджет в левой панели для отображения основного дерева
var queryMapLayers = function()
{
	this.buildedTree = null;
	this.builded = false;

	this.buttonsCanvas = _div();

    this.loadDeferred = $.Deferred();
}

queryMapLayers.prototype = new leftMenu();

queryMapLayers.prototype.addLayers = function(data, condition, mapStyles, LayersTreePermalinkParams)
{
	if (condition)
		_layersTree.condition = condition;

	if (mapStyles)
		_layersTree.mapStyles = mapStyles;

	if (LayersTreePermalinkParams)
		_layersTree.LayersTreePermalinkParams = LayersTreePermalinkParams;

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
        var props = elem.content.properties;
		if (elem.type == 'group')
		{
			var groupId = props.GroupID;

			if (typeof condition.visible[groupId] != 'undefined' && props.visible != condition.visible[groupId])
			{
				props.visible = condition.visible[groupId];

				var group = $(_this.buildedTree).find("div[GroupID='" + groupId + "']");

				if (group.length)
					group[0].firstChild.checked = condition.visible[groupId];
			}

			if (typeof condition.expanded[groupId] != 'undefined' && props.expanded != condition.expanded[groupId])
			{
				props.expanded = condition.expanded[groupId];

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
            var name = props.name;
			if (typeof condition.visible[name] != 'undefined') {
                _layersTree.treeModel.setNodeVisibility(elem, condition.visible[name]);
			} else {
                _layersTree.treeModel.setNodeVisibility(elem, props.initVisible);
            }

			if (props.type == "Vector" && typeof mapLayersParam != 'undefined' &&  typeof mapLayersParam[name] != 'undefined' &&
				!_this.equalStyles(props.styles, mapLayersParam[name]))
			{
				// что-то менялось в стилях
				var newStyles = mapLayersParam[name],
					div = $(_this.buildedTree).find("div[LayerID='" + props.LayerID + "']")[0];

                props.styles = newStyles;

                _mapHelper.updateMapStyles(newStyles, name);
                props.changedByViewer = true;

                div && _mapHelper.updateTreeStyles(newStyles, div, _layersTree, true);
			}
		}
	}, visFlag)
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

queryMapLayers.prototype.getContainerBefore = function() {
    if (!this.builded) return;

    return $('.layers-before', this.workCanvas).show();
}

queryMapLayers.prototype.getContainerAfter = function() {
    if (!this.builded) return;

    return $('.layers-after', this.workCanvas).show();
}

queryMapLayers.prototype.load = function(data)
{
	if (this.buildedTree && !this.builded)
	{
		var _this = this;

		this.treeCanvas = _div(null, [['dir', 'className', 'layers-tree']]);

        //Для обратной совместимости - есть много мапплетов карт, которые пытаются интегрироваться после первого table
        //TODO: изнечтожить все такие мапплеты
        _(this.workCanvas, [_table()]);

		_(this.workCanvas, [
            _div([
                //_table([_tbody([_tr([_td([_span([_t(_gtxt("Шкала прозрачности"))],[['css','marginLeft','7px'],['css','color','#153069'],['css','fontSize','12px']])]), _td([this.rasterLayersSlider(_queryMapLayers.treeCanvas)])])])])
            ], [['dir', 'className', 'layers-before'], ['css', 'display', 'none']])
        ]);

		_(this.workCanvas, [this.treeCanvas]);

		_(this.treeCanvas, [this.buildedTree]);

		_(this.workCanvas, [
            _div([
                //_table([_tbody([_tr([_td([_span([_t(_gtxt("Шкала прозрачности"))],[['css','marginLeft','7px'],['css','color','#153069'],['css','fontSize','12px']])]), _td([this.rasterLayersSlider(_queryMapLayers.treeCanvas)])])])])
            ], [['dir', 'className', 'layers-after'], ['css', 'display', 'none']])
        ]);

		$(this.buildedTree).treeview();

		_layersTree.runLoadingFuncs();

		_layersTree.addExpandedEvents(this.buildedTree);

        //при клике на любом пустом месте дерева слоёв снимаем выделение
        $(this.treeCanvas).click(function(event) {
            var t = $(event.target);
            //все элементы, на которых можно кликнуть без снятия выделения
            if (t.hasClass('hitarea') || t.hasClass('groupLayer') || t.attr('styletype') || t.parents('div[layerid],div[MultiLayerID]').length) {
                return;
            }
            _layersTree.setActive(null);
        });

        $(this.treeCanvas).droppable({
            accept: "span[dragg]",
            drop: function(ev, ui) {
                queryMapLayers._droppableHandler.bind($(_this.buildedTree).find('[mapid]')[0], ev, ui)();
            }
        })

		this.applyState(_layersTree.condition, _layersTree.mapStyles);

		this.builded = true;

        $(this).triggerHandler('load');
        this.loadDeferred.resolve();
	}
}

queryMapLayers.prototype.applyOpacityToRasterLayers = function(opacity, parent) {

    var active = $(parent).find(".active");

    // слой
    if (active[0] && (active[0].parentNode.getAttribute("LayerID") || active[0].parentNode.getAttribute("MultiLayerID")))
    {
        var props = active[0].parentNode.gmxProperties.content.properties,
            layer = nsGmx.gmxMap.layersByID[props.name];

        layer.setRasterOpacity && layer.setRasterOpacity(opacity/100);

        return;
    }

    if (active.length) {
        // группа или карта
        var treeElem = _layersTree.findTreeElem(active[0].parentNode);

        _mapHelper.findChilds(treeElem.elem, function(child)
        {
            var props = child.content.properties;
            var layer = nsGmx.gmxMap.layersByID[props.name];
            layer.setRasterOpacity && layer.setRasterOpacity(opacity/100);
        }, true);
    } else {
        // все растровые слои
        var layers = nsGmx.gmxMap.layers;
        for (var i = 0; i < layers.length; i++) {
            layers[i].setRasterOpacity && layers[i].setRasterOpacity(opacity/100);
        }
    }
}

queryMapLayers.prototype.rasterLayersSlider = function(parent)
{
	var slider = nsGmx.Controls.createSlider(100,
			function(event, ui)
			{
				_queryMapLayers.applyOpacityToRasterLayers(ui.value, parent);
			}),
		elem = _div([slider], [['css','width','120px']]);

	slider.style.margin = '10px';
	slider.style.backgroundColor = '#F4F4F4';

	_title(slider, _gtxt("Прозрачность выбранного слоя/группы/карты"));

	return _div([elem],[['css','padding','5px 0px 0px 15px']]);
}

queryMapLayers.prototype.currentMapRights = function()
{
    var mapProperties = _layersTree.treeModel && _layersTree.treeModel.getMapProperties();
	return mapProperties ? mapProperties.Access : "none";
}

queryMapLayers.prototype.layerRights = function(name)
{
    var layer = nsGmx.gmxMap.layersByID[name];
	return layer ? layer.getGmxProperties().Access : null;
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

queryMapLayers._droppableHandler = function(ev, ui)
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
        if (this == $('#layersList')[0] || this == $('#mapsList')[0] || this == $('#externalMapsCanvas')[0] )
            layerManager = true;

        if ( this == $('#externalMapsCanvas')[0] )
            isFromExternalMaps = true;
    })

    if (!layerManager)
        _layersTree.moveHandler(ui.draggable[0], this)
    else
        _layersTree.copyHandler(ui.draggable[0].parentNode.parentNode.gmxProperties, this, false, !isFromExternalMaps)
}

queryMapLayers.prototype.addDroppable = function(parent)
{
	$(parent).find("div[GroupID],div[MapID]").droppable({
        accept: "span[dragg]",
        hoverClass: 'droppableHover',
        greedy: true,
        drop: queryMapLayers._droppableHandler
    })

    $(parent).find("div[LayerID],div[MultiLayerID]").droppable({
        accept: "span[dragg]",
        greedy: true,
        drop: function(ev, ui) {
            var swapElem = $(this).next();
            swapElem.removeClass('swap-droppableHover');
            queryMapLayers._swapHandler.call(swapElem[0], ev, ui);
        },
        over: function(ev, ui) {
            $(this).next().addClass('swap-droppableHover');
        },
        out: function(ev, ui) {
            $(this).next().removeClass('swap-droppableHover');
        }
    })
}
queryMapLayers.prototype.removeDroppable = function(parent)
{
	$(parent).find("div[GroupID],div[MapID]").droppable('destroy');
}

//статическая ф-ция
queryMapLayers._swapHandler = function(ev, ui)
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
        if ( this == $('#layersList')[0] || this == $('#mapsList')[0] || this == $('#externalMapsCanvas')[0] )
            layerManager = true;

        if ( this == $('#externalMapsCanvas')[0] )
            isFromExternalMaps = true;
    })

    var gmxProperties = ui.draggable[0].parentNode.parentNode.gmxProperties;

    if (!layerManager)
        _layersTree.swapHandler(ui.draggable[0], this)
    else
        _layersTree.copyHandler(gmxProperties, this, true, !isFromExternalMaps)
}

queryMapLayers.prototype.addSwappable = function(parent)
{
	$(parent).find("div[swap]").droppable({accept: "span[dragg]", hoverClass: 'swap-droppableHover', greedy: true, drop: queryMapLayers._swapHandler})
}
queryMapLayers.prototype.removeSwappable = function(parent)
{
	$(parent).find("div[swap]").droppable('destroy');
}

queryMapLayers.prototype.asyncCreateLayer = function(promise, title)
{
    var _this = this;

    var taskDiv = _div(),
        active = $(_this.buildedTree).find(".active")[0],
        parentDiv;

    if (active && (active.parentNode.getAttribute('MapID') || active.parentNode.getAttribute('GroupID')))
        parentDiv = active.parentNode.parentNode;
    else
        parentDiv = _this.buildedTree.firstChild;

    _abstractTree.addNode(parentDiv, _li([taskDiv, _div(null,[['css','height','5px'],['css','fontSize','0px']])]));

    promise.fail(function(taskInfo)
    {
        var parentTree = taskDiv.parentNode.parentNode;
        taskDiv.parentNode.removeNode(true);
        _abstractTree.delNode(null, parentTree, parentTree.parentNode);
	}).done(function(taskInfo)
    {
        if (!$.isArray(taskInfo.Result)) {
            taskInfo.Result = [taskInfo.Result];
        }

        var parentDiv = $(taskDiv.parentNode.parentNode.parentNode).children("div[GroupID],div[MapID]")[0],
            parentProperties = parentDiv.gmxProperties;

        var parentTree = taskDiv.parentNode.parentNode;
        taskDiv.parentNode.removeNode(true);
        _abstractTree.delNode(null, parentTree, parentTree.parentNode);

        for (var l = 0; l < taskInfo.Result.length; l++) {
            var newLayer = taskInfo.Result[l];
            var newProps = newLayer.properties;

            var mapProperties = _layersTree.treeModel.getMapProperties();
            newProps.mapName = mapProperties.name;
            newProps.hostName = mapProperties.hostName;
            newProps.visible = true;

            if (!newProps.styles)
            {
                if (newProps.type == 'Vector')
                    newProps.styles = [{MinZoom:1, MaxZoom:21, RenderStyle: newProps.IsPhotoLayer ? _mapHelper.defaultPhotoIconStyles[newProps.GeometryType] : _mapHelper.defaultStyles[newProps.GeometryType]}]
                else if (newProps.type != 'Vector' && !newProps.MultiLayerID)
                    newProps.styles = [{MinZoom: newProps.MinZoom, MaxZoom: 21}];
            }

            var convertedCoords = newLayer.geometry ? L.gmxUtil.convertGeometry(newLayer.geometry, true) : null;

            _layersTree.addLayersToMap({content:{properties: newProps, geometry: newLayer.geometry}});

            var li = _layersTree.getChildsList(
                    {
                        type: 'layer',
                        content: {properties:newProps, geometry:convertedCoords}
                    },
                    parentProperties,
                    false,
                    parentDiv.getAttribute('MapID') ? true : _layersTree.getLayerVisibility(parentDiv.firstChild)
                );

            _abstractTree.addNode(parentDiv.parentNode, li);

            var divElem = $(li).children("div[LayerID]")[0],
                divParent = $(li.parentNode.parentNode).children("div[MapID],div[GroupID]")[0];

            _layersTree.addTreeElem(divParent, 0, {type:'layer', content: {properties: newProps, geometry: convertedCoords}});

            _queryMapLayers.addSwappable(li);

            _queryMapLayers.addDraggable(li);

            _layersTree.updateListType(li);
        }

		_mapHelper.updateUnloadEvent(true);
        _layersTree.updateZIndexes();
    }).progress(function(taskInfo)
	{
        $(taskDiv).empty();
		_(taskDiv, [_span([_t(title + ':')], [['css','color','#153069'],['css','margin','0px 3px']]), _t(taskInfo.Status)])
	})
}

queryMapLayers.prototype.asyncUpdateLayer = function(promise, properties, recreateLayer)
{
    var layerDiv = $(_queryMapLayers.buildedTree).find("[LayerID='" + properties.LayerID + "']")[0],
        _this = this;

    promise
        .done(function(taskInfo)
        {
            if (recreateLayer)
            {
                var newLayerProperties = taskInfo.Result.properties;

                var mapProperties = _layersTree.treeModel.getMapProperties();
                newLayerProperties.mapName = mapProperties.name;
                newLayerProperties.hostName = mapProperties.hostName;
                newLayerProperties.visible = layerDiv.gmxProperties.content.properties.visible;

                newLayerProperties.styles = layerDiv.gmxProperties.content.properties.styles;

                //var convertedCoords = from_merc_geometry(taskInfo.Result.geometry);
                var origGeometry = taskInfo.Result.geometry,
                    convertedGeometry = origGeometry ? L.gmxUtil.geometryToGeoJSON(origGeometry, true) : null;

                _this.removeLayer(newLayerProperties.name);

                _layersTree.addLayersToMap({content: {properties: newLayerProperties, geometry: origGeometry}});

                var parentProperties = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0].gmxProperties,
                    li = _layersTree.getChildsList({type:'layer', content:{properties:newLayerProperties, geometry:convertedGeometry}}, parentProperties, false, _layersTree.getLayerVisibility(layerDiv.firstChild));

                $(li).find('[multiStyle]').treeview();

                $(layerDiv.parentNode).replaceWith(li);

                _layersTree.findTreeElem($(li).children("div[LayerID]")[0]).elem = {type:'layer', content:{properties: newLayerProperties, geometry: convertedGeometry}}

                _queryMapLayers.addSwappable(li);

                _queryMapLayers.addDraggable(li);

                _layersTree.updateListType(li);
                _layersTree.updateZIndexes();
            }
            else
            {
                $('#' + taskInfo.TaskID).remove();

                layerDiv.style.display = '';
            }
        }).fail(function(taskInfo)
        {
            $('#' + taskInfo.TaskID).remove();
            layerDiv.style.display = '';
        }).progress(function(taskInfo)
        {
            var taskDiv;

            if (!$('#' + taskInfo.TaskID).length)
            {
                taskDiv = _div(null, [['attr','id',taskInfo.TaskID]]);

                layerDiv.style.display = 'none';

                $(layerDiv).before(taskDiv);
            }
            else
            {
                taskDiv = $('#' + taskInfo.TaskID)[0];

                $(taskDiv).empty();
            }

            _(taskDiv, [_span([_t(properties.Title + ':')], [['css','color','#153069'],['css','margin','0px 3px']]), _t(taskInfo.Status)]);
        })
}

queryMapLayers.prototype.asyncCopyLayer = function(promise, title) {
	console.log('layer copied');

	var _this = this;

    var taskDiv = _div(),
        active = $(_this.buildedTree).find(".active")[0],
        parentDiv;

    if (active && (active.parentNode.getAttribute('MapID') || active.parentNode.getAttribute('GroupID')))
        parentDiv = active.parentNode.parentNode;
    else
        parentDiv = _this.buildedTree.firstChild;

    _abstractTree.addNode(parentDiv, _li([taskDiv, _div(null,[['css','height','5px'],['css','fontSize','0px']])]));

    promise.fail(function(taskInfo)
    {
		console.log('failed');
        var parentTree = taskDiv.parentNode.parentNode;
        taskDiv.parentNode.removeNode(true);
        _abstractTree.delNode(null, parentTree, parentTree.parentNode);
	}).done(function(taskInfo)
    {
		console.log('ok');
        if (!$.isArray(taskInfo.Result)) {
            taskInfo.Result = [taskInfo.Result];
        }

        var parentDiv = $(taskDiv.parentNode.parentNode.parentNode).children("div[GroupID],div[MapID]")[0],
            parentProperties = parentDiv.gmxProperties;

        var parentTree = taskDiv.parentNode.parentNode;
        taskDiv.parentNode.removeNode(true);
        _abstractTree.delNode(null, parentTree, parentTree.parentNode);

        for (var l = 0; l < taskInfo.Result.length; l++) {
            var newLayer = taskInfo.Result[l];
            var newProps = newLayer.properties;

            var mapProperties = _layersTree.treeModel.getMapProperties();
            newProps.mapName = mapProperties.name;
            newProps.hostName = mapProperties.hostName;
            newProps.visible = true;

            if (!newProps.styles)
            {
                if (newProps.type == 'Vector')
                    newProps.styles = [{MinZoom:1, MaxZoom:21, RenderStyle: newProps.IsPhotoLayer ? _mapHelper.defaultPhotoIconStyles[newProps.GeometryType] : _mapHelper.defaultStyles[newProps.GeometryType]}]
                else if (newProps.type != 'Vector' && !newProps.MultiLayerID)
                    newProps.styles = [{MinZoom: newProps.MinZoom, MaxZoom: 21}];
            }

            var convertedCoords = newLayer.geometry ? L.gmxUtil.convertGeometry(newLayer.geometry, true) : null;

            _layersTree.addLayersToMap({content:{properties: newProps, geometry: newLayer.geometry}});

            var li = _layersTree.getChildsList(
                    {
                        type: 'layer',
                        content: {properties:newProps, geometry:convertedCoords}
                    },
                    parentProperties,
                    false,
                    parentDiv.getAttribute('MapID') ? true : _layersTree.getLayerVisibility(parentDiv.firstChild)
                );

            _abstractTree.addNode(parentDiv.parentNode, li);

            var divElem = $(li).children("div[LayerID]")[0],
                divParent = $(li.parentNode.parentNode).children("div[MapID],div[GroupID]")[0];

            _layersTree.addTreeElem(divParent, 0, {type:'layer', content: {properties: newProps, geometry: convertedCoords}});

            _queryMapLayers.addSwappable(li);

            _queryMapLayers.addDraggable(li);

            _layersTree.updateListType(li);
        }

		_mapHelper.updateUnloadEvent(true);
        _layersTree.updateZIndexes();
    }).progress(function(taskInfo)
	{
		console.log('progress');
        $(taskDiv).empty();
		_(taskDiv, [_span([_t(title + ':')], [['css','color','#153069'],['css','margin','0px 3px']]), _t(taskInfo.Status)])
	}).always(function(taskInfo){
		console.log(taskInfo);
	})
}

queryMapLayers.prototype.removeLayer = function(name)
{
    var layer = nsGmx.gmxMap.layersByID[name];
    if (layer) {
        nsGmx.leafletMap.removeLayer(layer);
        nsGmx.gmxMap.removeLayer(layer);
    }
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
    for (var i = 0; i < nsGmx.gmxMap.layers.length; i++)
        existLayers.push(nsGmx.gmxMap.layers[i].getGmxProperties().name);

    layerManagerControl.disableLayers(existLayers);

	var dialogDiv = showDialog(_gtxt("Список слоев"), canvas, 571, 485, 535, 130, function(size) {
        layerManagerControl.resize(size.height - 55);
    });
}

queryMapLayers.prototype.getMaps = function()
{
	if (!$('#mapsList').length)
        new nsGmx.MapsManagerControl();
}

queryMapLayers.prototype.createMapDialog = function(title, buttonName, func, addLink)
{
	var uiTemplate = Handlebars.compile(
        '<div class = "createMap-container">' +
            '<input class = "inputStyle inputFullWidth createMap-input">' +
            '<button class = "createMap-button">{{buttonName}}</button>' +
        '</div>');

    var ui = $(uiTemplate({buttonName: buttonName})),
        input = $('.createMap-input', ui)[0];

    var tryCreateMap = function() {
        input.focus();
        if (input.value != '') {
            removeDialog(dialogDiv);
            func(input.value);
        } else {
            inputError(input);
        }
    }

	$(input, ui).on('keydown', function(e) {
	  	if (e.keyCode === 13) {
            tryCreateMap();
	  		return false;
	  	}
	})

	$('.createMap-button', ui).click(tryCreateMap)

	addLink && ui.append(addLink);

	var dialogDiv = showDialog(title, ui[0], 280, 115 + (addLink ? 20 : 0), false, false);
}

queryMapLayers.prototype.createMap = function(name)
{
	sendCrossDomainJSONRequest(serverBase + 'Map/Insert.ashx?WrapStyle=func&Title=' + encodeURIComponent(name), function(response)
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
        var mapID = String($(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.MapID),
            saveTree = {};

        window._mapEditorsHash && _mapEditorsHash[mapID] && _mapEditorsHash[mapID].update();

        //обновим стили слоёв из всех незакрытых диалогов редактирования стилей
        var mStyleEditor = gmxCore.getModule('LayerStylesEditor');
        mStyleEditor && mStyleEditor.updateAllStyles();

        nsGmx.userObjectsManager.collect();
        $(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.UserData = JSON.stringify(nsGmx.userObjectsManager.getData());

        $.extend(true, saveTree, _layersTree.treeModel.getRawTree());

        var attributesToSave = ['visible', 'styles', 'AllowSearch', 'TiledQuicklook', 'TiledQuicklookMinZoom', 'name', 'MapStructureID'];
        saveTree.properties.BaseLayers = JSON.stringify(nsGmx.leafletMap.gmxBaseLayersManager.getActiveIDs());

        //раскрываем все группы так, как записано в свойствах групп
        _mapHelper.findTreeElems(saveTree, function(child, flag)
        {
            var props = child.content.properties;
            if (child.type === "group") {
                props.expanded = typeof props.initExpand !== 'undefined' ? props.initExpand : false;
                delete props.initVisible;
                delete props.initExpand;
            } else {
                var propsToSave = {};
                for (var i = 0; i < attributesToSave.length; i++) {
                    var attrName = attributesToSave[i];
                    if (attrName in props) {
                        propsToSave[attrName] = props[attrName];
                    }
                }

                var styles = props.styles || [];

                for (var s = 0; s < styles.length; s++) {
                    delete styles[s].HoverStyle;
                }

                child.content.properties = propsToSave;
                delete child.content.geometry;
            }
        }, true);

        var params = {
                WrapStyle: 'window',
                MapID: mapID,

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

                nsGmx.widgets.notifications.stopAction('saveMap', 'success', _gtxt("Сохранено"));
            }
        )
    }

    queryMapLayers.prototype.saveMap = function()
    {
        nsGmx.widgets.notifications.startAction('saveMap');
		saveMapInternal("Map/SaveMap.ashx", null);
    }

    queryMapLayers.prototype.saveMapAs = function(name)
    {
        nsGmx.widgets.notifications.startAction('saveMap');
        saveMapInternal("Map/SaveAs.ashx", name);
    }

})();

var _queryMapLayers = new queryMapLayers();
window._queryMapLayers = _queryMapLayers;

mapLayers.mapLayers.load = function()
{
	var alreadyLoaded = _queryMapLayers.createWorkCanvas('layers', {
            path: null,
            showCloseButton: false,
            showMinimizeButton: false
        });

	if (!alreadyLoaded)
		_queryMapLayers.load()
}
mapLayers.mapLayers.unload = function()
{
}

})(nsGmx.Utils._);
