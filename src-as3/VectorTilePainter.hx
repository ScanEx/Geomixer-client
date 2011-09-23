import flash.display.Sprite;

class VectorTilePainter
{
	var oldStyle:Style;
	var oldZ:Int;
	public var vectorLayerFilter:VectorLayerFilter;
	public var painter:GeometryPainter;
	var sprite:Sprite;
	var mapWindow:MapWindow;
	var rasterSprite:Sprite;
	var vectorSprite:Sprite;
	var cacheSprite:Sprite;

	public var tileGeometry:MultiGeometry;
	public var clustersGeometry:MultiGeometry;
	var tile:VectorTile;

	public function new(geometry_:MultiGeometry, vlf_:VectorLayerFilter, tile_:VectorTile)
	{
		tile = tile_;
		tileGeometry = geometry_;
		vectorLayerFilter = vlf_;
		sprite = vectorLayerFilter.tilesSprite;
		mapWindow = vectorLayerFilter.mapNode.window;
		rasterSprite = Utils.addSprite(sprite);
		vectorSprite = Utils.addSprite(sprite);
//vectorSprite.opaqueBackground = 0x00ff00;
		painter = new GeometryPainter(tileGeometry, vectorSprite, mapWindow);
		sprite.name = tile.z + '_' + tile.i + '_' + tile.j;
		rasterSprite.name = 'r' + sprite.name;
		vectorSprite.name = 'v' + sprite.name;
	}

	public function remove()
	{
		sprite.removeChild(rasterSprite);
		sprite.removeChild(vectorSprite);
	}

	public function setOffset(dx:Float)
	{
		if(vectorSprite.x != dx) {
			rasterSprite.x = dx;
			vectorSprite.x = dx;
		}
	}

	private function clearCacheSprite()
	{
		if (cacheSprite != null)
		{
			if(cacheSprite.parent != null) cacheSprite.parent.removeChild(cacheSprite);
			cacheSprite = null;
		}
	}

	public function repaint(style:Style)
	{
		var curZ:Float = mapWindow.getCurrentZ();
		if (mapWindow.cacheBitmap.visible || (curZ != Math.round(curZ)))
			return;

		var currentZ:Int = Std.int(curZ);
		var tileOverlap = mapWindow.visibleExtent.overlapsFull(tile.extent);	// Полное перекрытие геометрии тайла
		var tileIntersect = mapWindow.visibleExtent.overlaps(tile.extent);		// Частичное перекрытие геометрии тайла

		if (vectorLayerFilter.clusterAttr == null) {
			painter.geometry = tileGeometry;
		} else {
			if (tileIntersect && !tileOverlap) oldStyle = null;
			if (tileIntersect) {
				clustersGeometry = Utils.getClusters(vectorLayerFilter, tileGeometry, tile, currentZ);
				painter.geometry = clustersGeometry;
			}
			
		}

		//tileOverlap = mapWindow.visibleExtent.overlapsFull(painter.geometry.extent);	// Полное перекрытие геометрий
		if (style != oldStyle || oldZ != currentZ)
		{
			clearCacheSprite();
			oldStyle = style;
			oldZ = currentZ;
		}

		if (tileOverlap)
		{
			if (cacheSprite == null)
			{
				cacheSprite = new Sprite();
				painter.repaintWithoutExtent(style, cacheSprite);
			}

			rasterSprite.addChild(cacheSprite);
			if(!rasterSprite.visible) rasterSprite.visible = true;
			if(vectorSprite.visible) vectorSprite.visible = false;
		}
		else
		{
			painter.repaint(style);
			if(rasterSprite.visible) rasterSprite.visible = false;
			if(!vectorSprite.visible) vectorSprite.visible = true;
		}

	}
}