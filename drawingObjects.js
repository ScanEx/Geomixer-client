/**
* @namespace DrawingObjects
* @description SDK для редактирования объектов на карте
*/
!(function($, _){

nsGmx.Translations.addText('rus', {
    drawingObjects: {
        editStyleTitle: 'Редактировать стиль',
        removeObject: 'Удалить',
        pointTitle: 'точка',
        lineTitle: 'линия',
        polygonTitle: 'многоугольник',
        rectangleTitle: 'прямоугольник',
        removeAll: 'Очистить',
        downloadShp: 'shp',
        downloadGeoJSON: 'geojson',
        downloadGpx: 'gpx',
        downloadCsv: 'csv',
        downloadNameTitle: 'Введите имя файла для скачивания',
        download: 'Скачать файл',
        downloadRaster: 'Скачать фрагмент растра',
        noRectangleError: 'Выберите область рамкой на карте',
        noRasterError: 'К прямоугольнику не подходит ни одного растрового слоя',

        edit: {
            border: 'Граница',
            color: 'Цвет',
            transparency: 'Прозрачность',
            lineWidth: 'Толщина линии',
            description: 'Описание',
            title: 'Редактирование стиля объекта'
        }
    }
})

nsGmx.Translations.addText('eng', {
    drawingObjects: {
        editStyleTitle: 'Edit style',
        removeObject: 'Delete',
        pointTitle: 'point',
        lineTitle: 'line',
        polygonTitle: 'polygon',
        rectangleTitle: 'rectangle',
        removeAll: 'Delete',
        downloadShp: 'shp',
        downloadGeoJSON: 'geojson',
        downloadGpx: 'gpx',
        downloadCsv: 'csv',
        downloadNameTitle: 'Enter file name to download',
        download: 'Download file',
        downloadRaster: 'Download fragment of raster',
        noRectangleError: 'Select region using frame',
        noRasterError: 'No one raster layer fit the rectangle',

        edit: {
            border: 'Outline',
            color: 'Color',
            transparency: 'Transparency',
            lineWidth: 'Line thickness',
            description: 'Description',
            title: 'Object style editing'
        }
    }
});

var setDrawingFeatureStyle = function(drawingFeature, templateStyle) {
    var color = '#' + L.gmxUtil.dec2hex(templateStyle.outline.color),
        opacity = templateStyle.outline.opacity/100;
    drawingFeature.setOptions({
        lineStyle: {
            color: color,
            opacity: opacity,
            weight: templateStyle.outline.thickness
        },
        pointStyle: {
            color: color,
            opacity: opacity
        }
    });
}

var CreateDrawingStylesEditorIcon = function(style, type)
{
	var icon = nsGmx.Controls.createGeometryIcon(style, type);

	_title(icon, _gtxt('drawingObjects.editStyleTitle'));

	return icon;
}

var CreateDrawingStylesEditor = function(parentObject, style, elemCanvas)
{
	var templateStyle = {};
    var jQueryDialog = null;

	$.extend(true, templateStyle, style);

	elemCanvas.onclick = function()
	{
        if (jQueryDialog) {
            return;
        }
		var canvas = _div(null,[['css','marginTop','10px']]),
			outlineParent = _tr(),
			outlineTitleTds = [],
			outlineTds = [];

		outlineTitleTds.push(_td([_t(_gtxt('drawingObjects.edit.border'))],[['css','width','70px']]));

		var outlineColor = nsGmx.Controls.createColorPicker(templateStyle.outline.color,
			function (colpkr){
				$(colpkr).fadeIn(500);
				return false;
			},
			function (colpkr){
				$(colpkr).fadeOut(500);
				return false;
			},
			function (hsb, hex, rgb) {
				outlineColor.style.backgroundColor = '#' + hex;

				templateStyle.outline.color = outlineColor.hex = parseInt('0x' + hex);

				$(elemCanvas).find(".borderIcon")[0].style.borderColor = '#' + hex;

				setDrawingFeatureStyle(parentObject, templateStyle);
			});

		outlineColor.hex = templateStyle.outline.color;

		_title(outlineColor, _gtxt('drawingObjects.edit.color'));

		outlineTds.push(_td([outlineColor],[['css','width','40px']]));

		var divSlider = nsGmx.Controls.createSlider(templateStyle.outline.opacity,
				function(event, ui)
				{
					templateStyle.outline.opacity = ui.value;

                    setDrawingFeatureStyle(parentObject, templateStyle);
				})

		_title(divSlider, _gtxt('drawingObjects.edit.transparency'));

		outlineTds.push(_td([divSlider],[['css','width','100px'],['css','padding','4px 5px 3px 5px']]));

		var outlineThick = nsGmx.Controls.createInput((templateStyle.outline && typeof templateStyle.outline.thickness != 'undefined') ? templateStyle.outline.thickness : 2,
				function()
				{
					templateStyle.outline.thickness = Number(this.value);

                    setDrawingFeatureStyle(parentObject, templateStyle);

					return true;
				}),
			closeFunc = function()
			{
				var newIcon = CreateDrawingStylesEditorIcon(templateStyle, parentObject.toGeoJSON().geometry.type.toLowerCase());
				CreateDrawingStylesEditor(parentObject, templateStyle, newIcon);

				$(elemCanvas).replaceWith(newIcon);

				$(canvas).find(".colorSelector").each(function()
				{
					$('#' + $(this).data("colorpickerId")).remove();
				});
			};

		_title(outlineThick, _gtxt('drawingObjects.edit.lineWidth'));

		outlineTds.push(_td([outlineThick],[['css','width','30px']]));

		_(outlineParent, outlineTitleTds.concat(_td([_div([_table([_tbody([_tr(outlineTds)])])],[['attr','fade',true]])])));

		var text = _input(null, [['attr','value', parentObject.options.title || ""],['dir','className','inputStyle'],['css','width','180px']]);
		$(text).on('keyup', function(evt)
		{
            if (evt.keyCode === 13)
            {
                $(jQueryDialog).dialog('destroy');
                return;
            }

            parentObject.setOptions({title: this.value});

			$(parentObject).triggerHandler('onEdit', [parentObject]);

			return true;
		})

		_(canvas, [_table([_tbody([_tr([_td([_t(_gtxt('drawingObjects.edit.description'))], [['css','width','70px']]), _td([text])])])]), _br(), _table([_tbody([outlineParent])])])

		var pos = nsGmx.Utils.getDialogPos(elemCanvas, false, 80);
		jQueryDialog = showDialog(_gtxt('drawingObjects.edit.title'), canvas, 280, 130, pos.left, pos.top, false, closeFunc);
        
        $(jQueryDialog).addClass('drawing-object-leaflet-id-' + parentObject._leaflet_id);
	}

	elemCanvas.getStyle = function()
	{
		return templateStyle;
	}
}

/** Конструктор
 @class Коллекция нарисованных объектов
 @memberOf DrawingObjects
 @param oInitMap Карта, из которой будут добавляться объекты в коллекцию
*/
var DrawingObjectCollection = function(oInitMap) {
	var _objects = []; //{item:, editID: , removeID: }
	var _this = this;
    var _map = oInitMap;

	var onEdit = function(drawingObject) {
		/** Вызывается при изменении объекта в коллекции
		@name DrawingObjects.DrawingObjectCollection.onEdit
		@event
		@param {drawingObject} drawingObject изменённый объект*/
		$(_this).triggerHandler('onEdit', [drawingObject]);
	}

	var onRemove = function(drawingObject) {
		_this.Remove(drawingObject);
	}

	/** Возвращает элемент по номеру
	@param {int} index № объекта в коллекции*/
	this.Item = function(index){
		return _objects[index].item;
	}

	/** Возвращает количество элементов в коллекции*/
	this.Count = function(){
		return _objects.length;
	}

	/** Добавляет объект в коллекцию
	@param {drawingObject} drawingObject Добавляемый объект*/
	this.Add = function(drawingObject){

        var editID = drawingObject.on('edit', function() {
            onEdit(drawingObject);
        });

        var removeID = drawingObject.on('remove', function() {
            onRemove(drawingObject);
        });

		_objects.push({
            item: drawingObject,
            editID: editID,
            removeID: removeID
        });

		/** Вызывается при добавлении объекта в коллекцию
		@name DrawingObjects.DrawingObjectCollection.onAdd
		@event
		@param {drawingObject} drawingObject добавленный объект*/
		$(this).triggerHandler('onAdd', [drawingObject]);
	};

	/** Удаляет объект из коллекции
	@param {int} index индекс удаляемого объекта*/
	this.RemoveAt = function(index){
		var obj = _objects.splice(index, 1)[0];

		/** Вызывается при удалении объекта из коллекции
		@name DrawingObjects.DrawingObjectCollection.onRemove
		@event
		@param {int} index индекс удаляённого объекта*/
		$(this).triggerHandler('onRemove', [index]);
	};

	/** Удаляет объект из коллекции
	@param {drawingObject} drawingObject удаляемый объект*/
	this.Remove = function(drawingObject){
		for (var i=0; i<_objects.length; i++){
			if (_objects[i].item === drawingObject) this.RemoveAt(i);
		}
	}

    /** Получить индекс объекта в коллекции. null, если объект не найден
	@param {drawingObject} drawingObject объект, индекс которого мы хотим найти*/
	this.getIndex = function(drawingObject){
		for (var i=0; i<_objects.length; i++){
			if (_objects[i].item === drawingObject) return i;
		}

        return null;
	}
}

/** Конструктор
 @class Строка с описанием объекта и ссылкой на него
 @description К строке биндится контекстное меню типа "DrawingObject"
 @memberOf DrawingObjects
 @param {L.Map} oInitMap Карта Leaflet
 @param oInitContainer Объект, в котором находится контрол (div)
 @param drawingObject Объект для добавления на карту
 @param options дополнительные параметры
 @param {bool} [options.allowDelete=true] рисовать ли крестик удаления объекта
 @param {bool} [options.editStyle=true] нужна ли возможность редактировать стили
 @param {function(DrawingObject)} [options.click] ф-ция, которая будет вызвана при клике на объекте.
        По умолчанию - центрирование карты на объекте.
*/
var DrawingObjectInfoRow = function(oInitMap, oInitContainer, drawingObject, options) {
    var defaultClickFunction = function(obj) {
        var geom = obj.toGeoJSON().geometry;
        var coords = geom.coordinates;
		if (geom.type == "Point") {
            _map.setView([coords[1], coords[0]], Math.max(14, _map.getZoom()));
        } else {
            _map.fitBounds(drawingObject.getBounds());
        }
    }

    var _options = $.extend({
        allowDelete: true,
        editStyle: true,
        click: defaultClickFunction
    }, options);

	var _drawingObject = drawingObject;
	var _this = this;
	var _map = oInitMap;

	var _canvas = _div(null, [['dir','className','drawingObjectsItemCanvas']]);
	var _title = _span(null, [['dir','className','drawingObjectsItemTitle']]);
	var _text = _span(null, [['dir','className', 'drawingObjectsItemTitle']]);
	var _summary = _span(null, [['dir','className','summary']]);

    if (_options.click) {
        _canvas.onclick = function(e) {
            if (e.target !== remove && (!_options.editStyle || e.target !== icon)) {
                _options.click(_drawingObject);
            }
        };
    }

    var lineOptions = _drawingObject.options.lineStyle || L.GmxDrawing.utils.defaultStyles.lineStyle;

	var icon = null;

    var geom = _drawingObject.toGeoJSON().geometry;
    if (_options.editStyle)
    {
        if (geom.type == "Point")
        {
            icon = _img(null, [['attr','src', (window.gmxJSHost || '') + 'img/flag_min.png'], ['dir', 'className', 'colorIcon']])
        }
        else
        {
            var regularDrawingStyle = {
                outline: {
                    color: parseInt('0x' + lineOptions.color.split('#')[1]),
                    thickness: lineOptions.weight,
                    opacity: lineOptions.opacity * 100
                }
            };

            icon = CreateDrawingStylesEditorIcon(regularDrawingStyle, geom.type.toLowerCase());
            CreateDrawingStylesEditor(_drawingObject, regularDrawingStyle, icon);
        }
    }
    else
        icon = _span(null, [['dir', 'className', geom.type + (L.gmxUtil.isRectangle(geom.coordinates) ? ' RECTANGLE' : '')]]);

	var remove = _span();

    if (_options.allowDelete)
    {
        remove.setAttribute('title', _gtxt('drawingObjects.removeObject'));
        remove.className = 'gmx-icon-close';
        remove.onclick = function(){
            $(_this).triggerHandler('onRemove', [_drawingObject]);
        }
    }

	_(_canvas, [_span([icon, _title, _text, _summary], [['dir','className','drawingObjectsItem']]), remove]);

	_(oInitContainer, [_canvas])

    this._mouseOverHandler = function() {
        $(_canvas).addClass('drawingObjectsActiveItemCanvas');
    };

    this._mouseOutHandler = function() {
        $(_canvas).removeClass('drawingObjectsActiveItemCanvas');
    }

    _drawingObject.on('mouseover', this._mouseOverHandler);
    _drawingObject.on('mouseout', this._mouseOutHandler);

	/** Обновляет информацию о геометрии */
	this.UpdateRow = function(){
        var summary = _drawingObject.getSummary(),
            text = _drawingObject.options.title,
            type = _drawingObject.getType();

		$(_title).empty();
		$(_text).empty();
		$(_summary).empty();

		if (type === 'Point')
		{
			_(_title, [_t(_gtxt('drawingObjects.pointTitle'))]);
			_(_summary, [_t("(" + summary + ")")]);
		}
		else if (type === 'Polyline' || type === 'MultiPolyline')
		{
			_(_title, [_t(_gtxt('drawingObjects.lineTitle'))]);
			_(_summary, [_t("(" + summary + ")")]);
		}
		else if (type === 'Polygon' || type === 'MultiPolygon' || type === 'Rectangle')
		{
			_(_title, [_t(type === 'Rectangle' ? _gtxt('drawingObjects.rectangleTitle') : _gtxt('drawingObjects.polygonTitle'))]);
			_(_summary, [_t("(" + summary + ")")]);
		}

		_(_text, [_t(text ? text.replace(/<[^<>]*>/g, " ") : "")])

		if (text)
			_title.style.display = 'none';
		else
			_title.style.display = '';
	}

	/** Удаляет строчку */
	this.RemoveRow = function(){

		if (_canvas.parentNode)
            _canvas.parentNode.removeChild(_canvas);

        if (_drawingObject === null) return;

        _drawingObject.off('edit', this.UpdateRow);
        _drawingObject.off('remove', this.RemoveRow);
        _drawingObject.off('mouseover', this._mouseOverHandler);
        _drawingObject.off('mouseout', this._mouseOutHandler);

        _drawingObject = null;
	}

    /** Удаляет строчку */
    this.getContainer = function() {return _canvas;};

    if (nsGmx && nsGmx.ContextMenuController) {
        nsGmx.ContextMenuController.bindMenuToElem(_title, 'DrawingObject', function(){return true; }, {obj: _drawingObject} );
    }

    this.getDrawingObject = function(){
        return _drawingObject;
    }

    _drawingObject.on('edit', this.UpdateRow);
    _drawingObject.on('remove', this.RemoveRow);

	this.UpdateRow();
}

/** Конструктор
 @class Контрол для отображения коллекции пользовательских объектов
 @memberOf DrawingObjects
 @param oInitMap Карта
 @param {documentElement} oInitContainer Объект, в котором находится контрол (div)
 @param {DrawingObjects.DrawingObjectCollection} oInitDrawingObjectCollection Коллекция пользовательских объектов
 @param {Object} options Дополнительные параметры.Включает все доп. параметры DrawingObjectInfoRow
 @param {bool} [options.showButtons=true] показывать ли кнопки под списком
 @param {selectedIndex} [options.selectedIndex=null] индекс выбранного элемента
*/
var DrawingObjectList = function(oInitMap, oInitContainer, oInitDrawingObjectCollection, options){
    var _options = $.extend({showButtons: true, selectedIndex: null}, options);
	var _this = this;
	var _rows = [];
	var _containers = [];
	var _map = oInitMap;
	var _collection = oInitDrawingObjectCollection;
	var _container = oInitContainer;
	var _divList = _div(null, [['dir', 'className', 'DrawingObjectList']]);
	var _divButtons = _div();

	/** Добавляет объект в "список объектов на карте"
	@param {drawingObject} drawingObject добавляемый объект */
	var add = function(drawingObject){
		var divRow = _div();
		_(_divList, [divRow]);
		var row = new DrawingObjectInfoRow(_map, divRow, drawingObject, options);
		_containers.push(divRow);
		_rows.push(row);
		$(row).bind('onRemove', function(){ drawingObject.remove(); } );
		if (_collection.Count() == 1 && _options.showButtons) show(_divButtons);

        /** В списке мышь переместилась над объект
		@name DrawingObjects.DrawingObjectList.mouseover
		@event
		@param {drawingObject} drawingObject объект, над которым находится мышь*/

        /** В списке мышь переместилась с объекта
		@name DrawingObjects.DrawingObjectList.mouseout
		@event
		@param {drawingObject} drawingObject объект, с которого переместилась мышь*/

        $(divRow).bind({
            mouseover: function() {
                $(_this).triggerHandler('mouseover', [drawingObject]);
            },
            mouseout: function() {
                $(_this).triggerHandler('mouseout', [drawingObject]);
            }
        });
	}

	var onRemove = function(event, index){
		if (_collection.Count() == 0) hide(_divButtons);
		var removedDiv = _containers.splice(index, 1)[0];
		_rows.splice(index, 1);
		removedDiv.parentNode && removedDiv.parentNode.removeChild(removedDiv);

        if (index === _selectedIndex) {
            _selectedIndex = null;
        } else if (index < _selectedIndex) {
            _selectedIndex--;
        }
	}

	$(_collection).bind('onRemove', onRemove);
	$(_collection).bind('onAdd', function(event, drawingObject){
		add(drawingObject);
	});

	for (var i=0; i<_collection.Count(); i++){ add(_collection.Item(i));}

    /** Очищает список пользовательских объектов*/
	this.Clear = function(){
		while (_collection.Count()>0){
			_collection.Item(0).remove();
		}

        _selectedIndex = null;
	}

	/** Возвращает div, в котором находится кнопка "Очистить" и который не виден при пустой коллекции */
	this.GetDivButtons = function(){
		return _divButtons;
	}

    var delAll = makeLinkButton(_gtxt('drawingObjects.removeAll'));
	delAll.onclick = this.Clear;

	_(_divButtons, [_div([delAll])]);
	_( oInitContainer, [_divList, _divButtons]);

	if (_collection.Count() == 0 || !_options.showButtons) hide(_divButtons);

    var _selectedIndex = null;

    /** Устанавливает выбранный элемент списка пользовательских объектов.
        null - нет активного. Неправильные индексы игнорируются. К контейнеру выбранного элемента добавляется класс drawingObjectsSelectedItemCanvas
    */
    this.setSelection = function(selectedIndex) {
        var isValidIndex = !!_rows[selectedIndex] || selectedIndex === null;
        if (selectedIndex === _selectedIndex || !isValidIndex) {
            return _selectedIndex;
        }

        if (_rows[_selectedIndex]) {
            $(_rows[_selectedIndex].getContainer()).removeClass('drawingObjectsSelectedItemCanvas');
        }

        if (_rows[selectedIndex]) {
            $(_rows[selectedIndex].getContainer()).addClass('drawingObjectsSelectedItemCanvas');
        }

        _selectedIndex = selectedIndex;

        return _selectedIndex;
    };

    /** Возвращает индекс выбранного элемента списка пользовательских объектов, null - если нет выбранного*/
    this.getSelection = function() {
        return _selectedIndex;
    }

    this.setSelection(_options.selectedIndex);
}

/** Конструктор
 @memberOf DrawingObjects
 @class Встраивает список объектов на карте в геомиксер*/
var DrawingObjectGeomixer = function() {
	var _this = this;
	var oMap = null;
    var gmxMap = null;
	var oMenu = new leftMenu();
	var oListDiv = _div(null, [['dir', 'className', 'DrawingObjectsLeftMenu']]);
	var bVisible = false;
    var oCollection = null;

	/** Вызывается при скрывании меню*/
	this.Unload = function(){ bVisible = false; };

	/** Загружает меню*/
	this.Load = function(){
		if (oMenu != null){
			var alreadyLoaded = oMenu.createWorkCanvas("DrawingObjects", this.Unload);
			if(!alreadyLoaded) _(oMenu.workCanvas, [oListDiv]);
		}
		bVisible = true;
	}

	var fnAddToCollection = function(ev) {
        var feature = ev.object;
		if (!nsGmx.DrawingObjectCustomControllers || !nsGmx.DrawingObjectCustomControllers.isHidden(feature)) {
            oCollection.Add(feature);
            var tt = 1;
        }
	}

	var checkDownloadVisibility = function(){
		var isAnyRectangle = false,
            isNonPolygon = false;

		for (var i=0; i< oCollection.Count(); i++){
            var feature = oCollection.Item(i);
            var geom = feature.toGeoJSON().geometry;
            isAnyRectangle = isAnyRectangle || L.gmxUtil.isRectangle(geom.coordinates);
            isNonPolygon = isNonPolygon || geom.type !== 'Polygon';
		}

        $(downloadContainer).toggle(oCollection.Count() > 0);
        $(downloadRaster).toggle(gmxMap.properties.CanDownloadRasters && isAnyRectangle);
        $(downloadGpx).toggle(isNonPolygon);
	}

    var downloadFormat = null;

	var downloadShp = makeLinkButton(_gtxt('drawingObjects.downloadShp'));
	downloadShp.onclick = function(){
        downloadFormat = 'Shape';
        downloadNameContainer.toggle();
	}
    downloadShp.style.margin = '0px 3px';

	var downloadGeoJSON = makeLinkButton(_gtxt('drawingObjects.downloadGeoJSON'));
	downloadGeoJSON.onclick = function(){
        downloadFormat = 'GeoJSON';
        downloadNameContainer.toggle();
	}
    downloadGeoJSON.style.margin = '0px 3px';

    var downloadGpx = makeLinkButton(_gtxt('drawingObjects.downloadGpx'));
	downloadGpx.onclick = function(){
        downloadFormat = 'gpx';
        downloadNameContainer.toggle();
	}
    downloadGpx.style.margin = '0px 3px';

    var downloadCsv = makeLinkButton(_gtxt('drawingObjects.downloadCsv'));
	downloadCsv.onclick = function(){
        downloadFormat = 'csv_wkt';
        downloadNameContainer.toggle();
	}
    downloadCsv.style.margin = '0px 3px';

    var downloadNameInput = $('<input/>', {title: _gtxt('drawingObjects.downloadNameTitle')}).val('markers').addClass('inputStyle');

    downloadNameInput.keyup(function(e) {
        if (e.keyCode == 13) {
            downloadNameButton.click();
        }
    })

    var downloadNameButton = $('<input/>', {type: 'button'}).val(_gtxt('drawingObjects.download')).addClass('btn').click(function() {
        downloadMarkers(downloadNameInput.val(), downloadFormat);
        downloadNameContainer.hide();
        downloadFormat = null;
    });
    var downloadNameContainer = $('<div/>').append(downloadNameInput, downloadNameButton).hide();

    var downloadRasterOptions = $(
        '<div class="drawingObjectsDownloadRaster">' +
            '<label><input type="radio" name="rasterFormat" checked value="univers">jpeg + georefernce</label>' +
            '<label><input type="radio" name="rasterFormat" value="garmin">kmz (Garmin Custom Maps)</label>' +
            '<button id="downloadRaster" class="btn">' + _gtxt('drawingObjects.download') + '</button>' +
        '</div>'
    ).hide();

    $('#downloadRaster', downloadRasterOptions).click(function() {
        var checkInfo = checkRasterLayer();
        if (checkInfo) {
            var bounds = checkInfo.bounds,
                layer = checkInfo.layer,
                format = $('input:checked', downloadRasterOptions).val(),
                temporalParam = "",
                props = layer.getGmxProperties();

            if (props.Temporal) {
                var dateInterval = layer.getDateInterval();
                if (dateInterval) {
                    var dateBeginStr = nsGmx.Utils.convertFromServer('date', dateInterval.beginDate/1000),
                        dateEndStr = nsGmx.Utils.convertFromServer('date', dateInterval.endDate/1000);

                    temporalParam = "&StartDate=" + encodeURIComponent(dateBeginStr) + "&EndDate=" + encodeURIComponent(dateEndStr);
                }
            }

            var truncate9 = function(x) { return ("" + x).substring(0, 9); };

            window.location.href =
                "http://" + props.hostName + "/DownloadLayer.ashx" +
                "?t=" + props.name +
                "&MinX=" + truncate9(bounds.getWest()) +
                "&MinY=" + truncate9(bounds.getSouth()) +
                "&MaxX=" + truncate9(bounds.getEast()) +
                "&MaxY=" + truncate9(bounds.getNorth()) +
                "&Format=" + format +
                temporalParam;
        }
    })

	var downloadRaster = makeLinkButton(_gtxt('drawingObjects.downloadRaster'));
	downloadRaster.onclick = function(){
        if (downloadRasterOptions.find(':visible').length || checkRasterLayer()) {
            downloadRasterOptions.toggle();
        }
	}

    var downloadContainer = _div();

	/** Встраивает список объектов на карте в геомиксер*/
	this.Init = function(leafletMap, initGmxMap){
		oMap = leafletMap;
        gmxMap = initGmxMap;
		oCollection = new DrawingObjectCollection(leafletMap);
        $(oCollection).bind('onAdd', function (){
            if(!bVisible) _this.Load();
        });

        $(oCollection).bind('onRemove', function (){
            oCollection.Count() || oMenu.leftPanelItem.close();
        });

        var lmap = nsGmx.leafletMap,
            gmxDrawing = lmap.gmxDrawing,
            features = gmxDrawing.getFeatures();

        features.map(function(ret){
			fnAddToCollection(ret);
		});

        lmap.gmxDrawing.on('add', fnAddToCollection);

        $(oCollection).bind('onRemove onAdd', checkDownloadVisibility);

        var oDrawingObjectList = new DrawingObjectList(oMap, oListDiv, oCollection);
        _(downloadContainer, [
            _div([_span([_t(_gtxt('drawingObjects.download'))], [['css', 'fontSize', '12px']]), downloadShp, downloadGeoJSON, downloadGpx, downloadCsv]),
            downloadNameContainer[0],
            _div([downloadRaster]),
            downloadRasterOptions[0]
        ]);
		_(oDrawingObjectList.GetDivButtons(), [downloadContainer]);

		checkDownloadVisibility();
	}

	/** Скачивает shp файл*/
	var downloadMarkers = function(fileName, format) {
        var geoms = [];

		for (var i = 0; i < oCollection.Count(); i++) {
            geoms.push(oCollection.Item(i).toGeoJSON());
        }

        nsGmx.Utils.downloadGeometry(geoms, {
            fileName: fileName,
            format: format
        });
	}

	/** Скачивает растровые слои*/
	var checkRasterLayer = function(){
		var obj = false,
			_this = this;

		for (var i = 0; i < oCollection.Count(); i++){
			var elem = oCollection.Item(i);

			if (elem.getType() == 'Rectangle') {
				obj = elem;
            }
		}

		if (!obj)
		{
			showErrorMessage(_gtxt('drawingObjects.noRectangleError'), true);
			return;
		}

		var bounds = obj.getBounds(),
            center = bounds.getCenter(),
			layer = false;

		var testPolygon = function(polygon, latlng){
			var testRing = function(ring, x, y)
			{
				var isInside = false;
				for (var j = 0; j < ring.length - 1; j++)
				{
					var x1 = ring[j][0],
						y1 = ring[j][1],
						x2 = ring[j + 1][0],
						y2 = ring[j + 1][1];

					if (((y1 >= y) != (y2 >= y)) && ((x1 + (x2 - x1)*(y - y1)/(y2 - y1)) > x))
						isInside = !isInside;
				}

				return isInside;
			}

			for (var j = 0; j < polygon.length; j++)
				if (testRing(polygon[j], latlng.lng, latlng.lat) != (j == 0))
					return false;

			return true;
		}

        for (var iLayerN = 0; iLayerN < gmxMap.layers.length; iLayerN++) {
            var l = gmxMap.layers[iLayerN],
                props = l.getGmxProperties(),
                layerBounds = l.getBounds && l.getBounds(),
                isProperType = props.type == "Raster" || props.IsRasterCatalog;

            if (isProperType && oMap.hasLayer(l) && layerBounds && layerBounds.isValid() && layerBounds.contains(center)) {
                var geom = l.getGeometry(),
                    coords = geom.coordinates,
                    bIsPolygonBad = false;

                if (geom.type === "Polygon" && !testPolygon(coords, center)) {
                    bIsPolygonBad = true;
                } else if (geom.type == "MultiPolygon") {
                    bIsPolygonBad = true;
                    for (var k = 0; k < coords.length; k++)
                        if (testPolygon(coords[k], center)){
                            bIsPolygonBad = false;
                            break;
                        }
                }

                if (!bIsPolygonBad && l && (!layer || (props.MaxZoom > layer.getGmxProperties().MaxZoom))) {
                    layer = l;
                }
            }
        };

        if (!layer) {
            showErrorMessage(_gtxt('drawingObjects.noRasterError'), true);
            return;
        }

        return {bounds: bounds, layer: layer};
	}
}

var publicInterface = {
	DrawingObjectCollection: DrawingObjectCollection,
	DrawingObjectInfoRow: DrawingObjectInfoRow,
	DrawingObjectList: DrawingObjectList,
	DrawingObjectGeomixer: DrawingObjectGeomixer
}

gmxCore.addModule("DrawingObjects", publicInterface);

})(jQuery, nsGmx.Utils._);
