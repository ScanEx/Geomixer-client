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
	    SIDEBAR2 = false,
	    BETA = false;
	if (false) NOSIDEBAR = true;
	if (true) SIDEBAR2 = true;
	if (true) PRODUCTION = true;
	if (true) BETA = true;
	
	__webpack_require__(1);
	__webpack_require__(3);
	__webpack_require__(4);
	__webpack_require__(5);
	
	Handlebars.registerHelper('aisinfoid', function (context) {
	    return context.mmsi + " " + context.imo;
	});
	
	Handlebars.registerHelper('aisjson', function (context) {
	    return JSON.stringify(context);
	});
	
	var pluginName = PRODUCTION ? BETA ? 'AISPluginBeta' : 'AISPlugin' : 'AISSearch2Test',
	    menuId = 'AISSearch',
	    toolbarIconId = null,
	    cssTable = PRODUCTION ? BETA ? 'AISPluginBeta' : 'AISPlugin' : 'AISSearch2',
	    modulePath = gmxCore.getModulePath(pluginName);
	
	var highlight = L.marker([0, 0], { icon: L.icon({
	        className: "ais_highlight-icon",
	        iconAnchor: [12, 12],
	        iconSize: [25, 25],
	        iconUrl: 'plugins/ais/aissearch/highlight.png' }), zIndexOffset: 1000 });
	
	var AisPluginPanel = __webpack_require__(6),
	    ViewsFactory = __webpack_require__(7);
	var publicInterface = {
	    pluginName: pluginName,
	    afterViewer: function afterViewer(params, map) {
	        var options = {
	            aisLayerID: params.aisLayerID, // || '8EE2C7996800458AAF70BABB43321FA4',	// searchById			
	            screenSearchLayer: params.searchLayer, // || '8EE2C7996800458AAF70BABB43321FA4', // screen search				
	            aisLastPoint: params.aisLastPoint || '303F8834DEE2449DAF1DA9CD64B748FE', // db search
	            historyLayer: params.historyLayer,
	            tracksLayerID: params.tracksLayerID || '13E2051DFEE04EEF997DC5733BD69A15',
	
	            lastPointLayerAlt: params.lastPointLayerAlt,
	            tracksLayerAlt: params.tracksLayerAlt,
	            historyLayerAlt: params.historyLayerAlt,
	
	            modulePath: modulePath,
	            highlight: highlight,
	            menuId: menuId
	        };
	        for (var key in params) {
	            if (key.toLowerCase() == "myfleet") {
	                options.myFleetLayers = params[key].split(",").map(function (id) {
	                    return id.replace(/\s/, "");
	                });
	                break;
	            }
	        }var viewFactory = new ViewsFactory(options);
	        var layersByID = nsGmx.gmxMap.layersByID,
	            setLayerClickHandler = function setLayerClickHandler(layer) {
	            layer.removeEventListener('click');
	            layer.addEventListener('click', function (e) {
	                //console.log(e)
	                if (e.gmx && e.gmx.properties.hasOwnProperty("imo")) viewFactory.infoDialogView.show(e.gmx.properties);
	            });
	        },
	            forLayers = function forLayers(layer) {
	            try {
	                if (layer) {
	                    //setLocaleDate(layer)
	                    setLayerClickHandler(layer);
	                }
	            } catch (e) {}
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
	            aisPluginPanel.sidebarPane = sidebar.setPane(menuId, {
	                position: params.showOnTop ? -100 : 0,
	                createTab: window.createTabFunction({
	                    icon: menuId,
	                    active: "ais_sidebar-icon-active",
	                    inactive: "ais_sidebar-icon",
	                    hint: _gtxt('AISSearch2.caption')
	                })
	            });
	            sidebar.addEventListener('opened', function (e) {
	                if (sidebar._activeTabId == menuId) aisPluginPanel.show();
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
	    'AISSearch2.vesselExclude': 'исключить',
	    'AISSearch2.myFleetMembers': 'Состав',
	    'AISSearch2.myFleetMember': 'мой флот',
	    'AISSearch2.info': 'информация',
	    'AISSearch2.position': 'положение',
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
	    'AISSearch2.vessel_info': 'ИНФОРМАЦИЯ О СУДНЕ',
	    'AISSearch2.vessel_voyage': 'СВЕДЕНИЯ О ДВИЖЕНИИ',
	    'AISSearch2.vessel_name': 'Название',
	    'AISSearch2.mmsi': 'MMSI',
	    'AISSearch2.imo': 'IMO',
	    'AISSearch2.flag_country': 'Страна',
	    'AISSearch2.vessel_type': 'Тип судна',
	    'AISSearch2.flag': 'Флаг',
	    'AISSearch2.callsign': 'Позывной',
	    'AISSearch2.length': 'Длина',
	    'AISSearch2.width': 'Ширина',
	    'AISSearch2.draught': 'Осадка',
	    'AISSearch2.destination': 'Назначение',
	    'AISSearch2.eta': 'Расчетное время прибытия',
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
	    'AISSearch2.MyFleetTab': 'МОЙ ФЛОТ',
	    'AISSearch2.dailyTrack': 'трек за сутки',
	    'AISSearch2.allDailyTracks': 'все треки',
	    'AISSearch2.myFleetOnly': 'только мой флот',
	    'AISSearch2.show_pos': 'показать положение и историю',
	    'AISSearch2.show_info': 'информация о судне',
	    'AISSearch2.time_switch': 'Время',
	    'AISSearch2.time_local': 'Местное',
	    'AISSearch2.legend_switch': 'Легенда судов',
	    'AISSearch2.legend_type': 'По типу',
	    'AISSearch2.legend_speed': 'По скорости',
	    'AISSearch2.calendar_today': 'сегодня',
	    'AISSearh2.searchresults_view': 'Здесь будут отображаться<br>результаты поиска по названию,<br>IMO илм MMSI судна',
	    'AISSearh2.myfleet_view': 'Здесь будут отображаться<br>выбранные суда<br>',
	    'AISSearch2.dialog_tab_general': 'Общие сведения',
	    'AISSearch2.dialog_tab_params': 'Параметры движения',
	    'AISSearch2.close_but': 'закрыть',
	    'AISSearch2.myfleet_add': 'добавить в мой флот',
	    'AISSearch2.myfleet_remove': 'удалить из моего флота',
	    'AISSearch2.infoscreen_gen': 'Основные сведения',
	    'AISSearch2.infoscreen_reg': 'Регистр',
	    'AISSearch2.infoscreen_gal': 'Фотогалерея',
	    'AISSearch2.last_update': 'Обновление базы данных',
	    'AISSearch2.reg_general_tab': 'Общие сведения',
	    'AISSearch2.reg_build_tab': 'Сведения о постройке',
	    'AISSearch2.reg_chars_tab': 'Размеры и скорость',
	    'AISSearch2.reg_devs_tab': 'Оборудование',
	    'AISSearch2.rmrs': 'РМРС',
	    'AISSearch2.AddIntoGroup': 'Добавить в группу:',
	    'AISSearch2.RemoveFromGroup': 'Удалить из группы',
	    'AISSearch2.AllGroup': 'Все',
	    'AISSearch2.NewGroup': 'Новая группа',
	    'AISSearch2.NewGroupName': 'название',
	    'AISSearch2.CreateGroup': 'создать',
	    'AISSearch2.DeleteGroup': 'удалить группу',
	    'AISSearch2.DeleteGroupCommand': 'Удалить группу',
	    'AISSearch2.DisplaySection': 'Показать на карте:',
	    'AISSearch2.DisplayVesselName': 'название судна',
	    'AISSearch2.DisplayGroupName': 'название группы',
	    'AISSearch2.DisplayCog': 'курс',
	    'AISSearch2.DisplaySog': 'скорость',
	    'AISSearch2.KnotShort': ' уз',
	    'AISSearch2.thisVesselOnly': 'Только это судно: ',
	    'AISSearch2.allTracks': 'Треки всех судов: ',
	    'AISSearch2.markerShadow': 'Цвет обводки маркера',
	    'AISSearch2.labelColor': 'Цвет подписи маркера',
	    'AISSearch2.labelShadow': 'Цвет обводки подписи',
	    'AISSearch2.zoomin_com': 'Увеличить',
	    'AISSearch2.zoomout_com': 'Уменьшить',
	    'AISSearch2.image1_com': 'Изображение 1',
	    'AISSearch2.image2_com': 'Изображение 2',
	    'AISSearch2.twoimages_com': 'Два изображения',
	    'AISSearch2.close_com': 'Закрыть'
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
	    'AISSearch2.vesselExclude': 'exclude',
	    'AISSearch2.myFleetMembers': 'Members',
	    'AISSearch2.myFleetMember': 'my fleet',
	    'AISSearch2.info': 'info',
	    'AISSearch2.position': 'position',
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
	    'AISSearch2.vessel_info': 'VESSEL INFORMATION',
	    'AISSearch2.vessel_voyage': 'VOYAGE INFORMATION',
	    'AISSearch2.vessel_name': 'Name',
	    'AISSearch2.mmsi': 'MMSI',
	    'AISSearch2.imo': 'IMO',
	    'AISSearch2.flag_country': 'Flag',
	    'AISSearch2.vessel_type': 'Vessel type',
	    'AISSearch2.flag': 'Flag',
	    'AISSearch2.callsign': 'Callsign',
	    'AISSearch2.length': 'Length',
	    'AISSearch2.width': 'Width',
	    'AISSearch2.draught': 'Draught',
	    'AISSearch2.destination': 'Destination',
	    'AISSearch2.eta': 'ETA',
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
	    'AISSearch2.voyageInfo': 'Voyage Info',
	    'AISSearch2.DbSearchTab': 'DATA BASE',
	    'AISSearch2.ScreenSearchTab': 'VESSELS ON SCREEN',
	    'AISSearch2.MyFleetTab': 'MY FLEET',
	    'AISSearch2.dailyTrack': 'daily track',
	    'AISSearch2.allDailyTracks': 'all tracks',
	    'AISSearch2.myFleetOnly': 'my fleet only',
	    'AISSearch2.show_pos': 'position and history',
	    'AISSearch2.show_info': 'vessel data',
	    'AISSearch2.time_switch': 'Time',
	    'AISSearch2.time_local': 'Local',
	    'AISSearch2.legend_switch': 'Vessel legend',
	    'AISSearch2.legend_type': 'Type',
	    'AISSearch2.legend_speed': 'Speed',
	    'AISSearch2.calendar_today': 'today',
	    'AISSearh2.searchresults_view': 'Results View of Vessel Search<br>by Name,IMO or MMSI',
	    'AISSearh2.myfleet_view': 'List of Special Selected<br>Vessels<br>',
	    'AISSearch2.dialog_tab_general': 'General',
	    'AISSearch2.dialog_tab_params': 'Parameters',
	    'AISSearch2.close_but': 'close',
	    'AISSearch2.myfleet_add': 'include in my fleet',
	    'AISSearch2.myfleet_remove': 'exclude from my fleet',
	    'AISSearch2.infoscreen_gen': 'General',
	    'AISSearch2.infoscreen_reg': 'Register',
	    'AISSearch2.infoscreen_gal': 'Gallery',
	    'AISSearch2.last_update': 'Last update',
	    'AISSearch2.reg_general_tab': 'General',
	    'AISSearch2.reg_build_tab': 'Building',
	    'AISSearch2.reg_chars_tab': 'Specification',
	    'AISSearch2.reg_devs_tab': 'Equipment',
	    'AISSearch2.rmrs': 'RMRS',
	    'AISSearch2.AddIntoGroup': 'Add into group',
	    'AISSearch2.RemoveFromGroup': 'Remove from group',
	    'AISSearch2.AllGroup': 'All',
	    'AISSearch2.NewGroup': 'New group',
	    'AISSearch2.NewGroupName': 'name',
	    'AISSearch2.CreateGroup': 'create',
	    'AISSearch2.DeleteGroup': 'delete group',
	    'AISSearch2.DeleteGroupCommand': 'Delete group',
	    'AISSearch2.DisplaySection': 'Display on map:',
	    'AISSearch2.DisplayVesselName': 'vessel name',
	    'AISSearch2.DisplayGroupName': 'group name',
	    'AISSearch2.DisplayCog': 'cog',
	    'AISSearch2.DisplaySog': 'sog',
	    'AISSearch2.KnotShort': ' kn',
	    'AISSearch2.thisVesselOnly': 'Only this ship ',
	    'AISSearch2.allTracks': 'All ships tracks ',
	    'AISSearch2.markerShadow': 'Marker highlight',
	    'AISSearch2.labelColor': 'Label color',
	    'AISSearch2.labelShadow': 'Label highlight',
	    'AISSearch2.zoomin_com': 'Zoom in',
	    'AISSearch2.zoomout_com': 'Zoom out',
	    'AISSearch2.image1_com': 'Image 1',
	    'AISSearch2.image2_com': 'Image 2',
	    'AISSearch2.twoimages_com': 'Two images',
	    'AISSearch2.close_com': 'Close'
	});

/***/ }),
/* 5 */
/***/ (function(module, exports) {

	'use strict';
	
	// Element.closest
	(function (proto) {
	  proto.matches = proto.matches || proto.mozMatchesSelector || proto.msMatchesSelector || proto.oMatchesSelector || proto.webkitMatchesSelector;
	  proto.closest = proto.closest || function closest(selector) {
	    if (!this) return null;
	    if (this.matches(selector)) return this;
	    if (!this.parentElement) {
	      return null;
	    } else return this.parentElement.closest(selector);
	  };
	})(Element.prototype);
	
	// Element.remove
	(function () {
	  var arr = [window.Element, window.CharacterData, window.DocumentType];
	  var args = [];
	
	  arr.forEach(function (item) {
	    if (item) {
	      args.push(item.prototype);
	    }
	  });
	  // from:https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/remove()/remove().md
	  (function (arr) {
	    arr.forEach(function (item) {
	      if (item.hasOwnProperty('remove')) {
	        return;
	      }
	      Object.defineProperty(item, 'remove', {
	        configurable: true,
	        enumerable: true,
	        writable: true,
	        value: function remove() {
	          this.parentNode && this.parentNode.removeChild(this);
	        }
	      });
	    });
	  })(args);
	})();
	
	// Element.append, Document.append, DocumentFragment.append
	(function (arr) {
	  arr.forEach(function (item) {
	    if (item.hasOwnProperty('append')) {
	      return;
	    }
	    Object.defineProperty(item, 'append', {
	      configurable: true,
	      enumerable: true,
	      writable: true,
	      value: function append() {
	        var argArr = Array.prototype.slice.call(arguments),
	            docFrag = document.createDocumentFragment();
	
	        argArr.forEach(function (argItem) {
	          var isNode = argItem instanceof Node;
	          docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
	        });
	
	        this.appendChild(docFrag);
	      }
	    });
	  });
	})([Element.prototype, Document.prototype, DocumentFragment.prototype]);
	
	//NodeList.forEach
	NodeList.prototype["forEach"] = NodeList.prototype["forEach"] || Array.prototype["forEach"];

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var NOSIDEBAR = false,
	    PRODUCTION = false,
	    SIDEBAR2 = false;
	if (false) NOSIDEBAR = true;
	if (true) SIDEBAR2 = true;
	if (true) PRODUCTION = true;
	
	module.exports = function (viewFactory) {
	    var _leftMenuBlock = void 0,
	        _canvas = _div(null),
	        _activeView = void 0,
	        _views = viewFactory.create(),
	        _isReady = false,
	        _createTabs = function _createTabs() {
	        var tabsTemplate = '<table class="ais_tabs" border=0><tr>' + '</td><td class="ais_tab myfleet_tab unselectable" unselectable="on">' + // ACTIVE
	        '<div>{{i "AISSearch2.MyFleetTab"}}</div>' + '<td class="ais_tab dbsearch_tab unselectable" unselectable="on">' + '<div>{{i "AISSearch2.DbSearchTab"}}</div>' + '</td><td class="ais_tab scrsearch_tab unselectable" unselectable="on">' + '<div>{{i "AISSearch2.ScreenSearchTab"}}</div>' + '</td></tr></table>';
	
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
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var ScreenSearchView = __webpack_require__(8),
	    ScreenSearchModel = __webpack_require__(10),
	    MyFleetView = __webpack_require__(11),
	    MyFleetModel = __webpack_require__(15),
	    DbSearchView = __webpack_require__(17),
	    DbSearchModel = __webpack_require__(19),
	    InfoDialogView = __webpack_require__(20),
	    Searcher = __webpack_require__(28),
	    Toolbox = __webpack_require__(29);
	
	module.exports = function (options) {
	    var _tools = new Toolbox(options),
	
	    //_layersByID = nsGmx.gmxMap.layersByID,
	    _searcher = new Searcher(options),
	        _mfm = new MyFleetModel({ aisLayerSearcher: _searcher, toolbox: _tools }),
	        _ssm = new ScreenSearchModel({ aisLayerSearcher: _searcher, myFleetModel: _mfm }),
	        _dbsm = new DbSearchModel(_searcher),
	        _dbsv = new DbSearchView({ model: _dbsm, highlight: options.highlight, tools: _tools }),
	        _ssv = new ScreenSearchView(_ssm, _tools),
	        _mfv = new MyFleetView(_mfm, _tools),
	        _idv = new InfoDialogView({
	        tools: _tools,
	        aisLayerSearcher: _searcher,
	        modulePath: options.modulePath,
	        aisView: _dbsv,
	        myFleetView: _mfv,
	        menuId: options.menuId
	    });
	    _ssv.infoDialogView = _idv;
	    _mfv.infoDialogView = _idv;
	    _dbsv.infoDialogView = _idv;
	    return {
	        get infoDialogView() {
	            return _idv;
	        },
	        create: function create() {
	            return [_mfv, _dbsv, _ssv];
	        }
	    };
	};

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var BaseView = __webpack_require__(9);
	var _tools = void 0;
	var ScreenSearchView = function ScreenSearchView(model, tools) {
	    var _this = this;
	
	    BaseView.apply(this, arguments);
	    _tools = tools;
	    _tools.onLegendSwitched(function (showAlternative) {
	        _switchLegendIcon.call(_this, _tools.needAltLegend);
	    }.bind(this));
	
	    this.frame = $(Handlebars.compile('<div class="ais_view search_view">' + '<table border=0 class="instruments">' +
	    //'<tr><td colspan="2"><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/><i class="icon-flclose clicable"></div></td></tr>'+
	    '<tr><td><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filterName"}}"/>' + '<div><img class="search clicable" src="plugins/AIS/AISSearch/svg/search.svg">' + '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg">' + '</div></div>' + '</td></tr>' + '<tr><td>' + '<span class="sync-switch-slider-description" style="padding: 0;line-height:12px">{{i "AISSearch2.allTracks"}}</span>' + '<label class="sync-switch switch all_tracks" style="margin-left:5px"><input type="checkbox">' + '<div class="sync-switch-slider switch-slider round"></div></label>' + '<div>&nbsp;</div>' + '</td></tr>' + '</table>' + '<table class="results">' + '<tr><td class="count"></td>' + '<td><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div>' + this.gifLoader + '</div></div></td></tr>' + '</table>' +
	    // '<table class="start_screen"><tr><td>'+
	    // '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">'+
	    // '<div>Здесь будут отображаться<br>результаты поиска</div></td></tr></table>'+
	    '<div class="ais_vessels">' + '<div class="ais_vessel">' + '<table border=0><tr><td><div class="position">NO VESSELS</div><div>mmsi: 0 imo: 0</div></td>' + '<td><i class="icon-ship" vessel="" title=""></i></td>' + '<td><span class="date"></span></td>' + '<td><div class="info" vessel="aisjson this" title="i AISSearch2.info">' + '<img src="plugins/AIS/AISSearch/svg/info.svg">' + '</div></td></tr></table>' + '</div>' + '</div>' + '</div>')());
	    Object.defineProperty(this, "topOffset", {
	        get: function get() {
	            var rv = $('.ais_tabs')[0].getBoundingClientRect().height + this.frame.find('.instruments')[0].getBoundingClientRect().height + this.frame.find('.results')[0].getBoundingClientRect().height;
	            return rv;
	        }
	    });
	    this.container = this.frame.find('.ais_vessels');
	    //this.startScreen = this.frame.find('.start_screen');
	    this.tableTemplate = '{{#each vessels}}' + '<div class="ais_vessel">' + '<table border=0><tr><td><div class="position">{{vessel_name}}</div><div>mmsi: {{mmsi}} imo: {{imo}}</div></td>' + '<td><img src="{{icon}}" class="rotateimg{{icon_rot}} legend_icon"><img src="{{iconAlt}}" class="rotateimg{{icon_rot}} legend_iconalt"></td>' +
	
	    //'<td><i class="icon-ship" vessel="{{aisinfoid this}}" style="{{mf_member}}" title="{{i "AISSearch2.myFleetMember"}}"></i></td>' +
	    '<td><span vessel="{{aisinfoid this}}" style="{{mf_member}}" title="{{i "AISSearch2.myFleetMember"}}">' + '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px" height="14px" viewBox="0 0 14 14" xml:space="preserve">' + '<g style="fill: #48aff1;">' + '<path class="st0" d="M13.4,11H0.6c-0.2,0-0.4,0.1-0.5,0.3c-0.1,0.2-0.1,0.4,0,0.6l1.2,1.8C1.4,13.9,1.6,14,1.8,14h9.9   c0.2,0,0.3-0.1,0.4-0.2l1.7-1.8c0.2-0.2,0.2-0.4,0.1-0.7C13.9,11.1,13.7,11,13.4,11z"/>' + '<path class="st0" d="M9.3,9.7h2.9c0.2,0,0.4-0.1,0.5-0.3c0.1-0.2,0.1-0.4,0-0.6L9.8,4.5C9.7,4.3,9.4,4.2,9.2,4.3   C8.9,4.4,8.7,4.6,8.7,4.9v4.3C8.7,9.5,9,9.7,9.3,9.7z"/>' + '<path class="st0" d="M1.2,9.7H7c0.3,0,0.6-0.3,0.6-0.6V0.6c0-0.3-0.2-0.5-0.4-0.6C6.9-0.1,6.7,0,6.5,0.3L0.7,8.8   C0.6,9,0.5,9.2,0.6,9.4C0.7,9.6,0.9,9.7,1.2,9.7z"/>' + '</g>' + '</svg></span></td>' + '<td><span class="date">{{ts_pos_utc}}</span></td>' + '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">' + '<img src="plugins/AIS/AISSearch/svg/info.svg">' + '</div></td></tr></table>' + '</div>' + '{{/each}}' + '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
	
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
	        var _this2 = this;
	
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
	            doFilter.call(_this2);
	        }.bind(this), 500);
	        //nsGmx.leafletMap.removeLayer(highlight);
	    }.bind(this));
	
	    var needUpdate = function needUpdate() {
	        var _this3 = this;
	
	        this.model.isDirty = true;
	        if (this.container.is(':visible')) {
	
	            clearTimeout(delay);
	            delay = setTimeout(function () {
	                _this3.model.update();
	            }.bind(this), 300);
	        }
	    };
	    nsGmx.leafletMap.on('moveend', needUpdate.bind(this));
	    nsGmx.widgets.commonCalendar.getDateInterval().on('change', needUpdate.bind(this));
	
	    this.frame.find('.instruments .all_tracks  input[type="checkbox"]').click(function (e) {
	        if (e.currentTarget.checked) {
	            _tools.showAllTracks(true);
	        } else {
	            _tools.showAllTracks(false);
	        }
	    }.bind(this));
	};
	
	ScreenSearchView.prototype = Object.create(BaseView.prototype);
	
	var _clean = function _clean() {
	    this.frame.find('.count').text(_gtxt('AISSearch2.found') + 0);
	},
	    _switchLegendIcon = function _switchLegendIcon(showAlternative) {
	    var ic = this.frame.find('.legend_icon'),
	        ica = this.frame.find('.legend_iconalt');
	    if (showAlternative) {
	        ic.hide();ica.show();
	    } else {
	        ica.hide();ic.show();
	    }
	};
	
	ScreenSearchView.prototype.inProgress = function (state) {
	    var progress = this.frame.find('.refresh div');
	    if (state) progress.show();else progress.hide();
	};
	
	var _firstRowsPos = 0,
	    _firstRowsNum = 40,
	    _firstRowsShift = 20,
	    _setEventHandlers = function _setEventHandlers() {
	    var thisInst = this;
	    this.container.find('.info').off('click').on('click', function (e) {
	        var _this4 = this;
	
	        var target = $(this),
	            vessel = JSON.parse(target.attr('vessel'));
	        //console.log(vessel)
	        thisInst.infoDialogView && thisInst.infoDialogView.show(vessel, function (v) {
	            //console.log(v)
	            vessel.xmin = vessel.xmax = v.longitude;
	            vessel.ymin = vessel.ymax = v.latitude;
	            if (vessel.hasOwnProperty('ts_pos_utc')) {
	                vessel.ts_pos_utc = v.ts_pos_utc;
	                vessel.ts_pos_org = v.ts_pos_org;
	                v.dt_pos_utc && $(_this4).closest('tr').find('.date').html(v.dt_pos_utc);
	            }
	            target.attr('vessel', JSON.stringify(vessel));
	        });
	        e.stopPropagation();
	    });
	    this.container.find('.ais_vessel').off('click').on('click', function () {
	        //console.log(JSON.parse($(this).find('.info').attr('vessel')))
	        var v = JSON.parse($(this).find('.info').attr('vessel'));
	        v.lastPosition = true;
	        thisInst.infoDialogView.showPosition(v);
	    });
	    //console.log("repaint "+(new Date()-start)+"ms" )      
	};
	
	ScreenSearchView.prototype.repaint = function () {
	    //console.log("REPAINT")
	    _clean.call(this);
	    this.frame.find('.count').text(_gtxt('AISSearch2.found') + this.model.data.vessels.length);
	    //BaseView.prototype.repaint.apply(this, arguments);
	    ////////////////////////////////////////////////////
	    this.container.find('.info').off('click');
	    this.container.find('.ais_vessel').off('click');
	    var scrollCont = this.container.find('.mCSB_container');
	    if (scrollCont[0]) scrollCont.empty();else this.container.empty();
	    if (!this.model.data) return;
	
	    var thisInst = this,
	        tempFirst = this.model.data.vessels.slice(0, _firstRowsNum),
	        content = $(Handlebars.compile(this.tableTemplate)({ msg: this.model.data.msg, vessels: tempFirst })),
	        mcsTopPctPrev = 0,
	        rowH = void 0;
	    _firstRowsPos = _firstRowsNum;
	
	    if (!scrollCont[0]) {
	        this.container.mCustomScrollbar("destroy").append(content).mCustomScrollbar({
	            //scrollInertia: 0,//this.model.data.vessels.length > _firstRowsNum ? 0 : 600,
	            callbacks: {
	                onScroll: function onScroll() {
	                    thisInst.scroledPx = this.mcs.top;
	                    //console.log("onScroll " + this.mcs.top + " " + thisInst.container.is(':visible'));
	                },
	                whileScrolling: /*scrollingHandler*/function whileScrolling() {
	                    //console.log("whileScrolling " + this.mcs.top + "px " + thisInst.container.is(':visible')+" ss "+thisInst.startShow)                  
	                    //console.log("% " + this.mcs.topPct + " pos" + _firstRowsPos)
	                    if (thisInst.startShow && this.mcs.top == 0) {
	                        return;
	                    } else thisInst.startShow = false;
	
	                    if (this.mcs.topPct == 100 && mcsTopPctPrev != 100 && thisInst.model.data.vessels.length > _firstRowsPos) {
	                        var start = _firstRowsPos - _firstRowsNum + _firstRowsShift,
	                            end = _firstRowsPos + _firstRowsShift;
	                        if (thisInst.model.data.vessels.length - start <= thisInst.container.height() / rowH) start = thisInst.model.data.vessels.length - _firstRowsNum;
	                        ///console.log(">"+start+", "+end)
	                        tempFirst = thisInst.model.data.vessels.slice(start, end), _firstRowsPos += _firstRowsShift;
	                        var _scrollCont = thisInst.container.find('.mCSB_container');
	                        _scrollCont.html(Handlebars.compile(thisInst.tableTemplate)({ vessels: tempFirst }));
	                        //console.log("h="+rowH) 
	                        setTimeout(function () {
	                            thisInst.scroledPx = -rowH * _firstRowsShift + thisInst.container.height();
	                            thisInst.container.mCustomScrollbar("scrollTo", thisInst.scroledPx, {
	                                scrollInertia: 0,
	                                callbacks: false
	                            });
	                            _setEventHandlers.call(thisInst);
	                        }, 200);
	                        _switchLegendIcon.call(thisInst, _tools.needAltLegend);
	                    }
	                    if (this.mcs.topPct == 0 && mcsTopPctPrev != 0 && _firstRowsPos > _firstRowsNum) {
	                        //console.log(_firstRowsPos)
	                        var _start = _firstRowsPos - _firstRowsShift - _firstRowsNum,
	                            _end = _firstRowsPos - _firstRowsShift;
	                        //console.log("<"+start + ", " + end)
	                        tempFirst = thisInst.model.data.vessels.slice(_start, _end), _firstRowsPos -= _firstRowsShift;
	                        var _scrollCont2 = thisInst.container.find('.mCSB_container');
	                        _scrollCont2.html(Handlebars.compile(thisInst.tableTemplate)({ vessels: tempFirst }));
	                        //console.log("h="+rowH)
	                        setTimeout(function () {
	                            thisInst.scroledPx = rowH * _firstRowsShift;
	                            thisInst.container.mCustomScrollbar("scrollTo", thisInst.scroledPx, {
	                                scrollInertia: 0,
	                                callbacks: false
	                            });
	                            _setEventHandlers.call(thisInst);
	                        }, 200);
	                        _switchLegendIcon.call(thisInst, _tools.needAltLegend);
	                    }
	                    mcsTopPctPrev = this.mcs.topPct;
	                }
	            }
	        });
	        scrollCont = this.container.find('.mCSB_container');
	        rowH = scrollCont.height() / $('.ais_vessel', scrollCont).length;
	    } else {
	        scrollCont.append(content);
	        this.container.mCustomScrollbar("scrollTo", "top", { scrollInertia: 0, callbacks: false, timeout: 200 });
	    }
	    _setEventHandlers.call(this);
	    _switchLegendIcon.call(this, _tools.needAltLegend);
	};
	
	ScreenSearchView.prototype.show = function () {
	    this.startShow = true;
	    BaseView.prototype.show.apply(this, arguments);
	    this.frame.find('.filter input').focus();
	
	    if (this.frame.find('.instruments .all_tracks  input[type="checkbox"]')[0].checked) _tools.showAllTracks(true);
	
	    if (this.scroledPx) {
	        this.container.mCustomScrollbar("scrollTo", this.scroledPx, { scrollInertia: 0, callbacks: false });
	    }
	};
	
	module.exports = ScreenSearchView;

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
	    if (NOSIDEBAR) {
	        var template = this.frame.find('.ais_vessel')[0] || this.frame.find('.ais_positions_date')[0],
	            h = template.getBoundingClientRect().height;
	        return h * 5;
	    } else {
	        return $('.iconSidebarControl-pane').height() - this.topOffset;
	    }
	};
	
	var _tools = void 0;
	var BaseView = function BaseView(model, tools) {
	    model.view = this;
	    this.model = model;
	    this.gifLoader = '<img src="img/progress.gif">';
	    _tools = tools;
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
	                var bb = $('.iconSidebarControl-pane:visible')[0].getBoundingClientRect();
	                this.startScreen.css({ position: "absolute", left: bb.left + "px", top: bb.height / 2 - 50 + "px",
	                    width: bb.width + "px" });
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
	                var v = JSON.parse($(this).find('.info').attr('vessel'));
	                v.lastPosition = true;
	                _this.infoDialogView.showPosition(v);
	            });
	        },
	        show: function show() {
	            _tools.restoreDefault();
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
/***/ (function(module, exports) {

	"use strict";
	
	var _actualUpdate = void 0,
	    _myFleetModel = void 0,
	    _aisLayerSearcher = void 0;
	
	var ScreenSearchModel = function ScreenSearchModel(_ref) {
	    var aisLayerSearcher = _ref.aisLayerSearcher,
	        myFleetModel = _ref.myFleetModel;
	
	
	    var thisInstance = this;
	    myFleetModel.onChanged = function () {
	        thisInstance.isDirty = true;
	        if (thisInstance.view.isActive) thisInstance.update();
	    };
	    _aisLayerSearcher = aisLayerSearcher;
	    _myFleetModel = myFleetModel;
	    this.filterString = "";
	    this.isDirty = true;
	};
	
	ScreenSearchModel.prototype.load = function (actualUpdate) {
	    if (!this.isDirty) return Promise.resolve();
	
	    var thisInst = this;
	    return Promise.all([new Promise(function (resolve, reject) {
	        _aisLayerSearcher.searchScreen({
	            dateInterval: nsGmx.widgets.commonCalendar.getDateInterval(),
	            border: true,
	            group: true
	        }, function (json) {
	            if (json.Status.toLowerCase() == "ok") {
	                thisInst.dataSrc = {
	                    vessels: json.Result.values.map(function (v) {
	                        var d = new Date(v[12]),
	                            //nsGmx.widgets.commonCalendar.getDateInterval().get('dateBegin'),
	                        vessel = {
	                            vessel_name: v[0], mmsi: v[1], imo: v[2], mf_member: 'visibility:hidden',
	                            ts_pos_utc: _aisLayerSearcher.formatDate(d), ts_pos_org: Math.floor(d.getTime() / 1000),
	                            xmin: v[4], xmax: v[5], ymin: v[6], ymax: v[7], maxid: v[3],
	                            vessel_type: v[8], sog: v[9], cog: v[10], heading: v[11]
	                        };
	                        vessel.icon_rot = Math.round(vessel.cog / 15) * 15;
	                        _aisLayerSearcher.placeVesselTypeIcon(vessel);
	                        return vessel;
	                    })
	                };
	                if (_actualUpdate == actualUpdate) {
	                    //console.log("ALL CLEAN")
	                    //console.log("1>"+new Date(thisInst._actualUpdate))
	                    //console.log("2>"+new Date(actualUpdate))
	                    thisInst.isDirty = false;
	                }
	                resolve();
	            } else {
	                reject(json);
	            }
	        });
	    }), _myFleetModel.load()]);
	};
	ScreenSearchModel.prototype.setFilter = function () {
	    var _this = this;
	
	    this.filterString = this.filterString.replace(/\r+$/, "");
	    if (this.dataSrc) {
	        if (this.filterString != "") {
	            this.data = {
	                vessels: this.dataSrc.vessels.filter(function (v) {
	                    return v.vessel_name.search(new RegExp("\\b" + _this.filterString, "ig")) != -1;
	                }.bind(this))
	            };
	        } else {
	            this.data = { vessels: this.dataSrc.vessels.map(function (v) {
	                    return v;
	                }) };
	        }
	    }
	};
	ScreenSearchModel.prototype.update = function () {
	    if (!this.isDirty) return;
	    _actualUpdate = new Date().getTime();
	    var thisInst = this,
	        actualUpdate = _actualUpdate;
	    this.view.inProgress(true);
	
	    this.load(actualUpdate).then(function () {
	        if (_actualUpdate == actualUpdate) {
	            //console.log(thisInst.dataSrc)
	            if (thisInst.dataSrc) _myFleetModel.markMembers(thisInst.dataSrc.vessels);
	            thisInst.setFilter();
	            thisInst.view.inProgress(false);
	            thisInst.view.repaint();
	        }
	    }, function (json) {
	        thisInst.dataSrc = null;
	        //console.logconsole.log(json)
	        if (json.Status.toLowerCase() == "auth" || json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function (r) {
	            return r.Status.toLowerCase() == "auth";
	        })) thisInst.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], vessels: [] };else {
	            //thisInst.data = {msg:[{txt:"!!!"}], vessels:[]};
	            console.log(json);
	        }
	        thisInst.view.inProgress(false);
	        thisInst.view.repaint();
	    });
	};
	
	module.exports = ScreenSearchModel;

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	__webpack_require__(12);
	var BaseView = __webpack_require__(9);
	var GroupList = __webpack_require__(13);
	
	var _switchLegendIcon = function _switchLegendIcon(showAlternative) {
	    var ic = this.frame.find('.legend_icon'),
	        ica = this.frame.find('.legend_iconalt');
	    if (showAlternative) {
	        ic.hide();ica.show();
	    } else {
	        ica.hide();ic.show();
	    }
	},
	    _clean = function _clean() {
	    this.frame.find('.ais_vessels input[type="checkbox"]').off('click');
	    this.startScreen.css({ visibility: "hidden" });
	};
	
	var _tools = void 0,
	    _displayedOnly = [],
	    _notDisplayed = [],
	    _saveLabelSettingsPromise = Promise.resolve(0);
	var MyFleetView = function MyFleetView(model, tools) {
	    var _this = this;
	
	    BaseView.apply(this, arguments);
	    _tools = tools;
	    _tools.onLegendSwitched(function (showAlternative) {
	        _switchLegendIcon.call(_this, _tools.needAltLegend);
	    }.bind(this));
	
	    var settings = []; //DEFAULT SETTINGS
	    this.frame = $(Handlebars.compile('<div class="ais_view myfleet_view">' + '<table class="instruments">' + '<tr><td style="vertical-align:top; padding-right:0">' + '<div style="width:140px; margin-bottom: 8px;">{{i "AISSearch2.DisplaySection"}}</div>' + '<label class="sync-switch switch"><input type="checkbox">' + '<div class="sync-switch-slider switch-slider round"></div></label>' + '<span class="sync-switch-slider-description">{{i "AISSearch2.myFleetOnly"}}</span>' + '</td>' + '<td style="padding-right:0">' + '<div style="width:120px;float:left;" class="setting"><label><input type="checkbox" id="group_name" ' + (settings.indexOf('group_name') < 0 ? '' : 'checked') + '>{{i "AISSearch2.DisplayGroupName"}}</div>' + '<div style="width:120px;float:left;" class="setting"><label><input type="checkbox" id="vessel_name" ' + (settings.indexOf('vessel_name') < 0 ? '' : 'checked') + '>{{i "AISSearch2.DisplayVesselName"}}</label></div>' + '<div style="width:70px;float:left;" class="setting"><label><input type="checkbox" id="sog" ' + (settings.indexOf('sog') < 0 ? '' : 'checked') + '>{{i "AISSearch2.DisplaySog"}}</label></div>' + '<div style="width:45px;float:left;" class="setting"><label><input type="checkbox" id="cog" ' + (settings.indexOf('cog') < 0 ? '' : 'checked') + '>{{i "AISSearch2.DisplayCog"}}</label></div>' + '</td>' + '<td><div class="refresh"><div>' + this.gifLoader + '</div></div></td></tr>' + '<tr><td colspan="3" style="padding-top:0">' + '<table><tr><td>{{i "AISSearch2.NewGroup"}}</td>' + '<td><div class="newgroupname"><input type="text" placeholder="{{i "AISSearch2.NewGroupName"}}"/></div></td>' + '<td><img class="create clicable" title="{{i "AISSearch2.CreateGroup"}}" src="plugins/AIS/AISSearch/svg/add.svg"></td>' + '</tr></table>' + '</td></tr>' + '</table>' + '<div class="ais_vessels">' + '<table class="results">' + '<td><input type="checkbox" checked></td>' + '<td class="count"></td></tr></table>' + '<div class="ais_vessel">' + '<table border=0><tr>' + '<td><input type="checkbox" checked></td>' + '<td><div class="position">vessel_name</div><div>mmsi: mmsi imo: imo</div></td>' + '<td></td>' + '<td><span class="date">ts_pos_utc</span></td>' +
	    //'<td><div class="info" vessel="aisjson this" title="i AISSearch2.info">' +
	    //'<img src="plugins/AIS/AISSearch/svg/info.svg"><div></td>' +
	    '</tr></table>' + '</div>' + '</div>' + '<table class="start_screen"><tr><td>' + '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">' + '<div>{{{i "AISSearh2.myfleet_view"}}}' + '</div></td></tr></table>' + '</div>')());
	
	    Object.defineProperty(this, "topOffset", {
	        get: function get() {
	            var rv = $('.ais_tabs')[0].getBoundingClientRect().height + this.frame.find('.instruments')[0].getBoundingClientRect().height;
	            return rv;
	        }
	    });
	
	    this.container = this.frame.find('.ais_vessels');
	    this.startScreen = this.frame.find('.start_screen');
	    // DEFAULT SETTINGS
	    // this.model.markerTemplate =  '<div><table><tr>' +
	    //     '<td style="vertical-align:top">' +
	    //     //'<svg width="12" height="11" fill="#00f" style="{{marker_style}}" viewBox="0 0 260 245"><use xlink:href="#mf_label_icon"/></svg>' +
	    //     '{{{marker}}}' +
	    //     '</td><td>{{{foo}}}</td></tr></table></div>'; 
	
	    // craete group controller
	    var newGroupNameValid = function newGroupNameValid(ngn) {
	        var isValid = ngn.search(/\S/) != -1;
	        this.model.data.groups.forEach(function (g) {
	            if (isValid) isValid = g.title != ngn;
	        });
	        return isValid;
	    },
	        createGroup = function createGroup(ngn) {
	        var _this2 = this;
	
	        if (newGroupNameValid.call(this, ngn)) {
	            this.inProgress(true);
	            this.model.createGroup(ngn).then(function (group) {
	                _this2.groupList.appendGroup(group, _this2.model.data.groups.length - 1);
	                _this2.inProgress(false);
	            }, function (error) {
	                _this2.inProgress(false);
	                console.log(error);
	            });
	        }
	    };
	    this.frame.find('.instruments .create').on("click", function (e) {
	        var input = _this.frame.find('.instruments .newgroupname input'),
	            ngn = input.val();
	        input.val('');
	        createGroup.call(_this, ngn);
	    }.bind(this));
	    this.frame.find('.instruments .newgroupname input').on("keyup", function (e) {
	        var ngn = e.target.value;
	        if (e.keyCode == 13) {
	            e.target.value = '';
	            createGroup.call(_this, ngn);
	        }
	    }.bind(this));
	
	    // marker settings
	    this.frame.find('.instruments .setting input').on('change', function (e) {
	        var display = '';
	        _this.frame.find('.instruments .setting input').each(function (i, e) {
	            if (e.checked) display += "{{{" + e.id + "}}}";
	        });
	        if (display == '') display = '{{{foo}}}';
	        _this.model.markerTemplate = _this.model.markerTemplate.replace(/<td>\{\{\{.+\}\}\}<\/td>/, '<td>' + display + '</td>');
	        if (_displayedOnly.length) _tools.showVesselsOnMap(_displayedOnly);else _tools.showVesselsOnMap("all");
	
	        _saveLabelSettingsPromise = _saveLabelSettingsPromise.then(function (c) {
	            return _this.model.saveLabelSettings(c);
	        }.bind(_this));
	    }.bind(this));
	
	    // visibility controller
	    this.frame.find('.instruments .switch input[type="checkbox"]').on("click", function (e) {
	        _displayedOnly.length = 0;
	        if (e.currentTarget.checked) {
	            _displayedOnly = this.model.vessels.map(function (v) {
	                return v.mmsi.toString();
	            });
	            _tools.showVesselsOnMap(_displayedOnly);
	        } else _tools.showVesselsOnMap("all");
	        //console.log("showVesselsOnMap");            
	    }.bind(this));
	
	    // group list
	    this.groupList = new GroupList(this.frame);
	    this.groupList.onRepaintItem = function (i, elm) {
	        elm.querySelector('input[type=checkbox]').checked = _notDisplayed.indexOf(elm.querySelector('.mmsi').innerText) < 0;
	    }.bind(this);
	    this.groupList.onDeleteGroup = function (group) {
	        _this.inProgress(true);
	        _this.model.deleteGroup(group);
	    }.bind(this);
	
	    this.tableTemplate = this.groupList.toString();
	};
	
	MyFleetView.prototype = Object.create(BaseView.prototype);
	
	Object.defineProperty(MyFleetView.prototype, "notDisplayed", {
	    get: function get() {
	        return _notDisplayed;
	    }
	});
	
	MyFleetView.prototype.inProgress = function (state) {
	    var progress = this.frame.find('.refresh div');
	    if (state) progress.show();else progress.hide();
	};
	
	MyFleetView.prototype.repaint = function () {
	    var _this3 = this;
	
	    _clean.call(this);
	    BaseView.prototype.repaint.apply(this, arguments);
	    // MEMBERS ON MAP
	    _displayedOnly.length = 0;
	    if (!this.model.vessels.length) this.frame.find('.instruments .switch input[type="checkbox"]')[0].checked = false;
	    if (this.frame.find('.instruments .switch input[type="checkbox"]')[0].checked) {
	        _displayedOnly = this.model.vessels.map(function (v) {
	            return v.mmsi.toString();
	        });
	        _tools.showVesselsOnMap(_displayedOnly);
	    } else _tools.showVesselsOnMap("all");
	
	    _tools.hideVesselsOnMap(_notDisplayed);
	    // console.log("showVesselsOnMap");     
	    // console.log("hideVesselsOnMap");  
	    ///////////////// 
	
	    var labelSettings = this.model.markerTemplate.match(/(?!\{\{\{)[^\{\}]+(?=\}\}\})/g),
	        labelSettingCtrl = void 0;
	    for (var i in labelSettings) {
	        labelSettingCtrl = this.frame.find('.instruments .setting input#' + labelSettings[i])[0];
	        if (labelSettingCtrl) labelSettingCtrl.checked = true;
	    }
	
	    this.groupList.repaint();
	
	    // GROUP LIST EVENTS
	    this.groupList.onCheckItem = function (uncheked) {
	        if (uncheked.length) _notDisplayed = uncheked.map(function (mmsi) {
	            return mmsi;
	        });else _notDisplayed.length = 0;
	        _tools.hideVesselsOnMap(uncheked);
	        // console.log("hideVesselsOnMap");
	    };
	    this.groupList.onChangeGroup = function (mmsi, group) {
	        var view = _this3;
	        _this3.inProgress(true);
	        _this3.model.changeGroup(mmsi, group).then(function (r) {
	            view.repaint();
	            view.inProgress(false);
	        }).catch(function (err) {
	            console.log(err);
	            view.inProgress(false);
	        });
	    }.bind(this);
	    this.groupList.onExcludeItem = function (ev, mmsi, i) {
	        ev.stopPropagation();
	        var thisView = _this3;
	        var vessel = thisView.model.vessels[i];
	
	        thisView.beforeExcludeMember(vessel.mmsi.toString());
	
	        var dlg = $('.ui-dialog:contains("' + vessel.mmsi + '")');
	        if (dlg[0]) {
	            dlg.find('.button.addremove').click();
	        } else {
	            thisView.model.changeMembers(vessel).then(function () {
	                thisView.show();
	            });
	        }
	    }.bind(this);
	    this.groupList.onGroupMenuShow = function (group) {
	        var i = parseInt(group.replace(/gr/, ''), 10);
	        return {
	            marker_style: parseInt(_this3.model.data.groups[i].marker_style.replace(/#/, ''), 16),
	            label_color: parseInt(_this3.model.data.groups[i].label_color.replace(/#/, ''), 16),
	            label_shadow: parseInt(_this3.model.data.groups[i].label_shadow.color.replace(/#/, ''), 16)
	        };
	    }.bind(this);
	    this.groupList.onChangeGroupStyle = function (group, colors) {
	        var i = parseInt(group.replace(/gr/, ''), 10);
	        _this3.model.changeGroupStyle(i, colors);
	    }.bind(this);
	    this.groupList.onSaveGroupStyle = this.model.saveGroupStyle;
	    _switchLegendIcon.call(this, _tools.needAltLegend);
	};
	
	MyFleetView.prototype.beforeExcludeMember = function (strMmsi) {
	    _displayedOnly = _displayedOnly.filter(function (m) {
	        return m != strMmsi;
	    });
	    _notDisplayed = _notDisplayed.filter(function (m) {
	        return m != strMmsi;
	    });
	};
	
	MyFleetView.prototype.hide = function () {
	    BaseView.prototype.hide.apply(this, arguments);
	    _tools.showVesselsOnMap("all");
	    _tools.hideVesselsOnMap([]);
	};
	
	// MyFleetView.prototype.show = function () {
	//     BaseView.prototype.show.apply(this, arguments);  
	//     _switchLegendIcon.call(this, _tools.needAltLegend);
	// }
	
	module.exports = MyFleetView;

/***/ }),
/* 12 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var GroupWidget = __webpack_require__(14);
	
	var _onRepaintItemHandler = void 0,
	    _onCheckItem = void 0,
	    _onExcludeItem = void 0,
	    _onChangeGroup = void 0,
	    _onDeleteGroup = void 0,
	    _onGroupMenuShow = void 0,
	    _onChangeGroupStyle = void 0,
	    _rolledupGroups = {},
	    _cp1 = void 0,
	    _cp2 = void 0,
	    _cp3 = void 0,
	    _getFiltered = function _getFiltered() {
	    var filtered = [];
	    var group = this.frame.find('.mf_group'),
	        selectAll = void 0,
	        selectOne = void 0;
	    for (var i = 0; i < group.length; i++) {
	        selectAll = group.eq(i).find('.results input[type="checkbox"]');
	        selectOne = group.eq(i).find('.ais_vessel input[type="checkbox"]');
	        selectAll[0].checked = true;
	        for (var j = 0; j < selectOne.length; j++) {
	            if (!selectOne[j].checked) {
	                filtered.push(selectOne[j].closest('.ais_vessel').querySelector('.mmsi').innerText);
	                selectAll[0].checked = false;
	            }
	        }
	    }
	    return filtered;
	},
	    _setCheckBoxes = function _setCheckBoxes() {
	    this.frame.find('.ais_vessel').each(_onRepaintItemHandler);
	    this.frame.find('.results input[type="checkbox"]').each(function (i, e) {
	        var check = true;
	        e.closest('.mf_group').querySelectorAll('input').forEach(function (e, i) {
	            check = check && e.checked;
	        });
	        e.checked = check;
	    });
	},
	    _setGroupCommands = function _setGroupCommands() {
	    var _this = this;
	
	    this.frame.find('.results input[type="checkbox"]').off("click").on("click", function (e) {
	        var group = $(e.target).closest('.mf_group');
	        group.find('.ais_vessel input[type="checkbox"]').each(function (i, elm) {
	            elm.checked = e.target.checked;
	        });
	        var filtered = _getFiltered.call(_this);
	        _onCheckItem(filtered);
	    }.bind(this));
	
	    this.frame.find('.results').off("contextmenu").on("contextmenu", function (e) {
	        e.preventDefault();
	        // let values= e.currentTarget.classList.values(), 
	        // cssClass, group;
	        // while (!cssClass || !cssClass.done){
	        //     cssClass = values.next(); 
	        //     group = cssClass.value;
	        //     if (group && group.search(/^gr\d/)==0)
	        //         break;
	        // }
	        var group = void 0,
	            classes = e.currentTarget.classList;
	        for (var i = 0; i < classes.length; ++i) {
	            group = classes[i];
	            if (group && group.search(/^gr\d/) == 0) break;
	        }
	
	        var ctxMenu = _this.contextMenu,
	            //$('.mf_group_menu'),
	        evnt = e;
	        if (_cp1) _cp1.remove();
	        if (_cp2) _cp2.remove();
	        if (_cp3) _cp3.remove();
	        ctxMenu.html('');
	        var colorChangeHandler = function colorChangeHandler(c, cs) {
	            _groupStyleChanged = true;
	            cs.style.backgroundColor = "#" + c;
	            var c1 = cp1.style.backgroundColor,
	                c2 = cp2.style.backgroundColor,
	                c3 = cp3.style.backgroundColor;
	            _onChangeGroupStyle(group, {
	                marker_style: c1.substr(0, 3) == "rgb" ? nsGmx.Utils.rgb2hex(c1) : c1,
	                label_color: c2.substr(0, 3) == "rgb" ? nsGmx.Utils.rgb2hex(c2) : c2,
	                label_shadow: c3.substr(0, 3) == "rgb" ? nsGmx.Utils.rgb2hex(c3) : c3
	            });
	        },
	            colors = _onGroupMenuShow(group),
	            cp1 = nsGmx.Controls.createColorPicker(colors.marker_style, function () {}, function () {}, function (c1, c2, c3) {
	            colorChangeHandler(c2, cp1);
	        }),
	            cp2 = nsGmx.Controls.createColorPicker(colors.label_color, function () {}, function () {}, function (c1, c2, c3) {
	            colorChangeHandler(c2, cp2);
	        }),
	            cp3 = nsGmx.Controls.createColorPicker(colors.label_shadow, function () {}, function () {}, function (c1, c2, c3) {
	            colorChangeHandler(c2, cp3);
	        });
	        _cp1 = document.querySelector("#" + $(cp1).data('colorpickerId'));
	        _cp2 = document.querySelector("#" + $(cp2).data('colorpickerId'));
	        _cp3 = document.querySelector("#" + $(cp3).data('colorpickerId'));
	        $(_cp1).on('mouseleave', function (e) {
	            if (!e.relatedTarget || !e.relatedTarget.closest('.mf_group_menu')) _hideContextMenu.call(_this, e);$(cp1).ColorPickerHide();
	        });
	        $(_cp2).on('mouseleave', function (e) {
	            if (!e.relatedTarget || !e.relatedTarget.closest('.mf_group_menu')) _hideContextMenu.call(_this, e);$(cp2).ColorPickerHide();
	        });
	        $(_cp3).on('mouseleave', function (e) {
	            if (!e.relatedTarget || !e.relatedTarget.closest('.mf_group_menu')) _hideContextMenu.call(_this, e);$(cp3).ColorPickerHide();
	        });
	        cp1.title = "";
	        cp2.title = "";
	        cp3.title = "";
	        var div = $('<div class="command marker_color"></div>');
	        ctxMenu.append(div.append(cp1).append("<span>" + _gtxt("AISSearch2.markerShadow") + "</span>"));
	        div = $('<div class="command label_color"></div>');
	        ctxMenu.append(div.append(cp2).append("<span>" + _gtxt('AISSearch2.labelColor') + "</span>"));
	        div = $('<div class="command label_shadow"></div>');
	        ctxMenu.append(div.append(cp3).append("<span>" + _gtxt('AISSearch2.labelShadow') + "</span>"));
	        ctxMenu.append('<div class="command remove">' + _gtxt("AISSearch2.DeleteGroupCommand") + '</div>');
	
	        $(cp1).on('click', function (e) {
	            return $(_cp1).offset({ left: $('.colorpicker:visible').offset().left + 20 });
	        });
	        $(cp2).on('click', function (e) {
	            return $(_cp2).offset({ left: $('.colorpicker:visible').offset().left + 20 });
	        });
	        $(cp3).on('click', function (e) {
	            return $(_cp3).offset({ left: $('.colorpicker:visible').offset().left + 20 });
	        });
	        ctxMenu.find('.command.marker_color').on("click", function (e) {
	            $(cp1).click();
	        });
	        ctxMenu.find('.command.label_color').on("click", function (e) {
	            $(cp2).click();
	        });
	        ctxMenu.find('.command.label_shadow').on("click", function (e) {
	            $(cp3).click();
	        });
	
	        if (e.currentTarget.querySelector(".delete")) {
	            ctxMenu.find('.command.remove').show().on("click", function (e) {
	                _onDeleteGroup(evnt.currentTarget.querySelector('.title').innerText);
	                ctxMenu.hide();
	            });
	        } else {
	            ctxMenu.find('.command.remove').hide();
	        }
	        ctxMenu.show();
	        ctxMenu[0].style.left = e.clientX - 10 + "px";
	        if (e.clientY - 10 + ctxMenu[0].offsetHeight < window.innerHeight) {
	            ctxMenu[0].style.top = e.clientY - 10 + "px";
	            ctxMenu[0].style.bottom = ""; //"auto";
	        } else {
	            ctxMenu[0].style.bottom = window.innerHeight - e.clientY - 10 + "px";
	            ctxMenu[0].style.top = ""; //"auto";
	        }
	    }.bind(this));
	
	    this.frame.find('.results .upout').off("click").on("click", function (e) {
	        var arrow = e.currentTarget,
	            title = arrow.closest('.results').querySelector('.title').innerText,
	            cl = arrow.classList,
	            vessels = arrow.closest('.mf_group').querySelectorAll('.ais_vessel');
	        if (cl.contains('icon-down-open')) {
	            cl.remove('icon-down-open');
	            cl.add('icon-right-open');
	            vessels.forEach(function (v) {
	                return v.style.display = 'none';
	            });
	            _rolledupGroups[title] = true;
	        } else {
	            cl.add('icon-down-open');
	            cl.remove('icon-right-open');
	            vessels.forEach(function (v) {
	                return v.style.display = 'block';
	            });
	            delete _rolledupGroups[title];
	        }
	        //console.log(_rolledupGroups)
	    }.bind(this)).each(function (i, el) {
	        var title = el.closest('.results').querySelector('.title').innerText;
	        if (_rolledupGroups[title]) {
	            el.classList.remove('icon-right-open');
	            el.classList.add('icon-down-open');
	            el.click();
	        }
	    });
	    _rolledupGroups = {};
	    this.frame.find('.results .icon-right-open').each(function (i, el) {
	        _rolledupGroups[el.closest('.results').querySelector('.title').innerText] = true;
	    });
	
	    this.frame.find('.results .delete').off("click").on("click", function (e) {
	        _onDeleteGroup(e.currentTarget.closest('.results').querySelector('.title').innerText);
	    }.bind(this));
	},
	    _onSaveGroupStyle = void 0,
	    _groupStyleChanged = void 0,
	    _saveStylePromise = Promise.resolve(0),
	    _hideContextMenu = function _hideContextMenu(e) {
	    this.contextMenu.hide();
	    //if (e.currentTarget.querySelector('.colorSelector') || e.currentTarget.classList.contains('colorpicker'))
	    if (_groupStyleChanged) {
	        _groupStyleChanged = false;
	        _saveStylePromise = _saveStylePromise.then(_onSaveGroupStyle);
	    }
	};
	
	var GroupList = function GroupList(frame) {
	    var _this2 = this;
	
	    this.frame = frame;
	
	    // context menu
	    this.contextMenu = $('<div class="mf_group_menu"></div>').on('mouseleave', function (e) {
	        if (!e.relatedTarget || !e.relatedTarget.closest('.colorpicker')) {
	            _hideContextMenu.call(_this2, e);
	            $('.colorpicker:visible').hide();
	        }
	    }.bind(this));
	    $('body').append(this.contextMenu);
	
	    this.repaint = function () {
	        var _this3 = this;
	
	        _setCheckBoxes.call(this);
	        _setGroupCommands.call(this);
	
	        // exclude memeber control
	        this.frame.find('.ais_vessel .exclude').each(function (i, elm) {
	            $(elm).on('click', function (ev) {
	                $(elm).off('click');
	                _onExcludeItem(ev, elm.closest('.ais_vessel').querySelector('.mmsi').innerText, i);
	            });
	        });
	
	        // memeber visibility control
	        this.frame.find('.ais_vessel input[type="checkbox"]').each(function (i, elm) {
	            $(elm).off('click').on('click', function (e) {
	                e.stopPropagation();
	                var filtered = _getFiltered.call(_this3);
	                _onCheckItem(filtered);
	            }.bind(_this3));
	        }.bind(this));
	
	        // context menu event handler
	        this.frame.find('.ais_vessel').off("contextmenu").on("contextmenu", function (e) {
	            e.preventDefault();
	            var mmsi = e.currentTarget.querySelector('.mmsi'),
	                ctxMenu = _this3.contextMenu,
	                //$('.mf_group_menu'),
	            groupblock = e.currentTarget.closest('.mf_group'),
	                group = groupblock.querySelector('.results .title').innerText,
	                groups = _this3.frame.find('.results .title'),
	                template = '';
	            if (groups.length == 1) return;
	
	            groups.each(function (i, g) {
	                if (i > 0 && g.innerText != group) template += '<div class="command">' + g.innerText + '</div>';
	            });
	            if (template != '') template = '<div>' + _gtxt("AISSearch2.AddIntoGroup") + '</div>' + template;
	            if (groupblock.previousSibling) {
	                if (template != '') template += '<div class="command remove">' + _gtxt("AISSearch2.RemoveFromGroup") + '</div>';else template += '<div class="command remove lonely">' + _gtxt("AISSearch2.RemoveFromGroup") + '</div>';
	            }
	            ctxMenu.html(template);
	
	            ctxMenu.find('.command').on("click", function (e) {
	                if (!e.currentTarget.classList.contains('remove')) _onChangeGroup(mmsi.innerText, e.currentTarget.innerText);else _onChangeGroup(mmsi.innerText, null);
	                ctxMenu.hide();
	            });
	            ctxMenu.show();
	            ctxMenu[0].style.left = e.clientX - 10 + "px";
	            if (e.clientY - 10 + ctxMenu[0].offsetHeight < window.innerHeight) {
	                ctxMenu[0].style.top = e.clientY - 10 + "px";
	                ctxMenu[0].style.bottom = ""; //"auto";
	            } else {
	                ctxMenu[0].style.bottom = window.innerHeight - e.clientY - 10 + "px";
	                ctxMenu[0].style.top = ""; //"auto";
	            }
	        }.bind(this));
	    };
	
	    // events
	    Object.defineProperty(this, "onChangeGroup", {
	        set: function set(callback) {
	            _onChangeGroup = callback;
	        }
	    });
	    Object.defineProperty(this, "onDeleteGroup", {
	        set: function set(callback) {
	            _onDeleteGroup = callback;
	        }
	    });
	    Object.defineProperty(this, "onRepaintItem", {
	        set: function set(callback) {
	            _onRepaintItemHandler = callback;
	        }
	    });
	    Object.defineProperty(this, "onCheckItem", {
	        set: function set(callback) {
	            _onCheckItem = callback;
	        }
	    });
	    Object.defineProperty(this, "onExcludeItem", {
	        set: function set(callback) {
	            _onExcludeItem = callback;
	        }
	    });
	    Object.defineProperty(this, "onGroupMenuShow", {
	        set: function set(callback) {
	            _onGroupMenuShow = callback;
	        }
	    });
	    Object.defineProperty(this, "onChangeGroupStyle", {
	        set: function set(callback) {
	            _onChangeGroupStyle = callback;
	        }
	    });
	    Object.defineProperty(this, "onSaveGroupStyle", {
	        set: function set(callback) {
	            _onSaveGroupStyle = callback;
	        }
	    });
	
	    // template
	    this.toString = function () {
	        return '{{#each groups}}' + GroupWidget.prototype.toString.call() + '{{/each}}' + '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}';
	    };
	};
	
	GroupList.prototype.appendGroup = function (group, index) {
	    this.frame.find('.mf_group').eq(0).parent().append(Handlebars.compile(GroupWidget.prototype.toString.call().replace(/\{\{@index\}\}/, index))(group));
	    _setGroupCommands.call(this);
	};
	
	module.exports = GroupList;

/***/ }),
/* 14 */
/***/ (function(module, exports) {

	'use strict';
	
	var GroupWidget = function GroupWidget(title) {};
	
	GroupWidget.prototype.toString = function () {
	    return '<div class="mf_group">' + '<table class="results gr{{@index}}"><tr>' + '<td><input type="checkbox" checked><div class="upout clicable ui-helper-noselect icon-down-open" style="float: right;"></div></td>' + '<td><span class="title">{{title}}</span></td>' + '<td class="count">{{vessels.length}}</td>' + '<td>' + '{{#unless default}}' + '<img class="delete clicable" title="{{i "AISSearch2.DeleteGroup"}}" src="plugins/AIS/AISSearch/svg/delete.svg">' + '</td>' + '{{/unless}}' + '</tr></table>' + '{{#each vessels}}' +
	    //'{{#unless foovessel}}' +
	    '<div class="ais_vessel">' + '<table border=0><tr>' + '<td><input type="checkbox" checked></td>' + '<td><div class="position">{{vessel_name}}</div><div>mmsi: <span class="mmsi">{{mmsi}}</span> imo: <span class="imo">{{imo}}</span></div></td>' + '<td><img src="{{icon}}" class="course rotateimg{{icon_rot}} legend_icon"><img src="{{iconAlt}}" class="course rotateimg{{icon_rot}} legend_iconalt">' + '<div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">' + '<img src="plugins/AIS/AISSearch/svg/info.svg"></div>' + '</td>' + '<td>' + '<div class="ais_info_dialog_close-button exclude" title="{{i "AISSearch2.vesselExclude"}}"></div>' + '<span class="date">{{dt_pos_utc}}</span></td>' + '</tr></table>' + '</div>' +
	    //'{{/unless}}' +
	    '{{/each}}</div>';
	};
	
	module.exports = GroupWidget;

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var Polyfill = __webpack_require__(16);
	var emptyGroup = function emptyGroup(title, isDefault, id, style, updateTemplate) {
	    var ms = "#ffff00",
	        lsc = "#ffff00",
	        ls = { "color": "#ffff00", "text_shadow": "-1px -1px 0 #ffff00, 0px -1px 0 #ffff00, 1px -1px 0 #ffff00, -1px  0px 0 #ffff00, 1px  0px 0 #ffff00, -1px  1px 0 #ffff00, 0px  1px 0 #ffff00, 1px  1px 0 #ffff00" },
	        eg = {
	        title: title,
	        vessels: [],
	        get marker_style() {
	            return ms;
	        },
	        set marker_style(c) {
	            ms = c;
	        },
	        //label_shadow:"color:black;-webkit-text-stroke:1px yellow;"
	        label_color: "#000000",
	        get label_shadow_color() {
	            return lsc;
	        },
	        get label_shadow() {
	            return ls;
	        },
	        set label_shadow(c) {
	            lsc = c;
	            ls = { "color": c, "text_shadow": "-1px -1px 0 " + c + ", 0px -1px 0 " + c + ", 1px -1px 0 " + c + ", -1px  0px 0 " + c + ", 1px  0px 0 " + c + ", -1px  1px 0 " + c + ", 0px  1px 0 " + c + ", 1px  1px 0 " + c + "" };
	        }
	    };
	    if (isDefault) eg.default = true;
	    if (style) {
	        style = JSON.parse(style);
	        eg.marker_style = style.ms;
	        eg.label_color = style.lc;
	        eg.label_shadow = style.lsc;
	        if (isDefault && style.mt && updateTemplate) _markerTemplate = style.mt;
	    }
	    eg.id = id;
	    return eg;
	};
	
	var VesselData = function VesselData() {
	    this.groups = [];
	};
	
	var _tools = void 0,
	    _isDirty = true,
	    _myFleetLayers = [],
	    _defaultGroup = _gtxt("AISSearch2.AllGroup"),
	    _vessels = [],
	    _mapID = void 0,
	    _prepared = void 0,
	    _actualUpdate = void 0,
	    _markerTemplate = '<div><table><tr>' + '<td style="vertical-align:top">' +
	//'<svg width="12" height="11" fill="#00f" style="{{marker_style}}" viewBox="0 0 260 245"><use xlink:href="#mf_label_icon"/></svg>' +
	'{{{marker}}}' + '</td><td>{{{foo}}}</td></tr></table></div>',
	    _data = void 0,
	    _view = void 0,
	    _aisLayerSearcher = void 0,
	    _onChangedHandlers = [],
	    _fireChanged = function _fireChanged() {
	    _onChangedHandlers.forEach(function (h) {
	        return h();
	    });
	},
	    _loadVoyageInfo = function _loadVoyageInfo(vessels) {
	    return new Promise(function (resolve, reject) {
	        if (!vessels.length) {
	            reject();
	            return;
	        }
	
	        var data = void 0;
	        if (Polyfill.findIndex(vessels, function (v) {
	            return v.mmsi || v.imo;
	        }) < 0) {
	            data = _parseVoyageInfo({ Result: { fields: [], values: [] } }, vessels);
	            resolve(data);
	        } else _aisLayerSearcher.searchNames(vessels, function (response) {
	            if (response.Status && response.Status.toLowerCase() == "ok") {
	                data = _parseVoyageInfo(response, vessels);
	                resolve(data);
	            } else {
	                reject(response);
	            }
	        });
	    });
	},
	    _compareGroups = function _compareGroups(l, r) {
	    if (l.default) return -1;
	    if (r.default) return 1;
	    if (l.id < r.id) return -1;
	    if (l.id > r.id) return 1;
	    return 0;
	},
	    _parseVoyageInfo = function _parseVoyageInfo(response, vessels) {
	    var mmsi = response.Result.fields.indexOf("mmsi"),
	        vessel_name = response.Result.fields.indexOf("vessel_name"),
	        ts_pos_utc = response.Result.fields.indexOf("ts_pos_utc"),
	        imo = response.Result.fields.indexOf("imo"),
	        lat = response.Result.fields.indexOf("longitude"),
	        lon = response.Result.fields.indexOf("latitude"),
	        vt = response.Result.fields.indexOf("vessel_type"),
	        cog = response.Result.fields.indexOf("cog"),
	        sog = response.Result.fields.indexOf("sog"),
	        data = void 0,
	        eg = void 0;
	    if (_data) {
	        // _data.groups.length>1 || _data.groups[0].vessels_length>0
	        data = _data;
	        data.groups.forEach(function (g) {
	            return g.vessels.length = 0;
	        });
	    } else {
	        data = new VesselData();
	        vessels.forEach(function (v) {
	            if (!v.mmsi && !v.imo) {
	                if (v.group) eg = emptyGroup(v.group, false, v.gmx_id, v.style, true);else eg = emptyGroup(_defaultGroup, true, v.gmx_id, v.style, true);
	                data.groups.push(eg);
	            }
	        });
	        data.groups.sort(_compareGroups);
	        //console.log(data);
	    }
	    response.Result.values.forEach(function (c) {
	        var d = new Date(c[ts_pos_utc] * 1000),
	            member = {
	            vessel_name: c[vessel_name], mmsi: c[mmsi], imo: c[imo],
	            ts_pos_utc: _aisLayerSearcher.formatDateTime(d), dt_pos_utc: _aisLayerSearcher.formatDate(d),
	            ts_pos_org: c[ts_pos_utc],
	            xmin: c[lat], xmax: c[lat], ymin: c[lon], ymax: c[lon],
	            vessel_type: c[vt], cog: c[cog], sog: c[sog]
	        };
	        member.icon_rot = Math.round(member.cog / 15) * 15;
	        _aisLayerSearcher.placeVesselTypeIcon(member);
	
	        var i = Polyfill.findIndex(vessels, function (v) {
	            return v.mmsi == member.mmsi;
	        }),
	            gn = i < 0 ? "" : !vessels[i].group ? _defaultGroup : vessels[i].group;
	        if (gn != "") {
	            i = Polyfill.findIndex(data.groups, function (g) {
	                return g.title == gn;
	            });
	            data.groups[i].vessels.push(member);
	        }
	    });
	
	    //thisInst.data.vessels.sort(function (a, b) { return +(a.vessel_name > b.vessel_name) || +(a.vessel_name === b.vessel_name) - 1; })
	    //console.log("PARSE VI " + data.groups.reduce((p,c)=>p+c.vessels.length, 0))
	    return data;
	},
	    _persistGroupsLook = function _persistGroupsLook(count, groups) {
	    return new Promise(function (resolve, reject) {
	        var temp = [],
	            style = void 0;
	        for (var i = 0; i < groups.length; ++i) {
	            style = { ms: groups[i].marker_style, lc: groups[i].label_color, lsc: groups[i].label_shadow_color };
	            if (groups[i].default) style.mt = _markerTemplate;
	            temp.push({
	                properties: { style: JSON.stringify(style) },
	                id: groups[i].id, action: "update"
	            });
	        }
	        if (!FormData.prototype.set) {
	            sendCrossDomainJSONRequest(_aisLayerSearcher.baseUrl + 'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] + '&objects=' + encodeURIComponent(JSON.stringify(temp)), function (r) {
	                if (!r.Status || r.Status.toLowerCase() != "ok") console.log(r);
	                resolve(count + 1);
	            });
	        } else {
	            var form = new FormData();
	            form.set('WrapStyle', 'none');
	            form.set('LayerName', _myFleetLayers[0]);
	            form.set('objects', JSON.stringify(temp));
	            fetch(_aisLayerSearcher.baseUrl + 'VectorLayer/ModifyVectorObjects.ashx', {
	                credentials: 'include',
	                method: "POST",
	                body: form
	            }).then(function (r) {
	                return r.json();
	            }).then(function (r) {
	                if (!r.Status || r.Status.toLowerCase() != "ok") console.log(r);
	                resolve(count + 1);
	            }).catch(function (err) {
	                console.log(err);
	                resolve(count + 1);
	            });
	        }
	    });
	};
	
	module.exports = function (_ref) {
	    var aisLayerSearcher = _ref.aisLayerSearcher,
	        toolbox = _ref.toolbox;
	
	    _tools = toolbox;
	    _aisLayerSearcher = aisLayerSearcher;
	    _mapID = String($(_queryMapLayers.buildedTree).find("[MapID]")[0].gmxProperties.properties.MapID);
	    var addGroupField = function addGroupField(lid, resolve, reject, vessels) {
	        console.log("add group and style field");
	        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/Update.ashx?VectorLayerID=' + lid + '&columns=[{"Name":"mmsi","OldName":"mmsi","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"mmsi\\""},{"Name":"imo","OldName":"imo","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"imo\\""},{"Name":"gmx_id","OldName":"gmx_id","ColumnSimpleType":"Integer","IsPrimary":true,"IsIdentity":true,"IsComputed":false,"expression":"\\"gmx_id\\""},{"Name":"group","OldName":"group","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"group\\""},{"Name":"style","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"style\\""}]', function (response) {
	            if (response.Status.toLowerCase() == "ok") setTimeout(function run() {
	                sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + "AsyncTask.ashx?TaskID=" + response.Result.TaskID, function (response) {
	                    if (response.Status.toLowerCase() == "ok") {
	                        if (!response.Result.Completed) setTimeout(run, 1000);else {
	                            if (response.Result.ErorInfo) reject(response);else resolve(vessels);
	                        }
	                    } else reject(response);
	                });
	            }, 1000);
	        });
	    },
	        addDefaultGroup = function addDefaultGroup(resolve, reject, vessels) {
	        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] + '&objects=[{"properties":{"group": null},"action":"insert"}]', function (response) {
	            if (response.Status.toLowerCase() == "ok") {
	                sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/Search.ashx?layer=' + _myFleetLayers[0] + '&query="group" is null and "mmsi" is null and "imo" is null', function (response) {
	                    if (response.Status.toLowerCase() == "ok" && response.Result.values && response.Result.values.length > 0) {
	                        var f = response.Result.fields,
	                            v = response.Result.values;
	                        console.log("insert def group");
	                        vessels.push({ imo: null, mmsi: null, group: null, gmx_id: v[0][f.indexOf('gmx_id')] });
	                        resolve(vessels);
	                    } else reject(response);
	                });
	            } else reject(response);
	        });
	    },
	        fetchMyFleet = function fetchMyFleet(lid) {
	        return new Promise(function (resolve, reject) {
	            sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + "VectorLayer/Search.ashx?layer=" + lid, function (response) {
	                if (response.Status.toLowerCase() == "ok") {
	                    var v = response.Result.values,
	                        f = response.Result.fields,
	                        vessels = [];
	                    for (var i = 0; i < v.length; ++i) {
	                        vessels.push({});
	                        for (var j = 0; j < f.length; ++j) {
	                            vessels[i][f[j]] = v[i][j];
	                        }
	                    }
	
	                    new Promise(function (rs, rj) {
	                        if (f.indexOf('group') < 0 || f.indexOf('style') < 0) addGroupField(lid, rs, rj, vessels);else rs();
	                    }).then(function () {
	                        if (Polyfill.findIndex(vessels, function (v) {
	                            return !v.imo && !v.mmsi && !v.group;
	                        }) < 0) addDefaultGroup(resolve, reject, vessels);else resolve(vessels);
	                    }, function (r) {
	                        return reject(r);
	                    });
	                } else reject(response);
	            });
	        });
	    };
	
	    _prepared = new Promise(function (resolve, reject) {
	        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + "User/GetUserInfo.ashx", function (response) {
	            if (response.Status.toLowerCase() == "ok" && response.Result) resolve(response);
	            if (response.Status.toLowerCase() == "ok" && !response.Result) reject({ Status: "auth" });else reject(response);
	        });
	    }).then(function (response) {
	        var nickname = response.Result.Nickname;
	        return new Promise(function (resolve, reject) {
	            if (nickname == 'scf_captain' && _mapID == 'KGEJB') resolve({ Status: "ok", Result: { count: 1, layers: [{ LayerID: "0A5CE9C59487441689ABF3031991BF2F" }] } });else sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + "Layer/Search2.ashx?page=0&pageSize=50&orderby=title &query=([Title]='myfleet" + _mapID + "' and [OwnerNickname]='" + nickname + "')", function (response) {
	                if (response.Status.toLowerCase() == "ok" && response.Result.count > 0) resolve(response);else reject(response); // no my fleet layer
	            });
	        });
	    }).then(function (response) {
	        var lid = response.Result.layers[0].LayerID;
	        _myFleetLayers.push(lid);
	        return fetchMyFleet(lid);
	    }, function (rejectedResponse) {
	        if (rejectedResponse.Status && rejectedResponse.Status.toLowerCase() == "ok") return Promise.resolve([]); // no mf layer
	        else return Promise.reject(rejectedResponse); // smth wrong
	    }).then(function (vessels) {
	        //console.log('INIT REPAINT MAP')
	        _vessels = vessels.map(function (v) {
	            return v;
	        });
	        _tools.specialVesselFilters = { key: "drawMarker", value: function value(args, ai, displayed) {
	                var vessel = Polyfill.find(_vessels, function (v) {
	                    return v.mmsi && v.mmsi == args.properties[ai.mmsi];
	                });
	                if (vessel) {
	                    var group = Polyfill.find(_vessels, function (v) {
	                        return !v.mmsi && !v.imo && v.group == vessel.group;
	                    });
	                    if (vessel.group) group = emptyGroup(vessel.group, false, group.gmx_id, group.style);else group = emptyGroup(_defaultGroup, true, group.gmx_id, group.style);
	                    _tools.drawMyFleetMarker(args, _markerTemplate, group, ai, (displayed == "all" || displayed.indexOf(vessel.mmsi.toString()) >= 0) && _view.notDisplayed.indexOf(vessel.mmsi.toString()) < 0);
	                }
	            }
	            // _repaintMap(vessels); // only on init
	        };return Promise.resolve();
	    }.bind(this));
	
	    return {
	        get isDirty() {
	            return _isDirty;
	        },
	        set isDirty(value) {
	            _isDirty = value;
	        },
	        get data() {
	            return _data;
	        },
	        set data(value) {
	            _data = value;
	        },
	        get view() {
	            return _view;
	        },
	        set view(value) {
	            _view = value;
	        },
	        get vessels() {
	            var myfleet = _data.groups.reduce(function (p, c) {
	                c.vessels.forEach(function (v) {
	                    if (v.mmsi) p.push({ mmsi: v.mmsi, imo: v.imo });
	                });
	                return p;
	            }, []);
	            return myfleet;
	        },
	        findIndex: function findIndex(vessel) {
	            if (_vessels.length == 0) return -1;
	            return Polyfill.findIndex(_vessels, function (v) {
	                return v.mmsi == vessel.mmsi && v.imo == vessel.imo;
	            });
	        },
	        load: function load(actualUpdate) {
	            var thisInst = this;
	            return _prepared.then(function () {
	                if (_myFleetLayers.length == 0 || !thisInst.isDirty) return Promise.resolve();
	
	                return fetchMyFleet(_myFleetLayers[0]).then(function (vessels) {
	                    _vessels = vessels;
	                    return _loadVoyageInfo(vessels);
	                }).then(function (data) {
	                    _data = data;
	                    _isDirty = false;
	                    return Promise.resolve();
	                }).catch(function (error) {
	                    _isDirty = false;
	                    return Promise.reject(error);
	                });
	            });
	        },
	        update: function update() {
	            _actualUpdate = new Date().getTime();
	            var thisModel = this,
	                actualUpdate = _actualUpdate;
	            this.view.inProgress(true);
	            this.load(actualUpdate).then(function () {
	                if (_actualUpdate == actualUpdate) {
	                    thisModel.view.inProgress(false);
	                    if (_data) thisModel.view.repaint();
	                }
	            }, function (json) {
	                thisModel.dataSrc = null;
	                if (json.Status && json.Status.toLowerCase() == "auth" || json.ErrorInfo && json.ErrorInfo.some && json.ErrorInfo.some(function (r) {
	                    return r.Status.toLowerCase() == "auth";
	                })) thisModel.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], groups: [] };else {
	                    //thisModel.data = {msg:[{txt:"!!!"}], vessels:[]};
	                    console.log(json);
	                }
	                thisModel.view.inProgress(false);
	                thisModel.view.repaint();
	            });
	        },
	        get markerTemplate() {
	            return _markerTemplate;
	        },
	        set markerTemplate(v) {
	            _markerTemplate = v;
	        },
	        markMembers: function markMembers(vessels) {
	            if (this.data && this.data.groups) {
	                var membCounter = 0;
	                this.data.groups.forEach(function (g) {
	                    g.vessels.forEach(function (v) {
	                        var i = Polyfill.findIndex(vessels, function (vv) {
	                            return v.mmsi == vv.mmsi && v.imo == v.imo;
	                        });
	                        if (i > -1) {
	                            var member = vessels[i];
	                            member.mf_member = "visibilty:visible";
	                            vessels.splice(i, 1);
	                            vessels.splice(membCounter++, 0, member);
	                        }
	                    });
	                });
	            }
	        },
	        createGroup: function createGroup(name) {
	            if (!_myFleetLayers.length) return Promise.reject({ Status: "error", ErrorInfo: "no data" });
	
	            return new Promise(function (resolve, reject) {
	                sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] + '&objects=[{"properties":{ "group": "' + name.replace(/"/g, '\\\"') + '"},"action":"insert"}]', function (response) {
	                    if (response.Status.toLowerCase() == "ok") {
	                        sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/Search.ashx?layer=' + _myFleetLayers[0] + '&query="group"=\'' + name.replace(/'/g, "''") + '\'', function (response) {
	                            if (response.Status.toLowerCase() == "ok" && response.Result.values && response.Result.values.length > 0) {
	                                var f = response.Result.fields,
	                                    v = response.Result.values;
	                                var group = emptyGroup(name, false, v[0][f.indexOf('gmx_id')]);
	                                _data.groups.push(group);
	                                _vessels.push({ gmx_id: v[0][f.indexOf('gmx_id')], mmsi: null, imo: null, group: name });
	                                resolve(group);
	                            } else reject(response);
	                        });
	                    } else reject(response);
	                });
	            });
	        },
	        deleteGroup: function deleteGroup(group) {
	            var objects = [],
	                thisModel = this,
	                i = void 0,
	                j = -1;
	            for (i = 0; i < _vessels.length; ++i) {
	                if (_vessels[i].group == group) {
	                    if (!_vessels[i].mmsi && !_vessels[i].imo) {
	                        j = i;
	                        objects.push({ id: _vessels[i].gmx_id, action: "delete" });
	                    } else {
	                        _vessels[i].group = null;
	                        objects.push({ properties: _vessels[i], id: _vessels[i].gmx_id, action: "update" });
	                    }
	                }
	            }
	            if (j < 0) return;
	            i = Polyfill.findIndex(_data.groups, function (g) {
	                return g.id == _vessels[j].gmx_id;
	            });
	            // console.log(i+", "+j + " - "+ _data.groups[i].id +" "+_vessels[j].gmx_id);    
	            _data.groups.splice(i, 1);
	            _data.groups.sort(_compareGroups);
	            // console.log(_data.groups)
	            // console.log(_vessels);            
	            _vessels.splice(j, 1);
	            sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] + '&objects=' + JSON.stringify(objects), function (response) {
	                if (response.Status.toLowerCase() == "ok") {
	                    thisModel.isDirty = true;
	                    thisModel.update();
	                } else console.log(response);
	            });
	        },
	        set onChanged(callback) {
	            _onChangedHandlers.push(callback);
	        },
	        changeMembers: function changeMembers(vessel) {
	            var _this = this;
	
	            var remove = false;
	            for (var i = 0; i < _vessels.length; ++i) {
	                if (_vessels[i].imo == vessel.imo && _vessels[i].mmsi == vessel.mmsi) {
	                    remove = _vessels[i].gmx_id;
	                    _vessels.splice(i, 1);
	                    //_tools.eraseMyFleetMarker(vessel.mmsi);
	                }
	            }
	            return new Promise(function (resolve, reject) {
	                if (!_myFleetLayers.length) {
	                    sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/CreateVectorLayer.ashx?Title=myfleet' + _mapID + '&geometrytype=point&Columns=' + '[{"Name":"mmsi","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"mmsi\\""},{"Name":"imo","ColumnSimpleType":"Integer","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"imo\\""},{"Name":"group","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"group\\""},{"Name":"style","ColumnSimpleType":"String","IsPrimary":false,"IsIdentity":false,"IsComputed":false,"expression":"\\"style\\""}]', function (response) {
	                        if (response.Status.toLowerCase() == "ok") {
	                            _myFleetLayers.push(response.Result.properties.name);
	                            addDefaultGroup(resolve, reject, []);
	                        } else reject(response); // creation failed
	                    });
	                } else resolve();
	            }).then(function () {
	                return new Promise(function (resolve, reject) {
	                    if (!remove) sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] + '&objects=[{"properties":{ "imo": ' + vessel.imo + ', "mmsi": ' + vessel.mmsi + '},"action":"insert"}]', function (response) {
	                        if (response.Status.toLowerCase() == "ok") {
	                            resolve();
	                            _vessels.push({ "mmsi": vessel.mmsi, "imo": vessel.imo, "gmx_id": response.Result[0] });
	                        } else reject(response);
	                    });else sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] + '&objects=[{"id":' + remove + ',"action":"delete"}]', function (response) {
	                        if (response.Status.toLowerCase() == "ok") resolve();else reject(response);
	                    });
	                }).then(function () {
	                    this.isDirty = true;
	                    _fireChanged();
	                    return Promise.resolve();
	                }.bind(_this), function (response) {
	                    console.log(response);
	                    this.isDirty = true;
	                    return Promise.resolve();
	                }.bind(_this));
	            });
	        },
	        changeGroup: function changeGroup(mmsi, group) {
	            var i = Polyfill.findIndex(_vessels, function (v) {
	                return v.mmsi == mmsi;
	            });
	            if (i < 0) return Promise.reject(mmsi);
	            _vessels[i].group = group;
	            return new Promise(function (resolve, reject) {
	                sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + 'VectorLayer/ModifyVectorObjects.ashx?LayerName=' + _myFleetLayers[0] + '&objects=[' + '{"properties":' + JSON.stringify(_vessels[i]) + ',"id":' + _vessels[i].gmx_id + ',"action":"update"}]', function (r) {
	                    if (r.Status && r.Status.toLowerCase() == "ok") {
	                        var _i = void 0,
	                            j = void 0,
	                            found = false;
	                        for (_i = 0; _i < _data.groups.length; ++_i) {
	                            for (j = 0; j < _data.groups[_i].vessels.length; ++j) {
	                                found = _data.groups[_i].vessels[j].mmsi == mmsi;
	                                if (found) break;
	                            }
	                            if (found) break;
	                        }
	                        var temp = _data.groups[_i].vessels.splice(j, 1)[0];
	                        _i = !group ? 0 : Polyfill.findIndex(_data.groups, function (g) {
	                            return g.title == group;
	                        });
	                        _data.groups[_i].vessels.push(temp);
	                        resolve(r);
	                    } else reject(r);
	                });
	            });
	        },
	        saveLabelSettings: function saveLabelSettings(count) {
	            var groups = [];
	            for (var i = 0; i < _data.groups.length; ++i) {
	                if (_data.groups[i].default) {
	                    groups.push(_data.groups[i]);
	                    break;
	                }
	            }
	            return _persistGroupsLook(count, groups);
	        },
	        saveGroupStyle: function saveGroupStyle(count) {
	            return _persistGroupsLook(count, _data.groups);
	        },
	        changeGroupStyle: function changeGroupStyle(i, colors) {
	            _data.groups[i].marker_style = colors.marker_style;
	            _data.groups[i].label_color = colors.label_color;
	            _data.groups[i].label_shadow = colors.label_shadow;
	            _tools.highlightMarker(i, this.data.groups[i]);
	
	            var g = _data.groups[i],
	                group = Polyfill.find(_vessels, function (v) {
	                return !v.mmsi && !v.imo && v.gmx_id == g.id;
	            }),
	                style = { ms: g.marker_style, lc: g.label_color, lsc: g.label_shadow_color };
	            if (g.default) style.mt = _markerTemplate;
	            group.style = JSON.stringify(style);
	            //console.log(group)
	            //console.log(this.data.groups[i].marker_style)
	        }
	    };
	};

/***/ }),
/* 16 */
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
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(18);
	var BaseView = __webpack_require__(9);
	
	var _searchString = "",
	    _setSearchInputValue = function _setSearchInputValue(s) {
	    var searchBut = this.frame.find('.filter .search'),
	        removeBut = this.frame.find('.filter .remove'),
	        _searchString = s;
	
	    this.searchInput.val(_searchString);
	    if (s != "") {
	        removeBut.show();
	        searchBut.hide();
	    } else removeBut.click();
	},
	    _highlight = void 0,
	    _tools = void 0,
	    _displayedOnly = [];
	
	var DbSearchView = function DbSearchView(_ref) {
	    var _this = this;
	
	    var model = _ref.model,
	        highlight = _ref.highlight,
	        tools = _ref.tools;
	
	    BaseView.call(this, model, tools);
	    _highlight = highlight;
	    _tools = tools;
	    var needLegendSwitch = _tools.hasAlternativeLayers,
	        needAltLegend = !!(needLegendSwitch && needLegendSwitch._map);
	    this.frame = $(Handlebars.compile('<div class="ais_view search_view">' + '<table border=0 class="instruments">' + '<tr><td colspan="2"><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/>' + '<div><img class="search clicable" src="plugins/AIS/AISSearch/svg/search.svg">' + '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg">' + '</div></div>' + '</td></tr>' + '<tr><td class="time" colspan="2"><span class="label">{{i "AISSearch2.time_switch"}}:</span>' + '<span class="utc on unselectable" unselectable="on">UTC</span><span class="local unselectable" unselectable="on">{{i "AISSearch2.time_local"}}</span>' + '<span class="sync-switch-slider-description" style="padding: 0;margin-left: 10px;line-height:12px">{{i "AISSearch2.thisVesselOnly"}}</span>' + '<label class="sync-switch switch only_this" style="margin-left:5px"><input type="checkbox">' + '<div class="sync-switch-slider switch-slider round"></div></label>' + '</td></tr>' + (needLegendSwitch ? '<tr><td class="legend" colspan="2"><span class="label">{{i "AISSearch2.legend_switch"}}:</span>' + '<span class="type unselectable on" unselectable="on">{{i "AISSearch2.legend_type"}}</span>' + '<span class="speed unselectable" unselectable="on">{{i "AISSearch2.legend_speed"}}</span></td></tr>' : '') + '<tr><td><div class="calendar"></div></td>' + '<td style="padding-left:5px;padding-right:25px;vertical-align:top;"><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}">' + '<div class="progress">' + this.gifLoader + '</div>' + '<div class="reload"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#2f3c47" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></div>' + '</div></td></tr>' + '</table>' + '<div class="ais_history">' + '<table class="ais_positions_date"><tr><td>NO HISTORY FOUND</td></tr></table>' + '</div>' + '<table class="start_screen"><tr><td>' + '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">' + '<div>{{{i "AISSearh2.searchresults_view"}}}' + '</div></td></tr></table>' + '<div class="suggestions"><div class="suggestion">SOME VESSEL<br><span>mmsi:0, imo:0</span></div></div>' + '</div>')());
	    if (needAltLegend) {
	        _tools.switchLegend(needAltLegend);
	        this.frame.find('.legend span').removeClass("on");
	        this.frame.find('.legend .speed').addClass('on');
	    }
	
	    Object.defineProperty(this, "topOffset", {
	        get: function get() {
	            var rv = $('.ais_tabs')[0].getBoundingClientRect().height + this.frame.find('.instruments')[0].getBoundingClientRect().height;
	            return rv;
	        }
	    });
	
	    this.container = this.frame.find('.ais_history');
	    this.startScreen = this.frame.find('.start_screen');
	    this.tableTemplate = '{{#if msg}}<div class="message">{{msg}}</div>{{/if}}' + '<table class="ais_positions_date header"><tr>' + '<td></td>' + '<td><span class="date"></span></td>' + '<td><div class="track all"><input type="checkbox" title="{{i "AISSearch2.allDailyTracks"}}"></div></td>' + '<td><div class="count">{{total}}</div></td></tr></table>' + '{{#each vessels}}' + '<table class="ais_positions_date" border=0><tr>' + '<td><div class="open_positions ui-helper-noselect icon-right-open" title="{{i "AISSearch2.voyageInfo"}}"></div></td>' + '<td><span class="date">{{{ts_pos_utc}}}</span></td>' + '<td><div class="track" date="{{{ts_pos_utc}}}"><input type="checkbox" title="{{i "AISSearch2.dailyTrack"}}"></div></td>' + '<td><div class="count">{{count}}</div></td></tr></table>' + '<div id="voyage_info{{n}}"></div>' + '{{/each}}';
	
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
	    td.eq(td.length - 1).after('<td>&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="' + _gtxt('AISSearch2.calendar_today') + '" src="plugins/AIS/AISSearch/svg/calendar.svg"></td>');
	
	    calendar.find('.default_date').on('click', function () {
	        var db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
	        _this.calendar.getDateInterval().set('dateBegin', db.dateBegin);
	        _this.calendar.getDateInterval().set('dateEnd', db.dateEnd);
	        nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
	    });
	
	    //sidebarControl && sidebarControl.on('closing', ()=>calendar.reset())
	    this.frame.on('click', function (e) {
	        if (e.target.classList.toString().search(/CalendarWidget/) < 0) {
	            _this.calendar.reset();
	        }
	        suggestions.hide();
	    }.bind(this));
	
	    this.frame.find('.time .only_this  input[type="checkbox"]').click(function (e) {
	        _displayedOnly.length = 0;
	        if (e.currentTarget.checked && _this.frame.find('.ais_positions_date:not(.header)')[0]) {
	            _displayedOnly.push(_this.model.data.vessels[0].positions[0].mmsi.toString());
	            _tools.showVesselsOnMap(_displayedOnly);
	        } else {
	            _tools.showVesselsOnMap("all");
	        }
	    }.bind(this));
	
	    _tools.onLegendSwitched(function () {
	        var ic = _this.frame.find('.legend_icon'),
	            ica = _this.frame.find('.legend_iconalt');
	        if (ic.is(':visible')) {
	            ic.hide();ica.show();
	        } else {
	            ica.hide();ic.show();
	        }
	    }.bind(this));
	    this.frame.find('.legend .type,.speed').click(function (e) {
	        var trg = $(e.currentTarget);
	        if (!trg.is('.on')) {
	            _this.frame.find('.legend span').removeClass("on");
	            trg.addClass('on');
	            _tools.switchLegend(trg.is('.speed'));
	        }
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
	
	    this.frame.find('.refresh .reload').click(function (e) {
	        if (e.currentTarget.style.display = "block") {
	            _this.model.isDirty = true;
	            _this.model.update();
	        }
	    }.bind(this));
	
	    this.searchInput = this.frame.find('.filter input');
	
	    var searchBut = this.frame.find('.filter .search'),
	        removeBut = this.frame.find('.filter .remove'),
	        delay = void 0,
	        suggestions = this.frame.find('.suggestions'),
	        suggestionsCount = 12,
	        suggestionsFrame = { first: 0, current: 0, last: suggestionsCount - 1 },
	        found = { values: [] },
	        searchDone = function searchDone() {
	        if (found.values.length > 0) {
	            _searchString = found.values[suggestionsFrame.current].vessel_name;
	            this.searchInput.val(_searchString);
	            var v = found.values[suggestionsFrame.current];
	            if (!this.vessel || this.vessel.mmsi != v.mmsi || !this.frame.find('.ais_positions_date:not(.header)')[0]) {
	                this.vessel = v;
	                this.show();
	            }
	        } else {
	            _clean.call(this);
	            _cleanMap.call(this);
	        }
	    },
	        doSearch = function doSearch(actualId) {
	        //console.log(_searchString)
	        new Promise(function (resolve, reject) {
	            this.model.searcher.searchString2(_searchString, true, function (response) {
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
	
	            if (actualId != delay) return;
	
	            // SUCCEEDED
	            if (found.values.length == 0) {
	                suggestions.hide();
	                return;
	            }
	
	            //console.log("ss: "+_searchString)
	            if (_searchString == "") {
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
	        this.searchInput.focus();
	        clearTimeout(delay);
	        removeBut.hide();
	        searchBut.show();
	        suggestions.hide();
	        _clean.call(this);
	        _cleanMap.call(this);
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
	
	    var prepareSearchInput = function prepareSearchInput(temp, keyCode) {
	        removeBut.show();
	        searchBut.hide();
	        if (_searchString == temp && (!keyCode || keyCode != 13)) return false;
	        _searchString = temp;
	        clearTimeout(delay);
	        if (_searchString == "") {
	            removeBut.click();
	            return false;
	        }
	        return true;
	    };
	    this.searchInput.keyup(function (e) {
	        var _this3 = this;
	
	        var temp = (this.searchInput.val() || "").replace(/^\s+/, "").replace(/\s+$/, "");
	        if (!prepareSearchInput(temp, e.keyCode)) return;
	        if (e.keyCode == 13) {
	            suggestions.hide();
	            searchDone.call(this);
	        } else delay = setTimeout(function () {
	            doSearch.apply(_this3, [delay]);
	        }.bind(this), 200);
	        //nsGmx.leafletMap.removeLayer(highlight);
	    }.bind(this));
	    this.searchInput.on("paste", function (e) {
	        var _this4 = this;
	
	        var temp = ((e.originalEvent || window.clipboardData).clipboardData.getData('text') || "").replace(/^\s+/, "").replace(/\s+$/, "");
	        if (!prepareSearchInput(temp)) return;
	        delay = setTimeout(function () {
	            doSearch.apply(_this4, [delay]);
	        }.bind(this), 200);
	    }.bind(this));
	};
	
	DbSearchView.prototype = Object.create(BaseView.prototype);
	
	var _clean = function _clean() {
	    this.frame.find('.open_positions').off('click');
	    this.frame.find('.ais_positions_date .track input[type="checkbox"]').off('click');
	    var scrollCont = this.container.find('.mCSB_container');
	    if (scrollCont[0]) scrollCont.empty();else this.container.empty();
	    //console.log("EMPTY ON SELF.CLEAN "+this)
	    this.startScreen.css({ visibility: "hidden" });
	    nsGmx.leafletMap.removeLayer(_highlight);
	},
	    _cleanMap = function _cleanMap() {
	    if (_displayedOnly.length) this.frame.find('.time .only_this  input[type="checkbox"]').click();
	};
	
	DbSearchView.prototype.inProgress = function (state) {
	    var progress = this.frame.find('.refresh div.progress'),
	        reload = this.frame.find('.refresh div.reload');
	    if (state) {
	        progress.show();
	        reload.hide();
	    } else {
	        progress.hide();
	        reload.show();
	    }
	};
	
	var _vi_template = '<table class="ais_positions">' + '{{#each positions}}' + '<tr>' + '<td  title="{{i "AISSearch2.info"}}"><img class="show_info" id="show_info{{@index}}" src="plugins/AIS/AISSearch/svg/info.svg"></td>' + '<td><span class="utc_time">{{tm_pos_utc}}</span><span class="local_time">{{tm_pos_loc}}</span></td>' + '<td><span class="utc_date">{{dt_pos_utc}}</span><span class="local_date">{{dt_pos_loc}}</span></td>' + '<td><img src="{{icon}}" class="legend_icon rotateimg{{icon_rot}}"><img src="{{iconAlt}}" class="legend_iconalt rotateimg{{icon_rot}}"></td>' + '<td><img src="{{source}}"></td>' + '<td>{{longitude}}&nbsp;&nbsp;{{latitude}}</td>' + '<td><div class="show_pos" id="show_pos{{@index}}" title="{{i "AISSearch2.position"}}"><img src="plugins/AIS/AISSearch/svg/center.svg"></div></td>' + '</tr>' + '<tr><td colspan="7" class="more"><hr><div class="vi_more">' + '<div class="c1">COG | SOG:</div><div class="c2">&nbsp;{{cog}} {{#if cog_sog}}&nbsp;{{/if}} {{sog}}</div>' + '<div class="c1">HDG | ROT:</div><div class="c2">&nbsp;{{heading}} {{#if heading_rot}}&nbsp;{{/if}} {{rot}}</div>' + '<div class="c1">{{i "AISSearch2.draught"}}:</div><div class="c2">&nbsp;{{draught}}</div>' + '<div class="c1">{{i "AISSearch2.destination"}}:</div><div class="c2">&nbsp;{{destination}}</div>' + '<div class="c1">{{i "AISSearch2.nav_status"}}:</div><div class="c2">&nbsp;{{nav_status}}</div>' + '<div class="c1">ETA:</div><div class="c2">&nbsp;<span class="utc_time">{{eta_utc}}</span><span class="local_time">{{eta_loc}}</span></div>' + '</div></td></tr>' + '{{/each}}' + '</table>';
	
	var _prepare_history = function _prepare_history() {
	    var _this5 = this;
	
	    //console.log(_tools.displayedTrack)     
	    if (this.model.data.vessels.length > 0 && _tools.displayedTrack && _tools.displayedTrack.mmsi == this.model.data.vessels[0].positions[0].mmsi) {
	        var checkTrack = void 0,
	            modelDate = void 0,
	            trackDate = void 0,
	            checkAllTracks = this.frame.find('.ais_positions_date.header .track input')[0];
	        checkAllTracks.checked = true;
	        this.frame.find('.ais_positions_date:not(.header)').each(function (i, el) {
	            if (_tools.displayedTrack.dates) {
	                modelDate = new Date(_this5.model.data.vessels[i].positions[0].ts_pos_org * 1000).setUTCHours(0, 0, 0, 0);
	                checkTrack = false;
	                for (var j = 0; j < _tools.displayedTrack.dates.list.length; ++j) {
	                    trackDate = _tools.displayedTrack.dates.list[j];
	                    if (modelDate === trackDate.getTime()) {
	                        checkTrack = $(el).find('.track:not(.all) input')[0];
	                        checkTrack.checked = true;
	                        break;
	                    }
	                }
	                if (!checkTrack) checkAllTracks.checked = false;
	            } else $(el).find('.track input:not(.all)')[0].checked = true;
	        });
	    }
	};
	
	DbSearchView.prototype.repaint = function () {
	    var _this6 = this;
	
	    _clean.call(this);
	    BaseView.prototype.repaint.apply(this, arguments);
	
	    _prepare_history.call(this);
	
	    //console.log("REPAINT") 
	    _tools.clearMyFleetMarkers();
	    _displayedOnly.length = 0;
	    if (this.frame.find('.time .only_this  input[type="checkbox"]')[0].checked) {
	        _displayedOnly.push(this.model.data.vessels[0].positions[0].mmsi.toString());
	        _tools.showVesselsOnMap(_displayedOnly);
	    } else {
	        _tools.showVesselsOnMap("all");
	    }
	
	    var openPos = this.frame.find('.open_positions'),
	        switchLegendIcons = function () {
	        var ic = this.frame.find('.legend_icon'),
	            ica = this.frame.find('.legend_iconalt');
	        if (this.frame.find('.legend .speed').is('.on')) {
	            ica.show();ic.hide();
	        } else {
	            ic.show();ica.hide();
	        }
	    }.bind(this);
	    openPos.each(function (ind, elm) {
	        $(elm).click(function (e) {
	            var icon = $(e.target),
	                vi_cont = _this6.frame.find('#voyage_info' + ind);
	            if (icon.is('.icon-down-open')) {
	                icon.removeClass('icon-down-open').addClass('.icon-right-open');
	                vi_cont.find('.ais_positions td[class!="more"]').off('click');
	                vi_cont.empty();
	            } else {
	                icon.addClass('icon-down-open').removeClass('.icon-right-open');
	                vi_cont.html(Handlebars.compile(_vi_template)(_this6.model.data.vessels[ind]));
	                if (_this6.frame.find('.time .local').is('.on')) {
	                    vi_cont.find('.utc_time').hide();
	                    vi_cont.find('.local_time').show();
	                    vi_cont.find('.utc_date').hide();
	                    vi_cont.find('.local_date').show();
	                }
	                switchLegendIcons();
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
	                var infoDialog = _this6.infoDialogView,
	                    vessel = _this6.vessel;
	                vi_cont.find('.ais_positions .show_info').click(function (e) {
	                    var i = e.currentTarget.id.replace(/show_info/, ""),
	                        position = _this6.model.data.vessels[ind].positions[i];
	                    position.vessel_name = vessel.vessel_name;
	                    position.imo = vessel.imo;
	                    position.latitude = position.ymax;
	                    position.longitude = position.xmax;
	                    position.source = position.source_orig;
	                    //console.log(vessel)
	                    //console.log(position)
	                    infoDialog.show(position, false);
	                    e.stopPropagation();
	                }.bind(_this6));
	                vi_cont.find('.ais_positions .show_pos').click(function (e) {
	                    //showPosition
	                    var i = e.currentTarget.id.replace(/show_pos/, ""),
	                        vessel = _this6.model.data.vessels[ind].positions[parseInt(i)];
	                    _this6.positionMap(vessel, _this6.calendar.getDateInterval());
	
	                    _this6.frame.find('.track:not(.all) input')[ind].checked = true;
	                    allTracksInput[0].checked = _this6.frame.find('.track:not(.all) input:checked').length == _this6.model.data.vessels.length;
	
	                    var dates = getDates.call(_this6);
	                    _this6.showTrack({ mmsi: _this6.model.data.vessels[0].positions[0].mmsi }, dates);
	                    e.stopPropagation();
	                }.bind(_this6));
	            }
	        }.bind(_this6));
	    });
	
	    var getDates = function getDates(needAll) {
	        var _this7 = this;
	
	        var dates = [];
	        this.frame.find('.ais_positions_date .track:not(.all)').each(function (i, el) {
	            var input = $('input', el)[0];
	            if (needAll) input.checked = true;
	            if (input.checked) dates.push(new Date(new Date(1000 * _this7.model.data.vessels[i].positions[0].ts_pos_utc).setUTCHours(0, 0, 0, 0)));
	        });
	        return dates;
	    },
	        allTracksInput = this.frame.find('.ais_positions_date .track.all input[type="checkbox"]');
	    allTracksInput.click(function (e) {
	        if (!_this6.model.data.vessels || !_this6.model.data.vessels.length) return;
	        var calendarInterval = _this6.calendar.getDateInterval(),
	            interval = { dateBegin: calendarInterval.get("dateBegin"), dateEnd: calendarInterval.get("dateEnd") };
	        nsGmx.widgets.commonCalendar.setDateInterval(interval.dateBegin, interval.dateEnd);
	        if (!e.target.checked) {
	            _this6.frame.find('.ais_positions_date .track:not(.all)').each(function (i, el) {
	                $('input', el)[0].checked = false;
	            });
	            _this6.showTrack();
	        } else _this6.showTrack({ mmsi: _this6.model.data.vessels[0].positions[0].mmsi }, getDates.call(_this6, true));
	    }.bind(this));
	    this.frame.find('.ais_positions_date .track:not(.all) input[type="checkbox"]').click(function (e) {
	        var calendarInterval = _this6.calendar.getDateInterval(),
	            interval = { dateBegin: calendarInterval.get("dateBegin"), dateEnd: calendarInterval.get("dateEnd") };
	        nsGmx.widgets.commonCalendar.setDateInterval(interval.dateBegin, interval.dateEnd);
	        var dates = getDates.call(_this6);
	        allTracksInput[0].checked = dates.length == _this6.model.data.vessels.length;
	        _this6.showTrack({ mmsi: _this6.model.data.vessels[0].positions[0].mmsi }, dates);
	    }.bind(this));
	
	    if (this.model.data.vessels.length == 1) openPos.eq(0).click();
	
	    if (this.vessel.lastPosition) {
	        this.positionMap(this.vessel, this.calendar.getDateInterval());
	        this.vessel.lastPosition = false;
	    }
	};
	
	Object.defineProperty(DbSearchView.prototype, "vessel", {
	    get: function get() {
	        return this.model.vessel;
	    },
	    set: function set(v) {
	        _setSearchInputValue.call(this, v.vessel_name);
	        _searchString = v.vessel_name;
	
	        var positionDate = nsGmx.DateInterval.getUTCDayBoundary(new Date(v.ts_pos_org * 1000));
	        this.model.vessel = null;
	        var checkInterval = this.calendar.getDateInterval();
	        // console.log(positionDate.dateBegin + '<' + checkInterval.get('dateBegin'))
	        // console.log(checkInterval.get('dateEnd') + '<' + positionDate.dateEnd)
	        if (positionDate.dateBegin < checkInterval.get('dateBegin') || checkInterval.get('dateEnd') < positionDate.dateEnd) {
	            this.calendar.getDateInterval().set('dateBegin', positionDate.dateBegin);
	            this.calendar.getDateInterval().set('dateEnd', positionDate.dateEnd);
	            this.model.historyInterval = { dateBegin: positionDate.dateBegin, dateEnd: positionDate.dateEnd };
	        } else this.model.historyInterval = { dateBegin: checkInterval.get('dateBegin'), dateEnd: checkInterval.get('dateEnd') };
	        this.model.vessel = v;
	        this.model.isDirty = true;
	    }
	});
	
	DbSearchView.prototype.show = function () {
	    this.frame.show();
	    this.searchInput.focus();
	    BaseView.prototype.show.apply(this, arguments);
	    if (!this.vessel) return;
	
	    if (!_tools.displayedTrack) this.frame.find('.ais_positions_date .track input[type="checkbox"]').each(function (i, e) {
	        e.checked = false;
	    });
	
	    if (_displayedOnly.length) _tools.showVesselsOnMap(_displayedOnly);else _tools.showVesselsOnMap("all");
	};
	
	DbSearchView.prototype.hide = function () {
	    BaseView.prototype.hide.apply(this, arguments);
	    _tools.showVesselsOnMap("all");
	};
	
	DbSearchView.prototype.showTrack = function (vessel, dates) {
	    if (!vessel) {
	        _tools.showTrack([]);
	        return;
	    }
	    if (!dates && vessel.ts_pos_org) dates = [new Date(new Date(vessel.ts_pos_org * 1000).setUTCHours(0, 0, 0, 0))];
	
	    var dlg = $('.ui-dialog:contains("' + vessel.mmsi + '")');
	    $('.showtrack').attr('title', _gtxt('AISSearch2.show_track')).removeClass('ais active');
	    if (dlg[0]) dlg.find('.showtrack').attr('title', _gtxt('AISSearch2.hide_track')).addClass('ais active');
	    _tools.showTrack([vessel.mmsi], dates);
	};
	
	DbSearchView.prototype.positionMap = function (vessel, interval) {
	    //console.log("positionMap")
	    if (interval) nsGmx.widgets.commonCalendar.setDateInterval(interval.get("dateBegin"), interval.get("dateEnd"));
	
	    var xmin = vessel.xmin ? vessel.xmin : vessel.longitude,
	        xmax = vessel.xmax ? vessel.xmax : vessel.longitude,
	        ymin = vessel.ymin ? vessel.ymin : vessel.latitude,
	        ymax = vessel.ymax ? vessel.ymax : vessel.latitude,
	        zoom = nsGmx.leafletMap.getZoom();
	
	    nsGmx.leafletMap.setView([ymax, xmax < 0 ? 360 + xmax : xmax], zoom < 9 ? 12 : zoom);
	    nsGmx.leafletMap.removeLayer(_highlight);
	    _highlight.vessel = vessel;
	    _highlight.setLatLng([ymax, xmax < 0 ? 360 + xmax : xmax]).addTo(nsGmx.leafletMap);
	};
	
	module.exports = DbSearchView;

/***/ }),
/* 18 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 19 */
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
	        //vessel.source = 'plugins/AIS/AISSearch/svg/satellite-ais.svg'//vessel.source=='T-AIS'?_gtxt('AISSearch2.tais'):_gtxt('AISSearch2.sais');
	        vessel.source_orig = vessel.source;
	        vessel.source = vessel.source == 'T-AIS' ? 'plugins/AIS/AISSearch/svg/waterside-radar.svg' : 'plugins/AIS/AISSearch/svg/satellite-ais.svg';
	
	        vessel.xmin = vessel.longitude;
	        vessel.xmax = vessel.longitude;
	        vessel.ymin = vessel.latitude;
	        vessel.ymax = vessel.latitude;
	
	        vessel.longitude = _toDd(vessel.longitude, true);
	        vessel.latitude = _toDd(vessel.latitude);
	        aisLayerSearcher.placeVesselTypeIcon(vessel);
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
	                            var obj = {},
	                                d = void 0;
	                            for (var j = 0; j < fields.length; ++j) {
	                                obj[fields[j]] = c[j];
	                                if (fields[j] == 'ts_pos_utc') {
	                                    var dt = c[j],
	                                        t = dt - dt % (24 * 3600);
	                                    d = new Date(t * 1000);
	                                    obj['ts_pos_org'] = c[j];
	                                }
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
	                        resolve({ Status: "ok", Result: { values: positions, total: response.Result.values.length } });
	                    } else resolve(response);
	                });
	            }).then(function (response) {
	                //console.log(response)       
	                _this.isDirty = false;
	                if (response.Status.toLowerCase() == "ok") {
	                    _this.data = { vessels: response.Result.values, total: response.Result.total };
	                    return Promise.resolve();
	                } else {
	                    return Promise.reject(response);
	                }
	            });
	        },
	        update: function update() {
	            if (!this.vessel || !this.isDirty) return;
	
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
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var displayInfoDialog = __webpack_require__(21),
	    Polyfill = __webpack_require__(16),
	    VesselInfoScreen = __webpack_require__(26);
	
	var infoDialogCascade = [],
	    allIinfoDialogs = [],
	    vesselInfoScreen = void 0;
	
	module.exports = function (_ref) {
	    var tools = _ref.tools,
	        aisLayerSearcher = _ref.aisLayerSearcher,
	        modulePath = _ref.modulePath,
	        aisView = _ref.aisView,
	        myFleetView = _ref.myFleetView,
	        menuId = _ref.menuId;
	
	
	    vesselInfoScreen = new VesselInfoScreen({ modulePath: modulePath, aisServices: aisLayerSearcher.aisServices });
	    var _showPosition = function _showPosition(vessel, track) {
	        window.iconSidebarWidget.open(menuId);
	
	        aisView.vessel = vessel;
	        if (aisView.tab) if (aisView.tab.is('.active')) aisView.show();else aisView.tab.click();
	
	        aisView.showTrack(track);
	    },
	        _updateView = function _updateView(displayed, vessel, getmore) {
	        if (displayed.vessel.ts_pos_utc != vessel.ts_pos_utc) {
	            $(displayed.dialog).dialog("close");
	            return true;
	        } else return false;
	    };
	    return {
	        showPosition: function showPosition(vessel) {
	            _showPosition(vessel, vessel);
	            //aisView.showTrack(vessel);
	        },
	        show: function show(vessel, getmore) {
	            var ind = Polyfill.findIndex(allIinfoDialogs, function (d) {
	                return d.vessel.imo == vessel.imo && d.vessel.mmsi == vessel.mmsi;
	            }),
	                isNew = true,
	                dialogOffset = void 0;
	            if (ind >= 0) {
	                isNew = false;
	                var displayed = allIinfoDialogs[ind];
	                dialogOffset = $(displayed.dialog).parent().offset();
	                ind = Polyfill.findIndex(infoDialogCascade, function (d) {
	                    return d.id == displayed.dialog.id;
	                });
	                if (!_updateView(displayed, vessel)) {
	                    $(displayed.dialog).parent().insertAfter($('.ui-dialog').eq($('.ui-dialog').length - 1));
	                    return;
	                }
	            }
	
	            var dialog = displayInfoDialog({
	                vessel: vessel,
	                getmore: getmore,
	                displayedTrack: tools.displayedTrack,
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
	                myFleetView: myFleetView,
	                tools: tools
	            }, {
	                openVesselInfoScreen: vesselInfoScreen.open,
	                showTrack: tools.showTrack,
	                showPosition: _showPosition
	            });
	
	            if (!dialogOffset && infoDialogCascade.length > 0) {
	                var pos = $(infoDialogCascade[infoDialogCascade.length - 1]).parent().position();
	                dialogOffset = { left: pos.left - 10, top: pos.top + 10 };
	            }
	            if (dialogOffset) $(dialog).dialog("option", "position", [dialogOffset.left, dialogOffset.top]);
	            if (ind >= 0) infoDialogCascade.splice(ind, 0, dialog);else if (isNew) infoDialogCascade.push(dialog);
	
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
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(22);
	var SpecialFloatView = __webpack_require__(23);
	
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
		vessel.ts_eta = vessel.ts_eta ? formatDateTime(new Date(vessel.ts_eta * 1000)) : "";
		vessel.cog = !isNaN(vessel.cog) ? addUnit(round(vessel.cog, 5), "°") : vessel.cog;
		vessel.sog = !isNaN(vessel.sog) ? addUnit(round(vessel.sog, 5), nsGmx.Translations.getLanguage() == "rus" ? " уз" : " kn") : vessel.sog;
		vessel.rot = !isNaN(vessel.rot) ? addUnit(round(vessel.rot, 5), nsGmx.Translations.getLanguage() == "rus" ? "°/мин" : "°/min") : vessel.rot;
		vessel.heading = !isNaN(vessel.heading) ? addUnit(round(vessel.heading, 5), "°") : vessel.heading;
		vessel.draught = !isNaN(vessel.draught) ? addUnit(round(vessel.draught, 5), nsGmx.Translations.getLanguage() == "rus" ? " м" : " m") : vessel.draught;
		vessel.length = !isNaN(vessel.length) ? addUnit(vessel.length, nsGmx.Translations.getLanguage() == "rus" ? " м" : " m") : vessel.length;
		vessel.width = !isNaN(vessel.width) ? addUnit(vessel.width, nsGmx.Translations.getLanguage() == "rus" ? " м" : " m") : vessel.width;
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
	},
	    shipCams = {};
	
	module.exports = function (_ref, commands) {
		var vessel = _ref.vessel,
		    closeFunc = _ref.closeFunc,
		    aisLayerSearcher = _ref.aisLayerSearcher,
		    getmore = _ref.getmore,
		    modulePath = _ref.modulePath,
		    aisView = _ref.aisView,
		    displayedTrack = _ref.displayedTrack,
		    myFleetView = _ref.myFleetView,
		    tools = _ref.tools;
	
	
		if (!shipCams[vessel.mmsi]) {
			nsGmx.gmxMap.layers.forEach(function (l) {
				if (l && l._gmx && l._gmx.properties) {
					var props = l._gmx.properties,
					    title = props.title,
					    meta = props.MetaProperties;
					if (title && title.search(/^shipcam[^_]*_/) != -1 && meta.ships && meta.ships.Value.search(new RegExp('"' + vessel.mmsi + '"')) != -1) {
						shipCams[vessel.mmsi] = {
							layer: props.name,
							urls: meta.urls.Value
						};
					}
				}
			});
			//console.log(shipCams);
		}
	
		formatDate = aisLayerSearcher.formatDate;
		formatDateTime = aisLayerSearcher.formatDateTime;
	
		var myFleetModel = myFleetView.model,
		    add = myFleetModel && myFleetModel.findIndex(vessel) < 0;
	
		var canvas = $('<div class="ais_myfleet_dialog"/>'),
		    menu = $('<div class="column1 menu"></div>').appendTo(canvas),
		    photo = $('<div class="photo"><div></div></div>').appendTo(menu),
		    underphoto = $('<div class="underphoto"><div></div></div>').appendTo(menu),
		    content = $('<div class="column2 content"></div>'),
		    buttons = $('<div class="column3 buttons"></div>'),
		    gifLoader = '<img src="img/progress.gif">';
		//console.log(content);
	
		canvas.append(content).append(buttons);
	
		var searchInput = $('.leaflet-ext-search'),
		    dialogW = 610,
		    dialogH = 250,
		    posX = searchInput.offset().left + searchInput.width() - dialogW,
		    posY = searchInput.offset().top + searchInput.height() + 10,
		    dialog = showDialog(vessel.vessel_name, canvas[0], {
			width: dialogW, height: dialogH, posX: posX, posY: posY,
			closeFunc: closeFunc
		}),
		    vessel2 = void 0,
		    moreInfo = function moreInfo(v) {
			var smallShipIcon = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px" height="14px" viewBox="0 0 14 14" style="margin-left: 10px" xml:space="preserve">' + '<g style="fill: #48aff1;">' + '<path class="st0" d="M13.4,11H0.6c-0.2,0-0.4,0.1-0.5,0.3c-0.1,0.2-0.1,0.4,0,0.6l1.2,1.8C1.4,13.9,1.6,14,1.8,14h9.9   c0.2,0,0.3-0.1,0.4-0.2l1.7-1.8c0.2-0.2,0.2-0.4,0.1-0.7C13.9,11.1,13.7,11,13.4,11z"/>' + '<path class="st0" d="M9.3,9.7h2.9c0.2,0,0.4-0.1,0.5-0.3c0.1-0.2,0.1-0.4,0-0.6L9.8,4.5C9.7,4.3,9.4,4.2,9.2,4.3   C8.9,4.4,8.7,4.6,8.7,4.9v4.3C8.7,9.5,9,9.7,9.3,9.7z"/>' + '<path class="st0" d="M1.2,9.7H7c0.3,0,0.6-0.3,0.6-0.6V0.6c0-0.3-0.2-0.5-0.4-0.6C6.9-0.1,6.7,0,6.5,0.3L0.7,8.8   C0.6,9,0.5,9.2,0.6,9.4C0.7,9.6,0.9,9.7,1.2,9.7z"/>' + '</g>' + '</svg>',
			    vesselPropTempl = '<div class="vessel_prop vname"><b>{{vessel_name}}</b>' + smallShipIcon + '</div>' + '<div class="vessel_prop altvname"><b>' + (vessel2.registry_name && vessel2.registry_name != vessel2.vessel_name ? vessel2.registry_name : '') + '&nbsp;</b></div>';
	
			$('.content', canvas).append(Handlebars.compile('<div class="vessel_props1">' + vesselPropTempl + '<table>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.vessel_type"}}: </div></td><td><div class="vessel_prop value">{{vessel_type}}</div></td></tr>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.flag"}}: </div></td><td><div class="vessel_prop value">{{flag_country}}</div></td></tr>' + '<tr><td><div class="vessel_prop">IMO: </div></td><td><div class="vessel_prop value">{{imo}}</div></td></tr>' + '<tr><td><div class="vessel_prop">MMSI: </div></td><td><div class="vessel_prop value mmsi">{{mmsi}}</div></td></tr>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.callsign"}}: </div></td><td><div class="vessel_prop value mmsi">{{callsign}}</div></td></tr>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.source"}}: </div></td><td><div class="vessel_prop value">{{source}}</div></td></tr>' + '</table>' + '</div>')(v));
	
			$('.content', canvas).append(Handlebars.compile('<div class="vessel_props2">' + vesselPropTempl + '<table>' + '<tr><td><div class="vessel_prop">COG | SOG: </div></td><td><div class="vessel_prop value">{{cog}}&nbsp;&nbsp;&nbsp;{{sog}}</div></td></tr>' + '<tr><td><div class="vessel_prop">HDG | ROT: </div></td><td><div class="vessel_prop value">{{heading}}&nbsp;&nbsp;&nbsp;{{rot}}</div></td></tr>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.draught"}}: </div></td><td><div class="vessel_prop value">{{draught}}</div></td></tr>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.destination"}}: </div></td><td><div class="vessel_prop value">{{destination}}</div></td></tr>' + '<tr><td><div class="vessel_prop">{{i "AISSearch2.nav_status"}}: </div></td><td><div class="vessel_prop value">{{nav_status}}</div></td></tr>' + '<tr><td><div class="vessel_prop">ETA: </div></td><td><div class="vessel_prop value">{{ts_eta}}</div></td></tr>' + '</div>')(v));
	
			$(underphoto).append('<table><tr>' + '<td class="ais_refresh"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" height="16" width="16"><g class="nc-icon-wrapper" fill="#444444"><polyline data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 15,16 7,16 7,13 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 15,18 17,16 15,14 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" data-stroke="none" fill="#444444" points="15,18 17,16 15,14 " stroke-linejoin="miter" stroke-linecap="square" style="stroke: currentColor;fill: currentColor;"/> <polyline data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 9,8 17,8 17,11 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points="9,6 7,8 9,10 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" data-stroke="none" fill="#444444" points="9,6 7,8 9,10 " stroke-linejoin="miter" stroke-linecap="square" style="stroke: currentColor;fill: currentColor;"/> <rect x="2" y="1" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" width="20" height="22" stroke-linejoin="miter" style="stroke: currentColor;"/></g></svg></td>' + '<td><div class="vessel_prop coordinates"><span class="small">' + ddToDms(v.latitude, false) + ' ' + ddToDms(v.longitude, true) + '</small></div></td>' + '</tr></table>');
	
			var swap = "<span class='small'>" + toDd(v.latitude, false) + " " + toDd(v.longitude, true) + "</span>";
			$('.ais_refresh', underphoto).click(function (e) {
				var mi = $('.coordinates', underphoto),
				    t = mi.html();
				mi.html(swap);
				swap = t;
			});
	
			$('.vessel_props1', canvas).hide();
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
	
		$('<img src="' + scheme + window.serverBase.replace(/^https?:/, "") + 'plugins/ais/getphoto.ashx?mmsi=' + vessel.mmsi + '">').load(function () {
			if (this) $('div', photo).replaceWith(this);
		}).error(function () {
			$('<img src="' + scheme + '//photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi=' + vessel.mmsi + '">').load(function () {
				if (this) $('div', photo).replaceWith(this);
			});
		});
	
		// BUTTONS
		var menubuttons = $('<div class="menubuttons"></div>').appendTo(buttons);
	
		var openpage = $('<div class="button openpage" title="' + _gtxt('AISSearch2.show_info') + '">' + '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' + '<g class="nc-icon-wrapper" style="fill:currentColor">' + '<path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>' + '</g>' + '</svg>' + '</div>').appendTo(menubuttons).on('click', function () {
			return commands.openVesselInfoScreen.call(null, vessel, vessel2);
		});
	
		var showpos = $('<div class="button showpos" title="' + _gtxt('AISSearch2.show_pos') + '">' + '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" width="20" height="20"><g class="nc-icon-wrapper" fill="#444444"><polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 1,7 1,1 7,1 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 17,1 23,1 23,7 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 23,17 23,23 17,23 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 7,23 1,23 1,17 " stroke-linejoin="miter"/> <rect style="stroke:currentColor" x="8" y="8" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" width="8" height="8" stroke-linejoin="miter"/></g></svg>' + '</div>').appendTo(menubuttons).on('click', function () {
			if (!vessel.ts_pos_org) vessel.ts_pos_org = vessel.ts_pos_utc;
			vessel.lastPosition = true;
			commands.showPosition(vessel);
			// if(showtrack.is('.active'))
			// 	commands.showTrack.call(null, [vessel.mmsi])
		});
	
		var shipCam = shipCams[vessel.mmsi.toString()],
		    setImages = function setImages(shipCam, vessel) {
			var moment = new Date(vessel.ts_pos_org * 1000);
			moment.setMinutes(moment.getMinutes() + moment.getTimezoneOffset());
			moment = moment.getFullYear() + "-" + (moment.getMonth() + 1) + "-" + moment.getDate() + " " + moment.getHours() + ":" + moment.getMinutes() + ":" + moment.getSeconds();
			//console.log(moment)	
			var images = [];
			shipCam.urls.split(' ').forEach(function (url) {
				images.push({ url: serverBase.replace(/https?:/, document.location.protocol).replace(/\/$/, "") + url.replace(/"/g, '') + (url.search(/\?/) != -1 ? '&' : '?') + 'layer=' + shipCam.layer + '&mmsi=' + vessel.mmsi + '&ts=' + moment });
			});
			//console.log(images)	
			return images;
		};
	
		if (shipCam) {
			if (!shipCam.view) {
				shipCam.view = new SpecialFloatView(setImages(shipCam, vessel2 ? vessel2 : vessel), vessel.mmsi);
			}
			var special = shipCam.view;
			//console.log(special);
			var showCamBut = $('<div class="ais button showcam" title="' + _gtxt('AISSearch2.show_pos') + '">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22"><title>camera</title><g class="nc-icon-wrapper" fill="#384b50" style="fill:currentColor"><path d="M21,4H17L15,1H9L7,4H3A3,3,0,0,0,0,7V19a3,3,0,0,0,3,3H21a3,3,0,0,0,3-3V7A3,3,0,0,0,21,4ZM12,18a5,5,0,1,1,5-5A5,5,0,0,1,12,18Z"/></g></svg>' + '</div>').appendTo(menubuttons).on('click', function (e) {
				var b = e.currentTarget;
				if (b.classList.contains('active')) {
					b.classList.remove('active');
					shipCam.visible = false;
					special.close();
				} else {
					b.classList.add('active');
					special.show(setImages(shipCam, vessel2 ? vessel2 : vessel), function () {
						b.classList.remove('active');
						shipCam.visible = false;
					});
					shipCam.visible = true;
				}
			});
			//console.log(showCamBut)
			//console.log(shipCams[vessel.mmsi.toString()].visible)
			if (shipCam.visible) {
				showCamBut[0].classList.add('active');
				special.show(setImages(shipCam, vessel2 ? vessel2 : vessel), function () {
					showCamBut[0].classList.remove('active');
					shipCam.visible = false;
				});
			}
		}
	
		var addremoveIcon = function addremoveIcon(add) {
			return add ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g class="nc-icon-wrapper" fill="#444444" style="fill: currentColor;"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></g></svg>' : '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;fill: currentColor;" xml:space="preserve"><g><path class="st0" d="M4,6H2v14c0,1.1,0.9,2,2,2h14v-2H4V6z M20,2H8C6.9,2,6,2.9,6,4v12c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4    C22,2.9,21.1,2,20,2z M19,11h-4v4h-2v-4H9V9h4V5h2v4h4V11z"/></g><rect x="9" y="5" class="st0" width="10" height="4"/><rect x="9" y="11" class="st0" width="10" height="4"/></g></svg>';
		};
	
		var addremove = $('<div class="button addremove">' + addremoveIcon(add) + '</div>').attr('title', add ? _gtxt('AISSearch2.myfleet_add') : _gtxt('AISSearch2.myfleet_remove')).appendTo(menubuttons);
		if (myFleetModel.filterUpdating) addremove.addClass('disabled');
	
		addremove.on('click', function () {
			if (addremove.is('.disabled')) return;
	
			$('.addremove').addClass('disabled');
			addremove.hide();
			progress.append(gifLoader);
	
			myFleetView.beforeExcludeMember(vessel.mmsi.toString());
			myFleetModel.changeMembers(vessel).then(function () {
				add = myFleetModel.findIndex(vessel) < 0;
				var info = $('.icon-ship[vessel="' + vessel.mmsi + ' ' + vessel.imo + '"]');
				info.css('visibility', !add ? 'visible' : 'hidden');
				$('.vessel_prop.vname svg', canvas).css('visibility', add ? 'hidden' : 'visible');
	
				addremove.attr('title', add ? 'добавить в мой флот' : 'удалить из моего флота').html(addremoveIcon(add));
				progress.text('');
				$('.addremove').removeClass('disabled').show();
	
				tools.eraseMyFleetMarker(vessel.mmsi);
				if (myFleetView.isActive) myFleetView.show();else tools.redrawMarkers();
			}).catch(function (ex) {
				return console.log(ex);
			});
		});
		//}
	
		var progress = $('<div class="progress"></div>').appendTo(menubuttons);
	
		// TITLEBAR	
		canvas.parent('div').css({ 'margin': '0', 'overflow': 'hidden' });
		var titlebar = $(dialog).parent().find('.ui-dialog-titlebar').css('padding', '0').html('<table class="ais_info_dialog_titlebar">' + '<tr><td><div class="date">' + (!getmore ? Handlebars.compile('<span class="utc">{{{ts_pos_utc}}} UTC</span>{{{ts_pos_loc}}}')(vessel2 ? vessel2 : vessel) : '') + '</div></td>' + '<td><div class="choose chooser done"><span unselectable="on">' + _gtxt('AISSearch2.dialog_tab_params') + '</span></div></td>' + '<td><div class="choose chooser"><span unselectable="on">' + _gtxt('AISSearch2.dialog_tab_general') + '</span></div></td>' + '<td id="closebut" title="' + _gtxt('AISSearch2.close_but') + '"><div class="ais_info_dialog_close-button" title="' + _gtxt("AISSearch2.close_but") + '"></div></td></tr>' + '</table>'),
		    onDone = function onDone(e) {
			e.stopPropagation();
			$('.choose', titlebar).removeClass('done');
			$(e.currentTarget).addClass('done');
		};
	
		$('#closebut', titlebar).on('click', function (e) {
			$(dialog).dialog("close");
		}).on('mouseover', function (e) {
			$('.ais_info_dialog_close-button', titlebar).css('background', 'url("data:image/svg+xml;charset=utf8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cline x1=\'0\' y1=\'0\' x2=\'12\' y2=\'12\' style=\'stroke:%2348aff1;stroke-width:2px\'/%3E%3Cline x1=\'0\' y1=\'12\' x2=\'12\' y2=\'0\' style=\'stroke:%2348aff1;stroke-width:2px\'/%3E%3C/svg%3E") no-repeat');
		}).on('mouseout', function (e) {
			$('.ais_info_dialog_close-button', titlebar).attr('style', '');
		});
		//url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cline x1='0' y1='0' x2='12' y2='12' style='stroke:%2348aff1;stroke-width:2px'/%3E%3Cline x1='0' y1='12' x2='12' y2='0' style='stroke:%2348aff1;stroke-width:2px'/%3E%3C/svg%3E") no-repeat
		$('.chooser', titlebar).eq(1).on('mousedown', function (e) {
			onDone(e);$('.vessel_props1', canvas).show();$('.vessel_props2', canvas).hide();
		});
		$('.chooser', titlebar).eq(0).on('mousedown', function (e) {
			onDone(e);$('.vessel_props2', canvas).show();$('.vessel_props1', canvas).hide();
		});
		$('.date span', titlebar).on('mousedown', function (e) {
			e.stopPropagation();
		});
	
		//$( dialog ).on( "dialogdragstart", function( e, ui ) {console.log(e);console.log(ui)} );
	
		return dialog;
	};

/***/ }),
/* 22 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(24);
	var _cssClassName = "special";
	var BaseFloatView = __webpack_require__(25);
	var SpecialFloatView = function SpecialFloatView(images, mmsi) {
	    var _this = this;
	
	    BaseFloatView.apply(this, arguments);
	    this.images = images;
	    //console.log(this.images)
	    this.frame.innerHTML = '<div class="' + _cssClassName + '"></div><img class="img1"><img class="img2">';
	    if (FormData.prototype.set && mmsi == 273316240) this.frame.innerHTML += '<table class="logos"><tr><td><img src="plugins/AIS/AISSearch/png/anchors.png" style="position: unset;"></td></tr>' + '<tr><td><img src="plugins/AIS/AISSearch/png/rscc-logo.png" style="position: unset;"></td></tr></table>';else this.frame.innerHTML += '<table class="logos" style="background:none"><tr><td></td></tr></table>';
	    this.left = -10000;
	
	    this.contextMenu = document.createElement("div");
	    this.contextMenu.className = 'mf_group_menu';
	    var html = '<div class="command zoomin">' + _gtxt('AISSearch2.zoomin_com') + '</div>' + '<div class="command zoomout" style="display:none">' + _gtxt('AISSearch2.zoomout_com') + '</div>';
	    if (images.length == 2) {
	        html += '<div class="command image1">' + _gtxt('AISSearch2.image1_com') + '</div>' + '<div class="command image2">' + _gtxt('AISSearch2.image2_com') + '</div>' + '<div class="command twoimages">' + _gtxt('AISSearch2.twoimages_com') + '</div>';
	    }
	    html += '<div class="command close">' + _gtxt('AISSearch2.close_com') + '</div>';
	    this.contextMenu.innerHTML = html;
	
	    this.contextMenu.addEventListener('mousedown', function (e) {
	        if (e.stopPropagation) e.stopPropagation();
	        //if(e.preventDefault) e.preventDefault();
	        e.cancelBubble = true;
	        e.returnValue = false;
	    }.bind(this));
	    this.contextMenu.addEventListener('mouseleave', function (e) {
	        _this.contextMenu.style.display = "none";
	        _this.contextMenu.remove();
	    }.bind(this));
	
	    var closeCom = this.contextMenu.querySelector('.close'),
	        zinCom = this.contextMenu.querySelector('.zoomin'),
	        zoutCom = this.contextMenu.querySelector('.zoomout'),
	        img1Com = this.contextMenu.querySelector('.image1'),
	        img2Com = this.contextMenu.querySelector('.image2'),
	        twoimgCom = this.contextMenu.querySelector('.twoimages'),
	        l = void 0,
	        t = void 0,
	        w = void 0,
	        h = void 0,
	        rc1 = void 0,
	        rc2 = void 0,
	        content = this.frame.querySelector('.' + _cssClassName),
	        image1 = this.frame.querySelector('img.img1'),
	        image2 = this.frame.querySelector('img.img2'),
	        logos = this.frame.querySelector('.logos'),
	        showTwo = false,
	        restoreSize = function restoreSize() {
	        var h1 = Math.floor(image1.getBoundingClientRect().height),
	            h2 = Math.floor(image2.getBoundingClientRect().height);
	        if (h1) content.style.height = h1 + "px";else if (h2) content.style.height = h2 + "px";
	        showTwo = false;
	    },
	        zoomIn = function zoomIn(image, w, h, wiw, wih) {
	        var setPlace1 = function setPlace1() {
	            image.style.width = wiw + "px";
	            image.style.height = "";
	
	            image.style.left = 0;
	            image.style.top = Math.round((wih - image.getBoundingClientRect().height) / 2) + "px";
	        },
	            setPlace2 = function setPlace2() {
	            image.style.width = "";
	            image.style.height = wih + "px";
	
	            image.style.left = Math.round((wiw - image.getBoundingClientRect().width) / 2) + "px";
	            image.style.top = 0;
	        };
	        if (wiw / wih > 1) {
	            if (parseInt(w) / parseInt(h) > wiw / wih) setPlace1();else setPlace2();
	        } else if (parseInt(w) / parseInt(h) > wiw / wih) setPlace1();else setPlace2();
	    },
	        zoomIn2 = function zoomIn2(image1, image2, w, h, wiw, wih) {
	        var setPlace1 = function setPlace1() {
	            image1.style.width = wiw + "px";
	            image2.style.width = wiw + "px";
	            image1.style.height = "";
	            image2.style.height = "";
	
	            image1.style.left = 0;
	            image2.style.left = 0;
	            image1.style.top = Math.round(wih / 2 - image1.getBoundingClientRect().height) + "px";
	            image2.style.top = image1.getBoundingClientRect().bottom + "px";
	        },
	            setPlace2 = function setPlace2() {
	            image1.style.width = "";
	            image2.style.width = "";
	            image1.style.height = Math.ceil(wih / 2) + "px";
	            image2.style.height = Math.floor(wih / 2) + "px";
	
	            image1.style.top = 0;
	            image2.style.top = image1.getBoundingClientRect().bottom + "px";
	            image1.style.left = Math.round((wiw - image1.getBoundingClientRect().width) / 2) + "px";
	            image2.style.left = image1.style.left;
	        };
	        if (wiw / wih > 1) {
	            if (parseInt(w) / parseInt(h) > wiw / wih) setPlace1();else setPlace2();
	        } else if (parseInt(w) / parseInt(h) > wiw / wih) setPlace1();else setPlace2();
	    };
	    closeCom.addEventListener("click", function (e) {
	        !_this.allowMove && zoutCom.click();
	        _this.contextMenu.remove();
	        _this.left = -10000;
	
	        image1.style.display = "block";
	        image2.style.display = "none";
	        restoreSize();
	
	        _this.hide();
	        image1.src = "";
	        image2.src = "";
	
	        _this.closeCallback();
	    }.bind(this));
	    zinCom.addEventListener("click", function (e) {
	        _this.contextMenu.remove();
	        e.srcElement.style.display = 'none';
	        zoutCom.style.display = 'block';
	        img1Com && (img1Com.style.display = 'none');
	        img2Com && (img2Com.style.display = 'none');
	        twoimgCom && (twoimgCom.style.display = 'none');
	        var st = getComputedStyle(content);
	        w = st.width;h = st.height;
	        l = _this.left;t = _this.top;
	        _this.left = 0;
	        _this.top = 0;
	
	        content.style.width = window.innerWidth + "px";
	        content.style.height = window.innerHeight + "px";
	
	        rc1 = image1.getBoundingClientRect();
	        rc2 = image2.getBoundingClientRect();
	        var wiw = window.innerWidth,
	            wih = window.innerHeight;
	        // console.log((parseInt(w)+"/ "+parseInt(h)));
	        // console.log("w/h "+(parseInt(w)/parseInt(h)));
	        // console.log("wiw/wih "+(wiw/wih));
	
	        if (rc1.width && rc1.height && !rc2.width && !rc2.height) {
	            zoomIn(image1, w, h, wiw, wih);
	            logos.style.left = image1.style.left;
	            logos.style.top = image1.style.top;
	        }
	        if (rc2.width && rc2.height && !rc1.width && !rc1.height) {
	            zoomIn(image2, w, h, wiw, wih);
	            logos.style.left = image2.style.left;
	            logos.style.top = image2.style.top;
	        }
	        if (rc2.width && rc2.height && rc1.width && rc1.height) {
	            zoomIn2(image1, image2, w, h, wiw, wih);
	            logos.style.left = image1.style.left;
	            logos.style.top = image1.style.top;
	        }
	
	        content.classList.add('zoomed_in');
	        image1.classList.add('zoomed_in');
	        image2.classList.add('zoomed_in');
	        logos.classList.add('zoomed_in');
	        _this.allowMove = false;
	    }.bind(this));
	    zoutCom.addEventListener("click", function (e) {
	        _this.contextMenu.remove();
	        e.srcElement.style.display = 'none';
	        zinCom.style.display = 'block';
	        img1Com && (img1Com.style.display = 'block');
	        img2Com && (img2Com.style.display = 'block');
	        twoimgCom && (twoimgCom.style.display = 'block');
	        _this.left = l;
	        _this.top = t;
	        content.style.width = w;
	        content.style.height = h;
	
	        if (rc1.width && rc1.height) {
	            image1.style.left = Math.floor(rc1.left) + "px";
	            image1.style.top = Math.floor(rc1.top) + "px";
	            image1.style.height = Math.floor(rc1.height) + "px";
	            image1.style.width = Math.floor(rc1.width) + "px";
	        }
	        if (rc2.width && rc2.height) {
	            image2.style.left = Math.floor(rc2.left) + "px";
	            image2.style.top = Math.floor(rc2.top) + "px";
	            image2.style.height = Math.floor(rc2.height) + "px";
	            image2.style.width = Math.floor(rc2.width) + "px";
	        }
	        logos.style.left = 0;
	        logos.style.top = 0;
	
	        content.classList.remove('zoomed_in');
	        image1.classList.remove('zoomed_in');
	        image2.classList.remove('zoomed_in');
	        logos.classList.remove('zoomed_in');
	        _this.allowMove = true;
	    }.bind(this));
	    img1Com && img1Com.addEventListener("click", function (e) {
	        _this.contextMenu.remove();
	        restoreSize();
	        image1.style.top = 0;
	        image1.style.display = "block";
	        image2.style.display = "none";
	    }.bind(this));
	    img2Com && img2Com.addEventListener("click", function (e) {
	        _this.contextMenu.remove();
	        restoreSize();
	        image2.style.top = 0;
	        image2.style.display = "block";
	        image1.style.display = "none";
	    }.bind(this));
	    twoimgCom && twoimgCom.addEventListener("click", function (e) {
	        showTwo = true;
	
	        _this.contextMenu.remove();
	        image1.style.display = "block";
	        image2.style.display = "block";
	        var h1 = Math.floor(image1.getBoundingClientRect().height),
	            h2 = Math.floor(image2.getBoundingClientRect().height);
	        image2.style.top = Math.floor(h1) + "px";
	        if (h1 || h2) content.style.height = h1 + h2 + "px";
	    }.bind(this));
	    image1.addEventListener("click", function (e) {
	        if (!_this.allowMove) zoutCom.click();
	    }.bind(this));
	    image2.addEventListener("click", function (e) {
	        if (!_this.allowMove) zoutCom.click();
	    }.bind(this));
	    content.addEventListener("click", function (e) {
	        if (!_this.allowMove) zoutCom.click();
	    }.bind(this));
	
	    this.frame.addEventListener("contextmenu", function (e) {
	        e.preventDefault();
	        _this.frame.append(_this.contextMenu);
	        _this.contextMenu.style.display = "block";
	
	        if (e.clientX - 10 + _this.contextMenu.offsetWidth < window.innerWidth) {
	            _this.contextMenu.style.left = e.clientX - _this.left - 10 + "px";
	            _this.contextMenu.style.right = "";
	        } else {
	            _this.contextMenu.style.right = _this.right - e.clientX - 10 + "px";
	            _this.contextMenu.style.left = "";
	        }
	        if (e.clientY - 10 + _this.contextMenu.offsetHeight < window.innerHeight) {
	            _this.contextMenu.style.top = e.clientY - _this.top - 10 + "px";
	            _this.contextMenu.style.bottom = "";
	        } else {
	            _this.contextMenu.style.bottom = _this.bottom - e.clientY - 10 + "px";
	            _this.contextMenu.style.top = "";
	        }
	    }.bind(this));
	};
	
	SpecialFloatView.prototype = Object.create(BaseFloatView.prototype);
	
	SpecialFloatView.prototype.close = function () {
	    this.contextMenu.querySelector('.close').click();
	};
	
	SpecialFloatView.prototype.show = function (images, closeCallback) {
	    BaseFloatView.prototype.show.apply(this, arguments);
	    this.closeCallback = closeCallback;
	    if (this.left > -9999 && images.length > 1) return;
	    this.images = images;
	    //console.log(this.images)  
	
	    var content = this.frame.querySelector('.' + _cssClassName),
	        image1 = this.frame.querySelector('img.img1'),
	        image2 = this.frame.querySelector('img.img2'),
	        rc = this.frame.getBoundingClientRect(),
	        imageUrl = this.images[0].url + (this.images[0].url.search(/\?/) != 1 ? "&r=" : "?r="),
	        timers = [];
	
	    var downloadingImage1 = new Image();
	    downloadingImage1.onload = function () {
	        image1.src = this.src;
	        image1.style.left = 0;image1.style.top = 0;
	        image1.style.width = rc.width + "px";
	        //image1.style.height = getComputedStyle(image1).height;
	        //console.log(downloadingImage1.width)  
	        //console.log(getComputedStyle(image1).height)  
	        //console.log(this.width)  
	        //console.log(image1.getBoundingClientRect())  
	        if (image1.getBoundingClientRect().height) content.style.height = Math.floor(image1.getBoundingClientRect().height) + "px";
	    };
	    downloadingImage1.onerror = function (e) {
	        image1.src = "";
	        image1.style.height = "";
	    };
	    downloadingImage1.src = imageUrl + Math.random();
	
	    if (this.images[1]) {
	        var downloadingImage2 = new Image(),
	            _imageUrl = this.images[1].url + (this.images[1].url.search(/\?/) != 1 ? "&r=" : "?r=");
	        downloadingImage2.onload = function () {
	            image2.src = this.src;
	            image2.style.left = 0;image2.style.top = 0;
	            image2.style.width = rc.width + "px";
	            //image2.style.height = getComputedStyle(image2).height;
	            image2.style.display = "none";
	            //console.log(image1.getBoundingClientRect())
	        };
	        downloadingImage2.onerror = function (e) {
	            image2.src = "";
	            image2.style.height = "";
	        };
	        downloadingImage2.src = _imageUrl + Math.random();
	    }
	
	    if (this.left > -9999) return;
	
	    this.left = document.defaultView.getWindowWidth() - this.width;
	    this.top = 0;
	
	    //console.log("SET TIMERS")
	
	    // UPDATE 1
	    var intrerval = 1000 * 60 * 1,
	        thisInst = this,
	        timer = setTimeout(function update() {
	        //console.log("TIME1 " + timer)
	        var downloadingImage1 = new Image();
	        downloadingImage1.onload = function () {
	            image1.src = downloadingImage1.src;
	        };
	        downloadingImage1.src = thisInst.images[0].url + (thisInst.images[0].url.search(/\?/) != 1 ? "&r=" : "?r=") + Math.random();
	        //console.log(downloadingImage1.src)
	        timers[0] = setTimeout(update, intrerval);
	    }, intrerval);
	    timers.push(timer);
	
	    // UPDATE 2    
	    if (this.images[1]) {
	        timer = setTimeout(function update() {
	            //console.log("TIME2 " + timer)
	            var downloadingImage2 = new Image();
	            downloadingImage2.onload = function () {
	                image2.src = downloadingImage2.src;
	            };
	            downloadingImage2.src = thisInst.images[1].url + (thisInst.images[1].url.search(/\?/) != 1 ? "&r=" : "?r=") + Math.random();
	            //console.log(downloadingImage2.src)
	            timers[1] = setTimeout(update, intrerval);
	        }, intrerval);
	        timers.push(timer);
	    }
	
	    var closeCom = this.contextMenu.querySelector('.close');
	    this.disposeTimer && closeCom.removeEventListener("click", this.disposeTimer);
	    this.disposeTimer = function () {
	        //console.log("STOP TIME")
	        timers.forEach(function (t) {
	            return clearTimeout(t);
	        });
	        timers.length = 0;
	    };
	    closeCom.addEventListener("click", this.disposeTimer);
	};
	
	module.exports = SpecialFloatView;

/***/ }),
/* 24 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 25 */
/***/ (function(module, exports) {

	'use strict';
	
	var _getMaxZindex = function _getMaxZindex() {
	    var dialogs = document.querySelectorAll('.ui-dialog'),
	        z = void 0,
	        zMax = Array.prototype.map.call(document.querySelectorAll('.ui-front'), function (e) {
	        return e;
	    }).reduce(function (p, c) {
	        z = parseFloat(getComputedStyle(c).zIndex);
	        return isNaN(z) || z <= p ? p : z;
	    }, 0);
	    zMax = Array.prototype.map.call(document.querySelectorAll('.float_view'), function (e) {
	        return e;
	    }).reduce(function (p, c) {
	        z = parseFloat(getComputedStyle(c).zIndex);
	        return isNaN(z) || z <= p ? p : z;
	    }, zMax);
	    return zMax;
	};
	var BaseFloatView = function BaseFloatView() {
	    var _this = this;
	
	    var frame = document.createElement("div");
	    frame.className = "float_view";
	    frame.style.position = "absolute";
	    frame.style.display = "none";
	    var x = void 0,
	        y = void 0;
	    frame.addEventListener('mousedown', function (e) {
	        if (!_this.allowMove) return;
	
	        x = e.clientX;y = e.clientY;
	        frame.style.zIndex = _getMaxZindex();
	        document.body.append(frame);
	
	        if (e.stopPropagation) e.stopPropagation();
	        if (e.preventDefault) e.preventDefault();
	        e.cancelBubble = true;
	        e.returnValue = false;
	    });
	    frame.addEventListener('mouseup', function (e) {
	        x = false;y = false;
	    });
	    document.body.addEventListener('mousemove', function (e) {
	        if (!x && !y) return;
	        var dx = e.clientX - x,
	            dy = e.clientY - y,
	            rect = frame.getBoundingClientRect(),
	            fx = rect.left,
	            fy = rect.top;
	        frame.style.left = fx + dx + "px";
	        frame.style.top = fy + dy + "px";
	        x = e.clientX;y = e.clientY;
	
	        if (e.stopPropagation) e.stopPropagation();
	        if (e.preventDefault) e.preventDefault();
	        e.cancelBubble = true;
	        e.returnValue = false;
	    });
	    this.frame = frame;
	    this.allowMove = true;
	};
	
	BaseFloatView.prototype = function () {
	    return {
	        get left() {
	            return this.frame.getBoundingClientRect().left;
	        },
	        set left(v) {
	            this.frame.style.left = v + "px";
	        },
	        get top() {
	            return this.frame.getBoundingClientRect().top;
	        },
	        set top(v) {
	            this.frame.style.top = v + "px";
	        },
	        get right() {
	            return this.frame.getBoundingClientRect().right;
	        },
	        get bottom() {
	            return this.frame.getBoundingClientRect().bottom;
	        },
	        get width() {
	            return this.frame.getBoundingClientRect().width;
	        },
	        set width(v) {
	            this.frame.style.width = v + "px";
	        },
	        get height() {
	            return this.frame.getBoundingClientRect().height;
	        },
	        set height(v) {
	            this.frame.style.height = v + "px";
	        },
	        show: function show() {
	            this.frame.style.zIndex = _getMaxZindex();
	            document.body.append(this.frame);
	            this.frame.style.display = "block";
	        },
	        hide: function hide() {
	            this.frame.remove();
	        }
	    };
	}();
	
	module.exports = BaseFloatView;

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(27);
	
	module.exports = function (_ref) {
	    var modulePath = _ref.modulePath,
	        aisServices = _ref.aisServices;
	
	    var _ais,
	        _galery,
	        _register,
	        _regcap,
	        _leftPanel,
	        _minh,
	        _lloyds,
	        resize,
	        menuAction,
	        scheme = document.location.href.replace(/^(https?:).+/, "$1"),
	        show = function show(vessel) {
	        //console.log(vessel) 
	        $("body").append('' + '<table class="vessel-info-page overlay">' + '<tr>' + '<td>' + '<table class="vessel-info-page container">' + '<tr>' + '<td class="column1">' + '<table>' + '<tr>' + '<td>' + '<div>' + '<div class="title">' + '<div class="cell">' + vessel.vessel_name + '<div class="timestamp">' + vessel.ts_pos_utc + '</div></div>  ' + '</div>' + '<div class="menu">' + '<div class="ais cell menu-item active"><img src="' + modulePath + 'svg/info_gen.svg" class="icon">' + _gtxt("AISSearch2.infoscreen_gen") + '</div>' + '<div class="register cell menu-item"><img src="' + modulePath + 'svg/info.svg" class="icon">' + _gtxt("AISSearch2.infoscreen_reg") + '</div>' + '<div class="galery cell menu-item"><img src="' + modulePath + 'svg/photogallery.svg" class="icon">' + _gtxt("AISSearch2.infoscreen_gal") + '<div class="counter">0</div></div>' + '</div>' + '</div>  ' + '</td>' + '</tr>' + '<tr>' + '<td class="frame">' + '<div class="photo">' + '<img src="' + modulePath + 'svg/no-image.svg" class="no-image">' + '</div>  ' + '</td>' + '</tr>' + '</table>' + '</td>' + '<td class="column2">' + '<div class="close-button-holder">' + '<div class="close-button" title="' + _gtxt("AISSearch2.close_but") + '"></div>' + '</div>' + '<div class="register panel">' + '<div class="caption">' + '<span style="display: inline-block;height: 100%;vertical-align: middle;width: 40px;"></span>' + '<img src="img/progress.gif" style="vertical-align: middle">' + '</div>' + '<div class="menu">' + '<div>' + '<table>' + '<tr>' + '<td><div class="general menu-item active">' + _gtxt("AISSearch2.reg_general_tab") + '</div></td>' + '<td><div class="build menu-item">' + _gtxt("AISSearch2.reg_build_tab") + '</div></td>' + '<td><div class="dimensions menu-item">' + _gtxt("AISSearch2.reg_chars_tab") + '</div></td>' + '<td><div class="gears menu-item">' + _gtxt("AISSearch2.reg_devs_tab") + '</div></td>' + '</tr>' + '</table>' + '</div>' + '</div>' + '<div class="content">' + '<div class="placeholder"></div>' + '</div>' + '</div>' + '<div class="galery panel">' + '<form action="' + aisServices + 'Upload.ashx" class="uploadFile" method="post" enctype="multipart/form-data" target="upload_target" style="display:none" >' + '<input name="Filedata" class="chooseFile" type="file">' + '<input name="imo" type="hidden" value="' + vessel.imo + '">' + '<input name="mmsi" type="hidden" value="' + vessel.mmsi + '">' +
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
	
	        $('<img src="' + scheme + window.serverBase.replace(/^https?:/, "") + 'plugins/ais/getphoto.ashx?mmsi=' + vessel.mmsi + '">').load(function () {
	            if (this) $('.column1 .photo img.no-image').replaceWith(this);
	        }).error(function () {
	            $('<img src="' + scheme + '//photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi=' + vessel.mmsi + '">').load(function () {
	                if (this) $('.column1 .photo img.no-image').replaceWith(this);
	            });
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
	        aiscontent.innerHTML = "" + "<div class='caption'><div>" + _gtxt("AISSearch2.vessel_info") + "</div></div>" + "<table>" + "<tr><td>" + _gtxt("AISSearch2.vessel_name") + "</td><td><b>" + ledokol.vessel_name + (ledokol.registry_name ? " (" + ledokol.registry_name + ")" : "") + "</b></td></tr>" + "<tr><td>IMO</td><td>" + ledokol.imo + "</td></tr>" + "<tr><td>MMSI</td><td>" + ledokol.mmsi + "</td></tr>" + "<tr><td>" + _gtxt("AISSearch2.vessel_type") + "</td><td>" + ledokol.vessel_type + "</td></tr>" + "<tr><td>" + _gtxt("AISSearch2.flag") + "</td><td>" + ledokol.flag_country + "</td></tr>" + "<tr><td>" + _gtxt("AISSearch2.callsign") + "</td><td>" + ledokol.callsign + "</td></tr>" + "<tr><td>" + _gtxt("AISSearch2.length") + "</td><td>" + ledokol.length + "</td></tr>" + "<tr><td>" + _gtxt("AISSearch2.width") + "</td><td>" + ledokol.width + "</td></tr>" + "</table>" + "<div class='caption'><div>" + _gtxt("AISSearch2.vessel_voyage") + "</div></div>" + "<table>" + "<tr><td>" + _gtxt("AISSearch2.nav_status") + "</td><td>" + ledokol.nav_status + "</td></tr>" + "<tr><td>COG</td><td>" + ledokol.cog + "</td></tr>" + "<tr><td>SOG</td><td>" + ledokol.sog + "</td></tr>" + "<tr><td>HDG</td><td>" + ledokol.heading + "</td></tr>" + "<tr><td>ROT</td><td>" + ledokol.rot + "</td></tr>" + "<tr><td>" + _gtxt("AISSearch2.draught") + "</td><td>" + ledokol.draught + "</td></tr>" + "<tr><td>" + _gtxt("AISSearch2.destination") + "</td><td>" + ledokol.destination + "</td></tr>" + "<tr><td>" + _gtxt("AISSearch2.eta") + "</td><td>" + ledokol.ts_eta + "</td></tr>" + "</table>";
	        resize();
	    },
	        drawRegister = function drawRegister(ledokol) {
	        var regcontent = _register.querySelector(".placeholder"),
	            drawTable = function drawTable(groups, article, display) {
	            var s = "<div class='panel " + article + " article' style='display:" + display + "'>";
	            for (var _i = 0; _i < groups.length; ++_i) {
	                if (!groups[_i]) continue;
	                s += "<div class='group'>" + groups[_i].name + "</div><table>";
	                for (var j = 0; j < groups[_i].properties.length; ++j) {
	                    var pn = groups[_i].properties[j].name,
	                        desc = nsGmx.Translations.getLanguage() == "rus" ? groups[_i].properties[j].description : null,
	                        pv = groups[_i].properties[j].value;
	                    s += "<tr><td>" + pn + (desc ? "<div class='description'>" + desc + "</div>" : "") + "</td><td>" + (pn == "Название судна" || pn == "Латинское название" ? "<b>" + pv + "</b>" : pv) + "</td></tr>";
	                }
	                s += "<tr><td>&nbsp;</td><td>&nbsp;</td></tr></table>";
	            }
	            s += "</div>";
	            return s;
	        };
	
	        _regcap.innerHTML = "<table class='register-title'>" + "<tr><td><span class='switch active'>" + _gtxt("AISSearch2.rmrs") + "</span> <span class='switch'>Lloyd's register</span></td></tr>" + "<tr><td><span class='update'></span></td></tr>" + "</table>";
	
	        var drawRMR = function drawRMR() {
	            if (ledokol) {
	                regcontent.innerHTML = drawTable([ledokol.data[0], ledokol.data[1], ledokol.data[9]], "general", "block") + drawTable([ledokol.data[2]], "build", "none") + drawTable([ledokol.data[3]], "dimensions", "none") + drawTable([ledokol.data[4], ledokol.data[5], ledokol.data[6], ledokol.data[7], ledokol.data[8]], "gears", "none");
	                _regcap.querySelector('.update').innerText = _gtxt("AISSearch2.last_update") + " " + ledokol.version.replace(/ \S+$/g, '');
	            } else {
	                regcontent.innerHTML = "";
	                _regcap.querySelector('.update').innerHTML = "&nbsp;";
	            }
	        },
	            drawLloyds = function drawLloyds() {
	            regcontent.innerHTML = drawTable([_lloyds.data[15], _lloyds.data[14], _lloyds.data[13], _lloyds.data[11], _lloyds.data[0]], "general", "block") + drawTable([_lloyds.data[10], _lloyds.data[12]], "build", "none") + drawTable([_lloyds.data[9], _lloyds.data[8], _lloyds.data[7], _lloyds.data[6]], "dimensions", "none") + drawTable([_lloyds.data[4], _lloyds.data[3], _lloyds.data[2], _lloyds.data[1], _lloyds.data[5]], "gears", "none");
	            _regcap.querySelector('.update').innerText = _gtxt("AISSearch2.last_update") + " " + _lloyds.version.replace(/ \S+$/g, '');
	        },
	            regSwitches = _regcap.querySelectorAll(".switch");
	        regSwitches.forEach(function (item, i) {
	            return item.addEventListener('click', function (e) {
	                var cl = e.currentTarget.classList;
	                if (!cl.contains('active')) {
	                    _regcap.querySelector(".switch.active").classList.remove('active');
	                    cl.add('active');
	                    switch (i) {
	                        case 0:
	                            drawRMR();
	                            break;
	                        case 1:
	                            if (_lloyds) drawLloyds();else regcontent.innerHTML = "";
	                            break;
	                    }
	                    resize();
	                    mia[0] && mia[0].click();
	                }
	            });
	        });
	        var mia = document.querySelectorAll('.column2 .menu-item');
	        for (var i = 0; i < mia.length; ++i) {
	            mia[i].addEventListener('click', menuAction);
	        }
	        drawRMR();
	        resize();
	        if (!ledokol) regSwitches[1].click();
	    };
	
	    var open = function open(vessel, vessel2) {
	        show(vessel2);
	        var onFail = function onFail(error) {
	            if (error != 'register_no_data') console.log(error);
	            _regcap.innerHTML = "";
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
	        var registerServerUrl = scheme + "//kosmosnimki.ru/demo/register/api/v1/",
	            lloydsServerUrl = scheme + "//kosmosnimki.ru/demo/lloyds/api/v1/",
	            rmr;
	        if (vessel.imo && vessel.imo != 0 && vessel.imo != -1) {
	            fetch(registerServerUrl + "Ship/Search/" + vessel.imo + (nsGmx.Translations.getLanguage() == "rus" ? "/ru" : "/en")).then(function (response) {
	                return response.json();
	            }).then(function (ship) {
	                if (ship.length > 0) return fetch(registerServerUrl + "Ship/Get/" + ship[0].RS + (nsGmx.Translations.getLanguage() == "rus" ? "/ru" : "/en"));else return Promise.resolve({ json: function json() {
	                        return null;
	                    } });
	                //else
	                //    return Promise.reject('register_no_data');
	            }).then(function (response) {
	                return response.json();
	            }).then(function (ship) {
	                //console.log(ship)
	                rmr = ship;
	                if (rmr) drawRegister(rmr);
	                return fetch(lloydsServerUrl + "Ship/Search/" + vessel.imo + (nsGmx.Translations.getLanguage() == "rus" ? "/ru" : "/en"));
	            }).then(function (response) {
	                return response.json();
	            }).then(function (ship) {
	                if (ship.length > 0) return fetch(lloydsServerUrl + "Ship/Get/" + ship[0].RS + (nsGmx.Translations.getLanguage() == "rus" ? "/ru" : "/en"));else return Promise.reject('register_no_data');
	            }).then(function (response) {
	                return response.json();
	            }).then(function (ship) {
	                _lloyds = ship;
	                if (nsGmx.Translations.getLanguage() != "rus") {
	                    _lloyds.data[15].name = "Vessel Data";
	                    _lloyds.data[14].name = "Type and Status";
	                    _lloyds.data[13].name = "Companies";
	                    _lloyds.data[12].name = "Companies";
	                    _lloyds.data[11].name = "Safety";
	                    _lloyds.data[10].name = "History";
	                    _lloyds.data[9].name = "Characteristics";
	                    _lloyds.data[8].name = "Dimensions";
	                    _lloyds.data[7].name = "Hull";
	                    _lloyds.data[6].name = "Capacity";
	                    _lloyds.data[5].name = "Cargo";
	                    _lloyds.data[4].name = "Machinery";
	                    _lloyds.data[3].name = "Fuel";
	                    _lloyds.data[2].name = "Energy Supply";
	                    _lloyds.data[1].name = "Propellers and Thrusters";
	                    _lloyds.data[0].name = "Codes";
	                }
	                if (!rmr) drawRegister(rmr);
	            }).catch(onFail);
	        } else _regcap.innerHTML = "";
	
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
/* 27 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 28 */
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
	        get screenSearchLayer() {
	            return _screenSearchLayer;
	        },
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
	            var protocol = document.location.protocol;
	            // speed icon
	            if (vessel.sog >= 8) {
	                vessel.iconAlt = protocol + "//geomixer.scanex.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS\\SCF\\sog8-L-100-move.svg";
	            } else if (4 < vessel.sog && vessel.sog < 8) {
	                vessel.iconAlt = protocol + "//geomixer.scanex.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS\\SCF\\sog4_8-L-100-move.svg";
	            } else if (0 < vessel.sog && vessel.sog <= 4) {
	                vessel.iconAlt = protocol + "//geomixer.scanex.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS\\SCF\\sog4-L-100-move.svg";
	            } else {
	                vessel.iconAlt = protocol + "//geomixer.scanex.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS\\SCF\\sog-L-100-stand_red.svg";
	            }
	
	            // type icon
	            switch (vessel.vessel_type.toLowerCase()) {
	                case "cargo":
	                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Ccargo-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "tanker":
	                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Ctanker-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "fishing":
	                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cfishing-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "passenger":
	                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cpassenger-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "hsc":
	                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Chighspeed-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "pleasure craft":
	                case "sailing":
	                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cpleasure-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                case "unknown":
	                case "reserved":
	                case "other":
	                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cother-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	                default:
	                    vessel.icon = protocol + "//maps.kosmosnimki.ru/GetImage.ashx?usr=haibrahmanov%40scanex.ru&img=AIS%5Cspecialcraft-L-100-" + (vessel.sog != 0 ? "move" : "stand") + ".svg";
	                    break;
	            }
	        },
	
	        searchPositionsAgg: function searchPositionsAgg(vessels, dateInterval, callback) {
	            //console.log(dateInterval);
	            var request = {
	                WrapStyle: 'window',
	                layer: _historyLayer, //'8EE2C7996800458AAF70BABB43321FA4',//
	                orderdirection: 'desc',
	                orderby: 'ts_pos_utc',
	                columns: '[{"Value":"mmsi"},{"Value":"flag_country"},{"Value":"callsign"},{"Value":"ts_pos_utc"},{"Value":"cog"},{"Value":"sog"},{"Value":"draught"},{"Value":"vessel_type"},' + '{"Value":"destination"},{"Value":"ts_eta"},{"Value":"nav_status"},{"Value":"heading"},{"Value":"rot"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]',
	
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
	                columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]',
	                query: "([id] IN (" + aid.join(',') + "))"
	            };
	            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
	        },
	
	        searchString2: function searchString2(query, isfuzzy, callback) {
	            var request = {
	                WrapStyle: 'window',
	                layer: _aisLastPoint,
	                columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"vessel_type"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]',
	                //orderdirection: 'desc',
	                //orderby: 'vessel_name',
	                query: query
	            };
	            if (isfuzzy) request.pagesize = 1000;
	            L.gmxUtil.sendCrossDomainPostRequest("http://maps.kosmosnimki.ru/plugins/ais/searchship.ashx", request, callback);
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
	                columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"vessel_type"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]',
	                //orderdirection: 'desc',
	                //orderby: 'vessel_name',
	                query: query
	            };
	            if (isfuzzy) request.pagesize = 1000;
	            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
	        },
	        searchNames: function searchNames(avessels, callback) {
	            var a = avessels.reduce(function (p, c) {
	                if (c.mmsi && c.mmsi != "" || c.imo && c.imo != "" && c.imo != -1) p.push(c);
	                return p;
	            }, []),
	                request = {
	                WrapStyle: 'window',
	                layer: _aisLastPoint,
	                orderdirection: 'desc',
	                orderby: 'ts_pos_utc',
	                query: a.map(function (v) {
	                    return "([mmsi]=" + v.mmsi + (v.imo && v.imo != "" ? " and [imo]=" + v.imo : "") + ")";
	                }).join(" or ")
	            };
	            L.gmxUtil.sendCrossDomainPostRequest(_serverScript, request, callback);
	        },
	        searchScreen: function searchScreen(options, callback) {
	            var lmap = nsGmx.leafletMap;
	            var latLngBounds = lmap.getBounds(),
	                sw = latLngBounds.getSouthWest(),
	                ne = latLngBounds.getNorthEast(),
	                min = { x: sw.lng, y: sw.lat },
	                max = { x: ne.lng, y: ne.lat };
	            var queryParams = { WrapStyle: 'window', minx: min.x, miny: min.y, maxx: max.x, maxy: max.y, layer: _screenSearchLayer },
	
	            //     layerTreeNode = $(_queryMapLayers.buildedTree).find("div[LayerID='"+_screenSearchLayer+"']")[0];
	            // if (layerTreeNode){   
	            //     var gmxProp = layerTreeNode.gmxProperties.content.properties;
	            //     if (gmxProp.Temporal) {
	            //         queryParams.s = options.dateInterval.get('dateBegin').toJSON(),
	            //         queryParams.e = options.dateInterval.get('dateEnd').toJSON();
	            //     }
	            // }
	            dateInterval = nsGmx.widgets.commonCalendar.getDateInterval();
	            queryParams.s = options.dateInterval.get('dateBegin').toJSON(), queryParams.e = options.dateInterval.get('dateEnd').toJSON();
	            //console.log(queryParams);
	            L.gmxUtil.sendCrossDomainPostRequest(_aisServices + "SearchScreen.ashx", queryParams, callback);
	        }
	    };
	};

/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var Polyfill = __webpack_require__(16);
	module.exports = function (options) {
	    var _layersByID = nsGmx.gmxMap.layersByID;
	    var _aisLayer = _layersByID[options.aisLayerID],
	        _tracksLayer = _layersByID[options.tracksLayerID],
	        _screenSearchLayer = _layersByID[options.screenSearchLayer],
	        _lastPointLayerAlt = _layersByID[options.lastPointLayerAlt],
	        _lastPointLayerAltFact = _layersByID[options.lastPointLayerAlt],
	        _tracksLayerAlt = _layersByID[options.tracksLayerAlt],
	        _historyLayerAlt = _layersByID[options.historyLayerAlt];
	
	    var _almmsi = void 0,
	        _tlmmsi = void 0,
	        _aldt = void 0,
	        _tldt = void 0;
	    try {
	        _almmsi = _aisLayer.getGmxProperties().attributes.indexOf("mmsi") + 1, _tlmmsi = Polyfill.findIndex(_tracksLayer.getGmxProperties().attributes, function (p) {
	            return "mmsi" == p.toLowerCase();
	        }) + 1, _aldt = _aisLayer.getGmxProperties().attributes.indexOf("ts_pos_utc") + 1, _tldt = Polyfill.findIndex(_tracksLayer.getGmxProperties().attributes, function (p) {
	            return "date" == p.toLowerCase();
	        }) + 1;
	        // console.log(_almmsi+" "+_aldt)
	        // console.log(_tlmmsi+" "+_tldt)
	    } catch (ex) {}
	
	    var _displayedTrack = { mmsi: null },
	        _displayedVessels = "all",
	        _notDisplayedVessels = [],
	        _filterFunc = function _filterFunc(args) {
	        var dates = _displayedTrack.dates ? _displayedTrack.dates.list : null,
	            mmsiArr = [];
	
	        if (_displayedTrack.mmsi && _notDisplayedVessels.indexOf(_displayedTrack.mmsi.toString()) < 0 && (_displayedVessels == "all" || _displayedVessels.indexOf(_displayedTrack.mmsi.toString()) >= 0)) mmsiArr.push(_displayedTrack.mmsi);
	
	        var mmsi = args.properties[args.properties.length > 20 ? _almmsi : _tlmmsi].toString(),
	            dt = new Date(new Date(args.properties[args.properties.length > 20 ? _aldt : _tldt] * 1000).setUTCHours(0, 0, 0, 0)),
	            i = void 0,
	            j = void 0;
	        for (i = 0; i < mmsiArr.length; i++) {
	            if (mmsi == mmsiArr[i]) {
	                if (dates) for (j = 0; j < dates.length; ++j) {
	                    if (dates[j].getTime() == dt.getTime()) {
	                        return true;
	                    }
	                } else {
	                    return true;
	                }
	            }
	        }
	        return false;
	    },
	        _setTrackFilter = function _setTrackFilter() {
	        //console.log(_displayedTrack)
	        var lmap = nsGmx.leafletMap;
	        if (_aisLayer && _aisLayer.removeFilter) {
	            _aisLayer.removeFilter();
	            if (_displayedTrack && _displayedTrack.mmsi) {
	                _aisLayer.setFilter(_filterFunc);
	                if (!_aisLayer._map) {
	                    lmap.addLayer(_aisLayer);
	                }
	            } else lmap.removeLayer(_aisLayer);
	        }
	        if (_tracksLayer && _tracksLayer.removeFilter) {
	            _tracksLayer.removeFilter();
	            if (_displayedTrack && _displayedTrack.mmsi) {
	                _tracksLayer.setFilter(_filterFunc);
	                if (!_tracksLayer._map) {
	                    lmap.addLayer(_tracksLayer);
	                }
	            } else lmap.removeLayer(_tracksLayer);
	        }
	    },
	        _specialVesselFilters = void 0,
	        _setVesselFilter = function _setVesselFilter() {
	        if (_screenSearchLayer) {
	            _screenSearchLayer.removeFilter();
	
	            if (_displayedVessels != "all" || _notDisplayedVessels.length || _specialVesselFilters) {
	                var ai = _screenSearchLayer._gmx.tileAttributeIndexes,
	                    fields = [];
	                for (var k in ai) {
	                    fields[ai[k]] = k;
	                }_screenSearchLayer.setFilter(function (args) {
	
	                    for (var f in _specialVesselFilters) {
	                        _specialVesselFilters[f](args, ai, _displayedVessels);
	                    }var mmsi = args.properties[ai.mmsi].toString();
	                    if ((_displayedVessels == "all" || _displayedVessels.indexOf(mmsi) >= 0) && _notDisplayedVessels.indexOf(mmsi) < 0) return true;else return false;
	                });
	            }
	        }
	    },
	        _markers = void 0,
	        _visibleMarkers = [],
	        _markerIcon = function _markerIcon(icon, cog, sog, vtype, group_style) {
	        var type_color = "#000";
	        if (icon.search(/^sog/) != -1) {
	            if (sog >= 8) {
	                type_color = "#09ab00";
	            } else if (4 < sog && sog < 8) {
	                type_color = "#d1a710";
	            } else if (0 < sog && sog <= 4) {
	                type_color = "#ff0f0f";
	            } else {
	                type_color = "#ff0f0f";
	            }
	        } else switch (vtype) {
	            case "Cargo":
	                type_color = "#33a643";break;
	            case "Fishing":
	                type_color = "#f44336";break;
	            case "Tanker":
	                type_color = "#246cbd";break;
	            case "Passenger":
	                type_color = "#c6b01d";break;
	            case "HSC":
	                type_color = "#ff6f00";break;
	            case 'Pleasure Craft':
	            case 'Sailing':
	                type_color = "#9c27b0";break;
	            case 'Dredging':
	            case 'Law Enforcement':
	            case 'Medical Transport':
	            case 'Military':
	            case 'Pilot':
	            case 'Port Tender':
	            case 'SAR':
	            case 'Ships Not Party to Armed Conflict':
	            case 'Spare':
	            case 'Towing':
	            case 'Tug':
	            case 'Vessel With Anti-Pollution Equipment':
	            case 'WIG':
	            case 'Diving':
	                type_color = "#9b4628";break;
	        }
	        if (sog) return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!cog ? 0 : cog) + 'deg)"><title>1</title><path style="fill:' + type_color + ';" d="M13.8,20.07a1,1,0,0,1-.69-0.28l-1.79-1.72a0.72,0.72,0,0,0-1,0L8.52,19.79a1,1,0,0,1-.69.28,1,1,0,0,1-1-1V8.65c0-1.52,1.55-7.59,4-7.59s4,6.07,4,7.59V19a1,1,0,0,1-1,1h0Z"/><path style="fill:' + group_style + ';" d="M10.82,1.57c1.93,0,3.5,5.57,3.5,7.09V19a0.52,0.52,0,0,1-.51.53,0.49,0.49,0,0,1-.34-0.14l-1.79-1.72a1.22,1.22,0,0,0-1.71,0L8.17,19.42a0.49,0.49,0,0,1-.34.14A0.52,0.52,0,0,1,7.32,19V8.65c0-1.51,1.57-7.09,3.5-7.09h0m0-1c-3,0-4.5,6.72-4.5,8.09V19a1.52,1.52,0,0,0,1.51,1.53,1.49,1.49,0,0,0,1-.42l1.79-1.72a0.22,0.22,0,0,1,.32,0l1.79,1.72a1.49,1.49,0,0,0,1,.42A1.52,1.52,0,0,0,15.32,19V8.65c0-1.37-1.51-8.09-4.5-8.09h0Z"/><ellipse style="fill:#fff;" cx="10.82" cy="10.54" rx="1.31" ry="1.35"/><path style="fill:#fff;" d="M10.73,3.34h0.12a0.35,0.35,0,0,1,.35.35v6.85a0,0,0,0,1,0,0H10.38a0,0,0,0,1,0,0V3.69A0.35,0.35,0,0,1,10.73,3.34Z"/></svg>';else return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!cog ? 0 : cog) + 'deg)"><title>1</title><rect style="fill:' + type_color + ';stroke:' + group_style + ';stroke-miterlimit:10;" x="5.9" y="5.6" width="9.19" height="9.19" rx="2" ry="2" transform="translate(-4.13 10.41) rotate(-45)"/><circle style="fill:#fff;" cx="10.5" cy="10.19" r="1.5"/></svg>';
	    },
	        _eraseMyFleetMarker = function _eraseMyFleetMarker(mmsi) {
	        if (!_markers) _markers = L.layerGroup().addTo(nsGmx.leafletMap);else {
	            var layers = _markers.getLayers(),
	                layer = void 0;
	            for (var i in layers) {
	                if (layers[i].id == mmsi) {
	                    layer = layers[i];
	                    break;
	                }
	            }layer && _markers.removeLayer(layer);
	        }
	    },
	        _drawMyFleetMarker = function _drawMyFleetMarker(args, markerTemplate, group, ai, isVisible) {
	        var data = args.properties;
	        var di = nsGmx.widgets.commonCalendar.getDateInterval();
	        // console.log(data[ai.mmsi]+" "+data[ai.vessel_name]+" "+data[ai.cog]+" "+data[ai.sog]+" y="+data[ai.latitude]+" x="+data[ai.longitude]+" "+new Date(data[ai.ts_pos_utc]*1000))
	        //console.log(markerTemplate)
	        var icon = args.parsedStyleKeys.iconUrl.replace(/.+(\/|%5C)(?=[^\/]+$)/, '');
	        //console.log(icon)
	
	        _eraseMyFleetMarker(data[ai.mmsi]);
	
	        if (!isVisible) return;
	
	        var label_line = function label_line(label, label_color, label_shadow) {
	            if (label != "") return '<div style="height:14px;">' + '<div class="label_shadow" style="height:14px;color' + label_shadow.color + ";text-shadow:" + label_shadow.text_shadow + '">' + label + '</div>' + '<div class="label_color" style="position:relative;top:-14px;color:' + label_color + '">' + label + '</div></div>';else return "";
	        };
	        if (di.get("dateBegin").getTime() <= data[ai.ts_pos_utc] * 1000 && data[ai.ts_pos_utc] * 1000 < di.get("dateEnd").getTime()) {
	            var temp = {};
	            temp.group_name = label_line(group.default ? "" : group.title, group.label_color, group.label_shadow);
	            temp.vessel_name = label_line(data[ai.vessel_name], group.label_color, group.label_shadow);
	            temp.sog = label_line(data[ai.sog] + _gtxt("AISSearch2.KnotShort"), group.label_color, group.label_shadow);
	            temp.cog = label_line(isNaN(data[ai.cog]) ? "" : data[ai.cog].toFixed(1) + "&deg;", group.label_color, group.label_shadow);
	            temp.marker = _markerIcon(icon, data[ai.cog], data[ai.sog], data[ai.vessel_type], group.marker_style);
	            var m = L.marker([data[ai.latitude], data[ai.longitude] > 0 ? data[ai.longitude] : 360 + data[ai.longitude]], {
	                id: data[ai.mmsi],
	                icon: L.divIcon({
	                    className: 'mf_label gr' + group.id,
	                    html: Handlebars.compile(markerTemplate)(temp)
	                }),
	                zIndexOffset: 1000
	            });
	            m.id = data[ai.mmsi];
	            _markers.addLayer(m);
	        }
	    },
	        _switchLayers = function _switchLayers(l1, l2) {
	        //l1 && console.log(l1.getGmxProperties().name +" "+ !!(l1._map))
	        if (l2._map) return;
	        var lmap = nsGmx.leafletMap;
	        if (l1 && l2) {
	            lmap.removeLayer(l1);
	            lmap.addLayer(l2);
	        }
	    },
	        _legendSwitchedHandlers = [],
	        _legendSwitched = function _legendSwitched(showAlternative) {
	        _legendSwitchedHandlers.forEach(function (h) {
	            return h(showAlternative);
	        });
	    };
	
	    return {
	        set specialVesselFilters(_ref) {
	            var key = _ref.key,
	                value = _ref.value;
	
	            if (!_specialVesselFilters) _specialVesselFilters = {};
	            _specialVesselFilters[key] = value;
	            //_setVesselFilter();
	        },
	        get displayedTrack() {
	            return _displayedTrack;
	        },
	        set displayedTrack(value) {
	            _displayedTrack = value;
	        },
	        get hasAlternativeLayers() {
	            return _lastPointLayerAlt;
	        },
	        get needAltLegend() {
	            return !!(_lastPointLayerAltFact && _lastPointLayerAltFact._map);
	        },
	        showTrack: function showTrack(mmsiArr, dates) {
	            _displayedTrack = { mmsi: mmsiArr && mmsiArr.length ? mmsiArr[0] : null };
	            if (dates) _displayedTrack.dates = { mmsi: mmsiArr[0], list: dates };
	            if (_aisLayer || _tracksLayer) _displayedTrack.mmsi = mmsiArr[0];else _displayedTrack.mmsi = null;
	            _setTrackFilter();
	        },
	        showAllTracks: function showAllTracks(doit) {
	            var lmap = nsGmx.leafletMap;
	            if (doit) {
	                if (_aisLayer && _aisLayer.removeFilter) {
	                    _aisLayer.removeFilter();
	                    lmap.addLayer(_aisLayer);
	                }
	                if (_tracksLayer && _tracksLayer.removeFilter) {
	                    _tracksLayer.removeFilter();
	                    lmap.addLayer(_tracksLayer);
	                }
	            } else {
	                _displayedTrack = null;
	                _setTrackFilter();
	            }
	        },
	        hideVesselsOnMap: function hideVesselsOnMap(vessels) {
	            if (vessels && vessels.length) _notDisplayedVessels = vessels.map(function (v) {
	                return v;
	            });else _notDisplayedVessels.length = 0;
	            //console.log(_notDisplayedVessels);
	            _setTrackFilter();
	            _setVesselFilter();
	        },
	        restoreDefault: function restoreDefault() {
	            nsGmx.leafletMap.addLayer(_screenSearchLayer);
	            _lastPointLayerAlt && nsGmx.leafletMap.removeLayer(_lastPointLayerAlt);
	            _historyLayerAlt && nsGmx.leafletMap.removeLayer(_historyLayerAlt);
	            _tracksLayerAlt && nsGmx.leafletMap.removeLayer(_tracksLayerAlt);
	        },
	        showVesselsOnMap: function showVesselsOnMap(vessels) {
	            _displayedVessels = vessels != "all" ? vessels.map(function (v) {
	                return v;
	            }) : "all";
	            //console.log(_displayedVessels);
	            _setTrackFilter();
	            _setVesselFilter();
	        },
	        redrawMarkers: function redrawMarkers() {
	            _setVesselFilter();
	        },
	        clearMyFleetMarkers: function clearMyFleetMarkers() {
	            //console.log("clearMyFleetMarkers")
	            _markers && _markers.clearLayers();
	        },
	        eraseMyFleetMarker: _eraseMyFleetMarker,
	        drawMyFleetMarker: _drawMyFleetMarker,
	        highlightMarker: function highlightMarker(i, group) {
	            $('.mf_label.gr' + group.id + ' svg').each(function (i, e) {
	                var paths = e.querySelectorAll('path');
	                if (paths[1]) paths[1].style.fill = group.marker_style;
	            });
	            $('.mf_label.gr' + group.id + ' svg rect').css({ "stroke": group.marker_style });
	
	            $('.mf_label.gr' + group.id + ' .label_color').css({ "color": group.label_color });
	            $('.mf_label.gr' + group.id + ' .label_shadow').css({ "color": group.label_shadow.color, "text-shadow": group.label_shadow.text_shadow });
	        },
	        switchLegend: function switchLegend(showAlternative) {
	            _switchLayers(_screenSearchLayer, _lastPointLayerAlt);
	            var temp = _screenSearchLayer;
	            _screenSearchLayer = _lastPointLayerAlt;
	            _lastPointLayerAlt = temp;
	            _switchLayers(_aisLayer, _historyLayerAlt);
	            temp = _aisLayer;
	            _aisLayer = _historyLayerAlt;
	            _historyLayerAlt = temp;
	            _switchLayers(_tracksLayer, _tracksLayerAlt);
	            temp = _tracksLayer;
	            _tracksLayer = _tracksLayerAlt;
	            _tracksLayerAlt = temp;
	            _setTrackFilter();
	            _setVesselFilter();
	            _legendSwitched(showAlternative);
	        },
	        onLegendSwitched: function onLegendSwitched(handler) {
	            _legendSwitchedHandlers.push(handler);
	        }
	    };
	};

/***/ })
/******/ ]);
//# sourceMappingURL=AISPluginBeta.js.map