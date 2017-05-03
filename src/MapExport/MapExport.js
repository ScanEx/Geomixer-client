var nsGmx = window.nsGmx || {};

(function() {

    var MAX_SIZE = 10000;

    // мы не хотим, чтобы рамка фигурировала в списке пользовательских объектов
    nsGmx.DrawingObjectCustomControllers.addDelegate({
        isHidden: function(obj) {
            if (obj.options.exportRect) {
                return true;
            }
            return false;
        }
    });

    window._translationsHash.addtext('rus', {
        mapExport: {
            settings: {
                settings: 'Настройки экспорта карты:',
                zoom: 'масштаб (зум)',
                size: 'размер',
                format: 'формат растра',
                fileType: 'тип файла',
                width: 'ширина (пк)',
                height: 'высота (пк)',
                name: 'имя файла'
            },
            formats: {
                jpeg: 'JPEG',
                png: 'PNG'
            },
            filetypes: {
                raster: 'растр',
                mbTiles: 'MBTiles',
                kmz: 'kmz'
            },
            select: 'Выделить область карты',
            unselect: 'Снять выделение',
            zoomToBox: 'Перейти к выделенному',
            zoomToLevel: 'Перейти на зум',
            exportMap: 'Экспорт',
            cancel: 'Отмена',
            sizeWarn: 'максимальный размер - 10000 пикселей',
            valueWarn: 'недопустимое значение',
            inQueue: 'в очереди',
            inProcess: 'файл формируется',
            exportError: 'ошибка экспорта'
        }
    });
    window._translationsHash.addtext('eng', {
        mapExport: {
            exportTooltip: 'Select area',
            settings: {
                settings: 'Map export settings:',
                zoom: 'zoom',
                size: 'size',
                format: 'raster format',
                fileType: 'file type',
                width: 'width (px)',
                height: 'height (px)',
                name: 'file name'
            },
            formats: {
                jpeg: 'JPEG',
                png: 'PNG'
            },
            filetypes: {
                raster: 'raster',
                mbTiles: 'MBTiles',
                kmz: 'kmz'
            },
            select: 'Select',
            unselect: 'Clear selection',
            zoomToBox: 'Zoom to selected',
            zoomToLevel: 'Zoom to level',
            exportMap: 'Export',
            cancel: 'Cancel',
            sizeWarn: 'incorrect size',
            valueWarn: 'incorrect value',
            inQueue: 'waiting',
            inProcess: 'processing file',
            exportError: 'export error'
        }
    });

    var formatTypes = [
        'jpeg',
        'png'
    ];

    var view;

    var MapExportMenu = function () {
        var canvas = nsGmx.Utils._div(null, [['dir','className','mapExportConfigLeftMenu']]);

        var ExportModel = window.Backbone.Model.extend({
            defaults: {
                lm: new window.leftMenu(),
                lmap: nsGmx.leafletMap,
                selArea: null,
                exportMode: true,
                width: 0,
                height: 0,
                widthValueErr: false,
                heightValueErr: false,
                widthSizeErr: false,
                heightSizeErr: false,
                format: null,
                fileType: null,
                x: null,
                y: null,
                z: null,
                latLng: null,
                coords: null,
                zoomLevels: getZoomLevels(),
                formatTypes: getTypes(formatTypes),
                fileTypes: null,
                name: '',
                taskInfo: null,
                exportErr: false
            }
        });

        var model = new ExportModel();

        var ExportView = window.Backbone.View.extend({
            el: $(canvas),
            model: model,
            template: window.Handlebars.compile(
                '<div class="selectButtons">' +
                        '<span class="buttonLink areaButton mapExportSelectButton"> {{i "mapExport.select"}}</span>' +
                        '<span class="zoomToBoxButton" style="display:none">' +
                        '</span>' +
                '</div>' +
                '<div class="exportSettings">' +
                    '<span>' +
                        '{{i "mapExport.settings.settings"}}' +
                    '</span>' +
                '</div>' +
                '<table class="settings">' +
                    '<tbody>' +
                        '<tr class="zoomSelect">' +
                            '<td class="eLabel">{{i "mapExport.settings.zoom"}}</td>' +
                            '<td class="eInput">' +
                                '<select class="zoomLevel">' +
                                    '{{#each this.zoomLevels}}' +
                                    '<option value="{{this.zoom}}"' +
                                        '{{#if this.current}} selected="selected"{{/if}}>' +
                                        '{{this.zoom}}' +
                                    '</option>' +
                                    '{{/each}}' +
                                '</select>' +
                            '</td>' +
                            '<td class="zoomToLevel">' +
                                '<span class="zoomToLevelButtonWrap" style="display:none">' +
                                '</span>' +
                            '</td>' +
                        '</tr>' +
                        '<tr class="dims">' +
                            '<td class="eLabel">{{i "mapExport.settings.width"}}</td>' +
                            '<td class="eInput">' +
                                '<input type="text" class="mapExportWidth" value="{{width}}"/>' +
                            '</td>' +
                            '<td class="mapExportWarn" rowspan=2></td>' +
                        '</tr>' +
                        '<tr class="dims">' +
                            '<td class="eLabel">{{i "mapExport.settings.height"}}</td>' +
                            '<td class="eInput">' +
                                '<input type="text" class="mapExportHeight" value="{{height}}"/>' +
                            '</td>' +
                        '</tr>' +
                        '<tr class="formatSelect">' +
                            '<td class="eLabel">{{i "mapExport.settings.format"}}</td>' +
                            '<td class="eInput">' +
                                '<select class="formatTypes">' +
                                    '{{#each this.formatTypes}}' +
                                    '<option value="{{this.type}}"' +
                                        '{{#if this.current}} selected="selected" {{/if}}>' +
                                        '{{this.type}}' +
                                    '</option>' +
                                    '{{/each}}' +
                                '</select>' +
                            '</td>' +
                        '</tr>' +
                        '<tr class="typeSelect">' +
                            '<td class="eLabel">{{i "mapExport.settings.fileType"}}</td>' +
                            '<td class="eInput">' +
                                '<select class="fileTypes">' +
                                    '{{#each this.fileTypes}}' +
                                    '<option value="{{this.type}}"' +
                                        '{{#if this.current}} selected="selected" {{/if}}>' +
                                        '{{this.type}}' +
                                    '</option>' +
                                    '{{/each}}' +
                                '</select>' +
                            '</td>' +
                        '</tr>' +
                        '<tr class="nameSelect">' +
                            '<td class="eLabel">{{i "mapExport.settings.name"}}</td>' +
                            '<td class="eInput">' +
                                '<input type="text" class="mapExportName" value=""/>' +
                            '</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>' +
                '<div class="exportWrap">' +
                    '<div class="export">' +
                        '<span class="buttonLink mapExportButton"> {{i "mapExport.exportMap"}}</span>' +
                        '<span class="buttonLink cancelButton" style="display:none"> {{i "mapExport.cancel"}}</span>' +
                        '<span class="spinHolder" style="display:none">' +
                            // '<img src="img/progress.gif"/>' +
                            '<span class="spinMessage"></span>' +
                            '</span>' +
                        '<span class="exportErrorMessage" style="display:none">{{i "mapExport.exportError"}}</span>' +
                    '</div>' +
                    '<div class="export-progress-container" style="display:none">' +
                        '<div class="export-progressbar"></div>' +
                    '</div>' +
                '</div>'
            ),
            events: {
                'click .mapExportSelectButton': 'selectArea',
                'click .mapExportUnselectButton': 'unselectArea',
                'click .zoomToBoxButton': 'zoomToBox',
                'click .zoomToLevelButtonWrap': 'zoomToLevel',
                'input .mapExportWidth': 'resize',
                'input .mapExportHeight': 'resize',
                'change .zoomLevel': 'setZoom',
                'change .formatTypes': 'setFormat',
                'change .fileTypes': 'setFileType',
                'input .mapExportName': 'setName',
                'click .mapExportButton': 'exportMap',
                'click .cancelButton': 'cancelExport'
            },

            initialize: function () {
                var attrs = this.model.toJSON(),
                    currentZoom = attrs.lmap.getZoom(),
                    zoomLevels = attrs.zoomLevels,
                    formatTypes = attrs.formatTypes,

                    // объявление типов файлов происходит здесь, так как необходима обработка смены языка
                    // типы файлов хранятся в текущем языке
                    fileTypes = [
                        window._gtxt('mapExport.filetypes.raster'),
                        window._gtxt('mapExport.filetypes.mbTiles'),
                        window._gtxt('mapExport.filetypes.kmz')
                    ];
                    updatedFileTypes = getTypes(fileTypes);

                this.listenTo(this.model, 'change:selArea', this.updateArea);
                this.listenTo(this.model, 'change:width', this.updateSize);
                this.listenTo(this.model, 'change:height', this.updateSize);
                this.listenTo(this.model, 'change:widthValueErr', this.handleValueError);
                this.listenTo(this.model, 'change:heightValueErr', this.handleValueError);
                this.listenTo(this.model, 'change:widthSizeErr', this.handleSizeError);
                this.listenTo(this.model, 'change:heightSizeErr', this.handleSizeError);
                this.listenTo(this.model, 'change:name', this.updateName);
                this.listenTo(this.model, 'change:z', this.updateZoom);
                this.listenTo(this.model, 'change:exportErr', this.handleExportError);

                for (var i = attrs.lmap.getMinZoom(); i < zoomLevels.length; i++) {
                    zoomLevels[i].current = false;

                    if (i === currentZoom) {
                        zoomLevels[i].current = true;
                    }
                }

                for (var j = 0; j < formatTypes.length; j++) {
                    if (formatTypes[j].current === true) {
                        this.model.set('format', formatTypes[j].type);
                    }
                }

                for (var j = 0; j < updatedFileTypes.length; j++) {
                    if (updatedFileTypes[j].current === true) {
                        this.model.set('fileType', updatedFileTypes[j].type);
                    }
                }

                this.model.set({
                    z: currentZoom,
                    zoomLevels: zoomLevels,
                    formatTypes: formatTypes,
                    fileTypes: updatedFileTypes,
                    name: nsGmx.gmxMap.properties.title
                });

                this.updateArea();

                this.render();
            },

            render: function () {
                var zoomToBoxButton,
                    zoomToLevelButton;

                this.$el.html(this.template(this.model.toJSON()));
                this.$('.zoomLevel').prop('disabled', true)
                this.$('.mapExportWidth').prop('disabled', true);
                this.$('.mapExportHeight').prop('disabled', true);
                this.$('.formatTypes').prop('disabled', true);
                this.$('.fileTypes').prop('disabled', true);
                this.$('.mapExportName').val(this.model.get('name'));
                this.$('.mapExportName').prop('disabled', true);
                this.$('.mapExportButton').addClass('gmx-disabled');

                zoomToBoxButton = nsGmx.Utils.makeImageButton('img/zoom_to_box_tool_small.png', 'img/zoom_to_box_tool_small.png');
                nsGmx.Utils._title(zoomToBoxButton, window._gtxt('mapExport.zoomToBox'));

                this.$('.zoomToBoxButton').append(zoomToBoxButton);

                zoomToLevelButton = nsGmx.Utils.makeImageButton('img/zoom_to_level_tool_small.png', 'img/zoom_to_level_tool_small.png');
                $(zoomToLevelButton).addClass('zoomToLevelButton');
                nsGmx.Utils._title(zoomToLevelButton, (window._gtxt('mapExport.zoomToLevel') + ' ' + this.model.get('z')));

                this.$('.zoomToLevelButtonWrap').append(zoomToLevelButton);

                return this;
            },

            updateArea: function () {
                var attrs = this.model.toJSON(),
                    areaButton = this.$('.areaButton'),
                    zoomToBoxButton = this.$('.zoomToBoxButton'),
                    zoomToLevelButton = this.$('.zoomToLevelButtonWrap'),
                    zoomSelect = this.$('.zoomLevel'),
                    widthInput = this.$('.mapExportWidth'),
                    heightInput = this.$('.mapExportHeight'),
                    formatSelect = this.$('.formatTypes'),
                    fileSelect = this.$('.fileTypes'),
                    exportNameInput = this.$('.mapExportName'),
                    exportButton = this.$('.mapExportButton'),
                    inputs = [
                        zoomSelect,
                        widthInput,
                        heightInput,
                        formatSelect,
                        fileSelect,
                        exportNameInput,
                        exportButton
                    ];

                for (var i = 0; i < inputs.length; i++) {
                    if (!attrs.selArea) {
                        $(inputs[i]).prop('disabled', true);
                    } else {
                        $(inputs[i]).prop('disabled', false);
                    }
                }
                if (attrs.selArea) {
                    $(areaButton).removeClass('mapExportSelectButton');
                    $(areaButton).addClass('mapExportUnselectButton');
                    $(areaButton).text(window._gtxt('mapExport.unselect'));
                    $(zoomToBoxButton).show();
                    $(zoomToLevelButton).show();
                    if (!attrs.widthValueErr    &&
                        !attrs.widthSizeErr     &&
                        !attrs.heightValueErr   &&
                        !attrs.heightSizeErr    &&
                        attrs.name !== '') {
                            $(exportButton).removeClass('gmx-disabled');
                    }
                } else {
                    $(areaButton).removeClass('mapExportUnselectButton');
                    $(areaButton).addClass('mapExportSelectButton');
                    $(areaButton).text(window._gtxt('mapExport.select'));
                    $(zoomToBoxButton).hide();
                    $(zoomToLevelButton).hide();
                    $(exportButton).addClass('gmx-disabled');
                }
            },

            updateSize: function () {
                var attrs = this.model.toJSON(),
                    widthInput = this.$('.mapExportWidth'),
                    width = Number(attrs.width).toFixed(0),
                    heightInput = this.$('.mapExportHeight'),
                    height = Number(attrs.height).toFixed(0);

                if (!attrs.widthValueErr) {
                    $(widthInput).val((width));
                }

                if (!attrs.heightValueErr) {
                    $(heightInput).val((height));
                }
            },

            handleValueError: function () {
                var attrs = this.model.toJSON(),
                    widthInput = this.$('.mapExportWidth'),
                    heightInput = this.$('.mapExportHeight'),
                    exportButton = this.$('.mapExportButton'),
                    warn = this.$('.mapExportWarn');

                if (attrs.widthValueErr) {
                    $(widthInput).addClass('error');
                } else {
                    if (!attrs.widthSizeErr) {
                        $(widthInput).removeClass('error');
                    }
                }

                if (attrs.heightValueErr) {
                    $(heightInput).addClass('error');
                } else {
                    if (!attrs.heightSizeErr) {
                        $(heightInput).removeClass('error');
                    }
                }

                if (attrs.widthValueErr || attrs.heightValueErr) {
                    $(exportButton).addClass('gmx-disabled');
                    $(warn).html(window._gtxt('mapExport.valueWarn'));
                } else {
                    if (attrs.selArea && attrs.name) {
                        $(exportButton).removeClass('gmx-disabled');
                    }
                    if (attrs.widthSizeErr || attrs.heightSizeErr) {
                        $(warn).html(window._gtxt('mapExport.sizeWarn'));
                    } else {
                        $(warn).html('');
                    }
                }
            },

            handleSizeError: function () {
                var attrs = this.model.toJSON(),
                    widthInput = this.$('.mapExportWidth'),
                    heightInput = this.$('.mapExportHeight'),
                    exportButton = this.$('.mapExportButton'),
                    warn = this.$('.mapExportWarn');

                if (attrs.widthSizeErr) {
                    $(widthInput).addClass('error');
                } else {
                    if (!attrs.widthValueErr) {
                        $(widthInput).removeClass('error');
                    }
                }

                if (attrs.heightSizeErr) {
                    $(heightInput).addClass('error');
                } else {
                    if (!attrs.heightValueErr) {
                        $(heightInput).removeClass('error');
                    }
                }

                if (attrs.widthSizeErr || attrs.heightSizeErr) {
                    $(exportButton).addClass('gmx-disabled');
                    if (!attrs.widthValueErr && !attrs.heightValueErr) {
                        $(warn).html(window._gtxt('mapExport.sizeWarn'));
                    }
                } else {
                    if (!attrs.widthValueErr && !attrs.heightValueErr) {
                        if (attrs.selArea && attrs.name) {
                            $(exportButton).removeClass('gmx-disabled');
                        }
                        $(warn).html('');
                    }
                }
            },

            handleExportError: function () {
                var attrs = this.model.toJSON(),
                    exportButton = this.$('.mapExportButton'),
                    progressBarContainer = this.$('.export-progress-container'),
                    spinHolder = this.$('.spinHolder'),
                    cancelButton = this.$('.cancelButton'),
                    exportErrorMessage = this.$('.exportErrorMessage');

                if (attrs.selArea) {
                    $(exportButton).removeClass('gmx-disabled');
                } else {
                    $(exportButton).addClass('gmx-disabled');
                }

                if (attrs.exportErr) {
                    $(spinHolder).toggle();
                    $(progressBarContainer).toggle();
                    $(exportButton).toggle();
                    $(cancelButton).toggle();
                    $(exportErrorMessage).toggle();
                } else {
                    $(exportErrorMessage).toggle();
                }
            },

            updateName: function () {
                var attrs = this.model.toJSON(),
                    exportNameInput = this.$('.mapExportName'),
                    exportButton = this.$('.mapExportButton');

                if (attrs.name === '') {
                    $(exportNameInput).addClass('error');
                    $(exportButton).addClass('gmx-disabled');
                } else {
                    if (
                        attrs.selArea           &&
                        !attrs.widthValueErr    &&
                        !attrs.widthSizeErr     &&
                        !attrs.heightValueErr   &&
                        !attrs.heightSizeErr
                        ) {
                        $(exportButton).removeClass('gmx-disabled');
                    }

                    $(exportNameInput).removeClass('error');
                }
            },

            updateZoom: function () {
                var attrs = this.model.toJSON(),
                    levels = this.$('.zoomLevel'),
                    list = $(levels).find('option'),
                    zoomToLevelButton = this.$('.zoomToLevelButton')[0];

                for (var i = 0; i < list.length; i++) {
                    var el = list[i];

                    if (el.tagName === 'OPTION') {

                        if (Number($(el).val()) === attrs.z) {
                            $(el).prop('selected', true);
                        } else {
                            $(el).prop('selected', false);
                        }

                    }
                }

                if (zoomToLevelButton) {
                    nsGmx.Utils._title(zoomToLevelButton, (window._gtxt('mapExport.zoomToLevel') + ' ' + attrs.z));
                }
            },

            setZoom: function (e) {
                var attrs = this.model.toJSON(),
                    selectedZoom = Number(e.target.value),
                    zoomLevels = attrs.zoomLevels;

                for (var i = attrs.lmap.getMinZoom(); i < zoomLevels.length; i++) {
                    zoomLevels[i].current = false;

                    if (i === selectedZoom) {
                        zoomLevels[i].current = true;
                    }
                }

                this.model.set({
                    zoomLevels: zoomLevels,
                    z: selectedZoom
                });

                this._updateCoords();
            },

            setFormat: function (e) {
                var attrs = this.model.toJSON(),
                    formatTypes = attrs.formatTypes,
                    selectedFormat = e.target.value;

                for (var i = 0; i < formatTypes.length; i++) {
                    formatTypes[i].current = false;

                    if (formatTypes[i].type === selectedFormat) {
                        formatTypes[i].current = true;
                    }
                }

                this.model.set({
                    formatTypes: formatTypes,
                    format: selectedFormat
                });
            },

            setFileType: function (e) {
                var attrs = this.model.toJSON(),
                    fileTypes = attrs.fileTypes,
                    selectedFileType = e.target.value;

                for (var i = 0; i < fileTypes.length; i++) {
                    fileTypes[i].current = false;

                    if (fileTypes[i].type === selectedFileType) {
                        fileTypes[i].current = true;
                    }
                }

                this.model.set({
                    fileTypes: fileTypes,
                    fileType: selectedFileType
                });
            },

            setName: function (e) {
                this.model.set('name', e.target.value)
            },

            selectArea: function () {
                var attrs = this.model.toJSON();

                if (!attrs.lmap || attrs.selArea) {
                    return;
                }

                var currentZoom = attrs.lmap.getZoom(),
                    zoomLevels = attrs.zoomLevels,
                    mapBounds = attrs.lmap.getBounds(),
                    latLngs = [
                        mapBounds.getSouthWest(),
                        mapBounds.getNorthWest(),
                        mapBounds.getNorthEast(),
                        mapBounds.getSouthEast()
                    ],
                    n = mapBounds.getNorth(),
                    e = mapBounds.getEast(),
                    s = mapBounds.getSouth(),
                    w = mapBounds.getWest(),
                    mapHeight = n - s,
                    mapWidth = e - w,

                    // какую часть экрана отсекать с краев первоначальной рамки
                    scale = 4,
                    converted = this._convertFromLatLngs(latLngs, attrs.z),
                    dims = this._getDimensions(converted),
                    xx = [converted[0].x, converted[1].x, converted[2].x, converted[3].x],
                    yy = [converted[0].y, converted[1].y, converted[2].y, converted[3].y],
                    bottomLeft =    L.point(this._getMin(xx) + dims.width / scale,  this._getMax(yy) - dims.height / scale),
                    topLeft =       L.point(this._getMin(xx) + dims.width / scale,  this._getMin(yy) + dims.height / scale),
                    topRight =      L.point(this._getMax(xx) - dims.width / scale,  this._getMin(yy) + dims.height / scale),
                    bottomRight =   L.point(this._getMax(xx) - dims.width / scale,  this._getMax(yy) - dims.height / scale),
                    initialBounds = this._convertToLantLngs([bottomLeft, topLeft, topRight, bottomRight], attrs.z);

                for (var i = attrs.lmap.getMinZoom(); i < zoomLevels.length; i++) {
                    zoomLevels[i].current = false;

                    if (i === currentZoom) {
                        zoomLevels[i].current = true;
                    }
                }

                // прямоугольная рамка
                var rect = L.rectangle(initialBounds);

                this.model.set({
                    z: currentZoom,
                    zoomLevels: zoomLevels
                });

                this._createFrame(rect);

                this._updateCoords();
            },

            unselectArea: function () {
                var attrs = this.model.toJSON();
                this._removeFrame();

                this.model.set({
                    width: 0,
                    height: 0,
                    z: attrs.lmap.getZoom(),
                    widthValueErr: false,
                    widthSizeErr: false,
                    heightValueErr: false,
                    heightSizeErr: false,
                    exportErr: false
                });
            },

            zoomToBox: function () {
                var attrs = this.model.toJSON();

                attrs.lmap.fitBounds(attrs.selArea.getBounds());
            },

            zoomToLevel: function () {
                var attrs = this.model.toJSON(),
                    initialCoords = attrs.selArea.rings[0].ring.points._latlngs,
                    converted = this._convertFromLatLngs(initialCoords, attrs.z),
                    dims = this._getDimensions(converted);

                attrs.lmap.setView(dims.latLng, attrs.z);
            },

            exportMap: function () {
                var _this = this,
                    attrs = this.model.toJSON(),
                    initialCoords = attrs.selArea.rings[0].ring.points._latlngs,
                    screenCoords = !attrs.coords ? this._convertFromLatLngs(initialCoords, attrs.z) : this._convertFromLatLngs(attrs.coords, attrs.z),
                    dimensions = this._getDimensions(screenCoords),
                    mapStateParams = {
                        exportMode: true,
                        isFullScreen: true,
                        width: Math.floor(Number(attrs.width)) + 'px',
                        height: Math.floor(Number(attrs.height)) + 'px',
                        position: {
                            x: dimensions.mercCenter.x,
                            y: dimensions.mercCenter.y,
                            z: attrs.z ? 17 - attrs.z : 17 - attrs.lmap.getZoom()
                        },
                        latLng: dimensions.latLng,
                        exportBounds: attrs.selArea.getBounds(),
                        grid: attrs.fileType === window._gtxt('mapExport.filetypes.raster') ? nsGmx.gridManager.state : false
                    },
                    exportParams = {
                        width: Math.floor(Number(attrs.width)),
                        height: Math.floor(Number(attrs.height)),
                        filename: attrs.name,
                        container: attrs.fileType === window._gtxt('mapExport.filetypes.raster') ? 'grimage' : attrs.fileType,
                        format: attrs.format
                    },
                    exportButton = this.$('.mapExportButton'),
                    cancelButton = this.$('.cancelButton'),
                    progressBarContainer = this.$('.export-progress-container'),
                    progressBar = this.$('.export-progressbar'),
                    spinHolder = this.$('.spinHolder'),
                    spinMessage = this.$('.spinMessage'),
                    def;

                $(exportButton).toggle();
                $(cancelButton).toggle();

                window._mapHelper.createExportPermalink(mapStateParams, processLink);

                function processLink(id){
                    var url = window.serverBase + 'Map/Render?' + $.param(exportParams) + '&uri=' + 'http://' + window.location.host + window.location.pathname + '?permalink=' + id;

                    _this.model.set({
                        exportErr: false
                    });

                    $(exportButton).addClass('gmx-disabled');

                    $(progressBarContainer).toggle();
                    $(spinHolder).toggle();

                    $(progressBar).progressbar({
                        max: 100,
                        value: 0
                    });

                    def = nsGmx.asyncTaskManager.sendGmxPostRequest(url);

                    def.done(function(taskInfo){
                        var url2 = window.serverBase + taskInfo.Result.downloadFile,
                            selArea = _this.model.get('selArea');

                        if (selArea) {
                            $(exportButton).removeClass('gmx-disabled');
                        } else {
                            $(exportButton).addClass('gmx-disabled');
                        }

                        $(exportButton).toggle();
                        $(cancelButton).toggle();
                        $(spinHolder).toggle();
                        $(progressBarContainer).toggle();

                        downloadFile(url2);

                    }).fail(function(taskInfo){
                        if (taskInfo.ErrorInfo.ErrorMessage !== 'Task is canceled') {
                            $(exportButton).removeClass('gmx-disabled');

                            _this.model.set({
                                exportErr: true
                            });
                        }
                    }).progress(function(taskInfo){
                        _this.model.set({
                            taskInfo: taskInfo
                        });

                        if (taskInfo.Status === 'queue') {
                            $(spinMessage).html(window._gtxt('mapExport.inQueue'));
                        } else if (taskInfo.Status === 'progress') {
                            $(spinMessage).html(window._gtxt('mapExport.inProcess'));

                            $(progressBar).progressbar('value', taskInfo.Progress);
                        }
                    });

                    function downloadFile(url) {
                        var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
                            isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;

                        if (isChrome || isSafari) {
                            var link = document.createElement('a');
                            link.href = url;
                            link.download = attrs.name;

                            if (document.createEvent) {
                                var e = document.createEvent('MouseEvents');
                                e.initEvent('click', true, true);
                                link.dispatchEvent(e);
                                return true;
                            }
                        } else {
                            window.open(url, '_self');
                        }
                    }
                }
            },

            cancelExport: function() {
                var attrs = this.model.toJSON(),
                    taskInfo = this.model.get('taskInfo'),
                    exportButton = this.$('.mapExportButton'),
                    cancelButton = this.$('.cancelButton'),
                    progressBarContainer = this.$('.export-progress-container'),
                    spinHolder = this.$('.spinHolder'),
                    spinMessage = this.$('.spinMessage'),
                    url;


                url = window.serverBase + 'AsyncTaskCancel?' + $.param({TaskID: taskInfo.TaskID});

                sendCrossDomainJSONRequest(url, function(response) {
                    if (!parseResponse(response))
                        return;

                    if (response.Result) {
                        if (attrs.selArea) {
                            $(exportButton).removeClass('gmx-disabled');
                        };

                        $(exportButton).toggle();
                        $(cancelButton).toggle();
                        $(spinMessage).empty();
                        $(spinHolder).toggle();
                        $(progressBarContainer).toggle();
                    }
                })
            },

            resize: function(e) {
                var attrs = this.model.toJSON(),
                    start = e.target.selectionStart,
                    end = e.target.selectionEnd,
                    initialCoords,
                    scale,
                    screenCoords,
                    width, height,
                    bottomLeft, bottomRight,
                    topLeft, topRight,
                    newBounds,
                    value, valueErr, sizeErr;

                if (!attrs.lmap || !attrs.selArea) {
                    return;
                }

                initialCoords = attrs.selArea.rings[0].ring.points._latlngs;

                // разница между целевым и текущим зумом
                scale = Math.pow(2, (attrs.z - attrs.lmap.getZoom()));

                screenCoords = !attrs.coords ? this._revertCoords(this._convertFromLatLngs(initialCoords, attrs.z)) : this._revertCoords(this._convertFromLatLngs(attrs.coords, attrs.z));

                value = Number(e.target.value);
                valueErr = value <= 0 || isNaN(value);
                sizeErr = value > MAX_SIZE;

                // обработка инпута ширины
                if (e.target.className === 'mapExportWidth' || e.target.className === 'mapExportWidth error') {
                    if (valueErr) {
                        this.model.set('widthValueErr', true)
                    } else {
                        this.model.set('widthValueErr', false)
                        this.model.set('width', e.target.value);

                        if (sizeErr) {
                            this.model.set('widthSizeErr', true);
                        } else {
                            this.model.set('widthSizeErr', false);
                        }
                    }
                }

                // обработка инпута высоты
                if (e.target.className === 'mapExportHeight' || e.target.className === 'mapExportHeight error') {
                    if (valueErr) {
                        this.model.set('heightValueErr', true)
                    } else {
                        this.model.set('heightValueErr', false)
                        this.model.set('height', e.target.value);

                        if (sizeErr) {
                            this.model.set('heightSizeErr', true);
                        } else {
                            this.model.set('heightSizeErr', false);
                        }
                    }
                }

                attrs = this.model.toJSON();

                if (attrs.widthValueErr || attrs.heightValueErr) return;

                width = e.target.className === 'mapExportWidth' || e.target.className === 'mapExportWidth error' ? Number(e.target.value) : Number(attrs.width);
                height = e.target.className === 'mapExportHeight' || e.target.className === 'mapExportHeight error' ? Number(e.target.value) : Number(attrs.height);

                newBounds = [];

                // изменяем координаты объекта, учитывая изменившуюся ширину или высоту
                // геометрия изменяется в соответствии с введенными значениями
                // topLeft остается неизменным
                bottomLeft = screenCoords[0];
                topLeft = screenCoords[1];
                topRight = screenCoords[2];
                bottomRight = screenCoords[3];

                topRight.x = (topLeft.x + width);
                topRight.y = topLeft.y;

                bottomLeft.x = topLeft.x;
                bottomLeft.y = (topLeft.y + height);

                bottomRight.x = (topLeft.x + width);
                bottomRight.y = (topLeft.y + height);

                topLeft.x = topLeft.x;
                topLeft.y = topLeft.y;

                newBounds.push(
                    [attrs.lmap.unproject([bottomLeft.x / scale, bottomLeft.y / scale])],
                    [attrs.lmap.unproject([topRight.x / scale, topRight.y / scale])]
                );

                // измененная прямоугольная рамка
                var newRect = L.rectangle(newBounds);
                this.model.set('coords', newRect._latlngs);

                attrs.lmap.gmxDrawing.remove(attrs.selArea);

                this._createFrame(newRect);
                this._updateCoords();

                // восстановим позицию курсора
                e.target.setSelectionRange(start, end);
            },

            _createFrame: function(rectangle) {
                var attrs = this.model.toJSON(),
                    options = {
                        editable: true,
                        map: true,
                        lineStyle: {
                            dashArray: '5 5',
                            color: '#f57c00',
                            weight: 3.5
                        },
                        pointStyle: {
                            size: L.Browser.mobile ? 40 : 8,
                            color: '#f57c00'
                        }
                    };

                this.model.set({
                    selArea: attrs.lmap.gmxDrawing.add(rectangle, L.extend(options, {
                        exportRect: true
                    }))
                });

                // навешивает обработчики на рамку выделения
                var frame = this.model.get('selArea'),
                    _this = this;

                frame.on('edit', _this._resizeFrame.bind(_this));
                frame.on('remove', function () {
                    var attrs = _this.model.toJSON();

                    _this.model.set({
                        width: 0,
                        height: 0,
                        widthValueErr: false,
                        widthSizeErr: false,
                        heightValueErr: false,
                        heightSizeErr: false,
                        exportErr: false
                    });
                });

            },

            _resizeFrame: function () {
                var attrs = this.model.toJSON(),
                    initialCoords,
                    screenCoords,
                    dimensions,
                    w, h;

                initialCoords = attrs.selArea.rings[0].ring.points._latlngs;
                screenCoords = this._convertFromLatLngs(initialCoords, attrs.z);
                dimensions = this._getDimensions(screenCoords);

                w = Math.abs(dimensions.width);
                h = Math.abs(dimensions.height);

                if (w > MAX_SIZE) {
                    this.model.set('widthSizeErr', true)
                } else {
                    this.model.set('widthSizeErr', false)
                }

                if (h > MAX_SIZE) {
                    this.model.set('heightSizeErr', true)
                } else {
                    this.model.set('heightSizeErr', false)
                }

                this.model.set({
                    coords: initialCoords,
                    width: String(w),
                    height: String(h)
                });
            },

            _removeFrame: function () {
                var attrs = this.model.toJSON();

                if (!attrs.selArea) {
                    return;
                }

                attrs.lmap.gmxDrawing.remove(attrs.selArea);

                this.model.set({
                    selArea: null,
                    coords: null
                });
            },

            _updateCoords: function () {
                var attrs = this.model.toJSON(),
                    initialCoords,
                    screenCoords,
                    dimensions,
                    w, h;

                if (!attrs.selArea) {
                    return;
                }

                initialCoords = attrs.selArea.rings[0].ring.points._latlngs;
                screenCoords = !attrs.coords ? this._convertFromLatLngs(initialCoords, attrs.z) : this._convertFromLatLngs(attrs.coords, attrs.z);
                dimensions = this._getDimensions(screenCoords);

                w = Math.abs(dimensions.width);
                h = Math.abs(dimensions.height);

                if (!attrs.coords) {
                    this.model.set('coords', initialCoords)
                }

                if (w > MAX_SIZE) {
                    this.model.set('widthSizeErr', true)
                } else {
                    this.model.set('widthSizeErr', false)
                }

                if (h > MAX_SIZE) {
                    this.model.set('heightSizeErr', true)
                } else {
                    this.model.set('heightSizeErr', false)
                }

                this.model.set({
                    width: String(w),
                    height: String(h)
                });
            },

            _revertCoords: function (coords) {
                var xx,
                    yy,
                    bottomLeft, topLeft,
                    topRight, bottomRight;

                xx = [coords[0].x, coords[1].x, coords[2].x, coords[3].x];
                yy = [coords[0].y, coords[1].y, coords[2].y, coords[3].y];
                bottomLeft = L.point(this._getMin(xx), this._getMax(yy));
                topLeft = L.point(this._getMin(xx), this._getMin(yy));
                topRight = L.point(this._getMax(xx), this._getMin(yy));
                bottomRight = L.point(this._getMax(xx), this._getMax(yy));

                return [bottomLeft, topLeft, topRight, bottomRight];

            },

            _convertFromLatLngs: function (latlngs, zoom) {
                var attrs = this.model.toJSON(),
                    converted = latlngs.map(function(ll) {
                        return attrs.lmap.project([ll.lat, ll.lng], zoom);
                    });

                return converted;
            },

            _convertToLantLngs: function (points, zoom) {
                var attrs = this.model.toJSON(),
                    converted = points.map(function(point) {
                        return attrs.lmap.unproject([point.x, point.y], zoom);
                    });

                return converted;
            },

            _getDimensions: function(points) {
                var attrs = this.model.toJSON(),
                    bottomLeft, topRight,
                    width, height,
                    x, y;

                points = this._revertCoords(points);
                bottomLeft = points[0];
                topRight = points[2];
                width = Math.abs(topRight.x - bottomLeft.x);
                height = Math.abs(bottomLeft.y - topRight.y);
                x = bottomLeft.x + width / 2;
                y = topRight.y + height / 2;

                return {
                    bottomLeft: bottomLeft,
                    topRight: topRight,
                    width: width,
                    height: height,
                    mercCenter: L.Projection.Mercator.project(attrs.lmap.unproject([x, y], attrs.z)),
                    latLng: attrs.lmap.unproject([x, y], attrs.z)
                }
            },

            _getMax: function(arr) {
                return Math.max.apply(null, arr);
            },

            _getMin: function(arr) {
                return Math.min.apply(null, arr);
            }
        });

        view = new ExportView();

        function getZoomLevels() {
            var zoomLevels = [],
                lmap = nsGmx.leafletMap,
                min = lmap.getMinZoom(),
                max = lmap.getMaxZoom(),
                currentZoom = lmap.getZoom();

            for (var i = min; i <= max; i++) {
                zoomLevels[i] = {zoom: i, current: false};

                if (i === currentZoom) {
                    zoomLevels[i].current = true;
                }
            }
            return zoomLevels;
        }

        function getTypes(types) {
            var arr = [];

            for (var i = 0; i < types.length; i++) {
                arr[i] = {type: types[i], current: false};

                if (i === 0) {
                    arr[i].current = true;
                }
            }
            return arr;
        }

        this.Load = function () {
            var lm = model.get('lm');

            if (lm != null) {
                var alreadyLoaded = lm.createWorkCanvas('export', this.Unload);
                if (!alreadyLoaded) {
                    $(lm.workCanvas).append(view.el);
                }
            }
        }
        this.Unload = function () {
            var attrs = model.toJSON();
            attrs.lmap.gmxDrawing.remove(attrs.selArea);
            model.set({
                selArea: null,
                width: 0,
                height: 0,
                widthValueErr: false,
                heightValueErr: false,
                widthSizeErr: false,
                heightSizeErr: false,
                format: null,
                x: null,
                z: attrs.lmap.getZoom(),
                y: null,
                latLng: null,
                coords: null,
                zoomLevels: getZoomLevels(),
                formatTypes: getTypes(formatTypes),
                fileTypes: null,
                exportErr: false
            });
        };
    }

    var publicInterface = {
        pluginName: 'MapExport',
        MapExportMenu: MapExportMenu
  };

    window.gmxCore.addModule('MapExport',
        publicInterface
    );
})();
