import flash.display.Graphics;
import flash.display.BitmapData;

class FillStyle
{
	public var color:Int;
	public var opacity:Float;
	public var imageUrl:String;
	public var bitmapData:BitmapData;
	
	static var DEFAULT_COLOR:Int = 0;
	static var DEFAULT_OPACITY:Float = 1.0;

	public function new(fill:Dynamic)
	{
		color = Std.is(fill.color, Int) ? fill.color : DEFAULT_COLOR;
		opacity = Std.is(fill.opacity, Int) ? fill.opacity/100.0 : DEFAULT_OPACITY;
		imageUrl = Std.is(fill.image, String) ? fill.image : null;
		if (imageUrl == "")
			imageUrl = null;
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
		if ( !removeDefaults || opacity != DEFAULT_OPACITY) res.opacity = opacity;
		if ( imageUrl != null ) res.imageUrl = imageUrl;
		
		return res;
	}
}
