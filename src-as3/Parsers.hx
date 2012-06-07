/* 
   Single-pass recursive descent PEG parser library:
      http://en.wikipedia.org/wiki/Parsing_expression_grammar
   Inspired by Chris Double's parser combinator library in JavaScript:
      http://www.bluishcoder.co.nz/2007/10/javascript-packrat-parser.html
*/


/* Helper class. */

class Pair<T1,T2>
{
	public var head:T1;
	public var tail:T2;
	public function new(head_:T1, tail_:T2)
	{
		head = head_;
		tail = tail_;
	}
}


/* C-style linked list via recursive typedef. 
   Used purely functionally to get shareable sublists. */

typedef LinkedList = Pair<Dynamic, LinkedList>;

/* Parser state contains position in string and some accumulated data. */

typedef ParserState = Pair<Int, LinkedList>;

/* Parser accepts string and state, returns another state. */

typedef Parser = String->ParserState->ParserState;


class Parsers
{
	public static var parseSQL:String->(Hash<String>->Bool);
	public static var parseExpression:String->(Hash<String>->Float);
	public static var parseSVGPath:String->Array<Float>;

	public static var dummy:Void = (function()
	{
		/* A parser state that indicates failure. */

		var fail:ParserState = new ParserState(-1, null);

		/* Check for failure. */

		var failed = function(state:ParserState):Bool
		{
			return (state.head == -1);
		}

		/* Advance a parser state by n characters. */

		var advance = function(state:ParserState, n:Int):ParserState
		{
			return new ParserState(state.head + n, state.tail);
		}

		/* Match a specified string. */

		var token = function(tok:String):Parser
		{
			var len:Int = tok.length;
			return function(s:String, state:ParserState):ParserState
			{
				return (s.substr(state.head, len) == tok) ? advance(state, len) : fail;
			}
		}
	
		/* Match a string without regard to case. */

		var caseInsensitiveToken = function(tok:String):Parser
		{
			var len:Int = tok.length;
			tok = tok.toLowerCase();
			return function(s:String, state:ParserState):ParserState
			{
				return (s.substr(state.head, len).toLowerCase() == tok) ? advance(state, len) : fail;
			}
		}

		/* Match a single character in a specified range. */

		var range = function(startChar:String, endChar:String):Parser
		{
			var startCode:Int = startChar.charCodeAt(0);
			var endCode:Int = endChar.charCodeAt(0);
			return function(s:String, state:ParserState):ParserState
			{
				var code:Int = s.charCodeAt(state.head);
				return ((code >= startCode) && (code <= endCode)) ? advance(state, 1) : fail;
			}
		}

		/* Match any character outside a certain set.
		   This combinator is intended only for single character parsers. */

		var anythingExcept = function(parser:Parser):Parser
		{
			return function(s:String, state:ParserState):ParserState
			{
				return ((s.length > state.head) && failed(parser(s, state))) ? advance(state, 1) : fail;
			}
		}

		/* Match thing1, then thing2, ..., then thingN.*/

		var sequence = function(parsers:Array<Parser>):Parser
		{
			return function(s:String, state:ParserState):ParserState
			{
				for (parser in parsers)
				{
					state = parser(s, state);
					if (failed(state))
						return fail;
				}
				return state;
			}
		}

		/* Match thing1, or thing2, ..., or thingN. */

		var choice = function(parsers:Array<Parser>):Parser
		{
			return function(s:String, state:ParserState):ParserState
			{
				for (parser in parsers)
				{
					var newState:ParserState = parser(s, state);
					if (!failed(newState))
						return newState;
				}
				return fail;
			}
		}

		/* Match immediately, without regard to what's in the string. */ 

		var nothing = function(s:String, state:ParserState):ParserState 
		{ 
			return state; 
		}

		/* Match this thing or nothing. */	

		var maybe = function(parser:Parser):Parser
		{
			return choice([parser, nothing]);
		}

		/* Match minCount or more repetitions of this thing. */	

		var repeat = function(minCount:Int, parser:Parser):Parser
		{
			return function(s:String, state:ParserState):ParserState
			{
				var count:Int = 0;
				while (true)
				{
					var newState:ParserState = parser(s, state);
					if (failed(newState))
						return (count >= minCount) ? state : fail;
					else
					{
						count += 1;
						state = newState;
					}
				}
				return fail;
			}
		}

		/* Match a list of minCount or more instances of thing1, separated by thing2. */

		var separatedList = function(minCount:Int, parser:Parser, separator:Parser):Parser
		{
			var parser1:Parser = sequence([parser, repeat(minCount - 1, sequence([separator, parser]))]);
			return (minCount > 0) ? parser1 : choice([parser1, nothing]);
		}

		/* Match all whitespace at the start of the string. */ 

		var whitespace = repeat(0, choice([
			token(" "),
			token("\t"),
			token("\n")
		]));

		/* Same as separatedList, but can have whitespace between items and separators. */

		var whitespaceSeparatedList = function(minCount:Int, parser:Parser, separator:Parser):Parser
		{
			return separatedList(minCount, parser, sequence([whitespace, separator, whitespace]));
		}

		/* Same as sequence, but can have whitespace between items. */

		var whitespaceSeparatedSequence = function(parsers:Array<Parser>):Parser
		{
			var newParsers:Array<Parser> = new Array<Parser>();
			for (parser in parsers)
			{
				if (newParsers.length > 0)
					newParsers.push(whitespace);
				newParsers.push(parser);
			}
			return sequence(newParsers);
		}

		/* This combinator captures the string that the parser matched
		   and adds it to the current parser state, consing a new state. */

		var capture = function(parser:Parser):Parser
		{
			return function(s:String, state:ParserState):ParserState
			{
				var newState:ParserState = parser(s, state);
				return failed(newState) ? fail : new ParserState(newState.head, new LinkedList(s.substr(state.head, newState.head - state.head), newState.tail));
			}
		}

		/* This combinator passes the accumulated parser state to a given 
		   function for processing. The result goes into the new state. */

		var action = function(parser:Parser, func:LinkedList->Dynamic):Parser
		{
			return function(s:String, state:ParserState):ParserState
			{
				var oldState:ParserState = state;
				var newState:ParserState = parser(s, new ParserState(oldState.head, null));
				return failed(newState) ? fail : new ParserState(newState.head, new LinkedList(func(newState.tail), oldState.tail));
			}
		}

		/* Define a syntactic subset of SQL WHERE clauses. */

		var fieldName:Parser = capture(repeat(1, choice([
			range("a", "z"),
			range("A", "Z"),
			range("а", "я"),
			range("А", "Я"),
			range("0", "9"),
			token("_")
		])));

		var fieldNameWithSpaces:Parser = capture(repeat(1, choice([
			range("a", "z"),
			range("A", "Z"),
			range("а", "я"),
			range("А", "Я"),
			range("0", "9"),
			token("_"),
			token(" ")
		])));

		var quotedFieldName:Parser = choice([
			fieldName,
			sequence([token('"'), fieldNameWithSpaces, token('"')]),
			sequence([token('`'), fieldNameWithSpaces, token('`')])
		]);

		var stringLiteral:Parser = sequence([
			token("'"),
			capture(repeat(0, anythingExcept(token("'")))),
			token("'")
		]);

		var digits:Parser = repeat(1, range("0", "9"));

		var numberLiteral:Parser = capture(sequence([
			maybe(token("-")),
			digits,
			maybe(sequence([token("."), digits]))
		]));

		var literal:Parser = choice([numberLiteral, stringLiteral]);

		var applyParser = function(s:String, parser:Parser):ParserState
		{
			return parser(s, new ParserState(0, null));
		}

		/* Order is important here: longer ops should be tried first. */

		var opTerm:Parser = action(
			whitespaceSeparatedSequence([
				quotedFieldName,
				capture(choice([
					token("=="),
					token("!="),
					token("<>"),
					token("<="),
					token(">="),
					token("="),
					token("<"),
					token(">"),
					caseInsensitiveToken("LIKE")
				])),
				literal
			]),
			function(state:LinkedList):Dynamic
			{
				/* Linked list contains fieldname, operation, value
				   (in reverse order). */

				var fieldName:String = state.tail.tail.head;
				var op:String = state.tail.head;
				var referenceValue:String = state.head;

				var matchPattern:String->Bool = null;
				if (op.toUpperCase() == "LIKE")
				{
					matchPattern = function(fieldValue:String):Bool
					{
						var matchFrom:Int->Int->Bool = null;
						matchFrom = function(referenceIdx:Int, fieldIdx:Int):Bool
						{
							var referenceChar = referenceValue.charAt(referenceIdx);
							var fieldChar = fieldValue.charAt(fieldIdx);
							if (referenceChar == "")
								return (fieldChar == "");
							else if (referenceChar == "%")
								return matchFrom(referenceIdx + 1, fieldIdx) || ((fieldChar != "") && matchFrom(referenceIdx, fieldIdx + 1));
							else 
								return (referenceChar == fieldChar) && matchFrom(referenceIdx + 1, fieldIdx + 1);
						}
						return matchFrom(0, 0);
					}
				}

				return function(props:Hash<String>):Bool
				{
					var fieldValue:String = props.get(fieldName);
					if (fieldValue == null)
						return false;
					if (matchPattern != null)
						return matchPattern(fieldValue);
					else if ((op == "=") || (op == "=="))
						return (fieldValue == referenceValue);
					else if ((op == "!=") || (op == "<>"))
						return (fieldValue != referenceValue);
					else
					{
						if (applyParser(referenceValue, numberLiteral).head == referenceValue.length)
						{
							var f1:Float = Std.parseFloat(fieldValue);
							var f2:Float = Std.parseFloat(referenceValue);
							if (op == "<")
								return (f1 < f2);
							else if (op == ">")
								return (f1 > f2);
							else if (op == "<=")
								return (f1 <= f2);
							else if (op == ">=")
								return (f1 >= f2);
							else
								return false;
						}
						else
						{
							var f1 = fieldValue;
							var f2 = referenceValue;
							if (op == "<")
								return (f1 < f2);
							else if (op == ">")
								return (f1 > f2);
							else if (op == "<=")
								return (f1 <= f2);
							else if (op == ">=")
								return (f1 >= f2);
							else
								return false;
						}
					}
				}
			}
		);

		var inTerm:Parser = action(
			whitespaceSeparatedSequence([
				quotedFieldName,
				caseInsensitiveToken("IN"),
				token("("),
				whitespaceSeparatedList(0, literal, token(",")),
				token(")")
			]),
			function(state:LinkedList):Dynamic
			{
				/* Linked list contains fieldname and multiple values
				   (in reverse order). */

				var node:LinkedList = state;
				while (node.tail != null)
					node = node.tail;
				var fieldName:String = node.head;

				return function(props:Hash<String>):Bool
				{
					var value:String = props.get(fieldName);
					if (value == null)
						return false;
					var node:LinkedList = state;
					while (node.tail != null)
					{
						if (node.head == value)
							return true;
						node = node.tail;
					}
					return false;
				}
			}
		);

		/* Forward declarations to allow mutually recursive grammar definitions. */

		var term:Parser = null;
		term = function(s:String, state:ParserState):ParserState { return term(s, state); }
		var expression:Parser = null;
		expression = function(s:String, state:ParserState):ParserState { return expression(s, state); }

		var notTerm:Parser = action(
			whitespaceSeparatedSequence([caseInsensitiveToken("NOT"), term]),
			function(state:LinkedList):Dynamic
			{
				/* Linked list contains only processed inner term. */

				var innerTerm:Hash<String>->Bool = state.head;
				return function(props:Hash<String>):Bool
				{
					return !innerTerm(props);
				}
			}
		);

		term = choice([
			notTerm,
			opTerm,
			inTerm,
			whitespaceSeparatedSequence([token("("), expression, token(")")])
		]);

		/* AND and OR expressions must have at least 2 terms,
		   to disambiguate them from a single term. */

		var andExpression:Parser = action(
			whitespaceSeparatedList(2, term, caseInsensitiveToken("AND")),
			function(state:LinkedList):Dynamic
			{
				/* Linked list contains multiple processed inner terms
				   (in reverse order). */

				return function(props:Hash<String>):Bool
				{
					var flag:Bool = true;
					var node:LinkedList = state;
					while (node != null)
					{
						flag = flag && node.head(props);
						node = node.tail;
					}
					return flag;
				}
			}
		);

		var orExpression:Parser = action(
			whitespaceSeparatedList(2, term, caseInsensitiveToken("OR")),
			function(state:LinkedList):Dynamic
			{
				/* Linked list contains multiple processed inner terms
				   (in reverse order). */

				return function(props:Hash<String>):Bool
				{
					var flag:Bool = false;
					var node:LinkedList = state;
					while (node != null)
					{
						flag = flag || node.head(props);
						node = node.tail;
					}
					return flag;
				}
			}
		);

		/* Order is important here: term should be tried last, 
		   because andExpression and orExpression start with it. */

		expression = choice([
			andExpression, 
			orExpression,
			term
		]);

		var whereClause:Parser = sequence([whitespace, expression, whitespace]);

		Parsers.parseSQL = function(s:String):Hash<String>->Bool
		{
			var result:ParserState = applyParser(s, whereClause);
			if (result.head == s.length) 
				return result.tail.head;
			else
				return (applyParser(s, whitespace).head == s.length) ?
					function(props:Hash<String>):Bool { return true; } :
					null;
		}



		var additiveExpression:Parser = null;
		additiveExpression = function(s:String, state:ParserState):ParserState { return additiveExpression(s, state); }
		var multiplicativeExpression:Parser = null;
		multiplicativeExpression = function(s:String, state:ParserState):ParserState { return multiplicativeExpression(s, state); }
		additiveExpression = action(
			whitespaceSeparatedList(
				1,
				multiplicativeExpression,
				capture(choice([token("+"), token("-")]))
			),
			function(state:LinkedList):Dynamic
			{
				return function(props:Hash<String>):Float
				{
					var pos = state;
					var term = 0.0;
					while (pos != null)
					{
						term += pos.head(props);
						if (pos.tail == null)
							return term;
						else
						{
							if (pos.tail.head == "-")
								term = -term;
							pos = pos.tail.tail;
						}
					}
					return term;
				}
			}
		);
		var multiplicativeTerm = choice([
			action(
				numberLiteral,
				function(state:LinkedList):Dynamic
				{
					return function(props:Hash<String>):Float
					{
						return Std.parseFloat(state.head);
					}
				}
			),
			action(
				sequence([token("round("), additiveExpression, token(")")]),
				function(state:LinkedList):Dynamic
				{
					return function(props:Hash<String>):Float
					{
						return Math.round(state.head(props));
					}
				}
			),
			action(
				sequence([token("floor("), additiveExpression, token(")")]),
				function(state:LinkedList):Dynamic
				{
					return function(props:Hash<String>):Float
					{
						return Math.floor(state.head(props));
					}
				}
			),
			action(
				sequence([token("["), fieldName, token("]")]),
				function(state:LinkedList):Dynamic
				{
					return function(props:Hash<String>):Float
					{
						return Std.parseFloat(props.get(state.head));
					}
				}
			),
			whitespaceSeparatedSequence([
				token("("),
				additiveExpression,
				token(")")
			])
		]);
		multiplicativeTerm = choice([
			multiplicativeTerm,
			action(
				whitespaceSeparatedSequence([token("-"), multiplicativeTerm]),
				function(state:LinkedList):Dynamic
				{
					return function(props:Hash<String>):Float
					{
						return -state.head(props);
					}
				}
			)
		]);
		multiplicativeExpression = action(
			whitespaceSeparatedList(
				1,
				multiplicativeTerm,
				capture(choice([token("*"), token("/")]))
			),
			function(state:LinkedList):Dynamic
			{
				return function(props:Hash<String>):Float
				{
					var pos = state;
					var term = 1.0;
					while (pos != null)
					{
						term *= pos.head(props);
						if (pos.tail == null)
							return term;
						else
						{
							if (pos.tail.head == "/")
								term = 1.0/term;
							pos = pos.tail.tail;
						}
					}
					return term;
				}
			}
		);
		var arithmeticExpression = sequence([whitespace, additiveExpression, whitespace]);		
		Parsers.parseExpression = function(s:String):Hash<String>->Float
		{
			var result:ParserState = applyParser(s, arithmeticExpression);
			if (result.head == s.length) 
				return result.tail.head;
			else
				return null;
		}

		var svgPath = action(
			repeat(0, choice([
				numberLiteral,
				token(","),
				token("M"),
				token("C"),
				repeat(1, choice([
					token(" "),
					token("\t"),
					token("\r"),
					token("\n")
				]))
			])),
			function(state:LinkedList):Dynamic
			{
				var coords = new Array<Float>();
				while (state != null)
				{
					coords.push(Std.parseFloat(state.head));
					state = state.tail;
				}
				coords.reverse();
				return coords;
			}
		);

		Parsers.parseSVGPath = function(s:String):Array<Float>
		{
			var result:ParserState = applyParser(s, svgPath);
			if (result.head == s.length) 
				return result.tail.head;
			else
				return [];
		}
	})();
}