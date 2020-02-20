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
	    SIDEBAR2 = false,
	    BETA = false;
	if (true) SIDEBAR2 = true;
	if (true) PRODUCTION = true;
	if (true) BETA = true;
	
	__webpack_require__(1);
	__webpack_require__(3);
	__webpack_require__(4);
	__webpack_require__(5);
	
	var AisPluginPanel = __webpack_require__(6),
	    ViewsFactory = __webpack_require__(7),
	    LegendControl = __webpack_require__(31),
	    Toolbox = __webpack_require__(33);
	
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
	    modulePath = gmxCore.getModulePath(pluginName).replace(/https*\:\/\/[^\/]+\/api\//, document.location.href.replace(/\/[^\/]+$/, '/'));
	
	var highlight = L.marker([0, 0], { icon: L.icon({
	        className: "ais_highlight-icon",
	        iconAnchor: [12, 12],
	        iconSize: [25, 25],
	        iconUrl: 'plugins/ais/aissearch/highlight.png' }), zIndexOffset: 1000 });
	
	var ready = false;
	var publicInterface = {
	    pluginName: pluginName,
	    afterViewer: function afterViewer(params, map) {
	        if (ready) return;
	        ready = true;
	        //console.log("ready");
	        var tools = new Toolbox(params),
	            legendControl = new LegendControl(tools, params.aisLastPoint, params.lastPointLayerAlt),
	            options = {
	            aisLayerID: params.aisLayerID, // || '8EE2C7996800458AAF70BABB43321FA4',	// searchById			
	            screenSearchLayer: params.searchLayer, // || '8EE2C7996800458AAF70BABB43321FA4', // screen search
	
	            aisLastPoint: params.aisLastPoint, // || '303F8834DEE2449DAF1DA9CD64B748FE', // db search
	            historyLayer: params.historyLayer,
	            tracksLayerID: params.tracksLayerID, // || '13E2051DFEE04EEF997DC5733BD69A15',
	
	            lastPointLayerAlt: params.lastPointLayerAlt,
	            historyLayerAlt: params.historyLayerAlt,
	            tracksLayerAlt: params.tracksLayerAlt,
	
	            modulePath: modulePath,
	            highlight: highlight,
	            menuId: menuId,
	            vesselLegend: legendControl,
	            tools: tools
	        };
	
	        for (var key in params) {
	            if (key.toLowerCase() == "myfleet") {
	                options.myFleetLayers = params[key].split(",").map(function (id) {
	                    return id.replace(/\s/, "");
	                });
	                break;
	            }
	        }var viewFactory = new ViewsFactory(options),
	            layersByID = nsGmx.gmxMap.layersByID,
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
	
	        var sidebar = SIDEBAR2 ? window.iconSidebarWidget : window.sidebarControl,
	            sidebarPane = sidebar.setPane(menuId, {
	            position: params.showOnTop ? -100 : 0,
	            createTab: window.createTabFunction({
	                icon: menuId,
	                active: "ais_sidebar-icon-active",
	                inactive: "ais_sidebar-icon",
	                hint: _gtxt('AISSearch2.caption')
	            })
	        }),
	            withLegendSwitch = params.lastPointLayerAlt && nsGmx.gmxMap.layersByID[params.lastPointLayerAlt],
	            aisPluginPanel = new AisPluginPanel(sidebarPane, viewFactory, withLegendSwitch);
	        aisPluginPanel.menuId = menuId;
	
	        if (withLegendSwitch) legendControl.createSwitch(aisPluginPanel); // LEGEND SWITCH IN FOOTER
	
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
	
	// warm up db connection
	//fetch('//geomixer.scanex.ru/Plugins/AIS/SearchScreenAsync.ashx?minx=03&miny=0&maxx=0&maxy=0&layer=EE5587AF1F70433AA878462272C0274C&s=3020-02-13T00:00:00.000Z&e=3020-02-14T00:00:00.000Z', {credentials: 'include'});
	
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
	    'AISSearch2.legend_switch': 'Раскраска судов',
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
	    'AISSearch2.allTracks': 'треки всех судов',
	    'AISSearch2.shipsTracks': 'треки судов',
	    'AISSearch2.markerShadow': 'Цвет обводки маркера',
	    'AISSearch2.labelColor': 'Цвет подписи маркера',
	    'AISSearch2.labelShadow': 'Цвет обводки подписи',
	    'AISSearch2.zoomin_com': 'Увеличить',
	    'AISSearch2.zoomout_com': 'Уменьшить',
	    'AISSearch2.image1_com': 'Изображение 1',
	    'AISSearch2.image2_com': 'Изображение 2',
	    'AISSearch2.twoimages_com': 'Два изображения',
	    'AISSearch2.close_com': 'Закрыть',
	    'AISSearch2.moving': 'В движении',
	    'AISSearch2.standing': 'Стоит\\дрейфует',
	    'AISSearch2.myFleetInclude': 'добавить в мой флот',
	    'AISSearch2.myFleetExclude': 'удалить из моего флота',
	    'AISSearch2.hideAisData': 'скрыть данные AIS'
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
	    'AISSearch2.allTracks': 'all ships tracks ',
	    'AISSearch2.shipsTracks': 'ships tracks ',
	    'AISSearch2.markerShadow': 'Marker highlight',
	    'AISSearch2.labelColor': 'Label color',
	    'AISSearch2.labelShadow': 'Label highlight',
	    'AISSearch2.zoomin_com': 'Zoom in',
	    'AISSearch2.zoomout_com': 'Zoom out',
	    'AISSearch2.image1_com': 'Image 1',
	    'AISSearch2.image2_com': 'Image 2',
	    'AISSearch2.twoimages_com': 'Two images',
	    'AISSearch2.close_com': 'Close',
	    'AISSearch2.moving': 'Moving',
	    'AISSearch2.standing': 'Standing',
	    'AISSearch2.myFleetInclude': 'include in my fleet',
	    'AISSearch2.myFleetExclude': 'exclude from my fleet',
	    'AISSearch2.hideAisData': 'hide ais data'
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
	
	var PRODUCTION = false,
	    SIDEBAR2 = false;
	if (true) SIDEBAR2 = true;
	if (true) PRODUCTION = true;
	
	module.exports = function (sidebarPane, viewFactory, withFooter) {
	    var _isReady = false,
	        _canvas = document.createElement('div'),
	        _activeView = void 0,
	        _views = viewFactory.create(),
	        _createFooter = function _createFooter() {
	        var footer = void 0;
	        if (withFooter) {
	            footer = document.createElement('div');
	            footer.className = "ais_panel_footer";
	            $(_canvas).append(footer);
	        }
	        return footer;
	    },
	        _createTabs = function _createTabs() {
	        var tabsTemplate = '<table class="ais_tabs" border=0><tr>' + '</td><td class="ais_tab myfleet_tab unselectable" unselectable="on">' + // ACTIVE
	        '<div>{{i "AISSearch2.MyFleetTab"}}</div>' + '<td class="ais_tab dbsearch_tab unselectable" unselectable="on">' + '<div>{{i "AISSearch2.DbSearchTab"}}</div>' + '</td><td class="ais_tab scrsearch_tab unselectable" unselectable="on">' + '<div>{{i "AISSearch2.ScreenSearchTab"}}</div>' + '</td></tr></table>';
	
	        $(sidebarPane).append(_canvas);
	        $(_canvas).append(Handlebars.compile(tabsTemplate));
	        $(_canvas).append(_views.map(function (v) {
	            return v.frame;
	        }));
	
	        var tabs = $('.ais_tab', _canvas);
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
	        return tabs;
	    },
	        _tabs = _createTabs(),
	        _footer = _createFooter(),
	        _returnInstance = {
	        get footer() {
	            return _footer;
	        },
	        set footer(element) {
	            if (_footer) _footer.append(element);
	        },
	        show: function show() {
	            if (!_isReady) {
	                _views.forEach(function (v, i) {
	                    v.tab = _tabs.eq(i);
	                    v.resize(true);
	                });
	                // Show the first tab
	                _tabs.eq(0).removeClass('active').click();
	                // All has been done at first time
	                _isReady = true;
	            } else {
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
	    DbSearchModel = __webpack_require__(21),
	    InfoDialogView = __webpack_require__(22),
	    Searcher = __webpack_require__(30);
	
	module.exports = function (options) {
	
	    var _tools = options.tools;
	
	    var calendar1 = $('<div id="aisViewCalendar1"></div>'),
	        calendar2 = $('<div id="aisViewCalendar2"></div>'),
	        daysLimit = 14;
	
	    // walkaround with focus at first input in ui-dialog
	    calendar1.append('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');
	    calendar2.append('<span class="ui-helper-hidden-accessible"><input type="text"/></span>');
	
	    var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
	        dateInterval = new nsGmx.DateInterval();
	
	    dateInterval.set('dateBegin', mapDateInterval.get('dateBegin')).set('dateEnd', mapDateInterval.get('dateEnd')).on('change', function (e) {
	        //console.log('CHANGE ' + dateInterval.get('dateBegin').toUTCString() + ' ' + dateInterval.get('dateEnd').toUTCString()) 
	        var d = new Date(e.attributes.dateEnd.getTime() - msd * daysLimit);
	        _viewCalendar1._dateInputs.datepicker('option', 'minDate', d);
	        _viewCalendar1.onChange({ dateBegin: dateInterval.get('dateBegin'), dateEnd: dateInterval.get('dateEnd') });
	        _viewCalendar2._dateInputs.datepicker('option', 'minDate', d);
	        _viewCalendar2.onChange({ dateBegin: dateInterval.get('dateBegin'), dateEnd: dateInterval.get('dateEnd') });
	
	        nsGmx.widgets.commonCalendar.setDateInterval(dateInterval.get("dateBegin"), dateInterval.get("dateEnd"));
	    }.bind(this));
	    _tools.historyInterval = dateInterval;
	    var msd = 24 * 3600000,
	        _viewCalendar1 = new nsGmx.CalendarWidget({
	        dateInterval: dateInterval,
	        name: 'searchInterval',
	        container: calendar1,
	        //dateMin: new Date(0, 0, 0),        
	        dateMin: new Date(nsGmx.DateInterval.getUTCDayBoundary().dateBegin.getTime() - msd * (daysLimit - 1)),
	        dateMax: new Date(3015, 1, 1),
	        dateFormat: 'dd.mm.yy',
	        minimized: false,
	        showSwitcher: false,
	        dateBegin: new Date(),
	        dateEnd: new Date(2000, 10, 10)
	        //buttonImage: 'img/calendar.png'
	    }),
	        _viewCalendar2 = new nsGmx.CalendarWidget({
	        dateInterval: dateInterval,
	        name: 'searchInterval',
	        container: calendar2,
	        //dateMin: new Date(0, 0, 0),        
	        dateMin: new Date(nsGmx.DateInterval.getUTCDayBoundary().dateBegin.getTime() - msd * (daysLimit - 1)),
	        dateMax: new Date(3015, 1, 1),
	        dateFormat: 'dd.mm.yy',
	        minimized: false,
	        showSwitcher: false,
	        dateBegin: new Date(),
	        dateEnd: new Date(2000, 10, 10)
	        //buttonImage: 'img/calendar.png'
	    });
	
	    var td = calendar1.find('tr:nth-of-type(1) td');
	    td.eq(1).after('<td style="font-weight:bold">&nbsp;&nbsp;&ndash;&nbsp;&nbsp;</td>');
	    td.eq(td.length - 1).after('<td>&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="' + _gtxt('AISSearch2.calendar_today') + '" src="plugins/AIS/AISSearch/svg/calendar.svg"></td>');
	    calendar1.find('.default_date').on('click', function () {
	        var db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
	        _viewCalendar1.getDateInterval().set('dateBegin', db.dateBegin);
	        _viewCalendar1.getDateInterval().set('dateEnd', db.dateEnd);
	        _viewCalendar2.getDateInterval().set('dateBegin', db.dateBegin);
	        _viewCalendar2.getDateInterval().set('dateEnd', db.dateEnd);
	        nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
	    });
	
	    td = calendar2.find('tr:nth-of-type(1) td');
	    td.eq(1).after('<td style="font-weight:bold">&nbsp;&nbsp;&ndash;&nbsp;&nbsp;</td>');
	    td.eq(td.length - 1).after('<td>&nbsp;&nbsp;<img class="default_date" style="cursor:pointer" title="' + _gtxt('AISSearch2.calendar_today') + '" src="plugins/AIS/AISSearch/svg/calendar.svg"></td>');
	    calendar2.find('.default_date').on('click', function () {
	        var db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
	        _viewCalendar1.getDateInterval().set('dateBegin', db.dateBegin);
	        _viewCalendar1.getDateInterval().set('dateEnd', db.dateEnd);
	        _viewCalendar2.getDateInterval().set('dateBegin', db.dateBegin);
	        _viewCalendar2.getDateInterval().set('dateEnd', db.dateEnd);
	        nsGmx.widgets.commonCalendar.setDateInterval(db.dateBegin, db.dateEnd);
	    });
	
	    ///////////////////////////////////////////////
	
	    var _modulePath = options.modulePath,
	        _searcher = new Searcher(options),
	        _mfm = new MyFleetModel({ aisLayerSearcher: _searcher, toolbox: _tools, modulePath: _modulePath }),
	        _ssm = new ScreenSearchModel({ aisLayerSearcher: _searcher, myFleetModel: _mfm, vesselLegend: options.vesselLegend }),
	        _dbsm = new DbSearchModel(_searcher),
	        _dbsv = new DbSearchView(_dbsm, options, _tools, _viewCalendar1),
	        _ssv = new ScreenSearchView(_ssm, _tools),
	        _mfv = new MyFleetView(_mfm, _tools, _viewCalendar2),
	        _idv = new InfoDialogView({
	        tools: _tools,
	        aisLayerSearcher: _searcher,
	        modulePath: _modulePath,
	        aisView: _dbsv,
	        myFleetView: _mfv,
	        menuId: options.menuId
	    });
	    _ssv.infoDialogView = _idv;
	    _mfv.infoDialogView = _idv;
	    _dbsv.infoDialogView = _idv;
	    return {
	        // get tools(){
	        //     return _tools;
	        // },
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
	var _tools = void 0,
	    _delayedRepaint = void 0;
	var ScreenSearchView = function ScreenSearchView(model, tools) {
	    var _this = this;
	
	    BaseView.apply(this, arguments);
	
	    _tools = tools;
	    _tools.onLegendSwitched(function (showAlternative) {
	        if (_this.isActive) {
	            _this.model.data && _this.model.data.vessels && _this.repaint();
	            if (_this.hideAisSwitch[0].checked) _tools.hideAisData(true);
	        } else {
	            _delayedRepaint = true;
	        }
	    }.bind(this));
	
	    this.frame = $(Handlebars.compile('<div class="ais_view screensearch_view">' + '<table border=0 class="instruments">' +
	    //'<tr><td colspan="2"><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/><i class="icon-flclose clicable"></div></td></tr>'+
	    '<tr><td><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filterName"}}"/>' + '<div><img class="search clicable" src="plugins/AIS/AISSearch/svg/search.svg">' + '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg">' + '</div></div>' + '</td></tr>' + '<tr><td style="padding-top:0px">' + '<label class="sync-switch switch hide_ais" style="margin-left:5px"><input type="checkbox">' + '<div class="sync-switch-slider switch-slider round"></div></label>' + '<span class="sync-switch-slider-description" style="padding: 0;line-height:12px">{{i "AISSearch2.hideAisData"}}</span>' + '<div>&nbsp;</div>' + '</td></tr>' + '</table>' + '<table class="results">' + '<tr><td class="count"></td>' + '<td><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div>' + this.gifLoader + '</div></div></td></tr>' + '<tr><td colspan="2" style="padding:0px"><div class="groups"></div></td></tr>' + '</table>' +
	    // '<table class="start_screen"><tr><td>'+
	    // '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">'+
	    // '<div>Здесь будут отображаться<br>результаты поиска</div></td></tr></table>'+
	    '<div class="ais_vessels">' + '<div class="ais_vessel">' + '<table border=0><tr><td><div class="position">NO VESSELS</div><div>mmsi: 0 imo: 0</div></td>' + '<td><i class="icon-ship" vessel="" title=""></i></td>' + '<td><span class="date"></span></td>' + '<td><div class="info" vessel="aisjson this" title="i AISSearch2.info">' + '<img src="plugins/AIS/AISSearch/svg/info.svg">' + '</div></td></tr></table>' + '</div>' + '</div>' + '</div>')());
	    Object.defineProperty(this, "topOffset", {
	        get: function get() {
	            var th = $('.ais_tabs')[0].getBoundingClientRect().height,
	                ih = this.frame.find('.instruments')[0].getBoundingClientRect().height,
	                rh = this.frame.find('.results')[0].getBoundingClientRect().height,
	                rv = th + ih + rh;
	            this.frame.find('.instruments').height(ih);
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
	        doFilter = function doFilter() {
	        this.model.setFilter();
	    };
	    cleanFilter.click(function (e) {
	        if (this.model.filterString === '') return;
	        filterInput.val('');
	        this.model.filterString = '';
	        filterReady.show();
	        cleanFilter.hide();
	        doFilter.call(this);
	        //nsGmx.leafletMap.removeLayer(highlight);
	    }.bind(this));
	    filterInput.keyup(function (e) {
	        var input = filterInput.val() || "";
	        input = input.replace(/^\s+/, "").replace(/\s+$/, "");
	
	        if (input == this.model.filterString) // && e.keyCode!=13
	            return;
	
	        if (input == '') {
	            filterReady.show();
	            cleanFilter.hide();
	            this.model.filterString = input;
	            doFilter.call(this);
	        } else {
	            cleanFilter.show();
	            filterReady.hide();
	        }
	        this.model.filterString = input;
	        //if (e.keyCode==13){
	        if (e.keyCode != 13) {
	            doFilter.call(this);
	            //nsGmx.leafletMap.removeLayer(highlight);
	        }
	        //}
	    }.bind(this));
	
	    var needUpdate = function needUpdate() {
	        this.model.isDirty = true;
	        if (this.isActive) this.model.update();
	    };
	    nsGmx.leafletMap.on('moveend', needUpdate.bind(this));
	    nsGmx.widgets.commonCalendar.getDateInterval().on('change', needUpdate.bind(this));
	
	    this.hideAisSwitch = this.frame.find('.instruments .hide_ais  input[type="checkbox"]');
	    this.hideAisSwitch.click(function (e) {
	        _tools.hideAisData(e.currentTarget.checked);
	    }.bind(this));
	
	    this.model.update(); //warm up
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
	    this.container.find('.info').on('click', function (e) {
	        var _this2 = this;
	
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
	        thisInst.infoDialogView.showPosition(v);
	    });
	    //console.log("repaint "+(new Date()-start)+"ms" ) 
	    this.frame.find('.show_groups').on('click', function () {
	        arrowHead = arrowHead == 'icon-down-open' ? 'icon-right-open' : 'icon-down-open';
	        this.repaint();
	    }.bind(this));
	};
	
	var arrowHead = 'icon-down-open';
	ScreenSearchView.prototype.repaint = function () {
	    if (!this.isActive) {
	        _delayedRepaint = true;
	        return;
	    }
	
	    _delayedRepaint = false;
	    //let startRep = new Date();
	    //console.log("REPAINT")
	    //_clean.call(this);
	    this.frame.find('.count').html('<div class="show_groups clicable ui-helper-noselect ' + arrowHead + '" ' + 'style="margin-right:5px;display:inline"></div>' + _gtxt('AISSearch2.found') + this.model.data.vessels.length);
	    //BaseView.prototype.repaint.apply(this, arguments);
	
	    this.frame.find('.groups')[0].innerHTML = '';
	    if (this.model.data.groups && this.model.data.groups.length && arrowHead == 'icon-down-open') this.frame.find('.groups')[0].innerHTML = Handlebars.compile('<table>' + '{{#each groups}}' + '<tr><td><img src="{{url}}" style="width:20px;height:20px"></td><td><div class="group_name">{{name}}</div></td><td>{{count}}</td></tr>' + '{{/each}}' + '</table>')({ groups: !_tools.needAltLegend ? this.model.data.groups : this.model.data.groupsAlt });
	
	    BaseView.prototype.resize.apply(this, arguments);
	
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
	    //console.log((new Date().getTime()-startRep)/1000)
	};
	
	ScreenSearchView.prototype.show = function () {
	    this.startShow = true;
	    BaseView.prototype.show.apply(this, arguments);
	
	    if (_delayedRepaint && !this.model.isDirty) this.repaint();
	
	    this.frame.find('.filter input').focus();
	
	    if (this.scroledPx) {
	        this.container.mCustomScrollbar("scrollTo", this.scroledPx, { scrollInertia: 0, callbacks: false });
	    }
	
	    _tools.hideAisData(this.hideAisSwitch[0].checked);
	};
	ScreenSearchView.prototype.hide = function () {
	    if (!this.isActive) return;
	    _tools.hideAisData(false);
	    BaseView.prototype.hide.call(this);
	};
	
	module.exports = ScreenSearchView;

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var PRODUCTION = false,
	    SIDEBAR2 = false;
	if (true) SIDEBAR2 = true;
	if (true) PRODUCTION = true;
	
	var _calcHeight = function _calcHeight() {
	    return $('.iconSidebarControl-pane').height() - ($('.ais_panel_footer')[0] ? $('.ais_panel_footer').height() : 0) - this.topOffset;
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
	            if (clean) {
	                this.container.empty();
	            }
	            var h = _calcHeight.call(this);
	            if (this.startScreen && $('.iconSidebarControl-pane:visible')[0]) {
	                var bb = $('.iconSidebarControl-pane:visible')[0].getBoundingClientRect();
	                this.startScreen.css({ position: "absolute", left: bb.left + "px", top: bb.height / 2 - 50 + "px",
	                    width: bb.width + "px" });
	            }
	            this.container.height(h);
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
	                v.xmax = null;
	                v.xmin = null;
	                v.ymax = null;
	                v.ymin = null;
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

	'use strict';
	
	var _actualUpdate = void 0,
	    _myFleetModel = void 0,
	    _aisLayerSearcher = void 0,
	    _vesselLegend = void 0;
	
	var ScreenSearchModel = function ScreenSearchModel(_ref) {
	    var aisLayerSearcher = _ref.aisLayerSearcher,
	        myFleetModel = _ref.myFleetModel,
	        vesselLegend = _ref.vesselLegend;
	
	
	    var thisInstance = this;
	    myFleetModel.onChanged = function () {
	        thisInstance.isDirty = true;
	        if (thisInstance.view.isActive) thisInstance.update();
	    };
	    _aisLayerSearcher = aisLayerSearcher;
	    _myFleetModel = myFleetModel;
	    _vesselLegend = vesselLegend;
	    //this.filterString = "";
	    this.isDirty = true;
	};
	
	var _filterString = '';
	Object.defineProperty(ScreenSearchModel.prototype, "filterString", {
	    get: function get() {
	        return _filterString;
	    },
	    set: function set(v) {
	        _filterString = v;
	    }
	});
	
	var _filterPromise = void 0;
	ScreenSearchModel.prototype.setFilter = function (s) {
	    this.view.inProgress(true);
	    if (this.filterString == '') {
	        this.data.vessels = this.dataSrc.vessels.map(function (v) {
	            return v;
	        });
	        this.data.groups = this.dataSrc.groups.map(function (g) {
	            return g;
	        });
	        this.data.groupsAlt = this.dataSrc.groupsAlt.map(function (g) {
	            return g;
	        });
	
	        this.sortData();
	        this.view.inProgress(false);
	        this.view.repaint();
	    } else {
	        var thisModel = this;
	        if (_filterPromise) _filterPromise.cancel = true;
	        _filterPromise = {
	            cancel: false,
	            run: function run() {
	                var inst = this;
	                return new Promise(function (rs, rj) {
	                    setTimeout(function () {
	                        if (inst.cancel || !thisModel.data) rj(0);
	                        thisModel.data.vessels = [], thisModel.data.groups = [], thisModel.data.groupsAlt = [];
	                        var filter = new RegExp('^' + thisModel.filterString + '| ' + thisModel.filterString, "ig");
	                        //console.log(`[${filter}]`);
	                        var icons = {},
	                            setGroups = function setGroups(ic, a) {
	                            if (icons[ic.name] == undefined) {
	                                icons[ic.name] = a.length;
	                                a.push({ url: ic.url, name: ic.name, count: 1 });
	                            } else a[icons[ic.name]].count = a[icons[ic.name]].count + 1;
	                        };
	
	                        var a = thisModel.dataSrc.vessels;
	                        for (var i = 0, v; i < a.length; ++i) {
	                            if (inst.cancel) rj(0);
	                            v = a[i];
	                            if (v.vessel_name.search(filter) > -1) {
	                                thisModel.data.vessels.push(v);
	                                var ic = _vesselLegend.getIcon(v.vessel_type, 1);
	                                setGroups(ic, thisModel.data.groups);
	                                ic = _vesselLegend.getIconAlt(v.vessel_, parseInt(v.sog));
	                                setGroups(ic, thisModel.data.groupsAlt);
	                            }
	                        }
	                        if (inst.cancel) rj(0);
	
	                        rs(thisModel.filterString);
	                    }, 500);
	                });
	            }
	        };
	        _filterPromise.run().then(function (r) {
	            //console.log(`<${r}>`);
	            thisModel.sortData();
	            thisModel.view.inProgress(false);
	            thisModel.view.repaint();
	        }, function () {});
	
	        // this.data.vessels = [], this.data.groups = [], this.data.groupsAlt = [];
	        // const filter = new RegExp(`^${this.filterString}| ${this.filterString}`, "ig");
	        // let icons = {}, setGroups = function(ic, a){
	        //         if (icons[ic.name]==undefined){
	        //             icons[ic.name] = a.length;
	        //             a.push({ url: ic.url, name: ic.name, count: 1})
	        //         }
	        //         else
	        //             a[icons[ic.name]].count = a[icons[ic.name]].count + 1;
	        // };
	        // this.dataSrc.vessels.forEach(v=>{
	        //     if (v.vessel_name.search(filter)>-1){
	        //         this.data.vessels.push(v);
	        //         let ic = _vesselLegend.getIcon(v.vessel_type, 1);
	        //         setGroups(ic, this.data.groups);
	        //         ic = _vesselLegend.getIconAlt(v.vessel_, parseInt(v.sog));
	        //         setGroups(ic, this.data.groupsAlt);
	        //     }
	        // });
	        // this.sortData();
	        // this.view.inProgress(false);
	        // this.view.repaint(); 
	    }
	};
	
	ScreenSearchModel.prototype.load = function (actualUpdate) {
	    if (!this.isDirty) return Promise.resolve();
	
	    var thisInst = this;
	    var s = new Date();
	    return Promise.all([new Promise(function (resolve, reject) {
	        _aisLayerSearcher.searchScreen({
	            dateInterval: nsGmx.widgets.commonCalendar.getDateInterval(),
	            border: true,
	            group: true
	        }, function (json) {
	            //console.log("RECEIVED "+((new Date()-s)/1000));
	            if (json.Status.toLowerCase() == "ok") {
	                //console.log(json.Result.elapsed);
	                s = new Date();
	
	                // thisInst.filterString = thisInst.filterString.replace(/\r+$/, ""); !!!!!!TO DO FILTER
	
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
	                        //if (_myFleetModel.findIndex(vessel)>=0)
	                        //    vessel.mf_member = "visibility:visible";
	                        vessel.icon_rot = Math.round(vessel.cog / 15) * 15;
	                        _aisLayerSearcher.placeVesselTypeIcon(vessel);
	                        return vessel;
	                    }),
	                    groups: [],
	                    groupsAlt: []
	                };
	
	                thisInst.data = { groups: [], groupsAlt: [] };
	                for (var k in json.Result.groups) {
	                    var ic = _vesselLegend.getIcon(k, 1);
	                    thisInst.data.groups.push({ url: ic.url, name: ic.name, count: json.Result.groups[k] });
	                }
	                for (var _k in json.Result.groupsAlt) {
	                    if (!isNaN(_k)) {
	                        var _ic = _vesselLegend.getIconAlt("ABC", parseInt(_k));
	                        thisInst.data.groupsAlt.push({ url: _ic.url, name: _ic.name, count: json.Result.groupsAlt[_k] });
	                    }
	                }
	                thisInst.dataSrc.groups = thisInst.data.groups.map(function (g) {
	                    return g;
	                });
	                thisInst.dataSrc.groupsAlt = thisInst.data.groupsAlt.map(function (g) {
	                    return g;
	                });
	
	                //console.log(("MAP "+((new Date()-s)/1000)))
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
	
	ScreenSearchModel.prototype.sortData = function () {
	    var sortGrups = function sortGrups(a, b) {
	        return b.count - a.count;
	    };
	    this.data.groups.sort(sortGrups);
	    this.data.groupsAlt.sort(sortGrups);
	    // let sortNames = (a,b)=>{
	    //     if (a.vessel_name == b.vessel_name)
	    //         return 0;
	    //     else
	    //         return a.vessel_name > b.vessel_name ? 1 : -1;
	    // };  
	    // this.data.vessels.sort((a,b)=>{
	    //     let a_member = _myFleetModel.findIndex(a)>=0,
	    //         b_member = _myFleetModel.findIndex(b)>=0;
	    //     if (a_member)
	    //         a.mf_member = "visibility:visible";
	    //     if (b_member)
	    //         b.mf_member = "visibility:visible";
	    //     if ((!a_member && !b_member) || (a_member && b_member))
	    //         return 0; //sortNames(a,b);
	    //     else if (a_member && !b_member)
	    //         return -1;
	    //     else if (!a_member && b_member)
	    //         return 1;
	    // });
	};
	ScreenSearchModel.prototype.update = function () {
	    if (!this.isDirty) return;
	    _actualUpdate = new Date().getTime();
	    var thisInst = this,
	        actualUpdate = _actualUpdate;
	    this.view.inProgress(true);
	
	    var s = new Date();
	    this.load(actualUpdate).then(function () {
	        if (_actualUpdate == actualUpdate) {
	            if (thisInst.dataSrc) _myFleetModel.markMembers(thisInst.dataSrc.vessels);
	            if (thisInst.filterString != '') {
	                thisInst.setFilter();
	            } else {
	                thisInst.data.vessels = thisInst.dataSrc.vessels;
	
	                thisInst.sortData();
	                thisInst.view.inProgress(false);
	                thisInst.view.repaint();
	            }
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
	        ic.hide(); //ica.show();
	        ica.each(function (i, e) {
	            return e.style.display = "";
	        });
	    } else {
	        ica.hide(); //ic.show();
	        ic.each(function (i, e) {
	            return e.style.display = "";
	        });
	    }
	},
	    _clean = function _clean() {
	    this.frame.find('.ais_vessels input[type="checkbox"]').off('click');
	    this.startScreen.css({ visibility: "hidden" });
	};
	
	var _tools = void 0,
	    _displayedOnly = [],
	    _notDisplayed = [],
	    _saveLabelSettingsPromise = Promise.resolve(0),
	    _viewState = {
	    get isViewActive() {
	        return !!this.view.isActive;
	    },
	    get displayedOnly() {
	        return _displayedOnly;
	    },
	    get notDisplayed() {
	        return _notDisplayed;
	    },
	    showTracks: function showTracks(trackBuilder, needAlt) {
	        trackBuilder.showMyFleetTracks(_displayedOnly, needAlt);
	    },
	    hideTracks: function hideTracks(trackBuilder, needAlt) {
	        trackBuilder.hideMyFleetTracks(_notDisplayed, needAlt);
	    },
	    cleanTracks: function cleanTracks(trackBuilder, needAlt) {
	        trackBuilder.cleanMyFleetTracks();
	    }
	};
	
	var MyFleetView = function MyFleetView(model, tools, viewCalendar) {
	    var _this = this;
	
	    BaseView.apply(this, arguments);
	    _viewState.view = this;
	    _tools = tools;
	    _tools.onLegendSwitched(function (showAlternative) {
	        _switchLegendIcon.call(_this, _tools.needAltLegend);
	    }.bind(this));
	
	    var settings = []; //DEFAULT SETTINGS
	    this.frame = $(Handlebars.compile('<div class="ais_view myfleet_view">' + '<table class="instruments">' + '<tr><td style="vertical-align:top; padding-right:0">' + '<div style="width:140px; margin-bottom: 8px;">{{i "AISSearch2.DisplaySection"}}</div>' + '<div style="margin-bottom: 5px;"><label class="sync-switch switch only_myflot"><input type="checkbox">' + '<div class="sync-switch-slider switch-slider round"></div></label>' + '<span class="sync-switch-slider-description">{{i "AISSearch2.myFleetOnly"}}</span></div>' + '<label class="sync-switch switch all_tracks"><input type="checkbox">' + '<div class="sync-switch-slider switch-slider round"></div></label>' + '<span class="sync-switch-slider-description" >{{i "AISSearch2.shipsTracks"}}</span>' + '</td>' + '<td style="padding-right:0">' + '<div style="width:120px;float:left;" class="setting"><label><input type="checkbox" id="group_name" ' + (settings.indexOf('group_name') < 0 ? '' : 'checked') + '>{{i "AISSearch2.DisplayGroupName"}}</div>' + '<div style="width:120px;float:left;" class="setting"><label><input type="checkbox" id="vessel_name" ' + (settings.indexOf('vessel_name') < 0 ? '' : 'checked') + '>{{i "AISSearch2.DisplayVesselName"}}</label></div>' + '<div style="width:70px;float:left;" class="setting"><label><input type="checkbox" id="sog" ' + (settings.indexOf('sog') < 0 ? '' : 'checked') + '>{{i "AISSearch2.DisplaySog"}}</label></div>' + '<div style="width:45px;float:left;" class="setting"><label><input type="checkbox" id="cog" ' + (settings.indexOf('cog') < 0 ? '' : 'checked') + '>{{i "AISSearch2.DisplayCog"}}</label></div>' + '</td>' + '<td><div class="refresh"><div>' + this.gifLoader + '</div></div></td></tr>' + '<tr><td colspan="3" style="padding-top:0; padding-bottom:5px">' + '<table class="newgroup"><tr><td>{{i "AISSearch2.NewGroup"}}</td>' + '<td><div class="newgroupname"><input type="text" placeholder="{{i "AISSearch2.NewGroupName"}}"/></div></td>' + '<td><img class="create clicable" title="{{i "AISSearch2.CreateGroup"}}" src="plugins/AIS/AISSearch/svg/add.svg"></td>' + '</tr></table>' + '</td></tr>' + '<tr><td colspan="2"><style>' + '#ui-datepicker-div .ui-datepicker-next {height: 1.8em !important;}' + '#ui-datepicker-div .ui-datepicker-next span.ui-icon.ui-icon-circle-triangle-e {background: url(img/arrows.png) no-repeat 0 -18px !important;}' + '#ui-datepicker-div .ui-datepicker-next.ui-state-hover span.ui-icon.ui-icon-circle-triangle-e {background: url(img/arrows.png) no-repeat 0 -38px !important;}' + '</style><div class="calendar"></div></td>' + '<td style="padding-left:5px;padding-right:25px;vertical-align:top;"><div class="clicable" title="{{i "AISSearch2.refresh"}}">' +
	    //'<div class="progress">' + this.gifLoader + '</div>' +
	    '<div class="reload"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#2f3c47" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></div>' + '</div></td></tr>' + '</table>' + '<div class="ais_vessels">' + '<table class="results">' + '<td><input type="checkbox" checked></td>' + '<td class="count"></td></tr></table>' + '<div class="ais_vessel">' + '<table border=0><tr>' + '<td><input type="checkbox" checked></td>' + '<td><div class="position">vessel_name</div><div>mmsi: mmsi imo: imo</div></td>' + '<td></td>' + '<td><span class="date">ts_pos_utc</span></td>' + '</tr></table>' + '</div>' + '</div>' + '<table class="start_screen"><tr><td>' + '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">' + '<div>{{{i "AISSearh2.myfleet_view"}}}' + '</div></td></tr></table>' + '</div>')());
	
	    this.calendar = viewCalendar;
	    this.frame.find('.calendar').append(this.calendar.el.parentElement);
	
	    var reloadTrack = function reloadTrack() {
	        if (!this.displayTracks) return;
	        if (this.isActive) this.inProgress(true);
	        this.model.loadTracks(this.infoDialogView, _viewState);
	    };
	    this.calendar.onChange = reloadTrack.bind(this);
	    this.frame.find('.reload').on('click', reloadTrack.bind(this));
	
	    this.frame.on('click', function (e) {
	        if (e.target.classList.toString().search(/CalendarWidget/) < 0) {
	            _this.calendar.reset();
	        }
	        //suggestions.hide();
	    }.bind(this));
	
	    Object.defineProperty(this, "displayTracks", {
	        get: function get() {
	            var showTracsCtrl = this.frame.find('.instruments .switch.all_tracks input[type="checkbox"]')[0];
	            return showTracsCtrl.checked;
	        }
	    });
	
	    Object.defineProperty(this, "topOffset", {
	        get: function get() {
	            var th = $('.ais_tabs')[0].getBoundingClientRect().height,
	                ih = this.frame.find('.instruments')[0].getBoundingClientRect().height,
	                rv = th + ih;
	            this.frame.find('.instruments').height(ih);
	            return rv;
	        }
	    });
	
	    this.container = this.frame.find('.ais_vessels');
	    this.startScreen = this.frame.find('.start_screen');
	
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
	        _tools.showVesselsOnMap(_viewState);
	
	        _saveLabelSettingsPromise = _saveLabelSettingsPromise.then(function (c) {
	            return _this.model.saveLabelSettings(c);
	        }.bind(_this));
	    }.bind(this));
	
	    // tracks controller    
	    this.frame.find('.instruments .switch.all_tracks input[type="checkbox"]').on("click", function (e) {
	        if (e.currentTarget.checked) {
	            this.inProgress(true);
	            this.model.loadTracks(this.infoDialogView, _viewState);
	        } else {
	            _tools.showMyFleetTrack();
	        }
	    }.bind(this));
	
	    // visibility controller
	    this.frame.find('.instruments .switch.only_myflot input[type="checkbox"]').on("click", function (e) {
	        _displayedOnly.length = 0;
	        if (e.currentTarget.checked) _displayedOnly = this.model.vessels.map(function (v) {
	            return v.mmsi.toString();
	        });
	        _tools.showVesselsOnMap(_viewState);
	        _tools.hideVesselsOnMap(_viewState, 'click only');
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
	    if (!this.model.vessels.length) this.frame.find('.instruments .switch.only_myflot input[type="checkbox"]')[0].checked = false;
	    if (this.frame.find('.instruments .switch.only_myflot input[type="checkbox"]')[0].checked) _displayedOnly = this.model.vessels.map(function (v) {
	        return v.mmsi.toString();
	    });
	    _tools.showVesselsOnMap(_viewState);
	    _tools.hideVesselsOnMap(_viewState, 'repaint');
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
	        _tools.hideVesselsOnMap(_viewState, 'check item');
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
	            thisView.model.changeMembers(vessel, _this3.infoDialogView).then(function () {
	                thisView.show();
	                _tools.eraseMyFleetMarker(vessel.mmsi);
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
	    if (!this.isActive) return;
	
	    BaseView.prototype.hide.apply(this, arguments);
	    _tools.cleanMap(_viewState);
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
	    _trackLoaders = [],
	    _isDirty = true,
	    _myFleetLayers = [],
	    _defaultGroup = _gtxt("AISSearch2.AllGroup"),
	    _vessels = [],
	    _mapID = void 0,
	    _modulePath = void 0,
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
	        toolbox = _ref.toolbox,
	        modulePath = _ref.modulePath;
	
	    _modulePath = modulePath;
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
	            if ((nickname == 'scf_captain' || nickname == 'scf_captain2020' || nickname == 'scf_master2020') && _mapID == 'KGEJB') resolve({ Status: "ok", Result: { count: 1, layers: [{ LayerID: "0A5CE9C59487441689ABF3031991BF2F" }] } });else sendCrossDomainJSONRequest(aisLayerSearcher.baseUrl + "Layer/Search2.ashx?page=0&pageSize=50&orderby=title &query=([Title]='myfleet" + _mapID + "' and [OwnerNickname]='" + nickname + "')", function (response) {
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
	
	            //if (!this.isDirty)
	            //    return;
	
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
	        changeMembers: function changeMembers(vessel, infoDialog) {
	            var _this = this;
	
	            //console.log(infoDialog)
	            var remove = false;
	            for (var i = 0; i < _vessels.length; ++i) {
	                if (_vessels[i].imo == vessel.imo && _vessels[i].mmsi == vessel.mmsi) {
	                    remove = _vessels[i].gmx_id;
	                    _vessels.splice(i, 1);
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
	                }.bind(_this)).then(function () {
	                    if (remove) _tools.removeMyFleetTrack(vessel.mmsi);else this.view.displayTracks && this.loadTrack(vessel.mmsi, infoDialog);
	
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
	        },
	        loadTrack: function loadTrack(mmsi, infoDialog) {
	            if (window.Worker) {
	                var baseUrl = window.serverBase.replace(/^(https?:)/, "$1"),
	                    di = _tools.historyInterval,
	                    interval = { dateBegin: di.get('dateBegin'), dateEnd: di.get('dateEnd') },
	                    thisView = this.view;
	                var counter = _vessels.length;
	
	                var v = { mmsi: mmsi },
	                    myWorker = new Worker(_modulePath + 'LoaderWorker.js');
	                myWorker.postMessage({ mmsi: v.mmsi, url: baseUrl + "plugins/AIS/SearchMfPositionsAsync.ashx?layer=8EE2C7996800458AAF70BABB43321FA4&mmsi=" + v.mmsi + "&s=" + interval.dateBegin.toISOString() + "&e=" + interval.dateEnd.toISOString() });
	                myWorker.onmessage = function (e) {
	                    //console.log('Message received from worker', e.data);
	                    _tools.showMyFleetTrack([e.data], function (_ref2) {
	                        var pid = _ref2.pid;
	
	                        _aisLayerSearcher.searchById([pid], function (response) {
	                            if (response.Status && response.Status.toLowerCase() == 'ok' && response.Result) {
	                                var _v = {},
	                                    res = response.Result;
	                                res.fields.forEach(function (f, i) {
	                                    return _v[f] = res.values[0][i];
	                                });
	                                infoDialog.show(_v, false);
	                            }
	                        });
	                    }, _aisLayerSearcher);
	                    counter--;
	                    if (!counter) thisView.inProgress(false);
	                };
	                myWorker.onerror = function (e) {
	                    console.log(e);
	                    counter--;
	                    if (!counter) thisView.inProgress(false);
	                };
	                _trackLoaders.push(myWorker);
	            } else console.log("NO WORKERS");
	        },
	        loadTracks: function loadTracks(infoDialog, viewState) {
	            if (window.Worker) {
	                _trackLoaders.forEach(function (w) {
	                    return w.terminate();
	                });
	                _trackLoaders.length = 0;
	
	                var baseUrl = window.serverBase.replace(/^(https?:)/, "$1"),
	                    di = _tools.historyInterval,
	                    interval = { dateBegin: di.get('dateBegin'), dateEnd: di.get('dateEnd') },
	                    thisView = this.view;
	                //console.log(_vessels, _vessels.length)
	                Promise.all(_vessels.map(function (v) {
	                    return new Promise(function (resolve, reject) {
	                        if (v.mmsi) {
	                            var myWorker = new Worker(_modulePath + 'LoaderWorker.js');
	                            myWorker.postMessage({ mmsi: v.mmsi, imo: v.imo, url: baseUrl + "plugins/AIS/SearchMfPositionsAsync.ashx?layer=8EE2C7996800458AAF70BABB43321FA4&mmsi=" + v.mmsi + "&s=" + interval.dateBegin.toISOString() + "&e=" + interval.dateEnd.toISOString() });
	                            myWorker.onmessage = function (e) {
	                                resolve(e.data);
	                            };
	                            myWorker.onerror = function (e) {
	                                reject(e);
	                            };
	                            _trackLoaders.push(myWorker);
	                        } else {
	                            resolve();
	                        }
	                    });
	                })).then(function (data) {
	                    //console.log(data, data.length)
	                    data.reduce(function (p, c) {
	                        return p.then(function () {
	                            if (!c) return Promise.resolve();
	
	                            _tools.showMyFleetTrack([c], function (_ref3) {
	                                var pid = _ref3.pid;
	
	                                _aisLayerSearcher.searchById([pid], function (response) {
	                                    if (response.Status && response.Status.toLowerCase() == 'ok' && response.Result) {
	                                        var v = {},
	                                            res = response.Result;
	                                        res.fields.forEach(function (f, i) {
	                                            return v[f] = res.values[0][i];
	                                        });
	                                        infoDialog.show(v, false);
	                                    }
	                                });
	                            }, _aisLayerSearcher, viewState);
	                            //console.log(c,  c.positions ? Math.round(c.positions.length/3.5) : 0)
	                            return new Promise(function (resolve) {
	                                return setTimeout(function () {
	                                    return resolve();
	                                }, c.positions ? Math.round(c.positions.length / 3.5) : 0);
	                            });
	                        });
	                    }, Promise.resolve()).then(function () {
	                        return thisView.inProgress(false);
	                    });
	                }).catch(function (e) {
	                    console.log(e);
	                    thisView.inProgress(false);
	                });
	
	                /*
	                                _vessels.forEach(v=>{ 
	                                    var myWorker = new Worker(_modulePath + 'LoaderWorker.js');
	                                    myWorker.postMessage({mmsi:v.mmsi, url:`${baseUrl}plugins/AIS/SearchMfPositionsAsync.ashx?layer=8EE2C7996800458AAF70BABB43321FA4&mmsi=${v.mmsi}&s=${interval.dateBegin.toISOString()}&e=${interval.dateEnd.toISOString()}`});
	                                    myWorker.onmessage = function(e) {
	                //console.log('Message received from worker', e.data);
	                                        //if ( e.data.mmsi=='273444660')
	                                        _tools.showMyFleetTrack([e.data], console.log, _aisLayerSearcher);
	                                        counter--;
	                                        if (!counter)
	                                            thisView.inProgress(false);
	                                    }                
	                                    myWorker.onerror = function(e) {
	                                        console.log(e);
	                                        counter--;
	                                        if (!counter)
	                                            thisView.inProgress(false)
	                                    }
	                                    _trackLoaders.push(myWorker);
	                                });
	                                */
	            } else console.log("NO WORKERS");
	            //             return;
	            // console.log(_tools.historyInterval)                  
	            //             const di = _tools.historyInterval;
	            //             _vessels.forEach(v=>{ 
	            //                 new Promise((resolve) => {
	            //                     _aisLayerSearcher.searchPositionsAgg2Mf(v.mmsi, {dateBegin: di.get('dateBegin'), dateEnd: di.get('dateEnd')}, function (response) {
	            // //console.log(response)       
	            //                     if (parseResponse(response)) {
	            //                         let position, positions = [],
	            //                             fields = response.Result.fields,
	            //                             groups = response.Result.values.reduce((p, c) => {
	            //                                 let obj = {}, d;
	            //                                 for (var j = 0; j < fields.length; ++j) {
	            //                                     obj[fields[j]] = c[j];
	            //                                     if (fields[j] == 'ts_pos_utc'){
	            //                                         let dt = c[j], t = dt - dt % (24 * 3600);
	            //                                         d = new Date(t * 1000);
	            //                                         obj['ts_pos_org'] = c[j];
	            //                                     }
	            //                                 }
	            //                                 if (p[d]) {
	            //                                     p[d].positions.push(_tools.formatPosition(obj, _aisLayerSearcher));
	            //                                     p[d].count = p[d].count + 1;
	            //                                 }
	            //                                 else
	            //                                     p[d] = { mmsi: v.mmsi, positions: [_tools.formatPosition(obj, _aisLayerSearcher)], count: 1 };
	            //                                 return p;
	            //                             }, {});
	            //                         let counter = 0;
	            //                         for (var k in groups) {
	            //                             groups[k]["n"] = counter++;
	            //                             positions.push(groups[k]);
	            //                         }
	            //                         resolve({ Status: "ok", Result: { values: positions, total: response.Result.values.length } });
	            //                     }
	            //                     else
	            //                         resolve(response);
	            //                     });
	            //                 })
	            //                 .then(function (response) {
	            //                     if (response.Status && response.Status.toLowerCase()=='ok' && response.Result && response.Result.values)
	            //                         _tools.showMyFleetTrack(response.Result.values, console.log);
	            //                     else
	            //                         console.log(response);
	            //                 });
	            //            });
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
	__webpack_require__(19);
	var BaseView = __webpack_require__(9),
	    SearchControl = __webpack_require__(20);
	
	var _searchLayer = void 0,
	    _highlight = void 0,
	    _tools = void 0,
	    _displayedOnly = [],
	    _displayed = [],
	    _viewState = {
	    get displayedOnly() {
	        return _displayedOnly;
	    },
	    get displayed() {
	        return _displayed;
	    },
	    showTracks: function showTracks(trackBuilder, needAlt) {
	        trackBuilder.showHistoryTracks(this.displayed, needAlt);
	    },
	    hideTracks: function hideTracks(trackBuilder, needAlt) {
	        //trackBuilder.hideHistoryTracks(_notDisplayed, needAlt);
	    },
	    cleanTracks: function cleanTracks(trackBuilder) {
	        _displayed = trackBuilder.cleanHistoryTracks();
	    }
	};
	var _switchLegendIcon = function _switchLegendIcon(showAlternative) {
	    var ic = this.frame.find('.legend_icon'),
	        ica = this.frame.find('.legend_iconalt');
	    if (showAlternative) {
	        ic.hide();ica.show();
	    } else {
	        ica.hide();ic.show();
	    }
	};
	var DbSearchView = function DbSearchView(model, options, tools, viewCalendar) {
	    var _this = this;
	
	    BaseView.call(this, model, tools);
	    _searchLayer = options.aisLastPoint;
	    _highlight = options.highlight;
	    _tools = tools;
	    _viewState.view = this;
	    this.frame = $(Handlebars.compile('<div class="ais_view search_view">' + '<table border=0 class="instruments">' + '<tr><td colspan="2" class="search_input_container">' +
	
	    //'<div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/>' +
	    //'<div><img class="search clicable" src="plugins/AIS/AISSearch/svg/search.svg">' +
	    //'<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg">' +
	    //'</div></div>' + 
	    '' + '</td></tr>' + '<tr><td class="time" colspan="2"><span class="label">{{i "AISSearch2.time_switch"}}:</span>' + '<span class="utc on unselectable" unselectable="on">UTC</span><span class="local unselectable" unselectable="on">{{i "AISSearch2.time_local"}}</span>' + '<span class="sync-switch-slider-description" style="padding: 0;margin-left: 10px;line-height:12px">{{i "AISSearch2.thisVesselOnly"}}</span>' + '<label class="sync-switch switch only_this" style="margin-left:5px"><input type="checkbox">' + '<div class="sync-switch-slider switch-slider round"></div></label>' + '</td></tr>' + '<tr><td><style>' + '#ui-datepicker-div .ui-datepicker-next {height: 1.8em !important;}' + '#ui-datepicker-div .ui-datepicker-next span.ui-icon.ui-icon-circle-triangle-e {background: url(img/arrows.png) no-repeat 0 -18px !important;}' + '#ui-datepicker-div .ui-datepicker-next.ui-state-hover span.ui-icon.ui-icon-circle-triangle-e {background: url(img/arrows.png) no-repeat 0 -38px !important;}' + '</style><div class="calendar"></div></td>' + '<td style="padding-left:5px;padding-right:25px;vertical-align:top;"><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}">' + '<div class="progress">' + this.gifLoader + '</div>' + '<div class="reload"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#2f3c47" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg></div>' + '</div></td></tr>' + '</table>' + '<div class="ais_history">' + '<table class="ais_positions_date"><tr><td>NO HISTORY FOUND</td></tr></table>' + '</div>' + '<table class="start_screen"><tr><td>' + '<img src="plugins/AIS/AISSearch/svg/steer-weel.svg">' + '<div>{{{i "AISSearh2.searchresults_view"}}}' + '</div></td></tr></table>' +
	
	    //'<div class="suggestions"><div class="suggestion">SOME VESSEL<br><span>mmsi:0, imo:0</span></div></div>' +
	    '</div>')());
	
	    Object.defineProperty(this, "topOffset", {
	        get: function get() {
	            var th = $('.ais_tabs')[0].getBoundingClientRect().height,
	                ih = this.frame.find('.instruments')[0].getBoundingClientRect().height,
	                rv = th + ih;
	            this.frame.find('.instruments').height(ih);
	            return rv;
	        }
	    });
	
	    this.container = this.frame.find('.ais_history');
	    this.startScreen = this.frame.find('.start_screen');
	    this.tableTemplate = '{{#if msg}}<div class="message">{{msg}}</div>{{/if}}' + '<table class="ais_positions_date header"><tr>' + '<td></td>' + '<td><span class="date"></span></td>' + '<td><div class="track all"><input type="checkbox" title="{{i "AISSearch2.allDailyTracks"}}"></div></td>' + '<td><div class="count">{{total}}</div></td></tr></table>' + '{{#each vessels}}' + '<table class="ais_positions_date" border=0><tr>' + '<td><div class="open_positions ui-helper-noselect icon-right-open" title="{{i "AISSearch2.voyageInfo"}}"></div></td>' + '<td><span class="date">{{{ts_pos_utc}}}</span></td>' + '<td><div class="track" date="{{{ts_pos_utc}}}"><input type="checkbox" title="{{i "AISSearch2.dailyTrack"}}"></div></td>' + '<td><div class="count">{{count}}</div></td></tr></table>' + '<div id="voyage_info{{n}}"></div>' + '{{/each}}';
	
	    this.calendar = viewCalendar;
	    this.frame.find('.calendar').append(this.calendar.el.parentElement);
	    this.calendar.onChange = function (interval) {
	        this.model.historyInterval = interval;
	        this.model.isDirty = true;
	        if (this.isActive) this.show();
	    }.bind(this);
	    this.frame.on('click', function (e) {
	        if (e.target.classList.toString().search(/CalendarWidget/) < 0) {
	            _this.calendar.reset();
	        }
	        //suggestions.hide();
	    }.bind(this));
	
	    this.frame.find('.time .only_this  input[type="checkbox"]').click(function (e) {
	        _displayedOnly.length = 0;
	        if (e.currentTarget.checked && _this.frame.find('.ais_positions_date:not(.header)')[0]) {
	            _displayedOnly.push(_this.model.data.vessels[0].positions[0].mmsi.toString());
	        }
	        _tools.showVesselsOnMap(_viewState);
	    }.bind(this));
	
	    _tools.onLegendSwitched(function () {
	        _switchLegendIcon.call(_this, _tools.needAltLegend);
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
	
	    this.searchInput = new SearchControl({ tab: this.frame[0], container: this.frame.find('.search_input_container')[0],
	        searcher: {
	            searchPromise: function searchPromise(params) {
	                var request = "layer=" + _searchLayer + "&columns=[{\"Value\":\"vessel_name\"},{\"Value\":\"mmsi\"},{\"Value\":\"imo\"},{\"Value\":\"ts_pos_utc\"},{\"Value\":\"vessel_type\"},{\"Value\":\"longitude\"},{\"Value\":\"latitude\"},{\"Value\":\"source\"}]&orderby=vessel_name&" + params[0].name + "=" + params[0].value;
	                //return Request.fetchRequest('/Plugins/AIS/SearchShip.ashx', request, 'POST');
	                return fetch(document.location.protocol + window.serverBase.replace(/^https?:/, '') + 'Plugins/AIS/SearchShip.ashx', {
	                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
	                    method: 'POST',
	                    mode: 'cors',
	                    body: encodeURI(request)
	                });
	            },
	            parser: function parser(response) {
	                //console.log(response)               
	                if (response.Status && response.Status.toLowerCase() == 'ok' && response.Result) {
	                    var columns = response.Result.columns,
	                        values = response.Result.values;
	                    return values.map(function (v) {
	                        var rv = {};
	                        columns.forEach(function (c, i) {
	                            rv[c] = v[i];
	                        });
	                        return rv;
	                    });
	                } else {
	                    console.log(response);
	                    return [];
	                }
	            }
	        },
	        callback: function (v) {
	            //console.log(v)               
	            if (v) {
	                if (!_this.vessel || _this.vessel.mmsi != v.mmsi || !_this.frame.find('.ais_positions_date:not(.header)')[0]) {
	                    _this.vessel = v;
	                    _this.show();
	                }
	            } else {
	                _clean.call(_this);
	                if (_displayedOnly.length) _this.frame.find('.time .only_this  input[type="checkbox"]').click();
	                _this.vessel = null;
	            }
	        }.bind(this)
	    });
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
	    this.showTrack();
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
	
	DbSearchView.prototype.repaint = function () {
	    var _this2 = this;
	
	    _clean.call(this);
	    BaseView.prototype.repaint.call(this);
	
	    if (this.model.data.msg) this.frame.find('.ais_positions_date.header').hide();
	
	    // console.log("REPAINT") 
	    _tools.clearMyFleetMarkers();
	    _displayedOnly.length = 0;
	    if (this.frame.find('.time .only_this  input[type="checkbox"]')[0].checked) {
	        _displayedOnly.push(this.model.data.vessels[0].positions[0].mmsi.toString());
	    }
	    _tools.showVesselsOnMap(_viewState);
	
	    var openPos = this.frame.find('.open_positions'),
	        infoDialog = this.infoDialogView,
	        thisVessel = this.vessel,
	        showInfoDialog = function showInfoDialog(position) {
	        position.vessel_name = thisVessel.vessel_name;
	        position.latitude = position.ymax;
	        position.longitude = position.xmax;
	        position.source = position.source_orig;
	        infoDialog.show(position, false);
	    };
	    openPos.each(function (ind, elm) {
	        $(elm).click(function (e) {
	            var icon = $(e.target),
	                vi_cont = _this2.frame.find('#voyage_info' + ind);
	            if (icon.is('.icon-down-open')) {
	                icon.removeClass('icon-down-open').addClass('.icon-right-open');
	                vi_cont.find('.ais_positions td[class!="more"]').off('click');
	                vi_cont.empty();
	            } else {
	                icon.addClass('icon-down-open').removeClass('.icon-right-open');
	                vi_cont.html(Handlebars.compile(_vi_template)(_this2.model.data.vessels[ind]));
	                if (_this2.frame.find('.time .local').is('.on')) {
	                    vi_cont.find('.utc_time').hide();
	                    vi_cont.find('.local_time').show();
	                    vi_cont.find('.utc_date').hide();
	                    vi_cont.find('.local_date').show();
	                }
	                //switchLegendIcons();
	                _switchLegendIcon.call(_this2, _tools.needAltLegend);
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
	                vi_cont.find('.ais_positions .show_info').click(function (e) {
	                    var i = e.currentTarget.id.replace(/show_info/, ""),
	                        position = _this2.model.data.vessels[ind].positions[i];
	                    position.vessel_name = thisVessel.vessel_name;
	                    position.latitude = position.ymax;
	                    position.longitude = position.xmax;
	                    position.source = position.source_orig;
	                    infoDialog.show(position, false);
	                    e.stopPropagation();
	                }.bind(_this2));
	                vi_cont.find('.ais_positions .show_pos').click(function (e) {
	                    //showPosition
	                    var i = e.currentTarget.id.replace(/show_pos/, ""),
	                        position = _this2.model.data.vessels[ind].positions[parseInt(i)];
	                    _this2.positionMap(position, _this2.calendar.getDateInterval());
	
	                    _this2.frame.find('.track:not(.all) input')[ind].checked = true;
	                    allTracksInput[0].checked = _this2.frame.find('.track:not(.all) input:checked').length == _this2.model.data.vessels.length;
	
	                    var v = _this2.model.data.vessels[ind],
	                        nv = _this2.model.data.vessels[ind + 1];
	                    _this2.showTrack([{
	                        mmsi: v.positions[0].mmsi, imo: v.positions[0].imo, ts: v.positions[0].ts_pos_org,
	                        positions: v.positions,
	                        end: nv && nv.positions ? nv.positions[0] : null
	                    }], function (_ref) {
	                        var p = _ref.p;
	                        return showInfoDialog(p);
	                    });
	
	                    e.stopPropagation();
	                }.bind(_this2));
	            }
	        }.bind(_this2));
	    });
	
	    var allTracksInput = this.frame.find('.ais_positions_date .track.all input[type="checkbox"]'),
	        tracksInputs = this.frame.find('.ais_positions_date .track:not(.all) input[type="checkbox"]');
	    //   ,setMapCalendar = function(calendar){
	    //       let calendarInterval = calendar.getDateInterval(),
	    //           interval = { dateBegin: calendarInterval.get("dateBegin"), dateEnd: calendarInterval.get("dateEnd") };
	    //       nsGmx.widgets.commonCalendar.setDateInterval(interval.dateBegin, interval.dateEnd);              
	    //   };
	    allTracksInput.click(function (e) {
	        //setMapCalendar(this.calendar);
	        _this2.frame.find('.ais_positions_date .track:not(.all) input').each(function (i, el) {
	            el.checked = e.target.checked;
	        });
	
	        var vessels = [],
	            dv = _this2.model.data.vessels;
	        dv.forEach(function (v, i) {
	            var nv = dv[i + 1];
	            vessels.push({
	                mmsi: v.positions[0].mmsi, imo: v.positions[0].imo, ts: v.positions[0].ts_pos_org, lastPos: v.lastPos,
	                positions: e.target.checked ? v.positions : [],
	                end: nv && nv.positions ? nv.positions[0] : null
	            });
	        });
	        _this2.showTrack(vessels, function (_ref2) {
	            var p = _ref2.p;
	            return showInfoDialog(p);
	        });
	    }.bind(this));
	    tracksInputs.each(function (i, el) {
	        var vessels = _this2.model.data.vessels,
	            v = vessels[i],
	            nv = vessels[i + 1];
	        el.addEventListener('click', function (e) {
	
	            //setMapCalendar(this.calendar);
	            allTracksInput[0].checked = _this2.frame.find('.ais_positions_date .track:not(.all) input:checked').length == vessels.length;
	
	            _this2.showTrack([{
	                mmsi: v.positions[0].mmsi, imo: v.positions[0].imo, ts: v.positions[0].ts_pos_org, lastPos: v.lastPos,
	                positions: e.target.checked ? v.positions : [],
	                end: nv && nv.positions ? nv.positions[0] : null
	            }], function (_ref3) {
	                var p = _ref3.p;
	                return showInfoDialog(p);
	            });
	        }.bind(_this2));
	    }.bind(this));
	
	    if (this.model.data.vessels.length == 1) openPos.eq(0).click();
	
	    //if (this.withTrack){
	    tracksInputs.eq(0).click();
	    //    this.withTrack = false;
	    //}
	
	    if (this.vessel.lastPosition) {
	        this.positionMap(this.vessel, this.calendar.getDateInterval());
	        this.vessel.lastPosition = false;
	    }
	
	    var intervalEnd = this.model.data.vessels.length;
	    if (intervalEnd) {
	        var lastDate = new Date(this.model.data.vessels[intervalEnd - 1].positions[0].ts_pos_org * 1000),
	            di = this.calendar.getDateInterval(),
	            calendarlastDate = di.get('dateBegin');
	        lastDate.setUTCHours(0, 0, 0, 0);
	        //console.log(this.model.historyInterval)   
	        if (calendarlastDate.getTime() < lastDate.getTime()) {
	            di.set('dateBegin', lastDate);
	            this.model.historyInterval.dateBegin = lastDate;
	            //console.log(lastDate, calendarlastDate)  
	            //console.log(this.model.historyInterval) 
	        }
	    }
	};
	
	Object.defineProperty(DbSearchView.prototype, "vessel", {
	    get: function get() {
	        return this.model.vessel;
	    },
	    set: function set(v) {
	        this.model.vessel = v;
	        if (!v) return;
	
	        this.searchInput.searchString = v.vessel_name;
	        var positionDate = nsGmx.DateInterval.getUTCDayBoundary(new Date(v.ts_pos_org * 1000));
	        var checkInterval = this.calendar.getDateInterval();
	        if (positionDate.dateBegin < checkInterval.get('dateBegin') || checkInterval.get('dateEnd') < positionDate.dateEnd) {
	            this.calendar.getDateInterval().set('dateBegin', positionDate.dateBegin);
	            this.calendar.getDateInterval().set('dateEnd', positionDate.dateEnd);
	            this.model.historyInterval = { dateBegin: positionDate.dateBegin, dateEnd: positionDate.dateEnd };
	        } else this.model.historyInterval = { dateBegin: checkInterval.get('dateBegin'), dateEnd: checkInterval.get('dateEnd') };
	        this.model.isDirty = true;
	    }
	});
	
	DbSearchView.prototype.show = function () {
	    BaseView.prototype.show.call(this);
	    this.searchInput.focus();
	    _tools.showVesselsOnMap(_viewState);
	};
	
	DbSearchView.prototype.hide = function () {
	    if (!this.isActive) return;
	
	    BaseView.prototype.hide.call(this);
	    _tools.cleanMap(_viewState);
	};
	
	DbSearchView.prototype.showTrack = function (vessels, onclick) {
	
	    _displayed = _tools.showHistoryTrack(vessels, onclick);
	
	    if (!vessels || !Array.isArray(vessels)) return;
	
	    vessels.forEach(function (vessel) {
	        var dlg = $('.ui-dialog:contains("' + vessel.mmsi + '")');
	        $('.showtrack').attr('title', _gtxt('AISSearch2.show_track')).removeClass('ais active');
	        if (dlg[0]) dlg.find('.showtrack').attr('title', _gtxt('AISSearch2.hide_track')).addClass('ais active');
	    });
	};
	
	DbSearchView.prototype.positionMap = function (vessel, interval) {
	    //console.log("positionMap")
	    if (interval) nsGmx.widgets.commonCalendar.setDateInterval(interval.get("dateBegin"), interval.get("dateEnd"));
	
	    if (!vessel.xmax && !vessel.longitude && !vessel.ymax && !vessel.latitude) {
	        vessel.longitude = this.model.data.vessels[0].positions[0].xmax;
	        vessel.latitude = this.model.data.vessels[0].positions[0].ymax;
	        //console.log(vessel);
	        //console.log(this.model.data.vessels[0].positions[0]);
	    }
	
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
	
	DbSearchView.prototype.formatDate = function (d, local) {
	    return _tools.formatDate(d, local);
	};
	
	DbSearchView.prototype.formatPosition = function (obj, searcher) {
	    return _tools.formatPosition(obj, searcher);
	};
	
	module.exports = DbSearchView;

/***/ }),
/* 18 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 19 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 20 */
/***/ (function(module, exports) {

	'use strict';
	
	var _searchString = "",
	    _sparams = 'imo name mmsi';
	
	_translationsHash.addtext('rus', { 'AISSearchControl.placeholder': 'Поиск' });
	_translationsHash.addtext('eng', { 'AISSearchControl.placeholder': 'Search' });
	
	var SearchControl = function SearchControl(_ref) {
	    var tab = _ref.tab,
	        container = _ref.container,
	        callback = _ref.callback,
	        searchparams = _ref.searchparams,
	        searcher = _ref.searcher;
	
	
	    container.innerHTML = '<div class="filter"><input type="text" placeholder="' + _gtxt("AISSearchControl.placeholder") + '"/>' + (!searchparams ? '' : '<div class="preferences"></div>') + '<div class="searchremove"><img class="search" src="plugins/AIS/AISSearch/svg/search.svg">' + '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg"></div>' + '</div>';
	    var suggestions = tab.appendChild(document.createElement('div'));
	    suggestions.classList.add("suggestions");
	    suggestions.innerHTML = '<div class="suggestion">SOME VESSEL<br><span>mmsi:0, imo:0</span></div>';
	
	    this.frame = { find: function find(q) {
	            return container.querySelector(q);
	        } };
	
	    var preferences = false;
	    if (searchparams) {
	        _sparams = localStorage.getItem(searchparams);
	        preferences = tab.appendChild(document.createElement('div'));
	        preferences.classList.add("preferences");
	        preferences.innerHTML = '<div class="section">Поиск по:</div>' + '<div class="line"><div class="checkbox imo disabled"></div><div class="label">IMO<label></div></div>' + '<div class="line"><div class="checkbox mmsi"></div><div class="label">MMSI<label></div></div>' + '<div class="line"><div class="checkbox name disabled"></div><div class="label">названию</div></div>' + '<div class="line"><div class="checkbox callsign"></div><div class="label">позывному<label></div></div>' + '<div class="line"><div class="checkbox owner"></div><div class="label">собственнику<label></div></div>';
	        !_sparams && (_sparams = 'imo name mmsi');
	        if (_sparams.search(/imo/) < 0) _sparams += ' imo';
	        if (_sparams.search(/name/) < 0) _sparams += ' name';
	        var asparams = _sparams.split(' ');
	        asparams.forEach(function (p, i) {
	            preferences.querySelector('.' + p).classList.add('checked');
	        });
	    } else {
	        var sr = this.frame.find('.filter .searchremove');
	        sr.style.borderRight = 'none';
	        sr.style.paddingRight = 0;
	        this.frame.find('.filter input').style.width = '85%';
	    }
	
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
	        var requests = [];
	        // _sparams.split(' ').forEach(sp=>{       
	        //     requests.push(fetch("//kosmosnimki.ru/demo/lloyds/api/v1/Ship/Search/" + sp + "/" + _searchString));
	        // });
	        requests.push(new searcher.searchPromise([{ name: 'query', value: [_searchString] }]));
	        Promise.all(requests).then(function (a) {
	            //console.log(a)
	            return Promise.all(a.map(function (r) {
	                if (r.status != 200) {
	                    console.log(r);
	                    return [];
	                } else return r.json();
	            }));
	        }).then(function (a) {
	            //console.log(actualId+" "+delay)
	            if (actualId == delay) {
	                found = { values: [] };
	                a.forEach(function (r) {
	                    found.values = found.values.concat(searcher.parser(r));
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
	        suggestions.style.display = 'none';
	    });
	    if (preferences) {
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
	                    localStorage.setItem(searchparams, _sparams);
	                    //console.log(_sparams)
	                }
	                e.stopPropagation();
	            };
	        });
	    }
	
	    removeBut.onclick = function (e) {
	        _searchString = '';
	        callback(null);
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
	
	    Object.defineProperty(this, "searchString", {
	        set: function set(v) {
	            prepareSearchInput(v, 13);
	            this.searchInput.value = v;
	        }
	    });
	};
	
	SearchControl.prototype.focus = function () {
	    this.searchInput.focus();
	};
	
	module.exports = SearchControl;

/***/ }),
/* 21 */
/***/ (function(module, exports) {

	'use strict';
	
	module.exports = function (aisLayerSearcher) {
	    var _actualUpdate = void 0;
	    return {
	        searcher: aisLayerSearcher,
	        filterString: "",
	        isDirty: false,
	        load: function load(actualUpdate) {
	            if (!this.isDirty) return Promise.resolve();
	
	            var _this = this;
	            return new Promise(function (resolve) {
	                aisLayerSearcher.searchPositionsAgg2(_this.vessel.mmsi, _this.historyInterval, function (response) {
	                    //console.log(response)       
	                    if (parseResponse(response)) {
	                        var position = void 0,
	                            positions = [],
	                            previous = void 0,
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
	                                p[d].positions.push(_this.view.formatPosition(obj, aisLayerSearcher));
	                                p[d].count = p[d].count + 1;
	                            } else {
	                                p[d] = { ts_pos_utc: _this.view.formatDate(d), positions: [_this.view.formatPosition(obj, aisLayerSearcher)], count: 1 };
	                                if (previous) // todo check date diff!!
	                                    previous.lastPos = { xmax: p[d].positions[0].xmax, ymax: p[d].positions[0].ymax };
	                            }
	                            previous = p[d];
	                            return p;
	                        }, {});
	                        //console.log(groups)       
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
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var displayInfoDialog = __webpack_require__(23),
	    Polyfill = __webpack_require__(16),
	    VesselInfoScreen = __webpack_require__(28);
	
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
	
	        aisView.vessel = vessel;
	        if (aisView.tab) if (aisView.tab.is('.active')) aisView.show();else aisView.tab.click();
	        aisView.showTrack(track);
	
	        window.iconSidebarWidget.open(menuId);
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
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(24);
	var SpecialFloatView = __webpack_require__(25);
	
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
			myFleetModel.changeMembers(vessel, myFleetView.infoDialogView).then(function () {
				add = myFleetModel.findIndex(vessel) < 0;
				var info = $('.icon-ship[vessel="' + vessel.mmsi + ' ' + vessel.imo + '"]');
				info.css('visibility', !add ? 'visible' : 'hidden');
				$('.vessel_prop.vname svg', canvas).css('visibility', add ? 'hidden' : 'visible');
	
				addremove.attr('title', add ? _gtxt('AISSearch2.myFleetInclude') : _gtxt('AISSearch2.myFleetExclude')).html(addremoveIcon(add));
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
/* 24 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(26);
	var _cssClassName = "special";
	var BaseFloatView = __webpack_require__(27);
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
/* 26 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 27 */
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
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(29);
	
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
/* 29 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 30 */
/***/ (function(module, exports) {

	"use strict";
	
	module.exports = function (options) {
	    var _baseUrl = document.location.href.replace(/^(https?:).+/, "$1") + (window.serverBase.replace(/^https?:/, "") || '//maps.kosmosnimki.ru/'),
	        _aisServices = _baseUrl + "Plugins/AIS/",
	        _serverScript = _baseUrl + 'VectorLayer/Search.ashx',
	        _aisLastPoint = options.aisLastPoint,
	        _screenSearchLayer = options.screenSearchLayer,
	        _aisLayerID = options.aisLayerID,
	        _historyLayer = options.historyLayer,
	        _lastPointLayerAlt = options.lastPointLayerAlt,
	        _vesselLegend = options.vesselLegend;
	
	
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
	            var protocol = document.location.protocol,
	                icon = void 0;
	            // speed icon
	            icon = _vesselLegend.getIconAlt("vessel.vessel_name", vessel.sog);
	            if (icon) {
	                vessel.iconAlt = protocol + icon.url;
	                vessel.imgAlt = icon.img;
	                vessel.colorAlt = icon.color;
	            }
	            // type icon
	            icon = _vesselLegend.getIcon(vessel.vessel_type, vessel.sog);
	            if (icon) {
	                vessel.icon = protocol + icon.url;
	                vessel.img = icon.img;
	                vessel.color = icon.color;
	            }
	        },
	        searchPositionsAgg2: function searchPositionsAgg2(mmsi, dateInterval, callback) {
	            fetch(_baseUrl + "plugins/AIS/SearchPositionsAsync.ashx?layer=" + _historyLayer + "&mmsi=" + mmsi + "&s=" + dateInterval.dateBegin.toISOString() + "&e=" + dateInterval.dateEnd.toISOString(), {
	                method: 'POST', // *GET, POST, PUT, DELETE, etc.
	                mode: 'cors', // no-cors, cors, *same-origin
	                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
	                credentials: 'include' // include, *same-origin, omit
	            }).then(function (response) {
	                return response.json();
	            }).then(callback);
	        },
	        searchPositionsAgg2Mf: function searchPositionsAgg2Mf(mmsi, dateInterval, callback) {
	            fetch(_baseUrl + "plugins/AIS/SearchMfPositionsAsync.ashx?layer=" + _historyLayer + "&mmsi=" + mmsi + "&s=" + dateInterval.dateBegin.toISOString() + "&e=" + dateInterval.dateEnd.toISOString(), {
	                method: 'POST', // *GET, POST, PUT, DELETE, etc.
	                mode: 'cors', // no-cors, cors, *same-origin
	                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
	                credentials: 'include' // include, *same-origin, omit
	            }).then(function (response) {
	                return response.json();
	            }).then(callback);
	        },
	        searchPositionsAgg: function searchPositionsAgg(vessels, dateInterval, callback) {
	            //console.log(dateInterval);
	            var request = {
	                WrapStyle: 'window',
	                layer: _historyLayer, //'8EE2C7996800458AAF70BABB43321FA4',//
	                orderdirection: 'desc',
	                orderby: 'ts_pos_utc',
	                columns: '[{"Value":"mmsi"},{"Value":"imo"},{"Value":"flag_country"},{"Value":"callsign"},{"Value":"ts_pos_utc"},{"Value":"cog"},{"Value":"sog"},{"Value":"draught"},{"Value":"vessel_type"},' + '{"Value":"destination"},{"Value":"ts_eta"},{"Value":"nav_status"},{"Value":"heading"},{"Value":"rot"},{"Value":"longitude"},{"Value":"latitude"},{"Value":"source"}]',
	
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
	                columns: "[{\"Value\":\"id\"},\n                        {\"Value\":\"vessel_name\"},\n                        {\"Value\":\"mmsi\"},\n                        {\"Value\":\"imo\"},\n                        {\"Value\":\"flag_country\"},\n                        {\"Value\":\"callsign\"},\n                        {\"Value\":\"ts_pos_utc\"},\n                        {\"Value\":\"cog\"},\n                        {\"Value\":\"sog\"},\n                        {\"Value\":\"draught\"},\n                        {\"Value\":\"vessel_type\"},\n                        {\"Value\":\"destination\"},\n                        {\"Value\":\"ts_eta\"},\n                        {\"Value\":\"nav_status\"},\n                        {\"Value\":\"heading\"},\n                        {\"Value\":\"rot\"},\n                        {\"Value\":\"longitude\"},\n                        {\"Value\":\"latitude\"},\n                        {\"Value\":\"source\"}]",
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
	            L.gmxUtil.sendCrossDomainPostRequest(_aisServices + "searchship.ashx", request, callback);
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
	            // let queryParams = { WrapStyle: 'window', minx: min.x, miny: min.y, maxx: max.x, maxy: max.y, layer: _screenSearchLayer },
	            // dateInterval = nsGmx.widgets.commonCalendar.getDateInterval();
	            // queryParams.s = options.dateInterval.get('dateBegin').toJSON(),
	            // queryParams.e = options.dateInterval.get('dateEnd').toJSON();
	            //console.log(queryParams);
	            //L.gmxUtil.sendCrossDomainPostRequest(_aisServices + "SearchScreenAsync.ashx",
	            // L.gmxUtil.sendCrossDomainPostRequest(_aisServices + "SearchScreen.ashx",
	            //     queryParams,
	            //     callback);
	            fetch(_aisServices + ("SearchScreenAsync.ashx?" + (options.filter ? 'f=' + options.filter + '&' : '') + "minx=" + min.x + "&miny=" + min.y + "&maxx=" + max.x + "&maxy=" + max.y + "&layer=" + _screenSearchLayer + "\n&s=" + options.dateInterval.get('dateBegin').toJSON() + "&e=" + options.dateInterval.get('dateEnd').toJSON()), {
	                method: 'GET',
	                mode: 'cors',
	                cache: 'no-cache',
	                credentials: 'include'
	            }).then(function (response) {
	                return response.json();
	            }).then(callback);
	        }
	    };
	};

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var SvgParser = __webpack_require__(32);
	
	var LegendControl = function LegendControl(tools, aisLastPointLayer, lastPointLayerAlt) {
	    var _layersByID = nsGmx.gmxMap.layersByID,
	        _layers = [_layersByID[aisLastPointLayer], _layersByID[lastPointLayerAlt]],
	        _getIcons = function _getIcons() {
	        _layers[0] && _layers[0]._gmx.properties.gmxStyles.styles.forEach(function (s) {
	            var icon = {
	                "filter": s.Filter,
	                "url": s.RenderStyle.iconUrl.replace(/^https?:/, "").replace(/^\/\/kosmosnimki.ru/, "//www.kosmosnimki.ru"), "name": s.Name,
	                "img": new Image(),
	                "typeColor": {}
	            };
	            _icons.push(icon);
	            _iconsDict[icon.filter] = { url: icon.url, name: icon.name, img: icon.img, color: icon.typeColor };
	        });
	        _layers[1] && _layers[1]._gmx.properties.gmxStyles.styles.forEach(function (s) {
	            var icon = {
	                "filter": s.Filter.replace(/([^<>=])=([^=])/g, "$1==$2").replace(/ *not ((.(?!( and | or |$)))+.)/ig, " !($1)").replace(/ or /ig, " || ").replace(/ and /ig, " && "),
	                "url": s.RenderStyle.iconUrl.replace(/^https?:/, "").replace(/^\/\/kosmosnimki.ru/, "//www.kosmosnimki.ru"), "name": s.Name,
	                "img": new Image(),
	                "typeColor": {}
	            };
	            _iconsAlt.push(icon);
	            _iconsAltDict[icon.filter] = { url: icon.url, name: icon.name, img: icon.img, color: icon.typeColor };
	        });
	        // console.log(_icons);
	        // console.log(_iconsAlt);
	    },
	        _getSvgPromise = function _getSvgPromise(ic) {
	        return new Promise(function (resolve) {
	            var httpRequest = new XMLHttpRequest();
	            httpRequest.onreadystatechange = function () {
	                if (httpRequest.readyState === 4) {
	                    ic.svg = httpRequest.responseText;
	                    var a = /\.cls-1{fill:(#[^};]+)/.exec(ic.svg);
	                    ic.color = '#888';
	                    if (a && a.length) ic.color = a[1];
	
	                    ic.typeColor.value = ic.color;
	
	                    var svg = httpRequest.responseText;
	                    var canvas = document.createElement("canvas");
	                    if (canvas.msToBlob) {
	                        document.body.appendChild(canvas);
	                        canvas.width = 21;
	                        canvas.height = 21;
	                        SvgParser.canvg(canvas, svg);
	                        ic.img.src = canvas.toDataURL("image/png");
	                        document.body.removeChild(canvas);
	                        resolve();
	                        //console.log('CANVG')
	                    } else {
	
	                        var svg64 = btoa(unescape(encodeURIComponent(svg)));
	                        var b64Start = 'data:image/svg+xml;base64,';
	                        var image64 = b64Start + svg64;
	                        var imgSvg = new Image();
	                        imgSvg.src = image64;
	                        //console.log(imgSvg)
	                        imgSvg.onload = function () {
	                            var canvas = document.createElement("canvas");
	                            document.body.appendChild(canvas);
	                            canvas.width = imgSvg.width;
	                            canvas.height = imgSvg.height;
	                            var ctx = canvas.getContext("2d");
	                            ctx.clearRect(0, 0, canvas.width, canvas.height);
	                            ctx.drawImage(imgSvg, 0, 0);
	                            ic.img.src = canvas.toDataURL("image/png");
	                            //ic.img.onload = function(){
	                            //console.log(ic.img)
	                            document.body.removeChild(canvas);
	
	                            resolve();
	                            //}
	                        };
	                    }
	                }
	            };
	            httpRequest.open("GET", document.location.protocol + ic.url.replace(/^https?:/, ""));
	            httpRequest.send();
	        });
	    };
	
	    var _icons = [],
	        _iconsAlt = [],
	        _iconsDict = {},
	        _iconsAltDict = {};
	    _getIcons();
	
	    var _svgLoader = Promise.all(_icons.map(_getSvgPromise)),
	        _svgAltLoader = Promise.all(_iconsAlt.map(_getSvgPromise)),
	        _createSwitch = function _createSwitch(container) {
	        var div = document.createElement('div');
	        div.innerHTML = '<table class="ais_legend_switch">' + '<tr><td class="legend" colspan="2"><span class="label">' + _gtxt("AISSearch2.legend_switch") + ':</span>' + '<span class="type unselectable on" unselectable="on">' + _gtxt("AISSearch2.legend_type") + '</span>' + '<span class="speed unselectable" unselectable="on">' + _gtxt("AISSearch2.legend_speed") + '</span></td>' + '<td class="show_info">' + '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><g><circle style="fill:white" cx="12" cy="12" r="8"></circle><path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z" style="fill:#48aff1"></path></g></svg>' + '</td></tr>' + '</table>';
	        container.footer = div;
	        var lswitchClick = function lswitchClick(e) {
	            var cl = e.target.classList;
	            if (!cl.contains('on')) {
	                tools.switchLegend(cl.contains('speed'));
	                container.footer.querySelector('span.on').classList.remove('on');
	                cl.add('on');
	                if (legendDiv) {
	                    legendDiv.remove();
	                    legendDiv = null;
	                    container.footer.querySelector('td.show_info').click();
	                }
	            }
	        };
	        container.footer.querySelector('span.speed').addEventListener('click', lswitchClick);
	        container.footer.querySelector('span.type').addEventListener('click', lswitchClick);
	        var legendDiv = void 0;
	        container.footer.querySelector('td.show_info').addEventListener('click', function () {
	            if (legendDiv) {
	                legendDiv.remove();
	                legendDiv = null;
	                return;
	            }
	            legendDiv = document.createElement('div');
	            legendDiv.className = 'ais_legend_info';
	
	            var loader = !tools.needAltLegend ? _svgLoader : _svgAltLoader,
	                iconCollection = !tools.needAltLegend ? _icons : _iconsAlt;
	            loader.then(function (r) {
	                //console.log(r);
	                var template = !tools.needAltLegend ? '<table class="colors">' : '<table class="movement_colors">';
	                iconCollection.forEach(function (ic, i) {
	                    if (ic.name.search(/\S/) != -1) {
	                        // let a = /\.cls-1{fill:(#[^};]+)/.exec(ic.svg);
	                        // ic.color = '#fff';
	                        // if (a && a.length)
	                        //     ic.color = a[1];
	                        if (!tools.needAltLegend) template += '<tr><td class="color"><div style="width:10px; height:10px; background-color:' + ic.color + '"></div></td><td>' + ic.name + '</td></tr>';else {
	                            var svg = i == iconCollection.length - 1 ? '<div style="padding-top:2px">' + _getAtAnchorIcon(0, ic.color, '#fff') + '</div>' : _getUnderWayIcon(0, ic.color, '#fff');
	                            template += '<tr><td class="color">' + svg + '</td><td>' + ic.name + '</td></tr>';
	                        }
	                    }
	                });
	                if (!tools.needAltLegend) {
	                    template += '<tr><td colspan="2" style="padding: 8px 10px 0;"><div style="border-bottom: solid 1px #e1e8ed;width: 100%;"></div></td></tr>';
	                    template += '</table><table class="movement"><tr><td>' + _getUnderWayIcon(0, '#888', '#fff') + '</td><td>' + _gtxt("AISSearch2.moving") + '</td>' + '<td style="padding-top:10px">' + _getAtAnchorIcon(0, '#888', '#fff') + '</td><td>' + _gtxt("AISSearch2.standing") + '</td></tr></table>';
	                }
	                //console.log(template)
	                legendDiv.innerHTML = template;
	                document.body.append(legendDiv);
	                var rc = legendDiv.getClientRects()[0];
	                legendDiv.style.left = window.innerWidth - rc.width - 20 + 'px';
	                legendDiv.style.top = window.innerHeight - rc.height - 40 + 'px';
	            });
	        });
	        if (tools.needAltLegend) container.footer.querySelector('span.speed').click();
	    };
	
	    var _getUnderWayIcon = function _getUnderWayIcon(cog, type_color, group_style) {
	        return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!cog ? 0 : cog) + 'deg)"><title>1</title><path style="fill:' + type_color + ';" d="M13.8,20.07a1,1,0,0,1-.69-0.28l-1.79-1.72a0.72,0.72,0,0,0-1,0L8.52,19.79a1,1,0,0,1-.69.28,1,1,0,0,1-1-1V8.65c0-1.52,1.55-7.59,4-7.59s4,6.07,4,7.59V19a1,1,0,0,1-1,1h0Z"/><path style="fill:' + group_style + ';" d="M10.82,1.57c1.93,0,3.5,5.57,3.5,7.09V19a0.52,0.52,0,0,1-.51.53,0.49,0.49,0,0,1-.34-0.14l-1.79-1.72a1.22,1.22,0,0,0-1.71,0L8.17,19.42a0.49,0.49,0,0,1-.34.14A0.52,0.52,0,0,1,7.32,19V8.65c0-1.51,1.57-7.09,3.5-7.09h0m0-1c-3,0-4.5,6.72-4.5,8.09V19a1.52,1.52,0,0,0,1.51,1.53,1.49,1.49,0,0,0,1-.42l1.79-1.72a0.22,0.22,0,0,1,.32,0l1.79,1.72a1.49,1.49,0,0,0,1,.42A1.52,1.52,0,0,0,15.32,19V8.65c0-1.37-1.51-8.09-4.5-8.09h0Z"/><ellipse style="fill:#fff;" cx="10.82" cy="10.54" rx="1.31" ry="1.35"/><path style="fill:#fff;" d="M10.73,3.34h0.12a0.35,0.35,0,0,1,.35.35v6.85a0,0,0,0,1,0,0H10.38a0,0,0,0,1,0,0V3.69A0.35,0.35,0,0,1,10.73,3.34Z"/></svg>';
	    },
	        _getAtAnchorIcon = function _getAtAnchorIcon(cog, type_color, group_style) {
	        return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!cog ? 0 : cog) + 'deg)"><title>1</title><rect style="fill:' + type_color + ';stroke:' + group_style + ';stroke-miterlimit:10;" x="5.9" y="5.6" width="9.19" height="9.19" rx="2" ry="2" transform="translate(-4.13 10.41) rotate(-45)"/><circle style="fill:#fff;" cx="10.5" cy="10.19" r="1.5"/></svg>';
	    };
	    return {
	        getUnderWayIcon: _getUnderWayIcon,
	        getAtAnchorIcon: _getAtAnchorIcon,
	        createSwitch: _createSwitch,
	        get icons() {
	            return _icons;
	        },
	        get iconsAlt() {
	            return _iconsAlt;
	        },
	        //get iconsDict(){return _iconsDict;},
	        //get iconsAltDict(){return _iconsAltDict;},
	        getIconAlt: function getIconAlt(vessel_name, sog) {
	            // speed icon
	            for (var f in _iconsAltDict) {
	                var cond = f.replace(/"sog"/ig, sog);
	                if (vessel_name) cond = cond.replace(/"vessel_name"/ig, "'" + vessel_name.replace(/'/g, "\\\'").replace(/\\[^']/g, "\\\\") + "'");
	                //console.log(cond + " " + "eval(cond)")
	                if (eval(cond)) return _iconsAltDict[f];
	            }
	        },
	        getIcon: function getIcon(vessel_type, sog) {
	            for (var f in _iconsDict) {
	                var re1 = new RegExp("'" + vessel_type + "'"),
	                    re2 = new RegExp(sog != 0 ? ">0" : "=0");
	                //console.log(vessel_type+" "+sog+" "+f+" "+f.search(re1)+" "+f.search(re2))
	                if (f.search(re1) != -1 && f.search(re2) != -1) {
	                    //console.log( _iconsDict[f])
	                    return _iconsDict[f];
	                }
	            }
	        },
	        getIconAltUrl: function getIconAltUrl(vessel_name, sog) {
	            var icon = this.getIconAlt(vessel_name, sog);
	            return icon && icon.url;
	        },
	        getIconUrl: function getIconUrl(vessel_type, sog) {
	            var icon = this.getIcon(vessel_type, sog);
	            return icon && icon.url;
	        }
	    };
	};
	
	module.exports = LegendControl;

/***/ }),
/* 32 */
/***/ (function(module, exports) {

	'use strict';
	
	/*
	 * based on
	 * canvg.js - Javascript SVG parser and renderer on Canvas
	 * MIT Licensed 
	 * Gabe Lerner (gabelerner@gmail.com)
	 * http://code.google.com/p/canvg/
	 *
	 * Requires: rgbcolor.js - http://www.phpied.com/rgb-color-parser-in-javascript/
	 */
	if (!window.console) {
		window.console = {};
		window.console.log = function (str) {};
		window.console.dir = function (str) {};
	}
	
	// <3 IE
	if (!Array.indexOf) {
		Array.prototype.indexOf = function (obj) {
			for (var i = 0; i < this.length; i++) {
				if (this[i] == obj) {
					return i;
				}
			}
			return -1;
		};
	}
	
	var _parser = {},
	    cvd = { logCommand: function logCommand() {} };
	
	(function () {
		// canvg(target, s)
		// target: canvas element or the id of a canvas element
		// s: svg string or url to svg file
		// opts: optional hash of options
		//		 ignoreMouse: true => ignore mouse events
		//		 ignoreAnimation: true => ignore animations
		//		 ignoreDimensions: true => does not try to resize canvas
		//		 ignoreClear: true => does not clear canvas
		//		 offsetX: int => draws at a x offset
		//		 offsetY: int => draws at a y offset
		//		 scaleWidth: int => scales horizontally to width
		//		 scaleHeight: int => scales vertically to height
		//		 renderCallback: function => will call the function after the first render is completed
		//		 forceRedraw: function => will call the function on every frame, if it returns true, will redraw
		_parser.canvg = function (target, s, opts) {
			if (typeof target == 'string') {
				target = document.getElementById(target);
			}
	
			// reuse class per canvas
			var svg;
			if (target.svg == null) {
				svg = build();
				target.svg = svg;
			} else {
				svg = target.svg;
				svg.stop();
			}
			svg.opts = opts;
	
			var ctx = target.getContext('2d');
			if (s.substr(0, 1) == '<') {
				// load from xml string
				svg.loadXml(ctx, s);
			} else {
				// load from url
				svg.load(ctx, s);
			}
		};
	
		function build() {
			var svg = {};
	
			svg.FRAMERATE = 30;
	
			// globals
			svg.init = function (ctx) {
				svg.Definitions = {};
				svg.Styles = {};
				svg.Animations = [];
				svg.Images = [];
				svg.ctx = ctx;
				svg.ViewPort = new function () {
					this.viewPorts = [];
					this.SetCurrent = function (width, height) {
						this.viewPorts.push({ width: width, height: height });
					};
					this.RemoveCurrent = function () {
						this.viewPorts.pop();
					};
					this.Current = function () {
						return this.viewPorts[this.viewPorts.length - 1];
					};
					this.width = function () {
						return this.Current().width;
					};
					this.height = function () {
						return this.Current().height;
					};
					this.ComputeSize = function (d) {
						if (d != null && typeof d == 'number') return d;
						if (d == 'x') return this.width();
						if (d == 'y') return this.height();
						return Math.sqrt(Math.pow(this.width(), 2) + Math.pow(this.height(), 2)) / Math.sqrt(2);
					};
				}();
			};
			svg.init();
	
			// images loaded
			svg.ImagesLoaded = function () {
				for (var i = 0; i < svg.Images.length; i++) {
					if (!svg.Images[i].loaded) return false;
				}
				return true;
			};
	
			// trim
			svg.trim = function (s) {
				return s.replace(/^\s+|\s+$/g, '');
			};
	
			// compress spaces
			svg.compressSpaces = function (s) {
				return s.replace(/[\s\r\t\n]+/gm, ' ');
			};
	
			// ajax
			svg.ajax = function (url) {
				var AJAX;
				if (window.XMLHttpRequest) {
					AJAX = new XMLHttpRequest();
				} else {
					AJAX = new ActiveXObject('Microsoft.XMLHTTP');
				}
				if (AJAX) {
					AJAX.open('GET', url, false);
					AJAX.send(null);
					return AJAX.responseText;
				}
				return null;
			};
	
			// parse xml
			svg.parseXml = function (xml) {
				if (window.DOMParser) {
					var parser = new DOMParser();
					return parser.parseFromString(xml, 'text/xml');
				} else {
					xml = xml.replace(/<!DOCTYPE svg[^>]*>/, '');
					var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
					xmlDoc.async = 'false';
					xmlDoc.loadXML(xml);
					return xmlDoc;
				}
			};
	
			svg.Property = function (name, value) {
				this.name = name;
				this.value = value;
	
				this.hasValue = function () {
					return this.value != null && this.value != '';
				};
	
				// return the numerical value of the property
				this.numValue = function () {
					if (!this.hasValue()) return 0;
	
					var n = parseFloat(this.value);
					if ((this.value + '').match(/%$/)) {
						n = n / 100.0;
					}
					return n;
				};
	
				this.valueOrDefault = function (def) {
					if (this.hasValue()) return this.value;
					return def;
				};
	
				this.numValueOrDefault = function (def) {
					if (this.hasValue()) return this.numValue();
					return def;
				};
	
				/* EXTENSIONS */
				var that = this;
	
				// color extensions
				this.Color = {
					// augment the current color value with the opacity
					addOpacity: function addOpacity(opacity) {
						var newValue = that.value;
						if (opacity != null && opacity != '') {
							var color = new RGBColor(that.value);
							if (color.ok) {
								newValue = 'rgba(' + color.r + ', ' + color.g + ', ' + color.b + ', ' + opacity + ')';
							}
						}
						return new svg.Property(that.name, newValue);
					}
	
					// definition extensions
				};this.Definition = {
					// get the definition from the definitions table
					getDefinition: function getDefinition() {
						var name = that.value.replace(/^(url\()?#([^\)]+)\)?$/, '$2');
						return svg.Definitions[name];
					},
	
					isUrl: function isUrl() {
						return that.value.indexOf('url(') == 0;
					},
	
					getFillStyle: function getFillStyle(e) {
						var def = this.getDefinition();
	
						// gradient
						if (def != null && def.createGradient) {
							return def.createGradient(svg.ctx, e);
						}
	
						// pattern
						if (def != null && def.createPattern) {
							return def.createPattern(svg.ctx, e);
						}
	
						return null;
					}
	
					// length extensions
				};this.Length = {
					DPI: function DPI(viewPort) {
						return 96.0; // TODO: compute?
					},
	
					EM: function EM(viewPort) {
						var em = 12;
	
						var fontSize = new svg.Property('fontSize', svg.Font.Parse(svg.ctx.font).fontSize);
						if (fontSize.hasValue()) em = fontSize.Length.toPixels(viewPort);
	
						return em;
					},
	
					// get the length as pixels
					toPixels: function toPixels(viewPort) {
						if (!that.hasValue()) return 0;
						var s = that.value + '';
						if (s.match(/em$/)) return that.numValue() * this.EM(viewPort);
						if (s.match(/ex$/)) return that.numValue() * this.EM(viewPort) / 2.0;
						if (s.match(/px$/)) return that.numValue();
						if (s.match(/pt$/)) return that.numValue() * 1.25;
						if (s.match(/pc$/)) return that.numValue() * 15;
						if (s.match(/cm$/)) return that.numValue() * this.DPI(viewPort) / 2.54;
						if (s.match(/mm$/)) return that.numValue() * this.DPI(viewPort) / 25.4;
						if (s.match(/in$/)) return that.numValue() * this.DPI(viewPort);
						if (s.match(/%$/)) return that.numValue() * svg.ViewPort.ComputeSize(viewPort);
						return that.numValue();
					}
	
					// time extensions
				};this.Time = {
					// get the time as milliseconds
					toMilliseconds: function toMilliseconds() {
						if (!that.hasValue()) return 0;
						var s = that.value + '';
						if (s.match(/s$/)) return that.numValue() * 1000;
						if (s.match(/ms$/)) return that.numValue();
						return that.numValue();
					}
	
					// angle extensions
				};this.Angle = {
					// get the angle as radians
					toRadians: function toRadians() {
						if (!that.hasValue()) return 0;
						var s = that.value + '';
						if (s.match(/deg$/)) return that.numValue() * (Math.PI / 180.0);
						if (s.match(/grad$/)) return that.numValue() * (Math.PI / 200.0);
						if (s.match(/rad$/)) return that.numValue();
						return that.numValue() * (Math.PI / 180.0);
					}
				};
			};
	
			// fonts
			svg.Font = new function () {
				this.Styles = ['normal', 'italic', 'oblique', 'inherit'];
				this.Variants = ['normal', 'small-caps', 'inherit'];
				this.Weights = ['normal', 'bold', 'bolder', 'lighter', '100', '200', '300', '400', '500', '600', '700', '800', '900', 'inherit'];
	
				this.CreateFont = function (fontStyle, fontVariant, fontWeight, fontSize, fontFamily, inherit) {
					var f = inherit != null ? this.Parse(inherit) : this.CreateFont('', '', '', '', '', svg.ctx.font);
					return {
						fontFamily: fontFamily || f.fontFamily,
						fontSize: fontSize || f.fontSize,
						fontStyle: fontStyle || f.fontStyle,
						fontWeight: fontWeight || f.fontWeight,
						fontVariant: fontVariant || f.fontVariant,
						toString: function toString() {
							return [this.fontStyle, this.fontVariant, this.fontWeight, this.fontSize, this.fontFamily].join(' ');
						}
					};
				};
	
				var that = this;
				this.Parse = function (s) {
					var f = {};
					var d = svg.trim(svg.compressSpaces(s || '')).split(' ');
					var set = { fontSize: false, fontStyle: false, fontWeight: false, fontVariant: false };
					var ff = '';
					for (var i = 0; i < d.length; i++) {
						if (!set.fontStyle && that.Styles.indexOf(d[i]) != -1) {
							if (d[i] != 'inherit') f.fontStyle = d[i];set.fontStyle = true;
						} else if (!set.fontVariant && that.Variants.indexOf(d[i]) != -1) {
							if (d[i] != 'inherit') f.fontVariant = d[i];set.fontStyle = set.fontVariant = true;
						} else if (!set.fontWeight && that.Weights.indexOf(d[i]) != -1) {
							if (d[i] != 'inherit') f.fontWeight = d[i];set.fontStyle = set.fontVariant = set.fontWeight = true;
						} else if (!set.fontSize) {
							if (d[i] != 'inherit') f.fontSize = d[i].split('/')[0];set.fontStyle = set.fontVariant = set.fontWeight = set.fontSize = true;
						} else {
							if (d[i] != 'inherit') ff += d[i];
						}
					}if (ff != '') f.fontFamily = ff;
					return f;
				};
			}();
	
			// points and paths
			svg.ToNumberArray = function (s) {
				var a = svg.trim(svg.compressSpaces((s || '').replace(/,/g, ' '))).split(' ');
				for (var i = 0; i < a.length; i++) {
					a[i] = parseFloat(a[i]);
				}
				return a;
			};
			svg.Point = function (x, y) {
				this.x = x;
				this.y = y;
	
				this.angleTo = function (p) {
					return Math.atan2(p.y - this.y, p.x - this.x);
				};
	
				this.applyTransform = function (v) {
					var xp = this.x * v[0] + this.y * v[2] + v[4];
					var yp = this.x * v[1] + this.y * v[3] + v[5];
					this.x = xp;
					this.y = yp;
				};
			};
			svg.CreatePoint = function (s) {
				var a = svg.ToNumberArray(s);
				return new svg.Point(a[0], a[1]);
			};
			svg.CreatePath = function (s) {
				var a = svg.ToNumberArray(s);
				var path = [];
				for (var i = 0; i < a.length; i += 2) {
					path.push(new svg.Point(a[i], a[i + 1]));
				}
				return path;
			};
	
			// bounding box
			svg.BoundingBox = function (x1, y1, x2, y2) {
				// pass in initial points if you want
				this.x1 = Number.NaN;
				this.y1 = Number.NaN;
				this.x2 = Number.NaN;
				this.y2 = Number.NaN;
	
				this.x = function () {
					return this.x1;
				};
				this.y = function () {
					return this.y1;
				};
				this.width = function () {
					return this.x2 - this.x1;
				};
				this.height = function () {
					return this.y2 - this.y1;
				};
	
				this.addPoint = function (x, y) {
					if (x != null) {
						if (isNaN(this.x1) || isNaN(this.x2)) {
							this.x1 = x;
							this.x2 = x;
						}
						if (x < this.x1) this.x1 = x;
						if (x > this.x2) this.x2 = x;
					}
	
					if (y != null) {
						if (isNaN(this.y1) || isNaN(this.y2)) {
							this.y1 = y;
							this.y2 = y;
						}
						if (y < this.y1) this.y1 = y;
						if (y > this.y2) this.y2 = y;
					}
				};
				this.addX = function (x) {
					this.addPoint(x, null);
				};
				this.addY = function (y) {
					this.addPoint(null, y);
				};
	
				this.addQuadraticCurve = function (p0x, p0y, p1x, p1y, p2x, p2y) {
					var cp1x = p0x + 2 / 3 * (p1x - p0x); // CP1 = QP0 + 2/3 *(QP1-QP0)
					var cp1y = p0y + 2 / 3 * (p1y - p0y); // CP1 = QP0 + 2/3 *(QP1-QP0)
					var cp2x = cp1x + 1 / 3 * (p2x - p0x); // CP2 = CP1 + 1/3 *(QP2-QP0)
					var cp2y = cp1y + 1 / 3 * (p2y - p0y); // CP2 = CP1 + 1/3 *(QP2-QP0)
					this.addBezierCurve(p0x, p0y, cp1x, cp2x, cp1y, cp2y, p2x, p2y);
				};
	
				this.addBezierCurve = function (p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
					// from http://blog.hackers-cafe.net/2009/06/how-to-calculate-bezier-curves-bounding.html
					var p0 = [p0x, p0y],
					    p1 = [p1x, p1y],
					    p2 = [p2x, p2y],
					    p3 = [p3x, p3y];
					this.addPoint(p0[0], p0[1]);
					this.addPoint(p3[0], p3[1]);
	
					for (var i = 0; i <= 1; i++) {
						var f = function f(t) {
							return Math.pow(1 - t, 3) * p0[i] + 3 * Math.pow(1 - t, 2) * t * p1[i] + 3 * (1 - t) * Math.pow(t, 2) * p2[i] + Math.pow(t, 3) * p3[i];
						};
	
						var b = 6 * p0[i] - 12 * p1[i] + 6 * p2[i];
						var a = -3 * p0[i] + 9 * p1[i] - 9 * p2[i] + 3 * p3[i];
						var c = 3 * p1[i] - 3 * p0[i];
	
						if (a == 0) {
							if (b == 0) continue;
							var t = -c / b;
							if (0 < t && t < 1) {
								if (i == 0) this.addX(f(t));
								if (i == 1) this.addY(f(t));
							}
							continue;
						}
	
						var b2ac = Math.pow(b, 2) - 4 * c * a;
						if (b2ac < 0) continue;
						var t1 = (-b + Math.sqrt(b2ac)) / (2 * a);
						if (0 < t1 && t1 < 1) {
							if (i == 0) this.addX(f(t1));
							if (i == 1) this.addY(f(t1));
						}
						var t2 = (-b - Math.sqrt(b2ac)) / (2 * a);
						if (0 < t2 && t2 < 1) {
							if (i == 0) this.addX(f(t2));
							if (i == 1) this.addY(f(t2));
						}
					}
				};
	
				this.isPointInBox = function (x, y) {
					return this.x1 <= x && x <= this.x2 && this.y1 <= y && y <= this.y2;
				};
	
				this.addPoint(x1, y1);
				this.addPoint(x2, y2);
			};
	
			// transforms
			svg.Transform = function (v) {
				var that = this;
				this.Type = {};
	
				// translate
				this.Type.translate = function (s) {
					this.p = svg.CreatePoint(s);
					this.apply = function (ctx) {
						ctx.translate(this.p.x || 0.0, this.p.y || 0.0);
					};
					this.applyToPoint = function (p) {
						p.applyTransform([1, 0, 0, 1, this.p.x || 0.0, this.p.y || 0.0]);
					};
				};
	
				// rotate
				this.Type.rotate = function (s) {
					var a = svg.ToNumberArray(s);
					this.angle = new svg.Property('angle', a[0]);
					this.cx = a[1] || 0;
					this.cy = a[2] || 0;
					this.apply = function (ctx) {
						ctx.translate(this.cx, this.cy);
						ctx.rotate(this.angle.Angle.toRadians());
						ctx.translate(-this.cx, -this.cy);
					};
					this.applyToPoint = function (p) {
						var a = this.angle.Angle.toRadians();
						p.applyTransform([1, 0, 0, 1, this.p.x || 0.0, this.p.y || 0.0]);
						p.applyTransform([Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0]);
						p.applyTransform([1, 0, 0, 1, -this.p.x || 0.0, -this.p.y || 0.0]);
					};
				};
	
				this.Type.scale = function (s) {
					this.p = svg.CreatePoint(s);
					this.apply = function (ctx) {
						ctx.scale(this.p.x || 1.0, this.p.y || this.p.x || 1.0);
					};
					this.applyToPoint = function (p) {
						p.applyTransform([this.p.x || 0.0, 0, 0, this.p.y || 0.0, 0, 0]);
					};
				};
	
				this.Type.matrix = function (s) {
					this.m = svg.ToNumberArray(s);
					this.apply = function (ctx) {
						ctx.transform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
					};
					this.applyToPoint = function (p) {
						p.applyTransform(this.m);
					};
				};
	
				this.Type.SkewBase = function (s) {
					this.base = that.Type.matrix;
					this.base(s);
					this.angle = new svg.Property('angle', s);
				};
				this.Type.SkewBase.prototype = new this.Type.matrix();
	
				this.Type.skewX = function (s) {
					this.base = that.Type.SkewBase;
					this.base(s);
					this.m = [1, 0, Math.tan(this.angle.Angle.toRadians()), 1, 0, 0];
				};
				this.Type.skewX.prototype = new this.Type.SkewBase();
	
				this.Type.skewY = function (s) {
					this.base = that.Type.SkewBase;
					this.base(s);
					this.m = [1, Math.tan(this.angle.Angle.toRadians()), 0, 1, 0, 0];
				};
				this.Type.skewY.prototype = new this.Type.SkewBase();
	
				this.transforms = [];
	
				this.apply = function (ctx) {
					for (var i = 0; i < this.transforms.length; i++) {
						this.transforms[i].apply(ctx);
					}
				};
	
				this.applyToPoint = function (p) {
					for (var i = 0; i < this.transforms.length; i++) {
						this.transforms[i].applyToPoint(p);
					}
				};
	
				var data = v.split(/\s(?=[a-z])/);
				for (var i = 0; i < data.length; i++) {
					var type = data[i].split('(')[0];
					var s = data[i].split('(')[1].replace(')', '');
					var transform = eval('new this.Type.' + type + '(s)');
					this.transforms.push(transform);
				}
			};
	
			// aspect ratio
			svg.AspectRatio = function (ctx, aspectRatio, width, desiredWidth, height, desiredHeight, minX, minY, refX, refY) {
				// aspect ratio - http://www.w3.org/TR/SVG/coords.html#PreserveAspectRatioAttribute
				aspectRatio = svg.compressSpaces(aspectRatio);
				aspectRatio = aspectRatio.replace(/^defer\s/, ''); // ignore defer
				var align = aspectRatio.split(' ')[0] || 'xMidYMid';
				var meetOrSlice = aspectRatio.split(' ')[1] || 'meet';
	
				// calculate scale
				var scaleX = width / desiredWidth;
				var scaleY = height / desiredHeight;
				var scaleMin = Math.min(scaleX, scaleY);
				var scaleMax = Math.max(scaleX, scaleY);
				if (meetOrSlice == 'meet') {
					desiredWidth *= scaleMin;desiredHeight *= scaleMin;
				}
				if (meetOrSlice == 'slice') {
					desiredWidth *= scaleMax;desiredHeight *= scaleMax;
				}
	
				refX = new svg.Property('refX', refX);
				refY = new svg.Property('refY', refY);
				if (refX.hasValue() && refY.hasValue()) {
					ctx.translate(-scaleMin * refX.Length.toPixels('x'), -scaleMin * refY.Length.toPixels('y'));
				} else {
					// align
					if (align.match(/^xMid/) && (meetOrSlice == 'meet' && scaleMin == scaleY || meetOrSlice == 'slice' && scaleMax == scaleY)) ctx.translate(width / 2.0 - desiredWidth / 2.0, 0);
					if (align.match(/YMid$/) && (meetOrSlice == 'meet' && scaleMin == scaleX || meetOrSlice == 'slice' && scaleMax == scaleX)) ctx.translate(0, height / 2.0 - desiredHeight / 2.0);
					if (align.match(/^xMax/) && (meetOrSlice == 'meet' && scaleMin == scaleY || meetOrSlice == 'slice' && scaleMax == scaleY)) ctx.translate(width - desiredWidth, 0);
					if (align.match(/YMax$/) && (meetOrSlice == 'meet' && scaleMin == scaleX || meetOrSlice == 'slice' && scaleMax == scaleX)) ctx.translate(0, height - desiredHeight);
				}
	
				// scale
				if (align == 'none') ctx.scale(scaleX, scaleY);else if (meetOrSlice == 'meet') ctx.scale(scaleMin, scaleMin);else if (meetOrSlice == 'slice') ctx.scale(scaleMax, scaleMax);
	
				// translate
				ctx.translate(minX == null ? 0 : -minX, minY == null ? 0 : -minY);
			};
	
			// elements
			svg.Element = {};
	
			svg.Element.ElementBase = function (node) {
				this.attributes = {};
				this.styles = {};
				this.children = [];
	
				// get or create attribute
				this.attribute = function (name, createIfNotExists) {
					var a = this.attributes[name];
					if (a != null) return a;
	
					a = new svg.Property(name, '');
					if (createIfNotExists == true) this.attributes[name] = a;
					return a;
				};
	
				// get or create style
				this.style = function (name, createIfNotExists) {
					var s = this.styles[name];
					if (s != null) return s;
	
					var a = this.attribute(name);
					if (a != null && a.hasValue()) {
						return a;
					}
	
					s = new svg.Property(name, '');
					if (createIfNotExists == true) this.styles[name] = s;
					return s;
				};
	
				// base render
				this.render = function (ctx) {
					// don't render display=none
					if (this.attribute('display').value == 'none') return;
	
					ctx.save();
					this.setContext(ctx);
					this.renderChildren(ctx);
					this.clearContext(ctx);
					ctx.restore();
				};
	
				// base set context
				this.setContext = function (ctx) {}
				// OVERRIDE ME!
	
	
				// base clear context
				;this.clearContext = function (ctx) {}
				// OVERRIDE ME!
	
	
				// base render children
				;this.renderChildren = function (ctx) {
					for (var i = 0; i < this.children.length; i++) {
						this.children[i].render(ctx);
					}
				};
	
				this.addChild = function (childNode, create) {
					var child = childNode;
					if (create) child = svg.CreateElement(childNode);
					child.parent = this;
					this.children.push(child);
				};
	
				if (node != null && node.nodeType == 1) {
					//ELEMENT_NODE
					// add children
					for (var i = 0; i < node.childNodes.length; i++) {
						var childNode = node.childNodes[i];
						if (childNode.nodeType == 1) this.addChild(childNode, true); //ELEMENT_NODE
					}
	
					// add attributes
					for (var i = 0; i < node.attributes.length; i++) {
						var attribute = node.attributes[i];
						this.attributes[attribute.nodeName] = new svg.Property(attribute.nodeName, attribute.nodeValue);
					}
	
					// add tag styles
					var styles = svg.Styles[this.type];
					if (styles != null) {
						for (var name in styles) {
							this.styles[name] = styles[name];
						}
					}
	
					// add class styles
					if (this.attribute('class').hasValue()) {
						var classes = svg.compressSpaces(this.attribute('class').value).split(' ');
						for (var j = 0; j < classes.length; j++) {
							styles = svg.Styles['.' + classes[j]];
							if (styles != null) {
								for (var name in styles) {
									this.styles[name] = styles[name];
								}
							}
						}
					}
	
					// add inline styles
					if (this.attribute('style').hasValue()) {
						var styles = this.attribute('style').value.split(';');
						for (var i = 0; i < styles.length; i++) {
							if (svg.trim(styles[i]) != '') {
								var style = styles[i].split(':');
								var name = svg.trim(style[0]);
								var value = svg.trim(style[1]);
								this.styles[name] = new svg.Property(name, value);
							}
						}
					}
	
					// add id
					if (this.attribute('id').hasValue()) {
						if (svg.Definitions[this.attribute('id').value] == null) {
							svg.Definitions[this.attribute('id').value] = this;
						}
					}
				}
			};
	
			svg.Element.RenderedElementBase = function (node) {
				this.base = svg.Element.ElementBase;
				this.base(node);
	
				this.setContext = function (ctx) {
					// fill
					if (this.style('fill').Definition.isUrl()) {
						var fs = this.style('fill').Definition.getFillStyle(this);
						if (fs != null) {
							ctx.fillStyle = fs;
							// cvd.logCommand('ctx.fillStyle = "' + ctx.fillStyle + '"' );
							cvd.logCommand('ctx.fillStyle = g');
						}
					} else if (this.style('fill').hasValue()) {
						var fillStyle = this.style('fill');
						if (this.style('fill-opacity').hasValue()) fillStyle = fillStyle.Color.addOpacity(this.style('fill-opacity').value);
						ctx.fillStyle = fillStyle.value == 'none' ? 'rgba(0,0,0,0)' : fillStyle.value;
						cvd.logCommand('ctx.fillStyle = "' + ctx.fillStyle + '"');
					}
	
					// stroke
					if (this.style('stroke').Definition.isUrl()) {
						var fs = this.style('stroke').Definition.getFillStyle(this);
						if (fs != null) {
							ctx.strokeStyle = fs;cvd.logCommand('ctx.strokeStyle = "' + ctx.strokeStyle + '"');
						}
					} else if (this.style('stroke').hasValue()) {
						var strokeStyle = this.style('stroke');
						if (this.style('stroke-opacity').hasValue()) strokeStyle = strokeStyle.Color.addOpacity(this.style('stroke-opacity').value);
						ctx.strokeStyle = strokeStyle.value == 'none' ? 'rgba(0,0,0,0)' : strokeStyle.value;
						cvd.logCommand('ctx.strokeStyle = "' + ctx.strokeStyle + '"');
					}
					if (this.style('stroke-width').hasValue()) {
						ctx.lineWidth = this.style('stroke-width').Length.toPixels();cvd.logCommand('ctx.lineWidth = ' + ctx.lineWidth);
					}
					if (this.style('stroke-linecap').hasValue()) {
						ctx.lineCap = this.style('stroke-linecap').value;cvd.logCommand('ctx.lineCap = "' + ctx.lineCap + '"');
					}
					if (this.style('stroke-linejoin').hasValue()) {
						ctx.lineJoin = this.style('stroke-linejoin').value;cvd.logCommand('ctx.lineJoin = "' + ctx.lineJoin + '"');
					}
					if (this.style('stroke-miterlimit').hasValue()) {
						ctx.miterLimit = this.style('stroke-miterlimit').value;cvd.logCommand('ctx.miterLimit = ' + ctx.miterLimit);
					}
	
					// font
					if (typeof ctx.font != 'undefined') {
						ctx.font = svg.Font.CreateFont(this.style('font-style').value, this.style('font-variant').value, this.style('font-weight').value, this.style('font-size').hasValue() ? this.style('font-size').Length.toPixels() + 'px' : '', this.style('font-family').value).toString();
					}
	
					// transform
					if (this.attribute('transform').hasValue()) {
						var transform = new svg.Transform(this.attribute('transform').value);
						transform.apply(ctx);
					}
	
					// clip
					if (this.attribute('clip-path').hasValue()) {
						var clip = this.attribute('clip-path').Definition.getDefinition();
						if (clip != null) clip.apply(ctx);
					}
	
					// opacity
					if (this.style('opacity').hasValue()) {
						ctx.globalAlpha = this.style('opacity').numValue();
						cvd.logCommand('ctx.globalAlpha = ' + ctx.globalAlpha);
					}
				};
			};
			svg.Element.RenderedElementBase.prototype = new svg.Element.ElementBase();
	
			svg.Element.PathElementBase = function (node) {
				this.base = svg.Element.RenderedElementBase;
				this.base(node);
	
				this.path = function (ctx) {
					if (ctx != null) ctx.beginPath();
					return new svg.BoundingBox();
				};
	
				this.renderChildren = function (ctx) {
					this.path(ctx);
					svg.Mouse.checkPath(this, ctx);
					if (ctx.fillStyle != '') ctx.fill();
					if (ctx.strokeStyle != '') ctx.stroke();
	
					var markers = this.getMarkers();
					if (markers != null) {
						if (this.attribute('marker-start').Definition.isUrl()) {
							var marker = this.attribute('marker-start').Definition.getDefinition();
							marker.render(ctx, markers[0][0], markers[0][1]);
						}
						if (this.attribute('marker-mid').Definition.isUrl()) {
							var marker = this.attribute('marker-mid').Definition.getDefinition();
							for (var i = 1; i < markers.length - 1; i++) {
								marker.render(ctx, markers[i][0], markers[i][1]);
							}
						}
						if (this.attribute('marker-end').Definition.isUrl()) {
							var marker = this.attribute('marker-end').Definition.getDefinition();
							marker.render(ctx, markers[markers.length - 1][0], markers[markers.length - 1][1]);
						}
					}
				};
	
				this.getBoundingBox = function () {
					return this.path();
				};
	
				this.getMarkers = function () {
					return null;
				};
			};
			svg.Element.PathElementBase.prototype = new svg.Element.RenderedElementBase();
	
			// svg element
			svg.Element.svg = function (node) {
				this.base = svg.Element.RenderedElementBase;
				this.base(node);
	
				this.baseClearContext = this.clearContext;
				this.clearContext = function (ctx) {
					this.baseClearContext(ctx);
					svg.ViewPort.RemoveCurrent();
				};
	
				this.baseSetContext = this.setContext;
				this.setContext = function (ctx) {
					this.baseSetContext(ctx);
	
					// create new view port
					if (this.attribute('x').hasValue() && this.attribute('y').hasValue()) {
						ctx.translate(this.attribute('x').Length.toPixels('x'), this.attribute('y').Length.toPixels('y'));
					}
	
					var width = svg.ViewPort.width();
					var height = svg.ViewPort.height();
					if (this.attribute('width').hasValue() && this.attribute('height').hasValue()) {
						width = this.attribute('width').Length.toPixels('x');
						height = this.attribute('height').Length.toPixels('y');
	
						var x = 0;
						var y = 0;
						if (this.attribute('refX').hasValue() && this.attribute('refY').hasValue()) {
							x = -this.attribute('refX').Length.toPixels('x');
							y = -this.attribute('refY').Length.toPixels('y');
						}
	
						ctx.beginPath();
						ctx.moveTo(x, y);
						ctx.lineTo(width, y);
						ctx.lineTo(width, height);
						ctx.lineTo(x, height);
						ctx.closePath();
						ctx.clip();
					}
					svg.ViewPort.SetCurrent(width, height);
	
					// viewbox
					if (this.attribute('viewBox').hasValue()) {
						var viewBox = svg.ToNumberArray(this.attribute('viewBox').value);
						var minX = viewBox[0];
						var minY = viewBox[1];
						width = viewBox[2];
						height = viewBox[3];
	
						svg.AspectRatio(ctx, this.attribute('preserveAspectRatio').value, svg.ViewPort.width(), width, svg.ViewPort.height(), height, minX, minY, this.attribute('refX').value, this.attribute('refY').value);
	
						svg.ViewPort.RemoveCurrent();
						svg.ViewPort.SetCurrent(viewBox[2], viewBox[3]);
					}
	
					// initial values
					ctx.strokeStyle = 'rgba(0,0,0,0)';
					cvd.logCommand("ctx.strokeStyle = 'rgba(0,0,0,0)'");
					ctx.lineCap = 'butt';
					cvd.logCommand("ctx.lineCap = 'butt'");
					ctx.lineJoin = 'miter';
					cvd.logCommand("ctx.lineJoin = 'miter'");
					ctx.miterLimit = 4;
					cvd.logCommand("ctx.miterLimit = 4");
				};
			};
			svg.Element.svg.prototype = new svg.Element.RenderedElementBase();
	
			// rect element
			svg.Element.rect = function (node) {
				this.base = svg.Element.PathElementBase;
				this.base(node);
	
				this.path = function (ctx) {
					var x = this.attribute('x').Length.toPixels('x');
					var y = this.attribute('y').Length.toPixels('y');
					var width = this.attribute('width').Length.toPixels('x');
					var height = this.attribute('height').Length.toPixels('y');
					var rx = this.attribute('rx').Length.toPixels('x');
					var ry = this.attribute('ry').Length.toPixels('y');
					if (this.attribute('rx').hasValue() && !this.attribute('ry').hasValue()) ry = rx;
					if (this.attribute('ry').hasValue() && !this.attribute('rx').hasValue()) rx = ry;
	
					if (ctx != null) {
						ctx.beginPath();
						ctx.moveTo(x + rx, y);
						ctx.lineTo(x + width - rx, y);
						ctx.quadraticCurveTo(x + width, y, x + width, y + ry);
						ctx.lineTo(x + width, y + height - ry);
						ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height);
						ctx.lineTo(x + rx, y + height);
						ctx.quadraticCurveTo(x, y + height, x, y + height - ry);
						ctx.lineTo(x, y + ry);
						ctx.quadraticCurveTo(x, y, x + rx, y);
						ctx.closePath();
					}
	
					return new svg.BoundingBox(x, y, x + width, y + height);
				};
			};
			svg.Element.rect.prototype = new svg.Element.PathElementBase();
	
			// circle element
			svg.Element.circle = function (node) {
				this.base = svg.Element.PathElementBase;
				this.base(node);
	
				this.path = function (ctx) {
					var cx = this.attribute('cx').Length.toPixels('x');
					var cy = this.attribute('cy').Length.toPixels('y');
					var r = this.attribute('r').Length.toPixels();
	
					if (ctx != null) {
						ctx.beginPath();
						ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
						ctx.closePath();
					}
	
					return new svg.BoundingBox(cx - r, cy - r, cx + r, cy + r);
				};
			};
			svg.Element.circle.prototype = new svg.Element.PathElementBase();
	
			// ellipse element
			svg.Element.ellipse = function (node) {
				this.base = svg.Element.PathElementBase;
				this.base(node);
	
				this.path = function (ctx) {
					var KAPPA = 4 * ((Math.sqrt(2) - 1) / 3);
					var rx = this.attribute('rx').Length.toPixels('x');
					var ry = this.attribute('ry').Length.toPixels('y');
					var cx = this.attribute('cx').Length.toPixels('x');
					var cy = this.attribute('cy').Length.toPixels('y');
	
					if (ctx != null) {
						ctx.beginPath();
						ctx.moveTo(cx, cy - ry);
						ctx.bezierCurveTo(cx + KAPPA * rx, cy - ry, cx + rx, cy - KAPPA * ry, cx + rx, cy);
						ctx.bezierCurveTo(cx + rx, cy + KAPPA * ry, cx + KAPPA * rx, cy + ry, cx, cy + ry);
						ctx.bezierCurveTo(cx - KAPPA * rx, cy + ry, cx - rx, cy + KAPPA * ry, cx - rx, cy);
						ctx.bezierCurveTo(cx - rx, cy - KAPPA * ry, cx - KAPPA * rx, cy - ry, cx, cy - ry);
						ctx.closePath();
					}
	
					return new svg.BoundingBox(cx - rx, cy - ry, cx + rx, cy + ry);
				};
			};
			svg.Element.ellipse.prototype = new svg.Element.PathElementBase();
	
			// line element
			svg.Element.line = function (node) {
				this.base = svg.Element.PathElementBase;
				this.base(node);
	
				this.getPoints = function () {
					return [new svg.Point(this.attribute('x1').Length.toPixels('x'), this.attribute('y1').Length.toPixels('y')), new svg.Point(this.attribute('x2').Length.toPixels('x'), this.attribute('y2').Length.toPixels('y'))];
				};
	
				this.path = function (ctx) {
					var points = this.getPoints();
	
					if (ctx != null) {
						ctx.beginPath();
						ctx.moveTo(points[0].x, points[0].y);
						ctx.lineTo(points[1].x, points[1].y);
					}
	
					return new svg.BoundingBox(points[0].x, points[0].y, points[1].x, points[1].y);
				};
	
				this.getMarkers = function () {
					var points = this.getPoints();
					var a = points[0].angleTo(points[1]);
					return [[points[0], a], [points[1], a]];
				};
			};
			svg.Element.line.prototype = new svg.Element.PathElementBase();
	
			// polyline element
			svg.Element.polyline = function (node) {
				this.base = svg.Element.PathElementBase;
				this.base(node);
	
				this.points = svg.CreatePath(this.attribute('points').value);
				this.path = function (ctx) {
					var bb = new svg.BoundingBox(this.points[0].x, this.points[0].y);
					if (ctx != null) {
						ctx.beginPath();
						ctx.moveTo(this.points[0].x, this.points[0].y);
					}
					for (var i = 1; i < this.points.length; i++) {
						bb.addPoint(this.points[i].x, this.points[i].y);
						if (ctx != null) ctx.lineTo(this.points[i].x, this.points[i].y);
					}
					return bb;
				};
	
				this.getMarkers = function () {
					var markers = [];
					for (var i = 0; i < this.points.length - 1; i++) {
						markers.push([this.points[i], this.points[i].angleTo(this.points[i + 1])]);
					}
					markers.push([this.points[this.points.length - 1], markers[markers.length - 1][1]]);
					return markers;
				};
			};
			svg.Element.polyline.prototype = new svg.Element.PathElementBase();
	
			// polygon element
			svg.Element.polygon = function (node) {
				this.base = svg.Element.polyline;
				this.base(node);
	
				this.basePath = this.path;
				this.path = function (ctx) {
					var bb = this.basePath(ctx);
					if (ctx != null) {
						ctx.lineTo(this.points[0].x, this.points[0].y);
						ctx.closePath();
					}
					return bb;
				};
			};
			svg.Element.polygon.prototype = new svg.Element.polyline();
	
			// path element
			svg.Element.path = function (node) {
				this.base = svg.Element.PathElementBase;
				this.base(node);
	
				var d = this.attribute('d').value;
				// TODO: floating points, convert to real lexer based on http://www.w3.org/TR/SVG11/paths.html#PathDataBNF
				d = d.replace(/,/gm, ' '); // get rid of all commas
				d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([MmZzLlHhVvCcSsQqTtAa])/gm, '$1 $2'); // separate commands from commands
				d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([MmZzLlHhVvCcSsQqTtAa])/gm, '$1 $2'); // separate commands from commands
				d = d.replace(/([MmZzLlHhVvCcSsQqTtAa])([^\s])/gm, '$1 $2'); // separate commands from points
				d = d.replace(/([^\s])([MmZzLlHhVvCcSsQqTtAa])/gm, '$1 $2'); // separate commands from points
				d = d.replace(/([0-9])([+\-])/gm, '$1 $2'); // separate digits when no comma
				d = d.replace(/(\.[0-9]*)(\.)/gm, '$1 $2'); // separate digits when no comma
				d = d.replace(/([Aa](\s+[0-9]+){3})\s+([01])\s*([01])/gm, '$1 $3 $4 '); // shorthand elliptical arc path syntax
				d = svg.compressSpaces(d); // compress multiple spaces
				d = svg.trim(d);
				this.PathParser = new function (d) {
					this.tokens = d.split(' ');
	
					this.reset = function () {
						this.i = -1;
						this.command = '';
						this.previousCommand = '';
						this.control = new svg.Point(0, 0);
						this.current = new svg.Point(0, 0);
						this.points = [];
						this.angles = [];
					};
	
					this.isEnd = function () {
						return this.i >= this.tokens.length - 1;
					};
	
					this.isCommandOrEnd = function () {
						if (this.isEnd()) return true;
						return this.tokens[this.i + 1].match(/[A-Za-z]/) != null;
					};
	
					this.isRelativeCommand = function () {
						return this.command == this.command.toLowerCase();
					};
	
					this.getToken = function () {
						this.i = this.i + 1;
						return this.tokens[this.i];
					};
	
					this.getScalar = function () {
						return parseFloat(this.getToken());
					};
	
					this.nextCommand = function () {
						this.previousCommand = this.command;
						this.command = this.getToken();
					};
	
					this.getPoint = function () {
						var p = new svg.Point(this.getScalar(), this.getScalar());
						return this.makeAbsolute(p);
					};
	
					this.getAsControlPoint = function () {
						var p = this.getPoint();
						this.control = p;
						return p;
					};
	
					this.getAsCurrentPoint = function () {
						var p = this.getPoint();
						this.current = p;
						return p;
					};
	
					this.getReflectedControlPoint = function () {
						if (this.previousCommand.toLowerCase() != 'c' && this.previousCommand.toLowerCase() != 's') {
							return this.current;
						}
	
						// reflect point
						var p = new svg.Point(2 * this.current.x - this.control.x, 2 * this.current.y - this.control.y);
						return p;
					};
	
					this.makeAbsolute = function (p) {
						if (this.isRelativeCommand()) {
							p.x = this.current.x + p.x;
							p.y = this.current.y + p.y;
						}
						return p;
					};
	
					this.addMarker = function (p, from) {
						this.addMarkerAngle(p, from == null ? null : from.angleTo(p));
					};
	
					this.addMarkerAngle = function (p, a) {
						this.points.push(p);
						this.angles.push(a);
					};
	
					this.getMarkerPoints = function () {
						return this.points;
					};
					this.getMarkerAngles = function () {
						for (var i = 0; i < this.angles.length; i++) {
							if (this.angles[i] == null) {
								for (var j = i + 1; j < this.angles.length; j++) {
									if (this.angles[j] != null) {
										this.angles[i] = this.angles[j];
										break;
									}
								}
							}
						}
						return this.angles;
					};
				}(d);
	
				this.path = function (ctx) {
					var pp = this.PathParser;
					pp.reset();
	
					var bb = new svg.BoundingBox();
					if (ctx != null) ctx.beginPath();
					while (!pp.isEnd()) {
						pp.nextCommand();
						if (pp.command.toUpperCase() == 'M') {
							var p = pp.getAsCurrentPoint();
							pp.addMarker(p);
							bb.addPoint(p.x, p.y);
							if (ctx != null) ctx.moveTo(p.x, p.y);
							while (!pp.isCommandOrEnd()) {
								var p = pp.getAsCurrentPoint();
								pp.addMarker(p);
								bb.addPoint(p.x, p.y);
								if (ctx != null) ctx.lineTo(p.x, p.y);
							}
						} else if (pp.command.toUpperCase() == 'L') {
							while (!pp.isCommandOrEnd()) {
								var c = pp.current;
								var p = pp.getAsCurrentPoint();
								pp.addMarker(p, c);
								bb.addPoint(p.x, p.y);
								if (ctx != null) ctx.lineTo(p.x, p.y);
							}
						} else if (pp.command.toUpperCase() == 'H') {
							while (!pp.isCommandOrEnd()) {
								var newP = new svg.Point((pp.isRelativeCommand() ? pp.current.x : 0) + pp.getScalar(), pp.current.y);
								pp.addMarker(newP, pp.current);
								pp.current = newP;
								bb.addPoint(pp.current.x, pp.current.y);
								if (ctx != null) ctx.lineTo(pp.current.x, pp.current.y);
							}
						} else if (pp.command.toUpperCase() == 'V') {
							while (!pp.isCommandOrEnd()) {
								var newP = new svg.Point(pp.current.x, (pp.isRelativeCommand() ? pp.current.y : 0) + pp.getScalar());
								pp.addMarker(newP, pp.current);
								pp.current = newP;
								bb.addPoint(pp.current.x, pp.current.y);
								if (ctx != null) ctx.lineTo(pp.current.x, pp.current.y);
							}
						} else if (pp.command.toUpperCase() == 'C') {
							while (!pp.isCommandOrEnd()) {
								var curr = pp.current;
								var p1 = pp.getPoint();
								var cntrl = pp.getAsControlPoint();
								var cp = pp.getAsCurrentPoint();
								pp.addMarker(cp, cntrl);
								bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
								if (ctx != null) ctx.bezierCurveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
							}
						} else if (pp.command.toUpperCase() == 'S') {
							while (!pp.isCommandOrEnd()) {
								var curr = pp.current;
								var p1 = pp.getReflectedControlPoint();
								var cntrl = pp.getAsControlPoint();
								var cp = pp.getAsCurrentPoint();
								pp.addMarker(cp, cntrl);
								bb.addBezierCurve(curr.x, curr.y, p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
								if (ctx != null) ctx.bezierCurveTo(p1.x, p1.y, cntrl.x, cntrl.y, cp.x, cp.y);
							}
						} else if (pp.command.toUpperCase() == 'Q') {
							while (!pp.isCommandOrEnd()) {
								var curr = pp.current;
								var cntrl = pp.getAsControlPoint();
								var cp = pp.getAsCurrentPoint();
								pp.addMarker(cp, cntrl);
								bb.addQuadraticCurve(curr.x, curr.y, cntrl.x, cntrl.y, cp.x, cp.y);
								if (ctx != null) ctx.quadraticCurveTo(cntrl.x, cntrl.y, cp.x, cp.y);
							}
						} else if (pp.command.toUpperCase() == 'T') {
							while (!pp.isCommandOrEnd()) {
								var curr = pp.current;
								var cntrl = pp.getReflectedControlPoint();
								pp.control = cntrl;
								var cp = pp.getAsCurrentPoint();
								pp.addMarker(cp, cntrl);
								bb.addQuadraticCurve(curr.x, curr.y, cntrl.x, cntrl.y, cp.x, cp.y);
								if (ctx != null) ctx.quadraticCurveTo(cntrl.x, cntrl.y, cp.x, cp.y);
							}
						} else if (pp.command.toUpperCase() == 'A') {
							while (!pp.isCommandOrEnd()) {
								var curr = pp.current;
								var rx = pp.getScalar();
								var ry = pp.getScalar();
								var xAxisRotation = pp.getScalar() * (Math.PI / 180.0);
								var largeArcFlag = pp.getScalar();
								var sweepFlag = pp.getScalar();
								var cp = pp.getAsCurrentPoint();
	
								// Conversion from endpoint to center parameterization
								// http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
								// x1', y1'
								var currp = new svg.Point(Math.cos(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.sin(xAxisRotation) * (curr.y - cp.y) / 2.0, -Math.sin(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.cos(xAxisRotation) * (curr.y - cp.y) / 2.0);
								// adjust radii
								var l = Math.pow(currp.x, 2) / Math.pow(rx, 2) + Math.pow(currp.y, 2) / Math.pow(ry, 2);
								if (l > 1) {
									rx *= Math.sqrt(l);
									ry *= Math.sqrt(l);
								}
								// cx', cy'
								var s = (largeArcFlag == sweepFlag ? -1 : 1) * Math.sqrt((Math.pow(rx, 2) * Math.pow(ry, 2) - Math.pow(rx, 2) * Math.pow(currp.y, 2) - Math.pow(ry, 2) * Math.pow(currp.x, 2)) / (Math.pow(rx, 2) * Math.pow(currp.y, 2) + Math.pow(ry, 2) * Math.pow(currp.x, 2)));
								if (isNaN(s)) s = 0;
								var cpp = new svg.Point(s * rx * currp.y / ry, s * -ry * currp.x / rx);
								// cx, cy
								var centp = new svg.Point((curr.x + cp.x) / 2.0 + Math.cos(xAxisRotation) * cpp.x - Math.sin(xAxisRotation) * cpp.y, (curr.y + cp.y) / 2.0 + Math.sin(xAxisRotation) * cpp.x + Math.cos(xAxisRotation) * cpp.y);
								// vector magnitude
								var m = function m(v) {
									return Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
								};
								// ratio between two vectors
								var r = function r(u, v) {
									return (u[0] * v[0] + u[1] * v[1]) / (m(u) * m(v));
								};
								// angle between two vectors
								var a = function a(u, v) {
									return (u[0] * v[1] < u[1] * v[0] ? -1 : 1) * Math.acos(r(u, v));
								};
								// initial angle
								var a1 = a([1, 0], [(currp.x - cpp.x) / rx, (currp.y - cpp.y) / ry]);
								// angle delta
								var u = [(currp.x - cpp.x) / rx, (currp.y - cpp.y) / ry];
								var v = [(-currp.x - cpp.x) / rx, (-currp.y - cpp.y) / ry];
								var ad = a(u, v);
								if (r(u, v) <= -1) ad = Math.PI;
								if (r(u, v) >= 1) ad = 0;
	
								if (sweepFlag == 0 && ad > 0) ad = ad - 2 * Math.PI;
								if (sweepFlag == 1 && ad < 0) ad = ad + 2 * Math.PI;
	
								// for markers
								var halfWay = new svg.Point(centp.x - rx * Math.cos((a1 + ad) / 2), centp.y - ry * Math.sin((a1 + ad) / 2));
								pp.addMarkerAngle(halfWay, (a1 + ad) / 2 + (sweepFlag == 0 ? 1 : -1) * Math.PI / 2);
								pp.addMarkerAngle(cp, ad + (sweepFlag == 0 ? 1 : -1) * Math.PI / 2);
	
								bb.addPoint(cp.x, cp.y); // TODO: this is too naive, make it better
								if (ctx != null) {
									var r = rx > ry ? rx : ry;
									var sx = rx > ry ? 1 : rx / ry;
									var sy = rx > ry ? ry / rx : 1;
	
									ctx.translate(centp.x, centp.y);
									ctx.rotate(xAxisRotation);
									ctx.scale(sx, sy);
									ctx.arc(0, 0, r, a1, a1 + ad, 1 - sweepFlag);
									ctx.scale(1 / sx, 1 / sy);
									ctx.rotate(-xAxisRotation);
									ctx.translate(-centp.x, -centp.y);
								}
							}
						} else if (pp.command.toUpperCase() == 'Z') {
							if (ctx != null) ctx.closePath();
						}
					}
	
					return bb;
				};
	
				this.getMarkers = function () {
					var points = this.PathParser.getMarkerPoints();
					var angles = this.PathParser.getMarkerAngles();
	
					var markers = [];
					for (var i = 0; i < points.length; i++) {
						markers.push([points[i], angles[i]]);
					}
					return markers;
				};
			};
			svg.Element.path.prototype = new svg.Element.PathElementBase();
	
			// pattern element
			svg.Element.pattern = function (node) {
				this.base = svg.Element.ElementBase;
				this.base(node);
	
				this.createPattern = function (ctx, element) {
					// render me using a temporary svg element
					var tempSvg = new svg.Element.svg();
					tempSvg.attributes['viewBox'] = new svg.Property('viewBox', this.attribute('viewBox').value);
					tempSvg.attributes['x'] = new svg.Property('x', this.attribute('x').value);
					tempSvg.attributes['y'] = new svg.Property('y', this.attribute('y').value);
					tempSvg.attributes['width'] = new svg.Property('width', this.attribute('width').value);
					tempSvg.attributes['height'] = new svg.Property('height', this.attribute('height').value);
					tempSvg.children = this.children;
	
					var c = document.createElement('canvas');
					c.width = this.attribute('width').Length.toPixels();
					c.height = this.attribute('height').Length.toPixels();
					tempSvg.render(c.getContext('2d'));
					return ctx.createPattern(c, 'repeat');
				};
			};
			svg.Element.pattern.prototype = new svg.Element.ElementBase();
	
			// marker element
			svg.Element.marker = function (node) {
				this.base = svg.Element.ElementBase;
				this.base(node);
	
				this.baseRender = this.render;
				this.render = function (ctx, point, angle) {
					ctx.translate(point.x, point.y);
					if (this.attribute('orient').valueOrDefault('auto') == 'auto') ctx.rotate(angle);
					if (this.attribute('markerUnits').valueOrDefault('strokeWidth') == 'strokeWidth') ctx.scale(ctx.lineWidth, ctx.lineWidth);
					ctx.save();
	
					// render me using a temporary svg element
					var tempSvg = new svg.Element.svg();
					tempSvg.attributes['viewBox'] = new svg.Property('viewBox', this.attribute('viewBox').value);
					tempSvg.attributes['refX'] = new svg.Property('refX', this.attribute('refX').value);
					tempSvg.attributes['refY'] = new svg.Property('refY', this.attribute('refY').value);
					tempSvg.attributes['width'] = new svg.Property('width', this.attribute('markerWidth').value);
					tempSvg.attributes['height'] = new svg.Property('height', this.attribute('markerHeight').value);
					tempSvg.attributes['fill'] = new svg.Property('fill', this.attribute('fill').valueOrDefault('black'));
					tempSvg.attributes['stroke'] = new svg.Property('stroke', this.attribute('stroke').valueOrDefault('none'));
					tempSvg.children = this.children;
					tempSvg.render(ctx);
	
					ctx.restore();
					if (this.attribute('markerUnits').valueOrDefault('strokeWidth') == 'strokeWidth') ctx.scale(1 / ctx.lineWidth, 1 / ctx.lineWidth);
					if (this.attribute('orient').valueOrDefault('auto') == 'auto') ctx.rotate(-angle);
					ctx.translate(-point.x, -point.y);
				};
			};
			svg.Element.marker.prototype = new svg.Element.ElementBase();
	
			// definitions element
			svg.Element.defs = function (node) {
				this.base = svg.Element.ElementBase;
				this.base(node);
	
				this.render = function (ctx) {
					// NOOP
				};
			};
			svg.Element.defs.prototype = new svg.Element.ElementBase();
	
			// base for gradients
			svg.Element.GradientBase = function (node) {
				this.base = svg.Element.ElementBase;
				this.base(node);
	
				this.gradientUnits = this.attribute('gradientUnits').valueOrDefault('objectBoundingBox');
	
				this.stops = [];
				for (var i = 0; i < this.children.length; i++) {
					var child = this.children[i];
					this.stops.push(child);
				}
	
				this.getGradient = function () {
					// OVERRIDE ME!
				};
	
				this.createGradient = function (ctx, element) {
					var stopsContainer = this;
					if (this.attribute('xlink:href').hasValue()) {
						stopsContainer = this.attribute('xlink:href').Definition.getDefinition();
					}
	
					var g = this.getGradient(ctx, element);
	
					for (var i = 0; i < stopsContainer.stops.length; i++) {
						g.addColorStop(stopsContainer.stops[i].offset, stopsContainer.stops[i].color);
						cvd.logCommand('g.addColorStop(' + stopsContainer.stops[i].offset + ',"' + stopsContainer.stops[i].color + '")');
					}
					return g;
				};
			};
			svg.Element.GradientBase.prototype = new svg.Element.ElementBase();
	
			// linear gradient element
			svg.Element.linearGradient = function (node) {
				this.base = svg.Element.GradientBase;
				this.base(node);
	
				this.getGradient = function (ctx, element) {
					var bb = element.getBoundingBox();
	
					var x1 = this.gradientUnits == 'objectBoundingBox' ? bb.x() + bb.width() * this.attribute('x1').numValue() : this.attribute('x1').Length.toPixels('x');
					var y1 = this.gradientUnits == 'objectBoundingBox' ? bb.y() + bb.height() * this.attribute('y1').numValue() : this.attribute('y1').Length.toPixels('y');
					var x2 = this.gradientUnits == 'objectBoundingBox' ? bb.x() + bb.width() * this.attribute('x2').numValue() : this.attribute('x2').Length.toPixels('x');
					var y2 = this.gradientUnits == 'objectBoundingBox' ? bb.y() + bb.height() * this.attribute('y2').numValue() : this.attribute('y2').Length.toPixels('y');
	
					var p1 = new svg.Point(x1, y1);
					var p2 = new svg.Point(x2, y2);
					if (this.attribute('gradientTransform').hasValue()) {
						var transform = new svg.Transform(this.attribute('gradientTransform').value);
						transform.applyToPoint(p1);
						transform.applyToPoint(p2);
					}
					cvd.logCommand('g=ctx.createLinearGradient(' + p1.x + ',' + p1.y + ',' + p2.x + ',' + p2.y + ')');
					return ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
				};
			};
			svg.Element.linearGradient.prototype = new svg.Element.GradientBase();
	
			// radial gradient element
			svg.Element.radialGradient = function (node) {
				this.base = svg.Element.GradientBase;
				this.base(node);
	
				this.getGradient = function (ctx, element) {
					var bb = element.getBoundingBox();
	
					var cx = this.gradientUnits == 'objectBoundingBox' ? bb.x() + bb.width() * this.attribute('cx').numValue() : this.attribute('cx').Length.toPixels('x');
					var cy = this.gradientUnits == 'objectBoundingBox' ? bb.y() + bb.height() * this.attribute('cy').numValue() : this.attribute('cy').Length.toPixels('y');
	
					var fx = cx;
					var fy = cy;
					if (this.attribute('fx').hasValue()) {
						fx = this.gradientUnits == 'objectBoundingBox' ? bb.x() + bb.width() * this.attribute('fx').numValue() : this.attribute('fx').Length.toPixels('x');
					}
					if (this.attribute('fy').hasValue()) {
						fy = this.gradientUnits == 'objectBoundingBox' ? bb.y() + bb.height() * this.attribute('fy').numValue() : this.attribute('fy').Length.toPixels('y');
					}
	
					var r = this.gradientUnits == 'objectBoundingBox' ? (bb.width() + bb.height()) / 2.0 * this.attribute('r').numValue() : this.attribute('r').Length.toPixels();
	
					var c = new svg.Point(cx, cy);
					var f = new svg.Point(fx, fy);
					if (this.attribute('gradientTransform').hasValue()) {
						var transform = new svg.Transform(this.attribute('gradientTransform').value);
						transform.applyToPoint(c);
						transform.applyToPoint(f);
					}
					cvd.logCommand('g=ctx.createRadialGradient(' + f.x + ',' + f.y + ',0,' + c.x + ',' + c.y + ',' + r + ')');
					return ctx.createRadialGradient(f.x, f.y, 0, c.x, c.y, r);
				};
			};
			svg.Element.radialGradient.prototype = new svg.Element.GradientBase();
	
			// gradient stop element
			svg.Element.stop = function (node) {
				this.base = svg.Element.ElementBase;
				this.base(node);
	
				this.offset = this.attribute('offset').numValue();
	
				var stopColor = this.style('stop-color');
				if (this.style('stop-opacity').hasValue()) stopColor = stopColor.Color.addOpacity(this.style('stop-opacity').value);
				this.color = stopColor.value;
			};
			svg.Element.stop.prototype = new svg.Element.ElementBase();
	
			// animation base element
			svg.Element.AnimateBase = function (node) {
				this.base = svg.Element.ElementBase;
				this.base(node);
	
				svg.Animations.push(this);
	
				this.duration = 0.0;
				this.begin = this.attribute('begin').Time.toMilliseconds();
				this.maxDuration = this.begin + this.attribute('dur').Time.toMilliseconds();
	
				this.calcValue = function () {
					// OVERRIDE ME!
					return '';
				};
	
				this.update = function (delta) {
					// if we're past the end time
					if (this.duration > this.maxDuration) {
						// loop for indefinitely repeating animations
						if (this.attribute('repeatCount').value == 'indefinite') {
							this.duration = 0.0;
						} else {
							return false; // no updates made
						}
					}
					this.duration = this.duration + delta;
	
					// if we're past the begin time
					var updated = false;
					if (this.begin < this.duration) {
						var newValue = this.calcValue(); // tween
						var attributeType = this.attribute('attributeType').value;
						var attributeName = this.attribute('attributeName').value;
	
						if (this.parent != null) {
							if (attributeType == 'CSS') {
								this.parent.style(attributeName, true).value = newValue;
							} else {
								// default or XML
								if (this.attribute('type').hasValue()) {
									// for transform, etc.
									var type = this.attribute('type').value;
									this.parent.attribute(attributeName, true).value = type + '(' + newValue + ')';
								} else {
									this.parent.attribute(attributeName, true).value = newValue;
								}
							}
							updated = true;
						}
					}
	
					return updated;
				};
	
				// fraction of duration we've covered
				this.progress = function () {
					return (this.duration - this.begin) / (this.maxDuration - this.begin);
				};
			};
			svg.Element.AnimateBase.prototype = new svg.Element.ElementBase();
	
			// animate element
			svg.Element.animate = function (node) {
				this.base = svg.Element.AnimateBase;
				this.base(node);
	
				this.calcValue = function () {
					var from = this.attribute('from').numValue();
					var to = this.attribute('to').numValue();
	
					// tween value linearly
					return from + (to - from) * this.progress();
				};
			};
			svg.Element.animate.prototype = new svg.Element.AnimateBase();
	
			// animate color element
			svg.Element.animateColor = function (node) {
				this.base = svg.Element.AnimateBase;
				this.base(node);
	
				this.calcValue = function () {
					var from = new RGBColor(this.attribute('from').value);
					var to = new RGBColor(this.attribute('to').value);
	
					if (from.ok && to.ok) {
						// tween color linearly
						var r = from.r + (to.r - from.r) * this.progress();
						var g = from.g + (to.g - from.g) * this.progress();
						var b = from.b + (to.b - from.b) * this.progress();
						return 'rgb(' + parseInt(r, 10) + ',' + parseInt(g, 10) + ',' + parseInt(b, 10) + ')';
					}
					return this.attribute('from').value;
				};
			};
			svg.Element.animateColor.prototype = new svg.Element.AnimateBase();
	
			// animate transform element
			svg.Element.animateTransform = function (node) {
				this.base = svg.Element.animate;
				this.base(node);
			};
			svg.Element.animateTransform.prototype = new svg.Element.animate();
	
			// text element
			svg.Element.text = function (node) {
				this.base = svg.Element.RenderedElementBase;
				this.base(node);
	
				if (node != null) {
					// add children
					this.children = [];
					for (var i = 0; i < node.childNodes.length; i++) {
						var childNode = node.childNodes[i];
						if (childNode.nodeType == 1) {
							// capture tspan and tref nodes
							this.addChild(childNode, true);
						} else if (childNode.nodeType == 3) {
							// capture text
							this.addChild(new svg.Element.tspan(childNode), false);
						}
					}
				}
	
				this.baseSetContext = this.setContext;
				this.setContext = function (ctx) {
					this.baseSetContext(ctx);
					if (this.attribute('text-anchor').hasValue()) {
						var textAnchor = this.attribute('text-anchor').value;
						ctx.textAlign = textAnchor == 'middle' ? 'center' : textAnchor;
					}
					if (this.attribute('alignment-baseline').hasValue()) ctx.textBaseline = this.attribute('alignment-baseline').value;
				};
	
				this.renderChildren = function (ctx) {
					var x = this.attribute('x').Length.toPixels('x');
					var y = this.attribute('y').Length.toPixels('y');
					for (var i = 0; i < this.children.length; i++) {
						var child = this.children[i];
	
						if (child.attribute('x').hasValue()) {
							child.x = child.attribute('x').Length.toPixels('x');
						} else {
							if (child.attribute('dx').hasValue()) x += child.attribute('dx').Length.toPixels('x');
							child.x = x;
							x += child.measureText(ctx);
						}
	
						if (child.attribute('y').hasValue()) {
							child.y = child.attribute('y').Length.toPixels('y');
						} else {
							if (child.attribute('dy').hasValue()) y += child.attribute('dy').Length.toPixels('y');
							child.y = y;
						}
	
						child.render(ctx);
					}
				};
			};
			svg.Element.text.prototype = new svg.Element.RenderedElementBase();
	
			// text base
			svg.Element.TextElementBase = function (node) {
				this.base = svg.Element.RenderedElementBase;
				this.base(node);
	
				this.renderChildren = function (ctx) {
					ctx.fillText(svg.compressSpaces(this.getText()), this.x, this.y);
				};
	
				this.getText = function () {
					// OVERRIDE ME
				};
	
				this.measureText = function (ctx) {
					var textToMeasure = svg.compressSpaces(this.getText());
					if (!ctx.measureText) return textToMeasure.length * 10;
					return ctx.measureText(textToMeasure).width;
				};
			};
			svg.Element.TextElementBase.prototype = new svg.Element.RenderedElementBase();
	
			// tspan 
			svg.Element.tspan = function (node) {
				this.base = svg.Element.TextElementBase;
				this.base(node);
	
				//								 TEXT			  ELEMENT
				this.text = node.nodeType == 3 ? node.nodeValue : node.childNodes[0].nodeValue;
				this.getText = function () {
					return this.text;
				};
			};
			svg.Element.tspan.prototype = new svg.Element.TextElementBase();
	
			// tref
			svg.Element.tref = function (node) {
				this.base = svg.Element.TextElementBase;
				this.base(node);
	
				this.getText = function () {
					var element = this.attribute('xlink:href').Definition.getDefinition();
					if (element != null) return element.children[0].getText();
				};
			};
			svg.Element.tref.prototype = new svg.Element.TextElementBase();
	
			// a element
			svg.Element.a = function (node) {
				this.base = svg.Element.TextElementBase;
				this.base(node);
	
				this.hasText = true;
				for (var i = 0; i < node.childNodes.length; i++) {
					if (node.childNodes[i].nodeType != 3) this.hasText = false;
				}
	
				// this might contain text
				this.text = this.hasText ? node.childNodes[0].nodeValue : '';
				this.getText = function () {
					return this.text;
				};
	
				this.baseRenderChildren = this.renderChildren;
				this.renderChildren = function (ctx) {
					if (this.hasText) {
						// render as text element
						this.baseRenderChildren(ctx);
						var fontSize = new svg.Property('fontSize', svg.Font.Parse(svg.ctx.font).fontSize);
						svg.Mouse.checkBoundingBox(this, new svg.BoundingBox(this.x, this.y - fontSize.Length.toPixels('y'), this.x + this.measureText(ctx), this.y));
					} else {
						// render as temporary group
						var g = new svg.Element.g();
						g.children = this.children;
						g.parent = this;
						g.render(ctx);
					}
				};
	
				this.onclick = function () {
					window.open(this.attribute('xlink:href').value);
				};
	
				this.onmousemove = function () {
					svg.ctx.canvas.style.cursor = 'pointer';
				};
			};
			svg.Element.a.prototype = new svg.Element.TextElementBase();
	
			// image element
			svg.Element.image = function (node) {
				this.base = svg.Element.RenderedElementBase;
				this.base(node);
	
				svg.Images.push(this);
				this.img = document.createElement('img');
				this.loaded = false;
				var that = this;
				this.img.onload = function () {
					that.loaded = true;
				};
				this.img.src = this.attribute('xlink:href').value;
	
				this.renderChildren = function (ctx) {
					var x = this.attribute('x').Length.toPixels('x');
					var y = this.attribute('y').Length.toPixels('y');
	
					var width = this.attribute('width').Length.toPixels('x');
					var height = this.attribute('height').Length.toPixels('y');
					if (width == 0 || height == 0) return;
	
					ctx.save();
					ctx.translate(x, y);
					svg.AspectRatio(ctx, this.attribute('preserveAspectRatio').value, width, this.img.width, height, this.img.height, 0, 0);
					ctx.drawImage(this.img, 0, 0);
					ctx.restore();
				};
			};
			svg.Element.image.prototype = new svg.Element.RenderedElementBase();
	
			// group element
			svg.Element.g = function (node) {
				this.base = svg.Element.RenderedElementBase;
				this.base(node);
			};
			svg.Element.g.prototype = new svg.Element.RenderedElementBase();
	
			// symbol element
			svg.Element.symbol = function (node) {
				this.base = svg.Element.RenderedElementBase;
				this.base(node);
			};
			svg.Element.symbol.prototype = new svg.Element.RenderedElementBase();
	
			// style element
			svg.Element.style = function (node) {
				this.base = svg.Element.ElementBase;
				this.base(node);
	
				var css = node.childNodes[0].nodeValue;
				css = css.replace(/(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(\/\/.*)/gm, ''); // remove comments
				css = svg.compressSpaces(css); // replace whitespace
				var cssDefs = css.split('}');
				for (var i = 0; i < cssDefs.length; i++) {
					if (svg.trim(cssDefs[i]) != '') {
						var cssDef = cssDefs[i].split('{');
						var cssClasses = cssDef[0].split(',');
						var cssProps = cssDef[1].split(';');
						for (var j = 0; j < cssClasses.length; j++) {
							var cssClass = svg.trim(cssClasses[j]);
							if (cssClass != '') {
								var props = {};
								for (var k = 0; k < cssProps.length; k++) {
									var prop = cssProps[k].split(':');
									var name = prop[0];
									var value = prop[1];
									if (name != null && value != null) {
										props[svg.trim(prop[0])] = new svg.Property(svg.trim(prop[0]), svg.trim(prop[1]));
									}
								}
								svg.Styles[cssClass] = props;
							}
						}
					}
				}
			};
			svg.Element.style.prototype = new svg.Element.ElementBase();
	
			// use element 
			svg.Element.use = function (node) {
				this.base = svg.Element.RenderedElementBase;
				this.base(node);
	
				this.baseSetContext = this.setContext;
				this.setContext = function (ctx) {
					this.baseSetContext(ctx);
					if (this.attribute('x').hasValue()) ctx.translate(this.attribute('x').Length.toPixels('x'), 0);
					if (this.attribute('y').hasValue()) ctx.translate(0, this.attribute('y').Length.toPixels('y'));
				};
	
				this.getDefinition = function () {
					return this.attribute('xlink:href').Definition.getDefinition();
				};
	
				this.path = function (ctx) {
					var element = this.getDefinition();
					if (element != null) element.path(ctx);
				};
	
				this.renderChildren = function (ctx) {
					var element = this.getDefinition();
					if (element != null) element.render(ctx);
				};
			};
			svg.Element.use.prototype = new svg.Element.RenderedElementBase();
	
			// clip element
			svg.Element.clipPath = function (node) {
				this.base = svg.Element.ElementBase;
				this.base(node);
	
				this.apply = function (ctx) {
					for (var i = 0; i < this.children.length; i++) {
						if (this.children[i].path) {
							this.children[i].path(ctx);
							ctx.clip();
						}
					}
				};
			};
			svg.Element.clipPath.prototype = new svg.Element.ElementBase();
	
			// title element, do nothing
			svg.Element.title = function (node) {};
			svg.Element.title.prototype = new svg.Element.ElementBase();
	
			// desc element, do nothing
			svg.Element.desc = function (node) {};
			svg.Element.desc.prototype = new svg.Element.ElementBase();
	
			svg.Element.MISSING = function (node) {
				console.log('ERROR: Element \'' + node.nodeName + '\' not yet implemented.');
			};
			svg.Element.MISSING.prototype = new svg.Element.ElementBase();
	
			// element factory
			svg.CreateElement = function (node) {
				var className = 'svg.Element.' + node.nodeName.replace(/^[^:]+:/, '');
				if (!eval(className)) className = 'svg.Element.MISSING';
	
				var e = eval('new ' + className + '(node)');
				e.type = node.nodeName;
				return e;
			};
	
			// load from url
			svg.load = function (ctx, url) {
				svg.loadXml(ctx, svg.ajax(url));
			};
	
			// load from xml
			svg.loadXml = function (ctx, xml) {
				svg.init(ctx);
	
				var mapXY = function mapXY(p) {
					var e = ctx.canvas;
					while (e) {
						p.x -= e.offsetLeft;
						p.y -= e.offsetTop;
						e = e.offsetParent;
					}
					if (window.scrollX) p.x += window.scrollX;
					if (window.scrollY) p.y += window.scrollY;
					return p;
				};
	
				// bind mouse
				if (svg.opts == null || svg.opts['ignoreMouse'] != true) {
					ctx.canvas.onclick = function (e) {
						var p = mapXY(new svg.Point(e != null ? e.clientX : event.clientX, e != null ? e.clientY : event.clientY));
						svg.Mouse.onclick(p.x, p.y);
					};
					ctx.canvas.onmousemove = function (e) {
						var p = mapXY(new svg.Point(e != null ? e.clientX : event.clientX, e != null ? e.clientY : event.clientY));
						svg.Mouse.onmousemove(p.x, p.y);
					};
				}
	
				var dom = svg.parseXml(xml);
				var e = svg.CreateElement(dom.documentElement);
	
				// render loop
				var isFirstRender = true;
				var draw = function draw() {
					if (svg.opts == null || svg.opts['ignoreDimensions'] != true) {
						// set canvas size
						if (e.style('width').hasValue()) {
							ctx.canvas.width = e.style('width').Length.toPixels(ctx.canvas.parentNode.clientWidth);
						}
						if (e.style('height').hasValue()) {
							ctx.canvas.height = e.style('height').Length.toPixels(ctx.canvas.parentNode.clientHeight);
						}
					}
					svg.ViewPort.SetCurrent(ctx.canvas.clientWidth, ctx.canvas.clientHeight);
	
					if (svg.opts != null && svg.opts['offsetX'] != null) e.attribute('x', true).value = svg.opts['offsetX'];
					if (svg.opts != null && svg.opts['offsetY'] != null) e.attribute('y', true).value = svg.opts['offsetY'];
					if (svg.opts != null && svg.opts['scaleWidth'] != null && svg.opts['scaleHeight'] != null) {
						e.attribute('width', true).value = svg.opts['scaleWidth'];
						e.attribute('height', true).value = svg.opts['scaleHeight'];
						e.attribute('viewBox', true).value = '0 0 ' + ctx.canvas.clientWidth + ' ' + ctx.canvas.clientHeight;
						e.attribute('preserveAspectRatio', true).value = 'none';
					}
	
					// clear and render
					if (svg.opts != null && svg.opts['ignoreClear'] != true) {
						ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
					}
					e.render(ctx);
					if (isFirstRender) {
						isFirstRender = false;
						if (svg.opts != null && typeof svg.opts['renderCallback'] == 'function') svg.opts['renderCallback']();
					}
				};
	
				var waitingForImages = true;
				if (svg.ImagesLoaded()) {
					waitingForImages = false;
					draw();
				}
				svg.intervalID = setInterval(function () {
					var needUpdate = false;
	
					if (waitingForImages && svg.ImagesLoaded()) {
						waitingForImages = false;
						needUpdate = true;
					}
	
					// need update from mouse events?
					if (svg.opts == null || svg.opts['ignoreMouse'] != true) {
						needUpdate = needUpdate | svg.Mouse.hasEvents();
					}
	
					// need update from animations?
					if (svg.opts == null || svg.opts['ignoreAnimation'] != true) {
						for (var i = 0; i < svg.Animations.length; i++) {
							needUpdate = needUpdate | svg.Animations[i].update(1000 / svg.FRAMERATE);
						}
					}
	
					// need update from redraw?
					if (svg.opts != null && typeof svg.opts['forceRedraw'] == 'function') {
						if (svg.opts['forceRedraw']() == true) needUpdate = true;
					}
	
					// render if needed
					if (needUpdate) {
						draw();
						svg.Mouse.runEvents(); // run and clear our events
					}
				}, 1000 / svg.FRAMERATE);
			};
	
			svg.stop = function () {
				if (svg.intervalID) {
					clearInterval(svg.intervalID);
				}
			};
	
			svg.Mouse = new function () {
				this.events = [];
				this.hasEvents = function () {
					return this.events.length != 0;
				};
	
				this.onclick = function (x, y) {
					this.events.push({ type: 'onclick', x: x, y: y,
						run: function run(e) {
							if (e.onclick) e.onclick();
						}
					});
				};
	
				this.onmousemove = function (x, y) {
					this.events.push({ type: 'onmousemove', x: x, y: y,
						run: function run(e) {
							if (e.onmousemove) e.onmousemove();
						}
					});
				};
	
				this.eventElements = [];
	
				this.checkPath = function (element, ctx) {
					for (var i = 0; i < this.events.length; i++) {
						var e = this.events[i];
						if (ctx.isPointInPath && ctx.isPointInPath(e.x, e.y)) this.eventElements[i] = element;
					}
				};
	
				this.checkBoundingBox = function (element, bb) {
					for (var i = 0; i < this.events.length; i++) {
						var e = this.events[i];
						if (bb.isPointInBox(e.x, e.y)) this.eventElements[i] = element;
					}
				};
	
				this.runEvents = function () {
					svg.ctx.canvas.style.cursor = '';
	
					for (var i = 0; i < this.events.length; i++) {
						var e = this.events[i];
						var element = this.eventElements[i];
						while (element) {
							e.run(element);
							element = element.parent;
						}
					}
	
					// done running, clear
					this.events = [];
					this.eventElements = [];
				};
			}();
	
			return svg;
		}
	})();
	
	if (CanvasRenderingContext2D) {
		CanvasRenderingContext2D.prototype.drawSvg = function (s, dx, dy, dw, dh) {
			canvg(this.canvas, s, {
				ignoreMouse: true,
				ignoreAnimation: true,
				ignoreDimensions: true,
				ignoreClear: true,
				offsetX: dx,
				offsetY: dy,
				scaleWidth: dw,
				scaleHeight: dh
			});
		};
	}
	
	module.exports = _parser;

/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var Track = __webpack_require__(34);
	var Polyfill = __webpack_require__(16);
	
	module.exports = function (options) {
	    var _lmap = nsGmx.leafletMap,
	        _layersByID = nsGmx.gmxMap.layersByID,
	        _aisLayer = _layersByID[options.aisLayerID],
	        _screenSearchLayer = _layersByID[options.searchLayer],
	
	    //_lastPointLayerAltFact = _layersByID[options.lastPointLayerAlt],
	    _lastPointLayerAlt = _layersByID[options.lastPointLayerAlt];
	
	    var _curLegendLayer = _screenSearchLayer,
	        _prevLegendLayer = _lastPointLayerAlt;
	
	    var _almmsi = void 0,
	        _tlmmsi = void 0,
	        _aldt = void 0,
	        _tldt = void 0;
	    var _needAltLegend = false;
	    try {
	        _almmsi = _aisLayer.getGmxProperties().attributes.indexOf("mmsi") + 1, _aldt = _aisLayer.getGmxProperties().attributes.indexOf("ts_pos_utc") + 1;
	        // console.log(_almmsi+" "+_aldt)
	        // console.log(_tlmmsi+" "+_tldt)
	    } catch (ex) {}
	
	    var _displayedVessels = "all",
	        _notDisplayedVessels = [],
	        _filterFunc = function _filterFunc(args) {
	        var mmsiArr = [];
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
	        _specialVesselFilters = void 0,
	
	    // _setVesselFilter = function(){
	    //     if (_screenSearchLayer) {
	    //         _screenSearchLayer.removeFilter();  
	
	    //         if (_displayedVessels!="all" || _notDisplayedVessels.length || _specialVesselFilters) {            
	    //             let ai = _screenSearchLayer._gmx.tileAttributeIndexes, fields = [];
	    //             for (var k in ai)
	    //                 fields[ai[k]] = k;
	    //             _screenSearchLayer.setFilter((args) => {
	
	    //                 for(var f in _specialVesselFilters)
	    //                         _specialVesselFilters[f](args, ai, _displayedVessels);
	
	    //                 let mmsi = args.properties[ai.mmsi].toString();
	    //                 if ((_displayedVessels=="all" || _displayedVessels.indexOf(mmsi) >= 0) && 
	    //                     _notDisplayedVessels.indexOf(mmsi) < 0)
	    //                     return true;
	    //                 else
	    //                     return false;
	    //             });
	    //         } 
	    //     }
	
	    // },
	    _setVesselFilter = function _setVesselFilter() {
	        if (_curLegendLayer) {
	            _curLegendLayer.removeFilter();
	
	            if (_displayedVessels != "all" || _notDisplayedVessels.length || _specialVesselFilters) {
	                var ai = _curLegendLayer._gmx.tileAttributeIndexes,
	                    fields = [];
	                for (var k in ai) {
	                    fields[ai[k]] = k;
	                }_curLegendLayer.setFilter(function (args) {
	
	                    for (var f in _specialVesselFilters) {
	                        _specialVesselFilters[f](args, ai, _displayedVessels);
	                    }var mmsi = args.properties[ai.mmsi].toString();
	                    if ((_displayedVessels == "all" || _displayedVessels.indexOf(mmsi) >= 0) && _notDisplayedVessels.indexOf(mmsi) < 0) return true;else return false;
	                });
	            }
	        }
	    },
	        _historyInterval = void 0,
	        _markers = void 0,
	        _visibleMarkers = [],
	        _icons = {},
	        _getSvg = function _getSvg(url) {
	        var svg = _icons[url];
	        if (!svg) {
	            return new Promise(function (resolve) {
	                var httpRequest = new XMLHttpRequest();
	                httpRequest.onreadystatechange = function () {
	                    if (httpRequest.readyState === 4) {
	                        _icons[url] = httpRequest.responseText;
	                        resolve(_icons[url]);
	                    }
	                };
	                httpRequest.open("GET", document.location.protocol + url.replace(/^https?:/, ""));
	                httpRequest.send();
	            });
	        }
	        return Promise.resolve(svg);
	    },
	        _markerIcon = function _markerIcon(icon, cog, sog, vtype, group_style) {
	        return _getSvg(icon).then(function (svg) {
	            var type_color = '#00f',
	                a = /\.cls-1{fill:(#[^};]+)/.exec(svg);
	            if (a && a.length) type_color = a[1];
	            //console.log(type_color)
	            if (sog) return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!cog ? 0 : cog) + 'deg)"><title>1</title><path style="fill:' + type_color + ';" d="M13.8,20.07a1,1,0,0,1-.69-0.28l-1.79-1.72a0.72,0.72,0,0,0-1,0L8.52,19.79a1,1,0,0,1-.69.28,1,1,0,0,1-1-1V8.65c0-1.52,1.55-7.59,4-7.59s4,6.07,4,7.59V19a1,1,0,0,1-1,1h0Z"/><path style="fill:' + group_style + ';" d="M10.82,1.57c1.93,0,3.5,5.57,3.5,7.09V19a0.52,0.52,0,0,1-.51.53,0.49,0.49,0,0,1-.34-0.14l-1.79-1.72a1.22,1.22,0,0,0-1.71,0L8.17,19.42a0.49,0.49,0,0,1-.34.14A0.52,0.52,0,0,1,7.32,19V8.65c0-1.51,1.57-7.09,3.5-7.09h0m0-1c-3,0-4.5,6.72-4.5,8.09V19a1.52,1.52,0,0,0,1.51,1.53,1.49,1.49,0,0,0,1-.42l1.79-1.72a0.22,0.22,0,0,1,.32,0l1.79,1.72a1.49,1.49,0,0,0,1,.42A1.52,1.52,0,0,0,15.32,19V8.65c0-1.37-1.51-8.09-4.5-8.09h0Z"/><ellipse style="fill:#fff;" cx="10.82" cy="10.54" rx="1.31" ry="1.35"/><path style="fill:#fff;" d="M10.73,3.34h0.12a0.35,0.35,0,0,1,.35.35v6.85a0,0,0,0,1,0,0H10.38a0,0,0,0,1,0,0V3.69A0.35,0.35,0,0,1,10.73,3.34Z"/></svg>';else return '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style="transform:rotate(' + (!cog ? 0 : cog) + 'deg)"><title>1</title><rect style="fill:' + type_color + ';stroke:' + group_style + ';stroke-miterlimit:10;" x="5.9" y="5.6" width="9.19" height="9.19" rx="2" ry="2" transform="translate(-4.13 10.41) rotate(-45)"/><circle style="fill:#fff;" cx="10.5" cy="10.19" r="1.5"/></svg>';
	        });
	    },
	        _eraseMyFleetMarker = function _eraseMyFleetMarker(mmsi) {
	        if (!_markers) _markers = L.layerGroup().addTo(_lmap);else {
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
	        var icon = args.parsedStyleKeys.iconUrl; //args.parsedStyleKeys.iconUrl.replace(/.+(\/|%5C)(?=[^\/]+$)/, '')
	        _eraseMyFleetMarker(data[ai.mmsi]);
	
	        if (!isVisible) return;
	
	        var label_line = function label_line(label, label_color, label_shadow) {
	            if (label != "") return '<div style="height:14px;">' + '<div class="label_shadow" style="height:14px;color' + label_shadow.color + ";text-shadow:" + label_shadow.text_shadow + '">' + label + '</div>' + '<div class="label_color" style="position:relative;top:-14px;color:' + label_color + '">' + label + '</div></div>';else return "";
	        };
	        if (di.get("dateBegin").getTime() <= data[ai.ts_pos_utc] * 1000 && data[ai.ts_pos_utc] * 1000 < di.get("dateEnd").getTime()) {
	            _markerIcon(icon, data[ai.cog], data[ai.sog], data[ai.vessel_type], group.marker_style).then(function (marker) {
	
	                _eraseMyFleetMarker(data[ai.mmsi]);
	
	                var temp = {};
	                temp.group_name = label_line(group.default ? "" : group.title, group.label_color, group.label_shadow);
	                temp.vessel_name = label_line(data[ai.vessel_name], group.label_color, group.label_shadow);
	                temp.sog = label_line(data[ai.sog] + _gtxt("AISSearch2.KnotShort"), group.label_color, group.label_shadow);
	                temp.cog = label_line(isNaN(data[ai.cog]) ? "" : data[ai.cog].toFixed(1) + "&deg;", group.label_color, group.label_shadow);
	                temp.marker = marker;
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
	            });
	        }
	    },
	        _switchLayers = function _switchLayers(l1, l2) {
	        //l1 && console.log(l1.getGmxProperties().name +" "+ !!(l1._map))
	        if (!l2 || l2._map) return;
	        if (l1 && l2) {
	            _lmap.removeLayer(l1);
	            _lmap.addLayer(l2);
	        }
	    },
	        _legendSwitchedHandlers = [],
	        _legendSwitched = function _legendSwitched(showAlternative) {
	        _legendSwitchedHandlers.forEach(function (h) {
	            return h(showAlternative);
	        });
	    },
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
	    };
	
	    var _trackBuilder = new Track();
	
	    return {
	        set specialVesselFilters(_ref) {
	            var key = _ref.key,
	                value = _ref.value;
	
	            if (!_specialVesselFilters) _specialVesselFilters = {};
	            _specialVesselFilters[key] = value;
	            //_setVesselFilter();
	        },
	        get hasAlternativeLayers() {
	            return _lastPointLayerAlt;
	        },
	        get needAltLegend() {
	            //return !!(_lastPointLayerAltFact && _lastPointLayerAltFact._map); 
	            return _needAltLegend;
	        },
	        get historyInterval() {
	            return _historyInterval;
	        },
	        set historyInterval(v) {
	            _historyInterval = v;
	        },
	
	        ///////////////////////
	        removeMyFleetTrack: function removeMyFleetTrack(mmsi) {
	            _trackBuilder.removeMyFleetTrack(mmsi);
	        },
	
	        showMyFleetTrack: function showMyFleetTrack(vessels, onclick, aisLayerSearcher, viewState) {
	            _trackBuilder.showMyFleetTrack(vessels, onclick, aisLayerSearcher, viewState, this.needAltLegend);
	        },
	
	        showHistoryTrack: function showHistoryTrack(vessels, onclick) {
	            return _trackBuilder.showHistoryTrack(vessels, onclick, this.needAltLegend);
	        },
	
	        restoreDefault: function restoreDefault() {
	            if (!_curLegendLayer) return;
	            _lmap.addLayer(_curLegendLayer);
	            _prevLegendLayer && _lmap.removeLayer(_prevLegendLayer);
	        },
	
	        cleanMap: function cleanMap(viewState) {
	            _displayedVessels = 'all';
	            _notDisplayedVessels.length = 0;
	            _setVesselFilter();
	
	            viewState.cleanTracks(_trackBuilder, this.needAltLegend);
	        },
	
	        hideVesselsOnMap: function hideVesselsOnMap(viewState, comment) {
	            if (viewState.notDisplayed.length) _notDisplayedVessels = viewState.notDisplayed.map(function (v) {
	                return v;
	            });else _notDisplayedVessels.length = 0;
	            //console.log('hideOnMap', comment, _notDisplayedVessels)           
	            _setVesselFilter();
	            viewState.hideTracks(_trackBuilder, this.needAltLegend);
	        },
	
	        showVesselsOnMap: function showVesselsOnMap(viewState) {
	            _displayedVessels = viewState.displayedOnly && viewState.displayedOnly.length ? viewState.displayedOnly.map(function (v) {
	                return v;
	            }) : "all";
	            //console.log('showOnMap', _displayedVessels)           
	            _setVesselFilter();
	
	            viewState.showTracks(_trackBuilder, this.needAltLegend);
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
	            // _switchLayers(_screenSearchLayer, _lastPointLayerAlt);
	            // let temp = _screenSearchLayer;
	            // _screenSearchLayer = _lastPointLayerAlt;
	            // _lastPointLayerAlt = temp;
	            // _needAltLegend = !!(_lastPointLayerAltFact && _lastPointLayerAltFact._map);
	
	            _needAltLegend = showAlternative;
	
	            _switchLayers(_curLegendLayer, _prevLegendLayer);
	            var temp = _curLegendLayer;
	            _curLegendLayer = _prevLegendLayer;
	            _prevLegendLayer = temp;
	
	            _setVesselFilter();
	            _legendSwitched(showAlternative);
	
	            _trackBuilder.switchLegend(this.needAltLegend, _notDisplayedVessels);
	        },
	
	        onLegendSwitched: function onLegendSwitched(handler) {
	            _legendSwitchedHandlers.push(handler);
	        },
	
	        formatPosition: function formatPosition(vessel, aisLayerSearcher) {
	            vessel.cog_sog = vessel.cog && vessel.sog;
	            vessel.heading_rot = vessel.heading && vessel.rot;
	            vessel.x_y = vessel.longitude && vessel.latitude;
	            var d = new Date(vessel.ts_pos_utc * 1000);
	            var eta = new Date(vessel.ts_eta * 1000);
	            vessel.tm_pos_utc = this.formatTime(d);
	            vessel.tm_pos_loc = this.formatTime(d, true);
	            vessel.dt_pos_utc = this.formatDate(d);
	            vessel.dt_pos_loc = this.formatDate(d, true);
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
	
	        hideAisData: function hideAisData(isNeeded) {
	            if (isNeeded) {
	                _lmap.removeLayer(_screenSearchLayer);
	                _lmap.removeLayer(_lastPointLayerAlt);
	                _markers && _lmap.removeLayer(_markers);
	            } else {
	                if (_curLegendLayer) {
	                    _lmap.addLayer(_curLegendLayer);
	                    _markers && _lmap.addLayer(_markers);
	                }
	            }
	        }
	    };
	};

/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var vesselMarker = __webpack_require__(35);
	module.exports = function (options) {
	
	    var _lmap = nsGmx.leafletMap,
	        _tracks = {},
	        _tracksAlt = {},
	        _tracksMF = {},
	        _tracksAltMF = {},
	        _canvas = L.canvas(),
	        _addMarker = function _addMarker(p, ep, group, onclick, style, placeVesselTypeIcon) {
	        if (placeVesselTypeIcon) placeVesselTypeIcon(p);
	        var options = {
	            radius: 10,
	            fillColor: style != 'SPEED' ? p.color.value : p.colorAlt.value,
	            fillOpacity: 0.25,
	            weight: 2,
	            color: 'SPEED' ? p.color.value : p.colorAlt.value,
	            cog: parseInt(p.cog),
	            img: style != 'SPEED' ? p.img : p.imgAlt,
	            renderer: _canvas,
	            pid: p.id,
	            next: !ep ? null : L.latLng(ep.ymax, ep.xmax < 0 ? 360 + ep.xmax : ep.xmax),
	            ts: new Date()
	        },
	            m = vesselMarker(L.latLng(p.ymax, p.xmax < 0 ? 360 + p.xmax : p.xmax), options);
	        m.on('click', function (e) {
	            return onclick({ p: p, pid: p.id });
	        });
	        group.addLayer(m);
	    },
	        _addMarkers = function _addMarkers(data, next, onclick, style, placeVesselTypeIcon) {
	        var group = L.layerGroup(null, { renderer: _canvas });
	        for (var i = 0; i < data.length; i++) {
	            if (data[i].positions) {
	                for (var j = 0; j < data[i].positions.length; j++) {
	                    var p = data[i].positions[j];
	                    p.mmsi = data[i].mmsi;p.imo = data[i].imo;
	                    if (data[i].positions[j + 1]) _addMarker(p, data[i].positions[j + 1], group, onclick, style, placeVesselTypeIcon);else _addMarker(p, null, group, onclick, style, placeVesselTypeIcon);
	                }
	            } else {
	                if (data[i + 1]) _addMarker(data[i], data[i + 1], group, onclick, style, placeVesselTypeIcon);else {
	                    _addMarker(data[i], next, group, onclick, style, placeVesselTypeIcon);
	                    if (next) {
	                        _addMarker(next, null, group, onclick, style, placeVesselTypeIcon);
	                    }
	                }
	            }
	        }
	        return group;
	    };
	    var _prevCursor = null,
	        _historyMmsi = null;
	
	    document.body.addEventListener('mousemove', function (e) {
	        if (!_canvas._container) return;
	        _canvas._onMouseMove(e);
	        if (_canvas._container.className.search(/interactive/) > -1) {
	            if (_canvas._map._container.style.cursor != 'pointer') {
	                _prevCursor = _canvas._map._container.style.cursor;
	                _canvas._map._container.style.cursor = 'pointer';
	            }
	        } else {
	            if (_prevCursor !== null) {
	                _canvas._map._container.style.cursor = _prevCursor;
	                _prevCursor = null;
	            }
	        }
	    });
	    document.body.addEventListener('click', function (e) {
	        if (!_canvas._container) return;
	        if (_canvas._container.className.search(/interactive/) > -1) _canvas._onClick(e);
	    });
	
	    return {
	        showHistoryTrack: function showHistoryTrack(vessels, onclick, needAltLegend) {
	            if (!vessels) {
	                // CLEAN ALL  
	                for (var t in _tracks) {
	                    _lmap.removeLayer(_tracks[t]);
	                    _lmap.removeLayer(_tracksAlt[t]);
	                    delete _tracks[t];
	                    delete _tracksAlt[t];
	                }
	                return [];
	            }
	
	            for (var i = 0; i < vessels.length; ++i) {
	                var trackId = vessels[i].mmsi + '_' + vessels[i].imo + '_' + vessels[i].ts;
	                if (vessels[i].positions.length) {
	                    if (!_tracks[trackId]) {
	                        _tracks[trackId] = _addMarkers(vessels[i].positions, vessels[i].end, function (p) {
	                            return onclick(p, false);
	                        }, 'TYPE');
	                        _tracksAlt[trackId] = _addMarkers(vessels[i].positions, vessels[i].end, function (p) {
	                            return onclick(p, false);
	                        }, 'SPEED');
	                        //console.log(i, _tracks[trackId])
	
	                        if (!needAltLegend) _lmap.addLayer(_tracks[trackId]);else _lmap.addLayer(_tracksAlt[trackId]);
	                    }
	                } else {
	                    // HIDE SOME
	                    _lmap.removeLayer(_tracks[trackId]);
	                    _lmap.removeLayer(_tracksAlt[trackId]);
	                    delete _tracks[trackId];
	                    delete _tracksAlt[trackId];
	                }
	            }
	
	            if (_canvas._container) _canvas._container.style.pointerEvents = 'none';
	
	            return Object.keys(_tracks);
	        },
	
	        showMyFleetTrack: function showMyFleetTrack(vessels, onclick, aisLayerSearcher, viewState, needAltLegend) {
	            //console.log(vessels);
	            if (!vessels) {
	                for (var t in _tracksMF) {
	                    _lmap.removeLayer(_tracksMF[t]);
	                    _lmap.removeLayer(_tracksAltMF[t]);
	                    delete _tracksMF[t];
	                    delete _tracksAltMF[t];
	                }
	                return;
	            }
	
	            if (vessels.length && vessels[0].mmsi) {
	                var trackId = vessels[0].mmsi.toString();
	                if (_tracksMF[trackId]) {
	                    _lmap.removeLayer(_tracksMF[trackId]);
	                    _lmap.removeLayer(_tracksAltMF[trackId]);
	                }
	                if (vessels[0].positions.length) {
	
	                    _tracksMF[trackId] = _addMarkers(vessels, null, onclick, 'TYPE', aisLayerSearcher.placeVesselTypeIcon);
	                    _tracksAltMF[trackId] = _addMarkers(vessels, null, onclick, 'SPEED', aisLayerSearcher.placeVesselTypeIcon);
	
	                    if (viewState.isViewActive && viewState.notDisplayed.indexOf(trackId) < 0) if (!needAltLegend) _lmap.addLayer(_tracksMF[trackId]);else _lmap.addLayer(_tracksAltMF[trackId]);
	
	                    if (_canvas._container) _canvas._container.style.pointerEvents = 'none';
	                }
	            }
	        },
	
	        showMyFleetTracks: function showMyFleetTracks(displayed, needAltLegend) {
	            var a = displayed == 'all' ? Object.keys(_tracksMF) : displayed;
	            a.forEach(function (mmsi) {
	                if (_tracksMF[mmsi]) if (!needAltLegend) _lmap.addLayer(_tracksMF[mmsi]);else _lmap.addLayer(_tracksAltMF[mmsi]);
	            });
	        },
	        hideMyFleetTracks: function hideMyFleetTracks(notDisplayed, needAltLegend) {
	            var a = Object.keys(_tracksMF);
	            a.forEach(function (mmsi) {
	                if (notDisplayed.indexOf(mmsi) < 0) {
	                    if (!needAltLegend) !_tracksMF[mmsi]._map && _lmap.addLayer(_tracksMF[mmsi]);else !_tracksAltMF[mmsi]._map && _lmap.addLayer(_tracksAltMF[mmsi]);
	                } else {
	                    _lmap.removeLayer(_tracksMF[mmsi]);
	                    _lmap.removeLayer(_tracksAltMF[mmsi]);
	                }
	            });
	        },
	        cleanMyFleetTracks: function cleanMyFleetTracks() {
	            for (var k in _tracksMF) {
	                _lmap.removeLayer(_tracksMF[k]);
	                _lmap.removeLayer(_tracksAltMF[k]);
	            }
	        },
	        showHistoryTracks: function showHistoryTracks(displayed, needAltLegend) {
	            var a = Object.keys(_tracks);
	            a.forEach(function (id) {
	                if (displayed.indexOf(id) > -1) {
	                    if (!needAltLegend) !_tracks[id]._map && _lmap.addLayer(_tracks[id]);else !_tracksAlt[id]._map && _lmap.addLayer(_tracksAlt[id]);
	                } else {
	                    _lmap.removeLayer(_tracks[id]);
	                    _lmap.removeLayer(_tracksAlt[id]);
	                }
	            });
	        },
	        cleanHistoryTracks: function cleanHistoryTracks() {
	            var ra = [];
	            for (var k in _tracks) {
	                if (_tracks[k]._map || _tracksAlt[k]._map) ra.push(k);
	                _lmap.removeLayer(_tracks[k]);
	                _lmap.removeLayer(_tracksAlt[k]);
	            }
	            return ra;
	        },
	
	        switchLegend: function switchLegend(needAltLegend, notDisplayedVessels) {
	            for (var t in _tracks) {
	                //if (notDisplayedVessels.indexOf(t)<0)
	                if (needAltLegend) {
	                    if (_tracks[t]._map) {
	                        _lmap.removeLayer(_tracks[t]);
	                        _lmap.addLayer(_tracksAlt[t]);
	                    }
	                } else {
	                    if (_tracksAlt[t]._map) {
	                        _lmap.removeLayer(_tracksAlt[t]);
	                        _lmap.addLayer(_tracks[t]);
	                    }
	                }
	            }
	
	            for (var _t in _tracksMF) {
	                if (notDisplayedVessels.indexOf(_t) < 0) {
	                    if (needAltLegend) {
	                        if (_tracksMF[_t]._map) {
	                            _lmap.removeLayer(_tracksMF[_t]);
	                            _lmap.addLayer(_tracksAltMF[_t]);
	                        }
	                    } else {
	                        if (_tracksAltMF[_t]._map) {
	                            _lmap.removeLayer(_tracksAltMF[_t]);
	                            _lmap.addLayer(_tracksMF[_t]);
	                        }
	                    }
	                }
	            }
	        },
	
	        removeMyFleetTrack: function removeMyFleetTrack(mmsi) {
	            mmsi = mmsi.toString();
	            if (_tracksMF[mmsi]) {
	                _lmap.removeLayer(_tracksMF[mmsi]);
	                _lmap.removeLayer(_tracksAltMF[mmsi]);
	                delete _tracksMF[mmsi];
	                delete _tracksAltMF[mmsi];
	            }
	        }
	
	    };
	};

/***/ }),
/* 35 */
/***/ (function(module, exports) {

	"use strict";
	
	L.Canvas.include({
	    _updateVesselMarker: function _updateVesselMarker(layer) {
	        if (!this._drawing || layer._empty()) {
	            return;
	        }
	
	        this._drawnLayers[layer._leaflet_id] = layer;
	
	        var p = layer._point,
	            ctx = this._ctx,
	            r = Math.max(Math.round(layer._radius), 1);
	        //ctx.globalCompositeOperation = 'destination-over';    
	
	        //         var bounds = this._redrawBounds;
	        // console.log(bounds)
	        // 		if (bounds) {
	        // 			var size = bounds.getSize();
	        //             //this._ctx.clearRect(bounds.min.x, bounds.min.y, size.x, size.y);
	
	        //             ctx.strokeStyle = '#ff0000';           
	        // 			ctx.beginPath();
	        // 			ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);
	        //             ctx.stroke();
	        //         }
	
	        if (layer.options.next) {
	            var np = layer._map.latLngToLayerPoint(layer.options.next);
	            ctx.lineWidth = layer.options.weight;
	            ctx.strokeStyle = layer.options.fillColor;
	            ctx.beginPath();
	            ctx.moveTo(p.x, p.y);
	            ctx.lineTo(np.x, np.y);
	            ctx.stroke();
	        }
	
	        //ctx.beginPath();
	        //ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
	        //this._fillStroke(ctx, layer);
	
	        var img = layer.options.img,
	            cog = layer.options.cog;
	        if (img && cog) {
	            ctx.save();
	            ctx.translate(p.x, p.y);
	            ctx.rotate(cog * Math.PI / 180.0);
	            ctx.drawImage(img, -(img.width / 2), -(img.height / 2));
	            ctx.restore();
	        }
	    }
	});
	
	var VesselMarker = L.CircleMarker.extend({
	    _updatePath: function _updatePath() {
	        this._renderer._updateVesselMarker(this);
	    }
	    // , _containsPoint: function(p) {
	    //     return L.CircleMarker.prototype._containsPoint.call(this, p.subtract([0, 10]));
	    // }
	});
	
	var vesselMarker = function vesselMarker(p, options) {
	    return new VesselMarker(p, options);
	};
	
	module.exports = vesselMarker;

/***/ })
/******/ ]);
//# sourceMappingURL=AISPluginBeta.js.map