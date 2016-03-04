(function() {
    window.nsGmx = window.nsGmx || {};
    window.nsGmx.widgets = window.nsGmx.widgets || {};
    nsGmx.widgets.notifications = {
        _container: null,
        _actions: [],
        _messagesToShow: [],
        _messageTimer: null,
        _currentStatusClass: '',
        
        startAction: function(actionId) {
            this._initContainerLazy();
            if (this._actions.indexOf(actionId) === -1) {
                this._actions.push(actionId);
                this._container.find('.notification-process').show();
            }
        },
        
        //supported statuses: success, failure, warning
        stopAction: function(actionId, status, message, timeout) {
            var index = this._actions.indexOf(actionId);
            
            if (index !== -1) {
                this._actions.splice(index, 1);
                this._container.find('.notification-process').toggle(this._actions.length);
            }
                
            if (message) {
                timeout = typeof timeout !== 'undefined' ? timeout : 1500;
                this._messagesToShow.push({text: message, status: status, timeout: timeout});
                this._checkMessages();
            }
        },
        
        _checkMessages: function() {
            if (this._messageTimer || !this._messagesToShow.length) {
                return;
            }
            
            var msg = this._messagesToShow.shift();
            var statusClass = 'notification-' + msg.status;
            this._initContainerLazy();
            this._container.find('.notification-message')
                .show().text(msg.text)
                .removeClass(this._currentStatusClass)
                .addClass(statusClass);
                
            if (msg.timeout) {
                this._messageTimer = setTimeout(function(){
                    this._messageTimer = null;
                    this._container.find('.notification-message').hide();
                    this._checkMessages();
                }.bind(this), msg.timeout);
            }
        },
        
        _initContainerLazy: function() {
            if (this._container) {
                return;
            }
            
            this._container = $(Handlebars.compile(
                '<div class="notification-container">' +
                    '<span class="notification-process"></span>' +
                    '<span class="notification-message"></span>' +
                '</div>')()).appendTo($('#flash'));
                
            this._container.find('.notification-message, .notification-process').hide();
        }
    }
})();