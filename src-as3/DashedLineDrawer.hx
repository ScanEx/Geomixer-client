import flash.display.Graphics;
import flash.display.LineScaleMode;

class DashedLineDrawer
{
	var x:Float;
	var y:Float;
	var t:Float;
	var penIsVisible:Bool;
	var graphics:Graphics;
	var outline:OutlineStyle;
	var window:MapWindow;
	var currentDashIndex:Int;
	var currentDashLength:Float;
	var totalDashesLength:Float;
	var prop:Hash<String>;

	public function new(graphics_:Graphics, outline_:OutlineStyle, window_:MapWindow, ?prop_:Hash<String>)
	{
		graphics = graphics_;
		prop = prop_;
		outline = outline_;
		window = window_;
		penIsVisible = false;

		totalDashesLength = 0;
		if ((outline != null) && (outline.dashes != null))
			for (dash in outline.dashes)
				totalDashesLength += dash;
	}

	public function moveTo(x_:Float, y_:Float)
	{
		graphics.moveTo(x_, y_);
		x = x_;
		y = y_;
		resetDashes();
	}

	function setLineStyle()
	{
		if ((outline != null) && (outline.thickness > 0))
			graphics.lineStyle(outline.thickness, (prop != null ? outline.getColor(prop) : outline.color), (prop != null ? outline.getOpacity(prop) : outline.opacity), false, LineScaleMode.NONE);
		else
			clearLineStyle();
	}

	function clearLineStyle()
	{
		graphics.lineStyle(Math.NaN, 0, 0);
	}

	function resetDashes()
	{
		currentDashIndex = 0;
		currentDashLength = 0;
	}

	public function invisibleLineTo(x_, y_)
	{
		clearLineStyle();
		penIsVisible = false;
		graphics.lineTo(x_, y_);
		x = x_;
		y = y_;
		resetDashes();
	}

	public function lineTo(x_:Float, y_:Float)
	{
		if ((outline == null) || (outline.dashes == null))
		{
			if (!penIsVisible)
			{
				penIsVisible = true;
				setLineStyle();
			}
			graphics.lineTo(x_, y_);
		}
		else
		{
			var dx = x_ - x;
			var dy = y_ - y;
			var len = Math.sqrt(dx*dx + dy*dy)/Math.abs(window.scaleY);

			var x1 = x;
			var y1 = y;
			var x2 = x_;
			var y2 = y_;
			var t1:Float = 0;
			var t2:Float = len;
			var somethingLeft = true;
			var clipSegment = function(a:Float, b:Float, c:Float)
			{
				if (somethingLeft)
				{
					var f1 = a*x1 + b*y1 + c;
					var f2 = a*x2 + b*y2 + c;
					if ((f1 < 0) && (f2 < 0))
					{
						somethingLeft = false;
						return;
					}
					else if ((f1 > 0) && (f2 > 0))
						return;
					else
					{
						var m = f1/(f1 - f2);
						var xc = x1 + (x2 - x1)*m;
						var yc = y1 + (y2 - y1)*m;
						var tc = t1 + (t2 - t1)*m;
						if (f1 < 0)
						{
							x1 = xc;
							y1 = yc;
							t1 = tc;
						}
						else
						{
							x2 = xc;
							y2 = yc;
							t2 = tc;
						}
					}
				}
			}
			var e = window.visibleExtent;
			clipSegment(1, 0, e.minx);
			clipSegment(-1, 0, e.maxx);
			clipSegment(0, 1, e.miny);
			clipSegment(0, -1, e.maxy);
			if (!somethingLeft)
				skipDashes(len, x_, y_);
			else
			{
				if (t1 > 0)
					skipDashes(t1, x1, y1);
				var t = t2 - t1;
				var x__ = x1;
				var y__ = y1;
				var xmult = (x2 - x1)/t;
				var ymult = (y2 - y1)/t;
				while (true)
				{
					if (currentDashIndex%2 == 0)
						setLineStyle();
					else
						clearLineStyle();
					var dist = outline.dashes[currentDashIndex] - currentDashLength;
					if (t > dist)
					{
						x__ += xmult*dist;
						y__ += ymult*dist;
						t -= dist;
						incrementDashIndex();
						graphics.lineTo(x__, y__);
					}
					else
					{
						currentDashLength += t;
						graphics.lineTo(x2, y2);
						break;
					}
				}
				if (t2 < len)
					skipDashes(len - t2, x_, y_);
			}
		}
		x = x_;
		y = y_;
	}

	function skipDashes(t:Float, x_:Float, y_:Float)
	{
		t %= totalDashesLength;
		while (t >= outline.dashes[currentDashIndex] - currentDashLength)
		{
			t -= outline.dashes[currentDashIndex] - currentDashLength;
			incrementDashIndex();
		}
		currentDashLength += t;
		graphics.lineTo(x_, y_);
	}

	function incrementDashIndex()
	{
		currentDashIndex += 1;
		if (currentDashIndex == outline.dashes.length)
			currentDashIndex = 0;
		currentDashLength = 0;
	}
}