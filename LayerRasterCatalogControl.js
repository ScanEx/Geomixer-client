!function($){
    /**
    Контрол для задания параметров каталогов растров
    @namespace nsGmx
    @class
    */
    nsGmx.LayerRasterCatalogControl = function(container, rcProperties, params)
    {
        rcProperties = rcProperties || {};
        var advancedMode = !!(/*rcProperties.TiledQuicklookMaxZoom ||*/ rcProperties.RCMaskForRasterPath || rcProperties.RCMaskForRasterTitle || rcProperties.ColumnTagLinks);
        
        this.getRCProperties = function()
        {
            var properties = {
                IsRasterCatalog: RCCheckbox[0].checked,
                //TiledQuicklookMaxZoom: maxZoomInput.val(),
                TiledQuicklookMinZoom: minZoomInput.val(),
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
            $('.RCCreate-tagContainer').toggle(advancedMode && RCCheckbox[0].checked);
        }
        
        var RCCheckbox = $('<input/>', {type: 'checkbox', 'class': 'RCCreate-checkbox'}).change(updateVisibility);

        var advancedParamsLink = $(makeLinkButton('Дополнительные параметры')).addClass('RCCreate-advanced-link').click(function()
        {
            advancedMode = !advancedMode;
            updateVisibility();
        });
        
        var RCHeader = $('<div/>', {'class': 'RCCreate-header'}).append(advancedParamsLink, RCCheckbox).appendTo(container);
        
        RCCheckbox[0].checked = rcProperties.IsRasterCatalog;
        
        var minZoomInput = $('<input/>', {'class': 'inputStyle RCCreate-zoom-input'}).val(rcProperties.TiledQuicklookMinZoom || '');
        //var maxZoomInput = $('<input/>', {'class': 'inputStyle RCCreate-zoom-input'}).val(rcProperties.TiledQuicklookMaxZoom || '');
        var titleInput = $('<input/>', {'class': 'inputStyle'}).val(rcProperties.RCMaskForRasterTitle || '');
        var pathInput = $('<input/>', {'class': 'inputStyle'}).val(rcProperties.RCMaskForRasterPath || '');
        
        var RCParamsTable = 
            $('<table/>', {'class': 'RCCreate-params'})
                .append($('<tr/>')
                    .append($('<td/>').text('Мин. зум').css('padding-right', '6px'))
                    .append($('<td/>').append(minZoomInput)))
                // .append($('<tr/>', {'class': 'RCCreate-advanced'})
                    // .append($('<td/>').text('Мax. зум'))
                    // .append($('<td/>').append(maxZoomInput)))
                .append($('<tr/>', {'class': 'RCCreate-advanced'})
                    .append($('<td/>').text('Шаблон имени'))
                    .append($('<td/>').append(titleInput)))
                .append($('<tr/>', {'class': 'RCCreate-advanced'})
                    .append($('<td/>').text('Шаблон тайлов'))
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
            var tagsControl = new nsGmx.LayerTagSearchControl(layerTags, tagContainer, {inputWidth: 100, tagHeader: 'Параметр слоя', valueHeader: 'Атрибут объекта'});
            updateVisibility();
        })
    }
}(jQuery)