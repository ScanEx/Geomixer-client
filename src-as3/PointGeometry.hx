import flash.display.Sprite;
import flash.geom.Point;
import flash.geom.Matrix;

class PointGeometry extends Geometry
{
	public var x:Float;
	public var y:Float;

	public function new(x_:Float, y_:Float)
	{
		super();
		x = x_;
		y = y_;
		extent.update(x, y);
	}

	public override function paint(sprite:Sprite, style:Style, window:MapWindow)
	{
		if (window.visibleExtent.contains(x, y))
		{
			var marker = style.marker;
			if (marker != null)
			{
				if (marker.drawFunction != null)
					marker.drawFunction(this, sprite.graphics, window.scaleY);
				else
				{
					var size = marker.size;
					if (size > 0.0)
					{
						size *= window.scaleY;
						var graphics = sprite.graphics;
						var drawer = new DashedLineDrawer(graphics, style.outline, window);
						Geometry.beginFill(graphics, style.fill);
						drawer.moveTo(x - size, y - size);
						drawer.lineTo(x + size, y - size);
						drawer.lineTo(x + size, y + size);
						drawer.lineTo(x - size, y + size);
						drawer.lineTo(x - size, y - size);
						graphics.endFill();
					}
				}
			}
		}
	}

	public override function distanceTo(x_:Float, y_:Float):Float
	{
		var cx = x - x_;
		var cy = y - y_;
		return cx*cx + cy*cy;
	}

	public override function export():Dynamic
	{
		return {
			type: "POINT",
			coordinates: [x, y]
		};
	}
}