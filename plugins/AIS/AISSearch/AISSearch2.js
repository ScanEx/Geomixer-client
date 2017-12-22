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
	
	var _require = __webpack_require__(4),
	    polyFind = _require.polyFind,
	    polyFindIndex = _require.polyFindIndex;
	
	var createDialog = __webpack_require__(5);
	
	Handlebars.registerHelper('aisinfoid', function (context) {
	    return context.mmsi + " " + context.imo;
	});
	
	Handlebars.registerHelper('aisjson', function (context) {
	    return JSON.stringify(context);
	});
	
	var pluginName = 'AISSearch2',
	    toolbarIconId = 'AISSearch2',
	    modulePath = gmxCore.getModulePath(pluginName),
	    scheme = document.location.href.replace(/^(https?:).+/, "$1"),
	    baseUrl = window.serverBase || scheme + '//maps.kosmosnimki.ru/',
	
	//aisServiceUrl = scheme + "//localhost/GM/Plugins/AIS/",
	aisServiceUrl = baseUrl + "Plugins/AIS/",
	    infoDialogCascade = [],
	    allIinfoDialogs = [],
	    myFleetLayers = [],
	    layersWithBaloons = [],
	
	//aisLayerID,
	//aisLastPoint,
	tracksLayerID,
	    aisLayer,
	
	//screenSearchLayer,
	tracksLayer,
	    displaingTrack,
	    defaultSearch,
	    highlight = L.marker([0, 0], { icon: L.icon({ className: "ais_highlight-icon", iconAnchor: [12, 12], iconSize: [25, 25], iconUrl: 'plugins/ais/aissearch/highlight.png' }), zIndexOffset: 1000 }),
	    publicInterface = {
	    pluginName: pluginName,
	    afterViewer: function afterViewer(params, map) {
	        var _params = L.extend({
	            // regularImage: 'ship.png',
	            // activeImage: 'active.png'
	        }, params),
	            path = gmxCore.getModulePath(pluginName),
	            layersByID = nsGmx.gmxMap.layersByID,
	            lmap = map;
	        layersWithBaloons = params.layersWithBaloons;
	        aisLayerSearcher.aisLayerID = params.aisLayer || '8EE2C7996800458AAF70BABB43321FA4';
	        aisLayerSearcher.aisLastPoint = params.aisLastPoint || '303F8834DEE2449DAF1DA9CD64B748FE';
	        aisLayer = layersByID[aisLayerSearcher.aisLayerID];
	        aisLayerSearcher.screenSearchLayer = params.searchLayer || '8EE2C7996800458AAF70BABB43321FA4';
	        tracksLayerID = params.tracksLayerID || '13E2051DFEE04EEF997DC5733BD69A15';
	        tracksLayer = layersByID[tracksLayerID];
	        defaultSearch = params.defaultSearch || 'screen';
	        toolbarIconId = params.toolbarIconId;
	        var setLocaleDate = function setLocaleDate(layer) {
	            if (layer) layer.bindPopup('').on('popupopen', function (e) {
	                //console.log(e.gmx.properties);
	                var result,
	                    re = /\[([^\[\]]+)\]/g,
	                    lastIndex = 0,
	                    template = "",
	                    str = e.gmx.templateBalloon,
	                    props = e.gmx.properties;
	                while ((result = re.exec(str)) !== null) {
	                    template += str.substring(lastIndex, result.index);
	                    if (props.hasOwnProperty(result[1])) if (result[1].search(/^ts_/) != -1) template += aisLayerSearcher.formatDate(new Date(props[result[1]] * 1000));else template += props[result[1]];
	                    //console.log(lastIndex+", "+result.index+" "+str.substring(lastIndex, result.index)+" "+props[result[1]]+" "+result[1])
	                    lastIndex = re.lastIndex;
	                }
	                template += str.substring(lastIndex);
	                //console.log(lastIndex+", "+re.lastIndex+" "+str.substring(lastIndex))
	                e.popup.setContent(template);
	            });
	        },
	            setLayerClickHandler = function setLayerClickHandler(layer) {
	            layer.removeEventListener('click');
	            layer.addEventListener('click', function (e) {
	                //console.log(e)
	                if (e.gmx && e.gmx.properties.hasOwnProperty("imo")) publicInterface.showInfo(e.gmx.properties);
	            });
	        },
	            forLayers = function forLayers(layer) {
	            if (layer) {
	                setLocaleDate(layer);
	                setLayerClickHandler(layer);
	            }
	        };
	        for (var key in params) {
	            if (key == "myfleet") {
	                myFleetLayers = params[key].split(",").map(function (id) {
	                    return id.replace(/\s/, "");
	                });
	                for (var i = 0; i < myFleetLayers.length; ++i) {
	                    forLayers(layersByID[myFleetLayers[i]]);
	                }
	            } else {
	                forLayers(layersByID[params[key]]);
	            }
	        }
	        myFleetMembersModel.mapLayers = myFleetLayers;
	        highlight.addEventListener('click', function (e) {
	            e.target.vessel && publicInterface.showInfo(e.target.vessel, true);
	        });
	        var iconOpt_mf = {
	            //id: toolbarIconId,
	            className: "VesselSearchTool",
	            togglable: true,
	            title: _gtxt('AISSearch2.caption')
	        };
	        if (toolbarIconId) iconOpt_mf.id = toolbarIconId;else iconOpt_mf.text = _gtxt('AISSearch2.capShort');
	
	        if (!lmap.options.svgSprite) {
	            L.extend(iconOpt, {
	                regularImageUrl: _params.regularImage.search(/^https?:\/\//) !== -1 ? _params.regularImage : path + _params.regularImage,
	                activeImageUrl: _params.activeImage.search(/^https?:\/\//) !== -1 ? _params.activeImage : path + _params.activeImage
	            });
	        }
	        var icon_mf = L.control.gmxIcon(iconOpt_mf).on('statechange', function (ev) {
	            if (ev.target.options.isActive) {
	                //console.log(icon_mf);
	                aisPluginPanel.show(icon_mf);
	            } else {
	                aisPluginPanel.hide();
	            }
	        });
	        lmap.addControl(icon_mf);
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
	        }
	    },
	    showInfo: function showInfo(vessel, getmore) {
	        var ind = polyFindIndex(allIinfoDialogs, function (d) {
	            return d.vessel.imo == vessel.imo && d.vessel.mmsi == vessel.mmsi;
	        });
	        if (ind >= 0) {
	            $(allIinfoDialogs[ind].dialog).parent().insertAfter($('.ui-dialog').eq($('.ui-dialog').length - 1));
	            return;
	        }
	
	        var dialog = createDialog({
	            vessel: vessel,
	            getmore: getmore, displaingTrack: displaingTrack,
	            closeFunc: function closeFunc(event) {
	                var ind = polyFindIndex(infoDialogCascade, function (d) {
	                    return d.id == dialog.id;
	                });
	                if (ind >= 0) infoDialogCascade.splice(ind, 1);
	                ind = polyFindIndex(allIinfoDialogs, function (d) {
	                    return d.dialog.id == dialog.id;
	                });
	                if (ind >= 0) allIinfoDialogs.splice(ind, 1);
	            },
	            aisLayerSearcher: aisLayerSearcher, publicInterface: publicInterface,
	            scheme: scheme, aisServiceUrl: aisServiceUrl,
	            aisView: aisView, myFleetMembersView: myFleetMembersView,
	            modulePath: modulePath,
	            gifLoader: gifLoader,
	            aisPluginPanel: aisPluginPanel
	        }, { // COMMANDS
	            openVesselInfoView: vesselInfoView.open,
	            showTrack: function showTrack(mmsiArr, bbox) {
	                var lmap = nsGmx.leafletMap,
	                    filterFunc = function filterFunc(args) {
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
	                if (aisLayer) {
	                    if (mmsiArr.length) {
	                        displaingTrack = mmsiArr[0];
	                        aisLayer.setFilter(filterFunc);
	                        if (!aisLayer._map) {
	                            lmap.addLayer(aisLayer);
	                        }
	                    } else {
	                        displaingTrack = false;
	                        aisLayer.removeFilter();
	                        lmap.removeLayer(aisLayer);
	                    }
	                }
	                if (tracksLayer) {
	                    if (mmsiArr.length) {
	                        tracksLayer.setFilter(filterFunc);
	                        if (!tracksLayer._map) {
	                            lmap.addLayer(tracksLayer);
	                        }
	                    } else {
	                        tracksLayer.removeFilter();
	                        lmap.removeLayer(tracksLayer);
	                    }
	                }
	            }
	        });
	
	        if (infoDialogCascade.length > 0) {
	            var pos = $(infoDialogCascade[infoDialogCascade.length - 1]).parent().position();
	            $(dialog).dialog("option", "position", [pos.left + 10, pos.top + 10]);
	        }
	
	        infoDialogCascade.push(dialog);
	        allIinfoDialogs.push({ vessel: vessel, dialog: dialog });
	        $(dialog).on("dialogdragstop", function (event, ui) {
	            var ind = polyFindIndex(infoDialogCascade, function (d) {
	                return d.id == dialog.id;
	            });
	            if (ind >= 0) infoDialogCascade.splice(ind, 1);
	        });
	    }
	};
	
	var svgLoader = '<div class="loader">' + '<svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="22px" height="22px" viewBox="0 0 50 50" style="enable-background:new 0 0 50 50;" xml:space="preserve">' + '<path opacity="0.2" fill="#000" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"/>' + '<g transform="rotate(180 25 25)">' + '<path opacity="0.2" fill="#000" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z"/>' + '</g>' + '<path fill="#000" d="M43.935,25.145c0-10.318-8.364-18.683-18.683-18.683c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615c8.072,0,14.615,6.543,14.615,14.615H43.935z">' + '<animateTransform attributeType="xml" attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.6s" repeatCount="indefinite"/>' + '</path>' + '</svg>' + '</div>',
	    gifLoader = '<img src="img/progress.gif">';
	
	var BaseView = __webpack_require__(7);
	var aisView = new BaseView({ publicInterface: publicInterface, highlight: highlight });
	
	var Searcher = __webpack_require__(8);
	var aisLayerSearcher = new Searcher({ baseUrl: baseUrl, aisServiceUrl: aisServiceUrl });
	
	var MyFleetModel = __webpack_require__(9);
	var myFleetMembersModel = new MyFleetModel({ baseUrl: baseUrl, aisLayerSearcher: aisLayerSearcher, polyFind: polyFind, polyFindIndex: polyFindIndex });
	
	var ScreenSearchModel = __webpack_require__(10);
	var aisScreenSearchModel = new ScreenSearchModel({ myFleetMembersModel: myFleetMembersModel, aisLayerSearcher: aisLayerSearcher });
	
	var DbSearchModel = __webpack_require__(11);
	var aisDbSearchModel = new DbSearchModel({ myFleetMembersModel: myFleetMembersModel, aisLayerSearcher: aisLayerSearcher });
	
	var SearchView = __webpack_require__(12);
	var aisSearchView = new SearchView({ aisView: aisView, aisScreenSearchModel: aisScreenSearchModel, aisDbSearchModel: aisDbSearchModel, highlight: highlight });
	
	var MyFleetView = __webpack_require__(13);
	var myFleetMembersView = new MyFleetView({ aisView: aisView, myFleetMembersModel: myFleetMembersModel });
	
	var VesselInfoView = __webpack_require__(14);
	var vesselInfoView = new VesselInfoView({ modulePath: modulePath, aisServiceUrl: aisServiceUrl, scheme: scheme });
	
	//************************************
	//  AIS PANEL
	//************************************
	var aisPluginPanel = {
	    _canvas: _div(null),
	    _leftMenuBlock: null,
	    _activeView: aisSearchView,
	    getActiveView: function getActiveView() {
	        return this._activeView;
	    },
	    show: function show(icon) {
	        if (!this._leftMenuBlock) this._leftMenuBlock = new leftMenu();
	        if (!this._leftMenuBlock.createWorkCanvas("aispanel", function () {
	            icon._iconClick();
	        }, { path: [_gtxt('AISSearch2.caption')] })) {
	
	            var tabsTemplate = '<table class="ais_tabs" border=0><tr>' + '<td class="ais_tab search_tab">' + '{{i "AISSearch2.title"}}' + '</td><td class="ais_tab myfleet_tab active">' + // ACTIVE
	            '{{i "AISSearch2.myFleetDialog"}}' + '</td>' + '</tr></table>' + '<div class="ais_view search_view">' + '<table border=0 class="instruments"><tr>' + '<td><div><i class="icon-down-dir"><select>' + (defaultSearch == 'screen' ? '<option value="0">{{i "AISSearch2.screen"}}</option>' + '<option value="1">{{i "AISSearch2.database"}}</option>' : '<option value="1">{{i "AISSearch2.database"}}</option>' + '<option value="0">{{i "AISSearch2.screen"}}</option>') + '</select></i></div></td>' + '<td><div class="refresh clicable" title="{{i "AISSearch2.refresh"}}"><div>' + gifLoader + '</div></div></td>' + '<td><span class="count"></span></td></tr>' + '<tr><td colspan="3"><div class="filter"><input type="text" placeholder="{{i "AISSearch2.filter"}}"/><i class="icon-search clicable"></div></td></tr></table>' + '<div class="ais_vessels"><div class="ais_vessel">' + '<table><tr><td>NO VESSELS FOUND</td>' + '<td><div class="info">' + '<i class="clicable icon-info"></i>' + '</div></td></tr></table>' + '</div></div>' + '</div>' + '<div class="ais_view myfleet_view">' + '<table border=0 class="instruments"><tr>' + '<td><div class="refresh"><div>' + gifLoader + '</div></div></td><td></td><td></td>' + '</tr></table>' + '<div class="ais_vessels"><div class="ais_vessel">NO VESSELS SELECTED</div></div>' + '</div>';
	            $(this._canvas).append(Handlebars.compile(tabsTemplate));
	            $(this._leftMenuBlock.workCanvas).append(this._canvas);
	
	            var tabs = $('.ais_tab', this._canvas),
	                views = [aisSearchView, myFleetMembersView];
	            var _this = this;
	            tabs.on('click', function () {
	                if (!$(this).is('.active')) {
	                    var target = this;
	                    tabs.each(function (i, tab) {
	                        if (!$(tab).is('.active') && target == tab) {
	                            $(tab).addClass('active');
	                            views[i].show();
	                            _this._activeView = views[i];
	                        } else {
	                            $(tab).removeClass('active');
	                            views[i].hide();
	                        }
	                    });
	                }
	            });
	
	            aisSearchView.create({
	                _frame: $('.search_view', this._canvas),
	                _container: $('.search_view .ais_vessels', this._canvas),
	                _refresh: $('.search_view .refresh div', this._canvas),
	                _search: $('.filter', this._canvas),
	                _count: $('.count', this._canvas)
	            });
	            aisSearchView.setModel(defaultSearch);
	
	            myFleetMembersView.create({
	                _frame: $('.myfleet_view', this._canvas),
	                _container: $('.myfleet_view .ais_vessels', this._canvas),
	                _refresh: $('.myfleet_view .refresh div', this._canvas)
	            });
	
	            var needUpdate = function needUpdate() {
	                aisScreenSearchModel.setDirty();
	                if (this._activeView === aisSearchView) {
	                    aisSearchView.show();
	                }
	            };
	            nsGmx.leafletMap.on('moveend', needUpdate.bind(this));
	            nsGmx.widgets.commonCalendar.getDateInterval().on('change', needUpdate.bind(this));
	        }
	        $(this._leftMenuBlock.parentWorkCanvas).attr('class', 'left_aispanel').insertAfter('.layers-before');
	        var blockItem = this._leftMenuBlock.leftPanelItem,
	            blockTitle = $('.leftmenu-path', blockItem.panelCanvas);
	        var toggleTitle = function toggleTitle() {
	            if (blockItem.isCollapsed()) blockTitle.show();else blockTitle.hide();
	        };
	        $(blockItem).on('changeVisibility', toggleTitle);
	        toggleTitle();
	
	        // Show the first tab
	        $('.ais_tab', this._canvas).eq(0).removeClass('active').click();
	        aisSearchView.drawBackground();
	        myFleetMembersView.drawBackground();
	    },
	    hide: function hide() {
	        $(this._leftMenuBlock.parentWorkCanvas).hide();
	        nsGmx.leafletMap.removeLayer(highlight);
	    }
	};
	
	gmxCore.addModule(pluginName, publicInterface, {
	    css: pluginName + '.css'
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
	    'AISSearch2.lat': 'Широта'
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
	    'AISSearch2.lat': 'Latitude'
	});

/***/ }),
/* 4 */
/***/ (function(module, exports) {

	"use strict";
	
	module.exports = {
		polyFind: function polyFind(a, predicate) {
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
		polyFindIndex: function polyFindIndex(a, predicate) {
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
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	
	__webpack_require__(6);
	
	var addUnit = function addUnit(v, u) {
		return v != null && v != "" ? v + u : "";
	},
	    formatDate = void 0,
	    formatVessel = function formatVessel(vessel) {
		vessel.ts_pos_utc = formatDate(new Date(vessel.ts_pos_utc * 1000));
		vessel.ts_eta = formatDate(new Date(vessel.ts_eta * 1000));
		vessel.cog = addUnit(vessel.cog, "°");
		vessel.sog = addUnit(vessel.sog, " уз");
		vessel.rot = addUnit(vessel.rot, "°/мин");
		vessel.heading = addUnit(vessel.heading, "°");
		vessel.draught = addUnit(vessel.draught, " м");
		vessel.length = addUnit(vessel.length, " м");
		vessel.width = addUnit(vessel.width, " м");
		vessel.source = vessel.source == 'T-AIS' ? _gtxt('AISSearch2.tais') : _gtxt('AISSearch2.sais');
		return vessel;
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
		    scheme = _ref.scheme,
		    modulePath = _ref.modulePath,
		    gifLoader = _ref.gifLoader,
		    aisView = _ref.aisView,
		    displaingTrack = _ref.displaingTrack,
		    myFleetMembersView = _ref.myFleetMembersView,
		    aisPluginPanel = _ref.aisPluginPanel;
	
	
		formatDate = aisLayerSearcher.formatDate;
	
		var canvas = $('<div class="ais_myfleet_dialog"/>'),
		    menu = $('<div class="column1 menu"></div>').appendTo(canvas),
		    photo = $('<div class="photo"><div></div></div>').appendTo(menu),
		    moreinfo = $('<div class="moreinfo"><div></div></div>').appendTo(menu),
		    content = Handlebars.compile('<div class="column2 content">' + '</div>')(vessel),
		    buttons = $('<div class="column3 buttons"></div>');
		//console.log(content);
	
		canvas.append(content).append(buttons);
	
		var dialog = showDialog(vessel.vessel_name, canvas[0], { width: 610, height: 230, closeFunc: closeFunc }),
		    vessel2 = void 0,
		    moreInfo = function moreInfo(v) {
			var smallShipIcon = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="14px" height="14px" viewBox="0 0 14 14" style="margin-left: 10px" xml:space="preserve">' + '<g style="fill: #48aff1;">' + '<path class="st0" d="M13.4,11H0.6c-0.2,0-0.4,0.1-0.5,0.3c-0.1,0.2-0.1,0.4,0,0.6l1.2,1.8C1.4,13.9,1.6,14,1.8,14h9.9   c0.2,0,0.3-0.1,0.4-0.2l1.7-1.8c0.2-0.2,0.2-0.4,0.1-0.7C13.9,11.1,13.7,11,13.4,11z"/>' + '<path class="st0" d="M9.3,9.7h2.9c0.2,0,0.4-0.1,0.5-0.3c0.1-0.2,0.1-0.4,0-0.6L9.8,4.5C9.7,4.3,9.4,4.2,9.2,4.3   C8.9,4.4,8.7,4.6,8.7,4.9v4.3C8.7,9.5,9,9.7,9.3,9.7z"/>' + '<path class="st0" d="M1.2,9.7H7c0.3,0,0.6-0.3,0.6-0.6V0.6c0-0.3-0.2-0.5-0.4-0.6C6.9-0.1,6.7,0,6.5,0.3L0.7,8.8   C0.6,9,0.5,9.2,0.6,9.4C0.7,9.6,0.9,9.7,1.2,9.7z"/>' + '</g>' + '</svg>',
			    vesselPropTempl = '<div class="vessel_prop vname"><b>{{vessel_name}}</b>' + smallShipIcon + '</div>' + '<div class="vessel_prop"><b>&nbsp;' + (vessel2.registry_name ? vessel2.registry_name : '') + '</b></div>';
	
			$('.content', canvas).append(Handlebars.compile('<div class="vessel_props1">' + vesselPropTempl + '<div class="vessel_prop">Тип судна: <b>{{vessel_type}}</b></div>' + '<div class="vessel_prop">Флаг: <b>{{flag_country}}</b></div>' + '<div class="vessel_prop">IMO: <b>{{imo}}</b></div>' + '<div class="vessel_prop">MMSI: <b>{{mmsi}}</b></div>' + '<div class="vessel_prop">{{i "AISSearch2.source"}}: <b>{{source}}</b></div>' + '</div>')(v));
	
			$('.content', canvas).append(Handlebars.compile('<div class="vessel_props2">' + vesselPropTempl + '<div class="vessel_prop">COG / SOG: <b>{{cog}} / {{sog}}</b></div>' + '<div class="vessel_prop">HDG / ROT: <b>{{heading}} / {{rot}}</b></div>' + '<div class="vessel_prop">{{i "AISSearch2.draught"}}: <b>{{draught}}</b></div>' + '<div class="vessel_prop">{{i "AISSearch2.destination"}}: <b>{{destination}}</b></div>' + '<div class="vessel_prop">{{i "AISSearch2.nav_status"}}: <b>{{nav_status}}</b></div>' + '</div>')(v));
	
			$(moreinfo).append('<table><tr>' + '<td class="ais_refresh"><svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" height="16" width="16"><g class="nc-icon-wrapper" fill="#444444"><polyline data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 15,16 7,16 7,13 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 15,18 17,16 15,14 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" data-stroke="none" fill="#444444" points="15,18 17,16 15,14 " stroke-linejoin="miter" stroke-linecap="square" style="stroke: currentColor;fill: currentColor;"/> <polyline data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 9,8 17,8 17,11 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points="9,6 7,8 9,10 " stroke-linejoin="miter" style="stroke: currentColor;"/> <polygon data-color="color-2" data-stroke="none" fill="#444444" points="9,6 7,8 9,10 " stroke-linejoin="miter" stroke-linecap="square" style="stroke: currentColor;fill: currentColor;"/> <rect x="2" y="1" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" width="20" height="22" stroke-linejoin="miter" style="stroke: currentColor;"/></g></svg></td>' + '<td><div class="vessel_prop coordinates"><span class="small">' + v.latitude + '° ' + (v.latitude < 0 ? 'S' : 'N') + ' ' + v.longitude + '° ' + (v.longitude < 0 ? 'W' : 'E') + '</small></div></td>' + '</tr></table>');
	
			var swap = "<span class='small'>" + ddToDms(v.latitude, false) + " " + ddToDms(v.longitude, true) + "</span>";
			$('.ais_refresh', moreinfo).click(function (e) {
				var mi = $('.coordinates', moreinfo),
				    t = mi.html();
				mi.html(swap);
				swap = t;
			});
	
			$('.vessel_props2', canvas).hide();
		};
	
		if (!getmore) {
			vessel2 = $.extend({}, vessel);
			moreInfo(formatVessel(vessel2));
		} else aisLayerSearcher.searchNames([{ mmsi: vessel.mmsi, imo: vessel.imo }], function (response) {
			if (parseResponse(response)) {
				vessel2 = {};
				for (var i = 0; i < response.Result.fields.length; ++i) {
					vessel2[response.Result.fields[i]] = response.Result.values[0][i];
				} //console.log(vessel2.registry_name)
				moreInfo(formatVessel(vessel2));
			} else console.log(response);
		});
	
		// IMAGE
		$('<img src="' + scheme + '//photos.marinetraffic.com/ais/showphoto.aspx?size=thumb&mmsi=' + vessel.mmsi + '">').load(function () {
			if (this) $('div', photo).replaceWith(this);
		});
	
		// BUTTONS
		var menubuttons = $('<div class="menubuttons"></div>').appendTo(buttons);
	
		var openpage = $('<div class="button openpage" title="информация о судне">' + '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' + '<g class="nc-icon-wrapper" style="fill:currentColor">' + '<path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z"/>' + '</g>' + '</svg>' + '</div>').appendTo(menubuttons).on('click', function () {
			return commands.openVesselInfoView.call(null, vessel, vessel2);
		});
	
		var showpos = $('<div class="button showpos" title="показать положение">' + '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" width="20" height="20"><g class="nc-icon-wrapper" fill="#444444"><polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 1,7 1,1 7,1 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 17,1 23,1 23,7 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 23,17 23,23 17,23 " stroke-linejoin="miter"/> <polyline style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" points=" 7,23 1,23 1,17 " stroke-linejoin="miter"/> <rect style="stroke:currentColor" x="8" y="8" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" width="8" height="8" stroke-linejoin="miter"/></g></svg>' + '</div>').appendTo(menubuttons).on('click', function () {
			var showVessel = {
				xmin: vessel.xmin ? vessel.xmin : vessel.longitude,
				xmax: vessel.xmax ? vessel.xmax : vessel.longitude,
				ymin: vessel.ymin ? vessel.ymin : vessel.latitude,
				ymax: vessel.ymax ? vessel.ymax : vessel.latitude,
				ts_pos_utc: vessel.ts_pos_utc && !isNaN(vessel.ts_pos_utc) ? aisLayerSearcher.formatDate(new Date(vessel.ts_pos_utc * 1000)) : vessel.ts_pos_utc
				//nsGmx.leafletMap.removeLayer(highlight);
				//highlight.setLatLng([showVessel.ymax, showVessel.xmax]).addTo(nsGmx.leafletMap);
			};aisView.positionMap(showVessel);
		});
		//if (tracksLayer){
		var templ = '<div class="button showtrack" title="' + _gtxt('AISSearch2.show_track') + '">' + '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 24 24" xml:space="preserve" width="20" height="20"><g class="nc-icon-wrapper" fill="#444444"><path style="stroke:currentColor" data-color="color-2" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" d="M4,13V5 c0-2.209,1.791-4,4-4h0c2.209,0,4,1.791,4,4v14c0,2.209,1.791,4,4,4h0c2.209,0,4-1.791,4-4v-8" stroke-linejoin="miter"/> <circle style="stroke:currentColor" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" cx="20" cy="4" r="3" stroke-linejoin="miter"/> <circle style="stroke:currentColor" fill="none" stroke="#444444" stroke-width="2" stroke-linecap="square" stroke-miterlimit="10" cx="4" cy="20" r="3" stroke-linejoin="miter"/></g></svg>' + '</div>',
		    showtrack = $(templ).appendTo(menubuttons).on('click', function () {
			if (showtrack.attr('title') != _gtxt('AISSearch2.hide_track')) {
				$('.showtrack').attr('title', _gtxt('AISSearch2.show_track')).removeClass('active');
				commands.showTrack.call(null, [vessel.mmsi]);
				showtrack.attr('title', _gtxt('AISSearch2.hide_track')).addClass('ais active');
			} else {
				$('.showtrack').attr('title', _gtxt('AISSearch2.show_track')).removeClass('ais active');
				commands.showTrack.call(null, []);
			}
		});
		if (!displaingTrack || displaingTrack != vessel.mmsi) {
			showtrack.attr('title', _gtxt('AISSearch2.show_track'));
		} else {
			showtrack.attr('title', _gtxt('AISSearch2.hide_track')).addClass('ais active');
		}
		//}
	
	
		var myFleetMembersModel = myFleetMembersView.model,
		    addremoveIcon = function addremoveIcon(add) {
			return add ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g class="nc-icon-wrapper" fill="#444444" style="fill: currentColor;"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9h-4v4h-2v-4H9V9h4V5h2v4h4v2z"/></g></svg>' : '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="24px" height="24px" viewBox="0 0 24 24" style="enable-background:new 0 0 24 24;fill: currentColor;" xml:space="preserve"><g><path class="st0" d="M4,6H2v14c0,1.1,0.9,2,2,2h14v-2H4V6z M20,2H8C6.9,2,6,2.9,6,4v12c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4    C22,2.9,21.1,2,20,2z M19,11h-4v4h-2v-4H9V9h4V5h2v4h4V11z"/></g><rect x="9" y="5" class="st0" width="10" height="4"/><rect x="9" y="11" class="st0" width="10" height="4"/></g></svg>';
		};
		if (myFleetMembersModel && myFleetMembersModel.data && myFleetMembersModel.data.vessels) {
			var add = myFleetMembersModel.findIndex(vessel) < 0,
			    addremove = $('<div class="button addremove">' + addremoveIcon(add) + '</div>')
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
					info.css('display', !add ? 'inline' : 'none');
	
					addremove.attr('title', add ? 'добавить в мой флот' : 'удалить из моего флота').html(addremoveIcon(add));
					//.css('background-image','url('+modulePath+'svg/'+(add?'add':'rem')+'-my-fleet.svg)')
	
					progress.text('');
					$('.addremove').removeClass('disabled').show();
	
					if (aisPluginPanel.getActiveView() == myFleetMembersView) myFleetMembersView.show();
				});
			});
		}
	
		var progress = $('<div class="progress"></div>').appendTo(menubuttons);
	
		// TITLEBAR	
		canvas.parent('div').css({ 'margin': '0', 'overflow': 'hidden' });
		var titlebar = $(dialog).parent().find('.ui-dialog-titlebar').css('padding', '0').html('<table class="ais_info_dialog_titlebar">' + '<tr><td><div class="date"><span>Последний сигнал:</span>' + Handlebars.compile('<br>{{{ts_pos_utc}}}')(vessel2) + '</div></td>' + '<td><div class="switch on">Общие сведения</div></td>' + '<td><div class="switch">Параметры судна</div></td>' + '<td id="closebut"><div class="ais_info_dialog_close-button" title="закрыть"></div></td></tr>' + '</table>');
	
		$('.ais_info_dialog_close-button', titlebar).on('click', function () {
			return $(dialog).dialog("close");
		});
		$('.switch', titlebar).eq(0).on('click', function (e) {
			$('.switch', titlebar).removeClass('on');$(e.currentTarget).addClass('on');$('.vessel_props1', canvas).show();$('.vessel_props2', canvas).hide();
		});
		$('.switch', titlebar).eq(1).on('click', function (e) {
			$('.switch', titlebar).removeClass('on');$(e.currentTarget).addClass('on');$('.vessel_props2', canvas).show();$('.vessel_props1', canvas).hide();
		});
	
		return dialog;
	};

/***/ }),
/* 6 */
/***/ (function(module, exports) {

	// removed by extract-text-webpack-plugin

/***/ }),
/* 7 */
/***/ (function(module, exports) {

	'use strict';
	
	//************************************
	//  BASE AIS VIEW
	//************************************
	
	module.exports = function (_ref) {
	    var publicInterface = _ref.publicInterface,
	        highlight = _ref.highlight;
	
	    return {
	        get model() {
	            return this._model;
	        },
	        _calcHeight: function _calcHeight() {
	            return ($('.ais_vessel')[0].getBoundingClientRect().height + 5) * 5 - 5;
	        },
	        drawBackground: function drawBackground() {
	            this._clean();
	        },
	        _clean: function _clean() {
	            $('.info', this._container).off('click');
	            $('.position', this._container).off('click');
	            if ($('.mCSB_container', this._container)[0]) $('.mCSB_container', this._container).empty();else $(this._container).empty();
	            if (this._doClean) this._doClean();
	        },
	        create: function create(controls) {
	            $.extend(this, controls);
	            $(this._container).height(this._calcHeight());
	            if (this._bindControlEvents) this._bindControlEvents();
	
	            if ($('.icon-down-dir', this._frame)[0] && $('.icon-down-dir', this._frame).height() == 34) $('.icon-down-dir', this._frame).css({ position: 'relative', top: '2px' });
	        },
	        _waitTime: 1000,
	        show: function show() {
	            this._start = new Date().getTime();
	
	            //if(clean) this._clean();
	            $(this._frame).show();
	
	            var _this = this;
	            clearTimeout(this._wait);
	            var rest = new Date().getTime() - this._lastUpdate;
	            //console.log(rest) 
	            //this._refresh.parent().removeClass('clicable');
	            //this._refresh.parent().attr('title', ''); 
	
	            //this._refresh.addClass('animate-spin');
	            this._refresh.show();
	
	            if (!this._lastUpdate || rest >= this._waitTime) {
	                this._lastUpdate = new Date().getTime();
	                this._model.update();
	            } else {
	                this._wait = setTimeout(function () {
	                    _this._lastUpdate = new Date().getTime();
	                    _this._model.update();
	                }, this._waitTime - rest);
	            }
	        },
	        hide: function hide() {
	            $(this._frame).hide();
	        },
	        positionMap: function positionMap(vessel) {
	            //console.log(vessel);
	            if (vessel.ts_pos_utc) {
	                var d = new Date(vessel.ts_pos_utc.replace(/(\d\d).(\d\d).(\d\d\d\d).+/, "$3-$2-$1")),
	                    interval = nsGmx.DateInterval.getUTCDayBoundary(d);
	                nsGmx.widgets.commonCalendar.setDateInterval(interval.dateBegin, interval.dateEnd);
	            }
	
	            nsGmx.leafletMap.fitBounds([[vessel.ymin, vessel.xmin], [vessel.ymax, vessel.xmax]], {
	                maxZoom: 9, //config.user.searchZoom,
	                animate: false
	            });
	
	            nsGmx.leafletMap.removeLayer(highlight);
	            highlight.vessel = vessel;
	            highlight.setLatLng([vessel.ymax, vessel.xmax]).addTo(nsGmx.leafletMap);
	        },
	        showPosition: function showPosition(item) {
	            var vessel = JSON.parse(item.parent().parent().find('.info').attr('vessel'));
	            if (vessel.maxid && vessel.xmax != vessel.xmin && vessel.ymax != vessel.ymin) {
	                var _this = this;
	                // search latest position in group 
	                aisLayerSearcher.searchById([vessel.maxid], function (response) {
	                    if (response.Status.toLowerCase() == "ok") {
	                        vessel.ymin = response.Result.values[0][5];vessel.xmin = response.Result.values[0][4];
	                        vessel.ymax = response.Result.values[0][5];vessel.xmax = response.Result.values[0][4];
	                        item.parent().parent().find('.info').attr('vessel', JSON.stringify(vessel));
	                        _this.positionMap(vessel);
	                    } else {
	                        console.log(response);
	                    }
	                });
	            } else this.positionMap(vessel);
	        },
	        repaint: function repaint() {
	
	            if (!$(this._container).is(':visible')) return;
	
	            //console.log("REPAINT "+(new Date().getTime()-this._start)+"ms")
	
	            //this._refresh.removeClass('animate-spin');
	            this._refresh.hide();
	            //this._refresh.parent().addClass('clicable');
	            //this._refresh.parent().attr('title', _gtxt('AISSearch2.refresh'));
	
	            this._clean();
	
	            //console.log(this._model.data);
	            var scrollCont = $(this._container).find('.mCSB_container');
	            var content = $(Handlebars.compile(this._tableTemplate)(this._model.data));
	            //console.log(content);
	            if (!scrollCont[0]) {
	                $(this._container).append(content).mCustomScrollbar();
	            } else {
	                $(scrollCont).append(content);
	            }
	            var _this = this;
	            $('.info', this._container).on('click', function () {
	                publicInterface.showInfo(JSON.parse($(this).attr('vessel')), true);
	            });
	            $('.position', this._container).on('click', function () {
	                _this.showPosition($(this));
	            });
	            if (this._repaintControls) this._repaintControls();
	        }
	    };
	};

/***/ }),
/* 8 */
/***/ (function(module, exports) {

	'use strict';
	
	//************************************
	// AIS LAYERS SEARCHER
	//************************************
	
	module.exports = function (_ref) {
	    var baseUrl = _ref.baseUrl,
	        aisServiceUrl = _ref.aisServiceUrl,
	        aisLastPoint = _ref.aisLastPoint,
	        screenSearchLayer = _ref.screenSearchLayer,
	        aisLayerID = _ref.aisLayerID;
	
	    return {
	        _serverScript: baseUrl + 'VectorLayer/Search.ashx',
	
	        set aisLastPoint(value) {
	            aisLastPoint = value;
	        },
	        set aisLayerID(value) {
	            aisLayerID = value;
	        },
	        set screenSearchLayer(value) {
	            screenSearchLayer = value;
	        },
	        get aisLayerID() {
	            return aisLayerID;
	        },
	
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
	                    geo = { type: 'MultiPolygon', coordinates: [[[[-180, min.y], [-180, max.y], [maxX, max.y], [maxX, min.y], [-180, min.y]]], [[[minX + 360, min.y], [minX + 360, max.y], [180, max.y], [180, min.y], [minX + 360, min.y]]]]
	                    };
	                } else if (maxX > 180) {
	                    geo = { type: 'MultiPolygon', coordinates: [[[[minX, min.y], [minX, max.y], [180, max.y], [180, min.y], [minX, min.y]]], [[[-180, min.y], [-180, max.y], [maxX - 360, max.y], [maxX - 360, min.y], [-180, min.y]]]]
	                    };
	                }
	            }
	            return geo;
	        },
	        formatDate: function formatDate(d, local) {
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
	        searchById: function searchById(aid, callback) {
	            //console.log("searchById");
	            var request = {
	                WrapStyle: 'window',
	                layer: aisLayerID, //'8EE2C7996800458AAF70BABB43321FA4'
	                columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"longitude"},{"Value":"latitude"}]',
	                query: "([id] IN (" + aid.join(',') + "))"
	            };
	            L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);
	        },
	        searchString: function searchString(_searchString, isfuzzy, callback) {
	            //console.log(aisLastPoint+", "+aisLayerID)
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
	                layer: aisLastPoint,
	                columns: '[{"Value":"vessel_name"},{"Value":"mmsi"},{"Value":"imo"},{"Value":"ts_pos_utc"},{"Value":"longitude"},{"Value":"latitude"}]',
	                orderdirection: 'desc',
	                orderby: 'ts_pos_utc',
	                query: query
	            };
	            if (isfuzzy) request.pagesize = 1000;
	            L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);
	        },
	        searchNames: function searchNames(avessels, callback) {
	            var request = {
	                WrapStyle: 'window',
	                layer: aisLastPoint,
	                orderdirection: 'desc',
	                orderby: 'ts_pos_utc',
	                query: avessels.map(function (v) {
	                    return "([mmsi]=" + v.mmsi + (v.imo && v.imo != "" ? " and [imo]=" + v.imo : "") + ")";
	                }).join(" or ")
	                //([mmsi] IN (" + ammsi.join(',') + "))"+
	                //"and ([imo] IN (" + aimo.join(',') + "))"
	            };
	            //console.log(request)
	            L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);
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
	            L.gmxUtil.sendCrossDomainPostRequest(aisServiceUrl + "SearchScreen.ashx", { WrapStyle: 'window', s: dt1.toJSON(), e: dt2.toJSON(), minx: min.x, miny: min.y, maxx: max.x, maxy: max.y, layer: screenSearchLayer }, callback);
	        },
	        searchByCoords: function searchByCoords(x, y) {
	            //VectorLayer/Search.ashx?layer=2AA3504D346343A1A5505BDC75D96EC2&pagesize=1&query=longitude>=129.052004 and  longitude<=129.052006 and latitude>=35.01017333332 and latitude<=35.01017333334
	            var x = x.toString(),
	                y = y.toString();
	            var request = {
	                WrapStyle: 'window',
	                layer: aisLayer,
	                query: "longitude>=" + x.replace(/(\d)$/, parseInt(x.slice(-1)) - 1) + " and  longitude<=" + x.replace(/(\d)$/, parseInt(x.slice(-1)) + 1) + " and latitude>=" + y.replace(/(\d)$/, parseInt(y.slice(-1)) - 1) + " and latitude<=" + y.replace(/(\d)$/, parseInt(y.slice(-1)) + 1)
	            };
	            console.log(request);
	            //L.gmxUtil.sendCrossDomainPostRequest(this._serverScript, request, callback);			
	        }
	    };
	};

/***/ }),
/* 9 */
/***/ (function(module, exports) {

	"use strict";
	
	//************************************
	// MY FLEET MODEL
	//************************************
	
	module.exports = function (_ref) {
	    var baseUrl = _ref.baseUrl,
	        myFleetLayers = _ref.myFleetLayers,
	        aisLayerSearcher = _ref.aisLayerSearcher,
	        myFleetMembersView = _ref.myFleetMembersView,
	        polyFind = _ref.polyFind,
	        polyFindIndex = _ref.polyFindIndex;
	
	    return {
	        set view(value) {
	            myFleetMembersView = value;
	        },
	        set mapLayers(value) {
	            myFleetLayers = value;
	        },
	        get mapLayers() {
	            return myFleetLayers;
	        },
	
	        findIndex: function findIndex(vessel) {
	            return polyFindIndex(this.data.vessels, function (v) {
	                return v.mmsi == vessel.mmsi && v.imo == vessel.imo;
	            });
	        },
	
	        _isDirty: true,
	        getDirty: function getDirty() {
	            return this._isDirty;
	        },
	        setDirty: function setDirty() {
	            this._isDirty = true;
	        },
	        _parseFilter: function _parseFilter(filter) {
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
	        },
	        getCount: function getCount() {
	            return this.data ? this.data.vessels.length : 0;
	        },
	        layers: [],
	        load: function load() {
	            var _this = this;
	            //var layerId = myFleetLayers
	
	            if (myFleetLayers.length == 0) this.data = { msg: [{ txt: _gtxt("AISSearch2.nomyfleet") }] };
	
	            if (myFleetLayers.length == 0 || !this._isDirty) return Promise.resolve();
	
	            this.layers = [];
	            var errors = [],
	                promises = myFleetLayers.map(function (lid) {
	                return new Promise(function (resolve, reject) {
	                    sendCrossDomainJSONRequest(baseUrl + "Layer/GetLayerInfo.ashx?NeedAttrValues=false&LayerName=" + lid, function (response) {
	                        //console.log(response);                         
	                        if (response.Status.toLowerCase() == "ok") _this.layers.push({ layerId: lid, parentLayerId: response.Result.ParentLayer, filter: response.Result.Filter });else errors.push(response);
	                        resolve(response);
	                    });
	                });
	            });
	
	            return Promise.all(promises).then(function () {
	                //console.log(_this.layers)                                    
	                if (_this.layers.length > 0) {
	                    var layer = polyFind(_this.layers, function (l) {
	                        return l.parentLayerId != '13E2051DFEE04EEF997DC5733BD69A15' && l.filter != "(1=0)";
	                    }); // NOT TRACKS
	                    //console.log(layer)      
	                    if (!layer) return Promise.resolve({ Status: "ok", Result: { values: [] } });
	                    //console.log(layer.filter)                                    
	                    var vessels = _this._parseFilter(layer.filter);
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
	                                p.push({ vessel_name: c[vessel_name], mmsi: c[mmsi], imo: c[imo], ts_pos_utc: aisLayerSearcher.formatDate(d),
	                                    xmin: c[lat], xmax: c[lat], ymin: c[lon], ymax: c[lon] });
	                            }
	                            return p;
	                        }, []) };
	                    _this.data.vessels.sort(function (a, b) {
	                        return +(a.vessel_name > b.vessel_name) || +(a.vessel_name === b.vessel_name) - 1;
	                    });
	                    _this._isDirty = false;
	                    return Promise.resolve();
	                } else {
	                    return Promise.reject(response);
	                }
	            });
	        },
	        update: function update() {
	            var _this = this;
	            this._actualUpdate = new Date();
	            var actualUpdate = this._actualUpdate;
	            this.load().then(function () {
	                //console.log(_this.layers)
	                if (_this._actualUpdate == actualUpdate) myFleetMembersView.repaint();
	            }, function (response) {
	                _this.data = null;
	                if (response.Status.toLowerCase() == "auth" || response.ErrorInfo && response.ErrorInfo.some && response.ErrorInfo.some(function (r) {
	                    return r.Status.toLowerCase() == "auth";
	                })) _this.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], vessels: [] };else {
	                    console.log(response);
	                }
	                myFleetMembersView.repaint();
	            });
	        },
	        markMembers: function markMembers(vessels) {
	            if (this.data && this.data.vessels) this.data.vessels.forEach(function (v) {
	                var member = polyFind(vessels, function (vv) {
	                    return v.mmsi == vv.mmsi && v.imo == v.imo;
	                });
	                if (member) member.mf_member = "display:inline";
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
	                layer.filter = _this.data.vessels.length == 0 ? "(1=0)" : _this.data.vessels.map(function (v) {
	                    return layer.parentLayerId != '13E2051DFEE04EEF997DC5733BD69A15' ? // IS TRACKS
	                    "([mmsi]=" + v.mmsi + " and [imo]=" + v.imo + ")" : "([mmsi]=" + v.mmsi + ")";
	                }).join(" or ");
	
	                /*
	                        var editFilter = layer.parentLayerId!='13E2051DFEE04EEF997DC5733BD69A15'? // IS TRACKS
	                        "([mmsi]="+vessel.mmsi+" and [imo]="+vessel.imo+")":
	                        "([mmsi]="+vessel.mmsi+")";
	                        if(layer.filter.search(/(mmsi|imo)/i)!=-1){
	                              var conditions = layer.filter.replace(/\( *(\(.+\)) *\).*$/, "$1").split(" or "),
	                            pos = conditions.indexOf(editFilter);
	                //console.log(conditions)
	                            if (pos!=-1)
	                                conditions.splice(pos, 1);
	                            else
	                                conditions.push(editFilter);
	                            if (conditions.length>0)
	                                layer.filter = conditions.join(" or ");
	                            else
	                                layer.filter = "(1=0)";
	                        }
	                        else{
	                            layer.filter = editFilter;
	                        }
	                */
	                var today = new Date(new Date() - 3600 * 24 * 7 * 1000);
	                today = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2);
	                if (layer.parentLayerId != '13E2051DFEE04EEF997DC5733BD69A15') layer.filter = "(" + layer.filter + ") and [ts_pos_utc]>='" + today + "'";else layer.filter = "(" + layer.filter + ") and [Date]>='" + today + "'";
	                //console.log(layer.filter)
	            });
	            return Promise.all(this.layers.map(function (l) {
	                /* return new Promise(function(resolve){
	                    var t = setTimeout(function(){
	                        resolve();
	                    }, 1000);
	                });
	                */
	                return new Promise(function (resolve, reject) {
	                    sendCrossDomainJSONRequest(baseUrl + "VectorLayer/Update.ashx?VectorLayerID=" + l.layerId + "&filter=" + l.filter, function (response) {
	                        if (response.Status.toLowerCase() == "ok") setTimeout(function run() {
	
	                            sendCrossDomainJSONRequest(baseUrl + "AsyncTask.ashx?TaskID=" + response.Result.TaskID, function (response) {
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
	                this._isDirty = true;
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
/* 10 */
/***/ (function(module, exports) {

	"use strict";
	
	//************************************
	// AIS SCREEN SEARCH MODEL
	//************************************
	
	module.exports = function (_ref) {
	    var myFleetMembersModel = _ref.myFleetMembersModel,
	        aisLayerSearcher = _ref.aisLayerSearcher,
	        aisSearchView = _ref.aisSearchView;
	
	    return {
	
	        set view(value) {
	            aisSearchView = value;
	        },
	
	        _isDirty: true,
	        getDirty: function getDirty() {
	            return this._isDirty;
	        },
	        setDirty: function setDirty() {
	            this._isDirty = true;
	        },
	        getCount: function getCount() {
	            return this.data ? this.data.vessels.length : 0;
	        },
	        load: function load(actualUpdate) {
	            var _this = this;
	            if (!this._isDirty) {
	                return Promise.resolve();
	            }
	            return Promise.all([new Promise(function (resolve, reject) {
	                aisLayerSearcher.searchScreen({
	                    dateInterval: nsGmx.widgets.commonCalendar.getDateInterval(),
	                    border: true,
	                    group: true
	                }, function (json) {
	                    //console.log(json)
	                    if (json.Status.toLowerCase() == "ok") {
	                        _this.dataSrc = { vessels: json.Result.values.map(function (v) {
	                                return { vessel_name: v[0], mmsi: v[1], imo: v[2], mf_member: 'display:none',
	                                    xmin: v[4], xmax: v[5], ymin: v[6], ymax: v[7], maxid: v[3] };
	                            }) };
	                        if (_this._actualUpdate == actualUpdate) {
	                            //console.log("ALL CLEAN")
	                            //console.log("1>"+new Date(_this._actualUpdate))
	                            //console.log("2>"+new Date(actualUpdate))
	                            _this._isDirty = false;
	                        }
	                        resolve();
	                    } else {
	                        reject(json);
	                    }
	                    //console.log("LOAD SCREEN SEARCH DONE")
	                    //return resolve();
	                });
	            }), myFleetMembersModel.load()]);
	        },
	        _actualUpdate: new Date().getTime(),
	        filterString: "",
	        update: function update() {
	            var _this = this;
	            this._actualUpdate = new Date().getTime();
	            var actualUpdate = this._actualUpdate;
	            //this.filterString&&console.log(this.filterString+" "+this.filterString.search(/\r$/))
	            //this.filterString&&console.log(this.filterString.replace(/^\s+/, "").replace(/\s+\r*$/, "")!="")
	
	            this.load(actualUpdate).then(function () {
	                //console.log("LOADED "+(new Date().getTime()-_this._actualUpdate)+"ms")
	                //console.log("3>"+new Date(_this._actualUpdate))
	                //console.log("4>"+new Date(actualUpdate))
	                if (_this._actualUpdate == actualUpdate) {
	                    _this.filterString = _this.filterString.replace(/\r+$/, "");
	                    if (_this.dataSrc) if (_this.filterString != "") {
	                        _this.data = { vessels: _this.dataSrc.vessels.filter(function (v) {
	                                return v.vessel_name.search(new RegExp("\\b" + _this.filterString, "ig")) != -1;
	                            }) };
	                    } else {
	                        _this.data = { vessels: _this.dataSrc.vessels.map(function (v) {
	                                return v;
	                            }) };
	                    }
	
	                    if (_this.data) myFleetMembersModel.markMembers(_this.data.vessels);
	                    aisSearchView.repaint();
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
	                aisSearchView.repaint();
	            });
	        }
	    };
	};

/***/ }),
/* 11 */
/***/ (function(module, exports) {

	"use strict";
	
	//************************************
	// DB SEARCH MODEL
	//************************************
	
	module.exports = function (_ref) {
	    var aisSearchView = _ref.aisSearchView,
	        myFleetMembersModel = _ref.myFleetMembersModel,
	        aisLayerSearcher = _ref.aisLayerSearcher;
	
	    return {
	        set view(value) {
	            aisSearchView = value;
	        },
	        getCount: function getCount() {
	            return this.data ? this.data.vessels.length : 0;
	        },
	        filterString: "",
	        _searchString: "",
	        update: function update() {
	            var _this = this;
	            this._actualUpdate = new Date().getTime();
	            var actualUpdate = this._actualUpdate;
	
	            //this.filterString&&console.log(this.filterString+" "+this.filterString.search(/\r$/))
	            //this.filterString&&console.log(this._searchString+" "+this._searchString.search(/\r$/))
	            this.filterString = this.filterString.replace(/\r+$/, "");
	
	            new Promise(function (resolve, reject) {
	                if (_this.filterString.length > 0 && _this.filterString != _this._searchString) {
	                    _this._searchString = _this.filterString;
	                    aisLayerSearcher.searchString(_this._searchString, true, function (response) {
	                        if (response.Status.toLowerCase() == "ok") {
	                            _this.data = { vessels: response.Result.values.map(function (v) {
	                                    return { vessel_name: v[0], mmsi: v[1], imo: v[2], mf_member: 'display:none', ts_pos_utc: aisLayerSearcher.formatDate(new Date(v[3] * 1000)),
	                                        xmin: v[4], xmax: v[4], ymin: v[5], ymax: v[5] };
	                                }) };
	                            resolve();
	                        } else {
	                            reject(response);
	                        }
	                    });
	                } else if (_this.filterString.length == 0) {
	                    _this.data = null;
	                    resolve();
	                } else resolve();
	            }).then(function () {
	                //console.log("LOADED "+(new Date().getTime()-_this._actualUpdate)+"ms")
	                if (_this._actualUpdate == actualUpdate) {
	                    if (_this.data) myFleetMembersModel.markMembers(_this.data.vessels);
	                    aisSearchView.repaint();
	                }
	            }, function (response) {
	                console.log(response);
	                if (response.Status.toLowerCase() == "auth" || response.ErrorInfo && response.ErrorInfo.ErrorMessage.search(/can not access/i) != -1) _this.data = { msg: [{ txt: _gtxt("AISSearch2.auth") }], vessels: [] };else console.log(response);
	                _this.dataSrc = null;
	                aisSearchView.repaint();
	            });
	        }
	    };
	};

/***/ }),
/* 12 */
/***/ (function(module, exports) {

	'use strict';
	
	//************************************
	// AIS SEARCH VIEW
	//************************************
	
	module.exports = function (_ref) {
	    var aisView = _ref.aisView,
	        aisScreenSearchModel = _ref.aisScreenSearchModel,
	        aisDbSearchModel = _ref.aisDbSearchModel,
	        highlight = _ref.highlight;
	
	    var instance = $.extend({
	        _tableTemplate: '{{#each vessels}}' + '<div class="ais_vessel">' + '<table border=0><tr><td><span class="position">{{vessel_name}}</span>' + '{{#if ts_pos_utc}} <span class="date">({{{ts_pos_utc}}})</span>{{/if}}' + '</td><td><i class="icon-ship" vessel="{{aisinfoid this}}" style="{{mf_member}}" title="{{i "AISSearch2.myFleetMember"}}"></i></td>' + '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">' +
	        //'<i class="clicable icon-info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}"></i>'+
	        '<div></td></tr></table>' + '</div>' + '{{/each}}' + '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}',
	        _model: aisScreenSearchModel,
	        _repaintControls: function _repaintControls() {
	            $(this._count).text(_gtxt('AISSearch2.found') + this._model.getCount());
	        },
	        _doClean: function _doClean() {
	            $(this._count).text(_gtxt('AISSearch2.found') + 0);
	        },
	        _bindControlEvents: function _bindControlEvents() {
	            var _this = this;
	            $('select', this._canvas).change(function (e) {
	                var models = [aisScreenSearchModel, aisDbSearchModel];
	                _this._model = models[e.target.options[e.target.selectedIndex].value];
	                //_this._model = models[(e.target.selectedOptions[0].value)];
	                $('input', _this._search).val(_this._model.filterString);
	                _this.show();
	                nsGmx.leafletMap.removeLayer(highlight);
	            });
	            this._refresh.parent().click(function () {
	                //console.log(_this._refresh)
	                _this.show();
	                nsGmx.leafletMap.removeLayer(highlight);
	            });
	            $('i', this._search).click(function (e) {
	                _this._model.filterString = $(this).siblings('input').val() + '\r';
	                _this.show();
	                nsGmx.leafletMap.removeLayer(highlight);
	            });
	            this._search.keyup(function (e) {
	                var input = $('input', this).val() || "";
	                input = input.replace(/^\s+/, "").replace(/\s+$/, "");
	                if (input == _this._model.filterString && e.keyCode != 13) return;
	                _this._model.filterString = input;
	                if (e.keyCode == 13) _this._model.filterString += '\r';
	                _this.show();
	                nsGmx.leafletMap.removeLayer(highlight);
	            });
	        },
	        setModel: function setModel(searchType) {
	            this._model = searchType == 'screen' ? aisScreenSearchModel : aisDbSearchModel;
	        }
	    }, aisView);
	    aisDbSearchModel.view = instance;
	    aisScreenSearchModel.view = instance;
	    return instance;
	};

/***/ }),
/* 13 */
/***/ (function(module, exports) {

	'use strict';
	
	//************************************
	// MY FLEET VIEW
	//************************************
	module.exports = function (_ref) {
	  var aisView = _ref.aisView,
	      myFleetMembersModel = _ref.myFleetMembersModel;
	
	  var instance = $.extend({
	    get model() {
	      return this._model;
	    },
	    _tableTemplate: '{{#each vessels}}' + '<div class="ais_vessel">' + '<table border=0><tr><td><span class="position">{{vessel_name}}</span> <span class="date">({{{ts_pos_utc}}})</span></td>' + '<td><div class="info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}">' +
	    //'<i class="clicable icon-info" vessel="{{aisjson this}}" title="{{i "AISSearch2.info"}}"></i>'+
	    '</div></td></tr></table>' + '</div>' + '{{/each}}' + '{{#each msg}}<div class="msg">{{txt}}</div>{{/each}}',
	    _model: myFleetMembersModel
	  }, aisView);
	  myFleetMembersModel.view = instance;
	  return instance;
	};

/***/ }),
/* 14 */
/***/ (function(module, exports) {

	'use strict';
	
	//************************************
	// VESSEL INFO VIEW
	//************************************  
	
	module.exports = function (_ref) {
	    var scheme = _ref.scheme,
	        modulePath = _ref.modulePath,
	        aisServiceUrl = _ref.aisServiceUrl;
	
	    var _ais,
	        _galery,
	        _register,
	        _regcap,
	        _leftPanel,
	        _minh,
	        resize,
	        menuAction,
	        show = function show(vessel) {
	        //console.log(vessel) 
	        $("body").append('' + '<table class="vessel-info-page overlay">' + '<tr>' + '<td>' + '<table class="vessel-info-page container">' + '<tr>' + '<td class="column1">' + '<table>' + '<tr>' + '<td>' + '<div>' + '<div class="title">' + '<div class="cell">' + vessel.vessel_name + '<div class="timestamp">' + vessel.ts_pos_utc + '</div></div>  ' + '</div>' + '<div class="menu">' + '<div class="ais cell menu-item active"><img src="' + modulePath + 'svg/info_gen.svg" class="icon">Основные сведения</div>' + '<div class="register cell menu-item"><img src="' + modulePath + 'svg/info.svg" class="icon">Регистр</div>' + '<div class="galery cell menu-item"><img src="' + modulePath + 'svg/photogallery.svg" class="icon">Фотогалерея <div class="counter">0</div></div>' + '</div>' + '</div>  ' + '</td>' + '</tr>' + '<tr>' + '<td class="frame">' + '<div class="photo">' + '<img src="' + modulePath + 'svg/no-image.svg" class="no-image">' + '</div>  ' + '</td>' + '</tr>' + '</table>' + '</td>' + '<td class="column2">' + '<div class="close-button-holder">' + '<div class="close-button" title="закрыть"></div>' + '</div>' + '<div class="register panel">' + '<div class="caption">123</div>' + '<div class="menu">' + '<div>' + '<table>' + '<tr>' + '<td><div class="general menu-item active">Общие сведения</div></td>' + '<td><div class="build menu-item">Сведения о постройке</div></td>' + '<td><div class="dimensions menu-item">Размеры и скорость</div></td>' + '<td><div class="gears menu-item">Оборудование</div></td>' + '</tr>' + '</table>' + '</div>' + '</div>' + '<div class="content">' + '<div class="placeholder"></div>' + '</div>' + '</div>' + '<div class="galery panel">' + '<form action="' + aisServiceUrl + 'Upload.ashx" class="uploadFile" method="post" enctype="multipart/form-data" target="upload_target" style="display:none" >' + '<input name="Filedata" class="chooseFile" type="file">' + '<input name="imo" type="hidden" value="' + vessel.imo + '">' + '<input name="mmsi" type="hidden" value="' + vessel.mmsi + '">' +
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
	                var preview = $("<div class='photo preview' id='" + data.id + "' style='background-image: url(" + aisServiceUrl + "getphoto.ashx?id=" + data.id + ")'/>");
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
	        $('<img src="' + aisServiceUrl + 'getphoto.ashx?id=' + this.id + '">').load(function () {
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
	            galcontent.append("<div class='photo preview' id='" + gallery[i] + "' style='background-image: url(" + aisServiceUrl + "getphoto.ashx?id=" + gallery[i] + ")'/>");
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
	            sendCrossDomainJSONRequest(aisServiceUrl + "gallery.ashx?mmsi=" + vessel.mmsi + "&imo=" + vessel.imo, function (response) {
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

/***/ })
/******/ ]);
//# sourceMappingURL=AISSearch2.js.map