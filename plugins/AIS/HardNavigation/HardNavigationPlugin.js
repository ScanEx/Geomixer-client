/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var PRODUCTION = false;
	if (true) PRODUCTION = true;
	
	__webpack_require__(1);
	__webpack_require__(3);
	__webpack_require__(4);
	
	// Handlebars.registerHelper('aisinfoid', function (context) {
	//     return context.mmsi + " " + context.imo;
	// });
	
	// Handlebars.registerHelper('aisjson', function (context) {
	//     return JSON.stringify(context);
	// });
	
	var pluginName = PRODUCTION ? 'HardNavigationPlugin' : 'HardNavigationPluginTest',
	    menuId = 'HardNavigationPlugin',
	    toolbarIconId = null,
	    cssTable = PRODUCTION ? 'HardNavigationPlugin' : 'HardNavigationPlugin',
	    modulePath = gmxCore.getModulePath(pluginName);
	
	var PluginPanel = __webpack_require__(5),
	    ViewsFactory = __webpack_require__(6);
	
	var publicInterface = {
	    pluginName: pluginName,
	    afterViewer: function afterViewer(params, map) {
	        var options = {
	            aisLastPoint: '303F8834DEE2449DAF1DA9CD64B748FE',
	            modulePath: modulePath
	        },
	            viewFactory = new ViewsFactory(options),
	            pluginPanel = new PluginPanel(viewFactory);
	        pluginPanel.menuId = menuId;
	
	        var sidebar = window.iconSidebarWidget,
	            tab = window.createTabFunction({
	            icon: "HardNavigation", //menuId,
	            active: "hardnav-sidebar-icon",
	            inactive: "hardnav-sidebar-icon",
	            hint: _gtxt('HardNavigation.title')
	        })();
	        tab.querySelector('.HardNavigation').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path d="M13.13,0H0.88A0.83,0.83,0,0,0,0,.88V13.13A0.83,0.83,0,0,0,.88,14H13.13A0.83,0.83,0,0,0,14,13.13V0.88A0.83,0.83,0,0,0,13.13,0ZM12.25,12.25H1.75V1.75h10.5v10.5Z"/><rect x="3.5" y="4.38" width="7" height="1.75"/><rect x="3.5" y="7.88" width="7" height="1.75"/></svg>';
	        pluginPanel.sidebarPane = sidebar.setPane(menuId, {
	            createTab: function createTab() {
	                return tab;
	            }
	        });
	        sidebar.addEventListener('opened', function (e) {
	            if (sidebar._activeTabId == menuId) pluginPanel.show();
	        });
	    }
	};
	
	gmxCore.addModule(pluginName, publicInterface, {
	    css: cssTable + '.css'
	});

/***/ }),
/* 1 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 2 */,
/* 3 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	"use strict";
	
	_translationsHash.addtext('rus', {
	    "HardNavigation.title": "Тяжелые районы судоходства",
	    "HardNavigation.page_lbl": "Страница",
	    "HardNavigation.choose_reg": "Выбор района",
	    "HardNavigation.create_reg": "Новый район",
	    "HardNavigation.instr_hint": "Очертите новый район или выберите существующий для редактирования",
	    "HardNavigation.attr_tbl": "Таблица атрибутов",
	    "HardNavigation.reg_id": "ID района",
	    "HardNavigation.reg_created": "Создан",
	    "HardNavigation.reg_updated": "Обновлен"
	});
	_translationsHash.addtext('eng', {
	    "HardNavigation.title": "Hard navigation",
	    "HardNavigation.page_lbl": "Page",
	    "HardNavigation.choose_reg": "Choose region",
	    "HardNavigation.create_reg": "Create region",
	    "HardNavigation.instr_hint": "Draw a region or choose existing",
	    "HardNavigation.attr_tbl": "Table of attrobutes",
	    "HardNavigation.reg_id": "Region ID",
	    "HardNavigation.reg_created": "Created",
	    "HardNavigation.reg_updated": "Updated"
	});

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var PRODUCTION = false;
	if (true) PRODUCTION = true;
	
	module.exports = function (viewFactory) {
	    var _isReady = false,
	        _activeView = void 0,
	        _canvas = _div(null),
	        _views = viewFactory.create(),
	        _create = function _create() {
	        $(this.sidebarPane).append(_canvas);
	        $(_canvas).append(_views.map(function (v) {
	            return v.frame;
	        }));
	        _views[0].resize(true);
	        _views[0].show();
	        _activeView = _views[0];
	        _isReady = true;
	    };
	    var _returnInstance = {
	        show: function show() {
	            if (!_isReady) {
	                _create.call(this);
	            } else {
	                _activeView && _activeView.show();
	            }
	        }
	    };
	    return _returnInstance;
	    /*
	    let _leftMenuBlock,
	        _canvas = _div(null),
	        _activeView,
	        _views = viewFactory.create(),
	        // _aisSearchView,
	        // _myFleetMembersView,
	        // _historyView,
	        //_gifLoader = '<img src="img/progress.gif">',
	        _isReady = false,
	        _createTabs = function () {
	            let tabsTemplate = '<table class="ais_tabs" border=0><tr>' +
	                '<td class="ais_tab dbsearch_tab unselectable" unselectable="on">' +
	                '<div>{{i "AISSearch2.DbSearchTab"}}</div>' +
	                '</td><td class="ais_tab scrsearch_tab unselectable" unselectable="on">' +
	                '<div>{{i "AISSearch2.ScreenSearchTab"}}</div>' +
	                '</td><td class="ais_tab myfleet_tab unselectable" unselectable="on">' + // ACTIVE
	                '<div>{{i "AISSearch2.MyFleetTab"}}</div>' +
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
	    */
	};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var MyCollectionView = __webpack_require__(7),
	    MyCollectionModel = __webpack_require__(10);
	module.exports = function (options) {
	    var _mcm = new MyCollectionModel(),
	        _mcv = new MyCollectionView({ model: _mcm });
	    return {
	        create: function create() {
	            return [_mcv];
	        }
	    };
	};

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(8);
	var BaseView = __webpack_require__(9);
	
	//let _searchString = "";
	
	var MyCollectionView = function MyCollectionView(_ref) {
	    var model = _ref.model,
	        registerDlg = _ref.registerDlg;
	
	    BaseView.call(this, model);
	    this.frame = $(Handlebars.compile('<div class="hardnav-view">\n            <div class="header">\n                <table border=1 class="instruments">\n                <tr><td class="but choose">' + _gtxt('HardNavigation.choose_reg') + '</td><td class="but create">' + _gtxt('HardNavigation.create_reg') + '</td></tr>\n                </table> \n                <table border=1>\n                <tr><td class="hint" colspan="2">' + _gtxt('HardNavigation.instr_hint') + '</td>\n                <td><div class="refresh"><div>' + this.gifLoader + '</div></div></td></tr>\n                </table> \n                <table border=1 class="grid-header">\n                <tr><td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></svg></td>\n                <td>' + _gtxt('HardNavigation.reg_id') + '</td>\n                <td>' + _gtxt('HardNavigation.reg_created') + '</td>\n                <td>' + _gtxt('HardNavigation.reg_updated') + '</td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td></tr>\n                </table> \n            </div> \n            <div class="grid">\n\n            </div>\n            <div class="footer">\n                <table border=1 class="pager">\n                    <tr><td class="but arrow arrow-prev"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-left"></use></svg></td>\n                    <td class="current">' + _gtxt('HardNavigation.page_lbl') + ' 1/1</td>\n                    <td class="but arrow arrow-next"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-right"></use></svg></td></tr>\n                </table>  \n                <div class="but but-attributes">' + _gtxt('HardNavigation.attr_tbl') + '</div>          \n            </div>\n            </div>')());
	
	    this.container = this.frame.find('.grid');
	    this.footer = this.frame.find('.footer');
	
	    this.tableTemplate = '{{#each vessels}}' + '<div class="hardnav-item">' + '<table border=0><tr>' + '<td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' + '<td><div class="exclude button" title="{{i "Lloyds.vesselExclude"}}"></div></td>' + '</tr></table>' + '</div>' + '{{/each}}' + '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
	
	    Object.defineProperty(this, "topOffset", {
	        get: function get() {
	            return this.frame.find('.header')[0].getBoundingClientRect().height;
	        }
	    });
	    Object.defineProperty(this, "bottomOffset", {
	        get: function get() {
	            return this.frame.find('.footer')[0].getBoundingClientRect().height;
	        }
	    });
	},
	    _clean = function _clean() {};
	
	MyCollectionView.prototype = Object.create(BaseView.prototype);
	
	MyCollectionView.prototype.inProgress = function (state) {
	    var progress = this.frame.find('.refresh div');
	    if (state) progress.show();else progress.hide();
	};
	
	// MyCollectionView.prototype.resize = function () { 
	//     let h = $('.iconSidebarControl-pane').height() - this.frame.find('.instruments').outerHeight()
	//     - this.frame.find('.results').outerHeight() - this.frame.find('.menu').outerHeight();
	//     this.container.height(h+1);
	// };
	
	MyCollectionView.prototype.repaint = function () {
	    _clean.call(this);
	    BaseView.prototype.repaint.call(this);
	};
	
	MyCollectionView.prototype.show = function () {
	    this.frame.show();
	    //this.searchInput.focus();
	    BaseView.prototype.show.apply(this, arguments);
	};
	
	module.exports = MyCollectionView;

/***/ }),
/* 8 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 9 */
/***/ (function(module, exports) {

	'use strict';
	
	var _clean = function _clean() {
	    var scrollCont = this.container.find('.mCSB_container');
	    if (scrollCont[0]) {
	        scrollCont.empty();
	    } else {
	        this.container.empty();
	    }
	};
	
	var BaseView = function BaseView(model) {
	    model.view = this;
	    this.model = model;
	    this.gifLoader = '<img src="img/progress.gif">';
	};
	
	BaseView.prototype = function () {
	    return {
	        get isActive() {
	            return this.frame.is(":visible");
	        },
	        resize: function resize(clean) {
	            console.log($('.iconSidebarControl-pane').height(), this.topOffset, this.bottomOffset);
	            var h = $('.iconSidebarControl-pane').height() - this.topOffset - this.bottomOffset;
	            // if (this.startScreen){
	            //     this.startScreen.height(h);
	            //     this.container.css({ position:"relative", top: -h+"px" });
	            // }
	            this.container.height(h);
	
	            if (clean) {
	                this.container.empty();
	            }
	        },
	        repaint: function repaint() {
	            _clean.call(this);
	
	            this.inProgress(false);
	
	            if (!this.model.data) return;
	
	            var scrollCont = this.container.find('.mCSB_container'),
	                content = $(Handlebars.compile(this.tableTemplate)(this.model.data));
	            if (!scrollCont[0]) {
	                this.container.append(content).mCustomScrollbar(this.mcsbOptions);
	            } else {
	                $(scrollCont).append(content);
	            }
	        },
	        show: function show() {
	            this.frame.show();
	            this.model.update();
	        },
	        hide: function hide() {
	            this.frame.hide();
	        }
	    };
	}();
	
	module.exports = BaseView;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var Polyfill = __webpack_require__(11);
	module.exports = function (searcher) {
	    var _actualUpdate = void 0,
	        _data = void 0;
	    if (!_data) _data = { vessels: [] };
	
	    return {
	        searcher: searcher,
	        isDirty: true,
	        get data() {
	            return _data;
	        },
	        set data(value) {
	            _data = value;
	        },
	
	        update: function update() {
	            var th = this;
	            setTimeout(function () {
	                return th.view.repaint();
	            }, 500);
	        }
	    };
	};

/***/ }),
/* 11 */
/***/ (function(module, exports) {

	"use strict";
	
	module.exports = {
		find: function find(a, predicate) {
			var list = Object(a);
			var length = list.length >>> 0;
			var thisArg = arguments[2];
			var value;
	
			for (var i = 0; i < length; i++) {
				value = list[i];
				if (predicate.call(thisArg, value, i, list)) {
					return value;
				}
			}
			return undefined;
		},
		findIndex: function findIndex(a, predicate) {
			var list = Object(a);
			var length = list.length >>> 0;
			var thisArg = arguments[2];
			var value;
	
			for (var i = 0; i < length; i++) {
				value = list[i];
				if (predicate.call(thisArg, value, i, list)) {
					return i;
				}
			}
			return -1;
		}
	};

/***/ })
/******/ ]);
//# sourceMappingURL=HardNavigationPlugin.js.map