var nsCatalog = nsCatalog || {};

(function($){
  var anchorTransform = function(x1,y1,x2,y2,x3,y3,x4,y4){
    return [[x1, y1], [x2, y2], [x3, y3], [x4, y4]];
  };
  var DataAdapter = function(mapHelper){
    nsCatalog.BaseDataAdapter.call(this, mapHelper);
    this.satellites = {
			'RE-2': {platforms: ['RE-2'], name: 'RE-2', checked: true, color: 0x2f4f4f, anchorTransform: anchorTransform},
			'RE-3': {platforms: ['RE-3'], name: 'RE-3', checked: true, color: 0x2f4f4f, anchorTransform: anchorTransform},
			'FORMOSAT2': {platforms: ['FORMOSAT2'], name: 'FORMOSAT2', checked: true, color: 0x2f4f4f, anchorTransform: anchorTransform},
			'SPOT4': {platforms: ['SPOT4'], name: 'SPOT-4', checked: true, color: 0x2f4f4f, anchorTransform: anchorTransform},
			'SPOT5': {platforms: ['SPOT5'], name: 'SPOT-5', checked: true, color: 0x2f4f4f, anchorTransform: anchorTransform},
			'SPOT6': {platforms: ['SPOT6'], name: 'SPOT-6', checked: true, color: 0x2f4f4f, anchorTransform: anchorTransform}
    };
  };

  DataAdapter.prototype = Object.create(nsCatalog.BaseDataAdapter.prototype);
  DataAdapter.prototype.constructor = DataAdapter;
  DataAdapter.prototype._fromResult = function (result) {
    var objects = result.values.map(function(v){
      var a = {};
      result.fields.map(function(k,i){
        switch (k) {
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
    this._mapHelper.moveToView(objects);
    return objects;
  };

  DataAdapter.prototype.setResults = function(result, targetNode, extent) {
    var satNodes = {};
    var data = this._fromResult(result);
  	for (var i = 0, len = data.length; i < len; i++) {
  		var item = data[i];
  		if (!item) continue;
  		var date = new Date(item.acqdate + 'T' + item.acqtime);
      item['date'] = date;
  		var source = this.getSatellite(item.platform);
  		var folderNode = this._ensureSatelliteFolderNode(targetNode, source.name, L.gmxUtil.dec2hex(source.color), source);
  		if (!satNodes[source.name]) {
  			satNodes[source.name] = folderNode;
  			folderNode.data.extent = extent;
  			folderNode.data.size = 0;
  		}
  		folderNode.data.size += 1;
  		if(date) {
  			folderNode = this._ensureFolderNode(folderNode, date.getFullYear().toString());
  			folderNode = this._ensureFolderNode(folderNode, (date.getMonth() + 1).toString());
  		}
  		folderNode.addChild(this._createOverlayNode(source, item.sceneid, item));
  	}
  	for (var folderKey in satNodes) {
  		this._sortFolders(satNodes[folderKey]);
  	}
  	targetNode.isCollapsed = !targetNode.children.length;
  };

  DataAdapter.prototype.getInfo = function(satellite, data) {
    var info = ['sceneid','acqdate','acqtime','sensor','tilt','sunelev','resolution','product','contract'].reduce(function(a,x){
      if(data[x]){
        a[x] = data[x];
      }
      return a;
    },{});
    info['platform'] = satellite.name;
    return info;
  };

  DataAdapter.prototype.getImageUrl = function(data) {
    return 'http://maps.kosmosnimki.ru/GetImage.ashx?usr=michigan&img=QL2%5C' + data.filename + '.jpg';
  };

  nsCatalog.RLImagesDataAdapter = DataAdapter;

  var DataSource = function(mapHelper, resultView){
    nsCatalog.BaseDataSource.call(this, mapHelper, resultView);
    this.id = 'rl_images';
    this.title = 'РЛИ-снимки';
    this._dataAdapter = new DataAdapter(mapHelper);
    this.satellites = this._dataAdapter.satellites;
  };

  DataSource.prototype = Object.create(nsCatalog.BaseDataSource.prototype);
  DataSource.prototype.constructor = DataSource;

  DataSource.prototype.getCriteria = function(options) {
    var cr = [];
    cr.push('(clouds IS NULL OR clouds < 0 OR (clouds >= 0 AND clouds <= ' + this._cloudCoverMap[options.cloudCover - 1] + '))');
    if (options.dateStart) {
      cr.push("acqdate >= '" + this._dataAdapter.dateToString(options.dateStart) + "'");
    }
    if (options.dateEnd) {
      cr.push("acqdate <= '" + this._dataAdapter.dateToString(options.dateEnd) + "'");
    }

    var sat = [];
    for (var sat_id in this.satellites) {
      var s = this.satellites[sat_id];
      if(s.checked){
        for (var i = 0; i < s.platforms.length; i++){
          sat.push("platform = '" + s.platforms[i] + "'");
        }
      }
    }

    cr.push("(" + sat.join(" OR ") + ")");

    var gj = this._dataAdapter.getGeometry();
    if (gj) {
      cr.push("Intersects([geomixergeojson], buffer(GeometryFromGeoJson('" + JSON.stringify(gj) + "', 4326), 0.001))");
    }

    return cr.join(' AND ');
  };

  DataSource.prototype.getRequestOptions = function(options) {
    return {
      WrapStyle: 'message',
      layer: '9B87EC9626D24B9D8311AFCAF046105C',
      satelliteId: 'rl_images',
      geometry: true,
      pagesize: nsCatalog.SEARCH_LIMIT + 1,
      count: 'add',
      query: this.getCriteria(options)
    };
  };

  nsCatalog.RLImagesDataSource = DataSource;

}(jQuery));
