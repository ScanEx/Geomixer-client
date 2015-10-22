SelectedImagesListController = function(view, dependencies) {
  this._view = $(view);

  this._toggler = null;
  this._contentContainer = null;
  this._btnDownloadShapeFile = null;
  this._catalogPageController = dependencies.catalogPageController;
  this._mapController = dependencies.mapController;
  this._mapObjectsHelper = dependencies.mapObjectsHelper;
  this._shapeFileController = dependencies.shapeFileController;
  this._searchResultViewController = dependencies.searchResultViewController;

  this._nodesCount = 0;
  this._nodes = {};

  this._initialize();
}

SelectedImagesListController.prototype = {
  _initialize: function() {
    var container = $(
        '<div class="selected-images">' +
            '<div class="images-search-section-header">' +
                '<span style="float:left;padding-top:2px;">Выбранные снимки</span>' +
                '<span style="float:left;padding-top:2px;padding-left:2px;width:30px;" class="selected-images-count"></span>' +
                '<img class="selected-images-download" src="img/download_icon.png" alt="Скачать SHP-файл" title="Скачать SHP-файл" />' +
                '<div class="selected-images-remove-all">Удалить все</div>' +
                '<div id="selectedImagesToggler" class="collapse-toggler expanded"></div>' +
                '<div class="clear"></div>'+
            '</div>' +
            '<div class="selected-images-content"></div>' +
        '</div>');
    this._view.append(container);

    this._toggler = container.find('#selectedImagesToggler').click(this._toggleCollapsed.bind(this));
    this._selectedImagesCountContainer = container.find('.selected-images-count');
    this._btnDownloadShapeFile = container.find('.selected-images-download').click(this._downloadShapeFile.bind(this));
    this._contentContainer = container.find('.selected-images-content');
    this._btnRemoveAll = container.find('.selected-images-remove-all').click(this._removeAll.bind(this));
    this._setEmpty();
  },

  _updateCountLabel: function() {
    if (this._nodesCount != 0) {
      this._selectedImagesCountContainer.text('(' + this._nodesCount + ')');
    }
    else  {
      this._selectedImagesCountContainer.text('');
    }
    var gs = [];
    for(var k in this._nodes){
      var d = this._nodes[k].data;
      gs.push({geometry: d.geometry, properties: d.info});
    }
    this._searchResultViewController.set_Selected(gs);
  },

  _removeAll: function() {
    if (confirm('Вы уверены, что хотите очистить список выбранных изображений?')) {
      for (var nodeKey in this._nodes) {
        this.removeNode(nodeKey, true);
      }
    }
  },

  _toggleCollapsed: function() {
    if (this._toggler.hasClass('collapsed')) {
      this._toggler.toggleClass('collapsed', false);
      this._toggler.toggleClass('expanded', true);
      this._contentContainer.show();
    } else {
      this._toggler.toggleClass('collapsed', true);
      this._toggler.toggleClass('expanded', false);
      this._contentContainer.hide();
    }
  },

  _downloadShapeFile: function() {
    // var data = {
    //   searchIds: this._getSearchSelectedIds(),
    //   catalogIds: this._getCatalogSelectedImages()
    // };
    // this._shapeFileController.downloadShapeFile('my', data);
    this._searchResultViewController._downloadShapeFile(true);
    return false;
  },

  _getSearchSelectedIds: function() {
    var ids = [];
    for (var nodeKey in this._nodes) {
      if (ScanexCatalogHelper.findSatelliteById(this._nodes[nodeKey].data.info.satName).source != 'search')
      continue;
      ids.push(this._nodes[nodeKey].data.info.id);
    }
    return ids;
  },

  _getCatalogSelectedImages: function() {
    var result = {};
    var hasImages = false;
    for (var nodeKey in this._nodes) {
      var nodeInfo = this._nodes[nodeKey].data.info;
      if (!result[nodeInfo.satName]) {
        if (ScanexCatalogHelper.findSatelliteById(nodeInfo.satName).source != 'catalog') {
          continue;
        }
        result[nodeInfo.satName] = [];
      }
      result[nodeInfo.satName].push(nodeInfo.id);
      hasImages = true;
    }
    return { empty: !hasImages, data: result };
  },

  _setEmpty: function() {
    this._contentContainer.html('<p>Нет выбранных снимков.</p>');
    this._btnRemoveAll.hide();
  },

  getSelectedNodes: function() {
    return this._nodes;
  },

  addNode: function(node) {
    if (!this._nodes[node.data.info.id]) {
      node.data.isSelected = true;
      this._createItemUi(node);
      this._appendHighlighting(node);
      this._appendItem(node.selectedUi.container);
      this._nodes[node.data.info.id] = node;
      ++this._nodesCount;
      this._updateCountLabel();
    }
    if (this._nodesCount) {
      this._btnRemoveAll.show();
    }
  },

  removeNode: function(id, hideOverlay) {
    var node = this._nodes[id];
    if (node) {
      this._doUnhighlight(id);
      this._removeHighlighting(node);
      if (!node.parent && node.data.isSelected){
        this._removeMapObjects(node);
      }
      else if (hideOverlay) {
        this._hideOverlay(node);
      }
      node.data.isSelected = false;
      node.selectedUi.container.remove();
      delete this._nodes[id];
      --this._nodesCount;
      this._updateCountLabel();
      if (!this._nodesCount) {
        this._setEmpty();
      }
    }
  },

  _hideOverlay: function(node) {
    node.data.isOverlayVisible = false;
    if (node.data.mapObjects.overlay) {
      this._mapController.removeLayer(node.data.mapObjects.overlay);
      node.data.mapObjects.overlay = null;
      this._mapController.removeLayer(node.data.mapObjects.infoIcon);
      node.data.mapObjects.infoIcon = null;
    }
  },

  _removeMapObjects: function(node) {
    var mapObjects = node.data.mapObjects;
    if (mapObjects.polygon) {
      this._mapController.removeLayer(mapObjects.polygon);
    }
    if (mapObjects.overlay) {
      this._mapController.removeLayer(mapObjects.overlay);
    }
    if (mapObjects.infoIcon) {
      this._mapController.removeLayer(mapObjects.infoIcon);
    }
    if (mapObjects.infoBalloon) {
      this._mapController.removeLayer(mapObjects.infoBalloon);
    }
  },

  _appendItem: function(itemContainer) {
    if (!this._nodesCount) {
      this._contentContainer.empty();
    }
    this._contentContainer.append(itemContainer);
  },

  _createItemUi: function(node) {
    var itemId = node.data.info.id;
    var container = $.create('div', { 'class':'item-container' })
      .mouseover(function() { this._doHighlight(itemId); }.bind(this))
      .mouseout(function() { this._doUnhighlight(itemId); }.bind(this));
    var visibilityBox = $.create('input', { 'type':'checkbox', 'class':'item-checkbox' })
      .appendTo(container)
      .prop('checked', node.isChecked)
      .prop('disabled', node.parent || !node.data.isSelected)
      .click(function() { this._itemVisibilityChange(itemId); }.bind(this));
    $.create('div', { 'class':'item-title' }, ScanexCatalogHelper.findSatelliteById(node.data.info.satName).name + ' / ' + node.data.info.id)
      .appendTo(container).dblclick(function() {
      this._itemDblClick(itemId);
      }.bind(this));
    $.create('img', { 'class':'item-remove-button', 'src':'img/closemin.png' }).click(
      function() {
      this.removeNode(itemId, true);
      }.bind(this)).appendTo(container);
    $.create('div', { 'class':'clear' }).appendTo(container);
    node.selectedUi = {
      container: container,
      checkbox: visibilityBox
    };
  },

  _itemDblClick: function(nodeId) {
    var node = this._nodes[nodeId];
    var extent = this._mapObjectsHelper.getExtent(node.data.latLonQuad.coordinates);
    this._mapController.zoomToExtent(extent.minX, extent.minY, extent.maxX, extent.maxY);
  },

  _itemVisibilityChange: function(nodeId) {
    var node = this._nodes[nodeId];
    if (!node.parent && node.data.isSelected) {
      this._catalogPageController.toggleOverlayVisibility(node);
    }
  },

  _appendHighlighting: function(node) {
    var mapObjects = node.data.mapObjects;
    if(mapObjects.polygon){
      mapObjects.polygon.on('onMouseOver', function () { this._doHighlight(node.data.info.id); }.bind(this));
      mapObjects.polygon.on('onMouseOut', function () { this._doUnhighlight(node.data.info.id); }.bind(this));
    }
    if(mapObjects.overlay){
      mapObjects.overlay.on('onMouseOver', function () { this._doHighlight(node.data.info.id); }.bind(this));
      mapObjects.overlay.on('onMouseOut', function () { this._doUnhighlight(node.data.info.id); }.bind(this));
    }
    if (mapObjects.infoIcon) {
      mapObjects.infoIcon.on('onMouseOver', function () { this._doHighlight(node.data.info.id); }.bind(this));
      mapObjects.infoIcon.on('onMouseOut', function () { this._doUnhighlight(node.data.info.id); }.bind(this));
    }
  },

  _removeHighlighting: function(node) {
    var mapObjects = node.data.mapObjects;
    if(mapObjects.polygon) {
      mapObjects.polygon.off('onMouseOver');
      mapObjects.polygon.off('onMouseOut');
    }
    if(mapObjects.overlay) {
      mapObjects.overlay.off('onMouseOver');
      mapObjects.overlay.off('onMouseOut');
    }
    if (mapObjects.infoIcon) {
      mapObjects.infoIcon.off('onMouseOver');
      mapObjects.infoIcon.off('onMouseOut');
    }
  },

  _doHighlight: function(nodeId) {
    var node = this._nodes[nodeId];
    this._highlightRow(node);
    this._highlightImage(node);
  },

  _doUnhighlight: function(nodeId) {
    var node = this._nodes[nodeId];
    this._unhighlightRow(node);
    this._unhighlightImage(node);
  },

  _highlightRow: function(node) {
    node.selectedUi.container.toggleClass('highlighted', true);
  },

  _unhighlightRow: function(node) {
    node.selectedUi.container.toggleClass('highlighted', false);
  },

  _highlightImage: function(node) {
    if(node.data.mapObjects.polygon) {
      node.data.mapObjects.polygon.setStyle({
        outline: { color: node.data.color, thickness: 2, opacity: 100 },
        fill: { color: node.data.color, opacity: 10 }
      });
    }
  },

  _unhighlightImage: function(node) {
    if(node.data.mapObjects.polygon) {
      node.data.mapObjects.polygon.setStyle({
        outline: { color: node.data.color, thickness: 1, opacity: 100 },
        fill: { opacity: 0 }
      });
    }
  },

  enableAll: function() {
    for (var nodeKey in this._nodes) {
      this._nodes[nodeKey].selectedUi.checkbox.removeAttr('disabled');
    }
  },

  mergeNodesList: function(nodesList) {
    for (var nodeKey in nodesList) {
      var node = nodesList[nodeKey];
      if (node.type == 'GroundOverlay') {
        var selectedItem = this._nodes[node.data.info.id];
        if (selectedItem) {
          this._removeMapObjects(selectedItem);
          node.selectedUi = selectedItem.selectedUi;
          node.data.isSelected = true;
          node.isChecked = true;
          node.selectedUi.checkbox.prop('disabled', true).attr('checked', node.isChecked);
          node.ui.checkbox.attr('checked', node.isChecked);
          node.ui.checkbox.click();
          if (!node.data.isOverlayVisible) {
            this._catalogPageController.toggleOverlayVisibility(node);
          }
          this._appendHighlighting(node);
          this._nodes[node.data.info.id] = node;
        }
      }
      this.mergeNodesList(node.children);
    }
  }
}
