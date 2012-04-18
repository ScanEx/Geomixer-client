(function(){

/** Менеджер плагинов. Загружает плагины из конфигурационного файла
 @memberOf PluginsManager
 @class PluginsManager
  Загрузка плагинов происходит из массива window.gmxPlugins. 
  Каждый элемент этого массива - объект со следующими свойствами: <br/>
    * module (имя модуля) <br/>
	* file (из какого файла подгружать модуль, может отсутствовать). Только если указано module <br/>
    * plugin (сам плагин). Если указано, плагин подгружается в явном виде, иначе используется module (и file)<br/>
	* params - объект параметров, будет передаваться в методы модуля
    * pluginName - имя плагина. Должно быть по возможности уникальным
    * mapPlugin {bool, default: true} - является ли плагин плагином карт. Если является, то не будет грузиться по умолчанию.
  Если очередной элемент массива просто строка (например, "name"), то это эквивалентно {module: "name", file: "plugins/name.js"}
  Каждый плагин хранится в отдельном модуле (через свойство module) или подгружается в явном виде (через свойство plugin). В модуле могут быть определены следующие методы:<br/>
  * beforeMap (params)- вызовется сразу после загрузки всех модулей ядра вьюера (до инициализации карты, проверки пользователя и т.п.)<br/>
  * beforeViewer (params)- вызовется до начала инициализации вьюера (сразу после инициализации карты)<br/>
  * afterViewer(params) - вызовется после инициализации вьюера<br/>
  * addMenuItems - должен вернуть вектор из пунктов меню, которые плагин хочет добавить.
                   Формат каждого элемента вектора: item - описание меню (см Menu.addElem()), parentID: id меню родителя (1 или 2 уровня)
                   Устарело! Используйте непосредственное добавление элемента к меню из afterViewer()
*/
var PluginsManager = function()
{
	var _plugins = [];
    var _pluginsWithName = {};
	var _callbacks = [];
	var _initDone = false;
	var _modulePlugins = {}; //тут временно хранятся модули пока загружается их тело
	
	//загружаем инфу о модулях и сами модули при необходимости из window.gmxPlugins
	if (typeof window.gmxPlugins !== 'undefined')
	{
		var modules = [];
		for (var p = 0; p < window.gmxPlugins.length; p++)
		{
            var curPlugin = window.gmxPlugins[p];
            
            if (typeof curPlugin === 'string')
                curPlugin = { module: curPlugin, file: 'plugins/' + curPlugin + '.js' };
            
			if ('plugin' in curPlugin)
			{
				var plugin = { 
                    body:      curPlugin.plugin, 
                    params:    curPlugin.params,
                    name:      curPlugin.pluginName,
                    mapPlugin: curPlugin.mapPlugin,
                    _inUse:    !curPlugin.mapPlugin
                };
				
                if (typeof curPlugin.pluginName !== 'undefined' )
                    _pluginsWithName[ curPlugin.pluginName ] = plugin;
                    
				_plugins.push( plugin );
			}
			else
			{
                var moduleName = curPlugin.module;
				if ( typeof curPlugin.file !== 'undefined' )
					gmxCore.loadModule(moduleName, curPlugin.file);
				
                _modulePlugins[moduleName] = curPlugin;
				
				modules.push(moduleName);
			}
		}
		
		gmxCore.addModulesCallback(modules, function()
		{
			for (var m = 0; m < modules.length; m++)
			{
				var plugin = {
                    body:      gmxCore.getModule(modules[m]), 
                    params:    _modulePlugins[modules[m]].params, 
                    name:      _modulePlugins[modules[m]].pluginName,
                    mapPlugin: _modulePlugins[modules[m]].mapPlugin,
                    _inUse:    !_modulePlugins[modules[m]].mapPlugin
                };
                
                if ( typeof _modulePlugins[modules[m]].pluginName !== 'undefined' )
                    _pluginsWithName[_modulePlugins[modules[m]].pluginName] = plugin;
                
				_plugins.push( plugin );
			}
				
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
	 Вызывает beforeMap() у всех плагинов
	*/
	this.beforeMap = function()
	{
		for (var p = 0; p < _plugins.length; p++)
			if ( _plugins[p]._inUse && typeof _plugins[p].body.beforeMap !== 'undefined')
				_plugins[p].body.beforeMap( _plugins[p].params );
	};    
	
	/**
	 @method
	 Вызывает beforeViewer() у всех плагинов
	*/
	this.beforeViewer = function()
	{
		for (var p = 0; p < _plugins.length; p++)
			if ( _plugins[p]._inUse && typeof _plugins[p].body.beforeViewer !== 'undefined')
				_plugins[p].body.beforeViewer( _plugins[p].params );
	};
	
	/**
	 @method
	 Вызывает afterViewer() у всех плагинов
	*/
	this.afterViewer = function()
	{
		for (var p = 0; p < _plugins.length; p++)
			if ( _plugins[p]._inUse && typeof _plugins[p].body.afterViewer !== 'undefined')
				_plugins[p].body.afterViewer( _plugins[p].params );
	};
	
	/**
	 @method
	 Добавляет пункты меню всех плагинов к меню upMenu
	*/
	this.addMenuItems = function( upMenu )
	{
		for (var p = 0; p < _plugins.length; p++)
			if ( _plugins[p]._inUse && typeof _plugins[p].body.addMenuItems != 'undefined')
			{
				var menuItems = _plugins[p].body.addMenuItems();
				for (var i = 0; i < menuItems.length; i++)
					upMenu.addChildItem(menuItems[i].item, menuItems[i].parentID);
			}
	};
    
    this.forEachPlugin = function(callback)
    {
        if (!_initDone) return;
        for (var p = 0; p < _plugins.length; p++)
            callback(_plugins[p]);
    }
    
    this.setUsePlugin = function(pluginName, isInUse)
    {
        if (pluginName in _pluginsWithName)
            _pluginsWithName[pluginName]._inUse = isInUse;
    }
}

var publicInterface = {PluginsManager : PluginsManager};
gmxCore.addModule('PluginsManager', publicInterface);

})();