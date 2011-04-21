typedef Matrix3x3 = Array<Array<Float>>;

class ProjectiveMath
{
	public static function buildMatrix(
		x1:Float, 
		y1:Float, 
		x2:Float, 
		y2:Float, 
		x3:Float, 
		y3:Float, 
		x4:Float, 
		y4:Float,
		x1_:Float, 
		y1_:Float, 
		x2_:Float, 
		y2_:Float, 
		x3_:Float,
		y3_:Float,
		x4_:Float,
		y4_:Float
	):Matrix3x3
	{
		return multiplyMatrices(
			buildOneWayMatrix(x1_, y1_, x2_, y2_, x3_, y3_, x4_, y4_),
			invertMatrix(buildOneWayMatrix(x1, y1, x2, y2, x3, y3, x4, y4))
		);
	}

	public static function getX(mat:Matrix3x3, x:Float, y:Float)
	{
		return applyLine(mat[0], x, y)/applyLine(mat[2], x, y);
	}

	public static function getY(mat:Matrix3x3, x:Float, y:Float)
	{
		return applyLine(mat[1], x, y)/applyLine(mat[2], x, y);
	}

	public static function buildOneWayMatrix(
		x1:Float, 
		y1:Float, 
		x2:Float, 
		y2:Float, 
		x3:Float, 
		y3:Float, 
		x4:Float, 
		y4:Float
	):Matrix3x3
	{
		var directThreePoints:Matrix3x3 = [
			[x2 - x1, x4 - x1, x1], 
			[y2 - y1, y4 - y1, y1],
			[0.0, 0.0, 1.0]
		];
		var inverseThreePoints:Matrix3x3 = invertMatrix(directThreePoints);
		var tx:Float = getX(inverseThreePoints, x3, y3);
		var ty:Float = getY(inverseThreePoints, x3, y3);
		var a:Float = tx/(tx + ty - 1.0);
		var b:Float = ty/(tx + ty - 1.0);
		return multiplyMatrices(directThreePoints, [
			[a, 0.0, 0.0], 
			[0.0, b, 0.0], 
			[a - 1.0, b - 1.0, 1.0]
		]);
	}

	public static function invertMatrix(mat:Matrix3x3):Matrix3x3
	{
		var ret = new Array<Array<Float>>();
		for (i in 0...3)
		{
			ret[i] = new Array<Float>();
			for (j in 0...3)
			{
				var i1 = (i+1)%3;
				var j1 = (j+1)%3;
				var i2 = (i+2)%3;
				var j2 = (j+2)%3;
				ret[i][j] = mat[j1][i1]*mat[j2][i2] - mat[j2][i1]*mat[j1][i2];
			}
		}
		var det:Float = 1/(mat[0][0]*ret[0][0] + mat[1][0]*ret[0][1] + mat[2][0]*ret[0][2]);
		for (i in 0...3)
			for (j in 0...3)
				ret[i][j] *= det;
		return ret;
	}

	public static function applyLine(line:Array<Float>, x:Float, y:Float):Float
	{
		return line[0]*x + line[1]*y + line[2];
	}

	public static function multiplyMatrices(m1:Matrix3x3, m2:Matrix3x3):Matrix3x3
	{
		var m = new Array<Array<Float>>();
		for (i in 0...3)
		{
			m[i] = new Array<Float>();
			for (j in 0...3)
			{
				m[i][j] = 0;
				for (k in 0...3)
					m[i][j] += m1[i][k]*m2[k][j];
			}
		}
		return m;
	}
}