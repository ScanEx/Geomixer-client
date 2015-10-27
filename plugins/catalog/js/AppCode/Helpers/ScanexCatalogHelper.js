ScanexCatalogHelper = { }

ScanexCatalogHelper.satellites = [
		{source: 'scanex', name: 'Сканэкс',
			options: {
				title: 'Дополнительные параметры',
				items: {
					'GE-1': {id: 'GE-1', name: 'GeoEye-1', source: 'search', resolution: 0.5, color: 0x0000ff, checked: true},
					'WV01': {id: 'WV01', name: 'WorldView-1', source: 'search', resolution: 0.5, color: 0xff0000, checked: true },
					'WV02': {id: 'WV02', name: 'WorldView-2', source: 'search', resolution: 0.5, color: 0x800000, checked: true },
					'QB02': {id: 'QB02', name: 'QuickBird', source: 'search', resolution: 0.6, color: 0x808080, checked: true },
					'EROS-B': {id: 'EROS-B', name: 'EROS-B', source: 'search', resolution: 0.7, color: 0x008080, checked: true },
					'IK-2': {id: 'IK-2', name: 'IKONOS', source: 'search', resolution: 1, color: 0x000080, checked: true },
					'SP5-J': {id: 'SPOT 5', name: 'SPOT 5 (J)', source: 'search', product: 5, resolution: 2.5, color: 0x000080, checked: true },
					'SP5-A': {id: 'SPOT 5', name: 'SPOT 5 (A)', source: 'search', product: 4, resolution: 2.5, color: 0x808080, checked: true },
					'SPOT 6': {id: 'SPOT 6, SPOT 7', name: 'SPOT-6,7', source: 'search', color: 0x006400, checked: true},
					'LANDSAT_8': {id: 'LANDSAT_8', name: 'LANDSAT 8', source: 'search', resolution: 15, color: 0x0000ff, checked: true }
				}
			}
		}
		// ,{ source: 'rl_images', name: 'РЛИ-снимки', layerId: '9B87EC9626D24B9D8311AFCAF046105C', color: 0x2f4f4f,
		// 	options: {
		// 		title: 'Дополнительные параметры',
		// 		items: {
		// 			'RE-2': {id: 'RE-2', name: 'RE-2', checked: true},
		// 			'RE-3': {id: 'RE-3', name: 'RE-3', checked: true},
		// 			'FORMOSAT2': {id: 'FORMOSAT2', name: 'FORMOSAT2', checked: true},
		// 			'SPOT4': {id: 'SPOT4', name: 'SPOT-4', checked: true},
		// 			'SPOT5': {id: 'SPOT5', name: 'SPOT-5', checked: true},
		// 			'SPOT6': {id: 'SPOT6', name: 'SPOT-6', checked: true}
		// 		}
		// 	},
		// 	infoFields: ['acqdate','acqtime','platform','sensor','viewangle','sunelev','resolution','product','contract'],
		// 	useDate: true}
		// ,{ source: 'rl_sheets', name: 'РЛИ-карты', layerId: '466F5E8A052148FDA0D45133F0F64124', color: 0xdc143c,
		// 	options: {
		// 		title: 'Дополнительные параметры',
		// 		range: [],
		// 		initial: 1990
		// 	},
		// 	infoFields: ['scale','year','type','filename','contract']
		// }
    ];

ScanexCatalogHelper.findSpot5 = function(items, product){
	for(var id in items){
		var item = items[id];
		if(item.id == 'SPOT 5' && item.product == product){
			return item;
		}
	}
	return null;
};

ScanexCatalogHelper.findSatelliteById = function(source, id, product) {
	for (var satelliteIndex in this.satellites) {
		var satellite = this.satellites[satelliteIndex];
		if (satellite.source == source) {
			if(id && satellite.options.items){
				switch(id){
					case 'SPOT 6':
					case 'SPOT 7':
						return satellite.options.items['SPOT 6'];
					case 'SPOT 5':
						return this.findSpot5(satellite.options.items, product);
					default:
						return satellite.options.items[id];
				}
			}
			else {
				return satellite;
			}
		}
	}
	return { source: 'unknown', id: 'unknown', name: name, color: 0x999999 }
};
