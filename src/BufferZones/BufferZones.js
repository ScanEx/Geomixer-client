var nsGmx = window.nsGmx || {};

(function() {
    window._translationsHash.addtext('rus', {
        bufferZones: {
            title: 'Создание буферных зон',
            selectTooltip: 'Выберите кликом векторный слой в дерев',
            select: 'Выберите векторный слой',
            selectedLayer: 'Выбранный слой',
            bufferSize: 'Размер буфера',
            createBuffer: 'Создать буфер',
        }
    });
    window._translationsHash.addtext('eng', {
        bufferZones: {
            title: 'Buffer zones creation',
            selectTooltip: 'Select vector layer by click in the tree',
            select: 'Select vector layer',
            selectedLayer: 'Selected layer',
            bufferSize: 'Buffer size',
            createBuffer: 'Create Buffer',
        }
    });

    var view;

    var BufferZonesMenu = function () {
        var canvas = nsGmx.Utils._div(null, [['dir','className','bufferZonesConfigLeftMenu']]);

        var BufferModel = window.Backbone.Model.extend({
            defaults: {
                lm: new window.leftMenu(),
                lmap: nsGmx.leafletMap,
                selectedLayer: null,
                selectedLayerName: '',
                bufferSize: 50,
                exportErr: false
            }
        });

        var model = new BufferModel();

        var BufferView = window.Backbone.View.extend({
            el: $(canvas),
            model: model,
            template: window.Handlebars.compile(
                '<div class="">' +
                    '<div>{{i "bufferZones.select"}}</div>' +
                    '<div>{{i "bufferZones.selectedLayer"}}: {{selectedLayerName}}</div>' +
                    '<div>{{i "bufferZones.bufferSize"}}: ' +
                        '<input type="number" class="bufferZonesName"value={{bufferSize}}></input>' +
                    '</div>' +
                    '<div><span class="buttonLink createBufferButton">{{i "bufferZones.createBuffer"}}</span></div>' +
                '</div>'
            ),
            events: {
                'click .createBufferButton': 'createBuffer',
            },

            initialize: function () {
                var attrs = this.model.toJSON(),
                    _this = this;

                $(_layersTree).on('activeNodeChange', function(event, elem) {
                    if (elem) {
                        var layerID = $(elem).attr('layerid'),
                            layer = nsGmx.gmxMap.layersByID[layerID];

                        if (layer && layer instanceof L.gmx.VectorLayer) {
                            _this.model.set({
                                selectedLayerName: layer.getGmxProperties ? layer.getGmxProperties().title : '',
                                selectedLayer: layerID
                            });
                        }
                    }
                });

                this.listenTo(this.model, 'selectedLayerName: change', this.render);


                this.render();
            },

            render: function () {
                this.$el.html(this.template(this.model.toJSON()));

                return this;
            },

            createBuffer: function () {
                var attrs = this.model.toJSON(),
                    _this = this,
                    selectedLayer = attrs.selectedLayer;

                if (!selectedLayer) {
                    return;
                }

                sendCrossDomainJSONRequest(serverBase + "Layer/GetLayerInfo.ashx?NeedAttrValues=false&LayerName=" + encodeURIComponent(selectedLayer), function(response) {
                    if (!parseResponse(response)) {
                        return;
                    }
                    var layerProperties = new nsGmx.LayerProperties(),
                        params = {
                            sourceLayerName: selectedLayer,
                            copy: true,
                            addToMap: true,
                            buffer: true,
                            bufferSize: _this.model.toJSON().bufferSize
                        },
                        properties = {
                            Columns: response.Result.Columns,
                            Title:  response.Result.Title,
                            Copyright: response.Result.Copyright,
                            Description: response.Result.Description,
                            Date: response.Result.Date,
                            MetaProperties: response.Result.MetaProperties,
                            TilePath: {
                                Path: ''
                            },
                            ShapePath: response.Result.ShapePath,
                            IsRasterCatalog: response.Result.IsRasterCatalog,
                            SourceType: "sql",
                            Quicklook: response.Result.Quicklook
                        }, layerTitle;

                    layerProperties.initFromViewer('Vector', null, properties);

                    var def = layerProperties.save(true, null, params);
                    layerTitle = layerProperties.get('Title');

                    if (params.addToMap) {
                        window._queryMapLayers.asyncCreateLayer(def, layerTitle);
                    }
                });

            },

            exportMap: function () {
                // var _this = this,
                //     attrs = this.model.toJSON(),
                //     initialCoords = attrs.selArea.rings[0].ring._getLatLngsArr(),
                //     screenCoords = !attrs.coords ? this._convertFromLatLngs(initialCoords, attrs.z) : this._convertFromLatLngs(attrs.coords, attrs.z),
                //     dimensions = this._getDimensions(screenCoords),
                //     mapStateParams = {
                //         exportMode: true,
                //         isFullScreen: true,
                //         width: Math.floor(Number(attrs.width)) + 'px',
                //         height: Math.floor(Number(attrs.height)) + 'px',
                //         position: {
                //             x: dimensions.mercCenter.x,
                //             y: dimensions.mercCenter.y,
                //             z: attrs.z ? 17 - attrs.z : 17 - attrs.lmap.getZoom()
                //         },
                //         latLng: dimensions.latLng,
                //         exportBounds: attrs.selArea.getBounds(),
                //         grid: nsGmx.gridManager.state
                //     },
                //     exportParams = {
                //         width: Math.floor(Number(attrs.width)),
                //         height: Math.floor(Number(attrs.height)),
                //         filename: attrs.name,
                //         container: attrs.fileType === window._gtxt('mapExport.filetypes.raster') ? 'grimage' : attrs.fileType,
                //         format: attrs.format
                //     },
                //     exportButton = this.$('.mapExportButton'),
                //     cancelButton = this.$('.cancelButton'),
                //     progressBarContainer = this.$('.export-progress-container'),
                //     progressBar = this.$('.export-progressbar'),
                //     spinHolder = this.$('.spinHolder'),
                //     spinMessage = this.$('.spinMessage'),
                //     def;
                //
                // $(exportButton).toggle();
                // $(cancelButton).toggle();
                //
                // window._mapHelper.createExportPermalink(mapStateParams, processLink);
                //
                // function processLink(id){
                //     var url = window.serverBase + 'Map/Render?' + $.param(exportParams) + '&uri=' + 'http://' + window.location.host + window.location.pathname + '?permalink=' + id;
                //
                //     _this.model.set({
                //         exportErr: false
                //     });
                //
                //     $(exportButton).addClass('gmx-disabled');
                //
                //     $(progressBarContainer).toggle();
                //     $(spinHolder).toggle();
                //
                //     $(progressBar).progressbar({
                //         max: 100,
                //         value: 0
                //     });
                //
                //     def = nsGmx.asyncTaskManager.sendGmxPostRequest(url);
                //
                //     def.done(function(taskInfo){
                //         var url2 = window.serverBase + taskInfo.Result.downloadFile,
                //             selArea = _this.model.get('selArea');
                //
                //         if (selArea) {
                //             $(exportButton).removeClass('gmx-disabled');
                //         } else {
                //             $(exportButton).addClass('gmx-disabled');
                //         }
                //
                //         $(exportButton).toggle();
                //         $(cancelButton).toggle();
                //         $(spinHolder).toggle();
                //         $(progressBarContainer).toggle();
                //
                //         downloadFile(url2);
                //
                //     }).fail(function(taskInfo){
                //         if (taskInfo.ErrorInfo.ErrorMessage !== 'Task is canceled') {
                //             $(exportButton).removeClass('gmx-disabled');
                //
                //             _this.model.set({
                //                 exportErr: true
                //             });
                //         }
                //     }).progress(function(taskInfo){
                //         _this.model.set({
                //             taskInfo: taskInfo
                //         });
                //
                //         if (taskInfo.Status === 'queue') {
                //             $(spinMessage).html(window._gtxt('mapExport.inQueue'));
                //         } else if (taskInfo.Status === 'progress') {
                //             $(spinMessage).html(window._gtxt('mapExport.inProcess'));
                //
                //             $(progressBar).progressbar('value', taskInfo.Progress);
                //         }
                //     });
                //
                //     function downloadFile(url) {
                //         var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
                //             isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;
                //
                //         if (isChrome || isSafari) {
                //             var link = document.createElement('a');
                //             link.href = url;
                //             link.download = attrs.name;
                //
                //             if (document.createEvent) {
                //                 var e = document.createEvent('MouseEvents');
                //                 e.initEvent('click', true, true);
                //                 link.dispatchEvent(e);
                //                 return true;
                //             }
                //         } else {
                //             window.open(url, '_self');
                //         }
                //     }
                // }
            }
        });

        view = new BufferView();

        this.Load = function () {
            var lm = model.get('lm');

            if (lm != null) {
                var alreadyLoaded = lm.createWorkCanvas('buffer', this.Unload);
                if (!alreadyLoaded) {
                    $(lm.workCanvas).append(view.el);
                }
            }
        }
        this.Unload = function () {
            var attrs = model.toJSON();

            model.set({});
        };
    }

    var publicInterface = {
        pluginName: 'BufferZones',
        BufferZonesMenu: BufferZonesMenu
  };

    window.gmxCore.addModule('BufferZones',
        publicInterface
    );
})();
