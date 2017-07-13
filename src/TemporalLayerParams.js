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
        maxPeriod: 64,
        columnName: null
    },

    /** Возвращает строчку с перечислением временнЫх периодов (для передачи серверу) */
    getPeriodString: function() {
        var minPeriod = this.attributes.minPeriod,
            maxPeriod = this.attributes.maxPeriod,
            curPeriod = minPeriod,
            periods = [];

        while (curPeriod <= maxPeriod)
        {
            periods.push(curPeriod);
            curPeriod *= nsGmx.TemporalLayerParams.PERIOD_STEP;
        }
        return periods.join(',');
    }
}, {PERIOD_STEP: 4});
