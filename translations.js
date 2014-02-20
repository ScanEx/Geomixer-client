!function(){
var translationsHash = function()
{
	this.hash = {};
	
	this.flags = {};
	
	this.titles = {};
}

translationsHash.DEFAULT_LANGUAGE = "rus";

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

translationsHash.updateLanguageCookies = function(lang)
{
    var langs = _parseLanguageCookie();
    
    langs[window.location.pathname] = lang;
    
    _saveLanguageCookie(langs);
}

translationsHash.getLanguageFromCookies = function()
{
    return _parseLanguageCookie()[window.location.pathname];
}

translationsHash.prototype._addTextWithPrefix = function(prefix, lang, newHash) {
	var res = true;
	
	if ( !(lang in this.hash) ) this.hash[lang] = {};

	for ( var k in newHash ) {
        var fullKey = prefix + k;
		if ( fullKey in this.hash[lang] )
			res = false;
		else {
            if (typeof newHash[k] === 'string') {
                this.hash[lang][fullKey] = newHash[k];
            } else {
                this._addTextWithPrefix(fullKey + '.', lang, newHash[k]);
            }
        }
	}
    
	return res;
}

translationsHash.prototype.addtext = function(lang, newHash) {
    this._addTextWithPrefix('', lang, newHash);
}

translationsHash.prototype.showLanguages = function()
{
	var langCanvas = _div(null, [['dir','className','floatRight'],['css','margin',' 7px 10px 0px 0px']])
	
	for (var lang in this.hash)
	{
		if (lang != window.language)
		{
			var button = makeLinkButton(_translationsHash.titles[lang]);
			
			button.style.marginLeft = '5px';
			button.style.fontSize = '11px';
			
			(function(lang){
				button.onclick = function()
				{
					translationsHash.updateLanguageCookies(lang);
					
                    if (window.nsGmx && window.nsGmx.GeomixerFramework) {
                        window.language = lang;
                        _mapHelper.reloadMap();
                    } else {
                        window.location.reload();
                    }
				}
			})(lang);
			
			_title(button, this.titles[lang]);
			
			_(langCanvas, [button]);
		}
		else
			_(langCanvas, [_span([_t(_translationsHash.titles[lang])], [['css','marginLeft','5px'], ['css','color','#fc830b']])]);
	}
	
	// _($$("headerLinks"), [langCanvas]);
	_(document.getElementById("headerLinks"), [langCanvas]);
}

translationsHash.prototype.getLanguage = function(){
	return this._language || window.language || translationsHash.DEFAULT_LANGUAGE;
}

translationsHash.prototype.setLanguage = function(lang){
	this._language = lang;
}

translationsHash.prototype.gettext = function()
{
	var lang = this.getLanguage(),
		text = arguments[0],
		args = arguments,
		getNextValue = function(i)
		{
			if (i + 1 < args.length)
				return args[i + 1];
			else
				return '';
		};
	
	if (!this.hash[lang])
	{
		showErrorMessage("Не заданы значения для языка \"" + lang + "\"");
		
		return '';
	}
	else if (!this.hash[lang][text])
	{
		showErrorMessage("Не найдено тектовое описание для \"" + text + "\"");
		
		return '';
	}
	else
	{
		return this.hash[lang][text].replace(/\[value(\d)\]/g, function()
		{
			return getNextValue(Number(arguments[1]))
		})
	}
}

var _translationsHash = new translationsHash();

function _gtxt()
{
	return _translationsHash.gettext.apply(_translationsHash, arguments)
}

var prev_gtxt = window._gtxt,
    prev_translationsHash = window._translationsHash,
    prevTranslationsHash = window.translationsHash;

//Явно добавляем объекты в глобальную видимость
window._gtxt = _gtxt;
window._translationsHash = _translationsHash;
window.translationsHash = translationsHash;

/** Ф-ции для локализации пользовательского интерфейса
 @namespace nsGmx.Translations
*/

window.nsGmx = window.nsGmx || {};
window.nsGmx.Translations = window.nsGmx.Translations || {};

/** Убирает из глобальной видимости все объекты и ф-ции, связанные с локализацией
 @name noConflicts
 @memberOf nsGmx.Translations
*/
window.nsGmx.Translations.noConflicts = function() {
    window._gtxt = prev_gtxt;
    window._translationsHash = prev_translationsHash;
    window.translationsHash = prevTranslationsHash;
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
window.nsGmx.Translations.addText = _translationsHash.addtext.bind(_translationsHash);

/** Получить локализованный текст по ключу для текущего языка
 @func getText
 @memberOf nsGmx.Translations
 @param {String} key Ключ локализации
 @return {String} Локализованный текст
*/
window.nsGmx.Translations.getText = _translationsHash.gettext.bind(_translationsHash);

/** Установить текущий язык
 @func setLanguage
 @memberOf nsGmx.Translations
 @param {String} lang Текущий язык (eng/rus/...)
*/
window.nsGmx.Translations.setLanguage = _translationsHash.setLanguage.bind(_translationsHash);

/** Получить текущий язык локализации
 @func getLanguage
 @memberOf nsGmx.Translations
 @return {String} Текущий язык (eng/rus/...)
*/
window.nsGmx.Translations.getLanguage = _translationsHash.getLanguage.bind(_translationsHash);

window.gmxCore && gmxCore.addModule('translations',
{
    _translationsHash: _translationsHash
})

}();