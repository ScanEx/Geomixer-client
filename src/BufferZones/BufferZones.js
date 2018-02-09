var nsGmx = window.nsGmx || {};

(function() {
    window._translationsHash.addtext('rus', {
        bufferZones: {
            title: 'Создание буферных зон',
            selectTooltip: 'Выберите кликом векторный слой в дерев',
            select: 'Выберите векторный слой',
            selectedLayer: 'Выбранный слой',
            layerTypeError: 'Слой не является векторным',
            bufferSize: 'Размер буфера',
            createBuffer: 'Создать буфер',
            units: 'м'
        }
    });
    window._translationsHash.addtext('eng', {
        bufferZones: {
            title: 'Buffer zones creation',
            selectTooltip: 'Select vector layer by click in the tree',
            select: 'Select vector layer',
            selectedLayer: 'Selected layer',
            layerTypeError: 'Selected layer is not vector type',
            bufferSize: 'Buffer size',
            createBuffer: 'Create Buffer',
            units: 'm'
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
                error: true
            }
        });

        var model = new BufferModel();

        var BufferView = window.Backbone.View.extend({
            el: $(canvas),
            model: model,
            template: window.Handlebars.compile(
                '<div class="">' +
                    '<div class="buffer-row buffer-select-title">{{i "bufferZones.select"}}</div>' +
                    '<div class="buffer-row">{{i "bufferZones.selectedLayer"}}: ' +
                        '<span class="buffer-layer-name {{#if error}}buffer-layer-name-error{{/if}}">{{selectedLayerName}}</span>' +
                    '</div>' +
                    '<div class="buffer-row">{{i "bufferZones.bufferSize"}}: ' +
                        '<input type="number" class="buffer-size"value={{bufferSize}}></input>' +
                        ' {{i "bufferZones.units"}}' +
                    '</div>' +
                    '<div class="buffer-row buffer-button-container"><span class="buttonLink create-buffer-button {{#if error}}gmx-disabled{{/if}}">{{i "bufferZones.createBuffer"}}</span></div>' +
                '</div>'
            ),
            events: {
                'click .create-buffer-button': 'createBuffer',
                'change .buffer-size': 'setBufferSize',
            },

            initialize: function () {
                var attrs = this.model.toJSON(),
                    _this = this;

                $(_layersTree).on('activeNodeChange', function(event, elem) {
                    if (elem) {
                        if (elem.hasAttribute('groupid')) {
                            _this.model.set({
                                selectedLayerName: '',
                                selectedLayer: null,
                                error: true
                            });
                            return;
                        }

                        var layerID = $(elem).attr('layerid'),
                            layer = nsGmx.gmxMap.layersByID[layerID];

                        if (layer && layer.getGmxProperties) {
                            var type = layer.getGmxProperties().type
                            if (type === 'Vector') {
                                _this.model.set({
                                    selectedLayerName: layer.getGmxProperties ? layer.getGmxProperties().title : '',
                                    selectedLayer: layerID,
                                    error: false
                                });
                            } else {
                                _this.model.set({
                                    selectedLayerName: window._gtxt('bufferZones.layerTypeError'),
                                    selectedLayer: null,
                                    error: true
                                });
                            }
                        } else {
                            _this.model.set({
                                selectedLayerName: window._gtxt('bufferZones.layerTypeError'),
                                selectedLayer: null,
                                error: true
                            });
                        }
                    } else {
                        _this.model.set({
                            selectedLayerName: '',
                            selectedLayer: null,
                            error: true
                        });
                    }
                });

                this.listenTo(this.model, 'selectedLayerName: change', this.render);
                this.listenTo(this.model, 'bufferSize: change', this.render);

                this.render();
            },

            render: function () {
                this.$el.html(this.template(this.model.toJSON()));

                // console.log('----- bs: ', this.model.get('bufferSize'));

                return this;
            },

            setBufferSize: function (e) {
                var value = Number(e.target.value);

                if (isNaN(value)) {
                    this.model.set('error', true);
                    return;
                } else {
                    this.model.set({
                        error: false,
                        bufferSize: value
                    });
                }
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
                            Title:  response.Result.Title + '_' + window._gtxt('Буфер').toLowerCase(),
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
            }
        });

        view = new BufferView();

        // DEBUG:
        window.v = view;

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
