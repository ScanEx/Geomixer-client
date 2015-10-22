MapObjectsHelper = function(mapController, treeHelper) {
  this._mapController = mapController;
  this._treeHelper = treeHelper;
	this._mapController.gmxDrawing.on('edit', this._geometryChange.bind(this));
	this._mapController.gmxDrawing.on('remove', this._geometryClear.bind(this));
	this._currentGeometries = {};
}

MapObjectsHelper.prototype = {
  _geometryChange: function(e){
  	this._currentGeometries[e.object._leaflet_id] = e.object.toGeoJSON().geometry;
  	$(this).trigger('geometry:change',[this._currentGeometries]);
  },
  _geometryClear: function(e){
  	delete this._currentGeometries[e.object._leaflet_id];
  	$(this).trigger('geometry:change',[this._currentGeometries]);
  },

  _f: function (arr, acc, swap) {
    if (arr.length) {
      var r = [];
      for (var i = 0, len = arr.length; i < len; i++) {
        var a = arr[i];
        if (this._f(a, acc, swap)) {
          if (swap) {
            r.unshift(a);
          }
          else {
            r.push(a);
          }
        }
      }
      if (r.length) {
        acc.push(r);
      }
      return false;
    }
    else {
      return true;
    }
  },

  _flatten: function (arr, swap) {
    var acc = [];
    this._f(arr, acc, swap);
    return acc;
  },

  transformAnchors: function (p) {
    switch (p.sat_name) {
        case 'WV02':
            if (p.is_local) {
                return [[p.x1, p.y1], [p.x2, p.y2], [p.x3, p.y3], [p.x4, p.y4]];
            }
            else {
                var MinX = Math.min(p.x1, p.x2, p.x3, p.x4);
                var MaxX = Math.max(p.x1, p.x2, p.x3, p.x4);
                var MinY = Math.min(p.y1, p.y2, p.y3, p.y4);
                var MaxY = Math.max(p.y1, p.y2, p.y3, p.y4);

                var sw = Math.max((MaxX - MinX), (MaxY - MinY)) / 2;
                var cx = (MaxX + MinX) / 2;
                var cy = (MaxY + MinY) / 2;
                return [[cx - sw, cy + sw], [cx + sw, cy + sw], [cx + sw, cy - sw], [cx - sw, cy - sw]];
            }
        case 'WV01':
        case 'WV03':
        case 'QB02':
            var MinX = Math.min(p.x1, p.x2, p.x3, p.x4);
            var MaxX = Math.max(p.x1, p.x2, p.x3, p.x4);
            var MinY = Math.min(p.y1, p.y2, p.y3, p.y4);
            var MaxY = Math.max(p.y1, p.y2, p.y3, p.y4);

            var sw = Math.max((MaxX - MinX), (MaxY - MinY)) / 2;
            var cx = (MaxX + MinX) / 2;
            var cy = (MaxY + MinY) / 2;
            return [[cx - sw, cy + sw], [cx + sw, cy + sw], [cx + sw, cy - sw], [cx - sw, cy - sw]];
        case 'EROS-B':
        case 'SPOT 5':
        case 'SPOT 6':
        case 'SPOT 7':
        case 'KOMPSAT3':
        case 'IK-2':
        case 'EROS-A1':
            return [[p.x1, p.y1], [p.x2, p.y2], [p.x3, p.y3], [p.x4, p.y4]];
        case 'Pleiades':
            return [[p.x2, p.y2], [p.x3, p.y3], [p.x4, p.y4], [p.x1, p.y1]];
        case 'GE01':
        case 'GE-1':
            if (p.is_local) {
                return [[p.x1, p.y1], [p.x2, p.y2], [p.x3, p.y3], [p.x4, p.y4]];
            }
            else {
                if (p.id.length == 16) {
                    var MinX = Math.min(p.x1, p.x2, p.x3, p.x4);
                    var MaxX = Math.max(p.x1, p.x2, p.x3, p.x4);
                    var MinY = Math.min(p.y1, p.y2, p.y3, p.y4);
                    var MaxY = Math.max(p.y1, p.y2, p.y3, p.y4);

                    var sw = Math.max((MaxX - MinX), (MaxY - MinY)) / 2;
                    var cx = (MaxX + MinX) / 2;
                    var cy = (MaxY + MinY) / 2;
                    return [[cx - sw, cy + sw], [cx + sw, cy + sw], [cx + sw, cy - sw], [cx - sw, cy - sw]];
                }
                else {
                    var minx = Math.min(p.x1, p.x2, p.x3, p.x4);
                    var maxx = Math.max(p.x1, p.x2, p.x3, p.x4);
                    var miny = Math.min(p.y1, p.y2, p.y3, p.y4);
                    var maxy = Math.max(p.y1, p.y2, p.y3, p.y4);

                    return [[maxx, miny], [maxx, maxy], [minx, maxy], [minx, miny]];
                }
            }
        case 'LANDSAT_8':
          var x1 = Math.min(p.x1, p.x2, p.x3, p.x4), x4 = x1;
          var x2 = Math.max(p.x1, p.x2, p.x3, p.x4), x3 = x2;
          var y3 = Math.min(p.y1, p.y2, p.y3, p.y4), y4 = y3;
          var y1 = Math.max(p.y1, p.y2, p.y3, p.y4), y2 = y1;
          return [[x1, y1], [x2, y2], [x3, y3], [x4, y4]];

        default:
          var minx = Math.min(p.x1, p.x2, p.x3, p.x4);
          var maxx = Math.max(p.x1, p.x2, p.x3, p.x4);
          var miny = Math.min(p.y1, p.y2, p.y3, p.y4);
          var maxy = Math.max(p.y1, p.y2, p.y3, p.y4);
          return [[maxx, miny], [maxx, maxy], [minx, maxy], [minx, miny]];
    }
  },

  createGroundOverlay: function(node, clickHandler) {
    var data = node.data;
    var coords = data.latLonQuad.coordinates;
    var a = this.transformAnchors({
      sat_name: data.info.sat_name,
      is_local: data.info.is_local,
      x1: coords[0].longitude, y1: coords[0].latitude,
      x2: coords[1].longitude, y2: coords[1].latitude,
      x3: coords[2].longitude, y3: coords[2].latitude,
      x4: coords[3].longitude, y4: coords[3].latitude
    });

    var g = L.gmxUtil.geometryToGeoJSON(data.geometry, data.crs == 'mercator');
    var options = {clip: this._flatten(g.coordinates, true)};

    var gOverlay = L.imageTransform(data.icon.href, this._flatten(a, true), options).addTo(this._mapController);
    gOverlay.bringToBack();
    node.data.mapObjects.overlay = gOverlay;
  },

  createInfoIcon: function(node) {
    var data = node.data;
    var coords = data.latLonQuad.coordinates;
    var a = this.transformAnchors({
      sat_name: data.info.sat_name,
      is_local: data.info.is_local,
      x1: coords[0].longitude, y1: coords[0].latitude,
      x2: coords[1].longitude, y2: coords[1].latitude,
      x3: coords[2].longitude, y3: coords[2].latitude,
      x4: coords[3].longitude, y4: coords[3].latitude
    });

    var rd = new jsts.io.GeoJSONReader();
    var g = rd.read({
      type: 'Polygon',
      coordinates: [[a[0],a[1],a[2],a[3],a[0]]]
    });
    var center = g.getCentroid();
    var infoIcon = L.marker([center.coordinate.y, center.coordinate.x], {
        icon: L.icon({
          iconUrl: 'http://maps.kosmosnimki.ru/api/catalog/img/info.png',
          iconSize: [16, 16]
        })
    }).addTo(this._mapController);

    infoIcon.bindPopup(data.tooltip);
    node.data.mapObjects.infoIcon = infoIcon;
        
  },

  createPolygon: function(node, clickHandler) {
    var data = node.data;
    var color = '#' + L.gmxUtil.dec2hex(data.color);

    var g = data.geometry;

    var	polygon = L.geoJson(L.gmxUtil.geometryToGeoJSON(g, data.crs == 'mercator'), {
      style: function (feature) {
        return {color: color, weight: 1, opacity: 1, fillColor: color, fillOpacity: 0};
      },
      onEachFeature: function (featureData, layer ) {
        layer.on('click', function () { clickHandler(node); });
      }
    })
    .addTo(this._mapController);
    node.data.mapObjects.polygon = polygon;
  },

  createPolygonGeometry: function(node) {
    var data = node.data;
    if (typeof data.color == 'undefined') {
      var satelliteInfo = this._treeHelper.getParentSatelliteInfo(node);
      data.color = satelliteInfo.color;
    }
    var g = L.gmxUtil.geometryToGeoJSON(data.geometry, data.crs == 'mercator');
    return {
      'geometry': {
        'type': data.geometry.type.toUpperCase(),
        'coordinates': g.coordinates
      }
    };
  },

  updatePolygonProperties: function(mapObject, node, clickHandler) {
    var data = node.data;
    data.mapObjects.polygon = mapObject;
    mapObject.setHandler("onClick", function() { clickHandler(node); });
    mapObject.setStyle({outline: {color: data.color, thickness: 1, opacity: 100}, fill: {color: data.color, opacity: 0}});
  },

  getExtent: function(coordinates) {
    var result = { minX:180, minY:180, maxX:-180, maxY:-180 };
    for (var i = 0; i < 4; ++i) {
      if (coordinates[i].longitude < result.minX) result.minX = coordinates[i].longitude;
      if (coordinates[i].longitude > result.maxX) result.maxX = coordinates[i].longitude;
      if (coordinates[i].latitude < result.minY) result.minY = coordinates[i].latitude;
      if (coordinates[i].latitude > result.maxY) result.maxY = coordinates[i].latitude;
    }
    return result;
  },

  _toggleOverlayVisibility: function(node) {
    node.isChecked = !node.isChecked;
    if (!node.parent && node.data.isSelected) {
      node.data.mapObjects.overlay.setVisible(node.isChecked);
      node.data.mapObjects.infoIcon.setVisible(node.isChecked);
      node.selectedUi.checkbox.prop("checked", node.isChecked);
      node.ui.checkbox.click();
    } else {
      node.ui.checkbox.prop("checked", node.isChecked);
      node.ui.checkbox.click();
    }
  },

  _getNodeBaloonText: function(node) {
    // var nodeInfo = node.data.info;
    // return 'sat_name: ' + nodeInfo.satName +
    // '<br/>Date: ' + nodeInfo.date +
    // '<br/>ID: ' + nodeInfo.id +
    // (nodeInfo.clouds ? '<br/>Clouds: ' + nodeInfo.clouds : '');
    return node.data.tooltip;
  },

  getGeometries: function(){
    return this._currentGeometries;
  },

  hasGeometries: function(){
    for (var id in this._currentGeometries){
      return true;
    }
    return false;
  },

	// style: {outline: {color: color, thickness: 1, opacity: 100}, fill: {color: color, opacity: 0}}
	createObject: function(geometry, style){
    var	mapObject = L.geoJson(geometry, {
      style: function (feature) { return style; }
    });
    this._mapController.addLayer(mapObject);
		return mapObject;
	},

  removeObject: function(layer){
    this._mapController.removeLayer(layer);
  }

}
