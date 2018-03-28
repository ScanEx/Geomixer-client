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
	
	var NOSIDEBAR = false,
	    PRODUCTION = false,
	    SIDEBAR2 = false;
	if (false) NOSIDEBAR = true;
	if (true) SIDEBAR2 = true;
	if (false) PRODUCTION = true;
	
	__webpack_require__(1);
	__webpack_require__(3);
	__webpack_require__(4);
	
	Handlebars.registerHelper('aisinfoid', function (context) {
	    return context.mmsi + " " + context.imo;
	});
	
	Handlebars.registerHelper('aisjson', function (context) {
	    return JSON.stringify(context);
	});
	
	var pluginName = PRODUCTION ? 'AISSearch2' : 'AISSearch2Test',
	    menuId = 'AISSearch',
	    toolbarIconId = null,
	    //'AISSearch2',
	cssTable = 'AISSearch2',
	    modulePath = gmxCore.getModulePath(pluginName);
	
	var highlight = L.marker([0, 0], { icon: L.icon({
	        className: "ais_highlight-icon",
	        iconAnchor: [12, 12],
	        iconSize: [25, 25],
	        iconUrl: 'plugins/ais/aissearch/highlight.png' }), zIndexOffset: 1000 });
	
	var AisPluginPanel = __webpack_require__(5),
	    ViewsFactory = __webpack_require__(6);
	var publicInterface = {
	    pluginName: pluginName,
	    afterViewer: function afterViewer(params, map) {
	        var options = {
	            aisLayerID: params.aisLayerID, // || '8EE2C7996800458AAF70BABB43321FA4',	// searchById			
	            screenSearchLayer: params.searchLayer, // || '8EE2C7996800458AAF70BABB43321FA4', // screen search				
	            aisLastPoint: params.aisLastPoint || '303F8834DEE2449DAF1DA9CD64B748FE', // db search
	            historyLayer: params.historyLayer,
	            tracksLayerID: params.tracksLayerID || '13E2051DFEE04EEF997DC5733BD69A15',
	
	            modulePath: modulePath,
	            highlight: highlight
	        };
	        for (var key in params) {
	            if (key.toLowerCase() == "myfleet") {
	                options.myFleetLayers = params[key].split(",").map(function (id) {
	                    return id.replace(/\s/, "");
	                });
	                break;
	            }
	        }var viewFactory = new ViewsFactory(options);
	        // const setLocaleDate = function (layer) {
	        //     if (layer)
	        //         layer.bindPopup('').on('popupopen', function (e) {
	        //             //console.log(e);
	
	        //             var result, re = /\[([^\[\]]+)\]/g, lastIndex = 0, template = "",
	        //                 str = e.gmx.templateBalloon, props = e.gmx.properties;
	        //             while ((result = re.exec(str)) !== null) {
	        //                 template += str.substring(lastIndex, result.index);
	        //                 if (props.hasOwnProperty(result[1]))
	        //                     if (result[1].search(/^ts_pos_utc/i) != -1) {
	        //                         template += aisLayerSearcher.formatDate(new Date(props[result[1]] * 1000))
	        //                     }
	        //                     else if (result[1].search(/^Date/i) != -1) {
	        //                         template += aisLayerSearcher.formatDate(new Date(props[result[1]] * 1000)).replace(/ .+/, "")
	        //                     }
	        //                     else
	        //                         template += props[result[1]]
	        //                 if (result[1].search(/summary/i) != -1) {
	        //                     template += e.gmx.summary
	        //                 }
	        //                 //console.log(lastIndex+", "+result.index+" "+str.substring(lastIndex, result.index)+" "+props[result[1]]+" "+result[1])
	        //                 lastIndex = re.lastIndex;
	        //             }
	        //             template += str.substring(lastIndex);
	        //             //console.log(lastIndex+", "+re.lastIndex+" "+str.substring(lastIndex))
	        //             e.popup.setContent(template);
	        //         })
	        //     },
	        var layersByID = nsGmx.gmxMap.layersByID,
	            setLayerClickHandler = function setLayerClickHandler(layer) {
	            layer.removeEventListener('click');
	            layer.addEventListener('click', function (e) {
	                //console.log(e)
	                if (e.gmx && e.gmx.properties.hasOwnProperty("imo")) viewFactory.infoDialogView.show(e.gmx.properties);
	            });
	        },
	            forLayers = function forLayers(layer) {
	            if (layer) {
	                //setLocaleDate(layer)
	                setLayerClickHandler(layer);
	            }
	        };
	
	        for (var key in params) {
	            var layersId = params[key].split(",").map(function (id) {
	                return id.replace(/\s/, "");
	            });
	            for (var i = 0; i < layersId.length; ++i) {
	                //console.log(layersId[i])
	                forLayers(layersByID[layersId[i]]);
	            }
	        }
	
	        var aisPluginPanel = new AisPluginPanel(viewFactory);
	        aisPluginPanel.menuId = menuId;
	
	        if (NOSIDEBAR) {
	            var lmap = nsGmx.leafletMap,
	                iconOpt_mf = {
	                id: menuId, //toolbarIconId,
	                className: "VesselSearchTool",
	                togglable: true,
	                title: _gtxt('AISSearch2.caption')
	            };
	            if (toolbarIconId) iconOpt_mf.id = toolbarIconId;else iconOpt_mf.text = _gtxt('AISSearch2.capShort');
	            var icon_mf = L.control.gmxIcon(iconOpt_mf).on('statechange', function (ev) {
	                if (ev.target.options.isActive) {
	                    aisPluginPanel.show();
	                    $('.ais_view .instruments').width('100%');
	                    $('.ais_tab div').css('font-size', '12px');
	                } else {
	                    aisPluginPanel.hide();
	                }
	            });
	            lmap.addControl(icon_mf);
	        } else {
	            var sidebar = SIDEBAR2 ? window.iconSidebarWidget : window.sidebarControl;
	            aisPluginPanel.sidebarPane = sidebar.setPane(menuId, { createTab: window.createTabFunction({
	                    icon: menuId,
	                    active: "ais_sidebar-icon-active",
	                    inactive: "ais_sidebar-icon",
	                    hint: _gtxt('AISSearch2.caption')
	                })
	            });
	            sidebar.on('opened', function (e) {
	                if (e.id == menuId) aisPluginPanel.show();
	            });
	        }
	
	        if (location.search.search(/x=[^y=]+y=/i) != -1) {
	            var a = location.search.toLowerCase().substr(1).split('&'),
	                x = a.filter(function (c) {
	                return !c.indexOf("x=");
	            })[0].substr(2),
	                y = a.filter(function (c) {
	                return !c.indexOf("y=");
	            })[0].substr(2);
	            highlight.vessel = null;
	            highlight.setLatLng([y, x]).addTo(nsGmx.leafletMap);
	            nsGmx.leafletMap.fitBounds([[y, x], [y, x]], {
	                maxZoom: 9, //config.user.searchZoom,
	                animate: false
	            });
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

	// removed by extract-text-webpack-plugin

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	'use strict';
	
	_translationsHash.addtext('rus', {
	    'AISSearch2.title': 'Поиск судов',
	    'AISSearch2.title1': 'Найдено судов',
	    'AISSearch2.title2': '<b>Данных не найдено!</b>',
	    'AISSearch2.error': '<b>Ошибка при получении данных!</b>',
	    'AISSearch2.iconTitle': 'Поиск судов по экрану',
	    'AISSearch2.placeholder_0': 'Поиск по адресам, координатам',
	    'AISSearch2.placeholder_1': 'Поиск судна по названию / MMSI',
	    // 'AISSearch2.placeholder_1': 'Поиск судна по названию / MMSI. Поиск по адресам, координатам, кадастровым номерам'
	    'AISSearch2.myFleetDialog': 'Мой флот',
	    'AISSearch2.vesselName': 'название',
	    'AISSearch2.vesselAdd': 'добавить',
	    'AISSearch2.vesselRemove': 'удалить',
	    'AISSearch2.myFleetMembers': 'Состав',
	    'AISSearch2.myFleetMember': 'мой флот',
	    'AISSearch2.info': 'информация',
	    'AISSearch2.found': 'Найдено: ',
	    'AISSearch2.filter': 'Введите название или mmsi или imo судна',
	    'AISSearch2.filterName': 'Введите название судна',
	    'AISSearch2.screen': 'По экрану',
	    'AISSearch2.database': 'По базе данных',
	    'AISSearch2.capShort': 'Поиск судов',
	    'AISSearch2.caption': 'Поиск судов и "Мой флот"',
	    'AISSearch2.refresh': 'обновить',
	    'AISSearch2.refreshing': 'обновляется',
	    'AISSearch2.nomyfleet': 'Сервис не доступен',
	    'AISSearch2.auth': 'Требуется авторизация',
	    'AISSearch2.vessel_name': 'Название',
	    'AISSearch2.mmsi': 'MMSI',
	    'AISSearch2.imo': 'IMO',
	    'AISSearch2.flag_country': 'Страна',
	    'AISSearch2.vessel_type': 'Тип судна',
	    'AISSearch2.draught': 'Осадка',
	    'AISSearch2.destination': 'Назначение',
	    'AISSearch2.nav_status': 'Статус',
	    'AISSearch2.last_sig': 'Последний сигнал',
	    'AISSearch2.show_track': 'трек за сутки',
	    'AISSearch2.hide_track': 'скрыть трек',
	    'AISSearch2.source': 'Источник данных',
	    'AISSearch2.sais': 'спутниковый AIS',
	    'AISSearch2.tais': 'береговой AIS',
	    'AISSearch2.lon': 'Долгота',
	    'AISSearch2.lat': 'Широта',
	    'AISSearch2.historyTab': 'История',
	    'AISSearch2.voyageInfo': 'Параметры движения',
	    'AISSearch2.DbSearchTab': 'БАЗА ДАННЫХ',
	    'AISSearch2.ScreenSearchTab': 'СУДА НА ЭКРАНЕ',
	    'AISSearch2.MyFleetTab': 'МОЙ ФЛОТ'
	});
	_translationsHash.addtext('eng', {
	    'AISSearch2.title': 'Searching vessels',
	    'AISSearch2.title1': 'Vessels found',
	    'AISSearch2.title2': '<b>Vessels not found!</b>',
	    'AISSearch2.error': '<b>Vessels not found!</b>',
	    'AISSearch2.iconTitle': 'Search vessels within the view area',
	    'AISSearch2.placeholder_0': 'Search for addresses, coordinates',
	    'AISSearch2.placeholder_1': 'Search by vessel name / MMSI',
	    // 'AISSearch2.placeholder_1' : 'Search by vessel name / MMSI. Search by addresses, coordinates, cadastre number'
	    'AISSearch2.myFleetDialog': 'My fleet',
	    'AISSearch2.vesselName': 'name',
	    'AISSearch2.vesselAdd': 'add',
	    'AISSearch2.vesselRemove': 'remove',
	    'AISSearch2.myFleetMembers': 'Members',
	    'AISSearch2.myFleetMember': 'my fleet',
	    'AISSearch2.info': 'info',
	    'AISSearch2.found': 'Found ',
	    'AISSearch2.filter': 'Insert vessel name or mmsi or imo',
	    'AISSearch2.filterName': 'Insert vessel name',
	    'AISSearch2.screen': 'On screen',
	    'AISSearch2.database': 'In database',
	    'AISSearch2.capShort': 'Vessel Search',
	    'AISSearch2.caption': 'Vessel Search & My Fleet',
	    'AISSearch2.refresh': 'refresh',
	    'AISSearch2.refreshing': 'refreshing',
	    'AISSearch2.nomyfleet': 'Service is unavailable',
	    'AISSearch2.auth': 'Authorization required',
	    'AISSearch2.vessel_name': 'Name',
	    'AISSearch2.mmsi': 'MMSI',
	    'AISSearch2.imo': 'IMO',
	    'AISSearch2.flag_country': 'Flag',
	    'AISSearch2.vessel_type': 'Vessel type',
	    'AISSearch2.draught': 'Draught',
	    'AISSearch2.destination': 'Destination',
	    'AISSearch2.nav_status': 'Navigation status',
	    'AISSearch2.last_sig': 'Last signal',
	    'AISSearch2.show_track': 'show track',
	    'AISSearch2.hide_track': 'hide track',
	    'AISSearch2.source': 'Source',
	    'AISSearch2.sais': 'S-AIS',
	    'AISSearch2.tais': 'T-AIS',
	    'AISSearch2.lon': 'Longitude',
	    'AISSearch2.lat': 'Latitude',
	    'AISSearch2.historyTab': 'History',
	    'AISSearch2.voyageInfo': 'Voyage info',
	    'AISSearch2.DbSearchTab': 'DATA BASE',
	    'AISSearch2.ScreenSearchTab': 'VESSELS ON SCREEN',
	    'AISSearch2.MyFleetTab': 'MY FLEET'
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
	if (false) PRODUCTION = true;
	
	module.exports = function (viewFactory) {
	    var _leftMenuBlock = void 0,
	        _canvas = _div(null),
	        _activeView = void 0,
	        _views = viewFactory.create(),
	
	    // _aisSearchView,
	    // _myFleetMembersView,
	    // _historyView,
	    //_gifLoader = '<img src="img/progress.gif">',
	    _isReady = false,
	        _createTabs = function _createTabs() {
	        var tabsTemplate = '<table class="ais_tabs" border=0><tr>' + '<td class="ais_tab dbsearch_tab unselectable" unselectable="on">' + '<div>{{i "AISSearch2.DbSearchTab"}}</div>' + '</td><td class="ais_tab scrsearch_tab unselectable" unselectable="on">' + '<div>{{i "AISSearch2.ScreenSearchTab"}}</div>' + '</td><td class="ais_tab myfleet_tab unselectable" unselectable="on">' + // ACTIVE
	        '<div>{{i "AISSearch2.MyFleetTab"}}</div>' + '</td></tr></table>';
	
	        if (NOSIDEBAR) $(_leftMenuBlock.workCanvas).append(_canvas);else $(this.sidebarPane).append(_canvas);
	
	        $(_canvas).append(Handlebars.compile(tabsTemplate));
	        $(_canvas).append(_views.map(function (v) {
	            return v.frame;
	        }));
	
	        var tabs = $('.ais_tab', _canvas),
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
	
	        if (NOSIDEBAR) {
	            _returnInstance.hide = function () {
	                $(_leftMenuBlock.parentWorkCanvas).hide();
	                nsGmx.leafletMap.removeLayer(highlight);
	            };
	
	            $(_leftMenuBlock.parentWorkCanvas).attr('class', 'left_aispanel').insertAfter('.layers-before');
	            var blockItem = _leftMenuBlock.leftPanelItem,
	                blockTitle = $('.leftmenu-path', blockItem.panelCanvas);
	            var toggleTitle = function toggleTitle() {
	                if (blockItem.isCollapsed()) blockTitle.show();else blockTitle.hide();
	            };
	            $(blockItem).on('changeVisibility', toggleTitle);
	            toggleTitle();
	        }
	
	        // All has been done at first time
	        _isReady = true;
	    },
	        _returnInstance = {
	        show: function show() {
	            var lmap = nsGmx.leafletMap;
	            if (NOSIDEBAR && !_leftMenuBlock) _leftMenuBlock = new leftMenu();
	
	            if (NOSIDEBAR && !_leftMenuBlock.createWorkCanvas("aispanel", function () {
	                lmap.gmxControlIconManager.get(this.menuId)._iconClick();
	            }, { path: [_gtxt('AISSearch2.caption')] }) || !_isReady) // SIDEBAR
	                {
	                    _createTabs.call(this);
	                } else {
	                if (NOSIDEBAR) {
	                    $(_leftMenuBlock.parentWorkCanvas).insertAfter('.layers-before');
	                }
	                _activeView && _activeView.show();
	            }
	        }
	    };
	    return _returnInstance;
	};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var ScreenSearchView = __webpack_require__(7),
	    ScreenSearchModel = __webpack_require__(9),
	    MyFleetView = __webpack_require__(10),
	    MyFleetModel = __webpack_require__(11),
	    DbSearchView = __webpack_require__(13),
	    DbSearchModel = __webpack_require__(15),
	    InfoDialogView = __webpack_require__(16),
	    Searcher = __webpack_require__(20),
	    Toolbox = __webpack_require__(21);
	
	module.exports = function (options) {
	    var _tools = new Toolbox(options),
	
	    //_layersByID = nsGmx.gmxMap.layersByID,
	    _searcher = new Searcher(options),
	        _mfm = new MyFleetModel({ aisLayerSearcher: _searcher, myFleetLayers: options.myFleetLayers }),
	        _ssm = new ScreenSearchModel({ aisLayerSearcher: _searcher, myFleetModel: _mfm }),
	        _dbsm = new DbSearchModel(_searcher),
	        _dbsv = new DbSearchView({ model: _dbsm, highlight: options.highlight, tools: _tools }),
	        _ssv = new ScreenSearchView(_ssm),
	        _mfv = new MyFleetView(_mfm),
	        _idv = new InfoDialogView({
	        //aisLayer: _layersByID[options.aisLayerID],
	        //tracksLayer: _layersByID[options.tracksLayerID],
	        tools: _tools,
	        aisLayerSearcher: _searcher,
	        modulePath: options.modulePath,
	        //aisPluginPanel: aisPluginPanel,
	        aisView: _dbsv,
	        myFleetMembersView: _mfv
	    });
	    _ssv.infoDialogView = _idv;
	    _mfv.infoDialogView = _idv;
	    return {
	        get infoDialogView() {
	            return _idv;
	        },
	        create: function create() {
	            return [_dbsv, _ssv, _mfv];
	        }
	    };
	};

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var BaseView = __webpack_require__(8);
	var ScreenSearchView = function ScreenSearchView(model) {
	    BaseView.apply(this, arguments);
	    this.topOffset = 180;
	    this.frame = $(Handlebars.compile('<div class="ais_view search_view">' + '<table border=0 class="instruments">' +
	    //'<tr><td colspan="2"><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/><i class="icon-flclose clicable"></div></td></tr>'+
	    '<tr><td><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filterName"}}"/>' + '<div><img class="search clicable" src="plugins/AIS/AISSearch/svg/search.svg">' + '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg">' + '</div></div>' + '<div>&nbsp;</div>' + '</td></tr>' + '</table>' + '<table class="results">' + '<tr><td class="count"></td>' + '<td><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div>' + this.gifLoader + '</div></div></td></tr>' + '</table>' + '<div class="ais_vessels">' + '<div class="ais_vessel">' + '<table border=0><tr><td><div class="position">NO VESSELS</div><div>mmsi: 0 imo: 0</div></td>' + '<td><i class="icon-ship" vessel="" title=""></i></td>' + '<td><span class="date"></span></td>' + '<td><div class="info" vessel="aisjson this" title="i AISSearch2.info">' + '<img src="plugins/AIS/AISSearch/svg/info.svg">' + '</div></td></tr></table>' + '</div>' + '</div>' + '</div>')());
	    this.container = this.frame.find('.ais_vessels');
	    this.tableTemplate = '{{#each vessels}}' + '<div class="ais_vessel">' + '<table border=0><tr><td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' + '<td><i class="icon-ship" vessel="{{aisinfoid this}}" style="{{mf_member}}" title="{{i "AISSearch2.myFleetMember"}}"></i></td>' + '<td><span class="date">{{ts_pos_utc}}</span></td>' + '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">' + '<img src="plugins/AIS/AISSearch/svg/info.svg">' + '</div></td></tr></table>' + '</div>' + '{{/each}}' + '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
	
	    var cleanFilter = this.frame.find('.remove'),
	        filterReady = this.frame.find('.search'),
	        filterInput = this.frame.find('input'),
	        delay = void 0,
	        doFilter = function doFilter() {
	        this.model.setFilter();
	        this.repaint();
	        //console.log("doFilter")
	    };
	    cleanFilter.click(function (e) {
	        if (this.model.filterString === '') return;
	        filterInput.val('');
	        this.model.filterString = '';
	        clearTimeout(delay);
	        doFilter.call(this);
	        //nsGmx.leafletMap.removeLayer(highlight);
	    }.bind(this));
	    filterInput.keyup(function (e) {
	        var _this = this;
	
	        var input = filterInput.val() || "";
	        input = input.replace(/^\s+/, "").replace(/\s+$/, "");
	        if (input === "") {
	            filterReady.show();
	            cleanFilter.hide();
	        } else {
	            cleanFilter.show();
	            filterReady.hide();
	        }
	
	        if (input == this.model.filterString && e.keyCode != 13) return;
	        this.model.filterString = input;
	        if (e.keyCode == 13) this.model.filterString += '\r';
	        clearTimeout(delay);
	        delay = setTimeout(function () {
	            doFilter.call(_this);
	        }.bind(this), 500);
	        //nsGmx.leafletMap.removeLayer(highlight);
	    }.bind(this));
	
	    var needUpdate = function needUpdate() {
	        var _this2 = this;
	
	        this.model.isDirty = true;
	        if (this.container.is(':visible')) {
	
	            clearTimeout(delay);
	            delay = setTimeout(function () {
	                _this2.model.update();
	            }.bind(this), 300);
	        }
	    };
	    nsGmx.leafletMap.on('moveend', needUpdate.bind(this));
	    nsGmx.widgets.commonCalendar.getDateInterval().on('change', needUpdate.bind(this));
	};
	
	ScreenSearchView.prototype = Object.create(BaseView.prototype);
	
	var _clean = function _clean() {
	    this.frame.find('.count').text(_gtxt('AISSearch2.found') + 0);
	    // let scrollCont = this.container.find('.mCSB_container')
	    // if (scrollCont[0])
	    //     scrollCont.empty();
	    // else
	    //     this.container.empty();
	};
	
	ScreenSearchView.prototype.inProgress = function (state) {
	    var progress = this.frame.find('.refresh div');
	    if (state) progress.show();else progress.hide();
	};
	
	ScreenSearchView.prototype.repaint = function () {
	    _clean.call(this);
	    this.frame.find('.count').text(_gtxt('AISSearch2.found') + this.model.data.vessels.length);
	    BaseView.prototype.repaint.apply(this, arguments);
	};
	
	ScreenSearchView.prototype.show = function () {
	    BaseView.prototype.show.apply(this, arguments);
	    this.frame.find('.filter input').focus();
	};
	
	/*
	ScreenSearchView.prototype.hide = function () {
	//console.log('hide ScreenSearchView')
	    BaseView.prototype.hide.apply(this, arguments);
	};
	*/
	module.exports = ScreenSearchView;

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var NOSIDEBAR = false,
	    PRODUCTION = false,
	    SIDEBAR2 = false;
	if (false) NOSIDEBAR = true;
	if (true) SIDEBAR2 = true;
	if (false) PRODUCTION = true;
	
	var _calcHeight = function _calcHeight() {
	    var template = this.frame.find('.ais_vessel')[0] || this.frame.find('.ais_positions_date')[0],
	        h = template.getBoundingClientRect().height;
	    if (NOSIDEBAR) return h * 5;else {
	        var H = $('.gmx-sidebar-pane').height() - this.topOffset;
	        // console.log(template.getBoundingClientRect())
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
	    if (scrollCont[0]) scrollCont.empty();else this.container.empty();
	};
	
	BaseView.prototype = function () {
	    return {
	        get isActive() {
	            return this.frame.is(":visible");
	        },
	        resize: function resize(clean) {
	            this.container.height(_calcHeight.call(this));
	            if (clean) this.container.empty();
	            /*
	                        // if (this.bindControlEvents)
	                        //     this.bindControlEvents();
	                        if (NOSIDEBAR) {
	                            if ($('.icon-down-dir', this.frame)[0] && $('.icon-down-dir', this.frame).height() == 34)
	                                $('.icon-down-dir', this.frame).css({ position: 'relative', top: '2px' })
	                        }
	                        else {
	                            if (SIDEBAR2) {
	                                if ($('.icon-down-dir', this.frame)[0] && $('.icon-down-dir', this.frame).height() == 34)
	                                    $('.icon-down-dir', this.frame).css({ position: 'relative', top: '2px' })
	                                $('.ais_tab').css({ 'border-top': 'none' })
	                            }
	                            else
	                                $('.icon-down-dir', this.frame).css({ position: 'relative', top: '1px' })
	                        }
	                        */
	        },
	        repaint: function repaint() {
	            _clean.call(this);
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
	                _this.infoDialogView.showPosition(JSON.parse($(this).find('.info').attr('vessel')));
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
	
	module.exports = function (_ref) {
	    var aisLayerSearcher = _ref.aisLayerSearcher,
	        myFleetModel = _ref.myFleetModel;
	
	    var _actualUpdate = void 0;
	    return {
	        filterString: "",
	        isDirty: true,
	        load: function load(actualUpdate) {
	            if (!this.isDirty) {
	                return Promise.resolve();
	            }
	            var _this = this;
	            return Promise.all([new Promise(function (resolve, reject) {
	                aisLayerSearcher.searchScreen({
	                    dateInterval: nsGmx.widgets.commonCalendar.getDateInterval(),
	                    border: true,
	                    group: true
	                }, function (json) {
	                    //console.log(json)
	                    if (json.Status.toLowerCase() == "ok") {
	                        _this.dataSrc = {
	                            vessels: json.Result.values.map(function (v) {
	                                var d = nsGmx.widgets.commonCalendar.getDateInterval().get('dateBegin');
	                                return {
	                                    vessel_name: v[0], mmsi: v[1], imo: v[2], mf_member: 'visibility:hidden',
	                                    ts_pos_utc: aisLayerSearcher.formatDate(d), ts_pos_org: Math.floor(d.getTime() / 1000),
	                                    xmin: v[4], xmax: v[5], ymin: v[6], ymax: v[7], maxid: v[3]
	                                };
	                            })
	                        };
	                        if (_actualUpdate == actualUpdate) {
	                            //console.log("ALL CLEAN")
	                            //console.log("1>"+new Date(_this._actualUpdate))
	                            //console.log("2>"+new Date(actualUpdate))
	                            _this.isDirty = false;
	                        }
	                        resolve();
	                    } else {
	                        reject(json);
	                    }
	                });
	            }), myFleetModel.load()]);
	        },
	        setFilter: function setFilter() {
	            var _this2 = this;
	
	            this.filterString = this.filterString.replace(/\r+$/, "");
	            if (this.dataSrc) if (this.filterString != "") {
	                this.data = {
	                    vessels: this.dataSrc.vessels.filter(function (v) {
	                        return v.vessel_name.search(new RegExp("\\b" + _this2.filterString, "ig")) != -1;
	                    }.bind(this))
	                };
	            } else {
	                this.data = { vessels: this.dataSrc.vessels.map(function (v) {
	                        return v;
	                    }) };
	            }
	        },
	        update: function update() {
	
	            if (!this.isDirty) return;
	            _actualUpdate = new Date().getTime();
	            var _this = this,
	                actualUpdate = _actualUpdate;
	            this.view.inProgress(true);
	            //this.filterString&&console.log(this.filterString+" "+this.filterString.search(/\r$/))
	            //this.filterString&&console.log(this.filterString.replace(/^\s+/, "").replace(/\s+\r*$/, "")!="")            
	
	            this.load(actualUpdate).then(function () {
	                //console.log("LOADED "+(new Date().getTime()-_this._actualUpdate)+"ms")
	                //console.log("3>"+new Date(_this._actualUpdate))
	                //console.log("4>"+new Date(actualUpdate))
	                if (_actualUpdate == actualUpdate) {
	                    _this.setFilter();
	                    if (_this.data) myFleetModel.markMembers(_this.data.vessels);
	                    _this.view.inProgress(false);
	                    _this.view.repaint();
	                }
	            }, function (json) {
	                _this.dataSrc = null;
	                console.log(json);
	                if (json.Status.toLowerCase() == "auth" || json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function (r) {
	                    return r.Status.toLowerCase() == "auth";
	                })) _this.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], vessels: [] };else {
	                    //_this.data = {msg:[{txt:"!!!"}], vessels:[]};
	                    console.log(json);
	                }
	                _this.view.inProgress(false);
	                _this.view.repaint();
	            });
	        }
	    };
	};

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var BaseView = __webpack_require__(8);
	var MyFleetView = function MyFleetView(model) {
	    BaseView.apply(this, arguments);
	    this.topOffset = 80;
	    this.frame = $(Handlebars.compile('<div class="ais_view myfleet_view">' + '<table class="results">' + '<tr><td class="count"></td>' + '<td><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div>' + this.gifLoader + '</div></div></td></tr>' + '</table>' + '<div class="ais_vessels">' + '<div class="ais_vessel">' + '<table border=0><tr><td><div class="position">vessel_name</div><div>mmsi: mmsi imo: imo</div></td>' + '<td><i class="icon-ship" vessel="aisinfoid this" style="visibility:hidden" title="AISSearch2"></i></td>' + '<td><span class="date">ts_pos_utc</span></td>' + '<td><div class="info" vessel="aisjson this" title="i AISSearch2.info">' + '<img src="plugins/AIS/AISSearch/svg/info.svg">' + '<div></td></tr></table>' + '</div>' + '</div>' + '</div>')());
	    this.container = this.frame.find('.ais_vessels');
	    this.tableTemplate = '{{#each vessels}}' + '<div class="ais_vessel">' + '<table border=0><tr><td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' + '<td><i class="icon-ship" vessel="{{aisinfoid this}}" style="visibility:hidden" title="{{i "AISSearch2.myFleetMember"}}"></i></td>' + '<td><span class="date">{{dt_pos_utc}}</span></td>' + '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">' + '<img src="plugins/AIS/AISSearch/svg/info.svg">' + '<div></td></tr></table>' + '</div>' + '{{/each}}' + '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
	};
	
	MyFleetView.prototype = Object.create(BaseView.prototype);
	
	// let _clean = function(){ 
	//     //this.frame.find('.count').text(_gtxt('AISSearch2.found') + 0); 
	//     let scrollCont = this.container.find('.mCSB_container')
	//     if (scrollCont[0])
	//         scrollCont.empty();
	//     else
	//         this.container.empty();
	// };
	
	MyFleetView.prototype.inProgress = function (state) {
	    var progress = this.frame.find('.refresh div');
	    if (state) progress.show();else progress.hide();
	};
	
	/*
	MyFleetView.prototype.repaint = function () {
	    _clean.call(this);  
	    BaseView.prototype.repaint.apply(this, arguments);
	};
	
	MyFleetView.prototype.show = function (){ 
	//console.log('show MyFleetView')
	    BaseView.prototype.show.apply(this, arguments);
	};
	MyFleetView.prototype.hide = function (){   
	//console.log('hide MyFleetView')
	    BaseView.prototype.hide.apply(this, arguments);
	};
	*/
	module.exports = MyFleetView;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var Polyfill = __webpack_require__(12);
	module.exports = function (_ref) {
	    var aisLayerSearcher = _ref.aisLayerSearcher,
	        myFleetLayers = _ref.myFleetLayers;
	
	    var _actualUpdate = void 0,
	        _parseFilter = function _parseFilter(filter) {
	        var vessels = [];
	        var attributes = filter.toLowerCase().replace(/and \[ts_pos_utc\].+$/, "").split("or");
	        //console.log(attributes);
	        var myRe = /\[*([^\[\]=]+)\]*=([^ \)]+)\)? *\)?( |$)/ig;
	        var myArray;
	        for (var i = 0; i < attributes.length; ++i) {
	            var vessel = null;
	            while ((myArray = myRe.exec(attributes[i])) !== null) {
	                if (!vessel) vessel = {};
	                vessel[myArray[1]] = myArray[2];
	            }
	            if (vessel) vessels.push(vessel);
	        }
	        //console.log(vessels);   
	        return vessels;
	    };
	    return {
	        isDirty: true,
	        findIndex: function findIndex(vessel) {
	            if (!this.data) return -1;
	            return Polyfill.findIndex(this.data.vessels, function (v) {
	                return v.mmsi == vessel.mmsi && v.imo == vessel.imo;
	            });
	        },
	        load: function load(actualUpdate) {
	            var _this = this;
	
	            if (!myFleetLayers || myFleetLayers.length == 0) this.data = { msg: [{ txt: _gtxt("AISSearch2.nomyfleet") }] };
	
	            if (!myFleetLayers || myFleetLayers.length == 0 || !this.isDirty) return Promise.resolve();
	
	            this.layers = [];
	            var errors = [],
	                promises = myFleetLayers.map(function (lid) {
	                return new Promise(function (resolve, reject) {
	                    //console.log(lid)
	                    sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + "Layer/GetLayerInfo.ashx?NeedAttrValues=false&LayerName=" + lid, function (response) {
	                        //console.log(response);                         
	                        if (response.Status.toLowerCase() == "ok") _this.layers.push({ layerId: lid, parentLayerId: response.Result.ParentLayer, filter: response.Result.Filter });else errors.push(response);
	                        resolve(response);
	                    });
	                });
	            });
	
	            return Promise.all(promises).then(function () {
	                //console.log(_this.layers)                                    
	                if (_this.layers.length > 0) {
	                    var layer = Polyfill.find(_this.layers, function (l) {
	                        return l.parentLayerId != '13E2051DFEE04EEF997DC5733BD69A15' && l.filter != "([mmsi]=-1000)";
	                    }); // NOT TRACKS
	                    //console.log(layer)      
	                    if (!layer) return Promise.resolve({ Status: "ok", Result: { values: [] } });
	                    //console.log(layer.filter)                                    
	                    var vessels = _parseFilter(layer.filter);
	                    return new Promise(function (resolve, reject) {
	                        aisLayerSearcher.searchNames(vessels,
	                        //vessels.map(function(v){return v.mmsi}), 
	                        //vessels.map(function(v){return v.imo}),
	                        function (response) {
	                            resolve(response);
	                        });
	                    });
	                } else {
	                    return Promise.resolve({ Status: "error", ErrorInfo: errors });
	                }
	            }).then(function (response) {
	                //console.log(response)  
	                //console.log("LOAD MY FLEET FINISH")               
	                if (response.Status.toLowerCase() == "ok") {
	                    _this.data = { vessels: response.Result.values.reduce(function (p, c) {
	                            var mmsi = response.Result.fields.indexOf("mmsi"),
	                                vessel_name = response.Result.fields.indexOf("vessel_name"),
	                                ts_pos_utc = response.Result.fields.indexOf("ts_pos_utc"),
	                                imo = response.Result.fields.indexOf("imo"),
	                                lat = response.Result.fields.indexOf("longitude"),
	                                lon = response.Result.fields.indexOf("latitude");
	                            if (!p.some(function (v) {
	                                return v.mmsi == c[mmsi];
	                            })) {
	                                var d = new Date(c[ts_pos_utc] * 1000);
	                                p.push({ vessel_name: c[vessel_name], mmsi: c[mmsi], imo: c[imo],
	                                    ts_pos_utc: aisLayerSearcher.formatDateTime(d), dt_pos_utc: aisLayerSearcher.formatDate(d),
	                                    ts_pos_org: c[ts_pos_utc],
	                                    xmin: c[lat], xmax: c[lat], ymin: c[lon], ymax: c[lon] });
	                            }
	                            return p;
	                        }, []) };
	                    _this.data.vessels.sort(function (a, b) {
	                        return +(a.vessel_name > b.vessel_name) || +(a.vessel_name === b.vessel_name) - 1;
	                    });
	                    _this.isDirty = false;
	                    return Promise.resolve();
	                } else {
	                    return Promise.reject(response);
	                }
	            });
	        },
	        update: function update() {
	            //if (!this.isDirty)
	            //    return;
	            _actualUpdate = new Date().getTime();
	            var _this = this,
	                actualUpdate = _actualUpdate;
	            this.view.inProgress(true);
	
	            this.load(actualUpdate).then(function () {
	                if (_actualUpdate == actualUpdate) {
	                    _this.view.inProgress(false);
	                    _this.view.repaint();
	                }
	            }, function (json) {
	                _this.dataSrc = null;
	                console.log(json);
	                if (json.Status.toLowerCase() == "auth" || json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function (r) {
	                    return r.Status.toLowerCase() == "auth";
	                })) _this.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], vessels: [] };else {
	                    //_this.data = {msg:[{txt:"!!!"}], vessels:[]};
	                    console.log(json);
	                }
	                _this.view.inProgress(false);
	                _this.view.repaint();
	            });
	        },
	        markMembers: function markMembers(vessels) {
	            if (this.data && this.data.vessels) this.data.vessels.forEach(function (v) {
	                var member = Polyfill.find(vessels, function (vv) {
	                    return v.mmsi == vv.mmsi && v.imo == v.imo;
	                });
	                if (member) member.mf_member = "visibilty:visible";
	            });
	        },
	        // Layer filter example "(([mmsi]=273452320 and [imo]=8971059) or ([mmsi]=273349220 and [imo]=8811015)) and [ts_pos_utc]>=2017-07-08"
	        changeFilter: function changeFilter(vessel) {
	            //console.log(this.data);
	            var add = true,
	                temp = { vessels: [] },
	                vessels = this.data.vessels;
	            for (var i = 0; i < this.data.vessels.length; ++i) {
	                if (this.data.vessels[i].imo == vessel.imo && this.data.vessels[i].mmsi == vessel.mmsi) add = false;else temp.vessels.push(this.data.vessels[i]);
	            }
	            if (add) temp.vessels.push(vessel);
	            this.data = temp;
	            var _this = this;
	            this.layers.forEach(function (layer) {
	                layer.filter = _this.data.vessels.length == 0 ? "([mmsi]=-1000)" : _this.data.vessels.map(function (v) {
	                    return layer.parentLayerId != '13E2051DFEE04EEF997DC5733BD69A15' ? // IS TRACKS
	                    "([mmsi]=" + v.mmsi + " and [imo]=" + v.imo + ")" : "([mmsi]=" + v.mmsi + ")";
	                }).join(" or ");
	
	                var today = new Date(new Date() - 3600 * 24 * 7 * 1000);
	                today = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);
	                if (layer.filter != "([mmsi]=-1000)") {
	                    if (layer.parentLayerId != '13E2051DFEE04EEF997DC5733BD69A15') layer.filter = "(" + layer.filter + ") and [ts_pos_utc]>='" + today + "'";else layer.filter = "(" + layer.filter + ") and [Date]>='" + today + "'";
	                }
	                //console.log(layer.filter)
	            });
	            return Promise.all(this.layers.map(function (l) {
	                return new Promise(function (resolve, reject) {
	                    sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + "VectorLayer/Update.ashx?VectorLayerID=" + l.layerId + "&filter=" + l.filter, function (response) {
	                        if (response.Status.toLowerCase() == "ok") setTimeout(function run() {
	
	                            sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + "AsyncTask.ashx?TaskID=" + response.Result.TaskID, function (response) {
	                                if (response.Status.toLowerCase() == "ok") {
	                                    if (!response.Result.Completed) setTimeout(run, 1000);else {
	                                        if (response.Result.ErorInfo) {
	                                            console.log(response);
	                                            reject();
	                                        } else resolve();
	                                    }
	                                } else {
	                                    console.log(response);
	                                    reject();
	                                }
	                            });
	                        }, 1000);else {
	                            console.log(response);
	                            reject();
	                        }
	                    });
	                });
	            })).then(
	            //return Promise.resolve().then(
	            function () {
	                this.isDirty = true;
	                //console.log(this.data);
	                L.gmx.layersVersion.chkVersion();
	                return Promise.resolve();
	            }.bind(this), function () {
	                return Promise.reject();
	            });
	        }
	    };
	};

/***/ }),
/* 12 */
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
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(14);
	var BaseView = __webpack_require__(8);
	
	var _searchString = "",
	    _setSearchInputValue = function _setSearchInputValue(s) {
	    var searchIc = this.frame.find('.filter .search'),
	        removeBut = this.frame.find('.filter .remove'),
	        _searchString = s;
	    this.searchInput.val(_searchString);
	    if (s != "") {
	        removeBut.show();
	        searchIc.hide();
	    } else removeBut.click();
	},
	    _highlight = void 0,
	    _tools = void 0;
	
	var DbSearchView = function DbSearchView(_ref) {
	    var _this = this;
	
	    var model = _ref.model,
	        highlight = _ref.highlight,
	        tools = _ref.tools;
	
	    BaseView.call(this, model);
	    _highlight = highlight;
	    _tools = tools;
	    this.topOffset = 240;
	    this.frame = $(Handlebars.compile('<div class="ais_view search_view">' + '<table border=0 class="instruments">' + '<tr><td colspan="2"><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/>' + '<div><img class="search clicable" src="plugins/AIS/AISSearch/svg/search.svg">' + '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg">' + '</div></div>' + '</td></tr>' + '<tr><td class="time"><span class="label">Время:</span>' + '<span class="utc on unselectable" unselectable="on">UTC</span><span class="local unselectable" unselectable="on">Местное</span></td>' + '<tr><td><div class="calendar"></div></td>' + '<td style="padding-left:5px"><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div>' + this.gifLoader + '</div></div></td></tr>' + '</table>' + '<div class="ais_history">' + '<table class="ais_positions_date"><tr><td>NO HISTORY FOUND</td></tr></table>' + '</div>' + '<div class="suggestions"><div class="suggestion">SOME VESSEL<br><span>mmsi:0, imo:0</span></div></div>' + '</div>')());
	    this.container = this.frame.find('.ais_history');
	    this.tableTemplate = '{{#if msg}}<div class="message">{{msg}}</div>{{/if}}' + '{{#each vessels}}' + '<table class="ais_positions_date" border=0><tr>' + '<td><div class="open_positions ui-helper-noselect icon-right-open" title="{{i "AISSearch2.voyageInfo"}}"></div></td>' + '<td><span class="date">{{{ts_pos_utc}}}</span></td><td><span class="count">{{count}}</span></td></tr></table>' + '<div id="voyage_info{{n}}"></div>' + '{{/each}}';
	
	    var calendar = this.frame.find('.calendar');
	
	    // walkaround with focus at first input in ui-dialog
	    calendar.append('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');
	    var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
	        dateInterval = new nsGmx.DateInterval();
	    dateInterval.set('dateBegin', mapDateInterval.get('dateBegin')).set('dateEnd', mapDateInterval.get('dateEnd')).on('change', function (e) {
	        //console.log(this.model.historyInterval) 
	        //console.log('CHANGE ' + dateInterval.get('dateBegin').toUTCString() + ' ' + dateInterval.get('dateEnd').toUTCString()) 
	        this.model.historyInterval = { dateBegin: dateInterval.get('dateBegin'), dateEnd: dateInterval.get('dateEnd') };
	        this.model.isDirty = true;
	        this.show();
	    }.bind(this));
	
	    this.calendar = new nsGmx.CalendarWidget({
	        dateInterval: dateInterval,
	        name: 'searchInterval',
	        container: calendar,
	        dateMin: new Date(0, 0, 0),
	        dateMax: new Date(3015, 1, 1),
	        dateFormat: 'dd.mm.yy',
	        minimized: false,
	        showSwitcher: false,
	        dateBegin: new Date(),
	        dateEnd: new Date(2000, 10, 10)
	        //buttonImage: 'img/calendar.png'
	    });
	
	    var td = calendar.find('tr:nth-of-type(1) td');
	    td.eq(1).after('<td style="font-weight:bold">&nbsp;&nbsp;&ndash;&nbsp;&nbsp;</td>');
	    td.eq(td.length - 1).after('<td>&nbsp;&nbsp;<img src="plugins/AIS/AISSearch/svg/calendar.svg"></td>');
	
	    //sidebarControl && sidebarControl.on('closing', ()=>calendar.reset())
	    this.frame.on('click', function (e) {
	        if (e.target.classList.toString().search(/CalendarWidget/) < 0) {
	            _this.calendar.reset();
	        }
	        suggestions.hide();
	    }.bind(this));
	
	    this.frame.find('.time .utc,.local').click(function (e) {
	        var trg = $(e.currentTarget);
	        if (!trg.is('.on')) {
	            _this.frame.find('.time span').removeClass("on");
	            trg.addClass('on');
	            if (trg.is('.utc')) {
	                _this.frame.find('.utc_time').show();
	                _this.frame.find('.local_time').hide();
	                _this.frame.find('.utc_date').show();
	                _this.frame.find('.local_date').hide();
	            } else {
	                _this.frame.find('.utc_time').hide();
	                _this.frame.find('.local_time').show();
	                _this.frame.find('.utc_date').hide();
	                _this.frame.find('.local_date').show();
	            }
	        }
	    }.bind(this));
	
	    this.searchInput = this.frame.find('.filter input');
	
	    var searchIc = this.frame.find('.filter .search'),
	        removeBut = this.frame.find('.filter .remove'),
	        delay = void 0,
	        suggestions = this.frame.find('.suggestions'),
	        suggestionsCount = 5,
	        suggestionsFrame = { first: 0, current: 0, last: suggestionsCount - 1 },
	        found = { values: [] },
	        searchDone = function searchDone() {
	        if (found.values.length > 0) {
	            _searchString = found.values[suggestionsFrame.current].vessel_name;
	            this.searchInput.val(_searchString);
	            var v = found.values[suggestionsFrame.current];
	            if (!this.vessel || this.vessel.mmsi != v.mmsi) {
	                this.vessel = v;
	                this.show();
	            }
	        } else {
	            _clean.call(this);
	        }
	    },
	        doSearch = function doSearch() {
	        //console.log(_searchString)
	        new Promise(function (resolve, reject) {
	            this.model.searcher.searchString(_searchString, true, function (response) {
	                if (response.Status.toLowerCase() == "ok") {
	                    found = {
	                        values: response.Result.values.map(function (v) {
	                            return { vessel_name: v[0], mmsi: v[1], imo: v[2], ts_pos_utc: v[3], ts_pos_org: v[3], vessel_type: v[4] };
	                        })
	                    };
	                    resolve();
	                } else {
	                    reject(response);
	                }
	            });
	        }.bind(this)).then(function () {
	            var _this2 = this;
	
	            // SUCCEEDED
	            if (found.values.length == 0) {
	                suggestions.hide();
	                return;
	            }
	
	            var scrollCont = suggestions.find('.mCSB_container'),
	                content = $(Handlebars.compile('{{#each values}}<div class="suggestion" id="{{@index}}">{{vessel_name}}<br><span>mmsi:{{mmsi}}, imo:{{imo}}</span></div>{{/each}}')(found));
	            if (!scrollCont[0]) suggestions.html(content).mCustomScrollbar();else $(scrollCont).html(content);
	
	            var suggestion = suggestions.find('.suggestion');
	            if (!suggestions.is(':visible')) {
	                var cr = this.frame.find('.filter')[0].getBoundingClientRect();
	                suggestions.show();
	                suggestions.offset({ left: cr.left, top: cr.bottom - 3 });
	                suggestions.outerWidth(cr.width);
	            }
	
	            suggestions.innerHeight(suggestion[0].getBoundingClientRect().height * (found.values.length > suggestionsCount ? suggestionsCount : found.values.length));
	            suggestionsFrame = { first: 0, current: 0, last: suggestionsCount - 1 };
	            suggestion.eq(suggestionsFrame.current).addClass('selected');
	            suggestion.click(function (e) {
	                suggestionsFrame.current = e.currentTarget.id;
	                searchDone.call(_this2);
	            });
	            //console.log("doFilter2 "+_searchString)
	        }.bind(this), function (response) {
	            // FAILED
	            console.log(response);
	        });
	    };
	    removeBut.click(function (e) {
	        this.searchInput.val('');
	        clearTimeout(delay);
	        removeBut.hide();
	        searchIc.show();
	        suggestions.hide();
	        _clean.call(this);
	        //nsGmx.leafletMap.removeLayer(highlight);
	    }.bind(this));
	    this.searchInput.keydown(function (e) {
	        var suggestion = suggestions.find('.suggestion.selected');
	        if (suggestions.is(':visible')) {
	            if (e.keyCode == 38) {
	                if (suggestionsFrame.current > 0) {
	                    suggestionsFrame.current--;
	                    suggestion.removeClass('selected').prev().addClass('selected');
	                }
	            } else if (e.keyCode == 40) {
	                if (suggestionsFrame.current < found.values.length - 1) {
	                    suggestionsFrame.current++;
	                    suggestion.removeClass('selected').next().addClass('selected');
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
	            suggestions.mCustomScrollbar("scrollTo", "#" + suggestionsFrame.first, { scrollInertia: 0 });
	        }
	    });
	    this.searchInput.keyup(function (e) {
	        var _this3 = this;
	
	        var temp = (this.searchInput.val() || "").replace(/^\s+/, "").replace(/\s+$/, "");
	
	        if (_searchString == temp && e.keyCode != 13) return;
	
	        _searchString = temp;
	        clearTimeout(delay);
	
	        if (_searchString == "") {
	            removeBut.click();
	            return;
	        }
	
	        removeBut.show();
	        searchIc.hide();
	        if (e.keyCode == 13) {
	            suggestions.hide();
	            searchDone.call(this);
	        } else delay = setTimeout(function () {
	            doSearch.call(_this3);
	        }.bind(this), 200);
	        //nsGmx.leafletMap.removeLayer(highlight);
	    }.bind(this));
	};
	
	DbSearchView.prototype = Object.create(BaseView.prototype);
	
	var _clean = function _clean() {
	    this.frame.find('.open_positions').off('click');
	    var scrollCont = this.container.find('.mCSB_container');
	    if (scrollCont[0]) scrollCont.empty();else this.container.empty();
	};
	
	DbSearchView.prototype.inProgress = function (state) {
	    var progress = this.frame.find('.refresh div');
	    if (state) progress.show();else progress.hide();
	};
	
	var _vi_template = '<table class="ais_positions">' + '{{#each positions}}' + '<tr>' + '<td><span class="utc_time">{{tm_pos_utc}}</span><span class="local_time">{{tm_pos_loc}}</span></td>' + '<td><span class="utc_date">{{dt_pos_utc}}</span><span class="local_date">{{dt_pos_loc}}</span></td>' + '<td><img src="{{icon}}" class="rotateimg{{icon_rot}}"></td>' + '<td><img src="{{source}}"></td>' + '<td>{{longitude}}&nbsp;&nbsp;{{latitude}}</td>' + '<td><div class="show_pos" id="show_pos{{@index}}"><img src="plugins/AIS/AISSearch/svg/center.svg"></div></td>' + '</tr>' + '<tr><td colspan="6" class="more"><hr><div class="vi_more">' + '<div class="c1">COG | SOG:</div><div class="c2">&nbsp;{{cog}} {{#if cog_sog}}&nbsp;{{/if}} {{sog}}</div>' + '<div class="c1">HDG | ROT:</div><div class="c2">&nbsp;{{heading}} {{#if heading_rot}}&nbsp;{{/if}} {{rot}}</div>' + '<div class="c1">Осадка:</div><div class="c2">&nbsp;{{draught}}</div>' + '<div class="c1">Назначение:</div><div class="c2">&nbsp;{{destination}}</div>' + '<div class="c1">Статус:</div><div class="c2">&nbsp;{{nav_status}}</div>' + '<div class="c1">ETA:</div><div class="c2">&nbsp;<span class="utc_time">{{eta_utc}}</span><span class="local_time">{{eta_loc}}</span></div>' + '</div></td></tr>' + '{{/each}}' + '</table>';
	DbSearchView.prototype.repaint = function () {
	    var _this4 = this;
	
	    _clean.call(this);
	    BaseView.prototype.repaint.apply(this, arguments);
	
	    var open_pos = this.frame.find('.open_positions');
	    open_pos.each(function (ind, elm) {
	        $(elm).click(function (e) {
	            var icon = $(e.target),
	                vi_cont = _this4.frame.find('#voyage_info' + ind);
	
	            if (icon.is('.icon-down-open')) {
	                icon.removeClass('icon-down-open').addClass('.icon-right-open');
	                vi_cont.find('.ais_positions td[class!="more"]').off('click');
	                vi_cont.empty();
	            } else {
	                icon.addClass('icon-down-open').removeClass('.icon-right-open');
	                vi_cont.html(Handlebars.compile(_vi_template)(_this4.model.data.vessels[ind]));
	                if (_this4.frame.find('.time .local').is('.on')) {
	                    vi_cont.find('.utc_time').hide();
	                    vi_cont.find('.local_time').show();
	                    vi_cont.find('.utc_date').hide();
	                    vi_cont.find('.local_date').show();
	                }
	                vi_cont.find('.ais_positions td[class!="more"]').click(function (e) {
	                    var td = $(e.currentTarget);
	                    if (td.is('.active')) {
	                        td.removeClass('active');
	                        td.siblings().removeClass('active');
	                        td.parent().next().find('td').removeClass('active');
	                    } else {
	                        td.addClass('active');
	                        td.siblings().addClass('active');
	                        td.parent().next().find('td').addClass('active');
	                    }
	                });
	                vi_cont.find('.ais_positions .show_pos').click(function (e) {
	                    //showPosition
	                    var i = e.currentTarget.id.replace(/show_pos/, ""),
	                        vessel = _this4.model.data.vessels[ind].positions[parseInt(i)];
	
	                    _this4.positionMap(vessel);
	                    _this4.showTrack(vessel);
	
	                    e.stopPropagation();
	                }.bind(_this4));
	            }
	        }.bind(_this4));
	    });
	
	    if (this.model.data.vessels.length == 1) open_pos.eq(0).click();
	};
	
	Object.defineProperty(DbSearchView.prototype, "vessel", {
	    get: function get() {
	        return this.model.vessel;
	    },
	    set: function set(v) {
	        _setSearchInputValue.call(this, v.vessel_name);
	
	        var db = nsGmx.DateInterval.getUTCDayBoundary(new Date(v.ts_pos_org * 1000));
	        this.model.vessel = null;
	        this.calendar.getDateInterval().set('dateBegin', db.dateBegin);
	        this.calendar.getDateInterval().set('dateEnd', db.dateEnd);
	        this.model.historyInterval = { dateBegin: db.dateBegin, dateEnd: db.dateEnd };
	        this.model.vessel = v;
	        this.model.isDirty = true;
	    }
	});
	
	DbSearchView.prototype.show = function () {
	
	    this.frame.show();
	    this.searchInput.focus();
	    if (!this.vessel) return;
	
	    console.log(this.vessel.vessel_name + " " + this.vessel.mmsi + " " + this.vessel.vessel_type);
	    //console.log(this.model.historyInterval.dateBegin + " " + this.model.historyInterval.dateEnd)
	    BaseView.prototype.show.apply(this, arguments);
	};
	
	DbSearchView.prototype.hide = function () {
	    //console.log('hide DbSearchView')
	    BaseView.prototype.hide.apply(this, arguments);
	};
	
	DbSearchView.prototype.showTrack = function (vessel) {
	    var dlg = $('.ui-dialog:contains("' + vessel.mmsi + '")');
	    if (dlg[0]) {
	        dlg.find('.showtrack:not(.active)').click();
	    } else {
	        _tools.showTrack([vessel.mmsi]);
	        $('.showtrack').attr('title', _gtxt('AISSearch2.show_track')).removeClass('active');
	    }
	};
	
	DbSearchView.prototype.positionMap = function (vessel) {
	    //console.log(vessel);
	    var interval = nsGmx.DateInterval.getUTCDayBoundary(new Date(vessel.ts_pos_org * 1000));
	    nsGmx.widgets.commonCalendar.setDateInterval(interval.dateBegin, interval.dateEnd);
	    var xmin = vessel.xmin ? vessel.xmin : vessel.longitude,
	        xmax = vessel.xmax ? vessel.xmax : vessel.longitude,
	        ymin = vessel.ymin ? vessel.ymin : vessel.latitude,
	        ymax = vessel.ymax ? vessel.ymax : vessel.latitude;
	    nsGmx.leafletMap.fitBounds([[ymin, xmin], [ymax, xmax]], {
	        maxZoom: 9, //config.user.searchZoom,
	        animate: false
	    });
	    nsGmx.leafletMap.removeLayer(_highlight);
	    _highlight.vessel = vessel;
	    _highlight.setLatLng([ymax, xmax]).addTo(nsGmx.leafletMap);
	};
	
	module.exports = DbSearchView;

/***/ }),
/* 14 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 15 */
/***/ (function(module, exports) {

	"use strict";
	
	module.exports = function (aisLayerSearcher) {
	    var _actualUpdate = void 0,
	        _round = function _round(d, p) {
	        var isNeg = d < 0,
	            power = Math.pow(10, p);
	        return d ? (isNeg ? -1 : 1) * (Math.round((isNeg ? d = -d : d) * power) / power) : d;
	    },
	        _addUnit = function _addUnit(v, u) {
	        return v != null && v != "" ? v + u : "";
	    },
	        _toDd = function _toDd(D, lng) {
	        var dir = D < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
	            deg = Math.round((D < 0 ? D = -D : D) * 1000000) / 1000000;
	        return deg.toFixed(2) + " " //"°"
	        + dir;
	    },
	        _formatPosition = function _formatPosition(vessel) {
	        vessel.cog_sog = vessel.cog && vessel.sog;
	        vessel.heading_rot = vessel.heading && vessel.rot;
	        vessel.x_y = vessel.longitude && vessel.latitude;
	        var d = new Date(vessel.ts_pos_utc * 1000);
	        var eta = new Date(vessel.ts_eta * 1000);
	        vessel.tm_pos_utc = _formatTime(d);
	        vessel.tm_pos_loc = _formatTime(d, true);
	        vessel.dt_pos_utc = _formatDate(d);
	        vessel.dt_pos_loc = _formatDate(d, true);
	        vessel.eta_utc = aisLayerSearcher.formatDateTime(eta);
	        vessel.eta_loc = aisLayerSearcher.formatDateTime(eta, true);
	        vessel.icon_rot = Math.round(vessel.cog / 15) * 15;
	        vessel.cog = _addUnit(_round(vessel.cog, 5), "°");
	        vessel.rot = _addUnit(_round(vessel.rot, 5), "°/мин");
	        vessel.heading = _addUnit(_round(vessel.heading, 5), "°");
	        vessel.draught = _addUnit(_round(vessel.draught, 5), " м");
	        //vessel.length = _addUnit(vessel.length, " м");
	        //vessel.width = _addUnit(vessel.width, " м");
	        vessel.source = 'plugins/AIS/AISSearch/svg/satellite-ais.svg'; //vessel.source=='T-AIS'?_gtxt('AISSearch2.tais'):_gtxt('AISSearch2.sais');
	
	        vessel.xmin = vessel.longitude;
	        vessel.xmax = vessel.longitude;
	        vessel.ymin = vessel.latitude;
	        vessel.ymax = vessel.latitude;
	
	        vessel.longitude = _toDd(vessel.longitude, true);
	        vessel.latitude = _toDd(vessel.latitude);
	        switch (vessel.vessel_type.toLowerCase()) {
	            case "cargo":
	                vessel.icon = "http://maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Ccargo-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                break;
	            case "tanker":
	                vessel.icon = "http://maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Ctanker-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                break;
	            case "fishing":
	                vessel.icon = "http://maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cfishing-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                break;
	            case "passenger":
	                vessel.icon = "http://maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cpassenger-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                break;
	            case "hsc":
	                vessel.icon = "http://maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Chighspeed-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                break;
	            case "pleasure craft":
	            case "sailing":
	                vessel.icon = "http://maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cpleasure-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                break;
	            case "unknown":
	            case "reserved":
	            case "other":
	                vessel.icon = "http://maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cother-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                break;
	            default:
	                vessel.icon = "http://maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cspecialcraft-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                break;
	        }
	        vessel.sog = _addUnit(_round(vessel.sog, 5), " уз");
	
	        return vessel;
	    },
	        _formatTime = function _formatTime(d, local) {
	        var temp = new Date(d);
	        if (!local) temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset());
	        return temp.toLocaleTimeString();
	    },
	        _formatDate = function _formatDate(d, local) {
	        var temp = new Date(d);
	        if (!local) temp.setMinutes(temp.getMinutes() + temp.getTimezoneOffset());
	        return temp.toLocaleDateString();
	    };
	    return {
	        searcher: aisLayerSearcher,
	        filterString: "",
	        isDirty: false,
	        load: function load(actualUpdate) {
	            if (!this.isDirty) return Promise.resolve();
	            //return new Promise((resolve)=>setTimeout(resolve, 1000))
	            //console.log('LOAD ' + _historyInterval['dateBegin'].toUTCString() + ' ' + _historyInterval['dateEnd'].toUTCString())     
	            var _this = this;
	            return new Promise(function (resolve) {
	                aisLayerSearcher.searchPositionsAgg([_this.vessel.mmsi], _this.historyInterval, function (response) {
	                    if (parseResponse(response)) {
	                        var position = void 0,
	                            positions = [],
	                            fields = response.Result.fields,
	                            groups = response.Result.values.reduce(function (p, c) {
	                            var dt = c[1],
	                                t = dt - dt % (24 * 3600),
	                                d = new Date(t * 1000),
	                                obj = {};
	                            for (var j = 0; j < fields.length; ++j) {
	                                obj[fields[j]] = c[j];
	                                if (fields[j] == 'ts_pos_utc') obj['ts_pos_org'] = c[j];
	                            }
	                            if (p[d]) {
	                                p[d].positions.push(_formatPosition(obj));
	                                p[d].count = p[d].count + 1;
	                            } else p[d] = { ts_pos_utc: _formatDate(d), positions: [_formatPosition(obj)], count: 1 };
	                            return p;
	                        }, {});
	                        var counter = 0;
	                        for (var k in groups) {
	                            groups[k]["n"] = counter++;
	                            positions.push(groups[k]);
	                        }
	                        /*
	                        positions.sort((a, b) => {
	                            if (a.ts_pos_org > b.ts_pos_org) return -1
	                            if (a.ts_pos_org < b.ts_pos_org) return 1;
	                            return 0;
	                        })
	                        */
	                        resolve({ Status: "ok", Result: { values: positions } });
	                    } else resolve(response);
	                });
	            }).then(function (response) {
	                //console.log(response)       
	                _this.isDirty = false;
	                if (response.Status.toLowerCase() == "ok") {
	                    _this.data = { vessels: response.Result.values };
	                    return Promise.resolve();
	                } else {
	                    return Promise.reject(response);
	                }
	            });
	        },
	        update: function update() {
	            if (!this.isDirty) return;
	
	            _actualUpdate = new Date().getTime();
	            var _this = this,
	                actualUpdate = _actualUpdate;
	            this.view.inProgress(true);
	            //this.filterString&&console.log(this.filterString+" "+this.filterString.search(/\r$/))
	            //this.filterString&&console.log(this.filterString.replace(/^\s+/, "").replace(/\s+\r*$/, "")!="")            
	
	            this.load(actualUpdate).then(function () {
	                //console.log("LOADED "+(new Date().getTime()-_this._actualUpdate)+"ms")
	                //console.log("3>"+new Date(_this._actualUpdate))
	                //console.log("4>"+new Date(actualUpdate))
	                if (_actualUpdate == actualUpdate) {
	                    //_this.data.vessels && (_this.data.vessels.length>0) && console.log(_this.data.vessels[0].positions[0])                    
	                    _this.view.inProgress(false);
	                    _this.view.repaint();
	                }
	            }, function (json) {
	                _this.dataSrc = null;
	                console.log(json);
	                if (json.Status.toLowerCase() == "auth" || json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function (r) {
	                    return r.Status.toLowerCase() == "auth";
	                }) || json.ErrorInfo && json.ErrorInfo.ErrorMessage.search(/not access/i) != -1) _this.data = { msg: _gtxt("AISSearch2.auth"), vessels: [] };else {
	                    //_this.data = {msg:[{txt:"!!!"}], vessels:[]};
	                    console.log(json);
	                }
	                _this.view.inProgress(false);
	                _this.view.repaint();
	            });
	        }
	    };
	};

/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var createInfoDialog = __webpack_require__(17),
	    Polyfill = __webpack_require__(12),
	    VesselInfoScreen = __webpack_require__(19);
	
	var infoDialogCascade = [],
	    allIinfoDialogs = [],
	    vesselInfoScreen = void 0;
	
	module.exports = function (_ref) {
	    var tools = _ref.tools,
	        aisLayerSearcher = _ref.aisLayerSearcher,
	        modulePath = _ref.modulePath,
	        aisView = _ref.aisView,
	        myFleetMembersView = _ref.myFleetMembersView;
	
	
	    vesselInfoScreen = new VesselInfoScreen({ modulePath: modulePath, aisServices: aisLayerSearcher.aisServices });
	    var _showPosition = function _showPosition(vessel) {
	        aisView.vessel = vessel;
	        if (aisView.tab) if (aisView.tab.is('.active')) aisView.show();else aisView.tab.click();
	        aisView.positionMap(vessel);
	    };
	    return {
	        showPosition: function showPosition(vessel) {
	            _showPosition(vessel);
	            aisView.showTrack(vessel);
	        },
	        show: function show(vessel, getmore) {
	            var ind = Polyfill.findIndex(allIinfoDialogs, function (d) {
	                return d.vessel.imo == vessel.imo && d.vessel.mmsi == vessel.mmsi;
	            });
	            if (ind >= 0) {
	                $(allIinfoDialogs[ind].dialog).parent().insertAfter($('.ui-dialog').eq($('.ui-dialog').length - 1));
	                return;
	            }
	
	            var dialog = createInfoDialog({
	                vessel: vessel,
	                getmore: getmore,
	                displaingTrack: tools.displaingTrack,
	                closeFunc: function closeFunc(event) {
	                    var ind = Polyfill.findIndex(infoDialogCascade, function (d) {
	                        return d.id == dialog.id;
	                    });
	                    if (ind >= 0) infoDialogCascade.splice(ind, 1);
	                    ind = Polyfill.findIndex(allIinfoDialogs, function (d) {
	                        return d.dialog.id == dialog.id;
	                    });
	                    if (ind >= 0) allIinfoDialogs.splice(ind, 1);
	                },
	                aisLayerSearcher: aisLayerSearcher,
	                modulePath: modulePath,
	                aisView: aisView,
	                myFleetMembersView: myFleetMembersView
	            }, {
	                openVesselInfoScreen: vesselInfoScreen.open,
	                showTrack: tools.showTrack,
	                showPosition: _showPosition
	            });
	
	            if (infoDialogCascade.length > 0) {
	                var pos = $(infoDialogCascade[infoDialogCascade.length - 1]).parent().position();
	                $(dialog).dialog("option", "position", [pos.left + 10, pos.top + 10]);
	            }
	
	            infoDialogCascade.push(dialog);
	            allIinfoDialogs.push({ vessel: vessel, dialog: dialog });
	            $(dialog).on("dialogdragstop", function (event, ui) {
	                var ind = Polyfill.findIndex(infoDialogCascade, function (d) {
	                    return d.id == dialog.id;
	                });
	                if (ind >= 0) infoDialogCascade.splice(ind, 1);
	            });
	        }
	    };
	};

/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(18);
	
	var addUnit = function addUnit(v, u) {
		return v != null && v != "" ? v + u : "";
	},
	    formatDate = void 0,
	    formatDateTime = void 0,
	    round = function round(d, p) {
		var isNeg = d < 0,
		    power = Math.pow(10, p);
		return d ? (isNeg ? -1 : 1) * (Math.round((isNeg ? d = -d : d) * power) / power) : d;
	},
	    formatVessel = function formatVessel(vessel) {
		var d = new Date(vessel.ts_pos_utc * 1000);
		vessel.ts_pos_org = vessel.ts_pos_utc;
		vessel.dt_pos_utc = formatDate(d);
		vessel.ts_pos_utc = formatDateTime(d);
		vessel.ts_pos_loc = "<br><span class='local'>" + formatDateTime(d, true) + "</span>";
		vessel.ts_eta = formatDateTime(new Date(vessel.ts_eta * 1000));
		vessel.cog = addUnit(round(vessel.cog, 5), "°");
		vessel.sog = addUnit(round(vessel.sog, 5), " уз");
		vessel.rot = addUnit(round(vessel.rot, 5), "°/мин");
		vessel.heading = addUnit(round(vessel.heading, 5), "°");
		vessel.draught = addUnit(round(vessel.draught, 5), " м");
		vessel.length = addUnit(vessel.length, " м");
		vessel.width = addUnit(vessel.width, " м");
		vessel.source = vessel.source == 'T-AIS' ? _gtxt('AISSearch2.tais') : _gtxt('AISSearch2.sais');
		return vessel;
	},
	    toDd = function toDd(D, lng) {
		var dir = D < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
		    deg = Math.round((D < 0 ? D = -D : D) * 1000000) / 1000000;
		return deg + "°" + dir;
	},
	    ddToDms = function ddToDms(D, lng) {
		var dms = {
			dir: D < 0 ? lng ? 'W' : 'S' : lng ? 'E' : 'N',
			deg: 0 | (D < 0 ? D = -D : D),
			min: 0 | D % 1 * 60,
			sec: (0 | D * 60 % 1 * 6000) / 100
		};
		return dms.deg + "°" + dms.min + "'" + dms.sec + "\" " + dms.dir;
	};
	
	module.exports = function (_ref, commands) {
		var vessel = _ref.vessel,
		    closeFunc = _ref.closeFunc,
		    aisLayerSearcher = _ref.aisLayerSearcher,
		    getmore = _ref.getmore,
		    modulePath = _ref.modulePath,
		    aisView = _ref.aisView,
		    displaingTrack = _ref.displaingTrack,
		    myFleetMembersView = _ref.myFleetMembersView,
		    aisPluginPanel = _ref.aisPluginPanel;
	
	
		formatDate = aisLayerSearcher.formatDate;
		formatDateTime = aisLayerSearcher.formatDateTime;
	
		var myFleetMembersModel = myFleetMembersView.model,
		    add = myFleetMembersModel && myFleetMembersModel.findIndex(vessel) < 0;
	
		var canvas = $('<div class="ais_myfleet_dialog"/>'),
		    menu = $('<div class="column1 menu"></div>').appendTo(canvas),
		    photo = $('<div class="photo"><div></div></div>').appendTo(menu),
		    moreinfo = $('<div class="moreinfo"><div></div></div>').appendTo(menu),
		    content = Handlebars.compile('<div class="column2 content">' + '</div>')(vessel),
		    buttons = $('<div class="column3 buttons"></div>'),
		    gifLoader = '<img src="img/progress.gif">';
		//console.log(content);
	
		canvas.append(content).append(buttons);
	
		var dialog = showDialog(vessel.vessel_name, canvas[0], { width: 610, height: 230, closeFunc: closeFunc }),
		    vessel2 = void 0,
		    moreInfo = function moreInfo(v) {
			var smallShipIcon = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px" height="14px" viewBox="0 0 14 14" style="margin-left: 10px" xml:space="preserve">' + '<g style="fill: #48aff1;">' + '<path class="st0" d="M13.4,11H0.6c-0.2,0-0.4,0.1-0.5,0.3c-0.1,0.2-0.1,0.4,0,0.6l1.2,1.8C1.4,13.9,1.6,14,1.8,14h9.9   c0.2,0,0.3-0.1,0.4-0.2l1.7-1.8c0.2-0.2,0.2-0.4,0.1-0.7C13.9,11.1,13.7,11,13.4,11z"/>' + '<path class="st0" d="M9.3,9.7h2.9c0.2,0,0.4-0.1,0.5-0.3c0.1-0.2,0.1-0.4,0-0.6L9.8,4.5C9.7,4.3,9.4,4.2,9.2,4.3   C8.9,4.4,8.7,4.6,8.7,4.9v4.3C8.7,9.5,9,9.7,9.3,9.7z"/>' + '<path class="st0" d="M1.2,9.7H7c0.3,0,0.6-0.3,0.6-0.6V0.6c0-0.3-0.2-0.5-0.4-0.6C6.9-0.1,6.7,0,6.5,0.3L0.7,8.8   C0.6,9,0.5,9.2,0.6,9.4C0.7,9.6,0.9,9.7,1.2,9.7z"/>' + '</g>' + '</svg>',
			    vesselPropTempl = '<div class="vessel_prop vname"><b>{{vessel_name}}</b>' + smallShipIcon + '</div>' + '<div class="vessel_prop altvname"><b>' + (vessel2.registry_name && vessel2.registry_name != vessel2.vessel_name ? vessel2.registry_name : '') + '&nbsp;</b></div>';
	
			$('.content', canvas).append(Handlebars.compile('<div class="vessel_props1">' + vesselPropTempl + '<table>' + '<tr><td><div class="vessel_prop">Тип судна: </div></td><td><div class="vessel_prop value">{{vessel_type}}</div></td></tr>' + '<tr><td><div class="vessel_prop">Флаг: </div></td><td><div class="vessel_prop value">{{flag_country}}</div></td></tr>' + '<tr><td><div class="vessel_prop">IMO: </div></td><td><div class="vessel_prop value">{{imo}}</div></td></tr>' + '<tr><td><div class="vessel_prop">MMSI: </div></td><td><div class="vessel_prop value mmsi">{{mmsi}}</div></td></tr>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.source"}}: </div></td><td><div class="vessel_prop value">{{source}}</div></td></tr>' + '</table>' + '</div>')(v));
	
			$('.content', canvas).append(Handlebars.compile('<div class="vessel_props2">' + vesselPropTempl + '<table>' + '<tr><td><div class="vessel_prop">COG | SOG: </div></td><td><div class="vessel_prop value">{{cog}}&nbsp;&nbsp;&nbsp;{{sog}}</div></td></tr>' + '<tr><td><div class="vessel_prop">HDG | ROT: </div></td><td><div class="vessel_prop value">{{heading}}&nbsp;&nbsp;&nbsp;{{rot}}</div></td></tr>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.draught"}}: </div></td><td><div class="vessel_prop value">{{draught}}</div></td></tr>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.destination"}}: </div></td><td><div class="vessel_prop value">{{destination}}</div></td></tr>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.nav_status"}}: </div></td><td><div class="vessel_prop value">{{nav_status}}</div></td></tr>' + '</table>' + '</div>')(v));
	
			$(moreinfo).append('<table><tr>' + '<td class="ais_refresh"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" height="16" width="16"><g class="nc-icon-wrapper" fill="#444444"><polyline data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 15,16 7,16 7,13 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 15,18 17,16 15,14 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" data-stroke="none" fill="#444444" points="15,18 17,16 15,14 " stroke-linejoin="miter" stroke-linecap="square" style="stroke: currentColor;fill: currentColor;"/> <polyline data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 9,8 17,8 17,11 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points="9,6 7,8 9,10 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" data-stroke="none" fill="#444444" points="9,6 7,8 9,10 " stroke-linejoin="miter" stroke-linecap="square" style="stroke: currentColor;fill: currentColor;"/> <rect x="2" y="1" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" width="20" height="22" stroke-linejoin="miter" style="stroke: currentColor;"/></g></svg></td>' + '<td><div class="vessel_prop coordinates"><span class="small">' + toDd(v.latitude, false) + ' ' + toDd(v.longitude, true) + '</small></div></td>' + '</tr></table>');
	
			var swap = "<span class='small'>" + ddToDms(v.latitude, false) + " " + ddToDms(v.longitude, true) + "</span>";
			$('.ais_refresh', moreinfo).click(function (e) {
				var mi = $('.coordinates', moreinfo),
				    t = mi.html();
				mi.html(swap);
				swap = t;
			});
	
			$('.vessel_props2', canvas).hide();
			$('.vessel_prop.vname svg', canvas).css('visibility', add ? 'hidden' : 'visible');
		};
	
		$(dialog).dialog({ resizable: false });
	
		if (!getmore) {
			vessel2 = $.extend({}, vessel);
			moreInfo(formatVessel(vessel2));
		} else aisLayerSearcher.searchNames([{ mmsi: vessel.mmsi, imo: vessel.imo }], function (response) {
			if (parseResponse(response)) {
				vessel2 = {};
				for (var i = 0; i < response.Result.fields.length; ++i) {
					vessel2[response.Result.fields[i]] = response.Result.values[0][i];
				}moreInfo(formatVessel(vessel2));
				$('.date', titlebar).html('<span class="utc">' + vessel2.ts_pos_utc + ' UTC</span>' + vessel2.ts_pos_loc);
				if (typeof getmore == "function") getmore(vessel2);
			} else console.log(response);
		});
	
		// IMAGE	
		var scheme = document.location.href.replace(/^(https?:).+/, "$1");
		$('<img src="' + scheme + '//photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi=' + vessel.mmsi + '">').load(function () {
			if (this) $('div', photo).replaceWith(this);
		});
	
		// BUTTONS
		var menubuttons = $('<div class="menubuttons"></div>').appendTo(buttons);
	
		var openpage = $('<div class="button openpage" title="информация о судне">' + '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' + '<g class="nc-icon-wrapper" style="fill:currentColor">' + '<path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>' + '</g>' + '</svg>' + '</div>').appendTo(menubuttons).on('click', function () {
			return commands.openVesselInfoScreen.call(null, vessel, vessel2);
		});
	
		var showpos = $('<div class="button showpos" title="показать положение">' + '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" width="20" height="20"><g class="nc-icon-wrapper" fill="#444444"><polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 1,7 1,1 7,1 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 17,1 23,1 23,7 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 23,17 23,23 17,23 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 7,23 1,23 1,17 " stroke-linejoin="miter"/> <rect style="stroke:currentColor" x="8" y="8" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" width="8" height="8" stroke-linejoin="miter"/></g></svg>' + '</div>').appendTo(menubuttons).on('click', function () {
			if (!vessel.ts_pos_org) vessel.ts_pos_org = vessel.ts_pos_utc;
			commands.showPosition(vessel);
			if (!showtrack.is('.active')) showtrack.click();
		});
		//if (tracksLayer){
		var templ = '<div class="button showtrack" title="' + _gtxt('AISSearch2.show_track') + '">' + '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" width="20" height="20"><g class="nc-icon-wrapper" fill="#444444"><path style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" d="M4,13V5 c0-2.209,1.791-4,4-4h0c2.209,0,4,1.791,4,4v14c0,2.209,1.791,4,4,4h0c2.209,0,4-1.791,4-4v-8" stroke-linejoin="miter"/> <circle style="stroke:currentColor" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" cx="20" cy="4" r="3" stroke-linejoin="miter"/> <circle style="stroke:currentColor" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" cx="4" cy="20" r="3" stroke-linejoin="miter"/></g></svg>' + '</div>',
		    activateTrackBut = function activateTrackBut() {
			$('.showtrack').attr('title', _gtxt('AISSearch2.show_track')).removeClass('active');
			showtrack.attr('title', _gtxt('AISSearch2.hide_track')).addClass('ais active');
		},
		    showtrack = $(templ).appendTo(menubuttons).on('click', function () {
			if (showtrack.attr('title') != _gtxt('AISSearch2.hide_track')) {
				commands.showTrack.call(null, [vessel.mmsi]);
				activateTrackBut();
			} else {
				$('.showtrack').attr('title', _gtxt('AISSearch2.show_track')).removeClass('ais active');
				commands.showTrack.call(null, []);
			}
		});
		if (!displaingTrack.mmsi || displaingTrack.mmsi != vessel.mmsi) {
			showtrack.attr('title', _gtxt('AISSearch2.show_track'));
		} else {
			showtrack.attr('title', _gtxt('AISSearch2.hide_track')).addClass('ais active');
		}
		//}
	
		var addremoveIcon = function addremoveIcon(add) {
			return add ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g class="nc-icon-wrapper" fill="#444444" style="fill: currentColor;"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></g></svg>' : '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;fill: currentColor;" xml:space="preserve"><g><path class="st0" d="M4,6H2v14c0,1.1,0.9,2,2,2h14v-2H4V6z M20,2H8C6.9,2,6,2.9,6,4v12c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4    C22,2.9,21.1,2,20,2z M19,11h-4v4h-2v-4H9V9h4V5h2v4h4V11z"/></g><rect x="9" y="5" class="st0" width="10" height="4"/><rect x="9" y="11" class="st0" width="10" height="4"/></g></svg>';
		};
		if (myFleetMembersModel && myFleetMembersModel.data && myFleetMembersModel.data.vessels) {
			var addremove = $('<div class="button addremove">' + addremoveIcon(add) + '</div>')
			//.css('background-image','url('+modulePath+'svg/'+(add?'add':'rem')+'-my-fleet.svg)')
			.attr('title', add ? 'добавить в мой флот' : 'удалить из моего флота').appendTo(menubuttons);
			if (myFleetMembersModel.filterUpdating) addremove.addClass('disabled');
			addremove.on('click', function () {
				if (addremove.is('.disabled')) return;
	
				$('.addremove').addClass('disabled');
				addremove.hide();
				progress.append(gifLoader);
	
				myFleetMembersModel.changeFilter(vessel).then(function () {
					add = myFleetMembersModel.findIndex(vessel) < 0;
					var info = $('.icon-ship[vessel="' + vessel.mmsi + ' ' + vessel.imo + '"]');
					info.css('visibility', !add ? 'visible' : 'hidden');
					$('.vessel_prop.vname svg', canvas).css('visibility', add ? 'hidden' : 'visible');
	
					addremove.attr('title', add ? 'добавить в мой флот' : 'удалить из моего флота').html(addremoveIcon(add));
					//.css('background-image','url('+modulePath+'svg/'+(add?'add':'rem')+'-my-fleet.svg)')
	
					progress.text('');
					$('.addremove').removeClass('disabled').show();
					if (myFleetMembersView.isActive) myFleetMembersView.show();
				});
			});
		}
	
		var progress = $('<div class="progress"></div>').appendTo(menubuttons);
	
		// TITLEBAR	
		canvas.parent('div').css({ 'margin': '0', 'overflow': 'hidden' });
		var titlebar = $(dialog).parent().find('.ui-dialog-titlebar').css('padding', '0').html('<table class="ais_info_dialog_titlebar">' + '<tr><td><div class="date">' + (!getmore ? Handlebars.compile('<span class="utc">{{{ts_pos_utc}}} UTC</span>{{{ts_pos_loc}}}')(vessel2 ? vessel2 : vessel) : '') + '</div></td>' + '<td><div class="choose done"><span unselectable="on" class="chooser">Общие сведения</span></div></td>' + '<td><div class="choose"><span unselectable="on" class="chooser">Параметры движении</span></div></td>' + '<td id="closebut"><div class="ais_info_dialog_close-button" title="закрыть"></div></td></tr>' + '</table>'),
		    onDone = function onDone(e) {
			e.stopPropagation();$('.choose', titlebar).removeClass('done');$(e.currentTarget).parent().addClass('done');
		};
	
		$('.ais_info_dialog_close-button', titlebar).on('click', function () {
			return $(dialog).dialog("close");
		});
		$('.chooser', titlebar).eq(0).on('mousedown', function (e) {
			onDone(e);$('.vessel_props1', canvas).show();$('.vessel_props2', canvas).hide();
		});
		$('.chooser', titlebar).eq(1).on('mousedown', function (e) {
			onDone(e);$('.vessel_props2', canvas).show();$('.vessel_props1', canvas).hide();
		});
		$('.date span', titlebar).on('mousedown', function (e) {
			e.stopPropagation();
		});
	
		//$( dialog ).on( "dialogdragstart", function( e, ui ) {console.log(e);console.log(ui)} );
	
		return dialog;
	};

/***/ }),
/* 18 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 19 */
/***/ (function(module, exports) {

	"use strict";
	
	//************************************
	// VESSEL INFO VIEW
	//************************************  
	
	module.exports = function (_ref) {
	    var modulePath = _ref.modulePath,
	        aisServices = _ref.aisServices;
	
	    var _ais,
	        _galery,
	        _register,
	        _regcap,
	        _leftPanel,
	        _minh,
	        resize,
	        menuAction,
	        scheme = document.location.href.replace(/^(https?:).+/, "$1"),
	        show = function show(vessel) {
	        //console.log(vessel) 
	        $("body").append('' + '<table class="vessel-info-page overlay">' + '<tr>' + '<td>' + '<table class="vessel-info-page container">' + '<tr>' + '<td class="column1">' + '<table>' + '<tr>' + '<td>' + '<div>' + '<div class="title">' + '<div class="cell">' + vessel.vessel_name + '<div class="timestamp">' + vessel.ts_pos_utc + '</div></div>  ' + '</div>' + '<div class="menu">' + '<div class="ais cell menu-item active"><img src="' + modulePath + 'svg/info_gen.svg" class="icon">Основные сведения</div>' + '<div class="register cell menu-item"><img src="' + modulePath + 'svg/info.svg" class="icon">Регистр</div>' + '<div class="galery cell menu-item"><img src="' + modulePath + 'svg/photogallery.svg" class="icon">Фотогалерея <div class="counter">0</div></div>' + '</div>' + '</div>  ' + '</td>' + '</tr>' + '<tr>' + '<td class="frame">' + '<div class="photo">' + '<img src="' + modulePath + 'svg/no-image.svg" class="no-image">' + '</div>  ' + '</td>' + '</tr>' + '</table>' + '</td>' + '<td class="column2">' + '<div class="close-button-holder">' + '<div class="close-button" title="закрыть"></div>' + '</div>' + '<div class="register panel">' + '<div class="caption"></div>' + '<div class="menu">' + '<div>' + '<table>' + '<tr>' + '<td><div class="general menu-item active">Общие сведения</div></td>' + '<td><div class="build menu-item">Сведения о постройке</div></td>' + '<td><div class="dimensions menu-item">Размеры и скорость</div></td>' + '<td><div class="gears menu-item">Оборудование</div></td>' + '</tr>' + '</table>' + '</div>' + '</div>' + '<div class="content">' + '<div class="placeholder"></div>' + '</div>' + '</div>' + '<div class="galery panel">' + '<form action="' + aisServices + 'Upload.ashx" class="uploadFile" method="post" enctype="multipart/form-data" target="upload_target" style="display:none" >' + '<input name="Filedata" class="chooseFile" type="file">' + '<input name="imo" type="hidden" value="' + vessel.imo + '">' + '<input name="mmsi" type="hidden" value="' + vessel.mmsi + '">' +
	        //'<input type="submit" name="submitBtn" value="Upload" />' +
	        '</form>' + '<iframe id="upload_target" name="upload_target" src="#" style="width:0;height:0;border:0px solid #fff;"></iframe>' + '<div class="placeholder">' + '<div class="photo" onclick="document.querySelector(\'.vessel-info-page .chooseFile\').click();"' + ' style="background-image: url(' + modulePath + 'svg/add-image.svg);background-size: 50px;"></div>' + '</div>' + '</div>' + '<div class="ais panel">' + '<div class="placeholder"></div>' + '</div>' + '</td>' + '</tr>' + '</table>' + '</td>' + '</tr>' + '</table>');
	        window.addEventListener("message", function (e) {
	            if (e.data.search(/"uploaded"\:/) < 0) return;
	            var data = JSON.parse(e.data);
	            if (data.id && parseInt(data.id)) {
	                //uploaded:
	                //console.log('UPLOADED '+id)
	                var counter = $('.vessel-info-page .menu-item .counter'),
	                    count = parseInt(counter.text()) + 1;
	                counter.text(count).css('display', 'inline');
	                var preview = $("<div class='photo preview' id='" + data.id + "' style='background-image: url(" + aisServices + "getphoto.ashx?id=" + data.id + ")'/>");
	                $('.vessel-info-page .uploader').replaceWith(preview);
	                preview.click(showPicture);
	                //console.log(preview)
	            } else {
	                //uploadError:            
	                $('.vessel-info-page .uploader').remove();
	                console.log(data.errmsg);
	            }
	        }, false);
	
	        $('<img src="' + scheme + '//photos.marinetraffic.com/ais/showphoto.aspx?mmsi=' + vessel.mmsi + '">').load(function () {
	            if (this) {
	                $('.column1 .photo img.no-image').replaceWith(this);
	            }
	        });
	        $('.vessel-info-page .chooseFile').change(function () {
	            $('<div class="photo uploader" style="background-image:url(img/progress.gif);background-size:20px;"></div>').insertAfter($('.vessel-info-page .galery .placeholder .photo').eq(0));
	            $('.vessel-info-page .uploadFile')[0].submit();
	        });
	        $('.vessel-info-page .close-button').click(function () {
	            $('.vessel-info-page.overlay').remove();
	        });
	        /**/
	        $('.vessel-info-page .menu img[src$=".svg"]').each(function () {
	            var $img = jQuery(this);
	            var imgURL = $img.attr('src');
	            var attributes = $img.prop("attributes");
	
	            $.get(imgURL, function (data) {
	                // Get the SVG tag, ignore the rest
	                var $svg = jQuery(data).find('svg');
	
	                // Remove any invalid XML tags
	                $svg = $svg.removeAttr('xmlns:a');
	
	                // Loop through IMG attributes and apply on SVG
	                $.each(attributes, function () {
	                    $svg.attr(this.name, this.value);
	                });
	
	                // Replace IMG with SVG
	                $img.replaceWith($svg);
	            }, 'xml');
	        });
	
	        _ais = document.querySelector('.vessel-info-page .column2 .ais');
	        _galery = document.querySelector('.vessel-info-page .column2 .galery');
	        _register = document.querySelector('.vessel-info-page .column2 .register .content');
	        _regcap = document.querySelector('.vessel-info-page .column2 .register .caption');
	        _leftPanel = document.querySelector('.vessel-info-page .column1 table');
	        _minh = 420;
	        resize = function resize() {
	            var h = Math.floor(window.innerHeight * 0.8);
	            if (h > _minh) {
	                _leftPanel.style.height = _ais.style.height = _galery.style.height = h + "px";
	                _register.style.height = h - _regcap.offsetHeight + "px";
	            } else {
	                _leftPanel.style.height = _ais.style.height = _galery.style.height = _minh + "px";
	                _register.style.height = _minh - _regcap.offsetHeight + "px";
	            }
	        };
	        menuAction = function menuAction(e) {
	            var target = e.currentTarget,
	                p = target.parentElement,
	                mia;
	            while (!(mia = p.querySelectorAll('.menu-item')) || mia.length < 2) {
	                p = p.parentElement;
	            }
	            for (var j = 0; j < mia.length; ++j) {
	                //console.log( mia[j])
	                mia[j].className = mia[j].className.replace(/ active/, "");
	                var panel = document.querySelector('.panel.' + mia[j].classList[0]);
	                if (panel) {
	                    if (mia[j] != target) panel.style.display = "none";else {
	                        panel.style.display = "block";
	                    }
	                }
	            }
	            target.className += " active";
	            resize();
	        };
	
	        window.addEventListener("resize", resize, false);
	
	        var mia = document.querySelectorAll('.column1 .menu-item');
	        for (var i = 0; i < mia.length; ++i) {
	            mia[i].addEventListener('click', menuAction);
	        }
	
	        resize();
	        $(_ais).mCustomScrollbar({ theme: "vessel-info-theme" });
	        $(_galery).mCustomScrollbar({ theme: "vessel-info-theme" });
	        $(_register).mCustomScrollbar({ theme: "vessel-info-theme" });
	        document.querySelector('.vessel-info-page .container').style.display = "table";
	    },
	        showPicture = function showPicture() {
	        //console.log($(this))
	        $('.vessel-info-page .picture').remove();
	        var div = $('<div class="picture" style="display:none;position:absolute;"></div>').insertAfter('.vessel-info-page.container').click(function () {
	            this.remove();
	        });
	        $('<img src="' + aisServices + 'getphoto.ashx?id=' + this.id + '">').load(function () {
	            if (this) {
	                var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth,
	                    h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	                div.append(this).css('display', 'table').offset({
	                    left: (w - this.offsetWidth) / 2,
	                    top: (h - this.offsetHeight) / 2 });
	                //console.log($(this))
	                //console.log(window.screen.width+"-"+$(this)[0].offsetWidth)
	                //console.log((window.screen.width-$(this)[0].offsetWidth)/2)
	            }
	        });
	    },
	        drawGallery = function drawGallery(gallery) {
	        if (gallery.length > 0) $('.vessel-info-page .menu-item .counter').text(gallery.length).css('display', 'inline');
	        var galcontent = $(".vessel-info-page .galery .placeholder");
	        for (var i = 0; i < gallery.length; ++i) {
	            galcontent.append("<div class='photo preview' id='" + gallery[i] + "' style='background-image: url(" + aisServices + "getphoto.ashx?id=" + gallery[i] + ")'/>");
	        }$('.photo.preview').click(showPicture);
	        resize();
	    },
	        drawAis = function drawAis(ledokol) {
	        var aiscontent = document.querySelector(".vessel-info-page .ais .placeholder");
	        aiscontent.innerHTML = "" + "<div class='caption'><div>ИНФОРМАЦИЯ О СУДНЕ</div></div>" + "<table>" + "<tr><td>Название судна</td><td><b>" + ledokol.vessel_name + (ledokol.registry_name ? " (" + ledokol.registry_name + ")" : "") + "</b></td></tr>" + "<tr><td>IMO</td><td>" + ledokol.imo + "</td></tr>" + "<tr><td>MMSI</td><td>" + ledokol.mmsi + "</td></tr>" + "<tr><td>Тип</td><td>" + ledokol.vessel_type + "</td></tr>" + "<tr><td>Флаг</td><td>" + ledokol.flag_country + "</td></tr>" + "<tr><td>Позывной</td><td>" + ledokol.callsign + "</td></tr>" + "<tr><td>Длина</td><td>" + ledokol.length + "</td></tr>" + "<tr><td>Ширина</td><td>" + ledokol.width + "</td></tr>" + "</table>" + "<div class='caption'><div>СВЕДЕНИЯ О ДВИЖЕНИИ</div></div>" + "<table>" + "<tr><td>Навигационный статус</td><td>" + ledokol.nav_status + "</td></tr>" + "<tr><td>COG</td><td>" + ledokol.cog + "</td></tr>" + "<tr><td>SOG</td><td>" + ledokol.sog + "</td></tr>" + "<tr><td>HDG</td><td>" + ledokol.heading + "</td></tr>" + "<tr><td>ROT</td><td>" + ledokol.rot + "</td></tr>" + "<tr><td>Осадка</td><td>" + ledokol.draught + "</td></tr>" + "<tr><td>Назначение</td><td>" + ledokol.destination + "</td></tr>" + "<tr><td>Расчетное время прибытия</td><td>" + ledokol.ts_eta + "</td></tr>" + "</table>";
	        resize();
	    },
	        drawRegister = function drawRegister(ledokol) {
	        var regcontent = _register.querySelector(".placeholder"),
	            drawTable = function drawTable(groups, article, display) {
	            var s = "<div class='panel " + article + " article' style='display:" + display + "'>";
	            for (var i = 0; i < groups.length; ++i) {
	                s += "<div class='group'>" + groups[i].name + "</div><table>";
	                for (var j = 0; j < groups[i].properties.length; ++j) {
	                    var pn = groups[i].properties[j].name,
	                        pv = groups[i].properties[j].value;
	                    s += "<tr><td>" + pn + "</td><td>" + (pn == "Название судна" || pn == "Латинское название" ? "<b>" + pv + "</b>" : pv) + "</td></tr>";
	                }
	                s += "</table>";
	            }
	            s += "</div>";
	            return s;
	        };
	        regcontent.innerHTML = drawTable([ledokol.data[0], ledokol.data[1], ledokol.data[9]], "general", "block") + drawTable([ledokol.data[2]], "build", "none") + drawTable([ledokol.data[3]], "dimensions", "none") + drawTable([ledokol.data[4], ledokol.data[5], ledokol.data[6], ledokol.data[7], ledokol.data[8]], "gears", "none");
	
	        _regcap.innerHTML = "<table><tr><td>Обновление базы данных " + ledokol.version.replace(/ \S+$/g, '') + "</td></tr></table>";
	
	        var mia = document.querySelectorAll('.column2 .menu-item');
	        for (var i = 0; i < mia.length; ++i) {
	            mia[i].addEventListener('click', menuAction);
	        }
	
	        resize();
	    };
	
	    var open = function open(vessel, vessel2) {
	        show(vessel2);
	        var onFail = function onFail(error) {
	            if (error != 'register_no_data') console.log(error);
	        };
	        new Promise(function (resolve, reject) {
	            (function wait() {
	                if (!vessel2) setTimeout(wait, 100);
	            })();
	            resolve(vessel2);
	        }).then(function (ship) {
	            //console.log(ship)
	            drawAis(ship);
	        }, onFail);
	        var registerServerUrl = scheme + "//kosmosnimki.ru/demo/register/api/v1/";
	        if (vessel.imo && vessel.imo != 0 && vessel.imo != -1) fetch(registerServerUrl + "Ship/Search/" + vessel.imo + "/ru").then(function (response) {
	            return response.json();
	        }).then(function (ship) {
	            if (ship.length > 0) return fetch(registerServerUrl + "Ship/Get/" + ship[0].RS + "/ru");else return Promise.reject('register_no_data');
	        }).then(function (response) {
	            return response.json();
	        }).then(function (ship) {
	            //console.log(ship)
	            drawRegister(ship);
	        }).catch(onFail);
	
	        new Promise(function (resolve, reject) {
	            sendCrossDomainJSONRequest(aisServices + "gallery.ashx?mmsi=" + vessel.mmsi + "&imo=" + vessel.imo, function (response) {
	                if (response.Status == "ok") resolve(response.Result);else reject(response);
	            });
	        }).then(function (gallery) {
	            drawGallery(gallery);
	        }, onFail);
	    };
	
	    return {
	        open: open,
	        show: show,
	        drawRegister: drawRegister,
	        drawAis: drawAis,
	        drawGallery: drawGallery
	    };
	};

/***/ }),
/* 20 */
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
	        searchPositionsAgg: function searchPositionsAgg(vessels, dateInterval, callback) {
	            //console.log("searchById");
	            var request = {
	                WrapStyle: 'window',
	                layer: _historyLayer, //'8EE2C7996800458AAF70BABB43321FA4',//
	                orderdirection: 'desc',
	                orderby: 'ts_pos_utc',
	                columns: '[{"Value":"mmsi"},{"Value":"ts_pos_utc"},{"Value":"cog"},{"Value":"sog"},{"Value":"draught"},{"Value":"vessel_type"},' + '{"Value":"destination"},{"Value":"ts_eta"},{"Value":"nav_status"},{"Value":"heading"},{"Value":"rot"},{"Value":"longitude"},{"Value":"latitude"}]',
	
	                query: "([mmsi] IN (" + vessels.join(',') + ")) and '" + dateInterval.dateBegin.toISOString() + "'<=[ts_pos_utc] and [ts_pos_utc]<'" + dateInterval.dateEnd.toISOString() + "'"
	            };
	            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
	        },
	        searchPositions: function searchPositions(vessels, dateInterval, callback) {
	            //console.log("searchById");
	            var request = {
	                WrapStyle: 'window',
	                layer: _historyLayer, //'8EE2C7996800458AAF70BABB43321FA4',//
	                //orderdirection: 'desc',
	                //orderby: 'ts_pos_utc',
	                query: "([mmsi] IN (" + vessels.join(',') + ")) and '" + dateInterval.dateBegin.toISOString() + "'<=[ts_pos_utc] and [ts_pos_utc]<'" + dateInterval.dateEnd.toISOString() + "'"
	            };
	            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
	        },
	        searchById: function searchById(aid, callback) {
	            //console.log("searchById");
	            var request = {
	                WrapStyle: 'window',
	                layer: _aisLayerID, //'8EE2C7996800458AAF70BABB43321FA4'
	                columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"longitude"},{"Value":"latitude"}]',
	                query: "([id] IN (" + aid.join(',') + "))"
	            };
	            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
	        },
	        searchString: function searchString(_searchString, isfuzzy, callback) {
	            //console.log(_aisLastPoint+", "+_aisLayerID)
	            var query = "";
	            if (_searchString) {
	                _searchString = _searchString.toUpperCase();
	                if (_searchString.search(/[^\d, ]/) === -1) {
	                    var arr = _searchString.replace(/ /g, '').split(/,/);
	                    query = "([mmsi] IN (" + arr.join(',') + "))" + "OR ([imo] IN (" + arr.join(',') + "))";
	                } else {
	                    if (isfuzzy) query = '([vessel_name] startswith \'' + _searchString + '\') OR ([vessel_name] contains \' ' + _searchString + '\')';else query = '([vessel_name] startswith \'' + _searchString + '\') OR ([vessel_name] contains \' ' + _searchString + '\')';
	                }
	            }
	            var request = {
	                WrapStyle: 'window',
	                layer: _aisLastPoint,
	                columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"vessel_type"},{"Value":"longitude"},{"Value":"latitude"}]',
	                //orderdirection: 'desc',
	                orderby: 'vessel_name',
	                query: query
	            };
	            if (isfuzzy) request.pagesize = 1000;
	            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
	        },
	        searchNames: function searchNames(avessels, callback) {
	            var request = {
	                WrapStyle: 'window',
	                layer: _aisLastPoint,
	                orderdirection: 'desc',
	                orderby: 'ts_pos_utc',
	                query: avessels.map(function (v) {
	                    return "([mmsi]=" + v.mmsi + (v.imo && v.imo != "" ? " and [imo]=" + v.imo : "") + ")";
	                }).join(" or ")
	                //([mmsi] IN (" + ammsi.join(',') + "))"+
	                //"and ([imo] IN (" + aimo.join(',') + "))"
	            };
	            //console.log(request)
	            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
	        },
	        searchScreen: function searchScreen(options, callback) {
	            var lmap = nsGmx.leafletMap;
	            var dt1 = options.dateInterval.get('dateBegin'),
	                dt2 = options.dateInterval.get('dateEnd');
	            //query += '([' + TemporalColumnName + '] >= \'' + dt1.toJSON() + '\')';
	            //query += ' and ([' + TemporalColumnName + '] < \'' + dt2.toJSON() + '\')';
	            var latLngBounds = lmap.getBounds(),
	                sw = latLngBounds.getSouthWest(),
	                ne = latLngBounds.getNorthEast(),
	                min = { x: sw.lng, y: sw.lat },
	                max = { x: ne.lng, y: ne.lat };
	            //console.log(min);
	            //console.log(max);
	            L.gmxUtil.sendCrossDomainPostRequest(_aisServices + "SearchScreen.ashx", { WrapStyle: 'window', s: dt1.toJSON(), e: dt2.toJSON(), minx: min.x, miny: min.y, maxx: max.x, maxy: max.y, layer: _screenSearchLayer }, callback);
	        }
	    };
	};

/***/ }),
/* 21 */
/***/ (function(module, exports) {

	"use strict";
	
	module.exports = function (options) {
	    var _layersByID = nsGmx.gmxMap.layersByID,
	        _aisLayer = _layersByID[options.aisLayerID],
	        _tracksLayer = _layersByID[options.tracksLayerID];
	    var _displaingTrack = { mmsi: null };
	
	    return {
	        displaingTrack: _displaingTrack,
	        showTrack: function showTrack(mmsiArr, bbox) {
	            var lmap = nsGmx.leafletMap;
	            var filterFunc = function filterFunc(args) {
	                var mmsi = args.properties[1],
	                    i,
	                    len;
	                for (i = 0, len = mmsiArr.length; i < len; i++) {
	                    if (mmsi === mmsiArr[i]) {
	                        return true;
	                    }
	                }
	                return false;
	            };
	            if (bbox) {
	                lmap.fitBounds(bbox, { maxZoom: 11 });
	            }
	            // console.log(_aisLayer._gmx.layerID)
	            // console.log(_tracksLayer._gmx.layerID)
	            if (_aisLayer) {
	                if (mmsiArr.length) {
	                    _displaingTrack.mmsi = mmsiArr[0];
	                    _aisLayer.setFilter(filterFunc);
	                    if (!_aisLayer._map) {
	                        lmap.addLayer(_aisLayer);
	                    }
	                } else {
	                    _displaingTrack.mmsi = null;
	                    _aisLayer.removeFilter();
	                    lmap.removeLayer(_aisLayer);
	                }
	            }
	            if (_tracksLayer) {
	                if (mmsiArr.length) {
	                    _tracksLayer.setFilter(filterFunc);
	                    if (!_tracksLayer._map) {
	                        lmap.addLayer(_tracksLayer);
	                    }
	                } else {
	                    _tracksLayer.removeFilter();
	                    lmap.removeLayer(_tracksLayer);
	                }
	            }
	        }
	    };
	};

/***/ })
/******/ ]);
//# sourceMappingURL=AISSearch2.js.map