import flash.events.Event;
import flash.events.MouseEvent;

class VectorLayer extends MapContent
{	
	public var temporalCriterion:Hash<String>->Bool;	// условие для мультивременных данных
	public var tileFunction:Int->Int->Int->Dynamic;
	public var identityField:String;
	public var tiles:Array<VectorTile>;
	public var geometries:Hash<Geometry>;

	public var hoverPainter:GeometryPainter;
	public var lastId:String;
	public var lastGeometry:Geometry;
	public var currentId:String;
	public var currentFilter:VectorLayerFilter;
	public var vectorLayerObserver:VectorLayerObserver;
	//var hoverTileExtent:Extent;
	//var hoverTiles:Array<VectorTile>;

	var flipCounts:Hash<Int>;
	var lastFlipCount:Int;
	var flipDown:Bool;
	
	public var hashTiles:Hash<Bool>;
	public var attrHash:Dynamic;					// дополнительные свойства слоя
	public var hashTilesVers:Hash<Int>;				// версии тайлов
	
	public var deletedObjects:Hash<Bool>;			// Списки обьектов удаляемых из тайлов
	var editedObjects:Array<String>;				// Списки обьектов слоя в режиме редактирования

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public function new(identityField_:String, attr_:Dynamic, tileFunction_:Int->Int->Int->Dynamic)
	{
		identityField = identityField_;
		attrHash = (attr_ != null ? attr_ : null);
		tileFunction = tileFunction_;
		temporalCriterion = null;
		vectorLayerObserver = null;
		editedObjects = new Array<String>();
		flush();
		
		if(attrHash != null) {
			var sql:String = 'unixTimeStamp >= ' + attrHash.ut1 + ' AND unixTimeStamp <= ' + attrHash.ut2;
			temporalCriterion = (attrHash.ut1 > attrHash.ut2) ? 
				function(props:Hash<String>):Bool { return true; } :
				Parsers.parseSQL(sql)
			;
		}
	}

	public override function flush()
	{
		tiles = new Array<VectorTile>();
		hashTiles = new Hash<Bool>();
		hashTilesVers = new Hash<Int>();
		deletedObjects = new Hash<Bool>();

		geometries = new Hash<Geometry>();
		flipCounts = new Hash<Int>();
		lastFlipCount = 0;
		if (mapNode != null)
			for (child in mapNode.children)
				if (Std.is(child.content, VectorLayerFilter))
					cast(child.content, VectorLayerFilter).flush();
		if(vectorLayerObserver != null) vectorLayerObserver.flush();
	}

	public function addTile(i:Int, j:Int, z:Int, ?v:Int)
	{
		tiles.push(new VectorTile(this, i, j, z));
		var st:String = z + '_' + i + '_' + j;
		hashTiles.set(st, true);
		hashTilesVers.set(st, (v > 0 ? v : 0));
	}

	// Выборочная чистка списков тайлов
	function flushTiles(attr:Dynamic)
	{
		if (mapNode != null)
			for (child in mapNode.children)
				if (Std.is(child.content, VectorLayerFilter))
					cast(child.content, VectorLayerFilter).removeTiles(attr);

		var newTiles = new Array<VectorTile>();
		for (tile in tiles)			// Переформируем список тайлов
		{
			var st:String = tile.z+'_'+tile.i+'_'+tile.j;
			var flag:Bool = Reflect.field(attr.del, st);
			if (!flag) newTiles.push(tile);
			else {
				hashTiles.remove(st);
				hashTilesVers.remove(st);
			}
		}
		tiles = newTiles;
	}

	// Если имеются обьекты находящиеся в режиме редактирования - очистим их
	function removeEditedObjects()
	{
		if (editedObjects != null && editedObjects.length > 0) {
			for (dId in editedObjects) {
				var node = MapNode.allNodes.get(dId);
				if(node != null) node.remove();
			}
		}
	}

	// Пометить обьекты из тайлов слоя находящиеся в режиме редактирования
	public function setEditedObjects(ph:Dynamic, arr:Dynamic)
	{
		if (mapNode == null) return;
		removeEditedObjects();
		for (child in mapNode.children) {
			if (Std.is(child.content, VectorLayerFilter))
				cast(child.content, VectorLayerFilter).removeItems(ph);
		}

		deletedObjects = new Hash<Bool>();
		for (key in Reflect.fields(ph)) {
			var id:String = cast(key, String);
			deletedObjects.set(id, true);
			//var val:String = Reflect.field(arr, key);
			geometries.remove(id);
		}
		editedObjects = arr;
		mapNode.noteSomethingHasChanged();
		mapNode.repaintRecursively(true);
	}

	function addObjectGeometry(geom:Geometry)
	{
		var id:String = geom.properties.get(identityField);
		if (!geometries.exists(id)) {
			geometries.set(id, geom);
		}
		else
		{
			var newGeometry = new MultiGeometry();
			var geomPrev = geometries.get(id);
			newGeometry.properties = geomPrev.properties;
			newGeometry.propTemporal = geomPrev.propTemporal;
			newGeometry.addMember(geomPrev);
			newGeometry.addMember(geom);
			geometries.set(id, newGeometry);
		}
	}

	public function parseObject(obj:Dynamic, ?tileExtent:Extent):Dynamic
	{
		var properties = new Hash<String>();
		var props_:Array<String> = obj.properties;
		for (i in 0...Std.int(props_.length/2))
			properties.set(props_[i*2], props_[i*2 + 1]);
		
		var id:String = properties.exists(identityField) ? properties.get(identityField) : Utils.getNextId();
		if(deletedObjects.exists(id)) return null;

		var geom = Utils.parseGeometry(obj.geometry, tileExtent);

		if (attrHash != null) {
			if (attrHash.TemporalColumnName != null) {
				var pt = properties.get(attrHash.TemporalColumnName);
				if(pt != null) {
					var unixTimeStamp:String = Utils.dateStringToUnixTimeStamp(pt);
					geom.propTemporal.set('unixTimeStamp', unixTimeStamp);			// посчитали unixTimeStamp для фильтра
					if (Std.is(geom, MultiGeometry)) {								// Для MultiGeometry надо расставить unixTimeStamp
						var multi = cast(geom, MultiGeometry);
						for (member in multi.members) {
							member.propTemporal.set('unixTimeStamp', unixTimeStamp);
						}
					}
				}
			}
		}
		geom.properties = properties;
		addObjectGeometry(geom);
		
		var out:Dynamic = { };
		out.id = id;
		out.geometry = geom;
		return out;
	}

	// Управление списком тайлов
	public function startLoadTiles(attr:Dynamic, mapWindow:MapWindow)
	{
		if(attr != null) {
			if (attr.notClear != true) {
				flush();	// Полная перезагрузка тайлов
			}
			if (attr.add != null || attr.del != null) {			// Для обычных слоев
				if (attr.del != null) flushTiles(attr);
				
				if (attr.add != null) {							// Добавление тайлов
					var ptiles:Array<Array<Int>> = attr.add;
					for (ii in 0...Std.int(ptiles.length)) {
						var pt:Array<Int> = ptiles[ii];
						var i:Int = pt[0];
						var j:Int = pt[1];
						var z:Int = pt[2];
						var v:Int = pt[3];
						if (!hashTiles.exists(z + '_' + i + '_' + j)) addTile(i, j, z, v);
					}
				}
			}
			if(attr.dtiles != null) {		// Для мультивременных слоев
				var sql:String = 'unixTimeStamp >= ' + attr.ut1 + ' AND unixTimeStamp <= ' + attr.ut2;
				temporalCriterion = (attr.ut1 > attr.ut2) ? 
					function(props:Hash<String>):Bool { return true; } :
					Parsers.parseSQL(sql)
				;
				
				var ptiles:Array<Int> = attr.dtiles;
				for (ii in 0...Std.int(ptiles.length / 3)) {
					var i:Int = ptiles[ii * 3];
					var j:Int = ptiles[ii * 3 + 1];
					var z:Int = ptiles[ii * 3 + 2];
					var st:String = z + '_' + i + '_' + j;
					if (!hashTiles.exists(st)) addTile(i, j, z);
				}
			}
			if (attr.add != null && mapNode != null) {							// Было добавление тайлов - необходимо обновить фильтры
				for (child in mapNode.children) {
					if (Std.is(child.content, VectorLayerFilter)) {
						cast(child.content, VectorLayerFilter).createLoader();
						Main.needRefreshMap = true;		// Для обновления карты
					}
				}
			}
		}
	}

	public function createLoader(func:VectorTile->Int->Void)
	{
		var loaded = new Array<Bool>();
		for (tile in tiles) {
			loaded.push(tile.finishedLoading);
		}
		var nRemaining = 0;
		var me = this;
		var w = 2 * Utils.worldWidth;
		return function(e1:Extent)
		{
			var tilesToLoad = new Array<VectorTile>();
			for (i in 0...me.tiles.length)
			{
				if (loaded[i])
					continue;

				var tile = me.tiles[i];
				var e2 = tile.extent;
				//trace('xxxxxxxxx ' + e2.minx + ' : ' + e2.maxx + ' : ' + tile.z + ' : ' + tile.i + ' : ' + tile.j + ' : ');
				if ((e1.miny < e2.maxy) && (e2.miny < e1.maxy) && (
					((e1.minx < e2.maxx) && (e2.minx < e1.maxx)) || 
					((e1.minx < e2.maxx + w) && (e2.minx + w < e1.maxx)) || 
					((e1.minx < e2.maxx - w) && (e2.minx - w < e1.maxx))
				))
				{
					loaded[i] = true;
					nRemaining += 1;
					tilesToLoad.push(tile);
				}
			}
			for (tile in tilesToLoad)
			{
				tile.load(function()
				{
					nRemaining -= 1;
					func(tile, nRemaining);
				});
			}
			//if(nRemaining == 0) func(null, nRemaining);
		}
	}

	public function getStat()
	{
		var out:Dynamic = { };
		out.tilesCnt = tiles.length;
		out.pointsCnt = 0;
		for (tile in tiles)
		{
			if (tile.ids != null) out.pointsCnt += tile.ids.length;
		}
		return out;
	}

	// Получить атрибуты векторного обьекта из загруженных тайлов id по identityField
	public function getTileItem(id:String):Geometry
	{
		var geom:Geometry = null;
		if (geometries.exists(id)) {
			geom = geometries.get(id);
		}
		return geom;
	}

	// Получить список обьектов пересекающих заданный extent
	public function getItemsFromExtent(ext:Extent):Array<Dynamic>
	{
		var arr:Array<Dynamic> = new Array<Dynamic>();
		for (key in geometries.keys())
		{
			var geom:Geometry = geometries.get(key);
			if (geom.extent.overlaps(ext)) {
				arr.push(geom.properties);
			}
		}
		return arr;
	}

	// Изменить атрибуты векторного обьекта из загруженных тайлов
	public function setTileItem(attr:Dynamic, ?flag:Bool):Dynamic
	{
		var out:Dynamic = false;
		var prop:Dynamic = attr.properties;
		var id:String = Reflect.field(prop, identityField);
		if (geometries.exists(id)) {
			var geom:Geometry = geometries.get(id);
			if(flag) geom.properties = new Hash<String>();
			for (key in Reflect.fields(prop)) {
				geom.properties.set(key, Reflect.field(prop, key));
			}
			out = true;
		}
		return out;
	}

	public function repaintIndicator(ev:MouseEvent)
	{
		var currentZ:Int = Std.int(mapNode.window.getCurrentZ());
		var distance:Float = Geometry.MAX_DISTANCE;
		var x = contentSprite.mouseX;
		var y = contentSprite.mouseY;
		var w = Utils.worldWidth;
		x %= 2 * w;
		if(x > w) x -= 2*w;
		if(x < -w) x += 2*w;

		var newCurrentId:String = null;
		var newCurrentFilter:VectorLayerFilter = null;
		var zeroDistanceIds = new Array<Geometry>();
		var zeroDistanceFilters = new Array<VectorLayerFilter>();
		//hoverTiles = new Array<VectorTile>();

		var pointSize = 15*Math.abs(mapNode.window.scaleY);
		var pointExtent = new Extent();
		pointExtent.update(x - pointSize, y - pointSize);
		pointExtent.update(x + pointSize, y + pointSize);

		var hoverGeom = null;
		var hoverStyle = null;
		
		var criterion:Hash<String>->Bool = (mapNode.propHiden.exists('_FilterVisibility') ? mapNode.propHiden.get('_FilterVisibility') : null);

		for (tile in tiles)			// Просмотр содержимого тайлов под мышкой
		{
			if (!tile.finishedLoading) continue;									// пропускаем тайлы - не загруженные
			if (tile.ids == null || !tile.extent.overlaps(pointExtent)) continue;	// пропускаем тайлы - без обьектов и не пересекающих точку
			
			var tileKey:String = tile.z + '_' + tile.i + '_' + tile.j;
			
			for (node in mapNode.children)
			{
				if (!node.vectorSprite.visible || !Std.is(node.content, VectorLayerFilter)) continue; // пропускаем - не видимые спрайты и не фильтры
				if (node.getHandler('onMouseOver') == null && node.getHandler('onClick') == null) continue;	// нет Handler-ов на ноде
				var filter = cast(node.content, VectorLayerFilter);
				if (!filter.paintersHash.exists(tileKey)) continue;	// пропускаем фильтры тайлов - без VectorTilePainter
				var tPainter = filter.paintersHash.get(tileKey);
				
				var curGeom:MultiGeometry = tPainter.tileGeometry;
				if (!curGeom.extent.overlaps(pointExtent)) continue;				// пропускаем не пересекающие точку
				if (filter.clusterAttr != null && !filter.clusterAttr._zoomDisabledHash.exists(currentZ)) {
					curGeom = tPainter.clustersGeometry;
					hoverStyle = node.getHoveredStyle();
				}
				if(curGeom == null) continue;		// пропускаем ноды без MultiGeometry
				for (member in curGeom.members)
				{
					if (!member.extent.overlaps(pointExtent)) continue;		// пропускаем не пересекающие точку
					if (criterion != null && !criterion(member.properties)) continue;	// пропускаем ноды отфильтрованные setVisibilityFilter
					if (filter.clusterAttr == null && temporalCriterion != null && !temporalCriterion(member.propTemporal)) {
						continue;					// пропускаем ноды отфильтрованные мультивременными интервалами только если нет кластеризации
					}
					
					var d = member.distanceTo(x, y);
					if (d <= distance)		// Берем только минимальное растояние
					{
						hoverGeom = member;
						newCurrentId = member.properties.get(identityField);
						newCurrentFilter = filter;
						
						distance = d;
						if (distance == 0) {
							zeroDistanceIds.push(hoverGeom);
							zeroDistanceFilters.push(filter);
						}
					}
				}
			}
		}

		var len = zeroDistanceIds.length;
		flipDown = (len > 1);
		if (len > 0)
		{
			var lastFc:Null<Int> = 100000000;
			var lastDate = "1900-00-00";
			for (i in 0...zeroDistanceIds.length)
			{
				var geom = zeroDistanceIds[i];
				var prop = geom.properties;
				var id = prop.get(identityField);
				
				var fc:Null<Int> = flipCounts.get(id);
				var date = Utils.getDateProperty(prop);
				var isHigher:Bool = false;
				var isHigherDate = (date == null) || (date > lastDate);
				if (lastFc == null)
					isHigher = (fc == null) ? isHigherDate : (fc < 0);
				else if (lastFc > 0)
					isHigher = (fc == null) || (fc < lastFc);
				else if (lastFc < 0)
					isHigher = (fc != null) && (fc < lastFc);
				if (isHigher)
				{
					lastFc = fc;
					lastDate = date;
					newCurrentId = id;
					newCurrentFilter = zeroDistanceFilters[i];
					hoverGeom = geom;
				}
			}
		}
		if (newCurrentId != currentId)
		{
			if ((newCurrentFilter != currentFilter) && (currentFilter != null)) {
				currentFilter.mapNode.callHandler("onMouseOut");
			}
			currentId = newCurrentId;
			if (newCurrentFilter != null) {
				if(newCurrentFilter.clusterAttr == null) {
					if(newCurrentFilter != null) hoverStyle = newCurrentFilter.mapNode.getHoveredStyle();
					if (distance != Geometry.MAX_DISTANCE) {
						if(geometries.exists(currentId)) hoverGeom = geometries.get(currentId);
						if (hoverStyle != null 							// Пока только для обьектов с заливкой
							&& hoverStyle.fill != null
							&& (hoverStyle.outline == null || hoverStyle.outline.opacity == 0)
							) {
							hoverGeom = fromTileGeometry(hoverGeom);
						}
					}
				}
				lastGeometry = hoverGeom;
			}
			currentFilter = newCurrentFilter;
			if (currentId != null) {
				lastId = currentId;
				lastGeometry = hoverGeom;
			}

			if (newCurrentFilter != null) newCurrentFilter.mapNode.callHandler("onMouseOver");
			hoverPainter.geometry = hoverGeom;
			hoverPainter.repaint(hoverStyle);
		}
		if (currentFilter != null)
			currentFilter.mapNode.callHandler("onMouseMove");
	}

/*	
	// Проверка принадлежнсти точки границам тайлов
	private function onTileBoundary(x:Float, y:Float):Bool
	{
		var minx:Float;
		var miny:Float;
		var maxx:Float;
		var maxy:Float;

		for (tile in hoverTiles) {
			var d = (tile.extent.maxx - tile.extent.minx)/10000;
			minx = tile.extent.minx + d;
			miny = tile.extent.miny + d;
			maxx = tile.extent.maxx - d;
			maxy = tile.extent.maxy - d;
			if (x >= minx && x <= maxx && y >= miny && y <= maxy) return true;
		}
		return false;
	}
*/
	// Преобразование геометрии обьекта полученного из тайла
	private function fromTileGeometry(geom:Geometry):Geometry
	{
		if (Std.is(geom, PointGeometry)) {
			return geom;
		} else if (Std.is(geom, LineGeometry)) {
			return geom;
		} else if (Std.is(geom, PolygonGeometry)) {
			var geo = cast(geom, PolygonGeometry);
			var coords = new Array<Array<Float>>();
			var deltaX:Float = 0;

			var w = 2*Utils.worldWidth;
			var e1 = mapNode.window.visibleExtent;
			var cx1 = (e1.minx + e1.maxx) / 2;
			var e2 = geo.extent;
			var cx2 = (e2.minx + e2.maxx)/2;
			var d1 = Math.abs(cx2 - cx1 - w);
			var d2 = Math.abs(cx2 - cx1);
			var d3 = Math.abs(cx2 - cx1 + w);
			if ((d1 <= d2) && (d1 <= d3))
				deltaX = -w;
			else if ((d2 <= d1) && (d2 <= d3))
				deltaX = 0;
			else if ((d3 <= d1) && (d3 <= d2))
				deltaX = w;
			
			for (part in geo.coordinates) {
				var pp = new Array<Float>();
				//var flag = false;
				for (i in 0...Std.int(part.length/2)) {
					//var curFlag = onTileBoundary(part[i * 2], part[i * 2 + 1]);
					//if (!flag && !curFlag) {
						pp.push(part[i*2] + deltaX);
						pp.push(part[i * 2 + 1]);
					//}
					//flag = curFlag;
				}
				coords.push(pp);
			}
			
			geo = new PolygonGeometry(coords);
			geo.properties = geom.properties;
			geo.propHiden = geom.propHiden;
			geo.propTemporal = geom.propTemporal;
			return geo;
		} else if (Std.is(geom, MultiGeometry)) {
			var ret = new MultiGeometry();
			var geo = cast(geom, MultiGeometry);
			for (member in geo.members)
				ret.addMember(fromTileGeometry(member));
			ret.properties = geom.properties;
			ret.propHiden = geom.propHiden;
			ret.propTemporal = geom.propTemporal;
			return ret;
		}
		return null;
	}
	
	public override function addHandlers()
	{
		hoverPainter = new GeometryPainter(null, Utils.addSprite(contentSprite), mapNode.window);
		//contentSprite.mouseChildren = false;
		//contentSprite.mouseEnabled = false;
	}

	public function checkFlip()
	{
		if(vectorLayerObserver == null) flip();
	}

	public function flip():Int
	{
		lastFlipCount += 1;
		var ret = flipDown ? lastFlipCount : -lastFlipCount;
		if (currentId != null)
		{
			flipCounts.set(currentId, ret);
			repaintIndicator(null);
		}
		return ret;
	}
}
