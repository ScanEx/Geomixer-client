(function() {
var gmxDeferred = function() {
    var resolveCallbacks = [],
        rejectCallbacks = [],
        isFulfilled = false,
        isResolved = false,
        fulfilledData,
        onceAdded = false;
        
    var _fulfill = function(resolved) {
        if (isFulfilled) {
            return;
        }
        var callbacks = resolved ? resolveCallbacks : rejectCallbacks;
        fulfilledData = [].slice.call(arguments, 1);
        isFulfilled = true;
        isResolved = resolved;
        
        callbacks.forEach(function(callback) { callback.apply(null, fulfilledData); });
        resolveCallbacks = rejectCallbacks = [];
    }
    
    this.resolve = function(data) {
        _fulfill.apply(null, [true].concat([].slice.call(arguments)));
    }
    
    this.reject = function(data) {
        _fulfill.apply(null, [false].concat([].slice.call(arguments)));
    }
    
    this.done = function(resolveCallback, rejectCallback) {
        if (isFulfilled) {
            if (isResolved) {
                resolveCallback && resolveCallback.apply(null, fulfilledData);
            } else {
                rejectCallback && rejectCallback.apply(null, fulfilledData);
            }
        } else {
            resolveCallback && resolveCallbacks.push(resolveCallback);
            rejectCallback && rejectCallbacks.push(rejectCallback);
        }
    }
    
    this.once = function(onceResolveCallback) {
        if (!onceAdded) {
            onceAdded = true;
            this.done(onceResolveCallback);
        }
    }
    
    this.getFulfilledData = function() {
        return fulfilledData;
    }
}

gmxDeferred.all = function() {
    var defArray = [].slice.apply(arguments);
    var resdef = new gmxDeferred();
    var left = defArray.length;
    var results = new Array(defArray.length);
    
    defArray.forEach(function(def, i) {
        def.done(function(res) {
            results[i] = res;
            left--;
            if (left == 0) {
                resdef.resolve.apply(resdef, results);
            }
        })
    })
    
    return resdef;
}

	if(!gmxAPI) gmxAPI = {};
	gmxAPI.gmxDeferred = gmxDeferred;
})();