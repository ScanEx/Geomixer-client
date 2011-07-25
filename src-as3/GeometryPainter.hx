import flash.display.Sprite;

class GeometryPainter
{
	public var sprite:Sprite;
	public var window:MapWindow;
	public var geometry:Geometry;

	
	public function new(geometry_:Geometry, sprite_:Sprite, window_:MapWindow)
	{
		geometry = geometry_;
		sprite = sprite_;
		window = window_;
	}

	public function repaint(style:Style)
	{
		sprite.graphics.clear();
		if (geometry != null && style != null) {
			geometry.paintWithExtent(sprite, style, window);

			if (geometry.parent == null && geometry.myDrawing.length > 0) {
				sprite.graphics.drawGraphicsData(geometry.myDrawing);
			}
		}
	}
/*
	public function repaintWithoutExtent(style:Style)
	{
		sprite.graphics.clear();
		if ((geometry != null) && (style != null))
			geometry.paint(sprite, style, window);
	}
*/	
}
