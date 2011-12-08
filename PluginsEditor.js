var nsGmx = nsGmx || {};

(function($){

var MapPlugins = function( plugins )
{
    var _plugins = plugins || [];
    this.addPlugin = function(plugin)
    {
        _plugins.push(plugin);
        $(this).change();
    }
    
    this.each = function(callback)
    {
        for (var p = 0; p < _plugins.length; p++)
            callback(_plugins[p]);
    }
    
    this.remove = function(name)
    {
        for (var p = 0; p < _plugins.length; p++)
            if (_plugins[p] === name)
            {
                _plugins.splice(p, 1);
                $(this).change();
                return;
            }
    }
    
    this.isExist = function(name)
    {
        for (var p = 0; p < _plugins.length; p++)
            if (_plugins[p] === name) return true;
        return false;
    }
}

var GeomixerPluginsWidget = function(container, mapPlugins)
{
    var _allPlugins = [];
    
    nsGmx.pluginsManager.forEachPlugin(function(plugin)
    {
        if ( typeof plugin.name !== 'undefined' && plugin.mapPlugin )
        {
            _allPlugins.push(plugin.name);
        }
    })
    
    var update = function()
    {
        $(container).empty();
        var pluginSelect = $('<select/>', {multiple: 'multiple', 'class': 'pluginEditor-pluginList'});
        for (var p = 0; p < _allPlugins.length; p++)
            if (!mapPlugins.isExist(_allPlugins[p]))
                pluginSelect.append($('<option/>').text(_allPlugins[p]));
        
        var addPluginButton = $('<button/>').text("Добавить").click(function()
        {
            var selected = [];
            $(":selected", pluginSelect).each(function()
            {
                selected.push($(this).val());
                //$(this).remove();
            })
            
            for (var sp = 0; sp < selected.length; sp++)
                mapPlugins.addPlugin( selected[sp] );
        })
        $(container).append(pluginSelect).append($('<br/>')).append(addPluginButton);
    }
    
    $(mapPlugins).change(update);
    update();
}

var MapPluginsWidget = function(container, mapPlugins)
{
    var update = function()
    {
        container.empty();
        mapPlugins.each(function(name)
        {
            var divRow = $('<div/>');
            var remove = makeImageButton("img/close.png", "img/close_orange.png");
            remove.onclick = function()
            {
                mapPlugins.remove(name);
            }
            
            divRow.append($('<span/>').text(name));
            divRow.append(remove);
            
            container.append(divRow);
        });
    }
    
    $(mapPlugins).change(update);
    update();
}

var createPluginsEditor = function(container, pluginsInfo)
{
    var mapPlugins = new MapPlugins( pluginsInfo );
        
    var widgetContainer = $('<div/>');
    var allPluginsContainer = $('<div/>');
    var mapPluginsWidget = new MapPluginsWidget(widgetContainer, mapPlugins);
    var allPluginsWidget = new GeomixerPluginsWidget(allPluginsContainer, mapPlugins);
    
    $(container)
        .append($('<table/>', {'class': 'pluginEditor-table'}).append($('<tr/>')
            .append($('<td/>').append(allPluginsContainer))
            .append($('<td/>').append(widgetContainer))
        ));
    
    return mapPlugins;
}

gmxCore.addModule('PluginsEditor', {
    createPluginsEditor: createPluginsEditor,
    MapPlugins: MapPlugins
})

nsGmx.createPluginsEditor = createPluginsEditor;

})(jQuery);