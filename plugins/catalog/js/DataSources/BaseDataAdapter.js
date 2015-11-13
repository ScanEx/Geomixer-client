var nsCatalog = nsCatalog || {};

(function($){

  var anchorTransform = {
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
    },
    'LS8':function(x1,y1,x2,y2,x3,y3,x4,y4){
      var _x1 = Math.min(x1, x2, x3, x4), _x4 = _x1;
      var _x2 = Math.max(x1, x2, x3, x4), _x3 = _x2;
      var _y3 = Math.min(y1, y2, y3, y4), _y4 = _y3;
      var _y1 = Math.max(y1, y2, y3, y4), _y2 = _y1;
      return [[_x1, _y1], [_x2, _y2], [_x3, _y3], [_x4, _y4]];
    }
  };

  var DataAdapter = function(map){
    this._map = map;
    this._dateRegex = /(\d{4})-(\d{2})-(\d{2})/;
    this.satellites = {
      'WV01': {platforms: ['WV01'], name: 'WorldView-1', resolution: 0.5, color: 0xff0000, checked: true, anchorTransform: anchorTransform['WV01']},
      'WV02': {platforms: ['WV02'], name: 'WorldView-2', resolution: 0.5, color: 0x800000, checked: true, anchorTransform: anchorTransform['WV02']},
      'WV03': {platforms: ['WV03'], name: 'WorldView-3', resolution: 0.5, color: 0x800000, checked: true, anchorTransform: anchorTransform['WV01']},
      'GE-1': {platforms: ['GE-1'], name: 'GeoEye-1', resolution: 0.5, color: 0x0000ff, checked: true, anchorTransform: anchorTransform['WV01']},
      'Pleiades': {platforms: ['PHR1A','PHR1B'], name: 'Pleiades A-B', resolution: 0.5, color: 0x0000ff, checked: true, anchorTransform: anchorTransform['PHR']},
      'QB02': {platforms: ['QB02'], name: 'QuickBird', resolution: 0.6, color: 0x808080, checked: true, anchorTransform: anchorTransform['WV01']},
      'EROS-A': {platforms: ['EROS-A1'], name: 'EROS-A', resolution: 0.7, color: 0x008080, checked: true, anchorTransform: anchorTransform['WV02']},
      'EROS-B': {platforms: ['EROS-B'], name: 'EROS-B', resolution: 0.7, color: 0x008080, checked: true, anchorTransform: anchorTransform['WV02']},
      'IK-2': {platforms: ['IK-2'], name: 'IKONOS', resolution: 1, color: 0x000080, checked: true, anchorTransform: anchorTransform['WV02']},
      'SP5-J': {platforms: ['SPOT 5'], name: 'SPOT 5 (J)', product: 5, resolution: 2.5, color: 0x000080, checked: true, anchorTransform: anchorTransform['WV02']},
      'SP5-A': {platforms: ['SPOT 5'], name: 'SPOT 5 (A)', product: 4, resolution: 2.5, color: 0x808080, checked: true, anchorTransform: anchorTransform['WV02']},
      'SPOT 6': {platforms: ['SPOT 6','SPOT6','SPOT 7','SPOT7'], name: 'SPOT-6,7', color: 0x006400, checked: true, anchorTransform: anchorTransform['WV02']},
      'LANDSAT_8': {platforms: ['LANDSAT_8'], name: 'LANDSAT 8', resolution: 15, color: 0x0000ff, checked: true, anchorTransform: anchorTransform['LS8']}
    };
  };

  DataAdapter.prototype = {
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
            case 'sceneid':
              a['id'] = v[i];
              break;
            case 'acqdate':
              var date = new Date(v[i] * 1000);
              a['date'] = this.dateToString(date);
              a['acqdate'] = new Date(v[i] * 1000);
              break;
            case 'cloudness':
              a['cloud_cover'] = Math.round(v[i]);
              break;
            case 'tilt':
              a['off_nadir'] = Math.round(v[i]);
              break;
            case 'geomixergeojson':
              a['geometry'] = L.gmxUtil.geometryToGeoJSON(v[i], true);
              break;
            case 'islocal':
              a['is_local'] = v[i];
              break;
            default:
              a[k] = v[i];
              break;
          }
        }.bind(this));
        return a;
      }.bind(this));
      this._moveToView(objects);
      return objects;
    },
    _moveToView(objects){
      if(objects && objects.length) {
        var centerX = this._map.getCenter().lng;
        for (var i = 0, len = objects.length; i < len; i++){
          var obj = objects[i];
          var g = obj.geometry;
          switch(g.type.toUpperCase()){
            case 'POLYGON':
            this._movePolygonToView(g.coordinates[0], centerX);
            obj.x1 += this._moveLonToView(obj.x1, centerX);
            obj.x2 += this._moveLonToView(obj.x2, centerX);
            obj.x3 += this._moveLonToView(obj.x3, centerX);
            obj.x4 += this._moveLonToView(obj.x4, centerX);
            break;
            default:
            throw 'Unsupported geometry type';
          }
        }
      }
    },
    _movePolygonToView(coordinates, viewX){
      for(var i = 0; i < coordinates.length; i++){
        coordinates[i][0] += this._moveLonToView(coordinates[i][0], viewX);
      }
    },
    _moveLonToView(x, viewX){
      var min = Math.abs(viewX - x);
      var diff = 0;
      var d = Math.abs(viewX - (x + 360));
      if(d < min){
        diff = 360;
        min = d;
      }
      if(Math.abs(viewX - (x - 360)) < min){
        diff = -360;
      }
      return diff;
    },
    _sortFolders(node) {
      node.children.sort(function (a, b) { return b.text - a.text; });
      for (var childKey in node.children) {
        node.children[childKey].children.sort(function (a, b) { return b.text - a.text; });
      }
    },
    _ensureSatelliteFolderNode(parentNode, satellite) {
      for (var nodeKey in parentNode.children) {
        var node = parentNode.children[nodeKey];
        if (node.text == satellite.name) {
          return node
        };
      }
      var newNode = this._createSatelliteNode(satellite);
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
      //newNode.isChecked = true;
      newNode.isClickable = true;
      return newNode;
    },
    _createSatelliteNode(satellite) {
      var newNode = new nsCatalog.Controls.TreeNode('satellite', satellite.name, satellite);
      newNode.data.isLoaded = true;
      //newNode.isChecked = true;
      newNode.ui.customHeader =
      $.create('div', {'class': 'colorIcon','style': 'display: inline-block;' })
      .append($.create('div', { 'class': 'borderIcon', 'style': 'border-color:#' + L.gmxUtil.dec2hex(satellite.color) })
    );
    newNode.isClickable = true;
    return newNode;
  },
  _createOverlayNode(source, dataItem) {
    var newNode = new nsCatalog.Controls.TreeNode('GroundOverlay', dataItem.id);
    newNode.data.mapObjects = {};
    newNode.data.info = this.getInfo(source, dataItem);
    newNode.data.tooltip = this.getTooltip(source, dataItem);
    newNode.data.icon = { href: this.getImageUrl(dataItem.id) };
    newNode.data.geometry = dataItem.geometry;
    newNode.data.crs = dataItem.crs;
    newNode.data.color = source.color;
    newNode.data.latLonQuad = {
      coordinates: [
        { longitude: dataItem.x1, latitude: dataItem.y1 },
        { longitude: dataItem.x2, latitude: dataItem.y2 },
        { longitude: dataItem.x3, latitude: dataItem.y3 },
        { longitude: dataItem.x4, latitude: dataItem.y4 }
      ]
    };
    newNode.data.anchors = source.anchorTransform(
      dataItem.x1,dataItem.y1,
      dataItem.x2,dataItem.y2,
      dataItem.x3,dataItem.y3,
      dataItem.x4,dataItem.y4);

      newNode.isClickable = true;
      //newNode.isChecked = true;
      return newNode;
    },
    getInfo(satellite, data){
      return ['date','id','cloud_cover'].reduce(function(a,x){
        if(data[x]){
          a[x] = data[x];
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

  DataAdapter.prototype.constructor = DataAdapter;

  nsCatalog.BaseDataAdapter = DataAdapter;

}(jQuery));
