/** Связанные с квиклуками параметры векторных слоёв. Умеет сериализовать/десериализовать себя в строку для хранения на сервере.
 * @class
 * @memberOf nsGmx
 * @extends Backbone.Model
 * @property {String} template Шаблон URL квиклука
 * @property {Number} minZoom Минимальный зум показа квиклуков
 * @property {Number} X1-X4,Y1-Y4 Названия полей слоя, в которых хранятся координаты привязки 4 углов изображения. Если не указаны, будут использованы значения по умолчанию (поля "X1"-"X4", "Y1"-"Y4" или их аналоги в нижнем регистре)
 */
nsGmx.QuicklookParams = Backbone.Model.extend({
    /** Загружает параметры из строки с сервера.
     * @param {String} quicklookString Строка с параметрами с сервера
     */
    fromServerString: function(quicklookString) {
        if (quicklookString) {
            //раньше это была просто строка с шаблоном квиклука, а теперь стало JSON'ом
            if (quicklookString[0] === '{') {
                var p = JSON.parse(quicklookString);
                this.set({
                    template: p.template,
                    minZoom: p.minZoom,
                    X1: p.X1, Y1: p.Y1,
                    X2: p.X2, Y2: p.Y2,
                    X3: p.X3, Y3: p.Y3,
                    X4: p.X4, Y4: p.Y4
                });
            } else {
                this.set({
                    template: quicklookString
                });
            }
        }
    },
    /** Сохраняет все параметры в строку, которую можно передать серверу.
     * @return {String}
     */
    toServerString: function() {
        //$.extend чтобы удалить undefined поля
        return this.attributes.template ? JSON.stringify($.extend({}, this.attributes)) : '';
    }
});
