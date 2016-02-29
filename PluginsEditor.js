var nsGmx = nsGmx || {};

(function($){

"use strict";

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


var MapPlugins = function()
{
    var _plugins = [];
    var _params = {};
    
    //вместо массива из одного элемента передаём сам элемент
    var normalizeParams = function(params) {
        var res = {};
        for (var p in params) {
            res[p] = params[p].length === 1 ? params[p][0] : params[p];
        }
        
        return res;
    }
    
    this.addPlugin = function(pluginName, pluginParams, onlyParams)
    {
        _params[pluginName] = pluginParams || _params[pluginName] || {};
        
        if (!onlyParams && _plugins.indexOf(pluginName) === -1) {
            _plugins.push(pluginName);
        }
        
        $(this).change();
        
        return true;
    }
    
    this.each = function(callback) {
        for (var p = 0; p < _plugins.length; p++) {
            callback(_plugins[p], _params[_plugins[p]] || {});
        }
    }
    
    this.remove = function(pluginName) {
        var nameIndex = _plugins.indexOf(pluginName);
        if (nameIndex !== -1) {
            _plugins.splice(nameIndex, 1);
            $(this).change();
        }
    }
    
    this.isExist = function(pluginName)
    {
        return _plugins.indexOf(pluginName) !== -1;
    }
    
    this.getPluginParams = function(pluginName) {
        return _params[pluginName];
    }
    
    this.setPluginParams = function(pluginName, pluginParams) {
        _params[pluginName] = pluginParams;
        $(this).change();
    }
    
    //обновляем используемость и параметры плагинов
    this.updateGeomixerPlugins = function() {
        for (var p = 0; p < _plugins.length; p++) {
            nsGmx.pluginsManager.setUsePlugin(_plugins[p], true);
        }
        
        for (var p in _params) {
            nsGmx.pluginsManager.updateParams(p, normalizeParams(_params[p]));
        }
    }
    
    this.load = function(data, version) {
        if (version === 1) {
            _plugins = data;
            _params = {};
        } else if (version === 2) {
            _plugins = [];
            _params = {};
            for (var p = 0; p < data.length; p++) {
                _plugins.push(data[p].name);
                _params[data[p].name] = data[p].params;
            }
        } else if (version === 3) {
            _plugins = data.plugins;
            
            //поддержка ошибки, которая прокралась в базу...
            if ($.isArray(data.params) && data.params.length === 0) {
                _params = {};
            } else {
                _params = data.params;
            }
        }
    }
    
    this.save = function(version) {
        if (version === 1) {
            return _plugins;
        } else if (version === 2) {
            var res = [];
            _plugins.forEach(function(name) {
                res.push({name: name, params: _params[name]});
            })
            return res;
        } else if (version === 3) {
            return {
                plugins: _plugins,
                params: _params
            }
        }
    }
}

var GeomixerPluginsWidget = function(container, mapPlugins)
{
    var template = Handlebars.compile('<div class="pluginsEditor-allPlugins-container">' +
        '<div class="pluginEditor-widgetHeader">{{i "pluginsEditor.availableTitle"}}</div>' +
        '<div class="pluginEditor-treePlaceholder"></div>' +
        '<div class="pluginEditor-controls">' +
            '<input class="inputStyle inputFullWidth pluginEditor-pluginInput"><br>' +
            '<button class="pluginEditor-addButton">{{i "pluginsEditor.add"}}</button>' +
        '</div>' +
    '</div>');
    
    var lang = window.nsGmx.Translations.getLanguage();

    var DEFAULT_GROUP_NAME = {
        eng: 'Main',
        rus: 'Основные'
    };
    
    var _allPluginGroups = {},
        configGroups = window.gmxPluginGroups || [],
        groupByPluginName = [],
        groupOrder = {};
    
    configGroups.forEach(function(group, index) {
        groupOrder[group[lang]] = index;
        group.plugins.forEach(function(plugin) {
            groupByPluginName[plugin] = group[lang];
        })
    })
    
    nsGmx.pluginsManager.forEachPlugin(function(plugin)
    {
        if ( plugin.pluginName && plugin.mapPlugin && (plugin.isPublic || nsGmx.AuthManager.isRole(nsGmx.ROLE_ADMIN)) )
        {
            var groupName = groupByPluginName[plugin.pluginName] || DEFAULT_GROUP_NAME[lang];
            _allPluginGroups[groupName] = _allPluginGroups[groupName] || {groupName: groupName, plugins: []};
            _allPluginGroups[groupName].plugins.push({name: plugin.pluginName, isPublic: plugin.isPublic});
            //_allPlugins.push({name: plugin.pluginName, isPublic: plugin.isPublic});
        }
    })
    
    //по алфавиту
    for (var g in _allPluginGroups) {
        _allPluginGroups[g].plugins.sort(function(a, b) {
            return a.name > b.name ? 1 : -1;
        })
    }
    
    var isListActive = false;
    var update = function()
    {
        $(container).empty();
        
        var filteredGroups = [];
        for (var g in _allPluginGroups) {
            var plugins = _allPluginGroups[g].plugins.filter(function(plugin) {return !mapPlugins.isExist(plugin.name);});
            //если в группе нет плагинов, не показываем её
            plugins.length && filteredGroups.push({
                groupName: _allPluginGroups[g].groupName,
                plugins: plugins
            });
        };
        
        //сохраняем порядок, как в конфиге, default group - первой
        filteredGroups.sort(function(a, b) {
            return groupOrder[a.groupName] - groupOrder[b.groupName];
        });

        var pluginGroupTemplate = Handlebars.compile('<ul class="pluginEditor-pluginsTree ui-helper-noselect">{{#groups}}' +
            '<li>' +
                '<div class="pluginEditor-groupTitle">{{groupName}}</div>' +
                '<ul>{{#plugins}}' +
                    '<li class="pluginEditor-pluginItem ui-helper-noselect" data-plugin-name="{{name}}">{{name}}</li>' +
                '{{/plugins}}</ul>' +
            '</li>' +
            '{{/groups}}</ul>');

        var pluginsTree = $(pluginGroupTemplate({groups: filteredGroups}));

        pluginsTree.find('.pluginEditor-pluginItem').click(function(e) {
            isListActive = true;
            var pluginName = $(this).data('pluginName');
            
            if (e.ctrlKey) {
                $(this).toggleClass('pluginEditor-activePluginItem');
            } else {
                pluginsTree.find('.pluginEditor-pluginItem').removeClass('pluginEditor-activePluginItem');
                $(this).addClass('pluginEditor-activePluginItem');
            }
        });
        
        pluginsTree.find('.pluginEditor-groupTitle').click(function() {
            $(this).siblings('.hitarea').click();
        })
        
        var ui = $(template());
        
        ui.find('.pluginEditor-treePlaceholder').append(pluginsTree);
        
        ui.find('.pluginEditor-pluginInput').bind('focus', function() {
            isListActive = false;
        });

        ui.find('.pluginEditor-addButton').click(function() {
            var selected = [];

            if (isListActive) {
                pluginsTree.find('.pluginEditor-activePluginItem').each(function(i, elem) {
                    selected.push($(elem).data('pluginName'));
                });
            } else {
                var pluginInput = ui.find('.pluginEditor-pluginInput');
                if (nsGmx.pluginsManager.getPluginByName(pluginInput.val())) {
                    selected.push(pluginInput.val());
                } else {
                    inputError(pluginInput[0]);
                }
            }
            
            for (var sp = 0; sp < selected.length; sp++)
                mapPlugins.addPlugin( selected[sp] );
        });

        ui.appendTo(container);
            
        pluginsTree.treeview(/*{collapsed: true}*/);
    }
    
    $(mapPlugins).change(update);
    update();
}

var paramsWidgets = {};

var MapPluginParamsWidget = function(mapPlugins, pluginName) {

    if (paramsWidgets[pluginName]) {
        return;
    };
    
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
    
    var layerTags = new nsGmx.LayerTagsWithInfo(fakeTagMetaInfo, tagInitInfo);
    
    var container = $('<div/>');
    
    var pluginValues = new nsGmx.LayerTagSearchControl(layerTags, container);
    
    var updateParams = function() {
        var newParams = {};
        layerTags.eachValid(function(tagid, tag, value) {
            newParams[tag] = newParams[tag] || [];
            newParams[tag].push(value);
        })
        
        mapPlugins.setPluginParams(pluginName, newParams);
    }
    
    var dialogDiv = showDialog(
            _gtxt('pluginsEditor.paramsTitle') + " " + pluginName, 
            container[0], 
            {
                width: 320, 
                height: 200, 
                closeFunc: function() {
                    updateParams();
                    delete paramsWidgets[pluginName];
                }
            }
        );
    
    paramsWidgets[pluginName] = {
        update: updateParams,
        closeDialog: function() {
            $(dialogDiv).dialog('close');
        }
    };
    
}

var MapPluginsWidget = Backbone.View.extend({
    template: Handlebars.compile(
        '<div class="pluginEditor-widgetHeader">{{i "pluginsEditor.selectedTitle"}}</div>' +
        '<div class="pluginEditor-currentMapPlugins">' +
            '{{#plugins}}' +
                '<div class="pluginEditor-widgetElem">' +
                    '{{#unless isCommon}}' +
                        '<span class="pluginEditor-remove gmx-icon-close" data-plugin-name="{{name}}"></span>' +
                    '{{/unless}}' +
                    '<span class="pluginEditor-edit gmx-icon-edit" data-plugin-name="{{name}}"></span>' +
                    '<span class="pluginEditor-title {{#if isCommon}} pluginEditor-commonPlugin{{/if}}">{{name}}</span>' +
                '</div>' +
            '{{/plugins}}' +
        '</div>'
    ),

    events: {
        'click .gmx-icon-close': function(event) {
            var pluginName = $(event.target).data('pluginName');
            this._mapPlugins.remove(pluginName);
        },
        
        'click .gmx-icon-edit': function(event) {
            var pluginName = $(event.target).data('pluginName');
            new MapPluginParamsWidget(this._mapPlugins, pluginName);
        }
    },

    initialize: function(options) {
        this._mapPlugins = options.mapPlugins;
        $(this._mapPlugins).change(this.render.bind(this));
        this.render();
    },

    render: function() {
        var mapPlugins = this._mapPlugins,
            pluginsToShow = [];

        nsGmx.pluginsManager.forEachPlugin(function(plugin) {
            if ( plugin.pluginName && !plugin.mapPlugin && !mapPlugins.isExist(plugin.pluginName) ) {
                pluginsToShow.push({
                    name: plugin.pluginName,
                    isCommon: true
                });
            }
        });
        
        mapPlugins.each(function(name) {
            pluginsToShow.push({
                name: name,
                isCommon: false
            });
        });
        
        pluginsToShow.sort(function(a, b) {
            return a.isCommon != b.isCommon ? Number(b.isCommon) - Number(a.isCommon) : (a.name > b.name ? 1 : -1);
        });
        
        this.$el.empty().append(this.template({plugins: pluginsToShow}));
    }
});

var createPluginsEditor = function(container, mapPlugins)
{
    var widgetContainer = $('<div/>', {'class': 'pluginEditor-widgetContainer'});
    var allPluginsContainer = $('<div/>', {'class': 'pluginEditor-allContainer'});
    var mapPluginsWidget = new MapPluginsWidget({
        el: widgetContainer,
        mapPlugins: mapPlugins
    });
    var allPluginsWidget = new GeomixerPluginsWidget(allPluginsContainer, mapPlugins);
    
    $(container)
        .append($('<table/>', {'class': 'pluginEditor-table'}).append($('<tr/>')
            .append($('<td/>', {'class': 'pluginEditor-allTD'}).append(allPluginsContainer))
            .append($('<td/>', {'class': 'pluginEditor-widgetTD'}).append(widgetContainer))
        ));
    
    return {
        update: function() {
            for (var name in paramsWidgets) {
                paramsWidgets[name].update();
            }
        },
        closeParamsDialogs: function() {
            for (var name in paramsWidgets) {
                paramsWidgets[name].closeDialog();
            }
        }
    };
}

gmxCore.addModule('PluginsEditor', {
    createPluginsEditor: createPluginsEditor,
    MapPlugins: MapPlugins
})

nsGmx.createPluginsEditor = createPluginsEditor;
_mapHelper.mapPlugins = new MapPlugins();

//Cтарая версия информации о плагинах карты. Поддерживается для обратной совместимости (например, загрузка доп. карт)
//Формат: {String[]} массив имён плагинов
nsGmx.userObjectsManager.addDataCollector('mapPlugins', {
    load: function(data)
    {
        if (data) {
            _mapHelper.mapPlugins.load(data, 1);
            _mapHelper.mapPlugins.updateGeomixerPlugins();
        }
    },
    collect: function() {
        return _mapHelper.mapPlugins.save(1);
    }
})

//Вторая версия информации о плагинах карты.
//Формат: [{name: pluginName1, params: {param: value, ...}}, ...]
nsGmx.userObjectsManager.addDataCollector('mapPlugins_v2', {
    load: function(data)
    {
        if (data) {
            _mapHelper.mapPlugins.load(data, 2);
            _mapHelper.mapPlugins.updateGeomixerPlugins();
        }
    },
    collect: function()
    {
        return _mapHelper.mapPlugins.save(2);
    }
})

//Третья версия информации о плагинах карты.
//Формат: {plugins: [name1, ....], params: {name1: {param1: value1, ...}, ...}}
nsGmx.userObjectsManager.addDataCollector('mapPlugins_v3', {
    load: function(data)
    {
        if (data) {
            _mapHelper.mapPlugins.load(data, 3);
            _mapHelper.mapPlugins.updateGeomixerPlugins();
        }
    },
    collect: function()
    {
        return _mapHelper.mapPlugins.save(3);
    }
})

})(jQuery);