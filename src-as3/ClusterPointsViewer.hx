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
	private var bgSprite:Sprite;						// 
	private var eventsFlag:Bool;						// флаг установки событий
	private var paintFlag:Bool;							// флаг отрисовки
	private var clusterViewAttr:Dynamic;				// Атрибуты отображения членов кластера 
	private	var scaleCurrent:Float;						// текущий scale
	
	public function new(vlf_:VectorLayerFilter)
	{
		vlFilter = vlf_;
		eventsFlag = false;
		paintFlag = false;
		flush();
	}

	public override function createContentSprite()
	{
		bgSprite = Utils.addSprite(mapNode.vectorSprite);
		//bgSprite.mouseEnabled = false;
		mapNode.setStyle(vlFilter.regularStyleOrig, vlFilter.hoverStyleOrig);
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public function remove()
	{
		mapNode.remove();
	}
	
	public function flush()
	{
		centrGeometry = cast(vlFilter.layer.lastGeometry, PointGeometry);
		members = centrGeometry.propHiden.get('_members');
		
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
		node.setContent(new VectorObject(line));
		node.content.contentSprite.mouseEnabled = false;
		
		node = mapNode.addChild();
		var point:PointGeometry = new PointGeometry(xx, yy);
		node.properties = pt.properties;
		node.setContent(new VectorObject(point));
		return node.id;
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
		
		bgSprite.graphics.drawCircle(centrGeometry.x, centrGeometry.y, clusterViewAttr.radius * scaleCurrent);
		
		var rad:Float = clusterViewAttr.radius * scaleCurrent;
		var deltaAlpha:Float = 2*Math.PI/members.length;
		for (i in 0...Std.int(members.length))
		{
			addPoint(i, deltaAlpha, (rad - Math.random() * clusterViewAttr.delta * scaleCurrent));
		}
		paintFlag = true;
//trace('repaint xxxxxxxxxxxxxxxxxx ' + mapNode + ' : ' + contentSprite.numChildren);
		
	}

	public override function addHandlers()
	{
		var me = this;
		eventsFlag = true;
		bgSprite.addEventListener(MouseEvent.MOUSE_UP, function(event:MouseEvent)
		{
			Main.removeClusterPointsViewer(event);
			event.stopPropagation();
		});
		mapNode.vectorSprite.addEventListener(MouseEvent.ROLL_OUT, function(event:MouseEvent)
		{
			Main.removeClusterPointsViewer(event);
			event.stopPropagation();
		});
	}
}
