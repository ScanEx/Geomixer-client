var nsGmx = nsGmx || {};

(function($){

_translationsHash.addtext("rus", {
                        "pluginsEditor.selectedTitle" : "Плагины карты",
                        "pluginsEditor.availableTitle" : "Доступные плагины",
                        "pluginsEditor.add" : "Добавить плагин",
                        "pluginsEditor.paramsTitle" : "Параметры плагина"
                     });
                     
_translationsHash.addtext("eng", {
                        "pluginsEditor.selectedTitle" : "Map plugins",
                        "pluginsEditor.availableTitle" : "Available plugins",
                        "pluginsEditor.add" : "Add plugin",
                        "pluginsEditor.paramsTitle" : "Parameter of plugin"
                     });

// plugins - массив с именами и параметрами плагина. Каждый элемент: {name: <имя>, params: <хеш параметров>}.
// Сохращённый вариант описания - "<имя>" соответствует {name: <имя>, params: {}}
var MapPlugins = function()
{
    var _plugins = [];
    var _pluginsByName = {};
    
    this.addPlugin = function(pluginName, pluginParams)
    {
        if (pluginName in _pluginsByName)
            return false;
        
        _pluginsByName[pluginName] = pluginParams || {};
        
        _plugins.push({name: pluginName, params: _pluginsByName[pluginName]});
        $(this).change();
        
        return true;
    }
    
    this.each = function(callback)
    {
        for (var p = 0; p < _plugins.length; p++) {
            callback(_plugins[p].name, _plugins[p].params);
        }
    }
    
    this.remove = function(pluginName)
    {
        delete _pluginsByName[pluginName];
        for (var p = 0; p < _plugins.length; p++)
            if (_plugins[p].name === pluginName)
            {
                _plugins.splice(p, 1);
                $(this).change();
                return;
            }
    }
    
    this.isExist = function(pluginName)
    {
        return pluginName in _pluginsByName;
    }
    
    this.getPluginParams = function(pluginName) {
        return _pluginsByName[pluginName];
    }
    
    this.setPluginParams = function(pluginName, pluginParams) {
        if (_pluginsByName[pluginName]) {
            _pluginsByName[pluginName] = pluginParams;
            for (var p = 0; p < _plugins.length; p++)
                if (_plugins[p].name === pluginName)
                {
                    _plugins[p].params = pluginParams;
                    $(this).change();
                    return;
                }
        }
    }
    
    //обновляем используемость и параметры плагинов
    this.updateGeomixerPlugins = function() {
        for (var p = 0; p < _plugins.length; p++) {
            nsGmx.pluginsManager.setUsePlugin(_plugins[p].name, true);
            nsGmx.pluginsManager.updateParams(_plugins[p].name, _plugins[p].params);
        }
    }
    
    this.load = function(data) {
        _plugins = $.map(data, function(plugin) {
            return typeof plugin === 'string' ? {name: plugin, params: {}} : plugin;
        });
        
        _pluginsByName = {};
        
        for (var iP = 0; iP < _plugins.length; iP++) {
            _pluginsByName[_plugins[iP].name] = _plugins[iP].params;
        }
        
    }
    
    this.save = function() {
        return $.extend(true, [], _plugins);
    }
}

var GeomixerPluginsWidget = function(container, mapPlugins)
{
    var _allPlugins = [];
    var isListActive = [];
    
    nsGmx.pluginsManager.forEachPlugin(function(plugin)
    {
        if ( plugin.pluginName && plugin.mapPlugin && (plugin.isPublic || nsGmx.AuthManager.isRole(nsGmx.ROLE_ADMIN)) )
        {
            _allPlugins.push({name: plugin.pluginName, isPublic: plugin.isPublic});
        }
    })
    
    var update = function()
    {
        $(container).empty();
        var pluginSelect = $('<select/>', {multiple: 'multiple', 'class': 'pluginEditor-pluginList'}).bind('focus', function()
        {
            isListActive = true;
        });
        
        for (var p = 0; p < _allPlugins.length; p++)
            if (!mapPlugins.isExist(_allPlugins[p].name)) {
                var pluginOption = $('<option/>').text(_allPlugins[p].name);
                if (!_allPlugins[p].isPublic)
                    pluginOption.addClass('pluginEditor-hiddenPluginOption');
                pluginSelect.append(pluginOption);
            }
                
        var pluginInput = $('<input/>', {'class': 'inputStyle pluginEditor-pluginInput'}).bind('focus', function()
        {
            isListActive = false;
        });
        
        var addPluginButton = $('<button/>', {'class': 'pluginEditor-addButton'}).text(_gtxt("pluginsEditor.add")).click(function()
        {
            var selected = [];
            
            if (isListActive)
            {
                $(":selected", pluginSelect).each(function()
                {
                    selected.push($(this).val());
                })
            }
            else
            {
                if ( nsGmx.pluginsManager.getPluginByName(pluginInput.val()) )
                {
                    selected.push(pluginInput.val());
                }
                else
                {
                    inputError(pluginInput[0]);
                }
            }
            
            for (var sp = 0; sp < selected.length; sp++)
                mapPlugins.addPlugin( selected[sp] );
        })
        $(container)
            .append($('<div/>', {'class': 'pluginEditor-widgetHeader'}).text(_gtxt('pluginsEditor.availableTitle')))
            .append(pluginSelect).append($('<br/>'))
            .append(pluginInput).append($('<br/>'))
            .append(addPluginButton);
    }
    
    $(mapPlugins).change(update);
    update();
}

var MapPluginParamsWidget = function(mapPlugins, pluginName) {

    var FakeTagMetaInfo = function()
    {
        this.isTag = function(tag) { return true; }
        this.getTagType = function(tag) { return 'String'; }
        this.getTagDescription = function(tag) { return ''; }
        this.getTagArray = function() { return []; }
        this.getTagArrayExt = function() { return []; }
    };
    var fakeTagMetaInfo = new FakeTagMetaInfo();
    
    var pluginParams =  mapPlugins.getPluginParams(pluginName);
    var tagInitInfo = {};
    
    for (var tagName in pluginParams) {
        tagInitInfo[tagName] = {Value: pluginParams[tagName]};
    }
    
    var layerTags = new nsGmx.LayerTags(fakeTagMetaInfo, tagInitInfo);
    
    var container = $('<div/>');
    
    var pluginValues = new nsGmx.LayerTagSearchControl(layerTags, container);
    showDialog(_gtxt('pluginsEditor.paramsTitle') + " " + pluginName, container[0], {width: 300, height: 200, closeFunc: function() {
        var newParams = {};
        layerTags.eachValid(function(tagid, tag, value) {
            newParams[tag] = newParams[tag] || [];
            newParams[tag].push(value);
        })
        
        mapPlugins.setPluginParams(pluginName, newParams);
    }});
}

var MapPluginsWidget = function(container, mapPlugins)
{
    var update = function()
    {
        container.empty();
        container.append($('<div/>', {'class': 'pluginEditor-widgetHeader'}).text(_gtxt('pluginsEditor.selectedTitle')));
        
        if (nsGmx.AuthManager.isRole(nsGmx.ROLE_ADMIN)) {
            nsGmx.pluginsManager.forEachPlugin(function(plugin)
            {
                if ( plugin.pluginName && !plugin.mapPlugin && !mapPlugins.isExist(plugin.pluginName) )
                {
                    var divRow = $('<div/>', {'class': 'pluginEditor-widgetElemCommon'})
                        .append($('<span/>').text(plugin.pluginName))
                        .appendTo(container);
                }
            })
        }
        
        mapPlugins.each(function(name)
        {
            var divRow = $('<div/>', {'class': 'pluginEditor-widgetElem'});
            var remove = makeImageButton("img/close.png", "img/close_orange.png");
            var editButton = makeImageButton("img/edit.png", "img/edit.png");
            $(remove).addClass('pluginEditor-remove');
            $(editButton).addClass('pluginEditor-edit');
            
            remove.onclick = function()
            {
                mapPlugins.remove(name);
            }
            editButton.onclick = function()
            {
                new MapPluginParamsWidget(mapPlugins, name);
            }
            
            divRow.append(remove, editButton, $('<span/>').text(name));
            
            container.append(divRow);
        });
    }
    
    $(mapPlugins).change(update);
    update();
}

var createPluginsEditor = function(container, mapPlugins)
{
    //var mapPlugins = _mapHelper.mapPlugins;
        
    var widgetContainer = $('<div/>', {'class': 'pluginEditor-widgetContainer'});
    var allPluginsContainer = $('<div/>', {'class': 'pluginEditor-allContainer'});
    var mapPluginsWidget = new MapPluginsWidget(widgetContainer, mapPlugins);
    var allPluginsWidget = new GeomixerPluginsWidget(allPluginsContainer, mapPlugins);
    
    $(container)
        .append($('<table/>', {'class': 'pluginEditor-table'}).append($('<tr/>')
            .append($('<td/>', {'class': 'pluginEditor-allTD'}).append(allPluginsContainer))
            .append($('<td/>', {'class': 'pluginEditor-widgetTD'}).append(widgetContainer))
        ));
    
    return mapPlugins;
}

gmxCore.addModule('PluginsEditor', {
    createPluginsEditor: createPluginsEditor,
    MapPlugins: MapPlugins
})

nsGmx.createPluginsEditor = createPluginsEditor;
_mapHelper.mapPlugins = new MapPlugins();

//Cтарая версия информации о плагинах карты. Поддерживается для обратной совместимости (например, загрузка доп. карт)
//Формат: {String[]} массив имён плагинов
_userObjects.addDataCollector('mapPlugins', {
    load: function(data)
    {
        if (data) {
            _mapHelper.mapPlugins.load(data);
            _mapHelper.mapPlugins.updateGeomixerPlugins();
        }
    },
    collect: function() {
        var res = [];
        _mapHelper.mapPlugins.each(function(pluginName) {
            res.push(pluginName);
        })
        
        return res;
    }
})

//Вторая версия информации о плагинах карты.
//Формат: [{name: pluginName1, params: {param: value, ...}}, ...]
_userObjects.addDataCollector('mapPlugins_v2', {
    collect: function()
    {
        return _mapHelper.mapPlugins.save();
    },
    load: function(data)
    {
        if (data) {
            _mapHelper.mapPlugins.load(data);
            _mapHelper.mapPlugins.updateGeomixerPlugins();
        }
    }
})

})(jQuery);