var nsCatalog = nsCatalog || {};

(function($){

  var DataAdapter = function(mapHelper){
    nsCatalog.BaseDataAdapter.call(this, mapHelper);
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
      var sat_name = source.name;
      var folderNode = this._ensureSatelliteFolderNode(targetNode, sat_name, L.gmxUtil.dec2hex(source.color));
      if (!satNodes[sat_name]) {
        satNodes[sat_name] = folderNode;
        folderNode.data.extent = extent;
        folderNode.data.size = 0;
      }
      folderNode.data.size += 1;
      folderNode = this._ensureFolderNode(folderNode, item.acqdate.getFullYear().toString());
      folderNode = this._ensureFolderNode(folderNode, (item.acqdate.getMonth() + 1).toString());
      folderNode.addChild(this._createOverlayNode(source, item.sceneid, item));
    }
    for (var folderKey in satNodes) {
      this._sortFolders(satNodes[folderKey]);
    }
    targetNode.isCollapsed = !targetNode.children.length;
  };

  DataAdapter.prototype.getImageUrl = function(data) {
    return 'http://wikimixer.kosmosnimki.ru/QuickLookImage.ashx?id=' + data.sceneid;
  };

  nsCatalog.InternalDataAdapter = DataAdapter;

  var DataSource = function(mapHelper, resultView){
    nsCatalog.BaseDataSource.call(this, mapHelper, resultView);
    this.id = 'internal';
    this.title = 'Сканэкс';
    this._dataAdapter = new DataAdapter(mapHelper);
    this.satellites = this._dataAdapter.satellites;
  };

  DataSource.prototype = Object.create(nsCatalog.BaseDataSource.prototype);
  DataSource.prototype.constructor = DataSource;

  DataSource.prototype.getCriteria = function(options) {
    var cr = [];
    cr.push('(cloudness IS NULL OR cloudness < 0 OR (cloudness >= 0 AND cloudness <= ' + this._cloudCoverMap[options.cloudCover - 1] + '))');
    if (options.dateStart) {
      cr.push("acqdate >= '" +  this._dataAdapter.dateToString(options.dateStart) + "'");
    }
    if (options.dateEnd) {
      cr.push("acqdate <= '" + this._dataAdapter.dateToString(options.dateEnd) + "'");
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

    var gj = this._dataAdapter.getGeometry();
    if (gj) {
      cr.push("Intersects([geomixergeojson], buffer(GeometryFromGeoJson('" + JSON.stringify(gj) + "', 4326), 0.001))");
    }

    cr.push('islocal = TRUE');

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

  nsCatalog.InternalDataSource = DataSource;
}(jQuery));
