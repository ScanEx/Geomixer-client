var nsCatalog = nsCatalog || {};

(function($){
  var DelegatesChain = function(delay) {
      this._delegates = [];
      this._delay = delay || 0;
      this._executing = false;
      this._currentIndex = 0;
  };

  DelegatesChain.prototype = {
      add: function(delegate) {
          this._delegates.push(delegate);
      },

      execute: function() {
          if (this._executing)
              return;
          this._executing = true;
          this._executeNext();
      },

      _executeNext: function() {
          var delegate = this._delegates[this._currentIndex];
          if (delegate)
              setTimeout(function() {
                      delegate();
                      this._executeNext();
                  }.bind(this), this._delay);
          else {
            $(this).trigger('finished');
          };
          ++this._currentIndex;
      }      
  };

  nsCatalog.DelegatesChain = DelegatesChain;

}(jQuery));
