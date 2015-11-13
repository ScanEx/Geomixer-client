var nsCatalog = nsCatalog || {};
nsCatalog.Controls = nsCatalog.Controls || {};

(function($){

  var TreeView = function(view) {
    this._view = $(view);
    this._createRoot();
  };

  TreeView.prototype = {

    _createRoot: function() {
      this.root = new nsCatalog.Controls.TreeNode('root', 'Результаты');
      this.root.isChecked = true;
      this.root.isCollapsed = false;
      this._renderNode(this.root);
      $.create('ul').append(this.root.ui.container).appendTo(this._view).treeview();
    },

    empty: function() {
      this._view.empty();
      this._createRoot();
    },

    updateNode: function(node) {
      var def = new $.Deferred();
      if (node.ui.container) {
        var tasksChain = new nsCatalog.DelegatesChain(0);
        tasksChain.add(function() {
          if (node.ui.container) {
            node.ui.container.parent('ul').treeview({ add: node.ui.container });
          }
        });
        this._renderNode(node);
        // Should be for each node (right), but in this case it's performing faster and works the same, though wrong
        if (node.isChecked != null && node.isChecked != nsCatalog.Controls.TreeNode.defaultCheckedState) {
          this._nodeCheckedChanged(node);
        }
        tasksChain.add(function() { def.resolve(); });
        tasksChain.execute();
      } else {
        throw("Node '" + node.text + "' is not a part of the tree.");
      }
      return def;
    },

    _renderNode: function(node) {
      if (node == this.root) {
        if (node.ui.childrenList) {
          node.ui.childrenList.remove();
          node.ui.childrenList = null;
        }
        // How can I attach child nodes and update parent?
        if (node.ui.container) {
          node.ui.container.find('div.hitarea:first').remove();
        }
      }
      if (node.ui.container) {
        node.ui.container.empty().attr({ 'class' : node.isCollapsed ? 'closed' : '' });
      }
      else {
        node.ui.container = $.create('li', node.isCollapsed ? { 'class':'closed' } : null);
      }
      node.ui.header = this._createHeader(node);
      node.ui.container.append(node.ui.header);

      if (node.children.length > 0) {
        // What a tree... hiddenTree! :\
        node.ui.childrenList = $.create('ul', node != this.root && node.isCollapsed ? { 'class' : 'hiddenTree' } : null);
        node.ui.container.append(node.ui.childrenList);

        for (var childIndex = 0; childIndex < node.children.length; ++childIndex) {
          var childNode = node.children[childIndex];
          this._renderNode(childNode);
          node.ui.childrenList.append(childNode.ui.container);
        }

      }
      if (node != this.root) {
        node.ui.container.append($.create('div', { 'class':'swap', 'style':'font-size:0px' }));
      }
    },

    _createHeader: function(node) {
      var header = $.create('div');
      node.ui.hitarea = null;
      // Checkbox

      if (node.isChecked != null) {
        node.ui.checkbox =
        $.create('input', { 'type' : 'checkbox', 'class' : 'box' })
        .appendTo(header)
        .prop('checked', !!node.isChecked)
        .click(function() {
          this._nodeCheckedChanged(node);
        }.bind(this));
      }

      node.ui.titlebar = $.create('div', { 'class' : 'node-titlebar' + (node.isChecked == null || node.isChecked ? '' : ' invisible')});

      header.append(node.ui.titlebar);
      // Custom stuff
      if (node.ui.customHeader) {
        node.ui.titlebar.append(node.ui.customHeader);
      }
      // Title text
      var headerText = $.create('span', {
        'class' : (node.type == 'GroundOverlay' ? 'layer' : 'groupLayer')
      }, node.text);
      if (node.isClickable) {
        headerText.click(function() { this._nodeClicked(node); }.bind(this));
        headerText.dblclick(function() { this._nodeDblClicked(node); }.bind(this));
        headerText.on('mouseover', function() { this._nodeMouseOver(node); }.bind(this));
        headerText.on('mouseout', function() { this._nodeMouseOut(node); }.bind(this));
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
      $(this).trigger('click',[node]);
    },

    _nodeDblClicked: function(node) {
      $(this).trigger('dblclick',[node]);
    },

    _nodeMouseOver: function(node){
      $(this).trigger('mouseover',[node]);
    },

    _nodeMouseOut: function(node){
      $(this).trigger('mouseout',[node]);
    },

    _nodeRefresh: function(node) {
      $(this).trigger('refresh',[node]);
    },

    _nodeCheckedChanged: function(node, isBubbling) {
      node.isChecked = (node.ui.checkbox ? node.ui.checkbox.prop('checked') : true);
      // Weird logic, as everything in this viewer (:
      //var isVisible = node.isChecked && ((node.parent && node.parent.ui.titlebar) ? !node.parent.ui.titlebar.hasClass('invisible') : true);
      node.ui.titlebar.toggleClass('invisible', !node.isChecked);
      $(this).trigger('checked',[node]);
      if (!isBubbling) {
        this._checkChildrenRecursive(node, node.isChecked);
        this._checkParentsRecursive(node);
      }
    },

    _checkChildrenRecursive: function(node, checked) {
      for (var childKey in node.children) {
        var child = node.children[childKey];
        if (child.isChecked != checked) {
          child.ui.checkbox.prop('checked', checked);
          this._nodeCheckedChanged(child, true);
          this._checkChildrenRecursive(child, checked);
        }
      }
    },

    _checkParentsRecursive: function(node) {
      if (node.parent && !node.parent.isChecked) {
        node.parent.ui.checkbox.prop('checked', true);
        this._nodeCheckedChanged(node.parent, true);
        this._checkParentsRecursive(node.parent);
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
  		this._map(this.root, acc, callback);
  		return acc;
  	},

    getNodes: function(){
      return this.map(function(x){ return x;})
    }

  };

  nsCatalog.Controls.TreeView = TreeView;

}(jQuery));
