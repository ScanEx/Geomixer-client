var nsCatalog = nsCatalog || {};
nsCatalog.Helpers = nsCatalog.Helpers || {};

(function($){

  var Permalink = function(pageController, mapHelper, dataSources) {
    this._pageController = pageController;
    this._searchOptionsView = this._pageController.searchOptionsView;
    this._selectedImagesView = this._pageController.selectedImagesView;
    this._mapHelper = mapHelper;
    this._dataSources = dataSources;
  };

  Permalink.prototype.toPermalink = function() {
    var nodes = this._selectedImagesView.getSelectedNodes();
    var searchCriteria = this._searchOptionsView.get_searchCriteria();
    var result = { nodes: [], searchCriteria: searchCriteria};
    var satellites = null;
    result.searchSatellites = [];
    if(searchCriteria.scanexSatellites){
      satellites = this._urlProviders['catalog'].getSatellitesIDs(searchCriteria);
      if(satellites) {
        result.searchSatellites = result.searchSatellites.concat(satellites);
      }
      satellites = this._urlProviders['search'].getSatellitesIDs(searchCriteria);
      if(satellites) {
        result.searchSatellites = result.searchSatellites.concat(satellites);
      }
    }
    if(searchCriteria.rlImages){
      satellites = this._urlProviders['rl_images'].getSatellitesIDs(searchCriteria);
      if(satellites) {
        result.rlImages = satellites;
      }
    }
    if(searchCriteria.rlSheets){
      var range = this._urlProviders['rl_sheets'].getRange(searchCriteria);
      if(range && range.length > 0) {
        result.rlSheets = range;
      }
    }
    for (var nodeKey in nodes) {
      var data = nodes[nodeKey].data;
      result.nodes.push({
        color: data.color,
        icon: data.icon,
        crs: data.crs,
        info: data.info,
        latLonQuad: data.latLonQuad,
        geometry: data.geometry,
        tooltip: data.tooltip
      });
    }
    return result;
  };
  
  Permalink.prototype.fromPermalink = function(persistedData) {
    var nodes = [];
    for (var dataKey in persistedData.nodes) {
      var dataItem = persistedData.nodes[dataKey];
      var node = new TreeNode('GroundOverlay', '[not in tree]', dataItem);
      node.data.mapObjects = {};
      node.isChecked = true;
      this._mapHelper.createPolygon(node, this._pageController._polygonClicked.bind(this._pageController));
      nodes.push(node);
    }
    for (var nodeKey in nodes) {
      var node = nodes[nodeKey];
      this._mapHelper.createGroundOverlay(node);
      this._mapHelper.createInfoIcon(node);
      node.data.isOverlayVisible = node.isChecked;
      this._selectedImagesView.addNode(node);
    }
    this._searchOptionsView.set_searchCriteria(persistedData);
  };

  Permalink.prototype.attach = function() {
    // see CatalogPlugin
  };

  Permalink.prototype.detach = function() {
    // sorry, detaching is not supported by the viewer :(
  };

  nsCatalog.Helpers.Permalink = Permalink;

}(jQuery));
