CatalogUrlProvider = function() {
    this._serviceUrl = //'http://dps-11.scanex.ru/w/catalog/get_json.pl';
    'http://catalog.scanex.ru/dewb/get_json.pl';
    this._cloudCoverMap = { 1:1, 2:2, 3:4, 4:5, 5:7 };
}

CatalogUrlProvider.prototype = {

	getSatellitesIDs: function(searchCriteria){
		var satellites = [];
		if(searchCriteria.scanexSatellites){
			var source = ScanexCatalogHelper.findSatelliteById(searchCriteria.scanexSatellites);
			var items = source.options.items;		
			for(var id in items){
				var sat = items[id];
				if(sat.source == 'catalog' && sat.checked){
					satellites.push(id);
				}
			}			
		}
		return satellites;
	},
	
    getPeriodSourceUrl: function(searchCriteria) {
		var dcid = this.getSatellitesIDs(searchCriteria).join(',');
        return this._serviceUrl + '?dcid=' + dcid + 
            '&do=date' +
            '&t0=' + $.datepicker.formatDate($.datepicker.ATOM, searchCriteria.dateStart) + 
            '&t1=' + $.datepicker.formatDate($.datepicker.ATOM, searchCriteria.dateEnd) +
            (searchCriteria.isYearly ? '&szn=1' : '') + 
            '&clouds=' + this._cloudCoverMap[searchCriteria.cloudCover];
    },
    
    getBoxSourceUrl: function(searchCriteria) {
		var dcid = this.getSatellitesIDs(searchCriteria).join(',');
        return this._serviceUrl + '?dcid=' + dcid + 
            '&do=bqs' +
            '&BBOX=' + searchCriteria.searchBox.join(',') +
            '&t0=' + $.datepicker.formatDate($.datepicker.ATOM, searchCriteria.dateStart) + 
            '&t1=' + $.datepicker.formatDate($.datepicker.ATOM, searchCriteria.dateEnd) +
            (searchCriteria.isYearly ? '&szn=1' : '') + 
            '&clouds=' + this._cloudCoverMap[searchCriteria.cloudCover];
    }
}