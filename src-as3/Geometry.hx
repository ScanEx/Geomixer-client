import flash.display.Sprite;
import flash.display.Graphics;
import flash.display.LineScaleMode;
import flash.display.CapsStyle;
import flash.display.JointStyle;

import flash.geom.Matrix;
import flash.display.BitmapData;
import flash.Vector;
import flash.display.GraphicsPath;
import flash.display.GraphicsSolidFill;
import flash.display.GraphicsBitmapFill;
import flash.display.GraphicsStroke;
import flash.display.IGraphicsData;

class Geometry
{
	public static var MAX_DISTANCE:Float = 1e20;
	public var extent:Extent;
	public var properties:Hash<String>;
	public var refreshFlag:Bool;
	public var oldZ:Float;

	public var myFill:Dynamic;
	public var myStroke:GraphicsStroke;
	public var myPath:GraphicsPath;
	public var myDrawing:Vector<IGraphicsData>;
	public var parent:Geometry;

	var graphData:Hash<GraphicsPath>;

	public static var emptyStroke:GraphicsStroke = new GraphicsStroke();
	
	public function new()
	{
		extent = new Extent();
		refreshFlag = true;
		
		parent = null;
		myFill = null;
		myStroke = null;
		myPath = new GraphicsPath(new Vector<Int>(), new Vector<Float>());		
		myDrawing = new Vector<IGraphicsData>();
		graphData = new Hash<GraphicsPath>();		
		emptyStroke.scaleMode = LineScaleMode.NONE;
	}

	public function paintWithExtent(sprite:Sprite, style:Style, window:MapWindow)
	{
		if (extent.overlaps(window.visibleExtent)) {
			paint(sprite, style, window);
		} else {
			refreshFlag = true;
		}
	}

	public function paint(sprite:Sprite, style:Style, window:MapWindow)
	{
	}

	public function distanceTo(x:Float, y:Float):Float
	{
		return MAX_DISTANCE;
	}

	public function export():Dynamic
	{
		return { type: "unknown" };
	}

	public static function setLineStyle(graphics:Graphics, outline:OutlineStyle)
	{
		if ((outline != null) && (outline.thickness > 0))
			graphics.lineStyle(outline.thickness, outline.color, outline.opacity, false, LineScaleMode.NONE);
		else
			graphics.lineStyle(Math.NaN, 0, 0.0);
	}

	public static function beginFill(graphics:Graphics, fill:FillStyle)
	{
		if (fill != null) {
			graphics.beginFill(fill.color, fill.opacity);
		}		
	}

	public function getLength():Float
	{
		return 0;
	}

	public function getArea():Float
	{
		return 0;
	}

	public function forEachLine(func:LineGeometry->Void):Bool
	{
		return false;
	}

	public function clearDrawing()
	{
		myDrawing = new Vector<IGraphicsData>();
	}
	public function clearPath()
	{
		myPath = new GraphicsPath(new Vector<Int>(), new Vector<Float>());
	}
	public function beginFillPath(fill:FillStyle)
	{
		if (fill != null) {
			myFill = new GraphicsSolidFill(fill.color, fill.opacity);
		}		
		//myDrawing.push(myFill);
		myPath = new GraphicsPath(new Vector<Int>(), new Vector<Float>());		
	}
	
	public function setStroke(outline:OutlineStyle)
	{
		myStroke = new GraphicsStroke(outline.thickness);
		myStroke.scaleMode = LineScaleMode.NONE;
		myStroke.fill = new GraphicsSolidFill(outline.color, outline.opacity);
	}
/*
	public function flushPath(?isOnEdge:Bool)
	{
		if (myPath.data.length > 0) {
			if(myFill != null) myDrawing.push(myFill);
			if(myStroke != null) {
				if (isOnEdge) {
					//myDrawing.push(Geometry.emptyStroke);
					myDrawing.push(myStroke);
				} else {
					myDrawing.push(myStroke);
				}
			}
			myDrawing.push(myPath);
		}
		clearPath();
	}
	
	public function beginBitmapFill(bitmapData:BitmapData, matrix:Matrix)
	{
		myFill = new GraphicsBitmapFill(bitmapData, matrix, false);
		myDrawing.push(myFill);
		myPath = new GraphicsPath(new Vector<Int>(), new Vector<Float>());		
	}
*/
}