import flash.display.Sprite;
import flash.display.Bitmap;
import flash.display.BitmapData;
import flash.geom.Point;
import flash.geom.Matrix;

class VectorTilePainter
{
	var oldStyle:Style;
	public var painter:GeometryPainter;
	var sprite:Sprite;
	var innerSprite:Sprite;
	var mapWindow:MapWindow;
	var rasterSprite:Sprite;
	var vectorSprite:Sprite;
	var bitmaps:Array<Bitmap>;
	var lastBitmap:Bitmap;
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
	}

	public function remove()
	{
		sprite.removeChild(rasterSprite);
		sprite.removeChild(vectorSprite);
	}

	public function setOffset(dx:Float)
	{
		rasterSprite.x = dx;
		vectorSprite.x = dx;
	}

	public function repaint(style:Style)
	{
		var curZ:Float = mapWindow.getCurrentZ();
		if (mapWindow.cacheBitmap.visible || (curZ != Math.round(curZ)))
			return;
		var currentZ:Int = Std.int(curZ);
		if (style != oldStyle)
		{
			bitmaps = new Array<Bitmap>();
			if (lastBitmap != null)
			{
				rasterSprite.removeChild(lastBitmap);
				lastBitmap = null;
			}
			oldStyle = style;
		}
		else if (bitmaps == null)
			bitmaps = new Array<Bitmap>();	
		if (currentZ < z)
		{
			if (bitmaps[z - currentZ] == null)
			{
				var w:Int = Std.int(256/Math.pow(2, z - currentZ));
				var bitmapData = new BitmapData(w, w, true, 0);
				var bitmap = new Bitmap(bitmapData);
				var inv = mapWindow.matrix.clone();
				inv.invert();
				inv.a *= (w + 2.0)/w;
				inv.d *= (w + 2.0)/w;
				bitmap.transform.matrix = inv;
				var tileSize = 256*Utils.getScale(z);
				var scale = Math.abs(mapWindow.scaleY);
				bitmap.x = i*tileSize;
				bitmap.y = (j + 1)*tileSize;
				bitmaps[z - currentZ] = bitmap;

				painter.repaintWithoutExtent(style);
				vectorSprite.visible = true;
				var mat = mapWindow.matrix.clone();
				var p = mat.transformPoint(new Point(bitmap.x, bitmap.y));
				mat.tx -= p.x;
				mat.ty -= p.y;
				bitmapData.draw(vectorSprite, mat);
			}
			var bitmap = bitmaps[z - currentZ];
			if (bitmap != lastBitmap)
			{
				if (lastBitmap != null)
					rasterSprite.removeChild(lastBitmap);
				rasterSprite.addChild(bitmap);
				lastBitmap = bitmap;
			}
			rasterSprite.visible = true;
			vectorSprite.visible = false;
		}
		else
		{
			painter.repaint(style);
			rasterSprite.visible = false;
			vectorSprite.visible = true;
		}
	}
}