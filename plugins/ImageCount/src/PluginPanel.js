module.exports = function (viewFactory) {
    let _isReady = false,
        _activeView,
        _canvas = $('<div>')[0],
        _views = viewFactory.create(),
        _create = function () {
            $(this.sidebarPane).append(_canvas);
            $(_canvas).append(_views.map(v => {
                return v.frame
            }));
            _views[0].resize(true);
            _views[0].show();
            _activeView = _views[0];
            _isReady = true;
        };
    const _returnInstance = {
        show: function () {          
            if (!_isReady)
            {
                _create.call(this);
            }
            else{       
                _activeView && _activeView.show();
            }
        }
    }
    return _returnInstance;
}

