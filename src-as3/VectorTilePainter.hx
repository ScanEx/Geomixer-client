import flash.display.Sprite;

class VectorTilePainter
{
	public var painter:GeometryPainter;
	var sprite:Sprite;
	var mapWindow:MapWindow;
	var vectorSprite:Sprite;
	var i:Int;
	var j:Int;
	var z:Int;
	var oldZ:Float;

	public function new(geometry:Geometry, sprite_:Sprite, mapWindow_:MapWindow, i_:Int, j_:Int, z_:Int)
	{
		sprite = sprite_;
		mapWindow = mapWindow_;
		vectorSprite = Utils.addSprite(sprite);
		painter = new GeometryPainter(geometry, vectorSprite, mapWindow);
		i = i_;
		j = j_;
		z = z_;
	}

	public function remove()
	{
		sprite.removeChild(vectorSprite);
	}

	public function setOffset(dx:Float)
	{
		vectorSprite.x = dx;
	}

	public function repaint(style:Style)
	{
		var curZ:Float = mapWindow.getCurrentZ();
		if (mapWindow.cacheBitmap.visible || (curZ != Math.round(curZ)))
			return;
		if(painter.geometry.refreshFlag || curZ != oldZ) {
			painter.repaint(style);
			oldZ = curZ;
		}

		if(!vectorSprite.visible) vectorSprite.visible = true;
	}
}