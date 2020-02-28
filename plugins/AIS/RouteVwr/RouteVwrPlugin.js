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

/***/ "./routevwr_icons.svg":
/*!****************************!*\
  !*** ./routevwr_icons.svg ***!
  \****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _node_modules_svg_baker_runtime_browser_symbol_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./node_modules/svg-baker-runtime/browser-symbol.js */ "./node_modules/svg-baker-runtime/browser-symbol.js");
/* harmony import */ var _node_modules_svg_baker_runtime_browser_symbol_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_svg_baker_runtime_browser_symbol_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_svg_sprite_loader_runtime_browser_sprite_build_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./node_modules/svg-sprite-loader/runtime/browser-sprite.build.js */ "./node_modules/svg-sprite-loader/runtime/browser-sprite.build.js");
/* harmony import */ var _node_modules_svg_sprite_loader_runtime_browser_sprite_build_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_svg_sprite_loader_runtime_browser_sprite_build_js__WEBPACK_IMPORTED_MODULE_1__);


var symbol = new _node_modules_svg_baker_runtime_browser_symbol_js__WEBPACK_IMPORTED_MODULE_0___default.a({
  "id": "routevwr_icons",
  "use": "routevwr_icons-usage",
  "content": "<symbol xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" id=\"routevwr_icons\">\r\n\r\n<symbol id=\"routevwr_icons_plugin-icon\" viewBox=\"0 0 100 100\">\r\n<path d=\"M 33 11 C 26.408116 11 21 16.408117 21 23 C 21 29.591883 26.408116 35 33 35 C 38.555367 35 43.24949 31.152559 44.59375 26 L 78.5 26 C 84.368892 26 89 30.631108 89 36.5 C 89 42.368892 84.368892 47 78.5 47 L 21.5 47 C 12.410892 47 5 54.410892 5 63.5 C 5 72.589108 12.410892 80 21.5 80 L 40.75 80 L 36.875 83.875 A 3.0052038 3.0052038 0 0 0 41.125 88.125 L 50.125 79.125 A 3.0003 3.0003 0 0 0 50.125 74.875 L 41.125 65.875 A 3.0003 3.0003 0 0 0 38.96875 64.96875 A 3.0003 3.0003 0 0 0 36.875 70.125 L 40.75 74 L 21.5 74 C 15.631108 74 11 69.368892 11 63.5 C 11 57.631108 15.631108 53 21.5 53 L 78.5 53 C 87.589108 53 95 45.589108 95 36.5 C 95 27.410892 87.589108 20 78.5 20 L 44.59375 20 C 43.24949 14.847441 38.555367 11 33 11 z M 33 17 C 36.349242 17 39 19.650758 39 23 C 39 26.349243 36.349242 29 33 29 C 29.650758 29 27 26.349243 27 23 C 27 19.650758 29.650758 17 33 17 z M 67 65 C 60.408116 65 55 70.408117 55 77 C 55 83.591883 60.408116 89 67 89 C 73.591884 89 79 83.591883 79 77 C 79 70.408117 73.591884 65 67 65 z M 67 71 C 70.349242 71 73 73.650757 73 77 C 73 80.349242 70.349242 83 67 83 C 63.650758 83 61 80.349242 61 77 C 61 73.650757 63.650758 71 67 71 z \" />\r\n</symbol>\r\n\r\n<symbol id=\"routevwr_icons_position-icon\" viewBox=\"0 0 16 16\">\r\n<g class=\"nc-icon-wrapper\" fill=\"#394b59\"><rect x=\"5\" y=\"5\" fill=\"#394b59\" width=\"6\" height=\"6\" /> \r\n<path fill=\"#394b59\" d=\"M2,6H0V1c0-0.6,0.4-1,1-1h5v2H2V6z\" /> \r\n<path fill=\"#394b59\" d=\"M16,6h-2V2h-4V0h5c0.6,0,1,0.4,1,1V6z\" /> \r\n<path fill=\"#394b59\" d=\"M15,16h-5v-2h4v-4h2v5C16,15.6,15.6,16,15,16z\" /> \r\n<path fill=\"#394b59\" d=\"M6,16H1c-0.6,0-1-0.4-1-1v-5h2v4h4V16z\" />\r\n</g>\r\n</symbol>\r\n\r\n</symbol>"
});
var result = _node_modules_svg_sprite_loader_runtime_browser_sprite_build_js__WEBPACK_IMPORTED_MODULE_1___default.a.add(symbol);
/* harmony default export */ __webpack_exports__["default"] = (symbol);

/***/ }),

/***/ "./src/Models/RouteModel.js":
/*!**********************************!*\
  !*** ./src/Models/RouteModel.js ***!
  \**********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

function _readOnlyError(name) { throw new Error("\"" + name + "\" is read-only"); }

var Request = __webpack_require__(/*! ../Request */ "./src/Request.js");

module.exports = function (options) {
  var _lmap = nsGmx.leafletMap,
      _tracks = [],
      _vmarkers = [];
  var _data = {
    routes: [],
    msg: []
  };
  return {
    isDirty: false,

    get data() {
      return _data;
    },

    set data(value) {
      _data = (_readOnlyError("_data"), value);
    },

    load: function load() {
      if (!this.view.vessel) return Promise.resolve({
        Status: 'error',
        ErrorInfo: 'no vessels'
      });
      return Request.fetchRequest('/VectorLayer/Search.ashx', 'layer=910325DE5E544C6A87F1CFB3DE13BCF5&out_cs=EPSG:4326&columns=[{"Value":"*"}]&orderby=calc_etd&orderdirection=desc&query="vessel_mmsi"=' + this.view.vessel.mmsi, 'POST').then(function (r) {
        return r.json();
      });
    },
    update: function update() {
      var _this = this;

      //console.log('UPDATE', this.isDirty)   
      if (!this.isDirty) return; //console.log(this.view.vessel)

      this.view.inProgress(true);
      this.load().then(function (r) {
        //console.log(r)
        _this.data.routes.length = 0;
        var routes = _this.data.routes,
            markersPromise = Promise.resolve();

        var checkResponse = function checkResponse(r) {
          return r.Status && r.Status.toLowerCase() == 'ok' && r.Result;
        };

        if (checkResponse(r)) {
          r.Result.values.forEach(function (v) {
            var route = {};
            r.Result.fields.forEach(function (f, i) {
              if (f == 'calc_etd' || f == 'calc_eta') {
                var d = new Date(v[i] * 1000);
                d.setHours(d.getHours() + d.getTimezoneOffset() / 60);
                route[f] = "".concat(d.toLocaleDateString(), " ").concat(d.toLocaleTimeString());
              } else if (f == 'vessel_voyage') markersPromise.then(function (r) {
                route[f] = v[i];
                var vessel_voyage = route[f];
                return Request.fetchRequest('/VectorLayer/Search.ashx', "layer=D76844C98D26445B8E3D56C9CAA5480E&query=\"vessel_voyage\"='".concat(vessel_voyage, "'"), 'POST');
              }).then(function (r) {
                return r.json();
              }).then(function (r) {
                if (checkResponse(r)) {
                  //console.log(r)
                  if (route.markers) route.markers.length = 0;else route.markers = [];
                  r.Result.values.forEach(function (v) {
                    var marker = {};
                    r.Result.fields.forEach(function (f, i) {
                      if (r.Result.types[i] == 'datetime' && v[i]) {
                        var _d = new Date(v[i] * 1000);

                        _d.setHours(_d.getHours() + _d.getTimezoneOffset() / 60);

                        marker[f] = "".concat(_d.toLocaleDateString(), " ").concat(_d.toLocaleTimeString());
                      } else marker[f] = v[i];
                    });
                    route.markers.push(marker);
                  });
                } else {
                  _this.data.msg = 'error';
                  console.log(route[f], r);
                }

                return Promise.resolve();
              });else route[f] = v[i];
            });
            routes.push(route);
          });
        } else {
          _this.data.msg = 'error';
          console.log(r);
        }

        return markersPromise;
      }.bind(this)).then(function (r) {
        //console.log(this.data)
        _this.view.inProgress(false);

        _this.view.repaint();

        _this.isDirty = false;
      }.bind(this));
    }
  };
};

/***/ }),

/***/ "./src/PluginPanel.js":
/*!****************************!*\
  !*** ./src/PluginPanel.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports) {

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

var RouteView = function RouteView(_ref) {
  var _this = this;

  var model = _ref.model,
      layer = _ref.layer;
  var lmap = nsGmx.leafletMap;
  var thisView = this,
      vesselList;
  BaseView.call(this, model);
  this.frame = $(Handlebars.compile("<div class=\"routevwr-view\">\n            <div class=\"header\">\n                <table border=0 class=\"instruments unselectable\">\n                    <tr>\n                        <td class=\"select_container\"></td>\n                    </tr>\n                </table> \n\n \n            </div> \n            <div class=\"refresh\" style=\"display: none; padding-top: 100%;padding-left: 50%;\"><img src=\"img/progress.gif\"></div>\n            <div class=\"grid\"></div>\n            <div class=\"footer unselectable\">\n       \n            </div>\n            </div>")());
  this.container = this.frame.find('.grid');
  this.footer = this.frame.find('.footer');
  this.vesselListPromise = Request.fetchRequest('/VectorLayer/Search.ashx', 'layer=910325DE5E544C6A87F1CFB3DE13BCF5&orderby=vessel_name&columns=[{"Value":"vessel_mmsi"},{"Value":"vessel_name"}]&groupby=[{"Value":"vessel_mmsi"},{"Value":"vessel_name"}]', 'POST').then(function (r) {
    return r.json();
  }).then(function (r) {
    //console.log(r)
    if (r.Status && r.Status.toLowerCase() == 'ok' && r.Result) {
      vesselList = r.Result.values.map(function (v) {
        return {
          mmsi: v[0],
          name: v[1]
        };
      });
      _this.vessel = vesselList[0];
      _this.selectVessel = new SelectControl(_this.frame.find('.select_container')[0], vesselList.map(function (l) {
        return l.name;
      }), 0, function (selected) {
        thisView.route = null;
        if (routeLine) lmap.removeLayer(routeLine);

        if (routeNodes.length) {
          routeNodes.forEach(function (n) {
            return lmap.removeLayer(n);
          });
          routeNodes.length = 0;
        }

        thisView.vessel = vesselList[selected];
        thisView.model.isDirty = true;
        thisView.model.update();
      });

      _this.selectVessel.dropDownList.classList.add('routevwr-view');
    } else console.log(r); //console.log('LIST DONE')          


    _this.model.isDirty = true;
    return Promise.resolve();
  }.bind(this));
  Object.defineProperty(this, "tableTemplate", {
    get: function get() {
      var rv = "<table class=\"route-table\" border=\"0\">\n                <tbody><tr>\n                <th></th>\n                <th>".concat(_gtxt('RouteVwr.route_name'), "</th>                     \n                <th>").concat(_gtxt('RouteVwr.calc_etd'), "</th>\n                <th>").concat(_gtxt('RouteVwr.calc_eta'), "</th>\n                </tr>") + this.model.data.routes.map(function (t, i) {
        return "<tr id=\"".concat(i, "\">                    \n                        <td><svg class=\"position-icon\" style=\"width: 14px;height: 14px;margin-left:5px;\"><use xlink:href=\"#routevwr_icons_position-icon\"></use></svg></td> \n                        <td><span>").concat(t.route_name, "</span></td>                    \n                        <td><span class=\"date\">").concat(t.calc_etd, "</span></td>\n                        <td><span class=\"date\">").concat(t.calc_eta, "</span></td>\n                        </tr>");
      }).join('') + (this.model.data.msg ? this.model.data.msg.map(function (m) {
        return "<div class=\"msg\">".concat(m.txt, "</div>");
      }).join('') : '');
      rv += "</tbody></table>";
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
  var routeLine,
      routeNodes = [];
  this.route = null;

  var drawMarkers = function drawMarkers() {
    if (!this.route || !this.route.markers) return; //console.log(this.route);  

    if (routeNodes.length) {
      routeNodes.forEach(function (n) {
        return lmap.removeLayer(n);
      });
      routeNodes.length = 0;
    }

    this.route.markers.forEach(function (m) {
      var nw = lmap.layerPointToLatLng(lmap.latLngToLayerPoint([m.lat, m.lon]).subtract([5, 5]));
      se = lmap.layerPointToLatLng(lmap.latLngToLayerPoint([m.lat, m.lon]).add([4, 4]));
      var marker = L.rectangle([nw, se], {
        color: "red",
        weight: 1
      }).addTo(lmap);
      marker.bindPopup(Object.keys(m).map(function (k) {
        return k != 'wkb_geometry' && k != 'id' ? "<b>".concat(k, ":</b> ").concat(m[k] != null ? m[k] : '') : '';
      }).join('<br>'));
      routeNodes.push(marker);
    });
  };

  nsGmx.leafletMap.on('zoomend', drawMarkers.bind(this));

  this.handleEvent = function (e) {
    switch (e.type) {
      case 'click':
        var tr = e.currentTarget.parentElement,
            i = parseInt(tr.id);

        if (tr.className.search(/\bactive\b/) != -1 && e.currentTarget.querySelector('svg.position-icon') && routeLine) {
          lmap.fitBounds(routeLine.getBounds());
          return;
        }

        if (routeLine) lmap.removeLayer(routeLine);

        if (tr.className.search(/\bactive\b/) != -1) {
          tr.className = tr.className.replace(/ active/, '');

          if (routeNodes.length) {
            routeNodes.forEach(function (n) {
              return lmap.removeLayer(n);
            });
            routeNodes.length = 0;
          }

          return;
        } else {
          var siblings = tr.parentElement.children;

          for (var j = 0; j < siblings.length; ++j) {
            siblings[j].className = siblings[j].className.replace(/ active/, '');
          }

          tr.className += ' active';
        }

        this.route = this.model.data.routes[i];
        var distance = 0,
            route = this.route,
            prev,
            coords = this.route.wkb_geometry.coordinates.map(function (c) {
          if (prev) distance += lmap.distance(prev, [c[1], c[0]]);
          prev = [c[1], c[0]];
          return [c[1], c[0]];
        });
        routeLine = L.polyline(coords, {
          color: 'red',
          weight: 2
        }).addTo(lmap);
        lmap.fitBounds(routeLine.getBounds());
        var popup = [];
        Object.keys(route).forEach(function (k) {
          if (k != 'wkb_geometry' && k != 'id' && k != 'markers') popup.push("<b>".concat(k, ":</b> ").concat(route[k] != null ? route[k] : ''));
        });
        routeLine.bindPopup(popup.join('<br>') + "<br><br><b>".concat(_gtxt('RouteVwr.dist'), "</b> ").concat(Math.round(distance / 1000), " ").concat(_gtxt('RouteVwr.km')));
        drawMarkers.call(this);
        break;
    }
  };
},
    _clean = function _clean() {
  //console.log(this)
  var inst = this;
  this.frame.find('.route-table tr').each(function (i, e) {
    return e.removeEventListener('click', inst, false);
  });
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


RouteView.prototype.repaint = function () {
  _clean.call(this);

  BaseView.prototype.repaint.call(this);
  var inst = this;
  this.frame.find('.route-table td').each(function (i, e) {
    return e.addEventListener('click', inst, false);
  });
};

RouteView.prototype.show = function () {
  var _arguments = arguments;
  if (!this.frame) return;
  var thisView = this;
  this.vesselListPromise.then(function (r) {
    return BaseView.prototype.show.apply(thisView, _arguments);
  });
};

module.exports = RouteView;

/***/ }),

/***/ "./src/ViewsFactory.js":
/*!*****************************!*\
  !*** ./src/ViewsFactory.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var RouteView = __webpack_require__(/*! ./Views/RouteView */ "./src/Views/RouteView.js"),
    RouteModel = __webpack_require__(/*! ./Models/RouteModel */ "./src/Models/RouteModel.js");

module.exports = function (options) {
  var _mcm = new RouteModel({
    layer: options.layer
  }),
      _mcv = new RouteView({
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

__webpack_require__(/*! ../routevwr_icons.svg */ "./routevwr_icons.svg");

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
      active: "routvwr-sidebar-icon",
      inactive: "routvwr-sidebar-icon",
      hint: _gtxt('RouteVwr.title')
    })();
    var tabDiv = tab.querySelector('.RouteVwr');
    pluginPanel.sidebarPane = sidebar.setPane(menuId, {
      createTab: function createTab() {
        !tab.querySelector('.RouteVwr') && tab.append(tabDiv);
        tab.querySelector('.RouteVwr').innerHTML = "<svg><use xlink:href=\"#routevwr_icons_plugin-icon\"></use></svg>";
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
  "RouteVwr.dist": "Длина",
  "RouteVwr.km": "км",
  "RouteVwr.kn": "уз",
  "RouteVwr.intervalExceeds": "Интервал больше 7 дней",
  "RouteVwr.route_name": "название",
  "RouteVwr.calc_etd": "отправление",
  "RouteVwr.calc_eta": "прибытие"
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
  "RouteVwr.dist": "Distance",
  "RouteVwr.km": "km",
  "RouteVwr.kn": "kn",
  "RouteVwr.intervalExceeds": "Interval exceeds 7 days",
  "RouteVwr.route_name": "name",
  "RouteVwr.calc_etd": "departure",
  "RouteVwr.calc_eta": "arrival"
});

/***/ })

/******/ });
//# sourceMappingURL=RouteVwrPlugin.js.map