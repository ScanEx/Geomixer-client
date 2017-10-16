var nsGmx = window.nsGmx = window.nsGmx || {};

// <String>options.title
// <String>options.className
// <String>options.trigger (hover|click|manual)
// <String>options.direction (down|up)
// <Boolean>options.adjustWidth
// <Boolean>options.showTopItem
nsGmx.DropdownWidget = nsGmx.GmxWidget.extend({
    className: 'dropdownWidget dropdownWidget-item',

    options: {
        title: '',
        trigger: 'hover',
        direction: 'down',
        adjustWidth: true,
        showTopItem: true,
        titleClassName: ''
    },

    initialize: function(options) {
        this.options = _.extend(this.options, options);
        this.$titleContainer = $('<div>')
            .addClass('dropdownWidget-dropdownTitle')
            .addClass(options.titleClassName)
            .html(this.options.title)
            .appendTo(this.$el);
        this.$dropdownContainer = $('<div>')
            .addClass('dropdownWidget-dropdown')
            .hide()
            .appendTo(this.$el);
        this.$dropdownTitle = $('<div>')
            .addClass('dropdownWidget-item dropdownWidget-dropdownTitle')
            .addClass(options.titleClassName)
            .html(this.options.title)
            .appendTo(this.$dropdownContainer);

        if (!this.options.showTopItem) {
            this.$dropdownTitle.hide();
        }

        if (this.options.trigger === 'hover') {
            this.$dropdownTitle.addClass('ui-state-disabled');
            this.$titleContainer.on('mouseover', function(je) {
                this.expand();
            }.bind(this));
            this.$dropdownContainer.on('mouseleave', function(je) {
                this.collapse();
            }.bind(this));
        } else if (this.options.trigger === 'click') {
            this.$titleContainer.on('click', function(je) {
                this.expand();
            }.bind(this));
            this.$dropdownTitle.on('click', function(je) {
                this.collapse();
            }.bind(this));
        }

        if (this.options.direction === 'up') {
            this.$el.addClass('dropdownWidget_direction-up');
        } else {
            this.$el.addClass('dropdownWidget_direction-down');
        }

        this._items = {};
    },

    addItem: function(id, inst, position) {
        this._items[id] = inst;
        var $container = $('<div>')
            .addClass('dropdownWidget-item dropdownWidget-dropdownItem')
            .attr('data-id', id)
            .attr('data-position', position)
            .on('click', function(je) {
                this.trigger('item', $(je.currentTarget).attr('data-id'));
                this.trigger('item:' + $(je.currentTarget).attr('data-id'));
                if (this.options.trigger === 'click') {
                    this.collapse();
                }
            }.bind(this));
        $container.append(inst.el);
        this.$dropdownContainer.append($container);
        this._sortItems()
    },

    setTitle: function(title) {
        this.$titleContainer.html(title);
        this.$dropdownTitle.html(title);
    },

    toggle: function() {
        this._expanded ? this.collapse() : this.expand();
        this._expanded = !this._expanded;
    },

    expand: function() {
        this.$dropdownContainer.css('min-width', this.$el.width());
        this.$dropdownContainer.show();
        this.trigger('expand');
    },

    collapse: function() {
        this.$dropdownContainer.hide();
        this.trigger('collapse');
    },

    reset: function() {
        this.collapse();
    },

    _sortItems: function() {
        var containerEl = this.$dropdownContainer[0];
        var items = Array.prototype.slice.call(containerEl.children);

        var titleEl = items.splice(
            items.indexOf($(containerEl).find('.dropdownWidget-dropdownTitle')[0]), 1
        );

        while (items.length) {
            var maxPositionIndex = items.indexOf(_.max(items, function(el) {
                return el.getAttribute('data-position') / 1;
            }));
            $(containerEl).prepend(items.splice(maxPositionIndex, 1)[0]);
        }

        if (this.options.direction === 'up') {
            $(containerEl).append(titleEl);
        } else {
            $(containerEl).prepend(titleEl);
        }
    }
});
