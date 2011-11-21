import flash.display.Sprite;

class PointGeometry extends Geometry
{
	public var x:Float;
	public var y:Float;
	public static var MAX_POINTS_WIDH:Int = 500;	// ограничение размеров точки квадрат не более 1 км
	public static var MAX_POINTS_COUNT:Int = 10000;	// ограничение действует при количестве точек в геометрии родителя

	public function new(x_:Float, y_:Float)
	{
		super();
		x = x_;
		y = y_;
		extent.update(x, y);
	}

	public override function paint(attr:Dynamic)
	{
		if (attr.func != null && !attr.func(propTemporal)) return;	// Фильтр мультивременных данных

		var contains = attr.window.visibleExtent.contains(x, y);	// Точка в области видимости
		if (contains)
		{
			var style:Style = attr.style;
			if(propHiden.exists('_paintStyle')) style = propHiden.get('_paintStyle');
			putPoint(attr.sprite, style, attr.window, attr.parentNumChildren);
		} else {
			refreshFlag = true;
		}
	}

	function putPoint(sprite:Sprite, style:Style, window:MapWindow, parentNumChildren:Int)
	{
		var marker = style.marker;
		if (marker != null)
		{
			if (marker.drawFunction != null) {
				marker.drawFunction(this, sprite.graphics, window.scaleY);
				refreshFlag = false;
				oldZ = window.getCurrentZ();
			}
			else if (marker.drawSWFFunction != null) {	// Загрузка SWF маркера
				marker.drawSWFFunction(this, sprite, window.scaleY);
				refreshFlag = false;
				oldZ = window.getCurrentZ();
			}
			else
			{
				var size = marker.size;
				if (size > 0.0)
				{
					size *= window.scaleY;
					var dt:Int = cast(Math.abs(size));
					if(dt > MAX_POINTS_WIDH && parentNumChildren > MAX_POINTS_COUNT) dt = MAX_POINTS_WIDH;	// ограничение размеров точки
					var graphics = sprite.graphics;
					var drawer = new DashedLineDrawer(graphics, style.outline, window, properties);
					Geometry.beginFill(graphics, style.fill);
					drawer.moveTo(x - dt, y - dt);
					drawer.lineTo(x + dt, y - dt);
					drawer.lineTo(x + dt, y + dt);
					drawer.lineTo(x - dt, y + dt);
					drawer.lineTo(x - dt, y - dt);
					graphics.endFill();
					refreshFlag = false;
					oldZ = window.getCurrentZ();
					// если есть style.outline.thickness для вычисления delta к Extent
					if(style.outline != null && style.outline.thickness >= 0)
						halfLine = style.outline.thickness * Math.abs(window.scaleY) / 2;
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