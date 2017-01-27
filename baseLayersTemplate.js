var baseMap = {
    defaultHostName: false,
    defaultMapID: '1D30C72D02914C5FB90D1D448159CAB6',
    baseLayers: [
        {
            id: 'satellite',
            rus: 'Снимки',
            eng: 'Satellite',
            overlayColor: '#ffffff',
            layers: [
                {
					hostName: 'maps.kosmosnimki.ru',
					mapID: '1D30C72D02914C5FB90D1D448159CAB6',
                    layerID: 'C9458F2DCB754CEEACC54216C7D1EB0A',
                    maxNativeZoom: 17
                }
            ]
        },
        {
            id: 'empty',
            rus: 'Пустая',
            eng: 'Empty',
            layers: []
        },
        {
            id: 'sputnik',
            rus: 'Спутник ру',
            eng: 'Sputnik RU',
            layers: [
                {
                    urlTemplate: 'http://tiles.maps.sputnik.ru/{z}/{x}/{y}.png',
                    maxZoom: 22,
                    maxNativeZoom: 18
                }
            ]
        },
        {
            id: 'OSM',
            rus: 'Карта',
            eng: 'Map',
            layers: [
                {
                    urlTemplate: '',
                    maxZoom: 18,
                    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
                }
            ]
        },
        {
            id: 'OSMHybrid',
            rus: 'Гибрид',
            eng: 'Hybrid',
            overlayColor: '#ffffff',
            icon: 'http://maps.kosmosnimki.ru/api/img/baseLayers/basemap_osm_hybrid.png',
            layers: [
                {
                    urlTemplate: '',
                    maxZoom: 18,
                    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
                }
            ]
        }
    ]
}
