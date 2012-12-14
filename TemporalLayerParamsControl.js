(function(){

/** Параметры мультивременного слоя, связанные со временем
  @param {Object} [initParams] Начальные параметры
  @param {Integer} [initParams.minPeriod=1] Минимальный период создания тайлов
  @param {Integer} [initParams.maxPeriod=1] Максимальный период создания тайлов
  @param {Integer} [initParams.columnName=null]  Название мультивременной колонки
  @param {Integer} [initParams.isTemporal=false] Является ли слой мультивременным
*/
nsGmx.TemporalLayerParams = function(initParams)
{
    initParams = initParams || {};
    var PERIOD_STEP = 4;
    var _minPeriod = initParams.minPeriod || 1;
    var _maxPeriod = initParams.maxPeriod || 256;
    var _columnName = initParams.columnName || null;
    var _isTemporal = initParams.isTemporal || false;
    
    this.setPeriods = function(minPeriod, maxPeriod) { _minPeriod = minPeriod; _maxPeriod = maxPeriod; }
    this.setColumnName = function(name) { _columnName = name; }
    this.getColumnName = function() { return _columnName; }
    this.getMinPeriod = function() { return _minPeriod; }
    this.getMaxPeriod = function() { return _maxPeriod; }
    this.getPeriodString = function()
    {
        var curPeriod = _minPeriod;
        var periods = [];
        while ( curPeriod <= _maxPeriod )
        {
            periods.push(curPeriod);
            curPeriod *= PERIOD_STEP;
        }
        return periods.join(',');
    }
    this.setTemporal = function(isTemporal) { _isTemporal = isTemporal; }
    this.getTemporal = function() { return _isTemporal; }
};

/** Создаёт виджет для задания мультивременных параметров слоя
* @param {HTMLNode} parentDiv контейнер для размещения виджета
* @param {nsGmx.TemporalLayerParams} paramsModel начальные параметры
* @param {String[]} columns массив имён колонок, из которых можно выбрать врменнУю
*/
nsGmx.TemporalLayerParamsControl = function( parentDiv, paramsModel, columns )
{
    var temporalCheckbox = $("<input></input>", {type: 'checkbox', id: 'timeLayer'});
	var _columns = columns;
    temporalCheckbox.change(function()
    {
        paramsModel.setTemporal(this.checked);
        $('.temporal-control', parentDiv).toggle(this.checked);
    });
    
    // if (_columns.length == 0)
        // temporalCheckbox.attr('disabled', 'disabled');
    
    var addOptions = function(select)
    {
        var temporalPeriods = [1, 4, 16, 64, 256, 1024, 4096];
        for (var k = 0; k < temporalPeriods.length; k++)
            select.append($("<option></option>", {periodIndex: k}).text(temporalPeriods[k]));
    }
        
    // var selectMinPeriod = $("<select></select>", {'class': 'selectStyle'});
    // addOptions(selectMinPeriod);
    // var selectMaxPeriod = selectMinPeriod.clone();
    
    // $([selectMinPeriod[0], selectMaxPeriod[0]]).change(function()
    // {
        // var minPeriod = parseInt($("option:selected", selectMinPeriod).attr('periodIndex'));
        // var maxPeriod = parseInt($("option:selected", selectMaxPeriod).attr('periodIndex'));
        // if (minPeriod > maxPeriod)
        // {
            // $([selectMinPeriod[0], selectMaxPeriod[0]]).addClass('ErrorPeriod');
        // }
        // else
        // {
            // $([selectMinPeriod[0], selectMaxPeriod[0]]).removeClass('ErrorPeriod');
            // paramsModel.setPeriods(temporalPeriods[minPeriod], temporalPeriods[maxPeriod]);
        // }
    // });
    
    var noColumnNotification = $('<tr/>').append($('<td/>').attr('colspan', 2).append(
        $('<div/>', {'class': 'temporal-control-noattr'})
            .text(_gtxt('Отсутствует временной атрибут'))
            .toggle(!columns.length)
    ))
    
    var singleDateLayerCheckbox = $('<input/>', {type: 'checkbox', id: 'temporal-properties-single'}).change(function()
    {
        if (this.checked)
            paramsModel.setPeriods(1, 1);
        else
            paramsModel.setPeriods(1, 256);
    });
    
    var singleDateLayerContainer =
        $('<div/>', {'class': 'temporal-control temporal-properties-single'}).append(
            singleDateLayerCheckbox,
            $('<label/>', {'for': 'temporal-properties-single'}).text(_gtxt('Период 1 день'))
        )
    
    singleDateLayerContainer.appendTo(parentDiv);
    
    $(parentDiv)
        .append(temporalCheckbox);
        
    if (paramsModel.getTemporal())
        temporalCheckbox[0].checked = true;
    
    var selectDateColumn = $("<select></select>", {'class': 'selectStyle'});
	
	var updateColumnsSelect = function()
	{
		var curColumn = paramsModel.getColumnName();
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
			paramsModel.setColumnName(_columns[0]);
			
		selectDateColumn.change(function()
		{
			paramsModel.setColumnName( $("option:selected", this).val() );
		});
	}
	
	updateColumnsSelect();
        
    var trColumn = $('<tr></tr>').append(
        $('<td></td>').text(_gtxt('Колонка даты')),
        $('<td></td>').append(selectDateColumn)
    ).toggle(columns.length > 1);
    
    // var tr1 = $('<tr></tr>')
                // .append($('<td></td>').text(_gtxt('Минимальный период')))
                // .append($('<td></td>').append(selectMinPeriod));
                
    // var tr2 = $('<tr></tr>')
                // .append($('<td></td>').text(_gtxt('Максимальный период')))
                // .append($('<td></td>').append(selectMaxPeriod));
    
    var propertiesTable = $('<table/>', {'class': 'temporal-control'}).append(noColumnNotification, trColumn).appendTo(parentDiv);
    //propertiesTable.css('display', 'none');
    $('.temporal-control', parentDiv).toggle(paramsModel.getTemporal());
    
    singleDateLayerCheckbox[0].checked = paramsModel.getMinPeriod() === paramsModel.getMaxPeriod();
	
    /**
        Обновляет список доступных для выбора колонок даты
        @param {String[]} columns массив имён колонок
    */
	this.updateColumns = function(columns)
	{
        noColumnNotification.toggle(!columns.length);
        trColumn.toggle(columns.length > 1);
		_columns = columns;
        
		// if (_columns.length == 0)
		// {
			// temporalCheckbox.attr('disabled', 'disabled');
			// temporalCheckbox[0].checked = false;
			// $(temporalCheckbox).change();
		// }
		// else
		// {
			// temporalCheckbox.removeAttr('disabled');
		// }

		updateColumnsSelect();
	}
}

})();