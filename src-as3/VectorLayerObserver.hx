import flash.errors.Error;

class VectorLayerObserver extends MapContent
{
	var layer:VectorLayer;
	var onChange:String->Bool->Void;
	var ids:Hash<Bool>;

	public function new(layer_:VectorLayer, onChange_:String->Bool->Void)
	{
		layer = layer_;
		layer.vectorLayerObserver = this;
		
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
		onChange(node.id, flag);
	}

	public override function repaint()
	{
		//if(Main.isDraggingNow) return;
		var criterion:Hash<String>->Bool = layer.mapNode.propHiden.get('_FilterVisibility');
//		try {
			var filters = new Array<VectorLayerFilter>();
			for (child in layer.mapNode.children) {
				if (Std.is(child.content, VectorLayerFilter) && !child.hidden)
					filters.push(cast(child.content, VectorLayerFilter));
			}
			var toAdd = new Hash<Bool>();
			var toRemove = new Hash<Bool>();
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
									var geom:Geometry = layer.geometries.get(id);
									if (geom != null && geom.extent.overlaps(extent))
									{
										isIn = true;
										break;
									}
								}
							}
						}
						if (isIn && !ids.exists(id))
						{
							toAdd.set(id, true);
							ids.set(id, true);
						}
						else if (!isIn && ids.exists(id))
						{
							toRemove.set(id, true);
							ids.remove(id);
						}
					}
				}
			}
			for (id in toAdd.keys())
				onChange(id, true);
			for (id in toRemove.keys())
				onChange(id, false);

//		} catch (e:Error) { /*trace(e);*/ }
	}
}