var nsCatalog = nsCatalog || {};

(function($){
  var anchorTransform = function(x1,y1,x2,y2,x3,y3,x4,y4){
    return [[x1, y1], [x2, y2], [x3, y3], [x4, y4]];
  };

  var DataAdapter = function(mapHelper){
    nsCatalog.RLImagesDataAdapter.call(this, mapHelper);
  };

  DataAdapter.prototype = Object.create(nsCatalog.BaseDataAdapter.prototype);
  DataAdapter.prototype.constructor = DataAdapter;
  DataAdapter.prototype._fromResult = function (result) {
    var objects = result.values.map(function(v){
      var a = {};
      result.fields.map(function(k,i){
        switch (k) {
          case 'filename':
            a['sceneid'] = v[i];
            a['filename'] = v[i];
            break;
          case 'clouds':
            a['cloudness'] = Math.round(v[i]);
            break;
          case 'viewangle':
            a['tilt'] = Math.round(v[i]);
            break;
          case 'geomixergeojson':
            a['geometry'] = L.gmxUtil.geometryToGeoJSON(v[i], true);
            break;
          case 'ulx':
            a['x1'] = v[i];
            a['x4'] = v[i];
            break;
          case 'uly':
            a['y1'] = v[i];
            a['y2'] = v[i];
            break;
          case 'lrx':
            a['x2'] = v[i];
            a['x3'] = v[i];
            break;
          case 'lry':
            a['y3'] = v[i];
            a['y4'] = v[i];
            break;
          default:
            a[k] = v[i];
            break;
        }
      }.bind(this));
      return a;
    }.bind(this));
    // this._moveToView(objects);
    return objects;
  };

  DataAdapter.prototype.setResults = function(result, targetNode, dataSourceName) {
    var satNodes = {};
    var data = this._fromResult(result);
  	for (var i = 0, len = data.length; i < len; i++) {
  		var item = data[i];
  		if (!item) continue;
  		var source = nsCatalog.DataSources.RLSheetsDataSource;
      var year = item.year ? item.year.toString() : 'Год не указан';
  		var folderNode = this._ensureSatelliteFolderNode(targetNode, source.title, L.gmxUtil.dec2hex(source.color));
  		if (!satNodes[source.title]) {
  			satNodes[source.title] = folderNode;
  			// folderNode.data.extent = extent;
  			folderNode.data.size = 0;
  		}
  		folderNode.data.size += 1;
  		folderNode = this._ensureFolderNode(folderNode, year);
  		folderNode.addChild(this._createOverlayNode(source, item.filename, item));
  	}
  	for (var folderKey in satNodes) {
  		this._sortFolders(satNodes[folderKey]);
  	}
  	targetNode.isCollapsed = !targetNode.children.length;
  };

  DataAdapter.prototype.getInfo = function(satellite, data) {
    var info = ['sceneid','scale','year','type','contract'].reduce(function(a,x){
      if(data[x]){
        a[x] = data[x];
      }
      return a;
    },{});
    info['platform'] = satellite.title;
    return info;
  };

  DataAdapter.prototype.getImageUrl = function(data) {
    return 'http://maps.kosmosnimki.ru/GetImage.ashx?usr=michigan&img=sheets%5C' + data.filename + '.jpg';
  };

  var DataSource = function(map, resultView){
    nsCatalog.RLImagesDataSource.call(this, map, resultView);
    this._dataAdapter = new DataAdapter(map);
    this.id = 'rl_sheets';
    this.title = 'РЛИ-карты';
    this.range = [];
    this.initial = 1990;
    this.color = 0xdc143c;
    this.satellites = null;
  };

  DataSource.prototype = Object.create(nsCatalog.RLImagesDataSource.prototype);
  DataSource.prototype.constructor = DataSource;

  DataSource.prototype.getCriteria = function(options) {
    var cr = [];
    cr.push('(clouds IS NULL OR clouds < 0 OR (clouds >= 0 AND clouds <= ' + this._cloudCoverMap[options.cloudCover - 1] + '))');
    switch(this.range.length){
      case 1:
        cr.push("([year] = " + this.range[0] + ")");
        break;
      case 2:
        var min = Math.min.apply(null, this.range),
          max = Math.max.apply(null, this.range);
        cr.push("([year] >= " + min + " AND [year] <= " + max + ")");
        break;
      default:
        break;
    }

    var gj = this._mapHelper.getGeometry();
    if (gj) {
      cr.push("Intersects([geomixergeojson], buffer(GeometryFromGeoJson('" + JSON.stringify(gj) + "', 4326), 0.001))");
    }

    return cr.join(' AND ');
  };

  DataSource.prototype.getRequestOptions = function(options) {
    return {
      WrapStyle: 'message',
      layer: '466F5E8A052148FDA0D45133F0F64124',
      satelliteId: 'rl_sheets',
      geometry: true,
      pagesize: nsCatalog.SEARCH_LIMIT + 1,
      count: 'add',
      query: this.getCriteria(options)
    };
  };

  DataSource.prototype.anchorTransform = function(x1,y1,x2,y2,x3,y3,x4,y4){
    return [[x1, y1], [x2, y2], [x3, y3], [x4, y4]];
  };

  nsCatalog.RLSheetsDataSource = DataSource;
}(jQuery));
