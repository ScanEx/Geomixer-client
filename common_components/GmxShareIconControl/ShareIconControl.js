var nsGmx = nsGmx || {};

nsGmx.ShareIconControl = L.Control.gmxIcon.extend({
    options: {
        className: 'shareIcon',
        id: 'permalink-button',
        text: 'Share',
        style: {
            width: 'auto'
        }
    },
    initialize: function(options) {
        L.setOptions(this, L.extend(L.Control.gmxIcon.prototype.options, options));
        L.Control.gmxIcon.prototype.initialize.call(this, this.options);
    },
    onAdd: function(map) {
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