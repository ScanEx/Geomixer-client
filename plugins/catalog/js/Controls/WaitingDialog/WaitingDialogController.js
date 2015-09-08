WaitingDialogController = function(view) {
    this._view = $(view);
    this._initialize();
}

WaitingDialogController.prototype = {
    _initialize: function() {
        this._view.dialog({
		    autoOpen: false,
		    dialogClass: "waiting-dialog",
		    closeOnEscape: false,
		    draggable: false,
		    width: 460,
		    minHeight: 50, 
		    modal: false,
		    buttons: {},
		    resizable: false,
		    open: function() {
			    // scrollbar fix for IE
			    if ($.browser.msie) $('body').css('overflow','hidden');
		    },
		    close: function() {
			    // reset overflow
			    if ($.browser.msie) $('body').css('overflow','auto');
		    }
	    });
    },
    
    open: function(title, message) {
    	this._view.dialog('option', 'title', title);
    	this.setMessage(message);
	    this._view.dialog('open');
    },
    
    setMessage: function(message) {
        this._view.html('<p>' + message + '</p>');
    },
    
    close: function() {
        this._view.dialog('close');
    }
}