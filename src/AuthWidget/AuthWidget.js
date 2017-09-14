var nsGmx = window.nsGmx = window.nsGmx || {};

nsGmx.AuthWidget = (function() {

    // options.loginDialog
    var AuthWidget = function(options) {
        this._view = $('<div>');
        this._view.addClass('authWidget ui-widget');
        this._authManager = options.authManager;
        this._userInfo = null;

        this._options = $.extend({
            showAccountLink: true,
            accountLink: 'http://my.kosmosnimki.ru/Home/Settings/',
            showMapLink: true,
            changePassword: false
                /* mapLink */
        }, options);

        this._authManager.getUserInfo().then(function(response) {
            this._render({
                login: response.Result && response.Result.Login,
                userName: response.Result && (response.Result.FullName || response.Result.Nickname || response.Result.Login)
            });
            this._userInfo = response.Result;
            $(this).trigger('ready');
        }.bind(this)).fail(function(response) {
            this._render(response);
        }.bind(this));
    };

    AuthWidget.prototype._render = function(vm) {
        var self = this;

        this._view.html(Handlebars.compile(nsGmx.Templates.AuthWidget.authWidget)(vm));

        if (vm.userName) {
            var dropdownItems = [];

            if (this._options.showAccountLink) {
                dropdownItems.push({
                    title: nsGmx.Translations.getText('auth.myAccount'),
                    link: this._options.accountLink,
                    id: 'AuthWidgetAccountLink',
                    newWindow: true
                });
            }

            if (this._options.showMapLink) {
                var defaultMapLink = 'http://maps.kosmosnimki.ru/api/index.html?' + encodeURIComponent('@' + vm.login);
                dropdownItems.push({
                    title: nsGmx.Translations.getText('auth.myMap'),
                    link: this._options.mapLink || defaultMapLink,
                    id: 'AuthWidgetMapLink',
                    newWindow: true
                });
            }

            if (this._options.changePassword) {
                dropdownItems.push({
                    title: nsGmx.Translations.getText('auth.changePassword'),
                    className: 'authWidget-changePasswordButton'
                });
            }

            if (this._options.isAdmin) {
                dropdownItems.push({
                    title: nsGmx.Translations.getText('Системные настройки'),
                    link: 'http://maps.kosmosnimki.ru/Administration/Actions.aspx'
                });

                dropdownItems.push({
                    title: nsGmx.Translations.getText('Управление группами'),
                    link: 'javascript:void(0)',
                    className: 'authWidget-usergroupMenuItem'
                });
            }

            dropdownItems.push({
                title: nsGmx.Translations.getText('auth.logout'),
                className: 'authWidget-logoutButton'
            })

            var dropdownMenuWidget = new nsGmx.DropdownMenuWidget({
                items: [{
                    title: vm.userName,
                    dropdown: dropdownItems
                }]
            });

            dropdownMenuWidget.appendTo(this._view.find('.authWidget-userPanel-userMenuCell'));
        }

        this._view.find('.authWidget-usergroupMenuItem').click(function(e) {
            if (this._options.callbacks && 'authWidget-usergroupMenuItem' in this._options.callbacks) {
                this._options.callbacks['authWidget-usergroupMenuItem']();
            } else {
                return false;
            }
        }.bind(this));

        this._view.find('.authWidget-changePasswordButton').click(function(e) {
            var native = this._authManager.getNative();
            native.changePasswordDialog();
        }.bind(this));

        this._view.find('.authWidget-loginButton').click(function(e) {
            var $iframeContainer;
            if (this._options.loginDialog) {
                $iframeContainer = $('<div>').addClass('authWidget-iframeContainer');
                var dialog = $iframeContainer.dialog({
                    width: 500,
                    height: 450,
                    closeText: nsGmx.Translations.getText('auth.closeDialog'),
                    close: function(je, ui) {
                        $(this).dialog('destroy');
                    }
                });
                // HACK:
                $(dialog).parent().find('button.ui-button').addClass('ui-icon').css('outline', 'none')
            }

            this._authManager.login({
                iframeContainer: $iframeContainer && $iframeContainer[0]
            });
        }.bind(this));

        this._view.find('.authWidget-logoutButton').click(function(e) {
            this._authManager.logout().then(function(response) {
                this._render(response);
                this._userInfo = response.Result;
                $(this).trigger('logout');
            }.bind(this));
        }.bind(this));
    };

    /** Получить информацию о пользователе, которую вернул AuthManager
     * @return {Object}
     */
    AuthWidget.prototype.getUserInfo = function() {
        return this._userInfo;
    };

    AuthWidget.prototype.on = function(eventName, callback) {
        $(this).on(eventName, callback);
    };

    AuthWidget.prototype.appendTo = function(placeholder) {
        placeholder.append(this._view);
    };

    return AuthWidget;
})();
