links.Timeline.ItemLine = function (data, options) {
    links.Timeline.Item.call(this, data, options);
    this.lastLeftPosition = null;
};

links.Timeline.ItemLine.prototype = new links.Timeline.Item();

/**
 * Reflow the Item: retrieve its actual size from the DOM
 * @return {boolean} resized    returns true if the axis is resized
 * @override
 */
links.Timeline.ItemLine.prototype.reflow = function () {
    return false;
};

/**
 * Select the item
 * @override
 */
links.Timeline.ItemLine.prototype.select = function () {
    var dom = this.dom;
    links.Timeline.addClassName(dom, 'timeline-event-selected');
};

/**
 * Unselect the item
 * @override
 */
links.Timeline.ItemLine.prototype.unselect = function () {
    var dom = this.dom;
    links.Timeline.removeClassName(dom, 'timeline-event-selected');
};

/**
 * Creates the DOM for the item, depending on its type
 * @return {Element | undefined}
 * @override
 */
links.Timeline.ItemLine.prototype.createDOM = function () {
    var _this = this;
    var divLine = document.createElement("DIV");
    divLine.style.position = "absolute";
    divLine.style.width = "0px";
    
    var divBox = document.createElement("DIV");
    divBox.style.position = "absolute";
    divBox.style.left = this.left + "px";
    divBox.style.top = this.top + "px";
    divBox.style.display = 'none';

    // contents box (inside the background box). used for making margins
    var divContent = document.createElement("DIV");
    divContent.className = "timeline-event-content";
    divContent.innerHTML = this.content;
    divBox.appendChild(divContent);

    divLine.tip = divBox;
    // divLine.appendChild(divBox);

    divLine.onmouseover = function(event)
    {
        window.jQuery && jQuery(_this).trigger('mouseover');
        
        event = event || window.event;
        
        var offsetY = typeof event.offsetY !== 'undefined' ? event.offsetY : event.layerY;
        
        this.tip.style.top = (offsetY - 25) + 'px';
        this.tip.style.left = (_this.dom.offsetLeft + 3) + 'px';
        this.tip.style.display = '';
    }

    divLine.onmouseout = function()
    {
        window.jQuery && jQuery(_this).trigger('mouseout');
        
        this.tip.style.display = 'none';
    }

    this.dom = divLine;
    this.updateDOM();

    return divLine;
};

/**
 * Append the items DOM to the given HTML container. If items DOM does not yet
 * exist, it will be created first.
 * @param {Element} container
 * @override
 */
links.Timeline.ItemLine.prototype.showDOM = function (container) {
    var dom = this.dom;
    if (!dom) {
        dom = this.createDOM();
    }

    if (dom.parentNode != container) {
        if (dom.parentNode) {
            // container changed. remove it from old container first
            this.hideDOM();
        }

        // container.appendChild(dom);
        container.insertBefore(dom, container.firstChild);
        // container.insertBefore(dom, container.firstChild);
        container.appendChild(dom.tip);
        this.rendered = true;
    }
};

/**
 * Remove the items DOM from the current HTML container
 * @override
 */
links.Timeline.ItemLine.prototype.hideDOM = function () {
    var dom = this.dom;
    if (dom) {
        var parent = dom.parentNode;
        if (parent) {
            parent.removeChild(dom);
            parent.removeChild(dom.tip);
            this.rendered = false;
            this.lastLeftPosition = null;
        }
    }
};

/**
 * Update the DOM of the item. This will update the content and the classes
 * of the item
 * @override
 */
links.Timeline.ItemLine.prototype.updateDOM = function () {
    var divBox = this.dom;
    if (divBox) {
        //var divLine = divBox.line;

        // update class
        divBox.className = "timeline-event timeline-event-line";
        divBox.tip.className = "timeline-event timeline-event-box";

        if (this.isCluster) {
            links.Timeline.addClassName(divBox, 'timeline-event-cluster');
            links.Timeline.addClassName(divBox.tip, 'timeline-event-cluster');
        }

        // add item specific class name when provided
        if (this.className) {
            links.Timeline.addClassName(divBox, this.className);
            links.Timeline.addClassName(divBox.tip, this.className);
        }
    }
};

/**
 * Reposition the item, recalculate its left, top, and width, using the current
 * range of the timeline and the timeline options. *
 * @param {links.Timeline} timeline
 * @override
 */
links.Timeline.ItemLine.prototype.updatePosition = function (timeline) {
    var dom = this.dom;
    if (dom) {
        var left = timeline.timeToScreen(this.start);
        
        if (this.lastLeftPosition !== null && this.lastLeftPosition === left) {
            return;
        }
        
        this.lastLeftPosition = left;
        
        var axisOnTop = timeline.options.axisOnTop,
            axisTop = timeline.size.axis.top,
            axisHeight = timeline.size.axis.height

        dom.style.left = (left - this.lineWidth/2) + "px";
        dom.style.top = "0px";
        dom.style.height = axisTop + "px";
    }
};

/**
 * Check if the item is visible in the timeline, and not part of a cluster.
 * @param {Date} start
 * @param {Date} end
 * @return {boolean} visible
 * @override
 */
links.Timeline.ItemLine.prototype.isVisible = function (start, end) {
    if (this.cluster) {
        return false;
    }

    return (this.start > start)
        && (this.start < end);
};


/**
 * Reposition the item
 * @param {Number} left
 * @param {Number} right
 * @override
 */
links.Timeline.ItemLine.prototype.setPosition = function (left, right) {
    var dom = this.dom;
    if (this.lastLeftPosition === null || this.lastLeftPosition !== left) {
        this.lastLeftPosition = left;
        dom.style.left = (left - this.lineWidth / 2) + "px";
    }
};

/**
 * Calculate the right position of the item
 * @param {links.Timeline} timeline
 * @return {Number} right
 * @override
 */
links.Timeline.ItemLine.prototype.getRight = function (timeline) {
    return timeline.timeToScreen(this.start);
};