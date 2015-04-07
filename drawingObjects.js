/**
* @namespace DrawingObjects
* @description SDK для редактирования объектов на карте
*/
!(function($){

nsGmx.Translations.addText('rus', {
    drawingObjects: {
        editStyleTitle: 'Редактировать стиль',
        removeObject: 'Удалить',
        pointTitle: 'точка',
        lineTitle: 'линия',
        polygonTitle: 'многоугольник',
        rectangleTitle: 'прямоугольник',
        removeAll: 'Очистить',
        downloadShp: 'shp-файл',
        downloadGpx: 'gpx-файл',
        downloadNameTitle: 'Введите имя файла для скачивания',
        download: 'Скачать',
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
        downloadShp: 'shp-file',
        downloadGpx: 'gpx-file',
        downloadNameTitle: 'Enter file name to download',
        download: 'Download',
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
})

var CreateDrawingStylesEditorIcon = function(style, type)
{
	var icon = nsGmx.Controls.createGeometryIcon(style, type);
	
	_title(icon, _gtxt('drawingObjects.editStyleTitle'));
	
	return icon;
}

var CreateDrawingStylesEditor = function(parentObject, style, elemCanvas)
{
	var templateStyle = {};
	
	$.extend(true, templateStyle, style);
	
	elemCanvas.onclick = function()
	{
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
				
				nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
			});
		
		outlineColor.hex = templateStyle.outline.color;
		
		_title(outlineColor, _gtxt('drawingObjects.edit.color'));

		outlineTds.push(_td([outlineColor],[['css','width','40px']]));
			
		var divSlider = nsGmx.Controls.createSlider(templateStyle.outline.opacity,
				function(event, ui)
				{
					templateStyle.outline.opacity = ui.value;
					
					nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
				})
		
		_title(divSlider, _gtxt('drawingObjects.edit.transparency'));

		outlineTds.push(_td([divSlider],[['css','width','100px'],['css','padding','4px 5px 3px 5px']]));
		
		var outlineThick = nsGmx.Controls.createInput((templateStyle.outline && typeof templateStyle.outline.thickness != 'undefined') ? templateStyle.outline.thickness : 2,
				function()
				{
					templateStyle.outline.thickness = Number(this.value);
					
					nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
					
					return true;
				}),
			closeFunc = function()
			{
				var newIcon = CreateDrawingStylesEditorIcon(templateStyle, parentObject.geometry.type.toLowerCase());
				CreateDrawingStylesEditor(parentObject, templateStyle, newIcon);
				
				$(elemCanvas).replaceWith(newIcon);
				
				$(canvas).find(".colorSelector").each(function()
				{
					$$($(this).data("colorpickerId")).removeNode(true);
				});
			};
		
		_title(outlineThick, _gtxt('drawingObjects.edit.lineWidth'));
		
		outlineTds.push(_td([outlineThick],[['css','width','30px']]));
		
		_(outlineParent, outlineTitleTds.concat(_td([_div([_table([_tbody([_tr(outlineTds)])])],[['attr','fade',true]])])));
		
		var text = _input(null, [['attr','value', parentObject.properties.text ? parentObject.properties.text : ""],['dir','className','inputStyle'],['css','width','180px']]);
		text.onkeyup = function(evt)
		{
            if (getkey(evt) == 13) 
            {
                $(jQueryDialog).dialog('destroy');
                return;
            }
            
            parentObject.setText(this.value);
			
			$(parentObject).triggerHandler('onEdit', [parentObject]);
			
			return true;
		}
		
		_(canvas, [_table([_tbody([_tr([_td([_t(_gtxt('drawingObjects.edit.description'))], [['css','width','70px']]), _td([text])])])]), _br(), _table([_tbody([outlineParent])])])
		
		var pos = nsGmx.Utils.getDialogPos(elemCanvas, false, 80);
		var jQueryDialog = showDialog(_gtxt('drawingObjects.edit.title'), canvas, 280, 110, pos.left, pos.top, false, closeFunc)
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
        
        //obj.item.removeListener('onEdit', obj.editID);
        //obj.item.removeListener('onRemove', obj.removeID);
		
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
 @param oInitMap Карта
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
            _map.moveTo(coords[0], coords[1], Math.max(14, _map.getZ()));
        } else {
            var bounds = getBounds(coords);
            _map.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
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
        var _clickFunc = function(e) {
            if (e.target !== remove && (!_options.editStyle || e.target !== icon)) {
                _options.click(_drawingObject);
            }
        }
        
        _canvas.onclick = _clickFunc;
    }

	var regularDrawingStyle = {
			outline: { color: 0x0000ff, thickness: 3, opacity: 80 }
		},
		icon = null;

    var geom = _drawingObject.toGeoJSON().geometry;
    if (_options.editStyle)
    {
        if (geom.type == "Point")
        {
            icon = _img(null, [['attr','src', gmxAPI.getAPIHostRoot() + 'api/img/flag_min.png'], ['dir', 'className', 'colorIcon']])
        }
        else
        {
            icon = CreateDrawingStylesEditorIcon(regularDrawingStyle, geom.type.toLowerCase());
            CreateDrawingStylesEditor(_drawingObject, regularDrawingStyle, icon);
        }
    }
    else
        icon = _span(null, [['dir', 'className', geom.type + (gmxAPI.isRectangle(geom.coordinates) ? ' RECTANGLE' : '')]]);
	
	var remove = _span();
    
    if (_options.allowDelete)
    {
        //remove = makeImageButton(gmxAPI.getAPIHostRoot() + 'api/img/closemin.png',gmxAPI.getAPIHostRoot() + 'api/img/close_orange.png')
        remove.setAttribute('title', _gtxt('drawingObjects.removeObject'));
        remove.className = 'removeGeometry';
        remove.onclick = function(){
            $(_this).triggerHandler('onRemove', [_drawingObject]);
        }
    }

	_(_canvas, [_span([icon, _title, _text, _summary], [['dir','className','drawingObjectsItem']]), remove]);
	
	_(oInitContainer, [_canvas])
    
    var mouseOverListenerId = _drawingObject.on('mouseover', function()
    {
        $(_canvas).addClass('drawingObjectsActiveItemCanvas');
    })
    
    var mouseOutListenerId = _drawingObject.on('mouseout', function()
    {
        $(_canvas).removeClass('drawingObjectsActiveItemCanvas');
    })    
	
	/** Обновляет информацию о геометрии */
	this.UpdateRow = function(){
        var geom = _drawingObject.toGeoJSON().geometry;
		var type = geom.type,
			coords = geom.coordinates,
			text = _drawingObject.options.text;
			
		removeChilds(_title);
		removeChilds(_text);
		removeChilds(_summary);
		
        var summary = L.gmxUtil.getGeoJSONSummary(geom, false);
		if (type == "Point")
		{
			_(_title, [_t(_gtxt('drawingObjects.pointTitle'))]);
			_(_summary, [_t("(" + summary + ")")]);
			//_(_summary, [_t("(" + formatCoordinates(merc_x(coords[0]), merc_y(coords[1])) + ")")]);
		}
		else if (type == "LineString")
		{
			_(_title, [_t(_gtxt('drawingObjects.lineTitle'))]);
			_(_summary, [_t("(" + summary + ")")]);
		}
		else if (type == "Polygon")
		{
			_(_title, [_t(gmxAPI.isRectangle(coords) ? _gtxt('drawingObjects.rectangleTitle') : _gtxt('drawingObjects.polygonTitle'))]);
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
            
        _drawingObject.off('edit', editListenerID);
        _drawingObject.off('remove', removeListenerID);
        _drawingObject.off('mouseover', mouseOverListenerId);
        _drawingObject.off('mouseout', mouseOutListenerId);
        
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
    
    var editListenerID = _drawingObject.on('edit', this.UpdateRow);
    var removeListenerID = _drawingObject.on('remove', this.RemoveRow);
    
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
            isAnyRectangle = isAnyRectangle || gmxAPI.isRectangle(geom.coordinates);
            isNonPolygon = isNonPolygon || geom.type !== 'Polygon';
		}
        
        $(downloadContainer).toggle(oCollection.Count() > 0);
        $(downloadRaster).toggle(oMap.properties.CanDownloadRasters && isAnyRectangle);
        $(downloadGpx).toggle(isNonPolygon);
	}
    
    var downloadFormat = null;
	
	var downloadShp = makeLinkButton(_gtxt('drawingObjects.downloadShp'));
	downloadShp.onclick = function(){ 
        downloadFormat = 'Shape';
        downloadNameContainer.toggle();
	}
    downloadShp.style.margin = '0px 3px';
    
    var downloadGpx = makeLinkButton(_gtxt('drawingObjects.downloadGpx'));
	downloadGpx.onclick = function(){ 
        downloadFormat = 'gpx';
        downloadNameContainer.toggle();
	}
    downloadGpx.style.margin = '0px 3px';
    
    var downloadNameInput = $('<input/>', {title: _gtxt('drawingObjects.downloadNameTitle')}).val('markers').addClass('inputStyle');
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
                x1 = bounds.minX,
                y1 = bounds.minY,
                x2 = bounds.maxX,
                y2 = bounds.maxY,
                format = $('input:checked', downloadRasterOptions).val(),
                temporalParam = "";
                
            if (layer.properties.Temporal) {
                var dateInterval = layer.getDateInterval();
                if (dateInterval) {
                    temporalParam = "&StartDate=" + parseInt(dateInterval.beginDate/1000, 10) + "&EndDate=" + parseInt(dateInterval.endDate/1000, 10);
                }
            }
                
            window.location.href = 
                "http://" + layer.properties.hostName + "/DownloadLayer.ashx" + 
                "?t=" + layer.properties.name + 
                "&MinX=" + truncate9(Math.min(x1, x2)) + 
                "&MinY=" + truncate9(Math.min(y1, y2)) +
                "&MaxX=" + truncate9(Math.max(x1, x2)) + 
                "&MaxY=" + truncate9(Math.max(y1, y2)) + 
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
	this.Init = function(map){
		oMap = map;
		oCollection = new DrawingObjectCollection(map);
        $(oCollection).bind('onAdd', function (){
            if(!bVisible) _this.Load();
        });
		
		oMap.drawing.forEachObject(function(ret){
			fnAddToCollection(ret);
		});
		
        var LMap = gmxAPI._leaflet.LMap;
        LMap.gmxDrawing.on('add', fnAddToCollection);
        
        $(oCollection).bind('onRemove onAdd', checkDownloadVisibility);
        
        var oDrawingObjectList = new DrawingObjectList(oMap, oListDiv, oCollection);
        _(downloadContainer, [
            _div([_span([_t(_gtxt('drawingObjects.download'))], [['css', 'fontSize', '12px']]), downloadShp, downloadGpx]), 
            downloadNameContainer[0], 
            _div([downloadRaster]),
            downloadRasterOptions[0]
        ]);
		_(oDrawingObjectList.GetDivButtons(), [downloadContainer]);
        
		checkDownloadVisibility();
	}
	
	/** Скачивает shp файл*/
	var downloadMarkers = function(fileName, format){
		var objectsByType = {},
			markerIdx = 1;
            
        fileName = fileName || 'markers';
        format = format || 'Shape';
		
		for (var i=0; i<oCollection.Count(); i++){
			var ret = oCollection.Item(i);
            var geom = ret.toGeoJSON().geometry;
			var type = geom.type;

			if (!objectsByType[type])
				objectsByType[type] = [];
			if (type == "Point" && ((ret.options.text == "") || !ret.options.text))
			{
				ret.options.text = "marker " + markerIdx;
				markerIdx++;
			}
			
			objectsByType[type].push({ geometry: {
                    type: type.toUpperCase(),
                    coordinates: geom.coordinates
                },
                properties: ret.options
            });
		}
		        
        sendCrossDomainPostRequest(serverBase + "Shapefile.ashx", {
            name:     fileName,
            format:   format,
            points:   objectsByType["Point"] ? JSON.stringify(objectsByType["Point"]) : '',
            lines:    objectsByType["LineString"] ? JSON.stringify(objectsByType["LineString"]) : '',
            polygons: objectsByType["Polygon"] ? JSON.stringify(objectsByType["Polygon"]) : ''
        })
	}
	
	/** Скачивает растровые слои*/
	var checkRasterLayer = function(){
		var obj = false,
			_this = this,
			baseMapName = window.baseMap.id;
		
		for (var i=0; i<oCollection.Count(); i++){
			var elem = oCollection.Item(i);
			
			if ( (elem.geometry.type == "POLYGON") && gmxAPI.isRectangle(elem.geometry.coordinates) )
				obj = elem;
		}
		
		if (!obj)
		{
			showErrorMessage(_gtxt('drawingObjects.noRectangleError'), true);
			
			return;
		}
		
		var bounds = getBounds(obj.geometry.coordinates),
			x1 = bounds.minX,
			y1 = bounds.minY,
			x2 = bounds.maxX,
			y2 = bounds.maxY,
			x = (x1 + x2) / 2,
			y = (y1 + y2) / 2,
			layer = false;
		
		var testPolygon = function(polygon, x, y){
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
				if (testRing(polygon[j], x, y) != (j == 0))
					return false;

			return true;
		}

		for (var iLayerN=0; iLayerN<oMap.layers.length; iLayerN++){
			var l = oMap.layers[iLayerN],
                layerBounds = l.getLayerBounds(),
                isProperType = l.properties.type == "Raster" || l.properties.IsRasterCatalog;
                
			if (isProperType && l.isVisible && l.properties.mapName != baseMapName && 
                 x >= layerBounds.minX && x <= layerBounds.maxX && y >= layerBounds.minY && y <= layerBounds.maxY ){
				var coords = l.geometry.coordinates;
				var bIsPolygonBad = false;
				if (l.geometry.type == "POLYGON" && !testPolygon(coords, x, y))
					bIsPolygonBad = true;
				else if (l.geometry.type == "MULTIPOLYGON")
                {
                    bIsPolygonBad = true;
					for (var k = 0; k < coords.length; k++)
						if (testPolygon(coords[k], x, y)){
							bIsPolygonBad = false;
							break;
						}
                }
				if (!bIsPolygonBad && l && (!layer || (l.properties.MaxZoom > layer.properties.MaxZoom)))
					layer = l;
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

})(jQuery);