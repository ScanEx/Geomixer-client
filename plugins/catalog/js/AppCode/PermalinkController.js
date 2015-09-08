PermalinkController = function() {
    this._loaded = false;
}

PermalinkController.prototype = {
    _initialize: function(params) {
		this._pageController = params.PageController;
		this._mapObjectsHelper = params.MapObjectsHelper;
		this._selectedImagesController = params.SelectedImagesController;
		this._searchOptionsController = params.SearchOptionsController;
		this._urlProviders = params.UrlProviders;
		this._loaded = true;
    },
    
    toPermalink: function() {
		if (!this._loaded) return null;
        var nodes = this._selectedImagesController.getSelectedNodes();
		var searchCriteria = this._searchOptionsController.get_searchCriteria();			
        var result = { nodes: [], searchCriteria: searchCriteria};
		var satellites = null;
		result.searchSatellites = [];
		if(searchCriteria.scanexSatellites){
			satellites = this._urlProviders['catalog'].getSatellitesIDs(searchCriteria);
			if(satellites) {
				result.searchSatellites = result.searchSatellites.concat(satellites);
			}
			satellites = this._urlProviders['search'].getSatellitesIDs(searchCriteria);
			if(satellites) {
				result.searchSatellites = result.searchSatellites.concat(satellites);
			}
		}		
		if(searchCriteria.rlImages){
			satellites = this._urlProviders['rl_images'].getSatellitesIDs(searchCriteria);
			if(satellites) {
				result.rlImages = satellites;
			}
		}
		if(searchCriteria.rlSheets){
			var range = this._urlProviders['rl_sheets'].getRange(searchCriteria);
			if(range && range.length > 0) {
				result.rlSheets = range;
			}
		}
        for (var nodeKey in nodes) {
            var data = nodes[nodeKey].data;
            result.nodes.push({
                color: data.color,
                icon: data.icon,
				crs: data.crs,
                info: data.info,				
                latLonQuad: data.latLonQuad,
				geometry: data.geometry,
				tooltip: data.tooltip
            });
        }		
        return result;
    },
	
	_geometryToGeoJSON: function(geometry){
		var t = '';
		switch(geometry.type.toUpperCase()){
				case 'POINT':
					t = 'Point';
					break;				
				case 'MULTIPOINT':
					t = 'MultiPoint';
					break;
				case 'LINESTRING':
					t = 'LineString';
					break;
				case 'MULTILINESTRING':
					t = 'MultiLineString';
					break;
				case 'POLYGON':
					t = 'Polygon';
					break;
				case 'MULTIPOLYGON':
					t = 'MultiPolygon';
					break;				
				default:
					throw 'Unsupported geometry type';
			}
			return {type: t, coordinates: geometry.coordinates};
	},
	
	_fixGeometry: function(geometry, crs){
		var g = crs == 'mercator' ? L.gmxUtil.geometryToGeoJSON(geometry, true) :  this._geometryToGeoJSON (geometry);		
		return g;
	},
    
    fromPermalink: function(persistedData) {
        var nodes = [];
        for (var dataKey in persistedData.nodes) {
            var dataItem = persistedData.nodes[dataKey];
            var node = new TreeNode('GroundOverlay', '[not in tree]', dataItem);
            node.data.mapObjects = {};
            node.isChecked = true;
            this._mapObjectsHelper.createPolygon(node, this._pageController._polygonClicked.bind(this._pageController));
            nodes.push(node);
        }
        for (var nodeKey in nodes) {
            var node = nodes[nodeKey];
            this._mapObjectsHelper.createGroundOverlay(node);
            this._mapObjectsHelper.createInfoIcon(node);
            node.data.isOverlayVisible = node.isChecked;
            this._selectedImagesController.addNode(node);
        }
		this._searchOptionsController.set_searchCriteria(persistedData);
    },
    
    attach: function() {
		// see CatalogPlugin
    },
    
    detach: function() {
        // sorry, detaching is not supported by the viewer :(
    }
}