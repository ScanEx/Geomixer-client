import flash.display.Sprite;

class VectorTilePainter
{
	var oldStyle:Style;
	var oldZ:Int;
	public var painter:GeometryPainter;
	var sprite:Sprite;
	var mapWindow:MapWindow;
	var rasterSprite:Sprite;
	var vectorSprite:Sprite;
	var cacheSprite:Sprite;
	var i:Int;
	var j:Int;
	var z:Int;

	public function new(geometry:Geometry, sprite_:Sprite, mapWindow_:MapWindow, i_:Int, j_:Int, z_:Int)
	{
		sprite = sprite_;
		mapWindow = mapWindow_;
		rasterSprite = Utils.addSprite(sprite);
		vectorSprite = Utils.addSprite(sprite);
		painter = new GeometryPainter(geometry, vectorSprite, mapWindow);
		i = i_;
		j = j_;
		z = z_;
		sprite.name = z + '_' + i + '_' + j;
		rasterSprite.name = 'r' + z + '_' + i + '_' + j;
		vectorSprite.name = 'v' + z + '_' + i + '_' + j;
	}

	public function remove()
	{
		sprite.removeChild(rasterSprite);
		sprite.removeChild(vectorSprite);
	}

	public function setOffset(dx:Float)
	{
		if(vectorSprite.x != dx) {
			rasterSprite.x = dx;
			vectorSprite.x = dx;
		}
	}

	private function clearCacheSprite()
	{
		if (cacheSprite != null)
		{
			if(cacheSprite.parent != null) cacheSprite.parent.removeChild(cacheSprite);
			cacheSprite = null;
		}
	}

	public function repaint(style:Style)
	{
		var curZ:Float = mapWindow.getCurrentZ();
		if (mapWindow.cacheBitmap.visible || (curZ != Math.round(curZ)))
			return;

		var currentZ:Int = Std.int(curZ);
		if (style != oldStyle || oldZ != currentZ)
		{
			clearCacheSprite();
			oldStyle = style;
			oldZ = currentZ;
		}

		var flag = mapWindow.visibleExtent.overlapsFull(painter.geometry.extent);	// Полное перекрытие геометрий
		if (flag)
		{
			if (cacheSprite == null)
			{
				cacheSprite = new Sprite();
				painter.repaintWithoutExtent(style, cacheSprite);
			}

			rasterSprite.addChild(cacheSprite);
			if(!rasterSprite.visible) rasterSprite.visible = true;
			if(vectorSprite.visible) vectorSprite.visible = false;
		}
		else
		{
			painter.repaint(style);
			if(rasterSprite.visible) rasterSprite.visible = false;
			if(!vectorSprite.visible) vectorSprite.visible = true;
		}

	}
}