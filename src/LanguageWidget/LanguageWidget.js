var nsGmx = window.nsGmx = window.nsGmx || {};

nsGmx.LanguageWidget = (function() {
    'use strict';

    var LanguageWidget = function(options) {
        this._view = $(Handlebars.compile(nsGmx.Templates.LanguageWidget.layout)({
            eng: nsGmx.Translations.getLanguage() === 'eng',
            rus: nsGmx.Translations.getLanguage() === 'rus'
        }));

        if (nsGmx.Translations.getLanguage() !== 'eng') {
            this._view.find('.languageWidget-item_eng').click(function() {
                nsGmx.Translations.updateLanguageCookies('eng');
                // присвоение url не работает, если есть #
                window.location.reload(false);
            });
        }

        if (nsGmx.Translations.getLanguage() !== 'rus') {
            this._view.find('.languageWidget-item_rus').click(function() {
                nsGmx.Translations.updateLanguageCookies('rus');
                window.location.reload(false);
            });
        }
    };

    LanguageWidget.prototype.appendTo = function(placeholder) {
        $(placeholder).append(this._view);
    };

    return LanguageWidget;
})();
