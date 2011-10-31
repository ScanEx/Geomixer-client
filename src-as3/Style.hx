class Style
{
	public var marker:MarkerStyle;
	public var outline:OutlineStyle;
	public var fill:FillStyle;
	public var label:LabelStyle;

	public function new(?style:Dynamic)
	{
		if (style != null)
		{
			marker = (style.marker != null) ? (new MarkerStyle(style.marker, this)) : null;
			outline = (style.outline != null) ? (new OutlineStyle(style.outline)) : null;
			fill = (style.fill != null) ? (new FillStyle(style.fill)) : null;
			label = (style.label != null) ? (new LabelStyle(style.label)) : null;
		}
	}

	public function load(onLoad:Void->Void)
	{
		var markerFinished = false;
		var fillFinished = false;
		var tryToFinish = function()
		{
			if (markerFinished && fillFinished)
				onLoad();
		}
		var finishMarker = function()
		{
			markerFinished = true;
			tryToFinish();
		}
		var finishFill = function()
		{
			fillFinished = true;
			tryToFinish();
		}
		if (marker != null)
			marker.load(finishMarker);
		else
			finishMarker();
			
		if (fill != null)
			fill.load(finishFill);
		else
			finishFill();
	}

	public function hasMarkerImage()
	{
		return ((marker != null) && (marker.imageUrl != null));
	}

	public function hasPatternFill()
	{
		return (fill != null) && (fill.bitmapData != null || fill.pattern != null);
	}
	
	public function getStyle(removeDefaults:Bool)
	{
		var style: Dynamic = {};
		if (marker  != null) style.marker  = marker.getStyle(removeDefaults);
		if (outline != null) style.outline = outline.getStyle(removeDefaults);
		if (fill    != null) style.fill    = fill.getStyle(removeDefaults);
		if (label   != null) style.label   = label.getStyle(removeDefaults);
		return style;
	}
}