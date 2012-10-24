(function(){

/**
  @name IGeomixerPlugin
  @desc Интерфейс плагинов ГеоМиксера
  @class
  @abstract
  @property {String} pluginName Имя плагина для списка плагинов
*/

/**
  @memberOf IGeomixerPlugin
  @method
  @name beforeMap
  @desc Вызывется сразу после загрузки всех модулей ядра вьюера (до инициализации карты, проверки пользователя и т.п.)
  @param {Object} params Параметры плагина
*/

/**
  @memberOf IGeomixerPlugin
  @method
  @name beforeViewer
  @desc вызовется до начала инициализации ГеоМиксера, но сразу после инициализации карты
  @param {Object} params Параметры плагина
  @param {gmxAPI.Map} map Основная карта
*/

/**
  @memberOf IGeomixerPlugin
  @method
  @name afterViewer
  @desc вызовется после окончания инициализации ГеоМиксера
  @param {Object} params Параметры плагина
  @param {gmxAPI.Map} map Основная карта
*/

/** Менеджер плагинов. Загружает плагины из конфигурационного файла
*
* Загрузка плагинов происходит из массива window.gmxPlugins. 
*
* Каждый элемент этого массива - объект со следующими свойствами:
*
*   * module (имя модуля)
*   * file (из какого файла подгружать модуль, может отсутствовать). Только если указано module
*   * plugin (сам плагин). Если указано, плагин подгружается в явном виде, иначе используется module (и file)
*   * params - объект параметров, будет передаваться в методы модуля
*   * pluginName - имя плагина. Должно быть уникальным. Заменяет IGeomixerPlugin.pluginName. Не рекомендуется использовать без особых причин
*   * mapPlugin {bool, default: true} - является ли плагин плагином карт. Если является, то не будет грузиться по умолчанию.
*   * isPublic {bool, default: false} - нужно ли показывать плагин в списках плагинов (для некоторых плагинов хочется иметь возможность подключать их к картам, но не показывать всем пользователям)
*
* Если очередной элемент массива просто строка (например, "name"), то это эквивалентно {module: "name", file: "plugins/name.js"}
*
* Каждый плагин хранится в отдельном модуле (через свойство module) или подгружается в явном виде (через свойство plugin). Модуль должен реализовывать интерфейс IGeomixerPlugin.
*  @class PluginsManager
*/
var PluginsManager = function()
{
	var _plugins = [];
    var _pluginsWithName = {};
	var _callbacks = [];
	var _initDone = false;
	var _loadingPluginsInfo = {}; //тут временно хранятся модули пока загружается их тело
	
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
                    name:      curPlugin.pluginName || curPlugin.plugin.pluginName,
                    mapPlugin: curPlugin.mapPlugin,
                    isPublic:  curPlugin.isPublic || false,
                    _inUse:    !curPlugin.mapPlugin
                };
				
                if (plugin.name)
                    _pluginsWithName[ plugin.name ] = plugin;
                    
				_plugins.push( plugin );
			}
			else
			{
                var moduleName = curPlugin.module;
                
                if (!(moduleName in _loadingPluginsInfo))
                {
                    if ( typeof curPlugin.file !== 'undefined' )
                        gmxCore.loadModule(moduleName, curPlugin.file);
				
                    modules.push(moduleName);
                
                    _loadingPluginsInfo[moduleName] = curPlugin;
                }
			}
		}
		
		gmxCore.addModulesCallback(modules, function()
		{
			for (var m = 0; m < modules.length; m++)
			{
                var pluginBody = gmxCore.getModule(modules[m]);
				var plugin = {
                    body:      pluginBody, 
                    params:    _loadingPluginsInfo[modules[m]].params, 
                    name:      _loadingPluginsInfo[modules[m]].pluginName || pluginBody.pluginName,
                    mapPlugin: _loadingPluginsInfo[modules[m]].mapPlugin,
                    isPublic:  _loadingPluginsInfo[modules[m]].isPublic || false,
                    _inUse:    !_loadingPluginsInfo[modules[m]].mapPlugin
                };
                
                if ( plugin.name )
                    _pluginsWithName[plugin.name] = plugin;
                
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
    
    var _genIterativeFunction = function(funcName)
    {
        return function(map)
        {
            for (var p = 0; p < _plugins.length; p++)
                if ( _plugins[p]._inUse && typeof _plugins[p].body[funcName] !== 'undefined')
                    _plugins[p].body[funcName]( _plugins[p].params, map || window.globalFlashMap );
        }
    }
		
	//interface
	
	/**
	 Вызывет callback когда будут загружены все плагины
	 @memberOf PluginsManager
     @name addCallback
     @method
     @param {Function} callback Ф-ция, которую нужно будет вызвать
	*/
	this.addCallback = function( callback )
	{
		if (!_initDone)
			_callbacks.push(callback);
		else
			callback();
	}
    
	/**
	 Вызывает beforeMap() у всех плагинов
	 @memberOf PluginsManager
     @name beforeMap
     @method
	*/
	this.beforeMap = _genIterativeFunction('beforeMap');
	
	/**
	 Вызывает beforeViewer() у всех плагинов
     @memberOf PluginsManager
     @name beforeViewer
	 @method
	*/
	this.beforeViewer = _genIterativeFunction('beforeViewer');
	
	/**
	 Вызывает afterViewer() у всех плагинов
     @memberOf PluginsManager
     @name afterViewer
	 @method
	*/
	this.afterViewer = _genIterativeFunction('afterViewer');
	
	/**
	 Добавляет пункты меню всех плагинов к меню upMenu
     Устарело! Используйте непосредственное добавление элемента к меню из afterViewer()
	 @method
     @ignore
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
    
    /**
	 Вызывает callback(plugin) для каждого плагина
     @memberOf PluginsManager
     @name forEachPlugin
	 @method
     @param {Function} callback Ф-ция для итерирования. Первый аргумент ф-ции - модуль плагина.
	*/
    this.forEachPlugin = function(callback)
    {
        if (!_initDone) return;
        for (var p = 0; p < _plugins.length; p++)
            callback(_plugins[p]);
    }
    
    /**
	 Задаёт, нужно ли в дальнейшем использовать данный плагин
     @memberOf PluginsManager
     @name setUsePlugin
	 @method
     @param {String} pluginName Имя плагина
     @param {Bool} isInUse Использовать ли его для карты
	*/
    this.setUsePlugin = function(pluginName, isInUse)
    {
        if (pluginName in _pluginsWithName)
            _pluginsWithName[pluginName]._inUse = isInUse;
    }
    
    /**
	 Получить плагин по имени
     @memberOf PluginsManager
     @name getPluginByName
	 @method
     @param {String} pluginName Имя плагина
     @returns {IGeomixerPlugin} Модуль плагина, ничего не возвращает, если плагина нет
	*/
    this.getPluginByName = function(pluginName)
    {
        return _pluginsWithName[pluginName];
    }
    
    /**
	 Проверка публичности плагина (можно ли его показывать в различных списках с перечислением подключенных плагинов)
     @memberOf PluginsManager
     @name isPublic
	 @method
     @param {String} pluginName Имя плагина
     @returns {Bool} Является ли плагин публичным
	*/
    this.isPublic = function(pluginName)
    {
        return _pluginsWithName[pluginName] && _pluginsWithName[pluginName].isPublic;
    }
}

var publicInterface = {PluginsManager : PluginsManager};
gmxCore.addModule('PluginsManager', publicInterface);

})();