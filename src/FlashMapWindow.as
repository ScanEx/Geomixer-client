import flash.external.*;
import flash.geom.*;
import flash.filters.*;
import flash.display.BitmapData;

class FlashMapWindow {

	static function createClip(parent, name)
	{
		return parent.createEmptyMovieClip(name || FlashMap.getNextId(), parent.getNextHighestDepth());
	}

	static var allWindows = {};


	var id, clip, mask, x1, y1, x2, y2;
	var backgroundMC, backgroundColor, objectsMC, vectorMC, vectorBitmap, labelsMC, labelsBitmap, labelTF;
	var oldPaintZ, getCurrentZ, needUpdateTiles, tileUpdateCallbacks, objectRoot;
	var totalTiledObjects, tilesCurrentlyLoading, isFirstLoad;
	var dirtyFlag, vectorCacheRepaintNeeded;

	function FlashMapWindow(clip_, getCurrentZ_)
	{
		var me = this;

		clip = clip_;
		mask = createClip(_root);
		clip.setMask(mask);
		backgroundMC = createClip(clip);
		backgroundColor = false;
		getCurrentZ = getCurrentZ_;
		oldPaintZ = 100;
		needUpdateTiles = {};
		tileUpdateCallbacks = {};
		totalTiledObjects = 0;
		tilesCurrentlyLoading = 0;
		dirtyFlag = true;
 		isFirstLoad = true;
		objectRoot = new FlashMapObjectRoot(clip, this);
		objectRoot.rootObject.clip._quality = "LOW";
		id = objectRoot.rootObject.id;
		allWindows[id] = this;

		update(0, 0, 0, 0, false);

		if (getCurrentZ)
		{
			createClip(clip_).onEnterFrame = function()
			{
				if (!me.objectRoot.rootObject.clip._visible)
					return;
				var z = me.getCurrentZ();
				if (z == Math.ceil(z))
				{						
					for (var id in me.needUpdateTiles)
					{
						if (me.tilesCurrentlyLoading > 10)
							break;
						var obj = FlashMapObject.allObjects[id];
						if (obj)
						{
							obj.updateVisibility();
							if (obj.filterCache)
							{
								for (var i = 0; i < obj.filterCache.length; i++)
									obj.filterCache[i].child.updateVisibility();
							}
							if (!obj.recurseUp(function(o) { return !o.clip._visible; }))
							{
								me.tileUpdateCallbacks[id]();
								delete me.needUpdateTiles[id];
							}
						}
						else
						{
							delete me.tileUpdateCallbacks[id];
							me.totalTiledObjects -= 1;
							delete me.needUpdateTiles[id];
						}
					}
				}
			}
		}
	}

	function setBackgroundColor(color)
	{
		backgroundColor = color;
		updateBackground();
	}

	function updateBackground()
	{
		backgroundMC.clear();
		if (!backgroundColor)
			return;
		backgroundMC.beginFill(backgroundColor, 100);
		backgroundMC.moveTo(x1, y1);
		backgroundMC.lineTo(x1, y2);
		backgroundMC.lineTo(x2, y2);
		backgroundMC.lineTo(x2, y1);
		backgroundMC.lineTo(x1, y1);
		backgroundMC.endFill();
	}

	function update(x1_, y1_, x2_, y2_, flag)
	{
		var me = this;

		objectRoot.rootObject.hiddenByCaching = flag;
		objectRoot.rootObject.updateVisibility();

		if (!flag)
			objectRoot.rootObject.clip.transform.matrix = objectRoot.cacheMC.transform.matrix;

		vectorMC._visible = flag;

		if ((x1 == x1_) && (y1 == y1_) && (x2 == x2_) && (y2 == y2_))
			return;

		x1 = x1_;
		y1 = y1_;
		x2 = x2_;
		y2 = y2_;

		mask.clear();
		mask.beginFill(0xffffff, 100);
		mask.moveTo(x1, y1);
		mask.lineTo(x1, y2);
		mask.lineTo(x2, y2);
		mask.lineTo(x2, y1);
		mask.lineTo(x1, y1);
		mask.endFill();

		updateBackground();

		if (vectorMC)
			vectorMC.removeMovieClip();
		vectorMC = createClip(objectRoot.cacheMC);
		vectorBitmap = new BitmapData(x2 - x1, y2 - y1, true);
		vectorMC.attachBitmap(vectorBitmap, vectorMC.getNexthighestDepth());
		vectorMC._visible = flag;

		if (labelsMC)
			labelsMC.removeMovieClip();
		labelsMC = createClip(objectRoot.cacheMC);
		labelsBitmap = new BitmapData(x2 - x1, y2 - y1, true);
		labelsMC.attachBitmap(labelsBitmap, labelsMC.getNexthighestDepth());

		labelsMC.createTextField("label", labelsMC.getNextHighestDepth(), 0, 0, 600, 100);
		labelTF = labelsMC.label;
		labelTF.selectable = false;
		labelTF._visible = false;
		var fmt = new TextFormat();
		fmt.size = 10;
		fmt.font = "Arial";
		fmt.align = "left";
		fmt.color = 0xffffff;
		labelTF.setNewTextFormat(fmt);
	}

	function repaintLabels()
	{
		var currentZ = getCurrentZ ? getCurrentZ() : 0;
		if (currentZ != Math.round(currentZ))
			return;
		var vb = getVisibleBounds();
		var mat = objectRoot.cacheMC.transform.matrix.clone();
		mat.invert();
		labelsMC.transform.matrix = mat;
		labelsBitmap.fillRect(new Rectangle(0, 0, labelsBitmap.width, labelsBitmap.height), 0x00000000);
		var me = this;
		var fmt = new TextFormat();
		var scale = FlashMap.getScale(getCurrentZ());
		var leftMargin = 50*scale;

		objectRoot.rootObject.recurseDown(function(obj)
		{
			if (!obj.visibilitySet || !obj.zoomInBounds())
				return false;
			var s = obj.getEffectiveStyle();
			var l = s.label;
			if (!l)
				return true;
			var bb = obj.geometryBounds;
			if (bb && ((bb.minx > vb.maxx) || (bb.maxx < vb.minx) || (bb.miny > vb.maxy) || (bb.maxy < vb.miny)))
				return false;
			for (var i = 0; i < obj.geometries.length; i++)
			{
				var geom = obj.geometries[i];
				var b = geom.bounds;
				if ((b.maxx < vb.minx - leftMargin) || (b.minx > vb.maxx) || (b.miny > vb.maxy) || (b.maxy < vb.miny))
					continue;
				if (geom.objectId)
				{
					var parts = obj.parent.vectorObjectCache[geom.objectId];
					for (var tileId in parts)
					{
						var b2 = obj.parent.vectorTileCache[tileId].geometries[parts[tileId]].bounds;
						if (b2 != b)
							b = Bounds.union(b, b2);
					}
				}
				var x = (b.minx + b.maxx)/2;
				var y = (b.miny + b.maxy)/2;
				var labelText = obj.properties[i][l.field];
				var approxTextWidth = l.size*labelText.length*0.6;
				if ((x >= vb.minx - approxTextWidth*scale) && (y >= vb.miny) && (x <= vb.maxx) && (y <= vb.maxy))
				{
					if (labelText && (labelText != ""))
					{
						var align = l.align || ((geom.type == "POINT") ? "left" : "center");
						var markerDx = (s.marker ? 4 : 0) + 1;
						var pt = me.objectRoot.cacheMC.transform.matrix.transformPoint(new Point(x, y));
						var posY = pt.y - l.size*0.8;
						if (!me.labelsBitmap.hitTest(new Point(0, 0), 1, new Rectangle(
							(align == "left") ? (pt.x + markerDx) :
							(align == "center") ? (pt.x - approxTextWidth/2) :
							(pt.x - approxTextWidth - markerDx),
							posY, approxTextWidth, 20
						)))
						{
							me.labelTF._visible = true;
							me.labelTF.html = true;
							me.labelTF.htmlText = labelText;
							me.labelTF.textColor = l.color;
							fmt.size = l.size;
							fmt.align = align;
							me.labelTF.setTextFormat(fmt);
							me.labelsBitmap.draw(me.labelTF, new Matrix(1, 0, 0, 1, pt.x + ((align == "left") ? markerDx : (align == "center") ? -300 : (-600 - markerDx)), posY));
							me.labelTF._visible = false;
						}
					}
				}
			}
			return true;
		});
	}

	function repaintVectorCache()
	{
		var me = this;
		var currentZ = me.getCurrentZ();
		if (currentZ != Math.round(currentZ))
			return;
		var mat = me.objectRoot.cacheMC.transform.matrix.clone();
		mat.invert();
		me.vectorMC.transform.matrix = mat;
		me.vectorBitmap.fillRect(new Rectangle(0, 0, me.vectorBitmap.width, me.vectorBitmap.height), 0);
		me.vectorBitmap.draw(me.objectRoot.rootObject.clip, me.objectRoot.cacheMC.transform.matrix);
	}

	function onTileUpdate(obj, callback)
	{
		totalTiledObjects += 1;
		tileUpdateCallbacks[obj.id] = callback;
		needUpdateTiles[obj.id] = true;
	}

	function getVisibleBounds()
	{
		var inv = objectRoot.cacheMC.transform.matrix.clone();
		inv.invert();
		var p1 = inv.transformPoint(new Point(x1, y1));
		var p2 = inv.transformPoint(new Point(x2, y2));
		return new Bounds([[p1.x, p1.y], [p2.x, p2.y]]);
	}

	function forEachTile(bounds, z, callback, dy)
	{
		if (!dy)
			dy = 0;

		var worldWidth = 256*FlashMap.getScale(17);
		var tileSize = 256*FlashMap.getScale(z);

		if (!bounds)
			bounds = new Bounds([[-worldWidth, -worldWidth], [worldWidth, worldWidth]]);
		var bx1 = bounds.minx, bx2 = bounds.maxx;
		var vb = getVisibleBounds();

		while (bx2 > vb.minx + worldWidth)
		{
			bx1 -= worldWidth;
			bx2 -= worldWidth;
		}

		while (bx1 < vb.maxx)
		{
			for (var j = Math.floor(Math.max(vb.miny - dy, bounds.miny - dy)/tileSize); j < Math.ceil(Math.min(vb.maxy - dy, bounds.maxy - dy)/tileSize); j++)
 				for (var i = Math.ceil(Math.min(vb.maxx, bx2)/tileSize) - 1; i >= Math.floor(Math.max(vb.minx, bx1)/tileSize); i--)
					if (callback(i, j, tileSize))
						tilesCurrentlyLoading += 1;

			bx1 += worldWidth;
			bx2 += worldWidth;
		}
	}

	var matrix = false;

	function recenter(x, y)
	{
		var c = 1/FlashMap.getScale(getCurrentZ());
		objectRoot.cacheMC.transform.matrix = new Matrix(c, 0, 0, -c, (x1 + x2)/2 - c*x, (y1 + y2)/2 + c*y);
		if (objectRoot.rootObject.clip._visible)
			objectRoot.rootObject.clip.transform.matrix = objectRoot.cacheMC.transform.matrix;
		for (var id in tileUpdateCallbacks)
			needUpdateTiles[id] = true;
		objectRoot.repositionChildren();
	}

	function tileFinishedLoading()
	{
		tilesCurrentlyLoading -= 1;
		if ((tilesCurrentlyLoading == 0) && (objectRoot.rootObject.clip._visible))
			repaintLabels();
	}
}
                                                         