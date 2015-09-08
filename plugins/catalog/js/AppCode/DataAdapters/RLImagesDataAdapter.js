RLImagesDataAdapter = function() { }

RLImagesDataAdapter.prototype = new BaseDataAdapter();

RLImagesDataAdapter.prototype.adaptTreeData = function(data, targetNode, extent, parsingFinishedHandler) {
	var satNodes = {};	
	for (var index = 0, len = data.objects ? data.objects.length : 0; index < len; ++index) {
		var item = data.objects[index];			
		if (!item) continue;
		var date = item.properties.acqdate ? this._parseDate(item.properties.acqdate) : null;
		var source = ScanexCatalogHelper.findSatelliteById('rl_images');
		var folderNode = this._ensureSatelliteFolderNode(targetNode, source);
		if (!satNodes[source.name]) {
			satNodes[source.name] = folderNode;
			folderNode.data.extent = extent;
			folderNode.data.size = 0;
		}
		folderNode.data.size += 1;
		if(date) {
			folderNode = this._ensureFolderNode(folderNode, date.year);
			folderNode = this._ensureFolderNode(folderNode, date.month);
		}		
		
		var dataItem = {
			id: item.properties.sceneid,	
			satelliteId: source.id,
			satName: source.name,
			date: item.properties.acqdate,
			geometry: item.geometry,
			filename: item.properties.filename,
			crs: 'mercator',
			x1: item.properties.ulx, y1: item.properties.uly,
			x2: item.properties.lrx, y2: item.properties.uly,
			x3: item.properties.lrx, y3: item.properties.lry,
			x4: item.properties.ulx, y4: item.properties.lry
		};
		
		if(source.infoFields && source.infoFields.length){
			for(var i = 0; i < source.infoFields.length; i++){
				var f = source.infoFields[i];
				if(item.properties[f]){
					dataItem[f] = item.properties[f];
				}
			}
		}
		
		folderNode.addChild(this._createOverlayNode(source, dataItem));
	}
	for (var folderKey in satNodes) {
		this._sortFolders(satNodes[folderKey]);
	}
	targetNode.isCollapsed = !targetNode.children.length;
	if (parsingFinishedHandler)
		parsingFinishedHandler(targetNode);
};

RLImagesDataAdapter.prototype._getImageUrl = function(dataItem) {        
	return 'http://maps.kosmosnimki.ru/GetImage.ashx?usr=michigan&img=QL2%5C' + dataItem.filename + '.jpg';
};

RLImagesDataAdapter.prototype._ensureSatelliteFolderNode = function(parentNode, source) {
	for (var nodeKey in parentNode.children) {
		var node = parentNode.children[nodeKey];
		if (node.text == source.name) return node;
	}
	var newNode = this._createSatelliteNode(source);
	parentNode.addChild(newNode);
	return newNode;
};
    
RLImagesDataAdapter.prototype._getNodeInfo = function(dataItem) {
	return {
		satName: dataItem.satName,
		id: dataItem.id,
		date: dataItem.date
	};
}