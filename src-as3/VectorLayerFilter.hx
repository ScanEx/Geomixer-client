import flash.display.Sprite;
import flash.events.Event;
import flash.events.MouseEvent;

class VectorLayerFilter extends MapContent
{
	public var criterion:Hash<String>->Bool;
	public var loadedTiles:Array<VectorTile>;
	public var painters:Array<VectorTilePainter>;
	public var tilesSprite:Sprite;
	public var loader:Extent->Void;
	public var layer:VectorLayer;
	public var ids:Hash<Bool>;

	public function new(criterion_:Hash<String>->Bool)
	{
		criterion = criterion_;
		flush();
	}

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public function flush()
	{
		if (painters != null)
			for (painter in painters)
				painter.remove();
		loadedTiles = new Array<VectorTile>();
		painters = new Array<VectorTilePainter>();
		ids = new Hash<Bool>();
		if (layer != null)
			createLoader();
	}

	function createLoader()
	{
		var me = this;
		loader = layer.createLoader(function(tile:VectorTile, tilesRemaining:Int)
		{
			me.loadedTiles.push(tile);
			var tileGeometry = new MultiGeometry();
			for (i in 0...tile.geometries.length)
			{
				var geom = tile.geometries[i];
				if (me.criterion(geom.properties))
				{
					me.ids.set(tile.ids[i], true);
					tileGeometry.addMember(geom);
				}
			}
			var window = me.mapNode.window;
			var painter = new VectorTilePainter(tileGeometry, me.tilesSprite, window, tile.i, tile.j, tile.z);
			me.painters.push(painter);
			painter.repaint(me.mapNode.getRegularStyle());
			if (tilesRemaining == 0)
			{
				window.cacheRepaintNeeded = true;
				var style = me.mapNode.regularStyle;
				if ((style != null) && (style.label != null))
					window.labelsRepaintNeeded = true;
				for (child in me.layer.mapNode.children)
					if (Std.is(child.content, VectorLayerObserver))
						child.noteSomethingHasChanged();
			}
		});
	}

	public override function repaint()
	{
		if (loader != null) loader(mapNode.window.visibleExtent);

		var w = 2*Utils.worldWidth;
		var e1 = mapNode.window.visibleExtent;
		var cx1 = (e1.minx + e1.maxx)/2;
		for (painter in painters)
		{
			painter.repaint(mapNode.getRegularStyle());
			var e2 = painter.painter.geometry.extent;
			var cx2 = (e2.minx + e2.maxx)/2;
			var d1 = Math.abs(cx2 - cx1 - w);
			var d2 = Math.abs(cx2 - cx1);
			var d3 = Math.abs(cx2 - cx1 + w);
			if ((d1 <= d2) && (d1 <= d3))
				painter.setOffset(-w);
			else if ((d2 <= d1) && (d2 <= d3))
				painter.setOffset(0);
			else if ((d3 <= d1) && (d3 <= d2))
				painter.setOffset(w);
		}
	}

	public override function hasLabels()
	{
		var style = mapNode.getRegularStyle();
		return ((style != null) && (style.label != null));
	}

	public override function paintLabels()
	{
		if (hasLabels())
		{
			var style = mapNode.getRegularStyle();
			var window = mapNode.window;
			var idsAlreadyPainted = new Hash<Bool>();
			var e1 = window.visibleExtent;
			for (tile in loadedTiles)
			{
				var e2 = tile.extent;
				if (e1.overlaps(e2))
				{
					for (i in 0...tile.ids.length)
					{
						var id = tile.ids[i];
						if (ids.exists(id) && !idsAlreadyPainted.exists(id))
						{
							var geom = layer.geometries.get(id);
							window.paintLabel(
								geom.properties.get(style.label.field),
								geom,
								style
							);
							idsAlreadyPainted.set(id, true);
						}
					}
				}
			}
		}
	}

	public override function addHandlers()
	{
		layer = cast(mapNode.parent.content, VectorLayer);
		createLoader();
		tilesSprite = Utils.addSprite(contentSprite);

		var me = this;
		contentSprite.addEventListener(MouseEvent.MOUSE_DOWN, function(event:MouseEvent)
		{
			if (me.layer.currentFilter != null)
				Main.registerMouseDown(me.layer.currentFilter.mapNode, event);
		});
		contentSprite.addEventListener(MouseEvent.MOUSE_MOVE, function(event:Event)
		{
			me.layer.repaintIndicator();
		});
		contentSprite.addEventListener(MouseEvent.ROLL_OUT, function(event:Event)
		{
			if (me.layer.currentFilter != null)
			{
				var node = me.layer.currentFilter.mapNode;
				node.callHandler("onMouseOut");
			}
			me.layer.hoverPainter.repaint(null);
			me.layer.currentId = null;
			me.layer.currentFilter = null;
		});
	}
}
