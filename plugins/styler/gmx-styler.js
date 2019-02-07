(function () {
  'use strict';

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

  function reinsertBefore(after, target) {
  	var parent = after.parentNode;
  	while (parent.firstChild !== after) {
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

  function selectOption(select, value) {
  	for (var i = 0; i < select.options.length; i += 1) {
  		var option = select.options[i];

  		if (option.__value === value) {
  			option.selected = true;
  			return;
  		}
  	}
  }

  function selectValue(select) {
  	var selectedOption = select.querySelector(':checked') || select.options[0];
  	return selectedOption && selectedOption.__value;
  }

  function toggleClass(element, name, toggle) {
  	element.classList.toggle(name, !!toggle);
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

  /* node_modules\scanex-tabs\src\Tab.html generated by Svelte v2.15.3 */

  function data() {
      return {
          id: null,
          title: '',
          icon: ''            
      };
  }
  const file = "node_modules\\scanex-tabs\\src\\Tab.html";

  function create_main_fragment(component, ctx) {
  	var li, slot_content_default = component._slotted.default, current;

  	function click_handler(event) {
  		component.fire('click', ctx.id);
  	}

  	return {
  		c: function create() {
  			li = createElement("li");
  			addListener(li, "click", click_handler);
  			li.className = "tab";
  			li.dataset.id = ctx.id;
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
  			if (changed.id) {
  				li.dataset.id = ctx.id;
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
  	if (!options || (!options.target && !options.root)) {
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

  Tab.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  /* node_modules\scanex-tabs\src\Tabs.html generated by Svelte v2.15.3 */



  function data$1() {
      return {
          tabs: [],
          index: 0,
      };
  }
  var methods = {
      createTabs () {
          const children$$1 = this.refs.panels.children;        
          let tabs = [];
          for (let i = 0; i < children$$1.length; ++i) {
              const c = children$$1[i];                
              const id = c.getAttribute('data-id');
              const title = c.getAttribute('data-title');
              const icon = c.getAttribute('data-icon');
              tabs.push ({id, title, icon});
          }
          const { index } = this.get();
          this.set ({tabs, index});
      },
      update () {
          const panels = this.refs.panels && this.refs.panels.children;
          if (panels) {
              const tabs = this.refs.tabs.children;
              const { index } = this.get();
              for (let i = 0; i < panels.length; ++i) {
                  const p = panels[i];                                                
                  const t = tabs[i];
                  if (i == index) {
                      p.style.display = 'inline-block';
                      t.classList.add('selected');
                  }
                  else {
                      p.style.display = 'none';
                      t.classList.remove('selected');
                  }
              }
          }
      }
  };

  function oncreate() {            
      this.createTabs();
      this.update();
  }
  function onstate({changed, current}) {            
      if (changed.index) {
          this.update();
      }
  }
  const file$1 = "node_modules\\scanex-tabs\\src\\Tabs.html";

  function get_each_context(ctx, list, i) {
  	const child_ctx = Object.create(ctx);
  	child_ctx.tab = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function create_main_fragment$1(component, ctx) {
  	var div, ul0, each_blocks_1 = [], each_lookup = blankObject(), text, ul1, slot_content_default = component._slotted.default, current;

  	var each_value = ctx.tabs;

  	const get_key = ctx => ctx.tab.id;

  	for (var i = 0; i < each_value.length; i += 1) {
  		let child_ctx = get_each_context(ctx, each_value, i);
  		let key = get_key(child_ctx);
  		each_blocks_1[i] = each_lookup[key] = create_each_block(component, key, child_ctx);
  	}

  	return {
  		c: function create() {
  			div = createElement("div");
  			ul0 = createElement("ul");

  			for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].c();

  			text = createText("\r\n    ");
  			ul1 = createElement("ul");
  			ul0.className = "tabs";
  			addLoc(ul0, file$1, 1, 4, 31);
  			ul1.className = "panels";
  			addLoc(ul1, file$1, 12, 4, 370);
  			div.className = "tabs-widget";
  			addLoc(div, file$1, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(div, ul0);

  			for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].i(ul0, null);

  			component.refs.tabs = ul0;
  			append(div, text);
  			append(div, ul1);

  			if (slot_content_default) {
  				append(ul1, slot_content_default);
  			}

  			component.refs.panels = ul1;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			const each_value = ctx.tabs;
  			each_blocks_1 = updateKeyedEach(each_blocks_1, component, changed, get_key, 1, ctx, each_value, each_lookup, ul0, outroAndDestroyBlock, create_each_block, "i", null, get_each_context);
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			const countdown = callAfter(outrocallback, each_blocks_1.length);
  			for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].o(countdown);

  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			for (i = 0; i < each_blocks_1.length; i += 1) each_blocks_1[i].d();

  			if (component.refs.tabs === ul0) component.refs.tabs = null;

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
  			addLoc(i, file$1, 7, 12, 275);
  		},

  		m: function mount(target, anchor) {
  			insert(target, i, anchor);
  		},

  		p: function update(changed, ctx) {
  			if ((changed.tabs) && i_class_value !== (i_class_value = ctx.tab.icon)) {
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
  	var span, text_value = ctx.tab.title, text;

  	return {
  		c: function create() {
  			span = createElement("span");
  			text = createText(text_value);
  			addLoc(span, file$1, 5, 12, 205);
  		},

  		m: function mount(target, anchor) {
  			insert(target, span, anchor);
  			append(span, text);
  		},

  		p: function update(changed, ctx) {
  			if ((changed.tabs) && text_value !== (text_value = ctx.tab.title)) {
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

  	tab.on("click", function(event) {
  		component.set({index: ctx.i});
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
  	this._debugName = '<Tabs>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$1(), options.data);
  	if (!('tabs' in this._state)) console.warn("<Tabs> was created without expected data property 'tabs'");
  	this._intro = !!options.intro;

  	this._handlers.state = [onstate];

  	this._slotted = options.slots || {};

  	onstate.call(this, { changed: assignTrue({}, this._state), current: this._state });

  	this._fragment = create_main_fragment$1(this, this._state);

  	this.root._oncreate.push(() => {
  		oncreate.call(this);
  		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
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
  assign(Tabs.prototype, methods);

  Tabs.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  /* node_modules\scanex-tabs\src\Panel.html generated by Svelte v2.15.3 */

  function data$2() {
      return {
          id: null,                
          title: '',
          icon: ''
      };
  }
  const file$2 = "node_modules\\scanex-tabs\\src\\Panel.html";

  function create_main_fragment$2(component, ctx) {
  	var li, slot_content_default = component._slotted.default, current;

  	return {
  		c: function create() {
  			li = createElement("li");
  			li.className = "panel";
  			li.dataset.id = ctx.id;
  			li.dataset.title = ctx.title;
  			li.dataset.icon = ctx.icon;
  			addLoc(li, file$2, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, li, anchor);

  			if (slot_content_default) {
  				append(li, slot_content_default);
  			}

  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (changed.id) {
  				li.dataset.id = ctx.id;
  			}

  			if (changed.title) {
  				li.dataset.title = ctx.title;
  			}

  			if (changed.icon) {
  				li.dataset.icon = ctx.icon;
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
  		}
  	};
  }

  function Panel(options) {
  	this._debugName = '<Panel>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$2(), options.data);
  	if (!('id' in this._state)) console.warn("<Panel> was created without expected data property 'id'");
  	if (!('title' in this._state)) console.warn("<Panel> was created without expected data property 'title'");
  	if (!('icon' in this._state)) console.warn("<Panel> was created without expected data property 'icon'");
  	this._intro = !!options.intro;

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$2(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}

  	this._intro = true;
  }

  assign(Panel.prototype, protoDev);

  Panel.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  const copy = source => {
      switch(typeof source) {
          case 'number':
          case 'string':
          case 'function':
          default:
              return source;
          case 'object':
              if (source === null) {
                  return null;
              }
              else if (Array.isArray(source)) {
                  return source.map (item => copy (item));
              }
              else if (source instanceof Date) {
                  return source;
              }
              else {                
                  return Object.keys(source).reduce((a, k) => {                    
                      a[k] = copy(source[k]);
                      return a;
                  }, {});
              }
      }
  };

  const extend = (target, source) => {
      if (target === source) {
  	    return target;
      }
      else {
          return Object.keys(source).reduce((a, k) => {
              let value = source[k];
              if(typeof a[k] === 'object' && (k in a)){
                  a[k] = extend (a[k], value);
              }
              else {
                 a[k] = copy(value);
              }
              return a;
          }, copy (target));
      }    
  };

  const DEFAULT_LANGUAGE = 'rus';

  class Translations {
      constructor(){
          this._hash = {};
      }    
      setLanguage (lang) {
          this._language = lang;
      }
      getLanguage () {
          return window.language || this._language || DEFAULT_LANGUAGE;
      }
      addText (lang, tran) {        
          this._hash[lang]= extend(this._hash[lang] || {}, tran);
          return this;
      }
      getText (key) {
          if(key && typeof key === 'string') {
              let locale = this._hash[this.getLanguage()];
              if (locale) {
                  return key
                      .split('.')
                      .reduce((a, k) => a[k], locale);
              }         
          }
          return null;
      }
  }

  window.Scanex = window.Scanex || {};
  window.Scanex.Translations = window.Scanex.Translations || {};
  window.Scanex.translations = window.Scanex.translations || new Translations();

  var Translations$1 = window.Scanex.translations;

  /* src\Headline\Headline.html generated by Svelte v2.15.3 */

  var file$3 = "src\\Headline\\Headline.html";

  function create_main_fragment$3(component, ctx) {
  	var div, i, current;

  	function click_handler(event) {
  		component.fire('close');
  	}

  	return {
  		c: function create() {
  			div = createElement("div");
  			i = createElement("i");
  			addListener(i, "click", click_handler);
  			i.className = "style-editor-icon close";
  			addLoc(i, file$3, 1, 4, 24);
  			div.className = "head";
  			addLoc(div, file$3, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			append(div, i);
  			current = true;
  		},

  		p: noop,

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}

  			removeListener(i, "click", click_handler);
  		}
  	};
  }

  function Headline(options) {
  	this._debugName = '<Headline>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign({}, options.data);
  	this._intro = !!options.intro;

  	this._fragment = create_main_fragment$3(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}

  	this._intro = true;
  }

  assign(Headline.prototype, protoDev);

  Headline.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\Preview.html generated by Svelte v2.15.3 */

  function data$3() {
  	return {
  		line: '#0000ff',
  		fill: '#fff',
  		sql: ''
  	};
  }
  var methods$1 = {
  	update: function update() {
  		var _get = this.get(),
  		    line = _get.line,
  		    fill = _get.fill;

  		this.refs.color.style.border = '1px solid ' + line;
  		this.refs.color.style.backGroundColor = '' + fill;
  	}
  };

  function oncreate$1() {
  	// this.update();
  }
  function onstate$1(_ref) {
  	var changed = _ref.changed,
  	    current = _ref.current;

  	if (this.refs.color && (changed.line || changed.fill)) {
  		this.update();
  	}
  }
  var file$4 = "src\\Preview.html";

  function add_css() {
  	var style = createElement("style");
  	style.id = 'svelte-1sw5olu-style';
  	style.textContent = ".svelte-ref-main.svelte-1sw5olu{list-style-type:none;margin:0px;padding:0px}.svelte-ref-color.svelte-1sw5olu,.svelte-ref-sql.svelte-1sw5olu{display:inline-block}.svelte-ref-color.svelte-1sw5olu{width:18px;height:18px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJldmlldy5odG1sIiwic291cmNlcyI6WyJQcmV2aWV3Lmh0bWwiXSwic291cmNlc0NvbnRlbnQiOlsiPHVsIHJlZjptYWluPlxyXG4gICAgPGxpIHJlZjpjb2xvcj4mbmJzcDs8L2xpPlxyXG4gICAgPGxpIHJlZjpzcWw+e3NxbH08L2xpPlxyXG48L3VsPlxyXG5cclxuPHN0eWxlPlxyXG4gICAgcmVmOm1haW4ge1xyXG4gICAgICAgIGxpc3Qtc3R5bGUtdHlwZTogbm9uZTtcclxuICAgICAgICBtYXJnaW46IDBweDtcclxuICAgICAgICBwYWRkaW5nOiAwcHg7XHJcbiAgICB9XHJcbiAgICByZWY6Y29sb3IsXHJcbiAgICByZWY6c3FsIHtcclxuICAgICAgICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XHJcbiAgICB9XHJcbiAgICByZWY6Y29sb3Ige1xyXG4gICAgICAgIHdpZHRoOiAxOHB4O1xyXG4gICAgICAgIGhlaWdodDogMThweDtcclxuICAgIH1cclxuPC9zdHlsZT5cclxuXHJcbjxzY3JpcHQ+XHJcbiAgICBleHBvcnQgZGVmYXVsdCB7XHJcbiAgICAgICAgZGF0YSAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBsaW5lOiAnIzAwMDBmZicsXHJcbiAgICAgICAgICAgICAgICBmaWxsOiAnI2ZmZicsXHJcbiAgICAgICAgICAgICAgICBzcWw6ICcnXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbmNyZWF0ZSAoKSB7XHJcbiAgICAgICAgICAgIC8vIHRoaXMudXBkYXRlKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbnN0YXRlICh7Y2hhbmdlZCwgY3VycmVudH0pIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMucmVmcy5jb2xvciAmJiAoY2hhbmdlZC5saW5lIHx8IGNoYW5nZWQuZmlsbCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlKCk7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICBcclxuICAgICAgICB9LFxyXG4gICAgICAgIG1ldGhvZHM6IHtcclxuICAgICAgICAgICAgdXBkYXRlICgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHtsaW5lLCBmaWxsfSA9IHRoaXMuZ2V0KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlZnMuY29sb3Iuc3R5bGUuYm9yZGVyID0gYDFweCBzb2xpZCAke2xpbmV9YDtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVmcy5jb2xvci5zdHlsZS5iYWNrR3JvdW5kQ29sb3IgPSBgJHtmaWxsfWA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG48L3NjcmlwdD4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBTUksK0JBQVMsQ0FBQyxBQUNOLGVBQWUsQ0FBRSxJQUFJLENBQ3JCLE1BQU0sQ0FBRSxHQUFHLENBQ1gsT0FBTyxDQUFFLEdBQUcsQUFDaEIsQ0FBQyxBQUNELGdDQUFTLENBQ1QsOEJBQVEsQ0FBQyxBQUNMLE9BQU8sQ0FBRSxZQUFZLEFBQ3pCLENBQUMsQUFDRCxnQ0FBVSxDQUFDLEFBQ1AsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsSUFBSSxBQUNoQixDQUFDIn0= */";
  	append(document.head, style);
  }

  function create_main_fragment$4(component, ctx) {
  	var ul, li0, text1, li1, text2, current;

  	return {
  		c: function create() {
  			ul = createElement("ul");
  			li0 = createElement("li");
  			li0.textContent = " ";
  			text1 = createText("\r\n    ");
  			li1 = createElement("li");
  			text2 = createText(ctx.sql);
  			li0.className = "svelte-1sw5olu svelte-ref-color";
  			addLoc(li0, file$4, 1, 4, 19);
  			li1.className = "svelte-1sw5olu svelte-ref-sql";
  			addLoc(li1, file$4, 2, 4, 50);
  			ul.className = "svelte-1sw5olu svelte-ref-main";
  			addLoc(ul, file$4, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, ul, anchor);
  			append(ul, li0);
  			component.refs.color = li0;
  			append(ul, text1);
  			append(ul, li1);
  			append(li1, text2);
  			component.refs.sql = li1;
  			component.refs.main = ul;
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (changed.sql) {
  				setData(text2, ctx.sql);
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(ul);
  			}

  			if (component.refs.color === li0) component.refs.color = null;
  			if (component.refs.sql === li1) component.refs.sql = null;
  			if (component.refs.main === ul) component.refs.main = null;
  		}
  	};
  }

  function Preview(options) {
  	var _this = this;

  	this._debugName = '<Preview>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$3(), options.data);
  	if (!('sql' in this._state)) console.warn("<Preview> was created without expected data property 'sql'");
  	this._intro = !!options.intro;

  	this._handlers.state = [onstate$1];

  	if (!document.getElementById("svelte-1sw5olu-style")) add_css();

  	onstate$1.call(this, { changed: assignTrue({}, this._state), current: this._state });

  	this._fragment = create_main_fragment$4(this, this._state);

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

  assign(Preview.prototype, protoDev);
  assign(Preview.prototype, methods$1);

  Preview.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  const stringToArray = str => {
      let arr = [];
      for (let i = 0; i < str.length; ++i) {
          arr.push (str.charAt(i));
      }
      return arr;
  };

  const pad = (origin, str, width, sym) => {
      let s = stringToArray (str);
      for (let i = 0; s.length < width; ++i) {
          if (origin === 'left') {
              s.splice (0, 0, sym);
          }
          else {
              s.push (sym);
          }
      }
      return s.join('');
  };

  const padLeft = (str, sym, width) => pad ('left', str, width, sym);

  const hsl2rgb = (h, s, l) => {
      let q;
      if (l < 0.5) {
          q =  l * (1.0 + s);
      }
      else if (l >= 0.5) {
          q = l + s - l * s;
      }
      let p = 2.0 * l - q;
      let hk = h / 360;
      const norm = tc => {
          if (tc < 0) return tc + 1.0;
          if (tc > 1) return tc - 1.0;
          return tc;
      };
      let tr = norm (hk + 1 / 3);
      let tg = norm (hk);
      let tb = norm (hk - 1 / 3);

      const color = tc => {
          if (tc < 1 / 6) {
              return p + ((q - p) * 6.0 * tc);
          }
          if (1 / 6 <= tc && tc < 1 / 2) {
              return q;
          }
          if (1 / 2 <= tc && tc < 2 / 3) {
              return p + ((q- p) * (2 / 3 - tc) * 6.0);
          }
          return p;
      };

      return {
          r: Math.round (color (tr) * 255),
          g: Math.round (color (tg) * 255),
          b: Math.round (color (tb) * 255)
      };
  };

  const rgb2hsl = (R, G, B) => {
      let r = R / 255, g = G / 255, b = B / 255;
      let max = Math.max (r, g, b);
      let min = Math.min (r, g, b);
      let h;
      if (max == min) {
          h = undefined;
      }
      else if (max == r && g >= b) {
          h = 60 * (g - b) / (max - min);
      }
      else if (max == r && g < b) {
          h = 60 * (g - b) / (max - min) + 360;
      }
      else if (max == g) {
          h = 60 * (b - r) / (max - min)  + 120;
      }
      else if (max == b) {
          h = 60 * (r - g) / (max - min) + 240;
      }
      let l = (max + min) / 2;
      let s;
      if (l == 0 || max == min) {
          s = 0;
      }
      else if (0 < l && l <= 0.5) {
          s = (max - min) / (max + min);
      }
      else if (0.5 < l && l < 1) {
          s = (max - min) / (2 - (max + min));
      }
      return {h: h, s: s, l: l};
  };

  const rgb2hex = (r, g, b) => {
      return `#${[r, g, b].map(x => padLeft (x.toString(16), '0', 2).toUpperCase()).join('')}`;
  };

  const hex2rgb = hex => {
      let [r,g,b] = /#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/gi.exec(hex).slice(1).map(x => parseInt(x, 16));
      return {r,g,b};
  };

  const int2hex = n => `#${padLeft(n.toString(16).toUpperCase(), '0', 6)}`;

  const hex2int = hex => {
      const [h] = /^#([0-9a-f]+)$/gi.exec(hex).slice(1);
      return parseInt (h, 16);
  };

  /* node_modules\scanex-color-picker\src\Slider\HSlider.html generated by Svelte v2.15.3 */

  const TIMEOUT =  70;
  function hasTooltip({tooltip}) {
      switch (typeof tooltip) {
          case 'boolean':
              return tooltip;
          case 'string':
              return tooltip.toLowerCase() === 'true';
          default:
              return false;
      }                
  }

  function data$4() {
      return {
          min: 0,
          max: 0,                
          value: 0,
          step: 0,
          tooltip: false,
      };
  }
  var methods$2 = {
      click (e) {
          e.stopPropagation();                                
          const {min, max} = this.get();
          const a = parseFloat(min);
          const z = parseFloat(max);
          const {left} = this.refs.slider.getBoundingClientRect();
          const {width} = this.refs.tick.getBoundingClientRect();
          let d = (e.x - width / 2 - left) * this._ratio;
          const value = d;
          if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
              this.set({value});
          }
      },
      start (e) {
          e.stopPropagation();
          this._moving = true;                
          const {value, hasTooltip} = this.get();
          this._startX = e.x;                
          this._start = parseFloat (value);
          if (hasTooltip) {
              this.refs.tooltip.style.display = 'block';
          }                
      },
      move(e) {                
          if (this._moving) {
              setTimeout(() => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';                                                           
                  const {min, max, step} = this.get();
                  const a = parseFloat(min);
                  const z = parseFloat(max);
                  const s = parseFloat (step);                                        
                  let d = (e.x - this._startX) * this._ratio;
                  if (s > 0) {
                      d = Math.floor (d / s) * s;
                  }
                  const value = this._start + d;                                                
                  if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
                      this.set({value});
                  }
              }, TIMEOUT);
          }
      },
      stop (e) {
          this._moving = false;
          document.body.style.cursor = 'initial';
          const {hasTooltip} = this.get();
          if (hasTooltip) {                    
              this.refs.tooltip.style.display = 'none';
          }                                
      },
      _getRatio (min, max) {
          const a = parseFloat(min);
          const z = parseFloat(max);        
          if (!isNaN(a) && !isNaN(z)) {                            
              const {width} = this.refs.bar.getBoundingClientRect();
              return (z - a) / width;
          }
          else {
              return NaN;
          }
      },
      _updateDom (min, max, value, ratio) {
          const a = parseFloat(min);
          const z = parseFloat(max);            
          const v = parseFloat(value);
          if (!isNaN(a) && !isNaN(z) && !isNaN(v) && a <= v && v <= z) {
              this.refs.tick.style.left = `${Math.round(v / ratio)}px`;
          }
      }            
  };

  function oncreate$2() {            
      const {min, max} = this.get();
      this._ratio = this._getRatio(min, max);
  }
  function onupdate({changed, current, previous}) {            
      if (changed.value) {
          const value = parseFloat(current.value);
          if (!isNaN(value)) {
              const {min, max} = this.get();
              this._updateDom (min, max, value, this._ratio);                    
          }                
      }
  }
  const file$5 = "node_modules\\scanex-color-picker\\src\\Slider\\HSlider.html";

  function create_main_fragment$5(component, ctx) {
  	var div2, slot_content_default = component._slotted.default, slot_content_default_after, text, div1, div0, current;

  	function onwindowmouseup(event) {
  		component.stop(event);	}
  	window.addEventListener("mouseup", onwindowmouseup);

  	function onwindowmousemove(event) {
  		component.move(event);	}
  	window.addEventListener("mousemove", onwindowmousemove);

  	var if_block = (ctx.hasTooltip) && create_if_block$1(component, ctx);

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
  			addLoc(div0, file$5, 4, 8, 194);
  			div1.className = "hslider-bar";
  			addLoc(div1, file$5, 3, 4, 151);
  			addListener(div2, "click", click_handler);
  			div2.className = "hslider";
  			addLoc(div2, file$5, 1, 0, 70);
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
  			if (component.refs.bar === div1) component.refs.bar = null;
  			removeListener(div2, "click", click_handler);
  			if (component.refs.slider === div2) component.refs.slider = null;
  		}
  	};
  }

  // (6:12) {#if hasTooltip}
  function create_if_block$1(component, ctx) {
  	var div, text_value = ctx.parseFloat(ctx.value).toFixed(), text;

  	return {
  		c: function create() {
  			div = createElement("div");
  			text = createText(text_value);
  			div.className = "hslider-tooltip";
  			addLoc(div, file$5, 6, 16, 305);
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
  	this._debugName = '<HSlider>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(assign({ parseFloat : parseFloat }, data$4()), options.data);

  	this._recompute({ tooltip: 1 }, this._state);
  	if (!('tooltip' in this._state)) console.warn("<HSlider> was created without expected data property 'tooltip'");


  	if (!('value' in this._state)) console.warn("<HSlider> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate];

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$5(this, this._state);

  	this.root._oncreate.push(() => {
  		oncreate$2.call(this);
  		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
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
  assign(HSlider.prototype, methods$2);

  HSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hasTooltip' in newState && !this._updatingReadonlyProperty) throw new Error("<HSlider>: Cannot set read-only property 'hasTooltip'");
  };

  HSlider.prototype._recompute = function _recompute(changed, state) {
  	if (changed.tooltip) {
  		if (this._differs(state.hasTooltip, (state.hasTooltip = hasTooltip(state)))) changed.hasTooltip = true;
  	}
  };

  /* node_modules\scanex-color-picker\src\Slider\VSlider.html generated by Svelte v2.15.3 */

  const TIMEOUT$1 = 70;
  function hasTooltip$1({tooltip}) {
      switch (typeof tooltip) {
          case 'boolean':
              return tooltip;
          case 'string':
              return tooltip.toLowerCase() === 'true';
          default:
              return false;
      }
  }

  function data$5() {
      return {
          min: 0,
          max: 0,                
          value: 0,
          step: 0,
          tooltip: false, 
      };
  }
  var methods$3 = {
      click (e) {
          e.stopPropagation();                                
          const {min, max} = this.get();
          const a = parseFloat(min);
          const z = parseFloat(max);
          const {top} = this.refs.slider.getBoundingClientRect();                
          let d = (e.y - top) * this._ratio;
          const value = d;
          if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
              this.set({value});
          }
      },
      start (e, target) {                
          e.stopPropagation();
          this._moving = true;
          const {value, hasTooltip} = this.get();
          this._startX = e.y;                
          this._start = parseFloat (value);
          if (hasTooltip) {
              this.refs.tooltip.style.display = 'block';
          }
      },
      move(e) {                
          if (this._moving) {
              setTimeout(() => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';                                                      
                  const {min, max, step} = this.get();
                  const a = parseFloat(min);
                  const z = parseFloat(max);
                  const s = parseFloat (step);                                        
                  let d = (e.y - this._startX) * this._ratio;
                  if (s > 0) {
                      d = Math.floor (d / s) * s;
                  }
                  const value = this._start + d;                        
                  if (!isNaN(z) && !isNaN(a) && a <= value && value <= z) {
                      this.set({value});
                  }
              }, TIMEOUT$1);
          }
      },
      stop (e) {
          this._moving = false;
          const {hasTooltip} = this.get();
          document.body.style.cursor = 'initial';
          if (hasTooltip) {
              this.refs.tooltip.style.display = 'none';
          }                
      },
      _getRatio (min, max) {
          const a = parseFloat(min);
          const z = parseFloat(max);        
          if (!isNaN(a) && !isNaN(z)) {                            
              const {height} = this.refs.bar.getBoundingClientRect();
              return (z - a) / height;
          }
          else {
              return NaN;
          }
      },
      _updateDom (min, max, value, ratio) {
          const a = parseFloat(min);
          const z = parseFloat(max);                
          const v = parseFloat(value);
          if (!isNaN(a) && !isNaN(z) && !isNaN(v) && a <= v && v <= z) {                    
              this.refs.tick.style.top = `${v / ratio}px`;
          }
      }    
  };

  function oncreate$3() {            
      const {min, max} = this.get();            
      this._ratio = this._getRatio(min, max);            
  }
  function onupdate$1({changed, current, previous}) {                        
      if (changed.value) {
          const value = parseFloat(current.value);
          if (!isNaN(value)) {
              const {min, max} = this.get();
              this._updateDom (min, max, value, this._ratio);
          }
      }
  }
  const file$6 = "node_modules\\scanex-color-picker\\src\\Slider\\VSlider.html";

  function create_main_fragment$6(component, ctx) {
  	var div2, slot_content_default = component._slotted.default, slot_content_default_after, text, div1, div0, current;

  	function onwindowmouseup(event) {
  		component.stop(event);	}
  	window.addEventListener("mouseup", onwindowmouseup);

  	function onwindowmousemove(event) {
  		component.move(event);	}
  	window.addEventListener("mousemove", onwindowmousemove);

  	var if_block = (ctx.hasTooltip) && create_if_block$2(component, ctx);

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
  			addLoc(div0, file$6, 4, 8, 214);
  			div1.className = "vslider-bar";
  			addLoc(div1, file$6, 3, 4, 151);
  			addListener(div2, "click", click_handler);
  			div2.className = "vslider";
  			addLoc(div2, file$6, 1, 0, 70);
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
  					if_block = create_if_block$2(component, ctx);
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
  			if (component.refs.bar === div1) component.refs.bar = null;
  			removeListener(div2, "click", click_handler);
  			if (component.refs.slider === div2) component.refs.slider = null;
  		}
  	};
  }

  // (6:12) {#if hasTooltip}
  function create_if_block$2(component, ctx) {
  	var div, text_value = ctx.parseFloat(ctx.value).toFixed(), text;

  	return {
  		c: function create() {
  			div = createElement("div");
  			text = createText(text_value);
  			div.className = "vslider-tooltip";
  			addLoc(div, file$6, 6, 16, 325);
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
  	this._debugName = '<VSlider>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(assign({ parseFloat : parseFloat }, data$5()), options.data);

  	this._recompute({ tooltip: 1 }, this._state);
  	if (!('tooltip' in this._state)) console.warn("<VSlider> was created without expected data property 'tooltip'");


  	if (!('value' in this._state)) console.warn("<VSlider> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$1];

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$6(this, this._state);

  	this.root._oncreate.push(() => {
  		oncreate$3.call(this);
  		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
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
  assign(VSlider.prototype, methods$3);

  VSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hasTooltip' in newState && !this._updatingReadonlyProperty) throw new Error("<VSlider>: Cannot set read-only property 'hasTooltip'");
  };

  VSlider.prototype._recompute = function _recompute(changed, state) {
  	if (changed.tooltip) {
  		if (this._differs(state.hasTooltip, (state.hasTooltip = hasTooltip$1(state)))) changed.hasTooltip = true;
  	}
  };

  /* node_modules\scanex-color-picker\src\Slider\Slider.html generated by Svelte v2.15.3 */



  function data$6() {
      return { HSlider, VSlider };
  }
  function create_main_fragment$7(component, ctx) {
  	var slot_content_default = component._slotted.default, switch_instance_updating = {}, switch_instance_anchor, current;

  	var switch_value = ctx.orientation === 'horizontal' ? ctx.HSlider : ctx.VSlider;

  	function switch_props(ctx) {
  		var switch_instance_initial_data = {};
  		if (ctx.min  !== void 0) {
  			switch_instance_initial_data.min = ctx.min ;
  			switch_instance_updating.min = true;
  		}
  		if (ctx.max  !== void 0) {
  			switch_instance_initial_data.max = ctx.max ;
  			switch_instance_updating.max = true;
  		}
  		if (ctx.value  !== void 0) {
  			switch_instance_initial_data.value = ctx.value ;
  			switch_instance_updating.value = true;
  		}
  		if (ctx.step  !== void 0) {
  			switch_instance_initial_data.step = ctx.step ;
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
  			_bind(changed, childState) {
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

  		component.root._beforecreate.push(() => {
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
  				switch_instance_changes.min = ctx.min ;
  				switch_instance_updating.min = ctx.min  !== void 0;
  			}
  			if (!switch_instance_updating.max && changed.max) {
  				switch_instance_changes.max = ctx.max ;
  				switch_instance_updating.max = ctx.max  !== void 0;
  			}
  			if (!switch_instance_updating.value && changed.value) {
  				switch_instance_changes.value = ctx.value ;
  				switch_instance_updating.value = ctx.value  !== void 0;
  			}
  			if (!switch_instance_updating.step && changed.step) {
  				switch_instance_changes.step = ctx.step ;
  				switch_instance_updating.step = ctx.step  !== void 0;
  			}
  			if (!switch_instance_updating.tooltip && changed.tooltip) {
  				switch_instance_changes.tooltip = ctx.tooltip;
  				switch_instance_updating.tooltip = ctx.tooltip !== void 0;
  			}

  			if (switch_value !== (switch_value = ctx.orientation === 'horizontal' ? ctx.HSlider : ctx.VSlider)) {
  				if (switch_instance) {
  					const old_component = switch_instance;
  					old_component._fragment.o(() => {
  						old_component.destroy();
  					});
  				}

  				if (switch_value) {
  					switch_instance = new switch_value(switch_props(ctx));

  					component.root._beforecreate.push(() => {
  						const changed = {};
  						if (ctx.min  === void 0) changed.min = 1;
  						if (ctx.max  === void 0) changed.max = 1;
  						if (ctx.value  === void 0) changed.value = 1;
  						if (ctx.step  === void 0) changed.step = 1;
  						if (ctx.tooltip === void 0) changed.tooltip = 1;
  						switch_instance._bind(changed, switch_instance.get());
  					});
  					switch_instance._fragment.c();

  					slot.m(switch_instance._slotted.default, null);
  					switch_instance._mount(switch_instance_anchor.parentNode, switch_instance_anchor);
  				} else {
  					switch_instance = null;
  				}
  			}

  			else if (switch_value) {
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
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$6(), options.data);
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

  	this._fragment = create_main_fragment$7(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(Slider.prototype, protoDev);

  Slider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  /* node_modules\scanex-color-picker\src\AlphaSlider\AlphaSlider.html generated by Svelte v2.15.3 */



  function data$7() {
      return {
          order: 'asc',
          alpha: 100,
          hue: 0,
          saturation: 1.0,
          lightness: 0.5,
      };
  }
  var methods$4 = {            
  };

  function onupdate$2({changed, current, previous}) {
      if (changed.hue || changed.saturation || changed.lightness) {
          const {r, g, b} = hsl2rgb(current.hue, current.saturation, current.lightness);
          let ctx = this.refs.alpha.getContext('2d');
          let imgData = ctx.getImageData (0, 0, this.refs.alpha.width, this.refs.alpha.height);
          let {data, width, height} = imgData;            
          for (let i = 0, j = 0, k = 0; i < data.length; i += 4, ++j){            
              if (j >= width) {
                  ++k;
                  j = 0;
              }
              let a = k / height;
              const {order} = this.get();
              a = order === 'desc' ? 1.0 - a : a;
              data[i + 0] = r;
              data[i + 1] = g;
              data[i + 2] = b;
              data[i + 3] = Math.round (255 * a);
          }
          ctx.putImageData (imgData, 0, 0);
      }            
  }
  const file$8 = "node_modules\\scanex-color-picker\\src\\AlphaSlider\\AlphaSlider.html";

  function create_main_fragment$8(component, ctx) {
  	var div, canvas, slider_updating = {}, current;

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
  		_bind(changed, childState) {
  			var newState = {};
  			if (!slider_updating.value && changed.value) {
  				newState.alpha = childState.value;
  			}
  			component._set(newState);
  			slider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(() => {
  		slider._bind({ value: 1 }, slider.get());
  	});

  	component.refs.slider = slider;

  	return {
  		c: function create() {
  			div = createElement("div");
  			canvas = createElement("canvas");
  			slider._fragment.c();
  			addLoc(canvas, file$8, 2, 8, 154);
  			div.className = "alpha-slider";
  			addLoc(div, file$8, 0, 0, 0);
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
  	this._debugName = '<AlphaSlider>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$7(), options.data);
  	if (!('alpha' in this._state)) console.warn("<AlphaSlider> was created without expected data property 'alpha'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$2];

  	this._fragment = create_main_fragment$8(this, this._state);

  	this.root._oncreate.push(() => {
  		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
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
  assign(AlphaSlider.prototype, methods$4);

  AlphaSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  /* node_modules\scanex-color-picker\src\ColorArea\ColorArea.html generated by Svelte v2.15.3 */



  const TIMEOUT$2 = 70;
  function data$8() {
      return {
          alpha: 100,
          hue: 0,
          saturation: 1.0,
          lightness: 0.5,
      };
  }
  var methods$5 = {
      click (e) {
          e.stopPropagation();
          const {left, top} = this.refs.canvas.getBoundingClientRect();               
          const x = e.x - left;
          const y = e.y - top;
          const saturation = 1 - x / this._width;
          const lightness = 1 - y / this._height;
          this.set({saturation, lightness});
      },
      start (e) {
          e.stopPropagation();
          this._offsetX = e.offsetX;
          this._offsetY = e.offsetY;
          this._moving = true;
      },
      move (e) {                
          if (this._moving) {
              setTimeout (() => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                  const {left, top} = this.refs.canvas.getBoundingClientRect();          
                  // handle x
                  let x = e.clientX - this._offsetX + this._halfWidth - left;
                  if (x < 0) {
                      x = 0;
                  }
                  else if (x > this._width) {                 
                      x = this._width;
                  }         
                  // handle y
                  let y = e.clientY - this._offsetY + this._halfHeight - top;
                  if (y < 0) {                     
                      y = 0;
                  }
                  else if (y > this._height) {                        
                      y = this._height;
                  }                    
                  const saturation = 1 - x / this._width;
                  const lightness = 1 - y / this._height;

                  this.set({saturation, lightness});                        
              }, TIMEOUT$2);                    
          }
      },
      stop (e) {
          e.stopPropagation();
          document.body.style.cursor = 'initial';
          this._offsetX = 0;
          this._offsetY = 0;
          this._moving = false;
      },            
  };

  function oncreate$4() {
      const samplerRect = this.refs.sampler.getBoundingClientRect();
      this._halfWidth = samplerRect.width / 2;
      this._halfHeight = samplerRect.height / 2;            
      this._width = this.refs.canvas.clientWidth;
      this._height = this.refs.canvas.clientHeight;
      this._moving = false;
      this._offsetX = 0;
      this._offsetY = 0;
  }
  function onupdate$3({changed, current, previous}) {            
      if (changed.saturation) {
          const s = current.saturation;
          this.refs.sampler.style.left = `${Math.round((1 - s) * this._width)}px`;
      }
      if (changed.lightness) {
          const l = current.lightness;
          this.refs.sampler.style.top = `${Math.round((1 - l) * this._height)}px`;
          const {r, g, b} = hsl2rgb(0, 0, 1 - l);            
          this.refs.sampler.style.borderColor = `rgb(${[r,g,b].join(',')})`;
      }
      if (changed.hue || changed.alpha) {
          const {saturation, lightness, alpha} = this.get();
          const h = current.hue;
          const a = alpha / 100;
          let ctx = this.refs.canvas.getContext('2d');
          let imgData = ctx.getImageData (0, 0, this.refs.canvas.width, this.refs.canvas.height);
          const {width, height} = imgData;                        
          let k = 0;
          let data = new Uint8ClampedArray(width * height * 4);
          for (let i = height - 1; i >= 0; --i) {
              for (let j = width - 1; j >= 0; --j) {
                  let s = j / width;
                  let l = i / height;
                  let {r, g, b} = hsl2rgb(h, s, l);
                  data[k + 0] = r;
                  data[k + 1] = g;
                  data[k + 2] = b;
                  data[k + 3] = Math.round (a * 255);
                  k += 4;
              }
          }
          imgData.data.set(data);
          ctx.putImageData (imgData, 0, 0); 
      }             
  }
  const file$9 = "node_modules\\scanex-color-picker\\src\\ColorArea\\ColorArea.html";

  function create_main_fragment$9(component, ctx) {
  	var div1, div0, text, canvas, current;

  	function onwindowmousemove(event) {
  		component.move(event);	}
  	window.addEventListener("mousemove", onwindowmousemove);

  	function onwindowmouseup(event) {
  		component.stop(event);	}
  	window.addEventListener("mouseup", onwindowmouseup);

  	function mousedown_handler(event) {
  		component.start(event);
  	}

  	function click_handler(event) {
  		component.click(event);
  	}

  	return {
  		c: function create() {
  			div1 = createElement("div");
  			div0 = createElement("div");
  			text = createText("\r\n    ");
  			canvas = createElement("canvas");
  			addListener(div0, "mousedown", mousedown_handler);
  			div0.className = "sampler";
  			addLoc(div0, file$9, 2, 4, 119);
  			addListener(canvas, "click", click_handler);
  			addLoc(canvas, file$9, 3, 4, 192);
  			div1.className = "color-area";
  			addLoc(div1, file$9, 1, 0, 71);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div1, anchor);
  			append(div1, div0);
  			component.refs.sampler = div0;
  			append(div1, text);
  			append(div1, canvas);
  			component.refs.canvas = canvas;
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

  			removeListener(div0, "mousedown", mousedown_handler);
  			if (component.refs.sampler === div0) component.refs.sampler = null;
  			removeListener(canvas, "click", click_handler);
  			if (component.refs.canvas === canvas) component.refs.canvas = null;
  			if (component.refs.container === div1) component.refs.container = null;
  		}
  	};
  }

  function ColorArea(options) {
  	this._debugName = '<ColorArea>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$8(), options.data);
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$3];

  	this._fragment = create_main_fragment$9(this, this._state);

  	this.root._oncreate.push(() => {
  		oncreate$4.call(this);
  		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
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
  assign(ColorArea.prototype, methods$5);

  ColorArea.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  /* node_modules\scanex-color-picker\src\ColorSlider\ColorSlider.html generated by Svelte v2.15.3 */



  function data$9() {
      return {
          alpha: 100,
          hue: 0,
          saturation: 1.0,
          lightness: 0.5,                
      };
  }
  function oncreate$5() {
      let ctx = this.refs.color.getContext('2d');
      let imgData = ctx.createImageData (this.refs.color.width, this.refs.color.height);
      const {data, width} = imgData;
      const {saturation, lightness, alpha} = this.get();
      for (let i = 0; i < data.length; i += 4) {
          const h = ((i / 4) % width) * 360 / width;
          const {r, g, b} = hsl2rgb(h, saturation, lightness);
          const a = Math.round (alpha * 255 / 100);
          data[i + 0] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = a;
      }        
      ctx.putImageData (imgData, 0, 0);
  }
  const file$a = "node_modules\\scanex-color-picker\\src\\ColorSlider\\ColorSlider.html";

  function create_main_fragment$a(component, ctx) {
  	var div, canvas, slider_updating = {}, current;

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
  		_bind(changed, childState) {
  			var newState = {};
  			if (!slider_updating.value && changed.value) {
  				newState.hue = childState.value;
  			}
  			component._set(newState);
  			slider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(() => {
  		slider._bind({ value: 1 }, slider.get());
  	});

  	component.refs.slider = slider;

  	return {
  		c: function create() {
  			div = createElement("div");
  			canvas = createElement("canvas");
  			slider._fragment.c();
  			addLoc(canvas, file$a, 2, 8, 155);
  			div.className = "color-slider";
  			addLoc(div, file$a, 0, 0, 0);
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
  	this._debugName = '<ColorSlider>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$9(), options.data);
  	if (!('hue' in this._state)) console.warn("<ColorSlider> was created without expected data property 'hue'");
  	this._intro = !!options.intro;

  	this._fragment = create_main_fragment$a(this, this._state);

  	this.root._oncreate.push(() => {
  		oncreate$5.call(this);
  		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
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

  ColorSlider.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  /* node_modules\scanex-color-picker\src\ColorPicker\ColorPicker.html generated by Svelte v2.15.3 */



  function value({mode, hex, rgb}) {
  	return mode === 'hex' ? hex : rgb;
  }

  function hex({hue, saturation, lightness}) {
      const {r, g, b} = hsl2rgb(hue, saturation, lightness);
      return rgb2hex(r,g,b);
  }

  function rgb({hue, saturation, lightness}) {
      const {r, g, b} = hsl2rgb(hue, saturation, lightness);
      return [r,g,b].join(',');
  }

  function rgba({hue, saturation, lightness, alpha}) {
      const {r, g, b} = hsl2rgb(hue, saturation, lightness);
      const a = alpha / 100;
      return `rgba(${[r,g,b,a].join(',')})`;
  }

  function data$a() {
      return {
          mode: 'hex',
          alpha: 100,
          hue: 0,
          saturation: 1.0,
          lightness: 0.5,
      };
  }
  var methods$6 = {
      prevent (e) {
          e.stopPropagation();
          e.preventDefault();
      },
      change (value) {
          const {mode} = this.get();
          var {r,g,b} = {r: 0, g: 0, b: 0};
          if (mode === 'hex') {
              var {r, g, b} = hex2rgb (value);
          }
          else if (mode === 'rgb') {
              var [r,g,b] = value.split(',').map(x => parseInt(x, 10));
          }
          const {h,s,l} = rgb2hsl (r,g,b);
          this.set({hue: h, saturation: s, lightness: l});
      },
      keydown (e) {
          if (e.keyCode === 13) {
              this.change (this.refs.box.value);                    
          }
      }
  };

  function onupdate$4({changed, current}) {
      if (changed.rgba) {                
          this.refs.sample.style.backgroundColor = current.rgba;
      }
  }
  const file$b = "node_modules\\scanex-color-picker\\src\\ColorPicker\\ColorPicker.html";

  function create_main_fragment$b(component, ctx) {
  	var table, tbody, tr0, td0, span0, text0, td1, span1, text1, text2, input, input_updating = false, text3, td2, span2, text4, td3, text5, tr1, td4, colorarea_updating = {}, text6, td5, alphaslider_updating = {}, text7, tr2, td6, colorslider_updating = {}, text8, td7, current;

  	function input_input_handler() {
  		input_updating = true;
  		component.set({ value: input.value });
  		input_updating = false;
  	}

  	function click_handler(event) {
  		component.set({mode: ctx.mode === 'hex' ? 'rgb' : 'hex'});
  	}

  	var colorarea_initial_data = {};
  	if (ctx.alpha  !== void 0) {
  		colorarea_initial_data.alpha = ctx.alpha ;
  		colorarea_updating.alpha = true;
  	}
  	if (ctx.hue  !== void 0) {
  		colorarea_initial_data.hue = ctx.hue ;
  		colorarea_updating.hue = true;
  	}
  	if (ctx.saturation  !== void 0) {
  		colorarea_initial_data.saturation = ctx.saturation ;
  		colorarea_updating.saturation = true;
  	}
  	if (ctx.lightness  !== void 0) {
  		colorarea_initial_data.lightness = ctx.lightness ;
  		colorarea_updating.lightness = true;
  	}
  	var colorarea = new ColorArea({
  		root: component.root,
  		store: component.store,
  		data: colorarea_initial_data,
  		_bind(changed, childState) {
  			var newState = {};
  			if (!colorarea_updating.alpha && changed.alpha) {
  				newState.alpha = childState.alpha;
  			}

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

  	component.root._beforecreate.push(() => {
  		colorarea._bind({ alpha: 1, hue: 1, saturation: 1, lightness: 1 }, colorarea.get());
  	});

  	var alphaslider_initial_data = {};
  	if (ctx.alpha  !== void 0) {
  		alphaslider_initial_data.alpha = ctx.alpha ;
  		alphaslider_updating.alpha = true;
  	}
  	if (ctx.hue  !== void 0) {
  		alphaslider_initial_data.hue = ctx.hue ;
  		alphaslider_updating.hue = true;
  	}
  	if (ctx.saturation  !== void 0) {
  		alphaslider_initial_data.saturation = ctx.saturation ;
  		alphaslider_updating.saturation = true;
  	}
  	if (ctx.lightness  !== void 0) {
  		alphaslider_initial_data.lightness = ctx.lightness ;
  		alphaslider_updating.lightness = true;
  	}
  	var alphaslider = new AlphaSlider({
  		root: component.root,
  		store: component.store,
  		data: alphaslider_initial_data,
  		_bind(changed, childState) {
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

  	component.root._beforecreate.push(() => {
  		alphaslider._bind({ alpha: 1, hue: 1, saturation: 1, lightness: 1 }, alphaslider.get());
  	});

  	var colorslider_initial_data = {};
  	if (ctx.hue  !== void 0) {
  		colorslider_initial_data.hue = ctx.hue ;
  		colorslider_updating.hue = true;
  	}
  	if (ctx.saturation  !== void 0) {
  		colorslider_initial_data.saturation = ctx.saturation ;
  		colorslider_updating.saturation = true;
  	}
  	if (ctx.lightness  !== void 0) {
  		colorslider_initial_data.lightness = ctx.lightness ;
  		colorslider_updating.lightness = true;
  	}
  	var colorslider = new ColorSlider({
  		root: component.root,
  		store: component.store,
  		data: colorslider_initial_data,
  		_bind(changed, childState) {
  			var newState = {};
  			if (!colorslider_updating.hue && changed.hue) {
  				newState.hue = childState.hue;
  			}

  			if (!colorslider_updating.saturation && changed.saturation) {
  				newState.saturation = childState.saturation;
  			}

  			if (!colorslider_updating.lightness && changed.lightness) {
  				newState.lightness = childState.lightness;
  			}
  			component._set(newState);
  			colorslider_updating = {};
  		}
  	});

  	component.root._beforecreate.push(() => {
  		colorslider._bind({ hue: 1, saturation: 1, lightness: 1 }, colorslider.get());
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
  			tbody = createElement("tbody");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			span0 = createElement("span");
  			text0 = createText("\r\n            ");
  			td1 = createElement("td");
  			span1 = createElement("span");
  			text1 = createText(ctx.mode);
  			text2 = createText("\r\n                ");
  			input = createElement("input");
  			text3 = createText("\r\n            ");
  			td2 = createElement("td");
  			span2 = createElement("span");
  			text4 = createText("\r\n            ");
  			td3 = createElement("td");
  			text5 = createText("\r\n        ");
  			tr1 = createElement("tr");
  			td4 = createElement("td");
  			colorarea._fragment.c();
  			text6 = createText("\r\n            ");
  			td5 = createElement("td");
  			alphaslider._fragment.c();
  			text7 = createText("\r\n        ");
  			tr2 = createElement("tr");
  			td6 = createElement("td");
  			colorslider._fragment.c();
  			text8 = createText("\r\n            ");
  			td7 = createElement("td");
  			span0.className = "color-picker-sample";
  			addLoc(span0, file$b, 4, 16, 147);
  			addLoc(td0, file$b, 3, 12, 125);
  			span1.className = "color-picker-mode";
  			addLoc(span1, file$b, 7, 16, 254);
  			addListener(input, "input", input_input_handler);
  			setAttribute(input, "type", "text");
  			input.className = "color-picker-box";
  			addLoc(input, file$b, 8, 16, 317);
  			addLoc(td1, file$b, 6, 12, 232);
  			addListener(span2, "click", click_handler);
  			span2.className = "color-picker-box-button";
  			addLoc(span2, file$b, 11, 16, 437);
  			addLoc(td2, file$b, 10, 12, 415);
  			addLoc(td3, file$b, 13, 12, 570);
  			addLoc(tr0, file$b, 2, 8, 107);
  			td4.colSpan = "3";
  			addLoc(td4, file$b, 17, 12, 636);
  			addLoc(td5, file$b, 20, 12, 767);
  			addLoc(tr1, file$b, 16, 8, 618);
  			td6.colSpan = "3";
  			addLoc(td6, file$b, 25, 12, 917);
  			addLoc(td7, file$b, 28, 12, 1039);
  			addLoc(tr2, file$b, 24, 8, 899);
  			addLoc(tbody, file$b, 1, 4, 90);
  			addListener(table, "click", click_handler_1);
  			addListener(table, "dragstart", dragstart_handler);
  			table.className = "color-picker";
  			addLoc(table, file$b, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, table, anchor);
  			append(table, tbody);
  			append(tbody, tr0);
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

  			input.value = ctx.value ;

  			append(tr0, text3);
  			append(tr0, td2);
  			append(td2, span2);
  			append(tr0, text4);
  			append(tr0, td3);
  			append(tbody, text5);
  			append(tbody, tr1);
  			append(tr1, td4);
  			colorarea._mount(td4, null);
  			append(tr1, text6);
  			append(tr1, td5);
  			alphaslider._mount(td5, null);
  			append(tbody, text7);
  			append(tbody, tr2);
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

  			if (!input_updating && changed.value) input.value = ctx.value ;

  			var colorarea_changes = {};
  			if (!colorarea_updating.alpha && changed.alpha) {
  				colorarea_changes.alpha = ctx.alpha ;
  				colorarea_updating.alpha = ctx.alpha  !== void 0;
  			}
  			if (!colorarea_updating.hue && changed.hue) {
  				colorarea_changes.hue = ctx.hue ;
  				colorarea_updating.hue = ctx.hue  !== void 0;
  			}
  			if (!colorarea_updating.saturation && changed.saturation) {
  				colorarea_changes.saturation = ctx.saturation ;
  				colorarea_updating.saturation = ctx.saturation  !== void 0;
  			}
  			if (!colorarea_updating.lightness && changed.lightness) {
  				colorarea_changes.lightness = ctx.lightness ;
  				colorarea_updating.lightness = ctx.lightness  !== void 0;
  			}
  			colorarea._set(colorarea_changes);
  			colorarea_updating = {};

  			var alphaslider_changes = {};
  			if (!alphaslider_updating.alpha && changed.alpha) {
  				alphaslider_changes.alpha = ctx.alpha ;
  				alphaslider_updating.alpha = ctx.alpha  !== void 0;
  			}
  			if (!alphaslider_updating.hue && changed.hue) {
  				alphaslider_changes.hue = ctx.hue ;
  				alphaslider_updating.hue = ctx.hue  !== void 0;
  			}
  			if (!alphaslider_updating.saturation && changed.saturation) {
  				alphaslider_changes.saturation = ctx.saturation ;
  				alphaslider_updating.saturation = ctx.saturation  !== void 0;
  			}
  			if (!alphaslider_updating.lightness && changed.lightness) {
  				alphaslider_changes.lightness = ctx.lightness ;
  				alphaslider_updating.lightness = ctx.lightness  !== void 0;
  			}
  			alphaslider._set(alphaslider_changes);
  			alphaslider_updating = {};

  			var colorslider_changes = {};
  			if (!colorslider_updating.hue && changed.hue) {
  				colorslider_changes.hue = ctx.hue ;
  				colorslider_updating.hue = ctx.hue  !== void 0;
  			}
  			if (!colorslider_updating.saturation && changed.saturation) {
  				colorslider_changes.saturation = ctx.saturation ;
  				colorslider_updating.saturation = ctx.saturation  !== void 0;
  			}
  			if (!colorslider_updating.lightness && changed.lightness) {
  				colorslider_changes.lightness = ctx.lightness ;
  				colorslider_updating.lightness = ctx.lightness  !== void 0;
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
  			removeListener(input, "input", input_input_handler);
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
  	this._debugName = '<ColorPicker>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$a(), options.data);

  	this._recompute({ hue: 1, saturation: 1, lightness: 1, mode: 1, hex: 1, rgb: 1, alpha: 1 }, this._state);
  	if (!('mode' in this._state)) console.warn("<ColorPicker> was created without expected data property 'mode'");


  	if (!('hue' in this._state)) console.warn("<ColorPicker> was created without expected data property 'hue'");
  	if (!('saturation' in this._state)) console.warn("<ColorPicker> was created without expected data property 'saturation'");
  	if (!('lightness' in this._state)) console.warn("<ColorPicker> was created without expected data property 'lightness'");
  	if (!('alpha' in this._state)) console.warn("<ColorPicker> was created without expected data property 'alpha'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$4];

  	this._fragment = create_main_fragment$b(this, this._state);

  	this.root._oncreate.push(() => {
  		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
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
  assign(ColorPicker.prototype, methods$6);

  ColorPicker.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('hex' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'hex'");
  	if ('rgb' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'rgb'");
  	if ('value' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'value'");
  	if ('rgba' in newState && !this._updatingReadonlyProperty) throw new Error("<ColorPicker>: Cannot set read-only property 'rgba'");
  };

  ColorPicker.prototype._recompute = function _recompute(changed, state) {
  	if (changed.hue || changed.saturation || changed.lightness) {
  		if (this._differs(state.hex, (state.hex = hex(state)))) changed.hex = true;
  		if (this._differs(state.rgb, (state.rgb = rgb(state)))) changed.rgb = true;
  	}

  	if (changed.mode || changed.hex || changed.rgb) {
  		if (this._differs(state.value, (state.value = value(state)))) changed.value = true;
  	}

  	if (changed.hue || changed.saturation || changed.lightness || changed.alpha) {
  		if (this._differs(state.rgba, (state.rgba = rgba(state)))) changed.rgba = true;
  	}
  };

  Number.isInteger = Number.isInteger || function(value) {
      return typeof value === 'number' && 
        isFinite(value) && 
        Math.floor(value) === value;
  };

  /* node_modules\scanex-input-integer\src\InputInteger.html generated by Svelte v2.15.3 */

  function data$b() {
      return {
          min: null,
          max: null,
          value: 0,
          spinner: false,
      };
  }
  var methods$7 = {
      up () {
          const value = parseInt (this.get().value, 10);
          if (Number.isInteger(value)) {
              this.set ({value: value + 1});                    
          }                
      },
      down () {
          const value = parseInt (this.get().value, 10);
          if (Number.isInteger(value)) {
              this.set ({value: value - 1});
          }
      },             
      change (e) {                
          switch (e.keyCode) {
              case 38: // up
                  e.preventDefault();     
                  this.up();
                  break;
              case 40: // down
                  e.preventDefault();
                  this.down ();
                  break;
              default:
                  break;
          }
      },
      validate ({target: {value}}) {
          this.set({value});
      },            
      isValid (value) {
          const {min, max} = this.get();
          const low = parseInt (min, 10);
          const high = parseInt (max, 10);
          const v = parseInt (value, 10);
          return Number.isInteger (v) && 
            (Number.isInteger (low) && !Number.isInteger (high) && low <= v ||
            Number.isInteger (high) && !Number.isInteger (low) && v <= high ||
            Number.isInteger (low) && Number.isInteger (high) && low <= v && v <= high);
      }
  };

  function onupdate$5({changed, current, previous}) {            
      if (!this.isValid(this.get().value)) {
          this.set ({value: parseInt (previous.value, 10)});
      }            
  }
  const file$c = "node_modules\\scanex-input-integer\\src\\InputInteger.html";

  function add_css$1() {
  	var style = createElement("style");
  	style.id = 'svelte-3uhu6g-style';
  	style.textContent = ".field.svelte-3uhu6g{float:left;margin-right:3px}.field.svelte-3uhu6g,.spinner.svelte-3uhu6g{display:inline-block;vertical-align:middle}.spinner.svelte-3uhu6g{-webkit-touch-callout:none;-webkit-user-select:none;-khtml-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none}.up.svelte-3uhu6g,.down.svelte-3uhu6g{display:block;cursor:pointer;font-size:10px}.up.svelte-3uhu6g::before{content:'\\25b2'}.down.svelte-3uhu6g::before{content:'\\25bc'}.hidden.svelte-3uhu6g{visibility:hidden}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5wdXRJbnRlZ2VyLmh0bWwiLCJzb3VyY2VzIjpbIklucHV0SW50ZWdlci5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxkaXYgY2xhc3M9XCJpbnB1dFwiIG9uOm1vdXNlZW50ZXI9XCJzZXQoe3NwaW5uZXI6IHRydWV9KVwiIG9uOm1vdXNlbGVhdmU9XCJzZXQoe3NwaW5uZXI6IGZhbHNlfSlcIj5cclxuICAgIDxkaXYgY2xhc3M9XCJmaWVsZFwiPlxyXG4gICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGJpbmQ6dmFsdWU9XCJ2YWx1ZVwiIG9uOmNoYW5nZT1cInZhbGlkYXRlKGV2ZW50KVwiIG9uOmtleWRvd249XCJjaGFuZ2UoZXZlbnQpXCIgLz5cclxuICAgIDwvZGl2PlxyXG4gICAgPGRpdiBjbGFzcz1cInNwaW5uZXJcIiBjbGFzczpoaWRkZW49XCIhc3Bpbm5lclwiPlxyXG4gICAgICAgIDxpIGNsYXNzPVwidXBcIiBvbjpjbGljaz1cInVwKClcIj48L2k+XHJcbiAgICAgICAgPGkgY2xhc3M9XCJkb3duXCIgb246Y2xpY2s9XCJkb3duKClcIj48L2k+XHJcbiAgICA8L2Rpdj4gICAgXHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4gICAgLmZpZWxkIHtcclxuICAgICAgICBmbG9hdDogbGVmdDtcclxuICAgICAgICBtYXJnaW4tcmlnaHQ6IDNweDtcclxuICAgIH1cclxuICAgIC5maWVsZCwgLnNwaW5uZXIge1xyXG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcclxuICAgICAgICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlO1xyXG4gICAgfVxyXG4gICAgLnNwaW5uZXIge1xyXG4gICAgICAgIC13ZWJraXQtdG91Y2gtY2FsbG91dDogbm9uZTtcclxuICAgICAgICAtd2Via2l0LXVzZXItc2VsZWN0OiBub25lO1xyXG4gICAgICAgIC1raHRtbC11c2VyLXNlbGVjdDogbm9uZTtcclxuICAgICAgICAtbW96LXVzZXItc2VsZWN0OiBub25lO1xyXG4gICAgICAgIC1tcy11c2VyLXNlbGVjdDogbm9uZTtcclxuICAgICAgICB1c2VyLXNlbGVjdDogbm9uZTtcclxuICAgIH0gICBcclxuICAgIC51cCwgLmRvd24ge1xyXG4gICAgICAgIGRpc3BsYXk6IGJsb2NrO1xyXG4gICAgICAgIGN1cnNvcjogcG9pbnRlcjsgXHJcbiAgICAgICAgZm9udC1zaXplOiAxMHB4O1xyXG4gICAgfVxyXG4gICAgLnVwOjpiZWZvcmUge1xyXG4gICAgICAgIGNvbnRlbnQ6ICdcXDI1YjInO1xyXG4gICAgfVxyXG4gICAgLmRvd246OmJlZm9yZSB7XHJcbiAgICAgICAgY29udGVudDogJ1xcMjViYyc7XHJcbiAgICB9XHJcbiAgICAuaGlkZGVuIHtcclxuICAgICAgICB2aXNpYmlsaXR5OiBoaWRkZW47XHJcbiAgICB9XHJcbjwvc3R5bGU+XHJcblxyXG48c2NyaXB0PlxyXG4gICAgaW1wb3J0ICcuL051bWJlci5qcyc7XHJcblxyXG4gICAgZXhwb3J0IGRlZmF1bHQge1xyXG4gICAgICAgIGRhdGEgKCkge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgbWluOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgbWF4OiBudWxsLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IDAsXHJcbiAgICAgICAgICAgICAgICBzcGlubmVyOiBmYWxzZSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9LCAgICAgICAgXHJcbiAgICAgICAgb251cGRhdGUgKHtjaGFuZ2VkLCBjdXJyZW50LCBwcmV2aW91c30pIHsgICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzVmFsaWQodGhpcy5nZXQoKS52YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0ICh7dmFsdWU6IHBhcnNlSW50IChwcmV2aW91cy52YWx1ZSwgMTApfSk7XHJcbiAgICAgICAgICAgIH0gICAgICAgICAgICBcclxuICAgICAgICB9LCAgICAgICAgXHJcbiAgICAgICAgbWV0aG9kczoge1xyXG4gICAgICAgICAgICB1cCAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcnNlSW50ICh0aGlzLmdldCgpLnZhbHVlLCAxMCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldCAoe3ZhbHVlOiB2YWx1ZSArIDF9KTsgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgfSAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZG93biAoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IHBhcnNlSW50ICh0aGlzLmdldCgpLnZhbHVlLCAxMCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoTnVtYmVyLmlzSW50ZWdlcih2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldCAoe3ZhbHVlOiB2YWx1ZSAtIDF9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNoYW5nZSAoZSkgeyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAoZS5rZXlDb2RlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAzODogLy8gdXBcclxuICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpOyAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudXAoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSA0MDogLy8gZG93blxyXG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZG93biAoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHZhbGlkYXRlICh7dGFyZ2V0OiB7dmFsdWV9fSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXQoe3ZhbHVlfSk7XHJcbiAgICAgICAgICAgIH0sICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlzVmFsaWQgKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7bWluLCBtYXh9ID0gdGhpcy5nZXQoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxvdyA9IHBhcnNlSW50IChtaW4sIDEwKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhpZ2ggPSBwYXJzZUludCAobWF4LCAxMCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2ID0gcGFyc2VJbnQgKHZhbHVlLCAxMCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gTnVtYmVyLmlzSW50ZWdlciAodikgJiYgXHJcbiAgICAgICAgICAgICAgICAgIChOdW1iZXIuaXNJbnRlZ2VyIChsb3cpICYmICFOdW1iZXIuaXNJbnRlZ2VyIChoaWdoKSAmJiBsb3cgPD0gdiB8fFxyXG4gICAgICAgICAgICAgICAgICBOdW1iZXIuaXNJbnRlZ2VyIChoaWdoKSAmJiAhTnVtYmVyLmlzSW50ZWdlciAobG93KSAmJiB2IDw9IGhpZ2ggfHxcclxuICAgICAgICAgICAgICAgICAgTnVtYmVyLmlzSW50ZWdlciAobG93KSAmJiBOdW1iZXIuaXNJbnRlZ2VyIChoaWdoKSAmJiBsb3cgPD0gdiAmJiB2IDw9IGhpZ2gpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSAgICAgICAgXHJcbiAgICB9O1xyXG48L3NjcmlwdD4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBV0ksTUFBTSxjQUFDLENBQUMsQUFDSixLQUFLLENBQUUsSUFBSSxDQUNYLFlBQVksQ0FBRSxHQUFHLEFBQ3JCLENBQUMsQUFDRCxvQkFBTSxDQUFFLFFBQVEsY0FBQyxDQUFDLEFBQ2QsT0FBTyxDQUFFLFlBQVksQ0FDckIsY0FBYyxDQUFFLE1BQU0sQUFDMUIsQ0FBQyxBQUNELFFBQVEsY0FBQyxDQUFDLEFBQ04scUJBQXFCLENBQUUsSUFBSSxDQUMzQixtQkFBbUIsQ0FBRSxJQUFJLENBQ3pCLGtCQUFrQixDQUFFLElBQUksQ0FDeEIsZ0JBQWdCLENBQUUsSUFBSSxDQUN0QixlQUFlLENBQUUsSUFBSSxDQUNyQixXQUFXLENBQUUsSUFBSSxBQUNyQixDQUFDLEFBQ0QsaUJBQUcsQ0FBRSxLQUFLLGNBQUMsQ0FBQyxBQUNSLE9BQU8sQ0FBRSxLQUFLLENBQ2QsTUFBTSxDQUFFLE9BQU8sQ0FDZixTQUFTLENBQUUsSUFBSSxBQUNuQixDQUFDLEFBQ0QsaUJBQUcsUUFBUSxBQUFDLENBQUMsQUFDVCxPQUFPLENBQUUsT0FBTyxBQUNwQixDQUFDLEFBQ0QsbUJBQUssUUFBUSxBQUFDLENBQUMsQUFDWCxPQUFPLENBQUUsT0FBTyxBQUNwQixDQUFDLEFBQ0QsT0FBTyxjQUFDLENBQUMsQUFDTCxVQUFVLENBQUUsTUFBTSxBQUN0QixDQUFDIn0= */";
  	append(document.head, style);
  }

  function create_main_fragment$c(component, ctx) {
  	var div2, div0, input, input_updating = false, text0, div1, i0, text1, i1, current;

  	function input_input_handler() {
  		input_updating = true;
  		component.set({ value: input.value });
  		input_updating = false;
  	}

  	function change_handler(event) {
  		component.validate(event);
  	}

  	function keydown_handler(event) {
  		component.change(event);
  	}

  	function click_handler(event) {
  		component.up();
  	}

  	function click_handler_1(event) {
  		component.down();
  	}

  	function mouseenter_handler(event) {
  		component.set({spinner: true});
  	}

  	function mouseleave_handler(event) {
  		component.set({spinner: false});
  	}

  	return {
  		c: function create() {
  			div2 = createElement("div");
  			div0 = createElement("div");
  			input = createElement("input");
  			text0 = createText("\r\n    ");
  			div1 = createElement("div");
  			i0 = createElement("i");
  			text1 = createText("\r\n        ");
  			i1 = createElement("i");
  			addListener(input, "input", input_input_handler);
  			addListener(input, "change", change_handler);
  			addListener(input, "keydown", keydown_handler);
  			setAttribute(input, "type", "text");
  			addLoc(input, file$c, 2, 8, 129);
  			div0.className = "field svelte-3uhu6g";
  			addLoc(div0, file$c, 1, 4, 100);
  			addListener(i0, "click", click_handler);
  			i0.className = "up svelte-3uhu6g";
  			addLoc(i0, file$c, 5, 8, 297);
  			addListener(i1, "click", click_handler_1);
  			i1.className = "down svelte-3uhu6g";
  			addLoc(i1, file$c, 6, 8, 341);
  			div1.className = "spinner svelte-3uhu6g";
  			toggleClass(div1, "hidden", !ctx.spinner);
  			addLoc(div1, file$c, 4, 4, 242);
  			addListener(div2, "mouseenter", mouseenter_handler);
  			addListener(div2, "mouseleave", mouseleave_handler);
  			div2.className = "input";
  			addLoc(div2, file$c, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div2, anchor);
  			append(div2, div0);
  			append(div0, input);

  			input.value = ctx.value;

  			append(div2, text0);
  			append(div2, div1);
  			append(div1, i0);
  			append(div1, text1);
  			append(div1, i1);
  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (!input_updating && changed.value) input.value = ctx.value;
  			if (changed.spinner) {
  				toggleClass(div1, "hidden", !ctx.spinner);
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div2);
  			}

  			removeListener(input, "input", input_input_handler);
  			removeListener(input, "change", change_handler);
  			removeListener(input, "keydown", keydown_handler);
  			removeListener(i0, "click", click_handler);
  			removeListener(i1, "click", click_handler_1);
  			removeListener(div2, "mouseenter", mouseenter_handler);
  			removeListener(div2, "mouseleave", mouseleave_handler);
  		}
  	};
  }

  function InputInteger(options) {
  	this._debugName = '<InputInteger>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$b(), options.data);
  	if (!('value' in this._state)) console.warn("<InputInteger> was created without expected data property 'value'");
  	if (!('spinner' in this._state)) console.warn("<InputInteger> was created without expected data property 'spinner'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$5];

  	if (!document.getElementById("svelte-3uhu6g-style")) add_css$1();

  	this._fragment = create_main_fragment$c(this, this._state);

  	this.root._oncreate.push(() => {
  		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(InputInteger.prototype, protoDev);
  assign(InputInteger.prototype, methods$7);

  InputInteger.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  /* node_modules\scanex-switch\src\Switch.html generated by Svelte v2.15.3 */

  function data$c() {
      return {
          flag: false
      };
  }
  const file$d = "node_modules\\scanex-switch\\src\\Switch.html";

  function add_css$2() {
  	var style = createElement("style");
  	style.id = 'svelte-ftc0u3-style';
  	style.textContent = ".scanex-switch.svelte-ftc0u3>div.svelte-ftc0u3{float:left}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3dpdGNoLmh0bWwiLCJzb3VyY2VzIjpbIlN3aXRjaC5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjxkaXYgY2xhc3M9XCJzY2FuZXgtc3dpdGNoXCI+XHJcbiAgICA8ZGl2IG9uOmNsaWNrPVwic2V0KHtmbGFnOiB0cnVlfSlcIiBjbGFzczpmbGFnPVwiZmxhZ1wiPlxyXG4gICAgICAgIDxzbG90IG5hbWU9XCJsZWZ0XCI+PC9zbG90PlxyXG4gICAgPC9kaXY+XHJcbiAgICA8ZGl2IG9uOmNsaWNrPVwic2V0KHtmbGFnOiBmYWxzZX0pXCIgY2xhc3M6ZmxhZz1cIiFmbGFnXCI+XHJcbiAgICAgICAgPHNsb3QgbmFtZT1cInJpZ2h0XCI+PC9zbG90PlxyXG4gICAgPC9kaXY+XHJcbjwvZGl2PlxyXG5cclxuPHN0eWxlPlxyXG4gICAgLnNjYW5leC1zd2l0Y2ggPiBkaXYge1xyXG4gICAgICAgIGZsb2F0OiBsZWZ0O1xyXG4gICAgfSAgICBcclxuPC9zdHlsZT5cclxuXHJcbjxzY3JpcHQ+XHJcbiAgICBleHBvcnQgZGVmYXVsdCB7XHJcbiAgICAgICAgZGF0YSAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICBmbGFnOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbjwvc2NyaXB0PiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFVSSw0QkFBYyxDQUFHLEdBQUcsY0FBQyxDQUFDLEFBQ2xCLEtBQUssQ0FBRSxJQUFJLEFBQ2YsQ0FBQyJ9 */";
  	append(document.head, style);
  }

  function create_main_fragment$d(component, ctx) {
  	var div2, div0, slot_content_left = component._slotted.left, text, div1, slot_content_right = component._slotted.right, current;

  	function click_handler(event) {
  		component.set({flag: true});
  	}

  	function click_handler_1(event) {
  		component.set({flag: false});
  	}

  	return {
  		c: function create() {
  			div2 = createElement("div");
  			div0 = createElement("div");
  			text = createText("\r\n    ");
  			div1 = createElement("div");
  			addListener(div0, "click", click_handler);
  			div0.className = "svelte-ftc0u3";
  			toggleClass(div0, "flag", ctx.flag);
  			addLoc(div0, file$d, 1, 4, 33);
  			addListener(div1, "click", click_handler_1);
  			div1.className = "svelte-ftc0u3";
  			toggleClass(div1, "flag", !ctx.flag);
  			addLoc(div1, file$d, 4, 4, 138);
  			div2.className = "scanex-switch svelte-ftc0u3";
  			addLoc(div2, file$d, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div2, anchor);
  			append(div2, div0);

  			if (slot_content_left) {
  				append(div0, slot_content_left);
  			}

  			append(div2, text);
  			append(div2, div1);

  			if (slot_content_right) {
  				append(div1, slot_content_right);
  			}

  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (changed.flag) {
  				toggleClass(div0, "flag", ctx.flag);
  				toggleClass(div1, "flag", !ctx.flag);
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div2);
  			}

  			if (slot_content_left) {
  				reinsertChildren(div0, slot_content_left);
  			}

  			removeListener(div0, "click", click_handler);

  			if (slot_content_right) {
  				reinsertChildren(div1, slot_content_right);
  			}

  			removeListener(div1, "click", click_handler_1);
  		}
  	};
  }

  function Switch(options) {
  	this._debugName = '<Switch>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$c(), options.data);
  	if (!('flag' in this._state)) console.warn("<Switch> was created without expected data property 'flag'");
  	this._intro = !!options.intro;

  	this._slotted = options.slots || {};

  	if (!document.getElementById("svelte-ftc0u3-style")) add_css$2();

  	this._fragment = create_main_fragment$d(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}

  	this._intro = true;
  }

  assign(Switch.prototype, protoDev);

  Switch.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  /* node_modules\scanex-validating-input\src\ValidatingInput.html generated by Svelte v2.15.3 */

  function data$d() {
      return {
          value: '',
          validate: () => true,
          placeholder: ''
      };
  }
  var methods$8 = {            
      check ({target: {value}}) {
          this.set({value});
      }            
  };

  function onupdate$6({changed, current, previous}) {                    
      if (changed.value) {
          const {validate} = this.get();
          let ok = false;
          switch (typeof validate) {
              case 'function':
                  ok = validate(current.value);
                  break;
              case 'string':
                  ok = (new RegExp (validate, 'g')).test(current.value);
                  break;
              default:
                  break;
          }
          if (!ok) {
              if (previous && previous.value) {
                  this.set ({value: previous.value});
              }
              else {
                  this.set ({value: ''});
              }                    
          }
      }
      
  }
  const file$e = "node_modules\\scanex-validating-input\\src\\ValidatingInput.html";

  function create_main_fragment$e(component, ctx) {
  	var input, input_updating = false, current;

  	function input_input_handler() {
  		input_updating = true;
  		component.set({ value: input.value });
  		input_updating = false;
  	}

  	function change_handler(event) {
  		component.check(event);
  	}

  	return {
  		c: function create() {
  			input = createElement("input");
  			addListener(input, "input", input_input_handler);
  			addListener(input, "change", change_handler);
  			setAttribute(input, "type", "text");
  			input.placeholder = ctx.placeholder;
  			addLoc(input, file$e, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, input, anchor);

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

  		o: run,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(input);
  			}

  			removeListener(input, "input", input_input_handler);
  			removeListener(input, "change", change_handler);
  		}
  	};
  }

  function ValidatingInput(options) {
  	this._debugName = '<ValidatingInput>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$d(), options.data);
  	if (!('placeholder' in this._state)) console.warn("<ValidatingInput> was created without expected data property 'placeholder'");
  	if (!('value' in this._state)) console.warn("<ValidatingInput> was created without expected data property 'value'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$6];

  	this._fragment = create_main_fragment$e(this, this._state);

  	this.root._oncreate.push(() => {
  		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(ValidatingInput.prototype, protoDev);
  assign(ValidatingInput.prototype, methods$8);

  ValidatingInput.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  /* src\Layout\StateButton.html generated by Svelte v2.15.3 */

  function data$e() {
  	return {
  		flag: true
  	};
  }
  var file$f = "src\\Layout\\StateButton.html";

  function create_main_fragment$f(component, ctx) {
  	var button,
  	    slot_content_default = component._slotted.default,
  	    current;

  	function click_handler(event) {
  		component.set({ flag: !ctx.flag });
  	}

  	return {
  		c: function create() {
  			button = createElement("button");
  			addListener(button, "click", click_handler);
  			button.className = "state-button";
  			toggleClass(button, "selected", ctx.flag);
  			addLoc(button, file$f, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, button, anchor);

  			if (slot_content_default) {
  				append(button, slot_content_default);
  			}

  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			if (changed.flag) {
  				toggleClass(button, "selected", ctx.flag);
  			}
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
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
  	this._debugName = '<StateButton>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$e(), options.data);
  	if (!('flag' in this._state)) console.warn("<StateButton> was created without expected data property 'flag'");
  	this._intro = !!options.intro;

  	this._slotted = options.slots || {};

  	this._fragment = create_main_fragment$f(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}

  	this._intro = true;
  }

  assign(StateButton.prototype, protoDev);

  StateButton.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\Layout\Toolbar.html generated by Svelte v2.15.3 */

  function data$f() {
  	return {
  		buttons: [],
  		selected: 0
  	};
  }
  var file$g = "src\\Layout\\Toolbar.html";

  function click_handler(event) {
  	var _svelte = this._svelte,
  	    component = _svelte.component,
  	    ctx = _svelte.ctx;


  	component.set({ selected: ctx.i });
  }

  function get_each_context$1(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.button = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function create_main_fragment$g(component, ctx) {
  	var ul, current;

  	var each_value = ctx.buttons;

  	var each_blocks = [];

  	for (var i = 0; i < each_value.length; i += 1) {
  		each_blocks[i] = create_each_block$1(component, get_each_context$1(ctx, each_value, i));
  	}

  	return {
  		c: function create() {
  			ul = createElement("ul");

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].c();
  			}
  			ul.className = "toolbar";
  			addLoc(ul, file$g, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, ul, anchor);

  			for (var i = 0; i < each_blocks.length; i += 1) {
  				each_blocks[i].m(ul, null);
  			}

  			current = true;
  		},

  		p: function update(changed, ctx) {
  			if (changed.selected || changed.buttons) {
  				each_value = ctx.buttons;

  				for (var i = 0; i < each_value.length; i += 1) {
  					var child_ctx = get_each_context$1(ctx, each_value, i);

  					if (each_blocks[i]) {
  						each_blocks[i].p(changed, child_ctx);
  					} else {
  						each_blocks[i] = create_each_block$1(component, child_ctx);
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

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
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
  		c: function create() {
  			label = createElement("label");
  			text = createText(text_value);
  			addLoc(label, file$g, 6, 12, 261);
  		},

  		m: function mount(target, anchor) {
  			insert(target, label, anchor);
  			append(label, text);
  		},

  		p: function update(changed, ctx) {
  			if (changed.buttons && text_value !== (text_value = ctx.button.text)) {
  				setData(text, text_value);
  			}
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(label);
  			}
  		}
  	};
  }

  // (4:8) {#if button.icon}
  function create_if_block$3(component, ctx) {
  	var i, i_class_value;

  	return {
  		c: function create() {
  			i = createElement("i");
  			i.className = i_class_value = ctx.button.icon;
  			addLoc(i, file$g, 4, 12, 179);
  		},

  		m: function mount(target, anchor) {
  			insert(target, i, anchor);
  		},

  		p: function update(changed, ctx) {
  			if (changed.buttons && i_class_value !== (i_class_value = ctx.button.icon)) {
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

  // (2:4) {#each buttons as button, i}
  function create_each_block$1(component, ctx) {
  	var li, text;

  	function select_block_type(ctx) {
  		if (ctx.button.icon) return create_if_block$3;
  		return create_else_block;
  	}

  	var current_block_type = select_block_type(ctx);
  	var if_block = current_block_type(component, ctx);

  	return {
  		c: function create() {
  			li = createElement("li");
  			if_block.c();
  			text = createText("\r\n    ");
  			li._svelte = { component: component, ctx: ctx };

  			addListener(li, "click", click_handler);
  			toggleClass(li, "selected", ctx.i === ctx.selected);
  			addLoc(li, file$g, 2, 4, 60);
  		},

  		m: function mount(target, anchor) {
  			insert(target, li, anchor);
  			if_block.m(li, null);
  			append(li, text);
  		},

  		p: function update(changed, _ctx) {
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

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(li);
  			}

  			if_block.d();
  			removeListener(li, "click", click_handler);
  		}
  	};
  }

  function Toolbar(options) {
  	this._debugName = '<Toolbar>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$f(), options.data);
  	if (!('buttons' in this._state)) console.warn("<Toolbar> was created without expected data property 'buttons'");
  	if (!('selected' in this._state)) console.warn("<Toolbar> was created without expected data property 'selected'");
  	this._intro = !!options.intro;

  	this._fragment = create_main_fragment$g(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}

  	this._intro = true;
  }

  assign(Toolbar.prototype, protoDev);

  Toolbar.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\Layout\Patterns.html generated by Svelte v2.15.3 */

  Translations$1.addText('eng', {
  	pattern: {
  		type: 'Pattern type',
  		width: 'Pattern width',
  		offset: 'Pattern offset',
  		colors: 'Pattern colors'
  	}
  });

  Translations$1.addText('rus', {
  	pattern: {
  		type: 'Тип штриховки',
  		width: 'Ширина штриховки',
  		offset: 'Отступ штриховки',
  		colors: 'Цвета штриховки'
  	}
  });

  var translate = Translations$1.getText.bind(Translations$1);
  var patterns = [{ icon: 'p1', style: 'horizontal' }, { icon: 'p2', style: 'vertical' }, { icon: 'p3', style: 'diagonal1' }, { icon: 'p4', style: 'diagonal2' }, { icon: 'p5', style: 'circle' }, { icon: 'p6', style: 'cross' }];

  function style(_ref) {
  	var styleIndex = _ref.styleIndex;

  	return patterns[styleIndex].style;
  }

  function data$g() {
  	return {
  		colors: [{ color: '#FFFFFF', use: true }, { color: '#FFFFFF', use: true }],
  		dashes: '10 10',
  		offset: 1,
  		outline: '#FFFFFF',
  		outlineAlpha: 100,
  		outlineType: true,
  		outlineSize: 10,
  		styleIndex: 0,
  		useOutline: true,
  		width: 1
  	};
  }
  var methods$9 = {
  	changeColor: function changeColor(e, i) {
  		e.stopPropagation();

  		var _get = this.get(),
  		    colors = _get.colors;

  		var _hex2rgb = hex2rgb(colors[i].color),
  		    r = _hex2rgb.r,
  		    g = _hex2rgb.g,
  		    b = _hex2rgb.b;

  		var _rgb2hsl = rgb2hsl(r, g, b),
  		    h = _rgb2hsl.h,
  		    s = _rgb2hsl.s,
  		    l = _rgb2hsl.l;

  		var _targets$i$getBoundin = this._targets[i].getBoundingClientRect(),
  		    right = _targets$i$getBoundin.right,
  		    top = _targets$i$getBoundin.top;

  		this.fire('colors', { top: top, left: right + 50, hsl: { h: h, s: s, l: l }, index: i });
  	},
  	changeUseColor: function changeUseColor(_ref2, i) {
  		// let { colors } = this.get();
  		// colors[i].use = current.flag;
  		// this.set({colors});

  		var changed = _ref2.changed,
  		    current = _ref2.current;
  	},
  	outline: function outline(e) {
  		e.stopPropagation();

  		var _get2 = this.get(),
  		    outline = _get2.outline;

  		var _hex2rgb2 = hex2rgb(outline),
  		    r = _hex2rgb2.r,
  		    g = _hex2rgb2.g,
  		    b = _hex2rgb2.b;

  		var _rgb2hsl2 = rgb2hsl(r, g, b),
  		    h = _rgb2hsl2.h,
  		    s = _rgb2hsl2.s,
  		    l = _rgb2hsl2.l;

  		h = h || 0;

  		var _refs$outlineSample$g = this.refs.outlineSample.getBoundingClientRect(),
  		    right = _refs$outlineSample$g.right,
  		    top = _refs$outlineSample$g.top;

  		this.fire('outline', { top: top, left: right + 10, hsl: { h: h, s: s, l: l } });
  	}
  };

  function oncreate$6() {
  	this.refs.type.set({ buttons: patterns });
  	this.controls = [];
  	this._targets = [];
  	this._samples = [];

  	var _get3 = this.get(),
  	    colors = _get3.colors;

  	var children$$1 = this.refs.container.querySelectorAll('.colors');
  	for (var i = 0; i < children$$1.length; ++i) {
  		this._targets.push(children$$1[i].querySelector('.text div'));
  		this._samples.push(children$$1[i].querySelector('.button label'));
  		this.controls.push(new ValidatingInput({
  			target: this._targets[i], data: { placeholder: '#FFFFFF', validate: '^#[0-9a-fA-F]+$', value: colors[i].color } }));
  	}
  }
  function onupdate$7(_ref3) {
  	var changed = _ref3.changed,
  	    current = _ref3.current,
  	    previous = _ref3.previous;

  	var _get4 = this.get(),
  	    colors = _get4.colors;

  	for (var i = 0; i < this.controls.length; ++i) {
  		var hex = colors[i].color;

  		var _hex2rgb3 = hex2rgb(hex),
  		    r = _hex2rgb3.r,
  		    g = _hex2rgb3.g,
  		    b = _hex2rgb3.b;

  		this.controls[i].set({ value: hex });
  		this._samples[i].style.backgroundColor = 'rgb(' + [r, g, b].join(',') + ')';
  	}
  	if (changed.outline || changed.outlineAlpha) {
  		var _hex2rgb4 = hex2rgb(current.outline),
  		    _r = _hex2rgb4.r,
  		    _g = _hex2rgb4.g,
  		    _b = _hex2rgb4.b;

  		var a = current.outlineAlpha / 100;
  		this.refs.outlineSample.style.backgroundColor = 'rgba(' + [_r, _g, _b, a].join(',') + ')';
  	}
  	if (changed.outlineType) {
  		this.refs.outlineDash.style.display = current.outlineType ? 'none' : 'table-cell';
  	}
  }
  var file$h = "src\\Layout\\Patterns.html";

  function click_handler$1(event) {
  	var _svelte = this._svelte,
  	    component = _svelte.component,
  	    ctx = _svelte.ctx;


  	component.changeColor(event, ctx.i);
  }

  function get_each_context$2(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.x = list[i];
  	child_ctx.i = i;
  	return child_ctx;
  }

  function create_main_fragment$h(component, ctx) {
  	var table,
  	    tr0,
  	    td0,
  	    text0_value = translate('pattern.type'),
  	    text0,
  	    text1,
  	    td1,
  	    toolbar_updating = {},
  	    text2,
  	    tr1,
  	    td2,
  	    text3_value = translate('pattern.width'),
  	    text3,
  	    text4,
  	    td3,
  	    inputinteger0_updating = {},
  	    text5,
  	    tr2,
  	    td4,
  	    text6_value = translate('pattern.offset'),
  	    text6,
  	    text7,
  	    td5,
  	    inputinteger1_updating = {},
  	    text8,
  	    text9,
  	    tr3,
  	    td6,
  	    text10_value = translate('outline'),
  	    text10,
  	    text11,
  	    td7,
  	    i0,
  	    statebutton_updating = {},
  	    text12,
  	    td8,
  	    inputinteger2_updating = {},
  	    text13,
  	    td9,
  	    validatinginput0_updating = {},
  	    text14,
  	    td10,
  	    label,
  	    text15,
  	    tr4,
  	    td11,
  	    text16_value = translate('thickness'),
  	    text16,
  	    text17,
  	    td12,
  	    inputinteger3_updating = {},
  	    text18,
  	    tr5,
  	    td13,
  	    text19_value = translate('type'),
  	    text19,
  	    text20,
  	    td14,
  	    i1,
  	    text22,
  	    i2,
  	    switch_1_updating = {},
  	    text24,
  	    span,
  	    validatinginput1_updating = {},
  	    current;

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
  	var inputinteger0 = new InputInteger({
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
  	var inputinteger1 = new InputInteger({
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
  		each_blocks[i] = create_each_block$2(component, get_each_context$2(ctx, each_value, i));
  	}

  	function outroBlock(i, detach, fn) {
  		if (each_blocks[i]) {
  			each_blocks[i].o(function () {
  				if (detach) {
  					each_blocks[i].d(detach);
  					each_blocks[i] = null;
  				}
  				if (fn) fn();
  			});
  		}
  	}

  	var statebutton_initial_data = {};
  	if (ctx.useOutline !== void 0) {
  		statebutton_initial_data.flag = ctx.useOutline;
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
  				newState.useOutline = childState.flag;
  			}
  			component._set(newState);
  			statebutton_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		statebutton._bind({ flag: 1 }, statebutton.get());
  	});

  	var inputinteger2_initial_data = { min: "0", max: "100", value: "100" };
  	if (ctx.outlineAlpha !== void 0) {
  		inputinteger2_initial_data.value = ctx.outlineAlpha;
  		inputinteger2_updating.value = true;
  	}
  	var inputinteger2 = new InputInteger({
  		root: component.root,
  		store: component.store,
  		data: inputinteger2_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger2_updating.value && changed.value) {
  				newState.outlineAlpha = childState.value;
  			}
  			component._set(newState);
  			inputinteger2_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger2._bind({ value: 1 }, inputinteger2.get());
  	});

  	var validatinginput0_initial_data = {
  		placeholder: "#FFFFFF",
  		validate: "^#[0-9a-fA-F]+$"
  	};
  	if (ctx.outline !== void 0) {
  		validatinginput0_initial_data.value = ctx.outline;
  		validatinginput0_updating.value = true;
  	}
  	var validatinginput0 = new ValidatingInput({
  		root: component.root,
  		store: component.store,
  		data: validatinginput0_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!validatinginput0_updating.value && changed.value) {
  				newState.outline = childState.value;
  			}
  			component._set(newState);
  			validatinginput0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		validatinginput0._bind({ value: 1 }, validatinginput0.get());
  	});

  	component.refs.outlineText = validatinginput0;

  	function click_handler_1(event) {
  		component.outline(event);
  	}

  	var inputinteger3_initial_data = { min: "0", max: "24", value: "10" };
  	if (ctx.outlineSize !== void 0) {
  		inputinteger3_initial_data.value = ctx.outlineSize;
  		inputinteger3_updating.value = true;
  	}
  	var inputinteger3 = new InputInteger({
  		root: component.root,
  		store: component.store,
  		data: inputinteger3_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger3_updating.value && changed.value) {
  				newState.outlineSize = childState.value;
  			}
  			component._set(newState);
  			inputinteger3_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger3._bind({ value: 1 }, inputinteger3.get());
  	});

  	var switch_1_initial_data = {};
  	if (ctx.outlineType !== void 0) {
  		switch_1_initial_data.flag = ctx.outlineType;
  		switch_1_updating.flag = true;
  	}
  	var switch_1 = new Switch({
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

  	var validatinginput1_initial_data = {
  		placeholder: "10 10",
  		validate: "^[0-9]+\\s+[0-9]+$"
  	};
  	if (ctx.dashes !== void 0) {
  		validatinginput1_initial_data.value = ctx.dashes;
  		validatinginput1_updating.value = true;
  	}
  	var validatinginput1 = new ValidatingInput({
  		root: component.root,
  		store: component.store,
  		data: validatinginput1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!validatinginput1_updating.value && changed.value) {
  				newState.dashes = childState.value;
  			}
  			component._set(newState);
  			validatinginput1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		validatinginput1._bind({ value: 1 }, validatinginput1.get());
  	});

  	return {
  		c: function create() {
  			table = createElement("table");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			text0 = createText(text0_value);
  			text1 = createText("\r\n        ");
  			td1 = createElement("td");
  			toolbar._fragment.c();
  			text2 = createText("\r\n    ");
  			tr1 = createElement("tr");
  			td2 = createElement("td");
  			text3 = createText(text3_value);
  			text4 = createText("        \r\n        ");
  			td3 = createElement("td");
  			inputinteger0._fragment.c();
  			text5 = createText("\r\n    ");
  			tr2 = createElement("tr");
  			td4 = createElement("td");
  			text6 = createText(text6_value);
  			text7 = createText("        \r\n        ");
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
  			i0 = createElement("i");
  			statebutton._fragment.c();
  			text12 = createText("\r\n        ");
  			td8 = createElement("td");
  			inputinteger2._fragment.c();
  			text13 = createText("\r\n        ");
  			td9 = createElement("td");
  			validatinginput0._fragment.c();
  			text14 = createText("\r\n        ");
  			td10 = createElement("td");
  			label = createElement("label");
  			text15 = createText("\r\n    ");
  			tr4 = createElement("tr");
  			td11 = createElement("td");
  			text16 = createText(text16_value);
  			text17 = createText("\r\n        ");
  			td12 = createElement("td");
  			inputinteger3._fragment.c();
  			text18 = createText("\r\n    ");
  			tr5 = createElement("tr");
  			td13 = createElement("td");
  			text19 = createText(text19_value);
  			text20 = createText("                   \r\n        ");
  			td14 = createElement("td");
  			i1 = createElement("i");
  			i1.textContent = "┃";
  			text22 = createText("\r\n                ");
  			i2 = createElement("i");
  			i2.textContent = "┇";
  			switch_1._fragment.c();
  			text24 = createText(" \r\n            ");
  			span = createElement("span");
  			validatinginput1._fragment.c();
  			td0.className = "label";
  			addLoc(td0, file$h, 2, 8, 86);
  			td1.colSpan = "4";
  			addLoc(td1, file$h, 3, 8, 146);
  			tr0.className = "type";
  			addLoc(tr0, file$h, 1, 4, 59);
  			td2.className = "label";
  			addLoc(td2, file$h, 8, 8, 291);
  			td3.className = "value integer-input";
  			td3.colSpan = "4";
  			addLoc(td3, file$h, 9, 8, 360);
  			tr1.className = "width";
  			addLoc(tr1, file$h, 7, 4, 263);
  			td4.className = "label";
  			addLoc(td4, file$h, 14, 8, 531);
  			td5.className = "value integer-input";
  			td5.colSpan = "4";
  			addLoc(td5, file$h, 15, 8, 601);
  			tr2.className = "offset";
  			addLoc(tr2, file$h, 13, 4, 502);
  			td6.className = "label";
  			addLoc(td6, file$h, 40, 8, 1405);
  			i0.className = "style-editor-icon";
  			addLoc(i0, file$h, 43, 16, 1555);
  			td7.className = "clear";
  			addLoc(td7, file$h, 41, 8, 1468);
  			td8.className = "alpha integer-input";
  			addLoc(td8, file$h, 46, 8, 1641);
  			td9.className = "text";
  			addLoc(td9, file$h, 49, 8, 1784);
  			addListener(label, "click", click_handler_1);
  			addLoc(label, file$h, 53, 12, 1979);
  			td10.className = "button";
  			addLoc(td10, file$h, 52, 8, 1945);
  			tr3.className = "outline";
  			addLoc(tr3, file$h, 39, 4, 1375);
  			td11.className = "label";
  			addLoc(td11, file$h, 57, 8, 2092);
  			td12.className = "size integer-input";
  			td12.colSpan = "4";
  			addLoc(td12, file$h, 58, 8, 2149);
  			addLoc(tr4, file$h, 56, 4, 2078);
  			td13.className = "label";
  			addLoc(td13, file$h, 63, 8, 2334);
  			setAttribute(i1, "slot", "left");
  			addLoc(i1, file$h, 66, 16, 2505);
  			setAttribute(i2, "slot", "right");
  			addLoc(i2, file$h, 67, 16, 2550);
  			span.className = "dash";
  			addLoc(span, file$h, 69, 12, 2616);
  			td14.className = "type-switch";
  			td14.colSpan = "4";
  			addLoc(td14, file$h, 64, 8, 2405);
  			tr5.className = "type";
  			addLoc(tr5, file$h, 62, 4, 2307);
  			setAttribute(table, "cellpadding", "0");
  			setAttribute(table, "cellspacing", "0");
  			addLoc(table, file$h, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
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
  				each_blocks[i].i(table, null);
  			}

  			append(table, text9);
  			append(table, tr3);
  			append(tr3, td6);
  			append(td6, text10);
  			append(tr3, text11);
  			append(tr3, td7);
  			append(statebutton._slotted.default, i0);
  			statebutton._mount(td7, null);
  			append(tr3, text12);
  			append(tr3, td8);
  			inputinteger2._mount(td8, null);
  			append(tr3, text13);
  			append(tr3, td9);
  			validatinginput0._mount(td9, null);
  			append(tr3, text14);
  			append(tr3, td10);
  			append(td10, label);
  			component.refs.outlineSample = label;
  			append(table, text15);
  			append(table, tr4);
  			append(tr4, td11);
  			append(td11, text16);
  			append(tr4, text17);
  			append(tr4, td12);
  			inputinteger3._mount(td12, null);
  			append(table, text18);
  			append(table, tr5);
  			append(tr5, td13);
  			append(td13, text19);
  			append(tr5, text20);
  			append(tr5, td14);
  			append(switch_1._slotted.left, i1);
  			append(switch_1._slotted.default, text22);
  			append(switch_1._slotted.right, i2);
  			switch_1._mount(td14, null);
  			append(td14, text24);
  			append(td14, span);
  			validatinginput1._mount(span, null);
  			component.refs.outlineDash = span;
  			component.refs.container = table;
  			current = true;
  		},

  		p: function update(changed, _ctx) {
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

  				for (var i = each_blocks.length; i < each_value.length; i += 1) {
  					var child_ctx = get_each_context$2(ctx, each_value, i);

  					each_blocks[i] = create_each_block$2(component, child_ctx);
  					each_blocks[i].c();
  					each_blocks[i].i(table, text9);
  				}
  				for (; i < each_blocks.length; i += 1) {
  					outroBlock(i, 1);
  				}
  			}

  			var statebutton_changes = {};
  			if (!statebutton_updating.flag && changed.useOutline) {
  				statebutton_changes.flag = ctx.useOutline;
  				statebutton_updating.flag = ctx.useOutline !== void 0;
  			}
  			statebutton._set(statebutton_changes);
  			statebutton_updating = {};

  			var inputinteger2_changes = {};
  			if (!inputinteger2_updating.value && changed.outlineAlpha) {
  				inputinteger2_changes.value = ctx.outlineAlpha;
  				inputinteger2_updating.value = ctx.outlineAlpha !== void 0;
  			}
  			inputinteger2._set(inputinteger2_changes);
  			inputinteger2_updating = {};

  			var validatinginput0_changes = {};
  			if (!validatinginput0_updating.value && changed.outline) {
  				validatinginput0_changes.value = ctx.outline;
  				validatinginput0_updating.value = ctx.outline !== void 0;
  			}
  			validatinginput0._set(validatinginput0_changes);
  			validatinginput0_updating = {};

  			var inputinteger3_changes = {};
  			if (!inputinteger3_updating.value && changed.outlineSize) {
  				inputinteger3_changes.value = ctx.outlineSize;
  				inputinteger3_updating.value = ctx.outlineSize !== void 0;
  			}
  			inputinteger3._set(inputinteger3_changes);
  			inputinteger3_updating = {};

  			var switch_1_changes = {};
  			if (!switch_1_updating.flag && changed.outlineType) {
  				switch_1_changes.flag = ctx.outlineType;
  				switch_1_updating.flag = ctx.outlineType !== void 0;
  			}
  			switch_1._set(switch_1_changes);
  			switch_1_updating = {};

  			var validatinginput1_changes = {};
  			if (!validatinginput1_updating.value && changed.dashes) {
  				validatinginput1_changes.value = ctx.dashes;
  				validatinginput1_updating.value = ctx.dashes !== void 0;
  			}
  			validatinginput1._set(validatinginput1_changes);
  			validatinginput1_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			outrocallback = callAfter(outrocallback, 10);

  			if (toolbar) toolbar._fragment.o(outrocallback);
  			if (inputinteger0) inputinteger0._fragment.o(outrocallback);
  			if (inputinteger1) inputinteger1._fragment.o(outrocallback);

  			each_blocks = each_blocks.filter(Boolean);
  			var countdown = callAfter(outrocallback, each_blocks.length);
  			for (var _i = 0; _i < each_blocks.length; _i += 1) {
  				outroBlock(_i, 0, countdown);
  			}if (statebutton) statebutton._fragment.o(outrocallback);
  			if (inputinteger2) inputinteger2._fragment.o(outrocallback);
  			if (validatinginput0) validatinginput0._fragment.o(outrocallback);
  			if (inputinteger3) inputinteger3._fragment.o(outrocallback);
  			if (switch_1) switch_1._fragment.o(outrocallback);
  			if (validatinginput1) validatinginput1._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(table);
  			}

  			toolbar.destroy();
  			if (component.refs.type === toolbar) component.refs.type = null;
  			inputinteger0.destroy();
  			inputinteger1.destroy();

  			destroyEach(each_blocks, detach);

  			statebutton.destroy();
  			inputinteger2.destroy();
  			validatinginput0.destroy();
  			if (component.refs.outlineText === validatinginput0) component.refs.outlineText = null;
  			removeListener(label, "click", click_handler_1);
  			if (component.refs.outlineSample === label) component.refs.outlineSample = null;
  			inputinteger3.destroy();
  			switch_1.destroy();
  			validatinginput1.destroy();
  			if (component.refs.outlineDash === span) component.refs.outlineDash = null;
  			if (component.refs.container === table) component.refs.container = null;
  		}
  	};
  }

  // (24:8) {:else}
  function create_else_block$1(component, ctx) {
  	var td;

  	return {
  		c: function create() {
  			td = createElement("td");
  			td.className = "label";
  			addLoc(td, file$h, 24, 12, 911);
  		},

  		m: function mount(target, anchor) {
  			insert(target, td, anchor);
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(td);
  			}
  		}
  	};
  }

  // (22:8) {#if i === 0}
  function create_if_block$4(component, ctx) {
  	var td,
  	    text_value = translate('pattern.colors'),
  	    text;

  	return {
  		c: function create() {
  			td = createElement("td");
  			text = createText(text_value);
  			td.className = "label";
  			addLoc(td, file$h, 22, 12, 828);
  		},

  		m: function mount(target, anchor) {
  			insert(target, td, anchor);
  			append(td, text);
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(td);
  			}
  		}
  	};
  }

  // (20:4) {#each colors as x, i}
  function create_each_block$2(component, ctx) {
  	var tr, text0, td0, i_1, text1, td1, div, text2, td2, label, current;

  	function select_block_type(ctx) {
  		if (ctx.i === 0) return create_if_block$4;
  		return create_else_block$1;
  	}

  	var current_block_type = select_block_type(ctx);
  	var if_block = current_block_type(component, ctx);

  	var statebutton = new StateButton({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() }
  	});

  	statebutton.on("state", function (event) {
  		component.changeUseColor(event, ctx.i);
  	});

  	return {
  		c: function create() {
  			tr = createElement("tr");
  			if_block.c();
  			text0 = createText("        \r\n        ");
  			td0 = createElement("td");
  			i_1 = createElement("i");
  			statebutton._fragment.c();
  			text1 = createText("        \r\n        ");
  			td1 = createElement("td");
  			div = createElement("div");
  			text2 = createText("\r\n        ");
  			td2 = createElement("td");
  			label = createElement("label");
  			i_1.className = "style-editor-icon";
  			addLoc(i_1, file$h, 28, 16, 1078);
  			td0.className = "clear";
  			td0.colSpan = "2";
  			addLoc(td0, file$h, 26, 8, 967);
  			addLoc(div, file$h, 32, 12, 1203);
  			td1.className = "text";
  			addLoc(td1, file$h, 31, 8, 1172);

  			label._svelte = { component: component, ctx: ctx };

  			addListener(label, "click", click_handler$1);
  			addLoc(label, file$h, 35, 12, 1282);
  			td2.className = "button";
  			addLoc(td2, file$h, 34, 8, 1248);
  			tr.className = "colors";
  			addLoc(tr, file$h, 20, 4, 772);
  		},

  		m: function mount(target, anchor) {
  			insert(target, tr, anchor);
  			if_block.m(tr, null);
  			append(tr, text0);
  			append(tr, td0);
  			append(statebutton._slotted.default, i_1);
  			statebutton._mount(td0, null);
  			append(tr, text1);
  			append(tr, td1);
  			append(td1, div);
  			append(tr, text2);
  			append(tr, td2);
  			append(td2, label);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
  				if_block.d(1);
  				if_block = current_block_type(component, ctx);
  				if_block.c();
  				if_block.m(tr, text0);
  			}

  			label._svelte.ctx = ctx;
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			if (statebutton) statebutton._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(tr);
  			}

  			if_block.d();
  			statebutton.destroy();
  			removeListener(label, "click", click_handler$1);
  		}
  	};
  }

  function Patterns(options) {
  	var _this = this;

  	this._debugName = '<Patterns>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$g(), options.data);

  	this._recompute({ styleIndex: 1 }, this._state);
  	if (!('styleIndex' in this._state)) console.warn("<Patterns> was created without expected data property 'styleIndex'");
  	if (!('width' in this._state)) console.warn("<Patterns> was created without expected data property 'width'");
  	if (!('offset' in this._state)) console.warn("<Patterns> was created without expected data property 'offset'");
  	if (!('colors' in this._state)) console.warn("<Patterns> was created without expected data property 'colors'");
  	if (!('useOutline' in this._state)) console.warn("<Patterns> was created without expected data property 'useOutline'");
  	if (!('outlineAlpha' in this._state)) console.warn("<Patterns> was created without expected data property 'outlineAlpha'");
  	if (!('outline' in this._state)) console.warn("<Patterns> was created without expected data property 'outline'");
  	if (!('outlineSize' in this._state)) console.warn("<Patterns> was created without expected data property 'outlineSize'");
  	if (!('outlineType' in this._state)) console.warn("<Patterns> was created without expected data property 'outlineType'");
  	if (!('dashes' in this._state)) console.warn("<Patterns> was created without expected data property 'dashes'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$7];

  	this._fragment = create_main_fragment$h(this, this._state);

  	this.root._oncreate.push(function () {
  		oncreate$6.call(_this);
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

  assign(Patterns.prototype, protoDev);
  assign(Patterns.prototype, methods$9);

  Patterns.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('style' in newState && !this._updatingReadonlyProperty) throw new Error("<Patterns>: Cannot set read-only property 'style'");
  };

  Patterns.prototype._recompute = function _recompute(changed, state) {
  	if (changed.styleIndex) {
  		if (this._differs(state.style, state.style = style(state))) changed.style = true;
  	}
  };

  /* src\Layout\Layout.html generated by Svelte v2.15.3 */

  Translations$1.addText('eng', {
  	decoration: 'Decoration',
  	fill: 'Fill',
  	font: { family: 'Font', size: 'Font size and style' },
  	legend: 'Legend',
  	offset: { x: 'X offset', y: 'Y offset' },
  	outline: 'Outline',
  	text: 'Text',
  	thickness: 'Thickness',
  	dash: 'Dash, px',
  	type: 'Outline type',
  	marker: 'Upload marker',
  	whitespace: 'Whitespace, px'
  });

  Translations$1.addText('rus', {
  	decoration: 'Оформление',
  	fill: 'Заливка',
  	font: { family: 'Шрифт', size: 'Кегль и начертание' },
  	legend: 'Подпись',
  	offset: { x: 'Смещение по X', y: 'Смещение по Y' },
  	outline: 'Обводка',
  	text: 'Текст',
  	thickness: 'Толщина',
  	dash: 'Штрих, пкс',
  	type: 'Тип обводки',
  	marker: 'Загрузить маркер',
  	whitespace: 'Пробел, пкс'
  });

  var translate$1 = Translations$1.getText.bind(Translations$1);

  function data$h() {
  	return {
  		dashes: '10 10',
  		decorationFill: '#FFFFFF',
  		decorationFillAlpha: 100,
  		decorationOutline: '#FFFFFF',
  		decorationOutlineAlpha: 100,
  		decorationOutlineSize: 10,
  		decorationOutlineType: true,
  		fillStyle: 0,
  		fonts: ['Roboto'],
  		legendFields: [],
  		legendFill: '#FFFFFF',
  		legendField: '',
  		legendOutline: '#FFFFFF',
  		legendOutlineSize: 10,
  		legendFontSize: 10,
  		legendFont: 'Roboto',
  		legendFontStyle: '',
  		legendFontStyles: ['Regular'],
  		legendOffsetX: 0,
  		legendOffsetY: 0,
  		patternColors: [{ color: '#FFFFFF', use: true }, { color: '#FFFFFF', use: true }],
  		patternStyleIndex: 0,
  		patternStyle: '',
  		patternWidth: 1,
  		patternOffset: 1,
  		useDecorationFill: true,
  		useLegendOutline: true
  	};
  }
  var methods$a = {
  	click: function click(e) {
  		this._colorTarget = null;
  		this.refs.pickerContainer.style.visibility = 'hidden';
  	},
  	decorationFill: function decorationFill(e) {
  		e.stopPropagation();
  		this._colorTarget = 'decoration_fill';

  		var _get = this.get(),
  		    decorationFill = _get.decorationFill,
  		    decorationFillAlpha = _get.decorationFillAlpha;

  		var _hex2rgb = hex2rgb(decorationFill),
  		    r = _hex2rgb.r,
  		    g = _hex2rgb.g,
  		    b = _hex2rgb.b;

  		var _rgb2hsl = rgb2hsl(r, g, b),
  		    h = _rgb2hsl.h,
  		    s = _rgb2hsl.s,
  		    l = _rgb2hsl.l;

  		h = h || 0;
  		this.refs.colorPicker.set({ hue: h, saturation: s, lightness: l, alpha: decorationFillAlpha });

  		var _refs$decorationFillS = this.refs.decorationFillSample.getBoundingClientRect(),
  		    right = _refs$decorationFillS.right,
  		    top = _refs$decorationFillS.top;

  		this.refs.pickerContainer.style.left = right + 10 + 'px';
  		this.refs.pickerContainer.style.top = top + 'px';
  		this.refs.pickerContainer.style.visibility = 'visible';
  	},
  	decorationOutline: function decorationOutline(e) {
  		e.stopPropagation();
  		this._colorTarget = 'decoration_outline';

  		var _get2 = this.get(),
  		    decorationOutline = _get2.decorationOutline;

  		var _hex2rgb2 = hex2rgb(decorationOutline),
  		    r = _hex2rgb2.r,
  		    g = _hex2rgb2.g,
  		    b = _hex2rgb2.b;

  		var _rgb2hsl2 = rgb2hsl(r, g, b),
  		    h = _rgb2hsl2.h,
  		    s = _rgb2hsl2.s,
  		    l = _rgb2hsl2.l;

  		h = h || 0;
  		this.refs.colorPicker.set({ hue: h, saturation: s, lightness: l, alpha: 100 });

  		var _refs$decorationOutli = this.refs.decorationOutlineSample.getBoundingClientRect(),
  		    right = _refs$decorationOutli.right,
  		    top = _refs$decorationOutli.top;

  		this.refs.pickerContainer.style.left = right + 10 + 'px';
  		this.refs.pickerContainer.style.top = top + 'px';
  		this.refs.pickerContainer.style.visibility = 'visible';
  	},
  	legendFill: function legendFill(e) {
  		e.stopPropagation();
  		this._colorTarget = 'legend_fill';

  		var _get3 = this.get(),
  		    legendFill = _get3.legendFill;

  		var _hex2rgb3 = hex2rgb(legendFill),
  		    r = _hex2rgb3.r,
  		    g = _hex2rgb3.g,
  		    b = _hex2rgb3.b;

  		var _rgb2hsl3 = rgb2hsl(r, g, b),
  		    h = _rgb2hsl3.h,
  		    s = _rgb2hsl3.s,
  		    l = _rgb2hsl3.l;

  		h = h || 0;
  		this.refs.colorPicker.set({ hue: h, saturation: s, lightness: l });

  		var _refs$legendFillSampl = this.refs.legendFillSample.getBoundingClientRect(),
  		    right = _refs$legendFillSampl.right,
  		    top = _refs$legendFillSampl.top;

  		this.refs.pickerContainer.style.left = right + 10 + 'px';
  		this.refs.pickerContainer.style.top = top + 'px';
  		this.refs.pickerContainer.style.visibility = 'visible';
  	},
  	legendOutline: function legendOutline(e) {
  		e.stopPropagation();
  		this._colorTarget = 'legend_outline';

  		var _get4 = this.get(),
  		    legendOutline = _get4.legendOutline;

  		var _hex2rgb4 = hex2rgb(legendOutline),
  		    r = _hex2rgb4.r,
  		    g = _hex2rgb4.g,
  		    b = _hex2rgb4.b;

  		var _rgb2hsl4 = rgb2hsl(r, g, b),
  		    h = _rgb2hsl4.h,
  		    s = _rgb2hsl4.s,
  		    l = _rgb2hsl4.l;

  		h = h || 0;
  		this.refs.colorPicker.set({ hue: h, saturation: s, lightness: l, alpha: 100 });

  		var _refs$legendOutlineSa = this.refs.legendOutlineSample.getBoundingClientRect(),
  		    right = _refs$legendOutlineSa.right,
  		    top = _refs$legendOutlineSa.top;

  		this.refs.pickerContainer.style.left = right + 10 + 'px';
  		this.refs.pickerContainer.style.top = top + 'px';
  		this.refs.pickerContainer.style.visibility = 'visible';
  	},
  	changeColor: function changeColor(_ref) {
  		var changed = _ref.changed,
  		    current = _ref.current,
  		    previous = _ref.previous;

  		if (changed.rgba) {
  			switch (this._colorTarget) {
  				case 'decoration_fill':
  					this.set({ decorationFill: current.hex, decorationFillAlpha: Math.round(current.alpha) });
  					break;
  				case 'decoration_outline':
  					this.set({ decorationOutline: current.hex, decorationOutlineAlpha: Math.round(current.alpha) });
  					break;
  				case 'legend_fill':
  					this.set({ legendFill: current.hex });
  					break;
  				case 'legend_outline':
  					this.set({ legendOutline: current.hex });
  					break;
  				case 'pattern_colors':
  					var _get5 = this.get(),
  					    patternColors = _get5.patternColors;

  					patternColors[this._patternIndex].color = current.hex;
  					this.set({ patternColors: patternColors });
  					break;
  				default:
  					break;
  			}
  		}
  	},
  	patternColors: function patternColors(_ref2) {
  		var top = _ref2.top,
  		    left = _ref2.left,
  		    _ref2$hsl = _ref2.hsl,
  		    h = _ref2$hsl.h,
  		    s = _ref2$hsl.s,
  		    l = _ref2$hsl.l,
  		    index = _ref2.index;

  		this._colorTarget = 'pattern_colors';
  		this._patternIndex = index;
  		this.refs.colorPicker.set({ hue: h || 0, saturation: s, lightness: l });
  		this.refs.pickerContainer.style.left = left + 'px';
  		this.refs.pickerContainer.style.top = top + 'px';
  		this.refs.pickerContainer.style.visibility = 'visible';
  	},
  	patternOutline: function patternOutline(_ref3) {
  		var top = _ref3.top,
  		    left = _ref3.left,
  		    _ref3$hsl = _ref3.hsl,
  		    h = _ref3$hsl.h,
  		    s = _ref3$hsl.s,
  		    l = _ref3$hsl.l;

  		this._colorTarget = 'decoration_outline';
  		this.refs.colorPicker.set({ hue: h || 0, saturation: s, lightness: l });
  		this.refs.pickerContainer.style.left = left + 'px';
  		this.refs.pickerContainer.style.top = top + 'px';
  		this.refs.pickerContainer.style.visibility = 'visible';
  	},
  	addField: function addField(_ref4) {
  		var value = _ref4.target.value;

  		var text = this.refs.field.value;
  		if (value && value.trim() !== '') {
  			var start = this.refs.field.selectionStart;
  			var end = this.refs.field.selectionEnd;
  			var _text = this.refs.field.value;
  			this.set({ legendField: [_text.substring(0, start), '[' + value.trim() + ']', _text.substring(end)].join('') });
  		} else {
  			this.set({ legendField: text });
  		}
  	}
  };

  function onupdate$8(_ref5) {
  	var changed = _ref5.changed,
  	    current = _ref5.current,
  	    previous = _ref5.previous;

  	if (changed.decorationFill || changed.decorationFillAlpha) {
  		var _hex2rgb5 = hex2rgb(current.decorationFill),
  		    r = _hex2rgb5.r,
  		    g = _hex2rgb5.g,
  		    b = _hex2rgb5.b;

  		var a = current.decorationFillAlpha / 100;
  		this.refs.decorationFillSample.style.backgroundColor = 'rgba(' + [r, g, b, a].join(',') + ')';
  	}
  	if (changed.decorationOutline || changed.decorationOutlineAlpha) {
  		var _hex2rgb6 = hex2rgb(current.decorationOutline),
  		    _r = _hex2rgb6.r,
  		    _g = _hex2rgb6.g,
  		    _b = _hex2rgb6.b;

  		var _a = current.decorationOutlineAlpha / 100;
  		this.refs.decorationOutlineSample.style.backgroundColor = 'rgba(' + [_r, _g, _b, _a].join(',') + ')';
  	}
  	if (changed.decorationOutlineType) {
  		this.refs.fillOutlineDash.style.display = current.decorationOutlineType ? 'none' : 'table-cell';
  	}
  	if (changed.legendFill) {
  		this.refs.legendFillSample.style.backgroundColor = current.legendFill;
  	}
  	if (changed.legendOutline) {
  		this.refs.legendOutlineSample.style.backgroundColor = current.legendOutline;
  	}
  	if (changed.patternStyleIndex) {
  		this.set({ patternStyle: this.refs.patterns.get().style });
  	}
  }
  var file$i = "src\\Layout\\Layout.html";

  function get_each2_context(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.s = list[i];
  	return child_ctx;
  }

  function get_each1_context(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.f = list[i];
  	return child_ctx;
  }

  function get_each0_context(ctx, list, i) {
  	var child_ctx = Object.create(ctx);
  	child_ctx.f = list[i];
  	return child_ctx;
  }

  function create_main_fragment$i(component, ctx) {
  	var div0,
  	    label0,
  	    text0_value = translate$1('decoration'),
  	    text0,
  	    text1,
  	    table0,
  	    tr0,
  	    td0,
  	    text2_value = translate$1('fill'),
  	    text2,
  	    text3,
  	    td1,
  	    i0,
  	    statebutton0_updating = {},
  	    text4,
  	    td2,
  	    inputinteger0_updating = {},
  	    text5,
  	    td3,
  	    validatinginput0_updating = {},
  	    text6,
  	    td4,
  	    label1,
  	    text7,
  	    tr1,
  	    td5,
  	    text8_value = translate$1('outline'),
  	    text8,
  	    text9,
  	    td6,
  	    text10,
  	    td7,
  	    inputinteger1_updating = {},
  	    text11,
  	    td8,
  	    validatinginput1_updating = {},
  	    text12,
  	    td9,
  	    label2,
  	    text13,
  	    tr2,
  	    td10,
  	    text14_value = translate$1('thickness'),
  	    text14,
  	    text15,
  	    td11,
  	    text16,
  	    td12,
  	    inputinteger2_updating = {},
  	    text17,
  	    tr3,
  	    td13,
  	    text18_value = translate$1('type'),
  	    text18,
  	    text19,
  	    td14,
  	    i1,
  	    text21,
  	    i2,
  	    switch_1_updating = {},
  	    text23,
  	    span,
  	    validatinginput2_updating = {},
  	    text24,
  	    patterns_updating = {},
  	    text25,
  	    table1,
  	    tr4,
  	    td15,
  	    text26_value = translate$1('marker'),
  	    text26,
  	    text27,
  	    td16,
  	    input0,
  	    text28,
  	    td17,
  	    label3,
  	    i3,
  	    tabs_updating = {},
  	    text29,
  	    div1,
  	    label4,
  	    text30_value = translate$1('legend'),
  	    text30,
  	    text31,
  	    table2,
  	    tr5,
  	    td18,
  	    text32_value = translate$1('text'),
  	    text32,
  	    text33,
  	    td19,
  	    select0,
  	    text34,
  	    tr6,
  	    td20,
  	    text35,
  	    td21,
  	    textarea,
  	    textarea_updating = false,
  	    text36,
  	    tr7,
  	    td22,
  	    text37_value = translate$1('font.family'),
  	    text37,
  	    text38,
  	    td23,
  	    select1,
  	    select1_updating = false,
  	    text39,
  	    tr8,
  	    td24,
  	    text40_value = translate$1('font.size'),
  	    text40,
  	    text41,
  	    td25,
  	    inputinteger3_updating = {},
  	    text42,
  	    td26,
  	    select2,
  	    select2_updating = false,
  	    text43,
  	    tr9,
  	    td27,
  	    text44_value = translate$1('fill'),
  	    text44,
  	    text45,
  	    td28,
  	    text46,
  	    td29,
  	    input1,
  	    input1_updating = false,
  	    text47,
  	    td30,
  	    label5,
  	    text48,
  	    tr10,
  	    td31,
  	    text49_value = translate$1('outline'),
  	    text49,
  	    text50,
  	    td32,
  	    i4,
  	    statebutton1_updating = {},
  	    text51,
  	    td33,
  	    input2,
  	    input2_updating = false,
  	    text52,
  	    td34,
  	    label6,
  	    text53,
  	    tr11,
  	    td35,
  	    text54_value = translate$1('offset.x'),
  	    text54,
  	    text55,
  	    td36,
  	    inputinteger4_updating = {},
  	    text56,
  	    tr12,
  	    td37,
  	    text57_value = translate$1('offset.y'),
  	    text57,
  	    text58,
  	    td38,
  	    inputinteger5_updating = {},
  	    text59,
  	    div2,
  	    current;

  	function onwindowclick(event) {
  		component.click(event);	}
  	window.addEventListener("click", onwindowclick);

  	var statebutton0_initial_data = {};
  	if (ctx.useDecorationFill !== void 0) {
  		statebutton0_initial_data.flag = ctx.useDecorationFill;
  		statebutton0_updating.flag = true;
  	}
  	var statebutton0 = new StateButton({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: statebutton0_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!statebutton0_updating.flag && changed.flag) {
  				newState.useDecorationFill = childState.flag;
  			}
  			component._set(newState);
  			statebutton0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		statebutton0._bind({ flag: 1 }, statebutton0.get());
  	});

  	var inputinteger0_initial_data = { min: "0", max: "100", value: "100" };
  	if (ctx.decorationFillAlpha !== void 0) {
  		inputinteger0_initial_data.value = ctx.decorationFillAlpha;
  		inputinteger0_updating.value = true;
  	}
  	var inputinteger0 = new InputInteger({
  		root: component.root,
  		store: component.store,
  		data: inputinteger0_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger0_updating.value && changed.value) {
  				newState.decorationFillAlpha = childState.value;
  			}
  			component._set(newState);
  			inputinteger0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger0._bind({ value: 1 }, inputinteger0.get());
  	});

  	var validatinginput0_initial_data = { validate: "^#[0-9a-fA-F]+$" };
  	if (ctx.decorationFill !== void 0) {
  		validatinginput0_initial_data.value = ctx.decorationFill;
  		validatinginput0_updating.value = true;
  	}
  	var validatinginput0 = new ValidatingInput({
  		root: component.root,
  		store: component.store,
  		data: validatinginput0_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!validatinginput0_updating.value && changed.value) {
  				newState.decorationFill = childState.value;
  			}
  			component._set(newState);
  			validatinginput0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		validatinginput0._bind({ value: 1 }, validatinginput0.get());
  	});

  	function click_handler(event) {
  		component.decorationFill(event);
  	}

  	var inputinteger1_initial_data = { min: "0", max: "100", value: "100" };
  	if (ctx.decorationOutlineAlpha !== void 0) {
  		inputinteger1_initial_data.value = ctx.decorationOutlineAlpha;
  		inputinteger1_updating.value = true;
  	}
  	var inputinteger1 = new InputInteger({
  		root: component.root,
  		store: component.store,
  		data: inputinteger1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger1_updating.value && changed.value) {
  				newState.decorationOutlineAlpha = childState.value;
  			}
  			component._set(newState);
  			inputinteger1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger1._bind({ value: 1 }, inputinteger1.get());
  	});

  	var validatinginput1_initial_data = {
  		placeholder: "#FFFFFF",
  		validate: "^#[0-9a-fA-F]+$"
  	};
  	if (ctx.decorationOutline !== void 0) {
  		validatinginput1_initial_data.value = ctx.decorationOutline;
  		validatinginput1_updating.value = true;
  	}
  	var validatinginput1 = new ValidatingInput({
  		root: component.root,
  		store: component.store,
  		data: validatinginput1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!validatinginput1_updating.value && changed.value) {
  				newState.decorationOutline = childState.value;
  			}
  			component._set(newState);
  			validatinginput1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		validatinginput1._bind({ value: 1 }, validatinginput1.get());
  	});

  	function click_handler_1(event) {
  		component.decorationOutline(event);
  	}

  	var inputinteger2_initial_data = { min: "0", max: "24", value: "10" };
  	if (ctx.decorationOutlineSize !== void 0) {
  		inputinteger2_initial_data.value = ctx.decorationOutlineSize;
  		inputinteger2_updating.value = true;
  	}
  	var inputinteger2 = new InputInteger({
  		root: component.root,
  		store: component.store,
  		data: inputinteger2_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger2_updating.value && changed.value) {
  				newState.decorationOutlineSize = childState.value;
  			}
  			component._set(newState);
  			inputinteger2_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger2._bind({ value: 1 }, inputinteger2.get());
  	});

  	var switch_1_initial_data = {};
  	if (ctx.decorationOutlineType !== void 0) {
  		switch_1_initial_data.flag = ctx.decorationOutlineType;
  		switch_1_updating.flag = true;
  	}
  	var switch_1 = new Switch({
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

  	var validatinginput2_initial_data = {
  		placeholder: "10 10",
  		validate: "^[0-9]+\\s+[0-9]+$"
  	};
  	if (ctx.dashes !== void 0) {
  		validatinginput2_initial_data.value = ctx.dashes;
  		validatinginput2_updating.value = true;
  	}
  	var validatinginput2 = new ValidatingInput({
  		root: component.root,
  		store: component.store,
  		data: validatinginput2_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!validatinginput2_updating.value && changed.value) {
  				newState.dashes = childState.value;
  			}
  			component._set(newState);
  			validatinginput2_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		validatinginput2._bind({ value: 1 }, validatinginput2.get());
  	});

  	var panel0_initial_data = {
  		id: "colors",
  		icon: "style-editor-icon colors"
  	};
  	var panel0 = new Panel({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel0_initial_data
  	});

  	var patterns_initial_data = {};
  	if (ctx.patternColors !== void 0) {
  		patterns_initial_data.colors = ctx.patternColors;
  		patterns_updating.colors = true;
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
  		patterns._bind({ colors: 1, styleIndex: 1, width: 1, offset: 1, outline: 1, outlineAlpha: 1, outlineSize: 1, outlineType: 1 }, patterns.get());
  	});

  	patterns.on("colors", function (event) {
  		component.patternColors(event);
  	});
  	patterns.on("outline", function (event) {
  		component.patternOutline(event);
  	});

  	component.refs.patterns = patterns;

  	var panel1_initial_data = {
  		id: "patterns",
  		icon: "style-editor-icon patterns"
  	};
  	var panel1 = new Panel({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel1_initial_data
  	});

  	var panel2_initial_data = {
  		id: "marker",
  		icon: "style-editor-icon marker"
  	};
  	var panel2 = new Panel({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel2_initial_data
  	});

  	var tabs_initial_data = {};
  	if (ctx.fillStyle !== void 0) {
  		tabs_initial_data.index = ctx.fillStyle;
  		tabs_updating.index = true;
  	}
  	var tabs = new Tabs({
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

  	var each0_value = ctx.legendFields;

  	var each0_blocks = [];

  	for (var i = 0; i < each0_value.length; i += 1) {
  		each0_blocks[i] = create_each_block_2(component, get_each0_context(ctx, each0_value, i));
  	}

  	function change_handler(event) {
  		component.addField(event);
  	}

  	function textarea_input_handler() {
  		textarea_updating = true;
  		component.set({ legendField: textarea.value });
  		textarea_updating = false;
  	}

  	var each1_value = ctx.fonts;

  	var each1_blocks = [];

  	for (var i = 0; i < each1_value.length; i += 1) {
  		each1_blocks[i] = create_each_block_1(component, get_each1_context(ctx, each1_value, i));
  	}

  	function select1_change_handler() {
  		select1_updating = true;
  		component.set({ legendFont: selectValue(select1) });
  		select1_updating = false;
  	}

  	var inputinteger3_initial_data = { min: "8", max: "24", value: "10" };
  	if (ctx.legendFontSize !== void 0) {
  		inputinteger3_initial_data.value = ctx.legendFontSize;
  		inputinteger3_updating.value = true;
  	}
  	var inputinteger3 = new InputInteger({
  		root: component.root,
  		store: component.store,
  		data: inputinteger3_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger3_updating.value && changed.value) {
  				newState.legendFontSize = childState.value;
  			}
  			component._set(newState);
  			inputinteger3_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger3._bind({ value: 1 }, inputinteger3.get());
  	});

  	var each2_value = ctx.legendFontStyles;

  	var each2_blocks = [];

  	for (var i = 0; i < each2_value.length; i += 1) {
  		each2_blocks[i] = create_each_block$3(component, get_each2_context(ctx, each2_value, i));
  	}

  	function select2_change_handler() {
  		select2_updating = true;
  		component.set({ legendFontStyle: selectValue(select2) });
  		select2_updating = false;
  	}

  	function input1_input_handler() {
  		input1_updating = true;
  		component.set({ legendFill: input1.value });
  		input1_updating = false;
  	}

  	function click_handler_2(event) {
  		component.legendFill(event);
  	}

  	var statebutton1_initial_data = {};
  	if (ctx.useLegendOutline !== void 0) {
  		statebutton1_initial_data.flag = ctx.useLegendOutline;
  		statebutton1_updating.flag = true;
  	}
  	var statebutton1 = new StateButton({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: statebutton1_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!statebutton1_updating.flag && changed.flag) {
  				newState.useLegendOutline = childState.flag;
  			}
  			component._set(newState);
  			statebutton1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		statebutton1._bind({ flag: 1 }, statebutton1.get());
  	});

  	function input2_input_handler() {
  		input2_updating = true;
  		component.set({ legendOutline: input2.value });
  		input2_updating = false;
  	}

  	function click_handler_3(event) {
  		component.legendOutline(event);
  	}

  	var inputinteger4_initial_data = { min: "-50", max: "50", value: "0" };
  	if (ctx.legendOffsetX !== void 0) {
  		inputinteger4_initial_data.value = ctx.legendOffsetX;
  		inputinteger4_updating.value = true;
  	}
  	var inputinteger4 = new InputInteger({
  		root: component.root,
  		store: component.store,
  		data: inputinteger4_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger4_updating.value && changed.value) {
  				newState.legendOffsetX = childState.value;
  			}
  			component._set(newState);
  			inputinteger4_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger4._bind({ value: 1 }, inputinteger4.get());
  	});

  	var inputinteger5_initial_data = { min: "-50", max: "50", value: "0" };
  	if (ctx.legendOffsetY !== void 0) {
  		inputinteger5_initial_data.value = ctx.legendOffsetY;
  		inputinteger5_updating.value = true;
  	}
  	var inputinteger5 = new InputInteger({
  		root: component.root,
  		store: component.store,
  		data: inputinteger5_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger5_updating.value && changed.value) {
  				newState.legendOffsetY = childState.value;
  			}
  			component._set(newState);
  			inputinteger5_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		inputinteger5._bind({ value: 1 }, inputinteger5.get());
  	});

  	var colorpicker = new ColorPicker({
  		root: component.root,
  		store: component.store
  	});

  	colorpicker.on("state", function (event) {
  		component.changeColor(event);
  	});

  	component.refs.colorPicker = colorpicker;

  	return {
  		c: function create() {
  			div0 = createElement("div");
  			label0 = createElement("label");
  			text0 = createText(text0_value);
  			text1 = createText("\r\n    ");
  			table0 = createElement("table");
  			tr0 = createElement("tr");
  			td0 = createElement("td");
  			text2 = createText(text2_value);
  			text3 = createText("                    \r\n                    ");
  			td1 = createElement("td");
  			i0 = createElement("i");
  			statebutton0._fragment.c();
  			text4 = createText("\r\n                    ");
  			td2 = createElement("td");
  			inputinteger0._fragment.c();
  			text5 = createText("\r\n                    ");
  			td3 = createElement("td");
  			validatinginput0._fragment.c();
  			text6 = createText("\r\n                    ");
  			td4 = createElement("td");
  			label1 = createElement("label");
  			text7 = createText("    \r\n                ");
  			tr1 = createElement("tr");
  			td5 = createElement("td");
  			text8 = createText(text8_value);
  			text9 = createText("                    \r\n                    ");
  			td6 = createElement("td");
  			text10 = createText("\r\n                    ");
  			td7 = createElement("td");
  			inputinteger1._fragment.c();
  			text11 = createText("\r\n                    ");
  			td8 = createElement("td");
  			validatinginput1._fragment.c();
  			text12 = createText("\r\n                    ");
  			td9 = createElement("td");
  			label2 = createElement("label");
  			text13 = createText("\r\n                ");
  			tr2 = createElement("tr");
  			td10 = createElement("td");
  			text14 = createText(text14_value);
  			text15 = createText("\r\n                    ");
  			td11 = createElement("td");
  			text16 = createText("       \r\n                    ");
  			td12 = createElement("td");
  			inputinteger2._fragment.c();
  			text17 = createText("\r\n                ");
  			tr3 = createElement("tr");
  			td13 = createElement("td");
  			text18 = createText(text18_value);
  			text19 = createText("                   \r\n                    ");
  			td14 = createElement("td");
  			i1 = createElement("i");
  			i1.textContent = "┃";
  			text21 = createText("\r\n                            ");
  			i2 = createElement("i");
  			i2.textContent = "┇";
  			switch_1._fragment.c();
  			text23 = createText(" \r\n                        ");
  			span = createElement("span");
  			validatinginput2._fragment.c();
  			panel0._fragment.c();
  			text24 = createText("\r\n        ");
  			patterns._fragment.c();
  			panel1._fragment.c();
  			text25 = createText("\r\n        ");
  			table1 = createElement("table");
  			tr4 = createElement("tr");
  			td15 = createElement("td");
  			text26 = createText(text26_value);
  			text27 = createText("\r\n                    ");
  			td16 = createElement("td");
  			input0 = createElement("input");
  			text28 = createText("\r\n                    ");
  			td17 = createElement("td");
  			label3 = createElement("label");
  			i3 = createElement("i");
  			panel2._fragment.c();
  			tabs._fragment.c();
  			text29 = createText("\r\n");
  			div1 = createElement("div");
  			label4 = createElement("label");
  			text30 = createText(text30_value);
  			text31 = createText("\r\n    ");
  			table2 = createElement("table");
  			tr5 = createElement("tr");
  			td18 = createElement("td");
  			text32 = createText(text32_value);
  			text33 = createText("\r\n            ");
  			td19 = createElement("td");
  			select0 = createElement("select");

  			for (var i = 0; i < each0_blocks.length; i += 1) {
  				each0_blocks[i].c();
  			}

  			text34 = createText("\r\n        ");
  			tr6 = createElement("tr");
  			td20 = createElement("td");
  			text35 = createText("\r\n            ");
  			td21 = createElement("td");
  			textarea = createElement("textarea");
  			text36 = createText("\r\n        ");
  			tr7 = createElement("tr");
  			td22 = createElement("td");
  			text37 = createText(text37_value);
  			text38 = createText("\r\n            ");
  			td23 = createElement("td");
  			select1 = createElement("select");

  			for (var i = 0; i < each1_blocks.length; i += 1) {
  				each1_blocks[i].c();
  			}

  			text39 = createText("\r\n        ");
  			tr8 = createElement("tr");
  			td24 = createElement("td");
  			text40 = createText(text40_value);
  			text41 = createText("\r\n            ");
  			td25 = createElement("td");
  			inputinteger3._fragment.c();
  			text42 = createText("\r\n            ");
  			td26 = createElement("td");
  			select2 = createElement("select");

  			for (var i = 0; i < each2_blocks.length; i += 1) {
  				each2_blocks[i].c();
  			}

  			text43 = createText("\r\n        ");
  			tr9 = createElement("tr");
  			td27 = createElement("td");
  			text44 = createText(text44_value);
  			text45 = createText("\r\n            ");
  			td28 = createElement("td");
  			text46 = createText("\r\n            ");
  			td29 = createElement("td");
  			input1 = createElement("input");
  			text47 = createText("\r\n            ");
  			td30 = createElement("td");
  			label5 = createElement("label");
  			text48 = createText("\r\n        ");
  			tr10 = createElement("tr");
  			td31 = createElement("td");
  			text49 = createText(text49_value);
  			text50 = createText("\r\n            ");
  			td32 = createElement("td");
  			i4 = createElement("i");
  			statebutton1._fragment.c();
  			text51 = createText("\r\n            ");
  			td33 = createElement("td");
  			input2 = createElement("input");
  			text52 = createText("\r\n            ");
  			td34 = createElement("td");
  			label6 = createElement("label");
  			text53 = createText("\r\n        ");
  			tr11 = createElement("tr");
  			td35 = createElement("td");
  			text54 = createText(text54_value);
  			text55 = createText("\r\n            ");
  			td36 = createElement("td");
  			inputinteger4._fragment.c();
  			text56 = createText("\r\n        ");
  			tr12 = createElement("tr");
  			td37 = createElement("td");
  			text57 = createText(text57_value);
  			text58 = createText("\r\n            ");
  			td38 = createElement("td");
  			inputinteger5._fragment.c();
  			text59 = createText("\r\n");
  			div2 = createElement("div");
  			colorpicker._fragment.c();
  			addLoc(label0, file$i, 2, 4, 72);
  			td0.className = "label";
  			addLoc(td0, file$i, 7, 20, 330);
  			i0.className = "style-editor-icon";
  			addLoc(i0, file$i, 10, 28, 532);
  			td1.className = "clear";
  			addLoc(td1, file$i, 8, 20, 414);
  			td2.className = "alpha integer-input";
  			addLoc(td2, file$i, 13, 20, 654);
  			td3.className = "text";
  			addLoc(td3, file$i, 16, 20, 840);
  			addListener(label1, "click", click_handler);
  			addLoc(label1, file$i, 20, 24, 1051);
  			td4.className = "button";
  			addLoc(td4, file$i, 19, 20, 1006);
  			tr0.className = "fill";
  			addLoc(tr0, file$i, 6, 16, 291);
  			td5.className = "label";
  			addLoc(td5, file$i, 24, 20, 1246);
  			td6.className = "clear";
  			addLoc(td6, file$i, 25, 20, 1333);
  			td7.className = "alpha integer-input";
  			addLoc(td7, file$i, 27, 20, 1400);
  			td8.className = "text";
  			addLoc(td8, file$i, 30, 20, 1589);
  			addListener(label2, "click", click_handler_1);
  			addLoc(label2, file$i, 34, 24, 1826);
  			td9.className = "button";
  			addLoc(td9, file$i, 33, 20, 1780);
  			tr1.className = "outline";
  			addLoc(tr1, file$i, 23, 16, 1204);
  			td10.className = "label";
  			addLoc(td10, file$i, 38, 20, 2007);
  			addLoc(td11, file$i, 39, 20, 2076);
  			td12.className = "size integer-input";
  			td12.colSpan = "3";
  			addLoc(td12, file$i, 40, 20, 2114);
  			addLoc(tr2, file$i, 37, 16, 1981);
  			td13.className = "label";
  			addLoc(td13, file$i, 45, 20, 2369);
  			setAttribute(i1, "slot", "left");
  			addLoc(i1, file$i, 48, 28, 2586);
  			setAttribute(i2, "slot", "right");
  			addLoc(i2, file$i, 49, 28, 2643);
  			span.className = "dash";
  			addLoc(span, file$i, 51, 24, 2733);
  			td14.className = "type-switch";
  			td14.colSpan = "4";
  			addLoc(td14, file$i, 46, 20, 2452);
  			tr3.className = "type";
  			addLoc(tr3, file$i, 44, 16, 2330);
  			setAttribute(table0, "cellpadding", "0");
  			setAttribute(table0, "cellspacing", "0");
  			addLoc(table0, file$i, 5, 12, 234);
  			td15.className = "label";
  			addLoc(td15, file$i, 74, 20, 3845);
  			setAttribute(input0, "type", "text");
  			addLoc(input0, file$i, 76, 24, 3966);
  			td16.className = "text";
  			td16.colSpan = "2";
  			addLoc(td16, file$i, 75, 20, 3911);
  			addLoc(i3, file$i, 80, 28, 4118);
  			addLoc(label3, file$i, 79, 24, 4081);
  			td17.className = "button";
  			addLoc(td17, file$i, 78, 20, 4036);
  			tr4.className = "upload";
  			addLoc(tr4, file$i, 73, 16, 3804);
  			addLoc(table1, file$i, 72, 12, 3779);
  			div0.className = "decoration";
  			addLoc(div0, file$i, 1, 0, 42);
  			addLoc(label4, file$i, 89, 4, 4324);
  			td18.className = "label";
  			addLoc(td18, file$i, 92, 12, 4445);
  			addListener(select0, "change", change_handler);
  			addLoc(select0, file$i, 94, 16, 4548);
  			td19.className = "attr";
  			td19.colSpan = "3";
  			addLoc(td19, file$i, 93, 12, 4501);
  			tr5.className = "tag";
  			addLoc(tr5, file$i, 91, 8, 4415);
  			addLoc(td20, file$i, 102, 12, 4791);
  			addListener(textarea, "input", textarea_input_handler);
  			addLoc(textarea, file$i, 104, 16, 4848);
  			td21.colSpan = "3";
  			addLoc(td21, file$i, 103, 12, 4814);
  			addLoc(tr6, file$i, 101, 8, 4773);
  			td22.className = "label";
  			addLoc(td22, file$i, 108, 12, 4979);
  			addListener(select1, "change", select1_change_handler);
  			if (!('legendFont' in ctx)) component.root._beforecreate.push(select1_change_handler);
  			addLoc(select1, file$i, 110, 16, 5090);
  			td23.className = "fonts";
  			td23.colSpan = "3";
  			addLoc(td23, file$i, 109, 12, 5042);
  			tr7.className = "font";
  			addLoc(tr7, file$i, 107, 8, 4948);
  			td24.className = "label";
  			addLoc(td24, file$i, 118, 12, 5336);
  			td25.className = "size integer-input";
  			addLoc(td25, file$i, 119, 12, 5397);
  			addListener(select2, "change", select2_change_handler);
  			if (!('legendFontStyle' in ctx)) component.root._beforecreate.push(select2_change_handler);
  			addLoc(select2, file$i, 123, 16, 5585);
  			td26.colSpan = "2";
  			addLoc(td26, file$i, 122, 12, 5551);
  			tr8.className = "style";
  			addLoc(tr8, file$i, 117, 8, 5304);
  			td27.className = "label";
  			addLoc(td27, file$i, 131, 12, 5846);
  			addLoc(td28, file$i, 132, 12, 5902);
  			addListener(input1, "input", input1_input_handler);
  			setAttribute(input1, "type", "text");
  			addLoc(input1, file$i, 135, 16, 5974);
  			td29.className = "text";
  			addLoc(td29, file$i, 134, 12, 5939);
  			addListener(label5, "click", click_handler_2);
  			addLoc(label5, file$i, 138, 16, 6108);
  			td30.className = "button";
  			addLoc(td30, file$i, 137, 12, 6071);
  			tr9.className = "fill";
  			addLoc(tr9, file$i, 130, 8, 5815);
  			td31.className = "label";
  			addLoc(td31, file$i, 142, 12, 6251);
  			i4.className = "style-editor-icon";
  			addLoc(i4, file$i, 145, 20, 6411);
  			td32.className = "clear";
  			addLoc(td32, file$i, 143, 12, 6310);
  			addListener(input2, "input", input2_input_handler);
  			setAttribute(input2, "type", "text");
  			addLoc(input2, file$i, 149, 16, 6544);
  			td33.className = "text";
  			addLoc(td33, file$i, 148, 12, 6509);
  			addListener(label6, "click", click_handler_3);
  			addLoc(label6, file$i, 152, 16, 6684);
  			td34.className = "button";
  			addLoc(td34, file$i, 151, 12, 6647);
  			tr10.className = "outline";
  			addLoc(tr10, file$i, 141, 8, 6217);
  			td35.className = "label";
  			addLoc(td35, file$i, 156, 12, 6832);
  			td36.colSpan = "3";
  			td36.className = "integer-input";
  			addLoc(td36, file$i, 157, 12, 6892);
  			tr11.className = "offset";
  			addLoc(tr11, file$i, 155, 8, 6799);
  			td37.className = "label";
  			addLoc(td37, file$i, 162, 12, 7113);
  			td38.colSpan = "3";
  			td38.className = "integer-input";
  			addLoc(td38, file$i, 163, 12, 7173);
  			tr12.className = "offset";
  			addLoc(tr12, file$i, 161, 8, 7080);
  			setAttribute(table2, "cellspacing", "0");
  			setAttribute(table2, "cellpadding", "0");
  			addLoc(table2, file$i, 90, 4, 4366);
  			div1.className = "legend";
  			addLoc(div1, file$i, 88, 0, 4298);
  			div2.className = "color-picker-container";
  			addLoc(div2, file$i, 169, 0, 7359);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div0, anchor);
  			append(div0, label0);
  			append(label0, text0);
  			append(div0, text1);
  			append(panel0._slotted.default, table0);
  			append(table0, tr0);
  			append(tr0, td0);
  			append(td0, text2);
  			append(tr0, text3);
  			append(tr0, td1);
  			append(statebutton0._slotted.default, i0);
  			statebutton0._mount(td1, null);
  			append(tr0, text4);
  			append(tr0, td2);
  			inputinteger0._mount(td2, null);
  			append(tr0, text5);
  			append(tr0, td3);
  			validatinginput0._mount(td3, null);
  			append(tr0, text6);
  			append(tr0, td4);
  			append(td4, label1);
  			component.refs.decorationFillSample = label1;
  			append(table0, text7);
  			append(table0, tr1);
  			append(tr1, td5);
  			append(td5, text8);
  			append(tr1, text9);
  			append(tr1, td6);
  			append(tr1, text10);
  			append(tr1, td7);
  			inputinteger1._mount(td7, null);
  			append(tr1, text11);
  			append(tr1, td8);
  			validatinginput1._mount(td8, null);
  			append(tr1, text12);
  			append(tr1, td9);
  			append(td9, label2);
  			component.refs.decorationOutlineSample = label2;
  			append(table0, text13);
  			append(table0, tr2);
  			append(tr2, td10);
  			append(td10, text14);
  			append(tr2, text15);
  			append(tr2, td11);
  			append(tr2, text16);
  			append(tr2, td12);
  			inputinteger2._mount(td12, null);
  			append(table0, text17);
  			append(table0, tr3);
  			append(tr3, td13);
  			append(td13, text18);
  			append(tr3, text19);
  			append(tr3, td14);
  			append(switch_1._slotted.left, i1);
  			append(switch_1._slotted.default, text21);
  			append(switch_1._slotted.right, i2);
  			switch_1._mount(td14, null);
  			append(td14, text23);
  			append(td14, span);
  			validatinginput2._mount(span, null);
  			component.refs.fillOutlineDash = span;
  			panel0._mount(tabs._slotted.default, null);
  			append(tabs._slotted.default, text24);
  			patterns._mount(panel1._slotted.default, null);
  			panel1._mount(tabs._slotted.default, null);
  			append(tabs._slotted.default, text25);
  			append(panel2._slotted.default, table1);
  			append(table1, tr4);
  			append(tr4, td15);
  			append(td15, text26);
  			append(tr4, text27);
  			append(tr4, td16);
  			append(td16, input0);
  			append(tr4, text28);
  			append(tr4, td17);
  			append(td17, label3);
  			append(label3, i3);
  			panel2._mount(tabs._slotted.default, null);
  			tabs._mount(div0, null);
  			insert(target, text29, anchor);
  			insert(target, div1, anchor);
  			append(div1, label4);
  			append(label4, text30);
  			append(div1, text31);
  			append(div1, table2);
  			append(table2, tr5);
  			append(tr5, td18);
  			append(td18, text32);
  			append(tr5, text33);
  			append(tr5, td19);
  			append(td19, select0);

  			for (var i = 0; i < each0_blocks.length; i += 1) {
  				each0_blocks[i].m(select0, null);
  			}

  			append(table2, text34);
  			append(table2, tr6);
  			append(tr6, td20);
  			append(tr6, text35);
  			append(tr6, td21);
  			append(td21, textarea);
  			component.refs.field = textarea;

  			textarea.value = ctx.legendField;

  			append(table2, text36);
  			append(table2, tr7);
  			append(tr7, td22);
  			append(td22, text37);
  			append(tr7, text38);
  			append(tr7, td23);
  			append(td23, select1);

  			for (var i = 0; i < each1_blocks.length; i += 1) {
  				each1_blocks[i].m(select1, null);
  			}

  			selectOption(select1, ctx.legendFont);

  			append(table2, text39);
  			append(table2, tr8);
  			append(tr8, td24);
  			append(td24, text40);
  			append(tr8, text41);
  			append(tr8, td25);
  			inputinteger3._mount(td25, null);
  			append(tr8, text42);
  			append(tr8, td26);
  			append(td26, select2);

  			for (var i = 0; i < each2_blocks.length; i += 1) {
  				each2_blocks[i].m(select2, null);
  			}

  			selectOption(select2, ctx.legendFontStyle);

  			append(table2, text43);
  			append(table2, tr9);
  			append(tr9, td27);
  			append(td27, text44);
  			append(tr9, text45);
  			append(tr9, td28);
  			append(tr9, text46);
  			append(tr9, td29);
  			append(td29, input1);
  			component.refs.legendFillText = input1;

  			input1.value = ctx.legendFill;

  			append(tr9, text47);
  			append(tr9, td30);
  			append(td30, label5);
  			component.refs.legendFillSample = label5;
  			append(table2, text48);
  			append(table2, tr10);
  			append(tr10, td31);
  			append(td31, text49);
  			append(tr10, text50);
  			append(tr10, td32);
  			append(statebutton1._slotted.default, i4);
  			statebutton1._mount(td32, null);
  			append(tr10, text51);
  			append(tr10, td33);
  			append(td33, input2);
  			component.refs.legendOutlineText = input2;

  			input2.value = ctx.legendOutline;

  			append(tr10, text52);
  			append(tr10, td34);
  			append(td34, label6);
  			component.refs.legendOutlineSample = label6;
  			append(table2, text53);
  			append(table2, tr11);
  			append(tr11, td35);
  			append(td35, text54);
  			append(tr11, text55);
  			append(tr11, td36);
  			inputinteger4._mount(td36, null);
  			append(table2, text56);
  			append(table2, tr12);
  			append(tr12, td37);
  			append(td37, text57);
  			append(tr12, text58);
  			append(tr12, td38);
  			inputinteger5._mount(td38, null);
  			insert(target, text59, anchor);
  			insert(target, div2, anchor);
  			colorpicker._mount(div2, null);
  			component.refs.pickerContainer = div2;
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var statebutton0_changes = {};
  			if (!statebutton0_updating.flag && changed.useDecorationFill) {
  				statebutton0_changes.flag = ctx.useDecorationFill;
  				statebutton0_updating.flag = ctx.useDecorationFill !== void 0;
  			}
  			statebutton0._set(statebutton0_changes);
  			statebutton0_updating = {};

  			var inputinteger0_changes = {};
  			if (!inputinteger0_updating.value && changed.decorationFillAlpha) {
  				inputinteger0_changes.value = ctx.decorationFillAlpha;
  				inputinteger0_updating.value = ctx.decorationFillAlpha !== void 0;
  			}
  			inputinteger0._set(inputinteger0_changes);
  			inputinteger0_updating = {};

  			var validatinginput0_changes = {};
  			if (!validatinginput0_updating.value && changed.decorationFill) {
  				validatinginput0_changes.value = ctx.decorationFill;
  				validatinginput0_updating.value = ctx.decorationFill !== void 0;
  			}
  			validatinginput0._set(validatinginput0_changes);
  			validatinginput0_updating = {};

  			var inputinteger1_changes = {};
  			if (!inputinteger1_updating.value && changed.decorationOutlineAlpha) {
  				inputinteger1_changes.value = ctx.decorationOutlineAlpha;
  				inputinteger1_updating.value = ctx.decorationOutlineAlpha !== void 0;
  			}
  			inputinteger1._set(inputinteger1_changes);
  			inputinteger1_updating = {};

  			var validatinginput1_changes = {};
  			if (!validatinginput1_updating.value && changed.decorationOutline) {
  				validatinginput1_changes.value = ctx.decorationOutline;
  				validatinginput1_updating.value = ctx.decorationOutline !== void 0;
  			}
  			validatinginput1._set(validatinginput1_changes);
  			validatinginput1_updating = {};

  			var inputinteger2_changes = {};
  			if (!inputinteger2_updating.value && changed.decorationOutlineSize) {
  				inputinteger2_changes.value = ctx.decorationOutlineSize;
  				inputinteger2_updating.value = ctx.decorationOutlineSize !== void 0;
  			}
  			inputinteger2._set(inputinteger2_changes);
  			inputinteger2_updating = {};

  			var switch_1_changes = {};
  			if (!switch_1_updating.flag && changed.decorationOutlineType) {
  				switch_1_changes.flag = ctx.decorationOutlineType;
  				switch_1_updating.flag = ctx.decorationOutlineType !== void 0;
  			}
  			switch_1._set(switch_1_changes);
  			switch_1_updating = {};

  			var validatinginput2_changes = {};
  			if (!validatinginput2_updating.value && changed.dashes) {
  				validatinginput2_changes.value = ctx.dashes;
  				validatinginput2_updating.value = ctx.dashes !== void 0;
  			}
  			validatinginput2._set(validatinginput2_changes);
  			validatinginput2_updating = {};

  			var patterns_changes = {};
  			if (!patterns_updating.colors && changed.patternColors) {
  				patterns_changes.colors = ctx.patternColors;
  				patterns_updating.colors = ctx.patternColors !== void 0;
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

  			var tabs_changes = {};
  			if (!tabs_updating.index && changed.fillStyle) {
  				tabs_changes.index = ctx.fillStyle;
  				tabs_updating.index = ctx.fillStyle !== void 0;
  			}
  			tabs._set(tabs_changes);
  			tabs_updating = {};

  			if (changed.legendFields) {
  				each0_value = ctx.legendFields;

  				for (var i = 0; i < each0_value.length; i += 1) {
  					var child_ctx = get_each0_context(ctx, each0_value, i);

  					if (each0_blocks[i]) {
  						each0_blocks[i].p(changed, child_ctx);
  					} else {
  						each0_blocks[i] = create_each_block_2(component, child_ctx);
  						each0_blocks[i].c();
  						each0_blocks[i].m(select0, null);
  					}
  				}

  				for (; i < each0_blocks.length; i += 1) {
  					each0_blocks[i].d(1);
  				}
  				each0_blocks.length = each0_value.length;
  			}

  			if (!textarea_updating && changed.legendField) textarea.value = ctx.legendField;

  			if (changed.fonts) {
  				each1_value = ctx.fonts;

  				for (var i = 0; i < each1_value.length; i += 1) {
  					var _child_ctx = get_each1_context(ctx, each1_value, i);

  					if (each1_blocks[i]) {
  						each1_blocks[i].p(changed, _child_ctx);
  					} else {
  						each1_blocks[i] = create_each_block_1(component, _child_ctx);
  						each1_blocks[i].c();
  						each1_blocks[i].m(select1, null);
  					}
  				}

  				for (; i < each1_blocks.length; i += 1) {
  					each1_blocks[i].d(1);
  				}
  				each1_blocks.length = each1_value.length;
  			}

  			if (!select1_updating && changed.legendFont) selectOption(select1, ctx.legendFont);

  			var inputinteger3_changes = {};
  			if (!inputinteger3_updating.value && changed.legendFontSize) {
  				inputinteger3_changes.value = ctx.legendFontSize;
  				inputinteger3_updating.value = ctx.legendFontSize !== void 0;
  			}
  			inputinteger3._set(inputinteger3_changes);
  			inputinteger3_updating = {};

  			if (changed.legendFontStyles) {
  				each2_value = ctx.legendFontStyles;

  				for (var i = 0; i < each2_value.length; i += 1) {
  					var _child_ctx2 = get_each2_context(ctx, each2_value, i);

  					if (each2_blocks[i]) {
  						each2_blocks[i].p(changed, _child_ctx2);
  					} else {
  						each2_blocks[i] = create_each_block$3(component, _child_ctx2);
  						each2_blocks[i].c();
  						each2_blocks[i].m(select2, null);
  					}
  				}

  				for (; i < each2_blocks.length; i += 1) {
  					each2_blocks[i].d(1);
  				}
  				each2_blocks.length = each2_value.length;
  			}

  			if (!select2_updating && changed.legendFontStyle) selectOption(select2, ctx.legendFontStyle);
  			if (!input1_updating && changed.legendFill) input1.value = ctx.legendFill;

  			var statebutton1_changes = {};
  			if (!statebutton1_updating.flag && changed.useLegendOutline) {
  				statebutton1_changes.flag = ctx.useLegendOutline;
  				statebutton1_updating.flag = ctx.useLegendOutline !== void 0;
  			}
  			statebutton1._set(statebutton1_changes);
  			statebutton1_updating = {};

  			if (!input2_updating && changed.legendOutline) input2.value = ctx.legendOutline;

  			var inputinteger4_changes = {};
  			if (!inputinteger4_updating.value && changed.legendOffsetX) {
  				inputinteger4_changes.value = ctx.legendOffsetX;
  				inputinteger4_updating.value = ctx.legendOffsetX !== void 0;
  			}
  			inputinteger4._set(inputinteger4_changes);
  			inputinteger4_updating = {};

  			var inputinteger5_changes = {};
  			if (!inputinteger5_updating.value && changed.legendOffsetY) {
  				inputinteger5_changes.value = ctx.legendOffsetY;
  				inputinteger5_updating.value = ctx.legendOffsetY !== void 0;
  			}
  			inputinteger5._set(inputinteger5_changes);
  			inputinteger5_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			outrocallback = callAfter(outrocallback, 18);

  			if (statebutton0) statebutton0._fragment.o(outrocallback);
  			if (inputinteger0) inputinteger0._fragment.o(outrocallback);
  			if (validatinginput0) validatinginput0._fragment.o(outrocallback);
  			if (inputinteger1) inputinteger1._fragment.o(outrocallback);
  			if (validatinginput1) validatinginput1._fragment.o(outrocallback);
  			if (inputinteger2) inputinteger2._fragment.o(outrocallback);
  			if (switch_1) switch_1._fragment.o(outrocallback);
  			if (validatinginput2) validatinginput2._fragment.o(outrocallback);
  			if (panel0) panel0._fragment.o(outrocallback);
  			if (patterns) patterns._fragment.o(outrocallback);
  			if (panel1) panel1._fragment.o(outrocallback);
  			if (panel2) panel2._fragment.o(outrocallback);
  			if (tabs) tabs._fragment.o(outrocallback);
  			if (inputinteger3) inputinteger3._fragment.o(outrocallback);
  			if (statebutton1) statebutton1._fragment.o(outrocallback);
  			if (inputinteger4) inputinteger4._fragment.o(outrocallback);
  			if (inputinteger5) inputinteger5._fragment.o(outrocallback);
  			if (colorpicker) colorpicker._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			window.removeEventListener("click", onwindowclick);

  			if (detach) {
  				detachNode(div0);
  			}

  			statebutton0.destroy();
  			inputinteger0.destroy();
  			validatinginput0.destroy();
  			removeListener(label1, "click", click_handler);
  			if (component.refs.decorationFillSample === label1) component.refs.decorationFillSample = null;
  			inputinteger1.destroy();
  			validatinginput1.destroy();
  			removeListener(label2, "click", click_handler_1);
  			if (component.refs.decorationOutlineSample === label2) component.refs.decorationOutlineSample = null;
  			inputinteger2.destroy();
  			switch_1.destroy();
  			validatinginput2.destroy();
  			if (component.refs.fillOutlineDash === span) component.refs.fillOutlineDash = null;
  			panel0.destroy();
  			patterns.destroy();
  			if (component.refs.patterns === patterns) component.refs.patterns = null;
  			panel1.destroy();
  			panel2.destroy();
  			tabs.destroy();
  			if (detach) {
  				detachNode(text29);
  				detachNode(div1);
  			}

  			destroyEach(each0_blocks, detach);

  			removeListener(select0, "change", change_handler);
  			removeListener(textarea, "input", textarea_input_handler);
  			if (component.refs.field === textarea) component.refs.field = null;

  			destroyEach(each1_blocks, detach);

  			removeListener(select1, "change", select1_change_handler);
  			inputinteger3.destroy();

  			destroyEach(each2_blocks, detach);

  			removeListener(select2, "change", select2_change_handler);
  			removeListener(input1, "input", input1_input_handler);
  			if (component.refs.legendFillText === input1) component.refs.legendFillText = null;
  			removeListener(label5, "click", click_handler_2);
  			if (component.refs.legendFillSample === label5) component.refs.legendFillSample = null;
  			statebutton1.destroy();
  			removeListener(input2, "input", input2_input_handler);
  			if (component.refs.legendOutlineText === input2) component.refs.legendOutlineText = null;
  			removeListener(label6, "click", click_handler_3);
  			if (component.refs.legendOutlineSample === label6) component.refs.legendOutlineSample = null;
  			inputinteger4.destroy();
  			inputinteger5.destroy();
  			if (detach) {
  				detachNode(text59);
  				detachNode(div2);
  			}

  			colorpicker.destroy();
  			if (component.refs.colorPicker === colorpicker) component.refs.colorPicker = null;
  			if (component.refs.pickerContainer === div2) component.refs.pickerContainer = null;
  		}
  	};
  }

  // (96:20) {#each legendFields as f}
  function create_each_block_2(component, ctx) {
  	var option,
  	    text_value = ctx.f,
  	    text,
  	    option_value_value;

  	return {
  		c: function create() {
  			option = createElement("option");
  			text = createText(text_value);
  			option.__value = option_value_value = ctx.f;
  			option.value = option.__value;
  			addLoc(option, file$i, 96, 20, 4653);
  		},

  		m: function mount(target, anchor) {
  			insert(target, option, anchor);
  			append(option, text);
  		},

  		p: function update(changed, ctx) {
  			if (changed.legendFields && text_value !== (text_value = ctx.f)) {
  				setData(text, text_value);
  			}

  			if (changed.legendFields && option_value_value !== (option_value_value = ctx.f)) {
  				option.__value = option_value_value;
  			}

  			option.value = option.__value;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(option);
  			}
  		}
  	};
  }

  // (112:20) {#each fonts as f}
  function create_each_block_1(component, ctx) {
  	var option,
  	    text_value = ctx.f,
  	    text,
  	    option_value_value;

  	return {
  		c: function create() {
  			option = createElement("option");
  			text = createText(text_value);
  			option.__value = option_value_value = ctx.f;
  			option.value = option.__value;
  			addLoc(option, file$i, 112, 20, 5184);
  		},

  		m: function mount(target, anchor) {
  			insert(target, option, anchor);
  			append(option, text);
  		},

  		p: function update(changed, ctx) {
  			if (changed.fonts && text_value !== (text_value = ctx.f)) {
  				setData(text, text_value);
  			}

  			if (changed.fonts && option_value_value !== (option_value_value = ctx.f)) {
  				option.__value = option_value_value;
  			}

  			option.value = option.__value;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(option);
  			}
  		}
  	};
  }

  // (125:20) {#each legendFontStyles as s}
  function create_each_block$3(component, ctx) {
  	var option,
  	    text_value = ctx.s,
  	    text,
  	    option_value_value;

  	return {
  		c: function create() {
  			option = createElement("option");
  			text = createText(text_value);
  			option.__value = option_value_value = ctx.s;
  			option.value = option.__value;
  			addLoc(option, file$i, 125, 20, 5695);
  		},

  		m: function mount(target, anchor) {
  			insert(target, option, anchor);
  			append(option, text);
  		},

  		p: function update(changed, ctx) {
  			if (changed.legendFontStyles && text_value !== (text_value = ctx.s)) {
  				setData(text, text_value);
  			}

  			if (changed.legendFontStyles && option_value_value !== (option_value_value = ctx.s)) {
  				option.__value = option_value_value;
  			}

  			option.value = option.__value;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(option);
  			}
  		}
  	};
  }

  function Layout(options) {
  	var _this = this;

  	this._debugName = '<Layout>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$h(), options.data);
  	if (!('fillStyle' in this._state)) console.warn("<Layout> was created without expected data property 'fillStyle'");
  	if (!('useDecorationFill' in this._state)) console.warn("<Layout> was created without expected data property 'useDecorationFill'");
  	if (!('decorationFillAlpha' in this._state)) console.warn("<Layout> was created without expected data property 'decorationFillAlpha'");
  	if (!('decorationFill' in this._state)) console.warn("<Layout> was created without expected data property 'decorationFill'");
  	if (!('decorationOutlineAlpha' in this._state)) console.warn("<Layout> was created without expected data property 'decorationOutlineAlpha'");
  	if (!('decorationOutline' in this._state)) console.warn("<Layout> was created without expected data property 'decorationOutline'");
  	if (!('decorationOutlineSize' in this._state)) console.warn("<Layout> was created without expected data property 'decorationOutlineSize'");
  	if (!('decorationOutlineType' in this._state)) console.warn("<Layout> was created without expected data property 'decorationOutlineType'");
  	if (!('dashes' in this._state)) console.warn("<Layout> was created without expected data property 'dashes'");
  	if (!('patternColors' in this._state)) console.warn("<Layout> was created without expected data property 'patternColors'");
  	if (!('patternStyleIndex' in this._state)) console.warn("<Layout> was created without expected data property 'patternStyleIndex'");
  	if (!('patternWidth' in this._state)) console.warn("<Layout> was created without expected data property 'patternWidth'");
  	if (!('patternOffset' in this._state)) console.warn("<Layout> was created without expected data property 'patternOffset'");
  	if (!('legendFields' in this._state)) console.warn("<Layout> was created without expected data property 'legendFields'");
  	if (!('legendField' in this._state)) console.warn("<Layout> was created without expected data property 'legendField'");
  	if (!('legendFont' in this._state)) console.warn("<Layout> was created without expected data property 'legendFont'");
  	if (!('fonts' in this._state)) console.warn("<Layout> was created without expected data property 'fonts'");
  	if (!('legendFontSize' in this._state)) console.warn("<Layout> was created without expected data property 'legendFontSize'");
  	if (!('legendFontStyle' in this._state)) console.warn("<Layout> was created without expected data property 'legendFontStyle'");
  	if (!('legendFontStyles' in this._state)) console.warn("<Layout> was created without expected data property 'legendFontStyles'");
  	if (!('legendFill' in this._state)) console.warn("<Layout> was created without expected data property 'legendFill'");
  	if (!('useLegendOutline' in this._state)) console.warn("<Layout> was created without expected data property 'useLegendOutline'");
  	if (!('legendOutline' in this._state)) console.warn("<Layout> was created without expected data property 'legendOutline'");
  	if (!('legendOffsetX' in this._state)) console.warn("<Layout> was created without expected data property 'legendOffsetX'");
  	if (!('legendOffsetY' in this._state)) console.warn("<Layout> was created without expected data property 'legendOffsetY'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$8];

  	this._fragment = create_main_fragment$i(this, this._state);

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

  assign(Layout.prototype, protoDev);
  assign(Layout.prototype, methods$a);

  Layout.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\Filter.html generated by Svelte v2.15.3 */

  var file$j = "src\\Filter.html";

  function create_main_fragment$j(component, ctx) {
  	var div, current;

  	return {
  		c: function create() {
  			div = createElement("div");
  			addLoc(div, file$j, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			current = true;
  		},

  		p: noop,

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}
  		}
  	};
  }

  function Filter(options) {
  	this._debugName = '<Filter>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign({}, options.data);
  	this._intro = !!options.intro;

  	this._fragment = create_main_fragment$j(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}

  	this._intro = true;
  }

  assign(Filter.prototype, protoDev);

  Filter.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* src\Popup.html generated by Svelte v2.15.3 */

  var file$k = "src\\Popup.html";

  function create_main_fragment$k(component, ctx) {
  	var div, current;

  	return {
  		c: function create() {
  			div = createElement("div");
  			addLoc(div, file$k, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div, anchor);
  			current = true;
  		},

  		p: noop,

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: run,

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div);
  			}
  		}
  	};
  }

  function Popup(options) {
  	this._debugName = '<Popup>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign({}, options.data);
  	this._intro = !!options.intro;

  	this._fragment = create_main_fragment$k(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);
  	}

  	this._intro = true;
  }

  assign(Popup.prototype, protoDev);

  Popup.prototype._checkReadOnly = function _checkReadOnly(newState) {};

  /* node_modules\scanex-integer-range\src\IntegerRange.html generated by Svelte v2.15.3 */

  function data$i() {
      return {
          min: null,
          max: null,
          low: 0,
          high: 0,
      };
  }
  var methods$b = {
      isValidLow (value) {                
          const high = parseInt(this.get().high, 10);
          const v = parseInt(value, 10);
          return this.inRange (v) && Number.isInteger(high) && v <= high;
      },
      isValidHigh (value) {
          const low = parseInt(this.get().low, 10);
          const v = parseInt(value, 10);
          return this.inRange (v) && Number.isInteger(low) && low <= v;
      },
      inRange (v) {
          const {min, max} = this.get();
          const a = parseInt(min, 10);
          const z = parseInt(max, 10);                
          return Number.isInteger(v) && 
              (Number.isInteger (a) && Number.isInteger (z) && a <= v && v <= z
              || Number.isInteger (a) && a <= v
              || Number.isInteger (z) && v <= z);
      },
      
  };

  function onupdate$9({changed, current, previous}) {            
      if (changed.low && !this.isValidLow(current.low)) {                                
          this.set ({low: parseInt(previous.low, 10)});                
      }
      if (changed.high && !this.isValidHigh(current.high)) {                                
          this.set ({high: parseInt(previous.high, 10)});
      }
  }
  const file$l = "node_modules\\scanex-integer-range\\src\\IntegerRange.html";

  function add_css$3() {
  	var style = createElement("style");
  	style.id = 'svelte-oj21cp-style';
  	style.textContent = ".integer-range.svelte-oj21cp{list-style-type:none;margin:0px;padding:0px}li.svelte-oj21cp{display:inline-block}.delimiter.svelte-oj21cp::before{content:'\\2013'}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZWdlclJhbmdlLmh0bWwiLCJzb3VyY2VzIjpbIkludGVnZXJSYW5nZS5odG1sIl0sInNvdXJjZXNDb250ZW50IjpbIjx1bCBjbGFzcz1cImludGVnZXItcmFuZ2VcIj5cclxuICAgIDxsaSBjbGFzcz1cImxvd1wiPlxyXG4gICAgICAgIDxJbnB1dEludGVnZXIgYmluZDptaW4gYmluZDp2YWx1ZT1cImxvd1wiIC8+XHJcbiAgICA8L2xpPlxyXG4gICAgPGxpIGNsYXNzPVwiZGVsaW1pdGVyXCI+PC9saT5cclxuICAgIDxsaSBjbGFzcz1cImhpZ2hcIj5cclxuICAgICAgICA8SW5wdXRJbnRlZ2VyIGJpbmQ6bWF4IGJpbmQ6dmFsdWU9XCJoaWdoXCIgLz5cclxuICAgIDwvbGk+ICAgIFxyXG48L3VsPlxyXG5cclxuPHN0eWxlPlxyXG4gICAgLmludGVnZXItcmFuZ2Uge1xyXG4gICAgICAgIGxpc3Qtc3R5bGUtdHlwZTogbm9uZTsgICAgICAgIFxyXG4gICAgICAgIG1hcmdpbjogMHB4O1xyXG4gICAgICAgIHBhZGRpbmc6IDBweDtcclxuICAgIH1cclxuICAgIGxpIHsgICAgICAgIFxyXG4gICAgICAgIGRpc3BsYXk6IGlubGluZS1ibG9jaztcclxuICAgIH1cclxuICAgIC5kZWxpbWl0ZXI6OmJlZm9yZSB7XHJcbiAgICAgICAgY29udGVudDogJ1xcMjAxMyc7XHJcbiAgICB9ICAgIFxyXG48L3N0eWxlPlxyXG5cclxuPHNjcmlwdD5cclxuICAgIGltcG9ydCBJbnB1dEludGVnZXIgZnJvbSAnc2NhbmV4LWlucHV0LWludGVnZXInO1xyXG5cclxuICAgIGV4cG9ydCBkZWZhdWx0IHtcclxuICAgICAgICBkYXRhICgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG1pbjogbnVsbCxcclxuICAgICAgICAgICAgICAgIG1heDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGxvdzogMCxcclxuICAgICAgICAgICAgICAgIGhpZ2g6IDAsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvbnVwZGF0ZSAoe2NoYW5nZWQsIGN1cnJlbnQsIHByZXZpb3VzfSkgeyAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAoY2hhbmdlZC5sb3cgJiYgIXRoaXMuaXNWYWxpZExvdyhjdXJyZW50LmxvdykpIHsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXQgKHtsb3c6IHBhcnNlSW50KHByZXZpb3VzLmxvdywgMTApfSk7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChjaGFuZ2VkLmhpZ2ggJiYgIXRoaXMuaXNWYWxpZEhpZ2goY3VycmVudC5oaWdoKSkgeyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldCAoe2hpZ2g6IHBhcnNlSW50KHByZXZpb3VzLmhpZ2gsIDEwKX0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBtZXRob2RzOiB7XHJcbiAgICAgICAgICAgIGlzVmFsaWRMb3cgKHZhbHVlKSB7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY29uc3QgaGlnaCA9IHBhcnNlSW50KHRoaXMuZ2V0KCkuaGlnaCwgMTApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pblJhbmdlICh2KSAmJiBOdW1iZXIuaXNJbnRlZ2VyKGhpZ2gpICYmIHYgPD0gaGlnaDtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgaXNWYWxpZEhpZ2ggKHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsb3cgPSBwYXJzZUludCh0aGlzLmdldCgpLmxvdywgMTApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdiA9IHBhcnNlSW50KHZhbHVlLCAxMCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5pblJhbmdlICh2KSAmJiBOdW1iZXIuaXNJbnRlZ2VyKGxvdykgJiYgbG93IDw9IHY7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGluUmFuZ2UgKHYpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHttaW4sIG1heH0gPSB0aGlzLmdldCgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYSA9IHBhcnNlSW50KG1pbiwgMTApO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeiA9IHBhcnNlSW50KG1heCwgMTApOyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIuaXNJbnRlZ2VyKHYpICYmIFxyXG4gICAgICAgICAgICAgICAgICAgIChOdW1iZXIuaXNJbnRlZ2VyIChhKSAmJiBOdW1iZXIuaXNJbnRlZ2VyICh6KSAmJiBhIDw9IHYgJiYgdiA8PSB6XHJcbiAgICAgICAgICAgICAgICAgICAgfHwgTnVtYmVyLmlzSW50ZWdlciAoYSkgJiYgYSA8PSB2XHJcbiAgICAgICAgICAgICAgICAgICAgfHwgTnVtYmVyLmlzSW50ZWdlciAoeikgJiYgdiA8PSB6KTtcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb21wb25lbnRzOiB7XHJcbiAgICAgICAgICAgIElucHV0SW50ZWdlclxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbjwvc2NyaXB0PiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFXSSxjQUFjLGNBQUMsQ0FBQyxBQUNaLGVBQWUsQ0FBRSxJQUFJLENBQ3JCLE1BQU0sQ0FBRSxHQUFHLENBQ1gsT0FBTyxDQUFFLEdBQUcsQUFDaEIsQ0FBQyxBQUNELEVBQUUsY0FBQyxDQUFDLEFBQ0EsT0FBTyxDQUFFLFlBQVksQUFDekIsQ0FBQyxBQUNELHdCQUFVLFFBQVEsQUFBQyxDQUFDLEFBQ2hCLE9BQU8sQ0FBRSxPQUFPLEFBQ3BCLENBQUMifQ== */";
  	append(document.head, style);
  }

  function create_main_fragment$l(component, ctx) {
  	var ul, li0, inputinteger0_updating = {}, text0, li1, text1, li2, inputinteger1_updating = {}, current;

  	var inputinteger0_initial_data = {};
  	if (ctx.min  !== void 0) {
  		inputinteger0_initial_data.min = ctx.min ;
  		inputinteger0_updating.min = true;
  	}
  	if (ctx.low !== void 0) {
  		inputinteger0_initial_data.value = ctx.low;
  		inputinteger0_updating.value = true;
  	}
  	var inputinteger0 = new InputInteger({
  		root: component.root,
  		store: component.store,
  		data: inputinteger0_initial_data,
  		_bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger0_updating.min && changed.min) {
  				newState.min = childState.min;
  			}

  			if (!inputinteger0_updating.value && changed.value) {
  				newState.low = childState.value;
  			}
  			component._set(newState);
  			inputinteger0_updating = {};
  		}
  	});

  	component.root._beforecreate.push(() => {
  		inputinteger0._bind({ min: 1, value: 1 }, inputinteger0.get());
  	});

  	var inputinteger1_initial_data = {};
  	if (ctx.max  !== void 0) {
  		inputinteger1_initial_data.max = ctx.max ;
  		inputinteger1_updating.max = true;
  	}
  	if (ctx.high !== void 0) {
  		inputinteger1_initial_data.value = ctx.high;
  		inputinteger1_updating.value = true;
  	}
  	var inputinteger1 = new InputInteger({
  		root: component.root,
  		store: component.store,
  		data: inputinteger1_initial_data,
  		_bind(changed, childState) {
  			var newState = {};
  			if (!inputinteger1_updating.max && changed.max) {
  				newState.max = childState.max;
  			}

  			if (!inputinteger1_updating.value && changed.value) {
  				newState.high = childState.value;
  			}
  			component._set(newState);
  			inputinteger1_updating = {};
  		}
  	});

  	component.root._beforecreate.push(() => {
  		inputinteger1._bind({ max: 1, value: 1 }, inputinteger1.get());
  	});

  	return {
  		c: function create() {
  			ul = createElement("ul");
  			li0 = createElement("li");
  			inputinteger0._fragment.c();
  			text0 = createText("\r\n    ");
  			li1 = createElement("li");
  			text1 = createText("\r\n    ");
  			li2 = createElement("li");
  			inputinteger1._fragment.c();
  			li0.className = "low svelte-oj21cp";
  			addLoc(li0, file$l, 1, 4, 32);
  			li1.className = "delimiter svelte-oj21cp";
  			addLoc(li1, file$l, 4, 4, 117);
  			li2.className = "high svelte-oj21cp";
  			addLoc(li2, file$l, 5, 4, 150);
  			ul.className = "integer-range svelte-oj21cp";
  			addLoc(ul, file$l, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, ul, anchor);
  			append(ul, li0);
  			inputinteger0._mount(li0, null);
  			append(ul, text0);
  			append(ul, li1);
  			append(ul, text1);
  			append(ul, li2);
  			inputinteger1._mount(li2, null);
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
  			var inputinteger0_changes = {};
  			if (!inputinteger0_updating.min && changed.min) {
  				inputinteger0_changes.min = ctx.min ;
  				inputinteger0_updating.min = ctx.min  !== void 0;
  			}
  			if (!inputinteger0_updating.value && changed.low) {
  				inputinteger0_changes.value = ctx.low;
  				inputinteger0_updating.value = ctx.low !== void 0;
  			}
  			inputinteger0._set(inputinteger0_changes);
  			inputinteger0_updating = {};

  			var inputinteger1_changes = {};
  			if (!inputinteger1_updating.max && changed.max) {
  				inputinteger1_changes.max = ctx.max ;
  				inputinteger1_updating.max = ctx.max  !== void 0;
  			}
  			if (!inputinteger1_updating.value && changed.high) {
  				inputinteger1_changes.value = ctx.high;
  				inputinteger1_updating.value = ctx.high !== void 0;
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

  			outrocallback = callAfter(outrocallback, 2);

  			if (inputinteger0) inputinteger0._fragment.o(outrocallback);
  			if (inputinteger1) inputinteger1._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(ul);
  			}

  			inputinteger0.destroy();
  			inputinteger1.destroy();
  		}
  	};
  }

  function IntegerRange(options) {
  	this._debugName = '<IntegerRange>';
  	if (!options || (!options.target && !options.root)) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this._state = assign(data$i(), options.data);
  	if (!('min' in this._state)) console.warn("<IntegerRange> was created without expected data property 'min'");
  	if (!('low' in this._state)) console.warn("<IntegerRange> was created without expected data property 'low'");
  	if (!('max' in this._state)) console.warn("<IntegerRange> was created without expected data property 'max'");
  	if (!('high' in this._state)) console.warn("<IntegerRange> was created without expected data property 'high'");
  	this._intro = !!options.intro;
  	this._handlers.update = [onupdate$9];

  	if (!document.getElementById("svelte-oj21cp-style")) add_css$3();

  	this._fragment = create_main_fragment$l(this, this._state);

  	this.root._oncreate.push(() => {
  		this.fire("update", { changed: assignTrue({}, this._state), current: this._state });
  	});

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(IntegerRange.prototype, protoDev);
  assign(IntegerRange.prototype, methods$b);

  IntegerRange.prototype._checkReadOnly = function _checkReadOnly(newState) {
  };

  /* src\Editor\Editor.html generated by Svelte v2.15.3 */

  Translations$1.addText('eng', {
  	layout: 'Layout',
  	filter: 'Filter',
  	popup: 'Popup',
  	zoom: 'Zoom'
  });

  Translations$1.addText('rus', {
  	layout: 'Визуализация',
  	filter: 'Фильтр',
  	popup: 'Подсказка',
  	zoom: 'Уровень зума'
  });

  var translate$2 = Translations$1.getText.bind(Translations$1);

  function decorationOutlineStyle(_ref) {
  	var decorationOutlineType = _ref.decorationOutlineType;

  	return decorationOutlineType ? 'solid' : 'dashed';
  }

  function data$j() {
  	return {
  		dashes: '10 10',
  		decorationFill: '#FFFFFF',
  		decorationFillAlpha: 100,
  		decorationOutline: '#FFFFFF',
  		decorationOutlineAlpha: 100,
  		decorationOutlineSize: 10,
  		decorationOutlineType: true,
  		fillStyle: 0,
  		fonts: ['Roboto'],
  		legendFields: [],
  		legendFill: '#FFFFFF',
  		legendField: '',
  		legendOutline: '#FFFFFF',
  		legendOutlineSize: 10,
  		legendFontSize: 10,
  		legendFont: 'Roboto',
  		legendFontStyle: '',
  		legendFontStyles: ['Regular'],
  		legendOffsetX: 0,
  		legendOffsetY: 0,
  		patternColors: [{ color: '#FFFFFF', use: true }, { color: '#FFFFFF', use: true }],
  		patternStyleIndex: 0,
  		patternStyle: '',
  		patternWidth: 1,
  		patternOffset: 1,
  		useDecorationFill: true,
  		useLegendOutline: true,
  		minZoom: 1,
  		maxZoom: 18
  	};
  }
  function ondestroy() {
  	var parent = this.refs.container.parentElement;
  	parent.removeChild(this.refs.container);
  }
  var file$m = "src\\Editor\\Editor.html";

  function create_main_fragment$m(component, ctx) {
  	var div1,
  	    text0,
  	    text1,
  	    div0,
  	    table,
  	    tr,
  	    td0,
  	    text2_value = translate$2('zoom'),
  	    text2,
  	    text3,
  	    td1,
  	    integerrange_updating = {},
  	    text4,
  	    layout_updating = {},
  	    text5,
  	    text6,
  	    current;

  	var headline = new Headline({
  		root: component.root,
  		store: component.store
  	});

  	headline.on("close", function (event) {
  		component.fire('close');
  	});

  	var preview = new Preview({
  		root: component.root,
  		store: component.store
  	});

  	var integerrange_initial_data = {
  		min: "1",
  		max: "21",
  		low: "1",
  		high: "18"
  	};
  	if (ctx.minZoom !== void 0) {
  		integerrange_initial_data.low = ctx.minZoom;
  		integerrange_updating.low = true;
  	}
  	if (ctx.maxZoom !== void 0) {
  		integerrange_initial_data.high = ctx.maxZoom;
  		integerrange_updating.high = true;
  	}
  	var integerrange = new IntegerRange({
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

  	var layout_initial_data = {};
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
  	if (ctx.dashes !== void 0) {
  		layout_initial_data.dashes = ctx.dashes;
  		layout_updating.dashes = true;
  	}
  	if (ctx.legendFill !== void 0) {
  		layout_initial_data.legendFill = ctx.legendFill;
  		layout_updating.legendFill = true;
  	}
  	if (ctx.legendOutline !== void 0) {
  		layout_initial_data.legendOutline = ctx.legendOutline;
  		layout_updating.legendOutline = true;
  	}
  	if (ctx.legendOutlineSize !== void 0) {
  		layout_initial_data.legendOutlineSize = ctx.legendOutlineSize;
  		layout_updating.legendOutlineSize = true;
  	}
  	if (ctx.legendFontSize !== void 0) {
  		layout_initial_data.legendFontSize = ctx.legendFontSize;
  		layout_updating.legendFontSize = true;
  	}
  	if (ctx.legendFont !== void 0) {
  		layout_initial_data.legendFont = ctx.legendFont;
  		layout_updating.legendFont = true;
  	}
  	if (ctx.legendFields !== void 0) {
  		layout_initial_data.legendFields = ctx.legendFields;
  		layout_updating.legendFields = true;
  	}
  	if (ctx.legendField !== void 0) {
  		layout_initial_data.legendField = ctx.legendField;
  		layout_updating.legendField = true;
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
  	if (ctx.patternColors !== void 0) {
  		layout_initial_data.patternColors = ctx.patternColors;
  		layout_updating.patternColors = true;
  	}
  	if (ctx.patternStyle !== void 0) {
  		layout_initial_data.patternStyle = ctx.patternStyle;
  		layout_updating.patternStyle = true;
  	}
  	if (ctx.patternWidth !== void 0) {
  		layout_initial_data.patternWidth = ctx.patternWidth;
  		layout_updating.patternWidth = true;
  	}
  	if (ctx.patternOffset !== void 0) {
  		layout_initial_data.patternOffset = ctx.patternOffset;
  		layout_updating.patternOffset = true;
  	}
  	if (ctx.useDecorationFill !== void 0) {
  		layout_initial_data.useDecorationFill = ctx.useDecorationFill;
  		layout_updating.useDecorationFill = true;
  	}
  	if (ctx.useLegendOutline !== void 0) {
  		layout_initial_data.useLegendOutline = ctx.useLegendOutline;
  		layout_updating.useLegendOutline = true;
  	}
  	if (ctx.fillStyle !== void 0) {
  		layout_initial_data.fillStyle = ctx.fillStyle;
  		layout_updating.fillStyle = true;
  	}
  	var layout = new Layout({
  		root: component.root,
  		store: component.store,
  		data: layout_initial_data,
  		_bind: function _bind(changed, childState) {
  			var newState = {};
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

  			if (!layout_updating.dashes && changed.dashes) {
  				newState.dashes = childState.dashes;
  			}

  			if (!layout_updating.legendFill && changed.legendFill) {
  				newState.legendFill = childState.legendFill;
  			}

  			if (!layout_updating.legendOutline && changed.legendOutline) {
  				newState.legendOutline = childState.legendOutline;
  			}

  			if (!layout_updating.legendOutlineSize && changed.legendOutlineSize) {
  				newState.legendOutlineSize = childState.legendOutlineSize;
  			}

  			if (!layout_updating.legendFontSize && changed.legendFontSize) {
  				newState.legendFontSize = childState.legendFontSize;
  			}

  			if (!layout_updating.legendFont && changed.legendFont) {
  				newState.legendFont = childState.legendFont;
  			}

  			if (!layout_updating.legendFields && changed.legendFields) {
  				newState.legendFields = childState.legendFields;
  			}

  			if (!layout_updating.legendField && changed.legendField) {
  				newState.legendField = childState.legendField;
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

  			if (!layout_updating.patternColors && changed.patternColors) {
  				newState.patternColors = childState.patternColors;
  			}

  			if (!layout_updating.patternStyle && changed.patternStyle) {
  				newState.patternStyle = childState.patternStyle;
  			}

  			if (!layout_updating.patternWidth && changed.patternWidth) {
  				newState.patternWidth = childState.patternWidth;
  			}

  			if (!layout_updating.patternOffset && changed.patternOffset) {
  				newState.patternOffset = childState.patternOffset;
  			}

  			if (!layout_updating.useDecorationFill && changed.useDecorationFill) {
  				newState.useDecorationFill = childState.useDecorationFill;
  			}

  			if (!layout_updating.useLegendOutline && changed.useLegendOutline) {
  				newState.useLegendOutline = childState.useLegendOutline;
  			}

  			if (!layout_updating.fillStyle && changed.fillStyle) {
  				newState.fillStyle = childState.fillStyle;
  			}
  			component._set(newState);
  			layout_updating = {};
  		}
  	});

  	component.root._beforecreate.push(function () {
  		layout._bind({ decorationFill: 1, decorationFillAlpha: 1, decorationOutline: 1, decorationOutlineAlpha: 1, decorationOutlineSize: 1, decorationOutlineType: 1, dashes: 1, legendFill: 1, legendOutline: 1, legendOutlineSize: 1, legendFontSize: 1, legendFont: 1, legendFields: 1, legendField: 1, legendFontStyle: 1, legendFontStyles: 1, legendOffsetX: 1, legendOffsetY: 1, patternColors: 1, patternStyle: 1, patternWidth: 1, patternOffset: 1, useDecorationFill: 1, useLegendOutline: 1, fillStyle: 1 }, layout.get());
  	});

  	var panel0_initial_data = { id: "layout", title: translate$2('layout') };
  	var panel0 = new Panel({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel0_initial_data
  	});

  	var filter = new Filter({
  		root: component.root,
  		store: component.store
  	});

  	var panel1_initial_data = { id: "filter", title: translate$2('filter') };
  	var panel1 = new Panel({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel1_initial_data
  	});

  	var popup = new Popup({
  		root: component.root,
  		store: component.store
  	});

  	var panel2_initial_data = { id: "popup", title: translate$2('popup') };
  	var panel2 = new Panel({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() },
  		data: panel2_initial_data
  	});

  	var tabs = new Tabs({
  		root: component.root,
  		store: component.store,
  		slots: { default: createFragment() }
  	});

  	return {
  		c: function create() {
  			div1 = createElement("div");
  			headline._fragment.c();
  			text0 = createText("\r\n    ");
  			preview._fragment.c();
  			text1 = createText("\r\n    ");
  			div0 = createElement("div");
  			table = createElement("table");
  			tr = createElement("tr");
  			td0 = createElement("td");
  			text2 = createText(text2_value);
  			text3 = createText("\r\n                        ");
  			td1 = createElement("td");
  			integerrange._fragment.c();
  			text4 = createText("            \r\n            ");
  			layout._fragment.c();
  			panel0._fragment.c();
  			text5 = createText("\r\n        ");
  			filter._fragment.c();
  			panel1._fragment.c();
  			text6 = createText("\r\n        ");
  			popup._fragment.c();
  			panel2._fragment.c();
  			tabs._fragment.c();
  			td0.className = "label";
  			addLoc(td0, file$m, 8, 24, 280);
  			addLoc(td1, file$m, 9, 24, 348);
  			addLoc(tr, file$m, 7, 20, 250);
  			addLoc(table, file$m, 6, 16, 221);
  			div0.className = "zoom";
  			addLoc(div0, file$m, 5, 12, 185);
  			div1.className = "style-editor";
  			addLoc(div1, file$m, 0, 0, 0);
  		},

  		m: function mount(target, anchor) {
  			insert(target, div1, anchor);
  			headline._mount(div1, null);
  			append(div1, text0);
  			preview._mount(div1, null);
  			append(div1, text1);
  			append(panel0._slotted.default, div0);
  			append(div0, table);
  			append(table, tr);
  			append(tr, td0);
  			append(td0, text2);
  			append(tr, text3);
  			append(tr, td1);
  			integerrange._mount(td1, null);
  			append(panel0._slotted.default, text4);
  			layout._mount(panel0._slotted.default, null);
  			panel0._mount(tabs._slotted.default, null);
  			append(tabs._slotted.default, text5);
  			filter._mount(panel1._slotted.default, null);
  			panel1._mount(tabs._slotted.default, null);
  			append(tabs._slotted.default, text6);
  			popup._mount(panel2._slotted.default, null);
  			panel2._mount(tabs._slotted.default, null);
  			tabs._mount(div1, null);
  			component.refs.container = div1;
  			current = true;
  		},

  		p: function update(changed, _ctx) {
  			ctx = _ctx;
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

  			var layout_changes = {};
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
  			if (!layout_updating.dashes && changed.dashes) {
  				layout_changes.dashes = ctx.dashes;
  				layout_updating.dashes = ctx.dashes !== void 0;
  			}
  			if (!layout_updating.legendFill && changed.legendFill) {
  				layout_changes.legendFill = ctx.legendFill;
  				layout_updating.legendFill = ctx.legendFill !== void 0;
  			}
  			if (!layout_updating.legendOutline && changed.legendOutline) {
  				layout_changes.legendOutline = ctx.legendOutline;
  				layout_updating.legendOutline = ctx.legendOutline !== void 0;
  			}
  			if (!layout_updating.legendOutlineSize && changed.legendOutlineSize) {
  				layout_changes.legendOutlineSize = ctx.legendOutlineSize;
  				layout_updating.legendOutlineSize = ctx.legendOutlineSize !== void 0;
  			}
  			if (!layout_updating.legendFontSize && changed.legendFontSize) {
  				layout_changes.legendFontSize = ctx.legendFontSize;
  				layout_updating.legendFontSize = ctx.legendFontSize !== void 0;
  			}
  			if (!layout_updating.legendFont && changed.legendFont) {
  				layout_changes.legendFont = ctx.legendFont;
  				layout_updating.legendFont = ctx.legendFont !== void 0;
  			}
  			if (!layout_updating.legendFields && changed.legendFields) {
  				layout_changes.legendFields = ctx.legendFields;
  				layout_updating.legendFields = ctx.legendFields !== void 0;
  			}
  			if (!layout_updating.legendField && changed.legendField) {
  				layout_changes.legendField = ctx.legendField;
  				layout_updating.legendField = ctx.legendField !== void 0;
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
  			if (!layout_updating.patternColors && changed.patternColors) {
  				layout_changes.patternColors = ctx.patternColors;
  				layout_updating.patternColors = ctx.patternColors !== void 0;
  			}
  			if (!layout_updating.patternStyle && changed.patternStyle) {
  				layout_changes.patternStyle = ctx.patternStyle;
  				layout_updating.patternStyle = ctx.patternStyle !== void 0;
  			}
  			if (!layout_updating.patternWidth && changed.patternWidth) {
  				layout_changes.patternWidth = ctx.patternWidth;
  				layout_updating.patternWidth = ctx.patternWidth !== void 0;
  			}
  			if (!layout_updating.patternOffset && changed.patternOffset) {
  				layout_changes.patternOffset = ctx.patternOffset;
  				layout_updating.patternOffset = ctx.patternOffset !== void 0;
  			}
  			if (!layout_updating.useDecorationFill && changed.useDecorationFill) {
  				layout_changes.useDecorationFill = ctx.useDecorationFill;
  				layout_updating.useDecorationFill = ctx.useDecorationFill !== void 0;
  			}
  			if (!layout_updating.useLegendOutline && changed.useLegendOutline) {
  				layout_changes.useLegendOutline = ctx.useLegendOutline;
  				layout_updating.useLegendOutline = ctx.useLegendOutline !== void 0;
  			}
  			if (!layout_updating.fillStyle && changed.fillStyle) {
  				layout_changes.fillStyle = ctx.fillStyle;
  				layout_updating.fillStyle = ctx.fillStyle !== void 0;
  			}
  			layout._set(layout_changes);
  			layout_updating = {};
  		},

  		i: function intro(target, anchor) {
  			if (current) return;

  			this.m(target, anchor);
  		},

  		o: function outro(outrocallback) {
  			if (!current) return;

  			outrocallback = callAfter(outrocallback, 10);

  			if (headline) headline._fragment.o(outrocallback);
  			if (preview) preview._fragment.o(outrocallback);
  			if (integerrange) integerrange._fragment.o(outrocallback);
  			if (layout) layout._fragment.o(outrocallback);
  			if (panel0) panel0._fragment.o(outrocallback);
  			if (filter) filter._fragment.o(outrocallback);
  			if (panel1) panel1._fragment.o(outrocallback);
  			if (popup) popup._fragment.o(outrocallback);
  			if (panel2) panel2._fragment.o(outrocallback);
  			if (tabs) tabs._fragment.o(outrocallback);
  			current = false;
  		},

  		d: function destroy$$1(detach) {
  			if (detach) {
  				detachNode(div1);
  			}

  			headline.destroy();
  			preview.destroy();
  			integerrange.destroy();
  			layout.destroy();
  			panel0.destroy();
  			filter.destroy();
  			panel1.destroy();
  			popup.destroy();
  			panel2.destroy();
  			tabs.destroy();
  			if (component.refs.container === div1) component.refs.container = null;
  		}
  	};
  }

  function Editor(options) {
  	this._debugName = '<Editor>';
  	if (!options || !options.target && !options.root) {
  		throw new Error("'target' is a required option");
  	}

  	init(this, options);
  	this.refs = {};
  	this._state = assign(data$j(), options.data);

  	this._recompute({ decorationOutlineType: 1 }, this._state);
  	if (!('decorationOutlineType' in this._state)) console.warn("<Editor> was created without expected data property 'decorationOutlineType'");
  	if (!('minZoom' in this._state)) console.warn("<Editor> was created without expected data property 'minZoom'");
  	if (!('maxZoom' in this._state)) console.warn("<Editor> was created without expected data property 'maxZoom'");
  	if (!('decorationFill' in this._state)) console.warn("<Editor> was created without expected data property 'decorationFill'");
  	if (!('decorationFillAlpha' in this._state)) console.warn("<Editor> was created without expected data property 'decorationFillAlpha'");
  	if (!('decorationOutline' in this._state)) console.warn("<Editor> was created without expected data property 'decorationOutline'");
  	if (!('decorationOutlineAlpha' in this._state)) console.warn("<Editor> was created without expected data property 'decorationOutlineAlpha'");
  	if (!('decorationOutlineSize' in this._state)) console.warn("<Editor> was created without expected data property 'decorationOutlineSize'");
  	if (!('dashes' in this._state)) console.warn("<Editor> was created without expected data property 'dashes'");
  	if (!('legendFill' in this._state)) console.warn("<Editor> was created without expected data property 'legendFill'");
  	if (!('legendOutline' in this._state)) console.warn("<Editor> was created without expected data property 'legendOutline'");
  	if (!('legendOutlineSize' in this._state)) console.warn("<Editor> was created without expected data property 'legendOutlineSize'");
  	if (!('legendFontSize' in this._state)) console.warn("<Editor> was created without expected data property 'legendFontSize'");
  	if (!('legendFont' in this._state)) console.warn("<Editor> was created without expected data property 'legendFont'");
  	if (!('legendFields' in this._state)) console.warn("<Editor> was created without expected data property 'legendFields'");
  	if (!('legendField' in this._state)) console.warn("<Editor> was created without expected data property 'legendField'");
  	if (!('legendFontStyle' in this._state)) console.warn("<Editor> was created without expected data property 'legendFontStyle'");
  	if (!('legendFontStyles' in this._state)) console.warn("<Editor> was created without expected data property 'legendFontStyles'");
  	if (!('legendOffsetX' in this._state)) console.warn("<Editor> was created without expected data property 'legendOffsetX'");
  	if (!('legendOffsetY' in this._state)) console.warn("<Editor> was created without expected data property 'legendOffsetY'");
  	if (!('patternColors' in this._state)) console.warn("<Editor> was created without expected data property 'patternColors'");
  	if (!('patternStyle' in this._state)) console.warn("<Editor> was created without expected data property 'patternStyle'");
  	if (!('patternWidth' in this._state)) console.warn("<Editor> was created without expected data property 'patternWidth'");
  	if (!('patternOffset' in this._state)) console.warn("<Editor> was created without expected data property 'patternOffset'");
  	if (!('useDecorationFill' in this._state)) console.warn("<Editor> was created without expected data property 'useDecorationFill'");
  	if (!('useLegendOutline' in this._state)) console.warn("<Editor> was created without expected data property 'useLegendOutline'");
  	if (!('fillStyle' in this._state)) console.warn("<Editor> was created without expected data property 'fillStyle'");
  	this._intro = !!options.intro;

  	this._handlers.destroy = [ondestroy];

  	this._fragment = create_main_fragment$m(this, this._state);

  	if (options.target) {
  		if (options.hydrate) throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
  		this._fragment.c();
  		this._mount(options.target, options.anchor);

  		flush(this);
  	}

  	this._intro = true;
  }

  assign(Editor.prototype, protoDev);

  Editor.prototype._checkReadOnly = function _checkReadOnly(newState) {
  	if ('decorationOutlineStyle' in newState && !this._updatingReadonlyProperty) throw new Error("<Editor>: Cannot set read-only property 'decorationOutlineStyle'");
  };

  Editor.prototype._recompute = function _recompute(changed, state) {
  	if (changed.decorationOutlineType) {
  		if (this._differs(state.decorationOutlineStyle, state.decorationOutlineStyle = decorationOutlineStyle(state))) changed.decorationOutlineStyle = true;
  	}
  };

  window.nsGmx = window.nsGmx || {};

  const pluginName = 'GmxStyler';
  let editor = null;
  const publicInterface = {
      pluginName,
      afterViewer: function (params, map) {
          if (window.nsGmx) {
              
              window.nsGmx.gmxMap.layers.forEach(layer => {
                  console.log(layer);
                  // styleEditor.setHoverStyle(layer);
              });

              nsGmx.leafletMap.on('layeradd', e => {
                  const layer = e.layer;
                  console.log(layer);
                  // styleEditor.setHoverStyle(layer);
              });

              // replace existing LayersStylesEditor function
              nsGmx.createStylesDialog = function(treeElem, treeView, i) {
                  let layerId = treeElem.name;
                  let layer = nsGmx.gmxMap.layersByID[layerId];
                  let gmxProps = layer.getGmxProperties && layer.getGmxProperties();
                  let pluginContainer = document.createElement('div');
                  let layersTreeContainer = nsGmx.layersTreePane.children[0];

                  const {styles, attributes} = gmxProps;
                  let legendFields = attributes.slice();
                  legendFields.unshift('');
                  const styleIndex = i || 0;
                  const {MinZoom, MaxZoom, RenderStyle: {fill, label, outline}} = styles[styleIndex];

                  pluginContainer.className = 'gmx-styler';
                  layersTreeContainer.style.display = 'none';
                  nsGmx.layersTreePane.appendChild(pluginContainer);
                  const decorationFill = fill && fill.color ? int2hex(fill.color) : '#FFFFFF';
                  const useDecorationFill = fill && fill.color;
                  const decorationFillAlpha = fill && fill.opacity ? fill.opacity : 100;
                  const decorationOutline = outline && outline.color ? int2hex(outline.color) : '#FFFFFF';
                  const decorationOutlineAlpha = outline && outline.opacity ? outline.opacity : 100;
                  const decorationOutlineSize = outline && outline.thickness ? outline.thickness : 1;
                  const decorationOutlineType = outline && outline.dashes ? false : true;                
                  const dashes = outline && outline.dashes && Array.isArray (outline.dashes) ? outline.dashes.slice(0, 1).join(' ') : '10 10';
                  const fillStyle = fill && fill.patterns ? 1 : 0;
                  const legendFill = label && label.color ? int2hex (label.color) : '#FFFFFF';
                  const useLegendOutline = label && label.color;
                  const legendOutline = label && label.haloColor ? int2hex (label.haloColor) : '#FFFFFF';
                  const legendField = label && label.field ? label.field : '';
                  const legendOffsetX = label && label.dx ? label.dx : 0;
                  const legendOffsetY = label && label.dy ? label.dy : 0;
                  const legendFontSize = label && label.size ? label.size : 10;
                  
                  editor = new Editor({target: pluginContainer, data: {
                      decorationFill,
                      decorationFillAlpha,
                      decorationOutline,
                      decorationOutlineAlpha,
                      decorationOutlineSize,
                      decorationOutlineType,
                      dashes,
                      legendFields,
                      legendFill,
                      legendOutline,
                      legendField,                        
                      legendOffsetX,
                      legendOffsetY,
                      legendFontSize,
                      fillStyle,
                      useDecorationFill,                    
                      useLegendOutline,
                      minZoom: MinZoom,
                      maxZoom: MaxZoom,
                  }});
                  editor.on('state', ({changed, current, previous}) => {                        
                      // gmxProps = layer.getGmxProperties && layer.getGmxProperties(),
                      const div = $(window._queryMapLayers.buildedTree).find("div[LayerID='" + gmxProps.name + "']")[0];
                      // styles = gmxProps.gmxStyles.styles,
                      // layersTreeContainer = nsGmx.layersTreePane,
                      // styleEditorContainer = nsGmx.layersTreePane.parentElement.querySelector('.gmx-style-editor');                                                                                
                      switch (current.fillStyle) {
                          case 0:
                              delete styles[styleIndex].RenderStyle.fill.pattern;
                              if (current.useDecorationFill) {
                                  styles[styleIndex].RenderStyle.fill.color = hex2int (current.decorationFill);
                                  styles[styleIndex].RenderStyle.fill.opacity = current.decorationFillAlpha;
                              }
                              else {
                                  delete styles[styleIndex].RenderStyle.fill.color;
                              }                                                       
                              break;
                          case 1:
                              const patternColors = current.patternColors.filter(c => c.use).map(c => hex2int(c.color));
                              delete styles[styleIndex].RenderStyle.fill.color;
                              styles[styleIndex].RenderStyle.fill.pattern = {
                                  colors: patternColors,
                                  style: current.patternStyle,
                                  width: current.patternWidth,
                                  step: current.patternOffset,
                              };
                              break;
                          default:
                              break;
                      }
                      
                      switch (current.decorationOutlineStyle) {
                          case 'solid':
                              delete styles[styleIndex].RenderStyle.outline.dashes;
                              break;
                          case 'dashed':
                              styles[styleIndex].RenderStyle.outline.dashes = current.dashes.split(/\s+/g).map(d => parseInt(d, 10));
                              break;
                          default:
                              break;
                      }
                      styles[styleIndex].RenderStyle.outline.color = hex2int (current.decorationOutline);
                      styles[styleIndex].RenderStyle.outline.opacity = current.decorationOutlineAlpha;                    
                      styles[styleIndex].RenderStyle.outline.thickness = current.decorationOutlineSize;                    
                                          
                      styles[styleIndex].RenderStyle.label = {
                          color: hex2int(current.legendFill),
                          dx: current.legendOffsetX,
                          dy: current.legendOffsetY,
                          // field: attributes[0],
                          haloColor: hex2int (current.legendOutline),
                          size:current.legendFontSize,
                      };
                      styles[styleIndex].RenderStyle.labelTemplate = current.legendField;                    
                                      
                      let templateStyle = styles[styleIndex].RenderStyle;

                      window._mapHelper.updateTreeStyles(styles, div, window._layersTree);
                      nsGmx.Utils.setMapObjectStyle(layer, styleIndex, templateStyle);                                                
                  });
                  editor.on ('close', () => {                        
                      nsGmx.layersTreePane.removeChild(pluginContainer);
                      editor = null;
                      layersTreeContainer.style.display = 'block';
                  });
                  
              };
              // nsGmx.styleEditor = styleEditor;
          }
      },
      unload: function () {
          if (editor) {
              editor.destroy();
          }
      }
  };

  if (window.gmxCore) {
      const pluginPath = gmxCore.getModulePath(pluginName);
      window.gmxCore.addModule(pluginName, publicInterface, {
          css: 'gmx-styler.css',
          init: function(module, path) {}
      });
  } else {
      window.nsGmx[pluginName] = publicInterface;
  }

}());
//# sourceMappingURL=gmx-styler.js.map
