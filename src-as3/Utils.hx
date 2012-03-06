import flash.display.Bitmap;
import flash.display.BitmapData;
import flash.display.Sprite;
import flash.display.DisplayObject;
import flash.display.Loader;
import flash.display.Stage;
import flash.geom.Point;

import flash.events.Event;
import flash.events.IOErrorEvent;
import flash.net.URLRequest;
import flash.system.LoaderContext;
import flash.system.ApplicationDomain;
import flash.errors.Error;
import flash.utils.Timer;
import flash.events.TimerEvent;

import flash.net.SharedObject;
import flash.utils.ByteArray;
import haxe.Md5;

typedef Req = {
	var url : String;
	var onLoad :BitmapData->Void;
	var noCache:Bool;
}

typedef ReqImg = {
	var url : String;
	var onLoad :Dynamic->Void;
	var onError :Void->Void;
}

class Utils
{
	public static var worldWidth:Float = 20037508;
	public static var worldDelta:Float = 1627508;
	static var nextId:Int = 0;
	static var bitmapDataCache:Hash<BitmapData> = new Hash<BitmapData>();
	static var displayObjectCache:Hash<Dynamic> = new Hash<Dynamic>();
	
	static var loaderDataCache:Array<Req> = [];				// Очередь загрузки Bitmap-ов
	static var loaderActive:Bool = false;					// Флаг активности Loader Bitmap-ов
	static var loaderCache:Hash<Bool> = new Hash<Bool>();	// Файлы в процессе загрузки
	
	static var imgWaitCache:Hash<Array<ReqImg>> = new Hash<Array<ReqImg>>();	// Очередь ожидающих загрузки URL
	static var imgCache:Hash<Bool> = new Hash<Bool>();		// Файлы IMG в процессе загрузки
	
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

	public static function clearSprite(spr:Sprite)
	{
		spr.graphics.clear();
		if (spr.numChildren > 0) {
			for (i in 0...Std.int(spr.numChildren)) {
				spr.removeChildAt(0);
			}
		}
	}

	public static function getScale(z:Float)
	{
		var zn:Float = Math.pow(2, -z) * 156543.033928041;
		//zn = Math.round(zn * 1000000000) / 1000000000;
		return zn;
	}

	public static function dateStringToUnixTimeStamp(str:String):String
	{
		var ret:String = '';
		if (str != '' ) {
			var regObject = ~/\./g;
			str = regObject.replace(str, '-');
			regObject = ~/\-/g;
			if(regObject.match(str)) {
				var dt:Date = Date.fromString(str);
				ret = cast(dt.getTime() / 1000);
			}
		}
		return ret;
	}

	public static function getDateProperty(properties:Hash<String>)
	{
		var date = properties.get("date");
		if (date == null)
			date = properties.get("DATE");
		return date;
	}

	// Загрузить DisplayObject если возможно закешировать
	public static function loadCacheDisplayObject(url:String, onLoad:Dynamic->Void, ?onError:Void->Void)
	{
		var req:ReqImg = { url: url, onLoad: onLoad, onError: onError };
		var flag:Bool = imgWaitCache.exists(url);
		var arr:Array<ReqImg> = new Array<ReqImg>();
		if (flag) arr = imgWaitCache.get(url);

		arr.push(req);
		imgWaitCache.set(url, arr);
		if(!flag) runLoadCacheDisplayObject(req);
	}

	// Загрузка DisplayObject
	private static function runLoadCacheDisplayObject(req:ReqImg)
	{
		var url:String = req.url;
		var onLoad = req.onLoad;
		var onError = req.onError;

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

		loader.contentLoaderInfo.addEventListener(Event.COMPLETE, function(event) 
		{ 
			timer.stop();
			var imgData:Dynamic = { };
			imgData.isOverlay = false;
			imgData.loader = loader;
			onLoad(imgData);
			Main.bumpFrameRate();
		});
		loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(event)
		{
			timer.stop();
			callOnError();
			var arr:Array<ReqImg> = imgWaitCache.get(url);
			for (req in arr) {
				req.onError();
			}
			imgWaitCache.remove(url);
			
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

	// Загрузить Image если возможно закешировать BitmapData + определение isOverlay
	public static function loadCacheImage(url:String, onLoad:Dynamic->Void, ?onError:Void->Void)
	{
		var req:ReqImg = { url: url, onLoad: onLoad, onError: onError };
		var flag:Bool = imgWaitCache.exists(url);
		var arr:Array<ReqImg> = new Array<ReqImg>();
		if (flag) arr = imgWaitCache.get(url);

		arr.push(req);
		imgWaitCache.set(url, arr);
		if(!flag) runLoadCacheImage(req);
	}

	// Загрузка IMG
	private static function runLoadCacheImage(req:ReqImg)
	{
		var url:String = req.url;
		var onLoad = req.onLoad;
		var onError = req.onError;

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

		loader.contentLoaderInfo.addEventListener(Event.COMPLETE, function(event) 
		{ 
			timer.stop();
			var imgData:Dynamic = { };
			imgData.isOverlay = false;
			imgData.loader = loader;
			var flag:Bool = event.target.parentAllowsChild;
			if(flag) {
				var size = 32;
				var bmp = new BitmapData(size, size, true, 0);
				bmp.draw(loader);
				var hist = bmp.histogram();
				if (hist[3][255] != 1024) imgData.isOverlay = true;		// по гистограмме определяем тайлы где в верхнем левом углу 32х32 все alpha = 0xFF
				bmp.dispose();
				bmp = new BitmapData(Std.int(loader.width), Std.int(loader.height), true, 0);
				bmp.draw(loader);
				if (imgWaitCache.exists(url))
				{
					var arr:Array<ReqImg> = imgWaitCache.get(url);
					for (req in arr) {
						imgData.loader = new Bitmap(bmp);
						req.onLoad(imgData);
					}
					imgWaitCache.remove(url);
				}			
				imgData.loader = null;

			} else {
				imgData.isOverlay = true;
				onLoad(imgData);
			}
			
			Main.bumpFrameRate();
		});
		loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(event)
		{
			timer.stop();
			callOnError();
			var arr:Array<ReqImg> = imgWaitCache.get(url);
			for (req in arr) {
				req.onError();
			}
			imgWaitCache.remove(url);
			
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

	// Загрузить BitmapData по url или взять из Cache
	public static function loadBitmapData(url:String, onLoad:BitmapData->Void, ?noCache_:Bool)
	{
		var req:Req = { url: url, onLoad: onLoad, noCache: false };
		if(noCache_ == true) req.noCache = true;
		if (bitmapDataCache.exists(url))
		{
			onLoad(Utils.bitmapDataCache.get(url));
		} else if(loaderCache.exists(url))
		{
			loaderCache.set(url, true);
			loaderDataCache.push(req);
		} else
		{
			loaderCache.set(url, true);
			runLoadImage(req);
		}
		chkLoadImage();
	}

	// Проверка очереди загрузки BitmapData
	private static function chkLoadImage()
	{
		if (loaderActive || loaderDataCache.length == 0) return;
		var req:Req = loaderDataCache.shift();
		runLoadImage(req);
	}

	// Загрузка BitmapData
	private static function runLoadImage(req:Req)
	{
		var url:String = req.url;
		var onLoad = req.onLoad;
		var noCache:Bool = req.noCache;

		if (bitmapDataCache.exists(url))
		{
			onLoad(Utils.bitmapDataCache.get(url));
			chkLoadImage();
		} else {
			var addToCache = function(bitmapData:BitmapData)
			{
				Utils.bitmapDataCache.set(url, bitmapData);
				onLoad(Utils.bitmapDataCache.get(url));
			}

			var loader:Loader = new Loader();
			var complete = function(e)
			{ 
					var bitmapData:BitmapData = new BitmapData(Std.int(loader.width), Std.int(loader.height), true, 0);
					bitmapData.draw(loader);
					if (noCache ) onLoad(bitmapData);
					else addToCache(bitmapData);
					loaderActive = false;
					loaderCache.remove(url);
					chkLoadImage();
			}
			loader.contentLoaderInfo.addEventListener(Event.COMPLETE, complete);

			var err = function(e)
			{
				loaderActive = false;
				chkLoadImage();
			}
			loaderActive = true;
			loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, err);
			var loaderContext:LoaderContext = new LoaderContext(true, ApplicationDomain.currentDomain);
			loader.load(new URLRequest(url), loaderContext);
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

	// Получить группы точек по прямоугольной сетке
	public static function getClusters(vectorLayerFilter:VectorLayerFilter, geom:MultiGeometry, tile:VectorTile, currentZ:Int, ?identityField:String):MultiGeometry
	{
		var traceTime = flash.Lib.getTimer();
		
		var attr:Dynamic = vectorLayerFilter.clusterAttr;
		var iterCount:Int = (attr.iterationCount != null ? attr.iterationCount : 1);	// количество итераций K-means
		var radius:Int = (attr.radius != null ? attr.radius : 20);						// радиус кластеризации в пикселах

		var propFields:Array<Array<String>> = (attr.propFields != null ? attr.propFields : [[],[]] );
		var tileExtent:Extent = tile.extent;			// Extent тайла

		var scale:Float = Utils.getScale(currentZ);		// размер пиксела в метрах меркатора
		var radMercator:Float = radius * scale;			// размер радиуса кластеризации в метрах меркатора
		
		if(identityField == null) identityField = (vectorLayerFilter.layer.identityField != '' ? vectorLayerFilter.layer.identityField : 'ogc_fid');
		var grpHash = new Hash<Dynamic>();
		for (i in 0...Std.int(geom.members.length))
		{
			if (!Std.is(geom.members[i], PointGeometry)) continue;
			var member:PointGeometry = cast(geom.members[i], PointGeometry);
			var dx:Int = cast((member.x - tileExtent.minx) / radMercator);		// Координаты квадранта разбивки тайла
			var dy:Int = cast((member.y - tileExtent.miny) / radMercator);
			var key:String = dx + '_' + dy;
			var ph:Dynamic = (grpHash.exists(key) ? grpHash.get(key) : {});
			var arr:Array<Int> = (ph.arr != null ? ph.arr : new Array<Int>());
			arr.push(i);
			ph.arr = arr;
			grpHash.set(key, ph);
		}
		
		var centersGeometry = new MultiGeometry();
		var objIndexes:Array<Array<Int>> =  [];
		
		function setProperties(prop_:Hash<String>, len_:Int):Void
		{
			var regObjectInCluster = ~/\[objectInCluster\]/g;
			for (i in 0...Std.int(propFields[0].length)) {
				var key:String = propFields[0][i];
				var valStr:String = propFields[1][i];
				valStr = regObjectInCluster.replace(valStr, cast(len_));
				prop_.set(key, valStr);
			}
		}
		
		function getCenterGeometry(arr:Array<Int>):PointGeometry
		{
			if (arr.length < 1) return null;
			var xx:Float = 0; var yy:Float = 0;
			var members:Array<PointGeometry> = new Array<PointGeometry>();
			for (j in arr)
			{
				var memberSource:PointGeometry = cast(geom.members[j], PointGeometry);
				xx += memberSource.x;
				yy += memberSource.y;
				members.push(memberSource);
			}
			xx /= arr.length;
			yy /= arr.length;
			var pt:PointGeometry = new PointGeometry(xx, yy);
			pt.propHiden.set('_members', members);
			return pt;
		}
		
		// преобразование grpHash в массив центроидов и MultiGeometry
		for (key in grpHash.keys())
		{
			var ph:Dynamic = grpHash.get(key);
			if (ph == null || ph.arr.length < 1) continue;
			objIndexes.push(ph.arr);
			var pt:PointGeometry = getCenterGeometry(ph.arr);
			var prop:Hash<String> = new Hash<String>();
			if (ph.arr.length == 1) {
				var propOrig = geom.members[ph.arr[0]].properties;
				for (key in propOrig.keys()) prop.set(key, propOrig.get(key));
				pt.propHiden.set('_paintStyle', vectorLayerFilter.regularStyleOrig);
			}
			else
			{
				prop.set(identityField, 'cl_' + getNextId());
				setProperties(prop, ph.arr.length);
			}
			
			pt.properties = prop;
			centersGeometry.addMember(pt);
		}

		// find the nearest group
		function findGroup(point:Point):Int {
			var min:Float = Geometry.MAX_DISTANCE;
			var group:Int = -1;
			for (i in 0...Std.int(centersGeometry.members.length))
			{
				var member = centersGeometry.members[i];
				var pt:PointGeometry = cast(member, PointGeometry);
				var center:Point = new Point(pt.x, pt.y);
				var d:Float = Point.distance(point ,center);
				if(d < min){
					min = d;
					group = i;
				}
			}
			return group;
		}
		
		// Итерация K-means
		function kmeansGroups():Void
		{
			var newObjIndexes:Array<Array<Int>> =  [];
			for (i in 0...Std.int(geom.members.length))
			{
				if (!Std.is(geom.members[i], PointGeometry)) continue;
				var member:PointGeometry = cast(geom.members[i], PointGeometry);

				var group:Int = findGroup(new Point(member.x, member.y));
				
				if (newObjIndexes[group] == null) newObjIndexes[group] = [];
				newObjIndexes[group].push(i);
			}
			centersGeometry = new MultiGeometry();
			objIndexes =  [];
			for (arr in newObjIndexes)
			{
				if (arr == null) continue;
				var pt:PointGeometry = getCenterGeometry(arr);
				var prop:Hash<String> = new Hash<String>();
				if (arr.length == 1) {
					var propOrig = geom.members[arr[0]].properties;
					for(key in propOrig.keys()) prop.set(key, propOrig.get(key));
					pt.propHiden.set('_paintStyle', vectorLayerFilter.regularStyleOrig);
				}
				else
				{
					prop.set(identityField, 'cl_' + getNextId());
					setProperties(prop, arr.length);
				}
				pt.properties = prop;
				
				centersGeometry.addMember(pt);
				objIndexes.push(arr);
			}
		}
		
		for (i in 0...Std.int(iterCount))	// Итерации K-means
		{
			kmeansGroups();
		}
		
		if(attr.debug != null) {
			var out = '';
			out += ' iterCount: ' + iterCount;
			out += ' objCount: ' + geom.members.length;
			out += ' clustersCount: ' + centersGeometry.members.length;
			out += ' time: ' + (flash.Lib.getTimer() - traceTime) + ' мсек.';
			trace(out);
		}
		return centersGeometry;
		
	}
	
	// Записать ByteArray в SharedObject
	public static function writeSharedObject(url:String, data:Dynamic):String {
		if (!Main.multiSessionLSO) url += Main.flashStartTimeStamp;
		var lsoName:String = Md5.encode(url);
		var mySo:SharedObject = SharedObject.getLocal(lsoName);
		if(Main.compressLSO) {
			var barr:ByteArray = new ByteArray();
			barr.writeObject(data);
			//trace('ddddddddddddddddddddddddddddddddddddddd ' + barr.length);
			barr.compress();
			//trace('ddddddddddddddddddddddddddddddddddddddd 11 : ' + barr.length);
			var out:String = Base64.encode64(barr, false);
			Reflect.setField(mySo.data, 'mobj', out);
		} else {
			Reflect.setField(mySo.data, 'mobj', data);
		}
		
		var ret:String = 'ok';
		//var ret:String = cast(mySo.flush());
		mySo.close();
		return ret;
	}
	
	// Прочесть ByteArray из SharedObject
	public static function readSharedObject(url:String) {
		var out = null;
		if (!Main.multiSessionLSO) url += Main.flashStartTimeStamp;
		var lsoName:String = Md5.encode(url);
		var mySo:SharedObject = SharedObject.getLocal(lsoName);
		if(mySo.size > 0 && Reflect.hasField(mySo.data, 'mobj')) {
			if(Main.compressLSO) {
				var inp:String = Reflect.field(mySo.data, 'mobj');
				if(inp.length > 0) {
					var barr:ByteArray = new ByteArray();
					try {
						barr = Base64.decode64(inp);
						barr.uncompress();
						barr.position = 0;
						out = barr.readObject();
					} catch (error:Error) {
						//trace('errror ' + barr.length);
					}
				}
			} else {
				out = Reflect.field(mySo.data, 'mobj');
				if (Std.is(out, String)) out = null;
			}
		}
		mySo.close();
		return out;
	}

	// по xmin, xmax получить смещение обьекта до положения ближайшего к центру экрана
	public static function getShiftX(xmin:Float, xmax:Float, node:MapNode):Float
	{
		var x:Float = (xmin + xmax)/2;
		var inv = node.window.matrix;
		var p1:Point = inv.transformPoint(new Point(x, 0));
		var center:Point = inv.transformPoint(new Point(node.window.currentX, 0));

		var out:Float = 0.0;
		var ww = 2 * Utils.worldWidth;
		var minx:Float = Math.abs(p1.x - center.x);
		for (i in 1...4) {
			p1 = inv.transformPoint(new Point(x + ww * i, 0));
			var m1:Float = Math.abs(p1.x - center.x);
			if (m1 < minx) { minx = m1; out = ww * i; }
			p1 = inv.transformPoint(new Point(x - ww * i, 0));
			m1 = Math.abs(p1.x - center.x);
			if (m1 < minx) { minx = m1; out = -ww * i; }
			
		}
		return out;
	}
	
	// найти Geometry из MultiGeometry пересекающую Extent
	public static function findIntersect(ext:Extent, geom:Geometry):Geometry
	{
		var out:Geometry = null;
		var isMultiGeometry:Bool = Std.is(geom, MultiGeometry);
		if (isMultiGeometry) {
			for (member in cast(geom, MultiGeometry).members) {
				out = findIntersect(ext, member);
				if(out != null) break;
			}
		}
		else if (geom.extent.overlaps(ext)) out = geom;	// пропускаем обьекты не пересекающие Extent
		return out;
	}
	
}