!function($) {
    _translationsHash.addtext('rus', {LayerQuicklookWidget: {
        minZoom: 'Мин. зум',
        regTitle: 'Атрибуты привязки',
        title: 'Показать'
    }});

    _translationsHash.addtext('eng', {LayerQuicklookWidget: {
        minZoom: 'Min zoom',
        regTitle: 'Registration fields',
        title: 'Expand'
    }});

    var template = Handlebars.compile('<div>' +
        '{{#if isMinimized}}<span class="lqw-title buttonLink">{{i "LayerQuicklookWidget.title"}}</span>{{/if}}' +
        '<div class="lqw-container" {{#if isMinimized}}style="display:none"{{/if}}>' +
            '<div>{{i "LayerQuicklookWidget.minZoom"}}<input class="lqw-minzoom-input inputStyle" value="{{minZoom}}"></div>' +
            '<textarea class="inputStyle lqw-textarea">{{quicklook}}</textarea>' +
            '<div class="suggest-link-container">{{i "Атрибут >"}}</div>' +
            '<div class="lqw-registration-link">{{i "LayerQuicklookWidget.regTitle"}}</div>' +
            '<table class="lqw-registration-container">' +
                '{{#points}}' +
                    '<tr><td>X{{idx}}{{../regSelect "X"}}</td><td>Y{{idx}}{{../regSelect "Y"}}</td></tr>' +
                '{{/points}}' +
            '</table>' +
        '</div>' +
    '</div>');

    var selectTemplate = Handlebars.compile('<select data-name="{{targetName}}" class="lqw-point-select selectStyle">' +
        '{{#opts}}' +
            '<option value="{{name}}"{{#if isDefault}} selected{{/if}}>{{name}}</option>' +
        '{{/opts}}' +
    '</select>');

    /**
    Виджет для задания параметров слоя, связанных с показом квиклуков
    @memberOf nsGmx
    @class
    */
    nsGmx.LayerQuicklookWidget = function(container, layerProperties) {
        var DEFAULT_OPTION = {name: '', isDefault: false};

        var layerColumns = window._.pluck(layerProperties.get('Columns'), 'Name'),
            quicklookParams = layerProperties.get('Quicklook');

        var ui = $(template({
            isMinimized: !quicklookParams.get('template'),
            minZoom: quicklookParams.get('minZoom'),
            quicklook: quicklookParams.get('template'),
            points: Array.apply(null, {length: 4}).map(function(elem, index) { return {idx: index + 1};}),
            regSelect: function(label) {
                var targetName = (label + this.idx),
                    initValue = (quicklookParams.get(targetName) || targetName).toLowerCase();
                return new Handlebars.SafeString(selectTemplate({
                    targetName: targetName,
                    opts: [].concat(DEFAULT_OPTION, layerColumns.map(function(column) {
                        return {
                            name: column,
                            isDefault: column.toLowerCase() === initValue
                        };
                    }))
                }));
            }
        }));

        ui.find('.lqw-title').click(function() {
            ui.find('.lqw-title').hide();
            ui.find('.lqw-container').show();
        });

        var updateRegistrationStatus = function() {
            ui.find('td').each(function(index, td) {
                $(td).toggleClass('lqw-reg-error', !$(td).find('option:selected').val());
            });
        };

        ui.find('.lqw-minzoom-input').on('change keyup', function() {
            var minZoom = Number(this.value);
            quicklookParams.set('minZoom', minZoom);
        });

        ui.find('select').change(function() {
            updateRegistrationStatus();
            var name = $(this).data('name');
            quicklookParams.set(name, this.value || undefined);
        });

        updateRegistrationStatus();

        if (ui.find('.lqw-reg-error').length === 0) {
            ui.find('.lqw-registration-container').hide();
            ui.find('.lqw-registration-link').addClass('buttonLink').click(function() {
                $(this).removeClass('buttonLink');
                ui.find('.lqw-registration-container').show();
            });
        }

        var quicklookText = ui.find('.lqw-textarea');

        var setQuicklook = function() {
            layerProperties.get('Quicklook').set('template', quicklookText.val());
        };

        var suggestWidget = new nsGmx.SuggestWidget(layerProperties.get('Attributes') || [], quicklookText[0], '[suggest]', setQuicklook);

        quicklookText.on('focus', function() {
            $(suggestWidget.el).hide();
        });

        ui.find('.suggest-link-container')
            .append(suggestWidget.el)
            .click(function() {
                if (suggestWidget.el.style.display === 'none') {
                    $(suggestWidget.el).fadeIn(500);
                }
            });

        quicklookText.on('keyup change', setQuicklook);

        ui.appendTo(container);
    };
}(jQuery);
