import flash.errors.Error;

class VectorLayerObserver extends MapContent
{
	var layer:VectorLayer;
	//var onChange:String->Bool->Void;
	var onChange:Array<Dynamic>->Void;
	var ids:Hash<Bool>;
	var notCheckVisibilityFilter:Bool;

	//public function new(layer_:VectorLayer, onChange_:String->Bool->Void, asArray_:Bool, notCheckVisibilityFilter_:Bool)
	public function new(layer_:VectorLayer, onChange_:Array<Dynamic>->Void, notCheckVisibilityFilter_:Bool)
	{
		layer = layer_;
		layer.vectorLayerObserver = this;
		notCheckVisibilityFilter = notCheckVisibilityFilter_;
		
		onChange = onChange_;
		ids = new Hash<Bool>();
	}

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public override function flush()
	{
		ids = new Hash<Bool>();
	}

	public function callFromVectorItem(node:MapNode, flag:Bool)
	{
		
		var out:Array<Dynamic> = new Array<Dynamic>();
		
		var it:Dynamic = { };
		it.id = node.id;
		it.isView = flag;
		out.push(it);
		//if(flag) out.add.set(node.id, true); 
		//else out.del.set(node.id, false); 
		onChange(out);
	}

	public override function repaint()
	{
		if(Main.mousePressed) return;
		var criterion:Hash<String>->Bool = (!notCheckVisibilityFilter ? layer.mapNode.propHiden.get('_FilterVisibility') : null);
//		try {
			var filters = new Array<VectorLayerFilter>();
			for (child in layer.mapNode.children) {
				if (Std.is(child.content, VectorLayerFilter) && !child.hidden)
					filters.push(cast(child.content, VectorLayerFilter));
			}
			var out:Array<Dynamic> = new Array<Dynamic>();
			//var notEmpty:Bool = false;
			//var toAdd = new Hash<Bool>();
			//var toRemove = new Hash<Bool>();
			var extent = mapNode.window.visibleExtent;
			for (tile in layer.tiles)
			{
				if ((tile.ids != null) && tile.extent.overlaps(extent))
				{
					for (id in tile.ids)
					{
						var geom:Geometry = layer.geometries.get(id);
						var isIn = false;
						if (criterion == null || criterion(geom.properties)) {		// Проверка на setVisibilityFilter
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
						if (isIn && !ids.exists(id))
						{
							//toAdd.set(id, true);
							ids.set(id, true);
							var it:Dynamic = { };
							it.id = id;
							it.isView = true;
							out.push(it);
						}
						else if (!isIn && ids.exists(id))
						{
							//toRemove.set(id, true);
							ids.remove(id);
							var it:Dynamic = { };
							it.id = id;
							it.isView = false;
							out.push(it);
						}
					}
				}
			}
			if(out.length > 0) onChange(out);
			/*
			for (id in toAdd.keys())
				onChange(id, true);
			for (id in toRemove.keys())
				onChange(id, false);
				*/

//		} catch (e:Error) { /*trace(e);*/ }
	}
}