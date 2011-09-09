import flash.events.MouseEvent;
import flash.display.Sprite;

class VectorObject extends MapContent
{	
	public var geometry:Geometry;
	public var painter:GeometryPainter;
	public var isActive:Bool;
	public var label:String;

	var curNodeFilter:MapNode;
	var layer:VectorLayer;
	
	public function new(geometry_:Geometry)
	{
		geometry = geometry_;
		isActive = false;
		curNodeFilter = null;
		layer = null;
	}

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public override function addHandlers()
	{
		var me = this;
		painter = new GeometryPainter(geometry, contentSprite, mapNode.window);
		if (Std.is(mapNode.parent.content, VectorLayer)) {
			layer = cast(mapNode.parent.content, VectorLayer);
			contentSprite.addEventListener(MouseEvent.MOUSE_DOWN, function(event) {
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
		if (layer != null) {
			curStyle = (isActive ? mapNode.getHoveredStyleRecursion() : mapNode.getRegularStyleRecursion());
			if (curNodeFilter != null) {
				layer.hoverPainter.repaint(null);
				curNodeFilter.callHandler('onMouseOut', mapNode);
			}
			layer.lastId = null;
			layer.currentId = null;
		} else {
			curStyle = (isActive ? mapNode.getHoveredStyle() : mapNode.getRegularStyle());			
		}
		painter.repaint(curStyle);
		isActive = false;
		curNodeFilter = null;
	}

	public override function hasLabels()
	{
		var style = mapNode.getRegularStyleRecursion(mapNode.parent);
		return ((label != null) && (style != null) && (style.label != null));
	}

	public override function paintLabels()
	{
		var style = mapNode.getRegularStyleRecursion(mapNode.parent);
		if (style == null || style.label == null) return;
		if(style.label.field != null) label = mapNode.propHash.get(style.label.field);
		if(label == null) return;
		mapNode.window.paintLabel(label, geometry, style);
	}

	function highlight()
	{
		isActive = true;
		if (layer != null) {
			layer.lastId = mapNode.id;
			var curStyle = mapNode.getHoveredStyleRecursion();
			curNodeFilter = null;
			layer.currentId = mapNode.propHash.get(layer.identityField);
			for (key in mapNode.parent.filters.keys()) {
				curNodeFilter = mapNode.parent.filters.get(key);
				if (curNodeFilter != null) {
					var vectorLayerFilter = cast(curNodeFilter.content, VectorLayerFilter);
					if (vectorLayerFilter.criterion(mapNode.propHash)) {
						curStyle = curNodeFilter.getHoveredStyle();
						layer.currentFilter = vectorLayerFilter;
						break;
					}
				}
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