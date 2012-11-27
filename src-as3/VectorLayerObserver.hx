import flash.errors.Error;

class VectorLayerObserver extends MapContent
{
	var layer:VectorLayer;
	var onChange:Array<Dynamic>->Void;
	var ids:Hash<Dynamic>;
	var ignoreVisibilityFilter:Bool;
	public var chkObserver:Bool;

	public function new(layer_:VectorLayer, onChange_:Array<Dynamic>->Void, ignoreVisibilityFilter_:Bool)
	{
		layer = layer_;
		layer.vectorLayerObserver = this;
		ignoreVisibilityFilter = ignoreVisibilityFilter_;
		chkObserver = true;
		onChange = onChange_;
		ids = new Hash<Dynamic>();
		flash.Lib.current.stage.addEventListener( APIEvent.CUSTOM_EVENT, setNeedRefresh );
	}

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public override function flush()
	{
		ids = new Hash<Dynamic>();
		chkObserver = true;
	}

	public function callFromVectorItem(node:MapNode, flag:Bool)
	{
		
		var out:Array<Dynamic> = new Array<Dynamic>();
		
		var it:Dynamic = { };
		it.id = node.id;
		it.onExtent = flag;
		out.push(it);
		onChange(out);
	}

	// Проверка движения карты
	public function setNeedRefresh(?attr:Dynamic)
	{
		chkObserver = true;
		mapNode.noteSomethingHasChanged();
		mapNode.parent.noteSomethingHasChanged();
	}

	public override function repaint()
	{
		if (Main.mousePressed || !chkObserver) return;
		var z = mapNode.window.getCurrentZ();
		var isObserveByLayerZooms:Bool = layer.mapNode.propHiden.get('observeByLayerZooms');
		var minZ:Int = mapNode.minZ;
		var maxZ:Int = mapNode.maxZ;
		if (isObserveByLayerZooms) {
			minZ = layer.mapNode.minZ;
			maxZ = layer.mapNode.maxZ;
		}
		
		var isVisible = (z >= minZ && z <= maxZ);
		var outItems:Hash<Dynamic> = new Hash<Dynamic>();	// Удаляемые обьекты тайлов
		if (!isVisible) {
			for (id in ids.keys()) {
				var pt = ids.get(id);
				var it:Dynamic = { };
				//it.tileKey = tileKey;
				it.id = id;
				it.status = 'badZoom';
				it.onExtent = false;
				outItems.set(id, it);
				ids.remove(id);
			}
			
		} else {
		
			var criterion:Hash<String>->Bool = layer.mapNode.propHiden.get('_FilterVisibility');
			var filters = new Array<VectorLayerFilter>();
			for (child in layer.mapNode.children) {
				if (Std.is(child.content, VectorLayerFilter) && !child.hidden)
					filters.push(cast(child.content, VectorLayerFilter));
			}
			//var chunk:Int = 100;					// Ограничение вывода 1000 обьектов
			var extent = mapNode.window.visibleExtent;
			for (tile in layer.tiles)
			{
				//if (chunk < 0) break;
				if (tile.ids != null)
				{
					var tileKey:String = tile.z + '_' + tile.i + '_' + tile.j;
					if (tile.extent.overlaps(extent))
					{
						for (id in tile.ids)
						{
							//if (chunk < 0) break;
							var subObjKey:String = id + ':' + tileKey;
							var geom:Geometry = layer.geometries.get(id);
							var isIn = false;
							var isVisibleFilter:Bool = (criterion == null || criterion(geom.properties) ? false : true);
							if (isVisible) {		// Проверка на zoom
								for (filter in filters)
								{
									if (filter.ids.exists(id)) {
										if (layer.temporalCriterion == null || layer.temporalCriterion(geom.propTemporal)) {
											if (geom != null && geom.extent.overlaps(extent))
											{
												isIn = true;
												break;
											}
										}
									}
								}
							}
							if (isIn)
							{
								var it:Dynamic = { };
								if (ids.exists(id)) {
									var oldIt:Dynamic = ids.get(id);
									var tileKeys:Hash<Bool> = oldIt.tileKeys;
									if (tileKeys.exists(tileKey) && oldIt.isVisibleFilter == isVisibleFilter) continue;
									oldIt.isVisibleFilter = isVisibleFilter;
									oldIt.tileKeys.set(tileKey, true);
									it.status = 'update';
									it.tileKeys = tileKeys;
									it.id = id;
									it.onExtent = true;
									it.isVisibleFilter = isVisibleFilter;
									outItems.set(id, it);
									//chunk--;
								} else {
									var tileKeys:Hash<Bool> = new Hash<Bool>();
									tileKeys.set(tileKey, true);
									it.tileKeys = tileKeys;
									it.status = 'add';
									it.id = id;
									it.onExtent = true;
									it.isVisibleFilter = isVisibleFilter;
									ids.set(id, it);
									outItems.set(id, it);
									//chunk--;
								}
							}
							else if (!isIn && ids.exists(id))
							{
								var tileKeys:Hash<Bool> = ids.get(id).tileKeys;
								if (tileKeys.exists(tileKey)) tileKeys.remove(tileKey);
								if (tileKeys.keys().hasNext()) continue;
								ids.remove(id);
								var it:Dynamic = { };
								it.id = id;
								it.status = 'objectNotOnExtent';
								it.onExtent = false;
								outItems.set(id, it);
								//chunk--;
							}
						}
					} else {
						for (id in tile.ids)
						{
							//if (chunk < 0) break;
							var subObjKey:String = id + ':' + tileKey;
							if (ids.exists(id))
							{
								var tileKeys:Hash<Bool> = ids.get(id).tileKeys;
								if (tileKeys.exists(tileKey)) tileKeys.remove(tileKey);
								if (tileKeys.keys().hasNext()) continue;
								ids.remove(id);
								var it:Dynamic = { };
								//it.tileKey = tileKey;
								it.id = id;
								it.onExtent = false;
								it.status = 'tileNotOnExtent';
								outItems.set(id, it);
								//chunk--;
							}
						}
					}
				}
			}
		}
		var out:Array<Dynamic> = new Array<Dynamic>();		// Добавляемые обьекты тайлов
		for (key in outItems.keys()) {
			out.push(outItems.get(key));
		}
		//if (chunk == 100) 
		chkObserver = false;
		if(out.length > 0) onChange(out);
	}
}