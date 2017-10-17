var nsGmx = window.nsGmx = window.nsGmx || {};

nsGmx.DropdownMenuWidget = (function() {
    var DropdownMenuWidget = function(options) {
        var h = Handlebars.create();
        h.registerPartial('anchor', nsGmx.Templates.DropdownMenuWidget.anchor);
        this._view = $(h.compile(nsGmx.Templates.DropdownMenuWidget.dropdownMenuWidget)({
            items: options.items
        }));
        this._view.find('.dropdownMenuWidget-itemDropdown').hide();

        var mouseTimeout = options.mouseTimeout || 100;
        this._view.find('.dropdownMenuWidget-item').each(function(index) {
            var mouseIsOver = false;
            $(this).on('mouseenter', function(je) {
                mouseIsOver = true;
                setTimeout(function() {
                    if (mouseIsOver) {
                        $(je.currentTarget).find('.dropdownMenuWidget-itemDropdown').show();
                    }
                }, 100);
            });
            $(this).on('mouseleave', function(je) {
                mouseIsOver = false;
                $(je.currentTarget).find('.dropdownMenuWidget-itemDropdown').hide();
            });
        });
    };

    DropdownMenuWidget.prototype.appendTo = function(placeholder) {
        $(placeholder).append(this._view);
    };

    return DropdownMenuWidget;
})();