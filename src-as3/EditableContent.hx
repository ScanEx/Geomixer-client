import flash.events.Event;
import flash.events.MouseEvent;
import flash.display.LineScaleMode;

class EditableContent extends MapContent
{
	public var type:String;
	public var coordinates:Array<Float>;
	public var pointsPainter:GeometryPainter;
	public var linesPainter:GeometryPainter;
	public var editIndex:Int;

	public function new()
	{
		coordinates = [];
		editIndex = -1;
		stopDrawing = function() {}
	}

	public override function createContentSprite()
	{
		return Utils.addSprite(mapNode.vectorSprite);
	}

	public var isDrawing:Bool;
	public var stopDrawing:Void->Void;

	public function getIntermediateLength():Float
	{
		var ret:Float = 0.0;
		for (i in 0...editIndex)
			ret += Merc.distVincenty(coordinates[2*i], coordinates[2*i + 1], coordinates[2*i + 2], coordinates[2*i + 3]);
		return ret;
	}

	public function getCurrentEdgeLength():Float
	{
		var i1 = editIndex;
		var i2 = editIndex + 1;
		if (i2*2 == coordinates.length)
			i2 = 0;
		return Merc.distVincenty(coordinates[2*i1], coordinates[2*i1 + 1], coordinates[2*i2], coordinates[2*i2 + 1]);
	}

	public function startDrawing(type:String)
	{
		var me = this;
		me.type = type;
		var root = flash.Lib.current;
		var indicator = Utils.addSprite(contentSprite);
		contentSprite.setChildIndex(indicator, 0);
		var pressTime = 0.0;
		Main.clickingDisabled = true;
		var listener1 = function(event:Event)
		{
			var len = me.coordinates.length;
			if (len > 0)
			{
				var x = me.contentSprite.mouseX;
				var y = me.contentSprite.mouseY;
				var g = indicator.graphics;

				g.clear();
				var outline = me.mapNode.getRegularStyle().outline;
				g.lineStyle(1, outline.color, outline.opacity, false, LineScaleMode.NONE);
				g.moveTo(me.coordinates[len - 2], me.coordinates[len - 1]);
				g.lineTo(x, y);

				if (me.type == "POLYGON")
				{
					g.lineStyle(0, 0, 0);
					g.beginFill(0xffffff, 0.3);
					g.moveTo(x, y);
					for (i in 0...Std.int(len/2))
						g.lineTo(me.coordinates[i*2], me.coordinates[i*2 + 1]);
					g.endFill();
				}
			}
			pressTime = 0.0;
		}
		var listener2 = function(event:Event)
		{
			pressTime = flash.Lib.getTimer();
		}
		var listener3 = function(event:Event)
		{
			var t = flash.Lib.getTimer();
			if (t < pressTime + 300)
			{
				me.coordinates.push(me.contentSprite.mouseX);
				me.coordinates.push(me.contentSprite.mouseY);
				me.rebuild();
			}
		}
		isDrawing = true;
		stopDrawing = function()
		{
			me.isDrawing = false;
			me.stopDrawing = function() {};
			root.removeEventListener(MouseEvent.MOUSE_MOVE, listener1);
			root.removeEventListener(MouseEvent.MOUSE_DOWN, listener2);
			root.removeEventListener(MouseEvent.MOUSE_UP, listener3);
			me.contentSprite.removeChild(indicator);
			Main.clickingDisabled = false;
			me.rebuild();
			me.mapNode.callHandler("onFinish");
		}
		root.addEventListener(MouseEvent.MOUSE_MOVE, listener1);
		root.addEventListener(MouseEvent.MOUSE_DOWN, listener2);
		root.addEventListener(MouseEvent.MOUSE_UP, listener3);
	}

	public function setGeometry(geometry:Geometry)
	{
		var isLine = Std.is(geometry, LineGeometry);
		type = (isLine ? "LINESTRING" : "POLYGON");
		if (isLine)
			coordinates = cast(geometry, LineGeometry).coordinates;
		else
			coordinates = cast(geometry, PolygonGeometry).coordinates[0];
		rebuild();
	}

	public function getGeometry():Geometry
	{
		var out:Geometry = null;
		if (type == "LINESTRING") {
			if(coordinates.length > 1) out = new LineGeometry(coordinates);
		}
		else if (type == "POLYGON")
		{
			var c = coordinates.copy();
			if(c.length > 1) {
				c.push(c[0]);
				c.push(c[1]);
				out = new PolygonGeometry([c]);
			}
		}
		return out;
	}

	public function rebuild()
	{
		var points = new MultiGeometry();
		var len = coordinates.length;
		for (i in 0...Std.int(len/2))
			points.addMember(new PointGeometry(coordinates[i*2], coordinates[i*2 + 1]));
		pointsPainter.geometry = points;
		var lines = new MultiGeometry();
		lines.addMember(new LineGeometry(coordinates));
		if ((type == "POLYGON") && (len > 4) && !isDrawing)
			lines.addMember(new LineGeometry([
				coordinates[0], 
				coordinates[1], 
				coordinates[len - 2], 
				coordinates[len - 1]
			]));
		linesPainter.geometry = lines;
		repaint();
		mapNode.callHandler("onEdit");
	}
	
	function chkPositionX(geom:Geometry)
	{
		var dx:Float = 0;
		var x:Float = mapNode.window.currentX;
		var x1:Float = geom.extent.maxx - x;
		var x2:Float = geom.extent.minx - x;
		var ww = 2 * Utils.worldWidth;
		var minx:Float = Math.min(Math.abs(x1), Math.abs(x2));
		var m1:Float = Math.min(Math.abs(x1 - ww), Math.abs(x2 - ww));
		if (m1 < minx) { minx = m1; dx = -ww; }
		m1 = Math.min(Math.abs(x1 + ww), Math.abs(x2 + ww));
		if (m1 < minx) { minx = m1; dx = ww; }
		var pos:Int = cast(dx);
		if(contentSprite.x != pos) contentSprite.x = pos;
	}

	public override function repaint()
	{
		pointsPainter.repaint(mapNode.getRegularStyle());
		linesPainter.repaint(mapNode.getRegularStyle());
		chkPositionX(linesPainter.geometry);
	}

	public override function addHandlers()
	{
		linesPainter = new GeometryPainter(null, Utils.addSprite(contentSprite), mapNode.window);
		pointsPainter = new GeometryPainter(null, Utils.addSprite(contentSprite), mapNode.window);
		var hoverLinesPainter = new GeometryPainter(null, Utils.addSprite(contentSprite), mapNode.window);
		hoverLinesPainter.sprite.mouseEnabled = false;
		var hoverPointsPainter = new GeometryPainter(null, Utils.addSprite(contentSprite), mapNode.window);
		hoverPointsPainter.sprite.mouseEnabled = false;
		var me = this;
		var pressTime = 0.0;
		var clearHoverPainters = function()
		{
			hoverPointsPainter.geometry = null;
			hoverPointsPainter.repaint(null);
			hoverLinesPainter.geometry = null;
			hoverLinesPainter.repaint(null);
		}
		var calculateEditIndex = function()
		{
			var d = 1e+17;
			var mx = me.contentSprite.mouseX;
			var my = me.contentSprite.mouseY;

			for (i in 0...Std.int(me.coordinates.length/2))
			{
				var x = me.coordinates[i*2];
				var y = me.coordinates[i*2 + 1];
				var d2 = (x - mx)*(x - mx) + (y - my)*(y - my);
				if (d2 < d)
				{
					d = d2;
					me.editIndex = i;
				}
			}
		}

		pointsPainter.sprite.addEventListener(MouseEvent.MOUSE_OVER, function(event:Event)
		{
			if (Main.draggingDisabled)
				return;

			event.stopPropagation();
			calculateEditIndex();
			hoverPointsPainter.geometry = new PointGeometry(
				me.coordinates[me.editIndex*2], 
				me.coordinates[me.editIndex*2 + 1]
			);
			hoverPointsPainter.repaint(me.mapNode.getHoveredStyle());
			me.mapNode.callHandler("onNodeMouseOver");
		});
		pointsPainter.sprite.addEventListener(MouseEvent.MOUSE_OUT, function(event:Event)
		{
			event.stopPropagation();
			clearHoverPainters();
			me.mapNode.callHandler("onNodeMouseOut");
		});
		pointsPainter.sprite.addEventListener(MouseEvent.MOUSE_DOWN, function(event:Event)
		{
			event.stopPropagation();
			calculateEditIndex();

			var needReturn = false;
			if (me.isDrawing)
			{
				if (me.editIndex == 0)
				{
					me.type = "POLYGON";
					me.stopDrawing();
					needReturn = true;
				}
				else if (me.editIndex == Std.int(me.coordinates.length/2) - 1)
				{
					me.stopDrawing();
					needReturn = true;
				}
			}

			var t = flash.Lib.getTimer();
			if ((t - pressTime) < 300)
			{
				me.coordinates.splice(2*me.editIndex, 2);
				if (me.coordinates.length == 0)
					me.mapNode.callHandler("onRemove");
				else
					me.rebuild();
				clearHoverPainters();
				return;
			}
			pressTime = t;

			if (needReturn)
				return;

			Main.draggingDisabled = true;
			var root = flash.Lib.current;
			var listener1 = function(event:Event)
			{
				var x = me.contentSprite.mouseX;
				var y = me.contentSprite.mouseY;
				hoverPointsPainter.geometry = new PointGeometry(x, y);
				hoverPointsPainter.repaint(me.mapNode.getHoveredStyle());
				me.coordinates[2*me.editIndex] = x;
				me.coordinates[2*me.editIndex + 1] = y;
				me.rebuild();
				me.mapNode.callHandler("onNodeMouseOver");
			}
			var listener2:Event->Void = null;
			listener2 = function(event:Event)
			{
				root.removeEventListener(MouseEvent.MOUSE_MOVE, listener1);
				root.removeEventListener(MouseEvent.MOUSE_UP, listener2);
				Main.draggingDisabled = false;

				var t2 = flash.Lib.getTimer();
				if ((t2 - pressTime < 300) && !me.isDrawing && (me.type == "LINESTRING"))
				{
					if (me.editIndex == Std.int(me.coordinates.length/2) - 1)
						me.startDrawing("LINESTRING");
					else if (me.editIndex == 0)
					{
						var c = new Array<Float>();
						var len = Std.int(me.coordinates.length/2);
						for (i in 0...len)
						{
							var jj = 2*(len - i - 1);
							c.push(me.coordinates[jj]);
							c.push(me.coordinates[jj + 1]);
						}
						me.coordinates = c;
						me.rebuild();
						me.startDrawing("LINESTRING");
					}
				}
			}
			root.addEventListener(MouseEvent.MOUSE_MOVE, listener1);
			root.addEventListener(MouseEvent.MOUSE_UP, listener2);
		});

		linesPainter.sprite.addEventListener(MouseEvent.MOUSE_OVER, function(event:Event)
		{
			if (Main.draggingDisabled)
				return;

			var x = me.contentSprite.mouseX;
			var y = me.contentSprite.mouseY;
			var d = 1e+17;
			var len = me.coordinates.length;
			for (i in 0...Std.int(len/2))
			{
				var ii = i*2;
				var jj = ii + 2;
				if (jj == len)
					jj = 0;
				var x1 = me.coordinates[ii] - x;
				var y1 = me.coordinates[ii + 1] - y;
				var x2 = me.coordinates[jj] - x;
				var y2 = me.coordinates[jj + 1] - y;
				var dx = x2 - x1;
				var dy = y2 - y1;
				var d_ = dx*dx + dy*dy;
				var t1 = -(x1*dx + y1*dy);
				var d2:Float;
				if ((d_ > 0) && (t1 >= 0) && (t1 <= d_))
				{
					var t2 = -x1*dy + y1*dx;
					d2 = t2*t2/d_;
				}
				else
				{
					d2 = Math.min(x1*x1 + y1*y1, x2*x2 + y2*y2);
				}

				if (d2 < d)
				{
					d = d2;
					me.editIndex = i;
				}
			}
			var jj = me.editIndex*2 + 2;
			if (jj == len)
				jj = 0;

			var x1 = me.coordinates[me.editIndex*2];
			var y1 = me.coordinates[me.editIndex*2 + 1];
			var x2 = me.coordinates[jj];
			var y2 = me.coordinates[jj + 1];

			var pointSize = 5*Math.abs(me.mapNode.window.scaleY);
			var alpha = Math.atan2(y2 - y1, x2 - x1);

			x1 += pointSize*Math.cos(alpha);
			y1 += pointSize*Math.sin(alpha);
			x2 -= pointSize*Math.cos(alpha);
			y2 -= pointSize*Math.sin(alpha);

			hoverLinesPainter.geometry = new LineGeometry([x1, y1, x2, y2]);
			hoverLinesPainter.repaint(me.mapNode.getHoveredStyle());
			me.mapNode.callHandler("onEdgeMouseOver");
		});
		linesPainter.sprite.addEventListener(MouseEvent.MOUSE_OUT, function(event:Event)
		{
			clearHoverPainters();
			me.mapNode.callHandler("onEdgeMouseOut");
		});
		linesPainter.sprite.addEventListener(MouseEvent.MOUSE_DOWN, function(event:Event)
		{
			event.stopPropagation();
			me.coordinates.insert(me.editIndex*2 + 2, me.contentSprite.mouseX);
			me.coordinates.insert(me.editIndex*2 + 3, me.contentSprite.mouseY);
			me.rebuild();
			clearHoverPainters();
		});
	}
}