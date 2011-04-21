class Extent
{
	public var minx:Float;
	public var miny:Float;
	public var maxx:Float;
	public var maxy:Float;

	public function new()
	{
		minx = Geometry.MAX_DISTANCE;
		miny = Geometry.MAX_DISTANCE;
		maxx = -Geometry.MAX_DISTANCE;
		maxy = -Geometry.MAX_DISTANCE;
	}

	public function update(x:Float, y:Float)
	{
		if (x < minx)
			minx = x;
		if (x > maxx)
			maxx = x;
		if (y < miny)
			miny = y;
		if (y > maxy)
			maxy = y;
	}

	public function contains(x:Float, y:Float):Bool
	{
		return (x >= minx) && (y >= miny) && (x <= maxx) && (y <= maxy);
	}

	public static function overlap(e1:Extent, e2:Extent)
	{
		var w = 2*Utils.worldWidth;
		return ((e1.miny <= e2.maxy) && (e2.miny <= e1.maxy) && (
			((e1.minx <= e2.maxx - w) && (e2.minx - w<= e1.maxx)) ||
			((e1.minx <= e2.maxx) && (e2.minx<= e1.maxx)) ||
			((e1.minx <= e2.maxx + w) && (e2.minx + w <= e1.maxx))));
	}

	public function overlaps(e2:Extent)
	{
		return overlap(this, e2);
	}
}