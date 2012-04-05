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

	public function new(geometry_:Geometry)
	{
		geometry = geometry_;
		isActive = false;
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
				if (layer.attrHash.TemporalColumnName != null) {
					var pt = geometry.properties.get(layer.attrHash.TemporalColumnName);
					if(pt != null) {
						var unixTimeStamp:String = Utils.dateStringToUnixTimeStamp(pt);
						if(unixTimeStamp != '') geometry.propTemporal.set('unixTimeStamp', unixTimeStamp);			// посчитали unixTimeStamp для фильтра
					}
				}
			}

			contentSprite.addEventListener(MouseEvent.MOUSE_DOWN, function(event) {
				me.layer.lastGeometry = null; // для обнуления предыдущей геометрии под мышкой в тайле
				if(me.curNodeFilter != null) Main.registerMouseDown(me.curNodeFilter, event, me.mapNode);
			});
		} else {
			super.addHandlers();
		}
		contentSprite.addEventListener(MouseEvent.MOUSE_OVER, function(event) { me.highlight(); });
		contentSprite.addEventListener(MouseEvent.MOUSE_OUT, function(event) { me.isActive = false;	me.repaint(); });

		contentSprite.buttonMode = contentSprite.useHandCursor = true;
	}

	public override function repaint()
	{
		var curStyle = null;
		var curTemporalCriterion = null;

		var node:MapNode = findHidenKeyNode(mapNode, '_FilterVisibility');
		criterion = (node == null ? null : node.propHiden.get('_FilterVisibility'));

		if(criterion == null || criterion(geometry.properties)) {
			if (layer != null) {
				curFilter = findFilter();
				if (curFilter != null && curFilter.clusterAttr != null) {
					curStyle = (isActive ? curFilter.hoverStyleOrig : curFilter.regularStyleOrig);
				} else {
					curStyle = (isActive ? mapNode.getHoveredStyleRecursion() : mapNode.getRegularStyleRecursion());
				}
				curTemporalCriterion = layer.temporalCriterion;
				if (layer.currentFilter != null) {
					layer.hoverPainter.repaint(null);
					layer.currentFilter.mapNode.callHandler('onMouseOut', mapNode);
				}
				layer.lastId = null;
				layer.currentId = null;
			} else {
				curStyle = (isActive ? mapNode.getHoveredStyle() : mapNode.getRegularStyle());			
			}
		}
		painter.repaint(curStyle, curTemporalCriterion);
		isActive = false;
		curNodeFilter = null;
		chkPositionX();
	}
	
	function chkPositionX()
	{
		if (mapNode.propHiden.get('isDraging')) return;
		var parNode:MapNode = mapNode.parent;
		if (mapNode.parent != null && mapNode.parent.parent != null && mapNode.parent.parent.propHiden.get('type') == 'FRAMECHILD') return;

		xshift = Utils.getShiftX(geometry.extent.minx, geometry.extent.maxx, mapNode);
		var pos:Int = cast(xshift);
		if (contentSprite.x != pos) contentSprite.x = pos;
		geometry.propHiden.set('_xshift', xshift);
	}

	public override function hasLabels()
	{
		var style = mapNode.getRegularStyleRecursion();
		return ((label != null) && (style != null) && (style.label != null));
	}

	public override function paintLabels()
	{
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

	function findHidenKeyNode(node:MapNode, key):MapNode
	{
		if (node == null) return null;
		else if (node.propHiden.exists(key)) return node;
		else if (node.parent != null) return findHidenKeyNode(node.parent, key);
		return null;
	}
	
	function highlight()
	{
		isActive = true;
		if (layer != null) {
			layer.lastId = mapNode.id;
			layer.currentId = mapNode.propHash.get(layer.identityField);

			var curStyle = mapNode.getHoveredStyleRecursion();
			curFilter = findFilter();
			if (curFilter != null) {
				curNodeFilter = curFilter.mapNode;
				curStyle = curNodeFilter.getHoveredStyle();
				layer.currentFilter = curFilter;
			}
			layer.hoverPainter.geometry = geometry;
			layer.hoverPainter.repaint(curStyle);
			if (curNodeFilter != null) curNodeFilter.callHandler("onMouseOver", mapNode);
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