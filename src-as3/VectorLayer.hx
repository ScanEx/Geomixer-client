import flash.events.Event;

class VectorLayer extends MapContent
{	
	public var tileFunction:Int->Int->Int->Dynamic;
	public var identityField:String;
	public var tiles:Array<VectorTile>;
	public var geometries:Hash<Geometry>;

	public var hoverPainter:GeometryPainter;
	public var lastId:String;
	public var currentId:String;
	public var currentFilter:VectorLayerFilter;

	var flipCounts:Hash<Int>;
	var lastFlipCount:Int;
	var flipDown:Bool;

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public function new(identityField_:String, tileFunction_:Int->Int->Int->Dynamic)
	{
		identityField = identityField_;
		tileFunction = tileFunction_;
		flush();
	}

	public function flush()
	{
		tiles = new Array<VectorTile>();
		geometries = new Hash<Geometry>();
		flipCounts = new Hash<Int>();
		lastFlipCount = 0;
		if (mapNode != null)
			for (child in mapNode.children)
				if (Std.is(child.content, VectorLayerFilter))
					cast(child.content, VectorLayerFilter).flush();
	}

	public function addTile(i:Int, j:Int, z:Int)
	{
		tiles.push(new VectorTile(this, i, j, z));
	}

	public function createLoader(func:VectorTile->Int->Void)
	{
		var loaded = new Array<Bool>();
		for (tile in tiles)
			loaded.push(false);
		var nRemaining = 0;
		var me = this;
		var w = 2*Utils.worldWidth;
		return function(e1:Extent)
		{
			var tilesToLoad = new Array<VectorTile>();
			for (i in 0...me.tiles.length)
			{
				if (loaded[i])
					continue;

				var tile = me.tiles[i];
				var e2 = tile.extent;
				if ((e1.miny < e2.maxy) && (e2.miny < e1.maxy) && (
					((e1.minx < e2.maxx) && (e2.minx < e1.maxx)) || 
					((e1.minx < e2.maxx + w) && (e2.minx + w < e1.maxx)) || 
					((e1.minx < e2.maxx - w) && (e2.minx - w < e1.maxx))
				))
				{
					loaded[i] = true;
					nRemaining += 1;
					tilesToLoad.push(tile);
				}
			}
			for (tile in tilesToLoad)
			{
				tile.load(function()
				{
					nRemaining -= 1;
					func(tile, nRemaining);
				});
			}
		}
	}

	public function getStat()
	{
		var out:Dynamic = { };
		out.tilesCnt = tiles.length;
		out.pointsCnt = 0;
		for (tile in tiles)
		{
			if (tile.ids != null) out.pointsCnt += tile.ids.length;
		}
		return out;
	}

	public function repaintIndicator()
	{
		var distance:Float = Geometry.MAX_DISTANCE;
		var x = contentSprite.mouseX;
		var y = contentSprite.mouseY;
		var w = Utils.worldWidth;
		while (x > w)
			x -= 2*w;
		while (x < -w)
			x += 2*w;

		var newCurrentId:String = null;
		var newCurrentFilter:VectorLayerFilter = null;
		var zeroDistanceIds = new Array<String>();
		var zeroDistanceFilters = new Array<VectorLayerFilter>();

		var pointSize = 15*Math.abs(mapNode.window.scaleY);
		var pointExtent = new Extent();
		pointExtent.update(x - pointSize, y - pointSize);
		pointExtent.update(x + pointSize, y + pointSize);

		for (tile in tiles)
		{
			if (!tile.finishedLoading) continue;
			if ((tile.ids != null) && tile.extent.overlaps(pointExtent))
			{
				for (i in 0...tile.ids.length)
				{
					var d = tile.geometries[i].distanceTo(x, y);
					if (d <= distance)
					{
						var id = tile.ids[i];
						for (node in mapNode.children)
						{
							if (node.vectorSprite.visible && Std.is(node.content, VectorLayerFilter))
							{
								var filter = cast(node.content, VectorLayerFilter);
								if (filter.ids.exists(id))
								{
									newCurrentId = id;
									newCurrentFilter = filter;
									distance = d;
									if (d == 0)
									{
										zeroDistanceIds.push(id);
										zeroDistanceFilters.push(filter);
									}
								}
							}
						}
					}
				}
			}
		}
		var len = zeroDistanceIds.length;
		flipDown = (len > 1);
		if (len > 0)
		{
			var lastFc:Null<Int> = 100000000;
			var lastDate = "1900-00-00";
			for (i in 0...zeroDistanceIds.length)
			{
				var id = zeroDistanceIds[i];
				var fc:Null<Int> = flipCounts.get(id);
				var date = Utils.getDateProperty(geometries.get(id).properties);
				var isHigher:Bool = false;
				var isHigherDate = (date == null) || (date > lastDate);
				if (lastFc == null)
					isHigher = (fc == null) ? isHigherDate : (fc < 0);
				else if (lastFc > 0)
					isHigher = (fc == null) || (fc < lastFc);
				else if (lastFc < 0)
					isHigher = (fc != null) && (fc < lastFc);
				if (isHigher)
				{
					lastFc = fc;
					lastDate = date;
					newCurrentId = id;
					newCurrentFilter = zeroDistanceFilters[i];
				}
			}
		}
		if (newCurrentId != currentId)
		{
			if ((newCurrentFilter != currentFilter) && (currentFilter != null))
				currentFilter.mapNode.callHandler("onMouseOut");
			currentId = newCurrentId;
			if (currentId != null)
				lastId = currentId;
			if (newCurrentFilter != null)
				newCurrentFilter.mapNode.callHandler("onMouseOver");
			currentFilter = newCurrentFilter;

			hoverPainter.geometry = (distance != Geometry.MAX_DISTANCE) ? geometries.get(currentId) : null;
			hoverPainter.repaint((currentFilter != null) ? currentFilter.mapNode.getHoveredStyle() : null);
		}
		if (currentFilter != null)
			currentFilter.mapNode.callHandler("onMouseMove");
	}

	public override function addHandlers()
	{
		hoverPainter = new GeometryPainter(null, Utils.addSprite(contentSprite), mapNode.window);
	}

	public function flip():Int
	{
		lastFlipCount += 1;
		var ret = flipDown ? lastFlipCount : -lastFlipCount;
		if (currentId != null)
		{
			flipCounts.set(currentId, ret);
			repaintIndicator();
		}
		return ret;
	}
}
