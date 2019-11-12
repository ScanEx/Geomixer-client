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
	__webpack_require__(3);
	var Constants = __webpack_require__(4);
	
	var pluginName = Constants.PLUGIN_NAME,
	    menuId = Constants.MENU_ID,
	    cssTable = Constants.CSS_TABLE,
	    modulePath = Constants.MODULE_PATH;
	
	var PluginPanel = __webpack_require__(5),
	    ViewsFactory = __webpack_require__(8);
	
	var publicInterface = {
	    pluginName: pluginName,
	    afterViewer: function afterViewer(params, map) {
	        /*
	                params.Groups =  `NOAA-20, MODIS`;
	                params.Layers1 = `9C267B2AC5084155A3FD0CAF2B23E420, 
	                    07208267CAE54F44B0D6B61065E36FA7,
	                8C549B3B6D3741DD98E480CAE02F2798`;
	                params.Layers2 = `A66138C36BA249D68183B09232AC3194,
	                        533FCC7439DA4A2EB97A2BE77887A462,
	                        60EA8F7A8C1B4AC38B59529695605276,
	                        EB271FC4D2AD425A9BAA78ADEA041AB9`;
	        */
	
	        var groups = [],
	            layers = [];
	        if (params.Groups) groups = params.Groups.split(',').map(function (g) {
	            return g.replace(/^\s+/, '').replace(/\s+$/, '');
	        });
	        groups.forEach(function (g, i) {
	            var a = params["Layers" + (i + 1)].split(',').map(function (g) {
	                return g.replace(/^\s+/, '').replace(/\s+$/, '');
	            });
	            layers.push(a);
	        });
	        //console.log(groups, layers);
	
	        var options = {
	            modulePath: modulePath,
	            groups: groups,
	            layers: layers
	        },
	            viewFactory = new ViewsFactory(options),
	            pluginPanel = new PluginPanel(viewFactory, groups);
	        pluginPanel.menuId = menuId;
	
	        var sidebar = window.iconSidebarWidget,
	            tab = window.createTabFunction({
	            icon: "RasterCatalog", //menuId,
	            active: "RasterCatalog_sidebar-icon",
	            inactive: "RasterCatalog_sidebar-icon",
	            hint: _gtxt('RasterCatalog.title')
	        })();
	
	        var tabDiv = tab.querySelector('.RasterCatalog');
	        pluginPanel.create(sidebar.setPane(menuId, {
	            position: params.showOnTop ? -100 : 0,
	            createTab: function createTab() {
	                !tab.querySelector('.RasterCatalog') && tab.append(tabDiv);
	                tab.querySelector('.RasterCatalog').innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" style="width:16px; height:16px" viewBox="0 0 16 16">' + '<path d="M15.15,0H0.88A0.83,0.83,0,0,0,0,.88V15.15A0.83,0.83,0,0,0,.88,16H15.15A0.83,0.83,0,0,0,16,15.15V0.88A0.83,0.83,0,0,0,15.15,0ZM14.25,14.25H1.75V1.75h12.5v12.5Z"/>' + '<circle cx="7" cy="5" r="1.4"/>' + '<path d="M 3 10 L 6 7 L 8 10 L 13 5 L 13 7 L 8 12 L 6 9 L 3 12 z"/>' + '</svg>';
	                return tab;
	            }
	        }));
	        sidebar.addEventListener('opened', function (e) {
	            if (sidebar._activeTabId == menuId) pluginPanel.show();
	        });
	
	        if (params.showOnTop) {
	            // hack
	            $('div[data-pane-id]').removeClass('iconSidebarControl-pane-active');
	            sidebar._renderTabs({ activeTabId: menuId });
	            setTimeout(function () {
	                return sidebar.open(menuId);
	            }, 50);
	        }
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
	    'RasterCatalog.title': 'Каталог растров',
	    'RasterCatalog.filter': 'Съемочная система',
	    'RasterCatalog.timeline': 'Таймлайн',
	    'RasterCatalog.all': 'Все',
	    'RasterCatalog.calendar_today': 'сегодня'
	
	});
	_translationsHash.addtext('eng', {
	    'RasterCatalog.title': 'Rasters catalog',
	    'RasterCatalog.filter': 'System',
	    'RasterCatalog.timeline': 'Timeline',
	    'RasterCatalog.all': 'All',
	    'RasterCatalog.calendar_today': 'today'
	
	});

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	"use strict";
	
	var PluginName = 'RasterCatalog';
	module.exports = {
	    PLUGIN_NAME: PluginName,
	    MENU_ID: PluginName + "Plugin",
	    CSS_TABLE: PluginName + "Plugin",
	    MODULE_PATH: gmxCore.getModulePath(PluginName)
	};

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(1);
	var SelectControl = __webpack_require__(6);
	module.exports = function (viewFactory, groups) {
	    var _leftMenuBlock = void 0,
	        _canvas = document.createElement('div'),
	        _views = viewFactory.create(),
	        _activeView = _views[0],
	        _isReady = false,
	        _instruments = document.createElement('div');
	
	    _canvas.className = 'rc_panel';
	    _instruments.className = 'rc_instruments';
	    _instruments.innerHTML = '<table><tr><td>' + _gtxt('RasterCatalog.filter') + '</td><td><div class="rc_filter"></div></td></tr></table>\n        <table><tr><td style="padding-right: 55px;"><div class="calendar"></div></td>\n        </tr></table>';
	    /*
	    `<table><tr><td>${_gtxt('RasterCatalog.filter')}</td><td><div class="rc_filter"></div></td></tr></table>
	    <table><tr><td style="padding-right: 55px;"><div class="calendar"></div></td>
	    </tr> 
	    <tr><td>       
	    <span>${_gtxt('RasterCatalog.timeline')}</span>
	    <label class="sync-switch switch"><input type="checkbox"><div class="sync-switch-slider switch-slider round"></div></label>
	    </td></tr>
	    </table>`;
	    */
	    ////////////////////////////////////////
	
	    var _toggleTimeline = function _toggleTimeline(layerID, add) {
	        var tlc = nsGmx.timeLineControl,
	            layer = nsGmx.gmxMap.layersByID[layerID];
	        if (add) {
	            if (!tlc._map) {
	                nsGmx.leafletMap.addControl(tlc);
	            }
	            tlc.addLayer(layer);
	        } else {
	            if (tlc._map) tlc.removeLayer(layer);
	        }
	    },
	        _addCalendar = function _addCalendar() {
	        var _this = this;
	
	        var calendar = _canvas.querySelector('.calendar');
	        // walkaround with focus at first input in ui-dialog
	        calendar.innerHTML = '<span class="ui-helper-hidden-accessible"><input type="text"/></span>';
	
	        var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
	            dateInterval = new nsGmx.DateInterval();
	
	        dateInterval.set('dateBegin', mapDateInterval.get('dateBegin')).set('dateEnd', mapDateInterval.get('dateEnd')).on('change', function (e) {
	            //console.log(dateInterval.get('dateBegin')) 
	            nsGmx.widgets.commonCalendar.setDateInterval(dateInterval.get('dateBegin'), dateInterval.get('dateEnd'));
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
	        tr.insertCell(5).innerHTML = '&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="' + _gtxt('RasterCatalog.calendar_today') + '" src="plugins/AIS/AISSearch/svg/calendar.svg">';
	
	        calendar.querySelector('.default_date').addEventListener('click', function () {
	            var db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
	            _this.calendar.getDateInterval().set('dateBegin', db.dateBegin);
	            _this.calendar.getDateInterval().set('dateEnd', db.dateEnd);
	            nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
	        });
	    },
	        _create = function _create(sidebarPane) {
	        _canvas.append(_instruments);
	        this.sidebarPane.append(_canvas);
	
	        /*
	        let timelineSwitch = _instruments.querySelector('.switch input');
	        timelineSwitch.addEventListener('click', e => {
	            let ls = JSON.parse(localStorage.getItem('layerState'));
	            let layers = _activeView.container.querySelectorAll('.rc_content li table');
	            for (let i = 0; i < layers.length; ++i) {
	        //console.log(layers[i].id, nsGmx.gmxMap.layersByID[layers[i].id.replace(/^layer/, '')]._gmx)
	                let lid = layers[i].id.replace(/^layer/, ''),
	                props = nsGmx.gmxMap.layersByID[lid]._gmx && nsGmx.gmxMap.layersByID[lid]._gmx.properties;
	                if (layers[i].getBoundingClientRect().width) 
	                    if (nsGmx.timeLineControl && props && props.Temporal && (props.IsRasterCatalog || (props.Quicklook && props.Quicklook !== 'null')))               
	                    if (timelineSwitch.checked)
	                        _toggleTimeline(lid, true);
	                    else
	                        _toggleTimeline(lid, false);
	            }
	        })
	        */
	
	        var gs = localStorage.getItem('groupState'),
	            activGroup = !gs ? 0 : groups.indexOf(gs) + 1;
	        var select = new SelectControl(_instruments.querySelector('.rc_filter'), [_gtxt('RasterCatalog.all')].concat(groups), activGroup, _activeView.filter.bind(_activeView));
	
	        _views.forEach(function (v, i) {
	            v.instruments = _instruments;
	            _canvas.append(v.frame);
	        });
	
	        _activeView && _activeView.show();
	    };
	
	    var _returnInstance = {
	        create: function create(sidebarPane) {
	            this.sidebarPane = sidebarPane;
	            _create.call(this);
	            _addCalendar.call(this);
	        },
	        show: function show() {
	            if (!_isReady) {
	                //_create.call(this);
	                _views.forEach(function (v, i) {
	                    v.resize();
	                });
	                _isReady = true;
	            }
	            //_activeView && _activeView.show();
	        }
	    };
	    return _returnInstance;
	};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(7);
	
	module.exports = function (container, options, active, callback) {
	    var _isOptionsDisplayed = false,
	        _select = document.createElement('div'),
	        _optionsList = document.createElement('div'),
	        _selected = active;
	
	    _select.className = 'rc_select';
	    _select.innerHTML = '<span class="group_name">' + options[active] + '</span><span class="icon-down-open"></span>';
	    _optionsList.className = 'rc_groups_list';
	    _optionsList.innerHTML = options.map(function (o, i) {
	        return '<div class="rc_group" id="' + i + '">' + o + '</div>';
	    }).join('');
	
	    container.append(_select);
	    document.body.append(_optionsList);
	
	    var _arrow = _select.querySelector('.icon-down-open'),
	        _options = _optionsList.querySelectorAll('.rc_group'),
	        _hideOptions = function _hideOptions() {
	        _optionsList.style.display = 'none';
	        _optionsList.querySelectorAll('.rc_group')[_selected].classList.remove('selected');
	        _arrow.classList.remove('icon-up-open');
	        _arrow.classList.add('icon-down-open');
	        _isOptionsDisplayed = false;
	    };
	
	    var _setOptionsRect = function _setOptionsRect() {
	        var selectedRc = _select.getBoundingClientRect(),
	            bw = parseInt(getComputedStyle(_optionsList).borderWidth);
	        if (isNaN(bw)) bw = 0;
	        _optionsList.style.width = selectedRc.width - 2 * bw + "px";
	        _optionsList.style.top = selectedRc.bottom - 3 + "px";
	        _optionsList.style.left = selectedRc.left + "px";
	    };
	
	    for (var i = 0; i < _options.length; ++i) {
	        _options[i].addEventListener('click', function (e) {
	            _hideOptions();
	            _selected = parseInt(e.srcElement.id);
	            _select.querySelector('.group_name').innerHTML = options[_selected];
	            callback(_selected);
	        });
	    }_optionsList.addEventListener('mouseleave', function (e) {
	        _hideOptions();
	    });
	    _select.addEventListener('click', function (e) {
	        //console.log(_isOptionsDisplayed)
	        if (_isOptionsDisplayed) {
	            _hideOptions();
	        } else {
	            _setOptionsRect();
	            _optionsList.style.display = 'block';
	            _optionsList.querySelectorAll('.rc_group')[_selected].classList.add('selected');
	            _arrow.classList.remove('icon-down-open');
	            _arrow.classList.add('icon-up-open');
	            _isOptionsDisplayed = true;
	        }
	    });
	};

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var RcView = __webpack_require__(9),
	    RcModel = __webpack_require__(12);
	
	module.exports = function (options) {
	    var _m = new RcModel(options);
	    return {
	        create: function create() {
	            return [new RcView(_m, 'first')];
	        }
	    };
	};

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(10);
	var RcBaseView = __webpack_require__(11);
	var Constants = __webpack_require__(4);
	var RcView = function RcView(model, vid) {
	    RcBaseView.call(this, model);
	    //this.topOffset = 80;
	    Object.defineProperty(this, 'topOffset', { get: function get() {
	            return document.querySelector('.rc_instruments').getBoundingClientRect().height;
	        } });
	    this.frame = document.createElement('div');
	    this.frame.className = 'rc_view';
	    this.frame.classList.add(vid);
	    this.frame.innerHTML = '<div class="rc_all">\n    <div><ul class="rc_content"><li><div><div></li></ul></div>    \n    </div>';
	
	    this.container = this.frame.querySelector('.rc_all');
	
	    this.tableTemplate = '{{#if msg}}<div>{{msg}}</div>{{/if}}' + '<ul class="rc_content">{{#each groups}}' + '<li class="rc_layer_group"><ul><div class="rc_group_name">{{name}}</div>' + '{{#each layers}}' + '<li class="rc_layer"><table id="layer{{id}}"><tr><td class="timeline-icon"></td>' + '<td class="visibility"><img src="' + Constants.MODULE_PATH + 'img/unchecked.png"><img src="' + Constants.MODULE_PATH + 'img/checked.png"></td>' + '<td>{{title}}</td></tr><tr><td></td><td></td><td class="rc_layer_desc">{{{description}}}</td></tr></table></li>' + '{{/each}}</ul></li>' + '{{/each}}</ul>';
	
	    var handler = function handler(e) {
	        var ls = JSON.parse(localStorage.getItem('layerState'));
	        if (!ls) ls = {};
	        if (!ls[e.layerID]) ls[e.layerID] = {};
	        if (!ls[e.layerID].timeline) {
	            ls[e.layerID].timeline = true;
	
	            var checkTimeline = true,
	                layers = this.container.querySelectorAll('table');
	            for (var i = 0; i < layers.length; ++i) {
	                var lid = layers[i].id.replace(/^layer/, ''),
	
	                //console.log(ls[lid])
	                props = nsGmx.gmxMap.layersByID[lid]._gmx && nsGmx.gmxMap.layersByID[lid]._gmx.properties;
	                if (props && props.Temporal && (props.IsRasterCatalog || props.Quicklook && props.Quicklook !== 'null')) if ((!ls[lid] || !ls[lid].timeline) && layers[i].getBoundingClientRect().width) {
	                    checkTimeline = false;
	                    break;
	                }
	            }
	            /* 
	            if (checkTimeline)
	                this.instruments.querySelector('.switch input').checked = 1;
	            */
	        } else {
	            ls[e.layerID].timeline = false;
	            /* 
	            if (this.container.querySelector('#layer' + e.layerID).getBoundingClientRect().width)
	                this.instruments.querySelector('.switch input').checked = 0;
	            */
	        }
	        localStorage.setItem('layerState', JSON.stringify(ls));
	    };
	    nsGmx.timeLineControl.on('layerAdd', handler.bind(this));
	    nsGmx.timeLineControl.on('layerRemove', handler.bind(this));
	};
	
	RcView.prototype = Object.create(RcBaseView.prototype);
	
	RcView.prototype.inProgress = function (state) {
	    if (state) {
	        this.frame.style.background = 'url(\'img/progress.gif\') center no-repeat';
	    } else {
	        this.frame.style.backgroundImage = 'none';
	    }
	};
	
	var toggleTimeline = function toggleTimeline(layerID, add) {
	    var tlc = nsGmx.timeLineControl,
	        layer = nsGmx.gmxMap.layersByID[layerID];
	    if (add) {
	        if (!tlc._map) {
	            nsGmx.leafletMap.addControl(tlc);
	        }
	        tlc.addLayer(layer);
	    } else {
	        if (tlc._map) tlc.removeLayer(layer);
	    }
	};
	
	RcView.prototype.filter = function (n) {
	    var groups = this.container.querySelectorAll('.rc_content .rc_layer_group'),
	        temp = localStorage.getItem('layerState'),
	        layerState = JSON.parse(temp);
	    var checkTimeline = true;
	    for (var i = 0; i < groups.length; ++i) {
	        var group = groups[i].querySelector('.rc_group_name'),
	            groupID = group.innerText,
	            layers = groups[i].querySelectorAll('table');
	        if (0 == n) localStorage.removeItem('groupState');
	        if (i + 1 == n) localStorage.setItem('groupState', groupID);
	
	        if (n == 0 || i + 1 == n) {
	            groups[i].style.display = 'block';
	
	            for (var j = 0; j < layers.length; ++j) {
	                var lid = layers[j].id.replace(/^layer/, '');
	                //console.log(layers[j].id, layerState[lid])
	                if (layerState && layerState[lid]) {
	                    if (layerState[lid].visible) nsGmx.leafletMap.addLayer(nsGmx.gmxMap.layersByID[lid]);
	                    if (layerState[lid].timeline) toggleTimeline(lid, true);else checkTimeline = false;
	                } else {
	                    var props = nsGmx.gmxMap.layersByID[lid]._gmx && nsGmx.gmxMap.layersByID[lid]._gmx.properties;
	                    if (props && props.Temporal && (props.IsRasterCatalog || props.Quicklook && props.Quicklook !== 'null')) checkTimeline = false;
	                }
	            }
	        } else {
	            for (var _j = 0; _j < layers.length; ++_j) {
	                var _lid = layers[_j].id.replace(/^layer/, '');
	                nsGmx.leafletMap.removeLayer(nsGmx.gmxMap.layersByID[_lid]);
	                toggleTimeline(_lid, false);
	            }
	            groups[i].style.display = 'none';
	        }
	    }
	    localStorage.setItem('layerState', temp);
	    /*
	    this.instruments.querySelector('.switch input').checked = groups.length && checkTimeline ? 1 : 0;
	    */
	};
	
	var last = void 0,
	    setVisibility = function setVisibility(e) {
	    //console.log(e.target.getGmxProperties().name, e.type);
	    var lid = e.target.getGmxProperties().name; //e.target.options.layerID;   
	    if (last == lid) {
	        last = null;
	        return;
	    }
	    last = lid;
	    var ls = JSON.parse(localStorage.getItem('layerState'));
	    if (!ls) ls = {};
	    if (!ls[lid]) ls[lid] = {};
	    var cb = document.querySelectorAll('.rc_view #layer' + lid + ' .visibility img');
	    //console.log(lid, nsGmx.gmxMap.layersByID[lid], nsGmx.gmxMap.layersByID[lid]._map)
	    if (e.type == 'add') {
	        //nsGmx.gmxMap.layersByID[lid]._map
	        ls[lid].visible = true;
	        cb[0].style.display = 'none';
	        cb[1].style.display = 'inline';
	    } else {
	        ls[lid].visible = false;
	        cb[0].style.display = 'inline';
	        cb[1].style.display = 'none';
	    }
	    localStorage.setItem('layerState', JSON.stringify(ls));
	};
	
	RcView.prototype.repaint = function () {
	    var _this = this;
	
	    RcBaseView.prototype.repaint.apply(this, arguments);
	
	    var nl = this.container.querySelectorAll('.rc_content li table'),
	        groupState = localStorage.getItem('groupState');
	    //console.log(groupState);
	
	    var _loop = function _loop(i) {
	        var cb = nl[i].querySelectorAll('.visibility img'),
	            lid = nl[i].id.replace(/^layer/, '');
	
	        nsGmx.gmxMap.layersByID[lid].on('add', setVisibility.bind(_this));
	        nsGmx.gmxMap.layersByID[lid].on('remove', setVisibility.bind(_this));
	
	        cb[1].style.display = 'none';
	
	        cb[0].addEventListener('click', function (e) {
	            cb[0].style.display = 'none';
	            cb[1].style.display = 'inline';
	            nsGmx.leafletMap.addLayer(nsGmx.gmxMap.layersByID[lid]);
	        });
	        cb[1].addEventListener('click', function (e) {
	            cb[0].style.display = 'inline';
	            cb[1].style.display = 'none';
	            nsGmx.leafletMap.removeLayer(nsGmx.gmxMap.layersByID[lid]);
	        });
	    };
	
	    for (var i = 0; i < nl.length; ++i) {
	        _loop(i);
	    }
	
	    if (groupState) {
	        nl = this.container.querySelectorAll('.rc_content .rc_group_name');
	        for (var i = 0; i < nl.length; ++i) {
	            if (nl[i].innerText == groupState) {
	                this.filter(i + 1);
	                break;
	            }
	        }
	    } else this.filter(0);
	};
	
	module.exports = RcView;

/***/ }),
/* 10 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 11 */
/***/ (function(module, exports) {

	'use strict';
	
	var _calcHeight = function _calcHeight() {
	    var H = $('.iconSidebarControl-pane').height() - this.topOffset;
	    return H;
	};
	
	var BaseView = function BaseView(model) {
	    model.view = this;
	    this.model = model;
	    this.gifLoader = '<img src="img/progress.gif">';
	};
	
	var _clean = function _clean() {
	    var scrollCont = $(this.container).find('.mCSB_container');
	    if (scrollCont[0]) scrollCont.empty();else $(this.container).empty();
	    //console.log("EMPTY ON BASE.CLEAN")
	};
	
	BaseView.prototype = function () {
	    return {
	        get isActive() {
	            var rc = this.frame.getBoundingClientRect();
	            return rc.width == 0 && rc.height == 0;
	        },
	        resize: function resize(clean) {
	            var h = _calcHeight.call(this);
	            if (this.startScreen) {
	                this.startScreen.height(h);
	                $(this.container).css({ position: "relative", top: -h + "px" });
	            }
	            $(this.container).height(h);
	
	            if (clean) {
	                $(this.container).empty();
	            }
	        },
	        repaint: function repaint() {
	            _clean.call(this);
	            if (!this.model.data) return;
	            var scrollCont = $(this.container).find('.mCSB_container'),
	                content = $(Handlebars.compile(this.tableTemplate)(this.model.data));
	            if (!scrollCont[0]) {
	                $(this.container).append(content).mCustomScrollbar();
	            } else {
	                $(scrollCont).append(content);
	            }
	        },
	        show: function show() {
	            this.frame.style.display = 'block';
	            this.model.update();
	        },
	        hide: function hide() {
	            this.frame.style.display = 'none';
	        }
	    };
	}();
	
	module.exports = BaseView;

/***/ }),
/* 12 */
/***/ (function(module, exports) {

	'use strict';
	
	var DEFAULT_VECTOR_LAYER_ZINDEXOFFSET = 2000000;
	module.exports = function (_ref) {
	    var groups = _ref.groups,
	        layers = _ref.layers;
	
	    var _layers = [],
	        _data = { groups: [] };
	    groups.forEach(function (g, i) {
	        _layers.push({ group: g, members: layers[i] });
	    });
	
	    var _serverUrl = document.location.protocol + window.serverBase.replace(/^[^:]+:/, '');
	    var _addLayer = function _addLayer(layer) {
	        var currentZoom = nsGmx.leafletMap.getZoom();
	        function updateZIndex(layer) {
	            var props = layer.getGmxProperties();
	            switch (nsGmx.gmxMap.rawTree.properties.LayerOrder) {
	                case 'VectorOnTop':
	                    if (props.type === 'Vector') {
	                        if (props.IsRasterCatalog) {
	                            var rcMinZoom = props.RCMinZoomForRasters;
	                            layer.setZIndexOffset(currentZoom < rcMinZoom ? DEFAULT_VECTOR_LAYER_ZINDEXOFFSET : 0);
	                        } else {
	                            layer.setZIndexOffset(DEFAULT_VECTOR_LAYER_ZINDEXOFFSET);
	                        }
	                    }
	                    break;
	            }
	        }
	
	        var name = layer.properties.name;
	
	        // hack to avoid API defaults by initFromDescription;
	        var propsHostName = window.serverBase.replace(/https?:\/\//, '');
	        propsHostName = propsHostName.replace(/\//g, '');
	
	        layer.properties.mapName = nsGmx.gmxMap.properties.MapID;
	        layer.properties.hostName = propsHostName;
	
	        if (!nsGmx.gmxMap.layersByID[name]) {
	            var visibility = typeof layer.properties.visible != 'undefined' ? layer.properties.visible : false,
	                rcMinZoom = layer.properties.RCMinZoomForRasters,
	                layerOnMap = L.gmx.createLayer(layer, {
	                layerID: name,
	                hostName: propsHostName,
	                zIndexOffset: null,
	                srs: nsGmx.leafletMap.options.srs || '',
	                skipTiles: nsGmx.leafletMap.options.skipTiles || '',
	                isGeneralized: window.mapOptions && 'isGeneralized' in window.mapOptions ? window.mapOptions.isGeneralized : true
	            });
	
	            updateZIndex(layerOnMap);
	            nsGmx.gmxMap.addLayer(layerOnMap);
	
	            //nsGmx.leafletMap.addLayer(layerOnMap);
	
	            //layerOnMap.getGmxProperties().changedByViewer = true;
	
	            nsGmx.leafletMap.on('zoomend', function (e) {
	                currentZoom = nsGmx.leafletMap.getZoom();
	
	                for (var l = 0; l < nsGmx.gmxMap.layers.length; l++) {
	                    var layer = nsGmx.gmxMap.layers[l];
	
	                    updateZIndex(layer);
	                }
	            });
	            return layerOnMap;
	        }
	    };
	
	    return {
	        isDirty: true,
	        get data() {
	            return _data;
	        },
	        load: function load(actualUpdate) {
	            return Promise.all(_layers.map(function (l) {
	                var a = l.members.map(function (m) {
	                    return new Promise(function (resolve, reject) {
	                        sendCrossDomainJSONRequest(_serverUrl + 'Layer/GetLayerJson.ashx?NeedAttrValues=false&LayerName=' + m, function (response) {
	                            if (response.Status && response.Status.toLowerCase() == 'ok') resolve(response);else reject(response);
	                        });
	                    });
	                });
	                a.push(Promise.resolve({ groupName: l.group }));
	                return Promise.all(a);
	            }));
	        },
	        update: function update() {
	            var _this = this;
	
	            if (this.isDirty) {
	                this.view.inProgress(true);
	                this.load().then(function (groups) {
	                    //console.log(groups)                    
	                    groups.forEach(function (responses) {
	                        var group = { layers: [] };
	                        responses.forEach(function (response) {
	                            if (response.Result) {
	                                var props = response.Result.properties;
	                                _addLayer(response.Result);
	                                var layerAttr = {
	                                    id: props.LayerID,
	                                    description: props.description,
	                                    title: props.title
	                                };
	                                if (nsGmx.timeLineControl && props.Temporal && (props.IsRasterCatalog || props.Quicklook && props.Quicklook !== 'null')) layerAttr.timelineIcon = window._layersTree.CreateTimelineIcon({ name: props.LayerID });
	                                group.layers.push(layerAttr);
	                            } else group.name = response.groupName;
	                        });
	                        _data.groups.push(group);
	                    });
	                    //console.log(_data)
	                    _this.view.inProgress(false);
	                    _this.view.repaint();
	
	                    _data.groups.forEach(function (g) {
	                        g.layers.forEach(function (l) {
	                            if (l.timelineIcon) document.querySelector('#layer' + l.id + ' .timeline-icon').append(l.timelineIcon);
	                        });
	                    });
	
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
//# sourceMappingURL=RasterCatalogPlugin.js.map