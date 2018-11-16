/*!
 * Lightweight URL manipulation with JavaScript
 * This library is independent of any other libraries and has pretty simple
 * interface and lightweight code-base.
 * Some ideas of query string parsing had been taken from Jan Wolter
 * @see http://unixpapa.com/js/querystring.html
 *
 * @license MIT
 * @author Mykhailo Stadnyk <mikhus@gmail.com>
 */
(function (ns) {
    'use strict';

    // configure given url options
    function urlConfig (url) {
        var config = {
            path: true,
            query: true,
            hash: true
        };

        if (!url) {
            return config;
        }

        if (/^[a-z]+:/.test(url)) {
            config.protocol = true;
            config.host = true;

            if (/[-a-z0-9]+(\.[-a-z0-9])*:\d+/i.test(url)) {
                config.port = true;
            }

            if (/\/\/(.*?)(?::(.*?))?@/.test(url)) {
                config.user = true;
                config.pass = true;
            }
        }

        return config;
    }

    var isNode = typeof window === 'undefined' &&
        typeof global !== 'undefined' &&
        typeof require === 'function';

    // Trick to bypass Webpack's require at compile time
    var nodeRequire = isNode ? ns['require'] : null;

    // mapping between what we want and <a> element properties
    var map = {
        protocol: 'protocol',
        host: 'hostname',
        port: 'port',
        path: 'pathname',
        query: 'search',
        hash: 'hash'
    };

    // jscs: disable
    /**
     * default ports as defined by http://url.spec.whatwg.org/#default-port
     * We need them to fix IE behavior, @see https://github.com/Mikhus/jsurl/issues/2
     */
    // jscs: enable
    var defaultPorts = {
        ftp: 21,
        gopher: 70,
        http: 80,
        https: 443,
        ws: 80,
        wss: 443
    };

    var _currNodeUrl;
    function getCurrUrl() {
        if (isNode) {
            if (!_currNodeUrl) {
                _currNodeUrl = ('file://' +
                    (process.platform.match(/^win/i) ? '/' : '') +
                    nodeRequire('fs').realpathSync('.')
                );
            }
            return _currNodeUrl;
        } else {
            return document.location.href;
        }
    }

    function parse (self, url, absolutize) {
        var link, i, auth;

        if (!url) {
            url = getCurrUrl();
        }

        if (isNode) {
            link = nodeRequire('url').parse(url);
        }

        else {
            link = document.createElement('a');
            link.href = url;
        }

        var config = urlConfig(url);

        auth = url.match(/\/\/(.*?)(?::(.*?))?@/) || [];

        for (i in map) {
            if (config[i]) {
                self[i] = link[map[i]] || '';
            }

            else {
                self[i] = '';
            }
        }

        // fix-up some parts
        self.protocol = self.protocol.replace(/:$/, '');
        self.query = self.query.replace(/^\?/, '');
        self.hash = decode(self.hash.replace(/^#/, ''));
        self.user = decode(auth[1] || '');
        self.pass = decode(auth[2] || '');
        /* jshint ignore:start */
        self.port = (
            // loosely compare because port can be a string
            defaultPorts[self.protocol] == self.port || self.port == 0
        ) ? '' : self.port; // IE fix, Android browser fix
        /* jshint ignore:end */

        if (!config.protocol && /[^/#?]/.test(url.charAt(0))) {
            self.path = url.split('?')[0].split('#')[0];
        }

        if (!config.protocol && absolutize) {
            // is IE and path is relative
            var base = new Url(getCurrUrl().match(/(.*\/)/)[0]);
            var basePath = base.path.split('/');
            var selfPath = self.path.split('/');
            var props = ['protocol', 'user', 'pass', 'host', 'port'];
            var s = props.length;

            basePath.pop();

            for (i = 0; i < s; i++) {
                self[props[i]] = base[props[i]];
            }

            while (selfPath[0] === '..') { // skip all "../
                basePath.pop();
                selfPath.shift();
            }

            self.path =
                (url.charAt(0) !== '/' ? basePath.join('/') : '') +
                '/' + selfPath.join('/')
            ;
        }

        self.path = self.path.replace(/^\/{2,}/, '/');

        self.paths(self.paths());

        self.query = new QueryString(self.query);
    }

    function encode (s) {
        return encodeURIComponent(s).replace(/'/g, '%27');
    }

    function decode (s) {
        s = s.replace(/\+/g, ' ');

        s = s.replace(/%([ef][0-9a-f])%([89ab][0-9a-f])%([89ab][0-9a-f])/gi,
            function (code, hex1, hex2, hex3) {
                var n1 = parseInt(hex1, 16) - 0xE0;
                var n2 = parseInt(hex2, 16) - 0x80;

                if (n1 === 0 && n2 < 32) {
                    return code;
                }

                var n3 = parseInt(hex3, 16) - 0x80;
                var n = (n1 << 12) + (n2 << 6) + n3;

                if (n > 0xFFFF) {
                    return code;
                }

                return String.fromCharCode(n);
            }
        );

        s = s.replace(/%([cd][0-9a-f])%([89ab][0-9a-f])/gi,
            function (code, hex1, hex2) {
                var n1 = parseInt(hex1, 16) - 0xC0;

                if (n1 < 2) {
                    return code;
                }

                var n2 = parseInt(hex2, 16) - 0x80;

                return String.fromCharCode((n1 << 6) + n2);
            }
        );

        return s.replace(/%([0-7][0-9a-f])/gi,
            function (code, hex) {
                return String.fromCharCode(parseInt(hex, 16));
            }
        );
    }

    /**
     * Class QueryString
     *
     * @param {string} qs - string representation of QueryString
     * @constructor
     */
    function QueryString (qs) {
        var re = /([^=&]+)(=([^&]*))?/g;
        var match;

        while ((match = re.exec(qs))) {
            var key = decodeURIComponent(match[1].replace(/\+/g, ' '));
            var value = match[3] ? decode(match[3]) : '';

            if (!(this[key] === undefined || this[key] === null)) {
                if (!(this[key] instanceof Array)) {
                    this[key] = [this[key]];
                }

                this[key].push(value);
            }

            else {
                this[key] = value;
            }
        }
    }

    /**
     * Converts QueryString object back to string representation
     *
     * @returns {string}
     */
    QueryString.prototype.toString = function () {
        var s = '';
        var e = encode;
        var i, ii;

        for (i in this) {
            if (this[i] instanceof Function || this[i] === null) {
                continue;
            }

            if (this[i] instanceof Array) {
                var len = this[i].length;

                if (len) {
                    for (ii = 0; ii < len; ii++) {
                        s += s ? '&' : '';
                        s += e(i) + '=' + e(this[i][ii]);
                    }
                }

                else {
                    // parameter is an empty array, so treat as
                    // an empty argument
                    s += (s ? '&' : '') + e(i) + '=';
                }
            }

            else {
                s += s ? '&' : '';
                s += e(i) + '=' + e(this[i]);
            }
        }

        return s;
    };

    /**
     * Class Url
     *
     * @param {string} [url] - string URL representation
     * @param {boolean} [noTransform] - do not transform to absolute URL
     * @constructor
     */
    function Url (url, noTransform) {
        parse(this, url, !noTransform);
    }

    /**
     * Clears QueryString, making it contain no params at all
     *
     * @returns {Url}
     */
    Url.prototype.clearQuery = function () {
        for (var key in this.query) {
            if (!(this.query[key] instanceof Function)) {
                delete this.query[key];
            }
        }

        return this;
    };

    /**
     * Returns total number of parameters in QueryString
     *
     * @returns {number}
     */
    Url.prototype.queryLength = function () {
        var count = 0;
        var key;

        for (key in this) {
            if (!(this[key] instanceof Function)) {
                count++;
            }
        }

        return count;
    };

    /**
     * Returns true if QueryString contains no parameters, false otherwise
     *
     * @returns {boolean}
     */
    Url.prototype.isEmptyQuery = function () {
        return this.queryLength() === 0;
    };

    /**
     *
     * @param {Array} [paths] - an array pf path parts (if given will modify
     *                          Url.path property
     * @returns {Array} - an array representation of the Url.path property
     */
    Url.prototype.paths = function (paths) {
        var prefix = '';
        var i = 0;
        var s;

        if (paths && paths.length && paths + '' !== paths) {
            if (this.isAbsolute()) {
                prefix = '/';
            }

            for (s = paths.length; i < s; i++) {
                paths[i] = !i && paths[i].match(/^\w:$/) ? paths[i] :
                    encode(paths[i]);
            }

            this.path = prefix + paths.join('/');
        }

        paths = (this.path.charAt(0) === '/' ?
            this.path.slice(1) : this.path).split('/');

        for (i = 0, s = paths.length; i < s; i++) {
            paths[i] = decode(paths[i]);
        }

        return paths;
    };

    /**
     * Performs URL-specific encoding of the given string
     *
     * @method Url#encode
     * @param {string} s - string to encode
     * @returns {string}
     */
    Url.prototype.encode = encode;

    /**
     * Performs URL-specific decoding of the given encoded string
     *
     * @method Url#decode
     * @param {string} s - string to decode
     * @returns {string}
     */
    Url.prototype.decode = decode;

    /**
     * Checks if current URL is an absolute resource locator (globally absolute
     * or absolute path to current server)
     *
     * @returns {boolean}
     */
    Url.prototype.isAbsolute = function () {
        return this.protocol || this.path.charAt(0) === '/';
    };

    /**
     * Returns string representation of current Url object
     *
     * @returns {string}
     */
    Url.prototype.toString = function () {
        return (
            (this.protocol && (this.protocol + '://')) +
            (this.user && (
            encode(this.user) + (this.pass && (':' + encode(this.pass))
            ) + '@')) +
            (this.host && this.host) +
            (this.port && (':' + this.port)) +
            (this.path && this.path) +
            (this.query.toString() && ('?' + this.query)) +
            (this.hash && ('#' + encode(this.hash)))
        );
    };

    ns[ns.exports ? 'exports' : 'Url'] = Url;
}(typeof module !== 'undefined' && module.exports ? module : window));

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

var nsGmx = window.nsGmx = window.nsGmx || {};nsGmx.Templates = nsGmx.Templates || {};nsGmx.Templates.DropdownMenuWidget = {};
nsGmx.Templates.DropdownMenuWidget["dropdownMenuWidget"] = "<div class=\"dropdownMenuWidget ui-widget\">\n" +
    "    {{#each items}}\n" +
    "    <div class=\"dropdownMenuWidget-item{{#if className}} {{className}}{{/if}}\">\n" +
    "        <a\n" +
    "            {{#if id}}id=\"{{id}}\"{{/if}}\n" +
    "            {{#if link}}href=\"{{link}}\"{{else}}href=\"javascript:void(0)\"{{/if}}\n" +
    "            {{#if newWindow}}{{#if link}}target=\"_blank\"{{/if}}{{/if}}\n" +
    "            class=\"dropdownMenuWidget-itemAnchor{{#if newWindow}} dropdownMenuWidget-itemAnchor_newWindow{{/if}}\"\n" +
    "        >\n" +
    "            {{#if icon}}\n" +
    "                <img src=\"{{icon}}\" />\n" +
    "            {{/if}}\n" +
    "            {{#if fonticon}}\n" +
    "                <i class=\"{{fonticon}}\"></i>\n" +
    "            {{/if}}\n" +
    "            {{#if title}}\n" +
    "                <span>{{title}}</span>\n" +
    "                {{#if dropdown}}<i class=\"icon-angle-down\"></i>{{/if}}\n" +
    "            {{/if}}\n" +
    "        </a>\n" +
    "        {{#if dropdown}}\n" +
    "            <div class=\"dropdownMenuWidget-itemDropdown\">\n" +
    "                <ul class=\"dropdownMenuWidget-dropdownMenu\">\n" +
    "                    {{#each dropdown}}\n" +
    "                        <li class=\"dropdownMenuWidget-dropdownMenuItem{{#if className}} {{className}}{{/if}}\">\n" +
    "                            {{#if newWindow}}<div class=\"ui-icon ui-icon-newwin dropdownMenuWidget-dropdownMenuIcon\"></div>{{/if}}\n" +
    "                            <a\n" +
    "                                {{#if id}}id=\"{{id}}\"{{/if}}\n" +
    "                                {{#if link}}href=\"{{link}}\"{{else}}href=\"javascript:void(0)\"{{/if}}\n" +
    "                                {{#if newWindow}}{{#if link}}target=\"_blank\"{{/if}}{{/if}}\n" +
    "                                class=\"dropdownMenuWidget-dropdownItemAnchor{{#if newWindow}} dropdownMenuWidget-dropdownItemAnchor_newWindow{{/if}}\"\n" +
    "                            >\n" +
    "                                {{#if icon}}\n" +
    "                                    <img src=\"{{icon}}\" />\n" +
    "                                {{/if}}\n" +
    "                                {{#if title}}\n" +
    "                                    <span>{{title}}</span>\n" +
    "                                {{/if}}\n" +
    "                            </a>\n" +
    "                        </li>\n" +
    "                    {{/each}}\n" +
    "                </ul>\n" +
    "            </div>\n" +
    "        {{/if}}\n" +
    "    </div>\n" +
    "    {{/each}}\n" +
    "</div>\n" +
    "";
nsGmx.Templates.DropdownMenuWidget["anchor"] = "<a \n" +
    "    {{#if id}}id=\"{{id}}\"{{/if}}\n" +
    "    {{#if link}}href=\"{{link}}\"{{else}}href=\"javascript:void(0)\"{{/if}}\n" +
    "    {{#if newWindow}}target=\"_blank\" class=\"dropdownMenuWidget-anchor_newWindow\"{{/if}}\n" +
    ">\n" +
    "    {{#if icon}}\n" +
    "        <img src=\"{{icon}}\" />\n" +
    "    {{/if}}\n" +
    "    {{#if title}}\n" +
    "        <span>{{title}}</span>\n" +
    "    {{/if}}\n" +
    "</a>";;
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
;
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
;
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
})();;
var nsGmx = window.nsGmx = window.nsGmx || {};nsGmx.Templates = nsGmx.Templates || {};nsGmx.Templates.AuthWidget = {};
nsGmx.Templates.AuthWidget["authWidget"] = "{{#if userName}}\n" +
    "    <div class=\"authWidget_authorized\">\n" +
    "        <div class=\"authWidget-userPanel\">\n" +
    "            <div class=\"authWidget-userPanel-iconCell\">\n" +
    "                <div class=\"authWidget-userPanel-userIcon\"></div>\n" +
    "            </div>\n" +
    "            <div class=\"authWidget-userPanel-userMenuCell\"></div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "{{else}}\n" +
    "\n" +
    "    <div class=\"authWidget_unauthorized\">\n" +
    "        <div class=\"authWidget-userPanel\">\n" +
    "            <div class=\"authWidget-userPanel-iconCell\">\n" +
    "                <div class=\"authWidget-userPanel-userIcon\"></div>\n" +
    "            </div>\n" +
    "            <div class=\"authWidget-loginButton\">\n" +
    "                {{i 'auth.login'}}\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "{{/if}}\n" +
    "";;
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
                    link: window.serverBase + 'Administration/Actions.aspx',
                    id: 'AuthWidgetAdminLink',
                    newWindow: true
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
;
var nsGmx = window.nsGmx;

nsGmx.Translations.addText('rus', {
	auth: {
		'login': 'Войти',
		'logout': 'Выйти',
		'myAccount': 'Личный кабинет',
        'changePassword': 'Сменить пароль',
		'myMap': 'Личная карта',
		'closeDialog': 'Закрыть'
	}
});

nsGmx.Translations.addText('eng', {
	auth: {
		'login': 'Login',
		'logout': 'Logout',
		'myAccount': 'My account',
        'changePassword': 'Change password',
		'myMap': 'My map',
		'closeDialog': 'Close'
	}
});
;
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
;
var nsGmx = window.nsGmx = window.nsGmx || {};nsGmx.Templates = nsGmx.Templates || {};nsGmx.Templates.LanguageWidget = {};
nsGmx.Templates.LanguageWidget["layout"] = "<div class=\"languageWidget ui-widget\">\n" +
    "    <div class=\"languageWidget-item languageWidget-item_rus\"><span class=\"{{^rus}}link languageWidget-link{{/rus}}{{#rus}}languageWidget-disabled{{/rus}}\">Ru</span></div>\n" +
    "    <div class=\"languageWidget-item languageWidget-item_eng\"><span class=\"{{^eng}}link languageWidget-link{{/eng}}{{#eng}}languageWidget-disabled{{/eng}}\">En</span></div>\n" +
    "</div>";;
var nsGmx = window.nsGmx = window.nsGmx || {};nsGmx.Templates = nsGmx.Templates || {};nsGmx.Templates.HeaderWidget = {};
nsGmx.Templates.HeaderWidget["layout"] = "<div class=\"headerWidget\">\n" +
    "    <div class=\"headerWidget-left\">\n" +
    "        <div class=\"headerWidget-logoContainer\">\n" +
    "            <img class=\"headerWidget-logo\" src=\"{{logo}}\" />\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    <div class=\"headerWidget-right\">\n" +
    "        <div class=\"headerWidget-bar headerWidget-controlsBar\">\n" +
    "            <div class=\"headerWidget-barTable headerWidget-controlsBarTable\">\n" +
    "                <div class=\"headerWidget-barCell headerWidget-menuContainer\"></div>\n" +
    "                <div class=\"headerWidget-barCell headerWidget-authContainer\"></div>\n" +
    "                <div class=\"headerWidget-barCell headerWidget-languageContainer\"></div>\n" +
    "            </div>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "";
nsGmx.Templates.HeaderWidget["socials"] = "<div class=\"headerWidget-socialIcons\">\n" +
    "    {{#if vk}}\n" +
    "        <div class=\"headerWidget-socialIconCell\"><a href=\"{{vk}}\" target=\"_blank\"><i class=\"icon-vk\"></i></a></div>\n" +
    "    {{/if}}\n" +
    "    {{#if facebook}}\n" +
    "        <div class=\"headerWidget-socialIconCell\"><a href=\"{{facebook}}\" target=\"_blank\"><i class=\"icon-facebook\"></i></a></div>\n" +
    "    {{/if}}\n" +
    "    {{#if twitter}}\n" +
    "        <div class=\"headerWidget-socialIconCell\"><a href=\"{{twitter}}\" target=\"_blank\"><i class=\"icon-twitter\"></i></a></div>\n" +
    "    {{/if}}\n" +
    "</div>";;
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
})();;
nsGmx.Translations.addText('rus', {
    header: {
        'langRu': 'Ru',
        'langEn': 'En'
    }
});

nsGmx.Translations.addText('eng', {
    header: {
        'langRu': 'Ru',
        'langEn': 'En'
    }
});;
nsGmx.TransparencySliderWidget = function(container) {
    var _this = this;
    var ui = $(Handlebars.compile(
		'<div class="leaflet-gmx-iconSvg leaflet-gmx-iconSvg-transparency svgIcon leaflet-control gmx-transslider-toggle-icon" title="{{i "TransparencySliderWidget.title"}}"><svg role="img" class="svgIcon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#transparency"></use></svg></div>' +
        '<div class = "gmx-transslider-container"></div>' +
        '<div class = "leaflet-gmx-iconSvg leaflet-gmx-iconSvg-transparency-eye svgIcon leaflet-gmx-iconSvg-active leaflet-control gmx-transslider-onoff" title="{{i "TransparencySliderWidget.onOffTitle"}}"><svg role="img" class="svgIcon gmx-transslider-hide"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#transparency-eye"></use></svg><svg role="img" class="svgIcon"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#transparency-eye-off"></use></svg></div>'
    )()).appendTo(container);

    var sliderContainer = container.find('.gmx-transslider-container');

    this._isCollapsed = true;

    container.find('.gmx-transslider-toggle-icon').click(function() {
        this._isCollapsed = !this._isCollapsed;
        sliderContainer.toggle(!this._isCollapsed);
        container.find('.gmx-transslider-onoff').toggle(!this._isCollapsed);
        container.find('.gmx-transslider-toggle-icon').toggleClass('leaflet-gmx-iconSvg-active', !this._isCollapsed);
    }.bind(this));

    var isOpaque = true;
    var updateOnOffIcon = function(value) {
        var isOpaqueNew = value === 1.0;
        if (isOpaqueNew !== isOpaque) {
            isOpaque = isOpaqueNew;
            var arr = container.find('.gmx-transslider-onoff')[0].childNodes;
			if (isOpaque) {
				L.DomUtil.removeClass(arr[1], 'gmx-transslider-hide');
				L.DomUtil.addClass(arr[0], 'gmx-transslider-hide');
			} else {
				L.DomUtil.removeClass(arr[0], 'gmx-transslider-hide');
				L.DomUtil.addClass(arr[1], 'gmx-transslider-hide');
			}
        }
    }

    sliderContainer.slider({
        range: 'min',
        min: 0.0,
        max: 1.0,
        step: 0.01,
        value: 1.0,
        change: function(event, ui) {
            $(_this).triggerHandler(event, ui);
            updateOnOffIcon(ui.value);
        },
        slide: function(event, ui) {
            $(_this).triggerHandler(event, ui);
            updateOnOffIcon(ui.value);
        }
    }).hide();

    // fix map moving in IE
    if (nsGmx.leafletMap) {
        var dragging = nsGmx.leafletMap.dragging;
        L.DomEvent
            .on(sliderContainer[0], 'mouseover', dragging.disable, dragging)
            .on(sliderContainer[0], 'mouseout', dragging.enable, dragging);
    }

    container.find('.gmx-transslider-onoff').click(function(){
        var curValue = sliderContainer.slider('value');
        sliderContainer.slider('value', curValue !== 1.0 ? 1.0 : 0.0);
    }).hide();

    container.on('mousedown click', function(event) {
        event.stopPropagation();
    });
}

nsGmx.TransparencySliderWidget.prototype.isCollapsed = function() {
    return this._isCollapsed;
}
;
nsGmx.Translations.addText('rus', { TransparencySliderWidget: {
    title: 'Прозрачность растровых слоёв',
    onOffTitle: 'Показать/скрыть растры'
}});
                         
nsGmx.Translations.addText("eng", { TransparencySliderWidget: {
    title: 'Raster layers transparency',
    onOffTitle: 'Show/hide rasters'
}});;
/* ========================================================================
 * Bootstrap: tooltip.js v3.3.1
 * http://getbootstrap.com/javascript/#tooltip
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // TOOLTIP PUBLIC CLASS DEFINITION
  // ===============================

  var Tooltip = function (element, options) {
    this.type       =
    this.options    =
    this.enabled    =
    this.timeout    =
    this.hoverState =
    this.$element   = null

    this.init('tooltip', element, options)
  }

  Tooltip.VERSION  = '3.3.1'

  Tooltip.TRANSITION_DURATION = 150

  Tooltip.DEFAULTS = {
    animation: true,
    placement: 'top',
    selector: false,
    template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
    trigger: 'hover focus',
    title: '',
    delay: 0,
    html: false,
    container: false,
    viewport: {
      selector: 'body',
      padding: 0
    }
  }

  Tooltip.prototype.init = function (type, element, options) {
    this.enabled   = true
    this.type      = type
    this.$element  = $(element)
    this.options   = this.getOptions(options)
    this.$viewport = this.options.viewport && $(this.options.viewport.selector || this.options.viewport)

    var triggers = this.options.trigger.split(' ')

    for (var i = triggers.length; i--;) {
      var trigger = triggers[i]

      if (trigger == 'click') {
        this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
      } else if (trigger != 'manual') {
        var eventIn  = trigger == 'hover' ? 'mouseenter' : 'focusin'
        var eventOut = trigger == 'hover' ? 'mouseleave' : 'focusout'

        this.$element.on(eventIn  + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
        this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
      }
    }

    this.options.selector ?
      (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
      this.fixTitle()
  }

  Tooltip.prototype.getDefaults = function () {
    return Tooltip.DEFAULTS
  }

  Tooltip.prototype.getOptions = function (options) {
    options = $.extend({}, this.getDefaults(), this.$element.data(), options)

    if (options.delay && typeof options.delay == 'number') {
      options.delay = {
        show: options.delay,
        hide: options.delay
      }
    }

    return options
  }

  Tooltip.prototype.getDelegateOptions = function () {
    var options  = {}
    var defaults = this.getDefaults()

    this._options && $.each(this._options, function (key, value) {
      if (defaults[key] != value) options[key] = value
    })

    return options
  }

  Tooltip.prototype.enter = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (self && self.$tip && self.$tip.is(':visible')) {
      self.hoverState = 'in'
      return
    }

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    clearTimeout(self.timeout)

    self.hoverState = 'in'

    if (!self.options.delay || !self.options.delay.show) return self.show()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'in') self.show()
    }, self.options.delay.show)
  }

  Tooltip.prototype.leave = function (obj) {
    var self = obj instanceof this.constructor ?
      obj : $(obj.currentTarget).data('bs.' + this.type)

    if (!self) {
      self = new this.constructor(obj.currentTarget, this.getDelegateOptions())
      $(obj.currentTarget).data('bs.' + this.type, self)
    }

    clearTimeout(self.timeout)

    self.hoverState = 'out'

    if (!self.options.delay || !self.options.delay.hide) return self.hide()

    self.timeout = setTimeout(function () {
      if (self.hoverState == 'out') self.hide()
    }, self.options.delay.hide)
  }

  Tooltip.prototype.show = function () {
    var that = this;
    if (this.hasContent() && this.enabled) {
      this._toBeShown = true;
      this._preloadImages().then(function() {
        if (that._toBeShown) {
          that.doShow();
        }
      });
    }
  }

  Tooltip.prototype._preloadImages = function() {
    var that = this;
    
    var $images = $('<div>').html(that.getContent()).find('img');
    var srcs = Array.prototype.slice.apply($images).map(function(el) {
      return el.src;
    });

    var promises = srcs.map(function(src) {
      return $.Deferred(function(def) {
        var img = new Image();
        img.addEventListener('load', function() {
          def.resolve();
        });
        img.addEventListener('error', function() {
          def.reject();
        });
        img.src = src;
      }).promise();
    });

    return $.when.apply(null, promises);
  }

  Tooltip.prototype.doShow = function () {
      var e = $.Event('show.bs.' + this.type)

      this.$element.trigger(e)

      var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0])
      if (e.isDefaultPrevented() || !inDom) return
      var that = this

      var $tip = this.tip()

      var tipId = this.getUID(this.type)

      this.setContent()

      $tip.attr('id', tipId)
      this.$element.attr('aria-describedby', tipId)

      if (this.options.animation) $tip.addClass('fade')

      var placement = typeof this.options.placement == 'function' ?
        this.options.placement.call(this, $tip[0], this.$element[0]) :
        this.options.placement

      var autoToken = /\s?auto?\s?/i
      var autoPlace = autoToken.test(placement)
      if (autoPlace) placement = placement.replace(autoToken, '') || 'top'

      $tip
        .detach()
        .css({ top: 0, left: 0, display: 'block' })
        .addClass(placement)
        .data('bs.' + this.type, this)

      this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

      var pos          = this.getPosition()
      var actualWidth  = $tip[0].offsetWidth
      var actualHeight = $tip[0].offsetHeight

      if (autoPlace) {
        var orgPlacement = placement
        var $container   = this.options.container ? $(this.options.container) : this.$element.parent()
        var containerDim = this.getPosition($container)

        placement = placement == 'bottom' && pos.bottom + actualHeight > containerDim.bottom ? 'top'    :
                    placement == 'top'    && pos.top    - actualHeight < containerDim.top    ? 'bottom' :
                    placement == 'right'  && pos.right  + actualWidth  > containerDim.width  ? 'left'   :
                    placement == 'left'   && pos.left   - actualWidth  < containerDim.left   ? 'right'  :
                    placement

        $tip
          .removeClass(orgPlacement)
          .addClass(placement)
      }

      var calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight)

      this.applyPlacement(calculatedOffset, placement)

      var complete = function () {
        var prevHoverState = that.hoverState
        that.$element.trigger('shown.bs.' + that.type)
        that.hoverState = null

        if (prevHoverState == 'out') that.leave(that)
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        $tip
          .one('bsTransitionEnd', complete)
          .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
        complete()
  }

  Tooltip.prototype.applyPlacement = function (offset, placement) {
    var $tip   = this.tip()
    var width  = $tip[0].offsetWidth
    var height = $tip[0].offsetHeight

    // manually read margins because getBoundingClientRect includes difference
    var marginTop = parseInt($tip.css('margin-top'), 10)
    var marginLeft = parseInt($tip.css('margin-left'), 10)

    // we must check for NaN for ie 8/9
    if (isNaN(marginTop))  marginTop  = 0
    if (isNaN(marginLeft)) marginLeft = 0

    offset.top  = offset.top  + marginTop
    offset.left = offset.left + marginLeft

    // $.fn.offset doesn't round pixel values
    // so we use setOffset directly with our own function B-0
    $.offset.setOffset($tip[0], $.extend({
      using: function (props) {
        $tip.css({
          top: Math.round(props.top),
          left: Math.round(props.left)
        })
      }
    }, offset), 0)

    $tip.addClass('in')

    // check to see if placing tip in new offset caused the tip to resize itself
    var actualWidth  = $tip[0].offsetWidth
    var actualHeight = $tip[0].offsetHeight

    if (placement == 'top' && actualHeight != height) {
      offset.top = offset.top + height - actualHeight
    }

    var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight)

    if (delta.left) offset.left += delta.left
    else offset.top += delta.top

    var isVertical          = /top|bottom/.test(placement)
    var arrowDelta          = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight
    var arrowOffsetPosition = isVertical ? 'offsetWidth' : 'offsetHeight'

    $tip.offset(offset)
    this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical)
  }

  Tooltip.prototype.replaceArrow = function (delta, dimension, isHorizontal) {
    this.arrow()
      .css(isHorizontal ? 'left' : 'top', 50 * (1 - delta / dimension) + '%')
      .css(isHorizontal ? 'top' : 'left', '')
  }

  Tooltip.prototype.setContent = function () {
    var $tip  = this.tip()
    var title = this.getTitle()

    $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
    $tip.removeClass('fade in top bottom left right')
  }

  Tooltip.prototype.hide = function (callback) {
    var that = this
    var $tip = this.tip()
    var e    = $.Event('hide.bs.' + this.type)

    this._toBeShown = false;

    function complete() {
      if (that.hoverState != 'in') $tip.detach()
      that.$element
        .removeAttr('aria-describedby')
        .trigger('hidden.bs.' + that.type)
      callback && callback()
    }

    this.$element.trigger(e)

    if (e.isDefaultPrevented()) return

    $tip.removeClass('in')

    $.support.transition && this.$tip.hasClass('fade') ?
      $tip
        .one('bsTransitionEnd', complete)
        .emulateTransitionEnd(Tooltip.TRANSITION_DURATION) :
      complete()

    this.hoverState = null

    return this
  }

  Tooltip.prototype.fixTitle = function () {
    var $e = this.$element
    if ($e.attr('title') || typeof ($e.attr('data-original-title')) != 'string') {
      $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
    }
  }

  Tooltip.prototype.hasContent = function () {
    return this.getTitle()
  }

  Tooltip.prototype.getPosition = function ($element) {
    $element   = $element || this.$element

    var el     = $element[0]
    var isBody = el.tagName == 'BODY'

    var elRect    = el.getBoundingClientRect()
    if (elRect.width == null) {
      // width and height are missing in IE8, so compute them manually; see https://github.com/twbs/bootstrap/issues/14093
      elRect = $.extend({}, elRect, { width: elRect.right - elRect.left, height: elRect.bottom - elRect.top })
    }
    var elOffset  = isBody ? { top: 0, left: 0 } : $element.offset()
    var scroll    = { scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop() }
    var outerDims = isBody ? { width: $(window).width(), height: $(window).height() } : null

    return $.extend({}, elRect, scroll, outerDims, elOffset)
  }

  Tooltip.prototype.getCalculatedOffset = function (placement, pos, actualWidth, actualHeight) {
    return placement == 'bottom' ? { top: pos.top + pos.height,   left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'top'    ? { top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2  } :
           placement == 'left'   ? { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth } :
        /* placement == 'right' */ { top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width   }

  }

  Tooltip.prototype.getViewportAdjustedDelta = function (placement, pos, actualWidth, actualHeight) {
    var delta = { top: 0, left: 0 }
    if (!this.$viewport) return delta

    var viewportPadding = this.options.viewport && this.options.viewport.padding || 0
    var viewportDimensions = this.getPosition(this.$viewport)

    if (/right|left/.test(placement)) {
      var topEdgeOffset    = pos.top - viewportPadding - viewportDimensions.scroll
      var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight
      if (topEdgeOffset < viewportDimensions.top) { // top overflow
        delta.top = viewportDimensions.top - topEdgeOffset
      } else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) { // bottom overflow
        delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
      }
    } else {
      var leftEdgeOffset  = pos.left - viewportPadding
      var rightEdgeOffset = pos.left + viewportPadding + actualWidth
      if (leftEdgeOffset < viewportDimensions.left) { // left overflow
        delta.left = viewportDimensions.left - leftEdgeOffset
      } else if (rightEdgeOffset > viewportDimensions.width) { // right overflow
        delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
      }
    }

    return delta
  }

  Tooltip.prototype.getTitle = function () {
    var title
    var $e = this.$element
    var o  = this.options

    title = $e.attr('data-original-title')
      || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

    return title
  }

  Tooltip.prototype.getUID = function (prefix) {
    do prefix += ~~(Math.random() * 1000000)
    while (document.getElementById(prefix))
    return prefix
  }

  Tooltip.prototype.tip = function () {
    return (this.$tip = this.$tip || $(this.options.template))
  }

  Tooltip.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.tooltip-arrow'))
  }

  Tooltip.prototype.enable = function () {
    this.enabled = true
  }

  Tooltip.prototype.disable = function () {
    this.enabled = false
  }

  Tooltip.prototype.toggleEnabled = function () {
    this.enabled = !this.enabled
  }

  Tooltip.prototype.toggle = function (e) {
    var self = this
    if (e) {
      self = $(e.currentTarget).data('bs.' + this.type)
      if (!self) {
        self = new this.constructor(e.currentTarget, this.getDelegateOptions())
        $(e.currentTarget).data('bs.' + this.type, self)
      }
    }

    self.tip().hasClass('in') ? self.leave(self) : self.enter(self)
  }

  Tooltip.prototype.destroy = function () {
    var that = this
    clearTimeout(this.timeout)
    this.hide(function () {
      that.$element.off('.' + that.type).removeData('bs.' + that.type)
    })
  }


  // TOOLTIP PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this    = $(this)
      var data     = $this.data('bs.tooltip')
      var options  = typeof option == 'object' && option
      var selector = options && options.selector

      if (!data && option == 'destroy') return
      if (selector) {
        if (!data) $this.data('bs.tooltip', (data = {}))
        if (!data[selector]) data[selector] = new Tooltip(this, options)
      } else {
        if (!data) $this.data('bs.tooltip', (data = new Tooltip(this, options)))
      }
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.tooltip

  $.fn.tooltip             = Plugin
  $.fn.tooltip.Constructor = Tooltip


  // TOOLTIP NO CONFLICT
  // ===================

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(jQuery);

/* ========================================================================
 * Bootstrap: popover.js v3.3.1
 * http://getbootstrap.com/javascript/#popovers
 * ========================================================================
 * Copyright 2011-2014 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // POPOVER PUBLIC CLASS DEFINITION
  // ===============================

  var Popover = function (element, options) {
    this.init('popover', element, options)
  }

  if (!$.fn.tooltip) throw new Error('Popover requires tooltip.js')

  Popover.VERSION  = '3.3.1'

  Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
    placement: 'right',
    trigger: 'click',
    content: '',
    template: '<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>'
  })


  // NOTE: POPOVER EXTENDS tooltip.js
  // ================================

  Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype)

  Popover.prototype.constructor = Popover

  Popover.prototype.getDefaults = function () {
    return Popover.DEFAULTS
  }

  Popover.prototype.setContent = function () {
    var $tip    = this.tip()
    var title   = this.getTitle()
    var content = this.getContent()

    $tip.find('.popover-title')[this.options.html ? 'html' : 'text'](title)
    $tip.find('.popover-content').children().detach().end()[ // we use append for html objects to maintain js events
      this.options.html ? (typeof content == 'string' ? 'html' : 'append') : 'text'
    ](content)

    $tip.removeClass('fade top bottom left right in')

    // IE8 doesn't accept hiding via the `:empty` pseudo selector, we have to do
    // this manually by checking the contents.
    if (!$tip.find('.popover-title').html()) $tip.find('.popover-title').hide()
  }

  Popover.prototype.hasContent = function () {
    return this.getTitle() || this.getContent()
  }

  Popover.prototype.getContent = function () {
    var $e = this.$element
    var o  = this.options

    return $e.attr('data-content')
      || (typeof o.content == 'function' ?
            o.content.call($e[0]) :
            o.content)
  }

  Popover.prototype.arrow = function () {
    return (this.$arrow = this.$arrow || this.tip().find('.arrow'))
  }

  Popover.prototype.tip = function () {
    if (!this.$tip) this.$tip = $(this.options.template)
    return this.$tip
  }


  // POPOVER PLUGIN DEFINITION
  // =========================

  function Plugin(option) {
    return this.each(function () {
      var $this    = $(this)
      var data     = $this.data('bs.popover')
      var options  = typeof option == 'object' && option
      var selector = options && options.selector

      if (!data && option == 'destroy') return
      if (selector) {
        if (!data) $this.data('bs.popover', (data = {}))
        if (!data[selector]) data[selector] = new Popover(this, options)
      } else {
        if (!data) $this.data('bs.popover', (data = new Popover(this, options)))
      }
      if (typeof option == 'string') data[option]()
    })
  }

  var old = $.fn.popover

  $.fn.popover             = Plugin
  $.fn.popover.Constructor = Popover


  // POPOVER NO CONFLICT
  // ===================

  $.fn.popover.noConflict = function () {
    $.fn.popover = old
    return this
  }

}(jQuery);

(function (factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory()
    } else {
        window.nsGmx = window.nsGmx || {}
        window.nsGmx.DateInterval = factory()
    }
})(function() {
    var DateInterval = window.Backbone.Model.extend({
        initialize: function() {
            if (!('dateBegin' in this.attributes) && !('dateEnd' in this.attributes)) {
                this.set(DateInterval.getUTCDayBoundary());
            }
        },

        saveState: function() {
            return {
                version: '1.1.0',
                dateBegin: +this.attributes.dateBegin,
                dateEnd: +this.attributes.dateEnd
            }
        },

        loadState: function(state) {
            if (!state.version || state.version === '1.1.0' || state.version === '1.0.0') {
                this.set({
                    dateBegin: new Date(state.dateBegin),
                    dateEnd: new Date(state.dateEnd)
                })
            } else {
                throw 'Unknown state version';
            }
        }
    }, {
        //number of milliseconds in one day
        MS_IN_DAY: 24*3600*1000,

        //set time to UTC midnight
        toMidnight: function(date) {
            return new Date(date - date % DateInterval.MS_IN_DAY);
        },

        getUTCDayBoundary: function(date) {
            date = date || new Date();

            var midnight = DateInterval.toMidnight(date);
            return {
                dateBegin: midnight,
                dateEnd: new Date(midnight.valueOf() + DateInterval.MS_IN_DAY)
            }
        },

        // 24+n interval
        defaultFireDateInterval: function() {
            var now = new Date(),
                lastMidnight = DateInterval.toMidnight(now),
                dateEnd = new Date((now - 1) - (now - 1) % (3600*1000) + 3600*1000), //round to the nearest hour greater then 'now'
                isTooSmall = dateEnd - lastMidnight < 12*3600*1000,
                dateBegin = new Date(isTooSmall ? (lastMidnight - nsGmx.DateInterval.MS_IN_DAY) : lastMidnight.valueOf());

            return {
                dateBegin: dateBegin,
                dateEnd: dateEnd
            }
        }
    })

    return DateInterval
})

var nsGmx = window.nsGmx = window.nsGmx || {};nsGmx.Templates = nsGmx.Templates || {};nsGmx.Templates.CalendarWidget = {};
nsGmx.Templates.CalendarWidget["CalendarWidget"] = "<table>\n" +
    "    <tr>\n" +
    "        <td><div class = \"CalendarWidget-iconScrollLeft ui-helper-noselect icon-left-open\"></div></td>\n" +
    "        <td class = \"CalendarWidget-inputCell\"><input class = \"gmx-input-text CalendarWidget-dateBegin\"></td>\n" +
    "        <td class = \"CalendarWidget-inputCell CalendarWidget-onlyMaxVersion\"><input class = \"gmx-input-text CalendarWidget-dateEnd\"></td>\n" +
    "        <td><div class = \"CalendarWidget-iconScrollRight ui-helper-noselect icon-right-open\" ></div></td>\n" +
    "        <td><div class = \"CalendarWidget-iconMore {{moreIconClass}}\" title = \"{{moreIconTitle}}\"></div></td>\n" +
    "        <td><div class = \"CalendarWidget-forecast\" hidden>{{forecast}}</div></td>\n" +
    "    </tr><tr>\n" +
    "        <td></td>\n" +
    "        <td class = \"CalendarWidget-dateBeginInfo\"></td>\n" +
    "        <td class = \"CalendarWidget-dateEndInfo\"></td>\n" +
    "        <td></td>\n" +
    "        <td></td>\n" +
    "    </tr>\n" +
    "</table>\n" +
    "<div class=\"CalendarWidget-footer\"></div>\n" +
    "";;
var nsGmx = window.nsGmx = window.nsGmx || {};

(function($){

'use strict';

var _gtxt = nsGmx.Translations.getText.bind(nsGmx.Translations),
    toMidnight = nsGmx.DateInterval.toMidnight;

/** Параметры календаря
 * @typedef nsGmx.CalendarWidget~Parameters
 * @property {nsGmx.DateInterval} dateInterval Временной интервал, который нужно менять
 * @property {Date} [dateMin] минимальная граничная дата для календарей, null - без ограничений
 * @property {Date} [dateMax] максимальная граничная дата для календарей, null - без ограничений
 * @property {String} [dateFormat='dd.mm.yy'] формат даты
 * @property {bool} [minimized=true] показывать ли минимизированный или развёрнутый виджет в начале
 * @property {bool} [showSwitcher=true] показывать ли иконку для разворачивания/сворачивания периода
 * @property {Date} [dateBegin=<текущая дата>] начальная дата интервала
 * @property {Date} [dateEnd=<текущая дата>] конечная дата интервала
 * @property {String|DOMNode} [container] куда добавлять календарик
 * @property {String} [buttonImage] URL иконки для активации календариков
 */

/** Контрол для задания диапазона дат. Даты календарика всегда в UTC, а не в текущем поясе.
 @description Виджет для выбора интервала дат. Пользователь при помощи datepicker'ов выбирает два дня (год, месяц, число),
              затем выбранные значения при помощи ф-ции `_updateModel()` переводятся в интервал дат ({@link nsGmx.DateInterval}).
              Так же виджет реагирует на изменения модели (с использованием ф-ции `_updateWidget()`)
 @alias nsGmx.CalendarWidget
 @extends nsGmx.GmxWidget
 @class
 @param {nsGmx.CalendarWidget~Parameters} options Параметры календаря
*/
var Calendar = nsGmx.GmxWidget.extend({
    tagName: 'div',
    className: 'CalendarWidget ui-widget',
    template: Handlebars.compile(nsGmx.Templates.CalendarWidget.CalendarWidget),

    events: {
        'click .CalendarWidget-iconMore': 'toggleMode',
        'click .CalendarWidget-iconScrollLeft': function() {
            this._shiftDates(-1);
        },
        'click .CalendarWidget-iconScrollRight': function() {
            this._shiftDates(1);
        }
    },

    initialize: function(options) {
        options = $.extend({
            minimized: true,
            showSwitcher: true,
            dateMax: null,
            dateMin: null,
            dateFormat: 'dd.mm.yy',
            name: null
        }, options);

        this._dateMin = options.dateMin;
        this._dateMax = options.dateMax;

        this._dateInterval = options.dateInterval;

        this.$el.html(this.template({
            moreIconClass: options.minimized ? 'icon-calendar' : 'icon-calendar-empty',
            moreIconTitle: options.minimized ? _gtxt('CalendarWidget.ExtendedViewTitle') : _gtxt('CalendarWidget.MinimalViewTitle'),
            forecast: _gtxt('CalendarWidget.forecast')
        }));

        this._moreIcon = this.$('.CalendarWidget-iconMore')
            .toggle(!!options.showSwitcher);

        this._dateBegin = this.$('.CalendarWidget-dateBegin');
        this._dateEnd = this.$('.CalendarWidget-dateEnd');
        this._dateInputs = this._dateBegin.add(this._dateEnd);

        this._dateInputs.datepicker({
            onSelect: function(dateText, inst){
                this._selectFunc(inst.input);
                this._updateModel();
            }.bind(this),
            showAnim: 'fadeIn',
            changeMonth: true,
            changeYear: true,
            minDate: this._dateMin ? Calendar.toUTC(this._dateMin) : null,
            maxDate: this._dateMax ? Calendar.toUTC(this._dateMax) : null,
            dateFormat: options.dateFormat,
            defaultDate: Calendar.toUTC(this._dateMax || new Date()),
            showOn: options.buttonImage ? 'both' : 'focus',
            buttonImageOnly: true
        });

        //устанавливаем опцию после того, как добавили календарик в canvas
        if (options.buttonImage) {
            this._dateInputs.datepicker('option', 'buttonImage', options.buttonImage);
        }

        this.$('.CalendarWidget-onlyMaxVersion').toggle(!options.minimized);

        options.dateBegin && this._dateBegin.datepicker('setDate', Calendar.toUTC(options.dateBegin));
        options.dateEnd && this._dateEnd.datepicker('setDate', Calendar.toUTC(options.dateEnd));

        if (options.container) {
            if (typeof options.container === 'string')
                $('#' + options.container).append(this.$el);
            else
                $(options.container).append(this.$el);
        }

        this.setMode(options.minimized ? Calendar.SIMPLE_MODE : Calendar.ADVANCED_MODE);

        this._updateWidget();

        this._dateInterval.on('change', this._updateWidget, this);

        //for backward compatibility
        this.canvas = this.$el;
    },

    _shiftDates: function(delta) {
        var dateBegin = this.getDateBegin(),
            dateEnd = this.getDateEnd();

        if (!dateBegin || !dateEnd) {
            return;
        }

        var shift = (dateEnd - dateBegin + nsGmx.DateInterval.MS_IN_DAY) * delta,
            newDateBegin = new Date(dateBegin.valueOf() + shift),
            newDateEnd = new Date(dateEnd.valueOf() + shift);

        if ((!this._dateMin || toMidnight(this._dateMin) <= toMidnight(newDateBegin)) &&
            (!this._dateMax || toMidnight(this._dateMax) >= toMidnight(newDateEnd)))
        {
            this._dateBegin.datepicker('setDate', Calendar.toUTC(newDateBegin));
            this._dateEnd.datepicker('setDate', Calendar.toUTC(newDateEnd));

            this._updateModel();
        }
    },

    _selectFunc: function(activeInput) {
        var begin = this._dateBegin.datepicker('getDate');
        var end   = this._dateEnd.datepicker('getDate');

        if (end && begin && begin > end) {
            var dateToFix = activeInput[0] == this._dateEnd[0] ? this._dateBegin : this._dateEnd;
            dateToFix.datepicker('setDate', $(activeInput[0]).datepicker('getDate'));
        } else if (this._curMode === Calendar.SIMPLE_MODE) {
            //либо установлена только одна дата, либо две, но отличающиеся
            if (!begin != !end || begin && begin.valueOf() !== end.valueOf()) {
                this._dateEnd.datepicker('setDate', this._dateBegin.datepicker('getDate'));
            }
        }
    },

    _updateModel: function() {
        var dateBegin = this.getDateBegin(),
            dateEnd = this.getDateEnd();

        this._dateInterval.set({
            dateBegin: dateBegin ? toMidnight(dateBegin) : null,
            dateEnd: dateEnd ? toMidnight(dateEnd.valueOf() + nsGmx.DateInterval.MS_IN_DAY) : null
        });
    },

    _updateWidget: function() {
        var dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            dayms = nsGmx.DateInterval.MS_IN_DAY;

        if (!dateBegin || !dateEnd) {
            return;
        };

        var isValid = !(dateBegin % dayms) && !(dateEnd % dayms);

        var newDateBegin = Calendar.toUTC(dateBegin),
            newDateEnd;
        if (isValid) {
            newDateEnd = Calendar.toUTC(new Date(dateEnd - dayms));
            if (dateEnd - dateBegin > dayms) {
                this.setMode(Calendar.ADVANCED_MODE);
            }
        } else {
            newDateEnd = Calendar.toUTC(dateEnd);
            this.setMode(Calendar.ADVANCED_MODE);
        }

        //если мы сюда пришли после выбора интервала в самом виджете, вызов setDate сохраняет фокус на input-поле
        //возможно, это какая-то проблема jQueryUI.datepicker'ов.
        //чтобы этого избежать, явно проверяем, нужно ли изменять дату
        var prevDateBegin = this._dateBegin.datepicker('getDate'),
            prevDateEnd = this._dateEnd.datepicker('getDate');

        if (!prevDateBegin || prevDateBegin.valueOf() !== newDateBegin.valueOf()) {
            this._dateBegin.datepicker('setDate', newDateBegin);
        }

        if (!prevDateEnd || prevDateEnd.valueOf() !== newDateEnd.valueOf()) {
            this._dateEnd.datepicker('setDate', newDateEnd);
        }
    },

    //public interface

    /** Закрыть все открытые datepicker'ы.
     * @return {nsGmx.CalendarWidget} this
     */
    reset: function() {
        this._dateInputs.datepicker('hide');
        return this;
    },

    /** Сериализация состояния виджета
     * @return {Object} Сериализованное состояние
     */
    saveState: function() {
        return {
            version: '1.1.0',
            vismode: this.getMode()
        }
    },

    /** Восстановить состояние виджета по сериализованным данным
     * @param {Object} data Сериализованное состояние календарика
     */
    loadState: function( data ) {
        this.setMode(data.vismode);
    },

    /** Получить начальную дату
     * @return {Date} начальная дата
     */
    getDateBegin: function() {
        return Calendar.fromUTC(this._dateBegin.datepicker('getDate'));
    },

    /** Получить конечную дату
     * @return {Date} конечная дата
     */
    getDateEnd: function() {
        return Calendar.fromUTC(this._dateEnd.datepicker('getDate'));
    },

    /** Получить верхнюю границу возможных дат периода
     * @return {Date} верхняя граница возможных периодов
     */
    getDateMax: function() {
        return this._dateMax;
    },

    /** Получить нижнуюю границу возможных дат периода
     * @return {Date} нижняя граница возможных периодов
     */
    getDateMin: function() {
        return this._dateMin;
    },

    /** Установить нижнуюю границу возможных дат периода
     * @param {Date} dateMin нижняя граница возможных периодов
     */
    setDateMin: function(dateMin) {
        this._dateMin = dateMin;
        this._dateInputs.datepicker('option', 'minDate', dateMin ? Calendar.toUTC(dateMin) : null);
    },

    /** Установить верхнюю границу возможных дат периода
     * @param {Date} dateMax верхняя граница возможных периодов
     */
    setDateMax: function(dateMax) {
        var titleContainer = this.$('.CalendarWidget-forecast');

        this._dateMax = dateMax;
        if (dateMax) {
            var utcDate = Calendar.toUTC(dateMax);
            this._dateInputs.datepicker('option', 'maxDate', utcDate);

            if (dateMax > new Date()) {
                $(titleContainer).attr('title', _gtxt('CalendarWidget.tooltip') + ' ' +
                ('0' + dateMax.getDate()).slice(-2) + '.' +
                ('0' + (dateMax.getMonth() + 1)).slice(-2) + '.' +
                dateMax.getFullYear());
                $(titleContainer).show();
            } else {
                $(titleContainer).hide();
            }

        } else {
            this._dateInputs.datepicker('option', 'maxDate', null);
        }
    },

    setSwitcherVisibility: function(isVisible) {
        this._moreIcon && this._moreIcon.toggle(isVisible);
    },

    getDateInterval: function() {
        return this._dateInterval;
    },

    getMode: function() {
        return this._curMode;
    },

    setMode: function(mode) {
        if (this._curMode === mode) {
            return this;
        }

        this.reset();

        this._curMode = mode;
        var isSimple = mode === Calendar.SIMPLE_MODE;

        this.$('.CalendarWidget-onlyMaxVersion').toggle(!isSimple);

        this._moreIcon
            .toggleClass('icon-calendar', isSimple)
            .toggleClass('icon-calendar-empty', !isSimple)
            .attr('title', isSimple ? _gtxt('CalendarWidget.ExtendedViewTitle') : _gtxt('CalendarWidget.MinimalViewTitle'));


        var dateBegin = this._dateBegin.datepicker('getDate'),
            dateEnd = this._dateEnd.datepicker('getDate');

        if (isSimple && dateBegin && dateEnd && dateBegin.valueOf() !== dateEnd.valueOf()) {
            this._selectFunc(this._dateEnd);
            this._updateModel();
        }

        this.trigger('modechange');

        return this;
    },

    toggleMode: function() {
        this.setMode(this._curMode === Calendar.SIMPLE_MODE ? Calendar.ADVANCED_MODE : Calendar.SIMPLE_MODE );
    }
}, {
    /* static methods */
    fromUTC: function(date) {
        if (!date) return null;
        var timeOffset = date.getTimezoneOffset()*60*1000;
        return new Date(date.valueOf() - timeOffset);
    },
    toUTC: function(date) {
        if (!date) return null;
        var timeOffset = date.getTimezoneOffset()*60*1000;
        return new Date(date.valueOf() + timeOffset);
    },
    SIMPLE_MODE: 1,
    ADVANCED_MODE: 2
});

nsGmx.CalendarWidget = Calendar;

})(jQuery);
;
nsGmx.Translations.addText("rus", { CalendarWidget: {
    ExtendedViewTitle: "Выбор периода",
    MinimalViewTitle:  "Свернуть",
    UTC:               "Всемирное координированное время",
    forecast:           "прогноз",
    tooltip:            "доступны прогнозные данные до"
}});

nsGmx.Translations.addText("eng", { CalendarWidget: {
    ExtendedViewTitle: "Period selection",
    MinimalViewTitle:  "Minimize",
    UTC:               "Coordinated Universal Time",
    forecast:           "forecast",
    tooltip:            "forecast data is available up to"
}});
;
/** Контрол для задания диапазона дат с логикой работы, взятой с сайта fires.ru.
 @description Основное отличае в логине формировании интервала на основе выбранных в календариках дат.
              Работает так же, как и обычный виджет ({@link nsGmx.CalendarWidget}) за исключением ситуации, когда dateEnd попадает в текущие UTC сутки.
              В этом случае, dateEnd устанавливается равном началу следующего часа. Далее, если длина выбранного интервала меньше 12 часов, начало интервала смещается на сутки назад.
              Кроме формирования интервала, этот виджет показывает пользователю дополнительную информацию о выбранном интервале.
 @alias nsGmx.FireCalendarWidget
 @class
 @param {nsGmx.CalendarWidget~Parameters} params Параметры календаря
*/

var nsGmx = nsGmx || {};

(function($){

'use strict';

var toMidnight = nsGmx.DateInterval.toMidnight;

nsGmx.Translations.addText("rus", { FireCalendarWidget: {
    timeTitlePrefix : 'За ',
    timeTitleLastPrefix : 'За последние ',
    timeTitlePostfix : 'ч (UTC)'
}});

nsGmx.Translations.addText("eng", { FireCalendarWidget: {
    timeTitlePrefix : 'For ',
    timeTitleLastPrefix : 'For last ',
    timeTitlePostfix : 'h (UTC)'
}});


function f(n) {
    return n < 10 ? '0' + n : n;
}

function getStr (hours, minutes) {
    return f(hours) + ":" + f(minutes); /*+ ":" + f(time.seconds)*/
};

var FireCalendarWidget = nsGmx.CalendarWidget.extend({
    initialize: function(options) {
        options = $.extend({
            dateMax: new Date()
        }, options);

        nsGmx.CalendarWidget.prototype.initialize.call(this, options);

        this._dateInterval.on('change', this._updateInfo, this);
        this.on('modechange', this._updateInfo, this);
        this.on('modechange', this._updateModel, this);
        this._updateInfo();
    },

    _updateModel: function() {
        var dateBegin = this.getDateBegin(),
            origDateEnd = this.getDateEnd(),
            now = new Date(),
            lastMidnight = toMidnight(now),
            dateEnd;

        if (lastMidnight <= origDateEnd) {
            //last day
            dateEnd = new Date((now - 1) - (now - 1) % (3600*1000) + 3600*1000); //round to the nearest hour greater then 'now'

            if (dateEnd - toMidnight(dateBegin) < 12*3600*1000 && this.getMode() === nsGmx.CalendarWidget.SIMPLE_MODE) {
                dateBegin = new Date(dateBegin - nsGmx.DateInterval.MS_IN_DAY);
            }
        } else {
            //previous days
            dateEnd = new Date(origDateEnd.valueOf() + nsGmx.DateInterval.MS_IN_DAY);
        }

        this._dateInterval.set({
            dateBegin: toMidnight(dateBegin),
            dateEnd: dateEnd
        });
    },

    _updateWidget: function() {
        var dateBegin = +this._dateInterval.get('dateBegin'),
            dateEnd = +this._dateInterval.get('dateEnd');

        if (!dateBegin || !dateEnd) {
            return;
        };

        var currentDayMode = toMidnight(new Date()) < dateEnd;

        if (currentDayMode && this.getMode() === nsGmx.CalendarWidget.SIMPLE_MODE && dateEnd - dateBegin < 2 * nsGmx.DateInterval.MS_IN_DAY) {
            this._dateBegin.datepicker("setDate", nsGmx.CalendarWidget.toUTC(new Date()));
            this._dateEnd.datepicker("setDate", nsGmx.CalendarWidget.toUTC(new Date()));
        } else if (nsGmx.CalendarWidget1) {
            nsGmx.CalendarWidget1.prototype._updateWidget.call(this);
        } else {
            nsGmx.CalendarWidget.prototype._updateWidget.call(this);
        };
    },

    _updateInfo: function() {
        var isSimpleMode = this.getMode() === nsGmx.CalendarWidget.SIMPLE_MODE;

        this.$('.CalendarWidget-footer').toggle(isSimpleMode);
        this.$('.CalendarWidget-dateBeginInfo, .CalendarWidget-dateEndInfo').toggle(!isSimpleMode);

        var dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd');

        if (!dateBegin || !dateEnd) {
            return;
        }

        var hours = Math.ceil((dateEnd - dateBegin)/3600000);

        if (isSimpleMode) {
            var hoursStr = hours > 24 ? "24+" + (hours-24) : hours;
            var prefix = hours === 24 ? _gtxt("FireCalendarWidget.timeTitlePrefix") : _gtxt("FireCalendarWidget.timeTitleLastPrefix");

            this.$('.CalendarWidget-footer').html(prefix + hoursStr + _gtxt("FireCalendarWidget.timeTitlePostfix"));
        } else {
            var dateEndToShow = (hours % 24) === 0 ? new Date(+dateEnd - 1) : dateEnd; //hack to show 23:59 instead of 00:00
            this.$('.CalendarWidget-dateBeginInfo').text(getStr(dateBegin.getUTCHours(), dateBegin.getUTCMinutes()) + " (UTC)").attr('title', _gtxt('CalendarWidget.UTC'));
            this.$('.CalendarWidget-dateEndInfo'  ).text(getStr(dateEndToShow.getUTCHours(), dateEndToShow.getUTCMinutes()) + " (UTC)").attr('title', _gtxt('CalendarWidget.UTC'));

        }
    }
}, {
    defaultFireDateInterval: function() {
        var now = new Date(),
            lastMidnight = toMidnight(now),
            dateEnd = new Date((now - 1) - (now - 1) % (3600*1000) + 3600*1000), //round to the nearest hour greater then 'now'
            isTooSmall = dateEnd - lastMidnight < 12*3600*1000,
            dateBegin = new Date(isTooSmall ? (lastMidnight - nsGmx.DateInterval.MS_IN_DAY) : lastMidnight.valueOf());

        return {
            dateBegin: dateBegin,
            dateEnd: dateEnd
        }
    }
});

nsGmx.FireCalendarWidget = FireCalendarWidget;

})(jQuery);
;
(function($){

'use strict';

var _gtxt = nsGmx.Translations.getText.bind(nsGmx.Translations),
    toMidnight = nsGmx.DateInterval.toMidnight;


    nsGmx.Translations.addText("rus", { CalendarWidget: {
        ShowIconTitle:     "Выбрать дату",
        createDateInterval: "Задать интервал",
        resetDateInterval:  "Сбросить интервал",
        selectDateInterval: "Применить",
        hour:               "ч.",
        from: "с",
        to: "до"
    }});

    nsGmx.Translations.addText("eng", { CalendarWidget: {
        ShowIconTitle:     "Select date",
        createDateInterval: "Create date interval",
        resetDateInterval:  "Reset date interval",
        selectDateInterval: "Select date interval",
        hour:               "h.",
        from: "from",
        to: "to"
    }});

    var template = '' +
        '<div>' +
            '<div class = "CalendarWidget-row CalendarWidget-dates">' +
                // dates block
                '<span class = "CalendarWidget-iconScrollLeft icon-left-open"></span>' +
                '<span class = "CalendarWidget-dates-outside">' +
                    '<span class = "CalendarWidget-inputCell CalendarWidget-inputCell-inputBegin">' +
                    '<input class = "CalendarWidget-dateBegin">' +
                    '</span>' +
                    '<span class = "CalendarWidget-inputCell CalendarWidget-inputCell-inputMiddle">-</span>' +
                    '<span class = "CalendarWidget-inputCell CalendarWidget-inputCell-inputEnd">' +
                    '<input class = "CalendarWidget-dateEnd">' +
                    '</span>' +
                '</span>' +
                '<span class = "CalendarWidget-iconScrollRight ui-helper-noselect icon-right-open"></span>' +
                // space between dates and time
                '<span class = "CalendarWidget-space"></span>' +
                // times block
                '<span class = "CalendarWidget-timeicon"><img src="img/time-icon-01.svg"></img></span>' +
                '<span class = "CalendarWidget-inputCell CalendarWidget-inputCell-inputTimeBegin"><input class = "CalendarWidget-timeInput CalendarWidget-timeBegin" value={{hourBegin}} ></span>' +
                '<span class = "CalendarWidget-inputCell CalendarWidget-inputCell-inputMiddle CalendarWidget-inputCell-inputTimeMiddle">-</span>' +
                '<span class = "CalendarWidget-inputCell CalendarWidget-inputCell-inputTimeEnd"><input class = "CalendarWidget-timeInput CalendarWidget-timeEnd" value={{hourEnd}}></span>' +
            '</div>' +
        '</div>';

/** Параметры календаря
 * @typedef nsGmx.CalendarWidget~Parameters
 * @property {nsGmx.DateInterval} dateInterval Временной интервал, который нужно менять
 * @property {Date} [dateMin] минимальная граничная дата для календарей, null - без ограничений
 * @property {Date} [dateMax] максимальная граничная дата для календарей, null - без ограничений
 * @property {String} [dateFormat='dd.mm.yy'] формат даты
 * @property {bool} [minimized=true] показывать ли минимизированный или развёрнутый виджет в начале
 * @property {bool} [showSwitcher=true] показывать ли иконку для разворачивания/сворачивания периода
 * @property {Date} [dateBegin=<текущая дата>] начальная дата интервала
 * @property {Date} [dateEnd=<текущая дата>] конечная дата интервала
 * @property {String|DOMNode} [container] куда добавлять календарик
 * @property {String} [buttonImage] URL иконки для активации календариков
 */

/** Контрол для задания диапазона дат. Даты календарика всегда в UTC, а не в текущем поясе.
 @description Виджет для выбора интервала дат. Пользователь при помощи datepicker'ов выбирает два дня (год, месяц, число),
              затем выбранные значения при помощи ф-ции `_updateModel()` переводятся в интервал дат ({@link nsGmx.DateInterval}).
              Так же виджет реагирует на изменения модели (с использованием ф-ции `_updateWidget()`)
 @alias nsGmx.CalendarWidget
 @extends nsGmx.GmxWidget
 @class
 @param {nsGmx.CalendarWidget~Parameters} options Параметры календаря
*/

var CalendarModel = window.Backbone.Model.extend({
    defaults: {
        dailyFilter: true
    }
});
var Calendar1 = window.Backbone.View.extend({
    tagName: 'div',
    model: new CalendarModel(),
    className: 'CalendarWidget ui-widget',
    template: Handlebars.compile(template),
    events: {
        'click .CalendarWidget-dates-outside .CalendarWidget-inputCell': function (e) {
            e.stopPropagation();
            this.showCalendar(e);
            $(e.target).focus();
        },
        'keydown .CalendarWidget-dateBegin': function (e) {
            this.manuallyChangeDateInterval(e, 'begin');
        },
        'keydown .CalendarWidget-dateEnd': function (e) {
            this.manuallyChangeDateInterval(e, 'end');
        },
        'click .CalendarWidget-iconScrollLeft': function () {
            this._shiftDates(-1);
        },
        'click .CalendarWidget-iconScrollRight': function () {
            this._shiftDates(1);
        },
        'keydown .CalendarWidget-inputCell-inputTimeBegin': function (e) {
            this.jumpByArrow(e, 'left');
        },
        'keydown .CalendarWidget-inputCell-inputTimeEnd': function (e) {
            this.jumpByArrow(e, 'right');
        }
    },

    initialize: function(options) {
        var _this = this;
        options = $.extend({
            minimized: true,
            showSwitcher: true,
            dateMax: null,
            dateMin: null,
            dateFormat: 'dd.mm.yy',
            name: null
        }, options);

        this._dateMin = options.dateMin;
        this._dateMax = options.dateMax;
        this._dateInterval = options.dateInterval;
        this._opened = false;

        $.datepicker.setDefaults({

            onSelect: function(dateText, inst){
                this._selectFunc(inst.input);
            }.bind(this),
            minDate: this._dateMin ? Calendar1.toUTC(this._dateMin) : null,
            maxDate: this._dateMax ? Calendar1.toUTC(this._dateMax) : null,
            changeMonth: true,
            changeYear: true,
            dateFormat: 'dd.mm.yy',
            defaultDate: Calendar1.toUTC(this._dateMax || new Date()),
            buttonImageOnly: true,
            constrainInput: true
        });

        this.calendarTemplates = {
            beginTemplate: Handlebars.compile('' +
                '<div class="outside-calendar-container">' +
                    '<div class="begin-outside-calendar">' +
                    '</div>' +
                    '<div class="time-container begin-time-container">' +
                    '</div>' +
                    '<div class="time-placeholder begin-time-placeholder" hidden>' +
                    '</div>' +
                        '<span class="calendar-button createdateinterval-button">' +
                        '{{i "CalendarWidget.createDateInterval"}}'+
                        '</span>' +
                        '<span class="calendar-button resetdateinterval-button" hidden>' +
                            '{{i "CalendarWidget.resetDateInterval"}}'+
                        '</span>' +
                '</div>'
            ),
            endTemplate: Handlebars.compile('' +
                '<div class="outside-calendar-container">' +
                    '<div class="end-outside-calendar">' +
                    '</div>' +
                    '<div class="time-container end-time-container">' +
                    '</div>' +
                    '<div class="time-placeholder end-time-placeholder" hidden>' +
                    '</div>' +
                    '<span class="calendar-button selectdateinterval-button disabled">' +
                        '{{i "CalendarWidget.selectDateInterval"}}'+
                    '</span>' +
                '</div>'
            )
        };

        var dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            hourBegin = Calendar1.getTime(dateBegin, 'begin'),
            hourEnd = Calendar1.getTime(dateEnd, 'end');

        this.$el.html(this.template({
            showCalendarIconClass:'icon-calendar-empty',
            showCalendarIconTitle: _gtxt('CalendarWidget.ShowIconTitle'),
            hourBegin: hourBegin,
            hourEnd: hourEnd
        }));

        // если есть контейнер, куда прикреплять виджет календаря
        if (options.container) {
            if (typeof options.container === 'string')
                $('#' + options.container).append(this.$el);
            else
                $(options.container).append(this.$el);
        }

        this._updateWidget();

        this._dateInterval.on('change', this._updateWidget, this);
        this.listenTo(this.model, 'change:dailyFilter', this.enableDailyFilter);

        $('#leftMenu').on('click', function (e) {
            if (e.target.className !== 'CalendarWidget-show-calendar-icon icon-calendar-empty' &&
                e.target.className !== 'layers-before' &&
                !(e.target.className instanceof SVGAnimatedString) &&
                e.target.className.indexOf('CalendarWidget-timeInput') === -1 &&
                e.target.className !== 'calendar-container'
            ) {
                $(".calendar-outside .ui-dialog-titlebar-close").trigger('click');
                _this._opened = false;
            }
        })

        this.$('.CalendarWidget-timeInput').on('blur', this._selectTime.bind(this));

        //for backward compatibility
        this.canvas = this.$el;
    },

    manuallyChangeDateInterval: function (e, type) {
        if (e.keyCode !== 13) return;
        e.preventDefault();
        e.stopPropagation();
        var value = $(e.target).val(),
            beginInput = this.$('.CalendarWidget-dateBegin')[0],
            endInput = this.$('.CalendarWidget-dateEnd')[0],
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            endMidnight = (dateEnd.valueOf() === toMidnight(dateEnd).valueOf()),
            oneDayPeriod, parsed;

        try {
            parsed = $.datepicker.parseDate('dd.mm.yy', value);
        } catch (e) {
            return;
        }

        // handle errors and too large values
        if (!parsed || parsed < this._dateMin || parsed > this._dateMax) { return; }

        parsed = nsGmx.CalendarWidget1.fromUTC(parsed);

        oneDayPeriod = (parsed.valueOf() === dateBegin.valueOf());
        oneDayPeriod ? this.setMode(Calendar1.SIMPLE_MODE) : this.setMode(Calendar1.ADVANCED_MODE);

        if (type === 'begin') {
            this._dateBegin.datepicker('setDate', parsed);
            if (parsed > new Date(dateEnd.valueOf() - dayms)) {
                this._dateEnd.datepicker('setDate', parsed);
                $(endInput).val(e.target.value);
                this._selectFunc(endInput);
            }
            this._dateInterval.set({
                dateBegin: new Date(parsed.valueOf()),
                dateEnd: new Date(parsed.valueOf() + dayms)
            });
        } else {
            this._dateEnd.datepicker('setDate', parsed);
            if (parsed < dateBegin) {
                this._dateBegin.datepicker('setDate', parsed);
                $(beginInput).val(e.target.value);
                this._selectFunc(beginInput);
                this._dateInterval.set({
                    dateBegin: new Date(parsed.valueOf()),
                    dateEnd: new Date(parsed.valueOf() + dayms)
                });
            } else if (parsed > dateBegin) {
                this._dateInterval.set({
                    dateEnd: new Date(parsed.valueOf() + dayms)
                });
            }
        }

        this._selectFunc(e.target);
        this.showCalendar(e);
    },

    enableDailyFilter: function () {
        var dailyFilter = this.model.get('dailyFilter'),
            timeBeginValue = this.$('.CalendarWidget-timeBegin').val(),
            timeEndValue = this.$('.CalendarWidget-timeEnd').val();

        if (dailyFilter) {
            if (Number(timeBeginValue) >= Number(timeEndValue)) {
                this.$('.CalendarWidget-timeBegin').addClass('error');
                this.$('.CalendarWidget-inputCell-inputTimeMiddle').addClass('error');
                this.$('.CalendarWidget-timeEnd').addClass('error');
            } else {
                this.$('.CalendarWidget-timeBegin').removeClass('error');
                this.$('.CalendarWidget-inputCell-inputTimeMiddle').removeClass('error');
                this.$('.CalendarWidget-timeEnd').removeClass('error');
            }
        } else {
            this.$('.CalendarWidget-timeBegin').removeClass('error');
            this.$('.CalendarWidget-inputCell-inputTimeMiddle').removeClass('error');
            this.$('.CalendarWidget-timeEnd').removeClass('error');
        }
        this.$('.CalendarWidget-timeBegin').trigger('blur');
        this.$('.CalendarWidget-timeEnd').trigger('blur');
    },

    _selectTime: function (e) {
        var match = this._checkValue(e.target.value);

        if (!match) {
            this.$('.CalendarWidget-timeBegin').addClass('error');
            this.$('.CalendarWidget-inputCell-inputTimeMiddle').addClass('error');
            this.$('.CalendarWidget-timeEnd').addClass('error');
            return;
        }

        // $(e.target).removeClass('error');

        var isBegin = $(e.target).hasClass('CalendarWidget-timeBegin'),
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            dailyFilter = this.model.get('dailyFilter'),
            timeBeginValue = this.$('.CalendarWidget-timeBegin').val(),
            timeEndValue = this.$('.CalendarWidget-timeEnd').val(),
            msBeginInputValue = Calendar1.convertTimeValueToMs(timeBeginValue),
            msEndInputValue = Calendar1.convertTimeValueToMs(timeEndValue),
            dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            hourBegin = Calendar1.getTime(dateBegin, 'begin'),
            hourEnd = Calendar1.getTime(dateEnd, 'end'),
            msBegin = Calendar1.convertTimeValueToMs(hourBegin),
            msEnd = Calendar1.convertTimeValueToMs(hourEnd),
            newDateBegin = new Date(dateBegin.valueOf() + (msBeginInputValue - msBegin)),
            newDateEnd = new Date(dateEnd.valueOf() + (msEndInputValue - msEnd));

            if (dailyFilter && Number(timeBeginValue) >= Number(timeEndValue)) {
                this.$('.CalendarWidget-timeBegin').addClass('error');
                this.$('.CalendarWidget-inputCell-inputTimeMiddle').addClass('error');
                this.$('.CalendarWidget-timeEnd').addClass('error');
                return;
            }

            if (newDateBegin.valueOf() >= newDateEnd.valueOf()) {
                this.$('.CalendarWidget-timeBegin').addClass('error');
                this.$('.CalendarWidget-inputCell-inputTimeMiddle').addClass('error');
                this.$('.CalendarWidget-timeEnd').addClass('error');
                return;
            } else {
                this.$('.CalendarWidget-timeBegin').removeClass('error');
                this.$('.CalendarWidget-inputCell-inputTimeMiddle').removeClass('error');
                this.$('.CalendarWidget-timeEnd').removeClass('error');
            }

        this._dateInterval.set({
            dateBegin: newDateBegin,
            dateEnd: newDateEnd
        });
    },

    _checkValue: function (value) {
        var hours = [
                '00', '01', '02', '03', '04', '05', '06', '07', '08', '09',
                '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
                '20', '21', '22', '23', '24'
             ],
             match = false;

        for (var i = 0; i < hours.length; i++) {
            if (value === hours[i]) {
                match = true;
            }
        }

        return match;
    },

    showCalendar: function (e) {
        var _this = this,
            beginInput = this.$('.CalendarWidget-dateBegin')[0],
            endInput = this.$('.CalendarWidget-dateEnd')[0],
            dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            oneDayPeriod = (dateEnd.valueOf() - dateBegin.valueOf() === dayms),
            endMidnight = (dateEnd.valueOf() === toMidnight(dateEnd).valueOf());

        this.beginCalendar = $(this.calendarTemplates.beginTemplate({oneDayPeriod: oneDayPeriod}));
        this.endCalendar = $(this.calendarTemplates.endTemplate({}));

        var createIntervalButton = $('.createdateinterval-button', this.beginCalendar),
            resetIntervalButton = $('.resetdateinterval-button', this.beginCalendar),
            selectIntervalButton = $('.selectdateinterval-button', this.endCalendar),
            beginDialogOptions = {
                dialogClass: "calendar-outside begin-calendar",
                draggable: false,
                resizable: false,
                width: 224.8,
                height: 280,
                position: [372, 105],
                resizeFunc: function () {
                    return false;
                },
                closeFunc: function () {
                    _this._dateBegin.datepicker("destroy");
                },
            },
            endDialogOptions = {
                dialogClass: "calendar-outside end-calendar",
                draggable: false,
                resizable: false,
                width: 224.8,
                height: 280,
                position: [610, 105],
                resizeFunc: function () {
                    return false;
                },
                closeFunc: function () {
                    _this._dateEnd.datepicker("destroy");
                }
            };

        if (this._opened) {
            $(".calendar-outside .ui-dialog-titlebar-close").trigger('click');
            this._opened = false;
        }

        oneDayPeriod ? this.setMode(Calendar1.SIMPLE_MODE) : this.setMode(Calendar1.ADVANCED_MODE);

        this._dateBegin = $('.begin-outside-calendar', this.beginCalendar);
        this._dateEnd = $('.end-outside-calendar', this.endCalendar);

        this._dateInputs = this._dateBegin.add(this._dateEnd);

        this._dateInputs.datepicker();

        this._dateInputs.datepicker('option', 'minDate', Calendar1.toUTC(this._dateMin));
        this._dateInputs.datepicker('option', 'maxDate', Calendar1.toUTC(this._dateMax));

        this._dateBegin.datepicker('setDate', Calendar1.toUTC(dateBegin));
        this._dateEnd.datepicker('setDate', oneDayPeriod || endMidnight ? Calendar1.toUTC(new Date(dateEnd.valueOf() - dayms)) : Calendar1.toUTC(dateEnd));

        $(this.beginCalendar).dialog(beginDialogOptions);
        this._opened = true;

        if (this.getMode() === Calendar1.ADVANCED_MODE) {
            $(createIntervalButton).toggle(false);
            $(resetIntervalButton).toggle(true);
            $(this.endCalendar).dialog(endDialogOptions);
            this._opened = true;
        }

        // кнопки в первом календаре
        $(createIntervalButton).on('click', function () {
            var begin = _this._dateInterval.get('dateBegin'),
                end = _this._dateInterval.get('dateEnd');

            _this.setMode(Calendar1.ADVANCED_MODE);
            $(_this.endCalendar).dialog(endDialogOptions);
            _this._opened = true;

            $(this).toggle(false);
            $(resetIntervalButton).toggle(true);
        })

        $(resetIntervalButton).on('click', function () {
            var dateBegin = toMidnight(_this._dateInterval.get('dateBegin'));
            _this.setMode(Calendar1.SIMPLE_MODE);
            _this._dateBegin.datepicker('setDate', Calendar1.toUTC(dateBegin));
            _this._dateEnd.datepicker('setDate', Calendar1.toUTC(dateBegin));
            $(".calendar-outside.end-calendar .ui-dialog-titlebar-close").trigger('click');
            _this._opened = false;

            $(this).toggle(false);
            $(createIntervalButton).toggle(true);
            _this._dateInterval.set({
                dateBegin: dateBegin,
                dateEnd: new Date(dateBegin.valueOf() + dayms)
            })
        })

        // кнопка во втором календаре
        $(selectIntervalButton).on('click', function () {
            _this._updateModel();
            _this.setActive(true);
            _this._enableCreateIntervalButton();
            $(".calendar-outside .ui-dialog-titlebar-close").trigger('click');
            _this._opened = false;
        })
    },

    _enableCreateIntervalButton: function (e) {
        var dayms = nsGmx.DateInterval.MS_IN_DAY,
            selectIntervalButton = $('.selectdateinterval-button'),
            dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            beginTimeValue = Calendar1.convertTimeValueToMs(e && e.target === $('CalendarWidget-timeBegin', this)[0] ? $(e.target).val() : $('.CalendarWidget-timeBegin').val()),
            endTimeValue = Calendar1.convertTimeValueToMs(e && e.target === $('CalendarWidget-timeEnd', this)[0] ? $(e.target).val() : $('.CalendarWidget-timeEnd').val()),
            calendarDateBegin = this.getDateBegin(),
            calendarDateEnd = this.getDateEnd(),
            newDateBegin = new Date(calendarDateBegin.valueOf() + beginTimeValue),
            newDateEnd = new Date(calendarDateEnd.valueOf() + endTimeValue);

        // если даты в итоге не поменялись или вторая дата больше первой
        if ((newDateBegin.valueOf() === dateBegin.valueOf() && newDateEnd.valueOf() === dateEnd.valueOf()) ||
            newDateBegin.valueOf() >= newDateEnd.valueOf()) {
                $(selectIntervalButton).addClass('disabled');
        } else {
            $(selectIntervalButton).removeClass('disabled');
        }
    },

    _shiftDates: function(delta) {
        var dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            dailyFilter = this.model.get('dailyFilter'),
            shift;

        if (!dateBegin || !dateEnd) {
            return;
        }

        if (dailyFilter) {
            var diff = (toMidnight(dateEnd) - toMidnight(dateBegin));
            shift = diff ? diff * delta : dayms * delta;
        } else {
            shift = (dateEnd - dateBegin) * delta;
        }

        var newDateBegin = new Date(dateBegin.valueOf() + shift),
            newDateEnd = new Date(dateEnd.valueOf() + shift);

        if ((!this._dateMin || toMidnight(this._dateMin) <= toMidnight(newDateBegin)) &&
            (!this._dateMax || toMidnight(this._dateMax) >= toMidnight(newDateEnd)))
        {
            this._dateInterval.set({
                dateBegin: newDateBegin ? newDateBegin : null,
                dateEnd: newDateEnd ? newDateEnd : null
            });
        }
    },

    _selectFunc: function(activeInput) {
        var begin = this.getDateBegin(),
            end = this.getDateEnd(),
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            selectIntervalButton = $('.selectdateinterval-button');

        if (end && begin && begin > end) {
            var dateToFix = activeInput[0] == this._dateEnd[0] ? this._dateBegin : this._dateEnd;

            dateToFix.datepicker('setDate', $(activeInput[0]).datepicker('getDate'));
        }
        if (this._curMode === Calendar1.SIMPLE_MODE) {
            if (!begin != !end || begin && begin.valueOf() !== end.valueOf()) {
                this._dateEnd.datepicker('setDate', this._dateBegin.datepicker('getDate'));
            }
            this._dateInterval.set({
                dateBegin: begin ? begin : null,
                dateEnd: end ? new Date(begin.valueOf() + nsGmx.DateInterval.MS_IN_DAY) : null
            });
        } else if (this._curMode === Calendar1.ADVANCED_MODE) {
            this._enableCreateIntervalButton();
        }
    },

    _updateModel: function() {
        // получаем значения с дейтпикеров и переводим их в локальное время
        var dateBegin = this.getDateBegin(),
            dateEnd = this.getDateEnd(),
            // значение часов
            beginTimeValue = Calendar1.convertTimeValueToMs($('.CalendarWidget-timeBegin').val()),
            endTimeValue = Calendar1.convertTimeValueToMs($('.CalendarWidget-timeEnd').val()),
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            // если второй день захвачен полностью
            fullDay = endTimeValue === dayms;

        // добавим время к часам (в локальном времени)
        dateBegin = new Date(dateBegin.valueOf() + beginTimeValue);
        dateEnd = new Date(dateEnd.valueOf() + endTimeValue);

        this._dateInterval.set({
            dateBegin: dateBegin ? dateBegin : null,
            dateEnd: dateEnd ? dateEnd : null
        });
    },

    _updateWidget: function() {
        var dateBegin = this._dateInterval.get('dateBegin'),
            dateEnd = this._dateInterval.get('dateEnd'),
            hourBegin = Calendar1.getTime(dateBegin, 'begin'),
            hourEnd = Calendar1.getTime(dateEnd, 'end'),
            beginInput = this.$('.CalendarWidget-dateBegin')[0],
            endInput = this.$('.CalendarWidget-dateEnd')[0],
            timeBegin = this.$('.CalendarWidget-timeBegin')[0],
            timeEnd = this.$('.CalendarWidget-timeEnd')[0],
            dayms = nsGmx.DateInterval.MS_IN_DAY,
            newDateEnd;

        if (!dateBegin || !dateEnd) {
            return;
        };

        var newDateBegin = Calendar1.toUTC(dateBegin),
            newDateEnd = Calendar1.toUTC(new Date(dateEnd));

        // если календарь показывает ровно один день,
        // прибавляем 24 часа к первой дате, чтобы получить сутки
        if (dateEnd.valueOf() === toMidnight(dateEnd).valueOf()) {
            newDateEnd = Calendar1.toUTC(new Date(dateEnd - dayms));
        }

        $(beginInput).val(Calendar1.formatDate(newDateBegin));
        $(endInput).val(Calendar1.formatDate(newDateEnd));

        $(timeBegin).val(Calendar1.prefixTimeValue(hourBegin));
        $(timeEnd).val(Calendar1.prefixTimeValue(hourEnd));

        this.enableDailyFilter && this.enableDailyFilter();
    },

    setActive: function (value) {
        var active = this.active;
        if (value !== active) {
            this.active = value;
        }

        if (this.active) {
            this.$el.removeClass('gmx-disabled')
        } else {
            this.$el.addClass('gmx-disabled')
        }
    },

    jumpByArrow: function (e, type) {
        var target = type === 'left' ? this.$('.CalendarWidget-inputCell-inputTimeBegin').find('input') : this.$('.CalendarWidget-inputCell-inputTimeEnd').find('input'),
            source = type === 'left' ? this.$('.CalendarWidget-inputCell-inputTimeEnd').find('input') : this.$('.CalendarWidget-inputCell-inputTimeBegin').find('input'),
            sourceElem = $(source).get(0),
            strEnd;

        switch (type) {
            case 'left':
                if (e.key === 'ArrowRight' && e.target.value.length === e.target.selectionEnd) {
                    $(target).blur();
                    $(source).focus();

                    strEnd = sourceElem.value.length || 0;

                    setTimeout(function () {
                        sourceElem.setSelectionRange(strEnd, strEnd);
                    }, 0);
                }
                break;
            case 'right':
                if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
                    $(target).blur();
                    $(source).focus();

                    strEnd = sourceElem.value.length || 0;

                    setTimeout(function () {
                        sourceElem.setSelectionRange(strEnd, strEnd);
                    }, 0);
                }
                break;
            default: return;
        }
    },

    //public interface

    /** Закрыть все открытые datepicker'ы.
     * @return {nsGmx.CalendarWidget} this
     */
    reset: function() {
        this._dateInputs.datepicker('hide');
        return this;
    },

    /** Сериализация состояния виджета
     * @return {Object} Сериализованное состояние
     */
    saveState: function() {
        return {
            version: '1.1.0',
            vismode: this.getMode()
        }
    },

    /** Восстановить состояние виджета по сериализованным данным
     * @param {Object} data Сериализованное состояние календарика
     */
    loadState: function( data ) {
        this.setMode(data.vismode);
    },

    /** Получить начальную дату
     * @return {Date} начальная дата
     */
    getDateBegin: function() {
        return this._dateBegin ? Calendar1.fromUTC(this._dateBegin.datepicker('getDate')) : this.getDateInterval().get('dateBegin');
    },

    /** Получить конечную дату
     * @return {Date} конечная дата
     */
    getDateEnd: function() {
        return this._dateEnd ? Calendar1.fromUTC(this._dateEnd.datepicker('getDate')) : this.getDateInterval().get('dateEnd');
    },

    /** Получить верхнюю границу возможных дат периода
     * @return {Date} верхняя граница возможных периодов
     */
    getDateMax: function() {
        return this._dateMax;
    },

    /** Получить нижнуюю границу возможных дат периода
     * @return {Date} нижняя граница возможных периодов
     */
    getDateMin: function() {
        return this._dateMin;
    },

    /** Установить нижнуюю границу возможных дат периода
     * @param {Date} dateMin нижняя граница возможных периодов
     */
    setDateMin: function(dateMin) {
        this._dateMin = dateMin;
        this._dateInputs.datepicker('option', 'minDate', dateMin ? Calendar1.toUTC(dateMin) : null);
    },

    /** Установить верхнюю границу возможных дат периода
     * @param {Date} dateMax верхняя граница возможных периодов
     */
    setDateMax: function(dateMax) {
        // var titleContainer = this.$('.CalendarWidget-forecast');

        this._dateMax = dateMax;
        if (dateMax) {
            var utcDate = Calendar1.toUTC(dateMax);
            if (this._dateInputs) {
                this._dateInputs.datepicker('option', 'maxDate', utcDate);
            }

            if (dateMax > new Date()) {
            //     $(titleContainer).attr('title', _gtxt('CalendarWidget.tooltip') + ' ' +
            //     ('0' + dateMax.getDate()).slice(-2) + '-' +
            //     ('0' + (dateMax.getMonth() + 1)).slice(-2) + '-' +
            //     dateMax.getFullYear());
            //     $(titleContainer).show();
            // } else {
            //     $(titleContainer).hide();
            }

        } else {
            if (this._dateInputs) {
                this._dateInputs.datepicker('option', 'maxDate', null);
            }
        }
    },

    setSwitcherVisibility: function(isVisible) {
        this._showCalendarIcon && this._showCalendarIcon.toggle(isVisible);
    },

    getDateInterval: function() {
        return this._dateInterval;
    },

    getMode: function() {
        return this._curMode;
    },

    setMode: function(mode) {
        if (this._curMode === mode) {
            return this;
        }

        this._curMode = mode;
    }

}, {
    /* static methods */

    // date показывает в utc
    // нужно вычесть отрицательную разницу
    // utc 13:00
    // 13:00 - (-3 часа) = 16:00
    // locale 16:00
    // return locale date
    fromUTC: function(date) {
        if (!date) return null;
        var timeOffset = date.getTimezoneOffset()*60*1000;
        return new Date(date.valueOf() - timeOffset);
    },
    toUTC: function(date) {
        if (!date) return null;
        var timeOffset = date.getTimezoneOffset()*60*1000;
        return new Date(date.valueOf() + timeOffset);
    },
    formatDate: function(date) {
        var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [day, month, year].join('.');
    },
    convertTimeValueToMs: function (value) {
        var ms = Number(value)*1000*3600;
        return ms;
    },
    getTime: function (date, position) {
        var dayms = nsGmx.DateInterval.MS_IN_DAY,
            offset, hours;

        if (position === 'begin') {
            offset = date.valueOf() - toMidnight(date).valueOf();
        } else {
            if (date.valueOf() === toMidnight(date).valueOf()) {
                offset = dayms;
            } else {
                offset = date.valueOf() - toMidnight(date).valueOf();
            }
        };

        hours = offset/(3600*1000);

        return hours;
    },

    prefixTimeValue: function (value) {
        value = Number(value);
        return value < 10 ? '0' + value : String(value);
    },
    SIMPLE_MODE: 1,
    ADVANCED_MODE: 2
});

nsGmx.CalendarWidget1 = Calendar1;

})(jQuery);

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
var nsGmx = nsGmx || {};nsGmx.Templates = nsGmx.Templates || {};nsGmx.Templates.ShareIconControl = {};
nsGmx.Templates.ShareIconControl["shareDialog"] = "<div class=\"shareDialog-row shareDialog-title\">\n" +
    "    <span><%= nsGmx.Translations.getText('shareDialog.permalinkBelow') %></span>\n" +
    "    <a class=\"gmx-link gmx-link_icon shareDialog-socialShareLink shareDialog-socialShareLink_twitter\" target=\"_blank\"><i class=\"icon-twitter\"></i></a>\n" +
    "    <a class=\"gmx-link gmx-link_icon shareDialog-socialShareLink shareDialog-socialShareLink_facebook\" target=\"_blank\"><i class=\"icon-facebook\"></i></a>\n" +
    "    <a class=\"gmx-link gmx-link_icon shareDialog-socialShareLink shareDialog-socialShareLink_vk\" target=\"_blank\"><i class=\"icon-vk\"></i></a>\n" +
    "</div>\n" +
    "<div class=\"shareDialog-row\">\n" +
    "    <div class=\"gmx-table\">\n" +
    "        <div class=\"gmx-table-cell shareDialog-permalinkUrlCell\">\n" +
    "            <input class=\"gmx-input-text gmx-input-text_maxwidth gmx-input-text_readonly shareDialog-inputPermalinkUrl\" type=\"text\" readonly=\"readonly\" />\n" +
    "        </div>\n" +
    "        <div class=\"gmx-table-cell shareDialog-permalinkUrlPreviewButtonCell\">\n" +
    "            <a class=\"gmx-link gmx-link_icon shareDialog-permalinkUrlPreviewButton\" target=\"_blank\"><i class=\"icon-link-ext\" title=\"<%= nsGmx.Translations.getText('shareDialog.newWin') %>\"></i></a>\n" +
    "        </div>\n" +
    "    </div>\n" +
    "</div>\n" +
    "<div class=\"shareDialog-row shareDialog-title\"><%= nsGmx.Translations.getText('shareDialog.embeddedBelow') %></div>\n" +
    "<div class=\"shareDialog-row\">\n" +
    "    <table><tr><td class=\"shareDialog-resolutionTable-cell\">\n" +
    "    <div class=\"gmx-table shareDialog-resolutionTable\">\n" +
    "        <div class=\"gmx-table-cell shareDialog-previewResolutionCell\">\n" +
    "            <input class=\"gmx-input-text shareDialog-inputIframeWidth\" type=\"text\" value=\"<%= iframeWidth %>\"/>\n" +
    "            <span class=\"shareDialog-resolutionCross\">x</span>\n" +
    "            <input class=\"gmx-input-text shareDialog-inputIframeHeight\" type=\"text\" value=\"<%= iframeHeight %>\" />\n" +
    "        </div>\n" +
    "    </div>\n" +
    "    </td><td>\n" +
    "    <div class=\"gmx-table-cell shareDialog-winnieLinkCell shareDialog-validationOk\">\n" +
    "        <a class=\"shareDialog-winnieLink gmx-link\" href=\"#\" target=\"_blank\"><%= nsGmx.Translations.getText('shareDialog.winnieLink') %></a><i class=\"gmx-icon icon-link-ext\"></i>\n" +
    "    </div>\n" +
    "    </td></tr></table>\n" +
    "</div>\n" +
    "<div class=\"shareDialog-row\">\n" +
    "    <textarea class=\"shareDialog-inputEmbedCode gmx-input-text gmx-input-text_maxwidth gmx-input-text_readonly shareDialog-validationOk\" readonly=\"readonly\">\n" +
    "        <%= embedCode %>\n" +
    "    </textarea>\n" +
    "    <div class=\"shareDialog-validationError shareDialog-validationErrorView\"></div>\n" +
    "</div>\n" +
    "\n" +
    "<div class=\"gmx-table-cell shareDialog-previewLinkCell ui-state-disabled shareDialog-validationError\">\n" +
    "    <span><%= nsGmx.Translations.getText('shareDialog.preview') %></span><i class=\"icon-link-ext\"></i>\n" +
    "</div>\n" +
    "<div class=\"gmx-table-cell shareDialog-previewLinkCell shareDialog-validationOk\">\n" +
    "    <a class=\"shareDialog-previewLink gmx-link\" href=\"#\" target=\"_blank\"><%= nsGmx.Translations.getText('shareDialog.preview') %></a><i class=\"gmx-icon icon-link-ext\"></i>\n" +
    "</div>";;
var nsGmx = nsGmx || {};

nsGmx.ShareIconControl = L.Control.gmxIcon.extend({
    options: {
        className: 'shareIcon',
        id: 'share',
        text: 'Share',
        style: {
            width: 'auto'
        }
    },
    onAdd: function(map) {
        if (map.options.svgSprite) {
            delete this.options.text;
            var proto = Object.getPrototypeOf(this.options);
            if (proto.text) {
                delete proto.text;
            }
        }
        this._container = L.Control.gmxIcon.prototype.onAdd.apply(this, arguments);
        this._shareDialogContainer = L.DomUtil.create('div', 'shareDialogContainer');

        L.DomEvent.addListener(this._shareDialogContainer, 'click', function (e) {
            L.DomEvent.stopPropagation(e);
        });

        $(this._container).popover({
            content: this._shareDialogContainer,
            container: this._container,
            placement: 'bottom',
            html: true
        });

        $(this._container).on('shown.bs.popover', function() {
            var shareDialog = new nsGmx.ShareIconControl.ShareDialog(_.pick(this.options, [
                'permalinkUrlTemplate',
                'embeddedUrlTemplate',
                'winnieUrlTemplate',
                'previewUrlTemplate',
                'embedCodeTemplate',
                'permalinkManager'
            ]));
            shareDialog.appendTo(this._shareDialogContainer);
        }.bind(this));

        $(this._container).on('hide.bs.popover', function() {
            $(this._shareDialogContainer).empty();
        }.bind(this));

        return this._container;
    }
});
;
nsGmx.ShareIconControl.ShareDialogModel = Backbone.Model.extend({
    validate: function(attrs, options) {
        // NaN check
        if (attrs.iframeWidth / 1 !== attrs.iframeWidth / 1) {
            return 'shareDialog.invalidWidth';
        }
        if (attrs.iframeHeight / 1 !== attrs.iframeHeight / 1) {
            return 'shareDialog.invalidHeight';
        }
    }
});

nsGmx.ShareIconControl.ShareDialog = nsGmx.GmxWidget.extend({
    className: 'shareDialog',
    options: {
        permalinkUrlTemplate: '{{origin}}?permalink={{permalinkId}}',
        embeddedUrlTemplate: '{{origin}}embedded.html{{#if winnieId}}?permalink={{winnieId}}{{/if}}',
        winnieUrlTemplate: '{{origin}}{{#if winnieId}}?config={{winnieId}}{{/if}}',
        previewUrlTemplate: '{{origin}}iframePreview.html?width={{width}}&height={{height}}&permalinkUrl={{{embeddedUrl}}}',
        embedCodeTemplate: '<iframe src="{{{embeddedUrl}}}" width="{{width}}" height="{{height}}"></iframe>'
    },
    events: function() {
        return {
            'click .shareDialog-inputPermalinkUrl': function(e) {
                e.target.select();
            },
            'click .shareDialog-inputEmbedCode': function(e) {
                e.target.select();
            },
            'input .shareDialog-inputIframeWidth': this._setModelPropertyFn('iframeWidth'),
            'input .shareDialog-inputIframeHeight': this._setModelPropertyFn('iframeHeight'),
            'change .shareDialog-inputIframeWidth': this._setModelPropertyFn('iframeWidth'),
            'change .shareDialog-inputIframeHeight': this._setModelPropertyFn('iframeHeight')
        }
    },
    constructor: function(options) {
        nsGmx.GmxWidget.call(this, _.extend({
            model: new nsGmx.ShareIconControl.ShareDialogModel({
                permalinkId: '',
                winnieId: '',
                includePermalink: true,
                iframeWidth: 800,
                iframeHeight: 600,
                embedCode: '',
                error: ''
            })
        }, options));
    },
    initialize: function(options) {
        this.options = _.extend(this.options, options);
        this._terminateMouseEvents();
        this._permalinkManager = options.permalinkManager;
        this.createPermalink().then(null, function(err) {
            console.error(err);
        });
    },
    render: function() {
        if (this.model.get('error')) {
            return this._renderError();
        }
        if (!this.model.get('permalinkId')) {
            return this._renderLoader();
        }
        var changed = arguments[0] && arguments[0].changed;
        if (changed && (changed.iframeWidth || changed.iframeHeight)) {
            this._updateFields();
            return this;
        }
        this._renderDialog();
        return this;
    },
    createPermalink: function() {
        return $.Deferred(function(def) {
            this.model.set('permalinkId', '');
            this.model.set('error', '');
            this._permalinkManager.save()
                .then(function(permalinkId, winnieId) {
                    this.model.set({
                        permalinkId: permalinkId,
                        winnieId: winnieId
                    });
                    def.resolve();
                }.bind(this), function() {
                    this.model.set('error', 'shareDialog.permalinkError');
                    def.reject();
                }.bind(this))
                .fail(function(err) {
                    console.error(err);
                });
        }.bind(this)).promise();
    },
    appendTo: function() {
        nsGmx.GmxWidget.prototype.appendTo.apply(this, arguments);
        this.model.on('change', this.render, this);
        this.render();
    },
    _setModelPropertyFn: function(property) {
        return function(e) {
            this.model.set(property, $(e.currentTarget).val());
        }
    },
    _renderLoader: function() {
        this.undelegateEvents();
        this.$el.html(nsGmx.Translations.getText('shareDialog.creatingPermalink'));
        return this;
    },
    _renderError: function() {
        this.undelegateEvents();
        this.$el.html(nsGmx.Translations.getText(this.model.get('error')));
        return this;
    },
    _renderDialog: function() {
        this.undelegateEvents();
        this.$el.html(_.template(nsGmx.Templates.ShareIconControl.shareDialog)(this.model.attributes));
        this.errorsView = new nsGmx.AlertWidget();
        this.errorsView.appendTo(this.$('.shareDialog-validationErrorView'));
        this._updateFields();
        this.delegateEvents();
        this.$el.contextmenu(function (e) {
            e.stopPropagation();
            return true;
        });
        return this;
    },
    _updateFields: function() {
        var urls = this._generateUrls();
        this.errorsView.clear();
        if (this.model.isValid()) {
            this.$el.find('.shareDialog-validationOk').show();
            this.$el.find('.shareDialog-validationError').hide();
        } else {
            this.errorsView.push(nsGmx.Translations.getText(this.model.validationError), 'error');
            this.$el.find('.shareDialog-validationOk').hide();
            this.$el.find('.shareDialog-validationError').show();
        }
        this.$el.find('.shareDialog-inputPermalinkUrl').val(urls.permalinkUrl);
        this.$el.find('.shareDialog-permalinkUrlPreviewButton').attr('href', urls.permalinkUrl);
        this.$el.find('.shareDialog-previewLink').attr('href', urls.previewUrl);
        this.$el.find('.shareDialog-winnieLink').attr('href', urls.winnieUrl);
        this.$el.find('.shareDialog-inputEmbedCode').html(urls.embedCode);

        this.$el.find('.shareDialog-socialShareLink_vk').attr('href', urls.vkShareUrl);
        this.$el.find('.shareDialog-socialShareLink_twitter').attr('href', urls.twitterShareUrl);
        this.$el.find('.shareDialog-socialShareLink_facebook').attr('href', urls.facebookShareUrl);
    },
    _generateUrls: function() {
        var escapeHtml = function(unsafe) {
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        var tpl = Handlebars.compile;
        var urls = {};

        var origin = window.location.protocol + '//' + window.location.host + '/';
        var href = window.location.search ? window.location.href.split(window.location.search)[0] : window.location.href;

        var permalinkUrl = urls.permalinkUrl = tpl(this.options.permalinkUrlTemplate)({
            origin: origin,
            href: href,
            permalinkId: this.model.get('permalinkId')
        });

        var embeddedUrl = urls.embeddedUrl = tpl(this.options.embeddedUrlTemplate)({
            origin: origin,
            href: href,
            winnieId: this.model.get('includePermalink') ? this.model.get('winnieId') : false            
        });

        var previewUrl = urls.previewUrl = tpl(this.options.previewUrlTemplate)({
            origin: origin,
            href: href,
            embeddedUrl: encodeURIComponent(embeddedUrl),
            width: this.model.get('iframeWidth'),
            height: this.model.get('iframeHeight')
        });
        
        var winnieUrl = urls.winnieUrl = tpl(this.options.winnieUrlTemplate)({
            origin: origin,
            href: href,
            winnieId: this.model.get('winnieId')
        });

        var embedCode = urls.embedCode = escapeHtml(tpl(this.options.embedCodeTemplate)({
            embeddedUrl: embeddedUrl,
            href: href,
            width: this.model.get('iframeWidth'),
            height: this.model.get('iframeHeight')
        }));

        var vkShareUrl = urls.vkShareUrl = tpl('http://vkontakte.ru/share.php?url={{urltoshare}}')({
            urltoshare: escape(permalinkUrl)
        });

        var twitterShareUrl = urls.twitterShareUrl = tpl('http://www.twitter.com/share?url={{urltoshare}}')({
            urltoshare: escape(permalinkUrl)
        });

        var facebookShareUrl = urls.facebookShareUrl = tpl('https://www.facebook.com/sharer/sharer.php?u={{urltoshare}}')({
            urltoshare: escape(permalinkUrl)
        });

        return urls;
    }
});
nsGmx.Translations.addText('rus', {
    shareDialog: {
        permalinkBelow: 'Ссылка на карту:',
        embeddedBelow: 'Код для вставки:',
        creatingPermalink: 'формирование ссылки..',
        invalidWidth: 'Некорректная ширина фрейма',
        invalidHeight: 'Некорректная высота фрейма',
        newWin: 'открыть в новом окне',
        includePermalink: 'добавить пермалинк',
        preview: 'предпросмотр',
        winnieLink: 'конструктор приложений'
    }
});

nsGmx.Translations.addText('eng', {
    shareDialog: {
        permalinkBelow: 'Share link:',
        embeddedBelow: 'Embed map:',
        creatingPermalink: 'creating permalink..',
        invalidWidth: 'Invalid frame width',
        invalidHeight: 'Invalid frame height',
        newWin: 'open in new window',
        includePermalink: 'include permalink',
        preview: 'preview',
        winnieLink: 'application constructor'
    }
});
;
/*eslint-env commonjs, browser */
(function(factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require('leaflet'));
    } else {
        window.L.control.iconLayers = factory(window.L);
        window.L.Control.IconLayers = window.L.control.iconLayers.Constructor;
    }
})(function(L) {
    function each(o, cb) {
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                cb(o[p], p, o);
            }
        }
    }

    function find(ar, cb) {
        if (ar.length) {
            for (var i = 0; i < ar.length; i++) {
                if (cb(ar[i])) {
                    return ar[i];
                }
            }
        } else {
            for (var p in ar) {
                if (ar.hasOwnProperty(p) && cb(ar[p])) {
                    return ar[p];
                }
            }
        }
    }

    function first(o) {
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                return o[p];
            }
        }
    }

    function length(o) {
        var length = 0;
        for (var p in o) {
            if (o.hasOwnProperty(p)) {
                length++;
            }
        }
        return length;
    }

    function prepend(parent, el) {
        if (parent.children.length) {
            parent.insertBefore(el, parent.children[0]);
        } else {
            parent.appendChild(el);
        }
    }

    var IconLayers = L.Control.extend({
		includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
        _getActiveLayer: function() {
            if (this._activeLayerId) {
                return this._layers[this._activeLayerId];
            } else if (length(this._layers)) {
                return first(this._layers);
            } else {
                return null;
            }
        },
        _getPreviousLayer: function() {
            var activeLayer = this._getActiveLayer();
            if (!activeLayer) {
                return null;
            } else if (this._previousLayerId) {
                return this._layers[this._previousLayerId];
            } else {
                return find(this._layers, function(l) {
                    return l.id !== activeLayer.id;
                }.bind(this)) || null;
            }
        },
        _getInactiveLayers: function() {
            var ar = [];
            var activeLayerId = this._getActiveLayer() ? this._getActiveLayer().id : null;
            var previousLayerId = this._getPreviousLayer() ? this._getPreviousLayer().id : null;
            each(this._layers, function(l) {
                if ((l.id !== activeLayerId) && (l.id !== previousLayerId)) {
                    ar.push(l);
                }
            });
            return ar;
        },
        _arrangeLayers: function() {
            var behaviors = {};
            behaviors.previous = function() {
                var layers = this._getInactiveLayers();
                if (this._getActiveLayer()) {
                    layers.unshift(this._getActiveLayer());
                }
                if (this._getPreviousLayer()) {
                    layers.unshift(this._getPreviousLayer());
                }
                return layers;
            };
            return behaviors[this.options.behavior].apply(this, arguments);
        },
        _getLayerCellByLayerId: function(id) {
            var els = this._container.getElementsByClassName('leaflet-iconLayers-layerCell');
            for (var i = 0; i < els.length; i++) {
                if (els[i].getAttribute('data-layerid') == id) {
                    return els[i];
                }
            }
        },
        _createLayerElement: function(layerObj) {
            var el = L.DomUtil.create('div', 'leaflet-iconLayers-layer');
            if (layerObj.title) {
                var titleContainerEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerTitleContainer');
                var titleEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerTitle');
                var checkIconEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerCheckIcon');
                titleEl.innerHTML = layerObj.title;
                titleContainerEl.appendChild(titleEl);
                el.appendChild(titleContainerEl);
                el.appendChild(checkIconEl);
            }
            if (layerObj.icon) {
                el.setAttribute('style', 'background-image: url(\'' + layerObj.icon + '\')');
            }
            return el;
        },
        _createLayerElements: function() {
            var currentRow, layerCell;
            var layers = this._arrangeLayers();
            var activeLayerId = this._getActiveLayer() && this._getActiveLayer().id;

            for (var i = 0; i < layers.length; i++) {
                if (i % this.options.maxLayersInRow === 0) {
                    currentRow = L.DomUtil.create('div', 'leaflet-iconLayers-layersRow');
                    if (this.options.position.indexOf('bottom') === -1) {
                        this._container.appendChild(currentRow);
                    } else {
                        prepend(this._container, currentRow);
                    }
                }
                layerCell = L.DomUtil.create('div', 'leaflet-iconLayers-layerCell');
                layerCell.setAttribute('data-layerid', layers[i].id);
                if (i !== 0) {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_hidden');
                }
                if (layers[i].id === activeLayerId) {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_active');
                }
                if (this._expandDirection === 'left') {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_expandLeft');
                } else {
                    L.DomUtil.addClass(layerCell, 'leaflet-iconLayers-layerCell_expandRight');
                }
                layerCell.appendChild(this._createLayerElement(layers[i]));

                if (this.options.position.indexOf('right') === -1) {
                    currentRow.appendChild(layerCell);
                } else {
                    prepend(currentRow, layerCell);
                }
            }
        },
        _onLayerClick: function(e) {
            e.stopPropagation();
            var layerId = e.currentTarget.getAttribute('data-layerid');
            var layer = this._layers[layerId];
            this.setActiveLayer(layer.layer);
            this.expand();
        },
        _attachEvents: function() {
            each(this._layers, function(l) {
                var e = this._getLayerCellByLayerId(l.id);
                if (e) {
                    e.addEventListener('click', this._onLayerClick.bind(this));
                }
            }.bind(this));
            var layersRowCollection = this._container.getElementsByClassName('leaflet-iconLayers-layersRow');

            var onMouseEnter = function(e) {
                e.stopPropagation();
                this.expand();
            }.bind(this);

            var onMouseLeave = function(e) {
                e.stopPropagation();
                this.collapse();
            }.bind(this);

            var stopPropagation = function(e) {
                e.stopPropagation();
            };

            //TODO Don't make functions within a loop.
            for (var i = 0; i < layersRowCollection.length; i++) {
                var el = layersRowCollection[i];
                el.addEventListener('mouseenter', onMouseEnter);
                el.addEventListener('mouseleave', onMouseLeave);
                el.addEventListener('mousemove', stopPropagation);
            }
        },
        _render: function() {
            this._container.innerHTML = '';
            this._createLayerElements();
            this._attachEvents();
        },
        _switchMapLayers: function() {
            if (!this._map) {
                return;
            }
            var activeLayer = this._getActiveLayer();
            var previousLayer = this._getPreviousLayer();
            if (previousLayer) {
                this._map.removeLayer(previousLayer.layer);
            } else {
                each(this._layers, function(layerObject) {
                    var layer = layerObject.layer;
                    this._map.removeLayer(layer);
                }.bind(this));
            }
            if (activeLayer) {
                this._map.addLayer(activeLayer.layer);
            }
        },
        options: {
            position: 'bottomleft', // one of expanding directions depends on this
            behavior: 'previous', // may be 'previous', 'expanded' or 'first'
            expand: 'horizontal', // or 'vertical'
            autoZIndex: true, // from L.Control.Layers
            maxLayersInRow: 5,
            manageLayers: true
        },
        initialize: function(layers, options) {
            if (!L.Util.isArray(arguments[0])) {
                // first argument is options
                options = layers;
                layers = [];
            }
            L.setOptions(this, options);
            this._expandDirection = (this.options.position.indexOf('left') != -1) ? 'right' : 'left';
            if (this.options.manageLayers) {
                this.on('activelayerchange', this._switchMapLayers, this);
            }
            this.setLayers(layers);
        },
        onAdd: function(map) {
            this._container = L.DomUtil.create('div', 'leaflet-iconLayers');
            L.DomUtil.addClass(this._container, 'leaflet-iconLayers_' + this.options.position);
            this._render();
            map.on('click', this.collapse, this);
            if (this.options.manageLayers) {
                this._switchMapLayers();
            }
            return this._container;
        },
        onRemove: function(map) {
            map.off('click', this.collapse, this);
        },
        setLayers: function(layers) {
            this._layers = {};
            layers.map(function(layer) {
                var id = L.stamp(layer.layer);
                this._layers[id] = L.extend(layer, {
                    id: id
                });
            }.bind(this));
            if (this._container) {
                this._render();
            }
        },
        setActiveLayer: function(layer) {
            var l = layer && this._layers[L.stamp(layer)];
            if (!l || l.id === this._activeLayerId) {
                return;
            }
            this._previousLayerId = this._activeLayerId;
            this._activeLayerId = l.id;
            if (this._container) {
                this._render();
            }
            this.fire('activelayerchange', {
                layer: layer
            });
        },
        expand: function() {
            this._arrangeLayers().slice(1).map(function(l) {
                var el = this._getLayerCellByLayerId(l.id);
                L.DomUtil.removeClass(el, 'leaflet-iconLayers-layerCell_hidden');
            }.bind(this));
        },
        collapse: function() {
            this._arrangeLayers().slice(1).map(function(l) {
                var el = this._getLayerCellByLayerId(l.id);
                L.DomUtil.addClass(el, 'leaflet-iconLayers-layerCell_hidden');
            }.bind(this));
        }
    });

    var iconLayers = function(layers, options) {
        return new IconLayers(layers, options);
    };

    iconLayers.Constructor = IconLayers;

    return iconLayers;
});
window.nsGmx.Translations.addText('rus', {
    gmxIconLayers: {
        zoominpls: 'Приблизьте карту, чтобы активировать слой',
        zoomoutpls: 'Отдалите карту, чтобы активировать слой'
    }
});

window.nsGmx.Translations.addText('eng', {
    gmxIconLayers: {
        zoominpls: 'Zoom in to enable layer',
        zoomoutpls: 'Zoom out to enable layer'
    }
});

window.L.Control.GmxIconLayers = window.L.Control.IconLayers.extend({
    _updateLayers: function() {
        var lang = nsGmx && nsGmx.Translations && nsGmx.Translations.getLanguage() || 'rus';
        var blm = this._baseLayersManager;
        var layers = blm.getActiveIDs().map(function(id) {
            var layer = blm.get(id);
            if (!layer) {
                return null;
            } else {
                return {
                    layer: layer,
                    icon: layer.options.icon,
                    title: layer.options[lang]
                }
            }
        }).filter(function(e) {
            return e;
        });

        this.setLayers(layers);
        this.setActiveLayer(
            blm.get(
                blm.getCurrentID()
            )
        );

        this._updateDisabledLayers();
    },
    _updateDisabledLayers: function() {
        this._disabledLayerIds = this._map ? this._baseLayersManager.getActiveIDs().map(function(id) {
            return this._baseLayersManager.get(id);
        }.bind(this)).filter(function(l) {
            return !!l && (this._map.getZoom() < l.options.minZoom || this._map.getZoom() > l.options.maxZoom);
        }.bind(this)).map(function(l) {
            return L.stamp(l) + '';
        }) : [];
        this._updateDisabledLayersStyle();
    },
    _updateDisabledLayersStyle: function() {
        var els = this._container ? this._container.getElementsByClassName('leaflet-iconLayers-layerCell') : [];

        Array.prototype.slice.call(els).map(function(el) {
            var elId = el.getAttribute('data-layerid');
            if (this._disabledLayerIds.indexOf(elId) + 1) {
                L.DomUtil.addClass(el, 'leaflet-iconLayers-layerCell_disabled');
            } else {
                L.DomUtil.removeClass(el, 'leaflet-iconLayers-layerCell_disabled');
            }
        }.bind(this));
    },
    _updatePopoversContent: function() {
        var els = this._container ? this._container.getElementsByClassName('leaflet-iconLayers-layerCell') : [];

        var defaultTemplate = (new $.fn.popover.Constructor()).getDefaults().template;

        function createPopover(el, text) {
            $(el).popover({
                viewport: {
                    selector: this._map && this._map.getContainer(),
                    padding: 10
                },
                container: this._map && this._map.getContainer(),
                content: text,
                trigger: 'manual',
                placement: this.options.position.indexOf('bottom') != -1 ? 'top' : 'bottom',
                html: true,
                template: $(defaultTemplate).css('pointer-events', 'none')[0].outerHTML
            });
            if (el.mouseIsOver) {
                $(el).popover('show');
            }
        }

        Array.prototype.slice.call(els).map(function(el) {
            var elId = el.getAttribute('data-layerid');
            var layerEl = el.getElementsByClassName('leaflet-iconLayers-layer')[0];
            var layer = this._layers[elId].layer;
            if (layer.options.maxZoom && this._map && this._map.getZoom() > layer.options.maxZoom) {
                $(layerEl).popover('destroy');
                createPopover.call(this, layerEl, nsGmx.Translations.getText('gmxIconLayers.zoomoutpls'));
            } else if (layer.options.minZoom && this._map && this._map.getZoom() < layer.options.minZoom) {
                $(layerEl).popover('destroy');
                createPopover.call(this, layerEl, nsGmx.Translations.getText('gmxIconLayers.zoominpls'));
            } else if (layer.options.description) {
                $(layerEl).popover('destroy');
                createPopover.call(this, layerEl, layer.options.description);
            } else {
                $(layerEl).popover('destroy');
            }
        }.bind(this));
    },
    _createLayerElement: function(layerObj) {
        var layer = layerObj.layer;
        var el = L.Control.IconLayers.prototype._createLayerElement.call(this, layerObj);
        var shutterEl = L.DomUtil.create('div', 'leaflet-iconLayers-layerShutter');
        $(el).prepend(shutterEl);
        el.addEventListener('mouseover', function(e) {
            e.currentTarget.mouseIsOver = true;
            $(e.currentTarget).popover('show');
        });
        el.addEventListener('mouseout', function(e) {
            e.currentTarget.mouseIsOver = false;
            $(e.currentTarget).popover('hide');
        });
        return el;
    },
    _render: function() {
        L.Control.IconLayers.prototype._render.apply(this, arguments);
        this._updateDisabledLayers();
        this._updatePopoversContent();
    },
    _onLayerClick: function(e) {
        e.stopPropagation();
        $(e.currentTarget).find('.leaflet-iconLayers-layer').popover('hide')
        var layerId = e.currentTarget.getAttribute('data-layerid');
        if (this._disabledLayerIds.indexOf(layerId) === -1) {
            var layer = this._layers[layerId];
            this.setActiveLayer(layer.layer);
        }
        this.expand();
    },
    initialize: function(gmxBaseLayersManager, options) {
        L.Control.IconLayers.prototype.initialize.call(this, [], L.extend(options || {}, {
            manageLayers: false
        }));

        this._baseLayersManager = gmxBaseLayersManager;
        this._updateLayers();

        this.on('activelayerchange', function(le) {
            this._baseLayersManager.setCurrentID(le.layer.id);
        }.bind(this));

        this._baseLayersManager.on('baselayeradd', this._updateLayers.bind(this));
        this._baseLayersManager.on('baselayerremove', this._updateLayers.bind(this));
        this._baseLayersManager.on('baselayeractiveids', this._updateLayers.bind(this));
        this._baseLayersManager.on('baselayerchange', this._updateLayers.bind(this));
        this._baseLayersManager.on('baselayerlayerschange', this._updateLayers.bind(this));
    },
    onAdd: function() {
        var container = L.Control.IconLayers.prototype.onAdd.apply(this, arguments);
        this._map.on('zoomend', function() {
            this._updateDisabledLayers();
            this._updatePopoversContent();
        }.bind(this));
        return container;
    }
});

/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 6);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var EventTarget = function () {
    function EventTarget() {
        _classCallCheck(this, EventTarget);

        this.listeners = {};
    }

    _createClass(EventTarget, [{
        key: "addEventListener",
        value: function addEventListener(type, callback) {
            if (!(type in this.listeners)) {
                this.listeners[type] = [];
            }
            this.listeners[type].push(callback);
        }
    }, {
        key: "removeEventListener",
        value: function removeEventListener(type, callback) {
            if (!(type in this.listeners)) {
                return;
            }
            var stack = this.listeners[type];
            for (var i = 0, l = stack.length; i < l; i++) {
                if (stack[i] === callback) {
                    stack.splice(i, 1);
                    return this.removeEventListener(type, callback);
                }
            }
        }
    }, {
        key: "dispatchEvent",
        value: function dispatchEvent(event) {
            if (!(event.type in this.listeners)) {
                return;
            }
            var stack = this.listeners[event.type];
            // event.target = this;
            for (var i = 0, l = stack.length; i < l; i++) {
                stack[i].call(this, event);
            }
        }
    }]);

    return EventTarget;
}();

exports.EventTarget = EventTarget;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SearchWidget = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

__webpack_require__(8);

var _ResultView = __webpack_require__(7);

var _EventTarget2 = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function chain(tasks, state) {
    return tasks.reduce(function (prev, next) {
        return prev.then(next);
    }, new Promise(function (resolve, reject) {
        return resolve(state);
    }));
}

var SearchWidget = function (_EventTarget) {
    _inherits(SearchWidget, _EventTarget);

    function SearchWidget(container, _ref) {
        var placeHolder = _ref.placeHolder,
            providers = _ref.providers,
            _ref$suggestionTimeou = _ref.suggestionTimeout,
            suggestionTimeout = _ref$suggestionTimeou === undefined ? 1000 : _ref$suggestionTimeou,
            _ref$suggestionLimit = _ref.suggestionLimit,
            suggestionLimit = _ref$suggestionLimit === undefined ? 10 : _ref$suggestionLimit,
            _ref$fuzzySearchLimit = _ref.fuzzySearchLimit,
            fuzzySearchLimit = _ref$fuzzySearchLimit === undefined ? 1000 : _ref$fuzzySearchLimit,
            _ref$retrieveManyOnEn = _ref.retrieveManyOnEnter,
            retrieveManyOnEnter = _ref$retrieveManyOnEn === undefined ? false : _ref$retrieveManyOnEn,
            _ref$replaceInputOnEn = _ref.replaceInputOnEnter,
            replaceInputOnEnter = _ref$replaceInputOnEn === undefined ? false : _ref$replaceInputOnEn;

        _classCallCheck(this, SearchWidget);

        var _this = _possibleConstructorReturn(this, (SearchWidget.__proto__ || Object.getPrototypeOf(SearchWidget)).call(this));

        _this._container = container;
        _this._allowSuggestion = true;
        _this._providers = providers;
        _this._suggestionTimeout = suggestionTimeout;
        _this._suggestionLimit = suggestionLimit;
        _this._fuzzySearchLimit = fuzzySearchLimit;
        _this._retrieveManyOnEnter = retrieveManyOnEnter;
        _this._replaceInputOnEnter = replaceInputOnEnter;

        _this._container.classList.add('leaflet-ext-search');
        _this._container.innerHTML = '<input type="text" value="" placeholder="' + placeHolder + '" /><span class="leaflet-ext-search-button"></span>';
        _this._input = _this._container.querySelector('input');

        _this._handleChange = _this._handleChange.bind(_this);
        _this._input.addEventListener('input', _this._handleChange);

        _this._handleMouseMove = _this._handleMouseMove.bind(_this);
        _this._input.addEventListener('mousemove', _this._handleMouseMove);
        _this._input.addEventListener('dragstart', _this._handleMouseMove);
        _this._input.addEventListener('drag', _this._handleMouseMove);

        _this._handleSearch = _this._handleSearch.bind(_this);

        _this._button = _this._container.querySelector('.leaflet-ext-search-button');
        _this._button.addEventListener('click', _this._handleSearch);

        _this.results = new _ResultView.ResultView({ input: _this._input, replaceInput: _this._replaceInputOnEnter });

        _this._search = _this._search.bind(_this);
        _this._selectItem = _this._selectItem.bind(_this);

        _this.results.addEventListener('suggestions:confirm', function (e) {
            var event = document.createEvent('Event');
            event.initEvent('suggestions:confirm', false, false);
            event.detail = e.detail;
            _this.dispatchEvent(event);
            _this._search(e);
        });
        _this.results.addEventListener('suggestions:select', _this._selectItem);

        // map.on ('click', this.results.hide.bind(this.results));
        // map.on ('dragstart', this.results.hide.bind(this.results));
        return _this;
    }

    _createClass(SearchWidget, [{
        key: '_suggest',
        value: function _suggest(text) {
            var _this2 = this;

            this.results.allowNavigation = false;
            var tasks = this._providers.filter(function (provider) {
                return provider.showSuggestion;
            }).map(function (provider) {
                return function (state) {
                    return new Promise(function (resolve) {
                        if (state.completed) {
                            resolve(state);
                        } else {
                            provider.find(text, _this2._suggestionLimit, false, false).then(function (response) {
                                state.completed = response.length > 0;
                                state.response = state.response.concat(response);
                                resolve(state);
                            }).catch(function (e) {
                                return console.log(e);
                            });
                        }
                    });
                };
            });
            chain(tasks, { completed: false, response: [] }).then(function (state) {
                _this2.results.show(state.response, text.trim());
                _this2.results.allowNavigation = true;
            });
        }
    }, {
        key: '_handleChange',
        value: function _handleChange(e) {
            var _this3 = this;

            if (this._input.value.length) {
                if (this._allowSuggestion) {
                    this._allowSuggestion = false;
                    this._timer = setTimeout(function () {
                        clearTimeout(_this3._timer);
                        _this3._allowSuggestion = true;
                        var text = _this3._input.value;
                        _this3._suggest(text);
                    }, this._suggestionTimeout);
                }
            } else {
                this.results.hide();
            }
        }
    }, {
        key: '_handleMouseMove',
        value: function _handleMouseMove(e) {
            e.stopPropagation();
            e.preventDefault();
        }
    }, {
        key: '_search',
        value: function _search(e) {
            var _this4 = this;

            var text = e.detail;
            var tasks = this._providers.filter(function (provider) {
                return provider.showOnEnter;
            }).map(function (provider) {
                return function (state) {
                    return new Promise(function (resolve) {
                        if (state.completed) {
                            resolve(state);
                        } else {
                            provider.find(text, _this4._retrieveManyOnEnter ? _this4._fuzzySearchLimit : 1, true, true).then(function (response) {
                                state.completed = response.length > 0;
                                state.response = state.response.concat(response);
                                resolve(state);
                            }).catch(function (e) {
                                console.log(e);
                                resolve(state);
                            });
                        }
                    });
                };
            });

            chain(tasks, { completed: false, response: [] }).then(function (state) {
                // if(state.response.length > 0 && !this._retrieveManyOnEnter){
                //     let item = state.response[0];
                //     item.provider
                //     .fetch(item.properties)
                //     .then(response => {});                    
                // }
            });

            this.results && this.results.hide();
        }
    }, {
        key: '_selectItem',
        value: function _selectItem(e) {
            var item = e.detail;
            return item.provider.fetch(item.properties);
        }
    }, {
        key: '_handleSearch',
        value: function _handleSearch(e) {
            e.stopPropagation();
            this._search({ detail: this._input.value });
        }
    }, {
        key: 'setText',
        value: function setText(text) {
            this._input.value = text;
        }
    }, {
        key: 'setPlaceHolder',
        value: function setPlaceHolder(value) {
            this._input.placeholder = value;
        }
    }]);

    return SearchWidget;
}(_EventTarget2.EventTarget);

exports.SearchWidget = SearchWidget;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CadastreDataProvider = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventTarget2 = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CadastreDataProvider = function (_EventTarget) {
    _inherits(CadastreDataProvider, _EventTarget);

    function CadastreDataProvider(_ref) {
        var serverBase = _ref.serverBase,
            tolerance = _ref.tolerance;

        _classCallCheck(this, CadastreDataProvider);

        var _this = _possibleConstructorReturn(this, (CadastreDataProvider.__proto__ || Object.getPrototypeOf(CadastreDataProvider)).call(this));

        _this._serverBase = serverBase;
        _this._tolerance = tolerance;
        _this.showSuggestion = true;
        _this.showOnSelect = false;
        _this.showOnEnter = true;
        _this._cadastreLayers = [{ id: 1, title: 'Участок', reg: /^\d\d:\d+:\d+:\d+$/ }, { id: 2, title: 'Квартал', reg: /^\d\d:\d+:\d+$/ }, { id: 3, title: 'Район', reg: /^\d\d:\d+$/ }, { id: 4, title: 'Округ', reg: /^\d\d$/ }, { id: 5, title: 'ОКС', reg: /^\d\d:\d+:\d+:\d+:\d+$/ }, { id: 10, title: 'ЗОУИТ', reg: /^\d+\.\d+\.\d+/ }
        // ,
        // {id: 7, title: 'Границы', 	reg: /^\w+$/},
        // {id: 6, title: 'Тер.зоны', 	reg: /^\w+$/},
        // {id: 12, title: 'Лес', 		reg: /^\w+$/},
        // {id: 13, title: 'Красные линии', 		reg: /^\w+$/},
        // {id: 15, title: 'СРЗУ', 	reg: /^\w+$/},
        // {id: 16, title: 'ОЭЗ', 		reg: /^\w+$/},
        // {id: 9, title: 'ГОК', 		reg: /^\w+$/},
        // {id: 10, title: 'ЗОУИТ', 	reg: /^\w+$/}
        // /[^\d\:]/g,
        // /\d\d:\d+$/,
        // /\d\d:\d+:\d+$/,
        // /\d\d:\d+:\d+:\d+$/
        ];
        return _this;
    }

    _createClass(CadastreDataProvider, [{
        key: 'getCadastreLayer',
        value: function getCadastreLayer(str, type) {
            str = str.trim();
            for (var i = 0, len = this._cadastreLayers.length; i < len; i++) {
                var it = this._cadastreLayers[i];
                if (it.id === type) {
                    return it;
                }
                if (it.reg.exec(str)) {
                    return it;
                }
            }
            return this._cadastreLayers[0];
        }
    }, {
        key: 'find',
        value: function find(value, limit, strong, retrieveGeometry) {
            var _this2 = this;

            var cadastreLayer = this.getCadastreLayer(value);
            return new Promise(function (resolve) {
                // let req = new Request(`${this._serverBase}/typeahead?limit=${limit}&skip=0&text=${value}&type=${cadastreLayer.id}`);
                var req = new Request(_this2._serverBase + '/features/' + cadastreLayer.id + '?text=' + value + '&tolerance=' + _this2._tolerance + '&limit=' + limit);
                var headers = new Headers();
                headers.append('Content-Type', 'application/json');
                var init = {
                    method: 'GET',
                    mode: 'cors',
                    cache: 'default'
                };
                fetch(req, init).then(function (response) {
                    return response.json();
                }).then(function (json) {
                    // if(json.status === 200){
                    var rs = json.features.map(function (x) {
                        return {
                            name: x.attrs.name || x.attrs.cn || x.attrs.id,
                            properties: x,
                            provider: _this2,
                            query: value
                        };
                    });
                    resolve(rs);
                    // }
                    // else {
                    // resolve(json);
                    // }                                       
                });
            });
        }
    }, {
        key: 'fetch',
        value: function (_fetch) {
            function fetch(_x) {
                return _fetch.apply(this, arguments);
            }

            fetch.toString = function () {
                return _fetch.toString();
            };

            return fetch;
        }(function (obj) {
            var _this3 = this;

            var text = obj.attrs.name || obj.attrs.cn || obj.attrs.id;
            var cadastreLayer = this.getCadastreLayer(text, obj.type);
            return new Promise(function (resolve) {
                if (cadastreLayer) {
                    // let req = new Request(`${this._serverBase}/features/${cadastreLayer.id}?tolerance=${this._tolerance}&limit=1&text=${obj.value}`);
                    var req = new Request(_this3._serverBase + '/features/' + cadastreLayer.id + '?tolerance=' + _this3._tolerance + '&limit=1&text=' + text);
                    var headers = new Headers();
                    headers.append('Content-Type', 'application/json');
                    var init = {
                        method: 'GET',
                        mode: 'cors',
                        cache: 'default'
                    };
                    fetch(req, init).then(function (response) {
                        return response.json();
                    }).then(function (json) {
                        if (json.status === 200) {
                            var event = document.createEvent('Event');
                            event.initEvent('fetch', false, false);
                            event.detail = json;
                            _this3.dispatchEvent(event);

                            var rs = json.features.map(function (x) {
                                return {
                                    name: x.attrs.name || x.attrs.cn || x.attrs.id,
                                    properties: x,
                                    provider: _this3,
                                    query: obj
                                };
                            });
                            resolve(rs);
                        } else {
                            resolve(json);
                        }
                    });
                } else {
                    resolve([]);
                }
            });
        })
    }]);

    return CadastreDataProvider;
}(_EventTarget2.EventTarget);

exports.CadastreDataProvider = CadastreDataProvider;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CoordinatesDataProvider = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventTarget2 = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CoordinatesDataProvider = function (_EventTarget) {
    _inherits(CoordinatesDataProvider, _EventTarget);

    function CoordinatesDataProvider() {
        _classCallCheck(this, CoordinatesDataProvider);

        var _this = _possibleConstructorReturn(this, (CoordinatesDataProvider.__proto__ || Object.getPrototypeOf(CoordinatesDataProvider)).call(this));

        _this.showSuggestion = false;
        _this.showOnSelect = false;
        _this.showOnEnter = true;
        _this.fetch = _this.fetch.bind(_this);
        _this.find = _this.find.bind(_this);

        _this.rxF = new RegExp('^\\s*\\-?(\\d+(\\.\\d+)?)(\\s+[N|S])?(,\\s*|\\s+)\\-?(\\d+(\\.\\d+)?)(\\s+[E|W])?');
        _this.rxD = new RegExp('^\\s*(\\d{1,2})[\\s|\\u00b0](\\d{1,2})[\\s|\\u0027](\\d{1,2}\\.\\d+)\\u0022?(\\s+[N|S])?,?\\s+(\\d{1,2})[\\s|\\u00b0](\\d{1,2})[\\s|\\u0027](\\d{1,2}\\.\\d+)\\u0022?(\\s+[E|W])?');
        return _this;
    }

    _createClass(CoordinatesDataProvider, [{
        key: '_parseCoordinates',
        value: function _parseCoordinates(value) {
            var m = this.rxD.exec(value);
            if (Array.isArray(m) && m.length === 9) {
                return this._parseDegrees([m[1], m[2], m[3], m[5], m[6], m[7]].map(function (x) {
                    return parseFloat(x);
                }));
            }
            m = this.rxF.exec(value);
            if (Array.isArray(m) && m.length === 8) {
                return { type: 'Point', coordinates: [parseFloat(m[5]), parseFloat(m[1])] };
            }

            return null;
        }
    }, {
        key: '_parseDegrees',
        value: function _parseDegrees(_ref) {
            var _ref2 = _slicedToArray(_ref, 6),
                latDeg = _ref2[0],
                latMin = _ref2[1],
                latSec = _ref2[2],
                lngDeg = _ref2[3],
                lngMin = _ref2[4],
                lngSec = _ref2[5];

            return { type: 'Point', coordinates: [lngDeg + lngMin / 60 + lngSec / 3600, latDeg + latMin / 60 + latSec / 3600] };
        }
    }, {
        key: 'fetch',
        value: function fetch(value) {
            return new Promise(function (resolve) {
                return resolve([]);
            });
        }
    }, {
        key: 'find',
        value: function find(value, limit, strong, retrieveGeometry) {
            var _this2 = this;

            var g = this._parseCoordinates(value);
            return new Promise(function (resolve) {
                var result = { feature: { type: 'Feature', geometry: g, properties: {} }, provider: _this2, query: value };
                if (g) {
                    var event = document.createEvent('Event');
                    event.initEvent('fetch', false, false);
                    event.detail = result;
                    _this2.dispatchEvent(event);
                }
                resolve(g ? [result] : []);
            });
        }
    }]);

    return CoordinatesDataProvider;
}(_EventTarget2.EventTarget);

exports.CoordinatesDataProvider = CoordinatesDataProvider;

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.OsmDataProvider = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventTarget2 = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OsmDataProvider = function (_EventTarget) {
    _inherits(OsmDataProvider, _EventTarget);

    function OsmDataProvider(_ref) {
        var serverBase = _ref.serverBase;

        _classCallCheck(this, OsmDataProvider);

        var _this = _possibleConstructorReturn(this, (OsmDataProvider.__proto__ || Object.getPrototypeOf(OsmDataProvider)).call(this));

        _this._serverBase = serverBase;
        _this.showSuggestion = true;
        _this.showOnSelect = true;
        _this.showOnEnter = true;
        _this.find = _this.find.bind(_this);
        _this.fetch = _this.fetch.bind(_this);
        _this._convertGeometry = _this._convertGeometry.bind(_this);

        _this._key = window.KOSMOSNIMKI_SESSION_KEY == null || window.KOSMOSNIMKI_SESSION_KEY == 'INVALID' ? '' : '&key=' + window.KOSMOSNIMKI_SESSION_KEY;
        return _this;
    }

    _createClass(OsmDataProvider, [{
        key: '_convertGeometry',
        value: function _convertGeometry(geometry) {
            switch (geometry.type.toUpperCase()) {
                case 'POINT':
                    geometry.type = 'Point';
                    break;
                case 'POLYGON':
                    geometry.type = 'Polygon';
                    break;
                case 'MULTIPOLYGON':
                    geometry.type = 'MultiPolygon';
                    break;
                case 'LINESTRING':
                case 'POLYLINE':
                    geometry.type = 'LineString';
                    break;
                case 'MULTILINESTRING':
                    geometry.type = 'MultiLineString';
                    break;
                default:
                    throw 'Unknown WKT type';
            }
            return geometry;
        }
    }, {
        key: 'fetch',
        value: function (_fetch) {
            function fetch(_x) {
                return _fetch.apply(this, arguments);
            }

            fetch.toString = function () {
                return _fetch.toString();
            };

            return fetch;
        }(function (obj) {
            var _this2 = this;

            var query = 'WrapStyle=None&RequestType=ID&ID=' + obj.ObjCode + '&TypeCode=' + obj.TypeCode + '&UseOSM=1';
            var req = new Request(this._serverBase + '/SearchObject/SearchAddress.ashx?' + query + this._key);
            var headers = new Headers();
            headers.append('Content-Type', 'application/json');
            var init = {
                method: 'GET',
                mode: 'cors',
                credentials: 'include',
                cache: 'default'
            };
            return new Promise(function (resolve, reject) {
                fetch(req, init).then(function (response) {
                    return response.json();
                }).then(function (json) {
                    if (json.Status === 'ok') {
                        var rs = json.Result.reduce(function (a, x) {
                            return a.concat(x.SearchResult);
                        }, []).map(function (x) {
                            var g = _this2._convertGeometry(x.Geometry);
                            var props = Object.keys(x).filter(function (k) {
                                return k !== 'Geometry';
                            }).reduce(function (a, k) {
                                a[k] = x[k];
                                return a;
                            }, {});
                            return {
                                feature: {
                                    type: 'Feature',
                                    geometry: g,
                                    properties: props
                                },
                                provider: _this2,
                                query: obj
                            };
                        });
                        var event = document.createEvent('Event');
                        event.initEvent('fetch', false, false);
                        event.detail = rs;
                        _this2.dispatchEvent(event);
                        resolve(rs);
                    } else {
                        reject(json);
                    }
                }).catch(function (response) {
                    return reject(response);
                });
            });
        })
    }, {
        key: 'find',
        value: function find(value, limit, strong, retrieveGeometry) {
            var _this3 = this;

            return new Promise(function (resolve, reject) {
                if (value || value.trim()) {
                    var _strong = Boolean(strong) ? 1 : 0;
                    var _withoutGeometry = Boolean(retrieveGeometry) ? 0 : 1;
                    var query = 'WrapStyle=None&RequestType=SearchObject&IsStrongSearch=' + _strong + '&WithoutGeometry=' + _withoutGeometry + '&UseOSM=1&Limit=' + limit + '&SearchString=' + encodeURIComponent(value);
                    var req = new Request(_this3._serverBase + '/SearchObject/SearchAddress.ashx?' + query + _this3._key);
                    var headers = new Headers();
                    headers.append('Content-Type', 'application/json');
                    var init = {
                        method: 'GET',
                        mode: 'cors',
                        credentials: 'include',
                        cache: 'default'
                    };
                    fetch(req, init).then(function (response) {
                        return response.json();
                    }).then(function (json) {
                        if (json.Status === 'ok') {
                            var rs = json.Result.reduce(function (a, x) {
                                return a.concat(x.SearchResult);
                            }, []).map(function (x) {
                                if (retrieveGeometry && x.Geometry) {
                                    var g = _this3._convertGeometry(x.Geometry);
                                    var props = Object.keys(x).filter(function (k) {
                                        return k !== 'Geometry';
                                    }).reduce(function (a, k) {
                                        a[k] = x[k];
                                        return a;
                                    }, {});
                                    return {
                                        name: x.ObjNameShort,
                                        feature: {
                                            type: 'Feature',
                                            geometry: g,
                                            properties: props
                                        },
                                        properties: props,
                                        provider: _this3,
                                        query: value
                                    };
                                } else {
                                    return {
                                        name: x.ObjNameShort,
                                        properties: x,
                                        provider: _this3,
                                        query: value
                                    };
                                }
                            });
                            if (strong && retrieveGeometry) {
                                var event = document.createEvent('Event');
                                event.initEvent('fetch', false, false);
                                event.detail = rs;
                                _this3.dispatchEvent(event);
                            }
                            resolve(rs);
                        } else {
                            reject(json);
                        }
                    }).catch(function (response) {
                        return reject(response);
                    });
                } else {
                    reject('Empty string');
                }
            });
        }
    }]);

    return OsmDataProvider;
}(_EventTarget2.EventTarget);

exports.OsmDataProvider = OsmDataProvider;

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.SearchControl = undefined;

var _SearchWidget = __webpack_require__(1);

var SearchControl = L.Control.extend({
    includes: L.Evented ? L.Evented.prototype : L.Mixin.Events,
    initialize: function initialize(options) {
        L.setOptions(this, options);
        this._allowSuggestion = true;
        this.options.suggestionTimeout = this.options.suggestionTimeout || 1000;
        this.options.suggestionLimit = this.options.suggestionLimit || 10;
    },
    onAdd: function onAdd(map) {
        this._container = L.DomUtil.create('div', 'leaflet-ext-search');
        this._widget = new _SearchWidget.SearchWidget(this._container, this.options);
        map.on('click', this._widget.results.hide.bind(this._widget.results));
        map.on('dragstart', this._widget.results.hide.bind(this._widget.results));
        return this._container;
    },
    addTo: function addTo(map) {
        L.Control.prototype.addTo.call(this, map);
        if (this.options.addBefore) {
            this.addBefore(this.options.addBefore);
        }
        return this;
    },

    addBefore: function addBefore(id) {
        var parentNode = this._parent && this._parent._container;
        if (!parentNode) {
            parentNode = this._map && this._map._controlCorners[this.getPosition()];
        }
        if (!parentNode) {
            this.options.addBefore = id;
        } else {
            for (var i = 0, len = parentNode.childNodes.length; i < len; i++) {
                var it = parentNode.childNodes[i];
                if (id === it._id) {
                    parentNode.insertBefore(this._container, it);
                    break;
                }
            }
        }
        return this;
    },

    setText: function setText(text) {
        this._widget.setText(text);
    },
    setPlaceHolder: function setPlaceHolder(value) {
        this._widget.setPlaceHolder(value);
    }
});

exports.SearchControl = SearchControl;

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _SearchWidget = __webpack_require__(1);

var _SearchControl = __webpack_require__(5);

var _OsmDataProvider = __webpack_require__(4);

var _CoordinatesDataProvider = __webpack_require__(3);

var _CadastreDataProvider = __webpack_require__(2);

window.nsGmx = window.nsGmx || {};
window.nsGmx.SearchWidget = _SearchWidget.SearchWidget;
window.nsGmx.SearchControl = _SearchControl.SearchControl;
window.nsGmx.OsmDataProvider = _OsmDataProvider.OsmDataProvider;
window.nsGmx.CoordinatesDataProvider = _CoordinatesDataProvider.CoordinatesDataProvider;
window.nsGmx.CadastreDataProvider = _CadastreDataProvider.CadastreDataProvider;

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ResultView = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventTarget2 = __webpack_require__(0);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ResultView = function (_EventTarget) {
    _inherits(ResultView, _EventTarget);

    function ResultView(_ref) {
        var input = _ref.input,
            _ref$replaceInput = _ref.replaceInput,
            replaceInput = _ref$replaceInput === undefined ? false : _ref$replaceInput;

        _classCallCheck(this, ResultView);

        var _this = _possibleConstructorReturn(this, (ResultView.__proto__ || Object.getPrototypeOf(ResultView)).call(this));

        _this._input = input;
        _this.index = -1;
        _this.count = 0;
        _this._item = null;
        _this._inputText = '';
        _this._replaceInput = replaceInput;
        _this._list = L.DomUtil.create('div');
        _this._list.setAttribute('class', 'leaflet-ext-search-list noselect');

        _this.allowNavigation = true;

        _this._list.style.top = _this._input.offsetTop + _this._input.offsetHeight + 2 + 'px';
        _this._list.style.left = _this._input.offsetLeft + 'px';

        _this._handleKey = _this._handleKey.bind(_this);
        _this._input.addEventListener('keydown', _this._handleKey);

        _this._handleInputClick = _this._handleInputClick.bind(_this);
        _this._input.addEventListener('click', _this._handleInputClick);

        _this._handleFocus = _this._handleFocus.bind(_this);
        _this._input.addEventListener('focus', _this._handleFocus);
        _this._list.addEventListener('keydown', _this._handleKey);

        _this._handleWheel = _this._handleWheel.bind(_this);
        _this._list.addEventListener('wheel', _this._handleWheel);
        L.DomEvent.disableClickPropagation(_this._list).disableScrollPropagation(_this._list);
        // this._list.addEventListener('mousewheel', this._handleWheel.bind(this));
        // this._list.addEventListener('MozMousePixelScroll', this._handleWheel.bind(this));       
        _this._input.parentElement.appendChild(_this._list);

        _this._handleChange = _this._handleChange.bind(_this);
        _this._input.addEventListener('input', _this._handleChange);
        return _this;
    }

    _createClass(ResultView, [{
        key: '_handleInputClick',
        value: function _handleInputClick(e) {
            e.stopPropagation();
        }
    }, {
        key: '_handleFocus',
        value: function _handleFocus(e) {
            if (this.index >= 0) {
                var el = this._list.querySelector('[tabindex="' + this.index + '"]');
                L.DomUtil.removeClass(el, 'leaflet-ext-search-list-selected');
            }
            this.index = -1;
            this._item = null;
        }
    }, {
        key: '_handleChange',
        value: function _handleChange(e) {
            this._inputText = this._input.value;
        }
    }, {
        key: '_handleWheel',
        value: function _handleWheel(e) {
            e.stopPropagation();
        }
    }, {
        key: '_handleKey',
        value: function _handleKey(e) {
            if (this.listVisible()) {
                switch (e.keyCode) {
                    // ArroLeft / ArrowRight
                    case 37:
                    case 39:
                        e.stopPropagation();
                        break;
                    // ArrowDown
                    case 40:
                        e.preventDefault();
                        e.stopPropagation();
                        if (this.allowNavigation) {
                            if (this.index < 0) {
                                this.index = 0;
                            } else if (0 <= this.index && this.index < this.count - 1) {
                                var _el = this._list.querySelector('[tabindex="' + this.index + '"]');
                                L.DomUtil.removeClass(_el, 'leaflet-ext-search-list-selected');
                                ++this.index;
                            } else {
                                var _el2 = this._list.querySelector('[tabindex="' + this.index + '"]');
                                L.DomUtil.removeClass(_el2, 'leaflet-ext-search-list-selected');
                                this.index = this.count - 1;
                            }
                            var el = this._list.querySelector('[tabindex="' + this.index + '"]');
                            L.DomUtil.addClass(el, 'leaflet-ext-search-list-selected');
                            this.selectItem(this.index);
                            el.focus();
                        }
                        break;
                    // ArrowUp
                    case 38:
                        e.preventDefault();
                        e.stopPropagation();
                        if (this.allowNavigation) {
                            if (this.index > 0) {
                                var _el3 = this._list.querySelector('[tabindex="' + this.index + '"]');
                                L.DomUtil.removeClass(_el3, 'leaflet-ext-search-list-selected');
                                --this.index;
                                _el3 = this._list.querySelector('[tabindex="' + this.index + '"]');
                                L.DomUtil.addClass(_el3, 'leaflet-ext-search-list-selected');
                                this.selectItem(this.index);
                                _el3.focus();
                            } else if (this.index === 0) {
                                this._input.focus();
                                this._input.value = this._inputText;
                            }
                        }
                        break;
                    // Enter
                    case 13:
                        if (this.index < 0 && this._input.value) {
                            var text = this._input.value;
                            this._input.focus();
                            this._input.setSelectionRange(text.length, text.length);
                            this.hide();

                            var event = document.createEvent('Event');
                            event.initEvent('suggestions:confirm', false, false);
                            event.detail = text;
                            this.dispatchEvent(event);
                        } else {
                            this.complete(this.index);
                        }
                        break;
                    // Escape
                    case 27:
                        if (this.index < 0) {
                            this.hide();
                        }
                        this._input.focus();
                        this._input.value = this._inputText;
                        break;
                    default:
                        break;
                }
            } else {
                if (e.keyCode === 13 && this._input.value) {
                    var _text = this._input.value;
                    this._input.setSelectionRange(_text.length, _text.length);

                    var _event = document.createEvent('Event');
                    _event.initEvent('suggestions:confirm', false, false);
                    _event.detail = _text;
                    this.dispatchEvent(_event);
                } else if (e.keyCode === 27) {
                    this._input.value = '';
                    this.index = -1;
                    this._input.focus();
                }
            }
        }
    }, {
        key: 'listVisible',
        value: function listVisible() {
            return this.count > 0 && this._list.style.display !== 'none';
        }
    }, {
        key: 'selectItem',
        value: function selectItem(i) {
            this._item = this._items[i];
            var text = this._item.name;
            if (this._replaceInput) {
                this._input.value = text;
                this._input.setSelectionRange(text.length, text.length);
            }
        }
    }, {
        key: '_handleClick',
        value: function _handleClick(i, e) {
            e.preventDefault();
            this.complete(i);
        }
    }, {
        key: 'complete',
        value: function complete(i) {
            var item = i >= 0 ? this._items[i] : this._item ? this._item : null;
            if (item) {
                this._item = item;
                this.index = -1;
                var text = item.name;
                if (this._replaceInput) {
                    this._input.value = text;
                    this._input.setSelectionRange(text.length, text.length);
                }
                this._input.focus();
                this.hide();

                var event = document.createEvent('Event');
                event.initEvent('suggestions:select', false, false);
                event.detail = item;
                this.dispatchEvent(event);
            }
        }
    }, {
        key: 'show',
        value: function show(items, highlight) {
            if (items.length) {
                this._item = null;
                this.index = -1;
                this._items = items;
                var html = '<ul>' + this._items.filter(function (x) {
                    return x.name && x.name.length;
                }).map(function (x, i) {
                    var name = '<span class="leaflet-ext-search-list-item-normal">' + x.name + '</span>';
                    if (highlight && highlight.length) {
                        var start = x.name.toLowerCase().indexOf(highlight.toLowerCase());
                        if (start != -1) {
                            var head = x.name.substr(0, start);
                            if (head.length) {
                                head = '<span class="leaflet-ext-search-list-item-normal">' + head + '</span>';
                            }
                            var tail = x.name.substr(start + highlight.length);
                            if (tail.length) {
                                tail = '<span class="leaflet-ext-search-list-item-normal">' + tail + '</span>';
                            }
                            name = head + '<span class="leaflet-ext-search-list-item-highlight">' + highlight + '</span>' + tail;
                        }
                    }
                    return '<li tabindex=' + i + '>' + name + '</li>';
                }, []).join('') + '</ul>';

                this._list.innerHTML = html;
                var elements = this._list.querySelectorAll('li');
                for (var i = 0; i < elements.length; ++i) {
                    elements[i].addEventListener('click', this._handleClick.bind(this, i));
                }

                this.count = elements.length;
                this._list.style.display = 'block';
            }
        }
    }, {
        key: 'hide',
        value: function hide() {
            this._list.style.display = 'none';
        }
    }]);

    return ResultView;
}(_EventTarget2.EventTarget);

exports.ResultView = ResultView;

/***/ }),
/* 8 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ })
/******/ ]);
//# sourceMappingURL=bundle.js.map