class OutlineStyle
{
	public var thickness:Int;
	public var color:Int;
	public var opacity:Float;
	public var dashes:Array<Float>;
	
	static var DEFAULT_THICKNESS:Int = 0;
	static var DEFAULT_COLOR:Int = 0;
	static var DEFAULT_OPACITY:Float = 1.0;

	public function new(outline:Dynamic)
	{
		thickness = Std.is(outline.thickness, Int) ? outline.thickness : DEFAULT_THICKNESS;
		color = Std.is(outline.color, Int) ? outline.color : DEFAULT_COLOR;
		opacity = Std.is(outline.opacity, Int) ? outline.opacity/100.0 : DEFAULT_OPACITY;
		dashes = Std.is(outline.dashes, Array) ? outline.dashes : null;
	}
	
	public function getStyle(removeDefaults: Bool)
	{
		var res: Dynamic = {};
		
		if ( !removeDefaults || thickness != DEFAULT_THICKNESS) res.thickness = thickness;
		if ( !removeDefaults || color     != DEFAULT_COLOR    ) res.color = color;
		if ( !removeDefaults || opacity   != DEFAULT_OPACITY  ) res.opacity = Std.int(opacity*100);
		if (dashes != null) res.dashes = dashes;
		
		return res;
	}
}