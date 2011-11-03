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

	// Проверка точки на Extent с учетом половины толщины линии
	public function contains(x:Float, y:Float, ?halfLine:Float):Bool
	{
		if (halfLine == null) halfLine = 0;
		return ((x >= minx - halfLine) && (y >= miny - halfLine) && (x <= maxx + halfLine) && (y <= maxy + halfLine))
			|| (maxx > Utils.worldWidth &&  maxx - x > 2*Utils.worldWidth)
			;
	}

	// Переcечение геометрий
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

	// Полное перекрытие геометрий
	public static function overlapFull(e1:Extent, e2:Extent)
	{
		var w = 2*Utils.worldWidth;
		return (
			(e1.miny <= e2.miny) && (e1.maxy >= e2.maxy) &&
			(e1.minx <= e2.minx) && (e1.maxx >= e2.maxx));
	}

	public function overlapsFull(e2:Extent)
	{
		return overlapFull(this, e2);
	}
	
}