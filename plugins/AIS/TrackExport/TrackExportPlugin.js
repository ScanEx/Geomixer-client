/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
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
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/entry.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/Calendar.js":
/*!*************************!*\
  !*** ./src/Calendar.js ***!
  \*************************/
/*! no static exports found */
/***/ (function(module, exports) {

var SIMPLE_MODE = 1,
    ADVANCED_MODE = 2;

var _toMidnight = nsGmx.DateInterval.toMidnight,
    _fromUTC = function _fromUTC(date) {
  if (!date) return null;
  var timeOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.valueOf() - timeOffset);
},
    _toUTC = function _toUTC(date) {
  if (!date) return null;
  var timeOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.valueOf() + timeOffset);
},
    _setMode = function _setMode(mode) {
  if (this._curMode === mode) {
    return this;
  } //this.reset();


  this._dateInputs.datepicker('hide');

  this._curMode = mode;
  var isSimple = mode === SIMPLE_MODE;
  $el.find('.CalendarWidget-onlyMaxVersion').toggle(!isSimple);

  this._moreIcon.toggleClass('icon-calendar', isSimple).toggleClass('icon-calendar-empty', !isSimple).attr('title', isSimple ? _gtxt('CalendarWidget.ExtendedViewTitle') : _gtxt('CalendarWidget.MinimalViewTitle'));

  var dateBegin = this._dateBegin.datepicker('getDate'),
      dateEnd = this._dateEnd.datepicker('getDate');

  if (isSimple && dateBegin && dateEnd && dateBegin.valueOf() !== dateEnd.valueOf()) {
    _selectFunc.call(this, this._dateEnd);

    _updateModel().call(this);
  } //this.trigger('modechange');


  return this;
},
    _selectFunc = function _selectFunc(activeInput) {
  var begin = this._dateBegin.datepicker('getDate');

  var end = this._dateEnd.datepicker('getDate');

  if (end && begin && begin > end) {
    var dateToFix = activeInput[0] == this._dateEnd[0] ? this._dateBegin : this._dateEnd;
    dateToFix.datepicker('setDate', $(activeInput[0]).datepicker('getDate'));
  } else if (this._curMode === SIMPLE_MODE) {
    //либо установлена только одна дата, либо две, но отличающиеся
    if (!begin != !end || begin && begin.valueOf() !== end.valueOf()) {
      this._dateEnd.datepicker('setDate', this._dateBegin.datepicker('getDate'));
    }
  }
},
    _updateModel = function _updateModel() {
  var dateBegin = _fromUTC(this._dateBegin.datepicker('getDate')),
      dateEnd = _fromUTC(this._dateEnd.datepicker('getDate'));

  this.dateInterval.set({
    dateBegin: dateBegin ? _toMidnight(dateBegin) : null,
    dateEnd: dateEnd ? _toMidnight(dateEnd.valueOf() + nsGmx.DateInterval.MS_IN_DAY) : null
  });
},
    _updateWidget = function _updateWidget() {
  var dateBegin = this.dateInterval.get('dateBegin'),
      dateEnd = this.dateInterval.get('dateEnd'),
      dayms = nsGmx.DateInterval.MS_IN_DAY;

  if (!dateBegin || !dateEnd) {
    return;
  }

  ;
  var isValid = !(dateBegin % dayms) && !(dateEnd % dayms);

  var newDateBegin = _toUTC(dateBegin),
      newDateEnd;

  if (isValid) {
    newDateEnd = _toUTC(new Date(dateEnd - dayms));

    if (dateEnd - dateBegin > dayms) {
      _setMode.call(this, ADVANCED_MODE);
    }
  } else {
    newDateEnd = _toUTC(dateEnd);

    _setMode.call(this, ADVANCED_MODE);
  } //если мы сюда пришли после выбора интервала в самом виджете, вызов setDate сохраняет фокус на input-поле
  //возможно, это какая-то проблема jQueryUI.datepicker'ов.
  //чтобы этого избежать, явно проверяем, нужно ли изменять дату


  var prevDateBegin = this._dateBegin.datepicker('getDate'),
      prevDateEnd = this._dateEnd.datepicker('getDate');

  if (!prevDateBegin || prevDateBegin.valueOf() !== newDateBegin.valueOf()) {
    this._dateBegin.datepicker('setDate', newDateBegin);
  }

  if (!prevDateEnd || prevDateEnd.valueOf() !== newDateEnd.valueOf()) {
    this._dateEnd.datepicker('setDate', newDateEnd);
  }
},
    _shiftDates = function _shiftDates(delta) {
  var dateBegin = _fromUTC(this._dateBegin.datepicker('getDate')),
      dateEnd = _fromUTC(this._dateEnd.datepicker('getDate'));

  if (!dateBegin || !dateEnd) {
    return;
  }

  var shift = (dateEnd - dateBegin + nsGmx.DateInterval.MS_IN_DAY) * delta,
      newDateBegin = new Date(dateBegin.valueOf() + shift),
      newDateEnd = new Date(dateEnd.valueOf() + shift);

  if ((!this._dateMin || _toMidnight(this._dateMin) <= _toMidnight(newDateBegin)) && (!this._dateMax || _toMidnight(this._dateMax) >= _toMidnight(newDateEnd))) {
    this._dateBegin.datepicker('setDate', _toUTC(newDateBegin));

    this._dateEnd.datepicker('setDate', _toUTC(newDateEnd));

    _updateModel.call(this);
  }
};

module.exports = function (options) {
  $el = $('<div class="CalendarWidget ui-widget"></div>');
  this.template = Handlebars.compile("\n    <table>\n    <tr>\n        <td><div class = \"CalendarWidget-iconScrollLeft ui-helper-noselect icon-left-open\"></div></td>\n        <td class = \"CalendarWidget-inputCell\"><input class = \"gmx-input-text CalendarWidget-dateBegin\"></td>\n        <td class = \"CalendarWidget-inputCell CalendarWidget-onlyMaxVersion\"><input class = \"gmx-input-text CalendarWidget-dateEnd\"></td>\n        <td><div class = \"CalendarWidget-iconScrollRight ui-helper-noselect icon-right-open\" ></div></td>\n        <td><div class = \"CalendarWidget-iconMore {{moreIconClass}}\" title = \"{{moreIconTitle}}\"></div></td>\n        <td><div class = \"CalendarWidget-forecast\" hidden>{{forecast}}</div></td>\n    </tr><tr>\n        <td></td>\n        <td class = \"CalendarWidget-dateBeginInfo\"></td>\n        <td class = \"CalendarWidget-dateEndInfo\"></td>\n        <td></td>\n        <td></td>\n    </tr>\n</table>\n<div class=\"CalendarWidget-footer\"></div>");
  options = $.extend({
    minimized: true,
    showSwitcher: true,
    dateMax: null,
    dateMin: null,
    dateFormat: 'dd.mm.yy',
    name: null
  }, options);
  this._dateMin = options.dateMin;
  this._dateMax = options.dateMax;
  this.dateInterval = options.dateInterval;
  $el.html(this.template({
    moreIconClass: options.minimized ? 'icon-calendar' : 'icon-calendar-empty',
    moreIconTitle: options.minimized ? _gtxt('CalendarWidget.ExtendedViewTitle') : _gtxt('CalendarWidget.MinimalViewTitle'),
    forecast: _gtxt('CalendarWidget.forecast')
  }));
  this._moreIcon = $el.find('.CalendarWidget-iconMore').toggle(!!options.showSwitcher);
  this._dateBegin = $el.find('.CalendarWidget-dateBegin');
  this._dateEnd = $el.find('.CalendarWidget-dateEnd');
  this._dateInputs = this._dateBegin.add(this._dateEnd);
  $el.find('.CalendarWidget-iconScrollLeft').on('click', function () {
    _shiftDates.call(this, -1);
  }.bind(this));
  $el.find('.CalendarWidget-iconScrollRight').on('click', function () {
    _shiftDates.call(this, 1);
  }.bind(this));

  this._dateInputs.datepicker({
    onSelect: function (dateText, inst) {
      _selectFunc.call(this, inst.input);

      _updateModel.call(this);
    }.bind(this),
    showAnim: 'fadeIn',
    changeMonth: true,
    changeYear: true,
    minDate: this._dateMin ? _toUTC(this._dateMin) : null,
    maxDate: this._dateMax ? _toUTC(this._dateMax) : null,
    dateFormat: options.dateFormat,
    defaultDate: _toUTC(this._dateMax || new Date()),
    showOn: options.buttonImage ? 'both' : 'focus',
    buttonImageOnly: true
  }); //устанавливаем опцию после того, как добавили календарик в canvas


  if (options.buttonImage) {
    this._dateInputs.datepicker('option', 'buttonImage', options.buttonImage);
  }

  $el.find('.CalendarWidget-onlyMaxVersion').toggle(!options.minimized);
  options.dateBegin && this._dateBegin.datepicker('setDate', _toUTC(options.dateBegin));
  options.dateEnd && this._dateEnd.datepicker('setDate', _toUTC(options.dateEnd));

  if (options.container) {
    if (typeof options.container === 'string') $('#' + options.container).append($el);else $(options.container).append($el);
  }

  _setMode.call(this, options.minimized ? SIMPLE_MODE : ADVANCED_MODE);

  _updateWidget.call(this);

  this.dateInterval.on('change', function () {
    _updateWidget.call(this);
  }.bind(this), this); //for backward compatibility

  this.canvas = $el;
};

/***/ }),

/***/ "./src/Models/TracksModel.js":
/*!***********************************!*\
  !*** ./src/Models/TracksModel.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

function _readOnlyError(name) { throw new Error("\"" + name + "\" is read-only"); }

var Request = __webpack_require__(/*! ../Request */ "./src/Request.js"); //////////////////////////


var _defaultViconColor = '#999',
    _getUnderWayIcon = function _getUnderWayIcon(cog, sog, type_color, group_style) {
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" style=\"transform:rotate(".concat(!cog ? 0 : cog, "deg)\"><title>sog: ").concat(sog).concat(_gtxt('TrackExport.kn'), " cog: ").concat(cog, "\xB0</title><path style=\"fill:").concat(type_color, ";\" d=\"M13.8,20.07a1,1,0,0,1-.69-0.28l-1.79-1.72a0.72,0.72,0,0,0-1,0L8.52,19.79a1,1,0,0,1-.69.28,1,1,0,0,1-1-1V8.65c0-1.52,1.55-7.59,4-7.59s4,6.07,4,7.59V19a1,1,0,0,1-1,1h0Z\"/><path style=\"fill:").concat(group_style, ";\" d=\"M10.82,1.57c1.93,0,3.5,5.57,3.5,7.09V19a0.52,0.52,0,0,1-.51.53,0.49,0.49,0,0,1-.34-0.14l-1.79-1.72a1.22,1.22,0,0,0-1.71,0L8.17,19.42a0.49,0.49,0,0,1-.34.14A0.52,0.52,0,0,1,7.32,19V8.65c0-1.51,1.57-7.09,3.5-7.09h0m0-1c-3,0-4.5,6.72-4.5,8.09V19a1.52,1.52,0,0,0,1.51,1.53,1.49,1.49,0,0,0,1-.42l1.79-1.72a0.22,0.22,0,0,1,.32,0l1.79,1.72a1.49,1.49,0,0,0,1,.42A1.52,1.52,0,0,0,15.32,19V8.65c0-1.37-1.51-8.09-4.5-8.09h0Z\"/><ellipse style=\"fill:#fff;\" cx=\"10.82\" cy=\"10.54\" rx=\"1.31\" ry=\"1.35\"/><path style=\"fill:#fff;\" d=\"M10.73,3.34h0.12a0.35,0.35,0,0,1,.35.35v6.85a0,0,0,0,1,0,0H10.38a0,0,0,0,1,0,0V3.69A0.35,0.35,0,0,1,10.73,3.34Z\"/></svg>");
},
    _getAtAnchorIcon = function _getAtAnchorIcon(cog, sog, type_color, group_style) {
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" style=\"transform:rotate(".concat(!cog ? 0 : cog, "deg)\"><title>sog: ").concat(sog).concat(_gtxt('TrackExport.kn'), " cog: ").concat(cog, "\xB0</title><rect style=\"fill:").concat(type_color, ";stroke:").concat(group_style, ";stroke-miterlimit:10;\" x=\"5.9\" y=\"5.6\" width=\"9.19\" height=\"9.19\" rx=\"2\" ry=\"2\" transform=\"translate(-4.13 10.41) rotate(-45)\"/><circle style=\"fill:#fff;\" cx=\"10.5\" cy=\"10.19\" r=\"1.5\"/></svg>");
},
    _vicons = [],
    _viconsDict = {},
    _styleLayer = '-EE5587AF1F70433AA878462272C0274C',
    _getVicons = function _getVicons() {
  if (!_styleLayer || !nsGmx.gmxMap.layersByID[_styleLayer]) return;

  nsGmx.gmxMap.layersByID[_styleLayer]._gmx.properties.gmxStyles.styles.forEach(function (s) {
    var icon = {
      "filter": s.Filter,
      "url": s.RenderStyle.iconUrl.replace(/^https?:/, "").replace(/^\/\/kosmosnimki.ru/, "//www.kosmosnimki.ru"),
      "name": s.Name
    };

    _vicons.push(icon);

    _viconsDict[icon.filter] = icon;
  }); // console.log(_icons);
  // console.log(_iconsDict);

},
    _getViconSvgPromise = function _getViconSvgPromise(ic) {
  return new Promise(function (resolve) {
    var httpRequest = new XMLHttpRequest();

    httpRequest.onreadystatechange = function () {
      if (httpRequest.readyState === 4) {
        ic["svg"] = httpRequest.responseText;
        var a = /\.cls-1{fill:(#[^};]+)/.exec(ic.svg);
        ic.color = _defaultViconColor;
        if (a && a.length) ic.color = a[1];
        resolve();
      }
    };

    httpRequest.open("GET", document.location.protocol + ic.url.replace(/^https?:/, ""));
    httpRequest.send();
  });
},
    _getVicon = function _getVicon(vessel_type, cog, sog) {
  for (var f in _viconsDict) {
    var re1 = new RegExp("'" + vessel_type + "'"),
        re2 = new RegExp(sog != 0 ? ">0" : "=0"); //console.log(vessel_type+" "+sog+" "+f+" "+f.search(re1)+" "+f.search(re2))

    if (f.search(re1) != -1 && f.search(re2) != -1) {
      return {
        color: _viconsDict[f].color,
        svg: sog != 0 ? _getUnderWayIcon(cog, sog, _viconsDict[f].color, '#fff') : _getAtAnchorIcon(cog, sog, _viconsDict[f].color, '#fff')
      };
    }
  }

  return {
    color: '#f00',
    svg: sog != 0 ? _getUnderWayIcon(cog, sog, _defaultViconColor, '#fff') : _getAtAnchorIcon(cog, sog, _defaultViconColor, sog, '#fff')
  };
};

var _loadViconPromise; //////////////////////////


module.exports = function (options) {
  var _lmap = nsGmx.leafletMap,
      _tracks = [],
      _vmarkers = [];

  _getVicons();

  _loadViconPromise = Promise.all(_vicons.map(_getViconSvgPromise));
  var _data = {
    tracks: [],
    msg: []
  };
  var _layerName = options.layer;
  return {
    isDirty: false,

    get data() {
      return _data;
    },

    set data(value) {
      _data = (_readOnlyError("_data"), value);
    },

    free: function free() {
      _data.total = null;
      _data.tracks.length = 0;
      _data.msg.length = 0;

      _tracks.forEach(function (t) {
        _lmap.removeLayer(t);
      });

      _tracks.length = 0;
      _vmarkers.length = 0;
    },
    fitToTrack: function fitToTrack(i) {
      _lmap.fitBounds(_tracks[i].getBounds());
    },
    drawTrack: function drawTrack(i) {
      _tracks[i].addTo(_lmap);
    },
    eraseTrack: function eraseTrack(i) {
      _lmap.removeLayer(_tracks[i]);
    },
    update: function update() {
      if (!this.isDirty) return;
      var thisModel = this;
      return Promise.resolve().then(function () {
        thisModel.free();
        return Request.searchRequest({
          layer: thisModel.view.trackLayer.id,
          orderdirection: 'desc',
          orderby: thisModel.view.trackLayer.sort,
          columns: thisModel.view.trackLayer.columns,
          query: thisModel.view.trackLayer.query
        }, 'POST').then(function (r) {
          return _loadViconPromise.then(function () {
            //console.log(r)
            if (!r.values.length) {
              _data.msg = [{
                txt: _gtxt('TrackExport.nodata')
              }];
            } else {
              _data.total = r.values.length;
              r.values.forEach(function (p) {
                var data = thisModel.view.trackLayer.parseData(r.fields, p, _getVicon),
                    lastTrack = _data.tracks[_data.tracks.length - 1];

                if (!lastTrack || lastTrack.positions[0].utc_date != data.utc_date) {
                  lastTrack = {
                    utc_date: data.utc_date,
                    positions: []
                  };

                  _data.tracks.push(lastTrack);
                }

                lastTrack.positions.push(data);
              });
            }
          });
        });
      }).then(function () {
        // draw track on map
        thisModel.view.repaint();

        if (_data.tracks.length) {
          var lastPos,
              wholeDistance = 0;

          _data.tracks.forEach(function (t) {
            t.distance = 0;
            var temp,
                latlngs = t.positions.map(function (p) {
              if (temp) t.distance = t.distance + _lmap.distance(temp, [p.latitude, p.longitude]);
              temp = [p.latitude, p.longitude];
              return temp;
            });

            if (lastPos) {
              t.distance = t.distance + _lmap.distance(lastPos, latlngs[0]);
              latlngs = [lastPos].concat(latlngs);
            }

            lastPos = temp;
            var line = L.polyline(latlngs, {
              color: t.positions[0] && t.positions[0].vicon ? t.positions[0].vicon.color : 'red'
            }).addTo(_lmap);
            line.bindPopup("<b>".concat(thisModel.view.vname, "</b><br>").concat(t.utc_date, "<br>").concat((t.distance / 1000).toFixed(3), " ").concat(_gtxt('TrackExport.km')));

            _tracks.push(line);

            wholeDistance = wholeDistance + t.distance;
          });

          _lmap.fitBounds(_tracks[0].getBounds());
        }

        thisModel.isDirty = false;
      });
    } // this.update

  };
};

/***/ }),

/***/ "./src/PluginPanel.js":
/*!****************************!*\
  !*** ./src/PluginPanel.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

// let PRODUCTION = false;
// if (has('PRODUCTION'))
//     PRODUCTION = true;
module.exports = function (viewFactory) {
  var _isReady = false,
      _activeView,
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

/***/ "./src/Request.js":
/*!************************!*\
  !*** ./src/Request.js ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _serverBase = window.serverBase.replace(/^https?:/, document.location.protocol),
    _fetchRequest = function _fetchRequest(url, request, method) {
  if (url[0] == '/') url = _serverBase + url.replace(/^\//, '');
  if (method == 'POST') return fetch(url, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    method: 'POST',
    // *GET, POST, PUT, DELETE, etc.
    mode: 'cors',
    // no-cors, cors, *same-origin);
    body: encodeURI(request)
  });
},
    _sendRequest = function _sendRequest(url, request, method) {
  return new Promise(function (resolve, reject) {
    var callback = function callback(response) {
      if (!response.Status || response.Status.toLowerCase() != 'ok' || !response.Result) {
        reject(response);
      } else resolve(response.Result);
    };

    if (url[0] == '/') url = _serverBase + url.replace(/^\//, '');
    if (!method || method == 'GET') window.sendCrossDomainJSONRequest(url + "?".concat(_getQueryString(request)), callback);

    if (method == 'POST') {
      request.WrapStyle = 'message';
      window.sendCrossDomainPostRequest(url, request, callback);
    }
  });
},
    _getQueryString = function _getQueryString(params) {
  var qs = '';

  for (var p in params) {
    if (qs != '') qs += '&';
    qs += p + '=' + (_typeof(params[p]) == 'object' ? JSON.stringify(params[p]) : params[p]);
  }

  return qs;
};

_searchRequest = function _searchRequest(params, method) {
  return _sendRequest("".concat(_serverBase, "VectorLayer/Search.ashx"), params, method);
}, _modifyRequest = function _modifyRequest(params) {
  var url = "".concat(_serverBase, "VectorLayer/ModifyVectorObjects.ashx?").concat(_getQueryString(params));
  return _sendRequest(url);
}, _checkVersion = function _checkVersion(layer, ms) {
  setTimeout(function () {
    L.gmx.layersVersion.chkVersion(layer); //console.log('ChV')                   

    setTimeout(function () {
      L.gmx.layersVersion.chkVersion(layer); //console.log('ChV')                   

      setTimeout(function () {
        L.gmx.layersVersion.chkVersion(layer); //console.log('ChV')                   
      }, ms);
    }, ms);
  }, ms);
};
module.exports = {
  fetchRequest: _fetchRequest,
  sendRequest: _sendRequest,
  searchRequest: _searchRequest,
  modifyRequest: _modifyRequest,
  checkVersion: _checkVersion
};

/***/ }),

/***/ "./src/SearchControl.css":
/*!*******************************!*\
  !*** ./src/SearchControl.css ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "./src/SearchControl.js":
/*!******************************!*\
  !*** ./src/SearchControl.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

var _searchString = "",
    _sparams = 'imo name mmsi';

var SearchControl = function SearchControl(_ref) {
  var tab = _ref.tab,
      container = _ref.container,
      callback = _ref.callback,
      searchparams = _ref.searchparams,
      searcher = _ref.searcher;
  container.innerHTML = '<div class="filter"><input type="text" placeholder="' + _gtxt("Lloyds.search_placeholder") + '"/>' + (!searchparams ? '' : '<div class="preferences"></div>') + '<div class="searchremove"><img class="search" src="plugins/AIS/AISSearch/svg/search.svg">' + '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg"></div>' + '</div>';
  var suggestions = tab.appendChild(document.createElement('div'));
  suggestions.classList.add("suggestions");
  suggestions.innerHTML = '<div class="suggestion">SOME VESSEL<br><span>mmsi:0, imo:0</span></div>';
  this.frame = {
    find: function find(q) {
      return container.querySelector(q);
    }
  };
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

  this.frame = {
    find: function find(q) {
      return container.querySelector(q);
    }
  };
  this.searchInput = this.frame.find('.filter input');

  var searchBut = this.frame.find('.filter .search'),
      prefeBut = this.frame.find('.filter .preferences'),
      removeBut = this.frame.find('.filter .remove'),
      delay,
      //suggestions = this.frame.find('.suggestions'),
  suggestionsCount = 5,
      suggestionsFrame = {
    first: 0,
    current: 0,
    last: suggestionsCount - 1
  },
      found = {
    values: []
  },
      searchDone = function searchDone() {
    if (found.values.length > 0) {
      _searchString = found.values[suggestionsFrame.current].vessel_name;
      this.searchInput.value = _searchString;
      callback(found.values[suggestionsFrame.current]);
    } // else {
    //     _clean.call(this);
    // }

  },
      doSearch = function doSearch(actualId) {
    var requests = []; // _sparams.split(' ').forEach(sp=>{       
    //     requests.push(fetch("//kosmosnimki.ru/demo/lloyds/api/v1/Ship/Search/" + sp + "/" + _searchString));
    // });

    requests.push(new searcher.searchpromise([{
      name: 'query',
      value: [_searchString]
    }]));
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
        found = {
          values: []
        };
        a.forEach(function (r) {
          found.values = found.values.concat(searcher.parser(r));
        }); //console.log(found.values)
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
        suggestions.style.left = cr.left + "px";
        suggestions.style.top = cr.bottom - 3 + "px";
        suggestions.style.width = Math.round(cr.width) - 2 + "px"; // $(suggestions).offset({ left: cr.left, top: cr.bottom - 3 });
        // $(suggestions).outerWidth(cr.width)
      }

      suggestions.style.height = suggestion[0].getBoundingClientRect().height * (found.values.length > suggestionsCount ? suggestionsCount : found.values.length) + "px";
      suggestionsFrame = {
        first: 0,
        current: 0,
        last: suggestionsCount - 1
      };
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
          localStorage.setItem(searchparams, _sparams); //console.log(_sparams)
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
    suggestions.style.display = 'none'; //_clean.call(this);
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

      $(suggestions).mCustomScrollbar("scrollTo", "#" + suggestionsFrame.first, {
        scrollInertia: 0
      });
    }
  };

  var prepareSearchInput = function prepareSearchInput(temp, keyCode) {
    removeBut.style.display = 'block';
    searchBut.style.display = 'none'; //console.log("delay clear"+delay)
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

/***/ "./src/SelectControl.css":
/*!*******************************!*\
  !*** ./src/SelectControl.css ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "./src/SelectControl.js":
/*!******************************!*\
  !*** ./src/SelectControl.js ***!
  \******************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function (container, options, active, callback) {
  var _isOptionsDisplayed = false,
      _select = document.createElement('div'),
      _optionsList = document.createElement('div'),
      _selected = active;

  _select.className = 'select-control';
  _select.innerHTML = "<span class=\"select-active\">".concat(options[active], "</span><span class=\"icon-down-open\"></span>");
  _optionsList.className = 'select-list';
  _optionsList.innerHTML = options.map(function (o, i) {
    return "<div class=\"select-options\" id=\"".concat(i, "\">").concat(o, "</div>");
  }).join('');
  container.append(_select);
  document.body.append(_optionsList);

  var _arrow = _select.querySelector('.icon-down-open'),
      _options = _optionsList.querySelectorAll('.select-options'),
      _hideOptions = function _hideOptions() {
    _optionsList.style.display = 'none';

    _optionsList.querySelectorAll('.select-options')[_selected].classList.remove('selected');

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
      _select.querySelector('.select-active').innerHTML = options[_selected];
      callback(_selected);
    });
  }

  _optionsList.addEventListener('mouseleave', function (e) {
    _hideOptions();
  });

  _select.addEventListener('click', function (e) {
    //console.log(_isOptionsDisplayed)
    if (_isOptionsDisplayed) {
      _hideOptions();
    } else {
      _setOptionsRect();

      _optionsList.style.display = 'block';

      _optionsList.querySelectorAll('.select-options')[_selected].classList.add('selected');

      _arrow.classList.remove('icon-down-open');

      _arrow.classList.add('icon-up-open');

      _isOptionsDisplayed = true;
    }
  });

  return {
    dropDownList: _optionsList
  };
};

/***/ }),

/***/ "./src/Views/BaseView.js":
/*!*******************************!*\
  !*** ./src/Views/BaseView.js ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports) {

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
      if (!this.frame) return; //console.log($('.iconSidebarControl-pane').height(), this.topOffset, this.bottomOffset)

      var h = $('.iconSidebarControl-pane').height() - this.topOffset - this.bottomOffset; // if (this.startScreen){
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
          content = $( //Handlebars.compile(this.tableTemplate)(this.model.data)
      this.tableTemplate);

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

/***/ "./src/Views/TracksView.css":
/*!**********************************!*\
  !*** ./src/Views/TracksView.css ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "./src/Views/TracksView.js":
/*!*********************************!*\
  !*** ./src/Views/TracksView.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! ./TracksView.css */ "./src/Views/TracksView.css");

__webpack_require__(/*! ../SearchControl.css */ "./src/SearchControl.css");

__webpack_require__(/*! ../SelectControl.css */ "./src/SelectControl.css");

var BaseView = __webpack_require__(/*! ./BaseView.js */ "./src/Views/BaseView.js"),
    Request = __webpack_require__(/*! ../Request */ "./src/Request.js"),
    Calendar = __webpack_require__(/*! ../Calendar */ "./src/Calendar.js"),
    SearchControl = __webpack_require__(/*! ../SearchControl */ "./src/SearchControl.js"),
    SelectControl = __webpack_require__(/*! ../SelectControl */ "./src/SelectControl.js");

var _toDd = function _toDd(D, isLng) {
  var dir = D < 0 ? isLng ? 'W' : 'S' : isLng ? 'E' : 'N',
      deg = Math.round((D < 0 ? D = -D : D) * 1000000) / 1000000;
  return deg.toFixed(2) + " " //"°"
  + dir;
};

var _searchLayer = 'EE5587AF1F70433AA878462272C0274C',
    //'CE660F806D164FE58556638D752A4203',
_selectLayers = [{
  name: 'FOS',
  id: 'ED043040A005429B8F46AAA682BE49C3',
  sort: 'timestamp',
  columns: JSON.stringify([{
    "Value": "mmsi"
  }, {
    "Value": "timestamp"
  }, {
    "Value": "course"
  }, {
    "Value": "speed"
  }, {
    "Value": "port_of_destination"
  }, {
    "Value": "eta"
  }, {
    "Value": "heading"
  }, {
    "Value": "lon"
  }, {
    "Value": "lat"
  }]),

  get vesselQuery() {
    return "([imo] IN (".concat(_thisView.imo, ")) and ");
  },

  get query() {
    return this.vesselQuery + "'".concat(_thisView.calendar.dateInterval.get('dateBegin').toISOString(), "'<=[timestamp] and [timestamp]<'").concat(_thisView.calendar.dateInterval.get('dateEnd').toISOString(), "'");
  },

  parseData: function parseData(fields, value, getVicon) {
    var tzOffset = new Date().getTimezoneOffset(),
        ts = value[fields.indexOf('timestamp')],
        utcDate = new Date((value[fields.indexOf('timestamp')] + tzOffset * 60) * 1000),
        locDate = new Date(value[fields.indexOf('timestamp')] * 1000);
    return {
      ts: ts,
      cog: value[fields.indexOf('course')],
      sog: value[fields.indexOf('speed')],
      utc_date: utcDate.toLocaleDateString(),
      utc_time: utcDate.toLocaleTimeString(),
      local_date: locDate.toLocaleDateString(),
      local_time: locDate.toLocaleTimeString(),
      lat: _toDd(value[fields.indexOf('lat')]),
      lon: _toDd(value[fields.indexOf('lon')], true),
      latitude: value[fields.indexOf('lat')],
      longitude: value[fields.indexOf('lon')],
      vicon: getVicon('Undefined', value[fields.indexOf('course')], value[fields.indexOf('speed')])
    };
  }
}, {
  name: 'AIS',
  sort: 'ts_pos_utc',
  id: '8EE2C7996800458AAF70BABB43321FA4',
  //'5790ADDFBDD64880BAC95DF13B8327EA', 
  columns: JSON.stringify([{
    "Value": "mmsi"
  }, {
    "Value": "flag_country"
  }, {
    "Value": "callsign"
  }, {
    "Value": "ts_pos_utc"
  }, {
    "Value": "cog"
  }, {
    "Value": "sog"
  }, {
    "Value": "draught"
  }, {
    "Value": "vessel_type"
  }, {
    "Value": "destination"
  }, {
    "Value": "ts_eta"
  }, {
    "Value": "nav_status"
  }, {
    "Value": "heading"
  }, {
    "Value": "rot"
  }, {
    "Value": "longitude"
  }, {
    "Value": "latitude"
  }, {
    "Value": "source"
  }]),

  get query() {
    return "([mmsi] IN (".concat(_thisView.mmsi, ")) and '").concat(_thisView.calendar.dateInterval.get('dateBegin').toISOString(), "'<=[ts_pos_utc] and [ts_pos_utc]<'").concat(_thisView.calendar.dateInterval.get('dateEnd').toISOString(), "'");
  },

  parseData: function parseData(fields, value, getVicon) {
    var tzOffset = new Date().getTimezoneOffset(),
        ts = value[fields.indexOf('ts_pos_utc')],
        utcDate = new Date((value[fields.indexOf('ts_pos_utc')] + tzOffset * 60) * 1000),
        locDate = new Date(value[fields.indexOf('timestamp')] * 1000);
    return {
      ts: ts,
      cog: value[fields.indexOf('cog')],
      sog: value[fields.indexOf('sog')],
      utc_date: utcDate.toLocaleDateString(),
      utc_time: utcDate.toLocaleTimeString(),
      local_date: locDate.toLocaleDateString(),
      local_time: locDate.toLocaleTimeString(),
      lat: _toDd(value[fields.indexOf('latitude')]),
      lon: _toDd(value[fields.indexOf('longitude')], true),
      latitude: value[fields.indexOf('latitude')],
      longitude: value[fields.indexOf('longitude')],
      vicon: getVicon(value[fields.indexOf('vessel_type')], value[fields.indexOf('cog')], value[fields.indexOf('sog')])
    };
  }
}];

var _thisView, _layer;

var TracksView = function TracksView(_ref) {
  var _this = this;

  var model = _ref.model,
      layer = _ref.layer;
  _thisView = this;
  BaseView.call(this, model);
  this.frame = $(Handlebars.compile("<div class=\"trackexport-view\">\n            <div class=\"header\">\n                <table border=0 class=\"instruments unselectable\">\n                <tr>\n                    <td class=\"search_input_container\"></td>\n                    <tr>\n                        <td class=\"select_container\"></td>\n                    </tr>\n                </tr>\n                </table> \n\n                <table border=0><tr>\n                <td><div class=\"calendar\"></div></td>\n                <td style=\"vertical-align: top\"><div class=\"reload\" title=\"".concat(_gtxt('TrackExport.reload'), "\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z\"></path></svg></div></td>\n                </table></tr> \n \n            </div> \n            <div class=\"refresh\" style=\"display: none; padding-top: 100%;padding-left: 50%;\"><img src=\"img/progress.gif\"></div>\n            <div class=\"grid\"></div>\n            <div class=\"footer unselectable\">\n       \n            </div>\n            </div>"))());

  _addCalendar.call(this);

  this.trackLayer = _selectLayers[0];
  this.frame.find('.reload').on('click', function (e) {
    var db = _thisView.calendar.dateInterval.get('dateBegin'),
        de = _thisView.calendar.dateInterval.get('dateEnd'),
        daysDiff = Math.ceil((de.getTime() - db.getTime()) / (24 * 3600000)); //console.log(_thisView.calendar, daysDiff)


    if ((_this.mmsi || _this.imo) && daysDiff < 8) {
      _this.model.isDirty = true;

      _this.inProgress(true);

      _this.show();
    } else {
      _this.model.free();

      if (daysDiff > 7) _this.model.data.msg = [{
        txt: _gtxt('TrackExport.intervalExceeds')
      }];

      _this.repaint();
    }
  }.bind(this));
  this.container = this.frame.find('.grid');
  this.footer = this.frame.find('.footer');
  this.selectLayer = new SelectControl(this.frame.find('.select_container')[0], _selectLayers.map(function (l) {
    return l.name;
  }), 0, function (selected) {
    _thisView.trackLayer = _selectLayers[selected];
  });
  this.selectLayer.dropDownList.classList.add('trackexport-view');
  this.searchInput = new SearchControl({
    tab: this.frame[0],
    container: this.frame.find('.search_input_container')[0],
    searcher: {
      searchpromise: function searchpromise(params) {
        var request = "layer=".concat(_searchLayer, "&columns=[{\"Value\":\"vessel_name\"},{\"Value\":\"mmsi\"},{\"Value\":\"imo\"},{\"Value\":\"ts_pos_utc\"},{\"Value\":\"vessel_type\"},{\"Value\":\"longitude\"},{\"Value\":\"latitude\"},{\"Value\":\"source\"}]&orderby=vessel_name&").concat(params[0].name, "=").concat(params[0].value);
        return Request.fetchRequest('/Plugins/AIS/SearchShip.ashx', request, 'POST');
      },
      parser: function parser(response) {
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
      if (!v) {
        _thisView.mmsi = null;
        _thisView.imo = null;
        _thisView.vname = null;

        _thisView.model.free();

        _thisView.repaint();
      } else {
        _thisView.mmsi = v.mmsi;
        _thisView.imo = v.imo;
        _thisView.vname = v.vessel_name;
      }
    }.bind(this)
  });
  Object.defineProperty(this, "tableTemplate", {
    get: function get() {
      var _this2 = this;

      var totalPositions = this.model.data.total,
          rv = (!totalPositions ? "" : "<table class=\"track-table\"><tr>\n                        <td></td>\n                        <td>\n                        <span class='export shape' title=\"".concat(_gtxt("TrackExport.export"), "\">shp</span> \n                        <span class='export geojson' title=\"").concat(_gtxt("TrackExport.export"), "\">geojson</span> \n                        <span class='export gpx' title=\"").concat(_gtxt("TrackExport.export"), "\">gpx</span> \n                        </td>\n                        <td><div class=\"track all\"><input type=\"checkbox\" checked title=\"").concat(_gtxt("TrackExport.allDailyTracks"), "\"></div></td>\n                        <td><div class=\"count\">").concat(totalPositions, "</div></td></tr></table>")) + this.model.data.tracks.map(function (t, i) {
        return "<table class=\"track-table\" border=\"0\">\n                        <tbody><tr>\n                        <td><div class=\"open_positions track_".concat(i, " ui-helper-noselect icon-right-open ").concat(_this2.model.data.tracks.length > 1 ? 'icon-right-open' : 'icon-down-open', " \" title=\"").concat(_gtxt('TrackExport.positions'), "\"></div></td>\n                        <td><span class=\"date\">").concat(t.utc_date, "</span></td>\n                        <td><div class=\"track\"><input type=\"checkbox\" checked title=\"").concat(_gtxt('TrackExport.dailyTrack'), "\" id=\"").concat(i, "\"></div></td>\n                        <td><div class=\"count\">").concat(t.positions.length, "</div></td></tr></tbody></table>\n\n                        <div class=\"track_").concat(i, "\" >").concat(_thisView.model.data.tracks.length == 1 ? _renderPosTable(i) : "", "</div>");
      }).join('') + (this.model.data.msg ? this.model.data.msg.map(function (m) {
        return "<div class=\"msg\">".concat(m.txt, "</div>");
      }).join('') : '');
      return rv;
    }
  });
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
},
    _renderPosTable = function _renderPosTable(i) {
  var t = _thisView.model.data.tracks[i];
  return "<table class=\"positions-table\"><tbody>" + t.positions.map(function (p, j) {
    return "<tr>                \n            <td><span class=\"utc_time\">".concat(p.utc_time, "</span><span class=\"local_time\">").concat(p.local_time, "</span></td>\n            <td><span class=\"utc_date\">").concat(t.utc_date, "</span><span class=\"local_date\">").concat(p.local_date, "</span></td>\n            <td>").concat(p.lon, "&nbsp;&nbsp;").concat(p.lat, "</td>\n            <td>").concat(p.vicon ? p.vicon.svg : '', "</td><td></td>\n            <td><div class=\"show_pos\" id=\"").concat(i, "_").concat(j, "\" title=\"").concat(_gtxt('TrackExport.position'), "\"><img src=\"plugins/AIS/AISSearch/svg/center.svg\"></div></td>\n            </tr>\n            <tr><td colspan=\"6\" class=\"more\"><hr><div class=\"vi_more\"></div></td></tr>");
  }).join('') + "</tbody></table>";
},
    _addCalendar = function _addCalendar() {
  var calendar = this.frame.find('.calendar')[0]; // walkaround with focus at first input in ui-dialog

  calendar.innerHTML = '<span class="ui-helper-hidden-accessible"><input type="text"/></span>';
  var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
      dateInterval = new nsGmx.DateInterval(),
      msd = 24 * 3600000;
  dateInterval.set('dateBegin', mapDateInterval.get('dateBegin')).set('dateEnd', mapDateInterval.get('dateEnd')).on('change', function (e) {
    var d = new Date(e.attributes.dateEnd.getTime() - msd * 7);

    _thisView.calendar._dateInputs.datepicker('option', 'minDate', d);

    if (e.attributes.dateBegin.getTime() < d.getTime()) e.attributes.dateBegin = new Date(d.getTime()); // console.log(d)
    // console.log(_thisView.calendar.dateInterval.get('dateBegin'))
  });
  this.calendar = new Calendar({
    dateInterval: dateInterval,
    name: 'catalogInterval',
    container: calendar,
    dateMin: new Date(nsGmx.DateInterval.getUTCDayBoundary().dateBegin.getTime() - msd * 6),
    //dateMax: new Date(),
    dateFormat: 'dd.mm.yy',
    minimized: false,
    showSwitcher: false
  });
  var tr = calendar.querySelector('tr:nth-of-type(1)');
  tr.insertCell(2).innerHTML = '&nbsp; - &nbsp;';
  tr.insertCell(6).innerHTML = '<img class="default_date" style="cursor:pointer; padding:10px" title="' + _gtxt('TrackExport.calendar_today') + '" src="plugins/AIS/AISSearch/svg/calendar.svg">';
  calendar.querySelector('.default_date').addEventListener('click', function () {
    var db = nsGmx.DateInterval.getUTCDayBoundary(new Date());
    dateInterval.set({
      dateBegin: db.dateBegin,
      dateEnd: db.dateEnd
    });
  });
},
    _clean = function _clean() {
  this.frame.find('.open_positions').off('click', _onOpenPosClick);
  this.frame.find('.track-table .track:not(".all") input').off('click', _onShowTrack), this.frame.find('.track-table .track.all input').off('click', _onShowAllTracks), this.frame.find('.show_pos').off('click', _onShowPos);
  this.frame.find('.track-table .export').off('click', _onExport);
};

TracksView.prototype = Object.create(BaseView.prototype);

TracksView.prototype.inProgress = function (state) {
  var progress = this.frame.find('div.refresh'),
      grid = this.frame.find('div.grid');

  if (state) {
    grid.hide();
    progress.show();
  } else {
    progress.hide();
    grid.show();
  }
}; // TracksView.prototype.resize = function () { 
//     let h = $('.iconSidebarControl-pane').height() - this.frame.find('.instruments').outerHeight()
//     - this.frame.find('.results').outerHeight() - this.frame.find('.menu').outerHeight();
//     this.container.height(h+1);
// };


var _onOpenPosClick = function _onOpenPosClick(e) {
  var icon = $(e.target),
      id;

  for (var i = 0; e.target.classList[i]; ++i) {
    if (e.target.classList[i].search(/track_/) != -1) {
      id = e.target.classList[i];
      break;
    }
  }

  if (icon.is('.icon-down-open')) {
    icon.removeClass('icon-down-open').addClass('.icon-right-open');

    if (id) {
      var div = $(".".concat(id, ":not(.open_positions)"));
      div.hide();

      if (id != 'track_0') {
        div.find('.show_pos').off('click', _onShowPos);
        div.html('');
      }
    }
  } else {
    icon.addClass('icon-down-open').removeClass('.icon-right-open');

    if (id) {
      var _div = $(".".concat(id, ":not(.open_positions)"));

      if (!$(".".concat(id, " .positions-table"))[0]) {
        _div.html(_renderPosTable(parseInt(id.split('_')[1])));

        _div.find('.show_pos').on('click', _onShowPos);
      }

      _div.show();
    }
  }
},
    _onShowAllTracks = function _onShowAllTracks(e) {
  var showTrack = _thisView.frame.find('.track-table .track:not(".all") input'),
      showAllTracks = _thisView.frame.find('.track-table .track.all input');

  showTrack.each(function (i, el) {
    el.checked = showAllTracks[0].checked;
    if (showAllTracks[0].checked) _thisView.model.drawTrack(el.id);else _thisView.model.eraseTrack(el.id);
  });
},
    _onShowTrack = function _onShowTrack(e) {
  var showTrack = _thisView.frame.find('.track-table .track:not(".all") input'),
      showAllTracks = _thisView.frame.find('.track-table .track.all input');

  var id = parseInt(e.currentTarget.id);
  if (e.currentTarget.checked) _thisView.model.drawTrack(id);else _thisView.model.eraseTrack(id);
  var checkAll = true;
  showTrack.each(function (i, el) {
    checkAll = checkAll && el.checked;
  });
  showAllTracks[0].checked = checkAll;
},
    _onShowPos = function _onShowPos(e) {
  var ij = e.currentTarget.id.split('_'),
      pos = _thisView.model.data.tracks[ij[0]].positions[ij[1]]; //_thisView.model.fitToTrack(ij[0]);

  nsGmx.leafletMap.setView([pos.latitude, pos.longitude]);
},
    _onExport = function _onExport(e) {
  var type = e.currentTarget.className.replace(/export */, ''),
      tracks = _thisView.model.data.tracks,
      trackLine = tracks.reduce(function (p, c) {
    c.positions.forEach(function (pos) {
      return p.push([pos.longitude, pos.latitude]);
    });
    return p;
  }, []),
      features = [{
    geometry: L.gmxUtil.geometryToGeoJSON({
      type: 'LINESTRING',
      coordinates: trackLine
    })
  }];

  var getFilename = function getFilename() {
    var spart = tracks[0].utc_date,
        //`${s.getFullYear()}_${s.getMonth()+1}_${s.getDate()}`,
    epart = tracks.length > 1 ? '_' + tracks[tracks.length - 1].utc_date : ''; //tracks.length>1 ? `_${e.getFullYear()}_${e.getMonth()+1}_${e.getDate()}` : '';

    return "".concat(_thisView.vname, "_").concat(spart).concat(epart).replace(/[!\?\:<>"'#]/g, '').replace(/[ \.\/\\-]/g, '_');
  };

  nsGmx.Utils.downloadGeometry(features, {
    fileName: getFilename(),
    format: type
  }); //console.log(features, {fileName: `${_thisView.vname}_${tracks[0].utc_date}${tracks.length>1?'_' + tracks[tracks.length-1].utc_date:''}`.replace(/ |\./g, '_'), format: type,});
};

TracksView.prototype.repaint = function () {
  _clean.call(this);

  BaseView.prototype.repaint.call(this);
  this.frame.find('.open_positions').on('click', _onOpenPosClick);
  this.frame.find('.track-table .track:not(".all") input').on('click', _onShowTrack);
  this.frame.find('.track-table .track.all input').on('click', _onShowAllTracks);
  this.frame.find('.track-table .export').on('click', _onExport);
  this.frame.find('.track_0 .positions-table .show_pos').on('click', _onShowPos);
};

TracksView.prototype.show = function () {
  if (!this.frame) return;
  this.searchInput.focus();
  BaseView.prototype.show.apply(this, arguments);
};

module.exports = TracksView;

/***/ }),

/***/ "./src/ViewsFactory.js":
/*!*****************************!*\
  !*** ./src/ViewsFactory.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var MyCollectionView = __webpack_require__(/*! ./Views/TracksView */ "./src/Views/TracksView.js"),
    MyCollectionModel = __webpack_require__(/*! ./Models/TracksModel */ "./src/Models/TracksModel.js");

module.exports = function (options) {
  var _mcm = new MyCollectionModel({
    layer: options.layer
  }),
      _mcv = new MyCollectionView({
    model: _mcm,
    layer: options.layer
  });

  return {
    create: function create() {
      return [_mcv];
    }
  };
};

/***/ }),

/***/ "./src/all.css":
/*!*********************!*\
  !*** ./src/all.css ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "./src/entry.js":
/*!**********************!*\
  !*** ./src/entry.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! ./all.css */ "./src/all.css");

__webpack_require__(/*! ./locale.js */ "./src/locale.js");

var pluginName = 'TrackExportPlugin',
    menuId = 'TrackExportPlugin',
    toolbarIconId = null,
    cssTable = 'TrackExportPlugin',
    modulePath = gmxCore.getModulePath(pluginName);

var PluginPanel = __webpack_require__(/*! ./PluginPanel.js */ "./src/PluginPanel.js"),
    ViewsFactory = __webpack_require__(/*! ./ViewsFactory */ "./src/ViewsFactory.js");

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
      icon: "TrackExport",
      //menuId,
      active: "hardnav-sidebar-icon",
      inactive: "hardnav-sidebar-icon",
      hint: _gtxt('TrackExport.title')
    })();
    var tabDiv = tab.querySelector('.TrackExport');
    pluginPanel.sidebarPane = sidebar.setPane(menuId, {
      createTab: function createTab() {
        !tab.querySelector('.TrackExport') && tab.append(tabDiv);
        tab.querySelector('.TrackExport').innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1\" viewBox=\"0 0 24 24\" style=\"height: 18px;width: 18px;\">\n                     <path d=\"M 20 2 C 18.970152 2 18.141273 2.7807107 18.03125 3.78125 L 14.5625 4.78125 C 14.19654 4.3112749 13.641793 4 13 4 C 11.895431 4 11 4.8954305 11 6 C 11 7.1045695 11.895431 8 13 8 C 13.052792 8 13.104488 8.0040159 13.15625 8 L 16.53125 14.6875 C 16.440877 14.788724 16.349735 14.881869 16.28125 15 L 11.9375 14.46875 C 11.705723 13.620636 10.921625 13 10 13 C 8.8954305 13 8 13.895431 8 15 C 8 15.217462 8.0295736 15.428987 8.09375 15.625 L 4.96875 18.25 C 4.6825722 18.092012 4.3500149 18 4 18 C 2.8954305 18 2 18.895431 2 20 C 2 21.104569 2.8954305 22 4 22 C 5.1045695 22 6 21.104569 6 20 C 6 19.782538 5.9704264 19.571013 5.90625 19.375 L 9.03125 16.75 C 9.3174278 16.907988 9.6499851 17 10 17 C 10.754554 17 11.409413 16.585686 11.75 15.96875 L 16.0625 16.53125 C 16.294277 17.379364 17.078375 18 18 18 C 19.104569 18 20 17.104569 20 16 C 20 14.895431 19.104569 14 18 14 C 17.947208 14 17.895512 13.995984 17.84375 14 L 14.5 7.3125 C 14.761761 7.0130168 14.922918 6.6355416 14.96875 6.21875 L 18.4375 5.21875 C 18.80346 5.6887251 19.358207 6 20 6 C 21.104569 6 22 5.1045695 22 4 C 22 2.8954305 21.104569 2 20 2 z\" style=\"&#10;\"/>\n                 </svg>";
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

/***/ "./src/locale.js":
/*!***********************!*\
  !*** ./src/locale.js ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

_translationsHash.addtext('rus', {
  "TrackExport.title": "Треки судов",
  "TrackExport.calendar_today": "сегодня",
  "TrackExport.nodata": "Нет данных",
  "TrackExport.reload": "Загрузить/Обновить",
  "TrackExport.allDailyTracks": "все треки",
  "TrackExport.dailyTrack": "трек за сутки",
  "TrackExport.positions": "положение судна",
  "TrackExport.position": "показать",
  "TrackExport.export": "экспорт",
  "TrackExport.km": "км",
  "TrackExport.kn": "уз",
  "TrackExport.intervalExceeds": "Интервал больше 7 дней"
});

_translationsHash.addtext('eng', {
  "TrackExport.title": "Vessel tracks",
  "TrackExport.calendar_today": "today",
  "TrackExport.nodata": "No data",
  "TrackExport.reload": "Load/Update",
  "TrackExport.allDailyTracks": "whole track",
  "TrackExport.dailyTrack": "daily track",
  "TrackExport.positions": "vessel positions",
  "TrackExport.position": "position",
  "TrackExport.export": "export",
  "TrackExport.km": "km",
  "TrackExport.kn": "kn",
  "TrackExport.intervalExceeds": "Interval exceeds 7 days"
});

/***/ })

/******/ });
//# sourceMappingURL=TrackExportPlugin.js.map