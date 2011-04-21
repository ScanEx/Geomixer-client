class Bounds
{
	public var minx, miny, maxx, maxy;

	function Bounds(data)
	{
		minx = 100000000;
		miny = 100000000;
		maxx = -100000000;
		maxy = -100000000;
		if (data)
			update(data);
	}

	function update(data)
	{
		if (!data[0].length)
		{
			var dl = data.length/2;
			var minx_ = minx, miny_ = miny, maxx_ = maxx, maxy_ = maxy;
			for (var i = 0; i < dl; i++)
			{
				var i_ = i*2;
				var x = data[i_], y = data[i_ + 1];
				if (x < minx_)
					minx_ = x;
				if (x > maxx_)
					maxx_ = x;
				if (y < miny_)
					miny_ = y;
				if (y > maxy_)
					maxy_ = y;
			}
			minx = minx_;
			miny = miny_;
			maxx = maxx_;
			maxy = maxy_;
		}
		else
			for (var i = 0; i < data.length; i++)
				update(data[i]);
	}

	static function union(b1, b2)
	{
		return new Bounds([b1.minx, b1.miny, b1.maxx, b1.maxy, b2.minx, b2.miny, b2.maxx, b2.maxy]);
	}
}
