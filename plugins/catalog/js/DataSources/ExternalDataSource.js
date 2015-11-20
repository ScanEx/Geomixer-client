var nsCatalog = nsCatalog || {};

(function($){

  var DataSource = function(mapHelper, resultView){
    nsCatalog.InternalDataSource.call(this, mapHelper, resultView);
    this.id = 'external';
    this.title = 'Глобальные данные';
    this.anchorTransform = {
      'LS_8': function(x1,y1,x2,y2,x3,y3,x4,y4){
        var _x1 = Math.min(x1, x2, x3, x4), _x4 = _x1;
        var _x2 = Math.max(x1, x2, x3, x4), _x3 = _x2;
        var _y3 = Math.min(y1, y2, y3, y4), _y4 = _y3;
        var _y1 = Math.max(y1, y2, y3, y4), _y2 = _y1;
        return [[_x1, _y1], [_x2, _y2], [_x3, _y3], [_x4, _y4]];
      },
      'RE': function(x1,y1,x2,y2,x3,y3,x4,y4){
        return [[x1, y1], [x2, y2], [x3, y3], [x4, y4]];
      }
    };
    delete this.satellites['EROS-A'];
    delete this.satellites['EROS-B'];
    this.satellites['Pleiades'].platforms = ['PHR1A','PHR1B'];
    this.satellites['LANDSAT_8'] = {
      platforms: ['LANDSAT_8'], name: 'LANDSAT 8',
      resolution: 15, color: 0x0000ff, checked: true,
      anchorTransform: this.anchorTransform['LS_8']
    };
    // this.satellites['RE'] = {
    //   platforms: ['RE'], name: 'RapidEye',
    //   resolution: 15, color: 0xff4500, checked: true,
    //   anchorTransform: this.anchorTransform['RE']
    // };
  };

  DataSource.prototype = Object.create(nsCatalog.InternalDataSource.prototype);
  DataSource.prototype.constructor = DataSource;

  DataSource.prototype.getCriteria = function(options) {
    var cr = [];
    cr.push('(cloudness IS NULL OR cloudness < 0 OR (cloudness >= 0 AND cloudness <= ' + this._cloudCoverMap[options.cloudCover - 1] + '))');
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

    cr.push('islocal = FALSE');

    return cr.join(' AND ');
  };

  nsCatalog.ExternalDataSource = DataSource;

}(jQuery));
