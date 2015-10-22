BaseDataAdapter = function () {
    this._dateRegex = /(\d{4})-(\d{2})-(\d{2})/;
}

BaseDataAdapter.prototype = {
    _sortFolders: function(node) {
        node.children.sort(function (a, b) { return b.text - a.text; });
        for (var childKey in node.children) {
            node.children[childKey].children.sort(function (a, b) { return b.text - a.text; });
        }
    },
    
    _ensureSatelliteFolderNode: function(parentNode, satellite) {		
        for (var nodeKey in parentNode.children) {
            var node = parentNode.children[nodeKey];
            if (node.text == satellite.name) return node;
        }
        var newNode = this._createSatelliteNode(satellite);
        parentNode.addChild(newNode);
        return newNode;
    },
    
    _ensureFolderNode: function(parentNode, nodeName) {
        for (var nodeKey in parentNode.children) {
            var node = parentNode.children[nodeKey];
            if (node.text == nodeName) return node;
        }
        var newNode = this._createFolderNode(nodeName);
        parentNode.addChild(newNode);
        return newNode;
    },
    
    _parseDate: function(dateString) {
        var matches = this._dateRegex.exec(dateString);
        return { year: matches[1], month: matches[2] };
    },
    
    _createFolderNode: function(name) {
        var newNode = new TreeNode('Folder', name);
        //newNode.isChecked = true;
        newNode.isClickable = true;
        return newNode;
    },
    
    _createSatelliteNode: function(satellite) {        
        var newNode = new TreeNode('satellite', satellite.name, satellite);
        newNode.data.isLoaded = true;
        //newNode.isChecked = true;
        newNode.ui.customHeader = $.create('div', 
                { 'class' : 'colorIcon', 
                  'style' : 'display: inline-block;' })
        .append(
            $.create('div', 
                { 'class' : 'borderIcon',
                  'style' : 'border-color:#' + this._intToHtmlColor(satellite.color) }
            )
        );
        newNode.isClickable = true;
        return newNode;
    },
    
    _intToHtmlColor: function(intColor) {
        var withPadding = '000000' + intColor.toString(16);
        return withPadding.substring(withPadding.length-6);
    },
    
    _createOverlayNode: function(source, dataItem) {
        var newNode = new TreeNode('GroundOverlay', dataItem.id);
        newNode.data.mapObjects = {};
        newNode.data.info = this._getInfo(source, dataItem);
		newNode.data.tooltip = this._getBaloonText(source, dataItem);
        newNode.data.icon = { href: this._getImageUrl(dataItem) };
		newNode.data.geometry = dataItem.geometry;
		newNode.data.crs = dataItem.crs;
        newNode.data.latLonQuad = {
            coordinates: [
                { longitude: dataItem.x1, latitude: dataItem.y1 },
                { longitude: dataItem.x2, latitude: dataItem.y2 },
                { longitude: dataItem.x3, latitude: dataItem.y3 },
                { longitude: dataItem.x4, latitude: dataItem.y4 }
            ]
        };
        newNode.isClickable = true;
        //newNode.isChecked = true;
        return newNode;
    },
    
    _getImageUrl: function(dataItem) {
        // Should be overriden in derived
        return null;
    },
    
	_getNodeInfo: function (dataItem){
		// Should be overriden in derived		
		return null;
	},
	
    _getInfo: function(source, dataItem) {
        
		var defaultFields = ['date','id'];
		var info = {};
		for (var i = 0, len = defaultFields.length; i < len; i++){
			var f = defaultFields[i];
			if(dataItem[f]){				
				info[f] =dataItem[f];
			}
		}
		if(source.infoFields && source.infoFields.length){
			for (var i = 0, len = source.infoFields.length; i < len; i++){
				var f = source.infoFields[i];
				if(dataItem[f]){
					info[f] =dataItem[f];
				}
			}
		}				
        return info;
    },
			
	_getBaloonText: function(source, dataItem){		
		var text = [];		
		var fields = this._getInfo(source, dataItem);
		for (var f in fields){
			text.push('<b>' + f + '</b>' + ': ' + fields[f]);
		}		
		return text.join('<br/>');
	}
}