import flash.display.Sprite;
import flash.events.Event;
import flash.events.MouseEvent;
import flash.utils.Timer;
import flash.events.TimerEvent;

class ClusterPointsViewer extends MapContent
{
	public var vlFilter:VectorLayerFilter;				// фильтр родитель
	private var centrGeometry:PointGeometry;			// центр кластера
	private var members:Array<PointGeometry>;			// члены кластера
	private var curGeos:Array<Geometry>;				// отрисованные Geometry
	private var bgSprite:Sprite;						// 
	private var eventsFlag:Bool;						// флаг установки событий
	private var paintFlag:Bool;							// флаг отрисовки
	private var clusterViewAttr:Dynamic;				// Атрибуты отображения членов кластера 
	private	var scaleCurrent:Float;						// текущий scale
	private	var contSprite:Sprite;						// контейнер
	private	var depth:Int;								// глубина слоя
	
	public function new(vlf_:VectorLayerFilter)
	{
		vlFilter = vlf_;
		eventsFlag = false;
		paintFlag = false;
		flush();
		depth = vlFilter.layer.mapNode.getDepth();
		vlFilter.layer.mapNode.bringToDepth(vlFilter.layer.mapNode.vectorSprite.parent.numChildren - 1);
	}

	public override function createContentSprite()
	{
		contSprite = mapNode.vectorSprite;
		bgSprite = Utils.addSprite(contSprite);
		mapNode.setStyle(vlFilter.mapNode.regularStyle, vlFilter.mapNode.hoveredStyle);
		return Utils.addSprite(contSprite);
	}

	public function remove()
	{
		vlFilter.layer.mapNode.bringToDepth(depth);
		vlFilter.layer.mapNode.noteSomethingHasChanged();
		mapNode.remove();
	}
	
	public override function flush()
	{
		centrGeometry = cast(vlFilter.layer.lastGeometry, PointGeometry);
		members = centrGeometry.propHiden.get('_members');
		curGeos = new Array<Geometry>();
		
		clusterViewAttr = (vlFilter.clusterAttr.clusterView != null ? vlFilter.clusterAttr.clusterView : { } );
		if (clusterViewAttr.radius == null) clusterViewAttr.radius = 50;	// максимальный радиус сдвига координат обьектов попавших в кластер (по умолчанию '50')
		if (clusterViewAttr.delta == null) clusterViewAttr.delta = 0;	// разброс сдвига координат (по умолчанию '0')
		
		if (clusterViewAttr.bgStyle == null) clusterViewAttr.bgStyle =  {};	// Стиль подложки отображения
		if (clusterViewAttr.bgStyle.fill == null) clusterViewAttr.bgStyle.fill = {};	
		if (clusterViewAttr.bgStyle.fill.color == null) clusterViewAttr.bgStyle.fill.color = 0xff0000;	
		if (clusterViewAttr.bgStyle.fill.opacity == null) clusterViewAttr.bgStyle.fill.opacity = 10;	
		if (clusterViewAttr.bgStyle.outline == null) clusterViewAttr.bgStyle.outline = {};
		if (clusterViewAttr.bgStyle.outline.color == null) clusterViewAttr.bgStyle.outline.color = 0x0000ff;	
		if (clusterViewAttr.bgStyle.outline.thickness == null) clusterViewAttr.bgStyle.outline.thickness = 2;	
		if (clusterViewAttr.bgStyle.outline.opacity == null) clusterViewAttr.bgStyle.outline.opacity = 20;	
		
		if (clusterViewAttr.lineStyle == null) clusterViewAttr.lineStyle =  {};	// Стиль линии соединяющей центр кластера с отображаемым обьектом
		if (clusterViewAttr.lineStyle.color == null) clusterViewAttr.lineStyle.color = 0x32ade5;	
		if (clusterViewAttr.lineStyle.opacity == null) clusterViewAttr.lineStyle.opacity = 20;	
		if (clusterViewAttr.lineStyle.thickness == null) clusterViewAttr.lineStyle.thickness = 2;	
	}

	private	function addPoint(i:Int, deltaAlpha:Float, rad:Float)
	{
		var pt:PointGeometry = members[i];
		
		var node:MapNode = mapNode.addChild();
		node.setStyle(new Style({outline: clusterViewAttr.lineStyle}));

		var xx:Float = centrGeometry.x + rad * Math.cos(i*deltaAlpha);
		var yy:Float = centrGeometry.y + rad * Math.sin(i*deltaAlpha);
		
		var line:LineGeometry = new LineGeometry([centrGeometry.x, centrGeometry.y, xx, yy]);
		if(pt.propTemporal != null) line.propTemporal = pt.propTemporal;
		node.setContent(new VectorObject(line));
		node.content.contentSprite.mouseEnabled = false;
		
		node = mapNode.addChild();
		var point:PointGeometry = new PointGeometry(xx, yy);
		point.properties = pt.properties;
		node.propHash = pt.properties;
		node.properties = pt.properties;
		node.propHiden.set('clusterItem', true);

		var vp:VectorObject = new VectorObject(point);
		node.setContent(vp);
		return point;
	}

	function clearChildren()
	{
		for (child in mapNode.children)
			child.remove();
	}

	public override function repaint()
	{
		if (paintFlag) return;
		clearChildren();
		if(!eventsFlag) addHandlers();

		var currentZ:Int = Std.int(mapNode.window.getCurrentZ());
		scaleCurrent = Utils.getScale(currentZ);		// размер пиксела в метрах меркатора
		bgSprite.graphics.clear();

		var attr:Dynamic = clusterViewAttr.bgStyle.fill;
		bgSprite.graphics.beginFill(attr.color, attr.opacity/100);
		
		var attr:Dynamic = clusterViewAttr.bgStyle.outline;
		bgSprite.graphics.lineStyle(attr.thickness, attr.color, attr.opacity/100);
		
		var shift:Int = (clusterViewAttr.shift ? clusterViewAttr.shift : 10);
		bgSprite.graphics.drawCircle(centrGeometry.x, centrGeometry.y, (shift + clusterViewAttr.radius) * scaleCurrent);
		
		var rad:Float = clusterViewAttr.radius * scaleCurrent;
		var deltaAlpha:Float = 2*Math.PI/members.length;
		curGeos = new Array<Geometry>();
		for (i in 0...Std.int(members.length))
		{
			curGeos.push(addPoint(i, deltaAlpha, (rad - Math.random() * clusterViewAttr.delta * scaleCurrent)));
		}
		paintFlag = true;
	}

	private function findIntersect(x:Float, y:Float, arr:Array<Geometry>):Array<Geometry>
	{
		var halfLine = 10 * Math.abs(mapNode.window.scaleY) / 2;
		var out:Array<Geometry> = new Array<Geometry>();
		for (i in 0...Std.int(arr.length))
		{
			var geo:Geometry = arr[i];
			if (geo.extent.contains(x, y, halfLine)) {
				out.push(geo);
			}
		}
		return out;
	}

	public override function addHandlers()
	{
		var me = this;
		eventsFlag = true;
		bgSprite.addEventListener(MouseEvent.MOUSE_UP, function(event:MouseEvent)
		{
			Main.removeClusterPointsViewer(event);
			//event.stopPropagation();
		});
		contSprite.addEventListener(MouseEvent.ROLL_OUT, function(event:MouseEvent)
		{
			me.vlFilter.layer.lastGeometry = null;
			me.vlFilter.mapNode.callHandler("onMouseOut");
			Main.removeClusterPointsViewer(event);
			//event.stopPropagation();
		});
		
		contSprite.addEventListener(MouseEvent.MOUSE_MOVE, function(event:MouseEvent)
		{
			var items:Array<Geometry> = me.findIntersect(event.localX, event.localY, me.curGeos);
			if(items.length > 0) {
				me.vlFilter.layer.lastGeometry = items[0];
				me.vlFilter.mapNode.callHandler("onMouseOver");
			} else {
				me.vlFilter.layer.lastGeometry = null;
				me.vlFilter.mapNode.callHandler("onMouseOut");
			}
			//event.stopPropagation();
		});
		
		contSprite.addEventListener(MouseEvent.MOUSE_DOWN, function(event:MouseEvent)
		{
			var items:Array<Geometry> = me.findIntersect(event.localX, event.localY, me.curGeos);
			if(items.length > 0) {
				me.vlFilter.layer.lastGeometry = items[0];
				me.vlFilter.mapNode.callHandler("onClick");
			} else {
				me.vlFilter.layer.lastGeometry = null;
			}
			event.stopPropagation();
			//event.stopImmediatePropagation();
			Main.mousePressed = false;
		});
	
	}
}
