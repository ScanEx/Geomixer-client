var nsGmx = nsGmx || {};

(function() {

    var MAX_SIZE = 10000;
    var formats = [
        // 'geotiff',
        'png',
        'jpeg',
        // 'kmz',
        // 'mbtiles'
    ];

    var view;

    // мы не хотим, чтобы рамка фигурировала в списке пользовательских объектов
    window.nsGmx.DrawingObjectCustomControllers.addDelegate({
        isHidden: function(obj) {
            if (obj.options.exportRect) {
                return true;
            }
            return false;
        }
    });

    window._translationsHash.addtext('rus', {
        mapExport: {
            exportTooltip : 'Выделите рамкой область карты',
            settings : {
                settings: 'Настройки экспорта карты',
                zoom: 'масштаб (уровень)',
                size: 'размер',
                format: 'формат файла',
                width: 'ширина (в пикселях)',
                height: 'высота (в пикселях)',
                name: 'имя файла'
            },
            formats: {
                geoTiff: 'GeoTiff',
                png: 'PNG',
                jpeg: 'JPEG',
                kmz: 'KMZ',
                mbTiles: 'MBTiles'
            },
            select: 'Выделить',
            unselect: 'Снять выделение',
            zoomTo: 'Приблизить',
            export: 'Экспорт',
            sizeWarn: 'максимальный размер - 10000 пикселей',
            valueWarn: 'недопустимое значение'
        }
    });
    window._translationsHash.addtext('eng', {
        mapExport: {
            exportTooltip : 'Select area',
            settings : {
                settings: 'Map export settings',
                zoom: 'zoom',
                size: 'size',
                format: 'file format',
                width: 'width (px)',
                height: 'height (px)',
                name: 'file name'
            },
            formats: {
                geoTiff: 'GeoTiff',
                png: 'PNG',
                jpeg: 'JPEG',
                kmz: 'KMZ',
                mbTiles: 'MBTiles'
            },
            select: 'Select',
            unselect: 'Clear selection',
            zoomTo: 'Zoom to frame',
            export: 'Export',
            sizeWarn: 'incorrect size',
            valueWarn: 'incorrect value'
        }
    });

    // создает левое меню с параметрами экспорта
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
                x: null,
                y: null,
                z: null,
                latLng: null,
                coords: null,
                zoomLevels: getZoomLevels(),
                formatTypes: getFormatTypes(formats),
                name: ''
            }
        })

        var model = new ExportModel();

        var ExportView = window.Backbone.View.extend({
            el: $(canvas),
            model: model,
            template: window.Handlebars.compile(

                // 1. Верхний элемент - подсказка
                '<div class="mapExportTooltip">' +
                    '{{i "mapExport.exportTooltip"}}' +
                '</div class="exportSettingsTable">' +

                // 2. выбор / отмена выделения
                '<div class="selectButtons">' +
                        '<span class="buttonLink areaButton mapExportSelectButton"> {{i "mapExport.select"}}</span>' +
                        '<span class="buttonLink adjustButton btn-hidden"> {{i "mapExport.zoomTo"}}</span>' +
                '</div>' +

                // 3. настройки
                '<div class="settings">' +
                    '<div class="exportSettings">' +
                        '{{i "mapExport.settings.settings"}}' +
                    '</div>' +
                    '<div class="zoomSelect">' +
                        '<span class="label">{{i "mapExport.settings.zoom"}}</span>' +
                        '<select class="zoomLevel">' +
                            '{{#each this.zoomLevels}}' +
                            '<option value="{{this.zoom}}"' +
                                '{{#if this.current}} selected="selected"{{/if}}>' +
                                '{{this.zoom}}' +
                            '</option>' +
                            '{{/each}}' +
                        '</select>' +
                    '</div>' +
                    '<div class="dimensionsSelect">' +
                        '<div class="dims">' +
                            '<span class="label">{{i "mapExport.settings.width"}}</span>' +
                            '<input type="text" class="mapExportWidth" value="{{width}}"/>' +
                        '</div>' +
                        '<div class="dims">' +
                            '<span class="label">{{i "mapExport.settings.height"}}</span>' +
                            '<input type="text" class="mapExportHeight" value="{{height}}"/>' +
                        '</div>' +
                    '</div>' +
                    '<div class="formatSelect">' +
                        '<span class="label">{{i "mapExport.settings.format"}}</span>' +
                        '<select class="formatTypes">' +
                            '{{#each this.formatTypes}}' +
                            '<option value="{{this.type}}"' +
                                '{{#if this.current}} selected="selected" {{/if}}>' +
                                '{{this.type}}' +
                            '</option>' +
                            '{{/each}}' +
                        '</select>' +
                    '</div>' +
                    '<div class="nameSelect">' +
                        '<span class="label">{{i "mapExport.settings.name"}}</span>' +
                        '<input type="text" class="mapExportName" value=""/>' +
                    '</div>' +
                '</div>' +
                '<div class="export">' +
                    '<span class="buttonLink mapExportButton"> {{i "mapExport.export"}}</span>' +
                    // '<input type="button" class="mapExportButton" value={{i "mapExport.export"}}>' +
                    '<span class="mapExportWarn"></span>' +
                '</div>'
            ),
            events: {
                'click .mapExportSelectButton': 'selectArea',
                'click .mapExportUnselectButton': 'unselectArea',
                'click .adjustButton': 'zoomToFrame',
                'input .mapExportWidth': 'resize',
                'input .mapExportHeight': 'resize',
                'change .zoomLevel': 'setZoom',
                'change .formatTypes': 'setFormat',
                'input .mapExportName': 'setName',
                'click .mapExportButton': 'exportMap'
            },

            // меняется модель
            initialize: function () {
                var attrs = this.model.toJSON(),
                    currentZoom = attrs.lmap.getZoom(),
                    zoomLevels = attrs.zoomLevels,
                    formatTypes = attrs.formatTypes;

                this.listenTo(this.model, 'change:selArea', this.updateArea);
                this.listenTo(this.model, 'change:width', this.updateSize);
                this.listenTo(this.model, 'change:height', this.updateSize);
                this.listenTo(this.model, 'change:widthValueErr', this.handleValueError);
                this.listenTo(this.model, 'change:heightValueErr', this.handleValueError);
                this.listenTo(this.model, 'change:widthSizeErr', this.handleSizeError);
                this.listenTo(this.model, 'change:heightSizeErr', this.handleSizeError);
                this.listenTo(this.model, 'change:name', this.updateName);
                this.listenTo(this.model, 'change:z', this.updateZoom);

                for (var i = 0; i < zoomLevels.length; i++) {
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

                this.model.set({
                    z: currentZoom,
                    zoomLevels: zoomLevels,
                    formatTypes: formatTypes,
                    name: window.nsGmx.gmxMap.properties.title
                });

                this.updateArea();

                this.render();
            },

            render: function () {
                this.$el.html(this.template(this.model.toJSON()));
                this.$('.zoomLevel').prop('disabled', true)
                this.$('.mapExportWidth').prop('disabled', true);
                this.$('.mapExportHeight').prop('disabled', true);
                this.$('.formatTypes').prop('disabled', true)
                this.$('.mapExportName').val(this.model.get('name'));
                this.$('.mapExportName').prop('disabled', true);
                this.$('.mapExportButton').addClass('not-active');

                return this;
            },

            updateArea: function () {
                var attrs = this.model.toJSON(),
                    areaButton = this.$('.areaButton'),
                    adjustBtn = this.$('.adjustButton'),
                    zoomSelect = this.$('.zoomLevel'),
                    widthInput = this.$('.mapExportWidth'),
                    heightInput = this.$('.mapExportHeight'),
                    formatSelect = this.$('.formatTypes'),
                    exportNameInput = this.$('.mapExportName'),
                    exportBtn = this.$('.mapExportButton'),
                    inputs = [
                        zoomSelect,
                        widthInput,
                        heightInput,
                        formatSelect,
                        exportNameInput,
                        exportBtn
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
                    $(adjustBtn).removeClass('btn-hidden');
                    if (
                        !attrs.widthValueErr    &&
                        !attrs.widthSizeErr     &&
                        !attrs.heightValueErr   &&
                        !attrs.heightSizeErr
                        ) {
                        $(exportBtn).removeClass('not-active');
                    }
                } else {
                    $(areaButton).removeClass('mapExportUnselectButton');
                    $(areaButton).addClass('mapExportSelectButton');
                    $(areaButton).text(window._gtxt('mapExport.select'));
                    $(adjustBtn).addClass('btn-hidden');
                    $(exportBtn).addClass('not-active');
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
                    exportBtn = this.$('.mapExportButton'),
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
                    $(exportBtn).addClass('not-active');
                    $(warn).html(window._gtxt('mapExport.valueWarn'));
                } else {
                    if (attrs.selArea && attrs.name) {
                        $(exportBtn).removeClass('not-active');
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
                    exportBtn = this.$('.mapExportButton'),
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
                    $(exportBtn).addClass('not-active');
                    if (!attrs.widthValueErr && !attrs.heightValueErr) {
                        $(warn).html(window._gtxt('mapExport.sizeWarn'));
                    }
                } else {
                    if (!attrs.widthValueErr && !attrs.heightValueErr) {
                        if (attrs.selArea && attrs.name) {
                            $(exportBtn).removeClass('not-active');
                        }
                        $(warn).html('');
                    }
                }
            },

            updateName: function () {
                var attrs = this.model.toJSON(),
                    exportNameInput = this.$('.mapExportName'),
                    exportBtn = this.$('.mapExportButton');

                if (attrs.name === '') {
                    $(exportNameInput).addClass('error');
                    $(exportBtn).addClass('not-active');
                } else {
                    if (
                        attrs.selArea           &&
                        !attrs.widthValueErr    &&
                        !attrs.widthSizeErr     &&
                        !attrs.heightValueErr   &&
                        !attrs.heightSizeErr
                        ) {
                        $(exportNameInput).removeClass('error');
                        $(exportBtn).removeClass('not-active');
                    }
                }
            },

            updateZoom: function () {
                var attrs = this.model.toJSON(),
                    levels = this.$('.zoomLevel'),
                    list = $(levels).find('option');

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
            },

            setZoom: function (e) {
                var attrs = this.model.toJSON(),
                    selectedZoom = Number(e.target.value),
                    zoomLevels = attrs.zoomLevels;

                for (var i = 0; i < zoomLevels.length; i++) {
                    zoomLevels[i].current = false;

                    if (i === selectedZoom) {
                        zoomLevels[i].current = true;
                    }
                }

                this.model.set({
                    zoomLevels: zoomLevels,
                    z: selectedZoom,
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

            setName: function (e) {
                this.model.set('name', e.target.value)
            },

            selectArea: function () {
                var attrs = this.model.toJSON(),
                    currentZoom = attrs.lmap.getZoom(),
                    zoomLevels = attrs.zoomLevels;

                if (!attrs.lmap || attrs.selArea) {
                    return;
                }

                var mapBounds = attrs.lmap.getBounds(),
                    n = mapBounds.getNorth(),
                    e = mapBounds.getEast(),
                    s = mapBounds.getSouth(),
                    w = mapBounds.getWest(),
                    mapHeight = n - s,
                    mapWidth = e - w,

                    // какую часть экрана отсекать с краев первоначальной рамки
                    scale = 4,
                    initialBounds = [];

                initialBounds.push(
                    [s + mapHeight / scale, w + mapWidth / scale],
                    [n - mapHeight / scale, e - mapWidth / scale]
                );

                for (var i = 0; i < zoomLevels.length; i++) {
                    zoomLevels[i].current = false;

                    if (i === currentZoom) {
                        zoomLevels[i].current = true;
                    }
                }

                // прямоугольная рамка
                var rect = L.rectangle(initialBounds);

                this.model.set({
                    z: currentZoom,
                    zoomLevels: zoomLevels,
                });

                this._createFrame(rect);

                this._updateCoords();
            },

            unselectArea: function () {
                this._removeFrame();

                this.model.set({
                    width: 0,
                    height: 0,
                    widthValueErr: false,
                    widthSizeErr: false,
                    heightValueErr: false,
                    heightSizeErr: false
                });
            },

            zoomToFrame: function () {
                var attrs = this.model.toJSON();

                attrs.lmap.fitBounds(attrs.selArea.getBounds());
            },

            exportMap: function () {
                var attrs = this.model.toJSON(),
                    initialCoords = attrs.selArea.rings[0].ring.points._latlngs,
                    screenCoords = !attrs.coords ? this._convertLatLngs(initialCoords, attrs.z) : this._convertLatLngs(attrs.coords, attrs.z),
                    dimensions = this._getDimensions(screenCoords),
                    mapStateParams = {
                        exportMode: true,
                        width: Math.floor(Number(attrs.width)) + 'px',
                        height: Math.floor(Number(attrs.height)) + 'px',
                        position: {
                            x: dimensions.mercCenter.x,
                            y: dimensions.mercCenter.y,
                            z: attrs.z ? attrs.z : attrs.lmap.getZoom()
                        },
                        latLng: dimensions.latLng
                    },
                    exportParams = {
                        width: Math.floor(Number(attrs.width)),
                        height: Math.floor(Number(attrs.height)),
                        filename: attrs.name,
                        format: attrs.format
                    }

                window._mapHelper.createExportPermalink(mapStateParams, processLink);
                function processLink(id){
                    var url = window.serverBase + 'Map/Render?' + $.param(exportParams) + '&uri=' + window.serverBase + 'api/index.html?permalink=' + id;
                    downloadFile(url);

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

            resize: function(e) {
                var attrs = this.model.toJSON(),
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

                // screenCoords = !attrs.coords ? this._convertLatLngs(initialCoords, attrs.z) : this._convertLatLngs(attrs.coords, attrs.z);
                screenCoords = !attrs.coords ? this._revertCoords(this._convertLatLngs(initialCoords, attrs.z)) : this._revertCoords(this._convertLatLngs(attrs.coords, attrs.z));

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

                this._removeFrame();

                this._createFrame(newRect);
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
                            size: 3.5,
                            color: '#f57c00'
                        }
                    };

                this.model.set({
                    selArea: attrs.lmap.gmxDrawing.add(rectangle, L.extend(options, {
                        exportRect: true
                    }))
                });

                // навешивает обработчик на рамку выделения
                var frame = this.model.get('selArea'),
                    _this = this;
                frame.on('edit', resizeFrame);

                function resizeFrame() {
                    var attrs = _this.model.toJSON(),
                        initialCoords,
                        screenCoords,
                        dimensions,
                        w, h;

                    initialCoords = attrs.selArea.rings[0].ring.points._latlngs;
                    screenCoords = _this._convertLatLngs(initialCoords, attrs.z);
                    dimensions = _this._getDimensions(screenCoords);

                    w = Math.abs(dimensions.width);
                    h = Math.abs(dimensions.height);

                    if (w > MAX_SIZE) {
                        _this.model.set('widthSizeErr', true)
                    } else {
                        _this.model.set('widthSizeErr', false)
                    }

                    if (h > MAX_SIZE) {
                        _this.model.set('heightSizeErr', true)
                    } else {
                        _this.model.set('heightSizeErr', false)
                    }

                    _this.model.set({
                        coords: initialCoords,
                        width: String(w),
                        height: String(h)
                    });
                }
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
                screenCoords = !attrs.coords ? this._convertLatLngs(initialCoords, attrs.z) : this._convertLatLngs(attrs.coords, attrs.z);
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
                bottomLeft = L.point(getMin(xx), getMax(yy));
                topLeft = L.point(getMin(xx), getMin(yy));
                topRight = L.point(getMax(xx), getMin(yy));
                bottomRight = L.point(getMax(xx), getMax(yy));

                return [bottomLeft, topLeft, topRight, bottomRight];


                function getMax(arr) {
                    return Math.max.apply(null, arr);
                }

                function getMin(arr) {
                    return Math.min.apply(null, arr);
                }
            },

            _convertLatLngs: function (latlngs, zoom) {
                var attrs = this.model.toJSON();

                var converted = latlngs.map(function(ll) {
                    return attrs.lmap.project([ll.lat, ll.lng], zoom);
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
                    latLng: attrs.lmap.unproject([x, y], attrs.z),
                }
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

        function getFormatTypes(types) {
            var formatTypes = []

            for (var i = 0; i < types.length; i++) {
                formatTypes[i] = {type: types[i], current: false};

                if (i === 0) {
                    formatTypes[i].current = true;
                }
            }
            return formatTypes;
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
                formatTypes: getFormatTypes(formats)
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
