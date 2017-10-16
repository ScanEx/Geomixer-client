var nsGmx = window.nsGmx = window.nsGmx || {};

nsGmx.HeaderWidget = (function() {
    'use strict';

    var SocialShareWidget = function(socials) {
        this._view = Handlebars.compile(nsGmx.Templates.HeaderWidget.socials)(socials);
    };

    SocialShareWidget.prototype.appendTo = function(placeholder) {
        $(placeholder).append(this._view);
    };

    var HeaderWidget = function(options) {
        var addDots = function(item) {
            if (!item.icon && !item.className) {
                item.className = item.className + ' headerWidget-menuDot';
            }
            return item;
        };

        var h = Handlebars.create();
        this._view = $(h.compile(nsGmx.Templates.HeaderWidget.layout)(options));
        if (nsGmx.DropdownMenuWidget) {
            (new nsGmx.DropdownMenuWidget({
                items: options.leftLinks && options.leftLinks.map(addDots)
            })).appendTo(this._view.find('.headerWidget-leftLinksContainer'));
            (new nsGmx.DropdownMenuWidget({
                items: options.rightLinks && options.rightLinks.map(addDots)
            })).appendTo(this._view.find('.headerWidget-rightLinksContainer'));
        } else {
            console.warn('DropdownMenuWidget not found');
        }
        (new SocialShareWidget(options.socials)).appendTo(this._view.find('.headerWidget-socialsContainer'));
        this._view.find(".headerWidget-authContainer").hide();
        this._view.find(".headerWidget-menuContainer").hide();
        this._view.find(".headerWidget-searchContainer").hide();
        this._view.find(".headerWidget-languageContainer").hide();
        if (!options.socials) {
            this._view.find(".headerWidget-socialsContainer").hide();
        }
    };

    HeaderWidget.prototype.appendTo = function(placeholder) {
        $(placeholder).append(this._view);
    };

    HeaderWidget.prototype.getAuthPlaceholder = function() {
        return this._view.find(".headerWidget-authContainer").show();
    };

    HeaderWidget.prototype.getMenuPlaceholder = function() {
        return this._view.find(".headerWidget-menuContainer").show();
    };

    HeaderWidget.prototype.getSearchPlaceholder = function() {
        return this._view.find(".headerWidget-searchContainer").show();
    };

    HeaderWidget.prototype.getLanguagePlaceholder = function() {
        return this._view.find(".headerWidget-languageContainer").show();
    };

    HeaderWidget.prototype.getSocialsPlaceholder = function(first_argument) {
        return this._view.find(".headerWidget-socialsContainer");
    };

    return HeaderWidget;
})();