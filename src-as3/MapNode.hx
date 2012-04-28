import flash.display.Sprite;
import flash.external.ExternalInterface;
import flash.events.Event;

class MapNode
{
	public static var allNodes:Hash<MapNode> = new Hash<MapNode>();

	public var id:String;
	public var parent:MapNode;
	public var window:MapWindow;
	public var rasterSprite:Sprite;
	public var vectorSprite:Sprite;
	public var regularStyle:Style;
	public var hoveredStyle:Style;
	public var hidden:Bool;
	public var minZ:Int;
	public var maxZ:Int;
	public var content:MapContent;
	public var children:Array<MapNode>;
	public var handlers:Hash<MapNode->MapNode->Void>;
	public var properties:Dynamic;
	public var propHash:Hash<String>;
	public var propHiden:Hash<Dynamic>;		// внутренние свойства ноды

	public var filters:Hash<MapNode>;
	
	public var somethingHasChanged:Bool;

	public function new(rasterSprite_:Sprite, vectorSprite_:Sprite, window_:MapWindow)
	{
		id = Utils.getNextId();
		allNodes.set(id, this);
		window = window_;
		rasterSprite = rasterSprite_;
		vectorSprite = vectorSprite_;
vectorSprite.cacheAsBitmap = true;		// Баг SWF при представлении векторов в растр
		regularStyle = null;
		hoveredStyle = null;
		hidden = false;
		minZ = 0;
		maxZ = 100;
		content = null;
		children = new Array<MapNode>();
		handlers = new Hash<MapNode->MapNode->Void>();
		filters = new Hash<MapNode>();
		propHiden = new Hash<Dynamic>();

		somethingHasChanged = false;
	}

	public function addChild()
	{
		var child:MapNode = new MapNode(Utils.addSprite(rasterSprite), Utils.addSprite(vectorSprite), window);
		child.parent = this;
		var st:String = propHiden.get('type');
		if (st == 'FRAME' || st == 'FRAMECHILD') propHiden.set('type', 'FRAMECHILD');
		children.push(child);
		return child;
	}

	public function remove()
	{
		content.contentSprite.parent.removeChild(content.contentSprite);
		//rasterSprite.parent.removeChild(rasterSprite);
		//vectorSprite.parent.removeChild(vectorSprite);
		noteSomethingHasChanged();
		for (child in children)
			child.remove();
		if (parent != null) {
			parent.children.remove(this);
			parent.noteSomethingHasChanged();
		}
		allNodes.remove(id);
	}
	
	public function setAPIProperties(attr:Dynamic):Bool
	{
		for (key in Reflect.fields(attr)) {
			propHiden.set(key, cast(Reflect.field(attr, key)));
		}
		return true;
	}

	public function getRegularStyle()
	{
		return 
			(regularStyle != null) ?
				regularStyle :
			(parent != null) ?
				parent.getRegularStyle() :
				null;
	}

	// Получить regularStyle с учетом фильтров по ветке родителей
	public function getRegularStyleRecursion(?node:MapNode)
	{
		if (node == null) node = this;
		var retStyle = null;
		if(propHash != null) {
			for (key in node.filters.keys()) {
				var nodeFilter = node.filters.get(key);
				var nodeFilterContent = cast(nodeFilter.content, VectorLayerFilter);
				if (nodeFilterContent.criterion(propHash)) {
					retStyle = nodeFilter.regularStyle;
					return retStyle;
				}
			}
		}
		if (retStyle == null) retStyle = node.regularStyle;
		if (retStyle == null && node.parent != null) {
			retStyle = getRegularStyleRecursion(node.parent);
		}
		return retStyle;
	}

	// Получить hoveredStyle с учетом фильтров по ветке родителей
	public function getHoveredStyleRecursion(?node:MapNode)
	{
		if (node == null) node = this;
		var retStyle = null;
		if(propHash != null) {
			for (key in node.filters.keys()) {
				var nodeFilter = node.filters.get(key);
				var nodeFilterContent = cast(nodeFilter.content, VectorLayerFilter);
				if (nodeFilterContent.criterion(propHash)) {
					retStyle = nodeFilter.hoveredStyle;
					return retStyle;
				}
			}
		}
		if (retStyle == null) retStyle = node.hoveredStyle;
		if (retStyle == null && node.parent != null) {
			retStyle = getHoveredStyleRecursion(node.parent);
		}
		return retStyle;
	}
	
	// Получить Style с учетом фильтров по ветке родителей
	public function getVisibleStyle()
	{
		var res: Dynamic = {};
		res.regular = getRegularStyleRecursion();
		res.hovered = getHoveredStyleRecursion();
		return res;
	}

	public function getHoveredStyle()
	{
		return 
			(hoveredStyle != null) ?
				hoveredStyle :
			(regularStyle != null) ?
				regularStyle :
			(parent != null) ?
				parent.getHoveredStyle() :
				null;
	}

	public function setVisible(flag:Bool)
	{
		hidden = !flag;
		noteSomethingHasChanged();
	}

	public function getZoomBounds()
	{
		var out:Dynamic = { };
		out.MinZoom = minZ;
		out.MaxZoom = maxZ;
		return out;
	}

	public function setZoomBounds(minZ_, maxZ_)
	{
		var out:Dynamic = { };
		minZ = minZ_;
		maxZ = maxZ_;
		out.MinZoom = minZ;
		out.MaxZoom = maxZ;
		noteSomethingHasChanged();
		if (parent != null && parent.filters.exists(id)) {
			var minZoom = 20, maxZoom = 0;
			for (key in parent.filters.keys()) {
				var nodeFilter = parent.filters.get(key);
				minZoom = cast(Math.min(nodeFilter.minZ, minZoom));
				maxZoom = cast(Math.max(nodeFilter.maxZ, maxZoom));
			}
			parent.minZ = minZoom;
			parent.maxZ = maxZoom;
			parent.noteSomethingHasChanged();
			var out1:Dynamic = { };
			out1.id = parent.id;
			out1.MinZoom = minZoom;
			out1.MaxZoom = maxZoom;
			out.parent = out1;
		}
		return out;
	}

	public function setStyle(regularStyle_:Style, ?hoveredStyle_:Style)
	{
		noteSomethingHasChanged();
		var me = this;
		var regularFinished = false;
		var hoveredFinished = false;
		var finish = function()
		{
			if (regularFinished && hoveredFinished)
			{
				me.regularStyle = regularStyle_;
				me.hoveredStyle = hoveredStyle_;
				me.updateHandCursor();
				me.noteSomethingHasChanged();
			}
		}
		var finishRegular = function()
		{
			regularFinished = true;
			finish();
		}
		var finishHovered = function()
		{
			hoveredFinished = true;
			finish();
		}
		if (regularStyle_ != null)
			regularStyle_.load(finishRegular);
		else
			finishRegular();
		if (hoveredStyle_ != null)
			hoveredStyle_.load(finishHovered);
		else
			finishHovered();
	}
	
	public function getStyle(removeDefaults:Bool)
	{
		var res: Dynamic = {};
		if (regularStyle != null) res.regular = regularStyle.getStyle(removeDefaults);
		if (hoveredStyle != null) res.hovered = hoveredStyle.getStyle(removeDefaults);
		return res;
	}

	public function updateHandCursor()
	{
		var flag:Bool = (hoveredStyle != null) || (getHandler("onClick") != null);
		if (vectorSprite.buttonMode != flag) vectorSprite.buttonMode = vectorSprite.useHandCursor = flag;
	}

	public function setContent(content_:MapContent)
	{
		var oldContent = content;
		content = content_;
		
		var regularStyleOrig:Style = null;
		var hoverStyleOrig:Style = null;

		if (oldContent != null) {
			if (Std.is(oldContent, VectorLayerFilter))
			{
				var vlf:VectorLayerFilter = cast(oldContent, VectorLayerFilter);
				regularStyleOrig = vlf.regularStyleOrig;
				hoverStyleOrig = vlf.hoverStyleOrig;
			}

			oldContent.contentSprite.parent.removeChild(oldContent.contentSprite);
			if (parent != null && parent.filters.exists(id))
			{
				parent.filters.remove(id);
			}
		}
		if (content != null) {
			content.initialize(this);
			if (parent != null && Std.is(content, VectorLayerFilter))
			{
				parent.filters.set(id, this);
				var vlf:VectorLayerFilter = cast(content, VectorLayerFilter);
				if(regularStyleOrig != null) vlf.regularStyleOrig = regularStyleOrig;
				if(hoverStyleOrig != null) vlf.hoverStyleOrig = hoverStyleOrig;
				parent.repaintObjects();
			}
		}
		
		noteSomethingHasChanged();
	}

	public function setHandler(name:String, handler:MapNode->MapNode->Void)
	{
		if (handler == null) removeHandler(name);
		else {
			handlers.set(name, handler);
			updateHandCursor();
		}
	}

	public function removeHandler(name:String)
	{
		handlers.remove(name);
		updateHandCursor();
	}

	public function getHandler(name:String):MapNode->MapNode->Void
	{
		var handler = handlers.get(name);
		return 
			(handler != null) ?
				handler :
			(parent != null) ?
				parent.getHandler(name) :
				null;
	}

	public function callHandler(name:String, ?nodeFrom:MapNode)
	{
		var handler = getHandler(name);
		if (handler != null)
			handler(this, nodeFrom);
	}

	public function callHandlersRecursively(name:String)
	{
		var handler = handlers.get(name);
		if (handler != null)
			handler(this, null);
		for (child in children)
			child.callHandlersRecursively(name);
	}

	public function repaintObjects()
	{
		for (child in children) {
			if(Std.is(child.content, VectorObject)) child.content.repaint();
		}
	}

	public function repaintRecursively(somethingHasChangedAbove:Bool)
	{
		var z = window.getCurrentZ();
		var isVisible = !hidden && (z >= minZ) && (z <= maxZ);
		rasterSprite.visible = isVisible;
		vectorSprite.visible = isVisible;
		if (isVisible)
		{
			var somethingHasChanged_ = somethingHasChanged || somethingHasChangedAbove;
			
			if ((content != null) && somethingHasChanged_) {
				content.repaint();
				//parent.repaintObjects();			// отрисовка обьектов addObject родителя
			}
			for (i in 0...Std.int(children.length)) {	// отрисовка слоев в обратном порядке
				var child = children[children.length - 1 - i];
				child.repaintRecursively(somethingHasChanged_);
			}
			somethingHasChanged = false;
		}
	}

	public function getVisibility()
	{
		var z = window.getCurrentZ();
		var isVisible = !hidden && (z >= minZ) && (z <= maxZ);
		return isVisible ? ((parent != null) ? parent.getVisibility() : true) : false;
	}

	public function repaintLabelsRecursively()
	{
		if (rasterSprite.visible)
		{
			if (content != null)
				content.paintLabels();
			//for (child in children) {
			for (i in 0...Std.int(children.length)) {	// отрисовка Label в обратном порядке
				var child = children[children.length - 1 - i];
				child.repaintLabelsRecursively();
			}
		}
	}

	public function noteSomethingHasChanged()
	{
		somethingHasChanged = true;
		window.cacheRepaintNeeded = true;
		if (containsLabels())
			window.labelsRepaintNeeded = true;
	}

	function containsLabels()
	{
		if ((content != null) && content.hasLabels())
			return true;
		for (child in children)
			if (child.containsLabels())
				return true;
		return false;
	}

	public function bringToDepth(n:Int)
	{
		if ((n >= 0) && (n < rasterSprite.parent.numChildren))
			rasterSprite.parent.setChildIndex(rasterSprite, n);
		if ((n >= 0) && (n < vectorSprite.parent.numChildren))
			vectorSprite.parent.setChildIndex(vectorSprite, n);
		if (parent != null)
		{
			var parentSprite = parent.rasterSprite;
			parent.children.sort(function(child1, child2)
			{
				var d1 = parentSprite.getChildIndex(child1.rasterSprite);
				var d2 = parentSprite.getChildIndex(child2.rasterSprite);
				return (d1 < d2) ? -1 : (d1 == d2) ? 0 : 1;
			});
		}
	}

	// Получить индекс обьекта
	public function getDepth()
	{
		var parentSprite = parent.rasterSprite;
		var d1 = parentSprite.getChildIndex(rasterSprite);
		return d1;
	}
}