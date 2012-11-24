import flash.display.Sprite;
import flash.display.Stage;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.utils.Timer;
import flash.events.TimerEvent;

class VectorLayerFilter extends MapContent
{
	public var criterion:Hash<String>->Bool;
	//public var loadedTiles:Array<VectorTile>;
	public var painters:Array<VectorTilePainter>;
	public var tilesSprite:Sprite;
	public var loader:Extent->Void;
	public var layer:VectorLayer;
	public var ids:Hash<Bool>;

	public var clusterAttr:Dynamic;
	public var paintersHash:Hash<VectorTilePainter>;	// Хэш отрисовщиков тайлов данного фильтра
	var curChkData:Dynamic;								// Текущие данные для проверки обновлений
	var evTarget:Stage;									// Обьект глобальных событий

	public function new(criterion_:Hash<String>->Bool)
	{
		criterion = criterion_;
		flush();
		evTarget = flash.Lib.current.stage;
		evTarget.addEventListener( APIEvent.CUSTOM_EVENT, chkMapMove );
	}

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public override function flush()
	{
		if (painters != null)
			for (painter in painters)
				painter.remove();
		//loadedTiles = new Array<VectorTile>();
		painters = new Array<VectorTilePainter>();
		paintersHash = new Hash<VectorTilePainter>();
		ids = new Hash<Bool>();
		if (layer != null)
			createLoader();
		delClusters();
		curChkData = {};
	}

	// Удалить устаревшие тайлы слоя - вызывается из VectorLayer
	public function removeTiles(pt:Dynamic)
	{
		if (pt.del != null) {
			var newArr = new Array<VectorTilePainter>();
			for (painter in painters) {
				var tile:VectorTile = painter.tile;
				var st:String = tile.z+'_'+tile.i+'_'+tile.j;
				var flag:Bool = Reflect.field(pt.del, st);
				if (flag) {
					for (i in 0...Std.int(tile.ids.length))
					{
						var id:String = cast(tile.ids[i]);
						ids.remove(id);					// Удалить обьекты по ogc_fid из списка обьектов в фильтре
						layer.geometries.remove(id);	// из geometries слоя
					}
					paintersHash.remove(st);
					painter.remove();
					layer.hashTiles.remove(st);
				} else {
					newArr.push(painter);
				}
			}
			painters = newArr;
		}
	}

	// Удалить обьекты из тайлов слоя находящиеся в режиме редактирования - вызывается из VectorLayer
	public function removeItems(ph:Dynamic<Bool>)
	{
		for (painter in painters) {
			painter.tile.removeItems(ph);
			painter.tileGeometry = getTileMultiGeometry(painter.tile);
		}
		for (key in Reflect.fields(ph)) {
			ids.remove(cast(key));
		}
		
	}

	// Удалить кластеризацию на фильтре
	public override function delClusters():Dynamic
	{
		clusterAttr = null;
		for (painter in painters) painter.needRfresh();
		Main.needRefreshMap = true;
	}

	// Инициализация кластеризации на фильтре
	private function runClusters(attr:Dynamic)
	{
		if (attr != null) clusterAttr = attr;
		// Проверка изменения атрибутов кластеризации
		if (curChkData.iterationCount != clusterAttr.iterationCount || curChkData.radius != clusterAttr.radius) {
			clusterAttr.needRefresh = true;
			curChkData.iterationCount = clusterAttr.iterationCount;
			curChkData.radius = clusterAttr.radius;
		}

		// инициализация стилей
		if (clusterAttr.RenderStyle != null) {
			clusterAttr.regularStyle = new Style(clusterAttr.RenderStyle);
			clusterAttr.regularStyle.load(function() { Main.needRefreshMap = true; });
			clusterAttr.needRefresh = true;
		}
		if (clusterAttr.HoverStyle != null) { clusterAttr.hoverStyle = new Style(clusterAttr.HoverStyle); clusterAttr.hoverStyle.load(function(){}); }

		clusterAttr._zoomDisabledHash = new Hash<Bool>();
		if (clusterAttr.zoomDisabled != null) {
			for (i in 0...Std.int(clusterAttr.zoomDisabled.length))
			{
				clusterAttr._zoomDisabledHash.set(clusterAttr.zoomDisabled[i], true);
			}
		}
		
		Main.needRefreshMap = true;
	}

	// Проверка движения карты
	private function chkMapMove(attr)
	{
		if(clusterAttr != null) {
			clusterAttr.needRefresh = true;
		}
	}

	// Установить кластеризацию на фильтре
	public override function setClusters(attr:Dynamic):Dynamic
	{
		runClusters(attr);
		needRefreshClusters();
		return true;
	}

	// обновить кластеры
	public function needRefreshClusters()
	{
		if (clusterAttr != null) {
			clusterAttr.needRefresh = true;
			for (painter in painters)
				painter.clustersGeometry = null;

			Main.needRefreshMap = true;
			mapNode.noteSomethingHasChanged();
		}
	}

	function getTileMultiGeometry(tile:VectorTile):MultiGeometry
	{
		var tileGeometry = new MultiGeometry();
		if (layer != null) {
			for (i in 0...tile.geometries.length)
			{
				var geom = tile.geometries[i];
				if (layer.temporalCriterion != null && !layer.temporalCriterion(geom.propTemporal)) {
					continue;
				}
				if (criterion(geom.properties))
				{
					var oId:String = geom.properties.get(layer.identityField);
					ids.set(oId, true);
					//ids.set(tile.ids[i], true);
					tileGeometry.addMember(geom);
				}
			}
		}
		return tileGeometry;
	}

	// Переформируем список VectorTilePainter для загруженных тайлов
	function chkLoadedTiles(arr:Array<VectorTile>)
	{
		for (tile in arr)
		{
			if (tile.finishedLoading) {
				var st:String = tile.z+'_'+tile.i+'_'+tile.j;
				if(!paintersHash.exists(st)) {
					var tileGeometry = getTileMultiGeometry(tile);
					var painter:VectorTilePainter = new VectorTilePainter(tileGeometry, this, tile);
					painters.push(painter);
					paintersHash.set(st, painter);
				}
			}
		}
	}

	public function createLoader()
	{
		chkLoadedTiles(layer.tiles);
		var me = this;
		loader = layer.createLoader(function(tile:VectorTile, tilesRemaining:Int)
		{
			if (tile == null) return;
			var st:String = tile.z + '_' + tile.i + '_' + tile.j;
			var tileGeometry = me.getTileMultiGeometry(tile);
			var window = me.mapNode.window;

			var painter = null;
			if (me.paintersHash.exists(st)) {
				painter = me.paintersHash.get(st);
			} else {
				painter = new VectorTilePainter(tileGeometry, me, tile);
				me.painters.push(painter);
				me.paintersHash.set(st, painter);
			}

			painter.repaint(me.mapNode.getRegularStyle());

			if (tilesRemaining == 0)
			{
				window.cacheRepaintNeeded = true;
				var style = me.mapNode.regularStyle;
				if ((style != null) && (style.label != null))
					window.labelsRepaintNeeded = true;
				for (child in me.layer.mapNode.children)
					if (Std.is(child.content, VectorLayerObserver))
						child.noteSomethingHasChanged();
				Main.needRefreshMap = true;		// Для обновления карты
			}
		});
	}

	public override function repaint()
	{
		if (Main.isFluidZoom || Main.isDrawing) return;		// В режиме рисования ничего не делаем
		if(loader != null) loader(mapNode.window.visibleExtent);
		var w = 2 * Utils.worldWidth;
		var e1 = mapNode.window.visibleExtent;
		var cx1 = (e1.minx + e1.maxx) / 2;
		var curStyle = mapNode.getRegularStyle();
		//trace('filter ' + painters.length + mapNode.parent.id + ' : ' + flash.Lib.getTimer());		

		for (painter in painters)
		{
			painter.repaint(curStyle);
			if(painter.painter.geometry != null) {
				var e2 = painter.painter.geometry.extent;
				var cx2 = (e2.minx + e2.maxx)/2;
				var d1 = Math.abs(cx2 - cx1 - w);
				var d2 = Math.abs(cx2 - cx1);
				var d3 = Math.abs(cx2 - cx1 + w);
				if ((d1 <= d2) && (d1 <= d3))
					painter.setOffset(-w);
				else if ((d2 <= d1) && (d2 <= d3))
					painter.setOffset(0);
				else if ((d3 <= d1) && (d3 <= d2))
					painter.setOffset(w);
			}
		}
		if(clusterAttr != null) {
			clusterAttr.needRefresh = false;
		}
		if(layer.vectorLayerObserver != null) {
			layer.vectorLayerObserver.setNeedRefresh();
		}
	}

	public override function hasLabels()
	{
		var style = (mapNode != null ? (clusterAttr != null ? clusterAttr.regularStyle : mapNode.getRegularStyle()) : null);
		return ((style != null) && (style.label != null));
	}

	public override function paintLabels()
	{
		if (Main.isDrawing) return;		// В режиме рисования ничего не делаем
		if (hasLabels())
		{
			var style = (clusterAttr != null ? clusterAttr.regularStyle : mapNode.getRegularStyle());
			var window = mapNode.window;
			var idsAlreadyPainted = new Hash<Bool>();
			var e1 = window.visibleExtent;
			var currentZ:Int = Std.int(window.getCurrentZ());
	
			for (key in paintersHash.keys())
			{
				var tPainter = paintersHash.get(key);
				var curGeom:MultiGeometry = (clusterAttr == null || clusterAttr._zoomDisabledHash.exists(currentZ) ? tPainter.tileGeometry : tPainter.clustersGeometry);
				if(curGeom != null) {
					for (member in curGeom.members)
					{
						var id = member.properties.get(layer.identityField);
						if (!idsAlreadyPainted.exists(id))
						{
							window.paintLabel(
								member.properties.get(style.label.field),
								member,
								style
								,tPainter.xShift
							);
							idsAlreadyPainted.set(id, true);
						}
					}
				}
			}
		}
	}

	public override function addHandlers()
	{
		tilesSprite = Utils.addSprite(contentSprite);
		layer = cast(mapNode.parent.content, VectorLayer);
		createLoader();

		var me = this;
		contentSprite.addEventListener(MouseEvent.MOUSE_DOWN, function(event:MouseEvent)
		{
			if (Main.isDrawing) return;		// В режиме рисования ничего не делаем
			
			//me.layer.currentFilter = me;
			if (me.layer.currentFilter != null) {
				if (event.ctrlKey) {
					if(me.clusterAttr == null)  me.layer.checkFlip(event);
					event.stopImmediatePropagation();
					return;
				}
				Main.registerMouseDown(me.layer.currentFilter.mapNode, event, null);
//event.stopImmediatePropagation();
			}
		});
		var prevMove:Int = flash.Lib.getTimer();
		contentSprite.addEventListener(MouseEvent.MOUSE_MOVE, function(event:MouseEvent)
		{
			if (Main.mousePressed || Main.isDrawing || Main.draggingDisabled) return;		// В режиме рисования ничего не делаем
			var newMove:Int = flash.Lib.getTimer();
			if (newMove - prevMove < 100) return;
			//if (event.ctrlKey) return;
			//me.layer.currentFilter = me;
			me.layer.repaintIndicator(event);
			prevMove = newMove;
//event.stopImmediatePropagation();
			//me.layer.needRepaintIndicator = true;
			//Main.bumpFrameRate();
		});
		var roll_out = function(event:Event)
		{
			if (Main.mousePressed || Main.isDrawing || Main.draggingDisabled) return;		// В режиме рисования ничего не делаем
			if (me.layer.currentFilter != null)
			{
				var node = me.layer.currentFilter.mapNode;
				node.callHandler("onMouseOut");
			}
			me.layer.currentId = null;
			me.layer.hoverPainter.repaint(null);
			me.layer.currentFilter = null;
			//me.layer.lastGeometry = null;
			event.stopImmediatePropagation();
		};
		contentSprite.addEventListener(MouseEvent.ROLL_OUT, function(event:MouseEvent) {
			//var pos:Dynamic = Main.getMousePos();
			//var flag:Bool = me.contentSprite.hitTestPoint(pos.mouseX, pos.mouseY, true);
			//trace('roll_out _____________ ' + ' : ' + flag + ' : ' + pos.mouseX + ' : ' + pos.mouseY + ' : ' + me.contentSprite.scaleX + ' : ' + me.contentSprite.scaleY + ' : ' +  flash.Lib.getTimer());
			//if (flag) return;
			roll_out(event);
		});
		evTarget.addEventListener(Event.MOUSE_LEAVE, roll_out);
	}
}
