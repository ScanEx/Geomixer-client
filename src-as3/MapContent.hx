import flash.display.Sprite;
import flash.events.Event;
import flash.events.MouseEvent;

class MapContent
{
	public var mapNode:MapNode;
	public var contentSprite:Sprite;

	public function initialize(mapNode_:MapNode)
	{
		mapNode = mapNode_;
		contentSprite = createContentSprite();
		addHandlers();
	}

	public function createContentSprite():Sprite
	{
		trace("MapContent.createContentSprite must be overridden!");
		return null;
	}

	public function repaint() 
	{
	}

	public function hasLabels():Bool
	{
		return false;
	}

	public function paintLabels()
	{
	}

	public function addHandlers()
	{
		var node = this.mapNode;
		contentSprite.addEventListener(MouseEvent.MOUSE_OVER, function(event:Event)
		{
			node.callHandler("onMouseOver");
		});
		contentSprite.addEventListener(MouseEvent.MOUSE_OUT, function(event:Event)
		{
			node.callHandler("onMouseOut");
		});
		contentSprite.addEventListener(MouseEvent.MOUSE_MOVE, function(event:Event)
		{
			node.callHandler("onMouseMove");
		});
		contentSprite.addEventListener(MouseEvent.MOUSE_DOWN, function(event:Event)
		{
			Main.registerMouseDown(node);
		});
	}
}