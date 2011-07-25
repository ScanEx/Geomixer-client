import flash.display.Sprite;

class PointGeometry extends Geometry
{
	public var x:Float;
	public var y:Float;
	
	var oldStyle:Style;

	public function new(x_:Float, y_:Float)
	{
		super();
		x = x_;
		y = y_;
		oldStyle = null;
		extent.update(x, y);
	}

	public override function paint(sprite:Sprite, style:Style, window:MapWindow)
	{
		if (window.visibleExtent.contains(x, y))
		{
			oldZ = window.getCurrentZ();
			oldStyle = style;
			clearDrawing();		// Очистим IGraphicsData
			clearPath();
			var marker = style.marker;
			if (marker != null)
			{
				if (marker.drawFunction != null) {
					marker.drawFunction(this, sprite.graphics, window.scaleY);
					//refreshFlag = false;
				}
				else
				{	
					var size = marker.size;
					if (size > 0.0)
					{
						size *= window.scaleY;
						if(myStroke == null) {
							setStroke(style.outline);
						}
						myDrawing.push(myStroke);
						beginFillPath(style.fill);

						myPath.moveTo(x - size, y - size);
						myPath.lineTo(x + size, y - size);
						myPath.lineTo(x + size, y + size);
						myPath.lineTo(x - size, y + size);
						myPath.lineTo(x - size, y - size);
						myDrawing.push(myPath);
					}
				}
			}
		} else {
			//refreshFlag = true;
			oldZ = 0;
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