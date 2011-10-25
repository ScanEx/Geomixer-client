import flash.display.Sprite;
import flash.display.BitmapData;
import flash.geom.Matrix;
import flash.display.Shape;

class FillStyle
{
	public var color:Int;
	public var opacity:Float;
	public var imageUrl:String;
	public var bitmapData:BitmapData;
	public var pattern:Dynamic;

	public var colorFunction:Hash<String>->Float;
	var origColorExpr: String;

	public var opacityFunction:Hash<String>->Float;
	var origOpacityExpr: String;

	var patternCacheFlag: Bool;
	public var patternWidthFunction:Hash<String>->Float;
	public var patternStepFunction:Hash<String>->Float;
	public var patternColorsFunction:Array<Hash<String>->Float>;

	static var DEFAULT_COLOR:Int = 0;
	static var DEFAULT_OPACITY:Float = 1.0;
	static var MAX_PATTERN_SIZE:Int = 500000; // Максимальный размер создаваемого bitmap в пикселах

	static var MAX_PATTERN_WIDTH:Int = 1000;
	static var MIN_PATTERN_WIDTH:Int = 1;
	static var MAX_PATTERN_STEP:Int = 1000;
	static var MIN_PATTERN_STEP:Int = 0;
	static var bmdCache:Hash<BitmapData> = new Hash<BitmapData>();
	static var MAX_CACHE_ITEMS:Int = 20;
	static var cache_count:Int = 0;
	var patternKey: String;
	
	public function new(fill:Dynamic)
	{
		patternCacheFlag = true;

		colorFunction = null;
		if (Std.is(fill.color, String)) {
			colorFunction = Parsers.parseExpression(fill.color);
		}
		origColorExpr = Std.is(fill.color, String) ? fill.color : '';
		color = Std.is(fill.color, Int) ? fill.color : DEFAULT_COLOR;

		opacityFunction = null;
		if (Std.is(fill.opacity, String)) {
			opacityFunction = Parsers.parseExpression(fill.opacity);
		}
		origOpacityExpr = Std.is(fill.opacity, String) ? fill.opacity : '';
		opacity = Std.is(fill.opacity, Int) ? fill.opacity/100.0 : DEFAULT_OPACITY;
		
		imageUrl = Std.is(fill.image, String) ? fill.image : null;
		bitmapData = null;
		if (imageUrl == "")
			imageUrl = null;
			
		pattern = null;
		patternKey = '' + opacity;
		if (fill.pattern != null)
			pattern = fill.pattern;

		if (imageUrl == null && pattern != null) {
			patternKey += '_' + pattern.style;
			if (Std.is(pattern.width, String)) {
				patternWidthFunction = Parsers.parseExpression(pattern.width);
				patternCacheFlag = false;
			}
			patternKey += '_' + pattern.width;
			if (Std.is(pattern.step, String)) {
				patternStepFunction = Parsers.parseExpression(pattern.step);
				patternCacheFlag = false;
			}
			patternKey += '_' + pattern.step;
			
			patternColorsFunction = new Array<Hash<String>->Float>();
			var arr:Array<Dynamic> = cast(pattern.colors);
			var count:Int = Std.int(arr.length);
			for (i in 0...count) {
				var func:Hash<String>->Float = null;
				if (Std.is(arr[i], String)) {
					func = Parsers.parseExpression(cast(arr[i]));
					patternCacheFlag = false;
				}
				patternColorsFunction.push(func);
			}
			patternKey += '_' + arr.join('_');
		}
	}

	public function getBitmapData(?prop:Hash<String>, ?propHiden:Hash<Dynamic>):BitmapData
	{
		if (bitmapData != null) {
			return bitmapData;
		}
		var curKey:String = patternKey;
		if (propHiden != null && propHiden.exists('_patternKey')) {
			curKey = propHiden.get('_patternKey');
		}
		if (bmdCache.exists(curKey)) {
			return bmdCache.get(curKey);
		}
		var arr:Array<Int> = cast(pattern.colors);
		var count:Int = Std.int(arr.length);

		var step:Int = (pattern.step > 0 ? pattern.step : 0);		// шаг между линиями
		if (patternStepFunction != null && prop != null) {
			step = cast(patternStepFunction(prop));
		}
		if (step > MAX_PATTERN_STEP) step = MAX_PATTERN_STEP;
		else if (step < MIN_PATTERN_STEP) step = MIN_PATTERN_STEP;
		
		var size:Int = (pattern.width > 0 ? pattern.width : 8);		// толщина линий
		if (patternWidthFunction != null && prop != null) {
			size = cast(patternWidthFunction(prop));
		}
		if (size > MAX_PATTERN_WIDTH) size = MAX_PATTERN_WIDTH;
		else if (size < MIN_PATTERN_WIDTH) size = MIN_PATTERN_WIDTH;

		var op:Float = opacity;
		if (opacityFunction != null && prop != null) {
			op = cast(opacityFunction(prop)) / 100;
		}
		curKey = '' + op;
		curKey += '_' + pattern.style;
		curKey += '_' + size;
		curKey += '_' + step;

		var allSize:Int = (size + step) * count;
		var radius:Int = cast(size / 2);	// радиус

		var hh:Int = allSize;			// высота битмапа
		var ww:Int = 1;					// ширина битмапа
		if (pattern.style == 'diagonal1' || pattern.style == 'diagonal2' || pattern.style == 'cross' || pattern.style == 'cross1') {
			ww = hh = allSize;
		}
		else if (pattern.style == 'vertical') {
			ww = allSize;
			hh = 1;
		}
		else if (pattern.style == 'circle') {
			ww = hh = size;
		}
		if (ww * hh > MAX_PATTERN_SIZE) {
			//var mes:Dynamic<String> = cast { };
			//mes.from = 'FillStyle'; mes.pattern = pattern; mes.error = 'MAX_PATTERN_SIZE'; mes.message = 'Bitmap from pattern is too big';
			//Main.messBuffToJS.push( mes );
			return null;
		}

		var shape:Shape = new Shape();
		for (i in 0...count) {
			var ly:Int = i * (size + step);
			var x1:Int = 0; var y1:Int = ly; var x2:Int = ww; var y2:Int = ly;
			
			var col:Int = (patternColorsFunction[i] != null && prop != null ? cast(patternColorsFunction[i](prop)) : arr[i]);
			//col = (col < 0 ? 0 : (col > 0xFFFFFF ? 0xFFFFFF : col));
			curKey += '_' + col;
			shape.graphics.beginFill(col, op);

			if (pattern.style == 'circle') {
				if (i == 0)					shape.graphics.drawEllipse(-radius, -radius, size, size);
				if (i == 1 || count <= 1)	shape.graphics.drawEllipse(size - radius, -radius, size, size);
				if (i == 2 || count <= 2)	shape.graphics.drawEllipse(-radius, size - radius, size, size);
				if (i == 3 || count <= 3)	shape.graphics.drawEllipse(size - radius, size - radius, size, size);
				continue;
			} else if (pattern.style == 'diagonal1' || pattern.style == 'diagonal2' || pattern.style == 'cross' || pattern.style == 'cross1') {
				x1 = i * (size + step);
				shape.graphics.moveTo(x1, 0);
				shape.graphics.lineTo(x1 + size, 0);
				shape.graphics.lineTo(0, x1 + size);
				shape.graphics.lineTo(0, x1);
				shape.graphics.lineTo(x1, 0);
				
				x1 += count * (size + step);
				shape.graphics.moveTo(x1, 0);
				shape.graphics.lineTo(x1 + size, 0);
				shape.graphics.lineTo(0, x1 + size);
				shape.graphics.lineTo(0, x1);
				shape.graphics.lineTo(x1, 0);
			} else {
				shape.graphics.drawRect(x1, y1, ww, size);
			}

		}
		var bitmapRes:BitmapData = new BitmapData(ww, hh, true, 0);
		var matrix:Matrix = new Matrix();
		matrix.identity();
		if (pattern.style == 'vertical') {
			matrix.createBox(1, 1, Math.PI / 2, ww, 0);
		} else if (pattern.style == 'cross') {
			bitmapRes.draw(shape, matrix);
			matrix.createBox(1, 1, Math.PI/2, hh, 0);
		} else if (pattern.style == 'cross1') {
			matrix.createBox(1, 1, Math.PI/2, hh, 0);
			bitmapRes.draw(shape, matrix);
			matrix.identity();
		} else if (pattern.style == 'diagonal1' || pattern.style == 'diagonal2') {
			if (pattern.style == 'diagonal2') {
				matrix.createBox(1, 1, Math.PI/2, hh, -0);
			}
		}
		bitmapRes.draw(shape, matrix);
 		
		if (cache_count > MAX_CACHE_ITEMS) {
			bmdCache = new Hash<BitmapData>();
			cache_count = 0;
		}

		if (patternCacheFlag) {
			curKey = patternKey;
		} else {
			if (propHiden != null) propHiden.set('_patternKey', curKey);
		}
		bmdCache.set(curKey, bitmapRes);
		cache_count++;
		return bitmapRes;
	}

	public function getColor(prop:Hash<String>):Int
	{
		var out:Int = color;
		if (colorFunction != null && prop != null) {
			out = cast(colorFunction(prop));
		}
		return out;
	}
	
	public function getOpacity(prop:Hash<String>):Float
	{
		var out:Float = opacity;
		if (opacityFunction != null && prop != null) {
			out = cast(opacityFunction(prop))/100;
		}
		return out;
	}

	public function load(onLoad:Void->Void)
	{
		if (imageUrl == null)
			onLoad();
		else
		{
			var me = this;
			Utils.loadBitmapData(imageUrl, function(bitmapData:BitmapData)
			{
				me.bitmapData = bitmapData;
				onLoad();
			});
		}
	}

	public function getStyle(removeDefaults: Bool)
	{
		var res: Dynamic = {};
		if ( !removeDefaults || color != DEFAULT_COLOR) res.color = color;
		if (origColorExpr != null) res.color = origColorExpr;

		if ( !removeDefaults || opacity   != DEFAULT_OPACITY  ) res.opacity = Std.int(opacity*100);
		if (origOpacityExpr != null) res.opacity = origOpacityExpr;
		if ( imageUrl != null ) res.imageUrl = imageUrl;
		if ( pattern != null ) res.pattern = pattern;
		
		return res;
	}
}
