import flash.display.Sprite;
import flash.display.DisplayObject;
import flash.display.Loader;
import flash.display.BitmapData;
import flash.events.Event;
import flash.events.IOErrorEvent;
import flash.net.URLRequest;
import flash.system.LoaderContext;
import flash.errors.Error;
import flash.utils.Timer;
import flash.events.TimerEvent;

class Utils
{
	public static var worldWidth:Float = 20037508;
	public static var worldDelta:Float = 1627508;
	static var nextId:Int = 0;
	static var bitmapDataCache:Hash<BitmapData> = new Hash<BitmapData>();

	public static function getNextId()
	{
		nextId += 1;
		return "id" + nextId;
	}

	public static function addSprite(parent:Sprite)
	{
		var child = new Sprite();
		parent.addChild(child);
		return child;
	}

	public static function getScale(z:Float)
	{
		return Math.pow(2, -z)*156543.033928041;
	}

	public static function getDateProperty(properties:Hash<String>)
	{
		var date = properties.get("date");
		if (date == null)
			date = properties.get("DATE");
		return date;
	}

	public static function loadImage(url:String, onLoad:DisplayObject->Void, ?onError:Void->Void)
	{
		var loader = new Loader();
		var callOnError = function()
		{
			if (onError != null)
				onError();
		}
		var timer = new Timer(60000, 1);
		timer.addEventListener("timer", function(e:TimerEvent)
		{
			try { loader.close(); } catch (e:Error) {}
			callOnError();
		});
		timer.start();

		loader.contentLoaderInfo.addEventListener(Event.INIT, function(event) 
		{ 
			timer.stop();
			onLoad(loader);
			Main.bumpFrameRate();
		});
		loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(event)
		{
			timer.stop();
			callOnError();
		});
		var loaderContext:LoaderContext = new LoaderContext();
		loaderContext.checkPolicyFile = true;
		try 
		{
			loader.load(new URLRequest(url), loaderContext);
		}
		catch (e:Error) 
		{
			trace("security error while loading " + url);
			timer.stop();
			callOnError();
		}
	}

	public static function loadBitmapData(url:String, onLoad:BitmapData->Void)
	{
		var onCacheReady = function()
		{
			onLoad(Utils.bitmapDataCache.get(url));
		}
		if (bitmapDataCache.exists(url))
			onCacheReady();
		else
		{
			var addToCache = function(bitmapData:BitmapData)
			{
				Utils.bitmapDataCache.set(url, bitmapData);
				onCacheReady();
			}
			Utils.loadImage(
				url,
				function(contents)
				{
					var bitmapData = new BitmapData(Std.int(contents.width), Std.int(contents.height), true, 0);
					try
					{ 
						bitmapData.draw(contents);
					} 
					catch (e:Error) 
					{
						trace("security error while loading " + url + ", use crossdomain.xml");
					}
					addToCache(bitmapData);
				},
				function()
				{
					addToCache(null);
				}
			);
		}
	}

	public static function parseGeometry(geometry_:Dynamic, ?tileExtent:Extent):Geometry
	{
		var type:String = geometry_.type;
		if (type == "POINT")
		{
			var c:Array<Float> = parseFloatArray(geometry_.coordinates);
			return new PointGeometry(c[0], c[1]);
		}
		else if (type == "LINESTRING")
		{
			return new LineGeometry(parseFloatArray(geometry_.coordinates));
		}
		else if (type == "POLYGON")
		{
			var coords = new Array<Array<Float>>();
			for (part_ in cast(geometry_.coordinates, Array<Dynamic>))
				coords.push(parseFloatArray(part_));
			return new PolygonGeometry(coords, tileExtent);
		}
		else if (type.indexOf("MULTI") != -1)
		{
			var subtype = type.split("MULTI").join("");
			var ret = new MultiGeometry();
			for (subcoords in cast(geometry_.coordinates, Array<Dynamic>))
				ret.addMember(parseGeometry({ type: subtype, coordinates: subcoords }, tileExtent));
			return ret;
		}
		else
		{
			//trace("Unrecognized geometry type: " + type);
			//throw new Error("Cannot parse geometry");
			return new Geometry();
		}
	}

	static function parseFloatArray(coords_:Dynamic):Array<Float>
	{
		var arr:Array<Dynamic> = cast(coords_, Array<Dynamic>);
		if (Std.is(arr[0], Array))
		{
			var ret = new Array<Float>();
			for (point_ in arr)
			{
				ret.push(point_[0]);
				ret.push(point_[1]);
			}
			return ret;
		}
		else
			return coords_;
	}
}