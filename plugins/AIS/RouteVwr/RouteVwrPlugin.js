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

/***/ "./src/Models/RouteModel.js":
/*!**********************************!*\
  !*** ./src/Models/RouteModel.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

function _readOnlyError(name) { throw new Error("\"" + name + "\" is read-only"); }

var Request = __webpack_require__(/*! ../Request */ "./src/Request.js"); //////////////////////////


var _defaultViconColor = '#999',
    _getUnderWayIcon = function _getUnderWayIcon(cog, sog, type_color, group_style) {
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" style=\"transform:rotate(".concat(!cog ? 0 : cog, "deg)\"><title>sog: ").concat(sog).concat(_gtxt('RouteVwr.kn'), " cog: ").concat(cog, "\xB0</title><path style=\"fill:").concat(type_color, ";\" d=\"M13.8,20.07a1,1,0,0,1-.69-0.28l-1.79-1.72a0.72,0.72,0,0,0-1,0L8.52,19.79a1,1,0,0,1-.69.28,1,1,0,0,1-1-1V8.65c0-1.52,1.55-7.59,4-7.59s4,6.07,4,7.59V19a1,1,0,0,1-1,1h0Z\"/><path style=\"fill:").concat(group_style, ";\" d=\"M10.82,1.57c1.93,0,3.5,5.57,3.5,7.09V19a0.52,0.52,0,0,1-.51.53,0.49,0.49,0,0,1-.34-0.14l-1.79-1.72a1.22,1.22,0,0,0-1.71,0L8.17,19.42a0.49,0.49,0,0,1-.34.14A0.52,0.52,0,0,1,7.32,19V8.65c0-1.51,1.57-7.09,3.5-7.09h0m0-1c-3,0-4.5,6.72-4.5,8.09V19a1.52,1.52,0,0,0,1.51,1.53,1.49,1.49,0,0,0,1-.42l1.79-1.72a0.22,0.22,0,0,1,.32,0l1.79,1.72a1.49,1.49,0,0,0,1,.42A1.52,1.52,0,0,0,15.32,19V8.65c0-1.37-1.51-8.09-4.5-8.09h0Z\"/><ellipse style=\"fill:#fff;\" cx=\"10.82\" cy=\"10.54\" rx=\"1.31\" ry=\"1.35\"/><path style=\"fill:#fff;\" d=\"M10.73,3.34h0.12a0.35,0.35,0,0,1,.35.35v6.85a0,0,0,0,1,0,0H10.38a0,0,0,0,1,0,0V3.69A0.35,0.35,0,0,1,10.73,3.34Z\"/></svg>");
},
    _getAtAnchorIcon = function _getAtAnchorIcon(cog, sog, type_color, group_style) {
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" style=\"transform:rotate(".concat(!cog ? 0 : cog, "deg)\"><title>sog: ").concat(sog).concat(_gtxt('RouteVwr.kn'), " cog: ").concat(cog, "\xB0</title><rect style=\"fill:").concat(type_color, ";stroke:").concat(group_style, ";stroke-miterlimit:10;\" x=\"5.9\" y=\"5.6\" width=\"9.19\" height=\"9.19\" rx=\"2\" ry=\"2\" transform=\"translate(-4.13 10.41) rotate(-45)\"/><circle style=\"fill:#fff;\" cx=\"10.5\" cy=\"10.19\" r=\"1.5\"/></svg>");
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
    routes: [],
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

    update: function update() {
      var _this = this;

      if (!this.isDirty) return; //console.log(this.view.vessel)

      this.view.inProgress(true);
      Request.fetchRequest('/VectorLayer/Search.ashx', 'layer=910325DE5E544C6A87F1CFB3DE13BCF5&orderby=calc_etd&orderdirection=desc&query="vessel_mmsi"=' + this.view.vessel.mmsi, 'POST').then(function (r) {
        return r.json();
      }).then(function (r) {
        //console.log(r)
        if (r.Status && r.Status.toLowerCase() == 'ok' && r.Result) {
          _selectVessel = r.Result.values.map(function (v) {
            return {
              mmsi: v[0],
              name: v[1]
            };
          });
          _this.data.routes = [];
          var routes = _this.data.routes;
          r.Result.values.forEach(function (v) {
            var route = {};
            r.Result.fields.forEach(function (f, i) {
              route[f] = v[i];
            });
            routes.push(route);
          });
        } else {
          _this.data.msg = 'hello';
          console.log(r);
        }

        console.log(_this.data);

        _this.view.inProgress(false);

        _this.view.repaint();

        _this.isDirty = false;
      }.bind(this));
    }
  };
};
/*
module.exports = function (options) {

    const _lmap = nsGmx.leafletMap,
        _tracks = [], _vmarkers = [];
       
    _getVicons();
    _loadViconPromise = Promise.all(_vicons.map(_getViconSvgPromise));

    const _data = {tracks:[], msg:[]};        
    const _layerName = options.layer;

    return {
        isDirty: false,
        get data() { return _data },
        set data(value) { _data = value; },
        free: function(){
            _data.total = null;
            _data.tracks.length = 0;
            _data.msg.length = 0;
            _tracks.forEach(t=>{
                _lmap.removeLayer(t);
            });
            _tracks.length = 0;
            _vmarkers.length = 0; 
        },
        fitToTrack: function(i){
            _lmap.fitBounds(_tracks[i].getBounds());
        },
        drawTrack: function(i){
            _tracks[i].addTo(_lmap);         
        },
        eraseTrack: function(i){
            _lmap.removeLayer(_tracks[i]);         
        },
        update: function () {

            if (!this.isDirty)
                return;

            const thisModel = this;
            return Promise.resolve().then(()=>{
                    thisModel.free();                       
                    return Request.searchRequest({
                        layer: thisModel.view.trackLayer.id,
                        orderdirection: 'desc',
                        orderby: thisModel.view.trackLayer.sort,
                        columns: thisModel.view.trackLayer.columns,
                        query: thisModel.view.trackLayer.query
                    }, 'POST').then(r=>{
                        return _loadViconPromise.then(()=>{
//console.log(r)
                        if (!r.values.length){
                            _data.msg = [{txt:_gtxt('RouteVwr.nodata')}];
                        }
                        else{
                            _data.total = r.values.length;
                            r.values.forEach(p=>{
                                let data = thisModel.view.trackLayer.parseData(r.fields, p, _getVicon),
                                    lastTrack = _data.tracks[_data.tracks.length-1];
                                if (!lastTrack || lastTrack.positions[0].utc_date!=data.utc_date){
                                    lastTrack = { utc_date: data.utc_date, positions: [] };
                                    _data.tracks.push(lastTrack);
                                }
                                lastTrack.positions.push(data);
                            });
                        }
                        });
                    });
            }).then(()=>{    
                
                // draw track on map
                thisModel.view.repaint();
                if (_data.tracks.length){
                    let lastPos, wholeDistance = 0;
                    _data.tracks.forEach(t=>{
                        t.distance = 0;
                        let temp, latlngs = t.positions.map(p=>{
                            if (temp)
                                t.distance = t.distance + _lmap.distance(temp, [p.latitude, p.longitude]);
                            temp = [p.latitude, p.longitude];
                            return temp;
                        });
                        if (lastPos){
                            t.distance = t.distance + _lmap.distance(lastPos, latlngs[0]);
                            latlngs = [lastPos].concat(latlngs);
                        }
                        lastPos = temp;  
                        let line = L.polyline(latlngs, {color: t.positions[0] && t.positions[0].vicon ? t.positions[0].vicon.color : 'red'}).addTo(_lmap); 
                        line.bindPopup(`<b>${thisModel.view.vname}</b><br>${t.utc_date}<br>${(t.distance/1000).toFixed(3)} ${_gtxt('RouteVwr.km')}`);                    
                        _tracks.push(line);
                        
                        wholeDistance = wholeDistance + t.distance;
                    });
                    
                    _lmap.fitBounds(_tracks[0].getBounds());
                }
  
                thisModel.isDirty = false;
            });

        } // this.update
    };
}
*/

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

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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

/***/ "./src/Views/RouteView.css":
/*!*********************************!*\
  !*** ./src/Views/RouteView.css ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// extracted by mini-css-extract-plugin

/***/ }),

/***/ "./src/Views/RouteView.js":
/*!********************************!*\
  !*** ./src/Views/RouteView.js ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! ./RouteView.css */ "./src/Views/RouteView.css");

__webpack_require__(/*! ../SelectControl.css */ "./src/SelectControl.css");

var BaseView = __webpack_require__(/*! ./BaseView.js */ "./src/Views/BaseView.js"),
    Request = __webpack_require__(/*! ../Request */ "./src/Request.js"),
    SelectControl = __webpack_require__(/*! ../SelectControl */ "./src/SelectControl.js");

var _toDd = function _toDd(D, isLng) {
  var dir = D < 0 ? isLng ? 'W' : 'S' : isLng ? 'E' : 'N',
      deg = Math.round((D < 0 ? D = -D : D) * 1000000) / 1000000;
  return deg.toFixed(2) + " " //"°"
  + dir;
};

var _searchLayer = 'EE5587AF1F70433AA878462272C0274C';

var _thisView, _layer, _selectVessel;

var RouteView = function RouteView(_ref) {
  var _this = this;

  var model = _ref.model,
      layer = _ref.layer;
  _thisView = this;
  BaseView.call(this, model);
  this.frame = $(Handlebars.compile("<div class=\"routevwr-view\">\n            <div class=\"header\">\n                <table border=0 class=\"instruments unselectable\">\n                    <tr>\n                        <td class=\"select_container\"></td>\n                    </tr>\n                </table> \n\n \n            </div> \n            <div class=\"refresh\" style=\"display: none; padding-top: 100%;padding-left: 50%;\"><img src=\"img/progress.gif\"></div>\n            <div class=\"grid\"></div>\n            <div class=\"footer unselectable\">\n       \n            </div>\n            </div>")());
  this.container = this.frame.find('.grid');
  this.footer = this.frame.find('.footer');
  Request.fetchRequest('/VectorLayer/Search.ashx', 'layer=910325DE5E544C6A87F1CFB3DE13BCF5&orderby=vessel_name&columns=[{"Value":"vessel_mmsi"},{"Value":"vessel_name"}]&groupby=[{"Value":"vessel_mmsi"},{"Value":"vessel_name"}]', 'POST').then(function (r) {
    return r.json();
  }).then(function (r) {
    //console.log(r)
    if (r.Status && r.Status.toLowerCase() == 'ok' && r.Result) {
      _selectVessel = r.Result.values.map(function (v) {
        return {
          mmsi: v[0],
          name: v[1]
        };
      });
      _this.vessel = _selectVessel[0];
      _this.selectVessel = new SelectControl(_this.frame.find('.select_container')[0], _selectVessel.map(function (l) {
        return l.name;
      }), 0, function (selected) {
        _thisView.trackLayer = _selectVessel[selected];
      });

      _this.selectVessel.dropDownList.classList.add('routevwr-view');

      _this.model.isDirty = true; //this.model.update();            
    } else console.log(r);
  }.bind(this));
  Object.defineProperty(this, "tableTemplate", {
    get: function get() {
      var rv = this.model.data.routes.map(function (t, i) {
        return "<table class=\"route-table\" border=\"0\">\n                        <tbody><tr>\n                        <td><span>".concat(t.vessel_mmsi, "</span></td> \n                        <td><span>").concat(t.vessel_name, "</span></td>                      \n                        <td><span class=\"date\">").concat(t.calc_etd, "</span></td>\n                        <td><span class=\"date\">").concat(t.calc_eta, "</span></td>\n                        </tr></tbody></table>");
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
  var t = _thisView.model.data.routes[i];
  return "<table class=\"positions-table\"><tbody>" + t.positions.map(function (p, j) {
    return "<tr>                \n            <td><span class=\"utc_time\">".concat(p.utc_time, "</span><span class=\"local_time\">").concat(p.local_time, "</span></td>\n            <td><span class=\"utc_date\">").concat(t.utc_date, "</span><span class=\"local_date\">").concat(p.local_date, "</span></td>\n            <td>").concat(p.lon, "&nbsp;&nbsp;").concat(p.lat, "</td>\n            <td>").concat(p.vicon ? p.vicon.svg : '', "</td><td></td>\n            <td><div class=\"show_pos\" id=\"").concat(i, "_").concat(j, "\" title=\"").concat(_gtxt('RouteVwr.position'), "\"><img src=\"plugins/AIS/AISSearch/svg/center.svg\"></div></td>\n            </tr>\n            <tr><td colspan=\"6\" class=\"more\"><hr><div class=\"vi_more\"></div></td></tr>");
  }).join('') + "</tbody></table>";
},
    _clean = function _clean() {
  this.frame.find('.open_positions').off('click', _onOpenPosClick);
  this.frame.find('.track-table .track:not(".all") input').off('click', _onShowTrack), this.frame.find('.track-table .track.all input').off('click', _onShowAllTracks), this.frame.find('.show_pos').off('click', _onShowPos);
  this.frame.find('.track-table .export').off('click', _onExport);
};

RouteView.prototype = Object.create(BaseView.prototype);

RouteView.prototype.inProgress = function (state) {
  var progress = this.frame.find('div.refresh'),
      grid = this.frame.find('div.grid');

  if (state) {
    grid.hide();
    progress.show();
  } else {
    progress.hide();
    grid.show();
  }
}; // RouteView.prototype.resize = function () { 
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
      pos = _thisView.model.data.routes[ij[0]].positions[ij[1]]; //_thisView.model.fitToTrack(ij[0]);

  nsGmx.leafletMap.setView([pos.latitude, pos.longitude]);
},
    _onExport = function _onExport(e) {
  var type = e.currentTarget.className.replace(/export */, ''),
      tracks = _thisView.model.data.routes,
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

RouteView.prototype.repaint = function () {
  _clean.call(this);

  BaseView.prototype.repaint.call(this); // this.frame.find('.open_positions').on('click', _onOpenPosClick);
  // this.frame.find('.track-table .track:not(".all") input').on('click', _onShowTrack);
  // this.frame.find('.track-table .track.all input').on('click', _onShowAllTracks);
  // this.frame.find('.track-table .export').on('click', _onExport);
  // this.frame.find('.track_0 .positions-table .show_pos').on('click', _onShowPos);
};

RouteView.prototype.show = function () {
  if (!this.frame) return;
  BaseView.prototype.show.apply(this, arguments);
};

module.exports = RouteView;

/***/ }),

/***/ "./src/ViewsFactory.js":
/*!*****************************!*\
  !*** ./src/ViewsFactory.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var MyCollectionView = __webpack_require__(/*! ./Views/RouteView */ "./src/Views/RouteView.js"),
    MyCollectionModel = __webpack_require__(/*! ./Models/RouteModel */ "./src/Models/RouteModel.js");

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

var pluginName = 'RouteVwrPlugin',
    menuId = 'RouteVwrPlugin',
    toolbarIconId = null,
    cssTable = 'RouteVwrPlugin',
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
      icon: "RouteVwr",
      //menuId,
      active: "hardnav-sidebar-icon",
      inactive: "hardnav-sidebar-icon",
      hint: _gtxt('RouteVwr.title')
    })();
    var tabDiv = tab.querySelector('.RouteVwr');
    pluginPanel.sidebarPane = sidebar.setPane(menuId, {
      createTab: function createTab() {
        !tab.querySelector('.RouteVwr') && tab.append(tabDiv);
        tab.querySelector('.RouteVwr').innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1\" viewBox=\"0 0 24 24\" style=\"height: 18px;width: 18px;\">\n                     <path d=\"M 20 2 C 18.970152 2 18.141273 2.7807107 18.03125 3.78125 L 14.5625 4.78125 C 14.19654 4.3112749 13.641793 4 13 4 C 11.895431 4 11 4.8954305 11 6 C 11 7.1045695 11.895431 8 13 8 C 13.052792 8 13.104488 8.0040159 13.15625 8 L 16.53125 14.6875 C 16.440877 14.788724 16.349735 14.881869 16.28125 15 L 11.9375 14.46875 C 11.705723 13.620636 10.921625 13 10 13 C 8.8954305 13 8 13.895431 8 15 C 8 15.217462 8.0295736 15.428987 8.09375 15.625 L 4.96875 18.25 C 4.6825722 18.092012 4.3500149 18 4 18 C 2.8954305 18 2 18.895431 2 20 C 2 21.104569 2.8954305 22 4 22 C 5.1045695 22 6 21.104569 6 20 C 6 19.782538 5.9704264 19.571013 5.90625 19.375 L 9.03125 16.75 C 9.3174278 16.907988 9.6499851 17 10 17 C 10.754554 17 11.409413 16.585686 11.75 15.96875 L 16.0625 16.53125 C 16.294277 17.379364 17.078375 18 18 18 C 19.104569 18 20 17.104569 20 16 C 20 14.895431 19.104569 14 18 14 C 17.947208 14 17.895512 13.995984 17.84375 14 L 14.5 7.3125 C 14.761761 7.0130168 14.922918 6.6355416 14.96875 6.21875 L 18.4375 5.21875 C 18.80346 5.6887251 19.358207 6 20 6 C 21.104569 6 22 5.1045695 22 4 C 22 2.8954305 21.104569 2 20 2 z\" style=\"&#10;\"/>\n                 </svg>";
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
  "RouteVwr.title": "Маршруты",
  "RouteVwr.calendar_today": "сегодня",
  "RouteVwr.nodata": "Нет данных",
  "RouteVwr.reload": "Загрузить/Обновить",
  "RouteVwr.allDailyTracks": "все треки",
  "RouteVwr.dailyTrack": "трек за сутки",
  "RouteVwr.positions": "положение судна",
  "RouteVwr.position": "показать",
  "RouteVwr.export": "экспорт",
  "RouteVwr.km": "км",
  "RouteVwr.kn": "уз",
  "RouteVwr.intervalExceeds": "Интервал больше 7 дней"
});

_translationsHash.addtext('eng', {
  "RouteVwr.title": "Routes",
  "RouteVwr.calendar_today": "today",
  "RouteVwr.nodata": "No data",
  "RouteVwr.reload": "Load/Update",
  "RouteVwr.allDailyTracks": "whole track",
  "RouteVwr.dailyTrack": "daily track",
  "RouteVwr.positions": "vessel positions",
  "RouteVwr.position": "position",
  "RouteVwr.export": "export",
  "RouteVwr.km": "km",
  "RouteVwr.kn": "kn",
  "RouteVwr.intervalExceeds": "Interval exceeds 7 days"
});

/***/ })

/******/ });
//# sourceMappingURL=RouteVwrPlugin.js.map