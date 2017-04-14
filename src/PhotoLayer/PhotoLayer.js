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
            load: "Загрузить фотографии"
        }
    });

    window._translationsHash.addtext('eng', {
        photoLayer: {
            catalog: "Catalog",
            newCatalog: "new",
            existingCatalog: "existing",
            name: "name",
            available: "available catalogs",
            load: "Load photos"
        }
    });

    var PhotoLayerModel = window.Backbone.Model.extend({
        defaults: {
            newCatalog: true,
            fileName: '',
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
                    '<label class="photolayer-catalog-label">' +
                        '<input class="select-catalog-input existing-catalog-input" type="radio" name={{i "photoLayer.catalog"}}></input>' +
                        '{{i "photoLayer.existingCatalog"}}' +
                    '</label>' +
                '</div>' +
                '<div class="photolayer-ui-container photolayer-newlayer-input-container">' +
                    '<span class="photolayer-title photolayer-name-title">{{i "photoLayer.name"}}</span>' +
                    '<input type="text" class="photolayer-name-input photolayer-newlayer-input inputStyle" value={{fileName}}></input>' +
                '</div>' +
                '<div class="photolayer-ui-container photolayer-existinglayer-input-container" style="display:none">' +
                    '<span class="photolayer-title photolayer-name-title">{{i "photoLayer.available"}}</span>' +
                    '<input type="select" class="photolayer-name-input photolayer-existinglayer-input"></input>' +
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
            '</div>'
        ),

        events: {
            'change .select-catalog-input': 'setCatalogType',
            'change .photolayer-newlayer-input': 'setName',
            'change #photo-uploader': 'selectFile'
        },

        initialize: function () {
            this.createSandbox();
            this.render();
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
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

        selectFile: function (e) {
            var files = e.target.files,
                form = this.$('#photo-uploader-form'),
                arr = [];

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
                progressBar = this.$('.progressbar'),
                url, def;

                $(form).prop('action', window.serverBase + 'Sandbox/Upload' + '?' + $.param(uploadParams));

                var formData = new FormData($(form)[0]);

                formData.append("sandbox", attrs.sandbox);

                for (var i = 0; i < files.length; i++) {
                    console.log(files[i]);
                    formData.append(i, files[i]);
                }

                    var xhr = new XMLHttpRequest();

                    xhr.open('POST', window.serverBase + 'Sandbox/Upload');
                    xhr.withCredentials = true;
                    xhr.onload = function () {
                        // _this.progressBar.hide();
                        if (xhr.status === 200) {
                            var response = xhr.responseText;

                            if (!(response)) {
                                return;
                            }

                            console.log(response);

                            url = window.serverBase + 'VectorLayer/Insert.ashx' + '?' + $.param(params);
                            def = nsGmx.asyncTaskManager.sendGmxPostRequest(url);

                            def.done(function(taskInfo){
                                console.log(taskInfo);

                            }).fail(function(taskInfo){
                                console.log('fail');
                                console.log(taskInfo);
                            }).progress(function(taskInfo){
                                console.log('in progress');
                                console.log(taskInfo);

                                if (taskInfo.Status === 'queue') {
                                //     $(spinMessage).html(window._gtxt('mapExport.inQueue'));
                                } else if (taskInfo.Status === 'progress') {
                                //     $(spinMessage).html(window._gtxt('mapExport.inProcess'));
                                //
                                    // $(progressBar).progressbar('value', taskInfo.Progress);
                                }
                            });
                        }
                    };

                    xhr.send(formData);
                    console.log(attrs.sandbox);

                // window.sendCrossDomainPostRequest(window.serverBase + 'Sandbox/Upload' + '?' + $.param(uploadParams) + formData, function(response) {
                //     console.log(response);
                //     if (parseResponse(response) && response.Result) {
                //
                //     }
                // });


                // fetch(url, {mode: 'cors'})
                //     .then(function(res) {
                //         if (res.status === 200 && !res.bodyUsed) {
                //             return res.text();
                //         }
                //     })
                //     .then(function(res) {
                //         // remove first && last parentheses
                //         res = JSON.parse(res.substring(1, res.length - 1));
                //         console.log(res);
                //     })
                //     .catch(console.log);

            console.log(files);
        }
    });

    var PhotoLayerWidget = function () {
        this.loadPhotos = function () {
            var view = new PhotoLayerView();
            nsGmx.Utils.showDialog(_gtxt('photoLayer.load'), view.el, 340, 200, false, false);
        }
    };

    nsGmx.PhotoLayerWidget = PhotoLayerWidget;

})(jQuery);
