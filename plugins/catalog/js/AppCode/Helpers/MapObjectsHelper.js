var nsCatalog = nsCatalog || {};
nsCatalog.Helpers = nsCatalog.Helpers || {};

(function($){
  
  var MapHelper = function(map, treeHelper) {
    this._map = map;
    this._treeHelper = treeHelper;
  	this._currentGeometries = {};
  };

  MapHelper.prototype = {

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

    createGroundOverlay: function(node, clickHandler) {
      var data = node.data;
      var a = data.anchors;
      var g = L.gmxUtil.geometryToGeoJSON(data.geometry, data.crs == 'mercator');
      var options = {clip: this._flatten(g.coordinates, true)};
      var gOverlay = L.imageTransform(data.icon.href, this._flatten(a, true), options).addTo(this._map);
      gOverlay.bringToBack();
      node.data.mapObjects.overlay = gOverlay;
    },

    createInfoIcon: function(node) {
      var data = node.data;
      var a = data.anchors;
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
      }).addTo(this._map);

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
      .addTo(this._map);
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

    getGeometries: function(){
      return this._map.gmxDrawing.getFeatures().map(function(x) { return x.toGeoJSON().geometry; });
    },

    hasGeometries: function(){
      return this.getGeometries().length > 0;
    },

    getGeometry: function (){
      var gs = this._map.gmxDrawing.getFeatures().reduce(function(a, f){
        a.push(f.toGeoJSON().geometry);
        return a;
      }, []);
      var bounds = this._map.getBounds();
      var nw = bounds.getNorthWest(),
        ne = bounds.getNorthEast(),
        se = bounds.getSouthEast(),
        sw = bounds.getSouthWest();
      var x1 = nw.lng, y1 = nw.lat,
        x2 = ne.lng, y2 = ne.lat,
        x3 = se.lng, y3 = se.lat,
        x4 = sw.lng, y4 = sw.lat;
      return {
        type: 'GeometryCollection',
        geometries: gs.length > 0 ? gs :
          [
            {
              type: 'Polygon',
              coordinates: [[[x1,y1],[x2,y2],[x3,y3],[x4,y4],[x1,y1]]]
            }
          ]
      };
    },

    moveToView: function(objects) {
      if(objects && objects.length) {
        var centerX = this._map.getCenter().lng;
        for (var i = 0, len = objects.length; i < len; i++){
          var obj = objects[i];
          var g = obj.geometry;
          switch(g.type.toUpperCase()){
            case 'POLYGON':
            case 'MULTIPOLYGON':
              this.movePolygonToView(g.coordinates[0], centerX);
              obj.x1 += this.moveLonToView(obj.x1, centerX);
              obj.x2 += this.moveLonToView(obj.x2, centerX);
              obj.x3 += this.moveLonToView(obj.x3, centerX);
              obj.x4 += this.moveLonToView(obj.x4, centerX);
              break;
            default:
              throw 'Unsupported geometry type';
          }
        }
      }
    },

    movePolygonToView: function (coordinates, viewX){
      for(var i = 0; i < coordinates.length; i++){
        coordinates[i][0] += this.moveLonToView(coordinates[i][0], viewX);
      }
    },

    moveLonToView: function(x, viewX){
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

  	// style: {outline: {color: color, thickness: 1, opacity: 100}, fill: {color: color, opacity: 0}}
  	createObject: function(geometry, style){
      var	mapObject = L.geoJson(geometry, {
        style: function (feature) { return style; }
      });
      this._map.addLayer(mapObject);
  		return mapObject;
  	},

    removeObject: function(layer){
      this._map.removeLayer(layer);
    }
  };

  nsCatalog.Helpers.MapHelper = MapHelper;

}(jQuery));
