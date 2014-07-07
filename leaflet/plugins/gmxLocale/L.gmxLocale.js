!function() {
    var DEFAULT_LANGUAGE = 'rus',
        _setKeyText = function(lang, key, item, hash) {
            if (!hash[lang]) hash[lang] = {};
            hash[lang][key] = item;
        };
    L.gmxLocale = {

        setLanguage: function(lang){
            this._language = lang;
        },

        getLanguage: function(){
            return this._language || window.language || DEFAULT_LANGUAGE;
        }
    };

    L.gmxLocaleMixin = {
        addText: function() {
            var lang = arguments[0],
                newHash = arguments[1];
            if (arguments.length === 1) {
                newHash = lang;
                lang = null;
            }
            for ( var k in newHash ) {
                if (lang === null) {
                    for ( var k1 in newHash[k] ) {
                        _setKeyText(k, k1, newHash[k][k1], this);
                    }
                } else {
                    _setKeyText(lang, k, newHash[k], this);
                }
            }
            return this;
        },

        getText: function(key) {
            var lang = L.gmxLocale.getLanguage(),
                locale = this[lang] || {};

            var keyArr = key ? key.split(/\./) : [];
            for (var i = 0, len = keyArr.length; i < len; i++) {
                if (!locale) break;
                locale = locale[keyArr[i]];
            }
            return locale;
        }
    };
    L.extend(L.gmxLocale, L.gmxLocaleMixin);
}();
