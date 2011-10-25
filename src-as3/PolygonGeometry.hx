import flash.display.Sprite;
import flash.geom.Matrix;
import flash.display.BitmapData;

class PolygonGeometry extends Geometry
{
	public var coordinates:Array<Array<Float>>;
	var tileExtent:Extent;
	
	public function new(coordinates_:Array<Array<Float>>, ?tileExtent_:Extent)
	{
		super();
		coordinates = coordinates_;
		tileExtent = tileExtent_;
		for (part in coordinates)
			for (i in 0...Std.int(part.length/2))
				extent.update(part[i*2], part[i*2 + 1]);
	}

	public override function paint(sprite:Sprite, style:Style, window:MapWindow)
	{
		if (style.hasMarkerImage())
		{
			var x = (extent.minx + extent.maxx)/2;
			var y = (extent.miny + extent.maxy)/2;
			if (window.visibleExtent.contains(x, y))
			{
				var p = new PointGeometry(x, y);
				p.properties = properties;
				p.paint(sprite, style, window);
			} else {
				refreshFlag = true;
			}
		}

		var graphics = sprite.graphics;

		if (style.hasPatternFill())
		{
			var inv = window.matrix.clone();
			inv.invert();
			var scale = Math.abs(inv.a);
			var bitmapData:BitmapData = style.fill.getBitmapData(properties, propHiden);
			if(bitmapData != null) {
				inv.tx -= inv.tx%(bitmapData.width*scale);
				inv.ty -= inv.ty%(bitmapData.height*scale);
				graphics.beginBitmapFill(bitmapData, inv);
			}
		}
		else if(style.fill != null) {
			if(properties != null) {
				graphics.beginFill(style.fill.getColor(properties), style.fill.getOpacity(properties));
			} else {
				Geometry.beginFill(graphics, style.fill);
			}
		}

		var minx:Float;
		var miny:Float;
		var maxx:Float;
		var maxy:Float;
		if (tileExtent != null)
		{
			var d = (tileExtent.maxx - tileExtent.minx)/10000;
			minx = tileExtent.minx + d;
			miny = tileExtent.miny + d;
			maxx = tileExtent.maxx - d;
			maxy = tileExtent.maxy - d;
		}
		else
		{
			minx = -Geometry.MAX_DISTANCE;
			miny = -Geometry.MAX_DISTANCE;
			maxx = Geometry.MAX_DISTANCE;
			maxy = Geometry.MAX_DISTANCE;
		}

		for (part in coordinates)
		{
			var oldx:Float = part[part.length - 2];
			var oldy:Float = part[part.length - 1];
			var drawer = new DashedLineDrawer(graphics, style.outline, window, properties);
			drawer.moveTo(oldx, oldy);
			for (i in 0...Std.int(part.length/2))
			{
				var x:Float = part[i*2];
				var y:Float = part[i*2 + 1];
				var isOnEdge:Bool = false;
				if ((x < minx) || (x > maxx) || (y < miny) || (y > maxy))
				{
					var idx:Int = (i == 0) ? part.length : i*2;
					var oldx:Float = part[idx - 2];
					var oldy:Float = part[idx - 1];
					if (((x < minx) && (oldx < minx)) || ((x > maxx) && (oldx > maxx)))
							isOnEdge = true;
					if (((y < miny) && (oldy < miny)) || ((y > maxy) && (oldy > maxy)))
							isOnEdge = true;
				}
				if (isOnEdge)
					drawer.invisibleLineTo(x, y);
				else
					drawer.lineTo(x, y);
			}
		}		

		graphics.endFill();
		refreshFlag = false;
		oldZ =  (window != null ? window.getCurrentZ() : null);
	}

	public override function distanceTo(x:Float, y:Float)
	{
		if (!extent.contains(x, y))
			return Geometry.MAX_DISTANCE;
		var distance = distanceToRing(x, y, coordinates[0]);
		for (i in 1...coordinates.length)
			if (distanceToRing(x, y, coordinates[i]) == 0)
				return Geometry.MAX_DISTANCE;
		return distance;
	}

	static function distanceToRing(x:Float, y:Float, ring:Array<Float>):Float
	{
		var isInside:Bool = false;
		var minDistance:Float = Geometry.MAX_DISTANCE;
		for (i in 0...(Std.int(ring.length/2) - 1))
		{
			var ii = i*2;
			var y1 = ring[ii + 1];
			var y2 = ring[ii + 3];
			if ((y1 >= y) != (y2 >= y))
			{
				var x1 = ring[ii];
				var x2 = ring[ii + 2];
				var tx = x1 + (x2 - x1)*(y - y1)/(y2 - y1) - x;
				minDistance = Math.min(minDistance, tx*tx);
				if (tx > 0)
					isInside = !isInside;
			}
		}
		return isInside ? 0 : minDistance;
	}

	public override function getArea():Float
	{
		var ret:Float = areaOfRing(coordinates[0]);
		for (i in 1...coordinates.length)
			ret -= areaOfRing(coordinates[i]);
		return ret;
	}

	static function areaOfRing(ring:Array<Float>):Float
	{
		var len:Int = Std.int(ring.length/2);
		var pts = new Array<Float>();
		for (i in 0...len)
		{
			pts.push(Merc.from_x(ring[i*2]));
			pts.push(Math.sin(Merc.from_y(ring[i*2 + 1])*(Math.PI/180)));
		}
		var area:Float = 0.0;
		for (i in 0...len)
		{
			var ipp = ((i == (len - 1)) ? 0 : (i + 1));
			area += (pts[2*i]*pts[2*ipp + 1] - pts[2*ipp]*pts[2*i + 1]);
		}
		var lambertCoefX = 111319.5;
		var lambertCoefY = 6335440.712613423;
		return Math.abs(area*lambertCoefX*lambertCoefY/2.0);
	}

	public override function export():Dynamic
	{
		var coords = [];
		for (part in coordinates)
		{
			var part_ = [];
			for (i in 0...Std.int(part.length/2))
				part_.push([part[i*2], part[i*2 + 1]]);
			coords.push(part_);
		}
		return {
			type: "POLYGON",
			coordinates: coords
		};
	}
}