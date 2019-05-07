let PRODUCTION = false,
    SIDEBAR2 = false;
if (has('SIDEBAR2'))
    SIDEBAR2 = true;
if (has('PRODUCTION'))
    PRODUCTION = true;


module.exports = function (viewFactory, withFooter) {
    let _canvas = _div(null),
        _activeView,
        _views = viewFactory.create(),
        _isReady = false,
        _footer,
        _createFooter = function () {  
            if (withFooter){
                $(_canvas).append(_footer);
            }
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

            $(this.sidebarPane).append(_canvas);
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

    _returnInstance = {
        get footer() {return _footer;},
        set footer(html) {            
            _footer = document.createElement('div');
            _footer.className = "ais_panel_footer";
            _footer.innerHTML = html;
        },
        show: function () {
            if (!_isReady)
            {
                let tabs = _createTabs.call(this);
                _createFooter.call(this);         
                _views.forEach((v,i) =>{
                    v.tab = tabs.eq(i);
                    v.resize(true);
                }); 
                // Show the first tab
                tabs.eq(0).removeClass('active').click();
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

