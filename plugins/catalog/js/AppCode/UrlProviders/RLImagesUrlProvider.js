RLImagesUrlProvider = function() {    
}

RLImagesUrlProvider.prototype = {  
	getSatellitesIDs: function(searchCriteria){
		var opts = [];
		if(searchCriteria.rlImages){
			var source = ScanexCatalogHelper.findSatelliteById(searchCriteria.rlImages);							
			if(source.id != 'unknown' && source.options && source.options.items){					
				var opts = [];
				for(var id in source.options.items){
					var opt = source.options.items[id];
					if(opt.checked){
						opts.push(id);
					}						
				}				
			}
		}
		return opts;
	},
	getRequestOptions: function(searchCriteria){			
		if(searchCriteria.rlImages){
			var source = ScanexCatalogHelper.findSatelliteById(searchCriteria.rlImages);
			if(source.id != 'unknown'){
				var q = [];
				if(source.useDate){
					q.push("(acqdate >= '" + $.datepicker.formatDate($.datepicker.ATOM, searchCriteria.dateStart) + "' AND acqdate <= '" + $.datepicker.formatDate($.datepicker.ATOM, searchCriteria.dateEnd) + "')");
				}
				if(source.options && source.options.items){					
					var opts = [];
					for(var id in source.options.items){
						var opt = source.options.items[id];
						if(opt.checked){
							opts.push("platform = '" + id + "'");
						}						
					}
					if(opts.length){
						q.push('(' + opts.join(' OR ') + ')');
					}
				}
				if(searchCriteria.searchGeometry && searchCriteria.searchGeometry.length){
					var g = [];
					for(var j = 0, len = searchCriteria.searchGeometry.length; j < len; j++){
						g.push('(intersects([geomixergeojson], GeometryFromGeoJson(\'' + JSON.stringify(searchCriteria.searchGeometry[j]) + '\', 4326)))');
					}
					q.push(g.join(' OR '));
				}
				else{
					q.push('intersects([geomixergeojson], GeometryFromGeoJson(\'' + JSON.stringify(this._boxToQuery(searchCriteria.searchBox)) + '\', 4326))');
				}				
			}
			return {
				layerName: source.layerId,
				includeGeometry: true,
				satelliteId: source.id,					
				query: q.join(' AND ')
			};
		}
		return null;
	},  
    
    _boxToQuery: function(box) {
        return { 
			type: 'POLYGON',
			coordinates: [[
				[box[0],box[3]],
				[box[2],box[3]],
				[box[2],box[1]],
				[box[0],box[1]],
				[box[0],box[3]]
			]]
		};
	}
}