var nsCatalog = nsCatalog || {};

(function($){

  var DataAdapter = function(map){
    nsCatalog.BaseDataAdapter.call(this, map);
  };

  DataAdapter.prototype = Object.create(nsCatalog.BaseDataAdapter.prototype);
  DataAdapter.prototype.constructor = DataAdapter;

  DataAdapter.prototype.setResults = function(result, targetNode, extent) {
    var data = this._fromResult(result);
    var satNodes = {};
    for (var index = 0; index < data.length; ++index) {
      var item = data[index];
      if (!item) continue;
      var source = this.getSatellite(item.platform);
      var folderNode = this._ensureSatelliteFolderNode(targetNode, source);
      if (!satNodes[item.platform]) {
        satNodes[item.platform] = folderNode;
        folderNode.data.extent = extent;
        folderNode.data.size = 0;
      }
      folderNode.data.size += 1;
      folderNode = this._ensureFolderNode(folderNode, item.acqdate.getFullYear().toString());
      folderNode = this._ensureFolderNode(folderNode, (item.acqdate.getMonth() + 1).toString());
      folderNode.addChild(this._createOverlayNode(source, item));
    }
    for (var folderKey in satNodes) {
      this._sortFolders(satNodes[folderKey]);
    }
    targetNode.isCollapsed = !targetNode.children.length;
  };

  DataAdapter.prototype.getInfo = function(satellite, data) {
    var info = nsCatalog.BaseDataAdapter.prototype.getInfo(satellite, data);
    info.sat_name = satellite.name;
    return info;
  };

  DataAdapter.prototype.getImageUrl = function(sceneid) {
    return 'http://wikimixer.kosmosnimki.ru/QuickLookImage.ashx?id=' + sceneid;
  };

  var DataSource = function(map, resultView){
    nsCatalog.BaseDataSource.call(this, map, resultView);
    this.id = 'internal';
    this.title = 'Сканэкс';
    this.useDate = true;
    this._dataAdapter = new DataAdapter(map);
    this.satellites = this._dataAdapter.satellites;
  };

  DataSource.prototype = Object.create(nsCatalog.BaseDataSource.prototype);
  DataSource.prototype.constructor = DataSource;

  DataSource.prototype.getCriteria = function(options) {
    var cr = [];
    cr.push('(cloudness IS NULL OR cloudness < 0 OR (cloudness >= 0 AND cloudness <= ' + options.cloudCover + '))');
    if (options.dateStart) {
      cr.push("acqdate >= '" + options.dateStart.toISOString() + "'");
    }
    if (options.dateEnd) {
      cr.push("acqdate <= '" + options.dateEnd.toISOString() + "'");
    }

    var sat = [];
    for (var sat_id in this.satellites) {
      var s = this.satellites[sat_id];
      if(s.checked){
        switch (sat_id) {
          case 'SP5-A':
            sat.push("platform = 'SPOT 5' AND sensor = 'A' AND spot5_b_exists = TRUE");
            break;
          case 'SP5-J':
            sat.push("platform = 'SPOT 5' AND sensor = 'J' AND spot5_a_exists = TRUE AND spot5_b_exists = TRUE");
            break;
          default:
            sat.push("platform IN ('" + s.platforms.join("','") + "')")
            break;
        }
      }
    }

    cr.push("(" + sat.join(' OR ') + ")");

    var gj = this.getGeometry(this._map);
    if (gj) {
      cr.push("Intersects([geomixergeojson], buffer(GeometryFromGeoJson('" + JSON.stringify(gj) + "', 4326), 0.001))");
    }

    cr.push('islocal = TRUE');

    // if (options.product) {
    //   cr.push("product = TRUE");
    // }
    // else if (options.source) {
    //   cr.push("product = FALSE");
    // }

    return cr.join(' AND ');
  };

  DataSource.prototype.getRequestOptions = function(options) {
    return {
      WrapStyle: 'message',
      layer: 'AFB4D363768E4C5FAC71C9B0C6F7B2F4',
      orderby: 'acqdate',
      orderdirection: 'desc',
      geometry: true,
      pagesize: nsCatalog.SEARCH_LIMIT + 1,
      count: 'add',
      query: this.getCriteria(options)
    };
  };

  DataSource.prototype.setResults = function(results) {
    var root = this._resultView.treeView.root;
    this._dataAdapter.setResults(results, root);
    this._resultView.treeView.updateNode(root).done(function(){
      var nodes = this._resultView
        .treeView
        .getNodes()
        .filter(function(x) { return x.type == 'GroundOverlay'; });
      if(results.Count > 0){
        this._resultView._disableGeometryOperations(false);
        this._resultView.show();
      }
      else {
        this._resultView._disableGeometryOperations(true);
        this._resultView.hide();
      }
    }.bind(this));
  };

  nsCatalog.InternalDataSource = DataSource;
}(jQuery));
