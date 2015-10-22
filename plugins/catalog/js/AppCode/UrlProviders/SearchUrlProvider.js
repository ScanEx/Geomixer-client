SearchUrlProvider = function() {
    this._serviceUrl = 'http://search.kosmosnimki.ru/QuicklooksJson.ashx';
    // this._serviceUrl = 'http://localhost:57462/QuicklooksJson.ashx';
    this._cloudCoverMap = { 1:10, 2:20, 3:35, 4:50, 5:100 };
}

SearchUrlProvider.prototype = {
	getSatellitesIDs: function(searchCriteria){
		var satellites = [];
		if(searchCriteria.scanexSatellites){
			var source = ScanexCatalogHelper.findSatelliteById(searchCriteria.scanexSatellites);
			var items = source.options.items;
			var sp5p = [];
			for(var id in items){
				var sat = items[id];
				if(sat.source == 'search' && sat.checked){
					if (sat.id == 'SPOT 5'){
						sp5p.push(sat.product);
					}
					satellites.push(sat.id);
				}
			}
			searchCriteria.spot5products = sp5p.join(',');
		}
		return satellites;
	},

  getPeriodSourceUrl: function(searchCriteria) {
    var dcid = this.getSatellitesIDs(searchCriteria).join(',');
    return this._serviceUrl +
      '?satellites=' + dcid +
      '&min_date=' + $.datepicker.formatDate($.datepicker.ATOM, searchCriteria.dateStart) +
      '&max_date=' + $.datepicker.formatDate($.datepicker.ATOM, searchCriteria.dateEnd) +
      '&max_cloud_cover=' + this._cloudCoverMap[searchCriteria.cloudCover] +
      '&every_year=' + (searchCriteria.queryType != 'all' && searchCriteria.isYearly) + '&max_off_nadir=90';
  },

	getPostParams: function(searchCriteria) {
		if (!searchCriteria.searchGeometry) return  { WrapStyle: 'message' };
    var dcid = this.getSatellitesIDs(searchCriteria).join(',');
		return {
			WrapStyle: 'message',
      satellites: dcid,
      min_date: $.datepicker.formatDate($.datepicker.ATOM, searchCriteria.dateStart),
      max_date: $.datepicker.formatDate($.datepicker.ATOM, searchCriteria.dateEnd),
      max_cloud_cover: this._cloudCoverMap[searchCriteria.cloudCover],
      every_year: (searchCriteria.queryType != 'all' && searchCriteria.isYearly),
      max_off_nadir: 60,
			geoJSON: JSON.stringify(searchCriteria.searchGeometry.length > 0 ? this._geometryToJSON(searchCriteria.searchGeometry) : this._boxToQuery(searchCriteria.searchBox)),
			archive: 'global',
			source: true,
			product: false,
			spot5products: searchCriteria.spot5products
		};
	},

	// _f: function (arr, acc, swap) {
		// if (arr.length) {
			// var r = [];
			// for (var i = 0, len = arr.length; i < len; i++) {
				// var a = arr[i];
				// if (this._f(a, acc, swap)) {
					// if (swap) {
						// r.unshift(a);
					// }
					// else {
						// r.push(a);
					// }
				// }
			// }
			// if (r.length) {
				// acc.push(r);
			// }
			// return false;
		// }
		// else {
			// return true;
		// }
	// },

	// flatten: function (arr, swap) {
		// var acc = [];
		// this._f(arr, acc, swap);
		// return acc;
	// },

  _toLinearRing: function (coordinates) {
    var len = coordinates.length;
    if (len > 0) {
      var first = coordinates[0], last = coordinates[len - 1];
      if (first[0] != last[0] || first[1] != last[1]) {
        coordinates.push(first);
      }
    }
  },

  _closePolygon: function (coordinates) {
    for (var i = 0; i < coordinates.length; i++) {
      this._toLinearRing(coordinates[i]);
    }
  },

  _closeMultiPolygon: function (coordinates) {
    for (var i = 0; i < coordinates.length; i++) {
      this._closePolygon(coordinates[i]);
    }
  },

	_geometryToJSON: function (geometryArray) {
		var geometries = $.map(geometryArray, function(geometry, index){
      switch (geometry.type.toUpperCase()) {
        case 'LINESTRING':
        case 'POLYLINE':
          return { type: 'LineString', coordinates: geometry.coordinates };
        case 'POLYGON':
          this._closePolygon(geometry.coordinates);
          return { type: 'Polygon', coordinates: geometry.coordinates };
        case 'MULTIPOLYGON':
          this._closeMultiPolygon(geometry.coordinates);
          return { type: 'MultiPolygon', coordinates: geometry.coordinates };
        case 'POINT':
          return { type: 'Point', coordinates: geometry.coordinates };
        default:
          throw 'Unsupported geometry type';
      }
    }.bind(this));

		return {
			type: 'FeatureCollection',
			features: $.map(geometries, function(g){
				return {
					type: 'Feature',
					geometry: g,
					properties: {}
				};
			})
		};
	},

  _boxToQuery: function(box) {
    return {type: 'FeatureCollection', features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [box[0],box[3]],
            [box[2],box[3]],
            [box[2],box[1]],
            [box[0],box[1]],
            [box[0],box[3]]
          ]]
        },
        properties: {}
      }
    ]};
  }
}
