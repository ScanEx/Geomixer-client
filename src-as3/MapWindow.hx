import flash.display.Sprite;
import flash.display.Bitmap;
import flash.display.BitmapData;
import flash.events.Event;
//import flash.errors.Error;
import flash.geom.Matrix;
import flash.geom.Point;
import flash.geom.Rectangle;
import flash.text.TextField;
import flash.text.TextFormat;
import flash.text.TextFormatAlign;

class MapWindow
{
	public static var allWindows:Hash<MapWindow> = new Hash<MapWindow>();

	public var currentX:Float;
	public var currentY:Float;
	public var x1:Float;
	public var y1:Float;
	public var x2:Float;
	public var y2:Float;
	public var matrix:Matrix;
	public var scaleY:Float;
	public var visibleExtent:Extent;
	public var outerSprite:Sprite;
	public var innerSprite:Sprite;
	public var rootNode:MapNode;

	public var id:String;
	public var getCurrentZ:Void->Float;
	public var cacheBitmap:Bitmap;
	public var cacheBitmapData:BitmapData;
	public var labelsBitmap:Bitmap;
	public var labelsBitmapData:BitmapData;
	public var maskSprite:Sprite;
	public var backgroundColor:Int;
	public var labelTF:TextField;
	public var cacheRepaintNeeded:Bool;
	public var labelsRepaintNeeded:Bool;
	public var onUpdated:Bool;

	var oldPosition:String;

	public function new(sprite:Sprite, getCurrentZ_:Void->Float)
	{
		outerSprite = sprite;
		innerSprite = Utils.addSprite(sprite);
		innerSprite.name = 'innerSprite';
		rootNode = new MapNode(Utils.addSprite(innerSprite), Utils.addSprite(innerSprite), this, 'rootNode');
		visibleExtent = new Extent();
		scaleY = 1;
		onUpdated = true;

		getCurrentZ = getCurrentZ_;
		maskSprite = Utils.addSprite(outerSprite);
		innerSprite.mask = maskSprite;

		x1 = 0;
		y1 = 0;
		x2 = 0;
		y2 = 0;
		backgroundColor = 0xffffff;

		id = rootNode.id;
		allWindows.set(id, this);

		labelTF = new TextField();
		labelTF.width = 600;
		labelTF.height = 50;
		oldPosition = '';
	}

	function fillWindowArea(sprite:Sprite, color:Int)
	{
		var g = sprite.graphics;
		g.clear();
		g.beginFill(color, 100);
		g.moveTo(x1, y1);
		g.lineTo(x1, y2);
		g.lineTo(x2, y2);
		g.lineTo(x2, y1);
		g.lineTo(x1, y1);
		g.endFill();
	}

	public function resize(x1_:Float, y1_:Float, x2_:Float, y2_:Float)
	{
		if ((x1 == x1_) && (y1 == y1_) && (x2 == x2_) && (y2 == y2_))
			return;

		x1 = x1_;
		y1 = y1_;
		x2 = x2_;
		y2 = y2_;

		if (cacheBitmap != null)
		{
			if(cacheBitmap.parent != null) innerSprite.removeChild(cacheBitmap);
			cacheBitmapData.dispose();
		}
		if (labelsBitmap != null)
		{
			if(labelsBitmap.parent != null) innerSprite.removeChild(labelsBitmap);
			labelsBitmapData.dispose();
		}

		var w = Std.int(x2 - x1 + 1);
		var h = Std.int(y2 - y1 + 1);

		cacheBitmapData = new BitmapData(w, h);
		cacheBitmap = new Bitmap(cacheBitmapData);
		innerSprite.addChild(cacheBitmap);

		labelsBitmapData = new BitmapData(w, h, true, 0);
		labelsBitmap = new Bitmap(labelsBitmapData);
		innerSprite.addChild(labelsBitmap);

		fillWindowArea(maskSprite, 0xffffff);
		updateBackground();
		setCacheBitmapVisible(false);
	}

	public function setBackgroundColor(color)
	{
		backgroundColor = color;
		updateBackground();
	}

	public function updateBackground()
	{
		fillWindowArea(outerSprite, backgroundColor);
	}

	public function setCenter(x:Float, y:Float)
	{
		currentX = x;
		currentY = y;
		var z = getCurrentZ();
		var curZ:Int = Math.round(z);
		var position:String = curZ + '_' + Math.round(x) + '_' + Math.round(y);
		//if (oldPosition == position) return;	// Если позиция не изменилась выходим
		oldPosition = position;
		
		var c:Float = 1/Utils.getScale(z);
		var tx:Float = cast((x1 + x2)/2 - c*x);
		var ty:Float = cast((y1 + y2)/2 + c*y);
		matrix = new Matrix(c, 0, 0, -c, tx, ty);
		innerSprite.transform.matrix = matrix;
		var inv = matrix.clone();
		inv.invert();
		visibleExtent = new Extent();
		var p1 = inv.transformPoint(new Point(x1, y1));
		var p2 = inv.transformPoint(new Point(x2, y2));
		visibleExtent.update(p1.x, p1.y);
		visibleExtent.update(p2.x, p2.y);
		scaleY = inv.d;
		//if (curZ == z) {
			cacheRepaintNeeded = true;
			labelsRepaintNeeded = true;
		//}
	}

	public function setCacheBitmapVisible(flag:Bool)
	{
		if (cacheBitmap.visible != flag)
		{
			if (flag) {
				if (cacheBitmap.parent == null) {
						innerSprite.addChild(cacheBitmap);
						innerSprite.setChildIndex(labelsBitmap, innerSprite.numChildren - 1);
				}
				if(rootNode.vectorSprite.parent != null) rootNode.vectorSprite.parent.removeChild(rootNode.vectorSprite);
			}
			else {
				if(cacheBitmap.parent != null) innerSprite.removeChild(cacheBitmap);
				if (rootNode.vectorSprite.parent  == null) {
					innerSprite.addChild(rootNode.vectorSprite);
					innerSprite.setChildIndex(labelsBitmap, innerSprite.numChildren - 1);
				}
			}
			cacheBitmap.visible = flag;
			rootNode.vectorSprite.visible = !flag;
		}
	}

	public function repaintCacheBitmap()
	{
		if (cacheRepaintNeeded && !Main.mousePressed)
		//if (cacheRepaintNeeded)
		{
			var inv = matrix.clone();
			inv.invert();
			cacheBitmap.transform.matrix = inv;
			var topLeft = inv.transformPoint(new Point(x1, y1));
			cacheBitmap.x = topLeft.x;
			cacheBitmap.y = topLeft.y;
			cacheBitmapData.fillRect(new Rectangle(0, 0, cacheBitmapData.width, cacheBitmapData.height), backgroundColor);
			var mat2 = matrix.clone();
			mat2.tx -= x1;
			mat2.ty -= y1;
			cacheBitmapData.draw(rootNode.vectorSprite, mat2);
			cacheRepaintNeeded = false;
		}
	}

	public function repaintLabels()
	{
		if (Main.mousePressed) return;
		if (labelsRepaintNeeded)
		{
			var inv = matrix.clone();
			inv.invert();
			labelsBitmap.transform.matrix = inv;
			labelsBitmapData.fillRect(new Rectangle(0, 0, labelsBitmapData.width, labelsBitmapData.height), 0x00000000);
			rootNode.repaintLabelsRecursively();
			labelsRepaintNeeded = false;
		}
	}

	public function paintLabel(labelText:String, geometry:Geometry, style:Style, ?xshift:Float)
	{
		if (Main.mousePressed) return;
		if ((labelText == null) || (labelText == ""))
			return;
		if (xshift == null) xshift = 0;
		var extent = geometry.extent;
		var label = style.label;
		var approxTextWidth = label.size*labelText.length*0.6;
		var geoTextWidth = approxTextWidth*Math.abs(scaleY)/2;
		if (
			(extent.maxx >= visibleExtent.minx - geoTextWidth) 
			&& 
			(extent.maxy >= visibleExtent.miny - geoTextWidth) 
			&& 
			(extent.minx <= visibleExtent.maxx + geoTextWidth) 
			&& 
			(extent.miny <= visibleExtent.maxy + geoTextWidth)
		)
		{
			var me = this;
			var fmt = new TextFormat("Arial", label.size, label.color);
			var filters = (label.haloColor != -1) ? [new flash.filters.GlowFilter(label.haloColor, 100, 3, 3, 5)] : [];

			var haveLines = geometry.forEachLine(function(line:LineGeometry)
			{
				var tf:TextField = new TextField();
				tf.width = 600;
				tf.height = 50;
				tf.text = labelText;
				tf.setTextFormat(fmt);

				var scale = Math.abs(me.scaleY);
				var lineLength = line.getRawLength();
				var textLength = tf.textWidth*scale;
				if (lineLength < textLength)
					return;

				var positions = new Array<Float>();
				if (label.spacing == -1)
					positions.push(lineLength/2);
				else
				{
					var spacing = label.spacing*scale;
					var nCopies = 1 + Math.floor((lineLength - textLength)/(textLength + spacing));
					var offset = (lineLength - (nCopies*textLength + (nCopies - 1)*spacing))/2;
					for (i in 0...nCopies)
						positions.push(offset + i*(textLength + spacing) + textLength/2);
				}

				for (position in positions)
				{
					var chars = labelText.split('');
					var centerPoint = line.getPointAt(position);
					var offCenterPoint = line.getPointAt(position + 0.1);
					var direction = (offCenterPoint.x > centerPoint.x) ? 1 : -1;
					var startPosition = position - direction*textLength/2;
					var sprite = new Sprite();
					var boundsTestFailed = false;
					var points = new Array<Point>();
					var charWidths = new Array<Float>();
					var dy = tf.textHeight*2/3;
					for (i in 0...chars.length)
					{
						var rect:Rectangle = tf.getCharBoundaries(i);
						var dx = rect.width/2;
						var pt = me.matrix.transformPoint(line.getPointAt(startPosition + (rect.left + dx)*direction*scale));
	
						if (me.labelsBitmapData.hitTest(new Point(0, 0), 1, new Rectangle(pt.x - dx, pt.y - dy, 2*dx, 2*dy)))
						{
							boundsTestFailed = true;
							break;
						}
	
						var letterTF = new TextField();
						letterTF.embedFonts = true;
						letterTF.antiAliasType = flash.text.AntiAliasType.ADVANCED;
						letterTF.text = chars[i];
						letterTF.setTextFormat(fmt);
						points.push(pt);
						charWidths.push(dx);
						sprite.addChild(letterTF);
					}
					if (!boundsTestFailed)
					{
						sprite.filters = filters;
						var i = 0;
						var n = sprite.numChildren;
						for (i in 0...n)
						{
							var pt = points[i];
							var i1 = (i > 0) ? (i - 1) : 0;
							var i2 = (i < n - 1) ? (i + 1) : (n - 1);
							var p1:Point;
							var p2:Point;
							if (i1 != i2)
							{
								p1 = points[i1];
								p2 = points[i2];
							}
							else
							{
								p1 = centerPoint;
								p2 = offCenterPoint;
							}
							var angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
							var dx = charWidths[i];
							var si = Math.sin(angle);
							var co = Math.cos(angle);
							sprite.getChildAt(i).transform.matrix = 
								new Matrix(
									co, 
									si, 
									-si, 
									co, 
									pt.x - (co*dx - si*dy),
									pt.y - (si*dx + co*dy)
								);
						}
						me.labelsBitmapData.draw(sprite);
					}
					while (sprite.numChildren > 0)
						sprite.removeChildAt(sprite.numChildren - 1);
				}
			});
			if (haveLines)
				return;

			var isPoint = (extent.minx == extent.maxx) && (extent.miny == extent.maxy);
			var align:TextFormatAlign = 
				(label.align == "left") ? TextFormatAlign.LEFT :
				(label.align == "right") ? TextFormatAlign.RIGHT :
				(label.align == "center") ? TextFormatAlign.CENTER : 
				isPoint ? TextFormatAlign.LEFT :
				TextFormatAlign.CENTER;
			var markerDx = isPoint ? 5 : 1;
			var pt = matrix.transformPoint(new Point(
				(extent.minx + extent.maxx)/2 + xshift, 
				(extent.miny + extent.maxy)/2
			));
			var posX = pt.x;
			var posY = pt.y - label.size * 0.8;
			if (!labelsBitmapData.hitTest(
				new Point(0, 0), 
				1, 
				new Rectangle(
					(align == TextFormatAlign.LEFT) ? (pt.x + markerDx) :
						(align == TextFormatAlign.CENTER) ? (pt.x - approxTextWidth/2) :
						(pt.x - approxTextWidth - markerDx),
					posY, 
					approxTextWidth, 
					label.size*1.6
				)
			))
			{
				if (label.dy != 0) posY += label.dy;
				if (label.dx != 0) posX += label.dx;
				labelTF.embedFonts = true;
				labelTF.antiAliasType = flash.text.AntiAliasType.ADVANCED;
				labelTF.filters = filters;
				labelTF.text = labelText;
				fmt.align = align;
				labelTF.setTextFormat(fmt);
				labelTF.transform.matrix = new Matrix(
					1, 
					0, 
					0, 
					1,
					posX + (
						(align == TextFormatAlign.LEFT) ? markerDx : 
						(align == TextFormatAlign.CENTER) ? -300 : 
						(-600 - markerDx)
					), 
					posY
				);
				var sprite = new Sprite();
				sprite.addChild(labelTF);
				labelsBitmapData.draw(sprite);
				sprite.removeChildAt(0);
				return;
			}
		}
	}
}

class Arial extends flash.text.Font {}