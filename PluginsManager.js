(function(){

//внутреннее представление плагина
var Plugin = function(moduleName, file, body, params, pluginName, mapPlugin, isPublic)
{
    var usageState = mapPlugin ? 'unknown' : 'used'; //used, notused, unknown
    var _this = this; 
    
    var doLoad = function()
    {
        if (_this.body || _this.isLoading)
            return;
            
        _this.isLoading = true;
        gmxCore.loadModule(moduleName, file).then(function()
        {
            _this.body = gmxCore.getModule(moduleName);
            _this.isLoading = false;
            _this.pluginName = _this.pluginName || _this.body.pluginName;
            _this.def.resolve();
        }, function() {
            _this.isLoading = false;
            _this.def.reject();
        });
    }
    
    this.body = body;
    this.moduleName = moduleName;
    this.params = params || {};
    this.def = $.Deferred(); //будет resolve когда плагин загрузится
    this.isLoading = false;
    this.mapPlugin = mapPlugin || (body && body.pluginName);
    this.pluginName = pluginName || (this.body && this.body.pluginName);
    this.isPublic = isPublic;
    this.file = file;
    
    if (this.body)
        this.def.resolve();
        
    //мы не будем пока загружать плагин только если он не глобальный и имеет имя
    if (!mapPlugin || !pluginName) {
        doLoad();
    }
    
    this.setUsage = function(usage)
    {
        usageState = usage;
        if (usageState === 'used') {
            doLoad();
        }
    }
    
    this.isUsed = function()
    {
        return usageState === 'used';
    }
    
    this.updateParams = function (newParams) {
        $.extend(true, _this.params, newParams);
    }
}

/**
  @name IGeomixerPlugin
  @desc Интерфейс плагинов ГеоМиксера
  @class
  @abstract
  @property {String} pluginName Имя плагина для списка плагинов
*/

/**
  @memberOf IGeomixerPlugin.prototype
  @method
  @name beforeMap
  @desc Вызывется сразу после загрузки всех модулей ядра вьюера (до инициализации карты, проверки пользователя и т.п.).
        Ещё нет информации о пользователе, но пока можно сменить карту для загрузки.
  @param {Object} params Параметры плагина
*/

/**
  @memberOf IGeomixerPlugin.prototype
  @method
  @name preloadMap
  @desc Вызывется непосредственно перед началом создания слоёв по загруженной информации о карте.
        Карту сменить уже нельзя, но можно как-нибудь повлиять на процесс создания слоёв (например, добавить новые классы слоёв)
  @param {Object} params Параметры плагина
*/

/**
  @memberOf IGeomixerPlugin.prototype
  @method
  @name beforeViewer
  @desc вызовется до начала инициализации ГеоМиксера, но сразу после инициализации карты
  @param {Object} params Параметры плагина
  @param {gmxAPI.Map} map Основная карта
*/

/**
  @memberOf IGeomixerPlugin.prototype
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
    
    var joinedPluginInfo = {};
    
    //сначала загружаем инфу о плагинах из переменной nsGmx._defaultPlugins - плагины по умолчанию
    window.nsGmx && nsGmx._defaultPlugins && $.each(nsGmx._defaultPlugins, function(i, info) {
        if (typeof info === 'string') {
            info = { module: info, file: 'plugins/' + info + '.js' };
        }
        joinedPluginInfo[info.module] = info;
    })
    
    //дополняем её инфой из window.gmxPlugins с возможностью перезаписать
    window.gmxPlugins && $.each(window.gmxPlugins, function(i, info) {
        if (typeof info === 'string') {
            info = { module: info, file: 'plugins/' + info + '.js' };
        }
        joinedPluginInfo[info.module] = $.extend(true, joinedPluginInfo[info.module], info);
    })
    
    $.each(joinedPluginInfo, function(key, info) {
        if (typeof info === 'string')
            info = { module: info, file: 'plugins/' + info + '.js' };
        
        var plugin = new Plugin(
            info.module, 
            info.file,
            info.plugin,
            info.params,
            info.pluginName,
            info.mapPlugin,
            info.isPublic || false
        );
        
        _plugins.push(plugin);
        
        if (plugin.pluginName) {
            _pluginsWithName[ plugin.pluginName ] = plugin;
        }
        else
        {
            plugin.def.done(function()
            {
                if (plugin.pluginName) {
                    _pluginsWithName[ plugin.pluginName ] = plugin;
                }
            })
        }
    })
    
    var _genIterativeFunction = function(funcName)
    {
        return function(map)
        {
            for (var p = 0; p < _plugins.length; p++)
                if ( _plugins[p].isUsed() && _plugins[p].body && _plugins[p].body[funcName]) {
                    //передаём в плагин deep clone параметров, чтобы плагин не мог их менять in-place
                    var params = $.extend(true, {}, _plugins[p].params);
                    try {
                        _plugins[p].body[funcName]( params, map || nsGmx.leafletMap );
                    } catch (e) {
                        console && console.error('Error in function ' + funcName + '() of plugin ' + _plugins[p].moduleName + ': ' + e);
                        console && console.error(e.stack);
                    }
                }
        }
    }
    
    //public interface
    
    /**
    Вызывет callback когда будут загружены все плагины, загружаемые в данный момент
    @memberOf PluginsManager
     @name done
     @method
     @param {Function} callback Ф-ция, которую нужно будет вызвать
    */
    
    this.done = function(f) {
        //не можем использовать $.when, так как при первой ошибке результирующий promise сразу же reject'ится, а нам нужно дождаться загрузки всех плагинов
        var loadingPlugins = _.where(_plugins, {isLoading: true}),
            count = loadingPlugins.length;
        
        count || f();
        
        loadingPlugins.forEach(function(plugin) {
            plugin.def.always(function() {
                --count || f();
            })
        })
    }
    
    /**
     Вызывает beforeMap() у всех плагинов
     @memberOf PluginsManager
     @name beforeMap
     @method
    */
    this.beforeMap = _genIterativeFunction('beforeMap');
    
    /**
     Вызывает preloadMap() у всех плагинов
     @memberOf PluginsManager
     @name preloadMap
     @method
    */
    this.preloadMap = _genIterativeFunction('preloadMap');
    
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
        for (var p = 0; p < _plugins.length; p++) {
            if ( _plugins[p].isUsed() && _plugins[p].body && _plugins[p].body.addMenuItems) {
                var menuItems = _plugins[p].body.addMenuItems();
                for (var i = 0; i < menuItems.length; i++)
                    upMenu.addChildItem(menuItems[i].item, menuItems[i].parentID);
            }
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
        //if (!_initDone) return;
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
            _pluginsWithName[pluginName].setUsage(isInUse ? 'used' : 'notused');
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
    
    /**
     Обновление параметров плагина
     @memberOf PluginsManager
     @name updateParams
     @method
     @param {String} pluginName Имя плагина
     @param {Object} newParams Новые параметры плагина. Параметры с совпадающими именами будут перезатёрты
    */
    this.updateParams = function(pluginName, newParams) {
        _pluginsWithName[pluginName] && _pluginsWithName[pluginName].updateParams(newParams);
    }
}

var publicInterface = {PluginsManager : PluginsManager};
gmxCore.addModule('PluginsManager', publicInterface);

})();