var nsGmx = window.nsGmx = window.nsGmx || {};

nsGmx.PlainTextWidget = nsGmx.GmxWidget.extend({
    initialize: function(txt) {
        this.setText(txt);
        this.$el.on('click', function () {
            this.trigger('click')
        }.bind(this));
    },
    getText: function () {
        return this.$el.html();
    },
    setText: function (txt) {
        this.$el.html(txt);
    }
});
