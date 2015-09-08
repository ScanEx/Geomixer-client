RLSheetsUrlProvider = function() {    
}

RLSheetsUrlProvider.prototype = {  
	getRange: function(searchCriteria){
		var opts = [];
		if(searchCriteria.rlSheets){
			var source = ScanexCatalogHelper.findSatelliteById(searchCriteria.rlSheets);							
			if(source.id != 'unknown' && source.options && source.options.range){									
				return 	source.options.range;
			}			
		}
		return [];
	},
	getRequestOptions: function(searchCriteria){			
		if(searchCriteria.rlSheets){
			var source = ScanexCatalogHelper.findSatelliteById(searchCriteria.rlSheets);
			if(source.id != 'unknown'){
				var q = [];				
				if(source.options && source.options.range){					
					switch(source.options.range.length){
						case 1:
							q.push("([year] = " + source.options.range[0] + ")");
							break;
						case 2:
							var min = Math.min.apply(null,source.options.range),
								max = Math.max.apply(null,source.options.range);
							q.push("([year] >= " + min + " AND [year] <= " + max + ")");
							break;
						default:
							break;
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