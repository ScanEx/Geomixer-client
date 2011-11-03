import flash.display.Sprite;
import flash.display.Graphics;
import flash.geom.Point;
import flash.errors.Error;

class LineGeometry extends Geometry
{
	public var coordinates:Array<Float>;

	public function new(coordinates_:Array<Float>)
	{
		super();
		coordinates = coordinates_;
		for (i in 0...Std.int(coordinates.length/2))
			extent.update(coordinates[i*2], coordinates[i*2 + 1]);
	}

	public override function paint(sprite:Sprite, style:Style, window:MapWindow)
	{
		if (!extent.overlaps(window.visibleExtent)) {
			refreshFlag = true;
			return;
		}

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
		else
		{
			var outline = style.outline;
			if (outline != null)
			{
				var drawer = new DashedLineDrawer(sprite.graphics, outline, window, properties);
				drawer.moveTo(coordinates[0], coordinates[1]);
				for (i in 1...Std.int(coordinates.length/2))
					drawer.lineTo(coordinates[i * 2], coordinates[i * 2 + 1]);
				refreshFlag = false;
				oldZ = window.getCurrentZ();
				halfLine = outline.thickness * Math.abs(window.scaleY) / 2;
			}
		}
	}

	public override function distanceTo(x:Float, y:Float):Float
	{
		if (!extent.contains(x, y, halfLine))
			return Geometry.MAX_DISTANCE;

		var distance:Float = Geometry.MAX_DISTANCE;
		for (i in 0...(Std.int(coordinates.length/2) - 1))
		{
			var ii = i*2;
			var x1 = coordinates[ii] - x;
			var y1 = coordinates[ii + 1] - y;
			var x2 = coordinates[ii + 2] - x;
			var y2 = coordinates[ii + 3] - y;
			var dx = x2 - x1;
			var dy = y2 - y1;
			var d = dx*dx + dy*dy;
			var t1 = -(x1*dx + y1*dy);
			if ((d > 0) && (t1 >= 0) && (t1 <= d))
			{
				var t2 = -x1*dy + y1*dx;
				distance = Math.min(distance, t2*t2/d);
			}
			else
				distance = Math.min(distance, Math.min(x1*x1 + y1*y1, x2*x2 + y2*y2));
		}
		return distance;
	}

	public override function export():Dynamic
	{
		var coords = [];
		for (i in 0...Std.int(coordinates.length/2))
			coords.push([coordinates[i*2], coordinates[i*2 + 1]]);
		return {
			type: "LINESTRING",
			coordinates: coords
		};
	}

	public override function getLength():Float
	{
		var ret:Float = 0.0;
		for (i in 0...(Std.int(coordinates.length/2) - 1))
			ret += Merc.distVincenty(coordinates[2*i], coordinates[2*i + 1], coordinates[2*i + 2], coordinates[2*i + 3]);
		return ret;
	}

	public function getRawLength():Float
	{
		var ret:Float = 0.0;
		for (i in 0...(Std.int(coordinates.length/2) - 1))
		{
			var dx = coordinates[2*i + 2] - coordinates[2*i];
			var dy = coordinates[2*i + 3] - coordinates[2*i + 1];
			ret += Math.sqrt((dx*dx) + (dy*dy));
		}
		return ret;
	}

	public function getPointAt(t:Float):Point
	{
		var currentT:Float = 0;
		for (i in 0...(Std.int(coordinates.length/2) - 1))
		{
			var x1 = coordinates[2*i];
			var y1 = coordinates[2*i + 1];
			var x2 = coordinates[2*i + 2];
			var y2 = coordinates[2*i + 3];
			var dx = x2 - x1;
			var dy = y2 - y1;
			var dt = Math.sqrt((dx*dx) + (dy*dy));
			if (t <= currentT + dt)
			{
				var p = (t - currentT)/dt;
				return new Point(x1 + p*dx, y1 + p*dy);
			}
			else
				currentT += dt;
		}
		throw new Error("Distance parameter out of bounds");
	}

	public override function forEachLine(func:LineGeometry->Void):Bool
	{
		refreshFlag = true;
		func(this);
		return true;
	}
}
