const DEFAULT_VECTOR_LAYER_ZINDEXOFFSET = 2000000;
module.exports = function ({groups, layers}) {
    let _layers = [],
    _data = {groups: []};
    groups.forEach((g, i)=>{
        _layers.push({group:g, members: layers[i]});
    } );

    let _serverUrl = document.location.protocol + window.serverBase.replace(/^[^:]+:/, '');
    let _addLayer = function (layer) {
        let currentZoom = nsGmx.leafletMap.getZoom();
        function updateZIndex(layer) {
            var props = layer.getGmxProperties();
            switch (nsGmx.gmxMap.rawTree.properties.LayerOrder) {
                case 'VectorOnTop':
                    if (props.type === 'Vector') {
                        if (props.IsRasterCatalog) {
                            var rcMinZoom = props.RCMinZoomForRasters;
                            layer.setZIndexOffset(currentZoom < rcMinZoom ? DEFAULT_VECTOR_LAYER_ZINDEXOFFSET : 0);
                        } else {
                            layer.setZIndexOffset(DEFAULT_VECTOR_LAYER_ZINDEXOFFSET);
                        }
                    }
                    break;
            }
        }

        var name = layer.properties.name;

        // hack to avoid API defaults by initFromDescription;
        var propsHostName = window.serverBase.replace(/https?:\/\//, '');
        propsHostName = propsHostName.replace(/\//g, '');

        layer.properties.mapName = nsGmx.gmxMap.properties.MapID;
        layer.properties.hostName = propsHostName;

        if (!nsGmx.gmxMap.layersByID[name]) {
            var visibility = typeof layer.properties.visible != 'undefined' ? layer.properties.visible : false,
                rcMinZoom = layer.properties.RCMinZoomForRasters,
                layerOnMap = L.gmx.createLayer(layer, {
                    layerID: name,
                    hostName: propsHostName,
                    zIndexOffset: null,
                    srs: nsGmx.leafletMap.options.srs || '',
                    skipTiles: nsGmx.leafletMap.options.skipTiles || '',
                    isGeneralized: window.mapOptions && 'isGeneralized' in window.mapOptions ? window.mapOptions.isGeneralized : true
                });

            updateZIndex(layerOnMap);
            nsGmx.gmxMap.addLayer(layerOnMap);

            //nsGmx.leafletMap.addLayer(layerOnMap);

            //layerOnMap.getGmxProperties().changedByViewer = true;

            nsGmx.leafletMap.on('zoomend', function (e) {
                currentZoom = nsGmx.leafletMap.getZoom();

                for (var l = 0; l < nsGmx.gmxMap.layers.length; l++) {
                    var layer = nsGmx.gmxMap.layers[l];

                    updateZIndex(layer);
                }
            });
            return layerOnMap;
        }
    };

    return {
        isDirty: true,
        get data() { return _data; },
        load: function (actualUpdate) {
            return Promise.all(_layers.map(l => {
                let a = l.members.map(m =>
                    new Promise((resolve, reject) => {
                        sendCrossDomainJSONRequest(_serverUrl + 'Layer/GetLayerJson.ashx?NeedAttrValues=false&LayerName=' + m, response => {
                            if (response.Status && response.Status.toLowerCase() == 'ok')
                                resolve(response);
                            else
                                reject(response);
                        });
                    })
                );
                a.push(Promise.resolve({groupName: l.group}));
                return Promise.all(a);
            }
            ));
        },
        update: function () {
            if (this.isDirty) {
                this.view.inProgress(true);
                this.load()
                    .then((groups => {
//console.log(groups)                    
                        groups.forEach(responses=>{  
                            let group = {layers:[]};
                            responses.forEach(response=>{
                                if (response.Result) {
                                    let props = response.Result.properties;
                                    _addLayer(response.Result);
                                    let layerAttr = {
                                        id: props.LayerID,
                                        description: props.description,
                                        title: props.title
                                    };
                                    if (nsGmx.timeLineControl && props.Temporal && (props.IsRasterCatalog || (props.Quicklook && props.Quicklook !== 'null')))
                                        layerAttr.timelineIcon = window._layersTree.CreateTimelineIcon({ name: props.LayerID });
                                    group.layers.push(layerAttr);
                                }
                                else
                                    group.name = response.groupName;
                            });
                            _data.groups.push(group);
                        });
//console.log(_data)
                        this.view.inProgress(false);
                        this.view.repaint();

                        _data.groups.forEach(g=>{
                            g.layers.forEach(l=>{
                                if (l.timelineIcon)
                                    document.querySelector('#layer' + l.id + ' .timeline-icon').append(l.timelineIcon);
                            });
                        });

                        this.isDirty = false;
                    }).bind(this))
                    .catch((ex => {
                        console.log(ex)
                        this.view.inProgress(false);
                    }).bind(this));
            }
        }
    }
}