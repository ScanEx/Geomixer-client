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

translationsHash.prototype.addtext = function(lang, newHash)
{
	var res = true;
	
	if ( !(lang in this.hash) ) this.hash[lang] = {};

	for ( var k in newHash )
		if ( k in this.hash[lang] )
			res = false;
		else 
			this.hash[lang][k] = newHash[k];
			
	return res;
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
					
					window.location.reload();
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
	return window.language || translationsHash.DEFAULT_LANGUAGE;
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

//Явно добавляем объекты в глобальную видимость
window._gtxt = _gtxt;
window._translationsHash = _translationsHash;
window.translationsHash = translationsHash;

window.gmxCore && gmxCore.addModule('translations', 
{
    _translationsHash: _translationsHash
})

}();