nsGmx.QuicklookParams = Backbone.Model.extend({
    initialize: function(quicklookString) {
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
    toServerString: function() {
        //$.extend чтобы удалить undefined поля
        return this.attributes.template ? JSON.stringify($.extend({}, this.attributes)) : '';
    }
});