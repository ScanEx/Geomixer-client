var nsGmx = window.nsGmx || {};

var SidebarWidget = function (params) {
    this._panes = {};
    this._callback = params.callback;
    this._container = params.container;

    this._mainContainer = document.createElement('div');
    this._tabsContainer = document.createElement('ul');
    this._panesContainer = document.createElement('div');

    this._mainContainer.className = "gmx-sidebar";
    this._tabsContainer.className = "gmx-sidebar-tabs";
    this._panesContainer.className = "gmx-sidebar-content";

    this._mainContainer.appendChild(this._tabsContainer);
    this._mainContainer.appendChild(this._panesContainer);

    this._container.appendChild(this._mainContainer);

    this._collapsedWidth = params.collapsedWidth || 40;
    this._extendedWidth = params.extendedWidth || 400;

    /* sidebar events
     * ev.opening
     * ev.opened { <String>id }
     * ev.closing
     * ev.closed
     */
    this.listeners = {
        "opening": [],
        "opened": [],
        "closing": [],
        "closed": []
    };
    this.opening = document.createEvent('Event');
    this.opening.initEvent('sidebar:opening', true, true);
    this.opened = document.createEvent('Event');
    this.opened.initEvent('sidebar:opened', true, true);
    this.closing = document.createEvent('Event');
    this.closing.initEvent('sidebar:closing', true, true);
    this.closed = document.createEvent('Event');
    this.closed.initEvent('sidebar:closed', true, true);
};

SidebarWidget.prototype = {
    on: function (type, callback) {
        if(!(type in this.listeners)) {
            this.listeners[type] = [];
        }
        this.listeners[type].push(callback);
    },

    off: function (type, callback) {
        if(!(type in this.listeners)) {
            return;
        }
        var stack = this.listeners[type];
        for(var i = 0, l = stack.length; i < l; i++) {
            if(stack[i] === callback){
                stack.splice(i, 1);
                return this.removeEventListener(type, callback);
            }
        }
    },

    fire: function (type, options) {
        if(!(type in this.listeners)) {
            return;
        }
        var stack = this.listeners[type];
        // event.target = this;
        for(var i = 0, l = stack.length; i < l; i++) {
            stack[i].call(this, options);
        }
    },

    setPane: function (id, paneOptions) {
        var paneOptions = paneOptions || {};
        var createTab = paneOptions.createTab;
        var position = paneOptions.position;
        var enabled = paneOptions.enabled;
        var defaultPaneOptions = { position: 0, enabled: true };

        this._panes[id] = L.extend({}, defaultPaneOptions, this._panes[id] || {}, paneOptions);

        if (!this._panes[id].enabled && this._activeTabId === id) {
            this.close();
        }

        this._renderTabs({});
        return this._ensurePane(id);
    },

    enable: function () {

    },

    getWidth: function () {
        if (this._isOpened) {
            return this._extendedWidth;
        } else {
            return this._collapsedWidth;
        }
    },

    open: function(paneId) {
        if (this._isAnimating) {
            return;
        }

        var pane = this._panes[paneId];
        if (!pane || !pane.enabled) {
            return;
        }

        this._activeTabId = paneId;

        this._setTabActive(paneId, true);

        this._setActiveClass(paneId);

        if (this._isOpened) {
            this.fire('opened', { id: this._activeTabId});
            return;
        }

        this._isAnimating = true;
        L.DomUtil.addClass(this._container, 'gmx-sidebar-opened');
        L.DomUtil.addClass(this._container, 'gmx-sidebar-expanded');
        this._isOpened = true;
        this.fire('opening');
        setTimeout(function() {
            this.fire('opened', { id: this._activeTabId });
            this._isAnimating = false;
            this._callback(this._extendedWidth);
        }.bind(this), 250);

    },

    _setTabActive: function (paneId, flag) {
        var tabs = this._tabsContainer.querySelectorAll('.gmx-sidebar-tab');
        for (var i = 0; i < tabs.length; ++i) {
            var id = tabs[i].getAttribute('data-tab-id');
            var tab = tabs[i].querySelector('.tab-icon');
            if (id === paneId) {
                if (flag) {
                    L.DomUtil.addClass(tab, 'tab-icon-active');
                }
                else {
                    L.DomUtil.removeClass(tab, 'tab-icon-active');
                }
            } else {
                L.DomUtil.removeClass(tab, 'tab-icon-active');
            }
        }
    },

    close: function() {
        if (this._isAnimating) {
            return;
        }
        this._setTabActive(this._activeTabId, false);

        L.DomUtil.removeClass(this._container, 'gmx-sidebar-opened');

        this._isAnimating = true;
        L.DomUtil.removeClass(this._container, 'gmx-sidebar-opened');
        this._isOpened = false;
        this.fire('closing');
        setTimeout(function() {
            L.DomUtil.removeClass(this._container, 'gmx-sidebar-expanded');
            this.fire('closed', { id: this._activeTabId });
            this._isAnimating = false;
            this._setActiveClass('');
            this._activeTabId = null;
            this._callback(this._collapsedWidth);
        }.bind(this), 250);

    },

    _setActiveClass: function(activeId) {
        var i, id;
        for (i = 0; i < this._panesContainer.children.length; i++) {
            id = this._panesContainer.children[i].getAttribute('data-pane-id');
            var pane = this._panesContainer.querySelector('[data-pane-id=' + id + ']');
            if (id === activeId) {
                L.DomUtil.addClass(pane, 'gmx-sidebar-pane-active');
            } else {
                L.DomUtil.removeClass(pane, 'gmx-sidebar-pane-active');
            }
        }
    },

    getActiveTabId: function() {
        return this._activeTabId;
    },

    isOpened: function () {
        return this._isOpened;
    },


    _ensurePane: function(id) {

        for (let i = 0; i < this._panesContainer.childNodes.length; ++i) {
            let node = this._panesContainer.childNodes[i];
            if (node.getAttribute('data-pane-id') === id) {
                return node;
            }
        }

        let paneEl = L.DomUtil.create('div', 'gmx-sidebar-pane');
        paneEl.setAttribute('data-pane-id', id);
        this._panesContainer.appendChild(paneEl);

        return paneEl;
    },


    _onTabClick: function(e) {
        var tabId = e.currentTarget.getAttribute('data-tab-id');
        var pane = this._panes[tabId];
        if (!pane || !pane.enabled) {
            return;
        }
        if (!this._isOpened || this._activeTabId !== tabId) {
            this._renderTabs({ activeTabId: tabId });
            this.open(tabId);
        } else {
            this._renderTabs({});
            this.close();
        }
    },

    _renderTabs: function (options) {
        var activeTabId = options.activeTabId;
        var hoveredTabId = options.hoveredTabId;
        this._tabsContainer.innerHTML = '';
        Object.keys(this._panes).map(function(id) {
            return L.extend({ id: id }, this._panes[id]);
        }.bind(this)).sort(function (a, b) {
            return a.position - b.position;
        }).map(function (options) {
            var id = options.id;
            var createTab = options.createTab;
            var enabled = options.enabled;
            if (!createTab) {
                return;
            }
            var tabContainerEl = document.createElement('li');
            tabContainerEl.className = 'gmx-sidebar-tab';
            tabContainerEl.setAttribute('data-tab-id', id);
            var tabEl = createTab(getFlag(id, activeTabId, hoveredTabId, enabled));
            L.DomEvent.on(tabContainerEl, 'click', this._onTabClick, this);
            tabContainerEl.appendChild(tabEl);
            this._tabsContainer.appendChild(tabContainerEl);
        }.bind(this));

        function getFlag(tabId, activeTabId, hoveredTabId, enabled) {
            if (!enabled) {
                return 'disabled';
            } else if (hoveredTabId && tabId === hoveredTabId) {
                return 'hover';
            } else if (activeTabId && tabId === activeTabId) {
                return 'active';
            } else {
                return 'default';
            }
        }
    }
}

nsGmx.SidebarWidget = SidebarWidget;
