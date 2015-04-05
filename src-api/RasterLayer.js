// растровый слой
(function()
{
    "use strict";
	var LMap = null;						// leafLet карта
	// var utils = null;						// утилиты для leaflet
	var mapNodes = null;					// Хэш нод обьектов карты - аналог MapNodes.hx

    // Добавить векторный слой
    function setBackgroundTiles(ph) {
        var _leaflet = gmxAPI._leaflet;
        LMap = _leaflet.LMap;
        // utils = _leaflet.utils;
        mapNodes = _leaflet.mapNodes;

        var layer = ph.obj,
            nodeId = layer.objectId,
            prop = layer.properties,
            layerID = prop.name,
            node = mapNodes[nodeId];
        if(!node) return;      // Нода не определена
		node.type = 'RasterLayer';
        // node.zIndexOffset = 100000;
        // node.zIndex = utils.getIndexLayer(nodeId);

        var gmxNode = gmxAPI.mapNodes[nodeId],  // Нода gmxAPI
            myLayer = node.leaflet = gmxAPI.layersByID[layerID];
        node.leaflet = myLayer;
        gmxAPI.extend(node, {
            setVisible: function(flag) {
//console.log('setVisible', arguments);
                if (flag) {
                    LMap.addLayer(myLayer);
                    //node.setZIndex(node.zIndex + node.zIndexOffset);
                } else LMap.removeLayer(myLayer);
            }
        });
    }

    //расширяем namespace
    if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
    gmxAPI._leaflet.setBackgroundTiles = setBackgroundTiles;
})();
