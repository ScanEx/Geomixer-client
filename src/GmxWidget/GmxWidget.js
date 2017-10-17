var nsGmx = window.nsGmx = window.nsGmx || {};

nsGmx.GmxWidgetMixin = {
    getContainer: function() {
        return this.el || this._container;
    },
    appendTo: function(el) {
        el = el[0] || el;
        el.appendChild(this.getContainer());
    },
    show: function() {
        var el = this.getContainer();
        el.style.display = (this._previousStyleDisplayValue !== 'none' && this._previousStyleDisplayValue) || 'block';
        delete this._previousStyleDisplayValue;
    },
    hide: function() {
        var el = this.getContainer();
        this._previousStyleDisplayValue = el.style.display;
        el.style.display = 'none';
    },
    _terminateMouseEvents: function(el) {
        el = el || this.getContainer();
        L.DomEvent.disableClickPropagation(el);
        el.addEventListener('mousewheel', L.DomEvent.stopPropagation);
        el.addEventListener('mousemove', L.DomEvent.stopPropagation);
    }
}

nsGmx.GmxWidget = Backbone.View.extend(nsGmx.GmxWidgetMixin);
