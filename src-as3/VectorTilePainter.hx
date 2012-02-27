import flash.display.Sprite;

class VectorTilePainter
{
	var oldStyleID:Int;
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
//vectorSprite.cacheAsBitmap = true;
//vectorSprite.opaqueBackground = 0x00ff00;
		painter = new GeometryPainter(tileGeometry, vectorSprite, mapWindow);
		sprite.name = tile.z + '_' + tile.i + '_' + tile.j;
		rasterSprite.name = 'r' + sprite.name;
		vectorSprite.name = 'v' + sprite.name;
		oldStyleID = 0;
		cacheSprite = new Sprite();
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

	public function repaint(style:Style)
	{
		var curZ:Float = mapWindow.getCurrentZ();
		if (mapWindow.cacheBitmap.visible || (curZ != Math.round(curZ)))
			return;

		var currentZ:Int = Std.int(curZ);
		var tileOverlap = mapWindow.visibleExtent.overlapsFull(tile.extent);	// Полное перекрытие геометрии тайла

		var clustersDisabled:Bool = (vectorLayerFilter.clusterAttr == null || vectorLayerFilter.clusterAttr._zoomDisabledHash.exists(currentZ) ? true : false);
		if (clustersDisabled) {
			painter.geometry = tileGeometry;
		} else {
			var tileIntersect = mapWindow.visibleExtent.overlaps(tile.extent);		// Частичное перекрытие геометрии тайла
			if (tileIntersect && !tileOverlap) oldStyleID = 0;
			if (tileIntersect) {
				clustersGeometry = Utils.getClusters(vectorLayerFilter, tileGeometry, tile, currentZ);
				painter.geometry = clustersGeometry;
			}
		}

		var repaintCache:Bool = false;
		if ((style != null && style.curCount != oldStyleID) || oldZ != currentZ)
		{
			repaintCache = true;
			oldStyleID = style.curCount;
			oldZ = currentZ;
		}

		if (tileOverlap)
		{
			if (repaintCache || cacheSprite.width == 0 || cacheSprite.height == 0) {
				cacheSprite.graphics.clear();
				painter.repaintWithoutExtent(style, cacheSprite, vectorLayerFilter.layer.temporalCriterion);
			}
			if (cacheSprite.parent == null) rasterSprite.addChild(cacheSprite);

			if(!rasterSprite.visible) rasterSprite.visible = true;
			if(vectorSprite.visible) vectorSprite.visible = false;
		}
		else
		{
			if (cacheSprite.width > 0) cacheSprite.graphics.clear();
			painter.repaint(style, vectorLayerFilter.layer.temporalCriterion);
			if(rasterSprite.visible) rasterSprite.visible = false;
			if(!vectorSprite.visible) vectorSprite.visible = true;
		}

	}
}