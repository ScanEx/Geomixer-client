var nsGmx = window.nsGmx = window.nsGmx || {};
//<div class="alertWidget-message ui-state-{{type}}">{{message}}</div>
nsGmx.AlertWidget = nsGmx.GmxWidget.extend({
    className: 'alertWidget ui-widget',
    constructor: function() {
        this.collection = new Backbone.Collection();
        nsGmx.GmxWidget.apply(this, arguments);
    },
    initialize: function() {
        this.collection.on('add remove update', this.render, this);
        var msg = this._getMessageObject(arguments);
        if (msg) {
            this.collection.add(msg);
        }
    },
    // Вывести сообщение об ошибке
    // type может быть 'error' или 'warning'
    // push({ message: 'something wrong', type: 'warning', timeout: 200 }) или
    // push('something wrong', 'warning', 200)
    push: function() {
        var msg = this._getMessageObject(arguments);
        if (msg) {
            this.collection.add(msg);
        }
    },
    // удалить все сообщения
    clear: function() {
        this.collection.reset();
    },
    render: function() {
        this.$el.empty();
        for (var i = 0; i < this.collection.length; i++) {
            var m = this.collection.at(i);
            $('<div>')
                .addClass('alertWidget-message')
                .addClass('ui-state-' + m.get('type'))
                .html(m.get('message'))
                .appendTo(this.$el);
        }
        return this;
    },
    _getMessageObject: function(args) {
        if (args.length === 0 || !args[0]) {
            return null;
        } else if (args.length === 1) {
            return {
                message: args[0].message,
                type: args[0].type === 'warning' ? 'highlight' : 'error',
                timeout: args[0].timeout
            };
        } else {
            return {
                message: args[0],
                type: (args[1] && args[1] === 'warning') ? 'highlight' : 'error',
                timeout: args[2]
            };
        }
    }
});