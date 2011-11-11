import flash.display.Sprite;
import flash.display.Graphics;
import flash.display.LineScaleMode;
import flash.display.CapsStyle;
import flash.display.JointStyle;

class Geometry
{
	public static var MAX_DISTANCE:Float = 1e20;
	public var extent:Extent;
	public var properties:Hash<String>;
	public var propTemporal:Hash<String>;	// свойства для мультивременных данных
	public var propHiden:Hash<Dynamic>;		// внутренние свойства
	public var refreshFlag:Bool;
	public var oldZ:Float;
	public var halfLine:Float;				// половина линии обводки

	public function new()
	{
		extent = new Extent();
		refreshFlag = true;
		properties = null;
		propHiden = new Hash<Dynamic>();
		propTemporal = new Hash<String>();
		halfLine = 0;
	}

	public function paintWithExtent(sprite:Sprite, style:Style, window:MapWindow, ?func:Hash<String>->Bool)
	{
		if (extent.overlaps(window.visibleExtent)) {
			paint(sprite, style, window, func);
		} else {
			refreshFlag = true;
		}
	}

	public function paint(sprite:Sprite, style:Style, window:MapWindow, ?func:Hash<String>->Bool)
	{
	}

	public function distanceTo(x:Float, y:Float):Float
	{
		return MAX_DISTANCE;
	}

	public function export():Dynamic
	{
		return { type: "unknown" };
	}

	public static function setLineStyle(graphics:Graphics, outline:OutlineStyle)
	{
		if ((outline != null) && (outline.thickness > 0))
			graphics.lineStyle(outline.thickness, outline.color, outline.opacity, false, LineScaleMode.NONE);
		else
			graphics.lineStyle(Math.NaN, 0, 0.0);
	}

	public static function beginFill(graphics:Graphics, fill:FillStyle)
	{
		if (fill != null) {
			graphics.beginFill(fill.color, fill.opacity);
		}
	}

	public function getLength():Float
	{
		return 0;
	}

	public function getArea():Float
	{
		return 0;
	}

	public function forEachLine(func:LineGeometry->Void):Bool
	{
		return false;
	}
}