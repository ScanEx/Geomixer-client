!function($){
    _translationsHash.addtext("rus", {
        "LayerRCControl.minZoom"         : "Мин. зум",
        "LayerRCControl.titleTemplate"   : "Шаблон имени",
        "LayerRCControl.pathTemplate"    : "Шаблон тайлов",
        "LayerRCControl.advancedLink"    : "Дополнительно",
        "LayerRCControl.layerTagTitle"   : "Параметр слоя",
        "LayerRCControl.attributeTitle"  : "Атрибут объекта"
    });
    
    _translationsHash.addtext("eng", {
        "LayerRCControl.minZoom"         : "Min zoom",
        "LayerRCControl.titleTemplate"   : "Title template",
        "LayerRCControl.pathTemplate"    : "Path template",
        "LayerRCControl.advancedLink"    : "Advanced",
        "LayerRCControl.layerTagTitle"   : "Layer parameter",
        "LayerRCControl.attributeTitle"  : "Object Attribute"
    });
    
    var createQuicklookCanvas = function(layerProperties)
    {
        var quicklookText = _textarea(null, [['attr','paramName','Quicklook'],['dir','className','inputStyle'],['css','overflow','auto'],['css','width','250px'],['css','height','50px']]),
            setQuicklook = function()
            {
                layerProperties.set('Quicklook', quicklookText.value);
            }
        
        quicklookText.value = layerProperties.get('Quicklook') || '';
        
        quicklookText.onkeyup = function()
        {
            setQuicklook();
            return true;
        }
        
        var atrsSuggest = _mapHelper.createSuggestCanvas(layerProperties.get('Attributes') || [], quicklookText, '[suggest]', setQuicklook);
        
        quicklookText.onfocus = function()
        {
            atrsSuggest.style.display = 'none';
            
            return true;
        }
        
        var divAttr = _div([_t(_gtxt("Атрибут >")), atrsSuggest], [['dir','className','attrsHelperCanvas']]);
        
        divAttr.onclick = function()
        {
            if (atrsSuggest.style.display == 'none')
                $(atrsSuggest).fadeIn(500);
            
            return true;
        }
        
        var suggestCanvas = _table([_tbody([_tr([_td([_div([divAttr],[['css','position','relative']])])])])],[['css','margin','0px 4px']]);

        var canvas = $('<div/>').append(
            $('<span>' + _gtxt("Накладываемое изображение") + '</span><br/>').css('margin-left', '4px'),
            quicklookText,
            suggestCanvas
        ).css('margin', '10px 0px');
        
        return canvas;
    }
    
    nsGmx.LayerRCProperties = Backbone.Model.extend({
        defaults: {
            IsRasterCatalog: false,
            RCMinZoomForRasters: 0,
            RCMaskForRasterTitle: '',
            RCMaskForRasterPath: '',
            ColumnTagLinks: {}
        },
        isAnyLinks: function() {
            return nsGmx._.size(this.attributes.ColumnTagLinks) > 0;
        }
    });

    /**
    Контрол для задания параметров каталогов растров
    @memberOf nsGmx
    @class
    */
    nsGmx.LayerRasterCatalogControl = function(container, rcProperties, layerProperties)
    {
        var advancedMode = !!(rcProperties.get('RCMaskForRasterPath') || rcProperties.get('RCMaskForRasterTitle') || rcProperties.isAnyLinks());
        
        var updateVisibility = function()
        {
            var isRasterCatalog = rcProperties.get('IsRasterCatalog');
            $('.RCCreate-advanced', container).toggle(advancedMode);
            $('.RCCreate-advanced-link', container).toggle(!advancedMode);
            //$('.RCCreate-tagContainer', container).toggle(advancedMode && isRasterCatalog);
            $('.RCCreate-tagContainer', container).toggle(advancedMode);
        }
        
        rcProperties.on('change:IsRasterCatalog', updateVisibility);
        
        var RCCheckbox = $('<input/>', {type: 'checkbox', 'class': 'RCCreate-checkbox'}).change(function() {
            rcProperties.set( 'IsRasterCatalog', RCCheckbox[0].checked );
        });

        var advancedParamsLink = $(makeLinkButton(_gtxt('LayerRCControl.advancedLink'))).addClass('RCCreate-advanced-link').click(function()
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
            
            var columnTagLinks = rcProperties.get('ColumnTagLinks');
            
            for (var iP in columnTagLinks)
                initTags[columnTagLinks[iP]] = {Value: iP};
            
            layerTags = new nsGmx.LayerTags(fakeTagManager, initTags);
            
            createQuicklookCanvas(layerProperties).addClass('RCCreate-advanced').appendTo(container);
            
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
            })
            
            advancedParamsLink.appendTo(container);
            //var RCHeader = $('<div/>', {'class': 'RCCreate-header'}).append(advancedParamsLink).appendTo(container);
            
            updateVisibility();
        })
    }
}(jQuery)