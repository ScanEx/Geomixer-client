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

	public var opacityFunction:Hash<String>->Float;
	var origOpacityExpr: String;

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

		opacityFunction = null;
		if (Std.is(fill.opacity, String)) {
			opacityFunction = Parsers.parseExpression(fill.opacity);
		}
		origOpacityExpr = Std.is(fill.opacity, String) ? fill.opacity : '';
		opacity = Std.is(fill.opacity, Int) ? fill.opacity/100.0 : DEFAULT_OPACITY;
		
		imageUrl = Std.is(fill.image, String) ? fill.image : null;
		if (imageUrl == "")
			imageUrl = null;
	}

	public function getColor(prop:Hash<String>):Int
	{
		var out:Int = color;
		if (colorFunction != null) {
			out = cast(colorFunction(prop));
		}
		return out;
	}
	
	public function getOpacity(prop:Hash<String>):Float
	{
		var out:Float = opacity;
		if (opacityFunction != null) {
			out = cast(opacityFunction(prop))/100;
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

		if ( !removeDefaults || opacity   != DEFAULT_OPACITY  ) res.opacity = Std.int(opacity*100);
		if (origOpacityExpr != null) res.opacity = origOpacityExpr;
		if ( imageUrl != null ) res.imageUrl = imageUrl;
		
		return res;
	}
}
