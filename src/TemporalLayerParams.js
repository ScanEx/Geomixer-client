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
        var periods = [1, 16, 256],
            minPeriod = Number(this.attributes.minPeriod),
            maxPeriod = Number(this.attributes.maxPeriod);

            minPeriod = (minPeriod > 1 && minPeriod < 16) ? 16 : minPeriod;
            minPeriod = (minPeriod > 16 && minPeriod < 256) ? 256 : minPeriod;
            maxPeriod = (maxPeriod > 1 && maxPeriod < 16) ? 16 : maxPeriod;
            maxPeriod = (maxPeriod > 16 && maxPeriod < 256) ? 256 : maxPeriod;

        return periods.splice(periods.indexOf(minPeriod), periods.indexOf(maxPeriod) + 1).join(',');
    }
}, {PERIOD_STEP: 4});
