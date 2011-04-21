class ProjectiveMathTest
{
	static function main()
	{
		var x1 = Math.random();
		var y1 = Math.random();
		var x2 = Math.random();
		var y2 = Math.random();
		var x3 = Math.random();
		var y3 = Math.random();
		var x4 = Math.random();
		var y4 = Math.random();
		var x1_ = Math.random();
		var y1_ = Math.random();
		var x2_ = Math.random();
		var y2_ = Math.random();
		var x3_ = Math.random();
		var y3_ = Math.random();
		var x4_ = Math.random();
		var y4_ = Math.random();
		var mat = ProjectiveMath.buildMatrix(
			x1, y1, x2, y2, x3, y3, x4, y4, 
			x1_, y1_, x2_, y2_, x3_, y3_, x4_, y4_
		);
		var disparity = function(mat:Array<Array<Float>>, x:Float, y:Float, x_:Float, y_:Float):Float
		{
			var dx:Float = ProjectiveMath.getX(mat, x, y) - x_;
			var dy:Float = ProjectiveMath.getY(mat, x, y) - y_;
			return dx*dx + dy*dy;
		}
		trace(
			disparity(mat, x1, y1, x1_, y1_) + 
			disparity(mat, x2, y2, x2_, y2_) + 
			disparity(mat, x3, y3, x3_, y3_) + 
			disparity(mat, x4, y4, x4_, y4_)
		);

		var mat2 = ProjectiveMath.buildOneWayMatrix(x1, y1, x2, y2, x3, y3, x4, y4);
		trace(
			disparity(mat2, 0.0, 0.0, x1, y1) +
			disparity(mat2, 1.0, 0.0, x2, y2) +
			disparity(mat2, 1.0, 1.0, x3, y3) +
			disparity(mat2, 0.0, 1.0, x4, y4)
		);

		var mat3 = new Array<Array<Float>>();
		for (i in 0...3)
		{
			mat3[i] = new Array<Float>();
			for (j in 0...3)
				mat3[i][j] = Math.random();
		}

		trace(ProjectiveMath.multiplyMatrices(mat3, ProjectiveMath.invertMatrix(mat3)));		
	}
}