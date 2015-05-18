//Поддержка map
(function()
{
    var addNewMap = function(rootObjectId, layers, callback)
    {
        var map = new gmxAPI._FMO(rootObjectId, {}, null); // MapObject основной карты
        window.globalFlashMap = map;
        gmxAPI.map = map;
        gmxAPI.mapNodes[rootObjectId] = map; // основная карта

        if(!layers.properties) layers.properties = {};
        map.properties = layers.properties;
        if(!layers.children) layers.children = [];
        map.isVisible = true;
        map.layers = [];

        var getDefaultPos = function(prop) {
            return {
                x: (typeof(prop.DefaultLong) === 'number' ? prop.DefaultLong :(map.needMove ? map.needMove.x : 35))
                ,y: (typeof(prop.DefaultLat) === 'number' ? prop.DefaultLat :(map.needMove ? map.needMove.y : 50))
                ,z: (typeof(prop.DefaultZoom) === 'number' ? prop.DefaultZoom :(map.needMove ? map.needMove.z : 4))
            };
        }
        map.needMove = getDefaultPos(map.properties);
        map.needSetMode = null;

        map.moveTo = function(x, y, z) {
            var pos = {'x':x, 'y':y, 'z':z};
            if(gmxAPI.proxyType == 'leaflet' && map.needMove) {
                if(!pos.z) pos.z =  map.needMove.z || map.getZ();
                map.needMove = pos;
            }
            else {
                map.needMove = null;
                gmxAPI._cmdProxy('moveTo', { 'attr': pos });
            }
        }
        map.getBestZ = function(minX, minY, maxX, maxY)
        {
            if ((minX == maxX) && (minY == maxY))
                return 17;
            var size = nsGmx.leafletMap.getSize();
            return Math.max(0, 17 - Math.ceil(Math.log(Math.max(
                Math.abs(gmxAPI.merc_x(maxX) - gmxAPI.merc_x(minX))/size.x,
                Math.abs(gmxAPI.merc_y(maxY) - gmxAPI.merc_y(minY))/size.y
            ))/Math.log(2)));
        }

        //gmxAPI._listeners.dispatchEvent('mapInit', null, map); // Глобальный Listeners
        var mapNodes = gmxAPI._leaflet.mapNodes;
        gmxAPI._cmdProxy = gmxAPI._leaflet.cmdProxy;			// Установка прокси для leaflet
		var mapID = rootObjectId;
		mapNodes[mapID] = {
			'type': 'map'
			,'handlers': {}
			,'children': []
			,'id': mapID
			,'group': gmxAPI._leaflet.LMap
			,'parentId': false
		};

        map.geoSearchAPIRoot = 'http://maps.kosmosnimki.ru/';

        map.addLayers = function(layers, notMoveFlag, notVisible) {
            for (var iL = 0; iL < nsGmx.gmxMap.layers.length; iL++) {
                var layer = nsGmx.gmxMap.layers[iL],
                    props = layer.getGmxProperties(),
                    layerID = props.name;

                if(!gmxAPI.map.layers[layerID]) {
                    map.addLayer(layer, props.visible ? true : notVisible, true);
                }
            }

            if (typeof(map.properties.DefaultLat) === 'number'
                || typeof(map.properties.DefaultLong) === 'number'
                || typeof(map.properties.DefaultZoom) === 'number') {
                map.needMove = getDefaultPos(map.properties);
            }
        }

        map.defaultHostName = map.properties.hostName || '';
        map.addLayers(layers, false, false);
        
        // map.ToolsContainer = gmxAPI._ToolsContainer;
        //gmxAPI._listeners.dispatchEvent('mapCreated', null, map); // Глобальный Listeners
        return map;
    }
    //расширяем namespace
    gmxAPI._addNewMap = addNewMap; // Создать map обьект
})();
