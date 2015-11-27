var nsCatalog = nsCatalog || {};
nsCatalog.DataSources = nsCatalog.DataSources || {};

(function($){

  function pad(number) {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }

  Date.prototype.toISOString = function() {
    return this.getUTCFullYear() +
      '-' + pad(this.getUTCMonth() + 1) +
      '-' + pad(this.getUTCDate()) +
      'T' + pad(this.getUTCHours()) +
      ':' + pad(this.getUTCMinutes()) +
      ':' + pad(this.getUTCSeconds()) +
      '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
      'Z';
  };

  var BaseDataAdapter = function(mapHelper){
    this._mapHelper = mapHelper;
    this._dateRegex = /(\d{4})-(\d{2})-(\d{2})/;
    this.anchorTransform = {
      'WV02': function(x1,y1,x2,y2,x3,y3,x4,y4){
        return [[x1, y1], [x2, y2], [x3, y3], [x4, y4]];
      },
      'WV01': function(x1,y1,x2,y2,x3,y3,x4,y4){
        var MinX = Math.min(x1, x2, x3, x4);
        var MaxX = Math.max(x1, x2, x3, x4);
        var MinY = Math.min(y1, y2, y3, y4);
        var MaxY = Math.max(y1, y2, y3, y4);

        var sw = Math.max((MaxX - MinX), (MaxY - MinY)) / 2;
        var cx = (MaxX + MinX) / 2;
        var cy = (MaxY + MinY) / 2;
        return [[cx - sw, cy + sw], [cx + sw, cy + sw], [cx + sw, cy - sw], [cx - sw, cy - sw]];
      },
      'PHR': function(x1,y1,x2,y2,x3,y3,x4,y4){
        return [[x2, y2], [x3, y3], [x4, y4], [x1, y1]];
      }
    };
    this.satellites = {
      'WV01': {platforms: ['WV01'], name: 'WorldView-1', resolution: 0.5, color: 0xff0000, checked: true, anchorTransform: this.anchorTransform['WV01']},
      'WV02': {platforms: ['WV02'], name: 'WorldView-2', resolution: 0.5, color: 0x800000, checked: true, anchorTransform: this.anchorTransform['WV02']},
      'WV03': {platforms: ['WV03'], name: 'WorldView-3', resolution: 0.5, color: 0x800000, checked: true, anchorTransform: this.anchorTransform['WV01']},
      'GE-1': {platforms: ['GE-1','GE01'], name: 'GeoEye-1', resolution: 0.5, color: 0x0000ff, checked: true, anchorTransform: this.anchorTransform['WV01']},
      'Pleiades': {platforms: ['PHR1A','PHR1B'], name: 'Pleiades A-B', resolution: 0.5, color: 0x0000ff, checked: true, anchorTransform: this.anchorTransform['PHR']},
      'QB02': {platforms: ['QB02'], name: 'QuickBird', resolution: 0.6, color: 0x808080, checked: true, anchorTransform: this.anchorTransform['WV01']},
      'IK-2': {platforms: ['IK-2'], name: 'IKONOS', resolution: 1, color: 0x000080, checked: true, anchorTransform: this.anchorTransform['WV02']},
      'SP5-J': {platforms: ['SPOT 5'], name: 'SPOT 5 (J)', product: 5, resolution: 2.5, color: 0x000080, checked: true, anchorTransform: this.anchorTransform['WV02']},
      'SP5-A': {platforms: ['SPOT 5'], name: 'SPOT 5 (A)', product: 4, resolution: 2.5, color: 0x808080, checked: true, anchorTransform: this.anchorTransform['WV02']},
      'SPOT 6': {platforms: ['SPOT 6','SPOT6','SPOT 7','SPOT7'], name: 'SPOT-6,7', color: 0x006400, checked: true, anchorTransform: this.anchorTransform['WV02']}
    };
  };

  BaseDataAdapter.prototype = {
    getSatellite(platform){
      for (var id in this.satellites) {
        var s = this.satellites[id];
        if (s.platforms.indexOf(platform) >= 0){
          return s;
        }
      }
      return null;
    },
    dateToString(date) {
      var d = this.addPaddingZeros(date.getDate(), 2),
      m = this.addPaddingZeros(date.getMonth() + 1, 2),
      y = date.getFullYear();
      return [y, m, d].join('-');
    },
    parseDate(dateString){
      var matches = this._dateRegex.exec(dateString);
      return { year: matches[1], month: matches[2] };
    },
    addPaddingZeros(input, length){
      var withPadding = '00000000000000000000000000000000' + input;
      return withPadding.substring(withPadding.length - length);
    },
    _fromResult(result){
      var objects = result.values.map(function(v){
        var a = {};
        result.fields.map(function(k,i){
          switch (k) {
            case 'acqdate':
              a['acqdate'] = new Date(v[i] * 1000);
              break;
            case 'cloudness':
              a['cloudness'] = Math.round(v[i]);
              break;
            case 'tilt':
              a['tilt'] = Math.round(v[i]);
              break;
            case 'geomixergeojson':
              a['geometry'] = L.gmxUtil.geometryToGeoJSON(v[i], true);
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
    },
    _sortFolders(node) {
      node.children.sort(function (a, b) { return b.text - a.text; });
      for (var childKey in node.children) {
        node.children[childKey].children.sort(function (a, b) { return b.text - a.text; });
      }
    },
    _ensureSatelliteFolderNode(parentNode, nodeName, nodeColor, nodeData) {
      for (var nodeKey in parentNode.children) {
        var node = parentNode.children[nodeKey];
        if (node.text == nodeName) {
          return node
        };
      }
      var newNode = this._createSatelliteNode(nodeName, nodeColor, nodeData);
      parentNode.addChild(newNode);
      return newNode;
    },
    _ensureFolderNode(parentNode, nodeName) {
      for (var nodeKey in parentNode.children) {
        var node = parentNode.children[nodeKey];
        if (node.text == nodeName) return node;
      }
      var newNode = this._createFolderNode(nodeName);
      parentNode.addChild(newNode);
      return newNode;
    },
    _createFolderNode(name) {
      var newNode = new nsCatalog.Controls.TreeNode('Folder', name);
      newNode.isClickable = true;
      return newNode;
    },
    _createSatelliteNode(nodeName, nodeColor, nodeData) {
      var newNode = new nsCatalog.Controls.TreeNode('satellite', nodeName, nodeData);
      newNode.data.isLoaded = true;
      newNode.ui.customHeader =
        $.create('div', {'class': 'colorIcon','style': 'display: inline-block;' })
        .append($.create('div', { 'class': 'borderIcon', 'style': 'border-color:#' + nodeColor }));
      newNode.isClickable = true;
      return newNode;
    },
    _createOverlayNode(source, nodeName, nodeData) {
      var newNode = new nsCatalog.Controls.TreeNode('GroundOverlay', nodeName);
      newNode.data.mapObjects = {};
      newNode.data.info = this.getInfo(source, nodeData);
      newNode.data.tooltip = this.getTooltip(source, nodeData);
      newNode.data.icon = { href: this.getImageUrl(nodeData) };
      newNode.data.geometry = nodeData.geometry;
      newNode.data.crs = nodeData.crs;
      newNode.data.color = source.color;
      newNode.data.latLonQuad = {
        coordinates: [
          { longitude: nodeData.x1, latitude: nodeData.y1 },
          { longitude: nodeData.x2, latitude: nodeData.y2 },
          { longitude: nodeData.x3, latitude: nodeData.y3 },
          { longitude: nodeData.x4, latitude: nodeData.y4 }
        ]
      };
      newNode.data.anchors = source.anchorTransform(
        nodeData.x1,nodeData.y1,
        nodeData.x2,nodeData.y2,
        nodeData.x3,nodeData.y3,
        nodeData.x4,nodeData.y4);
        newNode.isClickable = true;
      return newNode;
    },
    setResults: function (result, targetNode, dataSourceName) {
      throw 'Not implemented';
    },
    getGeometry: function(){
      return this._mapHelper.getGeometry();
    },
    getInfo(satellite, data){
      return ['sceneid','platform','acqdate','cloudness'].reduce(function(a,x){
        if(data[x]){
          switch (x) {
            case 'acqdate':
              a[x] = data[x].toLocaleString();
              break;
            case 'platform':
              a[x] = satellite.name;
              break;
            default:
              a[x] = data[x];
              break;
          }
        }
        return a;
      },{});
    },
    getTooltip(satellite, data){
      var text = [];
      var fields = this.getInfo(satellite, data);
      for (var f in fields){
        text.push('<b>' + f + '</b>' + ': ' + fields[f]);
      }
      return text.join('<br/>');
    },
    getImageUrlfunction(){
      throw 'Not implemented';
    }
  };

  BaseDataAdapter.prototype.constructor = BaseDataAdapter;

  nsCatalog.BaseDataAdapter = BaseDataAdapter;

  var DataSource = function(mapHelper, resultView){
    this._resultView = resultView;
    this.id = '';
    this.title = '';
    this.checked = true;
    this._dataAdapter = new nsCatalog.BaseDataAdapter(mapHelper);
    this.satellites = this._dataAdapter.satellites;
    this._cloudCoverMap = [10, 20, 35, 50, 100];
  };

  DataSource.prototype = {
    getRequestOptions() {
      throw 'Not implemented';
    },
    validateSearchOptions (options, errors){
      if (this.useDate && !options.dateStart) {
        errors.push('Начальная дата поиска задана неверно.');
      }
      if (this.useDate && !options.dateEnd) {
        errors.push('Конечная дата поиска задана неверно.');
      }
      if (!options.queryType || (this.useDate && options.dateStart > options.dateEnd)) {
        errors.push('Параметры поиска заданы неверно.');
      }
      return errors.length == 0;
    },
    clearResults(){
      this._resultView.clearResults();
    },
    search(options){
      var def = new $.Deferred();
      this.clearResults();
      sendCrossDomainPostRequest(
        serverBase + 'VectorLayer/Search.ashx',
        this.getRequestOptions(options),
        function(response){
          if(response.Status == 'ok'){
            if (response.Result.Count == 0){
              def.resolve({status:'nothing'});
            }
            else if (response.Result.Count <= nsCatalog.SEARCH_LIMIT) {
              this.setResults(response.Result);
              def.resolve({status: 'ok'});
            }
            else {
              def.resolve({status: 'exceeds'});
            }
          }
          else {
            def.resolve({status: 'error', error: response.ErrorInfo});
          }
        }.bind(this));
      return def;
    },
    setResults(results) {
      var root = this._resultView.treeView.root;
      this._dataAdapter.setResults(results, root, this.title);
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
    },
    getOptions(){
      return Object.keys(this.satellites).filter(function(x){
        return this.satellites[x].checked;
      }.bind(this));
    }
  };

  DataSource.prototype.constructor = DataSource;

  nsCatalog.BaseDataSource = DataSource;
}(jQuery));
