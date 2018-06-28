module.exports = { 
	find: function(a, predicate) {
		var list = Object(a);
		var length = list.length >>> 0;
		var thisArg = arguments[2];
		var value;

		for (var i = 0; i < length; i++) {
		  value = list[i];
		  if (predicate.call(thisArg, value, i, list)) {
			return value;
		  }
		}
		return undefined;
	},
	findIndex: function(a, predicate) {
		var list = Object(a);
		var length = list.length >>> 0;
		var thisArg = arguments[2];
		var value;

		for (var i = 0; i < length; i++) {
		  value = list[i];
		  if (predicate.call(thisArg, value, i, list)) {
			return i;
		  }
		}
		return -1;
	}
}