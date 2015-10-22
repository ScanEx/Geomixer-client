UrlDataProvider = function() {
    this._onLoadFailed = null;
    this._onTooMuchData = null;
}

UrlDataProvider.prototype = {
    loadData: function(url, callback) {
        $.getJSON(url, 
            function(data) {
                if (callback) callback(data);
            }.bind(this)
        );
    },

    loadDataJSONP: function(url, callback) {
        this.loadData(url + "&callback=?", callback);
    },
    
    set_onLoadFailed: function(handler) {
        this._onLoadFailed = handler;
    },
    
    _loadFailed: function(request, status, error) {
        if (this._onLoadFailed)
            this._onLoadFailed();
    }
}