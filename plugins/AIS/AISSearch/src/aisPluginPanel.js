let NOSIDEBAR = false,
    PRODUCTION = false,
    SIDEBAR2 = false;
if (has('NOSIDEBAR'))
    NOSIDEBAR = true;
if (has('SIDEBAR2'))
    SIDEBAR2 = true;
if (has('PRODUCTION'))
    PRODUCTION = true;


module.exports = function (viewFactory) {
    let _leftMenuBlock,
        _canvas = _div(null),
        _activeView,
        _views = viewFactory.create(),
        _isReady = false,
        _createTabs = function () {
            let tabsTemplate = '<table class="ais_tabs" border=0><tr>' +

                '</td><td class="ais_tab myfleet_tab unselectable" unselectable="on">' + // ACTIVE
                '<div>{{i "AISSearch2.MyFleetTab"}}</div>' +
              
                '<td class="ais_tab dbsearch_tab unselectable" unselectable="on">' +
                '<div>{{i "AISSearch2.DbSearchTab"}}</div>' +
                '</td><td class="ais_tab scrsearch_tab unselectable" unselectable="on">' +
                '<div>{{i "AISSearch2.ScreenSearchTab"}}</div>' +
              
                '</td></tr></table>'

            if (NOSIDEBAR)
                $(_leftMenuBlock.workCanvas).append(_canvas);
            else
                $(this.sidebarPane).append(_canvas);

            $(_canvas).append(Handlebars.compile(tabsTemplate));
            $(_canvas).append(_views.map(v => v.frame));
    
            let tabs = $('.ais_tab', _canvas),
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

            if (NOSIDEBAR) {
                _returnInstance.hide = function () {
                    $(_leftMenuBlock.parentWorkCanvas).hide();
                    nsGmx.leafletMap.removeLayer(highlight);
                }

                $(_leftMenuBlock.parentWorkCanvas)
                    .attr('class', 'left_aispanel')
                    .insertAfter('.layers-before');
                var blockItem = _leftMenuBlock.leftPanelItem,
                    blockTitle = $('.leftmenu-path', blockItem.panelCanvas);
                var toggleTitle = function () {
                    if (blockItem.isCollapsed())
                        blockTitle.show();
                    else
                        blockTitle.hide();
                }
                $(blockItem).on('changeVisibility', toggleTitle);
                toggleTitle();
            }

            // All has been done at first time
            _isReady = true;
        },

    _returnInstance = {
        show: function () {
            let lmap = nsGmx.leafletMap;
            if (NOSIDEBAR && !_leftMenuBlock)
                _leftMenuBlock = new leftMenu();

            if ((NOSIDEBAR && (!_leftMenuBlock.createWorkCanvas("aispanel",
                function () { lmap.gmxControlIconManager.get(this.menuId)._iconClick() },
                { path: [_gtxt('AISSearch2.caption')] })
            )) || (!_isReady)) // SIDEBAR
            {
                _createTabs.call(this);
            }
            else{
                if (NOSIDEBAR){
                    $(_leftMenuBlock.parentWorkCanvas)
                    .insertAfter('.layers-before');
                }            
                _activeView && _activeView.show();
            }
        }
    };
    return _returnInstance;
}

