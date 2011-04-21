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
	public var handlers:Hash<MapNode->Void>;
	public var properties:Dynamic;

	public var somethingHasChanged:Bool;

	public function new(rasterSprite_:Sprite, vectorSprite_:Sprite, window_:MapWindow)
	{
		id = Utils.getNextId();
		allNodes.set(id, this);
		window = window_;
		rasterSprite = rasterSprite_;
		vectorSprite = vectorSprite_;
		regularStyle = null;
		hoveredStyle = null;
		hidden = false;
		minZ = 0;
		maxZ = 100;
		content = null;
		children = new Array<MapNode>();
		handlers = new Hash<MapNode->Void>();

		somethingHasChanged = false;
	}

	public function addChild()
	{
		var child:MapNode = new MapNode(Utils.addSprite(rasterSprite), Utils.addSprite(vectorSprite), window);
		child.parent = this;
		children.push(child);
		return child;
	}

	public function remove()
	{
		noteSomethingHasChanged();
		for (child in children)
			child.remove();
		if (parent != null)
			parent.children.remove(this);
		rasterSprite.parent.removeChild(rasterSprite);
		vectorSprite.parent.removeChild(vectorSprite);
		allNodes.remove(id);
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

	public function setZoomBounds(minZ_, maxZ_)
	{
		minZ = minZ_;
		maxZ = maxZ_;
		noteSomethingHasChanged();
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
		vectorSprite.buttonMode = vectorSprite.useHandCursor = (hoveredStyle != null) || (getHandler("onClick") != null);
	}

	public function setContent(content_:MapContent)
	{
		var oldContent = content;
		content = content_;
		if (oldContent != null)
			oldContent.contentSprite.parent.removeChild(oldContent.contentSprite);
		if (content != null)
			content.initialize(this);
		noteSomethingHasChanged();
	}

	public function setHandler(name:String, handler:MapNode->Void)
	{
		handlers.set(name, handler);
		updateHandCursor();
	}

	public function getHandler(name:String):MapNode->Void
	{
		var handler = handlers.get(name);
		return 
			(handler != null) ?
				handler :
			(parent != null) ?
				parent.getHandler(name) :
				null;
	}

	public function callHandler(name:String)
	{
		var handler = getHandler(name);
		if (handler != null)
			handler(this);
	}

	public function callHandlersRecursively(name:String)
	{
		var handler = handlers.get(name);
		if (handler != null)
			handler(this);
		for (child in children)
			child.callHandlersRecursively(name);
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
			if ((content != null) && somethingHasChanged_)
				content.repaint();
			for (child in children)
				child.repaintRecursively(somethingHasChanged_);
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
			for (child in children)
				child.repaintLabelsRecursively();
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
}