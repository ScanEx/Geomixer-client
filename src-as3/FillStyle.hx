import flash.display.Graphics;
import flash.display.BitmapData;

class FillStyle
{
	public var color:Int;
	public var opacity:Float;
	public var imageUrl:String;
	public var bitmapData:BitmapData;
	
	public var colorFunction:Hash<String>->Float;
	var origColorExpr: String;

	static var DEFAULT_COLOR:Int = 0;
	static var DEFAULT_OPACITY:Float = 1.0;
	
	public function new(fill:Dynamic)
	{
		colorFunction = null;
		if (Std.is(fill.color, String)) {
			colorFunction = Parsers.parseExpression(fill.color);
		}
		origColorExpr = Std.is(fill.color, String) ? fill.color : '';

		color = Std.is(fill.color, Int) ? fill.color : DEFAULT_COLOR;
		opacity = Std.is(fill.opacity, Int) ? fill.opacity/100.0 : DEFAULT_OPACITY;
		imageUrl = Std.is(fill.image, String) ? fill.image : null;
		if (imageUrl == "")
			imageUrl = null;
	}
	
	public function getColor(prop:Hash<String>):Int
	{
		var out:Int = color;
		if (colorFunction != null) {
			var tt = colorFunction(prop);
			out = cast(tt);
		}
		return out;
	}

	public function load(onLoad:Void->Void)
	{
		if (imageUrl == null)
			onLoad();
		else
		{
			var me = this;
			Utils.loadBitmapData(imageUrl, function(bitmapData:BitmapData)
			{
				me.bitmapData = bitmapData;
				onLoad();
			});
		}
	}

	public function getStyle(removeDefaults: Bool)
	{
		var res: Dynamic = {};
		if ( !removeDefaults || color != DEFAULT_COLOR) res.color = color;
		if (origColorExpr != null) res.color = origColorExpr;
		if ( !removeDefaults || opacity != DEFAULT_OPACITY) res.opacity = opacity;
		if ( imageUrl != null ) res.imageUrl = imageUrl;
		
		return res;
	}
}
