import flash.display.Sprite;

class MaskedContent extends MapContent
{
	public var maskGeometry:Geometry;
	var lastMaskGeometry:Geometry;
	var maskSprite:Sprite;
	var partSprites:Array<Sprite>;

	public function setMask(maskGeometry_:Geometry)
	{
		maskGeometry = maskGeometry_;
	}

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.rasterSprite);
	}

	public override function repaint()
	{
		var style = mapNode.getRegularStyle();
		if ((style != null) && (style.fill != null))
			contentSprite.alpha = style.fill.opacity;

		if (maskGeometry != lastMaskGeometry)
		{
			var n = 3;
			if (maskSprite == null)
			{
				maskSprite = Utils.addSprite(mapNode.rasterSprite);
				contentSprite.mask = maskSprite;
				partSprites = new Array<Sprite>();
				for (i in 0...n)
				{
					var partSprite = Utils.addSprite(maskSprite);
					partSprite.x = (2*i - n + 1)*Utils.worldWidth;
					partSprites.push(partSprite);
				}
			}
			for (sprite in partSprites)
			{
				sprite.graphics.clear();
				maskGeometry.paint(sprite, new Style({ fill: { color: 0xffffff } }), null);
				if(maskGeometry.myDrawing.length > 0) sprite.graphics.drawGraphicsData(maskGeometry.myDrawing);
			}
			lastMaskGeometry = maskGeometry;
		}
	}
}