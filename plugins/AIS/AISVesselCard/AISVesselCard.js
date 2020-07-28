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
	
	var InfoDialogView = __webpack_require__(6),
	    Searcher = __webpack_require__(15),
	    Toolbox = __webpack_require__(16);
	
	Handlebars.registerHelper('aisinfoid', function (context) {
	    return context.mmsi + " " + context.imo;
	});
	
	Handlebars.registerHelper('aisjson', function (context) {
	    return JSON.stringify(context);
	});
	
	var pluginName = 'AISVesselCard',
	    //PRODUCTION ? (BETA ? 'AISPluginBeta' : 'AISPlugin') : 'AISSearch2Test',
	cssTable = 'AISVesselCard',
	    //PRODUCTION ? (BETA ? 'AISPluginBeta' : 'AISPlugin') : 'AISSearch2',
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
	            tools: tools
	        };
	
	        for (var key in params) {
	            if (key.toLowerCase() == "myfleet") {
	                options.myFleetLayers = params[key].split(",").map(function (id) {
	                    return id.replace(/\s/, "");
	                });
	                break;
	            }
	        }var infoDialogView = new InfoDialogView({
	            tools: tools,
	            aisLayerSearcher: new Searcher(options),
	            modulePath: modulePath
	        }),
	            layersByID = nsGmx.gmxMap.layersByID,
	            setLayerClickHandler = function setLayerClickHandler(layer) {
	            layer.removeEventListener('click');
	            layer.addEventListener('click', function (e) {
	                //console.log('layer', e)
	                if (e.gmx && e.gmx.properties.hasOwnProperty("imo")) infoDialogView.show(e.gmx.properties);
	            }, false);
	        },
	            forLayers = function forLayers(layer) {
	            try {
	                if (layer) {
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
	
	var displayInfoDialog = __webpack_require__(7),
	    Polyfill = __webpack_require__(12),
	    VesselInfoScreen = __webpack_require__(13);
	
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
	                return (!vessel.imo || d.vessel.imo == vessel.imo) && d.vessel.mmsi == vessel.mmsi;
	            }),
	                isNew = true,
	                dialogOffset = void 0;
	            //console.log(vessel, ind, allIinfoDialogs)
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
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(8);
	var SpecialFloatView = __webpack_require__(9);
	
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
	
		// let myFleetModel = myFleetView.model,
		// 	add = myFleetModel && myFleetModel.findIndex(vessel) < 0;
	
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
			$('.vessel_prop.vname svg', canvas).css('visibility', 'hidden');
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
/* 8 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(10);
	var _cssClassName = "special";
	var BaseFloatView = __webpack_require__(11);
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
/* 10 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 11 */
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
/* 14 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 15 */
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
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	var Polyfill = __webpack_require__(12);
	
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
	
	        ///////////////////////
	        removeMyFleetTrack: function removeMyFleetTrack(mmsi) {},
	
	        showMyFleetTrack: function showMyFleetTrack(vessels, onclick, aisLayerSearcher, viewState) {},
	
	        showHistoryTrack: function showHistoryTrack(vessels, onclick) {},
	
	        restoreDefault: function restoreDefault() {
	            if (!_curLegendLayer) return;
	            _lmap.addLayer(_curLegendLayer);
	            _prevLegendLayer && _lmap.removeLayer(_prevLegendLayer);
	        },
	
	        cleanMap: function cleanMap(viewState) {},
	
	        hideVesselsOnMap: function hideVesselsOnMap(viewState, comment) {},
	
	        showVesselsOnMap: function showVesselsOnMap(viewState) {},
	
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
	
	        switchLegend: function switchLegend(showAlternative) {},
	
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

/***/ })
/******/ ]);
//# sourceMappingURL=AISVesselCard.js.map