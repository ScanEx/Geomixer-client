import flash.geom.Matrix;
import flash.events.Event;
import flash.errors.Error;
import flash.display.DisplayObject;
import flash.display.Sprite;
import flash.display.BitmapData;

import flash.utils.Timer;
import flash.events.TimerEvent;

class RasterTile
{
	static var tilesCurrentlyLoading:Int = 0;
	static var loadQueue:Array<RasterTile> = new Array<RasterTile>();
	static var timer:Timer = null;

	/*	
	static function loadDone()
	{
		tilesCurrentlyLoading -= 1;
		loadNext();
	}
	*/

	static function loadNext(?e:Event)
	{
		while (tilesCurrentlyLoading < 8 && loadQueue.length > 0)
		{
			tilesCurrentlyLoading += 1;
			loadQueue.pop().load();
		}
		if (loadQueue.length < 1 && timer != null) timer.stop();
	}

	public var layer:RasterLayer;
	public var i:Int;
	public var j:Int;
	public var z:Int;
	public var isReplacement:Bool;
	public var isRetrying:Bool;

	public var loaded:Bool;
	public var removed:Bool;
	public var isOverlay:Bool;

	var contents:DisplayObject;
	var updateAlphaListener:Dynamic->Void;
	var alpha:Float;

	public function new(layer_:RasterLayer, i_:Int, j_:Int, z_:Int, isReplacement_:Bool, isRetrying_:Bool)
	{		
		layer = layer_;
		i = i_;
		j = j_;
		z = z_;
		isReplacement = isReplacement_;
		isRetrying = isRetrying_;

		loaded = false;
		removed = false;
		isOverlay = false;

		loadQueue.push(this);
		loadNext();
		if(timer == null) {
			timer = new Timer(4);
			timer.addEventListener("timer", loadNext);
		}
		if(!timer.running) timer.start();
	}

	public function load()
	{
		if (!removed)
		{
			try {
				var me = this;
				var worldSize:Float = Math.pow(2, z);
				Utils.loadImage(
					layer.tileFunction(Math.round((i + 3*worldSize/2)%worldSize - worldSize/2), j, Math.round(z)), 
					function(contents) { me.onLoad(contents); },
					function() { me.onError(); }
				);
			} 
			catch (e:Error) 
			{
				onError();
			}
		}
		else {
			tilesCurrentlyLoading -= 1;
			//loadDone();
		}
	}

	public function remove()
	{
		if (removed)
			return;
		removed = true;
		layer.tiles.remove(i + "_" + j + "_" + z);
		if (contents != null)
		{
			layer.contentSprite.removeChild(contents);
			layer.tilesPerZoomLevel[z] -= 1;
		}
	}

	function onLoad(contents_:DisplayObject)
	{
		tilesCurrentlyLoading -= 1;
		//loadDone();
		if (!removed)
		{
			contents = contents_;

			var index = 0;
			for (i in 0...z)
				index += layer.tilesPerZoomLevel[i];
			layer.contentSprite.addChildAt(contents, index);
			layer.tilesPerZoomLevel[z] += 1;
			loaded = true;

			var scale:Float = Utils.getScale(z);
			var tileSize:Float = 256*scale;
			contents.transform.matrix = new Matrix(scale, 0, 0, -scale, i*tileSize, (j + 1)*tileSize);

			contents.alpha = 0;
			alpha = 0.2;
			var me = this;
			updateAlphaListener = function(event) { me.updateAlpha(); }
			contents.addEventListener(Event.ENTER_FRAME, updateAlphaListener);

			var size = 32;
			var bmp = new BitmapData(size, size, true, 0);
			try {
				bmp.draw(contents);
			} catch (e:Error) {}
			var hist = bmp.histogram();
			if (hist[3][255] != 1024) isOverlay = true;		// по гистограмме определяем тайлы где в верхнем левом углу 32х32 все alpha = 0xFF
			bmp.dispose();

			if (isOverlay && isReplacement)
				remove();
		}
	}

	function onError()
	{
		tilesCurrentlyLoading -= 1;
		//loadDone();
		remove();
		if (!isRetrying && !isReplacement)
			layer.loadTile(i, j, z, isReplacement, true);
		else
		{
			layer.markTileAsFailed(i, j, z);
			if ((z > 1) && layer.tileCaching)
				layer.loadTile(Std.int(i/2), Std.int(j/2), z - 1, true, false);
		}
	}

	function updateAlpha()
	{
		if (removed)
		{
			removeAlphaListener();	
			return;
		}
		alpha += 0.2;
		if (alpha >= 1.0)
		{
			contents.alpha = 1.0;
			removeAlphaListener();
		}
		else
			contents.alpha = alpha;
	}

	function removeAlphaListener()
	{
		contents.removeEventListener(Event.ENTER_FRAME, updateAlphaListener);
	}
}
