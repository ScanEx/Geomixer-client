import flash.display.Sprite;

class GeometryPainter
{
	public var sprite:Sprite;
	public var window:MapWindow;
	public var geometry:Geometry;

	
	public function new(geometry_:Geometry, sprite_:Sprite, window_:MapWindow)
	{
		geometry = geometry_;
		sprite = sprite_;
		window = window_;
	}

	public function repaint(style:Style, ?func:Hash<String>->Bool, ?criterion:Hash<String>->Bool, ?notClearFlag:Bool)
	{
		//sprite.graphics.clear();
		if(!notClearFlag) Utils.clearSprite(sprite);
		if ((geometry != null) && (style != null)) {
			if (func != null && geometry.properties != null && !func(geometry.propTemporal)) return;	// Фильтр мультивременных данных
			var attr:Dynamic = { };
			attr.sprite = sprite; attr.style = style; attr.window = window; attr.func = func;
			attr.func1 = criterion;		// фильтр видимости setVisibilityFilter
			geometry.paintWithExtent(attr);
		}
	}

	public function repaintWithoutExtent(style:Style, sprite_:Sprite, ?func:Hash<String>->Bool, ?criterion:Hash<String>->Bool)
	{
		if (sprite_ == null) sprite_ = sprite;
		Utils.clearSprite(sprite_);
		//sprite_.graphics.clear();
		if ((geometry != null) && (style != null)) {
			if (func != null && geometry.properties != null && !func(geometry.propTemporal)) return;	// Фильтр мультивременных данных
			var attr:Dynamic = { };
			attr.sprite = sprite_; attr.style = style; attr.window = window; attr.func = func;
			attr.func1 = criterion;		// фильтр видимости setVisibilityFilter
			geometry.paint(attr);
		}
	}
}
