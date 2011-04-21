import flash.events.MouseEvent;
import flash.display.Sprite;

class VectorObject extends MapContent
{	
	public var geometry:Geometry;
	public var painter:GeometryPainter;
	public var isActive:Bool;
	public var label:String;

	public function new(geometry_:Geometry)
	{
		geometry = geometry_;
		isActive = false;
	}

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public override function addHandlers()
	{
		super.addHandlers();
		var me = this;
		painter = new GeometryPainter(geometry, contentSprite, mapNode.window);
		contentSprite.addEventListener(MouseEvent.MOUSE_OVER, function(event) { me.highlight(); });
		contentSprite.addEventListener(MouseEvent.MOUSE_OUT, function(event) { me.repaint(); });
	}

	public override function repaint()
	{
		painter.repaint(isActive ? mapNode.getHoveredStyle() : mapNode.getRegularStyle());
	}

	public override function hasLabels()
	{
		var style = mapNode.getRegularStyle();
		return ((label != null) && (style != null) && (style.label != null));
	}

	public override function paintLabels()
	{
		if (hasLabels())
			mapNode.window.paintLabel(label, geometry, mapNode.getRegularStyle());
	}

	function highlight()
	{
		painter.repaint(mapNode.getHoveredStyle());
	}

	public function setActive(isActive_)
	{
		isActive = isActive_;
		repaint();
	}
}