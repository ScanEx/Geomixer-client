import flash.display.Sprite;
import flash.display.Graphics;
import flash.display.LineScaleMode;

class GridContent extends MapContent
{
	static var gridSteps:Array<Float> = [0.001, 0.002, 0.0025, 0.005, 0.01, 0.02, 0.025, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 30, 60, 120, 180];

	public function new()
	{
	}

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public override function hasLabels()
	{
		return true;
	}

	public override function paintLabels()
	{
		var g = contentSprite.graphics;
		var color = 0xffffff - mapNode.window.backgroundColor;
		g.clear();
		g.lineStyle(1, color, 0.3, false, LineScaleMode.NONE);

		var extent = mapNode.window.visibleExtent;
		var x1 = Merc.from_x(extent.minx);
		var x2 = Merc.from_x(extent.maxx);
		var y1 = Merc.from_y(extent.miny);
		var y2 = Merc.from_y(extent.maxy);
		var xStep:Float = 0.0;
		var yStep:Float = 0.0;
		var w = flash.Lib.current.stage.stageWidth;
		var h = flash.Lib.current.stage.stageHeight;
		for (step in gridSteps)
		{
			if ((x2 - x1)/step < w/80)
			{
				xStep = step;
				break;
			}
		}
		for (step in gridSteps)
		{
			if ((y2 - y1)/step < h/80)
			{
				yStep = step;
				break;
			}
		}
		if ((xStep == 0.0) || (yStep == 0.0))
			return;

		var labelStyle = new Style({ label: { size: 10, color: color, align: "center" } });
		var leftX = Merc.x(xStep*(Math.ceil(x1/xStep + 0.6) - 0.5));
		var topY = Merc.y(yStep*(Math.floor(y2/yStep - 0.6) + 0.5));
		for (i in Math.floor(x1/xStep)...Math.ceil(x2/xStep))
		{
			var x = Merc.x(i*xStep);
			g.moveTo(x, extent.miny);
			g.lineTo(x, extent.maxy);
			if (x >= leftX)
				mapNode.window.paintLabel("" + formatFloat(i*xStep) + "°", new PointGeometry(x, topY), labelStyle);
		}
		for (i in Math.floor(y1/yStep)...Math.ceil(y2/yStep))
		{
			var y = Merc.y(i*yStep);
			g.moveTo(extent.minx, y);
			g.lineTo(extent.maxx, y);
			if (y <= topY)
				mapNode.window.paintLabel("" + formatFloat(i*yStep) + "°", new PointGeometry(leftX, y), labelStyle);
		}
	}

	static function formatFloat(f:Float)
	{
		if (f > 180) f -= 360;
		else if (f < -180) f += 360;
		return Math.round(f*1000.0)/1000.0;
	}
}
