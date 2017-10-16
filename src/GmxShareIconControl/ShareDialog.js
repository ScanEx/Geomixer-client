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
})