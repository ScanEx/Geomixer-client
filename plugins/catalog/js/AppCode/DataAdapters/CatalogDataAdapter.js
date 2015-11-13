CatalogDataAdapter = function() { }

CatalogDataAdapter.prototype = new BaseDataAdapter();

CatalogDataAdapter.prototype.adaptTreeData =
function(data, targetNode, extent, parsingFinishedHandler) {
  var satNodes = {};
  var tt = {};
  for (var index = 0; index < data.length; ++index) {
    var item = data[index];
    if (!tt[item.sat_name]) tt[item.sat_name] = [];
    tt[item.sat_name].push(item.id);
    if (!item) continue;
    var date = this._parseDate(item.date);
    var source = ScanexCatalogHelper.findSatelliteById('scanex', item.sat_name, item.prod_order);
    var folderNode = this._ensureSatelliteFolderNode(targetNode, source);
    if (!satNodes[source.name]) {
      satNodes[source.name] = folderNode;
      folderNode.data.extent = extent;
      folderNode.data.size = 0;
    }
    folderNode.data.size += 1;
    folderNode = this._ensureFolderNode(folderNode, date.year);
    folderNode = this._ensureFolderNode(folderNode, date.month);

    item.satelliteId = source.name;
    item.satName = source.name;
    item.geometry = {
      type: 'POLYGON',
      coordinates: [[[item.x1, item.y1],[item.x2, item.y2],[item.x3, item.y3],[item.x4, item.y4],[item.x1, item.y1]]]
    };
    folderNode.addChild(this._createOverlayNode(source, item));
  }
  for (var folderKey in satNodes) {
    this._sortFolders(satNodes[folderKey]);
  }
  targetNode.isCollapsed = !targetNode.children.length;
  if (parsingFinishedHandler)
  parsingFinishedHandler(targetNode);
};

CatalogDataAdapter.prototype._getImageUrl =
function(dataItem) {
  return dataItem.url;
};

CatalogDataAdapter.prototype._getNodeInfo =
function(dataItem) {
  return {
    satName: dataItem.sat_name,
    id: dataItem.id,
    date: dataItem.date,
    clouds: dataItem.clouds + '/7'
  };
}
