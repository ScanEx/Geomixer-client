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
	            modulePath: modulePath,
	            layer: params.layer
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
	
	        var tabDiv = tab.querySelector('.HardNavigation');
	        pluginPanel.sidebarPane = sidebar.setPane(menuId, {
	            createTab: function createTab() {
	                !tab.querySelector('.HardNavigation') && tab.append(tabDiv);
	                tab.querySelector('.HardNavigation').innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 14 14\" width=\"20\" height=\"20\"><path d=\"M 13.13 0 H 0.88 A 0.83 0.83 0 0 0 0 0.88 V 13.13 A 0.83 0.83 0 0 0 0.88 14 H 13.13 A 0.83 0.83 0 0 0 14 13.13 V 0.88 A 0.83 0.83 0 0 0 13.13 0 Z M 12.25 12.25 H 1.75 V 1.75 h 10.5 v 10.5 Z\" />\n                     <rect transform=\"rotate(45 2 7)\" x=\"2\" y=\"7\" width=\"8\" height=\"1\" />\n                     <rect transform=\"rotate(45 2 3)\" x=\"2\" y=\"3\" width=\"14\" height=\"1\" />\n                     <rect transform=\"rotate(45 2 -1)\" x=\"4\" y=\"-1\" width=\"14\" height=\"1\" />\n                     <rect transform=\"rotate(45 2 -5)\" x=\"10\" y=\"-5\" width=\"8\" height=\"1\" />   </svg>";
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
	    "HardNavigation.reg_updated": "Изменен",
	    "HardNavigation.add_new": "Добавить новый объект",
	    "HardNavigation.add_copy": "Добавить выбранный объект",
	    "HardNavigation.no_origin": "нет",
	    "HardNavigation.save": "Сохранить",
	    "HardNavigation.cancel": "Отмена",
	    "HardNavigation.description_lbl": "Описание",
	    "HardNavigation.description_ttl": "Медиа описание",
	    "HardNavigation.edit_description_lbl": "Редактировать",
	    "HardNavigation.edit_description_ttl": "Редактировать медиа описание",
	    "HardNavigation.calendar_today": "сегодня",
	    "HardNavigation.layer_error": 'Ошибка слоя'
	
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
	    "HardNavigation.reg_updated": "Changed",
	    "HardNavigation.add_new": "Добавить новый объект",
	    "HardNavigation.add_copy": "Добавить выбранный объект",
	    "HardNavigation.no_origin": "no",
	    "HardNavigation.save": "Save",
	    "HardNavigation.cancel": "Cancel",
	    "HardNavigation.description_lbl": "Description",
	    "HardNavigation.description_ttl": "Media description",
	    "HardNavigation.edit_description_lbl": "Edit description",
	    "HardNavigation.edit_description_ttl": "Edit media description",
	    "HardNavigation.calendar_today": "today",
	    "HardNavigation.layer_error": 'Layer error'
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
	    var _mcm = new MyCollectionModel({ layer: options.layer }),
	        _mcv = new MyCollectionView({ model: _mcm, layer: options.layer });
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
	
	var _stateUI = '',
	    _createBut = void 0,
	    _chooseBut = void 0,
	    _layer = void 0,
	    _thisView = void 0,
	    _hidden = {},
	    _visible = {};
	
	var MyCollectionView = function MyCollectionView(_ref) {
	    var model = _ref.model,
	        layer = _ref.layer;
	
	    _thisView = this;
	
	    _layer = nsGmx.gmxMap.layersByID[layer];
	    if (!_layer) {
	        model.isDirty = false;
	        return;
	    }
	
	    nsGmx.widgets.commonCalendar.getDateInterval().on('change', function (e) {
	        _hidden = {};
	        _visible = {};
	        _layer.repaint();
	        if (!_thisView.isVisible) {
	            //_thisView.repaint();
	            _thisView.inProgress(true);
	            _thisView.model.isDirty = true;
	        }
	    });
	    _layer.setFilter(_isVisible);
	
	    BaseView.call(this, model);
	    this.frame = $(Handlebars.compile('<div class="hardnav-view">\n            <div class="header">\n                <table border=0>\n                <tr><td class="hint" colspan="2">' + _gtxt('HardNavigation.instr_hint') + '</td>\n                <td><div class="refresh"><div style="display:none">' + this.gifLoader + '</div></div></td></tr>\n                </table> \n\n                <table border=0 class="instruments unselectable">\n                <tr>\n                    <td class="but choose"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#selectreg"></use></svg>' + _gtxt('HardNavigation.choose_reg') + '</td>\n                    <td class="but create"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#polygon"></use></svg>' + _gtxt('HardNavigation.create_reg') + '</td>\n                </tr>\n                </table> \n\n                <div class="calendar"></div>\n\n                <table border=0 class="grid-header">\n                <tr><td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></svg></td>\n                <td>' + _gtxt('HardNavigation.reg_id') + '</td>\n                <td>' + _gtxt('HardNavigation.reg_created') + '</td>\n                <td>' + _gtxt('HardNavigation.reg_updated') + '</td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td></tr>\n                </table> \n            </div> \n            <div class="grid">\n\n            </div>\n            <div class="footer unselectable">\n                <table border=0 class="pager">\n                    <tr><td class="but arrow arrow-prev"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-left"></use></svg></td>\n                    <td class="current">' + _gtxt('HardNavigation.page_lbl') + ' <span class="pages"></span></td>\n                    <td class="but arrow arrow-next"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-right"></use></svg></td></tr>\n                </table>  \n                <div class="but but-attributes">' + _gtxt('HardNavigation.attr_tbl') + '</div>          \n            </div>\n            </div>')());
	    _addCalendar.call(this);
	
	    this.container = this.frame.find('.grid');
	    this.footer = this.frame.find('.footer');
	
	    this.tableTemplate = '<table border=0 class="grid">{{#each regions}}<tr id="{{gmx_id}}">' + '<td class="visibility">' + '<svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></svg>' + '<svg style="display:none"><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye-off"></use></svg></td>' + '<td class="identity">{{id}}</td>' + '<td class="identity">{{{DateTime}}}</td>' + '<td>{{{DateTimeChange}}}</td>' + '<td class="{{StateColor}} state"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#circle"></use></svg></td>' + '<td class="edit"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#pen"></use></svg></td>' + '<td class="show"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#target"></use></svg></td>' + '<td class="info"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#info"></use></svg></td>' + '</tr>{{/each}}</table>' + '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
	
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
	
	    _chooseBut = this.frame.find('.but.choose');
	    _createBut = this.frame.find('.but.create');
	    _chooseBut.on('click', _copyRegion.bind(this));
	    _createBut.on('click', _createRegion.bind(this));
	
	    this.frame.find('.but.arrow-prev').on('click', this.model.previousPage.bind(this.model));
	    this.frame.find('.but.arrow-next').on('click', this.model.nextPage.bind(this.model));
	    this.frame.find('.but.but-attributes').on('click', function () {
	        return nsGmx.createAttributesTable(layer);
	    });
	},
	    _isActual = function _isActual(reg) {
	    var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
	        atttributes = _layer.getGmxProperties().attributes,
	        iOrigin = atttributes.indexOf("Origin") + 1,
	        iState = atttributes.indexOf("State") + 1,
	        iDate = atttributes.indexOf("Date") + 1,
	        iTime = atttributes.indexOf("Time") + 1,
	        iDateChange = atttributes.indexOf("DateChange") + 1,
	        iTimeChange = atttributes.indexOf("TimeChange") + 1,
	        iNextDatetCh = atttributes.indexOf("NextDateChange") + 1,
	        iNextTimeCh = atttributes.indexOf("NextTimeChange") + 1,
	        id = reg.properties[iOrigin] == '' ? reg.properties[0].toString() : reg.properties[iOrigin],
	        state = !reg.properties[iState] ? '' : reg.properties[atttributes.indexOf("State") + 1],
	        dtBegin = mapDateInterval.get('dateBegin').getTime(),
	        dtEnd = mapDateInterval.get('dateEnd').getTime();
	
	    var curVer = { d: reg.properties[iDateChange] * 1000, t: reg.properties[iTimeChange] * 1000, get dt() {
	            return this.d + this.t;
	        } },
	        nextVer = { d: reg.properties[iNextDatetCh] * 1000, t: reg.properties[iNextTimeCh] * 1000, get dt() {
	            return this.d + this.t;
	        } };
	    if (curVer.d === 0) {
	        curVer.d = reg.properties[iDate] * 1000;
	        curVer.t = reg.properties[iTime] * 1000;
	    }
	
	    if (curVer.dt < dtEnd) {
	        if (nextVer.d == 0 && (state.search(/archive/) < 0 || curVer.dt >= dtBegin)) return true;else if (nextVer.dt >= dtEnd) return true;else return false;
	    } else return false;
	},
	    _isActual0 = function _isActual0(reg) {
	    var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
	        atttributes = _layer.getGmxProperties().attributes,
	        iOrigin = atttributes.indexOf("Origin") + 1,
	        iState = atttributes.indexOf("State") + 1,
	        iDate = atttributes.indexOf("Date") + 1,
	        iTime = atttributes.indexOf("Time") + 1,
	        iDateChange = atttributes.indexOf("DateChange") + 1,
	        iTimeChange = atttributes.indexOf("TimeChange") + 1,
	        id = reg.properties[iOrigin] == '' ? reg.properties[0].toString() : reg.properties[iOrigin],
	        state = !reg.properties[iState] ? '' : reg.properties[atttributes.indexOf("State") + 1],
	        dtBegin = mapDateInterval.get('dateBegin').getTime(),
	        dtEnd = mapDateInterval.get('dateEnd').getTime();
	
	    var version = { d: reg.properties[iDateChange] * 1000, t: reg.properties[iTimeChange] * 1000 };
	    if (version.d === 0) {
	        version.d = reg.properties[iDate] * 1000;
	        version.t = reg.properties[iTime] * 1000;
	    }
	
	    //console.log(`>>${id}`, version, version.d < dtEnd)
	    if (version.d < dtEnd) {
	        var test = true,
	            isLatest = true;
	        // Search region of same id and the more late version on a certain moment
	        for (var key in _layer.getDataManager()._activeTileKeys) {
	            test = true;
	            var data = _layer.getDataManager()._tiles[key].tile.data;
	            if (data) for (var i = 0; i < data.length; ++i) {
	                var curId = data[i][iOrigin] != '' ? data[i][iOrigin] : data[i][0],
	                    curVersion = { d: data[i][iDateChange] * 1000, t: data[i][iTimeChange] * 1000 };
	                if (curVersion.d == 0) curVersion = { d: data[i][iDate] * 1000, t: data[i][iTime] * 1000 };
	                if (curId != id) continue;
	                if (curVersion.d >= dtEnd) {
	                    isLatest = false;continue;
	                }
	                test = !(version.d < curVersion.d || version.d == curVersion.d && version.t < curVersion.t);
	                if (!test) {
	                    //console.log(curId, curVersion)
	                    break;
	                }
	            }
	            if (!test) break;
	        }
	        if (test && isLatest && state.search(/archive/) > -1 && version.d < dtBegin) return false;
	        return test;
	    } else return false;
	},
	    _isVisible = function _isVisible(reg) {
	    var id = reg.properties[0].toString();
	
	    if (_visible[id]) return true;
	
	    if (_hidden[id] || !_isActual(reg)) return false;else return true;
	},
	    _addCalendar = function _addCalendar() {
	    var _this = this;
	
	    var calendar = this.frame.find('.calendar')[0];
	    // walkaround with focus at first input in ui-dialog
	    calendar.innerHTML = '<span class="ui-helper-hidden-accessible"><input type="text"/></span>';
	
	    var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
	        dateInterval = new nsGmx.DateInterval();
	
	    dateInterval.set('dateBegin', mapDateInterval.get('dateBegin')).set('dateEnd', mapDateInterval.get('dateEnd')).on('change', function (e) {
	        //console.log(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
	        nsGmx.widgets.commonCalendar.setDateInterval(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
	        if (_thisView.isVisible) {
	            _thisView.inProgress(true);
	            _thisView.model.isDirty = true;
	            _thisView.model.update();
	        }
	    }.bind(this));
	
	    this.calendar = new nsGmx.CalendarWidget({
	        dateInterval: dateInterval,
	        name: 'catalogInterval',
	        container: calendar,
	        dateMin: new Date(0, 0, 0),
	        dateMax: new Date(),
	        dateFormat: 'dd.mm.yy',
	        minimized: false,
	        showSwitcher: false
	    });
	
	    calendar.querySelector('.CalendarWidget-dateBegin').style.display = 'none';
	    var tr = calendar.querySelector('tr:nth-of-type(1)');
	    //tr.insertCell(2).innerHTML = '&nbsp;&nbsp;–&nbsp;&nbsp;';
	    tr.insertCell(4).innerHTML = '<img class="default_date" style="cursor:pointer; padding-right:10px" title="' + _gtxt('HardNavigation.calendar_today') + '" src="plugins/AIS/AISSearch/svg/calendar.svg">';
	
	    // let td = tr.insertCell(6);
	    // td.innerHTML = '<div class="select"><select class=""><option value="00" selected>00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24">24</option></div></select>';       
	    // tr.insertCell(7).innerHTML = '&nbsp;&nbsp;–&nbsp;&nbsp;';       
	    // td = tr.insertCell(8);
	    // td.innerHTML = '<div class="select"><select class=""><option value="00">00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24" selected>24</option></div></select>';       
	
	
	    calendar.querySelector('.default_date').addEventListener('click', function () {
	        var db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
	        _this.calendar.getDateInterval().set('dateBegin', db.dateBegin);
	        _this.calendar.getDateInterval().set('dateEnd', db.dateEnd);
	        //console.log(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
	        nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
	        if (_thisView.isVisible) {
	            _thisView.inProgress(true);
	            _thisView.model.isDirty = true;
	            _thisView.model.update();
	        }
	    });
	},
	    _checkVersion = function _checkVersion() {
	    setTimeout(function () {
	        L.gmx.layersVersion.chkVersion(_layer);
	        //console.log('ChV')                   
	        setTimeout(function () {
	            L.gmx.layersVersion.chkVersion(_layer);
	            //console.log('ChV')                   
	            setTimeout(function () {
	                L.gmx.layersVersion.chkVersion(_layer);
	                //console.log('ChV')                   
	            }, 3000);
	        }, 3000);
	    }, 3000);
	},
	    _layerClickHandler = function _layerClickHandler(event) {
	    var layer = event.target,
	        props = layer.getGmxProperties(),
	        id = event.gmx.properties[props.identityField];
	
	    layer.bringToTopItem(id);
	    sendCrossDomainJSONRequest(serverBase + 'VectorLayer/Search.ashx?WrapStyle=func&layer=' + props.name + '&page=0&pagesize=1&orderby=' + props.identityField + '&geometry=true&query=[' + props.identityField + ']=' + id, function (response) {
	        if (_stateUI == 'copy_region') {
	            if (response.Status && response.Status.toLowerCase() == 'ok') {
	                var result = response.Result,
	                    i = result.fields.indexOf('geomixergeojson'),
	                    obj = nsGmx.leafletMap.gmxDrawing.addGeoJSON(L.gmxUtil.geometryToGeoJSON(result.values[0][i], true)),
	                    gmx_id = result.values[0][result.fields.indexOf(props.identityField)],
	                    origin = parseInt(result.values[0][result.fields.indexOf('Origin')]),
	                    date = parseInt(result.values[0][result.fields.indexOf('Date')]),
	                    time = parseInt(result.values[0][result.fields.indexOf('Time')]),
	                    name = result.values[0][result.fields.indexOf('Name')],
	                    type = result.values[0][result.fields.indexOf('Type')],
	                    media = result.values[0][result.fields.indexOf('_mediadescript_')],
	                    eoc = new nsGmx.EditObjectControl(props.name, null, { drawingObject: obj[0] }),
	                    dt = new Date();
	                eoc.initPromise.done(function () {
	                    eoc.set('Origin', origin && origin != '' ? origin : gmx_id);
	                    eoc.set('Name', name);
	                    eoc.set('Type', type);
	                    eoc.set('_mediadescript_', media);
	                    eoc.set('Time', date + time);
	                    eoc.set('Date', date + time);
	                    eoc.set('TimeChange', dt.getTime() / 1000);
	                    eoc.set('DateChange', dt.getTime() / 1000);
	
	                    var dlg = $('span:contains("' + _gtxt("Создать объект слоя [value0]", props.title) + '")').closest('.ui-dialog');
	                    dlg.find('tr').each(function (i, el) {
	                        var name = el.querySelectorAll('td')[0].innerText;
	                        if (name.search(/\b(gmx_id|Name|Type|Date|Time)\b/i) < 0)
	                            //if (i==0 || name.search(/\b(State)\b/i)==0)
	                            el.style.display = 'none';
	                    });
	                    dlg.find('.buttonLink:contains("' + _gtxt("Создать") + '")').on('click', function (e) {
	                        _thisView.inProgress(true);
	                    });
	                });
	                $(eoc).on('modify', function (e) {
	                    //console.log(e.target.getAll());
	                    var values = e.target.getAll();
	                    sendCrossDomainJSONRequest(serverBase + 'VectorLayer/ModifyVectorObjects.ashx?WrapStyle=func&LayerName=' + props.name + '&objects=[{"properties":{"State":"archive","NextDateChange":' + values.DateChange + ',"NextTimeChange":' + values.TimeChange + '},"id":"' + id + '","action":"update"}]', function (response) {
	                        _thisView.model.page = 0; // model update                                                       
	                        _thisView.model.updatePromise.then(_checkVersion);
	
	                        if (response.Status && response.Status.toLowerCase() == 'ok') {} else {
	                            console.log(response);
	                        }
	                    });
	                });
	            } else {
	                console.log(response);
	            }
	            _chooseBut.click();
	        }
	    });
	    return true;
	},
	    _copyRegion = function _copyRegion() {
	    var layer = _layer,
	        props = layer.getGmxProperties();
	    if (_stateUI == 'create_region' || _stateUI == '') {
	        if (_stateUI == 'create_region') _createBut.click();
	
	        _stateUI = 'copy_region';
	        _chooseBut.addClass('active');
	        if (layer.disableFlip && layer.disablePopup) {
	            layer.disableFlip();
	            layer.disablePopup();
	        }
	        layer.on('click', _layerClickHandler);
	    } else if (_stateUI == 'copy_region') {
	        _stateUI = '';
	        _chooseBut.removeClass('active');
	        if (layer.disableFlip && layer.disablePopup) {
	            layer.enableFlip();
	            layer.enablePopup();
	        }
	        layer.off('click', _layerClickHandler);
	    }
	},
	    _onDrawStop = function _onDrawStop(e) {
	    var obj = e.object,
	        lprops = _layer.getGmxProperties(),
	        eoc = new nsGmx.EditObjectControl(lprops.name, null, { drawingObject: obj });
	    eoc.initPromise.done(function () {
	        var dt = new Date();
	        eoc.set('Time', dt.getTime() / 1000);
	        eoc.set('Date', dt.getTime() / 1000);
	        var dlg = $('span:contains("' + _gtxt("Создать объект слоя [value0]", lprops.title) + '")').closest('.ui-dialog');
	        dlg.find('tr').each(function (i, el) {
	            var name = el.querySelectorAll('td')[0].innerText;
	            if (name.search(/\b(gmx_id|Name|Type|Date|Time)\b/i) < 0) el.style.display = 'none';
	        });
	        dlg.find('.buttonLink:contains("' + _gtxt("Создать") + '")').on('click', function (e) {
	            _thisView.inProgress(true);
	        });
	    });
	    $(eoc).on('modify', function (e) {
	        _thisView.model.page = 0; // Model update
	        _thisView.model.updatePromise.then(_checkVersion);
	    });
	    // Continue command
	    //nsGmx.leafletMap._container.style.cursor='pointer'; 
	    //nsGmx.leafletMap.gmxDrawing.create('Polygon'); 
	
	    // Discontinue command
	    if (_stateUI == 'create_region') _createBut.click();
	},
	    _createRegion = function _createRegion() {
	    if (_stateUI == 'copy_region' || _stateUI == '') {
	        if (_stateUI == 'copy_region') _chooseBut.click();
	        _stateUI = 'create_region';
	        _createBut.addClass('active');
	        nsGmx.leafletMap.gmxDrawing.on('drawstop', _onDrawStop);
	
	        nsGmx.gmxMap.layers.forEach(function (layer) {
	            if (layer.disableFlip && layer.disablePopup) {
	                layer.disableFlip();
	                layer.disablePopup();
	            }
	        });
	
	        nsGmx.leafletMap._container.style.cursor = 'pointer';
	        nsGmx.leafletMap.gmxDrawing.create('Polygon');
	    } else if (_stateUI == 'create_region') {
	        _stateUI = '';
	        _createBut.removeClass('active');
	        nsGmx.leafletMap._container.style.cursor = '';
	        nsGmx.leafletMap.gmxDrawing.off('drawstop', _onDrawStop);
	        //console.log(`drawstop ${nsGmx.leafletMap.gmxDrawing._events.drawstop.length}`)
	
	        nsGmx.gmxMap.layers.forEach(function (layer) {
	            if (layer.disableFlip && layer.disablePopup) {
	                layer.enableFlip();
	                layer.enablePopup();
	            }
	        });
	
	        nsGmx.leafletMap.gmxDrawing.clearCreate();
	    }
	},
	    _clean = function _clean() {
	
	    this.frame.find('.grid .info').off('click', _infoClickHandler);
	    this.frame.find('.grid .visibility').off('click', _visClickHandler);
	    this.frame.find('.grid .show').off('click', _showClickHandler);
	    //this.frame.find('.grid .state').off('click', _stateClickHandler);
	    this.frame.find('.grid .edit').off('click', _editClickHandler);
	};
	
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
	
	var _infoClickHandler = function _infoClickHandler(e) {
	    var td = e.currentTarget,
	        id = td.parentElement.id,
	        descData = _layer._gmx.dataManager.getItem(parseInt(id)).properties[_layer.getGmxProperties().attributes.indexOf('_mediadescript_') + 1],
	        mediaDescDialog = jQuery('<div class="mediaDesc-Div"><img src="plugins/external/GMXPluginMedia/addit/media_img_load.gif"></img></div>');
	
	    mediaDescDialog.dialog({
	        title: _gtxt('mediaPlugin2.mediaDescDialogTitleRead.label'),
	        width: 510,
	        height: 505, //dialogSettings.dialogDescHeight,
	        minHeight: 505, //dialogSettings.dialogDescHeight,
	        maxWidth: 510,
	        minWidth: 510,
	        modal: false,
	        autoOpen: false,
	        dialogClass: 'media-DescDialog',
	        close: function close() {
	            mediaDescDialog.dialog('close').remove();
	        }
	    });
	
	    mediaDescDialog.html('<div class="media-descDiv">' + descData + '</div>');
	    mediaDescDialog.dialog('open');
	},
	    _visClickHandler = function _visClickHandler(e) {
	    var td = e.currentTarget,
	        id = td.parentElement.id,
	        svg = td.querySelectorAll('svg'),
	        vis = 0,
	        hid = 1;
	    if (svg[0].style.display != 'none') {
	        delete _visible[id];
	        _hidden[id] = true;
	        vis = 1;hid = 0;
	    } else {
	        _visible[id] = true;
	        delete _hidden[id];
	        vis = 0;hid = 1;
	    }
	    svg[hid].style.display = 'none';
	    svg[vis].style.display = 'block';
	    _layer.repaint();
	    //console.log(_hidden)
	},
	    _showClickHandler = function _showClickHandler(e) {
	    var id = e.currentTarget.parentElement.id,
	        layer = _layer,
	        props = layer.getGmxProperties(),
	        layerName = props.name;
	    sendCrossDomainJSONRequest(window.serverBase + 'VectorLayer/Search.ashx?WrapStyle=func&layer=' + layerName + '&page=0&pagesize=1&geometry=true&query=' + encodeURIComponent('[' + props.identityField + ']=' + id), function (response) {
	        if (!window.parseResponse(response)) {
	            return;
	        }
	        var columnNames = response.Result.fields;
	        var row = response.Result.values[0];
	        //for (var i = 0; i < row.length; ++i)
	        var i = columnNames.indexOf('geomixergeojson');
	        {
	            if (columnNames[i] === 'geomixergeojson' && row[i]) {
	                var fitBoundsOptions = layer ? { maxZoom: layer.options.maxZoom } : {};
	
	                var geom = L.gmxUtil.geometryToGeoJSON(row[i], true);
	                var bounds = L.gmxUtil.getGeometryBounds(geom);
	                nsGmx.leafletMap.fitBounds([[bounds.min.y, bounds.min.x], [bounds.max.y, bounds.max.x]], fitBoundsOptions);
	            }
	        }
	    });
	},
	    _stateClickHandler = function _stateClickHandler(e) {
	    var td = e.currentTarget,
	        id = td.parentElement.id,
	        state = '';
	
	    if (td.className.search(/green/) != -1) state = 'archive';
	
	    sendCrossDomainJSONRequest(serverBase + 'VectorLayer/ModifyVectorObjects.ashx?WrapStyle=func&LayerName=' + _layer.getGmxProperties().name + '&objects=[{"properties":{"State":"' + state + '"},"id":"' + id + '","action":"update"}]', function (response) {
	        if (response.Status && response.Status.toLowerCase() == 'ok') {
	            _thisView.inProgress(true);
	            _thisView.model.isDirty = true;
	            _thisView.model.update();
	            _thisView.model.updatePromise.then(_checkVersion);
	        } else console.log(response);
	    });
	},
	    _editClickHandler = function _editClickHandler(e) {
	
	    if (_stateUI != '') return;
	    _stateUI = 'edit_region';
	
	    var id = e.currentTarget.parentElement.id,
	        layerName = _layer.getGmxProperties().name,
	        layerTitle = _layer.getGmxProperties().title,
	        eoc = new nsGmx.EditObjectControl(layerName, id),
	        dt = new Date();
	    var isDelete = false;
	    eoc.initPromise.done(function () {
	        //eoc.set('TimeChange', dt.getTime()/1000); 
	        //eoc.set('DateChange', dt.getTime()/1000);
	        var dlg = $('span:contains("' + _gtxt("Редактировать объект слоя [value0]", layerTitle) + '")').closest('.ui-dialog');
	        dlg.find('tr').each(function (i, el) {
	            var name = el.querySelectorAll('td')[0].innerText;
	            if (i > 1 && name.search(/\b(Name|Type)\b/i) < 0) el.style.display = 'none';
	        });
	        dlg.find('.buttonLink:contains("' + _gtxt("Изменить") + '")').on('click', function (e) {
	            _thisView.inProgress(true);
	        });
	        dlg.find('.buttonLink:contains("' + _gtxt("Удалить") + '")').on('click', function (e) {
	            _thisView.inProgress(true);
	            isDelete = true;
	        });
	    });
	    $(eoc).on('modify', function (e) {
	        ///console.log(e.target.getAll(), dt);
	        _thisView.model.isDirty = true;
	        _thisView.model.update();
	        _thisView.model.updatePromise.then(_checkVersion);
	    });
	    $(eoc).on('close', function (e) {
	        if (isDelete) _thisView.model.page = 0;
	        _stateUI = '';
	    });
	};
	
	MyCollectionView.prototype.repaint = function () {
	    _clean.call(this);
	    BaseView.prototype.repaint.call(this);
	
	    if (this.model.pagesTotal) {
	        var pager = this.frame.find('.pager'),
	            pages = pager.find('.pages');
	        pager.css('visibility', 'visible');
	        pages.text(this.model.page + 1 + ' / ' + this.model.pagesTotal);
	
	        $('.grid tr').each(function (i, el) {
	            var id = el.id,
	                svg = el.querySelectorAll('svg');
	            //console.log(id, _layer.getDataManager().getItem(parseInt(id)));
	            var attr = _layer.getGmxProperties().attributes,
	                props = [id];
	            props[attr.indexOf('Date') + 1] = _thisView.model.data.regions[i].Date;
	            props[attr.indexOf('Time') + 1] = _thisView.model.data.regions[i].Time;
	            props[attr.indexOf('DateChange') + 1] = _thisView.model.data.regions[i].DateChange;
	            props[attr.indexOf('TimeChange') + 1] = _thisView.model.data.regions[i].TimeChange;
	            props[attr.indexOf("NextDateChange") + 1] = _thisView.model.data.regions[i].NextDateChange;
	            props[attr.indexOf("NextTimeChange") + 1] = _thisView.model.data.regions[i].NextTimeChange;
	            props[attr.indexOf('State') + 1] = _thisView.model.data.regions[i].State;
	            props[attr.indexOf('Origin') + 1] = _thisView.model.data.regions[i].Origin;
	            var reg = { properties: props };
	            //console.log(reg);
	            if (!_isVisible(reg)) {
	                svg[0].style.display = 'none';
	                svg[1].style.display = 'block';
	            }
	            if (!_isActual(reg)) el.classList.add('nonactual');else el.classList.remove('nonactual');
	        });
	
	        this.frame.find('.grid .info').on('click', _infoClickHandler);
	        this.frame.find('.grid .visibility').on('click', _visClickHandler);
	        this.frame.find('.grid .show').on('click', _showClickHandler);
	        //this.frame.find('.grid .state').on('click', _stateClickHandler);
	        this.frame.find('.grid .state').css('cursor', 'default');
	        this.frame.find('.grid .edit').on('click', _editClickHandler);
	    } else {
	        this.frame.find('.pager').css('visibility', 'hidden');
	    }
	};
	
	MyCollectionView.prototype.show = function () {
	    if (!this.frame) return;
	
	    if (!_layer._map) nsGmx.leafletMap.addLayer(_layer);
	
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
	            if (!this.frame) return;
	
	            //console.log($('.iconSidebarControl-pane').height(), this.topOffset, this.bottomOffset)
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
	            if (!this.frame) return;
	            this.frame.show();
	            this.model.update();
	        },
	        hide: function hide() {
	            this.frame.hide();
	        },
	        get isVisible() {
	            var rc = this.frame[0].getBoundingClientRect();
	            return rc.width != 0 && rc.height != 0;
	        }
	    };
	}();
	
	module.exports = BaseView;

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var Polyfill = __webpack_require__(11);
	module.exports = function (options) {
	    var _actualUpdate = void 0,
	        _data = void 0,
	        _page = 0,
	        _pageSize = 14,
	        _count = 0;
	
	    var _layerName = options.layer,
	        _checkResponse = function _checkResponse(r) {
	        return r && r.Status && r.Status.toLowerCase() == 'ok';
	    };
	    if (!_data) _data = { regions: [] };
	
	    var _initPromise = new Promise(function (resolve, reject) {
	        var layer = nsGmx.gmxMap.layersByID[_layerName];
	        if (!layer) {
	            reject('HardNavigation plugin error: no layer ' + _layerName);
	            return;
	        }
	        var props = nsGmx.gmxMap.layersByID[_layerName]._gmx.properties,
	            columns = [];
	        props.attributes.forEach(function (a, i) {
	            columns.push({ Name: a, OldName: a, ColumnSimpleType: props.attrTypes[i], IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"' + a + '"' });
	        });
	        if (props.attributes.indexOf("Name") < 0) columns.push({ Name: 'Name', ColumnSimpleType: 'String', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"Name"' });
	        if (props.attributes.indexOf("Type") < 0) columns.push({ Name: 'Type', ColumnSimpleType: 'String', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"Type"' });
	        if (props.attributes.indexOf("Date") < 0) columns.push({ Name: 'Date', ColumnSimpleType: 'Date', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"Date"' });
	        if (props.attributes.indexOf("Time") < 0) columns.push({ Name: 'Time', ColumnSimpleType: 'Time', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"Time"' });
	        if (props.attributes.indexOf("DateChange") < 0) columns.push({ Name: 'DateChange', ColumnSimpleType: 'Date', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"DateChange"' });
	        if (props.attributes.indexOf("TimeChange") < 0) columns.push({ Name: 'TimeChange', ColumnSimpleType: 'Time', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"TimeChange"' });
	
	        if (props.attributes.indexOf("NextDateChange") < 0) columns.push({ Name: 'NextDateChange', ColumnSimpleType: 'Date', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"NextDateChange"' });
	        if (props.attributes.indexOf("NextTimeChange") < 0) columns.push({ Name: 'NextTimeChange', ColumnSimpleType: 'Time', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"NextTimeChange"' });
	
	        if (props.attributes.indexOf("State") < 0) columns.push({ Name: 'State', ColumnSimpleType: 'String', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"State"' });
	        if (props.attributes.indexOf("Origin") < 0) columns.push({ Name: 'Origin', ColumnSimpleType: 'String', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"Origin"' });
	        if (props.attributes.indexOf("_mediadescript_") < 0) columns.push({ Name: '_mediadescript_', ColumnSimpleType: 'String', IsPrimary: false, IsIdentity: false, IsComputed: false, expression: '"_mediadescript_"' });
	
	        if (columns.length == props.attributes.length) {
	            resolve(columns.length);
	        } else {
	            var def = nsGmx.asyncTaskManager.sendGmxPostRequest(serverBase + "VectorLayer/Update.ashx", {
	                VectorLayerID: _layerName,
	                MetaProperties: JSON.stringify({ mediaDescField: { Type: "String", Value: "_mediadescript_" } }),
	                Columns: JSON.stringify(columns) });
	            def.promise().done(function (r) {
	                return resolve(columns.length);
	            }).fail(function (r) {
	                return reject(r);
	            });
	        }
	    });
	
	    return {
	
	        isDirty: true,
	        updatePromise: Promise.resolved,
	        get data() {
	            return _data;
	        },
	        set data(value) {
	            _data = value;
	        },
	        get pagesTotal() {
	            return Math.ceil(_count / _pageSize);
	        },
	        set page(value) {
	            if (value < 0) {
	                return;
	            }
	            if (this.pagesTotal > 0 && value >= this.pagesTotal) {
	                return;
	            }
	            _page = value;
	            this.isDirty = true;
	            this.update();
	        },
	        get page() {
	            return _page;
	        },
	        previousPage: function previousPage() {
	            if (!this.isDirty) this.page = _page - 1;
	        },
	        nextPage: function nextPage() {
	            if (!this.isDirty) this.page = _page + 1;
	        },
	        update: function update() {
	            var thisModel = this;
	            if (!thisModel.isDirty) return;
	
	            var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
	                formatDt = function formatDt(dt) {
	                return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2);
	            },
	                dtBegin = formatDt(mapDateInterval.get('dateBegin')),
	                dtEnd = formatDt(mapDateInterval.get('dateEnd'));
	
	            _initPromise.then(function (test) {
	                //console.log(test)
	                _count = 0;
	                _data.regions.length = 0;
	                thisModel.view.inProgress(true);
	                thisModel.updatePromise = [function (r) {
	                    return new Promise(function (resolve, reject) {
	                        sendCrossDomainJSONRequest(window.serverBase + 'VectorLayer/Search.ashx?Layer=' + _layerName + '&count=true' + ('&query="Date"<\'' + dtEnd + '\' and ("DateChange" is null or "DateChange"<\'' + dtEnd + '\') and (("NextDateChange" is null and ("State"<>\'archive\' or ("Date">=\'' + dtBegin + '\' and "DateChange" is null) or "DateChange">=\'' + dtBegin + '\')) or "NextDateChange">=\'' + dtEnd + '\')'), function (r) {
	                            return resolve(r);
	                        });
	                    });
	                }, function (r) {
	                    if (_checkResponse(r)) {
	                        _count = parseInt(r.Result);
	                        sendCrossDomainJSONRequest(window.serverBase + 'VectorLayer/Search.ashx?Layer=' + _layerName + '&orderby=gmx_id&orderdirection=DESC&pagesize=' + _pageSize + '&page=' + _page + ('&query="Date"<\'' + dtEnd + '\' and ("DateChange" is null or "DateChange"<\'' + dtEnd + '\') and (("NextDateChange" is null and ("State"<>\'archive\' or ("Date">=\'' + dtBegin + '\' and "DateChange" is null) or "DateChange">=\'' + dtBegin + '\')) or "NextDateChange">=\'' + dtEnd + '\')'), function (r) {
	                            _data.regions.length = 0;
	                            if (_checkResponse(r)) {
	                                //resolve(r); 
	                                var result = r.Result,
	                                    format = function format(d, t) {
	                                    if (!d || !t || isNaN(d) || isNaN(t)) return '';
	                                    var dt = new Date(d * 1000 + t * 1000 + new Date().getTimezoneOffset() * 60 * 1000);
	                                    return dt.toLocaleDateString() + '<br>' + dt.toLocaleTimeString();
	                                };
	                                _data.fields = result.fields.map(function (f) {
	                                    return f;
	                                });
	                                for (var i = 0; i < result.values.length; ++i) {
	                                    var reg = {};
	                                    for (var j = 0; j < result.fields.length; ++j) {
	                                        reg[result.fields[j]] = result.values[i][j];
	                                    }reg.id = reg.Origin && reg.Origin != '' ? reg.Origin : reg.gmx_id;
	                                    reg.DateTime = format(reg.Date, reg.Time);
	                                    //reg.DateTimeChange = reg.DateChange ? format(reg.DateChange, reg.TimeChange) : format(reg.Date, reg.Time);
	                                    reg.DateTimeChange = format(reg.DateChange, reg.TimeChange);
	                                    reg.StateColor = reg.State.search(/\barchive\b/) != -1 ? "color-red" : "color-green";
	                                    _data.regions.push(reg);
	                                }
	                                //console.log(_data);
	                            } else console.log(r);
	                            thisModel.view.repaint();
	                            thisModel.isDirty = false;
	                            //resolve();
	                        });
	                        //});
	                    } else {
	                        console.log(r);
	                        thisModel.view.repaint();
	                        thisModel.isDirty = false;
	                    }
	                }].reduce(function (p, c) {
	                    return p.then(c);
	                }, Promise.resolve());
	            }).catch(function (error) {
	                thisModel.data.msg = [{ txt: _gtxt('HardNavigation.layer_error') }];
	                console.log(error);
	                thisModel.view.repaint();
	                thisModel.isDirty = false;
	            }); // _initPromise
	        } // this.update
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