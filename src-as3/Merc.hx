class Merc
{
	public static var r_major:Float = 6378137.000;
	public static var r_minor:Float = 6356752.3142;

	static function deg_rad(ang:Float):Float
	{
	   	return ang*(Math.PI/180.0);
	}

	static function deg_decimal(rad:Float):Float
	{ 
		return (rad/Math.PI)*180.0;
	}

	public static function x(lon:Float):Float
	{
	    return r_major*deg_rad(lon);
	}

	public static function from_x(x:Float):Float
	{
		return deg_decimal(x/r_major);
	}

	public static function y(lat:Float):Float 
	{
		return y_ex(lat, r_minor);
	}

	public static function y_sym(lat:Float):Float
	{
		return y_ex(lat, r_major);
	}

	public static function from_y(y:Float):Float
	{
		return from_y_ex(y, r_minor);
	}

	public static function from_y_sym(y:Float):Float
	{
		return from_y_ex(y, r_major);
	}

	public static function y_ex(lat:Float, r2:Float)
	{
		if (lat > 89.5)
			lat = 89.5;
		if (lat < -89.5)
			lat = -89.5;
		var temp = r2/r_major;
		var es = 1.0 - (temp*temp);
		var eccent = Math.sqrt(es);
		var phi = deg_rad(lat);
		var sinphi = Math.sin(phi);
		var con = eccent*sinphi;
		var com = 0.5*eccent;
		con = Math.pow(((1.0 - con)/(1.0 + con)), com);
		var ts = Math.tan(0.5*((Math.PI*0.5) - phi))/con;
		var y = -r_major*Math.log(ts);
		return y;
	}

	public static function from_y_ex(y:Float, r2:Float)
	{
		var temp = r2/r_major;
		var es = 1.0 - (temp*temp);
		var eccent = Math.sqrt(es);
		var ts = Math.exp(-y/r_major);
		var HALFPI = 1.5707963267948966;
		var eccnth, Phi, con, dphi;
		eccnth = 0.5*eccent;
		Phi = HALFPI - 2.0*Math.atan(ts);
		var N_ITER = 15;
		var TOL = 1e-7;
		var i = N_ITER;
		dphi = 0.1;
		while ((Math.abs(dphi) > TOL) && (--i > 0))
		{
			con = eccent*Math.sin(Phi);
			dphi = HALFPI - 2.0*Math.atan(ts*Math.pow((1.0 - con)/(1.0 + con), eccnth)) - Phi;
			Phi += dphi;
		}
		return deg_decimal(Phi);
	}

	public static function distVincenty(x1:Float, y1:Float, x2:Float, y2:Float):Float
	{
		var lon1 = from_x(x1), lat1 = from_y(y1);
		var lon2 = from_x(x2), lat2 = from_y(y2);
	
	  	var p1lon = deg_rad(lon1);
	  	var p1lat = deg_rad(lat1);
	  	var p2lon = deg_rad(lon2);
	  	var p2lat = deg_rad(lat2);
	
	  	var a = 6378137, b = 6356752.3142, f = 1/298.257223563;  // WGS-84 ellipsiod
	  	var L = p2lon - p1lon;
	  	var U1 = Math.atan((1-f) * Math.tan(p1lat));
	  	var U2 = Math.atan((1-f) * Math.tan(p2lat));
	  	var sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
	  	var sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);
  
	  	var lambda = L, lambdaP = 2*Math.PI;
	  	var iterLimit = 20;
		var cosSqAlpha = 0.0;
		var sinSigma = 0.0;
		var cos2SigmaM = 0.0;
		var cosSigma = 0.0;
		var sigma = 0.0;
	  	while (Math.abs(lambda-lambdaP) > 1e-12 && --iterLimit>0) 
		{
			var sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
			sinSigma = Math.sqrt((cosU2*sinLambda) * (cosU2*sinLambda) + 
				(cosU1*sinU2-sinU1*cosU2*cosLambda) * (cosU1*sinU2-sinU1*cosU2*cosLambda));
	    		if (sinSigma==0) return 0;
	    		cosSigma = sinU1*sinU2 + cosU1*cosU2*cosLambda;
	    		sigma = Math.atan2(sinSigma, cosSigma);
	    		var sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
	    		cosSqAlpha = 1.0 - sinAlpha*sinAlpha;
	    		cos2SigmaM = cosSigma - 2*sinU1*sinU2/cosSqAlpha;
	    		if (Math.isNaN(cos2SigmaM)) cos2SigmaM = 0;
	    		var C = f/16*cosSqAlpha*(4+f*(4-3*cosSqAlpha));
	    		lambdaP = lambda;
	    		lambda = L + (1-C) * f * sinAlpha *
	      			(sigma + C*sinSigma*(cos2SigmaM+C*cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)));
	  	}
	  	if (iterLimit == 0) 
			return Math.NaN;

	  	var uSq = cosSqAlpha*((a/b)*(a/b) - 1);
	  	var A = 1 + uSq/16384*(4096+uSq*(-768+uSq*(320-175*uSq)));
	  	var B = uSq/1024 * (256+uSq*(-128+uSq*(74-47*uSq)));
	  	var deltaSigma = B*sinSigma*(cos2SigmaM+B/4*(cosSigma*(-1+2*cos2SigmaM*cos2SigmaM)-
	    		B/6*cos2SigmaM*(-3+4*sinSigma*sinSigma)*(-3+4*cos2SigmaM*cos2SigmaM)));
	  	var s = b*A*(sigma-deltaSigma);

	  	return s;
	}
}