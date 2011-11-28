class OutlineStyle
{
	public var thickness:Int;
	public var color:Int;
	public var opacity:Float;
	public var dashes:Array<Float>;

	public var colorFunction:Hash<String>->Float;
	var origColorExpr: String;

	public var opacityFunction:Hash<String>->Float;
	var origOpacityExpr: String;

	static var DEFAULT_THICKNESS:Int = 0;
	static var DEFAULT_COLOR:Int = 0;
	static var DEFAULT_OPACITY:Float = 1.0;

	public function new(outline:Dynamic)
	{
		colorFunction = null;
		if (Std.is(outline.color, String)) {
			colorFunction = Parsers.parseExpression(outline.color);
		}
		origColorExpr = Std.is(outline.color, String) ? outline.color : '';
		color = Std.is(outline.color, Int) ? outline.color : DEFAULT_COLOR;

		opacityFunction = null;
		if (Std.is(outline.opacity, String)) {
			opacityFunction = Parsers.parseExpression(outline.opacity);
		}
		origOpacityExpr = Std.is(outline.opacity, String) ? outline.opacity : '';
		opacity = Std.is(outline.opacity, Int) ? outline.opacity/100.0 : DEFAULT_OPACITY;

		thickness = Std.is(outline.thickness, Int) ? outline.thickness : DEFAULT_THICKNESS;
		dashes = Std.is(outline.dashes, Array) ? outline.dashes : null;
	}

	public function getColor(prop:Hash<String>):Int
	{
		var out:Int = color;
		if (colorFunction != null && prop != null) {
			out = cast(colorFunction(prop));
		}
		return out;
	}
	
	public function getOpacity(prop:Hash<String>):Float
	{
		var out:Float = opacity;
		if (opacityFunction != null && prop != null) {
			out = cast(opacityFunction(prop))/100;
		}
		return out;
	}
	
	public function getStyle(removeDefaults: Bool)
	{
		var res: Dynamic = {};
		
		if ( !removeDefaults || thickness != DEFAULT_THICKNESS) res.thickness = thickness;
		if ( !removeDefaults || color     != DEFAULT_COLOR    ) res.color = color;
		if (origColorExpr != '') res.color = origColorExpr;
		if ( !removeDefaults || opacity   != DEFAULT_OPACITY  ) res.opacity = Std.int(opacity*100);
		if (origOpacityExpr != '') res.opacity = origOpacityExpr;
		if (dashes != null) res.dashes = dashes;
		return res;
	}
}