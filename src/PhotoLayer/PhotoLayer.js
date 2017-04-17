var nsGmx = window.nsGmx || {},
    _gtxt = window._gtxt,
    Handlebars = window.Handlebars;

(function($) {

    window._translationsHash.addtext('rus', {
        photoLayer: {
            catalog: "Каталог",
            newCatalog: "новый",
            existingCatalog: "существующий",
            name: "имя",
            available: "доступные каталоги",
            load: "Загрузить фотографии",
            ok: "ok"
        }
    });

    window._translationsHash.addtext('eng', {
        photoLayer: {
            catalog: "Catalog",
            newCatalog: "new",
            existingCatalog: "existing",
            name: "name",
            available: "available catalogs",
            load: "Load photos",
            ok: "ok"
        }
    });

    var PhotoLayer = function () {
        var dialog;

    var PhotoLayerModel = window.Backbone.Model.extend({
        defaults: {
            newCatalog: true,
            fileName: '',
            photoLayersFlag: false,
            photoLayers: {},
            sandbox: ''
        }
    });


    var PhotoLayerView = window.Backbone.View.extend({
        tagName: 'div',
        model: new PhotoLayerModel(),
        template: Handlebars.compile('' +
            '<div class="photolayer-ui-container photolayer-properties-container">' +
                '<div class="photolayer-ui-container photolayer-catalog-selector-container">' +
                    '<span class="photolayer-title photolayer-catalog-title">{{i "photoLayer.catalog"}}</span>' +
                    '<label class="photolayer-catalog-label">' +
                        '<input class="select-catalog-input new-catalog-input" type="radio" checked name={{i "photoLayer.catalog"}}></input>' +
                        '{{i "photoLayer.newCatalog"}}' +
                    '</label>' +
                    // '{{#if photoLayersFlag}}' +
                    '<label class="photolayer-catalog-label">' +
                        '<input class="select-catalog-input existing-catalog-input" type="radio" name={{i "photoLayer.catalog"}}></input>' +
                        '{{i "photoLayer.existingCatalog"}}' +
                    '</label>' +
                    // '{{/if}}' +
                '</div>' +
                '<div class="photolayer-ui-container photolayer-newlayer-input-container">' +
                    '<span class="photolayer-title photolayer-name-title">{{i "photoLayer.name"}}</span>' +
                    '<input type="text" class="photolayer-name-input photolayer-newlayer-input inputStyle" value={{fileName}}></input>' +
                '</div>' +
                '<div class="photolayer-ui-container photolayer-existinglayer-input-container" style="display:none">' +
                    '<span class="photolayer-title photolayer-name-title">{{i "photoLayer.available"}}</span>' +
                    '<select class="photolayer-name-input photolayer-existinglayer-input">' +
                        '{{#each this.photoLayers}}' +
                        '<option value="{{this.layer}}">' +
                            '{{this.layer}}' +
                        '</option>' +
                        '{{/each}}' +
                    '</select>' +
                '</div>' +
                '<div class="photolayer-ui-container photolayer-loader-container">' +
                    '<span class="photolayer-title photolayer-loader-title">{{i "photoLayer.load"}}</span>' +
                    '<form id="photo-uploader-form" name="photouploader" enctype="multipart/form-data" method="post">' +
                        '<input type="file" name="file" id="photo-uploader" accept="image/*" multiple></input>' +
                    '</form>' +
                    // '<span class="photolayer-loader-icon">111</span>' +
                '</div>' +
                '<div class="photolayer-ui-container photolayer-progress-container">' +
                // '<div class="progress-container" style="display:none">' +
                    '<div class="progressbar"></div>' +
                '</div>' +
                '<div class="photolayer-ui-container photolayer-ok-button-container" style="display:none">' +
                    '<span class="buttonLink ok-button"> {{i "photoLayer.ok"}}</span>' +
                '</div>' +
            '</div>'
        ),

        events: {
            'change .select-catalog-input': 'setCatalogType',
            'change .photolayer-newlayer-input': 'setName',
            'change #photo-uploader': 'selectFile',
            'click .ok-button': 'close'
        },

        initialize: function () {
            this.getPhotoLayers();
            this.createSandbox();
            this.render();

            this.listenTo(this.model, 'change:fileName', this.updateName);
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            this.$('.photolayer-loader-container').prop('disabled', true);
        },

        getPhotoLayers: function (layers) {
            var layers = layers || nsGmx.gmxMap.layers,
                photoLayersFlag = false,
                photoLayers = [];

            for (var i = 0, len = layers.length; i < len; i++) {
                var layer = layers[i],
                    props = layer.getGmxProperties(),
                    isPhotoLayer;

                if (props) {
                    isPhotoLayer = props.IsPhotoLayer;

                    if (isPhotoLayer && props.Access === 'edit') {
                        photoLayersFlag = true;

                        photoLayers.push({layer: props.title});

                        // if (i === currentZoom) {
                        //     zoomLevels[i].current = true;
                        // }
                        // photoLayers.push({
                        //     layer: props.title
                        // });
                    }
                }
            }
            this.model.set({
                photoLayersFlag: photoLayersFlag,
                photoLayers: photoLayers
            });
        },

        setCatalogType: function (e) {
            var newCatalog = $(e.target).hasClass('new-catalog-input'),
                newContainer = $('.photolayer-newlayer-input-container'),
                existingContainer = $('.photolayer-existinglayer-input-container'),
                _this = this;

            if (newCatalog) {
                $(newContainer).toggle(true);
                $(existingContainer).toggle(false);

                this.createSandbox();
            } else {
                $(existingContainer).toggle(true);
                $(newContainer).toggle(false);
            }
        },

        createSandbox: function () {
            var _this = this;

            window.sendCrossDomainJSONRequest(window.serverBase + 'Sandbox/CreateSandbox', function(response) {
                if (parseResponse(response) && response.Result) {
                    _this.model.set('sandbox', response.Result.sandbox);
                }
            });
        },

        setName: function (e) {
            this.model.set('fileName', e.target.value);
        },

        close: function () {
            $(dialog).remove();
        },

        updateName: function () {
            var attrs = this.model.toJSON(),
                uploadContainer = this.$('.photolayer-loader-container');

            $(uploadContainer).toggleClass('gmx-disabled', !attrs.fileName);
        },

        selectFile: function (e) {
            var files = e.target.files,
                form = this.$('#photo-uploader-form'),
                arr = [],
                progressBarContainer = this.$('.photolayer-progress-container'),
                progressBar = this.$('.progressbar');

            for (var key in files) {
                if (files.hasOwnProperty(key)) {
                    arr.push(files[key]);
                }
            }

            var attrs = this.model.toJSON(),
                _this = this,
                files = e.target.files,
                sandbox,
                uploadParams = {
                    sandbox: attrs.sandbox
                },
                params = {
                    Columns: "[]",
                    Copyright: "",
                    Description:"",
                    SourceType: "manual",
                    title: attrs.fileName,
                    IsPhotoLayer: true,
                    PhotoSource: JSON.stringify({sandbox: attrs.sandbox})
                },
                url, def;

                $(form).prop('action', window.serverBase + 'Sandbox/Upload' + '?' + $.param(uploadParams));

                var formData = new FormData($(form)[0]);

                formData.append("sandbox", attrs.sandbox);

                for (var i = 0; i < files.length; i++) {
                    formData.append(i, files[i]);
                }

                $(progressBar).progressbar({
                    max: 100,
                    value: 0
                });

                $(progressBarContainer).show();

                var xhr = new XMLHttpRequest();

                xhr.upload.addEventListener("progress", function(e) {
                        $(progressBar).progressbar('option', 'value', e.loaded / e.total * 100);
                }, false);

                xhr.open('POST', window.serverBase + 'Sandbox/Upload');
                xhr.withCredentials = true;
                xhr.onload = function () {
                    // _this.progressBar.hide();
                    if (xhr.status === 200) {
                        var response = xhr.responseText;

                        if (!(response)) {
                            return;
                        }

                        url = window.serverBase + 'VectorLayer/Insert.ashx' + '?' + $.param(params);
                        def = nsGmx.asyncTaskManager.sendGmxPostRequest(url);

                        def.done(function(taskInfo){
                            var mapProperties = window._layersTree.treeModel.getMapProperties(),
                                targetDiv = $(window._queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0],
                                gmxProperties = {type: 'layer', content: taskInfo.Result},
                                okButton = $(".photolayer-ok-button-container");

                        gmxProperties.content.properties.mapName = mapProperties.name;
                        gmxProperties.content.properties.hostName = mapProperties.hostName;
                        gmxProperties.content.properties.visible = true;

                        gmxProperties.content.properties.styles = [{
                            MinZoom: gmxProperties.content.properties.VtMaxZoom,
                            MaxZoom:21,
                            RenderStyle:window._mapHelper.defaultStyles[gmxProperties.content.properties.GeometryType]
                        }];

                        window._layersTree.copyHandler(gmxProperties, targetDiv, false, true);

                        var newLayer = nsGmx.gmxMap.layersByID[gmxProperties.content.properties.LayerID];

                        newLayer.bindPopup('')
                        .on('popupopen', function(ev) {
                            var popup = ev.popup,
                                props = ev.gmx.properties,
                                container = L.DomUtil.create('div', 'photoPopup'),
                                prop = L.DomUtil.create('div', 'photo', container),
                                image = L.DomUtil.create('img', 'photo-image-clickable', container),
                                params = {
                                    LayerID: popup.options.layerId,
                                    rowId: props.gmx_id,
                                    size: 'M',
                                    WrapStyle: 'None'
                                },
                                url = window.serverBase + 'rest/ver1/photo/getimage.ashx' + '?' + $.param(params);

                                L.extend(image, {
                                    // width: 300,
                                    galleryimg: 'no',
                                    onselectstart: L.Util.falseFn,
                                    onmousemove: L.Util.falseFn,
                                    onload: function(ev) {
                                        popup.update();
                                    },
                                    src: url
                                });
                                prop = L.DomUtil.create('div', 'myName', container);
                                prop.innerHTML = '<b>' + window._gtxt("Имя") + '</b> ' + props['GMX_Filename'];
                                prop = L.DomUtil.create('div', 'myName', container);
                                prop.innerHTML = '<b>' + window._gtxt("Момент съемки") + '</b> ' + props['GMX_Date'];
                                popup.setContent(container);

                                image.onclick = function () {
                                    var paramsBig = $.extend(params, {
                                        size: 'Native'
                                    }),
                                    url = window.serverBase + 'rest/ver1/photo/getimage.ashx' + '?' + $.param(paramsBig);

                                    window.open(url, '_blank');
                                }

                            }, newLayer);

                            $(progressBarContainer).hide();
                            $(okButton).show();
                        }).fail(function(taskInfo){
                            $(progressBarContainer).hide();
                        }).progress(function(taskInfo){
                    });
                }
            };

            xhr.send(formData);
        }
    });

    this.Load = function () {
        var view = new PhotoLayerView(),
            resizeFunc = function () {
            },
            closeFunc = function () {
                view.model.set({
                    photoLayersFlag: false,
                    photoLayers: []
                });
            };

            dialog = nsGmx.Utils.showDialog(_gtxt('photoLayer.load'), view.el, 340, 200, null, null, resizeFunc, closeFunc);
    }

    this.Unload = function () {
        $(dialog).remove();
    };
};

// }

var publicInterface = {
    pluginName: 'PhotoLayer',
    PhotoLayer: PhotoLayer
};

window.gmxCore.addModule('PhotoLayer',
    publicInterface
);

})(jQuery);
