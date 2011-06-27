import flash.display.Sprite;

class GeometryPainter
{
	public var sprite:Sprite;
	public var window:MapWindow;
	public var geometry:Geometry;

	var oldZ:Float;
	
	public function new(geometry_:Geometry, sprite_:Sprite, window_:MapWindow)
	{
		geometry = geometry_;
		sprite = sprite_;
		window = window_;
	}

	public function repaint(style:Style)
	{
		if ((geometry != null) && (style != null)) {
			var curZ:Float = window.getCurrentZ();
			if(geometry.refreshFlag || curZ != oldZ) {
				oldZ = curZ;
				geometry.paintWithExtent(sprite, style, window);
			}
		}
	}

	public function repaintWithoutExtent(style:Style)
	{
		sprite.graphics.clear();
		if ((geometry != null) && (style != null))
			geometry.paint(sprite, style, window);
	}
}
