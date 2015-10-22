TreeViewController = function(view) {
    this._view = $(view);
    
    this._initializeRoot();
    
    this._onNodeClick = null;
    this._onNodeDblClick = null;
    this._onNodeCheckedChanged = null;
    this._onNodeRefresh = null;
}

TreeViewController.prototype = {
    _initializeRoot: function() {
        this._createRoot();
    },
    
    _createRoot: function() {
        this._root = new TreeNode('root', 'Результаты');
        this._root.isChecked = true;
        this._root.isCollapsed = false;
        this._renderNode(this._root);
        $.create('ul').append(this._root.ui.container).appendTo(this._view).treeview();
    },
    
    empty: function() {
        this._view.empty();
        this._initializeRoot();
    },

    get_rootNode: function() {
        return this._root;
    },
    
    set_onNodeClick: function(handler) {
        this._onNodeClick = handler;
    },
    
    set_onNodeDblClick: function(handler) {
        this._onNodeDblClick = handler;
    },
    
    set_onNodeCheckedChanged: function(handler) {
        this._onNodeCheckedChanged = handler;
    },
    
    set_onNodeRefresh: function(handler) {
        this._onNodeRefresh = handler;
    },
      
    updateNode: function(node, finishedCallback) {
        if (node.ui.container) {
            var tasksChain = new DelegatesChain(0);
            tasksChain.add(function() {
                if (node.ui.container)
                    node.ui.container.parent('ul').treeview( { add: node.ui.container } );
            });
            this._renderNode(node, tasksChain);
            // Should be for each node (right), but in this case it's performing faster and works the same, though wrong
            if (node.isChecked != null && node.isChecked != TreeNode.defaultCheckedState)
                this._nodeCheckedChanged(node, tasksChain);
            if (finishedCallback) tasksChain.add(function() { finishedCallback(tasksChain); });
            tasksChain.execute();
        } else throw("Node '" + node.text + "' is not a part of the tree.");
    },
    
    _renderNode: function(node, tasksChain) {
        if (node == this._root) {
            if (node.ui.childrenList) {
                node.ui.childrenList.remove();
                node.ui.childrenList = null;
            }
            // How can I attach child nodes and update parent?
            if (node.ui.container)
                node.ui.container.find('div.hitarea:first').remove();
        }
        if (node.ui.container) node.ui.container.empty().attr({ 'class' : node.isCollapsed ? 'closed' : '' });
            else node.ui.container = $.create('li', node.isCollapsed ? { 'class':'closed' } : null);
        node.ui.header = this._createHeader(node);
        node.ui.container.append(node.ui.header);
        // moved to updateNode(..), look at comment there
        /*if (node.isChecked != null && node.isChecked != TreeNode.defaultCheckedState)
            this._nodeCheckedChanged(node, tasksChain);*/
        
        if (node.children.length > 0) {
            // What a tree... hiddenTree! :\
            node.ui.childrenList = $.create('ul', node != this._root && node.isCollapsed ? { 'class' : 'hiddenTree' } : null);
            node.ui.container.append(node.ui.childrenList);
            
            for (var childIndex = 0; childIndex < node.children.length; ++childIndex) {
                var childNode = node.children[childIndex];
                this._renderNode(childNode, tasksChain);
                node.ui.childrenList.append(childNode.ui.container);
            }
        }
        if (node != this._root) {
            node.ui.container.append($.create('div', { 'class':'swap', 'style':'font-size:0px' }));
        }
    },
    
    _createHeader: function(node) {
        var header = $.create('div');
        node.ui.hitarea = null;
        // Checkbox
        if (node.isChecked != null) {
            node.ui.checkbox = $.create('input', { 'type' : 'checkbox', 'class' : 'box' }).appendTo(header)
                                .prop('checked', !!node.isChecked)
                                .click(function() { this._nodeCheckedChanged(node); }.bind(this));
        }
        
        node.ui.titlebar = $.create('div', { 'class' : 'node-titlebar' + (node.isChecked == null || node.isChecked ? '' : ' invisible')});
        header.append(node.ui.titlebar);
        // Custom stuff
        if (node.ui.customHeader) node.ui.titlebar.append(node.ui.customHeader);
        // Title text
        var headerText = $.create('span', {
                'class' : (node.type == 'GroundOverlay' ? 'layer' : 'groupLayer')
            }, node.text);
        if (node.isClickable) {
            headerText.click(function() { this._nodeClicked(node); }.bind(this));
            headerText.dblclick(function() { this._nodeDblClicked(node); }.bind(this));
        }
        node.ui.titlebar.append(headerText);
        // Size label
        if (node.data.size) {
            node.ui.sizeLabel = $.create('span', { 'class' : 'node-size-label' }, '[' + node.data.size + ']');
            node.ui.titlebar.append(node.ui.sizeLabel);
        }
        // Refresh button
        if (node.isRefreshable) {
            var applyButton = $('<img src="img/reload.png" class="refresh-button" alt="Обновить" title="Обновить">');
            applyButton.click(function() { this._nodeRefresh(node); }.bind(this));
            node.ui.titlebar.append(applyButton);
        }
        return header;
    },
    
    _nodeClicked: function(node) {
        if (this._onNodeClick)
            this._onNodeClick(node);
    },
    
    _nodeDblClicked: function(node) {
        if (this._onNodeDblClick)
            this._onNodeDblClick(node);
    },
    
    _nodeRefresh: function(node) {
        if (this._onNodeRefresh)
            this._onNodeRefresh(node);
    },
    
    _nodeCheckedChanged: function(node, tasksChain, isBubbling) {
        node.isChecked = (node.ui.checkbox ? node.ui.checkbox.prop('checked') : true);
        // Weird logic, as everything in this viewer (:
        //var isVisible = node.isChecked && ((node.parent && node.parent.ui.titlebar) ? !node.parent.ui.titlebar.hasClass('invisible') : true);
        node.ui.titlebar.toggleClass('invisible', !node.isChecked);
        if (this._onNodeCheckedChanged)
            this._onNodeCheckedChanged(node, tasksChain);
        if (!isBubbling) {
            this._checkChildrenRecursive(node, node.isChecked, tasksChain);
            this._checkParentsRecursive(node, tasksChain);
        }
    },
    
    _checkChildrenRecursive: function(node, checked, tasksChain) {
        for (var childKey in node.children) {
            var child = node.children[childKey];
            if (child.isChecked != checked) {
                child.ui.checkbox.prop('checked', checked);
                this._nodeCheckedChanged(child, tasksChain, true);
                this._checkChildrenRecursive(child, checked, tasksChain);
            }
        }
    },
    
    _checkParentsRecursive: function(node, tasksChain) {
        if (node.parent && !node.parent.isChecked) {
            node.parent.ui.checkbox.prop('checked', true);
            this._nodeCheckedChanged(node.parent, tasksChain, true);
            this._checkParentsRecursive(node.parent, tasksChain);
        }
    },
	
	_map: function(node, acc, callback){		
		var r = callback(node);
		if(r) {
			acc.push(r);
		}
		for(var i = 0, len = node.children.length; i < len; i++){
			var n = node.children[i];
			this._map(n, acc, callback);
		}		
	},
	
	map: function(callback){
		var acc = [];
		this._map(this._root, acc, callback);
		return acc;
	}
	
}