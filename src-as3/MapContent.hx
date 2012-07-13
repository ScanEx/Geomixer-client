import flash.display.Sprite;
import flash.events.Event;
import flash.events.MouseEvent;

class MapContent
{
	public var mapNode:MapNode;
	public var contentSprite:Sprite;
	public var isRaster:Bool;

	public function initialize(mapNode_:MapNode)
	{
		mapNode = mapNode_;
		contentSprite = createContentSprite();
		contentSprite.name = 'cont_' + mapNode.id;	
		addHandlers();
	}

	public function createContentSprite():Sprite
	{
		trace("MapContent.createContentSprite must be overridden!");
		return null;
	}

	public function flush():Void
	{
	}

	public function delClusters():Dynamic
	{
		return null;
	}

	public function setClusters(attr:Dynamic):Dynamic
	{
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
		contentSprite.addEventListener(MouseEvent.MOUSE_OVER, function(event:MouseEvent)
		{
			//if (Main.mousePressed && !Main.isDrawing && !Main.draggingDisabled) return;		// При нажатой мышке и не рисование ничего не делаем
			node.callHandler("onMouseOver");
		});
		contentSprite.addEventListener(MouseEvent.MOUSE_OUT, function(event:MouseEvent)
		{
			//if (Main.mousePressed && !Main.isDrawing && !Main.draggingDisabled) return;		// При нажатой мышке и не рисование ничего не делаем
			Main.chkEventAttr(event);
			node.callHandler("onMouseOut");
		});
		contentSprite.addEventListener(MouseEvent.MOUSE_MOVE, function(event:MouseEvent)
		{
			//if (Main.mousePressed && !Main.isDrawing && !Main.draggingDisabled) return;		// При нажатой мышке и не рисование ничего не делаем
			Main.chkEventAttr(event);
			node.callHandler("onMouseMove");
		});
		contentSprite.addEventListener(MouseEvent.MOUSE_DOWN, function(event:MouseEvent)
		{
			Main.registerMouseDown(node, event, null);
		});
	}
}