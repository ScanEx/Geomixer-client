TreeNode = function(type, name, data) {
    this.type = type;
    this.text = name;
    this.data = data || {};
    this.children = [];
    this.parent = null;
    this.isCollapsed = true;
    this.isChecked = TreeNode.defaultCheckedState;
    this.isClickable = false;
    this.isRefreshable = false;
    
    this.ui = {
        container: null,
        header: null,
        checkbox: null,
        hitarea: null,
        sizeLabel: null,
        childrenList: null
    };
}

TreeNode.defaultCheckedState = false;

TreeNode.prototype = {
    addChild: function(childNode) {
        childNode.parent = this;
        this.children.push(childNode);
    },
    
    setChildren: function(childNodes) {
        for (var index = 0; index < childNodes.length; ++index) {
            childNodes[index].parent = this;
        }
        this.children = childNodes;
    }
}
