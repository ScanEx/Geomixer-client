
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

				function parseTile(arr:Array<Dynamic>)
				{
					if (arr == null) return;
					me.ids = new Array<String>();
					me.geometries = new Array<Geometry>();
					
					var actualExtent = new Extent();
					actualExtent.update((me.extent.minx + me.extent.maxx)/2, (me.extent.miny + me.extent.maxy)/2);
					for (object in arr)
					{
						var geometry = Utils.parseGeometry(object.geometry, me.extent);
						actualExtent.update(geometry.extent.minx, geometry.extent.miny);
						actualExtent.update(geometry.extent.maxx, geometry.extent.maxy);
						var properties = new Hash<String>();
						var props_:Array<String> = object.properties;
						for (i in 0...Std.int(props_.length/2))
							properties.set(props_[i*2], props_[i*2 + 1]);
						var id = properties.exists(field) ? properties.get(field) : Utils.getNextId();
						geometry.properties = properties;
						me.geometries.push(geometry);
						me.ids.push(id);

						if (!me.layer.geometries.exists(id))
							me.layer.geometries.set(id, geometry);
						else
						{
							var newGeometry = new MultiGeometry();
							newGeometry.properties = properties;
							newGeometry.addMember(me.layer.geometries.get(id));
							newGeometry.addMember(geometry);
							me.layer.geometries.set(id, newGeometry);
						}
					}

					var d = (me.extent.maxx - me.extent.minx)/50;
					if (Math.abs(actualExtent.minx - me.extent.minx) < d)
						me.extent.minx = actualExtent.minx;
					if (Math.abs(actualExtent.miny - me.extent.miny) < d)
						me.extent.miny = actualExtent.miny;
					if (Math.abs(actualExtent.maxx - me.extent.maxx) < d)
						me.extent.maxx = actualExtent.maxx;
					if (Math.abs(actualExtent.maxy - me.extent.maxy) < d)
						me.extent.maxy = actualExtent.maxy;

					me.finishedLoading = true;
					for (func in me.loadCallbacks)
						func();

					Main.bumpFrameRate();
					arr = null;
				}

				var urlTiles:Dynamic = layer.tileFunction(i, j, z);

				if (Std.is(urlTiles, Array))	// нужна склейка тайлов
				{
					var arr:Array<String> = urlTiles;
					if(urlTiles.length > 0) new GetSWFTile(arr, function(data_:Array<Dynamic>) { parseTile(data_); });
				} else if (Std.is(urlTiles, String)) {
					var url:String = urlTiles;
					if (url != "") new GetSWFFile(url, function(data_:Array<Dynamic>) { parseTile(data_);	});
				}
			}
		}
	}
}