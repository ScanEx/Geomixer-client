(function() {

Handlebars.registerPartial('TemporalLayerWidgetOptions',
    '{{#periods}}<option name="{{.}}">{{.}}</option>{{/periods}}'
);

_translationsHash.addtext('rus', {
    'Макс. период на экране': 'На экране не более',
    'Тайлы с': 'Тайлы с',
    'Тайлы до': 'Тайлы до',
    'дней': 'дней'
});

_translationsHash.addtext('eng', {
    'Макс. период на экране': 'Max period to show',
    'Тайлы с': 'Tiles from',
    'Тайлы до': 'Tiles till',
    'дней': 'days'
});

/** Создаёт виджет для задания мультивременных параметров слоя
* @class
* @param {HTMLNode} parentDiv контейнер для размещения виджета
* @param {nsGmx.TemporalLayerParams} paramsModel начальные параметры
* @param {String[]} columns массив имён колонок, из которых можно выбрать врменнУю
*/
nsGmx.TemporalLayerParamsWidget = function(parentDiv, paramsModel, columns)
{
    var PERIODS = [1, 4, 16, 64];
    // var optionsHtml = '{{#periods}}<option name="{{.}}">{{.}}</option>{{/periods}}';

    var template = Handlebars.compile(
        '<table><tbody>' +
            '<tr>' +
                '<td>{{i "Макс. период на экране"}}</td>' +
                '<td><input id="maxShownPeriod" class="inputStyle temporal-maxshow"></input> <span>{{i "дней"}}</span> </td>' +
            '</tr>' +
            '<tr class="temporal-columns">' +
                '<td>{{i "Колонка даты"}}</td>' +
                '<td><select id="columnSelect" class="selectStyle"></select></td>' +
            '</tr>' +
            '<tr class="temporal-advanced">' +
                '<td>{{i "Тайлы с"}}</td>' +
                '<td><select id="minPeriod" class="selectStyle">{{>TemporalLayerWidgetOptions}}</select></td>' +
            '</tr>' +
            '<tr class="temporal-advanced">' +
                '<td>{{i "Тайлы до"}}</td>' +
                '<td><select id="maxPeriod" class="selectStyle">{{>TemporalLayerWidgetOptions}}</select></td>' +
            '</tr>' +
        '</tbody></table>' +
        '<span class="buttonLink RCCreate-advanced-link">{{i "LayerRCControl.advancedLink"}}</span>');

    $(parentDiv).html(template({periods: PERIODS}));

    var _columns = columns;
    var isAdvancedMode =
            paramsModel.get('minPeriod') !== paramsModel.defaults.minPeriod ||
            paramsModel.get('maxPeriod') !== paramsModel.defaults.maxPeriod;

    var wasInAdvancedMode = isAdvancedMode;
    var updateVisibility = function() {
        // var isTemporal = paramsModel.get('isTemporal');
        $('.temporal-advanced', parentDiv).toggle(isAdvancedMode);
        $('.RCCreate-advanced-link', parentDiv).toggle(!isAdvancedMode);
        $('.temporal-columns', parentDiv).toggle(_columns.length > 1);
    };

    var updateColumnsSelect = function()
	{
        var selectDateColumn = $('#columnSelect', parentDiv);
		var curColumn = paramsModel.get('columnName');
		var foundOption = null;

		selectDateColumn.empty();
		for (var i = 0; i < _columns.length; i++) {
			var option = $('<option></option>').text(_columns[i]);
			selectDateColumn.append(option);
			if (curColumn === _columns[i]) {
				foundOption = option;
			}
		}

		if (foundOption) {
			foundOption.attr('selected', 'selected');
		} else if (_columns.length) {
			paramsModel.set('columnName', _columns[0]);
		}
	};

    updateVisibility();

    $('.RCCreate-advanced-link', parentDiv).click(function() {
        isAdvancedMode = !isAdvancedMode;
        wasInAdvancedMode = true;
        updateVisibility();
    });

    paramsModel.on('change:isTemporal', updateVisibility);

    updateColumnsSelect();
    $('#columnSelect', parentDiv).change(function()
    {
        paramsModel.set('columnName', $('option:selected', this).val());
    });

    $('#minPeriod>option[name=' + paramsModel.get('minPeriod') + ']', parentDiv).attr('selected', 'selected');
    $('#minPeriod', parentDiv).change(function()
    {
        paramsModel.set('minPeriod', $('option:selected', this).val());
    });

    $('#maxPeriod>option[name=' + paramsModel.get('maxPeriod') + ']', parentDiv).attr('selected', 'selected');
    $('#maxPeriod', parentDiv).change(function()
    {
        paramsModel.set('maxPeriod', $('option:selected', this).val());
    });

    $('#maxShownPeriod', parentDiv).val(paramsModel.get('maxShownPeriod') || '').bind('keyup', function()
    {
        var val = parseInt(this.value) || 0;

        var paramsToSet = {maxShownPeriod: Math.max(0, val)};

        if (!wasInAdvancedMode) {
            if (val > 0) {
                var index = Math.ceil(Math.log(val) / Math.log(4));
                paramsToSet.maxPeriod = PERIODS[Math.min(PERIODS.length - 1, index)];
            } else {
                paramsToSet.maxPeriod = paramsModel.defaults.maxPeriod;
            }
            $('#maxPeriod>option[name=' + paramsToSet.maxPeriod + ']', parentDiv).attr('selected', 'selected');
        }

        paramsModel.set(paramsToSet);
    });

    /**
        Обновляет список доступных для выбора колонок даты
        @param {String[]} columns массив имён колонок
    */
	this.updateColumns = function(columns)
	{
		_columns = columns;
		updateColumnsSelect();
        updateVisibility();
	};
};

})();
