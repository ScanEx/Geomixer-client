import flash.events.MouseEvent;
import flash.display.Sprite;

class VectorObject extends MapContent
{	
	public var geometry:Geometry;
	public var painter:GeometryPainter;
	public var isActive:Bool;
	public var label:String;

	var curNodeFilter:MapNode;
	var curFilter:VectorLayerFilter;
	var layer:VectorLayer;
	var xshift:Float;
	
	var criterion:Hash<String>->Bool;
	var isPainted:Bool;			// обьект отображен

	public function new(geometry_:Geometry)
	{
		geometry = geometry_;
		isActive = false;
		isPainted = false;
		curNodeFilter = null;
		curFilter = null;
		layer = null;
		xshift = 0.0;
	}

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public override function addHandlers()
	{
		var me = this;
		painter = new GeometryPainter(geometry, contentSprite, mapNode.window);
		
		var node:MapNode = findLayer(mapNode);
		if (node != null && Std.is(node.content, VectorLayer)) {
			layer = cast(node.content, VectorLayer);
			if (layer.attrHash != null) {
				if (layer.attrHash.TemporalColumnName != null && geometry.properties != null) {
					var pt = geometry.properties.get(layer.attrHash.TemporalColumnName);
					if(pt != null) {
						var unixTimeStamp:String = Utils.dateStringToUnixTimeStamp(pt);
						if(unixTimeStamp != '') geometry.propTemporal.set('unixTimeStamp', unixTimeStamp);			// посчитали unixTimeStamp для фильтра
					}
				}
			}

			contentSprite.addEventListener(MouseEvent.MOUSE_DOWN, function(event) {
				me.layer.lastGeometry = null; // для обнуления предыдущей геометрии под мышкой в тайле
				if (me.curNodeFilter != null) Main.registerMouseDown(me.curNodeFilter, event, me.mapNode);
			});
		} else {
			super.addHandlers();
		}
		contentSprite.addEventListener(MouseEvent.MOUSE_OVER, function(event) {
			if (Main.mousePressed && !Main.draggingDisabled) return;		// При нажатой мышке и не рисование ничего не делаем
			me.isActive = true;
			me.highlight();
		});
		contentSprite.addEventListener(MouseEvent.MOUSE_OUT, function(event) {
			if (Main.mousePressed && !Main.draggingDisabled) return;		// При нажатой мышке и не рисование ничего не делаем
			me.isActive = false;
			me.highlight();
		});

		contentSprite.buttonMode = contentSprite.useHandCursor = true;
	}

	public override function repaint()
	{
		if (Main.mousePressed && !Main.draggingDisabled) return;		// При нажатой мышке и не рисование не перерисовываем
		var curStyle = null;
		var curTemporalCriterion = null;
		var notClearFlag:Bool = false;
		var notCacheBitmap:Bool = (mapNode.window.cacheBitmap == null || !mapNode.window.cacheBitmap.visible ? true : false);
		if(notCacheBitmap) {
			var node:MapNode = mapNode.findHidenKeyNode('_FilterVisibility');
			criterion = (node == null ? null : node.propHiden.get('_FilterVisibility'));

			if (criterion == null || criterion(geometry.properties)) {
				curStyle = (isActive ? mapNode.getHoveredStyle() : mapNode.getRegularStyle());
				if (layer != null) {	// обьект лежит в слое - отрисовка по фильтрам
					curTemporalCriterion = layer.temporalCriterion;
					if(layer.currentId != null && mapNode.propHash != null && layer.currentId == mapNode.propHash.get(layer.identityField)) {
						if (layer.currentFilter != null) {
							layer.hoverPainter.repaint(null);
							layer.currentFilter.mapNode.callHandler('onMouseOut', mapNode);
							//layer.currentFilter = null;
						}
						layer.lastId = null;
						layer.currentId = null;
					}

					if (curStyle == null) {			// Собственного стиля у обьекта нет
						var nodeFilter = null;
						for (key in mapNode.parent.filters.keys()) {
							nodeFilter = mapNode.parent.filters.get(key);
							if (nodeFilter != null) {
								var vectorLayerFilter = cast(nodeFilter.content, VectorLayerFilter);
								if (vectorLayerFilter.criterion(mapNode.propHash)) {
									if(vectorLayerFilter.clusterAttr != null) {
										curStyle = (isActive ? vectorLayerFilter.hoverStyleOrig : vectorLayerFilter.regularStyleOrig);
									} else {
										curStyle = (isActive ? nodeFilter.getHoveredStyle() : nodeFilter.getRegularStyle());
									}
									painter.repaint(curStyle, curTemporalCriterion, null, notClearFlag);
									notClearFlag = true;
								}
							}
						}
					}
				} else {					// Для обьектов не в векторном слое найти рекурсивный стиль
					if (isActive) {
						curStyle = mapNode.getHoveredStyleRecursion();
						if(curStyle == null) curStyle = mapNode.getRegularStyleRecursion();
					} else {
						curStyle = mapNode.getRegularStyleRecursion();
					}
				}
			}
		}
		if(!notClearFlag) painter.repaint(curStyle, curTemporalCriterion);
		isActive = false;
		curNodeFilter = null;
		chkPositionX();
		if (layer != null && layer.vectorLayerObserver != null) {
//trace('-------- VectorObject -222----- ' + isPainted + ' : ' + geometry.isPainted + ' : ' + layer.vectorLayerObserver + ' : ' + mapNode.properties + ' : ' +  flash.Lib.getTimer() );
			var flag:Bool = false;
			if (isPainted) {
				if (!geometry.isPainted) layer.vectorLayerObserver.callFromVectorItem(mapNode, flag);		
			} else {
				flag = true;
				if (geometry.isPainted) layer.vectorLayerObserver.callFromVectorItem(mapNode, flag);		
				
			}
			isPainted = geometry.isPainted;
		}
	}

	function chkPositionX()
	{
		if (mapNode.propHiden.get('isDraging')) return;
		var parNode:MapNode = mapNode.parent;
		//if (mapNode.parent != null && mapNode.parent.parent != null && mapNode.parent.parent.propHiden.get('type') == 'FRAMECHILD') return;

		xshift = Utils.getShiftX(geometry.extent.minx, geometry.extent.maxx, mapNode);
		var pos:Int = cast(xshift);
		if (contentSprite.x != pos) contentSprite.x = pos;
		geometry.propHiden.set('_xshift', xshift);
	}

	public override function hasLabels()
	{
		//if(mapNode.propHiden.exists('clusterItem')) return false;
		
		var style = mapNode.getRegularStyleRecursion();
		return ((label != null) && (style != null) && (style.label != null));
	}

	public override function paintLabels()
	{
		if (Main.mousePressed) return;		// При нажатой мышке labels не перерисовываем
		//if (Main.mousePressed || mapNode.propHiden.exists('clusterItem')) return;		// При нажатой мышке labels не перерисовываем
		if(criterion == null || criterion(geometry.properties)) {
			var style = mapNode.getRegularStyleRecursion();
			if (style == null || style.label == null) return;
			if(style.label.field != null) label = mapNode.propHash.get(style.label.field);
			if(label == null) return;
			mapNode.window.paintLabel(label, geometry, style, xshift);
		}
	}

	function findFilter()
	{
		var nodeFilter = null;
		for (key in mapNode.parent.filters.keys()) {
			nodeFilter = mapNode.parent.filters.get(key);
			if (nodeFilter != null) {
				var vectorLayerFilter = cast(nodeFilter.content, VectorLayerFilter);
				if (vectorLayerFilter.criterion(mapNode.propHash)) {
					return vectorLayerFilter;
				}
			}
		}
		return null;
	}

	function findLayer(node:MapNode):MapNode
	{
		if (node == null) return null;
		else if (Std.is(node.content, VectorLayer)) return node;
		else if (node.parent != null) return findLayer(node.parent);
		return null;
	}
	
	function highlight()
	{
		if (Main.mousePressed) return;		// При нажатой мышке labels не перерисовываем
		//isActive = true;
		if (layer != null) {
			var curStyle = mapNode.getHoveredStyleRecursion();
			curFilter = findFilter();
			if (curFilter != null) {
				curNodeFilter = curFilter.mapNode;
				curStyle = curNodeFilter.getHoveredStyle();
				layer.currentFilter = curFilter;
			}
			layer.lastId = mapNode.id;
			var oId = mapNode.propHash.get(layer.identityField);
			layer.currentId = oId;
			if(!layer.deletedObjects.exists(oId)) {				// подсветка только не удаляемых обьектов тайла
				var hStyle = curStyle;
				if (isActive) 
				{
					layer.hoverPainter.geometry = geometry;
				}
				else
				{
					layer.lastId = mapNode.id;
					hStyle = null;
				}
				layer.hoverPainter.repaint(hStyle);
			}
			if (curNodeFilter != null) curNodeFilter.callHandler((isActive ? "onMouseOver" : "onMouseOut"), mapNode);
		} else {
			repaint();
		}
	}

	public function setActive(isActive_)
	{
		isActive = isActive_;
		repaint();
	}
}