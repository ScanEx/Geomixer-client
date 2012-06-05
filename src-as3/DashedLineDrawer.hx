import flash.display.Graphics;
import flash.display.LineScaleMode;
import flash.geom.Point;

class DashedLineDrawer
{
	var x:Float;
	var y:Float;
	//var t:Float;
	var penIsVisible:Bool;
	var graphics:Graphics;
	var outline:OutlineStyle;
	var window:MapWindow;
	var totalDashesLength:Float;
	var prop:Hash<String>;

	public function new(graphics_:Graphics, outline_:OutlineStyle, window_:MapWindow, ?prop_:Hash<String>, ?propTemporal_:Hash<String>)
	{
		graphics = graphics_;
		prop = new Hash<String>();
		if (prop_ != null) for (key in prop_.keys()) prop.set(key, prop_.get(key));
		if (propTemporal_ != null) for (key in propTemporal_.keys()) prop.set('_'+key, propTemporal_.get(key));
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

	public function invisibleLineTo(x_, y_)
	{
		clearLineStyle();
		penIsVisible = false;
		graphics.lineTo(x_, y_);
		x = x_;
		y = y_;
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
			var subLineExt:Extent = new Extent();
			subLineExt.update(x, y);
			subLineExt.update(x_, y_);
			var contains = window.visibleExtent.overlaps(subLineExt);	// Линия в области видимости
			if (!contains) {
				invisibleLineTo(x_, y_);
			}
			else
			{
				putLine(x_, y_);				
			}
		}
		x = x_;
		y = y_;
	}

	function putLine(x_:Float, y_:Float)
	{
		if(totalDashesLength > 0) {		// Требуется отрисовка dash линии 
			var pb:Point = new Point(x, y);
			var pe:Point = new Point(x_, y_);
			var sc = Math.abs(window.scaleY);
			var len = Point.distance(pb, pe);
			var count:Int = Std.int(len / (totalDashesLength*sc));
			var dist:Float = 0;
			for (i in 0...count) {
				for (j in 0...Std.int(outline.dashes.length))
				{
					dist += outline.dashes[j] * sc;
					var pt:Point = Point.interpolate(pb, pe, 1 - dist/len);
					if (j % 2 == 0)		setLineStyle();
					else				clearLineStyle();
					graphics.lineTo(pt.x, pt.y);
				}
			}
		}
		setLineStyle();
		graphics.lineTo(x_, y_);
	}
}