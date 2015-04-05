// векторный слой
(function()
{
    // "use strict";
    // var LMap = null;        // leafLet карта
    // var mapNodes = null;    // Хэш нод обьектов карты - аналог MapNodes.hx

    // Добавить векторный слой
    function setVectorTiles(ph) {
        var LMap = nsGmx.leafletMap,
            layersByID = nsGmx.gmxMap.layersByID;

        var layer = ph.obj,
            nodeId = layer.objectId,
            prop = layer.properties,
            layerID = prop.name,
            node = gmxAPI._leaflet.mapNodes[nodeId];

        if(!node) return;      // Нода не определена
        node.type = 'VectorLayer';

        var myLayer = node.leaflet = layersByID[layerID];
        node.leaflet = myLayer;
        
        if (prop.visible && myLayer) myLayer.addTo(LMap);

        gmxAPI.extend(node, {
            setVisible: function(flag) {
                //console.log('setVisible', arguments);
                if (flag) {
                    LMap.addLayer(myLayer);
                } else {
                    LMap.removeLayer(myLayer);
                }
            }
        });

    }

    //расширяем namespace
    if(!gmxAPI._leaflet) gmxAPI._leaflet = {};
    gmxAPI._leaflet.setVectorTiles = setVectorTiles;    // Добавить векторный слой
})();
