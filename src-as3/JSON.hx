class JSON {

	public static function stringify(v:Dynamic):String 
	{
		var e = new Encode(v);
		return e.getString();
	}

	public static function parse(v:String):Dynamic	
	{
		var d = new Decode(v);
		var v:Dynamic = d.getObject();
		return v;
	}
}

private class Encode 
{
	var jsonString:String;

	public function new(value:Dynamic ) {
		jsonString = convertToString( value );
	}

	public function getString():String {
		return jsonString;
	}

	function convertToString(value:Dynamic):String {

		if (Std.is(value,String)) {
			return escapeString(Std.string(value));

		} else if (Std.is(value,Float)) {
			return Math.isFinite(value) ? Std.string(value) : "null";

		} else if (Std.is(value,Bool)) {
			return value ? "true" : "false";

		} else if (Std.is(value,Array)) {
			return arrayToString(value);

		}  else if (Std.is(value,List)) {
   			return listToString(value);
		} else if (value != null && Reflect.isObject(value)) {
			return objectToString( value );

		}

		return "null";
	}

	function escapeString( str:String ):String {
		var s = new StringBuf();
		var ch:String;
		var i = 0;
		while ((ch = str.charAt( i )) != ""){
			switch ( ch ) {
				case '"':	// quotation mark
					s.add('\\"');
				case '\\':	// reverse solidus
					s.add("\\\\");
				case '\\b':	// backspace
					s.add("\\b");
				case '\\f':	// form feed
					s.add("\\f");
				case '\\n':	// newline
					s.add("\\n");
				case '\\r':	// carriage return
					s.add("\\r");
				case '\\t':	// horizontal tab
					s.add("\\t");
				default: // skipped encoding control chars here
					s.add(ch);
			}
			i++;
		}	// end for loop

		return "\"" + s.toString() + "\"";
	}

	function arrayToString( a:Array<Dynamic> ):String {

		var s = new StringBuf();

		var i:Int= 0;

		while(i < a.length) {

			s.add(convertToString( a[i] ));
			s.add(",");
			i++;
		}
		return "[" + s.toString().substr(0,-1) + "]";
	}

	function objectToString( o:Dynamic):String {
		var s = new StringBuf();
		if ( Reflect.isObject(o)) {
			if (Reflect.hasField(o,"__cache__")) {
				// TODO, probably needs revisiting
				// hack for spod object ....
				o = Reflect.field(o,"__cache__");
			}
			var value:Dynamic;
			var sortedFields = Reflect.fields(o);
			sortedFields.sort(function(k1, k2) { if (k1 == k2) return 0; if (k1 < k2) return -1; return 1;});
			for (key in sortedFields) {
				value = Reflect.field(o,key);

				if (Reflect.isFunction(value))
					continue;

				s.add(escapeString( key ) + ":" + convertToString( value ));
				s.add(",");
			}
		}  else {

			for(v in Reflect.fields(o)) {
				s.add(escapeString(v) + ":" + convertToString( Reflect.field(o,v) ));
				s.add(",");
			}
			var sortedFields = Reflect.fields(o);
			sortedFields.sort(function(k1, k2) { if (k1 == k2) return 0; if (k1 < k2) return -1; return 1;});

			for(v in sortedFields) {
				s.add(escapeString(v) + ":" + convertToString( Reflect.field(o,v)));
				s.add(",");
			}
		}
		return "{" + s.toString().substr(0,-1) + "}";
	}

	function listToString( l: List<Dynamic>) :  String {
		var s:StringBuf = new StringBuf();
		var i:Int= 0;

		for(v in l) {
		  s.add(convertToString( v ));
		  s.add(",");
		}

		return "[" + s.toString().substr(0,-1) + "]";
  	}
}

private class Decode {

	var at:Int;
    var ch:String;
	var text:String ;

	var parsedObj:Dynamic;

	public function new(t:String) {
		parsedObj = parse(t);
	}

	public function getObject():Dynamic {
		return parsedObj;
	}

    public function parse(text:String):Dynamic {
		try {
			at = 0 ;
			ch = '';
			this.text = text ;
			var v:Dynamic ;
			v = value();
			return v ;
		} catch (exc:Dynamic) {
		}
		return '{"err":"parse error"}';
	}

	function error(m):Void {
		throw {
			name: 'JSONError',
			message: m,
			at: at - 1,
			text: text
		};
	}

	function next() {
		ch = text.charAt(at);
		at += 1;
		if (ch == '') return ch = '0';
		return ch;
	}

	function white() {
		while (ch != null) {
			if (ch <= ' ') {
				next();
			} else if (ch == '/') {
				switch (next()) {
					case '/':
						while ((next() != null) && ch != '\n' && ch != '\r') {}
						break;
					case '*':
						next();
						while (true) {
							if (ch != null) {
								if (ch == '*') {
									if (next() == '/') {
										next();
										break;
									}
								} else {
									next();
								}
							} else {
								error("Unterminated comment");
							}
						}
						break;
					default:
						error("Syntax error");
				}
			} else {
				break;
			}
		}
	}

	function str():String {
		var i, s = '', t, u;
		var outer:Bool = false;

		if (ch == '"') {
			while (next() != null) {
				if (ch == '"') {
					next();
					return s;
				} else if (ch == '\\') {
					switch (next()) {


				/*	case 'b':
						s += "\\b";
						break;

					case 'f':
						s += '\f';
						break;
				*/
					case 'n':
						s += '\n';
					case 'r':
						s += '\r';
					case 't':
						s += '\t';
					case 'u':			// unicode
						u = 0;
						for (i in 0...4) {
							t = Std.parseInt(next());
							if (!Math.isFinite(t)) {
								outer = true;
								break;
							}
							u = u * 16 + t;
						}
						if(outer) {
							outer = false;
							break;
						}
						s += String.fromCharCode(u);
					default:
						s += ch;
					}
				} else {
					s += ch;
				}
			}
		} else {
			error("ok this should be a quote");
		}
		error("Bad string");
		return s;
	}

     function arr():Array<Dynamic> {
		var a = [];

		if (ch == '[') {
			next();
			white();
			if (ch == ']') {
				next();
				return a;
			}
			while (ch != null) {
				var v:Dynamic;
				v = value();
			    a.push(v);
				white();
				if (ch == ']') {
					next();
					return a;
				} else if (ch != ',') {
					break;
				}
				next();
				white();
			}
		}
		error("Bad array");
		return []; // never get here
	}

    function obj():Dynamic {
		var k;
		var o = {};

		if (ch == '{') {
			next();
			white();
			if (ch == '}') {
				next();
				return o;
			}
			while (ch != null) {
				k = str();
				white();
				if (ch != ':') {
					break;
				}
				next();
				var v:Dynamic;
				v = value();
				Reflect.setField(o,k,v);

				white();
				if (ch == '}') {
					next();
					return o;
				} else if (ch != ',') {
					break;
				}
				next();
				white();
			}
		}
		error("Bad object");
		return o;
	}

     function num():Float {
		var n = '';
		var v:Float;

		if (ch == '-') {
			n = '-';
			next();
		}
		while (ch >= '0' && ch <= '9') {
			n += ch;
			next();
		}
		if (ch == '.') {
			n += '.';
			next();
			while (ch >= '0' && ch <= '9') {
				n += ch;
				next();
			}
		}
		if (ch == 'e' || ch == 'E') {
			n += ch;
			next();
			if (ch == '-' || ch == '+') {
				n += ch;
				next();
			}
			while (ch >= '0' && ch <= '9') {
				n += ch;
				next();
			}
		}
		v = Std.parseFloat(n);
		if (!Math.isFinite(v)) {
			error("Bad number");
		}
		return v;
	}

     function word():Null<Bool> {
		switch (ch) {
			case 't':
				if (next() == 'r' && next() == 'u' &&
						next() == 'e') {
					next();
					return true;
				}
			case 'f':
				if (next() == 'a' && next() == 'l' &&
						next() == 's' && next() == 'e') {
					next();
					return false;
				}
			case 'n':
				if (next() == 'u' && next() == 'l' &&
						next() == 'l') {
					next();
					return null;
				}
		}
		error("Syntax error");
		return false; // never get here
	}

    function value():Dynamic {
		white();
		var v:Dynamic;
		switch (ch) {
			case '{':
				v = obj() ;
			case '[':
				v = arr();
			case '"':
				v = str();
			case '-':
				v = num();
			default:
				if (ch >= '0' && ch <= '9'){
					v = num();
				}else {
					v = word() ;
				}
		}
		return v;
	}

}

