var nsGmx = nsGmx || {};

(function($){

_translationsHash.addtext("rus", {
                        "pluginsEditor.selectedTitle" : "Плагины карты",
                        "pluginsEditor.availableTitle" : "Доступные плагины",
                        "pluginsEditor.add" : "Добавить плагин"
                     });
                     
_translationsHash.addtext("eng", {
                        "pluginsEditor.selectedTitle" : "Map plugins",
                        "pluginsEditor.availableTitle" : "Available plugins",
                        "pluginsEditor.add" : "Add plugin"
                     });

var MapPlugins = function( plugins )
{
    var _plugins = plugins || [];
    var _pluginsByName = {};
    
    for (var iP = 0; iP < _plugins.length; iP++)
        _pluginsByName[plugins[iP]] = true;
    
    this.addPlugin = function(pluginName)
    {
        if (pluginName in _pluginsByName)
            return false;
        
        _pluginsByName[pluginName] = true;
        
        _plugins.push(pluginName);
        $(this).change();
        
        return true;
    }
    
    this.each = function(callback)
    {
        for (var p = 0; p < _plugins.length; p++)
            callback(_plugins[p]);
    }
    
    this.remove = function(pluginName)
    {
        delete _pluginsByName[pluginName];
        for (var p = 0; p < _plugins.length; p++)
            if (_plugins[p] === pluginName)
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
            $(remove).addClass('pluginEditor-remove');
            remove.onclick = function()
            {
                mapPlugins.remove(name);
            }
            divRow.append(remove).append($('<span/>').text(name));
            
            container.append(divRow);
        });
    }
    
    $(mapPlugins).change(update);
    update();
}

var createPluginsEditor = function(container, pluginsInfo)
{
    var mapPlugins = new MapPlugins( pluginsInfo );
        
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

_userObjects.addDataCollector('mapPlugins', {
    collect: function()
    {
        if (_mapHelper.mapPlugins)
            return _mapHelper.mapPlugins;
        else
            return null;
    },
    load: function(data)
    {
        if (data)
        {
            _mapHelper.mapPlugins = data;
            
            for (var p = 0; p < data.length; p++)
                nsGmx.pluginsManager.setUsePlugin(data[p], true);
        }
        else
        {
            _mapHelper.mapPlugins = [];
        }
    }
})

})(jQuery);