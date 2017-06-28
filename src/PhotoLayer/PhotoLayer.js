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
            processing: "обработка изображений",
            error: "ошибка",
            successResult: "загружено фотографий",
            exifError: "ошибка чтения координат",
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
            processing: "image processing",
            error: "error",
            successResult: "images uploaded",
            exifError: "coordinates error",
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
                    '<span class="photolayer-spin-container" style="display:none">' +
                        '<img src="img/progress.gif"/>' +
                        '<span class="spin-message">{{i "photoLayer.processing"}}</span>' +
                    '</span>' +
                    '<span class="photolayer-ui-container photolayer-ok-button-container" style="display:none">' +
                        '<span class="ok-button">{{i "photoLayer.ok"}}</span>' +
                    '</span>' +
                    '<span class="photolayer-error-message" style="display:none"></span>' +
                '</div>' +
                '<div class="photo-upload-result photo-upload-result-uploaded" style="display:none">' +
                '</div>' +
                '<div class="photo-upload-result photo-upload-result-error" style="display:none">' +
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
            var layers = layers || nsGmx.gmxMap.layers,
                attrs = this.model.toJSON(),
                start = e.target.selectionStart,
                end = e.target.selectionEnd,
                matchingLayer;

            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i],
                    props = layer.getGmxProperties();

                if (props) {
                    if (e.target.value === props.title) {
                        matchingLayer = layer;
                    }
                }
            }

            this.model.set('fileName', e.target.value);

            this.model.set('currentPhotoLayer', matchingLayer ? matchingLayer : null);

            // восстановим позицию курсора
            e.target.setSelectionRange(start, end);
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
                uploadLabel = this.$('.photo-uploader-label'),
                uploadButton = this.$('.photo-uploader-button'),
                progressBarContainer = this.$('.photolayer-progress-container'),
                progressBar = this.$('.progressbar'),
                spinContainer = this.$('.photolayer-spin-container'),
                okButton = this.$('.photolayer-ok-button-container'),
                uploadResSuccess = this.$('.photo-upload-result-uploaded'),
                uploadResError = this.$('.photo-upload-result-error'),
                errorMessage = this.$('.photolayer-error-message');

            for (var key in files) {
                if (files.hasOwnProperty(key)) {
                    arr.push(files[key]);
                }
            }

            $(progressBarContainer).hide();
            $(spinContainer).hide();
            $(okButton).hide();
            $(errorMessage).hide();
            $(uploadResSuccess).hide();
            $(uploadResError).hide();

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
                        Description: "",
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
                $(uploadLabel).toggleClass('gmx-disabled', true);
                xhr.withCredentials = true;
                xhr.onload = function () {
                    if (xhr.status === 200) {
                        var response = xhr.responseText;

                        if (!(response)) {
                            return;
                        }

                        $(progressBarContainer).hide();
                        $(spinContainer).show();

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
                                    balloonString = '' +
                                        '<div style="min-width: 300px;">' +
                                            '<div style="width: 100%; text-align: center;">' +
                                                '<a href="' + bigImageUrl + '" target="_blank">' +
                                                    '<img class="popupImage" src="' + imageUrl + '" alt=""/>' +
                                                '</a>' +
                                            '</div>' +
                                            '<div>' +
                                                '<b>' + window._gtxt("Имя") + ':</b> ' + '[GMX_Filename]' +
                                            '</div>' +
                                            '<div>' +
                                                '<b>' + window._gtxt("Момент съемки") + ':</b> ' + '[GMX_Date]' +
                                            '</div>' +
                                            '<div>' +
                                                '[SUMMARY]' +
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

                                // вставляем фотографии в пустой слой
                                var photoAppendParams = {
                                        LayerID: gmxProperties.content.properties.LayerID,
                                        PhotoSource: JSON.stringify({sandbox: attrs.sandbox})
                                    },
                                    photoAppendUrl = window.serverBase + 'Photo/AppendPhoto' + '?' + $.param(photoAppendParams);

                                window.sendCrossDomainJSONRequest(modifyMapUrl, function (res) {
                                    var def = nsGmx.asyncTaskManager.sendGmxPostRequest(photoAppendUrl);

                                    def.done(function(taskInfo) {

                                        parseGeometry(taskInfo, gmxProperties);

                                        window._layersTree.copyHandler(gmxProperties, targetDiv, false, true);

                                        var newLayer = nsGmx.gmxMap.layersByID[gmxProperties.content.properties.LayerID];

                                        newLayer.bindClusters({
                                            iconCreateFunction: function(cluster) {
                                                var photoClusterIcon = L.divIcon({
                                                    html: '<img src="http://maps.kosmosnimki.ru/api/img/camera18.png" class="photo-icon"/><div class="marker-cluster-photo">' + cluster.getChildCount() + '</div>',
                                                    className: 'photo-div-icon',
                                                    iconSize: [14, 12],
                                                    iconAnchor: [0, 0]
                                                });
                                                return photoClusterIcon;
                                            },
                                            maxClusterRadius: 40,
                                            spiderfyOnMaxZoom: true,
                                            spiderfyDistanceMultiplier: 1.2,
                                            disableClusteringAtZoom: 19,
                                            maxZoom: 19
                                        });

                                        // newLayer.updateVersion(gmxProperties.content);

                                        _this.model.set({
                                            currentPhotoLayer: newLayer
                                        });

                                        afterLoad(taskInfo);
                                    })
                                    .fail(function(taskInfo) {
                                        var message = taskInfo.ErrorInfo && taskInfo.ErrorInfo.ErrorMessage;

                                        $(errorMessage).html(message in _mapHelper.customErrorsHash  ? _gtxt(_mapHelper.customErrorsHash[message]) : _gtxt('photoLayer.error'));
                                        $(errorMessage).show();
                                        afterLoad(taskInfo);
                                    }).progress(function(taskInfo){
                                    });
                                });

                            $(newLayerInput).focus();

                            } else {
                                var curName = attrs.currentPhotoLayer.getGmxProperties().name;
                                // parseGeometry(taskInfo, gmxProperties);
                                // window.sendCrossDomainJSONRequest(window.serverBase + "Layer/GetLayerJson.ashx?WrapStyle=func&LayerName=" + curName, function(response) {
                                //     if (!parseResponse(response)) {
                                //         return;
                                //     }
                                //     debugger;
                                //     console.log(response);
                                //     // L.gmx.layersVersion.chkVersion(response.Result, null);
                                //     attrs.currentPhotoLayer.updateVersion(response.Result);
                                // });
                                // L.gmx.layersVersion.chkVersion(gmxProperties.content);
                                // attrs.currentPhotoLayer.updateVersion(gmxProperties.content);

                                afterLoad(taskInfo);
                            }

                        }).fail(function(taskInfo){
                            var message = taskInfo.ErrorInfo && taskInfo.ErrorInfo.ErrorMessage;

                            $(errorMessage).html(message in _mapHelper.customErrorsHash  ? _gtxt(_mapHelper.customErrorsHash[message]) : _gtxt('photoLayer.error'));
                            $(errorMessage).show();
                            afterLoad(taskInfo);

                        }).progress(function(taskInfo){
                        });
                    };

                    function parseGeometry(info, properties) {
                        var coords = [],
                            appended = info.Result.Appended,
                            updated = info.Result.Updated,
                            addCoords = function (objects, coordinates) {
                                for (var a = 0; a < objects.length; a++) {
                                    if (objects[a].longitude && objects[a].latitude) {
                                        var point = nsGmx.leafletMap.options.crs.project(L.latLng(objects[a].longitude, objects[a].latitude));
                                        coordinates.push([point.x, point.y]);
                                    }
                                }
                            };

                        addCoords(appended, coords);
                        addCoords(updated, coords);

                        if (!coords.length) {
                            properties.content.geometry = null;
                        } else {
                            properties.content.geometry.coordinates = coords.length === 1 ? coords[0] : coords;
                            properties.content.geometry.type = coords.length === 1 ? 'POINT' : 'POLYGON';
                        }
                    }

                    function afterLoad(taskInfo) {
                        var resObj = taskInfo.Result;

                        if (resObj) {
                            if (resObj.Appended.length) {
                                $(uploadResSuccess).html(_gtxt('photoLayer.successResult') + ": " + resObj.Appended.length);
                                $(uploadResSuccess).show();
                            }
                            if (resObj.NoCoords.length) {
                                $(uploadResError).html(_gtxt('photoLayer.exifError') + ": " + resObj.NoCoords.length);
                                $(uploadResError).show();
                            }
                        }

                        $(spinContainer).hide();

                        $(uploadButton).toggleClass('gmx-disabled', false);
                        $(uploadLabel).toggleClass('gmx-disabled', false);
                        _this.createSandbox();
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

        dialog = nsGmx.Utils.showDialog(_gtxt('photoLayer.load'), view.el, 340, 220, null, null, resizeFunc, closeFunc);
    }

    this.Unload = function () {
        $(dialog).remove();
    };
};

var publicInterface = {
    pluginName: 'PhotoLayer',
    PhotoLayer: PhotoLayer
};

window.gmxCore.addModule('PhotoLayer',
    publicInterface
);

})(jQuery);
