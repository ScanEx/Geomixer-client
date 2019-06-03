let PRODUCTION = false,
    SIDEBAR2 = false;
if (has('SIDEBAR2'))
    SIDEBAR2 = true;
if (has('PRODUCTION'))
    PRODUCTION = true;


module.exports = function (sidebarPane, viewFactory, withFooter) {
    let _isReady = false,
        _canvas = document.createElement('div'),
        _activeView,
        _views = viewFactory.create(),
        _createFooter = function () { 
            let footer;
            if (withFooter){           
                footer = document.createElement('div');
                footer.className = "ais_panel_footer";
                $(_canvas).append(footer);
            }
            return footer;
        },
        _createTabs = function () {
            let tabsTemplate = '<table class="ais_tabs" border=0><tr>' +
                '</td><td class="ais_tab myfleet_tab unselectable" unselectable="on">' + // ACTIVE
                '<div>{{i "AISSearch2.MyFleetTab"}}</div>' +
                '<td class="ais_tab dbsearch_tab unselectable" unselectable="on">' +
                '<div>{{i "AISSearch2.DbSearchTab"}}</div>' +
                '</td><td class="ais_tab scrsearch_tab unselectable" unselectable="on">' +
                '<div>{{i "AISSearch2.ScreenSearchTab"}}</div>' +
                '</td></tr></table>';

            $(sidebarPane).append(_canvas);
            $(_canvas).append(Handlebars.compile(tabsTemplate));
            $(_canvas).append(_views.map(v => v.frame));
    
            let tabs = $('.ais_tab', _canvas); 
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
            return tabs;
        },
        _tabs = _createTabs(),
        _footer = _createFooter(),
        _returnInstance = {
            get footer() {return _footer;},
            set footer(element) { 
                if (_footer)
                    _footer.append(element);
            },
            show: function () {
                if (!_isReady)
                {     
                    _views.forEach((v,i) =>{
                        v.tab = _tabs.eq(i);
                        v.resize(true);
                    }); 
                    // Show the first tab
                    _tabs.eq(0).removeClass('active').click();
                    // All has been done at first time
                    _isReady = true;
                }
                else{           
                    _activeView && _activeView.show(); 
                }
            }
        };
    return _returnInstance;
}

