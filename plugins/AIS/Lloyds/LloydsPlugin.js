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

	'use strict';
	
	var PRODUCTION = false,
	    NOSIDEBAR = false,
	    SIDEBAR2 = false;
	if (true) PRODUCTION = true;
	if (false) NOSIDEBAR = true;
	if (true) SIDEBAR2 = true;
	
	__webpack_require__(1);
	__webpack_require__(3);
	__webpack_require__(4);
	
	// Handlebars.registerHelper('aisinfoid', function (context) {
	//     return context.mmsi + " " + context.imo;
	// });
	
	// Handlebars.registerHelper('aisjson', function (context) {
	//     return JSON.stringify(context);
	// });
	
	var pluginName = PRODUCTION ? 'LloydsPlugin' : 'LloydsPluginTest',
	    menuId = 'LloydsPlugin',
	    toolbarIconId = null,
	    cssTable = PRODUCTION ? 'LloydsPlugin' : 'LloydsPlugin',
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
	            icon: "Lloyds", //menuId,
	            active: "lloyds_sidebar-icon",
	            inactive: "lloyds_sidebar-icon",
	            hint: _gtxt('Lloyds.title')
	        })();
	        tab.querySelector('.Lloyds').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14"><path d="M13.13,0H0.88A0.83,0.83,0,0,0,0,.88V13.13A0.83,0.83,0,0,0,.88,14H13.13A0.83,0.83,0,0,0,14,13.13V0.88A0.83,0.83,0,0,0,13.13,0ZM12.25,12.25H1.75V1.75h10.5v10.5Z"/><rect x="3.5" y="4.38" width="7" height="1.75"/><rect x="3.5" y="7.88" width="7" height="1.75"/></svg>';
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
	    "Lloyds.title": "Регистр Ллойда",
	    "Lloyds.search_placeholder": "Поиск",
	    "Lloyds.found": "Найдено: ",
	    "Lloyds.vesselExclude": "удалить",
	    "Lloyds.showRegister": "Открыть регистр",
	    "Lloyds.cleanList": "Очистить список",
	
	    "Lloyds.fieldsSelector": "Показывать колонки",
	    "Lloyds.dlgTitle": "Регистр судов",
	    "Lloyds.closeButton": "закрыть",
	    "Lloyds.expandButton": "развернуть",
	    "Lloyds.shrinkButton": "свернуть"
	});
	_translationsHash.addtext('eng', {
	    "Lloyds.title": "Lloyd's register",
	    "Lloyds.search_placeholder": "Search",
	    "Lloyds.found": "Found ",
	    "Lloyds.vesselExclude": "remove",
	    "Lloyds.showRegister": "Open register",
	    "Lloyds.cleanList": "Clean",
	    "Lloyds.fieldsSelector": "Select columns",
	    "Lloyds.dlgTitle": "Register",
	    "Lloyds.closeButton": "close",
	    "Lloyds.expandButton": "maximize",
	    "Lloyds.shrinkButton": "minimize"
	});

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var NOSIDEBAR = false,
	    PRODUCTION = false,
	    SIDEBAR2 = false;
	if (false) NOSIDEBAR = true;
	if (true) SIDEBAR2 = true;
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
	
	/*
	const ScreenSearchView = require('./Views/ScreenSearchView'),
	    ScreenSearchModel = require('./Models/ScreenSearchModel'),
	    MyFleetView = require('./Views/MyFleetView'),
	    MyFleetModel = require('./Models/MyFleetModel'),
	    DbSearchView = require('./Views/DbSearchView'),
	    DbSearchModel = require('./Models/DbSearchModel'),
	    InfoDialogView = require('./Views/InfoDialogView'),
	    Toolbox = require('./Toolbox.js');
	*/
	var MyCollectionView = __webpack_require__(7),
	    MyCollectionModel = __webpack_require__(12),
	    RegisterDlgView = __webpack_require__(14),
	    RegisterModel = __webpack_require__(16),
	    Searcher = __webpack_require__(17);
	module.exports = function (options) {
	    var _searcher = new Searcher(options),
	        _rm = new RegisterModel(_searcher),
	        _rdv = new RegisterDlgView({ model: _rm /*, highlight:options.highlight, tools:_tools*/ }),
	        _mcm = new MyCollectionModel(_searcher),
	        _mcv = new MyCollectionView({ model: _mcm /*, highlight:options.highlight, tools:_tools*/, registerDlg: _rdv });
	    return {
	        create: function create() {
	            return [_mcv];
	        }
	        /*
	        const _tools = new Toolbox(options),
	            //_layersByID = nsGmx.gmxMap.layersByID,
	            _searcher = new Searcher(options),
	            _mfm = new MyFleetModel(_searcher),
	            _ssm = new ScreenSearchModel({ aisLayerSearcher: _searcher, myFleetModel: _mfm }),
	            _dbsm = new DbSearchModel(_searcher),
	            _dbsv = new DbSearchView({model:_dbsm, highlight:options.highlight, tools:_tools}),
	            _ssv = new ScreenSearchView(_ssm),
	            _mfv = new MyFleetView(_mfm, _tools),
	            _idv = new InfoDialogView({
	                tools:_tools,
	                aisLayerSearcher: _searcher, 
	                modulePath: options.modulePath,
	                aisView: _dbsv, 
	                myFleetMembersView: _mfv
	            });
	            _ssv.infoDialogView = _idv;
	            _mfv.infoDialogView = _idv;
	            _dbsv.infoDialogView = _idv;
	        return {
	            get infoDialogView(){
	                return _idv;
	            },
	            create: function () {
	                return [ _dbsv, _ssv, _mfv ];
	            }
	        };
	        */
	    };
	};

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(8);
	var BaseView = __webpack_require__(9);
	var SearchControl = __webpack_require__(10);
	
	//let _searchString = "";
	
	var MyCollectionView = function MyCollectionView(_ref) {
	    var _this = this;
	
	    var model = _ref.model,
	        registerDlg = _ref.registerDlg;
	
	    BaseView.call(this, model);
	    this.frame = $(Handlebars.compile('<div class="lloyds_view search_view">' + '<table border=0 class="instruments">' + '<tr><td class="search_input_container"></td></tr>' + '</table>' + '<table class="results">' + '<td class="count"></td>' + '<td><div class="refresh clicable"><div>' + this.gifLoader + '</div></div></td></tr>' + '</table>' +
	    // '<table class="start_screen"><tr><td>' +
	    // '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">' +
	    // '<div>Здесь будут отображаться<br>результаты поиска по названию,<br>' +
	    // 'IMO илм MMSI судна' +
	    // '</div></td></tr></table>' +
	    '<div class="ais_vessels">' + '<div class="ais_vessel">' + '<table><tr><div class="position">vessel name</div><div>mmsi:  imo: </div></tr></table>' + '</div>' + '</div>' + '<table class="menu">' + '<td class="open clicable"><div>{{i "Lloyds.showRegister"}}</div></td>' + '<td class="clean clicable"><div>{{i "Lloyds.cleanList"}}</div></td></tr>' + '</table></div>')());
	
	    this.container = this.frame.find('.ais_vessels');
	    //this.startScreen = this.frame.find('.start_screen');
	    this.searchInput = new SearchControl({ tab: this.frame[0], container: this.frame.find('.search_input_container')[0],
	        callback: function (v) {
	            if (!_this.vessel || _this.vessel.mmsi != v.mmsi || !_this.frame.find('.ais_positions_date')[0]) {
	                //LOAD INTO LOCAL REGISTRY
	                if (_this.model.data.vessels.every(function (x) {
	                    return x.rs != v.rs;
	                })) {
	                    _this.model.data.vessels.push(v);
	                    _this.model.save();
	                    _this.show();
	                }
	            }
	        }.bind(this)
	    });
	    this.tableTemplate = '{{#each vessels}}' + '<div class="ais_vessel">' + '<table border=0><tr>' + '<td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' + '<td><div class="exclude button" title="{{i "Lloyds.vesselExclude"}}"></div></td>' + '</tr></table>' + '</div>' + '{{/each}}' + '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
	
	    this.frame.find('.menu .open').on('click', function () {
	        registerDlg.collection = _this.model.data.vessels.map(function (v) {
	            return v.rs;
	        });
	        registerDlg.show();
	    });
	    this.frame.find('.menu .clean').on('click', function () {
	        _this.model.data.vessels.length = 0;
	        _this.model.save();
	        _this.show();
	    }.bind(this));
	},
	    _clean = function _clean() {
	    //this.startScreen.css({ visibility: "hidden" });
	    var count = this.model.data && this.model.data.vessels ? this.model.data.vessels.length : 0;
	    this.frame.find('.count').text(_gtxt('Lloyds.found') + count);
	};
	
	MyCollectionView.prototype = Object.create(BaseView.prototype);
	
	MyCollectionView.prototype.inProgress = function (state) {
	    var progress = this.frame.find('.refresh div');
	    if (state) progress.show();else progress.hide();
	};
	
	MyCollectionView.prototype.resize = function () {
	    var h = $('.iconSidebarControl-pane').height() - this.frame.find('.instruments').outerHeight() - this.frame.find('.results').outerHeight() - this.frame.find('.menu').outerHeight();
	    this.container.height(h + 1);
	};
	
	MyCollectionView.prototype.repaint = function () {
	    var _this2 = this;
	
	    _clean.call(this);
	    BaseView.prototype.repaint.call(this);
	    this.frame.find('.exclude').each(function (i, elm) {
	        var inst = _this2;
	        $(elm).on('click', function () {
	            $(elm).off('click');
	            //UPDATE LOCAL REGISTRY
	            inst.model.data.vessels.splice(i, 1);
	            inst.model.save();
	            inst.show();
	        });
	    }.bind(this));
	};
	
	MyCollectionView.prototype.show = function () {
	    this.frame.show();
	    this.searchInput.focus();
	    BaseView.prototype.show.apply(this, arguments);
	};
	
	module.exports = MyCollectionView;

/***/ }),
/* 8 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var NOSIDEBAR = false,
	    PRODUCTION = false,
	    SIDEBAR2 = false;
	if (false) NOSIDEBAR = true;
	if (true) SIDEBAR2 = true;
	if (true) PRODUCTION = true;
	
	var _calcHeight = function _calcHeight() {
	    var template = this.frame.find('.ais_vessel')[0] || this.frame.find('.ais_positions_date')[0],
	        h = template.getBoundingClientRect().height;
	    if (NOSIDEBAR) return h * 5;else {
	        var H = $('.iconSidebarControl-pane').height() - this.topOffset;
	        // console.log(template.getBoundingClientRect())
	        // console.log(this.topOffset)
	        // console.log(H)
	        return H - H % h;
	    }
	};
	
	var BaseView = function BaseView(model) {
	    model.view = this;
	    this.model = model;
	    this.gifLoader = '<img src="img/progress.gif">';
	};
	
	var _clean = function _clean() {
	    this.container.find('.info').off('click');
	    this.container.find('.position').off('click');
	    var scrollCont = this.container.find('.mCSB_container');
	    if (scrollCont[0]) {
	        scrollCont.empty();
	    } else {
	        this.container.empty();
	    }
	};
	
	BaseView.prototype = function () {
	    return {
	        get isActive() {
	            return this.frame.is(":visible");
	        },
	        resize: function resize(clean) {
	            var h = _calcHeight.call(this);
	            if (this.startScreen) {
	                this.startScreen.height(h);
	                this.container.css({ position: "relative", top: -h + "px" });
	            }
	            this.container.height(h);
	
	            if (clean) {
	                this.container.empty();
	            }
	        },
	        repaint: function repaint() {
	            _clean.call(this);
	            //console.log(this.model.data)
	            if (!this.model.data) return;
	            var scrollCont = this.container.find('.mCSB_container'),
	                content = $(Handlebars.compile(this.tableTemplate)(this.model.data));
	            //console.log(scrollCont[0])
	            if (!scrollCont[0]) {
	                this.container.append(content).mCustomScrollbar(this.mcsbOptions);
	            } else {
	                $(scrollCont).append(content);
	            }
	
	            var _this = this;
	            this.container.find('.info').on('click', function (e) {
	                var _this2 = this;
	
	                var target = $(this),
	                    vessel = JSON.parse(target.attr('vessel'));
	                //console.log(vessel)
	                _this.infoDialogView && _this.infoDialogView.show(vessel, function (v) {
	                    //console.log(v)
	                    vessel.xmin = vessel.xmax = v.longitude;
	                    vessel.ymin = vessel.ymax = v.latitude;
	                    if (vessel.hasOwnProperty('ts_pos_utc')) {
	                        vessel.ts_pos_utc = v.ts_pos_utc;
	                        vessel.ts_pos_org = v.ts_pos_org;
	                        v.dt_pos_utc && $(_this2).closest('tr').find('.date').html(v.dt_pos_utc);
	                    }
	                    target.attr('vessel', JSON.stringify(vessel));
	                });
	                e.stopPropagation();
	            });
	            //             this.container.find('.ais_vessel').on('click', function () {
	            // //console.log(JSON.parse($(this).find('.info').attr('vessel')))
	            //                 let v = JSON.parse($(this).find('.info').attr('vessel'));                
	            //                 v.lastPosition = true;
	            //                 _this.infoDialogView.showPosition(v);
	            //             });      
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

	"use strict";
	
	__webpack_require__(11);
	
	var _searchString = "",
	    _sparams = localStorage.getItem('lloyds_searchparams');
	var SearchControl = function SearchControl(_ref) {
	    var tab = _ref.tab,
	        container = _ref.container,
	        callback = _ref.callback;
	
	
	    container.innerHTML = '<div class="filter"><input type="text" placeholder="' + _gtxt("Lloyds.search_placeholder") + '"/>' + '<div class="preferences"></div>' + '<div class="searchremove"><img class="search" src="plugins/AIS/AISSearch/svg/search.svg">' + '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg"></div>' + '</div>';
	    var suggestions = tab.appendChild(document.createElement('div')),
	        preferences = tab.appendChild(document.createElement('div'));
	    suggestions.classList.add("suggestions");
	    preferences.classList.add("preferences");
	    suggestions.innerHTML = '<div class="suggestion">SOME VESSEL<br><span>mmsi:0, imo:0</span></div>';
	    preferences.innerHTML = '<div class="section">Поиск по:</div>' + '<div class="line"><div class="checkbox imo disabled"></div><div class="label">IMO<label></div></div>' + '<div class="line"><div class="checkbox mmsi"></div><div class="label">MMSI<label></div></div>' + '<div class="line"><div class="checkbox name disabled"></div><div class="label">названию</div></div>' + '<div class="line"><div class="checkbox callsign"></div><div class="label">позывному<label></div></div>' + '<div class="line"><div class="checkbox owner"></div><div class="label">собственнику<label></div></div>';
	    !_sparams && (_sparams = 'imo name');
	    if (_sparams.search(/imo/) < 0) _sparams += ' imo';
	    if (_sparams.search(/name/) < 0) _sparams += ' name';
	    var asparams = _sparams.split(' ');
	    console.log(asparams);
	    asparams.forEach(function (p, i) {
	        preferences.querySelector('.' + p).classList.add('checked');
	    });
	
	    this.frame = { find: function find(q) {
	            return container.querySelector(q);
	        } };
	    this.searchInput = this.frame.find('.filter input');
	
	    var searchBut = this.frame.find('.filter .search'),
	        prefeBut = this.frame.find('.filter .preferences'),
	        removeBut = this.frame.find('.filter .remove'),
	        delay = void 0,
	
	    //suggestions = this.frame.find('.suggestions'),
	    suggestionsCount = 5,
	        suggestionsFrame = { first: 0, current: 0, last: suggestionsCount - 1 },
	        found = { values: [] },
	        searchDone = function searchDone() {
	        if (found.values.length > 0) {
	            _searchString = found.values[suggestionsFrame.current].vessel_name;
	            this.searchInput.value = _searchString;
	            callback(found.values[suggestionsFrame.current]);
	        }
	        // else {
	        //     _clean.call(this);
	        // }
	    },
	        doSearch = function doSearch(actualId) {
	        var queries = [];
	        _sparams.split(' ').forEach(function (sp) {
	            queries.push(fetch("//kosmosnimki.ru/demo/lloyds/api/v1/Ship/Search/" + sp + "/" + _searchString));
	        });
	        Promise.all(queries).then(function (a) {
	            //console.log(a)
	            return Promise.all(a.map(function (r) {
	                if (r.status != 200) {
	                    console.log(r);
	                    return [];
	                } else return r.json();
	            }));
	        }).then(function (a) {
	            //console.log(actualId+" "+delay)
	            //console.log(a)
	            if (actualId == delay) {
	                found = { values: [] };
	                a.forEach(function (r) {
	                    found.values = found.values.concat(r.map(function (v) {
	                        return { vessel_name: v.Name, mmsi: v.MMSI, imo: v.IMO, vessel_type: v.Type, rs: v.RS, owner: v.RegisteredOwner, callsign: v.Callsign };
	                    }));
	                });
	                //console.log(found.values)
	            } else return Promise.reject("stop");
	        }).then(function () {
	            var _this = this;
	
	            // SUCCEEDED
	            //console.log(_searchString)
	            if (found.values.length == 0 || _searchString == "") {
	                suggestions.style.display = 'none';
	                return;
	            }
	
	            var scrollCont = suggestions.querySelector('.mCSB_container'),
	                content = Handlebars.compile('{{#each values}}<div class="suggestion" id="{{@index}}">{{vessel_name}}<br><span>mmsi:{{mmsi}}, imo:{{imo}}, {{callsign}}</span><br><span>{{owner}}</span></div>{{/each}}')(found);
	            if (!scrollCont) {
	                suggestions.innerHTML = content;
	                $(suggestions).mCustomScrollbar();
	            } else scrollCont.innerHTML = content;
	
	            var suggestion = suggestions.querySelectorAll('.suggestion');
	            if (suggestions.style.display != 'block') {
	                var cr = this.frame.find('.filter').getBoundingClientRect();
	                suggestions.style.display = 'block';
	                suggestions.style.position = 'fixed';
	                suggestions.style.left = cr.left + "px";suggestions.style.top = cr.bottom - 3 + "px";
	                suggestions.style.width = Math.round(cr.width) - 2 + "px";
	                // $(suggestions).offset({ left: cr.left, top: cr.bottom - 3 });
	                // $(suggestions).outerWidth(cr.width)
	            }
	
	            suggestions.style.height = suggestion[0].getBoundingClientRect().height * (found.values.length > suggestionsCount ? suggestionsCount : found.values.length) + "px";
	
	            suggestionsFrame = { first: 0, current: 0, last: suggestionsCount - 1 };
	            suggestion[suggestionsFrame.current].classList.add('selected');
	            suggestion.forEach(function (el, i) {
	                return el.onclick = function (e) {
	                    suggestionsFrame.current = e.currentTarget.id;
	                    suggestions.style.display = 'none';
	                    searchDone.call(_this);
	                }.bind(_this);
	            }.bind(this));
	        }.bind(this), function (response) {
	            // FAILED
	            if (response != "stop") console.log(response);
	        });
	    };
	
	    tab.addEventListener('click', function (e) {
	        preferences.style.display = 'none';
	    });
	    prefeBut.onclick = function (e) {
	        if (preferences.style.display != 'block') {
	            var cr = this.frame.find('.filter').getBoundingClientRect();
	            preferences.style.display = 'block';
	            preferences.style.position = 'fixed';
	            preferences.style.left = cr.left + (cr.width - preferences.offsetWidth) / 2 + "px";
	            preferences.style.top = cr.bottom + 10 + "px";
	            e.stopPropagation();
	        }
	    }.bind(this);
	
	    preferences.querySelectorAll('.line').forEach(function (el) {
	        return el.onclick = function (e) {
	            var ch = el.querySelector('.checkbox');
	            if (!ch.classList.contains('disabled')) {
	                var sparam = ch.classList.value.replace(/ *(checked|checkbox) */g, '');
	                if (ch.classList.contains('checked')) {
	                    ch.classList.remove('checked');
	                    _sparams = _sparams.replace(new RegExp(sparam), '').replace(/ {2,}/g, ' ');
	                } else {
	                    ch.classList.add('checked');
	                    _sparams = _sparams + ' ' + sparam;
	                }
	                _sparams = _sparams.replace(/^\s+|\s+$/g, '');
	                localStorage.setItem('lloyds_searchparams', _sparams);
	                console.log(_sparams);
	            }
	            e.stopPropagation();
	        };
	    });
	
	    removeBut.onclick = function (e) {
	        _searchString = '';
	        this.searchInput.value = '';
	        this.searchInput.focus();
	        clearTimeout(delay);
	        removeBut.style.display = 'none';
	        searchBut.style.display = 'block';
	        suggestions.style.display = 'none';
	        //_clean.call(this);
	    }.bind(this);
	
	    this.searchInput.onkeydown = function (e) {
	        var suggestion = suggestions.querySelector('.suggestion.selected');
	        if (suggestions.style.display == 'block') {
	            if (e.keyCode == 38) {
	                if (suggestionsFrame.current > 0) {
	                    suggestionsFrame.current--;
	                    suggestion.classList.remove('selected');
	                    suggestion.previousSibling.classList.add('selected');
	                }
	            } else if (e.keyCode == 40) {
	                if (suggestionsFrame.current < found.values.length - 1) {
	                    suggestionsFrame.current++;
	                    suggestion.classList.remove('selected');
	                    suggestion.nextSibling.classList.add('selected');
	                }
	            }
	            if (suggestionsFrame.last < suggestionsFrame.current) {
	                suggestionsFrame.last = suggestionsFrame.current;
	                suggestionsFrame.first = suggestionsFrame.last - (suggestionsCount - 1);
	            }
	            if (suggestionsFrame.first > suggestionsFrame.current) {
	                suggestionsFrame.first = suggestionsFrame.current;
	                suggestionsFrame.last = suggestionsFrame.first + (suggestionsCount - 1);
	            }
	
	            $(suggestions).mCustomScrollbar("scrollTo", "#" + suggestionsFrame.first, { scrollInertia: 0 });
	        }
	    };
	
	    var prepareSearchInput = function prepareSearchInput(temp, keyCode) {
	        removeBut.style.display = 'block';
	        searchBut.style.display = 'none';
	        //console.log("delay clear"+delay)
	        //console.log(_searchString + "=="+ temp)
	        if (_searchString == temp && (!keyCode || keyCode != 13)) return false;
	
	        clearTimeout(delay);
	
	        _searchString = temp;
	        if (_searchString == "") {
	            removeBut.click();
	            return false;
	        }
	        return true;
	    };
	
	    this.searchInput.onkeyup = function (e) {
	        var _this2 = this;
	
	        var temp = (this.searchInput.value || "").replace(/^\s+/, "").replace(/\s+$/, "");
	        if (!prepareSearchInput(temp, e.keyCode)) return;
	        if (e.keyCode == 13) {
	            suggestions.style.display = 'none';
	            searchDone.call(this);
	        } else {
	            delay = setTimeout(function () {
	                doSearch.apply(_this2, [delay]);
	            }.bind(this), 200);
	        }
	    }.bind(this);
	
	    this.searchInput.onpaste = function (e) {
	        var _this3 = this;
	
	        var temp = ((e.originalEvent || window.clipboardData || e).clipboardData.getData('text') || "").replace(/^\s+/, "").replace(/\s+$/, "");
	        if (!prepareSearchInput(temp)) return;
	        delay = setTimeout(function () {
	            doSearch.call(_this3, [delay]);
	        }.bind(this), 200);
	    }.bind(this);
	};
	
	SearchControl.prototype.focus = function () {
	    this.searchInput.focus();
	};
	
	module.exports = SearchControl;

/***/ }),
/* 11 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var Polyfill = __webpack_require__(13);
	module.exports = function (searcher) {
	    var _actualUpdate = void 0,
	        _data = JSON.parse(localStorage.getItem("lloyds_collection"));
	    if (!_data) _data = { vessels: [] };
	    // {
	    //     vessels: [
	    //         { vessel_name: 'ACACIA', mmsi: 371044000, imo: 9476599 },
	    //         { vessel_name: 'AKADEMIK FERSMAN', mmsi: 273455310, imo: 8313958 },
	    //         { vessel_name: 'BALTIMORE BRIDGE', mmsi: 371111000, imo: 9463281 }
	    //     ]};
	    return {
	        searcher: searcher,
	        isDirty: true,
	        get data() {
	            return _data;
	        },
	        set data(value) {
	            _data = value;
	        },
	        save: function save() {
	            localStorage.setItem("lloyds_collection", JSON.stringify(_data));
	        },
	        update: function update() {
	            this.view.repaint();
	        }
	    };
	};

/***/ }),
/* 13 */
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

/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(15);
	var BaseView = __webpack_require__(9);
	
	var RegisterDlgView = function RegisterDlgView(_ref) {
	    var _this = this;
	
	    var model = _ref.model;
	
	    BaseView.call(this, model);
	
	    Object.defineProperty(this, "collection", {
	        set: function (value) {
	            //console.log(value)
	            //console.log(this.model.data.vessels)
	            _this.model.data.vessels = _this.model.data.vessels.filter(function (v) {
	                return value.indexOf(v.RS) !== -1;
	            });
	            //console.log(this.model.data.vessels)
	            var new_tasks = value.filter(function (v) {
	                return !_this.model.data.vessels || !_this.model.data.vessels.some(function (cv) {
	                    return cv.RS == v;
	                });
	            });
	            //console.log(new_tasks)
	            if (new_tasks.length > 0) {
	                _this.model.tasks = new_tasks.map(function (id) {
	                    return fetch("//kosmosnimki.ru/demo/lloyds/api/v1/Ship/Get/" + id);
	                });
	                _this.model.isDirty = true;
	            }
	            //console.log(this.model.isDirty)
	        }.bind(this) });
	
	    this.frame = $(Handlebars.compile('<div class="lloyds_register_dlg_view">' + '<div><table class="instruments unselectable" border=0><tr><td>' + '<div class="fieldstree_selector"><span>{{i "Lloyds.fieldsSelector"}}</span></div><div class="rollout"></div>' + '<div class="fieldstree_display" style="display:none">' + '<div class="select"><div class="fieldstree_selector"><span>{{i "Lloyds.fieldsSelector"}}</span></div><div class="rollout up">&nbsp;</div></div>' + '<hr>' + '<div class="fieldstree_panel"></div>' + '</div>' + '</td><td><div class="refresh" style="display:none">' + this.gifLoader + '</div></td></tr></table></div>' + '<div class="vessels_columns unselectable"><table><tr>' + '<td class="column">&nbsp;</td>' + '</tr></table></div><div class="vessels"></div><div class="export button">Экспорт</div><iframe class="export download" style="display:none"></iframe>' + '</div>')());
	    this.container = this.frame.find('.vessels');
	    var frame = this.frame;
	    this.mcsbOptions = {
	        axis: "yx",
	        callbacks: {
	            whileScrolling: function whileScrolling() {
	                if (this.mcs.direction == "x") frame.find('.vessels_columns table').css({ position: "relative", left: this.mcs.left + "px" });
	            },
	            onScrollStart: function onScrollStart() {
	                if (!frame.find('.fieldstree_display').is(':hover')) frame.find('.rollout.up:visible').mousedown();
	            }
	        }
	    };
	
	    // FIELDSSELECTOR
	    this.model.loadMeta().then(function () {
	        var feeldsTree = '<ul>';
	        for (var i = 0; i < _this.model.data.columns.length; ++i) {
	            feeldsTree += '<li class="section"><div class="lloyds_dialog_button branch_expand" style="display:none"/><div class="lloyds_dialog_button branch_shrink"/>' + '<input type="checkbox" value="' + i + '" ' + (_this.model.data.columns[i].checked ? 'checked' : '') + '><label>' + _this.model.data.columns[i].caption + '</label>';
	            feeldsTree += '<ul>';
	            for (var j = 0; _this.model.data.columns[i].nodes && j < _this.model.data.columns[i].nodes.length; ++j) {
	                feeldsTree += '<li><div class="lloyds_dialog_button branch_expand"/><div class="lloyds_dialog_button branch_shrink" style="display:none"/><input type="checkbox" value="' + i + '.' + j + '" ' + (_this.model.data.columns[i].nodes[j].checked ? 'checked' : '') + '><label>' + _this.model.data.columns[i].nodes[j].caption + '</label>';
	                feeldsTree += '<ul style="display:none">';
	                for (var k = 0; _this.model.data.columns[i].nodes[j].nodes && k < _this.model.data.columns[i].nodes[j].nodes.length; ++k) {
	                    if (_this.model.data.columns[i].nodes[j].nodes[k]) {
	                        if (_this.model.data.columns[i].nodes[j].nodes[k].name == "LRIMOShipNo" || _this.model.data.columns[i].nodes[j].nodes[k].name == "ShipName") {
	                            _this.model.data.columns[i].nodes[j].nodes[k].checked = true;
	                            _this.model.data.columns[i].nodes[j].nodes[k].disabled = true;
	                        }
	
	                        feeldsTree += '<li><input type="checkbox" value="' + i + '.' + j + '.' + k + '" ' + (_this.model.data.columns[i].nodes[j].nodes[k].checked ? 'checked ' : '') + (_this.model.data.columns[i].nodes[j].nodes[k].disabled ? 'disabled="disabled"' : '') + '><label>' + _this.model.data.columns[i].nodes[j].nodes[k].caption + ' <span>(' + _this.model.data.columns[i].nodes[j].nodes[k].trans + ')</span>' + '</label></li>';
	                    }
	                }
	                feeldsTree += '</ul>';
	                feeldsTree += "</li>";
	            }
	            feeldsTree += '</ul>';
	            feeldsTree += "</li>";
	        }
	        feeldsTree += "</ul>";
	        _this.feeldsTree = $(feeldsTree);
	    }.bind(this));
	};
	
	RegisterDlgView.prototype = Object.create(BaseView.prototype);
	
	var _export = function _export(ev) {
	    var form = new FormData(),
	        columns = [];
	    //this.frame.find('input.export:checked').each((i,v)=>v.classList[2] && _vesselsToExport.push(v.classList[2]))
	    if (!_vesselsToExport.length) {
	        console.log('Nothing to export');
	        return;
	    }
	    this.frame.find('.column').each(function (i, c) {
	        return c.classList[1] && columns.push(c.classList[1]);
	    });
	    form.append('vessels', _vesselsToExport);
	    form.append('columns', columns);
	    this.inProgress(true);
	    fetch(window.serverBase + "plugins/ais/lloydsexport.ashx", {
	        method: "POST",
	        mode: 'cors',
	        body: form,
	        credentials: 'include'
	    }).then(function (res) {
	        return res.text();
	    }).then(function (data) {
	        this.inProgress(false);
	        if (data.search(/ERROR:/) != -1) {
	            return Promise.reject(data);
	        }
	        this.frame.find(".export.download")[0].src = window.serverBase + "plugins/ais/lloydsexport.ashx?id=" + data;
	    }.bind(this)).catch(function (data) {
	        this.inProgress(false);
	        console.log(data);
	    }.bind(this));
	},
	    _clean = function _clean() {
	    this.container.empty();
	    this.container.attr("class", "vessels");
	},
	    _showFieldsTree = function _showFieldsTree(e, panel) {
	    if (!panel.is(':visible')) {
	        panel.show();
	        panel.offset(panel.siblings('.fieldstree_selector').offset());
	    } else panel.hide();
	    e.stopPropagation();
	},
	    _showFieldsTreeBranch = function _showFieldsTreeBranch(e, lbl) {
	    var b = $(e.currentTarget).hide().siblings(lbl).show();
	    if (lbl == '.branch_shrink') b.siblings('ul').show();else b.siblings('ul').hide();
	    e.stopPropagation();
	};
	
	var _dialog = void 0,
	    _dialogRect = JSON.parse(localStorage.getItem("lloyds_rect")),
	    _dialogW = _dialogRect ? _dialogRect.w : 710,
	    _dialogH = _dialogRect ? _dialogRect.h : 450,
	    _containerH = _dialogH - 215,
	    _vesselsToExport = []; // _dialogRect?_dialogRect.ch:280;
	
	RegisterDlgView.prototype.show = function () {
	    var _this2 = this;
	
	    if (!_dialog) {
	        _clean.call(this);
	        BaseView.prototype.show.apply(this, arguments);
	        this.resize({ dx: 0, dy: 0 });
	
	        var canvas = this.frame,
	            screen = $('#all')[0],
	            sw = parseFloat(window.getComputedStyle(screen).width),
	            sh = parseFloat(window.getComputedStyle(screen).height),
	            posX = (sw - _dialogW) / 2.0,
	            posY = (sh - _dialogH) / 2.0,
	            isMaximized = false,
	            columns = this.model.data.columns,
	            columns_ts = this.model.data.columnsTs;
	
	        _dialog = showDialog("register", canvas[0], {
	            /*width: _dialogW, height: _dialogH,*/
	            posX: posX, posY: posY,
	            closeFunc: function () {
	                _dialog = null;
	                localStorage.setItem("lloyds_columns", JSON.stringify({ timestamp: columns_ts, nodes: columns }));
	                localStorage.setItem("lloyds_rect", JSON.stringify({ w: _dialogW, h: _dialogH, ch: _containerH }));
	                _this2.frame.find('.export.download')[0].src = "";
	            }.bind(this)
	        });
	        $(_dialog).dialog({
	            resizable: true, resize: function (event, ui) {
	                _this2.resize({ dy: ui.size.height - _dialogH });
	                _dialogW = ui.size.width;
	                _dialogH = ui.size.height;
	                if (!$('.vessels .mCSB_scrollTools_horizontal').is(':visible')) _this2.frame.find('.vessels_columns table').css({ position: "relative", left: 0 });
	            }.bind(this)
	            /*width: _dialogW, height: _dialogH*/
	        });
	        $(_dialog).parent().css({ 'min-width': '600px', 'width': _dialogW, 'height': _dialogH });
	        $(_dialog).parent().find('.ui-dialog-content').css('min-width', '600px');
	        isMaximized = false;
	
	        // TITLEBAR	
	        canvas.parent('div').css({ 'margin': '0', 'overflow': 'hidden' });
	        var titlebar = $(_dialog).parent().find('.ui-dialog-titlebar').css('padding', '0').html('<table class="lloyds_dialog_titlebar"><tr>' + '<td><div class="choose">' + _gtxt("Lloyds.dlgTitle") + '</div></td>' + '<td class="window_button" id="expandbut" title="' + _gtxt("Lloyds.expandButton") + '"><div class="lloyds_dialog_button expand"></div></td>' + '<td class="window_button" id="shrink" title="' + _gtxt("Lloyds.shrinkButton") + '" style="display:none"><div class="lloyds_dialog_button shrink"></div></td>' + '<td class="window_button" id="closebut" title="' + _gtxt("Lloyds.closeButton") + '"><div class="lloyds_dialog_button close"></div></td>' + '</tr></table>');
	
	        $('#closebut', titlebar).on('click', function (e) {
	            if (isMaximized) _this2.resize({ dy: _dialogH - parseFloat(window.getComputedStyle($('#all')[0]).height) });
	            $(_dialog).dialog("close");
	        });
	        $('#shrink', titlebar).on('click', function (e) {
	            $(e.currentTarget).hide();
	            $(_dialog).dialog({ width: _dialogW, height: _dialogH });
	            titlebar.find('#expandbut').show();
	            _this2.resize({ dy: _dialogH - parseFloat(window.getComputedStyle($('#all')[0]).height) });
	            $(_dialog).dialog({ resizable: true });
	            isMaximized = false;
	        });
	        $('#expandbut', titlebar).on('click', function (e) {
	            $(e.currentTarget).hide();
	            var screen = $('#all')[0],
	                sw = parseFloat(window.getComputedStyle(screen).width),
	                sh = parseFloat(window.getComputedStyle(screen).height);
	            $(_dialog).dialog({ width: sw, height: sh });
	            titlebar.find('#shrink').show();
	            _this2.resize({ dy: sh - _dialogH });
	            $(_dialog).dialog({ resizable: false });
	            isMaximized = true;
	        });
	
	        // EXPORT
	        this.frame.find('.export.button').click(_export.bind(this));
	
	        // FIELDSSELECTOR
	        if (this.feeldsTree) {
	            $('.lloyds_register_dlg_view').parents('.ui-dialog').on("mousedown", function (e) {
	                _this2.frame.find('.rollout.up:visible').mousedown();
	            }.bind(this));
	
	            this.frame.find('.fieldstree_panel').text('').append(this.feeldsTree).mCustomScrollbar();
	            this.frame.find('.fieldstree_selector').on('mousedown', function (e) {
	                _showFieldsTree(e, _this2.frame.find('.fieldstree_display'));
	            }.bind(this));
	            this.frame.find('.rollout').on('mousedown', function (e) {
	                _showFieldsTree(e, _this2.frame.find('.fieldstree_display'));
	            }.bind(this));
	            this.feeldsTree.find('.branch_expand').on('mousedown', function (e) {
	                return _showFieldsTreeBranch(e, '.branch_shrink');
	            });
	            this.feeldsTree.find('.branch_shrink').on('mousedown', function (e) {
	                return _showFieldsTreeBranch(e, '.branch_expand');
	            });
	            this.feeldsTree.find('input[type="checkbox"]').on('mousedown', function (e) {
	                var chb = e.currentTarget,
	                    id = chb.value.split("."),
	                    node = columns[id[0]],
	                    parent = void 0;
	                for (var i = 1; i < id.length; ++i) {
	                    parent = node;
	                    node = node.nodes[id[i]];
	                }
	                var s = [node],
	                    n = void 0;
	                while (s.length) {
	                    n = s.pop();
	                    if (!n.disabled) n.checked = !chb.checked;
	                    n.nodes && n.nodes.forEach(function (x) {
	                        return s.push(x);
	                    });
	                }
	                if (parent) parent.checked = parent.nodes.every(function (x) {
	                    return x.checked;
	                });
	                //console.log(parent)
	                //console.log(node)
	                if (chb.checked) {
	                    $(chb).parents('ul').siblings('input:not([disabled])').each(function (i, elm) {
	                        elm.checked = false;
	                    });
	                    $(chb).siblings('ul').find('input:not([disabled])').each(function (i, elm) {
	                        elm.checked = false;
	                    });
	                } else {
	                    $(chb).siblings('ul').find('input').each(function (i, elm) {
	                        elm.checked = true;
	                    });
	                    var uls = $(chb).parents('ul');
	                    for (var _i = 0; _i < uls.length; ++_i) {
	                        var inputs = uls.eq(_i).find('li input'),
	                            checked = uls.eq(_i).find('li input:checked');
	                        //console.log(inputs.length +"=="+ (checked.length+1))
	                        //console.log(uls.eq(i).siblings('input'))
	                        if (inputs.length == checked.length + 1 && uls.eq(_i).siblings('input')[0]) uls.eq(_i).siblings('input')[0].checked = true;
	                    }
	                }
	                _this2.repaint();
	                e.stopPropagation();
	            }.bind(this));
	            this.feeldsTree.find('label').on('mousedown', function (e) {
	                $(e.currentTarget).siblings('input[type="checkbox"]').mousedown().click();
	                e.stopPropagation();
	            });
	        }
	    }
	};
	
	var _repaintExport = function _repaintExport() {
	    var _this3 = this;
	
	    this.frame.find('.export.get:not(.all)').click(function (e) {
	        if (!$(e.target).is(':checked')) {
	            _this3.frame.find('.export.get.all')[0].checked = 0;
	            _vesselsToExport.splice(_vesselsToExport.indexOf(e.target.classList[2]), 1);
	        } else {
	            _vesselsToExport.push(e.target.classList[2]);
	        }
	    }.bind(this)).each(function (i, el) {
	        el.checked = _vesselsToExport.indexOf(el.classList[2]) != -1 ? 1 : 0;
	    });
	
	    this.frame.find('.export.get.all').click(function (e) {
	        _vesselsToExport.length = 0;
	        _this3.frame.find('.export.get:not(.all)').each(function (i, el) {
	            el.checked = $(e.target).is(':checked') ? 1 : 0;
	            if (el.checked) _vesselsToExport.push(el.classList[2]);
	        });
	    }.bind(this))[0].checked = this.model.data.vessels.length == 0 || this.frame.find('.export.get:not(.all):not(:checked)').length > 0 ? 0 : 1;
	};
	
	RegisterDlgView.prototype.repaint = function () {
	    if (!this.frame.is(":visible")) return true;
	    if (this.model.data.columns) this.frame.find('.vessels_columns').html(Handlebars.compile('<table><tr><td><div class="column"><input type="checkbox" class="export get all"><div></div></div></td>{{#each columns}}{{#each nodes}}{{#each nodes}}' + '{{#if checked}}' + '<td><div class="column {{name}}">{{caption}}<div>{{trans}}</div></div></td>' + '{{/if}}' + '{{/each}}{{/each}}{{/each}}</tr></table>')(this.model.data));
	
	    this.tableTemplate = '<table class="vessels_data">{{#each vessels}}<tr>';
	    this.tableTemplate += '<td><div><input type="checkbox" class="export get {{LRIMOShipNo}}"></div></td>';
	    for (var i = 0; i < this.model.data.columns.length; ++i) {
	        for (var j = 0; this.model.data.columns[i].nodes && j < this.model.data.columns[i].nodes.length; ++j) {
	            for (var k = 0; this.model.data.columns[i].nodes[j].nodes && k < this.model.data.columns[i].nodes[j].nodes.length; ++k) {
	                if (this.model.data.columns[i].nodes[j].nodes[k].checked) this.tableTemplate += '<td><div>{{' + this.model.data.columns[i].nodes[j].nodes[k].name + '}}</div></td>';
	            }
	        }
	    }this.tableTemplate += '</tr>' + '{{/each}}</table>{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
	
	    BaseView.prototype.repaint.apply(this, arguments);
	
	    _repaintExport.call(this);
	
	    var columns = this.frame.find('.vessels_columns tr:nth-of-type(1) td div:has(div)'),
	        cells = this.frame.find('.vessels_data tr:nth-of-type(1) td div'),
	        getOuterWidth = function getOuterWidth(el) {
	        var s = window.getComputedStyle(el),
	            w = parseFloat(s.width.replace(/\D+$/, '')); // ,
	        // pl = parseFloat(s["padding-left"].replace(/\D+$/, '')),
	        // pr = parseFloat(s["padding-right"].replace(/\D+$/, '')),
	        // bl = parseFloat(s["border-left-width"].replace(/\D+$/, '')),
	        // br = parseFloat(s["border-right-width"].replace(/\D+$/, ''));
	        //console.log("get " + (w + pl + pr + bl + br) + " = " + w  + " + "+ pl + " + " + pr + " + " + bl + " + " + br)
	        return w; // + pl + pr + bl + br;
	    },
	        setOuterWidth = function setOuterWidth(el, w1) {
	        //     let s = window.getComputedStyle(el),
	        //     pl = parseFloat(s["padding-left"].replace(/\D+$/, '')),
	        //     pr = parseFloat(s["padding-right"].replace(/\D+$/, '')),
	        //     bl = parseFloat(s["border-left-width"].replace(/\D+$/, '')),
	        //     br = parseFloat(s["border-right-width"].replace(/\D+$/, ''));
	        var w = w1; // - (pl + pr + bl + br);
	        //console.log("set " + w + " = " + w1 + " - "+ pl + " - " + pr + " - " + bl + " - " + br)
	        el.style.width = w + "px";
	    };
	    if (cells.length > 0) {
	        $('.vessels_data tr:last-child').after('<tr>' + $('.vessels_columns table tr').html() + '</tr>');
	        var cont_w = this.frame.find('.vessels').width();
	        this.frame.find('.vessels_data').width(cont_w).parent().width(cont_w);
	        columns.each(function (i, el) {
	            var w = getOuterWidth(cells[i]);
	            setOuterWidth(el, w);
	            setOuterWidth(cells[i], w);
	            setOuterWidth(cells.eq(i).parent()[0], w);
	            //console.log(cells.eq(i).outerWidth() + " " + getOuterWidth(cells[i])+" "+$(el).outerWidth())        
	        });
	        var calc_w = getOuterWidth(this.frame.find('.vessels_data')[0]);
	        //console.log("cont_w "+cont_w + " calc_w "+calc_w)
	        if (calc_w > cont_w) {
	            setOuterWidth(this.frame.find('.vessels_data')[0], calc_w);
	            setOuterWidth(this.frame.find('.vessels_data').parent()[0], calc_w);
	        }
	        $('.vessels_data tr:last-child').remove();
	    }
	};
	
	RegisterDlgView.prototype.inProgress = function (state) {
	    var progress = this.frame.find('.refresh');
	    if (state) progress.show();else progress.hide();
	};
	
	RegisterDlgView.prototype.resize = function (_ref2) {
	    var dx = _ref2.dx,
	        dy = _ref2.dy;
	
	    _containerH += dy;
	    this.container.height(_containerH);
	
	    // let calc_w = parseFloat(getComputedStyle(this.container[0]).width),
	    //     columns = this.frame.find('.vessels_columns tr:nth-of-type(1) td div');
	    // if (calc_w>columns.length*200){
	    //     this.frame.find('.vessels_data').width(calc_w)
	    //     .parent().width(calc_w);  
	    // }
	};
	
	module.exports = RegisterDlgView;

/***/ }),
/* 15 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 16 */
/***/ (function(module, exports) {

	"use strict";
	
	var _actualUpdate = void 0;
	module.exports = function (searcher) {
	    var returnInstance = {
	        data: { vessels: [] },
	        isDirty: false,
	        loadMeta: function loadMeta() {
	            return beforeLoad;
	        },
	        tasks: [],
	        load: function load() {
	            var inst = this;
	            return beforeLoad.then(function (res) {
	                return Promise.all(inst.tasks).then(function (r) {
	                    return Promise.all(r.map(function (z) {
	                        return z.json();
	                    }));
	                }).then(function (r) {
	                    var rr = [];
	                    r.forEach(function (v, i) {
	                        rr.push({ RS: parseInt(v.RS, 10), version: v.version });
	                        v.data.forEach(function (ds) {
	                            return ds.properties.forEach(function (p) {
	                                rr[i][p.name] = p.value;
	                            });
	                        });
	                    });
	                    inst.data.vessels = inst.data.vessels.concat(rr);
	                    //console.log(inst.data.vessels)
	                });
	            });
	        },
	        update: function update() {
	            if (!this.isDirty) {
	                var _inst = this;
	                setTimeout(function wait() {
	                    if (_inst.view.repaint()) {
	                        console.log("wait");
	                        setTimeout(wait, 10);
	                    }
	                }, 10);
	                return;
	            }
	            _actualUpdate = new Date().getTime();
	            var inst = this,
	                actualUpdate = _actualUpdate;
	            this.view.inProgress(true);
	            this.load().then(function (res) {
	                if (_actualUpdate == actualUpdate) {
	                    inst.isDirty = false;
	                    inst.view.inProgress(false);
	                    inst.view.repaint();
	                }
	            }, function (json) {
	                inst.data = null;
	                //console.log(json)
	                if (json.Status && json.Status.toLowerCase() == "auth" || json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function (r) {
	                    return r.Status.toLowerCase() == "auth";
	                })) inst.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], vessels: [] };else {
	                    //inst.data = {msg:[{txt:"!!!"}], vessels:[]};
	                    console.log(json);
	                }
	                inst.view.inProgress(false);
	                inst.view.repaint();
	            });
	        }
	    },
	        beforeLoad = new Promise(function (resolve, reject) {
	        var columnsJson = JSON.parse(localStorage.getItem("lloyds_columns"));
	        //columnsJson && console.log((new Date().getTime()-columnsJson.timestamp)/60000)
	        //if (!columnsJson || ((new Date().getTime()-columnsJson.timestamp)/60000>24*60))
	        fetch("//kosmosnimki.ru/demo/lloyds/api/v1/Ship/Meta").then(function (r) {
	            return r.json();
	        }).then(function (r) {
	            var checked = [],
	                convert = function convert(a) {
	                return a.map(function (p) {
	                    return { id: p.id, name: p.name1, trans: p.name3, caption: p.name2, nodes: null, checked: checked.indexOf(p.id) != -1 };
	                });
	            };
	            if (columnsJson) {
	                columnsJson.nodes.forEach(function (e0, i0) {
	                    e0.nodes.forEach(function (e1, i1) {
	                        e1.nodes.forEach(function (e2, i2) {
	                            if (e2.checked) checked.push(e2.id);
	                        });
	                    });
	                });
	                // checked = [columnsJson.a, columnsJson.b, columnsJson.c]
	                // console.log(checked)
	            }
	            returnInstance.data.columnsTs = new Date().getTime();
	            returnInstance.data.columns = [{ name: "general", caption: "Основные сведения", nodes: [{ name: "identification", caption: r[0].name, nodes: convert(r[0].attributes) }, { name: "type", caption: r[1].name, nodes: convert(r[1].attributes) }, { name: "safety", caption: r[4].name, nodes: convert(r[4].attributes) }, { name: "codes", caption: r[15].name, nodes: convert(r[15].attributes) }] }, { name: "subjects", caption: "Организации", nodes: [{ name: "owners", caption: r[2].name, nodes: convert(r[2].attributes) }, { name: "builders", caption: r[3].name, nodes: convert(r[3].attributes) }] }, { name: "history", caption: "Постройка и эксплуатация", nodes: [{ name: "history", caption: r[5].name, nodes: convert(r[5].attributes) }] }, { name: "techical_data", caption: "Технические данные", nodes: [{ name: "features", caption: r[6].name, nodes: convert(r[6].attributes) }, { name: "dimensions", caption: r[7].name, nodes: convert(r[7].attributes) }, { name: "hull", caption: r[8].name, nodes: convert(r[8].attributes) }, { name: "tanks", caption: r[9].name, nodes: convert(r[9].attributes) }, { name: "fuel", caption: r[12].name, nodes: convert(r[12].attributes) }] }, { name: "equipment", caption: "Оборудование", nodes: [{ name: "cargo_structures", caption: r[10].name, nodes: convert(r[10].attributes) }, { name: "engines", caption: r[11].name, nodes: convert(r[11].attributes) }, { name: "energy_facilities", caption: r[13].name, nodes: convert(r[13].attributes) }, { name: "thrusters", caption: r[14].name, nodes: convert(r[14].attributes) }] }];
	            if (columnsJson) {
	                returnInstance.data.columns.forEach(function (c) {
	                    c.nodes.forEach(function (n) {
	                        n.checked = n.nodes.every(function (nn) {
	                            return nn.checked;
	                        });
	                    });
	                    c.checked = c.nodes.every(function (n) {
	                        return n.checked;
	                    });
	                });
	            } else {
	                returnInstance.data.columns[0].nodes[0].nodes.forEach(function (n) {
	                    return n.checked = true;
	                });
	                returnInstance.data.columns[0].nodes[0].checked = true;
	                returnInstance.data.columns[0].nodes[1].nodes.forEach(function (n) {
	                    return n.checked = true;
	                });
	                returnInstance.data.columns[0].nodes[1].checked = true;
	            }
	            resolve();
	        }).catch(function (e) {
	            console.log(e);reject(e);
	        });
	        // else{           
	        //     returnInstance.data.columnsTs = columnsJson.timestamp; 
	        //     returnInstance.data.columns = columnsJson.nodes;            
	        //     resolve();
	        // }
	    });
	    return returnInstance;
	};

/***/ }),
/* 17 */
/***/ (function(module, exports) {

	"use strict";
	
	module.exports = function (options) {
	    var _baseUrl = window.serverBase || document.location.href.replace(/^(https?:).+/, "$1") + '//maps.kosmosnimki.ru/',
	        _aisServices = _baseUrl + "Plugins/AIS/",
	        _serverScript = _baseUrl + 'VectorLayer/Search.ashx';
	    var _aisLastPoint = options.aisLastPoint,
	        _screenSearchLayer = options.screenSearchLayer,
	        _aisLayerID = options.aisLayerID,
	        _historyLayer = options.historyLayer;
	
	
	    return {
	        baseUrl: _baseUrl,
	        aisServices: _aisServices,
	        getBorder: function getBorder() {
	            var lmap = nsGmx.leafletMap;
	            var dFeatures = lmap.gmxDrawing.getFeatures();
	            if (dFeatures.length) {
	                return dFeatures[dFeatures.length - 1].toGeoJSON();
	            }
	            var latLngBounds = lmap.getBounds(),
	                sw = latLngBounds.getSouthWest(),
	                ne = latLngBounds.getNorthEast(),
	                min = { x: sw.lng, y: sw.lat },
	                max = { x: ne.lng, y: ne.lat },
	                minX = min.x,
	                maxX = max.x,
	                geo = { type: 'Polygon', coordinates: [[[minX, min.y], [minX, max.y], [maxX, max.y], [maxX, min.y], [minX, min.y]]] },
	                w = (maxX - minX) / 2;
	
	            if (w >= 180) {
	                geo = { type: 'Polygon', coordinates: [[[-180, min.y], [-180, max.y], [180, max.y], [180, min.y], [-180, min.y]]] };
	            } else if (maxX > 180 || minX < -180) {
	                var center = (maxX + minX) / 2 % 360;
	                if (center > 180) {
	                    center -= 360;
	                } else if (center < -180) {
	                    center += 360;
	                }
	                minX = center - w;maxX = center + w;
	                if (minX < -180) {
	                    geo = {
	                        type: 'MultiPolygon', coordinates: [[[[-180, min.y], [-180, max.y], [maxX, max.y], [maxX, min.y], [-180, min.y]]], [[[minX + 360, min.y], [minX + 360, max.y], [180, max.y], [180, min.y], [minX + 360, min.y]]]]
	                    };
	                } else if (maxX > 180) {
	                    geo = {
	                        type: 'MultiPolygon', coordinates: [[[[minX, min.y], [minX, max.y], [180, max.y], [180, min.y], [minX, min.y]]], [[[-180, min.y], [-180, max.y], [maxX - 360, max.y], [maxX - 360, min.y], [-180, min.y]]]]
	                    };
	                }
	            }
	            return geo;
	        },
	
	        formatTime: function formatTime(d, local) {
	            var temp = new Date(d);
	            if (!local) temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset());
	            return temp.toLocaleTimeString();
	        },
	        formatDate: function formatDate(d, local) {
	            var temp = new Date(d);
	            if (!local) temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset());
	            return temp.toLocaleDateString();
	        },
	        formatDateTime: function formatDateTime(d, local) {
	            if (d.isNaN) return "";
	            var temp = new Date(d);
	            if (!local) temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset());
	            return temp.toLocaleString().replace(/,/, "");
	        },
	
	        formatDate2: function formatDate2(d, local) {
	            var dd, m, y, h, mm;
	            if (local) {
	                dd = ("0" + d.getDate()).slice(-2);
	                m = ("0" + (d.getMonth() + 1)).slice(-2);
	                y = d.getFullYear();
	                h = ("0" + d.getHours()).slice(-2);
	                mm = ("0" + d.getMinutes()).slice(-2);
	                return dd + "." + m + "." + y + " " + h + ":" + mm + " (" + ("0" + d.getUTCHours()).slice(-2) + ":" + ("0" + d.getUTCMinutes()).slice(-2) + " UTC)";
	            } else {
	                dd = ("0" + d.getUTCDate()).slice(-2);
	                m = ("0" + (d.getUTCMonth() + 1)).slice(-2);
	                y = d.getUTCFullYear();
	                h = ("0" + d.getUTCHours()).slice(-2);
	                mm = ("0" + d.getUTCMinutes()).slice(-2);
	                var ldd = ("0" + d.getDate()).slice(-2),
	                    lm = ("0" + (d.getMonth() + 1)).slice(-2),
	                    ly = d.getFullYear(),
	                    lh = ("0" + d.getHours()).slice(-2),
	                    lmm = ("0" + d.getMinutes()).slice(-2),
	                    offset = -d.getTimezoneOffset() / 60;
	                return dd + "." + m + "." + y + " <span class='utc'>" + h + ":" + mm + " UTC</span> (" + lh + ":" + lmm + ")";
	                //return dd+"."+m+"."+y+" "+h+":"+mm+" UTC <br>"+
	                //"<span class='small'>("+ldd+"."+lm+"."+ly+" "+lh+":"+lmm+" UTC"+(offset>0?"+":"")+offset+")</span>";
	            }
	        },
	        placeVesselTypeIcon: function placeVesselTypeIcon(vessel) {
	            switch (vessel.vessel_type.toLowerCase()) {
	                case "cargo":
	                    vessel.icon = "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Ccargo-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "tanker":
	                    vessel.icon = "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Ctanker-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "fishing":
	                    vessel.icon = "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cfishing-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "passenger":
	                    vessel.icon = "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cpassenger-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "hsc":
	                    vessel.icon = "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Chighspeed-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "pleasure craft":
	                case "sailing":
	                    vessel.icon = "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cpleasure-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "unknown":
	                case "reserved":
	                case "other":
	                    vessel.icon = "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cother-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                default:
	                    vessel.icon = "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cspecialcraft-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	            }
	        },
	        searchString: function searchString(_searchString, isfuzzy, callback) {
	            //console.log("http://kosmosnimki.ru/demo/lloyds/api/v1/Ship/Search/"+searchString)
	            //L.gmxUtil.sendCrossDomainPostRequest("http://kosmosnimki.ru/demo/lloyds/api/v1/Ship/Search/"+searchString, request, callback);
	        }
	    };
	};

/***/ })
/******/ ]);
//# sourceMappingURL=LloydsPlugin.js.map