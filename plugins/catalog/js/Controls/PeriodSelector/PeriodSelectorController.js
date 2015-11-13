var nsCatalog = nsCatalog || {};
nsCatalog.Controls = nsCatalog.Controls || {};

(function($){
  var pluginPath = gmxCore.getModulePath();

  gmxCore.loadCSS(pluginPath + 'js/Controls/PeriodSelector/PeriodSelector.css');
  var PeriodSelector = function(targetButton) {
    this._view = null;
    this._button = targetButton;
    this._continueOpen = false;
    this._years = null;
    this._yearsSlider = null;
    this._monthsSlider = null;
    this._initialize();
  };

  PeriodSelector.prototype._initialize = function () {
    this._createDialog();
    this._button.mousemove(function() {
      this._continueOpen = true;
      setTimeout(function() { if (this._continueOpen) this._open(); }.bind(this), 500);
    }.bind(this));
    this._button.mouseout(function() { this._continueOpen = false; }.bind(this));
  };

  PeriodSelector.prototype._open = function () {
    this._view.show();
  };

  PeriodSelector.prototype._close = function () {
    this._view.hide();
  };

  PeriodSelector.prototype._createDialog = function () {
    this._view = $.create('div', { 'id':'periodSelector', 'class':'period-selector' });
    this._view.mouseleave(this._close.bind(this));
    this._initializeYearsSlider();
    this._initializeMonthsSlider();
    var buttonPosition = this._button.offset();
    this._view.appendTo($('body'))
    .css({ 'position':'absolute', 'top':buttonPosition.top + 'px', 'left':buttonPosition.left + 'px' })
    .hide();
  };

  PeriodSelector.prototype._initializeYearsSlider = function () {
    this._years = this._getYears();
    var sliderControls = this._createSlider('Год', this._years, [this._years.length - 5, this._years.length - 1], true);
    this._yearsSlider = sliderControls.slider;
    this._view.append(sliderControls.container);
  };

  PeriodSelector.prototype._initializeMonthsSlider = function () {
    var sliderControls = this._createSlider('Месяц', this._getMonths(), [0, 11]);
    this._monthsSlider = sliderControls.slider;
    this._view.append(sliderControls.container);
  };

  PeriodSelector.prototype._createSlider = function (title, values, selected, withTicks) {
    var container = $.create('div', { 'style':'padding:3px 0;' });
    var sliderContainer = $.create('div', { 'class':'slider-container' });
    var selectedPeriodContainer = $.create('span', { 'class':'selected-period' });
    container.append($.create('span', { 'class':'row-title' }, title))
    .append(selectedPeriodContainer)
    .append(sliderContainer);

    var sliderValues = values;
    var onSlide = function(event, ui) {
      selectedPeriodContainer.text(sliderValues[ui.values[0]].Text + ' - ' + sliderValues[ui.values[1]].Text);
    };
    $(sliderContainer).slider({
      range: true,
      min: 0,
      max: values.length-1,
      values: selected,
      slide: onSlide
    });
    if (withTicks) {
      this._addTicks(sliderContainer, values);
      sliderContainer.css({ 'margin-top':'20px' });
    }
    onSlide(null, { values:selected });
    return { container:container, slider:sliderContainer };
  };

  PeriodSelector.prototype._addTicks = function (target, values) {
    var width = 100 / (values.length-1);
    var left = -(width/2);
    for (var key in values) {
      var tick = values[key];
      $.create('div', { 'class':'tick', 'style':'left:' + left + '%;width:'+ width + '%' }, tick.Text).appendTo(target);
      left += width;
    }
  };

  PeriodSelector.prototype._getYears = function () {
    var result = [];
    var todayYear = new Date().getFullYear();
    for (var year = todayYear-10, index = 0; year <= todayYear; ++year, ++index) {
      result[index] = {
        Name: 'year'+year,
        Value: year,
        Text: year+'',
        IsChecked: year > todayYear-4
      };
    }
    return result;
  };

  PeriodSelector.prototype._getMonths = function() {
    var result = [];
    for (var month = 0; month < 12; ++month) {
      result[month] = {
        Name: 'month'+month,
        Value: month,
        Text: $.datepicker.regional.ru.monthNames[month],
        IsChecked: true
      };
    }
    return result;
  };

  PeriodSelector.prototype.get_searchCriteria = function() {
    var years = this._yearsSlider.slider('values');
    var months = this._monthsSlider.slider('values');
    return {
      queryType: 'box',
      dateStart: new Date(this._years[years[0]].Value, months[0], 1),
      dateEnd: new Date(this._years[years[1]].Value, months[1], 1),
      isYearly: true
    };
  };

  nsCatalog.Controls.PeriodSelector = PeriodSelector;

}(jQuery));
