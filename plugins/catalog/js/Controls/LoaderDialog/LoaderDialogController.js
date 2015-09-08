LoaderDialogController = function() {
    this._loader = null;
    
    this._initialize();
}

LoaderDialogController.prototype = {
    _initialize: function() {
        this._loader = $("<table style='position:absolute;width:100%;height:100%;top:0;left:0;z-index:1000'><tr><td style='vertical-align:center; text-align:center;'><img src='img/loader.gif'/></td></tr></table>").appendTo('#flash');
    },
    
    open: function() {
    	this._loader.show();
    },
    
    setMessage: function() { },
    
    close: function() {
        this._loader.hide();
    }
}