import flash.display.DisplayObject;
import flash.display.Sprite;
import flash.display.BitmapData;
import flash.geom.Matrix;

class RasterImage extends MaskedContent
{
	var url:String;
	var attr:Dynamic;
	var noCache:Bool;
	var added:Bool;
	var controlPointsSet:Bool;

	var x1:Float;
	var y1:Float;
	var x2:Float;
	var y2:Float;
	var x3:Float;
	var y3:Float;
	var x4:Float;
	var y4:Float;

	var tx1:Float;
	var ty1:Float;
	var tx2:Float;
	var ty2:Float;
	var tx3:Float;
	var ty3:Float;
	var tx4:Float;
	var ty4:Float;

	var matrix:Array<Array<Float>>;

	public function new(
		url_:String,
		x1_:Float, 
		y1_:Float, 
		x2_:Float, 
		y2_:Float, 
		x3_:Float, 
		y3_:Float, 
		x4_:Float, 
		y4_:Float,
		?attr_:Dynamic
	)
	{
		url = url_;
		added = false;
		controlPointsSet = false;
		x1 = x1_;
		y1 = y1_;
		x2 = x2_;
		y2 = y2_;
		x3 = x3_;
		y3 = y3_;
		x4 = x4_;
		y4 = y4_;
		attr = attr_;
		noCache = (attr != null && attr.noCache != null ? attr.noCache : false);
	}

	public function setControlPoints(
		tx1_:Float,
		ty1_:Float,
		tx2_:Float,
		ty2_:Float,
		tx3_:Float,
		ty3_:Float,
		tx4_:Float,
		ty4_:Float
	)
	{
		controlPointsSet = true;

		tx1 = tx1_;
		ty1 = ty1_;
		tx2 = tx2_;
		ty2 = ty2_;
		tx3 = tx3_;
		ty3 = ty3_;
		tx4 = tx4_;
		ty4 = ty4_;
	}

	function getX(tx:Float, ty:Float):Float
	{
		return ProjectiveMath.getX(matrix, tx, ty);
		//return x1*(1 - tx)*(1 - ty) + x2*tx*(1 - ty) + x3*tx*ty + x4*(1 - tx)*ty;
	}

	function getY(tx:Float, ty:Float):Float
	{
		return ProjectiveMath.getY(matrix, tx, ty);
		//return y1*(1 - tx)*(1 - ty) + y2*tx*(1 - ty) + y3*tx*ty + y4*(1 - tx)*ty;
	}

	public override function repaint()
	{
		super.repaint();

		if (!added)
		{
			added = true;
			var me = this;

			Utils.loadBitmapData(url, function(bitmapData:BitmapData)
			{
				var w = bitmapData.width;
				var h = bitmapData.height;
				if(me.attr != null) {
					if(me.attr.sx != null) {
						me.x4 = me.x1;
						me.x2 = me.x3 = Merc.x(Merc.from_x(me.x1) + w * me.attr.sx);
						me.y2 = me.y1;
						me.y3 = me.y4 = Merc.y(Merc.from_y(me.y1) + h * me.attr.sy);
					}
				}
				if (!me.controlPointsSet)
				{
					me.tx1 = 0.0;
					me.ty1 = 0.0;
					me.tx2 = w;
					me.ty2 = 0.0;
					me.tx3 = w;
					me.ty3 = h;
					me.tx4 = 0.0;
					me.ty4 = h;
				}

				me.matrix = ProjectiveMath.buildMatrix(
					me.tx1, me.ty1, me.tx2, me.ty2, me.tx3, me.ty3, me.tx4, me.ty4, 
					me.x1, me.y1, me.x2, me.y2, me.x3, me.y3, me.x4, me.y4
				);

				var distortedImage = new Sprite();
				me.contentSprite.addChild(distortedImage);
				var graphics = distortedImage.graphics;

				var drawTriangle = function(tx1, ty1, tx2, ty2, tx3, ty3)
				{
					var x1 = me.getX(tx1, ty1);
					var y1 = me.getY(tx1, ty1);
					var x2 = me.getX(tx2, ty2);
					var y2 = me.getY(tx2, ty2);
					var x3 = me.getX(tx3, ty3);
					var y3 = me.getY(tx3, ty3);

					var mat1 = new Matrix(x2 - x1, y2 - y1, x3 - x1, y3 - y1, x1, y1);
					var mat2 = new Matrix(tx2 - tx1, ty2 - ty1, tx3 - tx1, ty3 - ty1, tx1, ty1);
					mat2.invert();
					mat2.concat(mat1);

					graphics.beginBitmapFill(bitmapData, mat2);
					graphics.moveTo(x1, y1);
					graphics.lineTo(x2, y2);
					graphics.lineTo(x3, y3);
					graphics.lineTo(x1, y1);
					graphics.endFill();
				}

				var n = 4;
				for (i in 0...n)
				{
					for (j in 0...n)
					{
						var tx1 = w*i*1.0/n;
						var ty1 = h*j*1.0/n;
						var tx2 = w*(i + 1)*1.0/n;
						var ty2 = h*(j + 1)*1.0/n;
						drawTriangle(tx1, ty1, tx2, ty1, tx1, ty2);
						drawTriangle(tx2, ty2, tx2, ty1, tx1, ty2);
					}
				}
			}, noCache);
		}
	}
}