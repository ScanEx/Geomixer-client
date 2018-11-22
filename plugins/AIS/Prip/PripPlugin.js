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
	
	__webpack_require__(1);
	//require("./Views/PripView.css")
	__webpack_require__(3);
	
	var pluginName = 'PripPlugin',
	    menuId = pluginName,
	    toolbarIconId = pluginName,
	    cssTable = pluginName,
	    modulePath = gmxCore.getModulePath(pluginName);
	
	var PluginPanel = __webpack_require__(4),
	    ViewsFactory = __webpack_require__(5);
	
	var publicInterface = {
	    pluginName: pluginName,
	    afterViewer: function afterViewer(params, map) {
	
	        var options = {
	            modulePath: modulePath
	        },
	            viewFactory = new ViewsFactory(options),
	            pluginPanel = new PluginPanel(viewFactory);
	        pluginPanel.menuId = menuId;
	
	        var sidebar = window.iconSidebarWidget,
	            tab = window.createTabFunction({
	            icon: "Prip", //menuId,
	            active: "prip_sidebar-icon",
	            inactive: "prip_sidebar-icon",
	            hint: _gtxt('Prip.title')
	        })();
	        tab.querySelector('.Prip').innerHTML = '<svg height="16" width="16">' + '<circle cx="8" r="2" cy="3"></circle>' + '<path d="M0 1 L8 3 L0 5Z"></path>' + '<path d="M8 3 L16 1 L16 5Z"></path>' + '<path d="M6 7 L6 10 L10 10 L10 7Z"></path>' + '<path d="M5 13 L4 16 L12 16 L11 13Z"></path></svg>';
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

	'use strict';
	
	_translationsHash.addtext('rus', {
	    'Prip.title': 'ПРИП',
	    'Prip.west_tab': 'ЗАПАД',
	    'Prip.east_tab': 'ВОСТОК',
	    'Prip.arkh_tab': 'АРХАНГЕЛЬСК',
	    'Prip.murm_tab': 'МУРМАНСК',
	    'Prip.open': 'показать',
	    'Prip.close': 'скрыть'
	});
	_translationsHash.addtext('eng', {
	    'Prip.title': 'COSTAL WARNING',
	    'Prip.west_tab': 'COSTAL WARNING WEST',
	    'Prip.east_tab': 'COSTAL WARNING EAST',
	    'Prip.arkh_tab': 'ARKHANGELSK',
	    'Prip.murm_tab': 'MURMANSK',
	    'Prip.open': 'open',
	    'Prip.close': 'close'
	});

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	'use strict';
	
	module.exports = function (viewFactory) {
	    var _leftMenuBlock = void 0,
	        _canvas = _div(null),
	        _activeView = void 0,
	        _views = viewFactory.create(),
	        _isReady = false,
	        _createTabs = function _createTabs() {
	        var tabsTemplate = '<table class="prip_tabs" border=0><tr>' + '</td><td class="prip_tab scrsearch_tab unselectable" unselectable="on">' + '<div>{{i "Prip.murm_tab"}}</div>' + '</td><td class="prip_tab scrsearch_tab unselectable" unselectable="on">' + '<div>{{i "Prip.arkh_tab"}}</div>' + '<td class="prip_tab dbsearch_tab unselectable" unselectable="on">' + '<div>{{i "Prip.west_tab"}}</div>' + '</td><td class="prip_tab scrsearch_tab unselectable" unselectable="on">' + '<div>{{i "Prip.east_tab"}}</div>' + '</td></tr></table>';
	
	        $(this.sidebarPane).append(_canvas);
	        $(_canvas).append(Handlebars.compile(tabsTemplate));
	        $(_canvas).append(_views.map(function (v) {
	            return v.frame;
	        }));
	
	        var tabs = $('.prip_tab', _canvas),
	            _this = this;
	        _views.forEach(function (v, i) {
	            v.tab = tabs.eq(i);
	            v.resize(true);
	        });
	        tabs.on('click', function () {
	            if (!$(this).is('.active')) {
	                var target = this;
	                tabs.each(function (i, tab) {
	                    if (!$(tab).is('.active') && target == tab) {
	                        $(tab).addClass('active');
	                        _views[i].show();
	                        _activeView = _views[i];
	                    } else {
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
	        show: function show() {
	            var lmap = nsGmx.leafletMap;
	            if (!_isReady) {
	                _createTabs.call(this);
	            } else {
	                _activeView && _activeView.show();
	            }
	        }
	    };
	    return _returnInstance;
	};

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var PripView = __webpack_require__(6),
	    PripModel = __webpack_require__(9);
	
	module.exports = function (options) {
	    var _pm1 = new PripModel("http://kosmosnimki.ru/demo/prip/actual.ashx?zone=murm"),
	        _pv1 = new PripView(_pm1),
	        _pm2 = new PripModel("http://kosmosnimki.ru/demo/prip/actual.ashx?zone=arkh"),
	        _pv2 = new PripView(_pm2),
	        _pm3 = new PripModel("http://kosmosnimki.ru/demo/prip/actual.ashx?zone=west"),
	        _pv3 = new PripView(_pm3),
	        _pm4 = new PripModel("http://kosmosnimki.ru/demo/prip/actual.ashx?zone=east"),
	        _pv4 = new PripView(_pm4);
	
	    return {
	        create: function create() {
	            return [_pv1, _pv2, _pv3, _pv4];
	        }
	    };
	};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(7);
	var BaseView = __webpack_require__(8);
	var PripView = function PripView(model) {
	    BaseView.call(this, model);
	    this.topOffset = 80;
	    this.frame = $(Handlebars.compile('<div class="prip_view">' + '<div class="prips_all">' + '<table class="prips_year" border=0><tr>' + '<td><div class="open_positions ui-helper-noselect icon-right-open" title="TITLE"></div></td>' + '<td><span class="date">YEAR</span></td>' + '</tr></table>' + '<div><table class="prip_content"><tr><td>COSTAL WARNING</td></tr></table></div>' + '</div>' + '</div>')());
	    this.container = this.frame.find('.prips_all');
	
	    this.tableTemplate = '{{#if msg}}<div class="message">{{msg}}</div>{{/if}}' + '{{#each years}}' + '<table class="prips_year" border=0 title="{{i "Prip.close"}}"><tr>' + '<td><div class="open_positions ui-helper-noselect icon-down-open"></div></td>' + '<td><span class="date">20{{{year}}}</span></td>' + '</tr></table>' + '<div>' + '<table class="prip_content">' + '{{#each prips}}' + '<tr class="prip{{n}}_{{year}}">' + '<td><div class="open_positions ui-helper-noselect icon-right-open" title="{{i "Prip.open"}}"></div></td>' + '<td>{{title}}</td>' + '</tr>' + '<tr><td colspan="2" class="more"><hr><div class="vi_more">' + '{{#each lines}}' + '<div>{{{this}}}</div>' + '{{/each}}' + '</div></td></tr>' + '{{/each}}' + '</table>' + '</div>' + '{{/each}}';
	};
	
	var _markerIcon = L.icon({
	    className: "prip_highlight-icon",
	    iconAnchor: [6, 12],
	    iconSize: [12, 12],
	    //iconUrl:'//maps.kosmosnimki.ru/api/plugins/ais/aissearch/highlight.png'});
	    iconUrl: 'data:image/svg+xml, %3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20height=%2212%22%20width=%2212%22%3E%3Cpolyline%20points=%226,0%200,12%2012,12%206,0%22%20style=%22fill:none;stroke:%23f00;stroke-width:1%22/%3E%3C/svg%3E' }),
	    _markers = {};
	
	PripView.prototype = Object.create(BaseView.prototype);
	
	PripView.prototype.inProgress = function (state) {
	    if (state) {
	        this.frame.css('background', 'url(\'img/progress.gif\') center no-repeat');
	    } else {
	        this.frame.css('background-image', 'none');
	    }
	};
	
	var _clean = function _clean() {
	    var scrollCont = this.container.find('.mCSB_container');
	    if (scrollCont[0]) scrollCont.empty();else this.container.empty();
	};
	
	PripView.prototype.repaint = function () {
	    _clean.call(this);
	    BaseView.prototype.repaint.apply(this, arguments);
	
	    var parseCoordinate = function parseCoordinate(coordElement) {
	        var a = new RegExp("([\\d\\.,]+)-([\\d\\.,]+)-?([\\d\\.,]*)\\D ([\\d\\.,]+)-([\\d\\.,]+)-?([\\d\\.,]*)(\\D)?", "ig").exec(coordElement.innerText.replace(",", "."));
	        if (a == null) {
	            console.log(e.currentTarget.innerText + " invalid!");
	            return;
	        }
	        var x = parseFloat(a[4]) + parseFloat(a[5]) / 60.0 + parseFloat("0" + a[6]) / 3600.0,
	            y = parseFloat(a[1]) + parseFloat(a[2]) / 60.0 + parseFloat("0" + a[3]) / 3600.0;
	        if (a[7] == "З" || a[7] == "W") x = -x;
	        // console.log(a)
	        // console.log(y+", "+x)
	        return [y, x];
	    },
	        showCoordinates = function showCoordinates(coordinates, tooltip) {
	        if (coordinates.length == 0) return [];
	        //console.log(coordinates)
	        var markers = [];
	        coordinates.forEach(function (c, i) {
	            var m = L.marker(c, { icon: _markerIcon });
	            markers.push(m);
	            m.addTo(nsGmx.leafletMap);
	            m.on('mouseover', function (e) {
	                this.openPopup();
	            });
	            m.on('mouseout', function (e) {
	                this.closePopup();
	            });
	            m.bindPopup(tooltip, { closeButton: false });
	        });
	        var init = [[coordinates[0][0], coordinates[0][1]], [coordinates[0][0], coordinates[0][1]]];
	        coordinates = coordinates.reduce(function (prev, curr) {
	            if (prev[0][0] > curr[0]) prev[0][0] = curr[0];
	            if (prev[0][1] > curr[1]) prev[0][1] = curr[1];
	            if (prev[1][0] < curr[0]) prev[1][0] = curr[0];
	            if (prev[1][1] < curr[1]) prev[1][1] = curr[1];
	            return prev;
	        }, init);
	        //console.log(coordinates)
	        nsGmx.leafletMap.fitBounds(coordinates, {
	            maxZoom: 9,
	            animate: false
	        });
	        return markers;
	    };
	
	    this.container.find('.coordinate').click(function (e) {
	        // let a = new RegExp("([\\d\\.,]+)-([\\d\\.,]+)-?([\\d\\.,]*)\\D ([\\d\\.,]+)-([\\d\\.,]+)-?([\\d\\.,]*)(\\D)?", "ig")
	        // .exec(e.currentTarget.innerText.replace(",", "."));
	        // if (a==null){
	        //     console.log(e.currentTarget.innerText+" invalid!")
	        //     return;
	        // }
	        // let x = parseFloat(a[4])+parseFloat(a[5])/60.0+parseFloat("0"+a[6])/3600.0,
	        //     y = parseFloat(a[1])+parseFloat(a[2])/60.0+parseFloat("0"+a[3])/3600.0,
	        //     z = nsGmx.leafletMap.getZoom();
	        // if (a[7]=="З"||a[7]=="W")
	        //     x=-x;
	        var coordinate = parseCoordinate(e.currentTarget),
	            z = nsGmx.leafletMap.getZoom();
	        nsGmx.leafletMap.fitBounds([coordinate, coordinate], {
	            maxZoom: z, //(z < 9 ? 9 : z),
	            animate: false
	        });
	    });
	
	    this.container.find('.prips_year').click(function (e) {
	        var table = $(e.currentTarget).next(),
	            div = $(e.currentTarget).find('td:first-of-type div');
	        if (div.is('.icon-down-open')) {
	            div.addClass('icon-right-open').removeClass('icon-down-open');
	            $(e.currentTarget).attr('title', _gtxt("Prip.open"));
	            table.hide();
	        } else {
	            div.addClass('icon-down-open').removeClass('icon-right-open');
	            $(e.currentTarget).attr('title', _gtxt("Prip.close"));
	            table.show();
	        }
	    }).click().eq(0).click();
	
	    this.container.find('.prip_content td[class!="more"]').click(function (e) {
	        var td = $(e.currentTarget),
	            tr = td.parent();
	        if (td.is('.active')) {
	            td.removeClass('active');
	            td.siblings().removeClass('active');
	            tr.next().find('td').removeClass('active');
	            tr.find('.icon-down-open').addClass('icon-right-open').removeClass('icon-down-open').attr('title', _gtxt("Prip.open"));
	            _markers[tr.attr('class')].forEach(function (m) {
	                nsGmx.leafletMap.removeLayer(m);
	            });
	        } else {
	            td.addClass('active');
	            td.siblings().addClass('active');
	            tr.next().find('td').addClass('active');
	            tr.find('.icon-right-open').addClass('icon-down-open').removeClass('icon-right-open').attr('title', _gtxt("Prip.close"));
	            var coordinates = [];
	            tr.next().find('.coordinate').each(function (i, e) {
	                return coordinates.push(parseCoordinate(e));
	            });
	            _markers[tr.attr('class')] = showCoordinates(coordinates, tr[0].innerText.replace(/(^\s+|\s+$)/, '').replace(/(КАРТ)/, '<br>$1'));
	        }
	    });
	};
	
	module.exports = PripView;

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 8 */
/***/ (function(module, exports) {

	'use strict';
	
	var _calcHeight = function _calcHeight() {
	    var template = this.frame.find('.prips_year')[0],
	        h = template.getBoundingClientRect().height;
	
	    var H = $('.iconSidebarControl-pane').height() - this.topOffset;
	    // console.log(template.getBoundingClientRect())
	    // console.log(this.topOffset)
	    // console.log(H)
	    return H - H % h;
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
	    if (scrollCont[0]) scrollCont.empty();else this.container.empty();
	    //console.log("EMPTY ON BASE.CLEAN")
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
	            if (!scrollCont[0]) {
	                this.container.append(content).mCustomScrollbar();
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
	            this.container.find('.ais_vessel').on('click', function () {
	                //console.log(JSON.parse($(this).find('.info').attr('vessel')))
	                var v = JSON.parse($(this).find('.info').attr('vessel'));
	                v.lastPosition = true;
	                _this.infoDialogView.showPosition(v);
	            });
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
/* 9 */
/***/ (function(module, exports) {

	"use strict";
	
	module.exports = function (sorce) {
	    var _data = null;
	    return {
	        isDirty: true,
	        get data() {
	            return _data;
	        },
	        load: function load(actualUpdate) {
	            return fetch(sorce).then(function (response) {
	                return response.json();
	            });
	        },
	        update: function update() {
	            var _this = this;
	
	            if (this.isDirty) {
	                this.view.inProgress(true);
	                this.load().then(function (response) {
	                    if (response.Status && response.Status == "ok") {
	                        _data = {
	                            years: response.Result.reduce(function (acc, cv) {
	                                if (!acc.length || cv.year != acc[acc.length - 1].year) acc.push({ year: cv.year, prips: [cv] });else acc[acc.length - 1].prips.push(cv);
	                                return acc;
	                            }, [])
	                        };
	                    } else console.log(response);
	                    _this.view.inProgress(false);
	                    _this.view.repaint();
	                    _this.isDirty = false;
	                }.bind(this)).catch(function (ex) {
	                    console.log(ex);
	                    _this.view.inProgress(false);
	                }.bind(this));
	            }
	        }
	    };
	};

/***/ })
/******/ ]);
//# sourceMappingURL=PripPlugin.js.map