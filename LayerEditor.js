//Создание интерфейса редактирования свойств слоя
!function($, _){

/** Виджет для выбора полей для X и Y координат из списка полей
* @function
* @param parent {DOMElement} - контейнер для размещения виджета
* @param columns {LatLngColumnsModel} - модель для сохранения выбранных колонок
* @param sourceColumns {Array} - доступные для выбора колонки
*/
var SelectLatLngColumnsWidget = function(parent, columns, sourceColumns)
{
    var updateWidget = function() {
        var parsedColumns = nsGmx.LayerProperties.parseColumns(sourceColumns);

        $(parent).empty();

        if (!parsedColumns.geomCount && parsedColumns.coordColumns.length) {
            var fields = parsedColumns.coordColumns;

			var selectLat = nsGmx.Utils._select(null, [['attr','selectLat',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]),
				selectLon = nsGmx.Utils._select(null, [['attr','selectLon',true],['dir','className','selectStyle'],['css','width','150px'],['css','margin','0px']]);

            selectLat.onchange = function() {
                columns.set('YCol', this.value);
            }

            selectLon.onchange = function() {
                columns.set('XCol', this.value);
            }

			for (var i = 0; i < fields.length; i++)
			{
				var opt = _option([_t(fields[i])], [['attr','value',fields[i]]]);

				_(selectLat, [opt.cloneNode(true)]);
				_(selectLon, [opt.cloneNode(true)]);
            }

            _(parent, [_table([_tbody([
                _tr([
                    _td([_span([_t(_gtxt("Y (широта)"))],[['css','margin','0px 3px']])], [['css','width','73px'],['css','border','none']]),
                    _td([selectLat], [['css','width','150px'],['css','border','none']])
                ]),
                _tr([
                    _td([_span([_t(_gtxt("X (долгота)"))],[['css','margin','0px 3px']])], [['css','width','73px'],['css','border','none']]),
                    _td([selectLon], [['css','width','150px'],['css','border','none']])
                ])
            ])])]);


            if (columns.get('XCol')) {
                selectLon = switchSelect(selectLon, columns.get('XCol'));
            }

            if (columns.get('YCol')) {
                selectLat = switchSelect(selectLat, columns.get('YCol'));
            }

			columns.set({
				XCol: selectLon.value,
				YCol: selectLat.value
			})
        }
    }

    updateWidget();

    this.updateColumns = function(newFields) {
        sourceColumns = newFields;
        updateWidget();
    }
}

var getSourceColumns = function(name)
{
    var deferred = $.Deferred();
    sendCrossDomainJSONRequest(serverBase + "VectorLayer/GetSourceColumns.ashx?SourceName=" + encodeURIComponent(name), function(response)
    {
        if (!parseResponse(response))
        {
            deferred.reject();
            return;
        }

        deferred.resolve(response.Result);
    })

    return deferred.promise();
}

var getFileExt = function(path)
{
    return String(path).substr(String(path).lastIndexOf('.') + 1, path.length);
}

/**
 Диалог редактирования свойств слоя с вкладками (tabs) и кнопкой "Сохранить" под ними
 @memberOf nsGmx
 @param {DOMElement} div Элемент дерева слоёв, соответствующий редактируемому слою
 @param {String} type тип слоя ("Vector" или "Raster")
 @param {DOMElement} parent контейнер, в которым нужно разместить диалог
 @param {Object} properties Параметры слоя. В том формате, в котором они приходят с сервера.
 @param {Object} [params] Дополнительные параметры
 @param {String[]} [params.standardTabs] Массив с названиями стандартных вкладок, которые нужно показывать. По умолчанию показывать все (main, attrs, metadata, advanced)
 @param {Object[]} [params.additionalTabs] Массив дополнительных вкладок со следующими полями:

   - {String} title Что будет написано но вкладке
   - {String} name Уникальный идентификатор вкладки
   - {DOMElement} container Контент вкладки

 @param {String} [params.selected] Идентификатор вкладки, которую нужно сделать активной
 @param {Function(controller)} [params.createdCallback] Ф-ция, которая будет вызвана после того, как диалог будет создан.
        В ф-цию передаётся объект со следующими свойствами:

   - {function(tabName)} selectTab Активизировать вкладку с идентификатором tabName

  @param {Object} [params.additionalUI] Хеш массивов с доп. UI во вкладках. Ключ хеша - ID вкладки (main, attrs, metadata, advanced)
  @param {Boolean} [params.copy] Является ли создаваемы слой копией
*/
var LayerEditor = function(div, type, parent, properties, params) {

    /** Генерируется перед изменением/добавлением слоя. Может быть использован для сохранения в свойствах объекта каких-то внешних данных.
     * @event nsGmx.LayerEditor#premodify
     */

    var _params = $.extend({
            addToMap: true,
            doneCallback: null,
            standardTabs: ['main', 'attrs', 'metadata', 'advanced'],
            additionalUI: {}
        }, params)

    var _this = this;
    this._originalTabs = [];
    this._saveButton = null;

    this.selectTab = function(tabName) {
        var selectedTab = $(tabMenu).tabs('option', 'active');
        $.each(tabs, function(i, tab) {
            if (tab.name === tabName && i !== selectedTab) {
                $(tabMenu).tabs('option', 'active', i);
            }
        })
    }

    params = params || {};

    var genPageDiv = function() {
        return _div([
                _div(null, [['dir', 'className', 'layer-container-inner']])
            ], [['dir', 'className', 'layer-container-outer']]
        );
    }

    var isReadonly = div && _queryMapLayers.layerRights(div.gmxProperties.content.properties.name) !== 'edit' && div.gmxProperties.content.properties.Access !== 'edit';

    var createUI = function() {
        var divProperties = div ? div.gmxProperties.content.properties : !_params.copy ? {} : false,
            layerProperties = new nsGmx.LayerProperties();
            // tabs = [];

        layerProperties.initFromViewer(type, divProperties, properties);

        _params = LayerEditor.applyInitHooks(_this, layerProperties, _params);

        var mainContainer     = genPageDiv();
        var metadataContainer = genPageDiv();
        var advancedContainer = genPageDiv();
        var attrContainer     = genPageDiv();


        if (_params.standardTabs.indexOf('main') >= 0) {
            _this._originalTabs.push({title: _gtxt('Общие'), name: 'main', container: mainContainer});
        }

        if (type === 'Vector' && _params.standardTabs.indexOf('attrs') >= 0) {
            _this._originalTabs.push({title: _gtxt('Поля'), name: 'attrs', container: attrContainer});
        }

        if (!isReadonly) {

            if (_params.standardTabs.indexOf('metadata') >= 0) {
                _this._originalTabs.push({title: _gtxt('Метаданные'), name: 'metadata', container: metadataContainer});
            }

            if (type === 'Vector' && _params.standardTabs.indexOf('advanced') >= 0) {
                _this._originalTabs.push({title: _gtxt('Дополнительно'), name: 'advanced', container: advancedContainer});
            }
        }

        _this._saveButton = null;

        _this._saveButton = makeLinkButton(div ? _gtxt("Изменить") : _gtxt("Создать"));

        var origLayerProperties = layerProperties.clone();

        _this._createPageMain(mainContainer.firstChild, layerProperties, isReadonly, _params);
        _this._createPageMetadata(metadataContainer.firstChild, layerProperties, isReadonly, _params);

        if (type === 'Vector') {
            _this._createPageAdvanced(advancedContainer.firstChild, layerProperties, isReadonly, _params);
            _this._createPageAttributes(attrContainer.firstChild, layerProperties, isReadonly, _params);
        }

        for (var i in _params.additionalUI) {
            var tab = nsGmx._.findWhere(_this._originalTabs, {name: i});
            if (tab) {
                var container = tab.container.firstChild;
                _params.additionalUI[i].forEach(function(ui) {
                    $(container).append(ui);
                })
            }
        }

        if (div) {
            layerProperties.on({
                'change:Title': function() {
                    var title =  layerProperties.get('Title');

                    var span = $(div).find(".layer")[0];
                    $(span).empty();
                    _(span, [_t(title)]);

                    divProperties.title = title;
                },
                'change:Copyright': function() {
                    var copyright = layerProperties.get('Copyright')

                    nsGmx.gmxMap.layersByID[layerProperties.get('Name')].options.attribution = copyright;
                    nsGmx.leafletMap.gmxControlIconManager.get('copyright')._redraw();

                    divProperties.Copyright = copyright;
                },
                'change:Description': function() {
                    var description = layerProperties.get('Description');

                    var span = $(div).find(".layerDescription")[0];
                    $(span).empty();
                    span.innerHTML = description;

                    divProperties.description = description;
                },
                'change:Legend': function() {
                    divProperties.Legend = layerProperties.get('Legend');
                },
                'change:NameObject': function() {
                    divProperties.NameObject = layerProperties.get('NameObject');
                }
            });
        }

        _this._saveButton.onclick = function() {

            $(_this).trigger('premodify');

            var name = layerProperties.get('Name'),
                curBorder = _mapHelper.drawingBorders.get(name),
                oldDrawing = origLayerProperties.get('Geometry'),
                isVector = layerProperties.get('Type') === 'Vector',
                needRetiling = false;

            // если изменились поля с геометрией, то нужно тайлить заново и перегрузить слой в карте
            if (isVector ||
                layerProperties.get('ShapePath').Path != origLayerProperties.get('ShapePath').Path ||
                layerProperties.get('TilePath').Path != origLayerProperties.get('TilePath').Path ||
                (oldDrawing && typeof curBorder != 'undefined') ||
                (!oldDrawing && typeof curBorder != 'undefined') ||
                (oldDrawing && typeof curBorder == 'undefined'))
            {
                needRetiling = true;
            }
            var def = layerProperties.save(needRetiling, null, _params),
                layerTitle = layerProperties.get('Title');

            //doneCallback вызываем при первом progress notification - признаке того, что вызов непосредственно скрипта модификации слоя прошёл успешно
            var onceCallback = nsGmx._.once(function(){
                _params.doneCallback && _params.doneCallback(def, layerTitle);
            });

                def.always(parseResponse);
                def.then(onceCallback, null, onceCallback);

            if (isVector && !name && (layerProperties.get('SourceType') === 'manual')) {
                if (_params.addToMap) {
                    def.done(function(response) {
                        var mapProperties = _layersTree.treeModel.getMapProperties(),
                            targetDiv = $(_queryMapLayers.buildedTree.firstChild).children("div[MapID]")[0],
                            gmxProperties = {type: 'layer', content: response.Result};

                        gmxProperties.content.properties.mapName = mapProperties.name;
                        gmxProperties.content.properties.hostName = mapProperties.hostName;
                        gmxProperties.content.properties.visible = true;

                        gmxProperties.content.properties.styles = [{
                            MinZoom: 1,
                            MaxZoom:21,
                            RenderStyle:gmxProperties.content.properties.IsPhotoLayer ? _mapHelper.defaultPhotoIconStyles[gmxProperties.content.properties.GeometryType] : _mapHelper.defaultStyles[gmxProperties.content.properties.GeometryType]
                        }];

                        _layersTree.copyHandler(gmxProperties, targetDiv, false, true);
                    })
                }
            } else {
                if (name) {
                    _queryMapLayers.asyncUpdateLayer(def, properties, true);
                } else {
                        if (_params.addToMap) {
                            _queryMapLayers.asyncCreateLayer(def, layerTitle);
                        }
                }
            }
        }
    }

    createUI();

    var id = 'layertabs' + (div ? div.gmxProperties.content.properties.name : '');

    var tabs = this._originalTabs;

    if (!isReadonly) {
        tabs = tabs.concat(params.additionalTabs || []);
    }

    var lis = [], containers = [];
    for (var t = 0; t < tabs.length; t++) {
        lis.push(_li([_a([_t(tabs[t].title)],[['attr','href','#' + tabs[t].name + id]])]));
        containers.push(tabs[t].container);
        $(tabs[t].container).attr('id', tabs[t].name + id);
    }

    var tabMenu = _div([_ul(lis)].concat(containers));

    var saveMenuCanvas;

    if (isReadonly) {
        saveMenuCanvas = _div([_t(_gtxt("Недостаточно прав для редактирования настроек слоя"))],[['css','padding','5px 0px 5px 5px'],['css','color','red']]);
    } else {
        saveMenuCanvas = _div([this._saveButton]);
    }

    $(parent).empty().append(_table([
        _tr([_td([tabMenu])], [['css', 'height', '100%'], ['css', 'verticalAlign', 'top']]),
        _tr([_td([_div(null, [['css', 'height', '1px']]), saveMenuCanvas])])
    ], [['css', 'height', '100%'], ['css', 'width', '100%'], ['css', 'position', 'relative']]));

    var getTabIndex = function(tabName) {
        for (var i = 0; i < tabs.length; i++)
            if (tabs[i].name === tabName)
                return i;
        return -1;
    }

    var selectIndex = getTabIndex(params.selected);
    $(tabMenu).tabs({
        active: selectIndex > -1 ? selectIndex : 0,
        activate: function(event, ui) {
            var activeIndex = $(tabMenu).tabs('option', 'active');
            $(saveMenuCanvas).toggle(activeIndex < _this._originalTabs.length);
        }
    });

    $(saveMenuCanvas).toggle(selectIndex < this._originalTabs.length);

    params.createdCallback && params.createdCallback(this);
}


LayerEditor.prototype._createPageMain = function(parent, layerProperties, isReadonly, params) {

    var title = _input(null,[['attr','fieldName','title'],['attr','value',layerProperties.get('Title')],['dir','className','inputStyle'],['css','width','220px']]);
    title.onkeyup = function() {
        layerProperties.set('Title', this.value);
        return true;
    }

    layerProperties.on('change:Title', function() {
        var newTitle = layerProperties.get('Title');
        if ( newTitle !== title.value ) {
            title.value = newTitle;
        }
    })

    var copyright = _input(null,[['attr','fieldName','copyright'],['attr','value',layerProperties.get('Copyright')],['dir','className','inputStyle'],['css','width','220px']]);
    copyright.onkeyup = function() {
        layerProperties.set('Copyright', this.value);
        return true;
    }

    var legend = _input(null,[['attr','fieldName','Legend'],['attr','value',layerProperties.get('Legend')],['dir','className','inputStyle'],['css','width','220px']])
    legend.onkeyup = legend.onchange = function() {
        layerProperties.set('Legend', this.value);
        return true;
    }

    var descr = _textarea(null,[
        ['attr','fieldName','description'],
        ['dir','className','inputStyle'],
        ['css','width','220px'],
        ['css','height','50px']
    ]);

    descr.onkeyup = function() {
        layerProperties.set('Description', this.value);
        return true;
    }

    descr.value = layerProperties.get('Description');

    var currentGeometryType = layerProperties.get('GeometryType');
    var geometryTitle = null;

    var geometryTypes = [
        {title: _gtxt('полигоны'), type: 'polygon'},
        {title: _gtxt('линии'), type: 'linestring'},
        {title: _gtxt('точки'), type: 'point'}
    ];

    for (var i = 0; i < geometryTypes.length; i++) {
        if (currentGeometryType === geometryTypes[i].type) {
            geometryTitle = geometryTypes[i].title
        }
    }

    var geometryType = _input(null,[['attr','fieldName','geom_type'],['attr','value', geometryTitle],['attr','disabled', 'disabled'],['dir','className','inputStyle'],['css','width','220px']]);

    var shownProperties = [];

    shownProperties.push({name: _gtxt("Имя"), field: 'Title', elem: title});
    shownProperties.push({name: _gtxt("Копирайт"), field: 'Copyright', elem: copyright});

    if (layerProperties.get('Name')) {
        shownProperties.push({name: _gtxt("ID"), field: 'Name'});
    }

    shownProperties.push({name: _gtxt("Описание"), field: 'Description', elem: descr});

    if (layerProperties.get('Type') === "Vector" && layerProperties.get('Geometry') !== undefined) {
        shownProperties.push({name: _gtxt("Геометрия"), field: 'geometryType', elem: geometryType});
    }

    if (layerProperties.get('Type') != "Vector") {
        var selectImage = new mapHelper.ImageSelectionWidget();
        selectImage.on('selected', function(url) {
            var imgHtml = '<img src="' + url + '"></img>';
            legend.value = imgHtml;
            layerProperties.set('Legend', imgHtml);
        })

        var tr = $(Handlebars.compile('<tr>' +
            '<td class="propertiesTable-title">{{i "Легенда"}}<span class="layer-editor-legend-image"></span></td>' +
            '<td class="layer-editor-legend"></td>' +
        '</tr>')());
        tr.find('.layer-editor-legend-image').append(selectImage.el);
        tr.find('.layer-editor-legend').append(legend);
        shownProperties.push({tr: tr[0]});
    }

    if (!isReadonly) {
        if (layerProperties.get('Type') === "Vector") {
            shownProperties = shownProperties.concat(!params.copy ? this._createPageVectorSource(layerProperties, params) : []);
        } else if (layerProperties.get('Type') === "Raster") {
            shownProperties = shownProperties.concat(this._createPageRasterSource(layerProperties));
        }
    }

    var trs = _mapHelper.createPropertiesTable(shownProperties, layerProperties.attributes, {leftWidth: 70});
    _(parent, [_table([_tbody(trs)],[['dir','className','propertiesTable']])]);

    if (isReadonly) {
        $(parent).find('input, textarea').prop('disabled', true);
    }
}

LayerEditor.prototype._createPageVectorSource = function(layerProperties, params) {
    var _this = this;
    var LatLngColumnsModel = new gmxCore.getModule('LayerProperties').LatLngColumnsModel;
    var shownProperties = [];
    var layerName = layerProperties.get('Name');
    var sourceType = layerProperties.get('SourceType');

    /*------------ Источник: файл ------------*/
    var shapePath = layerProperties.get('ShapePath');

    var shapePathInput = _input(null,[['attr','fieldName','ShapePath.Path'],['attr','value', shapePath.Path || ''],['dir','className','inputStyle'],['css','width', '200px']]),
        shapeFileLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
        encodingParent = _div(),
        xlsColumnsParent = _div();

    shapePathInput.onkeyup = shapePathInput.onchange = function() {
        layerProperties.set('ShapePath', {Path: this.value});
    }

    var fileSourceColumns = sourceType === 'file' ? layerProperties.get('Columns') : [];
    var fileSelectedColumns = sourceType === 'file' ? layerProperties.get('GeometryColumnsLatLng') : new LatLngColumnsModel();
    var fileColumnsWidget = !params.copy ? new SelectLatLngColumnsWidget(xlsColumnsParent, fileSelectedColumns, fileSourceColumns) : null;

    shapeFileLink.style.marginLeft = '3px';

    var encodingWidget = new nsGmx.ShpEncodingWidget();
    shapePathInput.oldValue = shapePathInput.value;

    $(encodingWidget).change(function() {
        layerProperties.set('EncodeSource', encodingWidget.getServerEncoding());
    })

    if (getFileExt(shapePathInput.value) === 'shp') {
        encodingWidget.drawWidget(encodingParent, layerProperties.get('EncodeSource'));
    }

    if (shapePath && shapePath.Path != null && shapePath.Path != '' && !shapePath.Exists) {
        $(shapePathInput).addClass('error');
    }

    //TODO: использовать события модели
    shapeFileLink.onclick = function()
    {
        _fileBrowser.createBrowser(_gtxt("Файл"), ['shp','tab', 'xls', 'xlsx', 'xlsm', 'mif', 'gpx', 'kml', 'csv', 'sxf', 'gdbtable', 'geojson', 'kmz'], function(path)
        {
            shapePathInput.value = path;
            layerProperties.set('ShapePath', {Path: path});

            var index = String(path).lastIndexOf('.'),
                ext = String(path).substr(index + 1, path.length);

            if (layerProperties.get('Title') == '')
            {
                var indexSlash = String(path).lastIndexOf('\\'),
                    fileName = String(path).substring(indexSlash + 1, index);

                layerProperties.set('Title', fileName);
            }

            getSourceColumns(path).done(function(sourceColumns)
            {
                layerProperties.set('Columns', sourceColumns);
                fileSourceColumns = sourceColumns;
            })

            $(encodingParent).empty();
            if (ext === 'shp')
            {
                encodingWidget.drawWidget(encodingParent);
            }
        })
    }

    var sourceFile = _div(null, [['dir', 'id', 'fileSource' + layerName]]);
    _(sourceFile, [shapePathInput, shapeFileLink, encodingParent, xlsColumnsParent/*, fileAddAttribute, fileColumnsContainer*/]);

    /*------------ Источник: таблица ------------*/
    var tableLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
        tableColumnsParent = _div();

    var tableSourceColumns   = sourceType === 'table' ? layerProperties.get('Columns') : [];
    var tableSelectedColumns = sourceType === 'table' ? layerProperties.get('GeometryColumnsLatLng') : new LatLngColumnsModel();
    var tableColumnsWidget = new SelectLatLngColumnsWidget(tableColumnsParent, tableSelectedColumns, tableSourceColumns);

    var tablePathInput = _input(null,[
        ['attr','fieldName','TableName'],
        ['attr','value', layerProperties.get('TableName') || ''],
        ['dir','className','inputStyle'],
        ['css','width', '200px']
    ]);

    tablePathInput.onkeyup = tablePathInput.onchange = function() {
        layerProperties.set('TableName', this.value);
    }

    tableLink.onclick = function()
    {
        _tableBrowser.createBrowser(function(name)
        {
            tablePathInput.value = name;
            layerProperties.set('TableName', name);

            if (layerProperties.get('Title') == '') {
                layerProperties.set('Title', name);
            }

            getSourceColumns(name).done(function(sourceColumns)
            {
                layerProperties.set('Columns', sourceColumns);
                tableSourceColumns = sourceColumns;
            })
        })
    }

    tableLink.style.marginLeft = '3px';

    var TableCSParent = _div();
    var TableCSSelect = $('<select/>', {'class': 'selectStyle'}).css('width', '165px')
        .append($('<option>').val('EPSG:4326').text(_gtxt('Широта/Долгота (EPSG:4326)')))
        .append($('<option>').val('EPSG:3395').text(_gtxt('Меркатор (EPSG:3395)')))
        .change(function() {
            layerProperties.set('TableCS', $(this).find(':selected').val());
        })

    if (layerProperties.get('TableCS')) {
        TableCSSelect.find('[value="' + layerProperties.get('TableCS') +'"]').attr('selected', 'selected');
    }

    $(TableCSParent).append($('<span/>').text(_gtxt('Проекция')).css('margin', '3px')).append(TableCSSelect);

    var sourceTable = _div([tablePathInput, tableLink, TableCSParent, tableColumnsParent], [['dir', 'id', 'tableSource' + layerName]])

    /*------------ Источник: вручную ------------*/
    var geometryTypes = [
        {title: _gtxt('полигоны'), type: 'polygon'   , className: 'manual-polygon'},
        {title: _gtxt('линии'),          type: 'linestring', className: 'manual-linestring'},
        {title: _gtxt('точки'),          type: 'point'     , className: 'manual-point'}
    ];

    var RadioButtonsWidget = function(container, buttons, activeType) {
        var _this = this;
        var _activeType = activeType || buttons[0].type;
        $(container).empty().addClass('manual-type-widget');

        for (var b = 0; b < buttons.length; b++) {
            $('<div/>')
                .addClass(buttons[b].className)
                .toggleClass('manual-active-type', _activeType === buttons[b].type)
                .attr('title', buttons[b].title)
                .appendTo(container)
                .data('type', buttons[b].type);
        }

        $('div', container).click(function() {
            $(this).siblings().removeClass('manual-active-type');
            $(this).addClass('manual-active-type');
            _activeType = $(this).data('type');
            $(_this).change();
        })

        this.getActiveType = function() {
            return _activeType;
        }
    }

    var geometryTypeContainer = $('<div/>').css({'display': 'inline-block', 'vertical-align': 'middle'});
    var geometryTypeWidget = new RadioButtonsWidget(geometryTypeContainer, geometryTypes, layerProperties.get('GeometryType'));
    $(geometryTypeWidget).change(function() {
        layerProperties.set('GeometryType', geometryTypeWidget.getActiveType());
    })

    layerProperties.set('GeometryType', geometryTypeWidget.getActiveType());

    var editAttributeLink = $('<span/>').addClass('buttonLink').text(_gtxt('Редактировать поля')).click(function() {
        _this.selectTab('attrs');
    })

    var attrViewParent = _div();
    var geometryTypeTitle = _span([_t(_gtxt('Геометрия') + ': ')], [['css', 'height', '20px'], ['css', 'verticalAlign', 'middle']]);
    var attrContainer = _div([
        _div([
            layerName ? _div(): _div([geometryTypeTitle, geometryTypeContainer[0]]),
            editAttributeLink[0]
        ]),
        _div([attrViewParent], [['css', 'margin', '3px']])
    ], [['css', 'marginLeft', '3px']]);

    var sourceManual = _div([attrContainer], [['dir', 'id', 'manualSource' + layerName]]);

    /*------------ Общее ------------*/
    layerProperties.on({
        'change:Columns': function() {
            var columns = layerProperties.get('Columns');
            tableColumnsWidget.updateColumns(columns);
            fileColumnsWidget && fileColumnsWidget.updateColumns(columns);
        }
    })

    /*------------ Переключалка источника слоя ------------*/
    var sourceContainers = [sourceFile, sourceTable, sourceManual];

    var template = Handlebars.compile(
        '<form>' +
            '<label><input type="radio" name="sourceCheckbox" id="chxFileSource" data-container-idx="0" checked>{{i "Файл"}}</label><br/>' +
            '{{#unless copy}}' +
            '{{#if admin}}<label><input type="radio" name="sourceCheckbox" id="chxTableSource" data-container-idx="1">{{i "Таблица"}}</label><br/>{{/if}}' +
            '<label><input type="radio" name="sourceCheckbox" id="chxManualSource" data-container-idx="2">{{i "Вручную"}}</label>' +
            '{{/unless}}' +
        '</form>'
    )

    var sourceCheckbox = $(template({
        admin: nsGmx.AuthManager.isRole(nsGmx.ROLE_ADMIN),
        copy: params.copy
    }));

    sourceCheckbox.find('input, label').css({verticalAlign: 'middle'});
    sourceCheckbox.find('input').css({marginRight: 2});
    sourceCheckbox.find('input').click(function()
    {
        var activeIdx = $(this).data('containerIdx');
        $(sourceTab).tabs('option', 'active', activeIdx);
    });


    var activeCheckboxID = {'file': 'chxFileSource', 'table': 'chxTableSource', 'manual': 'chxManualSource'}[sourceType];
    $('#' + activeCheckboxID, sourceCheckbox).attr('checked', 'checked');

    var sourceTab = _div([_ul([
        _li([_a([_t(_gtxt('Файл'))],   [['attr','href','#fileSource' + layerName]])]),
        _li([_a([_t(_gtxt('Таблица'))],[['attr','href','#tableSource' + layerName]])]),
        _li([_a([_t(_gtxt('Вручную'))],[['attr','href','#manualSource' + layerName]])])
    ], [['css', 'display', 'none']])]);

    var selectedSource = {'file': 0, 'table': 1, 'manual': 2}[sourceType];
    _(sourceTab, sourceContainers);

    $(sourceTab).tabs({
        active: selectedSource,
        activate: function(event, ui)
        {
            var selectedSource = $(sourceTab).tabs('option', 'active');

            if (selectedSource == 0) {
                layerProperties.set('Columns', fileSourceColumns);
                layerProperties.set('SourceType', 'file');
                layerProperties.set('GeometryColumnsLatLng', fileSelectedColumns);
            } else if (selectedSource == 1) {
                layerProperties.set('Columns', tableSourceColumns);
                layerProperties.set('SourceType', 'table');
                layerProperties.set('GeometryColumnsLatLng', tableSelectedColumns);
                layerProperties.set('TableCS', TableCSSelect.find(':selected').val());
            } else if (selectedSource == 2) {
                layerProperties.set('SourceType', 'manual');
            }
        }
    });

    var sourceTr2;

    if (!layerName) {
        sourceTr2 = _tr([_td([sourceCheckbox[0]], [['css','padding','5px'], ['css', 'verticalAlign', 'top'], ['css', 'lineHeight', '18px']]), _td([_div([sourceTab])])]);
    } else {
        var sourceTitle = {'file': _gtxt('Файл'), 'table': _gtxt('Таблица'), 'manual': _gtxt('Вручную')}[sourceType];
        var sourceControls = {'file': sourceFile, 'table': sourceTable, 'manual': sourceManual}[sourceType];
        sourceTr2 = _tr([
            _td([_t(_gtxt("Источник") + ': ' + sourceTitle)], [['css','padding','5px'], ['css', 'verticalAlign', 'top'], ['css', 'lineHeight', '18px']]),
            _td([sourceControls])
        ]);
    }

    if (!layerName || sourceType !== 'manual') {
        shownProperties.push({tr: sourceTr2});
    }

    return shownProperties;
}

LayerEditor.prototype._createPageRasterSource = function(layerProperties) {
    var shapePath = layerProperties.get('ShapePath');
    var tilePath = layerProperties.get('TilePath');
    var name = layerProperties.get('Name');

    var shapePathInput = _input(null,[['attr','fieldName','ShapePath.Path'],['attr','value',shapePath.Path || ''], ['dir','className','inputStyle'],['css','width','220px']]),
        tilePathInput = _input(null,[['attr','fieldName','TilePath.Path'],['attr','value',tilePath.Path || ''], ['dir','className','inputStyle'],['css','width','220px']]),
        tileCatalogLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
        tileFileLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
        shapeLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
        drawingBorderLink = makeImageButton("img/choose2.png", "img/choose2_a.png"),
        drawingBorderDescr = _span(null, [['attr','id','drawingBorderDescr' + name],['css','color','#215570'],['css','marginLeft','3px']]),
        removeBorder = makeImageButton('img/closemin.png','img/close_orange.png'),
        divBorder = _div([drawingBorderDescr, removeBorder]),
        isAdmin = nsGmx.AuthManager.isRole(nsGmx.ROLE_ADMIN),
        catalogPathElems = [_t(_gtxt("Каталог")), tileCatalogLink, _br()],
        filePathElems = [_t(_gtxt("Файл")), tileFileLink],
        trPath = _tr([_td(isAdmin ? catalogPathElems.concat(filePathElems) : filePathElems, [['css','paddingLeft','5px'],['css','fontSize','12px']]), _td([tilePathInput])]),
        trShape = _tr([_td([_t(_gtxt("Граница")), shapeLink],[['css','paddingLeft','5px'],['css','fontSize','12px']]),
                       _td([shapePathInput, divBorder])]),
        shapeVisible = function(flag)
        {
            if (flag)
            {
                shapePathInput.style.display = '';
                divBorder.style.display = 'none';
            }
            else
            {
                shapePathInput.style.display = 'none';
                divBorder.style.display = '';
            }
        };

    divBorder.style.cssText = "height:22px; padding-top:3px;";

    removeBorder.style.cssText = "height:16px;padding:0;width:16px;cursor:pointer;margin:-1px 0px -3px 5px;";

    _title(removeBorder, _gtxt("Удалить"));

    tilePathInput.onchange = tilePathInput.oninput = function() {
        layerProperties.set('TilePath', {Path: this.value});
    }

    shapePathInput.onchange = shapePathInput.oninput = function() {
        layerProperties.set('ShapePath', {Path: this.value});
    }

    removeBorder.onclick = function()
    {
        shapeVisible(true);
        _mapHelper.drawingBorders.removeRoute(name, true);
        layerProperties.set('Geometry', null);
    }

    if (name)
    {
        _(trShape.firstChild, [_br(), _t(_gtxt("Контур")), drawingBorderLink]);

        if (shapePath.Path)
            shapeVisible(true);
        else
        {
            shapeVisible(false);

            var geometry = layerProperties.get('Geometry');

            var geom = L.gmxUtil.geometryToGeoJSON(geometry, true);
            var drawingBorder = nsGmx.leafletMap.gmxDrawing.addGeoJSON(geom)[0];

            _mapHelper.drawingBorders.set(name, drawingBorder);

            _mapHelper.drawingBorders.updateBorder(name, drawingBorderDescr);
        }
    }
    else {
        shapeVisible(true);
    }

    if (shapePath && shapePath.Path != null && shapePath.Path != '' && !shapePath.Exists)
        $(shapePathInput).addClass('error');

    if (tilePath.Path != null && tilePath.Path != '' && !tilePath.Exists)
        $(tilePathInput).addClass('error');

    tileCatalogLink.onclick = function()
    {
        _fileBrowser.createBrowser(_gtxt("Каталог"), [], function(path)
        {
            tilePathInput.value = path;
            layerProperties.set('TilePath', {Path: path});

            if (!layerProperties.get('Title'))
            {
                path = path.substring(0, path.length - 1); //убираем слеш на конце
                var indexSlash = String(path).lastIndexOf('\\'),
                    fileName = String(path).substring(indexSlash + 1, path.length);

                layerProperties.set('Title', fileName);
            }
        })
    }

    var appendMetadata = function(data)
    {
        var layerTags = layerProperties.get('MetaProperties');
        if (!data || !layerTags) return;

        // var convertedTagValues = {};
        for (var mp in data)
        {
            var tagtype = data[mp].Type;
            layerTags.addNewTag(mp, nsGmx.Utils.convertFromServer(tagtype, data[mp].Value), tagtype);
        }

        if (!layerProperties.get('Title'))
        {
            var platform = layerTags.getTagByName('platform');
            var dateTag  = layerTags.getTagByName('acqdate');
            var timeTag  = layerTags.getTagByName('acqtime');

            if (typeof platform !== 'undefined' && typeof dateTag !== 'undefined' && typeof timeTag !== 'undefined')
            {
                var timeOffset = (new Date()).getTimezoneOffset()*60*1000;

                var dateInt = nsGmx.Utils.convertToServer('Date', dateTag.value);
                var timeInt = nsGmx.Utils.convertToServer('Time', timeTag.value);

                var date = new Date( (dateInt+timeInt)*1000 + timeOffset );

                var dateString = $.datepicker.formatDate('yy.mm.dd', date);
                var timeString = $.datepicker.formatTime('HH:mm', {hour: date.getHours(), minute: date.getMinutes()});

                layerProperties.set('Title', platform.value + '_' + dateString + '_' + timeString + '_UTC');
            }
        }
    }

    tileFileLink.onclick = function()
    {
        _fileBrowser.createBrowser(_gtxt("Файл"), ['jpeg', 'jpg', 'tif', 'tiff', 'bmp', 'png', 'img', 'tiles', 'cpyr', 'mbtiles'], function(path)
        {
            tilePathInput.value = path;
            layerProperties.set('TilePath', {Path: path});

            sendCrossDomainJSONRequest(serverBase + 'Layer/GetMetadata.ashx?basepath=' + encodeURIComponent(path), function(response)
            {
                if (!parseResponse(response))
                    return;

                appendMetadata(response.Result.MetaProperties);

                if (!layerProperties.get('Title'))
                {
                    var indexExt = String(path).lastIndexOf('.');
                    var indexSlash = String(path).lastIndexOf('\\'),
                        fileName = String(path).substring(indexSlash + 1, indexExt);

                    layerProperties.set('Title', fileName);
                }
            })
        })
    }

    shapeLink.onclick = function()
    {
        _fileBrowser.createBrowser(_gtxt("Граница"), ['mif','tab','shp', 'geojson', 'kmz'], function(path)
        {
            shapePathInput.value = path;
            layerProperties.set('ShapePath', {Path: path});

            _mapHelper.drawingBorders.removeRoute(name, true);

            shapeVisible(true);

            sendCrossDomainJSONRequest(serverBase + 'Layer/GetMetadata.ashx?geometryfile=' + encodeURIComponent(path), function(response)
            {
                if (!parseResponse(response))
                    return;

                appendMetadata(response.Result.MetaProperties);
            })
        })
    }

    drawingBorderLink.onclick = function()
    {
        nsGmx.Controls.chooseDrawingBorderDialog( name, function(polygon)
        {
            _mapHelper.drawingBorders.set(name, polygon);
            _mapHelper.drawingBorders.updateBorder(name);
            shapeVisible(false);

        }, {geomType: 'POLYGON', errorMessage: _gtxt("$$phrase$$_17")} );
    }

    tileCatalogLink.style.marginLeft = '3px';
    tileFileLink.style.marginLeft = '3px';
    shapeLink.style.marginLeft = '3px';
    drawingBorderLink.style.marginLeft = '3px';

    var shownProperties = [
        {tr:trPath},
        {tr:trShape}
    ];

    return shownProperties;
}

LayerEditor.prototype._createPageAttributes = function(parent, props, isReadonly, params) {

    var isNewLayer = !props.get('Name');
    var fileColumnsContainer = _div();
    var fileAttrModel = new nsGmx.ManualAttrModel(props.get('RC').get('IsRasterCatalog'));
    var type = props.get('SourceType');

    if (isNewLayer) {
        props.on('change:Columns', function() {
            if (props.get('SourceType') !== 'manual') {
                fileAttrModel.initFromServerFormat(props.get('Columns'));
            }
        });
    }

    fileAttrModel.initFromServerFormat(props.get('Columns'));

    var fileAttrView = new nsGmx.ManualAttrView();
    fileAttrView.init(fileColumnsContainer, fileAttrModel);
    var allowEdit = !isReadonly && (type === 'manual' || (!isNewLayer && type === 'file'));
    fileAttrView.setActive(allowEdit);

    $(fileAttrModel).change(function() {
        var isManual = props.get('SourceType') === 'manual';
        props.set('Columns', fileAttrModel.toServerFormat());
    });

    _(parent, [fileColumnsContainer]);

    props.on('change:SourceType', function() {
        var type = props.get('SourceType');
        var allowEdit = type === 'manual' || (!isNewLayer && type === 'file');
        fileAttrModel.initFromServerFormat(props.get('Columns'));
        fileAttrView.setActive(allowEdit);
    });
}

LayerEditor.prototype._createPageMetadata = function(parent, layerProperties) {
    nsGmx.TagMetaInfo.loadFromServer(function(tagsInfo)
    {
        var layerTags = layerProperties.get('MetaProperties');
        nsGmx.LayerTagsWithInfo.call(layerTags, tagsInfo);
        new nsGmx.LayerTagSearchControl(layerTags, parent);
    })
}

LayerEditor.prototype._createPageAdvanced = function(parent, layerProperties) {
    //мультивременной слой
    var temporalLayerParent = _div(null, [['dir', 'className', 'TemporalLayer']]);
    var temporalProperties = layerProperties.get('Temporal');
    var temporalLayerView = new nsGmx.TemporalLayerParamsWidget(temporalLayerParent, temporalProperties, []);
    var isTemporalCheckbox = $('<input/>')
        .attr({type: 'checkbox'})
        .change(function() {
            temporalProperties.set('isTemporal', this.checked);
        });

    var updateTemporalVisibility = function() {
        var isTemporal = temporalProperties.get('isTemporal');
        if (isTemporal) {
            temporalFieldset.children('fieldset').removeAttr('disabled');
        } else {
            temporalFieldset.children('fieldset').attr('disabled', 'disabled');
        }

        if (isTemporalCheckbox[0].checked != isTemporal) {
            isTemporalCheckbox[0].checked = isTemporal;
        }
    }

    var updateTemporalColumns = function() {
        var parsedColumns = nsGmx.LayerProperties.parseColumns(layerProperties.get('Columns'));
        temporalLayerView.updateColumns(parsedColumns.dateColumns);
        if (parsedColumns.dateColumns.length === 0) {
            isTemporalCheckbox.attr('disabled', 'disabled');
            $('legend label', temporalFieldset).css('color', 'gray');
            $('legend', temporalFieldset).attr('title', _gtxt("Отсутствует временной атрибут"));
            temporalProperties.set('isTemporal', false);
        } else {
            isTemporalCheckbox.removeAttr('disabled');
            $('legend label', temporalFieldset).css('color', '');
            $('legend', temporalFieldset).removeAttr('title');
        }
    }

    temporalProperties.on('change:isTemporal', updateTemporalVisibility);
    layerProperties.on('change:Columns', updateTemporalColumns);

    var temporalFieldset = $('<fieldset/>').addClass('layer-fieldset').append(
        $('<legend/>').append(
            $('<label/>').append(isTemporalCheckbox).append(_gtxt("Данные с датой"))
        ),
        $('<fieldset/>').append(temporalLayerParent) //вложенный fieldset нужен из-за бага в Opera
    ).appendTo(parent);

    updateTemporalVisibility();
    updateTemporalColumns();

    //каталог растров
    var RCTemplate = Handlebars.compile(
        '<fieldset class="layer-fieldset">' +
            '<legend><label>' +
                '<input type="checkbox" id="rc-params-isRC" {{#isRC}}checked{{/isRC}}>{{i "Каталог растров"}}' +
            '</label></legend>' +
            //вложенный fieldset нужен из-за бага в Opera
            '<fieldset {{^isRC}}disabled="disabled"{{/isRC}}><div id="rc-params-div"></div></fieldset>' +
        '</fieldset>');

    var rcFieldset = $(RCTemplate({
            isRC: layerProperties.get('RC').get('IsRasterCatalog')
        })).appendTo(parent);

    var rasterCatalogControl = new nsGmx.LayerRasterCatalogWidget($('#rc-params-div', rcFieldset), layerProperties.get('RC'));

    var quicklookTemplate = Handlebars.compile(
        '<fieldset class="layer-fieldset">' +
            '<legend>{{i "Накладываемое изображение"}}</legend>' +
            '<div class="layer-editor-quicklooks"></div>' +
        '</fieldset>'
    );

    var quicklookFieldset = $(quicklookTemplate()).appendTo(parent);

    var quicklookWidget = new nsGmx.LayerQuicklookWidget($('.layer-editor-quicklooks', quicklookFieldset), layerProperties);

    $('#rc-params-isRC', rcFieldset).change(function() {
        layerProperties.get('RC').set('IsRasterCatalog', this.checked);
        rcFieldset.children('fieldset').prop('disabled', !this.checked);
    });

    //Шаблон имени
    var nameObjectInput = _input(null,[['attr','fieldName','NameObject'],['attr','value',layerProperties.get('NameObject')],['dir','className','inputStyle'],['css','width','220px']])
    nameObjectInput.onkeyup = function()
    {
        layerProperties.set('NameObject', this.value);
        return true;
    }

    $('<div/>').append(
        $('<span/>').text(_gtxt("Шаблон названий объектов")).css('margin-left', '5px'),
        nameObjectInput
    ).appendTo(parent);
}

LayerEditor._initHooks = [];
LayerEditor.addInitHook = function(hook) {
    LayerEditor._initHooks.push(hook);
}

LayerEditor.applyInitHooks = function(layerEditor, layerProperties, params) {
    LayerEditor._initHooks.forEach(function(hook){
        params = hook(layerEditor, layerProperties, params) || params;
    })

    return params;
}

var createLayerEditor = function(div, type, parent, properties, params) {
    var def = $.Deferred();

    params = $.extend(true, {}, params);

    params.createdCallback = function() {
        def.resolve(layerEditor);
    }

    var layerEditor = new LayerEditor(div, type, parent, properties, params);

    return def;
}

nsGmx.LayerEditor = LayerEditor;

gmxCore.addModule('LayerEditor', {
        createLayerEditor: createLayerEditor,
        LayerEditor: LayerEditor
    }, {
        require: ['LayerProperties']
    }
)

}(jQuery, nsGmx.Utils._)
