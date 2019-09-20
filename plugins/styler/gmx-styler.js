(function () {
  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  var slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  function noop() {}

  function assign(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function append(target, node) {
  	target.appendChild(node);
  }

  function insert(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode(node) {
  	node.parentNode.removeChild(node);
  }

  function reinsertChildren(parent, target) {
  	while (parent.firstChild) {
  		target.appendChild(parent.firstChild);
  	}
  }

  function destroyEach(iterations, detach) {
  	for (var i = 0; i < iterations.length; i += 1) {
  		if (iterations[i]) iterations[i].d(detach);
  	}
  }

  function createFragment() {
  	return document.createDocumentFragment();
  }

  function createElement(name) {
  	return document.createElement(name);
  }

  function createText(data) {
  	return document.createTextNode(data);
  }

  function createComment() {
  	return document.createComment('');
  }

  function addListener(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setAttribute(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
  }

  function setData(text, data) {
  	text.data = '' + data;
  }

  function toggleClass(element, name, toggle) {
  	element.classList[toggle ? 'add' : 'remove'](name);
  }

  function blankObject() {
  	return Object.create(null);
  }

  function destroy(detach) {
  	this.destroy = noop;
  	this.fire('destroy');
  	this.set = noop;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function _differs(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object' || typeof a === 'function';
  }

  function fire(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush(component) {
  	component._lock = true;
  	callAll(component._beforecreate);
  	callAll(component._oncreate);
  	callAll(component._aftercreate);
  	component._lock = false;
  }

  function get$1() {
  	return this._state;
  }

  function init(component, options) {
  	component._handlers = blankObject();
  	component._slots = blankObject();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1(newState) {
  	this._set(assign({}, newState));
  	if (this.root._lock) return;
  	flush(this.root);
  }

  function _set(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign(assign({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage(newState) {
  	assign(this._staged, newState);
  }

  function callAll(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var proto = {
  	destroy: destroy,
  	get: get$1,
  	fire: fire,
  	on: on,
  	set: set$1,
  	_recompute: noop,
  	_set: _set,
  	_stage: _stage,
  	_mount: _mount,
  	_differs: _differs
  };

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var scanexTabs_cjs = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, '__esModule', { value: true });

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop() {}

  function assign(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function callAfter(fn, i) {
  	if (i === 0) fn();
  	return function () {
  		if (! --i) fn();
  	};
  }

  function addLoc(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run(fn) {
  	fn();
  }

  function append(target, node) {
  	target.appendChild(node);
  }

  function insert(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode(node) {
  	node.parentNode.removeChild(node);
  }

  function reinsertChildren(parent, target) {
  	while (parent.firstChild) {
  		target.appendChild(parent.firstChild);
  	}
  }

  function createFragment() {
  	return document.createDocumentFragment();
  }

  function createElement(name) {
  	return document.createElement(name);
  }

  function createText(data) {
  	return document.createTextNode(data);
  }

  function createComment() {
  	return document.createComment('');
  }

  function addListener(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setData(text, data) {
  	text.data = '' + data;
  }

  function destroyBlock(block, lookup) {
  	block.d(1);
  	lookup[block.key] = null;
  }

  function outroAndDestroyBlock(block, lookup) {
  	block.o(function () {
  		destroyBlock(block, lookup);
  	});
  }

  function updateKeyedEach(old_blocks, component, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, intro_method, next, get_context) {
  	var o = old_blocks.length;
  	var n = list.length;

  	var i = o;
  	var old_indexes = {};
  	while (i--) {
  		old_indexes[old_blocks[i].key] = i;
  	}var new_blocks = [];
  	var new_lookup = {};
  	var deltas = {};

  	var i = n;
  	while (i--) {
  		var child_ctx = get_context(ctx, list, i);
  		var key = get_key(child_ctx);
  		var block = lookup[key];

  		if (!block) {
  			block = create_each_block(component, key, child_ctx);
  			block.c();
  		} else if (dynamic) {
  			block.p(changed, child_ctx);
  		}

  		new_blocks[i] = new_lookup[key] = block;

  		if (key in old_indexes) deltas[key] = Math.abs(i - old_indexes[key]);
  	}

  	var will_move = {};
  	var did_move = {};

  	function insert(block) {
  		block[intro_method](node, next);
  		lookup[block.key] = block;
  		next = block.first;
  		n--;
  	}

  	while (o && n) {
  		var new_block = new_blocks[n - 1];
  		var old_block = old_blocks[o - 1];
  		var new_key = new_block.key;
  		var old_key = old_block.key;

  		if (new_block === old_block) {
  			// do nothing
  			next = new_block.first;
  			o--;
  			n--;
  		} else if (!new_lookup[old_key]) {
  			// remove old block
  			destroy(old_block, lookup);
  			o--;
  		} else if (!lookup[new_key] || will_move[new_key]) {
  			insert(new_block);
  		} else if (did_move[old_key]) {
  			o--;
  		} else if (deltas[new_key] > deltas[old_key]) {
  			did_move[new_key] = true;
  			insert(new_block);
  		} else {
  			will_move[old_key] = true;
  			o--;
  		}
  	}

  	while (o--) {
  		var old_block = old_blocks[o];
  		if (!new_lookup[old_block.key]) destroy(old_block, lookup);
  	}

  	while (n) {
  		insert(new_blocks[n - 1]);
  	}return new_blocks;
  }

  function blankObject() {
  	return Object.create(null);
  }

  function destroy(detach) {
  	this.destroy = noop;
  	this.fire('destroy');
  	this.set = noop;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev(detach) {
  	destroy.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object' || typeof a === 'function';
  }

  function fire(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush(component) {
  	component._lock = true;
  	callAll(component._beforecreate);
  	callAll(component._oncreate);
  	callAll(component._aftercreate);
  	component._lock = false;
  }

  function get$1() {
  	return this._state;
  }

  function init(component, options) {
  	component._handlers = blankObject();
  	component._slots = blankObject();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1(newState) {
  	this._set(assign({}, newState));
  	if (this.root._lock) return;
  	flush(this.root);
  }

  function _set(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign(assign({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage(newState) {
  	assign(this._staged, newState);
  }

  function setDev(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1.call(this, newState);
  }

  function callAll(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev = {
  	destroy: destroyDev,
  	get: get$1,
  	fire: fire,
  	on: on,
  	set: setDev,
  	_recompute: noop,
  	_set: _set,
  	_stage: _stage,
  	_mount: _mount,
  	_differs: _differs
  };

  /* src\Tab.html generated by Svelte v2.16.0 */

  function data() {
  	return {
  		id: ''
  	};
  }
  var file = "src\\Tab.html";

  function create_main_fragment(component, ctx) {
  	var li,
  	    slot_content_default = component._slotted.default,
  	    li_class_value,
  	    current;

  	function click_handler(event) {
  		component.fire('select', ctx.id);
  	}

  	return {
  		c: function create() {
  			li = createElement("li");
  			addListener(li, "click", click_handler);
  			li.className = li_class_value = "tab" + (ctx.id ? ' ' + ctx.id : '');
  			addLoc(li, file, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, li, anchor);

  			if (slot_content_default) {
  				append(li, slot_content_default);
  			}

  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.id && li_class_value !== (li_class_value = "tab" + (ctx.id ? ' ' + ctx.id : ''))) {
  				li.className = li_class_value;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(li);
  			}

  			if (slot_content_default) {
  				reinsertChildren(li, slot_content_default);
  			}

  			removeListener(li, "click", click_handler);
  		}
  	};
  }

  function Tab(options) {
  	this._debugName = '<Tab>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data(), options.data);
  	if (!('id' in this._state)) console.warn("<Tab> was created without expected data property 'id'");
  	this._intro = !!options.intro;

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}

  	this._intro = true;
  }

  assign(Tab.prototype, protoDev);

  Tab.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\Tabs.html generated by Svelte v2.16.0 */

  function data$1() {
  	return {
  		tabs: [],
  		index: 0
  	};
  }
  function oncreate() {
  	var panels = this.refs.panels.children;
  	var tabs = [];
  	for (var i = 0; i < panels.length; ++i) {
  		var _panels$i$data = panels[i].data,
  		    id = _panels$i$data.id,
  		    icon = _panels$i$data.icon,
  		    title = _panels$i$data.title;

  		tabs.push({ id: id, icon: icon, title: title });
  	}
  	this.set({ tabs: tabs });
  }
  function onupdate(_ref) {
  	var changed = _ref.changed,
  	    current = _ref.current;

  	if (changed.index) {
  		var tabs = this.refs.tabs.children;
  		var panels = this.refs.panels.children;
  		for (var i = 0; i < panels.length; ++i) {
  			var t = tabs[i];
  			var p = panels[i];
  			var id = p.data.id;

  			if (i === current.index) {
  				t.classList.add('selected');
  				p.classList.remove('hidden');
  				p.classList.add('visible');
  			} else {
  				t.classList.remove('selected');
  				p.classList.remove('visible');
  				p.classList.add('hidden');
  			}
  		}
  	}
  }
  var file$1 = "src\\Tabs.html";

  function get_each_context(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.tab = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function create_main_fragment$1(component, ctx) {
  	var div,
  	    ul0,
  	    each_blocks_1 = [],
  	    each_lookup = blankObject(),
  	    text,
  	    ul1,
  	    slot_content_default = component._slotted.default,
  	    current;

  	var each_value = ctx.tabs;

  	var get_key = function get_key(ctx) {
  		return ctx.tab.id;
  	};

  	for (var i = 0; i < each_value.length; i += 1) {
  		var child_ctx = get_each_context(ctx, each_value, i);
  		var key = get_key(child_ctx);
  		each_blocks_1[i] = each_lookup[key] = create_each_block(component, key, child_ctx);
  	}

  	return {
  		c: function create() {
  			div = createElement("div");
  			ul0 = createElement("ul");

  			for (i = 0; i < each_blocks_1.length; i += 1) {
  				each_blocks_1[i].c();
  			}text = createText("\r\n    ");
  			ul1 = createElement("ul");
  			ul0.className = "tabs";
  			addLoc(ul0, file$1, 1, 4, 31);
  			ul1.className = "panels";
  			addLoc(ul1, file$1, 12, 4, 371);
  			div.className = "tabs-widget";
  			addLoc(div, file$1, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(div, ul0);

  			for (i = 0; i < each_blocks_1.length; i += 1) {
  				each_blocks_1[i].i(ul0, null);
  			}component.refs.tabs = ul0;
  			append(div, text);
  			append(div, ul1);

  			if (slot_content_default) {
  				append(ul1, slot_content_default);
  			}

  			component.refs.panels = ul1;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			var each_value = ctx.tabs;
  			each_blocks_1 = updateKeyedEach(each_blocks_1, component, changed, get_key, 1, ctx, each_value, each_lookup, ul0, outroAndDestroyBlock, create_each_block, "i", null, get_each_context);
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			var countdown = callAfter(outrocallback, each_blocks_1.length);
  			for (i = 0; i < each_blocks_1.length; i += 1) {
  				each_blocks_1[i].o(countdown);
  			}current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			for (i = 0; i < each_blocks_1.length; i += 1) {
  				each_blocks_1[i].d();
  			}if (component.refs.tabs === ul0) component.refs.tabs = null;

  			if (slot_content_default) {
  				reinsertChildren(ul1, slot_content_default);
  			}

  			if (component.refs.panels === ul1) component.refs.panels = null;
  		}
  	};
  }

  // (7:30) 
  function create_if_block_1(component, ctx) {
  	var i, i_class_value;

  	return {
  		c: function create() {
  			i = createElement("i");
  			i.className = i_class_value = ctx.tab.icon;
  			addLoc(i, file$1, 7, 12, 276);
  		},

  		m: function mount(target, anchor) {
  			insert(target, i, anchor);
  		},

  		p: function update(changed, ctx) {
  			if (changed.tabs && i_class_value !== (i_class_value = ctx.tab.icon)) {
  				i.className = i_class_value;
  			}
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(i);
  			}
  		}
  	};
  }

  // (5:12) {#if tab.title}
  function create_if_block(component, ctx) {
  	var span,
  	    text_value = ctx.tab.title,
  	    text;

  	return {
  		c: function create() {
  			span = createElement("span");
  			text = createText(text_value);
  			addLoc(span, file$1, 5, 12, 206);
  		},

  		m: function mount(target, anchor) {
  			insert(target, span, anchor);
  			append(span, text);
  		},

  		p: function update(changed, ctx) {
  			if (changed.tabs && text_value !== (text_value = ctx.tab.title)) {
  				setData(text, text_value);
  			}
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(span);
  			}
  		}
  	};
  }

  // (3:8) {#each tabs as tab, i (tab.id)}
  function create_each_block(component, key_1, ctx) {
  	var first, if_block_anchor, current;

  	function select_block_type(ctx) {
  		if (ctx.tab.title) return create_if_block;
  		if (ctx.tab.icon) return create_if_block_1;
  	}

  	var current_block_type = select_block_type(ctx);
  	var if_block = current_block_type && current_block_type(component, ctx);

  	var tab_initial_data = { id: ctx.tab.id };
  	var tab = new Tab({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: tab_initial_data
  	});

  	tab.on("select", function (event) {
  		component.set({ index: ctx.i });
  	});

  	return {
  		key: key_1,

  		first: null,

  		c: function create() {
  			first = createComment();
  			if (if_block) if_block.c();
  			if_block_anchor = createComment();
  			tab._fragment.c();
  			this.first = first;
  		},

  		m: function mount(target, anchor) {
  			insert(target, first, anchor);
  			if (if_block) if_block.m(tab._slotted.default, null);
  			append(tab._slotted.default, if_block_anchor);
  			tab._mount(target, anchor);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
  				if_block.p(changed, ctx);
  			} else {
  				if (if_block) if_block.d(1);
  				if_block = current_block_type && current_block_type(component, ctx);
  				if (if_block) if_block.c();
  				if (if_block) if_block.m(if_block_anchor.parentNode, if_block_anchor);
  			}

  			var tab_changes = {};
  			if (changed.tabs) tab_changes.id = ctx.tab.id;
  			tab._set(tab_changes);
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (tab) tab._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(first);
  			}

  			if (if_block) if_block.d();
  			tab.destroy(detach);
  		}
  	};
  }

  function Tabs(options) {
  	var _this = this;

  	this._debugName = '<Tabs>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$1(), options.data);
  	if (!('tabs' in this._state)) console.warn("<Tabs> was created without expected data property 'tabs'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate];

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$1(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate.call(_this);
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(Tabs.prototype, protoDev);

  Tabs.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\Panel.html generated by Svelte v2.16.0 */

  function data$2() {
  	return {
  		id: ''
  	};
  }
  function oncreate$1() {
  	var _get = this.get(),
  	    id = _get.id,
  	    icon = _get.icon,
  	    title = _get.title;

  	this.refs.container.data = { id: id, icon: icon, title: title };
  }
  var file$2 = "src\\Panel.html";

  function create_main_fragment$2(component, ctx) {
  	var li,
  	    slot_content_default = component._slotted.default,
  	    li_class_value,
  	    current;

  	return {
  		c: function create() {
  			li = createElement("li");
  			li.className = li_class_value = "panel" + (ctx.id ? ' ' + ctx.id : '');
  			addLoc(li, file$2, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, li, anchor);

  			if (slot_content_default) {
  				append(li, slot_content_default);
  			}

  			component.refs.container = li;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (changed.id && li_class_value !== (li_class_value = "panel" + (ctx.id ? ' ' + ctx.id : ''))) {
  				li.className = li_class_value;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(li);
  			}

  			if (slot_content_default) {
  				reinsertChildren(li, slot_content_default);
  			}

  			if (component.refs.container === li) component.refs.container = null;
  		}
  	};
  }

  function Panel(options) {
  	var _this = this;

  	this._debugName = '<Panel>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$2(), options.data);
  	if (!('id' in this._state)) console.warn("<Panel> was created without expected data property 'id'");
  	this._intro = !!options.intro;

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$2(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate$1.call(_this);
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(Panel.prototype, protoDev);

  Panel.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  exports.Tabs = Tabs;
  exports.Tab = Tab;
  exports.Panel = Panel;

  });

  unwrapExports(scanexTabs_cjs);
  var scanexTabs_cjs_1 = scanexTabs_cjs.Tabs;
  var scanexTabs_cjs_2 = scanexTabs_cjs.Tab;
  var scanexTabs_cjs_3 = scanexTabs_cjs.Panel;

  var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var classCallCheck$1 = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass$1 = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var copy = function copy(source) {
      switch (typeof source === 'undefined' ? 'undefined' : _typeof$1(source)) {
          case 'number':
          case 'string':
          case 'function':
          default:
              return source;
          case 'object':
              if (source === null) {
                  return null;
              } else if (Array.isArray(source)) {
                  return source.map(function (item) {
                      return copy(item);
                  });
              } else if (source instanceof Date) {
                  return source;
              } else {
                  return Object.keys(source).reduce(function (a, k) {
                      a[k] = copy(source[k]);
                      return a;
                  }, {});
              }
      }
  };

  var extend = function extend(target, source) {
      if (target === source) {
          return target;
      } else {
          return Object.keys(source).reduce(function (a, k) {
              var value = source[k];
              if (_typeof$1(a[k]) === 'object' && k in a) {
                  a[k] = extend(a[k], value);
              } else {
                  a[k] = copy(value);
              }
              return a;
          }, copy(target));
      }
  };

  var DEFAULT_LANGUAGE = 'rus';

  var Translations = function () {
      function Translations() {
          classCallCheck$1(this, Translations);

          this._hash = {};
      }

      createClass$1(Translations, [{
          key: 'setLanguage',
          value: function setLanguage(lang) {
              this._language = lang;
          }
      }, {
          key: 'getLanguage',
          value: function getLanguage() {
              return window.language || this._language || DEFAULT_LANGUAGE;
          }
      }, {
          key: 'addText',
          value: function addText(lang, tran) {
              this._hash[lang] = extend(this._hash[lang] || {}, tran);
              return this;
          }
      }, {
          key: 'getText',
          value: function getText(key) {
              if (key && typeof key === 'string') {
                  var locale = this._hash[this.getLanguage()];
                  if (locale) {
                      return key.split('.').reduce(function (a, k) {
                          return a[k];
                      }, locale);
                  }
              }
              return null;
          }
      }]);
      return Translations;
  }();

  window.Scanex = window.Scanex || {};
  window.Scanex.Translations = window.Scanex.Translations || {};
  window.Scanex.translations = window.Scanex.translations || new Translations();

  var index = window.Scanex.translations;

  var scanexTranslations_cjs = index;

  /* src\Headline\Headline.html generated by Svelte v2.16.1 */

  function data() {
  	return {
  		title: ''
  	};
  }
  var methods = {
  	close: function close(e) {
  		e.stopPropagation();
  		this.fire('close');
  	}
  };

  function create_main_fragment(component, ctx) {
  	var div, i, text0, label, text1;

  	function click_handler(event) {
  		component.close(event);
  	}

  	return {
  		c: function c() {
  			div = createElement("div");
  			i = createElement("i");
  			text0 = createText("\r\n    ");
  			label = createElement("label");
  			text1 = createText(ctx.title);
  			addListener(i, "click", click_handler);
  			i.className = "style-editor-icon close";
  			label.className = "title";
  			div.className = "head";
  		},
  		m: function m(target, anchor) {
  			insert(target, div, anchor);
  			append(div, i);
  			append(div, text0);
  			append(div, label);
  			append(label, text1);
  		},
  		p: function p(changed, ctx) {
  			if (changed.title) {
  				setData(text1, ctx.title);
  			}
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			removeListener(i, "click", click_handler);
  		}
  	};
  }

  function Headline(options) {
  	init(this, options);
  	this._state = assign(data(), options.data);
  	this._intro = true;

  	this._fragment = create_main_fragment(this, this._state);

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}
  }

  assign(Headline.prototype, proto);
  assign(Headline.prototype, methods);

  var classCallCheck$2 = function classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
          throw new TypeError("Cannot call a class as a function");
      }
  };

  var createClass$2 = function () {
      function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
              var descriptor = props[i];
              descriptor.enumerable = descriptor.enumerable || false;
              descriptor.configurable = true;
              if ("value" in descriptor) descriptor.writable = true;
              Object.defineProperty(target, descriptor.key, descriptor);
          }
      }

      return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
      };
  }();

  var EventTarget = function () {
      function EventTarget() {
          classCallCheck$2(this, EventTarget);

          this.listeners = {};
      }

      createClass$2(EventTarget, [{
          key: 'addEventListener',
          value: function addEventListener(type, callback) {
              if (!(type in this.listeners)) {
                  this.listeners[type] = [];
              }
              this.listeners[type].push(callback);
          }
      }, {
          key: 'on',
          value: function on(type, callback) {
              this.addEventListener(type, callback);
              return this;
          }
      }, {
          key: 'removeEventListener',
          value: function removeEventListener(type, callback) {
              if (!(type in this.listeners)) {
                  return;
              }
              var stack = this.listeners[type];
              for (var i = 0, l = stack.length; i < l; i++) {
                  if (stack[i] === callback) {
                      stack.splice(i, 1);
                      return this.removeEventListener(type, callback);
                  }
              }
          }
      }, {
          key: 'off',
          value: function off(type, callback) {
              this.removeEventListener(type, callback);
              return this;
          }
      }, {
          key: 'dispatchEvent',
          value: function dispatchEvent(event) {
              if (!(event.type in this.listeners)) {
                  return;
              }
              var stack = this.listeners[event.type];
              Object.defineProperty(event, 'target', {
                  enumerable: false,
                  configurable: false,
                  writable: false,
                  value: this
              });
              for (var i = 0, l = stack.length; i < l; i++) {
                  stack[i].call(this, event);
              }
          }
      }]);
      return EventTarget;
  }();

  var scanexEventTarget_cjs = EventTarget;

  var classCallCheck$1$1 = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass$1$1 = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var inherits$1 = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  var possibleConstructorReturn$1 = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  var DND = function (_EventTarget) {
      inherits$1(DND, _EventTarget);

      function DND(_ref) {
          var container = _ref.container,
              _ref$changeDom = _ref.changeDom,
              changeDom = _ref$changeDom === undefined ? true : _ref$changeDom;
          classCallCheck$1$1(this, DND);

          var _this = possibleConstructorReturn$1(this, (DND.__proto__ || Object.getPrototypeOf(DND)).call(this));

          _this._container = container;
          _this._changeDom = changeDom;
          _this._start = _this._start.bind(_this);
          _this._end = _this._end.bind(_this);
          _this._over = _this._over.bind(_this);
          _this._enter = _this._enter.bind(_this);
          _this._drop = _this._drop.bind(_this);
          _this._cur = null;
          _this.initialize();
          document.addEventListener('dragstart', _this._start, false);
          document.addEventListener('dragend', _this._end, false);
          document.addEventListener('dragover', _this._over, false);
          document.addEventListener('dragenter', _this._enter, false);
          document.addEventListener('drop', _this._drop, false);
          return _this;
      }

      createClass$1$1(DND, [{
          key: 'initialize',
          value: function initialize() {
              var elements = this._container.querySelectorAll('.drag-box');
              for (var i = 0; i < elements.length; ++i) {
                  var el = elements[i];
                  el.draggable = true;
                  if (!el.dataset) {
                      el.dataset = {};
                  }
                  el.dataset.id = el.dataset.id || (0 | Math.random() * 9e+6).toString(36);
              }
          }
      }, {
          key: '_indexOf',
          value: function _indexOf(target) {
              if (target && target.dataset) {
                  var elements = this._container.querySelectorAll('.drag-box');
                  for (var i = 0; i < elements.length; ++i) {
                      var el = elements[i];
                      if (el.dataset.id === target.dataset.id) {
                          return i;
                      }
                  }
              }
              return null;
          }
      }, {
          key: '_start',
          value: function _start(e) {
              var target = e.target;

              if (target.classList.contains('drag-box')) {
                  this._dragged = target;
                  this._startIndex = this._indexOf(this._dragged);
              }
          }
      }, {
          key: '_enter',
          value: function _enter(e) {
              var target = e.target;

              if (target.classList.contains('drag-box')) {
                  this._cur && this._cur.classList.remove('hover');
                  target.classList.add('hover');
                  this._cur = target;
              }
          }
      }, {
          key: '_drop',
          value: function _drop(e) {
              var target = e.target;

              if (target.classList.contains('drag-box')) {
                  e.preventDefault();
              }
          }
      }, {
          key: '_over',
          value: function _over(e) {
              var target = e.target;

              e.preventDefault();
          }
      }, {
          key: '_end',
          value: function _end(e) {
              if (this._cur) {
                  this._dragged.classList.remove('hover');
                  this._cur.classList.remove('hover');
                  var cur = this._indexOf(this._cur);
                  if (this._startIndex < cur) {
                      if (this._cur.nextElementSibling) {
                          if (this._changeDom) {
                              this._container.insertBefore(this._dragged, this._cur.nextElementSibling);
                          }
                      } else {
                          if (this._changeDom) {
                              this._container.appendChild(this._dragged);
                          }
                      }
                  } else if (this._startIndex >= cur) {
                      if (this._changeDom) {
                          this._container.insertBefore(this._dragged, this._cur);
                      }
                  }
                  var event = document.createEvent('Event');
                  event.initEvent('change', false, false);
                  event.detail = { el: this._dragged, start: this._startIndex, end: cur };
                  this.dispatchEvent(event);
              }
          }
      }]);
      return DND;
  }(scanexEventTarget_cjs);

  var scanexDnd_cjs = DND;

  /* src\Preview\Preview.html generated by Svelte v2.16.1 */

  scanexTranslations_cjs.addText('eng', {
  	style: {
  		add: 'Add style',
  		coloring: 'Coloring',
  		copy: 'Copy',
  		rename: 'Rename',
  		remove: 'Remove'
  	}
  });

  scanexTranslations_cjs.addText('rus', {
  	style: {
  		add: 'Добавить стиль',
  		coloring: 'Раскраска',
  		copy: 'Создать копию',
  		rename: 'Переименовать',
  		remove: 'Удалить'
  	}
  });

  var translate = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

  var move_from_to = function move_from_to(a, i, j) {
  	if (j < i) {
  		var x = a.slice(i, i + 1);
  		return [].concat(a.slice(0, j), x, a.slice(j, i), a.slice(i + 1));
  	} else if (i < j) {
  		var _x = a.slice(i, i + 1);
  		return [].concat(a.slice(0, i), a.slice(i + 1, j + 1), _x, a.slice(j + 1));
  	}
  	return a.slice();
  };

  function currentStyle(_ref) {
  	var styles = _ref.styles,
  	    selected = _ref.selected;
  	var name = styles[selected].name;

  	return name;
  }

  function data$1() {
  	return {
  		visible: false,
  		styles: [],
  		selected: 0,
  		groupMenuVisible: false
  	};
  }
  var methods$1 = {
  	toggle: function toggle(e) {
  		e.srcObject = this;

  		var _get = this.get(),
  		    visible = _get.visible;

  		this.set({ visible: !visible });
  	},
  	edit: function edit(e, i) {
  		var _this = this;

  		e.stopPropagation();
  		var target = e.target.parentNode.parentNode.querySelector(':first-child');

  		var _get2 = this.get(),
  		    styles = _get2.styles;

  		var _target$getBoundingCl = target.getBoundingClientRect(),
  		    top = _target$getBoundingCl.top,
  		    left = _target$getBoundingCl.left,
  		    height = _target$getBoundingCl.height,
  		    width = _target$getBoundingCl.width;

  		this.refs.editor.style.top = top + this.constructor.EDITOR_OFFSET - this.OFFSET_TOP + 'px';
  		this.refs.editor.style.left = left + this.constructor.EDITOR_OFFSET + 'px';
  		this.refs.editor.style.height = height - this.constructor.EDITOR_OFFSET * 2 + 'px';
  		this.refs.editor.style.width = width - this.constructor.EDITOR_OFFSET * 2 + 'px';
  		this.refs.editor.value = styles[i].name;
  		var h = function h(ev) {
  			_this.refs.editor.style.display = "none";
  			_this.refs.editor.removeEventListener('change', h);
  			_this.fire('rename', { index: i, name: _this.refs.editor.value });
  		};
  		this.refs.editor.addEventListener('change', h);
  		this.refs.editor.style.display = "block";
  		this.refs.editor.focus();
  	},
  	add: function add(e) {
  		e.stopPropagation();
  		this.set({ visible: false });
  		this.fire('add');
  	},
  	group: function group(e) {
  		this.toggleGroup(e);
  		this.fire('group');
  	},
  	copy: function copy(e, i) {
  		e.stopPropagation();
  		this.fire('copy', i);
  	},
  	remove: function remove(e, i) {
  		e.stopPropagation();
  		this.fire('remove', i);
  	},
  	pick: function pick(e, i) {
  		e.stopPropagation();

  		var _get3 = this.get(),
  		    selected = _get3.selected,
  		    visible = _get3.visible;

  		this.set({ selected: i, visible: false });
  	},
  	show: function show(i) {
  		this.refs.editor.style.display = "none";
  		var row = this.refs.table.children[i];
  		row.classList.add('highlight');
  		row.querySelector('.copy i').style.visibility = 'visible';
  		row.querySelector('.rename i').style.visibility = 'visible';
  		row.querySelector('.remove i').style.visibility = 'visible';
  	},
  	hide: function hide(i) {
  		var row = this.refs.table.children[i];
  		row.classList.remove('highlight');
  		row.querySelector('.copy i').style.visibility = 'hidden';
  		row.querySelector('.rename i').style.visibility = 'hidden';
  		row.querySelector('.remove i').style.visibility = 'hidden';
  	},
  	toggleGroup: function toggleGroup(e) {
  		e.stopPropagation();

  		var _get4 = this.get(),
  		    groupMenuVisible = _get4.groupMenuVisible;

  		this.set({ groupMenuVisible: !groupMenuVisible, visible: false });
  	},
  	close: function close(_ref2) {
  		var srcObject = _ref2.srcObject;

  		if (this !== srcObject) {
  			this.set({ visible: false });
  		}
  	}
  };

  function oncreate() {
  	var _this2 = this;

  	this.OFFSET_TOP = document.getElementById('header').getBoundingClientRect().height;
  	this._dnd = new scanexDnd_cjs({ container: this.refs.table, changeDom: false });
  	this._dnd.addEventListener('change', function (_ref3) {
  		var _ref3$detail = _ref3.detail,
  		    start = _ref3$detail.start,
  		    end = _ref3$detail.end;

  		var _get5 = _this2.get(),
  		    styles = _get5.styles,
  		    selected = _get5.selected;

  		if (selected === start) {
  			selected = end;
  		} else if (selected === end) {
  			if (start < end) {
  				--selected;
  			} else if (start > end) {
  				++selected;
  			}
  		}
  		_this2.set({ styles: move_from_to(styles, start, end), selected: selected });
  	});
  }
  function onupdate(_ref4) {
  	var changed = _ref4.changed,
  	    current = _ref4.current;

  	if (changed.visible && current.visible) {
  		var _refs$container$getBo = this.refs.container.getBoundingClientRect(),
  		    left = _refs$container$getBo.left,
  		    top = _refs$container$getBo.top,
  		    width = _refs$container$getBo.width;

  		this.refs.list.style.top = top + 10 + 'px';
  		this.refs.list.style.left = left + Math.round((width - this.refs.list.getBoundingClientRect().width) / 2) + 'px';
  	}
  	if (!this.get().visible) {
  		this.refs.editor.style.display = "none";
  	}
  	if (changed.styles) {
  		this._dnd.initialize();
  	}
  }
  function setup(Component) {
  	Component.EDITOR_OFFSET = 3;
  }
  function mouseleave_handler(event) {
  	var _svelte = this._svelte,
  	    component = _svelte.component,
  	    ctx = _svelte.ctx;


  	component.hide(ctx.i);
  }

  function mouseenter_handler(event) {
  	var _svelte2 = this._svelte,
  	    component = _svelte2.component,
  	    ctx = _svelte2.ctx;


  	component.show(ctx.i);
  }

  function click_handler_3(event) {
  	var _svelte3 = this._svelte,
  	    component = _svelte3.component,
  	    ctx = _svelte3.ctx;


  	component.remove(event, ctx.i);
  }

  function click_handler_2(event) {
  	var _svelte4 = this._svelte,
  	    component = _svelte4.component,
  	    ctx = _svelte4.ctx;


  	component.edit(event, ctx.i);
  }

  function click_handler_1(event) {
  	var _svelte5 = this._svelte,
  	    component = _svelte5.component,
  	    ctx = _svelte5.ctx;


  	component.copy(event, ctx.i);
  }

  function click_handler(event) {
  	var _svelte6 = this._svelte,
  	    component = _svelte6.component,
  	    ctx = _svelte6.ctx;


  	component.pick(event, ctx.i);
  }

  function get_each_context(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.s = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function create_main_fragment$1(component, ctx) {
  	var div12, div9, div8, div1, div0, text0, text1, div2, i0, text2, div3, text3, div7, i2, text4, div6, div4, text5, div5, text6, div11, div10, text7, input;

  	function onwindowclick(event) {
  		component.close(event);	}
  	window.addEventListener("click", onwindowclick);

  	function click_handler(event) {
  		component.toggle(event);
  	}

  	function click_handler_1(event) {
  		component.toggle(event);
  	}

  	function click_handler_2(event) {
  		component.add(event);
  	}

  	function click_handler_3(event) {
  		component.add(event);
  	}

  	function click_handler_4(event) {
  		component.group(event);
  	}

  	function click_handler_5(event) {
  		component.toggleGroup(event);
  	}

  	var each_value = ctx.styles;

  	var each_blocks = [];

  	for (var i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block(component, get_each_context(ctx, each_value, i));
  	}

  	function click_handler_6(event) {
  		event.stopPropagation();
  	}

  	return {
  		c: function c() {
  			div12 = createElement("div");
  			div9 = createElement("div");
  			div8 = createElement("div");
  			div1 = createElement("div");
  			div0 = createElement("div");
  			text0 = createText(ctx.currentStyle);
  			text1 = createText("            \r\n            ");
  			div2 = createElement("div");
  			i0 = createElement("i");
  			text2 = createText("\r\n            ");
  			div3 = createElement("div");
  			div3.innerHTML = '<i></i>';
  			text3 = createText("\r\n            ");
  			div7 = createElement("div");
  			i2 = createElement("i");
  			text4 = createText("\r\n                ");
  			div6 = createElement("div");
  			div4 = createElement("div");
  			div4.innerHTML = '<i></i>';
  			text5 = createText("            \r\n                    ");
  			div5 = createElement("div");
  			div5.innerHTML = '<i></i>';
  			text6 = createText("\r\n    ");
  			div11 = createElement("div");
  			div10 = createElement("div");

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			text7 = createText("    \r\n    ");
  			input = createElement("input");
  			addListener(div1, "click", click_handler);
  			div1.className = "label";
  			toggleClass(i0, "visible", ctx.visible);
  			toggleClass(i0, "hidden", !ctx.visible);
  			addListener(div2, "click", click_handler_1);
  			div2.className = "toggle";
  			addListener(div3, "click", click_handler_2);
  			div3.className = "add";
  			div3.title = translate('style.add');
  			toggleClass(i2, "visible", ctx.groupMenuVisible);
  			toggleClass(i2, "hidden", !ctx.groupMenuVisible);
  			addListener(div4, "click", click_handler_3);
  			div4.className = "add-style";
  			div4.title = translate('style.add');
  			addListener(div5, "click", click_handler_4);
  			div5.className = "create-group";
  			div5.title = translate('style.coloring');
  			div6.className = "group-dropdown";
  			toggleClass(div6, "visible", ctx.groupMenuVisible);
  			toggleClass(div6, "hidden", !ctx.groupMenuVisible);
  			addListener(div7, "click", click_handler_5);
  			div7.className = "group-button";
  			div9.className = "current-style";
  			div10.className = "drag-container";
  			div11.className = "style-list";
  			toggleClass(div11, "visible", ctx.visible);
  			addListener(input, "click", click_handler_6);
  			input.className = "editor";
  			setAttribute(input, "type", "text");
  			input.value = "";
  			div12.className = "preview";
  		},
  		m: function m(target, anchor) {
  			insert(target, div12, anchor);
  			append(div12, div9);
  			append(div9, div8);
  			append(div8, div1);
  			append(div1, div0);
  			append(div0, text0);
  			append(div8, text1);
  			append(div8, div2);
  			append(div2, i0);
  			append(div8, text2);
  			append(div8, div3);
  			append(div8, text3);
  			append(div8, div7);
  			append(div7, i2);
  			append(div7, text4);
  			append(div7, div6);
  			append(div6, div4);
  			append(div6, text5);
  			append(div6, div5);
  			append(div12, text6);
  			append(div12, div11);
  			append(div11, div10);

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div10, null);
  			}

  			component.refs.table = div10;
  			component.refs.list = div11;
  			append(div12, text7);
  			append(div12, input);
  			component.refs.editor = input;
  			component.refs.container = div12;
  		},
  		p: function p(changed, ctx) {
  			if (changed.currentStyle) {
  				setData(text0, ctx.currentStyle);
  			}

  			if (changed.visible) {
  				toggleClass(i0, "visible", ctx.visible);
  				toggleClass(i0, "hidden", !ctx.visible);
  			}

  			if (changed.groupMenuVisible) {
  				toggleClass(i2, "visible", ctx.groupMenuVisible);
  				toggleClass(i2, "hidden", !ctx.groupMenuVisible);
  				toggleClass(div6, "visible", ctx.groupMenuVisible);
  				toggleClass(div6, "hidden", !ctx.groupMenuVisible);
  			}

  			if (changed.selected || changed.styles) {
  				each_value = ctx.styles;

  				for (var i = 0; i < each_value.length; i += 1) {
  					var child_ctx = get_each_context(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(changed, child_ctx);
  					} else {
  						each_blocks[i] = create_each_block(component, child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(div10, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}
  				each_blocks.length = each_value.length;
  			}

  			if (changed.visible) {
  				toggleClass(div11, "visible", ctx.visible);
  			}
  		},
  		d: function d(detach) {
  			window.removeEventListener("click", onwindowclick);

  			if (detach) {
  				detachNode(div12);
  			}

  			removeListener(div1, "click", click_handler);
  			removeListener(div2, "click", click_handler_1);
  			removeListener(div3, "click", click_handler_2);
  			removeListener(div4, "click", click_handler_3);
  			removeListener(div5, "click", click_handler_4);
  			removeListener(div7, "click", click_handler_5);

  			destroyEach(each_blocks, detach);

  			if (component.refs.table === div10) component.refs.table = null;
  			if (component.refs.list === div11) component.refs.list = null;
  			removeListener(input, "click", click_handler_6);
  			if (component.refs.editor === input) component.refs.editor = null;
  			if (component.refs.container === div12) component.refs.container = null;
  		}
  	};
  }

  // (29:8) {#each styles as s, i}
  function create_each_block(component, ctx) {
  	var div,
  	    span0,
  	    text0_value = ctx.styles[ctx.i].name,
  	    text0,
  	    text1,
  	    span1,
  	    i0,
  	    text2,
  	    span2,
  	    i1,
  	    text3,
  	    span3,
  	    i2;

  	return {
  		c: function c() {
  			div = createElement("div");
  			span0 = createElement("span");
  			text0 = createText(text0_value);
  			text1 = createText("\r\n                ");
  			span1 = createElement("span");
  			i0 = createElement("i");
  			text2 = createText("                \r\n                ");
  			span2 = createElement("span");
  			i1 = createElement("i");
  			text3 = createText("\r\n                ");
  			span3 = createElement("span");
  			i2 = createElement("i");
  			span0._svelte = { component: component, ctx: ctx };

  			addListener(span0, "click", click_handler);
  			span0.className = "label";

  			i0._svelte = { component: component, ctx: ctx };

  			addListener(i0, "click", click_handler_1);
  			span1.className = "copy";
  			span1.title = translate('style.copy');

  			i1._svelte = { component: component, ctx: ctx };

  			addListener(i1, "click", click_handler_2);
  			span2.className = "rename";
  			span2.title = translate('style.rename');

  			i2._svelte = { component: component, ctx: ctx };

  			addListener(i2, "click", click_handler_3);
  			span3.className = "remove";
  			span3.title = translate('style.remove');

  			div._svelte = { component: component, ctx: ctx };

  			addListener(div, "mouseenter", mouseenter_handler);
  			addListener(div, "mouseleave", mouseleave_handler);
  			div.className = "style drag-box";
  			toggleClass(div, "selected", ctx.selected === ctx.i);
  			toggleClass(div, "normal", ctx.selected !== ctx.i);
  		},
  		m: function m(target, anchor) {
  			insert(target, div, anchor);
  			append(div, span0);
  			append(span0, text0);
  			append(div, text1);
  			append(div, span1);
  			append(span1, i0);
  			append(div, text2);
  			append(div, span2);
  			append(span2, i1);
  			append(div, text3);
  			append(div, span3);
  			append(span3, i2);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.styles && text0_value !== (text0_value = ctx.styles[ctx.i].name)) {
  				setData(text0, text0_value);
  			}

  			span0._svelte.ctx = ctx;
  			i0._svelte.ctx = ctx;
  			i1._svelte.ctx = ctx;
  			i2._svelte.ctx = ctx;
  			div._svelte.ctx = ctx;
  			if (changed.selected) {
  				toggleClass(div, "selected", ctx.selected === ctx.i);
  				toggleClass(div, "normal", ctx.selected !== ctx.i);
  			}
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			removeListener(span0, "click", click_handler);
  			removeListener(i0, "click", click_handler_1);
  			removeListener(i1, "click", click_handler_2);
  			removeListener(i2, "click", click_handler_3);
  			removeListener(div, "mouseenter", mouseenter_handler);
  			removeListener(div, "mouseleave", mouseleave_handler);
  		}
  	};
  }

  function Preview(options) {
  	var _this3 = this;

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$1(), options.data);

  	this._recompute({ styles: 1, selected: 1 }, this._state);
  	this._intro = true;
  	this._handlers.update = [onupdate];

  	this._fragment = create_main_fragment$1(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate.call(_this3);
  		_this3.fire("update", { changed: assignTrue({}, _this3._state), current: _this3._state });
  	});

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}
  }

  assign(Preview.prototype, proto);
  assign(Preview.prototype, methods$1);

  Preview.prototype._recompute = function _recompute(changed, state) {
  	if (changed.styles || changed.selected) {
  		if (this._differs(state.currentStyle, state.currentStyle = currentStyle(state))) changed.currentStyle = true;
  	}
  };

  setup(Preview);

  var _typeof$2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop$1() {}

  function assign$1(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue$1(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function addLoc$1(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run$1(fn) {
  	fn();
  }

  function append$1(target, node) {
  	target.appendChild(node);
  }

  function insert$1(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode$1(node) {
  	node.parentNode.removeChild(node);
  }

  function destroyEach$1(iterations, detach) {
  	for (var i = 0; i < iterations.length; i += 1) {
  		if (iterations[i]) iterations[i].d(detach);
  	}
  }

  function createElement$1(name) {
  	return document.createElement(name);
  }

  function createText$1(data) {
  	return document.createTextNode(data);
  }

  function addListener$1(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener$1(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setAttribute$1(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
  }

  function toggleClass$1(element, name, toggle) {
  	element.classList[toggle ? 'add' : 'remove'](name);
  }

  function blankObject$1() {
  	return Object.create(null);
  }

  function destroy$1(detach) {
  	this.destroy = noop$1;
  	this.fire('destroy');
  	this.set = noop$1;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev$1(detach) {
  	destroy$1.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs$1(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof$2(a)) === 'object' || typeof a === 'function';
  }

  function fire$1(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush$1(component) {
  	component._lock = true;
  	callAll$1(component._beforecreate);
  	callAll$1(component._oncreate);
  	callAll$1(component._aftercreate);
  	component._lock = false;
  }

  function get$1$1() {
  	return this._state;
  }

  function init$1(component, options) {
  	component._handlers = blankObject$1();
  	component._slots = blankObject$1();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on$1(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1$1(newState) {
  	this._set(assign$1({}, newState));
  	if (this.root._lock) return;
  	flush$1(this.root);
  }

  function _set$1(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign$1(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign$1(assign$1({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage$1(newState) {
  	assign$1(this._staged, newState);
  }

  function setDev$1(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof$2(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1$1.call(this, newState);
  }

  function callAll$1(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount$1(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev$1 = {
  	destroy: destroyDev$1,
  	get: get$1$1,
  	fire: fire$1,
  	on: on$1,
  	set: setDev$1,
  	_recompute: noop$1,
  	_set: _set$1,
  	_stage: _stage$1,
  	_mount: _mount$1,
  	_differs: _differs$1
  };

  /* src\Dropdown.html generated by Svelte v2.16.1 */

  function item(_ref) {
  	var selected = _ref.selected,
  	    items = _ref.items;

  	return items[selected];
  }

  function data$2() {
  	return {
  		collapsed: true,
  		disabled: false,
  		items: [],
  		selected: 0
  	};
  }
  var methods$2 = {
  	select: function select(e, i) {
  		var _get = this.get(),
  		    selected = _get.selected;

  		if (i !== selected) {
  			this.set({ selected: i });
  		}
  		this.toggle(e);
  		this.fire('select', i);
  	},
  	toggle: function toggle(e) {
  		var _get2 = this.get(),
  		    collapsed = _get2.collapsed,
  		    disabled = _get2.disabled;

  		if (!disabled) {
  			this.set({ collapsed: !collapsed });
  			e.srcObject = this;
  		} else {
  			e.stopPropagation();
  		}
  	},
  	close: function close(_ref2) {
  		var srcObject = _ref2.srcObject;

  		if (this !== srcObject) {
  			this.set({ collapsed: true });
  		}
  	}
  };

  function onupdate$1(_ref3) {
  	var changed = _ref3.changed,
  	    current = _ref3.current;

  	if (changed.disabled && current.disabled) {
  		this.set({ collapsed: true });
  	}
  }
  var file = "src\\Dropdown.html";

  function click_handler$1(event) {
  	var _svelte = this._svelte,
  	    component = _svelte.component,
  	    ctx = _svelte.ctx;


  	component.select(event, ctx.i);
  }

  function get_each_context$1(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.x = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function create_main_fragment$2(component, ctx) {
  	var div2, div0, table0, tr, td0, text0, td1, i, text1, div1, table1, current;

  	function onwindowclick(event) {
  		component.close(event);	}
  	window.addEventListener("click", onwindowclick);

  	function click_handler(event) {
  		component.toggle(event);
  	}

  	var each_value = ctx.items;

  	var each_blocks = [];

  	for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
  		each_blocks[i_1] = create_each_block$1(component, get_each_context$1(ctx, each_value, i_1));
  	}

  	return {
  		c: function create() {
  			div2 = createElement$1("div");
  			div0 = createElement$1("div");
  			table0 = createElement$1("table");
  			tr = createElement$1("tr");
  			td0 = createElement$1("td");
  			text0 = createText$1("\r\n                ");
  			td1 = createElement$1("td");
  			i = createElement$1("i");
  			text1 = createText$1("\r\n    ");
  			div1 = createElement$1("div");
  			table1 = createElement$1("table");

  			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
  				each_blocks[i_1].c();
  			}
  			td0.className = "scanex-dropdown-item-content";
  			addLoc$1(td0, file, 5, 16, 339);
  			i.className = "scanex-dropdown-item-icon";
  			toggleClass$1(i, "collapse", !ctx.collapsed);
  			toggleClass$1(i, "expand", ctx.collapsed);
  			addLoc$1(i, file, 7, 20, 485);
  			td1.className = "scanex-dropdown-item-icon-container";
  			addLoc$1(td1, file, 6, 16, 415);
  			addListener$1(tr, "click", click_handler);
  			tr.className = "scanex-dropdown-item";
  			addLoc$1(tr, file, 4, 12, 263);
  			table0.className = "scanex-dropdown-selected";
  			setAttribute$1(table0, "cellpadding", "0");
  			setAttribute$1(table0, "cellspacing", "0");
  			addLoc$1(table0, file, 3, 8, 177);
  			div0.className = "scanex-dropdown-selected-container";
  			addLoc$1(div0, file, 2, 4, 119);
  			table1.className = "scanex-dropdown-items";
  			setAttribute$1(table1, "cellpadding", "0");
  			setAttribute$1(table1, "cellspacing", "0");
  			addLoc$1(table1, file, 13, 8, 747);
  			div1.className = "scanex-dropdown-items-container";
  			toggleClass$1(div1, "hidden", ctx.collapsed);
  			addLoc$1(div1, file, 12, 4, 657);
  			div2.className = "scanex-dropdown-widget";
  			toggleClass$1(div2, "disabled", ctx.disabled);
  			addLoc$1(div2, file, 1, 0, 42);
  		},

  		m: function mount(target, anchor) {
  			insert$1(target, div2, anchor);
  			append$1(div2, div0);
  			append$1(div0, table0);
  			append$1(table0, tr);
  			append$1(tr, td0);
  			td0.innerHTML = ctx.item;
  			append$1(tr, text0);
  			append$1(tr, td1);
  			append$1(td1, i);
  			append$1(div2, text1);
  			append$1(div2, div1);
  			append$1(div1, table1);

  			for (var i_1 = 0; i_1 < each_blocks.length; i_1 += 1) {
  				each_blocks[i_1].m(table1, null);
  			}

  			component.refs.items = div1;
  			component.refs.main = div2;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (changed.item) {
  				td0.innerHTML = ctx.item;
  			}

  			if (changed.collapsed) {
  				toggleClass$1(i, "collapse", !ctx.collapsed);
  				toggleClass$1(i, "expand", ctx.collapsed);
  			}

  			if (changed.items) {
  				each_value = ctx.items;

  				for (var i_1 = 0; i_1 < each_value.length; i_1 += 1) {
  					var child_ctx = get_each_context$1(ctx, each_value, i_1);

  					if (each_blocks[i_1]) {
  						each_blocks[i_1].p(changed, child_ctx);
  					} else {
  						each_blocks[i_1] = create_each_block$1(component, child_ctx);
  						each_blocks[i_1].c();
  						each_blocks[i_1].m(table1, null);
  					}
  				}

  				for (; i_1 < each_blocks.length; i_1 += 1) {
  					each_blocks[i_1].d(1);
  				}
  				each_blocks.length = each_value.length;
  			}

  			if (changed.collapsed) {
  				toggleClass$1(div1, "hidden", ctx.collapsed);
  			}

  			if (changed.disabled) {
  				toggleClass$1(div2, "disabled", ctx.disabled);
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run$1,

  		d: function destroy$$1(detach) {
  			window.removeEventListener("click", onwindowclick);

  			if (detach) {
  				detachNode$1(div2);
  			}

  			removeListener$1(tr, "click", click_handler);

  			destroyEach$1(each_blocks, detach);

  			if (component.refs.items === div1) component.refs.items = null;
  			if (component.refs.main === div2) component.refs.main = null;
  		}
  	};
  }

  // (15:12) {#each items as x, i}
  function create_each_block$1(component, ctx) {
  	var tr,
  	    td,
  	    raw_value = ctx.x,
  	    text;

  	return {
  		c: function create() {
  			tr = createElement$1("tr");
  			td = createElement$1("td");
  			text = createText$1("\r\n            ");
  			td.className = "scanex-dropdown-item-content";
  			addLoc$1(td, file, 16, 16, 944);

  			tr._svelte = { component: component, ctx: ctx };

  			addListener$1(tr, "click", click_handler$1);
  			tr.className = "scanex-dropdown-item";
  			addLoc$1(tr, file, 15, 12, 865);
  		},

  		m: function mount(target, anchor) {
  			insert$1(target, tr, anchor);
  			append$1(tr, td);
  			td.innerHTML = raw_value;
  			append$1(tr, text);
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.items && raw_value !== (raw_value = ctx.x)) {
  				td.innerHTML = raw_value;
  			}

  			tr._svelte.ctx = ctx;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode$1(tr);
  			}

  			removeListener$1(tr, "click", click_handler$1);
  		}
  	};
  }

  function Dropdown(options) {
  	var _this = this;

  	this._debugName = '<Dropdown>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init$1(this, options);
  	this.refs = {};
  	this._state = assign$1(data$2(), options.data);

  	this._recompute({ selected: 1, items: 1 }, this._state);
  	if (!('selected' in this._state)) console.warn("<Dropdown> was created without expected data property 'selected'");
  	if (!('items' in this._state)) console.warn("<Dropdown> was created without expected data property 'items'");
  	if (!('disabled' in this._state)) console.warn("<Dropdown> was created without expected data property 'disabled'");

  	if (!('collapsed' in this._state)) console.warn("<Dropdown> was created without expected data property 'collapsed'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$1];

  	this._fragment = create_main_fragment$2(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue$1({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush$1(this);
  	}

  	this._intro = true;
  }

  assign$1(Dropdown.prototype, protoDev$1);
  assign$1(Dropdown.prototype, methods$2);

  Dropdown.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('item' in newState && !this._updatingReadonlyProperty) throw new Error("<Dropdown>: Cannot set read-only property 'item'");
  };

  Dropdown.prototype._recompute = function _recompute(changed, state) {
  	if (changed.selected || changed.items) {
  		if (this._differs(state.item, state.item = item(state))) changed.item = true;
  	}
  };

  var scanexDropdown_cjs = Dropdown;

  var _typeof$3 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop$2() {}

  function assign$2(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function addLoc$2(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run$2(fn) {
  	fn();
  }

  function append$2(target, node) {
  	target.appendChild(node);
  }

  function insert$2(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode$2(node) {
  	node.parentNode.removeChild(node);
  }

  function createElement$2(name) {
  	return document.createElement(name);
  }

  function createText$2(data) {
  	return document.createTextNode(data);
  }

  function addListener$2(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener$2(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setAttribute$2(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
  }

  function blankObject$2() {
  	return Object.create(null);
  }

  function destroy$2(detach) {
  	this.destroy = noop$2;
  	this.fire('destroy');
  	this.set = noop$2;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev$2(detach) {
  	destroy$2.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs$2(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof$3(a)) === 'object' || typeof a === 'function';
  }

  function fire$2(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush$2(component) {
  	component._lock = true;
  	callAll$2(component._beforecreate);
  	callAll$2(component._oncreate);
  	callAll$2(component._aftercreate);
  	component._lock = false;
  }

  function get$1$2() {
  	return this._state;
  }

  function init$2(component, options) {
  	component._handlers = blankObject$2();
  	component._slots = blankObject$2();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on$2(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1$2(newState) {
  	this._set(assign$2({}, newState));
  	if (this.root._lock) return;
  	flush$2(this.root);
  }

  function _set$2(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign$2(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign$2(assign$2({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage$2(newState) {
  	assign$2(this._staged, newState);
  }

  function setDev$2(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof$3(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1$2.call(this, newState);
  }

  function callAll$2(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount$2(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev$2 = {
  	destroy: destroyDev$2,
  	get: get$1$2,
  	fire: fire$2,
  	on: on$2,
  	set: setDev$2,
  	_recompute: noop$2,
  	_set: _set$2,
  	_stage: _stage$2,
  	_mount: _mount$2,
  	_differs: _differs$2
  };

  /* src\FileInput.html generated by Svelte v2.16.1 */

  function data$3() {
  	return {
  		value: ''
  	};
  }
  var file$1 = "src\\FileInput.html";

  function create_main_fragment$3(component, ctx) {
  	var div2,
  	    div0,
  	    input,
  	    input_updating = false,
  	    text,
  	    div1,
  	    i,
  	    current;

  	function input_input_handler() {
  		input_updating = true;
  		component.set({ value: input.value });
  		input_updating = false;
  	}

  	function click_handler(event) {
  		component.fire('open');
  	}

  	return {
  		c: function create() {
  			div2 = createElement$2("div");
  			div0 = createElement$2("div");
  			input = createElement$2("input");
  			text = createText$2("\r\n    ");
  			div1 = createElement$2("div");
  			i = createElement$2("i");
  			addListener$2(input, "input", input_input_handler);
  			setAttribute$2(input, "type", "text");
  			addLoc$2(input, file$1, 2, 8, 84);
  			div0.className = "scanex-file-input-field";
  			addLoc$2(div0, file$1, 1, 4, 37);
  			addLoc$2(i, file$1, 5, 8, 206);
  			addListener$2(div1, "click", click_handler);
  			div1.className = "scanex-file-input-button";
  			addLoc$2(div1, file$1, 4, 4, 134);
  			div2.className = "scanex-file-input";
  			addLoc$2(div2, file$1, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert$2(target, div2, anchor);
  			append$2(div2, div0);
  			append$2(div0, input);

  			input.value = ctx.value;

  			append$2(div2, text);
  			append$2(div2, div1);
  			append$2(div1, i);
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (!input_updating && changed.value) input.value = ctx.value;
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run$2,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode$2(div2);
  			}

  			removeListener$2(input, "input", input_input_handler);
  			removeListener$2(div1, "click", click_handler);
  		}
  	};
  }

  function FileInput(options) {
  	this._debugName = '<FileInput>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init$2(this, options);
  	this._state = assign$2(data$3(), options.data);
  	if (!('value' in this._state)) console.warn("<FileInput> was created without expected data property 'value'");
  	this._intro = !!options.intro;

  	this._fragment = create_main_fragment$3(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}

  	this._intro = true;
  }

  assign$2(FileInput.prototype, protoDev$2);

  FileInput.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  var scanexFileInput_cjs = FileInput;

  var scanexColorPicker_cjs = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, '__esModule', { value: true });

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  function noop() {}

  function assign(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function callAfter(fn, i) {
  	if (i === 0) fn();
  	return function () {
  		if (! --i) fn();
  	};
  }

  function addLoc(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run(fn) {
  	fn();
  }

  function append(target, node) {
  	target.appendChild(node);
  }

  function insert(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode(node) {
  	node.parentNode.removeChild(node);
  }

  function reinsertChildren(parent, target) {
  	while (parent.firstChild) {
  		target.appendChild(parent.firstChild);
  	}
  }

  function reinsertBefore(after, target) {
  	var parent = after.parentNode;
  	while (parent.firstChild !== after) {
  		target.appendChild(parent.firstChild);
  	}
  }

  function createFragment() {
  	return document.createDocumentFragment();
  }

  function createElement(name) {
  	return document.createElement(name);
  }

  function createText(data) {
  	return document.createTextNode(data);
  }

  function createComment() {
  	return document.createComment('');
  }

  function addListener(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setAttribute(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
  }

  function setData(text, data) {
  	text.data = '' + data;
  }

  function blankObject() {
  	return Object.create(null);
  }

  function destroy(detach) {
  	this.destroy = noop;
  	this.fire('destroy');
  	this.set = noop;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev(detach) {
  	destroy.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object' || typeof a === 'function';
  }

  function fire(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush(component) {
  	component._lock = true;
  	callAll(component._beforecreate);
  	callAll(component._oncreate);
  	callAll(component._aftercreate);
  	component._lock = false;
  }

  function get$1() {
  	return this._state;
  }

  function init(component, options) {
  	component._handlers = blankObject();
  	component._slots = blankObject();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1(newState) {
  	this._set(assign({}, newState));
  	if (this.root._lock) return;
  	flush(this.root);
  }

  function _set(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign(assign({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage(newState) {
  	assign(this._staged, newState);
  }

  function setDev(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1.call(this, newState);
  }

  function callAll(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev = {
  	destroy: destroyDev,
  	get: get$1,
  	fire: fire,
  	on: on,
  	set: setDev,
  	_recompute: noop,
  	_set: _set,
  	_stage: _stage,
  	_mount: _mount,
  	_differs: _differs
  };

  var stringToArray = function stringToArray(str) {
      var arr = [];
      for (var i = 0; i < str.length; ++i) {
          arr.push(str.charAt(i));
      }
      return arr;
  };

  var pad = function pad(origin, str, width, sym) {
      var s = stringToArray(str);
      for (var i = 0; s.length < width; ++i) {
          if (origin === 'left') {
              s.splice(0, 0, sym);
          } else {
              s.push(sym);
          }
      }
      return s.join('');
  };

  var padLeft = function padLeft(str, sym, width) {
      return pad('left', str, width, sym);
  };

  var hsl2rgb = function hsl2rgb(h, s, l) {
      var q = void 0;
      if (l < 0.5) {
          q = l * (1.0 + s);
      } else if (l >= 0.5) {
          q = l + s - l * s;
      }
      var p = 2.0 * l - q;
      var hk = h / 360;
      var norm = function norm(tc) {
          if (tc < 0) return tc + 1.0;
          if (tc > 1) return tc - 1.0;
          return tc;
      };
      var tr = norm(hk + 1 / 3);
      var tg = norm(hk);
      var tb = norm(hk - 1 / 3);

      var color = function color(tc) {
          if (tc < 1 / 6) {
              return p + (q - p) * 6.0 * tc;
          }
          if (1 / 6 <= tc && tc < 1 / 2) {
              return q;
          }
          if (1 / 2 <= tc && tc < 2 / 3) {
              return p + (q - p) * (2 / 3 - tc) * 6.0;
          }
          return p;
      };

      return {
          r: Math.round(color(tr) * 255),
          g: Math.round(color(tg) * 255),
          b: Math.round(color(tb) * 255)
      };
  };

  var rgb2hsl = function rgb2hsl(R, G, B) {
      var r = R / 255,
          g = G / 255,
          b = B / 255;
      var max = Math.max(r, g, b);
      var min = Math.min(r, g, b);
      var h = void 0;
      if (max == min) {
          h = undefined;
      } else if (max == r && g >= b) {
          h = 60 * (g - b) / (max - min);
      } else if (max == r && g < b) {
          h = 60 * (g - b) / (max - min) + 360;
      } else if (max == g) {
          h = 60 * (b - r) / (max - min) + 120;
      } else if (max == b) {
          h = 60 * (r - g) / (max - min) + 240;
      }
      var l = (max + min) / 2;
      var s = void 0;
      if (l == 0 || max == min) {
          s = 0;
      } else if (0 < l && l <= 0.5) {
          s = (max - min) / (max + min);
      } else if (0.5 < l && l < 1) {
          s = (max - min) / (2 - (max + min));
      }
      return { h: h, s: s, l: l };
  };

  var rgb2hex = function rgb2hex(r, g, b) {
      return '#' + [r, g, b].map(function (x) {
          return padLeft(x.toString(16), '0', 2).toUpperCase();
      }).join('');
  };

  var hex2rgb = function hex2rgb(hex) {
      var _$exec$slice$map = /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/gi.exec(hex).slice(1).map(function (x) {
          return parseInt(x, 16);
      }),
          _$exec$slice$map2 = slicedToArray(_$exec$slice$map, 3),
          r = _$exec$slice$map2[0],
          g = _$exec$slice$map2[1],
          b = _$exec$slice$map2[2];

      return { r: r, g: g, b: b };
  };

  var int2hex = function int2hex(n) {
      return '#' + padLeft(n.toString(16).toUpperCase(), '0', 6);
  };

  var hex2int = function hex2int(hex) {
      var _$exec$slice = /^#([0-9a-f]+)$/gi.exec(hex).slice(1),
          _$exec$slice2 = slicedToArray(_$exec$slice, 1),
          h = _$exec$slice2[0];

      return parseInt(h, 16);
  };

  /* src\Slider\HSlider.html generated by Svelte v2.15.3 */

  var TIMEOUT = 70;
  function hasTooltip(_ref) {
  	var tooltip = _ref.tooltip;

  	switch (typeof tooltip === 'undefined' ? 'undefined' : _typeof(tooltip)) {
  		case 'boolean':
  			return tooltip;
  		case 'string':
  			return tooltip.toLowerCase() === 'true';
  		default:
  			return false;
  	}
  }

  function data() {
  	return {
  		min: 0,
  		max: 0,
  		value: 0,
  		step: 0,
  		tooltip: false
  	};
  }
  var methods = {
  	click: function click(e) {
  		e.stopPropagation();

  		var _get = this.get(),
  		    min = _get.min,
  		    max = _get.max;

  		var a = parseFloat(min);
  		var z = parseFloat(max);

  		var _refs$slider$getBound = this.refs.slider.getBoundingClientRect(),
  		    left = _refs$slider$getBound.left;

  		var _refs$tick$getBoundin = this.refs.tick.getBoundingClientRect(),
  		    width = _refs$tick$getBoundin.width;

  		var d = (e.clientX - width / 2 - left) * this._ratio;
  		var value = d;
  		if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  			this.set({ value: value });
  		}
  	},
  	start: function start(e) {
  		e.stopPropagation();
  		this._moving = true;

  		var _get2 = this.get(),
  		    value = _get2.value,
  		    hasTooltip = _get2.hasTooltip;

  		this._startX = e.clientX;
  		this._start = parseFloat(value);
  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'block';
  		}
  	},
  	move: function move(e) {
  		var _this = this;

  		if (this._moving) {
  			setTimeout(function () {
  				e.stopPropagation();
  				document.body.style.cursor = 'pointer';

  				var _get3 = _this.get(),
  				    min = _get3.min,
  				    max = _get3.max,
  				    step = _get3.step;

  				var a = parseFloat(min);
  				var z = parseFloat(max);
  				var s = parseFloat(step);
  				var d = (e.clientX - _this._startX) * _this._ratio;
  				if (s > 0) {
  					d = Math.floor(d / s) * s;
  				}
  				var value = _this._start + d;
  				if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  					_this.set({ value: value });
  				}
  			}, TIMEOUT);
  		}
  	},
  	stop: function stop(e) {
  		this._moving = false;
  		document.body.style.cursor = 'initial';

  		var _get4 = this.get(),
  		    hasTooltip = _get4.hasTooltip;

  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'none';
  		}
  	},
  	_getRatio: function _getRatio(min, max) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		if (!isNaN(a) && !isNaN(z)) {
  			var _refs$bar$getBounding = this.refs.bar.getBoundingClientRect(),
  			    width = _refs$bar$getBounding.width;

  			return (z - a) / width;
  		} else {
  			return NaN;
  		}
  	},
  	_updateDom: function _updateDom(min, max, value, ratio) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		var v = parseFloat(value);
  		if (!isNaN(a) && !isNaN(z) && !isNaN(v) && a <= v && v <= z) {
  			this.refs.tick.style.left = Math.round(v / ratio) + 'px';
  		}
  	}
  };

  function oncreate() {
  	var _get5 = this.get(),
  	    min = _get5.min,
  	    max = _get5.max;

  	this._ratio = this._getRatio(min, max);
  }
  function onupdate(_ref2) {
  	var changed = _ref2.changed,
  	    current = _ref2.current,
  	    previous = _ref2.previous;

  	if (changed.value) {
  		var value = parseFloat(current.value);
  		if (!isNaN(value)) {
  			var _get6 = this.get(),
  			    min = _get6.min,
  			    max = _get6.max;

  			this._updateDom(min, max, value, this._ratio);
  		}
  	}
  }
  var file = "src\\Slider\\HSlider.html";

  function create_main_fragment(component, ctx) {
  	var div2,
  	    slot_content_default = component._slotted.default,
  	    slot_content_default_after,
  	    text,
  	    div1,
  	    div0,
  	    current;

  	function onwindowmouseup(event) {
  		component.stop(event);	}
  	window.addEventListener("mouseup", onwindowmouseup);

  	function onwindowmousemove(event) {
  		component.move(event);	}
  	window.addEventListener("mousemove", onwindowmousemove);

  	var if_block = ctx.hasTooltip && create_if_block(component, ctx);

  	function mousedown_handler(event) {
  		component.start(event);
  	}

  	function click_handler(event) {
  		component.click(event);
  	}

  	return {
  		c: function create() {
  			div2 = createElement("div");
  			text = createText("\r\n    ");
  			div1 = createElement("div");
  			div0 = createElement("div");
  			if (if_block) if_block.c();
  			addListener(div0, "mousedown", mousedown_handler);
  			div0.className = "hslider-tick";
  			addLoc(div0, file, 4, 8, 198);
  			addListener(div1, "click", click_handler);
  			div1.className = "hslider-bar";
  			addLoc(div1, file, 3, 4, 131);
  			div2.className = "hslider";
  			addLoc(div2, file, 1, 0, 70);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div2, anchor);

  			if (slot_content_default) {
  				append(div2, slot_content_default);
  				append(div2, slot_content_default_after || (slot_content_default_after = createComment()));
  			}

  			append(div2, text);
  			append(div2, div1);
  			append(div1, div0);
  			if (if_block) if_block.m(div0, null);
  			component.refs.tick = div0;
  			component.refs.bar = div1;
  			component.refs.slider = div2;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (ctx.hasTooltip) {
  				if (if_block) {
  					if_block.p(changed, ctx);
  				} else {
  					if_block = create_if_block(component, ctx);
  					if_block.c();
  					if_block.m(div0, null);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			window.removeEventListener("mouseup", onwindowmouseup);

  			window.removeEventListener("mousemove", onwindowmousemove);

  			if (detach) {
  				detachNode(div2);
  			}

  			if (slot_content_default) {
  				reinsertBefore(slot_content_default_after, slot_content_default);
  			}

  			if (if_block) if_block.d();
  			removeListener(div0, "mousedown", mousedown_handler);
  			if (component.refs.tick === div0) component.refs.tick = null;
  			removeListener(div1, "click", click_handler);
  			if (component.refs.bar === div1) component.refs.bar = null;
  			if (component.refs.slider === div2) component.refs.slider = null;
  		}
  	};
  }

  // (6:12) {#if hasTooltip}
  function create_if_block(component, ctx) {
  	var div,
  	    text_value = ctx.parseFloat(ctx.value).toFixed(),
  	    text;

  	return {
  		c: function create() {
  			div = createElement("div");
  			text = createText(text_value);
  			div.className = "hslider-tooltip";
  			addLoc(div, file, 6, 16, 309);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(div, text);
  			component.refs.tooltip = div;
  		},

  		p: function update(changed, ctx) {
  			if ((changed.parseFloat || changed.value) && text_value !== (text_value = ctx.parseFloat(ctx.value).toFixed())) {
  				setData(text, text_value);
  			}
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.tooltip === div) component.refs.tooltip = null;
  		}
  	};
  }

  function HSlider(options) {
  	var _this2 = this;

  	this._debugName = '<HSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(assign({ parseFloat: parseFloat }, data()), options.data);

  	this._recompute({ tooltip: 1 }, this._state);
  	if (!('tooltip' in this._state)) console.warn("<HSlider> was created without expected data property 'tooltip'");

  	if (!('value' in this._state)) console.warn("<HSlider> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate];

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate.call(_this2);
  		_this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(HSlider.prototype, protoDev);
  assign(HSlider.prototype, methods);

  HSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hasTooltip' in newState && !this._updatingReadonlyProperty) throw new Error("<HSlider>: Cannot set read-only property 'hasTooltip'");
  };

  HSlider.prototype._recompute = function _recompute(changed, state) {
  	if (changed.tooltip) {
  		if (this._differs(state.hasTooltip, state.hasTooltip = hasTooltip(state))) changed.hasTooltip = true;
  	}
  };

  /* src\Slider\VSlider.html generated by Svelte v2.15.3 */

  var TIMEOUT$1 = 70;
  function hasTooltip$1(_ref) {
  	var tooltip = _ref.tooltip;

  	switch (typeof tooltip === 'undefined' ? 'undefined' : _typeof(tooltip)) {
  		case 'boolean':
  			return tooltip;
  		case 'string':
  			return tooltip.toLowerCase() === 'true';
  		default:
  			return false;
  	}
  }

  function data$1() {
  	return {
  		min: 0,
  		max: 0,
  		value: 0,
  		step: 0,
  		tooltip: false
  	};
  }
  var methods$1 = {
  	click: function click(e) {
  		e.stopPropagation();

  		var _get = this.get(),
  		    min = _get.min,
  		    max = _get.max;

  		var a = parseFloat(min);
  		var z = parseFloat(max);

  		var _refs$slider$getBound = this.refs.slider.getBoundingClientRect(),
  		    top = _refs$slider$getBound.top;

  		var d = (e.clientY - top) * this._ratio;
  		var value = d;
  		if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  			this.set({ value: value });
  		}
  	},
  	start: function start(e) {
  		e.stopPropagation();
  		this._moving = true;

  		var _get2 = this.get(),
  		    value = _get2.value,
  		    hasTooltip = _get2.hasTooltip;

  		this._startX = e.clientY;
  		this._start = parseFloat(value);
  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'block';
  		}
  	},
  	move: function move(e) {
  		var _this = this;

  		if (this._moving) {
  			setTimeout(function () {
  				e.stopPropagation();
  				document.body.style.cursor = 'pointer';

  				var _get3 = _this.get(),
  				    min = _get3.min,
  				    max = _get3.max,
  				    step = _get3.step;

  				var a = parseFloat(min);
  				var z = parseFloat(max);
  				var s = parseFloat(step);
  				var d = (e.clientY - _this._startX) * _this._ratio;
  				if (s > 0) {
  					d = Math.floor(d / s) * s;
  				}
  				var value = _this._start + d;
  				if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  					_this.set({ value: value });
  				}
  			}, TIMEOUT$1);
  		}
  	},
  	stop: function stop(e) {
  		e.stopPropagation();
  		this._moving = false;

  		var _get4 = this.get(),
  		    hasTooltip = _get4.hasTooltip;

  		document.body.style.cursor = 'initial';
  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'none';
  		}
  	},
  	_getRatio: function _getRatio(min, max) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		if (!isNaN(a) && !isNaN(z)) {
  			var _refs$bar$getBounding = this.refs.bar.getBoundingClientRect(),
  			    height = _refs$bar$getBounding.height;

  			return (z - a) / height;
  		} else {
  			return NaN;
  		}
  	},
  	_updateDom: function _updateDom(min, max, value, ratio) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		var v = parseFloat(value);
  		if (!isNaN(a) && !isNaN(z) && !isNaN(v) && a <= v && v <= z) {
  			this.refs.tick.style.top = v / ratio + 'px';
  		}
  	}
  };

  function oncreate$1() {
  	var _get5 = this.get(),
  	    min = _get5.min,
  	    max = _get5.max;

  	this._ratio = this._getRatio(min, max);
  }
  function onupdate$1(_ref2) {
  	var changed = _ref2.changed,
  	    current = _ref2.current,
  	    previous = _ref2.previous;

  	if (changed.value) {
  		var value = parseFloat(current.value);
  		if (!isNaN(value)) {
  			var _get6 = this.get(),
  			    min = _get6.min,
  			    max = _get6.max;

  			this._updateDom(min, max, value, this._ratio);
  		}
  	}
  }
  var file$1 = "src\\Slider\\VSlider.html";

  function create_main_fragment$1(component, ctx) {
  	var div2,
  	    slot_content_default = component._slotted.default,
  	    slot_content_default_after,
  	    text,
  	    div1,
  	    div0,
  	    current;

  	function onwindowmouseup(event) {
  		component.stop(event);	}
  	window.addEventListener("mouseup", onwindowmouseup);

  	function onwindowmousemove(event) {
  		component.move(event);	}
  	window.addEventListener("mousemove", onwindowmousemove);

  	var if_block = ctx.hasTooltip && create_if_block$1(component, ctx);

  	function mousedown_handler(event) {
  		component.start(event);
  	}

  	function click_handler(event) {
  		component.click(event);
  	}

  	return {
  		c: function create() {
  			div2 = createElement("div");
  			text = createText("\r\n    ");
  			div1 = createElement("div");
  			div0 = createElement("div");
  			if (if_block) if_block.c();
  			addListener(div0, "mousedown", mousedown_handler);
  			div0.className = "vslider-tick";
  			addLoc(div0, file$1, 4, 8, 222);
  			addListener(div1, "click", click_handler);
  			div1.className = "vslider-bar";
  			addLoc(div1, file$1, 3, 4, 135);
  			div2.className = "vslider";
  			addLoc(div2, file$1, 1, 0, 70);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div2, anchor);

  			if (slot_content_default) {
  				append(div2, slot_content_default);
  				append(div2, slot_content_default_after || (slot_content_default_after = createComment()));
  			}

  			append(div2, text);
  			append(div2, div1);
  			append(div1, div0);
  			if (if_block) if_block.m(div0, null);
  			component.refs.tick = div0;
  			component.refs.bar = div1;
  			component.refs.slider = div2;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (ctx.hasTooltip) {
  				if (if_block) {
  					if_block.p(changed, ctx);
  				} else {
  					if_block = create_if_block$1(component, ctx);
  					if_block.c();
  					if_block.m(div0, null);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			window.removeEventListener("mouseup", onwindowmouseup);

  			window.removeEventListener("mousemove", onwindowmousemove);

  			if (detach) {
  				detachNode(div2);
  			}

  			if (slot_content_default) {
  				reinsertBefore(slot_content_default_after, slot_content_default);
  			}

  			if (if_block) if_block.d();
  			removeListener(div0, "mousedown", mousedown_handler);
  			if (component.refs.tick === div0) component.refs.tick = null;
  			removeListener(div1, "click", click_handler);
  			if (component.refs.bar === div1) component.refs.bar = null;
  			if (component.refs.slider === div2) component.refs.slider = null;
  		}
  	};
  }

  // (6:12) {#if hasTooltip}
  function create_if_block$1(component, ctx) {
  	var div,
  	    text_value = ctx.parseFloat(ctx.value).toFixed(),
  	    text;

  	return {
  		c: function create() {
  			div = createElement("div");
  			text = createText(text_value);
  			div.className = "vslider-tooltip";
  			addLoc(div, file$1, 6, 16, 333);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(div, text);
  			component.refs.tooltip = div;
  		},

  		p: function update(changed, ctx) {
  			if ((changed.parseFloat || changed.value) && text_value !== (text_value = ctx.parseFloat(ctx.value).toFixed())) {
  				setData(text, text_value);
  			}
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.tooltip === div) component.refs.tooltip = null;
  		}
  	};
  }

  function VSlider(options) {
  	var _this2 = this;

  	this._debugName = '<VSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(assign({ parseFloat: parseFloat }, data$1()), options.data);

  	this._recompute({ tooltip: 1 }, this._state);
  	if (!('tooltip' in this._state)) console.warn("<VSlider> was created without expected data property 'tooltip'");

  	if (!('value' in this._state)) console.warn("<VSlider> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$1];

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$1(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate$1.call(_this2);
  		_this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(VSlider.prototype, protoDev);
  assign(VSlider.prototype, methods$1);

  VSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hasTooltip' in newState && !this._updatingReadonlyProperty) throw new Error("<VSlider>: Cannot set read-only property 'hasTooltip'");
  };

  VSlider.prototype._recompute = function _recompute(changed, state) {
  	if (changed.tooltip) {
  		if (this._differs(state.hasTooltip, state.hasTooltip = hasTooltip$1(state))) changed.hasTooltip = true;
  	}
  };

  /* src\Slider\Slider.html generated by Svelte v2.15.3 */

  function data$2() {
  	return { HSlider: HSlider, VSlider: VSlider };
  }
  function create_main_fragment$2(component, ctx) {
  	var slot_content_default = component._slotted.default,
  	    switch_instance_updating = {},
  	    switch_instance_anchor,
  	    current;

  	var switch_value = ctx.orientation === 'horizontal' ? ctx.HSlider : ctx.VSlider;

  	function switch_props(ctx) {
  		var switch_instance_initial_data = {};
  		if (ctx.min !== void 0) {
  			switch_instance_initial_data.min = ctx.min;
  			switch_instance_updating.min = true;
  		}
  		if (ctx.max !== void 0) {
  			switch_instance_initial_data.max = ctx.max;
  			switch_instance_updating.max = true;
  		}
  		if (ctx.value !== void 0) {
  			switch_instance_initial_data.value = ctx.value;
  			switch_instance_updating.value = true;
  		}
  		if (ctx.step !== void 0) {
  			switch_instance_initial_data.step = ctx.step;
  			switch_instance_updating.step = true;
  		}
  		if (ctx.tooltip !== void 0) {
  			switch_instance_initial_data.tooltip = ctx.tooltip;
  			switch_instance_updating.tooltip = true;
  		}
  		return {
  			root: component.root,
  			store: component.store,
  			slots: { default: createFragment() },
  			data: switch_instance_initial_data,
  			_bind: function _bind(changed, childState) {
  				var newState = {};
  				if (!switch_instance_updating.min && changed.min) {
  					newState.min = childState.min;
  				}

  				if (!switch_instance_updating.max && changed.max) {
  					newState.max = childState.max;
  				}

  				if (!switch_instance_updating.value && changed.value) {
  					newState.value = childState.value;
  				}

  				if (!switch_instance_updating.step && changed.step) {
  					newState.step = childState.step;
  				}

  				if (!switch_instance_updating.tooltip && changed.tooltip) {
  					newState.tooltip = childState.tooltip;
  				}
  				component._set(newState);
  				switch_instance_updating = {};
  			}
  		};
  	}

  	if (switch_value) {
  		var switch_instance = new switch_value(switch_props(ctx));

  		component.root._beforecreate.push(function () {
  			switch_instance._bind({ min: 1, max: 1, value: 1, step: 1, tooltip: 1 }, switch_instance.get());
  		});
  	}

  	return {
  		c: function create() {
  			if (switch_instance) switch_instance._fragment.c();
  			switch_instance_anchor = createComment();
  		},

  		m: function mount(target, anchor) {
  			if (slot_content_default) {
  				append(switch_instance._slotted.default, slot_content_default);
  			}

  			if (switch_instance) {
  				switch_instance._mount(target, anchor);
  			}

  			insert(target, switch_instance_anchor, anchor);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var switch_instance_changes = {};
  			if (!switch_instance_updating.min && changed.min) {
  				switch_instance_changes.min = ctx.min;
  				switch_instance_updating.min = ctx.min !== void 0;
  			}
  			if (!switch_instance_updating.max && changed.max) {
  				switch_instance_changes.max = ctx.max;
  				switch_instance_updating.max = ctx.max !== void 0;
  			}
  			if (!switch_instance_updating.value && changed.value) {
  				switch_instance_changes.value = ctx.value;
  				switch_instance_updating.value = ctx.value !== void 0;
  			}
  			if (!switch_instance_updating.step && changed.step) {
  				switch_instance_changes.step = ctx.step;
  				switch_instance_updating.step = ctx.step !== void 0;
  			}
  			if (!switch_instance_updating.tooltip && changed.tooltip) {
  				switch_instance_changes.tooltip = ctx.tooltip;
  				switch_instance_updating.tooltip = ctx.tooltip !== void 0;
  			}

  			if (switch_value !== (switch_value = ctx.orientation === 'horizontal' ? ctx.HSlider : ctx.VSlider)) {
  				if (switch_instance) {
  					var old_component = switch_instance;
  					old_component._fragment.o(function () {
  						old_component.destroy();
  					});
  				}

  				if (switch_value) {
  					switch_instance = new switch_value(switch_props(ctx));

  					component.root._beforecreate.push(function () {
  						var changed = {};
  						if (ctx.min === void 0) changed.min = 1;
  						if (ctx.max === void 0) changed.max = 1;
  						if (ctx.value === void 0) changed.value = 1;
  						if (ctx.step === void 0) changed.step = 1;
  						if (ctx.tooltip === void 0) changed.tooltip = 1;
  						switch_instance._bind(changed, switch_instance.get());
  					});
  					switch_instance._fragment.c();

  					slot.m(switch_instance._slotted.default, null);
  					switch_instance._mount(switch_instance_anchor.parentNode, switch_instance_anchor);
  				} else {
  					switch_instance = null;
  				}
  			} else if (switch_value) {
  				switch_instance._set(switch_instance_changes);
  				switch_instance_updating = {};
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (switch_instance) switch_instance._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (slot_content_default) {
  				reinsertChildren(switch_instance._slotted.default, slot_content_default);
  			}

  			if (detach) {
  				detachNode(switch_instance_anchor);
  			}

  			if (switch_instance) switch_instance.destroy(detach);
  		}
  	};
  }

  function Slider(options) {
  	this._debugName = '<Slider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$2(), options.data);
  	if (!('orientation' in this._state)) console.warn("<Slider> was created without expected data property 'orientation'");
  	if (!('HSlider' in this._state)) console.warn("<Slider> was created without expected data property 'HSlider'");
  	if (!('VSlider' in this._state)) console.warn("<Slider> was created without expected data property 'VSlider'");
  	if (!('min' in this._state)) console.warn("<Slider> was created without expected data property 'min'");
  	if (!('max' in this._state)) console.warn("<Slider> was created without expected data property 'max'");
  	if (!('value' in this._state)) console.warn("<Slider> was created without expected data property 'value'");
  	if (!('step' in this._state)) console.warn("<Slider> was created without expected data property 'step'");
  	if (!('tooltip' in this._state)) console.warn("<Slider> was created without expected data property 'tooltip'");
  	this._intro = !!options.intro;

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$2(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(Slider.prototype, protoDev);

  Slider.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\AlphaSlider\AlphaSlider.html generated by Svelte v2.15.3 */

  function data$3() {
  	return {
  		order: 'asc',
  		alpha: 100,
  		hue: 0,
  		saturation: 1.0,
  		lightness: 0.5
  	};
  }
  var methods$2 = {};

  function onupdate$2(_ref) {
  	var changed = _ref.changed,
  	    current = _ref.current,
  	    previous = _ref.previous;

  	if (changed.hue || changed.saturation || changed.lightness) {
  		var _hsl2rgb = hsl2rgb(current.hue, current.saturation, current.lightness),
  		    r = _hsl2rgb.r,
  		    g = _hsl2rgb.g,
  		    b = _hsl2rgb.b;

  		var ctx = this.refs.alpha.getContext('2d');
  		var imgData = ctx.getImageData(0, 0, this.refs.alpha.width, this.refs.alpha.height);
  		var _data = imgData.data,
  		    width = imgData.width,
  		    height = imgData.height;

  		for (var i = 0, j = 0, k = 0; i < _data.length; i += 4, ++j) {
  			if (j >= width) {
  				++k;
  				j = 0;
  			}
  			var a = k / height;

  			var _get = this.get(),
  			    order = _get.order;

  			a = order === 'desc' ? 1.0 - a : a;
  			_data[i + 0] = r;
  			_data[i + 1] = g;
  			_data[i + 2] = b;
  			_data[i + 3] = Math.round(255 * a);
  		}
  		ctx.putImageData(imgData, 0, 0);
  	}
  }
  var file$3 = "src\\AlphaSlider\\AlphaSlider.html";

  function create_main_fragment$3(component, ctx) {
  	var div,
  	    canvas,
  	    slider_updating = {},
  	    current;

  	var slider_initial_data = {
  		orientation: "vertical",
  		tooltip: "true",
  		min: "0",
  		max: "100",
  		high: "0",
  		step: "0"
  	};
  	if (ctx.alpha !== void 0) {
  		slider_initial_data.value = ctx.alpha;
  		slider_updating.value = true;
  	}
  	var slider = new Slider({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: slider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!slider_updating.value && changed.value) {
  				newState.alpha = childState.value;
  			}
  			component._set(newState);
  			slider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		slider._bind({ value: 1 }, slider.get());
  	});

  	component.refs.slider = slider;

  	return {
  		c: function create() {
  			div = createElement("div");
  			canvas = createElement("canvas");
  			slider._fragment.c();
  			addLoc(canvas, file$3, 2, 8, 154);
  			div.className = "alpha-slider";
  			addLoc(div, file$3, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(slider._slotted.default, canvas);
  			component.refs.alpha = canvas;
  			slider._mount(div, null);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var slider_changes = {};
  			if (!slider_updating.value && changed.alpha) {
  				slider_changes.value = ctx.alpha;
  				slider_updating.value = ctx.alpha !== void 0;
  			}
  			slider._set(slider_changes);
  			slider_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (slider) slider._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.alpha === canvas) component.refs.alpha = null;
  			slider.destroy();
  			if (component.refs.slider === slider) component.refs.slider = null;
  		}
  	};
  }

  function AlphaSlider(options) {
  	var _this = this;

  	this._debugName = '<AlphaSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$3(), options.data);
  	if (!('alpha' in this._state)) console.warn("<AlphaSlider> was created without expected data property 'alpha'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$2];

  	this._fragment = create_main_fragment$3(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(AlphaSlider.prototype, protoDev);
  assign(AlphaSlider.prototype, methods$2);

  AlphaSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\ColorArea\ColorArea.html generated by Svelte v2.15.3 */

  var TIMEOUT$2 = 70;
  function data$4() {
      return {
          hue: 0,
          saturation: 1.0,
          lightness: 0.5
      };
  }
  var methods$3 = {
      click: function click(e) {
          e.stopPropagation();

          var _refs$canvas$getBound = this.refs.canvas.getBoundingClientRect(),
              left = _refs$canvas$getBound.left,
              top = _refs$canvas$getBound.top;

          var x = e.clientX - left;
          var y = e.clientY - top;
          var saturation = 1 - x / this._width;
          var lightness = 1 - y / this._height;
          this.set({ saturation: saturation, lightness: lightness });
      },
      start: function start(e) {
          e.stopPropagation();
          this._offsetX = e.offsetX;
          this._offsetY = e.offsetY;
          this._moving = true;
      },
      move: function move(e) {
          if (this._moving) {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';

              var _refs$canvas$getBound2 = this.refs.canvas.getBoundingClientRect(),
                  left = _refs$canvas$getBound2.left,
                  top = _refs$canvas$getBound2.top;
              // handle x


              var x = e.clientX - this._offsetX + this._halfWidth - left;
              if (x < 0) {
                  x = 0;
              } else if (x > this._width) {
                  x = this._width;
              }
              // handle y
              var y = e.clientY - this._offsetY + this._halfHeight - top;
              if (y < 0) {
                  y = 0;
              } else if (y > this._height) {
                  y = this._height;
              }
              var saturation = 1 - x / this._width;
              var lightness = 1 - y / this._height;

              this.set({ saturation: saturation, lightness: lightness });
          }
      },
      stop: function stop(e) {
          if (this._moving) {
              e.stopPropagation();
              document.body.style.cursor = 'initial';
              this._offsetX = 0;
              this._offsetY = 0;
              this._moving = false;
          }
      }
  };

  function oncreate$2() {
      var samplerRect = this.refs.sampler.getBoundingClientRect();
      this._halfWidth = samplerRect.width / 2;
      this._halfHeight = samplerRect.height / 2;
      this._width = this.refs.canvas.clientWidth;
      this._height = this.refs.canvas.clientHeight;
      this._moving = false;
      this._offsetX = 0;
      this._offsetY = 0;
  }
  function onupdate$3(_ref) {
      var _this = this;

      var changed = _ref.changed,
          current = _ref.current,
          previous = _ref.previous;

      setTimeout(function () {
          if (changed.saturation) {
              var s = current.saturation;
              _this.refs.sampler.style.left = Math.round((1 - s) * _this._width) + 'px';
          }
          if (changed.lightness) {
              var l = current.lightness;
              _this.refs.sampler.style.top = Math.round((1 - l) * _this._height) + 'px';

              var _hsl2rgb = hsl2rgb(0, 0, 1 - l),
                  r = _hsl2rgb.r,
                  g = _hsl2rgb.g,
                  b = _hsl2rgb.b;

              _this.refs.sampler.style.borderColor = 'rgb(' + [r, g, b].join(',') + ')';
          }
          if (changed.hue) {
              var _get = _this.get(),
                  saturation = _get.saturation,
                  lightness = _get.lightness;
              var h = current.hue;
              var ctx = _this.refs.canvas.getContext('2d');
              var imgData = ctx.getImageData(0, 0, _this.refs.canvas.width, _this.refs.canvas.height);
              var _data = imgData.data,
                  width = imgData.width,
                  height = imgData.height;
              // let buff = new ArrayBuffer(width * height * 4);
              // let data = new DataView(buff);                    

              var k = 0;
              // let data = new Uint8ClampedArray(width * height * 4);
              // let data = new Uint8Array(width * height * 4);
              // let data = imgData.data;
              for (var i = height - 1; i >= 0; --i) {
                  for (var j = width - 1; j >= 0; --j) {
                      var _s2 = j / width;
                      var _l2 = i / height;

                      var _hsl2rgb2 = hsl2rgb(h, _s2, _l2),
                          _r = _hsl2rgb2.r,
                          _g = _hsl2rgb2.g,
                          _b = _hsl2rgb2.b;

                      _data[k + 0] = _r;
                      _data[k + 1] = _g;
                      _data[k + 2] = _b;
                      _data[k + 3] = 255;
                      // data.setUint8(k + 0, r);
                      // data.setUint8(k + 1, g);
                      // data.setUint8(k + 2, b);
                      // data.setUint8(k + 3, Math.round (a * 255));
                      k += 4;
                  }
              }
              // imgData.data.set(data);
              ctx.putImageData(imgData, 0, 0);
          }
      }, TIMEOUT$2);
  }
  var file$4 = "src\\ColorArea\\ColorArea.html";

  function create_main_fragment$4(component, ctx) {
      var div1, canvas, text, div0, current;

      function onwindowmousemove(event) {
          component.move(event);    }
      window.addEventListener("mousemove", onwindowmousemove);

      function onwindowmouseup(event) {
          component.stop(event);    }
      window.addEventListener("mouseup", onwindowmouseup);

      function click_handler(event) {
          component.click(event);
      }

      function mousedown_handler(event) {
          component.start(event);
      }

      return {
          c: function create() {
              div1 = createElement("div");
              canvas = createElement("canvas");
              text = createText("\r\n    ");
              div0 = createElement("div");
              addListener(canvas, "click", click_handler);
              addLoc(canvas, file$4, 2, 4, 119);
              addListener(div0, "mousedown", mousedown_handler);
              div0.className = "sampler";
              addLoc(div0, file$4, 3, 4, 177);
              div1.className = "color-area";
              addLoc(div1, file$4, 1, 0, 71);
          },

          m: function mount(target, anchor) {
              insert(target, div1, anchor);
              append(div1, canvas);
              component.refs.canvas = canvas;
              append(div1, text);
              append(div1, div0);
              component.refs.sampler = div0;
              component.refs.container = div1;
              current = true;
          },

          p: noop,

          i: function intro(target, anchor) {
              if (current) return;

              this.m(target, anchor);
          },

          o: run,

          d: function destroy$$1(detach) {
              window.removeEventListener("mousemove", onwindowmousemove);

              window.removeEventListener("mouseup", onwindowmouseup);

              if (detach) {
                  detachNode(div1);
              }

              removeListener(canvas, "click", click_handler);
              if (component.refs.canvas === canvas) component.refs.canvas = null;
              removeListener(div0, "mousedown", mousedown_handler);
              if (component.refs.sampler === div0) component.refs.sampler = null;
              if (component.refs.container === div1) component.refs.container = null;
          }
      };
  }

  function ColorArea(options) {
      var _this2 = this;

      this._debugName = '<ColorArea>';
      if (!options || !options.target && !options.root) {
          throw new Error("'target' is a required option");
      }

      init(this, options);
      this.refs = {};
      this._state = assign(data$4(), options.data);
      this._intro = !!options.intro;
      this._handlers.update = [onupdate$3];

      this._fragment = create_main_fragment$4(this, this._state);

      this.root._oncreate.push(function () {
          oncreate$2.call(_this2);
          _this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
      });

      if (options.target) {
          if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
          this._fragment.c();
          this._mount(options.target, options.anchor);

          flush(this);
      }

      this._intro = true;
  }

  assign(ColorArea.prototype, protoDev);
  assign(ColorArea.prototype, methods$3);

  ColorArea.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\ColorSlider\ColorSlider.html generated by Svelte v2.15.3 */

  function data$5() {
  	return { hue: 0 };
  }
  function onupdate$4() {
  	var ctx = this.refs.color.getContext('2d');
  	var imgData = ctx.createImageData(this.refs.color.width, this.refs.color.height);
  	var data = imgData.data,
  	    width = imgData.width;

  	for (var i = 0; i < data.length; i += 4) {
  		var h = i / 4 % width * 360 / width;

  		var _hsl2rgb = hsl2rgb(h, this.constructor.SATURATION, this.constructor.LIGHTNESS),
  		    r = _hsl2rgb.r,
  		    g = _hsl2rgb.g,
  		    b = _hsl2rgb.b;

  		data[i + 0] = r;
  		data[i + 1] = g;
  		data[i + 2] = b;
  		data[i + 3] = this.constructor.ALPHA;
  	}
  	ctx.putImageData(imgData, 0, 0);
  }
  function setup(Component) {
  	Component.SATURATION = 1.0;
  	Component.LIGHTNESS = 0.5;
  	Component.ALPHA = 255;
  }
  var file$5 = "src\\ColorSlider\\ColorSlider.html";

  function create_main_fragment$5(component, ctx) {
  	var div,
  	    canvas,
  	    slider_updating = {},
  	    current;

  	var slider_initial_data = {
  		orientation: "horizontal",
  		tooltip: "false",
  		min: "0",
  		max: "360",
  		high: "0",
  		step: "0"
  	};
  	if (ctx.hue !== void 0) {
  		slider_initial_data.value = ctx.hue;
  		slider_updating.value = true;
  	}
  	var slider = new Slider({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: slider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!slider_updating.value && changed.value) {
  				newState.hue = childState.value;
  			}
  			component._set(newState);
  			slider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		slider._bind({ value: 1 }, slider.get());
  	});

  	component.refs.slider = slider;

  	return {
  		c: function create() {
  			div = createElement("div");
  			canvas = createElement("canvas");
  			slider._fragment.c();
  			addLoc(canvas, file$5, 2, 8, 155);
  			div.className = "color-slider";
  			addLoc(div, file$5, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(slider._slotted.default, canvas);
  			component.refs.color = canvas;
  			slider._mount(div, null);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var slider_changes = {};
  			if (!slider_updating.value && changed.hue) {
  				slider_changes.value = ctx.hue;
  				slider_updating.value = ctx.hue !== void 0;
  			}
  			slider._set(slider_changes);
  			slider_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (slider) slider._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.color === canvas) component.refs.color = null;
  			slider.destroy();
  			if (component.refs.slider === slider) component.refs.slider = null;
  		}
  	};
  }

  function ColorSlider(options) {
  	var _this = this;

  	this._debugName = '<ColorSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$5(), options.data);
  	if (!('hue' in this._state)) console.warn("<ColorSlider> was created without expected data property 'hue'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$4];

  	this._fragment = create_main_fragment$5(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(ColorSlider.prototype, protoDev);

  ColorSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  setup(ColorSlider);

  /* src\ColorPicker\ColorPicker.html generated by Svelte v2.15.3 */

  function value(_ref) {
  	var mode = _ref.mode,
  	    hex = _ref.hex,
  	    rgb = _ref.rgb;

  	return mode === 'hex' ? hex : rgb;
  }

  function hex(_ref2) {
  	var hue = _ref2.hue,
  	    saturation = _ref2.saturation,
  	    lightness = _ref2.lightness;

  	var _hsl2rgb = hsl2rgb(hue, saturation, lightness),
  	    r = _hsl2rgb.r,
  	    g = _hsl2rgb.g,
  	    b = _hsl2rgb.b;

  	return rgb2hex(r, g, b);
  }

  function rgb(_ref3) {
  	var hue = _ref3.hue,
  	    saturation = _ref3.saturation,
  	    lightness = _ref3.lightness;

  	var _hsl2rgb2 = hsl2rgb(hue, saturation, lightness),
  	    r = _hsl2rgb2.r,
  	    g = _hsl2rgb2.g,
  	    b = _hsl2rgb2.b;

  	return [r, g, b].join(',');
  }

  function rgba(_ref4) {
  	var hue = _ref4.hue,
  	    saturation = _ref4.saturation,
  	    lightness = _ref4.lightness,
  	    alpha = _ref4.alpha;

  	var _hsl2rgb3 = hsl2rgb(hue, saturation, lightness),
  	    r = _hsl2rgb3.r,
  	    g = _hsl2rgb3.g,
  	    b = _hsl2rgb3.b;

  	var a = alpha / 100;
  	return 'rgba(' + [r, g, b, a].join(',') + ')';
  }

  function data$6() {
  	return {
  		mode: 'hex',
  		alpha: 100,
  		hue: 0,
  		saturation: 1.0,
  		lightness: 0.5
  	};
  }
  var methods$4 = {
  	prevent: function prevent(e) {
  		e.stopPropagation();
  		e.preventDefault();
  	},
  	change: function change(_ref5) {
  		var value = _ref5.target.value;

  		var _get = this.get(),
  		    mode = _get.mode;

  		var _r$g$b = { r: 0, g: 0, b: 0 },
  		    r = _r$g$b.r,
  		    g = _r$g$b.g,
  		    b = _r$g$b.b;

  		if (mode === 'hex') {
  			var _hex2rgb = hex2rgb(value),
  			    r = _hex2rgb.r,
  			    g = _hex2rgb.g,
  			    b = _hex2rgb.b;
  		} else if (mode === 'rgb') {
  			var _value$split$map = value.split(',').map(function (x) {
  				return parseInt(x, 10);
  			}),
  			    _value$split$map2 = slicedToArray(_value$split$map, 3),
  			    r = _value$split$map2[0],
  			    g = _value$split$map2[1],
  			    b = _value$split$map2[2];
  		}

  		var _rgb2hsl = rgb2hsl(r, g, b),
  		    h = _rgb2hsl.h,
  		    s = _rgb2hsl.s,
  		    l = _rgb2hsl.l;

  		this.set({ hue: h, saturation: s, lightness: l });
  	},
  	keydown: function keydown(e) {
  		if (e.keyCode === 13) {
  			this.change(this.refs.box.value);
  		}
  	}
  };

  function onupdate$5(_ref6) {
  	var changed = _ref6.changed,
  	    current = _ref6.current;

  	if (changed.rgba) {
  		this.refs.sample.style.backgroundColor = current.rgba;
  	}
  	if (changed.value) {
  		this.refs.box.value = current.value;
  	}
  }
  var file$6 = "src\\ColorPicker\\ColorPicker.html";

  function create_main_fragment$6(component, ctx) {
  	var table,
  	    tr0,
  	    td0,
  	    span0,
  	    text0,
  	    td1,
  	    span1,
  	    text1,
  	    text2,
  	    input,
  	    text3,
  	    td2,
  	    span2,
  	    text4,
  	    td3,
  	    text5,
  	    tr1,
  	    td4,
  	    colorarea_updating = {},
  	    text6,
  	    td5,
  	    alphaslider_updating = {},
  	    text7,
  	    tr2,
  	    td6,
  	    colorslider_updating = {},
  	    text8,
  	    td7,
  	    current;

  	function change_handler(event) {
  		component.change(event);
  	}

  	function click_handler(event) {
  		component.set({ mode: ctx.mode === 'hex' ? 'rgb' : 'hex' });
  	}

  	var colorarea_initial_data = {};
  	if (ctx.hue !== void 0) {
  		colorarea_initial_data.hue = ctx.hue;
  		colorarea_updating.hue = true;
  	}
  	if (ctx.saturation !== void 0) {
  		colorarea_initial_data.saturation = ctx.saturation;
  		colorarea_updating.saturation = true;
  	}
  	if (ctx.lightness !== void 0) {
  		colorarea_initial_data.lightness = ctx.lightness;
  		colorarea_updating.lightness = true;
  	}
  	var colorarea = new ColorArea({
  		root: component.root,
  		store: component.store,
  		data: colorarea_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!colorarea_updating.hue && changed.hue) {
  				newState.hue = childState.hue;
  			}

  			if (!colorarea_updating.saturation && changed.saturation) {
  				newState.saturation = childState.saturation;
  			}

  			if (!colorarea_updating.lightness && changed.lightness) {
  				newState.lightness = childState.lightness;
  			}
  			component._set(newState);
  			colorarea_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		colorarea._bind({ hue: 1, saturation: 1, lightness: 1 }, colorarea.get());
  	});

  	var alphaslider_initial_data = {};
  	if (ctx.alpha !== void 0) {
  		alphaslider_initial_data.alpha = ctx.alpha;
  		alphaslider_updating.alpha = true;
  	}
  	if (ctx.hue !== void 0) {
  		alphaslider_initial_data.hue = ctx.hue;
  		alphaslider_updating.hue = true;
  	}
  	if (ctx.saturation !== void 0) {
  		alphaslider_initial_data.saturation = ctx.saturation;
  		alphaslider_updating.saturation = true;
  	}
  	if (ctx.lightness !== void 0) {
  		alphaslider_initial_data.lightness = ctx.lightness;
  		alphaslider_updating.lightness = true;
  	}
  	var alphaslider = new AlphaSlider({
  		root: component.root,
  		store: component.store,
  		data: alphaslider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!alphaslider_updating.alpha && changed.alpha) {
  				newState.alpha = childState.alpha;
  			}

  			if (!alphaslider_updating.hue && changed.hue) {
  				newState.hue = childState.hue;
  			}

  			if (!alphaslider_updating.saturation && changed.saturation) {
  				newState.saturation = childState.saturation;
  			}

  			if (!alphaslider_updating.lightness && changed.lightness) {
  				newState.lightness = childState.lightness;
  			}
  			component._set(newState);
  			alphaslider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		alphaslider._bind({ alpha: 1, hue: 1, saturation: 1, lightness: 1 }, alphaslider.get());
  	});

  	var colorslider_initial_data = {};
  	if (ctx.hue !== void 0) {
  		colorslider_initial_data.hue = ctx.hue;
  		colorslider_updating.hue = true;
  	}
  	var colorslider = new ColorSlider({
  		root: component.root,
  		store: component.store,
  		data: colorslider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!colorslider_updating.hue && changed.hue) {
  				newState.hue = childState.hue;
  			}
  			component._set(newState);
  			colorslider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		colorslider._bind({ hue: 1 }, colorslider.get());
  	});

  	function click_handler_1(event) {
  		component.prevent(event);
  	}

  	function dragstart_handler(event) {
  		component.prevent(event);
  	}

  	return {
  		c: function create() {
  			table = createElement("table");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			span0 = createElement("span");
  			text0 = createText("\r\n        ");
  			td1 = createElement("td");
  			span1 = createElement("span");
  			text1 = createText(ctx.mode);
  			text2 = createText("\r\n            ");
  			input = createElement("input");
  			text3 = createText("\r\n        ");
  			td2 = createElement("td");
  			span2 = createElement("span");
  			text4 = createText("\r\n        ");
  			td3 = createElement("td");
  			text5 = createText("\r\n    ");
  			tr1 = createElement("tr");
  			td4 = createElement("td");
  			colorarea._fragment.c();
  			text6 = createText("\r\n        ");
  			td5 = createElement("td");
  			alphaslider._fragment.c();
  			text7 = createText("\r\n    ");
  			tr2 = createElement("tr");
  			td6 = createElement("td");
  			colorslider._fragment.c();
  			text8 = createText("\r\n        ");
  			td7 = createElement("td");
  			span0.className = "color-picker-sample";
  			addLoc(span0, file$6, 3, 12, 126);
  			addLoc(td0, file$6, 2, 8, 108);
  			span1.className = "color-picker-mode";
  			addLoc(span1, file$6, 6, 12, 221);
  			addListener(input, "change", change_handler);
  			setAttribute(input, "type", "text");
  			input.className = "color-picker-box";
  			addLoc(input, file$6, 7, 12, 280);
  			addLoc(td1, file$6, 5, 8, 203);
  			addListener(span2, "click", click_handler);
  			span2.className = "color-picker-box-button";
  			addLoc(span2, file$6, 10, 12, 403);
  			addLoc(td2, file$6, 9, 8, 385);
  			addLoc(td3, file$6, 12, 8, 528);
  			addLoc(tr0, file$6, 1, 4, 94);
  			td4.colSpan = "3";
  			td4.className = "color-area-container";
  			addLoc(td4, file$6, 16, 8, 578);
  			td5.className = "alpha-slider-container";
  			addLoc(td5, file$6, 19, 8, 715);
  			addLoc(tr1, file$6, 15, 4, 564);
  			td6.colSpan = "3";
  			td6.className = "color-slider-container";
  			addLoc(td6, file$6, 24, 8, 876);
  			addLoc(td7, file$6, 27, 8, 986);
  			addLoc(tr2, file$6, 23, 4, 862);
  			addListener(table, "click", click_handler_1);
  			addListener(table, "dragstart", dragstart_handler);
  			table.className = "color-picker";
  			addLoc(table, file$6, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, table, anchor);
  			append(table, tr0);
  			append(tr0, td0);
  			append(td0, span0);
  			component.refs.sample = span0;
  			append(tr0, text0);
  			append(tr0, td1);
  			append(td1, span1);
  			append(span1, text1);
  			append(td1, text2);
  			append(td1, input);
  			component.refs.box = input;
  			append(tr0, text3);
  			append(tr0, td2);
  			append(td2, span2);
  			append(tr0, text4);
  			append(tr0, td3);
  			append(table, text5);
  			append(table, tr1);
  			append(tr1, td4);
  			colorarea._mount(td4, null);
  			append(tr1, text6);
  			append(tr1, td5);
  			alphaslider._mount(td5, null);
  			append(table, text7);
  			append(table, tr2);
  			append(tr2, td6);
  			colorslider._mount(td6, null);
  			append(tr2, text8);
  			append(tr2, td7);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			if (!current || changed.mode) {
  				setData(text1, ctx.mode);
  			}

  			var colorarea_changes = {};
  			if (!colorarea_updating.hue && changed.hue) {
  				colorarea_changes.hue = ctx.hue;
  				colorarea_updating.hue = ctx.hue !== void 0;
  			}
  			if (!colorarea_updating.saturation && changed.saturation) {
  				colorarea_changes.saturation = ctx.saturation;
  				colorarea_updating.saturation = ctx.saturation !== void 0;
  			}
  			if (!colorarea_updating.lightness && changed.lightness) {
  				colorarea_changes.lightness = ctx.lightness;
  				colorarea_updating.lightness = ctx.lightness !== void 0;
  			}
  			colorarea._set(colorarea_changes);
  			colorarea_updating = {};

  			var alphaslider_changes = {};
  			if (!alphaslider_updating.alpha && changed.alpha) {
  				alphaslider_changes.alpha = ctx.alpha;
  				alphaslider_updating.alpha = ctx.alpha !== void 0;
  			}
  			if (!alphaslider_updating.hue && changed.hue) {
  				alphaslider_changes.hue = ctx.hue;
  				alphaslider_updating.hue = ctx.hue !== void 0;
  			}
  			if (!alphaslider_updating.saturation && changed.saturation) {
  				alphaslider_changes.saturation = ctx.saturation;
  				alphaslider_updating.saturation = ctx.saturation !== void 0;
  			}
  			if (!alphaslider_updating.lightness && changed.lightness) {
  				alphaslider_changes.lightness = ctx.lightness;
  				alphaslider_updating.lightness = ctx.lightness !== void 0;
  			}
  			alphaslider._set(alphaslider_changes);
  			alphaslider_updating = {};

  			var colorslider_changes = {};
  			if (!colorslider_updating.hue && changed.hue) {
  				colorslider_changes.hue = ctx.hue;
  				colorslider_updating.hue = ctx.hue !== void 0;
  			}
  			colorslider._set(colorslider_changes);
  			colorslider_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			outrocallback = callAfter(outrocallback, 3);

  			if (colorarea) colorarea._fragment.o(outrocallback);
  			if (alphaslider) alphaslider._fragment.o(outrocallback);
  			if (colorslider) colorslider._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(table);
  			}

  			if (component.refs.sample === span0) component.refs.sample = null;
  			removeListener(input, "change", change_handler);
  			if (component.refs.box === input) component.refs.box = null;
  			removeListener(span2, "click", click_handler);
  			colorarea.destroy();
  			alphaslider.destroy();
  			colorslider.destroy();
  			removeListener(table, "click", click_handler_1);
  			removeListener(table, "dragstart", dragstart_handler);
  		}
  	};
  }

  function ColorPicker(options) {
  	var _this = this;

  	this._debugName = '<ColorPicker>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$6(), options.data);

  	this._recompute({ hue: 1, saturation: 1, lightness: 1, mode: 1, hex: 1, rgb: 1, alpha: 1 }, this._state);
  	if (!('mode' in this._state)) console.warn("<ColorPicker> was created without expected data property 'mode'");

  	if (!('hue' in this._state)) console.warn("<ColorPicker> was created without expected data property 'hue'");
  	if (!('saturation' in this._state)) console.warn("<ColorPicker> was created without expected data property 'saturation'");
  	if (!('lightness' in this._state)) console.warn("<ColorPicker> was created without expected data property 'lightness'");
  	if (!('alpha' in this._state)) console.warn("<ColorPicker> was created without expected data property 'alpha'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$5];

  	this._fragment = create_main_fragment$6(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(ColorPicker.prototype, protoDev);
  assign(ColorPicker.prototype, methods$4);

  ColorPicker.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hex' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'hex'");
  	if ('rgb' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'rgb'");
  	if ('value' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'value'");
  	if ('rgba' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'rgba'");
  };

  ColorPicker.prototype._recompute = function _recompute(changed, state) {
  	if (changed.hue || changed.saturation || changed.lightness) {
  		if (this._differs(state.hex, state.hex = hex(state))) changed.hex = true;
  		if (this._differs(state.rgb, state.rgb = rgb(state))) changed.rgb = true;
  	}

  	if (changed.mode || changed.hex || changed.rgb) {
  		if (this._differs(state.value, state.value = value(state))) changed.value = true;
  	}

  	if (changed.hue || changed.saturation || changed.lightness || changed.alpha) {
  		if (this._differs(state.rgba, state.rgba = rgba(state))) changed.rgba = true;
  	}
  };

  exports.ColorPicker = ColorPicker;
  exports.hsl2rgb = hsl2rgb;
  exports.rgb2hsl = rgb2hsl;
  exports.rgb2hex = rgb2hex;
  exports.hex2rgb = hex2rgb;
  exports.int2hex = int2hex;
  exports.hex2int = hex2int;

  });

  unwrapExports(scanexColorPicker_cjs);
  var scanexColorPicker_cjs_1 = scanexColorPicker_cjs.ColorPicker;
  var scanexColorPicker_cjs_2 = scanexColorPicker_cjs.hsl2rgb;
  var scanexColorPicker_cjs_3 = scanexColorPicker_cjs.rgb2hsl;
  var scanexColorPicker_cjs_4 = scanexColorPicker_cjs.rgb2hex;
  var scanexColorPicker_cjs_5 = scanexColorPicker_cjs.hex2rgb;
  var scanexColorPicker_cjs_6 = scanexColorPicker_cjs.int2hex;
  var scanexColorPicker_cjs_7 = scanexColorPicker_cjs.hex2int;

  var _typeof$4 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop$3() {}

  function assign$3(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue$2(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function addLoc$3(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run$3(fn) {
  	fn();
  }

  function append$3(target, node) {
  	target.appendChild(node);
  }

  function insert$3(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode$3(node) {
  	node.parentNode.removeChild(node);
  }

  function createElement$3(name) {
  	return document.createElement(name);
  }

  function createText$3(data) {
  	return document.createTextNode(data);
  }

  function addListener$3(node, event, handler) {
  	node.addEventListener(event, handler, false);
  }

  function removeListener$3(node, event, handler) {
  	node.removeEventListener(event, handler, false);
  }

  function setAttribute$3(node, attribute, value) {
  	node.setAttribute(attribute, value);
  }

  function toggleClass$2(element, name, toggle) {
  	element.classList.toggle(name, !!toggle);
  }

  function blankObject$3() {
  	return Object.create(null);
  }

  function destroy$3(detach) {
  	this.destroy = noop$3;
  	this.fire('destroy');
  	this.set = noop$3;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev$3(detach) {
  	destroy$3.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs$3(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof$4(a)) === 'object' || typeof a === 'function';
  }

  function fire$3(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush$3(component) {
  	component._lock = true;
  	callAll$3(component._beforecreate);
  	callAll$3(component._oncreate);
  	callAll$3(component._aftercreate);
  	component._lock = false;
  }

  function get$1$3() {
  	return this._state;
  }

  function init$3(component, options) {
  	component._handlers = blankObject$3();
  	component._slots = blankObject$3();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on$3(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1$3(newState) {
  	this._set(assign$3({}, newState));
  	if (this.root._lock) return;
  	flush$3(this.root);
  }

  function _set$3(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign$3(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign$3(assign$3({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage$3(newState) {
  	assign$3(this._staged, newState);
  }

  function setDev$3(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof$4(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1$3.call(this, newState);
  }

  function callAll$3(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount$3(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev$3 = {
  	destroy: destroyDev$3,
  	get: get$1$3,
  	fire: fire$3,
  	on: on$3,
  	set: setDev$3,
  	_recompute: noop$3,
  	_set: _set$3,
  	_stage: _stage$3,
  	_mount: _mount$3,
  	_differs: _differs$3
  };

  Number.isInteger = Number.isInteger || function (value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  };

  /* src\InputInteger\InputInteger.html generated by Svelte v2.14.1 */

  var to_bool = function to_bool(value) {
  				switch (typeof value === 'undefined' ? 'undefined' : _typeof$4(value)) {
  								case 'string':
  												return value.toLowerCase() === 'true';
  								case 'boolean':
  												return value;
  								case 'number':
  												return value !== 0;
  								default:
  								case 'object':
  												return value !== null;
  				}
  };

  function data$4() {
  				return {
  								allowEmpty: false,
  								disabled: false,
  								max: null,
  								min: null,
  								spinner: false,
  								value: 0,
  								useSpinner: true
  				};
  }
  var methods$3 = {
  				up: function up() {
  								var _get = this.get(),
  								    value = _get.value,
  								    disabled = _get.disabled;

  								if (!disabled) {
  												var v = parseInt(value, 10);
  												if (Number.isInteger(v)) {
  																this.set({ value: v + 1 });
  												}
  								}
  				},
  				down: function down() {
  								var _get2 = this.get(),
  								    value = _get2.value,
  								    disabled = _get2.disabled;

  								if (!disabled) {
  												var v = parseInt(value, 10);
  												if (Number.isInteger(v)) {
  																this.set({ value: v - 1 });
  												}
  								}
  				},
  				change: function change(e) {
  								switch (e.keyCode) {
  												case 38:
  																// up
  																e.preventDefault();
  																this.up();
  																break;
  												case 40:
  																// down
  																e.preventDefault();
  																this.down();
  																break;
  												default:
  																break;
  								}
  				},
  				isValid: function isValid(value) {
  								var _get3 = this.get(),
  								    min = _get3.min,
  								    max = _get3.max;

  								var low = parseInt(min, 10);
  								var high = parseInt(max, 10);
  								var v = parseInt(value, 10);
  								return Number.isInteger(v) && (Number.isInteger(low) && !Number.isInteger(high) && low <= v || Number.isInteger(high) && !Number.isInteger(low) && v <= high || Number.isInteger(low) && Number.isInteger(high) && low <= v && v <= high);
  				},
  				showSpinner: function showSpinner(e) {
  								var _get4 = this.get(),
  								    disabled = _get4.disabled,
  								    useSpinner = _get4.useSpinner;

  								if (useSpinner) {
  												this.set({ spinner: !disabled });
  								}
  				},
  				hideSpinner: function hideSpinner(e) {
  								var _get5 = this.get(),
  								    useSpinner = _get5.useSpinner;

  								if (useSpinner) {
  												this.set({ spinner: false });
  								}
  				}
  };

  function onupdate$2(_ref) {
  				var changed = _ref.changed,
  				    current = _ref.current,
  				    previous = _ref.previous;

  				if (changed.value) {
  								if (this.isValid(current.value)) {
  												this.set({ value: parseInt(current.value, 10) });
  								} else {
  												var _get6 = this.get(),
  												    allowEmpty = _get6.allowEmpty;

  												var emptyAllowed = false;
  												switch (typeof allowEmpty === 'undefined' ? 'undefined' : _typeof$4(allowEmpty)) {
  																case 'string':
  																				emptyAllowed = allowEmpty.toLowerCase() === 'true';
  																				break;
  																case 'boolean':
  																				emptyAllowed = allowEmpty;
  																				break;
  																default:
  																				break;
  												}
  												if (emptyAllowed) {
  																this.set({ value: '' });
  												} else if (previous && this.isValid(previous.value)) {
  																this.set({ value: previous.value });
  												} else {
  																this.set({ value: 0 });
  												}
  								}
  				}
  				if (changed.useSpinner) {
  								this.set({ useSpinner: to_bool(current.useSpinner) });
  				}

  				var _get7 = this.get(),
  				    useSpinner = _get7.useSpinner;

  				if (changed.spinner && to_bool(useSpinner)) {
  								if (current.spinner) {
  												this.refs.spinner.classList.remove('hidden');
  								} else {
  												this.refs.spinner.classList.add('hidden');
  								}
  				}
  }
  var file$2 = "src\\InputInteger\\InputInteger.html";

  function create_main_fragment$4(component, ctx) {
  				var div1,
  				    div0,
  				    input,
  				    input_updating = false,
  				    text,
  				    current;

  				function input_input_handler() {
  								input_updating = true;
  								component.set({ value: input.value });
  								input_updating = false;
  				}

  				function change_handler(event) {
  								component.set({ value: event.target.value });
  				}

  				function keydown_handler(event) {
  								component.change(event);
  				}

  				var if_block = ctx.useSpinner && create_if_block(component, ctx);

  				function mouseenter_handler(event) {
  								component.showSpinner(event);
  				}

  				function mouseleave_handler(event) {
  								component.hideSpinner(event);
  				}

  				return {
  								c: function create() {
  												div1 = createElement$3("div");
  												div0 = createElement$3("div");
  												input = createElement$3("input");
  												text = createText$3("\r\n    ");
  												if (if_block) if_block.c();
  												addListener$3(input, "input", input_input_handler);
  												addListener$3(input, "change", change_handler);
  												addListener$3(input, "keydown", keydown_handler);
  												setAttribute$3(input, "type", "text");
  												addLoc$3(input, file$2, 2, 8, 186);
  												div0.className = "scanex-input-integer-field";
  												addLoc$3(div0, file$2, 1, 4, 136);
  												addListener$3(div1, "mouseenter", mouseenter_handler);
  												addListener$3(div1, "mouseleave", mouseleave_handler);
  												div1.className = "scanex-input-integer";
  												toggleClass$2(div1, "disabled", ctx.disabled);
  												addLoc$3(div1, file$2, 0, 0, 0);
  								},

  								m: function mount(target, anchor) {
  												insert$3(target, div1, anchor);
  												append$3(div1, div0);
  												append$3(div0, input);

  												input.value = ctx.value;

  												append$3(div1, text);
  												if (if_block) if_block.m(div1, null);
  												current = true;
  								},

  								p: function update(changed, ctx) {
  												if (!input_updating && changed.value) input.value = ctx.value;

  												if (ctx.useSpinner) {
  																if (!if_block) {
  																				if_block = create_if_block(component, ctx);
  																				if_block.c();
  																				if_block.m(div1, null);
  																}
  												} else if (if_block) {
  																if_block.d(1);
  																if_block = null;
  												}

  												if (changed.disabled) {
  																toggleClass$2(div1, "disabled", ctx.disabled);
  												}
  								},

  								i: function intro(target, anchor) {
  												if (current) return;

  												this.m(target, anchor);
  								},

  								o: run$3,

  								d: function destroy$$1(detach) {
  												if (detach) {
  																detachNode$3(div1);
  												}

  												removeListener$3(input, "input", input_input_handler);
  												removeListener$3(input, "change", change_handler);
  												removeListener$3(input, "keydown", keydown_handler);
  												if (if_block) if_block.d();
  												removeListener$3(div1, "mouseenter", mouseenter_handler);
  												removeListener$3(div1, "mouseleave", mouseleave_handler);
  								}
  				};
  }

  // (5:4) {#if useSpinner}
  function create_if_block(component, ctx) {
  				var div, i0, text, i1;

  				function click_handler(event) {
  								component.up();
  				}

  				function click_handler_1(event) {
  								component.down();
  				}

  				return {
  								c: function create() {
  												div = createElement$3("div");
  												i0 = createElement$3("i");
  												text = createText$3("\r\n        ");
  												i1 = createElement$3("i");
  												addListener$3(i0, "click", click_handler);
  												i0.className = "scanex-input-integer-up";
  												addLoc$3(i0, file$2, 6, 8, 394);
  												addListener$3(i1, "click", click_handler_1);
  												i1.className = "scanex-input-integer-down";
  												addLoc$3(i1, file$2, 7, 8, 459);
  												div.className = "scanex-input-integer-spinner";
  												addLoc$3(div, file$2, 5, 4, 330);
  								},

  								m: function mount(target, anchor) {
  												insert$3(target, div, anchor);
  												append$3(div, i0);
  												append$3(div, text);
  												append$3(div, i1);
  												component.refs.spinner = div;
  								},

  								d: function destroy$$1(detach) {
  												if (detach) {
  																detachNode$3(div);
  												}

  												removeListener$3(i0, "click", click_handler);
  												removeListener$3(i1, "click", click_handler_1);
  												if (component.refs.spinner === div) component.refs.spinner = null;
  								}
  				};
  }

  function InputInteger(options) {
  				var _this = this;

  				this._debugName = '<InputInteger>';
  				if (!options || !options.target && !options.root) throw new Error("'target' is a required option");
  				init$3(this, options);
  				this.refs = {};
  				this._state = assign$3(data$4(), options.data);
  				if (!('disabled' in this._state)) console.warn("<InputInteger> was created without expected data property 'disabled'");
  				if (!('value' in this._state)) console.warn("<InputInteger> was created without expected data property 'value'");
  				if (!('useSpinner' in this._state)) console.warn("<InputInteger> was created without expected data property 'useSpinner'");
  				this._intro = !!options.intro;
  				this._handlers.update = [onupdate$2];

  				this._fragment = create_main_fragment$4(this, this._state);

  				this.root._oncreate.push(function () {
  								_this.fire("update", { changed: assignTrue$2({}, _this._state), current: _this._state });
  				});

  				if (options.target) {
  								if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  								this._fragment.c();
  								this._mount(options.target, options.anchor);

  								flush$3(this);
  				}

  				this._intro = true;
  }

  assign$3(InputInteger.prototype, protoDev$3);
  assign$3(InputInteger.prototype, methods$3);

  InputInteger.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  var scanexInputInteger_cjs = InputInteger;

  var _typeof$5 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop$4() {}

  function assign$4(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue$3(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function callAfter$1(fn, i) {
  	if (i === 0) fn();
  	return function () {
  		if (! --i) fn();
  	};
  }

  function addLoc$4(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run$4(fn) {
  	fn();
  }

  function append$4(target, node) {
  	target.appendChild(node);
  }

  function insert$4(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode$4(node) {
  	node.parentNode.removeChild(node);
  }

  function createElement$4(name) {
  	return document.createElement(name);
  }

  function createText$4(data) {
  	return document.createTextNode(data);
  }

  function addListener$4(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener$4(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setAttribute$4(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
  }

  function toggleClass$3(element, name, toggle) {
  	element.classList[toggle ? 'add' : 'remove'](name);
  }

  function blankObject$4() {
  	return Object.create(null);
  }

  function destroy$4(detach) {
  	this.destroy = noop$4;
  	this.fire('destroy');
  	this.set = noop$4;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev$4(detach) {
  	destroy$4.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs$4(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof$5(a)) === 'object' || typeof a === 'function';
  }

  function fire$4(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush$4(component) {
  	component._lock = true;
  	callAll$4(component._beforecreate);
  	callAll$4(component._oncreate);
  	callAll$4(component._aftercreate);
  	component._lock = false;
  }

  function get$1$4() {
  	return this._state;
  }

  function init$4(component, options) {
  	component._handlers = blankObject$4();
  	component._slots = blankObject$4();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on$4(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1$4(newState) {
  	this._set(assign$4({}, newState));
  	if (this.root._lock) return;
  	flush$4(this.root);
  }

  function _set$4(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign$4(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign$4(assign$4({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage$4(newState) {
  	assign$4(this._staged, newState);
  }

  function setDev$4(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof$5(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1$4.call(this, newState);
  }

  function callAll$4(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount$4(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev$4 = {
  	destroy: destroyDev$4,
  	get: get$1$4,
  	fire: fire$4,
  	on: on$4,
  	set: setDev$4,
  	_recompute: noop$4,
  	_set: _set$4,
  	_stage: _stage$4,
  	_mount: _mount$4,
  	_differs: _differs$4
  };

  Number.isInteger = Number.isInteger || function (value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  };

  /* node_modules\scanex-input-integer\src\InputInteger\InputInteger.html generated by Svelte v2.16.1 */

  var to_bool$1 = function to_bool(value) {
  				switch (typeof value === 'undefined' ? 'undefined' : _typeof$5(value)) {
  								case 'string':
  												return value.toLowerCase() === 'true';
  								case 'boolean':
  												return value;
  								case 'number':
  												return value !== 0;
  								default:
  								case 'object':
  												return value !== null;
  				}
  };

  function data$5() {
  				return {
  								allowEmpty: false,
  								disabled: false,
  								max: null,
  								min: null,
  								spinner: false,
  								value: 0,
  								useSpinner: true
  				};
  }
  var methods$4 = {
  				up: function up() {
  								var _get = this.get(),
  								    value = _get.value,
  								    disabled = _get.disabled;

  								if (!disabled) {
  												var v = parseInt(value, 10);
  												if (Number.isInteger(v)) {
  																this.set({ value: v + 1 });
  												}
  								}
  				},
  				down: function down() {
  								var _get2 = this.get(),
  								    value = _get2.value,
  								    disabled = _get2.disabled;

  								if (!disabled) {
  												var v = parseInt(value, 10);
  												if (Number.isInteger(v)) {
  																this.set({ value: v - 1 });
  												}
  								}
  				},
  				change: function change(e) {
  								switch (e.keyCode) {
  												case 38:
  																// up
  																e.preventDefault();
  																this.up();
  																break;
  												case 40:
  																// down
  																e.preventDefault();
  																this.down();
  																break;
  												default:
  																break;
  								}
  				},
  				isValid: function isValid(value) {
  								var _get3 = this.get(),
  								    min = _get3.min,
  								    max = _get3.max;

  								var low = parseInt(min, 10);
  								var high = parseInt(max, 10);
  								var v = parseInt(value, 10);
  								return Number.isInteger(v) && (Number.isInteger(low) && !Number.isInteger(high) && low <= v || Number.isInteger(high) && !Number.isInteger(low) && v <= high || Number.isInteger(low) && Number.isInteger(high) && low <= v && v <= high);
  				},
  				showSpinner: function showSpinner(e) {
  								var _get4 = this.get(),
  								    disabled = _get4.disabled,
  								    useSpinner = _get4.useSpinner;

  								if (useSpinner) {
  												this.set({ spinner: !disabled });
  								}
  				},
  				hideSpinner: function hideSpinner(e) {
  								var _get5 = this.get(),
  								    useSpinner = _get5.useSpinner;

  								if (useSpinner) {
  												this.set({ spinner: false });
  								}
  				}
  };

  function onupdate$3(_ref) {
  				var changed = _ref.changed,
  				    current = _ref.current,
  				    previous = _ref.previous;

  				if (changed.value) {
  								if (this.isValid(current.value)) {
  												this.set({ value: parseInt(current.value, 10) });
  								} else {
  												var _get6 = this.get(),
  												    allowEmpty = _get6.allowEmpty;

  												var emptyAllowed = false;
  												switch (typeof allowEmpty === 'undefined' ? 'undefined' : _typeof$5(allowEmpty)) {
  																case 'string':
  																				emptyAllowed = allowEmpty.toLowerCase() === 'true';
  																				break;
  																case 'boolean':
  																				emptyAllowed = allowEmpty;
  																				break;
  																default:
  																				break;
  												}
  												if (emptyAllowed) {
  																this.set({ value: '' });
  												} else if (previous && this.isValid(previous.value)) {
  																this.set({ value: previous.value });
  												} else {
  																this.set({ value: 0 });
  												}
  								}
  				}
  				if (changed.useSpinner) {
  								this.set({ useSpinner: to_bool$1(current.useSpinner) });
  				}

  				var _get7 = this.get(),
  				    useSpinner = _get7.useSpinner;

  				if (changed.spinner && to_bool$1(useSpinner)) {
  								if (current.spinner) {
  												this.refs.spinner.classList.remove('hidden');
  								} else {
  												this.refs.spinner.classList.add('hidden');
  								}
  				}
  }
  var file$3 = "node_modules\\scanex-input-integer\\src\\InputInteger\\InputInteger.html";

  function create_main_fragment$5(component, ctx) {
  				var div1,
  				    div0,
  				    input,
  				    input_updating = false,
  				    text,
  				    current;

  				function input_input_handler() {
  								input_updating = true;
  								component.set({ value: input.value });
  								input_updating = false;
  				}

  				function change_handler(event) {
  								component.set({ value: event.target.value });
  				}

  				function keydown_handler(event) {
  								component.change(event);
  				}

  				var if_block = ctx.useSpinner && create_if_block$1(component, ctx);

  				function mouseenter_handler(event) {
  								component.showSpinner(event);
  				}

  				function mouseleave_handler(event) {
  								component.hideSpinner(event);
  				}

  				return {
  								c: function create() {
  												div1 = createElement$4("div");
  												div0 = createElement$4("div");
  												input = createElement$4("input");
  												text = createText$4("\r\n    ");
  												if (if_block) if_block.c();
  												addListener$4(input, "input", input_input_handler);
  												addListener$4(input, "change", change_handler);
  												addListener$4(input, "keydown", keydown_handler);
  												setAttribute$4(input, "type", "text");
  												addLoc$4(input, file$3, 2, 8, 186);
  												div0.className = "scanex-input-integer-field";
  												addLoc$4(div0, file$3, 1, 4, 136);
  												addListener$4(div1, "mouseenter", mouseenter_handler);
  												addListener$4(div1, "mouseleave", mouseleave_handler);
  												div1.className = "scanex-input-integer";
  												toggleClass$3(div1, "disabled", ctx.disabled);
  												addLoc$4(div1, file$3, 0, 0, 0);
  								},

  								m: function mount(target, anchor) {
  												insert$4(target, div1, anchor);
  												append$4(div1, div0);
  												append$4(div0, input);

  												input.value = ctx.value;

  												append$4(div1, text);
  												if (if_block) if_block.m(div1, null);
  												current = true;
  								},

  								p: function update(changed, ctx) {
  												if (!input_updating && changed.value) input.value = ctx.value;

  												if (ctx.useSpinner) {
  																if (!if_block) {
  																				if_block = create_if_block$1(component, ctx);
  																				if_block.c();
  																				if_block.m(div1, null);
  																}
  												} else if (if_block) {
  																if_block.d(1);
  																if_block = null;
  												}

  												if (changed.disabled) {
  																toggleClass$3(div1, "disabled", ctx.disabled);
  												}
  								},

  								i: function intro(target, anchor) {
  												if (current) return;

  												this.m(target, anchor);
  								},

  								o: run$4,

  								d: function destroy$$1(detach) {
  												if (detach) {
  																detachNode$4(div1);
  												}

  												removeListener$4(input, "input", input_input_handler);
  												removeListener$4(input, "change", change_handler);
  												removeListener$4(input, "keydown", keydown_handler);
  												if (if_block) if_block.d();
  												removeListener$4(div1, "mouseenter", mouseenter_handler);
  												removeListener$4(div1, "mouseleave", mouseleave_handler);
  								}
  				};
  }

  // (5:4) {#if useSpinner}
  function create_if_block$1(component, ctx) {
  				var div, i0, text, i1;

  				function click_handler(event) {
  								component.up();
  				}

  				function click_handler_1(event) {
  								component.down();
  				}

  				return {
  								c: function create() {
  												div = createElement$4("div");
  												i0 = createElement$4("i");
  												text = createText$4("\r\n        ");
  												i1 = createElement$4("i");
  												addListener$4(i0, "click", click_handler);
  												i0.className = "scanex-input-integer-up";
  												addLoc$4(i0, file$3, 6, 8, 394);
  												addListener$4(i1, "click", click_handler_1);
  												i1.className = "scanex-input-integer-down";
  												addLoc$4(i1, file$3, 7, 8, 459);
  												div.className = "scanex-input-integer-spinner";
  												addLoc$4(div, file$3, 5, 4, 330);
  								},

  								m: function mount(target, anchor) {
  												insert$4(target, div, anchor);
  												append$4(div, i0);
  												append$4(div, text);
  												append$4(div, i1);
  												component.refs.spinner = div;
  								},

  								d: function destroy$$1(detach) {
  												if (detach) {
  																detachNode$4(div);
  												}

  												removeListener$4(i0, "click", click_handler);
  												removeListener$4(i1, "click", click_handler_1);
  												if (component.refs.spinner === div) component.refs.spinner = null;
  								}
  				};
  }

  function InputInteger$1(options) {
  				var _this = this;

  				this._debugName = '<InputInteger>';
  				if (!options || !options.target && !options.root) {
  								throw new Error("'target' is a required option");
  				}

  				init$4(this, options);
  				this.refs = {};
  				this._state = assign$4(data$5(), options.data);
  				if (!('disabled' in this._state)) console.warn("<InputInteger> was created without expected data property 'disabled'");
  				if (!('value' in this._state)) console.warn("<InputInteger> was created without expected data property 'value'");
  				if (!('useSpinner' in this._state)) console.warn("<InputInteger> was created without expected data property 'useSpinner'");
  				this._intro = !!options.intro;
  				this._handlers.update = [onupdate$3];

  				this._fragment = create_main_fragment$5(this, this._state);

  				this.root._oncreate.push(function () {
  								_this.fire("update", { changed: assignTrue$3({}, _this._state), current: _this._state });
  				});

  				if (options.target) {
  								if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  								this._fragment.c();
  								this._mount(options.target, options.anchor);

  								flush$4(this);
  				}

  				this._intro = true;
  }

  assign$4(InputInteger$1.prototype, protoDev$4);
  assign$4(InputInteger$1.prototype, methods$4);

  InputInteger$1.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\IntegerRange.html generated by Svelte v2.16.1 */

  function data$1$1() {
  	return {
  		allowEmpty: false,
  		disabled: false,
  		max: null,
  		min: null,
  		high: 0,
  		low: 0,
  		useSpinner: true
  	};
  }
  var methods$1$1 = {
  	isValidLow: function isValidLow(value) {
  		var high = parseInt(this.get().high, 10);
  		var v = parseInt(value, 10);
  		return this.inRange(v) && Number.isInteger(high) && v <= high;
  	},
  	isValidHigh: function isValidHigh(value) {
  		var low = parseInt(this.get().low, 10);
  		var v = parseInt(value, 10);
  		return this.inRange(v) && Number.isInteger(low) && low <= v;
  	},
  	inRange: function inRange(v) {
  		var _get = this.get(),
  		    min = _get.min,
  		    max = _get.max;

  		var a = parseInt(min, 10);
  		var z = parseInt(max, 10);
  		return Number.isInteger(v) && (Number.isInteger(a) && Number.isInteger(z) && a <= v && v <= z || !Number.isInteger(z) && Number.isInteger(a) && a <= v || !Number.isInteger(a) && Number.isInteger(z) && v <= z);
  	}
  };

  function onupdate$1$1(_ref) {
  	var changed = _ref.changed,
  	    current = _ref.current,
  	    previous = _ref.previous;

  	var _get2 = this.get(),
  	    min = _get2.min,
  	    max = _get2.max;

  	if (changed.low) {
  		if (!this.isValidLow(current.low)) {
  			if (previous && this.isValidLow(previous.low)) {
  				this.set({ low: parseInt(previous.low, 10) });
  			} else if (this.isValidLow(min)) {
  				this.set({ low: parseInt(min, 10) });
  			} else {
  				this.set({ low: 0 });
  			}
  		}
  	}
  	if (changed.high) {
  		if (!this.isValidHigh(current.high)) {
  			if (previous && this.isValidHigh(previous.high)) {
  				this.set({ high: parseInt(previous.high, 10) });
  			} else if (this.isValidHigh(max)) {
  				this.set({ high: parseInt(max, 10) });
  			} else {
  				this.set({ high: 0 });
  			}
  		}
  	}
  }
  var file$1$1 = "src\\IntegerRange.html";

  function create_main_fragment$1$1(component, ctx) {
  	var ul,
  	    li0,
  	    inputinteger0_updating = {},
  	    text0,
  	    li1,
  	    text2,
  	    li2,
  	    inputinteger1_updating = {},
  	    current;

  	var inputinteger0_initial_data = {};
  	if (ctx.disabled !== void 0) {
  		inputinteger0_initial_data.disabled = ctx.disabled;
  		inputinteger0_updating.disabled = true;
  	}
  	if (ctx.min !== void 0) {
  		inputinteger0_initial_data.min = ctx.min;
  		inputinteger0_updating.min = true;
  	}
  	if (ctx.low !== void 0) {
  		inputinteger0_initial_data.value = ctx.low;
  		inputinteger0_updating.value = true;
  	}
  	if (ctx.allowEmpty !== void 0) {
  		inputinteger0_initial_data.allowEmpty = ctx.allowEmpty;
  		inputinteger0_updating.allowEmpty = true;
  	}
  	if (ctx.useSpinner !== void 0) {
  		inputinteger0_initial_data.useSpinner = ctx.useSpinner;
  		inputinteger0_updating.useSpinner = true;
  	}
  	var inputinteger0 = new InputInteger$1({
  		root: component.root,
  		store: component.store,
  		data: inputinteger0_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger0_updating.disabled && changed.disabled) {
  				newState.disabled = childState.disabled;
  			}

  			if (!inputinteger0_updating.min && changed.min) {
  				newState.min = childState.min;
  			}

  			if (!inputinteger0_updating.value && changed.value) {
  				newState.low = childState.value;
  			}

  			if (!inputinteger0_updating.allowEmpty && changed.allowEmpty) {
  				newState.allowEmpty = childState.allowEmpty;
  			}

  			if (!inputinteger0_updating.useSpinner && changed.useSpinner) {
  				newState.useSpinner = childState.useSpinner;
  			}
  			component._set(newState);
  			inputinteger0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger0._bind({ disabled: 1, min: 1, value: 1, allowEmpty: 1, useSpinner: 1 }, inputinteger0.get());
  	});

  	var inputinteger1_initial_data = {};
  	if (ctx.disabled !== void 0) {
  		inputinteger1_initial_data.disabled = ctx.disabled;
  		inputinteger1_updating.disabled = true;
  	}
  	if (ctx.max !== void 0) {
  		inputinteger1_initial_data.max = ctx.max;
  		inputinteger1_updating.max = true;
  	}
  	if (ctx.high !== void 0) {
  		inputinteger1_initial_data.value = ctx.high;
  		inputinteger1_updating.value = true;
  	}
  	if (ctx.allowEmpty !== void 0) {
  		inputinteger1_initial_data.allowEmpty = ctx.allowEmpty;
  		inputinteger1_updating.allowEmpty = true;
  	}
  	if (ctx.useSpinner !== void 0) {
  		inputinteger1_initial_data.useSpinner = ctx.useSpinner;
  		inputinteger1_updating.useSpinner = true;
  	}
  	var inputinteger1 = new InputInteger$1({
  		root: component.root,
  		store: component.store,
  		data: inputinteger1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger1_updating.disabled && changed.disabled) {
  				newState.disabled = childState.disabled;
  			}

  			if (!inputinteger1_updating.max && changed.max) {
  				newState.max = childState.max;
  			}

  			if (!inputinteger1_updating.value && changed.value) {
  				newState.high = childState.value;
  			}

  			if (!inputinteger1_updating.allowEmpty && changed.allowEmpty) {
  				newState.allowEmpty = childState.allowEmpty;
  			}

  			if (!inputinteger1_updating.useSpinner && changed.useSpinner) {
  				newState.useSpinner = childState.useSpinner;
  			}
  			component._set(newState);
  			inputinteger1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger1._bind({ disabled: 1, max: 1, value: 1, allowEmpty: 1, useSpinner: 1 }, inputinteger1.get());
  	});

  	return {
  		c: function create() {
  			ul = createElement$4("ul");
  			li0 = createElement$4("li");
  			inputinteger0._fragment.c();
  			text0 = createText$4("\r\n    ");
  			li1 = createElement$4("li");
  			li1.textContent = "–";
  			text2 = createText$4("\r\n    ");
  			li2 = createElement$4("li");
  			inputinteger1._fragment.c();
  			li0.className = "scanex-integer-range-low";
  			addLoc$4(li0, file$1$1, 1, 4, 39);
  			li1.className = "scanex-integer-range-delimiter";
  			addLoc$4(li1, file$1$1, 4, 4, 191);
  			li2.className = "scanex-integer-range-high";
  			addLoc$4(li2, file$1$1, 5, 4, 253);
  			ul.className = "scanex-integer-range";
  			addLoc$4(ul, file$1$1, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert$4(target, ul, anchor);
  			append$4(ul, li0);
  			inputinteger0._mount(li0, null);
  			append$4(ul, text0);
  			append$4(ul, li1);
  			append$4(ul, text2);
  			append$4(ul, li2);
  			inputinteger1._mount(li2, null);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var inputinteger0_changes = {};
  			if (!inputinteger0_updating.disabled && changed.disabled) {
  				inputinteger0_changes.disabled = ctx.disabled;
  				inputinteger0_updating.disabled = ctx.disabled !== void 0;
  			}
  			if (!inputinteger0_updating.min && changed.min) {
  				inputinteger0_changes.min = ctx.min;
  				inputinteger0_updating.min = ctx.min !== void 0;
  			}
  			if (!inputinteger0_updating.value && changed.low) {
  				inputinteger0_changes.value = ctx.low;
  				inputinteger0_updating.value = ctx.low !== void 0;
  			}
  			if (!inputinteger0_updating.allowEmpty && changed.allowEmpty) {
  				inputinteger0_changes.allowEmpty = ctx.allowEmpty;
  				inputinteger0_updating.allowEmpty = ctx.allowEmpty !== void 0;
  			}
  			if (!inputinteger0_updating.useSpinner && changed.useSpinner) {
  				inputinteger0_changes.useSpinner = ctx.useSpinner;
  				inputinteger0_updating.useSpinner = ctx.useSpinner !== void 0;
  			}
  			inputinteger0._set(inputinteger0_changes);
  			inputinteger0_updating = {};

  			var inputinteger1_changes = {};
  			if (!inputinteger1_updating.disabled && changed.disabled) {
  				inputinteger1_changes.disabled = ctx.disabled;
  				inputinteger1_updating.disabled = ctx.disabled !== void 0;
  			}
  			if (!inputinteger1_updating.max && changed.max) {
  				inputinteger1_changes.max = ctx.max;
  				inputinteger1_updating.max = ctx.max !== void 0;
  			}
  			if (!inputinteger1_updating.value && changed.high) {
  				inputinteger1_changes.value = ctx.high;
  				inputinteger1_updating.value = ctx.high !== void 0;
  			}
  			if (!inputinteger1_updating.allowEmpty && changed.allowEmpty) {
  				inputinteger1_changes.allowEmpty = ctx.allowEmpty;
  				inputinteger1_updating.allowEmpty = ctx.allowEmpty !== void 0;
  			}
  			if (!inputinteger1_updating.useSpinner && changed.useSpinner) {
  				inputinteger1_changes.useSpinner = ctx.useSpinner;
  				inputinteger1_updating.useSpinner = ctx.useSpinner !== void 0;
  			}
  			inputinteger1._set(inputinteger1_changes);
  			inputinteger1_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			outrocallback = callAfter$1(outrocallback, 2);

  			if (inputinteger0) inputinteger0._fragment.o(outrocallback);
  			if (inputinteger1) inputinteger1._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode$4(ul);
  			}

  			inputinteger0.destroy();
  			inputinteger1.destroy();
  		}
  	};
  }

  function IntegerRange(options) {
  	var _this = this;

  	this._debugName = '<IntegerRange>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init$4(this, options);
  	this._state = assign$4(data$1$1(), options.data);
  	if (!('disabled' in this._state)) console.warn("<IntegerRange> was created without expected data property 'disabled'");
  	if (!('min' in this._state)) console.warn("<IntegerRange> was created without expected data property 'min'");
  	if (!('low' in this._state)) console.warn("<IntegerRange> was created without expected data property 'low'");
  	if (!('allowEmpty' in this._state)) console.warn("<IntegerRange> was created without expected data property 'allowEmpty'");
  	if (!('useSpinner' in this._state)) console.warn("<IntegerRange> was created without expected data property 'useSpinner'");
  	if (!('max' in this._state)) console.warn("<IntegerRange> was created without expected data property 'max'");
  	if (!('high' in this._state)) console.warn("<IntegerRange> was created without expected data property 'high'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$1$1];

  	this._fragment = create_main_fragment$1$1(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue$3({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush$4(this);
  	}

  	this._intro = true;
  }

  assign$4(IntegerRange.prototype, protoDev$4);
  assign$4(IntegerRange.prototype, methods$1$1);

  IntegerRange.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  var scanexIntegerRange_cjs = IntegerRange;

  var _typeof$6 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop$5() {}

  function assign$5(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function addLoc$5(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run$5(fn) {
  	fn();
  }

  function append$5(target, node) {
  	target.appendChild(node);
  }

  function insert$5(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode$5(node) {
  	node.parentNode.removeChild(node);
  }

  function reinsertChildren$1(parent, target) {
  	while (parent.firstChild) {
  		target.appendChild(parent.firstChild);
  	}
  }

  function createElement$5(name) {
  	return document.createElement(name);
  }

  function createText$5(data) {
  	return document.createTextNode(data);
  }

  function addListener$5(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener$5(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function toggleClass$4(element, name, toggle) {
  	element.classList.toggle(name, !!toggle);
  }

  function blankObject$5() {
  	return Object.create(null);
  }

  function destroy$5(detach) {
  	this.destroy = noop$5;
  	this.fire('destroy');
  	this.set = noop$5;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev$5(detach) {
  	destroy$5.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs$5(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof$6(a)) === 'object' || typeof a === 'function';
  }

  function fire$5(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush$5(component) {
  	component._lock = true;
  	callAll$5(component._beforecreate);
  	callAll$5(component._oncreate);
  	callAll$5(component._aftercreate);
  	component._lock = false;
  }

  function get$1$5() {
  	return this._state;
  }

  function init$5(component, options) {
  	component._handlers = blankObject$5();
  	component._slots = blankObject$5();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on$5(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1$5(newState) {
  	this._set(assign$5({}, newState));
  	if (this.root._lock) return;
  	flush$5(this.root);
  }

  function _set$5(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign$5(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign$5(assign$5({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage$5(newState) {
  	assign$5(this._staged, newState);
  }

  function setDev$5(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof$6(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1$5.call(this, newState);
  }

  function callAll$5(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount$5(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev$5 = {
  	destroy: destroyDev$5,
  	get: get$1$5,
  	fire: fire$5,
  	on: on$5,
  	set: setDev$5,
  	_recompute: noop$5,
  	_set: _set$5,
  	_stage: _stage$5,
  	_mount: _mount$5,
  	_differs: _differs$5
  };

  /* src\Switch.html generated by Svelte v2.15.3 */

  function data$6() {
  	return {
  		flag: false
  	};
  }
  var file$4 = "src\\Switch.html";

  function create_main_fragment$6(component, ctx) {
  	var div2,
  	    div0,
  	    slot_content_left = component._slotted.left,
  	    text,
  	    div1,
  	    slot_content_right = component._slotted.right,
  	    current;

  	function click_handler(event) {
  		component.set({ flag: true });
  	}

  	function click_handler_1(event) {
  		component.set({ flag: false });
  	}

  	return {
  		c: function create() {
  			div2 = createElement$5("div");
  			div0 = createElement$5("div");
  			text = createText$5("\r\n    ");
  			div1 = createElement$5("div");
  			addListener$5(div0, "click", click_handler);
  			div0.className = "svelte-ftc0u3";
  			toggleClass$4(div0, "flag", ctx.flag);
  			addLoc$5(div0, file$4, 1, 4, 33);
  			addListener$5(div1, "click", click_handler_1);
  			div1.className = "svelte-ftc0u3";
  			toggleClass$4(div1, "flag", !ctx.flag);
  			addLoc$5(div1, file$4, 4, 4, 138);
  			div2.className = "scanex-switch svelte-ftc0u3";
  			addLoc$5(div2, file$4, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert$5(target, div2, anchor);
  			append$5(div2, div0);

  			if (slot_content_left) {
  				append$5(div0, slot_content_left);
  			}

  			append$5(div2, text);
  			append$5(div2, div1);

  			if (slot_content_right) {
  				append$5(div1, slot_content_right);
  			}

  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (changed.flag) {
  				toggleClass$4(div0, "flag", ctx.flag);
  				toggleClass$4(div1, "flag", !ctx.flag);
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run$5,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode$5(div2);
  			}

  			if (slot_content_left) {
  				reinsertChildren$1(div0, slot_content_left);
  			}

  			removeListener$5(div0, "click", click_handler);

  			if (slot_content_right) {
  				reinsertChildren$1(div1, slot_content_right);
  			}

  			removeListener$5(div1, "click", click_handler_1);
  		}
  	};
  }

  function Switch(options) {
  	this._debugName = '<Switch>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init$5(this, options);
  	this._state = assign$5(data$6(), options.data);
  	if (!('flag' in this._state)) console.warn("<Switch> was created without expected data property 'flag'");
  	this._intro = !!options.intro;

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$6(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}

  	this._intro = true;
  }

  assign$5(Switch.prototype, protoDev$5);

  Switch.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  var scanexSwitch_cjs = Switch;

  var _typeof$7 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop$6() {}

  function assign$6(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue$4(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function addLoc$6(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run$6(fn) {
  	fn();
  }

  function insert$6(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode$6(node) {
  	node.parentNode.removeChild(node);
  }

  function createElement$6(name) {
  	return document.createElement(name);
  }

  function addListener$6(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener$6(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setAttribute$5(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
  }

  function blankObject$6() {
  	return Object.create(null);
  }

  function destroy$6(detach) {
  	this.destroy = noop$6;
  	this.fire('destroy');
  	this.set = noop$6;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev$6(detach) {
  	destroy$6.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs$6(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof$7(a)) === 'object' || typeof a === 'function';
  }

  function fire$6(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush$6(component) {
  	component._lock = true;
  	callAll$6(component._beforecreate);
  	callAll$6(component._oncreate);
  	callAll$6(component._aftercreate);
  	component._lock = false;
  }

  function get$1$6() {
  	return this._state;
  }

  function init$6(component, options) {
  	component._handlers = blankObject$6();
  	component._slots = blankObject$6();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on$6(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1$6(newState) {
  	this._set(assign$6({}, newState));
  	if (this.root._lock) return;
  	flush$6(this.root);
  }

  function _set$6(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign$6(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign$6(assign$6({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage$6(newState) {
  	assign$6(this._staged, newState);
  }

  function setDev$6(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof$7(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1$6.call(this, newState);
  }

  function callAll$6(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount$6(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev$6 = {
  	destroy: destroyDev$6,
  	get: get$1$6,
  	fire: fire$6,
  	on: on$6,
  	set: setDev$6,
  	_recompute: noop$6,
  	_set: _set$6,
  	_stage: _stage$6,
  	_mount: _mount$6,
  	_differs: _differs$6
  };

  /* src\ValidatingInput.html generated by Svelte v2.15.3 */

  function data$7() {
  	return {
  		value: '',
  		validate: function validate() {
  			return true;
  		},
  		placeholder: '',
  		allowEmpty: false
  	};
  }
  function onupdate$4(_ref) {
  	var changed = _ref.changed,
  	    current = _ref.current,
  	    previous = _ref.previous;

  	if (changed.value) {
  		var _get = this.get(),
  		    validate = _get.validate,
  		    allowEmpty = _get.allowEmpty;

  		var ok = false;
  		switch (typeof validate === 'undefined' ? 'undefined' : _typeof$7(validate)) {
  			case 'function':
  				ok = validate(current.value);
  				break;
  			case 'string':
  				ok = new RegExp(validate, 'g').test(current.value);
  				break;
  			default:
  				break;
  		}
  		var emptyAllowed = false;
  		switch (typeof allowEmpty === 'undefined' ? 'undefined' : _typeof$7(allowEmpty)) {
  			case 'string':
  				emptyAllowed = allowEmpty.toLowerCase() === 'true';
  				break;
  			case 'boolean':
  				emptyAllowed = allowEmpty;
  				break;
  			default:
  				break;
  		}
  		if (!ok) {
  			if (!emptyAllowed && previous && previous.value) {
  				this.set({ value: previous.value });
  			} else {
  				this.set({ value: '' });
  			}
  		}
  	}
  }
  var file$5 = "src\\ValidatingInput.html";

  function create_main_fragment$7(component, ctx) {
  	var input,
  	    input_updating = false,
  	    current;

  	function input_input_handler() {
  		input_updating = true;
  		component.set({ value: input.value });
  		input_updating = false;
  	}

  	function change_handler(event) {
  		component.set({ value: event.target.value });
  	}

  	return {
  		c: function create() {
  			input = createElement$6("input");
  			addListener$6(input, "input", input_input_handler);
  			addListener$6(input, "change", change_handler);
  			setAttribute$5(input, "type", "text");
  			input.placeholder = ctx.placeholder;
  			addLoc$6(input, file$5, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert$6(target, input, anchor);

  			input.value = ctx.value;

  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (!input_updating && changed.value) input.value = ctx.value;
  			if (changed.placeholder) {
  				input.placeholder = ctx.placeholder;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run$6,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode$6(input);
  			}

  			removeListener$6(input, "input", input_input_handler);
  			removeListener$6(input, "change", change_handler);
  		}
  	};
  }

  function ValidatingInput(options) {
  	var _this = this;

  	this._debugName = '<ValidatingInput>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init$6(this, options);
  	this._state = assign$6(data$7(), options.data);
  	if (!('placeholder' in this._state)) console.warn("<ValidatingInput> was created without expected data property 'placeholder'");
  	if (!('value' in this._state)) console.warn("<ValidatingInput> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$4];

  	this._fragment = create_main_fragment$7(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue$4({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush$6(this);
  	}

  	this._intro = true;
  }

  assign$6(ValidatingInput.prototype, protoDev$6);

  ValidatingInput.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  var scanexValidatingInput_cjs = ValidatingInput;

  var scanexAdvancedColorPicker_cjs = createCommonjsModule(function (module) {

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop() {}

  function assign(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function callAfter(fn, i) {
  	if (i === 0) fn();
  	return function () {
  		if (! --i) fn();
  	};
  }

  function addLoc(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function append(target, node) {
  	target.appendChild(node);
  }

  function insert(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode(node) {
  	node.parentNode.removeChild(node);
  }

  function createElement(name) {
  	return document.createElement(name);
  }

  function createText(data) {
  	return document.createTextNode(data);
  }

  function addListener(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function blankObject() {
  	return Object.create(null);
  }

  function destroy(detach) {
  	this.destroy = noop;
  	this.fire('destroy');
  	this.set = noop;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev(detach) {
  	destroy.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object' || typeof a === 'function';
  }

  function fire(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush(component) {
  	component._lock = true;
  	callAll(component._beforecreate);
  	callAll(component._oncreate);
  	callAll(component._aftercreate);
  	component._lock = false;
  }

  function get$1() {
  	return this._state;
  }

  function init(component, options) {
  	component._handlers = blankObject();
  	component._slots = blankObject();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1(newState) {
  	this._set(assign({}, newState));
  	if (this.root._lock) return;
  	flush(this.root);
  }

  function _set(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign(assign({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage(newState) {
  	assign(this._staged, newState);
  }

  function setDev(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1.call(this, newState);
  }

  function callAll(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev = {
  	destroy: destroyDev,
  	get: get$1,
  	fire: fire,
  	on: on,
  	set: setDev,
  	_recompute: noop,
  	_set: _set,
  	_stage: _stage,
  	_mount: _mount,
  	_differs: _differs
  };

  function unwrapExports$$1 (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
  }

  function createCommonjsModule$$1(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var scanexColorPicker_cjs = createCommonjsModule$$1(function (module, exports) {

  Object.defineProperty(exports, '__esModule', { value: true });

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  function noop() {}

  function assign(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function callAfter(fn, i) {
  	if (i === 0) fn();
  	return function () {
  		if (! --i) fn();
  	};
  }

  function addLoc(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run(fn) {
  	fn();
  }

  function append(target, node) {
  	target.appendChild(node);
  }

  function insert(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode(node) {
  	node.parentNode.removeChild(node);
  }

  function reinsertChildren(parent, target) {
  	while (parent.firstChild) {
  		target.appendChild(parent.firstChild);
  	}
  }

  function reinsertBefore(after, target) {
  	var parent = after.parentNode;
  	while (parent.firstChild !== after) {
  		target.appendChild(parent.firstChild);
  	}
  }

  function createFragment() {
  	return document.createDocumentFragment();
  }

  function createElement(name) {
  	return document.createElement(name);
  }

  function createText(data) {
  	return document.createTextNode(data);
  }

  function createComment() {
  	return document.createComment('');
  }

  function addListener(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setAttribute(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
  }

  function setData(text, data) {
  	text.data = '' + data;
  }

  function blankObject() {
  	return Object.create(null);
  }

  function destroy(detach) {
  	this.destroy = noop;
  	this.fire('destroy');
  	this.set = noop;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev(detach) {
  	destroy.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object' || typeof a === 'function';
  }

  function fire(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush(component) {
  	component._lock = true;
  	callAll(component._beforecreate);
  	callAll(component._oncreate);
  	callAll(component._aftercreate);
  	component._lock = false;
  }

  function get$1() {
  	return this._state;
  }

  function init(component, options) {
  	component._handlers = blankObject();
  	component._slots = blankObject();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1(newState) {
  	this._set(assign({}, newState));
  	if (this.root._lock) return;
  	flush(this.root);
  }

  function _set(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign(assign({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage(newState) {
  	assign(this._staged, newState);
  }

  function setDev(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1.call(this, newState);
  }

  function callAll(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev = {
  	destroy: destroyDev,
  	get: get$1,
  	fire: fire,
  	on: on,
  	set: setDev,
  	_recompute: noop,
  	_set: _set,
  	_stage: _stage,
  	_mount: _mount,
  	_differs: _differs
  };

  var stringToArray = function stringToArray(str) {
      var arr = [];
      for (var i = 0; i < str.length; ++i) {
          arr.push(str.charAt(i));
      }
      return arr;
  };

  var pad = function pad(origin, str, width, sym) {
      var s = stringToArray(str);
      for (var i = 0; s.length < width; ++i) {
          if (origin === 'left') {
              s.splice(0, 0, sym);
          } else {
              s.push(sym);
          }
      }
      return s.join('');
  };

  var padLeft = function padLeft(str, sym, width) {
      return pad('left', str, width, sym);
  };

  var hsl2rgb = function hsl2rgb(h, s, l) {
      var q = void 0;
      if (l < 0.5) {
          q = l * (1.0 + s);
      } else if (l >= 0.5) {
          q = l + s - l * s;
      }
      var p = 2.0 * l - q;
      var hk = h / 360;
      var norm = function norm(tc) {
          if (tc < 0) return tc + 1.0;
          if (tc > 1) return tc - 1.0;
          return tc;
      };
      var tr = norm(hk + 1 / 3);
      var tg = norm(hk);
      var tb = norm(hk - 1 / 3);

      var color = function color(tc) {
          if (tc < 1 / 6) {
              return p + (q - p) * 6.0 * tc;
          }
          if (1 / 6 <= tc && tc < 1 / 2) {
              return q;
          }
          if (1 / 2 <= tc && tc < 2 / 3) {
              return p + (q - p) * (2 / 3 - tc) * 6.0;
          }
          return p;
      };

      return {
          r: Math.round(color(tr) * 255),
          g: Math.round(color(tg) * 255),
          b: Math.round(color(tb) * 255)
      };
  };

  var rgb2hsl = function rgb2hsl(R, G, B) {
      var r = R / 255,
          g = G / 255,
          b = B / 255;
      var max = Math.max(r, g, b);
      var min = Math.min(r, g, b);
      var h = void 0;
      if (max == min) {
          h = undefined;
      } else if (max == r && g >= b) {
          h = 60 * (g - b) / (max - min);
      } else if (max == r && g < b) {
          h = 60 * (g - b) / (max - min) + 360;
      } else if (max == g) {
          h = 60 * (b - r) / (max - min) + 120;
      } else if (max == b) {
          h = 60 * (r - g) / (max - min) + 240;
      }
      var l = (max + min) / 2;
      var s = void 0;
      if (l == 0 || max == min) {
          s = 0;
      } else if (0 < l && l <= 0.5) {
          s = (max - min) / (max + min);
      } else if (0.5 < l && l < 1) {
          s = (max - min) / (2 - (max + min));
      }
      return { h: h, s: s, l: l };
  };

  var rgb2hex = function rgb2hex(r, g, b) {
      return '#' + [r, g, b].map(function (x) {
          return padLeft(x.toString(16), '0', 2).toUpperCase();
      }).join('');
  };

  var hex2rgb = function hex2rgb(hex) {
      var _$exec$slice$map = /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/gi.exec(hex).slice(1).map(function (x) {
          return parseInt(x, 16);
      }),
          _$exec$slice$map2 = slicedToArray(_$exec$slice$map, 3),
          r = _$exec$slice$map2[0],
          g = _$exec$slice$map2[1],
          b = _$exec$slice$map2[2];

      return { r: r, g: g, b: b };
  };

  var int2hex = function int2hex(n) {
      return '#' + padLeft(n.toString(16).toUpperCase(), '0', 6);
  };

  var hex2int = function hex2int(hex) {
      var _$exec$slice = /^#([0-9a-f]+)$/gi.exec(hex).slice(1),
          _$exec$slice2 = slicedToArray(_$exec$slice, 1),
          h = _$exec$slice2[0];

      return parseInt(h, 16);
  };

  /* src\Slider\HSlider.html generated by Svelte v2.15.3 */

  var TIMEOUT = 70;
  function hasTooltip(_ref) {
  	var tooltip = _ref.tooltip;

  	switch (typeof tooltip === 'undefined' ? 'undefined' : _typeof(tooltip)) {
  		case 'boolean':
  			return tooltip;
  		case 'string':
  			return tooltip.toLowerCase() === 'true';
  		default:
  			return false;
  	}
  }

  function data() {
  	return {
  		min: 0,
  		max: 0,
  		value: 0,
  		step: 0,
  		tooltip: false
  	};
  }
  var methods = {
  	click: function click(e) {
  		e.stopPropagation();

  		var _get = this.get(),
  		    min = _get.min,
  		    max = _get.max;

  		var a = parseFloat(min);
  		var z = parseFloat(max);

  		var _refs$slider$getBound = this.refs.slider.getBoundingClientRect(),
  		    left = _refs$slider$getBound.left;

  		var _refs$tick$getBoundin = this.refs.tick.getBoundingClientRect(),
  		    width = _refs$tick$getBoundin.width;

  		var d = (e.clientX - width / 2 - left) * this._ratio;
  		var value = d;
  		if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  			this.set({ value: value });
  		}
  	},
  	start: function start(e) {
  		e.stopPropagation();
  		this._moving = true;

  		var _get2 = this.get(),
  		    value = _get2.value,
  		    hasTooltip = _get2.hasTooltip;

  		this._startX = e.clientX;
  		this._start = parseFloat(value);
  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'block';
  		}
  	},
  	move: function move(e) {
  		var _this = this;

  		if (this._moving) {
  			setTimeout(function () {
  				e.stopPropagation();
  				document.body.style.cursor = 'pointer';

  				var _get3 = _this.get(),
  				    min = _get3.min,
  				    max = _get3.max,
  				    step = _get3.step;

  				var a = parseFloat(min);
  				var z = parseFloat(max);
  				var s = parseFloat(step);
  				var d = (e.clientX - _this._startX) * _this._ratio;
  				if (s > 0) {
  					d = Math.floor(d / s) * s;
  				}
  				var value = _this._start + d;
  				if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  					_this.set({ value: value });
  				}
  			}, TIMEOUT);
  		}
  	},
  	stop: function stop(e) {
  		this._moving = false;
  		document.body.style.cursor = 'initial';

  		var _get4 = this.get(),
  		    hasTooltip = _get4.hasTooltip;

  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'none';
  		}
  	},
  	_getRatio: function _getRatio(min, max) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		if (!isNaN(a) && !isNaN(z)) {
  			var _refs$bar$getBounding = this.refs.bar.getBoundingClientRect(),
  			    width = _refs$bar$getBounding.width;

  			return (z - a) / width;
  		} else {
  			return NaN;
  		}
  	},
  	_updateDom: function _updateDom(min, max, value, ratio) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		var v = parseFloat(value);
  		if (!isNaN(a) && !isNaN(z) && !isNaN(v) && a <= v && v <= z) {
  			this.refs.tick.style.left = Math.round(v / ratio) + 'px';
  		}
  	}
  };

  function oncreate() {
  	var _get5 = this.get(),
  	    min = _get5.min,
  	    max = _get5.max;

  	this._ratio = this._getRatio(min, max);
  }
  function onupdate(_ref2) {
  	var changed = _ref2.changed,
  	    current = _ref2.current,
  	    previous = _ref2.previous;

  	if (changed.value) {
  		var value = parseFloat(current.value);
  		if (!isNaN(value)) {
  			var _get6 = this.get(),
  			    min = _get6.min,
  			    max = _get6.max;

  			this._updateDom(min, max, value, this._ratio);
  		}
  	}
  }
  var file = "src\\Slider\\HSlider.html";

  function create_main_fragment(component, ctx) {
  	var div2,
  	    slot_content_default = component._slotted.default,
  	    slot_content_default_after,
  	    text,
  	    div1,
  	    div0,
  	    current;

  	function onwindowmouseup(event) {
  		component.stop(event);	}
  	window.addEventListener("mouseup", onwindowmouseup);

  	function onwindowmousemove(event) {
  		component.move(event);	}
  	window.addEventListener("mousemove", onwindowmousemove);

  	var if_block = ctx.hasTooltip && create_if_block(component, ctx);

  	function mousedown_handler(event) {
  		component.start(event);
  	}

  	function click_handler(event) {
  		component.click(event);
  	}

  	return {
  		c: function create() {
  			div2 = createElement("div");
  			text = createText("\r\n    ");
  			div1 = createElement("div");
  			div0 = createElement("div");
  			if (if_block) if_block.c();
  			addListener(div0, "mousedown", mousedown_handler);
  			div0.className = "hslider-tick";
  			addLoc(div0, file, 4, 8, 198);
  			addListener(div1, "click", click_handler);
  			div1.className = "hslider-bar";
  			addLoc(div1, file, 3, 4, 131);
  			div2.className = "hslider";
  			addLoc(div2, file, 1, 0, 70);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div2, anchor);

  			if (slot_content_default) {
  				append(div2, slot_content_default);
  				append(div2, slot_content_default_after || (slot_content_default_after = createComment()));
  			}

  			append(div2, text);
  			append(div2, div1);
  			append(div1, div0);
  			if (if_block) if_block.m(div0, null);
  			component.refs.tick = div0;
  			component.refs.bar = div1;
  			component.refs.slider = div2;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (ctx.hasTooltip) {
  				if (if_block) {
  					if_block.p(changed, ctx);
  				} else {
  					if_block = create_if_block(component, ctx);
  					if_block.c();
  					if_block.m(div0, null);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			window.removeEventListener("mouseup", onwindowmouseup);

  			window.removeEventListener("mousemove", onwindowmousemove);

  			if (detach) {
  				detachNode(div2);
  			}

  			if (slot_content_default) {
  				reinsertBefore(slot_content_default_after, slot_content_default);
  			}

  			if (if_block) if_block.d();
  			removeListener(div0, "mousedown", mousedown_handler);
  			if (component.refs.tick === div0) component.refs.tick = null;
  			removeListener(div1, "click", click_handler);
  			if (component.refs.bar === div1) component.refs.bar = null;
  			if (component.refs.slider === div2) component.refs.slider = null;
  		}
  	};
  }

  // (6:12) {#if hasTooltip}
  function create_if_block(component, ctx) {
  	var div,
  	    text_value = ctx.parseFloat(ctx.value).toFixed(),
  	    text;

  	return {
  		c: function create() {
  			div = createElement("div");
  			text = createText(text_value);
  			div.className = "hslider-tooltip";
  			addLoc(div, file, 6, 16, 309);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(div, text);
  			component.refs.tooltip = div;
  		},

  		p: function update(changed, ctx) {
  			if ((changed.parseFloat || changed.value) && text_value !== (text_value = ctx.parseFloat(ctx.value).toFixed())) {
  				setData(text, text_value);
  			}
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.tooltip === div) component.refs.tooltip = null;
  		}
  	};
  }

  function HSlider(options) {
  	var _this2 = this;

  	this._debugName = '<HSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(assign({ parseFloat: parseFloat }, data()), options.data);

  	this._recompute({ tooltip: 1 }, this._state);
  	if (!('tooltip' in this._state)) console.warn("<HSlider> was created without expected data property 'tooltip'");

  	if (!('value' in this._state)) console.warn("<HSlider> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate];

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate.call(_this2);
  		_this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(HSlider.prototype, protoDev);
  assign(HSlider.prototype, methods);

  HSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hasTooltip' in newState && !this._updatingReadonlyProperty) throw new Error("<HSlider>: Cannot set read-only property 'hasTooltip'");
  };

  HSlider.prototype._recompute = function _recompute(changed, state) {
  	if (changed.tooltip) {
  		if (this._differs(state.hasTooltip, state.hasTooltip = hasTooltip(state))) changed.hasTooltip = true;
  	}
  };

  /* src\Slider\VSlider.html generated by Svelte v2.15.3 */

  var TIMEOUT$1 = 70;
  function hasTooltip$1(_ref) {
  	var tooltip = _ref.tooltip;

  	switch (typeof tooltip === 'undefined' ? 'undefined' : _typeof(tooltip)) {
  		case 'boolean':
  			return tooltip;
  		case 'string':
  			return tooltip.toLowerCase() === 'true';
  		default:
  			return false;
  	}
  }

  function data$1() {
  	return {
  		min: 0,
  		max: 0,
  		value: 0,
  		step: 0,
  		tooltip: false
  	};
  }
  var methods$1 = {
  	click: function click(e) {
  		e.stopPropagation();

  		var _get = this.get(),
  		    min = _get.min,
  		    max = _get.max;

  		var a = parseFloat(min);
  		var z = parseFloat(max);

  		var _refs$slider$getBound = this.refs.slider.getBoundingClientRect(),
  		    top = _refs$slider$getBound.top;

  		var d = (e.clientY - top) * this._ratio;
  		var value = d;
  		if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  			this.set({ value: value });
  		}
  	},
  	start: function start(e) {
  		e.stopPropagation();
  		this._moving = true;

  		var _get2 = this.get(),
  		    value = _get2.value,
  		    hasTooltip = _get2.hasTooltip;

  		this._startX = e.clientY;
  		this._start = parseFloat(value);
  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'block';
  		}
  	},
  	move: function move(e) {
  		var _this = this;

  		if (this._moving) {
  			setTimeout(function () {
  				e.stopPropagation();
  				document.body.style.cursor = 'pointer';

  				var _get3 = _this.get(),
  				    min = _get3.min,
  				    max = _get3.max,
  				    step = _get3.step;

  				var a = parseFloat(min);
  				var z = parseFloat(max);
  				var s = parseFloat(step);
  				var d = (e.clientY - _this._startX) * _this._ratio;
  				if (s > 0) {
  					d = Math.floor(d / s) * s;
  				}
  				var value = _this._start + d;
  				if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  					_this.set({ value: value });
  				}
  			}, TIMEOUT$1);
  		}
  	},
  	stop: function stop(e) {
  		e.stopPropagation();
  		this._moving = false;

  		var _get4 = this.get(),
  		    hasTooltip = _get4.hasTooltip;

  		document.body.style.cursor = 'initial';
  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'none';
  		}
  	},
  	_getRatio: function _getRatio(min, max) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		if (!isNaN(a) && !isNaN(z)) {
  			var _refs$bar$getBounding = this.refs.bar.getBoundingClientRect(),
  			    height = _refs$bar$getBounding.height;

  			return (z - a) / height;
  		} else {
  			return NaN;
  		}
  	},
  	_updateDom: function _updateDom(min, max, value, ratio) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		var v = parseFloat(value);
  		if (!isNaN(a) && !isNaN(z) && !isNaN(v) && a <= v && v <= z) {
  			this.refs.tick.style.top = v / ratio + 'px';
  		}
  	}
  };

  function oncreate$1() {
  	var _get5 = this.get(),
  	    min = _get5.min,
  	    max = _get5.max;

  	this._ratio = this._getRatio(min, max);
  }
  function onupdate$1(_ref2) {
  	var changed = _ref2.changed,
  	    current = _ref2.current,
  	    previous = _ref2.previous;

  	if (changed.value) {
  		var value = parseFloat(current.value);
  		if (!isNaN(value)) {
  			var _get6 = this.get(),
  			    min = _get6.min,
  			    max = _get6.max;

  			this._updateDom(min, max, value, this._ratio);
  		}
  	}
  }
  var file$1 = "src\\Slider\\VSlider.html";

  function create_main_fragment$1(component, ctx) {
  	var div2,
  	    slot_content_default = component._slotted.default,
  	    slot_content_default_after,
  	    text,
  	    div1,
  	    div0,
  	    current;

  	function onwindowmouseup(event) {
  		component.stop(event);	}
  	window.addEventListener("mouseup", onwindowmouseup);

  	function onwindowmousemove(event) {
  		component.move(event);	}
  	window.addEventListener("mousemove", onwindowmousemove);

  	var if_block = ctx.hasTooltip && create_if_block$1(component, ctx);

  	function mousedown_handler(event) {
  		component.start(event);
  	}

  	function click_handler(event) {
  		component.click(event);
  	}

  	return {
  		c: function create() {
  			div2 = createElement("div");
  			text = createText("\r\n    ");
  			div1 = createElement("div");
  			div0 = createElement("div");
  			if (if_block) if_block.c();
  			addListener(div0, "mousedown", mousedown_handler);
  			div0.className = "vslider-tick";
  			addLoc(div0, file$1, 4, 8, 222);
  			addListener(div1, "click", click_handler);
  			div1.className = "vslider-bar";
  			addLoc(div1, file$1, 3, 4, 135);
  			div2.className = "vslider";
  			addLoc(div2, file$1, 1, 0, 70);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div2, anchor);

  			if (slot_content_default) {
  				append(div2, slot_content_default);
  				append(div2, slot_content_default_after || (slot_content_default_after = createComment()));
  			}

  			append(div2, text);
  			append(div2, div1);
  			append(div1, div0);
  			if (if_block) if_block.m(div0, null);
  			component.refs.tick = div0;
  			component.refs.bar = div1;
  			component.refs.slider = div2;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (ctx.hasTooltip) {
  				if (if_block) {
  					if_block.p(changed, ctx);
  				} else {
  					if_block = create_if_block$1(component, ctx);
  					if_block.c();
  					if_block.m(div0, null);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			window.removeEventListener("mouseup", onwindowmouseup);

  			window.removeEventListener("mousemove", onwindowmousemove);

  			if (detach) {
  				detachNode(div2);
  			}

  			if (slot_content_default) {
  				reinsertBefore(slot_content_default_after, slot_content_default);
  			}

  			if (if_block) if_block.d();
  			removeListener(div0, "mousedown", mousedown_handler);
  			if (component.refs.tick === div0) component.refs.tick = null;
  			removeListener(div1, "click", click_handler);
  			if (component.refs.bar === div1) component.refs.bar = null;
  			if (component.refs.slider === div2) component.refs.slider = null;
  		}
  	};
  }

  // (6:12) {#if hasTooltip}
  function create_if_block$1(component, ctx) {
  	var div,
  	    text_value = ctx.parseFloat(ctx.value).toFixed(),
  	    text;

  	return {
  		c: function create() {
  			div = createElement("div");
  			text = createText(text_value);
  			div.className = "vslider-tooltip";
  			addLoc(div, file$1, 6, 16, 333);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(div, text);
  			component.refs.tooltip = div;
  		},

  		p: function update(changed, ctx) {
  			if ((changed.parseFloat || changed.value) && text_value !== (text_value = ctx.parseFloat(ctx.value).toFixed())) {
  				setData(text, text_value);
  			}
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.tooltip === div) component.refs.tooltip = null;
  		}
  	};
  }

  function VSlider(options) {
  	var _this2 = this;

  	this._debugName = '<VSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(assign({ parseFloat: parseFloat }, data$1()), options.data);

  	this._recompute({ tooltip: 1 }, this._state);
  	if (!('tooltip' in this._state)) console.warn("<VSlider> was created without expected data property 'tooltip'");

  	if (!('value' in this._state)) console.warn("<VSlider> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$1];

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$1(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate$1.call(_this2);
  		_this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(VSlider.prototype, protoDev);
  assign(VSlider.prototype, methods$1);

  VSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hasTooltip' in newState && !this._updatingReadonlyProperty) throw new Error("<VSlider>: Cannot set read-only property 'hasTooltip'");
  };

  VSlider.prototype._recompute = function _recompute(changed, state) {
  	if (changed.tooltip) {
  		if (this._differs(state.hasTooltip, state.hasTooltip = hasTooltip$1(state))) changed.hasTooltip = true;
  	}
  };

  /* src\Slider\Slider.html generated by Svelte v2.15.3 */

  function data$2() {
  	return { HSlider: HSlider, VSlider: VSlider };
  }
  function create_main_fragment$2(component, ctx) {
  	var slot_content_default = component._slotted.default,
  	    switch_instance_updating = {},
  	    switch_instance_anchor,
  	    current;

  	var switch_value = ctx.orientation === 'horizontal' ? ctx.HSlider : ctx.VSlider;

  	function switch_props(ctx) {
  		var switch_instance_initial_data = {};
  		if (ctx.min !== void 0) {
  			switch_instance_initial_data.min = ctx.min;
  			switch_instance_updating.min = true;
  		}
  		if (ctx.max !== void 0) {
  			switch_instance_initial_data.max = ctx.max;
  			switch_instance_updating.max = true;
  		}
  		if (ctx.value !== void 0) {
  			switch_instance_initial_data.value = ctx.value;
  			switch_instance_updating.value = true;
  		}
  		if (ctx.step !== void 0) {
  			switch_instance_initial_data.step = ctx.step;
  			switch_instance_updating.step = true;
  		}
  		if (ctx.tooltip !== void 0) {
  			switch_instance_initial_data.tooltip = ctx.tooltip;
  			switch_instance_updating.tooltip = true;
  		}
  		return {
  			root: component.root,
  			store: component.store,
  			slots: { default: createFragment() },
  			data: switch_instance_initial_data,
  			_bind: function _bind(changed, childState) {
  				var newState = {};
  				if (!switch_instance_updating.min && changed.min) {
  					newState.min = childState.min;
  				}

  				if (!switch_instance_updating.max && changed.max) {
  					newState.max = childState.max;
  				}

  				if (!switch_instance_updating.value && changed.value) {
  					newState.value = childState.value;
  				}

  				if (!switch_instance_updating.step && changed.step) {
  					newState.step = childState.step;
  				}

  				if (!switch_instance_updating.tooltip && changed.tooltip) {
  					newState.tooltip = childState.tooltip;
  				}
  				component._set(newState);
  				switch_instance_updating = {};
  			}
  		};
  	}

  	if (switch_value) {
  		var switch_instance = new switch_value(switch_props(ctx));

  		component.root._beforecreate.push(function () {
  			switch_instance._bind({ min: 1, max: 1, value: 1, step: 1, tooltip: 1 }, switch_instance.get());
  		});
  	}

  	return {
  		c: function create() {
  			if (switch_instance) switch_instance._fragment.c();
  			switch_instance_anchor = createComment();
  		},

  		m: function mount(target, anchor) {
  			if (slot_content_default) {
  				append(switch_instance._slotted.default, slot_content_default);
  			}

  			if (switch_instance) {
  				switch_instance._mount(target, anchor);
  			}

  			insert(target, switch_instance_anchor, anchor);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var switch_instance_changes = {};
  			if (!switch_instance_updating.min && changed.min) {
  				switch_instance_changes.min = ctx.min;
  				switch_instance_updating.min = ctx.min !== void 0;
  			}
  			if (!switch_instance_updating.max && changed.max) {
  				switch_instance_changes.max = ctx.max;
  				switch_instance_updating.max = ctx.max !== void 0;
  			}
  			if (!switch_instance_updating.value && changed.value) {
  				switch_instance_changes.value = ctx.value;
  				switch_instance_updating.value = ctx.value !== void 0;
  			}
  			if (!switch_instance_updating.step && changed.step) {
  				switch_instance_changes.step = ctx.step;
  				switch_instance_updating.step = ctx.step !== void 0;
  			}
  			if (!switch_instance_updating.tooltip && changed.tooltip) {
  				switch_instance_changes.tooltip = ctx.tooltip;
  				switch_instance_updating.tooltip = ctx.tooltip !== void 0;
  			}

  			if (switch_value !== (switch_value = ctx.orientation === 'horizontal' ? ctx.HSlider : ctx.VSlider)) {
  				if (switch_instance) {
  					var old_component = switch_instance;
  					old_component._fragment.o(function () {
  						old_component.destroy();
  					});
  				}

  				if (switch_value) {
  					switch_instance = new switch_value(switch_props(ctx));

  					component.root._beforecreate.push(function () {
  						var changed = {};
  						if (ctx.min === void 0) changed.min = 1;
  						if (ctx.max === void 0) changed.max = 1;
  						if (ctx.value === void 0) changed.value = 1;
  						if (ctx.step === void 0) changed.step = 1;
  						if (ctx.tooltip === void 0) changed.tooltip = 1;
  						switch_instance._bind(changed, switch_instance.get());
  					});
  					switch_instance._fragment.c();

  					slot.m(switch_instance._slotted.default, null);
  					switch_instance._mount(switch_instance_anchor.parentNode, switch_instance_anchor);
  				} else {
  					switch_instance = null;
  				}
  			} else if (switch_value) {
  				switch_instance._set(switch_instance_changes);
  				switch_instance_updating = {};
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (switch_instance) switch_instance._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (slot_content_default) {
  				reinsertChildren(switch_instance._slotted.default, slot_content_default);
  			}

  			if (detach) {
  				detachNode(switch_instance_anchor);
  			}

  			if (switch_instance) switch_instance.destroy(detach);
  		}
  	};
  }

  function Slider(options) {
  	this._debugName = '<Slider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$2(), options.data);
  	if (!('orientation' in this._state)) console.warn("<Slider> was created without expected data property 'orientation'");
  	if (!('HSlider' in this._state)) console.warn("<Slider> was created without expected data property 'HSlider'");
  	if (!('VSlider' in this._state)) console.warn("<Slider> was created without expected data property 'VSlider'");
  	if (!('min' in this._state)) console.warn("<Slider> was created without expected data property 'min'");
  	if (!('max' in this._state)) console.warn("<Slider> was created without expected data property 'max'");
  	if (!('value' in this._state)) console.warn("<Slider> was created without expected data property 'value'");
  	if (!('step' in this._state)) console.warn("<Slider> was created without expected data property 'step'");
  	if (!('tooltip' in this._state)) console.warn("<Slider> was created without expected data property 'tooltip'");
  	this._intro = !!options.intro;

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$2(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(Slider.prototype, protoDev);

  Slider.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\AlphaSlider\AlphaSlider.html generated by Svelte v2.15.3 */

  function data$3() {
  	return {
  		order: 'asc',
  		alpha: 100,
  		hue: 0,
  		saturation: 1.0,
  		lightness: 0.5
  	};
  }
  var methods$2 = {};

  function onupdate$2(_ref) {
  	var changed = _ref.changed,
  	    current = _ref.current,
  	    previous = _ref.previous;

  	if (changed.hue || changed.saturation || changed.lightness) {
  		var _hsl2rgb = hsl2rgb(current.hue, current.saturation, current.lightness),
  		    r = _hsl2rgb.r,
  		    g = _hsl2rgb.g,
  		    b = _hsl2rgb.b;

  		var ctx = this.refs.alpha.getContext('2d');
  		var imgData = ctx.getImageData(0, 0, this.refs.alpha.width, this.refs.alpha.height);
  		var _data = imgData.data,
  		    width = imgData.width,
  		    height = imgData.height;

  		for (var i = 0, j = 0, k = 0; i < _data.length; i += 4, ++j) {
  			if (j >= width) {
  				++k;
  				j = 0;
  			}
  			var a = k / height;

  			var _get = this.get(),
  			    order = _get.order;

  			a = order === 'desc' ? 1.0 - a : a;
  			_data[i + 0] = r;
  			_data[i + 1] = g;
  			_data[i + 2] = b;
  			_data[i + 3] = Math.round(255 * a);
  		}
  		ctx.putImageData(imgData, 0, 0);
  	}
  }
  var file$3 = "src\\AlphaSlider\\AlphaSlider.html";

  function create_main_fragment$3(component, ctx) {
  	var div,
  	    canvas,
  	    slider_updating = {},
  	    current;

  	var slider_initial_data = {
  		orientation: "vertical",
  		tooltip: "true",
  		min: "0",
  		max: "100",
  		high: "0",
  		step: "0"
  	};
  	if (ctx.alpha !== void 0) {
  		slider_initial_data.value = ctx.alpha;
  		slider_updating.value = true;
  	}
  	var slider = new Slider({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: slider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!slider_updating.value && changed.value) {
  				newState.alpha = childState.value;
  			}
  			component._set(newState);
  			slider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		slider._bind({ value: 1 }, slider.get());
  	});

  	component.refs.slider = slider;

  	return {
  		c: function create() {
  			div = createElement("div");
  			canvas = createElement("canvas");
  			slider._fragment.c();
  			addLoc(canvas, file$3, 2, 8, 154);
  			div.className = "alpha-slider";
  			addLoc(div, file$3, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(slider._slotted.default, canvas);
  			component.refs.alpha = canvas;
  			slider._mount(div, null);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var slider_changes = {};
  			if (!slider_updating.value && changed.alpha) {
  				slider_changes.value = ctx.alpha;
  				slider_updating.value = ctx.alpha !== void 0;
  			}
  			slider._set(slider_changes);
  			slider_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (slider) slider._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.alpha === canvas) component.refs.alpha = null;
  			slider.destroy();
  			if (component.refs.slider === slider) component.refs.slider = null;
  		}
  	};
  }

  function AlphaSlider(options) {
  	var _this = this;

  	this._debugName = '<AlphaSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$3(), options.data);
  	if (!('alpha' in this._state)) console.warn("<AlphaSlider> was created without expected data property 'alpha'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$2];

  	this._fragment = create_main_fragment$3(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(AlphaSlider.prototype, protoDev);
  assign(AlphaSlider.prototype, methods$2);

  AlphaSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\ColorArea\ColorArea.html generated by Svelte v2.15.3 */

  var TIMEOUT$2 = 70;
  function data$4() {
      return {
          hue: 0,
          saturation: 1.0,
          lightness: 0.5
      };
  }
  var methods$3 = {
      click: function click(e) {
          e.stopPropagation();

          var _refs$canvas$getBound = this.refs.canvas.getBoundingClientRect(),
              left = _refs$canvas$getBound.left,
              top = _refs$canvas$getBound.top;

          var x = e.clientX - left;
          var y = e.clientY - top;
          var saturation = 1 - x / this._width;
          var lightness = 1 - y / this._height;
          this.set({ saturation: saturation, lightness: lightness });
      },
      start: function start(e) {
          e.stopPropagation();
          this._offsetX = e.offsetX;
          this._offsetY = e.offsetY;
          this._moving = true;
      },
      move: function move(e) {
          if (this._moving) {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';

              var _refs$canvas$getBound2 = this.refs.canvas.getBoundingClientRect(),
                  left = _refs$canvas$getBound2.left,
                  top = _refs$canvas$getBound2.top;
              // handle x


              var x = e.clientX - this._offsetX + this._halfWidth - left;
              if (x < 0) {
                  x = 0;
              } else if (x > this._width) {
                  x = this._width;
              }
              // handle y
              var y = e.clientY - this._offsetY + this._halfHeight - top;
              if (y < 0) {
                  y = 0;
              } else if (y > this._height) {
                  y = this._height;
              }
              var saturation = 1 - x / this._width;
              var lightness = 1 - y / this._height;

              this.set({ saturation: saturation, lightness: lightness });
          }
      },
      stop: function stop(e) {
          if (this._moving) {
              e.stopPropagation();
              document.body.style.cursor = 'initial';
              this._offsetX = 0;
              this._offsetY = 0;
              this._moving = false;
          }
      }
  };

  function oncreate$2() {
      var samplerRect = this.refs.sampler.getBoundingClientRect();
      this._halfWidth = samplerRect.width / 2;
      this._halfHeight = samplerRect.height / 2;
      this._width = this.refs.canvas.clientWidth;
      this._height = this.refs.canvas.clientHeight;
      this._moving = false;
      this._offsetX = 0;
      this._offsetY = 0;
  }
  function onupdate$3(_ref) {
      var _this = this;

      var changed = _ref.changed,
          current = _ref.current,
          previous = _ref.previous;

      setTimeout(function () {
          if (changed.saturation) {
              var s = current.saturation;
              _this.refs.sampler.style.left = Math.round((1 - s) * _this._width) + 'px';
          }
          if (changed.lightness) {
              var l = current.lightness;
              _this.refs.sampler.style.top = Math.round((1 - l) * _this._height) + 'px';

              var _hsl2rgb = hsl2rgb(0, 0, 1 - l),
                  r = _hsl2rgb.r,
                  g = _hsl2rgb.g,
                  b = _hsl2rgb.b;

              _this.refs.sampler.style.borderColor = 'rgb(' + [r, g, b].join(',') + ')';
          }
          if (changed.hue) {
              var _get = _this.get(),
                  saturation = _get.saturation,
                  lightness = _get.lightness;
              var h = current.hue;
              var ctx = _this.refs.canvas.getContext('2d');
              var imgData = ctx.getImageData(0, 0, _this.refs.canvas.width, _this.refs.canvas.height);
              var _data = imgData.data,
                  width = imgData.width,
                  height = imgData.height;
              // let buff = new ArrayBuffer(width * height * 4);
              // let data = new DataView(buff);                    

              var k = 0;
              // let data = new Uint8ClampedArray(width * height * 4);
              // let data = new Uint8Array(width * height * 4);
              // let data = imgData.data;
              for (var i = height - 1; i >= 0; --i) {
                  for (var j = width - 1; j >= 0; --j) {
                      var _s2 = j / width;
                      var _l2 = i / height;

                      var _hsl2rgb2 = hsl2rgb(h, _s2, _l2),
                          _r = _hsl2rgb2.r,
                          _g = _hsl2rgb2.g,
                          _b = _hsl2rgb2.b;

                      _data[k + 0] = _r;
                      _data[k + 1] = _g;
                      _data[k + 2] = _b;
                      _data[k + 3] = 255;
                      // data.setUint8(k + 0, r);
                      // data.setUint8(k + 1, g);
                      // data.setUint8(k + 2, b);
                      // data.setUint8(k + 3, Math.round (a * 255));
                      k += 4;
                  }
              }
              // imgData.data.set(data);
              ctx.putImageData(imgData, 0, 0);
          }
      }, TIMEOUT$2);
  }
  var file$4 = "src\\ColorArea\\ColorArea.html";

  function create_main_fragment$4(component, ctx) {
      var div1, canvas, text, div0, current;

      function onwindowmousemove(event) {
          component.move(event);    }
      window.addEventListener("mousemove", onwindowmousemove);

      function onwindowmouseup(event) {
          component.stop(event);    }
      window.addEventListener("mouseup", onwindowmouseup);

      function click_handler(event) {
          component.click(event);
      }

      function mousedown_handler(event) {
          component.start(event);
      }

      return {
          c: function create() {
              div1 = createElement("div");
              canvas = createElement("canvas");
              text = createText("\r\n    ");
              div0 = createElement("div");
              addListener(canvas, "click", click_handler);
              addLoc(canvas, file$4, 2, 4, 119);
              addListener(div0, "mousedown", mousedown_handler);
              div0.className = "sampler";
              addLoc(div0, file$4, 3, 4, 177);
              div1.className = "color-area";
              addLoc(div1, file$4, 1, 0, 71);
          },

          m: function mount(target, anchor) {
              insert(target, div1, anchor);
              append(div1, canvas);
              component.refs.canvas = canvas;
              append(div1, text);
              append(div1, div0);
              component.refs.sampler = div0;
              component.refs.container = div1;
              current = true;
          },

          p: noop,

          i: function intro(target, anchor) {
              if (current) return;

              this.m(target, anchor);
          },

          o: run,

          d: function destroy$$1(detach) {
              window.removeEventListener("mousemove", onwindowmousemove);

              window.removeEventListener("mouseup", onwindowmouseup);

              if (detach) {
                  detachNode(div1);
              }

              removeListener(canvas, "click", click_handler);
              if (component.refs.canvas === canvas) component.refs.canvas = null;
              removeListener(div0, "mousedown", mousedown_handler);
              if (component.refs.sampler === div0) component.refs.sampler = null;
              if (component.refs.container === div1) component.refs.container = null;
          }
      };
  }

  function ColorArea(options) {
      var _this2 = this;

      this._debugName = '<ColorArea>';
      if (!options || !options.target && !options.root) {
          throw new Error("'target' is a required option");
      }

      init(this, options);
      this.refs = {};
      this._state = assign(data$4(), options.data);
      this._intro = !!options.intro;
      this._handlers.update = [onupdate$3];

      this._fragment = create_main_fragment$4(this, this._state);

      this.root._oncreate.push(function () {
          oncreate$2.call(_this2);
          _this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
      });

      if (options.target) {
          if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
          this._fragment.c();
          this._mount(options.target, options.anchor);

          flush(this);
      }

      this._intro = true;
  }

  assign(ColorArea.prototype, protoDev);
  assign(ColorArea.prototype, methods$3);

  ColorArea.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\ColorSlider\ColorSlider.html generated by Svelte v2.15.3 */

  function data$5() {
  	return { hue: 0 };
  }
  function onupdate$4() {
  	var ctx = this.refs.color.getContext('2d');
  	var imgData = ctx.createImageData(this.refs.color.width, this.refs.color.height);
  	var data = imgData.data,
  	    width = imgData.width;

  	for (var i = 0; i < data.length; i += 4) {
  		var h = i / 4 % width * 360 / width;

  		var _hsl2rgb = hsl2rgb(h, this.constructor.SATURATION, this.constructor.LIGHTNESS),
  		    r = _hsl2rgb.r,
  		    g = _hsl2rgb.g,
  		    b = _hsl2rgb.b;

  		data[i + 0] = r;
  		data[i + 1] = g;
  		data[i + 2] = b;
  		data[i + 3] = this.constructor.ALPHA;
  	}
  	ctx.putImageData(imgData, 0, 0);
  }
  function setup(Component) {
  	Component.SATURATION = 1.0;
  	Component.LIGHTNESS = 0.5;
  	Component.ALPHA = 255;
  }
  var file$5 = "src\\ColorSlider\\ColorSlider.html";

  function create_main_fragment$5(component, ctx) {
  	var div,
  	    canvas,
  	    slider_updating = {},
  	    current;

  	var slider_initial_data = {
  		orientation: "horizontal",
  		tooltip: "false",
  		min: "0",
  		max: "360",
  		high: "0",
  		step: "0"
  	};
  	if (ctx.hue !== void 0) {
  		slider_initial_data.value = ctx.hue;
  		slider_updating.value = true;
  	}
  	var slider = new Slider({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: slider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!slider_updating.value && changed.value) {
  				newState.hue = childState.value;
  			}
  			component._set(newState);
  			slider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		slider._bind({ value: 1 }, slider.get());
  	});

  	component.refs.slider = slider;

  	return {
  		c: function create() {
  			div = createElement("div");
  			canvas = createElement("canvas");
  			slider._fragment.c();
  			addLoc(canvas, file$5, 2, 8, 155);
  			div.className = "color-slider";
  			addLoc(div, file$5, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(slider._slotted.default, canvas);
  			component.refs.color = canvas;
  			slider._mount(div, null);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var slider_changes = {};
  			if (!slider_updating.value && changed.hue) {
  				slider_changes.value = ctx.hue;
  				slider_updating.value = ctx.hue !== void 0;
  			}
  			slider._set(slider_changes);
  			slider_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (slider) slider._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.color === canvas) component.refs.color = null;
  			slider.destroy();
  			if (component.refs.slider === slider) component.refs.slider = null;
  		}
  	};
  }

  function ColorSlider(options) {
  	var _this = this;

  	this._debugName = '<ColorSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$5(), options.data);
  	if (!('hue' in this._state)) console.warn("<ColorSlider> was created without expected data property 'hue'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$4];

  	this._fragment = create_main_fragment$5(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(ColorSlider.prototype, protoDev);

  ColorSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  setup(ColorSlider);

  /* src\ColorPicker\ColorPicker.html generated by Svelte v2.15.3 */

  function value(_ref) {
  	var mode = _ref.mode,
  	    hex = _ref.hex,
  	    rgb = _ref.rgb;

  	return mode === 'hex' ? hex : rgb;
  }

  function hex(_ref2) {
  	var hue = _ref2.hue,
  	    saturation = _ref2.saturation,
  	    lightness = _ref2.lightness;

  	var _hsl2rgb = hsl2rgb(hue, saturation, lightness),
  	    r = _hsl2rgb.r,
  	    g = _hsl2rgb.g,
  	    b = _hsl2rgb.b;

  	return rgb2hex(r, g, b);
  }

  function rgb(_ref3) {
  	var hue = _ref3.hue,
  	    saturation = _ref3.saturation,
  	    lightness = _ref3.lightness;

  	var _hsl2rgb2 = hsl2rgb(hue, saturation, lightness),
  	    r = _hsl2rgb2.r,
  	    g = _hsl2rgb2.g,
  	    b = _hsl2rgb2.b;

  	return [r, g, b].join(',');
  }

  function rgba(_ref4) {
  	var hue = _ref4.hue,
  	    saturation = _ref4.saturation,
  	    lightness = _ref4.lightness,
  	    alpha = _ref4.alpha;

  	var _hsl2rgb3 = hsl2rgb(hue, saturation, lightness),
  	    r = _hsl2rgb3.r,
  	    g = _hsl2rgb3.g,
  	    b = _hsl2rgb3.b;

  	var a = alpha / 100;
  	return 'rgba(' + [r, g, b, a].join(',') + ')';
  }

  function data$6() {
  	return {
  		mode: 'hex',
  		alpha: 100,
  		hue: 0,
  		saturation: 1.0,
  		lightness: 0.5
  	};
  }
  var methods$4 = {
  	prevent: function prevent(e) {
  		e.stopPropagation();
  		e.preventDefault();
  	},
  	change: function change(_ref5) {
  		var value = _ref5.target.value;

  		var _get = this.get(),
  		    mode = _get.mode;

  		var _r$g$b = { r: 0, g: 0, b: 0 },
  		    r = _r$g$b.r,
  		    g = _r$g$b.g,
  		    b = _r$g$b.b;

  		if (mode === 'hex') {
  			var _hex2rgb = hex2rgb(value),
  			    r = _hex2rgb.r,
  			    g = _hex2rgb.g,
  			    b = _hex2rgb.b;
  		} else if (mode === 'rgb') {
  			var _value$split$map = value.split(',').map(function (x) {
  				return parseInt(x, 10);
  			}),
  			    _value$split$map2 = slicedToArray(_value$split$map, 3),
  			    r = _value$split$map2[0],
  			    g = _value$split$map2[1],
  			    b = _value$split$map2[2];
  		}

  		var _rgb2hsl = rgb2hsl(r, g, b),
  		    h = _rgb2hsl.h,
  		    s = _rgb2hsl.s,
  		    l = _rgb2hsl.l;

  		this.set({ hue: h, saturation: s, lightness: l });
  	},
  	keydown: function keydown(e) {
  		if (e.keyCode === 13) {
  			this.change(this.refs.box.value);
  		}
  	}
  };

  function onupdate$5(_ref6) {
  	var changed = _ref6.changed,
  	    current = _ref6.current;

  	if (changed.rgba) {
  		this.refs.sample.style.backgroundColor = current.rgba;
  	}
  	if (changed.value) {
  		this.refs.box.value = current.value;
  	}
  }
  var file$6 = "src\\ColorPicker\\ColorPicker.html";

  function create_main_fragment$6(component, ctx) {
  	var table,
  	    tr0,
  	    td0,
  	    span0,
  	    text0,
  	    td1,
  	    span1,
  	    text1,
  	    text2,
  	    input,
  	    text3,
  	    td2,
  	    span2,
  	    text4,
  	    td3,
  	    text5,
  	    tr1,
  	    td4,
  	    colorarea_updating = {},
  	    text6,
  	    td5,
  	    alphaslider_updating = {},
  	    text7,
  	    tr2,
  	    td6,
  	    colorslider_updating = {},
  	    text8,
  	    td7,
  	    current;

  	function change_handler(event) {
  		component.change(event);
  	}

  	function click_handler(event) {
  		component.set({ mode: ctx.mode === 'hex' ? 'rgb' : 'hex' });
  	}

  	var colorarea_initial_data = {};
  	if (ctx.hue !== void 0) {
  		colorarea_initial_data.hue = ctx.hue;
  		colorarea_updating.hue = true;
  	}
  	if (ctx.saturation !== void 0) {
  		colorarea_initial_data.saturation = ctx.saturation;
  		colorarea_updating.saturation = true;
  	}
  	if (ctx.lightness !== void 0) {
  		colorarea_initial_data.lightness = ctx.lightness;
  		colorarea_updating.lightness = true;
  	}
  	var colorarea = new ColorArea({
  		root: component.root,
  		store: component.store,
  		data: colorarea_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!colorarea_updating.hue && changed.hue) {
  				newState.hue = childState.hue;
  			}

  			if (!colorarea_updating.saturation && changed.saturation) {
  				newState.saturation = childState.saturation;
  			}

  			if (!colorarea_updating.lightness && changed.lightness) {
  				newState.lightness = childState.lightness;
  			}
  			component._set(newState);
  			colorarea_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		colorarea._bind({ hue: 1, saturation: 1, lightness: 1 }, colorarea.get());
  	});

  	var alphaslider_initial_data = {};
  	if (ctx.alpha !== void 0) {
  		alphaslider_initial_data.alpha = ctx.alpha;
  		alphaslider_updating.alpha = true;
  	}
  	if (ctx.hue !== void 0) {
  		alphaslider_initial_data.hue = ctx.hue;
  		alphaslider_updating.hue = true;
  	}
  	if (ctx.saturation !== void 0) {
  		alphaslider_initial_data.saturation = ctx.saturation;
  		alphaslider_updating.saturation = true;
  	}
  	if (ctx.lightness !== void 0) {
  		alphaslider_initial_data.lightness = ctx.lightness;
  		alphaslider_updating.lightness = true;
  	}
  	var alphaslider = new AlphaSlider({
  		root: component.root,
  		store: component.store,
  		data: alphaslider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!alphaslider_updating.alpha && changed.alpha) {
  				newState.alpha = childState.alpha;
  			}

  			if (!alphaslider_updating.hue && changed.hue) {
  				newState.hue = childState.hue;
  			}

  			if (!alphaslider_updating.saturation && changed.saturation) {
  				newState.saturation = childState.saturation;
  			}

  			if (!alphaslider_updating.lightness && changed.lightness) {
  				newState.lightness = childState.lightness;
  			}
  			component._set(newState);
  			alphaslider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		alphaslider._bind({ alpha: 1, hue: 1, saturation: 1, lightness: 1 }, alphaslider.get());
  	});

  	var colorslider_initial_data = {};
  	if (ctx.hue !== void 0) {
  		colorslider_initial_data.hue = ctx.hue;
  		colorslider_updating.hue = true;
  	}
  	var colorslider = new ColorSlider({
  		root: component.root,
  		store: component.store,
  		data: colorslider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!colorslider_updating.hue && changed.hue) {
  				newState.hue = childState.hue;
  			}
  			component._set(newState);
  			colorslider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		colorslider._bind({ hue: 1 }, colorslider.get());
  	});

  	function click_handler_1(event) {
  		component.prevent(event);
  	}

  	function dragstart_handler(event) {
  		component.prevent(event);
  	}

  	return {
  		c: function create() {
  			table = createElement("table");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			span0 = createElement("span");
  			text0 = createText("\r\n        ");
  			td1 = createElement("td");
  			span1 = createElement("span");
  			text1 = createText(ctx.mode);
  			text2 = createText("\r\n            ");
  			input = createElement("input");
  			text3 = createText("\r\n        ");
  			td2 = createElement("td");
  			span2 = createElement("span");
  			text4 = createText("\r\n        ");
  			td3 = createElement("td");
  			text5 = createText("\r\n    ");
  			tr1 = createElement("tr");
  			td4 = createElement("td");
  			colorarea._fragment.c();
  			text6 = createText("\r\n        ");
  			td5 = createElement("td");
  			alphaslider._fragment.c();
  			text7 = createText("\r\n    ");
  			tr2 = createElement("tr");
  			td6 = createElement("td");
  			colorslider._fragment.c();
  			text8 = createText("\r\n        ");
  			td7 = createElement("td");
  			span0.className = "color-picker-sample";
  			addLoc(span0, file$6, 3, 12, 126);
  			addLoc(td0, file$6, 2, 8, 108);
  			span1.className = "color-picker-mode";
  			addLoc(span1, file$6, 6, 12, 221);
  			addListener(input, "change", change_handler);
  			setAttribute(input, "type", "text");
  			input.className = "color-picker-box";
  			addLoc(input, file$6, 7, 12, 280);
  			addLoc(td1, file$6, 5, 8, 203);
  			addListener(span2, "click", click_handler);
  			span2.className = "color-picker-box-button";
  			addLoc(span2, file$6, 10, 12, 403);
  			addLoc(td2, file$6, 9, 8, 385);
  			addLoc(td3, file$6, 12, 8, 528);
  			addLoc(tr0, file$6, 1, 4, 94);
  			td4.colSpan = "3";
  			td4.className = "color-area-container";
  			addLoc(td4, file$6, 16, 8, 578);
  			td5.className = "alpha-slider-container";
  			addLoc(td5, file$6, 19, 8, 715);
  			addLoc(tr1, file$6, 15, 4, 564);
  			td6.colSpan = "3";
  			td6.className = "color-slider-container";
  			addLoc(td6, file$6, 24, 8, 876);
  			addLoc(td7, file$6, 27, 8, 986);
  			addLoc(tr2, file$6, 23, 4, 862);
  			addListener(table, "click", click_handler_1);
  			addListener(table, "dragstart", dragstart_handler);
  			table.className = "color-picker";
  			addLoc(table, file$6, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, table, anchor);
  			append(table, tr0);
  			append(tr0, td0);
  			append(td0, span0);
  			component.refs.sample = span0;
  			append(tr0, text0);
  			append(tr0, td1);
  			append(td1, span1);
  			append(span1, text1);
  			append(td1, text2);
  			append(td1, input);
  			component.refs.box = input;
  			append(tr0, text3);
  			append(tr0, td2);
  			append(td2, span2);
  			append(tr0, text4);
  			append(tr0, td3);
  			append(table, text5);
  			append(table, tr1);
  			append(tr1, td4);
  			colorarea._mount(td4, null);
  			append(tr1, text6);
  			append(tr1, td5);
  			alphaslider._mount(td5, null);
  			append(table, text7);
  			append(table, tr2);
  			append(tr2, td6);
  			colorslider._mount(td6, null);
  			append(tr2, text8);
  			append(tr2, td7);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			if (!current || changed.mode) {
  				setData(text1, ctx.mode);
  			}

  			var colorarea_changes = {};
  			if (!colorarea_updating.hue && changed.hue) {
  				colorarea_changes.hue = ctx.hue;
  				colorarea_updating.hue = ctx.hue !== void 0;
  			}
  			if (!colorarea_updating.saturation && changed.saturation) {
  				colorarea_changes.saturation = ctx.saturation;
  				colorarea_updating.saturation = ctx.saturation !== void 0;
  			}
  			if (!colorarea_updating.lightness && changed.lightness) {
  				colorarea_changes.lightness = ctx.lightness;
  				colorarea_updating.lightness = ctx.lightness !== void 0;
  			}
  			colorarea._set(colorarea_changes);
  			colorarea_updating = {};

  			var alphaslider_changes = {};
  			if (!alphaslider_updating.alpha && changed.alpha) {
  				alphaslider_changes.alpha = ctx.alpha;
  				alphaslider_updating.alpha = ctx.alpha !== void 0;
  			}
  			if (!alphaslider_updating.hue && changed.hue) {
  				alphaslider_changes.hue = ctx.hue;
  				alphaslider_updating.hue = ctx.hue !== void 0;
  			}
  			if (!alphaslider_updating.saturation && changed.saturation) {
  				alphaslider_changes.saturation = ctx.saturation;
  				alphaslider_updating.saturation = ctx.saturation !== void 0;
  			}
  			if (!alphaslider_updating.lightness && changed.lightness) {
  				alphaslider_changes.lightness = ctx.lightness;
  				alphaslider_updating.lightness = ctx.lightness !== void 0;
  			}
  			alphaslider._set(alphaslider_changes);
  			alphaslider_updating = {};

  			var colorslider_changes = {};
  			if (!colorslider_updating.hue && changed.hue) {
  				colorslider_changes.hue = ctx.hue;
  				colorslider_updating.hue = ctx.hue !== void 0;
  			}
  			colorslider._set(colorslider_changes);
  			colorslider_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			outrocallback = callAfter(outrocallback, 3);

  			if (colorarea) colorarea._fragment.o(outrocallback);
  			if (alphaslider) alphaslider._fragment.o(outrocallback);
  			if (colorslider) colorslider._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(table);
  			}

  			if (component.refs.sample === span0) component.refs.sample = null;
  			removeListener(input, "change", change_handler);
  			if (component.refs.box === input) component.refs.box = null;
  			removeListener(span2, "click", click_handler);
  			colorarea.destroy();
  			alphaslider.destroy();
  			colorslider.destroy();
  			removeListener(table, "click", click_handler_1);
  			removeListener(table, "dragstart", dragstart_handler);
  		}
  	};
  }

  function ColorPicker(options) {
  	var _this = this;

  	this._debugName = '<ColorPicker>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$6(), options.data);

  	this._recompute({ hue: 1, saturation: 1, lightness: 1, mode: 1, hex: 1, rgb: 1, alpha: 1 }, this._state);
  	if (!('mode' in this._state)) console.warn("<ColorPicker> was created without expected data property 'mode'");

  	if (!('hue' in this._state)) console.warn("<ColorPicker> was created without expected data property 'hue'");
  	if (!('saturation' in this._state)) console.warn("<ColorPicker> was created without expected data property 'saturation'");
  	if (!('lightness' in this._state)) console.warn("<ColorPicker> was created without expected data property 'lightness'");
  	if (!('alpha' in this._state)) console.warn("<ColorPicker> was created without expected data property 'alpha'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$5];

  	this._fragment = create_main_fragment$6(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(ColorPicker.prototype, protoDev);
  assign(ColorPicker.prototype, methods$4);

  ColorPicker.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hex' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'hex'");
  	if ('rgb' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'rgb'");
  	if ('value' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'value'");
  	if ('rgba' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'rgba'");
  };

  ColorPicker.prototype._recompute = function _recompute(changed, state) {
  	if (changed.hue || changed.saturation || changed.lightness) {
  		if (this._differs(state.hex, state.hex = hex(state))) changed.hex = true;
  		if (this._differs(state.rgb, state.rgb = rgb(state))) changed.rgb = true;
  	}

  	if (changed.mode || changed.hex || changed.rgb) {
  		if (this._differs(state.value, state.value = value(state))) changed.value = true;
  	}

  	if (changed.hue || changed.saturation || changed.lightness || changed.alpha) {
  		if (this._differs(state.rgba, state.rgba = rgba(state))) changed.rgba = true;
  	}
  };

  exports.ColorPicker = ColorPicker;
  exports.hsl2rgb = hsl2rgb;
  exports.rgb2hsl = rgb2hsl;
  exports.rgb2hex = rgb2hex;
  exports.hex2rgb = hex2rgb;
  exports.int2hex = int2hex;
  exports.hex2int = hex2int;

  });

  unwrapExports$$1(scanexColorPicker_cjs);
  var scanexColorPicker_cjs_1 = scanexColorPicker_cjs.ColorPicker;
  var scanexColorPicker_cjs_2 = scanexColorPicker_cjs.hsl2rgb;
  var scanexColorPicker_cjs_3 = scanexColorPicker_cjs.rgb2hsl;
  var scanexColorPicker_cjs_4 = scanexColorPicker_cjs.rgb2hex;
  var scanexColorPicker_cjs_5 = scanexColorPicker_cjs.hex2rgb;
  var scanexColorPicker_cjs_6 = scanexColorPicker_cjs.int2hex;
  var scanexColorPicker_cjs_7 = scanexColorPicker_cjs.hex2int;

  var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop$1() {}

  function assign$1(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue$1(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function addLoc$1(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run$1(fn) {
  	fn();
  }

  function append$1(target, node) {
  	target.appendChild(node);
  }

  function insert$1(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode$1(node) {
  	node.parentNode.removeChild(node);
  }

  function createElement$1(name) {
  	return document.createElement(name);
  }

  function createText$1(data) {
  	return document.createTextNode(data);
  }

  function addListener$1(node, event, handler) {
  	node.addEventListener(event, handler, false);
  }

  function removeListener$1(node, event, handler) {
  	node.removeEventListener(event, handler, false);
  }

  function setAttribute$1(node, attribute, value) {
  	node.setAttribute(attribute, value);
  }

  function toggleClass$1(element, name, toggle) {
  	element.classList.toggle(name, !!toggle);
  }

  function blankObject$1() {
  	return Object.create(null);
  }

  function destroy$1(detach) {
  	this.destroy = noop$1;
  	this.fire('destroy');
  	this.set = noop$1;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev$1(detach) {
  	destroy$1.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs$1(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof$1(a)) === 'object' || typeof a === 'function';
  }

  function fire$1(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush$1(component) {
  	component._lock = true;
  	callAll$1(component._beforecreate);
  	callAll$1(component._oncreate);
  	callAll$1(component._aftercreate);
  	component._lock = false;
  }

  function get$1$1() {
  	return this._state;
  }

  function init$1(component, options) {
  	component._handlers = blankObject$1();
  	component._slots = blankObject$1();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on$1(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1$1(newState) {
  	this._set(assign$1({}, newState));
  	if (this.root._lock) return;
  	flush$1(this.root);
  }

  function _set$1(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign$1(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign$1(assign$1({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage$1(newState) {
  	assign$1(this._staged, newState);
  }

  function setDev$1(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof$1(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1$1.call(this, newState);
  }

  function callAll$1(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount$1(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev$1 = {
  	destroy: destroyDev$1,
  	get: get$1$1,
  	fire: fire$1,
  	on: on$1,
  	set: setDev$1,
  	_recompute: noop$1,
  	_set: _set$1,
  	_stage: _stage$1,
  	_mount: _mount$1,
  	_differs: _differs$1
  };

  Number.isInteger = Number.isInteger || function (value) {
    return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  };

  /* src\InputInteger\InputInteger.html generated by Svelte v2.14.1 */

  var to_bool = function to_bool(value) {
  				switch (typeof value === 'undefined' ? 'undefined' : _typeof$1(value)) {
  								case 'string':
  												return value.toLowerCase() === 'true';
  								case 'boolean':
  												return value;
  								case 'number':
  												return value !== 0;
  								default:
  								case 'object':
  												return value !== null;
  				}
  };

  function data() {
  				return {
  								allowEmpty: false,
  								disabled: false,
  								max: null,
  								min: null,
  								spinner: false,
  								value: 0,
  								useSpinner: true
  				};
  }
  var methods = {
  				up: function up() {
  								var _get = this.get(),
  								    value = _get.value,
  								    disabled = _get.disabled;

  								if (!disabled) {
  												var v = parseInt(value, 10);
  												if (Number.isInteger(v)) {
  																this.set({ value: v + 1 });
  												}
  								}
  				},
  				down: function down() {
  								var _get2 = this.get(),
  								    value = _get2.value,
  								    disabled = _get2.disabled;

  								if (!disabled) {
  												var v = parseInt(value, 10);
  												if (Number.isInteger(v)) {
  																this.set({ value: v - 1 });
  												}
  								}
  				},
  				change: function change(e) {
  								switch (e.keyCode) {
  												case 38:
  																// up
  																e.preventDefault();
  																this.up();
  																break;
  												case 40:
  																// down
  																e.preventDefault();
  																this.down();
  																break;
  												default:
  																break;
  								}
  				},
  				isValid: function isValid(value) {
  								var _get3 = this.get(),
  								    min = _get3.min,
  								    max = _get3.max;

  								var low = parseInt(min, 10);
  								var high = parseInt(max, 10);
  								var v = parseInt(value, 10);
  								return Number.isInteger(v) && (Number.isInteger(low) && !Number.isInteger(high) && low <= v || Number.isInteger(high) && !Number.isInteger(low) && v <= high || Number.isInteger(low) && Number.isInteger(high) && low <= v && v <= high);
  				},
  				showSpinner: function showSpinner(e) {
  								var _get4 = this.get(),
  								    disabled = _get4.disabled,
  								    useSpinner = _get4.useSpinner;

  								if (useSpinner) {
  												this.set({ spinner: !disabled });
  								}
  				},
  				hideSpinner: function hideSpinner(e) {
  								var _get5 = this.get(),
  								    useSpinner = _get5.useSpinner;

  								if (useSpinner) {
  												this.set({ spinner: false });
  								}
  				}
  };

  function onupdate(_ref) {
  				var changed = _ref.changed,
  				    current = _ref.current,
  				    previous = _ref.previous;

  				if (changed.value) {
  								if (this.isValid(current.value)) {
  												this.set({ value: parseInt(current.value, 10) });
  								} else {
  												var _get6 = this.get(),
  												    allowEmpty = _get6.allowEmpty;

  												var emptyAllowed = false;
  												switch (typeof allowEmpty === 'undefined' ? 'undefined' : _typeof$1(allowEmpty)) {
  																case 'string':
  																				emptyAllowed = allowEmpty.toLowerCase() === 'true';
  																				break;
  																case 'boolean':
  																				emptyAllowed = allowEmpty;
  																				break;
  																default:
  																				break;
  												}
  												if (emptyAllowed) {
  																this.set({ value: '' });
  												} else if (previous && this.isValid(previous.value)) {
  																this.set({ value: previous.value });
  												} else {
  																this.set({ value: 0 });
  												}
  								}
  				}
  				if (changed.useSpinner) {
  								this.set({ useSpinner: to_bool(current.useSpinner) });
  				}

  				var _get7 = this.get(),
  				    useSpinner = _get7.useSpinner;

  				if (changed.spinner && to_bool(useSpinner)) {
  								if (current.spinner) {
  												this.refs.spinner.classList.remove('hidden');
  								} else {
  												this.refs.spinner.classList.add('hidden');
  								}
  				}
  }
  var file = "src\\InputInteger\\InputInteger.html";

  function create_main_fragment(component, ctx) {
  				var div1,
  				    div0,
  				    input,
  				    input_updating = false,
  				    text,
  				    current;

  				function input_input_handler() {
  								input_updating = true;
  								component.set({ value: input.value });
  								input_updating = false;
  				}

  				function change_handler(event) {
  								component.set({ value: event.target.value });
  				}

  				function keydown_handler(event) {
  								component.change(event);
  				}

  				var if_block = ctx.useSpinner && create_if_block(component, ctx);

  				function mouseenter_handler(event) {
  								component.showSpinner(event);
  				}

  				function mouseleave_handler(event) {
  								component.hideSpinner(event);
  				}

  				return {
  								c: function create() {
  												div1 = createElement$1("div");
  												div0 = createElement$1("div");
  												input = createElement$1("input");
  												text = createText$1("\r\n    ");
  												if (if_block) if_block.c();
  												addListener$1(input, "input", input_input_handler);
  												addListener$1(input, "change", change_handler);
  												addListener$1(input, "keydown", keydown_handler);
  												setAttribute$1(input, "type", "text");
  												addLoc$1(input, file, 2, 8, 186);
  												div0.className = "scanex-input-integer-field";
  												addLoc$1(div0, file, 1, 4, 136);
  												addListener$1(div1, "mouseenter", mouseenter_handler);
  												addListener$1(div1, "mouseleave", mouseleave_handler);
  												div1.className = "scanex-input-integer";
  												toggleClass$1(div1, "disabled", ctx.disabled);
  												addLoc$1(div1, file, 0, 0, 0);
  								},

  								m: function mount(target, anchor) {
  												insert$1(target, div1, anchor);
  												append$1(div1, div0);
  												append$1(div0, input);

  												input.value = ctx.value;

  												append$1(div1, text);
  												if (if_block) if_block.m(div1, null);
  												current = true;
  								},

  								p: function update(changed, ctx) {
  												if (!input_updating && changed.value) input.value = ctx.value;

  												if (ctx.useSpinner) {
  																if (!if_block) {
  																				if_block = create_if_block(component, ctx);
  																				if_block.c();
  																				if_block.m(div1, null);
  																}
  												} else if (if_block) {
  																if_block.d(1);
  																if_block = null;
  												}

  												if (changed.disabled) {
  																toggleClass$1(div1, "disabled", ctx.disabled);
  												}
  								},

  								i: function intro(target, anchor) {
  												if (current) return;

  												this.m(target, anchor);
  								},

  								o: run$1,

  								d: function destroy$$1(detach) {
  												if (detach) {
  																detachNode$1(div1);
  												}

  												removeListener$1(input, "input", input_input_handler);
  												removeListener$1(input, "change", change_handler);
  												removeListener$1(input, "keydown", keydown_handler);
  												if (if_block) if_block.d();
  												removeListener$1(div1, "mouseenter", mouseenter_handler);
  												removeListener$1(div1, "mouseleave", mouseleave_handler);
  								}
  				};
  }

  // (5:4) {#if useSpinner}
  function create_if_block(component, ctx) {
  				var div, i0, text, i1;

  				function click_handler(event) {
  								component.up();
  				}

  				function click_handler_1(event) {
  								component.down();
  				}

  				return {
  								c: function create() {
  												div = createElement$1("div");
  												i0 = createElement$1("i");
  												text = createText$1("\r\n        ");
  												i1 = createElement$1("i");
  												addListener$1(i0, "click", click_handler);
  												i0.className = "scanex-input-integer-up";
  												addLoc$1(i0, file, 6, 8, 394);
  												addListener$1(i1, "click", click_handler_1);
  												i1.className = "scanex-input-integer-down";
  												addLoc$1(i1, file, 7, 8, 459);
  												div.className = "scanex-input-integer-spinner";
  												addLoc$1(div, file, 5, 4, 330);
  								},

  								m: function mount(target, anchor) {
  												insert$1(target, div, anchor);
  												append$1(div, i0);
  												append$1(div, text);
  												append$1(div, i1);
  												component.refs.spinner = div;
  								},

  								d: function destroy$$1(detach) {
  												if (detach) {
  																detachNode$1(div);
  												}

  												removeListener$1(i0, "click", click_handler);
  												removeListener$1(i1, "click", click_handler_1);
  												if (component.refs.spinner === div) component.refs.spinner = null;
  								}
  				};
  }

  function InputInteger(options) {
  				var _this = this;

  				this._debugName = '<InputInteger>';
  				if (!options || !options.target && !options.root) throw new Error("'target' is a required option");
  				init$1(this, options);
  				this.refs = {};
  				this._state = assign$1(data(), options.data);
  				if (!('disabled' in this._state)) console.warn("<InputInteger> was created without expected data property 'disabled'");
  				if (!('value' in this._state)) console.warn("<InputInteger> was created without expected data property 'value'");
  				if (!('useSpinner' in this._state)) console.warn("<InputInteger> was created without expected data property 'useSpinner'");
  				this._intro = !!options.intro;
  				this._handlers.update = [onupdate];

  				this._fragment = create_main_fragment(this, this._state);

  				this.root._oncreate.push(function () {
  								_this.fire("update", { changed: assignTrue$1({}, _this._state), current: _this._state });
  				});

  				if (options.target) {
  								if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  								this._fragment.c();
  								this._mount(options.target, options.anchor);

  								flush$1(this);
  				}

  				this._intro = true;
  }

  assign$1(InputInteger.prototype, protoDev$1);
  assign$1(InputInteger.prototype, methods);

  InputInteger.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  var scanexInputInteger_cjs = InputInteger;

  var _typeof$2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop$2() {}

  function assign$2(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue$2(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function addLoc$2(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run$2(fn) {
  	fn();
  }

  function insert$2(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode$2(node) {
  	node.parentNode.removeChild(node);
  }

  function createElement$2(name) {
  	return document.createElement(name);
  }

  function addListener$2(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener$2(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setAttribute$2(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
  }

  function blankObject$2() {
  	return Object.create(null);
  }

  function destroy$2(detach) {
  	this.destroy = noop$2;
  	this.fire('destroy');
  	this.set = noop$2;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev$2(detach) {
  	destroy$2.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs$2(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof$2(a)) === 'object' || typeof a === 'function';
  }

  function fire$2(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush$2(component) {
  	component._lock = true;
  	callAll$2(component._beforecreate);
  	callAll$2(component._oncreate);
  	callAll$2(component._aftercreate);
  	component._lock = false;
  }

  function get$1$2() {
  	return this._state;
  }

  function init$2(component, options) {
  	component._handlers = blankObject$2();
  	component._slots = blankObject$2();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on$2(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1$2(newState) {
  	this._set(assign$2({}, newState));
  	if (this.root._lock) return;
  	flush$2(this.root);
  }

  function _set$2(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign$2(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign$2(assign$2({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage$2(newState) {
  	assign$2(this._staged, newState);
  }

  function setDev$2(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof$2(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1$2.call(this, newState);
  }

  function callAll$2(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount$2(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev$2 = {
  	destroy: destroyDev$2,
  	get: get$1$2,
  	fire: fire$2,
  	on: on$2,
  	set: setDev$2,
  	_recompute: noop$2,
  	_set: _set$2,
  	_stage: _stage$2,
  	_mount: _mount$2,
  	_differs: _differs$2
  };

  /* src\ValidatingInput.html generated by Svelte v2.15.3 */

  function data$1() {
  	return {
  		value: '',
  		validate: function validate() {
  			return true;
  		},
  		placeholder: '',
  		allowEmpty: false
  	};
  }
  function onupdate$1(_ref) {
  	var changed = _ref.changed,
  	    current = _ref.current,
  	    previous = _ref.previous;

  	if (changed.value) {
  		var _get = this.get(),
  		    validate = _get.validate,
  		    allowEmpty = _get.allowEmpty;

  		var ok = false;
  		switch (typeof validate === 'undefined' ? 'undefined' : _typeof$2(validate)) {
  			case 'function':
  				ok = validate(current.value);
  				break;
  			case 'string':
  				ok = new RegExp(validate, 'g').test(current.value);
  				break;
  			default:
  				break;
  		}
  		var emptyAllowed = false;
  		switch (typeof allowEmpty === 'undefined' ? 'undefined' : _typeof$2(allowEmpty)) {
  			case 'string':
  				emptyAllowed = allowEmpty.toLowerCase() === 'true';
  				break;
  			case 'boolean':
  				emptyAllowed = allowEmpty;
  				break;
  			default:
  				break;
  		}
  		if (!ok) {
  			if (!emptyAllowed && previous && previous.value) {
  				this.set({ value: previous.value });
  			} else {
  				this.set({ value: '' });
  			}
  		}
  	}
  }
  var file$1 = "src\\ValidatingInput.html";

  function create_main_fragment$1(component, ctx) {
  	var input,
  	    input_updating = false,
  	    current;

  	function input_input_handler() {
  		input_updating = true;
  		component.set({ value: input.value });
  		input_updating = false;
  	}

  	function change_handler(event) {
  		component.set({ value: event.target.value });
  	}

  	return {
  		c: function create() {
  			input = createElement$2("input");
  			addListener$2(input, "input", input_input_handler);
  			addListener$2(input, "change", change_handler);
  			setAttribute$2(input, "type", "text");
  			input.placeholder = ctx.placeholder;
  			addLoc$2(input, file$1, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert$2(target, input, anchor);

  			input.value = ctx.value;

  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (!input_updating && changed.value) input.value = ctx.value;
  			if (changed.placeholder) {
  				input.placeholder = ctx.placeholder;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run$2,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode$2(input);
  			}

  			removeListener$2(input, "input", input_input_handler);
  			removeListener$2(input, "change", change_handler);
  		}
  	};
  }

  function ValidatingInput(options) {
  	var _this = this;

  	this._debugName = '<ValidatingInput>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init$2(this, options);
  	this._state = assign$2(data$1(), options.data);
  	if (!('placeholder' in this._state)) console.warn("<ValidatingInput> was created without expected data property 'placeholder'");
  	if (!('value' in this._state)) console.warn("<ValidatingInput> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$1];

  	this._fragment = create_main_fragment$1(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue$2({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush$2(this);
  	}

  	this._intro = true;
  }

  assign$2(ValidatingInput.prototype, protoDev$2);

  ValidatingInput.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  var scanexValidatingInput_cjs = ValidatingInput;

  /* src\AdvancedColorPicker.html generated by Svelte v2.16.1 */

  function data$2() {
  	return {
  		alpha: 100,
  		color: '#FFFFFF'
  	};
  }
  var methods$1 = {
  	click: function click(e) {
  		if (this.colorPicker) {
  			this.colorPicker.destroy();
  			this.colorPicker = null;
  			this.refs.pickerContainer.style.visibility = 'hidden';
  		}
  	},
  	changeColor: function changeColor(_ref) {
  		var changed = _ref.changed,
  		    current = _ref.current,
  		    previous = _ref.previous;

  		if (changed.rgba) {
  			this.set({ color: current.hex, alpha: current.alpha });
  		}
  	},
  	showPicker: function showPicker(e) {
  		e.stopPropagation();
  		if (!this.colorPicker) {
  			var _get = this.get(),
  			    alpha = _get.alpha,
  			    color = _get.color;

  			var _hex2rgb = scanexColorPicker_cjs_5(color || '#FFFFFF'),
  			    r = _hex2rgb.r,
  			    g = _hex2rgb.g,
  			    b = _hex2rgb.b;

  			var _rgb2hsl = scanexColorPicker_cjs_3(r, g, b),
  			    h = _rgb2hsl.h,
  			    s = _rgb2hsl.s,
  			    l = _rgb2hsl.l;

  			h = h || 0;

  			var _refs$button$getBound = this.refs.button.getBoundingClientRect(),
  			    right = _refs$button$getBound.right,
  			    top = _refs$button$getBound.top;

  			this.refs.pickerContainer.style.left = right + 10 + 'px';
  			this.refs.pickerContainer.style.top = top + 'px';
  			this.refs.pickerContainer.style.visibility = 'visible';

  			this.colorPicker = new scanexColorPicker_cjs_1({
  				target: this.refs.pickerContainer,
  				data: { hue: h, saturation: s, lightness: l, alpha: alpha }
  			});
  			this.colorPicker.on('state', this.changeColor.bind(this));
  		}
  	}
  };

  function onupdate$2(_ref2) {
  	var changed = _ref2.changed,
  	    current = _ref2.current;

  	if (changed.color) {
  		this.refs.button.style.backgroundColor = current.color;
  	}
  }
  var file$2 = "src\\AdvancedColorPicker.html";

  function create_main_fragment$2(component, ctx) {
  	var div5,
  	    div0,
  	    inputinteger_updating = {},
  	    text0,
  	    div1,
  	    validatinginput_updating = {},
  	    text1,
  	    div3,
  	    div2,
  	    text2,
  	    div4,
  	    current;

  	function onwindowclick(event) {
  		component.click(event);	}
  	window.addEventListener("click", onwindowclick);

  	var inputinteger_initial_data = {
  		min: "0",
  		max: "100",
  		useSpinner: "false"
  	};
  	if (ctx.alpha !== void 0) {
  		inputinteger_initial_data.value = ctx.alpha;
  		inputinteger_updating.value = true;
  	}
  	var inputinteger = new scanexInputInteger_cjs({
  		root: component.root,
  		store: component.store,
  		data: inputinteger_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger_updating.value && changed.value) {
  				newState.alpha = childState.value;
  			}
  			component._set(newState);
  			inputinteger_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger._bind({ value: 1 }, inputinteger.get());
  	});

  	var validatinginput_initial_data = {
  		placeholder: "#FFFFFF",
  		validate: "^#[0-9a-fA-F]+$"
  	};
  	if (ctx.color !== void 0) {
  		validatinginput_initial_data.value = ctx.color;
  		validatinginput_updating.value = true;
  	}
  	var validatinginput = new scanexValidatingInput_cjs({
  		root: component.root,
  		store: component.store,
  		data: validatinginput_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!validatinginput_updating.value && changed.value) {
  				newState.color = childState.value;
  			}
  			component._set(newState);
  			validatinginput_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		validatinginput._bind({ value: 1 }, validatinginput.get());
  	});

  	function click_handler(event) {
  		component.showPicker(event);
  	}

  	return {
  		c: function create() {
  			div5 = createElement("div");
  			div0 = createElement("div");
  			inputinteger._fragment.c();
  			text0 = createText("    \r\n    ");
  			div1 = createElement("div");
  			validatinginput._fragment.c();
  			text1 = createText("\r\n    ");
  			div3 = createElement("div");
  			div2 = createElement("div");
  			text2 = createText("\r\n    ");
  			div4 = createElement("div");
  			div0.className = "scanex-advanced-color-picker-alpha";
  			addLoc(div0, file$2, 2, 4, 94);
  			div1.className = "scanex-advanced-color-picker-color";
  			addLoc(div1, file$2, 5, 4, 246);
  			addLoc(div2, file$2, 9, 8, 497);
  			addListener(div3, "click", click_handler);
  			div3.className = "scanex-advanced-color-picker-button";
  			addLoc(div3, file$2, 8, 4, 409);
  			div4.className = "scanex-advanced-color-picker-container";
  			addLoc(div4, file$2, 11, 4, 537);
  			div5.className = "scanex-advanced-color-picker";
  			addLoc(div5, file$2, 1, 0, 42);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div5, anchor);
  			append(div5, div0);
  			inputinteger._mount(div0, null);
  			append(div5, text0);
  			append(div5, div1);
  			validatinginput._mount(div1, null);
  			append(div5, text1);
  			append(div5, div3);
  			append(div3, div2);
  			component.refs.button = div2;
  			append(div5, text2);
  			append(div5, div4);
  			component.refs.pickerContainer = div4;
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var inputinteger_changes = {};
  			if (!inputinteger_updating.value && changed.alpha) {
  				inputinteger_changes.value = ctx.alpha;
  				inputinteger_updating.value = ctx.alpha !== void 0;
  			}
  			inputinteger._set(inputinteger_changes);
  			inputinteger_updating = {};

  			var validatinginput_changes = {};
  			if (!validatinginput_updating.value && changed.color) {
  				validatinginput_changes.value = ctx.color;
  				validatinginput_updating.value = ctx.color !== void 0;
  			}
  			validatinginput._set(validatinginput_changes);
  			validatinginput_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			outrocallback = callAfter(outrocallback, 2);

  			if (inputinteger) inputinteger._fragment.o(outrocallback);
  			if (validatinginput) validatinginput._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			window.removeEventListener("click", onwindowclick);

  			if (detach) {
  				detachNode(div5);
  			}

  			inputinteger.destroy();
  			validatinginput.destroy();
  			if (component.refs.button === div2) component.refs.button = null;
  			removeListener(div3, "click", click_handler);
  			if (component.refs.pickerContainer === div4) component.refs.pickerContainer = null;
  		}
  	};
  }

  function AdvancedColorPicker(options) {
  	var _this = this;

  	this._debugName = '<AdvancedColorPicker>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$2(), options.data);
  	if (!('alpha' in this._state)) console.warn("<AdvancedColorPicker> was created without expected data property 'alpha'");
  	if (!('color' in this._state)) console.warn("<AdvancedColorPicker> was created without expected data property 'color'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$2];

  	this._fragment = create_main_fragment$2(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(AdvancedColorPicker.prototype, protoDev);
  assign(AdvancedColorPicker.prototype, methods$1);

  AdvancedColorPicker.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  module.exports = AdvancedColorPicker;

  });

  var AdvancedColorPicker = unwrapExports(scanexAdvancedColorPicker_cjs);

  var scanexExtendedColorPicker_cjs = createCommonjsModule(function (module) {

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop() {}

  function assign(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function addLoc(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function append(target, node) {
  	target.appendChild(node);
  }

  function insert(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode(node) {
  	node.parentNode.removeChild(node);
  }

  function createElement(name) {
  	return document.createElement(name);
  }

  function createText(data) {
  	return document.createTextNode(data);
  }

  function addListener(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function blankObject() {
  	return Object.create(null);
  }

  function destroy(detach) {
  	this.destroy = noop;
  	this.fire('destroy');
  	this.set = noop;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev(detach) {
  	destroy.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object' || typeof a === 'function';
  }

  function fire(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush(component) {
  	component._lock = true;
  	callAll(component._beforecreate);
  	callAll(component._oncreate);
  	callAll(component._aftercreate);
  	component._lock = false;
  }

  function get$1() {
  	return this._state;
  }

  function init(component, options) {
  	component._handlers = blankObject();
  	component._slots = blankObject();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1(newState) {
  	this._set(assign({}, newState));
  	if (this.root._lock) return;
  	flush(this.root);
  }

  function _set(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign(assign({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage(newState) {
  	assign(this._staged, newState);
  }

  function setDev(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1.call(this, newState);
  }

  function callAll(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev = {
  	destroy: destroyDev,
  	get: get$1,
  	fire: fire,
  	on: on,
  	set: setDev,
  	_recompute: noop,
  	_set: _set,
  	_stage: _stage,
  	_mount: _mount,
  	_differs: _differs
  };

  function unwrapExports$$1 (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x.default : x;
  }

  function createCommonjsModule$$1(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  var scanexColorPicker_cjs = createCommonjsModule$$1(function (module, exports) {

  Object.defineProperty(exports, '__esModule', { value: true });

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  var slicedToArray = function () {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;

      try {
        for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"]) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    return function (arr, i) {
      if (Array.isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError("Invalid attempt to destructure non-iterable instance");
      }
    };
  }();

  function noop() {}

  function assign(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function callAfter(fn, i) {
  	if (i === 0) fn();
  	return function () {
  		if (! --i) fn();
  	};
  }

  function addLoc(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run(fn) {
  	fn();
  }

  function append(target, node) {
  	target.appendChild(node);
  }

  function insert(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode(node) {
  	node.parentNode.removeChild(node);
  }

  function reinsertChildren(parent, target) {
  	while (parent.firstChild) {
  		target.appendChild(parent.firstChild);
  	}
  }

  function reinsertBefore(after, target) {
  	var parent = after.parentNode;
  	while (parent.firstChild !== after) {
  		target.appendChild(parent.firstChild);
  	}
  }

  function createFragment() {
  	return document.createDocumentFragment();
  }

  function createElement(name) {
  	return document.createElement(name);
  }

  function createText(data) {
  	return document.createTextNode(data);
  }

  function createComment() {
  	return document.createComment('');
  }

  function addListener(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setAttribute(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
  }

  function setData(text, data) {
  	text.data = '' + data;
  }

  function blankObject() {
  	return Object.create(null);
  }

  function destroy(detach) {
  	this.destroy = noop;
  	this.fire('destroy');
  	this.set = noop;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev(detach) {
  	destroy.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof(a)) === 'object' || typeof a === 'function';
  }

  function fire(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush(component) {
  	component._lock = true;
  	callAll(component._beforecreate);
  	callAll(component._oncreate);
  	callAll(component._aftercreate);
  	component._lock = false;
  }

  function get$1() {
  	return this._state;
  }

  function init(component, options) {
  	component._handlers = blankObject();
  	component._slots = blankObject();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1(newState) {
  	this._set(assign({}, newState));
  	if (this.root._lock) return;
  	flush(this.root);
  }

  function _set(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign(assign({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage(newState) {
  	assign(this._staged, newState);
  }

  function setDev(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1.call(this, newState);
  }

  function callAll(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev = {
  	destroy: destroyDev,
  	get: get$1,
  	fire: fire,
  	on: on,
  	set: setDev,
  	_recompute: noop,
  	_set: _set,
  	_stage: _stage,
  	_mount: _mount,
  	_differs: _differs
  };

  var stringToArray = function stringToArray(str) {
      var arr = [];
      for (var i = 0; i < str.length; ++i) {
          arr.push(str.charAt(i));
      }
      return arr;
  };

  var pad = function pad(origin, str, width, sym) {
      var s = stringToArray(str);
      for (var i = 0; s.length < width; ++i) {
          if (origin === 'left') {
              s.splice(0, 0, sym);
          } else {
              s.push(sym);
          }
      }
      return s.join('');
  };

  var padLeft = function padLeft(str, sym, width) {
      return pad('left', str, width, sym);
  };

  var hsl2rgb = function hsl2rgb(h, s, l) {
      var q = void 0;
      if (l < 0.5) {
          q = l * (1.0 + s);
      } else if (l >= 0.5) {
          q = l + s - l * s;
      }
      var p = 2.0 * l - q;
      var hk = h / 360;
      var norm = function norm(tc) {
          if (tc < 0) return tc + 1.0;
          if (tc > 1) return tc - 1.0;
          return tc;
      };
      var tr = norm(hk + 1 / 3);
      var tg = norm(hk);
      var tb = norm(hk - 1 / 3);

      var color = function color(tc) {
          if (tc < 1 / 6) {
              return p + (q - p) * 6.0 * tc;
          }
          if (1 / 6 <= tc && tc < 1 / 2) {
              return q;
          }
          if (1 / 2 <= tc && tc < 2 / 3) {
              return p + (q - p) * (2 / 3 - tc) * 6.0;
          }
          return p;
      };

      return {
          r: Math.round(color(tr) * 255),
          g: Math.round(color(tg) * 255),
          b: Math.round(color(tb) * 255)
      };
  };

  var rgb2hsl = function rgb2hsl(R, G, B) {
      var r = R / 255,
          g = G / 255,
          b = B / 255;
      var max = Math.max(r, g, b);
      var min = Math.min(r, g, b);
      var h = void 0;
      if (max == min) {
          h = undefined;
      } else if (max == r && g >= b) {
          h = 60 * (g - b) / (max - min);
      } else if (max == r && g < b) {
          h = 60 * (g - b) / (max - min) + 360;
      } else if (max == g) {
          h = 60 * (b - r) / (max - min) + 120;
      } else if (max == b) {
          h = 60 * (r - g) / (max - min) + 240;
      }
      var l = (max + min) / 2;
      var s = void 0;
      if (l == 0 || max == min) {
          s = 0;
      } else if (0 < l && l <= 0.5) {
          s = (max - min) / (max + min);
      } else if (0.5 < l && l < 1) {
          s = (max - min) / (2 - (max + min));
      }
      return { h: h, s: s, l: l };
  };

  var rgb2hex = function rgb2hex(r, g, b) {
      return '#' + [r, g, b].map(function (x) {
          return padLeft(x.toString(16), '0', 2).toUpperCase();
      }).join('');
  };

  var hex2rgb = function hex2rgb(hex) {
      var _$exec$slice$map = /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/gi.exec(hex).slice(1).map(function (x) {
          return parseInt(x, 16);
      }),
          _$exec$slice$map2 = slicedToArray(_$exec$slice$map, 3),
          r = _$exec$slice$map2[0],
          g = _$exec$slice$map2[1],
          b = _$exec$slice$map2[2];

      return { r: r, g: g, b: b };
  };

  var int2hex = function int2hex(n) {
      return '#' + padLeft(n.toString(16).toUpperCase(), '0', 6);
  };

  var hex2int = function hex2int(hex) {
      var _$exec$slice = /^#([0-9a-f]+)$/gi.exec(hex).slice(1),
          _$exec$slice2 = slicedToArray(_$exec$slice, 1),
          h = _$exec$slice2[0];

      return parseInt(h, 16);
  };

  /* src\Slider\HSlider.html generated by Svelte v2.15.3 */

  var TIMEOUT = 70;
  function hasTooltip(_ref) {
  	var tooltip = _ref.tooltip;

  	switch (typeof tooltip === 'undefined' ? 'undefined' : _typeof(tooltip)) {
  		case 'boolean':
  			return tooltip;
  		case 'string':
  			return tooltip.toLowerCase() === 'true';
  		default:
  			return false;
  	}
  }

  function data() {
  	return {
  		min: 0,
  		max: 0,
  		value: 0,
  		step: 0,
  		tooltip: false
  	};
  }
  var methods = {
  	click: function click(e) {
  		e.stopPropagation();

  		var _get = this.get(),
  		    min = _get.min,
  		    max = _get.max;

  		var a = parseFloat(min);
  		var z = parseFloat(max);

  		var _refs$slider$getBound = this.refs.slider.getBoundingClientRect(),
  		    left = _refs$slider$getBound.left;

  		var _refs$tick$getBoundin = this.refs.tick.getBoundingClientRect(),
  		    width = _refs$tick$getBoundin.width;

  		var d = (e.clientX - width / 2 - left) * this._ratio;
  		var value = d;
  		if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  			this.set({ value: value });
  		}
  	},
  	start: function start(e) {
  		e.stopPropagation();
  		this._moving = true;

  		var _get2 = this.get(),
  		    value = _get2.value,
  		    hasTooltip = _get2.hasTooltip;

  		this._startX = e.clientX;
  		this._start = parseFloat(value);
  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'block';
  		}
  	},
  	move: function move(e) {
  		var _this = this;

  		if (this._moving) {
  			setTimeout(function () {
  				e.stopPropagation();
  				document.body.style.cursor = 'pointer';

  				var _get3 = _this.get(),
  				    min = _get3.min,
  				    max = _get3.max,
  				    step = _get3.step;

  				var a = parseFloat(min);
  				var z = parseFloat(max);
  				var s = parseFloat(step);
  				var d = (e.clientX - _this._startX) * _this._ratio;
  				if (s > 0) {
  					d = Math.floor(d / s) * s;
  				}
  				var value = _this._start + d;
  				if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  					_this.set({ value: value });
  				}
  			}, TIMEOUT);
  		}
  	},
  	stop: function stop(e) {
  		this._moving = false;
  		document.body.style.cursor = 'initial';

  		var _get4 = this.get(),
  		    hasTooltip = _get4.hasTooltip;

  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'none';
  		}
  	},
  	_getRatio: function _getRatio(min, max) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		if (!isNaN(a) && !isNaN(z)) {
  			var _refs$bar$getBounding = this.refs.bar.getBoundingClientRect(),
  			    width = _refs$bar$getBounding.width;

  			return (z - a) / width;
  		} else {
  			return NaN;
  		}
  	},
  	_updateDom: function _updateDom(min, max, value, ratio) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		var v = parseFloat(value);
  		if (!isNaN(a) && !isNaN(z) && !isNaN(v) && a <= v && v <= z) {
  			this.refs.tick.style.left = Math.round(v / ratio) + 'px';
  		}
  	}
  };

  function oncreate() {
  	var _get5 = this.get(),
  	    min = _get5.min,
  	    max = _get5.max;

  	this._ratio = this._getRatio(min, max);
  }
  function onupdate(_ref2) {
  	var changed = _ref2.changed,
  	    current = _ref2.current,
  	    previous = _ref2.previous;

  	if (changed.value) {
  		var value = parseFloat(current.value);
  		if (!isNaN(value)) {
  			var _get6 = this.get(),
  			    min = _get6.min,
  			    max = _get6.max;

  			this._updateDom(min, max, value, this._ratio);
  		}
  	}
  }
  var file = "src\\Slider\\HSlider.html";

  function create_main_fragment(component, ctx) {
  	var div2,
  	    slot_content_default = component._slotted.default,
  	    slot_content_default_after,
  	    text,
  	    div1,
  	    div0,
  	    current;

  	function onwindowmouseup(event) {
  		component.stop(event);	}
  	window.addEventListener("mouseup", onwindowmouseup);

  	function onwindowmousemove(event) {
  		component.move(event);	}
  	window.addEventListener("mousemove", onwindowmousemove);

  	var if_block = ctx.hasTooltip && create_if_block(component, ctx);

  	function mousedown_handler(event) {
  		component.start(event);
  	}

  	function click_handler(event) {
  		component.click(event);
  	}

  	return {
  		c: function create() {
  			div2 = createElement("div");
  			text = createText("\r\n    ");
  			div1 = createElement("div");
  			div0 = createElement("div");
  			if (if_block) if_block.c();
  			addListener(div0, "mousedown", mousedown_handler);
  			div0.className = "hslider-tick";
  			addLoc(div0, file, 4, 8, 198);
  			addListener(div1, "click", click_handler);
  			div1.className = "hslider-bar";
  			addLoc(div1, file, 3, 4, 131);
  			div2.className = "hslider";
  			addLoc(div2, file, 1, 0, 70);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div2, anchor);

  			if (slot_content_default) {
  				append(div2, slot_content_default);
  				append(div2, slot_content_default_after || (slot_content_default_after = createComment()));
  			}

  			append(div2, text);
  			append(div2, div1);
  			append(div1, div0);
  			if (if_block) if_block.m(div0, null);
  			component.refs.tick = div0;
  			component.refs.bar = div1;
  			component.refs.slider = div2;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (ctx.hasTooltip) {
  				if (if_block) {
  					if_block.p(changed, ctx);
  				} else {
  					if_block = create_if_block(component, ctx);
  					if_block.c();
  					if_block.m(div0, null);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			window.removeEventListener("mouseup", onwindowmouseup);

  			window.removeEventListener("mousemove", onwindowmousemove);

  			if (detach) {
  				detachNode(div2);
  			}

  			if (slot_content_default) {
  				reinsertBefore(slot_content_default_after, slot_content_default);
  			}

  			if (if_block) if_block.d();
  			removeListener(div0, "mousedown", mousedown_handler);
  			if (component.refs.tick === div0) component.refs.tick = null;
  			removeListener(div1, "click", click_handler);
  			if (component.refs.bar === div1) component.refs.bar = null;
  			if (component.refs.slider === div2) component.refs.slider = null;
  		}
  	};
  }

  // (6:12) {#if hasTooltip}
  function create_if_block(component, ctx) {
  	var div,
  	    text_value = ctx.parseFloat(ctx.value).toFixed(),
  	    text;

  	return {
  		c: function create() {
  			div = createElement("div");
  			text = createText(text_value);
  			div.className = "hslider-tooltip";
  			addLoc(div, file, 6, 16, 309);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(div, text);
  			component.refs.tooltip = div;
  		},

  		p: function update(changed, ctx) {
  			if ((changed.parseFloat || changed.value) && text_value !== (text_value = ctx.parseFloat(ctx.value).toFixed())) {
  				setData(text, text_value);
  			}
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.tooltip === div) component.refs.tooltip = null;
  		}
  	};
  }

  function HSlider(options) {
  	var _this2 = this;

  	this._debugName = '<HSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(assign({ parseFloat: parseFloat }, data()), options.data);

  	this._recompute({ tooltip: 1 }, this._state);
  	if (!('tooltip' in this._state)) console.warn("<HSlider> was created without expected data property 'tooltip'");

  	if (!('value' in this._state)) console.warn("<HSlider> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate];

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate.call(_this2);
  		_this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(HSlider.prototype, protoDev);
  assign(HSlider.prototype, methods);

  HSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hasTooltip' in newState && !this._updatingReadonlyProperty) throw new Error("<HSlider>: Cannot set read-only property 'hasTooltip'");
  };

  HSlider.prototype._recompute = function _recompute(changed, state) {
  	if (changed.tooltip) {
  		if (this._differs(state.hasTooltip, state.hasTooltip = hasTooltip(state))) changed.hasTooltip = true;
  	}
  };

  /* src\Slider\VSlider.html generated by Svelte v2.15.3 */

  var TIMEOUT$1 = 70;
  function hasTooltip$1(_ref) {
  	var tooltip = _ref.tooltip;

  	switch (typeof tooltip === 'undefined' ? 'undefined' : _typeof(tooltip)) {
  		case 'boolean':
  			return tooltip;
  		case 'string':
  			return tooltip.toLowerCase() === 'true';
  		default:
  			return false;
  	}
  }

  function data$1() {
  	return {
  		min: 0,
  		max: 0,
  		value: 0,
  		step: 0,
  		tooltip: false
  	};
  }
  var methods$1 = {
  	click: function click(e) {
  		e.stopPropagation();

  		var _get = this.get(),
  		    min = _get.min,
  		    max = _get.max;

  		var a = parseFloat(min);
  		var z = parseFloat(max);

  		var _refs$slider$getBound = this.refs.slider.getBoundingClientRect(),
  		    top = _refs$slider$getBound.top;

  		var d = (e.clientY - top) * this._ratio;
  		var value = d;
  		if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  			this.set({ value: value });
  		}
  	},
  	start: function start(e) {
  		e.stopPropagation();
  		this._moving = true;

  		var _get2 = this.get(),
  		    value = _get2.value,
  		    hasTooltip = _get2.hasTooltip;

  		this._startX = e.clientY;
  		this._start = parseFloat(value);
  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'block';
  		}
  	},
  	move: function move(e) {
  		var _this = this;

  		if (this._moving) {
  			setTimeout(function () {
  				e.stopPropagation();
  				document.body.style.cursor = 'pointer';

  				var _get3 = _this.get(),
  				    min = _get3.min,
  				    max = _get3.max,
  				    step = _get3.step;

  				var a = parseFloat(min);
  				var z = parseFloat(max);
  				var s = parseFloat(step);
  				var d = (e.clientY - _this._startX) * _this._ratio;
  				if (s > 0) {
  					d = Math.floor(d / s) * s;
  				}
  				var value = _this._start + d;
  				if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
  					_this.set({ value: value });
  				}
  			}, TIMEOUT$1);
  		}
  	},
  	stop: function stop(e) {
  		e.stopPropagation();
  		this._moving = false;

  		var _get4 = this.get(),
  		    hasTooltip = _get4.hasTooltip;

  		document.body.style.cursor = 'initial';
  		if (hasTooltip) {
  			this.refs.tooltip.style.display = 'none';
  		}
  	},
  	_getRatio: function _getRatio(min, max) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		if (!isNaN(a) && !isNaN(z)) {
  			var _refs$bar$getBounding = this.refs.bar.getBoundingClientRect(),
  			    height = _refs$bar$getBounding.height;

  			return (z - a) / height;
  		} else {
  			return NaN;
  		}
  	},
  	_updateDom: function _updateDom(min, max, value, ratio) {
  		var a = parseFloat(min);
  		var z = parseFloat(max);
  		var v = parseFloat(value);
  		if (!isNaN(a) && !isNaN(z) && !isNaN(v) && a <= v && v <= z) {
  			this.refs.tick.style.top = v / ratio + 'px';
  		}
  	}
  };

  function oncreate$1() {
  	var _get5 = this.get(),
  	    min = _get5.min,
  	    max = _get5.max;

  	this._ratio = this._getRatio(min, max);
  }
  function onupdate$1(_ref2) {
  	var changed = _ref2.changed,
  	    current = _ref2.current,
  	    previous = _ref2.previous;

  	if (changed.value) {
  		var value = parseFloat(current.value);
  		if (!isNaN(value)) {
  			var _get6 = this.get(),
  			    min = _get6.min,
  			    max = _get6.max;

  			this._updateDom(min, max, value, this._ratio);
  		}
  	}
  }
  var file$1 = "src\\Slider\\VSlider.html";

  function create_main_fragment$1(component, ctx) {
  	var div2,
  	    slot_content_default = component._slotted.default,
  	    slot_content_default_after,
  	    text,
  	    div1,
  	    div0,
  	    current;

  	function onwindowmouseup(event) {
  		component.stop(event);	}
  	window.addEventListener("mouseup", onwindowmouseup);

  	function onwindowmousemove(event) {
  		component.move(event);	}
  	window.addEventListener("mousemove", onwindowmousemove);

  	var if_block = ctx.hasTooltip && create_if_block$1(component, ctx);

  	function mousedown_handler(event) {
  		component.start(event);
  	}

  	function click_handler(event) {
  		component.click(event);
  	}

  	return {
  		c: function create() {
  			div2 = createElement("div");
  			text = createText("\r\n    ");
  			div1 = createElement("div");
  			div0 = createElement("div");
  			if (if_block) if_block.c();
  			addListener(div0, "mousedown", mousedown_handler);
  			div0.className = "vslider-tick";
  			addLoc(div0, file$1, 4, 8, 222);
  			addListener(div1, "click", click_handler);
  			div1.className = "vslider-bar";
  			addLoc(div1, file$1, 3, 4, 135);
  			div2.className = "vslider";
  			addLoc(div2, file$1, 1, 0, 70);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div2, anchor);

  			if (slot_content_default) {
  				append(div2, slot_content_default);
  				append(div2, slot_content_default_after || (slot_content_default_after = createComment()));
  			}

  			append(div2, text);
  			append(div2, div1);
  			append(div1, div0);
  			if (if_block) if_block.m(div0, null);
  			component.refs.tick = div0;
  			component.refs.bar = div1;
  			component.refs.slider = div2;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (ctx.hasTooltip) {
  				if (if_block) {
  					if_block.p(changed, ctx);
  				} else {
  					if_block = create_if_block$1(component, ctx);
  					if_block.c();
  					if_block.m(div0, null);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			window.removeEventListener("mouseup", onwindowmouseup);

  			window.removeEventListener("mousemove", onwindowmousemove);

  			if (detach) {
  				detachNode(div2);
  			}

  			if (slot_content_default) {
  				reinsertBefore(slot_content_default_after, slot_content_default);
  			}

  			if (if_block) if_block.d();
  			removeListener(div0, "mousedown", mousedown_handler);
  			if (component.refs.tick === div0) component.refs.tick = null;
  			removeListener(div1, "click", click_handler);
  			if (component.refs.bar === div1) component.refs.bar = null;
  			if (component.refs.slider === div2) component.refs.slider = null;
  		}
  	};
  }

  // (6:12) {#if hasTooltip}
  function create_if_block$1(component, ctx) {
  	var div,
  	    text_value = ctx.parseFloat(ctx.value).toFixed(),
  	    text;

  	return {
  		c: function create() {
  			div = createElement("div");
  			text = createText(text_value);
  			div.className = "vslider-tooltip";
  			addLoc(div, file$1, 6, 16, 333);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(div, text);
  			component.refs.tooltip = div;
  		},

  		p: function update(changed, ctx) {
  			if ((changed.parseFloat || changed.value) && text_value !== (text_value = ctx.parseFloat(ctx.value).toFixed())) {
  				setData(text, text_value);
  			}
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.tooltip === div) component.refs.tooltip = null;
  		}
  	};
  }

  function VSlider(options) {
  	var _this2 = this;

  	this._debugName = '<VSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(assign({ parseFloat: parseFloat }, data$1()), options.data);

  	this._recompute({ tooltip: 1 }, this._state);
  	if (!('tooltip' in this._state)) console.warn("<VSlider> was created without expected data property 'tooltip'");

  	if (!('value' in this._state)) console.warn("<VSlider> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$1];

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$1(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate$1.call(_this2);
  		_this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(VSlider.prototype, protoDev);
  assign(VSlider.prototype, methods$1);

  VSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hasTooltip' in newState && !this._updatingReadonlyProperty) throw new Error("<VSlider>: Cannot set read-only property 'hasTooltip'");
  };

  VSlider.prototype._recompute = function _recompute(changed, state) {
  	if (changed.tooltip) {
  		if (this._differs(state.hasTooltip, state.hasTooltip = hasTooltip$1(state))) changed.hasTooltip = true;
  	}
  };

  /* src\Slider\Slider.html generated by Svelte v2.15.3 */

  function data$2() {
  	return { HSlider: HSlider, VSlider: VSlider };
  }
  function create_main_fragment$2(component, ctx) {
  	var slot_content_default = component._slotted.default,
  	    switch_instance_updating = {},
  	    switch_instance_anchor,
  	    current;

  	var switch_value = ctx.orientation === 'horizontal' ? ctx.HSlider : ctx.VSlider;

  	function switch_props(ctx) {
  		var switch_instance_initial_data = {};
  		if (ctx.min !== void 0) {
  			switch_instance_initial_data.min = ctx.min;
  			switch_instance_updating.min = true;
  		}
  		if (ctx.max !== void 0) {
  			switch_instance_initial_data.max = ctx.max;
  			switch_instance_updating.max = true;
  		}
  		if (ctx.value !== void 0) {
  			switch_instance_initial_data.value = ctx.value;
  			switch_instance_updating.value = true;
  		}
  		if (ctx.step !== void 0) {
  			switch_instance_initial_data.step = ctx.step;
  			switch_instance_updating.step = true;
  		}
  		if (ctx.tooltip !== void 0) {
  			switch_instance_initial_data.tooltip = ctx.tooltip;
  			switch_instance_updating.tooltip = true;
  		}
  		return {
  			root: component.root,
  			store: component.store,
  			slots: { default: createFragment() },
  			data: switch_instance_initial_data,
  			_bind: function _bind(changed, childState) {
  				var newState = {};
  				if (!switch_instance_updating.min && changed.min) {
  					newState.min = childState.min;
  				}

  				if (!switch_instance_updating.max && changed.max) {
  					newState.max = childState.max;
  				}

  				if (!switch_instance_updating.value && changed.value) {
  					newState.value = childState.value;
  				}

  				if (!switch_instance_updating.step && changed.step) {
  					newState.step = childState.step;
  				}

  				if (!switch_instance_updating.tooltip && changed.tooltip) {
  					newState.tooltip = childState.tooltip;
  				}
  				component._set(newState);
  				switch_instance_updating = {};
  			}
  		};
  	}

  	if (switch_value) {
  		var switch_instance = new switch_value(switch_props(ctx));

  		component.root._beforecreate.push(function () {
  			switch_instance._bind({ min: 1, max: 1, value: 1, step: 1, tooltip: 1 }, switch_instance.get());
  		});
  	}

  	return {
  		c: function create() {
  			if (switch_instance) switch_instance._fragment.c();
  			switch_instance_anchor = createComment();
  		},

  		m: function mount(target, anchor) {
  			if (slot_content_default) {
  				append(switch_instance._slotted.default, slot_content_default);
  			}

  			if (switch_instance) {
  				switch_instance._mount(target, anchor);
  			}

  			insert(target, switch_instance_anchor, anchor);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var switch_instance_changes = {};
  			if (!switch_instance_updating.min && changed.min) {
  				switch_instance_changes.min = ctx.min;
  				switch_instance_updating.min = ctx.min !== void 0;
  			}
  			if (!switch_instance_updating.max && changed.max) {
  				switch_instance_changes.max = ctx.max;
  				switch_instance_updating.max = ctx.max !== void 0;
  			}
  			if (!switch_instance_updating.value && changed.value) {
  				switch_instance_changes.value = ctx.value;
  				switch_instance_updating.value = ctx.value !== void 0;
  			}
  			if (!switch_instance_updating.step && changed.step) {
  				switch_instance_changes.step = ctx.step;
  				switch_instance_updating.step = ctx.step !== void 0;
  			}
  			if (!switch_instance_updating.tooltip && changed.tooltip) {
  				switch_instance_changes.tooltip = ctx.tooltip;
  				switch_instance_updating.tooltip = ctx.tooltip !== void 0;
  			}

  			if (switch_value !== (switch_value = ctx.orientation === 'horizontal' ? ctx.HSlider : ctx.VSlider)) {
  				if (switch_instance) {
  					var old_component = switch_instance;
  					old_component._fragment.o(function () {
  						old_component.destroy();
  					});
  				}

  				if (switch_value) {
  					switch_instance = new switch_value(switch_props(ctx));

  					component.root._beforecreate.push(function () {
  						var changed = {};
  						if (ctx.min === void 0) changed.min = 1;
  						if (ctx.max === void 0) changed.max = 1;
  						if (ctx.value === void 0) changed.value = 1;
  						if (ctx.step === void 0) changed.step = 1;
  						if (ctx.tooltip === void 0) changed.tooltip = 1;
  						switch_instance._bind(changed, switch_instance.get());
  					});
  					switch_instance._fragment.c();

  					slot.m(switch_instance._slotted.default, null);
  					switch_instance._mount(switch_instance_anchor.parentNode, switch_instance_anchor);
  				} else {
  					switch_instance = null;
  				}
  			} else if (switch_value) {
  				switch_instance._set(switch_instance_changes);
  				switch_instance_updating = {};
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (switch_instance) switch_instance._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (slot_content_default) {
  				reinsertChildren(switch_instance._slotted.default, slot_content_default);
  			}

  			if (detach) {
  				detachNode(switch_instance_anchor);
  			}

  			if (switch_instance) switch_instance.destroy(detach);
  		}
  	};
  }

  function Slider(options) {
  	this._debugName = '<Slider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$2(), options.data);
  	if (!('orientation' in this._state)) console.warn("<Slider> was created without expected data property 'orientation'");
  	if (!('HSlider' in this._state)) console.warn("<Slider> was created without expected data property 'HSlider'");
  	if (!('VSlider' in this._state)) console.warn("<Slider> was created without expected data property 'VSlider'");
  	if (!('min' in this._state)) console.warn("<Slider> was created without expected data property 'min'");
  	if (!('max' in this._state)) console.warn("<Slider> was created without expected data property 'max'");
  	if (!('value' in this._state)) console.warn("<Slider> was created without expected data property 'value'");
  	if (!('step' in this._state)) console.warn("<Slider> was created without expected data property 'step'");
  	if (!('tooltip' in this._state)) console.warn("<Slider> was created without expected data property 'tooltip'");
  	this._intro = !!options.intro;

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$2(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(Slider.prototype, protoDev);

  Slider.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\AlphaSlider\AlphaSlider.html generated by Svelte v2.15.3 */

  function data$3() {
  	return {
  		order: 'asc',
  		alpha: 100,
  		hue: 0,
  		saturation: 1.0,
  		lightness: 0.5
  	};
  }
  var methods$2 = {};

  function onupdate$2(_ref) {
  	var changed = _ref.changed,
  	    current = _ref.current,
  	    previous = _ref.previous;

  	if (changed.hue || changed.saturation || changed.lightness) {
  		var _hsl2rgb = hsl2rgb(current.hue, current.saturation, current.lightness),
  		    r = _hsl2rgb.r,
  		    g = _hsl2rgb.g,
  		    b = _hsl2rgb.b;

  		var ctx = this.refs.alpha.getContext('2d');
  		var imgData = ctx.getImageData(0, 0, this.refs.alpha.width, this.refs.alpha.height);
  		var _data = imgData.data,
  		    width = imgData.width,
  		    height = imgData.height;

  		for (var i = 0, j = 0, k = 0; i < _data.length; i += 4, ++j) {
  			if (j >= width) {
  				++k;
  				j = 0;
  			}
  			var a = k / height;

  			var _get = this.get(),
  			    order = _get.order;

  			a = order === 'desc' ? 1.0 - a : a;
  			_data[i + 0] = r;
  			_data[i + 1] = g;
  			_data[i + 2] = b;
  			_data[i + 3] = Math.round(255 * a);
  		}
  		ctx.putImageData(imgData, 0, 0);
  	}
  }
  var file$3 = "src\\AlphaSlider\\AlphaSlider.html";

  function create_main_fragment$3(component, ctx) {
  	var div,
  	    canvas,
  	    slider_updating = {},
  	    current;

  	var slider_initial_data = {
  		orientation: "vertical",
  		tooltip: "true",
  		min: "0",
  		max: "100",
  		high: "0",
  		step: "0"
  	};
  	if (ctx.alpha !== void 0) {
  		slider_initial_data.value = ctx.alpha;
  		slider_updating.value = true;
  	}
  	var slider = new Slider({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: slider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!slider_updating.value && changed.value) {
  				newState.alpha = childState.value;
  			}
  			component._set(newState);
  			slider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		slider._bind({ value: 1 }, slider.get());
  	});

  	component.refs.slider = slider;

  	return {
  		c: function create() {
  			div = createElement("div");
  			canvas = createElement("canvas");
  			slider._fragment.c();
  			addLoc(canvas, file$3, 2, 8, 154);
  			div.className = "alpha-slider";
  			addLoc(div, file$3, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(slider._slotted.default, canvas);
  			component.refs.alpha = canvas;
  			slider._mount(div, null);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var slider_changes = {};
  			if (!slider_updating.value && changed.alpha) {
  				slider_changes.value = ctx.alpha;
  				slider_updating.value = ctx.alpha !== void 0;
  			}
  			slider._set(slider_changes);
  			slider_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (slider) slider._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.alpha === canvas) component.refs.alpha = null;
  			slider.destroy();
  			if (component.refs.slider === slider) component.refs.slider = null;
  		}
  	};
  }

  function AlphaSlider(options) {
  	var _this = this;

  	this._debugName = '<AlphaSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$3(), options.data);
  	if (!('alpha' in this._state)) console.warn("<AlphaSlider> was created without expected data property 'alpha'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$2];

  	this._fragment = create_main_fragment$3(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(AlphaSlider.prototype, protoDev);
  assign(AlphaSlider.prototype, methods$2);

  AlphaSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\ColorArea\ColorArea.html generated by Svelte v2.15.3 */

  var TIMEOUT$2 = 70;
  function data$4() {
      return {
          hue: 0,
          saturation: 1.0,
          lightness: 0.5
      };
  }
  var methods$3 = {
      click: function click(e) {
          e.stopPropagation();

          var _refs$canvas$getBound = this.refs.canvas.getBoundingClientRect(),
              left = _refs$canvas$getBound.left,
              top = _refs$canvas$getBound.top;

          var x = e.clientX - left;
          var y = e.clientY - top;
          var saturation = 1 - x / this._width;
          var lightness = 1 - y / this._height;
          this.set({ saturation: saturation, lightness: lightness });
      },
      start: function start(e) {
          e.stopPropagation();
          this._offsetX = e.offsetX;
          this._offsetY = e.offsetY;
          this._moving = true;
      },
      move: function move(e) {
          if (this._moving) {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';

              var _refs$canvas$getBound2 = this.refs.canvas.getBoundingClientRect(),
                  left = _refs$canvas$getBound2.left,
                  top = _refs$canvas$getBound2.top;
              // handle x


              var x = e.clientX - this._offsetX + this._halfWidth - left;
              if (x < 0) {
                  x = 0;
              } else if (x > this._width) {
                  x = this._width;
              }
              // handle y
              var y = e.clientY - this._offsetY + this._halfHeight - top;
              if (y < 0) {
                  y = 0;
              } else if (y > this._height) {
                  y = this._height;
              }
              var saturation = 1 - x / this._width;
              var lightness = 1 - y / this._height;

              this.set({ saturation: saturation, lightness: lightness });
          }
      },
      stop: function stop(e) {
          if (this._moving) {
              e.stopPropagation();
              document.body.style.cursor = 'initial';
              this._offsetX = 0;
              this._offsetY = 0;
              this._moving = false;
          }
      }
  };

  function oncreate$2() {
      var samplerRect = this.refs.sampler.getBoundingClientRect();
      this._halfWidth = samplerRect.width / 2;
      this._halfHeight = samplerRect.height / 2;
      this._width = this.refs.canvas.clientWidth;
      this._height = this.refs.canvas.clientHeight;
      this._moving = false;
      this._offsetX = 0;
      this._offsetY = 0;
  }
  function onupdate$3(_ref) {
      var _this = this;

      var changed = _ref.changed,
          current = _ref.current,
          previous = _ref.previous;

      setTimeout(function () {
          if (changed.saturation) {
              var s = current.saturation;
              _this.refs.sampler.style.left = Math.round((1 - s) * _this._width) + 'px';
          }
          if (changed.lightness) {
              var l = current.lightness;
              _this.refs.sampler.style.top = Math.round((1 - l) * _this._height) + 'px';

              var _hsl2rgb = hsl2rgb(0, 0, 1 - l),
                  r = _hsl2rgb.r,
                  g = _hsl2rgb.g,
                  b = _hsl2rgb.b;

              _this.refs.sampler.style.borderColor = 'rgb(' + [r, g, b].join(',') + ')';
          }
          if (changed.hue) {
              var _get = _this.get(),
                  saturation = _get.saturation,
                  lightness = _get.lightness;
              var h = current.hue;
              var ctx = _this.refs.canvas.getContext('2d');
              var imgData = ctx.getImageData(0, 0, _this.refs.canvas.width, _this.refs.canvas.height);
              var _data = imgData.data,
                  width = imgData.width,
                  height = imgData.height;
              // let buff = new ArrayBuffer(width * height * 4);
              // let data = new DataView(buff);                    

              var k = 0;
              // let data = new Uint8ClampedArray(width * height * 4);
              // let data = new Uint8Array(width * height * 4);
              // let data = imgData.data;
              for (var i = height - 1; i >= 0; --i) {
                  for (var j = width - 1; j >= 0; --j) {
                      var _s2 = j / width;
                      var _l2 = i / height;

                      var _hsl2rgb2 = hsl2rgb(h, _s2, _l2),
                          _r = _hsl2rgb2.r,
                          _g = _hsl2rgb2.g,
                          _b = _hsl2rgb2.b;

                      _data[k + 0] = _r;
                      _data[k + 1] = _g;
                      _data[k + 2] = _b;
                      _data[k + 3] = 255;
                      // data.setUint8(k + 0, r);
                      // data.setUint8(k + 1, g);
                      // data.setUint8(k + 2, b);
                      // data.setUint8(k + 3, Math.round (a * 255));
                      k += 4;
                  }
              }
              // imgData.data.set(data);
              ctx.putImageData(imgData, 0, 0);
          }
      }, TIMEOUT$2);
  }
  var file$4 = "src\\ColorArea\\ColorArea.html";

  function create_main_fragment$4(component, ctx) {
      var div1, canvas, text, div0, current;

      function onwindowmousemove(event) {
          component.move(event);    }
      window.addEventListener("mousemove", onwindowmousemove);

      function onwindowmouseup(event) {
          component.stop(event);    }
      window.addEventListener("mouseup", onwindowmouseup);

      function click_handler(event) {
          component.click(event);
      }

      function mousedown_handler(event) {
          component.start(event);
      }

      return {
          c: function create() {
              div1 = createElement("div");
              canvas = createElement("canvas");
              text = createText("\r\n    ");
              div0 = createElement("div");
              addListener(canvas, "click", click_handler);
              addLoc(canvas, file$4, 2, 4, 119);
              addListener(div0, "mousedown", mousedown_handler);
              div0.className = "sampler";
              addLoc(div0, file$4, 3, 4, 177);
              div1.className = "color-area";
              addLoc(div1, file$4, 1, 0, 71);
          },

          m: function mount(target, anchor) {
              insert(target, div1, anchor);
              append(div1, canvas);
              component.refs.canvas = canvas;
              append(div1, text);
              append(div1, div0);
              component.refs.sampler = div0;
              component.refs.container = div1;
              current = true;
          },

          p: noop,

          i: function intro(target, anchor) {
              if (current) return;

              this.m(target, anchor);
          },

          o: run,

          d: function destroy$$1(detach) {
              window.removeEventListener("mousemove", onwindowmousemove);

              window.removeEventListener("mouseup", onwindowmouseup);

              if (detach) {
                  detachNode(div1);
              }

              removeListener(canvas, "click", click_handler);
              if (component.refs.canvas === canvas) component.refs.canvas = null;
              removeListener(div0, "mousedown", mousedown_handler);
              if (component.refs.sampler === div0) component.refs.sampler = null;
              if (component.refs.container === div1) component.refs.container = null;
          }
      };
  }

  function ColorArea(options) {
      var _this2 = this;

      this._debugName = '<ColorArea>';
      if (!options || !options.target && !options.root) {
          throw new Error("'target' is a required option");
      }

      init(this, options);
      this.refs = {};
      this._state = assign(data$4(), options.data);
      this._intro = !!options.intro;
      this._handlers.update = [onupdate$3];

      this._fragment = create_main_fragment$4(this, this._state);

      this.root._oncreate.push(function () {
          oncreate$2.call(_this2);
          _this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
      });

      if (options.target) {
          if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
          this._fragment.c();
          this._mount(options.target, options.anchor);

          flush(this);
      }

      this._intro = true;
  }

  assign(ColorArea.prototype, protoDev);
  assign(ColorArea.prototype, methods$3);

  ColorArea.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\ColorSlider\ColorSlider.html generated by Svelte v2.15.3 */

  function data$5() {
  	return { hue: 0 };
  }
  function onupdate$4() {
  	var ctx = this.refs.color.getContext('2d');
  	var imgData = ctx.createImageData(this.refs.color.width, this.refs.color.height);
  	var data = imgData.data,
  	    width = imgData.width;

  	for (var i = 0; i < data.length; i += 4) {
  		var h = i / 4 % width * 360 / width;

  		var _hsl2rgb = hsl2rgb(h, this.constructor.SATURATION, this.constructor.LIGHTNESS),
  		    r = _hsl2rgb.r,
  		    g = _hsl2rgb.g,
  		    b = _hsl2rgb.b;

  		data[i + 0] = r;
  		data[i + 1] = g;
  		data[i + 2] = b;
  		data[i + 3] = this.constructor.ALPHA;
  	}
  	ctx.putImageData(imgData, 0, 0);
  }
  function setup(Component) {
  	Component.SATURATION = 1.0;
  	Component.LIGHTNESS = 0.5;
  	Component.ALPHA = 255;
  }
  var file$5 = "src\\ColorSlider\\ColorSlider.html";

  function create_main_fragment$5(component, ctx) {
  	var div,
  	    canvas,
  	    slider_updating = {},
  	    current;

  	var slider_initial_data = {
  		orientation: "horizontal",
  		tooltip: "false",
  		min: "0",
  		max: "360",
  		high: "0",
  		step: "0"
  	};
  	if (ctx.hue !== void 0) {
  		slider_initial_data.value = ctx.hue;
  		slider_updating.value = true;
  	}
  	var slider = new Slider({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: slider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!slider_updating.value && changed.value) {
  				newState.hue = childState.value;
  			}
  			component._set(newState);
  			slider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		slider._bind({ value: 1 }, slider.get());
  	});

  	component.refs.slider = slider;

  	return {
  		c: function create() {
  			div = createElement("div");
  			canvas = createElement("canvas");
  			slider._fragment.c();
  			addLoc(canvas, file$5, 2, 8, 155);
  			div.className = "color-slider";
  			addLoc(div, file$5, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(slider._slotted.default, canvas);
  			component.refs.color = canvas;
  			slider._mount(div, null);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var slider_changes = {};
  			if (!slider_updating.value && changed.hue) {
  				slider_changes.value = ctx.hue;
  				slider_updating.value = ctx.hue !== void 0;
  			}
  			slider._set(slider_changes);
  			slider_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (slider) slider._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			if (component.refs.color === canvas) component.refs.color = null;
  			slider.destroy();
  			if (component.refs.slider === slider) component.refs.slider = null;
  		}
  	};
  }

  function ColorSlider(options) {
  	var _this = this;

  	this._debugName = '<ColorSlider>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$5(), options.data);
  	if (!('hue' in this._state)) console.warn("<ColorSlider> was created without expected data property 'hue'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$4];

  	this._fragment = create_main_fragment$5(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(ColorSlider.prototype, protoDev);

  ColorSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  setup(ColorSlider);

  /* src\ColorPicker\ColorPicker.html generated by Svelte v2.15.3 */

  function value(_ref) {
  	var mode = _ref.mode,
  	    hex = _ref.hex,
  	    rgb = _ref.rgb;

  	return mode === 'hex' ? hex : rgb;
  }

  function hex(_ref2) {
  	var hue = _ref2.hue,
  	    saturation = _ref2.saturation,
  	    lightness = _ref2.lightness;

  	var _hsl2rgb = hsl2rgb(hue, saturation, lightness),
  	    r = _hsl2rgb.r,
  	    g = _hsl2rgb.g,
  	    b = _hsl2rgb.b;

  	return rgb2hex(r, g, b);
  }

  function rgb(_ref3) {
  	var hue = _ref3.hue,
  	    saturation = _ref3.saturation,
  	    lightness = _ref3.lightness;

  	var _hsl2rgb2 = hsl2rgb(hue, saturation, lightness),
  	    r = _hsl2rgb2.r,
  	    g = _hsl2rgb2.g,
  	    b = _hsl2rgb2.b;

  	return [r, g, b].join(',');
  }

  function rgba(_ref4) {
  	var hue = _ref4.hue,
  	    saturation = _ref4.saturation,
  	    lightness = _ref4.lightness,
  	    alpha = _ref4.alpha;

  	var _hsl2rgb3 = hsl2rgb(hue, saturation, lightness),
  	    r = _hsl2rgb3.r,
  	    g = _hsl2rgb3.g,
  	    b = _hsl2rgb3.b;

  	var a = alpha / 100;
  	return 'rgba(' + [r, g, b, a].join(',') + ')';
  }

  function data$6() {
  	return {
  		mode: 'hex',
  		alpha: 100,
  		hue: 0,
  		saturation: 1.0,
  		lightness: 0.5
  	};
  }
  var methods$4 = {
  	prevent: function prevent(e) {
  		e.stopPropagation();
  		e.preventDefault();
  	},
  	change: function change(_ref5) {
  		var value = _ref5.target.value;

  		var _get = this.get(),
  		    mode = _get.mode;

  		var _r$g$b = { r: 0, g: 0, b: 0 },
  		    r = _r$g$b.r,
  		    g = _r$g$b.g,
  		    b = _r$g$b.b;

  		if (mode === 'hex') {
  			var _hex2rgb = hex2rgb(value),
  			    r = _hex2rgb.r,
  			    g = _hex2rgb.g,
  			    b = _hex2rgb.b;
  		} else if (mode === 'rgb') {
  			var _value$split$map = value.split(',').map(function (x) {
  				return parseInt(x, 10);
  			}),
  			    _value$split$map2 = slicedToArray(_value$split$map, 3),
  			    r = _value$split$map2[0],
  			    g = _value$split$map2[1],
  			    b = _value$split$map2[2];
  		}

  		var _rgb2hsl = rgb2hsl(r, g, b),
  		    h = _rgb2hsl.h,
  		    s = _rgb2hsl.s,
  		    l = _rgb2hsl.l;

  		this.set({ hue: h, saturation: s, lightness: l });
  	},
  	keydown: function keydown(e) {
  		if (e.keyCode === 13) {
  			this.change(this.refs.box.value);
  		}
  	}
  };

  function onupdate$5(_ref6) {
  	var changed = _ref6.changed,
  	    current = _ref6.current;

  	if (changed.rgba) {
  		this.refs.sample.style.backgroundColor = current.rgba;
  	}
  	if (changed.value) {
  		this.refs.box.value = current.value;
  	}
  }
  var file$6 = "src\\ColorPicker\\ColorPicker.html";

  function create_main_fragment$6(component, ctx) {
  	var table,
  	    tr0,
  	    td0,
  	    span0,
  	    text0,
  	    td1,
  	    span1,
  	    text1,
  	    text2,
  	    input,
  	    text3,
  	    td2,
  	    span2,
  	    text4,
  	    td3,
  	    text5,
  	    tr1,
  	    td4,
  	    colorarea_updating = {},
  	    text6,
  	    td5,
  	    alphaslider_updating = {},
  	    text7,
  	    tr2,
  	    td6,
  	    colorslider_updating = {},
  	    text8,
  	    td7,
  	    current;

  	function change_handler(event) {
  		component.change(event);
  	}

  	function click_handler(event) {
  		component.set({ mode: ctx.mode === 'hex' ? 'rgb' : 'hex' });
  	}

  	var colorarea_initial_data = {};
  	if (ctx.hue !== void 0) {
  		colorarea_initial_data.hue = ctx.hue;
  		colorarea_updating.hue = true;
  	}
  	if (ctx.saturation !== void 0) {
  		colorarea_initial_data.saturation = ctx.saturation;
  		colorarea_updating.saturation = true;
  	}
  	if (ctx.lightness !== void 0) {
  		colorarea_initial_data.lightness = ctx.lightness;
  		colorarea_updating.lightness = true;
  	}
  	var colorarea = new ColorArea({
  		root: component.root,
  		store: component.store,
  		data: colorarea_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!colorarea_updating.hue && changed.hue) {
  				newState.hue = childState.hue;
  			}

  			if (!colorarea_updating.saturation && changed.saturation) {
  				newState.saturation = childState.saturation;
  			}

  			if (!colorarea_updating.lightness && changed.lightness) {
  				newState.lightness = childState.lightness;
  			}
  			component._set(newState);
  			colorarea_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		colorarea._bind({ hue: 1, saturation: 1, lightness: 1 }, colorarea.get());
  	});

  	var alphaslider_initial_data = {};
  	if (ctx.alpha !== void 0) {
  		alphaslider_initial_data.alpha = ctx.alpha;
  		alphaslider_updating.alpha = true;
  	}
  	if (ctx.hue !== void 0) {
  		alphaslider_initial_data.hue = ctx.hue;
  		alphaslider_updating.hue = true;
  	}
  	if (ctx.saturation !== void 0) {
  		alphaslider_initial_data.saturation = ctx.saturation;
  		alphaslider_updating.saturation = true;
  	}
  	if (ctx.lightness !== void 0) {
  		alphaslider_initial_data.lightness = ctx.lightness;
  		alphaslider_updating.lightness = true;
  	}
  	var alphaslider = new AlphaSlider({
  		root: component.root,
  		store: component.store,
  		data: alphaslider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!alphaslider_updating.alpha && changed.alpha) {
  				newState.alpha = childState.alpha;
  			}

  			if (!alphaslider_updating.hue && changed.hue) {
  				newState.hue = childState.hue;
  			}

  			if (!alphaslider_updating.saturation && changed.saturation) {
  				newState.saturation = childState.saturation;
  			}

  			if (!alphaslider_updating.lightness && changed.lightness) {
  				newState.lightness = childState.lightness;
  			}
  			component._set(newState);
  			alphaslider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		alphaslider._bind({ alpha: 1, hue: 1, saturation: 1, lightness: 1 }, alphaslider.get());
  	});

  	var colorslider_initial_data = {};
  	if (ctx.hue !== void 0) {
  		colorslider_initial_data.hue = ctx.hue;
  		colorslider_updating.hue = true;
  	}
  	var colorslider = new ColorSlider({
  		root: component.root,
  		store: component.store,
  		data: colorslider_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!colorslider_updating.hue && changed.hue) {
  				newState.hue = childState.hue;
  			}
  			component._set(newState);
  			colorslider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		colorslider._bind({ hue: 1 }, colorslider.get());
  	});

  	function click_handler_1(event) {
  		component.prevent(event);
  	}

  	function dragstart_handler(event) {
  		component.prevent(event);
  	}

  	return {
  		c: function create() {
  			table = createElement("table");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			span0 = createElement("span");
  			text0 = createText("\r\n        ");
  			td1 = createElement("td");
  			span1 = createElement("span");
  			text1 = createText(ctx.mode);
  			text2 = createText("\r\n            ");
  			input = createElement("input");
  			text3 = createText("\r\n        ");
  			td2 = createElement("td");
  			span2 = createElement("span");
  			text4 = createText("\r\n        ");
  			td3 = createElement("td");
  			text5 = createText("\r\n    ");
  			tr1 = createElement("tr");
  			td4 = createElement("td");
  			colorarea._fragment.c();
  			text6 = createText("\r\n        ");
  			td5 = createElement("td");
  			alphaslider._fragment.c();
  			text7 = createText("\r\n    ");
  			tr2 = createElement("tr");
  			td6 = createElement("td");
  			colorslider._fragment.c();
  			text8 = createText("\r\n        ");
  			td7 = createElement("td");
  			span0.className = "color-picker-sample";
  			addLoc(span0, file$6, 3, 12, 126);
  			addLoc(td0, file$6, 2, 8, 108);
  			span1.className = "color-picker-mode";
  			addLoc(span1, file$6, 6, 12, 221);
  			addListener(input, "change", change_handler);
  			setAttribute(input, "type", "text");
  			input.className = "color-picker-box";
  			addLoc(input, file$6, 7, 12, 280);
  			addLoc(td1, file$6, 5, 8, 203);
  			addListener(span2, "click", click_handler);
  			span2.className = "color-picker-box-button";
  			addLoc(span2, file$6, 10, 12, 403);
  			addLoc(td2, file$6, 9, 8, 385);
  			addLoc(td3, file$6, 12, 8, 528);
  			addLoc(tr0, file$6, 1, 4, 94);
  			td4.colSpan = "3";
  			td4.className = "color-area-container";
  			addLoc(td4, file$6, 16, 8, 578);
  			td5.className = "alpha-slider-container";
  			addLoc(td5, file$6, 19, 8, 715);
  			addLoc(tr1, file$6, 15, 4, 564);
  			td6.colSpan = "3";
  			td6.className = "color-slider-container";
  			addLoc(td6, file$6, 24, 8, 876);
  			addLoc(td7, file$6, 27, 8, 986);
  			addLoc(tr2, file$6, 23, 4, 862);
  			addListener(table, "click", click_handler_1);
  			addListener(table, "dragstart", dragstart_handler);
  			table.className = "color-picker";
  			addLoc(table, file$6, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, table, anchor);
  			append(table, tr0);
  			append(tr0, td0);
  			append(td0, span0);
  			component.refs.sample = span0;
  			append(tr0, text0);
  			append(tr0, td1);
  			append(td1, span1);
  			append(span1, text1);
  			append(td1, text2);
  			append(td1, input);
  			component.refs.box = input;
  			append(tr0, text3);
  			append(tr0, td2);
  			append(td2, span2);
  			append(tr0, text4);
  			append(tr0, td3);
  			append(table, text5);
  			append(table, tr1);
  			append(tr1, td4);
  			colorarea._mount(td4, null);
  			append(tr1, text6);
  			append(tr1, td5);
  			alphaslider._mount(td5, null);
  			append(table, text7);
  			append(table, tr2);
  			append(tr2, td6);
  			colorslider._mount(td6, null);
  			append(tr2, text8);
  			append(tr2, td7);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			if (!current || changed.mode) {
  				setData(text1, ctx.mode);
  			}

  			var colorarea_changes = {};
  			if (!colorarea_updating.hue && changed.hue) {
  				colorarea_changes.hue = ctx.hue;
  				colorarea_updating.hue = ctx.hue !== void 0;
  			}
  			if (!colorarea_updating.saturation && changed.saturation) {
  				colorarea_changes.saturation = ctx.saturation;
  				colorarea_updating.saturation = ctx.saturation !== void 0;
  			}
  			if (!colorarea_updating.lightness && changed.lightness) {
  				colorarea_changes.lightness = ctx.lightness;
  				colorarea_updating.lightness = ctx.lightness !== void 0;
  			}
  			colorarea._set(colorarea_changes);
  			colorarea_updating = {};

  			var alphaslider_changes = {};
  			if (!alphaslider_updating.alpha && changed.alpha) {
  				alphaslider_changes.alpha = ctx.alpha;
  				alphaslider_updating.alpha = ctx.alpha !== void 0;
  			}
  			if (!alphaslider_updating.hue && changed.hue) {
  				alphaslider_changes.hue = ctx.hue;
  				alphaslider_updating.hue = ctx.hue !== void 0;
  			}
  			if (!alphaslider_updating.saturation && changed.saturation) {
  				alphaslider_changes.saturation = ctx.saturation;
  				alphaslider_updating.saturation = ctx.saturation !== void 0;
  			}
  			if (!alphaslider_updating.lightness && changed.lightness) {
  				alphaslider_changes.lightness = ctx.lightness;
  				alphaslider_updating.lightness = ctx.lightness !== void 0;
  			}
  			alphaslider._set(alphaslider_changes);
  			alphaslider_updating = {};

  			var colorslider_changes = {};
  			if (!colorslider_updating.hue && changed.hue) {
  				colorslider_changes.hue = ctx.hue;
  				colorslider_updating.hue = ctx.hue !== void 0;
  			}
  			colorslider._set(colorslider_changes);
  			colorslider_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			outrocallback = callAfter(outrocallback, 3);

  			if (colorarea) colorarea._fragment.o(outrocallback);
  			if (alphaslider) alphaslider._fragment.o(outrocallback);
  			if (colorslider) colorslider._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(table);
  			}

  			if (component.refs.sample === span0) component.refs.sample = null;
  			removeListener(input, "change", change_handler);
  			if (component.refs.box === input) component.refs.box = null;
  			removeListener(span2, "click", click_handler);
  			colorarea.destroy();
  			alphaslider.destroy();
  			colorslider.destroy();
  			removeListener(table, "click", click_handler_1);
  			removeListener(table, "dragstart", dragstart_handler);
  		}
  	};
  }

  function ColorPicker(options) {
  	var _this = this;

  	this._debugName = '<ColorPicker>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$6(), options.data);

  	this._recompute({ hue: 1, saturation: 1, lightness: 1, mode: 1, hex: 1, rgb: 1, alpha: 1 }, this._state);
  	if (!('mode' in this._state)) console.warn("<ColorPicker> was created without expected data property 'mode'");

  	if (!('hue' in this._state)) console.warn("<ColorPicker> was created without expected data property 'hue'");
  	if (!('saturation' in this._state)) console.warn("<ColorPicker> was created without expected data property 'saturation'");
  	if (!('lightness' in this._state)) console.warn("<ColorPicker> was created without expected data property 'lightness'");
  	if (!('alpha' in this._state)) console.warn("<ColorPicker> was created without expected data property 'alpha'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$5];

  	this._fragment = create_main_fragment$6(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(ColorPicker.prototype, protoDev);
  assign(ColorPicker.prototype, methods$4);

  ColorPicker.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hex' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'hex'");
  	if ('rgb' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'rgb'");
  	if ('value' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'value'");
  	if ('rgba' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'rgba'");
  };

  ColorPicker.prototype._recompute = function _recompute(changed, state) {
  	if (changed.hue || changed.saturation || changed.lightness) {
  		if (this._differs(state.hex, state.hex = hex(state))) changed.hex = true;
  		if (this._differs(state.rgb, state.rgb = rgb(state))) changed.rgb = true;
  	}

  	if (changed.mode || changed.hex || changed.rgb) {
  		if (this._differs(state.value, state.value = value(state))) changed.value = true;
  	}

  	if (changed.hue || changed.saturation || changed.lightness || changed.alpha) {
  		if (this._differs(state.rgba, state.rgba = rgba(state))) changed.rgba = true;
  	}
  };

  exports.ColorPicker = ColorPicker;
  exports.hsl2rgb = hsl2rgb;
  exports.rgb2hsl = rgb2hsl;
  exports.rgb2hex = rgb2hex;
  exports.hex2rgb = hex2rgb;
  exports.int2hex = int2hex;
  exports.hex2int = hex2int;

  });

  unwrapExports$$1(scanexColorPicker_cjs);
  var scanexColorPicker_cjs_1 = scanexColorPicker_cjs.ColorPicker;
  var scanexColorPicker_cjs_2 = scanexColorPicker_cjs.hsl2rgb;
  var scanexColorPicker_cjs_3 = scanexColorPicker_cjs.rgb2hsl;
  var scanexColorPicker_cjs_4 = scanexColorPicker_cjs.rgb2hex;
  var scanexColorPicker_cjs_5 = scanexColorPicker_cjs.hex2rgb;
  var scanexColorPicker_cjs_6 = scanexColorPicker_cjs.int2hex;
  var scanexColorPicker_cjs_7 = scanexColorPicker_cjs.hex2int;

  var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop$1() {}

  function assign$1(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue$1(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function addLoc$1(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run$1(fn) {
  	fn();
  }

  function insert$1(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode$1(node) {
  	node.parentNode.removeChild(node);
  }

  function createElement$1(name) {
  	return document.createElement(name);
  }

  function addListener$1(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener$1(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function setAttribute$1(node, attribute, value) {
  	if (value == null) node.removeAttribute(attribute);else node.setAttribute(attribute, value);
  }

  function blankObject$1() {
  	return Object.create(null);
  }

  function destroy$1(detach) {
  	this.destroy = noop$1;
  	this.fire('destroy');
  	this.set = noop$1;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev$1(detach) {
  	destroy$1.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs$1(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof$1(a)) === 'object' || typeof a === 'function';
  }

  function fire$1(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush$1(component) {
  	component._lock = true;
  	callAll$1(component._beforecreate);
  	callAll$1(component._oncreate);
  	callAll$1(component._aftercreate);
  	component._lock = false;
  }

  function get$1$1() {
  	return this._state;
  }

  function init$1(component, options) {
  	component._handlers = blankObject$1();
  	component._slots = blankObject$1();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on$1(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1$1(newState) {
  	this._set(assign$1({}, newState));
  	if (this.root._lock) return;
  	flush$1(this.root);
  }

  function _set$1(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign$1(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign$1(assign$1({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage$1(newState) {
  	assign$1(this._staged, newState);
  }

  function setDev$1(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof$1(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1$1.call(this, newState);
  }

  function callAll$1(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount$1(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev$1 = {
  	destroy: destroyDev$1,
  	get: get$1$1,
  	fire: fire$1,
  	on: on$1,
  	set: setDev$1,
  	_recompute: noop$1,
  	_set: _set$1,
  	_stage: _stage$1,
  	_mount: _mount$1,
  	_differs: _differs$1
  };

  /* src\ValidatingInput.html generated by Svelte v2.15.3 */

  function data() {
  	return {
  		value: '',
  		validate: function validate() {
  			return true;
  		},
  		placeholder: '',
  		allowEmpty: false
  	};
  }
  function onupdate(_ref) {
  	var changed = _ref.changed,
  	    current = _ref.current,
  	    previous = _ref.previous;

  	if (changed.value) {
  		var _get = this.get(),
  		    validate = _get.validate,
  		    allowEmpty = _get.allowEmpty;

  		var ok = false;
  		switch (typeof validate === 'undefined' ? 'undefined' : _typeof$1(validate)) {
  			case 'function':
  				ok = validate(current.value);
  				break;
  			case 'string':
  				ok = new RegExp(validate, 'g').test(current.value);
  				break;
  			default:
  				break;
  		}
  		var emptyAllowed = false;
  		switch (typeof allowEmpty === 'undefined' ? 'undefined' : _typeof$1(allowEmpty)) {
  			case 'string':
  				emptyAllowed = allowEmpty.toLowerCase() === 'true';
  				break;
  			case 'boolean':
  				emptyAllowed = allowEmpty;
  				break;
  			default:
  				break;
  		}
  		if (!ok) {
  			if (!emptyAllowed && previous && previous.value) {
  				this.set({ value: previous.value });
  			} else {
  				this.set({ value: '' });
  			}
  		}
  	}
  }
  var file = "src\\ValidatingInput.html";

  function create_main_fragment(component, ctx) {
  	var input,
  	    input_updating = false,
  	    current;

  	function input_input_handler() {
  		input_updating = true;
  		component.set({ value: input.value });
  		input_updating = false;
  	}

  	function change_handler(event) {
  		component.set({ value: event.target.value });
  	}

  	return {
  		c: function create() {
  			input = createElement$1("input");
  			addListener$1(input, "input", input_input_handler);
  			addListener$1(input, "change", change_handler);
  			setAttribute$1(input, "type", "text");
  			input.placeholder = ctx.placeholder;
  			addLoc$1(input, file, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert$1(target, input, anchor);

  			input.value = ctx.value;

  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (!input_updating && changed.value) input.value = ctx.value;
  			if (changed.placeholder) {
  				input.placeholder = ctx.placeholder;
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run$1,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode$1(input);
  			}

  			removeListener$1(input, "input", input_input_handler);
  			removeListener$1(input, "change", change_handler);
  		}
  	};
  }

  function ValidatingInput(options) {
  	var _this = this;

  	this._debugName = '<ValidatingInput>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init$1(this, options);
  	this._state = assign$1(data(), options.data);
  	if (!('placeholder' in this._state)) console.warn("<ValidatingInput> was created without expected data property 'placeholder'");
  	if (!('value' in this._state)) console.warn("<ValidatingInput> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate];

  	this._fragment = create_main_fragment(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue$1({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush$1(this);
  	}

  	this._intro = true;
  }

  assign$1(ValidatingInput.prototype, protoDev$1);

  ValidatingInput.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  var scanexValidatingInput_cjs = ValidatingInput;

  /* src\ExtendedColorPicker.html generated by Svelte v2.16.1 */

  function data$1() {
  	return {
  		color: '#FFFFFF'
  	};
  }
  var methods = {
  	click: function click(e) {
  		if (this.colorPicker) {
  			this.colorPicker.destroy();
  			this.colorPicker = null;
  			this.refs.pickerContainer.style.visibility = 'hidden';
  		}
  	},
  	changeColor: function changeColor(_ref) {
  		var changed = _ref.changed,
  		    current = _ref.current,
  		    previous = _ref.previous;

  		if (changed.rgba) {
  			this.set({ color: current.hex, alpha: current.alpha });
  		}
  	},
  	showPicker: function showPicker(e) {
  		e.stopPropagation();
  		if (!this.colorPicker) {
  			var _get = this.get(),
  			    color = _get.color;

  			var _hex2rgb = scanexColorPicker_cjs_5(color || '#FFFFFF'),
  			    r = _hex2rgb.r,
  			    g = _hex2rgb.g,
  			    b = _hex2rgb.b;

  			var _rgb2hsl = scanexColorPicker_cjs_3(r, g, b),
  			    h = _rgb2hsl.h,
  			    s = _rgb2hsl.s,
  			    l = _rgb2hsl.l;

  			h = h || 0;

  			var _refs$button$getBound = this.refs.button.getBoundingClientRect(),
  			    right = _refs$button$getBound.right,
  			    top = _refs$button$getBound.top;

  			this.refs.pickerContainer.style.left = right + 10 + 'px';
  			this.refs.pickerContainer.style.top = top + 'px';
  			this.refs.pickerContainer.style.visibility = 'visible';

  			this.colorPicker = new scanexColorPicker_cjs_1({
  				target: this.refs.pickerContainer,
  				data: { hue: h, saturation: s, lightness: l, alpha: 100 }
  			});
  			this.colorPicker.on('state', this.changeColor.bind(this));
  		}
  	}
  };

  function onupdate$1(_ref2) {
  	var changed = _ref2.changed,
  	    current = _ref2.current;

  	if (changed.color) {
  		this.refs.button.style.backgroundColor = current.color;
  	}
  }
  var file$1 = "src\\ExtendedColorPicker.html";

  function create_main_fragment$1(component, ctx) {
  	var div4,
  	    div0,
  	    validatinginput_updating = {},
  	    text0,
  	    div2,
  	    div1,
  	    text1,
  	    div3,
  	    current;

  	function onwindowclick(event) {
  		component.click(event);	}
  	window.addEventListener("click", onwindowclick);

  	var validatinginput_initial_data = {
  		placeholder: "#FFFFFF",
  		validate: "^#[0-9a-fA-F]+$"
  	};
  	if (ctx.color !== void 0) {
  		validatinginput_initial_data.value = ctx.color;
  		validatinginput_updating.value = true;
  	}
  	var validatinginput = new scanexValidatingInput_cjs({
  		root: component.root,
  		store: component.store,
  		data: validatinginput_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!validatinginput_updating.value && changed.value) {
  				newState.color = childState.value;
  			}
  			component._set(newState);
  			validatinginput_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		validatinginput._bind({ value: 1 }, validatinginput.get());
  	});

  	function click_handler(event) {
  		component.showPicker(event);
  	}

  	return {
  		c: function create() {
  			div4 = createElement("div");
  			div0 = createElement("div");
  			validatinginput._fragment.c();
  			text0 = createText("\r\n    ");
  			div2 = createElement("div");
  			div1 = createElement("div");
  			text1 = createText("\r\n    ");
  			div3 = createElement("div");
  			div0.className = "scanex-extended-color-picker-color";
  			addLoc(div0, file$1, 2, 4, 94);
  			addLoc(div1, file$1, 6, 8, 345);
  			addListener(div2, "click", click_handler);
  			div2.className = "scanex-extended-color-picker-button";
  			addLoc(div2, file$1, 5, 4, 257);
  			div3.className = "scanex-extended-color-picker-container";
  			addLoc(div3, file$1, 8, 4, 385);
  			div4.className = "scanex-extended-color-picker";
  			addLoc(div4, file$1, 1, 0, 42);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div4, anchor);
  			append(div4, div0);
  			validatinginput._mount(div0, null);
  			append(div4, text0);
  			append(div4, div2);
  			append(div2, div1);
  			component.refs.button = div1;
  			append(div4, text1);
  			append(div4, div3);
  			component.refs.pickerContainer = div3;
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var validatinginput_changes = {};
  			if (!validatinginput_updating.value && changed.color) {
  				validatinginput_changes.value = ctx.color;
  				validatinginput_updating.value = ctx.color !== void 0;
  			}
  			validatinginput._set(validatinginput_changes);
  			validatinginput_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (validatinginput) validatinginput._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			window.removeEventListener("click", onwindowclick);

  			if (detach) {
  				detachNode(div4);
  			}

  			validatinginput.destroy();
  			if (component.refs.button === div1) component.refs.button = null;
  			removeListener(div2, "click", click_handler);
  			if (component.refs.pickerContainer === div3) component.refs.pickerContainer = null;
  		}
  	};
  }

  function ExtendedColorPicker(options) {
  	var _this = this;

  	this._debugName = '<ExtendedColorPicker>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$1(), options.data);
  	if (!('color' in this._state)) console.warn("<ExtendedColorPicker> was created without expected data property 'color'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$1];

  	this._fragment = create_main_fragment$1(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(ExtendedColorPicker.prototype, protoDev);
  assign(ExtendedColorPicker.prototype, methods);

  ExtendedColorPicker.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  module.exports = ExtendedColorPicker;

  });

  var ExtendedColorPicker = unwrapExports(scanexExtendedColorPicker_cjs);

  /* src\Layout\StateButton.html generated by Svelte v2.16.1 */

  function data$8() {
  	return {
  		flag: true
  	};
  }
  function create_main_fragment$8(component, ctx) {
  	var button,
  	    slot_content_default = component._slotted.default;

  	function click_handler(event) {
  		component.set({ flag: !ctx.flag });
  	}

  	return {
  		c: function c() {
  			button = createElement("button");
  			addListener(button, "click", click_handler);
  			button.className = "state-button";
  			toggleClass(button, "selected", ctx.flag);
  		},
  		m: function m(target, anchor) {
  			insert(target, button, anchor);

  			if (slot_content_default) {
  				append(button, slot_content_default);
  			}
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.flag) {
  				toggleClass(button, "selected", ctx.flag);
  			}
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(button);
  			}

  			if (slot_content_default) {
  				reinsertChildren(button, slot_content_default);
  			}

  			removeListener(button, "click", click_handler);
  		}
  	};
  }

  function StateButton(options) {
  	init(this, options);
  	this._state = assign(data$8(), options.data);
  	this._intro = true;

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$8(this, this._state);

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}
  }

  assign(StateButton.prototype, proto);

  var translate$1 = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

  Number.isInteger = Number.isInteger || function (value) {
      return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
  };

  var DEFAULT_STYLE = {
      balloon: '',
      dashes: '10 10',
      decorationFill: '#FFFFFF',
      decorationFillAlpha: 100,
      decorationOutline: '#000000',
      decorationOutlineAlpha: 100,
      decorationOutlineSize: 1,
      decorationOutlineType: true,
      filter: '',
      fillStyle: 0,
      legendField: '',
      legendFill: '#000000',
      legendFont: 'Roboto',
      legendFontSize: 10,
      legendFontStyle: '',
      legendFontStyles: ['Regular'],
      legendOffsetX: 0,
      legendOffsetY: 0,
      legendOutline: '#FFFFFF',
      legendOutlineSize: 10,
      legendMinZoom: 1,
      legendMaxZoom: 21,
      markerAngle: '',
      markerScale: 1,
      markerMaxScale: 1000,
      markerMinScale: 0.01,
      markerSize: 10,
      markerUrl: '',
      maxZoom: 22,
      minZoom: 1,
      name: '',
      patternColors: ['#000000', '#FFFFFF'],
      patternOffset: 1,
      patternStyle: '',
      patternStyleIndex: 0,
      patternWidth: 1,
      useClick: true,
      useDecorationFill: false,
      useHover: false,
      useLegendOutline: false
  };

  var FILL_PATTERNS = [{ icon: 'p1', style: 'horizontal' }, { icon: 'p2', style: 'vertical' }, { icon: 'p3', style: 'diagonal1' }, { icon: 'p4', style: 'diagonal2' }, { icon: 'p5', style: 'circle' }, { icon: 'p6', style: 'cross' }];

  var style_to_old = function style_to_old(_ref) {
      var MinZoom = _ref.MinZoom,
          MaxZoom = _ref.MaxZoom,
          labelMinZoom = _ref.labelMinZoom,
          labelMaxZoom = _ref.labelMaxZoom,
          Name = _ref.Name,
          Filter = _ref.Filter,
          Balloon = _ref.Balloon,
          DisableBalloonOnMouseMove = _ref.DisableBalloonOnMouseMove,
          DisableBalloonOnClick = _ref.DisableBalloonOnClick,
          RenderStyle = _ref.RenderStyle,
          HoverStyle = _ref.HoverStyle;

      var a = { MinZoom: MinZoom, MaxZoom: MaxZoom, labelMinZoom: labelMinZoom, labelMaxZoom: labelMaxZoom, Name: Name, Filter: Filter, Balloon: Balloon, DisableBalloonOnMouseMove: DisableBalloonOnMouseMove, DisableBalloonOnClick: DisableBalloonOnClick, RenderStyle: {}, HoverStyle: {} };
      var convert = function convert(style) {
          var s = {};
          if (style.hasOwnProperty('fillColor')) {
              s.fill = {};
              s.fill.color = style.fillColor;
          }
          if (typeof style.fillOpacity === 'number') {
              s.fill = s.fill || {};
              s.fill.opacity = style.fillOpacity * 100;
          }
          if (style.hasOwnProperty('fillPattern')) {
              s.fill = s.fill || {};
              s.fill.pattern = {};
              if (Array.isArray(style.fillPattern.colors)) {
                  s.fill.pattern.colors = style.fillPattern.colors;
              }
              if (style.fillPattern.style) {
                  s.fill.pattern.style = style.fillPattern.style;
              }
              if (Number.isInteger(style.fillPattern.width)) {
                  s.fill.pattern.width = style.fillPattern.width;
              }
              if (Number.isInteger(style.fillPattern.step)) {
                  s.fill.pattern.step = style.fillPattern.step;
              }
          }
          if (style.hasOwnProperty('iconUrl')) {
              s.marker = {};
              s.marker.image = style.iconUrl;
          }
          if (style.hasOwnProperty('iconAngle')) {
              s.marker = s.marker || {};
              s.marker.angle = style.iconAngle;
          }
          if (style.hasOwnProperty('iconScale')) {
              s.marker = s.marker || {};
              s.marker.scale = style.iconScale;
          }
          if (style.hasOwnProperty('iconMaxScale')) {
              s.marker = s.marker || {};
              s.marker.maxScale = style.iconMaxScale;
          }
          if (style.hasOwnProperty('iconMinScale')) {
              s.marker = s.marker || {};
              s.marker.minScale = style.iconMinScale;
          }
          if (style.hasOwnProperty('iconSize')) {
              s.marker = s.marker || {};
              s.marker.size = style.iconSize;
          }
          if (style.hasOwnProperty('iconCenter')) {
              s.marker = s.marker || {};
              s.marker.center = style.iconCenter;
          }
          if (style.hasOwnProperty('iconCircle')) {
              s.marker = s.marker || {};
              s.marker.circle = style.iconCircle;
          }
          if (Array.isArray(style.iconAnchor)) {
              s.marker = s.marker || {};

              var _style$iconAnchor = slicedToArray(style.iconAnchor, 2),
                  dx = _style$iconAnchor[0],
                  dy = _style$iconAnchor[1];

              s.marker.dx = dx;
              s.marker.dy = dy;
          }
          if (style.hasOwnProperty('color')) {
              s.outline = {};
              s.outline.color = style.color;
          }
          if (typeof style.opacity === 'number') {
              s.outline = s.outline || {};
              s.outline.opacity = style.opacity * 100;
          }
          if (Array.isArray(style.dashArray)) {
              s.outline = s.outline || {};
              s.outline.dashes = style.dashArray;
          }
          if (Number.isInteger(style.weight)) {
              s.outline = s.outline || {};
              s.outline.thickness = style.weight;
          }
          if (Number.isInteger(style.labelColor)) {
              s.label = {};
              s.label.color = style.labelColor;
          }
          if (Number.isInteger(style.labelHaloColor)) {
              s.label = s.label || {};
              s.label.haloColor = style.labelHaloColor;
          }
          if (Number.isInteger(style.labelFontSize)) {
              s.label = s.label || {};
              s.label.size = style.labelFontSize;
          }
          if (style.hasOwnProperty('labelTemplate')) {
              s.labelTemplate = style.labelTemplate;
          }
          if (Number.isInteger(style.labelSpacing)) {
              s.label = s.label || {};
              s.label.spacing = style.labelSpacing;
          }
          return s;
      };
      a.RenderStyle = convert(RenderStyle);
      a.HoverStyle = convert(HoverStyle);
      return a;
  };

  var style_from_editor = function style_from_editor(_ref2, GeometryType) {
      var balloon = _ref2.balloon,
          dashes = _ref2.dashes,
          decorationFill = _ref2.decorationFill,
          decorationFillAlpha = _ref2.decorationFillAlpha,
          decorationOutline = _ref2.decorationOutline,
          decorationOutlineAlpha = _ref2.decorationOutlineAlpha,
          decorationOutlineSize = _ref2.decorationOutlineSize,
          decorationOutlineType = _ref2.decorationOutlineType,
          fillStyle = _ref2.fillStyle,
          filter = _ref2.filter,
          legendFill = _ref2.legendFill,
          legendField = _ref2.legendField,
          legendFontSize = _ref2.legendFontSize,
          legendOffsetX = _ref2.legendOffsetX,
          legendOffsetY = _ref2.legendOffsetY,
          legendOutline = _ref2.legendOutline,
          legendOutlineSize = _ref2.legendOutlineSize,
          legendMinZoom = _ref2.legendMinZoom,
          legendMaxZoom = _ref2.legendMaxZoom,
          markerAngle = _ref2.markerAngle,
          markerScale = _ref2.markerScale,
          markerMaxScale = _ref2.markerMaxScale,
          markerMinScale = _ref2.markerMinScale,
          markerSize = _ref2.markerSize,
          markerUrl = _ref2.markerUrl,
          maxZoom = _ref2.maxZoom,
          minZoom = _ref2.minZoom,
          name = _ref2.name,
          patternColors = _ref2.patternColors,
          patternOffset = _ref2.patternOffset,
          patternStyle = _ref2.patternStyle,
          patternWidth = _ref2.patternWidth,
          useDecorationFill = _ref2.useDecorationFill,
          useClick = _ref2.useClick,
          useHover = _ref2.useHover;

      var style = {
          MinZoom: minZoom,
          MaxZoom: maxZoom,
          labelMinZoom: legendMinZoom,
          labelMaxZoom: legendMaxZoom,
          Name: name,
          Filter: filter,
          Balloon: balloon,
          BalloonEnable: true,
          DisableBalloonOnMouseMove: !useHover,
          DisableBalloonOnClick: !useClick,
          disabled: false,
          HoverStyle: {},
          RenderStyle: {}
      };
      switch (GeometryType) {
          case 'polygon':
              switch (fillStyle) {
                  case 0:
                      if (useDecorationFill) {
                          style.RenderStyle.fillColor = decorationFill && scanexColorPicker_cjs_7(decorationFill);
                          style.RenderStyle.fillOpacity = decorationFillAlpha && decorationFillAlpha / 100;
                      }
                      break;
                  case 1:
                      style.RenderStyle.fillPattern = {
                          colors: patternColors.map(function (c) {
                              return c && scanexColorPicker_cjs_7(c);
                          }),
                          style: patternStyle,
                          width: patternWidth,
                          step: patternOffset
                      };
                      break;
                  case 2:
                      style.RenderStyle.iconUrl = markerUrl;
                      style.RenderStyle.iconSize = markerSize;
                      break;
                  default:
                      break;
              }
              break;
          case 'point':
              style.RenderStyle.type = 'square';
              switch (fillStyle) {
                  case 0:
                      style.RenderStyle.iconSize = markerSize;
                      if (useDecorationFill) {
                          style.RenderStyle.fillColor = decorationFill && scanexColorPicker_cjs_7(decorationFill);
                          style.RenderStyle.fillOpacity = decorationFillAlpha && decorationFillAlpha / 100;
                      }
                      break;
                  case 1:
                      style.RenderStyle.iconUrl = markerUrl;
                      style.RenderStyle.iconSize = markerSize;
                      style.RenderStyle.iconAngle = markerAngle;
                      style.RenderStyle.iconScale = markerScale;
                      style.RenderStyle.iconMaxScale = markerMaxScale;
                      style.RenderStyle.iconMinScale = markerMinScale;
                      break;
                  default:
                      break;
              }
              break;
          case 'linestring':
              switch (fillStyle) {
                  case 0:
                      style.RenderStyle.iconSize = markerSize;
                      break;
                  default:
                      break;
              }
              break;
          default:
              break;
      }
      switch (GeometryType) {
          case 'linestring':
          case 'polygon':
              if (!decorationOutlineType) {
                  style.RenderStyle.dashArray = dashes.split(/\s+/g).map(function (d) {
                      return parseInt(d, 10);
                  });
              }
              break;
          case 'point':
              break;
          default:
              break;
      }
      style.RenderStyle.color = decorationOutline && scanexColorPicker_cjs_7(decorationOutline);
      style.RenderStyle.opacity = decorationOutlineAlpha && decorationOutlineAlpha / 100;
      style.RenderStyle.weight = decorationOutlineSize;
      style.RenderStyle.stroke = Boolean(decorationOutlineSize);
      style.RenderStyle.labelColor = legendFill && scanexColorPicker_cjs_7(legendFill);
      style.RenderStyle.labelHaloColor = legendOutline && scanexColorPicker_cjs_7(legendOutline);
      style.RenderStyle.labelFontSize = legendFontSize;
      style.RenderStyle.labelAnchor = [legendOffsetX, legendOffsetY];
      style.RenderStyle.labelTemplate = legendField;

      style.HoverStyle = _extends({}, style.RenderStyle);
      if (Number.isInteger(style.RenderStyle.weight)) {
          style.HoverStyle.weight = style.RenderStyle.weight + 1;
      }
      if (Number.isInteger(style.RenderStyle.fillOpacity)) {
          style.HoverStyle.fillOpacity = Math.min(style.RenderStyle.fillOpacity + 0.2, 1);
      }

      return style;
  };

  var style_from_gmx = function style_from_gmx(_ref3, GeometryType) {
      var MinZoom = _ref3.MinZoom,
          MaxZoom = _ref3.MaxZoom,
          labelMinZoom = _ref3.labelMinZoom,
          labelMaxZoom = _ref3.labelMaxZoom,
          Name = _ref3.Name,
          Filter = _ref3.Filter,
          Balloon = _ref3.Balloon,
          DisableBalloonOnMouseMove = _ref3.DisableBalloonOnMouseMove,
          DisableBalloonOnClick = _ref3.DisableBalloonOnClick,
          disabled = _ref3.disabled,
          _ref3$RenderStyle = _ref3.RenderStyle,
          iconUrl = _ref3$RenderStyle.iconUrl,
          iconAngle = _ref3$RenderStyle.iconAngle,
          iconSize = _ref3$RenderStyle.iconSize,
          iconScale = _ref3$RenderStyle.iconScale,
          iconMinScale = _ref3$RenderStyle.iconMinScale,
          iconMaxScale = _ref3$RenderStyle.iconMaxScale,
          iconCircle = _ref3$RenderStyle.iconCircle,
          iconCenter = _ref3$RenderStyle.iconCenter,
          iconAnchor = _ref3$RenderStyle.iconAnchor,
          iconColor = _ref3$RenderStyle.iconColor,
          stroke = _ref3$RenderStyle.stroke,
          color = _ref3$RenderStyle.color,
          weight = _ref3$RenderStyle.weight,
          opacity = _ref3$RenderStyle.opacity,
          dashArray = _ref3$RenderStyle.dashArray,
          fillColor = _ref3$RenderStyle.fillColor,
          fillOpacity = _ref3$RenderStyle.fillOpacity,
          fillIconUrl = _ref3$RenderStyle.fillIconUrl,
          fillPattern = _ref3$RenderStyle.fillPattern,
          fillRadialGradient = _ref3$RenderStyle.fillRadialGradient,
          fillLinearGradient = _ref3$RenderStyle.fillLinearGradient,
          labelTemplate = _ref3$RenderStyle.labelTemplate,
          labelField = _ref3$RenderStyle.labelField,
          labelColor = _ref3$RenderStyle.labelColor,
          labelHaloColor = _ref3$RenderStyle.labelHaloColor,
          labelFontSize = _ref3$RenderStyle.labelFontSize,
          labelSpacing = _ref3$RenderStyle.labelSpacing,
          labelAlign = _ref3$RenderStyle.labelAlign,
          labelAnchor = _ref3$RenderStyle.labelAnchor;

      var style = _extends({}, DEFAULT_STYLE);
      if (Balloon) {
          style.balloon = Balloon;
      }
      style.useHover = !DisableBalloonOnMouseMove;
      style.useClick = !DisableBalloonOnClick;
      if (Number.isInteger(fillColor)) {
          style.decorationFill = scanexColorPicker_cjs_6(fillColor);
      }
      if (typeof fillOpacity === 'number') {
          style.decorationFillAlpha = fillOpacity * 100;
      }
      style.useDecorationOutline = Boolean(stroke);
      if (Number.isInteger(color)) {
          style.decorationOutline = scanexColorPicker_cjs_6(color);
      }
      if (Number.isInteger(weight)) {
          style.decorationOutlineSize = weight;
      }
      if (typeof opacity === 'number') {
          style.decorationOutlineAlpha = opacity * 100;
      }
      if (Array.isArray(dashArray)) {
          style.dashes = dashArray.map(function (x) {
              return parseInt(x, 10);
          }).join(' ');
          style.decorationOutlineType = false;
      }
      if (Number.isInteger(labelMinZoom)) {
          style.legendMinZoom = labelMinZoom;
      }
      if (Number.isInteger(labelMaxZoom)) {
          style.legendMaxZoom = labelMaxZoom;
      }
      if (fillPattern) {
          style.fillStyle = 1;
          style.patternColors = fillPattern.colors.map(function (x) {
              return scanexColorPicker_cjs_6(x);
          });
          for (var i = 0; i < FILL_PATTERNS.length; ++i) {
              if (FILL_PATTERNS[i].style === fillPattern.style) {
                  style.patternStyleIndex = i;
                  break;
              }
          }
          if (Number.isInteger(fillPattern.width)) {
              style.patternWidth = fillPattern.width;
          }
          if (Number.isInteger(fillPattern.step)) {
              style.patternOffset = fillPattern.step;
          }
      }
      if (Number.isInteger(labelColor)) {
          style.legendFill = scanexColorPicker_cjs_6(labelColor);
      }
      if (Number.isInteger(labelFontSize)) {
          style.legendFontSize = labelFontSize;
      }
      if (Number.isInteger(labelHaloColor)) {
          style.legendOutline = scanexColorPicker_cjs_6(labelHaloColor);
      }
      if (labelTemplate) {
          style.legendField = labelTemplate;
      }
      if (Array.isArray(labelAnchor) && labelAnchor.length === 2) {
          var _labelAnchor$map = labelAnchor.map(function (x) {
              return parseInt(x, 10);
          }),
              _labelAnchor$map2 = slicedToArray(_labelAnchor$map, 2),
              legendOffsetX = _labelAnchor$map2[0],
              legendOffsetY = _labelAnchor$map2[1];

          style.legendOffsetX = legendOffsetX;
          style.legendOffsetY = legendOffsetY;
      }
      if (Number.isInteger(iconSize)) {
          style.markerSize = iconSize;
      }
      if (iconUrl) {
          switch (GeometryType) {
              case 'polygon':
                  style.fillStyle = 2;
                  break;
              case 'point':
                  style.fillStyle = 1;
                  break;
              case 'linestring':
              default:
                  break;
          }
          style.markerUrl = iconUrl;
      }
      if (iconAngle) {
          switch (GeometryType) {
              case 'polygon':
                  style.fillStyle = 2;
                  break;
              case 'point':
                  style.fillStyle = 1;
                  break;
              case 'linestring':
              default:
                  break;
          }
          style.markerAngle = iconAngle;
      }
      if (iconScale) {
          style.markerScale = iconScale;
      }
      if (iconMaxScale) {
          style.markerMaxScale = iconMaxScale;
      }
      if (iconMinScale) {
          style.markerMinScale = iconMinScale;
      }
      if (Number.isInteger(MinZoom)) {
          style.minZoom = MinZoom;
      }
      if (Number.isInteger(MaxZoom)) {
          style.maxZoom = MaxZoom;
      }
      style.name = Name || '' + translate$1('style.default');
      style.filter = Filter || '';

      style.useDecorationFill = Boolean(fillColor);
      style.useLegendOutline = Boolean(labelColor);

      return style;
  };

  /* src\Layout\Toolbar.html generated by Svelte v2.16.1 */

  function data$9() {
  	return {
  		buttons: [],
  		selected: 0
  	};
  }
  function click_handler$2(event) {
  	var _svelte = this._svelte,
  	    component = _svelte.component,
  	    ctx = _svelte.ctx;


  	component.set({ selected: ctx.i });
  }

  function get_each_context$2(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.button = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function create_main_fragment$9(component, ctx) {
  	var ul;

  	var each_value = ctx.buttons;

  	var each_blocks = [];

  	for (var i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block$2(component, get_each_context$2(ctx, each_value, i));
  	}

  	return {
  		c: function c() {
  			ul = createElement("ul");

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}
  			ul.className = "toolbar";
  		},
  		m: function m(target, anchor) {
  			insert(target, ul, anchor);

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(ul, null);
  			}
  		},
  		p: function p(changed, ctx) {
  			if (changed.selected || changed.buttons) {
  				each_value = ctx.buttons;

  				for (var i = 0; i < each_value.length; i += 1) {
  					var child_ctx = get_each_context$2(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(changed, child_ctx);
  					} else {
  						each_blocks[i] = create_each_block$2(component, child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(ul, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}
  				each_blocks.length = each_value.length;
  			}
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(ul);
  			}

  			destroyEach(each_blocks, detach);
  		}
  	};
  }

  // (6:8) {:else}
  function create_else_block(component, ctx) {
  	var label,
  	    text_value = ctx.button.text,
  	    text;

  	return {
  		c: function c() {
  			label = createElement("label");
  			text = createText(text_value);
  		},
  		m: function m(target, anchor) {
  			insert(target, label, anchor);
  			append(label, text);
  		},
  		p: function p(changed, ctx) {
  			if (changed.buttons && text_value !== (text_value = ctx.button.text)) {
  				setData(text, text_value);
  			}
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(label);
  			}
  		}
  	};
  }

  // (4:8) {#if button.icon}
  function create_if_block$2(component, ctx) {
  	var i, i_class_value;

  	return {
  		c: function c() {
  			i = createElement("i");
  			i.className = i_class_value = ctx.button.icon;
  		},
  		m: function m(target, anchor) {
  			insert(target, i, anchor);
  		},
  		p: function p(changed, ctx) {
  			if (changed.buttons && i_class_value !== (i_class_value = ctx.button.icon)) {
  				i.className = i_class_value;
  			}
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(i);
  			}
  		}
  	};
  }

  // (2:4) {#each buttons as button, i}
  function create_each_block$2(component, ctx) {
  	var li, text;

  	function select_block_type(ctx) {
  		if (ctx.button.icon) return create_if_block$2;
  		return create_else_block;
  	}

  	var current_block_type = select_block_type(ctx);
  	var if_block = current_block_type(component, ctx);

  	return {
  		c: function c() {
  			li = createElement("li");
  			if_block.c();
  			text = createText("\r\n    ");
  			li._svelte = { component: component, ctx: ctx };

  			addListener(li, "click", click_handler$2);
  			toggleClass(li, "selected", ctx.i === ctx.selected);
  		},
  		m: function m(target, anchor) {
  			insert(target, li, anchor);
  			if_block.m(li, null);
  			append(li, text);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
  				if_block.p(changed, ctx);
  			} else {
  				if_block.d(1);
  				if_block = current_block_type(component, ctx);
  				if_block.c();
  				if_block.m(li, text);
  			}

  			li._svelte.ctx = ctx;
  			if (changed.selected) {
  				toggleClass(li, "selected", ctx.i === ctx.selected);
  			}
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(li);
  			}

  			if_block.d();
  			removeListener(li, "click", click_handler$2);
  		}
  	};
  }

  function Toolbar(options) {
  	init(this, options);
  	this._state = assign(data$9(), options.data);
  	this._intro = true;

  	this._fragment = create_main_fragment$9(this, this._state);

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}
  }

  assign(Toolbar.prototype, proto);

  /* src\Layout\Patterns.html generated by Svelte v2.16.1 */

  scanexTranslations_cjs.addText('eng', {
  	pattern: {
  		type: 'Pattern type',
  		width: 'Pattern width',
  		offset: 'Pattern offset',
  		colors: 'Pattern colors'
  	}
  });

  scanexTranslations_cjs.addText('rus', {
  	pattern: {
  		type: 'Тип штриховки',
  		width: 'Ширина штриховки',
  		offset: 'Отступ штриховки',
  		colors: 'Цвета штриховки'
  	}
  });

  var translate$2 = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

  function style(_ref) {
  	var styleIndex = _ref.styleIndex;

  	return FILL_PATTERNS[styleIndex].style;
  }

  function data$a() {
  	return {
  		colors: ['#000000', '#FFFFFF'],
  		dashes: '10 10',
  		offset: 1,
  		outline: '#FFFFFF',
  		outlineAlpha: 100,
  		outlineType: true,
  		outlineSize: 10,
  		styleIndex: 0,
  		width: 1
  	};
  }
  var methods$5 = {
  	changeColor: function changeColor(_ref2, i) {
  		var changed = _ref2.changed,
  		    current = _ref2.current;

  		if (changed.color) {
  			var _get = this.get(),
  			    colors = _get.colors;

  			colors[i] = current.color;
  			this.set({ colors: colors });
  		}
  	}
  };

  function oncreate$1() {
  	this.refs.type.set({ buttons: FILL_PATTERNS });
  }
  function onupdate$5(_ref3) {
  	var changed = _ref3.changed,
  	    current = _ref3.current,
  	    previous = _ref3.previous;

  	if (changed.outlineType) {
  		this.refs.outlineDash.style.display = current.outlineType ? 'none' : 'table-cell';
  	}
  }
  function get_each_context$3(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.x = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function create_main_fragment$a(component, ctx) {
  	var table,
  	    tr0,
  	    td0,
  	    text0_value = translate$2('pattern.type'),
  	    text0,
  	    text1,
  	    td1,
  	    toolbar_updating = {},
  	    text2,
  	    tr1,
  	    td2,
  	    text3_value = translate$2('pattern.width'),
  	    text3,
  	    text4,
  	    td3,
  	    inputinteger0_updating = {},
  	    text5,
  	    tr2,
  	    td4,
  	    text6_value = translate$2('pattern.offset'),
  	    text6,
  	    text7,
  	    td5,
  	    inputinteger1_updating = {},
  	    text8,
  	    text9,
  	    tr3,
  	    td6,
  	    text10_value = translate$2('outline'),
  	    text10,
  	    text11,
  	    td7,
  	    advancedcolorpicker_updating = {},
  	    text12,
  	    tr4,
  	    td8,
  	    text13_value = translate$2('thickness'),
  	    text13,
  	    text14,
  	    td9,
  	    inputinteger2_updating = {},
  	    text15,
  	    tr5,
  	    td10,
  	    text16_value = translate$2('type'),
  	    text16,
  	    text17,
  	    td11,
  	    i0,
  	    text19,
  	    i1,
  	    switch_1_updating = {},
  	    text21,
  	    span,
  	    validatinginput_updating = {};

  	var toolbar_initial_data = {};
  	if (ctx.styleIndex !== void 0) {
  		toolbar_initial_data.selected = ctx.styleIndex;
  		toolbar_updating.selected = true;
  	}
  	var toolbar = new Toolbar({
  		root: component.root,
  		store: component.store,
  		data: toolbar_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!toolbar_updating.selected && changed.selected) {
  				newState.styleIndex = childState.selected;
  			}
  			component._set(newState);
  			toolbar_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		toolbar._bind({ selected: 1 }, toolbar.get());
  	});

  	component.refs.type = toolbar;

  	var inputinteger0_initial_data = { min: "0", max: "24" };
  	if (ctx.width !== void 0) {
  		inputinteger0_initial_data.value = ctx.width;
  		inputinteger0_updating.value = true;
  	}
  	var inputinteger0 = new scanexInputInteger_cjs({
  		root: component.root,
  		store: component.store,
  		data: inputinteger0_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger0_updating.value && changed.value) {
  				newState.width = childState.value;
  			}
  			component._set(newState);
  			inputinteger0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger0._bind({ value: 1 }, inputinteger0.get());
  	});

  	var inputinteger1_initial_data = { min: "0", max: "24" };
  	if (ctx.offset !== void 0) {
  		inputinteger1_initial_data.value = ctx.offset;
  		inputinteger1_updating.value = true;
  	}
  	var inputinteger1 = new scanexInputInteger_cjs({
  		root: component.root,
  		store: component.store,
  		data: inputinteger1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger1_updating.value && changed.value) {
  				newState.offset = childState.value;
  			}
  			component._set(newState);
  			inputinteger1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger1._bind({ value: 1 }, inputinteger1.get());
  	});

  	var each_value = ctx.colors;

  	var each_blocks = [];

  	for (var i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block$3(component, get_each_context$3(ctx, each_value, i));
  	}

  	var advancedcolorpicker_initial_data = {};
  	if (ctx.outline !== void 0) {
  		advancedcolorpicker_initial_data.color = ctx.outline;
  		advancedcolorpicker_updating.color = true;
  	}
  	if (ctx.outlineAlpha !== void 0) {
  		advancedcolorpicker_initial_data.alpha = ctx.outlineAlpha;
  		advancedcolorpicker_updating.alpha = true;
  	}
  	var advancedcolorpicker = new AdvancedColorPicker({
  		root: component.root,
  		store: component.store,
  		data: advancedcolorpicker_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!advancedcolorpicker_updating.color && changed.color) {
  				newState.outline = childState.color;
  			}

  			if (!advancedcolorpicker_updating.alpha && changed.alpha) {
  				newState.outlineAlpha = childState.alpha;
  			}
  			component._set(newState);
  			advancedcolorpicker_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		advancedcolorpicker._bind({ color: 1, alpha: 1 }, advancedcolorpicker.get());
  	});

  	var inputinteger2_initial_data = { min: "0", max: "24", value: "10" };
  	if (ctx.outlineSize !== void 0) {
  		inputinteger2_initial_data.value = ctx.outlineSize;
  		inputinteger2_updating.value = true;
  	}
  	var inputinteger2 = new scanexInputInteger_cjs({
  		root: component.root,
  		store: component.store,
  		data: inputinteger2_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger2_updating.value && changed.value) {
  				newState.outlineSize = childState.value;
  			}
  			component._set(newState);
  			inputinteger2_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger2._bind({ value: 1 }, inputinteger2.get());
  	});

  	var switch_1_initial_data = {};
  	if (ctx.outlineType !== void 0) {
  		switch_1_initial_data.flag = ctx.outlineType;
  		switch_1_updating.flag = true;
  	}
  	var switch_1 = new scanexSwitch_cjs({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment(), right: createFragment(), left: createFragment() },
  		data: switch_1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!switch_1_updating.flag && changed.flag) {
  				newState.outlineType = childState.flag;
  			}
  			component._set(newState);
  			switch_1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		switch_1._bind({ flag: 1 }, switch_1.get());
  	});

  	var validatinginput_initial_data = {
  		placeholder: "10 10",
  		validate: "^[0-9]+\\s+[0-9]+$"
  	};
  	if (ctx.dashes !== void 0) {
  		validatinginput_initial_data.value = ctx.dashes;
  		validatinginput_updating.value = true;
  	}
  	var validatinginput = new scanexValidatingInput_cjs({
  		root: component.root,
  		store: component.store,
  		data: validatinginput_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!validatinginput_updating.value && changed.value) {
  				newState.dashes = childState.value;
  			}
  			component._set(newState);
  			validatinginput_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		validatinginput._bind({ value: 1 }, validatinginput.get());
  	});

  	return {
  		c: function c() {
  			table = createElement("table");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			text0 = createText(text0_value);
  			text1 = createText("        \r\n        ");
  			td1 = createElement("td");
  			toolbar._fragment.c();
  			text2 = createText("\r\n    ");
  			tr1 = createElement("tr");
  			td2 = createElement("td");
  			text3 = createText(text3_value);
  			text4 = createText("                   \r\n        ");
  			td3 = createElement("td");
  			inputinteger0._fragment.c();
  			text5 = createText("\r\n    ");
  			tr2 = createElement("tr");
  			td4 = createElement("td");
  			text6 = createText(text6_value);
  			text7 = createText("\r\n        ");
  			td5 = createElement("td");
  			inputinteger1._fragment.c();
  			text8 = createText("\r\n    ");

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			text9 = createText("\r\n    ");
  			tr3 = createElement("tr");
  			td6 = createElement("td");
  			text10 = createText(text10_value);
  			text11 = createText("        \r\n        ");
  			td7 = createElement("td");
  			advancedcolorpicker._fragment.c();
  			text12 = createText("\r\n    ");
  			tr4 = createElement("tr");
  			td8 = createElement("td");
  			text13 = createText(text13_value);
  			text14 = createText("                \r\n        ");
  			td9 = createElement("td");
  			inputinteger2._fragment.c();
  			text15 = createText("\r\n    ");
  			tr5 = createElement("tr");
  			td10 = createElement("td");
  			text16 = createText(text16_value);
  			text17 = createText("        \r\n        ");
  			td11 = createElement("td");
  			i0 = createElement("i");
  			i0.textContent = "┃";
  			text19 = createText("\r\n                ");
  			i1 = createElement("i");
  			i1.textContent = "┇";
  			switch_1._fragment.c();
  			text21 = createText(" \r\n            ");
  			span = createElement("span");
  			validatinginput._fragment.c();
  			td0.className = "label";
  			td1.className = "pattern-type";
  			td1.colSpan = "2";
  			tr0.className = "type";
  			td2.className = "label";
  			td3.className = "value integer-input";
  			td3.colSpan = "2";
  			tr1.className = "width";
  			td4.className = "label";
  			td5.className = "value integer-input";
  			td5.colSpan = "2";
  			tr2.className = "offset";
  			td6.className = "label";
  			td7.colSpan = "2";
  			tr3.className = "outline";
  			td8.className = "label";
  			td9.className = "size integer-input";
  			td9.colSpan = "2";
  			td10.className = "label";
  			setAttribute(i0, "slot", "left");
  			setAttribute(i1, "slot", "right");
  			span.className = "dash";
  			td11.className = "type-switch";
  			td11.colSpan = "2";
  			tr5.className = "type";
  			setAttribute(table, "cellpadding", "0");
  			setAttribute(table, "cellspacing", "0");
  		},
  		m: function m(target, anchor) {
  			insert(target, table, anchor);
  			append(table, tr0);
  			append(tr0, td0);
  			append(td0, text0);
  			append(tr0, text1);
  			append(tr0, td1);
  			toolbar._mount(td1, null);
  			append(table, text2);
  			append(table, tr1);
  			append(tr1, td2);
  			append(td2, text3);
  			append(tr1, text4);
  			append(tr1, td3);
  			inputinteger0._mount(td3, null);
  			append(table, text5);
  			append(table, tr2);
  			append(tr2, td4);
  			append(td4, text6);
  			append(tr2, text7);
  			append(tr2, td5);
  			inputinteger1._mount(td5, null);
  			append(table, text8);

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(table, null);
  			}

  			append(table, text9);
  			append(table, tr3);
  			append(tr3, td6);
  			append(td6, text10);
  			append(tr3, text11);
  			append(tr3, td7);
  			advancedcolorpicker._mount(td7, null);
  			append(table, text12);
  			append(table, tr4);
  			append(tr4, td8);
  			append(td8, text13);
  			append(tr4, text14);
  			append(tr4, td9);
  			inputinteger2._mount(td9, null);
  			append(table, text15);
  			append(table, tr5);
  			append(tr5, td10);
  			append(td10, text16);
  			append(tr5, text17);
  			append(tr5, td11);
  			append(switch_1._slotted.left, i0);
  			append(switch_1._slotted.default, text19);
  			append(switch_1._slotted.right, i1);
  			switch_1._mount(td11, null);
  			append(td11, text21);
  			append(td11, span);
  			validatinginput._mount(span, null);
  			component.refs.outlineDash = span;
  			component.refs.container = table;
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			var toolbar_changes = {};
  			if (!toolbar_updating.selected && changed.styleIndex) {
  				toolbar_changes.selected = ctx.styleIndex;
  				toolbar_updating.selected = ctx.styleIndex !== void 0;
  			}
  			toolbar._set(toolbar_changes);
  			toolbar_updating = {};

  			var inputinteger0_changes = {};
  			if (!inputinteger0_updating.value && changed.width) {
  				inputinteger0_changes.value = ctx.width;
  				inputinteger0_updating.value = ctx.width !== void 0;
  			}
  			inputinteger0._set(inputinteger0_changes);
  			inputinteger0_updating = {};

  			var inputinteger1_changes = {};
  			if (!inputinteger1_updating.value && changed.offset) {
  				inputinteger1_changes.value = ctx.offset;
  				inputinteger1_updating.value = ctx.offset !== void 0;
  			}
  			inputinteger1._set(inputinteger1_changes);
  			inputinteger1_updating = {};

  			if (changed.colors) {
  				each_value = ctx.colors;

  				for (var i = 0; i < each_value.length; i += 1) {
  					var child_ctx = get_each_context$3(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(changed, child_ctx);
  					} else {
  						each_blocks[i] = create_each_block$3(component, child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(table, text9);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}
  				each_blocks.length = each_value.length;
  			}

  			var advancedcolorpicker_changes = {};
  			if (!advancedcolorpicker_updating.color && changed.outline) {
  				advancedcolorpicker_changes.color = ctx.outline;
  				advancedcolorpicker_updating.color = ctx.outline !== void 0;
  			}
  			if (!advancedcolorpicker_updating.alpha && changed.outlineAlpha) {
  				advancedcolorpicker_changes.alpha = ctx.outlineAlpha;
  				advancedcolorpicker_updating.alpha = ctx.outlineAlpha !== void 0;
  			}
  			advancedcolorpicker._set(advancedcolorpicker_changes);
  			advancedcolorpicker_updating = {};

  			var inputinteger2_changes = {};
  			if (!inputinteger2_updating.value && changed.outlineSize) {
  				inputinteger2_changes.value = ctx.outlineSize;
  				inputinteger2_updating.value = ctx.outlineSize !== void 0;
  			}
  			inputinteger2._set(inputinteger2_changes);
  			inputinteger2_updating = {};

  			var switch_1_changes = {};
  			if (!switch_1_updating.flag && changed.outlineType) {
  				switch_1_changes.flag = ctx.outlineType;
  				switch_1_updating.flag = ctx.outlineType !== void 0;
  			}
  			switch_1._set(switch_1_changes);
  			switch_1_updating = {};

  			var validatinginput_changes = {};
  			if (!validatinginput_updating.value && changed.dashes) {
  				validatinginput_changes.value = ctx.dashes;
  				validatinginput_updating.value = ctx.dashes !== void 0;
  			}
  			validatinginput._set(validatinginput_changes);
  			validatinginput_updating = {};
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(table);
  			}

  			toolbar.destroy();
  			if (component.refs.type === toolbar) component.refs.type = null;
  			inputinteger0.destroy();
  			inputinteger1.destroy();

  			destroyEach(each_blocks, detach);

  			advancedcolorpicker.destroy();
  			inputinteger2.destroy();
  			switch_1.destroy();
  			validatinginput.destroy();
  			if (component.refs.outlineDash === span) component.refs.outlineDash = null;
  			if (component.refs.container === table) component.refs.container = null;
  		}
  	};
  }

  // (24:8) {:else}
  function create_else_block$1(component, ctx) {
  	var td;

  	return {
  		c: function c() {
  			td = createElement("td");
  			td.className = "label";
  		},
  		m: function m(target, anchor) {
  			insert(target, td, anchor);
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(td);
  			}
  		}
  	};
  }

  // (22:8) {#if i === 0}
  function create_if_block$3(component, ctx) {
  	var td,
  	    text_value = translate$2('pattern.colors'),
  	    text;

  	return {
  		c: function c() {
  			td = createElement("td");
  			text = createText(text_value);
  			td.className = "label";
  		},
  		m: function m(target, anchor) {
  			insert(target, td, anchor);
  			append(td, text);
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(td);
  			}
  		}
  	};
  }

  // (20:4) {#each colors as x, i}
  function create_each_block$3(component, ctx) {
  	var tr, text0, td0, text1, td1;

  	function select_block_type(ctx) {
  		if (ctx.i === 0) return create_if_block$3;
  		return create_else_block$1;
  	}

  	var current_block_type = select_block_type(ctx);
  	var if_block = current_block_type(component, ctx);

  	var extendedcolorpicker_initial_data = { color: ctx.x };
  	var extendedcolorpicker = new ExtendedColorPicker({
  		root: component.root,
  		store: component.store,
  		data: extendedcolorpicker_initial_data
  	});

  	extendedcolorpicker.on("update", function (event) {
  		component.changeColor(event, ctx.i);
  	});

  	return {
  		c: function c() {
  			tr = createElement("tr");
  			if_block.c();
  			text0 = createText("\r\n        ");
  			td0 = createElement("td");
  			text1 = createText("\r\n        ");
  			td1 = createElement("td");
  			extendedcolorpicker._fragment.c();
  			tr.className = "colors";
  		},
  		m: function m(target, anchor) {
  			insert(target, tr, anchor);
  			if_block.m(tr, null);
  			append(tr, text0);
  			append(tr, td0);
  			append(tr, text1);
  			append(tr, td1);
  			extendedcolorpicker._mount(td1, null);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
  				if_block.d(1);
  				if_block = current_block_type(component, ctx);
  				if_block.c();
  				if_block.m(tr, text0);
  			}

  			var extendedcolorpicker_changes = {};
  			if (changed.colors) extendedcolorpicker_changes.color = ctx.x;
  			extendedcolorpicker._set(extendedcolorpicker_changes);
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(tr);
  			}

  			if_block.d();
  			extendedcolorpicker.destroy();
  		}
  	};
  }

  function Patterns(options) {
  	var _this = this;

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$a(), options.data);

  	this._recompute({ styleIndex: 1 }, this._state);
  	this._intro = true;
  	this._handlers.update = [onupdate$5];

  	this._fragment = create_main_fragment$a(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate$1.call(_this);
  		_this.fire("update", { changed: assignTrue({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}
  }

  assign(Patterns.prototype, proto);
  assign(Patterns.prototype, methods$5);

  Patterns.prototype._recompute = function _recompute(changed, state) {
  	if (changed.styleIndex) {
  		if (this._differs(state.style, state.style = style(state))) changed.style = true;
  	}
  };

  /* src\Layout\Layout.html generated by Svelte v2.16.1 */

  scanexTranslations_cjs.addText('eng', {
  	angle: 'Angle',
  	attribute: 'Attribute',
  	color: 'Color',
  	decoration: 'Decoration',
  	fill: 'Fill',
  	font: { family: 'Font', size: 'Font size' },
  	hue: 'Hue',
  	legend: 'Legend',
  	lineType: 'Line type',
  	offset: { x: 'X offset', y: 'Y offset' },
  	opacity: 'Opacity',
  	outline: 'Outline',
  	text: 'Text',
  	thickness: 'Thickness',
  	dash: 'Dash, px',
  	size: 'Size',
  	type: 'Outline type',
  	marker: 'Upload marker',
  	whitespace: 'Whitespace, px'
  });

  scanexTranslations_cjs.addText('rus', {
  	angle: 'Угол поворота',
  	attribute: 'Атрибут',
  	color: 'Цвет',
  	decoration: 'Оформление',
  	fill: 'Заливка',
  	font: { family: 'Шрифт', size: 'Кегль' },
  	hue: 'Оттенок',
  	legend: 'Подпись',
  	lineType: 'Тип линии',
  	offset: { x: 'Смещение по X', y: 'Смещение по Y' },
  	opacity: 'Прозрачность',
  	outline: 'Обводка',
  	text: 'Текст',
  	thickness: 'Толщина',
  	dash: 'Штрих, пкс',
  	type: 'Тип обводки',
  	size: 'Размер',
  	marker: 'Загрузить маркер',
  	whitespace: 'Пробел, пкс'
  });

  var translate$3 = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

  function data$b() {
  	return _extends({
  		geometryType: 'polygon'
  	}, DEFAULT_STYLE);
  }
  var methods$6 = {
  	addField: function addField(index) {
  		var _get = this.get(),
  		    legendFields = _get.legendFields;

  		var text = this.refs.field.value;
  		var value = legendFields[index];
  		if (value && value.trim() !== '') {
  			var start = this.refs.field.selectionStart;
  			var end = this.refs.field.selectionEnd;
  			text = [text.substring(0, start), '[' + value.trim() + ']', text.substring(end)].join('');
  		}
  		this.refs.field.value = text;
  		this.set({ legendField: this.refs.field.value });
  	},
  	changeField: function changeField(e) {
  		this.set({ legendField: this.refs.field.value });
  	},
  	addAngle: function addAngle(index) {
  		var _get2 = this.get(),
  		    legendFields = _get2.legendFields;

  		var text = this.refs.angle.value;
  		var value = legendFields[index];
  		if (value && value.trim() !== '') {
  			var start = this.refs.angle.selectionStart;
  			var end = this.refs.angle.selectionEnd;
  			text = [text.substring(0, start), '[' + value.trim() + ']', text.substring(end)].join('');
  		}
  		this.set({ markerAngle: text });
  	},
  	changeAngle: function changeAngle() {
  		this.set({ markerAngle: this.refs.angle.value });
  	},
  	upload: function upload() {
  		var _this = this;

  		var imagesDir = nsGmx.AuthManager.getUserFolder() + 'images';
  		sendCrossDomainJSONRequest(window.serverBase + 'FileBrowser/CreateFolder.ashx?WrapStyle=func&FullName=' + encodeURIComponent(imagesDir), function (response) {
  			if (!parseResponse(response)) {
  				return;
  			}
  			_fileBrowser.createBrowser(_gtxt("Изображение"), ['jpg', 'jpeg', 'png', 'gif', 'swf'], function (path) {
  				var relativePath = path.substring(imagesDir.length);
  				if (relativePath[0] == '\\') {
  					relativePath = relativePath.substring(1);
  				}

  				var markerUrl = window.serverBase + 'GetImage.ashx?usr=' + encodeURIComponent(nsGmx.AuthManager.getLogin()) + '&img=' + encodeURIComponent(relativePath);
  				_this.set({ markerUrl: markerUrl });
  			}, { startDir: imagesDir, restrictDir: imagesDir });
  		});
  	}
  };

  function onupdate$6(_ref) {
  	var changed = _ref.changed,
  	    current = _ref.current,
  	    previous = _ref.previous;

  	var _get3 = this.get(),
  	    geometryType = _get3.geometryType;

  	if ((geometryType === 'polygon' || geometryType === 'linestring') && changed.decorationOutlineType) {
  		this.refs.fillOutlineDash.style.display = current.decorationOutlineType ? 'none' : 'table-cell';
  	}
  	if (geometryType === 'polygon' && changed.patternStyleIndex) {
  		this.set({ patternStyle: this.refs.patterns.get().style });
  	}
  }
  function create_main_fragment$b(component, ctx) {
  	var div0,
  	    label,
  	    text0_value = translate$3('decoration'),
  	    text0,
  	    text1,
  	    table0,
  	    text2,
  	    text3,
  	    tr0,
  	    td0,
  	    text4_value = translate$3(ctx.geometryType === 'linestring' ? 'color' : 'outline'),
  	    text4,
  	    text5,
  	    td1,
  	    text6,
  	    td2,
  	    advancedcolorpicker_updating = {},
  	    text7,
  	    tr1,
  	    td3,
  	    text8_value = translate$3('thickness'),
  	    text8,
  	    text9,
  	    td4,
  	    text10,
  	    td5,
  	    inputinteger0_updating = {},
  	    text11,
  	    text12,
  	    text13,
  	    if_block4_anchor,
  	    tabs_updating = {},
  	    text14,
  	    div2,
  	    div1,
  	    text15_value = translate$3('legend'),
  	    text15,
  	    text16,
  	    table1,
  	    tr2,
  	    td6,
  	    text17_value = translate$3('zoom'),
  	    text17,
  	    text18,
  	    td7,
  	    integerrange_updating = {},
  	    text19,
  	    tr3,
  	    td8,
  	    text20_value = translate$3('attribute'),
  	    text20,
  	    text21,
  	    td9,
  	    dropdown_updating = {},
  	    text22,
  	    tr4,
  	    td10,
  	    text23,
  	    td11,
  	    textarea,
  	    text24,
  	    tr5,
  	    td12,
  	    text25_value = translate$3('font.size'),
  	    text25,
  	    text26,
  	    td13,
  	    inputinteger1_updating = {},
  	    text27,
  	    tr6,
  	    td14,
  	    text28_value = translate$3('fill'),
  	    text28,
  	    text29,
  	    td15,
  	    extendedcolorpicker0_updating = {},
  	    text30,
  	    tr7,
  	    td16,
  	    text31_value = translate$3('outline'),
  	    text31,
  	    text32,
  	    td17,
  	    extendedcolorpicker1_updating = {},
  	    text33,
  	    tr8,
  	    td18,
  	    text34_value = translate$3('offset.x'),
  	    text34,
  	    text35,
  	    td19,
  	    inputinteger2_updating = {},
  	    text36,
  	    tr9,
  	    td20,
  	    text37_value = translate$3('offset.y'),
  	    text37,
  	    text38,
  	    td21,
  	    inputinteger3_updating = {};

  	var if_block0 = ctx.geometryType === 'point' && create_if_block_4(component, ctx);

  	var if_block1 = ctx.geometryType !== 'linestring' && create_if_block_3(component, ctx);

  	var advancedcolorpicker_initial_data = {};
  	if (ctx.decorationOutline !== void 0) {
  		advancedcolorpicker_initial_data.color = ctx.decorationOutline;
  		advancedcolorpicker_updating.color = true;
  	}
  	if (ctx.decorationOutlineAlpha !== void 0) {
  		advancedcolorpicker_initial_data.alpha = ctx.decorationOutlineAlpha;
  		advancedcolorpicker_updating.alpha = true;
  	}
  	var advancedcolorpicker = new AdvancedColorPicker({
  		root: component.root,
  		store: component.store,
  		data: advancedcolorpicker_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!advancedcolorpicker_updating.color && changed.color) {
  				newState.decorationOutline = childState.color;
  			}

  			if (!advancedcolorpicker_updating.alpha && changed.alpha) {
  				newState.decorationOutlineAlpha = childState.alpha;
  			}
  			component._set(newState);
  			advancedcolorpicker_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		advancedcolorpicker._bind({ color: 1, alpha: 1 }, advancedcolorpicker.get());
  	});

  	var inputinteger0_initial_data = { min: "0", max: "24", value: "10" };
  	if (ctx.decorationOutlineSize !== void 0) {
  		inputinteger0_initial_data.value = ctx.decorationOutlineSize;
  		inputinteger0_updating.value = true;
  	}
  	var inputinteger0 = new scanexInputInteger_cjs({
  		root: component.root,
  		store: component.store,
  		data: inputinteger0_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger0_updating.value && changed.value) {
  				newState.decorationOutlineSize = childState.value;
  			}
  			component._set(newState);
  			inputinteger0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger0._bind({ value: 1 }, inputinteger0.get());
  	});

  	var if_block2 = ctx.geometryType !== 'point' && create_if_block_2(component, ctx);

  	var panel_initial_data = {
  		id: "colors",
  		icon: "style-editor-icon colors"
  	};
  	var panel = new scanexTabs_cjs_3({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel_initial_data
  	});

  	var if_block3 = ctx.geometryType === 'polygon' && create_if_block_1(component, ctx);

  	var if_block4 = ctx.geometryType !== 'linestring' && create_if_block$4(component, ctx);

  	var tabs_initial_data = {};
  	if (ctx.fillStyle !== void 0) {
  		tabs_initial_data.index = ctx.fillStyle;
  		tabs_updating.index = true;
  	}
  	var tabs = new scanexTabs_cjs_1({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: tabs_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!tabs_updating.index && changed.index) {
  				newState.fillStyle = childState.index;
  			}
  			component._set(newState);
  			tabs_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		tabs._bind({ index: 1 }, tabs.get());
  	});

  	var integerrange_initial_data = { min: "1", max: "21", allowEmpty: "true" };
  	if (ctx.legendMinZoom !== void 0) {
  		integerrange_initial_data.low = ctx.legendMinZoom;
  		integerrange_updating.low = true;
  	}
  	if (ctx.legendMaxZoom !== void 0) {
  		integerrange_initial_data.high = ctx.legendMaxZoom;
  		integerrange_updating.high = true;
  	}
  	var integerrange = new scanexIntegerRange_cjs({
  		root: component.root,
  		store: component.store,
  		data: integerrange_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!integerrange_updating.low && changed.low) {
  				newState.legendMinZoom = childState.low;
  			}

  			if (!integerrange_updating.high && changed.high) {
  				newState.legendMaxZoom = childState.high;
  			}
  			component._set(newState);
  			integerrange_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		integerrange._bind({ low: 1, high: 1 }, integerrange.get());
  	});

  	component.refs.zoom = integerrange;

  	var dropdown_initial_data = { selected: "0" };
  	if (ctx.legendFields !== void 0) {
  		dropdown_initial_data.items = ctx.legendFields;
  		dropdown_updating.items = true;
  	}
  	var dropdown = new scanexDropdown_cjs({
  		root: component.root,
  		store: component.store,
  		data: dropdown_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!dropdown_updating.items && changed.items) {
  				newState.legendFields = childState.items;
  			}
  			component._set(newState);
  			dropdown_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		dropdown._bind({ items: 1 }, dropdown.get());
  	});

  	dropdown.on("select", function (event) {
  		component.addField(event);
  	});

  	function keyup_handler(event) {
  		component.changeField(event);
  	}

  	var inputinteger1_initial_data = { min: "1", max: "24", value: "10" };
  	if (ctx.legendFontSize !== void 0) {
  		inputinteger1_initial_data.value = ctx.legendFontSize;
  		inputinteger1_updating.value = true;
  	}
  	var inputinteger1 = new scanexInputInteger_cjs({
  		root: component.root,
  		store: component.store,
  		data: inputinteger1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger1_updating.value && changed.value) {
  				newState.legendFontSize = childState.value;
  			}
  			component._set(newState);
  			inputinteger1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger1._bind({ value: 1 }, inputinteger1.get());
  	});

  	var extendedcolorpicker0_initial_data = {};
  	if (ctx.legendFill !== void 0) {
  		extendedcolorpicker0_initial_data.color = ctx.legendFill;
  		extendedcolorpicker0_updating.color = true;
  	}
  	var extendedcolorpicker0 = new ExtendedColorPicker({
  		root: component.root,
  		store: component.store,
  		data: extendedcolorpicker0_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!extendedcolorpicker0_updating.color && changed.color) {
  				newState.legendFill = childState.color;
  			}
  			component._set(newState);
  			extendedcolorpicker0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		extendedcolorpicker0._bind({ color: 1 }, extendedcolorpicker0.get());
  	});

  	var extendedcolorpicker1_initial_data = {};
  	if (ctx.legendOutline !== void 0) {
  		extendedcolorpicker1_initial_data.color = ctx.legendOutline;
  		extendedcolorpicker1_updating.color = true;
  	}
  	var extendedcolorpicker1 = new ExtendedColorPicker({
  		root: component.root,
  		store: component.store,
  		data: extendedcolorpicker1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!extendedcolorpicker1_updating.color && changed.color) {
  				newState.legendOutline = childState.color;
  			}
  			component._set(newState);
  			extendedcolorpicker1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		extendedcolorpicker1._bind({ color: 1 }, extendedcolorpicker1.get());
  	});

  	var inputinteger2_initial_data = { min: "-50", max: "50", value: "0" };
  	if (ctx.legendOffsetX !== void 0) {
  		inputinteger2_initial_data.value = ctx.legendOffsetX;
  		inputinteger2_updating.value = true;
  	}
  	var inputinteger2 = new scanexInputInteger_cjs({
  		root: component.root,
  		store: component.store,
  		data: inputinteger2_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger2_updating.value && changed.value) {
  				newState.legendOffsetX = childState.value;
  			}
  			component._set(newState);
  			inputinteger2_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger2._bind({ value: 1 }, inputinteger2.get());
  	});

  	var inputinteger3_initial_data = { min: "-50", max: "50", value: "0" };
  	if (ctx.legendOffsetY !== void 0) {
  		inputinteger3_initial_data.value = ctx.legendOffsetY;
  		inputinteger3_updating.value = true;
  	}
  	var inputinteger3 = new scanexInputInteger_cjs({
  		root: component.root,
  		store: component.store,
  		data: inputinteger3_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger3_updating.value && changed.value) {
  				newState.legendOffsetY = childState.value;
  			}
  			component._set(newState);
  			inputinteger3_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger3._bind({ value: 1 }, inputinteger3.get());
  	});

  	return {
  		c: function c() {
  			div0 = createElement("div");
  			label = createElement("label");
  			text0 = createText(text0_value);
  			text1 = createText("    \r\n    ");
  			table0 = createElement("table");
  			if (if_block0) if_block0.c();
  			text2 = createText("\r\n                ");
  			if (if_block1) if_block1.c();
  			text3 = createText("\r\n                ");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			text4 = createText(text4_value);
  			text5 = createText("\r\n                    ");
  			td1 = createElement("td");
  			text6 = createText("\r\n                    ");
  			td2 = createElement("td");
  			advancedcolorpicker._fragment.c();
  			text7 = createText("                \r\n                ");
  			tr1 = createElement("tr");
  			td3 = createElement("td");
  			text8 = createText(text8_value);
  			text9 = createText("                    \r\n                    ");
  			td4 = createElement("td");
  			text10 = createText("\r\n                    ");
  			td5 = createElement("td");
  			inputinteger0._fragment.c();
  			text11 = createText("                \r\n                ");
  			if (if_block2) if_block2.c();
  			panel._fragment.c();
  			text12 = createText("\r\n        ");
  			if (if_block3) if_block3.c();
  			text13 = createText("\r\n        ");
  			if (if_block4) if_block4.c();
  			if_block4_anchor = createComment();
  			tabs._fragment.c();
  			text14 = createText("\r\n");
  			div2 = createElement("div");
  			div1 = createElement("div");
  			text15 = createText(text15_value);
  			text16 = createText("\r\n    ");
  			table1 = createElement("table");
  			tr2 = createElement("tr");
  			td6 = createElement("td");
  			text17 = createText(text17_value);
  			text18 = createText("            \r\n            ");
  			td7 = createElement("td");
  			integerrange._fragment.c();
  			text19 = createText("\r\n        ");
  			tr3 = createElement("tr");
  			td8 = createElement("td");
  			text20 = createText(text20_value);
  			text21 = createText("\r\n            ");
  			td9 = createElement("td");
  			dropdown._fragment.c();
  			text22 = createText("\r\n        ");
  			tr4 = createElement("tr");
  			td10 = createElement("td");
  			text23 = createText("            \r\n            ");
  			td11 = createElement("td");
  			textarea = createElement("textarea");
  			text24 = createText("        \r\n        ");
  			tr5 = createElement("tr");
  			td12 = createElement("td");
  			text25 = createText(text25_value);
  			text26 = createText("\r\n            ");
  			td13 = createElement("td");
  			inputinteger1._fragment.c();
  			text27 = createText("\r\n        ");
  			tr6 = createElement("tr");
  			td14 = createElement("td");
  			text28 = createText(text28_value);
  			text29 = createText("            \r\n            ");
  			td15 = createElement("td");
  			extendedcolorpicker0._fragment.c();
  			text30 = createText("\r\n        ");
  			tr7 = createElement("tr");
  			td16 = createElement("td");
  			text31 = createText(text31_value);
  			text32 = createText("            \r\n            ");
  			td17 = createElement("td");
  			extendedcolorpicker1._fragment.c();
  			text33 = createText("\r\n        ");
  			tr8 = createElement("tr");
  			td18 = createElement("td");
  			text34 = createText(text34_value);
  			text35 = createText("            \r\n            ");
  			td19 = createElement("td");
  			inputinteger2._fragment.c();
  			text36 = createText("\r\n        ");
  			tr9 = createElement("tr");
  			td20 = createElement("td");
  			text37 = createText(text37_value);
  			text38 = createText("            \r\n            ");
  			td21 = createElement("td");
  			inputinteger3._fragment.c();
  			td0.className = "label";
  			td2.className = "alpha";
  			tr0.className = "outline";
  			td3.className = "label";
  			td5.className = "size integer-input";
  			td5.colSpan = "3";
  			setAttribute(table0, "cellpadding", "0");
  			setAttribute(table0, "cellspacing", "0");
  			div0.className = "decoration";
  			td6.className = "label";
  			td8.className = "label";
  			td9.className = "attr";
  			tr3.className = "tag";
  			addListener(textarea, "keyup", keyup_handler);
  			textarea.value = ctx.legendField;
  			td12.className = "label";
  			td13.className = "size integer-input";
  			tr5.className = "style";
  			td14.className = "label";
  			tr6.className = "fill";
  			td16.className = "label";
  			tr7.className = "outline";
  			td18.className = "label";
  			td19.className = "integer-input";
  			tr8.className = "offset";
  			td20.className = "label";
  			td21.className = "integer-input";
  			tr9.className = "offset";
  			setAttribute(table1, "cellspacing", "0");
  			setAttribute(table1, "cellpadding", "0");
  			div2.className = "legend";
  		},
  		m: function m(target, anchor) {
  			insert(target, div0, anchor);
  			append(div0, label);
  			append(label, text0);
  			append(div0, text1);
  			append(panel._slotted.default, table0);
  			if (if_block0) if_block0.m(table0, null);
  			append(table0, text2);
  			if (if_block1) if_block1.m(table0, null);
  			append(table0, text3);
  			append(table0, tr0);
  			append(tr0, td0);
  			append(td0, text4);
  			append(tr0, text5);
  			append(tr0, td1);
  			append(tr0, text6);
  			append(tr0, td2);
  			advancedcolorpicker._mount(td2, null);
  			append(table0, text7);
  			append(table0, tr1);
  			append(tr1, td3);
  			append(td3, text8);
  			append(tr1, text9);
  			append(tr1, td4);
  			append(tr1, text10);
  			append(tr1, td5);
  			inputinteger0._mount(td5, null);
  			append(table0, text11);
  			if (if_block2) if_block2.m(table0, null);
  			panel._mount(tabs._slotted.default, null);
  			append(tabs._slotted.default, text12);
  			if (if_block3) if_block3.m(tabs._slotted.default, null);
  			append(tabs._slotted.default, text13);
  			if (if_block4) if_block4.m(tabs._slotted.default, null);
  			append(tabs._slotted.default, if_block4_anchor);
  			tabs._mount(div0, null);
  			insert(target, text14, anchor);
  			insert(target, div2, anchor);
  			append(div2, div1);
  			append(div1, text15);
  			append(div2, text16);
  			append(div2, table1);
  			append(table1, tr2);
  			append(tr2, td6);
  			append(td6, text17);
  			append(tr2, text18);
  			append(tr2, td7);
  			integerrange._mount(td7, null);
  			append(table1, text19);
  			append(table1, tr3);
  			append(tr3, td8);
  			append(td8, text20);
  			append(tr3, text21);
  			append(tr3, td9);
  			dropdown._mount(td9, null);
  			append(table1, text22);
  			append(table1, tr4);
  			append(tr4, td10);
  			append(tr4, text23);
  			append(tr4, td11);
  			append(td11, textarea);
  			component.refs.field = textarea;
  			append(table1, text24);
  			append(table1, tr5);
  			append(tr5, td12);
  			append(td12, text25);
  			append(tr5, text26);
  			append(tr5, td13);
  			inputinteger1._mount(td13, null);
  			append(table1, text27);
  			append(table1, tr6);
  			append(tr6, td14);
  			append(td14, text28);
  			append(tr6, text29);
  			append(tr6, td15);
  			extendedcolorpicker0._mount(td15, null);
  			append(table1, text30);
  			append(table1, tr7);
  			append(tr7, td16);
  			append(td16, text31);
  			append(tr7, text32);
  			append(tr7, td17);
  			extendedcolorpicker1._mount(td17, null);
  			append(table1, text33);
  			append(table1, tr8);
  			append(tr8, td18);
  			append(td18, text34);
  			append(tr8, text35);
  			append(tr8, td19);
  			inputinteger2._mount(td19, null);
  			append(table1, text36);
  			append(table1, tr9);
  			append(tr9, td20);
  			append(td20, text37);
  			append(tr9, text38);
  			append(tr9, td21);
  			inputinteger3._mount(td21, null);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (ctx.geometryType === 'point') {
  				if (if_block0) {
  					if_block0.p(changed, ctx);
  				} else {
  					if_block0 = create_if_block_4(component, ctx);
  					if_block0.c();
  					if_block0.m(table0, text2);
  				}
  			} else if (if_block0) {
  				if_block0.d(1);
  				if_block0 = null;
  			}

  			if (ctx.geometryType !== 'linestring') {
  				if (if_block1) {
  					if_block1.p(changed, ctx);
  				} else {
  					if_block1 = create_if_block_3(component, ctx);
  					if_block1.c();
  					if_block1.m(table0, text3);
  				}
  			} else if (if_block1) {
  				if_block1.d(1);
  				if_block1 = null;
  			}

  			if (changed.geometryType && text4_value !== (text4_value = translate$3(ctx.geometryType === 'linestring' ? 'color' : 'outline'))) {
  				setData(text4, text4_value);
  			}

  			var advancedcolorpicker_changes = {};
  			if (!advancedcolorpicker_updating.color && changed.decorationOutline) {
  				advancedcolorpicker_changes.color = ctx.decorationOutline;
  				advancedcolorpicker_updating.color = ctx.decorationOutline !== void 0;
  			}
  			if (!advancedcolorpicker_updating.alpha && changed.decorationOutlineAlpha) {
  				advancedcolorpicker_changes.alpha = ctx.decorationOutlineAlpha;
  				advancedcolorpicker_updating.alpha = ctx.decorationOutlineAlpha !== void 0;
  			}
  			advancedcolorpicker._set(advancedcolorpicker_changes);
  			advancedcolorpicker_updating = {};

  			var inputinteger0_changes = {};
  			if (!inputinteger0_updating.value && changed.decorationOutlineSize) {
  				inputinteger0_changes.value = ctx.decorationOutlineSize;
  				inputinteger0_updating.value = ctx.decorationOutlineSize !== void 0;
  			}
  			inputinteger0._set(inputinteger0_changes);
  			inputinteger0_updating = {};

  			if (ctx.geometryType !== 'point') {
  				if (if_block2) {
  					if_block2.p(changed, ctx);
  				} else {
  					if_block2 = create_if_block_2(component, ctx);
  					if_block2.c();
  					if_block2.m(table0, null);
  				}
  			} else if (if_block2) {
  				if_block2.d(1);
  				if_block2 = null;
  			}

  			if (ctx.geometryType === 'polygon') {
  				if (if_block3) {
  					if_block3.p(changed, ctx);
  				} else {
  					if_block3 = create_if_block_1(component, ctx);
  					if_block3.c();
  					if_block3.m(text13.parentNode, text13);
  				}
  			} else if (if_block3) {
  				if_block3.d(1);
  				if_block3 = null;
  			}

  			if (ctx.geometryType !== 'linestring') {
  				if (if_block4) {
  					if_block4.p(changed, ctx);
  				} else {
  					if_block4 = create_if_block$4(component, ctx);
  					if_block4.c();
  					if_block4.m(if_block4_anchor.parentNode, if_block4_anchor);
  				}
  			} else if (if_block4) {
  				if_block4.d(1);
  				if_block4 = null;
  			}

  			var tabs_changes = {};
  			if (!tabs_updating.index && changed.fillStyle) {
  				tabs_changes.index = ctx.fillStyle;
  				tabs_updating.index = ctx.fillStyle !== void 0;
  			}
  			tabs._set(tabs_changes);
  			tabs_updating = {};

  			var integerrange_changes = {};
  			if (!integerrange_updating.low && changed.legendMinZoom) {
  				integerrange_changes.low = ctx.legendMinZoom;
  				integerrange_updating.low = ctx.legendMinZoom !== void 0;
  			}
  			if (!integerrange_updating.high && changed.legendMaxZoom) {
  				integerrange_changes.high = ctx.legendMaxZoom;
  				integerrange_updating.high = ctx.legendMaxZoom !== void 0;
  			}
  			integerrange._set(integerrange_changes);
  			integerrange_updating = {};

  			var dropdown_changes = {};
  			if (!dropdown_updating.items && changed.legendFields) {
  				dropdown_changes.items = ctx.legendFields;
  				dropdown_updating.items = ctx.legendFields !== void 0;
  			}
  			dropdown._set(dropdown_changes);
  			dropdown_updating = {};

  			if (changed.legendField) {
  				textarea.value = ctx.legendField;
  			}

  			var inputinteger1_changes = {};
  			if (!inputinteger1_updating.value && changed.legendFontSize) {
  				inputinteger1_changes.value = ctx.legendFontSize;
  				inputinteger1_updating.value = ctx.legendFontSize !== void 0;
  			}
  			inputinteger1._set(inputinteger1_changes);
  			inputinteger1_updating = {};

  			var extendedcolorpicker0_changes = {};
  			if (!extendedcolorpicker0_updating.color && changed.legendFill) {
  				extendedcolorpicker0_changes.color = ctx.legendFill;
  				extendedcolorpicker0_updating.color = ctx.legendFill !== void 0;
  			}
  			extendedcolorpicker0._set(extendedcolorpicker0_changes);
  			extendedcolorpicker0_updating = {};

  			var extendedcolorpicker1_changes = {};
  			if (!extendedcolorpicker1_updating.color && changed.legendOutline) {
  				extendedcolorpicker1_changes.color = ctx.legendOutline;
  				extendedcolorpicker1_updating.color = ctx.legendOutline !== void 0;
  			}
  			extendedcolorpicker1._set(extendedcolorpicker1_changes);
  			extendedcolorpicker1_updating = {};

  			var inputinteger2_changes = {};
  			if (!inputinteger2_updating.value && changed.legendOffsetX) {
  				inputinteger2_changes.value = ctx.legendOffsetX;
  				inputinteger2_updating.value = ctx.legendOffsetX !== void 0;
  			}
  			inputinteger2._set(inputinteger2_changes);
  			inputinteger2_updating = {};

  			var inputinteger3_changes = {};
  			if (!inputinteger3_updating.value && changed.legendOffsetY) {
  				inputinteger3_changes.value = ctx.legendOffsetY;
  				inputinteger3_updating.value = ctx.legendOffsetY !== void 0;
  			}
  			inputinteger3._set(inputinteger3_changes);
  			inputinteger3_updating = {};
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(div0);
  			}

  			if (if_block0) if_block0.d();
  			if (if_block1) if_block1.d();
  			advancedcolorpicker.destroy();
  			inputinteger0.destroy();
  			if (if_block2) if_block2.d();
  			panel.destroy();
  			if (if_block3) if_block3.d();
  			if (if_block4) if_block4.d();
  			tabs.destroy();
  			if (detach) {
  				detachNode(text14);
  				detachNode(div2);
  			}

  			integerrange.destroy();
  			if (component.refs.zoom === integerrange) component.refs.zoom = null;
  			dropdown.destroy();
  			removeListener(textarea, "keyup", keyup_handler);
  			if (component.refs.field === textarea) component.refs.field = null;
  			inputinteger1.destroy();
  			extendedcolorpicker0.destroy();
  			extendedcolorpicker1.destroy();
  			inputinteger2.destroy();
  			inputinteger3.destroy();
  		}
  	};
  }

  // (6:16) {#if geometryType === 'point'}
  function create_if_block_4(component, ctx) {
  	var tr,
  	    td0,
  	    text0_value = translate$3('size'),
  	    text0,
  	    text1,
  	    td1,
  	    text2,
  	    td2,
  	    inputinteger_updating = {};

  	var inputinteger_initial_data = { min: "0", max: "24", value: "10" };
  	if (ctx.markerSize !== void 0) {
  		inputinteger_initial_data.value = ctx.markerSize;
  		inputinteger_updating.value = true;
  	}
  	var inputinteger = new scanexInputInteger_cjs({
  		root: component.root,
  		store: component.store,
  		data: inputinteger_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger_updating.value && changed.value) {
  				newState.markerSize = childState.value;
  			}
  			component._set(newState);
  			inputinteger_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger._bind({ value: 1 }, inputinteger.get());
  	});

  	return {
  		c: function c() {
  			tr = createElement("tr");
  			td0 = createElement("td");
  			text0 = createText(text0_value);
  			text1 = createText("\r\n                    ");
  			td1 = createElement("td");
  			text2 = createText("                    \r\n                    ");
  			td2 = createElement("td");
  			inputinteger._fragment.c();
  			td0.className = "label";
  			td2.className = "size integer-input";
  			td2.colSpan = "3";
  		},
  		m: function m(target, anchor) {
  			insert(target, tr, anchor);
  			append(tr, td0);
  			append(td0, text0);
  			append(tr, text1);
  			append(tr, td1);
  			append(tr, text2);
  			append(tr, td2);
  			inputinteger._mount(td2, null);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			var inputinteger_changes = {};
  			if (!inputinteger_updating.value && changed.markerSize) {
  				inputinteger_changes.value = ctx.markerSize;
  				inputinteger_updating.value = ctx.markerSize !== void 0;
  			}
  			inputinteger._set(inputinteger_changes);
  			inputinteger_updating = {};
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(tr);
  			}

  			inputinteger.destroy();
  		}
  	};
  }

  // (15:16) {#if geometryType !== 'linestring'}
  function create_if_block_3(component, ctx) {
  	var tr,
  	    td0,
  	    text0_value = translate$3('fill'),
  	    text0,
  	    text1,
  	    td1,
  	    i,
  	    statebutton_updating = {},
  	    text2,
  	    td2,
  	    advancedcolorpicker_updating = {};

  	var statebutton_initial_data = {};
  	if (ctx.useDecorationFill !== void 0) {
  		statebutton_initial_data.flag = ctx.useDecorationFill;
  		statebutton_updating.flag = true;
  	}
  	var statebutton = new StateButton({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: statebutton_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!statebutton_updating.flag && changed.flag) {
  				newState.useDecorationFill = childState.flag;
  			}
  			component._set(newState);
  			statebutton_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		statebutton._bind({ flag: 1 }, statebutton.get());
  	});

  	var advancedcolorpicker_initial_data = {};
  	if (ctx.decorationFill !== void 0) {
  		advancedcolorpicker_initial_data.color = ctx.decorationFill;
  		advancedcolorpicker_updating.color = true;
  	}
  	if (ctx.decorationFillAlpha !== void 0) {
  		advancedcolorpicker_initial_data.alpha = ctx.decorationFillAlpha;
  		advancedcolorpicker_updating.alpha = true;
  	}
  	var advancedcolorpicker = new AdvancedColorPicker({
  		root: component.root,
  		store: component.store,
  		data: advancedcolorpicker_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!advancedcolorpicker_updating.color && changed.color) {
  				newState.decorationFill = childState.color;
  			}

  			if (!advancedcolorpicker_updating.alpha && changed.alpha) {
  				newState.decorationFillAlpha = childState.alpha;
  			}
  			component._set(newState);
  			advancedcolorpicker_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		advancedcolorpicker._bind({ color: 1, alpha: 1 }, advancedcolorpicker.get());
  	});

  	return {
  		c: function c() {
  			tr = createElement("tr");
  			td0 = createElement("td");
  			text0 = createText(text0_value);
  			text1 = createText("                                     \r\n                    ");
  			td1 = createElement("td");
  			i = createElement("i");
  			statebutton._fragment.c();
  			text2 = createText("\r\n                    ");
  			td2 = createElement("td");
  			advancedcolorpicker._fragment.c();
  			td0.className = "label";
  			i.className = "style-editor-icon";
  			td1.className = "clear";
  			td2.className = "alpha";
  			tr.className = "fill";
  		},
  		m: function m(target, anchor) {
  			insert(target, tr, anchor);
  			append(tr, td0);
  			append(td0, text0);
  			append(tr, text1);
  			append(tr, td1);
  			append(statebutton._slotted.default, i);
  			statebutton._mount(td1, null);
  			append(tr, text2);
  			append(tr, td2);
  			advancedcolorpicker._mount(td2, null);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			var statebutton_changes = {};
  			if (!statebutton_updating.flag && changed.useDecorationFill) {
  				statebutton_changes.flag = ctx.useDecorationFill;
  				statebutton_updating.flag = ctx.useDecorationFill !== void 0;
  			}
  			statebutton._set(statebutton_changes);
  			statebutton_updating = {};

  			var advancedcolorpicker_changes = {};
  			if (!advancedcolorpicker_updating.color && changed.decorationFill) {
  				advancedcolorpicker_changes.color = ctx.decorationFill;
  				advancedcolorpicker_updating.color = ctx.decorationFill !== void 0;
  			}
  			if (!advancedcolorpicker_updating.alpha && changed.decorationFillAlpha) {
  				advancedcolorpicker_changes.alpha = ctx.decorationFillAlpha;
  				advancedcolorpicker_updating.alpha = ctx.decorationFillAlpha !== void 0;
  			}
  			advancedcolorpicker._set(advancedcolorpicker_changes);
  			advancedcolorpicker_updating = {};
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(tr);
  			}

  			statebutton.destroy();
  			advancedcolorpicker.destroy();
  		}
  	};
  }

  // (42:16) {#if geometryType !== 'point'}
  function create_if_block_2(component, ctx) {
  	var tr,
  	    td0,
  	    text0_value = translate$3(ctx.geometryType === 'linestring' ? 'lineType' : 'type'),
  	    text0,
  	    text1,
  	    td1,
  	    text2,
  	    td2,
  	    i0,
  	    text4,
  	    i1,
  	    switch_1_updating = {},
  	    text6,
  	    span,
  	    validatinginput_updating = {};

  	var switch_1_initial_data = {};
  	if (ctx.decorationOutlineType !== void 0) {
  		switch_1_initial_data.flag = ctx.decorationOutlineType;
  		switch_1_updating.flag = true;
  	}
  	var switch_1 = new scanexSwitch_cjs({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment(), right: createFragment(), left: createFragment() },
  		data: switch_1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!switch_1_updating.flag && changed.flag) {
  				newState.decorationOutlineType = childState.flag;
  			}
  			component._set(newState);
  			switch_1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		switch_1._bind({ flag: 1 }, switch_1.get());
  	});

  	var validatinginput_initial_data = {
  		placeholder: "10 10",
  		validate: "^[0-9]+\\s+[0-9]+$"
  	};
  	if (ctx.dashes !== void 0) {
  		validatinginput_initial_data.value = ctx.dashes;
  		validatinginput_updating.value = true;
  	}
  	var validatinginput = new scanexValidatingInput_cjs({
  		root: component.root,
  		store: component.store,
  		data: validatinginput_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!validatinginput_updating.value && changed.value) {
  				newState.dashes = childState.value;
  			}
  			component._set(newState);
  			validatinginput_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		validatinginput._bind({ value: 1 }, validatinginput.get());
  	});

  	return {
  		c: function c() {
  			tr = createElement("tr");
  			td0 = createElement("td");
  			text0 = createText(text0_value);
  			text1 = createText("                    \r\n                    ");
  			td1 = createElement("td");
  			text2 = createText("             \r\n                    ");
  			td2 = createElement("td");
  			i0 = createElement("i");
  			i0.textContent = "┃";
  			text4 = createText("\r\n                            ");
  			i1 = createElement("i");
  			i1.textContent = "┇";
  			switch_1._fragment.c();
  			text6 = createText(" \r\n                        ");
  			span = createElement("span");
  			validatinginput._fragment.c();
  			td0.className = "label";
  			setAttribute(i0, "slot", "left");
  			setAttribute(i1, "slot", "right");
  			span.className = "dash";
  			td2.className = "type-switch";
  			td2.colSpan = "3";
  			tr.className = "type";
  		},
  		m: function m(target, anchor) {
  			insert(target, tr, anchor);
  			append(tr, td0);
  			append(td0, text0);
  			append(tr, text1);
  			append(tr, td1);
  			append(tr, text2);
  			append(tr, td2);
  			append(switch_1._slotted.left, i0);
  			append(switch_1._slotted.default, text4);
  			append(switch_1._slotted.right, i1);
  			switch_1._mount(td2, null);
  			append(td2, text6);
  			append(td2, span);
  			validatinginput._mount(span, null);
  			component.refs.fillOutlineDash = span;
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.geometryType && text0_value !== (text0_value = translate$3(ctx.geometryType === 'linestring' ? 'lineType' : 'type'))) {
  				setData(text0, text0_value);
  			}

  			var switch_1_changes = {};
  			if (!switch_1_updating.flag && changed.decorationOutlineType) {
  				switch_1_changes.flag = ctx.decorationOutlineType;
  				switch_1_updating.flag = ctx.decorationOutlineType !== void 0;
  			}
  			switch_1._set(switch_1_changes);
  			switch_1_updating = {};

  			var validatinginput_changes = {};
  			if (!validatinginput_updating.value && changed.dashes) {
  				validatinginput_changes.value = ctx.dashes;
  				validatinginput_updating.value = ctx.dashes !== void 0;
  			}
  			validatinginput._set(validatinginput_changes);
  			validatinginput_updating = {};
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(tr);
  			}

  			switch_1.destroy();
  			validatinginput.destroy();
  			if (component.refs.fillOutlineDash === span) component.refs.fillOutlineDash = null;
  		}
  	};
  }

  // (59:8) {#if geometryType === 'polygon'}
  function create_if_block_1(component, ctx) {
  	var patterns_updating = {};

  	var patterns_initial_data = {};
  	if (ctx.patternColors !== void 0) {
  		patterns_initial_data.colors = ctx.patternColors;
  		patterns_updating.colors = true;
  	}
  	if (ctx.patternStyle !== void 0) {
  		patterns_initial_data.style = ctx.patternStyle;
  		patterns_updating.style = true;
  	}
  	if (ctx.patternStyleIndex !== void 0) {
  		patterns_initial_data.styleIndex = ctx.patternStyleIndex;
  		patterns_updating.styleIndex = true;
  	}
  	if (ctx.patternWidth !== void 0) {
  		patterns_initial_data.width = ctx.patternWidth;
  		patterns_updating.width = true;
  	}
  	if (ctx.patternOffset !== void 0) {
  		patterns_initial_data.offset = ctx.patternOffset;
  		patterns_updating.offset = true;
  	}
  	if (ctx.decorationOutline !== void 0) {
  		patterns_initial_data.outline = ctx.decorationOutline;
  		patterns_updating.outline = true;
  	}
  	if (ctx.decorationOutlineAlpha !== void 0) {
  		patterns_initial_data.outlineAlpha = ctx.decorationOutlineAlpha;
  		patterns_updating.outlineAlpha = true;
  	}
  	if (ctx.decorationOutlineSize !== void 0) {
  		patterns_initial_data.outlineSize = ctx.decorationOutlineSize;
  		patterns_updating.outlineSize = true;
  	}
  	if (ctx.decorationOutlineType !== void 0) {
  		patterns_initial_data.outlineType = ctx.decorationOutlineType;
  		patterns_updating.outlineType = true;
  	}
  	var patterns = new Patterns({
  		root: component.root,
  		store: component.store,
  		data: patterns_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!patterns_updating.colors && changed.colors) {
  				newState.patternColors = childState.colors;
  			}

  			if (!patterns_updating.style && changed.style) {
  				newState.patternStyle = childState.style;
  			}

  			if (!patterns_updating.styleIndex && changed.styleIndex) {
  				newState.patternStyleIndex = childState.styleIndex;
  			}

  			if (!patterns_updating.width && changed.width) {
  				newState.patternWidth = childState.width;
  			}

  			if (!patterns_updating.offset && changed.offset) {
  				newState.patternOffset = childState.offset;
  			}

  			if (!patterns_updating.outline && changed.outline) {
  				newState.decorationOutline = childState.outline;
  			}

  			if (!patterns_updating.outlineAlpha && changed.outlineAlpha) {
  				newState.decorationOutlineAlpha = childState.outlineAlpha;
  			}

  			if (!patterns_updating.outlineSize && changed.outlineSize) {
  				newState.decorationOutlineSize = childState.outlineSize;
  			}

  			if (!patterns_updating.outlineType && changed.outlineType) {
  				newState.decorationOutlineType = childState.outlineType;
  			}
  			component._set(newState);
  			patterns_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		patterns._bind({ colors: 1, style: 1, styleIndex: 1, width: 1, offset: 1, outline: 1, outlineAlpha: 1, outlineSize: 1, outlineType: 1 }, patterns.get());
  	});

  	component.refs.patterns = patterns;

  	var panel_initial_data = {
  		id: "patterns",
  		icon: "style-editor-icon patterns"
  	};
  	var panel = new scanexTabs_cjs_3({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel_initial_data
  	});

  	return {
  		c: function c() {
  			patterns._fragment.c();
  			panel._fragment.c();
  		},
  		m: function m(target, anchor) {
  			patterns._mount(panel._slotted.default, null);
  			panel._mount(target, anchor);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			var patterns_changes = {};
  			if (!patterns_updating.colors && changed.patternColors) {
  				patterns_changes.colors = ctx.patternColors;
  				patterns_updating.colors = ctx.patternColors !== void 0;
  			}
  			if (!patterns_updating.style && changed.patternStyle) {
  				patterns_changes.style = ctx.patternStyle;
  				patterns_updating.style = ctx.patternStyle !== void 0;
  			}
  			if (!patterns_updating.styleIndex && changed.patternStyleIndex) {
  				patterns_changes.styleIndex = ctx.patternStyleIndex;
  				patterns_updating.styleIndex = ctx.patternStyleIndex !== void 0;
  			}
  			if (!patterns_updating.width && changed.patternWidth) {
  				patterns_changes.width = ctx.patternWidth;
  				patterns_updating.width = ctx.patternWidth !== void 0;
  			}
  			if (!patterns_updating.offset && changed.patternOffset) {
  				patterns_changes.offset = ctx.patternOffset;
  				patterns_updating.offset = ctx.patternOffset !== void 0;
  			}
  			if (!patterns_updating.outline && changed.decorationOutline) {
  				patterns_changes.outline = ctx.decorationOutline;
  				patterns_updating.outline = ctx.decorationOutline !== void 0;
  			}
  			if (!patterns_updating.outlineAlpha && changed.decorationOutlineAlpha) {
  				patterns_changes.outlineAlpha = ctx.decorationOutlineAlpha;
  				patterns_updating.outlineAlpha = ctx.decorationOutlineAlpha !== void 0;
  			}
  			if (!patterns_updating.outlineSize && changed.decorationOutlineSize) {
  				patterns_changes.outlineSize = ctx.decorationOutlineSize;
  				patterns_updating.outlineSize = ctx.decorationOutlineSize !== void 0;
  			}
  			if (!patterns_updating.outlineType && changed.decorationOutlineType) {
  				patterns_changes.outlineType = ctx.decorationOutlineType;
  				patterns_updating.outlineType = ctx.decorationOutlineType !== void 0;
  			}
  			patterns._set(patterns_changes);
  			patterns_updating = {};
  		},
  		d: function d(detach) {
  			patterns.destroy();
  			if (component.refs.patterns === patterns) component.refs.patterns = null;
  			panel.destroy(detach);
  		}
  	};
  }

  // (73:8) {#if geometryType !== 'linestring'}
  function create_if_block$4(component, ctx) {
  	var table,
  	    tr0,
  	    td0,
  	    text0_value = translate$3('marker'),
  	    text0,
  	    text1,
  	    td1,
  	    fileinput_updating = {},
  	    text2,
  	    tr1,
  	    td2,
  	    text3_value = translate$3('angle'),
  	    text3,
  	    text4,
  	    td3,
  	    dropdown_updating = {},
  	    text5,
  	    tr2,
  	    td4,
  	    text6,
  	    td5,
  	    textarea;

  	var fileinput_initial_data = {};
  	if (ctx.markerUrl !== void 0) {
  		fileinput_initial_data.value = ctx.markerUrl;
  		fileinput_updating.value = true;
  	}
  	var fileinput = new scanexFileInput_cjs({
  		root: component.root,
  		store: component.store,
  		data: fileinput_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!fileinput_updating.value && changed.value) {
  				newState.markerUrl = childState.value;
  			}
  			component._set(newState);
  			fileinput_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		fileinput._bind({ value: 1 }, fileinput.get());
  	});

  	fileinput.on("open", function (event) {
  		component.upload(event);
  	});

  	var dropdown_initial_data = { selected: "0" };
  	if (ctx.legendFields !== void 0) {
  		dropdown_initial_data.items = ctx.legendFields;
  		dropdown_updating.items = true;
  	}
  	var dropdown = new scanexDropdown_cjs({
  		root: component.root,
  		store: component.store,
  		data: dropdown_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!dropdown_updating.items && changed.items) {
  				newState.legendFields = childState.items;
  			}
  			component._set(newState);
  			dropdown_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		dropdown._bind({ items: 1 }, dropdown.get());
  	});

  	dropdown.on("select", function (event) {
  		component.addAngle(event);
  	});

  	function keyup_handler(event) {
  		component.changeAngle(event);
  	}

  	var panel_initial_data = {
  		id: "marker",
  		icon: "style-editor-icon marker"
  	};
  	var panel = new scanexTabs_cjs_3({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel_initial_data
  	});

  	return {
  		c: function c() {
  			table = createElement("table");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			text0 = createText(text0_value);
  			text1 = createText("\r\n                    ");
  			td1 = createElement("td");
  			fileinput._fragment.c();
  			text2 = createText("\r\n                ");
  			tr1 = createElement("tr");
  			td2 = createElement("td");
  			text3 = createText(text3_value);
  			text4 = createText("\r\n                    ");
  			td3 = createElement("td");
  			dropdown._fragment.c();
  			text5 = createText("\r\n                ");
  			tr2 = createElement("tr");
  			td4 = createElement("td");
  			text6 = createText("\r\n                    ");
  			td5 = createElement("td");
  			textarea = createElement("textarea");
  			panel._fragment.c();
  			td0.className = "label";
  			td2.className = "label";
  			td3.className = "attr";
  			tr1.className = "angle";
  			addListener(textarea, "keyup", keyup_handler);
  			textarea.value = ctx.markerAngle;
  			tr2.className = "value";
  			table.className = "upload";
  			setAttribute(table, "cellpadding", "0");
  			setAttribute(table, "cellspacing", "0");
  		},
  		m: function m(target, anchor) {
  			append(panel._slotted.default, table);
  			append(table, tr0);
  			append(tr0, td0);
  			append(td0, text0);
  			append(tr0, text1);
  			append(tr0, td1);
  			fileinput._mount(td1, null);
  			append(table, text2);
  			append(table, tr1);
  			append(tr1, td2);
  			append(td2, text3);
  			append(tr1, text4);
  			append(tr1, td3);
  			dropdown._mount(td3, null);
  			append(table, text5);
  			append(table, tr2);
  			append(tr2, td4);
  			append(tr2, text6);
  			append(tr2, td5);
  			append(td5, textarea);
  			component.refs.angle = textarea;
  			panel._mount(target, anchor);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			var fileinput_changes = {};
  			if (!fileinput_updating.value && changed.markerUrl) {
  				fileinput_changes.value = ctx.markerUrl;
  				fileinput_updating.value = ctx.markerUrl !== void 0;
  			}
  			fileinput._set(fileinput_changes);
  			fileinput_updating = {};

  			var dropdown_changes = {};
  			if (!dropdown_updating.items && changed.legendFields) {
  				dropdown_changes.items = ctx.legendFields;
  				dropdown_updating.items = ctx.legendFields !== void 0;
  			}
  			dropdown._set(dropdown_changes);
  			dropdown_updating = {};

  			if (changed.markerAngle) {
  				textarea.value = ctx.markerAngle;
  			}
  		},
  		d: function d(detach) {
  			fileinput.destroy();
  			dropdown.destroy();
  			removeListener(textarea, "keyup", keyup_handler);
  			if (component.refs.angle === textarea) component.refs.angle = null;
  			panel.destroy(detach);
  		}
  	};
  }

  function Layout(options) {
  	var _this2 = this;

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$b(), options.data);
  	this._intro = true;
  	this._handlers.update = [onupdate$6];

  	this._fragment = create_main_fragment$b(this, this._state);

  	this.root._oncreate.push(function () {
  		_this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
  	});

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}
  }

  assign(Layout.prototype, proto);
  assign(Layout.prototype, methods$6);

  /* src\Filter\Filter.html generated by Svelte v2.16.1 */

  scanexTranslations_cjs.addText('eng', {
  	apply: 'Apply',
  	attribute: 'Attribute',
  	operations: 'Operations'
  });

  scanexTranslations_cjs.addText('rus', {
  	apply: 'Применить',
  	attribute: 'Атрибут',
  	operations: 'Операторы'
  });

  var translate$4 = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

  function data$c() {
  	return {
  		text: '',
  		fields: [],
  		operations: ['', '=', '>', '<', '>=', '<=', 'AND', 'LIKE', 'IN', 'OR']
  	};
  }
  var methods$7 = {
  	addField: function addField(index) {
  		var _get = this.get(),
  		    fields = _get.fields;

  		var text = this.refs.text.value;
  		var value = fields[index];
  		if (value && value.trim() !== '') {
  			var start = this.refs.text.selectionStart;
  			var end = this.refs.text.selectionEnd;
  			text = [text.substring(0, start), '[' + value.trim() + ']', text.substring(end)].join('');
  		}
  		this.refs.text.value = text;
  		this.set({ text: this.refs.text.value });
  	},
  	changeField: function changeField(e) {
  		this.set({ text: this.refs.text.value });
  	},
  	addOperation: function addOperation(index) {
  		var _get2 = this.get(),
  		    operations = _get2.operations;

  		var text = this.refs.text.value;
  		var value = operations[index];
  		if (value && value.trim() !== '') {
  			var start = this.refs.text.selectionStart;
  			var end = this.refs.text.selectionEnd;
  			text = [text.substring(0, start), value.trim(), text.substring(end)].join('');
  		}
  		this.refs.text.value = text;
  		this.set({ text: this.refs.text.value });
  	}
  };

  function create_main_fragment$c(component, ctx) {
  	var div,
  	    table,
  	    tr0,
  	    td0,
  	    text0_value = translate$4('attribute'),
  	    text0,
  	    text1,
  	    td1,
  	    dropdown0_updating = {},
  	    text2,
  	    tr1,
  	    td2,
  	    text3_value = translate$4('operations'),
  	    text3,
  	    text4,
  	    td3,
  	    dropdown1_updating = {},
  	    text5,
  	    tr2,
  	    td4,
  	    textarea;

  	var dropdown0_initial_data = { selected: "0" };
  	if (ctx.fields !== void 0) {
  		dropdown0_initial_data.items = ctx.fields;
  		dropdown0_updating.items = true;
  	}
  	var dropdown0 = new scanexDropdown_cjs({
  		root: component.root,
  		store: component.store,
  		data: dropdown0_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!dropdown0_updating.items && changed.items) {
  				newState.fields = childState.items;
  			}
  			component._set(newState);
  			dropdown0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		dropdown0._bind({ items: 1 }, dropdown0.get());
  	});

  	dropdown0.on("select", function (event) {
  		component.addField(event);
  	});

  	var dropdown1_initial_data = { selected: "0" };
  	if (ctx.operations !== void 0) {
  		dropdown1_initial_data.items = ctx.operations;
  		dropdown1_updating.items = true;
  	}
  	var dropdown1 = new scanexDropdown_cjs({
  		root: component.root,
  		store: component.store,
  		data: dropdown1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!dropdown1_updating.items && changed.items) {
  				newState.operations = childState.items;
  			}
  			component._set(newState);
  			dropdown1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		dropdown1._bind({ items: 1 }, dropdown1.get());
  	});

  	dropdown1.on("select", function (event) {
  		component.addOperation(event);
  	});

  	function keyup_handler(event) {
  		component.changeField(event);
  	}

  	return {
  		c: function c() {
  			div = createElement("div");
  			table = createElement("table");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			text0 = createText(text0_value);
  			text1 = createText("        \r\n            ");
  			td1 = createElement("td");
  			dropdown0._fragment.c();
  			text2 = createText("\r\n        ");
  			tr1 = createElement("tr");
  			td2 = createElement("td");
  			text3 = createText(text3_value);
  			text4 = createText("\r\n            ");
  			td3 = createElement("td");
  			dropdown1._fragment.c();
  			text5 = createText("\r\n        ");
  			tr2 = createElement("tr");
  			td4 = createElement("td");
  			textarea = createElement("textarea");
  			td0.className = "label";
  			td1.className = "attr";
  			tr0.className = "tag";
  			td2.className = "label";
  			td3.className = "attr";
  			tr1.className = "op";
  			addListener(textarea, "keyup", keyup_handler);
  			textarea.value = ctx.text;
  			td4.className = "content";
  			td4.colSpan = "2";
  			setAttribute(table, "cellpadding", "0");
  			setAttribute(table, "cellspacing", "0");
  			div.className = "filter";
  		},
  		m: function m(target, anchor) {
  			insert(target, div, anchor);
  			append(div, table);
  			append(table, tr0);
  			append(tr0, td0);
  			append(td0, text0);
  			append(tr0, text1);
  			append(tr0, td1);
  			dropdown0._mount(td1, null);
  			append(table, text2);
  			append(table, tr1);
  			append(tr1, td2);
  			append(td2, text3);
  			append(tr1, text4);
  			append(tr1, td3);
  			dropdown1._mount(td3, null);
  			append(table, text5);
  			append(table, tr2);
  			append(tr2, td4);
  			append(td4, textarea);
  			component.refs.text = textarea;
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			var dropdown0_changes = {};
  			if (!dropdown0_updating.items && changed.fields) {
  				dropdown0_changes.items = ctx.fields;
  				dropdown0_updating.items = ctx.fields !== void 0;
  			}
  			dropdown0._set(dropdown0_changes);
  			dropdown0_updating = {};

  			var dropdown1_changes = {};
  			if (!dropdown1_updating.items && changed.operations) {
  				dropdown1_changes.items = ctx.operations;
  				dropdown1_updating.items = ctx.operations !== void 0;
  			}
  			dropdown1._set(dropdown1_changes);
  			dropdown1_updating = {};

  			if (changed.text) {
  				textarea.value = ctx.text;
  			}
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			dropdown0.destroy();
  			dropdown1.destroy();
  			removeListener(textarea, "keyup", keyup_handler);
  			if (component.refs.text === textarea) component.refs.text = null;
  		}
  	};
  }

  function Filter(options) {
  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$c(), options.data);
  	this._intro = true;

  	this._fragment = create_main_fragment$c(this, this._state);

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}
  }

  assign(Filter.prototype, proto);
  assign(Filter.prototype, methods$7);

  /* src\Popup\Popup.html generated by Svelte v2.16.1 */

  scanexTranslations_cjs.addText('eng', {
  	attribute: 'Attribute',
  	defaultValue: 'Default Value',
  	show: {
  		useClick: 'Show on click',
  		useHover: 'Show on hover'
  	}
  });

  scanexTranslations_cjs.addText('rus', {
  	attribute: 'Атрибут',
  	defaultValue: 'По умолчанию',
  	show: {
  		useClick: 'Показывать при клике',
  		useHover: 'Показывать при наведении'
  	}
  });
  var translate$5 = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

  function data$d() {
  	return {
  		balloon: '',
  		fields: [],
  		useClick: true,
  		useHover: true
  	};
  }
  var methods$8 = {
  	addField: function addField(index) {
  		var _get = this.get(),
  		    fields = _get.fields;

  		var value = fields[index];
  		this._editor.insertText('[' + value.trim() + ']');
  		var text = this._editor.getData();
  		this.set({ balloon: text });
  	},
  	setDefault: function setDefault() {
  		var _get2 = this.get(),
  		    fields = _get2.fields;

  		var value = fields.filter(function (f) {
  			return f !== '';
  		}).map(function (f) {
  			return '<span style="font-weight: bold">' + f + '</span>: [' + f + ']';
  		}).concat('<span style="font-weight: bold">[SUMMARY]</span>').join('<br/>\r\n');
  		this._editor.setData(value);
  		this.set({ balloon: value });
  	},
  	copy: function copy(e) {
  		e.stopPropagation();

  		var _refs$btnAttr$getBoun = this.refs.btnAttr.getBoundingClientRect(),
  		    top = _refs$btnAttr$getBoun.top,
  		    left = _refs$btnAttr$getBoun.left;

  		this.fire('copy', { top: top, left: left - 200 });
  	}
  };

  function oncreate$2() {
  	var _this = this;

  	this._editor = CKEDITOR.replace(this.refs.editor);

  	var _get3 = this.get(),
  	    balloon = _get3.balloon;

  	this._editor.setData(balloon);
  	this._editor.on('blur', function (_ref) {
  		var editor = _ref.editor;

  		var value = editor.getData();
  		_this.set({ balloon: value });
  	});
  }
  function create_main_fragment$d(component, ctx) {
  	var div2,
  	    table,
  	    tr0,
  	    td0,
  	    i0,
  	    text0,
  	    td1,
  	    text1_value = translate$5('show.useClick'),
  	    text1,
  	    text2,
  	    td2,
  	    i1,
  	    text3,
  	    tr1,
  	    td3,
  	    i2,
  	    text4,
  	    td4,
  	    text5_value = translate$5('show.useHover'),
  	    text5,
  	    text6,
  	    td5,
  	    text7,
  	    tr2,
  	    td6,
  	    div0,
  	    text8_value = translate$5('attribute'),
  	    text8,
  	    text9,
  	    div1,
  	    dropdown_updating = {},
  	    text10,
  	    tr3,
  	    td7,
  	    textarea,
  	    text11,
  	    tr4,
  	    td8,
  	    button,
  	    text12_value = translate$5('defaultValue'),
  	    text12;

  	function click_handler(event) {
  		component.copy(event);
  	}

  	function click_handler_1(event) {
  		component.set({ useClick: !ctx.useClick });
  	}

  	function click_handler_2(event) {
  		component.set({ useHover: !ctx.useHover });
  	}

  	var dropdown_initial_data = { selected: "0" };
  	if (ctx.fields !== void 0) {
  		dropdown_initial_data.items = ctx.fields;
  		dropdown_updating.items = true;
  	}
  	var dropdown = new scanexDropdown_cjs({
  		root: component.root,
  		store: component.store,
  		data: dropdown_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!dropdown_updating.items && changed.items) {
  				newState.fields = childState.items;
  			}
  			component._set(newState);
  			dropdown_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		dropdown._bind({ items: 1 }, dropdown.get());
  	});

  	dropdown.on("select", function (event) {
  		component.addField(event);
  	});

  	function click_handler_3(event) {
  		component.setDefault();
  	}

  	return {
  		c: function c() {
  			div2 = createElement("div");
  			table = createElement("table");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			i0 = createElement("i");
  			text0 = createText("\r\n            ");
  			td1 = createElement("td");
  			text1 = createText(text1_value);
  			text2 = createText("\r\n            ");
  			td2 = createElement("td");
  			i1 = createElement("i");
  			text3 = createText("\r\n        ");
  			tr1 = createElement("tr");
  			td3 = createElement("td");
  			i2 = createElement("i");
  			text4 = createText("\r\n            ");
  			td4 = createElement("td");
  			text5 = createText(text5_value);
  			text6 = createText("\r\n            ");
  			td5 = createElement("td");
  			text7 = createText("\r\n        ");
  			tr2 = createElement("tr");
  			td6 = createElement("td");
  			div0 = createElement("div");
  			text8 = createText(text8_value);
  			text9 = createText("\r\n                ");
  			div1 = createElement("div");
  			dropdown._fragment.c();
  			text10 = createText("\r\n        ");
  			tr3 = createElement("tr");
  			td7 = createElement("td");
  			textarea = createElement("textarea");
  			text11 = createText("\r\n        ");
  			tr4 = createElement("tr");
  			td8 = createElement("td");
  			button = createElement("button");
  			text12 = createText(text12_value);
  			toggleClass(i0, "selected", ctx.useClick);
  			td0.className = "icon";
  			td1.className = "label";
  			i1.className = "show-attr";
  			addListener(td2, "click", click_handler);
  			td2.className = "copy-attr";
  			addListener(tr0, "click", click_handler_1);
  			tr0.className = "use-click";
  			toggleClass(i2, "selected", ctx.useHover);
  			td3.className = "icon";
  			td4.className = "label";
  			addListener(tr1, "click", click_handler_2);
  			tr1.className = "use-hover";
  			div0.className = "label";
  			div1.className = "attr";
  			td6.colSpan = "3";
  			tr2.className = "add-attr";
  			td7.colSpan = "3";
  			addListener(button, "click", click_handler_3);
  			button.className = "default-balloon";
  			td8.colSpan = "3";
  			setAttribute(table, "cellpadding", "0");
  			setAttribute(table, "cellspacing", "0");
  			div2.className = "popup";
  		},
  		m: function m(target, anchor) {
  			insert(target, div2, anchor);
  			append(div2, table);
  			append(table, tr0);
  			append(tr0, td0);
  			append(td0, i0);
  			append(tr0, text0);
  			append(tr0, td1);
  			append(td1, text1);
  			append(tr0, text2);
  			append(tr0, td2);
  			append(td2, i1);
  			component.refs.btnAttr = i1;
  			append(table, text3);
  			append(table, tr1);
  			append(tr1, td3);
  			append(td3, i2);
  			append(tr1, text4);
  			append(tr1, td4);
  			append(td4, text5);
  			append(tr1, text6);
  			append(tr1, td5);
  			append(table, text7);
  			append(table, tr2);
  			append(tr2, td6);
  			append(td6, div0);
  			append(div0, text8);
  			append(td6, text9);
  			append(td6, div1);
  			dropdown._mount(div1, null);
  			append(table, text10);
  			append(table, tr3);
  			append(tr3, td7);
  			append(td7, textarea);
  			component.refs.editor = textarea;
  			append(table, text11);
  			append(table, tr4);
  			append(tr4, td8);
  			append(td8, button);
  			append(button, text12);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.useClick) {
  				toggleClass(i0, "selected", ctx.useClick);
  			}

  			if (changed.useHover) {
  				toggleClass(i2, "selected", ctx.useHover);
  			}

  			var dropdown_changes = {};
  			if (!dropdown_updating.items && changed.fields) {
  				dropdown_changes.items = ctx.fields;
  				dropdown_updating.items = ctx.fields !== void 0;
  			}
  			dropdown._set(dropdown_changes);
  			dropdown_updating = {};
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(div2);
  			}

  			if (component.refs.btnAttr === i1) component.refs.btnAttr = null;
  			removeListener(td2, "click", click_handler);
  			removeListener(tr0, "click", click_handler_1);
  			removeListener(tr1, "click", click_handler_2);
  			dropdown.destroy();
  			if (component.refs.editor === textarea) component.refs.editor = null;
  			removeListener(button, "click", click_handler_3);
  		}
  	};
  }

  function Popup(options) {
  	var _this2 = this;

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$d(), options.data);
  	this._intro = true;

  	this._fragment = create_main_fragment$d(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate$2.call(_this2);
  		_this2.fire("update", { changed: assignTrue({}, _this2._state), current: _this2._state });
  	});

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}
  }

  assign(Popup.prototype, proto);
  assign(Popup.prototype, methods$8);

  var _typeof$8 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function noop$7() {}

  function assign$7(tar, src) {
  	for (var k in src) {
  		tar[k] = src[k];
  	}return tar;
  }

  function assignTrue$5(tar, src) {
  	for (var k in src) {
  		tar[k] = 1;
  	}return tar;
  }

  function addLoc$7(element, file, line, column, char) {
  	element.__svelte_meta = {
  		loc: { file: file, line: line, column: column, char: char }
  	};
  }

  function run$7(fn) {
  	fn();
  }

  function insert$7(target, node, anchor) {
  	target.insertBefore(node, anchor);
  }

  function detachNode$7(node) {
  	node.parentNode.removeChild(node);
  }

  function createElement$7(name) {
  	return document.createElement(name);
  }

  function addListener$7(node, event, handler, options) {
  	node.addEventListener(event, handler, options);
  }

  function removeListener$7(node, event, handler, options) {
  	node.removeEventListener(event, handler, options);
  }

  function toggleClass$5(element, name, toggle) {
  	element.classList[toggle ? 'add' : 'remove'](name);
  }

  function blankObject$7() {
  	return Object.create(null);
  }

  function destroy$7(detach) {
  	this.destroy = noop$7;
  	this.fire('destroy');
  	this.set = noop$7;

  	this._fragment.d(detach !== false);
  	this._fragment = null;
  	this._state = {};
  }

  function destroyDev$7(detach) {
  	destroy$7.call(this, detach);
  	this.destroy = function () {
  		console.warn('Component was already destroyed');
  	};
  }

  function _differs$7(a, b) {
  	return a != a ? b == b : a !== b || a && (typeof a === 'undefined' ? 'undefined' : _typeof$8(a)) === 'object' || typeof a === 'function';
  }

  function fire$7(eventName, data) {
  	var handlers = eventName in this._handlers && this._handlers[eventName].slice();
  	if (!handlers) return;

  	for (var i = 0; i < handlers.length; i += 1) {
  		var handler = handlers[i];

  		if (!handler.__calling) {
  			try {
  				handler.__calling = true;
  				handler.call(this, data);
  			} finally {
  				handler.__calling = false;
  			}
  		}
  	}
  }

  function flush$7(component) {
  	component._lock = true;
  	callAll$7(component._beforecreate);
  	callAll$7(component._oncreate);
  	callAll$7(component._aftercreate);
  	component._lock = false;
  }

  function get$1$7() {
  	return this._state;
  }

  function init$7(component, options) {
  	component._handlers = blankObject$7();
  	component._slots = blankObject$7();
  	component._bind = options._bind;
  	component._staged = {};

  	component.options = options;
  	component.root = options.root || component;
  	component.store = options.store || component.root.store;

  	if (!options.root) {
  		component._beforecreate = [];
  		component._oncreate = [];
  		component._aftercreate = [];
  	}
  }

  function on$7(eventName, handler) {
  	var handlers = this._handlers[eventName] || (this._handlers[eventName] = []);
  	handlers.push(handler);

  	return {
  		cancel: function cancel() {
  			var index = handlers.indexOf(handler);
  			if (~index) handlers.splice(index, 1);
  		}
  	};
  }

  function set$1$7(newState) {
  	this._set(assign$7({}, newState));
  	if (this.root._lock) return;
  	flush$7(this.root);
  }

  function _set$7(newState) {
  	var oldState = this._state,
  	    changed = {},
  	    dirty = false;

  	newState = assign$7(this._staged, newState);
  	this._staged = {};

  	for (var key in newState) {
  		if (this._differs(newState[key], oldState[key])) changed[key] = dirty = true;
  	}
  	if (!dirty) return;

  	this._state = assign$7(assign$7({}, oldState), newState);
  	this._recompute(changed, this._state);
  	if (this._bind) this._bind(changed, this._state);

  	if (this._fragment) {
  		this.fire("state", { changed: changed, current: this._state, previous: oldState });
  		this._fragment.p(changed, this._state);
  		this.fire("update", { changed: changed, current: this._state, previous: oldState });
  	}
  }

  function _stage$7(newState) {
  	assign$7(this._staged, newState);
  }

  function setDev$7(newState) {
  	if ((typeof newState === 'undefined' ? 'undefined' : _typeof$8(newState)) !== 'object') {
  		throw new Error(this._debugName + '.set was called without an object of data key-values to update.');
  	}

  	this._checkReadOnly(newState);
  	set$1$7.call(this, newState);
  }

  function callAll$7(fns) {
  	while (fns && fns.length) {
  		fns.shift()();
  	}
  }

  function _mount$7(target, anchor) {
  	this._fragment[this._fragment.i ? 'i' : 'm'](target, anchor || null);
  }

  var protoDev$7 = {
  	destroy: destroyDev$7,
  	get: get$1$7,
  	fire: fire$7,
  	on: on$7,
  	set: setDev$7,
  	_recompute: noop$7,
  	_set: _set$7,
  	_stage: _stage$7,
  	_mount: _mount$7,
  	_differs: _differs$7
  };

  /* src\Tristate.html generated by Svelte v2.16.1 */

  function included(_ref) {
  	var items = _ref.items,
  	    exclude$$1 = _ref.exclude;

  	return items.filter(function (_ref2, i) {
  		var checked = _ref2.checked;
  		return exclude$$1.indexOf(i) === -1;
  	});
  }

  function data$e() {
  	return {
  		items: [],
  		exclude: [],
  		state: 0
  	};
  }
  var methods$9 = {
  	toggle: function toggle(e) {
  		e.stopPropagation();

  		var _get = this.get(),
  		    state = _get.state,
  		    included = _get.included,
  		    items = _get.items;

  		switch (state) {
  			case 0:
  			case 2:
  				included.forEach(function (item) {
  					item.checked = true;
  				});
  				this.set({ items: items });
  				break;
  			case 1:
  				included.forEach(function (item) {
  					item.checked = false;
  				});
  				this.set({ items: items });
  				break;
  			default:
  				break;
  		}
  	}
  };

  function onupdate$7(_ref3) {
  	var changed = _ref3.changed,
  	    current = _ref3.current;

  	if (changed.included) {
  		if (current.included.every(function (_ref4) {
  			var checked = _ref4.checked;
  			return checked;
  		})) {
  			this.set({ state: 1 });
  		} else if (current.included.every(function (_ref5) {
  			var checked = _ref5.checked;
  			return !checked;
  		})) {
  			this.set({ state: 0 });
  		} else {
  			this.set({ state: 2 });
  		}
  	}
  }
  var file$6 = "src\\Tristate.html";

  function create_main_fragment$e(component, ctx) {
  	var i, current;

  	function click_handler(event) {
  		component.toggle(event);
  	}

  	return {
  		c: function create() {
  			i = createElement$7("i");
  			addListener$7(i, "click", click_handler);
  			i.className = "scanex-tristate";
  			toggleClass$5(i, "selected", ctx.state === 1);
  			toggleClass$5(i, "unselected", ctx.state === 0);
  			toggleClass$5(i, "indeterminate", ctx.state === 2);
  			addLoc$7(i, file$6, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert$7(target, i, anchor);
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (changed.state) {
  				toggleClass$5(i, "selected", ctx.state === 1);
  				toggleClass$5(i, "unselected", ctx.state === 0);
  				toggleClass$5(i, "indeterminate", ctx.state === 2);
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run$7,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode$7(i);
  			}

  			removeListener$7(i, "click", click_handler);
  		}
  	};
  }

  function Tristate(options) {
  	var _this = this;

  	this._debugName = '<Tristate>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init$7(this, options);
  	this._state = assign$7(data$e(), options.data);

  	this._recompute({ items: 1, exclude: 1 }, this._state);
  	if (!('items' in this._state)) console.warn("<Tristate> was created without expected data property 'items'");
  	if (!('exclude' in this._state)) console.warn("<Tristate> was created without expected data property 'exclude'");
  	if (!('state' in this._state)) console.warn("<Tristate> was created without expected data property 'state'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$7];

  	this._fragment = create_main_fragment$e(this, this._state);

  	this.root._oncreate.push(function () {
  		_this.fire("update", { changed: assignTrue$5({}, _this._state), current: _this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush$7(this);
  	}

  	this._intro = true;
  }

  assign$7(Tristate.prototype, protoDev$7);
  assign$7(Tristate.prototype, methods$9);

  Tristate.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('included' in newState && !this._updatingReadonlyProperty) throw new Error("<Tristate>: Cannot set read-only property 'included'");
  };

  Tristate.prototype._recompute = function _recompute(changed, state) {
  	if (changed.items || changed.exclude) {
  		if (this._differs(state.included, state.included = included(state))) changed.included = true;
  	}
  };

  var scanexTristate_cjs = Tristate;

  /* src\Attributes\Attributes.html generated by Svelte v2.16.1 */

  scanexTranslations_cjs.addText('eng', {
  	legend: 'Legend',
  	outline: 'Outline',
  	zoom: 'Zoom'
  });

  scanexTranslations_cjs.addText('rus', {
  	legend: 'Подпись',
  	outline: 'Обводка',
  	zoom: 'Уровни зума'
  });

  var translate$6 = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

  var ZOOM_OPTIONS = {
  	name: translate$6('zoom'),
  	options: ['minZoom', 'maxZoom'],
  	checked: false
  };
  var OUTLINE_OPTIONS = {
  	name: translate$6('outline'),
  	options: ['decorationOutline', 'decorationOutlineAlpha', 'decorationOutlineSize', 'decorationOutlineType'],
  	checked: false
  };
  var LEGEND_OPTIONS = {
  	name: translate$6('legend'),
  	options: ['legendField', 'legendFill', 'legendFontSize', 'legendOffsetX', 'legendOffsetY', 'legendOutline', 'legendOutlineSize', 'legendMinZoom', 'legendMaxZoom'],
  	checked: false
  };
  var FILL_OPTIONS = [ZOOM_OPTIONS, OUTLINE_OPTIONS, LEGEND_OPTIONS];
  var PATTERN_OPTIONS = [ZOOM_OPTIONS, LEGEND_OPTIONS];
  var MARKER_OPTIONS = [{
  	name: translate$6('angle'),
  	options: ['markerAngle'],
  	checked: false
  }];
  var OPTIONS = {
  	polygon: [FILL_OPTIONS, PATTERN_OPTIONS, MARKER_OPTIONS],
  	linestring: [FILL_OPTIONS],
  	point: [FILL_OPTIONS, MARKER_OPTIONS]
  };

  function enabled(_ref) {
  	var inStyles = _ref.inStyles;

  	return inStyles.some(function (x) {
  		return x.checked;
  	});
  }

  function exclude$1(_ref2) {
  	var source = _ref2.source;

  	return [source];
  }

  function options(_ref3) {
  	var fillStyle = _ref3.fillStyle,
  	    geometryType = _ref3.geometryType;

  	return OPTIONS[geometryType][fillStyle];
  }

  function data$f() {
  	return {
  		inOptions: [],
  		inStyles: [],
  		fillStyle: 0,
  		lower: '',
  		source: 0,
  		styles: [],
  		geometryType: 'polygon',
  		upper: '',
  		useOptions: true
  	};
  }
  var methods$a = {
  	apply: function apply(e) {
  		e.stopPropagation();

  		var _get = this.get(),
  		    enabled = _get.enabled;

  		if (enabled) {
  			var _get2 = this.get(),
  			    styles = _get2.styles,
  			    source = _get2.source,
  			    _options = _get2.options;

  			var stylesToChange = styles.reduce(function (a, _ref4, i) {
  				var checked = _ref4.checked;
  				return checked ? a.concat(i) : a;
  			}, []);
  			var optionsToChange = _options.reduce(function (a, _ref5, i) {
  				var checked = _ref5.checked;
  				return checked ? a.concat(_options[i]) : a;
  			}, []);
  			this.fire('apply', { source: source, target: stylesToChange, options: optionsToChange });
  		}
  	},
  	cancel: function cancel(e) {
  		e.stopPropagation();
  		this.fire('cancel');
  	},
  	toggleStyle: function toggleStyle(e, i) {
  		e.stopPropagation();

  		var _get3 = this.get(),
  		    styles = _get3.styles;

  		styles[i].checked = !styles[i].checked;
  		this.set({ styles: styles });
  	},
  	toggleOption: function toggleOption(e, i) {
  		e.stopPropagation();

  		var _get4 = this.get(),
  		    options = _get4.options;

  		options[i].checked = !options[i].checked;
  		this.set({ options: options });
  	}
  };

  function click_handler_1$1(event) {
  	var _svelte = this._svelte,
  	    component = _svelte.component,
  	    ctx = _svelte.ctx;


  	component.toggleStyle(event, ctx.i);
  }

  function get_each_context_1(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.s = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function click_handler$3(event) {
  	var _svelte2 = this._svelte,
  	    component = _svelte2.component,
  	    ctx = _svelte2.ctx;


  	component.toggleOption(event, ctx.i);
  }

  function get_each_context$4(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.opt = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function create_main_fragment$f(component, ctx) {
  	var div5,
  	    text0,
  	    div3,
  	    div1,
  	    tristate_updating = {},
  	    text1,
  	    div0,
  	    text2,
  	    text3,
  	    div2,
  	    table,
  	    text4,
  	    div4,
  	    button0,
  	    text5_value = translate$6('apply'),
  	    text5,
  	    text6,
  	    button1,
  	    text7_value = translate$6('cancel'),
  	    text7;

  	function onwindowclick(event) {
  		component.cancel(event);	}
  	window.addEventListener("click", onwindowclick);

  	var if_block = ctx.useOptions && create_if_block_1$1(component, ctx);

  	var tristate_initial_data = {};
  	if (ctx.styles !== void 0) {
  		tristate_initial_data.items = ctx.styles;
  		tristate_updating.items = true;
  	}
  	if (ctx.exclude !== void 0) {
  		tristate_initial_data.exclude = ctx.exclude;
  		tristate_updating.exclude = true;
  	}
  	if (ctx.inStyles !== void 0) {
  		tristate_initial_data.included = ctx.inStyles;
  		tristate_updating.included = true;
  	}
  	var tristate = new scanexTristate_cjs({
  		root: component.root,
  		store: component.store,
  		data: tristate_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!tristate_updating.items && changed.items) {
  				newState.styles = childState.items;
  			}

  			if (!tristate_updating.exclude && changed.exclude) {
  				newState.exclude = childState.exclude;
  			}

  			if (!tristate_updating.included && changed.included) {
  				newState.inStyles = childState.included;
  			}
  			component._set(newState);
  			tristate_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		tristate._bind({ items: 1, exclude: 1, included: 1 }, tristate.get());
  	});

  	var each_value_1 = ctx.styles;

  	var each_blocks = [];

  	for (var i = 0; i < each_value_1.length; i += 1) {
  		each_blocks[i] = create_each_block$4(component, get_each_context_1(ctx, each_value_1, i));
  	}

  	function click_handler_2(event) {
  		component.apply(event);
  	}

  	function click_handler_3(event) {
  		component.cancel(event);
  	}

  	return {
  		c: function c() {
  			div5 = createElement("div");
  			if (if_block) if_block.c();
  			text0 = createText("\r\n    ");
  			div3 = createElement("div");
  			div1 = createElement("div");
  			tristate._fragment.c();
  			text1 = createText("\r\n            ");
  			div0 = createElement("div");
  			text2 = createText(ctx.lower);
  			text3 = createText("\r\n        ");
  			div2 = createElement("div");
  			table = createElement("table");

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			text4 = createText("    \r\n    ");
  			div4 = createElement("div");
  			button0 = createElement("button");
  			text5 = createText(text5_value);
  			text6 = createText("\r\n        ");
  			button1 = createElement("button");
  			text7 = createText(text7_value);
  			div0.className = "title";
  			div1.className = "tristate";
  			div2.className = "content";
  			div3.className = "lower";
  			addListener(button0, "click", click_handler_2);
  			button0.className = "apply";
  			toggleClass(button0, "disabled", !ctx.enabled);
  			addListener(button1, "click", click_handler_3);
  			button1.className = "cancel";
  			div4.className = "footer";
  			div5.className = "attributes";
  		},
  		m: function m(target, anchor) {
  			insert(target, div5, anchor);
  			if (if_block) if_block.m(div5, null);
  			append(div5, text0);
  			append(div5, div3);
  			append(div3, div1);
  			tristate._mount(div1, null);
  			append(div1, text1);
  			append(div1, div0);
  			append(div0, text2);
  			append(div3, text3);
  			append(div3, div2);
  			append(div2, table);

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(table, null);
  			}

  			append(div5, text4);
  			append(div5, div4);
  			append(div4, button0);
  			append(button0, text5);
  			append(div4, text6);
  			append(div4, button1);
  			append(button1, text7);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (ctx.useOptions) {
  				if (if_block) {
  					if_block.p(changed, ctx);
  				} else {
  					if_block = create_if_block_1$1(component, ctx);
  					if_block.c();
  					if_block.m(div5, text0);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}

  			var tristate_changes = {};
  			if (!tristate_updating.items && changed.styles) {
  				tristate_changes.items = ctx.styles;
  				tristate_updating.items = ctx.styles !== void 0;
  			}
  			if (!tristate_updating.exclude && changed.exclude) {
  				tristate_changes.exclude = ctx.exclude;
  				tristate_updating.exclude = ctx.exclude !== void 0;
  			}
  			if (!tristate_updating.included && changed.inStyles) {
  				tristate_changes.included = ctx.inStyles;
  				tristate_updating.included = ctx.inStyles !== void 0;
  			}
  			tristate._set(tristate_changes);
  			tristate_updating = {};

  			if (changed.lower) {
  				setData(text2, ctx.lower);
  			}

  			if (changed.source || changed.styles) {
  				each_value_1 = ctx.styles;

  				for (var i = 0; i < each_value_1.length; i += 1) {
  					var child_ctx = get_each_context_1(ctx, each_value_1, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(changed, child_ctx);
  					} else {
  						each_blocks[i] = create_each_block$4(component, child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(table, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}
  				each_blocks.length = each_value_1.length;
  			}

  			if (changed.enabled) {
  				toggleClass(button0, "disabled", !ctx.enabled);
  			}
  		},
  		d: function d(detach) {
  			window.removeEventListener("click", onwindowclick);

  			if (detach) {
  				detachNode(div5);
  			}

  			if (if_block) if_block.d();
  			tristate.destroy();

  			destroyEach(each_blocks, detach);

  			removeListener(button0, "click", click_handler_2);
  			removeListener(button1, "click", click_handler_3);
  		}
  	};
  }

  // (3:4) {#if useOptions}
  function create_if_block_1$1(component, ctx) {
  	var div3,
  	    div1,
  	    tristate_updating = {},
  	    text0,
  	    div0,
  	    text1,
  	    text2,
  	    div2,
  	    table;

  	var tristate_initial_data = {};
  	if (ctx.options !== void 0) {
  		tristate_initial_data.items = ctx.options;
  		tristate_updating.items = true;
  	}
  	if (ctx.inOptions !== void 0) {
  		tristate_initial_data.included = ctx.inOptions;
  		tristate_updating.included = true;
  	}
  	var tristate = new scanexTristate_cjs({
  		root: component.root,
  		store: component.store,
  		data: tristate_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!tristate_updating.items && changed.items) {
  				newState.options = childState.items;
  			}

  			if (!tristate_updating.included && changed.included) {
  				newState.inOptions = childState.included;
  			}
  			component._set(newState);
  			tristate_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		tristate._bind({ items: 1, included: 1 }, tristate.get());
  	});

  	var each_value = ctx.options;

  	var each_blocks = [];

  	for (var i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block_1(component, get_each_context$4(ctx, each_value, i));
  	}

  	return {
  		c: function c() {
  			div3 = createElement("div");
  			div1 = createElement("div");
  			tristate._fragment.c();
  			text0 = createText("\r\n            ");
  			div0 = createElement("div");
  			text1 = createText(ctx.upper);
  			text2 = createText("\r\n        ");
  			div2 = createElement("div");
  			table = createElement("table");

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}
  			div0.className = "title";
  			div1.className = "tristate";
  			div2.className = "content";
  			div3.className = "upper";
  		},
  		m: function m(target, anchor) {
  			insert(target, div3, anchor);
  			append(div3, div1);
  			tristate._mount(div1, null);
  			append(div1, text0);
  			append(div1, div0);
  			append(div0, text1);
  			append(div3, text2);
  			append(div3, div2);
  			append(div2, table);

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(table, null);
  			}
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			var tristate_changes = {};
  			if (!tristate_updating.items && changed.options) {
  				tristate_changes.items = ctx.options;
  				tristate_updating.items = ctx.options !== void 0;
  			}
  			if (!tristate_updating.included && changed.inOptions) {
  				tristate_changes.included = ctx.inOptions;
  				tristate_updating.included = ctx.inOptions !== void 0;
  			}
  			tristate._set(tristate_changes);
  			tristate_updating = {};

  			if (changed.upper) {
  				setData(text1, ctx.upper);
  			}

  			if (changed.options) {
  				each_value = ctx.options;

  				for (var i = 0; i < each_value.length; i += 1) {
  					var child_ctx = get_each_context$4(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(changed, child_ctx);
  					} else {
  						each_blocks[i] = create_each_block_1(component, child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(table, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}
  				each_blocks.length = each_value.length;
  			}
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(div3);
  			}

  			tristate.destroy();

  			destroyEach(each_blocks, detach);
  		}
  	};
  }

  // (11:16) {#each options as opt, i}
  function create_each_block_1(component, ctx) {
  	var tr,
  	    td0,
  	    i_1,
  	    text0,
  	    td1,
  	    div,
  	    text1_value = ctx.opt.name,
  	    text1;

  	return {
  		c: function c() {
  			tr = createElement("tr");
  			td0 = createElement("td");
  			i_1 = createElement("i");
  			text0 = createText("\r\n                    ");
  			td1 = createElement("td");
  			div = createElement("div");
  			text1 = createText(text1_value);
  			toggleClass(i_1, "selected", ctx.options[ctx.i].checked);
  			toggleClass(i_1, "unselected", !ctx.options[ctx.i].checked);
  			div.className = "cell";

  			tr._svelte = { component: component, ctx: ctx };

  			addListener(tr, "click", click_handler$3);
  		},
  		m: function m(target, anchor) {
  			insert(target, tr, anchor);
  			append(tr, td0);
  			append(td0, i_1);
  			append(tr, text0);
  			append(tr, td1);
  			append(td1, div);
  			append(div, text1);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.options) {
  				toggleClass(i_1, "selected", ctx.options[ctx.i].checked);
  				toggleClass(i_1, "unselected", !ctx.options[ctx.i].checked);
  			}

  			if (changed.options && text1_value !== (text1_value = ctx.opt.name)) {
  				setData(text1, text1_value);
  			}

  			tr._svelte.ctx = ctx;
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(tr);
  			}

  			removeListener(tr, "click", click_handler$3);
  		}
  	};
  }

  // (33:16) {#if i != source}
  function create_if_block$5(component, ctx) {
  	var tr,
  	    td0,
  	    i,
  	    text0,
  	    td1,
  	    div,
  	    text1_value = ctx.s.name,
  	    text1;

  	return {
  		c: function c() {
  			tr = createElement("tr");
  			td0 = createElement("td");
  			i = createElement("i");
  			text0 = createText("\r\n                    ");
  			td1 = createElement("td");
  			div = createElement("div");
  			text1 = createText(text1_value);
  			toggleClass(i, "selected", !!ctx.styles[ctx.i].checked);
  			toggleClass(i, "unselected", !ctx.styles[ctx.i].checked);
  			div.className = "cell";

  			tr._svelte = { component: component, ctx: ctx };

  			addListener(tr, "click", click_handler_1$1);
  		},
  		m: function m(target, anchor) {
  			insert(target, tr, anchor);
  			append(tr, td0);
  			append(td0, i);
  			append(tr, text0);
  			append(tr, td1);
  			append(td1, div);
  			append(div, text1);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.styles) {
  				toggleClass(i, "selected", !!ctx.styles[ctx.i].checked);
  				toggleClass(i, "unselected", !ctx.styles[ctx.i].checked);
  			}

  			if (changed.styles && text1_value !== (text1_value = ctx.s.name)) {
  				setData(text1, text1_value);
  			}

  			tr._svelte.ctx = ctx;
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(tr);
  			}

  			removeListener(tr, "click", click_handler_1$1);
  		}
  	};
  }

  // (32:16) {#each styles as s, i}
  function create_each_block$4(component, ctx) {
  	var if_block_anchor;

  	var if_block = ctx.i != ctx.source && create_if_block$5(component, ctx);

  	return {
  		c: function c() {
  			if (if_block) if_block.c();
  			if_block_anchor = createComment();
  		},
  		m: function m(target, anchor) {
  			if (if_block) if_block.m(target, anchor);
  			insert(target, if_block_anchor, anchor);
  		},
  		p: function p(changed, ctx) {
  			if (ctx.i != ctx.source) {
  				if (if_block) {
  					if_block.p(changed, ctx);
  				} else {
  					if_block = create_if_block$5(component, ctx);
  					if_block.c();
  					if_block.m(if_block_anchor.parentNode, if_block_anchor);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}
  		},
  		d: function d(detach) {
  			if (if_block) if_block.d(detach);
  			if (detach) {
  				detachNode(if_block_anchor);
  			}
  		}
  	};
  }

  function Attributes(options) {
  	init(this, options);
  	this._state = assign(data$f(), options.data);

  	this._recompute({ inStyles: 1, source: 1, fillStyle: 1, geometryType: 1 }, this._state);
  	this._intro = true;

  	this._fragment = create_main_fragment$f(this, this._state);

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}
  }

  assign(Attributes.prototype, proto);
  assign(Attributes.prototype, methods$a);

  Attributes.prototype._recompute = function _recompute(changed, state) {
  	if (changed.inStyles) {
  		if (this._differs(state.enabled, state.enabled = enabled(state))) changed.enabled = true;
  	}

  	if (changed.source) {
  		if (this._differs(state.exclude, state.exclude = exclude$1(state))) changed.exclude = true;
  	}

  	if (changed.fillStyle || changed.geometryType) {
  		if (this._differs(state.options, state.options = options(state))) changed.options = true;
  	}
  };

  /* src\Editor\Editor.html generated by Svelte v2.16.1 */

  scanexTranslations_cjs.addText('eng', {
  	copy: 'Copy of',
  	layout: 'Layout',
  	filter: 'Filter',
  	legend: 'Legend',
  	outline: 'Outline',
  	popup: 'Popup',
  	options: 'Options',
  	styles: {
  		apply: 'Apply to styles'
  	},
  	zoom: 'Zoom'
  });

  scanexTranslations_cjs.addText('rus', {
  	copy: 'Копия',
  	layout: 'Визуализация',
  	filter: 'Фильтр',
  	legend: 'Подпись',
  	outline: 'Обводка',
  	popup: 'Подсказка',
  	options: 'Параметры',
  	styles: {
  		apply: 'Применить к стилям'
  	},
  	zoom: 'Уровни зума'
  });

  var translate$7 = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

  function allowCopy(_ref) {
  	var styles = _ref.styles;

  	return styles.length > 1;
  }

  function balloon(_ref2) {
  	var styles = _ref2.styles,
  	    selected = _ref2.selected;

  	return styles[selected].balloon;
  }

  function dashes(_ref3) {
  	var styles = _ref3.styles,
  	    selected = _ref3.selected;

  	return styles[selected].dashes;
  }

  function decorationFill(_ref4) {
  	var styles = _ref4.styles,
  	    selected = _ref4.selected;

  	return styles[selected].decorationFill;
  }

  function decorationFillAlpha(_ref5) {
  	var styles = _ref5.styles,
  	    selected = _ref5.selected;

  	return styles[selected].decorationFillAlpha;
  }

  function decorationOutline(_ref6) {
  	var styles = _ref6.styles,
  	    selected = _ref6.selected;

  	return styles[selected].decorationOutline;
  }

  function decorationOutlineAlpha(_ref7) {
  	var styles = _ref7.styles,
  	    selected = _ref7.selected;

  	return styles[selected].decorationOutlineAlpha;
  }

  function decorationOutlineSize(_ref8) {
  	var styles = _ref8.styles,
  	    selected = _ref8.selected;

  	return styles[selected].decorationOutlineSize;
  }

  function decorationOutlineType(_ref9) {
  	var styles = _ref9.styles,
  	    selected = _ref9.selected;

  	return styles[selected].decorationOutlineType;
  }

  function filter(_ref10) {
  	var styles = _ref10.styles,
  	    selected = _ref10.selected;

  	return styles[selected].filter;
  }

  function fillStyle(_ref11) {
  	var styles = _ref11.styles,
  	    selected = _ref11.selected;

  	return styles[selected].fillStyle;
  }

  function legendField(_ref12) {
  	var styles = _ref12.styles,
  	    selected = _ref12.selected;

  	return styles[selected].legendField;
  }

  function legendFill(_ref13) {
  	var styles = _ref13.styles,
  	    selected = _ref13.selected;

  	return styles[selected].legendFill;
  }

  function legendFont(_ref14) {
  	var styles = _ref14.styles,
  	    selected = _ref14.selected;

  	return styles[selected].legendFont;
  }

  function legendFontSize(_ref15) {
  	var styles = _ref15.styles,
  	    selected = _ref15.selected;

  	return styles[selected].legendFontSize;
  }

  function legendFontStyle(_ref16) {
  	var styles = _ref16.styles,
  	    selected = _ref16.selected;

  	return styles[selected].legendFontStyle;
  }

  function legendFontStyles(_ref17) {
  	var styles = _ref17.styles,
  	    selected = _ref17.selected;

  	return styles[selected].legendFontStyles;
  }

  function legendOffsetX(_ref18) {
  	var styles = _ref18.styles,
  	    selected = _ref18.selected;

  	return styles[selected].legendOffsetX;
  }

  function legendOffsetY(_ref19) {
  	var styles = _ref19.styles,
  	    selected = _ref19.selected;

  	return styles[selected].legendOffsetY;
  }

  function legendOutline(_ref20) {
  	var styles = _ref20.styles,
  	    selected = _ref20.selected;

  	return styles[selected].legendOutline;
  }

  function legendOutlineSize(_ref21) {
  	var styles = _ref21.styles,
  	    selected = _ref21.selected;

  	return styles[selected].legendOutlineSize;
  }

  function legendMinZoom(_ref22) {
  	var styles = _ref22.styles,
  	    selected = _ref22.selected;

  	return styles[selected].legendMinZoom;
  }

  function legendMaxZoom(_ref23) {
  	var styles = _ref23.styles,
  	    selected = _ref23.selected;

  	return styles[selected].legendMaxZoom;
  }

  function markerAngle(_ref24) {
  	var styles = _ref24.styles,
  	    selected = _ref24.selected;

  	return styles[selected].markerAngle;
  }

  function markerScale(_ref25) {
  	var styles = _ref25.styles,
  	    selected = _ref25.selected;

  	return styles[selected].markerScale;
  }

  function markerMaxScale(_ref26) {
  	var styles = _ref26.styles,
  	    selected = _ref26.selected;

  	return styles[selected].markerMaxScale;
  }

  function markerMinScale(_ref27) {
  	var styles = _ref27.styles,
  	    selected = _ref27.selected;

  	return styles[selected].markerMinScale;
  }

  function markerSize(_ref28) {
  	var styles = _ref28.styles,
  	    selected = _ref28.selected;

  	return styles[selected].markerSize;
  }

  function markerUrl(_ref29) {
  	var styles = _ref29.styles,
  	    selected = _ref29.selected;

  	return styles[selected].markerUrl;
  }

  function maxZoom(_ref30) {
  	var styles = _ref30.styles,
  	    selected = _ref30.selected;

  	return styles[selected].maxZoom;
  }

  function minZoom(_ref31) {
  	var styles = _ref31.styles,
  	    selected = _ref31.selected;

  	return styles[selected].minZoom;
  }

  function patternColors(_ref32) {
  	var styles = _ref32.styles,
  	    selected = _ref32.selected;

  	return styles[selected].patternColors;
  }

  function patternOffset(_ref33) {
  	var styles = _ref33.styles,
  	    selected = _ref33.selected;

  	return styles[selected].patternOffset;
  }

  function patternStyle(_ref34) {
  	var styles = _ref34.styles,
  	    selected = _ref34.selected;

  	return styles[selected].patternStyle;
  }

  function patternStyleIndex(_ref35) {
  	var styles = _ref35.styles,
  	    selected = _ref35.selected;

  	return styles[selected].patternStyleIndex;
  }

  function patternWidth(_ref36) {
  	var styles = _ref36.styles,
  	    selected = _ref36.selected;

  	return styles[selected].patternWidth;
  }

  function useClick(_ref37) {
  	var styles = _ref37.styles,
  	    selected = _ref37.selected;

  	return styles[selected].useClick;
  }

  function useDecorationFill(_ref38) {
  	var styles = _ref38.styles,
  	    selected = _ref38.selected;

  	return styles[selected].useDecorationFill;
  }

  function useHover(_ref39) {
  	var styles = _ref39.styles,
  	    selected = _ref39.selected;

  	return styles[selected].useHover;
  }

  function useLegendOutline(_ref40) {
  	var styles = _ref40.styles,
  	    selected = _ref40.selected;

  	return styles[selected].useLegendOutline;
  }

  function data$g() {
  	return {
  		balloon: '',
  		fonts: [],
  		geometryType: 'polygon',
  		legendFields: [],
  		styles: [],
  		selected: 0,
  		title: ''
  	};
  }
  var methods$b = {
  	adjustScroll: function adjustScroll(e) {
  		var total = document.body.getBoundingClientRect().height;
  		var h1 = document.getElementById('header').getBoundingClientRect().height;
  		var h2 = this.refs.container.querySelector('.head').getBoundingClientRect().height;
  		var h3 = this.refs.container.querySelector('.preview').getBoundingClientRect().height;
  		var h4 = this.refs.container.querySelector('.tabs-widget > .tabs').getBoundingClientRect().height;

  		var p = this.refs.container.querySelector('.tabs-widget > .panels');
  		p.style.maxHeight = total - (h1 + h2 + h3 + h4) + 'px';
  	},
  	adjustDialog: function adjustDialog(_ref41) {
  		var top = _ref41.top,
  		    left = _ref41.left;

  		this.refs.dlgAttr.style.left = left + 'px';
  		this.refs.dlgAttr.style.top = top - 10 + 'px';
  	},
  	checkDialog: function checkDialog(e) {
  		if (this._dlgAttr) {
  			e.preventDefault();
  		}
  	},
  	addStyle: function addStyle() {
  		var _get = this.get(),
  		    styles = _get.styles;

  		var style = _extends({}, DEFAULT_STYLE);
  		style.name = translate$7('style.new') + ' ' + (styles.length + 1);
  		styles.push(style);
  		this.set({ styles: styles, selected: styles.length - 1 });
  	},
  	createGroup: function createGroup() {
  		this.fire('coloring');
  	},
  	copyStyle: function copyStyle(i) {
  		var _get2 = this.get(),
  		    styles = _get2.styles;

  		var style = _extends({}, styles[i], { name: translate$7('copy') + ' ' + styles[i].name });
  		styles.push(style);
  		this.set({ styles: styles });
  	},
  	removeStyle: function removeStyle(i) {
  		var _get3 = this.get(),
  		    styles = _get3.styles,
  		    selected = _get3.selected;

  		if (styles.length > 1) {
  			styles.splice(i, 1);
  			this.set({ styles: styles, selected: selected === i ? 0 : selected });
  		}
  	},
  	renameStyle: function renameStyle(_ref42) {
  		var index = _ref42.index,
  		    name = _ref42.name;

  		var _get4 = this.get(),
  		    styles = _get4.styles;

  		styles[index].name = name;
  		this.set({ styles: styles });
  	},
  	copyOptions: function copyOptions(e) {
  		var _this = this;

  		e.stopPropagation();

  		var _refs$btnAttr$getBoun = this.refs.btnAttr.getBoundingClientRect(),
  		    top = _refs$btnAttr$getBoun.top,
  		    left = _refs$btnAttr$getBoun.left;

  		this.showAttributes({ top: top, left: left - 180 }).then(function (_ref43) {
  			var source = _ref43.source,
  			    options = _ref43.options,
  			    target = _ref43.target;

  			var _get5 = _this.get(),
  			    styles = _get5.styles;

  			var s = options.reduce(function (a, _ref44) {
  				var options = _ref44.options;

  				return options.reduce(function (b, k) {
  					b[k] = styles[source][k];
  					return b;
  				}, a);
  			}, {});
  			target.forEach(function (i) {
  				styles[i] = _extends({}, styles[i], s);
  			});
  			_this.set({ styles: styles });
  		}).catch(function () {});
  	},
  	copyPopup: function copyPopup(_ref45) {
  		var _this2 = this;

  		var top = _ref45.top,
  		    left = _ref45.left;

  		this.showAttributes({ top: top, left: left }, false).then(function (_ref46) {
  			var source = _ref46.source,
  			    options = _ref46.options,
  			    target = _ref46.target;

  			var _get6 = _this2.get(),
  			    styles = _get6.styles;

  			var balloon = styles[source].balloon;

  			target.forEach(function (i) {
  				styles[i] = _extends({}, styles[i], { balloon: balloon });
  			});
  			_this2.set({ styles: styles });
  		}).catch(function () {});
  	},
  	showAttributes: function showAttributes(_ref47) {
  		var _this3 = this;

  		var top = _ref47.top,
  		    left = _ref47.left;
  		var useOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

  		return new Promise(function (resolve, reject) {
  			if (!_this3._dlgAttr) {
  				var _get7 = _this3.get(),
  				    selected = _get7.selected,
  				    styles = _get7.styles,
  				    geometryType = _get7.geometryType,
  				    _fillStyle = _get7.fillStyle;

  				styles.forEach(function (x) {
  					return x.checked = false;
  				});
  				_this3.refs.dlgAttr.style.display = 'block';
  				_this3.adjustDialog({ top: top, left: left });
  				_this3._dlgAttr = new Attributes({
  					target: _this3.refs.dlgAttr,
  					data: {
  						source: selected,
  						styles: styles,
  						upper: translate$7('options'),
  						lower: translate$7('styles.apply'),
  						geometryType: geometryType,
  						fillStyle: _fillStyle,
  						useOptions: useOptions
  					}
  				});
  				_this3._dlgAttr.on('cancel', function () {
  					_this3._dlgAttr.destroy();
  					_this3._dlgAttr = null;
  					_this3.refs.dlgAttr.style.display = 'none';
  					reject();
  				});
  				_this3._dlgAttr.on('apply', function (e) {
  					_this3._dlgAttr.destroy();
  					_this3._dlgAttr = null;
  					_this3.refs.dlgAttr.style.display = 'none';
  					resolve(e);
  				});
  			} else {
  				reject();
  			}
  		});
  	}
  };

  function oncreate$3() {
  	this.adjustScroll();
  }
  function ondestroy() {
  	var parent = this.refs.container.parentElement;
  	parent.removeChild(this.refs.container);
  }
  function onupdate$8(_ref48) {
  	var changed = _ref48.changed,
  	    current = _ref48.current;

  	if (changed.filter) {
  		var _filter = this.refs.tabs.refs.tabs.querySelector('.tab.filter span');
  		if (_filter) {
  			if (current.filter.trim() === '') {
  				_filter.classList.remove('filter-active');
  			} else {
  				_filter.classList.add('filter-active');
  			}
  		}
  	}
  }
  function create_main_fragment$g(component, ctx) {
  	var div0,
  	    text0,
  	    div2,
  	    headline_updating = {},
  	    text1,
  	    preview_updating = {},
  	    text2,
  	    div1,
  	    table,
  	    tr,
  	    td0,
  	    text3_value = translate$7('zoom'),
  	    text3,
  	    text4,
  	    td1,
  	    integerrange_updating = {},
  	    text5,
  	    text6,
  	    layout_updating = {},
  	    text7,
  	    filter_1_updating = {},
  	    text8,
  	    popup_updating = {};

  	function onwindowresize(event) {
  		component.adjustScroll(event);	}
  	window.addEventListener("resize", onwindowresize);

  	var headline_initial_data = {};
  	if (ctx.title !== void 0) {
  		headline_initial_data.title = ctx.title;
  		headline_updating.title = true;
  	}
  	var headline = new Headline({
  		root: component.root,
  		store: component.store,
  		data: headline_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!headline_updating.title && changed.title) {
  				newState.title = childState.title;
  			}
  			component._set(newState);
  			headline_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		headline._bind({ title: 1 }, headline.get());
  	});

  	headline.on("close", function (event) {
  		component.fire('close');
  	});

  	var preview_initial_data = {};
  	if (ctx.styles !== void 0) {
  		preview_initial_data.styles = ctx.styles;
  		preview_updating.styles = true;
  	}
  	if (ctx.selected !== void 0) {
  		preview_initial_data.selected = ctx.selected;
  		preview_updating.selected = true;
  	}
  	var preview = new Preview({
  		root: component.root,
  		store: component.store,
  		data: preview_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!preview_updating.styles && changed.styles) {
  				newState.styles = childState.styles;
  			}

  			if (!preview_updating.selected && changed.selected) {
  				newState.selected = childState.selected;
  			}
  			component._set(newState);
  			preview_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		preview._bind({ styles: 1, selected: 1 }, preview.get());
  	});

  	preview.on("add", function (event) {
  		component.addStyle();
  	});
  	preview.on("copy", function (event) {
  		component.copyStyle(event);
  	});
  	preview.on("rename", function (event) {
  		component.renameStyle(event);
  	});
  	preview.on("remove", function (event) {
  		component.removeStyle(event);
  	});
  	preview.on("group", function (event) {
  		component.createGroup(event);
  	});

  	var integerrange_initial_data = { min: "1", max: "21", allowEmpty: "true" };
  	if (ctx.minZoom !== void 0) {
  		integerrange_initial_data.low = ctx.minZoom;
  		integerrange_updating.low = true;
  	}
  	if (ctx.maxZoom !== void 0) {
  		integerrange_initial_data.high = ctx.maxZoom;
  		integerrange_updating.high = true;
  	}
  	var integerrange = new scanexIntegerRange_cjs({
  		root: component.root,
  		store: component.store,
  		data: integerrange_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!integerrange_updating.low && changed.low) {
  				newState.minZoom = childState.low;
  			}

  			if (!integerrange_updating.high && changed.high) {
  				newState.maxZoom = childState.high;
  			}
  			component._set(newState);
  			integerrange_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		integerrange._bind({ low: 1, high: 1 }, integerrange.get());
  	});

  	component.refs.zoom = integerrange;

  	var if_block = ctx.allowCopy && create_if_block$6(component, ctx);

  	var layout_initial_data = {};
  	if (ctx.dashes !== void 0) {
  		layout_initial_data.dashes = ctx.dashes;
  		layout_updating.dashes = true;
  	}
  	if (ctx.decorationFill !== void 0) {
  		layout_initial_data.decorationFill = ctx.decorationFill;
  		layout_updating.decorationFill = true;
  	}
  	if (ctx.decorationFillAlpha !== void 0) {
  		layout_initial_data.decorationFillAlpha = ctx.decorationFillAlpha;
  		layout_updating.decorationFillAlpha = true;
  	}
  	if (ctx.decorationOutline !== void 0) {
  		layout_initial_data.decorationOutline = ctx.decorationOutline;
  		layout_updating.decorationOutline = true;
  	}
  	if (ctx.decorationOutlineAlpha !== void 0) {
  		layout_initial_data.decorationOutlineAlpha = ctx.decorationOutlineAlpha;
  		layout_updating.decorationOutlineAlpha = true;
  	}
  	if (ctx.decorationOutlineSize !== void 0) {
  		layout_initial_data.decorationOutlineSize = ctx.decorationOutlineSize;
  		layout_updating.decorationOutlineSize = true;
  	}
  	if (ctx.decorationOutlineType !== void 0) {
  		layout_initial_data.decorationOutlineType = ctx.decorationOutlineType;
  		layout_updating.decorationOutlineType = true;
  	}
  	if (ctx.fillStyle !== void 0) {
  		layout_initial_data.fillStyle = ctx.fillStyle;
  		layout_updating.fillStyle = true;
  	}
  	if (ctx.fonts !== void 0) {
  		layout_initial_data.fonts = ctx.fonts;
  		layout_updating.fonts = true;
  	}
  	if (ctx.geometryType !== void 0) {
  		layout_initial_data.geometryType = ctx.geometryType;
  		layout_updating.geometryType = true;
  	}
  	if (ctx.legendField !== void 0) {
  		layout_initial_data.legendField = ctx.legendField;
  		layout_updating.legendField = true;
  	}
  	if (ctx.legendFields !== void 0) {
  		layout_initial_data.legendFields = ctx.legendFields;
  		layout_updating.legendFields = true;
  	}
  	if (ctx.legendFill !== void 0) {
  		layout_initial_data.legendFill = ctx.legendFill;
  		layout_updating.legendFill = true;
  	}
  	if (ctx.legendFont !== void 0) {
  		layout_initial_data.legendFont = ctx.legendFont;
  		layout_updating.legendFont = true;
  	}
  	if (ctx.legendFontSize !== void 0) {
  		layout_initial_data.legendFontSize = ctx.legendFontSize;
  		layout_updating.legendFontSize = true;
  	}
  	if (ctx.legendFontStyle !== void 0) {
  		layout_initial_data.legendFontStyle = ctx.legendFontStyle;
  		layout_updating.legendFontStyle = true;
  	}
  	if (ctx.legendFontStyles !== void 0) {
  		layout_initial_data.legendFontStyles = ctx.legendFontStyles;
  		layout_updating.legendFontStyles = true;
  	}
  	if (ctx.legendOffsetX !== void 0) {
  		layout_initial_data.legendOffsetX = ctx.legendOffsetX;
  		layout_updating.legendOffsetX = true;
  	}
  	if (ctx.legendOffsetY !== void 0) {
  		layout_initial_data.legendOffsetY = ctx.legendOffsetY;
  		layout_updating.legendOffsetY = true;
  	}
  	if (ctx.legendOutline !== void 0) {
  		layout_initial_data.legendOutline = ctx.legendOutline;
  		layout_updating.legendOutline = true;
  	}
  	if (ctx.legendOutlineSize !== void 0) {
  		layout_initial_data.legendOutlineSize = ctx.legendOutlineSize;
  		layout_updating.legendOutlineSize = true;
  	}
  	if (ctx.legendMinZoom !== void 0) {
  		layout_initial_data.legendMinZoom = ctx.legendMinZoom;
  		layout_updating.legendMinZoom = true;
  	}
  	if (ctx.legendMaxZoom !== void 0) {
  		layout_initial_data.legendMaxZoom = ctx.legendMaxZoom;
  		layout_updating.legendMaxZoom = true;
  	}
  	if (ctx.markerAngle !== void 0) {
  		layout_initial_data.markerAngle = ctx.markerAngle;
  		layout_updating.markerAngle = true;
  	}
  	if (ctx.markerScale !== void 0) {
  		layout_initial_data.markerScale = ctx.markerScale;
  		layout_updating.markerScale = true;
  	}
  	if (ctx.markerMaxScale !== void 0) {
  		layout_initial_data.markerMaxScale = ctx.markerMaxScale;
  		layout_updating.markerMaxScale = true;
  	}
  	if (ctx.markerMinScale !== void 0) {
  		layout_initial_data.markerMinScale = ctx.markerMinScale;
  		layout_updating.markerMinScale = true;
  	}
  	if (ctx.markerSize !== void 0) {
  		layout_initial_data.markerSize = ctx.markerSize;
  		layout_updating.markerSize = true;
  	}
  	if (ctx.markerUrl !== void 0) {
  		layout_initial_data.markerUrl = ctx.markerUrl;
  		layout_updating.markerUrl = true;
  	}
  	if (ctx.patternColors !== void 0) {
  		layout_initial_data.patternColors = ctx.patternColors;
  		layout_updating.patternColors = true;
  	}
  	if (ctx.patternOffset !== void 0) {
  		layout_initial_data.patternOffset = ctx.patternOffset;
  		layout_updating.patternOffset = true;
  	}
  	if (ctx.patternStyle !== void 0) {
  		layout_initial_data.patternStyle = ctx.patternStyle;
  		layout_updating.patternStyle = true;
  	}
  	if (ctx.patternStyleIndex !== void 0) {
  		layout_initial_data.patternStyleIndex = ctx.patternStyleIndex;
  		layout_updating.patternStyleIndex = true;
  	}
  	if (ctx.patternWidth !== void 0) {
  		layout_initial_data.patternWidth = ctx.patternWidth;
  		layout_updating.patternWidth = true;
  	}
  	if (ctx.useDecorationFill !== void 0) {
  		layout_initial_data.useDecorationFill = ctx.useDecorationFill;
  		layout_updating.useDecorationFill = true;
  	}
  	if (ctx.useLegendOutline !== void 0) {
  		layout_initial_data.useLegendOutline = ctx.useLegendOutline;
  		layout_updating.useLegendOutline = true;
  	}
  	var layout = new Layout({
  		root: component.root,
  		store: component.store,
  		data: layout_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!layout_updating.dashes && changed.dashes) {
  				newState.dashes = childState.dashes;
  			}

  			if (!layout_updating.decorationFill && changed.decorationFill) {
  				newState.decorationFill = childState.decorationFill;
  			}

  			if (!layout_updating.decorationFillAlpha && changed.decorationFillAlpha) {
  				newState.decorationFillAlpha = childState.decorationFillAlpha;
  			}

  			if (!layout_updating.decorationOutline && changed.decorationOutline) {
  				newState.decorationOutline = childState.decorationOutline;
  			}

  			if (!layout_updating.decorationOutlineAlpha && changed.decorationOutlineAlpha) {
  				newState.decorationOutlineAlpha = childState.decorationOutlineAlpha;
  			}

  			if (!layout_updating.decorationOutlineSize && changed.decorationOutlineSize) {
  				newState.decorationOutlineSize = childState.decorationOutlineSize;
  			}

  			if (!layout_updating.decorationOutlineType && changed.decorationOutlineType) {
  				newState.decorationOutlineType = childState.decorationOutlineType;
  			}

  			if (!layout_updating.fillStyle && changed.fillStyle) {
  				newState.fillStyle = childState.fillStyle;
  			}

  			if (!layout_updating.fonts && changed.fonts) {
  				newState.fonts = childState.fonts;
  			}

  			if (!layout_updating.geometryType && changed.geometryType) {
  				newState.geometryType = childState.geometryType;
  			}

  			if (!layout_updating.legendField && changed.legendField) {
  				newState.legendField = childState.legendField;
  			}

  			if (!layout_updating.legendFields && changed.legendFields) {
  				newState.legendFields = childState.legendFields;
  			}

  			if (!layout_updating.legendFill && changed.legendFill) {
  				newState.legendFill = childState.legendFill;
  			}

  			if (!layout_updating.legendFont && changed.legendFont) {
  				newState.legendFont = childState.legendFont;
  			}

  			if (!layout_updating.legendFontSize && changed.legendFontSize) {
  				newState.legendFontSize = childState.legendFontSize;
  			}

  			if (!layout_updating.legendFontStyle && changed.legendFontStyle) {
  				newState.legendFontStyle = childState.legendFontStyle;
  			}

  			if (!layout_updating.legendFontStyles && changed.legendFontStyles) {
  				newState.legendFontStyles = childState.legendFontStyles;
  			}

  			if (!layout_updating.legendOffsetX && changed.legendOffsetX) {
  				newState.legendOffsetX = childState.legendOffsetX;
  			}

  			if (!layout_updating.legendOffsetY && changed.legendOffsetY) {
  				newState.legendOffsetY = childState.legendOffsetY;
  			}

  			if (!layout_updating.legendOutline && changed.legendOutline) {
  				newState.legendOutline = childState.legendOutline;
  			}

  			if (!layout_updating.legendOutlineSize && changed.legendOutlineSize) {
  				newState.legendOutlineSize = childState.legendOutlineSize;
  			}

  			if (!layout_updating.legendMinZoom && changed.legendMinZoom) {
  				newState.legendMinZoom = childState.legendMinZoom;
  			}

  			if (!layout_updating.legendMaxZoom && changed.legendMaxZoom) {
  				newState.legendMaxZoom = childState.legendMaxZoom;
  			}

  			if (!layout_updating.markerAngle && changed.markerAngle) {
  				newState.markerAngle = childState.markerAngle;
  			}

  			if (!layout_updating.markerScale && changed.markerScale) {
  				newState.markerScale = childState.markerScale;
  			}

  			if (!layout_updating.markerMaxScale && changed.markerMaxScale) {
  				newState.markerMaxScale = childState.markerMaxScale;
  			}

  			if (!layout_updating.markerMinScale && changed.markerMinScale) {
  				newState.markerMinScale = childState.markerMinScale;
  			}

  			if (!layout_updating.markerSize && changed.markerSize) {
  				newState.markerSize = childState.markerSize;
  			}

  			if (!layout_updating.markerUrl && changed.markerUrl) {
  				newState.markerUrl = childState.markerUrl;
  			}

  			if (!layout_updating.patternColors && changed.patternColors) {
  				newState.patternColors = childState.patternColors;
  			}

  			if (!layout_updating.patternOffset && changed.patternOffset) {
  				newState.patternOffset = childState.patternOffset;
  			}

  			if (!layout_updating.patternStyle && changed.patternStyle) {
  				newState.patternStyle = childState.patternStyle;
  			}

  			if (!layout_updating.patternStyleIndex && changed.patternStyleIndex) {
  				newState.patternStyleIndex = childState.patternStyleIndex;
  			}

  			if (!layout_updating.patternWidth && changed.patternWidth) {
  				newState.patternWidth = childState.patternWidth;
  			}

  			if (!layout_updating.useDecorationFill && changed.useDecorationFill) {
  				newState.useDecorationFill = childState.useDecorationFill;
  			}

  			if (!layout_updating.useLegendOutline && changed.useLegendOutline) {
  				newState.useLegendOutline = childState.useLegendOutline;
  			}
  			component._set(newState);
  			layout_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		layout._bind({ dashes: 1, decorationFill: 1, decorationFillAlpha: 1, decorationOutline: 1, decorationOutlineAlpha: 1, decorationOutlineSize: 1, decorationOutlineType: 1, fillStyle: 1, fonts: 1, geometryType: 1, legendField: 1, legendFields: 1, legendFill: 1, legendFont: 1, legendFontSize: 1, legendFontStyle: 1, legendFontStyles: 1, legendOffsetX: 1, legendOffsetY: 1, legendOutline: 1, legendOutlineSize: 1, legendMinZoom: 1, legendMaxZoom: 1, markerAngle: 1, markerScale: 1, markerMaxScale: 1, markerMinScale: 1, markerSize: 1, markerUrl: 1, patternColors: 1, patternOffset: 1, patternStyle: 1, patternStyleIndex: 1, patternWidth: 1, useDecorationFill: 1, useLegendOutline: 1 }, layout.get());
  	});

  	component.refs.layout = layout;

  	var panel0_initial_data = { id: "layout", title: translate$7('layout') };
  	var panel0 = new scanexTabs_cjs_3({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel0_initial_data
  	});

  	var filter_1_initial_data = {};
  	if (ctx.filter !== void 0) {
  		filter_1_initial_data.text = ctx.filter;
  		filter_1_updating.text = true;
  	}
  	if (ctx.legendFields !== void 0) {
  		filter_1_initial_data.fields = ctx.legendFields;
  		filter_1_updating.fields = true;
  	}
  	var filter_1 = new Filter({
  		root: component.root,
  		store: component.store,
  		data: filter_1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!filter_1_updating.text && changed.text) {
  				newState.filter = childState.text;
  			}

  			if (!filter_1_updating.fields && changed.fields) {
  				newState.legendFields = childState.fields;
  			}
  			component._set(newState);
  			filter_1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		filter_1._bind({ text: 1, fields: 1 }, filter_1.get());
  	});

  	var panel1_initial_data = { id: "filter", title: translate$7('filter') };
  	var panel1 = new scanexTabs_cjs_3({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel1_initial_data
  	});

  	var popup_initial_data = {};
  	if (ctx.balloon !== void 0) {
  		popup_initial_data.balloon = ctx.balloon;
  		popup_updating.balloon = true;
  	}
  	if (ctx.legendFields !== void 0) {
  		popup_initial_data.fields = ctx.legendFields;
  		popup_updating.fields = true;
  	}
  	if (ctx.useClick !== void 0) {
  		popup_initial_data.useClick = ctx.useClick;
  		popup_updating.useClick = true;
  	}
  	if (ctx.useHover !== void 0) {
  		popup_initial_data.useHover = ctx.useHover;
  		popup_updating.useHover = true;
  	}
  	var popup = new Popup({
  		root: component.root,
  		store: component.store,
  		data: popup_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!popup_updating.balloon && changed.balloon) {
  				newState.balloon = childState.balloon;
  			}

  			if (!popup_updating.fields && changed.fields) {
  				newState.legendFields = childState.fields;
  			}

  			if (!popup_updating.useClick && changed.useClick) {
  				newState.useClick = childState.useClick;
  			}

  			if (!popup_updating.useHover && changed.useHover) {
  				newState.useHover = childState.useHover;
  			}
  			component._set(newState);
  			popup_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		popup._bind({ balloon: 1, fields: 1, useClick: 1, useHover: 1 }, popup.get());
  	});

  	popup.on("copy", function (event) {
  		component.copyPopup(event);
  	});

  	component.refs.popup = popup;

  	var panel2_initial_data = { id: "popup", title: translate$7('popup') };
  	var panel2 = new scanexTabs_cjs_3({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel2_initial_data
  	});

  	var tabs = new scanexTabs_cjs_1({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() }
  	});

  	component.refs.tabs = tabs;

  	function mousewheel_handler(event) {
  		component.checkDialog(event);
  	}

  	return {
  		c: function c() {
  			div0 = createElement("div");
  			text0 = createText("\r\n");
  			div2 = createElement("div");
  			headline._fragment.c();
  			text1 = createText("\r\n    ");
  			preview._fragment.c();
  			text2 = createText("\r\n    ");
  			div1 = createElement("div");
  			table = createElement("table");
  			tr = createElement("tr");
  			td0 = createElement("td");
  			text3 = createText(text3_value);
  			text4 = createText("                        \r\n                        ");
  			td1 = createElement("td");
  			integerrange._fragment.c();
  			text5 = createText("\r\n                        ");
  			if (if_block) if_block.c();
  			text6 = createText("\r\n            ");
  			layout._fragment.c();
  			panel0._fragment.c();
  			text7 = createText("\r\n        ");
  			filter_1._fragment.c();
  			panel1._fragment.c();
  			text8 = createText("\r\n        ");
  			popup._fragment.c();
  			panel2._fragment.c();
  			tabs._fragment.c();
  			div0.className = "dlg-attr";
  			td0.className = "label";
  			setAttribute(table, "cellspacing", "0");
  			setAttribute(table, "cellpadding", "0");
  			div1.className = "zoom";
  			addListener(div2, "mousewheel", mousewheel_handler);
  			div2.className = "style-editor";
  		},
  		m: function m(target, anchor) {
  			insert(target, div0, anchor);
  			component.refs.dlgAttr = div0;
  			insert(target, text0, anchor);
  			insert(target, div2, anchor);
  			headline._mount(div2, null);
  			append(div2, text1);
  			preview._mount(div2, null);
  			append(div2, text2);
  			append(panel0._slotted.default, div1);
  			append(div1, table);
  			append(table, tr);
  			append(tr, td0);
  			append(td0, text3);
  			append(tr, text4);
  			append(tr, td1);
  			integerrange._mount(td1, null);
  			append(tr, text5);
  			if (if_block) if_block.m(tr, null);
  			append(panel0._slotted.default, text6);
  			layout._mount(panel0._slotted.default, null);
  			panel0._mount(tabs._slotted.default, null);
  			append(tabs._slotted.default, text7);
  			filter_1._mount(panel1._slotted.default, null);
  			panel1._mount(tabs._slotted.default, null);
  			append(tabs._slotted.default, text8);
  			popup._mount(panel2._slotted.default, null);
  			panel2._mount(tabs._slotted.default, null);
  			tabs._mount(div2, null);
  			component.refs.container = div2;
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			var headline_changes = {};
  			if (!headline_updating.title && changed.title) {
  				headline_changes.title = ctx.title;
  				headline_updating.title = ctx.title !== void 0;
  			}
  			headline._set(headline_changes);
  			headline_updating = {};

  			var preview_changes = {};
  			if (!preview_updating.styles && changed.styles) {
  				preview_changes.styles = ctx.styles;
  				preview_updating.styles = ctx.styles !== void 0;
  			}
  			if (!preview_updating.selected && changed.selected) {
  				preview_changes.selected = ctx.selected;
  				preview_updating.selected = ctx.selected !== void 0;
  			}
  			preview._set(preview_changes);
  			preview_updating = {};

  			var integerrange_changes = {};
  			if (!integerrange_updating.low && changed.minZoom) {
  				integerrange_changes.low = ctx.minZoom;
  				integerrange_updating.low = ctx.minZoom !== void 0;
  			}
  			if (!integerrange_updating.high && changed.maxZoom) {
  				integerrange_changes.high = ctx.maxZoom;
  				integerrange_updating.high = ctx.maxZoom !== void 0;
  			}
  			integerrange._set(integerrange_changes);
  			integerrange_updating = {};

  			if (ctx.allowCopy) {
  				if (!if_block) {
  					if_block = create_if_block$6(component, ctx);
  					if_block.c();
  					if_block.m(tr, null);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}

  			var layout_changes = {};
  			if (!layout_updating.dashes && changed.dashes) {
  				layout_changes.dashes = ctx.dashes;
  				layout_updating.dashes = ctx.dashes !== void 0;
  			}
  			if (!layout_updating.decorationFill && changed.decorationFill) {
  				layout_changes.decorationFill = ctx.decorationFill;
  				layout_updating.decorationFill = ctx.decorationFill !== void 0;
  			}
  			if (!layout_updating.decorationFillAlpha && changed.decorationFillAlpha) {
  				layout_changes.decorationFillAlpha = ctx.decorationFillAlpha;
  				layout_updating.decorationFillAlpha = ctx.decorationFillAlpha !== void 0;
  			}
  			if (!layout_updating.decorationOutline && changed.decorationOutline) {
  				layout_changes.decorationOutline = ctx.decorationOutline;
  				layout_updating.decorationOutline = ctx.decorationOutline !== void 0;
  			}
  			if (!layout_updating.decorationOutlineAlpha && changed.decorationOutlineAlpha) {
  				layout_changes.decorationOutlineAlpha = ctx.decorationOutlineAlpha;
  				layout_updating.decorationOutlineAlpha = ctx.decorationOutlineAlpha !== void 0;
  			}
  			if (!layout_updating.decorationOutlineSize && changed.decorationOutlineSize) {
  				layout_changes.decorationOutlineSize = ctx.decorationOutlineSize;
  				layout_updating.decorationOutlineSize = ctx.decorationOutlineSize !== void 0;
  			}
  			if (!layout_updating.decorationOutlineType && changed.decorationOutlineType) {
  				layout_changes.decorationOutlineType = ctx.decorationOutlineType;
  				layout_updating.decorationOutlineType = ctx.decorationOutlineType !== void 0;
  			}
  			if (!layout_updating.fillStyle && changed.fillStyle) {
  				layout_changes.fillStyle = ctx.fillStyle;
  				layout_updating.fillStyle = ctx.fillStyle !== void 0;
  			}
  			if (!layout_updating.fonts && changed.fonts) {
  				layout_changes.fonts = ctx.fonts;
  				layout_updating.fonts = ctx.fonts !== void 0;
  			}
  			if (!layout_updating.geometryType && changed.geometryType) {
  				layout_changes.geometryType = ctx.geometryType;
  				layout_updating.geometryType = ctx.geometryType !== void 0;
  			}
  			if (!layout_updating.legendField && changed.legendField) {
  				layout_changes.legendField = ctx.legendField;
  				layout_updating.legendField = ctx.legendField !== void 0;
  			}
  			if (!layout_updating.legendFields && changed.legendFields) {
  				layout_changes.legendFields = ctx.legendFields;
  				layout_updating.legendFields = ctx.legendFields !== void 0;
  			}
  			if (!layout_updating.legendFill && changed.legendFill) {
  				layout_changes.legendFill = ctx.legendFill;
  				layout_updating.legendFill = ctx.legendFill !== void 0;
  			}
  			if (!layout_updating.legendFont && changed.legendFont) {
  				layout_changes.legendFont = ctx.legendFont;
  				layout_updating.legendFont = ctx.legendFont !== void 0;
  			}
  			if (!layout_updating.legendFontSize && changed.legendFontSize) {
  				layout_changes.legendFontSize = ctx.legendFontSize;
  				layout_updating.legendFontSize = ctx.legendFontSize !== void 0;
  			}
  			if (!layout_updating.legendFontStyle && changed.legendFontStyle) {
  				layout_changes.legendFontStyle = ctx.legendFontStyle;
  				layout_updating.legendFontStyle = ctx.legendFontStyle !== void 0;
  			}
  			if (!layout_updating.legendFontStyles && changed.legendFontStyles) {
  				layout_changes.legendFontStyles = ctx.legendFontStyles;
  				layout_updating.legendFontStyles = ctx.legendFontStyles !== void 0;
  			}
  			if (!layout_updating.legendOffsetX && changed.legendOffsetX) {
  				layout_changes.legendOffsetX = ctx.legendOffsetX;
  				layout_updating.legendOffsetX = ctx.legendOffsetX !== void 0;
  			}
  			if (!layout_updating.legendOffsetY && changed.legendOffsetY) {
  				layout_changes.legendOffsetY = ctx.legendOffsetY;
  				layout_updating.legendOffsetY = ctx.legendOffsetY !== void 0;
  			}
  			if (!layout_updating.legendOutline && changed.legendOutline) {
  				layout_changes.legendOutline = ctx.legendOutline;
  				layout_updating.legendOutline = ctx.legendOutline !== void 0;
  			}
  			if (!layout_updating.legendOutlineSize && changed.legendOutlineSize) {
  				layout_changes.legendOutlineSize = ctx.legendOutlineSize;
  				layout_updating.legendOutlineSize = ctx.legendOutlineSize !== void 0;
  			}
  			if (!layout_updating.legendMinZoom && changed.legendMinZoom) {
  				layout_changes.legendMinZoom = ctx.legendMinZoom;
  				layout_updating.legendMinZoom = ctx.legendMinZoom !== void 0;
  			}
  			if (!layout_updating.legendMaxZoom && changed.legendMaxZoom) {
  				layout_changes.legendMaxZoom = ctx.legendMaxZoom;
  				layout_updating.legendMaxZoom = ctx.legendMaxZoom !== void 0;
  			}
  			if (!layout_updating.markerAngle && changed.markerAngle) {
  				layout_changes.markerAngle = ctx.markerAngle;
  				layout_updating.markerAngle = ctx.markerAngle !== void 0;
  			}
  			if (!layout_updating.markerScale && changed.markerScale) {
  				layout_changes.markerScale = ctx.markerScale;
  				layout_updating.markerScale = ctx.markerScale !== void 0;
  			}
  			if (!layout_updating.markerMaxScale && changed.markerMaxScale) {
  				layout_changes.markerMaxScale = ctx.markerMaxScale;
  				layout_updating.markerMaxScale = ctx.markerMaxScale !== void 0;
  			}
  			if (!layout_updating.markerMinScale && changed.markerMinScale) {
  				layout_changes.markerMinScale = ctx.markerMinScale;
  				layout_updating.markerMinScale = ctx.markerMinScale !== void 0;
  			}
  			if (!layout_updating.markerSize && changed.markerSize) {
  				layout_changes.markerSize = ctx.markerSize;
  				layout_updating.markerSize = ctx.markerSize !== void 0;
  			}
  			if (!layout_updating.markerUrl && changed.markerUrl) {
  				layout_changes.markerUrl = ctx.markerUrl;
  				layout_updating.markerUrl = ctx.markerUrl !== void 0;
  			}
  			if (!layout_updating.patternColors && changed.patternColors) {
  				layout_changes.patternColors = ctx.patternColors;
  				layout_updating.patternColors = ctx.patternColors !== void 0;
  			}
  			if (!layout_updating.patternOffset && changed.patternOffset) {
  				layout_changes.patternOffset = ctx.patternOffset;
  				layout_updating.patternOffset = ctx.patternOffset !== void 0;
  			}
  			if (!layout_updating.patternStyle && changed.patternStyle) {
  				layout_changes.patternStyle = ctx.patternStyle;
  				layout_updating.patternStyle = ctx.patternStyle !== void 0;
  			}
  			if (!layout_updating.patternStyleIndex && changed.patternStyleIndex) {
  				layout_changes.patternStyleIndex = ctx.patternStyleIndex;
  				layout_updating.patternStyleIndex = ctx.patternStyleIndex !== void 0;
  			}
  			if (!layout_updating.patternWidth && changed.patternWidth) {
  				layout_changes.patternWidth = ctx.patternWidth;
  				layout_updating.patternWidth = ctx.patternWidth !== void 0;
  			}
  			if (!layout_updating.useDecorationFill && changed.useDecorationFill) {
  				layout_changes.useDecorationFill = ctx.useDecorationFill;
  				layout_updating.useDecorationFill = ctx.useDecorationFill !== void 0;
  			}
  			if (!layout_updating.useLegendOutline && changed.useLegendOutline) {
  				layout_changes.useLegendOutline = ctx.useLegendOutline;
  				layout_updating.useLegendOutline = ctx.useLegendOutline !== void 0;
  			}
  			layout._set(layout_changes);
  			layout_updating = {};

  			var filter_1_changes = {};
  			if (!filter_1_updating.text && changed.filter) {
  				filter_1_changes.text = ctx.filter;
  				filter_1_updating.text = ctx.filter !== void 0;
  			}
  			if (!filter_1_updating.fields && changed.legendFields) {
  				filter_1_changes.fields = ctx.legendFields;
  				filter_1_updating.fields = ctx.legendFields !== void 0;
  			}
  			filter_1._set(filter_1_changes);
  			filter_1_updating = {};

  			var popup_changes = {};
  			if (!popup_updating.balloon && changed.balloon) {
  				popup_changes.balloon = ctx.balloon;
  				popup_updating.balloon = ctx.balloon !== void 0;
  			}
  			if (!popup_updating.fields && changed.legendFields) {
  				popup_changes.fields = ctx.legendFields;
  				popup_updating.fields = ctx.legendFields !== void 0;
  			}
  			if (!popup_updating.useClick && changed.useClick) {
  				popup_changes.useClick = ctx.useClick;
  				popup_updating.useClick = ctx.useClick !== void 0;
  			}
  			if (!popup_updating.useHover && changed.useHover) {
  				popup_changes.useHover = ctx.useHover;
  				popup_updating.useHover = ctx.useHover !== void 0;
  			}
  			popup._set(popup_changes);
  			popup_updating = {};
  		},
  		d: function d(detach) {
  			window.removeEventListener("resize", onwindowresize);

  			if (detach) {
  				detachNode(div0);
  			}

  			if (component.refs.dlgAttr === div0) component.refs.dlgAttr = null;
  			if (detach) {
  				detachNode(text0);
  				detachNode(div2);
  			}

  			headline.destroy();
  			preview.destroy();
  			integerrange.destroy();
  			if (component.refs.zoom === integerrange) component.refs.zoom = null;
  			if (if_block) if_block.d();
  			layout.destroy();
  			if (component.refs.layout === layout) component.refs.layout = null;
  			panel0.destroy();
  			filter_1.destroy();
  			panel1.destroy();
  			popup.destroy();
  			if (component.refs.popup === popup) component.refs.popup = null;
  			panel2.destroy();
  			tabs.destroy();
  			if (component.refs.tabs === tabs) component.refs.tabs = null;
  			removeListener(div2, "mousewheel", mousewheel_handler);
  			if (component.refs.container === div2) component.refs.container = null;
  		}
  	};
  }

  // (30:24) {#if allowCopy}
  function create_if_block$6(component, ctx) {
  	var td, i;

  	function click_handler(event) {
  		component.copyOptions(event);
  	}

  	return {
  		c: function c() {
  			td = createElement("td");
  			i = createElement("i");
  			i.className = "show-attr";
  			addListener(td, "click", click_handler);
  			td.className = "copy-attr";
  		},
  		m: function m(target, anchor) {
  			insert(target, td, anchor);
  			append(td, i);
  			component.refs.btnAttr = i;
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(td);
  			}

  			if (component.refs.btnAttr === i) component.refs.btnAttr = null;
  			removeListener(td, "click", click_handler);
  		}
  	};
  }

  function Editor(options) {
  	var _this4 = this;

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$g(), options.data);

  	this._recompute({ styles: 1, selected: 1 }, this._state);
  	this._intro = true;
  	this._handlers.update = [onupdate$8];

  	this._handlers.destroy = [ondestroy];

  	this._fragment = create_main_fragment$g(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate$3.call(_this4);
  		_this4.fire("update", { changed: assignTrue({}, _this4._state), current: _this4._state });
  	});

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}
  }

  assign(Editor.prototype, proto);
  assign(Editor.prototype, methods$b);

  Editor.prototype._recompute = function _recompute(changed, state) {
  	if (changed.styles) {
  		if (this._differs(state.allowCopy, state.allowCopy = allowCopy(state))) changed.allowCopy = true;
  	}

  	if (changed.styles || changed.selected) {
  		if (this._differs(state.balloon, state.balloon = balloon(state))) changed.balloon = true;
  		if (this._differs(state.dashes, state.dashes = dashes(state))) changed.dashes = true;
  		if (this._differs(state.decorationFill, state.decorationFill = decorationFill(state))) changed.decorationFill = true;
  		if (this._differs(state.decorationFillAlpha, state.decorationFillAlpha = decorationFillAlpha(state))) changed.decorationFillAlpha = true;
  		if (this._differs(state.decorationOutline, state.decorationOutline = decorationOutline(state))) changed.decorationOutline = true;
  		if (this._differs(state.decorationOutlineAlpha, state.decorationOutlineAlpha = decorationOutlineAlpha(state))) changed.decorationOutlineAlpha = true;
  		if (this._differs(state.decorationOutlineSize, state.decorationOutlineSize = decorationOutlineSize(state))) changed.decorationOutlineSize = true;
  		if (this._differs(state.decorationOutlineType, state.decorationOutlineType = decorationOutlineType(state))) changed.decorationOutlineType = true;
  		if (this._differs(state.filter, state.filter = filter(state))) changed.filter = true;
  		if (this._differs(state.fillStyle, state.fillStyle = fillStyle(state))) changed.fillStyle = true;
  		if (this._differs(state.legendField, state.legendField = legendField(state))) changed.legendField = true;
  		if (this._differs(state.legendFill, state.legendFill = legendFill(state))) changed.legendFill = true;
  		if (this._differs(state.legendFont, state.legendFont = legendFont(state))) changed.legendFont = true;
  		if (this._differs(state.legendFontSize, state.legendFontSize = legendFontSize(state))) changed.legendFontSize = true;
  		if (this._differs(state.legendFontStyle, state.legendFontStyle = legendFontStyle(state))) changed.legendFontStyle = true;
  		if (this._differs(state.legendFontStyles, state.legendFontStyles = legendFontStyles(state))) changed.legendFontStyles = true;
  		if (this._differs(state.legendOffsetX, state.legendOffsetX = legendOffsetX(state))) changed.legendOffsetX = true;
  		if (this._differs(state.legendOffsetY, state.legendOffsetY = legendOffsetY(state))) changed.legendOffsetY = true;
  		if (this._differs(state.legendOutline, state.legendOutline = legendOutline(state))) changed.legendOutline = true;
  		if (this._differs(state.legendOutlineSize, state.legendOutlineSize = legendOutlineSize(state))) changed.legendOutlineSize = true;
  		if (this._differs(state.legendMinZoom, state.legendMinZoom = legendMinZoom(state))) changed.legendMinZoom = true;
  		if (this._differs(state.legendMaxZoom, state.legendMaxZoom = legendMaxZoom(state))) changed.legendMaxZoom = true;
  		if (this._differs(state.markerAngle, state.markerAngle = markerAngle(state))) changed.markerAngle = true;
  		if (this._differs(state.markerScale, state.markerScale = markerScale(state))) changed.markerScale = true;
  		if (this._differs(state.markerMaxScale, state.markerMaxScale = markerMaxScale(state))) changed.markerMaxScale = true;
  		if (this._differs(state.markerMinScale, state.markerMinScale = markerMinScale(state))) changed.markerMinScale = true;
  		if (this._differs(state.markerSize, state.markerSize = markerSize(state))) changed.markerSize = true;
  		if (this._differs(state.markerUrl, state.markerUrl = markerUrl(state))) changed.markerUrl = true;
  		if (this._differs(state.maxZoom, state.maxZoom = maxZoom(state))) changed.maxZoom = true;
  		if (this._differs(state.minZoom, state.minZoom = minZoom(state))) changed.minZoom = true;
  		if (this._differs(state.patternColors, state.patternColors = patternColors(state))) changed.patternColors = true;
  		if (this._differs(state.patternOffset, state.patternOffset = patternOffset(state))) changed.patternOffset = true;
  		if (this._differs(state.patternStyle, state.patternStyle = patternStyle(state))) changed.patternStyle = true;
  		if (this._differs(state.patternStyleIndex, state.patternStyleIndex = patternStyleIndex(state))) changed.patternStyleIndex = true;
  		if (this._differs(state.patternWidth, state.patternWidth = patternWidth(state))) changed.patternWidth = true;
  		if (this._differs(state.useClick, state.useClick = useClick(state))) changed.useClick = true;
  		if (this._differs(state.useDecorationFill, state.useDecorationFill = useDecorationFill(state))) changed.useDecorationFill = true;
  		if (this._differs(state.useHover, state.useHover = useHover(state))) changed.useHover = true;
  		if (this._differs(state.useLegendOutline, state.useLegendOutline = useLegendOutline(state))) changed.useLegendOutline = true;
  	}
  };

  /* src\Coloring\Coloring.html generated by Svelte v2.16.1 */

  scanexTranslations_cjs.addText('eng', {
  	apply: 'Apply',
  	cancel: 'Cancel',
  	gradients: 'Gradient',
  	qualification: {
  		label: 'Qualification method',
  		types: {
  			equal: 'Equal intervals',
  			quantity: 'Equal quantities'
  		}
  	},
  	quantities: 'Number of qualifiers',
  	coloring: {
  		label: 'Coloring',
  		type: 'Coloring method',
  		types: {
  			value: 'By unique value',
  			range: 'By range'
  		},
  		values: 'Values'
  	},
  	column: 'Column',
  	save: 'Save'
  });

  scanexTranslations_cjs.addText('rus', {
  	apply: 'Применить',
  	cancel: 'Отмена',
  	gradients: 'Градиент',
  	qualification: {
  		label: 'Метод классификации',
  		types: {
  			equal: 'Равные интервалы',
  			quantity: 'Равные количества'
  		}
  	},
  	quantities: 'Кол-во классов',
  	coloring: {
  		label: 'Раскраска',
  		type: 'Метод раскраски',
  		types: {
  			value: 'По уникальным значениям',
  			range: 'По диапазону'
  		},
  		values: 'Значения'
  	},
  	column: 'Колонка',
  	save: 'Сохранить'
  });

  var translate$8 = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

  var qualifiers = [translate$8('qualification.types.equal'), translate$8('qualification.types.quantity')];

  var column_html = function column_html(_ref) {
  	var name = _ref.name,
  	    type = _ref.type;
  	return '<span class="column-type column-type-' + type + '">' + type + '</span>\n    <span class="column-name">' + name + '</span>';
  };

  var color_cell = function color_cell(hex) {
  	return '<div class="sample" style="background-color: ' + hex + '"></div>';
  };
  var gradient_cell = function gradient_cell(name, steps) {
  	return '<div class="image" style="background-image: linear-gradient(to right, ' + steps.join(',') + ')"></div><div class="label">' + name + '</div>';
  };

  var gradients = [{ name: 'BlueRed', steps: ['#0000ff', '#ff0000'] }, { name: 'Inferno', steps: ['#000004', '#fcffa4'] }, { name: 'OrRd', steps: ['#ffa500', '#ff0000'] }, { name: 'RdYlGn', steps: ['#ff0000', '#ffff00', '#008000'] }, { name: 'YellowGreen', steps: ['#ffff00', '#008000'] }];

  var order_asc = function order_asc(a, b) {
  	if (a.value < b.value) {
  		return -1;
  	}
  	if (a.value > b.value) {
  		return 1;
  	}
  	return 0;
  };

  // rgb
  var calc_grad = function calc_grad(start, end, num) {
  	var dr = (end.r - start.r) / (num - 1);
  	var dg = (end.g - start.g) / (num - 1);
  	var db = (end.b - start.b) / (num - 1);
  	var r = start.r,
  	    g = start.g,
  	    b = start.b;

  	var colors = [];
  	for (var i = 0; i < num; ++i) {
  		colors.push({ r: Math.round(r), g: Math.round(g), b: Math.round(b) });
  		r += dr;
  		g += dg;
  		b += db;
  	}
  	return colors;
  };

  var calc_multi_grad = function calc_multi_grad(steps, N) {
  	var ranges = steps.map(scanexColorPicker_cjs_5);
  	var len = ranges.length;
  	if (len < N) {
  		var _ranges$reduce = ranges.reduce(function (_ref2, end) {
  			var items = _ref2.items,
  			    start = _ref2.start;

  			if (start) {
  				return { items: items.concat({ start: start, end: end }), start: end };
  			}
  			return { items: items, start: end };
  		}, { items: [], start: null }),
  		    items = _ranges$reduce.items,
  		    start = _ranges$reduce.start;

  		var colors = [];
  		var n = Math.round(N / items.length);
  		for (var i = 0; i < items.length; ++i) {
  			var _items$i = items[i],
  			    _start = _items$i.start,
  			    end = _items$i.end;

  			var part = calc_grad(_start, end, i > 0 && part.length > 1 ? n + 1 : n);
  			if (i > 0 && part.length > 1) {
  				part.shift();
  			}
  			for (var k = 0; k < part.length; ++k) {
  				colors.push(part[k]);
  			}
  		}
  		return colors;
  	} else if (len === N) {
  		return ranges;
  	} else if (len > N) {
  		return [ranges[0], ranges[len - 1]];
  	}
  };

  var calc_spectrum = function calc_spectrum(num) {
  	var colors = [];
  	if (num > 1) {
  		var dh = 325 / (num - 1);
  		var h = 0;
  		for (var i = 0; i < num; ++i) {
  			colors.push(scanexColorPicker_cjs_2(h, 1, 0.5));
  			h += dh;
  		}
  	} else {
  		colors.push(scanexColorPicker_cjs_2(0, 1, 0.5));
  	}
  	return colors;
  };

  var cnv_part = function cnv_part(type, low, high) {
  	switch (type) {
  		case 'date':
  			return high ? {
  				low: new Date(low).toLocaleDateString(),
  				high: new Date(high).toLocaleDateString()
  			} : {
  				low: new Date(low).toLocaleDateString()
  			};
  		default:
  			return high ? { low: low, high: high } : { low: low };
  	}
  };

  var fmt = function fmt(x) {
  	if (typeof x === 'number') {
  		var a = Math.abs(x);
  		if (a < 1) {
  			return x.toFixed(4);
  		} else if (1 <= a && a <= 100) {
  			return x.toFixed(2);
  		} else {
  			return x.toFixed(0);
  		}
  	} else {
  		return x;
  	}
  };

  function columnItems(_ref3) {
  	var columns = _ref3.columns;

  	return columns.map(column_html);
  }

  function gradientItems(_ref4) {
  	var gradients = _ref4.gradients;

  	return gradients.map(function (_ref5) {
  		var name = _ref5.name,
  		    steps = _ref5.steps;
  		return gradient_cell(name, steps);
  	});
  }

  function qualificationDisabled(_ref6) {
  	var typeIndex = _ref6.typeIndex;

  	return typeIndex === 0;
  }

  function validate(_ref7) {
  	var columns = _ref7.columns,
  	    columnIndex = _ref7.columnIndex;
  	var type = columns[columnIndex].type;

  	switch (type) {
  		case 'float':
  			return '^[0-9]+\.[0-9]+$';
  		case 'integer':
  			return '^[0-9]+$';
  		case 'date':
  			return '';
  		default:
  			return '';
  	}
  }

  function data$h() {
  	return {
  		columns: [],
  		columnIndex: 0,
  		count: 0,
  		gradientIndex: 0,
  		gradients: gradients,
  		gradientItems: [],
  		qualifierIndex: 0,
  		qualifiers: qualifiers,
  		quantities: 2,
  		typeIndex: 0,
  		typeItems: [],
  		partition: [],
  		editable: false
  	};
  }
  var methods$c = {
  	changeColumn: function changeColumn(_ref8) {
  		var changed = _ref8.changed,
  		    current = _ref8.current;

  		if (changed.selected || changed.items) {
  			var _get = this.get(),
  			    columns = _get.columns,
  			    columnIndex = _get.columnIndex,
  			    typeItems = _get.typeItems,
  			    typeIndex = _get.typeIndex;

  			var type = columns[columnIndex].type;

  			switch (type) {
  				case 'float':
  				case 'integer':
  				case 'date':
  					// case 'time':
  					typeItems = [translate$8('coloring.types.value'), translate$8('coloring.types.range')];
  					break;
  				case 'string':
  				default:
  					typeItems = [translate$8('coloring.types.value')];
  					break;
  			}
  			this.set({ typeItems: typeItems, typeIndex: typeIndex < typeItems.length ? typeIndex : 0 });
  		}
  	},
  	calculateUniqueValues: function calculateUniqueValues(layerID, column, type) {
  		var _this = this;

  		sendCrossDomainPostRequest(window.serverBase + 'VectorLayer/GetColumnStat', { WrapStyle: 'message', layerID: layerID, column: column, unique: true, maxUnique: this.constructor.MAX_UNIQUE }, function (data) {
  			switch (data.Status) {
  				case 'ok':
  					var unique = data.Result.unique;

  					unique.sort(order_asc);
  					var partition = unique.map(function (_ref9) {
  						var value = _ref9.value;
  						return cnv_part(type, value);
  					});
  					var count = partition.length;
  					var colors = calc_spectrum(count).map(function (_ref10) {
  						var r = _ref10.r,
  						    g = _ref10.g,
  						    b = _ref10.b;
  						return scanexColorPicker_cjs_4(r, g, b);
  					});
  					partition.forEach(function (x, i) {
  						return x.color = colors[i];
  					});
  					_this.set({ partition: partition, count: count, editable: false });
  					break;
  				default:
  					console.log(data.ErrorInfo);
  					break;
  			}
  		});
  	},
  	calculateEquals: function calculateEquals(layerID, column, type, count, steps) {
  		var _this2 = this;

  		sendCrossDomainPostRequest(window.serverBase + 'VectorLayer/GetColumnStat', { WrapStyle: 'message', layerID: layerID, column: column, maxUnique: this.constructor.MAX_UNIQUE, minMax: true }, function (data) {
  			switch (data.Status) {
  				case 'ok':
  					var _ref11 = type === 'date' ? {
  						min: new Date(data.Result.min).getTime(),
  						max: new Date(data.Result.max).getTime()
  					} : data.Result,
  					    min = _ref11.min,
  					    max = _ref11.max;

  					var step = (max - min) / count;
  					var partition = [];
  					var prev = min;
  					for (var i = 0; i < count - 1; ++i) {
  						var cur = prev + step;
  						partition.push(cnv_part(type, prev, cur));
  						prev = cur;
  					}
  					partition.push(cnv_part(type, prev, max));
  					var colors = calc_multi_grad(steps, count).map(function (_ref12) {
  						var r = _ref12.r,
  						    g = _ref12.g,
  						    b = _ref12.b;
  						return scanexColorPicker_cjs_4(r, g, b);
  					});
  					partition.forEach(function (x, i) {
  						return x.color = colors[i];
  					});
  					_this2.set({ partition: partition, count: count, editable: true });
  					break;
  				default:
  					console.log(data.ErrorInfo);
  					break;
  			}
  		});
  	},
  	calculateQuantiles: function calculateQuantiles(layerID, column, type, count, steps) {
  		var _this3 = this;

  		sendCrossDomainPostRequest(window.serverBase + 'VectorLayer/GetColumnStat', { WrapStyle: 'message', layerID: layerID, column: column, quantile: true, maxQuantile: count }, function (data) {
  			switch (data.Status) {
  				case 'ok':
  					var quantile = data.Result.quantile;

  					if (quantile.length > 1) {
  						var partition = [];
  						var low = quantile[0];
  						for (var i = 1; i < quantile.length; ++i) {
  							var high = quantile[i];
  							partition.push(cnv_part(type, low, high));
  							low = high;
  						}
  						var colors = calc_multi_grad(steps, count).map(function (_ref13) {
  							var r = _ref13.r,
  							    g = _ref13.g,
  							    b = _ref13.b;
  							return scanexColorPicker_cjs_4(r, g, b);
  						});
  						partition.forEach(function (x, i) {
  							return x.color = colors[i];
  						});
  						_this3.set({ partition: partition, count: count, editable: true });
  					}
  					break;
  				default:
  					console.log(data.ErrorInfo);
  					break;
  			}
  		});
  	},
  	adjustHeight: function adjustHeight() {
  		var _document$body$getBou = document.body.getBoundingClientRect(),
  		    height = _document$body$getBou.height;

  		this.refs.content.style.maxHeight = height - this.VALUES_HEIGHT + 'px';
  		this.refs.content.style.height = this.refs.content.style.maxHeight;
  	},
  	changeColor: function changeColor(e, i) {
  		var _this4 = this;

  		e.stopPropagation();
  		if (!this._colorPicker) {
  			var target = e.target;

  			var _target$getBoundingCl = target.getBoundingClientRect(),
  			    top = _target$getBoundingCl.top,
  			    right = _target$getBoundingCl.right;

  			this.refs.pickerContainer.style.display = 'block';
  			this.refs.pickerContainer.style.top = top + 'px';
  			this.refs.pickerContainer.style.left = right + 10 + 'px';

  			var _get2 = this.get(),
  			    partition = _get2.partition;

  			var _hex2rgb = scanexColorPicker_cjs_5(partition[i].color),
  			    r = _hex2rgb.r,
  			    g = _hex2rgb.g,
  			    b = _hex2rgb.b;

  			var _rgb2hsl = scanexColorPicker_cjs_3(r, g, b),
  			    h = _rgb2hsl.h,
  			    s = _rgb2hsl.s,
  			    l = _rgb2hsl.l;

  			this._colorPicker = new scanexColorPicker_cjs_1({
  				target: this.refs.pickerContainer,
  				data: {
  					hue: h,
  					saturation: s,
  					lightness: l
  				}
  			});
  			this._colorPicker.on('state', function (_ref14) {
  				var changed = _ref14.changed,
  				    current = _ref14.current;

  				if (changed.hue || changed.saturation || changed.lightness) {
  					var _get3 = _this4.get(),
  					    _partition = _get3.partition;

  					var hue = current.hue,
  					    saturation = current.saturation,
  					    lightness = current.lightness;

  					var _hsl2rgb = scanexColorPicker_cjs_2(hue, saturation, lightness),
  					    _r = _hsl2rgb.r,
  					    _g = _hsl2rgb.g,
  					    _b = _hsl2rgb.b;

  					_partition[i].color = scanexColorPicker_cjs_4(_r, _g, _b);
  					_this4.set({ partition: _partition });
  				}
  			});
  		}
  	},
  	hide: function hide(e) {
  		e.stopPropagation();
  		if (this._colorPicker) {
  			this._colorPicker.destroy();
  			this._colorPicker = null;
  			this.refs.pickerContainer.style.display = 'none';
  		}
  	},
  	edit: function edit(e, i) {
  		var target = e.target;
  		// e.stopPropagation();

  		var container = target;
  		if (target.classList.contains('high') || target.classList.contains('low')) {
  			container = target.parentElement.parentElement;
  		}
  		var hi = container.querySelector('.high');
  		if (hi) {
  			var lo = container.querySelector('.low');
  			lo.setAttribute('contenteditable', true);
  			var lc = container.querySelector('.low-container');
  			lc.classList.add('editable');
  			hi.setAttribute('contenteditable', true);
  			var hc = container.querySelector('.high-container');
  			hc.classList.add('editable');
  		}
  	},
  	save: function save(e, i) {
  		e.stopPropagation();
  		var target = e.target;

  		var hi = target.querySelector('.high');
  		var lc = target.querySelector('.low-container');
  		if (hi && lc.classList.contains('editable')) {
  			var lo = target.querySelector('.low');
  			lo.setAttribute('contenteditable', false);
  			lc.classList.remove('editable');
  			hi.setAttribute('contenteditable', false);
  			var hc = target.querySelector('.high-container');
  			hc.classList.remove('editable');

  			var _get4 = this.get(),
  			    partition = _get4.partition,
  			    columns = _get4.columns,
  			    columnIndex = _get4.columnIndex;

  			var type = columns[columnIndex].type;

  			var low = parseFloat(lo.innerText);
  			var high = parseFloat(hi.innerText);
  			partition[i].low = low;
  			partition[i].high = high;
  			this.set({ partition: partition });
  		}
  	},
  	remove: function remove(e, i) {
  		var _get5 = this.get(),
  		    partition = _get5.partition,
  		    count = _get5.count;

  		if (count > 2) {
  			partition.splice(i, 1);
  			this.set({ partition: partition, count: count - 1 });
  		}
  	}
  };

  function oncreate$4() {
  	this.VALUES_HEIGHT = this.refs.values.getBoundingClientRect().top + this.refs.header.getBoundingClientRect().height + this.refs.footer.getBoundingClientRect().height;
  	this.adjustHeight();

  	this.HEADER_HEIGHT = document.getElementById('header').getBoundingClientRect().height;
  	this.SIDEBAR_WIDTH = document.querySelector('.iconSidebarControl-tabs').getBoundingClientRect().width;
  }
  function onupdate$9(_ref15) {
  	var changed = _ref15.changed,
  	    current = _ref15.current;

  	if (changed.columnIndex || changed.typeIndex || changed.qualifierIndex || changed.quantities || changed.gradientIndex) {
  		var _get6 = this.get(),
  		    columns = _get6.columns,
  		    columnIndex = _get6.columnIndex,
  		    gradientIndex = _get6.gradientIndex,
  		    _gradients = _get6.gradients,
  		    typeIndex = _get6.typeIndex,
  		    qualifierIndex = _get6.qualifierIndex,
  		    quantities = _get6.quantities;

  		var q = parseInt(quantities, 10);
  		var layerID = this.options.layerID;
  		var _columns$columnIndex = columns[columnIndex],
  		    name = _columns$columnIndex.name,
  		    type = _columns$columnIndex.type;
  		var steps = _gradients[gradientIndex].steps;

  		if (typeIndex === 0) {
  			this.calculateUniqueValues(layerID, name, type);
  		} else if (typeIndex === 1) {
  			switch (type) {
  				case 'float':
  				case 'integer':
  				case 'date':
  					if (qualifierIndex === 0) {
  						this.calculateEquals(layerID, name, type, q, steps);
  					} else if (qualifierIndex === 1) {
  						this.calculateQuantiles(layerID, name, type, q, steps);
  					}
  					break;
  				default:
  					break;
  			}
  		}
  	}
  }
  function setup$1(Component) {
  	Component.MAX_UNIQUE = 100;
  }
  function mouseleave_handler$1(event) {
  	var _svelte = this._svelte,
  	    component = _svelte.component,
  	    ctx = _svelte.ctx;


  	component.save(event, ctx.i);
  }

  function click_handler_2$1(event) {
  	var _svelte2 = this._svelte,
  	    component = _svelte2.component,
  	    ctx = _svelte2.ctx;


  	component.remove(event, ctx.i);
  }

  function click_handler_1$2(event) {
  	var _svelte3 = this._svelte,
  	    component = _svelte3.component,
  	    ctx = _svelte3.ctx;


  	component.changeColor(event, ctx.i);
  }

  function click_handler$4(event) {
  	var _svelte4 = this._svelte,
  	    component = _svelte4.component,
  	    ctx = _svelte4.ctx;


  	component.edit(event, ctx.i);
  }

  function get_each_context$5(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.p = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function create_main_fragment$h(component, ctx) {
  	var div19,
  	    div0,
  	    text0,
  	    text1,
  	    div1,
  	    text2_value = translate$8('coloring.label'),
  	    text2,
  	    text3,
  	    div3,
  	    div2,
  	    text4_value = translate$8('column'),
  	    text4,
  	    text5,
  	    dropdown0_updating = {},
  	    text6,
  	    div5,
  	    div4,
  	    text7_value = translate$8('coloring.type'),
  	    text7,
  	    text8,
  	    dropdown1_updating = {},
  	    text9,
  	    div7,
  	    div6,
  	    text10_value = translate$8('qualification.label'),
  	    text10,
  	    text11,
  	    dropdown2_updating = {},
  	    text12,
  	    div10,
  	    table,
  	    tr0,
  	    td0,
  	    div8,
  	    text13_value = translate$8('quantities'),
  	    text13,
  	    text14,
  	    td1,
  	    div9,
  	    text15_value = translate$8('gradients'),
  	    text15,
  	    text16,
  	    tr1,
  	    td2,
  	    inputinteger_updating = {},
  	    text17,
  	    td3,
  	    dropdown3_updating = {},
  	    text18,
  	    div17,
  	    div13,
  	    div11,
  	    text19_value = translate$8('coloring.values'),
  	    text19,
  	    text20,
  	    div12,
  	    text21,
  	    text22,
  	    div15,
  	    div14,
  	    text23,
  	    div16,
  	    button0,
  	    text24_value = translate$8('apply'),
  	    text24,
  	    text25,
  	    button1,
  	    text26_value = translate$8('save'),
  	    text26,
  	    text27,
  	    button2,
  	    text28_value = translate$8('cancel'),
  	    text28,
  	    text29,
  	    div18;

  	function onwindowresize(event) {
  		component.adjustHeight(event);	}
  	window.addEventListener("resize", onwindowresize);

  	function onwindowclick(event) {
  		component.hide(event);	}
  	window.addEventListener("click", onwindowclick);

  	var dropdown0_initial_data = {};
  	if (ctx.columnIndex !== void 0) {
  		dropdown0_initial_data.selected = ctx.columnIndex;
  		dropdown0_updating.selected = true;
  	}
  	if (ctx.columnItems !== void 0) {
  		dropdown0_initial_data.items = ctx.columnItems;
  		dropdown0_updating.items = true;
  	}
  	var dropdown0 = new scanexDropdown_cjs({
  		root: component.root,
  		store: component.store,
  		data: dropdown0_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!dropdown0_updating.selected && changed.selected) {
  				newState.columnIndex = childState.selected;
  			}

  			if (!dropdown0_updating.items && changed.items) {
  				newState.columnItems = childState.items;
  			}
  			component._set(newState);
  			dropdown0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		dropdown0._bind({ selected: 1, items: 1 }, dropdown0.get());
  	});

  	dropdown0.on("update", function (event) {
  		component.changeColumn(event);
  	});

  	var dropdown1_initial_data = {};
  	if (ctx.typeIndex !== void 0) {
  		dropdown1_initial_data.selected = ctx.typeIndex;
  		dropdown1_updating.selected = true;
  	}
  	if (ctx.typeItems !== void 0) {
  		dropdown1_initial_data.items = ctx.typeItems;
  		dropdown1_updating.items = true;
  	}
  	var dropdown1 = new scanexDropdown_cjs({
  		root: component.root,
  		store: component.store,
  		data: dropdown1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!dropdown1_updating.selected && changed.selected) {
  				newState.typeIndex = childState.selected;
  			}

  			if (!dropdown1_updating.items && changed.items) {
  				newState.typeItems = childState.items;
  			}
  			component._set(newState);
  			dropdown1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		dropdown1._bind({ selected: 1, items: 1 }, dropdown1.get());
  	});

  	var dropdown2_initial_data = {};
  	if (ctx.qualifierIndex !== void 0) {
  		dropdown2_initial_data.selected = ctx.qualifierIndex;
  		dropdown2_updating.selected = true;
  	}
  	if (ctx.qualificationDisabled !== void 0) {
  		dropdown2_initial_data.disabled = ctx.qualificationDisabled;
  		dropdown2_updating.disabled = true;
  	}
  	if (ctx.qualifiers !== void 0) {
  		dropdown2_initial_data.items = ctx.qualifiers;
  		dropdown2_updating.items = true;
  	}
  	var dropdown2 = new scanexDropdown_cjs({
  		root: component.root,
  		store: component.store,
  		data: dropdown2_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!dropdown2_updating.selected && changed.selected) {
  				newState.qualifierIndex = childState.selected;
  			}

  			if (!dropdown2_updating.disabled && changed.disabled) {
  				newState.qualificationDisabled = childState.disabled;
  			}

  			if (!dropdown2_updating.items && changed.items) {
  				newState.qualifiers = childState.items;
  			}
  			component._set(newState);
  			dropdown2_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		dropdown2._bind({ selected: 1, disabled: 1, items: 1 }, dropdown2.get());
  	});

  	var inputinteger_initial_data = { min: "2", max: "20" };
  	if (ctx.qualificationDisabled !== void 0) {
  		inputinteger_initial_data.disabled = ctx.qualificationDisabled;
  		inputinteger_updating.disabled = true;
  	}
  	if (ctx.quantities !== void 0) {
  		inputinteger_initial_data.value = ctx.quantities;
  		inputinteger_updating.value = true;
  	}
  	var inputinteger = new scanexInputInteger_cjs({
  		root: component.root,
  		store: component.store,
  		data: inputinteger_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger_updating.disabled && changed.disabled) {
  				newState.qualificationDisabled = childState.disabled;
  			}

  			if (!inputinteger_updating.value && changed.value) {
  				newState.quantities = childState.value;
  			}
  			component._set(newState);
  			inputinteger_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger._bind({ disabled: 1, value: 1 }, inputinteger.get());
  	});

  	var dropdown3_initial_data = {};
  	if (ctx.gradientIndex !== void 0) {
  		dropdown3_initial_data.selected = ctx.gradientIndex;
  		dropdown3_updating.selected = true;
  	}
  	if (ctx.qualificationDisabled !== void 0) {
  		dropdown3_initial_data.disabled = ctx.qualificationDisabled;
  		dropdown3_updating.disabled = true;
  	}
  	if (ctx.gradientItems !== void 0) {
  		dropdown3_initial_data.items = ctx.gradientItems;
  		dropdown3_updating.items = true;
  	}
  	var dropdown3 = new scanexDropdown_cjs({
  		root: component.root,
  		store: component.store,
  		data: dropdown3_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!dropdown3_updating.selected && changed.selected) {
  				newState.gradientIndex = childState.selected;
  			}

  			if (!dropdown3_updating.disabled && changed.disabled) {
  				newState.qualificationDisabled = childState.disabled;
  			}

  			if (!dropdown3_updating.items && changed.items) {
  				newState.gradientItems = childState.items;
  			}
  			component._set(newState);
  			dropdown3_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		dropdown3._bind({ selected: 1, disabled: 1, items: 1 }, dropdown3.get());
  	});

  	var each_value = ctx.partition;

  	var each_blocks = [];

  	for (var i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block$5(component, get_each_context$5(ctx, each_value, i));
  	}

  	function click_handler_3(event) {
  		component.fire('apply', { partition: ctx.partition, columns: ctx.columns, columnIndex: ctx.columnIndex });
  	}

  	function click_handler_4(event) {
  		component.fire('save', { partition: ctx.partition, columns: ctx.columns, columnIndex: ctx.columnIndex });
  	}

  	function click_handler_5(event) {
  		component.fire('cancel');
  	}

  	return {
  		c: function c() {
  			div19 = createElement("div");
  			div0 = createElement("div");
  			text0 = createText(ctx.title);
  			text1 = createText("\r\n    ");
  			div1 = createElement("div");
  			text2 = createText(text2_value);
  			text3 = createText("    \r\n    ");
  			div3 = createElement("div");
  			div2 = createElement("div");
  			text4 = createText(text4_value);
  			text5 = createText("\r\n        ");
  			dropdown0._fragment.c();
  			text6 = createText("    \r\n    ");
  			div5 = createElement("div");
  			div4 = createElement("div");
  			text7 = createText(text7_value);
  			text8 = createText("\r\n        ");
  			dropdown1._fragment.c();
  			text9 = createText("\r\n    ");
  			div7 = createElement("div");
  			div6 = createElement("div");
  			text10 = createText(text10_value);
  			text11 = createText("\r\n        ");
  			dropdown2._fragment.c();
  			text12 = createText("\r\n    ");
  			div10 = createElement("div");
  			table = createElement("table");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			div8 = createElement("div");
  			text13 = createText(text13_value);
  			text14 = createText("\r\n                ");
  			td1 = createElement("td");
  			div9 = createElement("div");
  			text15 = createText(text15_value);
  			text16 = createText("\r\n            ");
  			tr1 = createElement("tr");
  			td2 = createElement("td");
  			inputinteger._fragment.c();
  			text17 = createText("\r\n                ");
  			td3 = createElement("td");
  			dropdown3._fragment.c();
  			text18 = createText("\r\n    ");
  			div17 = createElement("div");
  			div13 = createElement("div");
  			div11 = createElement("div");
  			text19 = createText(text19_value);
  			text20 = createText("\r\n            ");
  			div12 = createElement("div");
  			text21 = createText(ctx.count);
  			text22 = createText("\r\n        ");
  			div15 = createElement("div");
  			div14 = createElement("div");

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}

  			text23 = createText("\r\n        ");
  			div16 = createElement("div");
  			button0 = createElement("button");
  			text24 = createText(text24_value);
  			text25 = createText("\r\n            ");
  			button1 = createElement("button");
  			text26 = createText(text26_value);
  			text27 = createText("\r\n            ");
  			button2 = createElement("button");
  			text28 = createText(text28_value);
  			text29 = createText("\r\n    ");
  			div18 = createElement("div");
  			div0.className = "header";
  			div1.className = "label";
  			div2.className = "label";
  			div3.className = "column";
  			div4.className = "label";
  			div5.className = "type";
  			div6.className = "label";
  			div7.className = "qualification";
  			div8.className = "quantities";
  			div9.className = "gradients";
  			td2.className = "quantiles";
  			setAttribute(table, "cellspacing", "0");
  			setAttribute(table, "cellpadding", "0");
  			div10.className = "quantification";
  			div11.className = "label";
  			div12.className = "count";
  			div13.className = "header";
  			div15.className = "content";
  			addListener(button0, "click", click_handler_3);
  			button0.className = "apply";
  			addListener(button1, "click", click_handler_4);
  			button1.className = "save";
  			addListener(button2, "click", click_handler_5);
  			button2.className = "cancel";
  			div16.className = "footer";
  			div17.className = "values";
  			div18.className = "color-picker-container";
  			div19.className = "coloring";
  		},
  		m: function m(target, anchor) {
  			insert(target, div19, anchor);
  			append(div19, div0);
  			append(div0, text0);
  			append(div19, text1);
  			append(div19, div1);
  			append(div1, text2);
  			append(div19, text3);
  			append(div19, div3);
  			append(div3, div2);
  			append(div2, text4);
  			append(div3, text5);
  			dropdown0._mount(div3, null);
  			append(div19, text6);
  			append(div19, div5);
  			append(div5, div4);
  			append(div4, text7);
  			append(div5, text8);
  			dropdown1._mount(div5, null);
  			append(div19, text9);
  			append(div19, div7);
  			append(div7, div6);
  			append(div6, text10);
  			append(div7, text11);
  			dropdown2._mount(div7, null);
  			append(div19, text12);
  			append(div19, div10);
  			append(div10, table);
  			append(table, tr0);
  			append(tr0, td0);
  			append(td0, div8);
  			append(div8, text13);
  			append(tr0, text14);
  			append(tr0, td1);
  			append(td1, div9);
  			append(div9, text15);
  			append(table, text16);
  			append(table, tr1);
  			append(tr1, td2);
  			inputinteger._mount(td2, null);
  			append(tr1, text17);
  			append(tr1, td3);
  			dropdown3._mount(td3, null);
  			append(div19, text18);
  			append(div19, div17);
  			append(div17, div13);
  			append(div13, div11);
  			append(div11, text19);
  			append(div13, text20);
  			append(div13, div12);
  			append(div12, text21);
  			component.refs.header = div13;
  			append(div17, text22);
  			append(div17, div15);
  			append(div15, div14);

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(div14, null);
  			}

  			component.refs.content = div15;
  			append(div17, text23);
  			append(div17, div16);
  			append(div16, button0);
  			append(button0, text24);
  			append(div16, text25);
  			append(div16, button1);
  			append(button1, text26);
  			append(div16, text27);
  			append(div16, button2);
  			append(button2, text28);
  			component.refs.footer = div16;
  			component.refs.values = div17;
  			append(div19, text29);
  			append(div19, div18);
  			component.refs.pickerContainer = div18;
  			component.refs.main = div19;
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.title) {
  				setData(text0, ctx.title);
  			}

  			var dropdown0_changes = {};
  			if (!dropdown0_updating.selected && changed.columnIndex) {
  				dropdown0_changes.selected = ctx.columnIndex;
  				dropdown0_updating.selected = ctx.columnIndex !== void 0;
  			}
  			if (!dropdown0_updating.items && changed.columnItems) {
  				dropdown0_changes.items = ctx.columnItems;
  				dropdown0_updating.items = ctx.columnItems !== void 0;
  			}
  			dropdown0._set(dropdown0_changes);
  			dropdown0_updating = {};

  			var dropdown1_changes = {};
  			if (!dropdown1_updating.selected && changed.typeIndex) {
  				dropdown1_changes.selected = ctx.typeIndex;
  				dropdown1_updating.selected = ctx.typeIndex !== void 0;
  			}
  			if (!dropdown1_updating.items && changed.typeItems) {
  				dropdown1_changes.items = ctx.typeItems;
  				dropdown1_updating.items = ctx.typeItems !== void 0;
  			}
  			dropdown1._set(dropdown1_changes);
  			dropdown1_updating = {};

  			var dropdown2_changes = {};
  			if (!dropdown2_updating.selected && changed.qualifierIndex) {
  				dropdown2_changes.selected = ctx.qualifierIndex;
  				dropdown2_updating.selected = ctx.qualifierIndex !== void 0;
  			}
  			if (!dropdown2_updating.disabled && changed.qualificationDisabled) {
  				dropdown2_changes.disabled = ctx.qualificationDisabled;
  				dropdown2_updating.disabled = ctx.qualificationDisabled !== void 0;
  			}
  			if (!dropdown2_updating.items && changed.qualifiers) {
  				dropdown2_changes.items = ctx.qualifiers;
  				dropdown2_updating.items = ctx.qualifiers !== void 0;
  			}
  			dropdown2._set(dropdown2_changes);
  			dropdown2_updating = {};

  			var inputinteger_changes = {};
  			if (!inputinteger_updating.disabled && changed.qualificationDisabled) {
  				inputinteger_changes.disabled = ctx.qualificationDisabled;
  				inputinteger_updating.disabled = ctx.qualificationDisabled !== void 0;
  			}
  			if (!inputinteger_updating.value && changed.quantities) {
  				inputinteger_changes.value = ctx.quantities;
  				inputinteger_updating.value = ctx.quantities !== void 0;
  			}
  			inputinteger._set(inputinteger_changes);
  			inputinteger_updating = {};

  			var dropdown3_changes = {};
  			if (!dropdown3_updating.selected && changed.gradientIndex) {
  				dropdown3_changes.selected = ctx.gradientIndex;
  				dropdown3_updating.selected = ctx.gradientIndex !== void 0;
  			}
  			if (!dropdown3_updating.disabled && changed.qualificationDisabled) {
  				dropdown3_changes.disabled = ctx.qualificationDisabled;
  				dropdown3_updating.disabled = ctx.qualificationDisabled !== void 0;
  			}
  			if (!dropdown3_updating.items && changed.gradientItems) {
  				dropdown3_changes.items = ctx.gradientItems;
  				dropdown3_updating.items = ctx.gradientItems !== void 0;
  			}
  			dropdown3._set(dropdown3_changes);
  			dropdown3_updating = {};

  			if (changed.count) {
  				setData(text21, ctx.count);
  			}

  			if (changed.partition) {
  				each_value = ctx.partition;

  				for (var i = 0; i < each_value.length; i += 1) {
  					var child_ctx = get_each_context$5(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(changed, child_ctx);
  					} else {
  						each_blocks[i] = create_each_block$5(component, child_ctx);
  						each_blocks[i].c();
  						each_blocks[i].m(div14, null);
  					}
  				}

  				for (; i < each_blocks.length; i += 1) {
  					each_blocks[i].d(1);
  				}
  				each_blocks.length = each_value.length;
  			}
  		},
  		d: function d(detach) {
  			window.removeEventListener("resize", onwindowresize);

  			window.removeEventListener("click", onwindowclick);

  			if (detach) {
  				detachNode(div19);
  			}

  			dropdown0.destroy();
  			dropdown1.destroy();
  			dropdown2.destroy();
  			inputinteger.destroy();
  			dropdown3.destroy();
  			if (component.refs.header === div13) component.refs.header = null;

  			destroyEach(each_blocks, detach);

  			if (component.refs.content === div15) component.refs.content = null;
  			removeListener(button0, "click", click_handler_3);
  			removeListener(button1, "click", click_handler_4);
  			removeListener(button2, "click", click_handler_5);
  			if (component.refs.footer === div16) component.refs.footer = null;
  			if (component.refs.values === div17) component.refs.values = null;
  			if (component.refs.pickerContainer === div18) component.refs.pickerContainer = null;
  			if (component.refs.main === div19) component.refs.main = null;
  		}
  	};
  }

  // (50:24) {#if p.high}
  function create_if_block$7(component, ctx) {
  	var div1,
  	    text1,
  	    div3,
  	    div2,
  	    text2_value = fmt(ctx.p.high),
  	    text2;

  	return {
  		c: function c() {
  			div1 = createElement("div");
  			div1.innerHTML = '<div class="separator">\u2014</div>';
  			text1 = createText("                    \r\n                        ");
  			div3 = createElement("div");
  			div2 = createElement("div");
  			text2 = createText(text2_value);
  			div1.className = "separator-container";
  			div2.className = "high";
  			div3.className = "high-container";
  		},
  		m: function m(target, anchor) {
  			insert(target, div1, anchor);
  			insert(target, text1, anchor);
  			insert(target, div3, anchor);
  			append(div3, div2);
  			append(div2, text2);
  		},
  		p: function p(changed, ctx) {
  			if (changed.partition && text2_value !== (text2_value = fmt(ctx.p.high))) {
  				setData(text2, text2_value);
  			}
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(div1);
  				detachNode(text1);
  				detachNode(div3);
  			}
  		}
  	};
  }

  // (44:16) {#each partition as p, i}
  function create_each_block$5(component, ctx) {
  	var div6,
  	    div2,
  	    div1,
  	    div0,
  	    text0_value = fmt(ctx.p.low),
  	    text0,
  	    text1,
  	    text2,
  	    div5,
  	    div3,
  	    raw_value = color_cell(ctx.p.color),
  	    text3,
  	    div4;

  	var if_block = ctx.p.high && create_if_block$7(component, ctx);

  	return {
  		c: function c() {
  			div6 = createElement("div");
  			div2 = createElement("div");
  			div1 = createElement("div");
  			div0 = createElement("div");
  			text0 = createText(text0_value);
  			text1 = createText("\r\n                        ");
  			if (if_block) if_block.c();
  			text2 = createText("                    \r\n                    ");
  			div5 = createElement("div");
  			div3 = createElement("div");
  			text3 = createText("\r\n                        ");
  			div4 = createElement("div");
  			div4.innerHTML = '<i></i>';
  			div0.className = "low";
  			toggleClass(div0, "both", ctx.p.high);
  			div1.className = "low-container";

  			div2._svelte = { component: component, ctx: ctx };

  			addListener(div2, "click", click_handler$4);
  			div2.className = "fields";

  			div3._svelte = { component: component, ctx: ctx };

  			addListener(div3, "click", click_handler_1$2);
  			div3.className = "preview";

  			div4._svelte = { component: component, ctx: ctx };

  			addListener(div4, "click", click_handler_2$1);
  			div4.className = "remove";
  			toggleClass(div4, "editable", ctx.editable);
  			div5.className = "controls";

  			div6._svelte = { component: component, ctx: ctx };

  			addListener(div6, "mouseleave", mouseleave_handler$1);
  			div6.className = "row";
  			toggleClass(div6, "even", ctx.i % 2 === 0);
  		},
  		m: function m(target, anchor) {
  			insert(target, div6, anchor);
  			append(div6, div2);
  			append(div2, div1);
  			append(div1, div0);
  			append(div0, text0);
  			append(div2, text1);
  			if (if_block) if_block.m(div2, null);
  			append(div6, text2);
  			append(div6, div5);
  			append(div5, div3);
  			div3.innerHTML = raw_value;
  			append(div5, text3);
  			append(div5, div4);
  		},
  		p: function p(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.partition && text0_value !== (text0_value = fmt(ctx.p.low))) {
  				setData(text0, text0_value);
  			}

  			if (changed.partition) {
  				toggleClass(div0, "both", ctx.p.high);
  			}

  			if (ctx.p.high) {
  				if (if_block) {
  					if_block.p(changed, ctx);
  				} else {
  					if_block = create_if_block$7(component, ctx);
  					if_block.c();
  					if_block.m(div2, null);
  				}
  			} else if (if_block) {
  				if_block.d(1);
  				if_block = null;
  			}

  			div2._svelte.ctx = ctx;
  			if (changed.partition && raw_value !== (raw_value = color_cell(ctx.p.color))) {
  				div3.innerHTML = raw_value;
  			}

  			div3._svelte.ctx = ctx;
  			div4._svelte.ctx = ctx;
  			if (changed.editable) {
  				toggleClass(div4, "editable", ctx.editable);
  			}

  			div6._svelte.ctx = ctx;
  		},
  		d: function d(detach) {
  			if (detach) {
  				detachNode(div6);
  			}

  			if (if_block) if_block.d();
  			removeListener(div2, "click", click_handler$4);
  			removeListener(div3, "click", click_handler_1$2);
  			removeListener(div4, "click", click_handler_2$1);
  			removeListener(div6, "mouseleave", mouseleave_handler$1);
  		}
  	};
  }

  function Coloring(options) {
  	var _this5 = this;

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$h(), options.data);

  	this._recompute({ columns: 1, gradients: 1, typeIndex: 1, columnIndex: 1 }, this._state);
  	this._intro = true;
  	this._handlers.update = [onupdate$9];

  	this._fragment = create_main_fragment$h(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate$4.call(_this5);
  		_this5.fire("update", { changed: assignTrue({}, _this5._state), current: _this5._state });
  	});

  	if (options.target) {
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}
  }

  assign(Coloring.prototype, proto);
  assign(Coloring.prototype, methods$c);

  Coloring.prototype._recompute = function _recompute(changed, state) {
  	if (changed.columns) {
  		if (this._differs(state.columnItems, state.columnItems = columnItems(state))) changed.columnItems = true;
  	}

  	if (changed.gradients) {
  		if (this._differs(state.gradientItems, state.gradientItems = gradientItems(state))) changed.gradientItems = true;
  	}

  	if (changed.typeIndex) {
  		if (this._differs(state.qualificationDisabled, state.qualificationDisabled = qualificationDisabled(state))) changed.qualificationDisabled = true;
  	}

  	if (changed.columns || changed.columnIndex) {
  		if (this._differs(state.validate, state.validate = validate(state))) changed.validate = true;
  	}
  };

  setup$1(Coloring);

  scanexTranslations_cjs.addText('eng', {
      style: {
          new: 'New style',
          default: 'Unnamed style'
      }
  });

  scanexTranslations_cjs.addText('rus', {
      style: {
          new: 'Новый стиль',
          default: 'Стиль без имени'
      }
  });

  var translate$9 = scanexTranslations_cjs.getText.bind(scanexTranslations_cjs);

  window.nsGmx = window.nsGmx || {};

  var pluginName = 'GmxStyler';
  var editor = null;
  var editorContainer = null;
  var coloring = null;
  var coloringContainer = null;
  var prevStyles = [];

  var create_editor = function create_editor(layerId, styleIndex, initialStyles) {
      var layer = nsGmx.gmxMap.layersByID[layerId];
      var layersTreeContainer = nsGmx.layersTreePane.children[0];
      layersTreeContainer.style.display = 'none';

      editorContainer = document.createElement('div');
      editorContainer.className = 'gmx-styler';
      nsGmx.layersTreePane.appendChild(editorContainer);

      var gmxProps = layer.getGmxProperties && layer.getGmxProperties();
      var attributes = gmxProps.attributes,
          attrTypes = gmxProps.attrTypes,
          GeometryType = gmxProps.GeometryType,
          title = gmxProps.title;

      var legendFields = attributes.slice();
      legendFields.unshift('');

      var styles = initialStyles ? initialStyles.slice() : layer.getStyles().map(function (s) {
          return style_from_gmx(s, GeometryType);
      });
      editor = new Editor({
          target: editorContainer,
          data: {
              fonts: ['Roboto'],
              geometryType: GeometryType,
              legendFields: legendFields,
              styles: styles,
              selected: styleIndex,
              title: title
          }
      });
      editor.on('state', function (_ref) {
          var changed = _ref.changed,
              current = _ref.current;

          if (!changed.selected || changed.styles) {
              Object.keys(DEFAULT_STYLE).forEach(function (k) {
                  if (changed[k] && current.styles[current.selected].hasOwnProperty(k)) {
                      current.styles[current.selected][k] = current[k];
                  }
              });
              var _styles = current.styles.map(function (s) {
                  return style_from_editor(s, GeometryType);
              });
              layer.setStyles(_styles);
              var oldStyles = _styles.map(style_to_old);
              var props = _extends({}, gmxProps, { styles: oldStyles });
              var div = $(window._queryMapLayers.buildedTree).find('div[LayerID=\'' + gmxProps.name + '\']')[0];
              window._layersTree.findTreeElem(div).elem.content.properties = props;
              window._mapHelper.updateTreeStyles(oldStyles, div, window._layersTree);
          }
      });
      editor.on('close', function () {
          nsGmx.layersTreePane.removeChild(editorContainer);
          editor = null;
          layersTreeContainer.style.display = 'block';
      });
      editor.on('coloring', function () {
          var _editor$get = editor.get(),
              styles = _editor$get.styles;

          prevStyles = styles.slice();
          editor = null;
          nsGmx.layersTreePane.removeChild(editorContainer);
          create_coloring(layerId);
      });
  };

  var fmt_value = function fmt_value(x) {
      switch (typeof x === 'undefined' ? 'undefined' : _typeof(x)) {
          case 'number':
              return Math.round(x);
          default:
              return x;
      }
  };

  var partition_to_styles = function partition_to_styles(partition, column, type) {
      var count = partition.length;
      return partition.map(function (_ref2, i) {
          var low = _ref2.low,
              high = _ref2.high,
              color = _ref2.color;

          var s = _extends({}, DEFAULT_STYLE);
          s.name = high ? fmt_value(low) + ' - ' + fmt_value(high) : '' + fmt_value(low);
          s.decorationFill = color;
          s.useDecorationFill = true;
          s.decorationOutlineSize = 0;
          var rho = i === count - 1 ? '<=' : '<';
          switch (type) {
              case 'integer':
              case 'float':
                  s.filter = high ? '[' + column + '] >= ' + low + ' AND [' + column + '] ' + rho + ' ' + high : '[' + column + '] = ' + low;
                  break;
              case 'string':
              case 'datetime':
                  s.filter = high ? '[' + column + '] >= \'' + low + '\' AND [' + column + '] ' + rho + ' \'' + high + '\'' : '[' + column + '] = \'' + low + '\'';
                  break;
              default:
                  break;
          }
          return s;
      });
  };

  var create_coloring = function create_coloring(layerId) {
      var layer = nsGmx.gmxMap.layersByID[layerId];
      var layersTreeContainer = nsGmx.layersTreePane.children[0];
      layersTreeContainer.style.display = 'none';

      coloringContainer = document.createElement('div');
      coloringContainer.className = 'gmx-styler-coloring';
      nsGmx.layersTreePane.appendChild(coloringContainer);

      var gmxProps = layer.getGmxProperties && layer.getGmxProperties();
      var attributes = gmxProps.attributes,
          attrTypes = gmxProps.attrTypes,
          GeometryType = gmxProps.GeometryType,
          title = gmxProps.title;

      var columns = attributes.map(function (x, i) {
          return { name: x, type: attrTypes[i] };
      });

      coloring = new Coloring({
          data: {
              columns: columns,
              title: title
          },
          layerID: layerId,
          target: coloringContainer
      });
      coloring.on('apply', function (_ref3) {
          var partition = _ref3.partition,
              columns = _ref3.columns,
              columnIndex = _ref3.columnIndex;
          var _columns$columnIndex = columns[columnIndex],
              name = _columns$columnIndex.name,
              type = _columns$columnIndex.type;

          var editorStyles = partition_to_styles(partition, name, type);
          var styles = editorStyles.map(function (s) {
              return style_from_editor(s, GeometryType);
          });
          layer.setStyles(styles);
          // const oldStyles = styles.map(style_to_old);
          // const props = {...gmxProps, ...{styles: oldStyles}};
          // const div = $(window._queryMapLayers.buildedTree).find(`div[LayerID='${gmxProps.name}']`)[0];
          // window._layersTree.findTreeElem(div).elem.content.properties = props;            
          // window._mapHelper.updateTreeStyles(oldStyles, div, window._layersTree);
      });
      coloring.on('save', function (_ref4) {
          var partition = _ref4.partition,
              columns = _ref4.columns,
              columnIndex = _ref4.columnIndex;

          nsGmx.layersTreePane.removeChild(coloringContainer);
          coloringContainer = null;
          coloring = null;
          layersTreeContainer.style.display = 'block';

          var _columns$columnIndex2 = columns[columnIndex],
              name = _columns$columnIndex2.name,
              type = _columns$columnIndex2.type;

          var editorStyles = partition_to_styles(partition, name, type);
          create_editor(layerId, 0, editorStyles);

          var styles = editorStyles.map(function (s) {
              return style_from_editor(s, GeometryType);
          });
          layer.setStyles(styles);
          var oldStyles = styles.map(style_to_old);
          var props = _extends({}, gmxProps, { styles: oldStyles });
          var div = $(window._queryMapLayers.buildedTree).find('div[LayerID=\'' + gmxProps.name + '\']')[0];
          window._layersTree.findTreeElem(div).elem.content.properties = props;
          window._mapHelper.updateTreeStyles(oldStyles, div, window._layersTree);
      });
      coloring.on('cancel', function () {
          nsGmx.layersTreePane.removeChild(coloringContainer);
          coloring = null;
          coloringContainer = null;
          layersTreeContainer.style.display = 'block';

          create_editor(layerId, 0, prevStyles);
          var styles = prevStyles.map(function (s) {
              return style_from_editor(s, GeometryType);
          });
          layer.setStyles(styles);
          var oldStyles = styles.map(style_to_old);
          var props = _extends({}, gmxProps, { styles: oldStyles });
          var div = $(window._queryMapLayers.buildedTree).find('div[LayerID=\'' + gmxProps.name + '\']')[0];
          window._layersTree.findTreeElem(div).elem.content.properties = props;
          window._mapHelper.updateTreeStyles(oldStyles, div, window._layersTree);
      });
  };

  var publicInterface = {
      pluginName: pluginName,
      afterViewer: function afterViewer(params, map) {
          if (window.nsGmx) {

              // window.nsGmx.gmxMap.layers.forEach(layer => {
              //     console.log(layer);
              //     // styleEditor.setHoverStyle(layer);
              // });

              // nsGmx.leafletMap.on('layeradd', e => {
              //     const layer = e.layer;
              //     console.log(layer);
              //     // styleEditor.setHoverStyle(layer);
              // });

              // replace existing LayersStylesEditor function
              var pluginPath = gmxCore.getModulePath(pluginName);
              window.gmxCore.loadScript(pluginPath + 'ckeditor/ckeditor.js').done(function () {
                  nsGmx.createStylesDialog = function (treeElem, treeView, styleIndex) {
                      var layerId = treeElem.name;
                      create_editor(layerId, styleIndex || 0);
                  };
              });
          }
      },
      unload: function unload() {
          if (editor) {
              editor.destroy();
          }
      }
  };

  if (window.gmxCore) {
      var pluginPath = gmxCore.getModulePath(pluginName);
      window.gmxCore.addModule(pluginName, publicInterface, {
          css: 'gmx-styler.css',
          init: function init(module, path) {}
      });
  } else {
      window.nsGmx[pluginName] = publicInterface;
  }

}());
//# sourceMappingURL=gmx-styler.js.map
