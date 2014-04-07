(function(){

_translationsHash.addtext("rus", {
    "Макс. период на экране": "На экране не более",
    "Тайлы с": "Тайлы с",
    "Тайлы до": "Тайлы до",
    "дней": "дней"
});

_translationsHash.addtext("eng", {
    "Макс. период на экране": "Max period to show",
    "Тайлы с": "Tiles from",
    "Тайлы до": "Tiles till",
    "дней": "days"
});

/** Параметры мультивременного слоя, связанные со временем
  @class
  @extends Backbone.Model
  @prop {number} [minPeriod=1] Минимальный период создания тайлов
  @prop {number} [maxPeriod=1] Максимальный период создания тайлов
  @prop {number} [columnName=null]  Название мультивременной колонки
  @prop {number} [isTemporal=false] Является ли слой мультивременным
*/
nsGmx.TemporalLayerParams = Backbone.Model.extend(
/** @lends nsGmx.TemporalLayerParams.prototype */
{
    defaults: {
        isTemporal: false,
        maxShowPeriod: 0,
        minPeriod: 1,
        maxPeriod: 256,
        columnName: null
    },
    
    /** Возвращает строчку с перечислением временнЫх периодов (для передачи серверу) */
    getPeriodString: function() {
        var minPeriod = this.attributes.minPeriod,
            maxPeriod = this.attributes.maxPeriod,
            curPeriod = minPeriod,
            periods = [];
            
        while ( curPeriod <= maxPeriod )
        {
            periods.push(curPeriod);
            curPeriod *= nsGmx.TemporalLayerParams.PERIOD_STEP;
        }
        return periods.join(',');
    }
}, {PERIOD_STEP: 4});

/** Создаёт виджет для задания мультивременных параметров слоя
* @class
* @param {HTMLNode} parentDiv контейнер для размещения виджета
* @param {nsGmx.TemporalLayerParams} paramsModel начальные параметры
* @param {String[]} columns массив имён колонок, из которых можно выбрать врменнУю
*/
nsGmx.TemporalLayerParamsControl = function( parentDiv, paramsModel, columns )
{
    var PERIODS = [1, 4, 16, 64, 256, 1024];
    var optionsHtml = '{{#periods}}<option name="{{.}}">{{.}}</option>{{/periods}}';
    
    var html = 
        //'<input id="isTemporalCheckbox" type="checkbox"></input>' + 
        '<table><tbody>' + 
            '<tr>' +
                '<td>{{i Макс. период на экране}}</td>' + 
                '<td><input id="maxShownPeriod" class="inputStyle temporal-maxshow"></input> <span>{{i дней}}</span> </td>' + 
            '</tr>' + 
            '<tr class="temporal-columns">' +
                '<td>{{i Колонка даты}}</td>' + 
                '<td><select id="columnSelect" class="selectStyle"></select></td>' + 
            '</tr>' + 
            '<tr class="temporal-advanced">' +
                '<td>{{i Тайлы с}}</td>' + 
                '<td><select id="minPeriod" class="selectStyle">{{>options}}</select></td>' + 
            '</tr>' + 
            '<tr class="temporal-advanced">' +
                '<td>{{i Тайлы до}}</td>' + 
                '<td><select id="maxPeriod" class="selectStyle">{{>options}}</select></td>' + 
            '</tr>' + 
        '</tbody></table>' + 
        //'<div class="temporal-control-noattr">{{i Отсутствует временной атрибут}}</div>' +
        '<span class="buttonLink RCCreate-advanced-link">{{i LayerRCControl.advancedLink}}</span>';

    $(parentDiv).html(Mustache.render(html, {periods: PERIODS}, {options: optionsHtml}));
    
    var updateVisibility = function() {
        var isTemporal = paramsModel.get('isTemporal');
        //$(parentDiv).children(':not(#isTemporalCheckbox)').toggle(isTemporal);
        //$(parentDiv).children().toggle(isTemporal);
        //if (isTemporal) {
        $('.temporal-advanced', parentDiv).toggle(isAdvancedMode);
        $('.RCCreate-advanced-link', parentDiv).toggle(!isAdvancedMode);
        $('.temporal-columns', parentDiv).toggle(_columns.length > 1);
        //$('.temporal-control-noattr', parentDiv).toggle(_columns.length === 0);
        //}
    }
    
    var updateColumnsSelect = function()
	{
        var selectDateColumn = $('#columnSelect', parentDiv);
		var curColumn = paramsModel.get('columnName');
		var foundOption = null;
		
		selectDateColumn.empty();
		for (var i = 0; i < _columns.length; i++)
		{
			var option = $("<option></option>").text(_columns[i]);
			selectDateColumn.append(option);
			if (curColumn == _columns[i])
				foundOption = option;
		}
		
		if (foundOption)
			foundOption.attr('selected', 'selected');
		else if (_columns.length)
			paramsModel.set('columnName', _columns[0]);
	}

    var isAdvancedMode = 
            paramsModel.get('minPeriod') !== paramsModel.defaults.minPeriod ||
            paramsModel.get('maxPeriod') !== paramsModel.defaults.maxPeriod;
    var _columns = columns;
    
    var wasInAdvancedMode = isAdvancedMode;
    
    updateVisibility();
            
    $('.RCCreate-advanced-link', parentDiv).click(function() {
        isAdvancedMode = !isAdvancedMode;
        wasInAdvancedMode = true;
        updateVisibility();
    })
    
    // if (paramsModel.get('isTemporal')) {
        // $('#isTemporalCheckbox', parentDiv).attr('checked', 'checked');
    // }
    
    // $('#isTemporalCheckbox', parentDiv).change(function()
    // {
        // paramsModel.set('isTemporal', this.checked);
        // updateVisibility();
    // });
    
    paramsModel.on('change:isTemporal', updateVisibility);
    // paramsModel.on('change:isTemporal', function() {
        // if (paramsModel.get('isTemporal')) {
            // $('#isTemporalCheckbox', parentDiv).attr('checked', 'checked');
        // } else {
            // $('#isTemporalCheckbox', parentDiv).removeAttr('checked');
        // }
        // updateVisibility();
    // })
    
    updateColumnsSelect();
    $('#columnSelect', parentDiv).change(function()
    {
        paramsModel.set('columnName', $("option:selected", this).val());
    });
    
    $('#minPeriod>option[name='+ paramsModel.get('minPeriod') +']', parentDiv).attr('selected', 'selected');
    $('#minPeriod', parentDiv).change(function()
    {
        paramsModel.set('minPeriod', $("option:selected", this).val());
    });
    
    $('#maxPeriod>option[name='+ paramsModel.get('maxPeriod') +']', parentDiv).attr('selected', 'selected');
    $('#maxPeriod', parentDiv).change(function()
    {
        paramsModel.set('maxPeriod', $("option:selected", this).val());
    });
    
    $('#maxShownPeriod', parentDiv).val(paramsModel.get('maxShownPeriod') || '').bind('keyup', function()
    {
        var val = parseInt(this.value) || 0;
        
        var paramsToSet = {maxShownPeriod: Math.max(0, val)};
        
        if (!wasInAdvancedMode) {
            if (val > 0) {
                var index = Math.ceil(Math.log(val)/Math.log(4));
                paramsToSet.maxPeriod = PERIODS[Math.min(PERIODS.length - 1, index)];
            } else {
                paramsToSet.maxPeriod = paramsModel.defaults.maxPeriod;
            }
            $('#maxPeriod>option[name='+ paramsToSet.maxPeriod +']', parentDiv).attr('selected', 'selected');
        }
        
        console.log(paramsToSet);
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
	}
}

})();