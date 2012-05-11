﻿//Плагин фильтрации слоёв со снимками по дневным/ночным пролётам
//Параметры:
//  * dayNightAttribute {String} - название атрибутивного параметра, по которому нужно фильтровать пролёты. Параметр должен иметь тип "bool"
//  * layers {Array of String} - массив ID слоёв
(function(){

_translationsHash.addtext("rus", {
                        "DayNightPlugin.Title" : "Пролёты MODIS:",
                        "DayNightPlugin.DayPass" : "дневные",
                        "DayNightPlugin.NightPass" : "ночные"
                     });
                     
_translationsHash.addtext("eng", {
                        "DayNightPlugin.Title" : "MODIS passes:",
                        "DayNightPlugin.DayPass" : "day",
                        "DayNightPlugin.NightPass" : "night"
                     });
                     
var DayNightFilteringControl = function(container, params)
{
    var dayCheckbox = $(_checkbox(true, 'checkbox')).addClass('daynight-check');
    var nightCheckbox = $(_checkbox(true, 'checkbox')).addClass('daynight-check');
    
    $(container)
        .append($("<table/>", {'class': 'daynight-class'})
            .append($("<tr/>")
                .append($("<td/>").text(_gtxt("DayNightPlugin.Title")))
                .append($("<td/>", {'class': 'daynight-checkcont'}).append($('<div/>').append(dayCheckbox)))
                .append($("<td/>").append($('<span/>').text(_gtxt('DayNightPlugin.DayPass'))))
                .append($("<td/>", {'class': 'daynight-checkcont'}).append($('<div/>').append(nightCheckbox)))
                .append($("<td/>").append($('<span/>').text(_gtxt('DayNightPlugin.NightPass'))))
            )
        )

    var setFilter = function()
    {
        var isDay = dayCheckbox.attr('checked');
        var isNight = nightCheckbox.attr('checked');
        var paramValue;
        var showAll = isDay && isNight;
        
        if ( isDay && !isNight ) paramValue = 'True';
        if ( !isDay && isNight ) paramValue = 'False';
        
        
        var filterString = "`" + params.dayNightAttribute + "` = '" + paramValue + "'";

        for (var iLayer = 0; iLayer < params.layers.length; iLayer++)
            if (globalFlashMap.layers[params.layers[iLayer]])
            {
                var layer = globalFlashMap.layers[params.layers[iLayer]];
                var filters = layer.filters;
                for (var iFilter = 0; iFilter < filters.length; iFilter++)
                {
                    var lastFilter = layer.properties.styles[iFilter].Filter;
                    
                    if (showAll)
                    {
                        filters[iFilter].setFilter(lastFilter);
                    }
                    else
                    {
                        var newFilter = (lastFilter && lastFilter != "") ? ("(" + lastFilter + ") AND" + filterString) : filterString;
                        filters[iFilter].setFilter(newFilter);
                    }
                }
            }
    }
    
    $('input', container).change(setFilter);
    setFilter();
    
    
    this.isDay  = function() { return dayCheckbox.attr('checked'); };
    this.setDay  = function(isDay)
    {
        if (isDay)
            dayCheckbox.attr('checked', true);
        else
            dayCheckbox.removeAttr('checked');
            
        setFilter();
    };
    
    this.isNight = function() { return nightCheckbox.attr('checked'); };
    this.setNight = function(isNight)
    {
        if (isNight)
            nightCheckbox.attr('checked', true);
        else
            nightCheckbox.removeAttr('checked');
            
        setFilter();
    };
}

gmxCore.addModule('DayNightFilteringPlugin', 
    {
        afterViewer: function(params)
        {
            gmxCore.addModulesCallback(['CoverControl2'], function(mCoverControl)
            {
                mCoverControl.CoverControlInstance.whenInited(function()
                {
                    var container = mCoverControl.CoverControlInstance.getInstance().getContainer();
                    var control = new DayNightFilteringControl(container, params);
                    
                    _mapHelper.customParamsManager.addProvider({
                        name: 'DayNightFilteringPlugin',
                        loadState: function(state) 
                        {
                            control.setDay(state.isDay); 
                            control.setNight(state.isNight); 
                        },
                        saveState: function() 
                        {
                            return {
                                isDay: control.isDay(),
                                isNight: control.isNight()
                            }
                        }
                    });
                })
            })
        }
    }, 
    { init: function(module, path)
        {
            var doLoadCss = function()
            {
                path = path || window.gmxJSHost || "";
                $.getCSS(path + "DayNightFilteringPlugin.css");
            }
            
            if ('getCSS' in $)
                doLoadCss();
            else
                $.getScript(path + "../jquery/jquery.getCSS.js", doLoadCss);
        }
    }
);

})();