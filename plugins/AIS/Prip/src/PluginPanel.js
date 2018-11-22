

module.exports = function (viewFactory) {
    let _leftMenuBlock,
        _canvas = _div(null),
        _activeView,
        _views = viewFactory.create(),
        _isReady = false,
        _createTabs = function () {
            let tabsTemplate = '<table class="prip_tabs" border=0><tr>' +
            '</td><td class="prip_tab scrsearch_tab unselectable" unselectable="on">' +
            '<div>{{i "Prip.murm_tab"}}</div>' +
            '</td><td class="prip_tab scrsearch_tab unselectable" unselectable="on">' +
            '<div>{{i "Prip.arkh_tab"}}</div>' +
                '<td class="prip_tab dbsearch_tab unselectable" unselectable="on">' +
                '<div>{{i "Prip.west_tab"}}</div>' +
                '</td><td class="prip_tab scrsearch_tab unselectable" unselectable="on">' +
                '<div>{{i "Prip.east_tab"}}</div>' +
                '</td></tr></table>'

            $(this.sidebarPane).append(_canvas);
            $(_canvas).append(Handlebars.compile(tabsTemplate));
            $(_canvas).append(_views.map(v => v.frame));
    
            let tabs = $('.prip_tab', _canvas),
                _this = this;           
            _views.forEach((v,i) =>{
                v.tab = tabs.eq(i);
                v.resize(true);
            }); 
            tabs.on('click', function () {
                if (!$(this).is('.active')) {
                    let target = this;
                    tabs.each(function (i, tab) {
                        if (!$(tab).is('.active') && target == tab) {
                            $(tab).addClass('active');
                            _views[i].show();
                            _activeView = _views[i];
                        }
                        else {
                            $(tab).removeClass('active');
                            _views[i].hide();
                        }
                    });
                }
            });

            // Show the first tab
            tabs.eq(0).removeClass('active').click();
            // All has been done at first time
            _isReady = true;
        },

    _returnInstance = {
        show: function () {
            let lmap = nsGmx.leafletMap;
            if (!_isReady) 
            {
                _createTabs.call(this);
            }
            else{          
                _activeView && _activeView.show();
            }
        }
    };
    return _returnInstance;
}

