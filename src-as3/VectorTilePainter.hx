import flash.display.Sprite;

class VectorTilePainter
{
	public var painter:GeometryPainter;
	var sprite:Sprite;
	var mapWindow:MapWindow;
	var vectorSprite:Sprite;
	var geometry:Geometry;
	var i:Int;
	var j:Int;
	var z:Int;
	var oldZ:Float;

	public function new(geometry_:Geometry, sprite_:Sprite, mapWindow_:MapWindow, ?i_:Int, ?j_:Int, ?z_:Int)
	{
		geometry = geometry_;
		sprite = sprite_;
		i = i_;
		j = j_;
		z = z_;
		mapWindow = mapWindow_;
		vectorSprite = Utils.addSprite(sprite);
		vectorSprite.cacheAsBitmap = true;
		vectorSprite.name = z + '_' + i + '_' + j;
		painter = new GeometryPainter(geometry, vectorSprite, mapWindow);
	}

	public function remove()
	{
		sprite.removeChild(vectorSprite);
	}

	public function setOffset(dx:Float)
	{
		if(vectorSprite.x != dx) vectorSprite.x = dx;
	}

	public function repaint(style:Style)
	{
		var curZ:Float = mapWindow.getCurrentZ();
		if (mapWindow.cacheBitmap.visible || (curZ != Math.round(curZ))) {
			return;
		}

		painter.repaint(style);
		oldZ = curZ;

		if(!vectorSprite.visible) vectorSprite.visible = true;
	}
}