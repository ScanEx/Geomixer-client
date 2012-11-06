import flash.errors.Error;

class VectorLayerObserver extends MapContent
{
	var layer:VectorLayer;
	var onChange:Array<Dynamic>->Void;
	var ids:Hash<Bool>;
	var ignoreVisibilityFilter:Bool;

	public function new(layer_:VectorLayer, onChange_:Array<Dynamic>->Void, ignoreVisibilityFilter_:Bool)
	{
		layer = layer_;
		layer.vectorLayerObserver = this;
		ignoreVisibilityFilter = ignoreVisibilityFilter_;
		
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
		it.onExtent = flag;
		out.push(it);
		onChange(out);
	}

	public override function repaint()
	{
		if(Main.mousePressed) return;
		var criterion:Hash<String>->Bool = (!ignoreVisibilityFilter ? layer.mapNode.propHiden.get('_FilterVisibility') : null);
//		try {
			var filters = new Array<VectorLayerFilter>();
			for (child in layer.mapNode.children) {
				if (Std.is(child.content, VectorLayerFilter) && !child.hidden)
					filters.push(cast(child.content, VectorLayerFilter));
			}
			var out:Array<Dynamic> = new Array<Dynamic>();
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
							ids.set(id, true);
							var it:Dynamic = { };
							it.id = id;
							it.onExtent = true;
							out.push(it);
						}
						else if (!isIn && ids.exists(id))
						{
							ids.remove(id);
							var it:Dynamic = { };
							it.id = id;
							it.onExtent = false;
							out.push(it);
						}
					}
				}
			}
			if(out.length > 0) onChange(out);

//		} catch (e:Error) { /*trace(e);*/ }
	}
}