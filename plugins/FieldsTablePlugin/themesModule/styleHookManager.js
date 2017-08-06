var StyleHookManager = function () {
    this.attachedLayers = {};
};

StyleHookManager.prototype._renderStyles = function (layerName, data) {
    var callbacks = this.attachedLayers[layerName].styleCallbacks;

    //объединение стилей
    var res = {};//data.style;
    for (var i = 0; i < callbacks.length; i++) {
        data.layerId = layerName;
        var s = callbacks[i].callback(data);
        res = shared.mergeRecursive(res, s);
    }

    return res;
};

StyleHookManager.prototype.addStyleHook = function (layer, id, callback, priority) {
    var layerID = layer.getGmxProperties().LayerID;

    if (!this.attachedLayers[layerID]) {
        this.attachedLayers[layerID] = {
            "layer": layer, "styleCallbacks": [
                { "id": id, "callback": callback, "priority": priority }]
        };
        var that = this;
        layer.setStyleHook(function (data) {
            return that._renderStyles(layerID, data);
        });
    } else {
        this.attachedLayers[layerID].styleCallbacks.push({ "id": id, "callback": callback, "priority": priority });
        this.attachedLayers[layerID].styleCallbacks.sort(function (a, b) {
            return a.priority - b.priority;
        });
    }
};

StyleHookManager.prototype.removeStyleHook = function (layer, id) {
    var layerID = layer.getGmxProperties().LayerID;
    var callbacks = this.attachedLayers[layerID].styleCallbacks;
    for (var i = 0; i < callbacks.length; i++) {
        if (callbacks[i].id == id) {
            callbacks.splice(i, 1);
            return;
        }
    }
};

//вообще должен быть сингелтон
var styleHookManager;
if (!styleHookManager)
    styleHookManager = new StyleHookManager();
