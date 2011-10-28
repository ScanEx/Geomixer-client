import flash.display.Loader;
import flash.display.Sprite;
import flash.display.BitmapData;
import flash.display.Graphics;
import flash.display.LineScaleMode;
import flash.net.URLRequest;
import flash.net.URLLoader;
import flash.xml.XML;
import flash.xml.XMLList;
import flash.xml.XMLNode;
import flash.utils.QName;
import flash.errors.Error;
import flash.geom.Matrix;
import flash.geom.Point;
import flash.geom.Rectangle;

class MarkerStyle
{
	public var imageUrl:String;
	public var size:Float;
	
	var marker:Dynamic;
	var minScale:Float;
	var maxScale:Float;
	var dx:Float;
	var dy:Float;
	var center:Bool;

	var replacementColor:UInt;
	var angleFunction:Hash<String>->Float;
	var scaleFunction:Hash<String>->Float;
	
	var origAngleExpr: String;
	var origScaleExpr: String;

	public var drawFunction:PointGeometry->Graphics->Float->Void;
	public var drawSWFFunction:PointGeometry->Sprite->Float->Void;

	static var DEFAULT_REPLACEMENT_COLOR:UInt = 0xff00ff;
	static var DEFAULT_SIZE:Float  = 0.0;
	static var DEFAULT_DX:Float    = 0.0;
	static var DEFAULT_DY:Float    = 0.0;
	static var DEFAULT_MINSCALE:Float    = 0.01;
	static var DEFAULT_MAXSCALE:Float    = 1000;
	static var DEFAULT_CENTER:Bool = false;
	static var svgCache:Hash<XML> = new Hash<XML>();

	public function new(marker_:Dynamic, parent:Style)
	{
		marker = marker_;
		imageUrl = Std.is(marker.image, String) ? marker.image : null;
		if (imageUrl == "")
			imageUrl = null;
		size = Std.is(marker.size, Float) ? marker.size : DEFAULT_SIZE;
		dx = Std.is(marker.dx, Float) ? marker.dx : DEFAULT_DX;
		dy = Std.is(marker.dy, Float) ? marker.dy : DEFAULT_DY;
		minScale = Std.is(marker.minScale, Float) ? marker.minScale : DEFAULT_MINSCALE;
		maxScale = Std.is(marker.maxScale, Float) ? marker.maxScale : DEFAULT_MAXSCALE;
		center = Std.is(marker.center, Bool) ? marker.center : DEFAULT_CENTER;

		replacementColor = Std.is(marker.color, UInt) ? marker.color : DEFAULT_REPLACEMENT_COLOR;
		angleFunction = Std.is(marker.angle, String) ? Parsers.parseExpression(marker.angle) : null;
		scaleFunction = Std.is(marker.scale, String) ? Parsers.parseExpression(marker.scale) : null;

		origAngleExpr = Std.is(marker.angle, String) ? marker.angle : null;
		origScaleExpr = Std.is(marker.scale, String) ? marker.scale : null;
	}

	public function load(onLoad:Void->Void)
	{
		var me = this;
		if (imageUrl == null)
			onLoad();
		else if (~/\.swf$/i.match(imageUrl))
		{
			Utils.loadCacheDisplayObject(imageUrl, function(hash:Dynamic)
			{
				if (hash == null || hash.loader == null) return;
				var ldr:Loader = hash.loader;
				var w = ldr.width;
				var h = ldr.height;
				me.drawSWFFunction = function(geom:PointGeometry, spr:Sprite, scaleY:Float)
				{
					var matrix:Matrix = me.getMatrix(geom, w, h, scaleY);
					ldr.transform.matrix = matrix;
					var ang	= (me.angleFunction != null ? me.angleFunction(geom.properties) : me.marker.angle);
					ldr.rotation = ang;
					var sc	= ldr.scaleX * (me.scaleFunction != null ? me.scaleFunction(geom.properties) : me.marker.scale);
					ldr.scaleX = ldr.scaleY = sc;
					ldr.mouseEnabled = false;
					ldr.mouseChildren = false;
					spr.addChild(ldr);
				}
				Main.refreshMap();		// Для обновления маркеров
				onLoad();
			});
		}
		else if (~/\.svg$/i.match(imageUrl))
		{
			var me = this;
			var onCacheReady = function()
			{
				var xml:XML = MarkerStyle.svgCache.get(me.imageUrl);
			
				var forEachElement = function(xml_:XML, tagName:Dynamic, func:XML->Void):Void
				{
					var qName:Dynamic = new QName(xml.namespace(), tagName);
					var list:XMLList = xml_.descendants(qName);
					for (i in 0...list.length())
						func(list[i]);
				}

				var getColor = function(xml_:XML, attributeName:String):Int
				{
					var color = Std.parseInt("0x" + xml_.attribute(attributeName).toString().substr(1));
					if (color == MarkerStyle.DEFAULT_REPLACEMENT_COLOR)
						color = me.replacementColor;
					return color;
				}

				var getPath = function(xml_:XML, attributeName:String):Array<Point>
				{
					var coords = Parsers.parseSVGPath(xml_.attribute(attributeName).toString());
					var ret = new Array<Point>();
					for (i in 0...Std.int(coords.length/2))
						ret.push(new Point(coords[i*2], coords[i*2 + 1]));
					return ret;
				}

				var drawPath = function(g:Graphics, mat:Matrix, path:Array<Point>)
				{
					var p = mat.transformPoint(path[0]);
					g.moveTo(p.x, p.y);
					for (i in 1...path.length)
					{
						p = mat.transformPoint(path[i]);
						g.lineTo(p.x, p.y);
					}
				}

				var memberFuncs = new Array<Graphics->Matrix->Void>();

				forEachElement(xml, "polygon", function(elem)
				{
					var color = getColor(elem, "fill");
					var path = getPath(elem, "points");
					if (path.length >= 3)
						memberFuncs.push(function(g:Graphics, mat:Matrix)
						{
							g.beginFill(color, 1.0);
							drawPath(g, mat, path);
							g.endFill();
						});
				});
				forEachElement(xml, "path", function(elem)
				{
					var color = getColor(elem, "stroke");
					var path = getPath(elem, "d");
					if (path.length >= 2)
						memberFuncs.push(function(g:Graphics, mat:Matrix)
						{
							g.lineStyle(1.0, color, 1.0, false, LineScaleMode.NONE);
							drawPath(g, mat, path);
							g.lineStyle(0.0, 0, 0.0);
						});
				});

				var width = Std.parseFloat(xml.attribute("width").toString());
				var height = Std.parseFloat(xml.attribute("height").toString());

				me.drawFunction = function(geom:PointGeometry, graphics:Graphics, scaleY:Float)
				{
					var matrix = me.getMatrix(geom, width, height, scaleY);
					for (func in memberFuncs)
						func(graphics, matrix);
				}
				onLoad();
			}

			if (svgCache.exists(imageUrl))
				onCacheReady();
			else
			{
				var loader:URLLoader = new URLLoader();
				loader.addEventListener(flash.events.Event.COMPLETE, function(event)
				{
					XML.ignoreWhitespace = true;
					MarkerStyle.svgCache.set(me.imageUrl, new XML(loader.data));
					onCacheReady();
				});
				loader.addEventListener(flash.events.IOErrorEvent.IO_ERROR, function(event)
				{
					onLoad();
				});
				try 
				{
					loader.load(new URLRequest(imageUrl));
				}
				catch (e:Error) 
				{
					trace("security error while loading " + imageUrl);
					onLoad();
				}
			}
		}
		else
		{
			Utils.loadBitmapData(imageUrl, function(oldBitmapData:BitmapData)
			{
				var bitmapData:BitmapData = null;
				if (oldBitmapData != null)
				{
					var w = oldBitmapData.width;
					var h = oldBitmapData.height;
					bitmapData = new BitmapData(w + 2, h + 2, true, 0);
					bitmapData.copyPixels(oldBitmapData, new Rectangle(0, 0, w, h), new Point(1, 1));
					if ((me.replacementColor != MarkerStyle.DEFAULT_REPLACEMENT_COLOR))
						for (i in 0...bitmapData.width)
							for (j in 0...bitmapData.height)
								if (bitmapData.getPixel(i, j) == MarkerStyle.DEFAULT_REPLACEMENT_COLOR)
									bitmapData.setPixel(i, j, me.replacementColor);
				}
				if (bitmapData != null)
				{
					var w = bitmapData.width;
					var h = bitmapData.height;
					me.drawFunction = function(geom:PointGeometry, graphics:Graphics, scaleY:Float)
					{
						var matrix = me.getMatrix(geom, bitmapData.width, bitmapData.height, scaleY);
						var p1 = matrix.transformPoint(new Point(0, 0));
						var p2 = matrix.transformPoint(new Point(w, 0));
						var p3 = matrix.transformPoint(new Point(w, h));
						var p4 = matrix.transformPoint(new Point(0, h));
						graphics.lineStyle(Math.NaN, 0, 0.0);
						graphics.beginBitmapFill(bitmapData, matrix, false);
						graphics.moveTo(p1.x, p1.y);
						graphics.lineTo(p2.x, p2.y);
						graphics.lineTo(p3.x, p3.y);
						graphics.lineTo(p4.x, p4.y);
						graphics.lineTo(p1.x, p1.y);
						graphics.endFill();
					}
					Main.refreshMap();		// Для обновления маркеров
				}
				onLoad();
			});
		}
	}

	public function getMatrix(geom:PointGeometry, width:Float, height:Float, scaleY:Float)
	{
		var scaleX = Math.abs(scaleY);
		var matrix = new Matrix();
		matrix.translate(
			center ? -width/2 : (dx - 1),
			center ? -height/2 : (dy - 1)
		);
		if (geom.properties != null) {
			if (angleFunction != null)
				matrix.rotate(angleFunction(geom.properties)*Math.PI/180.0);
			if (scaleFunction != null)
			{
				var s = scaleFunction(geom.properties);
				if (s < minScale) s = minScale;
				else if (s > maxScale) s = maxScale;
				matrix.scale(s, s);
			}			
		}
		matrix.concat(new Matrix(scaleX, 0, 0, scaleY, geom.x, geom.y));
		matrix.tx -= matrix.tx%scaleX;
		matrix.ty -= matrix.ty%scaleY;
		return matrix;
	}
	
	public function getStyle(removeDefaults: Bool)
	{
		var res: Dynamic = {};
		
		if ( !removeDefaults || size != DEFAULT_SIZE) res.size = size;
		if ( !removeDefaults || dx != DEFAULT_DX) res.dx = dx;
		if ( !removeDefaults || dy != DEFAULT_DY) res.dy = dy;
		if ( !removeDefaults || replacementColor != DEFAULT_REPLACEMENT_COLOR) res.color = replacementColor;
		
		if (imageUrl != null) res.image = imageUrl;
		if (origAngleExpr != null) res.angle = origAngleExpr;
		if (origScaleExpr != null) res.scale = origScaleExpr;
		
		return res;
	}
}