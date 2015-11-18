var nsCatalog = nsCatalog || {};

(function($){

  var DataSource = function(mapHelper, resultView){
    nsCatalog.InternalDataSource.call(this, mapHelper, resultView);
    this.id = 'external';
    this.title = 'Глобальные данные';
    this.satellites['Pleiades'].platforms = ['PHR1A','PHR1B'];
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
