var nsCatalog = nsCatalog || {};

(function($){

  var DataSource = function(map, resultView){
    nsCatalog.InternalDataSource.call(this, map, resultView);
    this.id = 'external';
    this.title = 'Глобальные данные';
    this.satellites['Pleiades'].platforms = ['PHR1A','PHR1B'];
  };

  DataSource.prototype = Object.create(nsCatalog.InternalDataSource.prototype);
  DataSource.prototype.constructor = DataSource;

  DataSource.prototype.getCriteria = function(options) {
    var cr = [];
    cr.push('(cloudness IS NULL OR cloudness < 0 OR (cloudness >= 0 AND cloudness <= ' + options.cloudCover + '))');
    if (options.dateStart) {
      cr.push("acqdate >= '" + options.dateStart.toISOString() + "'");
    }
    if (options.dateEnd) {
      cr.push("acqdate <= '" + options.dateEnd.toISOString() + "'");
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

    var gj = this.getGeometry(this._map);
    if (gj) {
      cr.push("Intersects([geomixergeojson], buffer(GeometryFromGeoJson('" + JSON.stringify(gj) + "', 4326), 0.001))");
    }

    cr.push('islocal = FALSE');

    // if (options.product) {
    //   cr.push("product = TRUE");
    // }
    // else if (options.source) {
    //   cr.push("product = FALSE");
    // }

    return cr.join(' AND ');
  };

  nsCatalog.ExternalDataSource = DataSource;

}(jQuery));
