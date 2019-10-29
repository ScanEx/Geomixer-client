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
	        tab.querySelector('.HardNavigation').innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"14\" height=\"14\" viewBox=\"0 0 14 14\"><path d=\"M13.13,0H0.88A0.83,0.83,0,0,0,0,.88V13.13A0.83,0.83,0,0,0,.88,14H13.13A0.83,0.83,0,0,0,14,13.13V0.88A0.83,0.83,0,0,0,13.13,0ZM12.25,12.25H1.75V1.75h10.5v10.5Z\"/>\n        <rect x=\"2\" y=\"7\" width=\"20\" height=\"1\" transform=\"rotate(45 2 7)\"></rect>\n        <rect x=\"2\" y=\"3\" width=\"20\" height=\"1\" transform=\"rotate(45 2 3)\"></rect>\n        <rect x=\"2\" y=\"-1\" width=\"20\" height=\"1\" transform=\"rotate(45 2 -1)\"></rect>\n        <rect x=\"2\" y=\"-5\" width=\"20\" height=\"1\" transform=\"rotate(45 2 -5)\"></rect>   </svg>";
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
	    "HardNavigation.reg_updated": "Обновлен",
	    "HardNavigation.add_new": "Добавить новый объект",
	    "HardNavigation.add_copy": "Добавить выбранный объект",
	    "HardNavigation.no_origin": "нет",
	    "HardNavigation.save": "Сохранить",
	    "HardNavigation.cancel": "Отмена",
	    "HardNavigation.description_lbl": "Описание",
	    "HardNavigation.description_ttl": "Медиа описание",
	    "HardNavigation.edit_description_lbl": "Редактировать",
	    "HardNavigation.edit_description_ttl": "Редактировать медиа описание",
	    "HardNavigation.calendar_today": "сегодня"
	
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
	    "HardNavigation.reg_updated": "Updated",
	    "HardNavigation.add_new": "Добавить новый объект",
	    "HardNavigation.add_copy": "Добавить выбранный объект",
	    "HardNavigation.no_origin": "no",
	    "HardNavigation.save": "Save",
	    "HardNavigation.cancel": "Cancel",
	    "HardNavigation.description_lbl": "Description",
	    "HardNavigation.description_ttl": "Media description",
	    "HardNavigation.edit_description_lbl": "Edit description",
	    "HardNavigation.edit_description_ttl": "Edit media description",
	    "HardNavigation.calendar_today": "today"
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
	
	//let _searchString = "";
	
	var MyCollectionView = function MyCollectionView(_ref) {
	    var model = _ref.model,
	        layer = _ref.layer;
	
	
	    _layer = nsGmx.gmxMap.layersByID[layer];
	    if (!_layer) {
	        model.isDirty = false;
	        return;
	    }
	    if (_layer._map) nsGmx.leafletMap.addLayer(_layer);
	
	    BaseView.call(this, model);
	    this.frame = $(Handlebars.compile('<div class="hardnav-view">\n            <div class="header">\n                <table border=1 class="instruments">\n                <tr>\n                    <td class="but choose"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#selectreg"></use></svg>' + _gtxt('HardNavigation.choose_reg') + '</td>\n                    <td class="but create"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#polygon"></use></svg>' + _gtxt('HardNavigation.create_reg') + '</td>\n                </tr>\n                </table> \n                <table border=1>\n                <tr><td class="hint" colspan="2">' + _gtxt('HardNavigation.instr_hint') + '</td>\n                <td><div class="refresh"><div>' + this.gifLoader + '</div></div></td></tr>\n                </table> \n                <div class="calendar"></div>\n                <table border=1 class="grid-header">\n                <tr><td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></svg></td>\n                <td>' + _gtxt('HardNavigation.reg_id') + '</td>\n                <td>' + _gtxt('HardNavigation.reg_created') + '</td>\n                <td>' + _gtxt('HardNavigation.reg_updated') + '</td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td>\n                <td class="color-transparent"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></td></tr>\n                </table> \n            </div> \n            <div class="grid">\n\n            </div>\n            <div class="footer">\n                <table border=1 class="pager">\n                    <tr><td class="but arrow arrow-prev"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-left"></use></svg></td>\n                    <td class="current">' + _gtxt('HardNavigation.page_lbl') + ' <span class="pages"></span></td>\n                    <td class="but arrow arrow-next"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#arrow-right"></use></svg></td></tr>\n                </table>  \n                <div class="but but-attributes">' + _gtxt('HardNavigation.attr_tbl') + '</div>          \n            </div>\n            </div>')());
	    _addCalendar.call(this);
	
	    this.container = this.frame.find('.grid');
	    this.footer = this.frame.find('.footer');
	
	    this.tableTemplate = '<table border=1 class="grid">{{#each regions}}<tr>' + '<td><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#eye"></use></svg></td>' + '<td>{{id}}{{Origin}}</td>' + '<td>{{{DateTime}}}</td>' + '<td>{{{DateTimeChange}}}</td>' + '<td class="{{StateColor}}"><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#circle"></use></svg></td>' + '<td><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#pen"></use></svg></td>' + '<td><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#target"></use></svg></td>' + '<td><svg><use xlink:href="plugins/ais/hardnavigation/icons.svg#info"></use></svg></td>' + '</tr>{{/each}}</table>' + '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
	
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
	},
	    _addCalendar = function _addCalendar() {
	    var _this = this;
	
	    var calendar = this.frame.find('.calendar')[0];
	    // walkaround with focus at first input in ui-dialog
	    calendar.innerHTML = '<span class="ui-helper-hidden-accessible"><input type="text"/></span>';
	
	    var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
	        dateInterval = new nsGmx.DateInterval();
	
	    dateInterval.set('dateBegin', mapDateInterval.get('dateBegin')).set('dateEnd', mapDateInterval.get('dateEnd')).on('change', function (e) {
	        console.log(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
	        //nsGmx.widgets.commonCalendar.setDateInterval(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
	    }.bind(this));
	
	    this.calendar = new nsGmx.CalendarWidget({
	        dateInterval: dateInterval,
	        name: 'catalogInterval',
	        container: calendar,
	        dateMin: new Date(0, 0, 0),
	        dateMax: new Date(3015, 1, 1),
	        dateFormat: 'dd.mm.yy',
	        minimized: false,
	        showSwitcher: false
	    });
	
	    var tr = calendar.querySelector('tr:nth-of-type(1)');
	    tr.insertCell(2).innerHTML = '&nbsp;&nbsp;–&nbsp;&nbsp;';
	    tr.insertCell(5).innerHTML = '<img class="default_date" style="cursor:pointer; padding-right:10px" title="' + _gtxt('HardNavigation.calendar_today') + '" src="plugins/AIS/AISSearch/svg/calendar.svg">';
	
	    var td = tr.insertCell(6);
	    td.innerHTML = '<div class="select"><select class=""><option value="00" selected>00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24">24</option></div></select>';
	    tr.insertCell(7).innerHTML = '&nbsp;&nbsp;–&nbsp;&nbsp;';
	    td = tr.insertCell(8);
	    td.innerHTML = '<div class="select"><select class=""><option value="00">00</option><option value="01">01</option><option value="02">02</option><option value="03">03</option><option value="04">04</option><option value="05">05</option><option value="06">06</option><option value="07">07</option><option value="08">08</option><option value="09">09</option><option value="10">10</option><option value="11">11</option><option value="12">12</option><option value="13">13</option><option value="14">14</option><option value="15">15</option><option value="16">16</option><option value="17">17</option><option value="18">18</option><option value="19">19</option><option value="20">20</option><option value="21">21</option><option value="22">22</option><option value="23">23</option><option value="24" selected>24</option></div></select>';
	
	    calendar.querySelector('.default_date').addEventListener('click', function () {
	        var db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
	        _this.calendar.getDateInterval().set('dateBegin', db.dateBegin);
	        _this.calendar.getDateInterval().set('dateEnd', db.dateEnd);
	        console.log(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
	        //nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
	    });
	},
	    _listeners = {},
	    _layerClickHandler = function _layerClickHandler(event) {
	    var layer = event.target,
	        props = layer.getGmxProperties(),
	        id = event.gmx.properties[props.identityField];
	
	    layer.bringToTopItem(id);
	    //new nsGmx.EditObjectControl(props.name, id, { event: event });
	    sendCrossDomainJSONRequest(serverBase + 'VectorLayer/Search.ashx?WrapStyle=func&layer=' + props.name + '&page=0&pagesize=1&orderby=' + props.identityField + '&geometry=true&query=[' + props.identityField + ']=' + id, function (response) {
	        if (_stateUI == 'copy_region') {
	            if (response.Status && response.Status.toLowerCase() == 'ok') {
	                var result = response.Result,
	                    i = result.fields.indexOf('geomixergeojson'),
	                    obj = nsGmx.leafletMap.gmxDrawing.addGeoJSON(L.gmxUtil.geometryToGeoJSON(result.values[0][i], true)),
	                    gmx_id = result.values[0][result.fields.indexOf(props.identityField)],
	
	                //date = result.values[0][result.fields.indexOf('Date')],
	                //time = result.values[0][result.fields.indexOf('Time')],
	                name = result.values[0][result.fields.indexOf('Name')],
	                    type = result.values[0][result.fields.indexOf('Type')],
	                    media = result.values[0][result.fields.indexOf('_mediadescript_')],
	                    eoc = new nsGmx.EditObjectControl(props.name, null, { drawingObject: obj[0] }),
	                    dt = new Date();
	                eoc.set('Origin', gmx_id);
	                eoc.set('Name', name);
	                eoc.set('Type', type);
	                eoc.set('_mediadescript_', media);
	                //eoc.set('Time', time); 
	                //eoc.set('Date', date);       
	                eoc.set('Time', dt.getTime() / 1000);
	                eoc.set('Date', dt.getTime() / 1000);
	
	                $(eoc).on('modify', function (e) {
	                    return console.log(e.target.getAll());
	                });
	
	                $('span:contains("' + _gtxt("Создать объект слоя [value0]", props.title) + '")').closest('.ui-dialog').find('tr').each(function (i, el) {
	                    var name = el.querySelectorAll('td')[0].innerText;
	                    if (name.search(/\b(gmx_id|Name|Type|Date|Time)\b/i) < 0)
	                        //if (i==0 || name.search(/\b(State)\b/i)==0)
	                        el.style.display = 'none';
	                });
	            } else console.log(response);
	
	            _chooseBut.click();
	        }
	    });
	    return true;
	},
	    _copyRegion = function _copyRegion() {
	    if (_stateUI != 'copy_region') {
	        if (_stateUI != '') _createBut.click();
	        _stateUI = 'copy_region';
	        _chooseBut.addClass('active');
	
	        for (var iL = 0; iL < nsGmx.gmxMap.layers.length; iL++) {
	            var layer = nsGmx.gmxMap.layers[iL],
	                props = layer.getGmxProperties();
	
	            if (layer.disableFlip && layer.disablePopup) {
	                layer.disableFlip();
	                layer.disablePopup();
	            }
	
	            if (layer instanceof L.gmx.VectorLayer && props.GeometryType.toLowerCase() == 'polygon') {
	                _listeners[props.name] = _layerClickHandler;
	                layer.on('click', _listeners[props.name]);
	            }
	        }
	    } else {
	        _stateUI = '';
	        _chooseBut.removeClass('active');
	        nsGmx.gmxMap.layers.forEach(function (layer) {
	            if (layer.disableFlip && layer.disablePopup) {
	                layer.enableFlip();
	                layer.enablePopup();
	            }
	        });
	        var test = 0;
	        for (var layerName in _listeners) {
	            nsGmx.gmxMap.layersByID[layerName].off('click', _listeners[layerName]);
	            //let clickEvent = nsGmx.gmxMap.layersByID[layerName]._events.click;              
	            //test += clickEvent ? clickEvent.length : 0;
	            delete _listeners[layerName];
	        }
	        //console.log(`clicks ${test}`)
	    }
	},
	    _onDrawStop = function _onDrawStop(e) {
	    var obj = e.object,
	        lprops = _layer.getGmxProperties(),
	        eoc = new nsGmx.EditObjectControl(lprops.name, null, { drawingObject: obj });
	    var dt = new Date();
	    eoc.set('Time', dt.getTime() / 1000);
	    eoc.set('Date', dt.getTime() / 1000);
	    $(eoc).on('modify', function (e) {
	        return console.log(e.target.getAll());
	    });
	
	    $('span:contains("' + _gtxt("Создать объект слоя [value0]", lprops.title) + '")').closest('.ui-dialog').find('tr').each(function (i, el) {
	        var name = el.querySelectorAll('td')[0].innerText;
	        if (name.search(/\b(gmx_id|Name|Type|Date|Time)\b/i) < 0) el.style.display = 'none';
	    });
	
	    //nsGmx.leafletMap._container.style.cursor='pointer'; 
	    //nsGmx.leafletMap.gmxDrawing.create('Polygon'); 
	    if (_stateUI == 'create_region') _createBut.click();
	},
	    _createRegion = function _createRegion() {
	    if (_stateUI != 'create_region') {
	        if (_stateUI != '') _chooseBut.click();
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
	    } else {
	        _stateUI = '';
	        _createBut.removeClass('active');
	        nsGmx.leafletMap._container.style.cursor = '';
	        nsGmx.leafletMap.gmxDrawing.off('drawstop', _onDrawStop);
	        console.log('drawstop ' + nsGmx.leafletMap.gmxDrawing._events.drawstop.length);
	
	        nsGmx.gmxMap.layers.forEach(function (layer) {
	            if (layer.disableFlip && layer.disablePopup) {
	                layer.enableFlip();
	                layer.enablePopup();
	            }
	        });
	
	        nsGmx.leafletMap.gmxDrawing.clearCreate();
	    }
	},
	    _clean = function _clean() {};
	var _stateUI = '',
	    _createBut = void 0,
	    _chooseBut = void 0,
	    _layer = void 0;
	;
	
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
	
	    if (this.model.pagesTotal) {
	        var pages = this.frame.find('.pages');
	        pages.text(this.model.page + 1 + ' / ' + this.model.pagesTotal);
	    }
	};
	
	MyCollectionView.prototype.show = function () {
	    if (!this.frame) return;
	
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
	        _pageSize = 3,
	        _count = 0;
	
	    var _layerName = options.layer,
	        _checkResponse = function _checkResponse(r) {
	        return r && r.Status && r.Status.toLowerCase() == 'ok';
	    };
	    if (!_data) _data = { regions: [] };
	
	    return {
	        isDirty: true,
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
	            if (value < 0) value = 0;
	            if (value >= this.pagesTotal) value = this.pagesTotal - 1;
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
	            var instance = this;
	            if (!this.isDirty) return;
	
	            _count = 0;
	            _data.regions.length = 0;
	            [function (r) {
	                return new Promise(function (resolve, reject) {
	                    sendCrossDomainJSONRequest(window.serverBase + 'VectorLayer/Search.ashx?Layer=' + _layerName + '&count=true', function (r) {
	                        return resolve(r);
	                    });
	                });
	            }, function (r) {
	                if (_checkResponse(r)) {
	                    _count = parseInt(r.Result);
	                    sendCrossDomainJSONRequest(window.serverBase + 'VectorLayer/Search.ashx?Layer=' + _layerName + '&orderby=gmx_id&pagesize=' + _pageSize + '&page=' + _page, function (r) {
	                        if (_checkResponse(r)) {
	                            //resolve(r); 
	                            var result = r.Result,
	                                format = function format(d, t) {
	                                if (!d || !t || isNaN(d) || isNaN(t)) return '';
	                                var dt = new Date(d * 1000 + t * 1000 + new Date().getTimezoneOffset() * 60 * 1000);
	                                return dt.toLocaleDateString() + '<br>' + dt.toLocaleTimeString();
	                            };
	                            for (var i = 0; i < result.values.length; ++i) {
	                                var reg = {};
	                                for (var j = 0; j < result.fields.length; ++j) {
	                                    reg[result.fields[j]] = result.values[i][j];
	                                }reg.id = reg.gmx_id + (reg.Origin && reg.Origin != '' ? '_' : '') + reg.Origin;
	                                reg.DateTime = format(reg.Date, reg.Time);
	                                reg.DateTimeChange = format(reg.DateChange, reg.TimeChange);
	                                reg.StateColor = reg.State == "archive" ? "color-red" : "color-green";
	                                _data.regions.push(reg);
	                            }
	                            console.log(_data);
	                        } else console.log(r);
	                        instance.view.repaint();
	                        instance.isDirty = false;
	                    });
	                } else {
	                    console.log(r);
	                    instance.view.repaint();
	                    instance.isDirty = false;
	                }
	            }].reduce(function (p, c) {
	                return p.then(c);
	            }, Promise.resolve());
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