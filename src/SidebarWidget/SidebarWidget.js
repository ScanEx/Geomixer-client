var nsGmx = window.nsGmx || {};

var SidebarWidget = function (params) {
    this.container = params.container;
    this.tabsContainer = document.createElement('div');
    this.tabsContainer.className = "leftCollapser-icon leftCollapser-left";

    this.mainContainer = document.createElement('div');
    this.mainContainer.className = "leftMenu";

    this.tabsContainer.innerHTML = 'o_O';
    this.mainContainer.innerHTML = 'test test';

    this.container.appendChild(this.tabsContainer);
    this.container.appendChild(this.mainContainer);

    this.width = params.width;
};

SidebarWidget.prototype = {
    setPane: function () {

    },

    enable: function () {

    },

    close: function () {

    },

    getActiveTabId: function () {

    },

    setPane: function () {

    },

    setPane: function () {

    },

    isOpened: function () {

    },
}

nsGmx.SidebarWidget = SidebarWidget;
