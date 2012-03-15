import flash.display.Sprite;
import flash.display.Graphics;

class PointGeometry extends Geometry
{
	public var x:Float;
	public var y:Float;
	public static var MAX_POINTS_WIDH:Int = 500;	// ограничение размеров точки квадрат не более 1 км
	public static var MAX_POINTS_COUNT:Int = 10000;	// ограничение действует при количестве точек в геометрии родителя
	public static var MAX_POINTS_CACHEASBITMAP:Int = 500;	// количество точек в геометрии родителя при котором необходим флаг cacheAsBitmap

	public function new(x_:Float, y_:Float)
	{
		super();
		x = x_;
		y = y_;
		extent.update(x, y);
	}

	public override function paint(attr:Dynamic)
	{
		var contains:Bool = attr.window.visibleExtent.contains(x, y);	// Точка в области видимости
		if (contains)
		{
			putPoint(attr);
		} else {
			refreshFlag = true;
		}
	}

	function putPoint(attr:Dynamic)
	{
		var sprite:Sprite = attr.sprite;
		var style:Style = attr.style;
		if(propHiden.exists('_vectorLayerFilter')) style = propHiden.get('_vectorLayerFilter').regularStyleOrig;
		var window:MapWindow = attr.window;
		var parentNumChildren:Int = attr.parentNumChildren;
		
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
					var dt:Float = Math.abs(size);
					if(parentNumChildren > MAX_POINTS_CACHEASBITMAP && !sprite.cacheAsBitmap) sprite.cacheAsBitmap = true; // для убыстрения отрисовки тайлов
					//if(dt > MAX_POINTS_WIDH && parentNumChildren > MAX_POINTS_COUNT) dt = MAX_POINTS_WIDH; // ограничение размеров точки

					var graphics:Graphics = sprite.graphics;
					var curr:Dynamic = getCurrentStyle(style, graphics);
					var col:UInt = 0;
					var opacity:Float = 1;
					if(style.outline != null) {
						var thickness = style.outline.thickness;
						col = (properties != null ? style.outline.getColor(properties) : style.outline.color);
						opacity = (properties != null ? style.outline.getOpacity(properties) : style.outline.opacity);
						var lineWidth:Float = Math.abs(thickness*window.scaleY);
						var dtw:Float = dt + lineWidth;
						graphics.beginFill(col, opacity);
						graphics.drawRect(x - dtw, y - dtw, 2*dtw, lineWidth);
						graphics.drawRect(x + dt, y - dt, lineWidth , 2*dt);
						graphics.drawRect(x - dtw, y - dt, lineWidth , 2*dt);
						graphics.drawRect(x - dtw, y + dt , 2*dtw, lineWidth);
					}
					if (style.fill != null) {
						col = style.fill.color;
						opacity = style.fill.opacity;
						graphics.beginFill(col, opacity);
						graphics.drawRect(x - dt, y - dt, 2 * dt, 2 * dt);
					}
					
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

	private function getCurrentStyle(style:Style, gr:Graphics):Dynamic
	{
		var out:Dynamic = { };
		out.graphics = gr;
		var outline:OutlineStyle = style.outline;
		if (outline != null && outline.thickness > 0)
		{
			out.opacity = (properties != null ? outline.getOpacity(properties) : outline.opacity);
			out.color = (properties != null ? outline.getColor(properties) : outline.color);
			out.thickness = outline.thickness;
		}
		var fill:FillStyle = style.fill;
		if (fill != null)
		{
			out.fillColor = fill.color;
			out.fillOpacity = fill.opacity;
		}
		return out;
	}

	public override function distanceTo(x_:Float, y_:Float):Float
	{
		var cx = x - x_;
		var cy = y - y_;
		return cx*cx + cy*cy;
	}

	public override function export():Dynamic
	{
		var out:Dynamic = { };
		out.type = "POINT";
		out.coordinates = [x, y];
		out._xshift = (propHiden.exists('_xshift') ?  propHiden.get('_xshift') : 0 );
		return out;
	}
}