function findFirstObject(collection, property, value) {
    for (var key in collection) {
        var obj = collection[key];
        if (obj[property] == value)
            return obj;
    }
    return null;
}

function isEmpty(obj) {
	for(var property in obj) {
		if(obj.hasOwnProperty(property))
			return false;
	}
	return true;
}

/* jQuery extensions */
$.getCSS = function(url) {
    if (document.createStyleSheet) {
        document.createStyleSheet(url);
    } else {
        $("head").append("<link rel='stylesheet' type='text/css' href='" + url + "'>");
    }
}

/* Array extensions */
Array.allocate = function(size, value) {
    var result = [];
    for (var index = 0; index < size; ++index) {
        var copy = {};
        if (value instanceof Object)
            $.extend(true, copy, value);
        else
            copy = value;
        result[index] = copy;
    }
    return result;
}

/* Function extension */
Function.prototype.bind = Function.prototype.bind ||
    function(scope) {
        var fn = this;
        return function() {
            return fn.apply(scope, arguments);
        }
    }
    
/* String extension */
String.prototype.trim = String.prototype.trim ||
    function () {
        return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
    }
    
String.translitReplacements = {};
for (var rus in (temp = {
    "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm_1234567890" :
    "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm_1234567890",
    "ЬЪьъ":
    "",
    "АБВГДЕЗИЙКЛМНОПРСТУФЫЭабвгдезийклмнопрстуфыэ ":
    "ABVGDEZIYKLMNOPRSTUFYEabvgdeziyklmnoprstufye_",
    "ЁЖЧХЦШЩЮЯёжчхцшщюя":
    "YOZHCHKHTSSHSHYUYAyozhchkhtsshshyuya"
})) {
    var eng = temp[rus];
    var k = eng.length/rus.length;
    for (var i = 0; i < rus.length; i++)
        String.translitReplacements[rus.substring(i, i + 1)] = eng.substring(i*k, (i + 1)*k);
}

String.prototype.translit = function() {
    var result = "";
    for (var i = 0; i < this.length; i++)
        result += (String.translitReplacements[this.substring(i, i + 1)] || "");
    return result;
} 
