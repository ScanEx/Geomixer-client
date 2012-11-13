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
    var _maxPeriod = initParams.maxPeriod || 1;
    var _columnName = initParams.columnName || null;
    var _isTemporal = initParams.isTemporal || false;
    
    this.setPeriods = function(minPeriod, maxPeriod) { _minPeriod = minPeriod; _maxPeriod = maxPeriod; }
    this.setColumnName = function(name) { _columnName = name; }
    this.getColumnName = function() { return _columnName; }
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
    var temporalCheckbox = $("<input></input>", {'class': 'box', type: 'checkbox', id: 'timeLayer'});
	var _columns = columns;
    temporalCheckbox.change(function()
    {
        paramsModel.setTemporal(this.checked);
        propertiesTable.css('display', this.checked ? '' : 'none');
    });
    
    if (_columns.length == 0)
        temporalCheckbox.attr('disabled', 'disabled');
    
    $(parentDiv)
        .append(temporalCheckbox);
        // .append(
            // $("<label></label>", {'for': 'timeLayer'}).text(_gtxt("Временнóй слой"))
        // );
        
    if (paramsModel.getTemporal())
        temporalCheckbox[0].checked = true;
    
    var temporalPeriods = [1, 4, 16, 64, 256, 1024, 4096];
    
    var addOptions = function(select)
    {
        for (var k = 0; k < temporalPeriods.length; k++)
            select.append($("<option></option>", {periodIndex: k}).text(temporalPeriods[k]));
    }
        
    var selectMinPeriod = $("<select></select>", {'class': 'selectStyle'});
    addOptions(selectMinPeriod);
    var selectMaxPeriod = selectMinPeriod.clone();
    
    $([selectMinPeriod[0], selectMaxPeriod[0]]).change(function()
    {
        var minPeriod = parseInt($("option:selected", selectMinPeriod).attr('periodIndex'));
        var maxPeriod = parseInt($("option:selected", selectMaxPeriod).attr('periodIndex'));
        if (minPeriod > maxPeriod)
        {
            $([selectMinPeriod[0], selectMaxPeriod[0]]).addClass('ErrorPeriod');
        }
        else
        {
            $([selectMinPeriod[0], selectMaxPeriod[0]]).removeClass('ErrorPeriod');
            paramsModel.setPeriods(temporalPeriods[minPeriod], temporalPeriods[maxPeriod]);
        }
    });
    
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
    
    //if (_columns.length)
        //paramsModel.setColumnName(_columns[0].Name);
    
    var tr0 = $('<tr></tr>')
                .append($('<td></td>').text(_gtxt('Колонка даты')))
                .append($('<td></td>').append(selectDateColumn));
    
    var tr1 = $('<tr></tr>')
                .append($('<td></td>').text(_gtxt('Минимальный период')))
                .append($('<td></td>').append(selectMinPeriod));
                
    var tr2 = $('<tr></tr>')
                .append($('<td></td>').text(_gtxt('Максимальный период')))
                .append($('<td></td>').append(selectMaxPeriod));
    
    var propertiesTable = $('<table></table>').append(tr0).append(tr1).append(tr2).appendTo(parentDiv);
    propertiesTable.css('display', 'none');
	
    /**
        Обновляет список доступных для выбора колонок даты
        @param {String[]} columns массив имён колонок
    */
	this.updateColumns = function(columns)
	{
		_columns = columns;
		if (_columns.length == 0)
		{
			temporalCheckbox.attr('disabled', 'disabled');
			temporalCheckbox[0].checked = false;
			$(temporalCheckbox).change();
		}
		else
		{
			temporalCheckbox.removeAttr('disabled');
		}
		
		updateColumnsSelect();
	}
}



})();