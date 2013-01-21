!function($){
    _translationsHash.addtext("rus", {
        "LayerRCControl.minZoom"         : "Мин. зум",
        "LayerRCControl.titleTemplate"   : "Шаблон имени",
        "LayerRCControl.pathTemplate"    : "Шаблон тайлов",
        "LayerRCControl.advancedLink"    : "Дополнительные параметры",
        "LayerRCControl.layerTagTitle"   : "Параметр слоя",
        "LayerRCControl.attributeTitle"  : "Атрибут объекта"
    });
    
    _translationsHash.addtext("eng", {
        "LayerRCControl.minZoom"         : "Min zoom",
        "LayerRCControl.titleTemplate"   : "Title template",
        "LayerRCControl.pathTemplate"    : "Path template",
        "LayerRCControl.advancedLink"    : "Advanced parameters",
        "LayerRCControl.layerTagTitle"   : "Layer parameter",
        "LayerRCControl.attributeTitle"  : "Object Attribute"
    });

    /**
    Контрол для задания параметров каталогов растров
    @memberOf nsGmx
    @class
    */
    nsGmx.LayerRasterCatalogControl = function(container, rcProperties, params)
    {
        rcProperties = rcProperties || {};
        var advancedMode = !!(rcProperties.RCMaskForRasterPath || rcProperties.RCMaskForRasterTitle || rcProperties.ColumnTagLinks);
        
        this.getRCProperties = function()
        {
            var properties = {
                IsRasterCatalog: RCCheckbox[0].checked,
                RCMinZoomForRasters: minZoomInput.val(),
                RCMaskForRasterTitle: titleInput.val(),
                RCMaskForRasterPath: pathInput.val()
            }
            
            if (layerTags)
            {
                var columnTagLinks = {};
                layerTags.eachValid(function(id, tag, value) { columnTagLinks[value] = tag;});
                properties.ColumnTagLinks = columnTagLinks;
            }
            
            return properties;
        }
        
        var updateVisibility = function()
        {
            $('.RCCreate-advanced', container).toggle(advancedMode);
            $('.RCCreate-advanced-link, .RCCreate-params', container).toggle(RCCheckbox[0].checked);
            $('.RCCreate-tagContainer', container).toggle(advancedMode && RCCheckbox[0].checked);
        }
        
        var RCCheckbox = $('<input/>', {type: 'checkbox', 'class': 'RCCreate-checkbox'}).change(updateVisibility);

        var advancedParamsLink = $(makeLinkButton(_gtxt('LayerRCControl.advancedLink'))).addClass('RCCreate-advanced-link').click(function()
        {
            advancedMode = !advancedMode;
            updateVisibility();
        });
        
        var RCHeader = $('<div/>', {'class': 'RCCreate-header'}).append(advancedParamsLink, RCCheckbox).appendTo(container);
        
        RCCheckbox[0].checked = rcProperties.IsRasterCatalog;
        
        var minZoomInput = $('<input/>', {'class': 'inputStyle RCCreate-zoom-input'}).val(rcProperties.RCMinZoomForRasters || '');
        var titleInput = $('<input/>', {'class': 'inputStyle'}).val(rcProperties.RCMaskForRasterTitle || '');
        var pathInput = $('<input/>', {'class': 'inputStyle'}).val(rcProperties.RCMaskForRasterPath || '');
        
        var RCParamsTable = 
            $('<table/>', {'class': 'RCCreate-params'})
                .append($('<tr/>')
                    .append($('<td/>').text(_gtxt('LayerRCControl.minZoom')).css('padding-right', '6px'))
                    .append($('<td/>').append(minZoomInput)))
                .append($('<tr/>', {'class': 'RCCreate-advanced'})
                    .append($('<td/>').text(_gtxt('LayerRCControl.titleTemplate')))
                    .append($('<td/>').append(titleInput)))
                .append($('<tr/>', {'class': 'RCCreate-advanced'})
                    .append($('<td/>').text(_gtxt('LayerRCControl.pathTemplate')))
                    .append($('<td/>').append(pathInput)))
                .appendTo(container);
        
        var layerTags;
        nsGmx.TagMetaInfo.loadFromServer(function(realTagInfo)
        {
            var realTagsInfo = realTagInfo.getTagArrayExt();
            var fakeTagsInfo = {};
            for (var iT = 0; iT < realTagsInfo.length; iT++)
            {
                var info = realTagsInfo[iT];
                fakeTagsInfo[info.name] = {Type: 'String', Description: info.descr};
            }
            var fakeTagManager = new nsGmx.TagMetaInfo(fakeTagsInfo);
            
            var initTags = {};
            
            if ( rcProperties.ColumnTagLinks )
            {
                for (var iP in rcProperties.ColumnTagLinks)
                    initTags[rcProperties.ColumnTagLinks[iP]] = {Value: iP};
            }
            
            layerTags = new nsGmx.LayerTags(fakeTagManager, initTags);
            
            var tagContainer = $('<div/>', {'class': 'RCCreate-tagContainer RCCreate-advanced'}).addClass().appendTo(container);
            var tagsControl = new nsGmx.LayerTagSearchControl(layerTags, tagContainer, {
                inputWidth: 100, 
                tagHeader: _gtxt('LayerRCControl.layerTagTitle'), 
                valueHeader: _gtxt('LayerRCControl.attributeTitle')
            });
            
            updateVisibility();
        })
    }
}(jQuery)