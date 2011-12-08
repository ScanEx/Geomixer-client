﻿(function(){

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
  Каждый плагин хранится в отдельном модуле (через свойство modules) или подгружается в явном виде (через свойство plugins). В модуле могут быть определены следующие методы:<br/>
  * beforeViewer (params)- вызовется до начала инициализации вьюера (сразу после инициализации карты)<br/>
  * afterViewer(params) - вызовется после инициализации вьюера<br/>
  * addMenuItems - должен вернуть вектор из пунктов меню, которые плагин хочет добавить.
                   Формат каждого элемента вектора: item - описание меню (см Menu.addElem()), parentID: id меню родителя (1 или 2 уровня)
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
			if ('plugin' in window.gmxPlugins[p])
			{
				var plugin = { 
                    body:      window.gmxPlugins[p].plugin, 
                    params:    window.gmxPlugins[p].params,
                    name:      window.gmxPlugins[p].pluginName,
                    mapPlugin: window.gmxPlugins[p].mapPlugin,
                    _inUse:    !window.gmxPlugins[p].mapPlugin
                };
				
                if (typeof window.gmxPlugins[p].pluginName !== 'undefined' )
                    _pluginsWithName[ window.gmxPlugins[p].pluginName ] = plugin;
                    
				_plugins.push( plugin );
			}
			else
			{
                var moduleName = window.gmxPlugins[p].module;
				if ( typeof window.gmxPlugins[p].file !== 'undefined' )
					gmxCore.loadModule(moduleName, window.gmxPlugins[p].file);
				
                _modulePlugins[moduleName] = window.gmxPlugins[p];
				
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