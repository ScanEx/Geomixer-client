var nsGmx = window.nsGmx || {};

(function() {

    var MAX_INDEX_COUNT = 10000;
    var KM_PER_DEGREE = 111.31949;

    nsGmx.DrawingObjectCustomControllers.addDelegate({
        isHidden: function(obj) {
            if (obj.options.exportRect) {
                return true;
            }
            return false;
        }
    });

    window._translationsHash.addtext('rus', {
        indexGrid: {
            settings: 'Настройки индексной сетки',
            select: 'Выделить область карты',
            unselect: 'Снять выделение',
            coordinates: 'координаты',
            lat: 'широта',
            lng: 'долгота',
            min: 'мин',
            max: 'макс',
            step: 'шаг (км)',
            onLat: 'по широте',
            onLng: 'по долготе',
            count: 'количество идексов',
            name: 'имя слоя',
            create: 'Создать слой индексной сетки',
            valueWarn: 'недопустимое значение',
            indexCountWarn: 'превышено допустимое число ячеек (10 000)',
            nameWarn: 'имя слоя не должно быть пустым'
        }
    });
    window._translationsHash.addtext('eng', {
        indexGrid: {
            settings: 'Index grid settings',
            select: 'Select',
            unselect: 'Clear selection',
            coordinates: 'coordinates',
            lat: 'latitude',
            lng: 'longitude',
            max: 'max',
            min: 'min',
            step: 'Step (km)',
            onLat: 'on latitude',
            onLng: 'on longitude',
            count: 'index count',
            name: 'layer name',
            create: 'Create index grid layer',
            valueWarn: 'incorrect value',
            valueWarn: 'incorrect value',
            indexCountWarn: 'max ceils number exceeded (10 000)',
            nameWarn: 'layer name cannot be empty'
        }
    });

    var view;

    var IndexGridMenu = function () {
        var canvas = nsGmx.Utils._div(null, [['dir','className','indexGridConfigLeftMenu']]);

        var IndexGridModel = window.Backbone.Model.extend({
            defaults: {
                lm: new window.leftMenu(),
                lmap: nsGmx.leafletMap,
                selArea: null,
                xStep: 1,
                yStep: 1,
                xCount: null,
                yCount: null,
                xStepErr: false,
                yStepErr: false,
                indexCount: null,
                indexCountErr: false,
                maxLat: null,
                maxLng: null,
                minLat: null,
                minLng: null,
                maxLatErr: false,
                maxLngErr: false,
                minLatErr: false,
                minLngErr: false,
                z: null,
                coords: null,
                name: '',
                nameErr: true
            }
        });

        var model = new IndexGridModel();

        var IndexGridView = window.Backbone.View.extend({
            el: $(canvas),
            model: model,
            template: window.Handlebars.compile(
                '<div class="selectButtons">' +
                        '<span class="buttonLink areaButton indexGridSelectButton"> {{i "indexGrid.select"}}</span>' +
                        '</span>' +
                '</div>' +
                '<div class="indexgridsettings">' +
                    '<span>' +
                        '{{i "indexGrid.settings"}}' +
                    '</span>' +
                '</div>' +
                '<table class="settings">' +
                    '<tbody>' +
                        // Широта / Долгота
                        '<tr class="dims">' +
                            '<td class="eLabel">{{i "indexGrid.coordinates"}}</td>' +
                            '<td class="eLabel colname">{{i "indexGrid.lat"}}</td>' +
                            '<td class="eLabel colname">{{i "indexGrid.lng"}}</td>' +
                        '</tr>' +
                        // Макс
                        '<tr class="dims">' +
                            '<td class="eLabel">{{i "indexGrid.max"}}</td>' +
                            '<td class="eInput">' +
                                '<input type="text" class="maxLat" value="{{maxLat}}"/>' +
                            '</td>' +
                            '<td class="eInput">' +
                                '<input type="text" class="maxLng" value="{{maxLng}}"/>' +
                            '</td>' +
                        '</tr>' +
                        // Мин
                        '<tr class="dims">' +
                            '<td class="eLabel">{{i "indexGrid.min"}}</td>' +
                            '<td class="eInput">' +
                                '<input type="text" class="minLat" value="{{minLat}}"/>' +
                            '</td>' +
                            '<td class="eInput">' +
                                '<input type="text" class="minLng" value="{{minLng}}"/>' +
                            '</td>' +
                        '</tr>' +
                        // Шаг
                        '<tr class="dims">' +
                            '<td class="eLabel" rowspan=2>{{i "indexGrid.step"}}</td>' +
                            '<td class="eLabel">{{i "indexGrid.onLat"}}</td>' +
                            '<td class="eInput">' +
                            '<input type="text" class="yStep" value="{{yStep}}"/>' +
                            '</td>' +
                        '</tr>' +
                        '<tr class="dims">' +
                            '<td class="eLabel">{{i "indexGrid.onLng"}}</td>' +
                            '<td class="eInput">' +
                            '<input type="text" class="xStep" value="{{xStep}}"/>' +
                            '</td>' +
                        '</tr>' +
                        // Количество индексов
                        '<tr class="dims">' +
                            '<td class="eLabel">{{i "indexGrid.count"}}</td>' +
                            '<td class="eLabel"></td>' +
                            '<td class="eLabel indexCount">{{indexCount}}</td>' +
                        '</tr>' +
                        // Имя
                        '<tr class="nameSelect">' +
                            '<td class="eLabel">{{i "indexGrid.name"}}</td>' +
                            '<td class="eInput" colspan=2>' +
                                '<input type="text" class="name" value=""/>' +
                            '</td>' +
                        '</tr>' +
                    '</tbody>' +
                '</table>' +
                '<div class="createWrap">' +
                    '<div class="create">' +
                        '<span class="buttonLink createIndexGridButton"> {{i "indexGrid.create"}}</span>' +
                        '<span class="spinHolder" style="display:none">' +
                            '<img src="img/progress.gif"/>' +
                            '<span class="spinMessage"></span>' +
                            '</span>' +
                        '<br/>' +
                        '<span class="warnMessage errorMessage" style="display:none"></span>' +
                    '</div>' +
                '</div>'
            ),
            events: {
                'click .indexGridSelectButton': 'selectArea',
                'click .indexGridUnelectButton': 'unselectArea',
                'input .minLat': 'resize',
                'input .maxLat': 'resize',
                'input .minLng': 'resize',
                'input .maxLng': 'resize',
                'input .xStep': 'setStep',
                'input .yStep': 'setStep',
                'input .name': 'setName',
                'click .createIndexGridButton': 'createIndexGrid'
            },

            initialize: function () {
                var attrs = this.model.toJSON(),
                    currentZoom = attrs.lmap.getZoom();

                this.listenTo(this.model, 'change:selArea', this.updateArea);
                this.listenTo(this.model, 'change:selArea', this.updateStepInput.bind(this, 'xStep'));
                this.listenTo(this.model, 'change:selArea', this.updateStepInput.bind(this, 'yStep'));

                this.listenTo(this.model, 'change:minLat', this.updateLatLngInput.bind(this, 'minLat'));
                this.listenTo(this.model, 'change:maxLat', this.updateLatLngInput.bind(this, 'maxLat'));
                this.listenTo(this.model, 'change:maxLng', this.updateLatLngInput.bind(this, 'maxLng'));
                this.listenTo(this.model, 'change:minLng', this.updateLatLngInput.bind(this, 'minLng'));

                this.listenTo(this.model, 'change:minLatErr', this.handleInputErr.bind(this, 'minLat'));
                this.listenTo(this.model, 'change:maxLatErr', this.handleInputErr.bind(this, 'maxLat'));
                this.listenTo(this.model, 'change:maxLngErr', this.handleInputErr.bind(this, 'maxLng'));
                this.listenTo(this.model, 'change:minLngErr', this.handleInputErr.bind(this, 'minLng'));

                this.listenTo(this.model, 'change:xStep', this.updateStepInput.bind(this, 'xStep'));
                this.listenTo(this.model, 'change:yStep', this.updateStepInput.bind(this, 'yStep'));

                this.listenTo(this.model, 'change:xStepErr', this.handleInputErr.bind(this, 'xStep'));
                this.listenTo(this.model, 'change:yStepErr', this.handleInputErr.bind(this, 'yStep'));
                this.listenTo(this.model, 'change:indexCount', this.updateIndexCount);
                this.listenTo(this.model, 'change:indexCountErr', this.handleIndexCountErr);
                this.listenTo(this.model, 'change:name', this.updateName);
                this.listenTo(this.model, 'change:nameErr', this.handleInputErr.bind(this, 'name'));

                this.model.set({
                    z: currentZoom,
                    name: nsGmx.gmxMap.properties.title,
                    nameErr: false
                });

                this.updateArea();

                this.render();
            },

            render: function () {
                this.$el.html(this.template(this.model.toJSON()));
                this.$('.minLat').prop('disabled', true);
                this.$('.maxLat').prop('disabled', true);
                this.$('.maxLng').prop('disabled', true);
                this.$('.minLng').prop('disabled', true);
                this.$('.xStep').prop('disabled', true);
                this.$('.yStep').prop('disabled', true);
                this.$('.name').val(this.model.get('name'));
                this.$('.name').prop('disabled', true);
                this.$('.createIndexGridButton').addClass('gmx-disabled');

                return this;
            },

            updateArea: function () {
                var attrs = this.model.toJSON(),
                    minLatInput = this.$('.minLat'),
                    maxLatInput = this.$('.maxLat'),
                    maxLngInput = this.$('.maxLng'),
                    minLngInput = this.$('.minLng'),
                    xStepInput = this.$('.xStep'),
                    yStepInput = this.$('.yStep'),
                    areaButton = this.$('.areaButton'),
                    nameInput = this.$('.name'),
                    createIndexGridButton = this.$('.createIndexGridButton'),
                    inputs = [
                        minLatInput,
                        maxLatInput,
                        maxLngInput,
                        minLngInput,
                        xStepInput,
                        yStepInput,
                        nameInput,
                        createIndexGridButton
                    ];

                for (var i = 0; i < inputs.length; i++) {
                    if (!attrs.selArea) {
                        $(inputs[i]).prop('disabled', true);
                    } else {
                        $(inputs[i]).prop('disabled', false);
                    }
                }
                if (attrs.selArea) {
                    $(areaButton).removeClass('indexGridSelectButton');
                    $(areaButton).addClass('indexGridUnelectButton');
                    $(areaButton).text(window._gtxt('indexGrid.unselect'));

                    if (
                        !attrs.minLatErr        &&
                        !attrs.maxLatErr        &&
                        !attrs.maxLngErr        &&
                        !attrs.minLngErr        &&
                        !attrs.xStepErr         &&
                        !attrs.yStepErr         &&
                        !attrs.indexCountErr    &&
                        attrs.name !== ''
                    ) {
                            $(createIndexGridButton).removeClass('gmx-disabled');
                    }
                } else {
                    $(areaButton).removeClass('indexGridUnelectButton');
                    $(areaButton).addClass('indexGridSelectButton');
                    $(areaButton).text(window._gtxt('indexGrid.select'));
                    $(createIndexGridButton).addClass('gmx-disabled');
                }
            },

            updateLatLngInput: function (latLng) {
                var attrs = this.model.toJSON(),
                    input = this.$('.' + latLng),
                    value = this.model.get(latLng);

                $(input).val(value !== null ? this._roundInputNumber(value) : '');
            },

            handleInputErr: function (inputName) {
                var input = this.$('.' + inputName);

                $(input).toggleClass('error', this.model.get(inputName + 'Err'));
                this.setCreateButtonStatus();
                this.setWarnMessage();
            },

            updateStepInput: function (inputName) {
                var attrs = this.model.toJSON(),
                    input = this.$('.' + inputName),
                    value = this.model.get(inputName);

                $(input).val(value);
            },

            updateXStep: function () {
                var attrs = this.model.toJSON(),
                    xStepInput = this.$('.xStep');

                $(xStepInput).val(attrs.xStep);
            },

            updateYStep: function () {
                var attrs = this.model.toJSON(),
                    yStepInput = this.$('.yStep');

                $(yStepInput).val(attrs.yStep);
            },

            updateIndexCount: function () {
                var attrs = this.model.toJSON(),
                    indexCount = this.$('.indexCount');

                $(indexCount).html(attrs.indexCount ? attrs.indexCount : '');
            },

            handleIndexCountErr: function () {
                var attrs = this.model.toJSON(),
                    indexCount = this.$('.indexCount');

                $(indexCount).toggleClass('errorMessage', attrs.indexCountErr);
                this.setCreateButtonStatus();
                this.setWarnMessage();
            },

            updateName: function () {
                var attrs = this.model.toJSON(),
                    nameInput = this.$('.name');

                $(nameInput).val(attrs.name);
            },

            setCreateButtonStatus: function () {
                var attrs = this.model.toJSON(),
                    createIndexGridButton = this.$('.createIndexGridButton'),
                    err = attrs.minLatErr
                        || attrs.maxLatErr
                        || attrs.maxLngErr
                        || attrs.minLngErr
                        || attrs.xStepErr
                        || attrs.yStepErr
                        || attrs.indexCountErr;

                    $(createIndexGridButton).toggleClass('gmx-disabled', err);
            },

            setWarnMessage: function () {
                var attrs = this.model.toJSON(),
                    warnMessage = this.$('.warnMessage'),
                    err = attrs.minLatErr
                        || attrs.maxLatErr
                        || attrs.maxLngErr
                        || attrs.minLngErr
                        || attrs.xStepErr
                        || attrs.yStepErr
                        || attrs.indexCountErr
                        || attrs.nameErr;

                    $(warnMessage).toggle(err);

                if (
                       attrs.minLatErr
                    || attrs.maxLatErr
                    || attrs.maxLngErr
                    || attrs.minLngErr
                    || attrs.xStepErr
                    || attrs.yStepErr
                ) {
                    $(warnMessage).text(window._gtxt('indexGrid.valueWarn'));
                } else if (attrs.indexCountErr) {
                    $(warnMessage).text(window._gtxt('indexGrid.indexCountWarn'));
                } else if (attrs.nameErr) {
                    $(warnMessage).text(window._gtxt('indexGrid.nameWarn'));
                } else {
                    $(warnMessage).text('');
                }
            },

            setName: function (e) {
                var value,
                    valueErr;

                value = e.target.value;
                valueErr = value === '';

                if (valueErr) {
                    this.model.set('nameErr', true);
                } else {
                    this.model.set('nameErr', false);
                    this.model.set('name', value)
                }
            },

            selectArea: function () {
                var attrs = this.model.toJSON();

                if (!attrs.lmap || attrs.selArea) {
                    return;
                }

                var currentZoom = attrs.lmap.getZoom(),
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

                // прямоугольная рамка
                var rect = L.rectangle(initialBounds);

                this.model.set({
                    z: currentZoom
                });

                this._createFrame(rect);

                this._updateCoords();
                this._updateCorners();
                this._countIndex();
            },

            unselectArea: function () {
                var attrs = this.model.toJSON();
                this._removeFrame();

                this.model.set({
                    width: 0,
                    height: 0,
                    z: attrs.lmap.getZoom(),
                    xStep: 1,
                    yStep: 1,
                    xCount: null,
                    yCount: null,
                    xStepErr: false,
                    yStepErr: false,
                    indexCount: null,
                    indexCountErr: false,
                    minLat: null,
                    minLng: null,
                    maxLat: null,
                    maxLng: null,
                    minLatErr: false,
                    maxLatErr: false,
                    maxLngErr: false,
                    minLngErr: false
                });
            },

            createIndexGrid: function () {
                var attrs = this.model.toJSON(),
                    name = attrs.name,
                    columns = [
                        {
                            Name:"gmx_id",
                            ColumnSimpleType:"Integer",
                            IsIdentity:true,
                            IsComputed:false,
                            IsPrimary:true
                        },
                        {
                            Name:"index",
                            ColumnSimpleType:"String",
                            IsIdentity:false,
                            IsComputed:false,
                            IsPrimary:false
                        }
                    ],
                    layerParams = {
                        Title: name,
                        geometrytype: 'polygon',
                        Columns: JSON.stringify(columns),
                    },
                    indexes = this.generatePolygons(),
                    spinHolder = this.$('.spinHolder'),
                    def = nsGmx.asyncTaskManager.sendGmxPostRequest(window.serverBase + "VectorLayer/CreateVectorLayer.ashx", layerParams),
                    promise,
                    _this = this;

                def.done(function(response) {
                    var layerName = response.Result.properties.name;
                        mapProperties = _layersTree.treeModel.getMapProperties(),
                        targetDiv = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0],
                        gmxProperties = {type: 'layer', content: response.Result},
                        def2 = _mapHelper.modifyObjectLayer(layerName, indexes, 'EPSG:4326');

                    gmxProperties.content.properties.mapName = mapProperties.name;
                    gmxProperties.content.properties.hostName = mapProperties.hostName;
                    gmxProperties.content.properties.visible = true;

                    gmxProperties.content.properties.styles = [{
                        MinZoom: gmxProperties.content.properties.VtMaxZoom,
                        MaxZoom:21,
                        RenderStyle:_mapHelper.defaultStyles[gmxProperties.content.properties.GeometryType]
                    }];

                    $(spinHolder).show();

                    def2.always(function(res) {
                        _layersTree.copyHandler(gmxProperties, targetDiv, false, true);
                        $(spinHolder).hide();
                        _this.unselectArea();
                    })
                });

            },

            generatePolygons: function () {
                var attrs = this.model.toJSON(),
                    xStep = this._convertXStep(attrs.xStep),
                    yStep = this._convertYStep(attrs.yStep),
                    xCount = attrs.xCount,
                    yCount = attrs.yCount,
                    proj = L.Projection.Mercator,
                    north = attrs.maxLat,
                    south = attrs.minLat,
                    west = attrs.minLng,
                    east = attrs.maxLng,
                    indexes = [],
                    index,
                    letterIndexes = this._getLetterIndexes(xCount),
                    letter,
                    n, s, e, w;

                for (var i = 0; i < yCount; i++) {
                    n = north - yStep * i;
                    s = north - yStep * (i+1);

                    for (var j = 0; j < xCount; j++) {
                        letter = letterIndexes[j];
                        w = west + xStep * j;
                        e = west + xStep * (j+1);

                        index = {
                            geometry: L.polygon(
                                [
                                    L.latLng(s, w),
                                    L.latLng(n, w),
                                    L.latLng(n, e),
                                    L.latLng(s, e)
                                ]
                            ).toGeoJSON(),
                            properties: {
                                index: letter + (i+1)
                            }
                        };
                        indexes.push(index);
                    }
                }

                return indexes;
            },

            setStep: function (e) {
                var value,
                    valueErr;

                value = Number(e.target.value);
                valueErr = value <= 0 || isNaN(value);

                // обработка xStep
                if (e.target.className === 'xStep' || e.target.className === 'xStep error') {
                    if (valueErr) {
                        this.model.set('xStepErr', true);
                    } else {
                        this.model.set('xStepErr', false);
                        this.model.set('xStep', value);
                    }
                }

                // обработка yStep
                if (e.target.className === 'yStep' || e.target.className === 'yStep error') {
                    if (valueErr) {
                        this.model.set('yStepErr', true);
                    } else {
                        this.model.set('yStepErr', false);
                        this.model.set('yStep', value);
                    }
                }

                this._countIndex();

            },

            resize: function (e) {
                var attrs = this.model.toJSON(),
                    initialCoords,
                    coords,
                    bounds,
                    scale,
                    screenCoords,
                    newBounds,
                    value, valueErr;

                if (!attrs.lmap || !attrs.selArea) {
                    return;
                }

                // разница между целевым и текущим зумом
                scale = Math.pow(2, (attrs.z - attrs.lmap.getZoom()));
                initialCoords = attrs.selArea.rings[0].ring.points._latlngs;
                coords = attrs.coords ? attrs.coords : initialCoords;

                value = Number(e.target.value);

                valueErr = !value || isNaN(value);

                // обработка ввода значений с плавающей точкой
                if (e.target.value.indexOf(".") === e.target.value.length - 1) {
                    valueErr = true;
                }
                // обработка minLat
                if (e.target.className === 'minLat' || e.target.className === 'minLat error') {
                    if (valueErr) {
                        this.model.set('minLatErr', true);
                    } else {
                        var north = this._getBounds(coords).getNorth();

                        if (value < north) {
                            this.model.set('minLatErr', false);

                            this.model.set('minLat', value);
                        } else {
                            this.model.set('minLatErr', true);
                        }
                    }
                }

                // обработка minLng
                if (e.target.className === 'minLng' || e.target.className === 'minLng error') {
                    if (valueErr) {
                        this.model.set('minLngErr', true);
                    } else {
                        var east = this._getBounds(coords).getEast();

                        if (value < east) {
                            this.model.set('minLngErr', false);
                            this.model.set('minLng', value);
                        } else {
                            this.model.set('minLngErr', true);
                        }
                    }
                }

                // обработка maxLat
                if (e.target.className === 'maxLat' || e.target.className === 'maxLat error') {
                    if (valueErr) {
                        this.model.set('maxLatErr', true);
                    } else {
                        var south = this._getBounds(coords).getSouth();

                        if (value > south) {
                            this.model.set('maxLatErr', false);
                            this.model.set('maxLat', value);
                        } else {
                            this.model.set('maxLatErr', true);
                        }
                    }
                }

                // обработка maxLng
                if (e.target.className === 'maxLng' || e.target.className === 'maxLng error') {
                    if (valueErr) {
                        this.model.set('maxLngErr', true);
                    } else {
                        var west = this._getBounds(coords).getWest();

                        if (value > west) {
                            this.model.set('maxLngErr', false);
                            this.model.set('maxLng', value);
                        } else {
                            this.model.set('maxLngErr', true);
                        }
                    }
                }

                attrs = this.model.toJSON();

                if (attrs.maxLngErr || attrs.minLngErr || attrs.minLatErr || attrs.maxLatErr) return;

                var newRect = L.rectangle([L.latLng(attrs.minLat, attrs.minLng), L.latLng(attrs.maxLat, attrs.maxLng)]);

                this.model.set({
                    'coords': newRect._latlngs
                });

                this._removeFrame();

                this._createFrame(newRect);
                // restore model attributes
                this.model.set({
                    xStep:          attrs.xStep,
                    yStep:          attrs.yStep,
                    xStepErr:       attrs.xStepErr,
                    yStepErr:       attrs.yStepErr,
                    minLatErr:      attrs.minLatErr,
                    maxLatErr:      attrs.maxLatErr,
                    maxLngErr:      attrs.maxLngErr,
                    minLngErr:      attrs.minLngErr
                });

                this._updateCoords();
                this._updateCorners();
                this._countIndex();

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
                frame.on('remove', _this.unselectArea.bind(_this));

            },

            _resizeFrame: function () {
                var attrs = this.model.toJSON(),
                    initialCoords = attrs.selArea.rings[0].ring.points._latlngs,
                    bounds = this._getBounds(initialCoords),
                    err = attrs.minLatErr
                        || attrs.maxLatErr
                        || attrs.maxLngErr
                        || attrs.minLngErr;

                if (err) {
                    return;
                }

                this.model.set({
                    coords: initialCoords,
                    minLat: bounds.getSouth(),
                    minLng: bounds.getWest(),
                    maxLat: bounds.getNorth(),
                    maxLng: bounds.getEast()
                });

                // this.model.set({
                //     minLatErr: false,
                //     maxLatErr: false,
                //     minLngErr: false,
                //     maxLngErr: false
                // });


                this._countIndex();
            },

            _countIndex: function () {
                var attrs = this.model.toJSON();
                    initialCoords = attrs.selArea.rings[0].ring.points._latlngs;
                    coords = attrs.coords ? attrs.coords : initialCoords;
                    dims = this._getLatLngDimensions(coords);

                if (attrs.xStep && attrs.yStep) {
                    xCount = Math.ceil(dims.width / this._convertXStep(attrs.xStep));
                    yCount = Math.ceil(dims.height / this._convertYStep(attrs.yStep));
                    indexCount = xCount * yCount;

                    if (!attrs.xStepErr && !attrs.yStepErr) {
                        if (indexCount > MAX_INDEX_COUNT) {
                            this.model.set('indexCountErr', true);
                        } else {
                            this.model.set('indexCountErr', false);
                        }
                    this.model.set('xCount', xCount);
                    this.model.set('yCount', yCount);
                    this.model.set('indexCount', indexCount);
                    }
                } else {
                    this.model.set('xCount', null);
                    this.model.set('yCount', null);
                    this.model.set('indexCount', null);
                }
            },

            _getBounds: function (latLngs) {
                var lats,
                    lngs,
                    bottomLeft,
                    topRight;

                lats = [latLngs[0].lat, latLngs[1].lat, latLngs[2].lat, latLngs[3].lat];
                lngs = [latLngs[0].lng, latLngs[1].lng, latLngs[2].lng, latLngs[3].lng];
                bottomLeft = L.latLng(this._getMin(lats), this._getMin(lngs));
                topRight = L.latLng(this._getMax(lats), this._getMax(lngs));

                return L.latLngBounds(bottomLeft, topRight);
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
                    bounds;

                if (!attrs.selArea) {
                    return;
                }

                initialCoords = attrs.selArea.rings[0].ring.points._latlngs;

                if (!attrs.coords) {
                    this.model.set('coords', initialCoords);
                }
            },

            _updateCorners: function () {
                var attrs = this.model.toJSON(),
                    initialCoords = attrs.selArea.rings[0].ring.points._latlngs,
                    bounds = this._getBounds(initialCoords);

                this.model.set({
                    minLat: bounds.getSouth(),
                    minLng: bounds.getWest(),
                    maxLat: bounds.getNorth(),
                    maxLng: bounds.getEast()
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

            _revertLatLngs: function (latlngs) {
                var lats,
                    lngs,
                    bottomLeft, topLeft,
                    topRight, bottomRight;

                lats = [latlngs[0].lat, latlngs[1].lat, latlngs[2].lat, latlngs[3].lat];
                lngs = [latlngs[0].lng, latlngs[1].lng, latlngs[2].lng, latlngs[3].lng];
                bottomLeft = L.latLng(this._getMin(lats), this._getMin(lngs));
                topLeft = L.latLng(this._getMax(lats), this._getMin(lngs));
                topRight = L.latLng(this._getMax(lats), this._getMax(lngs));
                bottomRight = L.latLng(this._getMin(lats), this._getMax(lngs));

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

            _convertToMercator: function (latlngs) {
                var attrs = this.model.toJSON(),
                    converted = latlngs.map(function(ll) {
                        return attrs.lmap.options.crs.project(ll);
                    });

                return converted;
            },

            _convertYStep: function (value) {
                return value / KM_PER_DEGREE;
            },

            _convertXStep: function (value) {
                var attrs = this.model.toJSON(),
                    centerLat = attrs.minLat + ((attrs.maxLat - attrs.minLat) / 2),
                    centerY = (centerLat * Math.PI) / 180;

                return (value / KM_PER_DEGREE) / Math.cos(centerY);
            },

            _getLatLngDimensions: function (latlngs) {
                var bottomLeft, topRight,
                    width, height;

                latlngs = this._revertLatLngs(latlngs);

                bottomLeft = latlngs[0];
                topRight = latlngs[2];
                width = Math.abs(topRight.lng - bottomLeft.lng);
                height = Math.abs(topRight.lat - bottomLeft.lat);

                return {
                    width: width,
                    height: height
                }
            },

            // get array of string letters (['A'...'Z', 'AA'...'ZZ'...])
            _getLetterIndexes: function (number) {
                var convert = function(srcNum, scrDict, targetDict) {
                   var targetNum = "";
                   for (var idx in srcNum) {
                      var srcDictIdx = scrDict.search(srcNum[idx]);
                      targetNum += targetDict[srcDictIdx]
                   }
                   return targetNum;
                }

                var buildLettersArray = function (num) {
                    var xlsDict = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                        jsDict  = "0123456789abcdefghijklmnop",
                        radix = xlsDict.length,
                        numStart = 0,
                        numEnd = num,
                        rnt = [];

                    for (var col = numStart; col <= numEnd; col++) {
                       // Unfortunately, the situation is not ideal, we have A...Z and then
                       // AA ... AZ, while A represents the zero digit, so in numbers it is
                       // like having 0..9 and then 00..09 and only then 10...19
                       // so we artificially emulate 00...09 situation here
                       var prefix = "";
                       var numb = col;
                       if (col >= radix) {
                           numb = col - radix;
                       }
                       if (col >= radix && col < radix*2) {
                           prefix = "A";
                       }
                       var jsNum = Number(numb).toString(radix);
                       rnt.push(prefix + convert(jsNum, jsDict, xlsDict));
                    }
                    return rnt;
                };

                return buildLettersArray(number);
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

                return {
                    width: width,
                    height: height
                }
            },

            _getMax: function(arr) {
                return Math.max.apply(null, arr);
            },

            _getMin: function(arr) {
                return Math.min.apply(null, arr);
            },

            _roundInputNumber: function (value) {
                value = (typeof(value) === 'String') ? value : String(value);
                if (value.indexOf(".") != '-1') {
                    value = value.substring(0,value.indexOf(".") + 5);
                }
                return value;
            }
        });

        view = new IndexGridView();

        this.Load = function () {
            var lm = model.get('lm');

            if (lm != null) {
                var alreadyLoaded = lm.createWorkCanvas('mapIndexGrid', this.Unload);
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
                xStep: 1,
                yStep: 1,
                xCount: null,
                yCount: null,
                xStepErr: false,
                yStepErr: false,
                indexCount: null,
                indexCountErr: false,
                maxLat: null,
                maxLng: null,
                minLat: null,
                minLng: null,
                maxLatErr: false,
                minLatErr: false,
                maxLngErr: false,
                minLngErr: false,
                z: attrs.lmap.getZoom(),
                coords: null
            });
        };
    }

    var publicInterface = {
        pluginName: 'IndexGrid',
        IndexGridMenu: IndexGridMenu
  };

    window.gmxCore.addModule('IndexGrid',
        publicInterface
    );
})();
