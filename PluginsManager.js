(function(){

/** Менеджер плагинов. Загружает плагины из конфигурационного файла
 @memberOf PluginsManager
 @class PluginsManager
  Загрузка плагинов происходит из объкта window.gmxPlugins. 
  Каждое свойство в этой переменной - объект со свойствами file (из какого файла подгружать модуль, может отсутствовать) и module (имя модуля) 
  или со свойством plugin (сам плагин).<br/>
  Каждый плагин хранится в отдельном модуле или подгружается в явном виде (через свойство plugins). В модуле могут быть определены следующие методы:<br/>
  * beforeViewer - вызовется до начала инициализации вьюера (сразу после инициализации карты)<br/>
  * afterViewer - вызовется после инициализации вьюера<br/>
  * addMenuItems - должен вернуть вектор из пунктов меню, которые плагин хочет добавить.
                   Формат каждого элемента вектора: item - описание меню (см Menu.addElem()), parentID: id меню родителя (1 или 2 уровня)
*/
var PluginsManager = function()
{
	var _plugins = [];
	var _callbacks = [];
	var _initDone = false;
	if (typeof window.gmxPlugins !== 'undefined')
	{
		var modules = [];
		for (var p in window.gmxPlugins)
		{
			if ('plugin' in window.gmxPlugins[p])
				_plugins.push( window.gmxPlugins[p].plugin )
			else
			{
				if ( typeof window.gmxPlugins[p].file !== 'undefined' )
					gmxCore.loadModule(window.gmxPlugins[p].module, window.gmxPlugins[p].file);
					
				modules.push(window.gmxPlugins[p].module);
			}
		}
		
		gmxCore.addModulesCallback(modules, function()
		{
			for (var m = 0; m < modules.length; m++)
				_plugins.push( gmxCore.getModule(modules[m]) );
				
			_initDone = true;
			
			for ( var f = 0; f < _callbacks.length; f++ )
				_callbacks[f]();
				
			_callbacks = [];
		});
	}
	else
	{
		_initDone = true;
	}
		
	//interface
	
	/**
	 @method
	 Вызывет callback когда будут загружены все плагины
	*/
	this.addCallback = function( callback )
	{
		if (!_initDone)
			_callbacks.push(callback);
		else
			callback();
	}
	
	/**
	 @method
	 Вызывает beforeViewer() у всех плагинов
	*/
	this.beforeViewer = function()
	{
		for (var p = 0; p < _plugins.length; p++)
			if ( typeof _plugins[p].beforeViewer !== 'undefined')
				_plugins[p].beforeViewer();
	};
	
	/**
	 @method
	 Вызывает afterViewer() у всех плагинов
	*/
	this.afterViewer = function()
	{
		for (var p = 0; p < _plugins.length; p++)
			if ( typeof _plugins[p].afterViewer !== 'undefined')
				_plugins[p].afterViewer();
	};
	
	/**
	 @method
	 Добавляет пункты меню всех плагинов к меню upMenu
	*/
	this.addMenuItems = function( upMenu )
	{
		for (var p = 0; p < _plugins.length; p++)
			if (typeof _plugins[p].addMenuItems != 'undefined')
			{
				var menuItems = _plugins[p].addMenuItems();
				for (var i = 0; i < menuItems.length; i++)
					upMenu.addChildItem(menuItems[i].item, menuItems[i].parentID);
			}
	};
}

var publicInterface = {PluginsManager : PluginsManager};
gmxCore.addModule('PluginsManager', publicInterface);

})();