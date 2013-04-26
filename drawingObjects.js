/**
* @namespace DrawingObjects
* @description SDK для редактирования объектов на карте
*/
(function($){

//Расширение механизма событий API на отдельные drawing объекты с использованием jQuery. Lazy initialization.
var IsAttached = false;
var AttachEvents = function(map){
	if (IsAttached) return;
	map.drawing.setHandlers({
		onEdit: function(elem){
			$(elem).triggerHandler('onEdit', [elem]);
		},
		onRemove: function(elem){
			$(elem).triggerHandler('onRemove', [elem]);
		}
	});
	IsAttached = true;
}

var CreateDrawingStylesEditorIcon = function(style, type)
{
	var icon = nsGmx.Controls.createGeometryIcon(style, type);
	
	_title(icon, _gtxt("Редактировать стиль"));
	
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
		
		outlineTitleTds.push(_td([_t(_gtxt("Граница"))],[['css','width','70px']]));
		
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
		
		_title(outlineColor, _gtxt("Цвет"));

		outlineTds.push(_td([outlineColor],[['css','width','40px']]));
			
		var divSlider = nsGmx.Controls.createSlider(templateStyle.outline.opacity,
				function(event, ui)
				{
					templateStyle.outline.opacity = ui.value;
					
					nsGmx.Utils.setMapObjectStyle(parentObject, templateStyle);
				})
		
		_title(divSlider, _gtxt("Прозрачность"));

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
		
		_title(outlineThick, _gtxt("Толщина линии"));
		
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
		
		_(canvas, [_table([_tbody([_tr([_td([_t(_gtxt("Описание"))], [['css','width','70px']]), _td([text])])])]), _br(), _table([_tbody([outlineParent])])])
		
		var pos = nsGmx.Utils.getDialogPos(elemCanvas, false, 80);
		var jQueryDialog = showDialog(_gtxt('Редактирование стилей объекта'), canvas, 280, 110, pos.left, pos.top, false, closeFunc)
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
	var _objects = [];
	var _this = this;
    var _map = oInitMap;
	
	var onEdit = function(event, drawingObject) {
		/** Вызывается при изменении объекта в коллекции
		@name DrawingObjects.DrawingObjectCollection.onEdit
		@event
		@param {drawingObject} drawingObject изменённый объект*/
		$(_this).triggerHandler('onEdit', [drawingObject]);
	}
	
	var onRemove = function(event, drawingObject) {
		_this.Remove(drawingObject);
	}
	
	/** Возвращает элемент по номеру
	@param {int} index № объекта в коллекции*/
	this.Item = function(index){
		return _objects[index];
	}
	
	/** Возвращает количество элементов в коллекции*/
	this.Count = function(){
		return _objects.length;
	}
	
	/** Добавляет объект в коллекцию
	@param {drawingObject} drawingObject Добавляемый объект*/
	this.Add = function(drawingObject){
		_objects.push(drawingObject);
        
        AttachEvents(_map);
		$(drawingObject).bind('onEdit', onEdit);
		$(drawingObject).bind('onRemove', onRemove);
		
		/** Вызывается при добавлении объекта в коллекцию
		@name DrawingObjects.DrawingObjectCollection.onAdd
		@event
		@param {drawingObject} drawingObject добавленный объект*/
		$(this).triggerHandler('onAdd', [drawingObject]);
	};
	
	/** Удаляет объект из коллекции
	@param {int} index индекс удаляемого объекта*/
	this.RemoveAt = function(index){
		var drawingObject = _objects.splice(index, 1)[0];
		$(drawingObject).unbind('onEdit', onEdit);
		$(drawingObject).unbind('onRemove', onRemove);
		
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
			if (_objects[i] === drawingObject) this.RemoveAt(i);
		}
	}
}

/** Конструктор
 @class Строка с описанием объекта и ссылкой на него
 @description К строке биндится контекстное меню типа "DrawingObject"
 @memberOf DrawingObjects
 @param oInitMap Карта
 @param oInitContainer Объект, в котором находится контрол (div) 
 @param drawingObject Объект для добавления на карту
 @param options параметры отображения<br>
     allowDelete - рисовать ли крестик удаления объекта<br>
     editStyle - нужна ли возможность редактировать стили
*/
var DrawingObjectInfoRow = function(oInitMap, oInitContainer, drawingObject, options) {
    var defaultClickFunction = function(obj) {
        var coords = obj.geometry.coordinates;
		if (obj.geometry.type == "POINT") {
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
    
	_text.onclick = _title.onclick = function() {
        _options.click(_drawingObject);
    }
	
	var regularDrawingStyle = {
			marker: {size: 3},
			outline: { color: 0x0000ff, thickness: 3, opacity: 80 },
			fill: {color: 0xffffff}
		},
		icon = null;
	
    if (_options.editStyle)
    {
        if (_drawingObject.geometry.type == "POINT")
        {
            icon = _img(null, [['attr','src', gmxAPI.getAPIHostRoot() + 'api/img/flag_min.png'], ['dir', 'className', 'colorIcon']])
        }
        else
        {
            icon = CreateDrawingStylesEditorIcon(regularDrawingStyle, _drawingObject.geometry.type.toLowerCase());
            CreateDrawingStylesEditor(_drawingObject, regularDrawingStyle, icon);
        }
    }
    else
        icon = _span();
	
	var remove = null;
    
    if (_options.allowDelete)
    {
        remove = makeImageButton(gmxAPI.getAPIHostRoot() + 'api/img/closemin.png',gmxAPI.getAPIHostRoot() + 'api/img/close_orange.png')
        remove.setAttribute('title', _gtxt('Удалить'));
        remove.className = 'removeGeometry';
        remove.onclick = function(){
            $(_this).triggerHandler('onRemove', [_drawingObject]);
        }
    }
    else
        remove = _span();
				
	_(_canvas, [_span([icon, _title, _text, _summary], [['dir','className','drawingObjectsItem']]), remove]);
	
	_(oInitContainer, [_canvas])
    
    var mouseOverListenerId = _drawingObject.addListener('onMouseOver', function()
    {
        $(_canvas).addClass('drawingObjectsActiveItemCanvas');
    })
    
    var mouseOutListenerId = _drawingObject.addListener('onMouseOut', function()
    {
        $(_canvas).removeClass('drawingObjectsActiveItemCanvas');
    })    
	
	/** Обновляет информацию о геометрии */
	this.UpdateRow = function(){
		var type = _drawingObject.geometry.type,
			coords = _drawingObject.geometry.coordinates,
			text = _drawingObject.properties.text;
			
		removeChilds(_title);
		removeChilds(_text);
		removeChilds(_summary);
		
		if (type == "POINT")
		{
			_(_title, [_t(_gtxt("точка"))]);
			_(_summary, [_t("(" + formatCoordinates(merc_x(coords[0]), merc_y(coords[1])) + ")")]);
		}
		else if (type == "LINESTRING")
		{
			_(_title, [_t(_gtxt("линия"))]);
			_(_summary, [_t("(" + prettifyDistance(geoLength(coords)) + ")")]);
		}
		else if (type == "POLYGON")
		{
			_(_title, [_t(isRectangle(coords) ? _gtxt("прямоугольник") : _gtxt("многоугольник"))]);
			_(_summary, [_t("(" + prettifyArea(geoArea(coords)) + ")")]);
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
            
        $(_drawingObject).unbind('.drawing');
        
        _drawingObject.removeListener('onMouseOver', mouseOverListenerId);
        _drawingObject.removeListener('onMouseOut', mouseOutListenerId);
        
        _drawingObject = null;
	}
    
    nsGmx.ContextMenuController.bindMenuToElem(_title, 'DrawingObject', function(){return true; }, {obj: _drawingObject} );
    
    this.getDrawingObject = function(){
        return _drawingObject;
    }
    
    AttachEvents(_map);
    $(_drawingObject).bind('onRemove.drawing', this.RemoveRow);
	$(_drawingObject).bind('onEdit.drawing',   this.UpdateRow);
    
	this.UpdateRow();
}

/** Конструктор
 @class Контрол для отображения коллекции пользовательских объектов
 @memberOf DrawingObjects 
 @param oInitMap Карта
 @param {documentElement} oInitContainer Объект, в котором находится контрол (div) 
 @param {DrawingObjectCollection} oInitDrawingObjectCollection Коллекция пользовательских объектов
 @param {object} options Дополнительные параметры
       * все доп. параметры DrawingObjectInfoRow
       * showButtons {bool} показывать ли кнопки под списком
*/
var DrawingObjectList = function(oInitMap, oInitContainer, oInitDrawingObjectCollection, options){
    var _options = $.extend({showButtons: true}, options);
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
		var _divRow = _div();
		_(_divList, [_divRow]);
		var _row = new DrawingObjectInfoRow(_map, _divRow, drawingObject, options);
		_containers.push(_divRow);
		_rows.push(_row);
		$(_row).bind('onRemove', function(){ drawingObject.remove(); } );
		if (_collection.Count() == 1 && _options.showButtons) show(_divButtons);
	}
	
	/** При удалении объекта из списка
	@param {object} event событие
	@param {drawingObject} drawingObject удалённый объект*/
	var onRemove = function(event, index){
		if (_collection.Count() == 0) hide(_divButtons);
		var removedDiv = _containers.splice(index, 1)[0];
		_rows.splice(index, 1);
		removedDiv.parentNode.removeChild(removedDiv);
	}
    
	/** Очищает список пользовательских объектов*/
	this.Clear = function(){
		while (_collection.Count()>0){
			_collection.Item(0).remove();
		}
	}
	
	/** Возвращает div, в котором находится кнопка "Очистить" и который не виден при пустой коллекции */
	this.GetDivButtons = function(){
		return _divButtons;
	}
	
	$(_collection).bind('onRemove', onRemove);
	$(_collection).bind('onAdd', function(event, drawingObject){ 
		add(drawingObject);
	});
	
	var delAll = makeLinkButton(_gtxt("Очистить"));
	delAll.onclick = this.Clear;
	
	_(_divButtons, [_div([delAll])]);
	_( oInitContainer, [_divList, _divButtons]);

	if (_collection.Count() == 0 || !_options.showButtons) hide(_divButtons);
	
	for (var i=0; i<_collection.Count(); i++){ add(_collection.Item(i));}
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
	
	var fnAddToCollection = function(drawingObject){
		if (!nsGmx.DrawingObjectCustomControllers.isHidden(drawingObject)) oCollection.Add(drawingObject);
	}
	
	var checkDownloadRaster = function(){
		if (!oMap.properties.CanDownloadRasters) return;
		var found = false;
		for (var i=0; i< oCollection.Count(); i++){
			if (isRectangle(oCollection.Item(i).geometry.coordinates)) {
				show(downloadRaster);
				found = true;
				break;
			}
		}
		if(!found) hide(downloadRaster);
	}
	
	var downloadVector = makeLinkButton(_gtxt("Скачать shp-файл"));
	downloadVector.onclick = function(){ 
		//downloadMarkers();
        downloadNameContainer.toggle();
	}
    
    var downloadNameInput = $('<input/>', {title: _gtxt("Введите имя файла для скачивания")}).val('markers').addClass('inputStyle');
    var downloadNameButton = $('<input/>', {type: 'button'}).val(_gtxt('Скачать')).click(function() {
        downloadMarkers(downloadNameInput.val());
        downloadNameContainer.hide();
    });
    var downloadNameContainer = $('<div/>').append(downloadNameInput, downloadNameButton).hide();
	
	var downloadRaster = makeLinkButton(_gtxt("Скачать фрагмент растра"));
	downloadRaster.onclick = function(){
		downloadRasters();
	}
		
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
		
		oMap.drawing.setHandlers({onAdd: fnAddToCollection});
		
        
        $(oCollection).bind('onRemove', checkDownloadRaster);
        $(oCollection).bind('onAdd', function(event, drawingObject){ 
            if (oMap.properties.CanDownloadRasters && isRectangle(drawingObject.geometry.coordinates)) show(downloadRaster);
        });
        
        var oDrawingObjectList = new DrawingObjectList(oMap, oListDiv, oCollection);
		_(oDrawingObjectList.GetDivButtons(), [_div([downloadVector]), downloadNameContainer[0], _div([downloadRaster])]);
		checkDownloadRaster();
	}
	
	/** Скачивает shp файл*/
	var downloadMarkers = function(fileName){
		var objectsByType = {},
			markerIdx = 1;
            
        fileName = fileName || 'markers';
		
		for (var i=0; i<oCollection.Count(); i++){
			var ret = oCollection.Item(i);
			var type = ret.geometry.type;
			
			if (!objectsByType[type])
				objectsByType[type] = [];
			if (ret.geometry.type == "POINT" && ((ret.properties.text == "") || !ret.properties.text))
			{
				ret.properties.text = "marker " + markerIdx;
				markerIdx++;
			}
			
			objectsByType[type].push({ geometry: ret.geometry, properties: ret.properties });
		}
		        
        sendCrossDomainPostRequest(serverBase + "Shapefile.ashx", {
            name:     fileName,
            points:   objectsByType["POINT"] ? JSON.stringify(objectsByType["POINT"]) : '',
            lines:    objectsByType["LINESTRING"] ? JSON.stringify(objectsByType["LINESTRING"]) : '',
            polygons: objectsByType["POLYGON"] ? JSON.stringify(objectsByType["POLYGON"]) : ''
        })
	}
	
	/** Скачивает растровые слои*/
	var downloadRasters = function(){
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
			showErrorMessage(_gtxt("Выберите область рамкой на карте"), true);
			
			return;
		}
		
		var bounds = getBounds(obj.geometry.coordinates),
			x1 = bounds.minX,
			y1 = bounds.minY,
			x2 = bounds.maxX,
			y2 = bounds.maxY,
			x = (x1 + x2) / 2,
			y = (y1 + y2) / 2,
			layer = false,
			tryToFinish = function()
			{
                if (layer)
                {
                    window.location.href = 
                            "http://" + layer.properties.hostName + "/DownloadLayer.ashx" + 
                            "?t=" + layer.properties.name + 
                            "&MinX=" + truncate9(Math.min(x1, x2)) + 
                            "&MinY=" + truncate9(Math.min(y1, y2)) +
                            "&MaxX=" + truncate9(Math.max(x1, x2)) + 
                            "&MaxY=" + truncate9(Math.max(y1, y2)) + 
                            "&Area=" + Math.ceil(fragmentArea([[x1, y1], [x1, y2], [x2, y2], [x2, y1]])/1000000);
                }
                else
                    showErrorMessage(_gtxt("К прямоугольнику не подходит ни одного растрового слоя"), true);
			}
		
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
                layerBounds = l.getLayerBounds();
                
			if ( l.properties.type == "Raster" && l.isVisible && l.properties.mapName != baseMapName && 
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
		
		tryToFinish();
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