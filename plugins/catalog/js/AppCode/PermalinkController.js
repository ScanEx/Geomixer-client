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
    var selectedNodes = this._selectedImagesView.getSelectedNodes();
    var searchCriteria = this._searchOptionsView.getSearchOptions();
    var dataSources = Object.keys(this._dataSources)
      .map(function(k) { return {k: k, v: nsCatalog.DataSources[k] }; })
      .filter(function(x) { return x.v.checked; })
      .reduce(function(a, x) {
        a[x.k] = x.v.getOptions();
        return a;
      }, {});
    return {
      selectedNodes: Object.keys(selectedNodes),
      searchCriteria: {
        queryType: searchCriteria.queryType,
        dateStart: searchCriteria.dateStart.toISOString(),
        dateEnd: searchCriteria.dateEnd.toISOString(),
        isYearly: searchCriteria.isYearly,
        cloudCover: searchCriteria.cloudCover
      },
      dataSources: dataSources,
      geometries: this._mapHelper.getGeometries()
    };
  };

  Permalink.prototype.fromPermalink = function(persistedData) {
    this._searchOptionsView.setSearchOptions(persistedData);
    this._pageController._performSearch(persistedData.geometries).done(function(){
      this._pageController._treeView.getNodes().filter(function(x) {
        return x.type == 'GroundOverlay' &&
          Array.isArray(persistedData.selectedNodes) &&
          persistedData.selectedNodes.indexOf(x.data.info.sceneid) >= 0;
      }).forEach(function(x){
        this._pageController._polygonClicked(x);
      }.bind(this));
    }.bind(this));
    // var nodes = [];
    // for (var dataKey in persistedData.selectedNodes) {
    //   var dataItem = persistedData.selectedNodes[dataKey];
    //   var node = new nsCatalog.Controls.TreeNode('GroundOverlay', '[not in tree]', dataItem);
    //   node.data.mapObjects = {};
    //   node.isChecked = true;
    //   this._mapHelper.createPolygon(node, this._pageController._polygonClicked.bind(this._pageController));
    //   nodes.push(node);
    // }
    // for (var nodeKey in nodes) {
    //   var node = nodes[nodeKey];
    //   this._mapHelper.createGroundOverlay(node);
    //   this._mapHelper.createInfoIcon(node);
    //   node.data.isOverlayVisible = node.isChecked;
    //   this._selectedImagesView.addNode(node);
    // }

  };

  Permalink.prototype.attach = function() {
    // see CatalogPlugin
  };

  Permalink.prototype.detach = function() {
    // sorry, detaching is not supported by the viewer :(
  };

  nsCatalog.Helpers.Permalink = Permalink;

}(jQuery));
