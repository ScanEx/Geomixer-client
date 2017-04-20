var nsGmx = window.nsGmx || {},
    _gtxt = window._gtxt,
    Handlebars = window.Handlebars;

(function($) {

    window._translationsHash.addtext('rus', {
        photoLayer: {
            catalog: "Каталог",
            newCatalog: "в новый каталог",
            existingCatalog: "в существующий каталог",
            placeholder: "Введите имя каталога",
            name: "Имя каталога",
            available: "доступные каталоги",
            load: "Загрузить фотографии",
            loadShort: "ЗАГРУЗИТЬ",
            error: "ошибка",
            ok: "готово"
        }
    });

    window._translationsHash.addtext('eng', {
        photoLayer: {
            catalog: "Catalog",
            newCatalog: "into new catalog",
            existingCatalog: "into existing catalog",
            placeholder: "Type catalog name",
            name: "name",
            available: "available catalogs",
            load: "Load photos",
            loadShort: "LOAD",
            error: "error",
            ok: "done"
        }
    });

    var PhotoLayer = function () {
        var dialog;

    var PhotoLayerModel = window.Backbone.Model.extend({
        defaults: {
            fileName: null,
            photoLayersFlag: false,
            currentPhotoLayer: null,
            photoLayers: [],
            sandbox: ''
        }
    });


    var PhotoLayerView = window.Backbone.View.extend({
        tagName: 'div',
        model: new PhotoLayerModel(),
        template: Handlebars.compile('' +
            '<div class="photolayer-ui-container photolayer-properties-container">' +
                '<div class="photolayer-ui-container photolayer-catalog-selector-container">' +
                    '{{#if photoLayersFlag}}' +
                    '<span class="select-catalog-button existing-catalog-button">{{i "photoLayer.existingCatalog"}}</span>' +
                    '{{/if}}' +
                    '<span class="select-catalog-button new-catalog-button">{{i "photoLayer.newCatalog"}}</span>' +
                '</div>' +
                '<div class="photolayer-ui-container photolayer-newlayer-input-container"' +
                '{{#if photoLayersFlag}}' +
                'style="display:none"' +
                '{{/if}}' +
                '>' +
                    '<span class="photolayer-title photolayer-name-title">{{i "photoLayer.name"}}</span>' +
                    '<input type="text" class="photolayer-name-input photolayer-newlayer-input minInputStyle"/>' +
                '</div>' +
                '<div class="photolayer-ui-container photolayer-existinglayer-input-container" ' +
                '{{#unless photoLayersFlag}}' +
                'style="display:none"' +
                '{{/unless}}' +
                '>' +
                    '<span class="photolayer-title photolayer-name-title">{{i "photoLayer.name"}}</span>' +
                    '<select class="photolayer-name-input photolayer-existinglayer-input">' +
                        '{{#each this.photoLayers}}' +
                        '<option value="{{this.layer}}"' +
                            '{{#if this.current}} selected="selected"{{/if}}>' +
                            '{{this.layer}}' +
                        '</option>' +
                        '{{/each}}' +
                    '</select>' +
                '</div>' +
                '<div class="photolayer-ui-block photolayer-loader-block">' +
                        '<label class="photo-uploader-label">' +
                        '<span class="photo-uploader-button">{{i "photoLayer.loadShort"}}</span>' +
                            '<form id="photo-uploader-form" name="photouploader" enctype="multipart/form-data" method="post">' +
                                '<input type="file" name="file" id="photo-uploader" accept="image/*" multiple></input>' +
                            '</form>' +
                        '</label>' +
                    '<span class="photolayer-progress-container">' +
                        '<span class="progressbar"></span>' +
                    '</span>' +
                    '<span class="photolayer-ui-container photolayer-ok-button-container" style="display:none">' +
                        '<span class="ok-button">{{i "photoLayer.ok"}}</span>' +
                    '</span>' +
                    '<span class="photolayer-error-message" style="display:none"></span>' +
                '</div>' +
            '</div>'
        ),

        events: {
            'click .select-catalog-button': 'setCatalogType',
            'keyup .photolayer-newlayer-input': 'setName',
            'change .photolayer-existinglayer-input': 'setCurrentLayer',
            'change #photo-uploader': 'selectFile'
        },

        initialize: function () {
            this.getPhotoLayers();
            this.createSandbox();
            this.render();

            this.listenTo(this.model, 'change:fileName', this.updateName);
            this.listenTo(this.model, 'change:photoLayers', this.updatePhotoLayersList);
        },

        render: function () {
            var attrs = this.model.toJSON();

            this.$el.html(this.template(this.model.toJSON()));
            this.updatePhotoLayersList();

            var firstButton = this.$('.select-catalog-button')[0],
                uploadBlock = this.$('.photo-uploader-label').add(this.$('.photo-uploader-button'));

            $(firstButton).addClass('active');

            $(uploadBlock).toggleClass('gmx-disabled', !attrs.photoLayersFlag);
            this.$('.photolayer-newlayer-input').prop('placeholder', _gtxt('photoLayer.placeholder'))
        },

        getPhotoLayers: function (layers) {
            var layers = layers || nsGmx.gmxMap.layers,
                attrs = this.model.toJSON(),
                photoLayersFlag = attrs.photoLayersFlag,
                currentPhotoLayer,
                photoLayers = [];

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i],
                    props = layer.getGmxProperties(),
                    isPhotoLayer;

                if (props) {
                    isPhotoLayer = props.IsPhotoLayer;

                    if (isPhotoLayer && props.Access === 'edit') {
                        photoLayersFlag = true;

                        photoLayers.push({layer: props.title, LayerID: props.LayerID, current: false});
                    }
                }

                for (var j = 0; j < photoLayers.length; j++) {
                    photoLayers[j].current = j === 0;

                    if (j === 0) {
                        currentPhotoLayer = nsGmx.gmxMap.layersByID[photoLayers[j].LayerID];
                    }
                }
            }

            this.model.set({
                photoLayersFlag: photoLayersFlag,
                photoLayers: photoLayers,
                currentPhotoLayer: currentPhotoLayer
            });
        },

        setCatalogType: function (e) {
            var attrs = this.model.toJSON(),
                newCatalog = $(e.target).hasClass('new-catalog-button'),
                newContainer = $('.photolayer-newlayer-input-container'),
                existingContainer = $('.photolayer-existinglayer-input-container'),
                newLayerInput = this.$('.photolayer-newlayer-input'),
                uploadBlock = this.$('.photo-uploader-label').add(this.$('.photo-uploader-button'));

            if (newCatalog) {
                $(uploadBlock).toggleClass('gmx-disabled', !attrs.fileName);
                $(newContainer).toggle(true);
                $(existingContainer).toggle(false);
                $(e.target).toggleClass('active', true);
                $('.existing-catalog-button').toggleClass('active', false);
                $(newLayerInput).focus();

                this.model.set({
                    photoLayers: [],
                    fileName: null,
                    currentPhotoLayer: null
                });

                this.createSandbox();
            } else {
                this.getPhotoLayers();
                $(uploadBlock).toggleClass('gmx-disabled', false);
                $(existingContainer).toggle(true);
                $(newContainer).toggle(false);
                $(e.target).toggleClass('active', true);
                $('.new-catalog-button').toggleClass('active', false);
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

        setCurrentLayer: function (e) {
            var layers = nsGmx.gmxMap.layers,
                currentPhotoLayer;


            for (var i = 0, len = layers.length; i < len; i++) {
                var layer = layers[i],
                    props = layer.getGmxProperties();

                if (props && props.title === e.target.value) {
                    currentPhotoLayer = layer;
                    break;
                }
            }

            this.model.set({
                currentPhotoLayer: currentPhotoLayer
            });
        },

        updateName: function () {
            var attrs = this.model.toJSON(),
                newLayerInput = this.$('.photolayer-newlayer-input'),
                uploadBlock = this.$('.photo-uploader-label').add(this.$('.photo-uploader-button'));

            $(newLayerInput).val(attrs.fileName);
            $(uploadBlock).toggleClass('gmx-disabled', !attrs.fileName);
        },

        updatePhotoLayersList: function () {
            var attrs = this.model.toJSON(),
                photoLayers = attrs.photoLayers,
                currentPhotoLayerName = attrs.currentPhotoLayer && attrs.currentPhotoLayer.getGmxProperties().title,
                str = '',
                select = this.$('.photolayer-existinglayer-input');

            if (photoLayers.length) {
                for (var i = 0; i < photoLayers.length; i++) {
                    str += '<option>' + photoLayers[i].layer + '</option>';
                }
            }
            $(select).html(str);

            $('.photolayer-existinglayer-input option[value="' + currentPhotoLayerName + '"]').prop('selected', true);
        },

        selectFile: function (e) {
            var files = e.target.files,
                form = this.$('#photo-uploader-form'),
                arr = [],
                newLayerInput = this.$('.photolayer-newlayer-input'),
                uploadButton = this.$('.photo-uploader-button'),
                progressBarContainer = this.$('.photolayer-progress-container'),
                progressBar = this.$('.progressbar'),
                okButton = this.$('.photolayer-ok-button-container')
                errorMessage = this.$('.photolayer-error-message');

            for (var key in files) {
                if (files.hasOwnProperty(key)) {
                    arr.push(files[key]);
                }
            }

            $(progressBarContainer).hide();
            $(okButton).hide();
            $(errorMessage).hide();

            var attrs = this.model.toJSON(),
                _this = this,
                files = e.target.files,
                sandbox,
                uploadParams = {
                    sandbox: attrs.sandbox
                },
                params,
                url, def;

                if (attrs.currentPhotoLayer) {
                    params = {
                        LayerID: attrs.currentPhotoLayer.getGmxProperties().LayerID,
                        PhotoSource: JSON.stringify({sandbox: attrs.sandbox})
                    }
                } else {
                    params = {
                        Columns: "[]",
                        Copyright: "",
                        Description:"",
                        SourceType: "manual",
                        title: attrs.fileName,
                        IsPhotoLayer: true,
                        PhotoSource: JSON.stringify({sandbox: attrs.sandbox})
                    }
                };

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
                $(uploadButton).toggleClass('gmx-disabled', true);
                xhr.withCredentials = true;
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        var response = xhr.responseText;

                        if (!(response)) {
                            return;
                        }

                        if (attrs.currentPhotoLayer) {
                            url = window.serverBase + 'Photo/AppendPhoto' + '?' + $.param(params);
                        } else {
                            url = window.serverBase + 'VectorLayer/Insert.ashx' + '?' + $.param(params);
                        }
                        def = nsGmx.asyncTaskManager.sendGmxPostRequest(url);

                        def.done(function(taskInfo){
                            if (!attrs.currentPhotoLayer) {
                                var mapProperties = window._layersTree.treeModel.getMapProperties(),
                                    targetDiv = $(window._queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0],
                                    gmxProperties = {type: 'layer', content: taskInfo.Result},
                                    imageUrlParams = {
                                        LayerID: gmxProperties.content.properties.LayerID,
                                        size: 'M'
                                    },
                                    bigImageUrlParams = {
                                        LayerID: gmxProperties.content.properties.LayerID,
                                        size: 'Native'
                                    },
                                    imageUrl = window.serverBase + 'rest/ver1/photo/getimage.ashx' + '?' + $.param(imageUrlParams) + '&rowId=[gmx_id]',
                                    bigImageUrl = window.serverBase + 'rest/ver1/photo/getimage.ashx' + '?' + $.param(bigImageUrlParams) + '&rowId=[gmx_id]',
                                    onld = function () {
                                        console.log(this);
                                        console.log('uuu');
                                    },
                                    balloonString = '' +
                                        '<div style="min-width: 300px;">' +
                                            '<div style="width: 100%; text-align: center;">' +
                                                '<a href="' + bigImageUrl + '" target="_blank">' +
                                                    '<img class="popupImage" src="' + imageUrl + '" alt=""/>' +
                                                '</a>' +
                                            '</div>' +
                                            '<div>' +
                                                '<b>' + window._gtxt("Имя") + '</b> ' + '[GMX_Filename]' +
                                            '</div>' +
                                            '<div>' +
                                                '<b>' + window._gtxt("Момент съемки") + '</b> ' + '[GMX_Date]' +
                                            '</div>' +
                                        '</div>';

                                gmxProperties.content.properties.mapName = mapProperties.name;
                                gmxProperties.content.properties.hostName = mapProperties.hostName;
                                gmxProperties.content.properties.visible = true;

                                gmxProperties.content.properties.styles = [{
                                    MinZoom: gmxProperties.content.properties.VtMaxZoom,
                                    MaxZoom:21,
                                    Balloon: balloonString,
                                    RenderStyle: _mapHelper.defaultPhotoIconStyles[gmxProperties.content.properties.GeometryType]
                                }];

                                window._layersTree.copyHandler(gmxProperties, targetDiv, false, true);

                                var newLayer = nsGmx.gmxMap.layersByID[gmxProperties.content.properties.LayerID];

                                _this.model.set({
                                    currentPhotoLayer: newLayer
                                });

                                // вставляем фотослой на карту
                                var modifyMapObjects = [{
                                        Action: 'insert',
                                        index: 'top',
                                        LayerName: gmxProperties.content.properties.LayerID,
                                        Styles: gmxProperties.content.properties.styles
                                    }],
                                    modifyMapParams = {
                                        MapName: mapProperties.MapID,
                                        Objects: JSON.stringify(modifyMapObjects)
                                    }
                                    modifyMapUrl = window.serverBase + 'Map/ModifyMap.ashx' + '?' + $.param(modifyMapParams);

                                window.sendCrossDomainJSONRequest(modifyMapUrl, function (res) {
                                });

                            $(newLayerInput).focus();

                            } else {
                                L.gmx.layersVersion.chkVersion(attrs.currentPhotoLayer, null);
                            }

                            $(okButton).show();
                            $(uploadButton).toggleClass('gmx-disabled', false);

                            _this.createSandbox();

                        }).fail(function(taskInfo){
                            var message = taskInfo.ErrorInfo && taskInfo.ErrorInfo.ErrorMessage;

                            debugger;
                            $(progressBarContainer).hide();

                            $(errorMessage).html(message in _mapHelper.customErrorsHash  ? _gtxt(_mapHelper.customErrorsHash[message]) : _gtxt('photoLayer.error'));
                            $(errorMessage).show();
                            $(uploadButton).toggleClass('gmx-disabled', false);

                            _this.createSandbox();

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
                    photoLayers: [],
                    currentPhotoLayer: null,
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
