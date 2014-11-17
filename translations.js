!function(){
var translationsHash = function()
{
	this.hash = {};
	
	this.flags = {};
	
	this.titles = {};
    
    this._errorHandlers = [];
}

var DEFAULT_LANGUAGE = 'rus';

//Для запоминания выбора языка пользователем используются куки. 
//Запоминается выбор для каждого pathname, а не только для домена целиком
//Формат куки: pathname1=lang1&pathname2=lang2&...
var _parseLanguageCookie = function()
{
    var text = readCookie("language");
    
    if (!text) 
        return {};
    
    var items = text.split('&');

    //поддержка старого формата кук (просто названия взыка для всех pathname)
    if (items % 2) items = [];
    
    var langs = {};
    for (var i = 0; i < items.length; i++)
    {
        var elems = items[i].split('=');
        langs[decodeURIComponent(elems[0])] = decodeURIComponent(elems[1]);
    }
    
    return langs;
}

var _saveLanguageCookie = function(langs)
{
    var cookies = [];
    
    for (var h in langs)
    {
        cookies.push(encodeURIComponent(h) + '=' + encodeURIComponent(langs[h]));
    }
    
    eraseCookie("language");
    createCookie("language", cookies.join('&'));
}

var TranslationsManager = function() {
    this.flags = {};
    this.titles = {};
    this.hash = {};
    this._errorHandlers = [];
}

TranslationsManager.prototype._language = null;

TranslationsManager.prototype._addTextWithPrefix = function(prefix, lang, newHash) {
    var res = true,
        hash = this.hash;

    if (!(lang in hash)) {
        hash[lang] = {};
    }

    for (var k in newHash) {
        var fullKey = prefix + k;
        if (fullKey in hash[lang]) {
            res = false;
        } else {
            if (typeof newHash[k] === 'string') {
                hash[lang][fullKey] = newHash[k];
            } else {
                this._addTextWithPrefix(fullKey + '.', lang, newHash[k]);
            }
        }
    }

    return res;
}

/** Добавить строки в словарь локализации
 @func addText
 @memberOf nsGmx.Translations
 @param {String} lang Язык, к которому добавляются строки
 @param {Object} strings Список добавляемых строк. Должен быть объектом, в котором атрибуты являются ключами перевода.
                 Если значение атрибута - строка, то она записывается как результат локализации данного ключа.
                 Если значение атрибута - другой объект, то название текущего атрибута будет добавлено с точкой 
                 к названию атрибутов в этом объекте. Например: {a: {b: 'бэ', c: 'це'}} сформируют ключи локализации 'a.b' и 'a.c'.
*/
TranslationsManager.prototype.addText = function(lang, newHash) {
    this._addTextWithPrefix('', lang, newHash);
}

/** Получить локализованный текст по ключу для текущего языка
 @func getText
 @memberOf nsGmx.Translations
 @param {String} key Ключ локализации
 @return {String} Локализованный текст
*/
TranslationsManager.prototype.getText = function(dictKey) {
    var lang = this.getLanguage(),
        args = arguments,
        getArg = function(i) {
            return args[i + 1] || '';
        };

    if (!this.hash[lang] || !this.hash[lang][dictKey]) {
        this._errorHandlers.forEach(function(handler) {handler(dictKey, lang);});
        return '';
    } else {
        return this.hash[lang][dictKey].replace(/\[value(\d)\]/g, function(match, argIndex) {
            return getArg(Number(argIndex))
        })
    }
}

/** Установить текущий язык
 @func setLanguage
 @memberOf nsGmx.Translations
 @param {String} lang Текущий язык (eng/rus/...)
*/
TranslationsManager.prototype.setLanguage = function(lang) {
    TranslationsManager.prototype._language = lang;
}

/** Получить текущий язык локализации
 @func getLanguage
 @memberOf nsGmx.Translations
 @return {String} Текущий язык (eng/rus/...)
*/
TranslationsManager.prototype.getLanguage = function() {
    return TranslationsManager.prototype._language || 
           (typeof window !== 'undefined' && window.language) || 
           DEFAULT_LANGUAGE;
}

/** Добавить обработчик ошибок локализации. 
    При возникновении ошибок (не определён язык, не найден перевод) будет вызываться каждый из обработчиков
 @func addErrorHandler
 @memberOf nsGmx.Translations
 @param {function(text, lang)} Обработчик ошибки. В ф-цию передаётся текст и язык
*/
TranslationsManager.prototype.addErrorHandler = function(handler) {
    this._errorHandlers.push(handler);
}

/** Считать из кук текущий язык локализации.
 * В куках отдельно записываются языки для каждого pathname, а не только для домена целиком
 @func getLanguageFromCookies
 @memberOf nsGmx.Translations
 @return {String} Язык, записанный в куках для данного pathname
*/
TranslationsManager.prototype.getLanguageFromCookies = function() {
    return _parseLanguageCookie()[window.location.pathname];
}

/** Записать в куки текущий язык локализации.
 * В куках отдельно записываются языки для каждого pathname, а не только для домена целиком
 @func updateLanguageCookies
 @memberOf nsGmx.Translations
 @param {String} lang Язык, который нужно записать в куку
*/
TranslationsManager.prototype.updateLanguageCookies = function(lang) {
    var langs = _parseLanguageCookie();
    langs[window.location.pathname] = lang;
    _saveLanguageCookie(langs);
}

/** Ф-ции для локализации пользовательского интерфейса
 @namespace nsGmx.Translations
*/

var commonTranslationsManager = new TranslationsManager();
TranslationsManager.commonManager = commonTranslationsManager;

if (typeof define === 'function' && define.amd) {
    define(function() {
        return TranslationsManager;
    });
}

window.nsGmx = window.nsGmx || {};
window.nsGmx.Translations = commonTranslationsManager;

//Поддерживаем обратную совместимость - глобальные объекты _gtxt, _translationsHash, translationsHash
var prev_gtxt = window._gtxt,
    prev_translationsHash = window._translationsHash,
    prevTranslationsHash = window.translationsHash;
    
/** Убирает из глобальной видимости все объекты и ф-ции, связанные с локализацией
 @name noConflicts
 @memberOf nsGmx.Translations
*/
TranslationsManager.prototype.noConflicts = function() {
    window._gtxt = prev_gtxt;
    window._translationsHash = prev_translationsHash;
    window.translationsHash = prevTranslationsHash;
}

//Явно добавляем объекты в глобальную видимость
var DumpClass = function(){};
DumpClass.prototype = commonTranslationsManager;

window._translationsHash = new DumpClass();
_translationsHash.gettext = commonTranslationsManager.getText.bind(commonTranslationsManager),
_translationsHash.addtext = commonTranslationsManager.addText.bind(commonTranslationsManager),
_translationsHash.showLanguages = function() {
    var langCanvas = _div(null, [['dir','className','floatRight'],['css','margin',' 7px 10px 0px 0px']])
    
    for (var lang in this.hash)
    {
        if (lang != window.language)
        {
            var button = makeLinkButton(_translationsHash.titles[lang]);
            
            button.style.marginLeft = '5px';
            button.style.fontSize = '11px';

            button.onclick = function(lang) {
                window.translationsHash.updateLanguageCookies(lang);

                if (window.nsGmx && window.nsGmx.GeomixerFramework) {
                    window.language = lang;
                    _mapHelper.reloadMap();
                } else {
                    window.location.reload();
                }
            }.bind(null, lang);
            
            _title(button, this.titles[lang]);
            
            _(langCanvas, [button]);
        }
        else
            _(langCanvas, [_span([_t(_translationsHash.titles[lang])], [['css','marginLeft','5px'], ['css','color','#fc830b']])]);
    }

    _(document.getElementById("headerLinks"), [langCanvas]);
}

window._gtxt = function() {
    return commonTranslationsManager.getText.apply(commonTranslationsManager, arguments);
};

window.translationsHash = {
    getLanguageFromCookies: commonTranslationsManager.getLanguageFromCookies.bind(commonTranslationsManager),
    updateLanguageCookies: commonTranslationsManager.updateLanguageCookies.bind(commonTranslationsManager)
};

window.gmxCore && gmxCore.addModule('translations',
{
    _translationsHash: window._translationsHash
})

}();