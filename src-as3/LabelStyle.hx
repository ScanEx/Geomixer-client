class LabelStyle
{
	public var field:String;
	public var size:Int;
	public var color:Int;
	public var haloColor: Int;
	public var align:String;
	public var spacing:Int;
	public var dx:Int;
	public var dy:Int;
	
	static var DEFAULT_SIZE:Int = 0;
	static var DEFAULT_COLOR:Int = 0;
	static var DEFAULT_HALOCOLOR:Int = -1;
	static var DEFAULT_SPACING:Int = -1;

	public function new(label:Dynamic)
	{
		field = Std.is(label.field, String) ? label.field : null;
		size = Std.is(label.size, Int) ? label.size : DEFAULT_SIZE;
		color = Std.is(label.color, Int) ? label.color : DEFAULT_COLOR;
		haloColor = Std.is(label.haloColor, Int) ? label.haloColor : DEFAULT_HALOCOLOR;
		align = Std.is(label.align, String) ? label.align : null;
		spacing = Std.is(label.spacing, Int) ? label.spacing : DEFAULT_SPACING;
		dx = Std.is(label.dx, Int) ? label.dx : 0;
		dy = Std.is(label.dy, Int) ? label.dy : 0;
	}
	
	public function getStyle(removeDefaults: Bool)
	{
		var res: Dynamic = {};
		
		if (field != null) res.field = field;
		if (align != null) res.align = align;
		if ( !removeDefaults || size != DEFAULT_SIZE) res.size = size;
		if ( !removeDefaults || color != DEFAULT_COLOR) res.color = color;
		if ( !removeDefaults || haloColor != DEFAULT_HALOCOLOR) res.haloColor = haloColor;
		if ( !removeDefaults || spacing != DEFAULT_SPACING) res.spacing = spacing;
		if (dx != 0) res.dx = dx;
		if (dy != 0) res.dy = dy;
		
		return res;
	}
}