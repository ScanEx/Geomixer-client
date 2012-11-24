
class VectorTile
{
	var loadCallbacks:Array<Void->Void>;
	var startedLoading:Bool;
	var layer:VectorLayer;

	public var finishedLoading:Bool;
	public var i:Int;
	public var j:Int;
	public var z:Int;
	public var extent:Extent;

	public var ids:Array<String>;
	public var geometries:Array<Geometry>;

	public function new(layer_:VectorLayer, i_:Int, j_:Int, z_:Int)
	{
		layer = layer_;
		loadCallbacks = new Array<Void->Void>();
		startedLoading = false;
		finishedLoading = false;

		i = i_;
		j = j_;
		z = z_;
		extent = new Extent();
		var tileSize = Utils.getScale(z - 8);
		extent.update(i*tileSize, j*tileSize);
		extent.update((i + 1)*tileSize, (j + 1)*tileSize);
	}

	public function removeItems(ph:Dynamic<Bool>)
	{
		if (layer == null) return;
		var tmp:Array<String> = new Array<String>();
		var geoms:Array<Geometry> = new Array<Geometry>();
		for (i in 0...Std.int(geometries.length)) {
			var geo:Geometry = geometries[i];
			var key:String = geo.properties.get(layer.identityField);
			if (!Reflect.field(ph, key)) {
				tmp.push(key);
				geoms.push(geometries[i]);
			}
		}
		ids = tmp;
		geometries = geoms;
		if(layer.vectorLayerObserver != null) {
			layer.vectorLayerObserver.setNeedRefresh();
		}
	}

	public function load(onLoad:Void->Void)
	{
		if (finishedLoading)
		{
			onLoad();
			return;
		}
		else 
		{
			loadCallbacks.push(onLoad);

			if (!startedLoading)
			{
				startedLoading = true;

				var me = this;
				var field = me.layer.identityField;
				var st:String = z + '_' + i + '_' + j;

				// При ответе 404 - возможно версия тайла изменилась
				function onError(url:String)
				{
					var out:Dynamic = {};
					out.eventType = 'chkLayerVersion';
					out.layerID = me.layer.mapNode.id;
					out.z = me.z;
					out.i = me.i;
					out.j = me.j;
					out.url = url;
					flash.Lib.current.stage.dispatchEvent( new APIEvent('chkLayerVersion', out) );
				}

				// При ответе 200 - парсинг содержимого тайла
				function parseTile(arr:Array<Dynamic>, tileID)
				{
					if (arr == null) return;
					me.ids = new Array<String>();
					me.geometries = new Array<Geometry>();
					
					for (object in arr)
					{
						if(object == null) {	// Пропускаем бракованные обьекты
							continue;
						}
						var obj = me.layer.parseObject(object, me.extent);
						if(obj == null) {		// Пропускаем отбракованные слоем обьекты
							continue;
						}
						var id:String = cast(obj.id);
						var geometry = obj.geometry;
						
						me.geometries.push(geometry);
						me.ids.push(id);
					}

					me.finishedLoading = true;
					for (func in me.loadCallbacks)
						func();

					if (me.layer.mapNode.handlers.exists('onTileLoaded')) {
						var tOut:Dynamic = { };
						tOut.data = arr;
						tOut.tileID = tileID;
//var bTime = flash.Lib.getTimer();
						me.layer.mapNode.callHandler('onTileLoaded', null, tOut);
//bTime = flash.Lib.getTimer() - bTime;
//var st:String = 'Тайл ' + tileID + ' обьектов: ' + arr.length + ' время: ' + bTime / 1000 + ' сек.';
//trace('ddddddddd ' + st);
					}
					Main.bumpFrameRate();

					arr = null;
				}

				var urlTiles:Dynamic = layer.tileFunction(i, j, z);
				var arr:Array<String> = new Array<String>();
				if (Std.is(urlTiles, Array))	// нужна склейка тайлов
				{
					arr = urlTiles;
					if(urlTiles.length > 0) new GetSWFTile(arr, function(data_:Array<Dynamic>) { parseTile(data_, st); }, onError);
				} else if (Std.is(urlTiles, String)) {
					var ver:Int = (layer.hashTilesVers.exists(st) ? layer.hashTilesVers.get(st) : 0);
					var url:String = urlTiles + '&v=' + ver;
					if (url != "") new GetSWFFile(url, function(data_:Array<Dynamic>) { parseTile(data_, st); }, onError);
					arr.push(url);
				}
				if (me.layer.mapNode.handlers.exists('onTileLoadedURL')) {
					var tOut:Dynamic = { };
					tOut.data = arr;
					tOut.tileID = st;
					me.layer.mapNode.callHandler('onTileLoadedURL', null, tOut);
				}
			}
		}
	}
}