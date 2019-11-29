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

/***/ "../Common/Controls/Calendar.js":
/*!**************************************!*\
  !*** ../Common/Controls/Calendar.js ***!
  \**************************************/
/*! no static exports found */
/***/ (function(module, exports) {

const SIMPLE_MODE = 1,
      ADVANCED_MODE = 2;

const _toMidnight = nsGmx.DateInterval.toMidnight,
      _fromUTC = function (date) {
  if (!date) return null;
  var timeOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.valueOf() - timeOffset);
},
      _toUTC = function (date) {
  if (!date) return null;
  var timeOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.valueOf() + timeOffset);
},
      _setMode = function (mode) {
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
      _selectFunc = function (activeInput) {
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
      _updateModel = function () {
  var dateBegin = _fromUTC(this._dateBegin.datepicker('getDate')),
      dateEnd = _fromUTC(this._dateEnd.datepicker('getDate'));

  this.dateInterval.set({
    dateBegin: dateBegin ? _toMidnight(dateBegin) : null,
    dateEnd: dateEnd ? _toMidnight(dateEnd.valueOf() + nsGmx.DateInterval.MS_IN_DAY) : null
  });
},
      _updateWidget = function () {
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
      _shiftDates = function (delta) {
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
  this.template = Handlebars.compile(`
    <table>
    <tr>
        <td><div class = "CalendarWidget-iconScrollLeft ui-helper-noselect icon-left-open"></div></td>
        <td class = "CalendarWidget-inputCell"><input class = "gmx-input-text CalendarWidget-dateBegin"></td>
        <td class = "CalendarWidget-inputCell CalendarWidget-onlyMaxVersion"><input class = "gmx-input-text CalendarWidget-dateEnd"></td>
        <td><div class = "CalendarWidget-iconScrollRight ui-helper-noselect icon-right-open" ></div></td>
        <td><div class = "CalendarWidget-iconMore {{moreIconClass}}" title = "{{moreIconTitle}}"></div></td>
        <td><div class = "CalendarWidget-forecast" hidden>{{forecast}}</div></td>
    </tr><tr>
        <td></td>
        <td class = "CalendarWidget-dateBeginInfo"></td>
        <td class = "CalendarWidget-dateEndInfo"></td>
        <td></td>
        <td></td>
    </tr>
</table>
<div class="CalendarWidget-footer"></div>`);
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

/***/ "../Common/Controls/SearchControl.js":
/*!*******************************************!*\
  !*** ../Common/Controls/SearchControl.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

let _searchString = "",
    _sparams = 'imo name mmsi';

const SearchControl = function ({
  tab,
  container,
  callback,
  searchparams,
  searcher
}) {
  container.innerHTML = '<div class="filter"><input type="text" placeholder="' + _gtxt("Lloyds.search_placeholder") + '"/>' + (!searchparams ? '' : '<div class="preferences"></div>') + '<div class="searchremove"><img class="search" src="plugins/AIS/AISSearch/svg/search.svg">' + '<img class="remove clicable" src="plugins/AIS/AISSearch/svg/remove.svg"></div>' + '</div>';
  let suggestions = tab.appendChild(document.createElement('div'));
  suggestions.classList.add("suggestions");
  suggestions.innerHTML = '<div class="suggestion">SOME VESSEL<br><span>mmsi:0, imo:0</span></div>';
  this.frame = {
    find: q => {
      return container.querySelector(q);
    }
  };
  let preferences = false;

  if (searchparams) {
    _sparams = localStorage.getItem(searchparams);
    preferences = tab.appendChild(document.createElement('div'));
    preferences.classList.add("preferences");
    preferences.innerHTML = '<div class="section">Поиск по:</div>' + '<div class="line"><div class="checkbox imo disabled"></div><div class="label">IMO<label></div></div>' + '<div class="line"><div class="checkbox mmsi"></div><div class="label">MMSI<label></div></div>' + '<div class="line"><div class="checkbox name disabled"></div><div class="label">названию</div></div>' + '<div class="line"><div class="checkbox callsign"></div><div class="label">позывному<label></div></div>' + '<div class="line"><div class="checkbox owner"></div><div class="label">собственнику<label></div></div>';
    !_sparams && (_sparams = 'imo name mmsi');
    if (_sparams.search(/imo/) < 0) _sparams += ' imo';
    if (_sparams.search(/name/) < 0) _sparams += ' name';

    let asparams = _sparams.split(' ');

    asparams.forEach((p, i) => {
      preferences.querySelector('.' + p).classList.add('checked');
    });
  } else {
    let sr = this.frame.find('.filter .searchremove');
    sr.style.borderRight = 'none';
    sr.style.paddingRight = 0;
    this.frame.find('.filter input').style.width = '85%';
  }

  this.frame = {
    find: q => {
      return container.querySelector(q);
    }
  };
  this.searchInput = this.frame.find('.filter input');

  let searchBut = this.frame.find('.filter .search'),
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
      searchDone = function () {
    if (found.values.length > 0) {
      _searchString = found.values[suggestionsFrame.current].vessel_name;
      this.searchInput.value = _searchString;
      callback(found.values[suggestionsFrame.current]);
    } // else {
    //     _clean.call(this);
    // }

  },
      doSearch = function (actualId) {
    let requests = []; // _sparams.split(' ').forEach(sp=>{       
    //     requests.push(fetch("//kosmosnimki.ru/demo/lloyds/api/v1/Ship/Search/" + sp + "/" + _searchString));
    // });

    requests.push(new searcher.searchpromise([{
      name: 'query',
      value: [_searchString]
    }]));
    Promise.all(requests).then(a => {
      //console.log(a)
      return Promise.all(a.map(r => {
        if (r.status != 200) {
          console.log(r);
          return [];
        } else return r.json();
      }));
    }).then(a => {
      //console.log(actualId+" "+delay)
      if (actualId == delay) {
        found = {
          values: []
        };
        a.forEach(r => {
          found.values = found.values.concat(searcher.parser(r));
        }); //console.log(found.values)
      } else return Promise.reject("stop");
    }).then(function () {
      // SUCCEEDED
      //console.log(_searchString)
      if (found.values.length == 0 || _searchString == "") {
        suggestions.style.display = 'none';
        return;
      }

      let scrollCont = suggestions.querySelector('.mCSB_container'),
          content = Handlebars.compile('{{#each values}}<div class="suggestion" id="{{@index}}">{{vessel_name}}<br><span>mmsi:{{mmsi}}, imo:{{imo}}, {{callsign}}</span><br><span>{{owner}}</span></div>{{/each}}')(found);

      if (!scrollCont) {
        suggestions.innerHTML = content;
        $(suggestions).mCustomScrollbar();
      } else scrollCont.innerHTML = content;

      let suggestion = suggestions.querySelectorAll('.suggestion');

      if (suggestions.style.display != 'block') {
        let cr = this.frame.find('.filter').getBoundingClientRect();
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
      suggestion.forEach(((el, i) => el.onclick = (e => {
        suggestionsFrame.current = e.currentTarget.id;
        suggestions.style.display = 'none';
        searchDone.call(this);
      }).bind(this)).bind(this));
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
        let cr = this.frame.find('.filter').getBoundingClientRect();
        preferences.style.display = 'block';
        preferences.style.position = 'fixed';
        preferences.style.left = cr.left + (cr.width - preferences.offsetWidth) / 2 + "px";
        preferences.style.top = cr.bottom + 10 + "px";
        e.stopPropagation();
      }
    }.bind(this);

    preferences.querySelectorAll('.line').forEach(el => el.onclick = e => {
      let ch = el.querySelector('.checkbox');

      if (!ch.classList.contains('disabled')) {
        let sparam = ch.classList.value.replace(/ *(checked|checkbox) */g, '');

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
    });
  }

  removeBut.onclick = function (e) {
    _searchString = '';
    this.searchInput.value = '';
    this.searchInput.focus();
    clearTimeout(delay);
    removeBut.style.display = 'none';
    searchBut.style.display = 'block';
    suggestions.style.display = 'none'; //_clean.call(this);
  }.bind(this);

  this.searchInput.onkeydown = function (e) {
    let suggestion = suggestions.querySelector('.suggestion.selected');

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

  let prepareSearchInput = function (temp, keyCode) {
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
    let temp = (this.searchInput.value || "").replace(/^\s+/, "").replace(/\s+$/, "");
    if (!prepareSearchInput(temp, e.keyCode)) return;

    if (e.keyCode == 13) {
      suggestions.style.display = 'none';
      searchDone.call(this);
    } else {
      delay = setTimeout((() => {
        doSearch.apply(this, [delay]);
      }).bind(this), 200);
    }
  }.bind(this);

  this.searchInput.onpaste = function (e) {
    let temp = ((e.originalEvent || window.clipboardData || e).clipboardData.getData('text') || "").replace(/^\s+/, "").replace(/\s+$/, "");
    if (!prepareSearchInput(temp)) return;
    delay = setTimeout((() => {
      doSearch.call(this, [delay]);
    }).bind(this), 200);
  }.bind(this);
};

SearchControl.prototype.focus = function () {
  this.searchInput.focus();
};

module.exports = SearchControl;

/***/ }),

/***/ "../Common/Controls/SelectControl.js":
/*!*******************************************!*\
  !*** ../Common/Controls/SelectControl.js ***!
  \*******************************************/
/*! no static exports found */
/***/ (function(module, exports) {

module.exports = function (container, options, active, callback) {
  let _isOptionsDisplayed = false,
      _select = document.createElement('div'),
      _optionsList = document.createElement('div'),
      _selected = active;

  _select.className = 'select-control';
  _select.innerHTML = `<span class="select-active">${options[active]}</span><span class="icon-down-open"></span>`;
  _optionsList.className = 'select-list';
  _optionsList.innerHTML = options.map((o, i) => `<div class="select-options" id="${i}">${o}</div>`).join('');
  container.append(_select);
  document.body.append(_optionsList);

  const _arrow = _select.querySelector('.icon-down-open'),
        _options = _optionsList.querySelectorAll('.select-options'),
        _hideOptions = function () {
    _optionsList.style.display = 'none';

    _optionsList.querySelectorAll('.select-options')[_selected].classList.remove('selected');

    _arrow.classList.remove('icon-up-open');

    _arrow.classList.add('icon-down-open');

    _isOptionsDisplayed = false;
  };

  let _setOptionsRect = function () {
    let selectedRc = _select.getBoundingClientRect(),
        bw = parseInt(getComputedStyle(_optionsList).borderWidth);

    if (isNaN(bw)) bw = 0;
    _optionsList.style.width = selectedRc.width - 2 * bw + "px";
    _optionsList.style.top = selectedRc.bottom - 3 + "px";
    _optionsList.style.left = selectedRc.left + "px";
  };

  for (let i = 0; i < _options.length; ++i) _options[i].addEventListener('click', e => {
    _hideOptions();

    _selected = parseInt(e.srcElement.id);
    _select.querySelector('.select-active').innerHTML = options[_selected];
    callback(_selected);
  });

  _optionsList.addEventListener('mouseleave', e => {
    _hideOptions();
  });

  _select.addEventListener('click', e => {
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

/***/ "../Common/Request.js":
/*!****************************!*\
  !*** ../Common/Request.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

const _serverBase = window.serverBase.replace(/^https?:/, document.location.protocol),
      _fetchRequest = function (url, request, method) {
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
      _sendRequest = function (url, request, method) {
  return new Promise((resolve, reject) => {
    const callback = response => {
      if (!response.Status || response.Status.toLowerCase() != 'ok' || !response.Result) {
        reject(response);
      } else resolve(response.Result);
    };

    if (url[0] == '/') url = _serverBase + url.replace(/^\//, '');
    if (!method || method == 'GET') window.sendCrossDomainJSONRequest(url, callback);
    if (method == 'POST') window.sendCrossDomainPostRequest(url, request, callback);
  });
},
      _getQueryString = function (params) {
  let qs = '';

  for (let p in params) {
    if (qs != '') qs += '&';
    qs += p + '=' + (typeof params[p] == 'object' ? JSON.stringify(params[p]) : params[p]);
  }

  return qs;
};

_searchRequest = function (params) {
  const url = `${_serverBase}VectorLayer/Search.ashx?${_getQueryString(params)}`;
  return _sendRequest(url);
}, _modifyRequest = function (params) {
  const url = `${_serverBase}VectorLayer/ModifyVectorObjects.ashx?${_getQueryString(params)}`;
  return _sendRequest(url);
}, _checkVersion = function (layer, ms) {
  setTimeout(() => {
    L.gmx.layersVersion.chkVersion(layer); //console.log('ChV')                   

    setTimeout(() => {
      L.gmx.layersVersion.chkVersion(layer); //console.log('ChV')                   

      setTimeout(() => {
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

/***/ "./icons.svg":
/*!*******************!*\
  !*** ./icons.svg ***!
  \*******************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _node_modules_svg_baker_runtime_browser_symbol_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/svg-baker-runtime/browser-symbol.js */ "./node_modules/svg-baker-runtime/browser-symbol.js");
/* harmony import */ var _node_modules_svg_baker_runtime_browser_symbol_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_svg_baker_runtime_browser_symbol_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_svg_sprite_loader_runtime_browser_sprite_build_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/svg-sprite-loader/runtime/browser-sprite.build.js */ "./node_modules/svg-sprite-loader/runtime/browser-sprite.build.js");
/* harmony import */ var _node_modules_svg_sprite_loader_runtime_browser_sprite_build_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_svg_sprite_loader_runtime_browser_sprite_build_js__WEBPACK_IMPORTED_MODULE_1__);


var symbol = new _node_modules_svg_baker_runtime_browser_symbol_js__WEBPACK_IMPORTED_MODULE_0___default.a({
  "id": "icons",
  "use": "icons-usage",
  "content": "<symbol xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" id=\"icons\">\r\n\r\n<symbol id=\"icons_arrow-left\" viewBox=\"0 0 20 20\" fill=\"none\">\r\n<path d=\"M18.3334 10H1.66669\" stroke=\"currentColor\" stroke-width=\"2\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />\r\n<path d=\"M7.50002 15.8333L1.66669 9.99996L7.50002 4.16663\" stroke=\"currentColor\" stroke-width=\"2\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />\r\n</symbol>\r\n<symbol id=\"icons_arrow-right\" viewBox=\"0 0 20 20\" fill=\"none\">\r\n<path d=\"M18.3334 10H1.66669\" stroke=\"currentColor\" stroke-width=\"2\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\" />\r\n<path d=\"M7.50002 15.8333L1.66669 9.99996L7.50002 4.16663\" stroke=\"currentColor\" stroke-width=\"2\" stroke-miterlimit=\"10\" stroke-linecap=\"round\" stroke-linejoin=\"round\" transform=\"rotate(180 10 10)\" />\r\n</symbol>\r\n\r\n<symbol id=\"icons_eye\" viewBox=\"4 4 16 16\" fill=\"none\">\r\n<path d=\"M11.93,7.28C8.87,7.28,6.1,9,4.05,11.88a0.69,0.69,0,0,0,0,.79c2,2.85,4.82,4.61,7.87,4.61s5.83-1.75,7.87-4.6a0.69,0.69,0,0,0,0-.79C17.75,9,15,7.28,11.93,7.28Zm0.22,8.52A3.45,3.45,0,0,1,8.57,12a3.46,3.46,0,0,1,3.14-3.29,3.45,3.45,0,0,1,3.58,3.75A3.47,3.47,0,0,1,12.14,15.8ZM12,14.17a1.9,1.9,0,1,1,1.69-1.77A1.85,1.85,0,0,1,12,14.17Z\" fill=\"currentColor\" />\r\n</symbol>\r\n\r\n<symbol id=\"icons_eye-off\" viewBox=\"4 4 16 16\" fill=\"none\">\r\n      <polygon points=\"18.68 20.13 4 5.38 5.32 4.13 20 18.87 18.68 20.13\" fill=\"currentColor\" />\r\n      <path fill=\"currentColor\" d=\"M12.06,8.77A3.42,3.42,0,0,1,15.26,12L18,14.72a13.33,13.33,0,0,0,1.81-2,0.69,0.69,0,0,0,0-.79C17.75,9,15,7.28,11.92,7.28a7.94,7.94,0,0,0-1.25.11Z\" />\r\n      <path fill=\"currentColor\" d=\"M12,14.17a1.83,1.83,0,0,0,1.58-1.26l-2.38-2.39a1.9,1.9,0,0,0-1.12,1.63A1.85,1.85,0,0,0,12,14.17Z\" />\r\n      <path fill=\"currentColor\" d=\"M14.79,14.09a3.35,3.35,0,0,1-2.65,1.71A3.45,3.45,0,0,1,8.57,12a3.56,3.56,0,0,1,1.5-2.7L8.69,8a11.38,11.38,0,0,0-4.64,3.92,0.69,0.69,0,0,0,0,.79c2,2.85,4.82,4.61,7.87,4.61a8.44,8.44,0,0,0,4.61-1.43Z\" />\r\n</symbol>\r\n\r\n<symbol id=\"icons_circle\" viewBox=\"0 0 16 16\" fill=\"currentColor\">\r\n<circle cx=\"8\" cy=\"8\" r=\"8\" />\r\n</symbol>\r\n\r\n<symbol id=\"icons_pen\" viewBox=\"0 0 12 12\" fill=\"currentColor\">\r\n<g xmlns=\"http://www.w3.org/2000/svg\">\r\n\t<path d=\"M6.1,2.6L0.2,8.5C0.1,8.6,0,8.8,0,9v2.3C0,11.7,0.3,12,0.8,12H3c0.2,0,0.4-0.1,0.5-0.2l5.9-5.8L6.1,2.6z\" />\r\n\t<path d=\"M11.8,2.5L9.5,0.2c-0.3-0.3-0.8-0.3-1,0L7.1,1.6l3.3,3.3l1.4-1.4C12.1,3.2,12.1,2.8,11.8,2.5z\" />\r\n</g>\r\n</symbol>\r\n\r\n<symbol id=\"icons_target\" viewBox=\"0 0 12 12\" fill=\"currentColor\">\r\n<g xmlns=\"http://www.w3.org/2000/svg\">\r\n\t<rect x=\"0\" width=\"1.5\" height=\"4.5\" />\t\r\n\t\t<rect x=\"1.5\" y=\"-1.5\" transform=\"matrix(-1.836970e-16 1 -1 -1.836970e-16 2.9945 -1.4945)\" width=\"1.5\" height=\"4.5\" />\t\r\n\t\t<rect x=\"9\" y=\"-1.5\" transform=\"matrix(-1.836970e-16 1 -1 -1.836970e-16 10.4951 -8.9951)\" width=\"1.5\" height=\"4.5\" />\r\n\t<rect x=\"10.5\" transform=\"matrix(-1 -1.224647e-16 1.224647e-16 -1 22.4863 4.5)\" width=\"1.5\" height=\"4.5\" />\r\n\t<rect x=\"10.5\" y=\"7.5\" transform=\"matrix(-1 -1.224647e-16 1.224647e-16 -1 22.4967 19.5)\" width=\"1.5\" height=\"4.5\" />\r\n\t<rect x=\"9\" y=\"9\" transform=\"matrix(6.123234e-17 -1 1 6.123234e-17 -1.4997 21.0003)\" width=\"1.5\" height=\"4.5\" />\r\n\t<rect x=\"1.5\" y=\"9\" transform=\"matrix(6.123234e-17 -1 1 6.123234e-17 -9.0003 13.4997)\" width=\"1.5\" height=\"4.5\" />\r\n\t<rect x=\"0\" y=\"7.5\" width=\"1.5\" height=\"4.5\" />\r\n\t<ellipse cx=\"6\" cy=\"6\" rx=\"2.2\" ry=\"2.3\" />\r\n</g>\r\n</symbol>\r\n\r\n<symbol id=\"icons_info\" viewBox=\"2 2 20 20\" fill=\"currentColor\">\r\n<g class=\"nc-icon-wrapper\" fill=\"currentColor\">\r\n<path d=\"M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z\" />\r\n</g>\r\n</symbol>\r\n\r\n<symbol id=\"icons_polygon\" viewBox=\"4 0 20 20\" fill=\"currentColor\">\r\n      <rect x=\"6.04\" y=\"8.9\" width=\"2.05\" height=\"0.97\" transform=\"translate(-4.65 10.2) rotate(-57.04)\" /><rect x=\"10.84\" y=\"6.25\" width=\"2.05\" height=\"0.97\" /><rect x=\"10.84\" y=\"16.89\" width=\"2.05\" height=\"0.97\" /><rect x=\"6.58\" y=\"13.65\" width=\"0.97\" height=\"2.05\" transform=\"translate(-6.85 6.2) rotate(-32.96)\" /><path d=\"M8.68,6.28a0.45,0.45,0,1,1-.45.45,0.45,0.45,0,0,1,.45-0.45m0-1a1.45,1.45,0,1,0,1.45,1.45A1.45,1.45,0,0,0,8.68,5.28h0Z\" /><path d=\"M8.68,16.87a0.45,0.45,0,1,1-.45.45,0.45,0.45,0,0,1,.45-0.45m0-1a1.45,1.45,0,1,0,1.45,1.45,1.45,1.45,0,0,0-1.45-1.45h0Z\" /><path d=\"M5.45,11.58A0.45,0.45,0,1,1,5,12a0.45,0.45,0,0,1,.45-0.45m0-1A1.45,1.45,0,1,0,6.9,12a1.45,1.45,0,0,0-1.45-1.45h0Z\" /><rect x=\"15.91\" y=\"14.14\" width=\"2.05\" height=\"0.97\" transform=\"translate(-4.55 20.88) rotate(-57.04)\" /><rect x=\"16.45\" y=\"8.31\" width=\"0.97\" height=\"2.05\" transform=\"translate(-2.35 10.72) rotate(-32.96)\" /><path d=\"M15.32,16.82a0.45,0.45,0,1,1-.45.45,0.45,0.45,0,0,1,.45-0.45m0-1a1.45,1.45,0,1,0,1.45,1.45,1.45,1.45,0,0,0-1.45-1.45h0Z\" /><path d=\"M15.32,6.24a0.45,0.45,0,1,1-.45.45,0.45,0.45,0,0,1,.45-0.45m0-1a1.45,1.45,0,1,0,1.45,1.45,1.45,1.45,0,0,0-1.45-1.45h0Z\" /><path d=\"M18.55,11.53a0.45,0.45,0,1,1-.45.45,0.45,0.45,0,0,1,.45-0.45m0-1A1.45,1.45,0,1,0,20,12a1.45,1.45,0,0,0-1.45-1.45h0Z\" />\r\n</symbol>\r\n\r\n<symbol id=\"icons_selectreg\" viewBox=\"12 13 24 20\" fill=\"currentColor\">\r\n    <path d=\"m 21.099609,8.4511719 c -1.469868,0 -2.548828,1.0789594 -2.548828,2.5488281 l 0,10.300781 a 0.45145663,0.45145663 0 0 1 -0.794922,0.291016 c -1.069223,-1.263628 -2.20723,-2.140625 -3.15625,-2.140625 -0.799555,0 -1.440052,0.272383 -1.724609,0.699219 a 0.45145663,0.45145663 0 0 1 -0.02344,0.03125 c -0.304031,0.380039 -0.58479,1.101873 -0.220703,2.285156 0.363172,1.180307 2.071447,4.826112 3.949219,7.791015 0.686643,1.07901 1.37235,1.961753 1.960938,2.648438 a 0.45145663,0.45145663 0 0 1 0.01367,0.01367 c 1.100572,1.400729 1.896484,2.439482 1.896484,4.080078 0,0.199686 0.05878,0.322449 0.142578,0.40625 0.0838,0.0838 0.206564,0.142578 0.40625,0.142578 l 12,0 c 0.199686,0 0.322449,-0.05878 0.40625,-0.142578 0.0838,-0.0838 0.142578,-0.206564 0.142578,-0.40625 0,-2.462696 0.514524,-4.413564 1.013672,-6.410156 C 35.061648,28.593252 35.548828,26.542127 35.548828,24 l 0,-3 c 0,-1.469869 -1.078959,-2.548828 -2.548828,-2.548828 -0.325352,0 -0.686138,0.08548 -0.957031,0.175781 A 0.45145663,0.45145663 0 0 1 31.46875,18.332031 C 31.119977,17.19852 30.206706,16.451172 29,16.451172 c -0.439576,0 -0.8348,0.08997 -1.128906,0.310547 a 0.45145663,0.45145663 0 0 1 -0.654297,-0.123047 c -0.424766,-0.679626 -1.181444,-1.1875 -2.117188,-1.1875 -0.325352,0 -0.55809,0.076 -0.857421,0.175781 a 0.45145663,0.45145663 0 0 1 -0.59375,-0.427734 l 0,-4.199219 c 0,-1.4698687 -1.07896,-2.5488281 -2.548829,-2.5488281 z M 21,9.5488281 c 0.400314,0 0.778723,0.1400511 1.044922,0.40625 0.266199,0.2661989 0.40625,0.6446079 0.40625,1.0449219 l 0,9 c 0,0.199686 0.05878,0.322449 0.142578,0.40625 0.0838,0.0838 0.206564,0.142578 0.40625,0.142578 0.199686,0 0.322449,-0.05878 0.40625,-0.142578 0.0838,-0.0838 0.142578,-0.206564 0.142578,-0.40625 l 0,-2 c 0,-0.400314 0.140051,-0.778723 0.40625,-1.044922 0.266199,-0.266199 0.644608,-0.40625 1.044922,-0.40625 0.400314,0 0.778723,0.140051 1.044922,0.40625 0.266199,0.266199 0.40625,0.644608 0.40625,1.044922 l 0,3 c 0,0.199686 0.05878,0.322449 0.142578,0.40625 0.0838,0.0838 0.206564,0.142578 0.40625,0.142578 0.199686,0 0.322449,-0.05878 0.40625,-0.142578 0.0838,-0.0838 0.142578,-0.206564 0.142578,-0.40625 l 0,-2 c 0,-0.400314 0.140051,-0.778723 0.40625,-1.044922 0.266199,-0.266199 0.644608,-0.40625 1.044922,-0.40625 0.400314,0 0.778723,0.140051 1.044922,0.40625 0.266199,0.266199 0.40625,0.644608 0.40625,1.044922 l 0,3 c 0,0.199686 0.05878,0.322449 0.142578,0.40625 0.0838,0.0838 0.206564,0.142578 0.40625,0.142578 0.199686,0 0.322449,-0.05878 0.40625,-0.142578 0.0838,-0.0838 0.142578,-0.206564 0.142578,-0.40625 l 0,-1 c 0,-0.400314 0.140051,-0.778723 0.40625,-1.044922 0.266199,-0.266199 0.644608,-0.40625 1.044922,-0.40625 0.400314,0 0.778723,0.140051 1.044922,0.40625 0.266199,0.266199 0.40625,0.644608 0.40625,1.044922 l 0,3 c 0,2.365422 -0.514537,4.312055 -1.013672,6.308594 l 0.0039,-0.01172 c -0.40345,1.815526 -0.892826,3.579678 -0.990234,5.722656 A 0.45145663,0.45145663 0 0 1 32,36.451172 l -10.099609,0 A 0.45145663,0.45145663 0 0 1 21.451172,36.052734 C 21.268949,34.50384 20.366883,33.503929 19.267578,32.304688 a 0.45145663,0.45145663 0 0 1 -0.0293,-0.0332 c -0.588009,-0.784011 -1.201373,-1.503012 -1.820312,-2.533203 l -0.002,-0.002 c -8.56e-4,-0.0014 -0.0011,-0.0025 -0.002,-0.0039 -1.007254,-1.612144 -1.886276,-3.221277 -2.554687,-4.570313 -0.669307,-1.350844 -1.123882,-2.415821 -1.294922,-3.042968 a 0.45145663,0.45145663 0 0 1 -0.0078,-0.03125 c -0.05341,-0.267047 -0.08399,-0.487278 -0.08399,-0.6875 0,-0.200222 -8.21e-4,-0.409335 0.208985,-0.619141 0.156606,-0.156607 0.331654,-0.197642 0.466797,-0.216797 0.135142,-0.01916 0.251856,-0.01563 0.351562,-0.01563 0.379126,0 0.656448,0.179905 0.982422,0.419922 0.325974,0.240017 0.676911,0.568581 1.03125,0.96875 0.708677,0.800338 1.432333,1.886537 1.90625,3.097656 a 0.45145663,0.45145663 0 0 1 0.03125,0.164063 l 0,0.800781 c 0,0.199686 0.05878,0.322449 0.142578,0.40625 0.0838,0.0838 0.206564,0.142578 0.40625,0.142578 0.199686,0 0.322449,-0.05878 0.40625,-0.142578 0.0838,-0.0838 0.142578,-0.206564 0.142578,-0.40625 l 0,-15 c 0,-0.400314 0.140051,-0.778723 0.40625,-1.0449219 C 20.221277,9.6888792 20.599686,9.5488281 21,9.5488281 Z\" />\r\n</symbol>\r\n\r\n</symbol>"
});
var result = _node_modules_svg_sprite_loader_runtime_browser_sprite_build_js__WEBPACK_IMPORTED_MODULE_1___default.a.add(symbol);
/* harmony default export */ __webpack_exports__["default"] = (symbol);

/***/ }),

/***/ "./node_modules/svg-baker-runtime/browser-symbol.js":
/*!**********************************************************!*\
  !*** ./node_modules/svg-baker-runtime/browser-symbol.js ***!
  \**********************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {(function (global, factory) {
	 true ? module.exports = factory() :
	undefined;
}(this, (function () { 'use strict';

var SpriteSymbol = function SpriteSymbol(ref) {
  var id = ref.id;
  var viewBox = ref.viewBox;
  var content = ref.content;

  this.id = id;
  this.viewBox = viewBox;
  this.content = content;
};

/**
 * @return {string}
 */
SpriteSymbol.prototype.stringify = function stringify () {
  return this.content;
};

/**
 * @return {string}
 */
SpriteSymbol.prototype.toString = function toString () {
  return this.stringify();
};

SpriteSymbol.prototype.destroy = function destroy () {
    var this$1 = this;

  ['id', 'viewBox', 'content'].forEach(function (prop) { return delete this$1[prop]; });
};

/**
 * @param {string} content
 * @return {Element}
 */
var parse = function (content) {
  var hasImportNode = !!document.importNode;
  var doc = new DOMParser().parseFromString(content, 'image/svg+xml').documentElement;

  /**
   * Fix for browser which are throwing WrongDocumentError
   * if you insert an element which is not part of the document
   * @see http://stackoverflow.com/a/7986519/4624403
   */
  if (hasImportNode) {
    return document.importNode(doc, true);
  }

  return doc;
};

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var deepmerge = createCommonjsModule(function (module, exports) {
(function (root, factory) {
    if (false) {} else {
        module.exports = factory();
    }
}(commonjsGlobal, function () {

function isMergeableObject(val) {
    var nonNullObject = val && typeof val === 'object';

    return nonNullObject
        && Object.prototype.toString.call(val) !== '[object RegExp]'
        && Object.prototype.toString.call(val) !== '[object Date]'
}

function emptyTarget(val) {
    return Array.isArray(val) ? [] : {}
}

function cloneIfNecessary(value, optionsArgument) {
    var clone = optionsArgument && optionsArgument.clone === true;
    return (clone && isMergeableObject(value)) ? deepmerge(emptyTarget(value), value, optionsArgument) : value
}

function defaultArrayMerge(target, source, optionsArgument) {
    var destination = target.slice();
    source.forEach(function(e, i) {
        if (typeof destination[i] === 'undefined') {
            destination[i] = cloneIfNecessary(e, optionsArgument);
        } else if (isMergeableObject(e)) {
            destination[i] = deepmerge(target[i], e, optionsArgument);
        } else if (target.indexOf(e) === -1) {
            destination.push(cloneIfNecessary(e, optionsArgument));
        }
    });
    return destination
}

function mergeObject(target, source, optionsArgument) {
    var destination = {};
    if (isMergeableObject(target)) {
        Object.keys(target).forEach(function (key) {
            destination[key] = cloneIfNecessary(target[key], optionsArgument);
        });
    }
    Object.keys(source).forEach(function (key) {
        if (!isMergeableObject(source[key]) || !target[key]) {
            destination[key] = cloneIfNecessary(source[key], optionsArgument);
        } else {
            destination[key] = deepmerge(target[key], source[key], optionsArgument);
        }
    });
    return destination
}

function deepmerge(target, source, optionsArgument) {
    var array = Array.isArray(source);
    var options = optionsArgument || { arrayMerge: defaultArrayMerge };
    var arrayMerge = options.arrayMerge || defaultArrayMerge;

    if (array) {
        return Array.isArray(target) ? arrayMerge(target, source, optionsArgument) : cloneIfNecessary(source, optionsArgument)
    } else {
        return mergeObject(target, source, optionsArgument)
    }
}

deepmerge.all = function deepmergeAll(array, optionsArgument) {
    if (!Array.isArray(array) || array.length < 2) {
        throw new Error('first argument should be an array with at least two elements')
    }

    // we are sure there are at least 2 values, so it is safe to have no initial value
    return array.reduce(function(prev, next) {
        return deepmerge(prev, next, optionsArgument)
    })
};

return deepmerge

}));
});

var namespaces_1 = createCommonjsModule(function (module, exports) {
var namespaces = {
  svg: {
    name: 'xmlns',
    uri: 'http://www.w3.org/2000/svg'
  },
  xlink: {
    name: 'xmlns:xlink',
    uri: 'http://www.w3.org/1999/xlink'
  }
};

exports.default = namespaces;
module.exports = exports.default;
});

/**
 * @param {Object} attrs
 * @return {string}
 */
var objectToAttrsString = function (attrs) {
  return Object.keys(attrs).map(function (attr) {
    var value = attrs[attr].toString().replace(/"/g, '&quot;');
    return (attr + "=\"" + value + "\"");
  }).join(' ');
};

var svg = namespaces_1.svg;
var xlink = namespaces_1.xlink;

var defaultAttrs = {};
defaultAttrs[svg.name] = svg.uri;
defaultAttrs[xlink.name] = xlink.uri;

/**
 * @param {string} [content]
 * @param {Object} [attributes]
 * @return {string}
 */
var wrapInSvgString = function (content, attributes) {
  if ( content === void 0 ) content = '';

  var attrs = deepmerge(defaultAttrs, attributes || {});
  var attrsRendered = objectToAttrsString(attrs);
  return ("<svg " + attrsRendered + ">" + content + "</svg>");
};

var BrowserSpriteSymbol = (function (SpriteSymbol$$1) {
  function BrowserSpriteSymbol () {
    SpriteSymbol$$1.apply(this, arguments);
  }

  if ( SpriteSymbol$$1 ) BrowserSpriteSymbol.__proto__ = SpriteSymbol$$1;
  BrowserSpriteSymbol.prototype = Object.create( SpriteSymbol$$1 && SpriteSymbol$$1.prototype );
  BrowserSpriteSymbol.prototype.constructor = BrowserSpriteSymbol;

  var prototypeAccessors = { isMounted: {} };

  prototypeAccessors.isMounted.get = function () {
    return !!this.node;
  };

  /**
   * @param {Element} node
   * @return {BrowserSpriteSymbol}
   */
  BrowserSpriteSymbol.createFromExistingNode = function createFromExistingNode (node) {
    return new BrowserSpriteSymbol({
      id: node.getAttribute('id'),
      viewBox: node.getAttribute('viewBox'),
      content: node.outerHTML
    });
  };

  BrowserSpriteSymbol.prototype.destroy = function destroy () {
    if (this.isMounted) {
      this.unmount();
    }
    SpriteSymbol$$1.prototype.destroy.call(this);
  };

  /**
   * @param {Element|string} target
   * @return {Element}
   */
  BrowserSpriteSymbol.prototype.mount = function mount (target) {
    if (this.isMounted) {
      return this.node;
    }

    var mountTarget = typeof target === 'string' ? document.querySelector(target) : target;
    var node = this.render();
    this.node = node;

    mountTarget.appendChild(node);

    return node;
  };

  /**
   * @return {Element}
   */
  BrowserSpriteSymbol.prototype.render = function render () {
    var content = this.stringify();
    return parse(wrapInSvgString(content)).childNodes[0];
  };

  BrowserSpriteSymbol.prototype.unmount = function unmount () {
    this.node.parentNode.removeChild(this.node);
  };

  Object.defineProperties( BrowserSpriteSymbol.prototype, prototypeAccessors );

  return BrowserSpriteSymbol;
}(SpriteSymbol));

return BrowserSpriteSymbol;

})));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/svg-sprite-loader/runtime/browser-sprite.build.js":
/*!************************************************************************!*\
  !*** ./node_modules/svg-sprite-loader/runtime/browser-sprite.build.js ***!
  \************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

/* WEBPACK VAR INJECTION */(function(global) {(function (global, factory) {
	 true ? module.exports = factory() :
	undefined;
}(this, (function () { 'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var deepmerge = createCommonjsModule(function (module, exports) {
(function (root, factory) {
    if (false) {} else {
        module.exports = factory();
    }
}(commonjsGlobal, function () {

function isMergeableObject(val) {
    var nonNullObject = val && typeof val === 'object';

    return nonNullObject
        && Object.prototype.toString.call(val) !== '[object RegExp]'
        && Object.prototype.toString.call(val) !== '[object Date]'
}

function emptyTarget(val) {
    return Array.isArray(val) ? [] : {}
}

function cloneIfNecessary(value, optionsArgument) {
    var clone = optionsArgument && optionsArgument.clone === true;
    return (clone && isMergeableObject(value)) ? deepmerge(emptyTarget(value), value, optionsArgument) : value
}

function defaultArrayMerge(target, source, optionsArgument) {
    var destination = target.slice();
    source.forEach(function(e, i) {
        if (typeof destination[i] === 'undefined') {
            destination[i] = cloneIfNecessary(e, optionsArgument);
        } else if (isMergeableObject(e)) {
            destination[i] = deepmerge(target[i], e, optionsArgument);
        } else if (target.indexOf(e) === -1) {
            destination.push(cloneIfNecessary(e, optionsArgument));
        }
    });
    return destination
}

function mergeObject(target, source, optionsArgument) {
    var destination = {};
    if (isMergeableObject(target)) {
        Object.keys(target).forEach(function (key) {
            destination[key] = cloneIfNecessary(target[key], optionsArgument);
        });
    }
    Object.keys(source).forEach(function (key) {
        if (!isMergeableObject(source[key]) || !target[key]) {
            destination[key] = cloneIfNecessary(source[key], optionsArgument);
        } else {
            destination[key] = deepmerge(target[key], source[key], optionsArgument);
        }
    });
    return destination
}

function deepmerge(target, source, optionsArgument) {
    var array = Array.isArray(source);
    var options = optionsArgument || { arrayMerge: defaultArrayMerge };
    var arrayMerge = options.arrayMerge || defaultArrayMerge;

    if (array) {
        return Array.isArray(target) ? arrayMerge(target, source, optionsArgument) : cloneIfNecessary(source, optionsArgument)
    } else {
        return mergeObject(target, source, optionsArgument)
    }
}

deepmerge.all = function deepmergeAll(array, optionsArgument) {
    if (!Array.isArray(array) || array.length < 2) {
        throw new Error('first argument should be an array with at least two elements')
    }

    // we are sure there are at least 2 values, so it is safe to have no initial value
    return array.reduce(function(prev, next) {
        return deepmerge(prev, next, optionsArgument)
    })
};

return deepmerge

}));
});

//      
// An event handler can take an optional event argument
// and should not return a value
                                          
// An array of all currently registered event handlers for a type
                                            
// A map of event types and their corresponding event handlers.
                        
                                   
  

/** Mitt: Tiny (~200b) functional event emitter / pubsub.
 *  @name mitt
 *  @returns {Mitt}
 */
function mitt(all                 ) {
	all = all || Object.create(null);

	return {
		/**
		 * Register an event handler for the given type.
		 *
		 * @param  {String} type	Type of event to listen for, or `"*"` for all events
		 * @param  {Function} handler Function to call in response to given event
		 * @memberOf mitt
		 */
		on: function on(type        , handler              ) {
			(all[type] || (all[type] = [])).push(handler);
		},

		/**
		 * Remove an event handler for the given type.
		 *
		 * @param  {String} type	Type of event to unregister `handler` from, or `"*"`
		 * @param  {Function} handler Handler function to remove
		 * @memberOf mitt
		 */
		off: function off(type        , handler              ) {
			if (all[type]) {
				all[type].splice(all[type].indexOf(handler) >>> 0, 1);
			}
		},

		/**
		 * Invoke all handlers for the given type.
		 * If present, `"*"` handlers are invoked after type-matched handlers.
		 *
		 * @param {String} type  The event type to invoke
		 * @param {Any} [evt]  Any value (object is recommended and powerful), passed to each handler
		 * @memberof mitt
		 */
		emit: function emit(type        , evt     ) {
			(all[type] || []).map(function (handler) { handler(evt); });
			(all['*'] || []).map(function (handler) { handler(type, evt); });
		}
	};
}

var namespaces_1 = createCommonjsModule(function (module, exports) {
var namespaces = {
  svg: {
    name: 'xmlns',
    uri: 'http://www.w3.org/2000/svg'
  },
  xlink: {
    name: 'xmlns:xlink',
    uri: 'http://www.w3.org/1999/xlink'
  }
};

exports.default = namespaces;
module.exports = exports.default;
});

/**
 * @param {Object} attrs
 * @return {string}
 */
var objectToAttrsString = function (attrs) {
  return Object.keys(attrs).map(function (attr) {
    var value = attrs[attr].toString().replace(/"/g, '&quot;');
    return (attr + "=\"" + value + "\"");
  }).join(' ');
};

var svg = namespaces_1.svg;
var xlink = namespaces_1.xlink;

var defaultAttrs = {};
defaultAttrs[svg.name] = svg.uri;
defaultAttrs[xlink.name] = xlink.uri;

/**
 * @param {string} [content]
 * @param {Object} [attributes]
 * @return {string}
 */
var wrapInSvgString = function (content, attributes) {
  if ( content === void 0 ) content = '';

  var attrs = deepmerge(defaultAttrs, attributes || {});
  var attrsRendered = objectToAttrsString(attrs);
  return ("<svg " + attrsRendered + ">" + content + "</svg>");
};

var svg$1 = namespaces_1.svg;
var xlink$1 = namespaces_1.xlink;

var defaultConfig = {
  attrs: ( obj = {
    style: ['position: absolute', 'width: 0', 'height: 0'].join('; ')
  }, obj[svg$1.name] = svg$1.uri, obj[xlink$1.name] = xlink$1.uri, obj )
};
var obj;

var Sprite = function Sprite(config) {
  this.config = deepmerge(defaultConfig, config || {});
  this.symbols = [];
};

/**
 * Add new symbol. If symbol with the same id exists it will be replaced.
 * @param {SpriteSymbol} symbol
 * @return {boolean} `true` - symbol was added, `false` - replaced
 */
Sprite.prototype.add = function add (symbol) {
  var ref = this;
    var symbols = ref.symbols;
  var existing = this.find(symbol.id);

  if (existing) {
    symbols[symbols.indexOf(existing)] = symbol;
    return false;
  }

  symbols.push(symbol);
  return true;
};

/**
 * Remove symbol & destroy it
 * @param {string} id
 * @return {boolean} `true` - symbol was found & successfully destroyed, `false` - otherwise
 */
Sprite.prototype.remove = function remove (id) {
  var ref = this;
    var symbols = ref.symbols;
  var symbol = this.find(id);

  if (symbol) {
    symbols.splice(symbols.indexOf(symbol), 1);
    symbol.destroy();
    return true;
  }

  return false;
};

/**
 * @param {string} id
 * @return {SpriteSymbol|null}
 */
Sprite.prototype.find = function find (id) {
  return this.symbols.filter(function (s) { return s.id === id; })[0] || null;
};

/**
 * @param {string} id
 * @return {boolean}
 */
Sprite.prototype.has = function has (id) {
  return this.find(id) !== null;
};

/**
 * @return {string}
 */
Sprite.prototype.stringify = function stringify () {
  var ref = this.config;
    var attrs = ref.attrs;
  var stringifiedSymbols = this.symbols.map(function (s) { return s.stringify(); }).join('');
  return wrapInSvgString(stringifiedSymbols, attrs);
};

/**
 * @return {string}
 */
Sprite.prototype.toString = function toString () {
  return this.stringify();
};

Sprite.prototype.destroy = function destroy () {
  this.symbols.forEach(function (s) { return s.destroy(); });
};

var SpriteSymbol = function SpriteSymbol(ref) {
  var id = ref.id;
  var viewBox = ref.viewBox;
  var content = ref.content;

  this.id = id;
  this.viewBox = viewBox;
  this.content = content;
};

/**
 * @return {string}
 */
SpriteSymbol.prototype.stringify = function stringify () {
  return this.content;
};

/**
 * @return {string}
 */
SpriteSymbol.prototype.toString = function toString () {
  return this.stringify();
};

SpriteSymbol.prototype.destroy = function destroy () {
    var this$1 = this;

  ['id', 'viewBox', 'content'].forEach(function (prop) { return delete this$1[prop]; });
};

/**
 * @param {string} content
 * @return {Element}
 */
var parse = function (content) {
  var hasImportNode = !!document.importNode;
  var doc = new DOMParser().parseFromString(content, 'image/svg+xml').documentElement;

  /**
   * Fix for browser which are throwing WrongDocumentError
   * if you insert an element which is not part of the document
   * @see http://stackoverflow.com/a/7986519/4624403
   */
  if (hasImportNode) {
    return document.importNode(doc, true);
  }

  return doc;
};

var BrowserSpriteSymbol = (function (SpriteSymbol$$1) {
  function BrowserSpriteSymbol () {
    SpriteSymbol$$1.apply(this, arguments);
  }

  if ( SpriteSymbol$$1 ) BrowserSpriteSymbol.__proto__ = SpriteSymbol$$1;
  BrowserSpriteSymbol.prototype = Object.create( SpriteSymbol$$1 && SpriteSymbol$$1.prototype );
  BrowserSpriteSymbol.prototype.constructor = BrowserSpriteSymbol;

  var prototypeAccessors = { isMounted: {} };

  prototypeAccessors.isMounted.get = function () {
    return !!this.node;
  };

  /**
   * @param {Element} node
   * @return {BrowserSpriteSymbol}
   */
  BrowserSpriteSymbol.createFromExistingNode = function createFromExistingNode (node) {
    return new BrowserSpriteSymbol({
      id: node.getAttribute('id'),
      viewBox: node.getAttribute('viewBox'),
      content: node.outerHTML
    });
  };

  BrowserSpriteSymbol.prototype.destroy = function destroy () {
    if (this.isMounted) {
      this.unmount();
    }
    SpriteSymbol$$1.prototype.destroy.call(this);
  };

  /**
   * @param {Element|string} target
   * @return {Element}
   */
  BrowserSpriteSymbol.prototype.mount = function mount (target) {
    if (this.isMounted) {
      return this.node;
    }

    var mountTarget = typeof target === 'string' ? document.querySelector(target) : target;
    var node = this.render();
    this.node = node;

    mountTarget.appendChild(node);

    return node;
  };

  /**
   * @return {Element}
   */
  BrowserSpriteSymbol.prototype.render = function render () {
    var content = this.stringify();
    return parse(wrapInSvgString(content)).childNodes[0];
  };

  BrowserSpriteSymbol.prototype.unmount = function unmount () {
    this.node.parentNode.removeChild(this.node);
  };

  Object.defineProperties( BrowserSpriteSymbol.prototype, prototypeAccessors );

  return BrowserSpriteSymbol;
}(SpriteSymbol));

var defaultConfig$1 = {
  /**
   * Should following options be automatically configured:
   * - `syncUrlsWithBaseTag`
   * - `locationChangeAngularEmitter`
   * - `moveGradientsOutsideSymbol`
   * @type {boolean}
   */
  autoConfigure: true,

  /**
   * Default mounting selector
   * @type {string}
   */
  mountTo: 'body',

  /**
   * Fix disappearing SVG elements when <base href> exists.
   * Executes when sprite mounted.
   * @see http://stackoverflow.com/a/18265336/796152
   * @see https://github.com/everdimension/angular-svg-base-fix
   * @see https://github.com/angular/angular.js/issues/8934#issuecomment-56568466
   * @type {boolean}
   */
  syncUrlsWithBaseTag: false,

  /**
   * Should sprite listen custom location change event
   * @type {boolean}
   */
  listenLocationChangeEvent: true,

  /**
   * Custom window event name which should be emitted to update sprite urls
   * @type {string}
   */
  locationChangeEvent: 'locationChange',

  /**
   * Emit location change event in Angular automatically
   * @type {boolean}
   */
  locationChangeAngularEmitter: false,

  /**
   * Selector to find symbols usages when updating sprite urls
   * @type {string}
   */
  usagesToUpdate: 'use[*|href]',

  /**
   * Fix Firefox bug when gradients and patterns don't work if they are within a symbol.
   * Executes when sprite is rendered, but not mounted.
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=306674
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=353575
   * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1235364
   * @type {boolean}
   */
  moveGradientsOutsideSymbol: false
};

/**
 * @param {*} arrayLike
 * @return {Array}
 */
var arrayFrom = function (arrayLike) {
  return Array.prototype.slice.call(arrayLike, 0);
};

var browser = {
  isChrome: function () { return /chrome/i.test(navigator.userAgent); },
  isFirefox: function () { return /firefox/i.test(navigator.userAgent); },

  // https://msdn.microsoft.com/en-us/library/ms537503(v=vs.85).aspx
  isIE: function () { return /msie/i.test(navigator.userAgent) || /trident/i.test(navigator.userAgent); },
  isEdge: function () { return /edge/i.test(navigator.userAgent); }
};

/**
 * @param {string} name
 * @param {*} data
 */
var dispatchEvent = function (name, data) {
  var event = document.createEvent('CustomEvent');
  event.initCustomEvent(name, false, false, data);
  window.dispatchEvent(event);
};

/**
 * IE doesn't evaluate <style> tags in SVGs that are dynamically added to the page.
 * This trick will trigger IE to read and use any existing SVG <style> tags.
 * @see https://github.com/iconic/SVGInjector/issues/23
 * @see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10898469/
 *
 * @param {Element} node DOM Element to search <style> tags in
 * @return {Array<HTMLStyleElement>}
 */
var evalStylesIEWorkaround = function (node) {
  var updatedNodes = [];

  arrayFrom(node.querySelectorAll('style'))
    .forEach(function (style) {
      style.textContent += '';
      updatedNodes.push(style);
    });

  return updatedNodes;
};

/**
 * @param {string} [url] If not provided - current URL will be used
 * @return {string}
 */
var getUrlWithoutFragment = function (url) {
  return (url || window.location.href).split('#')[0];
};

/* global angular */
/**
 * @param {string} eventName
 */
var locationChangeAngularEmitter = function (eventName) {
  angular.module('ng').run(['$rootScope', function ($rootScope) {
    $rootScope.$on('$locationChangeSuccess', function (e, newUrl, oldUrl) {
      dispatchEvent(eventName, { oldUrl: oldUrl, newUrl: newUrl });
    });
  }]);
};

var defaultSelector = 'linearGradient, radialGradient, pattern';

/**
 * @param {Element} svg
 * @param {string} [selector]
 * @return {Element}
 */
var moveGradientsOutsideSymbol = function (svg, selector) {
  if ( selector === void 0 ) selector = defaultSelector;

  arrayFrom(svg.querySelectorAll('symbol')).forEach(function (symbol) {
    arrayFrom(symbol.querySelectorAll(selector)).forEach(function (node) {
      symbol.parentNode.insertBefore(node, symbol);
    });
  });
  return svg;
};

/**
 * @param {NodeList} nodes
 * @param {Function} [matcher]
 * @return {Attr[]}
 */
function selectAttributes(nodes, matcher) {
  var attrs = arrayFrom(nodes).reduce(function (acc, node) {
    if (!node.attributes) {
      return acc;
    }

    var arrayfied = arrayFrom(node.attributes);
    var matched = matcher ? arrayfied.filter(matcher) : arrayfied;
    return acc.concat(matched);
  }, []);

  return attrs;
}

/**
 * @param {NodeList|Node} nodes
 * @param {boolean} [clone=true]
 * @return {string}
 */

var xLinkNS = namespaces_1.xlink.uri;
var xLinkAttrName = 'xlink:href';

// eslint-disable-next-line no-useless-escape
var specialUrlCharsPattern = /[{}|\\\^\[\]`"<>]/g;

function encoder(url) {
  return url.replace(specialUrlCharsPattern, function (match) {
    return ("%" + (match[0].charCodeAt(0).toString(16).toUpperCase()));
  });
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * @param {NodeList} nodes
 * @param {string} startsWith
 * @param {string} replaceWith
 * @return {NodeList}
 */
function updateReferences(nodes, startsWith, replaceWith) {
  arrayFrom(nodes).forEach(function (node) {
    var href = node.getAttribute(xLinkAttrName);
    if (href && href.indexOf(startsWith) === 0) {
      var newUrl = href.replace(startsWith, replaceWith);
      node.setAttributeNS(xLinkNS, xLinkAttrName, newUrl);
    }
  });

  return nodes;
}

/**
 * List of SVG attributes to update url() target in them
 */
var attList = [
  'clipPath',
  'colorProfile',
  'src',
  'cursor',
  'fill',
  'filter',
  'marker',
  'markerStart',
  'markerMid',
  'markerEnd',
  'mask',
  'stroke',
  'style'
];

var attSelector = attList.map(function (attr) { return ("[" + attr + "]"); }).join(',');

/**
 * Update URLs in svg image (like `fill="url(...)"`) and update referencing elements
 * @param {Element} svg
 * @param {NodeList} references
 * @param {string|RegExp} startsWith
 * @param {string} replaceWith
 * @return {void}
 *
 * @example
 * const sprite = document.querySelector('svg.sprite');
 * const usages = document.querySelectorAll('use');
 * updateUrls(sprite, usages, '#', 'prefix#');
 */
var updateUrls = function (svg, references, startsWith, replaceWith) {
  var startsWithEncoded = encoder(startsWith);
  var replaceWithEncoded = encoder(replaceWith);

  var nodes = svg.querySelectorAll(attSelector);
  var attrs = selectAttributes(nodes, function (ref) {
    var localName = ref.localName;
    var value = ref.value;

    return attList.indexOf(localName) !== -1 && value.indexOf(("url(" + startsWithEncoded)) !== -1;
  });

  attrs.forEach(function (attr) { return attr.value = attr.value.replace(new RegExp(escapeRegExp(startsWithEncoded), 'g'), replaceWithEncoded); });
  updateReferences(references, startsWithEncoded, replaceWithEncoded);
};

/**
 * Internal emitter events
 * @enum
 * @private
 */
var Events = {
  MOUNT: 'mount',
  SYMBOL_MOUNT: 'symbol_mount'
};

var BrowserSprite = (function (Sprite$$1) {
  function BrowserSprite(cfg) {
    var this$1 = this;
    if ( cfg === void 0 ) cfg = {};

    Sprite$$1.call(this, deepmerge(defaultConfig$1, cfg));

    var emitter = mitt();
    this._emitter = emitter;
    this.node = null;

    var ref = this;
    var config = ref.config;

    if (config.autoConfigure) {
      this._autoConfigure(cfg);
    }

    if (config.syncUrlsWithBaseTag) {
      var baseUrl = document.getElementsByTagName('base')[0].getAttribute('href');
      emitter.on(Events.MOUNT, function () { return this$1.updateUrls('#', baseUrl); });
    }

    var handleLocationChange = this._handleLocationChange.bind(this);
    this._handleLocationChange = handleLocationChange;

    // Provide way to update sprite urls externally via dispatching custom window event
    if (config.listenLocationChangeEvent) {
      window.addEventListener(config.locationChangeEvent, handleLocationChange);
    }

    // Emit location change event in Angular automatically
    if (config.locationChangeAngularEmitter) {
      locationChangeAngularEmitter(config.locationChangeEvent);
    }

    // After sprite mounted
    emitter.on(Events.MOUNT, function (spriteNode) {
      if (config.moveGradientsOutsideSymbol) {
        moveGradientsOutsideSymbol(spriteNode);
      }
    });

    // After symbol mounted into sprite
    emitter.on(Events.SYMBOL_MOUNT, function (symbolNode) {
      if (config.moveGradientsOutsideSymbol) {
        moveGradientsOutsideSymbol(symbolNode.parentNode);
      }

      if (browser.isIE() || browser.isEdge()) {
        evalStylesIEWorkaround(symbolNode);
      }
    });
  }

  if ( Sprite$$1 ) BrowserSprite.__proto__ = Sprite$$1;
  BrowserSprite.prototype = Object.create( Sprite$$1 && Sprite$$1.prototype );
  BrowserSprite.prototype.constructor = BrowserSprite;

  var prototypeAccessors = { isMounted: {} };

  /**
   * @return {boolean}
   */
  prototypeAccessors.isMounted.get = function () {
    return !!this.node;
  };

  /**
   * Automatically configure following options
   * - `syncUrlsWithBaseTag`
   * - `locationChangeAngularEmitter`
   * - `moveGradientsOutsideSymbol`
   * @param {Object} cfg
   * @private
   */
  BrowserSprite.prototype._autoConfigure = function _autoConfigure (cfg) {
    var ref = this;
    var config = ref.config;

    if (typeof cfg.syncUrlsWithBaseTag === 'undefined') {
      config.syncUrlsWithBaseTag = typeof document.getElementsByTagName('base')[0] !== 'undefined';
    }

    if (typeof cfg.locationChangeAngularEmitter === 'undefined') {
      config.locationChangeAngularEmitter = 'angular' in window;
    }

    if (typeof cfg.moveGradientsOutsideSymbol === 'undefined') {
      config.moveGradientsOutsideSymbol = browser.isFirefox();
    }
  };

  /**
   * @param {Event} event
   * @param {Object} event.detail
   * @param {string} event.detail.oldUrl
   * @param {string} event.detail.newUrl
   * @private
   */
  BrowserSprite.prototype._handleLocationChange = function _handleLocationChange (event) {
    var ref = event.detail;
    var oldUrl = ref.oldUrl;
    var newUrl = ref.newUrl;
    this.updateUrls(oldUrl, newUrl);
  };

  /**
   * Add new symbol. If symbol with the same id exists it will be replaced.
   * If sprite already mounted - `symbol.mount(sprite.node)` will be called.
   * @fires Events#SYMBOL_MOUNT
   * @param {BrowserSpriteSymbol} symbol
   * @return {boolean} `true` - symbol was added, `false` - replaced
   */
  BrowserSprite.prototype.add = function add (symbol) {
    var sprite = this;
    var isNewSymbol = Sprite$$1.prototype.add.call(this, symbol);

    if (this.isMounted && isNewSymbol) {
      symbol.mount(sprite.node);
      this._emitter.emit(Events.SYMBOL_MOUNT, symbol.node);
    }

    return isNewSymbol;
  };

  /**
   * Attach to existing DOM node
   * @param {string|Element} target
   * @return {Element|null} attached DOM Element. null if node to attach not found.
   */
  BrowserSprite.prototype.attach = function attach (target) {
    var this$1 = this;

    var sprite = this;

    if (sprite.isMounted) {
      return sprite.node;
    }

    /** @type Element */
    var node = typeof target === 'string' ? document.querySelector(target) : target;
    sprite.node = node;

    // Already added symbols needs to be mounted
    this.symbols.forEach(function (symbol) {
      symbol.mount(sprite.node);
      this$1._emitter.emit(Events.SYMBOL_MOUNT, symbol.node);
    });

    // Create symbols from existing DOM nodes, add and mount them
    arrayFrom(node.querySelectorAll('symbol'))
      .forEach(function (symbolNode) {
        var symbol = BrowserSpriteSymbol.createFromExistingNode(symbolNode);
        symbol.node = symbolNode; // hack to prevent symbol mounting to sprite when adding
        sprite.add(symbol);
      });

    this._emitter.emit(Events.MOUNT, node);

    return node;
  };

  BrowserSprite.prototype.destroy = function destroy () {
    var ref = this;
    var config = ref.config;
    var symbols = ref.symbols;
    var _emitter = ref._emitter;

    symbols.forEach(function (s) { return s.destroy(); });

    _emitter.off('*');
    window.removeEventListener(config.locationChangeEvent, this._handleLocationChange);

    if (this.isMounted) {
      this.unmount();
    }
  };

  /**
   * @fires Events#MOUNT
   * @param {string|Element} [target]
   * @param {boolean} [prepend=false]
   * @return {Element|null} rendered sprite node. null if mount node not found.
   */
  BrowserSprite.prototype.mount = function mount (target, prepend) {
    if ( target === void 0 ) target = this.config.mountTo;
    if ( prepend === void 0 ) prepend = false;

    var sprite = this;

    if (sprite.isMounted) {
      return sprite.node;
    }

    var mountNode = typeof target === 'string' ? document.querySelector(target) : target;
    var node = sprite.render();
    this.node = node;

    if (prepend && mountNode.childNodes[0]) {
      mountNode.insertBefore(node, mountNode.childNodes[0]);
    } else {
      mountNode.appendChild(node);
    }

    this._emitter.emit(Events.MOUNT, node);

    return node;
  };

  /**
   * @return {Element}
   */
  BrowserSprite.prototype.render = function render () {
    return parse(this.stringify());
  };

  /**
   * Detach sprite from the DOM
   */
  BrowserSprite.prototype.unmount = function unmount () {
    this.node.parentNode.removeChild(this.node);
  };

  /**
   * Update URLs in sprite and usage elements
   * @param {string} oldUrl
   * @param {string} newUrl
   * @return {boolean} `true` - URLs was updated, `false` - sprite is not mounted
   */
  BrowserSprite.prototype.updateUrls = function updateUrls$1 (oldUrl, newUrl) {
    if (!this.isMounted) {
      return false;
    }

    var usages = document.querySelectorAll(this.config.usagesToUpdate);

    updateUrls(
      this.node,
      usages,
      ((getUrlWithoutFragment(oldUrl)) + "#"),
      ((getUrlWithoutFragment(newUrl)) + "#")
    );

    return true;
  };

  Object.defineProperties( BrowserSprite.prototype, prototypeAccessors );

  return BrowserSprite;
}(Sprite));

var ready$1 = createCommonjsModule(function (module) {
/*!
  * domready (c) Dustin Diaz 2014 - License MIT
  */
!function (name, definition) {

  { module.exports = definition(); }

}('domready', function () {

  var fns = [], listener
    , doc = document
    , hack = doc.documentElement.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , loaded = (hack ? /^loaded|^c/ : /^loaded|^i|^c/).test(doc.readyState);


  if (!loaded)
  { doc.addEventListener(domContentLoaded, listener = function () {
    doc.removeEventListener(domContentLoaded, listener);
    loaded = 1;
    while (listener = fns.shift()) { listener(); }
  }); }

  return function (fn) {
    loaded ? setTimeout(fn, 0) : fns.push(fn);
  }

});
});

var spriteNodeId = '__SVG_SPRITE_NODE__';
var spriteGlobalVarName = '__SVG_SPRITE__';
var isSpriteExists = !!window[spriteGlobalVarName];

// eslint-disable-next-line import/no-mutable-exports
var sprite;

if (isSpriteExists) {
  sprite = window[spriteGlobalVarName];
} else {
  sprite = new BrowserSprite({ attrs: { id: spriteNodeId } });
  window[spriteGlobalVarName] = sprite;
}

var loadSprite = function () {
  /**
   * Check for page already contains sprite node
   * If found - attach to and reuse it's content
   * If not - render and mount the new sprite
   */
  var existing = document.getElementById(spriteNodeId);

  if (existing) {
    sprite.attach(existing);
  } else {
    sprite.mount(document.body, true);
  }
};

if (document.body) {
  loadSprite();
} else {
  ready$1(loadSprite);
}

var sprite$1 = sprite;

return sprite$1;

})));

/* WEBPACK VAR INJECTION */}.call(this, __webpack_require__(/*! ./../../webpack/buildin/global.js */ "./node_modules/webpack/buildin/global.js")))

/***/ }),

/***/ "./node_modules/webpack/buildin/global.js":
/*!***********************************!*\
  !*** (webpack)/buildin/global.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

var g;

// This works in non-strict mode
g = (function() {
	return this;
})();

try {
	// This works if eval is allowed (see CSP)
	g = g || new Function("return this")();
} catch (e) {
	// This works if the window reference is available
	if (typeof window === "object") g = window;
}

// g can still be undefined, but nothing to do about it...
// We return undefined, instead of nothing here, so it's
// easier to handle this case. if(!global) { ...}

module.exports = g;


/***/ }),

/***/ "./src/Models/TracksModel.js":
/*!***********************************!*\
  !*** ./src/Models/TracksModel.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

function _readOnlyError(name) { throw new Error("\"" + name + "\" is read-only"); }

var Request = __webpack_require__(/*! ../../../Common/Request */ "../Common/Request.js");

module.exports = function (options) {
  var _data = {
    regions: []
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

    update: function update() {
      var thisModel = this;
      return Promise.resolve().then(function () {
        if (thisModel.isDirty) {
          thisModel.view.inProgress(true);
          return new Promise(function (resolve) {
            // Load
            setTimeout(function () {
              _data.msg = [{
                txt: 'HELLO'
              }];
              resolve();
            }, 2000);
          })["catch"](console.log);
        } // if (thisModel.isDirty)

      }).then(function () {
        thisModel.view.repaint();
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

/***/ "./src/SearchControl.css":
/*!*******************************!*\
  !*** ./src/SearchControl.css ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "./src/SelectControl.css":
/*!*******************************!*\
  !*** ./src/SelectControl.css ***!
  \*******************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

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
    Request = __webpack_require__(/*! ../../../Common/Request */ "../Common/Request.js"),
    Calendar = __webpack_require__(/*! ../../../Common/Controls/Calendar */ "../Common/Controls/Calendar.js"),
    SearchControl = __webpack_require__(/*! ../../../Common/Controls/SearchControl */ "../Common/Controls/SearchControl.js"),
    SelectControl = __webpack_require__(/*! ../../../Common/Controls/SelectControl */ "../Common/Controls/SelectControl.js");

var _searchLayer = 'EE5587AF1F70433AA878462272C0274C',
    _selectLayers = [{
  name: 'FOS',
  id: 'ED043040A005429B8F46AAA682BE49C3'
}, {
  name: 'AIS',
  id: '5790ADDFBDD64880BAC95DF13B8327EA'
}];

var _thisView, _layer;

var MyCollectionView = function MyCollectionView(_ref) {
  var _this = this;

  var model = _ref.model,
      layer = _ref.layer;
  _thisView = this;
  BaseView.call(this, model);
  this.frame = $(Handlebars.compile("<div class=\"trackexport-view\">\n            <div class=\"header\">\n                <table border=0 class=\"instruments unselectable\">\n                <tr>\n                    <td class=\"search_input_container\"></td>\n                    <tr>\n                        <td class=\"select_container\"></td>\n                    </tr>\n                </tr>\n                </table> \n\n                <table border=0><tr>\n                <td><div class=\"calendar\"></div></td>\n                <td style=\"vertical-align: top\"><div class=\"reload\"><svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z\"></path></svg></div></td>\n                <td style=\"vertical-align: top; width: 50px\"><div class=\"refresh\" style=\"margin: 10px 0 0 20px; display:none\">".concat(this.gifLoader, "</div></div></td>\n                </table></tr> \n\n                <table border=0 class=\"grid-header\">\n                <tr><td class=\"visibility-all\">\n                <svg style=\"display:block\"><use xlink:href=\"#icons_eye\"></use></svg>                \n                <svg style=\"display:none\"><use xlink:href=\"#icons_eye-off\"></use></svg>\n                </td>\n                <td>").concat(_gtxt('TrackExport.reg_id'), "</td>\n                <td>").concat(_gtxt('TrackExport.reg_created'), "</td>\n                <td>").concat(_gtxt('TrackExport.reg_updated'), "</td>\n                <td class=\"color-transparent\"><svg><use xlink:href=\"#icons_eye\"></use></td>\n                <td class=\"color-transparent\"><svg><use xlink:href=\"#icons_eye\"></use></td>\n                <td class=\"color-transparent\"><svg><use xlink:href=\"#icons_eye\"></use></td></tr>\n                </table> \n            </div> \n            <div class=\"grid\">\n\n            </div>\n            <div class=\"footer unselectable\">\n       \n            </div>\n            </div>"))());

  _addCalendar.call(this);

  this.trackLayer = 0;
  this.frame.find('.reload').on('click', function (e) {
    if (_this.mmsi) {
      console.log(_this.mmsi, _this.trackLayer, _this.calendar.dateInterval.get('dateBegin'));
      _this.model.isDirty = true;

      _this.inProgress(true);

      _this.show();
    }
  }.bind(this));
  this.container = this.frame.find('.grid');
  this.footer = this.frame.find('.footer');
  this.selectLayer = new SelectControl(this.frame.find('.select_container')[0], _selectLayers.map(function (l) {
    return l.name;
  }), 0, function (selected) {
    _thisView.trackLayer = _selectLayers[selected].id;
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
      _thisView.mmsi = v.mmsi;
    }.bind(this)
  });
  Object.defineProperty(this, "tableTemplate", {
    get: function get() {
      return '<table border=0 class="grid">' + this.model.data.regions.map(function (r) {
        if (r.page == _thisView.model.page) return "<tr id=\"".concat(r.gmx_id, "\">                \n                                <td class=\"visibility\">\n                                <svg style=\"display:block\"><use xlink:href=\"#icons_eye\"></use></svg>\n                                <svg style=\"display:none\"><use xlink:href=\"#icons_eye-off\"></use></svg></td>\n                                <td class=\"identity\">").concat(r.id, "</td>\n                                <td class=\"identity\">").concat(r.DateTime, "</td>\n                                <td>").concat(r.DateTimeChange, "</td>\n                                <td class=\"").concat(r.StateColor, " state\"><svg><use xlink:href=\"#icons_circle\"></use></svg></td>\n                                <td class=\"edit\"><svg><use xlink:href=\"#icons_pen\"></use></svg></td>\n                                <td class=\"show\"><svg><use xlink:href=\"#icons_target\"></use></svg></td>\n                            </tr>");else return '';
      }).join('') + '</table>' + (this.model.data.msg ? this.model.data.msg.map(function (m) {
        return "<div class=\"msg\">".concat(m.txt, "</div>");
      }).join('') : '');
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
    _addCalendar = function _addCalendar() {
  var calendar = this.frame.find('.calendar')[0]; // walkaround with focus at first input in ui-dialog

  calendar.innerHTML = '<span class="ui-helper-hidden-accessible"><input type="text"/></span>';
  var mapDateInterval = nsGmx.widgets.commonCalendar.getDateInterval(),
      dateInterval = new nsGmx.DateInterval();
  dateInterval.set('dateBegin', mapDateInterval.get('dateBegin')).set('dateEnd', mapDateInterval.get('dateEnd')).on('change', function (e) {});
  this.calendar = new Calendar({
    dateInterval: dateInterval,
    name: 'catalogInterval',
    container: calendar,
    dateMin: new Date(0, 0, 0),
    dateMax: new Date(),
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
    _clean = function _clean() {};

MyCollectionView.prototype = Object.create(BaseView.prototype);

MyCollectionView.prototype.inProgress = function (state) {
  var progress = this.frame.find('div.refresh');
  if (state) progress.show();else progress.hide();
}; // MyCollectionView.prototype.resize = function () { 
//     let h = $('.iconSidebarControl-pane').height() - this.frame.find('.instruments').outerHeight()
//     - this.frame.find('.results').outerHeight() - this.frame.find('.menu').outerHeight();
//     this.container.height(h+1);
// };


MyCollectionView.prototype.repaint = function () {
  _clean.call(this);

  BaseView.prototype.repaint.call(this);
};

MyCollectionView.prototype.show = function () {
  if (!this.frame) return;
  this.searchInput.focus();
  BaseView.prototype.show.apply(this, arguments);
};

module.exports = MyCollectionView;

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

__webpack_require__(/*! ../icons.svg */ "./icons.svg");

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
  "TrackExport.page_lbl": "Страница",
  "TrackExport.choose_reg": "Выбор района",
  "TrackExport.create_reg": "Новый район",
  "TrackExport.instr_hint": "Очертите новый район или выберите существующий для редактирования",
  "TrackExport.attr_tbl": "Таблица атрибутов",
  "TrackExport.reg_id": "ID района",
  "TrackExport.reg_created": "Создан",
  "TrackExport.reg_updated": "Изменен",
  "TrackExport.add_new": "Добавить новый объект",
  "TrackExport.add_copy": "Добавить выбранный объект",
  "TrackExport.no_origin": "нет",
  "TrackExport.save": "Сохранить",
  "TrackExport.cancel": "Отмена",
  "TrackExport.description_lbl": "Описание",
  "TrackExport.description_ttl": "Медиа описание",
  "TrackExport.edit_description_lbl": "Редактировать",
  "TrackExport.edit_description_ttl": "Редактировать медиа описание",
  "TrackExport.calendar_today": "сегодня",
  "TrackExport.layer_error": 'Ошибка слоя'
});

_translationsHash.addtext('eng', {
  "TrackExport.title": "Vessel trackss",
  "TrackExport.page_lbl": "Page",
  "TrackExport.choose_reg": "Choose region",
  "TrackExport.create_reg": "Create region",
  "TrackExport.instr_hint": "Draw a region or choose existing",
  "TrackExport.attr_tbl": "Table of attrobutes",
  "TrackExport.reg_id": "Region ID",
  "TrackExport.reg_created": "Created",
  "TrackExport.reg_updated": "Changed",
  "TrackExport.add_new": "Добавить новый объект",
  "TrackExport.add_copy": "Добавить выбранный объект",
  "TrackExport.no_origin": "no",
  "TrackExport.save": "Save",
  "TrackExport.cancel": "Cancel",
  "TrackExport.description_lbl": "Description",
  "TrackExport.description_ttl": "Media description",
  "TrackExport.edit_description_lbl": "Edit description",
  "TrackExport.edit_description_ttl": "Edit media description",
  "TrackExport.calendar_today": "today",
  "TrackExport.layer_error": 'Layer error'
});

/***/ })

/******/ });
//# sourceMappingURL=TrackExportPlugin.js.map