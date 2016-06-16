!function($) {
    _translationsHash.addtext('rus', {LayerRCControl: {
        minZoom         : 'Мин. зум',
        titleTemplate   : 'Шаблон имени',
        pathTemplate    : 'Шаблон тайлов',
        advancedLink    : 'Дополнительно',
        layerTagTitle   : 'Параметр слоя',
        attributeTitle  : 'Атрибут объекта'
    }});

    _translationsHash.addtext('eng', {LayerRCControl: {
        minZoom         : 'Min zoom',
        titleTemplate   : 'Title template',
        pathTemplate    : 'Path template',
        advancedLink    : 'Advanced',
        layerTagTitle   : 'Layer parameter',
        attributeTitle  : 'Object Attribute'
    }});

    nsGmx.LayerRCProperties = Backbone.Model.extend({
        defaults: {
            IsRasterCatalog: false,
            RCMinZoomForRasters: 0,
            RCMaskForRasterTitle: '',
            RCMaskForRasterPath: '',
            ColumnTagLinks: {}
        },
        isAnyLinks: function() {
            return window._.size(this.attributes.ColumnTagLinks) > 0;
        }
    });

    /**
    Контрол для задания параметров каталогов растров
    @memberOf nsGmx
    @class
    */
    nsGmx.LayerRasterCatalogWidget = function(container, rcProperties)
    {
        var advancedMode = !!(
                rcProperties.get('RCMaskForRasterPath') ||
                rcProperties.get('RCMaskForRasterTitle') ||
                rcProperties.isAnyLinks()
            );

        var updateVisibility = function()
        {
            // var isRasterCatalog = rcProperties.get('IsRasterCatalog');
            $('.RCCreate-advanced', container).toggle(advancedMode);
            $('.RCCreate-advanced-link', container).toggle(!advancedMode);
            $('.RCCreate-tagContainer', container).toggle(advancedMode);
        };

        rcProperties.on('change:IsRasterCatalog', updateVisibility);

        var RCCheckbox = $('<input/>', {type: 'checkbox', 'class': 'RCCreate-checkbox'}).change(function() {
            rcProperties.set('IsRasterCatalog', RCCheckbox[0].checked);
        });

        var advancedParamsLink = $(window.makeLinkButton(_gtxt('LayerRCControl.advancedLink'))).addClass('RCCreate-advanced-link').click(function()
        {
            advancedMode = !advancedMode;
            updateVisibility();
        });

        RCCheckbox[0].checked = rcProperties.get('IsRasterCatalog');

        var minZoomInput = $('<input/>', {'class': 'inputStyle RCCreate-zoom-input'}).val(rcProperties.get('RCMinZoomForRasters') || '').bind('keyup change', function() {
            rcProperties.set('RCMinZoomForRasters', parseInt(this.value));
        });

        var titleInput = $('<input/>', {'class': 'inputStyle'}).val(rcProperties.get('RCMaskForRasterTitle') || '').bind('keyup change', function() {
            rcProperties.set('RCMaskForRasterTitle', this.value);
        });

        var pathInput = $('<input/>', {'class': 'inputStyle'}).val(rcProperties.get('RCMaskForRasterPath') || '').bind('keyup change', function() {
            rcProperties.set('RCMaskForRasterPath', this.value);
        });

        // var RCParamsTable =
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

            var columnTagLinks = rcProperties.get('ColumnTagLinks');

            for (var iP in columnTagLinks)
                initTags[columnTagLinks[iP]] = {Value: iP};

            var layerTags = new nsGmx.LayerTagsWithInfo(fakeTagManager, initTags);

            var tagContainer = $('<div/>', {'class': 'RCCreate-tagContainer RCCreate-advanced'}).addClass().appendTo(container);
            var tagsControl = new nsGmx.LayerTagSearchControl(layerTags, tagContainer, {
                inputWidth: 100,
                tagHeader: _gtxt('LayerRCControl.layerTagTitle'),
                valueHeader: _gtxt('LayerRCControl.attributeTitle')
            });

            $(layerTags).change(function() {
                var columnTagLinks = {};
                layerTags.eachValid(function(id, tag, value) { columnTagLinks[value] = tag;});
                rcProperties.set('ColumnTagLinks', columnTagLinks);
            });

            advancedParamsLink.appendTo(container);

            updateVisibility();
        });
    };
}(jQuery);
