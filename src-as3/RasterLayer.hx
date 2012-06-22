import flash.display.DisplayObjectContainer;
import flash.display.Sprite;
import flash.geom.Matrix;

class RasterLayer extends MaskedContent
{
	public var tileFunction:Int->Int->Int->String;
	public var tilesPerZoomLevel:Array<Int>;
	public var tiles:Hash<RasterTile>;
	public var failedTiles:Hash<Bool>;
	public var tileCaching:Bool;
	var myDx:Float->Float;
	var myDy:Float->Float;

	public var maxZoom:Int;
	public var minZoom:Int;

	var maxZoomView:Int;
	var minZoomView:Int;

	public function new(tileFunction_:Int->Int->Int->String, minZoom_:Int, maxZoom_:Int, ?minZoomView_:Int, ?maxZoomView_:Int)
	{
		maxZoomView = (maxZoomView_ > 0 ? maxZoomView_ : 0);
		minZoomView = (minZoomView_ > 0 ? minZoomView_ : 0);
		maxZoom = (maxZoom_ > 0 ? maxZoom_ : 0);
		minZoom = (minZoom_ > 0 ? minZoom_ : 0);
		tileFunction = tileFunction_;
		tilesPerZoomLevel = new Array<Int>();
		for (i in 0...25)
			tilesPerZoomLevel[i] = 0;
		tiles = new Hash<RasterTile>();
		failedTiles = new Hash<Bool>();
		tileCaching = true;
		myDx = function(x:Float):Float { return 0; };
		myDy = function(y:Float):Float { return 0; };
	}

	public function setDisplacement(dx_:Float->Float, dy_:Float->Float)
	{
		myDx = dx_;
		myDy = dy_;
		repaint();
	}

	public override function repaint()
	{
		if (Main.isDrawing) return;		// В режиме рисования ничего не делаем
//		if(Main.isDraggingNow) return;
		super.repaint();

		var window = mapNode.window;
		var z = Std.int(window.getCurrentZ());

		var vb = window.visibleExtent;
		var dx:Float = myDx((vb.minx + vb.maxx)/2);
		var dy:Float = myDy((vb.miny + vb.maxy)/2);

		if(contentSprite.x != dx) contentSprite.x = dx;
		if(contentSprite.y != dy) contentSprite.y = dy;

		for (id in tiles.keys())
		{
			var tile:RasterTile = tiles.get(id);
			if (
				((maxZoomView > 0 && z > maxZoomView) || (minZoomView > 0 && z < minZoomView)) ||	// Если установлен minZoomView maxZoomView
				(tile.isOverlay ? tile.z != z : tile.z > z) ||
				(!tile.loaded && (tile.isReplacement ? tile.z > z : tile.z != z))
				)
			{
				tile.remove();
				tiles.remove(id);
			}
		}

		var ww = Utils.worldWidth;

		var extent:Extent;
		if (maskGeometry != null)
			extent = maskGeometry.extent;
		else
		{
			extent = new Extent();
			extent.update(-ww, -ww);
			extent.update(ww, ww);
		}
		var bx1 = extent.minx, bx2 = extent.maxx;

		while (bx2 > vb.minx + 2*ww)
		{
			bx1 -= 2*ww;
			bx2 -= 2*ww;
		}

		var tileSize:Float = 256*Utils.getScale(z);
		var worldSize:Float = Math.pow(2, z);

		while (bx1 < vb.maxx)
		{
			var j1 = Math.floor((Math.max(vb.miny, extent.miny) - dy)/tileSize);
			var j2 = Math.ceil((Math.min(vb.maxy, extent.maxy) - dy)/tileSize);
			var i1 = Math.floor((Math.max(vb.minx, bx1) - dx)/tileSize);
			var i2 = Math.ceil((Math.min(vb.maxx, bx2) - dx)/tileSize);
			for (j in j1...j2)
 				for (i in i1...i2)
					loadTile(i, j, z, false, false);
			bx1 += 2*ww;
			bx2 += 2*ww;
		}
	}

	public function markTileAsFailed(i:Int, j:Int, z:Int)
	{
		failedTiles.set(i + "_" + j + "_" + z, true);
	}

	public function loadTile(i:Int, j:Int, z:Int, isReplacement:Bool, isRetrying:Bool)
	{
		if (z <= mapNode.window.getCurrentZ())
		{
			if ((maxZoomView > 0 && z > maxZoomView) || (minZoomView > 0 && z < minZoomView)) return; // Если установлен minZoomView maxZoomView
			var id = i + "_" + j + "_" + z;
			if (!tiles.exists(id) && !failedTiles.exists(id))
				tiles.set(id, new RasterTile(this, i, j, z, isReplacement, isRetrying));
		}
	}

	public function bringToTop()
	{
		var spr:DisplayObjectContainer = mapNode.rasterSprite;
		spr.parent.setChildIndex(spr, spr.parent.numChildren - 1);
	}
}