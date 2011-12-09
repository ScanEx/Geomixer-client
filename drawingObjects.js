/** 
* @name DrawingObjects
* @namespace SDK для редактирования объектов на карте
* @description SDK для редактирования объектов на карте
*/
(function($){

var IsAttached = false;
var AttachEvents = function(){
	if (IsAttached) return;
	window.globalFlashMap.drawing.setHandlers({
		onEdit: function(elem){
			$(elem).triggerHandler('onEdit', [elem]);
		},
		onRemove: function(elem){
			$(elem).triggerHandler('onRemove', [elem]);
		}
	});
	IsAttached = true;
}

/** Конструктор
 @class Коллекция нарисованных объектов
 @memberOf DrawingObjects */
var DrawingObjectColletection = function() {
	var _objects = [];
	var _this = this;
	
	var onEdit = function(event, drawingObject) {
		/** Вызывается при изменении объекта в коллекции
		@name DrawingObjects.DrawingObjectColletection.onEdit
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
		$(drawingObject).bind('onEdit', onEdit);
		$(drawingObject).bind('onRemove', onRemove);
		
		/** Вызывается при добавлении объекта в коллекцию
		@name DrawingObjects.DrawingObjectColletection.onAdd
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
		@name DrawingObjects.DrawingObjectColletection.onRemove
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
 @param oInitContainer Объект, в котором находится контрол (div) 
 @param drawingObject Объект для добавления на карту*/
var DrawingObjectInfoRow = function(oInitContainer, drawingObject) {
	var _drawingObject = drawingObject;
	var _this = this;
	
	var _canvas = _div(null, [['dir','className','drawingObjectsItemCanvas']]);
	var _title = _span(null, [['dir','className','drawingObjectsItemTitle']]);
	var _text = _span(null, [['dir','className','text']]);
	var _summary = _span(null, [['dir','className','summary']]);
	
	_text.onclick = _title.onclick = function()
	{
		var bounds = getBounds(_drawingObject.geometry.coordinates),
			curZ = globalFlashMap.getZ();
		
		globalFlashMap.zoomToExtent(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
		
		if (_drawingObject.geometry.type == "POINT")
			globalFlashMap.moveTo(globalFlashMap.getX(), globalFlashMap.getY(), Math.max(14, curZ));
	}
	
	var regularDrawingStyle = {
			marker: {size: 3},
			outline: { color: 0x0000ff, thickness: 3, opacity: 80 },
			fill: {color: 0xffffff}
		},
		icon = null;
	
	if (_drawingObject.geometry.type == "POINT")
	{
		icon = _img(null, [['attr','src','img/flag_min.png'], ['dir', 'className', 'colorIcon']])
	}
	else
	{
		icon = _mapHelper.createDrawingStylesEditorIcon(regularDrawingStyle, _drawingObject.geometry.type.toLowerCase());
		_mapHelper.createDrawingStylesEditor(_drawingObject, regularDrawingStyle, icon);
	}
	
	var remove = makeImageButton('img/closemin.png','img/close_orange.png')
	remove.setAttribute('title', _gtxt('Удалить'));
	remove.className = 'removeGeometry';
	remove.onclick = function(){ $(_this).triggerHandler('onRemove', [_drawingObject]); }
	
	$(_drawingObject).bind('onRemove', function() { _this.RemoveRow();});
	$(_drawingObject).bind('onEdit', function() { _this.UpdateRow();});
			
	_(_canvas, [_span([icon, _title, _text, _summary], [['dir','className','drawingObjectsItem']]), remove]);
	
	if ($.browser.msie)
	{
		icon.style.marginLeft = '2px';
		icon.style.marginRight = '9px';
	}
	
	_(oInitContainer, [_canvas])
	
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
		_canvas.parentNode.removeChild(_canvas);
	}
	
	this.UpdateRow ();
	//if (_queryDrawingObjects.downloadRasterCanvas && isRectangle(_drawingObject.geometry.coordinates))
	//	_queryDrawingObjects.downloadRasterCanvas.style.display = '';
}

/** Конструктор
 @class Строка с описанием объекта и ссылкой на него
 @param {documentElement} oInitContainer Объект, в котором находится контрол (div) 
 @param {drawingObject} drawingObject Объект для добавления на карту*/
var DrawingObjectList = function(oInitContainer, oInitDrawingObjectColletection){
	var _this = this;
	var _rows = [];
	var _containers = [];
	var _collection = oInitDrawingObjectColletection;
	var _container = oInitContainer;
	var _divList = _div(null, [['dir', 'className', 'DrawingObjectList']]);
	var _divButtons = _div();
	
	_downloadVectorForm = _form([_input(null,[['attr','name','points']]),
								 _input(null,[['attr','name','lines']]),
								 _input(null,[['attr','name','polygons']])], [['css','display','none'],['attr','method','POST'],['attr','action',"http://mapstest.kosmosnimki.ru/" + "Shapefile.ashx"]]);
	
	var checkDownloadRaster = function(){
		if (!_mapHelper.mapProperties.CanDownloadRasters) return;
		var found = false;
		for (var i=0; i< _collection.Count(); i++){
			if (isRectangle(_collection.Item(i).geometry.coordinates)) {
				show(downloadRaster);
				found = true;
				break;
			}
		}
		if(!found) hide(downloadRaster);
	}
	
	/** Добавляет объект в "список объектов на карте"
	@param {drawingObject} drawingObject добавляемый объект */
	this.Add = function(drawingObject){
		var _divRow = _div();
		_(_divList, [_divRow]);
		var _row = new DrawingObjectInfoRow(_divRow, drawingObject);
		_containers.push(_divRow);
		_rows.push(_row);
		$(_row).bind('onRemove', drawingObject.remove);
		if (_collection.Count() == 1) show(_divButtons);
		if (_mapHelper.mapProperties.CanDownloadRasters && isRectangle(drawingObject.geometry.coordinates)) show(downloadRaster);
	}
	
	/** При удалении объекта из списка
	@param {object} event событие
	@param {drawingObject} drawingObject удалённый объект*/
	var onRemove = function(event, index){
		if (_collection.Count() == 0) hide(_divButtons);
		var removedDiv = _containers.splice(index, 1)[0];
		_rows.splice(index, 1);
		removedDiv.parentNode.removeChild(removedDiv);
		checkDownloadRaster();
	}
	
	/** Очищает список пользовательских объектов*/
	this.Clear = function(){
		while (_collection.Count()>0){
			_collection.Item(0).remove();
		}
	}
	
	$(_collection).bind('onRemove', onRemove);
	$(_collection).bind('onAdd', function(event, drawingObject){ 
		_this.Add(drawingObject); 
	});
	
	var downloadVector = makeLinkButton(_gtxt("Скачать shp-файл"));
	downloadVector.onclick = function(){ 
		downloadMarkers(); 
	}
	
	var downloadRaster = makeLinkButton(_gtxt("Скачать фрагмент растра"));
	downloadRaster.onclick = function(){
		downloadRasters();
	}
	
	var delAll = makeLinkButton(_gtxt("Очистить"));
	delAll.onclick = this.Clear;
	
	_(_divButtons, [_div([downloadVector]), _div([downloadRaster, _downloadVectorForm]), _div([delAll])]);
	_( oInitContainer, [_divList, _divButtons]);
	checkDownloadRaster();
	if (_collection.Count() == 0) hide(_divButtons);
	
	/** Скачивает shp файл*/
	var downloadMarkers = function(){		
		var objectsByType = {},
			markerIdx = 1;
		
		for (var i=0; i<_collection.Count(); i++){
			var ret = _collection.Item(i);
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
		
		_downloadVectorForm.childNodes[0].value = objectsByType["POINT"] ? JSON.stringify(objectsByType["POINT"]) : '';
		_downloadVectorForm.childNodes[1].value = objectsByType["LINESTRING"] ? JSON.stringify(objectsByType["LINESTRING"]) : '';
		_downloadVectorForm.childNodes[2].value = objectsByType["POLYGON"] ? JSON.stringify(objectsByType["POLYGON"]) : '';
		
		_downloadVectorForm.submit();
	}
	
	/** Скачивает растровые слои*/
	var downloadRasters = function(){
		var obj = false,
			_this = this;
		
		for (var i=0; i<_collection.Count(); i++){
			var elem = _collection.Item(i);
			var coords = elem.geometry.coordinates[0];
			
			if ((elem.geometry.type == "POLYGON") && (coords.length == 5) && ((coords[0][0] == coords[1][0]) || (coords[0][1] == coords[1][1])))
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
			layersToTest = 0,
			tryToFinish = function()
			{
				if (layersToTest == 0)
				{
					if (layer)
					{
						window.location.href = 
								serverBase + "DownloadLayer.ashx" + 
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

		_mapHelper.forEachMyLayer(function(l)
		{
			if (l.properties.type != "Raster")
				return;
			if (!l.isVisible)
				return;
			if ((x < l.bounds.minX) || (x > l.bounds.maxX) || (y < l.bounds.minY) || (y > l.bounds.maxY))
				return;

			var coords = l.geometry.coordinates;

			if (l.geometry.type == "POLYGON" && !testPolygon(coords, x, y))
				return;
			else if (l.geometry.type == "MULTIPOLYGON")
				for (var k = 0; k < coords.length; k++)
					if (!testPolygon(coords[k], x, y))
						return;
			if (l && (!layer || (l.properties.MaxZoom > layer.properties.MaxZoom)))
				layer = l;
		});
		
		tryToFinish();
	}
}

/** Конструктор
 @class Встраивает список объектов на карте в геомиксер*/
var DrawingObjectGeomixer = function() {
	var _this = this;
	var oMenu = new leftMenu();
	var oListDiv = _div(null, [['dir', 'className', 'DrawingObjectsLeftMenu']]);
	var bVisible = false;
	
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
	
	var oCollection = new DrawingObjectColletection();
	$(oCollection).bind('onAdd', function (){
		if(!bVisible) _this.Load();
	});
	var fnAddToCollection = function(drawingObject){
		if (!nsGmx.DrawingObjectCustomControllers.isHidden(drawingObject)) oCollection.Add(drawingObject);
	}
	
	//	if (oDrawingObjectList != null)oDrawingObjectList.Clear();
	//}
	
	/** Встраивает список объектов на карте в геомиксер*/
	this.Init = function(){
		globalFlashMap.drawing.forEachObject(function(ret){
			fnAddToCollection(ret);
		});
		
		window.globalFlashMap.drawing.setHandlers({onAdd: fnAddToCollection});
		
		var oDrawingObjectList = new DrawingObjectList(oListDiv, oCollection);
		AttachEvents();
	}
}

var publicInterface = {
	AttachEvents: AttachEvents,
	DrawingObjectColletection: DrawingObjectColletection,
	DrawingObjectInfoRow: DrawingObjectInfoRow,
	DrawingObjectList: DrawingObjectList,
	DrawingObjectGeomixer: DrawingObjectGeomixer
}

gmxCore.addModule("DrawingObjects", publicInterface);

})(jQuery);

//===================================================================================================================================================================

//===================================================================================================================================================================

_translationsHash.addtext("rus", {
							"loadShape.Errors.FileTooBigException" : "Файл слишком большой. Ограничение на размер файла 1000 Кб.",
							"loadShape.Errors.ErrorUploadExeption" : "Произошла ошибка при попытке загрузить файл.",
							"loadShape.Errors.NoGeometryFile"      : "Загруженный файл не содержит геометрических данных.",
							"loadShape.Errors.ErrorUploadNoDependentFiles" : "Не найдено необходимых зависимых файлов. Запакуйте все файлы в ZIP архив и повторите загрузку.",
							"loadShape.inputTitle"                 : "Добавить shp-файл (в zip)"
						 });
						 
_translationsHash.addtext("eng", {
							"loadShape.Errors.FileTooBigException" : "Too big file. File size limit is 1000 Kb.",
							"loadShape.Errors.ErrorUploadExeption" : "Error during file uploading.",
							"loadShape.Errors.NoGeometryFile"      : "There are no geometry in uploaded file.",
							"loadShape.Errors.ErrorUploadNoDependentFiles" : "Not found the necessary dependent files. Add all files in a ZIP archive and upload it again.",
							"loadShape.inputTitle"                 : "Add shp-file (zipped)"
						 });

var drawingObjects = 
{
	loadShp: {}
}

var queryLoadShp = function()
{
	this.builded = false;
	
	this.uploader = null;
}

queryLoadShp.prototype = new leftMenu();

//просто удаляет все контролы и создаёт все их заново...
queryLoadShp.prototype._regenerateControl = function()
{
	var _this = this;
	$(this.workCanvas).empty();
	
	var fileInput = _input(null, [['attr', 'type', 'file'], ['attr', 'name', 'file'], ['attr', 'id', 'upload_shapefile']]);
	fileInput.onchange = function()
	{
		if (this.value != "")
			_this.upload();
	}
	
	//задаём одновременно и enctype и encoding для корректной работы в IE
	this.postForm = _form([fileInput], [['attr', 'method', 'POST'], ['attr', 'encoding', 'multipart/form-data'], ['attr', 'enctype', 'multipart/form-data'], ['attr', 'id', 'upload_shapefile_form']]);
	
	this.progress = _img(null,[['attr','src','img/progress.gif'],['css','display','none']])
	
	this.inputControl = _div([_span([_t(_gtxt("loadShape.inputTitle") + ":")]), this.postForm]);
	
	_(this.workCanvas, [_div([this.inputControl, this.progress], [['css','padding','10px 0px 5px 20px']])])	
}

queryLoadShp.prototype.load = function()
{
	if (!this.builded)
	{
		this._regenerateControl();
		this.builded = true;
	}
}

queryLoadShp.prototype.upload = function()
{
	hide(this.inputControl);
	show(this.progress);
	
	var _this = this;
		
	sendCrossDomainPostRequest(serverBase + "ShapeLoader.ashx", {WrapStyle: "window"}, function(response)
	{
		var errorMessages = {
				"CommonUtil.FileTooBigException" : _gtxt("loadShape.Errors.FileTooBigException"),
				"CommonUtil.ErrorUploadExeption" : _gtxt("loadShape.Errors.ErrorUploadExeption"),
				"CommonUtil.NoGeometryFile"      : _gtxt("loadShape.Errors.NoGeometryFile"),
				"CommonUtil.ErrorUploadNoDependentFiles": _gtxt("loadShape.Errors.ErrorUploadNoDependentFiles")
		};
		
		if (parseResponse(response, errorMessages))
		{
			var obj = response.Result;
			
			if (obj.length == 0)
			{
				showErrorMessage(_gtxt("Загруженный shp-файл пуст"), true);
				return;
			}
			
			var b = getBounds();
			for (var i = 0; i < obj.length; i++)
			{
				var o = obj[i];
				globalFlashMap.drawing.addObject(o.geometry, o.properties);
				b.update(o.geometry.coordinates);
			}
			globalFlashMap.zoomToExtent(b.minX, b.minY, b.maxX, b.maxY);
		}
		
        _this.inputControl.removeChild(_this.postForm);
		_this._regenerateControl();
	}, this.postForm);
}

var _queryLoadShp = new queryLoadShp();


drawingObjects.loadShp.load = function()
{
	var alreadyLoaded = _queryLoadShp.createWorkCanvas(arguments[0] || "shp");
	
	if (!alreadyLoaded)
		_queryLoadShp.load()
}

drawingObjects.loadShp.unload = function()
{
}