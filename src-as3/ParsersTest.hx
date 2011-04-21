class ParsersTest
{
	static function shouldParse(str:String)
	{
		if (Parsers.parseSQL(str) == null)
			trace("this should parse: \"" + str + "\"");
	}

	static function shouldNotParse(str:String)
	{
		if (Parsers.parseSQL(str) != null)
			trace("this should not parse: \"" + str + "\"");
	}

	static function toProperties(props:Dynamic)
	{
		var props_ = new Hash<String>();
		for (ff in Reflect.fields(props))
			props_.set(ff, Reflect.field(props, ff));
		return props_;
	}

	static function shouldYield(str:String, props:Dynamic, result:Bool)
	{
		var func = Parsers.parseSQL(str);
		if (func == null)
			trace("this should parse: \"" + str + "\"");
		else if (func(toProperties(props)) != result)
			trace("this should yield " + result + " : \"" + str + "\" on this: " + props);
	}

	static function shouldCompute(expr:String, props:Dynamic, result:Float)
	{
		var myResult = Parsers.parseExpression(expr)(toProperties(props));
		if (Math.abs(myResult - result) > 0.0001)
			trace("\"" + expr + "\" computed " + myResult + " instead of " + result + " on this: " + props);
	}

	static function shouldParsePath(path:String, len:Int)
	{
		var len2 = Parsers.parseSVGPath(path).length;
		if (len2 != len)
			trace("this path: " + path + " has length " + len2 + " instead of " + len);
	}

	static function main()
	{
		shouldParse("aaa > 10 AND bbb < ''");
		shouldParse("\"aaa\" >= 10 AND bbb < ''");
		shouldNotParse("aaa >= 10 AND bbb >< ''");
		shouldParse("aaa >= 10 OR bbb <> ''");
		shouldParse("   ");
		shouldParse(" \"foo\" IN ( 1, 2 , 'bar' )");
		shouldNotParse(" foo INN ( 1, 2 , 'bar' )");
		shouldNotParse(" foo AND ( 1, 2 , 'bar' )");
		shouldParse(" foo in ( 1, -2.1 , 'bar' )");
		shouldNotParse(" foo in ( 1, - 2.1 , 'bar' )");
		shouldParse("NOT not (noT `aaa` > 10)");
		shouldNotParse("NOT knot (noT aaa > 10)");
		shouldNotParse("aaa");
		shouldNotParse("aaa = 'bbb");

		shouldYield("foo > 10", {foo: "11"}, true);
		shouldYield("foo > 10", {foo: "9"}, false);
		shouldYield("foo > '2005-05-10'", {foo: "2005-05-11"}, true);
		shouldYield("foo > '2005-05-10'", {foo: "2005-05-09"}, false);
		shouldYield("foo in (15, 20, 25)", {foo: "25"}, true);
		shouldYield("foo > 10 or bar < 15", {foo: "9", bar: "10"}, true);
		shouldYield("  \t", {foo: "9", bar: "10"}, true);
		shouldYield("a LIKE '%b'", {a: "ab"}, true);
		shouldYield("a LIKE '%b'", {a: "bc"}, false);
		shouldYield("a LIKE '%foo%'", {a: "wufoo"}, true);
		shouldYield("a LIKE 'foo%'", {a: "wufoo"}, false);
		shouldYield("a LIKE '%'", {a: ""}, true);
		shouldYield("a LIKE '%'", {a: "hahahahah"}, true);
		shouldYield("a LIKE '%d%'", {a: "hahahahah"}, false);
		shouldYield("a LIKE 'd'", {a: "d"}, true);

		shouldCompute("1.5", {}, 1.5);
		shouldCompute("[a]*2", {a: "3.0"}, 6.0);
		shouldCompute("3+[bc]", {bc: "-2"}, 1.0);
		shouldCompute("[ab]/-[cd]", {ab: "-2", cd:"3"}, 2.0/3.0);

		shouldParsePath("M5.892,2.403\n\r\n\tC16.704,0.125,22.16,5.947,32.436,2.465", 8);
	}
}