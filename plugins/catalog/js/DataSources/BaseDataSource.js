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
      '-' + pad(this.getUTCDate())
      // 'T' + pad(this.getUTCHours()) +
      // ':' + pad(this.getUTCMinutes()) +
      // ':' + pad(this.getUTCSeconds()) +
      // '.' + (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) +
      // 'Z'
      ;
  };
    
  var DataSource = function(map, resultView){
    this._map = map;
    this._resultView = resultView;
    this.id = '';
    this.title = '';
    this.checked = true;
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
    setResults() {
      throw 'Not implemented';
    },
    getGeometry(){
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
    }
  };

  DataSource.prototype.constructor = DataSource;

  nsCatalog.BaseDataSource = DataSource;
}(jQuery));
